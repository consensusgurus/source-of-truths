// THREE ROLES, NOTES ONLY (owner, 2026-11-03). Rewrites the Stage 2 notes of boards FROM..TO in
// app/sudoclue/puzzles.js and marks them `three: true`: the placement clues (already graded) are kept as they are,
// the old roles (victim, killer, accomplice, guests, staff, family; killer alone with the victim) are dropped, and
// a fresh set of notes is searched that names exactly the victim, the killer and the accomplice.
//   - nothing ties the killer to the victim's room; the notes alone decide
//   - no note says outright who someone is ("Che was the killer" never appears)
//   - no single note, read alone at the start, pins anyone (gradeRoles firstPin)
//   - a person reading the notes one at a time gets there with no guess (gradeRoles solved), and the board keeps
//     the search that needs the most rounds, within its day's band (NOTE_BAND)
// Usage: node scripts/gen-sudoclue-notes.mjs . <fromNum> <toNum>   (never over a board that has gone live)
// Then: node scripts/verify-sudoclue.mjs
import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

const REPO = process.argv[2];
const FROM = Number(process.argv[3]), TO = Number(process.argv[4]);
const imp = (p) => import(pathToFileURL(path.join(REPO, p)).href);
const { PLACES } = await imp('lib/sudoclue-places.js');
const { SAY } = await imp('lib/sudoclue-art.js');
const { prepare, solvePlacement, solveRoles, gradeRoles, isRoleClue, ROLES3 } = await imp('lib/sudoclue-engine.js');

let seed = 20261103;
const rnd = () => { seed = (seed * 1103515245 + 12345) % 2147483648; return seed / 2147483648; };
const shuffle = (a) => { for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };

// rounds of reading the notes a day asks for: Monday to Wednesday at least 2, Thursday and Friday 3, the weekend 3+
const NOTE_BAND = { 1: 2, 2: 2, 3: 2, 4: 3, 5: 3, 6: 3, 0: 3 };
const SING = { Victim: 'the victim', Killer: 'the killer', Accomplice: 'the accomplice' };
const cap = (s) => s[0].toUpperCase() + s.slice(1);
const roomSay = (L, k) => { const ri = L.rinfo[k]; return ri.say || (ri.out ? `in the ${ri.name} area` : `in the ${ri.name}`); };
const objSay = (t) => SAY[t] || ('a ' + t);
function predText(L, pr) {
  switch (pr.k) {
    case 'room': return roomSay(L, pr.v);
    case 'io': return pr.v ? 'outdoors' : 'indoors';
    case 'on': return 'on ' + objSay(pr.v);
    case 'beside': return 'beside ' + objSay(pr.v);
    case 'floor': return 'on open floor, not on any furniture';
    case 'corner': return 'in a corner of their room';
    case 'alone': return 'alone in their room';
    case 'company': return 'in a room with someone else';
  }
  throw new Error(pr.k);
}
const REL = { north: 'somewhere north of', south: 'somewhere south of', east: 'somewhere east of', west: 'somewhere west of', with: 'in the same room as', notwith: 'not in the same room as' };
const THREE = 'the victim, the killer and the accomplice';
function noteText(L, c) {
  switch (c.k) {
    case 'notrole': return `${c.p} was not ${SING[c.r]}.`;
    case 'some': return `${cap(SING[c.r])} was ${predText(L, c.pr)}.`;
    case 'none': return `${cap(SING[c.r])} was not ${predText(L, c.pr)}.`;
    case 'rrel': return `${cap(SING[c.a])} was ${REL[c.rel]} ${SING[c.b]}.`;
    case 'prel': return `${cap(SING[c.r])} was ${REL[c.rel]} ${c.q}.`;
    case 'count': {
      const p = predText(L, c.pr);
      if (c.n === 0) return `None of ${THREE} was ${p}.`;
      if (c.n === 3) return `All three of ${THREE} were ${p}.`;
      return `Of ${THREE}, exactly ${c.n === 1 ? 'one was' : 'two were'} ${p}.`;
    }
  }
  throw new Error(c.k);
}

