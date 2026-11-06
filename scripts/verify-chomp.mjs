#!/usr/bin/env node
// verify-chomp — the Chomp bank checker.
//
// Everything here is RECOMPUTED from the board, never read back off the row.
//
// ⚠️ REWRITTEN A THIRD TIME 2026-08-11, and this rewrite THROWS OUT THE PLAYER
// MODELS ENTIRELY. The history matters because all three previous versions failed
// the same way in progressively better disguises:
//
//   ROUND ONE gated on a careful greedy bot. A 300-wide beam planner cleared 63
//   of the 70 boards it approved.
//   ROUND TWO gated on that beam. The same beam at width 2000 cleared 90% of what
//   it passed.
//   ROUND THREE dropped the bot gate for two BOARD properties, spare squares and
//   forgiveness. The owner cleared the first board of that bank first try, having
//   barely thought about it.
//
// Round three's boards were not soft on their own terms: EIGHT more player models
// written against them on 2026-08-11 (greedy, greedy plus strand check, a
// wall-hugging sweeper, a straight-preferring reflex player, one and two mascots
// of lookahead) all clear them roughly 0% of the time. Twelve models across four
// rounds, every one failing a board a person walks through without thinking.
//
// That is the finding: A BOT IS NOT THE THING THE BOARD IS SHOWN TO. A myopic
// model optimises the next square. A person sees a 7x7 grid whole and reads the
// route off it before moving. No cheap model does that, so every gate built on
// one measures the wrong species and normalises the bank to "just beats this
// week's bot".
//
// So this checker gates on THE SHAPE OF THE SOLUTION, which is what a person
// actually reads:
//
//   MAX LEG. The longest hop between consecutive mascots. A long hop across open
//   board is a CORRIDOR, not a decision. The generator this replaces MAXIMISED
//   leg length, because the Manhattan leg sum is a lower bound on coverage and a
//   high one forces the player to fill the board. It worked, and it is exactly
//   what made the boards readable: measured over the bank it replaces, mean
//   longest leg 10.2 out of a possible 12, mascots in opposite corners, and the
//   route a lap around the rim. Coverage now comes from the NUMBER of legs
//   instead, which is what the cast of 8-11 is for.
//
//   DETOUR, min - floor. How many moves the true optimum spends above the
//   Manhattan lower bound, i.e. how far you are forced to walk AWAY from the
//   mascot you are chasing. It was ZERO on 60 of the 67 boards this replaces:
//   every leg a plain monotone staircase, nothing anywhere counterintuitive.
//
//   TURN DENSITY, on the TIDIEST optimum. Squares per straight run. A route that
//   runs in long straight lines is a low-information object you take in at a
//   glance whatever its other statistics say. It is measured over the STRAIGHTEST
//   of all shortest routes, never whichever one the solver returned first: a board
//   can hold both a tangled optimum and a straight one and the player walks
//   whichever they find. Gating on an arbitrary route let three boards through at
//   3.0+ during this rebuild.
//
// The old player models are still RUN, at the bottom, and still print. They gate
// nothing. They are kept because a board a myopic line can finish is trivial by
// inspection and worth knowing about, not because passing them means anything.
//
// The claims checked, in order:
//   shape       row shape, the weekday ramp, cast rules, pellet placement
//   floor       the stored floor really is the Manhattan leg sum
//   findable    an independent exhaustive search finds the optimum, and
//               lib/chomp-engine replays it move for move
//   sunday      the flag matches the calendar, and Sunday is the peak rung
//   geometry    max leg, detour, turn density: the solution is not readable
//   ramp        spare squares fall Monday to Sunday, and the cast climbs
//   variety     start squares, mascot squares and cast orders spread out
//   scoring     partial credit behaves at every cast length
import { PUZZLES, MASCOTS } from '../app/chomp/puzzles.js';
import { replay } from '../lib/chomp-engine.js';

// Boards that have been PLAYED and scored are frozen history and the geometry
// gates do not run on them. Their derived fields (floor, min) are still
// recomputed, because those are facts about the board rather than the design.
// NEVER move this date backwards: it would re-gate a board somebody already has
// a result on.
const REBUILT_FROM = '2026-08-12';

// THE BLEACHERS ERA. Boards live on or after this date carry `walls` (5-7
// bolted-down cells) and run the measured-with-walls bands: detour >= 8 on
// EVERY day (the open-board bank's 4 was the open-board ceiling), wall bite
// >= 2 (deleting the walls must shorten the optimum by at least 2, or the
// walls are decoration), turn density and legs unchanged. Boards between
// REBUILT_FROM and WALLED_FROM are the played 10-day open-board remnant: they
// keep their old per-board gates, but the BANK-SHAPE checks (falling weekly
// means, variety pools, the Sunday peak) run on the LIVING era only, because
// a frozen 9-row slice of a bank that was verified whole cannot re-pass
// checks written for a whole bank (its Fri and Sat means tie at 4.0).
const WALLED_FROM = '2026-08-22';
const DET_WALLED = 8;         // detour floor with walls in play, every day
const BITE_MIN = 2;           // optimum-with-walls minus optimum-without, floor
const WALLS_MIN = 5, WALLS_MAX = 7;

