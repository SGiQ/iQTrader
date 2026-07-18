'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export function RunReviewButton() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function run() {
    setBusy(true);
    setError(null);
    const res = await fetch('/api/px/reviews/run', { method: 'POST' });
    setBusy(false);
    if (!res.ok) {
      const body = (await res.json().catch(() => ({}))) as { error?: string };
      setError(body.error ?? 'Review failed');
      return;
    }
    router.refresh();
  }

  return (
    <div className="text-right">
      <button className="btn" onClick={() => void run()} disabled={busy}>
        {busy ? 'Coach is reviewing…' : 'Run review now'}
      </button>
      {error ? <p className="mt-1 text-sm text-red-400">{error}</p> : null}
    </div>
  );
}
