# 🏥 MediRef — Zero-Knowledge Secure Medical Referral Platform

> **Built for Hack-Buzz Hackathon** · Problem Statement: Broken Handoff in Clinical Care

---

## 💡 The Idea

The handoff between a **General Practitioner (GP)** and a **Specialist** is one of the most error-prone moments in a patient's care journey. Referrals get lost, patient records are faxed unsecurely, and specialists receive incomplete information.

**MediRef** solves this with a **Zero-Knowledge encrypted referral system**. A GP fills in a patient's clinical details on a secure dashboard. The data is **AES-256 encrypted on the client side** and stored on the server as an opaque, unreadable blob. A unique **QR code** is generated containing the URL *and* the decryption key embedded in the URL fragment (hash) — meaning **the key never touches the server**.

The specialist simply scans the QR code to instantly view the full, decrypted referral on their device. No logins, no faxes, no leaked records.

Additionally, GPs can order **blood/pathology tests** with the same zero-knowledge flow, sending encrypted test orders directly to labs.

---

## ✨ Key Features

- 🔐 **Zero-Knowledge Encryption** — AES-256 client-side encryption; the server never sees plain-text clinical data
- 📱 **QR-Based Referral Handoff** — Secure QR pass auto-sent to patient's WhatsApp via Puppeteer automation
- 🩺 **GP Dashboard** — Create referrals, order blood tests, manage patients, and track specialist responses
- 🧪 **Blood Test Ordering** — Select from a curated test panel with animated, premium UI
- 💬 **WhatsApp Integration** — Automated QR pass delivery to patient's phone number via `whatsapp-web.js`
- 🖨️ **Print Secure Pass** — Pre-fetched, base64-embedded QR code ready for high-quality printing
- 🌐 **Cross-Platform** — Runs on Web (browser) and native iOS/Android via Expo

---

## 🛠️ Tech Stack

### Frontend
| Technology | Purpose |
|---|---|
| **React Native + Expo** | Cross-platform app (Web, iOS, Android) |
| **Expo Router** | File-based navigation |
| **TypeScript** | Type-safe codebase |
| **React Native Reanimated** | High-performance 60fps animations |
| **react-native-qrcode-svg** | QR code generation on device |
| **crypto-js / SubtleCrypto** | AES-256-GCM client-side encryption |
| **Axios** | HTTP client for API calls |
| **AsyncStorage** | Persistent local storage (mobile) |
| **expo-linear-gradient** | Premium UI gradient effects |
| **expo-sensors** | Parallax / gyroscope effects |

### Backend
| Technology | Purpose |
|---|---|
| **Node.js + Express** | REST API server |
| **MongoDB + Mongoose** | Encrypted blob storage |
| **whatsapp-web.js** | Automated WhatsApp QR delivery via Puppeteer |
| **JWT + bcryptjs** | Authentication & session management |
| **Helmet** | HTTP security headers |
| **dotenv** | Environment variable management |
| **uuid** | Unique referral document IDs |

---

## 🔒 Security Architecture

```
GP Device                    Server                    Specialist Device
────────────────────────────────────────────────────────────────────────
1. Fill referral form
2. Generate random unlockKey
3. Encrypt data with AES-256  →  Store opaque blob only
4. Build URL: /ref/{docId}#{unlockKey}
5. Generate QR code                                   6. Scan QR code
                                                      7. Extract unlockKey from URL hash
                                                      8. Fetch encrypted blob
                                                      9. Decrypt locally → view referral
```
> The `#fragment` of the URL is never sent to the server by the browser. The key is truly zero-knowledge.

---

## 🚀 Getting Started

### Prerequisites
- Node.js ≥ 18
- MongoDB instance (local or Atlas)
- Expo CLI (`npm install -g expo-cli`)

### 1. Clone the repo
```bash
git clone https://github.com/theuash/Hack-Buzz.git
cd Hack-Buzz
```

### 2. Start the Backend
```bash
cd backend
cp .env.example .env   # Fill in MONGO_URI, JWT_SECRET, PORT
npm install
npm run dev
```

### 3. Start the Frontend
```bash
cd frontend
npm install
npx expo start --web
```

### 4. Set your API URL
In `frontend/src/constants/config.ts`, set:
```ts
export const API_BASE_URL = 'http://localhost:5000';
```

---

## 📁 Project Structure

```
Hack-Buzz/
├── backend/
│   ├── models/          # Mongoose schemas (Referral, GP)
│   ├── routes/          # Express API routes
│   ├── middleware/       # Auth middleware
│   ├── whatsapp.js      # WhatsApp automation (Puppeteer)
│   └── server.js        # Entry point
│
└── frontend/
    ├── app/
    │   ├── index.tsx        # Landing page
    │   ├── dashboard.tsx    # GP Dashboard
    │   ├── create-referral.tsx  # Referral + blood test form
    │   └── qr-display.tsx   # Secure QR pass screen
    └── src/
        ├── components/      # Shared UI (GlassCard, AnimatedBg...)
        └── constants/       # Config, theme colours
```

---

## 👨‍💻 Team

Built with ❤️ for **Hack-Buzz Hackathon** · Problem Statement: *The Broken Handoff*
