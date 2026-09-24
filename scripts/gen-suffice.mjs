// gen-suffice — build the Suffice bank (app/suffice/puzzles.js).
//
// Suffice is a data-sufficiency daily: a question you are NOT asked to answer,
// and two statements. You say which statements would settle it. Eight items a
// weekday, twelve on Sundays.
//
// The scenarios and the sufficiency decision live in app/suffice/engine.js and
// are IMPORTED, never copied, so this generator, scripts/verify-suffice.mjs and
// the browser client cannot drift apart.
//
// CONSTRUCTIVE, NOT SAMPLED. An exhaustive sweep measured the natural letter
// distribution at E 50%, A 20%, B 20%, C 4%, D 6%. A bank that inherits that
// skew is beatable without reading the statements, the same exploit class as
// Rung opening on the same two words 39% of the time. So every item is BUILT to
// a target letter: a per-scenario sufficiency table marks each statement
// sufficient or not, A/B/D draw from it directly and are correct by
// construction, and C and E search only the insufficient x insufficient block
// where they live.
//
// Run: node scripts/gen-suffice.mjs
//
// APPEND MODE (2026-09-24 restock): `node scripts/gen-suffice.mjs --append 117`
// keeps every banked day byte for byte and builds only days num+1..117 (the
// TOTAL run from START). A full rerun can no longer reproduce the frozen boards
// once DAYS changes, because the template CAP is derived from DAYS and moves
// every pick, so the bank is extended by appending instead. The template
// counts are seeded from the banked items, the CAP is computed for the full
// run, and the rng is reseeded off each new day's board number so the new
// segment never replays a frozen day.
import { writeFileSync, readFileSync } from 'node:fs';
import { getScenario, SCENARIO_COUNTS, linClassify, renderLin, rank } from '../app/suffice/engine.js';

// ───────────────────────────────── rng ───────────────────────────────────────
let rng = 20260806;
const rand = () => (rng = (rng * 1103515245 + 12345) & 0x7fffffff) / 0x7fffffff;
const pick = (a) => a[Math.floor(rand() * a.length)];
const ri = (lo, hi) => lo + Math.floor(rand() * (hi - lo + 1));
const shuffle = (a) => { const b = a.slice(); for (let i = b.length - 1; i > 0; i--) { const j = Math.floor(rand() * (i + 1)); [b[i], b[j]] = [b[j], b[i]]; } return b; };

// ─────────── index-set cache: the engine stays plain, this stays fast ────────
// The engine's decide() filters the domain on every call, which is the right
// shape for a verifier reading 600 items once. A generator tries hundreds of
// thousands of candidates, so it compiles each statement to a sorted index list
// and each question to its answer per index. Same maths, different budget.
const CACHE = new Map();
function compiled(fam, si) {
  const key = `${fam}:${si}`;
  if (CACHE.has(key)) return CACHE.get(key);
  const sc = getScenario(fam, si);
  const n = sc.dom.length;
  const qA = new Map(), sI = new Map();
  for (const q of sc.QS) { const a = new Array(n); for (let i = 0; i < n; i++) a[i] = q.f(sc.dom[i]); qA.set(q.id, a); }
  for (const s of sc.S) { const ix = []; for (let i = 0; i < n; i++) if (s.p(sc.dom[i])) ix.push(i); sI.set(s.id, Int32Array.from(ix)); }
  const c = { sc, n, qA, sI };
  CACHE.set(key, c);
  return c;
}
const allEq = (ans, ix) => { if (!ix.length) return false; const f = ans[ix[0]]; for (let i = 1; i < ix.length; i++) if (ans[ix[i]] !== f) return false; return true; };
function inter(a, b) { const o = []; let i = 0, j = 0; while (i < a.length && j < b.length) { if (a[i] === b[j]) { o.push(a[i]); i++; j++; } else if (a[i] < b[j]) i++; else j++; } return o; }

