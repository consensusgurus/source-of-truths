// Squash, the engine. Pure and deterministic, no DOM.
//
// Shared on purpose: app/squash/SquashClient.jsx plays from this, and
// scripts/gen-squash.mjs and scripts/verify-squash.mjs measure and prove the
// day from the SAME code, so a checker can never pass a board the game does not
// actually deal.
//
// THE GAME. A match-three board of fruit. Swap two neighbours to line up three
// or more of one fruit and they squash; everything above falls and new fruit
// drops in from the top. A day is a five-minute blitz on the same board for
// everybody, and the score is points. The clock lives in the client; the engine
// takes an optional move cap (`moves`), which the par measurement and the tests
// use, and with no cap a run never runs out of moves.
//
// THE DAY IS THE SAME FOR EVERYBODY, refills included. The opening board comes
// off the quizId, and every COLUMN has its own seeded stream of fruit: the k-th
// fruit to drop into column c is the same fruit for every player on that day.
// What drops where therefore depends only on how many fruit you have cleared
// from each column, which is your play, never luck. A shuffle (when no move is
// left) is seeded off the day and the shuffle count, so it is the same too.
//
// SPECIAL FRUIT, made by bigger matches:
//   four in a line      a SLICER: squashed, it clears its whole line. Four in a
//                       row makes one that clears its column, four in a column
//                       one that clears its row (the classic convention: the
//                       slicer cuts across the way it was made).
//   an L or a T         a BOMB: squashed, it clears the 3x3 around it.
//   five in a line      a PUNCH BOWL: no fruit of its own. Swap it with any
//                       fruit and every fruit of that kind on the board goes.
// Swapping two specials together sets off a combo, no match needed:
//   slicer + slicer     a cross: the whole row and the whole column
//   slicer + bomb       three rows and three columns
//   bomb + bomb         the 5x5 around them
//   bowl + slicer       every fruit of that kind becomes a slicer, and fires
//   bowl + bomb         every fruit of that kind becomes a bomb, and fires
//   bowl + bowl         the whole board
// A special caught in another blast fires too. A bowl caught that way takes the
// most common fruit on the board.
//
// SCORING. Every fruit squashed is 10 points times the cascade: the matches a
// swap makes are cascade 1, the ones the falling fruit make are cascade 2, and
// so on. Making a slicer adds 60, a bomb 100, a punch bowl 200.
//
// A swap that makes no match (and is not a special pair or a bowl) is undone
// and costs no move.

export const SQUASH_SIZE = 8;
export const SQUASH_KINDS = 6;
export const POINTS = { fruit: 10, h: 60, v: 60, bomb: 100, bowl: 200 };

// The fruit, in kind order. Names are reader-facing (rules, aria labels).
export const FRUITS = ['strawberry', 'orange', 'lemon', 'lime', 'grape', 'blueberry'];

export function hashStr(s) {
  let h = 2166136261 >>> 0;
  for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); }
  return h >>> 0;
}
// mulberry32 with its whole state in one integer, so a saved game carries the
// column streams exactly where they were.
function draw(st) {
  st.a = (st.a + 0x6D2B79F5) | 0;
  let t = Math.imul(st.a ^ (st.a >>> 15), 1 | st.a);
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
}

const inb = (s, r, c) => r >= 0 && c >= 0 && r < s.size && c < s.size;
const at = (s, r, c) => (inb(s, r, c) ? s.grid[r][c] : null);
const isFruit = (p) => !!p && p.f >= 0;

