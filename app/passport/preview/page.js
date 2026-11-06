import { Suspense } from 'react';
import PassportRunClient from '../PassportRunClient';
import { passportPreviewDay, PREVIEW_COUNT } from '@/lib/passport-run';
import { DAILY_GAME_MAP } from '@/lib/daily-games';
import { TRIP_FROM } from '@/lib/passport';

// PASSPORT'S TRIP, PLAYABLE TODAY (owner, 2026-11-06: "give me a playable
// version"). The real run client on a demo trip from lib/passport-run.js
// PREVIEW_SPECS (?n=1 to 3), with `preview` on: nothing is filed, no stats,
// no board, and the save sits off the synced sot_ keys. The demo trips are not
// in the bank, so nothing here spoils a live day.
//
// Not indexed and not in lib/sitemap-entries.js, so it is reachable only if
// you know the path. Delete this directory to retire it.

export const metadata = {
  title: 'Passport trip preview | Mind Loft',
  description: 'An internal preview of the Passport trip.',
  robots: { index: false, follow: false, nocache: true },
};

export const dynamic = 'force-dynamic';

function etTodayServer() {
  try { return new Date().toLocaleDateString('en-CA', { timeZone: 'America/New_York' }); }
  catch (e) { return new Date().toISOString().slice(0, 10); }
}

export default function PassportPreviewPage({ searchParams }) {
  const n0 = Number(searchParams && searchParams.n);
  const n = Number.isInteger(n0) && n0 >= 1 && n0 <= PREVIEW_COUNT ? n0 : 1;
  // The trip's legs and weights are dated, so a preview before launch plays on TRIP_FROM's rules.
  const today = etTodayServer();
  const run = passportPreviewDay(n, today < TRIP_FROM ? TRIP_FROM : today);
  if (!run) return null;
  const puzzle = { ...run.sections[0].puzzle, quizId: `passport-preview-${n}` };
  const sections = run.sections.map((sec) => {
    const g = DAILY_GAME_MAP[sec.key] || {};
    return { ...sec, name: g.name || sec.key, tag: g.tag || '', color: g.colorNavy || '#93c5fd', path: g.href || `/${sec.key}` };
  });
  return (
    <Suspense fallback={null}>
      <PassportRunClient key={`pv-${n}`} puzzles={[puzzle]} puzzle={puzzle} sections={sections} calls={[]} isTodays={false} trip={run.trip} preview />
    </Suspense>
  );
}
