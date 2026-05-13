import db from '../config/database';
import { Transaction } from '../types';

export const TransactionRepository = {
  async create(
    payload: Omit<Transaction, 'id' | 'created_at' | 'updated_at'>,
    trx?: any
  ): Promise<Transaction> {
    const query = trx ? trx('transactions') : db('transactions');
    const [id] = await query.insert({
      ...payload,
      created_at: new Date(),
      updated_at: new Date(),
    });
    return db('transactions').where({ id }).first();
  },

  async findByReference(reference: string): Promise<Transaction | null> {
    return db('transactions').where({ reference }).first() ?? null;
  },

  async findByWalletId(wallet_id: number): Promise<Transaction[]> {
    return db('transactions')
      .where('source_wallet_id', wallet_id)
      .orWhere('destination_wallet_id', wallet_id)
      .orderBy('created_at', 'desc');
  },
};
