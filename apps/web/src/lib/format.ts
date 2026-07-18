export function usd(value: string | number | null | undefined): string {
  const n = Number(value);
  if (!Number.isFinite(n)) return '—';
  return n.toLocaleString('en-US', { style: 'currency', currency: 'USD' });
}

export function pl(value: string | number | null | undefined): { text: string; cls: string } {
  const n = Number(value);
  if (!Number.isFinite(n)) return { text: '—', cls: 'text-zinc-400' };
  return {
    text: `${n >= 0 ? '+' : ''}${usd(n)}`,
    cls: n >= 0 ? 'text-emerald-400' : 'text-red-400',
  };
}

export function shortDate(iso: string | null | undefined): string {
  if (!iso) return '—';
  return new Date(iso).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    timeZone: 'America/New_York',
  });
}
