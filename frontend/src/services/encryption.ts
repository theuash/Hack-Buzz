import CryptoJS from 'crypto-js';

const generateRandomKey = (length = 16) => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
};

export const encryptClinicalFields = (fields: any) => {
  const unlockKey = generateRandomKey();
  const cipherText = CryptoJS.AES.encrypt(JSON.stringify(fields), unlockKey).toString();
  return { cipherText, unlockKey };
};
