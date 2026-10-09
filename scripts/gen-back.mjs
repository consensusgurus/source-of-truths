// gen-back.mjs — the Back problem bank (launched 2026-10-09).
//
// Back is Blitz played backwards: the number is given, ? = 56, and the player
// picks which of four lines makes it. Twenty a day in five rounds of four,
// twenty seconds each, one life.
//
// THE FOUR LINES IN A PROBLEM SHARE ONE SHAPE (all a × b + c, say), so the
// answer cannot be spotted by its length or its operators: every line has to be
// worked. The three wrong lines are chosen for how close they come, in this
// order of preference:
//
//   trap    a line whose MISREAD equals the target: 4 + 6 × 5 read left to
//           right is 50, so on ? = 50 it is the line a careless player takes;
//           a bracket ignored; a square taken as a doubling; a cube as a tripling
//   digit   a line ending in the same digit as the target, so the units digit
//           alone never decides it
//   near    a line one to three off
//
// then Blitzed's anti-sieve rules on the VALUES (two within 0.6x-1.4x, nothing
// outside 0.25x-4x, one sharing the last digit from 100 up). Every operand set
// is drawn from a precomputed grid per family, so the trap is found by lookup
// rather than by luck. scripts/verify-back.mjs evaluates every line with its
// own parser and requires exactly one to equal the target.
//
//   node scripts/gen-back.mjs --force              (whole bank, scratch only)

import { makeRng, makeChooser, buildDays, emitBank, parseArgs, isTight } from './mathrun-core.mjs';

const A = parseArgs(process.argv.slice(2), { from: '2026-10-09', days: 78, out: 'app/back', seed: 20261011 });
const { R, pick, shuffle } = makeRng(A.seed);
const choose = makeChooser();
const SUP = '⁰¹²³⁴⁵⁶⁷⁸⁹';
const sup = (n) => String(n).split('').map((d) => SUP[+d]).join('');
const range = (lo, hi, step = 1) => { const o = []; for (let v = lo; v <= hi; v += step) o.push(v); return o; };
const int = (v) => Number.isInteger(v) && v > 0;

