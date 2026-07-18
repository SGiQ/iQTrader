'use client';

import { useState } from 'react';
import type { WatchlistEntryView } from '@sgiq/shared';

export function WatchlistPanel({ initial }: { initial: WatchlistEntryView[] }) {
  const [entries, setEntries] = useState(initial);
  const [symbol, setSymbol] = useState('');
  const [error, setError] = useState<string | null>(null);

  async function refresh() {
    const res = await fetch('/api/px/watchlist');
    if (res.ok) setEntries((await res.json()) as WatchlistEntryView[]);
  }

  async function add(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const res = await fetch('/api/px/watchlist', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ symbol }),
    });
    if (!res.ok) {
      const body = (await res.json().catch(() => ({}))) as { error?: string };
      setError(body.error ?? 'Failed to add');
      return;
    }
    setSymbol('');
    await refresh();
  }

  async function remove(id: string) {
    await fetch(`/api/px/watchlist/${id}`, { method: 'DELETE' });
    await refresh();
  }

  return (
    <div className="card">
      <h2 className="mb-3 font-semibold">Watchlist</h2>
      <form onSubmit={add} className="mb-3 flex gap-2">
        <input
          className="input uppercase"
          placeholder="SYMBOL"
          value={symbol}
          onChange={(e) => setSymbol(e.target.value.toUpperCase())}
          maxLength={5}
        />
        <button className="btn" disabled={!symbol}>
          Add
        </button>
      </form>
      {error ? <p className="mb-2 text-sm text-red-400">{error}</p> : null}
      {entries.length === 0 ? (
        <p className="text-sm text-zinc-400">Empty. Add symbols you&apos;re studying.</p>
      ) : (
        <ul className="space-y-1 text-sm">
          {entries.map((w) => (
            <li key={w.id} className="flex items-center justify-between border-t border-zinc-800 py-1.5 first:border-t-0">
              <span className="font-medium">{w.symbol}</span>
              <button className="text-xs text-zinc-500 hover:text-red-400" onClick={() => void remove(w.id)}>
                remove
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
