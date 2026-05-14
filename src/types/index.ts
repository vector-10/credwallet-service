export interface User {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone_number: string;
  password_hash: string;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
  deleted_at: Date | null;
}

export interface Wallet {
  id: string;
  user_id: string;
  account_number: string;
  balance: number;
  minimum_balance: number;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface Transaction {
  id: string;
  reference: string;
  source_wallet_id: string | null;
  destination_wallet_id: string | null;
  amount: number;
  type: 'FUND' | 'TRANSFER' | 'WITHDRAWAL';
  status: 'PENDING' | 'SUCCESS' | 'FAILED';
  description: string | null;
  created_at: Date;
  updated_at: Date;
}

export interface CreateUserPayload {
  first_name: string;
  last_name: string;
  email: string;
  phone_number: string;
  password: string;
}

export interface LoginPayload {
  email: string;
  password: string;
}

export interface FundWalletPayload {
  amount: number;
}

export interface TransferPayload {
  recipient_account_number: string;
  amount: number;
  description?: string;
}

export interface WithdrawPayload {
  amount: number;
  description?: string;
}

export interface ApiResponse<T = null> {
  success: boolean;
  message: string;
  data?: T;
}

export interface LedgerEntry {
  id: string;
  wallet_id: string | null;
  transaction_id: string;
  entry_type: 'DEBIT' | 'CREDIT';
  amount: number;
  balance_before: number | null;
  balance_after: number | null;
  created_at: Date;
}

export interface AuthTokenPayload {
  userId: string;
  email: string;
}

export type SanitizedUser = Omit<User, 'password_hash' | 'deleted_at'>;
export type SanitizedWallet = Omit<Wallet, never>;