function suffTable(C, q) {
  const ans = C.qA.get(q.id), suff = [], insuff = [];
  for (const s of C.sc.S) {
    if (!C.sc.legal(q, s)) continue;
    const ix = C.sI.get(s.id);
    if (ix.length < 2 || ix.length === C.n) continue;
    (allEq(ans, ix) ? suff : insuff).push(s);
  }
  return { suff, insuff };
}
function classify(C, q, s1, s2) {
  const ans = C.qA.get(q.id), A1 = C.sI.get(s1.id), A2 = C.sI.get(s2.id);
  const bo = inter(A1, A2);
  if (!bo.length || bo.length === A1.length || bo.length === A2.length) return null;
  const u1 = allEq(ans, A1), u2 = allEq(ans, A2), u12 = allEq(ans, bo);
  return u1 && u2 ? 'D' : u1 ? 'A' : u2 ? 'B' : u12 ? 'C' : 'E';
}

// ═════════════════════ constructive builder: enumeration families ════════════
function enumBuild(fam, letter) {
  for (let t = 0; t < 12; t++) {
    const si = ri(0, SCENARIO_COUNTS[fam] - 1);
    const C = compiled(fam, si);
    const q = pick(C.sc.QS);
    const { suff, insuff } = suffTable(C, q);
    let cand;
    if (letter === 'A') cand = suff.flatMap((s1) => insuff.map((s2) => [s1, s2]));
    else if (letter === 'B') cand = insuff.flatMap((s1) => suff.map((s2) => [s1, s2]));
    else if (letter === 'D') cand = suff.flatMap((s1, i) => suff.slice(i + 1).map((s2) => [s1, s2]));
    else cand = insuff.flatMap((s1, i) => insuff.slice(i + 1).map((s2) => [s1, s2]));
    if (!cand.length) continue;
    for (const [s1, s2] of shuffle(cand).slice(0, 250)) {
      if (s1.id === s2.id || !C.sc.pairLegal(s1, s2)) continue;
      if (classify(C, q, s1, s2) !== letter) continue;
      return {
        fam, letter, stem: C.sc.stem, ask: q.ask, t1: s1.text, t2: s2.text,
        // The scenario is part of the question template: a group of 40 doing
        // tennis and golf and a group of 60 doing chess and bridge genuinely
        // read as different questions, and counting them as one template made
        // SETS breach its own ceiling.
        qT: `${fam}:${si}:${q.id}`, sT: [`${fam}:${si}:${s1.id}`, `${fam}:${si}:${s2.id}`],
        proof: C.sc.proofFor(q, s1, s2),
        chk: { scen: si, q: q.id, s1: s1.id, s2: s2.id },
      };
    }
  }
  return null;
}

// ═══════════════════════ constructive builder: LIN ═══════════════════════════
const par = (a, b) => rank([a.map((v) => [v, 1]), b.map((v) => [v, 1])]) < 2;
const dot = (a, x) => a.reduce((s, c, i) => s + c * x[i], 0);
function linBuild(letter) {
  if (letter === 'D') return null;              // structurally impossible, see engine.js
  const nv = letter === 'E' ? 3 : pick([2, 2, 3]);
  const rnd = () => { let a; do { a = Array.from({ length: nv }, () => ri(-4, 5)); } while (!a.some((v) => v)); return a; };
  for (let t = 0; t < 300; t++) {
    const x0 = Array.from({ length: nv }, () => ri(-4, 6));
    const a1 = rnd(), a2 = rnd();
    if (par(a1, a2)) continue;
    let c;
    if (letter === 'A') { c = a1.map((v) => v * pick([2, -2, 3, -3])); if (par(c, a2)) continue; }
    else if (letter === 'B') { c = a2.map((v) => v * pick([2, -2, 3, -3])); if (par(c, a1)) continue; }
    else if (letter === 'C') { const al = pick([1, 2, -1, 3]), be = pick([1, 2, -1, 3]); c = a1.map((v, i) => al * v + be * a2[i]); if (!c.some((v) => v) || par(c, a1) || par(c, a2)) continue; }
    else { c = rnd(); if (rank([a1, a2, c].map((r) => r.map((v) => [v, 1]))) !== 3) continue; }
    // Both statements must touch a variable the target actually uses. Without
    // this the generator paired "what is -8y - 4z?" with "-x = -6", a statement
    // that cannot bear on the answer at all and reads as filler.
    if (![a1, a2].every((a) => a.some((v, i) => v !== 0 && c[i] !== 0))) continue;
    const e1 = { a: a1, b: dot(a1, x0) }, e2 = { a: a2, b: dot(a2, x0) };
    if (linClassify(e1, e2, c) !== letter) continue;
    const r = renderLin(e1, e2, c);
    return {
      fam: 'LIN', letter, stem: r.stem, ask: r.ask, t1: r.s1, t2: r.s2,
      // The target functional IS the question here, so the template key must
      // carry it. Keying on variable count alone gave LIN two templates, which
      // the 4% ceiling then pinned to 48 items for the whole bank.
      qT: `LIN:q${nv}:${r.dir}`, sT: [`LIN:${a1.join(',')}`, `LIN:${a2.join(',')}`],
      proof: 'row-space rank over exact rationals', chk: { e1, e2, c },
    };
  }
  return null;
}

