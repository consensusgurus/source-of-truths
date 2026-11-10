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

const SEAT = new Set(['bench', 'lounger', 'chair', 'armchair', 'rug', 'sofa', 'stool', 'boat', 'swanboat', 'car', 'hottub', 'bed', 'bowbridge', 'birdcage', 'gazebo', 'carriage', 'carousel', 'base', 'mound', 'plate', 'redseat', 'lifeguard']);
const WATER_SEAT = new Set(['boat', 'swanboat', 'bowbridge']);

export const ROLESETS = {
  7: ['Accomplice', 'Guest', 'Guest', 'Staff', 'Staff'],
  8: ['Accomplice', 'Guest', 'Guest', 'Staff', 'Staff', 'Family'],
  9: ['Accomplice', 'Guest', 'Guest', 'Staff', 'Staff', 'Family', 'Family'],
  10: ['Accomplice', 'Guest', 'Guest', 'Guest', 'Staff', 'Staff', 'Family', 'Family'],
};
export const ROLE_ORDER = ['Victim', 'Killer', 'Accomplice', 'Guest', 'Staff', 'Family'];
// THREE ROLES, NOTES ONLY (owner, 2026-11-03: "let's just keep killer, victim, accomplice ... make the deduction a
// bit more involved ... maybe the victim and killer aren't in the same room", then picked "notes only"). A board
// marked `three: true` (No. 6, Nov 4, on) has exactly three roles and everyone else has none. There is NO rule
// tying the killer to the victim's room: the detective's notes alone decide all three, and they chain (the killer
// north of the accomplice, exactly two of the three outdoors, the victim alone in their room). Pass
// { three: true } to solve / solveRoles for those boards.
export const ROLES3 = ['Victim', 'Killer', 'Accomplice'];

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
      case 'cell': return r === pr.v[0] && c === pr.v[1];
      default: throw new Error(`unknown predicate ${pr.k}`);
    }
  };
  return { N, room, open, objAt, test, out };
}

// TWO STAGES (owner, 2026-10-30): placement clues alone must fix the board, then role clues alone fix the
// roles on that board. ROLE_KINDS are the second stage; everything else is the first.
export const ROLE_KINDS = new Set(['isrole', 'notrole', 'same', 'some', 'every', 'none', 'rrel', 'prel', 'count', 'says']);
export const isRoleClue = (c) => ROLE_KINDS.has(c.k);

// Placement only: counts boards (one per row and column) that the placement clues allow, roles ignored.
export function solvePlacement(L, cast, clues, cap = 2) {
  return solve(L, cast, clues.filter((c) => !isRoleClue(c)), cap, { placeOnly: true });
}
// Roles only, on a known board: counts role assignments the role clues allow there.
export function solveRoles(L, cast, place, clues, cap = 2, opts = {}) {
  const pin = cast.map((p) => ({ k: 'at', p, pr: { k: 'cell', v: place[p] } }));
  return solve(L, cast, [...pin, ...clues.filter(isRoleClue)], cap, opts);
}

