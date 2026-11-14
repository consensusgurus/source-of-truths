// scripts/gen-chef.mjs: deals the Chef bank (app/chef/puzzles.js). APPEND ONLY:
// every row already in the file is kept byte for byte, and new days are added
// up to --until. A board that has gone live is never re-dealt.
//   node scripts/gen-chef.mjs --until 2026-12-31
//
// The bank opens 2026-11-14 with the INTRO board (owner: "make tomorrow's an
// easier one for the intro"): three tickets and no station ever fought over.
// The week after that:
//   Mon, Tue  gentle    4 tickets of 2 to 3 dishes       Lunch
//   Wed, Thu  moderate  6 tickets of 2 to 3 dishes       Dinner
//   Fri, Sat  tough     8 tickets of 2 to 4 dishes       Friday Night / Saturday Night
// A ticket always crosses two stations and can always go out hot on its own
// (lib/chef-engine.js ticketFeasible), and a day is re-dealt until its best
// service closes inside the band's limit (CLOSES).
//   Sunday    sunday    12 tickets of 3 to 4 dishes, on the big line (three
//                       burners, two ovens, two grills, two fryers)   Sunday Brunch
// Every board is dealt from its date, so a re-run deals the same day.
//
// `best` is the lowest penalty found by two solvers that see every ticket in
// advance: a line-cook scheduler (each ticket in a priority order gets the
// earliest minute its whole order can land, the order then shuffled for a lower
// penalty) and, on the small line, a beam search over every way to fire the
// dishes. It is the top rung of the Kitchen Ladder, not a proven optimum. `sol` is that service: the dishes fired each
// minute, every ready plate trayed at once. The page strips `sol`.
import fs from 'fs';
import { MENU, STATIONS, SIT_WEIGHT, HOLD, dishList, newState, cloneState, isOpen, used, start, tick, autoPlate, isDone, penalty, replay, ticketFeasible } from '../lib/chef-engine.js';
import { MONTHS } from './six-verify-common.mjs';

const FILE = new URL('../app/chef/puzzles.js', import.meta.url);
const START = '2026-11-14';
const arg = (n) => { const i = process.argv.indexOf(n); return i > 0 ? process.argv[i + 1] : null; };
const UNTIL = arg('--until') || '2026-12-31';

