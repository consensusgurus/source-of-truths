// Harder Sudoclue boards (owner, 2026-11-01: "the 7x7 seems too easy to place people ... make it harder,
// either via clues, or larger boards"). Picked: harder clues AND bigger boards (8x8 Mon-Wed, 9x9 Thu-Fri,
// 10x10 Sat-Sun). Few room-naming clues; most placement clues are relational (north of, east of, same room,
// not the same room, beside, not in, corner, outdoors). Both stages proved unique with the engine.
// Usage: node scripts/gen-sudoclue.mjs . <fromNum> <toNum>   (rewrites those boards in app/sudoclue/puzzles.js;
// never run it over a board that has gone live). Then: node scripts/verify-sudoclue.mjs
import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

const REPO = process.argv[2];
const FROM = Number(process.argv[3]), TO = Number(process.argv[4]);
const imp = (p) => import(pathToFileURL(path.join(REPO, p)).href);
const { PLACES } = await imp('lib/sudoclue-places.js');
const { CAST, SAY } = await imp('lib/sudoclue-art.js');
const { prepare, solvePlacement, solveRoles, ROLESETS, gradePlacement, DAY_BAND } = await imp('lib/sudoclue-engine.js');
const NEWNAMES = Object.keys(CAST).filter((n) => n !== 'Tiger');

