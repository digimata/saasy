// INV-SES-003: redirect targets must stay app-relative and fail closed.
export function sanitizeRedirectTo(raw: string | null | undefined): string {
  if (typeof raw !== "string" || raw.length === 0) return "/";
  if (!raw.startsWith("/")) return "/";
  if (raw.startsWith("//") || raw.startsWith("/\\")) return "/";
  if (/[\s\x00-\x1f]/.test(raw)) return "/";

  try {
    const url = new URL(raw, "http://app.local");
    if (url.origin !== "http://app.local") return "/";
    return url.pathname + url.search + url.hash;
  } catch {
    return "/";
  }
}
