import type { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  await knex.schema.alterTable('idempotency_keys', (table) => {
    table.enum('status', ['PENDING', 'SUCCESS']).notNullable().defaultTo('PENDING').after('key');
    table.integer('response_status').nullable().alter();
    table.text('response_body').nullable().alter();
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.alterTable('idempotency_keys', (table) => {
    table.dropColumn('status');
    table.integer('response_status').notNullable().alter();
    table.text('response_body').notNullable().alter();
  });
}
