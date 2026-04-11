// lib/db.ts
// Prisma 7 client — uses @prisma/adapter-pg with the pooled connection URL.
// Singleton pattern prevents "too many connections" during Next.js hot reload.

import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";

declare global {
  // eslint-disable-next-line no-var
  var __prisma: PrismaClient | undefined;
}

function createPrismaClient(): PrismaClient {
  const connectionString = process.env.POSTGRES_PRISMA_URL;

  if (!connectionString) {
    throw new Error(
      "POSTGRES_PRISMA_URL is not set.\n" +
        "Run: vercel env pull .env.local\n" +
        "Then restart the dev server."
    );
  }

  // Pooled connection (PgBouncer) for runtime queries
  const pool = new Pool({ connectionString });
  const adapter = new PrismaPg(pool);

  return new PrismaClient({
    adapter,
    log:
      process.env.NODE_ENV === "development"
        ? ["query", "error", "warn"]
        : ["error"],
  });
}

export const db: PrismaClient =
  globalThis.__prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalThis.__prisma = db;
}

export default db;