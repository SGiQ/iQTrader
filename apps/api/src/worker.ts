import cron from 'node-cron';
import { loadConfig } from './config.js';
import { logger } from './lib/logger.js';
import { withJobRun } from './services/jobRuns.js';
import { syncOrders } from './services/orderSync.js';
import { runWeeklyReview } from './services/tutor/tutor.js';

const config = loadConfig();

// Crons run in-process with the API (single-user scale; one Railway service).
export function startWorker(): void {
  const timezone = config.WORKER_TIMEZONE;

  // Order/fill sync + auto-critique of closed round trips.
  // Every 10 minutes, 9:00-16:59 ET, weekdays.
  cron.schedule(
    '*/10 9-16 * * 1-5',
    () => {
      void withJobRun('order-sync', syncOrders);
    },
    { timezone },
  );

  // Weekly coach review — Sunday 18:00 ET.
  cron.schedule(
    '0 18 * * 0',
    () => {
      void withJobRun('weekly-review', runWeeklyReview);
    },
    { timezone },
  );

  logger.info({ timezone }, 'Worker crons registered (order-sync, weekly-review)');
}
