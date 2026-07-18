'use client';

import { useEffect, useState } from 'react';
import type { ExerciseView, PlaceOrderInput, QuoteView } from '@sgiq/shared';

const MIN_THESIS_CHARS = 30;
const MIN_EXIT_CHARS = 10;

export function OrderTicket({
  symbol,
  onSymbolChange,
  openExercises,
}: {
  symbol: string;
  onSymbolChange: (s: string) => void;
  openExercises: ExerciseView[];
}) {
  const [side, setSide] = useState<'buy' | 'sell'>('buy');
  const [sizeMode, setSizeMode] = useState<'qty' | 'notional'>('qty');
  const [size, setSize] = useState('');
  const [orderType, setOrderType] = useState<'market' | 'limit' | 'stop'>('market');
  const [limitPrice, setLimitPrice] = useState('');
  const [stopPrice, setStopPrice] = useState('');
  const [thesis, setThesis] = useState('');
  const [plannedExit, setPlannedExit] = useState('');
  const [riskPct, setRiskPct] = useState('1');
  const [exerciseId, setExerciseId] = useState('');
  const [quote, setQuote] = useState<QuoteView | null>(null);
  const [busy, setBusy] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);
  const [placed, setPlaced] = useState<string | null>(null);

  useEffect(() => {
    setQuote(null);
    if (!/^[A-Z]{1,5}$/.test(symbol)) return;
    const t = setTimeout(() => {
      void fetch(`/api/px/market/quote/${symbol}`)
        .then((r) => (r.ok ? r.json() : null))
        .then((q) => setQuote(q as QuoteView | null))
        .catch(() => setQuote(null));
    }, 400);
    return () => clearTimeout(t);
  }, [symbol]);

  // The journaling gate, enforced in the UI as well as the API.
  const thesisShort = thesis.trim().length < MIN_THESIS_CHARS;
  const exitShort = plannedExit.trim().length < MIN_EXIT_CHARS;
  const canSubmit =
    !busy && !!symbol && !!size && !thesisShort && !exitShort && Number(riskPct) > 0;

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setErrors([]);
    setPlaced(null);

    const input: PlaceOrderInput = {
      symbol,
      side,
      orderType,
      thesis,
      plannedExit,
      riskPct: Number(riskPct),
      ...(sizeMode === 'qty' ? { qty: size } : { notional: size }),
      ...(orderType === 'limit' ? { limitPrice } : {}),
      ...(orderType === 'stop' ? { stopPrice } : {}),
      ...(exerciseId ? { exerciseId } : {}),
    };

    const res = await fetch('/api/px/orders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(input),
    });
    setBusy(false);
    if (!res.ok) {
      const body = (await res.json().catch(() => ({}))) as { errors?: string[]; error?: string };
      setErrors(body.errors ?? [body.error ?? `Order failed (${res.status})`]);
      return;
    }
    setPlaced(`${side.toUpperCase()} ${symbol} submitted. Journal entry created.`);
    setSize('');
    setThesis('');
    setPlannedExit('');
    setExerciseId('');
  }

  return (
    <form onSubmit={submit} className="card space-y-3">
      <div className="flex items-end justify-between">
        <h2 className="font-semibold">Order ticket</h2>
        <span className="text-xs text-zinc-500">Simulated — no real money</span>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="label">Symbol</label>
          <input
            className="input uppercase"
            value={symbol}
            onChange={(e) => onSymbolChange(e.target.value.toUpperCase())}
            placeholder="AAPL"
            maxLength={5}
          />
          {quote ? (
            <p className="mt-1 text-xs text-zinc-400">
              Last: ${quote.price.toFixed(2)}
            </p>
          ) : null}
        </div>
        <div>
          <label className="label">Side</label>
          <div className="flex gap-1">
            {(['buy', 'sell'] as const).map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => setSide(s)}
                className={`flex-1 rounded px-2 py-1.5 text-sm font-medium ${
                  side === s
                    ? s === 'buy'
                      ? 'bg-emerald-700 text-white'
                      : 'bg-red-700 text-white'
                    : 'bg-zinc-800 text-zinc-400'
                }`}
              >
                {s.toUpperCase()}
              </button>
            ))}
          </div>
        </div>
        <div>
          <label className="label">Size</label>
          <div className="flex gap-1">
            <input
              className="input"
              type="number"
              min="0"
              step="any"
              value={size}
              onChange={(e) => setSize(e.target.value)}
              placeholder={sizeMode === 'qty' ? 'shares' : 'USD'}
            />
            <button
              type="button"
              className="btn-secondary whitespace-nowrap"
              onClick={() => setSizeMode(sizeMode === 'qty' ? 'notional' : 'qty')}
            >
              {sizeMode === 'qty' ? 'shares' : '$'}
            </button>
          </div>
        </div>
        <div>
          <label className="label">Type</label>
          <select
            className="input"
            value={orderType}
            onChange={(e) => setOrderType(e.target.value as typeof orderType)}
          >
            <option value="market">Market</option>
            <option value="limit">Limit</option>
            <option value="stop">Stop</option>
          </select>
        </div>
        {orderType === 'limit' ? (
          <div>
            <label className="label">Limit price</label>
            <input className="input" type="number" min="0" step="any" value={limitPrice} onChange={(e) => setLimitPrice(e.target.value)} />
          </div>
        ) : null}
        {orderType === 'stop' ? (
          <div>
            <label className="label">Stop price</label>
            <input className="input" type="number" min="0" step="any" value={stopPrice} onChange={(e) => setStopPrice(e.target.value)} />
          </div>
        ) : null}
      </div>

      <div className="rounded border border-amber-900/50 bg-amber-950/20 p-3">
        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-amber-400">
          Journal first — no entry, no order
        </p>
        <div className="space-y-3">
          <div>
            <label className="label">Thesis — why this trade, why now?</label>
            <textarea
              className="input min-h-[70px]"
              value={thesis}
              onChange={(e) => setThesis(e.target.value)}
            />
            {thesisShort ? (
              <p className="mt-1 text-xs text-zinc-500">
                {MIN_THESIS_CHARS - thesis.trim().length} more characters required
              </p>
            ) : null}
          </div>
          <div>
            <label className="label">Planned exit — price or condition, decided now</label>
            <textarea
              className="input min-h-[50px]"
              value={plannedExit}
              onChange={(e) => setPlannedExit(e.target.value)}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Risk (% of portfolio, max 5)</label>
              <input
                className="input"
                type="number"
                min="0.1"
                max="5"
                step="0.1"
                value={riskPct}
                onChange={(e) => setRiskPct(e.target.value)}
              />
            </div>
            <div>
              <label className="label">Link to exercise (optional)</label>
              <select className="input" value={exerciseId} onChange={(e) => setExerciseId(e.target.value)}>
                <option value="">—</option>
                {openExercises.map((ex) => (
                  <option key={ex.id} value={ex.id}>
                    {ex.instructions.slice(0, 60)}…
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </div>

      {errors.length > 0 ? (
        <ul className="ml-5 list-disc text-sm text-red-400">
          {errors.map((e) => (
            <li key={e}>{e}</li>
          ))}
        </ul>
      ) : null}
      {placed ? <p className="text-sm text-emerald-400">{placed}</p> : null}

      <button className="btn w-full" disabled={!canSubmit}>
        {busy ? 'Submitting…' : `Submit ${side.toUpperCase()} order`}
      </button>
    </form>
  );
}
