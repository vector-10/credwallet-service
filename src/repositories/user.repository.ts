import { v4 as uuidv4 } from 'uuid';
import db from '../config/database';
import { User, CreateUserPayload } from '../types';

export class UserRepository {
  async create(
    payload: Omit<CreateUserPayload, 'password'> & { password_hash: string }
  ): Promise<User> {
    const id = uuidv4();
    await db('users').insert({
      id,
      ...payload,
      created_at: new Date(),
      updated_at: new Date(),
    });
    return this.findById(id) as Promise<User>;
  }

  async findById(id: string): Promise<User | null> {
    return db('users').where({ id, deleted_at: null }).first() ?? null;
  }

  async findByEmail(email: string): Promise<User | null> {
    return db('users').where({ email, deleted_at: null }).first() ?? null;
  }

  async findByPhone(phone_number: string): Promise<User | null> {
    return db('users').where({ phone_number, deleted_at: null }).first() ?? null;
  }
}