// Role-note helpers shared by solve() and gradeRoles(): predicates that need the whole board ('alone', 'company'),
// and the relations a note can state between two people.
function prOn(G, pr, p, pl, cast) {
  if (pr.k === 'alone' || pr.k === 'company') {
    const rk = G.room(pl[p][0], pl[p][1]); const n = cast.filter((q) => G.room(pl[q][0], pl[q][1]) === rk).length;
    return pr.k === 'alone' ? n === 1 : n > 1;
  }
  return G.test(pr, pl[p]);
}
function relOn(G, rel, x, y, pl) {
  const a = pl[x], b = pl[y];
  switch (rel) {
    case 'north': return a[0] < b[0];
    case 'south': return a[0] > b[0];
    case 'east': return a[1] > b[1];
    case 'west': return a[1] < b[1];
    case 'with': return G.room(a[0], a[1]) === G.room(b[0], b[1]);
    case 'notwith': return G.room(a[0], a[1]) !== G.room(b[0], b[1]);
  }
  throw new Error(`unknown relation ${rel}`);
}
// one note against one full assignment {Victim: p, Killer: q, Accomplice: r}
// For the generator: one note against one full assignment, on a board already run through prepare().
export function noteOn(G, c, h, pl, cast) { return note3(G, c, h, pl, cast); }
function note3(G, c, h, pl, cast) {
  switch (c.k) {
    case 'isrole': return h[c.r] === c.p;
    case 'notrole': return h[c.r] !== c.p;
    case 'some': return prOn(G, c.pr, h[c.r], pl, cast);
    case 'every': return prOn(G, c.pr, h[c.r], pl, cast);
    case 'none': return !prOn(G, c.pr, h[c.r], pl, cast);
    case 'rrel': return relOn(G, c.rel, h[c.a], h[c.b], pl);
    case 'prel': return h[c.r] !== c.q && relOn(G, c.rel, h[c.r], c.q, pl);
    case 'count': return ROLES3.filter((r) => prOn(G, c.pr, h[r], pl, cast)).length === c.n;
    // THE INTERROGATION (owner, 2026-11-09): a questioned suspect's statement `s` is a note in their own words.
    // Only the killer lies, so it holds exactly when the speaker is not the killer.
    case 'says': return note3(G, c.s, h, pl, cast) === (h.Killer !== c.p);
  }
  throw new Error(`unknown role note ${c.k}`);
}
// INTERROGATION RULES (owner, 2026-11-09: "Question two or three suspects, each gives a statement, and only the
// killer lies"). From No. 12 (Tue Nov 10) a three-role board questions 2 suspects Monday to Wednesday and 3 Thursday
// to Sunday. The killer is always one of them, the victim never is (the dead give no statements), and every
// statement but the killer's is true. A board with no `says` notes has no interrogation and no extra rule.
export const askedOf = (clues) => clues.filter((c) => c.k === 'says').map((c) => c.p);
function askOk(asked, h) { return !asked.length || (asked.includes(h.Killer) && !asked.includes(h.Victim)); }

// HOW A PERSON NAMES THE THREE (three-role boards). Each note, read on its own against who is still possible for
// each role, crosses people off; a round is one pass over every note. Returns how many rounds it takes and
// whether that alone gets to one answer (it must: no board needs a guess). The generator prefers more rounds.
export function gradeRoles(L, cast, place, clues) {
  const G = prepare(L);
  const notes = clues.filter(isRoleClue);
  const asked = askedOf(notes);
  const C = { Victim: new Set(cast.filter((p) => !asked.includes(p))), Killer: new Set(asked.length ? asked : cast), Accomplice: new Set(cast) };
  const triples = () => { const out = []; for (const v of C.Victim) for (const k of C.Killer) if (k !== v) for (const a of C.Accomplice) if (a !== v && a !== k) out.push({ Victim: v, Killer: k, Accomplice: a }); return out; };
  let rounds = 0, firstPin = false;
  for (;;) {
    const T = triples(); const next = {}; let changed = false;
    for (const r of ROLES3) next[r] = new Set(C[r]);
    for (const c of notes) {
      const ok = T.filter((h) => note3(G, c, h, place, cast));
      for (const r of ROLES3) { const sup = new Set(ok.map((h) => h[r]));
        if (rounds === 0 && sup.size === 1 && C[r].size > 1) firstPin = true;
        for (const x of [...next[r]]) if (!sup.has(x)) { next[r].delete(x); changed = true; } }
    }
    if (!changed) break;
    rounds++; for (const r of ROLES3) C[r] = next[r];
  }
  return { rounds, solved: ROLES3.every((r) => C[r].size === 1), firstPin };
}

