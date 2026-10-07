// lib/dario-engine.js — Dario, the daily side-scroller (Arcade).
//
// Three short levels (The Valley, The Data Center, The Launch Site) played as one
// timed run. The level GEOMETRY is fixed, so every day is beatable by design;
// the day's REMIX is seeded off the quizId: where the bots and robotaxis stand,
// where the GPU chips float, which crates hold chips, which crate holds the
// shield, the rocket timings and the moving-platform phases. Everyone gets the
// same remix on the same day.
//
// Two halves:
//   buildLevels(quizId)  pure, no DOM. The client plays it and
//                        scripts/verify-dario.mjs proves it, so they cannot drift.
//   createDario(opts)    the canvas game itself (browser only).
//
// Scoring (posted by app/dario/DarioClient.jsx):
//   score        10 for a full clear of all three levels, otherwise
//                3 per level cleared plus up to 2 for how far into the next.
//   guessesUsed  a full clear: the run time in TENTHS of a second (capped at
//                10000), so the arcade tiebreak (fewest guesses) ranks clears
//                by speed at a tenth-second resolution. An unfinished run:
//                10000 minus the tiles travelled, so going further ranks higher.
//   timeElapsed  the run time in whole seconds, for display.
// The run clock counts play time only: it stops for pauses, level cards and
// the level-clear banner, and keeps running while Dario is losing a life.

export const DARIO_TOTAL = 10;
export const TENTHS_CAP = 10000;
export const LEVEL_NAMES = ['The Valley', 'The Data Center', 'The Launch Site'];

const H = 14, T = 16;

/* ---------------- seeded RNG ---------------- */
function hashStr(s) {
  let h = 2166136261 >>> 0;
  for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619) >>> 0; }
  return h >>> 0;
}
function mulberry(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6D2B79F5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/* ---------------- level geometry ---------------- */
function mk(W) { return Array.from({ length: H }, () => Array(W).fill('.')); }
function S(g, x, y, c) { if (y >= 0 && y < H && x >= 0 && x < g[0].length) g[y][x] = c; }
function F(g, x0, x1, y0, y1, c) { for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) S(g, x, y, c); }
function ground(g, a, b) { F(g, a, b, 12, 13, '#'); }
function pillar(g, x, h) { const top = 12 - h; S(g, x, top, 'T'); S(g, x + 1, top, 't'); for (let y = top + 1; y < 12; y++) { S(g, x, y, 'I'); S(g, x + 1, y, 'i'); } }
function stairs(g, x, n, dir) { for (let i = 0; i < n; i++) { const h = dir > 0 ? i + 1 : n - i; F(g, x + i, x + i, 12 - h, 11, 'S'); } }
function row(g, x, y, str) { [...str].forEach((c, i) => { if (c !== ' ') S(g, x + i, y, c); }); }
function girder(g, x0, x1, y) { F(g, x0, x1, y, y, 'L'); for (let yy = y + 1; yy < H; yy++) S(g, Math.floor((x0 + x1) / 2), yy, 'k'); }
const BB = (x, y, a, b, bg, fg) => ({ x: x * T, y: y * T, a, b, bg, fg });

function baseValley() {
  const W = 212, g = mk(W);
  ground(g, 0, 68); ground(g, 71, 85); ground(g, 89, 150); ground(g, 154, W - 1);
  S(g, 16, 8, 'C');
  row(g, 20, 8, 'BCBCB'); S(g, 22, 4, 'C');
  pillar(g, 28, 2); pillar(g, 38, 3); pillar(g, 47, 4); pillar(g, 58, 4);
  row(g, 77, 8, 'BCB'); row(g, 80, 4, 'BBBBBBBB');
  row(g, 91, 4, 'BBBC'); S(g, 94, 8, 'B');
  row(g, 100, 8, 'BB'); S(g, 106, 8, 'C'); S(g, 109, 8, 'C'); S(g, 112, 8, 'C'); S(g, 109, 4, 'C');
  S(g, 119, 8, 'B'); row(g, 122, 4, 'BBB'); row(g, 127, 4, 'BCCB'); row(g, 128, 8, 'BB');
  stairs(g, 134, 4, 1); stairs(g, 140, 4, -1);
  stairs(g, 147, 4, 1); F(g, 151, 151, 8, 11, 'S'); stairs(g, 154, 4, -1);
  pillar(g, 163, 2); row(g, 167, 8, 'BBCB'); pillar(g, 178, 2);
  for (let i = 0; i < 8; i++) F(g, 181 + i, 181 + i, 11 - i, 11, 'S'); F(g, 189, 189, 4, 11, 'S');
  return {
    name: 'THE VALLEY', num: '1-1', tag: 'RAISE THE ROUND', clear: 'FUNDING ROUND CLOSED', gateTxt: 'SERIES A', theme: 'valley', g, W,
    gateX: 198, enemies: { n: [9, 12], taxi: 0.22 }, chips: { groups: [5, 7] }, rockets: [], platsBase: [],
    bill: [
      BB(6, 3, 'CLOSEDAI', 'NOW 100% OPEN*', '#10a37f', '#fff'),
      BB(33, 4, 'GOGGLE GEMINEYE', "DON'T BE BEHIND", '#fff', '#4285f4'),
      BB(62, 3, 'TESLO ROBOTAXI', 'FSD (SUPERVISED)', '#c8102e', '#fff'),
      BB(96, 2, 'NVIDEO', 'THE MORE YOU BUY', '#76b900', '#111'),
      BB(131, 1, 'METAH', 'FREE WEIGHTS, NO REFUNDS', '#0866ff', '#fff'),
      BB(157, 3, '*NOT REALLY', 'ClosedAI legal dept.', '#222', '#ffd27a'),
      BB(184, 1, 'SERIES A: $40B', 'AT A $1T VALUATION', '#111', '#3fd17a'),
    ],
  };
}
function baseDataCenter() {
  const W = 196, g = mk(W);
  ground(g, 0, 79); ground(g, 82, 119); ground(g, 123, W - 1);
  F(g, 8, 178, 0, 1, 'R');
  row(g, 10, 8, 'CCCCC');
  stairs(g, 18, 4, 1); row(g, 24, 8, 'BBBBBB');
  F(g, 30, 31, 5, 11, 'S'); F(g, 34, 35, 7, 11, 'S');
  F(g, 38, 47, 2, 6, 'B'); F(g, 40, 45, 3, 5, '.'); F(g, 38, 38, 3, 5, '.'); row(g, 40, 4, 'oooooo'); S(g, 44, 6, 'C');
  row(g, 60, 8, 'BBCBB');
  pillar(g, 68, 3); pillar(g, 74, 2);
  row(g, 84, 9, 'BBBB'); row(g, 90, 6, 'BBBB'); row(g, 96, 9, 'BCBB');
  F(g, 105, 106, 9, 11, 'S'); F(g, 110, 111, 7, 11, 'S'); F(g, 115, 116, 8, 11, 'S');
  F(g, 125, 138, 6, 6, 'B'); F(g, 125, 125, 2, 5, 'B'); S(g, 131, 5, 'C'); S(g, 135, 5, 'C');
  row(g, 142, 7, 'BBB'); row(g, 148, 4, 'BBBCB');
  pillar(g, 158, 4); pillar(g, 164, 2);
  for (let i = 0; i < 6; i++) F(g, 168 + i, 168 + i, 11 - i, 11, 'S'); F(g, 174, 175, 6, 11, 'S');
  return {
    name: 'THE DATA CENTER', num: '1-2', tag: 'BRING THE CLUSTER ONLINE', clear: 'CLUSTER ONLINE', gateTxt: '1 GW', theme: 'dc', g, W,
    gateX: 186, enemies: { n: [11, 14], taxi: 0.28 }, chips: { groups: [5, 7] }, rockets: [], platsBase: [],
    bill: [
      BB(2, 3, 'EXPORT CONTROLS', 'IN EFFECT', '#ffd400', '#111'),
      BB(22, 3, 'DEEPSINK R2', 'SAME MODEL, 1/30 THE COST', '#4d6bfe', '#fff'),
      BB(54, 3, 'QWAN 4', 'OPEN WEIGHTS, ZERO CHILL', '#615ced', '#fff'),
      BB(78, 3, 'POWER DRAW', '9 GIGAWATTS AND CLIMBING', '#111', '#ff6a3d'),
      BB(118, 3, 'SCALING LAWS', 'STILL HOLDING (FOR NOW)', '#111', '#5ff0ff'),
      BB(140, 2, 'HUAWAY ASCEND', 'NO NVIDEO REQUIRED', '#cf0a2c', '#fff'),
      BB(176, 3, 'CLUSTER STATUS', '100,000 GPUS', '#0e3a2a', '#3fd17a'),
    ],
  };
}
function baseLaunch() {
  const W = 188, g = mk(W);
  ground(g, 0, 14);
  girder(g, 18, 24, 10); girder(g, 27, 33, 7); girder(g, 36, 44, 9);
  girder(g, 56, 60, 6); girder(g, 63, 72, 10);
  girder(g, 76, 80, 8); girder(g, 84, 91, 5);
  girder(g, 100, 109, 9); row(g, 101, 6, 'BCB'); S(g, 104, 3, 'C');
  girder(g, 113, 117, 7); girder(g, 120, 127, 10);
  girder(g, 140, 144, 6); girder(g, 147, 155, 9);
  ground(g, 160, W - 1); stairs(g, 163, 3, 1);
  row(g, 20, 8, 'ooo'); row(g, 29, 5, 'ooo'); row(g, 47, 6, 'oooo'); row(g, 93, 4, 'ooo'); row(g, 131, 5, 'oooo'); row(g, 57, 4, 'oo');
  return {
    name: 'THE LAUNCH SITE', num: '1-3', tag: 'SHIP THE MODEL', clear: 'MODEL SHIPPED', gateTxt: 'AGI', theme: 'launch', g, W,
    gateX: 176, enemies: { n: [6, 8], taxi: 0.3 }, chips: { groups: [2, 4] },
    rockets: [16, 25, 34, 61, 74, 82, 111, 118, 138, 157],
    platsBase: [{ x0: 46 * T, y0: 9 * T, w: 48, ax: 'x', r: 28, sp: 0.022 }, { x0: 93 * T, y0: 7 * T, w: 48, ax: 'y', r: 30, sp: 0.028 }, { x0: 130 * T, y0: 8 * T, w: 48, ax: 'x', r: 34, sp: 0.024 }],
    bill: [
      BB(2, 2, 'SPACE-Y', 'ORBITAL DATA CENTERS, SOON', '#111', '#fff'),
      BB(48, 1, 'MARS OR BUST', 'PROBABLY BUST', '#c1440e', '#fff'),
      BB(95, 1, 'STARLINKED', '2 BARS ABOVE THE CLOUDS', '#0b1d3a', '#9fd2ff'),
      BB(128, 1, 'XAIY', 'NOW WITH MORE OPINIONS', '#000', '#fff'),
      BB(164, 3, 'AGI AHEAD', 'DRIVE SAFELY', '#3fd17a', '#062b17'),
    ],
  };
}