const SRC = { A: ['MOD', 'SETS', 'STAT', 'LIN'], B: ['MOD', 'SETS', 'STAT', 'LIN'], C: ['MOD', 'SETS', 'STAT', 'LIN'], D: ['MOD', 'SETS', 'STAT'], E: ['MOD', 'SETS', 'STAT', 'LIN'] };
const buildIn = (fam, letter) => (fam === 'LIN' ? linBuild(letter) : enumBuild(fam, letter));

// ═══════════════════════════ day / bank assembly ═════════════════════════════
const WEEK = ['A', 'A', 'B', 'B', 'C', 'D', 'E', 'E'];
const SUN = ['A', 'A', 'B', 'B', 'C', 'C', 'C', 'D', 'D', 'E', 'E', 'E'];
const FAMS = ['MOD', 'LIN', 'SETS', 'STAT'];
const START = new Date(Date.UTC(2026, 7, 6));   // launch day, Thu 6 Aug 2026
const ARGS = process.argv.slice(2);
const APPEND = ARGS.includes('--append');
const DAYS = Number(ARGS.find((a) => /^\d+$/.test(a)) || 70);
const CEIL = 0.04;

const tpl = {};
const CAP = Math.round(DAYS * 8.6 * CEIL);   // absolute, known up front, so the
                                             // ceiling binds from item one
                                             // rather than easing in as the
                                             // bank grows (how it was breached)
const tplOk = (it) => [it.qT, ...it.sT].every((t) => (tpl[t] || 0) < CAP);
const tplTake = (it) => { for (const t of [it.qT, ...it.sT]) tpl[t] = (tpl[t] || 0) + 1; };

// Each day gets an even family split (2 per family on a weekday, 3 on a Sunday)
// paired against the letter plan, with D never landing on LIN. Without this the
// first draft ran 4 MOD items in an 8-item day and asked the same question
// three times.
function dayPlan(sunday) {
  const letters = shuffle(sunday ? SUN : WEEK);
  const per = sunday ? 3 : 2;
  for (let a = 0; a < 200; a++) {
    const fams = shuffle(FAMS.flatMap((f) => Array(per).fill(f)));
    if (letters.every((l, i) => SRC[l].includes(fams[i]))) return letters.map((l, i) => [l, fams[i]]);
  }
  return null;
}

