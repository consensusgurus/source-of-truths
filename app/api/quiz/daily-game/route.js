import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-server';
import { loadQuizResultsCached } from '@/lib/quiz-results-cache';
import { KEEPS_ANSWER, dailySolvedRow } from '@/lib/daily-games';
import { findQuizIdentity } from '@/lib/quiz-identity';
import { scoreGame, guestGameResult, DAILY_KEYS } from '@/lib/daily-combined';
import { arcadeRanksForQuizId } from '@/lib/daily-games';
import { creditedFor } from '@/lib/daily-credits';

// Each game's puzzle list is server-only (answers never ship to the client). We
// read nothing but `quizId`, `num`, and `live` off it — the same fields the
// other daily routes read — to enumerate a game's drops for the calendar.
import { PUZZLES as P_crux } from '@/app/crux/puzzles';
import { PUZZLES as P_emcee } from '@/app/emcee/puzzles';
import { PUZZLES as P_garble } from '@/app/garble/puzzles';
import { PUZZLES as P_links } from '@/app/links/puzzles';
import { PUZZLES as P_span } from '@/app/span/puzzles';
import { PUZZLES as P_dating } from '@/app/dating/puzzles';
import { PUZZLES as P_tally } from '@/app/tally/puzzles';
import { PUZZLES as P_suds } from '@/app/suds/puzzles';
import { PUZZLES as P_quilt } from '@/app/quilt/puzzles';
import { PUZZLES as P_cages } from '@/app/cages/puzzles';
import { PUZZLES as P_sando } from '@/app/sando/puzzles';
import { PUZZLES as P_circa } from '@/app/circa/puzzles';
import { PUZZLES as P_extra } from '@/app/extra/puzzles';
import { PUZZLES as P_carve } from '@/app/carve/puzzles';
import { PUZZLES as P_stet } from '@/app/stet/puzzles';
import { PUZZLES as P_outwit } from '@/app/outwit/puzzles';
import { PUZZLES as P_tuck } from '@/app/tuck/puzzles';
import { PUZZLES as P_alibi } from '@/app/alibi/puzzles';
import { PUZZLES as P_cipher } from '@/app/cipher/puzzles';
import { PUZZLES as P_ping } from '@/app/ping/puzzles';
import { PUZZLES as P_warmer } from '@/app/warmer/puzzles';
import { PUZZLES as P_jester } from '@/app/jesters/puzzles';
import { PUZZLES as P_sworn } from '@/app/sworn/puzzles';
import { PUZZLES as P_outrank } from '@/app/outrank/puzzles';
import { PUZZLES as P_shards } from '@/app/shards/puzzles';
import { PUZZLES as P_axiom } from '@/app/axiom/puzzles';
import { PUZZLES as P_hearsay } from '@/app/hearsay/puzzles';
import { PUZZLES as P_venn } from '@/app/venn/puzzles';
import { PUZZLES as P_stands } from '@/app/stands/puzzles';
import { PUZZLES as P_bracket } from '@/app/bracket/puzzles';
// PRICER PULLED 2026-08-09 (see CLAUDE.md). Restore: grep -rn 'PRICER PULLED'
// import { PUZZLES as P_pricer } from '@/app/pricer/puzzles';
import { PUZZLES as P_lode } from '@/app/lode/puzzles';
import { PUZZLES as P_etch } from '@/app/etch/puzzles';
import { PUZZLES as P_glyph } from '@/app/glyph/puzzles';
import { PUZZLES as P_hedge } from '@/app/hedge/puzzles';
import { PUZZLES as P_listed } from '@/app/listed/puzzles';
import { PUZZLES as P_mate } from '@/app/mate/puzzles';
import { PUZZLES as P_four } from '@/app/four/puzzles';
import { PUZZLES as P_park } from '@/app/parker/puzzles';
import { PUZZLES as P_impound } from '@/app/impound/puzzles';
import { PUZZLES as P_junkyard } from '@/app/junkyard/puzzles';
import { PUZZLES as P_check } from '@/app/check/puzzles';
import { PUZZLES as P_rung } from '@/app/rung/puzzles';
import { PUZZLES as P_crunch } from '@/app/crunch/puzzles';
import { PUZZLES as P_taire } from '@/app/taire/puzzles';
import { PUZZLES as P_fib } from '@/app/fib/puzzles';
import { PUZZLES as P_streak } from '@/app/streak/puzzles';
import { PUZZLES as P_feud } from '@/app/feud/puzzles';
import { PUZZLES as P_babel } from '@/app/babel/puzzles';
import { PUZZLES as P_chain } from '@/app/chain/puzzles';
import { PUZZLES as P_turn } from '@/app/turn/puzzles';
import { PUZZLES as P_suffice } from '@/app/suffice/puzzles';
import { PUZZLES as P_strata } from '@/app/strata/puzzles';
import { PUZZLES as P_blocks } from '@/app/blocks/puzzles';
import { PUZZLES as P_docket } from '@/app/docket/puzzles';
import { PUZZLES as P_plot } from '@/app/plot/puzzles';
import { PUZZLES as P_barter } from '@/app/barter/puzzles';
import { PUZZLES as P_sixes } from '@/app/sixes/puzzles';
import { PUZZLES as P_calc } from '@/app/calc/puzzles';
import { PUZZLES as P_encore } from '@/app/encore/puzzles';
import { PUZZLES as P_biz } from '@/app/biz/puzzles';
import { PUZZLES as P_flank } from '@/app/flank/puzzles';
import { PUZZLES as P_niche } from '@/app/niche/puzzles';
import { PUZZLES as P_shoe } from '@/app/shoe/puzzles';
import { PUZZLES as P_queen } from '@/app/queen/puzzles';
import { PUZZLES as P_towers } from '@/app/towers/puzzles';
import { PUZZLES as P_mercury } from '@/app/mercury/puzzles';
import { PUZZLES as P_polka } from '@/app/polka/puzzles';
import { PUZZLES as P_knight } from '@/app/knight/puzzles';
import { PUZZLES as P_script } from '@/app/script/puzzles';
import { PUZZLES as P_quotes } from '@/app/quotes/puzzles';
import { PUZZLES as P_focus } from '@/app/focus/puzzles';
import { PUZZLES as P_thread } from '@/app/thread/puzzles';
import { PUZZLES as P_slot } from '@/app/slot/puzzles';
import { PUZZLES as P_whittle } from '@/app/whittle/puzzles';
import { PUZZLES as P_diag } from '@/app/diag/puzzles';
import { PUZZLES as P_frame } from '@/app/frame/puzzles';
import { PUZZLES as P_rim } from '@/app/rim/puzzles';
import { PUZZLES as P_atlas } from '@/app/atlas/puzzles';
import { PUZZLES as P_sport } from '@/app/sport/puzzles';
import { PUZZLES as P_defend } from '@/app/defend/puzzles';
import { PUZZLES as P_blitz } from '@/app/blitz/puzzles';
import { PUZZLES as P_blitzed } from '@/app/blitzed/puzzles';
import { PUZZLES as P_sums } from '@/app/sums/puzzles';
import { PUZZLES as P_hinge } from '@/app/hinge/puzzles';
import { PUZZLES as P_sweep } from '@/app/sweep/puzzles';
import { PUZZLES as P_chomp } from '@/app/chomp/puzzles';
import { PUZZLES as P_redact } from '@/app/redact/puzzles';
import { PUZZLES as P_paths } from '@/app/paths/puzzles';
import { PUZZLES as P_deep } from '@/app/deep/puzzles';
import { PUZZLES as P_anon } from '@/app/anon/puzzles';
import { PUZZLES as P_hands } from '@/app/hands/puzzles';
import { PUZZLES as P_finesse } from '@/app/finesse/puzzles';

