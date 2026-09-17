// scripts/gen-yose.mjs — builds app/yose/puzzles.js, the daily Go endgame.
//
//   node scripts/gen-yose.mjs probe <weekday 0-6> <tries> [seed]
//   node scripts/gen-yose.mjs day <YYYY-MM-DD> <num> > dir/<date>.json
//   node scripts/gen-yose.mjs bank <dir> > app/yose/puzzles.js
//
// Each date is generated on its own, from a seed derived from the date, so the
// days can run in parallel (`xargs -P`) and any one day can be regenerated
// without disturbing the rest. `bank` stitches the day files together.
//
// HOW A BOARD IS MADE.
//   1. Split the board in two with a wandering line (a random walk of column
//      heights), then turn it any of the eight ways and pick which side is Black.
//   2. Measure each point's distance to the other side. Distance 1 and 2 are
//      stones (an outer and an inner wall), 3 and beyond are that side's
//      territory. The board is now finished and worth nothing to anybody.
//   3. LIFT stones off the OUTER wall, one at a time, to open points, with a
//      bias toward lifting next to a point already open, so the open points
//      cluster into local fights rather than scattering into lone dame. A lift
//      is kept only if the SHAPE CHECK still holds: every stone that is not on
//      an open point belongs to a group touching its own territory (so it can
//      never be captured) and no group is left without a liberty.
//   4. Drop a few LOOSE stones: an enemy stone on an open point, pressed
//      against a wall. These are what make the endgame more than counting dame.
//   5. SOLVE every line with no pruning (lib/yose-core.js), ko rule included,
//      and throw the board away if any line repeats a whole position.
//   6. Keep it only if the day's spec holds (below). Komi = value - 0.5.
//
// THE RAMP is the board, the number of open points, how few first moves still
// win, and how many single-answer turns the winning line asks for. Every figure
// was set from a measured sample (a few hundred boards per shape), not guessed:
// on a 7x7 with 8 open points about one board in fifteen passes Wednesday's
// test, on an 8x8 with 10 about one in two hundred passes Saturday's.
//   Mon  7x7,  6 open,  1 or 2 winning first moves, >= 1 forced decision
//   Tue  7x7,  7 open,  1 or 2 winning first moves, >= 1 forced decision
//   Wed  7x7,  8 open,  exactly 1 winning first move, >= 2 forced decisions
//   Thu  7x7,  9 open,  exactly 1, >= 2 forced decisions
//   Fri  8x8, 10 open,  exactly 1, >= 2 forced decisions
//   Sat  8x8, 10 open,  exactly 1, >= 3 forced decisions
//   Sun  9x9, 11 open,  exactly 1, >= 3 forced decisions   (Sunday Edition)
// A "forced decision" is a Black turn on the main line with at least two
// choices where exactly one keeps the win. Passing is always a choice and never
// the winning first move. At least two first moves (pass included) must lose.
// The root value (and so the komi) is held within 9 points either way on the
// weekday boards and 11 on Sunday, so the split is never lopsided.
import fs from 'fs';
import { fileURLToPath } from 'url';
import { makeYose, CycleAbort, BLACK, WHITE, neighborsTable } from '../lib/yose-core.js';

export const SPEC = {
  1: { n: 7, open: 6, maxWin: 2, forced: 1, maxKomi: 9 },
  2: { n: 7, open: 7, maxWin: 2, forced: 1, maxKomi: 9 },
  3: { n: 7, open: 8, maxWin: 1, forced: 2, maxKomi: 9 },
  4: { n: 7, open: 9, maxWin: 1, forced: 2, maxKomi: 9 },
  5: { n: 8, open: 10, maxWin: 1, forced: 2, maxKomi: 9 },
  6: { n: 8, open: 10, maxWin: 1, forced: 3, maxKomi: 9 },
  0: { n: 9, open: 11, maxWin: 1, forced: 3, maxKomi: 11 },
};

function rng(seed) {
  let s = (seed >>> 0) || 1;
  return () => { s ^= s << 13; s >>>= 0; s ^= s >>> 17; s ^= s << 5; s >>>= 0; return s / 4294967296; };
}
const pick = (rand, arr) => arr[Math.floor(rand() * arr.length)];

