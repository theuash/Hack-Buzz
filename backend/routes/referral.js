const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const Referral = require('../models/Referral');
const { sendConsentRequest } = require('../whatsapp');

// @route   POST /api/referral/create
// @desc    Create a new referral and return docId
router.post('/create', async (req, res) => {
  const { encryptedPayload, patientPhone, specialty, gpId } = req.body;

  try {
    const docId = uuidv4();
    const referral = await Referral.create({
      docId,
      gpId: gpId || '60d6cbbc31e14fcfb3a13943',
      patientPhone,
      encryptedPayload,
      specialty
    });

    res.status(201).json({ docId: referral.docId });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @route   GET /api/referral/list
// @desc    Get all referrals for a GP
router.get('/list', async (req, res) => {
  try {
    // Since we removed protect, we'll return all or filter by a query param
    const referrals = await Referral.find()
      .sort({ createdAt: -1 })
      .select('-encryptedPayload'); // Don't send encrypted blobs in list
    
    // Mask patient phone for GP view
    const maskedReferrals = referrals.map(ref => ({
      ...ref._doc,
      patientPhone: ref.patientPhone.replace(/(\d{3})\d+(\d{4})/, '$1******$2')
    }));

    res.json(maskedReferrals);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @route   GET /api/referral/:docId/status
// @desc    Check consent status (Public)
router.get('/:docId/status', async (req, res) => {
  try {
    const referral = await Referral.findOne({ docId: req.params.docId })
      .select('consentStatus viewedAt invalidated specialty createdAt');
    
    if (!referral) return res.status(404).json({ message: 'Referral not found' });
    
    res.json(referral);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @route   POST /api/referral/:docId/trigger
// @desc    Trigger WhatsApp consent message from specialist view (Public)
router.post('/:docId/trigger', async (req, res) => {
  try {
    const referral = await Referral.findOne({ docId: req.params.docId }).populate('gpId', 'name');
    if (!referral) return res.status(404).json({ message: 'Referral not found' });

    // Only send if still pending
    if (referral.consentStatus === 'pending') {
      console.log(`[MediRef] Route: Calling sendConsentRequest for ${referral.patientPhone}...`);
      try {
        await sendConsentRequest(referral.patientPhone, 'Your GP', referral.docId);
        console.log(`[MediRef] Route: sendConsentRequest call completed.`);
      } catch (err) {
        console.error(`[MediRef] Route: Error during sendConsentRequest call:`, err.message);
      }
    }

    res.json({ message: 'Consent request triggered' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @route   GET /api/referral/:docId/data
// @desc    Get encrypted referral data if approved (Public)
router.get('/:docId/data', async (req, res) => {
  try {
    const referral = await Referral.findOne({ docId: req.params.docId });
    
    if (!referral) return res.status(404).json({ message: 'Referral not found' });
    
    if (referral.consentStatus !== 'approved' || referral.invalidated) {
      return res.status(403).json({ message: 'Access Denied. Patient consent required.' });
    }

    // Mark as viewed
    if (!referral.viewedAt) {
      referral.viewedAt = new Date();
      await referral.save();
    }

    res.json({
      encryptedPayload: referral.encryptedPayload,
      specialty: referral.specialty,
      gpId: referral.gpId
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @route   POST /api/referral/:docId/send-pass
// @desc    Send QR Pass Image to patient (Public but needs docId)
router.post('/:docId/send-pass', async (req, res) => {
  const { specialistUrl } = req.body;
  const { sendQrPass } = require('../whatsapp');
  
  try {
    const referral = await Referral.findOne({ docId: req.params.docId });
    if (!referral) return res.status(404).json({ message: 'Referral not found' });

    await sendQrPass(referral.patientPhone, specialistUrl);
    res.json({ message: 'QR Pass sent to WhatsApp' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