const bank = [];
let firstDay = 0;
let BANKED = [];
if (APPEND) {
  ({ PUZZLES: BANKED } = await import('../app/suffice/puzzles.js'));
  BANKED.forEach((p, i) => {
    if (p.num !== i + 1) { console.error(`FATAL: banked day ${i + 1} carries num ${p.num}`); process.exit(1); }
    // the same template keys the verifier counts
    for (const it of p.items) {
      let keys;
      if (it.fam === 'LIN') {
        const r = renderLin(it.chk.e1, it.chk.e2, it.chk.c);
        keys = [`LIN:q${it.chk.c.length}:${r.dir}`, `LIN:${it.chk.e1.a.join(',')}`, `LIN:${it.chk.e2.a.join(',')}`];
      } else {
        const k = `${it.fam}:${it.chk.scen}:`;
        keys = [k + it.chk.q, k + it.chk.s1, k + it.chk.s2];
      }
      for (const t of keys) tpl[t] = (tpl[t] || 0) + 1;
    }
  });
  firstDay = BANKED.length;
  if (firstDay >= DAYS) { console.log(`suffice: bank already holds ${firstDay} days`); process.exit(0); }
}
for (let d = firstDay; d < DAYS; d++) {
  if (APPEND) rng = (20260924 + 7919 * (d + 1)) & 0x7fffffff;
  const dt = new Date(START.getTime() + d * 864e5);
  const sunday = dt.getUTCDay() === 0;
  const plan = dayPlan(sunday);
  if (!plan) { console.error(`FATAL: no legal family plan on day ${d + 1}`); process.exit(1); }
  const items = [];
  const usedQ = new Set();     // no question template twice in one day
  const usedAsk = new Set();   // and no repeated question WORDING either, since
                               // two scenarios can phrase the same ask
  const fresh = (c) => c && tplOk(c) && !usedQ.has(c.qT) && !usedAsk.has(c.ask);
  for (const [letter, fam] of plan) {
    let it = null;
    for (let t = 0; t < 60 && !it; t++) { const c = buildIn(fam, letter); if (fresh(c)) it = c; }
    // widen to any legal family before ever relaxing the ceiling or the
    // one-question-per-day rule, both of which are the actual quality bars
    for (const alt of shuffle(SRC[letter])) {
      for (let t = 0; t < 30 && !it; t++) { const c = buildIn(alt, letter); if (fresh(c)) it = c; }
    }
    if (!it) { console.error(`FATAL: could not build ${letter} within ceiling on day ${d + 1}`); process.exit(1); }
    tplTake(it); usedQ.add(it.qT); usedAsk.add(it.ask); items.push(it);
  }
  const y = dt.getUTCFullYear(), m = dt.getUTCMonth() + 1, day = dt.getUTCDate();
  bank.push({
    num: d + 1, quizId: `suffice-${m}-${day}-${String(y).slice(2)}`,
    live: `${y}-${String(m).padStart(2, '0')}-${String(day).padStart(2, '0')}`,
    dateLabel: `${dt.toLocaleString('en-US', { month: 'long', timeZone: 'UTC' })} ${day}, ${y}`,
    sunday, items,
  });
}

// ═════════════════════════════ report ════════════════════════════════════════
const all = bank.flatMap((b) => b.items);
const cnt = (arr, k) => arr.reduce((m, x) => ((m[k(x)] = (m[k(x)] || 0) + 1), m), {});
console.log(`Suffice bank: ${bank.length} days, ${all.length} items (${bank.filter((b) => b.sunday).length} Sundays)\n`);
console.log('letters :', JSON.stringify(cnt(all, (i) => i.letter)));
console.log('families:', JSON.stringify(cnt(all, (i) => i.fam)));
const fl = {};
for (const i of all) { (fl[i.fam] = fl[i.fam] || {})[i.letter] = ((fl[i.fam] || {})[i.letter] || 0) + 1; }
console.log('\nfamily x letter');
console.log('             A    B    C    D    E');
for (const f of FAMS) console.log(f.padEnd(9) + ['A', 'B', 'C', 'D', 'E'].map((l) => String((fl[f] || {})[l] || 0).padStart(4)).join(' '));
const tv = Object.values(tpl);
console.log(`\ntemplates: ${tv.length} distinct, max reuse ${Math.max(...tv)} of ${CAP} allowed (${CEIL * 100}% ceiling)`);
console.log(`distinct question lines : ${new Set(all.map((i) => i.ask)).size}`);
console.log(`distinct statement lines: ${new Set(all.flatMap((i) => [i.t1, i.t2])).size} of ${all.length * 2}`);
console.log(`worst single-day letter concentration: ${Math.max(...bank.map((b) => Math.max(...Object.values(cnt(b.items, (i) => i.letter)))))}`);

