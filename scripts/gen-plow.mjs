// scripts/gen-plow.mjs: deals the Plow bank (app/plow/puzzles.js), one snowed-in
// town a day. Plow is the winter sibling of Mop and Mow (owner, 2026-11-17:
// "mock up plow that is similar to mop / mow format but is plowing snowfilled
// streets", then "Push to live now"): plow every street of a town exactly once,
// corner to corner, from the depot (In) to the salt barn (Out).
//
//   node scripts/gen-plow.mjs [--until 2026-12-31]
// Append only: rows already in the file are kept byte for byte, and new days are
// dealt after the last one. Checked by scripts/verify-plow.mjs.
//
// THE RULES OF A TOWN
//   - corners on a loose grid, streets along it, a few diagonals cutting a block
//     corner to corner (one per block), a few gentle bends, cul-de-sacs (a loop
//     on a boundary corner, plowed in one move) from Thursday, and from Friday a
//     river across the middle that only the bridges cross
//   - the depot (In) and the barn (Out) are the ONLY corners with an odd number
//     of streets, and every street is joined up: that is exactly when one trail
//     plows every street once (Euler), so every town is solvable. Many trails
//     exist, so the clock decides the board.
//   - a river with an odd number of bridges puts the barn across it from the
//     depot; an even number keeps them on the same bank
//   - parity is repaired along paths that never use a bridge, so the bridges dealt
//     are the bridges kept
//   - streets never cross except at a corner; the art keeps houses off the roads
// THE WEEK (owner rule for Mop and Mow, 2026-11-17: Monday is the easy day and
// every later day is harder)
//   Mon gentle   4x3 corners, 1 diagonal                       15-19 streets
//   Tue gentle   5x3, 2 diagonals                              19-24
//   Wed moderate 5x4, 2 diagonals, bends                       25-30
//   Thu moderate 6x4, 2 diagonals, 1 cul-de-sac                30-36
//   Fri tough    6x5, river with 2 bridges, 1 cul-de-sac       34-42
//   Sat tough    6x5, river with 3 bridges, 2 cul-de-sacs      40-48
//   Sun sunday   6x6, river with 3 bridges, 3 cul-de-sacs      50-58  (the Sunday Edition)
// The launch day, 2026-11-17, is Maple Hill and the first Sunday, 2026-11-22, is
// Old Town: the two towns of the mockup the owner played and sent live.
import fs from 'fs';
import { eulerTrail, add, mul, len, sub, COURT_STEM, COURT_R } from '../lib/plow-engine.js';

const FILE = new URL('../app/plow/puzzles.js', import.meta.url);
const FIRST = '2026-11-17';
const arg = (k, d) => { const i = process.argv.indexOf(k); return i > 0 ? process.argv[i + 1] : d; };
const UNTIL = arg('--until', '2026-12-31');

export const SPEC = {
  1: { band: 'gentle', cols: 4, rows: 3, diag: 1, bends: 2, courts: 0, lo: 15, hi: 19 },
  2: { band: 'gentle', cols: 5, rows: 3, diag: 2, bends: 2, courts: 0, lo: 19, hi: 24 },
  3: { band: 'moderate', cols: 5, rows: 4, diag: 2, bends: 3, courts: 0, lo: 25, hi: 30 },
  4: { band: 'moderate', cols: 6, rows: 4, diag: 2, bends: 3, courts: 1, lo: 30, hi: 36 },
  5: { band: 'tough', cols: 6, rows: 5, north: 3, bridges: 2, diag: 2, bends: 3, courts: 1, lo: 34, hi: 42 },
  6: { band: 'tough', cols: 6, rows: 5, north: 2, bridges: 3, diag: 3, bends: 3, courts: 2, lo: 40, hi: 48 },
  0: { band: 'sunday', cols: 6, rows: 6, north: 3, bridges: 3, diag: 4, bends: 4, courts: 3, lo: 50, hi: 58 },
};

