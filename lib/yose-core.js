// YOSE — the Go endgame engine, shared by the generator (scripts/gen-yose.mjs)
// and the browser (app/yose/YoseClient.jsx). The verifier
// (scripts/verify-yose.mjs) carries its OWN engine and imports nothing from
// here, so a rules bug cannot agree with itself.
//
// THE POSITION. An N x N board whose territories are already settled. Each cell
// is one of
//   'X' a black stone          'O' a white stone
//   'x' black territory         'o' white territory   (empty, never playable)
//   '.' an open point
// and the puzzle lists the OPEN POINTS (`pts`): the only points either side may
// play on. A stone that starts on an open point (a "loose" stone) is part of the
// play too, because it can be captured and its point opened again. Every other
// stone belongs to a group that touches its own territory, which is a liberty
// nobody can fill, so it can never be captured. That is what lets the whole
// game be described by the open points alone.
//
// THE RULES, which are Go's: you place a stone on an empty open point; any
// enemy group left with no liberties is removed; you may not leave your own
// group with none (no suicide); you may pass; two passes in a row end the game.
// The count is AREA: your stones on the board plus the empty points that touch
// only your stones. Komi is added to White.
//
// KO. A move that captures exactly one stone, with a single stone that is left
// with exactly one liberty (the point it just emptied), is a ko: the other side
// may not retake on that point with its very next move. A pass or any other
// move lifts the ban. The ban is part of the position, so the value table below
// is keyed on it.
//
// NO REPEATS, BY CONSTRUCTION. The generator searches every line of every board
// it ships, with no pruning, and throws the board away if any line repeats a
// whole position (board, side to move and ko ban). So a shipped board has no
// cycle anywhere, no superko rule is ever needed, and the value table is exact.
//
// THE VALUE of a position is the final (black area - white area) with perfect
// play from both sides, before komi. Black maximises, White minimises. The
// puzzle's komi is set to (root value - 0.5), so perfect play wins by exactly
// half a point and any point given away loses.

export const EMPTY = 0, BLACK = 1, WHITE = 2, BTERR = 3, WTERR = 4;
const CODE = { '.': EMPTY, X: BLACK, O: WHITE, x: BTERR, o: WTERR };

export class CycleAbort extends Error {}

export function parseBoard(rows) {
  const n = rows.length;
  const a = new Int8Array(n * n);
  for (let r = 0; r < n; r++) for (let c = 0; c < n; c++) a[r * n + c] = CODE[rows[r][c]];
  return a;
}

export function neighborsTable(n) {
  const nb = [];
  for (let i = 0; i < n * n; i++) {
    const r = (i / n) | 0, c = i % n, out = [];
    if (r > 0) out.push(i - n);
    if (r < n - 1) out.push(i + n);
    if (c > 0) out.push(i - 1);
    if (c < n - 1) out.push(i + 1);
    nb.push(out);
  }
  return nb;
}

const isEmptyish = (v) => v === EMPTY || v === BTERR || v === WTERR;

// The group at i and whether it has a liberty; `libs` counts DISTINCT liberties
// only up to `need` (the callers only ever ask "none" or "exactly one").
function groupInfo(a, nb, i, color, mark, stamp) {
  const stack = [i];
  const stones = [];
  mark[i] = stamp;
  const libSet = [];
  while (stack.length) {
    const p = stack.pop();
    stones.push(p);
    for (const q of nb[p]) {
      const v = a[q];
      if (v === color) { if (mark[q] !== stamp) { mark[q] = stamp; stack.push(q); } }
      else if (isEmptyish(v)) { if (!libSet.includes(q)) libSet.push(q); }
    }
  }
  return { stones, libs: libSet };
}

