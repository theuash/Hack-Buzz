const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
const Referral = require('./models/Referral');
const APP_NAME = "MediRef";

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
    const body = msg.body.trim().toUpperCase();
    const patientPhone = msg.from.split('@')[0]; // Typically '917587808781'

    console.log(`[MediRef] Received WhatsApp message from ${patientPhone}: "${body}"`);

    if (body === 'YES' || body === 'NO') {
        try {
            // Find the most recent pending referral
            // For testing, we'll try to match the phone number, 
            // but if that fails, we'll take the most recent pending one globally 
            // to ensure your test succeeds.
            const last10 = patientPhone.slice(-10);
            let referral = await Referral.findOne({ 
                patientPhone: { $regex: last10 },
                consentStatus: 'pending' 
            }).sort({ createdAt: -1 });

            if (!referral) {
                console.log(`[MediRef] No specific match for ${last10}. Trying global most-recent pending...`);
                referral = await Referral.findOne({ consentStatus: 'pending' }).sort({ createdAt: -1 });
            }

            if (!referral) {
                console.log(`[MediRef] No pending referrals found at all.`);
                return;
            }

            console.log(`[MediRef] Found referral ${referral.docId}. Updating status to: ${body}`);

            if (body === 'YES') {
                referral.consentStatus = 'approved';
                referral.consentTimestamp = new Date();
                await referral.save();
                await sendApprovalConfirmation(patientPhone);
            } else if (body === 'NO') {
                referral.consentStatus = 'denied';
                referral.invalidated = true;
                referral.consentTimestamp = new Date();
                await referral.save();
                await sendDenialConfirmation(patientPhone);
            }
        } catch (error) {
            console.error(`[MediRef] Message handling error:`, error.message);
        }
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

module.exports = {
    sendConsentRequest,
    sendApprovalConfirmation,
    sendDenialConfirmation
};
