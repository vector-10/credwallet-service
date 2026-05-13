import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable("transactions", (table) => {
    table.bigIncrements("id").primary();
    table.string("reference", 100).unique().notNullable();
    table.bigInteger("source_wallet_id").unsigned().nullable();
    table
      .foreign("source_wallet_id")
      .references("id")
      .inTable("wallets")
      .onDelete("RESTRICT");
    table.bigInteger("destination_wallet_id").unsigned().nullable();
    table
      .foreign("destination_wallet_id")
      .references("id")
      .inTable("wallets")
      .onDelete("RESTRICT");
    table.decimal("amount", 15, 2).notNullable();
    table.enum("type", ["FUND", "TRANSFER", "WITHDRAWAL"]).notNullable();
    table
      .enum("status", ["PENDING", "SUCCESS", "FAILED"])
      .notNullable()
      .defaultTo("PENDING");
    table.string("description", 255).nullable();
    table.timestamp("created_at").notNullable().defaultTo(knex.fn.now());
    table.timestamp("updated_at").notNullable().defaultTo(knex.fn.now());
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists("transactions");
}