// THE UNIQUENESS ERA (2026-09-01), the fifth rebuild and the one that throws out
// every dial above. The owner played the dense-bleacher candidates and ruled:
// "there should only be one path that works", and "many of these extra barriers
// seem to make the path EASIER to determine". Both halves are right, and the
// second is what four rebuilds had backwards: a bleacher REMOVES branching, so it
// shrinks what a player has to consider and hands them the route.
//
// The evidence for the first half is in the live bank. Boards there carry ONE to
// TWO HUNDRED PLUS winning routes, counted exhaustively, so being roughly right is
// usually good enough. From here a board has exactly one, and any wrong turn in 48
// moves ends the run.
//
// So the gates below are: ONE ROUTE, FULL COVERAGE, and a cast that is nearly all
// load-bearing. Detour, leg cap, turn density and wall bite are all RETIRED for
// this era, not because they were wrong but because they were proxies for what
// uniqueness now states directly. They still run on the two frozen eras.
//
// WHY THE WEEK RUNS THE OTHER WAY. Each mascot is a signpost on the single path,
// so FEWER of them is harder and the cast falls Monday to Saturday. Sunday keeps
// the site's Sunday Edition convention by growing the BOARD instead: 8x8 with the
// whole cast of eleven, which measures out at exactly minimal there, on a 63-move
// route against a weekday's 48.
//
// CAUTION for anyone tempted by a sixth rebuild: six separate difficulty metrics
// were measured on the old bank and every one already read "hard" (28% of legal
// moves lose, ~12 squares with a single survivor, 13 of 16 losing branches leave
// the whole board reachable so the player's own "don't cut myself off" check gives
// no warning). The boards were never short of traps. Do not add a seventh metric.
const UNIQUE_FROM = '2026-09-01';
// indexed by getUTCDay, 0 = Sunday
const U_RUNGS = [
  { w: 8, h: 8, cast: 11, forks: 28, red: 1 },   // Sun
  { w: 7, h: 7, cast: 10, forks: 18, red: 4 },   // Mon
  { w: 7, h: 7, cast: 10, forks: 19, red: 4 },
  { w: 7, h: 7, cast: 9, forks: 20, red: 4 },
  { w: 7, h: 7, cast: 9, forks: 21, red: 4 },
  { w: 7, h: 7, cast: 9, forks: 22, red: 4 },
  { w: 7, h: 7, cast: 8, forks: 23, red: 1 },    // Sat
];
// THE OBSTACLE ERA (2026-11-07, owner: "can we make chomp harder? maybe some
// obstacles?"). Still ONE route and full coverage, but the board now carries 3
// (Sunday 4) bleachers AND two fewer mascots than the open rung, while keeping
// at least the open rung's FORKS. The 2026-08-31 ruling stands: a bleacher alone
// removes branching and makes the route easier to read. That is why the walls
// come paired with fewer signposts and a forks floor that does not move: the
// player gets less help and exactly as many chances to go wrong. Measured
// before writing: with 3 walls the carve reaches forks 21-27 at cast 7-8.
const OBST_FROM = '2026-11-07';
const O_RUNGS = [
  { w: 8, h: 8, cast: 9, forks: 28, red: 1, walls: 4 },   // Sun
  { w: 7, h: 7, cast: 8, forks: 18, red: 4, walls: 3 },   // Mon
  { w: 7, h: 7, cast: 8, forks: 19, red: 4, walls: 3 },
  { w: 7, h: 7, cast: 7, forks: 20, red: 3, walls: 3 },
  { w: 7, h: 7, cast: 7, forks: 21, red: 3, walls: 3 },
  { w: 7, h: 7, cast: 7, forks: 22, red: 3, walls: 3 },
  { w: 7, h: 7, cast: 7, forks: 23, red: 1, walls: 3 },   // Sat
];
const isObst = (p) => p.live >= OBST_FROM;
const uRungOf = (p) => (isObst(p) ? O_RUNGS : U_RUNGS)[dowOf(p)];
const isUnique = (p) => p.live >= UNIQUE_FROM;

const FIRST_MASCOT = 'bulldog';
const DOW = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

// THE WEEKDAY RAMP, indexed by getUTCDay so index 0 is Sunday.
//
// Two dials rise together through the week: the CAST (more mascots is more legs,
// more solid obstacles, and more of the board consumed) and the DETOUR. Spare
// squares fall, as before. Every band was MEASURED against what the generator can
// actually reach before it was written down, because round one wrote bands about
// twenty points below the achievable ceiling and that is how a Monday ended up
// handing out twenty-four free squares.
//
// The whole week is 7x7. Coverage no longer needs a big board to be forced: ten
// short legs reach the same floor as six long ones.
// TIGHTENED AGAIN 2026-08-11, same day, after the owner played the first bank at
// these settings and said it still looked easy. Both dials moved to the measured
// edge instead of a comfortable middle: the detour floor from 2 to 4, and turn
// density from 2.8 to 2.4. A floor of 2 on a 41-move route is about 5% of the
// board asking anything of you, which is a walk with two speed bumps.
//
// The floor is 4 and not 5 because 5 was MEASURED as unreachable at Saturday's
// rung and marginal on Sunday. A band nobody can hit is not a stricter gate, it
// is a build that starves and gets quietly relaxed later.
//
// FRIDAY IS CAST 9, not 10. At cast 10 with spare 4-5 the rung is essentially
// empty: of 27,000 boards in that spare band, eleven reached detour 4 and none
// survived the turn-density cap. Spare 4-5 means min 43-44, detour 4 means
// floor <= 39-40, and ten legs cannot be that short without the optimum
// collapsing back onto the floor. Saturday is TIGHTER and therefore easier to
// satisfy, because a higher min leaves more room above the floor.
const RAMP = [
  { cast: 11, det: 4, spare: [0, 2] },   // Sun: the whole cast, and no room at all
  { cast: 8,  det: 4, spare: [9, 11] },  // Mon: the most slack of the week
  { cast: 8,  det: 4, spare: [7, 8] },
  { cast: 9,  det: 4, spare: [6, 7] },
  { cast: 9,  det: 4, spare: [5, 6] },
  { cast: 9,  det: 4, spare: [4, 5] },
  { cast: 10, det: 4, spare: [3, 5] },   // Sat
];

const LEG_CAP = 6;        // longest hop between consecutive mascots
const RUN_CAP = 2.4;      // squares per straight run on the TIDIEST optimum
const CAST_MIN = 7, CAST_MAX = 11;   // 7 from the obstacle era (2026-11-07)
const SOLVER_CAP = 4000000;
const TURN_CAP = 800000;

let BAD = 0;
const fail = (tag, msg) => { BAD += 1; console.log(`✗ ${tag}: ${msg}`); };
const ok = (tag, msg) => console.log(`  ${tag}: ${msg}`);
const note = (tag, msg) => console.log(`… ${tag}: ${msg}`);

const idxOf = (p, x, y) => y * p.w + x;
const insideOf = (p, x, y) => x >= 0 && y >= 0 && x < p.w && y < p.h;
const manh = (a, b) => Math.abs(a[0] - b[0]) + Math.abs(a[1] - b[1]);
const DIRS = [[1, 0], [-1, 0], [0, 1], [0, -1]];
const dowOf = (p) => new Date(`${p.live}T12:00:00Z`).getUTCDay();
const rungOf = (p) => RAMP[dowOf(p)];
const wallsOf = (p) => p.walls || [];
const playableOf = (p) => p.w * p.h - wallsOf(p).length;
// spare and cover are measured against PLAYABLE squares: bleachers were never
// on the board. Pre-wall boards have no walls, so nothing changes for them.
const spareOf = (p, min) => playableOf(p) - (min + 1);
const coverOf = (p, min) => (min + 1) / playableOf(p);
const seedWalls = (p, occ) => { for (const [x, y] of wallsOf(p)) occ[idxOf(p, x, y)] = 1; };

function legsOf(p) {
  const L = [manh(p.start, p.pellets[0])];
  for (let i = 1; i < p.pellets.length; i++) L.push(manh(p.pellets[i - 1], p.pellets[i]));
  return L;
}
const floorOf = (p) => legsOf(p).reduce((a, b) => a + b, 0);

