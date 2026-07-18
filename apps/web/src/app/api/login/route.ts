import { NextResponse, type NextRequest } from 'next/server';
import { AUTH_COOKIE, expectedAuthToken } from '@/lib/auth';

export async function POST(req: NextRequest) {
  const body = (await req.json().catch(() => ({}))) as { password?: string };
  const password = body.password ?? '';
  if (!process.env.APP_PASSWORD) {
    return NextResponse.json({ error: 'Auth is not configured (APP_PASSWORD unset)' }, { status: 400 });
  }
  if (password !== process.env.APP_PASSWORD) {
    return NextResponse.json({ error: 'Wrong password' }, { status: 401 });
  }
  const token = await expectedAuthToken();
  const res = NextResponse.json({ ok: true });
  res.cookies.set(AUTH_COOKIE, token ?? '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24 * 90,
  });
  return res;
}
