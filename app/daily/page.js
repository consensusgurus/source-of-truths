import DailyArchiveClient from './DailyArchiveClient';
import { PUZZLES as CRUX } from '../crux/puzzles';
import { PUZZLES as EMCEE } from '../emcee/puzzles';
import { PUZZLES as GARBLE } from '../garble/puzzles';
import { PUZZLES as LINKS } from '../links/puzzles';
import { PUZZLES as SPAN } from '../span/puzzles';
import { PUZZLES as DATING } from '../dating/puzzles';
import { PUZZLES as TALLY } from '../tally/puzzles';
import { PUZZLES as SUDS } from '../suds/puzzles';
import { PUZZLES as QUILT_FULL } from '../quilt/puzzles';
import { PUZZLES as CAGES_FULL } from '../cages/puzzles';
import { PUZZLES as SANDO_FULL } from '../sando/puzzles';
import { PUZZLES as SIXES_FULL } from '../sixes/puzzles';
import { PUZZLES as NICHE_FULL } from '../niche/puzzles';
import { PUZZLES as SHOE_FULL } from '../shoe/puzzles';
import { PUZZLES as QUEEN_FULL } from '../queen/puzzles';
import { PUZZLES as TOWERS_FULL } from '../towers/puzzles';
import { PUZZLES as MERCURY_FULL } from '../mercury/puzzles';
import { PUZZLES as POLKA_FULL } from '../polka/puzzles';
import { PUZZLES as KNIGHT_FULL } from '../knight/puzzles';
const QUILT = QUILT_FULL.map(({ num, quizId, live, dateLabel, sunday }) => ({ num, quizId, live, dateLabel, sunday }));
const CAGES = CAGES_FULL.map(({ num, quizId, live, dateLabel, sunday }) => ({ num, quizId, live, dateLabel, sunday }));
const SANDO = SANDO_FULL.map(({ num, quizId, live, dateLabel, sunday }) => ({ num, quizId, live, dateLabel, sunday }));
const SIXES = SIXES_FULL.map(({ num, quizId, live, dateLabel, sunday }) => ({ num, quizId, live, dateLabel, sunday }));
const NICHE = NICHE_FULL.map(({ num, quizId, live, dateLabel, sunday }) => ({ num, quizId, live, dateLabel, sunday }));
const SHOE = SHOE_FULL.map(({ num, quizId, live, dateLabel, sunday }) => ({ num, quizId, live, dateLabel, sunday }));
const QUEEN = QUEEN_FULL.map(({ num, quizId, live, dateLabel, sunday }) => ({ num, quizId, live, dateLabel, sunday }));
const TOWERS = TOWERS_FULL.map(({ num, quizId, live, dateLabel, sunday }) => ({ num, quizId, live, dateLabel, sunday }));
const MERCURY = MERCURY_FULL.map(({ num, quizId, live, dateLabel, sunday }) => ({ num, quizId, live, dateLabel, sunday }));
const POLKA = POLKA_FULL.map(({ num, quizId, live, dateLabel, sunday }) => ({ num, quizId, live, dateLabel, sunday }));
const KNIGHT = KNIGHT_FULL.map(({ num, quizId, live, dateLabel, sunday }) => ({ num, quizId, live, dateLabel, sunday }));
import { PUZZLES as CARVE } from '../carve/puzzles';
import { PUZZLES as CIRCA } from '../circa/puzzles';
import { PUZZLES as OUTRANK } from '../outrank/puzzles';
import { PUZZLES as EXTRA } from '../extra/puzzles';
import { PUZZLES as STET } from '../stet/puzzles';
import { PUZZLES as OUTWIT_FULL } from '../outwit/puzzles';
import { PUZZLES as TUCK } from '../tuck/puzzles';
import { PUZZLES as ALIBI_FULL } from '../alibi/puzzles';
import { PUZZLES as CIPHER } from '../cipher/puzzles';
import { PUZZLES as PING } from '../ping/puzzles';
import { PUZZLES as WARMER } from '../warmer/puzzles';
import { PUZZLES as JESTER_FULL } from '../jesters/puzzles';
import { PUZZLES as SWORN_FULL } from '../sworn/puzzles';
import { PUZZLES as SHARDS } from '../shards/puzzles';
import { PUZZLES as AXIOM_FULL } from '../axiom/puzzles';
import { PUZZLES as HEARSAY_FULL } from '../hearsay/puzzles';
import { PUZZLES as VENN_FULL } from '../venn/puzzles';
import { PUZZLES as STANDS_FULL } from '../stands/puzzles';
import { PUZZLES as BRACKET_FULL } from '../bracket/puzzles';
// PRICER PULLED 2026-08-09 (see CLAUDE.md). Restore: grep -rn 'PRICER PULLED' daily index import
// import { PUZZLES as PRICER_FULL } from '../pricer/puzzles';
import { PUZZLES as LODE_FULL } from '../lode/puzzles';
import { PUZZLES as ETCH_FULL } from '../etch/puzzles';
import { PUZZLES as GLYPH_FULL } from '../glyph/puzzles';
import { PUZZLES as HEDGE_FULL } from '../hedge/puzzles';
import { PUZZLES as LISTED_FULL } from '../listed/puzzles';
import { PUZZLES as MATE_FULL } from '../mate/puzzles';
import { PUZZLES as FOUR_FULL } from '../four/puzzles';
import { PUZZLES as PARK_FULL } from '../parker/puzzles';
import { PUZZLES as IMPOUND_FULL } from '../impound/puzzles';
import { PUZZLES as JUNKYARD_FULL } from '../junkyard/puzzles';
import { PUZZLES as CHECK_FULL } from '../check/puzzles';
import { PUZZLES as RUNG_FULL } from '../rung/puzzles';
import { PUZZLES as CRUNCH_FULL } from '../crunch/puzzles';
import { PUZZLES as TAIRE_FULL } from '../taire/puzzles';
import { PUZZLES as FIB_FULL } from '../fib/puzzles';
import { PUZZLES as STREAK_FULL } from '../streak/puzzles';
import { PUZZLES as FEUD_FULL } from '../feud/puzzles';
import { PUZZLES as BABEL_FULL } from '../babel/puzzles';
import { PUZZLES as CHAIN_FULL } from '../chain/puzzles';
import { PUZZLES as HANDS_FULL } from '../hands/puzzles';
import { PUZZLES as FINESSE_FULL } from '../finesse/puzzles';
import { PUZZLES as TURN_FULL } from '../turn/puzzles';
import { PUZZLES as SUFFICE_FULL } from '../suffice/puzzles';
import { PUZZLES as DOCKET_FULL } from '../docket/puzzles';
import { PUZZLES as PLOT_FULL } from '../plot/puzzles';
import { PUZZLES as BARTER_FULL } from '../barter/puzzles';
import { PUZZLES as DEFEND_FULL } from '../defend/puzzles';
import { PUZZLES as BLITZ_FULL } from '../blitz/puzzles';
import { PUZZLES as BLITZED_FULL } from '../blitzed/puzzles';
import { PUZZLES as SUMS_FULL } from '../sums/puzzles';
import { PUZZLES as HINGE_FULL } from '../hinge/puzzles';
import { PUZZLES as REDACT_FULL } from '../redact/puzzles';
import { PUZZLES as STRATA_FULL } from '../strata/puzzles';
import { PUZZLES as BLOCKS_FULL } from '../blocks/puzzles';
import { PUZZLES as CHOMP_FULL } from '../chomp/puzzles';
import { PUZZLES as SWEEP_FULL } from '../sweep/puzzles';
import { PUZZLES as PATHS_FULL } from '../paths/puzzles';
import { PUZZLES as DEEP_FULL } from '../deep/puzzles';
import { PUZZLES as ANON_FULL } from '../anon/puzzles';
import { PUZZLES as ATLAS_FULL } from '../atlas/puzzles';
import { PUZZLES as SPORT_FULL } from '../sport/puzzles';
import { PUZZLES as CALC_FULL } from '../calc/puzzles';
import { PUZZLES as ENCORE_FULL } from '../encore/puzzles';
import { PUZZLES as BIZ_FULL } from '../biz/puzzles';
import { PUZZLES as FLANK_FULL } from '../flank/puzzles';
import { PUZZLES as WHITTLE_FULL } from '../whittle/puzzles';
import { PUZZLES as DIAG_FULL } from '../diag/puzzles';
import { PUZZLES as SCRIPT_FULL } from '../script/puzzles';
import { PUZZLES as QUOTES_FULL } from '../quotes/puzzles';
import { PUZZLES as FOCUS_FULL } from '../focus/puzzles';
import { PUZZLES as THREAD_FULL } from '../thread/puzzles';
import { PUZZLES as SLOT_FULL } from '../slot/puzzles';
import { T } from '@/lib/theme';
import { SITE_URL } from '@/lib/site';