function notePool(G, L, cast, place, H) {
  const N = G.N; const pool = [];
  const preds = Object.keys(L.rinfo).map((k) => ({ k: 'room', v: k }));
  preds.push({ k: 'io', v: true }, { k: 'io', v: false }, { k: 'floor' }, { k: 'corner' }, { k: 'alone' }, { k: 'company' });
  const objs = new Set(); for (let r = 0; r < N; r++) for (let c = 0; c < N; c++) { const o = G.objAt(r, c); if (o) objs.add(o); }
  for (const o of objs) preds.push({ k: 'on', v: o }, { k: 'beside', v: o });
  const roomOf = (p) => G.room(place[p][0], place[p][1]);
  const holds = (pr, p) => (pr.k === 'alone' || pr.k === 'company')
    ? ((cast.filter((q) => roomOf(q) === roomOf(p)).length === 1) === (pr.k === 'alone')) : G.test(pr, place[p]);
  const rel2 = (x, y) => { const out = []; const a = place[x], b = place[y];
    out.push(a[0] < b[0] ? 'north' : 'south'); out.push(a[1] > b[1] ? 'east' : 'west'); out.push(roomOf(x) === roomOf(y) ? 'with' : 'notwith'); return out; };
  for (const r of ROLES3) {
    for (const pr of preds) pool.push({ k: holds(pr, H[r]) ? 'some' : 'none', r, pr, w: pr.k === 'room' ? 0.6 : 1 });
    for (const p of cast) if (p !== H[r]) pool.push({ k: 'notrole', p, r, w: 0.35 });
    for (const q of cast) if (q !== H[r]) for (const rel of rel2(H[r], q)) pool.push({ k: 'prel', r, q, rel, w: rel === 'with' || rel === 'notwith' ? 0.8 : 1.1 });
  }
  for (const a of ROLES3) for (const b of ROLES3) if (a < b) for (const rel of rel2(H[a], H[b])) pool.push({ k: 'rrel', a, b, rel, w: 1.6 });
  for (const pr of preds) { const n = ROLES3.filter((r) => holds(pr, H[r])).length; pool.push({ k: 'count', pr, n, w: n === 0 ? 0.6 : 1.4 }); }
  return pool;
}

const count = (L, cast, place, notes, capN = 1000) => solveRoles(L, cast, place, notes, capN, { three: true }).length;
function wpick(list) { const t = list.reduce((s, c) => s + c.w, 0); let x = rnd() * t; for (const c of list) { x -= c.w; if (x <= 0) return c; } return list[list.length - 1]; }
const strip = (c) => { const o = { ...c }; delete o.w; return o; };

function build(L, cast, place, H) {
  const G = prepare(L);
  let pool = notePool(G, L, cast, place, H);
  const notes = []; let cur = count(L, cast, place, []);
  for (let guard = 0; guard < 80 && cur > 1; guard++) {
    if (!pool.length) return null;
    const c = wpick(pool); pool = pool.filter((x) => x !== c);
    const n = count(L, cast, place, [...notes, c].map(strip));
    if (n >= 1 && n < cur) { notes.push(c); cur = n; }
  }
  if (cur !== 1) return null;
  let keep = notes.map(strip);
  for (const c of shuffle(keep.slice())) { const t = keep.filter((x) => x !== c); if (count(L, cast, place, t, 2) === 1) keep = t; }
  return keep;
}

const PZ = path.join(REPO, 'app/sudoclue/puzzles.js');
const lines = fs.readFileSync(PZ, 'utf8').split('\n');
const report = [];
for (let i = 0; i < lines.length; i++) {
  const m = lines[i].match(/^(\s*)(\{"num".*\})(,?)$/);
  if (!m) continue;
  const d = JSON.parse(m[2]);
  if (d.num < FROM || d.num > TO) continue;
  const L = PLACES[d.place]; const cast = d.cast;
  const placeClues = d.clues.filter((c) => !isRoleClue(c));
  const sp = solvePlacement(L, cast, placeClues, 2);
  if (sp.length !== 1) throw new Error(`#${d.num}: placement is not unique`);
  const place = sp[0].place;
  const dow = new Date(d.live + 'T12:00:00Z').getUTCDay();
  seed = 20261103 + d.num * 104729;
  let best = null;
  for (let t = 0; t < Number(process.env.TRIES || 160); t++) {
    const [v, k, a] = shuffle(cast.slice());
    const H = { Victim: v, Killer: k, Accomplice: a };
    const notes = build(L, cast, place, H);
    if (!notes) continue;
    const gr = gradeRoles(L, cast, place, notes);
    if (!gr.solved || gr.firstPin || notes.length > cast.length) continue;
    const kinds = new Set(notes.map((c) => c.k)).size;
    const score = Math.min(gr.rounds, NOTE_BAND[dow] + 1) * 10 + kinds * 2 - Math.max(0, notes.length - 6);
    if (gr.rounds >= NOTE_BAND[dow] && (!best || score > best.score)) best = { score, notes, gr, H };
  }
  if (!best) throw new Error(`#${d.num} ${d.place}: no notes in band`);
  d.three = true;
  d.clues = [...placeClues, ...best.notes.map((c) => ({ text: noteText(L, c), ...c }))];
  lines[i] = m[1] + JSON.stringify(d).replace(/":/g, '": ').replace(/,"/g, ', "') + m[3];
  report.push(`#${d.num} ${d.live} ${L.title}: ${best.notes.length} notes, ${best.gr.rounds} rounds (victim ${best.H.Victim}, killer ${best.H.Killer}, accomplice ${best.H.Accomplice})`);
}
fs.writeFileSync(PZ, lines.join('\n'));
console.log(report.join('\n'));
