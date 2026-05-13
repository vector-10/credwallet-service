import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable("wallets", (table) => {
    table.bigIncrements("id").primary();
    table.bigInteger("user_id").unsigned().unique().notNullable();
    table
      .foreign("user_id")
      .references("id")
      .inTable("users")
      .onDelete("RESTRICT");
    table.string("account_number", 10).unique().notNullable();
    table.decimal("balance", 15, 2).notNullable().defaultTo(0.0);
    table.decimal("minimum_balance", 15, 2).notNullable().defaultTo(100.0);
    table.boolean("is_active").notNullable().defaultTo(true);
    table.timestamp("created_at").notNullable().defaultTo(knex.fn.now());
    table.timestamp("updated_at").notNullable().defaultTo(knex.fn.now());
  });
}

export async function down(knex: Knex): Promise<void> {
    await knex.schema.dropTableIfExists('wallets');
}
