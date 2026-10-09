// gen-gap.mjs — the Gap problem bank (launched 2026-10-09).
//
// Gap is the missing-number sibling of Blitz: every line is an equation with
// one number taken out, 7 × ? = 56, and the player picks the number that makes
// it true. Twenty a day in five rounds of four, twenty seconds each, one life.
//
// The skill is running an operation BACKWARDS, so the named mistakes are the
// ones that come from running it forwards: adding where you should subtract
// (? − 18 = 25 answered 7), dividing the wrong way, forgetting the tail on a
// two-step line, answering the result instead of the gap, the neighbouring
// times-table entry. Every family lists its mistakes first; the shared chooser
// (scripts/mathrun-core.mjs) then applies Blitzed's anti-sieve rules.
//
// scripts/verify-gap.mjs re-solves every line by substituting all four options
// and requires EXACTLY ONE to make the equation true.
//
//   node scripts/gen-gap.mjs --force               (whole bank, scratch only)
//   node scripts/gen-gap.mjs --from <date> --days N --startnum <n> --out /tmp/x

import { makeRng, makeChooser, buildDays, emitBank, parseArgs } from './mathrun-core.mjs';

const A = parseArgs(process.argv.slice(2), { from: '2026-10-09', days: 78, out: 'app/gap', seed: 20261009 });
const { R, ri, pick } = makeRng(A.seed);
const choose = makeChooser();
const SUP = '⁰¹²³⁴⁵⁶⁷⁸⁹';
const sup = (n) => String(n).split('').map((d) => SUP[+d]).join('');
const F = {};
const ok = (n) => Number.isInteger(n) && n > 0;

// ---- tier 1, Warm-up: one operation, the times tables ----------------------
F.addGap = () => { const a = ri(3, 19), x = ri(2, 19); const c = a + x;
  return { sig: 'add', q: pick([`${a} + ? = ${c}`, `? + ${a} = ${c}`]), a: x, ds: [c + a, x + 1, x - 1, x + 2, x - 2, c] }; };
F.subGap = () => { const b = ri(2, 15), c = ri(2, 20); const x = c + b;
  return { sig: 'sub', q: `? − ${b} = ${c}`, a: x, ds: [c - b, x - 1, x + 1, x - 2, x + 2, c] }; };
F.subGapR = () => { const x = ri(2, 15), c = ri(2, 20); const a = x + c;
  return { sig: 'sub', q: `${a} − ? = ${c}`, a: x, ds: [a + c, x + 1, x - 1, x + 2, x - 2, c] }; };
F.mulGap = () => { const a = ri(2, 10), x = ri(2, 10); const c = a * x;
  return { sig: 'mul', q: pick([`${a} × ? = ${c}`, `? × ${a} = ${c}`]), a: x, ds: [x + 1, x - 1, c - a, x + 2, x - 2] }; };
F.divGap = () => { const b = ri(2, 10), c = ri(2, 12); const x = b * c;
  return { sig: 'div', q: `? ÷ ${b} = ${c}`, a: x, ds: [x - b, x + b, x + c, x - c, b + c] }; };

F.divGapR = () => { const d = ri(2, 6), x = ri(2, 9); if (d === x) return null; const c = d * x;
  return { sig: 'div', q: `${c} ÷ ? = ${d}`, a: x, ds: [x + 1, x - 1, d, x + 2, x - 2] }; };

// ---- tier 2, Steady: two digits, carrying, the twelves -----------------------
F.addGap2 = () => { const a = ri(15, 69), x = ri(12, 49); if ((a % 10) + (x % 10) < 10) return null; const c = a + x;
  return { sig: 'add', q: pick([`${a} + ? = ${c}`, `? + ${a} = ${c}`]), a: x, ds: [x + 10, x - 10, x + 1, x - 1, c + a] }; };
F.subGap2 = () => { const a = ri(41, 99), c = ri(12, 50); const x = a - c; if (x < 10 || (a % 10) >= (c % 10)) return null;
  return { sig: 'sub', q: `${a} − ? = ${c}`, a: x, ds: [x + 10, x - 10, a + c, x + 1, x - 1] }; };
F.subGap2b = () => { const b = ri(12, 48), c = ri(12, 49); const x = b + c; if ((b % 10) + (c % 10) < 10) return null;
  return { sig: 'sub', q: `? − ${b} = ${c}`, a: x, ds: [x - 10, x + 10, c - b > 0 ? c - b : x - 2, x + 1, x - 1] }; };
F.mulGap12 = () => { const b = ri(6, 15), x = ri(6, 12); if (b === x) return null; const c = b * x;
  return { sig: 'mul', q: pick([`? × ${b} = ${c}`, `${b} × ? = ${c}`]), a: x, ds: [x + 1, x - 1, x + 2, x - 2, c - b] }; };