export const SOLID_TILES = '#RBCPUSTtIiL';
// The rogue bots are software-as-a-service stock tickers (owner, 2026-10-07).
export const TICKERS = ['NOW', 'TEAM', 'WDAY', 'INTU', 'ADBE', 'ADSK', 'MNDY', 'CRM', 'HUBS', 'DOCU', 'ZM', 'OKTA'];
const isSolidCh = (c) => SOLID_TILES.includes(c);

// The lowest standing surface in column x: a solid tile with two clear rows above.
function surfaceY(g, x) {
  for (let y = H - 1; y >= 3; y--) {
    if (isSolidCh(g[y][x]) && g[y - 1][x] === '.' && g[y - 2][x] === '.') return y;
  }
  return -1;
}

function remix(L, rng) {
  const { g, W } = L;
  // 1. crate runs: shuffle the letters inside every short run holding a chip
  //    crate, then put the shield in one chip crate.
  for (let y = 0; y < H; y++) {
    let x = 0;
    while (x < W) {
      if ('BC'.includes(g[y][x]) && y > 1) {
        let x1 = x; while (x1 + 1 < W && 'BC'.includes(g[y][x1 + 1])) x1++;
        const len = x1 - x + 1;
        const letters = []; for (let i = x; i <= x1; i++) letters.push(g[y][i]);
        if (len <= 8 && letters.includes('C')) {
          for (let i = letters.length - 1; i > 0; i--) { const j = Math.floor(rng() * (i + 1)); [letters[i], letters[j]] = [letters[j], letters[i]]; }
          letters.forEach((c, i) => { g[y][x + i] = c; });
        }
        x = x1 + 1;
      } else x++;
    }
  }
  const crates = [];
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) if (g[y][x] === 'C') crates.push([x, y]);
  if (crates.length) { const [px, py] = crates[Math.floor(rng() * crates.length)]; g[py][px] = 'P'; }

  // 2. enemies on standing surfaces, never near the start or the gate
  const cand = [];
  for (let x = 14; x < L.gateX - 6; x++) {
    const y = surfaceY(g, x);
    if (y < 0) continue;
    if (!'#LB'.includes(g[y][x])) continue;
    cand.push([x, y - 1]);
  }
  const [lo, hi] = L.enemies.n;
  const want = lo + Math.floor(rng() * (hi - lo + 1));
  const ents = [];
  const used = [];
  let guard = 0;
  while (ents.length < want && guard++ < 2000 && cand.length) {
    const [x, y] = cand[Math.floor(rng() * cand.length)];
    if (used.some((u) => Math.abs(u - x) < 4)) continue;
    used.push(x);
    const k = rng() < L.enemies.taxi ? 'taxi' : 'bot';
    ents.push(k === 'bot' ? { k, x, y, tk: TICKERS[Math.floor(rng() * TICKERS.length)] } : { k, x, y });
  }
  // 3. chip groups float two or three rows above a surface
  const chips = [];
  const [cl, ch] = L.chips.groups;
  const groups = cl + Math.floor(rng() * (ch - cl + 1));
  guard = 0;
  let made = 0;
  while (made < groups && guard++ < 500) {
    const x0 = 14 + Math.floor(rng() * (L.gateX - 22));
    const n = 2 + Math.floor(rng() * 3);
    const y0 = surfaceY(g, x0);
    if (y0 < 0) continue;
    const yy = y0 - 2 - Math.floor(rng() * 2);
    let ok = yy > 2;
    for (let i = 0; i < n && ok; i++) if (x0 + i >= W || g[yy][x0 + i] !== '.' || g[yy + 1][x0 + i] !== '.') ok = false;
    if (!ok) continue;
    for (let i = 0; i < n; i++) { g[yy][x0 + i] = 'o'; }
    made++;
  }
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) if (g[y][x] === 'o') { chips.push([x, y]); g[y][x] = '.'; }
  // 4. timings
  const rockets = L.rockets.map((x) => ({ x, wait: 30 + Math.floor(rng() * 160) }));
  const plats = L.platsBase.map((p) => ({ ...p, ph: rng() * Math.PI * 2 }));
  return { ...L, ents, chips, rockets, plats };
}

// The day's three levels. Pure and deterministic: the same quizId always gives
// the same remix, in the browser and in the verifier.
export function buildLevels(quizId) {
  const rng = mulberry(hashStr(String(quizId || 'dario')));
  return [baseValley(), baseDataCenter(), baseLaunch()].map((L) => remix(L, rng));
}

export function fmtRun(tenths) {
  const t = Math.max(0, Math.round(tenths || 0));
  const m = Math.floor(t / 600), s = Math.floor((t % 600) / 10), d = t % 10;
  return `${m}:${String(s).padStart(2, '0')}.${d}`;
}

/* ====================================================================== */
/*                        the game (browser only)                         */
/* ====================================================================== */

// 16-BIT ART (owner, 2026-10-07): every sprite is drawn at TWICE the world's
// resolution, so a 16x16 world tile holds 32x32 art pixels. The world, physics
// and level geometry are unchanged; only the art got more pixels. Each sprite
// gets a one-art-pixel dark outline drawn round its silhouette automatically.
const SP = 2;
function padTo(r, n) { return (r + '.'.repeat(n)).slice(0, n); }
const N4 = [[1, 0], [-1, 0], [0, 1], [0, -1]];
function sprite(rows, pal, opt = {}) {
  const w = opt.w || 32;
  rows = rows.map((r) => padTo(r, w));
  if (opt.h && rows.length < opt.h) rows = [...Array(opt.h - rows.length).fill('.'.repeat(w)), ...rows];
  const hgt = rows.length;
  const grid = rows.map((r) => [...r]);
  const P = { ...pal };
  if (opt.outline !== false) {
    const add = [];
    for (let y = 0; y < hgt; y++) for (let x = 0; x < w; x++) {
      if (P[grid[y][x]]) continue;
      if (N4.some(([dx, dy]) => { const c = (grid[y + dy] || [])[x + dx]; return c && P[c]; })) add.push([x, y]);
    }
    add.forEach(([x, y]) => { grid[y][x] = '@'; });
    P['@'] = opt.outline || '#140c12';
  }
  const c = document.createElement('canvas'); c.width = w; c.height = hgt;
  const x = c.getContext('2d');
  grid.forEach((r, y) => r.forEach((ch, i) => { if (P[ch]) { x.fillStyle = P[ch]; x.fillRect(i, y, 1, 1); } }));
  const f = document.createElement('canvas'); f.width = w; f.height = hgt;
  const fx = f.getContext('2d'); fx.translate(w, 0); fx.scale(-1, 1); fx.drawImage(c, 0, 0);
  return { r: c, l: f, w: w / SP, h: hgt / SP };
}
const dupRows = (rows, idx) => rows.flatMap((r, i) => (idx.includes(i) ? [r, r] : [r]));
function makeSprites() {
  const DP = {
    H: '#24150e', h: '#55301b', j: '#8f5a36', K: '#f2b78c', k: '#c98458', E: '#120c10', e: '#ffffff', m: '#a8553a',
    S: '#2f6fd6', s: '#1b4592', t: '#79abff', L: '#f2a93b', P: '#363b4f', p: '#1f2333', W: '#f4f4f8', w: '#a3a7b6',
  };
  const head = [
    '..........hHHh..hHHh............',
    '........hHjjHHhhHjjHHh..........',
    '......hHHjHHHHHHHjHHHHh.........',
    '.....hHjHHHhHHjHHHHhHHHh........',
    '.....HHHHjHHHHHHHjHHHHHHh.......',
    '....hHHHHHHKKKKKKKKHHHHHH.......',
    '....HHjHHKKKKKKKKKKKHHHH........',
    '....HHHHKKKKKKKKKKeEKHHh........',
    '.....HHkKKKKKKKKKKeEKKK.........',
    '.....HkkKKKKKKKKKKKKKKKK........',
    '......HkKKKKKKKKKKKKKKKKk.......',
    '.......kKKKKKKKKKKmmmKKk........',
    '........kKKKKKKKKKKKKKk.........',
    '.........kkKKKKKKKKkk...........',
  ];
  const torso = [
    '..........SSSSSSSSSSS...........',
    '........SStSSSSSSSSSSS..........',
    '.......SStSSSSSSLLSSSSs.........',
    '......SStSSSSSSLLLLSSSSs........',
    '......SSsSSSSSSSLLSSSsSs........',
    '......KKsSSSSSSSSSSSSsKK........',
    '......KKKsSSSSSSSSSSsKKK........',
    '.......KK.sSSSSSSSSs.KK.........',
    '..........PPPPPPPPPPp...........',
  ];
  const torsoUp = [
    '......KK..SSSSSSSSSSS...........',
    '......KKSStSSSSSSSSSSS..........',
    '.......SStSSSSSSLLSSSSs.........',
    '.......StSSSSSSLLLLSSSSs........',
    '........sSSSSSSSLLSSSsSs........',
    '........sSSSSSSSSSSSSsKK........',
    '.........sSSSSSSSSSSsKKK........',
    '..........sSSSSSSSSs.KK.........',
    '..........PPPPPPPPPPp...........',
  ];
  const legsStand = [
    '..........PPPPPPPPPPp...........',
    '..........PPPPp..PPPPp..........',
    '..........PPPp....PPPp..........',
    '..........PPPp....PPPp..........',
    '..........ppPp....ppPp..........',
    '.........WWWWw...WWWWWw.........',
    '........WWWWWWw..WWWWWWw........',
    '........wwwwwww..wwwwwww........',
    '................................',
  ].slice(0, 8);
  legsStand.unshift('..........PPPPPPPPPPp...........');
  const legsWalk = [
    '..........PPPPPPPPPPp...........',
    '.........PPPPp...PPPPp..........',
    '.........PPPPp...PPPPp..........',
    '........PPPp......PPPp..........',
    '.......PPPp........PPPp.........',
    '......pPPp..........pPPp........',
    '.....WWWWw..........WWWWWw......',
    '....WWWWWWw.........WWWWWWw.....',
    '....wwwwwww.........wwwwwww.....',
  ];
  const legsMid = [
    '..........PPPPPPPPPPp...........',
    '...........PPPPPPPPp............',
    '...........PPPPPPPp.............',
    '............PPPPPPp.............',
    '............PPPPPPp.............',
    '............ppPPPPp.............',
    '...........WWWWWWWw.............',
    '..........WWWWWWWWWw............',
    '..........wwwwwwwwww............',
  ];
  const legsJump = [
    '..........PPPPPPPPPPp...........',
    '.........PPPPp...PPPPp..........',
    '........PPPp.......PPPp.........',
    '.......WWWWw........PPPp........',
    '......WWWWWWw.......pPPp........',
    '......wwwwwww......WWWWWw.......',
    '...................WWWWWWw......',
    '...................wwwwwww......',
    '................................',
  ];
  const poof = [
    '...........hH....hH.............',
    '........hHHjHh.hHjHHh...........',
    '......hHjHHHHHhHHHHjHHh.........',
    '......HHHHHjHHHHHHHHHHHh........',
  ];
  const dario = (big, t, l) => (big
    ? sprite([...poof, ...head, ...dupRows(t, [1, 2, 3, 4, 5, 6, 7]), ...dupRows(l, [1, 2, 3, 4, 5])], DP)
    : sprite([...head, ...t, ...l], DP));
  const SPR = {};
  for (const big of [0, 1]) SPR[big] = { stand: dario(big, torso, legsStand), walk1: dario(big, torso, legsWalk), walk2: dario(big, torso, legsMid), jump: dario(big, torsoUp, legsJump) };

  const BOT = { a: '#c9d2e0', o: '#ff4d4d', O: '#ffb3b3', G: '#2c3242', g: '#aab4c4', q: '#d7deea', M: '#141924', L: '#4ff0ff', l: '#bafcff', N: '#ff6b6b', D: '#566074', d: '#7c8598', R: '#ff4d4d', t: '#1c1f27', X: '#ff5a5a' };
  const botTop = [
    '..............aOa...............',
    '..............aoa...............',
    '...............a................',
    '........GGGGGGGGGGGGGGGG........',
    '.......GqqqqqqqqqqqqqqqgG.......',
    '......GqgMMMMMMMMMMMMMMggG......',
    '......GqgMlLMMMMMMMlLMMggG......',
    '......GqgMLLMMMMMMMLLMMggG......',
    '......GggMMMMMMMMMMMMMMggG......',
    '......GggMMMMNNNNNNMMMMggG......',
    '......GggMMMMMMMMMMMMMMggG......',
    '......GgggggggggggggggggdG......',
    '.......GGGGGGGGGGGGGGGGGG.......',
    '..........DDDDDDDDDDDD..........',
    '.........DdddddddddddDD.........',
    '.........DdRRddddddRRdD.........',
    '.........DddddddddddddD.........',
    '..........DDDDDDDDDDDD..........',
  ];
  const bot = [
    sprite([...botTop, '..........DD........DD..........', '..........DD........DD..........', '.........tttt......tttt.........', '........tttttt....tttttt........'], BOT, { h: 32 }),
    sprite([...botTop, '.........DD..........DD.........', '........DD............DD........', '.......tttt..........tttt.......', '......tttttt........tttttt......'], BOT, { h: 32 }),
  ];
  const botFlat = sprite([
    '........GGGGGGGGGGGGGGGG........',
    '......GqgMXMMMMMMMMMMXMggG......',
    '......GggMMMMNNNNNNMMMMggG......',
    '......GGGGGGGGGGGGGGGGGGGG......',
    '.........tttt......tttt.........',
  ], BOT, { h: 32 });
  const shield = sprite([
    '..........BBBBBBBBBBBB..........',
    '........BBbbbbbbbbbbbbBB........',
    '........BbjjbbbbbbbbbbbB........',
    '........BbjbbbbbbbbbbwbB........',
    '........BbbbbbbbbbbbwwbB........',
    '........BbbbbbbbbbbwwwbB........',
    '........BbbwbbbbbbwwwbbB........',
    '........BbbwwbbbbwwwbbbB........',
    '........BbbwwwbbwwwbbbbB........',
    '........BbbbwwwwwwbbbbbB........',
    '.........BbbbwwwwbbbbbB.........',
    '.........BbbbbwwbbbbbbB.........',
    '..........BbbbbbbbbbbB..........',
    '...........BbbbbbbbbB...........',
    '............BbbbbbbB............',
    '.............BbbbbB.............',
    '..............BBBB..............',
    '................................',
    '................................',
    '................................',
    '................................',
    '................................',
    '................................',
  ], { B: '#163273', b: '#4f8ef7', j: '#bcd6ff', w: '#ffffff' }, { h: 32 });
  return { SPR, bot, botFlat, shield };
}

