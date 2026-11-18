// Bot: the daily programming puzzle (owner, 2026-11-18: picked "Bot" from the
// retro list, asked for Jump and a more dynamic board, then "build and
// implement both"). Light-bot and Logo turtles are the lineage.
//
// A board is a small grid of tiles at heights 0..9, some of them lamps. The
// player writes a program in rows (Main, then P1 and on Sunday P2 and P3), and
// the robot runs it. The model below is the ONE engine: the client, the
// generator (scripts/gen-bot.mjs) and the checker (scripts/verify-bot.mjs) all
// run this file, so a board can never be proved in one game and played in another.
//
// Board: { rows: ['3222','3..1',...], start: [x, y, d], lamps: [[x, y], ...], slots: { main: 8, p1: 6 } }
//   rows   one string per row, top to bottom: a digit is a tile at that height,
//          '.' is a gap (no tile)
//   d      the way the robot faces: 0 north (up the rows), 1 east, 2 south, 3 west
// Program: { main: 'F1', p1: 'FFJOL1', ... } one letter per command:
//   F Forward: one tile ahead, same height only (else a bump: it stays put)
//   J Jump: up one level, down any drop, or over a one-tile gap onto a tile no
//     more than one level up; on flat ground, at a wall too high, or over a gap
//     with nothing to land on it is a bump
//   L / R turn left / right in place
//   O Light up: switches the lamp underfoot on, or back off if it is on;
//     nothing on a plain tile
//   1 / 2 / 3 run the whole P1 / P2 / P3 row, then carry on (rows may call
//     themselves and each other)
// The run stops the moment every lamp is on (a win), when Main runs out, after
// STEP_CAP commands, or past CALL_DEPTH nested calls.

export const STEP_CAP = 150;
export const CALL_DEPTH = 40;
export const DX = [0, 1, 0, -1];
export const DY = [-1, 0, 1, 0];
export const ROWS = ['main', 'p1', 'p2', 'p3'];
export const CALL_OF = { 1: 'p1', 2: 'p2', 3: 'p3' };
export const ACTIONS = ['F', 'J', 'L', 'R', 'O'];

export function parseBoard(B) {
  const H = B.rows.length, W = B.rows[0].length;
  const ht = new Int8Array(W * H).fill(-1);
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    const c = B.rows[y][x];
    if (c !== '.') ht[y * W + x] = +c;
  }
  const lampIdx = new Int16Array(W * H).fill(-1);
  B.lamps.forEach(([x, y], k) => { lampIdx[y * W + x] = k; });
  return { W, H, ht, lampIdx, nLamps: B.lamps.length, start: B.start };
}
const MODELS = typeof WeakMap !== 'undefined' ? new WeakMap() : null;
export function modelOf(B) {
  let m = MODELS && MODELS.get(B);
  if (!m) { m = parseBoard(B); if (MODELS) MODELS.set(B, m); }
  return m;
}
export const heightAt = (M, x, y) => (x < 0 || y < 0 || x >= M.W || y >= M.H ? -1 : M.ht[y * M.W + x]);

// One command's effect on the robot. Returns [x, y, bump] (bump is a reason or '').
export function moveOf(M, x, y, d, c) {
  const h = heightAt(M, x, y);
  const nx = x + DX[d], ny = y + DY[d], nh = heightAt(M, nx, ny);
  if (c === 'F') {
    if (nh >= 0 && nh === h) return [nx, ny, ''];
    return [x, y, nh < 0 ? 'edge' : 'step'];
  }
  // J
  if (nh >= 0) {
    if (nh !== h && nh <= h + 1) return [nx, ny, ''];
    return [x, y, nh === h ? 'flat' : 'high'];
  }
  const fx = x + 2 * DX[d], fy = y + 2 * DY[d], fh = heightAt(M, fx, fy);
  if (fh >= 0 && fh <= h + 1) return [fx, fy, ''];
  return [x, y, 'gap'];
}

