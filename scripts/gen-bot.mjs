// scripts/gen-bot.mjs: deals Bot's bank (app/bot/puzzles.js) by date.
//   node scripts/gen-bot.mjs --until 2027-02-28 [--dry]
// Keeps every existing row byte for byte and appends one board per missing
// date after the last. Each board is BUILT from a program: a random program is
// walked on an empty plane, laying each tile the walk needs (Forward lays one
// at the same height, Jump one a level up, a drop down, or a gap to clear),
// with a lamp wherever it says Light up. A few decoy tiles go round the walk.
// Then scripts/bot-search.mjs tries every shorter program the board allows,
// and par is the shortest that wins (the designed one or anything shorter).
//
// Bands by weekday (slots, par, board):
//   Mon/Tue gentle    Main 8, P1 6; par 5-6; up to 5 x 5; 3-4 lamps
//   Wed/Thu moderate  Main 8, P1 6; par 6-7; up to 6 x 6; 3-5 lamps
//   Fri/Sat tough     Main 8, P1 6; par 7-9; up to 6 x 6; 4-6 lamps
//   Sun     sunday    Main 6, P1 5, P2 5, P3 4; par 9-12; up to 7 x 7; 5-8 lamps
// Weekday par is EXHAUSTIVE (no program of par-1 commands wins: `proven` =
// par-1). Sunday's search space is too big past seven commands, so its par is
// the shortest the generator found and `proven` = 7 (nothing of 7 or fewer wins).
// Every board must need a P row: no Main-only program of 8 or fewer wins.
// VARIETY: on Tuesday, Thursday and Saturday the par program may not be the
// plain self-call (Main = "1", P1 ending in "1"), so the week is not one trick.
import fs from 'fs';
import { run, modelOf, wins, DX, DY, CALL_OF } from '../lib/bot-engine.js';
import { shortest } from './bot-search.mjs';

const FILE = new URL('../app/bot/puzzles.js', import.meta.url).pathname;
const arg = (k) => { const i = process.argv.indexOf(k); return i > 0 ? process.argv[i + 1] : null; };
const until = arg('--until');
const dry = process.argv.includes('--dry');

export const BANDS = {
  gentle: { slots: { main: 8, p1: 6 }, par: [5, 6], size: 5, min: 3, tiles: 7, lamps: [3, 4] },
  moderate: { slots: { main: 8, p1: 6 }, par: [6, 7], size: 6, min: 4, tiles: 9, lamps: [3, 5] },
  tough: { slots: { main: 8, p1: 6 }, par: [7, 9], size: 6, min: 5, tiles: 11, lamps: [4, 6] },
  sunday: { slots: { main: 6, p1: 5, p2: 5, p3: 4 }, par: [9, 12], size: 7, min: 6, tiles: 16, lamps: [5, 8] },
};
export const SUNDAY_PROOF = 7;
export const noPlainCall = (iso) => [2, 4, 6].includes(new Date(iso + 'T12:00:00Z').getUTCDay());
export const bandOf = (iso) => ['sunday', 'gentle', 'gentle', 'moderate', 'moderate', 'tough', 'tough'][new Date(iso + 'T12:00:00Z').getUTCDay()];

const TITLES = ['Spiral Stair', 'Terraces', 'Quarry', 'Ziggurat', 'Rooftops', 'Mesa', 'Old Pier', 'Garden Steps', 'Canal Locks', 'Watchtower', 'Plaza', 'Rice Fields', 'Courtyard', 'Lighthouse', 'Switchbacks', 'Castle Walls', 'Dam', 'Market Square', 'Amphitheater', 'Cliff Path', 'Tide Pools', 'Bell Tower', 'Viaduct', 'Orchard', 'Boardwalk', 'Monastery', 'Mine Shaft', 'Harbor Wall', 'Step Well', 'Signal Hill', 'Ramparts', 'Sand Dunes', 'Glacier', 'Rope Bridge', 'Cloister', 'Granary', 'Observatory', 'Pyramid', 'Dockyard', 'Hanging Gardens', 'Fire Lookout', 'Canyon', 'Aqueduct', 'Ruins', 'Salt Flats', 'Mill Race', 'Shipyard', 'Arena', 'Lagoon', 'Citadel'];

