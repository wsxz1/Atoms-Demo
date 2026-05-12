import { NextRequest, NextResponse } from 'next/server';

const COOKIE_NAME = 'atoms_uid';
const ONE_YEAR = 60 * 60 * 24 * 365;

function generateUserId(): string {
  return (
    'u_' + Math.random().toString(36).slice(2, 10) + Date.now().toString(36)
  );
}

/**
 * Ensures every request has an anonymous user id cookie. Running in middleware
 * lets Server Components read the cookie without needing to mutate it from a
 * RSC context (which Next.js 14 forbids).
 */
export function middleware(req: NextRequest) {
  const existing = req.cookies.get(COOKIE_NAME)?.value;
  if (existing) return NextResponse.next();

  const uid = generateUserId();
  const res = NextResponse.next();
  res.cookies.set(COOKIE_NAME, uid, {
    httpOnly: true,
    sameSite: 'lax',
    path: '/',
    maxAge: ONE_YEAR,
  });
  return res;
}

export const config = {
  matcher: [
    /*
     * Match all routes except static assets and Next internals.
     */
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};
