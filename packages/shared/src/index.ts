// Shared API payload types between @sgiq/api and @sgiq/web.

export type Stage = 'A' | 'B' | 'C' | 'D';

export const STAGE_LABELS: Record<Stage, string> = {
  A: 'Long-term investing',
  B: 'Swing trading',
  C: 'Options',
  D: 'Day trading',
};

export type LessonStatus = 'available' | 'generated' | 'completed';
export type ExerciseStatus = 'assigned' | 'submitted' | 'graded';
export type JournalStatus =
  | 'submitted'
  | 'filled'
  | 'partially_filled'
  | 'canceled'
  | 'rejected'
  | 'expired';

export interface UnitView {
  id: string;
  stage: Stage;
  position: number;
  title: string;
  summary: string;
  lessons: LessonSummaryView[];
}

export interface LessonSummaryView {
  id: string;
  position: number;
  title: string;
  objective: string;
  status: LessonStatus;
}

export interface ExerciseView {
  id: string;
  lessonId: string;
  instructions: string;
  rubric: string;
  status: ExerciseStatus;
  journalEntryId: string | null;
  grade: string | null;
  feedback: string | null;
  createdAt: string;
  gradedAt: string | null;
}

export interface LessonView extends LessonSummaryView {
  unitId: string;
  content: string | null;
  exercises: ExerciseView[];
}

export interface JournalEntryView {
  id: string;
  clientOrderId: string;
  alpacaOrderId: string | null;
  symbol: string;
  side: 'buy' | 'sell';
  qty: string | null;
  notional: string | null;
  orderType: 'market' | 'limit' | 'stop';
  limitPrice: string | null;
  stopPrice: string | null;
  thesis: string;
  plannedExit: string;
  riskPct: string;
  status: JournalStatus;
  filledAvgPrice: string | null;
  filledQty: string | null;
  filledAt: string | null;
  critique: string | null;
  critiquedAt: string | null;
  exerciseId: string | null;
  createdAt: string;
}

export interface PlaceOrderInput {
  symbol: string;
  side: 'buy' | 'sell';
  qty?: string;
  notional?: string;
  orderType: 'market' | 'limit' | 'stop';
  limitPrice?: string;
  stopPrice?: string;
  thesis: string;
  plannedExit: string;
  riskPct: number;
  exerciseId?: string;
}

export interface PositionView {
  symbol: string;
  qty: string;
  avgEntryPrice: string;
  marketValue: string;
  costBasis: string;
  unrealizedPl: string;
  currentPrice: string;
}

export interface PortfolioView {
  account: {
    portfolioValue: string;
    cash: string;
    buyingPower: string;
    status: string;
  };
  positions: PositionView[];
  marketOpen: boolean;
  nextOpen: string;
  nextClose: string;
}

export interface QuoteView {
  symbol: string;
  price: number;
  timestamp: string;
}

export interface BarView {
  time: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface WatchlistEntryView {
  id: string;
  symbol: string;
  note: string | null;
  createdAt: string;
}

export interface ReviewScorecard {
  discipline: number;
  sizing: number;
  journaling: number;
  planAdherence: number;
}

export interface QuizItem {
  question: string;
  answer: string;
}

export interface WeeklyReviewView {
  id: string;
  periodStart: string;
  periodEnd: string;
  narrative: string;
  scorecard: ReviewScorecard;
  focusNextWeek: string[];
  quiz: QuizItem[];
  createdAt: string;
}

export interface JobRunView {
  id: string;
  job: string;
  status: 'running' | 'success' | 'error';
  detail: string | null;
  startedAt: string;
  finishedAt: string | null;
}
