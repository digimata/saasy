// INV-AUTH-001: one human email identity must map to at most one local row.
export function canonicalEmail(email: string): string {
  return email.trim().toLowerCase();
}

const PG_UNIQUE_VIOLATION = "23505";
const USERS_EMAIL_CONSTRAINT = "users_email_unique";

type PgUniqueError = { code?: string; constraint_name?: string; cause?: unknown };

export function isEmailUniqueViolation(err: unknown): boolean {
  // Drizzle wraps driver errors in DrizzleQueryError and exposes the
  // postgres-js error via `cause`, so unwrap before matching on SQLSTATE.
  let current: unknown = err;
  for (let i = 0; i < 4 && current; i += 1) {
    if (typeof current !== "object") return false;
    const e = current as PgUniqueError;
    if (e.code === PG_UNIQUE_VIOLATION && e.constraint_name === USERS_EMAIL_CONSTRAINT) {
      return true;
    }
    current = e.cause;
  }
  return false;
}
