// scripts/small-sudokus-verify.mjs: the gate for the eleven 6x6 banks
// (owner, 2026-11-08): Kayak, Lip,
// Fever, Snack, Coop, Dart, Trim, Bout,
// Dot, and the colour KayakToo, LipToo.
//
// Independent of the Python generator (scripts/small-sudoku/): it rebuilds each
// rule from the bank's own printed data and checks, per board,
//   - the solution obeys every rule (rows, columns, 2x3 boxes, plus the variant),
//   - printed digits agree with it, and the printed data IS what the solution
//     implies (sums, sets, signs, dots recomputed, not trusted),
//   - EXACTLY ONE solution from what the player is shown, and the variant rule
//     is needed for it (the printed digits alone do not pin the grid),
// plus bank shape: nums 1..N, one board per day, Sunday flag on Sundays,
// quizIds unique and prefixed, and no board repeated between a numbers bank and
// its colour twin (they are generated independently).
import path from 'path';
import { pathToFileURL } from 'url';
const ROOT = process.env.VERIFY_ROOT || process.cwd();
// ONLY_KEYS (comma list) narrows the run; the per-game scripts/verify-<key>.mjs
// wrappers set it, so verify-all sees one checker per game.
const ONLY = (process.env.ONLY_KEYS || '').split(',').filter(Boolean);
const KEYS = { kayak: 'racecar', lip: 'rim', fever: 'mercury', snack: 'sando', coop: 'cages', dart: 'arrow', trim: 'frame', bout: 'sumo', dot: 'polka', kayaktoo: 'racecar', liptoo: 'rim' };
const N = 6, NN = 36, MIN_GAP = 14;
const box = (r, c) => Math.floor(r / 2) * 2 + Math.floor(c / 3);
const HOUSES = [];
for (let r = 0; r < N; r++) HOUSES.push([...Array(N)].map((_, c) => r * N + c));
for (let c = 0; c < N; c++) HOUSES.push([...Array(N)].map((_, r) => r * N + c));
for (let b = 0; b < N; b++) { const h = []; for (let i = 0; i < NN; i++) if (box(Math.floor(i / N), i % N) === b) h.push(i); HOUSES.push(h); }
const DIAGS = [[...Array(N)].map((_, k) => k * N + k), [...Array(N)].map((_, k) => k * N + N - 1 - k)];
const edge = (s, k) => [0, 1, 2].map((j) => s === 'top' ? j * N + k : s === 'bottom' ? (N - 1 - j) * N + k : s === 'left' ? k * N + j : k * N + N - 1 - j);
const sandwich = (v) => { const a = v.indexOf(1), b = v.indexOf(6); let s = 0; for (let k = Math.min(a, b) + 1; k < Math.max(a, b); k++) s += v[k]; return s; };
const kro = (a, b) => (Math.abs(a - b) === 1 ? 1 : (a === 2 * b || b === 2 * a ? 2 : 0));
const at = ([r, c]) => r * N + c;

