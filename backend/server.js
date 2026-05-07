/**
 * Zero-Knowledge Medical Referral System — Backend API
 *
 * PRIVACY RULE: The `encryptedData` field is treated as an opaque,
 * sealed base64 string. It is NEVER decrypted, read, inspected, or
 * logged by this server under any circumstance.
 *
 * Storage schema (exactly 3 fields, nothing else):
 *   { id, encryptedData, createdAt }
 */

const express = require('express');
require('dotenv').config();
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const crypto = require('crypto');
const path = require('path');

// ── lowdb v1 (CommonJS) setup ──────────────────────────────────────
const low = require('lowdb');
const FileSync = require('lowdb/adapters/FileSync');

const DB_PATH = path.join(__dirname, 'db.json');
const adapter = new FileSync(DB_PATH);
const db = low(adapter);

// Initialise db with empty referrals array if first run
db.defaults({ referrals: [] }).write();

// ── Express app ────────────────────────────────────────────────────
const app = express();
const PORT = process.env.PORT || 3000;
const TTL_MS = 86_400_000; // 24 hours in milliseconds

// Middleware
app.use(cors());                       // allow all origins (dev: 5173 & 3000)
app.use(express.json());               // parse JSON bodies

// Ensure every response is JSON
app.use((_req, res, next) => {
  res.setHeader('Content-Type', 'application/json');
  next();
});

// ── Rate limiter (POST /api/referral only) ─────────────────────────
const createReferralLimiter = rateLimit({
  windowMs: 60 * 1000,   // 1 minute
  max: 10,               // 10 requests per IP per minute
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests, please try again later' },
});

// ── Helpers ────────────────────────────────────────────────────────

/** Generate a random 8-character alphanumeric ID */
function generateId() {
  return crypto.randomBytes(6).toString('base64url').slice(0, 8);
}

/** Check whether a referral record has expired */
function isExpired(record) {
  return Date.now() - record.createdAt > TTL_MS;
}

// ── Routes ─────────────────────────────────────────────────────────

/**
 * GET /
 * Health check / API info
 */
app.get('/', (_req, res) => {
  res.status(200).json({
    status: 'online',
    message: 'ZK Medical Referral API',
    version: '1.0.0'
  });
});

/**
 * POST /api/referral
 * Body: { encryptedData: string }
 * → 400 if missing/empty
 * → 200 { id }
 */
app.post('/api/referral', createReferralLimiter, (req, res) => {
  const { encryptedData } = req.body;

  if (!encryptedData || typeof encryptedData !== 'string' || encryptedData.trim() === '') {
    return res.status(400).json({ error: 'encryptedData is required' });
  }

  const id = generateId();
  const createdAt = Date.now();

  // Store exactly 3 fields — no extras
  db.get('referrals')
    .push({ id, encryptedData, createdAt })
    .write();

  // Gate any debug output behind DEBUG env flag
  if (process.env.DEBUG === 'true') {
    console.log(`[DEBUG] Created referral id=${id}`);
    // NOTE: We intentionally do NOT log encryptedData content
  }

  return res.status(200).json({ id });
});

/**
 * GET /api/referral/:id
 * → 404 if not found
 * → 410 if expired (deletes record)
 * → 200 { encryptedData }
 */
app.get('/api/referral/:id', (req, res) => {
  const { id } = req.params;

  const record = db.get('referrals').find({ id }).value();

  if (!record) {
    return res.status(404).json({ error: 'Not found' });
  }

  // Lazy TTL cleanup: if expired, remove and return 410
  if (isExpired(record)) {
    db.get('referrals').remove({ id }).write();
    return res.status(410).json({ error: 'Expired' });
  }

  // Return the sealed blob — never inspect it
  return res.status(200).json({ encryptedData: record.encryptedData });
});

/**
 * GET /api/stats
 * → 200 { totalReferrals, activeReferrals, expiredReferrals }
 * Zero PII in this response.
 */
app.get('/api/stats', (_req, res) => {
  const all = db.get('referrals').value();
  const now = Date.now();

  let activeReferrals = 0;
  let expiredReferrals = 0;

  for (const record of all) {
    if (now - record.createdAt > TTL_MS) {
      expiredReferrals++;
    } else {
      activeReferrals++;
    }
  }

  return res.status(200).json({
    totalReferrals: all.length,
    activeReferrals,
    expiredReferrals,
  });
});

// ── Start ──────────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`ZK Referral backend listening on http://localhost:${PORT}`);
});

module.exports = app; // for testing if needed
