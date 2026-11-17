// verify-plow: the checker for Plow (app/plow/puzzles.js), discovered by
// scripts/verify-all.mjs. Re-checks every rule in scripts/gen-plow.mjs:
//   - one town a day from 2026-11-17, quizId / dateLabel / sunday from `live`
//   - the ramp by weekday (Mon 15-19 streets ... Sun 50-58), with the band that goes
//     with the day; the launch day (Maple Hill, 2026-11-17) is the gentle Monday size
//   - every street joins two corners that exist; a court is a loop on a corner
//     pointing straight out of the map; a bridge runs from one bank to the other
//     and only bridges cross the river; the river days carry the bridges they say
//   - streets never cross except at a shared corner, and a court never touches
//     another street
//   - the depot and the barn are the ONLY corners with an odd number of streets,
//     everything is joined up, the barn is across the river from the depot exactly
//     when the bridges are odd in number
//   - the stored route plows every street exactly once, depot to barn
//   - labels name real streets; no em dash anywhere
import { checker, checkDays, dowOf } from './six-verify-common.mjs';
import { plowModel, checkRoute, degrees, segDist, COURT_STEM, COURT_R } from '../lib/plow-engine.js';
const { PUZZLES } = await import(new URL('../app/plow/puzzles.js', import.meta.url));
const { bad, done } = checker('plow');
checkDays('plow', PUZZLES, bad, '2026-11-17');
const SPEC = { 1: ['gentle', 15, 19, 0], 2: ['gentle', 19, 24, 0], 3: ['moderate', 25, 30, 0], 4: ['moderate', 30, 36, 1], 5: ['tough', 34, 42, 1], 6: ['tough', 40, 48, 2], 0: ['sunday', 50, 58, 3] };
const unit = (u) => Array.isArray(u) && u.length === 2 && Math.abs(Math.hypot(u[0], u[1]) - 1) < 1e-9 && (u[0] === 0 || u[1] === 0);
function segsCross(a, b, c, d) {
  const o = (p, q, r) => Math.sign((q[0] - p[0]) * (r[1] - p[1]) - (q[1] - p[1]) * (r[0] - p[0]));
  return o(a, b, c) * o(a, b, d) < 0 && o(c, d, a) * o(c, d, b) < 0;
}
for (const p of PUZZLES) {
  const dow = dowOf(p.live), [band, lo, hi, courts] = p.live === '2026-11-17' ? SPEC[1] : SPEC[dow];
  if (p.band !== band) bad(p.num, `band ${p.band}, should be ${band}`);
  if (!p.town) bad(p.num, 'no town name');
  const n = p.edges.length;
  if (n < lo || n > hi) bad(p.num, `${n} streets, should be ${lo} to ${hi}`);
  const nc = p.edges.filter((e) => e.court).length;
  if (p.live !== '2026-11-22' && nc !== courts) bad(p.num, `${nc} cul-de-sacs, should be ${courts}`);
  if (!p.nodes[p.start] || !p.nodes[p.end] || p.start === p.end) { bad(p.num, 'depot or barn corner missing'); continue; }
  if (!unit(p.startDir) || !unit(p.endDir)) bad(p.num, 'depot and barn face straight out');
  let broken = false;
  p.edges.forEach((e, i) => {
    if (!p.nodes[e.a] || !p.nodes[e.b]) { bad(p.num, `street ${i} joins a missing corner`); broken = true; }
    if (e.court && (e.a !== e.b || !unit(e.court))) bad(p.num, `court ${i} is not a loop pointing straight out`);
    if (!e.court && e.a === e.b) bad(p.num, `street ${i} is a loop`);
  });
  if (broken) continue;
  const M = plowModel(p);
  // geometry: no crossings away from shared corners, courts stand clear
  for (let i = 0; i < M.E.length; i++) for (let j = i + 1; j < M.E.length; j++) {
    const A = M.E[i], B = M.E[j];
    const share = [A.a, A.b].some((x) => x === B.a || x === B.b);
    for (let s = 1; s < A.P.length; s++) for (let t = 1; t < B.P.length; t++) {
      if (share) continue;
      if (segsCross(A.P[s - 1], A.P[s], B.P[t - 1], B.P[t])) { bad(p.num, `streets ${i} and ${j} cross`); s = A.P.length; break; }
    }
    if (A.court || B.court) {
      const C = A.court ? A : B, O = A.court ? B : A;
      if (O.a === C.a || O.b === C.a) continue;
      const mind = Math.min(...C.P.map((q) => Math.min(...O.P.slice(1).map((r, k) => segDist(q, O.P[k], r)))));
      if (mind < 60) bad(p.num, `court ${C.i} runs within ${Math.round(mind)} of street ${O.i}`);
    }
  }
  // the river
  if (p.river) {
    const br = p.edges.filter((e) => e.bridge);
    const wantBr = dow === 5 ? 2 : 3;
    if (br.length !== wantBr) bad(p.num, `${br.length} bridges, should be ${wantBr}`);
    const bank = (id) => (p.nodes[id][1] < p.river.y ? 'N' : 'S');
    p.edges.forEach((e, i) => { if (!e.court && (bank(e.a) !== bank(e.b)) !== !!e.bridge) bad(p.num, `street ${i} ${e.bridge ? 'is a bridge on one bank' : 'crosses the river without a bridge'}`); });
    if ((bank(p.start) !== bank(p.end)) !== (br.length % 2 === 1)) bad(p.num, 'barn on the wrong bank for the number of bridges');
    if (dow !== 0 && dow !== 5 && dow !== 6) bad(p.num, 'a river on a weekday before Friday');
  } else if ([0, 5, 6].includes(dow) && p.live !== '2026-11-17') bad(p.num, 'no river on a Friday to Sunday');
  // parity and connection
  const d = degrees(p);
  const odd = Object.keys(d).filter((k) => d[k] % 2);
  if (odd.length !== 2 || !odd.includes(p.start) || !odd.includes(p.end)) bad(p.num, `odd corners ${odd.join(' ')}, should be only the depot and barn`);
  const err = checkRoute(p, p.sol);
  if (err) bad(p.num, err);
  for (const L of p.labels || []) { const e = p.edges[L.e]; if (!e || e.court) bad(p.num, `label ${L.t} names no street`); }
  if (!p.pad || ['l', 'r', 't', 'b'].some((k) => !(p.pad[k] >= 120))) bad(p.num, 'pad missing');
  void COURT_STEM; void COURT_R;
}
done(PUZZLES);
