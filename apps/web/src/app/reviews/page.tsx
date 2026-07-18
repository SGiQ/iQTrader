import Link from 'next/link';
import type { WeeklyReviewView } from '@sgiq/shared';
import { apiFetch } from '@/lib/api';
import { RunReviewButton } from './run-review';

export const dynamic = 'force-dynamic';

export default async function ReviewsPage() {
  const reviews = await apiFetch<WeeklyReviewView[]>('/api/reviews');

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-semibold">Weekly reviews</h1>
        <RunReviewButton />
      </div>
      {reviews.length === 0 ? (
        <p className="text-sm text-zinc-400">
          None yet. The coach runs automatically Sunday 6pm ET, or run one now.
        </p>
      ) : (
        <div className="space-y-3">
          {reviews.map((r) => (
            <Link key={r.id} href={`/reviews/${r.id}`} className="card block hover:border-zinc-700">
              <div className="flex items-center justify-between text-sm">
                <span className="font-medium">
                  {r.periodStart.slice(0, 10)} → {r.periodEnd.slice(0, 10)}
                </span>
                <span className="text-zinc-400">
                  D {r.scorecard.discipline} · S {r.scorecard.sizing} · J {r.scorecard.journaling} · P{' '}
                  {r.scorecard.planAdherence}
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
