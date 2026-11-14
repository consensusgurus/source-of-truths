// lib/pack-engine.js: the model for Pack, the daily packing puzzle (owner, 2026-11-14:
// "a 3D packing puzzle. Trunk of a car, by Sunday it's a moving van"). Shared by the
// client (app/pack/PackClient.jsx), the generator (scripts/gen-pack.mjs) and the
// checker (scripts/verify-pack.mjs), so the three can never disagree about a drop.
//
// THE SPACE is a box W wide (x), D deep (y) and H high (z), in whole cells. AN ITEM is
// a set of cells (a shape from lib/pack-art.js): most are plain boxes, a sofa is a seat
// and a back, a table is a top on legs. A PLACEMENT is { i, r, p }: the item's index,
// one of the 24 turns in ROTS, and the low corner of its bounding box.
//
// AN ITEM DROPS STRAIGHT DOWN from above the roof and stops the moment any cell of it
// would enter a filled cell or the floor. So whatever goes under a table is loaded
// before the table, and nothing slides in sideways. It fits when it comes to rest
// wholly under the roof line.
//
// THE SCORE is re-packs: every item taken back out counts one. A perfect load is
// always 0, so the ladder needs no stored best.

export const mul = (A, B) => A.map((row, i) => B[0].map((_, j) => row[0] * B[0][j] + row[1] * B[1][j] + row[2] * B[2][j]));
export const RZ = [[0, -1, 0], [1, 0, 0], [0, 0, 1]];   // Turn: a quarter turn on the floor
export const RX = [[1, 0, 0], [0, 0, -1], [0, 1, 0]];   // Tip: over onto another side
export const I3 = [[1, 0, 0], [0, 1, 0], [0, 0, 1]];
// The 24 turns. The four that keep an item upright come first, so index 0 is "as it stands".
export const ROTS = (() => {
  const seen = {}, out = [], q = [I3];
  while (q.length) { const R = q.shift(), k = JSON.stringify(R); if (seen[k]) continue; seen[k] = 1; out.push(R); q.push(mul(RZ, R)); q.push(mul(RX, R)); }
  return out.filter((R) => R[2][2] === 1).concat(out.filter((R) => R[2][2] !== 1));
})();
const ROT_KEY = ROTS.map((R) => JSON.stringify(R));
export const rotIndex = (R) => ROT_KEY.indexOf(JSON.stringify(R));
export const turn = (r) => rotIndex(mul(RZ, ROTS[r]));
export const tip = (r) => rotIndex(mul(RX, ROTS[r]));
export const ap = (R, p) => [R[0][0] * p[0] + R[0][1] * p[1] + R[0][2] * p[2], R[1][0] * p[0] + R[1][1] * p[1] + R[1][2] * p[2], R[2][0] * p[0] + R[2][1] * p[1] + R[2][2] * p[2]];

// A shape turned by ROTS[r]: its cells moved to the positive corner, its extent, and
// the shift (m) the drawing needs to carry its details along.
export function orient(shape, r) {
  const memo = shape._o || (shape._o = {});
  if (memo[r]) return memo[r];
  const R = ROTS[r];
  let cs = shape.cells.map((c) => ap(R, [c[0] + 0.5, c[1] + 0.5, c[2] + 0.5]).map(Math.floor));
  const m = [0, 1, 2].map((i) => Math.min(...cs.map((c) => c[i])));
  cs = cs.map((c) => [c[0] - m[0], c[1] - m[1], c[2] - m[2]]);
  const ext = [0, 1, 2].map((i) => Math.max(...cs.map((c) => c[i])) + 1);
  return (memo[r] = { cells: cs, ext, m });
}

export function occOf(P, placed, shapes) {
  const o = [];
  for (let x = 0; x < P.W; x++) { o.push([]); for (let y = 0; y < P.D; y++) o[x].push(new Array(P.H).fill(-1)); }
  for (const q of placed) for (const c of orient(shapes[q.i], q.r).cells) o[c[0] + q.p[0]][c[1] + q.p[1]][c[2] + q.p[2]] = q.i;
  return o;
}
// Where an item comes to rest over (x, y), or null when its footprint leaves the floor.
// ok is false when it rests with any part above the roof line.
export function dropAt(P, occ, o, x, y) {
  if (x < 0 || y < 0 || x + o.ext[0] > P.W || y + o.ext[1] > P.D) return null;
  const free = (z) => o.cells.every((c) => { const cz = c[2] + z; return cz >= P.H || occ[c[0] + x][c[1] + y][cz] < 0; });
  let z = P.H;
  while (z > 0 && free(z - 1)) z--;
  return { z, ok: z + o.ext[2] <= P.H };
}
// An item can be lifted back out when nothing else is anywhere above it.
export function clearAbove(P, occ, o, q) {
  return o.cells.every((c) => { for (let z = c[2] + q.p[2] + 1; z < P.H; z++) { const v = occ[c[0] + q.p[0]][c[1] + q.p[1]][z]; if (v >= 0 && v !== q.i) return false; } return true; });
}
export const heightAt = (P, occ, x, y) => { for (let k = P.H - 1; k >= 0; k--) if (occ[x][y][k] >= 0) return k + 1; return 0; };

// Loads a stored packing in order through the same drop. Returns the placements, or
// null when an item does not fit or does not land where the row says.
export function replay(P, shapes, sol) {
  const placed = [];
  for (const q of sol || []) {
    if (!shapes[q.i] || placed.some((x) => x.i === q.i)) return null;
    const d = dropAt(P, occOf(P, placed, shapes), orient(shapes[q.i], q.r), q.p[0], q.p[1]);
    if (!d || !d.ok || d.z !== q.p[2]) return null;
    placed.push({ i: q.i, r: q.r, p: [q.p[0], q.p[1], d.z] });
  }
  return placed;
}

// THE PACKING LADDER, top first. The top two are names (a folk figure and a late escape
// artist: no living person, the same reasoning as Chef's ladder); the cut-offs are a
// share of the day's item count, each rung at least one re-pack wide.
export const RUNGS = ['Santa Claus', 'Harry Houdini', 'Master Mover', 'Roadie', 'Road Tripper', 'Weekend Mover', 'Overpacker', 'Left It on the Curb'];
export function bounds(n) { const ub = [0, 1]; for (const f of [0.25, 0.5, 0.75, 1, 1.5]) ub.push(Math.max(ub[ub.length - 1] + 1, Math.ceil(n * f))); return ub; }
export function rankOf(P, rp) {
  const ub = bounds(P.items.length);
  let at = 7; for (let i = 0; i < ub.length; i++) if (rp <= ub[i]) { at = i; break; }
  const rows = RUNGS.map((name, i) => ({ name, label: i === 0 ? '0 re-packs' : i === 1 ? '1 re-pack' : i === 7 ? `${ub[6] + 1} or more` : `${ub[i - 1] + 1} to ${ub[i]}` }));
  return { rows, at };
}
