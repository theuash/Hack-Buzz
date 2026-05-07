# MediRef — React Native (Expo) Frontend

Secure GP Referral mobile app built with Expo + expo-router.

## Quick Start

```bash
cd frontend
.\node_modules\.bin\expo start
```

Then press:
- `a` → Android emulator
- `i` → iOS simulator
- `w` → Web browser
- Scan QR in **Expo Go** app on your phone

## Project Structure

```
frontend/
├── app/
│   ├── _layout.tsx         # Root navigator + push notification listeners
│   ├── index.tsx           # Auth gate (redirects login ↔ dashboard)
│   ├── login.tsx           # GP login screen
│   ├── dashboard.tsx       # Referral list + FAB
│   ├── referral-form.tsx   # New referral form (7 fields + specialty picker)
│   └── qr-display.tsx      # QR code + share/print
├── constants/
│   ├── config.ts           # API_BASE_URL, ENCRYPTION_SALT, APP_NAME, SPECIALTIES
│   └── colors.ts           # Full color palette
├── services/
│   ├── apiService.ts       # Axios instance + auth interceptor + API calls
│   └── notificationService.ts  # Expo push token + consultation_confirmed handler
├── utils/
│   ├── encryption.ts       # AES encrypt/decrypt via crypto-js
│   └── storage.ts          # AsyncStorage helpers (JWT, GP profile)
├── app.json
├── babel.config.js
├── package.json
└── tsconfig.json
```

## Before Running

1. Open `constants/config.ts` and set your real backend URL:
   ```ts
   export const API_BASE_URL = "https://your-backend.example.com";
   ```
2. Change `ENCRYPTION_SALT` to a strong secret (shared with backend).

## Navigation Flow

```
Login → Dashboard → ReferralForm → QRDisplay
           ↑
     (push notifications arrive here passively)
```

## Security Model

- **AES Encryption**: Clinical fields (reason, history, medications, allergies, red flags)
  are encrypted with `CryptoJS.AES` before leaving the device.
- **Key derivation**: `encryptionKey = gpId + "_" + ENCRYPTION_SALT`
- **patientPhone** is sent unencrypted (used only for WhatsApp consent flow server-side,
  never forwarded to the specialist).
- **JWT** is stored in AsyncStorage and attached to every API request via an
  Axios interceptor.

## API Endpoints Expected

| Method | Path                  | Auth | Description              |
|--------|-----------------------|------|--------------------------|
| POST   | /api/auth/login       | No   | Returns `{ token, gpId, email }` |
| GET    | /api/referral/list    | Yes  | Returns GP's referral list |
| POST   | /api/referral/create  | Yes  | Creates referral, returns `{ docId, createdAt }` |

## Push Notification Payload

When the backend sends a `consultation_confirmed` notification, the data
payload should be:

```json
{
  "type": "consultation_confirmed",
  "specialty": "Cardiology",
  "timestamp": "2024-10-15T09:30:00Z"
}
```
