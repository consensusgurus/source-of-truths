import { Suspense } from 'react';
import StageTail from '../StageTail';
import { runBreadcrumbJsonLd } from '@/lib/run-seo';
import OddJobsClient from './OddJobsClient';
import { SITE_URL } from '@/lib/site';
import { DAILY_GAME_MAP } from '@/lib/daily-games';
import { ODD_RUN_ID, ODD_FORMS } from '@/lib/odd-jobs';
import { circuitKeysFor } from '@/lib/circuits';
import { PUZZLES as P_mop } from '../mop/puzzles';
import { PUZZLES as P_mow } from '../mow/puzzles';
import { PUZZLES as P_plow } from '../plow/puzzles';

// ODD JOBS, the run (owner, 2026-11-21): mindloftdaily.com/oddjobs.
// Each bank is resolved HERE and only today's board ships, with its stored
// route (`sol`) stripped, exactly as each game's own page ships it. The order
// is Mop, Mow, Plow (lib/circuits circuitKeysFor('oddjobs', day)).
const BANKS = { mop: P_mop, mow: P_mow, plow: P_plow };

export const dynamic = 'force-dynamic';

export async function generateMetadata({ searchParams }) {
  const t = String((searchParams && searchParams.t) || '');
  const img = /^\d{1,3}$/.test(t) ? `/oddjobs/card?t=${t}` : '/oddjobs/card';
  const title = 'Odd Jobs: Daily Mop, Mow and Plow Route Puzzle Run | Mind Loft';
  const description = 'A free daily route puzzle run: mop a house, mow a yard and plow a town, every tile, square and street exactly once. Fewest replays win. Couch Potato to Foreman.';
  return {
    title, description,
    alternates: { canonical: '/oddjobs' },
    openGraph: { title: 'Odd Jobs · Mind Loft', description, url: '/oddjobs', type: 'website', siteName: 'Mind Loft', images: [{ url: img, width: 1200, height: 630, alt: 'Odd Jobs, a daily route puzzle run from Mind Loft' }] },
    twitter: { card: 'summary_large_image', title: 'Odd Jobs · Mind Loft', description, images: [img] },
  };
}

function etTodayServer() {
  try { return new Date().toLocaleDateString('en-CA', { timeZone: 'America/New_York' }); }
  catch (e) { return new Date().toISOString().slice(0, 10); }
}

export default function OddJobsPage() {
  const today = etTodayServer();
  const sections = [];
  for (const key of circuitKeysFor(ODD_RUN_ID, today)) {
    const bank = BANKS[key] || [];
    const raw = bank.filter((x) => x.live === today)[0];
    if (!raw) continue;
    const { sol, ...p } = raw;
    const g = DAILY_GAME_MAP[key] || {};
    const f = ODD_FORMS[key] || {};
    sections.push({
      key, name: g.name || f.name || key, tag: g.tag || '', color: f.band || g.colorNavy || '#93c5fd',
      path: g.href || `/${key}`, num: p.num, quizId: p.quizId, sunday: !!p.sunday,
      form: f.form || g.name || key, chip: f.chip || g.tag || '', weight: 10, puzzle: p,
    });
  }
  const d = new Date(`${today}T12:00:00Z`);
  const dateLabel = d.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', timeZone: 'UTC' });
  const dateShort = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: 'UTC' });
  const jsonLd = {
    '@context': 'https://schema.org', '@type': 'Game', name: 'Odd Jobs', url: `${SITE_URL}/oddjobs`,
    description: 'A free daily route puzzle run from Mind Loft: Mop, Mow and Plow back to back, ranked on fewest replays and then the clock, from Couch Potato to Foreman.',
    gamePlatform: 'Web browser', isAccessibleForFree: true, inLanguage: 'en',
    image: `${SITE_URL}/oddjobs/card`,
    publisher: { '@type': 'Organization', name: 'Mind Loft', url: `${SITE_URL}` },
  };
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(runBreadcrumbJsonLd('oddjobs')) }} />
      <Suspense fallback={null}>
        <OddJobsClient day={today} dateLabel={dateLabel} dateShort={dateShort} sections={sections} />
      </Suspense>
      <StageTail run="oddjobs" theme="dark" />
    </>
  );
}
