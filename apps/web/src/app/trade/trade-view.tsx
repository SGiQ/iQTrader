'use client';

import { useState } from 'react';
import type { ExerciseView } from '@sgiq/shared';
import { OrderTicket } from '@/components/OrderTicket';
import { PriceChart } from '@/components/PriceChart';

export function TradeView({ openExercises }: { openExercises: ExerciseView[] }) {
  const [symbol, setSymbol] = useState('');

  return (
    <div className="grid gap-6 lg:grid-cols-5">
      <div className="card lg:col-span-3">
        <h2 className="mb-3 font-semibold">{symbol || 'Chart'}</h2>
        <PriceChart symbol={/^[A-Z]{1,5}$/.test(symbol) ? symbol : ''} />
      </div>
      <div className="lg:col-span-2">
        <OrderTicket symbol={symbol} onSymbolChange={setSymbol} openExercises={openExercises} />
      </div>
    </div>
  );
}
