import cors from 'cors';
import express from 'express';
import type { NextFunction, Request, Response } from 'express';
import { loadConfig } from './config.js';
import { requireApiKey } from './lib/auth.js';
import { logger } from './lib/logger.js';
import { learnRouter } from './routes/learn.js';
import { marketRouter } from './routes/market.js';
import { ordersRouter } from './routes/orders.js';
import { portfolioRouter } from './routes/portfolio.js';
import { reviewsRouter } from './routes/reviews.js';
import { systemRouter } from './routes/system.js';
import { watchlistRouter } from './routes/watchlist.js';
import { startWorker } from './worker.js';

const config = loadConfig();

const app = express();
app.use(cors());
app.use(express.json({ limit: '1mb' }));

app.get('/health', (_req, res) => {
  res.json({ ok: true, service: 'sgiqtrader-api' });
});

app.use('/api', requireApiKey);
app.use('/api/portfolio', portfolioRouter);
app.use('/api/market', marketRouter);
app.use('/api', ordersRouter);
app.use('/api/watchlist', watchlistRouter);
app.use('/api/learn', learnRouter);
app.use('/api/reviews', reviewsRouter);
app.use('/api/system', systemRouter);

app.use((err: unknown, _req: Request, res: Response, _next: NextFunction) => {
  const message = err instanceof Error ? err.message : String(err);
  logger.error({ err: message }, 'Request failed');
  res.status(500).json({ error: message });
});

const port = config.PORT ?? config.API_PORT;
app.listen(port, () => {
  logger.info({ port }, 'SGiQTrader API listening');
  startWorker();
});
