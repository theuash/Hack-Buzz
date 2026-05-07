# ZK Medical Referral System — Backend

Zero-Knowledge Medical Referral backend API. Stores encrypted referral blobs with a 24-hour TTL. The server **never** decrypts, reads, or logs the `encryptedData` field.

## Quick Start

```bash
npm install
npm start
# Server runs on http://localhost:3000
```

## API Contract

| Endpoint              | Method | Success | Error Codes |
| --------------------- | ------ | ------- | ----------- |
| `/api/referral`       | POST   | 200     | 400, 429    |
| `/api/referral/:id`   | GET    | 200     | 404, 410    |
| `/api/stats`          | GET    | 200     | —           |

### POST /api/referral
- **Body:** `{ "encryptedData": "<base64 string>" }`
- **Response:** `{ "id": "<8-char alphanumeric>" }`
- **Rate limit:** 10 req/min per IP

### GET /api/referral/:id
- Returns `{ "encryptedData": "..." }` if found & valid
- Returns `410 { "error": "Expired" }` if older than 24 hours (record is deleted)
- Returns `404 { "error": "Not found" }` if ID doesn't exist

### GET /api/stats
- Returns `{ "totalReferrals", "activeReferrals", "expiredReferrals" }`
- Zero PII — only counts

---

## Standalone Backend Tests

Run these 5 curl commands to verify the backend is working correctly.

### Test 1 — Create a referral
```bash
curl -X POST http://localhost:3000/api/referral \
  -H "Content-Type: application/json" \
  -d '{"encryptedData":"dGVzdA=="}'
```
**Expected:** `200 OK`
```json
{"id":"<8-char-id>"}
```

### Test 2 — Retrieve it (use the id from Test 1)
```bash
curl http://localhost:3000/api/referral/<id-from-test-1>
```
**Expected:** `200 OK`
```json
{"encryptedData":"dGVzdA=="}
```

### Test 3 — Stats (no PII)
```bash
curl http://localhost:3000/api/stats
```
**Expected:** `200 OK`
```json
{"totalReferrals":1,"activeReferrals":1,"expiredReferrals":0}
```

### Test 4 — Wrong ID returns 404
```bash
curl -i http://localhost:3000/api/referral/xxxxxxxx
```
**Expected:** `404 Not Found`
```json
{"error":"Not found"}
```

### Test 5 — Missing body returns 400
```bash
curl -X POST http://localhost:3000/api/referral \
  -H "Content-Type: application/json" \
  -d '{}'
```
**Expected:** `400 Bad Request`
```json
{"error":"encryptedData is required"}
```

---

## Schema (Exactly 3 Fields)

```json
{
  "id": "ab3x9kz1",
  "encryptedData": "base64...",
  "createdAt": 1716000000000
}
```

No patient names. No medical fields. No metadata. Nothing else. Ever.

## Integration Notes

- CORS is enabled for all origins (frontend ports 5173 / 3000)
- All responses are `Content-Type: application/json`
- Response fields are **camelCase** (`encryptedData`, not `encrypted_data`)
- Expired referrals return **HTTP 410**, not 404
- Data persists across restarts via `db.json`
- Debug logging (never includes encryptedData content) gated behind `DEBUG=true`
