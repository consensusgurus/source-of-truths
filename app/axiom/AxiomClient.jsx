'use client';

// Axiom — the daily rule-induction puzzle.
//
// A board of word tiles hides one rule. Three tiles open green (the rule is
// true of them) and two open red (it is not). Five candidate rules are on the
// table from the first second, and exactly one of them is consistent with the
// whole board. You spend a small budget of tests, flipping tiles one at a time,
// then name the rule.
//
// The reasoning the puzzle is really about: the gift reds already kill a rule or
// two, most tiles are traps that every surviving rule agrees on (testing one
// teaches nothing), and every board is built so that no single test can split
// the field. Perfect is two. A tapper burns the budget; a thinker spends two.
//
// The client never receives the answer: the server page ships tiles, verdicts
// and rule SPECS, and this component finds the one candidate that agrees with
// every tile — the same uniqueness the generator proved (scripts/verify-axiom.mjs).
//
// Scoring: 12 points. Each test over perfect costs 2, each wrong rule costs 3, and
// the floor is 1 for anyone who names it at all. Revealing ends the day at 0.
// Ties on the daily board break by fewest tests, then fastest time.
//
// Same daily plumbing as Sworn/Alibi/Jester: banked boards gated by Eastern
// date on the server (app/axiom/page.js), per-puzzle localStorage saves,
// /axiom?p=N archive pinning, streaks + stats, shared /api/quiz/* board flow.

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useSearchParams } from 'next/navigation';
import { HelpCircle, X, Smartphone, FlaskConical, Eraser, Ban } from 'lucide-react';
import Grain from '../Grain';
import Footer from '../Footer';
import useDuelContext, { DuelBanner } from '../quiz/[id]/useDuelContext';
import JoinLeaderboardForm from '../quiz/[id]/JoinLeaderboardForm';
import DailyGamesGrid from '../DailyGamesGrid';
import DailyEndCard from '../DailyEndCard';
import DailyChrome from '../DailyChrome';
import DailyBoardPanel from '../quiz/[id]/DailyBoardPanel';
import useAbandonFlush from '../quiz/[id]/useAbandonFlush';
import { isMobileDevice } from '@/lib/is-mobile';
import { withRef } from '@/lib/referrals';
import { notifyShareCredit } from '../ShareCreditPop';
import DailyMasthead from '../DailyMasthead';
import { isLoft } from '@/lib/loft';
import ReportIssue from '../ReportIssue';
import StageFold from '../StageFold';
import LoftCap from '../LoftCap';
import StageChrome from '../StageChrome';
import { isStage } from '@/lib/stage';
import { useStageTheme } from '@/lib/stage-theme';
import { gameColor, gameColorLight, RAMP_INK, STAGE_GROUND, gameOnrampLight, gameAccentInkLight } from '@/lib/category-ramp';
import GamePanel from '../GamePanel';
import useIqStanding from '../useIqStanding';
import useNextUnplayed, { useUnplayedSimilar } from '../useNextUnplayed';
import useDailyBoard from '../useDailyBoard';
import useGameAllTime from '../useGameAllTime';
import useDayStats from '../useDayStats';
import useCategoryRank from '../useCategoryRank';
import LoftFinish from '../LoftFinish';
import { CONTEST, contestIsLive } from '@/lib/contest';
import DailyRules from '../DailyRules';
import { T } from '@/lib/theme';
import { meRequest } from '@/app/quizMeClient';

const COLORS = {
  cream: T.surface,
  paper: T.paper,
  ink: T.ink,
  ember: T.accent,
  rust: T.danger,
  faded: T.muted,
  accent: '#0f766e',        // Axiom identity — laboratory teal
  accentSoft: '#ccfbf1',
  accentDeep: '#115e59',
  green: T.successDeep,
  greenSoft: '#dcfce7',
  redSoft: '#fee2e2',
  redInk: '#b91c1c',
};
const PRESS_SLOP_PX = 12;      // drift a long press tolerates before it reads as a scroll, same as Sweep's
const SANS = "'Manrope', system-ui, -apple-system, sans-serif";
const MONO = "'DM Mono', ui-monospace, 'SFMono-Regular', monospace";
const HELP_KEY = 'sot_axiom_help_seen';
const STATS_KEY = 'sot_axiom_stats';
const TOOL_KEY = 'sot_axiom_tool';   // remembered tool: 'mark' | 'test'
const TOTAL = 12;
const WRONG_COST = 4;      // a wrong name
const UNPROVEN_COST = 4;   // per rule still standing when you name the right one
const MAX_WRONG = 2;       // wrong names allowed before the day is over

// ─── the rule language ──────────────────────────────────────────────────────
// Specs are data in puzzles.js; the predicate and the reader-facing label both
// live here, so the two can never drift. Vowels are A E I O U — Y never counts,
// which the rules panel says out loud.
const VOW = new Set(['A', 'E', 'I', 'O', 'U']);
const nv = (w) => [...w].filter((c) => VOW.has(c)).length;
const HIDDEN = {
  animal: ['CAT', 'DOG', 'COW', 'OWL', 'BAT', 'APE', 'RAT', 'PIG', 'HEN', 'FOX', 'ANT', 'BEE', 'ELK', 'EWE', 'SOW', 'RAM'],
  body: ['EAR', 'RIB', 'HIP', 'ARM', 'LIP', 'GUM', 'JAW', 'TOE', 'EYE', 'LEG', 'SHIN', 'HEEL', 'CHIN', 'LUNG', 'SKIN', 'NECK', 'BONE', 'FOOT', 'HAND', 'HEAD', 'NOSE', 'KNEE', 'ELBOW', 'WRIST', 'ANKLE', 'THUMB', 'THIGH', 'SPINE', 'HEART', 'BRAIN', 'LIVER', 'TOOTH', 'CHEST', 'THROAT', 'TONGUE'],
  number: ['ONE', 'TWO', 'SIX', 'TEN', 'NINE', 'FOUR', 'FIVE'],
};
const HIDDEN_NAME = { animal: 'an animal', body: 'a body part', number: 'a number' };
const NUMWORD = ['zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten'];

