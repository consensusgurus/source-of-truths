// scripts/gen-errands.mjs: deals the Errands bank (app/errands/puzzles.js). APPEND
// ONLY: every row already in the file is kept byte for byte, and new days are
// added up to --until. A board that has gone live is never re-dealt.
//   node scripts/gen-errands.mjs --until 2027-01-31
//
// Owner, 2026-11-15: the third "practical puzzle" mockup (with Seated and Bag),
// "also do the same for errands. create and push". A town of streets, a list of
// stops and a few rules; pick the order and be home as soon as possible.
// The week (scripts/gen-errands-spec.mjs):
//   Mon  gentle    A Few Errands    4 stops, 2 rules
//   Tue  gentle    The Usual Round  5 stops, 3 rules
//   Wed  moderate  A Busy Morning   5 stops, 4 rules
//   Thu  moderate  The Long List    6 stops, 4 rules
//   Fri  tough     Roadworks        6 stops, 5 rules, two blocks dug up
//   Sat  tough     Saturday Rush    7 stops, 5 rules, two blocks dug up, a wider town
//   Sun  sunday    The Big Day      8 stops, 6 rules, three blocks dug up, the biggest town
// THE BANK OPENS WITH AN INTRO BOARD (the owner's standing rule for these launches:
// start gentle): Sunday 2026-11-15 is A Few Errands, band `intro`. The first Big
// Day is Sunday 2026-11-22.
//
// HOW A BOARD IS MADE. Places are drawn onto corners of the grid and an order is
// picked at random. Rules are written that this order keeps: a closing time just
// after it arrives, an opening time it would have to wait for if it came early,
// something that spoils, one stop before another. Then EVERY order is tried
// (lib/errands-engine.js) and the deal is kept only if
//   - the number of orders that keep every rule is inside the day's range,
//   - one order alone is the soonest home, and the slowest that works is at
//     least 12 minutes behind it, so the order chosen matters,
//   - every rule earns its place: without it, more orders would work, and
//   - from Wednesday on, always driving to the nearest stop left breaks a rule.
// The soonest order is stored as `sol` and its time home as `best`.
import fs from 'fs';
import { walk, valid, allValid, blocksOf, pathBetween } from '../lib/errands-engine.js';
import { SPEC, PLACES } from './gen-errands-spec.mjs';
import { MONTHS } from './six-verify-common.mjs';

const FILE = new URL('../app/errands/puzzles.js', import.meta.url);
const START = '2026-11-15';
const arg = (n) => { const i = process.argv.indexOf(n); return i > 0 ? process.argv[i + 1] : null; };
const UNTIL = arg('--until') || '2027-01-03';
const INTRO = { '2026-11-15': 1 };
export const hash = (s) => { let h = 2166136261; for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; };
export const rng = (a) => () => { a |= 0; a = (a + 0x6d2b79f5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };

// always the nearest stop not yet done (the first on a tie)
export function nearestFirst(P) {
  const d = blocksOf(P), n = P.stops.length, route = []; let at = n;
  while (route.length < n) { let best = -1; for (let s = 0; s < n; s++) if (!route.includes(s) && (best < 0 || d[at][s] < d[at][best])) best = s; route.push(best); at = best; }
  return route;
}

export function deal(spec, R) {
  const [band, , [W, H], N, nRules, nClosed, range] = spec;
  const ri = (n) => Math.floor(R() * n);
  const shuf = (a) => { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = ri(i + 1); [a[i], a[j]] = [a[j], a[i]]; } return a; };
  // corners: no two places on the same corner or side by side on a street (their names would collide)
  const spots = []; const far = (x, y) => spots.every(([a, b]) => !(b === y && Math.abs(a - x) <= 1) && !(a === x && b === y));
  for (let guard = 0; spots.length < N + 1 && guard < 400; guard++) { const x = ri(W), y = ri(H); if (far(x, y)) spots.push([x, y]); }
  if (spots.length < N + 1) return null;
  const home = spots.pop();
  const stops = shuf(PLACES).slice(0, N).map((pl, i) => ({ n: pl.n, k: pl.k, task: pl.task, at: spots[i], ...(pl.what ? { what: pl.what } : {}) }));
  // roadworks: blocks dug up, never cutting a place off
  const closed = [];
  for (let guard = 0; closed.length < nClosed && guard < 60; guard++) {
    const horiz = R() < 0.5, x = ri(horiz ? W - 1 : W), y = ri(horiz ? H : H - 1), e = horiz ? [x, y, x + 1, y] : [x, y, x, y + 1];
    if (closed.some((c) => c.join() === e.join())) continue;
    const T = { W, H, closed: closed.concat([e]) };
    if (stops.every((s) => pathBetween(T, home, s.at))) closed.push(e);
  }
  if (closed.length < nClosed) return null;
  const P = { W, H, home, stops, closed, start: 540, per: 4, stay: 10, rules: [] };
  // an order to write the rules round
  const want = shuf(stops.map((_, i) => i)), w0 = walk(P, want);
  const up = (m, q) => Math.ceil(m / q) * q;
  const kinds = shuf(['closes', 'opens', 'before', 'closes', 'fresh', 'opens', 'before', 'fresh']);
  const touched = new Set();
  for (const t of kinds) {
    if (P.rules.length >= nRules) break;
    if (t === 'closes') {
      const leg = shuf(w0.legs.slice(0, Math.max(1, N - 1))).find((l) => !touched.has(l.s)); if (!leg) continue;
      P.rules.push({ t, s: leg.s, at: up(leg.arrive + ri(8), 15) }); touched.add(leg.s);
    } else if (t === 'opens') {
      const leg = shuf(w0.legs.slice(1)).find((l) => !touched.has(l.s)); if (!leg) continue;
      const at = Math.floor((leg.arrive - ri(6)) / 15) * 15; if (at <= P.start + 15) continue;
      P.rules.push({ t, s: leg.s, at }); touched.add(leg.s);
    } else if (t === 'fresh') {
      const leg = shuf(w0.legs.slice(Math.floor(N / 2))).find((l) => stops[l.s].what && !touched.has(l.s)); if (!leg) continue;
      P.rules.push({ t, s: leg.s, m: up(w0.home - leg.leave + ri(6), 5), what: stops[leg.s].what }); touched.add(leg.s);
    } else {
      const i = ri(N - 1), j = i + 1 + ri(N - 1 - i), a = want[i], b = want[j];
      if (P.rules.some((r) => r.t === 'before' && ((r.a === a && r.b === b) || (r.a === b && r.b === a)))) continue;
      P.rules.push({ t, a, b });
    }
  }
  if (P.rules.length !== nRules) return null;
  // opening times were written from an order that did not have to wait; re-walk with them in place
  const ok = allValid(P);
  if (ok.length < range[0] || ok.length > range[1]) return null;
  if (ok.length > 1 && ok[1].home === ok[0].home) return null;
  if (ok[ok.length - 1].home - ok[0].home < 12) return null;
  for (let i = 0; i < P.rules.length; i++) { const T = { ...P, rules: P.rules.filter((_, j) => j !== i) }; if (allValid(T).length === ok.length && P.rules[i].t !== 'opens') return null; }
  // an opening time earns its place by making somebody wait or changing which order is soonest
  for (const r of P.rules.filter((x) => x.t === 'opens')) { const T = { ...P, rules: P.rules.filter((x) => x !== r) }; const o2 = allValid(T); if (o2.length === ok.length && o2[0].home === ok[0].home && o2[0].route.join() === ok[0].route.join()) return null; }
  if (band !== 'gentle' && valid(P, nearestFirst(P))) return null;
  if (!new Set(['fresh', 'closes']).has(P.rules[0].t) && !P.rules.some((r) => r.t === 'closes')) return null;
  return { W, H, home, stops, closed, start: P.start, per: P.per, stay: P.stay, rules: P.rules, best: ok[0].home, sol: ok[0].route, count: ok.length };
}

