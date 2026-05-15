import { v4 as uuidv4 } from 'uuid';
import db from '../config/database';
import { User, CreateUserPayload } from '../types';

export class UserRepository {
  async create(
    payload: Omit<CreateUserPayload, 'password'> & { password_hash: string },
    trx?: any
  ): Promise<User> {
    const id = uuidv4();
    const builder = trx ?? db;
    await builder('users').insert({
      id,
      ...payload,
      created_at: new Date(),
      updated_at: new Date(),
    });
    return this.findById(id, trx) as Promise<User>;
  }

  async findById(id: string, trx?: any): Promise<User | null> {
    const builder = trx ?? db;
    return builder('users').where({ id, is_active: true, deleted_at: null }).first() ?? null;
  }

  async findByEmail(email: string): Promise<User | null> {
    return db('users').where({ email, is_active: true, deleted_at: null }).first() ?? null;
  }

  async findByPhone(phone_number: string): Promise<User | null> {
    return db('users').where({ phone_number, is_active: true, deleted_at: null }).first() ?? null;
  }
}
