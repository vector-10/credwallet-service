import { v4 as uuidv4 } from 'uuid';

export const generateAccountNumber = (): string => {
  const prefix = '9';
  const randomDigits = Math.floor(Math.random() * 1_000_000_000)
    .toString()
    .padStart(9, '0');
  return `${prefix}${randomDigits}`;
};


export const generateTransactionReference = (): string => {
  return `TXN-${uuidv4().replace(/-/g, '').toUpperCase().slice(0, 16)}`;
};

export const sanitizeUser = (user: any) => {
  const { password_hash, deleted_at, ...sanitized } = user;
  return sanitized;
};