// A family: operand ranges, a printer, the true value, and the misread value
// (or null when the shape has no tempting misreading).
const FAM = {
  // tier 1
  add: { sig: 'add', r: [range(2, 19), range(2, 19)], s: ([a, b]) => `${a} + ${b}`, v: ([a, b]) => a + b },
  mul: { sig: 'mul', r: [range(2, 12), range(2, 12)], s: ([a, b]) => `${a} × ${b}`, v: ([a, b]) => a * b },
  sub: { sig: 'sub', r: [range(11, 30), range(2, 9)], s: ([a, b]) => `${a} − ${b}`, v: ([a, b]) => a - b },
  div: { sig: 'div', r: [range(4, 144), range(2, 12)], s: ([a, b]) => `${a} ÷ ${b}`, v: ([a, b]) => (a % b === 0 && a / b >= 2 && a / b <= 12 ? a / b : null) },
  // tier 2
  add2: { sig: 'add', r: [range(20, 69), range(12, 39)], s: ([a, b]) => `${a} + ${b}`, v: ([a, b]) => ((a % 10) + (b % 10) >= 10 ? a + b : null) },
  mul12: { sig: 'mul', r: [range(13, 25), range(3, 9)], s: ([a, b]) => `${a} × ${b}`, v: ([a, b]) => a * b },
  sub2: { sig: 'sub', r: [range(31, 99), range(12, 49)], s: ([a, b]) => `${a} − ${b}`, v: ([a, b]) => ((a % 10) < (b % 10) && a - b >= 10 ? a - b : null) },
  div2: { sig: 'div', r: [range(18, 300), range(3, 15)], s: ([a, b]) => `${a} ÷ ${b}`, v: ([a, b]) => (a % b === 0 && a / b >= 6 && a / b <= 20 && a >= 40 && (a / b > 12 || b > 12) ? a / b : null) },
  // tier 3: precedence arrives, and with it the traps
  addMul: { sig: 'addMul', r: [range(2, 20), range(2, 9), range(2, 9)], s: ([a, b, c]) => `${a} + ${b} × ${c}`, v: ([a, b, c]) => a + b * c, l: ([a, b, c]) => (a + b) * c },
  subMul: { sig: 'subMul', r: [range(30, 80), range(2, 6), range(2, 6)], s: ([a, b, c]) => `${a} − ${b} × ${c}`, v: ([a, b, c]) => (a - b * c > 0 ? a - b * c : null), l: ([a, b, c]) => (a - b) * c },
  brMul: { sig: 'bracket', r: [range(2, 12), range(2, 12), range(2, 6)], s: ([a, b, c]) => `(${a} + ${b}) × ${c}`, v: ([a, b, c]) => (a + b) * c, l: ([a, b, c]) => a + b * c },
  mulAdd: { sig: 'mulAdd', r: [range(3, 9), range(3, 9), range(2, 19)], s: ([a, b, c]) => `${a} × ${b} + ${c}`, v: ([a, b, c]) => a * b + c },
  mulSub: { sig: 'mulSub', r: [range(3, 9), range(3, 9), range(2, 19)], s: ([a, b, c]) => `${a} × ${b} − ${c}`, v: ([a, b, c]) => (a * b - c > 0 ? a * b - c : null) },
  // tier 4
  mul2Add: { sig: 'mulAdd', r: [range(11, 19), range(3, 9), range(2, 20)], s: ([a, b, c]) => `${a} × ${b} + ${c}`, v: ([a, b, c]) => a * b + c },
  sqAdd: { sig: 'pow', r: [range(5, 15), range(2, 30)], s: ([a, b]) => `${a}${sup(2)} + ${b}`, v: ([a, b]) => a * a + b, l: ([a, b]) => 2 * a + b },
  pct: { sig: 'pct', r: [[10, 20, 25, 30, 40, 50, 60, 75, 80, 90], range(20, 400, 10)], s: ([a, b]) => `${a}% of ${b}`, v: ([a, b]) => ((a * b) % 100 === 0 ? (a * b) / 100 : null) },
  divAdd: { sig: 'divAdd', r: [range(12, 108), range(2, 9), range(2, 15)], s: ([a, b, c]) => `${a} ÷ ${b} + ${c}`, v: ([a, b, c]) => (a % b === 0 && a / b >= 3 ? a / b + c : null), l: ([a, b, c]) => (a % (b + c) === 0 ? a / (b + c) : null) },
  brSub: { sig: 'bracket', r: [range(8, 30), range(2, 7), range(3, 8)], s: ([a, b, c]) => `(${a} − ${b}) × ${c}`, v: ([a, b, c]) => (a - b) * c, l: ([a, b, c]) => (a - b * c > 0 ? a - b * c : null) },
  // tier 5
  mul2x2Sub: { sig: 'mulSub', r: [range(11, 29), range(11, 19), range(2, 59)], s: ([a, b, c]) => `${a} × ${b} − ${c}`, v: ([a, b, c]) => a * b - c },
  sqSubMul: { sig: 'pow', r: [range(8, 15), range(2, 9), range(2, 9)], s: ([a, b, c]) => `${a}${sup(2)} − ${b} × ${c}`, v: ([a, b, c]) => a * a - b * c, l: ([a, b, c]) => (a * a - b) * c },
  cubeAdd: { sig: 'pow3', r: [range(3, 9), range(2, 40)], s: ([a, b]) => `${a}${sup(3)} + ${b}`, v: ([a, b]) => a * a * a + b, l: ([a, b]) => 3 * a + b },
  rootAddMul: { sig: 'root', r: [range(4, 20).map((x) => x * x), range(2, 9), range(2, 9)], s: ([a, b, c]) => `√${a} + ${b} × ${c}`, v: ([a, b, c]) => Math.sqrt(a) + b * c, l: ([a, b, c]) => (Math.sqrt(a) + b) * c },
  pctAdd: { sig: 'pct', r: [[15, 25, 35, 45, 55, 65, 75, 85, 95], range(40, 400, 20), range(3, 40)], s: ([a, b, c]) => `${a}% of ${b} + ${c}`, v: ([a, b, c]) => ((a * b) % 100 === 0 ? (a * b) / 100 + c : null) },
};

