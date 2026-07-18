import { NextResponse, type NextRequest } from 'next/server';
import { AUTH_COOKIE, expectedAuthToken } from './lib/auth';

const PUBLIC_PATHS = new Set(['/login', '/api/login']);

export async function middleware(req: NextRequest) {
  const expected = await expectedAuthToken();
  // APP_PASSWORD not set → open mode for local dev.
  if (!expected) return NextResponse.next();

  const { pathname } = req.nextUrl;
  if (PUBLIC_PATHS.has(pathname)) return NextResponse.next();

  const cookie = req.cookies.get(AUTH_COOKIE)?.value;
  if (cookie === expected) return NextResponse.next();

  if (pathname.startsWith('/api/')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const loginUrl = req.nextUrl.clone();
  loginUrl.pathname = '/login';
  loginUrl.searchParams.set('next', pathname);
  return NextResponse.redirect(loginUrl);
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
