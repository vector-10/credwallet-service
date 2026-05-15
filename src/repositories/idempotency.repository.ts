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

  async create(payload: { key: string; expires_at: Date }): Promise<void> {
    await db('idempotency_keys').insert({
      id: uuidv4(),
      key: payload.key,
      status: 'PENDING',
      response_status: null,
      response_body: null,
      expires_at: payload.expires_at,
      created_at: new Date(),
    });
  }

  async updateToSuccess(
    key: string,
    responseStatus: number,
    responseBody: string,
    expiresAt: Date
  ): Promise<void> {
    await db('idempotency_keys').where({ key }).update({
      status: 'SUCCESS',
      response_status: responseStatus,
      response_body: responseBody,
      expires_at: expiresAt,
    });
  }

  async delete(key: string): Promise<void> {
    await db('idempotency_keys').where({ key }).delete();
  }
}
