import { Suspense } from 'react';
import RoomClient from './RoomClient';
import { SITE_URL } from '@/lib/site';
import { DAILY_GAME_MAP } from '@/lib/daily-games';
import { ROOM_RUN_ID, ROOM_ROOMS } from '@/lib/read-room';
import { circuitKeysFor } from '@/lib/circuits';
import { PUZZLES as P_outwit } from '../outwit/puzzles';
import { PUZZLES as P_outrank } from '../outrank/puzzles';
import { PUZZLES as P_feud } from '../feud/puzzles';

// READ THE ROOM, the run (owner, 2026-10-13): mindloftdaily.com/room.
// Each bank is resolved HERE and only today's room ships, stripped exactly the
// way each game's own page strips it: the house crowds and herd truths never
// reach the browser. The clients are handed a one-puzzle list.
const BANKS = { outwit: P_outwit, outrank: P_outrank, feud: P_feud };
const SAFE = {
  outwit: (p) => ({
    num: p.num, quizId: p.quizId, live: p.live, dateLabel: p.dateLabel, sunday: !!p.sunday,
    prompts: p.prompts.map((pr) => ({
      type: pr.type, tag: pr.tag, q: pr.q,
      ...(pr.options ? { options: pr.options } : {}),
      ...(pr.min != null ? { min: pr.min, max: pr.max } : {}),
    })),
  }),
  outrank: (p) => ({
    num: p.num, quizId: p.quizId, live: p.live, dateLabel: p.dateLabel, sunday: !!p.sunday,
    theme: p.theme, flavor: p.flavor, items: p.items.slice(),
  }),
  feud: (p) => ({
    num: p.num, quizId: p.quizId, live: p.live, dateLabel: p.dateLabel, sunday: !!p.sunday,
    prompts: p.prompts.map((pr) => ({ q: pr.q })),
  }),
};

export const dynamic = 'force-dynamic';

export async function generateMetadata({ searchParams }) {
  const s = String((searchParams && searchParams.s) || '');
  const t = String((searchParams && searchParams.t) || '');
  const d = String((searchParams && searchParams.d) || '');
  const ok = /^\d{1,3}(-\d{1,3}){2}$/.test(s);
  const img = ok ? `/room/card?s=${s}${/^\d{1,3}$/.test(t) ? `&t=${t}` : ''}${/^\d{4}-\d{2}-\d{2}$/.test(d) ? `&d=${d}` : ''}` : '/room/card';
  const title = 'Read the Room: Three Crowd Games, No Answer Key | Mind Loft';
  const description = 'A free daily run of three crowd psychology games: dodge the herd in Outwit, call its order in Outrank, and say what it said in Feud. There is no answer key, only tonight’s players, and your read of the room moves until midnight.';
  return {
    title, description,
    alternates: { canonical: '/room' },
    openGraph: { title: 'Read the Room · Mind Loft', description, url: '/room', type: 'website', siteName: 'Mind Loft', images: [{ url: img, width: 1200, height: 630, alt: 'Read the Room, a daily crowd run from Mind Loft' }] },
    twitter: { card: 'summary_large_image', title: 'Read the Room · Mind Loft', description, images: [img] },
  };
}

function etTodayServer() {
  try { return new Date().toLocaleDateString('en-CA', { timeZone: 'America/New_York' }); }
  catch (e) { return new Date().toISOString().slice(0, 10); }
}

export default function RoomPage() {
  const today = etTodayServer();
  const sections = [];
  for (const key of circuitKeysFor(ROOM_RUN_ID, today)) {
    const bank = BANKS[key] || [];
    const p = bank.filter((x) => x.live === today)[0];
    if (!p) continue;
    const g = DAILY_GAME_MAP[key] || {};
    const R = ROOM_ROOMS[key] || {};
    sections.push({
      key, name: g.name || key, tag: g.tag || '', color: g.colorNavy || '#a5b4fc',
      path: g.href || `/${key}`, num: p.num, quizId: p.quizId, sunday: !!p.sunday,
      line: R.line || g.how || '', phrase: R.phrase || g.tag || key, unit: R.unit || '',
      puzzle: SAFE[key](p),
    });
  }
  const d = new Date(`${today}T12:00:00Z`);
  const dateLabel = d.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', timeZone: 'UTC' });
  const dateShort = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: 'UTC' });
  const jsonLd = {
    '@context': 'https://schema.org', '@type': 'Game', name: 'Read the Room', url: `${SITE_URL}/room`,
    description: 'A free daily run of three crowd psychology games from Mind Loft: Outwit, Outrank and Feud.',
    gamePlatform: 'Web browser', isAccessibleForFree: true, inLanguage: 'en',
    publisher: { '@type': 'Organization', name: 'Mind Loft', url: `${SITE_URL}` },
  };
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <Suspense fallback={null}>
        <RoomClient dateLabel={dateLabel} dateShort={dateShort} sections={sections} />
      </Suspense>
    </>
  );
}