const SETS = {
  mammal: ['DOG', 'CAT', 'COW', 'PIG', 'FOX', 'RAT', 'BAT', 'APE', 'ELK', 'YAK', 'LION', 'BEAR', 'WOLF', 'DEER', 'GOAT', 'SEAL', 'MOLE', 'HARE', 'LYNX', 'PUMA', 'ORCA', 'BOAR', 'TIGER', 'HORSE', 'ZEBRA', 'CAMEL', 'MOOSE', 'MOUSE', 'SHEEP', 'WHALE', 'OTTER', 'PANDA', 'KOALA', 'SLOTH', 'RHINO', 'HIPPO', 'BISON', 'HYENA', 'LLAMA', 'LEMUR', 'SKUNK', 'TAPIR', 'MONKEY', 'RABBIT', 'DONKEY', 'BEAVER', 'BADGER', 'WALRUS', 'WEASEL', 'COUGAR', 'JAGUAR', 'BABOON', 'ALPACA', 'COYOTE', 'FERRET', 'MARMOT', 'WOMBAT', 'GIRAFFE', 'LEOPARD', 'DOLPHIN', 'GORILLA', 'HAMSTER', 'RACCOON', 'BUFFALO', 'CHEETAH', 'GAZELLE', 'MEERKAT', 'OPOSSUM', 'PANTHER', 'WARTHOG', 'ANTELOPE', 'KANGAROO', 'PORPOISE', 'REINDEER', 'SQUIRREL', 'CHIPMUNK', 'HEDGEHOG', 'MONGOOSE', 'PLATYPUS', 'ARMADILLO', 'PORCUPINE'],
  bird: ['OWL', 'HEN', 'CROW', 'SWAN', 'DUCK', 'HAWK', 'DOVE', 'WREN', 'KIWI', 'EMU', 'ROBIN', 'RAVEN', 'EAGLE', 'HERON', 'GOOSE', 'STORK', 'FINCH', 'QUAIL', 'EGRET', 'PIGEON', 'PARROT', 'TURKEY', 'FALCON', 'MAGPIE', 'CONDOR', 'TOUCAN', 'PUFFIN', 'PENGUIN', 'PELICAN', 'SPARROW', 'OSTRICH', 'VULTURE'],
  fish: ['EEL', 'COD', 'CARP', 'TUNA', 'BASS', 'PIKE', 'SHARK', 'TROUT', 'PERCH', 'SALMON', 'MARLIN', 'GUPPY', 'MINNOW', 'SARDINE', 'HERRING', 'ANCHOVY'],
  fruit: ['FIG', 'DATE', 'PLUM', 'PEAR', 'LIME', 'APPLE', 'LEMON', 'MANGO', 'GRAPE', 'PEACH', 'MELON', 'BERRY', 'GUAVA', 'LYCHEE', 'CHERRY', 'BANANA', 'ORANGE', 'PAPAYA', 'APRICOT'],
  vegetable: ['PEA', 'BEAN', 'CORN', 'KALE', 'LEEK', 'BEET', 'OKRA', 'ONION', 'CARROT', 'POTATO', 'CELERY', 'PEPPER', 'TURNIP', 'RADISH', 'SQUASH', 'GARLIC', 'CABBAGE', 'SPINACH', 'PARSNIP'],
  drink: ['TEA', 'COLA', 'SODA', 'MILK', 'WINE', 'BEER', 'CIDER', 'COCOA', 'JUICE', 'WATER', 'LATTE', 'MOCHA', 'COFFEE', 'NECTAR'],
  country: [
   'CHAD', 'CUBA', 'FIJI', 'IRAN', 'IRAQ', 'LAOS', 'MALI', 'OMAN', 'PERU', 'TOGO', 'BENIN', 'CHILE', 'CHINA',
    'EGYPT', 'GABON', 'GHANA', 'HAITI', 'INDIA', 'ITALY', 'JAPAN', 'KENYA', 'LIBYA', 'MALTA', 'NAURU', 'NEPAL',
    'NIGER', 'PALAU', 'QATAR', 'SAMOA', 'SPAIN', 'SUDAN', 'SYRIA', 'TONGA', 'YEMEN', 'ANGOLA', 'BELIZE',
    'BHUTAN', 'BRAZIL', 'BRUNEI', 'CANADA', 'CYPRUS', 'FRANCE', 'GAMBIA', 'GREECE', 'GUINEA', 'GUYANA',
    'ISRAEL', 'JORDAN', 'KUWAIT', 'LATVIA', 'MALAWI', 'MEXICO', 'MONACO', 'NORWAY', 'PANAMA', 'POLAND',
    'RUSSIA', 'RWANDA', 'SERBIA', 'SWEDEN', 'TURKEY', 'TUVALU', 'UGANDA', 'ZAMBIA', 'ALBANIA', 'ALGERIA',
    'ANDORRA', 'ARMENIA', 'AUSTRIA', 'BAHRAIN', 'BELARUS', 'BELGIUM', 'BOLIVIA', 'BURUNDI', 'COMOROS',
    'CROATIA', 'DENMARK', 'ECUADOR', 'ERITREA', 'ESTONIA', 'FINLAND', 'GEORGIA', 'GERMANY', 'GRENADA',
    'HUNGARY', 'ICELAND', 'IRELAND', 'JAMAICA', 'LEBANON', 'LESOTHO', 'LIBERIA', 'MOLDOVA', 'MOROCCO',
    'MYANMAR', 'NAMIBIA', 'NIGERIA', 'ROMANIA', 'SENEGAL', 'SOMALIA', 'TUNISIA', 'UKRAINE', 'URUGUAY',
    'VANUATU', 'VIETNAM', 'BARBADOS', 'BOTSWANA', 'BULGARIA', 'CAMBODIA', 'CAMEROON', 'COLOMBIA', 'DJIBOUTI',
    'DOMINICA', 'ESWATINI', 'ETHIOPIA', 'HONDURAS', 'KIRIBATI', 'MALAYSIA', 'MALDIVES', 'MONGOLIA', 'PAKISTAN',
    'PARAGUAY', 'PORTUGAL', 'SLOVAKIA', 'SLOVENIA', 'SURINAME', 'TANZANIA', 'THAILAND', 'ZIMBABWE',
    'ARGENTINA', 'AUSTRALIA', 'GUATEMALA', 'INDONESIA', 'LITHUANIA', 'MAURITIUS', 'NICARAGUA', 'SINGAPORE',
    'VENEZUELA', 'AZERBAIJAN', 'BANGLADESH', 'KAZAKHSTAN', 'KYRGYZSTAN', 'LUXEMBOURG', 'MADAGASCAR',
    'MAURITANIA', 'MONTENEGRO', 'MOZAMBIQUE', 'SEYCHELLES', 'TAJIKISTAN', 'UZBEKISTAN', 'AFGHANISTAN',
    'NETHERLANDS', 'PHILIPPINES', 'SWITZERLAND', 'TURKMENISTAN', 'LIECHTENSTEIN'],
  ballsport: ['GOLF', 'POLO', 'RUGBY', 'BOCCE', 'BOWLS', 'PADEL', 'FUTSAL', 'PELOTA', 'BOULES', 'SHINTY', 'TENNIS', 'SOCCER', 'SQUASH', 'CROQUET', 'HURLING', 'BOWLING', 'CRICKET', 'NETBALL', 'SNOOKER', 'FOOTBALL', 'SOFTBALL', 'KICKBALL', 'FOOSBALL', 'KORFBALL', 'PETANQUE', 'HANDBALL', 'BASEBALL', 'LACROSSE', 'ROUNDERS', 'PINGPONG', 'WATERPOLO', 'DODGEBALL', 'BILLIARDS', 'STICKBALL', 'BASKETBALL', 'VOLLEYBALL', 'PICKLEBALL', 'TETHERBALL', 'WIFFLEBALL', 'RACQUETBALL', 'FIELDHOCKEY', 'TABLETENNIS'],
};
const TOPIC_LABEL = {
  mammal: 'It is a mammal', bird: 'It is a bird', fish: 'It is a fish',
  fruit: 'It is a fruit', vegetable: 'It is a vegetable', drink: 'It is something you drink',
  country: 'It is a country', ballsport: 'It is a sport played with a ball',
};

function ruleFn(r) {
  switch (r.k) {
    case 'alpha': return (w) => [...w].every((c, i) => i === 0 || c >= w[i - 1]);
    case 'norepeat': return (w) => new Set(w).size === w.length;
    case 'dbl': return (w) => /(.)\1/.test(w);
    case 'len': return (w) => w.length === r.n;
    case 'vowels': return (w) => nv(w) === r.n;
    case 'onevowel': return (w) => new Set([...w].filter((c) => VOW.has(c))).size === 1;
    case 'sameends': return (w) => w[0] === w[w.length - 1];
    case 'startvowel': return (w) => VOW.has(w[0]);
    case 'endvowel': return (w) => VOW.has(w[w.length - 1]);
    case 'altvc': return (w) => [...w].every((c, i) => i === 0 || VOW.has(c) !== VOW.has(w[i - 1]));
    case 'twinvowel': return (w) => [...w].some((c, i) => i > 0 && VOW.has(c) && VOW.has(w[i - 1]));
    case 'nolet': return (w) => !w.includes(r.c);
    case 'hides': return (w) => HIDDEN[r.set].some((h) => w.includes(h));
    case 'in': return (w) => SETS[r.set].includes(w);
    default: return () => false;
  }
}
function ruleLabel(r) {
  switch (r.k) {
    case 'alpha': return 'Its letters never go backwards through the alphabet';
    case 'norepeat': return 'No letter appears twice';
    case 'dbl': return 'It contains a double letter';
    case 'len': return `It is exactly ${NUMWORD[r.n]} letters long`;
    case 'vowels': return `It has exactly ${NUMWORD[r.n]} vowels`;
    case 'onevowel': return 'It uses only one distinct vowel';
    case 'sameends': return 'It starts and ends with the same letter';
    case 'startvowel': return 'It starts with a vowel';
    case 'endvowel': return 'It ends with a vowel';
    case 'altvc': return 'Its consonants and vowels strictly alternate';
    case 'twinvowel': return 'It has two vowels side by side';
    case 'nolet': return `It contains no letter ${r.c}`;
    case 'hides': return `It hides a smaller word for ${HIDDEN_NAME[r.set]}`;
    case 'in': return TOPIC_LABEL[r.set];
    default: return 'Unknown rule';
  }
}
// The set and hidden-word rules used to print their whole array under the
// candidate. That made the board pure deduction, but it also printed an answer
// key: it told the player exactly which tiles the rule covered, and on a board
// like #16 it killed a candidate for free before the first test. These rules are
// meant to be a trivia beat, so the list is gone and the player supplies the
// knowledge. What makes that fair is C11 in scripts/verify-axiom.mjs: a board may
// not carry a tile that a reasonable person would classify INTO the set when the
// array leaves it out (ANTELOPE against SETS.mammal, BIGFOOT against a hidden
// body part). No near-miss on the board means no judgement call, so the only
// knowledge ever asked for is the obvious kind.

const isIosDevice = () =>
  typeof navigator !== 'undefined' &&
  (/iPad|iPhone|iPod/.test(navigator.userAgent || '') ||
    (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1));

