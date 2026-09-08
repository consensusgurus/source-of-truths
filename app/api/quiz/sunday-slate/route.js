import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-server';
import { loadQuizResultsCached } from '@/lib/quiz-results-cache';
import { findQuizIdentity } from '@/lib/quiz-identity';
import { SUNDAY_EDITION_GAMES } from '@/lib/sunday-editions';

import { PUZZLES as P_crux } from '@/app/crux/puzzles';
import { PUZZLES as P_plot } from '@/app/plot/puzzles';
import { PUZZLES as P_barter } from '@/app/barter/puzzles';
import { PUZZLES as P_sixes } from '@/app/sixes/puzzles';
import { PUZZLES as P_sums } from '@/app/sums/puzzles';
import { PUZZLES as P_hinge } from '@/app/hinge/puzzles';
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
import { PUZZLES as P_cages } from '@/app/cages/puzzles';
import { PUZZLES as P_sando } from '@/app/sando/puzzles';
import { PUZZLES as P_docket } from '@/app/docket/puzzles';
import { PUZZLES as P_defend } from '@/app/defend/puzzles';
import { PUZZLES as P_emcee } from '@/app/emcee/puzzles';
import { PUZZLES as P_garble } from '@/app/garble/puzzles';
import { PUZZLES as P_links } from '@/app/links/puzzles';
import { PUZZLES as P_span } from '@/app/span/puzzles';
import { PUZZLES as P_dating } from '@/app/dating/puzzles';
import { PUZZLES as P_tally } from '@/app/tally/puzzles';
import { PUZZLES as P_suds } from '@/app/suds/puzzles';
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
// Per-player answer, and playing one should drop it from the slate at once.
const CACHE_HEADERS = { 'Cache-Control': 'private, no-store' };

// Lifted wholesale from /api/quiz/daily-unplayed rather than trimmed to the
// Sunday roster: SUNDAY_EDITION_GAMES is 51 games and counting, so a hand-kept
// subset here would be one more list to remember when a game gains an edition.
// The registry does the filtering at request time instead.
const GAME_PUZZLES = { crux: P_crux, emcee: P_emcee, garble: P_garble, links: P_links, span: P_span, dating: P_dating, tally: P_tally, suds: P_suds, circa: P_circa, extra: P_extra, carve: P_carve, stet: P_stet, outwit: P_outwit, tuck: P_tuck, alibi: P_alibi, cipher: P_cipher, ping: P_ping, warmer: P_warmer, jester: P_jester, sworn: P_sworn, outrank: P_outrank, shards: P_shards, axiom: P_axiom, hearsay: P_hearsay, venn: P_venn, stands: P_stands, bracket: P_bracket, lode: P_lode, etch: P_etch, hedge: P_hedge, listed: P_listed, mate: P_mate, four: P_four, park: P_park, impound: P_impound, junkyard: P_junkyard, check: P_check, rung: P_rung, crunch: P_crunch, taire: P_taire, fib: P_fib, streak: P_streak, feud: P_feud, babel: P_babel, hands: P_hands, finesse: P_finesse, glyph: P_glyph, chain: P_chain, turn: P_turn, suffice: P_suffice, strata: P_strata, redact: P_redact, paths: P_paths, deep: P_deep, anon: P_anon, blocks: P_blocks, chomp: P_chomp, sweep: P_sweep, cages: P_cages, sando: P_sando, docket: P_docket, defend: P_defend, barter: P_barter, plot: P_plot, sixes: P_sixes, sums: P_sums, hinge: P_hinge, niche: P_niche, shoe: P_shoe, queen: P_queen, towers: P_towers, mercury: P_mercury, polka: P_polka, knight: P_knight, atlas: P_atlas, sport: P_sport, calc: P_calc, encore: P_encore, biz: P_biz, flank: P_flank, script: P_script, quotes: P_quotes, focus: P_focus, thread: P_thread, slot: P_slot, whittle: P_whittle, diag: P_diag, frame: P_frame, rim: P_rim };

