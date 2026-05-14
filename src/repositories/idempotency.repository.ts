import { v4 as uuidv4 } from 'uuid';
import db from '../config/database';
import { IdempotencyRecord } from '../types';

export class IdempotencyRepository {
  async findByKey(key: string): Promise<IdempotencyRecord | null> {
    return db('idempotency_keys')
      .where({ key })
      .where('expires_at', '>', new Date())
      .first() ?? null;
  }

  async create(
    payload: Omit<IdempotencyRecord, 'id' | 'created_at'>
  ): Promise<void> {
    try {
      await db('idempotency_keys').insert({
        id: uuidv4(),
        ...payload,
        created_at: new Date(),
      });
    } catch (e: any) {
      if (e.code === 'ER_DUP_ENTRY') return;
      throw e;
    }
  }
}
