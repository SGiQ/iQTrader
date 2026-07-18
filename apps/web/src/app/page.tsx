import Link from 'next/link';
import type { PortfolioView, WatchlistEntryView, WeeklyReviewView } from '@sgiq/shared';
import { apiFetch } from '@/lib/api';
import { pl, usd } from '@/lib/format';
import { WatchlistPanel } from '@/components/WatchlistPanel';

export const dynamic = 'force-dynamic';

export default async function DashboardPage() {
  const [portfolio, watchlist, reviews] = await Promise.all([
    apiFetch<PortfolioView>('/api/portfolio'),
    apiFetch<WatchlistEntryView[]>('/api/watchlist'),
    apiFetch<WeeklyReviewView[]>('/api/reviews'),
  ]);
  const latestReview = reviews[0];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <div className="card">
          <p className="label">Portfolio value</p>
          <p className="text-xl font-semibold">{usd(portfolio.account.portfolioValue)}</p>
        </div>
        <div className="card">
          <p className="label">Cash</p>
          <p className="text-xl font-semibold">{usd(portfolio.account.cash)}</p>
        </div>
        <div className="card">
          <p className="label">Buying power</p>
          <p className="text-xl font-semibold">{usd(portfolio.account.buyingPower)}</p>
        </div>
        <div className="card">
          <p className="label">Market</p>
          <p className={`text-xl font-semibold ${portfolio.marketOpen ? 'text-emerald-400' : 'text-zinc-400'}`}>
            {portfolio.marketOpen ? 'Open' : 'Closed'}
          </p>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <div className="card">
          <h2 className="mb-3 font-semibold">Positions</h2>
          {portfolio.positions.length === 0 ? (
            <p className="text-sm text-zinc-400">
              Flat. Head to <Link href="/learn" className="text-emerald-400 underline">Learn</Link> or{' '}
              <Link href="/trade" className="text-emerald-400 underline">Trade</Link>.
            </p>
          ) : (
            <table className="w-full text-sm">
              <thead className="text-left text-xs uppercase text-zinc-500">
                <tr>
                  <th className="pb-2">Symbol</th>
                  <th className="pb-2">Qty</th>
                  <th className="pb-2">Avg entry</th>
                  <th className="pb-2">Now</th>
                  <th className="pb-2 text-right">Unrealized P&L</th>
                </tr>
              </thead>
              <tbody>
                {portfolio.positions.map((p) => {
                  const upl = pl(p.unrealizedPl);
                  return (
                    <tr key={p.symbol} className="border-t border-zinc-800">
                      <td className="py-2 font-medium">{p.symbol}</td>
                      <td className="py-2">{p.qty}</td>
                      <td className="py-2">{usd(p.avgEntryPrice)}</td>
                      <td className="py-2">{usd(p.currentPrice)}</td>
                      <td className={`py-2 text-right ${upl.cls}`}>{upl.text}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>

        <WatchlistPanel initial={watchlist} />
      </div>

      <div className="card">
        <div className="mb-2 flex items-center justify-between">
          <h2 className="font-semibold">Latest weekly review</h2>
          <Link href="/reviews" className="text-sm text-emerald-400 underline">
            All reviews
          </Link>
        </div>
        {latestReview ? (
          <div className="space-y-2 text-sm">
            <p className="text-zinc-400">
              {latestReview.periodStart.slice(0, 10)} → {latestReview.periodEnd.slice(0, 10)} · Discipline{' '}
              {latestReview.scorecard.discipline}/10 · Sizing {latestReview.scorecard.sizing}/10 · Journaling{' '}
              {latestReview.scorecard.journaling}/10 · Plan adherence {latestReview.scorecard.planAdherence}/10
            </p>
            <ul className="ml-5 list-disc text-zinc-300">
              {latestReview.focusNextWeek.map((f) => (
                <li key={f}>{f}</li>
              ))}
            </ul>
          </div>
        ) : (
          <p className="text-sm text-zinc-400">No reviews yet — the coach runs Sunday 6pm ET.</p>
        )}
      </div>
    </div>
  );
}