F.divGap2 = () => { const d = ri(3, 12), x = ri(3, 15); if (d === x) return null; const c = d * x;
  return { sig: 'div', q: `${c} ÷ ? = ${d}`, a: x, ds: [x + 1, x - 1, d, x + 2, x - 2] }; };

// ---- tier 3, Quick: a second step on the line ---------------------------------
F.mulAddGap = () => { const a = ri(3, 9), x = ri(3, 9), b = ri(2, 19); const c = a * x + b;
  const ds = [x + 1, x - 1, x + 2, x - 2]; if (ok((c + b) / a)) ds.unshift((c + b) / a);
  return { sig: 'mulAdd', q: `${a} × ? + ${b} = ${c}`, a: x, ds }; };
F.mulSubGap = () => { const x = ri(3, 12), b = ri(3, 9), cc = ri(2, 19); const d = x * b - cc; if (d < 4) return null;
  const ds = [x - 1, x + 1, x + 2, x - 2]; if (ok((d - cc) / b)) ds.unshift((d - cc) / b);
  return { sig: 'mulSub', q: `? × ${b} − ${cc} = ${d}`, a: x, ds }; };
F.bracketGap = () => { const x = ri(2, 15), a = ri(2, 12), b = ri(2, 6); const c = (x + a) * b;
  return { sig: 'bracket', q: `(? + ${a}) × ${b} = ${c}`, a: x, ds: [x + a, x + 1, x - 1, x + 2, x - 2] }; };
F.pctGap = () => { const b = pick([20, 40, 50, 60, 80, 120, 200, 300, 400]); const x = pick([10, 20, 25, 30, 40, 50, 60, 75, 80, 90]);
  const c = (x * b) / 100; if (!ok(c)) return null;
  return { sig: 'pct', q: `?% of ${b} = ${c}`, a: x, ds: [x + 10, x - 10, 100 - x, x + 5, x - 5, x * 2] }; };
F.divSubGap = () => { const b = ri(2, 6), q0 = ri(4, 12), cc = ri(1, 9); const x = q0 * b; const d = q0 - cc; if (d < 2) return null;
  return { sig: 'divSub', q: `? ÷ ${b} − ${cc} = ${d}`, a: x, ds: [(d - cc) * b > 0 ? (d - cc) * b : x - 2 * b, d * b, x + b, x - b] }; };

// ---- tier 4, Sharp: two-digit tables, squares, a step each side --------------
F.mul2Gap = () => { const a = ri(12, 25), x = ri(3, 9); const c = a * x;
  return { sig: 'mul', q: pick([`${a} × ? = ${c}`, `? × ${a} = ${c}`]), a: x, ds: [x + 1, x - 1, x + 2, x - 2] }; };
F.sqGap = () => { const x = ri(11, 25); const c = x * x;
  return { sig: 'pow', q: `?${sup(2)} = ${c}`, a: x, ds: [x + 1, x - 1, x + 2, x - 2, x + 10, x - 10] }; };
F.divAddGap = () => { const b = ri(3, 9), q0 = ri(3, 12), cc = ri(2, 15); const x = q0 * b; const d = q0 + cc;
  return { sig: 'divAdd', q: `? ÷ ${b} + ${cc} = ${d}`, a: x, ds: [(d + cc) * b, d * b, x + b, x - b, d * b - cc] }; };
F.addMulGap = () => { const x = ri(3, 12), b = ri(3, 9), a = ri(5, 40); const c = a + x * b;
  const ds = [x + 1, x - 1, x + 2, x - 2]; if (ok(c / b - a)) ds.unshift(c / b - a);
  return { sig: 'addMul', q: `${a} + ? × ${b} = ${c}`, a: x, ds }; };
F.bracketSubGap = () => { const a = ri(2, 9), x = ri(a + 3, a + 15), b = ri(3, 8); const c = (x - a) * b;
  return { sig: 'bracket', q: `(? − ${a}) × ${b} = ${c}`, a: x, ds: [x - 2 * a, c / b, x + 1, x - 1, x + 2] }; };

// ---- tier 5, Flat out ----------------------------------------------------------
F.sqAddGap = () => { const x = ri(6, 15), a = ri(5, 60); const c = x * x + a;
  const ds = [x + 1, x - 1, x + 2, x - 2]; const r = Math.sqrt(c + a); if (ok(r)) ds.unshift(r);
  return { sig: 'pow', q: `?${sup(2)} + ${a} = ${c}`, a: x, ds }; };
F.mul2x2Gap = () => { const a = ri(13, 29), x = ri(11, 19); const c = a * x;
  return { sig: 'mul', q: pick([`${a} × ? = ${c}`, `? × ${a} = ${c}`]), a: x, ds: [x + 1, x - 1, x + 2, x - 2, x + 10] }; };