export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';
// Per-player answer (the drop calendar folds in the viewer's played set, and the
// all-time board marks the viewer's own row), so keep it fresh per viewer.
const CACHE_HEADERS = { 'Cache-Control': 'private, no-store' };

const GAME_PUZZLES = {
  crux: P_crux, emcee: P_emcee, garble: P_garble, links: P_links, span: P_span, dating: P_dating,
  tally: P_tally, suds: P_suds, quilt: P_quilt, cages: P_cages, sando: P_sando, circa: P_circa, extra: P_extra, carve: P_carve, stet: P_stet, outwit: P_outwit,
  tuck: P_tuck, alibi: P_alibi, cipher: P_cipher, ping: P_ping, warmer: P_warmer,
  jester: P_jester, sworn: P_sworn, outrank: P_outrank, shards: P_shards, axiom: P_axiom, hearsay: P_hearsay, venn: P_venn, stands: P_stands, bracket: P_bracket, lode: P_lode, etch: P_etch, hedge: P_hedge, listed: P_listed, mate: P_mate, four: P_four, park: P_park, impound: P_impound, junkyard: P_junkyard, check: P_check, rung: P_rung, crunch: P_crunch, taire: P_taire, fib: P_fib, streak: P_streak, feud: P_feud, babel: P_babel, hands: P_hands, finesse: P_finesse, glyph: P_glyph, chain: P_chain, turn: P_turn, suffice: P_suffice, strata: P_strata, redact: P_redact, paths: P_paths, deep: P_deep, anon: P_anon, blocks: P_blocks, chomp: P_chomp, sweep: P_sweep, docket: P_docket, blitz: P_blitz, blitzed: P_blitzed, sums: P_sums, hinge: P_hinge, defend: P_defend, barter: P_barter, plot: P_plot, sixes: P_sixes, niche: P_niche, shoe: P_shoe, queen: P_queen, towers: P_towers, mercury: P_mercury, polka: P_polka, knight: P_knight, atlas: P_atlas, sport: P_sport, calc: P_calc, encore: P_encore, biz: P_biz, flank: P_flank, script: P_script, quotes: P_quotes, focus: P_focus, thread: P_thread, slot: P_slot, whittle: P_whittle, diag: P_diag, frame: P_frame, rim: P_rim,
};

