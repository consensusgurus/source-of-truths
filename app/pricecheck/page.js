import { Suspense } from 'react';
import PriceCheckClient from './PriceCheckClient';
import { PRICE_KEYS, PRICE_GAMES, fmtCents } from '@/lib/price-games';
import { shipFor } from '@/lib/price-ship';
import { SITE_URL } from '@/lib/site';
import { PUZZLES as P_pricer } from '../pricer/puzzles';
import { PUZZLES as P_dealer } from '../dealer/puzzles';
import { PUZZLES as P_realtor } from '../realtor/puzzles';
import { PUZZLES as P_agent } from '../agent/puzzles';
import { PUZZLES as P_curator } from '../curator/puzzles';

// PRICE CHECK, the run (owner, 2026-10-01): mindloftdaily.com/pricecheck.
// Every bank is resolved HERE and only today's five items ship, exactly as
// each game's own page does it. A game whose bank has no board today simply
// sits the run out; the run never shows a future price.
const BANKS = { pricer: P_pricer, dealer: P_dealer, realtor: P_realtor, agent: P_agent, curator: P_curator };

export const dynamic = 'force-dynamic';

// A shared result link carries the five scores (?s=8-10-6-5-5) so its preview
// card can print them; the page itself ignores the parameter.
export async function generateMetadata({ searchParams }) {
  const s = String((searchParams && searchParams.s) || '');
  const ok = /^\d{1,2}(-\d{1,2}){1,4}$/.test(s);
  const img = ok ? `/pricecheck/card?s=${s}` : '/pricecheck/card';
  const title = 'Price Check: Five Real Prices, Five Guesses Each | Mind Loft';
  const description = 'A free daily run of five price games: an Amazon find, a new car, a home for sale, a flight or hotel, and a luxury piece. Five guesses at each, one score out of 50.';
  return {
    title, description,
    alternates: { canonical: '/pricecheck' },
    openGraph: { title: 'Price Check · Mind Loft', description, url: '/pricecheck', type: 'website', siteName: 'Mind Loft', images: [{ url: img, width: 1200, height: 630, alt: 'Price Check, a daily price-guessing run from Mind Loft' }] },
    twitter: { card: 'summary_large_image', title: 'Price Check · Mind Loft', description, images: [img] },
  };
}

function etTodayServer() {
  try { return new Date().toLocaleDateString('en-CA', { timeZone: 'America/New_York' }); }
  catch (e) { return new Date().toISOString().slice(0, 10); }
}
// "$??,???" with as many places as the real price, so the tag hints at size
// without saying it.
const maskOf = (cents) => fmtCents(Math.floor(cents / 100) * 100).replace(/^\$/, '').replace(/\d/g, '?');

export default function PriceCheckPage({ searchParams }) {
  const today = etTodayServer();
  // PRE-LAUNCH PREVIEW ONLY: before the family's first day (2026-10-01),
  // ?preview=1 deals each bank's first board so the run can be checked on
  // production. From launch day on it does nothing, so it can never show a
  // future price.
  const preview = today < '2026-10-01' && searchParams && searchParams.preview === '1';
  const sections = [];
  for (const key of PRICE_KEYS) {
    const bank = BANKS[key] || [];
    const p = bank.filter((x) => x.live === today)[0] || (preview ? bank.find((x) => x.live === '2026-10-02') : null);
    if (!p) continue;
    const day = shipFor(key, p);
    const g = PRICE_GAMES[key];
    const visible = bank.filter((x) => x.live <= today || x.num === p.num).map(({ num, quizId, live, dateLabel }) => ({ num, quizId, live, dateLabel }));
    const chip = key === 'realtor' ? `${p.city}, ${p.state}` : key === 'agent' ? (p.kind === 'hotel' ? 'Hotel' : `${p.from} to ${p.to}`) : day.cat;
    sections.push({ key, name: g.name, word: g.word, path: g.path, num: p.num, quizId: p.quizId, puzzles: visible, day, chip, mask: maskOf(p.price) });
  }
  const d = new Date(`${today}T12:00:00Z`);
  const dateLabel = d.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', timeZone: 'UTC' });
  const dateShort = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: 'UTC' });
  const jsonLd = {
    '@context': 'https://schema.org', '@type': 'Game', name: 'Price Check', url: `${SITE_URL}/pricecheck`,
    description: 'A free daily run of five price-guessing games from Mind Loft: Pricer, Dealer, Realtor, Agent and Curator.',
    gamePlatform: 'Web browser', isAccessibleForFree: true, inLanguage: 'en',
    publisher: { '@type': 'Organization', name: 'Mind Loft', url: `${SITE_URL}` },
  };
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <Suspense fallback={null}>
        <PriceCheckClient dateLabel={dateLabel} dateShort={dateShort} sections={sections} />
      </Suspense>
    </>
  );
}