function transform(n, t, r, c) {
  // t in 0..7: the eight symmetries of the square
  let rr = r, cc = c;
  if (t & 1) cc = n - 1 - cc;
  if (t & 2) rr = n - 1 - rr;
  if (t & 4) [rr, cc] = [cc, rr];
  return rr * n + cc;
}

// Steps 1-2: side (0 = the side that will be Black, 1 = White) and distance.
function split(n, rand) {
  const side = new Int8Array(n * n);
  const h = [];
  let cur = Math.floor(n / 2) + (rand() < 0.5 ? 0 : -1);
  for (let c = 0; c < n; c++) {
    h.push(cur);
    const step = rand();
    cur += step < 0.3 ? -1 : step > 0.7 ? 1 : 0;
    cur = Math.max(2, Math.min(n - 3, cur));
  }
  const t = Math.floor(rand() * 8);
  const flip = rand() < 0.5 ? 1 : 0;
  for (let r = 0; r < n; r++) for (let c = 0; c < n; c++) {
    side[transform(n, t, r, c)] = ((r < h[c]) ? 1 : 0) ^ flip;
  }
  const nb = neighborsTable(n);
  const dist = new Int8Array(n * n).fill(99);
  const q = [];
  for (let i = 0; i < n * n; i++) if (nb[i].some((j) => side[j] !== side[i])) { dist[i] = 1; q.push(i); }
  for (let k = 0; k < q.length; k++) {
    const p = q[k];
    for (const j of nb[p]) if (side[j] === side[p] && dist[j] > dist[p] + 1) { dist[j] = dist[p] + 1; q.push(j); }
  }
  return { side, dist, nb };
}

const CH = { stone: ['X', 'O'], terr: ['x', 'o'] };

function toRows(n, cells) {
  const rows = [];
  for (let r = 0; r < n; r++) rows.push(cells.slice(r * n, r * n + n).join(''));
  return rows;
}

// The shape check. Every group holding a stone NOT on an open point must touch
// its own territory, and no group may be without a liberty.
function shapeOk(n, nb, cells, openSet) {
  const seen = new Uint8Array(n * n);
  for (let i = 0; i < n * n; i++) {
    const ch = cells[i];
    if ((ch !== 'X' && ch !== 'O') || seen[i]) continue;
    const terr = ch === 'X' ? 'x' : 'o';
    const stack = [i];
    seen[i] = 1;
    let fixed = false, anchored = false, libs = 0;
    while (stack.length) {
      const p = stack.pop();
      if (!openSet.has(p)) fixed = true;
      for (const q of nb[p]) {
        const w = cells[q];
        if (w === ch) { if (!seen[q]) { seen[q] = 1; stack.push(q); } }
        else if (w === '.' || w === 'x' || w === 'o') {
          libs++;
          if (w === terr) anchored = true;
        }
      }
    }
    if (libs === 0) return false;
    if (fixed && !anchored) return false;
  }
  return true;
}

