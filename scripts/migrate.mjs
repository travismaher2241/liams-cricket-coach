// Applies pending SQL migrations in ./drizzle before each build.
import postgres from "postgres";
import { drizzle } from "drizzle-orm/postgres-js";
import { migrate } from "drizzle-orm/postgres-js/migrator";

const url = process.env.DATABASE_URL || process.env.POSTGRES_URL;
if (!url) {
  console.log("[migrate] No DATABASE_URL set, skipping migrations.");
  process.exit(0);
}
const sql = postgres(url, { max: 1, prepare: false });
await migrate(drizzle(sql), { migrationsFolder: "./drizzle" });
await sql.end();
console.log("[migrate] Database is up to date.");
