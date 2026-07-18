import Link from 'next/link';
import { STAGE_LABELS, type Stage, type UnitView } from '@sgiq/shared';
import { apiFetch } from '@/lib/api';
import { GenerateSyllabusButton } from './syllabus-actions';

export const dynamic = 'force-dynamic';

interface SyllabusResponse {
  version: number;
  rationale: string | null;
  units: UnitView[];
}

const STATUS_BADGE: Record<string, string> = {
  available: 'bg-zinc-800 text-zinc-400',
  generated: 'bg-amber-900/60 text-amber-300',
  completed: 'bg-emerald-900/60 text-emerald-300',
};

export default async function LearnPage() {
  const syllabus = await apiFetch<SyllabusResponse>('/api/learn/syllabus');
  const stages: Stage[] = ['A', 'B', 'C', 'D'];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-semibold">
          Curriculum {syllabus.version > 0 ? `(v${syllabus.version})` : ''}
        </h1>
        <GenerateSyllabusButton hasSyllabus={syllabus.version > 0} />
      </div>

      {syllabus.version === 0 ? (
        <div className="card">
          <p className="text-sm text-zinc-300">
            No syllabus yet. Generate one — the tutor builds a staged path (investing → swing →
            options → day trading) adapted to your journal as you trade.
          </p>
        </div>
      ) : (
        stages.map((stage) => {
          const units = syllabus.units.filter((u) => u.stage === stage);
          if (units.length === 0) return null;
          return (
            <section key={stage}>
              <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-zinc-400">
                Stage {stage} — {STAGE_LABELS[stage]}
              </h2>
              <div className="space-y-3">
                {units.map((unit) => (
                  <div key={unit.id} className="card">
                    <h3 className="font-semibold">{unit.title}</h3>
                    <p className="mb-3 text-sm text-zinc-400">{unit.summary}</p>
                    <ul className="space-y-1">
                      {unit.lessons.map((lesson) => (
                        <li key={lesson.id} className="flex items-center gap-2 text-sm">
                          <span
                            className={`rounded px-1.5 py-0.5 text-xs ${STATUS_BADGE[lesson.status]}`}
                          >
                            {lesson.status}
                          </span>
                          <Link
                            href={`/learn/${lesson.id}`}
                            className="text-zinc-200 underline-offset-2 hover:underline"
                          >
                            {lesson.title}
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </section>
          );
        })
      )}
    </div>
  );
}