const BOARD = 10; // all-time rows returned (the viewer's own rank is always in `myRank`)

function etTodayServer() {
  try { return new Date().toLocaleDateString('en-CA', { timeZone: 'America/New_York' }); }
  catch (e) { return new Date().toISOString().slice(0, 10); }
}
function suffixOfDate(dateStr) { const [Y, M, D] = dateStr.split('-').map(Number); return `${M}-${D}-${Y % 100}`; }
// "M-D-YY" -> sortable ISO "YYYY-MM-DD".
function isoOfSuffix(suffix) {
  const [M, D, YY] = suffix.split('-').map(Number);
  return `${2000 + YY}-${String(M).padStart(2, '0')}-${String(D).padStart(2, '0')}`;
}

// The guest's single chosen row for one drop (their anon rows only), mirroring
// scoreGame's selection: a completed attempt beats an abandoned one, then the
// first attempt (lowest id) wins, EXCEPT on an arcade game, where their best run
// wins (owner, 2026-08-14; scoreGame has done this for registered players since
// 2026-08-08). This route SUMS the result across every drop, so a guest's whole
// all-time arcade standing was built out of opening runs. Returns null when the
// guest has no row.
function chooseGuestRow(rows, anonId, quizId) {
  // Bound once per drop: every row here belongs to the same puzzle.
  const arcadeRank = arcadeRanksForQuizId(quizId);
  let chosen = null;
  for (const r of (rows || [])) {
    if (!r || r.user_id || r.anon_id !== anonId) continue;
    if (!chosen) { chosen = r; continue; }
    const rDone = !r.abandoned, cDone = !chosen.abandoned;
    if (rDone !== cDone) { if (rDone) chosen = r; continue; }
    // A dead heat falls back to the lower id on BOTH paths, so the answer never
    // depends on the order the rows arrived in.
    const wins = arcadeRank
      ? (arcadeRank(r, chosen) || ((r.id || 0) - (chosen.id || 0))) < 0
      : (r.id || 0) < (chosen.id || 0);
    if (wins) chosen = r;
  }
  return chosen;
}