export function solve(L, cast, clues, cap = 2, opts = {}) {
  const G = prepare(L);
  const N = G.N;
  const three = !!opts.three;
  const roleset = three ? [] : ROLESETS[N];
  const all = three ? [...ROLES3, 'None'] : ['Victim', 'Killer', ...roleset];
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
  const pairsOf = {};
  for (const p of cast) pairsOf[p] = pair.filter((c) => c.p === p || c.q === p);
  const roleC = clues.filter((c) => ['same', 'some', 'every', 'none', 'rrel', 'prel', 'count'].includes(c.k));
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
    if (three) {
      const notes = clues.filter((c) => isRoleClue(c));
      const asked = askedOf(notes);
      for (const v of cast) { if (!rdom[v].has('Victim')) continue;
        for (const k of cast) { if (k === v || !rdom[k].has('Killer')) continue;
          for (const a of cast) { if (a === v || a === k || !rdom[a].has('Accomplice')) continue;
            if (cast.some((p) => p !== v && p !== k && p !== a && !rdom[p].has('None'))) continue;
            const h = { Victim: v, Killer: k, Accomplice: a };
            if (!askOk(asked, h)) continue;
            if (notes.every((c) => note3(G, c, h, pl, cast))) { sols.push({ place: { ...pl }, roles: { [v]: 'Victim', [k]: 'Killer', [a]: 'Accomplice' } }); if (sols.length >= cap) return; } } } }
      return;
    }
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
      if (colC.every((c) => cast.some((q) => q !== c.p && asg[q][1] === asg[c.p][1] - 1 && G.objAt(asg[q][0], asg[q][1]) === c.o))) {
        if (opts.placeOnly) sols.push({ place: { ...asg }, roles: {} }); else roles(asg);
      }
      return;
    }
    let best = null, bc = null;
    const coverR = new Set(), coverC = new Set();
    for (const p of left) {
      // forward checking (2026-11-01): a square is a candidate only if it also agrees with every pair clue whose
      // other person is already placed, so dead ends show up at once instead of deep in the search. Same answers.
      const mine = pairsOf[p];
      const cand = dom[p].filter(([r, c]) => {
        if (usedR.has(r) || usedC.has(c)) return false;
        if (!mine.length) return true;
        asg[p] = [r, c];
        const ok = mine.every((cl) => !asg[cl.p === p ? cl.q : cl.p] || pairOk(cl, asg));
        delete asg[p];
        return ok;
      });
      if (!cand.length) return;
      for (const [r, c] of cand) { coverR.add(r); coverC.add(c); }
      if (!best || cand.length < bc.length) { best = p; bc = cand; }
    }
    // every row and column still empty must be reachable by someone still to place (N people fill N rows)
    for (let i = 0; i < N; i++) if ((!usedR.has(i) && !coverR.has(i)) || (!usedC.has(i) && !coverC.has(i))) return;
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

