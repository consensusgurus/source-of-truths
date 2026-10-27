import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-server';
import { loadQuizResults } from '@/lib/quiz-results-load';
import { resolvePlayerKeys } from '@/lib/quiz-identity';
import { computeXpCached, computeTrophiesCached, iqPlayersFresh, iqSnapshotTrophies } from '@/lib/quiz-derived-cache';
import { buildProfile } from '@/lib/quiz-profile';
import { buildTrophyList } from '@/lib/quiz-trophies';

export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';

// Per-identity CDN cache (2026-08-08, Vercel cost fix).
//
// WHY: this route was 100% origin at ~2.6K calls and 27 MINUTES of function CPU
// per 12h, the single largest compute line on the account. The identity IS the
// query string (anonId / email / light / history), so a cache entry can never
// be served to a different player. That is the same argument
// /api/quiz/daily-status and /api/quiz/board already make for themselves.
//
// ONLY ANONYMOUS PLAYERS ARE CACHED (owner rule, 2026-08-08). A REGISTERED
// player always gets a live read, full stop. Their stats are the product they
// signed up for: rank, IQ Points and the Stat Hub have to be right the moment
// they look, not within two minutes. So the cache is a pure win on guests, who
// have no standing to track, and is never allowed to make a member's own
// numbers lag. Measured on the day this shipped: 42% of plays were anonymous,
// so the cache still absorbs a large share of the load.
//
// Two more carve-outs, both for correctness rather than policy:
//
// `fresh=1` opts OUT. This is what keeps the ANONYMOUS end card exact: a guest
// finishes a puzzle, the card reads this route immediately after POSTing the
// result row, and a stale profile would report zero IQ earned and swallow the
// trophy unlock. Registered players are uncached anyway, so the flag is belt
// and braces for them and load-bearing for guests.
//
// A `found: false` answer is NEVER cached. A brand-new player's first row can
// land mid-window, and caching the miss would tell them they do not exist for
// another 30 seconds.
const CACHE_HEADERS = { 'Cache-Control': 'public, s-maxage=30, stale-while-revalidate=90' };
const NO_STORE_HEADERS = { 'Cache-Control': 'no-store' };

// GET /api/quiz/me?anonId=&email=&light=
// The current player's full XP profile + activity, resolved by the identity the
// quiz client stores in localStorage (email -> u:<id>, else anon -> a:<anon>).
// Includes the trophy case (minus the duels group: the quiz_duels tally is a
// per-view query this hot path skips; /api/quiz/player carries it).
//
// `light=1` returns the headline profile ONLY: level, activity, ranks, base and
// byCategory, with an empty `recent` and no `trophies`. Those two are the whole
// cost of this route (the per-play rank-movement simulation needs rankFor, and
// the trophy pass re-walks every row), and the surfaces that call it on page
// load, starting with the /quizzes homepage player bar, render neither. It is
// also why light is fast for EVERYONE: with no rankFor it shares one memo entry
// across all players, so the first request of a row-version pays and the rest
// are a map lookup. Callers that show the activity log or the trophy case
// (Stat Hub, player profile, the post-game unlock toast) simply omit the flag.
//
// `history=1` is the MIDDLE mode, added 2026-08-08 for the ~47 daily-game
// clients. They call this route on mount for exactly two things: `recent`, fed
// to mergeServerStats for the cross-device stats/streak merge, and the name +
// IQ rank for the player chip. They read no trophies and no per-entry rank
// movement. Full mode was handing them both: `rankFor` pushes the result into
// the perPlayer memo (cap 4, so with real concurrency it thrashed to a ~0% hit
// rate) and the trophy pass re-walks every row. history keeps `recent` intact
// and drops only those two, which moves all 47 clients onto the SHARED memo
// entry every player reuses. Same bytes the clients actually consume, a
// fraction of the CPU.
export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const anonId = (searchParams.get('anonId') || '').trim() || null;
  const email = (searchParams.get('email') || '').trim() || null;
  const light = searchParams.get('light') === '1' || searchParams.get('light') === 'true';
  const history = searchParams.get('history') === '1' || searchParams.get('history') === 'true';
  const fresh = searchParams.get('fresh') === '1' || searchParams.get('fresh') === 'true';
  // full=1: the Stat Hub's exact path (live rank movement per game, live
  // trophies). Everything else reads the IQ snapshot with the asker
  // recomputed fresh, which is what cut this route's CPU (owner 2026-10-19).
  const full = searchParams.get('full') === '1' || searchParams.get('full') === 'true';
  try {
    let myKey = null, signed = false, username = null;
    const who = await resolvePlayerKeys(supabaseAdmin, { email, anonId });
    if (who.userId) { myKey = who.primary; signed = true; username = who.username; }
    else if (anonId) { myKey = `a:${anonId}`; }

    const { data, error } = await loadQuizResults(supabaseAdmin);
    if (error) { console.error('quiz me error', error); return NextResponse.json({ found: false }, { headers: NO_STORE_HEADERS }); }
    // Full mode: recentN large so the Stat Hub Activity log shows the player's
    // FULL play history (every game, exact timestamps), not just the last
    // handful, and rankFor so each of those entries carries its rank movement.
    // Light mode drops both, which is what makes its memo entry shareable.
    // ⚠️ recentN 1, NOT 0. computeXp finalizes with `p.recent.slice(-recentN)`,
    // and slice(-0) is slice(0), i.e. the WHOLE array: asking for zero recent
    // entries returns every one of them. Shipped that way for one deploy and a
    // light profile still carried 710 entries / 20KB. Ask for the smallest real
    // slice and drop it below.
    let snap = null;
    let players;
    if (full && !light && !history) {
      ({ players } = computeXpCached(data || [], { recentN: 100000, rankFor: myKey }));
    } else {
      const keys = [myKey, ...(who.keys || [])].filter(Boolean);
      ({ players, snap } = await iqPlayersFresh(data || [], { recentN: light ? 1 : 100000, keys }));
    }
    // A member with no entry under their account key has their rows filed under
    // a browser anon they never joined from, so read the profile from that key
    // rather than reporting an empty one. /api/quiz/daily-status attributes those
    // rows permanently the next time it runs, after which this stops triggering.
    let profileKey = myKey;
    if (myKey && !players.has(myKey)) {
      for (const k of who.keys) if (players.has(k)) { profileKey = k; break; }
    }
    const profile = buildProfile(players, profileKey, { signed, username });
    // buildProfile copies `recent` into a fresh array, so emptying it here can
    // never reach back into the shared memo entry.
    if (light) profile.recent = [];
    if (!light && !history && profile.found) {
      const res = snap ? iqSnapshotTrophies(snap) : computeTrophiesCached(data || [], players);
      profile.trophies = buildTrophyList(res, profileKey, { includeDuels: false });
    }
    // profile.signed is `signed || !p.isAnon`, so it catches a registered player
    // whether they were resolved by email or by an anon id already claimed by an
    // account. Anything other than a found, unclaimed, non-fresh guest is live.
    const cacheable = profile.found && !profile.signed && !fresh;
    return NextResponse.json(profile, {
      headers: cacheable ? CACHE_HEADERS : NO_STORE_HEADERS,
    });
  } catch (e) {
    console.error('quiz me exception', e);
    return NextResponse.json({ found: false }, { headers: NO_STORE_HEADERS });
  }
}
