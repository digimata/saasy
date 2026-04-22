import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

// ---------------------
// projects/saasy/apps/web/tests/setup/env.ts
//
// const repoRoot    L11
// const envPath     L12
// ---------------------

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../../../");
const envPath = path.join(repoRoot, ".env.local");

if (typeof process.loadEnvFile === "function" && fs.existsSync(envPath)) {
  process.loadEnvFile(envPath);
}

process.env.DATABASE_URL ??= "postgresql://postgres:postgres@localhost:54329/saasy";
process.env.BETTER_AUTH_SECRET ??= "saasy-test-secret";
process.env.BETTER_AUTH_URL ??= "http://localhost:3000";
process.env.NEXT_PUBLIC_APP_URL ??= "http://localhost:3000";