// Outwit's bank is server-only in a stronger sense than the others: its
// `house` arrays and herd truths must never reach the client. This page only
// forwards answer-free fields, but strip the sensitive ones defensively.
const OUTWIT = OUTWIT_FULL.map(({ num, quizId, live, dateLabel, sunday }) => ({ num, quizId, live, dateLabel, sunday }));

// Alibi's bank stores each case's solution — strip it (and everything else the
// archive doesn't need) before it can reach a client bundle.
const ALIBI = ALIBI_FULL.map(({ num, quizId, live, dateLabel, sunday }) => ({ num, quizId, live, dateLabel, sunday }));

// Jester and Sworn store their solutions in the bank too — same strip.
const JESTER = JESTER_FULL.map(({ num, quizId, live, dateLabel, sunday }) => ({ num, quizId, live, dateLabel, sunday }));
const SWORN = SWORN_FULL.map(({ num, quizId, live, dateLabel, sunday }) => ({ num, quizId, live, dateLabel, sunday }));
// Axiom and Hearsay ship their boards with verdicts and dialogue; the hub only
// ever needs the date shell, so strip everything else the same way.
const AXIOM = AXIOM_FULL.map(({ num, quizId, live, dateLabel, sunday }) => ({ num, quizId, live, dateLabel, sunday }));
const HEARSAY = HEARSAY_FULL.map(({ num, quizId, live, dateLabel, sunday }) => ({ num, quizId, live, dateLabel, sunday }));
const VENN = VENN_FULL.map(({ num, quizId, live, dateLabel, sunday }) => ({ num, quizId, live, dateLabel, sunday }));
const STANDS = STANDS_FULL.map(({ num, quizId, live, dateLabel, sunday }) => ({ num, quizId, live, dateLabel, sunday }));
const BRACKET = BRACKET_FULL.map(({ num, quizId, live, dateLabel, sunday }) => ({ num, quizId, live, dateLabel, sunday }));
// const PRICER = PRICER_FULL.map(({ num, quizId, live, dateLabel, sunday }) => ({ num, quizId, live, dateLabel, sunday }));
const LODE = LODE_FULL.map(({ num, quizId, live, dateLabel, sunday }) => ({ num, quizId, live, dateLabel, sunday }));
const ETCH = ETCH_FULL.map(({ num, quizId, live, dateLabel, sunday }) => ({ num, quizId, live, dateLabel, sunday }));
const GLYPH = GLYPH_FULL.map(({ num, quizId, live, dateLabel, sunday }) => ({ num, quizId, live, dateLabel, sunday }));
const HEDGE = HEDGE_FULL.map(({ num, quizId, live, dateLabel, sunday }) => ({ num, quizId, live, dateLabel, sunday }));
const LISTED = LISTED_FULL.map(({ num, quizId, live, dateLabel, sunday }) => ({ num, quizId, live, dateLabel, sunday }));
const MATE = MATE_FULL.map(({ num, quizId, live, dateLabel, sunday }) => ({ num, quizId, live, dateLabel, sunday }));
const FOUR = FOUR_FULL.map(({ num, quizId, live, dateLabel, sunday }) => ({ num, quizId, live, dateLabel, sunday }));
const PARK = PARK_FULL.map(({ num, quizId, live, dateLabel, sunday }) => ({ num, quizId, live, dateLabel, sunday }));
const IMPOUND = IMPOUND_FULL.map(({ num, quizId, live, dateLabel, sunday }) => ({ num, quizId, live, dateLabel, sunday }));
const JUNKYARD = JUNKYARD_FULL.map(({ num, quizId, live, dateLabel, sunday }) => ({ num, quizId, live, dateLabel, sunday }));
const CHECK = CHECK_FULL.map(({ num, quizId, live, dateLabel, sunday }) => ({ num, quizId, live, dateLabel, sunday }));
const RUNG = RUNG_FULL.map(({ num, quizId, live, dateLabel, sunday }) => ({ num, quizId, live, dateLabel, sunday }));
const CRUNCH = CRUNCH_FULL.map(({ num, quizId, live, dateLabel, sunday }) => ({ num, quizId, live, dateLabel, sunday }));
const TAIRE = TAIRE_FULL.map(({ num, quizId, live, dateLabel, sunday }) => ({ num, quizId, live, dateLabel, sunday }));
const FIB = FIB_FULL.map(({ num, quizId, live, dateLabel, sunday }) => ({ num, quizId, live, dateLabel, sunday }));
const STREAK = STREAK_FULL.map(({ num, quizId, live, dateLabel, sunday }) => ({ num, quizId, live, dateLabel, sunday }));
// Feud's bank carries the canonical buckets + house pools — same strip.
const FEUD = FEUD_FULL.map(({ num, quizId, live, dateLabel, sunday }) => ({ num, quizId, live, dateLabel, sunday }));
const BABEL = BABEL_FULL.map(({ num, quizId, live, dateLabel, sunday }) => ({ num, quizId, live, dateLabel, sunday }));
const CHAIN = CHAIN_FULL.map(({ num, quizId, live, dateLabel, sunday }) => ({ num, quizId, live, dateLabel, sunday }));
const TURN = TURN_FULL.map(({ num, quizId, live, dateLabel, sunday }) => ({ num, quizId, live, dateLabel, sunday }));
const SUFFICE = SUFFICE_FULL.map(({ num, quizId, live, dateLabel, sunday }) => ({ num, quizId, live, dateLabel, sunday }));
const DOCKET = DOCKET_FULL.map(({ num, quizId, live, dateLabel, sunday }) => ({ num, quizId, live, dateLabel, sunday }));
const PLOT = PLOT_FULL.map(({ num, quizId, live, dateLabel, sunday }) => ({ num, quizId, live, dateLabel, sunday }));
const BARTER = BARTER_FULL.map(({ num, quizId, live, dateLabel, sunday }) => ({ num, quizId, live, dateLabel, sunday }));
const DEFEND = DEFEND_FULL.map(({ num, quizId, live, dateLabel, sunday }) => ({ num, quizId, live, dateLabel, sunday }));
const BLITZ = BLITZ_FULL.map(({ num, quizId, live, dateLabel }) => ({ num, quizId, live, dateLabel }));
const BLITZED = BLITZED_FULL.map(({ num, quizId, live, dateLabel }) => ({ num, quizId, live, dateLabel }));
const SUMS = SUMS_FULL.map(({ num, quizId, live, dateLabel, sunday }) => ({ num, quizId, live, dateLabel, sunday }));
const HINGE = HINGE_FULL.map(({ num, quizId, live, dateLabel, sunday }) => ({ num, quizId, live, dateLabel, sunday }));
const REDACT = REDACT_FULL.map(({ num, quizId, live, dateLabel, sunday }) => ({ num, quizId, live, dateLabel, sunday }));
const STRATA = STRATA_FULL.map(({ num, quizId, live, dateLabel, sunday }) => ({ num, quizId, live, dateLabel, sunday }));
const BLOCKS = BLOCKS_FULL.map(({ num, quizId, live, dateLabel, sunday }) => ({ num, quizId, live, dateLabel, sunday }));
const CHOMP = CHOMP_FULL.map(({ num, quizId, live, dateLabel, sunday }) => ({ num, quizId, live, dateLabel, sunday }));
// The field is dropped here on purpose: the archive card needs the frame only,
// and shipping 60 days of mine maps to a page that never digs would be silly.
const SWEEP = SWEEP_FULL.map(({ num, quizId, live, dateLabel, sunday }) => ({ num, quizId, live, dateLabel, sunday }));
const PATHS = PATHS_FULL.map(({ num, quizId, live, dateLabel, sunday }) => ({ num, quizId, live, dateLabel, sunday }));
const DEEP = DEEP_FULL.map(({ num, quizId, live, dateLabel, sunday }) => ({ num, quizId, live, dateLabel, sunday }));
const ANON = ANON_FULL.map(({ num, quizId, live, dateLabel, sunday }) => ({ num, quizId, live, dateLabel, sunday }));
const ATLAS = ATLAS_FULL.map(({ num, quizId, live, dateLabel, sunday }) => ({ num, quizId, live, dateLabel, sunday }));
const SPORT = SPORT_FULL.map(({ num, quizId, live, dateLabel, sunday }) => ({ num, quizId, live, dateLabel, sunday }));
const CALC = CALC_FULL.map(({ num, quizId, live, dateLabel, sunday }) => ({ num, quizId, live, dateLabel, sunday }));
const ENCORE = ENCORE_FULL.map(({ num, quizId, live, dateLabel, sunday }) => ({ num, quizId, live, dateLabel, sunday }));
const BIZ = BIZ_FULL.map(({ num, quizId, live, dateLabel, sunday }) => ({ num, quizId, live, dateLabel, sunday }));
const FLANK = FLANK_FULL.map(({ num, quizId, live, dateLabel, sunday }) => ({ num, quizId, live, dateLabel, sunday }));
const WHITTLE = WHITTLE_FULL.map(({ num, quizId, live, dateLabel, sunday }) => ({ num, quizId, live, dateLabel, sunday }));
const DIAG = DIAG_FULL.map(({ num, quizId, live, dateLabel, sunday }) => ({ num, quizId, live, dateLabel, sunday }));
const SCRIPT = SCRIPT_FULL.map(({ num, quizId, live, dateLabel, sunday }) => ({ num, quizId, live, dateLabel, sunday }));
const QUOTES = QUOTES_FULL.map(({ num, quizId, live, dateLabel, sunday }) => ({ num, quizId, live, dateLabel, sunday }));
const FOCUS = FOCUS_FULL.map(({ num, quizId, live, dateLabel, sunday }) => ({ num, quizId, live, dateLabel, sunday }));
const THREAD = THREAD_FULL.map(({ num, quizId, live, dateLabel, sunday }) => ({ num, quizId, live, dateLabel, sunday }));
const SLOT = SLOT_FULL.map(({ num, quizId, live, dateLabel, sunday }) => ({ num, quizId, live, dateLabel, sunday }));
const HANDS = HANDS_FULL.map(({ num, quizId, live, dateLabel, sunday }) => ({ num, quizId, live, dateLabel, sunday }));
const FINESSE = FINESSE_FULL.map(({ num, quizId, live, dateLabel, sunday }) => ({ num, quizId, live, dateLabel, sunday }));

