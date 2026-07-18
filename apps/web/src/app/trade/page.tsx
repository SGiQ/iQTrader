import type { ExerciseView } from '@sgiq/shared';
import { apiFetch } from '@/lib/api';
import { TradeView } from './trade-view';

export const dynamic = 'force-dynamic';

export default async function TradePage() {
  const openExercises = await apiFetch<ExerciseView[]>('/api/learn/exercises/open');
  return <TradeView openExercises={openExercises} />;
}
