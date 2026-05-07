// ─── App Configuration ───────────────────────────────────────────────────────
// Replace with your actual backend URL before deploying
export const API_BASE_URL = "https://api.mediref.example.com";

// AES encryption salt — keep secret, never expose in client logs
export const ENCRYPTION_SALT = "MediRef_AES_Salt_2024_Secure";

// App display name — single source of truth
export const APP_NAME = "MediRef";

// Specialty options for the referral form
export const SPECIALTIES = [
  "Cardiology",
  "Neurology",
  "Orthopedics",
  "Dermatology",
  "ENT",
  "Ophthalmology",
  "Gynecology",
  "Psychiatry",
  "Other",
] as const;

export type Specialty = (typeof SPECIALTIES)[number];
