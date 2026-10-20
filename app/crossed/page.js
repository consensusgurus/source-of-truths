import { Suspense } from 'react';
import StageTail from '../StageTail';
import { runBreadcrumbJsonLd } from '@/lib/run-seo';
import CrossedClient from './CrossedClient';
import { SITE_URL } from '@/lib/site';
import { DAILY_GAME_MAP } from '@/lib/daily-games';
import { CROSSED_RUN_ID, CROSSED_FORMS, crossedWeight } from '@/lib/crossed';
import { primeCrossedClocks } from '@/lib/crossed-clocks';
import { circuitKeysFor } from '@/lib/circuits';
import { PUZZLES as P_emcee } from '../emcee/puzzles';
import { PUZZLES as P_encore } from '../encore/puzzles';
import { PUZZLES as P_arcos } from '../arcos/puzzles';
import { PUZZLES as P_glyph } from '../glyph/puzzles';

// CROSSED, the run (owner, 2026-10-20): mindloftdaily.com/crossed.
// Each bank is resolved HERE and only today's puzzle ships, exactly as each
// game's own page ships it. The clients are handed a one-puzzle list, which is
// today's by construction. The order is the owner's: Emcee, Encore, Arcos,
// Glyph (lib/circuits circuitKeysFor('crossed', day)).
const BANKS = { emcee: P_emcee, encore: P_encore, arcos: P_arcos, glyph: P_glyph };

export const dynamic = 'force-dynamic';

export async function generateMetadata({ searchParams }) {
  const s = String((searchParams && searchParams.s) || '');
  const t = String((searchParams && searchParams.t) || '');
  const ok = /^\d{1,2}(-\d{1,2}){3}$/.test(s);
  const d = String((searchParams && searchParams.d) || '');
  const img = ok ? `/crossed/card?s=${s}${/^\d{1,3}$/.test(t) ? `&t=${t}` : ''}${/^\d{4}-\d{2}-\d{2}$/.test(d) ? `&d=${d}` : ''}` : '/crossed/card';
  const title = 'Crossed Up: Four Daily Crosswords in One Run | Mind Loft';
  const description = 'A free daily crossword run: the mini, a nine by nine, three acrostics and a no-clue code grid. Solve all four fast to rank from Monday solver to In Pen.';
  return {
    title, description,
    alternates: { canonical: '/crossed' },
    openGraph: { title: 'Crossed Up · Mind Loft', description, url: '/crossed', type: 'website', siteName: 'Mind Loft', images: [{ url: img, width: 1200, height: 630, alt: 'Crossed Up, a daily crossword run from Mind Loft' }] },
    twitter: { card: 'summary_large_image', title: 'Crossed Up · Mind Loft', description, images: [img] },
  };
}

function etTodayServer() {
  try { return new Date().toLocaleDateString('en-CA', { timeZone: 'America/New_York' }); }
  catch (e) { return new Date().toISOString().slice(0, 10); }
}

export default async function CrossedPage() {
  const today = etTodayServer();
  // The day's speed clocks, measured from recent solves (lib/crossed-clocks.js),
  // so the verdict here and the board grade the same way.
  let clocks = null;
  try { clocks = await primeCrossedClocks(today); } catch (e) {}
  const sections = [];
  for (const key of circuitKeysFor(CROSSED_RUN_ID, today)) {
    const bank = BANKS[key] || [];
    const p = bank.filter((x) => x.live === today)[0];
    if (!p) continue;
    const g = DAILY_GAME_MAP[key] || {};
    const f = CROSSED_FORMS[key] || {};
    sections.push({
      key, name: g.name || key, tag: g.tag || '', color: g.colorNavy || '#93c5fd',
      path: g.href || `/${key}`, num: p.num, quizId: p.quizId, sunday: !!p.sunday,
      form: f.form || g.name || key, chip: f.chip || g.tag || '', phrase: f.phrase || g.name || key,
      weight: crossedWeight(key), puzzle: p,
    });
  }
  const d = new Date(`${today}T12:00:00Z`);
  const dateLabel = d.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', timeZone: 'UTC' });
  const dateShort = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: 'UTC' });
  const jsonLd = {
    '@context': 'https://schema.org', '@type': 'Game', name: 'Crossed Up', url: `${SITE_URL}/crossed`,
    description: 'A free daily run of four crosswords from Mind Loft: Emcee, Encore, Arcos and Glyph, ending in a rank from Monday solver to Solves in Pen.',
    gamePlatform: 'Web browser', isAccessibleForFree: true, inLanguage: 'en',
    image: `${SITE_URL}/crossed/card`,
    publisher: { '@type': 'Organization', name: 'Mind Loft', url: `${SITE_URL}` },
  };
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(runBreadcrumbJsonLd('crossed')) }} />
      <Suspense fallback={null}>
        <CrossedClient dateLabel={dateLabel} dateShort={dateShort} sections={sections} clocks={clocks} />
      </Suspense>
      <StageTail run="crossed" theme="dark" />
    </>
  );
}
