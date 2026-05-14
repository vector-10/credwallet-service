import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable("ledger_entries", (table) => {
    table.uuid("id").primary();
    table.uuid("wallet_id").nullable();
    table
      .foreign("wallet_id")
      .references("id")
      .inTable("wallets")
      .onDelete("RESTRICT");
    table.uuid("transaction_id").notNullable();
    table
      .foreign("transaction_id")
      .references("id")
      .inTable("transactions")
      .onDelete("RESTRICT");
    table.enum("entry_type", ["DEBIT", "CREDIT"]).notNullable();
    table.decimal("amount", 15, 2).notNullable();
    table.decimal("balance_before", 15, 2).nullable();
    table.decimal("balance_after", 15, 2).nullable();
    table.timestamp("created_at").notNullable().defaultTo(knex.fn.now());
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists("ledger_entries");
}
