import { v4 as uuidv4 } from 'uuid';
import db from '../config/database';
import { Wallet } from '../types';

export class WalletRepository {
  async create(user_id: string, account_number: string): Promise<Wallet> {
    const id = uuidv4();
    await db('wallets').insert({
      id,
      user_id,
      account_number,
      created_at: new Date(),
      updated_at: new Date(),
    });
    return this.findById(id) as Promise<Wallet>;
  }

  async findById(id: string): Promise<Wallet | null> {
    return db('wallets').where({ id, is_active: true }).first() ?? null;
  }

  async findByUserId(user_id: string, trx?: any): Promise<Wallet | null> {
    const builder = trx ? trx('wallets') : db('wallets');
    return builder.where({ user_id, is_active: true }).first() ?? null;
  }

  async findByAccountNumber(account_number: string, trx?: any): Promise<Wallet | null> {
    const builder = trx ? trx('wallets') : db('wallets');
    return builder.where({ account_number, is_active: true }).first() ?? null;
  }

  async findByIdWithLock(id: string, trx: any): Promise<Wallet | null> {
    return trx('wallets').where({ id, is_active: true }).forUpdate().first() ?? null;
  }

  async findByUserIdWithLock(user_id: string, trx: any): Promise<Wallet | null> {
    return trx('wallets').where({ user_id, is_active: true }).forUpdate().first() ?? null;
  }

  async adjustBalance(id: string, amount: number, trx: any): Promise<void> {
    await trx('wallets')
      .where({ id })
      .update({ balance: trx.raw('balance + ?', [amount]), updated_at: new Date() });
  }
}
