import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-server';
import { findQuizIdentity } from '@/lib/quiz-identity';
import { buildLeaderboardMatrix, playerPlacement } from '@/lib/quiz-anon';
import { parseUa, countryFromRequest, regionFromRequest, cityFromRequest, timezoneFromRequest, languageFromRequest, referrerHost, ipHashFromRequest, INTERNAL_HOST } from '@/lib/ua';
import { creditReferral } from '@/lib/referrals-server';
import { normalizeRefCode } from '@/lib/referrals';
import { normalizeCampaign } from '@/lib/campaigns';

export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';

function summarize(rows) {
  const plays = rows.length;
  const best = plays ? Math.max(...rows.map((r) => r.score)) : null;
  // Fastest time recorded AT the best score, across ALL completed plays
  // (anonymous included, not just the signed-up leaderboard). Lets the client
  // tell whether a finished run is the outright #1 (top score, fastest time).
  const topTime = best != null
    ? Math.min(...rows.filter((r) => r.score === best).map((r) => (r.time_elapsed ?? Infinity)))
    : null;
  // Two composable leaderboard axes (population x filter) -> 6 boards, keyed
  // "<population>:<filter>" in `leaderboards`. Anonymous players appear in every
  // view EXCEPT 'registered:*'; in particular 'all:first' lists everyone's first
  // attempt (anon included), which the "All players + First try" toggle shows.
  // Legacy flat keys are kept for the compact strip/snippet and older clients:
  // leaderboardFirst now resolves to 'all:first' so anonymous first plays are
  // no longer dropped.
  const leaderboards = buildLeaderboardMatrix(rows);
  const leaderboard = leaderboards['registered:all'];
  const leaderboardMobile = leaderboards['all:mobile'];
  const leaderboardFirst = leaderboards['all:first'];
  const leaderboardAll = leaderboards['all:all'];
  // Exact score distribution over ALL completed attempts, so the client can
  // report the real share of attempts a finished run beat (no modeled curve).
  const scoreDist = {};
  for (const r of rows) { const sv = Number(r.score) || 0; scoreDist[sv] = (scoreDist[sv] || 0) + 1; }
  return { plays, best, topTime: Number.isFinite(topTime) ? topTime : null, leaderboard, leaderboardMobile, leaderboardFirst, leaderboardAll, leaderboards, scoreDist };
}