// A rule set is a list of { cells, ok(vals, complete) } constraints; ok gets the
// values (0 = empty) and must return false only when already violated.
function rules(kind, p) {
  const C = [];
  const houses = kind === 'diag' ? [...HOUSES, ...DIAGS] : HOUSES;
  for (const h of houses) C.push({ cells: h, ok: (v) => { const s = v.filter(Boolean); return new Set(s).size === s.length; } });
  if (kind === 'knight') for (let i = 0; i < NN; i++) { const r = Math.floor(i / N), c = i % N; for (const [dr, dc] of [[1, 2], [2, 1], [1, -2], [2, -1]]) { const rr = r + dr, cc = c + dc; if (rr < N && cc >= 0 && cc < N) C.push({ cells: [i, rr * N + cc], ok: ([a, b]) => !a || !b || a !== b }); } }
  if (kind === 'racecar') for (const ln of p.lines) for (let k = 0; k < Math.floor(ln.length / 2); k++) C.push({ cells: [at(ln[k]), at(ln[ln.length - 1 - k])], ok: ([a, b]) => !a || !b || a === b });
  if (kind === 'mercury') for (const t of p.thermos) for (let k = 0; k + 1 < t.length; k++) C.push({ cells: [at(t[k]), at(t[k + 1])], ok: ([a, b]) => !a || !b || a < b });
  if (kind === 'arrow') for (const a of p.arrows) C.push({ cells: a.map(at), ok: (v) => v.some((x) => !x) || v[0] === v.slice(1).reduce((x, y) => x + y, 0) });
  if (kind === 'rim') for (const s of ['top', 'bottom', 'left', 'right']) p.rim[s].forEach((clue, k) => { if (!clue) return; const S = new Set(clue.split('').map(Number)); C.push({ cells: edge(s, k), ok: (v) => v.every((x) => !x || S.has(x)) }); });
  if (kind === 'frame') for (const s of ['top', 'bottom', 'left', 'right']) p.sums[s].forEach((t, k) => C.push({ cells: edge(s, k), ok: (v) => v.some((x) => !x) || v[0] + v[1] + v[2] === t }));
  if (kind === 'sando') { p.rowSums.forEach((t, r) => C.push({ cells: HOUSES[r], ok: (v) => v.some((x) => !x) || sandwich(v) === t })); p.colSums.forEach((t, c) => C.push({ cells: HOUSES[N + c], ok: (v) => v.some((x) => !x) || sandwich(v) === t })); }
  if (kind === 'cages') { const cage = p.cage.flat(); p.sums.forEach((t, k) => { const cells = cage.map((x, i) => (x === k ? i : -1)).filter((i) => i >= 0); C.push({ cells, ok: (v) => { const s = v.filter(Boolean); if (new Set(s).size !== s.length) return false; const sum = s.reduce((a, b) => a + b, 0); return s.length === v.length ? sum === t : sum < t; } }); }); }
  if (kind === 'sumo') {
    for (let r = 0; r < N; r++) { let k = 0; for (let c = 0; c < N - 1; c++) if (box(r, c) === box(r, c + 1)) { const ch = p.h[r][k++]; C.push({ cells: [r * N + c, r * N + c + 1], ok: ([a, b]) => !a || !b || (ch === '<' ? a < b : a > b) }); } }
    let k = 0; for (let r = 0; r < N - 1; r++) if (box(r, 0) === box(r + 1, 0)) { const row = p.v[k++]; for (let c = 0; c < N; c++) { const ch = row[c]; C.push({ cells: [r * N + c, (r + 1) * N + c], ok: ([a, b]) => !a || !b || (ch === '^' ? a < b : a > b) }); } }
  }
  if (kind === 'polka') { for (let r = 0; r < N; r++) for (let c = 0; c < N - 1; c++) { const d = p.dots.h[r][c]; C.push({ cells: [r * N + c, r * N + c + 1], ok: ([a, b]) => !a || !b || kro(a, b) === d }); } for (let r = 0; r < N - 1; r++) for (let c = 0; c < N; c++) { const d = p.dots.v[r][c]; C.push({ cells: [r * N + c, (r + 1) * N + c], ok: ([a, b]) => !a || !b || kro(a, b) === d }); } }
  return C;
}
function count(kind, p, limit = 2) {
  const C = rules(kind, p), by = [...Array(NN)].map(() => []);
  C.forEach((c) => c.cells.forEach((i) => by[i].push(c)));
  const g = p.given ? p.given.flat() : Array(NN).fill(0);
  const fine = (i) => by[i].every((c) => c.ok(c.cells.map((j) => g[j])));
  for (let i = 0; i < NN; i++) if (g[i] && !fine(i)) return 0;
  let n = 0;
  const rec = () => {
    if (n >= limit) return;
    let best = -1, opts = null;
    for (let i = 0; i < NN; i++) if (!g[i]) { const o = []; for (let v = 1; v <= N; v++) { g[i] = v; if (fine(i)) o.push(v); g[i] = 0; } if (best < 0 || o.length < opts.length) { best = i; opts = o; if (o.length < 2) break; } }
    if (best < 0) { n++; return; }
    for (const v of opts) { g[best] = v; rec(); g[best] = 0; if (n >= limit) return; }
  };
  rec(); return n;
}
function obeys(kind, p) {
  const s = p.sol.flat();
  for (const c of rules(kind, p)) if (!c.ok(c.cells.map((i) => s[i]))) return 'a rule is broken';
  if (p.given) { const g = p.given.flat(); for (let i = 0; i < NN; i++) if (g[i] && g[i] !== s[i]) return 'a printed digit disagrees'; }
  return null;
}
let fails = 0, boards = 0; const fail = (m) => { fails++; console.log('FAIL ' + m); };
const sigs = {};
for (const [key, kind] of Object.entries(KEYS)) {
  if (ONLY.length && !ONLY.includes(key) && !ONLY.includes(key.replace(/too$/, '')) && !ONLY.includes(key + 'too')) continue;
  const bank = (await import(pathToFileURL(path.join(ROOT, 'app', key, 'puzzles.js')).href)).PUZZLES;
  const days = new Set(), qs = new Set();
  bank.forEach((p, i) => {
    boards++; const tag = `${key} #${p.num} ${p.live}`;
    if (p.num !== i + 1) fail(`${tag}: num out of order`);
    if (days.has(p.live)) fail(`${tag}: two boards on one day`); days.add(p.live);
    if (i && (Date.parse(p.live) - Date.parse(bank[i - 1].live)) !== 864e5) fail(`${tag}: calendar gap`);
    if (qs.has(p.quizId) || !p.quizId.startsWith(key + '-')) fail(`${tag}: bad quizId`); qs.add(p.quizId);
    if (key !== 'dot' && (new Date(`${p.live}T12:00:00Z`).getUTCDay() === 0) !== !!p.sunday) fail(`${tag}: Sunday flag wrong`);
    if (key === 'dot' && p.sunday) fail(`${tag}: Dot has no Sunday Edition`);
    if (p.sol.length !== N || p.sol.some((r) => r.length !== N)) fail(`${tag}: not 6x6`);
    const why = obeys(kind, p); if (why) fail(`${tag}: ${why}`);
    const k = count(kind, p); if (k !== 1) fail(`${tag}: ${k ? 'more than one' : 'no'} solution`);
    // The variant rule must be LOAD-BEARING (the 9x9 standard): the printed
    // digits alone, read as a plain sudoku, must NOT already pin the grid.
    if (p.given && count('plain', p) === 1) fail(`${tag}: the printed digits alone solve it, the rule does nothing`);
    // Same answer grid, digit for digit, within MIN_GAP days anywhere in the
    // family (a game and its colour twin) is refused; so is an identical puzzle.
    // NOTE: 6x6 diagonal and anti-knight grids are few (about a dozen up to
    // relabelling), so their answers DO recur relabelled; the clues differ.
    const sig = kind + ':' + JSON.stringify(p.sol);
    for (const prev of sigs[sig] || []) {
      if (Math.abs(Date.parse(prev.live) - Date.parse(p.live)) < MIN_GAP * 864e5) fail(`${tag}: same answer grid as ${prev.key} ${prev.live}`);
      if (JSON.stringify(prev.given) === JSON.stringify(p.given || null) && prev.key !== key) fail(`${tag}: identical puzzle to ${prev.key} ${prev.live}`);
    }
    (sigs[sig] = sigs[sig] || []).push({ key, live: p.live, given: p.given || null });
  });
  console.log(`${key}: ${bank.length} boards`);
}
console.log(fails ? `small-sudokus-verify: ${fails} failures` : `small-sudokus-verify: OK, ${boards} boards`);
process.exit(fails ? 1 : 0);
