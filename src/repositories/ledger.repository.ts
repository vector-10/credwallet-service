import { v4 as uuidv4 } from 'uuid';
import db from '../config/database';
import { LedgerEntry } from '../types';

export class LedgerRepository {
  async create(
    payload: Omit<LedgerEntry, 'id' | 'created_at'>,
    trx: any
  ): Promise<void> {
    await trx('ledger_entries').insert({
      id: uuidv4(),
      ...payload,
      created_at: new Date(),
    });
  }

  async findByWalletId(wallet_id: string): Promise<LedgerEntry[]> {
    return db('ledger_entries')
      .where({ wallet_id })
      .orderBy('created_at', 'desc');
  }
}
