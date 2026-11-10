// THE INTERROGATION (owner, 2026-11-09: "Interrogation for roles. Question two or three suspects, each gives a
// statement, and only the killer lies. It is more involved than notes alone."). Rewrites the Stage 2 notes of
// boards FROM..TO in app/sudoclue/puzzles.js. Placement clues (already graded) are kept exactly as they are; the
// old notes are dropped and a fresh Stage 2 is searched:
//   - 2 questioned suspects Monday to Wednesday, 3 Thursday to Sunday; the killer is one of them, the victim never
//   - every statement is true except the killer's, which is false
//   - a few detective's notes top it up until the three parts are fixed
//   - the interrogation is NEEDED: the notes alone (statements and the asking rule removed) leave more than one answer
//   - no note says outright who someone is, no single note or statement alone pins anyone (gradeRoles firstPin),
//     and reading them one at a time gets there with no guess (gradeRoles solved), in the day's NOTE_BAND rounds
// Usage: node scripts/gen-sudoclue-interro.mjs . <fromNum> <toNum>   (never over a board that has gone live)
// Then: node scripts/verify-sudoclue.mjs
import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

const REPO = process.argv[2];
const FROM = Number(process.argv[3]), TO = Number(process.argv[4]);
const imp = (p) => import(pathToFileURL(path.join(REPO, p)).href);
const { PLACES } = await imp('lib/sudoclue-places.js');
const { SAY } = await imp('lib/sudoclue-art.js');
const { prepare, solvePlacement, solveRoles, gradeRoles, isRoleClue, noteOn, ROLES3 } = await imp('lib/sudoclue-engine.js');

let seed = 20261109;
const rnd = () => { seed = (seed * 1103515245 + 12345) % 2147483648; return seed / 2147483648; };
const shuffle = (a) => { for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };

const NOTE_BAND = { 1: 2, 2: 2, 3: 2, 4: 3, 5: 3, 6: 3, 0: 3 };
const ASK = { 1: 2, 2: 2, 3: 2, 4: 3, 5: 3, 6: 3, 0: 3 };
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
// `me` is the speaker for a statement: "I was not the accomplice", "The victim was somewhere south of me".
function noteText(L, c, me) {
  const nm = (p) => (p === me ? 'me' : p);
  switch (c.k) {
    case 'notrole': return c.p === me ? `I was not ${SING[c.r]}.` : `${c.p} was not ${SING[c.r]}.`;
    case 'some': return `${cap(SING[c.r])} was ${predText(L, c.pr)}.`;
    case 'none':
      if (c.pr.k === 'floor') return `${cap(SING[c.r])} was not on open floor.`;
      if (c.pr.k === 'company') return `${cap(SING[c.r])} was alone in their room.`;
      return `${cap(SING[c.r])} was not ${predText(L, c.pr)}.`;
    case 'rrel': return `${cap(SING[c.a])} was ${REL[c.rel]} ${SING[c.b]}.`;
    case 'prel': return `${cap(SING[c.r])} was ${REL[c.rel]} ${nm(c.q)}.`;
    case 'count': {
      const p = predText(L, c.pr);
      if (c.n === 0) return `None of ${THREE} was ${p}.`;
      if (c.n === 3) return `All three of ${THREE} were ${p}.`;
      return `Of ${THREE}, exactly ${c.n === 1 ? 'one was' : 'two were'} ${p}.`;
    }
  }
  throw new Error(c.k);
}

