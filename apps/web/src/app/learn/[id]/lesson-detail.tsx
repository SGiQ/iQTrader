'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import type { LessonView } from '@sgiq/shared';
import { Markdown } from '@/components/Markdown';

export function LessonDetail({ lesson }: { lesson: LessonView }) {
  const router = useRouter();
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function call(path: string, key: string) {
    setBusy(key);
    setError(null);
    const res = await fetch(`/api/px/${path}`, { method: 'POST' });
    setBusy(null);
    if (!res.ok) {
      const body = (await res.json().catch(() => ({}))) as { error?: string };
      setError(body.error ?? 'Request failed');
      return;
    }
    router.refresh();
  }

  return (
    <div className="space-y-4">
      <div>
        <Link href="/learn" className="text-sm text-emerald-400 underline">
          ← Curriculum
        </Link>
        <h1 className="mt-1 text-lg font-semibold">{lesson.title}</h1>
        <p className="text-sm text-zinc-400">{lesson.objective}</p>
      </div>

      {error ? <p className="text-sm text-red-400">{error}</p> : null}

      {!lesson.content ? (
        <div className="card">
          <p className="mb-3 text-sm text-zinc-300">
            This lesson hasn&apos;t been written yet — the tutor generates it on demand, adapted to
            your journal history.
          </p>
          <button
            className="btn"
            onClick={() => void call(`learn/lessons/${lesson.id}/generate`, 'generate')}
            disabled={busy === 'generate'}
          >
            {busy === 'generate' ? 'Tutor is writing…' : 'Generate lesson'}
          </button>
        </div>
      ) : (
        <>
          <div className="card">
            <Markdown>{lesson.content}</Markdown>
          </div>

          {lesson.exercises.map((ex) => (
            <div key={ex.id} className="card border-amber-900/50">
              <p className="label">Exercise ({ex.status})</p>
              <Markdown>{ex.instructions}</Markdown>
              {ex.status !== 'graded' ? (
                <div className="mt-3 space-y-2 text-sm text-zinc-400">
                  <p>
                    Do it on the <Link href="/trade" className="text-emerald-400 underline">Trade</Link>{' '}
                    page and link this exercise in the order ticket. Grade it once the order fills.
                  </p>
                  <button
                    className="btn-secondary"
                    onClick={() => void call(`learn/exercises/${ex.id}/grade`, ex.id)}
                    disabled={busy === ex.id || !ex.journalEntryId}
                  >
                    {busy === ex.id
                      ? 'Grading…'
                      : ex.journalEntryId
                        ? 'Grade against my trade'
                        : 'No trade linked yet'}
                  </button>
                </div>
              ) : (
                <div className="mt-3 rounded border border-zinc-800 bg-zinc-950 p-3">
                  <p className="label">
                    Grade:{' '}
                    <span
                      className={
                        ex.grade === 'pass'
                          ? 'text-emerald-400'
                          : ex.grade === 'fail'
                            ? 'text-red-400'
                            : 'text-amber-400'
                      }
                    >
                      {ex.grade}
                    </span>
                  </p>
                  {ex.feedback ? <Markdown>{ex.feedback}</Markdown> : null}
                </div>
              )}
            </div>
          ))}

          {lesson.status !== 'completed' ? (
            <button
              className="btn"
              onClick={() => void call(`learn/lessons/${lesson.id}/complete`, 'complete')}
              disabled={busy === 'complete'}
            >
              Mark lesson complete
            </button>
          ) : (
            <p className="text-sm text-emerald-400">Completed ✓</p>
          )}
        </>
      )}
    </div>
  );
}
