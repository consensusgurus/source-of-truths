// ERGO bank generator (owner, 2026-10-11). Writes app/ergo/puzzles.js.
//
//   node scripts/gen-ergo.mjs [--from 2026-10-11] [--days 63] [--seed ergo1]
//
// A board is a small cast, a handful of if-then rules over who does or does not
// do the day's one thing, ONE fact for today, and a set of statements. The
// player files each statement as must be true / could be true / cannot be true.
//
// Every rule is a two-literal clause, so the whole system is 2-SAT and the
// implication graph of the clauses IS the reasoning a player does: chaining
// rules, and flipping them (the contrapositive). The answer key is not stored:
// the client and the verifier each enumerate every assignment the rules plus
// the fact allow (at most 2^8 = 256) and classify each statement. What IS stored
// is the explanation shown after the ruling, a chain of literals with the rule
// that justifies each step, and scripts/verify-ergo.mjs proves every chain is a
// real deduction that lands on the enumerated verdict.
//
// THE RAMP (by Eastern weekday): cast size, rule count, which rule wordings are
// allowed (plain if / never both / only if / unless / at least one), and how
// long the longest required chain is. Sunday is the Edition: twelve statements.
//
// SELECTION RULES, all re-checked by the verifier:
//   - every verdict at least twice (three times on Sunday)
//   - no statement restates a rule as written
//   - an "if" statement is judged ONLY on the lineups where its first half
//     happens (the conditional reading, owner fix 2026-10-12), and its first
//     half must be possible today. The plain material reading made "If Eva
//     sits, Bram sits" a could on a day Bram must start, because it counted
//     as true in every lineup where Eva starts; a player reads it as cannot.
//   - at least one converse or inverse TRAP: an "if" statement that is a rule
//     chain run backwards, which is could, not must
//   - at least one must-be-true conditional that needs a FLIPPED rule

import { writeFileSync } from 'node:fs';

const args = Object.fromEntries(process.argv.slice(2).reduce((a, x, i, arr) => (x.startsWith('--') ? [...a, [x.slice(2), arr[i + 1]]] : a), []));
const FROM = args.from || '2026-10-11';
const DAYS = Number(args.days || 63);
const SEED = args.seed || 'ergo1';
const OUT = args.out || 'app/ergo/puzzles.js';