// Every role note a board can carry, true or false: the generator keeps the true ones as notes and draws statements
// of either kind.
function allNotes(G, L, cast) {
  const N = G.N; const pool = [];
  const preds = Object.keys(L.rinfo).map((k) => ({ k: 'room', v: k }));
  preds.push({ k: 'io', v: true }, { k: 'floor' }, { k: 'corner' }, { k: 'alone' }, { k: 'company' });
  const objs = new Set(); for (let r = 0; r < N; r++) for (let c = 0; c < N; c++) { const o = G.objAt(r, c); if (o) objs.add(o); }
  for (const o of objs) preds.push({ k: 'on', v: o }, { k: 'beside', v: o });
  for (const r of ROLES3) {
    for (const pr of preds) { pool.push({ k: 'some', r, pr, w: pr.k === 'room' ? 0.6 : 1 }); pool.push({ k: 'none', r, pr, w: 0.8 }); }
    for (const p of cast) pool.push({ k: 'notrole', p, r, w: 0.35 });
    for (const q of cast) for (const rel of ['north', 'south', 'east', 'west', 'with', 'notwith']) pool.push({ k: 'prel', r, q, rel, w: rel === 'with' || rel === 'notwith' ? 0.8 : 1.1 });
  }
  for (const a of ROLES3) for (const b of ROLES3) if (a !== b) for (const rel of ['north', 'east', 'with', 'notwith']) pool.push({ k: 'rrel', a, b, rel, w: 1.6 });
  for (const pr of preds) for (const n of [0, 1, 2]) pool.push({ k: 'count', pr, n, w: n === 0 ? 0.6 : 1.4 });
  return pool;
}

const strip = (c) => { const o = { ...c }; delete o.w; delete o._t; if (o.s) o.s = strip(o.s); return o; };
const count = (L, cast, place, notes, capN = 1000) => solveRoles(L, cast, place, notes, capN, { three: true }).length;
function wpick(list) { const t = list.reduce((s, c) => s + c.w, 0); let x = rnd() * t; for (const c of list) { x -= c.w; if (x <= 0) return c; } return list[list.length - 1]; }

const WHY = {}; const why = (k) => { WHY[k] = (WHY[k] || 0) + 1; return null; };
function build(L, G, T, cast, place, H, nAsk, ALL) {
  const holds = (c) => noteOn(G, c, H, place, cast);
  // the questioned: the killer and nAsk - 1 others, never the victim
  const others = shuffle(cast.filter((p) => p !== H.Victim && p !== H.Killer)).slice(0, nAsk - 1);
  const asked = shuffle([H.Killer, ...others]);
  const says = [];
  for (const sp of asked) {
    const lie = sp === H.Killer;
    // a statement is about the parts, never about where the speaker stood (the board already shows that, so a false
    // one would give the killer away on sight); first-person forms are weighted up so the suspects talk about themselves
    let cands = ALL.filter((c) => holds(c) === !lie && !(c.k === 'notrole' && (c.p !== sp || c.r === 'Killer')) && !(c.k === 'prel' && c.q === H.Victim));
    cands = cands.map((c) => ({ ...c, w: c.w * ((c.k === 'prel' && c.q === sp) || (c.k === 'notrole' && c.p === sp) ? 3 : 1) }));
    if (!cands.length) return null;
    const s = wpick(cands);
    says.push({ k: 'says', p: sp, s: strip(s), w: 0 });
  }
  const base = says.map(strip);
  let cur = count(L, cast, place, base);
  if (cur < 1) return null;
  // no note may flatly contradict a statement (that would name the liar on sight), so those never join the pool
  const truth = (n) => { if (!n._t) n._t = T.map((h) => noteOn(G, n, h, place, cast)); return n._t; };
  const flat = (n) => { const a = truth(n); return base.some((st) => { const b = truth(st.s); return a.every((x, i) => !x || !b[i]); }); };
  let pool = ALL.filter((c) => holds(c) && c.k !== 'isrole' && !flat(c));
  const notes = [];
  for (let guard = 0; guard < 90 && cur > 1; guard++) {
    if (!pool.length) return null;
    const c = wpick(pool); pool = pool.filter((x) => x !== c);
    const n = count(L, cast, place, [...base, ...notes, c].map(strip));
    if (n >= 1 && n < cur) { notes.push(c); cur = n; }
  }
  if (cur !== 1) return why('nounique');
  let keep = notes.map(strip);
  for (const c of shuffle(keep.slice())) { const t = keep.filter((x) => x !== c); if (count(L, cast, place, [...base, ...t], 2) === 1) keep = t; }
  // more involved than notes alone: without the interrogation the notes must not settle it
  const open = count(L, cast, place, keep, 50);
  if (open < 2) return why('notesalone');
  // and each statement pulls its weight: drop any one and the case opens up again
  for (let i = 0; i < base.length; i++) if (count(L, cast, place, [...base.filter((_, j) => j !== i), ...keep], 2) === 1) return why('idle');
  return { says: base, notes: keep, open };
}

