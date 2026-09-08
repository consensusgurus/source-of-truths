import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-server';
import { loadQuizResultsCached } from '@/lib/quiz-results-cache';
import { findQuizIdentity } from '@/lib/quiz-identity';
import { DAILY_KEYS } from '@/lib/daily-combined';

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
// Per-player answer, keep it fresh (a play should immediately drop that puzzle).
const CACHE_HEADERS = { 'Cache-Control': 'private, no-store' };

const GAME_PUZZLES = { crux: P_crux, emcee: P_emcee, garble: P_garble, links: P_links, span: P_span, dating: P_dating, tally: P_tally, suds: P_suds, quilt: P_quilt, circa: P_circa, extra: P_extra, carve: P_carve, stet: P_stet, outwit: P_outwit, tuck: P_tuck, alibi: P_alibi, cipher: P_cipher, ping: P_ping, warmer: P_warmer, jester: P_jester, sworn: P_sworn, outrank: P_outrank, shards: P_shards, axiom: P_axiom, hearsay: P_hearsay, venn: P_venn, stands: P_stands, bracket: P_bracket, lode: P_lode, etch: P_etch, hedge: P_hedge, listed: P_listed, mate: P_mate, four: P_four, park: P_park, impound: P_impound, junkyard: P_junkyard, check: P_check, rung: P_rung, crunch: P_crunch, taire: P_taire, fib: P_fib, streak: P_streak, feud: P_feud, babel: P_babel, hands: P_hands, finesse: P_finesse, glyph: P_glyph, chain: P_chain, turn: P_turn, suffice: P_suffice, strata: P_strata, redact: P_redact, paths: P_paths, deep: P_deep, anon: P_anon, blocks: P_blocks, chomp: P_chomp, sweep: P_sweep, docket: P_docket, blitz: P_blitz, blitzed: P_blitzed, sums: P_sums, hinge: P_hinge, defend: P_defend, cages: P_cages, sando: P_sando, barter: P_barter, plot: P_plot, sixes: P_sixes, niche: P_niche, shoe: P_shoe, queen: P_queen, towers: P_towers, mercury: P_mercury, polka: P_polka, knight: P_knight, atlas: P_atlas, sport: P_sport, calc: P_calc, encore: P_encore, biz: P_biz, flank: P_flank, script: P_script, quotes: P_quotes, focus: P_focus, thread: P_thread, slot: P_slot, whittle: P_whittle, diag: P_diag, frame: P_frame, rim: P_rim };

function etTodayServer() {
  try { return new Date().toLocaleDateString('en-CA', { timeZone: 'America/New_York' }); }
  catch (e) { return new Date().toISOString().slice(0, 10); }
}
function suffixOfDate(dateStr) { const [Y, M, D] = dateStr.split('-').map(Number); return `${M}-${D}-${Y % 100}`; }

// GET /api/quiz/daily-unplayed?game=<key>&anonId=&email=
//   -> { game, num, href } for the MOST-RECENT past drop of <game> the viewer has
//      not submitted a result for, or { game, num:null, href:null } when none remain
//      (the end-card's "Play a past <Game>" button hides on null). Today's puzzle and
//      any not-yet-live drop are excluded. "Played" = a quiz_results row for that
//      exact archived quizId under the viewer's identity (account, else this anon).
export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const game = (searchParams.get('game') || '').trim();
  const anonId = (searchParams.get('anonId') || '').trim() || null;
  const email = (searchParams.get('email') || '').trim() || null;
  const none = { game, num: null, href: null };
  if (!DAILY_KEYS.includes(game)) return NextResponse.json(none);

  const today = etTodayServer();
  const todayQuizId = `${game}-${suffixOfDate(today)}`;
  const puzzles = GAME_PUZZLES[game] || [];
  const archive = puzzles
    .filter((p) => p && p.quizId && p.quizId !== todayQuizId && (!p.live || p.live <= today))
    .sort((a, b) => (b.num || 0) - (a.num || 0));
  if (!archive.length) return NextResponse.json(none);

  let myKey = null;
  try {
    const ident = await findQuizIdentity(supabaseAdmin, { email, anonId });
    if (ident && ident.id) myKey = `u:${ident.id}`;
    else if (anonId) myKey = `a:${anonId}`;
  } catch (e) { /* identity best-effort */ }

  const played = new Set();
  if (myKey) {
    try {
      const { data } = await loadQuizResultsCached(supabaseAdmin);
      const prefix = game + '-';
      for (const r of (data || [])) {
        const qid = r && r.quiz_id;
        if (!qid || qid.indexOf(prefix) !== 0) continue;
        const pk = r.user_id ? `u:${r.user_id}` : (r.anon_id ? `a:${r.anon_id}` : null);
        if (pk === myKey) played.add(qid);
      }
    } catch (e) { /* no history -> treat all as unplayed */ }
  }

  const pick = archive.find((p) => !played.has(p.quizId));
  if (!pick) return NextResponse.json(none);
  return NextResponse.json({ game, num: pick.num, href: `/${game}?p=${pick.num}` }, { headers: CACHE_HEADERS });
}