// ── rng ──────────────────────────────────────────────────────────────────────
function hash(s) { let h = 2166136261; for (const c of s) { h ^= c.charCodeAt(0); h = Math.imul(h, 16777619); } return h >>> 0; }
function rng(seed) { let a = hash(seed); return () => { a |= 0; a = (a + 0x6d2b79f5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
const pick = (r, xs) => xs[Math.floor(r() * xs.length)];
function shuffle(r, xs) { const a = xs.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; }

// ── themes ───────────────────────────────────────────────────────────────────
// pos / neg are the singular verb phrases, posPl / negPl the plural ones.
export const THEMES = {
  hearing: { title: 'The Hearing', who: 'witnesses may be called', pos: 'testifies', neg: 'stays silent', posPl: 'testify', negPl: 'stay silent', each: 'testifies or stays silent' },
  dinner: { title: 'The Dinner Party', who: 'friends are invited to dinner', pos: 'comes', neg: 'stays home', posPl: 'come', negPl: 'stay home', each: 'comes or stays home' },
  regatta: { title: 'The Regatta', who: 'skippers are entered in the race', pos: 'races', neg: 'sits out', posPl: 'race', negPl: 'sit out', each: 'races or sits out' },
  gig: { title: 'The Gig', who: 'musicians could play tonight', pos: 'plays', neg: 'sits out', posPl: 'play', negPl: 'sit out', each: 'plays or sits out' },
  summit: { title: 'The Summit Team', who: 'climbers could make the summit push', pos: 'goes up', neg: 'stays at camp', posPl: 'go up', negPl: 'stay at camp', each: 'goes up or stays at camp' },
  vote: { title: 'The Committee Vote', who: 'members sit on the committee', pos: 'votes yes', neg: 'votes no', posPl: 'vote yes', negPl: 'vote no', each: 'votes yes or votes no' },
  roadtrip: { title: 'The Road Trip', who: 'friends could ride along', pos: 'rides along', neg: 'stays behind', posPl: 'ride along', negPl: 'stay behind', each: 'rides along or stays behind' },
  lineup: { title: 'The Lineup', who: 'players are on the roster', pos: 'starts', neg: 'sits', posPl: 'start', negPl: 'sit', each: 'starts or sits' },
};
const THEME_KEYS = Object.keys(THEMES);
const NAME_SETS = [
  ['Avery', 'Blake', 'Cruz', 'Dana', 'Ellis', 'Fox', 'Gray', 'Hollis'],
  ['Ada', 'Bram', 'Cleo', 'Dev', 'Eva', 'Finn', 'Gus', 'Hana'],
  ['Arlo', 'Bea', 'Cyrus', 'Dina', 'Emil', 'Faye', 'Gideon', 'Hugo'],
  ['Amara', 'Basil', 'Corin', 'Della', 'Ezra', 'Flora', 'Gil', 'Heath'],
  ['Asher', 'Bianca', 'Colm', 'Daria', 'Enzo', 'Fern', 'Greta', 'Hal'],
];

// Mon..Sun parameters. dow: 0 = Sunday.
const RAMP = {
  1: { n: 5, r: 4, kinds: ['if', 'never'], stmts: 9, minLong: 0, maxLong: 2 },
  2: { n: 6, r: 5, kinds: ['if', 'never', 'onlyif'], stmts: 9, minLong: 0, maxLong: 3 },
  3: { n: 6, r: 5, kinds: ['if', 'never', 'onlyif', 'unless'], stmts: 9, minLong: 1, maxLong: 3 },
  4: { n: 6, r: 6, kinds: ['if', 'never', 'onlyif', 'unless', 'least'], stmts: 9, minLong: 1, maxLong: 4 },
  5: { n: 7, r: 6, kinds: ['if', 'never', 'onlyif', 'unless', 'least'], stmts: 9, minLong: 1, maxLong: 4 },
  6: { n: 7, r: 7, kinds: ['if', 'never', 'onlyif', 'unless', 'least'], stmts: 9, minLong: 2, maxLong: 5 },
  0: { n: 7, r: 7, kinds: ['if', 'never', 'onlyif', 'unless', 'least'], stmts: 12, minLong: 2, maxLong: 5 },
};

// ── logic ────────────────────────────────────────────────────────────────────
// A literal is [v, b]: person v does (b = 1) or does not (b = 0) do the thing.
const neg = ([v, b]) => [v, b ? 0 : 1];
const same = (x, y) => x[0] === y[0] && x[1] === y[1];
const holds = (w, [v, b]) => ((w >> v) & 1) === b;

// A rule: { k, a, b } meaning the clause is the implication a -> b, plus the
// wording kind. never p q  is  p -> not q.  least p q  is  not p -> q.
function edgesOf(rules) {
  const E = [];
  rules.forEach((r, i) => {
    const R = `R${i + 1}`;
    const sym = r.k === 'never' || r.k === 'least';
    E.push({ from: r.a, to: r.b, by: R });
    E.push({ from: neg(r.b), to: neg(r.a), by: sym ? R : `${R} flip` });
  });
  return E;
}
function worlds(n, rules, given) {
  const out = [];
  for (let w = 0; w < (1 << n); w++) {
    if (given && !holds(w, given)) continue;
    if (rules.every((r) => !holds(w, r.a) || holds(w, r.b))) out.push(w);
  }
  return out;
}
// "If A, B" is judged over the lineups where A happens, so "B" is the test.
const evalStmt = (s, w) => (s.k === 'lit' ? holds(w, s.a) : s.k === 'if' ? holds(w, s.b) : (holds(w, s.a) && holds(w, s.b)));
function verdict(s, W) {
  const V = s.k === 'if' ? W.filter((w) => holds(w, s.a)) : W;
  if (!V.length) return 'vacuous';
  let t = 0; for (const w of V) if (evalStmt(s, w)) t++;
  return t === V.length ? 'must' : t === 0 ? 'cannot' : 'could';
}
// Shortest chain from literal `from` to literal `to` over the edges.
function bfs(E, from, to, startBy) {
  const key = (l) => `${l[0]}:${l[1]}`;
  const prev = new Map([[key(from), null]]);
  const q = [from];
  while (q.length) {
    const cur = q.shift();
    if (same(cur, to)) {
      const steps = []; let k = key(cur);
      let node = cur;
      while (true) {
        const p = prev.get(k);
        steps.unshift({ l: node, by: p ? p.by : startBy });
        if (!p) break;
        node = p.l; k = key(node);
      }
      return steps;
    }
    for (const e of E) {
      if (!same(e.from, cur)) continue;
      const k = key(e.to);
      if (prev.has(k)) continue;
      prev.set(k, { l: cur, by: e.by });
      q.push(e.to);
    }
  }
  return null;
}

// ── text ─────────────────────────────────────────────────────────────────────
function lt(T, names, [v, b]) { return `${names[v]} ${b ? T.pos : T.neg}`; }
const cap = (s) => s.charAt(0).toUpperCase() + s.slice(1);
function ruleText(T, N, r) {
  if (r.k === 'if') return `If ${lt(T, N, r.a)}, ${lt(T, N, r.b)}.`;
  if (r.k === 'onlyif') return `${lt(T, N, r.a)} only if ${lt(T, N, r.b)}.`;
  if (r.k === 'unless') return `Unless ${lt(T, N, neg(r.a))}, ${lt(T, N, r.b)}.`;
  if (r.k === 'never') return `${N[r.a[0]]} and ${N[neg(r.b)[0]]} never both ${T.posPl}.`;
  return `At least one of ${N[neg(r.a)[0]]} and ${N[r.b[0]]} ${T.pos}.`;
}
function flipText(T, N, r) {
  // The contrapositive, always as a plain if.
  return `If ${lt(T, N, neg(r.b))}, ${lt(T, N, neg(r.a))}.`;
}
function stmtText(T, N, s) {
  if (s.k === 'lit') return `${lt(T, N, s.a)}.`;
  if (s.k === 'if') return `If ${lt(T, N, s.a)}, ${lt(T, N, s.b)}.`;
  const [a, b] = s.a[1] >= s.b[1] ? [s.a, s.b] : [s.b, s.a];
  if (a[1] && b[1]) return `${N[a[0]]} and ${N[b[0]]} both ${T.posPl}.`;
  if (!a[1] && !b[1]) return `${N[a[0]]} and ${N[b[0]]} both ${T.negPl}.`;
  return `${lt(T, N, a)}, but ${lt(T, N, b)}.`;
}

// ── one board ────────────────────────────────────────────────────────────────
function makeRule(r, k, n, used) {
  for (let t = 0; t < 40; t++) {
    const x = Math.floor(r() * n); let y = Math.floor(r() * n);
    if (x === y) continue;
    const pair = x < y ? `${x}-${y}` : `${y}-${x}`;
    if (used.has(pair)) continue;
    let rule;
    if (k === 'if') rule = { k, a: [x, r() < 0.8 ? 1 : 0], b: [y, r() < 0.55 ? 1 : 0] };
    else if (k === 'onlyif') rule = { k, a: [x, 1], b: [y, r() < 0.75 ? 1 : 0] };
    else if (k === 'unless') rule = { k, a: [x, 0], b: [y, 1] };
    else if (k === 'never') rule = { k, a: [x, 1], b: [y, 0] };
    else rule = { k, a: [x, 0], b: [y, 1] };
    used.add(pair);
    return rule;
  }
  return null;
}
function connected(n, rules) {
  const adj = Array.from({ length: n }, () => new Set());
  for (const r of rules) { adj[r.a[0]].add(r.b[0]); adj[r.b[0]].add(r.a[0]); }
  const seen = new Set([0]); const q = [0];
  while (q.length) { const v = q.shift(); for (const u of adj[v]) if (!seen.has(u)) { seen.add(u); q.push(u); } }
  return seen.size === n;
}

// fixed: { rules, given } of a board already live. Its cast, rules and fact
// stay exactly as played; only the statements are picked again.
function buildBoard(r, P, fixed) {
  for (let attempt = 0; attempt < 4000; attempt++) {
    const n = P.n;
    const used = new Set();
    const kinds = shuffle(r, [...P.kinds, ...Array.from({ length: P.r - P.kinds.length }, () => pick(r, ['if', 'if', ...P.kinds]))]).slice(0, P.r);
    const rules = fixed ? fixed.rules : kinds.map((k) => makeRule(r, k, n, used));
    if (rules.some((x) => !x) || !connected(n, rules)) continue;
    const W0 = worlds(n, rules, null);
    if (!W0.length) continue;
    // No one is decided by the rules alone.
    let forcedAlone = false;
    for (let v = 0; v < n; v++) { const on = W0.filter((w) => (w >> v) & 1).length; if (on === 0 || on === W0.length) forcedAlone = true; }
    if (forcedAlone) continue;
    const E = edgesOf(rules);

    // Today's fact: leaves 2+ people forced and 2+ free.
    const facts = [];
    for (let v = 0; v < n; v++) for (const b of [1, 0]) {
      const g = [v, b]; const W = worlds(n, rules, g);
      if (!W.length) continue;
      let f = 0, fr = 0;
      for (let u = 0; u < n; u++) { if (u === v) continue; const on = W.filter((w) => (w >> u) & 1).length; if (on === 0 || on === W.length) f++; else fr++; }
      if (f >= 2 && fr >= 2) facts.push(g);
    }
    if (!facts.length) continue;
    const given = fixed ? fixed.given : (facts.filter((g) => g[1] === 1).length && r() < 0.8 ? pick(r, facts.filter((g) => g[1] === 1)) : pick(r, facts));
    const W = worlds(n, rules, given);
    const forced = (l) => W.every((w) => holds(w, l));
    const gv = given[0];

    // Candidates, each with its explanation.
    const C = [];
    const lits = [];
    for (let v = 0; v < n; v++) if (v !== gv) for (const b of [1, 0]) lits.push([v, b]);
    for (const l of lits) {
      if (l[1] === 0 && r() < 0.5) continue;   // mostly positive single statements
      const s = { k: 'lit', a: l }; s.v = verdict(s, W);
      if (s.v === 'must') s.why = { t: 'chain', steps: bfs(E, given, l, 'given') };
      else if (s.v === 'cannot') s.why = { t: 'chain', steps: bfs(E, given, neg(l), 'given') };
      else s.why = { t: 'free' };
      s.len = s.why.steps ? s.why.steps.length - 1 : 0;
      C.push(s);
    }
    const written = new Set(E.filter((e) => !e.by.endsWith('flip')).map((e) => `${e.from}|${e.to}`));
    for (const x of lits) for (const y of lits) {
      if (x[0] === y[0]) continue;
      // conditional
      {
        const s = { k: 'if', a: x, b: y }; s.v = verdict(s, W);
        const path = bfs(E, x, y, 'if');
        if (s.v === 'must') {
          if (path && path.length > 1 && !(path.length === 2 && written.has(`${x}|${y}`))) {
            s.why = { t: 'chain', steps: path }; s.len = path.length - 1;
            s.flip = path.some((st) => st.by && st.by.endsWith('flip'));
            C.push(s);
          }
        } else if (s.v === 'could') {
          const back = bfs(E, y, x, 'if');
          const inv = bfs(E, neg(x), neg(y), 'if');
          if (back && back.length > 1) { s.why = { t: 'trap', steps: back }; s.trap = 1; s.len = back.length - 1; }
          else if (inv && inv.length > 1) { s.why = { t: 'trap', steps: inv }; s.trap = 1; s.len = inv.length - 1; }
          else { s.why = { t: 'free' }; s.len = 0; }
          C.push(s);
        } else if (s.v === 'cannot') {
          // Either the rules lead from the first half to the opposite of the
          // second, or today's fact rules the second half out.
          const p = bfs(E, x, neg(y), 'if');
          if (p && p.length > 1) { s.why = { t: 'chain', steps: p }; s.len = p.length - 1; C.push(s); }
          else {
            const q = bfs(E, given, neg(y), 'given');
            if (q && q.length > 1) { s.why = { t: 'chain', steps: q }; s.len = q.length - 1; C.push(s); }
          }
        }   // 'vacuous': the first half cannot happen today, never asked
      }
      // conjunction (unordered: once per pair)
      if (x[0] < y[0]) {
        const s = { k: 'and', a: x, b: y }; s.v = verdict(s, W);
        if (s.v === 'cannot') {
          const p = bfs(E, x, neg(y), 'and');
          const asWritten = p && p.length === 2 && written.has(`${x}|${neg(y)}`);
          if (p && p.length > 1 && !asWritten) { s.why = { t: 'chain', steps: p }; s.len = p.length - 1; C.push(s); }
          else if (!p) {
            const bad = forced(neg(x)) ? x : forced(neg(y)) ? y : null;
            if (bad) { const q = bfs(E, given, neg(bad), 'given'); if (q) { s.why = { t: 'chain', steps: q }; s.len = q.length - 1; C.push(s); } }
          }
        } else if (s.v === 'must') {
          const p1 = bfs(E, given, x, 'given'); const p2 = bfs(E, given, y, 'given');
          if (p1 && p2) { s.why = { t: 'pair', a: p1, b: p2 }; s.len = Math.max(p1.length, p2.length) - 1; C.push(s); }
        } else { s.why = { t: 'free' }; s.len = 0; C.push(s); }
      }
    }
    if (C.some((s) => s.why && s.len > P.maxLong)) {
      // drop the overlong ones rather than the board
      for (let i = C.length - 1; i >= 0; i--) if (C[i].len > P.maxLong) C.splice(i, 1);
    }

    // Pick the statements.
    const N = P.stmts;
    const per = N === 12 ? 4 : 3;      // per form (lit / if / and)
    const pickFrom = (pool, k) => shuffle(r, pool).slice(0, k);
    const lit = C.filter((s) => s.k === 'lit');
    const ifs = C.filter((s) => s.k === 'if');
    const ands = C.filter((s) => s.k === 'and');
    const chosen = [];
    // lit: one of each verdict if possible
    // One single-person statement per person: "Cruz goes up" and "Cruz stays
    // at camp" are the same question asked twice.
    const litVars = new Set();
    const takeLit = (pool) => { const x = pickFrom(pool.filter((s) => !litVars.has(s.a[0])), 1); x.forEach((s) => litVars.add(s.a[0])); chosen.push(...x); };
    for (const v of ['must', 'cannot', 'could']) takeLit(lit.filter((s) => s.v === v));
    if (N === 12) takeLit(lit.filter((s) => !chosen.includes(s) && s.v !== 'could'));
    // if: a flip-must, a trap, a could-or-cannot, plus a long must
    const flipMust = pickFrom(ifs.filter((s) => s.v === 'must' && s.flip), 1);
    const trap = pickFrom(ifs.filter((s) => s.trap), 1);
    if (!flipMust.length || !trap.length) continue;
    chosen.push(...flipMust, ...trap);
    const restIf = ifs.filter((s) => !chosen.includes(s) && s.v === 'must' && !s.flip && s.len >= 2);
    const longIf = pickFrom(restIf, per - 2);
    chosen.push(...longIf);
    // top up from any other conditional when too few long musts exist
    chosen.push(...pickFrom(ifs.filter((s) => !chosen.includes(s)), per - 2 - longIf.length));
    // and: a cannot by chain, a could, then anything
    const andCan = pickFrom(ands.filter((s) => s.v === 'cannot' && s.why.steps && s.why.steps[0].by === 'and'), 1);
    if (!andCan.length) continue;
    chosen.push(...andCan);
    chosen.push(...pickFrom(ands.filter((s) => !chosen.includes(s) && s.v !== 'cannot'), 1));
    chosen.push(...pickFrom(ands.filter((s) => !chosen.includes(s)), per - 2));
    // dedupe by meaning (same literal pair)
    const sig = (s) => `${s.k}|${s.a}|${s.b || ''}`;
    const uniq = []; const seen = new Set();
    for (const s of chosen) if (s && !seen.has(sig(s))) { seen.add(sig(s)); uniq.push(s); }
    if (uniq.length !== N) continue;
    const counts = { must: 0, could: 0, cannot: 0 };
    uniq.forEach((s) => counts[s.v]++);
    const minEach = N === 12 ? 3 : 2;
    if (Object.values(counts).some((c) => c < minEach)) continue;
    const longest = Math.max(...uniq.map((s) => s.len || 0));
    const longCount = uniq.filter((s) => (s.len || 0) >= 3).length;
    if (longCount < P.minLong) continue;
    if (longest > P.maxLong) continue;
    // No statement mentions the given person twice over? fine. Shuffle order.
    return { n, rules, given, stmts: shuffle(r, uniq), worlds: W.length };
  }
  return null;
}

// ── the bank ─────────────────────────────────────────────────────────────────
function addDays(iso, d) { const t = new Date(`${iso}T12:00:00Z`); t.setUTCDate(t.getUTCDate() + d); return t.toISOString().slice(0, 10); }
function dateLabel(iso) { return new Date(`${iso}T12:00:00Z`).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric', timeZone: 'UTC' }); }
function quizId(iso) { const [y, m, d] = iso.split('-').map(Number); return `ergo-${m}-${d}-${String(y).slice(2)}`; }

// Boards that were live before the 2026-10-12 conditional fix and whose
// statements changed with it. The client keys its save on rev, so an
// in-flight save from the old board never lands on the new statements.
const REV = { 'ergo-10-11-26': 2, 'ergo-10-12-26': 2 };
// Their cast, rules and fact are read back from the bank and kept as played.
const { PUZZLES: PRIOR } = await import(new URL('../app/ergo/puzzles.js', import.meta.url).href).catch(() => ({ PUZZLES: [] }));
const KEEP = Object.fromEntries(PRIOR.filter((p) => REV[p.quizId]).map((p) => [p.quizId, p]));

const boards = [];
let lastThemes = [];
for (let i = 0; i < DAYS; i++) {
  const live = addDays(FROM, i);
  const dow = new Date(`${live}T12:00:00Z`).getUTCDay();
  const P = RAMP[dow];
  const r = rng(`${SEED}:${live}`);
  const kept = KEEP[quizId(live)];
  const themePick = pick(r, THEME_KEYS.filter((k) => !lastThemes.includes(k)));
  const themeKey = kept ? kept.theme : themePick;
  lastThemes = [...lastThemes, themeKey].slice(-4);
  const names = kept ? kept.names : NAME_SETS[i % NAME_SETS.length].slice(0, P.n);
  const T = THEMES[themeKey];
  const b = buildBoard(r, P, kept ? { rules: kept.rules.map((x) => ({ k: x.k, a: x.a, b: x.b })), given: kept.given } : null);
  if (!b) { console.error('no board for', live); process.exit(1); }
  const list = names.slice(0, -1).join(', ') + ' and ' + names[names.length - 1];
  boards.push({
    num: i + 1,
    live,
    dateLabel: dateLabel(live),
    quizId: quizId(live),
    ...(REV[quizId(live)] ? { rev: REV[quizId(live)] } : {}),
    ...(dow === 0 ? { sunday: true } : {}),
    theme: themeKey,
    title: T.title,
    setup: `${cap(['zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight'][P.n])} ${T.who}: ${list}. Each one either ${T.each}. These rules always hold.`,
    names,
    verbs: { pos: T.pos, neg: T.neg },
    rules: b.rules.map((x) => ({ k: x.k, a: x.a, b: x.b, text: ruleText(T, names, x), flip: flipText(T, names, x) })),
    given: b.given,
    givenText: `${lt(T, names, b.given)}.`,
    statements: b.stmts.map((s) => ({ k: s.k, a: s.a, ...(s.b ? { b: s.b } : {}), text: stmtText(T, names, s), why: s.why })),
  });
}

const header = `// ERGO — the daily conditional-logic sort. GENERATED by scripts/gen-ergo.mjs;
// verified by scripts/verify-ergo.mjs. Do not hand-edit a board: regenerate.
//
// A board: a cast (names), rules (each a two-literal clause written as the
// implication a -> b, with its wording kind k and its contrapositive 'flip'),
// today's fact (given), and statements to file as must / could / cannot be
// true. A literal [v, b] reads "names[v] does the thing" when b is 1.
//
// There is NO answer key here on purpose: the client (app/ergo/engine.js)
// enumerates every assignment the rules and the fact allow and classifies each
// statement itself. 'why' is the explanation shown after the ruling: a chain of
// literals, each step labelled with the rule (or its flip) that justifies it.
// An "if" statement is judged only over the lineups where its first half
// happens, and that first half is always possible today.
//
// Ramp by Eastern weekday: Mon 5 people / 4 rules (plain if, never both), and
// more people, more rules and more wordings (only if, unless, at least one)
// through Saturday. Sunday Edition: seven people, seven rules, twelve statements.
// Past boards are frozen: never regenerate a board whose date has gone live.
`;
const body = `export const PUZZLES = [\n${boards.map((b) => '  ' + JSON.stringify(b)).join(',\n')},\n];\n`;
writeFileSync(OUT, header + body);
console.log(`wrote ${boards.length} boards to ${OUT}, ${boards[0].live} to ${boards[boards.length - 1].live}`);