// POST /api/quiz/result  { quizId, score, total, timeElapsed, email? }
// Records one completed game (this is what makes the play count + average
// real). If email matches a joined user, the result is attributed to them and
// feeds the leaderboard. Returns refreshed { plays, avg, leaderboard }.
//
// Scores are client-submitted; values are sanity-bounded here but not
// cryptographically verified - acceptable for a casual leaderboard.
export async function POST(request) {
  try {
    const body = (await request.json()) || {};
    const quizId = typeof body.quizId === 'string' ? body.quizId.trim() : '';
    const { score, total, timeElapsed, email } = body;
    // True only for an abandoned in-progress game (the abandon-flush posts it).
    // Normal completions omit it and default to false = completed.
    const abandoned = body.abandoned === true;
    const correct = Number.isInteger(body.correct) ? Math.max(0, Math.min(total, body.correct)) : null;
    // Pricer tiebreaker (migration 50): how far the player's guess landed from
    // the champion's real figure, so a tie on score is broken by the closest
    // guess. null when the player skipped, when the guess was unusable, or on
    // every other game, and null deliberately sorts LAST on the board. Its own
    // insert tier below, so a database without the column simply drops it.
    const priceTiebreak = typeof body.priceTiebreak === 'number' && Number.isFinite(body.priceTiebreak) && body.priceTiebreak >= 0
      ? Math.min(body.priceTiebreak, 1e15)
      : null;
    // HOW FAR A LOSING PLAYER GOT (migration 51). The End Game titles are
    // binary and post score 0 on a loss, which left every loser tied and the
    // board ranking them by who lost FASTEST. `progress` is that game's own
    // measure of depth reached (key moves found, pieces swept, boxes won,
    // discs held), used as a RANKING term only: the score is untouched, so a
    // loss still earns no completion or IQ Points. null on every other game
    // and on every historical row, and null falls back to the old guesses
    // term rather than sorting last, so no played day is reordered. Its own
    // insert tier below, so a database without the column simply drops it.
    const progress = Number.isInteger(body.progress) && body.progress >= 0 && body.progress <= 100000
      ? body.progress
      : null;
    const anonId = typeof body.anonId === 'string' && body.anonId.trim() ? body.anonId.trim().slice(0, 64) : null;
    // Traffic metadata: client may pass an explicit isMobile flag; otherwise we
    // derive it (and the browser/OS) from the user-agent. Country/region come
    // from Vercel's edge geo headers (null off-Vercel). All best-effort.
    const ua = parseUa(request.headers.get('user-agent'));
    const isMobile = typeof body.isMobile === 'boolean' ? body.isMobile : ua.isMobile;
    const country = countryFromRequest(request);
    const region = regionFromRequest(request);
    // Finer traffic metadata (migration 27). city/timezone come from Vercel edge
    // geo headers; language from Accept-Language; referrer is the browser's
    // document.referrer sent in the body (the request's own Referer header is
    // just the quiz page, so it can't reveal the real traffic source) reduced to
    // a bare host. A self-referral (our own host) is labeled "internal"; an empty
    // referrer is "direct".
    const city = cityFromRequest(request);
    // Salted one-way hash of the request IP (migration 49), for the contest
    // fraud review only. The address itself is never stored. Its own insert
    // tier below, so a database without the column simply drops it.
    const ipHash = ipHashFromRequest(request);
    const timezone = timezoneFromRequest(request);
    const language = languageFromRequest(request);
    let referrer = null;
    if (typeof body.referrer === 'string' && body.referrer.trim()) {
      const h = referrerHost(body.referrer);
      referrer = h ? (INTERNAL_HOST.test(h) ? 'internal' : h) : null;
    } else if (body.referrer === '' || body.referrer === null) {
      referrer = 'direct';
    }

    if (!quizId || quizId.length > 100) {
      return NextResponse.json({ error: 'quizId required' }, { status: 400 });
    }
    // NOTE: `score` may legitimately EXCEED `total` on daily games where
    // `total` is a beatable benchmark/target rather than a maximum (Tuck sends
    // total = the day's benchmark, and the whole point is to beat it). Bounding
    // score by `total` therefore 400-rejected every benchmark-beating Tuck
    // submission, so the row never saved even though the client celebrated.
    // Bound score by the same absolute ceiling as total instead.
    if (!Number.isInteger(score) || !Number.isInteger(total) || total <= 0 || total > 100000 || score < 0 || score > 100000) {
      return NextResponse.json({ error: 'bad score' }, { status: 400 });
    }
    if (!Number.isInteger(timeElapsed) || timeElapsed < 0) {
      return NextResponse.json({ error: 'bad time' }, { status: 400 });
    }
    // Slow / resumed finishers still score. These daily games can be left and
    // picked up later, so elapsed is wall-clock and can run long. Accept any
    // non-negative time but cap the STORED value at 10h (36000s) so a game left
    // open and finished much later cannot inflate the board or its time
    // tiebreaker. (Previously this same ceiling was a hard reject, which silently
    // dropped genuinely slow finishes entirely.)
    const timeStored = Math.min(timeElapsed, 36000);

    // Attribute to a joined identity by email, or by the browser's anon_id when
    // the player signed up with a display name only (no email).
    const ident = await findQuizIdentity(supabaseAdmin, { email, anonId });
    const user_id = ident ? ident.id : null;
    const username = ident ? ident.username : null;

    const baseRow = {
      quiz_id: quizId,
      user_id,
      username,
      score,
      total,
      time_elapsed: timeStored,
    };
    // Try the richest row first, then drop optional columns that a not-yet-applied
    // migration may be missing (country/region/ua_* -> migration 26,
    // is_mobile -> 25, correct_count -> 24, anon_id -> 22).
    const guessesUsed = Number.isInteger(body.guessesUsed) && body.guessesUsed >= 0 && body.guessesUsed <= 10000 ? body.guessesUsed : null;
    const withGuesses = guessesUsed != null ? { guesses_used: guessesUsed } : {};
    const withCorrect = correct != null ? { correct_count: correct } : {};
    const withMobile = isMobile != null ? { is_mobile: isMobile } : {};
    const withMeta = {};
    if (country) withMeta.country = country;
    if (region) withMeta.region = region;
    if (ua.browser) withMeta.ua_browser = ua.browser;
    if (ua.os) withMeta.ua_os = ua.os;
    const withMeta27 = {};
    if (city) withMeta27.city = city;
    if (timezone) withMeta27.timezone = timezone;
    if (referrer) withMeta27.referrer = referrer;
    if (language) withMeta27.language = language;
    const withAbandoned = { abandoned };
    // Marketing-campaign attribution (migration 40). The sot_camp cookie was set
    // by lib/campaigns.js when this visitor landed on a ?c= placement link (a
    // printed QR code, a flyer), so stamping it here turns "the ad got scanned"
    // into "the ad produced a player". Its own attempt tier below, so a database
    // without the column simply drops it.
    const campaign = normalizeCampaign(request.cookies.get('sot_camp')?.value);
    const withCampaign = campaign ? { campaign } : {};
    const withIpHash = ipHash ? { ip_hash: ipHash } : {};
    const withPriceTiebreak = priceTiebreak != null ? { price_tiebreak: priceTiebreak } : {};
    const withProgress = progress != null ? { progress } : {};
    const attempts = [
      { ...baseRow, anon_id: anonId, ...withCorrect, ...withMobile, ...withMeta, ...withMeta27, ...withGuesses, ...withAbandoned, ...withCampaign, ...withIpHash, ...withPriceTiebreak, ...withProgress },
      { ...baseRow, anon_id: anonId, ...withCorrect, ...withMobile, ...withMeta, ...withMeta27, ...withGuesses, ...withAbandoned, ...withCampaign, ...withIpHash, ...withPriceTiebreak },
      { ...baseRow, anon_id: anonId, ...withCorrect, ...withMobile, ...withMeta, ...withMeta27, ...withGuesses, ...withAbandoned, ...withCampaign, ...withIpHash },
      { ...baseRow, anon_id: anonId, ...withCorrect, ...withMobile, ...withMeta, ...withMeta27, ...withGuesses, ...withAbandoned, ...withCampaign },
      { ...baseRow, anon_id: anonId, ...withCorrect, ...withMobile, ...withMeta, ...withMeta27, ...withGuesses, ...withAbandoned },
      { ...baseRow, anon_id: anonId, ...withCorrect, ...withMobile, ...withMeta, ...withMeta27, ...withGuesses },
      { ...baseRow, anon_id: anonId, ...withCorrect, ...withMobile, ...withMeta, ...withMeta27 },
      { ...baseRow, anon_id: anonId, ...withCorrect, ...withMobile, ...withMeta },
      { ...baseRow, anon_id: anonId, ...withCorrect, ...withMobile },
      { ...baseRow, anon_id: anonId, ...withCorrect },
      { ...baseRow, anon_id: anonId },
      baseRow,
    ];
    let inserted = null, insErr = null;
    for (const row of attempts) {
      ({ data: inserted, error: insErr } = await supabaseAdmin.from('quiz_results').insert(row).select('id').single());
      if (!insErr) break;
      if (insErr.code !== '42703' && insErr.code !== 'PGRST204' && !/column|schema cache/i.test(insErr.message || '')) break; // a real error, not a missing column (Postgres 42703 OR PostgREST PGRST204 schema-cache miss)
    }
    if (insErr) {
      console.error('quiz_results insert error', insErr);
      return NextResponse.json({ error: 'db error' }, { status: 500 });
    }

    // Referral credit. The sot_ref cookie was set by lib/referrals.js when this
    // visitor first landed on a ?ref= share link; this is the single chokepoint
    // every board posts to, so one hook here covers every quiz AND every daily
    // game. Abandoned runs never credit (otherwise a two-second bail would be
    // the cheapest possible fake referral), and each referred person can only
    // ever credit one referrer once, so repeat plays do not farm the board.
    // Wrapped so a referral problem can never cost the player their result.
    if (!abandoned) {
      try {
        const refCode = normalizeRefCode(request.cookies.get('sot_ref')?.value);
        const visitorKey = anonId || request.cookies.get('sot_vid')?.value || null;
        if (refCode && visitorKey) {
          await creditReferral(supabaseAdmin, { refCode, visitorKey, userId: user_id, quizId });
        }
      } catch (e) {
        console.error('referral credit skipped', e?.message || e);
      }
    }

    const data = [];
    let cols = 'id, user_id, username, score, time_elapsed, anon_id, created_at, is_mobile, guesses_used, abandoned, progress';
    for (let from = 0; ; from += 1000) {
      let { data: page, error } = await supabaseAdmin
        .from('quiz_results')
        .select(cols)
        .eq('quiz_id', quizId)
        .order('id', { ascending: true })
        .range(from, from + 999);
      if (error && cols.includes(', progress') && (error.code === '42703' || error.code === 'PGRST204' || /column|schema cache/i.test(error.message || ''))) {
        cols = cols.replace(', progress', ''); from -= 1000; continue;
      }
      if (error && cols.includes(', abandoned') && (error.code === '42703' || error.code === 'PGRST204' || /column|schema cache/i.test(error.message || ''))) {
        cols = cols.replace(', abandoned', ''); from -= 1000; continue;
      }
      if (error && cols.includes(', guesses_used') && (error.code === '42703' || error.code === 'PGRST204' || /column|schema cache/i.test(error.message || ''))) {
        cols = cols.replace(', guesses_used', ''); from -= 1000; continue;
      }
      if (error && cols.includes(', is_mobile') && (error.code === '42703' || error.code === 'PGRST204' || /column|schema cache/i.test(error.message || ''))) {
        cols = cols.replace(', is_mobile', ''); from -= 1000; continue;
      }
      if (!page || page.length === 0) break;
      data.push(...page);
      if (page.length < 1000) break;
    }
    const myKey = user_id ? `u:${user_id}` : (anonId ? `a:${anonId}` : (inserted?.id ? `r:${inserted.id}` : null));
    const placement = playerPlacement(data, myKey);
    return NextResponse.json({ ...summarize(data), resultId: inserted?.id ?? null, placement });
  } catch (e) {
    return NextResponse.json({ error: 'invalid request' }, { status: 400 });
  }
}

