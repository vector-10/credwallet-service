import { v4 as uuidv4 } from 'uuid';
import db from '../config/database';
import { Transaction } from '../types';

export class TransactionRepository {
  async create(
    payload: Omit<Transaction, 'id' | 'created_at' | 'updated_at'>,
    trx: any
  ): Promise<Transaction> {
    const id = uuidv4();
    await trx('transactions').insert({
      id,
      ...payload,
      created_at: new Date(),
      updated_at: new Date(),
    });
    return trx('transactions').where({ id }).first();
  }

  async updateStatus(
    id: string,
    status: Transaction['status'],
    trx: any
  ): Promise<void> {
    await trx('transactions')
      .where({ id })
      .update({ status, updated_at: new Date() });
  }

  async findByReference(reference: string): Promise<Transaction | null> {
    return db('transactions').where({ reference }).first() ?? null;
  }

  async findByWalletId(
    wallet_id: string,
    limit: number,
    offset: number
  ): Promise<{ data: Transaction[]; total: number }> {
    const baseQuery = () =>
      db('transactions')
        .where('source_wallet_id', wallet_id)
        .orWhere('destination_wallet_id', wallet_id);

    const [data, [{ count }]] = await Promise.all([
      baseQuery().orderBy('created_at', 'desc').limit(limit).offset(offset),
      baseQuery().count('id as count'),
    ]);

    return { data, total: Number(count) };
  }
}