const PZ = path.join(REPO, 'app/sudoclue/puzzles.js');
const lines = fs.readFileSync(PZ, 'utf8').split('\n');
const report = [];
for (let i = 0; i < lines.length; i++) {
  const m = lines[i].match(/^(\s*)(\{"num".*\})(,?)$/);
  if (!m) continue;
  const d = JSON.parse(m[2]);
  if (d.num < FROM || d.num > TO) continue;
  const L = PLACES[d.place]; const cast = d.cast; const G = prepare(L);
  const placeClues = d.clues.filter((c) => !isRoleClue(c));
  const sp = solvePlacement(L, cast, placeClues, 2);
  if (sp.length !== 1) throw new Error(`#${d.num}: placement is not unique`);
  const place = sp[0].place;
  const dow = new Date(d.live + 'T12:00:00Z').getUTCDay();
  const T = []; for (const v of cast) for (const k of cast) if (k !== v) for (const a of cast) if (a !== v && a !== k) T.push({ Victim: v, Killer: k, Accomplice: a });
  // a note that is true (or false) whoever plays which part says nothing; "not on the wardrobe" would only tell
  // the reader its speaker is honest. Those never become notes or statements.
  const ALL = allNotes(G, L, cast).filter((c) => { const t = T.map((h) => noteOn(G, c, h, place, cast)); c._t = t; return t.some(Boolean) && !t.every(Boolean); });
  seed = 20261109 + d.num * 104729;
  let best = null;
  for (let t = 0; t < Number(process.env.TRIES || 400); t++) {
    const [v, k, a] = shuffle(cast.slice());
    const H = { Victim: v, Killer: k, Accomplice: a };
    const b = build(L, G, T, cast, place, H, ASK[dow], ALL);
    if (!b) continue;
    const all = [...b.says, ...b.notes];
    const gr = gradeRoles(L, cast, place, all);
    if (!gr.solved) { why('guess'); continue; } if (gr.firstPin) { why('firstpin'); continue; } if (b.notes.length > 6) { why('long'); continue; } if (gr.rounds < NOTE_BAND[dow]) why('rounds');
    const kinds = new Set(all.map((c) => (c.k === 'says' ? c.s.k : c.k))).size;
    const score = Math.min(gr.rounds, NOTE_BAND[dow] + 1) * 10 + kinds * 2 - b.notes.length * 2 + Math.min(b.open, 12);
    if (gr.rounds >= NOTE_BAND[dow] && (!best || score > best.score)) best = { score, b, gr, H };
  }
  if (process.env.DEBUG) console.log(d.num, JSON.stringify(WHY)); for (const k in WHY) delete WHY[k];
  if (!best) throw new Error(`#${d.num} ${d.place}: no interrogation in band`);
  d.three = true;
  d.clues = [
    ...placeClues,
    ...best.b.says.map((c) => ({ text: noteText(L, c.s, c.p), ...c })),
    ...best.b.notes.map((c) => ({ text: noteText(L, c, null), ...c })),
  ];
  lines[i] = m[1] + JSON.stringify(d).replace(/":/g, '": ').replace(/,"/g, ', "') + m[3];
  report.push(`#${d.num} ${d.live} ${L.title}: asked ${best.b.says.map((c) => c.p).join(', ')}; ${best.b.notes.length} notes, ${best.gr.rounds} rounds (victim ${best.H.Victim}, killer ${best.H.Killer}, accomplice ${best.H.Accomplice})`);
  console.log(report[report.length - 1]);
}
fs.writeFileSync(PZ, lines.join('\n'));
