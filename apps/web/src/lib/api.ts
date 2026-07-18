// Server-side helper for calling the Express API. API_KEY never reaches the
// browser — client components go through the /api/px proxy instead.

const API_URL = process.env.API_URL ?? 'http://localhost:4100';

export async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': process.env.API_KEY ?? '',
      ...init?.headers,
    },
    cache: 'no-store',
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`API ${path} failed: ${res.status} ${text}`);
  }
  return (await res.json()) as T;
}