function rng(seed) { let s = seed >>> 0; return () => { s = (s + 0x6D2B79F5) >>> 0; let t = s; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
const hash = (str) => { let h = 2166136261; for (const c of str) { h ^= c.charCodeAt(0); h = Math.imul(h, 16777619); } return h >>> 0; };
const KEYS = Object.keys(MENU);
const LINE = { stove: 2, oven: 1, grill: 1, fryer: 1, cold: 1 };
const BIG = { stove: 3, oven: 2, grill: 2, fryer: 2, cold: 1 };
export const SPEC = { gentle: [4, 2, 3, 3, LINE], moderate: [6, 2, 3, 2, LINE], tough: [8, 2, 4, 2, LINE], sunday: [12, 3, 4, 2, BIG] };
const INTRO = { caps: LINE, tickets: [{ at: 0, dishes: ['burger', 'fries'] }, { at: 3, dishes: ['pasta', 'salad'] }, { at: 5, dishes: ['pizza', 'soup', 'fries'] }] };

function deal(R, [n, lo, hi, gap, caps]) {
  let at = 0; const tickets = [];
  while (tickets.length < n) {
    const c = lo + Math.floor(R() * (hi - lo + 1)), ds = [];
    while (ds.length < c) { const k = KEYS[Math.floor(R() * KEYS.length)]; if (ds.filter((x) => x === k).length < (k === 'salad' ? 1 : 2)) ds.push(k); }
    if (new Set(ds.map((k) => MENU[k][1])).size < 2) continue;   // a ticket always crosses two stations
    if (!ticketFeasible(caps, ds)) continue;                     // and can always go out hot on its own
    tickets.push({ at, dishes: ds });
    at += Math.floor(R() * (gap + 1)) + (R() < 0.3 ? 1 : 0);
  }
  return { caps, tickets };
}

// ---- the solver ----
let W8 = SIT_WEIGHT;
const cost = (s) => s.wait + W8 * s.sit;
// A lower bound on the final cost from here. Two readings of the table wait
// still to come, the larger kept:
//   (a) each open ticket alone: it cannot leave before its slowest dish is done;
//   (b) each station as a queue: with c slots, the k-th dish to come off it
//       cannot finish before (the k shortest jobs' minutes) / c, and every
//       ticket waiting on that station needs one of those finishes.
// (b) is what makes standing idle cost something, so the beam keeps cooking.
function bound(P, s) {
  const L = dishList(P); let c = cost(s);
  for (let i = 0; i < L.length; i++) if (s.d[i].st === 'pass' || s.d[i].st === 'tray') c += W8 * s.d[i].age;
  const cur = new Array(P.tickets.length).fill(0); let solo = 0;
  const jobs = {}, who = {};
  for (let i = 0; i < L.length; i++) {
    const d = s.d[i], ti = L[i].t;
    if (s.t[ti].out >= 0) continue;
    const left = d.st === 'cook' ? d.rem : d.st === 'todo' ? MENU[L[i].k][2] : 0;
    if (left > cur[ti]) cur[ti] = left;
    if (left > 0) { const st = MENU[L[i].k][1]; (jobs[st] = jobs[st] || []).push(left); (who[st] = who[st] || new Set()).add(ti); }
  }
  P.tickets.forEach((t, ti) => { if (s.t[ti].out < 0) { cur[ti] += Math.max(s.m, t.at) - t.at; solo += cur[ti]; } });
  let most = solo;
  for (const st in jobs) {
    const js = jobs[st].sort((x, y) => x - y), cap = P.caps[st], T = who[st];
    let alt = solo, run = 0, k = 0;
    for (const ti of T) { run += js[k++]; alt += s.m + Math.ceil(run / cap) - P.tickets[ti].at - cur[ti]; }
    if (alt > most) most = alt;
  }
  return c + most;
}
function subsets(P, s) {
  const L = dishList(P), av = [];
  for (let i = 0; i < L.length; i++) if (s.d[i].st === 'todo' && isOpen(P, s, L[i].t)) av.push(i);
  const free = {}; for (const [st] of STATIONS) free[st] = P.caps[st] - used(P, s, st);
  const res = [], pick = [];
  (function rec(a) {
    if (a === av.length) { res.push(pick.slice()); return; }
    rec(a + 1);
    const i = av[a], st = MENU[L[i].k][1];
    if (free[st] > 0) {
      const p = a > 0 ? av[a - 1] : -1;
      if (p >= 0 && L[p].t === L[i].t && L[p].k === L[i].k && !pick.includes(p)) return;   // twins: fire the first one first
      free[st]--; pick.push(i); rec(a + 1); pick.pop(); free[st]++;
    }
  })(0);
  return res;
}
function beam(P, W) {
  let front = [Object.assign(newState(P), { route: [] })], best = null;
  for (let step = 0; step < 240 && front.length; step++) {
    const next = new Map();
    for (const g of front) for (const sub of subsets(P, g)) {
      const n = cloneState(g); n.route = g.route.concat([sub]);
      for (const i of sub) start(P, n, i);
      tick(P, n); autoPlate(P, n);
      if (isDone(n)) { if (!best || cost(n) < cost(best)) best = n; continue; }
      n.b = bound(P, n);
      if (best && n.b >= cost(best)) continue;
      const key = n.d.map((d) => d.st.slice(0, 2) + d.rem + d.age).join('');
      const o = next.get(key); if (!o || cost(n) < cost(o)) next.set(key, n);
      if (next.size > W * 30) { const keep = [...next.entries()].sort((a, b) => a[1].b - b[1].b).slice(0, W * 4); next.clear(); keep.forEach(([k, v]) => next.set(k, v)); }
    }
    front = [...next.values()].sort((a, b) => a.b - b.b).slice(0, W);
  }
  return best;
}
// THE LINE COOK'S WAY (the second solver). Take the tickets in some priority
// order and give each one, in turn, the earliest minute its whole order can
// land: every dish gets a slot that ends at that minute, or up to HOLD minutes
// before it when the station is busy. Then shuffle the priority order and keep
// whatever lowers the penalty. It scales to the Sunday line, where the beam
// drowns in ten slots, and it never lets a dish go cold.
function lineCook(P, order) {
  const L = dishList(P), busy = {};
  for (const [st] of STATIONS) busy[st] = Array.from({ length: P.caps[st] }, () => []);
  const isFree = (slot, a, e) => slot.every(([x, y]) => e <= x || a >= y);
  const starts = new Array(L.length).fill(0); let end = 0;
  for (const ti of order) {
    const at = P.tickets[ti].at;
    const mine = []; L.forEach((x, i) => { if (x.t === ti) mine.push(i); });
    mine.sort((x, y) => MENU[L[y].k][2] - MENU[L[x].k][2]);
    const first = at + MENU[L[mine[0]].k][2];
    let pick = null, seenAt = -1;
    for (let F = first; F < first + 400; F++) {
      let top = null; const put = [];
      (function rec(n, late, flush) {
        if (top && late >= top.late) return;
        if (n === mine.length) { if (flush) top = { late, put: put.map((p) => p.slice()) }; return; }
        const i = mine[n], [, st, dur] = MENU[L[i].k];
        for (let dl = 0; dl <= HOLD; dl++) {
          const e = F - dl, a0 = e - dur;
          if (a0 < at) continue;
          const slot = busy[st].findIndex((sl, k) => isFree(sl, a0, e) && !put.some((p) => p[1] === st && p[2] === k && !(e <= p[3] || a0 >= p[4])));
          if (slot < 0) continue;
          put.push([i, st, slot, a0, e]); rec(n + 1, late + dl, flush || dl === 0); put.pop();
        }
      })(0, 0, false);
      if (top) {
        const c = (F - at) + SIT_WEIGHT * top.late;
        if (!pick || c < pick.c) pick = { c, F, put: top.put };
        if (seenAt < 0) seenAt = F;
      }
      if (seenAt >= 0 && F >= seenAt + 2) break;
    }
    for (const [i, st, slot, a0, e] of pick.put) { busy[st][slot].push([a0, e]); starts[i] = a0; }
    if (pick.F > end) end = pick.F;
  }
  const route = Array.from({ length: end }, () => []);
  starts.forEach((a0, i) => route[a0].push(i));
  const s = replay(P, route);
  if (!s || !isDone(s)) throw new Error('lineCook built a service that does not replay');
  s.route = route;
  return s;
}
function shuffleCook(P, R, tries) {
  let order = P.tickets.map((t, i) => i), top = lineCook(P, order);
  for (let n = 0; n < tries; n++) {
    const o = order.slice(), a = Math.floor(R() * o.length);
    let b = a + (R() < 0.6 ? 1 : 1 + Math.floor(R() * 3)); if (b >= o.length) b = Math.max(0, a - 1);
    const [x] = o.splice(a, 1); o.splice(b, 0, x);
    const s = lineCook(P, o);
    if (penalty(s) <= penalty(top)) { if (penalty(s) < penalty(top) || R() < 0.5) { order = o; } if (penalty(s) < penalty(top)) top = s; }
  }
  return top;
}
// Both solvers, the lower penalty kept. The beam only runs on the small line.
function solve(P, R, big) {
  let top = shuffleCook(P, R, big ? 4000 : 1500);
  if (!big) for (const w of [1, 1.5, 2, 3]) { W8 = w; const s = beam(P, 1500); if (s && penalty(s) < penalty(top)) top = s; }
  W8 = SIT_WEIGHT;
  return top;
}

// ---- the bank ----
const HEAD = `// Puzzle data for Chef, the daily kitchen puzzle.
// GENERATED by scripts/gen-chef.mjs; do not edit by hand. Extend with
// \`node scripts/gen-chef.mjs --until <date>\`, which keeps every row here byte
// for byte. Checked by scripts/verify-chef.mjs. Imported only by the server page,
// which strips days not yet live AND the stored service (\`sol\`) before anything
// reaches a browser. The rules and the week's ramp are in the generator.
//   band     intro | gentle | moderate | tough | sunday     service  the day's name for it
//   caps     slots on each station: stove, oven, grill, fryer, cold
//   tickets  { at: the minute it prints, dishes: menu keys (lib/chef-engine.js MENU) }
//   best     the lowest penalty found (bestWait table minutes + 2 x bestSat sitting minutes)
//   sol      that service: the dish indexes fired each minute
//   sunday   the Sunday Edition
export const PUZZLES = [
`;
const save = (rows) => fs.writeFileSync(FILE, HEAD + rows.map((r) => '  ' + JSON.stringify(r) + ',').join('\n') + '\n];\n');
let rows = [];
if (fs.existsSync(FILE)) rows = (await import(FILE.href)).PUZZLES.slice();
const kept = rows.length;
const iso = (d) => d.toISOString().slice(0, 10);
const day = new Date(`${START}T12:00:00Z`); day.setUTCDate(day.getUTCDate() + rows.length);
const CLOSES = { gentle: 18, moderate: 22, tough: 26, sunday: 30 };
const NIGHT = { 5: 'Friday Night', 6: 'Saturday Night' };
while (iso(day) <= UNTIL) {
  const live = iso(day), dow = day.getUTCDay(), [y, m, dd] = live.split('-').map(Number);
  const first = live === START;
  const band = first ? 'intro' : dow === 0 ? 'sunday' : dow <= 2 ? 'gentle' : dow <= 4 ? 'moderate' : 'tough';
  // The Sunday line is five times the search (ten slots, forty dishes), so it gets a narrower beam.
  // A service that runs long is a slog, not a puzzle: re-deal (same date, next salt) until the best
  // service closes inside the band's limit.
  let P, s;
  for (let salt = 0; ; salt++) {
    P = first ? INTRO : deal(rng(hash(`chef-${live}${salt ? `-${salt}` : ''}`)), SPEC[band]);
    s = solve(P, rng(hash(`cook-${live}-${salt}`)), band === 'sunday');
    if (s && (first || s.m <= CLOSES[band] || salt >= 6)) break;
  }
  const check = replay(P, s.route);
  if (!check || !isDone(check) || penalty(check) !== penalty(s)) throw new Error(`${live}: the stored service does not replay`);
  const row = { num: rows.length + 1, quizId: `chef-${m}-${dd}-${String(y).slice(2)}`, live, dateLabel: `${MONTHS[m - 1]} ${dd}, ${y}` };
  if (dow === 0) row.sunday = true;
  Object.assign(row, { band, service: first ? 'Opening Night' : band === 'sunday' ? 'Sunday Brunch' : band === 'gentle' ? 'Lunch' : band === 'moderate' ? 'Dinner' : NIGHT[dow],
    caps: P.caps, tickets: P.tickets, best: penalty(s), bestWait: s.wait, bestSat: s.sit, sol: s.route });
  rows.push(row); save(rows);   // saved a row at a time, so a stopped run resumes where it left off
  console.log(`${live} ${band.padEnd(8)} ${String(dishList(P).length).padStart(2)} dishes  best ${row.best} (${s.wait} wait, ${s.sit} sat)  closes minute ${s.m}`);
  day.setUTCDate(day.getUTCDate() + 1);
}
console.log(`chef: ${rows.length} boards (${kept} kept, ${rows.length - kept} new), ${rows[0].live} to ${rows[rows.length - 1].live}`);
