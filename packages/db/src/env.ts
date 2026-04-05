import { z } from "zod"

// -----------------------
// projects/saasy/packages/db/src/env.ts
//
// const envSchema     L11
// export const env    L15
// export type Env     L17
// -----------------------

const envSchema = z.object({
  DATABASE_URL: z.string().default(""),
})

export const env = envSchema.parse(typeof process !== "undefined" ? process.env : {})

export type Env = z.infer<typeof envSchema>
