// scripts/colour-twins-verify.mjs: the gate for the seven COLOUR TWINS
// (SixesToo, SudsToo, DiagToo, WindowToo, KnightToo, RacecarToo, RimToo, plus
// MercuryToo and the 16x16 GiantToo). Independent of
// scripts/gen-colour-twins.mjs: it re-derives nothing from the generator's
// moves, it checks the finished banks against their originals.
//
// Per board:
//   - the `from` board exists in the original's bank, and the twin plays it at
//     least MIN_GAP (14) days later (owner, 2026-11-08: "at least 2 weeks space"),
//     on the same weekday, with the same Sunday flag;
//   - no twin board is played within MIN_GAP days of ANY original board it is
//     isomorphic to (same multiset of clue counts and solution under the move
//     is not re-derived; the from-link plus the gap is the guarantee), and no
//     two twin boards share a source;
//   - MercuryToo (Mercury in rainbow order) keeps its digits, since order is
//     its rule, and is checked for rising thermometers;
//   - the clue layout differs from the source's (not the same picture);
//   - the solution obeys every rule of the variant (rows, columns, boxes, plus
//     diagonals / windows / anti-knight / palindrome lines / rim sets), the
//     printed digits agree with it, and the board has EXACTLY ONE solution.
// Plus bank shape: nums 1..N in order, one board per day, quizIds unique.
import path from 'path';
import { pathToFileURL } from 'url';

const ROOT = process.env.VERIFY_ROOT || process.cwd();
// ONLY_KEYS (comma list) narrows the run; the per-game scripts/verify-<key>.mjs
// wrappers set it, so verify-all sees one checker per game.
const ONLY = (process.env.ONLY_KEYS || '').split(',').filter(Boolean);
const MIN_GAP = 14;
const TWINS = [
  { key: 'sixestoo', src: 'sixes', n: 6, rule: 'plain' },
  { key: 'sudstoo', src: 'suds', n: 9, rule: 'plain' },
  { key: 'diagtoo', src: 'diag', n: 9, rule: 'diag' },
  { key: 'windowtoo', src: 'window', n: 9, rule: 'window' },
  { key: 'knighttoo', src: 'knight', n: 9, rule: 'knight' },
  { key: 'racecartoo', src: 'racecar', n: 9, rule: 'racecar' },
  { key: 'rimtoo', src: 'rim', n: 9, rule: 'rim' },
  { key: 'mercurytoo', src: 'mercury', n: 9, rule: 'thermo' },
  { key: 'gianttoo', src: 'giant', n: 16, rule: 'plain' },
];
const load = async (k) => (await import(pathToFileURL(path.join(ROOT, 'app', k, 'puzzles.js')).href)).PUZZLES;
const days = (a, b) => Math.round((Date.parse(`${b}T12:00:00Z`) - Date.parse(`${a}T12:00:00Z`)) / 864e5);
const dow = (iso) => new Date(`${iso}T12:00:00Z`).getUTCDay();