// ---- matches --------------------------------------------------------------
// Every run of three or more of one fruit, merged into groups where runs share
// a cell (an L or a T is one group of two runs).
export function findGroups(s) {
  const n = s.size, runs = [];
  for (let r = 0; r < n; r++) {
    let c = 0;
    while (c < n) {
      const p = s.grid[r][c];
      let e = c + 1;
      if (isFruit(p)) while (e < n && isFruit(s.grid[r][e]) && s.grid[r][e].f === p.f) e++;
      if (isFruit(p) && e - c >= 3) runs.push({ dir: 'h', f: p.f, cells: Array.from({ length: e - c }, (_, i) => [r, c + i]) });
      c = e;
    }
  }
  for (let c = 0; c < n; c++) {
    let r = 0;
    while (r < n) {
      const p = s.grid[r][c];
      let e = r + 1;
      if (isFruit(p)) while (e < n && isFruit(s.grid[e][c]) && s.grid[e][c].f === p.f) e++;
      if (isFruit(p) && e - r >= 3) runs.push({ dir: 'v', f: p.f, cells: Array.from({ length: e - r }, (_, i) => [r + i, c]) });
      r = e;
    }
  }
  // union runs that share a cell
  const parent = runs.map((_, i) => i);
  const find = (i) => (parent[i] === i ? i : (parent[i] = find(parent[i])));
  const owner = new Map();
  runs.forEach((run, i) => {
    for (const [r, c] of run.cells) {
      const k = r * n + c;
      if (owner.has(k)) parent[find(i)] = find(owner.get(k)); else owner.set(k, i);
    }
  });
  const byRoot = new Map();
  runs.forEach((run, i) => {
    const root = find(i);
    if (!byRoot.has(root)) byRoot.set(root, []);
    byRoot.get(root).push(run);
  });
  const groups = [];
  for (const rs of byRoot.values()) {
    const keys = new Set();
    for (const run of rs) for (const [r, c] of run.cells) keys.add(r * n + c);
    const maxH = Math.max(0, ...rs.filter((x) => x.dir === 'h').map((x) => x.cells.length));
    const maxV = Math.max(0, ...rs.filter((x) => x.dir === 'v').map((x) => x.cells.length));
    let make = null;
    if (maxH >= 5 || maxV >= 5) make = 'bowl';
    else if (maxH >= 3 && maxV >= 3) make = 'bomb';
    else if (maxH === 4) make = 'v';
    else if (maxV === 4) make = 'h';
    groups.push({ f: rs[0].f, runs: rs, keys, make });
  }
  // reading order of each group's first cell, so the order never depends on Map internals
  groups.sort((a, b) => Math.min(...a.keys) - Math.min(...b.keys));
  return groups;
}

// Where a group's new special lands: the swapped cell if it is in the group,
// else the crossing of an L or T, else the middle of the longest run.
function placeOf(s, g, prefer) {
  const n = s.size;
  for (const [r, c] of prefer || []) if (g.keys.has(r * n + c)) return r * n + c;
  if (g.make === 'bomb') {
    const hk = new Set(), vk = new Set();
    for (const run of g.runs) for (const [r, c] of run.cells) (run.dir === 'h' ? hk : vk).add(r * n + c);
    const cross = [...hk].filter((k) => vk.has(k)).sort((a, b) => a - b);
    if (cross.length) return cross[0];
  }
  const longest = g.runs.slice().sort((a, b) => b.cells.length - a.cells.length)[0];
  const [r, c] = longest.cells[Math.floor((longest.cells.length - 1) / 2)];
  return r * n + c;
}

// ---- moves ----------------------------------------------------------------
function makesLine(s, r, c) {
  const p = at(s, r, c);
  if (!isFruit(p)) return false;
  let h = 1, v = 1;
  for (let x = c - 1; isFruit(at(s, r, x)) && at(s, r, x).f === p.f; x--) h++;
  for (let x = c + 1; isFruit(at(s, r, x)) && at(s, r, x).f === p.f; x++) h++;
  for (let y = r - 1; isFruit(at(s, y, c)) && at(s, y, c).f === p.f; y--) v++;
  for (let y = r + 1; isFruit(at(s, y, c)) && at(s, y, c).f === p.f; y++) v++;
  return h >= 3 || v >= 3;
}
function swapCells(s, a, b) {
  const t = s.grid[a[0]][a[1]];
  s.grid[a[0]][a[1]] = s.grid[b[0]][b[1]];
  s.grid[b[0]][b[1]] = t;
}
export function adjacent(a, b) {
  return Math.abs(a[0] - b[0]) + Math.abs(a[1] - b[1]) === 1;
}
// Would swapping a and b do anything?
export function swapValid(s, a, b) {
  if (!inb(s, a[0], a[1]) || !inb(s, b[0], b[1]) || !adjacent(a, b)) return false;
  const pa = at(s, a[0], a[1]), pb = at(s, b[0], b[1]);
  if (!pa || !pb) return false;
  if (pa.sp === 'bowl' || pb.sp === 'bowl') return true;
  if (pa.sp && pb.sp) return true;
  swapCells(s, a, b);
  const ok = makesLine(s, a[0], a[1]) || makesLine(s, b[0], b[1]);
  swapCells(s, a, b);
  return ok;
}
export function validMoves(s) {
  const out = [];
  for (let r = 0; r < s.size; r++) for (let c = 0; c < s.size; c++) {
    if (c + 1 < s.size && swapValid(s, [r, c], [r, c + 1])) out.push([[r, c], [r, c + 1]]);
    if (r + 1 < s.size && swapValid(s, [r, c], [r + 1, c])) out.push([[r, c], [r + 1, c]]);
  }
  return out;
}
export function hasMove(s) {
  for (let r = 0; r < s.size; r++) for (let c = 0; c < s.size; c++) {
    if (c + 1 < s.size && swapValid(s, [r, c], [r, c + 1])) return true;
    if (r + 1 < s.size && swapValid(s, [r, c], [r + 1, c])) return true;
  }
  return false;
}