// ---------------------------------------------------------------------------------------------------------
// HOW A PERSON SOLVES IT (owner, 2026-11-02: "the gameplay is either near impossible without guessing, or too
// easy"). solve() proves a board has one answer; it says nothing about how a player gets there. stepLog()
// places people the way a player would, one named move at a time, and logs each move in player words. The
// client uses the log for Nudge; scripts/gen-sudoclue.mjs and scripts/verify-sudoclue.mjs use gradePlacement()
// to hold every board to its day's band. Moves, easiest first:
//   Lock        a settled person claims their row and column
//   Last reach  only one person can still reach a row or column, so they are in it
//   Link        a two-person clue (same room, north of, east of) rules squares out for both
//   Squeeze     k people who can only stand in the same k rows (or columns) fill them; nobody else can
//   What-if     assume a square, follow the logic, hit a contradiction (Sunday only, at most once)
// A board that needs more than that is a guess, and no day allows one.
export function stepLog(L, cast, clues) {
  const G = prepare(L); const N = G.N; const rc = (x) => [Math.floor(x / N), x % N];
  const pc = clues.filter((c) => !isRoleClue(c));
  const D = {}; const own = {};
  for (const p of cast) { D[p] = []; for (let r = 0; r < N; r++) for (let c = 0; c < N; c++) if (G.open(r, c)) D[p].push(r * N + c); }
  for (const c of pc) if (c.k === 'at') D[c.p] = D[c.p].filter((x) => G.test(c.pr, rc(x)));
  for (const p of cast) own[p] = D[p].slice();
  const rel = pc.filter((c) => ['with', 'notwith', 'north', 'east'].includes(c.k));
  const ok = (c, x, y) => { const [r1, c1] = rc(x), [r2, c2] = rc(y); const a = G.room(r1, c1), b = G.room(r2, c2);
    if (c.k === 'with') return a === b; if (c.k === 'notwith') return a !== b; if (c.k === 'north') return r1 < r2 && a !== b; return c1 > c2 && a !== b; };
  const log = []; const pinned = new Set();
  const line = (axis, i) => { const o = []; for (let j = 0; j < N; j++) o.push(axis === 0 ? i * N + j : j * N + i); return o; };
  const word = (axis, n) => (axis === 0 ? (n === 1 ? 'row' : 'rows') : (n === 1 ? 'column' : 'columns'));
  const relText = (c) => ({ with: `${c.p} was in the same room as ${c.q}`, notwith: `${c.p} was not in the same room as ${c.q}`, north: `${c.p} was north of ${c.q}`, east: `${c.p} was east of ${c.q}` })[c.k];
  const subsets = (arr, k, s = 0, cur = [], out = []) => { if (cur.length === k) { out.push(cur.slice()); return out; } for (let i = s; i < arr.length && out.length < 5000; i++) { cur.push(arr[i]); subsets(arr, k, i + 1, cur, out); cur.pop(); } return out; };
  function one() {
    for (const p of cast) if (D[p].length === 1) { const [r, c] = rc(D[p][0]); let hit = false;
      for (const q of cast) if (q !== p) { const n = D[q].filter((x) => { const [a, b] = rc(x); return a !== r && b !== c; }); if (n.length < D[q].length) { D[q] = n; hit = true; } }
      if (hit) return { tech: 'Lock', text: `${p} is settled, so nobody else can use ${p}'s row or column.`, area: [...new Set([...line(0, r), ...line(1, c)])], who: [p] }; }
    for (const axis of [0, 1]) for (let i = 0; i < N; i++) { const who = cast.filter((p) => D[p].some((x) => rc(x)[axis] === i));
      if (who.length === 1) { const p = who[0]; const n = D[p].filter((x) => rc(x)[axis] === i); if (n.length < D[p].length) { D[p] = n;
        return { tech: 'Last reach', text: `Every ${word(axis, 1)} needs one person, and ${p} is the only one who can still reach this ${word(axis, 1)}.`, area: line(axis, i), who: [p] }; } } }
    for (const c of rel) { const np = D[c.p].filter((x) => D[c.q].some((y) => ok(c, x, y))); const nq = D[c.q].filter((y) => D[c.p].some((x) => ok(c, x, y)));
      if (np.length < D[c.p].length || nq.length < D[c.q].length) { const gone = [...D[c.p].filter((x) => !np.includes(x)), ...D[c.q].filter((x) => !nq.includes(x))]; D[c.p] = np; D[c.q] = nq;
        return { tech: 'Link', text: `${relText(c)}. Set against the squares each of them has left, that rules out the marked squares.`, area: gone, who: [c.p, c.q] }; } }
    for (let k = 2; k <= 4; k++) for (const axis of [0, 1]) { const lines = {}; for (const p of cast) lines[p] = new Set(D[p].map((x) => rc(x)[axis]));
      const ppl = cast.filter((p) => lines[p].size > 1 && lines[p].size <= k);
      for (const S of subsets(ppl, k)) { const u = new Set(); S.forEach((p) => lines[p].forEach((l) => u.add(l))); if (u.size !== k) continue;
        const gone = []; for (const q of cast) if (!S.includes(q)) { const n = D[q].filter((x) => !u.has(rc(x)[axis])); gone.push(...D[q].filter((x) => !n.includes(x))); D[q] = n; }
        if (gone.length) { const names = S.slice(0, -1).join(', ') + ' and ' + S[S.length - 1];
          return { tech: 'Squeeze', text: `${names} can only stand in these ${k} ${word(axis, k)}, so between them they fill all ${k}. Nobody else can stand there.`, area: [...u].flatMap((l) => line(axis, l)), who: S }; } } }
    return null;
  }
  for (let guard = 0; guard < 600; guard++) { const s = one(); if (!s) break;
    for (const p of cast) if (D[p].length === 1 && !pinned.has(p)) { pinned.add(p); (s.pins = s.pins || []).push([p, D[p][0]]); }
    log.push(s); if (cast.every((p) => D[p].length === 1)) break; }
  return { log, own, D, solved: cast.every((p) => D[p].length === 1) };
}

