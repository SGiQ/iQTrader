// Cookie-based auth for a single user. The cookie value is an HMAC of a fixed
// string keyed by APP_PASSWORD — no sessions, no user table. Uses Web Crypto so
// the same code runs in edge middleware and node route handlers.

export const AUTH_COOKIE = 'sgiq_auth';

function toHex(buf: ArrayBuffer): string {
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

export async function expectedAuthToken(): Promise<string | null> {
  const password = process.env.APP_PASSWORD;
  if (!password) return null; // auth disabled (local dev)
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey(
    'raw',
    enc.encode(password),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  );
  const sig = await crypto.subtle.sign('HMAC', key, enc.encode('sgiqtrader-auth-v1'));
  return toHex(sig);
}
