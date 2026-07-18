import { Router } from 'express';
import type { PortfolioView } from '@sgiq/shared';
import { alpaca } from '../services/alpaca.js';

export const portfolioRouter = Router();

portfolioRouter.get('/', async (_req, res, next) => {
  try {
    const [account, positions, clock] = await Promise.all([
      alpaca.getAccount(),
      alpaca.getPositions(),
      alpaca.getClock(),
    ]);
    const view: PortfolioView = {
      account: {
        portfolioValue: account.portfolio_value,
        cash: account.cash,
        buyingPower: account.buying_power,
        status: account.status,
      },
      positions: positions.map((p) => ({
        symbol: p.symbol,
        qty: p.qty,
        avgEntryPrice: p.avg_entry_price,
        marketValue: p.market_value,
        costBasis: p.cost_basis,
        unrealizedPl: p.unrealized_pl,
        currentPrice: p.current_price,
      })),
      marketOpen: clock.is_open,
      nextOpen: clock.next_open,
      nextClose: clock.next_close,
    };
    res.json(view);
  } catch (err) {
    next(err);
  }
});
