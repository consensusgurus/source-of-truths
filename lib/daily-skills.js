// SKILLS: what each daily trains, as a second axis beside its category
// (owner, 2026-10-16).
//
// The category (Word, Numbers, Logic, ...) says what a game LOOKS like and still
// runs the home shelves, the page colours, the archive and every scoring rule.
// A skill says what a game makes you DO, and it drives only the entry page
// ("What do you want to sharpen today?"): each tile is a skill, and pressing one
// starts today's run of up to five games carrying that skill as their primary.
//
// NOTHING ABOUT A SKILL IS STORED OR SCORED. A skill run is the ordinary daily
// run (lib/daily-run.js, ?run=a,b,c), so every game posts its own result and a
// game played inside a skill run counts exactly as one played on its own.
//
// EVERY LIVE DAILY CARRIES ONE OR TWO SKILLS, primary first. A NEW DAILY ADDS
// ITSELF TO SKILL_TAGS in the same push, or scripts/verify-skills.mjs fails.
// The map was drafted on 2026-10-16 and approved by the owner as drafted; the
// calls it makes are listed in scripts/verify-skills.mjs.

import { liveDailyKeys } from './daily-games.js';

// Ten skills, one ramp step each (CATEGORY_RAMP index in lib/category-ramp.js),
// so the entry page keeps the ten colours it had.
export const SKILLS = [
  { id: 'lang', name: 'Language', what: 'Word retrieval and fluency', ramp: 0 },
  { id: 'math', name: 'Mental math', what: 'Calculation in your head', ramp: 1 },
  { id: 'ded', name: 'Deduction', what: 'Rule-based reasoning', ramp: 2 },
  { id: 'spa', name: 'Spatial reasoning', short: 'Spatial', what: 'Shapes, routes and fit', ramp: 6 },
  { id: 'grid', name: 'Grid logic', what: 'The sudoku family', ramp: 9 },
  { id: 'plan', name: 'Planning', what: 'Thinking moves ahead', ramp: 3 },
  { id: 'mem', name: 'Memory', what: 'Recall of what you know', ramp: 4 },
  { id: 'est', name: 'Estimation', what: 'Judgment and number sense', ramp: 5 },
  { id: 'speed', name: 'Focus and speed', short: 'Focus', what: 'Attention under a clock', ramp: 8 },
  { id: 'ppl', name: 'Reading people', short: 'People', what: 'Guessing what others think', ramp: 7 },
];
export const SKILL_MAP = Object.fromEntries(SKILLS.map((s) => [s.id, s]));

// key: [primary, second?]. Registry keys, not routes (Parker is park, Jesters jester).
export const SKILL_TAGS = {
  crux: ['lang', 'ded'], emcee: ['lang', 'mem'], garble: ['lang'], scram: ['lang', 'speed'],
  scour: ['speed', 'lang'], links: ['lang', 'ded'], span: ['mem', 'spa'], dating: ['mem', 'est'],
  tally: ['math', 'ded'], suds: ['grid'], quilt: ['grid', 'spa'], carve: ['math', 'spa'],
  stet: ['lang', 'speed'], outwit: ['ppl'], tuck: ['lang', 'plan'], alibi: ['ded'],
  cipher: ['math', 'ded'], ping: ['est', 'mem'], warmer: ['lang', 'ded'], jester: ['ded', 'spa'],
  sworn: ['ded'], outrank: ['ppl', 'est'], shards: ['lang', 'spa'], axiom: ['ded'],
  hearsay: ['ded', 'lang'], venn: ['lang', 'ded'], stands: ['ded', 'math'], bracket: ['est', 'mem'],
  pricer: ['est'], dealer: ['est'], realtor: ['est'], agent: ['est'], curator: ['est'],
  lode: ['lang'], etch: ['spa', 'ded'], hedge: ['spa', 'ded'], listed: ['mem', 'est'],
  mate: ['plan'], four: ['plan', 'spa'], park: ['spa', 'plan'], judges: ['ded', 'spa'],
  lamps: ['ded', 'spa'], clade: ['mem', 'ded'], dossier: ['mem', 'ded'], duet: ['ded'],
  snug: ['spa'], jig: ['spa'], junkyard: ['spa', 'plan'], impound: ['spa', 'plan'],
  check: ['plan'], hinge: ['lang'], rung: ['lang', 'plan'], taire: ['plan'], fib: ['ded', 'grid'],
  crunch: ['math'], streak: ['mem', 'speed'], babel: ['lang', 'plan'], feud: ['ppl'],
  crib: ['plan', 'math'], hold: ['est', 'plan'], cell: ['plan'], finesse: ['plan', 'mem'],
  hands: ['plan', 'spa'], glyph: ['ded', 'lang'], chain: ['plan'], suffice: ['ded'],
  yose: ['plan', 'spa'], turn: ['plan', 'spa'], redact: ['mem', 'lang'], paths: ['spa', 'plan'],
  deep: ['mem'], anon: ['lang', 'mem'], strata: ['lang', 'plan'], chomp: ['spa', 'plan'],
  sweep: ['speed', 'ded'], dario: ['speed'], snake: ['speed', 'plan'], blocks: ['speed', 'spa'],
  ergo: ['ded'], docket: ['ded'], blitz: ['math', 'speed'], sums: ['grid', 'math'],
  blitzed: ['math', 'speed'], gap: ['math'], series: ['ded', 'math'], back: ['math'],
  defend: ['plan'], swindle: ['plan'], gift: ['plan', 'spa'], cages: ['grid', 'math'],
  sando: ['grid', 'math'], plot: ['spa', 'ded'], barter: ['lang', 'plan'], sixes: ['grid', 'speed'],
  niche: ['mem'], shoe: ['mem', 'est'], queen: ['plan'], towers: ['grid', 'spa'],
  mercury: ['grid'], arrow: ['grid', 'math'], atlas: ['mem'], calc: ['math', 'plan'],
  sport: ['mem'], encore: ['lang', 'mem'], knight: ['grid'], diag: ['grid'], frame: ['grid', 'math'],
  window: ['grid'], five: ['grid'], racecar: ['grid'], sumo: ['grid'], giant: ['grid'],
  rim: ['grid'], polka: ['grid'], biz: ['mem'], script: ['mem'], quotes: ['mem'], sci: ['mem'],
  art: ['mem'], history: ['mem'], potluck: ['mem'], focus: ['mem', 'speed'], thread: ['mem', 'ded'],
  slot: ['est', 'mem'], whittle: ['grid', 'ded'], flank: ['mem'],
  // Retired or run-only, kept so an archived day still has a skill.
  circa: ['est', 'mem'], extra: ['mem'], passport: ['mem', 'est'],
};

export function primarySkill(key) { const t = SKILL_TAGS[key]; return t ? t[0] : null; }

export const SKILL_RUN_MAX = 5;

/** Today's live dailies whose PRIMARY skill is `id`, in registry order. */
export function skillPool(id, today) {
  return liveDailyKeys(today).filter((k) => primarySkill(k) === id);
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