export function candidate(spec, rand) {
  const n = spec.n;
  const { side, dist, nb } = split(n, rand);
  const cells = [];
  for (let i = 0; i < n * n; i++) cells.push(dist[i] <= 2 ? CH.stone[side[i]] : CH.terr[side[i]]);
  // Every side needs a territory for its walls to hang on.
  if (!cells.includes('x') || !cells.includes('o')) return null;
  // Cheap balance check before any search: the two sides' sizes decide most of
  // the final count, so a lopsided split is thrown away here, not after solving.
  const blackSize = side.reduce((t, v) => t + (v === 0 ? 1 : 0), 0);
  if (Math.abs(2 * blackSize - n * n) > (spec.maxKomi ?? 9) + 3) return null;
  const outer = [];
  for (let i = 0; i < n * n; i++) if (dist[i] === 1) outer.push(i);
  const open = new Set();
  let guard = 0;
  while (open.size < spec.open && guard++ < 400) {
    let p;
    const near = outer.filter((i) => !open.has(i) && [...open].some((o) => {
      const dr = Math.abs(((o / n) | 0) - ((i / n) | 0)), dc = Math.abs((o % n) - (i % n));
      return dr + dc <= 2;
    }));
    if (open.size && near.length && rand() < 0.75) p = pick(rand, near);
    else p = pick(rand, outer.filter((i) => !open.has(i)));
    if (p === undefined) return null;
    const was = cells[p];
    cells[p] = '.';
    open.add(p);
    if (!shapeOk(n, nb, cells, open)) { cells[p] = was; open.delete(p); }
  }
  if (open.size < spec.open) return null;
  // Loose stones: an enemy stone on an open point next to a wall.
  const loose = Math.floor(rand() * (n >= 8 ? 4 : 3));
  const opens = [...open];
  for (let k = 0; k < loose; k++) {
    const p = pick(rand, opens);
    if (cells[p] !== '.') continue;
    cells[p] = CH.stone[1 - side[p]];
    if (!shapeOk(n, nb, cells, open)) cells[p] = '.';
  }
  const pts = [...open].sort((a, b) => a - b);
  return { size: n, rows: toRows(n, cells), pts };
}