// ---- setup ----------------------------------------------------------------
function piece(s, f, sp = null) { return { id: s.nextId++, f, sp }; }

export function newGame({ quizId, size = SQUASH_SIZE, kinds = SQUASH_KINDS, moves = null }) {
  const s = {
    v: 1, quizId, size, kinds, max: moves, used: 0, score: 0, best: 0,
    nextId: 1, shuffles: 0, grid: [], col: [], made: { h: 0, v: 0, bomb: 0, bowl: 0 }, bigCascade: 0,
  };
  for (let c = 0; c < size; c++) s.col.push({ a: hashStr(`${quizId}:col:${c}`) | 0 });
  const st = { a: hashStr(`${quizId}:board`) | 0 };
  for (let tries = 0; tries < 500; tries++) {
    s.nextId = 1;
    s.grid = [];
    for (let r = 0; r < size; r++) {
      const row = [];
      for (let c = 0; c < size; c++) {
        let f, guard = 0;
        do {
          f = Math.floor(draw(st) * kinds);
          guard++;
        } while (guard < 50 && (
          (c >= 2 && row[c - 1].f === f && row[c - 2].f === f)
          || (r >= 2 && s.grid[r - 1][c].f === f && s.grid[r - 2][c].f === f)));
        row.push({ id: s.nextId++, f, sp: null });
      }
      s.grid.push(row);
    }
    if (!findGroups(s).length && validMoves(s).length >= 3) break;
  }
  return s;
}

// Every piece with its square, the shape the client animates from.
export function pieces(s) {
  const out = [];
  for (let r = 0; r < s.size; r++) for (let c = 0; c < s.size; c++) {
    const p = s.grid[r][c];
    if (p) out.push({ id: p.id, f: p.f, sp: p.sp, r, c });
  }
  return out;
}

// ---- resolution -----------------------------------------------------------
function commonFruit(s) {
  const cnt = new Array(s.kinds).fill(0);
  for (const row of s.grid) for (const p of row) if (isFruit(p)) cnt[p.f]++;
  let best = 0;
  for (let i = 1; i < cnt.length; i++) if (cnt[i] > cnt[best]) best = i;
  return best;
}

// Fire every special in `queue` (cell keys), adding what each one clears to
// `clear`, chain-firing any special it catches. `done` holds cells already
// fired, so nothing fires twice.
function blast(s, clear, queue, done, blasts) {
  const n = s.size;
  const add = (r, c) => {
    if (!inb(s, r, c) || !s.grid[r][c]) return;
    const k = r * n + c;
    if (!clear.has(k)) clear.add(k);
    if (s.grid[r][c].sp && !done.has(k)) queue.push(k);
  };
  while (queue.length) {
    const k = queue.shift();
    if (done.has(k)) continue;
    done.add(k);
    const r = (k / n) | 0, c = k % n, p = s.grid[r][c];
    if (!p || !p.sp) continue;
    clear.add(k);
    if (p.sp === 'h') { blasts.push({ t: 'h', r, c }); for (let x = 0; x < n; x++) add(r, x); }
    else if (p.sp === 'v') { blasts.push({ t: 'v', r, c }); for (let y = 0; y < n; y++) add(y, c); }
    else if (p.sp === 'bomb') { blasts.push({ t: 'bomb', r, c, d: 1 }); for (let y = r - 1; y <= r + 1; y++) for (let x = c - 1; x <= c + 1; x++) add(y, x); }
    else if (p.sp === 'bowl') {
      const f = commonFruit(s);
      blasts.push({ t: 'bowl', r, c, f });
      for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) if (s.grid[y][x] && s.grid[y][x].f === f) add(y, x);
    }
  }
}

