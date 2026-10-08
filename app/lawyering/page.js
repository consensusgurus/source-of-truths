import { Suspense } from 'react';
import LawyeringClient from './LawyeringClient';
import { SITE_URL } from '@/lib/site';
import { DAILY_GAME_MAP } from '@/lib/daily-games';
import { LAW_KEYS, LAW_CASES } from '@/lib/law-school';
import { PUZZLES as P_sworn } from '../sworn/puzzles';
import { PUZZLES as P_hearsay } from '../hearsay/puzzles';
import { PUZZLES as P_suffice } from '../suffice/puzzles';
import { PUZZLES as P_docket } from '../docket/puzzles';
import { PUZZLES as P_alibi } from '../alibi/puzzles';

// LAW SCHOOL, the run (owner, 2026-10-08): mindloftdaily.com/lawyering.
// Each bank is resolved HERE and only today's case ships, stripped exactly the
// way each game's own page strips it (a client never receives a solution).
// The clients are handed a one-puzzle list, which is today's by construction.
const BANKS = { sworn: P_sworn, hearsay: P_hearsay, suffice: P_suffice, docket: P_docket, alibi: P_alibi };
const SAFE = {
  sworn: (p) => { const { solution, ...safe } = p; return safe; },
  hearsay: (p) => p,
  suffice: (p) => ({ ...p, items: p.items.map(({ letter, ...rest }) => rest) }),
  docket: (p) => ({ ...p, meta: { sols: p.meta ? p.meta.sols : 0 } }),
  alibi: (p) => { const { solution, ...safe } = p; return safe; },
};

export const dynamic = 'force-dynamic';

export async function generateMetadata({ searchParams }) {
  const s = String((searchParams && searchParams.s) || '');
  const t = String((searchParams && searchParams.t) || '');
  const ok = /^\d{1,2}(-\d{1,2}){4}$/.test(s);
  const img = ok ? `/lawyering/card?s=${s}${/^\d{1,2}$/.test(t) ? `&t=${t}` : ''}` : '/lawyering/card';
  const title = 'Lawyering: Five Logic Cases, One Admissions Letter | Mind Loft';
  const description = 'A free daily run of five legal-reasoning puzzles: liars under oath, hearsay, a sufficiency test, an analytical reasoning section and an alibi. Your score decides which law school lets you in, from Charleston to Yale.';
  return {
    title, description,
    alternates: { canonical: '/lawyering' },
    openGraph: { title: 'Lawyering · Mind Loft', description, url: '/lawyering', type: 'website', siteName: 'Mind Loft', images: [{ url: img, width: 1200, height: 630, alt: 'Lawyering, a daily logic run from Mind Loft' }] },
    twitter: { card: 'summary_large_image', title: 'Lawyering · Mind Loft', description, images: [img] },
  };
}

function etTodayServer() {
  try { return new Date().toLocaleDateString('en-CA', { timeZone: 'America/New_York' }); }
  catch (e) { return new Date().toISOString().slice(0, 10); }
}

export default function LawyeringPage() {
  const today = etTodayServer();
  const sections = [];
  for (const key of LAW_KEYS) {
    const bank = BANKS[key] || [];
    const p = bank.filter((x) => x.live === today)[0];
    if (!p) continue;
    const g = DAILY_GAME_MAP[key] || {};
    sections.push({
      key, name: g.name || key, tag: g.tag || '', color: g.colorNavy || '#93c5fd',
      path: g.href || `/${key}`, num: p.num, quizId: p.quizId, sunday: !!p.sunday,
      file: LAW_CASES[key].file, chip: LAW_CASES[key].chip,
      puzzle: SAFE[key](p),
    });
  }
  const d = new Date(`${today}T12:00:00Z`);
  const dateLabel = d.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', timeZone: 'UTC' });
  const dateShort = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: 'UTC' });
  const jsonLd = {
    '@context': 'https://schema.org', '@type': 'Game', name: 'Lawyering', url: `${SITE_URL}/lawyering`,
    description: 'A free daily run of five legal-reasoning logic puzzles from Mind Loft: Sworn, Hearsay, Suffice, Docket and Alibi.',
    gamePlatform: 'Web browser', isAccessibleForFree: true, inLanguage: 'en',
    publisher: { '@type': 'Organization', name: 'Mind Loft', url: `${SITE_URL}` },
  };
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <Suspense fallback={null}>
        <LawyeringClient dateLabel={dateLabel} dateShort={dateShort} sections={sections} />
      </Suspense>
    </>
  );
}
