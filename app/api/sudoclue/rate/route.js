import { NextResponse } from 'next/server';
import { readPayload, writePayload } from '@/lib/stats-payloads';

// SUDOCLUE ONLY (owner, 2026-10-30): "for this puzzle only, can we ask for a star rating and an easy
// hard, via a very simple popup. easy hard can be scaled 1-5". The pop-up (app/sudoclue/SudoclueClient.jsx)
// opens once per board, 10 seconds after the game ends, never during play. One small stored payload per
// board in stats_payloads, keyed by quizId, one vote per browser (a re-vote replaces the old one).
//   POST { quizId, stars 1-5, hard 1-5, anonId }      GET ?quizId=sudoclue-10-30-26 -> counts and averages
export const dynamic = 'force-dynamic';

const QUIZ_RE = /^sudoclue-\d{1,2}-\d{1,2}-\d{2}$/;
const ANON_RE = /^[A-Za-z0-9_-]{8,64}$/;
const key = (q) => `sudoclue-rating:${q}`;
const one = (v) => (Number.isInteger(v) && v >= 1 && v <= 5 ? v : null);

function summary(votes) {
  const list = Object.values(votes || {});
  const stars = list.map((v) => v[0]).filter(Boolean), hard = list.map((v) => v[1]).filter(Boolean);
  const avg = (a) => (a.length ? Math.round((a.reduce((x, y) => x + y, 0) / a.length) * 100) / 100 : null);
  const hist = (a) => [1, 2, 3, 4, 5].map((k) => a.filter((x) => x === k).length);
  return { n: list.length, stars: { avg: avg(stars), hist: hist(stars) }, hard: { avg: avg(hard), hist: hist(hard) } };
}

export async function POST(request) {
  try {
    const b = await request.json();
    const quizId = typeof b.quizId === 'string' ? b.quizId : '';
    const anon = typeof b.anonId === 'string' && ANON_RE.test(b.anonId) ? b.anonId : null;
    const stars = one(b.stars), hard = one(b.hard);
    if (!QUIZ_RE.test(quizId) || !anon || (!stars && !hard)) return NextResponse.json({ error: 'bad request' }, { status: 400 });
    const cur = await readPayload(key(quizId));
    const votes = (cur && cur.payload && cur.payload.votes) || {};
    if (Object.keys(votes).length >= 20000 && !votes[anon]) return NextResponse.json({ ok: true });
    votes[anon] = [stars, hard];
    await writePayload(key(quizId), { votes });
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ error: 'invalid request' }, { status: 400 });
  }
}

export async function GET(request) {
  const quizId = new URL(request.url).searchParams.get('quizId') || '';
  if (!QUIZ_RE.test(quizId)) return NextResponse.json({ error: 'quizId required' }, { status: 400 });
  const cur = await readPayload(key(quizId));
  return NextResponse.json({ quizId, ...summary(cur && cur.payload && cur.payload.votes) }, { headers: { 'Cache-Control': 'no-store' } });
}
