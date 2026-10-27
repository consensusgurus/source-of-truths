import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-server';
import { loadQuizResults } from '@/lib/quiz-results-load';
import { findQuizIdentity } from '@/lib/quiz-identity';
import { earnedTrophyIds } from '@/lib/quiz-trophies';
import { iqPlayersFresh, rankWithFresh, iqSnapshotTrophies } from '@/lib/quiz-derived-cache';

export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';

// GET /api/quiz/iq-standing?anonId=&email=[&game=<dailyKey>][&quizId=][&span=2]
// Powers the IQ Points tile on the daily end card: what the game just finished
// paid, what the player has banked today, and their slot in the global IQ
// ranking with `span` players above and below.
//
// Per-player, so it is never CDN-cached — but it reads the same in-process
// quiz_results cache every other stats route uses, so the marginal cost over
// /api/quiz/daily-combined (already fetched by the same card) is the ranking
// sort, not another table scan.
//
// `gained` is deliberately NULL until the just-finished /api/quiz/result row is
// visible. The card POSTs that row as it mounts, so the first read here often
// predates it; reporting null lets the client retry instead of showing the
// PREVIOUS game's number as if it were this one. Identify the row by exact
// `quizId` when the caller knows it, else by `game` (the daily key) matched
// against today's Eastern date — daily quizIds are `<key>-<M>-<D>-<YY>` and no
// daily key is a prefix of another, so the prefix match is unambiguous.

const ET = 'America/New_York';
function etDate(ts) {
  try { return new Date(ts).toLocaleDateString('en-CA', { timeZone: ET }); }
  catch (e) { return String(ts || '').slice(0, 10); }
}

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const anonId = (searchParams.get('anonId') || '').trim() || null;
  const email = (searchParams.get('email') || '').trim() || null;
  const quizId = (searchParams.get('quizId') || '').trim() || null;
  const game = (searchParams.get('game') || '').trim() || null;
  const span = Math.min(5, Math.max(1, Number(searchParams.get('span')) || 2));
  try {
    let myKey = null, signed = false, username = null;
    const ident = await findQuizIdentity(supabaseAdmin, { email, anonId });
    if (ident && ident.id) { myKey = `u:${ident.id}`; signed = true; username = ident.username || null; }
    else if (anonId) { myKey = `a:${anonId}`; }
    if (!myKey) return NextResponse.json({ found: false });

    // force: skip the cache's 5s burst TTL and run the cheap count+delta
    // refresh, so the result row this card POSTed moments ago is actually
    // visible. A returning player merely saw a stale number without this; a
    // FIRST-TIME player was missing from the snapshot altogether and the card
    // rendered a bare dash with no IQ at all (owner fix 2026-07-31).
    const { data, error } = await loadQuizResults(supabaseAdmin, { force: true });
    if (error) { console.error('iq-standing error', error); return NextResponse.json({ found: false }); }
    // recentN covers a full day's daily slate with room to spare, so "banked
    // today" is a complete sum rather than a truncated one.
    // Memoized: this derivation is identical for every player finishing a game
    // against the same rows, and it was the bulk of this route's 757ms.
    // The asker is recomputed fresh from their own rows (so the just-finished
    // game's +N is in it); the rest of the field is the shared IQ snapshot,
    // up to 30 minutes old. See lib/quiz-derived-cache, THE IQ SNAPSHOT.
    const { players, snap } = await iqPlayersFresh(data || [], { recentN: 200, keys: [myKey] });
    const me = players.get(myKey);
    // Brand-new player whose very first row has not surfaced yet: report a real
    // zeroed standing rather than found:false. found:false made the card drop
    // the whole sub-line and settle on a dash, so a first-time guest finished
    // their first ever puzzle and was told nothing. gained stays null, which
    // keeps the client retrying until the row lands and the real figures fill in.
    if (!me) {
      return NextResponse.json({
        found: true,
        firstPlay: true,
        signed,
        username,
        provisional: !signed,
        xp: 0,
        level: 1,
        rank: null,
        total: rankWithFresh(snap, players).length,
        gained: null,
        gainedFor: null,
        todayGained: 0,
        trophies: [],
        window: [],
      });
    }

    // Guests are ranked here exactly as they are on /api/quiz/xp (every
    // anonymous player gets a numbered slot); `provisional` tells the card to
    // badge the rank as unclaimed rather than hide it.
    // Memoized: identical for every player against the same rows, and the end
    // card's retry ladder can ask for it six times for one finished game.
    const ranked = rankWithFresh(snap, players, [myKey]);
    const idx = ranked.findIndex((p) => p.key === myKey);
    // Always return the full 2*span+1 rows when the board is that long, sliding
    // the window instead of truncating it: the #1 player would otherwise see only
    // themselves plus two below, and the last player only two above.
    const size = span * 2 + 1;
    // Clamp so the window never runs off the end (a board of exactly `size`
    // viewed from its last rank would otherwise slice short and return 3 rows).
    const from = Math.max(0, Math.min(Math.max(0, idx - span), ranked.length - size));
    const windowRows = idx < 0 ? [] : ranked.slice(from, from + Math.min(size, ranked.length)).map((p, i) => ({
      rank: from + i + 1,
      name: p.name,
      xp: Math.round(p.xp),
      level: p.level,
      me: p.key === myKey,
    }));

    // Earned trophy ids (duels excluded) so the daily end card can pop the
    // unlock toast the moment a game crosses a threshold.
    const trophyIds = earnedTrophyIds(iqSnapshotTrophies(snap), myKey);

    const recent = Array.isArray(me.recent) ? me.recent : [];
    const today = etDate(Date.now());
    // ONLY a COMPLETED row can be the game just finished. The abandon-flush
    // writes a real row (score 0) when a player leaves a game in progress, and
    // `recent` is newest-first, so before the finish landed this find returned
    // that abandon and reported gained: 0. The card renders a 0 as "+0" and only
    // retries while gained is null, so it stopped on the very first read and
    // showed a zero gain plus a pre-finish ranking until the page was reloaded
    // (owner-reported 2026-08-01: Parker, finished after two abandons). Skipping
    // abandoned rows leaves gained null in exactly that window, which is what
    // keeps the client's retry ladder running until the real row is visible.
    const played = (r) => !r.abandoned;
    const row = quizId
      ? recent.find((r) => r.quizId === quizId && played(r))
      : (game
        ? recent.find((r) => r.quizId && r.quizId.startsWith(game + '-') && etDate(r.createdAt) === today && played(r))
        : recent.find(played));
    const todayGained = Math.round(recent
      .filter((r) => r.createdAt && etDate(r.createdAt) === today)
      .reduce((s, r) => s + (Number(r.xp) || 0), 0));

    return NextResponse.json({
      found: true,
      signed,
      username,
      provisional: !signed,
      xp: Math.round(me.xp),
      level: me.level,
      rank: idx >= 0 ? idx + 1 : null,
      total: ranked.length,
      gained: row ? Math.round(row.xp) : null,
      gainedFor: row ? row.quizId : null,
      todayGained,
      trophies: trophyIds,
      window: windowRows,
    });
  } catch (e) {
    console.error('iq-standing exception', e);
    return NextResponse.json({ found: false });
  }
}