const TOWNS = ['Birch Hollow', 'Cedar Falls', 'Pine Ridge', 'Willow Bend', 'Elm Grove', 'Fox Run', 'Oak Hollow', 'Spruce Corner', 'Aspen Glen', 'Cobble Hill', 'Linden Park', 'Holly Ridge', 'Juniper Green', 'Larch Valley', 'Mill Creek', 'Stone Gate', 'Frost Hollow', 'Kettle Pond', 'Hemlock Heights', 'Sugar Hill', 'Chestnut Square', 'Lantern Hill', 'Ashford', 'Wren Hollow', 'Bramble Hill', 'Ridgefield', 'Cooper Mills', 'North Haven', 'Fairhaven', 'Glenwood', 'Hillcrest', 'Meadowbrook', 'Westbrook', 'Kingsley', 'Briarwood', 'Thornbury', 'Alder Creek', 'Sleepy Hollow', 'Bellwood', 'Marble Falls'];
const SUNDAYS = ['Kingsbridge', 'River Falls', 'Millbrook', 'Three Bridges', 'Ferry Crossing', 'Stonebridge', 'Weir Falls', 'Harbor Town'];
const RIVERS = ['STONY RIVER', 'BIRCH RIVER', 'OTTER CREEK', 'SWIFT RIVER', 'CEDAR RIVER', 'FOX RIVER', 'KETTLE RIVER', 'MILL RIVER'];
const ROWS = ['HILL ST', 'MAIN ST', 'SCHOOL ST', 'CHURCH ST', 'PARK AVE', 'HIGH ST', 'UNION ST', 'CENTER ST', 'PEARL ST', 'SPRING ST', 'BROAD ST', 'GROVE ST', 'LAKE ST', 'WINTER ST', 'ASH ST', 'CEDAR ST', 'PINE ST', 'WALNUT ST', 'CHESTNUT ST', 'MAPLE AVE', 'ELM ST', 'BIRCH LN'];
const COLS = ['OAK ST', 'EAST AVE', 'WEST AVE', 'RIDGE RD', 'NORTH ST', 'FERRY RD', '1ST AVE', '2ND AVE', '3RD AVE', 'BANK ST', 'COURT ST'];
const DIAGS = ['OLD POST RD', 'OLD MILL RD', 'TURNPIKE', 'CANAL ST', 'DEPOT RD', 'STAGE RD', 'BOW ST', 'KINGS HWY'];
const COURTS = ['SUMMIT CT', 'HOLLY CT', 'ROBIN CT', 'FERN CT', 'JUNIPER CT', 'LARK CT', 'IVY CT', 'DOVE CT', 'WREN CT', 'BIRCH CT'];

