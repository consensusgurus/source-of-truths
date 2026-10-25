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
// EVERY LIVE DAILY CARRIES ONE OR TWO SKILLS, primary first (the primary still
// colours nothing; it only orders the list). A NEW DAILY ADDS
// ITSELF TO SKILL_TAGS in the same push, or scripts/verify-skills.mjs fails.
// The map was drafted on 2026-10-16 and approved by the owner as drafted; the
// calls it makes are listed in scripts/verify-skills.mjs.

import { liveDailyKeys } from './daily-games.js';

// Ten skills, one ramp step each (CATEGORY_RAMP index in lib/category-ramp.js),
// so the entry page keeps the ten colours it had.
export const SKILLS = [
  { id: 'lang', name: 'Language', what: 'Word retrieval and fluency', ramp: 0, pane: 'Word' },
  { id: 'math', name: 'Mental Math', what: 'Calculation in your head', ramp: 1, pane: 'Numbers' },
  { id: 'ded', name: 'Deduction', what: 'Rule-based reasoning', ramp: 2, pane: 'Logic' },
  { id: 'spa', name: 'Spatial Reasoning', short: 'Spatial', what: 'Shapes, routes and fit', ramp: 6, pane: 'Logic' },
  { id: 'grid', name: 'Grid Logic', what: 'The sudoku family', ramp: 9, pane: 'Sudoku' },
  { id: 'plan', name: 'Planning', what: 'Thinking moves ahead', ramp: 3, pane: 'End Game' },
  { id: 'mem', name: 'Memory', what: 'Recall of what you know', ramp: 4, pane: 'Trivia' },
  { id: 'est', name: 'Estimation', what: 'Judgment and number sense', ramp: 5, pane: 'Numbers' },
  { id: 'speed', name: 'Focus and Speed', short: 'Focus', what: 'Attention under a clock', ramp: 8, pane: 'Arcade' },
  { id: 'ppl', name: 'Reading People', short: 'People', what: 'Guessing what others think', ramp: 7, pane: 'Crowd Psychology' },
];
export const SKILL_MAP = Object.fromEntries(SKILLS.map((s) => [s.id, s]));

// key: [primary, second?]. A game lists a second skill only when the game
// genuinely trains it (owner, 2026-10-18 midday: tag sparingly, after the
// liberal pass put Docket in Grid logic). Grid logic is the sudoku family
// alone (Latin squares, kakuro, futoshiki); Focus and speed needs a clock that
// matters; Memory needs recall of facts. Registry keys, not routes.
export const SKILL_TAGS = {
  crux: ['lang', 'ded'], emcee: ['lang', 'mem'], garble: ['lang'], scram: ['lang'],
  arcos: ['lang'], gram: ['lang', 'ded'], vocab: ['lang', 'mem'], spell: ['lang', 'speed'], origin: ['lang', 'mem'], idiom: ['lang', 'mem'], scour: ['speed', 'lang'], links: ['lang', 'ded'],
  span: ['mem', 'spa'], dating: ['mem', 'est'], tally: ['math'],
  suds: ['grid'], quilt: ['grid'], carve: ['math', 'spa'],
  stet: ['lang'], outwit: ['ppl'], tuck: ['lang', 'plan'], alibi: ['ded'],
  cipher: ['math', 'ded'], ping: ['est', 'mem'], warmer: ['lang'],
  jester: ['ded'], sworn: ['ded'], outrank: ['ppl'],
  shards: ['lang', 'spa'], axiom: ['ded'], hearsay: ['ded'], venn: ['lang', 'ded'],
  stands: ['ded', 'math'], bracket: ['est', 'mem'], pricer: ['est'], dealer: ['est'],
  realtor: ['est'], agent: ['est'], curator: ['est'], lode: ['lang'],
  etch: ['spa', 'ded'], hedge: ['spa', 'ded'], listed: ['mem'],
  mate: ['plan'], four: ['plan'], park: ['spa', 'plan'],
  judges: ['ded'], lamps: ['ded'], clade: ['mem', 'ded'],
  dossier: ['mem', 'ded'], duet: ['ded'], snug: ['spa'], jig: ['spa'],
  junkyard: ['spa', 'plan'], topple: ['spa', 'plan'], roll: ['spa', 'plan'], impound: ['spa', 'plan'], check: ['plan'],
  hinge: ['lang'], rung: ['lang', 'plan'], taire: ['plan'],
  fib: ['ded', 'grid'], crunch: ['math'], streak: ['mem', 'speed'],
  babel: ['lang', 'plan'], feud: ['ppl'], herd: ['ppl'], aorb: ['ppl'],
  crib: ['plan'], hold: ['est'], cell: ['plan'], mahj: ['spa', 'plan'],
  finesse: ['plan'], hands: ['plan'], glyph: ['ded', 'lang'],
  chain: ['plan'], suffice: ['ded'], yose: ['plan'],
  turn: ['plan'], redact: ['mem', 'lang'], paths: ['spa'],
  deep: ['mem'], anon: ['lang'], strata: ['lang', 'plan'], chomp: ['spa', 'plan'],
  sweep: ['speed', 'ded'], dario: ['speed'], snake: ['speed'],
  squash: ['spa', 'speed'], blocks: ['speed', 'spa'], ergo: ['ded'],
  docket: ['ded'], blitz: ['math', 'speed'], sums: ['grid', 'math'],
  blitzed: ['math', 'speed'], gap: ['math'], series: ['ded', 'math'],
  back: ['math'], defend: ['plan'], swindle: ['plan'],
  gift: ['plan'], cages: ['grid', 'math'], sando: ['grid', 'math'],
  plot: ['spa', 'ded'], barter: ['lang'], sixes: ['grid'],
  niche: ['mem'], shoe: ['mem', 'est'], queen: ['plan'],
  towers: ['grid'], mercury: ['grid'], arrow: ['grid', 'math'],
  atlas: ['mem'], calc: ['math'], sport: ['mem'], encore: ['lang', 'mem'],
  knight: ['grid'], diag: ['grid'], frame: ['grid', 'math'], window: ['grid'],
  five: ['grid'], racecar: ['grid'], sumo: ['grid'],
  giant: ['grid'], rim: ['grid'], polka: ['grid'], biz: ['mem'],
  script: ['mem'], quotes: ['mem'], sci: ['mem'], art: ['mem'], history: ['mem'],
  potluck: ['mem'], focus: ['mem'], thread: ['mem'],
  slot: ['est', 'mem'], whittle: ['grid'], flank: ['mem'],
  // Retired or run-only, kept so an archived day still has a skill.
  circa: ['est', 'mem'], extra: ['mem'], passport: ['mem'],
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
