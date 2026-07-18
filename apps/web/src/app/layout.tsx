import type { Metadata } from 'next';
import Link from 'next/link';
import './globals.css';

export const metadata: Metadata = {
  title: 'SGiQTrader',
  description: 'Personal AI trading tutor — paper trading only',
};

const NAV = [
  { href: '/', label: 'Dashboard' },
  { href: '/trade', label: 'Trade' },
  { href: '/journal', label: 'Journal' },
  { href: '/learn', label: 'Learn' },
  { href: '/reviews', label: 'Reviews' },
];

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen">
        <header className="border-b border-zinc-800 bg-zinc-900">
          <div className="mx-auto flex max-w-6xl items-center gap-6 px-4 py-3">
            <span className="font-semibold text-emerald-500">SGiQTrader</span>
            <nav className="flex gap-4 text-sm text-zinc-300">
              {NAV.map((item) => (
                <Link key={item.href} href={item.href} className="hover:text-white">
                  {item.label}
                </Link>
              ))}
            </nav>
            <span className="ml-auto rounded bg-amber-900/60 px-2 py-0.5 text-xs font-medium text-amber-300">
              PAPER
            </span>
          </div>
        </header>
        <main className="mx-auto max-w-6xl px-4 py-6">{children}</main>
      </body>
    </html>
  );
}