function gravity(s) {
  const n = s.size, spawned = [];
  for (let c = 0; c < n; c++) {
    const keep = [];
    for (let r = n - 1; r >= 0; r--) if (s.grid[r][c]) keep.push(s.grid[r][c]);
    for (let r = n - 1, i = 0; r >= 0; r--, i++) s.grid[r][c] = keep[i] || null;
    const k = n - keep.length;
    for (let i = 0; i < k; i++) {
      const p = piece(s, Math.floor(draw(s.col[c]) * s.kinds));
      const r = k - 1 - i;
      s.grid[r][c] = p;
      spawned.push({ id: p.id, from: r - k });
    }
  }
  return spawned;
}

// Clear `clear` (cell keys), placing `made` specials, score it, fall and refill.
function settle(s, clear, made, cascade, frames, blasts) {
  const n = s.size;
  const keepAt = new Set(made.map((m) => m.k));
  const cleared = [];
  for (const k of [...clear].sort((a, b) => a - b)) {
    const r = (k / n) | 0, c = k % n, p = s.grid[r][c];
    if (!p) continue;
    cleared.push({ id: p.id, f: p.f, sp: p.sp, r, c });
    s.grid[r][c] = null;
  }
  let pts = cleared.length * POINTS.fruit * cascade;
  for (const m of made) {
    const r = (m.k / n) | 0, c = m.k % n;
    if (!keepAt.has(m.k)) continue;
    s.grid[r][c] = piece(s, m.f, m.sp);
    pts += POINTS[m.sp];
    s.made[m.sp] = (s.made[m.sp] || 0) + 1;
  }
  s.score += pts;
  frames.push({ kind: 'clear', cascade, points: pts, cleared, blasts: blasts.slice(), made: made.map((m) => ({ r: (m.k / n) | 0, c: m.k % n, sp: m.sp })), pieces: pieces(s) });
  const spawned = gravity(s);
  frames.push({ kind: 'fall', spawned, pieces: pieces(s) });
  if (cascade > s.bigCascade) s.bigCascade = cascade;
  return pts;
}

// Resolve every match on the board, cascade by cascade.
function cascadeLoop(s, prefer, startCascade, frames) {
  let cascade = startCascade, pts = 0;
  for (let guard = 0; guard < 200; guard++) {
    const groups = findGroups(s);
    if (!groups.length) break;
    const clear = new Set(), made = [], queue = [], done = new Set(), blasts = [];
    for (const g of groups) {
      for (const k of g.keys) clear.add(k);
      if (g.make) made.push({ k: placeOf(s, g, prefer), sp: g.make, f: g.make === 'bowl' ? -1 : g.f });
    }
    // a special squashed in a match fires
    for (const k of clear) { const p = s.grid[(k / s.size) | 0][k % s.size]; if (p && p.sp) queue.push(k); }
    blast(s, clear, queue, done, blasts);
    pts += settle(s, clear, made, cascade, frames, blasts);
    cascade++;
    prefer = null;
  }
  return pts;
}

function shuffle(s, frames) {
  const st = { a: hashStr(`${s.quizId}:shuffle:${s.shuffles}`) | 0 };
  s.shuffles++;
  const all = [];
  for (const row of s.grid) for (const p of row) all.push(p);
  for (let tries = 0; tries < 300; tries++) {
    for (let i = all.length - 1; i > 0; i--) { const j = Math.floor(draw(st) * (i + 1)); const t = all[i]; all[i] = all[j]; all[j] = t; }
    for (let i = 0; i < all.length; i++) s.grid[(i / s.size) | 0][i % s.size] = all[i];
    if (!findGroups(s).length && hasMove(s)) break;
  }
  // a board that still has no move after 300 tries gets fresh fruit from the day
  if (!hasMove(s)) {
    for (let r = 0; r < s.size; r++) for (let c = 0; c < s.size; c++) if (!s.grid[r][c].sp) s.grid[r][c] = piece(s, Math.floor(draw(st) * s.kinds));
    cascadeLoop(s, null, 1, frames);
  }
  frames.push({ kind: 'shuffle', pieces: pieces(s) });
}

