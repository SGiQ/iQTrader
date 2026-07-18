import Link from 'next/link';
import type { WeeklyReviewView } from '@sgiq/shared';
import { apiFetch } from '@/lib/api';
import { Markdown } from '@/components/Markdown';

export const dynamic = 'force-dynamic';

export default async function ReviewDetailPage({ params }: { params: { id: string } }) {
  const review = await apiFetch<WeeklyReviewView>(`/api/reviews/${params.id}`);

  const scores = [
    ['Discipline', review.scorecard.discipline],
    ['Sizing', review.scorecard.sizing],
    ['Journaling', review.scorecard.journaling],
    ['Plan adherence', review.scorecard.planAdherence],
  ] as const;

  return (
    <div className="space-y-4">
      <div>
        <Link href="/reviews" className="text-sm text-emerald-400 underline">
          ← All reviews
        </Link>
        <h1 className="mt-1 text-lg font-semibold">
          Week {review.periodStart.slice(0, 10)} → {review.periodEnd.slice(0, 10)}
        </h1>
      </div>

      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        {scores.map(([label, value]) => (
          <div key={label} className="card text-center">
            <p className="label">{label}</p>
            <p
              className={`text-2xl font-semibold ${
                value >= 7 ? 'text-emerald-400' : value >= 4 ? 'text-amber-400' : 'text-red-400'
              }`}
            >
              {value}/10
            </p>
          </div>
        ))}
      </div>

      <div className="card">
        <Markdown>{review.narrative}</Markdown>
      </div>

      <div className="card">
        <h2 className="mb-2 font-semibold">Focus next week</h2>
        <ul className="ml-5 list-disc text-sm text-zinc-300">
          {review.focusNextWeek.map((f) => (
            <li key={f}>{f}</li>
          ))}
        </ul>
      </div>

      <div className="card">
        <h2 className="mb-2 font-semibold">Quiz</h2>
        <div className="space-y-2">
          {review.quiz.map((q, i) => (
            <details key={i} className="rounded border border-zinc-800 bg-zinc-950 p-3 text-sm">
              <summary className="cursor-pointer text-zinc-200">{q.question}</summary>
              <p className="mt-2 text-zinc-400">{q.answer}</p>
            </details>
          ))}
        </div>
      </div>
    </div>
  );
}
