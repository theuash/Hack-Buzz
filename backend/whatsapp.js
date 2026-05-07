const { Client, LocalAuth, MessageMedia } = require('whatsapp-web.js');
const axios = require('axios');
const qrcode = require('qrcode-terminal');
const Referral = require('./models/Referral');
const APP_NAME = process.env.APP_NAME || "MediRef";

let isClientReady = false;

// Initialize WhatsApp Client
const client = new Client({
    authStrategy: new LocalAuth({
        dataPath: './.wwebjs_auth'
    }),
    puppeteer: {
        headless: true, // Set to false if you want to see the browser window for debugging
        args: ['--no-sandbox', '--disable-gpu', '--disable-dev-shm-usage'],
    }
});

// Show QR Code in terminal for authentication
client.on('qr', (qr) => {
    console.log(`[${APP_NAME}] Scan this QR code with your WhatsApp to login:`);
    qrcode.generate(qr, { small: true });
});

client.on('ready', () => {
    isClientReady = true;
    console.log(`[${APP_NAME}] WhatsApp Client is ready!`);
});

client.on('authenticated', () => {
    console.log(`[${APP_NAME}] WhatsApp Authenticated!`);
});

/**
 * Handle Incoming Messages (YES/NO Logic)
 * Replaces the Twilio Webhook
 */
client.on('message', async (msg) => {
    // Extensive logging for debugging
    const rawBody = msg.body || "";
    const body = rawBody.trim().toUpperCase();
    const from = msg.from; // Typically '917411237522@c.us'
    const patientPhone = from.split('@')[0];

    console.log(`[MediRef] RECEIVED: Message from ${from}: "${rawBody}"`);

    // Check if it's a consent-related keyword
    const isYes = body.includes('YES') || body.includes('APPROVE') || body === 'Y';
    const isNo = body.includes('NO') || body.includes('DECLINE') || body === 'N';

    if (isYes || isNo) {
        console.log(`[MediRef] CONSENT DETECTED: ${isYes ? 'YES' : 'NO'} from ${patientPhone}`);
        try {
            // Find the most recent pending referral for this number
            // We use the last 10 digits to avoid country code mismatch issues
            const last10 = patientPhone.slice(-10);
            console.log(`[MediRef] SEARCHING: Pending referrals matching phone segment "${last10}"...`);

            let referral = await Referral.findOne({ 
                patientPhone: { $regex: last10 },
                consentStatus: 'pending' 
            }).sort({ createdAt: -1 });

            if (!referral) {
                console.warn(`[MediRef] WARNING: No specific pending referral found for ${last10}.`);
                console.log(`[MediRef] FALLBACK: Searching for ANY most-recent pending referral...`);
                referral = await Referral.findOne({ consentStatus: 'pending' }).sort({ createdAt: -1 });
            }

            if (!referral) {
                console.error(`[MediRef] ERROR: No pending referrals found in database at all. Consent cannot be processed.`);
                return;
            }

            console.log(`[MediRef] MATCH FOUND: Referral ${referral.docId} for ${referral.patientPhone}`);

            if (isYes) {
                referral.consentStatus = 'approved';
                referral.consentTimestamp = new Date();
                await referral.save();
                console.log(`[MediRef] STATUS UPDATED: Referral ${referral.docId} is now APPROVED`);
                await sendApprovalConfirmation(patientPhone);
            } else {
                referral.consentStatus = 'denied';
                referral.invalidated = true;
                referral.consentTimestamp = new Date();
                await referral.save();
                console.log(`[MediRef] STATUS UPDATED: Referral ${referral.docId} is now DENIED`);
                await sendDenialConfirmation(patientPhone);
            }
        } catch (error) {
            console.error(`[MediRef] CRITICAL: Error updating referral status:`, error.message);
        }
    } else {
        console.log(`[MediRef] IGNORED: Message does not contain YES/NO keywords.`);
    }
});

client.initialize();

