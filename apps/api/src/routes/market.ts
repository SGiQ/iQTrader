import { Router } from 'express';
import type { BarView, QuoteView } from '@sgiq/shared';
import { alpaca } from '../services/alpaca.js';

export const marketRouter = Router();

marketRouter.get('/quote/:symbol', async (req, res, next) => {
  try {
    const symbol = String(req.params.symbol).toUpperCase();
    const trade = await alpaca.getLatestTrade(symbol);
    const view: QuoteView = { symbol, price: trade.price, timestamp: trade.timestamp };
    res.json(view);
  } catch (err) {
    next(err);
  }
});

marketRouter.get('/bars/:symbol', async (req, res, next) => {
  try {
    const symbol = String(req.params.symbol).toUpperCase();
    const days = Math.min(Number(req.query.days ?? 365), 3650);
    const timeframe = String(req.query.timeframe ?? '1Day');
    const start = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();
    const bars = await alpaca.getBars(symbol, { timeframe, start });
    const view: BarView[] = bars.map((b) => ({
      time: b.t,
      open: b.o,
      high: b.h,
      low: b.l,
      close: b.c,
      volume: b.v,
    }));
    res.json(view);
  } catch (err) {
    next(err);
  }
});
