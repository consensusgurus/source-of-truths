// scripts/verify-clade.mjs: the independent gate for Clade.
//
//   node scripts/verify-clade.mjs
//
// Imports NOTHING from scripts/gen-clade.mjs. Re-derives, from the animal
// list and the bank alone:
//   ANIMALS: at least 240; names and alts unique (case-insensitive); tier
//     1 to 4; every path 4 to 9 rungs starting at 'Animals'; a branch name
//     always sits under the same parent path (the tree is a tree); no
//     branch name equals an animal name or alt; no two animals whose names
//     differ only by case, spacing or punctuation. (Two common names for
//     one species cannot be detected mechanically: that is a review rule,
//     listed in the animals.js header.)
//   BANK: contiguous dates from 2026-10-04, num in order, quizId and
//     dateLabel agree with live, sunday exactly on real Sundays, tier by
//     weekday, answer exists, no repeats, no class two days running, no
//     class more than 3 times in any 7 days, and the narrowing rule.
// VERIFY_CLADE_BANK=<path> checks a different bank file (mutation tests).
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { ANIMALS } from '../app/clade/animals.js';

const bankPath = process.env.VERIFY_CLADE_BANK ? path.resolve(process.env.VERIFY_CLADE_BANK) : new URL('../app/clade/puzzles.js', import.meta.url).pathname;
const { PUZZLES } = await import(pathToFileURL(bankPath).href);

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const TIER = [4, 1, 1, 2, 2, 3, 3];
const START = '2026-10-04';
let fails = 0;
const fail = (msg) => { fails++; console.log(`FAIL clade: ${msg}`); };

// ---- animals ----
if (ANIMALS.length < 240) fail(`only ${ANIMALS.length} animals`);
const labels = new Map(), squashed = new Map(), parentOf = new Map(), byName = new Map();
const squash = (s) => s.toLowerCase().replace(/[^a-z0-9]/g, '');
for (const a of ANIMALS) {
  if (![1, 2, 3, 4].includes(a.tier)) fail(`${a.name}: tier ${a.tier}`);
  if (!Array.isArray(a.path) || a.path.length < 4 || a.path.length > 9) fail(`${a.name}: path length ${a.path && a.path.length}`);
  if (a.path[0] !== 'Animals') fail(`${a.name}: path does not start at Animals`);
  byName.set(a.name, a);
  for (const n of [a.name, ...(a.alt || [])]) {
    const k = n.toLowerCase();
    if (labels.has(k)) fail(`name "${n}" used by ${labels.get(k)} and ${a.name}`);
    labels.set(k, a.name);
  }
  const sq = squash(a.name);
  if (squashed.has(sq)) fail(`${a.name} and ${squashed.get(sq)} are the same name`);
  squashed.set(sq, a.name);
  a.path.forEach((b, i) => {
    const parent = a.path.slice(0, i).join(' > ');
    if (parentOf.has(b) && parentOf.get(b) !== parent) fail(`branch "${b}" sits under "${parentOf.get(b)}" and "${parent}"`);
    parentOf.set(b, parent);
  });
  if (new Set(a.path).size !== a.path.length) fail(`${a.name}: branch repeated in its own path`);
}
for (const b of parentOf.keys()) if (labels.has(b.toLowerCase())) fail(`branch "${b}" is also an animal name`);

// ---- bank ----
const classOf = (a) => (a.path[2] === 'Four-limbed vertebrates' ? a.path[3] : a.path[2]);
const common = (p, q) => { let i = 0; while (i < p.length && i < q.length && p[i] === q[i]) i += 1; return i; };
const seen = new Set();
const classes = [];
PUZZLES.forEach((p, i) => {
  const tag = `#${p.num} ${p.live}`;
  const want = new Date(`${START}T12:00:00Z`); want.setUTCDate(want.getUTCDate() + i);
  if (p.live !== want.toISOString().slice(0, 10)) fail(`${tag}: date gap, expected ${want.toISOString().slice(0, 10)}`);
  if (p.num !== i + 1) fail(`${tag}: num out of order`);
  const [y, m, d] = String(p.live).split('-').map(Number);
  if (p.quizId !== `clade-${m}-${d}-${String(y).slice(2)}`) fail(`${tag}: quizId ${p.quizId}`);
  if (p.dateLabel !== `${MONTHS[m - 1]} ${d}, ${y}`) fail(`${tag}: dateLabel ${p.dateLabel}`);
  const dow = new Date(`${p.live}T12:00:00Z`).getUTCDay();
  if (p.sunday !== (dow === 0)) fail(`${tag}: sunday flag does not match the date`);
  const a = byName.get(p.answer);
  if (!a) { fail(`${tag}: answer "${p.answer}" is not an animal`); classes.push(null); return; }
  if (a.tier !== TIER[dow]) fail(`${tag}: ${a.name} is tier ${a.tier}, weekday wants ${TIER[dow]}`);
  if (seen.has(a.name)) fail(`${tag}: ${a.name} repeats`);
  seen.add(a.name);
  if (!ANIMALS.some((b) => b !== a && common(a.path, b.path) >= 4)) fail(`${tag}: ${a.name} has no neighbor at depth 4 or deeper`);
  const c = classOf(a);
  if (i && classes[i - 1] === c) fail(`${tag}: ${c} two days running`);
  const win = classes.slice(Math.max(0, i - 6)).filter((x) => x === c).length + 1;
  if (win > 3) fail(`${tag}: ${c} ${win} times in 7 days`);
  classes.push(c);
});
if (PUZZLES.length !== 78) fail(`${PUZZLES.length} days, expected 78`);

const tiers = {}, cls = {};
for (const a of ANIMALS) { tiers[a.tier] = (tiers[a.tier] || 0) + 1; cls[classOf(a)] = (cls[classOf(a)] || 0) + 1; }
console.log(`verify-clade: ${ANIMALS.length} animals, ${parentOf.size} branches, tiers ${JSON.stringify(tiers)}`);
console.log(`  classes ${JSON.stringify(cls)}`);
console.log(`  ${PUZZLES.length} days, ${PUZZLES[0] && PUZZLES[0].live} to ${PUZZLES.length && PUZZLES[PUZZLES.length - 1].live}, ${fails} failures`);
process.exit(fails ? 1 : 0);