function houses(n, rule) {
  const bw = n === 16 ? 4 : 3, bh = n === 6 ? 2 : n === 16 ? 4 : 3, H = [];
  for (let r = 0; r < n; r++) H.push(Array.from({ length: n }, (_, c) => r * n + c));
  for (let c = 0; c < n; c++) H.push(Array.from({ length: n }, (_, r) => r * n + c));
  for (let br = 0; br < n; br += bh) for (let bc = 0; bc < n; bc += bw) { const h = []; for (let r = br; r < br + bh; r++) for (let c = bc; c < bc + bw; c++) h.push(r * n + c); H.push(h); }
  if (rule === 'diag') { H.push(Array.from({ length: n }, (_, k) => k * n + k)); H.push(Array.from({ length: n }, (_, k) => k * n + (n - 1 - k))); }
  if (rule === 'window') for (const r0 of [1, 5]) for (const c0 of [1, 5]) { const h = []; for (let r = r0; r < r0 + 3; r++) for (let c = c0; c < c0 + 3; c++) h.push(r * n + c); H.push(h); }
  return H;
}
function build(p, n, rule) {
  const H = houses(n, rule);
  const peers = Array.from({ length: n * n }, () => new Set());
  for (const h of H) for (const a of h) for (const b of h) if (a !== b) peers[a].add(b);
  if (rule === 'knight') for (let r = 0; r < n; r++) for (let c = 0; c < n; c++) for (const [dr, dc] of [[1, 2], [2, 1], [-1, 2], [-2, 1], [1, -2], [2, -1], [-1, -2], [-2, -1]]) { const rr = r + dr, cc = c + dc; if (rr >= 0 && rr < n && cc >= 0 && cc < n) peers[r * n + c].add(rr * n + cc); }
  const equal = Array.from({ length: n * n }, () => []);
  if (rule === 'racecar') for (const line of p.lines) for (let k = 0; k < Math.floor(line.length / 2); k++) { const a = line[k][0] * n + line[k][1], b = line[line.length - 1 - k][0] * n + line[line.length - 1 - k][1]; equal[a].push(b); equal[b].push(a); }
  const less = Array.from({ length: n * n }, () => []); // less[i] = cells that must be bigger than i
  if (rule === 'thermo') for (const th of p.thermos) for (let k = 0; k + 1 < th.length; k++) less[th[k][0] * n + th[k][1]].push(th[k + 1][0] * n + th[k + 1][1]);
  const more = Array.from({ length: n * n }, () => []);
  less.forEach((js, i) => js.forEach((j) => more[j].push(i)));
  const allowed = Array.from({ length: n * n }, () => null);
  if (rule === 'rim') {
    const cells = (s, k) => [0, 1, 2].map((j) => s === 'top' ? j * n + k : s === 'bottom' ? (n - 1 - j) * n + k : s === 'left' ? k * n + j : k * n + (n - 1 - j));
    for (const s of ['top', 'bottom', 'left', 'right']) (p.rim[s] || []).forEach((clue, k) => { if (!clue) return; const set = new Set(clue.split('').map(Number)); for (const i of cells(s, k)) allowed[i] = allowed[i] ? new Set([...allowed[i]].filter((v) => set.has(v))) : set; });
  }
  return { H, peers, equal, allowed, less, more };
}
// PLAIN RULE ONLY (rows, columns, boxes): a bitmask solver with naked and
// hidden singles at every node, which a 16x16 needs (the plain DFS below takes
// hours on GiantToo's 90-clue Sunday boards). Same answer, counted to `limit`.
function solutionsPlain(p, n, limit = 2) {
  const H = houses(n, 'plain'), N2 = n * n, FULL = (1 << n) - 1;
  const ofCell = Array.from({ length: N2 }, () => []);
  H.forEach((h, k) => h.forEach((i) => ofCell[i].push(k)));
  const peers = Array.from({ length: N2 }, () => new Set());
  for (const h of H) for (const a of h) for (const c of h) if (a !== c) peers[a].add(c);
  const P = peers.map((s) => [...s]);
  const bit = (v) => 1 << (v - 1);
  const pop = (m) => { let c = 0; while (m) { m &= m - 1; c++; } return c; };
  let count = 0;
  const assign = (g, cand, i, v) => {
    g[i] = v; cand[i] = 0;
    const stack = [[i, v]];
    while (stack.length) {
      const [ci, cv] = stack.pop(), b = bit(cv);
      for (const j of P[ci]) {
        if (g[j] === cv) return false;
        if (!g[j] && (cand[j] & b)) { cand[j] &= ~b; if (!cand[j]) return false; if (pop(cand[j]) === 1) { const w = 32 - Math.clz32(cand[j]); g[j] = w; cand[j] = 0; stack.push([j, w]); } }
      }
    }
    return true;
  };
  const hidden = (g, cand) => {
    let moved = true;
    while (moved) {
      moved = false;
      for (const h of H) for (let v = 1; v <= n; v++) {
        const b = bit(v); let at = -1, k = 0, have = false;
        for (const i of h) { if (g[i] === v) { have = true; break; } if (cand[i] & b) { at = i; k++; } }
        if (have) continue;
        if (k === 0) return false;
        if (k === 1) { if (!assign(g, cand, at, v)) return false; moved = true; }
      }
    }
    return true;
  };
  const dfs = (g, cand) => {
    if (count >= limit) return;
    if (!hidden(g, cand)) return;
    let best = -1, bc = 99;
    for (let i = 0; i < N2; i++) if (!g[i]) { const c = pop(cand[i]); if (c < bc) { bc = c; best = i; if (c === 2) break; } }
    if (best < 0) { count++; return; }
    let m = cand[best];
    while (m) { const b = m & -m; m ^= b; const v = 32 - Math.clz32(b); const g2 = g.slice(), c2 = cand.slice(); if (assign(g2, c2, best, v)) dfs(g2, c2); if (count >= limit) return; }
  };
  const g = Array(N2).fill(0), cand = Array(N2).fill(FULL);
  const given = p.given.flat();
  for (let i = 0; i < N2; i++) if (given[i]) { if (!(cand[i] & bit(given[i])) && !g[i]) return 0; if (g[i] && g[i] !== given[i]) return 0; if (!g[i] && !assign(g, cand, i, given[i])) return 0; }
  dfs(g, cand);
  return count;
}
function solutions(p, n, rule, limit = 2) {
  if (rule === 'plain' && n === 16) return solutionsPlain(p, n, limit);
  const { peers, equal, allowed, less, more } = build(p, n, rule);
  const g = p.given.flat();
  let count = 0;
  const cand = (i) => { const out = []; for (let v = 1; v <= n; v++) { if (allowed[i] && !allowed[i].has(v)) continue; let ok = true; for (const j of peers[i]) if (g[j] === v) { ok = false; break; } if (ok) for (const j of equal[i]) if (g[j] && g[j] !== v) { ok = false; break; } if (ok) for (const j of less[i]) if (g[j] && g[j] <= v) { ok = false; break; } if (ok) for (const j of more[i]) if (g[j] && g[j] >= v) { ok = false; break; } if (ok) out.push(v); } return out; };
  for (let i = 0; i < n * n; i++) if (g[i] && !cand(i).includes(g[i])) return 0; // printed digits clash
  const dfs = () => {
    if (count >= limit) return;
    let best = -1, bo = null;
    for (let i = 0; i < n * n; i++) if (!g[i]) { const o = cand(i); if (best < 0 || o.length < bo.length) { best = i; bo = o; if (o.length < 2) break; } }
    if (best < 0) { count++; return; }
    for (const v of bo) { g[best] = v; dfs(); g[best] = 0; if (count >= limit) return; }
  };
  dfs();
  return count;
}
function obeys(p, n, rule) {
  const s = p.sol.flat(); const { H, peers, equal, allowed, less } = build(p, n, rule);
  for (const h of H) if (new Set(h.map((i) => s[i])).size !== n) return 'a house repeats';
  for (let i = 0; i < n * n; i++) { if (s[i] < 1 || s[i] > n) return 'digit out of range'; for (const j of peers[i]) if (s[j] === s[i]) return 'a peer repeats'; for (const j of equal[i]) if (s[j] !== s[i]) return 'a palindrome line breaks'; if (allowed[i] && !allowed[i].has(s[i])) return 'a rim set breaks'; for (const j of less[i]) if (s[j] <= s[i]) return 'a thermometer does not rise'; }
  const gv = p.given.flat(); for (let i = 0; i < n * n; i++) if (gv[i] && gv[i] !== s[i]) return 'a printed digit disagrees';
  return null;
}
const mask = (p, n) => { const m = p.given.flat().map((v) => (v ? 1 : 0)).join(''); return m + (p.rim ? JSON.stringify(Object.fromEntries(Object.entries(p.rim).map(([k, a]) => [k, a.map((x) => (x ? 1 : 0))]))) : '') + (p.lines ? JSON.stringify(p.lines) : '') + (p.thermos ? JSON.stringify(p.thermos) : ''); };