const TH = {
  valley: { sky: ['#6fbfff', '#e3f4ff'], g: '#8b8f99', gl: '#a9adb6', gd: '#5c606a', top: '#c9ccd2', toph: '#eef0f4', topd: '#9da1a9', br: '#c97a3d', brh: '#e69d5e', brs: '#a35d29', brl: '#6a3412', st: '#b3aca2', sth: '#d6d0c6', sts: '#a39c92', std: '#6d6862', hill: '#e6c27a', hill2: '#c49a52' },
  dc: { sky: ['#07090f', '#121726'], g: '#3a4256', gl: '#4f5a74', gd: '#20263a', top: '#6c7894', toph: '#9aa6c4', topd: '#3a4256', br: '#465674', brh: '#5f7398', brs: '#34405a', brl: '#1a2238', st: '#5e6678', sth: '#7d869a', sts: '#535b6c', std: '#343a48' },
  launch: { sky: ['#2a1d4a', '#ff9e6b'], g: '#5a5f6c', gl: '#747987', gd: '#34374a', top: '#8c90a0', toph: '#b8bccb', topd: '#5a5f6c', br: '#a8704a', brh: '#c68d64', brs: '#855436', brl: '#4c2c14', st: '#a89a86', sth: '#c9bca8', sts: '#988a76', std: '#665a4a', gird: '#e8732a', girdd: '#a2470f' },
};
const QUIPS = ['DEPRECATED', 'RATE LIMITED', 'HALLUCINATED', 'OUT OF TOKENS', 'SUNSET'];

/* ---------- music ----------
   Every tune is a public-domain composition in an original chiptune arrangement:
     1-1 The Valley        Grieg, In the Hall of the Mountain King (1875), speeding up each loop
     1-2 The Data Center   Rimsky-Korsakov, Flight of the Bumblebee (1900)
     1-3 The Launch Site   Wagner, Ride of the Valkyries (1856)
     win                   Elgar, Pomp and Circumstance March No. 1 (1901)
     game over             Gounod, Funeral March of a Marionette (1872), played once
   Notes are written 'NAME:units'; a track's unit is the seconds per unit. */
function NOTE(n) {
  const m = /^([A-G])(#|b)?(\d)$/.exec(n);
  const base = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 }[m[1]] + (m[2] === '#' ? 1 : m[2] === 'b' ? -1 : 0);
  return 12 * (Number(m[3]) + 1) + base;
}
const N = (str) => str.trim().split(/\s+/).map((t) => { const [n, d] = t.split(':'); return [n === 'r' ? 0 : NOTE(n), Number(d || 1)]; });
const up = (arr, k) => arr.map(([n, d]) => [n ? n + k : 0, d]);
const KING = N('B3 C#4 D4 E4 F#4 D4 F#4:2 F4 C#4 F4:2 E4 C4 E4:2 B3 C#4 D4 E4 F#4 D4 F#4 B4 A4 F#4 D4 F#4 A4:4');
const BEE = N('E5 D#5 D5 C#5 D5 C#5 C5 B4 C5 B4 A#4 A4 G#4 G4 F#4 F4 E4 F4 E4 D#4 E4 F4 E4 D#4 E4 F4 F#4 G4 G#4 A4 A#4 B4 C5 C#5 D5 D#5 E5 D#5 D5 C#5 D5 C#5 C5 B4 C5 B4 A#4 A4');
const VALK = N('F#4 B4:2 F#4 B4:2 D5:4 B4:4 B4 D5:2 B4 D5:2 F#5:4 D5:4 D5 F#5:2 D5 F#5:2 A5:4 A4:4 F#4 B4:2 F#4 B4:2 D5:4 B4:4 r:3');
const POMP = N('E5:2 D5 C5 D5:2 E5 F5 G5:4 A5:2 G5 F5 E5:2 D5:6 E5:2 D5 C5 D5:2 E5 F5 G5:4 A5:2 G5 F5 E5:2 D5:2 C5:6 r:2');
const MARIONETTE = N('A3 D4:2 D4 D4 C#4 D4 E4:2 F4 E4 D4:4 A3 D4:2 F4 A4:2 G4 F4 E4 D4:4 C#4 D4:6');
const TRACKS = {
  king: { notes: [...KING, ...up(KING, 7)], unit: 0.19, accel: 0.9, min: 0.11, wave: 'square', vol: 0.022, bass: ['B2', 'F#2'].map(NOTE), every: 2, loop: true },
  bee: { notes: [...BEE, ...up(BEE, 5)], unit: 0.072, wave: 'square', vol: 0.02, bass: ['A2', 'E2'].map(NOTE), every: 4, loop: true },
  valk: { notes: [...VALK, ...up(VALK, 3)], unit: 0.105, wave: 'square', vol: 0.022, bass: ['B2', 'F#2', 'D3', 'A2'].map(NOTE), every: 3, loop: true },
  pomp: { notes: POMP, unit: 0.17, wave: 'square', vol: 0.022, bass: ['C3', 'G2', 'F2', 'G2'].map(NOTE), every: 2, loop: true },
  funeral: { notes: MARIONETTE, unit: 0.2, wave: 'triangle', vol: 0.06, bass: ['D2', 'A2'].map(NOTE), every: 2, loop: false },
};
const LEVEL_TRACKS = ['king', 'bee', 'valk'];