export function makeYose(puzzle) {
  const n = puzzle.size;
  const nb = neighborsTable(n);
  const start = parseBoard(puzzle.rows);
  const pts = puzzle.pts.slice();
  const F = pts.length;
  const slot = new Int16Array(n * n).fill(-1);
  pts.forEach((p, k) => { slot[p] = k; });
  const mark = new Int32Array(n * n);
  let stamp = 0;
  const POW = [1];
  for (let k = 1; k <= F; k++) POW.push(POW[k - 1] * 3);

  function code(a) {
    let x = 0;
    for (let k = F - 1; k >= 0; k--) x = x * 3 + a[pts[k]];
    return x;
  }

  // Play `color` at open point p on board a, where `ban` is the point the ko
  // rule forbids this turn (-1 for none). Returns { board, captured, ko } with
  // `ko` the point the OTHER side may not play next, or null when the move is
  // illegal (occupied, not open, suicide, or the banned ko point).
  function play(a, p, color, ban = -1) {
    if (slot[p] < 0 || a[p] !== EMPTY || p === ban) return null;
    const b = a.slice();
    b[p] = color;
    const foe = color === BLACK ? WHITE : BLACK;
    const captured = [];
    for (const q of nb[p]) {
      if (b[q] !== foe) continue;
      stamp++;
      if (mark[q] === stamp) continue;
      const g = groupInfo(b, nb, q, foe, mark, stamp);
      if (g.libs.length === 0) {
        for (const s of g.stones) {
          if (slot[s] < 0) throw new Error('an anchored stone was captured');
          b[s] = EMPTY;
          captured.push(s);
        }
      }
    }
    stamp++;
    const mine = groupInfo(b, nb, p, color, mark, stamp);
    if (mine.libs.length === 0) return null; // suicide
    const ko = (captured.length === 1 && mine.stones.length === 1 && mine.libs.length === 1 && mine.libs[0] === captured[0]) ? captured[0] : -1;
    return { board: b, captured, ko };
  }

  function legal(a, color, ban = -1) {
    const out = [];
    for (const p of pts) {
      if (a[p] !== EMPTY) continue;
      const r = play(a, p, color, ban);
      if (r) out.push({ p, board: r.board, captured: r.captured, ko: r.ko });
    }
    return out;
  }

  // Area count, before komi.
  function area(a) {
    let black = 0, white = 0;
    const seen = new Uint8Array(n * n);
    for (let i = 0; i < n * n; i++) {
      const v = a[i];
      if (v === BLACK) black++;
      else if (v === WHITE) white++;
      else if (!seen[i]) {
        const stack = [i];
        seen[i] = 1;
        let size = 0, tb = false, tw = false;
        while (stack.length) {
          const p = stack.pop();
          size++;
          for (const q of nb[p]) {
            const w = a[q];
            if (w === BLACK) tb = true;
            else if (w === WHITE) tw = true;
            else if (!seen[q]) { seen[q] = 1; stack.push(q); }
          }
        }
        if (tb && !tw) black += size;
        else if (tw && !tb) white += size;
      }
    }
    return { black, white };
  }
  const margin = (a) => { const s = area(a); return s.black - s.white; };

  // The exact value table. A position is (board, side to move, ko ban, whether
  // the last move was a pass).
  const memo = new Map();
  let nodes = 0;
  const banSlot = (ban) => (ban < 0 ? F : slot[ban]);
  function value(a, toMove, passed, ban = -1, strict = true, onPath = null) {
    const pk = (code(a) * (F + 1) + banSlot(ban)) * 2 + (toMove - 1);
    const key = pk * 2 + (passed ? 1 : 0);
    const hit = memo.get(key);
    if (hit !== undefined) return hit;
    const path = onPath || new Set();
    if (path.has(pk)) {
      if (strict) throw new CycleAbort(`repeat at ${pk}`);
      throw new Error('a shipped board repeated a position');
    }
    path.add(pk);
    nodes++;
    const other = toMove === BLACK ? WHITE : BLACK;
    let best = passed ? margin(a) : value(a, other, true, -1, strict, path);
    for (const m of legal(a, toMove, ban)) {
      const v = value(m.board, other, false, m.ko, strict, path);
      if (toMove === BLACK ? v > best : v < best) best = v;
    }
    path.delete(pk);
    memo.set(key, best);
    return best;
  }

  // Every option for the side to move, with its value. `pass` is p = -1.
  function options(a, toMove, passed, ban = -1) {
    const other = toMove === BLACK ? WHITE : BLACK;
    const out = [{ p: -1, board: a, captured: [], ko: -1, v: passed ? margin(a) : value(a, other, true, -1) }];
    for (const m of legal(a, toMove, ban)) out.push({ ...m, v: value(m.board, other, false, m.ko) });
    return out;
  }

  // The engine's choice for White: the lowest value; among equals, the move
  // that captures most, then a real move before a pass, then the lowest point.
  // Deterministic, so everybody who plays a line meets the same replies.
  function engineMove(a, passed, ban = -1) {
    const opts = options(a, WHITE, passed, ban);
    opts.sort((x, y) => (x.v - y.v) || (y.captured.length - x.captured.length) || ((x.p < 0) - (y.p < 0)) || (x.p - y.p));
    return opts[0];
  }

  return {
    n, nb, start, pts, F, slot,
    play, legal, area, margin, value, options, engineMove,
    rootValue: () => value(start, BLACK, false),
    stats: () => ({ nodes, memo: memo.size }),
  };
}

// Replay a move list (points, -1 for a pass) from the start. Black moves
// first and the sides alternate strictly: a pass is a move.
export function replay(eng, moves) {
  let a = eng.start;
  let toMove = BLACK;
  let passed = false;
  let over = false;
  let ban = -1;
  const caps = { [BLACK]: 0, [WHITE]: 0 };
  let last = null, lastCap = [];
  for (const p of moves) {
    if (over) break;
    if (p < 0) {
      if (passed) over = true;
      passed = true;
      ban = -1;
      last = { p: -1, by: toMove };
      lastCap = [];
    } else {
      const r = eng.play(a, p, toMove, ban);
      if (!r) throw new Error(`illegal move ${p}`);
      a = r.board;
      caps[toMove] += r.captured.length;
      passed = false;
      ban = r.ko;
      last = { p, by: toMove };
      lastCap = r.captured;
    }
    toMove = toMove === BLACK ? WHITE : BLACK;
  }
  return { board: a, toMove, passed, over, ban, caps, last, lastCap };
}

export const COLS = 'ABCDEFGHJKLMNOPQRST'; // Go skips I
export function pointName(p, n) {
  if (p < 0) return 'pass';
  const r = (p / n) | 0, c = p % n;
  return `${COLS[c]}${n - r}`;
}
