import { Suspense } from 'react';
import StageTail from '../StageTail';
import { runBreadcrumbJsonLd } from '@/lib/run-seo';
import DojoClient from '../dojo/DojoClient';
import { SITE_URL } from '@/lib/site';
import { DAILY_GAME_MAP } from '@/lib/daily-games';
import { DOJO_COLOR_RUN_ID, DOJO_FORMS, dojoWeight } from '@/lib/dojo';
import { primeDojoClocks } from '@/lib/dojo-clocks';
import { circuitKeysFor } from '@/lib/circuits';
import { PUZZLES as P_sixestoo } from '../sixestoo/puzzles';
import { PUZZLES as P_sudstoo } from '../sudstoo/puzzles';
import { PUZZLES as P_mercurytoo } from '../mercurytoo/puzzles';
import { PUZZLES as P_diagtoo } from '../diagtoo/puzzles';
import { PUZZLES as P_knighttoo } from '../knighttoo/puzzles';
import { PUZZLES as P_windowtoo } from '../windowtoo/puzzles';
import { PUZZLES as P_racecartoo } from '../racecartoo/puzzles';

// ENTER THE DOJO: IN COLOR (owner, 2026-11-08): mindloftdaily.com/dojocolor.
// The Dojo (app/dojo/page.js) on the color twins: SixesToo, SudsToo, then the
// day's color variant from lib/dojo.js DOJO_COLOR_POOL, played by the same
// client. Each bank is resolved HERE and only today's grid ships.
const BANKS = { sixestoo: P_sixestoo, sudstoo: P_sudstoo, mercurytoo: P_mercurytoo, diagtoo: P_diagtoo, knighttoo: P_knighttoo, windowtoo: P_windowtoo, racecartoo: P_racecartoo };

export const dynamic = 'force-dynamic';

export async function generateMetadata({ searchParams }) {
  const s = String((searchParams && searchParams.s) || '');
  const t = String((searchParams && searchParams.t) || '');
  const ok = /^\d{1,2}(-\d{1,2}){2}$/.test(s);
  const d = String((searchParams && searchParams.d) || '');
  const img = ok ? `/dojocolor/card?s=${s}${/^\d{1,3}$/.test(t) ? `&t=${t}` : ''}${/^\d{4}-\d{2}-\d{2}$/.test(d) ? `&d=${d}` : ''}` : '/dojocolor/card';
  const title = 'Enter the Dojo: In Color, Three Daily Color Sudokus | Mind Loft';
  const description = 'A free daily color sudoku run: a 6×6 warm-up, the classic 9×9, then a variant, with colors in place of digits. Solve all three fast to earn your belt.';
  return {
    title, description,
    alternates: { canonical: '/dojocolor' },
    openGraph: { title: 'Enter the Dojo: In Color · Mind Loft', description, url: '/dojocolor', type: 'website', siteName: 'Mind Loft', images: [{ url: img, width: 1200, height: 630, alt: 'Enter the Dojo: In Color, a daily color sudoku run from Mind Loft' }] },
    twitter: { card: 'summary_large_image', title: 'Enter the Dojo: In Color · Mind Loft', description, images: [img] },
  };
}

function etTodayServer() {
  try { return new Date().toLocaleDateString('en-CA', { timeZone: 'America/New_York' }); }
  catch (e) { return new Date().toISOString().slice(0, 10); }
}

export default async function DojoColorPage() {
  const today = etTodayServer();
  // The day's speed clocks, measured from recent solves (lib/dojo-clocks.js),
  // so the verdict here and the board grade the same way.
  let clocks = null;
  try { clocks = await primeDojoClocks(today); } catch (e) {}
  const sections = [];
  for (const key of circuitKeysFor(DOJO_COLOR_RUN_ID, today)) {
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
    '@context': 'https://schema.org', '@type': 'Game', name: 'Enter the Dojo: In Color', url: `${SITE_URL}/dojocolor`,
    description: 'A free daily run of three color sudokus from Mind Loft: SixesToo, SudsToo and a rotating color variant, ending in a belt from white to black.',
    gamePlatform: 'Web browser', isAccessibleForFree: true, inLanguage: 'en',
    image: `${SITE_URL}/dojocolor/card`,
    publisher: { '@type': 'Organization', name: 'Mind Loft', url: `${SITE_URL}` },
  };
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(runBreadcrumbJsonLd('dojocolor')) }} />
      <Suspense fallback={null}>
        <DojoClient dateLabel={dateLabel} dateShort={dateShort} sections={sections} clocks={clocks} runId="dojocolor" />
      </Suspense>
      <StageTail run="dojocolor" theme="dark" />
    </>
  );
}
