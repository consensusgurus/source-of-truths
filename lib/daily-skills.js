// SKILLS: what each daily trains, as a second axis beside its category
// (owner, 2026-10-16).
//
// The category (Word, Numbers, Logic, ...) says what a game LOOKS like and still
// runs the home shelves, the page colours, the archive and every scoring rule.
// A skill says what a game makes you DO. It drives the entry page ("What do
// you want to sharpen today?"), where each tile opens that skill's own pane on
// the home, and the home index, which groups the dailies by skill (the default)
// or by category, the reader's pick (owner, 2026-10-18). A skill pane lists
// every game that LISTS the skill (a game sits in several) and wears its `ramp` step; `pane` is the
// category whose runs it borrows. NOT a run (owner, 2026-10-16: runs are only
// the developed circuits). Nothing about a skill is stored or scored.
//
// EVERY LIVE DAILY CARRIES ONE TO FOUR SKILLS, primary first (the primary still
// colours nothing; it only orders the list). A NEW DAILY ADDS
// ITSELF TO SKILL_TAGS in the same push, or scripts/verify-skills.mjs fails.
// The map was drafted on 2026-10-16 and approved by the owner as drafted; the
// calls it makes are listed in scripts/verify-skills.mjs.

import { liveDailyKeys } from './daily-games.js';

// Ten skills, one ramp step each (CATEGORY_RAMP index in lib/category-ramp.js),
// so the entry page keeps the ten colours it had.
export const SKILLS = [
  { id: 'lang', name: 'Language', what: 'Word retrieval and fluency', ramp: 0, pane: 'Word' },
  { id: 'math', name: 'Mental math', what: 'Calculation in your head', ramp: 1, pane: 'Numbers' },
  { id: 'ded', name: 'Deduction', what: 'Rule-based reasoning', ramp: 2, pane: 'Logic' },
  { id: 'spa', name: 'Spatial reasoning', short: 'Spatial', what: 'Shapes, routes and fit', ramp: 6, pane: 'Logic' },
  { id: 'grid', name: 'Grid logic', what: 'The sudoku family', ramp: 9, pane: 'Sudoku' },
  { id: 'plan', name: 'Planning', what: 'Thinking moves ahead', ramp: 3, pane: 'End Game' },
  { id: 'mem', name: 'Memory', what: 'Recall of what you know', ramp: 4, pane: 'Trivia' },
  { id: 'est', name: 'Estimation', what: 'Judgment and number sense', ramp: 5, pane: 'Numbers' },
  { id: 'speed', name: 'Focus and speed', short: 'Focus', what: 'Attention under a clock', ramp: 8, pane: 'Arcade' },
  { id: 'ppl', name: 'Reading people', short: 'People', what: 'Guessing what others think', ramp: 7, pane: 'Crowd Psychology' },
];
export const SKILL_MAP = Object.fromEntries(SKILLS.map((s) => [s.id, s]));

