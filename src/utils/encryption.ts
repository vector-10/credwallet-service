import crypto from 'crypto';
import { env } from '../config/env';

const ALGORITHM = 'aes-256-cbc';
const IV_LENGTH = 16;

export const encrypt = (text: string): string => {
  const iv = crypto.randomBytes(IV_LENGTH);
  const key = Buffer.from(env.ENCRYPTION_KEY, 'hex');
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
  const encrypted = Buffer.concat([cipher.update(text, 'utf8'), cipher.final()]);
  return `${iv.toString('hex')}:${encrypted.toString('hex')}`;
};

export const decrypt = (encryptedText: string): string => {
  const [ivHex, encryptedHex] = encryptedText.split(':');
  const key = Buffer.from(env.ENCRYPTION_KEY, 'hex');
  const iv = Buffer.from(ivHex, 'hex');
  const encrypted = Buffer.from(encryptedHex, 'hex');
  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
  return Buffer.concat([decipher.update(encrypted), decipher.final()]).toString('utf8');
};
