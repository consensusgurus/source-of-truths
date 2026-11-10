import { Suspense } from 'react';
import StageTail from '../StageTail';
import { runBreadcrumbJsonLd } from '@/lib/run-seo';
import DueDiligenceClient from './DueDiligenceClient';
import { SITE_URL } from '@/lib/site';
import { DAILY_GAME_MAP } from '@/lib/daily-games';
import { DD_RUN_ID, DD_FORMS, DD_MAX } from '@/lib/due-diligence';
import { circuitKeysFor } from '@/lib/circuits';
import { PUZZLES as P_tape } from '../tape/puzzles';
import { PUZZLES as P_filing } from '../filing/puzzles';
import { PUZZLES as P_resume } from '../resume/puzzles';

// DUE DILIGENCE, the run (owner, 2026-11-10): mindloftdaily.com/duediligence.
// Each bank is resolved HERE and only today's puzzle ships, exactly as each
// game's own page ships it. The order is the owner's: Tape, Filing, Resume
// (lib/circuits circuitKeysFor('duediligence', day)).
const BANKS = { tape: P_tape, filing: P_filing, resume: P_resume };

export const dynamic = 'force-dynamic';

export async function generateMetadata({ searchParams }) {
  const t = String((searchParams && searchParams.t) || '');
  const img = /^\d{1,2}$/.test(t) ? `/duediligence/card?t=${t}` : '/duediligence/card';
  const title = 'Due Diligence: Daily Stock Chart, IPO Filing, Resume Run | Mind Loft';
  const description = 'A free daily business trivia run: name a stock from its chart, a company from its IPO filing, a person from their resume. Ranked Anon Fintwit to Ken Griffin.';
  return {
    title, description,
    alternates: { canonical: '/duediligence' },
    openGraph: { title: 'Due Diligence · Mind Loft', description, url: '/duediligence', type: 'website', siteName: 'Mind Loft', images: [{ url: img, width: 1200, height: 630, alt: 'Due Diligence, a daily business trivia run from Mind Loft' }] },
    twitter: { card: 'summary_large_image', title: 'Due Diligence · Mind Loft', description, images: [img] },
  };
}

function etTodayServer() {
  try { return new Date().toLocaleDateString('en-CA', { timeZone: 'America/New_York' }); }
  catch (e) { return new Date().toISOString().slice(0, 10); }
}

export default function DueDiligencePage() {
  const today = etTodayServer();
  const sections = [];
  for (const key of circuitKeysFor(DD_RUN_ID, today)) {
    const bank = BANKS[key] || [];
    const p = bank.filter((x) => x.live === today)[0];
    if (!p) continue;
    const g = DAILY_GAME_MAP[key] || {};
    const f = DD_FORMS[key] || {};
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
    '@context': 'https://schema.org', '@type': 'Game', name: 'Due Diligence', url: `${SITE_URL}/duediligence`,
    description: `A free daily business trivia run from Mind Loft: Tape, Filing and Resume back to back, scored out of ${DD_MAX} on the clues you need and ranked from Anon Fintwit Account to Ken Griffin.`,
    gamePlatform: 'Web browser', isAccessibleForFree: true, inLanguage: 'en',
    image: `${SITE_URL}/duediligence/card`,
    publisher: { '@type': 'Organization', name: 'Mind Loft', url: `${SITE_URL}` },
  };
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(runBreadcrumbJsonLd('duediligence')) }} />
      <Suspense fallback={null}>
        <DueDiligenceClient day={today} dateLabel={dateLabel} dateShort={dateShort} sections={sections} />
      </Suspense>
      <StageTail run="duediligence" theme="dark" />
    </>
  );
}