// GET /api/quiz/result?quizId=&anonId=&email=
// The caller's OWN best completed attempt for a quiz. Used to RESTORE a finished
// daily board on a second device: the live board state lives only in the first
// device's localStorage, but the stored result row is the cross-device record,
// so a signed-in player can see their end-of-game card anywhere. Read-only; it
// records nothing. { found:false } when the identity has no completed attempt.
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const quizId = (searchParams.get('quizId') || '').trim();
    if (!quizId || quizId.length > 100) return NextResponse.json({ found: false });
    const email = (searchParams.get('email') || '').trim() || null;
    // ?first=1 (Passport, 2026-10-15): the row a daily board COUNTS, the earliest
    // completed attempt (lib/daily-combined scoreGame), instead of the best one.
    const first = searchParams.get('first') === '1';
    const anonId = (searchParams.get('anonId') || '').trim().slice(0, 64) || null;
    if (!email && !anonId) return NextResponse.json({ found: false });

    const ident = await findQuizIdentity(supabaseAdmin, { email, anonId });
    const userId = ident ? ident.id : null;
    // Match rows this identity owns (joined user_id) OR this browser posted (anon_id).
    const ors = [];
    if (userId) ors.push(`user_id.eq.${userId}`);
    if (anonId) ors.push(`anon_id.eq.${anonId}`);
    if (!ors.length) return NextResponse.json({ found: false });

    // Drop optional columns a not-yet-applied migration may be missing, exactly
    // as the POST insert/select does (abandoned/correct_count/guesses_used).
    let cols = 'score, total, correct_count, guesses_used, time_elapsed, created_at, abandoned, user_id, anon_id';
    let rows = null, error = null;
    for (;;) {
      ({ data: rows, error } = await supabaseAdmin
        .from('quiz_results')
        .select(cols)
        .eq('quiz_id', quizId)
        .or(ors.join(','))
        .order('id', { ascending: false })
        .limit(200));
      if (!error) break;
      const miss = error.code === '42703' || error.code === 'PGRST204' || /column|schema cache/i.test(error.message || '');
      if (miss && cols.includes(', abandoned')) { cols = cols.replace(', abandoned', ''); continue; }
      if (miss && cols.includes(', correct_count')) { cols = cols.replace(', correct_count', ''); continue; }
      if (miss && cols.includes(', guesses_used')) { cols = cols.replace(', guesses_used', ''); continue; }
      console.error('quiz_results restore select error', error);
      return NextResponse.json({ found: false });
    }

    const all = rows || [];
    // Prefer genuine completions over abandon-flush (0-score) rows when we can tell.
    const completed = all.filter((r) => r.abandoned !== true);
    const pool = completed.length ? completed : all;
    if (!pool.length) return NextResponse.json({ found: false });
    let best = pool[0];
    if (first) {
      // Rows are id-desc, so the earliest completed row is the last one. Only
      // abandons on record: nothing counted yet, since a finish supersedes them.
      if (!completed.length) return NextResponse.json({ found: false });
      best = completed[completed.length - 1];
    } else {
      for (const r of pool) if ((Number(r.score) || 0) > (Number(best.score) || 0)) best = r; // ties keep the newest (rows are id-desc)
    }

    return NextResponse.json({
      found: true,
      score: Number(best.score) || 0,
      total: Number(best.total) || 0,
      correct: best.correct_count == null ? null : Number(best.correct_count),
      guessesUsed: best.guesses_used == null ? null : Number(best.guesses_used),
      timeElapsed: best.time_elapsed == null ? null : Number(best.time_elapsed),
      createdAt: best.created_at || null,
    });
  } catch (e) {
    return NextResponse.json({ found: false });
  }
}
