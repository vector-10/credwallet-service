import { v4 as uuidv4 } from 'uuid';
import db from '../config/database';
import { Transaction } from '../types';

export class TransactionRepository {
  async create(
    payload: Omit<Transaction, 'id' | 'created_at' | 'updated_at'>,
    trx?: any
  ): Promise<Transaction> {
    const id = uuidv4();
    const query = trx ? trx('transactions') : db('transactions');
    await query.insert({
      id,
      ...payload,
      created_at: new Date(),
      updated_at: new Date(),
    });
    return db('transactions').where({ id }).first();
  }

  async findByReference(reference: string): Promise<Transaction | null> {
    return db('transactions').where({ reference }).first() ?? null;
  }

  async findByWalletId(wallet_id: string): Promise<Transaction[]> {
    return db('transactions')
      .where('source_wallet_id', wallet_id)
      .orWhere('destination_wallet_id', wallet_id)
      .orderBy('created_at', 'desc');
  }
}