// Solve and grade. Returns null when the board is rejected.
export function grade(board, spec) {
  let eng;
  try {
    eng = makeYose(board);
    eng.rootValue();
    // A full search: every reachable position valued, strictly. rootValue
    // already walks every line (value() never prunes), so a ko or a repeat
    // anywhere has thrown by now.
  } catch (e) {
    if (e instanceof CycleAbort) return null;
    throw e;
  }
  const M = eng.rootValue();
  if (Math.abs(M) > (spec.maxKomi ?? 9)) return null;      // a lopsided split
  const root = eng.options(eng.start, BLACK, false);
  const winners = root.filter((o) => o.v === M);
  if (winners.some((o) => o.p < 0)) return null;           // passing wins: nothing to do
  if (winners.length > spec.maxWin) return null;
  if (root.length - winners.length < 2) return null;
  // Walk the main line: Black plays the first winning move, White the engine's.
  let a = eng.start, passed = false, toMove = BLACK, forced = 0, plies = 0, ban = -1;
  const line = [];
  while (plies < 80) {
    if (toMove === BLACK) {
      const opts = eng.options(a, BLACK, passed, ban);
      const win = opts.filter((o) => o.v === M);
      if (opts.length >= 2 && win.length === 1) forced++;
      const mv = win.sort((x, y) => (x.p < 0) - (y.p < 0) || x.p - y.p)[0];
      line.push(mv.p);
      if (mv.p < 0 && passed) break;
      passed = mv.p < 0;
      a = mv.board;
      ban = mv.ko;
    } else {
      const mv = eng.engineMove(a, passed, ban);
      line.push(mv.p);
      if (mv.p < 0 && passed) break;
      passed = mv.p < 0;
      a = mv.board;
      ban = mv.ko;
    }
    toMove = toMove === BLACK ? WHITE : BLACK;
    plies++;
  }
  if (forced < spec.forced) return null;
  const st = eng.stats();
  return {
    ...board,
    komi: M - 0.5,
    value: M,
    key: winners.map((o) => o.p),
    forced,
    line,
    loose: board.rows.join('').split('').filter((ch, i) => (ch === 'X' || ch === 'O') && board.pts.includes(i)).length,
    nodes: st.memo,
  };
}

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
function addDays(ymd, k) {
  const d = new Date(`${ymd}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() + k);
  return d.toISOString().slice(0, 10);
}
const dow = (ymd) => new Date(`${ymd}T12:00:00Z`).getUTCDay();

export function findBoard(spec, rand, seen, maxTries = 20000) {
  for (let t = 0; t < maxTries; t++) {
    const b = candidate(spec, rand);
    if (!b) continue;
    const sig = b.rows.join('/');
    if (seen && seen.has(sig)) continue;
    const g = grade(b, spec);
    if (g) return { g, tries: t + 1 };
  }
  return null;
}

const HEADER = `// Puzzle data for Yose, the daily Go endgame. Imported ONLY by the server page
// (app/yose/page.js), which filters live<=today before handing the bank to the
// client, so tomorrow's board never reaches a browser.
//
// GENERATED by scripts/gen-yose.mjs and checked by scripts/verify-yose.mjs,
// which re-solves every board with its own engine. Do not hand edit.
//
//   size    the board is size x size
//   rows    one string per row, top to bottom: 'X' black stone, 'O' white
//           stone, 'x' black territory, 'o' white territory, '.' open point.
//           Point index = row * size + column.
//   pts     the open points, the only points either side may play on. A stone
//           listed here (a loose stone) can be captured; every other stone
//           belongs to a group touching its own territory and never can be.
//   komi    added to White's area. It is the perfect-play margin less a half,
//           so best play wins by exactly half a point.
//   key     the first moves that keep the win (one of them, Wednesday on)
//   forced  Black turns on the main line where exactly one move keeps the win
//   loose   loose stones on the board at the start
//   nodes   positions in the solved game, a rough size of the tree
// The player is Black and moves first; the engine plays White perfectly.
`;

const isMain = process.argv[1] && fileURLToPath(import.meta.url) === fs.realpathSync(process.argv[1]);
if (isMain) {
  const [mode, ...args] = process.argv.slice(2);
  if (mode === 'probe') {
    const wd = Number(args[0]), tries = Number(args[1]), rand = rng(Number(args[2] || 1));
    const spec = process.env.SPEC ? JSON.parse(process.env.SPEC) : SPEC[wd];
    let found = 0, cand = 0, t0 = Date.now();
    const rej = {};
    for (let t = 0; t < tries; t++) {
      const b = candidate(spec, rand);
      if (!b) { rej.shape = (rej.shape || 0) + 1; continue; }
      cand++;
      const g = grade(b, spec);
      if (g) { found++; if (found <= 2) console.log(JSON.stringify(g)); }
    }
    console.log(`weekday ${wd}: ${cand} boards, ${found} kept, ${Date.now() - t0}ms`, rej);
  } else if (mode === 'day') {
    const live = args[0], num = Number(args[1]);
    const wd = dow(live);
    let h = 2166136261;
    for (const ch of `yose:${live}`) { h ^= ch.charCodeAt(0); h = Math.imul(h, 16777619) >>> 0; }
    const rand = rng(h);
    const t0 = Date.now();
    const r = findBoard(SPEC[wd], rand, null, 200000);
    if (!r) throw new Error(`${live}: no board`);
    const [y, m, dd] = live.split('-').map(Number);
    process.stdout.write(JSON.stringify({
      num,
      quizId: `yose-${m}-${dd}-${String(y).slice(2)}`,
      live,
      dateLabel: `${MONTHS[m - 1]} ${dd}, ${y}`,
      sunday: wd === 0,
      size: r.g.size,
      rows: r.g.rows,
      pts: r.g.pts,
      komi: r.g.komi,
      key: r.g.key,
      forced: r.g.forced,
      loose: r.g.loose,
      nodes: r.g.nodes,
    }) + '\n');
    process.stderr.write(`${live} wd${wd} tries ${r.tries} nodes ${r.g.nodes} forced ${r.g.forced} ${Date.now() - t0}ms\n`);
  } else if (mode === 'bank') {
    const dir = args[0];
    const days = fs.readdirSync(dir).filter((f) => f.endsWith('.json')).sort()
      .map((f) => JSON.parse(fs.readFileSync(`${dir}/${f}`, 'utf8')));
    days.sort((a, b) => a.num - b.num);
    days.forEach((d, i) => { if (d.num !== i + 1) throw new Error(`gap at ${i + 1}`); });
    const sigs = new Set();
    for (const d of days) {
      const sig = d.rows.join('/');
      if (sigs.has(sig)) throw new Error(`${d.live} repeats a board`);
      sigs.add(sig);
    }
    process.stdout.write(HEADER + 'export const PUZZLES = [\n' + days.map((d) => '  ' + JSON.stringify(d)).join(',\n') + ',\n];\n');
  }
}