// Play one swap. Returns { ok, frames, points }. An invalid swap changes
// nothing and returns ok:false; the client shows it wobbling back.
export function move(s, a, b) {
  if (isOver(s) || !swapValid(s, a, b)) return { ok: false, frames: [], points: 0 };
  const before = s.score;
  const frames = [];
  const pa = at(s, a[0], a[1]), pb = at(s, b[0], b[1]);
  s.used++;
  swapCells(s, a, b);
  frames.push({ kind: 'swap', a, b, pieces: pieces(s) });
  const n = s.size;
  // after the swap, pa sits at b and pb sits at a
  const kA = a[0] * n + a[1], kB = b[0] * n + b[1];
  const bowl = pa.sp === 'bowl' ? { me: pa, other: pb, k: kB, ok: kA } : (pb.sp === 'bowl' ? { me: pb, other: pa, k: kA, ok: kB } : null);
  const clear = new Set(), queue = [], done = new Set(), blasts = [];
  let combo = false;
  if (bowl) {
    combo = true;
    const o = bowl.other;
    done.add(bowl.k); clear.add(bowl.k);
    if (o.sp === 'bowl') {
      blasts.push({ t: 'bowl', r: (bowl.k / n) | 0, c: bowl.k % n, f: -1 });
      for (let k = 0; k < n * n; k++) if (s.grid[(k / n) | 0][k % n]) clear.add(k);
      done.add(bowl.ok);
    } else {
      const f = o.f, turnTo = o.sp; // null, 'h', 'v' or 'bomb'
      blasts.push({ t: 'bowl', r: (bowl.k / n) | 0, c: bowl.k % n, f });
      for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) {
        const p = s.grid[y][x];
        if (!p || p.f !== f) continue;
        const k = y * n + x;
        if (turnTo && !p.sp) p.sp = turnTo === 'bomb' ? 'bomb' : ((y + x) % 2 ? 'h' : 'v');
        clear.add(k);
        if (p.sp) queue.push(k);
      }
    }
  } else if (pa.sp && pb.sp) {
    combo = true;
    const r = b[0], c = b[1], two = [pa.sp, pb.sp].sort().join('+');
    done.add(kA); done.add(kB); clear.add(kA); clear.add(kB);
    const addCell = (y, x) => { if (inb(s, y, x) && s.grid[y][x]) { const k = y * n + x; clear.add(k); if (s.grid[y][x].sp && !done.has(k)) queue.push(k); } };
    if (two === 'bomb+bomb') {
      blasts.push({ t: 'bomb', r, c, d: 2 });
      for (let y = r - 2; y <= r + 2; y++) for (let x = c - 2; x <= c + 2; x++) addCell(y, x);
    } else if (two === 'bomb+h' || two === 'bomb+v') {
      for (let d = -1; d <= 1; d++) {
        blasts.push({ t: 'h', r: r + d, c }); blasts.push({ t: 'v', r, c: c + d });
        for (let x = 0; x < n; x++) addCell(r + d, x);
        for (let y = 0; y < n; y++) addCell(y, c + d);
      }
    } else {
      blasts.push({ t: 'h', r, c }); blasts.push({ t: 'v', r, c });
      for (let x = 0; x < n; x++) addCell(r, x);
      for (let y = 0; y < n; y++) addCell(y, c);
    }
  }
  if (combo) {
    blast(s, clear, queue, done, blasts);
    settle(s, clear, [], 1, frames, blasts);
    cascadeLoop(s, null, 2, frames);
  } else {
    cascadeLoop(s, [b, a], 1, frames);
  }
  if (!isOver(s) && !hasMove(s)) shuffle(s, frames);
  return { ok: true, frames, points: s.score - before };
}

export function isOver(s) { return s.max != null && s.used >= s.max; }

// A deep copy, for the bot and for saving.
export function clone(s) { return JSON.parse(JSON.stringify(s)); }

// The greedy bot the generator measures par with: each move, the swap that
// scores most right now, cascades and all. It sees the refills, which a player
// cannot, so it is a ceiling-ish benchmark rather than a human.
export function greedyRun(quizId, opts) {
  const s = newGame({ quizId, ...opts });
  while (!isOver(s)) {
    const ms = validMoves(s);
    if (!ms.length) break;
    let best = null, bestPts = -1;
    for (const [a, b] of ms) {
      const t = clone(s);
      const res = move(t, a, b);
      if (res.points > bestPts) { bestPts = res.points; best = [a, b]; }
    }
    move(s, best[0], best[1]);
  }
  return s;
}