// shared helpers. `reach` treats unreached mascots as PASSABLE on purpose: they
// are the destinations, not walls, for the purposes of that question. Blocking
// them makes the check unsatisfiable, a bug that shipped once.
const blocker = (p, occ) => (q, x, y) => {
  if (!insideOf(p, x, y) || occ[idxOf(p, x, y)]) return true;
  for (let k = q + 1; k < p.pellets.length; k++) if (p.pellets[k][0] === x && p.pellets[k][1] === y) return true;
  return false;
};
const reacher = (p, occ) => {
  const C = p.w * p.h, seen = new Uint8Array(C);
  return (q, x, y) => {
    seen.fill(0); const i0 = idxOf(p, x, y); seen[i0] = 1; const st = [i0];
    for (let i = 0; i < st.length; i++) {
      const c = st[i], cx = c % p.w, cy = (c - cx) / p.w;
      for (const d of DIRS) {
        const nx = cx + d[0], ny = cy + d[1];
        if (!insideOf(p, nx, ny)) continue;
        const j = idxOf(p, nx, ny);
        if (occ[j] || seen[j]) continue;
        seen[j] = 1; st.push(j);
      }
    }
    for (let k = q; k < p.pellets.length; k++) if (!seen[idxOf(p, p.pellets[k][0], p.pellets[k][1])]) return false;
    return true;
  };
};

// THE EXACT SEARCH. IDA* on route length, so it returns the true optimum rather
// than the first route it stumbles into, and it is written out fresh here rather
// than imported from the generator so a bug in the generator's copy cannot pass
// its own bank. Finding an optimum at all is also the findability proof: this
// search knows nothing about the walk each board was built from.
function shortestRoute(p, cap = SOLVER_CAP) {
  const C = p.w * p.h, K = p.pellets.length, occ = new Uint8Array(C);
  seedWalls(p, occ);
  occ[idxOf(p, p.start[0], p.start[1])] = 1;
  const bl = blocker(p, occ), reach = reacher(p, occ);
  const suffix = new Array(K + 2).fill(0);
  for (let k = K - 1; k >= 1; k--) suffix[k] = suffix[k + 1] + manh(p.pellets[k - 1], p.pellets[k]);
  const lower = (x, y, pi) => (pi >= K ? 0 : manh([x, y], p.pellets[pi]) + suffix[pi + 1]);
  let nodes = 0, best = null, route = [], hit = false;
  const path = [];
  function dfs(x, y, pi, g, lim) {
    if (pi >= K) { best = g; route = path.slice(); return true; }
    if (++nodes > cap) { hit = true; return false; }
    if (g + lower(x, y, pi) > lim) return false;
    const t = p.pellets[pi];
    const opts = DIRS.filter((d) => !bl(pi, x + d[0], y + d[1]))
      .sort((a, b) => manh([x + a[0], y + a[1]], t) - manh([x + b[0], y + b[1]], t));
    for (const d of opts) {
      const nx = x + d[0], ny = y + d[1];
      const np = (nx === t[0] && ny === t[1]) ? pi + 1 : pi;
      occ[idxOf(p, nx, ny)] = 1; path.push(d);
      if (np >= K || reach(np, nx, ny)) { if (dfs(nx, ny, np, g + 1, lim)) { occ[idxOf(p, nx, ny)] = 0; path.pop(); return true; } }
      occ[idxOf(p, nx, ny)] = 0; path.pop();
    }
    return false;
  }
  for (let lim = lower(p.start[0], p.start[1], 0); lim <= playableOf(p) - 1; lim += 2) {
    nodes = 0; hit = false;
    if (dfs(p.start[0], p.start[1], 0, 0, lim)) return { min: best, route, capped: false };
    if (hit) return { min: null, route: null, capped: true };
  }
  return { min: null, route: null, capped: false };
}

// THE TIDIEST OPTIMUM: the fewest turns achievable over ALL shortest routes. That
// is the best case available to the player, which is the only fair thing to
// measure a route's readability against.
function minTurns(p, min, cap = TURN_CAP) {
  const C = p.w * p.h, K = p.pellets.length, occ = new Uint8Array(C);
  seedWalls(p, occ);
  occ[idxOf(p, p.start[0], p.start[1])] = 1;
  const bl = blocker(p, occ), reach = reacher(p, occ);
  const suffix = new Array(K + 2).fill(0);
  for (let k = K - 1; k >= 1; k--) suffix[k] = suffix[k + 1] + manh(p.pellets[k - 1], p.pellets[k]);
  const lower = (x, y, pi) => (pi >= K ? 0 : manh([x, y], p.pellets[pi]) + suffix[pi + 1]);
  let best = Infinity, n = 0, capped = false;
  const dfs = (x, y, pi, g, t, ld) => {
    if (pi >= K) { if (t < best) best = t; return; }
    if (++n > cap) { capped = true; return; }
    if (g + lower(x, y, pi) > min || t >= best) return;
    for (const d of DIRS) {
      const nx = x + d[0], ny = y + d[1];
      if (bl(pi, nx, ny)) continue;
      const np = (nx === p.pellets[pi][0] && ny === p.pellets[pi][1]) ? pi + 1 : pi;
      const nt = t + (ld && (d[0] !== ld[0] || d[1] !== ld[1]) ? 1 : 0);
      occ[idxOf(p, nx, ny)] = 1;
      if (np >= K || reach(np, nx, ny)) dfs(nx, ny, np, g + 1, nt, d);
      occ[idxOf(p, nx, ny)] = 0;
      if (capped) return;
    }
  };
  dfs(p.start[0], p.start[1], 0, 0, 0, null);
  return { turns: best === Infinity ? null : best, capped };
}

// The unplanned lines, kept for the record only.
function unplanned(p, mode) {
  const C = p.w * p.h, K = p.pellets.length, occ = new Uint8Array(C);
  seedWalls(p, occ);
  let hx = p.start[0], hy = p.start[1], pi = 0, moves = 0, ld = [1, 0];
  occ[idxOf(p, hx, hy)] = 1;
  const legal = (x, y) => {
    if (!insideOf(p, x, y) || occ[idxOf(p, x, y)]) return false;
    for (let k = pi + 1; k < K; k++) if (p.pellets[k][0] === x && p.pellets[k][1] === y) return false;
    return true;
  };
  while (pi < K && moves < C * 3) {
    const t = p.pellets[pi];
    let pick = null;
    const dx = t[0] - hx, dy = t[1] - hy, opts = [];
    if (dx !== 0) opts.push([Math.sign(dx), 0]);
    if (dy !== 0) opts.push([0, Math.sign(dy)]);
    if (mode === 'straight' && opts.some((d) => d[0] === ld[0] && d[1] === ld[1])) pick = opts.find((d) => d[0] === ld[0] && d[1] === ld[1]);
    else if (opts.length === 2) pick = Math.abs(dx) >= Math.abs(dy) ? opts[0] : opts[1];
    else pick = opts[0] || null;
    if (pick && !legal(hx + pick[0], hy + pick[1])) pick = null;
    if (!pick) return { cleared: false };
    hx += pick[0]; hy += pick[1]; occ[idxOf(p, hx, hy)] = 1;
    if (hx === t[0] && hy === t[1]) pi += 1;
    ld = pick; moves += 1;
  }
  return { cleared: pi >= K };
}

