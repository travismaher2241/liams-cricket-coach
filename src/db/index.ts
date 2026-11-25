import { drizzle, type PostgresJsDatabase } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

type DB = PostgresJsDatabase<typeof schema>;
const g = globalThis as unknown as { __db?: DB };

function getDb(): DB {
  if (!g.__db) {
    const url = process.env.DATABASE_URL || process.env.POSTGRES_URL;
    if (!url) throw new Error("DATABASE_URL is not set");
    g.__db = drizzle({ client: postgres(url, { prepare: false, max: 5 }), schema });
  }
  return g.__db;
}

/** Lazily connects on first use, so builds work without a database. */
export const db = new Proxy({} as DB, {
  get(_t, prop) {
    const real = getDb() as unknown as Record<string | symbol, unknown>;
    const v = real[prop];
    return typeof v === "function" ? (v as (...a: unknown[]) => unknown).bind(real) : v;
  },
});
export { schema };
