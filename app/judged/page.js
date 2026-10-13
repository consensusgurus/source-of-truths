import { Suspense } from 'react';
import StageTail from '../StageTail';
import { runBreadcrumbJsonLd } from '@/lib/run-seo';
import JudgedClient from './JudgedClient';
import { SITE_URL } from '@/lib/site';
import { DAILY_GAME_MAP } from '@/lib/daily-games';
import { LAW_RUN_ID, LAW_CASES } from '@/lib/law-school';
import { circuitKeysFor } from '@/lib/circuits';
import { PUZZLES as P_ergo } from '../ergo/puzzles';
import { PUZZLES as P_sworn } from '../sworn/puzzles';
import { PUZZLES as P_hearsay } from '../hearsay/puzzles';
import { PUZZLES as P_docket } from '../docket/puzzles';
import { PUZZLES as P_alibi } from '../alibi/puzzles';
import { PUZZLES as P_stands } from '../stands/puzzles';

// LAW SCHOOL, the run (owner, 2026-10-08): mindloftdaily.com/judged.
// Each bank is resolved HERE and only today's case ships, stripped exactly the
// way each game's own page strips it (a client never receives a solution).
// The clients are handed a one-puzzle list, which is today's by construction.
const BANKS = { ergo: P_ergo, docket: P_docket, sworn: P_sworn, hearsay: P_hearsay, alibi: P_alibi, stands: P_stands };
const SAFE = {
  // Ergo ships no answer key: the verdicts are derived in the browser.
  ergo: (p) => p,
  sworn: (p) => { const { solution, ...safe } = p; return safe; },
  hearsay: (p) => p,
  docket: (p) => ({ ...p, meta: { sols: p.meta ? p.meta.sols : 0 } }),
  alibi: (p) => { const { solution, ...safe } = p; return safe; },
  stands: (p) => p,
};

export const dynamic = 'force-dynamic';

export async function generateMetadata({ searchParams }) {
  const s = String((searchParams && searchParams.s) || '');
  const t = String((searchParams && searchParams.t) || '');
  const ok = /^\d{1,2}(-\d{1,2}){4}$/.test(s);
  const d = String((searchParams && searchParams.d) || '');
  const img = ok ? `/judged/card?s=${s}${/^\d{1,3}$/.test(t) ? `&t=${t}` : ''}${/^\d{4}-\d{2}-\d{2}$/.test(d) ? `&d=${d}` : ''}` : '/judged/card';
  const title = 'Judged: Five Logic Cases, One Admissions Letter | Mind Loft';
  const description = 'A free daily run of five legal-reasoning puzzles: if-then rules, liars under oath, hearsay, a logic game and an alibi. Right and fast picks your law school.';
  return {
    title, description,
    alternates: { canonical: '/judged' },
    openGraph: { title: 'Judged · Mind Loft', description, url: '/judged', type: 'website', siteName: 'Mind Loft', images: [{ url: img, width: 1200, height: 630, alt: 'Judged, a daily logic run from Mind Loft' }] },
    twitter: { card: 'summary_large_image', title: 'Judged · Mind Loft', description, images: [img] },
  };
}

function etTodayServer() {
  try { return new Date().toLocaleDateString('en-CA', { timeZone: 'America/New_York' }); }
  catch (e) { return new Date().toISOString().slice(0, 10); }
}

export default function JudgedPage() {
  const today = etTodayServer();
  const sections = [];
  // The day's roster (Ergo leads from 2026-10-11, Docket before).
  for (const key of circuitKeysFor(LAW_RUN_ID, today)) {
    const bank = BANKS[key] || [];
    const p = bank.filter((x) => x.live === today)[0];
    if (!p) continue;
    const g = DAILY_GAME_MAP[key] || {};
    sections.push({
      key, name: g.name || key, tag: g.tag || '', color: g.colorNavy || '#93c5fd',
      path: g.href || `/${key}`, num: p.num, quizId: p.quizId, sunday: !!p.sunday,
      file: LAW_CASES[key].file, chip: LAW_CASES[key].chip, phrase: LAW_CASES[key].phrase,
      puzzle: SAFE[key](p),
    });
  }
  const d = new Date(`${today}T12:00:00Z`);
  const dateLabel = d.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', timeZone: 'UTC' });
  const dateShort = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: 'UTC' });
  const jsonLd = {
    '@context': 'https://schema.org', '@type': 'Game', name: 'Judged', url: `${SITE_URL}/judged`,
    description: 'A free daily run of five legal-reasoning logic puzzles from Mind Loft: Ergo, Sworn, Hearsay, Docket and Alibi.',
    gamePlatform: 'Web browser', isAccessibleForFree: true, inLanguage: 'en',
    image: `${SITE_URL}/judged/card`,
    publisher: { '@type': 'Organization', name: 'Mind Loft', url: `${SITE_URL}` },
  };
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(runBreadcrumbJsonLd('deduction')) }} />
      <Suspense fallback={null}>
        <JudgedClient dateLabel={dateLabel} dateShort={dateShort} sections={sections} />
      </Suspense>
      <StageTail run="deduction" theme="dark" />
    </>
  );
}
