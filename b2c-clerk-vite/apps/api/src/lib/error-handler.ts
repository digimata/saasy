import type { Context } from "hono";

import { APIError } from "@/lib/error";
import { logger } from "@/lib/logger";

/**
 * Shared Hono onError handler. Attach to both the root app and every
 * mounted sub-app so unit tests that exercise a sub-app in isolation get
 * the same APIError → JSON response shape as the running server.
 */
export function handleError(err: Error, cx: Context): Response {
  if (err instanceof APIError) {
    logger.error({ err, metadata: err.metadata }, err.message);
    return cx.json(err.json(), err.statusCode);
  }

  logger.error({ err }, "unknown:error");
  return cx.json(
    {
      error: {
        code: "internal_server_error",
        message: "An unexpected error occurred",
      },
    },
    500,
  );
}
