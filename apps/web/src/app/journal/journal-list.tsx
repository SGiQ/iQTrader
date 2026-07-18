'use client';

import { useState } from 'react';
import type { JournalEntryView } from '@sgiq/shared';
import { Markdown } from '@/components/Markdown';
import { shortDate } from '@/lib/format';

const STATUS_CLS: Record<string, string> = {
  filled: 'text-emerald-400',
  submitted: 'text-amber-400',
  partially_filled: 'text-amber-400',
  canceled: 'text-zinc-500',
  rejected: 'text-red-400',
  expired: 'text-zinc-500',
};

export function JournalList({ initial }: { initial: JournalEntryView[] }) {
  const [entries, setEntries] = useState(initial);
  const [busy, setBusy] = useState<string | null>(null);

  async function refresh() {
    const res = await fetch('/api/px/journal');
    if (res.ok) setEntries((await res.json()) as JournalEntryView[]);
  }

  async function syncNow() {
    setBusy('sync');
    await fetch('/api/px/journal/sync', { method: 'POST' });
    await refresh();
    setBusy(null);
  }

  async function critique(id: string) {
    setBusy(id);
    await fetch(`/api/px/journal/${id}/critique`, { method: 'POST' });
    await refresh();
    setBusy(null);
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-semibold">Trade journal</h1>
        <button className="btn-secondary" onClick={() => void syncNow()} disabled={busy === 'sync'}>
          {busy === 'sync' ? 'Syncing…' : 'Sync fills now'}
        </button>
      </div>

      {entries.length === 0 ? (
        <p className="text-sm text-zinc-400">No trades yet. Every order you place creates an entry here.</p>
      ) : (
        entries.map((e) => (
          <div key={e.id} className="card">
            <div className="mb-2 flex flex-wrap items-center gap-3 text-sm">
              <span className={`font-semibold ${e.side === 'buy' ? 'text-emerald-400' : 'text-red-400'}`}>
                {e.side.toUpperCase()}
              </span>
              <span className="font-semibold">{e.symbol}</span>
              <span className="text-zinc-400">
                {e.qty ? `${e.qty} sh` : `$${e.notional}`} · {e.orderType}
                {e.limitPrice ? ` @ $${e.limitPrice}` : ''}
                {e.stopPrice ? ` stop $${e.stopPrice}` : ''}
              </span>
              <span className={STATUS_CLS[e.status] ?? 'text-zinc-400'}>{e.status}</span>
              {e.filledAvgPrice ? (
                <span className="text-zinc-400">filled @ ${e.filledAvgPrice}</span>
              ) : null}
              <span className="ml-auto text-xs text-zinc-500">{shortDate(e.createdAt)}</span>
            </div>
            <div className="grid gap-2 text-sm md:grid-cols-3">
              <div>
                <p className="label">Thesis</p>
                <p className="text-zinc-300">{e.thesis}</p>
              </div>
              <div>
                <p className="label">Planned exit</p>
                <p className="text-zinc-300">{e.plannedExit}</p>
              </div>
              <div>
                <p className="label">Stated risk</p>
                <p className="text-zinc-300">{e.riskPct}%</p>
              </div>
            </div>
            {e.critique ? (
              <div className="mt-3 rounded border border-zinc-800 bg-zinc-950 p-3">
                <p className="label">Coach critique</p>
                <Markdown>{e.critique}</Markdown>
              </div>
            ) : (
              <div className="mt-3">
                <button
                  className="btn-secondary"
                  onClick={() => void critique(e.id)}
                  disabled={busy === e.id}
                >
                  {busy === e.id ? 'Thinking…' : 'Request critique'}
                </button>
              </div>
            )}
          </div>
        ))
      )}
    </div>
  );
}