// Precompute every legal operand tuple per family, indexed by value and by
// misread value.
for (const [name, f] of Object.entries(FAM)) {
  const tuples = [[]];
  for (const rr of f.r) { const nx = []; for (const t of tuples) for (const v of rr) nx.push([...t, v]); tuples.length = 0; tuples.push(...nx); }
  f.grid = [];
  f.byV = new Map();
  f.byL = new Map();
  for (const t of tuples) {
    const v = f.v(t);
    if (!int(v) || v > 9999) continue;
    const l = f.l ? f.l(t) : null;
    const e = { t, s: f.s(t), v, l: int(l) && l !== v ? l : null };
    f.grid.push(e);
    if (!f.byV.has(v)) f.byV.set(v, []);
    f.byV.get(v).push(e);
    if (e.l) { if (!f.byL.has(e.l)) f.byL.set(e.l, []); f.byL.get(e.l).push(e); }
  }
  if (f.grid.length < 20) throw new Error(`${name}: grid too small`);
}

const TIERS = [
  { fams: ['add', 'mul', 'sub', 'div'] },
  { fams: ['add2', 'mul12', 'sub2', 'div2'] },
  { fams: ['addMul', 'subMul', 'brMul', 'mulAdd', 'mulSub'] },
  { fams: ['mul2Add', 'sqAdd', 'pct', 'divAdd', 'brSub'] },
  { fams: ['mul2x2Sub', 'sqSubMul', 'cubeAdd', 'rootAddMul', 'pctAdd'] },
];

const seen = new Set();
function makeOne(fam, usedSigs) {
  const f = FAM[fam];
  if (usedSigs.has(f.sig)) return null;
  for (let attempt = 0; attempt < 200; attempt++) {
    const right = pick(f.grid);
    const T = right.v;
    if (seen.has(right.s)) continue;
    // Exactly one line on the board may make T, so every distractor's value
    // differs from T (the chooser also refuses equal values).
    const traps = shuffle((f.byL.get(T) || []).filter((e) => e.v !== T));
    const near = [];
    const D = Math.max(6, Math.round(T * 0.3));
    for (let k = 1; k <= D; k++) for (const d of [k, -k]) {
      const list = f.byV.get(T + d);
      if (list && list.length) near.push(...shuffle(list).slice(0, 2));
    }
    const digit = near.filter((e) => e.v % 10 === T % 10);
    const rest = near.filter((e) => e.v % 10 !== T % 10);
    const cands = [...traps.slice(0, 2), ...digit, ...rest].filter((e) => e.s !== right.s);
    // At most one trap in the final three is enough; the chooser keeps
    // preference order, so a trap leads when one exists.
    const trio = choose(T, cands, (e) => e.v, (e) => e.s);
    if (!trio) continue;
    if (trio.filter((e) => isTight(T, e.v)).length < 2) continue;
    seen.add(right.s);
    return { q: `? = ${T}`, a: right.s, ds: trio.map((e) => e.s), fam, sig: f.sig };
  }
  return null;
}

const { problems, puzzles } = buildDays({ key: 'back', prefix: 'b', R, tiers: TIERS, makeOne, from: A.from, days: A.days, startNum: A.startNum });

const head = `// Problem bank for Back, the daily which-line-makes-it ladder (launched
// 2026-10-09). Imported ONLY by the server page (app/back/page.js) and the
// Math Gauntlet run page, which resolve the picked day's twenty and ship just
// that day.
//
//   id       'b<day>p<slot>' — authored day and play order (slot 1..20)
//   tier     1 (warm-up) .. 5 (flat out); four per tier, each with a different sig
//   fam      the generator family (one line SHAPE); sig the operation
//   q        '? = <target>'
//   choices  four lines of the SAME shape; exactly one evaluates to the target
//
// The wrong lines are a misread that makes the target (left to right, a bracket
// ignored, a square doubled, a cube tripled) where the shape has one, then a
// line ending in the target's digit, then a line one to three off, under
// Blitzed's anti-sieve rules on the values. scripts/verify-back.mjs evaluates
// every line with its own parser and requires exactly one to make the target.
//
// Generated by scripts/gen-back.mjs. Extend with a dated range and a splice,
// never a rebuild.
`;
const phead = `// Puzzle data for Back, the daily which-line-makes-it ladder. Each day lists
// twenty problem ids from problems.js in play order: five rounds of four. No
// Sunday Edition, matching Blitz and Blitzed, so there is no sunday field.
`;
emitBank({ outDir: A.out, force: A.force, head, phead, problems, puzzles });
const traps = problems.filter((p) => FAM[p.fam].l).length;
console.log(`back: ${problems.length} problems over ${puzzles.length} days, ${puzzles[0].live} to ${puzzles.at(-1).live} (${traps} on trap shapes)`);
