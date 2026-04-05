import { auth } from "@repo/auth";
import { toNextJsHandler } from "better-auth/next-js";

// projects/saasy/apps/web/app/api/auth/[...all]/route.ts
//

export const { GET, POST } = toNextJsHandler(auth);
