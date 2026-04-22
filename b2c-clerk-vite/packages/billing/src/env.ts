import { z } from "zod";

const envSchema = z.object({
  STRIPE_SECRET_KEY: z.string().optional(),
  STRIPE_WEBHOOK_SECRET: z.string().optional(),
  STRIPE_PRICE_PRO: z.string().optional(),
  STRIPE_PORTAL_CONFIGURATION_ID: z.string().optional(),
});

export const env = envSchema.parse(typeof process !== "undefined" ? process.env : {});