export function createDario({ canvas: canvasIn, quizId, onEnd, onTick, music = true }) {
  let ctx = null, canvas = canvasIn;
  function bindCanvas(cv) { canvas = cv; cv.width = 400 * SP; cv.height = 224 * SP; ctx = cv.getContext('2d'); ctx.imageSmoothingEnabled = false; }
  bindCanvas(canvas);
  const VW = 400, VH = 224;
  const PIX = '"Press Start 2P", ui-monospace, monospace';
  const { SPR, bot, botFlat, shield } = makeSprites();
  const DAY = buildLevels(quizId);

  let st = 'ready', li = 0, lvl, g, W, ents, plats, parts, pops, bumps, cam, p = null;
  let score = 0, gpus = 0, lives = 3, deaths = 0, timer = 0, gate, frame = 0, paused = false;
  let runFrames = 0, levelStartFrames = 0, splits = [], maxX = 0, ended = false, loadedLi = -1;
  const keys = { l: 0, r: 0, j: 0, run: 0 }; let jEdge = 0, runLock = false;

  function load(i) {
    const L = DAY[i];
    lvl = L; g = L.g.map((r) => r.slice()); W = L.W;
    ents = []; parts = []; pops = []; bumps = [];
    gate = { x: L.gateX * T, y: (11 - 4) * T };
    for (const e of L.ents) {
      if (e.k === 'bot') ents.push({ k: 'bot', tk: e.tk, x: e.x * T, y: e.y * T, w: 14, h: 14, vx: -0.5, vy: 0, dead: 0, act: false });
      else ents.push({ k: 'taxi', x: e.x * T, y: e.y * T + 4, w: 18, h: 12, vx: -0.85, vy: 0, dead: 0, act: false });
    }
    for (const [x, y] of L.chips) ents.push({ k: 'chip', x: x * T + 3, y: y * T + 3, w: 10, h: 10 });
    for (const r of L.rockets) ents.push({ k: 'rocket', x: r.x * T + 4, y: H * T + 30, w: 8, h: 22, vy: 0, wait: r.wait, act: true });
    plats = L.plats.map((q) => ({ ...q, x: q.x0, y: q.y0, dx: 0, dy: 0 }));
    const big = p && p.big ? 1 : 0;
    p = { x: 40, y: 0, w: 12, h: big ? 24 : 16, vx: 0, vy: 0, on: false, face: 1, big, inv: 0, coy: 0, buf: 0, ride: null, anim: 0 };
    p.y = 12 * T - p.h;
    cam = 0;
    if (loadedLi !== i) { maxX = 0; loadedLi = i; }
  }

  /* ---------- audio ---------- */
  let AC = null, musicOn = music, mNext = 0, mI = 0, mPos = 0;
  function ensureAC() { try { if (!AC) AC = new (window.AudioContext || window.webkitAudioContext)(); if (AC.state === 'suspended') AC.resume(); } catch (e) {} }
  function tone(f, t, d, type, v, slide) {
    if (!AC) return;
    try {
      const o = AC.createOscillator(), gn = AC.createGain(); o.type = type; o.frequency.setValueAtTime(f, t);
      if (slide) o.frequency.linearRampToValueAtTime(f + slide, t + d);
      gn.gain.setValueAtTime(v, t); gn.gain.exponentialRampToValueAtTime(0.0001, t + d);
      o.connect(gn).connect(AC.destination); o.start(t); o.stop(t + d + 0.02);
    } catch (e) {}
  }
  const beep = (f, d = 0.08, type = 'square', v = 0.05, slide = 0) => { if (AC) tone(f, AC.currentTime, d, type, v, slide); };
  const hz = (m) => 440 * Math.pow(2, (m - 69) / 12);
  const sfx = {
    jump: () => beep(320, 0.12, 'square', 0.035, 260), coin: () => { beep(988, 0.06); setTimeout(() => beep(1319, 0.12), 60); },
    stomp: () => beep(180, 0.1, 'triangle', 0.08, -80), bump: () => beep(120, 0.06, 'square', 0.05), brk: () => beep(90, 0.15, 'sawtooth', 0.05, -40),
    up: () => [523, 659, 784, 1047].forEach((f, i) => setTimeout(() => beep(f, 0.08), i * 70)), hurt: () => beep(300, 0.25, 'sawtooth', 0.05, -220),
    die: () => [494, 440, 392, 330, 262].forEach((f, i) => setTimeout(() => beep(f, 0.12, 'triangle', 0.07), i * 120)),
    clear: () => [523, 659, 784, 1047, 784, 1047].forEach((f, i) => setTimeout(() => beep(f, 0.12, 'square', 0.05), i * 110)),
    launch: () => beep(70, 0.4, 'sawtooth', 0.03, 120),
  };
  let curTrack = null, mLoops = 0, mOnceDone = false;
  function trackNow() {
    if (st === 'done') return splits.length === DAY.length ? 'pomp' : 'funeral';
    if (st === 'play') return LEVEL_TRACKS[li] || null;
    return null;
  }
  const musicIv = setInterval(() => {
    if (!AC || !musicOn) { curTrack = null; return; }
    const want = trackNow();
    if (want !== curTrack) { curTrack = want; mI = 0; mPos = 0; mNext = 0; mLoops = 0; mOnceDone = false; }
    if (!curTrack || mOnceDone) return;
    if (paused) { mNext = 0; return; }
    const tr = TRACKS[curTrack];
    const unit = tr.accel ? Math.max(tr.min, tr.unit * Math.pow(tr.accel, mLoops)) : tr.unit;
    if (mNext < AC.currentTime) mNext = AC.currentTime + 0.05;
    while (mNext < AC.currentTime + 0.2) {
      const [n, len] = tr.notes[mI];
      if (n) tone(hz(n), mNext, unit * len * 0.88, tr.wave, tr.vol);
      for (let k = 0; k < len; k++) {
        const pos = mPos + k;
        if (pos % tr.every === 0) {
          const b = tr.bass[Math.floor(pos / tr.every) % tr.bass.length];
          tone(hz(b), mNext + k * unit, unit * Math.min(tr.every, 2) * 0.9, 'triangle', 0.05);
        }
      }
      mPos += len; mNext += unit * len; mI++;
      if (mI >= tr.notes.length) { mI = 0; mLoops++; if (!tr.loop) { mOnceDone = true; break; } }
    }
  }, 25);

  /* ---------- collision ---------- */
  const tileAt = (tx, ty) => { if (tx < 0 || tx >= W) return 'S'; if (ty < 0 || ty >= H) return '.'; return g[ty][tx]; };
  const solid = (tx, ty) => { if (tx < 0 || tx >= W) return true; if (ty < 0) return false; return isSolidCh(tileAt(tx, ty)); };
  function moveX(o) {
    o.x += o.vx;
    const t0 = Math.floor(o.y / T), t1 = Math.floor((o.y + o.h - 1) / T);
    if (o.vx > 0) { const tx = Math.floor((o.x + o.w) / T); for (let ty = t0; ty <= t1; ty++) if (solid(tx, ty)) { o.x = tx * T - o.w - 0.01; return 1; } }
    else if (o.vx < 0) { const tx = Math.floor(o.x / T); for (let ty = t0; ty <= t1; ty++) if (solid(tx, ty)) { o.x = (tx + 1) * T + 0.01; return -1; } }
    return 0;
  }
  function moveY(o, isP) {
    o.y += o.vy; o.on = false;
    const a = Math.floor((o.x + 1) / T), b = Math.floor((o.x + o.w - 1) / T);
    if (o.vy > 0) { const ty = Math.floor((o.y + o.h) / T); for (let tx = a; tx <= b; tx++) if (solid(tx, ty)) { o.y = ty * T - o.h; o.vy = 0; o.on = true; return; } }
    else if (o.vy < 0) {
      const ty = Math.floor(o.y / T);
      const hit = []; for (let tx = a; tx <= b; tx++) if (solid(tx, ty)) hit.push(tx);
      if (hit.length) {
        o.y = (ty + 1) * T; o.vy = 0;
        if (isP) { const cx = (o.x + o.w / 2) / T; hit.sort((m, n) => Math.abs(m + 0.5 - cx) - Math.abs(n + 0.5 - cx)); bump(hit[0], ty); }
      }
    }
  }
  const overlap = (a, b) => a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
  const pop = (x, y, s) => pops.push({ x, y, s, t: 45 });
  function bump(tx, ty) {
    const c = tileAt(tx, ty);
    ents.forEach((e) => { if ((e.k === 'bot' || e.k === 'taxi') && !e.dead && Math.abs(e.x + e.w / 2 - (tx * T + 8)) < 14 && Math.abs(e.y + e.h - ty * T) < 3) { e.dead = 60; e.flip = 1; e.vy = -4; score += 100; pop(e.x, e.y, '100'); } });
    if (c === 'C') { g[ty][tx] = 'U'; bumps.push({ tx, ty, t: 8 }); gpus++; score += 200; sfx.coin(); parts.push({ k: 'chippop', x: tx * T + 3, y: ty * T - 12, vy: -4, t: 28 }); pop(tx * T, ty * T - 16, '+1 GPU'); }
    else if (c === 'P') { g[ty][tx] = 'U'; bumps.push({ tx, ty, t: 8 }); ents.push({ k: 'shield', x: tx * T + 1, y: ty * T, w: 14, h: 14, vx: 0, vy: 0, rise: 16 }); beep(400, 0.2, 'triangle', 0.06, 300); }
    else if (c === 'B') {
      if (p.big) { g[ty][tx] = '.'; score += 50; sfx.brk(); for (const [dx, dy] of [[-1.5, -5], [1.5, -5], [-1, -3], [1, -3]]) parts.push({ k: 'chunk', x: tx * T + 6, y: ty * T + 6, vx: dx, vy: dy, t: 70 }); }
      else { bumps.push({ tx, ty, t: 8 }); sfx.bump(); }
    } else sfx.bump();
  }

  /* ---------- flow ---------- */
  function hurt() {
    if (p.inv > 0) return;
    if (p.big) { p.big = 0; p.y += 8; p.h = 16; p.inv = 120; sfx.hurt(); pop(p.x, p.y - 8, 'MISALIGNED'); } else die();
  }
  function die() { if (st !== 'play') return; st = 'dying'; timer = 0; p.vy = -5.5; p.vx = 0; deaths++; sfx.die(); }
  function progressTiles() {
    let t = 0; for (let i = 0; i < li; i++) t += DAY[i].W;
    return t + Math.min(lvl ? lvl.W : 0, Math.floor(maxX / T));
  }
  function result(cleared) {
    const tenths = Math.round(runFrames / 6);
    const sc = cleared ? DARIO_TOTAL : Math.min(DARIO_TOTAL - 1, li * 3 + Math.min(2, Math.floor((maxX / (lvl.W * T)) * 3)));
    return { cleared, tenths, seconds: Math.max(1, Math.round(tenths / 10)), score: sc, progress: progressTiles(), gpus, deaths, splits: splits.slice(), level: li };
  }
  function finish(cleared) {
    if (ended) return; ended = true; st = 'done';
    if (onEnd) onEnd(result(cleared));
  }
  function report() { if (onTick) onTick({ level: li, tenths: Math.round(runFrames / 6), lives, gpus, st }); }

  function update() {
    frame++;
    if (st === 'ready' || st === 'done') return;
    if (paused) return;
    if (st === 'intro') { if (++timer > 100) { st = 'play'; timer = 0; } return; }
    if (st === 'dying') {
      runFrames++; timer++;
      if (timer > 30) { p.vy += 0.3; p.y += p.vy; }
      if (timer > 140) {
        lives--;
        if (lives <= 0) { finish(false); return; }
        p.big = 0; load(li); st = 'intro'; timer = 0;
      }
      return;
    }
    if (st === 'clear') {
      if (++timer > 110) {
        li++;
        if (li >= DAY.length) { li = DAY.length - 1; finish(true); return; }
        load(li); st = 'intro'; timer = 0;
      }
      return;
    }
    // play
    runFrames++;
    plats.forEach((q) => { q.ph += q.sp; const ox = q.x, oy = q.y; const s = Math.sin(q.ph); if (q.ax === 'x') q.x = q.x0 + s * q.r; else q.y = q.y0 + s * q.r; q.dx = q.x - ox; q.dy = q.y - oy; });
    if (p.ride) { p.x += p.ride.dx; p.y += p.ride.dy; }
    const run = keys.run || runLock, max = run ? 3.1 : 1.9, acc = p.on ? 0.13 : 0.09;
    if (keys.l && !keys.r) { p.vx -= acc; p.face = -1; } else if (keys.r && !keys.l) { p.vx += acc; p.face = 1; }
    else { p.vx *= p.on ? 0.84 : 0.96; if (Math.abs(p.vx) < 0.05) p.vx = 0; }
    p.vx = Math.max(-max, Math.min(max, p.vx));
    if (jEdge) { p.buf = 7; jEdge = 0; }
    if (p.buf > 0) p.buf--;
    if (p.on || p.ride) p.coy = 6; else if (p.coy > 0) p.coy--;
    if (p.buf > 0 && p.coy > 0) { p.vy = -5.25 - Math.abs(p.vx) * 0.22; p.buf = 0; p.coy = 0; p.ride = null; sfx.jump(); }
    p.vy += (keys.j && p.vy < 0) ? 0.2 : 0.44; if (p.vy > 7) p.vy = 7;
    if (moveX(p)) p.vx = 0;
    const prevBottom = p.y + p.h;
    moveY(p, true);
    p.ride = null;
    if (p.vy >= 0) for (const q of plats) {
      if (p.x + p.w > q.x + 2 && p.x < q.x + q.w - 2 && prevBottom <= q.y + Math.max(1, q.dy) + 1 && p.y + p.h >= q.y) { p.y = q.y - p.h; p.vy = 0; p.on = true; p.ride = q; break; }
    }
    if (p.x < cam) { p.x = cam; p.vx = Math.max(0, p.vx); }
    if (p.x > maxX) maxX = p.x;
    if (p.inv > 0) p.inv--;
    p.anim += Math.abs(p.vx) * 0.12;
    if (p.y > H * T + 8) { die(); return; }
    const target = p.x - VW * 0.4; cam = Math.max(cam, Math.min(target, W * T - VW)); if (cam < 0) cam = 0;

    for (const e of ents) {
      if (e.gone) continue;
      if (e.k === 'chip') { if (overlap(p, e)) { e.gone = 1; gpus++; score += 100; sfx.coin(); } continue; }
      if (e.k === 'shield') {
        if (e.rise > 0) { e.y -= 0.5; e.rise -= 0.5; if (e.rise <= 0) e.vx = 1.1; continue; }
        e.vy = Math.min(e.vy + 0.35, 6); if (moveX(e)) e.vx *= -1; moveY(e);
        if (e.y > H * T) e.gone = 1;
        if (overlap(p, e)) { e.gone = 1; score += 1000; pop(e.x, e.y, 'ALIGNED'); if (!p.big) { p.big = 1; p.y -= 8; p.h = 24; } sfx.up(); }
        continue;
      }
      if (e.k === 'rocket') {
        if (Math.abs(e.x - p.x) > VW) continue;
        if (e.wait > 0) { e.wait--; if (e.wait === 0) { e.vy = -7.6; if (Math.abs(e.x - cam - VW / 2) < VW / 2) sfx.launch(); } }
        else {
          e.vy += 0.13; e.y += e.vy;
          if (e.y > H * T + 30 && e.vy > 0) { e.y = H * T + 30; e.vy = 0; e.wait = 150; }
          if ((frame & 1) === 0) parts.push({ k: 'smoke', x: e.x + 2 + ((frame * 7) % 4), y: e.y + e.h, vy: 0.3, t: 30 });
        }
        if (e.vy !== 0 && overlap(p, e)) hurt();
        continue;
      }
      if (!e.act) { if (e.x < cam + VW + 24) e.act = true; else continue; }
      if (e.dead) { e.dead--; if (e.flip) { e.vy += 0.3; e.y += e.vy; } if (e.dead <= 0) e.gone = 1; continue; }
      e.vy = Math.min(e.vy + 0.35, 6);
      if (moveX(e)) e.vx *= -1;
      moveY(e);
      if (e.y > H * T || e.x < cam - 64) e.gone = 1;
      if (overlap(p, e)) {
        const stomp = p.vy > 0 && (p.y + p.h) - e.y < 9;
        if (stomp && e.k === 'bot') { e.dead = 30; score += 100; pop(e.x - 8, e.y - 6, frame % 3 ? `${e.tk || 'SAAS'} -${12 + (frame % 37)}%` : QUIPS[frame % QUIPS.length]); p.vy = keys.j ? -5.2 : -3.6; sfx.stomp(); }
        else hurt();
      }
    }
    ents = ents.filter((e) => !e.gone);
    parts.forEach((q) => { q.t--; if (q.k === 'chunk') { q.vy += 0.3; q.x += q.vx; q.y += q.vy; } else if (q.k === 'smoke') { q.y += q.vy; } else { q.vy += 0.25; q.y += q.vy; } });
    parts = parts.filter((q) => q.t > 0);
    pops.forEach((q) => { q.t--; q.y -= 0.5; }); pops = pops.filter((q) => q.t > 0);
    bumps.forEach((b) => b.t--); bumps = bumps.filter((b) => b.t > 0);
    if (p.x + p.w / 2 > gate.x + 8) {
      st = 'clear'; timer = 0; p.vx = 0; sfx.clear();
      splits.push(Math.round((runFrames - levelStartFrames) / 6)); levelStartFrames = runFrames;
    }
  }

  /* ---------- draw ----------
     Coordinates are WORLD pixels (400x224); the canvas backing store is SP
     times that, so half-pixel values (0.5) land on a real art pixel. */
  const rect = (x, y, w, h, c) => { ctx.fillStyle = c; ctx.fillRect(x, y, w, h); };
  const half = (v) => Math.round(v * SP) / SP;
  const blit = (s, x, y, flip, k = 1) => ctx.drawImage(flip ? s.l : s.r, x, y, s.w * k, s.h * k);
  const hsh = (a, b) => (((a * 73856093) ^ (b * 19349663)) >>> 0);
  function bevel(x, y, w, h, hi, lo) { rect(x, y, w - 0.5, 0.5, hi); rect(x, y, 0.5, h - 0.5, hi); rect(x, y + h - 0.5, w, 0.5, lo); rect(x + w - 0.5, y, 0.5, h, lo); }
  function hills(c, par, base, amp, per, hi) {
    const path = () => { ctx.beginPath(); ctx.moveTo(0, VH); for (let x = 0; x <= VW; x += 2) { const wx = x + cam * par; ctx.lineTo(x, half(base - Math.max(0, Math.sin(wx / per) * amp) - Math.sin(wx / (per * 0.37)) * 6)); } ctx.lineTo(VW, VH); };
    if (hi) { ctx.save(); ctx.translate(0, -1); path(); ctx.fillStyle = hi; ctx.fill(); ctx.restore(); }
    path(); ctx.fillStyle = c; ctx.fill();
  }
  function cloud(x, y, s) {
    const C = [[6, 0, 14, 4], [2, 3, 26, 5], [0, 6, 34, 5], [4, 10, 26, 2]];
    C.forEach(([a, b, w, h]) => rect(x + a * s, y + b * s, w * s, h * s, '#ffffff'));
    rect(x + 2 * s, y + 10 * s, 30 * s, 1 * s, '#d6ecff'); rect(x + 6 * s, y + 11.5 * s, 22 * s, 0.5, '#bcdcf7');
    rect(x + 7 * s, y + 0.5, 6 * s, 0.5, '#fff');
  }
  function drawBG(th) {
    const gr = ctx.createLinearGradient(0, 0, 0, VH); gr.addColorStop(0, th.sky[0]); gr.addColorStop(1, th.sky[1]);
    ctx.fillStyle = gr; ctx.fillRect(0, 0, VW, VH);
    const t = lvl.theme;
    if (t === 'valley') {
      for (let i = 0; i < 6; i++) { const x = half(((i * 190 - cam * 0.15) % 1140 + 1140) % 1140 - 100), y = 22 + (i * 31) % 40; cloud(x, y, i % 2 ? 1 : 1.2); }
      hills(th.hill2, 0.2, 140, 50, 120, th.hill);
      for (let i = 0; i < 28; i++) {
        const x = half(((i * 46 - cam * 0.4) % 1288 + 1288) % 1288 - 60), h = 40 + (i * 37) % 70, w = 30 + (i * 13) % 16;
        const body = i % 3 ? '#5d7fa8' : '#6f93bd', top = 190 - h;
        rect(x, top, w, h, body); rect(x, top, 0.5, h, '#8fb0d6'); rect(x + w - 2, top, 2, h, '#4a6a92');
        rect(x - 0.5, top - 1.5, w + 1, 1.5, '#3e5a7e'); rect(x - 0.5, top - 1.5, w + 1, 0.5, '#9cbbe0');
        for (let yy = top + 4, r = 0; yy < 186; yy += 5, r++) for (let xx = x + 3, c = 0; xx < x + w - 4; xx += 4, c++) {
          const lit = ((i * 13 + r * 7 + c * 5) % 11) < 3;
          rect(xx, yy, 2.5, 2.5, lit ? '#ffe9a8' : '#3b5578'); if (!lit) rect(xx, yy, 2.5, 0.5, '#7fa0c8');
        }
        if (i % 5 === 0) { rect(x + w / 2 - 0.5, top - 11, 1, 10, '#2a2f3a'); if (Math.floor(frame / 30 + i) % 2) { rect(x + w / 2 - 1.5, top - 13, 3, 2.5, '#ff4040'); rect(x + w / 2 - 1, top - 12.5, 1, 0.5, '#ffb3b3'); } }
      }
      rect(0, 186, VW, 6, '#4c6788');
    } else if (t === 'dc') {
      for (let i = 0; i < 40; i++) {
        const x = half(((i * 34 - cam * 0.45) % 1360 + 1360) % 1360 - 34);
        rect(x, 40, 28, 150, '#121726'); rect(x + 1, 41, 26, 148, '#1d2336'); rect(x + 1, 41, 0.5, 148, '#2c3550'); rect(x + 26.5, 41, 0.5, 148, '#10131e');
        for (let j = 0; j < 12; j++) {
          const on = ((i * 7 + j * 3 + Math.floor(frame / 12)) % 9) < 5, yy = 46 + j * 12;
          rect(x + 3, yy - 1, 22, 9, '#171c2c'); rect(x + 3, yy - 1, 22, 0.5, '#2a3350');
          for (let v = 0; v < 6; v++) rect(x + 12 + v * 2, yy + 1, 1, 5, '#0c0f18');
          rect(x + 5, yy + 1, 1.5, 1.5, on ? (j % 4 ? '#3fd17a' : '#5ff0ff') : '#26304a');
          rect(x + 7.5, yy + 1, 1.5, 1.5, ((j + i) % 3 && on) ? '#f2a93b' : '#26304a');
          if (on) rect(x + 4.5, yy + 0.5, 2.5, 2.5, j % 4 ? '#3fd17a22' : '#5ff0ff22');
        }
      }
      rect(0, 32, VW, 6, '#232b40'); rect(0, 32, VW, 0.5, '#3a4766'); rect(0, 37.5, VW, 0.5, '#0c0f18');
      for (let i = 0; i < 14; i++) { const x = half(((i * 64 - cam * 0.45) % 896 + 896) % 896 - 32); rect(x, 34, 18, 2, '#ffe9a855'); rect(x + 2, 34.5, 14, 1, '#fff6d8'); }
    } else {
      for (let i = 0; i < 90; i++) { const x = half(((i * 67 - cam * 0.05) % VW + VW) % VW), y = (i * 29) % 120; const tw = (frame + i * 17) % 90 < 8; rect(x, y, i % 7 ? 0.5 : 1, i % 7 ? 0.5 : 1, tw ? '#fff' : '#ffffffaa'); }
      const mx = half(330 - cam * 0.03); rect(mx, 40, 14, 14, '#c94a2c'); rect(mx + 1, 39, 12, 16, '#c94a2c'); rect(mx - 1, 41, 16, 12, '#c94a2c');
      rect(mx + 2, 41, 4, 3, '#ff8b6a'); rect(mx + 8, 46, 3, 2, '#9a3218'); rect(mx + 4, 50, 2, 1.5, '#9a3218'); rect(mx + 10, 42, 1.5, 1.5, '#9a3218');
      for (let i = 0; i < 10; i++) {
        const x = half(((i * 170 - cam * 0.3) % 1700 + 1700) % 1700 - 60);
        rect(x, 120, 10, 90, '#2a1f3a'); rect(x, 120, 0.5, 90, '#4a3a62');
        for (let yy = 124; yy < 210; yy += 8) { rect(x - 4, yy, 18, 1, '#2a1f3a'); rect(x + 1, yy - 4, 0.5, 4, '#3a2c50'); rect(x + 8.5, yy - 4, 0.5, 4, '#3a2c50'); }
        rect(x + 3, 116, 4, 4, '#2a1f3a'); if ((frame + i * 20) % 60 < 30) rect(x + 4, 116.5, 2, 1.5, '#ff4040');
        const ph = (frame + i * 97) % 360;
        if (ph < 200) {
          const ry = half(200 - ph * 1.2);
          rect(x + 18, ry, 4, 12, '#e8e8ee'); rect(x + 21, ry, 1, 12, '#b8bccb'); rect(x + 18.5, ry - 1.5, 3, 1.5, '#d23b3b');
          rect(x + 17, ry + 9, 1, 3, '#d23b3b'); rect(x + 22, ry + 9, 1, 3, '#d23b3b');
          rect(x + 18.5, ry + 12, 3, 2, '#fff2b0'); rect(x + 18, ry + 14, 4, 2.5, ph % 6 < 3 ? '#ffd27a' : '#ff8a3d');
          ctx.fillStyle = '#ffffff1c'; ctx.fillRect(x + 18.5, ry + 16, 3, Math.min(80, ph * 1.2));
        }
      }
      hills('#3b2a4a', 0.5, 196, 10, 60, '#5a4070');
    }
  }
  function drawBill(b, cx) {
    const x = Math.round(b.x - cx), y = b.y; if (x > VW + 40 || x < -220) return;
    ctx.font = '7px ' + PIX; const w1 = ctx.measureText(b.a).width; ctx.font = '5px ' + PIX; const w2 = ctx.measureText(b.b).width;
    const w = Math.max(w1, w2) + 12, h = 24, base = 12 * T;
    for (const px of [x + 6, x + w - 9]) { rect(px, y + h, 3, base - y - h, '#3b3f4c'); rect(px, y + h, 0.5, base - y - h, '#6a7080'); rect(px + 2.5, y + h, 0.5, base - y - h, '#22252e'); for (let yy = y + h + 8; yy < base; yy += 14) rect(px - 0.5, yy, 4, 1, '#22252e'); }
    rect(x - 2.5, y - 2.5, w + 5, h + 5, '#1a1c24'); rect(x - 2, y - 2, w + 4, h + 4, '#3a3e4c'); rect(x - 2, y - 2, w + 4, 0.5, '#6a7080');
    rect(x, y, w, h, b.bg);
    const sh = ctx.createLinearGradient(0, y, 0, y + h); sh.addColorStop(0, '#ffffff22'); sh.addColorStop(0.5, '#ffffff00'); sh.addColorStop(1, '#00000033');
    ctx.fillStyle = sh; ctx.fillRect(x, y, w, h);
    rect(x, y, w, 0.5, '#ffffff55');
    for (let lx = x + 4; lx < x + w - 2; lx += Math.max(18, (w - 8) / 3)) { rect(lx, y - 5, 3, 2.5, '#2a2d38'); rect(lx + 0.5, y - 3, 2, 1, '#fff6c8'); }
    ctx.textAlign = 'left'; ctx.fillStyle = b.fg; ctx.font = '7px ' + PIX; ctx.fillText(b.a, x + 6, y + 11); ctx.font = '5px ' + PIX; ctx.fillText(b.b, x + 6, y + 19);
  }
  function chipArt(x, y, s, alpha) {
    if (alpha != null) ctx.globalAlpha = alpha;
    rect(x, y, 6 * s, 6 * s, '#2fb866'); rect(x, y, 6 * s, 0.5, '#9dffc6'); rect(x, y, 0.5, 6 * s, '#7cf0ac'); rect(x + 6 * s - 0.5, y, 0.5, 6 * s, '#167a40'); rect(x, y + 6 * s - 0.5, 6 * s, 0.5, '#167a40');
    rect(x + s, y + s, 4 * s, 4 * s, '#0f5a2e'); rect(x + s, y + s, 4 * s, 0.5, '#1f8a4c'); rect(x + 1.5 * s, y + 1.5 * s, 1, 1, '#3fd17a');
    for (let i = 0; i < 4; i++) { const o = (0.75 + i * 1.5) * s; rect(x + o, y - 1.5 * s, 0.5 * s, 1.5 * s, '#f2c14e'); rect(x + o, y + 6 * s, 0.5 * s, 1.5 * s, '#f2c14e'); rect(x - 1.5 * s, y + o, 1.5 * s, 0.5 * s, '#f2c14e'); rect(x + 6 * s, y + o, 1.5 * s, 0.5 * s, '#f2c14e'); }
    ctx.globalAlpha = 1;
  }
  function drawTile(c, x, y, tx, ty, th) {
    const R = (a, b, w, h, col) => { ctx.fillStyle = col; ctx.fillRect(x + a, y + b, w, h); };
    const blink = (n) => ((tx * 7 + ty * 3 + n + Math.floor(frame / 14)) % 7) < 4;
    const hs = hsh(tx, ty);
    switch (c) {
      case '#': case 'R': {
        R(0, 0, 16, 16, th.g);
        bevel(x, y, 16, 16, th.gl, th.gd);
        if (lvl.theme === 'dc') { R(0, 7.5, 16, 0.5, th.gd); R(0, 8, 16, 0.5, th.gl); R(7.5, 0, 0.5, 16, th.gd); R(8, 0, 0.5, 16, th.gl); R(3, 3, 1, 1, th.gd); R(12, 3, 1, 1, th.gd); R(3, 12, 1, 1, th.gd); R(12, 12, 1, 1, th.gd); }
        else for (let k = 0; k < 5; k++) { const sx = 1.5 + ((hs >> (k * 5)) % 13), sy = 5.5 + ((hs >> (k * 5 + 2)) % 9); R(sx, sy, k % 3 ? 0.5 : 1, 0.5, k % 2 ? th.gd : th.gl); }
        const above = tileAt(tx, ty - 1), below = tileAt(tx, ty + 1);
        if (c === '#' && above !== '#') {
          R(0, 0, 16, 4, th.top); R(0, 0, 16, 0.5, th.toph); R(0, 3.5, 16, 0.5, th.topd); R(0, 4, 16, 1, '#00000040'); R(15.5, 0, 0.5, 3.5, th.topd);
          if (lvl.theme === 'valley') { R(2 + (hs % 9), 1.5, 1.5, 0.5, th.topd); if (tx % 4 === 0) R(0, 0.5, 0.5, 3, th.topd); }
          if (lvl.theme === 'launch') for (let i = 0; i < 4; i++) R(i * 4 + ((tx % 2) ? 2 : 0), 0.5, 2, 3, '#f2c14e55');
        }
        if (c === 'R' && below !== 'R') { R(0, 12, 16, 4, th.top); R(0, 12, 16, 0.5, th.toph); R(2, 13, 12, 2, '#0b0e18'); if (tx % 3 === 0) { R(5, 13.5, 6, 1, '#5ff0ff'); R(4, 13, 8, 2, '#5ff0ff33'); } }
        break;
      }
      case 'B': {
        R(0, 0, 16, 16, th.brl);
        const bricks = [[0, 0, 7.5], [8, 0, 8], [0, 8, 3.5], [4, 8, 7.5], [12, 8, 4]];
        bricks.forEach(([bx, by, bw], i) => {
          R(bx, by, bw, 7.5, th.br); R(bx, by, bw, 0.5, th.brh); R(bx, by, 0.5, 7.5, th.brh); R(bx, by + 7, bw, 0.5, th.brs);
          if ((hs >> i) & 1) R(bx + 2, by + 3, 1, 0.5, th.brs);
        });
        R(0, 0, 16, 0.5, '#ffffff38');
        break;
      }
      case 'C': case 'P': {
        const fl = [1, 1, 0.82, 0.62, 0.82][Math.floor(frame / 10) % 5];
        R(0, 0, 16, 16, '#0a1128'); R(0.5, 0.5, 15, 15, '#1d2c5e'); bevel(x + 0.5, y + 0.5, 15, 15, '#4a67c4', '#111a3c');
        R(1.5, 1.5, 13, 13, '#22346e');
        for (const [a, b] of [[1.5, 1.5], [13.5, 1.5], [1.5, 13.5], [13.5, 13.5]]) { R(a, b, 1, 1, '#8fa3d9'); R(a + 0.5, b + 0.5, 0.5, 0.5, '#0a1128'); }
        // Every crate looks the same: a chip on the lid. What is inside is the surprise.
        chipArt(x + 5, y + 5, 1, fl);
        if (Math.floor(frame / 8 + tx) % 24 === 0) R(4, 4, 2, 0.5, '#ffffff');
        break;
      }
      case 'U': R(0, 0, 16, 16, '#11151f'); R(0.5, 0.5, 15, 15, '#262c40'); bevel(x + 0.5, y + 0.5, 15, 15, '#353d56', '#151926');
        for (const [a, b] of [[1.5, 1.5], [13.5, 1.5], [1.5, 13.5], [13.5, 13.5]]) R(a, b, 1, 1, '#4a5270');
        break;
      case 'S':
        R(0, 0, 16, 16, th.std); R(0, 0, 15.5, 15.5, th.st); R(0, 0, 15.5, 0.5, th.sth); R(0, 0, 0.5, 15.5, th.sth);
        R(2.5, 2.5, 11, 11, th.std); R(3, 3, 10, 10, th.st); R(3, 12.5, 10, 0.5, th.sth); R(12.5, 3, 0.5, 10, th.sth);
        R(5, 5, 6, 6, th.sts || th.st); R(5, 5, 6, 0.5, th.std);
        break;
      case 'T': case 't': R(0, 0, 16, 16, '#2b3040'); R(0, 0, 16, 3, '#4a5168'); R(0, 0, 16, 0.5, '#7a83a0'); R(0, 3, 16, 1, '#11141c');
        R(0, 4, 16, 12, '#20253a'); for (let i = 0; i < 4; i++) R(2, 6 + i * 2.5, 12, 1, '#151926');
        if (c === 'T') { R(2, 1, 4, 1, '#ffffff66'); R(0, 0, 0.5, 16, '#5a6280'); } else R(15.5, 0, 0.5, 16, '#11141c');
        break;
      case 'I': case 'i': R(0, 0, 16, 16, '#151924'); R(c === 'I' ? 0 : 15.5, 0, 0.5, 16, c === 'I' ? '#3a4158' : '#0a0c12');
        R(1.5, 2, 13, 4.5, '#1c2130'); R(1.5, 8.5, 13, 4.5, '#1c2130'); R(1.5, 2, 13, 0.5, '#2c3348'); R(1.5, 8.5, 13, 0.5, '#2c3348');
        for (let v = 0; v < 4; v++) { R(9 + v * 1.5, 3, 0.5, 2.5, '#0b0d14'); R(9 + v * 1.5, 9.5, 0.5, 2.5, '#0b0d14'); }
        R(3, 3.5, 1.5, 1.5, blink(0) ? '#3fd17a' : '#173a26'); R(5.5, 3.5, 1.5, 1.5, blink(2) ? '#f2a93b' : '#3a2a12'); R(3, 10, 1.5, 1.5, blink(4) ? '#5ff0ff' : '#163038');
        if (blink(0)) R(2.5, 3, 2.5, 2.5, '#3fd17a33');
        break;
      case 'L': {
        R(0, 0, 16, 16, th.girdd); R(0, 0, 16, 3, th.gird); R(0, 13, 16, 3, th.gird); R(0, 0, 16, 0.5, '#ffb27a'); R(0, 13, 16, 0.5, '#ffb27a'); R(0, 2.5, 16, 0.5, '#7a3208'); R(0, 15.5, 16, 0.5, '#7a3208');
        ctx.fillStyle = th.gird; for (let i = 0; i < 20; i++) { ctx.fillRect(x + i * 0.75, y + 3 + i * 0.5, 1.5, 1); ctx.fillRect(x + 16 - i * 0.75 - 1.5, y + 3 + i * 0.5, 1.5, 1); }
        for (const a of [2, 7.5, 13]) { R(a, 1, 1, 1, '#ffd2b0'); R(a, 14, 1, 1, '#ffd2b0'); }
        if (tileAt(tx - 1, ty) !== 'L') R(0, 0, 2, 16, '#5a2a08'); if (tileAt(tx + 1, ty) !== 'L') R(14, 0, 2, 16, '#5a2a08'); break;
      }
      case 'k': R(5, 0, 1, 16, '#6a6f80'); R(10, 0, 1, 16, '#6a6f80'); R(5, 0, 0.5, 16, '#9aa0b0'); R(10, 0, 0.5, 16, '#9aa0b0');
        ctx.fillStyle = '#6a6f80'; for (let i = 0; i < 16; i += 4) { ctx.fillRect(x + 5, y + i, 6, 1); ctx.fillRect(x + 5 + (i % 8 ? 0 : 0), y + i + 1, 0.5, 3); }
        for (let i = 0; i < 4; i++) { R(5.5 + i * 1.25, i * 4 + 1, 1, 0.5, '#4a4f60'); }
        break;
      default: break;
    }
  }
  function drawTaxi(e, x, y) {
    const d = e.vx > 0 ? 1 : -1;
    ctx.save(); if (e.flip) { ctx.translate(x + 9, y + 6); ctx.scale(1, -1); ctx.translate(-x - 9, -y - 6); }
    if (d < 0) { ctx.translate(x * 2 + 18, 0); ctx.scale(-1, 1); }
    // drawn facing right; mirrored above for a left-going car
    rect(x - 0.5, y + 2.5, 19, 8, '#140c12'); rect(x + 2.5, y - 0.5, 13, 4, '#140c12');
    rect(x, y + 3, 18, 7, '#f4f5f7'); rect(x + 3, y, 12, 4, '#f4f5f7'); rect(x + 3, y, 12, 0.5, '#ffffff');
    rect(x, y + 3, 18, 0.5, '#ffffff'); rect(x, y + 8, 18, 2, '#c9ccd6'); rect(x, y + 9.5, 18, 0.5, '#9aa0ae');
    rect(x + 9.5, y + 1, 5, 2.5, '#1b2433'); rect(x + 4, y + 1, 4.5, 2.5, '#1b2433'); rect(x + 10.5, y + 1, 1, 0.5, '#7fb2ff'); rect(x + 5, y + 1, 1, 0.5, '#7fb2ff');
    rect(x + 8.5, y + 1, 1, 2.5, '#f4f5f7');
    rect(x + 1, y + 5, 16, 0.5, '#e05050'); rect(x + 17, y + 4.5, 1, 2, '#ffe27a'); rect(x + 17.5, y + 4, 2, 3, '#ffe27a44'); rect(x, y + 5, 0.5, 1.5, '#ff4040');
    for (const wo of [2, 12]) { const wx = x + wo; rect(wx, y + 8.5, 4, 3.5, '#111'); rect(wx + 1, y + 9.5, 2, 1.5, '#8a8f9c'); rect(wx + 1.5, y + 10, 1, 0.5, '#d0d4de'); }
    rect(x + 7, y - 3, 4, 3, '#2a2d38'); rect(x + 7, y - 3, 4, 0.5, '#5a6070');
    const sp = Math.floor(frame / 3) % 4; rect(x + 7.5 + sp * 0.75, y - 2.5, 1, 1, frame % 8 < 4 ? '#ff3b3b' : '#3b8bff');
    ctx.restore();
  }
  function txt(s, x, y, size = 8, col = '#fff', al = 'left', sh = true) { ctx.font = size + 'px ' + PIX; ctx.textAlign = al; if (sh) { ctx.fillStyle = '#000a'; ctx.fillText(s, x + 1, y + 1); } ctx.fillStyle = col; ctx.fillText(s, x, y); }
  function banner(a, b) {
    const g2 = ctx.createLinearGradient(0, 84, 0, 134); g2.addColorStop(0, '#000000cc'); g2.addColorStop(1, '#000000aa');
    ctx.fillStyle = g2; ctx.fillRect(0, 84, VW, 50); rect(0, 84, VW, 0.5, '#3fd17a'); rect(0, 133.5, VW, 0.5, '#3fd17a');
    txt(a, VW / 2, 106, a.length > 16 ? 9 : 12, '#3fd17a', 'center'); if (b) txt(b, VW / 2, 122, 7, '#fff', 'center');
  }
  function hud() {
    const hg = ctx.createLinearGradient(0, 0, 0, 34); hg.addColorStop(0, '#00000066'); hg.addColorStop(1, '#00000000');
    ctx.fillStyle = hg; ctx.fillRect(0, 0, VW, 34);
    txt('DARIO', 12, 14, 8); txt('x' + lives, 12, 25, 8, '#ffd27a');
    chipArt(111.5, 17, 1);
    txt('GPUs', 124, 14, 6, '#bff5d2'); txt('x' + String(gpus).padStart(2, '0'), 124, 25, 8);
    txt('WORLD', 210, 14, 8); txt(lvl.num, 218, 25, 8);
    txt('RUN', 318, 14, 8); txt(fmtRun(Math.round(runFrames / 6)), 318, 25, 8, '#fff');
  }
  function drawIntro() {
    ctx.fillStyle = '#07090f'; ctx.fillRect(0, 0, VW, VH);
    txt('WORLD ' + lvl.num, VW / 2, 72, 12, '#fff', 'center');
    txt(lvl.name, VW / 2, 92, 10, lvl.theme === 'valley' ? '#ffd27a' : lvl.theme === 'dc' ? '#5ff0ff' : '#ff9e6b', 'center');
    txt('MISSION: ' + lvl.tag, VW / 2, 108, 6, '#3fd17a', 'center');
    const s = SPR[p.big ? 1 : 0].stand; blit(s, VW / 2 - 34, 146 - s.h * 1.5, false, 1.5);
    txt('x ' + lives, VW / 2 + 4, 142, 10, '#fff', 'left');
    txt('RUN ' + fmtRun(Math.round(runFrames / 6)), VW / 2, 180, 7, '#9aa3bb', 'center');
  }
  function drawReady() {
    const gr = ctx.createLinearGradient(0, 0, 0, VH); gr.addColorStop(0, '#0b0f1e'); gr.addColorStop(1, '#1d2a4a'); ctx.fillStyle = gr; ctx.fillRect(0, 0, VW, VH);
    for (let i = 0; i < 12; i++) { const x = i * 36, h = 30 + (i * 29) % 50; rect(x, 184 - h, 30, h, '#16203a'); rect(x, 184 - h, 30, 0.5, '#2a3a60'); for (let yy = 188 - h; yy < 180; yy += 6) for (let xx = x + 3; xx < x + 27; xx += 5) if ((xx * 3 + yy) % 7 < 2) rect(xx, yy, 2, 2, '#ffe9a855'); }
    rect(0, 184, VW, 40, '#2b3040'); rect(0, 184, VW, 3, '#8c90a0'); rect(0, 184, VW, 0.5, '#c9ccd6');
    txt('DARIO', VW / 2, 70, 28, '#f2a93b', 'center');
    txt('RACE TO THE FRONTIER', VW / 2, 90, 8, '#3fd17a', 'center');
    blit(SPR[0].stand, VW / 2 - 24, 136, false, 3);
  }
  // The win screen: the run is over and Dario has taken the whole market.
  function drawWin() {
    const gr = ctx.createLinearGradient(0, 0, 0, VH); gr.addColorStop(0, '#04110a'); gr.addColorStop(1, '#0b2a1a'); ctx.fillStyle = gr; ctx.fillRect(0, 0, VW, VH);
    for (let i = 0; i < 90; i++) { const x = half((i * 53 + frame * (1 + (i % 3)) * 0.5) % VW), y = (i * 37) % VH; ctx.fillStyle = i % 4 ? '#3fd17a44' : '#f2c14e66'; ctx.fillRect(x, y, i % 5 ? 1 : 1.5, i % 5 ? 1 : 1.5); }
    txt('AGI ACHIEVED', VW / 2, 34, 8, '#9ff0c0', 'center');
    txt('DARIO NOW CONTROLS', VW / 2, 66, 14, '#f2a93b', 'center');
    txt('ALL SOFTWARE BUSINESS', VW / 2, 88, 12, '#ffffff', 'center');
    txt('GLOBALLY', VW / 2, 110, 16, '#3fd17a', 'center');
    const bob = Math.abs(Math.sin(frame / 10)) * 10;
    blit(SPR[1][bob > 5 ? 'jump' : 'stand'], VW / 2 - 16, half(120 - bob), false, 2);
    txt('RUN ' + fmtRun(Math.round(runFrames / 6)), VW / 2, 192, 9, '#fff', 'center');
    txt(splits.map(fmtRun).join('  ·  '), VW / 2, 208, 6, '#9aa3bb', 'center');
  }
  function draw() {
    ctx.setTransform(SP, 0, 0, SP, 0, 0);
    ctx.imageSmoothingEnabled = false;
    if (st === 'ready' || !lvl) { drawReady(); return; }
    if (st === 'intro') { drawIntro(); if (paused) banner('PAUSED', 'ANY KEY OR TAP RESUMES'); return; }
    const th = TH[lvl.theme];
    drawBG(th);
    const cx = Math.round(cam * SP) / SP;
    lvl.bill.forEach((b) => drawBill(b, cx));
    const x0 = Math.floor(cx / T), x1 = Math.min(W - 1, x0 + Math.ceil(VW / T) + 1);
    for (let ty = 0; ty < H; ty++) for (let tx = x0; tx <= x1; tx++) {
      const c = g[ty][tx]; if (c === '.') continue;
      let oy = 0; const b = bumps.find((bb) => bb.tx === tx && bb.ty === ty); if (b) oy = half(-Math.sin(((8 - b.t) / 8) * Math.PI) * 5);
      drawTile(c, tx * T - cx, ty * T + oy, tx, ty, th);
    }
    { const gx = gate.x - cx, gy = gate.y;
      for (const px of [gx - 10, gx + 20]) { rect(px, gy, 6, 64, '#1b2030'); rect(px, gy, 0.5, 64, '#4a5270'); rect(px + 5.5, gy, 0.5, 64, '#0b0d14'); for (let yy = gy + 6; yy < gy + 64; yy += 10) { rect(px + 1.5, yy, 3, 1, '#3fd17a'); rect(px + 1.5, yy, 3, 0.5, '#b9ffd6'); } }
      const glow = 0.3 + 0.22 * Math.sin(frame * 0.1); ctx.fillStyle = `rgba(63,209,122,${glow})`; ctx.fillRect(gx - 4, gy + 4, 24, 60);
      ctx.fillStyle = `rgba(185,255,214,${glow * 0.8})`; for (let yy = gy + 4 + ((frame >> 1) % 4); yy < gy + 64; yy += 4) ctx.fillRect(gx - 4, yy, 24, 0.5);
      rect(gx - 14.5, gy - 12.5, 45, 15, '#0a0c10'); rect(gx - 13, gy - 11, 42, 12, '#3fd17a'); rect(gx - 13, gy - 11, 42, 0.5, '#b9ffd6'); rect(gx - 13, gy + 0.5, 42, 0.5, '#1f8a4c');
      ctx.font = '6px ' + PIX; ctx.textAlign = 'center'; ctx.fillStyle = '#062b17'; ctx.fillText(lvl.gateTxt, gx + 8, gy - 3); }
    plats.forEach((q) => {
      const x = half(q.x - cx), y = half(q.y);
      rect(x - 0.5, y - 0.5, q.w + 1, 9, '#140c12'); rect(x, y, q.w, 8, '#3b3f4c'); rect(x, y, q.w, 5, '#9aa0b0'); rect(x, y, q.w, 0.5, '#d6dae4'); rect(x, y + 4.5, q.w, 0.5, '#6a7080');
      for (let i = 0; i < q.w; i += 6) { rect(x + i + 0.5, y + 1, 3, 3, '#f2c14e'); rect(x + i + 0.5, y + 1, 3, 0.5, '#ffe9a8'); rect(x + i + 2.5, y + 1, 1, 3, '#2a2d38'); }
      rect(x + 4, y + 8, 1, 4, '#222'); rect(x + q.w - 5, y + 8, 1, 4, '#222'); rect(x + 3.5, y + 11.5, 2, 1, (frame >> 3) % 2 ? '#ff8a3d' : '#ffd27a'); rect(x + q.w - 5.5, y + 11.5, 2, 1, (frame >> 3) % 2 ? '#ffd27a' : '#ff8a3d');
    });
    parts.forEach((q) => { if (q.k === 'smoke') { const a = q.t / 60, r = 2 + (30 - q.t) * 0.12; ctx.fillStyle = `rgba(230,230,240,${a})`; ctx.fillRect(half(q.x - cx - r / 2 + 2), half(q.y - r / 2 + 2), half(r * 2), half(r * 2)); } });
    for (const e of ents) {
      const x = half(e.x - cx), y = half(e.y);
      if (x < -30 || x > VW + 30) continue;
      if (e.k === 'chip') { const bob = half(Math.sin((frame + e.x) / 12) * 1); chipArt(x + 2, y + 2 + bob, 1); if (Math.floor((frame + e.x) / 6) % 12 === 0) { rect(x + 1, y + 1 + bob, 2, 0.5, '#fff'); rect(x + 1.75, y + 0.25 + bob, 0.5, 2, '#fff'); } continue; }
      if (e.k === 'shield') { blit(shield, x - 1, y - 2); continue; }
      if (e.k === 'rocket') {
        if (y > VH + 10) continue;
        rect(x - 0.5, y + 1.5, 9, 19, '#140c12');
        rect(x, y + 6, 8, 14, '#eceef3'); rect(x + 1, y + 2, 6, 4, '#eceef3'); rect(x + 6, y + 2, 1, 18, '#b8bccb'); rect(x + 0.5, y + 2, 0.5, 18, '#ffffff');
        rect(x + 2, y, 4, 2, '#d23b3b'); rect(x + 2.5, y, 1, 0.5, '#ff9a9a');
        rect(x + 2, y + 8.5, 4, 3.5, '#1b2433'); rect(x + 2.5, y + 9, 1, 1, '#7fb2ff');
        rect(x + 1, y + 14, 6, 0.5, '#9aa0ae');
        rect(x - 2, y + 15, 2, 6, '#d23b3b'); rect(x + 8, y + 15, 2, 6, '#d23b3b'); rect(x - 2, y + 15, 0.5, 6, '#ff9a9a');
        if (e.vy < 0) { rect(x + 1, y + 20, 6, 3, '#fff2b0'); rect(x + 1.5, y + 22, 5, 3, '#ffd27a'); rect(x + 2, y + 24, 4, frame % 4 < 2 ? 5 : 3, '#ff8a3d'); rect(x + 3, y + 26, 2, frame % 4 < 2 ? 5 : 2, '#ff5a3d'); }
        continue;
      }
      const fr = Math.floor(frame / 10) % 2;
      if (e.k === 'bot') {
        if (e.dead && !e.flip) blit(botFlat, x - 1, y - 2);
        else if (e.flip) { ctx.save(); ctx.translate(x + 7, y + 7); ctx.scale(1, -1); blit(bot[0], -8, -9); ctx.restore(); }
        else blit(bot[fr], x - 1, y - 2, e.vx > 0);
        if (e.tk && !e.flip) {
          ctx.font = '5px ' + PIX; ctx.textAlign = 'center';
          const tw = ctx.measureText(e.tk).width + 4, ty = e.dead ? y + 4 : y - 6;
          rect(half(x + 7 - tw / 2) - 0.5, ty - 6.5, Math.ceil(tw) + 1, 9, '#ff6b6b88');
          ctx.fillStyle = '#0b0d14ee'; ctx.fillRect(half(x + 7 - tw / 2), ty - 6, Math.ceil(tw), 8);
          ctx.fillStyle = '#ff6b6b'; ctx.fillText(e.tk, x + 7, ty);
        }
      } else drawTaxi(e, x, y);
    }
    if (!(p.inv > 0 && Math.floor(p.inv / 4) % 2)) {
      const set = SPR[p.big]; let s = set.stand;
      if (st === 'dying' || !p.on) s = set.jump;
      else if (Math.abs(p.vx) > 0.1) s = [set.walk1, set.walk2][Math.floor(p.anim) % 2];
      blit(s, half(p.x - cx - 2), half(p.y + p.h - s.h), p.face < 0);
    }
    parts.forEach((q) => { const x = half(q.x - cx), y = half(q.y); if (q.k === 'chunk') { rect(x, y, 5, 5, th.br); rect(x, y, 5, 0.5, th.brh); rect(x, y + 4, 5, 1, th.brl); } else if (q.k === 'chippop') chipArt(x + 2, y + 2, 1); });
    ctx.font = '5px ' + PIX; ctx.textAlign = 'center';
    pops.forEach((q) => { ctx.fillStyle = '#000a'; ctx.fillText(q.s, half(q.x - cx + 9), half(q.y) + 1); ctx.fillStyle = '#fff'; ctx.fillText(q.s, half(q.x - cx + 8), half(q.y)); });
    hud();
    if (st === 'clear') banner(lvl.clear, 'SPLIT ' + fmtRun(splits[splits.length - 1] || 0));
    if (st === 'done') {
      if (splits.length === DAY.length) { drawWin(); return; }
      banner('GAME OVER', 'A RIVAL SHIPPED FIRST · RUN ' + fmtRun(Math.round(runFrames / 6)));
    }
    if (paused) banner('PAUSED', 'ANY KEY OR TAP RESUMES');
  }

  /* ---------- loop ---------- */
  let raf = 0, last = 0, accum = 0, tickN = 0, dead = false;
  function loop(now) {
    if (dead) return;
    if (!last) last = now;
    accum += Math.min(100, now - last); last = now;
    while (accum >= 1000 / 60) { update(); accum -= 1000 / 60; if (++tickN % 6 === 0) report(); }
    draw();
    raf = requestAnimationFrame(loop);
  }
  raf = requestAnimationFrame(loop);

  /* ---------- keyboard ---------- */
  const KM = { ArrowLeft: 'l', KeyA: 'l', ArrowRight: 'r', KeyD: 'r', Space: 'j', ArrowUp: 'j', KeyW: 'j', KeyZ: 'j', ShiftLeft: 'run', ShiftRight: 'run', KeyX: 'run' };
  function onDown(e) {
    const tag = e.target && e.target.tagName;
    if (tag && /input|textarea|select/i.test(tag)) return;
    if (st === 'ready' || st === 'done') return;
    if (e.code === 'KeyP' || e.code === 'Escape') { api.togglePause(); e.preventDefault(); return; }
    if (e.code === 'KeyM') { api.setMusic(!musicOn); return; }
    const k = KM[e.code]; if (!k) return; e.preventDefault();
    if (paused) { api.resume(); }
    if (k === 'j' && !keys.j) jEdge = 1;
    keys[k] = 1;
  }
  function onUp(e) { const k = KM[e.code]; if (k) keys[k] = 0; }
  function onBlur() { keys.l = keys.r = keys.j = keys.run = 0; }
  window.addEventListener('keydown', onDown);
  window.addEventListener('keyup', onUp);
  window.addEventListener('blur', onBlur);

  const api = {
    start() {
      ensureAC();
      score = 0; gpus = 0; lives = 3; deaths = 0; li = 0; p = null; loadedLi = -1; maxX = 0; runFrames = 0; levelStartFrames = 0; splits = []; ended = false; paused = false;
      mI = 0; mPos = 0; mNext = 0; curTrack = null;
      load(0); st = 'intro'; timer = 0;
    },
    press(k, down) {
      if (st === 'ready' || st === 'done') return;
      if (down && paused) api.resume();
      if (k === 'j' && down && !keys.j) jEdge = 1;
      keys[k] = down ? 1 : 0;
    },
    setRunLock(on) { runLock = !!on; },
    pause() { if (st !== 'ready' && st !== 'done') paused = true; },
    resume() { paused = false; ensureAC(); },
    togglePause() { if (paused) api.resume(); else api.pause(); },
    isPaused() { return paused; },
    setMusic(on) { musicOn = !!on; if (on) ensureAC(); return musicOn; },
    musicOn() { return musicOn; },
    setCanvas(cv) { if (cv && cv !== canvas) bindCanvas(cv); },
    peek() { return lvl ? result(false) : null; },
    state() { return { st, level: li, tenths: Math.round(runFrames / 6), lives, gpus, paused }; },
    destroy() {
      dead = true; cancelAnimationFrame(raf); clearInterval(musicIv);
      window.removeEventListener('keydown', onDown); window.removeEventListener('keyup', onUp); window.removeEventListener('blur', onBlur);
      try { if (AC) AC.close(); } catch (e) {}
    },
  };
  return api;
}