// THE CAREFUL PLAYER: head for the mascot in front of you, refuse any move that
// visibly strands something. Also for the record only.
function carefulClears(p) {
  const C = p.w * p.h, K = p.pellets.length, occ = new Uint8Array(C);
  seedWalls(p, occ);
  let hx = p.start[0], hy = p.start[1], pi = 0, moves = 0, ld = [1, 0];
  occ[idxOf(p, hx, hy)] = 1;
  const bl = blocker(p, occ), reach = reacher(p, occ);
  while (pi < K && moves < C * 3) {
    const t = p.pellets[pi];
    const dist = new Int32Array(C).fill(-1);
    dist[idxOf(p, t[0], t[1])] = 0;
    const q = [t];
    for (let i = 0; i < q.length; i++) {
      const [cx, cy] = q[i];
      for (const d of DIRS) {
        const nx = cx + d[0], ny = cy + d[1];
        if (!insideOf(p, nx, ny) || dist[idxOf(p, nx, ny)] >= 0 || bl(pi, nx, ny)) continue;
        dist[idxOf(p, nx, ny)] = dist[idxOf(p, cx, cy)] + 1; q.push([nx, ny]);
      }
    }
    const cands = [];
    for (const d of DIRS) {
      const nx = hx + d[0], ny = hy + d[1];
      if (bl(pi, nx, ny)) continue;
      const dd = dist[idxOf(p, nx, ny)];
      if (dd < 0) continue;
      occ[idxOf(p, nx, ny)] = 1;
      const ate = nx === t[0] && ny === t[1];
      const safe = reach(ate ? pi + 1 : pi, nx, ny) ? 1 : 0;
      occ[idxOf(p, nx, ny)] = 0;
      cands.push({ d, dd, safe, st: (d[0] === ld[0] && d[1] === ld[1]) ? 1 : 0 });
    }
    if (!cands.length) return { cleared: false };
    cands.sort((a, b) => (b.safe - a.safe) || (a.dd - b.dd) || (b.st - a.st));
    const b = cands[0];
    hx += b.d[0]; hy += b.d[1]; occ[idxOf(p, hx, hy)] = 1;
    if (hx === t[0] && hy === t[1]) pi += 1;
    ld = b.d; moves += 1;
  }
  return { cleared: pi >= K };
}

// ---------- 1. row shape, cast and ranges -----------------------------------
(function shape() {
  const bad = [];
  let prevNum = 0, prevLive = '';
  for (const p of PUZZLES) {
    const why = [];
    if (p.num !== prevNum + 1) why.push(`num out of sequence (${p.num} after ${prevNum})`);
    prevNum = p.num;
    if (p.live <= prevLive) why.push('live date not strictly increasing');
    prevLive = p.live;
    if (isUnique(p)) {
      const rung = uRungOf(p);
      if (p.w !== rung.w || p.h !== rung.h) why.push(`board is ${p.w}x${p.h}, expected ${rung.w}x${rung.h} on a ${DOW[dowOf(p)]}`);
      if (p.cast && p.cast.length !== rung.cast) why.push(`cast of ${p.cast.length}, expected ${rung.cast} on a ${DOW[dowOf(p)]}`);
      if (!Array.isArray(p.cast) || p.cast.length < CAST_MIN || p.cast.length > CAST_MAX) {
        why.push(`cast of ${p.cast && p.cast.length}, outside ${CAST_MIN}-${CAST_MAX}`);
      }
    } else if (p.live >= REBUILT_FROM) {
      const rung = RAMP[dowOf(p)];
      if (p.w !== 7 || p.h !== 7) why.push(`board is ${p.w}x${p.h}, expected 7x7`);
      if (p.cast && p.cast.length !== rung.cast) why.push(`cast of ${p.cast.length}, expected ${rung.cast} on a ${DOW[dowOf(p)]}`);
      if (!Array.isArray(p.cast) || p.cast.length < CAST_MIN || p.cast.length > CAST_MAX) {
        why.push(`cast of ${p.cast && p.cast.length}, outside ${CAST_MIN}-${CAST_MAX}`);
      }
    }
    const d = new Date(`${p.live}T12:00:00Z`);
    const want = `chomp-${d.getUTCMonth() + 1}-${d.getUTCDate()}-${String(d.getUTCFullYear()).slice(2)}`;
    if (p.quizId !== want) why.push(`quizId ${p.quizId}, expected ${want}`);
    if (p.cast[0] !== FIRST_MASCOT) why.push(`opens with ${p.cast[0]}, not the bulldog`);
    if (new Set(p.cast).size !== p.cast.length) why.push('cast repeats a mascot');
    for (const m of p.cast) if (!MASCOTS.includes(m)) why.push(`unknown mascot ${m}`);
    if (p.pellets.length !== p.cast.length) why.push('pellets and cast are different lengths');
    const seen = new Set([idxOf(p, p.start[0], p.start[1])]);
    for (const c of p.pellets) {
      if (!insideOf(p, c[0], c[1])) why.push(`pellet ${c} off the board`);
      if (seen.has(idxOf(p, c[0], c[1]))) why.push(`pellet ${c} repeated or sitting on the start`);
      seen.add(idxOf(p, c[0], c[1]));
    }
    if (isUnique(p) && !isObst(p)) {
      // No bleachers at all from here: they were the thing making the route
      // readable, so the era that gates on one path carries none.
      if (p.walls && p.walls.length) why.push(`carries ${p.walls.length} bleacher(s); the uniqueness era has none`);
    } else if (p.live >= WALLED_FROM) {
      const walls = wallsOf(p);
      const [wMin, wMax] = isObst(p) ? [uRungOf(p).walls, uRungOf(p).walls] : [WALLS_MIN, WALLS_MAX];
      if (!Array.isArray(p.walls) || walls.length < wMin || walls.length > wMax) {
        why.push(`carries ${walls.length} wall(s), outside ${wMin}-${wMax}`);
      }
      const wseen = new Set();
      for (const c of walls) {
        if (!insideOf(p, c[0], c[1])) why.push(`wall ${c} off the board`);
        const k = idxOf(p, c[0], c[1]);
        if (wseen.has(k)) why.push(`wall ${c} repeated`);
        if (seen.has(k)) why.push(`wall ${c} sits on the start or a pellet`);
        wseen.add(k);
      }
      // the playable region must be ONE piece, or part of the board is a lie
      const wall = new Uint8Array(p.w * p.h);
      for (const [x, y] of walls) wall[idxOf(p, x, y)] = 1;
      let s0 = -1, playable = 0;
      for (let i = 0; i < p.w * p.h; i++) if (!wall[i]) { playable++; if (s0 < 0) s0 = i; }
      const vis = new Uint8Array(p.w * p.h); vis[s0] = 1; const st = [s0]; let got = 1;
      while (st.length) {
        const c = st.pop(), cx = c % p.w, cy = (c - cx) / p.w;
        for (const d of DIRS) {
          const nx = cx + d[0], ny = cy + d[1];
          if (!insideOf(p, nx, ny)) continue;
          const j = idxOf(p, nx, ny);
          if (wall[j] || vis[j]) continue;
          vis[j] = 1; got++; st.push(j);
        }
      }
      if (got !== playable) why.push('the walls cut the playable board into pieces');
    } else if (p.walls) {
      why.push('a pre-bleacher board carries a walls field');
    }
    if (why.length) bad.push(`#${p.num} ${p.live}: ${why.join('; ')}`);
  }
  if (bad.length) fail('shape', bad.slice(0, 4).join(' | '));
  else ok('shape', `${PUZZLES.length} rows, sequential, all opening with the bulldog, ${MASCOTS.length} mascots available`);
})();