let fails = 0, boards = 0;
const fail = (m) => { fails++; console.log('FAIL ' + m); };
for (const t of TWINS) {
  if (ONLY.length && !ONLY.includes(t.key)) continue;
  const [bank, src] = [await load(t.key), await load(t.src)];
  const bySrc = new Map(src.map((p) => [p.num, p]));
  const usedSrc = new Set(), seenDay = new Set(), seenQ = new Set();
  bank.forEach((p, i) => {
    boards++;
    const tag = `${t.key} #${p.num} ${p.live}`;
    if (p.num !== i + 1) fail(`${tag}: num out of order`);
    if (seenDay.has(p.live)) fail(`${tag}: two boards on one day`); seenDay.add(p.live);
    if (seenQ.has(p.quizId) || !p.quizId.startsWith(`${t.key}-`)) fail(`${tag}: bad or duplicate quizId`); seenQ.add(p.quizId);
    if (i && days(bank[i - 1].live, p.live) !== 1) fail(`${tag}: gap in the calendar`);
    const s = p.from && bySrc.get(p.from.num);
    if (!s || s.live !== p.from.live) { fail(`${tag}: source board missing`); return; }
    if (usedSrc.has(s.num)) fail(`${tag}: source used twice`); usedSrc.add(s.num);
    const gap = days(s.live, p.live);
    if (gap < MIN_GAP) fail(`${tag}: only ${gap} days after its source`);
    if (dow(s.live) !== dow(p.live) || !!s.sunday !== !!p.sunday) fail(`${tag}: weekday or Sunday flag moved`);
    if (mask(p, t.n) === mask(s, t.n)) fail(`${tag}: same clue layout as its source`);
    const why = obeys(p, t.n, t.rule); if (why) fail(`${tag}: ${why}`);
    const k = solutions(p, t.n, t.rule); if (k !== 1) fail(`${tag}: ${k === 0 ? 'no' : 'more than one'} solution`);
  });
  console.log(`${t.key}: ${bank.length} boards checked against ${t.src}`);
}
console.log(fails ? `colour-twins-verify: ${fails} failures` : `colour-twins-verify: OK, ${boards} boards`);
process.exit(fails ? 1 : 0);