// The daily-games hub + archive. One page listing every daily puzzle, each with
// today's puzzle and its full back-catalog of past drops (live<=today only, so
// future puzzles and their answers never ship). Played/unplayed state is read
// client-side from each game's per-puzzle localStorage save.

export const metadata = {
  title: 'Daily Puzzles — Crux, Emcee, Garble, Links, Span & More | Mind Loft',
  description:
    "Every Mind Loft daily puzzle in one place: today's puzzle and the full archive for Crux, Emcee, Garble, Links, Span, Dating, Tally, Suds, Circa, Extra, Carve, Stet, Outwit, Tuck, Lode, Alibi, Cipher, Ping, Warmer, Jesters, Sworn, Shards, Axiom, Hearsay, Venn, Stands, and Bracket. A new puzzle in each, every day.",
  alternates: { canonical: '/daily' },
  openGraph: {
    title: 'Daily Puzzles — Mind Loft',
    description:
      "Today's puzzle and the full archive for every daily puzzle: Crux, Emcee, Garble, Links, Span, Dating, Tally, Suds, Circa, Extra, Carve, Stet, Outwit, Tuck, Lode, Alibi, Cipher, Ping, Warmer, Jesters, Sworn, Shards, Axiom, Hearsay, Venn, Stands, and Bracket.",
    url: '/daily',
    type: 'website',
    siteName: 'Mind Loft',
  },
};

