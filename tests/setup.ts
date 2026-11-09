import { existsSync, readFileSync } from "node:fs";

// Load .env (without overriding real env vars) so TEST_DATABASE_URL is picked up locally.
if (existsSync(".env")) {
  for (const line of readFileSync(".env", "utf8").split(/\r?\n/)) {
    const match = line.match(/^\s*([A-Z0-9_]+)\s*=\s*"?([^"]*)"?\s*$/);
    if (match && process.env[match[1]] === undefined) process.env[match[1]] = match[2];
  }
}

// The integration test must never touch the dev/prod database: point Prisma at
// TEST_DATABASE_URL before any module creates a PrismaClient.
if (process.env.TEST_DATABASE_URL) {
  process.env.DATABASE_URL = process.env.TEST_DATABASE_URL;
  process.env.DATABASE_URL_UNPOOLED = process.env.TEST_DATABASE_URL;
}