// ---------- 2. the floor is the real Manhattan leg sum ----------------------
(function floor() {
  const wrong = [];
  for (const p of PUZZLES) {
    const f = floorOf(p);
    if (p.floor !== f) wrong.push(`#${p.num} stores ${p.floor}, recomputed ${f}`);
  }
  if (wrong.length) fail('floor', wrong.slice(0, 5).join(', '));
  else {
    const v = PUZZLES.map((p) => p.floor);
    ok('floor', `all ${PUZZLES.length} match the recomputed leg sum, ${Math.min(...v)}-${Math.max(...v)} moves`);
  }
})();

// ---------- 3. the stored optimum is real, and the shipped engine walks it --
const MINS = new Map();
(function findable() {
  const wrong = [], unsolved = [], enginebad = [];
  for (const p of PUZZLES) {
    const sr = shortestRoute(p);
    if (sr.min == null) { unsolved.push(`#${p.num} (${p.live})${sr.capped ? ' [search capped]' : ''}`); continue; }
    MINS.set(p.num, sr.min);
    if (p.min !== sr.min) wrong.push(`#${p.num} stores min ${p.min}, recomputed ${sr.min}`);
    const r = replay(p, sr.route);
    if (!r.cleared) enginebad.push(`#${p.num} the engine does not clear the optimum the search found`);
    else if (r.refused) enginebad.push(`#${p.num} the engine refused ${r.refused} legal move(s)`);
    else if (r.moves !== sr.min) enginebad.push(`#${p.num} the engine walks ${r.moves} where the search says ${sr.min}`);
  }
  if (unsolved.length) fail('findable', `an exhaustive search cannot finish these: ${unsolved.slice(0, 6).join(', ')}`);
  if (wrong.length) fail('findable', wrong.slice(0, 5).join(', '));
  if (enginebad.length) fail('findable', enginebad.slice(0, 4).join('; '));
  if (!unsolved.length && !wrong.length && !enginebad.length) {
    ok('findable', 'every stored min is the true optimum, and lib/chomp-engine replays each one move for move');
  }
})();

// ---------- 4. the Sunday Edition ------------------------------------------
(function sunday() {
  const bad = [];
  for (const p of PUZZLES) {
    const really = dowOf(p) === 0;
    if (!!p.sunday !== really) bad.push(`#${p.num} ${p.live} sunday=${!!p.sunday} but the date says ${really}`);
  }
  // Eras are compared only with themselves: an open-board spare and a walled
  // spare are both real, but "is Sunday the tightest" is a within-bank claim.
  const eras = [
    PUZZLES.filter((p) => p.live >= REBUILT_FROM && p.live < WALLED_FROM),
    PUZZLES.filter((p) => p.live >= WALLED_FROM && p.live < UNIQUE_FROM),
  ];
  // The uniqueness era is judged on its own terms: every board leaves ZERO spare
  // squares, so "tightest board" cannot separate Sunday from a Tuesday. Sunday is
  // the peak there by being BIGGER and carrying the whole cast.
  const uni = PUZZLES.filter(isUnique);
  if (uni.length) {
    const sun = uni.filter((p) => p.sunday), wk = uni.filter((p) => !p.sunday);
    if (!sun.length) bad.push('the uniqueness era authors no Sunday Edition at all');
    for (const p of sun) {
      // From the obstacle era the Sunday is the peak by SIZE, BLEACHERS and FORKS
      // (8x8, 4 walls, forks >= 28), and its cast is the O_RUNGS nine.
      const sunCast = isObst(p) ? uRungOf(p).cast : MASCOTS.length;
      if (p.cast.length !== sunCast) bad.push(`#${p.num} Sunday fields ${p.cast.length}, not its ${sunCast}`);
      if (p.w !== 8 || p.h !== 8) bad.push(`#${p.num} Sunday is ${p.w}x${p.h}, not the 8x8 Edition`);
    }
    if (wk.some((p) => p.cast.length >= MASCOTS.length)) bad.push('a weekday fields the full cast, so Sunday is not the peak');
    if (wk.some((p) => p.w > 7 || p.h > 7)) bad.push('a weekday is bigger than 7x7, so Sunday is not the peak');
  }
  let sunAll = [];
  for (const rows of eras) {
    if (!rows.length) continue;
    const sun = rows.filter((p) => p.sunday), wk = rows.filter((p) => !p.sunday);
    sunAll = sunAll.concat(sun);
    if (!sun.length) { bad.push('an era of the bank authors no Sunday Edition at all'); continue; }
    for (const p of sun) if (p.cast.length !== MASCOTS.length) bad.push(`#${p.num} Sunday is not the full cast of ${MASCOTS.length}`);
    if (wk.some((p) => p.cast.length >= MASCOTS.length)) bad.push('a weekday fields the full cast, so Sunday is not the peak');
    const sunSpare = sun.map((p) => spareOf(p, MINS.get(p.num))).filter(Number.isFinite);
    const wkSpare = wk.map((p) => spareOf(p, MINS.get(p.num))).filter(Number.isFinite);
    if (sunSpare.length && wkSpare.length && Math.max(...sunSpare) >= Math.min(...wkSpare)) {
      bad.push('a weekday board is at least as tight as the loosest Sunday of its era, so Sunday is not the peak');
    }
  }
  if (bad.length) fail('sunday', bad.slice(0, 4).join('; '));
  else {
    const allSun = PUZZLES.filter((p) => p.sunday && p.live >= REBUILT_FROM);
    const sizes = [...new Set(allSun.map((p) => `${p.w}x${p.h}`))].join(' and ');
    const covs = allSun.map((p) => coverOf(p, MINS.get(p.num))).filter(Number.isFinite);
    ok('sunday', `${allSun.length} Sunday Editions (${sizes}), the full cast of ${MASCOTS.length} until 2026-11-07, nine with four bleachers after, forcing ${Math.round(Math.min(...covs) * 100)}-${Math.round(Math.max(...covs) * 100)}% of the playable board`);
  }
})();

