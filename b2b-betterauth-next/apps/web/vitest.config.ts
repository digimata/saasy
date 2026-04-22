import { defineConfig } from "vitest/config";
import path from "node:path";

// projects/saasy/apps/web/vitest.config.ts
//

export default defineConfig({
  test: {
    environment: "node",
    include: ["tests/**/*.test.ts"],
    setupFiles: ["tests/setup/env.ts"],
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname),
    },
  },
});
