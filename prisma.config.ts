// prisma.config.ts
import { defineConfig } from "prisma/config";
import { config } from "dotenv";
import path from "node:path";

// Explicitly load .env.local (dotenv/config only loads .env by default)
config({ path: path.resolve(process.cwd(), ".env.local") });

const url = process.env.POSTGRES_URL_NON_POOLING;

if (!url) {
  throw new Error(
    "\n\n❌  POSTGRES_URL_NON_POOLING is not set.\n" +
    "    Run: vercel env pull .env.local\n" +
    "    Then try again.\n"
  );
}

export default defineConfig({
  datasource: {
    url,
  },
  migrations: {
    seed: "tsx ./prisma/seed.ts",
  },
});