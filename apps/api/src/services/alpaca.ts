import { loadConfig } from '../config.js';
import { logger } from '../lib/logger.js';

const config = loadConfig();

interface AlpacaRequestOptions {
  method?: 'GET' | 'POST' | 'PATCH' | 'DELETE';
  path: string;
  query?: Record<string, string | number | boolean | undefined>;
  body?: unknown;
  baseUrl?: string;
}

export interface AlpacaOrderRequest {
  symbol: string;
  qty?: string;
  notional?: string;
  side: 'buy' | 'sell';
  type: 'market' | 'limit' | 'stop';
  time_in_force: 'day' | 'gtc';
  client_order_id: string;
  limit_price?: string;
  stop_price?: string;
}

export interface AlpacaOrder {
  id: string;
  client_order_id: string;
  symbol: string;
  qty: string | null;
  notional: string | null;
  filled_qty: string;
  filled_avg_price: string | null;
  side: 'buy' | 'sell';
  type: string;
  status: string;
  submitted_at: string;
  filled_at: string | null;
}

export interface AlpacaPosition {
  symbol: string;
  qty: string;
  avg_entry_price: string;
  market_value: string;
  cost_basis: string;
  unrealized_pl: string;
  current_price: string;
}

export interface AlpacaAccount {
  id: string;
  status: string;
  buying_power: string;
  cash: string;
  portfolio_value: string;
}

export interface AlpacaClock {
  timestamp: string;
  is_open: boolean;
  next_open: string;
  next_close: string;
}

export interface AlpacaBar {
  t: string;
  o: number;
  h: number;
  l: number;
  c: number;
  v: number;
}

interface AlpacaBarsResponse {
  bars: AlpacaBar[] | null;
  next_page_token: string | null;
}

interface AlpacaLatestTradeResponse {
  symbol: string;
  trade: { t: string; p: number; s: number };
}

async function alpacaRequest<T>({
  method = 'GET',
  path,
  query,
  body,
  baseUrl,
}: AlpacaRequestOptions): Promise<T> {
  const base = baseUrl ?? config.ALPACA_BASE_URL;
  const url = new URL(path, base);
  if (query) {
    for (const [k, v] of Object.entries(query)) {
      if (v !== undefined) url.searchParams.set(k, String(v));
    }
  }

  const res = await fetch(url.toString(), {
    method,
    headers: {
      'APCA-API-KEY-ID': config.ALPACA_API_KEY_ID,
      'APCA-API-SECRET-KEY': config.ALPACA_API_SECRET_KEY,
      'Content-Type': 'application/json',
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  if (!res.ok) {
    const text = await res.text();
    logger.error({ status: res.status, url: url.toString(), text }, 'Alpaca request failed');
    throw new Error(`Alpaca ${method} ${path} failed: ${res.status} ${text}`);
  }

  return (await res.json()) as T;
}

export const alpaca = {
  async getAccount(): Promise<AlpacaAccount> {
    return alpacaRequest<AlpacaAccount>({ path: '/v2/account' });
  },

  async getClock(): Promise<AlpacaClock> {
    return alpacaRequest<AlpacaClock>({ path: '/v2/clock' });
  },

  async getPositions(): Promise<AlpacaPosition[]> {
    return alpacaRequest<AlpacaPosition[]>({ path: '/v2/positions' });
  },

  async placeOrder(req: AlpacaOrderRequest): Promise<AlpacaOrder> {
    if (!req.notional && !req.qty) {
      throw new Error('Order must include notional or qty');
    }
    if (req.notional && req.qty) {
      throw new Error('Order must include exactly one of notional or qty');
    }
    return alpacaRequest<AlpacaOrder>({ method: 'POST', path: '/v2/orders', body: req });
  },

  async getOrders(opts: {
    status?: 'open' | 'closed' | 'all';
    after?: string;
    limit?: number;
  }): Promise<AlpacaOrder[]> {
    return alpacaRequest<AlpacaOrder[]>({
      path: '/v2/orders',
      query: {
        status: opts.status ?? 'all',
        after: opts.after,
        limit: opts.limit ?? 200,
        direction: 'desc',
      },
    });
  },

  async getOrderByClientId(clientOrderId: string): Promise<AlpacaOrder> {
    return alpacaRequest<AlpacaOrder>({
      path: '/v2/orders:by_client_order_id',
      query: { client_order_id: clientOrderId },
    });
  },

  // Free plan: IEX feed. Real-time-ish; fine for a personal learning tool.
  async getLatestTrade(symbol: string): Promise<{ price: number; timestamp: string }> {
    const res = await alpacaRequest<AlpacaLatestTradeResponse>({
      path: `/v2/stocks/${encodeURIComponent(symbol)}/trades/latest`,
      baseUrl: config.ALPACA_DATA_URL,
      query: { feed: 'iex' },
    });
    return { price: res.trade.p, timestamp: res.trade.t };
  },

  async getBars(
    symbol: string,
    opts: { timeframe?: string; start: string; end?: string; limit?: number },
  ): Promise<AlpacaBar[]> {
    const all: AlpacaBar[] = [];
    let pageToken: string | null = null;
    let pages = 0;
    do {
      const res: AlpacaBarsResponse = await alpacaRequest<AlpacaBarsResponse>({
        path: `/v2/stocks/${encodeURIComponent(symbol)}/bars`,
        baseUrl: config.ALPACA_DATA_URL,
        query: {
          timeframe: opts.timeframe ?? '1Day',
          start: opts.start,
          end: opts.end,
          adjustment: 'split',
          feed: 'iex',
          limit: opts.limit ?? 10_000,
          page_token: pageToken ?? undefined,
        },
      });
      if (res.bars) all.push(...res.bars);
      pageToken = res.next_page_token;
      pages += 1;
      if (pages > 20) break;
    } while (pageToken);
    return all;
  },
};
