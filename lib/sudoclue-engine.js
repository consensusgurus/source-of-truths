// Sudoclue rules engine, shared by the client and scripts/verify-sudoclue.mjs.
//
// THE RULES. N people stand on an N by N floor plan, exactly one in every row
// and one in every column, each on an open square: open floor, or a seat
// (chair, bench, rug, bed, car, boat...). Water, trees, tables and the rest are
// not squares a person can stand on. Every person also has a hidden role.
// One of them is the VICTIM, and the KILLER is the one person who was alone in
// a room with the victim: the victim's room holds exactly two people. The rest
// split into the accomplice and the day's guests, staff and family.
//
// Clues are structured specs (the text beside them is display only):
//   at      {p, pr}     person p satisfies predicate pr
//   with / notwith {p,q} same room / different rooms
//   north / east {p,q}  p's row is above q's (column east of q's), different rooms
//   col     {p, o}      someone else is one column west of p, on object o
//   isrole / notrole {p, r}
//   same    {p, q, r}   p and q share role r
//   some    {r, pr}     at least one person with role r satisfies pr
//   every   {r, pr}     every person with role r satisfies pr
//   none    {r, pr}     no person with role r satisfies pr
// Predicates: room {v}, notroom {v}, io {v: outdoors?}, on {v: object},
// beside {v: object, not on it}, floor (no object), corner (of its room).
//
// solve() counts solutions up to `cap` and returns them, so the verifier can
// prove there is exactly one and the client can derive it from the clues
// (the answer never ships to the browser).

const SEAT = new Set(['bench', 'lounger', 'chair', 'armchair', 'rug', 'sofa', 'stool', 'boat', 'swanboat', 'car', 'hottub', 'bed', 'bowbridge', 'birdcage', 'gazebo', 'carriage']);
const WATER_SEAT = new Set(['boat', 'swanboat', 'bowbridge']);

export const ROLESETS = {
  7: ['Accomplice', 'Guest', 'Guest', 'Staff', 'Staff'],
  8: ['Accomplice', 'Guest', 'Guest', 'Staff', 'Staff', 'Family'],
  9: ['Accomplice', 'Guest', 'Guest', 'Staff', 'Staff', 'Family', 'Family'],
  10: ['Accomplice', 'Guest', 'Guest', 'Guest', 'Staff', 'Staff', 'Family', 'Family'],
};
export const ROLE_ORDER = ['Victim', 'Killer', 'Accomplice', 'Guest', 'Staff', 'Family'];

export function prepare(L) {
  const N = L.rooms.length;
  const obj = {};
  for (const it of L.items || []) for (let dr = 0; dr < it.h; dr++) for (let dc = 0; dc < it.w; dc++) obj[`${it.r + dr},${it.c + dc}`] = it.t;
  const water = new Set(Object.keys(L.cells || {}).filter((k) => L.cells[k] === 'water'));
  const room = (r, c) => L.rooms[r][c];
  const out = (k) => !!(L.rinfo[k] && L.rinfo[k].out);
  const open = (r, c) => { const k = `${r},${c}`; const o = obj[k]; return (!water.has(k) || WATER_SEAT.has(o)) && (!o || SEAT.has(o)); };
  const nb = (r, c) => [[r + 1, c], [r - 1, c], [r, c + 1], [r, c - 1]].filter(([a, b]) => a >= 0 && b >= 0 && a < N && b < N);
  const objAt = (r, c) => obj[`${r},${c}`];
  const corner = (r, c) => {
    const same = nb(r, c).filter(([a, b]) => room(a, b) === room(r, c));
    const vert = same.some(([a]) => a !== r), hor = same.some(([, b]) => b !== c);
    return same.length <= 2 && !(same.length === 2 && (!vert || !hor));
  };
  const test = (pr, [r, c]) => {
    switch (pr.k) {
      case 'room': return room(r, c) === pr.v;
      case 'notroom': return room(r, c) !== pr.v;
      case 'io': return out(room(r, c)) === pr.v;
      case 'on': return objAt(r, c) === pr.v;
      case 'beside': return objAt(r, c) !== pr.v && nb(r, c).some(([a, b]) => objAt(a, b) === pr.v);
      case 'floor': return !objAt(r, c);
      case 'corner': return corner(r, c);
      default: throw new Error(`unknown predicate ${pr.k}`);
    }
  };
  return { N, room, open, objAt, test, out };
}

