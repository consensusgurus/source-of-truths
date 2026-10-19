import { NextResponse } from 'next/server';
import { GET as combinedGET } from '../daily-combined/route';
import { POLY_LEGS, legPoints, polyScore, tierFor, legTitle } from '@/lib/polymath';

// GET /api/quiz/polymath?anonId=&email=&date=&fresh=1
//
// POLYMATH (owner, 2026-10-19): the day's Trivia, Math and English Gauntlet
// boards joined by player. Nothing is stored: each circuit board is computed by
// the same daily-combined route every run already ends on (called in process,
// with ?all=1 so nobody outside its top 30 is lost), and the join is done here.
// A player ranks once all three runs are finished; ties break on the combined
// clock. Scoring lives in lib/polymath.js.
export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';
export const maxDuration = 60;

const CACHE = { 'Cache-Control': 'public, s-maxage=30, stale-while-revalidate=90' };
const NO_STORE = { 'Cache-Control': 'no-store' };
const BOARD_MAX = 100;

async function circuitBoard(id, base) {
  const qs = new URLSearchParams(base);
  qs.set('circuit', id);
  qs.set('all', '1');
  try {
    const res = await combinedGET(new Request(`https://mindloftdaily.com/api/quiz/daily-combined?${qs.toString()}`));
    const d = await res.json();
    return d && !d.error ? d : null;
  } catch (e) {
    return null;
  }
}

// The viewer's leg on one board: 'done' when every game in the run is played
// (not abandoned), 'started' when some are.
function viewerLeg(leg, d) {
  const out = { id: leg.id, state: 'none', right: 0, time: 0, rank: null };
  if (!d) return out;
  const me = d.me || null;
  const keys = (d.games || []).map((g) => g.key);
  if (me) {
    const pg = me.perGame || {};
    const played = keys.filter((k) => pg[k] && !pg[k].abandoned).length;
    out.right = Number(me.total) || 0;
    out.time = Number(me.timeTotal) || 0;
    out.rank = me.rank || null;
    out.state = keys.length && played === keys.length ? 'done' : (played > 0 ? 'started' : 'none');
  } else if (d.meProvisional) {
    out.right = Number(d.meProvisional.total) || 0;
    out.time = Number(d.meProvisional.timeTotal) || 0;
    out.state = out.right > 0 ? 'started' : 'none';
  }
  return out;
}

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const base = {};
  for (const k of ['anonId', 'email', 'date', 'fresh']) {
    const v = (searchParams.get(k) || '').trim();
    if (v) base[k] = v;
  }
  const fresh = base.fresh === '1' || base.fresh === 'true';

  const boards = await Promise.all(POLY_LEGS.map((l) => circuitBoard(l.id, base)));
  const day = (boards.find((b) => b && b.date) || {}).date || null;

  // Join every ranked row across the three boards.
  const byKey = new Map();
  boards.forEach((d, li) => {
    for (const r of (d && d.overallAll) || []) {
      if (!r || !r.userKey) continue;
      let p = byKey.get(r.userKey);
      if (!p) { p = { userKey: r.userKey, username: r.username, right: [null, null, null], time: 0 }; byKey.set(r.userKey, p); }
      p.right[li] = Number(r.total) || 0;
      p.time += Number(r.timeTotal) || 0;
      if (!p.username && r.username) p.username = r.username;
    }
  });
  const full = [];
  for (const p of byKey.values()) {
    if (p.right.some((x) => x == null)) continue;
    const pts = p.right.map((x, i) => legPoints(POLY_LEGS[i].id, x));
    full.push({ userKey: p.userKey, username: p.username, points: pts, right: p.right, score: polyScore(pts), time: p.time });
  }
  full.sort((a, b) => (b.score - a.score) || (a.time - b.time) || String(a.username || '').localeCompare(String(b.username || '')));
  let rank = 0, prev = null;
  full.forEach((r, i) => {
    const k = `${r.score}|${r.time}`;
    if (k !== prev) { rank = i + 1; prev = k; }
    r.rank = rank;
    r.tier = tierFor(r.score).name;
  });

  // The viewer.
  const legs = POLY_LEGS.map((l, i) => {
    const v = viewerLeg(l, boards[i]);
    return { ...v, points: v.state === 'done' ? legPoints(l.id, v.right) : null, title: v.state === 'done' ? legTitle(l.id, v.right) : '' };
  });
  const allDone = legs.every((x) => x.state === 'done');
  const myScore = allDone ? polyScore(legs.map((x) => x.points)) : null;
  const myTime = legs.reduce((a, x) => a + (x.time || 0), 0);
  const meKey = (boards.find((b) => b && b.me && b.me.userKey) || {}).me?.userKey || null;
  let myRank = null, provisional = false;
  if (myScore != null) {
    const mine = meKey ? full.find((r) => r.userKey === meKey) : null;
    if (mine) myRank = mine.rank;
    else {
      provisional = true;
      myRank = full.filter((r) => r.score > myScore || (r.score === myScore && r.time < myTime)).length + 1;
    }
  }
  const started = new Set();
  boards.forEach((d) => { for (const r of (d && d.overallAll) || []) started.add(r.userKey); });

  return NextResponse.json({
    date: day,
    legs: POLY_LEGS.map((l, i) => ({ id: l.id, name: l.name, short: l.short, href: l.href, mark: l.mark, field: boards[i] ? boards[i].overallField || 0 : 0 })),
    board: full.slice(0, BOARD_MAX).map((r) => ({ rank: r.rank, username: r.username, userKey: r.userKey, score: r.score, points: r.points, time: r.time, tier: r.tier })),
    field: full.length,
    started: started.size,
    me: {
      userKey: meKey,
      legs,
      done: legs.filter((x) => x.state === 'done').length,
      score: myScore,
      time: myTime,
      tier: myScore == null ? null : tierFor(myScore),
      rank: myRank,
      provisional,
    },
  }, { headers: fresh ? NO_STORE : CACHE });
}
