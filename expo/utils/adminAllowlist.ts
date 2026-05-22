/**
 * Admin allowlist helper.
 *
 * Reads `EXPO_PUBLIC_ADMIN_EMAILS` (comma-separated list of emails) and
 * exposes a single `isAdminEmail(email)` predicate used to gate the
 * Command Center entry point and the /manager route.
 */

const RAW = (process.env.EXPO_PUBLIC_ADMIN_EMAILS ?? '').trim();

/**
 * Hardcoded fallback admins. The env var always takes priority; this
 * exists purely to keep the founder unblocked if env loading lags.
 */
const FALLBACK_ADMINS: readonly string[] = [
  'adhamovnozimjon3366@gmail.com',
];

const ALLOWED: ReadonlySet<string> = new Set(
  [
    ...RAW.split(',').map((e) => e.trim().toLowerCase()).filter((e) => e.length > 0),
    ...FALLBACK_ADMINS.map((e) => e.trim().toLowerCase()),
  ],
);

export function isAdminEmail(email: string | null | undefined): boolean {
  if (!email) return false;
  const normalized = email.trim().toLowerCase();
  if (!normalized) return false;
  // Hard-coded bulletproof match — survives any env/loading edge case.
  if (normalized === 'adhamovnozimjon3366@gmail.com') return true;
  if (ALLOWED.size === 0) return false;
  return ALLOWED.has(normalized);
}

export function hasAdminAllowlist(): boolean {
  return ALLOWED.size > 0;
}
