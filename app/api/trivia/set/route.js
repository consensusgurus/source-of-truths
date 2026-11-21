import { NextResponse } from 'next/server';
import { pickSet, byKeys, etToday } from '@/lib/trivia-library';
import { topicBySlug, LEVELS } from '@/lib/trivia-topics';

// /api/trivia/set   (GET)  the questions one practice game plays on the trivia
// portal (/trivia-questions, owner 2026-11-21). Only questions that have
// already run as a daily are served (lib/trivia-library.js).
//
//   ?t=<topic slug | mix>&l=<lane>|<lane>&lv=ramp|1..5&n=<1..120>&s=<seed 0..999>
//   ?ids=<key>,<key>,...   (up to 60, for "retry my misses")
//
// The same URL always gives the same set for the day, so the edge caches it:
// a player's seed is random, the cache is shared.

export const dynamic = 'force-dynamic';

export function GET(req) {
  const sp = new URL(req.url).searchParams;
  const today = etToday();
  const ids = (sp.get('ids') || '').split(',').map((s) => s.trim()).filter(Boolean).slice(0, 60);
  let qs;
  if (ids.length) qs = byKeys(ids, today);
  else {
    const t = sp.get('t') || 'mix';
    if (t !== 'mix' && !topicBySlug(t)) return NextResponse.json({ error: 'topic' }, { status: 400 });
    const lanes = (sp.get('l') || '').split('|').map((s) => s.trim()).filter(Boolean).slice(0, 40);
    const lv = LEVELS.some(([k]) => k === sp.get('lv')) ? sp.get('lv') : 'ramp';
    const n = Math.max(1, Math.min(120, parseInt(sp.get('n'), 10) || 25));
    const s = Math.max(0, Math.min(999, parseInt(sp.get('s'), 10) || 0));
    qs = pickSet({ topic: t, lanes, level: lv, n, seed: s + 1, today });
  }
  return NextResponse.json({ day: today, qs }, {
    headers: { 'Cache-Control': ids.length ? 'private, max-age=300' : 'public, max-age=600, s-maxage=3600, stale-while-revalidate=86400' },
  });
}
