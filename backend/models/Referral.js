const mongoose = require('mongoose');

const referralSchema = new mongoose.Schema({
  docId: { type: String, unique: true, required: true },
  gpId: { type: mongoose.Schema.Types.ObjectId, ref: 'GP', required: true },
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
});

module.exports = mongoose.model('Referral', referralSchema);
