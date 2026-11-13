import { Suspense } from 'react';
import StageTail from '../StageTail';
import { runBreadcrumbJsonLd } from '@/lib/run-seo';
import EagleEyeClient from './EagleEyeClient';
import { SITE_URL } from '@/lib/site';
import { DAILY_GAME_MAP } from '@/lib/daily-games';
import { EE_RUN_ID, EE_FORMS, EE_MAX } from '@/lib/eagle-eye';
import { circuitKeysFor } from '@/lib/circuits';
import { PUZZLES as P_spot } from '../spot/puzzles';
import { PUZZLES as P_jig } from '../jig/puzzles';
import { PUZZLES as P_saw } from '../saw/puzzles';
import { PUZZLES as P_scour } from '../scour/puzzles';
import { PUZZLES as P_witness } from '../witness/puzzles';

// EAGLE EYE, the run (owner, 2026-11-13): mindloftdaily.com/eagleeye.
// Each bank is resolved HERE and only today's puzzle ships, exactly as each
// game's own page ships it. The order is the approved mockup's: Spot, Jig,
// Saw, Scour, Witness (lib/circuits circuitKeysFor('eagleeye', day)).
const BANKS = { spot: P_spot, jig: P_jig, saw: P_saw, scour: P_scour, witness: P_witness };

export const dynamic = 'force-dynamic';

export async function generateMetadata({ searchParams }) {
  const t = String((searchParams && searchParams.t) || '');
  const img = /^\d{1,3}$/.test(t) ? `/eagleeye/card?t=${t}` : '/eagleeye/card';
  const title = 'Eagle Eye: Five Daily Visual Puzzles in One Run | Mind Loft';
  const description = 'A free daily visual puzzle run: spot the differences, build two jigsaws, sweep a word search and remember a scene. Ranked from Mole to Eagle Eye.';
  return {
    title, description,
    alternates: { canonical: '/eagleeye' },
    openGraph: { title: 'Eagle Eye · Mind Loft', description, url: '/eagleeye', type: 'website', siteName: 'Mind Loft', images: [{ url: img, width: 1200, height: 630, alt: 'Eagle Eye, a daily visual puzzle run from Mind Loft' }] },
    twitter: { card: 'summary_large_image', title: 'Eagle Eye · Mind Loft', description, images: [img] },
  };
}

function etTodayServer() {
  try { return new Date().toLocaleDateString('en-CA', { timeZone: 'America/New_York' }); }
  catch (e) { return new Date().toISOString().slice(0, 10); }
}

export default function EagleEyePage() {
  const today = etTodayServer();
  const sections = [];
  for (const key of circuitKeysFor(EE_RUN_ID, today)) {
    const bank = BANKS[key] || [];
    const p = bank.filter((x) => x.live === today)[0];
    if (!p) continue;
    const g = DAILY_GAME_MAP[key] || {};
    const f = EE_FORMS[key] || {};
    sections.push({
      key, name: g.name || f.name || key, tag: g.tag || '', color: f.band || g.colorNavy || '#f5d0fe',
      path: g.href || `/${key}`, num: p.num, quizId: p.quizId, sunday: !!p.sunday,
      form: f.form || g.name || key, chip: f.chip || g.tag || '', weight: 100, puzzle: p,
    });
  }
  const d = new Date(`${today}T12:00:00Z`);
  const dateLabel = d.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', timeZone: 'UTC' });
  const dateShort = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: 'UTC' });
  const jsonLd = {
    '@context': 'https://schema.org', '@type': 'Game', name: 'Eagle Eye', url: `${SITE_URL}/eagleeye`,
    description: `A free daily run of visual puzzles from Mind Loft: Spot, Jig, Saw, Scour and Witness back to back, scored out of ${EE_MAX} on speed and accuracy and ranked from Mole to Eagle Eye.`,
    gamePlatform: 'Web browser', isAccessibleForFree: true, inLanguage: 'en',
    image: `${SITE_URL}/eagleeye/card`,
    publisher: { '@type': 'Organization', name: 'Mind Loft', url: `${SITE_URL}` },
  };
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(runBreadcrumbJsonLd('eagleeye')) }} />
      <Suspense fallback={null}>
        <EagleEyeClient day={today} dateLabel={dateLabel} dateShort={dateShort} sections={sections} />
      </Suspense>
      <StageTail run="eagleeye" theme="dark" />
    </>
  );
}
