import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

const globalForDb = globalThis as unknown as { pg?: ReturnType<typeof postgres> };

function client() {
  if (!globalForDb.pg) {
    const url = process.env.DATABASE_URL;
    if (!url) throw new Error("DATABASE_URL is not set");
    globalForDb.pg = postgres(url, { prepare: false, max: 5 });
  }
  return globalForDb.pg;
}

export const db = drizzle({ client: client(), schema });
export { schema };
