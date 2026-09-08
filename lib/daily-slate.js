// The day's daily-game slate: which puzzle each game published on a given ET
// date. Extracted 2026-08-01 so /api/quiz/daily-me can answer a per-player
// question about ONE game without importing the combined board's machinery.
//
// Each game's puzzle list is server-only (answers never ship to the client). We
// read nothing but `live`, `quizId` and `num` off it, exactly like
// app/daily/page.js and /api/quiz/daily-combined, so callers always see whatever
// puzzle is CURRENTLY live in each game (gap days included), never a naively
// date-reconstructed id.
//
// NOTE: /api/quiz/daily-combined still carries its own copy of these imports and
// helpers. That is deliberate for now: this module was added without touching a
// working hot path. Folding that route onto this module is a safe follow-up.

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
import { PUZZLES as P_pricer } from '@/app/pricer/puzzles';
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
import { PUZZLES as P_docket } from '@/app/docket/puzzles';
import { PUZZLES as P_defend } from '@/app/defend/puzzles';
import { PUZZLES as P_blitz } from '@/app/blitz/puzzles';
import { PUZZLES as P_blitzed } from '@/app/blitzed/puzzles';
import { PUZZLES as P_sums } from '@/app/sums/puzzles';
import { PUZZLES as P_hinge } from '@/app/hinge/puzzles';
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
import { PUZZLES as P_atlas } from '@/app/atlas/puzzles';
import { PUZZLES as P_sport } from '@/app/sport/puzzles';


export const GAME_PUZZLES = {
  crux: P_crux, emcee: P_emcee, garble: P_garble, links: P_links, span: P_span, dating: P_dating,
  tally: P_tally, suds: P_suds, quilt: P_quilt, cages: P_cages, sando: P_sando, circa: P_circa, extra: P_extra, carve: P_carve, stet: P_stet, outwit: P_outwit,
  tuck: P_tuck, alibi: P_alibi, cipher: P_cipher, ping: P_ping, warmer: P_warmer,
  jester: P_jester, sworn: P_sworn, outrank: P_outrank, shards: P_shards, axiom: P_axiom, hearsay: P_hearsay,
  // PRICER PULLED 2026-08-09 (see CLAUDE.md). Restore: grep -rn 'PRICER PULLED' slate puzzle map
  // Pricer ONLY. The pull originally commented out this whole shared line, which
  // silently took venn/stands/bracket/lode/etch/hedge off the server slate too:
  // gamesForSuffix skips any key with no GAME_PUZZLES entry, so those six had no
  // daily-combined board, no leader, no plays count (the slate row read '-' rather
  // than 0) and no combined-day scoring. Never comment a game out of a SHARED line.
  // pricer: P_pricer,
  venn: P_venn, stands: P_stands, bracket: P_bracket, lode: P_lode, etch: P_etch, hedge: P_hedge,
  listed: P_listed, mate: P_mate, four: P_four, park: P_park, impound: P_impound, junkyard: P_junkyard, check: P_check, rung: P_rung,
  crunch: P_crunch, taire: P_taire, fib: P_fib, streak: P_streak, feud: P_feud, babel: P_babel,
  chain: P_chain,
  turn: P_turn,
  glyph: P_glyph, hands: P_hands, finesse: P_finesse,
  suffice: P_suffice,
  strata: P_strata,
  blocks: P_blocks,
  sweep: P_sweep,
  chomp: P_chomp,
  redact: P_redact,
  paths: P_paths,
  deep: P_deep,
  anon: P_anon,
  docket: P_docket,
  defend: P_defend,
  blitz: P_blitz, blitzed: P_blitzed, sums: P_sums, hinge: P_hinge,
  barter: P_barter, plot: P_plot, sixes: P_sixes, niche: P_niche, shoe: P_shoe, queen: P_queen, towers: P_towers, mercury: P_mercury, polka: P_polka, knight: P_knight, atlas: P_atlas, sport: P_sport, calc: P_calc, encore: P_encore, biz: P_biz, flank: P_flank, script: P_script, quotes: P_quotes, focus: P_focus, thread: P_thread, slot: P_slot, whittle: P_whittle, diag: P_diag,
};

// Today in US Eastern, the timezone every daily rolls over on.
export function etTodayServer() {
  try { return new Date().toLocaleDateString('en-CA', { timeZone: 'America/New_York' }); }
  catch (e) { return new Date().toISOString().slice(0, 10); }
}

// Daily quizIds end in a `-M-D-YY` date suffix (crux-7-6-26 -> "7-6-26").
export function suffixOfDate(dateStr) {
  const [Y, M, D] = dateStr.split('-').map(Number); // dateStr = 'YYYY-MM-DD'
  return `${M}-${D}-${Y % 100}`;
}

// The suffix a request is asking about: an explicit `date`, else the one parsed
// off a passed quizId, else today.
export function suffixFromRequest({ date, quizId, today }) {
  const d = (date || '').trim();
  if (/^\d+-\d+-\d+$/.test(d)) return d;
  const m = (quizId || '').match(/-(\d+-\d+-\d+)$/);
  return m ? m[1] : suffixOfDate(today);
}

// The game's puzzle for a date suffix, or null if it published none that day
// (game did not exist yet, or a gap). Never exposes a future day.
export function puzzleForSuffix(puzzles, key, suffix, today) {
  const cand = `${key}-${suffix}`;
  const p = (puzzles || []).find((x) => x && x.quizId === cand);
  if (!p) return null;
  if (p.live && p.live > today) return null;
  return p;
}

// Every game that ran on `suffix`, with the href to play THAT date: today's
// slate links to the live game (streak-counting), an archived day links to that
// exact puzzle via ?p=<num>.
export function gamesForSuffix(keys, suffix, today) {
  const isToday = suffix === suffixOfDate(today);
  const out = [];
  for (const key of keys) {
    const p = puzzleForSuffix(GAME_PUZZLES[key], key, suffix, today);
    if (!p) continue;
    out.push({
      key,
      quizId: p.quizId,
      num: p.num,
      rev: p.rev || null,
      href: isToday ? `/${key}` : `/${key}?p=${p.num}`,
    });
  }
  return out;
}
