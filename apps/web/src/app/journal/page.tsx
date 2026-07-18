import type { JournalEntryView } from '@sgiq/shared';
import { apiFetch } from '@/lib/api';
import { JournalList } from './journal-list';

export const dynamic = 'force-dynamic';

export default async function JournalPage() {
  const entries = await apiFetch<JournalEntryView[]>('/api/journal');
  return <JournalList initial={entries} />;
}