console.log('\n──────── day 1 ────────');
bank[0].items.forEach((it, n) => {
  console.log(`\n${n + 1}. ${it.stem}  ${it.ask}   [${it.fam} · ${it.letter}]`);
  console.log(`   (1) ${it.t1}`);
  console.log(`   (2) ${it.t2}`);
});

// ═══════════════════════════ emit puzzles.js ═════════════════════════════════
const HDR = `// Puzzle data for Suffice, the daily data-sufficiency game. Imported ONLY by
// the server page (app/suffice/page.js), which filters live<=today AND strips
// each item's \`letter\` before passing the day to the client. The client
// re-derives the answer from \`chk\` with app/suffice/engine.js, so the key never
// ships over the wire (the Sworn leak-guard pattern).
//
// AUTHORING RULES  (scripts/gen-suffice.mjs builds, scripts/verify-suffice.mjs proves)
//
//   items    8 on a weekday, 12 on a Sunday Edition.
//   letter   A (1) alone, B (2) alone, C both together, D either alone,
//            E not even together. The verifier RE-DERIVES this from \`chk\` and
//            never trusts the stored value.
//   fam      MOD | LIN | SETS | STAT, four proof strategies that each decide
//            sufficiency exactly and read unlike one another, so the bank does
//            not become one puzzle repeated (CLAUDE.md rule 7):
//              MOD   periodicity over a 2520 window, unbounded integers
//              LIN   row-space rank over exact rationals, unbounded reals
//              SETS  every split of a group of N
//              STAT  every sorted list of L integers
//   chk      the machine-checkable seed. MOD/SETS/STAT name the scenario index
//            plus the question and two statement ids; LIN carries the two
//            equations and the target functional. \`chk.scen\` indexes
//            SCENARIOS in engine.js, so that array is APPEND-ONLY.
//   spread   No letter more than twice on a weekday, three times on a Sunday,
//            and each letter 10-30% of the bank. The natural distribution is
//            E-heavy (exhaustive sweep: E 50%, A 20%, B 20%, C 4%, D 6%), so
//            every item is BUILT to a target letter rather than sampled. A bank
//            that inherits the natural skew is guessable without reading it.
//   variety  No question or statement template above 4% of the bank, counted
//            across the whole bank rather than per day.
//
//   LIN has no D, structurally: each statement alone fixing c.x forces both
//   coefficient rows parallel to c and so to each other. Do not "fix" this.
export const PUZZLES = [
`;
const body = bank.map((d) => {
  const items = d.items.map((i) => `      { fam: ${JSON.stringify(i.fam)}, letter: ${JSON.stringify(i.letter)}, stem: ${JSON.stringify(i.stem)}, ask: ${JSON.stringify(i.ask)}, s1: ${JSON.stringify(i.t1)}, s2: ${JSON.stringify(i.t2)}, chk: ${JSON.stringify(i.chk)} },`).join('\n');
  return `  {\n    num: ${d.num}, quizId: ${JSON.stringify(d.quizId)}, live: ${JSON.stringify(d.live)}, dateLabel: ${JSON.stringify(d.dateLabel)}, sunday: ${d.sunday},\n    items: [\n${items}\n    ],\n  },`;
}).join('\n');
const BANK_URL = new URL('../app/suffice/puzzles.js', import.meta.url);
if (APPEND) {
  // frozen prefix: the old file minus its closing `];` stays byte for byte,
  // and only the new days are rendered after it
  const old = readFileSync(BANK_URL, 'utf8');
  const close = old.lastIndexOf('];');
  if (close < 0 || old.slice(close).trim() !== '];') { console.error('FATAL: banked file does not end in ];'); process.exit(1); }
  writeFileSync(BANK_URL, old.slice(0, close) + body + '\n];\n');
} else {
  writeFileSync(BANK_URL, HDR + body + '\n];\n');
}
console.log('\nwrote app/suffice/puzzles.js');