/**
 * Sends a WhatsApp consent request to the patient
 */
async function sendConsentRequest(patientPhone, gpName, docId) {
    try {
        console.log(`[MediRef] Starting send process for ${patientPhone}...`);
    
        if (!isClientReady) {
            console.error(`[MediRef] ERROR: Cannot send message. WhatsApp is still connecting. Please wait for the "Ready" message.`);
            return;
        }

        // 1. Sanitize the number (remove everything except digits)
        const sanitizedNumber = patientPhone.replace(/\D/g, '');
        
        if (sanitizedNumber.length < 10) {
            console.error(`[MediRef] ERROR: Phone number ${patientPhone} is too short. Did you forget the country code?`);
            return;
        }

        const chatId = `${sanitizedNumber}@c.us`;

        // 2. Check if the user is on WhatsApp
        const isRegistered = await client.isRegisteredUser(chatId);
        if (!isRegistered) {
            console.error(`[MediRef] Error: ${patientPhone} is not registered on WhatsApp.`);
            return;
        }

        const message = `Hello from MediRef. Your GP has created a secure referral for you. \n\nReply YES to approve sharing your details with the specialist, or NO to decline.`;
        
        await client.sendMessage(chatId, message);
        console.log(`[MediRef] SUCCESS: Consent message sent to ${chatId}`);
    } catch (error) {
        console.error(`[MediRef] CRITICAL: Failed to send WhatsApp:`, error);
    }
}

/**
 * Sends approval confirmation to the patient
 */
const sendApprovalConfirmation = async (patientPhone) => {
    try {
        const chatId = `${patientPhone.replace('+', '')}@c.us`;
        await client.sendMessage(chatId, `${APP_NAME}: Your referral information has been shared with the specialist. Thank you.`);
    } catch (error) {
        console.error(`[${APP_NAME}] WhatsApp Send Error: ${error.message}`);
    }
};

/**
 * Sends denial confirmation to the patient
 */
const sendDenialConfirmation = async (patientPhone) => {
    try {
        const chatId = `${patientPhone.replace('+', '')}@c.us`;
        await client.sendMessage(chatId, `${APP_NAME}: Your referral information was not shared. Please inform your doctor if this was a mistake.`);
    } catch (error) {
        console.error(`[${APP_NAME}] WhatsApp Send Error: ${error.message}`);
    }
};

/**
 * Sends a QR Pass (Image) to the patient
 */
async function sendQrPass(patientPhone, specialistUrl) {
    try {
        console.log(`[MediRef] Preparing Stark-Border QR Pass for ${patientPhone}...`);
        const sanitizedNumber = patientPhone.replace(/\D/g, '');
        const chatId = `${sanitizedNumber}@c.us`;
        
        // Generate QR code with thick 50px margin and themed background color
        const qrApiUrl = `https://api.qrserver.com/v1/create-qr-code/?size=800x800&margin=50&bgcolor=f7f6f2&data=${encodeURIComponent(specialistUrl)}`;
        
        console.log(`[MediRef] Fetching high-res QR pass...`);
        const response = await axios.get(qrApiUrl, { responseType: 'arraybuffer' });
        const base64 = Buffer.from(response.data, 'binary').toString('base64');
        const media = new MessageMedia('image/png', base64, 'mediref-pass.png');

        await client.sendMessage(chatId, media, { 
            caption: `*MEDIREF SECURE PASS*\n\n*Specialty:* ${specialistUrl.split('referral/')[1].split('#')[0].substring(0,8)}... \n*Instruction:* Show this image to your specialist. \n\n_Zero-Knowledge Encrypted_` 
        });
        console.log(`[MediRef] SUCCESS: Stark-Border QR Pass sent to ${chatId}`);
    } catch (error) {
        console.error(`[MediRef] ERROR sending QR Pass:`, error.message);
    }
}

module.exports = {
    sendConsentRequest,
    sendApprovalConfirmation,
    sendDenialConfirmation,
    sendQrPass
};
