import CryptoJS from 'crypto-js';
import { SALT } from '../constants/config';

export const encryptClinicalFields = (fields: any, gpId: string) => {
  const encryptionKey = `${gpId}_${SALT}`;
  const cipherText = CryptoJS.AES.encrypt(JSON.stringify(fields), encryptionKey).toString();
  return cipherText;
};