function etTodayServer() {
  try { return new Date().toLocaleDateString('en-CA', { timeZone: 'America/New_York' }); }
  catch (e) { return new Date().toISOString().slice(0, 10); }
}
function suffixOfDate(dateStr) { const [Y, M, D] = dateStr.split('-').map(Number); return `${M}-${D}-${Y % 100}`; }

// GET /api/quiz/sunday-slate?anonId=&email=
//   -> { games: [{ key, num, href, live, played, playedAt }] }
//
// One Sunday Edition per game, chosen the way the owner asked for on
// 2026-08-09: walk that game's Sunday drops BACKWARDS from the most recent and
// take the first the viewer has never played, so the tab leads with last Sunday
// and only reaches further back for someone who has already done it. When every
// Sunday of a game has been played, take the one played LONGEST AGO, which is
// the one they are least likely to remember.
//
// Today's drop is excluded (it is on the board already) and so is anything not
// yet live, exactly as /api/quiz/daily-unplayed does. This route is the reason
// the tab needs a server at all: the archive link is /<game>?p=<num>, and num
// only exists inside the game's own puzzle bank, which the client never loads.
export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const anonId = (searchParams.get('anonId') || '').trim() || null;
  const email = (searchParams.get('email') || '').trim() || null;

  const today = etTodayServer();

  let myKey = null;
  try {
    const ident = await findQuizIdentity(supabaseAdmin, { email, anonId });
    if (ident && ident.id) myKey = `u:${ident.id}`;
    else if (anonId) myKey = `a:${anonId}`;
  } catch (e) { /* identity is best-effort: no history means nothing is played */ }

  // quiz_id -> the NEWEST time this viewer played it. One pass over the shared
  // row cache for every game at once, rather than the per-game pass
  // daily-unplayed makes, since this route answers for the whole slate.
  const playedAt = new Map();
  if (myKey) {
    try {
      const { data } = await loadQuizResultsCached(supabaseAdmin);
      for (const r of (data || [])) {
        const qid = r && r.quiz_id;
        if (!qid) continue;
        const pk = r.user_id ? `u:${r.user_id}` : (r.anon_id ? `a:${r.anon_id}` : null);
        if (pk !== myKey) continue;
        const t = r.created_at ? Date.parse(r.created_at) : 0;
        if (!playedAt.has(qid) || t > playedAt.get(qid)) playedAt.set(qid, t);
      }
    } catch (e) { /* no history -> everything reads as unplayed */ }
  }

  const games = [];
  for (const key of SUNDAY_EDITION_GAMES) {
    const puzzles = GAME_PUZZLES[key];
    if (!puzzles) continue;
    const todayQuizId = `${key}-${suffixOfDate(today)}`;
    // Newest first, so "the first unplayed" IS the most recent one.
    const sundays = puzzles
      .filter((p) => p && p.sunday && p.quizId && p.quizId !== todayQuizId && (!p.live || p.live <= today))
      .sort((a, b) => (b.num || 0) - (a.num || 0));
    if (!sundays.length) continue;

    let pick = sundays.find((p) => !playedAt.has(p.quizId)) || null;
    let played = false;
    if (!pick) {
      // Every Sunday of this game is played, so offer the stalest one.
      played = true;
      pick = sundays.reduce((oldest, p) => (
        (playedAt.get(p.quizId) || 0) < (playedAt.get(oldest.quizId) || 0) ? p : oldest), sundays[0]);
    }
    games.push({
      key,
      num: pick.num,
      href: `/${key}?p=${pick.num}`,
      live: pick.live || null,
      played,
      playedAt: played ? (playedAt.get(pick.quizId) || null) : null,
    });
  }

  // Unplayed first (the point of the tab), then the stalest of the played ones.
  games.sort((a, b) => (a.played === b.played
    ? (a.played ? (a.playedAt || 0) - (b.playedAt || 0) : 0)
    : (a.played ? 1 : -1)));

  return NextResponse.json({ games }, { headers: CACHE_HEADERS });
}
