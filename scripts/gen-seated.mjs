// scripts/gen-seated.mjs: deals the Seated bank (app/seated/puzzles.js). APPEND
// ONLY: every row already in the file is kept byte for byte, and new days are
// added up to --until. A board that has gone live is never re-dealt.
//   node scripts/gen-seated.mjs --until 2027-01-31
//
// Owner, 2026-11-14: a "practical puzzle" beside Mop, Chef and Pack. Seat a room
// so every request is met. The room grows through the week:
//   Mon  gentle    Dinner Party        one table of six
//   Tue  gentle    Birthday Dinner     two tables of four
//   Wed  moderate  Rehearsal Dinner    two tables of five
//   Thu  moderate  Office Party        three tables of four
//   Fri  tough     Class Reunion       three tables of five
//   Sat  tough     Charity Gala        three tables of six
//   Sun  sunday    Wedding Reception   four tables of five (the Sunday Edition)
// THE BANK OPENS WITH TWO INTRO BOARDS (owner, 2026-11-14: "Sunday this week needs
// to be early week intro though"): a Dinner Party on Saturday 2026-11-14 as on a
// Monday and a Birthday Dinner on Sunday 2026-11-15 as on a Tuesday, both band
// `intro`. The first Wedding Reception is Sunday 2026-11-22.
//
// HOW A BOARD IS MADE. Guests are drawn from the day's crowd and seated at
// random; that seating is the stored answer (`sol`). Every request that is true
// of it is a candidate. Requests are then added one at a time, each chosen
// because it rules out some OTHER way of splitting the room that still worked,
// until the split of guests between tables is the only one left (on a one-table
// day: until the order round the table is the only one, mirror images aside).
// On the tough days a request the board does not need is taken back out. A few
// side-by-side requests are added last for the order within a table. The solver
// is lib/seated-engine.js, the same one the checker uses.
// Every board is dealt from its date, so a re-run deals the same day.
import fs from 'fs';
import { ruleState, solutions, ringKey, partKey } from '../lib/seated-engine.js';
import { SPEC, NOTES } from './gen-seated-spec.mjs';
import { MONTHS } from './six-verify-common.mjs';

const FILE = new URL('../app/seated/puzzles.js', import.meta.url);
const START = '2026-11-14';
const arg = (n) => { const i = process.argv.indexOf(n); return i > 0 ? process.argv[i + 1] : null; };
const UNTIL = arg('--until') || '2027-01-03';
const INTRO = { '2026-11-14': 1, '2026-11-15': 2 };