// The full run, with a trace for the client's playback.
export function run(B, prog, opts = {}) {
  const M = modelOf(B);
  const cap = opts.cap || STEP_CAP;
  let [x, y, d] = M.start;
  const lit = new Uint8Array(M.nLamps); let nLit = 0;
  const trace = []; let steps = 0, won = false, why = 'end';
  const stack = [{ row: 'main', s: prog.main || '', i: 0 }];
  while (stack.length) {
    const top = stack[stack.length - 1];
    if (top.i >= top.s.length) { stack.pop(); continue; }
    const i = top.i++; const c = top.s[i];
    if (CALL_OF[c]) {
      if (stack.length >= CALL_DEPTH) { why = 'deep'; break; }
      stack.push({ row: CALL_OF[c], s: prog[CALL_OF[c]] || '', i: 0 }); continue;
    }
    if (++steps > cap) { why = 'cap'; break; }
    const at = { row: top.row, i, c, fx: x, fy: y };
    if (c === 'F' || c === 'J') { const r = moveOf(M, x, y, d, c); x = r[0]; y = r[1]; if (r[2]) at.bump = r[2]; }
    else if (c === 'L') d = (d + 3) % 4;
    else if (c === 'R') d = (d + 1) % 4;
    else if (c === 'O') {
      const k = M.lampIdx[y * M.W + x];
      if (k >= 0) { if (lit[k]) { lit[k] = 0; nLit--; at.off = 1; } else { lit[k] = 1; nLit++; } } else at.miss = 1;
    }
    at.x = x; at.y = y; at.d = d; at.lit = nLit;
    if (opts.trace !== false) { at.litSet = Array.from(lit); trace.push(at); }
    if (nLit === M.nLamps) { won = true; break; }
  }
  return { won, steps, trace, lit: nLit, why };
}

// The search's fast path: no trace, no objects. Same rules as run().
export function wins(M, prog, cap = STEP_CAP) {
  let x = M.start[0], y = M.start[1], d = M.start[2];
  const lit = new Uint8Array(M.nLamps); let nLit = 0, steps = 0;
  const sS = [prog.main], sI = [0];
  while (sS.length) {
    const t = sS.length - 1, s = sS[t];
    if (sI[t] >= s.length) { sS.pop(); sI.pop(); continue; }
    const c = s[sI[t]++];
    if (c === '1' || c === '2' || c === '3') {
      if (sS.length >= CALL_DEPTH) return false;
      sS.push(prog[CALL_OF[c]] || ''); sI.push(0); continue;
    }
    if (++steps > cap) return false;
    if (c === 'F' || c === 'J') { const r = moveOf(M, x, y, d, c); x = r[0]; y = r[1]; }
    else if (c === 'L') d = (d + 3) % 4;
    else if (c === 'R') d = (d + 1) % 4;
    else { const k = M.lampIdx[y * M.W + x]; if (k >= 0) { if (lit[k]) { lit[k] = 0; nLit--; } else { lit[k] = 1; nLit++; if (nLit === M.nLamps) return true; } } }
  }
  return false;
}

export const commandsIn = (prog) => ROWS.reduce((n, r) => n + ((prog && prog[r]) || '').length, 0);
export const rowsOf = (B) => ROWS.filter((r) => (B.slots[r] || 0) > 0);

// Is this a program the board allows? (rows exist, fit their slots, letters legal)
export function legalProgram(B, prog) {
  if (!prog || typeof prog !== 'object') return false;
  const rows = rowsOf(B);
  for (const r of ROWS) {
    const s = prog[r] || '';
    if (typeof s !== 'string') return false;
    if (!rows.includes(r) && s.length) return false;
    if (s.length > (B.slots[r] || 0)) return false;
    for (const c of s) {
      if (ACTIONS.includes(c)) continue;
      if (CALL_OF[c] && rows.includes(CALL_OF[c])) continue;
      return false;
    }
  }
  return true;
}
