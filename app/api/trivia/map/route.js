import { NextResponse } from 'next/server';
import { pastPool, etToday } from '@/lib/qdb-library';
import { QDBS } from '@/lib/qdb';

// /api/trivia/map   (GET)  THE PROGRESS MAP'S LAYOUT (owner, 2026-11-23: "an
// amazing full screen visualization for players in the various databases that
// show progress to completion"). Every question a database can serve today, as
// keys only (no question text), grouped by topic and lane in the pages' order:
// lanes biggest first, each lane's keys oldest first, which is the order a set
// is dealt, so a player's map fills from the left as they play.
//
//   ?db=trivia|math|english|science&d=<ET day, only to key the cache by day>
//   -> { day, total, topics: [{ slug, n, lanes: [[lane, 'k k k']] }] }
//
// The layout is the same for every reader,
// so it is cached at the edge; the reader's own progress never leaves the
// browser (app/QdbMap.jsx colours the cells from localStorage).

export function GET(req) {
  const sp = new URL(req.url).searchParams;
  const db = QDBS[sp.get('db')] ? sp.get('db') : 'trivia';
  const today = etToday();
  const pool = pastPool(db, today);
  let total = 0;
  const topics = QDBS[db].topics.map((t) => {
    const lanes = new Map();
    // One square per question: a Deep subject cross-filed under its parent topic
    // (`x: 1`, lib/qdb-library.js) is already a square under Deep Cuts.
    const own = (pool[t.slug] || []).filter((x) => !x.x);
    for (const x of own) {
      if (!lanes.has(x.lane)) lanes.set(x.lane, []);
      lanes.get(x.lane).push(x);
    }
    const out = [...lanes.entries()].sort((a, b) => b[1].length - a[1].length)
      .map(([lane, xs]) => [lane, xs.map((x) => x.k).join(' ')]);
    const n = own.length;
    total += n;
    return { slug: t.slug, n, lanes: out };
  });
  return NextResponse.json({ day: today, total, topics }, {
    headers: { 'Cache-Control': 'public, max-age=3600, s-maxage=86400, stale-while-revalidate=86400' },
  });
}