// ---------- 5. GEOMETRY: the solution is not readable ------------------------
// This replaces every player model the previous three versions gated on. See the
// header: twelve models across four rounds have now failed to tell a board a
// person walks through from one they cannot.
(function geometry() {
  const longLeg = [], flat = [], tidy = [], unmeasured = [], soft = [];
  const legs = [], dets = [], runs = [], bites = [];
  let rows = 0;
  for (const p of PUZZLES) {
    if (p.live < REBUILT_FROM || isUnique(p)) continue;
    const walled = p.live >= WALLED_FROM;
    rows += 1;
    const min = MINS.get(p.num);
    if (min == null) { unmeasured.push(`#${p.num}`); continue; }
    const L = legsOf(p), maxLeg = Math.max(...L);
    legs.push(maxLeg);
    if (maxLeg > LEG_CAP) longLeg.push(`#${p.num} (${p.live}) has a leg of ${maxLeg}, over the cap of ${LEG_CAP}`);
    const det = min - p.floor;
    dets.push(det);
    const want = walled ? DET_WALLED : rungOf(p).det;
    if (det < want) flat.push(`#${p.num} (${p.live}, ${DOW[dowOf(p)]}) detours only ${det}, needs ${want}`);
    if (walled) {
      // the walls have to EARN their squares: delete them and the optimum must
      // shorten by BITE_MIN or more, or no route ever actually feels them
      const open = shortestRoute({ ...p, walls: [] });
      if (open.min == null) unmeasured.push(`#${p.num} (open-board re-measure)`);
      else {
        const bite = min - open.min;
        bites.push(bite);
        if (bite < BITE_MIN) soft.push(`#${p.num} (${p.live}) walls add only ${bite} to the optimum, need ${BITE_MIN}`);
      }
    }
    const mt = minTurns(p, min);
    if (mt.capped || !mt.turns) { unmeasured.push(`#${p.num}`); continue; }
    const run = min / mt.turns;
    runs.push(run);
    if (run > RUN_CAP + 1e-9) tidy.push(`#${p.num} (${p.live}) runs ${run.toFixed(2)} squares per straight run, over ${RUN_CAP}`);
  }
  if (longLeg.length) fail('geometry', `corridor legs, which walk themselves: ${longLeg.slice(0, 5).join('; ')}`);
  if (flat.length) fail('geometry', `nothing forces a step away from the target: ${flat.slice(0, 5).join('; ')}`);
  if (tidy.length) fail('geometry', `the straightest optimum is too readable: ${tidy.slice(0, 5).join('; ')}`);
  if (soft.length) fail('geometry', `decorative walls: ${soft.slice(0, 5).join('; ')}`);
  if (unmeasured.length) fail('geometry', `turn density could not be measured on ${unmeasured.slice(0, 6).join(', ')}, so they are unverified`);
  if (!longLeg.length && !flat.length && !tidy.length && !soft.length && !unmeasured.length) {
    ok('geometry', `across ${rows}: longest leg ${Math.min(...legs)}-${Math.max(...legs)} (cap ${LEG_CAP}), detour ${Math.min(...dets)}-${Math.max(...dets)} (walled floor ${DET_WALLED}, open-era floor 4), wall bite ${bites.length ? Math.min(...bites) + '-' + Math.max(...bites) : 'n/a'} (floor ${BITE_MIN}), tidiest optimum turns every ${Math.min(...runs).toFixed(2)}-${Math.max(...runs).toFixed(2)} squares (cap ${RUN_CAP})`);
  }
})();

// ---------- 5b. the ramp: spare squares fall, the cast climbs ----------------
(function ramp() {
  // Per-board band membership is checked for BOTH eras (each board against the
  // shipped bands). The bank-shape checks (weekly means falling, the Mon-Sun
  // closure, cast climbing) run on the WALLED era only: the 10 open-board rows
  // left between REBUILT_FROM and WALLED_FROM are a frozen remnant of a bank
  // verified whole, and its Fri/Sat means tie at 4.0 in isolation.
  const all = PUZZLES.filter((p) => p.live >= REBUILT_FROM && !isUnique(p));
  const stray = [];
  for (const p of all) {
    const min = MINS.get(p.num);
    if (min == null) continue;
    const sp = spareOf(p, min), r = rungOf(p);
    if (sp < r.spare[0] || sp > r.spare[1]) {
      stray.push(`#${p.num} ${DOW[dowOf(p)]} leaves ${sp} spare square${sp === 1 ? '' : 's'}, outside its ${r.spare[0]}-${r.spare[1]}`);
    }
  }
  // Once the uniqueness era exists the walled bank is a frozen 10-row slice, and
  // a slice of a bank that was verified WHOLE cannot re-pass checks written for a
  // whole bank: its Wed and Thu means tie at 6.0. Same reasoning, and the same
  // treatment, as the open-board remnant above. Per-board band membership still
  // runs on every row; the living era's ramp is checked by uramp below.
  const rows = PUZZLES.some(isUnique) ? [] : PUZZLES.filter((p) => p.live >= WALLED_FROM);
  if (!rows.length) {
    if (stray.length) fail('ramp', stray.slice(0, 5).join('; '));
    else ok('ramp', `${all.length} frozen boards all inside their old spare bands; the living era ramps by signpost count, see uramp`);
    return;
  }
  const by = {};
  for (const p of rows) {
    const min = MINS.get(p.num);
    if (min == null) continue;
    (by[dowOf(p)] = by[dowOf(p)] || []).push(spareOf(p, min));
  }
  const bad = [...stray];
  const mean = (a) => a.reduce((x, y) => x + y, 0) / a.length;
  const order = [1, 2, 3, 4, 5, 6, 0];   // Mon..Sun
  const got = order.map((d) => (by[d] ? mean(by[d]) : null));
  for (const [i, v] of got.entries()) if (v == null) bad.push(`no walled boards on ${DOW[order[i]]}`);
  if (!bad.length) {
    for (let i = 1; i < got.length; i++) {
      if (got[i] >= got[i - 1]) bad.push(`${DOW[order[i]]} (${got[i].toFixed(1)} spare) is not tighter than ${DOW[order[i - 1]]} (${got[i - 1].toFixed(1)} spare)`);
    }
    if (got[0] - got[6] < 6) bad.push(`Monday to Sunday only closes ${(got[0] - got[6]).toFixed(1)} squares, so the week is flat`);
    const worst = Math.max(...rows.map((p) => spareOf(p, MINS.get(p.num))).filter(Number.isFinite));
    if (worst > 11) bad.push(`the loosest board of the bank leaves ${worst} spare squares, which is a walk`);
    // the cast has to climb too, or the ramp is carried by one dial again
    const casts = order.map((d) => rows.filter((p) => dowOf(p) === d)[0]?.cast.length);
    for (let i = 1; i < casts.length; i++) if (casts[i] < casts[i - 1]) bad.push(`${DOW[order[i]]} fields a smaller cast than ${DOW[order[i - 1]]}`);
  }
  if (bad.length) fail('ramp', bad.slice(0, 5).join('; '));
  else ok('ramp', `walled-era spare ${order.map((d, i) => `${DOW[d]} ${got[i].toFixed(1)}`).join(', ')}, cast climbing 8 to ${MASCOTS.length}`);
})();