function mulberry(a) { return () => { a |= 0; a = (a + 0x6d2b79f5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
const hash = (s) => { let h = 2166136261; for (const c of s) h = Math.imul(h ^ c.charCodeAt(0), 16777619); return h >>> 0; };

// a random program in the band's shape
function randomProgram(rnd, band) {
  const pick = (a) => a[Math.floor(rnd() * a.length)];
  const body = (n, extra = '') => {
    for (;;) {
      let s = '';
      for (let i = 0; i < n; i++) s += pick('FFFJJJLRO' + extra);
      if (/LR|RL|LLL|RRR|OO/.test(s)) continue;
      if (!s.includes('O') || !/[FJ]/.test(s)) continue;
      return s;
    }
  };
  if (band !== 'sunday') {
    const n = 3 + Math.floor(rnd() * 3);
    const p1 = body(n);
    const shape = rnd();
    if (shape < 0.45) return { main: '1', p1: p1 + '1' }; // self-calling
    if (shape < 0.7) { const pre = pick(['L', 'R', 'F', 'J']); return { main: pre + '1', p1: p1 + '1' }; }
    const k = 3 + Math.floor(rnd() * 3); let main = '';
    for (let i = 0; i < k; i++) main += i && rnd() < 0.3 ? pick(['L', 'R']) + '1' : '1';
    return { main: main.slice(0, 8), p1 };
  }
  const p1 = body(2 + Math.floor(rnd() * 3));
  let p2 = '';
  while (!/1/.test(p2) || /LR|RL/.test(p2)) { p2 = ''; const n = 3 + Math.floor(rnd() * 3); for (let i = 0; i < n; i++) p2 += pick(['1', '1', 'F', 'J', 'L', 'R']); }
  const useP3 = rnd() < 0.5;
  const p3 = useP3 ? pick(['22L', '22R', '2L2', '2R2', 'J22', 'F2L']) : '';
  const main = useP3 ? pick(['33', '3L3', '33R', 'J33']) : pick(['222', '22L2', '2R22', '2222']);
  return { main, p1, p2, p3 };
}

// walk the program on an empty plane, laying the tiles it needs
function build(rnd, prog, band, B) {
  const tiles = new Map(), gaps = new Set(), lampAt = [], lampSet = new Set();
  const key = (x, y) => x + ',' + y;
  let x = 0, y = 0, d = Math.floor(rnd() * 4), h = 0;
  tiles.set(key(0, 0), 0);
  const d0 = d;
  const want = B.lamps[0] + Math.floor(rnd() * (B.lamps[1] - B.lamps[0] + 1));
  const stack = [[prog.main, 0]]; let steps = 0;
  while (stack.length) {
    const t = stack[stack.length - 1];
    if (t[1] >= t[0].length) { stack.pop(); continue; }
    const c = t[0][t[1]++];
    if (CALL_OF[c]) { if (stack.length > 30) return null; stack.push([prog[CALL_OF[c]] || '', 0]); continue; }
    if (++steps > 140) return null;
    const nx = x + DX[d], ny = y + DY[d], nk = key(nx, ny);
    if (c === 'F') {
      if (gaps.has(nk)) return null;
      if (tiles.has(nk)) { if (tiles.get(nk) !== h) return null; } else tiles.set(nk, h);
      x = nx; y = ny;
    } else if (c === 'J') {
      if (tiles.has(nk)) { const nh = tiles.get(nk); if (nh === h || nh > h + 1) return null; x = nx; y = ny; h = nh; }
      else if (gaps.has(nk)) {
        const fx = nx + DX[d], fy = ny + DY[d], fk = key(fx, fy);
        if (tiles.has(fk)) { const fh = tiles.get(fk); if (fh > h + 1) return null; h = fh; } else { if (gaps.has(fk)) return null; tiles.set(fk, h); }
        x = fx; y = fy;
      } else {
        const r = rnd();
        if (r < 0.22) { // clear a gap
          const fx = nx + DX[d], fy = ny + DY[d], fk = key(fx, fy);
          if (tiles.has(fk) || gaps.has(fk)) return null;
          gaps.add(nk); const fh = Math.max(0, h + (rnd() < 0.5 ? 0 : 1)); tiles.set(fk, fh); x = fx; y = fy; h = fh;
        } else {
          const nh = r < 0.62 || h === 0 ? h + 1 : Math.max(0, h - 1 - (rnd() < 0.3 ? 1 : 0));
          if (nh === h || nh > 9) return null;
          tiles.set(nk, nh); x = nx; y = ny; h = nh;
        }
      }
    } else if (c === 'L') d = (d + 3) % 4;
    else if (c === 'R') d = (d + 1) % 4;
    else if (c === 'O') {
      const k = key(x, y);
      if (lampSet.has(k)) return null; // would switch a lamp back off
      lampSet.add(k); lampAt.push([x, y]);
      if (lampAt.length === want) break;
    }
  }
  if (lampAt.length < B.lamps[0]) return null;
  // decoys: a few tiles beside the walk, never on a cleared gap
  const cells = [...tiles.keys()].map((k) => k.split(',').map(Number));
  let nDecoy = Math.floor(rnd() * 4);
  for (let i = 0; i < nDecoy * 3 && i < 40; i++) {
    const [cx, cy] = cells[Math.floor(rnd() * cells.length)]; const dd = Math.floor(rnd() * 4);
    const k = key(cx + DX[dd], cy + DY[dd]);
    if (tiles.has(k) || gaps.has(k)) continue;
    tiles.set(k, Math.max(0, tiles.get(key(cx, cy)) + Math.floor(rnd() * 3) - 1));
    if (--nDecoy < 0) break;
  }
  // normalize
  const all = [...tiles.keys()].map((k) => k.split(',').map(Number));
  const xs = all.map((p) => p[0]), ys = all.map((p) => p[1]);
  const x0 = Math.min(...xs), y0 = Math.min(...ys), W = Math.max(...xs) - x0 + 1, H = Math.max(...ys) - y0 + 1;
  if (W > B.size || H > B.size || W < 3 || H < 3 || Math.max(W, H) < B.min) return null;
  const hmin = Math.min(...tiles.values());
  const rows = [];
  for (let yy = 0; yy < H; yy++) {
    let s = '';
    for (let xx = 0; xx < W; xx++) { const k = key(xx + x0, yy + y0); s += tiles.has(k) ? String(tiles.get(k) - hmin) : '.'; }
    rows.push(s);
  }
  if (rows.join('').replace(/\./g, '').length < B.tiles) return null;
  if (Math.max(...tiles.values()) - hmin > 6) return null;
  return { rows, start: [-x0, -y0, d0], lamps: lampAt.map(([a, b]) => [a - x0, b - y0]) };
}

const total = (p) => (p.main || '').length + (p.p1 || '').length + (p.p2 || '').length + (p.p3 || '').length;
const clean = (p, slots) => { const o = {}; for (const r of Object.keys(slots)) o[r] = p[r] || ''; return o; };
const fitsSlots = (p, slots) => Object.entries(p).every(([r, s]) => s.length <= (slots[r] || 0));

export function makeBoard(iso, usedTitles) {
  const band = bandOf(iso), B = BANDS[band];
  for (let attempt = 0; attempt < 4000; attempt++) {
    const seed = hash(iso + ':' + attempt);
    const rnd = mulberry(seed);
    const prog = clean(randomProgram(rnd, band), B.slots);
    if (!fitsSlots(prog, B.slots)) continue;
    if (noPlainCall(iso) && prog.main === '1') continue;
    const designed = total(prog);
    if (designed < B.par[0]) continue;
    const g = build(rnd, prog, band, B);
    if (!g) continue;
    const board = { ...g, slots: B.slots };
    if (!run(board, prog, { trace: false }).won) continue;
    // no Main-only program of 8 or fewer may win (a P row has to matter)
    const mainOnly = { ...board, slots: { main: 8 } };
    if (shortest(mainOnly, 8)) continue;
    let par = designed, sol = prog, proven;
    if (band === 'sunday') {
      if (shortest(board, SUNDAY_PROOF)) continue; // the band wants long programs
      proven = SUNDAY_PROOF;
    } else {
      const s = shortest(board, designed - 1);
      if (s) { par = s.total; sol = clean(s.prog, B.slots); }
      proven = par - 1;
    }
    if (par < B.par[0] || par > B.par[1]) continue;
    if (noPlainCall(iso) && sol.main === '1') continue;
    const title = TITLES.find((t) => !usedTitles.slice(-30).includes(t)) || TITLES[attempt % TITLES.length];
    return { band, title, ...board, par, proven, sol, seed: `${iso}:${attempt}` };
  }
  throw new Error('no board for ' + iso);
}

function addDays(iso, n) { const d = new Date(iso + 'T12:00:00Z'); d.setUTCDate(d.getUTCDate() + n); return d.toISOString().slice(0, 10); }
const label = (iso) => new Date(iso + 'T12:00:00Z').toLocaleDateString('en-US', { timeZone: 'UTC', month: 'long', day: 'numeric', year: 'numeric' });
const quizId = (iso) => { const [y, m, d] = iso.split('-'); return `bot-${+m}-${+d}-${y.slice(2)}`; };

if (until) {
  const src = fs.readFileSync(FILE, 'utf8');
  const { PUZZLES } = await import(FILE + '?' + Date.now());
  const last = PUZZLES[PUZZLES.length - 1];
  const used = PUZZLES.map((p) => p.title);
  const rowsOut = [];
  for (let iso = addDays(last.live, 1), num = last.num + 1; iso <= until; iso = addDays(iso, 1), num++) {
    const t0 = Date.now();
    const b = makeBoard(iso, used);
    used.push(b.title);
    const row = { num, quizId: quizId(iso), live: iso, dateLabel: label(iso), ...(b.band === 'sunday' ? { sunday: true } : {}), ...b };
    rowsOut.push(JSON.stringify(row));
    console.log(`${iso} ${b.band.padEnd(8)} par ${b.par} ${b.rows[0].length}x${b.rows.length} lamps ${b.lamps.length} ${b.title} (${Date.now() - t0}ms)`);
  }
  if (!dry && rowsOut.length) {
    const end = src.lastIndexOf('];');
    fs.writeFileSync(FILE, src.slice(0, end) + rowsOut.map((r) => '  ' + r + ',\n').join('') + src.slice(end));
    console.log(`gen-bot: appended ${rowsOut.length} boards through ${until}`);
  }
}
