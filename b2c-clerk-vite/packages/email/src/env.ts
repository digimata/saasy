export const RESEND_API_KEY = process.env.RESEND_API_KEY;
export const EMAIL_FROM = process.env.EMAIL_FROM ?? "onboarding@resend.dev";

export function isEmailConfigured(): boolean {
  return Boolean(RESEND_API_KEY);
}