// key: [primary, ...more]. A game sits in EVERY skill it lists (owner, 2026-10-18:
// liberally), so most carry two to four. Registry keys, not routes (Parker is park, Jesters jester).
export const SKILL_TAGS = {
  crux: ['lang', 'ded', 'mem'], emcee: ['lang', 'mem'], garble: ['lang', 'speed'],
  scram: ['lang', 'speed'], arcos: ['lang', 'mem', 'ded'], scour: ['speed', 'lang', 'spa'], links: ['lang', 'ded', 'mem'],
  span: ['mem', 'spa', 'plan'], dating: ['mem', 'est'], tally: ['math', 'ded', 'plan'],
  suds: ['grid', 'ded'], quilt: ['grid', 'spa', 'ded'], carve: ['math', 'spa', 'ded'],
  stet: ['lang', 'speed'], outwit: ['ppl', 'lang'], tuck: ['lang', 'plan', 'spa'], alibi: ['ded'],
  cipher: ['math', 'ded'], ping: ['est', 'mem', 'spa'], warmer: ['lang', 'ded'],
  jester: ['ded', 'spa', 'grid'], sworn: ['ded', 'ppl'], outrank: ['ppl', 'est', 'mem'],
  shards: ['lang', 'spa', 'ded'], axiom: ['ded'], hearsay: ['ded', 'lang'], venn: ['lang', 'ded'],
  stands: ['ded', 'math'], bracket: ['est', 'mem'], pricer: ['est', 'mem'], dealer: ['est', 'mem'],
  realtor: ['est', 'mem'], agent: ['est', 'mem'], curator: ['est', 'mem'], lode: ['lang', 'speed'],
  etch: ['spa', 'ded', 'grid'], hedge: ['spa', 'ded'], listed: ['mem', 'est'],
  mate: ['plan', 'spa'], four: ['plan', 'spa'], park: ['spa', 'plan'],
  judges: ['ded', 'spa', 'grid'], lamps: ['ded', 'spa', 'grid'], clade: ['mem', 'ded'],
  dossier: ['mem', 'ded'], duet: ['ded', 'grid'], snug: ['spa', 'plan'], jig: ['spa', 'speed'],
  junkyard: ['spa', 'plan'], impound: ['spa', 'plan'], check: ['plan', 'spa'],
  hinge: ['lang', 'mem'], rung: ['lang', 'plan'], taire: ['plan', 'mem'],
  fib: ['ded', 'grid', 'math'], crunch: ['math', 'ded'], streak: ['mem', 'speed'],
  babel: ['lang', 'plan', 'spa'], feud: ['ppl', 'mem'], herd: ['ppl'],
  crib: ['plan', 'math', 'est'], hold: ['est', 'plan', 'math'], cell: ['plan', 'spa'],
  finesse: ['plan', 'mem', 'ded'], hands: ['plan', 'spa', 'math'], glyph: ['ded', 'lang'],
  chain: ['plan', 'spa'], suffice: ['ded', 'math'], yose: ['plan', 'spa', 'est'],
  turn: ['plan', 'spa'], redact: ['mem', 'lang', 'ded'], paths: ['spa', 'plan', 'math'],
  deep: ['mem'], anon: ['lang', 'mem', 'ded'], strata: ['lang', 'plan'], chomp: ['spa', 'plan'],
  sweep: ['speed', 'ded', 'spa'], dario: ['speed', 'plan'], snake: ['speed', 'plan', 'spa'],
  squash: ['spa', 'plan', 'speed'], blocks: ['speed', 'spa', 'plan'], ergo: ['ded', 'lang'],
  docket: ['ded', 'grid'], blitz: ['math', 'speed'], sums: ['grid', 'math', 'ded'],
  blitzed: ['math', 'speed'], gap: ['math', 'speed'], series: ['ded', 'math'],
  back: ['math', 'speed', 'ded'], defend: ['plan', 'spa'], swindle: ['plan', 'spa'],
  gift: ['plan', 'spa', 'ded'], cages: ['grid', 'math'], sando: ['grid', 'math'],
  plot: ['spa', 'ded', 'math'], barter: ['lang', 'plan'], sixes: ['grid', 'speed'],
  niche: ['mem', 'ded'], shoe: ['mem', 'est', 'math'], queen: ['plan', 'spa'],
  towers: ['grid', 'spa', 'ded'], mercury: ['grid', 'ded'], arrow: ['grid', 'math'],
  atlas: ['mem', 'spa'], calc: ['math', 'plan'], sport: ['mem'], encore: ['lang', 'mem'],
  knight: ['grid', 'spa'], diag: ['grid', 'spa'], frame: ['grid', 'math'], window: ['grid', 'spa'],
  five: ['grid', 'math'], racecar: ['grid', 'ded'], sumo: ['grid', 'ded'],
  giant: ['grid', 'speed'], rim: ['grid', 'ded'], polka: ['grid', 'math'], biz: ['mem', 'est'],
  script: ['mem', 'lang'], quotes: ['mem', 'lang'], sci: ['mem'], art: ['mem'], history: ['mem'],
  potluck: ['mem', 'speed'], focus: ['mem', 'speed', 'spa'], thread: ['mem', 'ded', 'lang'],
  slot: ['est', 'mem'], whittle: ['grid', 'ded'], flank: ['mem', 'spa'],
  // Retired or run-only, kept so an archived day still has a skill.
  circa: ['est', 'mem'], extra: ['mem'], passport: ['mem', 'est', 'spa'],
};

export function primarySkill(key) { const t = SKILL_TAGS[key]; return t ? t[0] : null; }
/** True when `key` lists skill `id` anywhere in its tags. */
export function hasSkill(key, id) { const t = SKILL_TAGS[key]; return !!(t && t.includes(id)); }

export const SKILL_RUN_MAX = 5;

/** Today's live dailies that list skill `id`, in registry order. */
export function skillPool(id, today) {
  return liveDailyKeys(today).filter((k) => hasSkill(k, id));
}

function dayIndex(today) {
  const t = Date.parse(`${today}T12:00:00Z`);
  return Number.isFinite(t) ? Math.floor(t / 864e5) : 0;
}

/**
 * Today's run for a skill: the pool, rotated one game a day so the run's
 * opening game changes, with games already finished today (played(key) true)
 * dropped, cut to SKILL_RUN_MAX. Deterministic for a date and a played set.
 */
export function skillRun(id, today, played = () => false) {
  const pool = skillPool(id, today);
  if (!pool.length) return [];
  const start = dayIndex(today) % pool.length;
  const out = [];
  for (let i = 0; i < pool.length && out.length < SKILL_RUN_MAX; i++) {
    const k = pool[(start + i) % pool.length];
    if (!played(k)) out.push(k);
  }
  return out;
}
