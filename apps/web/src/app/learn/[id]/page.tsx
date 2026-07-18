import type { LessonView } from '@sgiq/shared';
import { apiFetch } from '@/lib/api';
import { LessonDetail } from './lesson-detail';

export const dynamic = 'force-dynamic';

export default async function LessonPage({ params }: { params: { id: string } }) {
  const lesson = await apiFetch<LessonView>(`/api/learn/lessons/${params.id}`);
  return <LessonDetail lesson={lesson} />;
}