// ---- seeded random
let seed = 20261101;
const rnd = () => { seed = (seed * 1103515245 + 12345) % 2147483648; return seed / 2147483648; };
const shuffle = (a) => { for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
const pick = (a) => a[Math.floor(rnd() * a.length)];

// ---- namesakes never appear at their famous place (games-other.md)
const BANNED = { graceland: ['Elvis', 'Cash'], fenway: ['Babe', 'Jeter', 'Gronk'], venice: ['Arnold'], monticello: [], hearst: [] };

const SIZE_BY_DOW = { 0: 10, 1: 8, 2: 8, 3: 8, 4: 9, 5: 9, 6: 10 };
const PLURAL = { Guest: 'guests', Staff: 'staff members', Family: 'family members' };
const SING = { Victim: 'the victim', Killer: 'the killer', Accomplice: 'the accomplice', Guest: 'a guest', Staff: 'a staff member', Family: 'a family member' };

function roomSay(L, k) {
  const ri = L.rinfo[k];
  if (ri.say) return ri.say;
  return ri.out ? `in the ${ri.name} area` : `in the ${ri.name}`;
}
const objSay = (t) => SAY[t] || ('a ' + t);
function predText(L, pr) {
  switch (pr.k) {
    case 'room': return roomSay(L, pr.v);
    case 'notroom': return 'not ' + roomSay(L, pr.v);
    case 'io': return pr.v ? 'outdoors' : 'indoors';
    case 'on': return 'on ' + objSay(pr.v);
    case 'beside': return 'beside ' + objSay(pr.v);
    case 'floor': return 'on open floor, not on any furniture';
    case 'corner': return 'in a corner of their room';
  }
  throw new Error(pr.k);
}
function clueText(L, c) {
  switch (c.k) {
    case 'at': return `${c.p} was ${predText(L, c.pr)}.`;
    case 'with': return `${c.p} was in the same room as ${c.q}.`;
    case 'notwith': return `${c.p} was not in the same room as ${c.q}.`;
    case 'north': return `${c.p} was somewhere north of ${c.q}, in a different room.`;
    case 'east': return `${c.p} was somewhere east of ${c.q}, in a different room.`;
    case 'isrole': return `${c.p} was ${SING[c.r]}.`;
    case 'notrole': return `${c.p} was not ${SING[c.r]}.`;
    case 'same': return `${c.p} and ${c.q} were both ${PLURAL[c.r]}.`;
    case 'some': return PLURAL[c.r] ? `At least one of the ${PLURAL[c.r]} was ${predText(L, c.pr)}.` : `${cap(SING[c.r])} was ${predText(L, c.pr)}.`;
    case 'every': return `Every one of the ${PLURAL[c.r]} was ${predText(L, c.pr)}.`;
    case 'none': return PLURAL[c.r] ? `None of the ${PLURAL[c.r]} was ${predText(L, c.pr)}.` : `${cap(SING[c.r])} was not ${predText(L, c.pr)}.`;
  }
  throw new Error(c.k);
}
const cap = (s) => s[0].toUpperCase() + s.slice(1);

// ---- a random board: one per row and column on open squares, with at least one room holding exactly two
function randomPlace(G, L, cast) {
  const N = G.N;
  for (let tries = 0; tries < 400; tries++) {
    const cols = shuffle([...Array(N).keys()]);
    const rows = [...Array(N).keys()];
    const perm = [];
    const used = new Set();
    let ok = true;
    for (const r of rows) {
      const opts = shuffle(cols.filter((c) => !used.has(c) && G.open(r, c)));
      // greedy with lookahead-free random choice; restart on dead end
      if (!opts.length) { ok = false; break; }
      const c = opts[0]; used.add(c); perm.push([r, c]);
    }
    if (!ok) continue;
    const counts = {};
    perm.forEach(([r, c]) => { const k = G.room(r, c); counts[k] = (counts[k] || 0) + 1; });
    const pairs = Object.keys(counts).filter((k) => counts[k] === 2);
    if (!pairs.length || pairs.length > 2) continue;
    const order = shuffle(cast.slice());
    const place = {};
    order.forEach((p, i) => { place[p] = perm[i]; });
    return { place, pairRooms: pairs };
  }
  return null;
}

function objCount(G, N, t) { let n = 0; for (let r = 0; r < N; r++) for (let c = 0; c < N; c++) if (G.objAt(r, c) === t) n++; return n; }

// ---- placement clue pool: every true statement we are willing to print
function placementPool(G, L, cast, place) {
  const N = G.N; const pool = [];
  const nb = (r, c) => [[r + 1, c], [r - 1, c], [r, c + 1], [r, c - 1]].filter(([a, b]) => a >= 0 && b >= 0 && a < N && b < N);
  const roomKeys = Object.keys(L.rinfo);
  for (const p of cast) {
    const [r, c] = place[p]; const k = G.room(r, c); const o = G.objAt(r, c);
    pool.push({ k: 'at', p, pr: { k: 'room', v: k }, w: 0.25, tag: 'room' });
    for (const k2 of roomKeys) if (k2 !== k) pool.push({ k: 'at', p, pr: { k: 'notroom', v: k2 }, w: 0.9 });
    pool.push({ k: 'at', p, pr: { k: 'io', v: !!L.rinfo[k].out }, w: 0.7 });
    if (o && objCount(G, N, o) >= 2) pool.push({ k: 'at', p, pr: { k: 'on', v: o }, w: 0.6, tag: 'on' });
    if (!o) pool.push({ k: 'at', p, pr: { k: 'floor' }, w: 0.5 });
    const besides = new Set(nb(r, c).map(([a, b]) => G.objAt(a, b)).filter((t) => t && t !== o));
    for (const t of besides) pool.push({ k: 'at', p, pr: { k: 'beside', v: t }, w: 1.0 });
    if (G.test({ k: 'corner' }, [r, c])) pool.push({ k: 'at', p, pr: { k: 'corner' }, w: 0.6 });
    for (const q of cast) {
      if (q === p) continue;
      const [r2, c2] = place[q]; const k2 = G.room(r2, c2);
      if (k === k2) pool.push({ k: 'with', p, q, w: 1.2 });
      else {
        pool.push({ k: 'notwith', p, q, w: 0.5 });
        if (r < r2) pool.push({ k: 'north', p, q, w: 1.3 });
        if (c > c2) pool.push({ k: 'east', p, q, w: 1.3 });
      }
    }
  }
  return pool;
}

const count = (fn) => fn().length;

function buildStage(pool, solveCount, limits, unaryLog) {
  // greedy: add the clue that cuts the most solutions (sampled, weighted), until one solution is left.
  // Counts are capped, so ties at the cap fall back to how much the clue narrows single-person options.
  const CAPN = limits.capN || 1500;
  const chosen = [];
  const perP = {}; let rooms = 0;
  let cur = solveCount(chosen, CAPN);
  for (let guard = 0; guard < 60 && cur > 1; guard++) {
    const avail = pool.filter((c) => !chosen.includes(c) && (!c.p || (perP[c.p] || 0) < limits.perP) && !(c.tag === 'room' && rooms >= limits.rooms));
    if (!avail.length) { if (process.env.DBG) console.error('  stuck at', cur, 'clues', chosen.length); return null; }
    const sample = shuffle(avail.slice()).slice(0, 16);
    let best = null, bs = Infinity;
    for (const c of sample) {
      const n = solveCount([...chosen, c], CAPN);
      if (n === 0) continue;
      const tie = unaryLog ? unaryLog([...chosen, c]) : 0;
      const score = (Math.log(n) * 100 + tie) / (c.w || 1);
      if (score < bs) { bs = score; best = c; }
    }
    if (!best) return null;
    chosen.push(best); perP[best.p] = (perP[best.p] || 0) + 1; if (best.tag === 'room') rooms++;
    cur = solveCount(chosen, CAPN);
  }
  if (cur !== 1) { if (process.env.DBG) console.error('  guard out at', cur); return null; }
  // prune, room / on clues first
  const order = chosen.slice().sort((a, b) => (b.tag ? 1 : 0) - (a.tag ? 1 : 0));
  let keep = chosen.slice();
  for (const c of order) {
    const t = keep.filter((x) => x !== c);
    if (solveCount(t, 2) === 1) keep = t;
  }
  return keep;
}

// how much a solver can get from single-person clues alone (lower = harder)
function easiness(G, cast, clues) {
  const N = G.N; let e = 0;
  for (const c of clues) {
    if (c.k !== 'at') continue;
    let n = 0; for (let r = 0; r < N; r++) for (let cc = 0; cc < N; cc++) if (G.open(r, cc) && G.test(c.pr, [r, cc])) n++;
    if (n <= 2) e += 3; else if (n <= 4) e += 1;
  }
  return e + clues.filter((c) => c.tag === 'room').length * 2;
}

function rolePool(G, L, cast, place, roles) {
  const pool = [];
  const pr = [];
  const N = G.N;
  const roomKeys = Object.keys(L.rinfo);
  roomKeys.forEach((k) => pr.push({ k: 'room', v: k }));
  pr.push({ k: 'io', v: true }, { k: 'io', v: false }, { k: 'floor' }, { k: 'corner' });
  const objs = new Set(); for (let r = 0; r < N; r++) for (let c = 0; c < N; c++) { const o = G.objAt(r, c); if (o) objs.add(o); }
  for (const o of objs) { pr.push({ k: 'on', v: o }); pr.push({ k: 'beside', v: o }); }
  const R = [...new Set(Object.values(roles))];
  for (const r of R) {
    const mem = cast.filter((p) => roles[p] === r);
    for (const x of pr) {
      const hits = mem.filter((p) => G.test(x, place[p])).length;
      if (hits > 0) pool.push({ k: 'some', r, pr: x, w: 1.1 });
      if (PLURAL[r] && mem.length > 1 && hits === mem.length) pool.push({ k: 'every', r, pr: x, w: 1.2 });
      if (hits === 0) pool.push({ k: 'none', r, pr: x, w: 0.8 });
    }
  }
  for (const p of cast) {
    for (const r of ['Victim', 'Killer', 'Accomplice', 'Guest', 'Staff', 'Family']) {
      if (roles[p] === r && r !== 'Killer' && r !== 'Victim') pool.push({ k: 'isrole', p, r, w: r === 'Guest' ? 0.15 : 0.45 });
      else if (R.includes(r)) pool.push({ k: 'notrole', p, r, w: 0.7 });
    }
    for (const q of cast) if (q > p && roles[p] === roles[q] && PLURAL[roles[p]]) pool.push({ k: 'same', p, q, r: roles[p], w: 0.9 });
  }
  return pool;
}

const strip = (c) => { const o = { ...c }; delete o.w; delete o.tag; delete o.d; return o; };

// Placement: each person's own clue leaves them two to a handful of squares, never one, so the board only
// comes out by crossing rows and columns. A few relational clues are added only if that is not enough.
function buildPlacement(G, L, cast, pool) {
  const N = G.N;
  const cnt = (cl, cap = 40) => solvePlacement(L, cast, cl.map(strip), cap).length;
  const dsize = (pr) => { let n = 0; for (let r = 0; r < N; r++) for (let c = 0; c < N; c++) if (G.open(r, c) && G.test(pr, [r, c])) n++; return n; };
  const maxD = N + Number(process.env.MAXD_EXTRA || 2);
  const opts = {};
  for (const p of cast) {
    opts[p] = pool.filter((c) => c.p === p && c.k === 'at' && c.pr.k !== 'notroom').map((c) => ({ ...c, d: dsize(c.pr) })).filter((c) => c.d >= (c.tag === 'room' ? 4 : 2) && c.d <= maxD);
  }
  const pickFor = {};
  for (const p of cast) pickFor[p] = opts[p].length ? pick(opts[p]) : null;
  const list = () => cast.map((p) => pickFor[p]).filter(Boolean);
  let cur = cnt(list());
  for (let step = 0; step < 6 * N && cur > 1; step++) {
    const p = pick(cast);
    let bestC = pickFor[p], bestN = cur;
    for (const o of [null, ...shuffle(opts[p].slice()).slice(0, 8)]) {
      pickFor[p] = o;
      const n = cnt(list());
      if (n >= 1 && (n < bestN || (n === bestN && (o ? o.d : 99) > (bestC ? bestC.d : 99)))) { bestN = n; bestC = o; }
    }
    pickFor[p] = bestC; cur = bestN;
  }
  let chosen = list();
  if (cur > 1) {
    // top up with relational clues, at most two clues per person
    const perP = {}; chosen.forEach((c) => { perP[c.p] = (perP[c.p] || 0) + 1; });
    const rel = shuffle(pool.filter((c) => ['with', 'north', 'east', 'notwith'].includes(c.k)));
    for (let guard = 0; guard < 3 * N && cur > 1; guard++) {
      let best = null, bn = cur;
      for (const c of rel.filter((x) => !chosen.includes(x) && (perP[x.p] || 0) < (N <= 8 ? 1 : 2)).slice(0, 24)) {
        const n = cnt([...chosen, c]);
        if (n >= 1 && n < bn) { bn = n; best = c; }
      }
      if (!best) return null;
      chosen.push(best); perP[best.p] = (perP[best.p] || 0) + 1; cur = bn;
    }
    if (cur > 1) return null;
  }
  for (const c of shuffle(chosen.slice())) {
    const t = chosen.filter((x) => x !== c);
    if (cnt(t, 2) === 1) chosen = t;
  }
  return chosen;
}

const ATTEMPTS = Number(process.env.ATTEMPTS || 400); let T0 = Date.now();
// GRADED BOARDS (owner, 2026-11-02: boards were "either near impossible without guessing, or too easy"). A board is
// kept only when gradePlacement() says the hardest move it needs sits in its day's band (DAY_BAND in the engine):
// Monday needs nothing past a Link, midweek adds Squeezes, Friday and Saturday bigger ones, Sunday at most one
// What-if, and no day ever needs a guess. Among boards in the band, one that needs a Link is preferred, so people
// depend on each other.
function generate(L, cast, band) {
  T0 = Date.now();
  const G = prepare(L); const N = G.N;
  let best = null;
  for (let attempt = 0; attempt < ATTEMPTS; attempt++) {
    if (process.env.DBG) console.error("attempt", attempt, Date.now() - T0);
    const rp = randomPlace(G, L, cast); if (!rp) continue;
    const { place } = rp;
    const pool = placementPool(G, L, cast, place);
    const pc = buildPlacement(G, L, cast, pool);
    if (!pc) continue;
    if (process.env.DBG) console.error('  placement ok', pc.length, Date.now() - T0);
    const sp = solvePlacement(L, cast, pc.map(strip), 2);
    if (sp.length !== 1) continue;
    // roles: victim and killer share a room of exactly two
    const pairRoom = pick(rp.pairRooms);
    const two = shuffle(cast.filter((p) => G.room(place[p][0], place[p][1]) === pairRoom));
    const roles = { [two[0]]: 'Victim', [two[1]]: 'Killer' };
    const rest = shuffle(ROLESETS[N].slice());
    cast.filter((p) => !roles[p]).forEach((p, i) => { roles[p] = rest[i]; });
    // every other room of exactly two would also offer a victim; the role clues must rule them out
    const rpool = rolePool(G, L, cast, place, roles);
    const rc = buildStage(rpool, (cl, cap) => solveRoles(L, cast, place, cl.map(strip), cap).length, { perP: 99, rooms: 99 });
    if (!rc) continue;
    const gr = gradePlacement(L, cast, pc.map(strip));
    if (gr.rank < band[0] || gr.rank > band[1]) continue;
    const e = (gr.link ? 0 : 10) + easiness(G, cast, pc);
    if (!best || e < best.e) best = { e, pc, rc, place, roles, gr };
    if (best.gr.link) break;
  }
  return best;
}

// ---- main: regenerate boards FROM..TO in app/sudoclue/puzzles.js
const PZ = path.join(REPO, 'app/sudoclue/puzzles.js');
const lines = fs.readFileSync(PZ, 'utf8').split('\n');
const report = [];
const recent = [];
for (let i = 0; i < lines.length; i++) {
  const m = lines[i].match(/^(\s*)(\{"num".*\})(,?)$/);
  if (!m) continue;
  const d = JSON.parse(m[2]);
  const ONLY = process.env.ONLY ? process.env.ONLY.split(',').map(Number) : null;
  if (d.num < FROM || d.num > TO || (ONLY && !ONLY.includes(d.num))) { recent.push(...d.cast); continue; }
  const dow = new Date(d.live + 'T12:00:00Z').getUTCDay();
  const N = SIZE_BY_DOW[dow];
  const L = PLACES[d.place];
  if (L.size !== N) throw new Error(`#${d.num} ${d.place} is ${L.size} but ${d.live} needs ${N}`);
  const banned = BANNED[d.place] || [];
  let cast = d.cast.filter((p) => !banned.includes(p));
  const fresh = shuffle(NEWNAMES.filter((n) => !cast.includes(n) && !banned.includes(n) && !recent.slice(-60).includes(n) && CAST[n]));
  while (cast.length < N) cast.push(fresh.shift());
  cast = cast.slice(0, N);
  const t0 = Date.now();
  seed = 20261102 + d.num * 7919 + Number(process.env.SEED_OFFSET || 0) * 104723; // SEED_OFFSET: retry a board that finds no graded fill (2026-11-12)
  const g = generate(L, cast, DAY_BAND[dow]);
  if (!g) throw new Error(`#${d.num} no board`);
  const clues = [...g.pc, ...g.rc].map((c) => { const o = strip(c); return { text: clueText(L, o), ...o }; });
  d.cast = cast; d.clues = clues;
  lines[i] = m[1] + JSON.stringify(d).replace(/":/g, '": ').replace(/,"/g, ', "') + m[3];
  recent.push(...cast);
  const rooms = g.pc.filter((c) => c.tag === 'room').length;
  report.push(`#${d.num} ${d.live} ${L.title} ${N}x${N}: ${g.pc.length} placement clues (${rooms} room-naming), grade ${g.gr.rank}${g.gr.link ? ' with a Link' : ''}${g.gr.whatifs ? `, ${g.gr.whatifs} what-if` : ''}, ${g.rc.length} role clues, ${Date.now() - t0}ms`);
}
fs.writeFileSync(PZ, lines.join('\n'));
console.log(report.join('\n'));