export const hash = (s) => { let h = 2166136261; for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; };
export const rng = (a) => () => { a |= 0; a = (a + 0x6d2b79f5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };

// [short name on the chair, full name in the requests]. The short name is always part of the full one.
const g = (s) => s.split('|').map((x) => { const [full, n] = x.split('='); return { n: n || full.split(' ').pop(), full }; });
export const CROWD = {
  family: g('Grandma Rose|Grandpa Joe|Uncle Bill|Uncle Ted|Aunt May|Aunt Vera|Cousin Zoe|Cousin Finn|Little Max|Little Ivy|Nana Pearl|Papa Gus|Dana|Mr. Hale|Father Tom|Dr. Ruiz|Coach Ray|Neighbor Lou|Cousin Kit|Uncle Ned|Aunt Flo|Great-Aunt Ida|Cousin Omar|Cousin Lena|Nephew Theo|Niece Mia|Godfather Sal|Roommate Jess'),
  work: g('Priya in Payroll=Priya|Dev from IT=Dev|Marge the Boss=Marge|Intern Kai|Stan in Sales=Stan|Lucy in Legal=Lucy|Hugo in HR=Hugo|Nora the CFO=Nora|Omar in Ops=Omar|Beth at Reception=Beth|Raj in Research=Raj|Tess the Temp=Tess|Walt in Shipping=Walt|Gwen in Design=Gwen|Ivan in Audit=Ivan|Mona in Marketing=Mona'),
  school: g('Class President Ava|Coach Burke|Prom Queen Deb|Quarterback Chad|Mr. Ortiz|Valedictorian Lin|Drummer Pete|Yearbook Editor Sue|Class Clown Benny|Nurse Joy|Mathlete Arun|Cheer Captain Kim|Goalie Marco|Librarian Fay|Bus Driver Earl|Lab Partner Nina|Skater Wes|Drama Kid Noel|Principal Shaw|Debater Cleo'),
  society: g('The Mayor|Senator Pike|Lady Ashby|Sir Miles|Judge Reyes|Dr. Osei|Chef Remy|Madame Cho|Colonel Brand|Curator Bly|Countess Vale|Professor Nix|Maestro Rossi|Editor Quinn|Banker Holt|Heiress Coco|Captain Sato|Bishop Grey|Poet Amira|Tycoon Vance|Baroness Elke|Admiral Ford'),
};
// The reason printed before the tag ("Different tables." and so on, lib/seated-engine.js TAG).
const WHY = {
  apart: ['{A} and {B} are not speaking.', '{A} still owes {B} money.', '{A} and {B} argue about everything.', '{A} beat {B} at cards and will not let it go.', '{A} and {B} fell out over a parking spot.', '{A} told the story about {B} again.', '{A} and {B} both want to give the toast.'],
  next: ['{A} and {B} came together.', '{A} promised to sit with {B}.', '{A} only knows {B}.', '{B} is the ride home for {A}.', '{A} and {B} have not seen each other in years.', '{A} is looking after {B} tonight.'],
  notnext: ['{A} and {B} never stop talking shop.', '{A} hums. {B} cannot stand it.', '{A} would rather not be right beside {B}.', '{A} and {B} share one bad joke between them.', '{B} takes food off the plate of {A}.'],
  across: ['{A} likes to face {B} when they talk.', '{A} reads lips and wants to see {B}.', '{A} and {B} have a staring contest to finish.', '{A} wants to watch {B} open the gift.'],
  same: ['{A} has stories for {B}.', '{A} and {B} want to catch up.', '{A} wants to keep an eye on {B}.', '{A} and {B} are splitting a dessert.', '{B} laughs at every joke {A} tells.'],
  table: {
    'by the door': ['{A} has to leave early.', '{A} wants to greet everyone coming in.', '{A} needs the easy way out.'],
    'by the band': ['{A} came for the music.', '{A} knows the drummer.', '{A} has a request for every song.'],
    'by the window': ['{A} wants the view.', '{A} likes the fresh air.', '{A} is watching the car.'],
    'by the bar': ['{A} is buying the rounds.', '{A} knows the bartender.', '{A} is in charge of the toasts.'],
  },
  nottable: {
    'by the door': ['{A} feels the draft by the door.', '{A} hates being bumped by the door.'],
    'by the band': ['{A} cannot hear a thing by the band.', '{A} gets a headache by the band.'],
    'by the window': ['{A} gets the sun in the eyes by the window.', '{A} is cold by the window.'],
    'by the bar': ['{A} would rather be far from the bar.', '{A} finds the bar too loud.'],
  },
};
const W = {
  gentle: { next: 3, apart: 3, table: 2, same: 1, nottable: 1, across: 2, notnext: 2 },
  moderate: { next: 2, apart: 3, table: 2, same: 2, nottable: 2, across: 2, notnext: 2 },
  tough: { next: 1.5, apart: 2.5, table: 1, same: 2.5, nottable: 2.5, across: 2, notnext: 2 },
  sunday: { next: 2, apart: 2.5, table: 1.5, same: 2.5, nottable: 2, across: 2, notnext: 2 },
};

export function deal(spec, R) {
  const [band, , sizes, crowd, most] = spec, T = sizes.length, N = sizes.reduce((a, b) => a + b, 0);
  const pick = (a) => a[Math.floor(R() * a.length)];
  const shuf = (a) => { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(R() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
  const hues = shuf(Array.from({ length: N }, (_, i) => Math.round((i * 360) / N + 8) % 360));
  const guests = shuf(CROWD[crowd]).slice(0, N).map((p, i) => ({ n: p.n, full: p.full, hue: hues[i] }));
  const notes = shuf(NOTES);
  const tables = sizes.map((seats, i) => ({ name: T === 1 ? 'The Table' : `Table ${i + 1}`, note: T === 1 ? 'seats six' : notes[i], seats }));
  let k = 0; const sol = sizes.map((n) => Array.from({ length: n }, () => k++));
  const P = { tables, guests, rules: [] };
  // every true request
  const cand = [], w = W[band];
  const push = (r) => cand.push({ r, key: -Math.log(R()) / (w[r.t] || 1) });
  for (let a = 0; a < N; a++) for (let b = a + 1; b < N; b++) {
    const [x, y] = R() < 0.5 ? [a, b] : [b, a];
    for (const t of ['next', 'notnext', 'across', 'same', 'apart']) {
      if (T === 1 && (t === 'same' || t === 'apart')) continue;
      const r = { t, a: x, b: y };
      // a notnext across two tables is true of the answer and says nothing worth printing
      if (t === 'notnext' && !sol.some((tb) => tb.includes(a) && tb.includes(b))) continue;
      if (t === 'same' && ruleState(sol, { t: 'next', a, b }) === 'ok') continue;
      if (ruleState(sol, r) === 'ok') push(r);
    }
  }
  if (T > 1) for (let a = 0; a < N; a++) for (let t = 0; t < T; t++) { const r = { t: sol[t].includes(a) ? 'table' : 'nottable', a, table: t }; push(r); }
  cand.sort((p, q) => p.key - q.key);
  const uses = new Array(N).fill(0), paired = new Set(), cap = band === 'gentle' ? 2 : 3;
  const free = (r) => uses[r.a] < cap && (r.b == null || (uses[r.b] < cap && !paired.has(Math.min(r.a, r.b) + '-' + Math.max(r.a, r.b))))
    && !(r.b == null && P.rules.some((q) => q.b == null && q.a === r.a));
  const take = (r) => { P.rules.push(r); uses[r.a]++; if (r.b != null) { uses[r.b]++; paired.add(Math.min(r.a, r.b) + '-' + Math.max(r.a, r.b)); } };
  const want = T === 1 ? ringKey(sol[0]) : partKey(sol);
  const other = () => solutions(P, 2).find((s) => (T === 1 ? ringKey(s[0]) : partKey(s)) !== want);
  for (let guard = 0; guard < 60; guard++) {
    const alt = other();
    if (!alt) break;
    // a request the other split breaks whatever order its tables sit in
    const cuts = (r) => (T === 1 ? ruleState(alt, r) === 'bad'
      : r.b == null ? ruleState(alt, r) === 'bad'
        : (() => { const same = alt.some((tb) => tb.includes(r.a) && tb.includes(r.b)); return r.t === 'apart' ? same : r.t === 'notnext' ? false : !same; })());
    const hit = cand.find((c) => !c.used && free(c.r) && cuts(c.r));
    if (!hit) return null;
    hit.used = true; take(hit.r);
    if (P.rules.length > most) return null;
  }
  if (other()) return null;
  if (band === 'tough' || band === 'sunday') {
    for (const r of shuf(P.rules)) { const keep = P.rules; P.rules = keep.filter((q) => q !== r); if (other()) P.rules = keep; }
    uses.fill(0); paired.clear(); const kept = P.rules; P.rules = []; kept.forEach(take);
  }
  // the order within a table: a few side-by-side, across and not-side-by-side requests, on a board that has tables to split
  if (T > 1) {
    const extra = band === 'gentle' ? 1 : band === 'moderate' ? 2 : 3;
    let added = P.rules.filter((r) => r.t === 'notnext' || r.t === 'across').length;
    for (const c of cand) {
      if (added >= extra || P.rules.length >= most) break;
      if (c.used || !free(c.r) || (c.r.t !== 'notnext' && c.r.t !== 'across')) continue;
      c.used = true; take(c.r); added++;
    }
  }
  const floor = { gentle: 4, moderate: 6, tough: 8, sunday: 12 }[band];
  if (P.rules.length < floor || P.rules.length > most) return null;
  if (!P.rules.every((r) => ruleState(sol, r) === 'ok')) return null;
  // the words
  const usedWhy = new Set();
  const rules = shuf(P.rules).map((r) => {
    const list = r.b == null ? WHY[r.t][tables[r.table].note] : WHY[r.t];
    let s = pick(list); for (let i = 0; i < 12 && usedWhy.has(s); i++) s = pick(list);
    usedWhy.add(s);
    const why = s.replace(/\{A\}/g, guests[r.a].full).replace(/\{B\}/g, r.b == null ? '' : guests[r.b].full);
    return r.b == null ? { t: r.t, a: r.a, table: r.table, why } : { t: r.t, a: r.a, b: r.b, why };
  });
  // the stored answer is shuffled so chair 0 says nothing
  const order = shuf(guests.map((_, i) => i)), inv = []; order.forEach((old, nu) => { inv[old] = nu; });
  return {
    tables, guests: order.map((i) => guests[i]),
    rules: rules.map((r) => ({ ...r, a: inv[r.a], ...(r.b == null ? {} : { b: inv[r.b] }) })),
    sol: sol.map((tb) => tb.map((x) => inv[x])),
  };
}

if (process.argv[1] && import.meta.url === (await import('url')).pathToFileURL(process.argv[1]).href) {
const HEAD = `// Puzzle data for Seated, the daily seating-chart puzzle.
// GENERATED by scripts/gen-seated.mjs; do not edit by hand. Extend with
// \`node scripts/gen-seated.mjs --until <date>\`, which keeps every row here byte
// for byte. Checked by scripts/verify-seated.mjs. Imported only by the server page,
// which strips days not yet live AND the stored seating (\`sol\`) before anything
// reaches a browser. The week's ramp is in the generator.
//   band     intro | gentle | moderate | tough | sunday     event  whose party it is
//   tables   { name, note: where it stands, seats }
//   guests   { n: the name on the chair, full: the name in the requests, hue }
//   rules    { t: next | notnext | across | same | apart | table | nottable, a, b or table, why } (lib/seated-engine.js)
//   sol      one seating that meets every request: a guest per chair, table by table
//   sunday   the row falls on a Sunday
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
  for (; !got && salt < 30000; salt++) got = deal(spec, rng(hash(`seated-${live}-${salt}`)));
  if (!got) throw new Error(`${live}: no board found`);
  const row = { num: rows.length + 1, quizId: `seated-${m}-${dd}-${String(y).slice(2)}`, live, dateLabel: `${MONTHS[m - 1]} ${dd}, ${y}` };
  if (dow === 0) row.sunday = true;
  Object.assign(row, { band: intro ? 'intro' : spec[0], event: spec[1], ...got });
  const n = {}; got.rules.forEach((r) => { n[r.t] = (n[r.t] || 0) + 1; });
  console.log(`${live} ${row.band.padEnd(8)} ${spec[1].padEnd(18)} ${String(got.guests.length).padStart(2)} guests ${String(got.rules.length).padStart(2)} requests  ${Object.entries(n).map(([k, v]) => `${k} ${v}`).join(', ')}  (deal ${salt})`);
  rows.push(row); save(rows);
  day.setUTCDate(day.getUTCDate() + 1);
}
console.log(`seated: ${rows.length} boards (${kept} kept, ${rows.length - kept} new), ${rows[0].live} to ${rows[rows.length - 1].live}`);
}