export const dynamic = 'force-dynamic';

function etTodayServer() {
  try {
    return new Date().toLocaleDateString('en-CA', { timeZone: 'America/New_York' });
  } catch (e) {
    return new Date().toISOString().slice(0, 10);
  }
}

// Which drops are the bigger/harder Sunday Edition. EVERY game that runs one
// flags it right on the puzzle (`sunday: true`) — that flag is the single
// source of truth site-wide, and Crux was converted to it (2026-07-20), so the
// old `guesses === 27` heuristic is gone. Games with no distinct Sunday
// (Garble, Links, Dating, Outwit, Tuck, Alibi, Cipher, Warmer) never set it,
// so they stay unmarked. See the Sunday Editions section of CLAUDE.md.
function isSundayEdition(key, p) {
  return p.sunday === true;
}

// Accents mirror DailyGamesPromo so each game reads the same across surfaces.
const GAMES = [
  { key: 'crux', name: 'Crux', path: '/crux', tag: 'A clueless crossword', accent: T.blue, bg: '#eef4ff', border: 'rgba(37,99,235,0.35)', src: CRUX },
  { key: 'emcee', name: 'Emcee', path: '/emcee', tag: 'The daily mini crossword', accent: '#c026d3', bg: '#fbeefc', border: 'rgba(192,38,211,0.4)', src: EMCEE },
  { key: 'shards', name: 'Shards', path: '/shards', tag: 'Reassemble the shattered crossword', accent: '#0d9488', bg: '#d9f0ee', border: 'rgba(13,148,136,0.4)', src: SHARDS },
  { key: 'garble', name: 'Garble', path: '/garble', tag: 'Five garbled words, one clued finale', accent: '#8a6d1a', bg: '#fdf6e3', border: 'rgba(230,185,63,0.6)', src: GARBLE },
  { key: 'links', name: 'Links', path: '/links', tag: 'Sixteen words, four hidden groups', accent: '#166534', bg: '#eefaf1', border: 'rgba(90,169,106,0.5)', src: LINKS },
  { key: 'span', name: 'Span', path: '/span', tag: 'Cross the map, border by border', accent: '#9d174d', bg: '#fdf0f6', border: 'rgba(217,99,153,0.45)', src: SPAN },
  { key: 'dating', name: 'Dating', path: '/dating', tag: 'Put five moments in order', accent: '#6d28d9', bg: '#f5f0ff', border: 'rgba(124,58,237,0.4)', src: DATING },
  { key: 'tally', name: 'Tally', path: '/tally', tag: 'Balance every row and column', accent: T.successDeep, bg: '#eefaf1', border: 'rgba(21,128,61,0.45)', src: TALLY },
  { key: 'suds', name: 'Suds', path: '/suds', tag: 'Fill the 9×9 grid, 1–9', accent: '#ea580c', bg: '#fff5ed', border: 'rgba(234,88,12,0.4)', src: SUDS },
  { key: 'quilt', name: 'Quilt', path: '/quilt', tag: 'Nine crooked regions, 1–9', accent: '#a21caf', bg: '#fdf4ff', border: 'rgba(162,28,175,0.4)', src: QUILT },
  { key: 'cages', name: 'Cages', path: '/cages', tag: 'Killer sudoku, no clues', accent: '#6b21a8', bg: '#f6f2fd', border: 'rgba(107,33,168,0.4)', src: CAGES },
  { key: 'towers', name: 'Towers', path: '/towers', tag: 'Skyscrapers, clues on the border', accent: '#075985', bg: '#eaf4fa', border: 'rgba(7,89,133,0.4)', src: TOWERS },
  { key: 'mercury', name: 'Mercury', path: '/mercury', tag: 'The daily thermo sudoku', accent: '#991b1b', bg: '#fdf1f1', border: 'rgba(153,27,27,0.4)', src: MERCURY },
  { key: 'polka', name: 'Polka', path: '/polka', tag: 'Kropki, no numbers at all', accent: '#16a34a', bg: '#ecf9f1', border: 'rgba(22,163,74,0.4)', src: POLKA },
  { key: 'knight', name: 'Knight', path: '/knight', tag: 'Sudoku plus the knight rule', accent: '#3730a3', bg: '#f1f0fd', border: 'rgba(55,48,163,0.4)', src: KNIGHT },
  { key: 'queen', name: 'Queen', path: '/queen', tag: 'White to play and promote', accent: '#a16207', bg: '#faf3e3', border: 'rgba(161,98,7,0.4)', src: QUEEN },
  { key: 'shoe', name: 'Shoe', path: '/shoe', tag: 'The daily blackjack shoe', accent: '#0c4a6e', bg: '#e8f3fa', border: 'rgba(12,74,110,0.4)', src: SHOE },
  { key: 'niche', name: 'Niche', path: '/niche', tag: 'One answer, two categories', accent: '#115e59', bg: '#ecfdf8', border: 'rgba(17,94,89,0.4)', src: NICHE },
  { key: 'sixes', name: 'Sixes', path: '/sixes', tag: 'Mini sudoku, 1 to 6', accent: '#1d4ed8', bg: '#eef3ff', border: 'rgba(29,78,216,0.4)', src: SIXES },
  { key: 'sando', name: 'Sando', path: '/sando', tag: 'Sandwich sudoku, 1 to 9', accent: '#15616b', bg: '#eaf6f7', border: 'rgba(21,97,107,0.4)', src: SANDO },
  { key: 'carve', name: 'Carve', path: '/carve', tag: 'Carve the grid into equal sums', accent: '#7c3aed', bg: '#f5f0ff', border: 'rgba(124,58,237,0.4)', src: CARVE },
  { key: 'circa', name: 'Circa', path: '/circa', tag: 'Pin the year of the moment', accent: '#0e7490', bg: '#e8f7fa', border: 'rgba(14,116,144,0.4)', src: CIRCA },
  { key: 'extra', name: 'Extra', path: '/extra', tag: 'Unredact the front page', accent: '#b91c1c', bg: '#fdeeee', border: 'rgba(185,28,28,0.4)', src: EXTRA },
  { key: 'stet', name: 'Stet', path: '/stet', tag: 'Spot the error, fix the copy', accent: '#0369a1', bg: '#e8f3fa', border: 'rgba(3,105,161,0.4)', src: STET },
  { key: 'outwit', name: 'Outwit', path: '/outwit', tag: 'Five duels against the crowd', accent: '#1f2937', bg: T.surfaceAlt, border: 'rgba(31,41,55,0.35)', src: OUTWIT },
  { key: 'outrank', name: 'Outrank', path: '/outrank', tag: "Call the crowd's order", accent: '#4338ca', bg: '#eef0fb', border: 'rgba(67,56,202,0.4)', src: OUTRANK },
  { key: 'tuck', name: 'Tuck', path: '/tuck', tag: 'Same letters, highest score wins', accent: '#92400e', bg: '#f5e9dc', border: 'rgba(146,64,14,0.35)', src: TUCK },
  { key: 'alibi', name: 'Alibi', path: '/alibi', tag: 'Solve the nightly whodunit', accent: '#8b1e2d', bg: '#f6e3e5', border: 'rgba(139,30,45,0.35)', src: ALIBI },
  { key: 'cipher', name: 'Cipher', path: '/cipher', tag: 'Crack the letter math', accent: '#0f766e', bg: '#d9f0ee', border: 'rgba(15,118,110,0.35)', src: CIPHER },
  { key: 'ping', name: 'Ping', path: '/ping', tag: 'Find the secret city', accent: '#0284c7', bg: '#e0f2fe', border: 'rgba(2,132,199,0.35)', src: PING },
  { key: 'warmer', name: 'Warmer', path: '/warmer', tag: 'Hotter or colder', accent: '#dc2626', bg: '#fef2f2', border: 'rgba(220,38,38,0.35)', src: WARMER },
  { key: 'jester', name: 'Jesters', path: '/jesters', tag: 'Seat the court', accent: '#7c3aed', bg: '#f3e8ff', border: 'rgba(124,58,237,0.35)', src: JESTER },
  { key: 'sworn', name: 'Sworn', path: '/sworn', tag: 'Spot the liars', accent: '#be185d', bg: '#fce7f3', border: 'rgba(190,24,93,0.35)', src: SWORN },
  { key: 'axiom', name: 'Axiom', path: '/axiom', tag: 'Find the hidden rule', accent: '#0f766e', bg: '#ccfbf1', border: 'rgba(15,118,110,0.35)', src: AXIOM },
  { key: 'hearsay', name: 'Hearsay', path: '/hearsay', tag: "Deduce what they don't know", accent: '#7c2d92', bg: '#f5e8fb', border: 'rgba(124,45,146,0.35)', src: HEARSAY },
  { key: 'venn', name: 'Venn', path: '/venn', tag: 'Sort the overlaps', accent: '#b45309', bg: '#fef3c7', border: 'rgba(180,83,9,0.35)', src: VENN },
  { key: 'stands', name: 'Stands', path: '/stands', tag: 'Rebuild the results', accent: T.blueDeep, bg: '#dbeafe', border: 'rgba(29,78,216,0.35)', src: STANDS },
  { key: 'bracket', name: 'Bracket', path: '/bracket', tag: 'Name every winner', accent: '#c2410c', bg: '#ffedd5', border: 'rgba(194,65,12,0.35)', src: BRACKET },
  // PRICER PULLED 2026-08-09 (see CLAUDE.md). Restore: grep -rn 'PRICER PULLED' daily index tile
  // { key: 'pricer', name: 'Pricer', path: '/pricer', tag: 'Some days more, some days less', accent: '#15803d', bg: '#dcfce7', border: 'rgba(21,128,61,0.35)', src: PRICER },
  { key: 'lode', name: 'Lode', path: '/lode', tag: 'Seven letters, rare words pay', accent: T.goldInk, bg: '#fef7e0', border: 'rgba(161,98,7,0.35)', src: LODE },
  { key: 'etch', name: 'Etch', path: '/etch', tag: 'A picture in the numbers', accent: '#4d7c0f', bg: '#f3f8e8', border: 'rgba(77,124,15,0.35)', src: ETCH },
  { key: 'glyph', name: 'Glyph', path: '/glyph', tag: 'A crossword with no clues', accent: '#334155', bg: T.surfaceAlt, border: 'rgba(51,65,85,0.35)', src: GLYPH },
  { key: 'hedge', name: 'Hedge', path: '/hedge', tag: 'Draw one closed loop', accent: '#0891b2', bg: '#e6f6fa', border: 'rgba(8,145,178,0.35)', src: HEDGE },
  { key: 'listed', name: 'Listed', path: '/listed', tag: 'Rank the list, top to bottom', accent: '#86198f', bg: '#fdf2fe', border: 'rgba(134,25,143,0.35)', src: LISTED },
  { key: 'mate', name: 'Mate', path: '/mate', tag: 'White to play and mate', accent: '#6b4423', bg: '#f6efe6', border: 'rgba(107,68,35,0.35)', src: MATE },
  { key: 'four', name: 'Four', path: '/four', tag: 'One column wins', accent: T.blueDark, bg: '#e8eefc', border: 'rgba(35,58,99,0.35)', src: FOUR },
  { key: 'park', name: 'Parker', path: '/parker', tag: 'Get the red one out', accent: '#7c5c2e', bg: '#f6efe2', border: 'rgba(124,92,46,0.35)', src: PARK },
  { key: 'impound', name: 'Impound', path: '/impound', tag: 'Parker on a bigger lot', accent: '#6b4a1f', bg: '#f3ece0', border: 'rgba(107,74,31,0.35)', src: IMPOUND },
  { key: 'junkyard', name: 'Junkyard', path: '/junkyard', tag: 'Parker on the biggest lot', accent: '#5c3a16', bg: '#f0e7d8', border: 'rgba(92,58,22,0.35)', src: JUNKYARD },
  { key: 'check', name: 'Check', path: '/check', tag: 'Red to play and sweep', accent: '#166e5a', bg: '#e6f3ef', border: 'rgba(22,110,90,0.35)', src: CHECK },
  { key: 'rung', name: 'Rung', path: '/rung', tag: 'One letter at a time', accent: '#155e75', bg: '#e4f2f6', border: 'rgba(21,94,117,0.35)', src: RUNG },
  { key: 'hinge', name: 'Hinge', path: '/hinge', tag: 'Chain the compounds', accent: '#4f46e5', bg: '#e0e7ff', border: 'rgba(79,70,229,0.4)', src: HINGE },
  { key: 'crunch', name: 'Crunch', path: '/crunch', tag: 'Six numbers, one target', accent: '#b45309', bg: '#fdf3e3', border: 'rgba(180,83,9,0.35)', src: CRUNCH },
  { key: 'taire', name: 'Taire', path: '/taire', tag: 'The daily solitaire', accent: '#1d6b4f', bg: '#e6f2ec', border: 'rgba(29,107,79,0.35)', src: TAIRE },
  { key: 'fib', name: 'Fib', path: '/fib', tag: 'One clue is lying', accent: '#4c1d95', bg: '#f1edfb', border: 'rgba(76,29,149,0.35)', src: FIB },
  { key: 'streak', name: 'Streak', path: '/streak', tag: 'Forty questions, one life', accent: '#e11d48', bg: '#fdecef', border: 'rgba(225,29,72,0.35)', src: STREAK },
  { key: 'feud', name: 'Feud', path: '/feud', tag: 'Match the crowd', accent: '#9f1239', bg: '#fdf0f3', border: 'rgba(159,18,57,0.4)', src: FEUD },
  { key: 'babel', name: 'Babel', path: '/babel', tag: 'The bag is empty', accent: '#14532d', bg: '#e9f2ec', border: 'rgba(20,83,45,0.4)', src: BABEL },
  { key: 'hands', name: 'Hands', path: '/hands', tag: 'The daily poker solitaire', accent: '#7f1d1d', bg: '#f6eaea', border: 'rgba(127,29,29,0.4)', src: HANDS },
  { key: 'finesse', name: 'Finesse', path: '/finesse', tag: 'The daily double dummy', accent: '#4c1d95', bg: '#ede9fe', border: 'rgba(76,29,149,0.4)', src: FINESSE },
  { key: 'chain', name: 'Chain', path: '/chain', tag: 'Take them, or leave them', accent: '#4a044e', bg: '#f6ecf8', border: 'rgba(74,4,78,0.4)', src: CHAIN },
  { key: 'turn', name: 'Turn', path: '/turn', tag: 'Ten squares left', accent: '#226218', bg: '#e9f3e6', border: 'rgba(34,98,24,0.4)', src: TURN },
  { key: 'suffice', name: 'Suffice', path: '/suffice', tag: 'Decide what is enough', accent: '#4338ca', bg: '#eef0ff', border: 'rgba(67,56,202,0.4)', src: SUFFICE },
  { key: 'docket', name: 'Docket', path: '/docket', tag: 'One setup, five deductions', accent: '#5b2333', bg: '#f7e8ec', border: 'rgba(91,35,51,0.4)', src: DOCKET },
  { key: 'plot', name: 'Plot', path: '/plot', tag: 'Divide the whole board', accent: '#78350f', bg: '#fbf1e5', border: 'rgba(120,53,15,0.4)', src: PLOT },
  { key: 'barter', name: 'Barter', path: '/barter', tag: 'Trade the letters home', accent: '#be123c', bg: '#fdeef2', border: 'rgba(190,18,60,0.4)', src: BARTER },
  { key: 'defend', name: 'Defend', path: '/defend', tag: 'Black to play and survive', accent: '#2f4f4f', bg: '#e9f0ef', border: 'rgba(47,79,79,0.4)', src: DEFEND },
  { key: 'blitz', name: 'Blitz', path: '/blitz', tag: 'Twenty problems, one life', accent: '#657512', bg: '#f3f7de', border: 'rgba(101,117,18,0.4)', src: BLITZ },
  { key: 'blitzed', name: 'Blitzed', path: '/blitzed', tag: 'Twenty problems, three numbers each', accent: '#3f6d1f', bg: '#eaf5e2', border: 'rgba(63,109,31,0.4)', src: BLITZED },
  { key: 'sums', name: 'Sums', path: '/sums', tag: 'The daily kakuro', accent: '#be185d', bg: '#fce7f3', border: 'rgba(190,24,93,0.4)', src: SUMS },
  { key: 'redact', name: 'Redact', path: '/redact', tag: 'Uncover the story', accent: '#27272a', bg: '#f4f4f5', border: 'rgba(39,39,42,0.4)', src: REDACT },
  { key: 'paths', name: 'Paths', path: '/paths', tag: 'Link every town', accent: '#065f46', bg: '#e6f4ee', border: 'rgba(6,95,70,0.4)', src: PATHS },
  { key: 'deep', name: 'Deep', path: '/deep', tag: 'One topic, fifteen questions', accent: '#0c4a6e', bg: '#e6f1f8', border: 'rgba(12,74,110,0.4)', src: DEEP },
  { key: 'anon', name: 'Anon', path: '/anon', tag: 'A clueless acrostic', accent: '#8c2f39', bg: '#f8ecee', border: 'rgba(140,47,57,0.4)', src: ANON },
  { key: 'strata', name: 'Strata', path: '/strata', tag: 'Dig the words out', accent: '#9a3412', bg: '#fdf0e7', border: 'rgba(154,52,18,0.4)', src: STRATA },
  { key: 'chomp', name: 'Chomp', path: '/chomp', tag: 'Eat them in order', accent: '#a8430f', bg: '#fbeadf', border: 'rgba(168,67,15,0.4)', src: CHOMP },
  { key: 'blocks', name: 'Blocks', path: '/blocks', tag: 'Same shapes, same order', accent: '#1d4ed8', bg: '#e8edfa', border: 'rgba(29,78,216,0.4)', src: BLOCKS },
  { key: 'sweep', name: 'Sweep', path: '/sweep', tag: 'No bottom edge', accent: '#0f766e', bg: '#e2f2f0', border: 'rgba(15,118,110,0.4)', src: SWEEP },
  { key: 'atlas', name: 'Atlas', path: '/atlas', tag: 'Twenty-five questions, one life', accent: '#047857', bg: '#e7f4ee', border: 'rgba(4,120,87,0.4)', src: ATLAS },
  { key: 'sport', name: 'Sport', path: '/sport', tag: 'Every sport, one life', accent: '#7c2d12', bg: '#fbeee6', border: 'rgba(124,45,18,0.4)', src: SPORT },
  { key: 'calc', name: 'Calc', path: '/calc', tag: 'Walk the calculator', accent: '#be123c', bg: '#fff1f4', border: 'rgba(190,18,60,0.4)', src: CALC },
  { key: 'encore', name: 'Encore', path: '/encore', tag: 'The daily crossword', accent: '#1d4ed8', bg: '#eff6ff', border: 'rgba(29,78,216,0.4)', src: ENCORE },
  { key: 'biz', name: 'Biz', path: '/biz', tag: 'Business, one life', accent: '#0f5132', bg: '#e9f5ee', border: 'rgba(15,81,50,0.4)', src: BIZ },
  { key: 'flank', name: 'Flank', path: '/flank', tag: 'Name every neighbor', accent: '#3f6212', bg: '#f3f8ea', border: 'rgba(63,98,18,0.4)', src: FLANK },
  { key: 'whittle', name: 'Whittle', path: '/whittle', tag: 'The sudoku, backwards', accent: '#854d0e', bg: '#fdf6e9', border: 'rgba(133,77,14,0.4)', src: WHITTLE },
  { key: 'diag', name: 'Diag', path: '/diag', tag: 'Sudoku plus the two diagonals', accent: '#0e7490', bg: '#e8f6fa', border: 'rgba(14,116,144,0.4)', src: DIAG },
  { key: 'script', name: 'Script', path: '/script', tag: 'Movies and TV, one life', accent: '#4a1d6b', bg: '#f3ecf9', border: 'rgba(74,29,107,0.4)', src: SCRIPT },
  { key: 'quotes', name: 'Quotes', path: '/quotes', tag: 'Who said it, one life', accent: '#3d4f7c', bg: '#eef1f8', border: 'rgba(61,79,124,0.4)', src: QUOTES },
  { key: 'focus', name: 'Focus', path: '/focus', tag: 'Name the zoomed-in photo', accent: '#8a4b08', bg: '#fdf3e6', border: 'rgba(138,75,8,0.4)', src: FOCUS },
  { key: 'thread', name: 'Thread', path: '/thread', tag: 'Nine films described badly, one thread', accent: '#8b2c6b', bg: '#f7e9f2', border: 'rgba(139,44,107,0.4)', src: THREAD },
  { key: 'slot', name: 'Slot', path: '/slot', tag: 'Ten things, one at a time', accent: '#4a5d23', bg: '#eef2e3', border: 'rgba(74,93,35,0.4)', src: SLOT },
];

const breadcrumbJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'BreadcrumbList',
  itemListElement: [
    { '@type': 'ListItem', position: 1, name: 'Home', item: `${SITE_URL}` },
    { '@type': 'ListItem', position: 2, name: 'Quizzes', item: `${SITE_URL}/quizzes` },
    { '@type': 'ListItem', position: 3, name: 'Daily Puzzles' },
  ],
};

export default function DailyPage() {
  const today = etTodayServer();
  // Slim, answer-free shape: only what the archive UI needs, so puzzle content
  // never reaches the client bundle.
  const games = GAMES.map((g) => ({
    key: g.key,
    name: g.name,
    path: g.path,
    tag: g.tag,
    accent: g.accent,
    bg: g.bg,
    border: g.border,
    puzzles: g.src
      .filter((p) => p.live <= today)
      .map((p) => ({ num: p.num, dateLabel: p.dateLabel, live: p.live, rev: p.rev || null, quizId: p.quizId, sunday: isSundayEdition(g.key, p) }))
      .sort((a, b) => b.num - a.num),
  }));
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />
      <DailyArchiveClient games={games} today={today} />
    </>
  );
}
