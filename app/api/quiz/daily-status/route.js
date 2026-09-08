import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-server';
import { loadQuizResultsCached } from '@/lib/quiz-results-cache';
import { dailySolvedRow } from '@/lib/daily-games';
import { resolvePlayerKeys, attributeAnonGames } from '@/lib/quiz-identity';
import { computeXpCached, dailyStandingCached } from '@/lib/quiz-derived-cache';

// Midnight "today" in US Eastern (handles EST/EDT) as a UTC epoch ms. Same
// helper as /api/quiz/today and /api/quiz/totals, so all three roll over
// together. Computed ONCE per request, which is the whole point: see the note
// on gainedToday below.
function startOfEasternTodayUTC() {
  const tz = 'America/New_York';
  const now = new Date();
  const ymd = new Intl.DateTimeFormat('en-CA', { timeZone: tz, year: 'numeric', month: '2-digit', day: '2-digit' }).format(now);
  for (const offH of [4, 5]) {
    const guess = Date.parse(`${ymd}T00:00:00.000Z`) + offH * 3600 * 1000;
    const p = new Intl.DateTimeFormat('en-CA', { timeZone: tz, year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', hour12: false })
      .formatToParts(new Date(guess))
      .reduce((a, x) => { a[x.type] = x.value; return a; }, {});
    if (`${p.year}-${p.month}-${p.day}` === ymd && p.hour === '00') return guess;
  }
  return Date.parse(`${ymd}T04:00:00.000Z`);
}

export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';
// Per-player, small payload, safe to cache briefly at the edge (the query string
// is the player's own identity, so cache entries never cross users).
const CACHE_HEADERS = { 'Cache-Control': 'public, s-maxage=30, stale-while-revalidate=90' };

// Daily-game quizIds look like `<game>-<M>-<D>-<YY>` (e.g. crux-7-14-26). This
// matches only those, so a normal quiz that happens to share a prefix can't leak
// in.
const DAILY_RE = /^(crux|emcee|garble|links|span|dating|tally|suds|quilt|circa|extra|carve|stet|outwit|tuck|alibi|cipher|ping|warmer|jester|sworn|outrank|shards|axiom|hearsay|venn|stands|bracket|lode|etch|hedge|listed|mate|four|park|impound|junkyard|check|rung|hinge|sums|crunch|taire|fib|streak|feud|babel|glyph|hands|finesse|chain|turn|suffice|strata|redact|paths|deep|anon|blocks|chomp|sweep|docket|blitz|blitzed|defend|cages|sando|barter|plot|sixes|niche|shoe|queen|towers|mercury|polka|atlas|sport|calc|encore|biz|flank|knight|script|quotes|focus|thread|slot|whittle|diag)-\d+-\d+-\d+$/;

// GET /api/quiz/daily-status?anonId=&email=
// The player's daily-game history, resolved by the identity the quiz client
// stores (email -> account, else this browser's anon). Lets /daily and the
// end-screen cross-promo show played/completed marks that FOLLOW THE USER across
// devices — localStorage only knows this one browser. Reads the shared in-process
// quiz_results cache (no fresh full-table query) per the egress guardrails.
// Also returns `todayXp` (IQ Points earned today, ET, across every game) and
// `rankChange` (places climbed on the global IQ board since the day started,
// negative = dropped, null = no standing to move from). Both feed the "Your day"
// strip. `dayRank` / `dayField` are TODAY'S board rather than the lifetime one:
// where this player sits among everyone who has banked IQ today, and how big
// that field is (owner, 2026-08-08 - the header's Daily rank box).
export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const anonId = (searchParams.get('anonId') || '').trim() || null;
  const email = (searchParams.get('email') || '').trim() || null;
  try {
    // EVERY key this player's rows can be filed under, not just one. Matching on
    // a single key is what hid a game played on one device from every other
    // device; see resolvePlayerKeys.
    const who = await resolvePlayerKeys(supabaseAdmin, { email, anonId });
    const myKey = who.primary;
    const myKeys = who.keys;
    if (!myKey) return NextResponse.json({ played: [], completed: [], abandoned: [], unsolved: [], inProgress: [] }, { headers: CACHE_HEADERS });

    const { data, error } = await loadQuizResultsCached(supabaseAdmin);
    if (error) {
      console.error('daily-status error', error);
      return NextResponse.json({ played: [], completed: [], abandoned: [], unsolved: [], inProgress: [] });
    }
    const played = new Set();
    const completed = new Set();
    // Finished, not abandoned, and not solved. The slate keeps only the games
    // that never showed the answer (KEEPS_ANSWER); the rest are reported here
    // so any other caller can make its own call.
    const unsolved = new Set();
    const abandonedOnly = new Set();
    // Anon ids of this player's own rows that were never attributed to their
    // account. Collected for free in the pass below and healed after it.
    const orphans = new Set();
    // Per-game archive progress, free from this same pass: how many of a game's
    // days this player has played, over how many days that game has ever run.
    // The denominator counts DISTINCT dated ids across every player's rows,
    // which is the same set the per-game archive calendar draws from, so the
    // closed row can show the figure without waiting on the drawer's own fetch.
    const archiveAll = new Map();   // game key -> Set(dated quiz id)
    const archiveMine = new Map();
    const bump = (m, key, qid) => { let v = m.get(key); if (!v) { v = new Set(); m.set(key, v); } v.add(qid); };
    for (const r of (data || [])) {
      const qid = r && r.quiz_id;
      if (!qid || !DAILY_RE.test(qid)) continue;
      const gkey = qid.slice(0, qid.indexOf('-'));
      bump(archiveAll, gkey, qid);
      const pk = r.user_id ? `u:${r.user_id}` : (r.anon_id ? `a:${r.anon_id}` : null);
      if (!pk || !myKeys.has(pk)) continue;
      if (!r.user_id && r.anon_id) orphans.add(r.anon_id);
      if (!r.abandoned) bump(archiveMine, gkey, qid);
      // An abandoned in-progress row (opened the board, made a move, then left
      // before finishing) is NOT a played game. It still counts as a play for
      // the leaderboard fallback in daily-combined, but here it is reported
      // separately as `abandoned` (started, not finished), never played/completed.
      if (r.abandoned) { abandonedOnly.add(qid); continue; }
      played.add(qid);
      // THE VERDICT, NOT THE SCORE (owner, 2026-08-09). Every daily posts
      // `correct: status === 'won' ? 1 : 0`, stored as correct_count, so the
      // solved/unsolved call is already in the row and does not have to be
      // inferred. score === total was wrong for the games that score by
      // EFFICIENCY rather than by answers found: Parker, Rung and Taire hand a
      // sloppy but genuine solve 7 out of 10, and this route has been calling
      // those unfinished. The test now lives in dailySolvedRow so this route and
      // the archive calendar in api/quiz/daily-game cannot drift; it holds the
      // legacy fallback and the one game whose win is a stretch benchmark rather
      // than its completion (Babel, see SOLVES_ON_SCORE).
      const solved = dailySolvedRow(r);
      if (solved) completed.add(qid); else unsolved.add(qid);
    }
    // A SOLVED ATTEMPT WINS (owner, 2026-08-09). A replayable game can carry
    // several rows for one drop: lose it, come back, solve it. The losing row
    // put the drop in `unsolved` and the winning one put it in `completed`, and
    // with both sets populated the slate went on calling it incomplete. Once any
    // attempt has solved a drop the player has the answer, so the drop is
    // complete whatever its other rows say. (The LEADERBOARD is unaffected: it
    // still scores the first attempt, per scoreGame in lib/daily-combined.)
    for (const q of completed) unsolved.delete(q);
    // STARTED AND STILL OPEN, from daily_in_progress (migration 52). This is
    // the signal that actually crosses devices: an abandoned row only exists
    // when the exit fired `pagehide`, which a backgrounded phone frequently
    // never does. A hint is SUPERSEDED rather than deleted, so anything the
    // player has since played, completed or abandoned is dropped here and
    // finishing a game costs no write. Wrapped: until the migration is applied
    // the table is missing, and this route's real job must still answer.
    const inProgress = [];
    try {
      const { data: hints, error: hintErr } = await supabaseAdmin
        .from('daily_in_progress')
        .select('quiz_id')
        .in('player_key', [...myKeys]);
      if (hintErr) throw hintErr;
      for (const h of (hints || [])) {
        const qid = h && h.quiz_id;
        if (!qid || !DAILY_RE.test(qid)) continue;
        if (played.has(qid) || completed.has(qid) || abandonedOnly.has(qid)) continue;
        inProgress.push(qid);
      }
    } catch (e) {
      const missing = e && (e.code === '42P01' || /does not exist|schema cache/i.test(e.message || ''));
      if (!missing) console.error('daily-status in-progress', e);
    }

    // Report a game as abandoned only when the player never finished it.
    const abandoned = [...abandonedOnly].filter((q) => !played.has(q));
    // Per-game consecutive-day streaks (ET days), counted back from today.
    // Today is optional (a live streak shows before the player has played
    // today's puzzle); any earlier missing day breaks the chain. Only finished
    // games count (abandoned rows never reach `played`). Streaks under 2 are
    // omitted; lookback capped so the loop stays trivial.
    const streaks = {};
    // SITE-WIDE STREAK (owner, 2026-08-14). The per-game map below answers a
    // narrower question than a reader means by "streak": someone who plays five
    // DIFFERENT games across five days has no per-game run at all and would
    // read as having none. So the same backward walk also runs over the UNION
    // of every game's day set. It costs one more pass over data already in
    // hand and no extra query.
    let streak = 0;
    let streakGame = null;
    let streakGameDays = 0;
    let playedToday = false;
    try {
      const et = new Date(new Date().toLocaleString('en-US', { timeZone: 'America/New_York' }));
      const byGame = new Map();
      for (const qid of played) {
        const m = /^([a-z]+)-(\d+)-(\d+)-(\d+)$/.exec(qid);
        if (!m) continue;
        if (!byGame.has(m[1])) byGame.set(m[1], new Set());
        byGame.get(m[1]).add(`${m[2]}-${m[3]}-${m[4]}`);
      }
      const MAX_BACK = 120;
      for (const [g, days] of byGame) {
        let s = 0;
        for (let i = 0; i < MAX_BACK; i++) {
          const d = new Date(et); d.setDate(et.getDate() - i);
          const key = `${d.getMonth() + 1}-${d.getDate()}-${d.getFullYear() % 100}`;
          if (days.has(key)) s++;
          else if (i === 0) continue;
          else break;
        }
        if (s >= 2) streaks[g] = s;
      }
      const allDays = new Set();
      for (const days of byGame.values()) for (const d of days) allDays.add(d);
      const keyOf = (d) => `${d.getMonth() + 1}-${d.getDate()}-${d.getFullYear() % 100}`;
      let ss = 0;
      for (let i = 0; i < MAX_BACK; i++) {
        const d = new Date(et); d.setDate(et.getDate() - i);
        if (allDays.has(keyOf(d))) ss++;
        else if (i === 0) continue; // today is optional, exactly as above
        else break;
      }
      streak = ss;
      playedToday = allDays.has(keyOf(et));
      // The single game most worth protecting. Ties go to the alphabetically
      // first so the pick is stable between requests rather than following
      // whatever order the day sets happened to iterate in.
      for (const [g, n] of Object.entries(streaks)) {
        if (n > streakGameDays || (n === streakGameDays && streakGame && g < streakGame)) {
          streakGameDays = n; streakGame = g;
        }
      }
    } catch (e) {}
    // WHEN THEY LAST PLAYED.
    // It comes off rows already in hand, so it costs no query, and it is what
    // tells the home's arrival (app/StageWelcome.jsx) a resumption from a return.
    let lastPlayed = null;
    try {
      const et2 = new Date(new Date().toLocaleString('en-US', { timeZone: 'America/New_York' }));
      const todayKey = `${et2.getMonth() + 1}-${et2.getDate()}-${et2.getFullYear() % 100}`;
      let newest = -1;
      for (const qid of played) {
        const m = /^[a-z]+-(\d+)-(\d+)-(\d+)$/.exec(qid);
        if (!m) continue;
        const t = Date.UTC(2000 + Number(m[3]), Number(m[1]) - 1, Number(m[2]));
        if (t > newest) { newest = t; lastPlayed = `${m[1]}-${m[2]}-${m[3]}`; }
      }
    } catch (e) {}
    // Today's IQ Points (ET), for the "Your day" strip. Computed HERE rather than
    // in its own request because this route already holds the rows and the strip
    // already fetches it, and the 30s edge cache bounds the cost of the full
    // computeXp pass. IQ needs per-quiz difficulty, which is derived from every
    // row, so there is no cheaper single-player shortcut. Wrapped so a failure
    // degrades to null instead of breaking played/completed, this route's real job.
    let todayXp = null;
    let rankChange = null;
    let dayRank = null;
    let dayField = null;
    try {
      // computeXpCached, not computeXp: this derivation is identical for every route
      // and every player against the same rows, and it walks all ~34,700 of them.
      // Going through the shared memo means the first caller after a row lands pays
      // and the rest get a map lookup.
      const { players } = computeXpCached(data || [], { recentN: 400 });
      // Fall back across the player's other keys: a member who played today as a
      // guest on this browser has that day's IQ filed under a:<anon>, so looking
      // only under the account key reports a zero day.
      let xpKey = myKey;
      let me = players.get(xpKey);
      if (!me) { for (const k of myKeys) if (players.has(k)) { xpKey = k; me = players.get(k); break; } }
      if (me) {
        // Today's gain and the two field-wide rankings (now, and on the IQ
        // everyone held before today) are the same for every player against the
        // same rows, so they are memoized per row set + ET day. Ranking the field
        // twice this way counts OTHER players passing you, which a sum of your
        // own per-play rankDelta would miss; only the lookup below is personal.
        const dayStart = startOfEasternTodayUTC();
        const st = dailyStandingCached(data || [], players, { dayStartMs: dayStart, recentN: 400 });
        const { gained, posNow, posThen } = st;

        const mineToday = gained.get(xpKey) || 0;
        todayXp = Math.round(mineToday);

        // Today's board only ranks players who have banked something today, so a
        // player who has not played yet is simply not on it: report nulls rather
        // than a phantom last place.
        if (mineToday > 0 && st.posDay) {
          // The field is the whole pool, guests included, which is the same
          // denominator every per-game "#N of M" on the site already prints --
          // and it is the count of everyone who PLAYED today, the same figure
          // the home board prints as "of N players", not the smaller count of
          // players who banked IQ. Falls back to the banked count only if the
          // wide one is somehow unavailable.
          dayField = st.dayFieldAll || st.dayField || null;
          // A REGISTERED PLAYER READS THE REGISTERED BOARD'S OWN NUMBER, so the
          // cap agrees with the tiles, the end cards and the board panels
          // instead of quoting a gappy full-field position none of them show.
          if (st.posDayReg && st.posDayReg.has(xpKey)) {
            dayRank = st.posDayReg.get(xpKey);
          } else {
            // A GUEST HAS NO PLACE ON THAT BOARD, so they are slotted into it
            // by what they earned today -- and NEVER AHEAD OF A REGISTERED
            // PLAYER (owner ruling, 2026-09-04). Hence >=, not >: a guest level
            // with a named player lands behind them rather than sharing or
            // taking the slot. Compared on the rounded figure the cap actually
            // prints, so two days that display the same IQ rank the same.
            //
            // regDayGained is descending, so the first row that is not ahead
            // ends the walk.
            const mine = Math.round(mineToday);
            let ahead = 0;
            for (const g of (st.regDayGained || [])) {
              if (Math.round(g) >= mine) ahead += 1; else break;
            }
            dayRank = ahead + 1;
          }
        }

        // A player whose first ever game is today had no standing to move from.
        if ((me.xp || 0) - mineToday > 0) {
          const now = posNow.get(xpKey) || 0;
          const then = posThen.get(xpKey) || 0;
          if (now > 0 && then > 0) rankChange = then - now; // positive = climbed
        }
      }
    } catch (e) { console.error('daily-status todayXp', e); }

    // COMMUNITY RANK (owner, 2026-08-25): where this player sits on the 90-day
    // community board at /quizzes/community, out of every REGISTERED user.
    //
    // That board ranks by referral credits in a rolling window, and most of the
    // roster has brought nobody in, so the zero tail is enormous. Ordering it by
    // anything else (join date, IQ) would invent a ranking the board itself does
    // not have, so EVERY player on the same credit count shares one rank:
    //   rank = 1 + the number of users with STRICTLY more credits in the window.
    // A player on zero therefore reads "#62 of 1,204" alongside everyone else on
    // zero, which is honest about what the figure measures.
    //
    // Only a registered account has a place here (the denominator is
    // quiz_users), which is also the only case the header renders the cell in.
    // Wrapped like every other extra on this route: a missing quiz_referrals
    // table or a failed read reports null and the cell simply hides.
    let communityRank = null;
    let communityTotal = null;
    let communityCredits = null;
    try {
      if (who.userId) {
        const since = new Date(Date.now() - 90 * 86400000).toISOString();
        const [refRes, userRes] = await Promise.all([
          supabaseAdmin
            .from('quiz_referrals')
            .select('referrer_user_id')
            .gte('created_at', since)
            .limit(20000),
          supabaseAdmin
            .from('quiz_users')
            .select('id', { count: 'exact', head: true }),
        ]);
        // An error here must NOT fall through to an empty tally: that would
        // count zero players ahead and report every reader as #1.
        if (refRes.error) throw refRes.error;
        if (userRes.error) throw userRes.error;
        const tally = new Map();
        for (const r of refRes.data || []) {
          if (!r || !r.referrer_user_id) continue;
          tally.set(r.referrer_user_id, (tally.get(r.referrer_user_id) || 0) + 1);
        }
        const mine = tally.get(who.userId) || 0;
        let ahead = 0;
        for (const n of tally.values()) if (n > mine) ahead += 1;
        communityCredits = mine;
        communityRank = ahead + 1;
        communityTotal = (typeof userRes.count === 'number' && userRes.count > 0) ? userRes.count : null;
      }
    } catch (e) {
      const missing = e && (e.code === '42P01' || e.code === '42703' || /does not exist|schema cache/i.test(e.message || ''));
      if (!missing) console.error('daily-status community', e);
    }
    // Self-healing merge (2026-08-09). Rows this account owns by anon but that
    // were never attributed (played as a guest on a device that never joined)
    // stay invisible to every derivation keyed on u:<id>: IQ Points, trophies,
    // and the public boards. The pass above already found them for free, so
    // attribute them once. attributeAnonGames only touches rows whose user_id is
    // still null, which makes this idempotent AND self-extinguishing: after the
    // first request there are no orphans left and it never fires again.
    if (who.userId && who.username && orphans.size) {
      try {
        for (const a of [...orphans].slice(0, 10)) {
          await attributeAnonGames(supabaseAdmin, a, { id: who.userId, username: who.username });
        }
      } catch (e) { console.error('daily-status attribute', e); }
    }
    const archive = {};
    for (const [k, all] of archiveAll) {
      archive[k] = { total: all.size, played: (archiveMine.get(k) || new Set()).size };
    }
    return NextResponse.json({ played: [...played], completed: [...completed], unsolved: [...unsolved], abandoned, inProgress, streaks, streak, streakGame, streakGameDays, playedToday, todayXp, rankChange, dayRank, dayField, communityRank, communityTotal, communityCredits, archive, lastPlayed }, { headers: CACHE_HEADERS });
  } catch (e) {
    console.error('daily-status exception', e);
    return NextResponse.json({ played: [], completed: [], abandoned: [], unsolved: [], inProgress: [] });
  }
}