F.pctHardGap = () => { const b = pick([60, 80, 120, 140, 160, 180, 240, 280, 320, 360, 440, 480]); const x = pick([15, 35, 45, 55, 65, 85, 95, 12, 18, 22]);
  const c = (x * b) / 100; if (!ok(c)) return null;
  return { sig: 'pct', q: `?% of ${b} = ${c}`, a: x, ds: [x + 5, x - 5, x + 10, x - 10, 100 - x] }; };
F.cubeGap = () => { const x = ri(4, 12); const c = x * x * x;
  return { sig: 'pow3', q: `?${sup(3)} = ${c.toLocaleString('en-US')}`, a: x, ds: [x + 1, x - 1, x + 2, x - 2] }; };
F.rootGap = () => { const c = ri(11, 25); const x = c * c;
  return { sig: 'root', q: `√? = ${c}`, a: x, ds: [(c + 1) * (c + 1), (c - 1) * (c - 1), x + 10, x - 10, x + c] }; };
F.bracketDivGap = () => { const b = ri(3, 9), c = ri(4, 14), a = ri(3, 30); const x = c * b + a;
  return { sig: 'bracket', q: `(? − ${a}) ÷ ${b} = ${c}`, a: x, ds: [c * b - a > 0 ? c * b - a : x - 2 * b, c * b, x + b, x - b, (c + a) * b] }; };

const TIERS = [
  { fams: ['addGap', 'subGap', 'subGapR', 'mulGap', 'divGap', 'divGapR'] },
  { fams: ['addGap2', 'subGap2', 'subGap2b', 'mulGap12', 'divGap2'] },
  { fams: ['mulAddGap', 'mulSubGap', 'bracketGap', 'pctGap', 'divSubGap'] },
  { fams: ['mul2Gap', 'sqGap', 'divAddGap', 'addMulGap', 'bracketSubGap'] },
  { fams: ['sqAddGap', 'mul2x2Gap', 'pctHardGap', 'cubeGap', 'rootGap', 'bracketDivGap'] },
];
for (const t of TIERS) for (const f of t.fams) if (!F[f]) throw new Error(`no family ${f}`);

const seenQ = new Set();
function makeOne(fam, usedSigs) {
  for (let attempt = 0; attempt < 400; attempt++) {
    const m = F[fam]();
    if (!m) continue;
    if (usedSigs.has(m.sig)) return null;
    if (seenQ.has(m.q) || !ok(m.a) || m.a > 9999) continue;
    const ds = choose(m.a, [...m.ds, m.a - 10, m.a + 10, m.a + 3, m.a - 3, m.a - 20, m.a + 20, m.a + 100, m.a - 100].filter((v) => Number.isInteger(v)));
    if (!ds) continue;
    seenQ.add(m.q);
    return { q: m.q, a: m.a, ds, fam, sig: m.sig };
  }
  return null;
}

const { problems, puzzles } = buildDays({ key: 'gap', prefix: 'g', R, tiers: TIERS, makeOne, from: A.from, days: A.days, startNum: A.startNum });

const head = `// Problem bank for Gap, the daily missing-number ladder (launched 2026-10-09).
// Imported ONLY by the server page (app/gap/page.js) and the Math Gauntlet run
// page, which resolve the picked day's twenty and ship just that day.
//
//   id       'g<day>p<slot>' — authored day and play order (slot 1..20)
//   tier     1 (warm-up) .. 5 (flat out); four per tier, each with a different sig
//   fam      the generator family; sig the operation, taken once a round
//   q        an equation with ONE number replaced by ?
//   choices  four numbers, exactly one of which makes the equation true
//
// Every distractor is a named mistake (running the operation forwards, the
// neighbouring table entry, the tail of a two-step line forgotten), then
// Blitzed's anti-sieve rules: at least two within 0.6x-1.4x (or +/-max(4, half)
// under 30), nothing outside 0.25x-4x, and for answers of 100 or more one
// distractor ending in the same digit. scripts/verify-gap.mjs substitutes all
// four options into every line and requires exactly one to hold.
//
// Generated by scripts/gen-gap.mjs. Extend with a dated range and a splice,
// never a rebuild: a rebuild rewrites days that have already gone live.
`;
const phead = `// Puzzle data for Gap, the daily missing-number ladder. Each day lists twenty
// problem ids from problems.js in play order: five rounds of four. No Sunday
// Edition, matching Blitz and Blitzed, so there is no sunday field at all.
`;
emitBank({ outDir: A.out, force: A.force, head, phead, problems, puzzles });
console.log(`gap: ${problems.length} problems over ${puzzles.length} days, ${puzzles[0].live} to ${puzzles.at(-1).live}`);
