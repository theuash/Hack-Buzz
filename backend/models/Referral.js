const mongoose = require('mongoose');

const referralSchema = new mongoose.Schema({
  docId: { type: String, unique: true, required: true },
  gpId: { type: String, required: true },
  patientPhone: { type: String, required: true },
  encryptedPayload: { type: String, required: true },
  specialty: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
  consentStatus: { 
    type: String, 
    enum: ['pending', 'approved', 'denied'], 
    default: 'pending' 
  },
  consentTimestamp: { type: Date },
  viewedAt: { type: Date },
  invalidated: { type: Boolean, default: false },
  workflowState: { 
    type: String, 
    enum: ['awaiting_consent', 'awaiting_meeting_check', 'completed'], 
    default: 'awaiting_consent' 
  },
  reason: { type: String },
  history: { type: String },
  medications: { type: String },
  allergies: { type: String },
  urgency: { type: String },
});

module.exports = mongoose.model('Referral', referralSchema);