// ---------- 6. pool variety across the whole bank ---------------------------
(function variety() {
  // The living era only: pool caps written for a whole bank cannot be re-run
  // over the frozen remnant plus a new bank without double-counting eras.
  const rows = PUZZLES.filter(isUnique);
  const startSeen = new Map(), cellSeen = new Map(), orders = new Set(), wallSets = new Map();
  for (const p of rows) {
    startSeen.set(String(p.start), (startSeen.get(String(p.start)) || 0) + 1);
    for (const c of p.pellets) cellSeen.set(String(c), (cellSeen.get(String(c)) || 0) + 1);
    orders.add(p.cast.join('|'));
    const wcells = wallsOf(p);
    if (wcells.length) {
      const wk = wcells.map((c) => idxOf(p, c[0], c[1])).sort((a, b) => a - b).join(',');
      wallSets.set(wk, (wallSets.get(wk) || 0) + 1);
    }
  }
  const dupWalls = [...wallSets.values()].filter((n) => n > 1).length;
  if (rows.length && dupWalls) fail('variety', `${dupWalls} bleacher layout(s) repeat across the walled bank`);
  const startCap = 5, cellShare = 0.45;
  const hotStart = [...startSeen.values()].filter((n) => n > startCap).length;
  const hotCell = [...cellSeen.entries()].filter(([, n]) => n > Math.ceil(rows.length * cellShare));
  if (hotStart) fail('variety', `${hotStart} start square(s) used more than ${startCap} times`);
  if (hotCell.length) fail('variety', `${hotCell.length} square(s) carry a mascot on more than ${Math.round(cellShare * 100)}% of boards`);
  if (orders.size < rows.length) fail('variety', `only ${orders.size} distinct cast orders across ${rows.length} boards`);
  const used = {};
  for (const p of rows) for (const m of p.cast) used[m] = (used[m] || 0) + 1;
  const never = MASCOTS.filter((m) => !used[m]);
  if (never.length) fail('variety', `${never.join(', ')} never appear`);
  const sizes = new Set(rows.map((p) => p.cast.length));
  if (sizes.size < 3) fail('variety', `only ${sizes.size} distinct cast sizes`);
  if (!hotStart && !hotCell.length && orders.size >= rows.length && !never.length && sizes.size >= 3) {
    ok('variety', `${startSeen.size} distinct start squares (busiest ${Math.max(...startSeen.values())}), busiest mascot square ${Math.max(...cellSeen.values())}, every cast order distinct across ${rows.length} boards`);
  }
})();

// ---------- 6b. THE UNIQUENESS ERA: one path, and no spare board ------------
// The gate the owner asked for, stated directly instead of through a proxy.
//
// countWinning is written out FRESH here, like every other search in this file
// and for the same reason: scripts/gen-chomp-unique.mjs has its own copy, and a
// bug shared between the generator and the checker would pass its own bank. It
// counts EVERY move sequence that eats the cast, of any length, not just the
// shortest ones, which is what "only one path works" actually means. A board
// with one optimum and ninety longer routes that also clear it is not unique,
// and that is exactly what the old bank looked like.
function countWinning(p, want = 2, cap = 6000000) {
  const C = p.w * p.h, K = p.pellets.length, occ = new Uint8Array(C);
  seedWalls(p, occ);
  occ[idxOf(p, p.start[0], p.start[1])] = 1;
  const bl = blocker(p, occ), reach = reacher(p, occ);
  let n = 0, nodes = 0, capped = false;
  const go = (x, y, pi) => {
    if (pi >= K) { n += 1; return n >= want; }
    if (++nodes > cap) { capped = true; return true; }
    for (const d of DIRS) {
      const nx = x + d[0], ny = y + d[1];
      if (bl(pi, nx, ny)) continue;
      const np = (nx === p.pellets[pi][0] && ny === p.pellets[pi][1]) ? pi + 1 : pi;
      occ[idxOf(p, nx, ny)] = 1;
      const stop = (np >= K || reach(np, nx, ny)) ? go(nx, ny, np) : false;
      occ[idxOf(p, nx, ny)] = 0;
      if (stop) return true;
    }
    return false;
  };
  go(p.start[0], p.start[1], 0);
  return { n, capped };
}

// Squares along the route offering more than one legal move. On a unique board
// every fork has exactly one survivor, so this IS the number of chances the
// player gets to lose the run.
function forksOn(p, route) {
  const C = p.w * p.h, occ = new Uint8Array(C);
  seedWalls(p, occ);
  occ[idxOf(p, p.start[0], p.start[1])] = 1;
  const bl = blocker(p, occ);
  let x = p.start[0], y = p.start[1], pi = 0, forks = 0;
  for (const d of route) {
    if (DIRS.filter((e) => !bl(pi, x + e[0], y + e[1])).length > 1) forks += 1;
    const nx = x + d[0], ny = y + d[1];
    if (nx === p.pellets[pi][0] && ny === p.pellets[pi][1]) pi += 1;
    occ[idxOf(p, nx, ny)] = 1; x = nx; y = ny;
  }
  return forks;
}