export function solve(L, cast, clues, cap = 2) {
  const G = prepare(L);
  const N = G.N;
  const roleset = ROLESETS[N];
  const all = ['Victim', 'Killer', ...roleset];
  const cells = [];
  for (let r = 0; r < N; r++) for (let c = 0; c < N; c++) if (G.open(r, c)) cells.push([r, c]);
  const dom = {};
  const rdom = {};
  for (const p of cast) { dom[p] = cells.slice(); rdom[p] = new Set(all); }
  for (const c of clues) {
    if (c.k === 'at') dom[c.p] = dom[c.p].filter((x) => G.test(c.pr, x));
    if (c.k === 'isrole') rdom[c.p] = new Set([...rdom[c.p]].filter((r) => r === c.r));
    if (c.k === 'notrole') rdom[c.p].delete(c.r);
  }
  const pair = clues.filter((c) => ['with', 'notwith', 'north', 'east'].includes(c.k));
  const colC = clues.filter((c) => c.k === 'col');
  const roleC = clues.filter((c) => ['same', 'some', 'every', 'none'].includes(c.k));
  const pairOk = (c, a) => {
    const x = a[c.p], y = a[c.q];
    const rx = G.room(x[0], x[1]), ry = G.room(y[0], y[1]);
    if (c.k === 'with') return rx === ry;
    if (c.k === 'notwith') return rx !== ry;
    if (c.k === 'north') return x[0] < y[0] && rx !== ry;
    return x[1] > y[1] && rx !== ry;
  };
  const roleOk = (c, pl, ra) => {
    if (c.k === 'same') return ra[c.p] === c.r && ra[c.q] === c.r;
    const mem = cast.filter((p) => ra[p] === c.r);
    if (c.k === 'some') return mem.some((p) => G.test(c.pr, pl[p]));
    if (c.k === 'every') return mem.every((p) => G.test(c.pr, pl[p]));
    return !mem.some((p) => G.test(c.pr, pl[p]));
  };
  const sols = [];
  const asg = {};
  const usedR = new Set(), usedC = new Set();
  function roles(pl) {
    for (const v of cast) {
      if (!rdom[v].has('Victim')) continue;
      const rk = G.room(pl[v][0], pl[v][1]);
      const inr = cast.filter((p) => G.room(pl[p][0], pl[p][1]) === rk);
      if (inr.length !== 2) continue;
      const k = inr.find((p) => p !== v);
      if (!rdom[k].has('Killer')) continue;
      const rest = cast.filter((p) => p !== v && p !== k);
      const ra = { [v]: 'Victim', [k]: 'Killer' };
      const pool = roleset.slice();
      const rec = (i) => {
        if (sols.length >= cap) return;
        if (i === rest.length) {
          if (roleC.every((c) => roleOk(c, pl, ra))) sols.push({ place: { ...pl }, roles: { ...ra } });
          return;
        }
        const p = rest[i];
        const seen = new Set();
        for (let j = 0; j < pool.length; j++) {
          const r = pool[j];
          if (seen.has(r) || !rdom[p].has(r)) continue;
          seen.add(r);
          ra[p] = r; pool.splice(j, 1);
          rec(i + 1);
          pool.splice(j, 0, r);
        }
        delete ra[p];
      };
      rec(0);
      if (sols.length >= cap) return;
    }
  }
  function place() {
    if (sols.length >= cap) return;
    const left = cast.filter((p) => !asg[p]);
    if (!left.length) {
      if (colC.every((c) => cast.some((q) => q !== c.p && asg[q][1] === asg[c.p][1] - 1 && G.objAt(asg[q][0], asg[q][1]) === c.o))) roles(asg);
      return;
    }
    let best = null, bc = null;
    for (const p of left) {
      const cand = dom[p].filter(([r, c]) => !usedR.has(r) && !usedC.has(c));
      if (!cand.length) return;
      if (!best || cand.length < bc.length) { best = p; bc = cand; }
    }
    for (const x of bc) {
      asg[best] = x;
      if (pair.every((c) => !(c.p === best || c.q === best) || !asg[c.p] || !asg[c.q] || pairOk(c, asg))) {
        usedR.add(x[0]); usedC.add(x[1]);
        place();
        usedR.delete(x[0]); usedC.delete(x[1]);
      }
      delete asg[best];
    }
  }
  place();
  return sols;
}

// The finished answer, compared field by field with the player's board.
export function sameAnswer(sol, place, roles) {
  return Object.keys(sol.place).every((p) => place[p] && place[p][0] === sol.place[p][0] && place[p][1] === sol.place[p][1] && roles[p] === sol.roles[p]);
}
