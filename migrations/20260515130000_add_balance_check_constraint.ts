import type { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  await knex.raw(
    'ALTER TABLE wallets ADD CONSTRAINT check_wallet_balance_non_negative CHECK (balance >= 0)'
  );
}

export async function down(knex: Knex): Promise<void> {
  await knex.raw('ALTER TABLE wallets DROP CHECK check_wallet_balance_non_negative');
}
