import { Suspense } from 'react';
import StageTail from '../StageTail';
import { runBreadcrumbJsonLd } from '@/lib/run-seo';
import SpaceCadetClient from './SpaceCadetClient';
import { SITE_URL } from '@/lib/site';
import { DAILY_GAME_MAP } from '@/lib/daily-games';
import { SPACE_RUN_ID, SPACE_FORMS, SPACE_MAX } from '@/lib/space-cadet';
import { circuitKeysFor } from '@/lib/circuits';
import { PUZZLES as P_roll } from '../roll/puzzles';
import { PUZZLES as P_park } from '../parker/puzzles';
import { PUZZLES as P_tangled } from '../tangled/puzzles';
import { PUZZLES as P_topple } from '../topple/puzzles';

// SPACE CADET, the run (owner, 2026-11-07): mindloftdaily.com/spacecadet.
// Each bank is resolved HERE and only today's puzzle ships, exactly as each
// game's own page ships it. The order is the owner's: Roll, Parker, Tangled,
// Topple (lib/circuits circuitKeysFor('spacecadet', day)).
const BANKS = { roll: P_roll, park: P_park, tangled: P_tangled, topple: P_topple };

export const dynamic = 'force-dynamic';

export async function generateMetadata({ searchParams }) {
  const t = String((searchParams && searchParams.t) || '');
  const c = String((searchParams && searchParams.c) || '');
  const f = String((searchParams && searchParams.f) || '');
  const img = /^\d{1,3}$/.test(t) ? `/spacecadet/card?t=${t}${/^\d{1,5}$/.test(c) ? `&c=${c}` : ''}${f === '1' ? '&f=1' : ''}` : '/spacecadet/card';
  const title = 'Space Cadet: Four Daily Spatial Puzzles in One Run | Mind Loft';
  const description = 'A free daily spatial reasoning run: roll a die, free a car, untangle the ropes, land a block. One clock ranks you from Lost in Space to Architect-Engineer.';
  return {
    title, description,
    alternates: { canonical: '/spacecadet' },
    openGraph: { title: 'Space Cadet · Mind Loft', description, url: '/spacecadet', type: 'website', siteName: 'Mind Loft', images: [{ url: img, width: 1200, height: 630, alt: 'Space Cadet, a daily spatial puzzle run from Mind Loft' }] },
    twitter: { card: 'summary_large_image', title: 'Space Cadet · Mind Loft', description, images: [img] },
  };
}

function etTodayServer() {
  try { return new Date().toLocaleDateString('en-CA', { timeZone: 'America/New_York' }); }
  catch (e) { return new Date().toISOString().slice(0, 10); }
}

export default function SpaceCadetPage() {
  const today = etTodayServer();
  const sections = [];
  for (const key of circuitKeysFor(SPACE_RUN_ID, today)) {
    const bank = BANKS[key] || [];
    const p = bank.filter((x) => x.live === today)[0];
    if (!p) continue;
    const g = DAILY_GAME_MAP[key] || {};
    const f = SPACE_FORMS[key] || {};
    sections.push({
      key, name: g.name || f.name || key, tag: g.tag || '', color: f.band || g.colorNavy || '#93c5fd',
      path: g.href || `/${key}`, num: p.num, quizId: p.quizId, sunday: !!p.sunday,
      form: f.form || g.name || key, chip: f.chip || g.tag || '', weight: 100, puzzle: p,
    });
  }
  const d = new Date(`${today}T12:00:00Z`);
  const dateLabel = d.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', timeZone: 'UTC' });
  const dateShort = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: 'UTC' });
  const jsonLd = {
    '@context': 'https://schema.org', '@type': 'Game', name: 'Space Cadet', url: `${SITE_URL}/spacecadet`,
    description: `A free daily run of spatial puzzles from Mind Loft: Roll, Parker, Tangled and Topple on one clock, scored out of ${SPACE_MAX} and ranked from Lost in Space to Architect-Engineer.`,
    gamePlatform: 'Web browser', isAccessibleForFree: true, inLanguage: 'en',
    image: `${SITE_URL}/spacecadet/card`,
    publisher: { '@type': 'Organization', name: 'Mind Loft', url: `${SITE_URL}` },
  };
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(runBreadcrumbJsonLd('spacecadet')) }} />
      <Suspense fallback={null}>
        <SpaceCadetClient day={today} dateLabel={dateLabel} dateShort={dateShort} sections={sections} />
      </Suspense>
      <StageTail run="spacecadet" theme="dark" />
    </>
  );
}
