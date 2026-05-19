/**
 * Admin allowlist helper.
 *
 * Reads `EXPO_PUBLIC_ADMIN_EMAILS` (comma-separated list of emails) and
 * exposes a single `isAdminEmail(email)` predicate used to gate the
 * Command Center entry point and the /manager route.
 */

const RAW = (process.env.EXPO_PUBLIC_ADMIN_EMAILS ?? '').trim();

const ALLOWED: ReadonlySet<string> = new Set(
  RAW.split(',')
    .map((e) => e.trim().toLowerCase())
    .filter((e) => e.length > 0),
);

export function isAdminEmail(email: string | null | undefined): boolean {
  if (!email) return false;
  if (ALLOWED.size === 0) return false;
  return ALLOWED.has(email.trim().toLowerCase());
}

export function hasAdminAllowlist(): boolean {
  return ALLOWED.size > 0;
}