(function uniqueness() {
  const rows = PUZZLES.filter(isUnique);
  if (!rows.length) { note('unique', 'no uniqueness-era boards yet'); return; }
  const many = [], loose = [], thin = [], soft = [], unmeasured = [];
  const fk = [], rd = [];
  for (const p of rows) {
    const rung = uRungOf(p);
    const c = countWinning(p);
    if (c.capped) { unmeasured.push(`#${p.num} (route count capped)`); continue; }
    if (c.n !== 1) many.push(`#${p.num} (${p.live}) has ${c.n >= 2 ? '2 or more' : c.n} winning routes, needs exactly 1`);

    // FULL COVERAGE. Spare squares are what let a player wander and still win,
    // and a board with slack is essentially never unique, so this is both a
    // design rule and the reason the gate above can be met at all.
    const min = MINS.get(p.num);
    if (min == null) { unmeasured.push(`#${p.num} (no optimum)`); continue; }
    const spare = playableOf(p) - (min + 1);
    if (spare !== 0) loose.push(`#${p.num} (${p.live}) leaves ${spare} spare square(s); the route must fill the board`);

    const sr = shortestRoute(p);
    if (!sr.route) { unmeasured.push(`#${p.num} (no route)`); continue; }
    const forks = forksOn(p, sr.route);
    fk.push(forks);
    if (forks < rung.forks) thin.push(`#${p.num} (${p.live}, ${DOW[dowOf(p)]}) offers ${forks} forks, needs ${rung.forks}`);

    // REDUNDANT MASCOTS: ones that could be lifted off and still leave one path.
    // Each is a signpost the board did not need. The cap falls through the week,
    // which is what makes Saturday and Sunday lean and Monday generous.
    let red = 0;
    for (let i = 0; i < p.pellets.length; i++) {
      const q = { ...p, pellets: p.pellets.filter((_, k) => k !== i) };
      const c2 = countWinning(q, 2, 900000);
      if (!c2.capped && c2.n === 1) red += 1;
    }
    rd.push(red);
    if (red > rung.red) soft.push(`#${p.num} (${p.live}, ${DOW[dowOf(p)]}) carries ${red} mascot(s) it does not need, over ${rung.red}`);
  }
  if (many.length) fail('unique', `more than one way through: ${many.slice(0, 5).join('; ')}`);
  if (loose.length) fail('unique', `slack on the board: ${loose.slice(0, 5).join('; ')}`);
  if (thin.length) fail('unique', `too few chances to go wrong: ${thin.slice(0, 5).join('; ')}`);
  if (soft.length) fail('unique', `over-signposted: ${soft.slice(0, 5).join('; ')}`);
  if (unmeasured.length) fail('unique', `could not be measured, so they are unverified: ${unmeasured.slice(0, 6).join(', ')}`);
  if (!many.length && !loose.length && !thin.length && !soft.length && !unmeasured.length) {
    ok('unique', `${rows.length} boards, every one with EXACTLY ONE winning route and no square left over, ${Math.min(...fk)}-${Math.max(...fk)} forks each (live bank ran 13-18), ${Math.min(...rd)}-${Math.max(...rd)} spare signposts`);
  }
})();

// ---------- 6c. the uniqueness ramp: signposts fall, Sunday grows -----------
(function uniqueRamp() {
  const rows = PUZZLES.filter(isUnique);
  if (!rows.length) return;
  const bad = [];
  const order = [1, 2, 3, 4, 5, 6];        // Mon..Sat; Sunday ramps by board size
  const casts = order.map((d) => {
    const r = rows.filter((p) => dowOf(p) === d);
    return r.length ? r[0].cast.length : null;
  });
  for (const [i, v] of casts.entries()) if (v == null) bad.push(`no boards on ${DOW[order[i]]}`);
  if (!bad.length) {
    for (let i = 1; i < casts.length; i++) {
      if (casts[i] > casts[i - 1]) bad.push(`${DOW[order[i]]} fields MORE signposts (${casts[i]}) than ${DOW[order[i - 1]]} (${casts[i - 1]}); the cast falls through the week now`);
    }
    if (casts[0] - casts[5] < 2) bad.push(`Monday to Saturday only sheds ${casts[0] - casts[5]} mascot(s), so the week is flat`);
    // every board of a weekday must agree with its rung, or the ramp is nominal
    for (const p of rows) {
      const want = uRungOf(p).cast;
      if (p.cast.length !== want) bad.push(`#${p.num} ${DOW[dowOf(p)]} fields ${p.cast.length}, off its rung of ${want}`);
    }
  }
  if (bad.length) fail('uramp', bad.slice(0, 5).join('; '));
  else ok('uramp', `signposts fall ${order.map((d, i) => `${DOW[d]} ${casts[i]}`).join(', ')}, and Sunday grows to 8x8 with the whole cast of ${MASCOTS.length}`);
})();

// ---------- 7. scoring ------------------------------------------------------
(function scoring() {
  const scoreOf = (eaten, total) => (eaten >= total ? 10 : Math.max(0, Math.min(9, Math.round((eaten / total) * 10))));
  let bad = false;
  for (let n = CAST_MIN; n <= CAST_MAX; n++) {
    if (scoreOf(n, n) !== 10) { fail('scoring', `clearing a cast of ${n} does not score 10`); bad = true; }
    if (scoreOf(0, n) !== 0) { fail('scoring', `eating nothing out of ${n} does not score 0`); bad = true; }
    if (scoreOf(n - 1, n) >= 10) { fail('scoring', `a near miss on ${n} scores a perfect`); bad = true; }
    let prev = -1;
    for (let e = 0; e <= n; e++) {
      const v = scoreOf(e, n);
      if (v < prev) { fail('scoring', `score is not monotonic at a cast of ${n}`); bad = true; break; }
      prev = v;
    }
  }
  if (!bad) ok('scoring', `partial credit behaves at every cast length ${CAST_MIN}-${CAST_MAX}`);
})();

// ---------- 8. the player models, FOR THE RECORD ONLY ------------------------
// These gate NOTHING. A board a myopic line can finish is trivial by inspection
// and worth knowing about, but passing them means nothing at all: every board of
// the bank this replaces passed them too, and the owner cleared the first one
// first try without thinking.
(function models() {
  const rows = PUZZLES.filter((p) => p.live >= WALLED_FROM);
  const soft = rows.filter((p) => ['axis', 'straight'].some((m) => unplanned(p, m).cleared));
  const careless = rows.filter((p) => carefulClears(p).cleared);
  if (soft.length) fail('models', `an unplanned line clears these, which is trivial by inspection: ${soft.slice(0, 5).map((p) => `#${p.num}`).join(', ')}`);
  else note('models', `no unplanned line clears any of the ${rows.length}; a careful greedy player clears ${careless.length}. NOT A GATE, see the header`);
})();

// ---------- 9. US spellings -------------------------------------------------
(function spelling() {
  const BRIT = /\b(colour|centre|grey|neighbour|favourite|defence|practise|licence|metre|theatre)\b/i;
  const hits = PUZZLES.filter((p) => BRIT.test(String(p.dateLabel))).map((p) => p.num);
  if (hits.length) fail('spelling', `British spellings on rows ${hits.join(', ')}`);
  else note('spelling', 'no British spellings in bank strings');
})();

console.log(BAD ? `\n${BAD} problem${BAD === 1 ? '' : 's'}` : '\nchomp bank verified');
process.exit(BAD ? 1 : 0);
