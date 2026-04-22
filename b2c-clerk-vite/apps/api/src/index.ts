import { serve } from "@hono/node-server";

import { env } from "@/lib/env";
import { logger } from "@/lib/logger";
import { build } from "@/app";

async function main() {
  const app = build();

  serve(
    { fetch: app.fetch, port: env.PORT, hostname: env.HOST },
    ({ port }) => {
      logger.info(`api listening on http://${env.HOST}:${port}`);
    },
  );
}

main().catch((err) => {
  logger.fatal(err);
  process.exit(1);
});
