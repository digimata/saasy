import { defineConfig } from "drizzle-kit";

// projects/saasy/packages/db/drizzle.config.ts
//

export default defineConfig({
  schema: "./src/schema.ts",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
});