// GET /api/quiz/daily-game?game=<key>&anonId=&email=&fresh=
//   -> { game,
//        allTime: { field, myRank, myPoints, board:[{ userKey, username, points, rank, isMe }] },
//        drops:   [{ date, dateISO, num, href, played, players, isToday }],
//        mine:    { plays, bestPoints, avgPoints, currentStreak, longestStreak,
//                   perDrop: { <dateISO>: points } } }
//
// all-time = the game's OWN cumulative leaderboard: each registered player's
// per-drop daily points (first completion, scored exactly like the live per-game
// board via scoreGame) SUMMED across every drop of this game to date. This is the
// per-game all-time standing the end card's middle rank tile shows. Guests are
// never on it (scoreGame drops them), so a guest sees a dash.
// drops = every live drop of the game (today included), flagged as played by the
// viewer, for the end card's calendar.
export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const game = (searchParams.get('game') || '').trim();
  const anonId = (searchParams.get('anonId') || '').trim() || null;
  const email = (searchParams.get('email') || '').trim() || null;
  const fresh = searchParams.get('fresh') === '1' || searchParams.get('fresh') === 'true';

  const none = { game, allTime: { field: 0, plays: 0, myRank: null, myPoints: null, board: [] }, drops: [], mine: { plays: 0, bestPoints: null, avgPoints: null, currentStreak: 0, longestStreak: 0, perDrop: {} } };
  if (!DAILY_KEYS.includes(game)) return NextResponse.json(none, { headers: CACHE_HEADERS });

  const today = etTodayServer();
  const todayQuizId = `${game}-${suffixOfDate(today)}`;
  const DAILY_ONE_RE = new RegExp(`^${game}-(\\d+)-(\\d+)-(\\d+)$`);

  // Enumerate the game's live drops (today included; future-dated drops excluded).
  const puzzles = GAME_PUZZLES[game] || [];
  const liveDrops = (puzzles || []).filter((p) => p && p.quizId && (!p.live || p.live <= today));

  // Resolve the viewer: email -> account, else this browser's anon.
  let myKey = null;
  try {
    const ident = await findQuizIdentity(supabaseAdmin, { email, anonId });
    if (ident && ident.id) myKey = `u:${ident.id}`;
    else if (anonId) myKey = `a:${anonId}`;
  } catch (e) { /* identity is best-effort */ }

  try {
    const { data, error } = await loadQuizResultsCached(supabaseAdmin, { force: fresh });
    if (error) {
      console.error('daily-game error', error);
      return NextResponse.json(none, { headers: CACHE_HEADERS });
    }

    // One pass: bucket this game's rows by drop (quizId), and record which drops
    // the viewer has a result row for (their played set for the calendar).
    const prefix = game + '-';
    const byDrop = new Map();  // quizId -> rows[]
    const played = new Set();  // quizIds the viewer has played
    // ...and the ones they actually SOLVED. Only the games that never disclose
    // their answer can show the difference in the calendar (see KEEPS_ANSWER):
    // on every other game an unsolved run has already been shown the answer, so
    // the day is finished with nothing left to go back for. Painting a Streak
    // that ended at 12 of 40 as unfinished would be calling a score a failure.
    const solved = new Set();
    for (const r of (data || [])) {
      const qid = r && r.quiz_id;
      if (!qid || qid.indexOf(prefix) !== 0 || !DAILY_ONE_RE.test(qid)) continue;
      let arr = byDrop.get(qid);
      if (!arr) { arr = []; byDrop.set(qid, arr); }
      arr.push(r);
      const pk = r.user_id ? `u:${r.user_id}` : (r.anon_id ? `a:${r.anon_id}` : null);
      if (pk && myKey && pk === myKey) {
        played.add(qid);
        // The verdict the client already posts, read through the same shared
        // helper daily-status uses so the calendar and the slate can never
        // disagree about a day (legacy fallback and the SOLVES_ON_SCORE games
        // both live in there).
        const ok = dailySolvedRow(r);
        if (ok) solved.add(qid);
      }
    }
    // Hand-granted credits: drops this player really finished but whose result
    // post was lost. Calendar, archive percentage and streaks only, never score
    // (no row exists, so nothing enters scoreGame or any board). See
    // lib/daily-credits.js. DAILY_ONE_RE already scopes the id to THIS game.
    for (const qid of creditedFor(myKey)) {
      // A credit exists because the row was LOST, so there is no verdict to
      // read. Credited days count as solved rather than be painted unfinished
      // for something that was the pipeline's fault, not the player's.
      if (DAILY_ONE_RE.test(qid)) { played.add(qid); solved.add(qid); }
    }

    // A guest (anon viewer) is never on the registered cumulative board, but we
    // can show a PROVISIONAL all-time rank: sum the points their own drops would
    // earn (each inserted into that drop's registered field) and rank that total
    // against the registered cumulative totals, mirroring the today/combined tiles.
    // Count unique all-time players (registered + guests) across all drops.
    // Same pass also counts each DROP's own unique players, which the tile
    // panel's trend chart bubbles above every bar (owner, 2026-07-30).
    const uniqueAllTimePlayers = new Set();
    const playersPerDrop = new Map(); // quizId -> unique player count
    for (const [qid, rows] of byDrop.entries()) {
      const day = new Set();
      for (const r of rows) {
        const pk = r.user_id ? `u:${r.user_id}` : (r.anon_id ? `a:${r.anon_id}` : null);
        if (pk) { day.add(pk); uniqueAllTimePlayers.add(pk); }
      }
      playersPerDrop.set(qid, day.size);
    }
    const isGuestViewer = !!(myKey && myKey.indexOf('a:') === 0);
    let guestPts = 0, guestDrops = 0;

    // Cumulative per-registered-player points across every drop. scoreGame handles
    // first-completion selection and the 0..15 per-drop daily scale; we just sum.
    const cum = new Map(); // userKey -> { userKey, username, points, drops }
    // The viewer's own daily points per drop, keyed by quizId. Registered players
    // come straight off scoreGame's player map; a guest is scored the same way the
    // provisional standing below is, so both agree.
    const minePts = new Map();
    for (const [qid, rows] of byDrop.entries()) {
      const gr = scoreGame(rows);
      for (const p of gr.players.values()) {
        let u = cum.get(p.userKey);
        if (!u) { u = { userKey: p.userKey, username: p.username, points: 0, drops: 0 }; cum.set(p.userKey, u); }
        u.username = p.username; // keep the latest label
        u.points += p.points;
        u.drops += 1;
      }
      if (isGuestViewer) {
        const grow = chooseGuestRow(rows, anonId, qid);
        if (grow) { const res = guestGameResult(grow, { field: gr.field, players: gr.players }); guestPts += res.points; guestDrops += 1; minePts.set(qid, res.points); }
      } else if (myKey) {
        const mineRow = gr.players.get(myKey);
        if (mineRow) minePts.set(qid, mineRow.points);
      }
    }
    const ranked = [...cum.values()].sort((a, b) =>
      b.points - a.points
      || b.drops - a.drops
      || String(a.username || '').localeCompare(String(b.username || '')));
    // Registered (named) players only, renumbered with a FRESH sequential
    // competition rank (ties share, keyed to one-decimal points). Anonymous
    // guests are never shown and never occupy a visible rank slot, so the board
    // reads 1,2,3... instead of gapping where a guest sits in the full order.
    // `field` still counts the full all-time pool so the "of N" stays the full field.
    const namedRanked = ranked.filter((r) => !!r.username);
    let rank = 0, prev = null, seen = 0;
    for (const row of namedRanked) {
      seen += 1;
      const p10 = Math.round(row.points * 10);
      if (prev === null || p10 !== prev) { rank = seen; prev = p10; }
      row.rank = rank;
    }

    const meRow = myKey ? namedRanked.find((r) => r.userKey === myKey) : null;
    const board = namedRanked.slice(0, BOARD).map((r) => ({
      userKey: r.userKey,
      username: r.username,
      points: Math.round(r.points * 10) / 10,
      rank: r.rank,
      isMe: myKey ? r.userKey === myKey : false,
    }));
    const allTime = {
      field: ranked.length,
      plays: uniqueAllTimePlayers.size,
      myRank: meRow ? meRow.rank : null,
      myPoints: meRow ? Math.round(meRow.points * 10) / 10 : null,
      provisional: false,
      board,
    };
    // Guest provisional standing (only when the viewer isn't a registered board
    // member and their own drops scored something). `provisional` tells the end
    // card to badge the rank with "prov.", exactly like the today/combined tiles.
    if (!meRow && isGuestViewer && guestDrops > 0) {
      allTime.myRank = namedRanked.filter((r) => r.points > guestPts).length + 1;
      allTime.myPoints = Math.round(guestPts * 10) / 10;
      allTime.provisional = true;
    }

    const drops = liveDrops.map((p) => {
      const m = p.quizId.match(DAILY_ONE_RE);
      const suffix = m ? `${m[1]}-${m[2]}-${m[3]}` : '';
      const isToday = p.quizId === todayQuizId;
      return {
        date: suffix,
        dateISO: suffix ? isoOfSuffix(suffix) : '',
        num: p.num,
        href: isToday ? `/${game}` : `/${game}?p=${p.num}`,
        played: played.has(p.quizId),
        incomplete: KEEPS_ANSWER.has(game) && played.has(p.quizId) && !solved.has(p.quizId),
        players: playersPerDrop.get(p.quizId) || 0,
        isToday,
      };
    }).sort((a, b) => (a.dateISO < b.dateISO ? -1 : a.dateISO > b.dateISO ? 1 : 0));

    // ── the viewer's own all-time record for this game ──
    const perDrop = {};
    let bestPoints = null, sumPoints = 0, ptsPlays = 0;
    for (const [qid, pts] of minePts.entries()) {
      const m = qid.match(DAILY_ONE_RE);
      if (!m) continue;
      const iso = isoOfSuffix(`${m[1]}-${m[2]}-${m[3]}`);
      const p = Math.round(Number(pts) * 10) / 10;
      perDrop[iso] = p;
      if (bestPoints == null || p > bestPoints) bestPoints = p;
      sumPoints += p; ptsPlays += 1;
    }
    // Every drop the viewer has a row for (a drop they opened but never scored
    // still counts as played, exactly as the calendar marks it).
    const playedISO = [];
    for (const qid of played) {
      const m = qid.match(DAILY_ONE_RE);
      if (m) playedISO.push(isoOfSuffix(`${m[1]}-${m[2]}-${m[3]}`));
    }
    playedISO.sort();
    const playedSet = new Set(playedISO);
    const dayBefore = (iso) => {
      const d = new Date(iso + 'T00:00:00Z');
      d.setUTCDate(d.getUTCDate() - 1);
      return d.toISOString().slice(0, 10);
    };
    let currentStreak = 0;
    if (playedSet.size) {
      let cursor = playedSet.has(today) ? today : dayBefore(today);
      while (playedSet.has(cursor)) { currentStreak += 1; cursor = dayBefore(cursor); }
    }
    let longestStreak = 0, run = 0, prevISO = null;
    for (const iso of playedISO) {
      run = (prevISO && dayBefore(iso) === prevISO) ? run + 1 : 1;
      if (run > longestStreak) longestStreak = run;
      prevISO = iso;
    }
    const mine = {
      plays: playedSet.size,
      bestPoints,
      avgPoints: ptsPlays ? Math.round((sumPoints / ptsPlays) * 10) / 10 : null,
      currentStreak,
      longestStreak,
      perDrop,
    };

    return NextResponse.json({ game, allTime, drops, mine }, { headers: CACHE_HEADERS });
  } catch (e) {
    console.error('daily-game exception', e);
    return NextResponse.json(none, { headers: CACHE_HEADERS });
  }
}
