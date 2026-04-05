// ---------------------------------
// projects/saasy/apps/web/lib/auth/types/captcha-provider.ts
//
// export type CaptchaProvider    L7
// ---------------------------------

export type CaptchaProvider =
  | "cloudflare-turnstile"
  | "google-recaptcha-v2-checkbox"
  | "google-recaptcha-v2-invisible"
  | "google-recaptcha-v3"
  | "hcaptcha"
  | "captchafox";
