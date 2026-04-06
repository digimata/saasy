import { Resend } from "resend";

const apiKey = process.env.RESEND_API_KEY;

if (!apiKey && process.env.NODE_ENV === "production") {
  throw new Error("RESEND_API_KEY is required");
}

export const resend = apiKey ? new Resend(apiKey) : (null as unknown as Resend);
export const EMAIL_FROM = process.env.EMAIL_FROM ?? "onboarding@resend.dev";
