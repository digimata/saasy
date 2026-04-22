import { Hono } from "hono";

import { requireAuth, currentUserId } from "@/lib/auth";
import { ensureLocalUser } from "@/lib/user";

const app = new Hono();

app.use("*", requireAuth);

app.get("/", async (c) => {
  const clerkUserId = currentUserId(c);
  const user = await ensureLocalUser(c, clerkUserId);
  return c.json({ user });
});

export default app;
