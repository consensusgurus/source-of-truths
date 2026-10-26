import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-server';
import { PUZZLES as P_pricer } from '@/app/pricer/puzzles';
import { PUZZLES as P_dealer } from '@/app/dealer/puzzles';
import { PUZZLES as P_realtor } from '@/app/realtor/puzzles';
import { PUZZLES as P_agent } from '@/app/agent/puzzles';
import { PUZZLES as P_curator } from '@/app/curator/puzzles';

// THE CROWD ON ONE PRICE TAG (owner, 2026-10-25). Two things about how everyone
// else did on one price game's day, for the reveal:
//
//   bps   every finished player's FIRST-guess miss in basis points, sorted, so
//         the client can say what share of players were further off than you.
//         Read off price_tiebreak, which every v2 row carries (2026-10-11 on).
//   bins  everyone's first guess on a log strip AROUND the real price, from a
//         quarter of it to four times it, in 16 equal steps, plus the median.
//         Read off first_guess (migration 62); empty until that column exists
//         and has rows.
//
// The price is looked up HERE, from the banks, never taken from the request:
// a price parameter would let anyone test candidate prices against the stored
// misses until one fit.
//
// NEVER A PRICE. The strip is built from guess / price, never from the guesses
// themselves: a median of raw guesses would hand anyone the day's answer before
// they played. Nothing here can be turned back into cents without the price.

export const dynamic = 'force-dynamic';
const PRICE_RE = /^(pricer|dealer|realtor|agent|curator)-(\d{1,2})-(\d{1,2})-(\d{2})$/;
const HEADERS = { 'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=240' };
const BIN_LO = -2;     // log2(guess / price): a quarter of the price
const BIN_HI = 2;      // four times the price
const BIN_N = 16;
const PRICE_OF = new Map();
for (const bank of [P_pricer, P_dealer, P_realtor, P_agent, P_curator]) for (const p of bank || []) if (p && p.quizId) PRICE_OF.set(p.quizId, Number(p.price));

async function rowsFor(quizId) {
  const cols = ['price_tiebreak, first_guess, abandoned, score', 'price_tiebreak, abandoned, score'];
  for (const c of cols) {
    const { data, error } = await supabaseAdmin.from('quiz_results').select(c).eq('quiz_id', quizId).limit(20000);
    if (!error) return { rows: data || [], hasFirst: c.includes('first_guess') };
    if (error.code !== '42703' && error.code !== 'PGRST204' && !/column|schema cache/i.test(error.message || '')) throw error;
  }
  return { rows: [], hasFirst: false };
}

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const quizId = String(searchParams.get('quizId') || '');
  const price = PRICE_OF.get(quizId);
  if (!PRICE_RE.test(quizId) || !price) return NextResponse.json({ error: 'bad quizId' }, { status: 400 });
  try {
    const { rows } = await rowsFor(quizId);
    const done = rows.filter((r) => !r.abandoned);
    const bps = done.map((r) => Number(r.price_tiebreak)).filter((v) => Number.isFinite(v) && v >= 0).map((v) => Math.round(v)).sort((a, b) => a - b).slice(0, 4000);
    let bins = null, median = null, nFirst = 0;
    // A row whose first guess disagrees with its own stored miss is from a
    // price the bank no longer holds (a corrected board); it stays off the strip.
    {
      const logs = [];
      for (const r of done) {
        const g = Number(r.first_guess);
        if (!Number.isFinite(g) || g <= 0) continue;
        const ratio = g / price;
        const b = Number(r.price_tiebreak);
        if (Number.isFinite(b)) {
          const miss = Math.max(ratio, 1 / ratio) - 1;
          if (Math.abs(miss * 10000 - b) > Math.max(5, b * 0.02)) continue;
        }
        logs.push(Math.log2(ratio));
      }
      nFirst = logs.length;
      if (nFirst) {
        bins = new Array(BIN_N).fill(0);
        const step = (BIN_HI - BIN_LO) / BIN_N;
        for (const l of logs) bins[Math.max(0, Math.min(BIN_N - 1, Math.floor((l - BIN_LO) / step)))] += 1;
        const s = logs.slice().sort((a, b) => a - b);
        median = Math.round(Math.pow(2, s[Math.floor(s.length / 2)]) * 1000) / 1000;
      }
    }
    return NextResponse.json({ quizId, n: bps.length, bps, nFirst, bins, median, lo: BIN_LO, hi: BIN_HI }, { headers: HEADERS });
  } catch (e) {
    return NextResponse.json({ error: 'db error' }, { status: 500 });
  }
}