function rng(seed) { let a = seed >>> 0; return () => { a |= 0; a = (a + 0x6D2B79F5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
const hash = (s) => { let h = 2166136261; for (const ch of s) h = Math.imul(h ^ ch.charCodeAt(0), 16777619); return h >>> 0; };
const pick = (r, a) => a[Math.floor(r() * a.length)];
const shuffle = (r, a) => { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
const key = (a, b) => (a < b ? `${a}|${b}` : `${b}|${a}`);
const DOW_DATE = (iso) => new Date(`${iso}T12:00:00Z`).getUTCDay();

// ---------- the two hand-made towns from the mockup ----------
function grid(cols, rows, r0) {
  const E = [];
  for (let r = r0; r < r0 + rows; r++) for (let c = 0; c < cols - 1; c++) E.push([`${c},${r}`, `${c + 1},${r}`]);
  for (let r = r0; r < r0 + rows - 1; r++) for (let c = 0; c < cols; c++) E.push([`${c},${r}`, `${c},${r + 1}`]);
  return E;
}
const without = (E, rm) => E.filter(([a, b]) => !rm.some(([x, y]) => (x === a && y === b) || (x === b && y === a)));
const labelsByKey = (edges, L) => L.map(({ e, ...l }) => ({ e: edges.findIndex((x) => `${x.a}|${x.b}` === e), ...l }));

function mapleHill() {
  const xs = [0, 230, 450, 660], ys = [0, 190, 380], nodes = {};
  xs.forEach((x, c) => ys.forEach((y, r) => { nodes[`${c},${r}`] = [x, y]; }));
  const E = without(grid(4, 3, 0), [['1,2', '2,2']]).concat([['0,1', '1,0']]);
  const opts = { '3,1|3,2': { bend: 26 }, '0,2|1,2': { bend: -14 } };
  const edges = E.map(([a, b]) => ({ a, b, ...(opts[`${a}|${b}`] || {}) }));
  return {
    town: 'Maple Hill', nodes, edges, start: '2,0', startDir: [0, -1], end: '3,1', endDir: [1, 0],
    pad: { l: 140, r: 215, t: 170, b: 140 }, seed: 11,
    labels: labelsByKey(edges, [{ e: '0,0|1,0', side: -1, t: 'MAPLE AVE' }, { e: '2,1|3,1', side: -1, t: 'ELM ST' }, { e: '2,2|3,2', side: 1, t: 'BIRCH LN' }, { e: '0,1|1,0', side: 1, t: 'OLD MILL RD', at: 0.5 }, { e: '0,1|0,2', side: -1, t: 'OAK ST' }]),
    hoods: [{ x: 340, y: 236, t: 'MAPLE PARK', s: 0.8 }],
    zones: [[252, 212, 178, 330]],
    deco: [['hill', 340, 420, 92, 54], ['track', 'M300 400q20 30 8 70M340 392q8 34 0 80M378 402q-14 30 -6 70'], ['sled', 308, 458, '#c0392b', -8], ['sled', 340, 466, '#2e86c1', 0],
      ['rink', 340, 300, 62, 34], ['snowman', 282, 352], ['snowman', 410, 476], ['bench', 388, 240, 22, 6], ['bench', 264, 350, 6, 22],
      ...[[266, 290], [420, 290], [428, 362], [262, 410], [420, 420], [290, 500], [395, 510]].map(([x, y], i) => ['pine', x, y, 17 + (i % 3) * 3, i])],
  };
}
function oldTown() {
  const xs = [0, 190, 380, 570, 760, 950], ys = [0, 170, 340, 560, 730, 900];
  const jit = { '0,3': [0, 6], '1,3': [4, -4], '2,3': [-6, 8], '4,3': [8, 4], '5,3': [0, -6], '0,4': [0, 10], '1,4': [-8, 4], '2,4': [6, -6], '3,4': [-4, 10], '5,4': [6, 6], '0,5': [0, -4], '1,5': [6, 8], '2,5': [-6, 0], '3,5': [8, -6], '4,5': [0, 10] };
  const nodes = {};
  xs.forEach((x, c) => ys.forEach((y, r) => { const j = jit[`${c},${r}`] || [0, 0]; nodes[`${c},${r}`] = [x + j[0], y + j[1]]; }));
  let E = grid(6, 3, 0).concat(grid(6, 3, 3));
  E.push(['1,2', '1,3'], ['3,2', '3,3'], ['5,2', '5,3'], ['0,0', '1,1'], ['1,1', '2,2'], ['3,3', '4,4'], ['4,4', '5,5']);
  E = without(E, [['0,0', '0,1'], ['1,0', '2,0'], ['3,0', '4,0'], ['4,2', '5,2'], ['1,5', '2,5'], ['3,5', '4,5'], ['2,3', '3,3'], ['4,3', '5,3'], ['5,4', '5,5']]);
  const opts = { '1,2|1,3': { bridge: 1 }, '3,2|3,3': { bridge: 1 }, '5,2|5,3': { bridge: 1 }, '0,3|1,3': { bend: 10 }, '0,4|1,4': { bend: 12 }, '1,4|1,5': { bend: -12 }, '3,4|3,5': { bend: 12 }, '4,1|4,2': { bend: -16 } };
  const edges = E.map(([a, b]) => ({ a, b, ...(opts[`${a}|${b}`] || {}) }));
  edges.push({ a: '2,0', b: '2,0', court: [0, -1], name: 'SUMMIT CT' }, { a: '0,2', b: '0,2', court: [-1, 0], name: 'BIRCH CT' }, { a: '2,5', b: '2,5', court: [0, 1], name: 'WREN CT' });
  return {
    town: 'Old Town', nodes, edges, start: '5,1', startDir: [1, 0], end: '0,4', endDir: [-1, 0],
    pad: { l: 190, r: 190, t: 170, b: 170 }, river: { y: 450, hw: 54 }, seed: 7,
    labels: labelsByKey(edges, [{ e: '0,0|1,0', side: -1, t: 'HILL ST' }, { e: '2,1|3,1', side: -1, t: 'MAIN ST' }, { e: '3,2|4,2', side: -1, t: 'RIVER RD' }, { e: '1,1|2,2', side: 1, t: 'OLD POST RD', at: 0.5 }, { e: '0,3|1,3', side: 1, t: 'WATER ST' }, { e: '3,4|4,4', side: 1, t: 'MARKET ST' }, { e: '4,4|5,5', side: -1, t: 'CANAL ST', at: 0.45 }, { e: '5,0|5,1', side: 1, t: 'EAST AVE' }]),
    hoods: [{ x: 120, y: -112, t: 'NORTH HILL' }, { x: 790, y: 1012, t: 'OLD TOWN' }, { x: 380, y: 452, t: 'MILL RIVER', water: 1 }],
    zones: [[205, -165, 150, 315], [588, -165, 158, 315], [395, 572, 158, 145], [782, 572, 150, 140], [210, 585, 140, 125], [20, 760, 150, 125]],
    shops: [[-10, 690, 400, 80]],
    deco: [
      ['bldg', 222, 30, 118, 70, '#7d6b5d', 'SCHOOL'], ['field', 226, -128, 112, 132], ['snowman', 258, -98], ['snowman', 312, -20],
      ['hill', 668, -10, 72, 100], ['track', 'M650 -60q-30 60 -18 150M672 -54q8 70 -6 150M694 -60q34 50 20 140'], ['sled', 631, 76, '#c0392b', 0], ['sled', 667, 94, '#16a085', 0], ['sled', 711, 72, '#d4ac0d', 0], ['label', [668, -150], 'SLED HILL', 12],
      ...[[612, -130], [726, -128], [606, 40], [738, 30], [620, 128], [728, 126]].map(([x, y], i) => ['pine', x, y, 18, i]),
      ['rink', 476, 640, 58, 38], ['snowman', 418, 600], ['snowman', 530, 696], ...[[410, 690], [540, 590], [470, 708]].map(([x, y], i) => ['pine', x, y, 17, i + 2]), ['label', [476, 588], 'MILL POND PARK', 11],
      ['bldg', 800, 600, 116, 58, '#7a5a43', 'OLD MILL'], ['wheel', 858, 590], ['bare', 820, 690, 20, 1], ['pine', 905, 694, 18, 2],
      ['plaza', 218, 594, 124, 104], ['bldg', 240, 612, 80, 56, '#5d6f82', ''], ['cupola', 280, 640], ['label', [280, 684], 'TOWN HALL', 10], ['pine', 232, 606, 12, 1], ['pine', 330, 606, 12, 2],
      ['church', 92, 820],
    ],
  };
}

// ---------- a dealt town ----------
const XS = 205, YS = 182, GAP = 230;
function deal(spec, seed, names) {
  const r = rng(seed);
  const { cols, rows } = spec, north = spec.north || rows;
  const river = !!spec.bridges;
  const nodes = {}, side = {};
  for (let c = 0; c < cols; c++) for (let rr = 0; rr < rows; rr++) {
    const y = rr * YS + (river && rr >= north ? GAP - YS : 0);
    nodes[`${c},${rr}`] = [c * XS, y];
    side[`${c},${rr}`] = river && rr >= north ? 'S' : 'N';
  }
  const riverMid = river ? (north - 1) * YS + GAP / 2 : null;
  // candidate streets
  const cand = new Map();
  const addC = (a, b, o = {}) => cand.set(key(a, b), { a, b, ...o });
  for (let rr = 0; rr < rows; rr++) for (let c = 0; c < cols - 1; c++) addC(`${c},${rr}`, `${c + 1},${rr}`);
  for (let rr = 0; rr < rows - 1; rr++) for (let c = 0; c < cols; c++) if (!(river && rr === north - 1)) addC(`${c},${rr}`, `${c},${rr + 1}`);
  let bridgeCols = [];
  if (river) {
    for (let t = 0; t < 50 && bridgeCols.length !== spec.bridges; t++) {
      bridgeCols = shuffle(r, [...Array(cols).keys()]).slice(0, spec.bridges).sort((a, b) => a - b);
      if (bridgeCols.some((c, i) => i && c - bridgeCols[i - 1] < 2)) bridgeCols = [];
    }
    if (!bridgeCols.length) return null;
    bridgeCols.forEach((c) => addC(`${c},${north - 1}`, `${c},${north}`, { bridge: 1 }));
  }
  // diagonals: one per block, never in the river gap
  const blocks = [];
  for (let rr = 0; rr < rows - 1; rr++) for (let c = 0; c < cols - 1; c++) if (!(river && rr === north - 1)) blocks.push([c, rr]);
  const diagBlocks = shuffle(r, blocks).slice(0, spec.diag);
  const diagSet = new Set(diagBlocks.map(([c, rr]) => `${c},${rr}`));
  diagBlocks.forEach(([c, rr]) => { if (r() < 0.5) addC(`${c},${rr}`, `${c + 1},${rr + 1}`, { diag: 1 }); else addC(`${c + 1},${rr}`, `${c},${rr + 1}`, { diag: 1 }); });
  // the depot and the barn: side-middle corners on the boundary
  const sides = [];
  for (let c = 1; c < cols - 1; c++) { sides.push([`${c},0`, [0, -1]]); sides.push([`${c},${rows - 1}`, [0, 1]]); }
  for (let rr = 1; rr < rows - 1; rr++) { if (river && (rr === north - 1 || rr === north)) continue; sides.push([`0,${rr}`, [-1, 0]]); sides.push([`${cols - 1},${rr}`, [1, 0]]); }
  const startOpts = sides.filter(([n, d]) => side[n] === 'N' && (d[1] === -1 || d[0] === 1));
  const [start, startDir] = pick(r, startOpts);
  const wantSide = river ? (spec.bridges % 2 ? 'S' : 'N') : null;
  const endOpts = sides.filter(([n, d]) => n !== start && (!river || side[n] === wantSide) && (d[0] !== startDir[0] || d[1] !== startDir[1])
    && len(sub(nodes[n], nodes[start])) > (cols * XS) * 0.5);
  if (!endOpts.length) return null;
  const [end, endDir] = pick(r, endOpts);
  // start from every candidate, knock out a few for parks, then repair parity
  const present = new Set(cand.keys());
  const plain = [...cand.keys()].filter((k) => !cand.get(k).bridge && !cand.get(k).diag && !k.split('|').some((n) => n === start || n === end));
  shuffle(r, plain).slice(0, Math.round(plain.length * (0.06 + r() * 0.06))).forEach((k) => present.delete(k));
  const nb = {};
  for (const [k, e] of cand) { if (e.bridge) continue; (nb[e.a] = nb[e.a] || []).push([e.b, k]); (nb[e.b] = nb[e.b] || []).push([e.a, k]); }
  const deg = () => { const d = {}; for (const k of present) { const e = cand.get(k); d[e.a] = (d[e.a] || 0) + 1; d[e.b] = (d[e.b] || 0) + 1; } return d; };
  const want = (n) => (n === start || n === end ? 1 : 0);
  for (let guard = 0; guard < 200; guard++) {
    const d = deg();
    const wrong = Object.keys(nodes).filter((n) => ((d[n] || 0) % 2) !== want(n));
    if (!wrong.length) break;
    const src = wrong[0], targets = new Set(wrong.slice(1));
    const prev = { [src]: null }, q = [src]; let hit = null;
    for (let i = 0; i < q.length && !hit; i++) for (const [m, k] of shuffle(r, nb[q[i]] || [])) { if (m in prev) continue; prev[m] = [q[i], k]; if (targets.has(m)) { hit = m; break; } q.push(m); }
    if (!hit) return null;
    for (let v = hit; prev[v]; v = prev[v][0]) { const k = prev[v][1]; if (present.has(k)) present.delete(k); else present.add(k); }
  }
  const d = deg();
  if (Object.keys(nodes).some((n) => ((d[n] || 0) % 2) !== want(n))) return null;
  if ((d[start] || 0) < 1 || (d[end] || 0) < 1) return null;
  // no dead corners left on the boundary of the map, at most one inside
  const empty = Object.keys(nodes).filter((n) => !d[n]);
  if (empty.length > 1) return null;
  const edges = [...present].map((k) => ({ ...cand.get(k) }));
  if (edges.length < spec.lo || edges.length > spec.hi) return null;
  if (bridgeCols.length && edges.filter((e) => e.bridge).length !== spec.bridges) return null;
  if (Object.values(d).filter((x) => x >= 4).length < Object.keys(nodes).length * 0.25) return null;
  // the corners nobody can reach are dropped from the map
  for (const n of empty) delete nodes[n];
  // bends on a few plain streets
  shuffle(r, edges.filter((e) => !e.bridge && !e.diag && ![e.a, e.b].includes(start) && ![e.a, e.b].includes(end))).slice(0, spec.bends)
    .forEach((e) => { e.bend = Math.round((10 + r() * 8) * (r() < 0.5 ? -1 : 1)); });
  // from Wednesday the corners wander a little (never a bridge corner)
  if (spec.band !== 'gentle') {
    const bridgeEnds = new Set(edges.filter((e) => e.bridge).flatMap((e) => [e.a, e.b]));
    for (const n of Object.keys(nodes)) {
      const j = bridgeEnds.has(n) || n === start || n === end ? [0, 0] : [Math.round((r() - 0.5) * 16), Math.round((r() - 0.5) * 16)];
      nodes[n] = add(nodes[n], j);
    }
  }
  // cul-de-sacs on the boundary, clear of the depot, the barn and each other
  const T = { nodes, edges, start, end, startDir, endDir };
  const depotC = add(nodes[start], mul(startDir, 118)), barnC = add(nodes[end], mul(endDir, 122));
  const courtAt = [];
  for (const [n, u] of shuffle(r, sides.concat([[`0,0`, [0, -1]], [`${cols - 1},0`, [0, -1]], [`0,${rows - 1}`, [0, 1]], [`${cols - 1},${rows - 1}`, [0, 1]]]))) {
    if (courtAt.length >= spec.courts) break;
    if (!nodes[n] || n === start || n === end || !d[n]) continue;
    const C = add(nodes[n], mul(u, COURT_STEM + COURT_R));
    if (len(sub(C, depotC)) < 240 || len(sub(C, barnC)) < 220 || courtAt.some((c) => len(sub(C, c)) < 260)) continue;
    // a court must not run along a street already leaving the corner that way
    if (edges.some((e) => (e.a === n || e.b === n) && (() => { const o = nodes[e.a === n ? e.b : e.a], v = sub(o, nodes[n]), l = len(v) || 1; return (v[0] * u[0] + v[1] * u[1]) / l > 0.5; })())) continue;
    courtAt.push(C);
    edges.push({ a: n, b: n, court: u, name: names.court() });
  }
  if (courtAt.length < spec.courts) return null;
  return { T, river: river ? { y: riverMid, hw: 54 } : null, north, rows, cols, diagSet, depotC, barnC };
}

// parks, the school, the church ... in blocks the streets left open
function furnish(D, r, names) {
  const { T, cols, rows, north } = D;
  const n = (c, rr) => T.nodes[`${c},${rr}`];
  const has = (a, b) => T.edges.some((e) => key(e.a, e.b) === key(a, b));
  const deco = [], zones = [], hoods = [];
  const cells = [];
  for (let rr = 0; rr < rows - 1; rr++) for (let c = 0; c < cols - 1; c++) {
    if (D.river && rr === north - 1) continue;
    if (D.diagSet.has(`${c},${rr}`)) continue;
    const cs = [n(c, rr), n(c + 1, rr), n(c, rr + 1), n(c + 1, rr + 1)];
    if (cs.some((p) => !p)) continue;
    const x0 = Math.max(cs[0][0], cs[2][0]) + 34, x1 = Math.min(cs[1][0], cs[3][0]) - 34;
    const y0 = Math.max(cs[0][1], cs[1][1]) + 34, y1 = Math.min(cs[2][1], cs[3][1]) - 34;
    const open = [[`${c},${rr}`, `${c + 1},${rr}`], [`${c},${rr + 1}`, `${c + 1},${rr + 1}`], [`${c},${rr}`, `${c},${rr + 1}`], [`${c + 1},${rr}`, `${c + 1},${rr + 1}`]].filter(([a, b]) => !has(a, b)).length;
    const bent = T.edges.some((e) => e.bend && [key(`${c},${rr}`, `${c + 1},${rr}`), key(`${c},${rr + 1}`, `${c + 1},${rr + 1}`), key(`${c},${rr}`, `${c},${rr + 1}`), key(`${c + 1},${rr}`, `${c + 1},${rr + 1}`)].includes(key(e.a, e.b)));
    const riverside = D.river && (rr === north - 2 || rr === north);
    const nearDepot = len(sub([(x0 + x1) / 2, (y0 + y1) / 2], D.depotC)) < 150 || len(sub([(x0 + x1) / 2, (y0 + y1) / 2], D.barnC)) < 150;
    if (bent || nearDepot) continue;
    cells.push({ c, rr, x0, y0, x1, y1, open, riverside, w: x1 - x0, h: y1 - y0 });
  }
  const want = { gentle: 1, moderate: 2, tough: 3, sunday: 4 }[D.band];
  const order = shuffle(r, cells).sort((a, b) => b.open - a.open);
  const used = new Set();
  let kinds = shuffle(r, ['park', 'sled', 'school', 'church', 'hall', 'pond']);
  if (D.band === 'gentle') kinds = ['park', ...kinds.filter((k) => k !== 'park')];
  for (const cell of order) {
    if (zones.length >= want) break;
    const { x0, y0, w, h } = cell, cx = x0 + w / 2, cy = y0 + h / 2;
    let kind = cell.riverside && !used.has('mill') && r() < 0.6 ? 'mill' : kinds.find((k) => !used.has(k));
    if (!kind) break;
    if (kind === 'church' && (w < 104 || h < 110)) kind = kinds.find((k) => !used.has(k) && k !== 'church');
    if (!kind) break;
    used.add(kind);
    zones.push([x0 - 6, y0 - 6, w + 12, h + 12]);
    if (kind === 'park') {
      deco.push(['rink', Math.round(cx), Math.round(cy), Math.round(Math.min(w * 0.34, 62)), Math.round(Math.min(h * 0.28, 36))], ['snowman', Math.round(x0 + 14), Math.round(y0 + h - 12)], ['bench', Math.round(x1(cell) - 26), Math.round(y0 + 4), 22, 6]);
      [[x0 + 10, y0 + 12], [x0 + w - 10, y0 + h - 12]].forEach(([x, y], i) => deco.push(['pine', Math.round(x), Math.round(y), 15, i]));
      deco.push(['label', [Math.round(cx), Math.round(y0 - 4)], names.park(), 11]);
    } else if (kind === 'pond') {
      deco.push(['rink', Math.round(cx), Math.round(cy + 6), Math.round(Math.min(w * 0.36, 60)), Math.round(Math.min(h * 0.3, 34))], ['snowman', Math.round(x0 + w - 16), Math.round(y0 + 14)]);
      [[x0 + 10, y0 + 10], [x0 + 12, y0 + h - 10], [x0 + w - 10, y0 + h - 10]].forEach(([x, y], i) => deco.push(['pine', Math.round(x), Math.round(y), 15, i + 3]));
      deco.push(['label', [Math.round(cx), Math.round(y0 - 4)], 'SKATING POND', 11]);
    } else if (kind === 'sled') {
      deco.push(['hill', Math.round(cx), Math.round(cy), Math.round(w * 0.46), Math.round(h * 0.48)], ['track', `M${Math.round(cx - 18)} ${Math.round(cy - h * 0.3)}q-14 ${Math.round(h * 0.3)} -8 ${Math.round(h * 0.62)}M${Math.round(cx + 6)} ${Math.round(cy - h * 0.32)}q6 ${Math.round(h * 0.32)} 0 ${Math.round(h * 0.64)}M${Math.round(cx + 26)} ${Math.round(cy - h * 0.28)}q16 ${Math.round(h * 0.26)} 8 ${Math.round(h * 0.6)}`],
        ['sled', Math.round(cx - 24), Math.round(cy + h * 0.32), '#c0392b', -8], ['sled', Math.round(cx + 6), Math.round(cy + h * 0.36), '#16a085', 0], ['sled', Math.round(cx + 34), Math.round(cy + h * 0.3), '#d4ac0d', 10]);
      deco.push(['label', [Math.round(cx), Math.round(y0 - 4)], 'SLED HILL', 11]);
    } else if (kind === 'school') {
      const bw = Math.min(118, w - 8), bh = Math.min(62, Math.round(h * 0.5));
      deco.push(['bldg', Math.round(cx - bw / 2), Math.round(y0 + 2), bw, bh, '#7d6b5d', 'SCHOOL']);
      if (h - bh > 40) deco.push(['field', Math.round(cx - bw / 2), Math.round(y0 + bh + 12), bw, Math.round(h - bh - 16)], ['snowman', Math.round(cx - bw / 2 + 16), Math.round(y0 + bh + 26)]);
    } else if (kind === 'church') {
      deco.push(['church', Math.round(cx), Math.round(cy)]);
    } else if (kind === 'hall') {
      deco.push(['plaza', Math.round(x0 + 4), Math.round(y0 + 4), Math.round(w - 8), Math.round(h - 8)], ['bldg', Math.round(cx - 40), Math.round(cy - 32), 80, 56, '#5d6f82', ''], ['cupola', Math.round(cx), Math.round(cy - 4)], ['label', [Math.round(cx), Math.round(cy + 40)], 'TOWN HALL', 10]);
      deco.push(['pine', Math.round(x0 + 16), Math.round(y0 + 14), 12, 1], ['pine', Math.round(x0 + w - 16), Math.round(y0 + 14), 12, 2]);
    } else if (kind === 'mill') {
      const top = cell.rr === north; // the south bank: the river is above
      const bw = Math.min(116, w - 8);
      deco.push(['bldg', Math.round(cx - bw / 2), Math.round(top ? y0 + 2 : y0 + h - 60), bw, 58, '#7a5a43', 'OLD MILL']);
      deco.push(['bare', Math.round(x0 + 14), Math.round(top ? y0 + h - 12 : y0 + 12), 18, 1]);
    }
  }
  return { deco, zones, hoods };
}
const x1 = (cell) => cell.x0 + cell.w;

function streetLabels(D, T, r, names, zones, river) {
  const labels = [];
  const inZone = (q) => zones.some((z) => q[0] > z[0] - 10 && q[0] < z[0] + z[2] + 10 && q[1] > z[1] - 10 && q[1] < z[1] + z[3] + 10);
  const ok = (e, sd) => {
    const A = T.nodes[e.a], B = T.nodes[e.b], m = mul(add(A, B), 0.5), d = sub(B, A), l = len(d), n = [-d[1] / l, d[0] / l];
    const c = add(m, mul(n, sd * 30));
    if (inZone(c) || (river && Math.abs(c[1] - river.y) < river.hw + 30)) return false;
    if (labels.some((L) => len(sub(L.c, c)) < 120)) return false;
    return c;
  };
  const max = { gentle: 5, moderate: 6, tough: 7, sunday: 8 }[D.band];
  const tryLabel = (pool, t, at) => {
    for (const e of shuffle(r, pool)) {
      if (e.bend || e.court || len(sub(T.nodes[e.a], T.nodes[e.b])) < 150) continue;
      for (const sd of shuffle(r, [-1, 1])) { const c = ok(e, sd); if (c) { labels.push({ e: T.edges.indexOf(e), side: sd, t, ...(at ? { at } : {}), c }); return; } }
    }
  };
  for (let rr = 0; rr < D.rows && labels.length < max; rr++) {
    const pool = T.edges.filter((e) => !e.court && !e.diag && e.a.split(',')[1] === `${rr}` && e.b.split(',')[1] === `${rr}`);
    tryLabel(pool, names.row());
  }
  T.edges.filter((e) => e.diag).forEach((e) => { if (labels.length < max) tryLabel([e], names.diag(), 0.5); });
  for (const c of shuffle(r, [...Array(D.cols).keys()]).slice(0, 2)) {
    if (labels.length >= max) break;
    const pool = T.edges.filter((e) => !e.court && !e.bridge && e.a.split(',')[0] === `${c}` && e.b.split(',')[0] === `${c}`);
    tryLabel(pool, names.col());
  }
  return labels.map(({ c, ...l }) => l);
}

function padsFor(T) {
  const pts = Object.values(T.nodes), xs = pts.map((p) => p[0]), ys = pts.map((p) => p[1]);
  const X0 = Math.min(...xs), X1 = Math.max(...xs), Y0 = Math.min(...ys), Y1 = Math.max(...ys);
  const pad = { l: 135, r: 135, t: 135, b: 135 };
  const need = (p, extra) => {
    if (p[0] < X0 + 1) pad.l = Math.max(pad.l, X0 - p[0] + extra);
    if (p[0] > X1 - 1) pad.r = Math.max(pad.r, p[0] - X1 + extra);
    if (p[1] < Y0 + 1) pad.t = Math.max(pad.t, Y0 - p[1] + extra);
    if (p[1] > Y1 - 1) pad.b = Math.max(pad.b, p[1] - Y1 + extra);
  };
  need(add(T.nodes[T.start], mul(T.startDir, 118)), 70);
  need(add(T.nodes[T.end], mul(T.endDir, 122)), 85);
  T.edges.filter((e) => e.court).forEach((e) => need(add(T.nodes[e.a], mul(e.court, COURT_STEM + COURT_R)), 90));
  for (const k of Object.keys(pad)) pad[k] = Math.round(pad[k]);
  return pad;
}

function namer(r, used) {
  const take = (pool, tag) => () => { const free = pool.filter((x) => !used.has(tag + x)); const v = pick(r, free.length ? free : pool); used.add(tag + v); return v; };
  return { row: take(ROWS, 'r'), col: take(COLS, 'c'), diag: take(DIAGS, 'd'), court: take(COURTS, 'k'), park: () => pick(r, ['TOWN GREEN', 'COMMON', 'PARK', 'PLAYGROUND']) };
}

export function dealDay(live, num) {
  const dow = DOW_DATE(live), spec = SPEC[dow];
  const base = hash(`plow-${live}`);
  for (let t = 0; t < 4000; t++) {
    const seed = (base + t * 7919) >>> 0, r = rng(seed ^ 0x9e3779b9);
    const used = new Set(), names = namer(r, used);
    const D = deal(spec, seed, names);
    if (!D) continue;
    D.band = spec.band;
    const T = D.T;
    const { deco, zones } = furnish(D, r, names);
    if (zones.length < Math.min(2, { gentle: 1, moderate: 2, tough: 2, sunday: 3 }[spec.band])) continue;
    const town = spec.band === 'sunday' ? SUNDAYS[num % SUNDAYS.length] : TOWNS[(num * 7) % TOWNS.length];
    const out = { town, nodes: T.nodes, edges: T.edges, start: T.start, startDir: T.startDir, end: T.end, endDir: T.endDir, seed: seed % 100000 };
    if (D.river) out.river = { y: Math.round(D.river.y), hw: 54 };
    out.labels = streetLabels(D, T, r, names, zones, D.river);
    out.hoods = [];
    if (D.river) {
      const bx = T.edges.filter((e) => e.bridge).map((e) => T.nodes[e.a][0]).sort((a, b) => a - b);
      const gaps = [[-150, bx[0]], ...bx.slice(1).map((x, i) => [bx[i], x])].sort((a, b) => (b[1] - b[0]) - (a[1] - a[0]));
      out.hoods.push({ x: Math.round((gaps[0][0] + gaps[0][1]) / 2), y: Math.round(D.river.y + 2), t: pick(r, RIVERS), water: 1 });
    }
    out.zones = zones;
    if (spec.band === 'tough' || spec.band === 'sunday') {
      const rowY = D.T.nodes[`1,${D.rows - 2}`] ? D.T.nodes[`1,${D.rows - 2}`][1] : null;
      if (rowY != null) out.shops = [[-10, rowY - 70, 2 * XS + 20, 140]];
    }
    out.deco = deco;
    out.pad = padsFor(out);
    const sol = eulerTrail(out);
    if (!sol) continue;
    return { band: spec.band, ...out, sol };
  }
  throw new Error(`no town dealt for ${live}`);
}

function row(live, num, body) {
  const d = new Date(`${live}T12:00:00Z`);
  const [y, m, dd] = live.split('-');
  const quizId = `plow-${+m}-${+dd}-${y.slice(2)}`;
  const dateLabel = d.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric', timeZone: 'UTC' });
  const out = { num, quizId, live, dateLabel, ...body };
  if (DOW_DATE(live) === 0) out.sunday = true;
  return out;
}

if (process.argv[1] && process.argv[1].endsWith('gen-plow.mjs')) {
  const keep = [];
  if (fs.existsSync(FILE)) for (const l of fs.readFileSync(FILE, 'utf8').split('\n')) if (l.startsWith('  {"num":')) keep.push(l.replace(/,$/, ''));
  let last = keep.length ? JSON.parse(keep[keep.length - 1]) : null;
  let num = last ? last.num : 0;
  let day = last ? new Date(Date.parse(`${last.live}T12:00:00Z`) + 864e5) : new Date(`${FIRST}T12:00:00Z`);
  const rows = keep.slice();
  for (; day.toISOString().slice(0, 10) <= UNTIL; day = new Date(day.getTime() + 864e5)) {
    const live = day.toISOString().slice(0, 10);
    num++;
    let body;
    if (live === '2026-11-17') { const t = mapleHill(); body = { band: 'gentle', ...t, sol: eulerTrail(t) }; }
    else if (live === '2026-11-22') { const t = oldTown(); body = { band: 'sunday', ...t, sol: eulerTrail(t) }; }
    else body = dealDay(live, num);
    if (!body.sol) throw new Error(`${live}: no trail`);
    rows.push(JSON.stringify(row(live, num, body)));
  }
  const head = `// Puzzle data for Plow, the daily plow-every-street snow puzzle.
// GENERATED by scripts/gen-plow.mjs; do not edit by hand. Extend with
// \`node scripts/gen-plow.mjs --until <date>\`, which keeps every row here byte
// for byte. Checked by scripts/verify-plow.mjs. Imported only by the server page,
// which strips days not yet live AND the stored route (\`sol\`) before anything
// reaches a browser. The rules and the week's ramp are in the generator.
//   band     gentle | moderate | tough | sunday        town  the day's name for it
//   nodes    { "c,r": [x, y] } the corners          edges  { a, b } the streets, with
//            bend (a gentle curve), diag (cuts a block), bridge (over the river),
//            court [dx, dy] (a cul-de-sac: a loop on corner a, plowed in one move), name
//   start, startDir  the depot's corner and the way out to it (In)
//   end, endDir      the salt barn's corner and the way out to it (Out)
//   river { y, hw }  labels  [{ e, side, t, at }]  hoods  zones  shops  deco  pad  seed: the art
//   sol      one full route, street indices in order (server only)
//   sunday   the Sunday Edition
export const PUZZLES = [
`;
  fs.writeFileSync(FILE, head + rows.map((x) => `  ${x.trim()}`).join(',\n') + ',\n];\n');
  console.log(`gen-plow: ${rows.length} towns, ${rows.length - keep.length} new, to ${UNTIL}`);
}