function etToday() {
  try { return new Date().toLocaleDateString('en-CA', { timeZone: 'America/New_York' }); }
  catch (e) { return new Date().toISOString().slice(0, 10); }
}
function pickPuzzle(puzzles, forceNum) {
  if (forceNum) { const p = puzzles.find((x) => x.num === forceNum); if (p) return p; }
  const today = etToday();
  const open = puzzles.filter((p) => p.live <= today);
  return open.length ? open[open.length - 1] : puzzles[0];
}
function fmtTime(ms) {
  const s = Math.max(0, Math.round(ms / 1000));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
}
function msToMidnightET() {
  try {
    const now = new Date();
    const et = new Date(now.toLocaleString('en-US', { timeZone: 'America/New_York' }));
    const next = new Date(et);
    next.setHours(24, 0, 0, 0);
    return next - et;
  } catch (e) {
    const now = new Date();
    const next = new Date(now);
    next.setHours(24, 0, 0, 0);
    return next - now;
  }
}
function fmtCountdown(ms) {
  const s = Math.max(0, Math.floor(ms / 1000));
  return `${Math.floor(s / 3600)}:${String(Math.floor((s % 3600) / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;
}
function getAnonId() {
  if (typeof window === 'undefined') return null;
  try {
    let a = localStorage.getItem('sot_quiz_anon');
    if (!a) {
      a = (window.crypto && crypto.randomUUID) ? crypto.randomUUID() : `a_${Date.now()}_${Math.random().toString(36).slice(2)}`;
      localStorage.setItem('sot_quiz_anon', a);
    }
    return a;
  } catch (e) { return null; }
}
const EMPTY_BOARD = { plays: 0, best: null, topTime: null, leaderboard: [], leaderboardAll: [], leaderboardMobile: [], leaderboardFirst: [], leaderboards: {} };

// ─── Solver: the answer is derived, never shipped ───────────────────────────
// Exactly one candidate agrees with every tile on the board. PERFECT is the
// fewest tests that could isolate it from the rules the gift reds leave alive.
// (It was called "par" until 2026-07-31, then briefly shown alongside a
// cushioned par; Axiom stopped showing par entirely on 2026-08-01. Scoring has
// always been anchored to PERFECT, so none of that moved any points.)
function solveBoard(puzzle) {
  const tiles = puzzle.tiles;
  const fns = puzzle.rules.map(ruleFn);
  const answer = puzzle.rules.findIndex((r, i) => tiles.every((t) => (fns[i](t.w) ? 1 : 0) === t.t));
  const givenReds = tiles.filter((t) => t.g && !t.t);
  const live = puzzle.rules
    .map((r, i) => i)
    .filter((i) => i !== answer && givenReds.every((t) => !fns[i](t.w)));
  const testable = tiles.map((t, i) => i).filter((i) => !tiles[i].g);
  const killers = live.map((i) => new Set(testable.filter((ti) => (fns[i](tiles[ti].w) ? 1 : 0) !== tiles[ti].t)));
  let perfect = 0;
  if (killers.length) {
    perfect = 3;
    let one = false;
    for (const ti of testable) if (killers.every((s) => s.has(ti))) { one = true; break; }
    if (one) perfect = 1;
    else {
      for (let a = 0; a < testable.length && perfect === 3; a++) {
        for (let b = a + 1; b < testable.length; b++) {
          if (killers.every((s) => s.has(testable[a]) || s.has(testable[b]))) { perfect = 2; break; }
        }
      }
    }
  }
  return { answer, live, perfect };
}

// How many candidates besides the answer still fit everything the player can
// see. Zero means the board is genuinely solved; anything above zero means the
// answer has not been earned yet, however confident the hunch.
function countStanding(puzzle, answer, tested) {
  const seen = puzzle.tiles.filter((t, i) => t.g || tested.includes(i));
  return puzzle.rules.filter((r, i) => i !== answer && seen.every((t) => (ruleFn(r)(t.w) ? 1 : 0) === t.t)).length;
}

// ─── Personal stats + streak (localStorage), the shared daily pattern ───────
function getStats() {
  try {
    const s = JSON.parse(localStorage.getItem(STATS_KEY));
    if (s && s.v === 1 && s.rec) return s;
  } catch (e) {}
  return { v: 1, rec: {} };
}
function recordStat(num, entry) {
  const s = getStats();
  if (s.rec[num]) return s;
  const s2 = { ...s, rec: { ...s.rec, [num]: entry } };
  try { localStorage.setItem(STATS_KEY, JSON.stringify(s2)); } catch (e) {}
  return s2;
}
function deriveStats(s, todayNum) {
  const rec = s && s.rec ? s.rec : {};
  const nums = Object.keys(rec).map(Number).sort((a, b) => a - b);
  const played = nums.length;
  const perfect = nums.filter((n) => rec[n].won).length;
  let max = 0, run = 0, prev = null;
  for (const n of nums) {
    run = prev != null && n === prev + 1 ? run + 1 : 1;
    if (run > max) max = run;
    prev = n;
  }
  let cur = 0, at = rec[todayNum] ? todayNum : todayNum - 1;
  while (rec[at]) { cur++; at--; }
  return { played, perfect, cur, max };
}
function mergeServerStats(s, recent, puzzles) {
  if (!s || !Array.isArray(recent) || !recent.length) return s;
  const byQuiz = {};
  for (const p of puzzles) byQuiz[p.quizId] = p;
  let rec = s.rec, changed = false;
  for (const m of recent) {
    const p = m && byQuiz[m.quizId];
    if (!p || m.attempt !== 1) continue;
    if (rec[p.num]) continue;
    const sc = Math.max(0, Math.min(TOTAL, Math.round(((m.scorePct || 0) / 100) * TOTAL)));
    if (!changed) { rec = { ...rec }; changed = true; }
    rec[p.num] = { s: sc, t: TOTAL, g: null, won: !!m.perfect };
  }
  if (!changed) return s;
  const s2 = { ...s, rec };
  try { localStorage.setItem(STATS_KEY, JSON.stringify(s2)); } catch (e) {}
  return s2;
}

function freshState() {
  return {
    v: 1,
    tested: [],        // tile indexes the player has spent a test on
    struck: [],        // rules the player has crossed out as scratch
    marks: [],         // tiles crossed out as scratch: free, cosmetic, unscored
    wrongPicks: [],    // rule indexes already named and rejected
    unproven: 0,       // rules left standing at the moment the answer was named
    naming: false,     // the rule list is armed for a pick
    status: 'playing', // playing | done | lost
    t0: null,
    tEnd: null,
  };
}

export default function AxiomClient({ puzzles = [], forceNum = null }) {
  const PUZZLE = useMemo(() => pickPuzzle(puzzles, forceNum), [puzzles, forceNum]);
  const STORE_KEY = `sot_axiom_${PUZZLE.num}`;
  const { answer: ANSWER, perfect: PERFECT } = useMemo(() => solveBoard(PUZZLE), [PUZZLE]);
  // No PAR here, deliberately (removed 2026-08-01). The other exactly-solved
  // dailies show perfect AND a cushioned par because their cushion is meaningful
  // over thirty-odd moves. Axiom's perfect is one to three tests and parForTests
  // put par a single test above it, so two near-identical targets read as noise.
  // Scoring was never anchored to par here, only to PERFECT, so dropping it from
  // the UI moved no points.

  const [g, setG] = useState(() => freshState());
  const [verdict, setVerdict] = useState(null);
  // Tile scratch tool. Defaults to Mark, like Etch / Hedge / Jesters: on an
  // Axiom board you rule out ten or more tiles but only ever spend two to six
  // tests, and testing is the action that costs points, so the free note is the
  // safe default. Hold or right-click a tile to test without switching tool.
  const [mode, setMode] = useState('mark');   // 'mark' | 'test'
  const [showHelp, setShowHelp] = useState(false);
  const [gateRules, setGateRules] = useState(false);
  const [toast, setToast] = useState(null);
  const [copied, setCopied] = useState(false);
  const [endClosed, setEndClosed] = useState(false);
  // The finished board starts turned OVER, showing what to do next.
  const [loftRevealed, setLoftRevealed] = useState(false);
  const [shareCta, setShareCta] = useState('Share');
  useEffect(() => {
    if (contestIsLive()) setShareCta(`Share for ${CONTEST.prizeLabel}*`);
  }, []);
  const [hydrated, setHydrated] = useState(false);
  const [board, setBoard] = useState(EMPTY_BOARD);
  const [identity, setIdentity] = useState(null);
  const [stats, setStats] = useState(null);
  const [player, setPlayer] = useState(null);
  const [countdown, setCountdown] = useState('');
  const [installEvt, setInstallEvt] = useState(null);
  const [showA2hsHelp, setShowA2hsHelp] = useState(false);
  const [standalone, setStandalone] = useState(false);
  const [mobileUi, setMobileUi] = useState(false);
  const searchParams = useSearchParams();
  const { duelToken, duelInfo, duelSubmitted } = useDuelContext(PUZZLE.quizId, searchParams);
  const toastTimer = useRef(null);
  const viewedRef = useRef(false);
  const pressTimer = useRef(null);
  const pressPos = useRef({ x: 0, y: 0 });
  const longFired = useRef(false);

  const [showChrome, setShowChrome] = useState(false);
  const playing = g.status === 'playing';
  const LOFT = isLoft('axiom');
  const STAGE = isStage('axiom', searchParams);
  const STAGE_C = STAGE ? 'var(--stg-acc)' : gameColor('axiom');
  const Cap = STAGE ? StageChrome : LoftCap;
  const STAGE_ACC = { '--stg-acc-dk': gameColor('axiom'), '--stg-acc-lt': gameColorLight('axiom'), '--stg-onramp-lt': gameOnrampLight('axiom'), '--stg-acc-ink-lt': gameAccentInkLight('axiom') };
  const [stageTheme] = useStageTheme();
  const INK = STAGE ? 'var(--stg-ink,#e9edf4)' : COLORS.ink;
  const FADED = STAGE ? 'var(--stg-mute,#8b95a8)' : COLORS.faded;
  const SURF = STAGE ? 'var(--stg-surf,rgba(255,255,255,0.045))' : T.white;
  const SURF_B = STAGE ? 'var(--stg-line,rgba(255,255,255,0.11))' : 'rgba(28,30,36,0.42)';
  const ACC = STAGE ? STAGE_C : COLORS.accent;
  const ACC_DEEP = STAGE ? STAGE_C : COLORS.accentDeep;
  const ACC_DEEP_INK = STAGE ? 'var(--stg-acc-ink)' : COLORS.accentDeep;
  const ACC_SOFT = STAGE ? 'var(--stg-line,rgba(255,255,255,0.11))' : COLORS.accentSoft;
  const ON_ACC = STAGE ? 'var(--stg-onramp, #08222e)' : 'var(--white)';
  const preStart = playing && !g.t0;
  const started = playing && !!g.t0;
  const focusMode = playing && !showChrome;
  const testsUsed = g.tested.length;
  const testsLeft = Math.max(0, PUZZLE.budget - testsUsed);
  const overPerfect = Math.max(0, testsUsed - PERFECT);
  // Candidates OTHER than the answer that still agree with every tile the player
  // can see. While this is above zero the board has not been solved, it has been
  // narrowed, and naming now is a guess dressed up as an answer. Scoring it is
  // what stops a tapper from clicking a rule at zero tests and banking 12.
  const standing = countStanding(PUZZLE, ANSWER, g.tested);
  const unproven = g.status === 'done' ? (g.unproven || 0) : standing;
  const liveScore = Math.max(1, TOTAL - 2 * overPerfect - WRONG_COST * g.wrongPicks.length - UNPROVEN_COST * unproven);
  const score = g.status === 'done' ? liveScore : 0;
  const won = g.status === 'done' && testsUsed <= PERFECT && g.wrongPicks.length === 0 && unproven === 0;
  const namesLeft = Math.max(0, MAX_WRONG - g.wrongPicks.length);

  useEffect(() => {
    try {
      setStandalone(window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true);
      setMobileUi(isMobileDevice());
    } catch {}
    const onBip = (e) => { e.preventDefault(); setInstallEvt(e); };
    const onInstalled = () => { setStandalone(true); setInstallEvt(null); };
    window.addEventListener('beforeinstallprompt', onBip);
    window.addEventListener('appinstalled', onInstalled);
    return () => { window.removeEventListener('beforeinstallprompt', onBip); window.removeEventListener('appinstalled', onInstalled); };
  }, []);
  const a2hsClick = () => { const e = installEvt; if (e) { setInstallEvt(null); e.prompt(); } else { setShowA2hsHelp(true); } };

  // ---- persistence ----
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORE_KEY);
      if (raw) {
        const saved = JSON.parse(raw);
        if (saved && saved.v === 1 && Array.isArray(saved.tested)) setG({ ...freshState(), ...saved });
      }
      setGateRules(!localStorage.getItem(HELP_KEY));
      const tl = localStorage.getItem(TOOL_KEY);
      if (tl === 'mark' || tl === 'test') setMode(tl);
    } catch (e) {}
    try { setStats(getStats()); } catch (e) {}
    setHydrated(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  useEffect(() => {
    if (!hydrated) return;
    try { localStorage.setItem(TOOL_KEY, mode); } catch (e) {}
  }, [mode, hydrated]);
  useEffect(() => {
    if (!hydrated) return;
    try { localStorage.setItem(STORE_KEY, JSON.stringify(g)); } catch (e) {}
    try {
      if (PUZZLE.num === pickPuzzle(puzzles, null).num) {
        (function () { var _dn = g.status !== 'playing'; if (_dn || g.t0) localStorage.setItem('sot_axiom_day', JSON.stringify({ d: etToday(), done: _dn })); else localStorage.removeItem('sot_axiom_day'); })();
      }
    } catch (e) {}
  }, [g, hydrated, STORE_KEY, PUZZLE, puzzles]);

  // Live game clock. `elapsed` below is derived from the current time, and it
  // used to read Date.now() during render, so the displayed clock only advanced
  // when something else happened to re-render the board. This ticks a state
  // value while the game is actually running, so the readout moves on its own.
  // Display only: the elapsed time recorded on the result is still computed
  // from a real Date.now() delta at the moment the game ends.
  const [nowTick, setNowTick] = useState(() => Date.now());
  useEffect(() => {
    if (g.status !== 'playing' || !g.t0 || g.tEnd) return undefined;
    setNowTick(Date.now());
    const iv = setInterval(() => setNowTick(Date.now()), 500);
    return () => clearInterval(iv);
  }, [g.status, g.t0, g.tEnd]);

  useEffect(() => {
    if (g.status === 'playing') return;
    const tick = () => setCountdown(fmtCountdown(msToMidnightET()));
    tick();
    const iv = setInterval(tick, 1000);
    return () => clearInterval(iv);
  }, [g.status]);

  // ---- metrics + leaderboard ----
  useEffect(() => {
    try {
      const id = JSON.parse(localStorage.getItem('sot_quiz_identity'));
      if (id && id.email) setIdentity(id);
    } catch (e) {}
    try {
      const anon = getAnonId();
      let em = '';
      try {
        const idj = JSON.parse(localStorage.getItem('sot_quiz_identity') || 'null');
        if (idj && idj.email) em = `&email=${encodeURIComponent(idj.email)}`;
      } catch (e) {}
      if (anon || em) {
        meRequest(`/api/quiz/me?anonId=${encodeURIComponent(anon || '')}${em}&history=1`)
          .then((r) => r.json())
          .then((d) => {
            if (d && Array.isArray(d.recent)) setStats((cur) => mergeServerStats(cur || getStats(), d.recent, puzzles));
            if (d && d.found && d.name) setPlayer({ name: d.name, rank: (d.ranks && d.ranks.xp) || d.rank || null, key: d.userKey || null });
          })
          .catch(() => {});
      }
    } catch (e) {}
    fetch(`/api/quiz/board?quizId=${encodeURIComponent(PUZZLE.quizId)}`)
      .then((r) => r.json())
      .then((d) => { if (d && !d.error) setBoard({ ...EMPTY_BOARD, ...d }); })
      .catch(() => {});
    if (!viewedRef.current) {
      viewedRef.current = true;
      fetch('/api/quiz/view', { method: 'POST', keepalive: true, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ quizId: PUZZLE.quizId }) }).catch(() => {});
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function say(msg) {
    setToast(msg);
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(null), 2400);
  }

  const elapsed = g.t0 ? fmtTime((g.tEnd || nowTick) - g.t0) : '0:00';
  const isTodays = PUZZLE.num === pickPuzzle(puzzles, null).num;
  const iq = useIqStanding({ game: 'axiom', quizId: PUZZLE.quizId, active: LOFT && !playing });
  const nextUp = useNextUnplayed({ self: 'axiom', active: LOFT && !playing });
  const upNext = useUnplayedSimilar({ self: 'axiom', active: LOFT && !playing });
  const dailyBoard = useDailyBoard({ quizId: PUZZLE.quizId, active: LOFT && !playing });
  const allTime = useGameAllTime({ game: 'axiom', active: LOFT && !playing });
  const dayStats = useDayStats();
  const catRank = useCategoryRank({ self: 'axiom', active: LOFT && !playing });
  const prevPuzzle = puzzles.find((x) => x.num === PUZZLE.num - 1) || null;
  const myStats = deriveStats(stats, pickPuzzle(puzzles, null).num);

  const REC_KEY = `sot_axiom_rec_${PUZZLE.num}`;
  const abandon = useAbandonFlush(() => {
    const acted = g.tested.length > 0 || g.wrongPicks.length > 0 || g.struck.length > 0;
    if (!acted || g.status !== 'playing') return null;
    try { if (localStorage.getItem(REC_KEY)) return null; } catch (e) {}
    const el = Math.min(36000, Math.max(1, Math.round((Date.now() - (g.t0 || Date.now())) / 1000)));
    try { localStorage.setItem(REC_KEY, '1'); } catch (e) {}
    return { quizId: PUZZLE.quizId, score: 0, total: TOTAL, correct: 0, guessesUsed: g.tested.length, timeElapsed: el, abandoned: true, email: identity?.email || undefined, anonId: getAnonId(), isMobile: isMobileDevice(), referrer: (typeof document !== 'undefined' ? document.referrer : '') };
  });

  function postResult(g2, sc) {
    abandon.markFlushed();
    const el = g2.t0 ? Math.max(1, Math.round(((g2.tEnd || Date.now()) - g2.t0) / 1000)) : 1;
    try { setStats(recordStat(PUZZLE.num, { s: sc, t: TOTAL, g: g2.tested.length, won: sc === TOTAL })); } catch (e) {}
    try {
      fetch('/api/quiz/result', {
        method: 'POST',
        keepalive: true,
        headers: { 'Content-Type': 'application/json' },
        // guessesUsed = tests spent, so the daily board's ties break toward the
        // player who needed the least evidence.
        body: JSON.stringify({ quizId: PUZZLE.quizId, score: sc, total: TOTAL, correct: sc === TOTAL ? 1 : 0, guessesUsed: g2.tested.length, timeElapsed: el, email: identity?.email || undefined, anonId: getAnonId(), isMobile: isMobileDevice(), referrer: (typeof document !== 'undefined' ? document.referrer : '') }),
      })
        .then((r) => r.json())
        .then((d) => { if (d && !d.error) setBoard({ ...EMPTY_BOARD, ...d }); })
        .catch(() => {});
    } catch (e) {}
  }

  function startRun() {
    setG((cur) => (cur.t0 ? cur : { ...cur, t0: Date.now() }));
    try { localStorage.setItem(HELP_KEY, '1'); } catch (e) {}
  }

  function testTile(i) {
    if (!playing) return;
    if (PUZZLE.tiles[i].g || g.tested.includes(i)) return;
    if (testsLeft <= 0) { say('Out of tests. Name the rule.'); return; }
    setG((cur) => ({ ...cur, tested: [...cur.tested, i], t0: cur.t0 || Date.now() }));
    setVerdict(null);
  }
  // Free scratch. Crossing a tile out changes nothing except the player's own
  // view of the board: it never enters `tested`, so it cannot spend a test or
  // move the score. The board never marks a tile for you either, because
  // working out which tiles split the field IS the puzzle.
  function toggleMark(i) {
    if (!playing) return;
    if (PUZZLE.tiles[i].g || g.tested.includes(i)) return;
    setG((cur) => ({
      ...cur,
      marks: (cur.marks || []).includes(i) ? (cur.marks || []).filter((x) => x !== i) : [...(cur.marks || []), i],
      t0: cur.t0 || Date.now(),
    }));
  }
  // Hold (mobile) or right-click (desktop) spends a test whatever the tool is
  // set to; longFired swallows the click that follows the long press.
  function startPress(i, e) {
    longFired.current = false;
    if (e) pressPos.current = { x: e.clientX, y: e.clientY };
    clearTimeout(pressTimer.current);
    pressTimer.current = setTimeout(() => {
      longFired.current = true;
      testTile(i);
      try { if (navigator.vibrate) navigator.vibrate(15); } catch (e) {}
    }, 420);
  }
  function endPress() { clearTimeout(pressTimer.current); pressTimer.current = null; }
  // DRIFT TOLERANCE, NOT ZERO TOLERANCE, per Sweep's own note: a finger on a
  // small target always moves a pixel or two, and cancelling on that would turn
  // an intended hold into the tap it was not. Past PRESS_SLOP_PX the finger has
  // gone somewhere else and the hold is abandoned.
  function movePress(e) {
    const p = pressPos.current;
    if (!pressTimer.current) return;
    if (Math.abs(e.clientX - p.x) > PRESS_SLOP_PX || Math.abs(e.clientY - p.y) > PRESS_SLOP_PX) endPress();
  }
  function tapTile(i) {
    if (longFired.current) { longFired.current = false; return; }
    if (mode === 'test') testTile(i); else toggleMark(i);
  }

  function toggleStrike(i) {
    if (!playing) return;
    setG((cur) => ({
      ...cur,
      struck: cur.struck.includes(i) ? cur.struck.filter((x) => x !== i) : [...cur.struck, i],
      t0: cur.t0 || Date.now(),
    }));
  }
  function clearNotes() {
    if (!playing) return;
    setG((cur) => ({ ...cur, struck: [], marks: [] }));
  }

  function nameRule(i) {
    if (!playing) return;
    if (g.wrongPicks.includes(i)) { say('You already ruled that one out.'); return; }
    if (g.wrongPicks.length >= MAX_WRONG) { say(`No names left. ${MAX_WRONG} wrong is the limit.`); return; }
    if (i === ANSWER) {
      const up = countStanding(PUZZLE, ANSWER, g.tested);
      const g2 = { ...g, status: 'done', naming: false, unproven: up, tEnd: Date.now(), t0: g.t0 || Date.now() };
      setG(g2);
      setVerdict(null);
      setEndClosed(false);
      postResult(g2, Math.max(1, TOTAL - 2 * Math.max(0, g2.tested.length - PERFECT) - WRONG_COST * g2.wrongPicks.length - UNPROVEN_COST * up));
    } else {
      setG((cur) => ({ ...cur, wrongPicks: [...cur.wrongPicks, i], t0: cur.t0 || Date.now() }));
      const bad = PUZZLE.tiles.find((t, ti) => (t.g || g.tested.includes(ti)) && (ruleFn(PUZZLE.rules[i])(t.w) ? 1 : 0) !== t.t);
      const left = MAX_WRONG - (g.wrongPicks.length + 1);
      const tail = left > 0 ? ` ${left} name${left === 1 ? '' : 's'} left.` : ' That was your last name.';
      setVerdict({ msg: (bad ? `That rule is already dead: ${bad.w} disagrees with it. (−${WRONG_COST})` : `That is not the rule. (−${WRONG_COST})`) + tail });
    }
  }

  function reveal() {
    if (!playing) return;
    setG((cur) => {
      const g2 = { ...cur, status: 'lost', naming: false, tEnd: Date.now(), t0: cur.t0 || Date.now() };
      postResult(g2, 0);
      return g2;
    });
    setVerdict(null);
    setEndClosed(false);
  }

  function resetGame() {
    try { localStorage.removeItem(STORE_KEY); } catch (e) {}
    setG(freshState()); setVerdict(null); setEndClosed(false);
  }

  const revealed = (i) => PUZZLE.tiles[i].g || g.tested.includes(i) || !playing;
  const answerLabel = ruleLabel(PUZZLE.rules[ANSWER]);

  // How to play. Four dense paragraphs tested badly (owner, 2026-07-24), so the
  // rules now lead with the goal, show the colours rather than describing them,
  // and put the numbers in a footnote: a first-timer needs the loop, not the
  // scoring table.
  const rulesBody = (
    <DailyRules
      accent={COLORS.accent} accentSoft={COLORS.accentSoft} accentDeep={COLORS.accentDeep}
      lead="Work out the hidden rule."
      chips={[
        { label: 'EFFORT', style: { fontSize: 12, letterSpacing: '0.04em', background: `var(--stg-surf, ${COLORS.greenSoft})`, border: `1.5px solid var(--stg-line, ${COLORS.green})`, color: 'var(--stg-good, #14532d)' } },
        { label: 'FALSE', style: { fontSize: 12, letterSpacing: '0.04em', background: `var(--stg-surf, ${COLORS.redSoft})`, border: `1.5px solid var(--stg-line, ${COLORS.redInk})`, color: 'var(--stg-bad, #7f1d1d)' } },
        { label: 'TRAIL', style: { fontSize: 12, letterSpacing: '0.04em', background: STAGE ? SURF : T.white, border: STAGE ? `1px solid ${SURF_B}` : '1.5px solid rgba(28,30,36,0.18)', color: INK } },
      ]}
      sub="Green: the rule is true of that word. Red: it is not. Grey: already one or the other, but you have not uncovered it."
      steps={[
        <>{PUZZLE.rules.length} candidate rules sit under the board. <b>Exactly one</b> fits every tile.</>,
        <>Tapping a tile crosses it out as a free note. To <b>spend a test</b> and flip its colour, switch to <b>Test</b> or hold the tile. You get <b>{PUZZLE.budget}</b>.</>,
        <>Cross out each rule as the colours kill it. This is a free note for your own benefit and never changes your score.</>,
        <>Hit the <b>Name it</b> button and pick the one still standing.</>,
      ]}
      knackLabel="The knack: only test words the surviving rules disagree about."
      knack="Work out what each live rule predicts for a tile before you spend on it. If they all predict the same colour, that tile teaches you nothing whichever way it flips. The useful tiles are the ones that split the field, and most tiles are not useful."
      noteGap={8}
      note={<>
        <b>Naming the rule is a bet, and the button shows the odds.</b> It always reads what you would bank right now, so nothing is deducted after the fact. That number starts low and climbs as the words you uncover narrow the field. Name it early and you are guessing; wait until the evidence leaves one rule alive and it reads the full {TOTAL}.
        <ul style={{ margin: '6px 0 0', paddingLeft: 18 }}>
          <li><b>What raises it:</b> uncovering words that rule other candidates out. Only revealed words count. Crossing rules off by hand is a free note and does nothing either way.</li>
          <li><b>What lowers it:</b> {UNPROVEN_COST} for each candidate the board cannot yet rule out, {WRONG_COST} for a wrong name ({MAX_WRONG} ends the day), and 2 for each test past {PERFECT}, the fewest that can settle this board.</li>
        </ul>
      </>}
      footer="Vowels are A, E, I, O, U, never Y."
    />
  );

  return (
    <div className={STAGE ? 'stage-page' : (LOFT ? 'loft-page' : undefined)}
      data-stage-theme={STAGE ? stageTheme : undefined}
      style={{ ...(STAGE ? STAGE_ACC : null), minHeight: '100vh', position: 'relative', background: STAGE ? 'var(--stg-ground)' : T.surface, color: STAGE ? 'var(--stg-ink,#e9edf4)' : undefined, overflowX: (STAGE || LOFT) ? 'hidden' : undefined }}>
      {!STAGE && <Grain />}
      {/* Shared daily chrome (app/DailyChrome.jsx): home masthead + stat bar +
          today's slate rail, collapsing to one line once the clock runs. Outside
          the page wrapper so the bands run full bleed; nothing here is pinned. */}
      {!STAGE && (
      <DailyChrome slug="axiom" name="Axiom" collapsed={started} loft={LOFT} />
      )}
      {LOFT && (
        <Cap gameKey="axiom" quizId={PUZZLE.quizId}
          name="Axiom"
          cat="Logic"
          outcome={playing ? null : (won ? 'won' : (score > 0 ? 'part' : 'lost'))}
          num={PUZZLE.num}
          tiles={playing ? null : upNext}
          dateLabel={PUZZLE.dateLabel}
          onHelp={() => setShowHelp(true)}
          sunday={PUZZLE.sunday ? 'Sunday Edition' : null}
          figures={playing ? [
            { v: liveScore, k: 'score' },
            { v: elapsed, k: 'time' },
          ] : [
            { v: `${score}/${TOTAL}`, k: 'score' },
            { v: elapsed, k: 'time' },
          ]}
        />
      )}
      <div className="ax-wrap" style={{ position: 'relative', zIndex: 2, maxWidth: 1180, margin: '0 auto', padding: '18px 38px 80px', fontFamily: SANS }}>
        <style dangerouslySetInnerHTML={{ __html: `
          @media(max-width:560px){.ax-wrap{padding-left:12px !important;padding-right:12px !important;}}
          .ax-btn{font-family:${SANS};font-weight:800;font-size:14px;border:2px solid ${STAGE ? 'var(--stg-line2)' : 'var(--blue-deep)'};background:${STAGE ? 'transparent' : 'var(--white)'};color:${STAGE ? 'var(--stg-ink)' : 'var(--blue-deep)'};border-radius:8px;padding:9px 16px;cursor:pointer;display:inline-flex;align-items:center;gap:7px;}
          .ax-btn:hover{background:var(--stg-surf2, var(--accent-soft));}
          .ax-grid{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:8px;}
          @media(max-width:560px){.ax-grid{grid-template-columns:repeat(3,minmax(0,1fr));gap:6px;}}
          .ax-tile{font-family:${SANS};font-weight:800;font-size:13px;letter-spacing:0.04em;border-radius:9px;padding:13px 4px;cursor:pointer;border: 1.5px solid var(--stg-line, rgba(28,30,36,0.16));background:${STAGE ? 'var(--stg-surf)' : 'var(--white)'};color:${INK};text-align:center;overflow:hidden;text-overflow:ellipsis;}
          .ax-tile:hover:not(:disabled){border-color:var(--stg-acc, ${COLORS.accent});}
          .ax-tile:disabled{cursor:default;}
          .ax-tile.yes{background:${COLORS.greenSoft};border-color:${COLORS.green};color:#14532d;}
          .ax-tile.no{background:${COLORS.redSoft};border-color:${COLORS.redInk};color:#7f1d1d;}
          .ax-tile.given{box-shadow:inset 0 0 0 2px rgba(28,30,36,0.28);}
          .ax-tile.marked{background:var(--stg-surf, ${COLORS.paper});border-style:dashed;border-color:rgba(28,30,36,0.32);color:${FADED};text-decoration:line-through;text-decoration-thickness:1.5px;opacity:0.7;}
          .ax-tile.marked:hover:not(:disabled){opacity:1;}
          .ax-tool{font-family:${SANS};font-weight:800;font-size:12px;border:1.5px solid ${STAGE ? 'var(--stg-line2)' : 'rgba(28,30,36,0.35)'};background:${STAGE ? 'var(--stg-surf2)' : 'var(--white)'};color:${INK};border-radius:8px;padding:5px 10px;cursor:pointer;display:inline-flex;align-items:center;gap:5px;line-height:1.1;}
          .ax-tool.on{background:${STAGE ? STAGE_C : COLORS.ink};color:${STAGE ? 'var(--stg-onramp, #08222e)' : 'var(--white)'};border-color:${STAGE ? STAGE_C : COLORS.ink};}
          .ax-rule{display:flex;align-items:flex-start;gap:10px;background:${STAGE ? 'var(--stg-surf)' : 'var(--white)'};border: 1px solid var(--stg-line, rgba(28,30,36,0.14));border-left:3px solid var(--stg-acc, ${COLORS.accent});border-radius:9px;padding:10px 12px;margin-bottom:7px;width:100%;text-align:left;font-family:${SANS};cursor:pointer;}
          .ax-rule.struck{opacity:0.5;}
          .ax-rule.struck .ax-rule-t{text-decoration:line-through;}
          .ax-rule.dead{opacity:0.42;}
          .ax-rule.dead .ax-rule-t{text-decoration:line-through;}
          .ax-rule.win{border-color:${COLORS.green};border-left-color:${COLORS.green};background:${COLORS.greenSoft};}
          .ax-chip{flex:0 0 auto;width:26px;height:26px;border-radius:7px;border: 1.5px solid var(--stg-line2, rgba(28,30,36,0.25));background:var(--stg-surf, ${COLORS.cream});font-family:${MONO};font-size:12px;font-weight:500;display:flex;align-items:center;justify-content:center;color:${FADED};}
        ` }} />

        <div style={{ maxWidth: 760, margin: '0 auto' }}>


        {/* masthead */}
        {!LOFT && (
        <DailyMasthead
          slug="axiom"
          num={PUZZLE.num}
          dateLabel={PUZZLE.dateLabel}
          accent={COLORS.accent}
          blockGap={4}
          helpTop={8}
          onHelp={() => setShowHelp(true)}
          sunday={PUZZLE.sunday && <span style={{ fontFamily: MONO, fontSize: 9.5, letterSpacing: '0.1em', textTransform: 'uppercase', fontWeight: 500, color: `var(--stg-onramp, ${T.white})`, background: `var(--stg-acc, ${COLORS.accent})`, borderRadius: 4, padding: '2px 6px' }}>Sunday Edition &middot; Wide Field</span>}
          blocks={'AXIOM'.split('').map((ch, i) => (
              <div key={i} style={{ width: 40, height: 40, borderRadius: 5, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: SANS, fontWeight: 900, fontSize: 23, background: i === 0 ? `var(--stg-acc, ${COLORS.accent})` : COLORS.ink, color: i === 0 ? `var(--stg-onramp, ${T.white})` : T.white, boxShadow: 'inset 0 2px 5px rgba(0,0,0,0.5), 0 1px 0 rgba(255,255,255,0.65)' }}>{ch}</div>
            ))}
        />
        )}

        {/* LOFT: the play area sits on the navy stage, which runs full bleed
            and fills the first screen, so the board is the one lit object. */}
        <div className={LOFT && !STAGE ? 'loft-stage' : undefined}>
          <div className={LOFT && !STAGE && !playing ? (loftRevealed ? 'loft-flip' : 'loft-flip on') : undefined}>
          <div className={LOFT && !STAGE && !playing ? 'loft-flip-in' : undefined}>
          <div className={LOFT && !STAGE && !playing ? 'loft-face' : undefined}>
          <div className={LOFT && !STAGE ? 'loft-sheet' : undefined}>

        {!preStart && (
        <div style={{ fontFamily: SANS, fontSize: 13.5, fontWeight: 600, lineHeight: 1.55, background: STAGE ? SURF : T.white, border: STAGE ? `1px solid ${SURF_B}` : '1px solid rgba(28,30,36,0.14)', borderLeft: `4px solid var(--stg-acc, ${COLORS.accent})`, borderRadius: 8, padding: '12px 16px', margin: '0 0 12px', color: INK }}>
          <div style={{ fontSize: 15.5, fontWeight: 800, marginBottom: 5 }}>Find the one rule that fits every word on the board.</div>
          <div style={{ marginBottom: 4 }}><b style={{ color: `var(--stg-ink, ${COLORS.green})` }}>Green</b> means the rule is true of that word, <b style={{ color: `var(--stg-ink, ${COLORS.redInk})` }}>red</b> means it is false. All {PUZZLE.tiles.length} words are already one or the other; grey just means you have not uncovered it yet. The {PUZZLE.rules.length} candidates sit below the board, and exactly one of them is true of every green word and false of every red one.</div>
          <div>Spend a test to uncover another word. You have {PUZZLE.budget}, and {PERFECT} well chosen will settle it. Every candidate the revealed words cannot yet rule out costs you {UNPROVEN_COST} points when you name the answer, so keep testing until one rule is left standing.</div>
        </div>
        )}

        {/* status bar */}
        {started && (
        <div style={{ display: 'flex', gap: 16, alignItems: 'center', flexWrap: 'wrap', marginBottom: 12, fontFamily: MONO, fontSize: 11.5, letterSpacing: '0.08em', textTransform: 'uppercase', color: FADED }}>
          <span>tests left <b style={{ color: testsLeft <= 1 ? `var(--stg-bad, ${COLORS.rust})` : `var(--stg-ink, ${COLORS.ink})`, fontWeight: 500 }}>{testsLeft}</b> of {PUZZLE.budget}</span>
          <span>perfect <b style={{ color: INK, fontWeight: 500 }}>{PERFECT}</b> test{PERFECT === 1 ? '' : 's'}</span>
          <span>still unproven <b style={{ color: standing ? `var(--stg-bad, ${COLORS.rust})` : COLORS.green, fontWeight: 500 }}>{standing}</b> rule{standing === 1 ? '' : 's'}{standing > 0 ? '' : ' · proved'}</span>
          <span>name it now &rarr; <b style={{ color: overPerfect || g.wrongPicks.length ? `var(--stg-bad, ${COLORS.rust})` : COLORS.green, fontWeight: 500 }}>{liveScore}</b>/{TOTAL}</span>
          {g.wrongPicks.length > 0 && <span>wrong names <b style={{ color: `var(--stg-ink, ${COLORS.rust})`, fontWeight: 500 }}>{g.wrongPicks.length}</b></span>}
        </div>
        )}

        {/* start tile — the board stays sealed until the clock starts */}
        {preStart && (
          <div className={STAGE ? 'stg-gate' : (LOFT ? 'loft-card' : undefined)} style={{ background: STAGE ? SURF : COLORS.cream, border: STAGE ? `1px solid ${SURF_B}` : `2px solid ${COLORS.ink}`, borderRadius: 12, padding: '22px 22px', minHeight: 320, display: 'flex', flexDirection: 'column' }}>
            <div style={{ fontSize: 20, fontWeight: 800, color: INK, marginBottom: 10 }}>{gateRules ? 'How to play' : 'The board is covered'}</div>
            {gateRules ? rulesBody : (
              <div style={{ fontSize: 14, lineHeight: 1.55, color: INK, fontWeight: 600 }}>
                <p style={{ margin: '0 0 7px' }}>{PUZZLE.tiles.length} words below, and {PUZZLE.rules.length} candidate rules. <b>Exactly one of those rules fits every word on the board, and your job is to work out which.</b></p>
                <p style={{ margin: '0 0 7px' }}>Three words start <b style={{ color: `var(--stg-ink, ${COLORS.green})` }}>green</b>, meaning the hidden rule is true of them, and two start <b style={{ color: `var(--stg-ink, ${COLORS.redInk})` }}>red</b>, meaning it is false. Every other word is already green or red too, you just cannot see which yet. Spend a test to uncover one. You have {PUZZLE.budget}, and {PERFECT} well chosen will settle it.</p>
                <p style={{ margin: 0 }}>You score only the rules you actually rule out, so eliminate before you name.</p>
              </div>
            )}
            <div style={{ marginTop: 'auto', paddingTop: 18, display: 'flex', flexDirection: 'row-reverse', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
              <button className="ax-btn" onClick={startRun} style={{ background: STAGE ? STAGE_C : T.cta, color: STAGE ? 'var(--stg-onramp, #08222e)' : T.white, fontSize: 15, padding: '11px 22px' }}>Uncover the board</button>
              <div>
                <button type="button" onClick={() => setGateRules((v) => !v)} style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', fontFamily: SANS, fontSize: 13, fontWeight: 700, color: FADED, textDecoration: 'underline' }}>
                  {gateRules ? 'Hide detailed instructions' : 'Show detailed instructions'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* the board */}
        {!preStart && (
          <>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', marginBottom: 8 }}>
              <div style={{ fontFamily: MONO, fontSize: 10.5, fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.1em', color: FADED }}>The board</div>
              {playing && (
                <div style={{ display: 'flex', gap: 6, marginLeft: 'auto' }}>
                  <button type="button" className={`ax-tool${mode === 'mark' ? ' on' : ''}`} onClick={() => setMode('mark')} title="Cross tiles out as notes. Free, and it changes nothing on the board.">
                    <Ban size={13} /> Mark &times;
                  </button>
                  <button type="button" className={`ax-tool${mode === 'test' ? ' on' : ''}`} onClick={() => setMode('test')} title="Tap a tile to spend a test and flip its colour.">
                    <FlaskConical size={13} /> Test
                  </button>
                </div>
              )}
            </div>
            <div className="ax-grid">
              {PUZZLE.tiles.map((t, i) => {
                const shown = revealed(i);
                const marked = !shown && (g.marks || []).includes(i);
                const cls = shown ? (t.t ? 'yes' : 'no') : '';
                return (
                  <button
                    key={t.w}
                    type="button"
                    className={`ax-tile ${cls}${t.g ? ' given' : ''}${marked ? ' marked' : ''}`}
                    onClick={() => tapTile(i)}
                    onContextMenu={(e) => { e.preventDefault(); if (longFired.current) { longFired.current = false; return; } testTile(i); }}
                    onPointerDown={(e) => { if (e.pointerType === 'touch') startPress(i, e); }}
                    onPointerMove={movePress}
                    onPointerUp={endPress}
                    onPointerLeave={endPress}
                    onPointerCancel={endPress}
                    disabled={shown || !playing}
                    title={t.g ? 'Given' : shown ? 'Tested' : mode === 'test' ? 'Spend a test on this tile' : 'Cross this tile out (free). Hold or right-click to spend a test.'}
                  >{t.w}</button>
                );
              })}
            </div>
          </>
        )}

        {verdict && (
          <div style={{ fontFamily: SANS, fontSize: 13, fontWeight: 700, color: `var(--stg-ink, ${COLORS.rust})`, margin: '10px 0 0', lineHeight: 1.45 }}>
            {verdict.msg}
          </div>
        )}

        {/* the candidates */}
        {!preStart && (
          <>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, margin: '18px 0 8px' }}>
              <div style={{ fontFamily: MONO, fontSize: 10.5, fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.1em', color: FADED }}>The candidates</div>
              {playing && <div style={{ fontFamily: SANS, fontSize: 11.5, fontWeight: 700, color: FADED }}>{g.naming ? 'Pick the one that fits every tile' : 'Tap to cross one out, free'}</div>}
            </div>
            {PUZZLE.rules.map((r, i) => {
              const dead = !playing && i !== ANSWER;
              const winner = !playing && i === ANSWER;
              return (
                <button
                  key={i}
                  type="button"
                  className={`ax-rule${g.struck.includes(i) ? ' struck' : ''}${g.wrongPicks.includes(i) ? ' dead' : ''}${dead ? ' dead' : ''}${winner ? ' win' : ''}`}
                  onClick={() => (g.naming ? nameRule(i) : toggleStrike(i))}
                  disabled={!playing}
                >
                  <span className="ax-chip">{String.fromCharCode(65 + i)}</span>
                  <span style={{ flex: '1 1 auto', minWidth: 0 }}>
                    <span className="ax-rule-t" style={{ display: 'block', fontSize: 13.5, fontWeight: 800, color: INK, lineHeight: 1.4 }}>{ruleLabel(r)}</span>
                  </span>
                  {winner && <span style={{ fontFamily: MONO, fontSize: 9, letterSpacing: '0.08em', textTransform: 'uppercase', fontWeight: 500, color: `var(--stg-ink, ${COLORS.green})`, background: STAGE ? SURF : T.white, borderRadius: 4, padding: '3px 7px' }}>the rule</span>}
                </button>
              );
            })}
          </>
        )}

        {started && (
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', margin: '12px 0 6px' }}>
            <button
              type="button"
              className="ax-btn"
              onClick={() => { if (namesLeft <= 0) { say('No names left today.'); return; } setG((cur) => ({ ...cur, naming: !cur.naming })); }}
              style={g.naming ? { background: `var(--stg-acc, ${COLORS.accent})`, borderColor: COLORS.accent, color: `var(--stg-onramp, ${T.white})` } : { background: `var(--stg-surf, ${COLORS.accentSoft})`, borderColor: 'rgba(15,118,110,0.5)', color: ACC_DEEP_INK }}
            >
              <FlaskConical size={14} /> {g.naming ? 'Picking a rule…' : `Name it for ${liveScore} of ${TOTAL}`}{g.wrongPicks.length ? ` (${namesLeft} left)` : ''}
            </button>
            {(g.struck.length > 0 || (g.marks || []).length > 0) && <button type="button" className="ax-btn" onClick={clearNotes}><Eraser size={14} /> Clear notes</button>}
            {(testsLeft === 0 || g.wrongPicks.length >= MAX_WRONG) && (
              <button type="button" className="ax-btn" style={{ borderColor: '#c3c8cf', color: FADED }} onClick={reveal}>Reveal (ends the day)</button>
            )}
          </div>
        )}


          </div>
          <div className={STAGE ? undefined : 'loft-sol'}>
          {/* result */}
          {!playing && (
            <>
              <div style={{ maxWidth: 472, margin: '14px 0 12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 14, background: STAGE ? SURF : T.white, border: STAGE ? `1px solid ${SURF_B}` : '1.5px solid rgba(28,30,36,0.18)', borderRadius: 10, padding: '12px 14px' }}>
                  <span style={{ fontFamily: MONO, fontSize: 32, fontWeight: 500, color: won ? COLORS.green : g.status === 'done' ? `var(--stg-ink, ${COLORS.ink})` : `var(--stg-bad, ${COLORS.rust})`, fontVariantNumeric: 'tabular-nums', letterSpacing: '0.04em', flex: '0 0 auto' }}>{score}/{TOTAL}</span>
                  <span style={{ fontFamily: SANS, fontSize: 13, fontWeight: 700, color: INK, lineHeight: 1.45 }}>
                    {g.status === 'done'
                      ? (won ? <>Named at perfect on {testsUsed} test{testsUsed === 1 ? '' : 's'}.</> : <>Named it on {testsUsed} test{testsUsed === 1 ? '' : 's'}{g.wrongPicks.length ? ` and ${g.wrongPicks.length} wrong name${g.wrongPicks.length === 1 ? '' : 's'}` : ''}.</>)
                      : <>The board beat you. The rule: <b>{answerLabel.toLowerCase()}</b>.</>}
                    {' '}<span style={{ color: FADED, fontWeight: 600 }}>{elapsed}</span>
                  </span>
                </div>
              </div>
              <p className={STAGE ? undefined : 'loft-tailnote'} style={{ fontSize: 12, color: FADED, fontWeight: 600, margin: '12px 0 0' }}>
                {isTodays ? (
                  <>
                    {countdown ? <>A new board goes up in <b style={{ color: INK, fontVariantNumeric: 'tabular-nums' }}>{countdown}</b>.</> : 'A new board goes up at midnight Eastern.'}
                    {prevPuzzle && (
                      <>
                        {' '}Meanwhile:{' '}
                        <a href={`/axiom?p=${prevPuzzle.num}`} style={{ color: `var(--stg-ink, ${COLORS.ember})`, fontWeight: 800, textDecoration: 'underline' }}>
                          yesterday&rsquo;s board &rarr;
                        </a>
                      </>
                    )}
                  </>
                ) : (
                  <>
                    You&rsquo;re playing the {PUZZLE.dateLabel.replace(', 2026', '')} archive.{' '}
                    <a href="/axiom" style={{ color: `var(--stg-ink, ${COLORS.ember})`, fontWeight: 800, textDecoration: 'underline' }}>Back to today&rsquo;s board &rarr;</a>
                    {' · '}
                    <a href="/daily" style={{ color: FADED, fontWeight: 700, textDecoration: 'underline' }}>All daily puzzles</a>
                  </>
                )}
              </p>
            </>
          )}
          </div>
          {LOFT && !playing && loftRevealed && (
            <button className={STAGE ? 'stf-hideboard' : 'loft-showopts'} onClick={() => setLoftRevealed(false)}>&#8630; Hide game board</button>
          )}
          </div>
          {LOFT && !playing && (
            <LoftFinish
              name="Axiom"
              catRank={catRank}
              outcome={won ? 'won' : (score > 0 ? 'part' : 'lost')}
              title={won ? 'Solved' : (score > 0 ? 'Partly solved' : 'Not solved')}
              detail={`${`${score}/${TOTAL}`} \u00b7 ${elapsed}`}
              iq={iq}
              board={dailyBoard}
              gameRank={allTime && allTime.ready
                ? { value: allTime.rank != null ? `#${Number(allTime.rank).toLocaleString()}` : '\u2014',
                    label: allTime.field != null ? `of ${Number(allTime.field).toLocaleString()} Axiom all time` : 'all-time rank' }
                : null}
              day={dayStats}
              streak={isTodays ? myStats.cur : null}
              missLabel="Tests"
              archive={puzzles
                .filter((p) => p.live <= etToday() && p.num !== PUZZLE.num)
                .sort((x, y) => y.num - x.num)
                .map((p) => ({
                  num: p.num,
                  dateLabel: p.dateLabel,
                  sunday: !!p.sunday,
                  href: `/axiom?p=${p.num}`,
                  done: !!(stats && stats.rec && stats.rec[p.num]),
                  score: (stats && stats.rec && stats.rec[p.num]) ? stats.rec[p.num].s : null,
                }))}
              options={[
                { label: copied ? 'Copied' : (shareCta || 'Share'), sub: 'Your result, no spoilers', kind: 'gold', onClick: copyShare },
                { tone: won ? 'board' : 'reveal', label: won ? 'Return to board' : 'Reveal answer',
                  sub: won ? 'Your finished board' : 'Show what you missed', onClick: () => setLoftRevealed(true) },
              prevPuzzle && { tone: 'another', label: 'Play another Axiom', sub: `No. ${prevPuzzle.num}, yesterday\u2019s puzzle`, href: `/axiom?p=${prevPuzzle.num}` },
                nextUp && { tone: 'similar', label: 'Play similar', sub: `${nextUp.name} \u00b7 ${nextUp.tag}`, href: nextUp.href },
                { tone: 'replay', label: 'Replay', sub: 'This puzzle again, unscored', onClick: resetGame },
                { label: 'Back to main', sub: 'The day\u2019s full board', tone: 'main', href: '/' },
              ]}
            />
          )}
          </div>
          </div>
        {/* end of the navy play stage; everything below is the light tail */}
        </div>

        {/* The game's own record, archive and leaderboards, at the foot of the
            page (owner, 2026-08-24). This is the panel that used to open from a
            home-page puzzle tile. GamePanel renders its own button and also
            flips the page out of focus mode on first open, which is all the
            "Show overview and more" control it replaces ever did. */}
        {/* The strip in the cap answers what this opens, without being pressed. */}
        {!STAGE && <GamePanel self="axiom" name="Axiom" onShow={() => setShowChrome(true)} />}
        <div style={{ display: (focusMode && !STAGE) ? 'none' : 'block', margin: '30px auto 0', maxWidth: 640 }}>
          {LOFT && (
            <div className={STAGE ? undefined : 'loft-report'}>
              <ReportIssue self="axiom" name="Axiom" accent="#ffffff" align="center" onHelp={() => setShowHelp(true)} />
            </div>
          )}
          {!LOFT && (
          <DailyGamesGrid replay={!playing ? resetGame : null}
            self="axiom"
            maxWidth={640}
            challengeHref={`/duel/new?quiz=${encodeURIComponent(PUZZLE.quizId)}`}
            share={{ label: copied ? 'Copied' : 'Share', onClick: copyShare }}
            light
            boardSlot={<DailyBoardPanel self="axiom" quizId={PUZZLE.quizId} maxWidth={640} streak={{ current: myStats.cur, best: myStats.max }} />}
            divider
          />
          )}
          {!focusMode && mobileUi && !standalone && (
            <button onClick={a2hsClick} style={{ marginTop: 10, width: '100%', fontFamily: SANS, fontSize: 13.5, letterSpacing: '0.05em', textTransform: 'uppercase', fontWeight: 800, height: 54, borderRadius: 10, border: 'none', background: `var(--stg-acc, ${COLORS.accent})`, color: `var(--stg-onramp, ${T.white})`, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 9, whiteSpace: 'nowrap' }}>
              <Smartphone size={15} strokeWidth={2.5} /> Add to Home Screen
            </button>
          )}
        </div>
        {showA2hsHelp && (
          <div onClick={() => setShowA2hsHelp(false)} style={{ position: 'fixed', inset: 0, background: 'rgba(20,22,28,0.55)', zIndex: 90, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 18 }}>
            <div onClick={(e) => e.stopPropagation()} style={{ background: STAGE ? 'var(--stg-raise,#0e131f)' : T.white, borderRadius: 14, maxWidth: 430, width: '100%', padding: '22px 22px 16px', fontFamily: SANS, border: STAGE ? '1px solid var(--stg-line)' : '1.5px solid rgba(20,22,28,0.12)' }}>
              <div style={{ fontSize: 17, fontWeight: 800, color: INK, marginBottom: 8 }}>Add Axiom to your Home Screen</div>
              {isIosDevice() ? (
                <ol style={{ margin: '0 0 4px', paddingLeft: 20, color: INK, fontSize: 14, lineHeight: 1.7 }}>
                  <li>Tap the <b>Share</b> button in Safari&apos;s toolbar.</li>
                  <li>Scroll down and tap <b>Add to Home Screen</b>.</li>
                  <li>Tap <b>Add</b> &mdash; the tile opens today&apos;s board, every day.</li>
                </ol>
              ) : (
                <p style={{ margin: '0 0 4px', color: INK, fontSize: 14, lineHeight: 1.7 }}>
                  Open your browser&apos;s menu and choose <b>Add to Home Screen</b> (or <b>Install app</b>). The tile opens today&apos;s board, every day.
                </p>
              )}
              <button onClick={() => setShowA2hsHelp(false)} style={{ marginTop: 10, fontFamily: SANS, fontSize: 12.5, letterSpacing: '0.05em', textTransform: 'uppercase', fontWeight: 700, height: 44, width: '100%', borderRadius: 10, border: 'none', background: COLORS.ink, color: T.white, cursor: 'pointer' }}>Got it</button>
            </div>
          </div>
        )}
        {!focusMode && !identity && (
          <div id="daily-join" style={{ margin: '18px auto 0', maxWidth: 640 }}>
            <JoinLeaderboardForm hideIcon heading="See your stats and join the leaderboard" identity={identity} onJoined={(id) => { setIdentity(id); if (id && id.username) setPlayer((p) => p || { name: id.username, rank: null }); }} />
          </div>
        )}
        </div>
      </div>

      {!playing && !endClosed && !LOFT && (
        <DailyEndCard
          modal
          self="axiom"
          won={won}
          completed={g.status === 'done'}
          headline={g.status === 'done' ? <>The rule is named</> : <>The board keeps its rule</>}
          subline={<>Axiom #{PUZZLE.num} &middot; {score}/{TOTAL} &middot; {testsUsed} test{testsUsed === 1 ? '' : 's'} (perfect {PERFECT}) &middot; {elapsed}</>}
          onShare={copyShare}
          shareLabel={copied ? 'Copied' : 'Share Result'}
          onReplay={resetGame}
          onClose={() => setEndClosed(true)}
        />
      )}

      <DuelBanner token={duelToken} info={duelInfo} submitted={duelSubmitted} />

      {toast && (
        <div style={{ position: 'fixed', left: '50%', bottom: 26, transform: 'translateX(-50%)', background: COLORS.ink, color: T.white, fontFamily: SANS, fontWeight: 800, fontSize: 13.5, padding: '10px 18px', borderRadius: 9, zIndex: 60, boxShadow: '0 6px 18px rgba(20,22,28,0.25)', maxWidth: '86vw', textAlign: 'center' }}>
          {toast}
        </div>
      )}

      {showHelp && (
        <div onClick={() => { setShowHelp(false); try { localStorage.setItem(HELP_KEY, '1'); } catch (e) {} }}
          style={{ position: 'fixed', inset: 0, background: 'rgba(20,22,28,0.55)', zIndex: 70, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
          <div onClick={(e) => e.stopPropagation()} style={{ width: '100%', maxWidth: 460, background: STAGE ? 'var(--stg-raise,#0e131f)' : COLORS.cream, borderRadius: 12, border: STAGE ? '1px solid var(--stg-line)' : `2px solid ${COLORS.ink}`, padding: '20px 22px', fontFamily: SANS, maxHeight: '86vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', alignItems: 'center', marginBottom: 10 }}>
              <div style={{ fontSize: 21, fontWeight: 800, color: INK }}>How to play</div>
              <button onClick={() => { setShowHelp(false); try { localStorage.setItem(HELP_KEY, '1'); } catch (e) {} }} aria-label="Close" style={{ marginLeft: 'auto', background: 'none', border: 'none', cursor: 'pointer', color: FADED }}><X size={20} /></button>
            </div>
            {rulesBody}
            <button className="ax-btn" onClick={() => { setShowHelp(false); try { localStorage.setItem(HELP_KEY, '1'); } catch (e) {} }} style={{ marginTop: 14, background: COLORS.ink, color: T.white }}>Play</button>
          </div>
        </div>
      )}

      {/* The desktop fold: the About prose below starts one screen down (app/StageFold.jsx). */}
      <StageFold />
      {/* About Axiom — crawlable prose for search, server-rendered */}
      <section style={{ display: (focusMode && !STAGE) ? 'none' : 'block', position: 'relative', zIndex: 2, maxWidth: 640, margin: '0 auto', padding: '10px 24px 42px', fontFamily: SANS }}>
        <h2 style={{ margin: '0 0 8px', fontSize: 15, fontWeight: 800, letterSpacing: '-0.01em', color: INK }}>About Axiom</h2>
        <p style={{ margin: '0 0 8px', fontSize: 13, lineHeight: 1.65, color: FADED, fontWeight: 600 }}>
          Axiom is a free daily logic puzzle from Mind Loft, built on the oldest experiment in reasoning: find the hidden rule. A board of ordinary words is split by a rule you cannot see. A few tiles are flipped for you, a short list of candidate rules sits underneath, and a small budget of tests is all you get to tell them apart.
        </p>
        <p style={{ margin: '0 0 8px', fontSize: 13, lineHeight: 1.65, color: FADED, fontWeight: 600 }}>
          The trap is the one every scientist knows. Most tiles confirm what you already believe, and confirmation costs a test and teaches nothing. The tiles worth spending on are the ones where two surviving rules disagree. Every board is generated and machine-verified so that exactly one candidate fits it, and so that no single test can settle the question on its own.
        </p>
        <p style={{ margin: 0, fontSize: 13, lineHeight: 1.65, color: FADED, fontWeight: 600 }}>
          A new board goes up every day at midnight Eastern, with a wider candidate field on Sundays. No app, no signup, play free in your browser, keep a streak and race the daily leaderboard. More dailies: <a href="/hearsay" style={{ color: INK, fontWeight: 800 }}>Hearsay</a>, our puzzle of what other people don&rsquo;t know, <a href="/sworn" style={{ color: INK, fontWeight: 800 }}>Sworn</a>, our daily liars puzzle, and <a href="/alibi" style={{ color: INK, fontWeight: 800 }}>Alibi</a>, our nightly whodunit.
        </p>
      </section>

      {!STAGE && <div style={{ display: focusMode ? 'none' : 'block', position: 'relative', zIndex: 2 }}><Footer /></div>}
    </div>
  );

  function copyShare() {
    const streakBit = isTodays && myStats.cur >= 2 && g.status !== 'playing' ? ` · streak ${myStats.cur}` : '';
    const pips = PUZZLE.tiles.map((t, i) => (g.tested.includes(i) ? (t.t ? '\u{1F7E9}' : '\u{1F7E5}') : '')).join('');
    const solvedBit = g.status === 'done'
      ? `\u{1F9EA} Rule found on ${testsUsed} test${testsUsed === 1 ? '' : 's'} (perfect ${PERFECT})${g.wrongPicks.length ? ` · ${g.wrongPicks.length} wrong name${g.wrongPicks.length === 1 ? '' : 's'}` : ''}`
      : g.status === 'lost' ? '\u{1F9EA} The board kept its rule' : '\u{1F9EA} Still testing…';
    const text = playing
      ? `Axiom #${PUZZLE.num} — the daily rule-induction puzzle from Mind Loft.\n${withRef(`mindloftdaily.com/axiom${isTodays ? '' : `?p=${PUZZLE.num}`}`)}`
      : `Axiom — Board #${PUZZLE.num}\n${solvedBit}${streakBit}\n${pips}\n${withRef(`mindloftdaily.com/axiom${isTodays ? '' : `?p=${PUZZLE.num}`}`)}`;
    if (notifyShareCredit(text)) return;
    try {
      if (typeof navigator !== 'undefined' && navigator.share && isMobileDevice()) {
        navigator.share({ text }).catch(() => {});
        return;
      }
    } catch (e) {}
    try {
      navigator.clipboard?.writeText(text).then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 1800);
      });
    } catch (e) {}
  }
}
