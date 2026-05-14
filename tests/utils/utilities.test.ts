import {
  generateAccountNumber,
  generateTransactionReference,
  sanitizeUser,
  sanitizeWallet,
} from '../../src/utils/helpers';
import { User, Wallet } from '../../src/types';

const mockUser: User = {
  id: 'user-uuid-1',
  first_name: 'Test',
  last_name: 'User',
  email: 'test@example.com',
  phone_number: '08000000001',
  password_hash: 'hashed_password',
  is_active: true,
  created_at: new Date(),
  updated_at: new Date(),
  deleted_at: null,
};

const mockWallet: Wallet = {
  id: 'wallet-uuid-1',
  user_id: 'user-uuid-1',
  account_number: '9100000001',
  balance: 5000,
  minimum_balance: 100,
  is_active: true,
  created_at: new Date(),
  updated_at: new Date(),
};

describe('generateAccountNumber', () => {
  it('should return a 10-digit string starting with 9', () => {
    const accountNumber = generateAccountNumber();
    expect(accountNumber).toHaveLength(10);
    expect(accountNumber.startsWith('9')).toBe(true);
  });

  it('should generate unique account numbers on each call', () => {
    const first = generateAccountNumber();
    const second = generateAccountNumber();
    expect(first).not.toBe(second);
  });
});

describe('generateTransactionReference', () => {
  it('should return a reference starting with TXN-', () => {
    const ref = generateTransactionReference();
    expect(ref.startsWith('TXN-')).toBe(true);
  });

  it('should generate unique references on each call', () => {
    const first = generateTransactionReference();
    const second = generateTransactionReference();
    expect(first).not.toBe(second);
  });
});

describe('sanitizeUser', () => {
  it('should remove password_hash from the returned object', () => {
    const result = sanitizeUser(mockUser);
    expect(result).not.toHaveProperty('password_hash');
  });

  it('should remove deleted_at from the returned object', () => {
    const result = sanitizeUser(mockUser);
    expect(result).not.toHaveProperty('deleted_at');
  });

  it('should cast is_active to a boolean', () => {
    const result = sanitizeUser({ ...mockUser, is_active: 1 as any });
    expect(typeof result.is_active).toBe('boolean');
    expect(result.is_active).toBe(true);
  });
});

describe('sanitizeWallet', () => {
  it('should cast balance to a number', () => {
    const result = sanitizeWallet({ ...mockWallet, balance: '5000.00' as any });
    expect(typeof result.balance).toBe('number');
    expect(result.balance).toBe(5000);
  });

  it('should cast minimum_balance to a number', () => {
    const result = sanitizeWallet({ ...mockWallet, minimum_balance: '100.00' as any });
    expect(typeof result.minimum_balance).toBe('number');
    expect(result.minimum_balance).toBe(100);
  });

  it('should cast is_active to a boolean', () => {
    const result = sanitizeWallet({ ...mockWallet, is_active: 1 as any });
    expect(typeof result.is_active).toBe('boolean');
    expect(result.is_active).toBe(true);
  });
});
