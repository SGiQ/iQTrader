'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export function GenerateSyllabusButton({ hasSyllabus }: { hasSyllabus: boolean }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function generate() {
    if (
      hasSyllabus &&
      !window.confirm('Re-planning replaces the current syllabus (completed lessons are lost). Continue?')
    ) {
      return;
    }
    setBusy(true);
    setError(null);
    const res = await fetch('/api/px/learn/syllabus/generate', { method: 'POST' });
    setBusy(false);
    if (!res.ok) {
      const body = (await res.json().catch(() => ({}))) as { error?: string };
      setError(body.error ?? 'Generation failed');
      return;
    }
    router.refresh();
  }

  return (
    <div className="text-right">
      <button className="btn" onClick={() => void generate()} disabled={busy}>
        {busy ? 'Tutor is planning…' : hasSyllabus ? 'Re-plan syllabus' : 'Generate syllabus'}
      </button>
      {error ? <p className="mt-1 text-sm text-red-400">{error}</p> : null}
    </div>
  );
}
