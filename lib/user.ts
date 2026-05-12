import { cookies } from 'next/headers';

const COOKIE_NAME = 'atoms_uid';
const ONE_YEAR = 60 * 60 * 24 * 365;

function generateUserId(): string {
  return (
    'u_' + Math.random().toString(36).slice(2, 10) + Date.now().toString(36)
  );
}

/**
 * Reads the anonymous user id from the request cookie. Returns null if absent.
 * Safe to call from Server Components / Route Handlers.
 */
export function readUserId(): string | null {
  const store = cookies();
  return store.get(COOKIE_NAME)?.value ?? null;
}

/**
 * Reads the anonymous user id, or lazily creates one if missing. The cookie is
 * normally set by `middleware.ts`, but this fallback covers the edge case
 * where middleware was skipped (e.g. very first server-render after build).
 *
 * NOTE: cookie mutation here only works inside Route Handlers or Server
 * Actions. From a Server Component, prefer relying on middleware so this
 * function effectively becomes a pure read.
 */
export function ensureUserId(): string {
  const store = cookies();
  const existing = store.get(COOKIE_NAME)?.value;
  if (existing) return existing;

  const fresh = generateUserId();
  try {
    store.set(COOKIE_NAME, fresh, {
      httpOnly: true,
      sameSite: 'lax',
      path: '/',
      maxAge: ONE_YEAR,
    });
  } catch {
    // Server Component context: skip mutation; next request will be covered
    // by middleware. We still return a fresh id for in-memory use.
  }
  return fresh;
}
