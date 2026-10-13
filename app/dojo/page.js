import { Suspense } from 'react';
import DojoClient from './DojoClient';
import { SITE_URL } from '@/lib/site';
import { DAILY_GAME_MAP } from '@/lib/daily-games';
import { DOJO_RUN_ID, DOJO_FORMS, dojoWeight } from '@/lib/dojo';
import { primeDojoClocks } from '@/lib/dojo-clocks';
import { circuitKeysFor } from '@/lib/circuits';
import { PUZZLES as P_sixes } from '../sixes/puzzles';
import { PUZZLES as P_suds } from '../suds/puzzles';
import { PUZZLES as P_sando } from '../sando/puzzles';
import { PUZZLES as P_quilt } from '../quilt/puzzles';
import { PUZZLES as P_mercury } from '../mercury/puzzles';
import { PUZZLES as P_cages } from '../cages/puzzles';
import { PUZZLES as P_knight } from '../knight/puzzles';
import { PUZZLES as P_polka } from '../polka/puzzles';
import { PUZZLES as P_frame } from '../frame/puzzles';
import { PUZZLES as P_diag } from '../diag/puzzles';

// ENTER THE DOJO, the run (owner, 2026-10-12): mindloftdaily.com/dojo.
// Each bank is resolved HERE and only today's grid ships, exactly as each
// game's own page ships it. The clients are handed a one-puzzle list, which is
// today's by construction. The day's three come from lib/circuits
// circuitKeysFor('dojo', day): Sixes, Suds, then the dealt variant.
const BANKS = { sixes: P_sixes, suds: P_suds, sando: P_sando, quilt: P_quilt, mercury: P_mercury, cages: P_cages, knight: P_knight, polka: P_polka, frame: P_frame, diag: P_diag };

export const dynamic = 'force-dynamic';

export async function generateMetadata({ searchParams }) {
  const s = String((searchParams && searchParams.s) || '');
  const t = String((searchParams && searchParams.t) || '');
  const ok = /^\d{1,2}(-\d{1,2}){2}$/.test(s);
  const d = String((searchParams && searchParams.d) || '');
  const img = ok ? `/dojo/card?s=${s}${/^\d{1,3}$/.test(t) ? `&t=${t}` : ''}${/^\d{4}-\d{2}-\d{2}$/.test(d) ? `&d=${d}` : ''}` : '/dojo/card';
  const title = 'Enter the Dojo: Three Daily Sudokus, One Belt | Mind Loft';
  const description = 'A free daily sudoku run: a six by six warm-up, the classic nine by nine, then a variant such as sandwich, killer, jigsaw or thermo. Solve all three fast to earn your belt, from white to black.';
  return {
    title, description,
    alternates: { canonical: '/dojo' },
    openGraph: { title: 'Enter the Dojo · Mind Loft', description, url: '/dojo', type: 'website', siteName: 'Mind Loft', images: [{ url: img, width: 1200, height: 630, alt: 'Enter the Dojo, a daily sudoku run from Mind Loft' }] },
    twitter: { card: 'summary_large_image', title: 'Enter the Dojo · Mind Loft', description, images: [img] },
  };
}

function etTodayServer() {
  try { return new Date().toLocaleDateString('en-CA', { timeZone: 'America/New_York' }); }
  catch (e) { return new Date().toISOString().slice(0, 10); }
}

export default async function DojoPage() {
  const today = etTodayServer();
  // The day's speed clocks, measured from recent solves (lib/dojo-clocks.js),
  // so the verdict here and the board grade the same way.
  let clocks = null;
  try { clocks = await primeDojoClocks(today); } catch (e) {}
  const sections = [];
  for (const key of circuitKeysFor(DOJO_RUN_ID, today)) {
    const bank = BANKS[key] || [];
    const p = bank.filter((x) => x.live === today)[0];
    if (!p) continue;
    const g = DAILY_GAME_MAP[key] || {};
    const f = DOJO_FORMS[key] || {};
    sections.push({
      key, name: g.name || key, tag: g.tag || '', color: g.colorNavy || '#93c5fd',
      path: g.href || `/${key}`, num: p.num, quizId: p.quizId, sunday: !!p.sunday,
      form: f.form || g.name || key, chip: f.chip || g.tag || '', phrase: f.phrase || g.name || key,
      weight: dojoWeight(key), puzzle: p,
    });
  }
  const d = new Date(`${today}T12:00:00Z`);
  const dateLabel = d.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', timeZone: 'UTC' });
  const dateShort = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: 'UTC' });
  const jsonLd = {
    '@context': 'https://schema.org', '@type': 'Game', name: 'Enter the Dojo', url: `${SITE_URL}/dojo`,
    description: 'A free daily run of three sudokus from Mind Loft: Sixes, Suds and a rotating variant, ending in a belt from white to black.',
    gamePlatform: 'Web browser', isAccessibleForFree: true, inLanguage: 'en',
    publisher: { '@type': 'Organization', name: 'Mind Loft', url: `${SITE_URL}` },
  };
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <Suspense fallback={null}>
        <DojoClient dateLabel={dateLabel} dateShort={dateShort} sections={sections} clocks={clocks} />
      </Suspense>
    </>
  );
}
