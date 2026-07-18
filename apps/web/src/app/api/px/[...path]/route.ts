import { NextResponse, type NextRequest } from 'next/server';

// Authenticated proxy for client components: browser → /api/px/* → Express API.
// The middleware gates this route behind the auth cookie; the API key is
// attached server-side and never shipped to the browser.

const API_URL = process.env.API_URL ?? 'http://localhost:4100';

async function forward(req: NextRequest, params: { path: string[] }) {
  const target = new URL(`${API_URL}/api/${params.path.join('/')}`);
  req.nextUrl.searchParams.forEach((v, k) => target.searchParams.set(k, v));

  const init: RequestInit = {
    method: req.method,
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': process.env.API_KEY ?? '',
    },
  };
  if (req.method !== 'GET' && req.method !== 'HEAD') {
    init.body = await req.text();
  }

  const res = await fetch(target, init);
  const text = await res.text();
  return new NextResponse(text.length > 0 ? text : null, {
    status: res.status,
    headers: { 'Content-Type': res.headers.get('Content-Type') ?? 'application/json' },
  });
}

export async function GET(req: NextRequest, ctx: { params: { path: string[] } }) {
  return forward(req, ctx.params);
}
export async function POST(req: NextRequest, ctx: { params: { path: string[] } }) {
  return forward(req, ctx.params);
}
export async function DELETE(req: NextRequest, ctx: { params: { path: string[] } }) {
  return forward(req, ctx.params);
}
