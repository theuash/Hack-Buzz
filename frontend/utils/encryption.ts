import CryptoJS from "crypto-js";
import { ENCRYPTION_SALT } from "../constants/config";

/**
 * Derives the AES encryption key for a given GP.
 * Key = gpId + "_" + SALT (never sent over the network)
 */
export function deriveEncryptionKey(gpId: string): string {
  return `${gpId}_${ENCRYPTION_SALT}`;
}

/**
 * Encrypts clinical fields as a JSON string using AES.
 * patientPhone is intentionally excluded from the payload.
 */
export function encryptClinicalFields(
  clinicalFields: Record<string, string>,
  gpId: string
): string {
  const key = deriveEncryptionKey(gpId);
  const plaintext = JSON.stringify(clinicalFields);
  const encrypted = CryptoJS.AES.encrypt(plaintext, key);
  return encrypted.toString();
}

/**
 * Decrypts an AES-encrypted payload (for local preview only, never sent to network).
 */
export function decryptClinicalFields(
  encryptedPayload: string,
  gpId: string
): Record<string, string> | null {
  try {
    const key = deriveEncryptionKey(gpId);
    const bytes = CryptoJS.AES.decrypt(encryptedPayload, key);
    const plaintext = bytes.toString(CryptoJS.enc.Utf8);
    return JSON.parse(plaintext);
  } catch {
    return null;
  }
}
