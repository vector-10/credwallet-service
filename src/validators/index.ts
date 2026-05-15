import { z } from 'zod';

export const registerSchema = z.object({
  first_name: z.string().min(2, 'First name must be at least 2 characters'),
  last_name: z.string().min(2, 'Last name must be at least 2 characters'),
  email: z.email('Invalid email address'),
  phone_number: z.string().min(10, 'Invalid phone number').max(15, 'Invalid phone number'),
  bvn: z.string().regex(/^\d{11}$/, 'BVN must be exactly 11 digits'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
});

export const loginSchema = z.object({
  email: z.email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

const amountSchema = z
  .number()
  .min(0.01, 'Amount must be at least 0.01')
  .refine(v => Math.round(v * 100) / 100 === v, 'Amount must have at most 2 decimal places');

export const fundWalletSchema = z.object({
  amount: amountSchema,
});

export const transferSchema = z.object({
  recipient_account_number: z.string().length(10, 'Invalid account number'),
  amount: amountSchema,
  description: z.string().optional(),
});

export const withdrawSchema = z.object({
  amount: amountSchema,
  description: z.string().optional(),
});

export const paginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});
