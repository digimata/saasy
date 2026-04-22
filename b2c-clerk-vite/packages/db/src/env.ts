import { z } from "zod";

const envSchema = z.object({
  DATABASE_URL: z.string().default(""),
});

export const env = envSchema.parse(typeof process !== "undefined" ? process.env : {});

export type Env = z.infer<typeof envSchema>;