// Grade a board's placement stage: rank 0 (Lock and Last reach only), 1 (needs a Link), 2-4 (largest Squeeze),
// 5 (one What-if), 6 (two or more What-ifs), 7 (a guess).
export function gradePlacement(L, cast, clues) {
  const s = stepLog(L, cast, clues);
  const sq = s.log.filter((x) => x.tech === 'Squeeze').map((x) => x.who.length);
  const link = s.log.some((x) => x.tech === 'Link');
  if (s.solved) return { rank: sq.length ? Math.max(...sq) : (link ? 1 : 0), whatifs: 0, squeeze: sq, link, steps: s.log.length };
  // what-if: assume one square, run every move above to a contradiction, rule the square out; repeat
  const G = prepare(L); const N = G.N; const rc = (x) => [Math.floor(x / N), x % N];
  const rel = clues.filter((c) => ['with', 'notwith', 'north', 'east'].includes(c.k));
  const ok = (c, x, y) => { const [r1, c1] = rc(x), [r2, c2] = rc(y); const a = G.room(r1, c1), b = G.room(r2, c2);
    if (c.k === 'with') return a === b; if (c.k === 'notwith') return a !== b; if (c.k === 'north') return r1 < r2 && a !== b; return c1 > c2 && a !== b; };
  function prop(D) {
    for (let guard = 0; guard < 400; guard++) { let ch = false;
      for (const p of cast) if (!D[p].length) return false;
      for (const p of cast) if (D[p].length === 1) { const [r, c] = rc(D[p][0]); for (const q of cast) if (q !== p) { const n = D[q].filter((x) => { const [a, b] = rc(x); return a !== r && b !== c; }); if (n.length < D[q].length) { D[q] = n; ch = true; if (!n.length) return false; } } }
      for (const axis of [0, 1]) for (let i = 0; i < N; i++) { const who = cast.filter((p) => D[p].some((x) => rc(x)[axis] === i)); if (!who.length) return false;
        if (who.length === 1) { const p = who[0]; const n = D[p].filter((x) => rc(x)[axis] === i); if (n.length < D[p].length) { D[p] = n; ch = true; } } }
      for (const c of rel) { const np = D[c.p].filter((x) => D[c.q].some((y) => ok(c, x, y))); const nq = D[c.q].filter((y) => D[c.p].some((x) => ok(c, x, y)));
        if (np.length < D[c.p].length || nq.length < D[c.q].length) { D[c.p] = np; D[c.q] = nq; ch = true; if (!np.length || !nq.length) return false; } }
      for (const axis of [0, 1]) { const lines = {}; for (const p of cast) lines[p] = new Set(D[p].map((x) => rc(x)[axis]));
        for (let k = 2; k <= 4 && !ch; k++) { const ppl = cast.filter((p) => lines[p].size > 1 && lines[p].size <= k);
          const sub = (s0, cur) => { if (ch) return; if (cur.length === k) { const u = new Set(); cur.forEach((p) => lines[p].forEach((l) => u.add(l))); if (u.size < k) { ch = 'dead'; return; }
              if (u.size === k) for (const q of cast) if (!cur.includes(q)) { const n = D[q].filter((x) => !u.has(rc(x)[axis])); if (n.length < D[q].length) { D[q] = n; ch = true; } } return; }
            for (let i = s0; i < ppl.length; i++) sub(i + 1, [...cur, ppl[i]]); };
          sub(0, []); } if (ch === 'dead') return false; }
      if (!ch) return true; }
    return true; }
  const D = Object.fromEntries(cast.map((p) => [p, s.D[p].slice()]));
  let whatifs = 0;
  while (!cast.every((p) => D[p].length === 1)) { let hit = false;
    for (const p of cast) { if (D[p].length < 2) continue;
      for (const x of D[p]) { const T = Object.fromEntries(cast.map((q) => [q, D[q].slice()])); T[p] = [x]; if (!prop(T)) { D[p] = D[p].filter((y) => y !== x); hit = true; whatifs++; break; } }
      if (hit) break; }
    if (!hit) return { rank: 7, whatifs, squeeze: sq, link };
    if (!prop(D)) return { rank: 7, whatifs, squeeze: sq, link };
    if (whatifs > 40) return { rank: 7, whatifs, squeeze: sq, link }; }
  return { rank: whatifs <= 1 ? 5 : 6, whatifs, squeeze: sq, link };
}
// The day's band (Eastern day of week, 0 = Sunday): the hardest move a board on that day may need, and must reach.
// Wednesday came down to 1-2 on 2026-11-04 (owner: Bryant Park, a grade 3, "seems too hard"); boards dated before
// Nov 5 keep the 2-3 they were graded under (WED_WAS in verify-sudoclue).
export const DAY_BAND = { 1: [0, 1], 2: [1, 2], 3: [1, 2], 4: [2, 3], 5: [3, 4], 6: [3, 4], 0: [4, 5] };
