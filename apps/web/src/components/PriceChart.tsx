'use client';

import { useEffect, useRef, useState } from 'react';
import { createChart, type IChartApi } from 'lightweight-charts';
import type { BarView } from '@sgiq/shared';

export function PriceChart({ symbol }: { symbol: string }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!symbol || !containerRef.current) return;
    let disposed = false;

    const chart = createChart(containerRef.current, {
      height: 320,
      layout: { background: { color: '#18181b' }, textColor: '#a1a1aa' },
      grid: {
        vertLines: { color: '#27272a' },
        horzLines: { color: '#27272a' },
      },
      timeScale: { borderColor: '#3f3f46' },
      rightPriceScale: { borderColor: '#3f3f46' },
    });
    chartRef.current = chart;
    const series = chart.addCandlestickSeries({
      upColor: '#10b981',
      downColor: '#ef4444',
      borderVisible: false,
      wickUpColor: '#10b981',
      wickDownColor: '#ef4444',
    });

    void (async () => {
      try {
        const res = await fetch(`/api/px/market/bars/${symbol}?days=365`);
        if (!res.ok) throw new Error(`bars fetch failed (${res.status})`);
        const bars = (await res.json()) as BarView[];
        if (disposed) return;
        series.setData(
          bars.map((b) => ({
            time: b.time.slice(0, 10),
            open: b.open,
            high: b.high,
            low: b.low,
            close: b.close,
          })),
        );
        chart.timeScale().fitContent();
        setError(null);
      } catch (err) {
        if (!disposed) setError(String(err));
      }
    })();

    const onResize = () => {
      if (containerRef.current) chart.applyOptions({ width: containerRef.current.clientWidth });
    };
    onResize();
    window.addEventListener('resize', onResize);

    return () => {
      disposed = true;
      window.removeEventListener('resize', onResize);
      chart.remove();
      chartRef.current = null;
    };
  }, [symbol]);

  if (!symbol) return <p className="text-sm text-zinc-500">Enter a symbol to load the chart.</p>;
  return (
    <div>
      {error ? <p className="mb-2 text-sm text-red-400">{error}</p> : null}
      <div ref={containerRef} className="w-full" />
    </div>
  );
}
