// scripts/gen-clade.mjs: deals the Clade calendar into app/clade/puzzles.js.
//
//   node scripts/gen-clade.mjs > app/clade/puzzles.js
//
// Deterministic: a seeded shuffle plus a depth-first search, so a re-run
// reproduces the bank byte for byte.
//
// RULES (re-proved by scripts/verify-clade.mjs, which imports nothing here):
//   * 78 days, 2026-10-04 (a Sunday) to 2026-12-20.
//   * Tier by weekday: Mon/Tue 1, Wed/Thu 2, Fri/Sat 3, Sunday Edition 4.
//   * No answer repeats.
//   * No two consecutive days from the same class, and no class more than
//     3 times in any 7 consecutive days. Class = the 4th rung under
//     'Four-limbed vertebrates' (Mammals, Birds, ...), otherwise the 3rd.
//   * Narrowing: an answer needs another animal on the list sharing its
//     first 4 rungs or more, so guesses can actually close in.
import { ANIMALS } from '../app/clade/animals.js';

const FIRST = '2026-10-04';
const DAYS = 78;
const TIER_BY_DOW = { 0: 4, 1: 1, 2: 1, 3: 2, 4: 2, 5: 3, 6: 3 };
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

const classOf = (a) => (a.path[2] === 'Four-limbed vertebrates' ? a.path[3] : a.path[2]);
function shared(a, b) { let i = 0; while (i < a.length && i < b.length && a[i] === b[i]) i++; return i; }
const narrows = (a) => ANIMALS.some((b) => b !== a && shared(a.path, b.path) >= 4);

function rng(seed) { let s = seed >>> 0; return () => { s = (s + 0x6D2B79F5) >>> 0; let t = s; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
function addDays(iso, k) { const d = new Date(`${iso}T12:00:00Z`); d.setUTCDate(d.getUTCDate() + k); return d.toISOString().slice(0, 10); }

const rand = rng(20261004);
const pools = {};
for (const t of [1, 2, 3, 4]) {
  const p = ANIMALS.filter((a) => a.tier === t && narrows(a));
  for (let i = p.length - 1; i > 0; i--) { const j = Math.floor(rand() * (i + 1)); [p[i], p[j]] = [p[j], p[i]]; }
  pools[t] = p;
}

const picks = [];
const used = new Set();
function ok(a) {
  const c = classOf(a), n = picks.length;
  if (n && classOf(picks[n - 1]) === c) return false;
  let cnt = 1;
  for (let i = Math.max(0, n - 6); i < n; i++) if (classOf(picks[i]) === c) cnt++;
  return cnt <= 3;
}
function dfs(i) {
  if (i === DAYS) return true;
  const tier = TIER_BY_DOW[new Date(`${addDays(FIRST, i)}T12:00:00Z`).getUTCDay()];
  for (const a of pools[tier]) {
    if (used.has(a.name) || !ok(a)) continue;
    used.add(a.name); picks.push(a);
    if (dfs(i + 1)) return true;
    used.delete(a.name); picks.pop();
  }
  return false;
}
if (!dfs(0)) throw new Error('no legal calendar');

const out = picks.map((a, i) => {
  const iso = addDays(FIRST, i);
  const [y, m, d] = iso.split('-').map(Number);
  return { num: i + 1, quizId: `clade-${m}-${d}-${String(y).slice(2)}`, live: iso, dateLabel: `${MONTHS[m - 1]} ${d}, ${y}`, sunday: new Date(`${iso}T12:00:00Z`).getUTCDay() === 0, answer: a.name };
});

const head = `// Puzzle data for Clade, the daily animal family-tree game. Imported ONLY by
// the server page (app/clade/page.js), which filters live<=today before
// handing puzzles to the client, so future answers never reach a browser.
//
// Each day names one hidden animal from app/clade/animals.js (\`answer\` is
// that animal's \`name\`, byte for byte). A guess is answered with the closest
// branch of the family tree it shares with the answer. Eight guesses; solved
// on guess g scores 11 - g, anything else 0.
//
// AUTHORING RULES (all enforced by scripts/verify-clade.mjs):
//   * Contiguous dates from 2026-10-04; quizId is clade-M-D-YY with no zero
//     padding; dateLabel is the long US date; \`sunday\` is true on real
//     Sundays only.
//   * Tier by weekday: Mon/Tue tier 1, Wed/Thu tier 2, Fri/Sat tier 3, and
//     the Sunday Edition draws a tier 4 (rare) animal.
//   * No answer repeats anywhere in the bank.
//   * No two consecutive days from the same class, and no class more than 3
//     times in any 7 consecutive days. Class = the rung under 'Four-limbed
//     vertebrates' (Mammals, Birds, Reptiles, Amphibians) or, off that
//     branch, the 3rd rung (Ray-finned fish, Insects, ...).
//   * Narrowing: every answer has at least one other animal on the list
//     sharing its first four rungs or more.
//
// Do NOT hand-edit. Regenerate with scripts/gen-clade.mjs and re-run
// scripts/verify-clade.mjs.
export const PUZZLES = [
`;
process.stdout.write(`${head}${out.map((p) => `  ${JSON.stringify(p)},`).join('\n')}\n];\n`);