if (process.argv[1] && import.meta.url === (await import('url')).pathToFileURL(process.argv[1]).href) {
const HEAD = `// Puzzle data for Errands, the daily route-planning puzzle.
// GENERATED by scripts/gen-errands.mjs; do not edit by hand. Extend with
// \`node scripts/gen-errands.mjs --until <date>\`, which keeps every row here byte
// for byte. Checked by scripts/verify-errands.mjs. Imported only by the server
// page, which strips days not yet live AND the stored order (\`sol\`) before
// anything reaches a browser. The week's ramp is in scripts/gen-errands-spec.mjs.
//   band    intro | gentle | moderate | tough | sunday     day  the day's name
//   W, H    corners across and down     home  [x, y]     closed  blocks dug up: [x1, y1, x2, y2]
//   stops   { n: name, k: picture, task, at: [x, y], what: the thing that spoils }
//   start   minutes from midnight     per  minutes a block     stay  minutes a stop
//   rules   { t: closes | opens | fresh | before, ... } (lib/errands-engine.js)
//   best    the soonest possible time home, in minutes from midnight     sol  the order that gets it
//   sunday  the row falls on a Sunday
export const PUZZLES = [
`;
const save = (rows) => fs.writeFileSync(FILE, HEAD + rows.map((r) => '  ' + JSON.stringify(r) + ',').join('\n') + '\n];\n');
let rows = [];
if (fs.existsSync(FILE)) rows = (await import(FILE.href)).PUZZLES.slice();
const kept = rows.length;
const iso = (d) => d.toISOString().slice(0, 10);
const day = new Date(`${START}T12:00:00Z`); day.setUTCDate(day.getUTCDate() + rows.length);
while (iso(day) <= UNTIL) {
  const live = iso(day), dow = day.getUTCDay(), [y, m, dd] = live.split('-').map(Number);
  const intro = INTRO[live], spec = SPEC[intro || dow];
  let got = null, salt = 0;
  for (; !got && salt < 200000; salt++) got = deal(spec, rng(hash(`errands-${live}-${salt}`)));
  if (!got) throw new Error(`${live}: no board found`);
  const { count, ...board } = got;
  const row = { num: rows.length + 1, quizId: `errands-${m}-${dd}-${String(y).slice(2)}`, live, dateLabel: `${MONTHS[m - 1]} ${dd}, ${y}` };
  if (dow === 0) row.sunday = true;
  Object.assign(row, { band: intro ? 'intro' : spec[0], day: spec[1], ...board });
  console.log(`${live} ${row.band.padEnd(8)} ${spec[1].padEnd(15)} ${board.stops.length} stops  ${count} orders work  rules ${board.rules.map((r) => r.t).join(', ')}  (deal ${salt})`);
  rows.push(row); save(rows);
  day.setUTCDate(day.getUTCDate() + 1);
}
console.log(`errands: ${rows.length} boards (${kept} kept, ${rows.length - kept} new), ${rows[0].live} to ${rows[rows.length - 1].live}`);
}
