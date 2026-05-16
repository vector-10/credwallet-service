import { v4 as uuidv4 } from 'uuid';
import { User, Wallet, SanitizedUser, SanitizedWallet } from '../types';

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

export const sanitizeUser = (user: User): SanitizedUser => {
  const { password_hash, bvn, bvn_hash, deleted_at, ...sanitized } = user;
  return {
    ...sanitized,
    is_active: Boolean(sanitized.is_active),
  };
};

export const sanitizeWallet = (wallet: Wallet): SanitizedWallet => ({
  ...wallet,
  is_active: Boolean(wallet.is_active),
  balance: Number(wallet.balance),
  minimum_balance: Number(wallet.minimum_balance),
});
