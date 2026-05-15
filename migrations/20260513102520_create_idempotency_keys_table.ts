import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable("idempotency_keys", (table) => {
    table.uuid("id").primary();
    table.string("key", 255).unique().notNullable();
    table.enum("status", ["PENDING", "SUCCESS"]).notNullable().defaultTo("PENDING");
    table.integer("response_status").nullable();
    table.text("response_body").nullable();
    table.timestamp("expires_at").notNullable();
    table.timestamp("created_at").notNullable().defaultTo(knex.fn.now());
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists("idempotency_keys");
}
