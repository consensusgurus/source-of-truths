#!/usr/bin/env node
// gen-venn-bank — extend the LIVE Venn bank, one board per day, to a date.
//
// scripts/gen-venn.mjs proposes rule triples for a human to pick from; this
// runs the same search end to end and emits finished, dated boards, so a
// restock is a command. Everything it prints still goes through
// scripts/verify-venn.mjs, which recomputes every region from lib/venn-rules.js.
//
// What it enforces beyond per-board legality (the verifier's rules):
//
//   ROTATION. An EIGHT-day wheel: letters, country, state, letters, element,
//   president, country, letters. Eight is coprime with seven on purpose: a
//   seven-slot wheel pins each domain to one weekday (every Sunday a letter
//   board, every Monday elements), which is a position leak. Letter boards are
//   three in eight, country (the deepest table, 105 rows) two in eight, the
//   three thin tables one each, and no domain runs on consecutive days.
//   Every other letter board carries a `hides` rule, cycling animal, body,
//   number, because hides boards are the ones players remember.
//
//   FRESH LETTER ITEMS. The last month of letter boards were built from the
//   bank's own old items, so ESTATE reached eight boards and SUBMITS seven.
//   Letter items now come from lib/anon-common.txt (common English) crossed
//   with public/tuck-dict.txt (which drops proper nouns), 4 to 9 letters, and a
//   word that has appeared on ANY earlier board is never used again.
//
//   KNOWLEDGE ITEMS. The tables are closed and small, so rows must recur; the
//   filler takes the least-used rows first and never lets a row pass
//   ITEM_CEILING appearances across the whole bank.
//
//   RULE VARIETY. A rule kind used in the last few boards is penalized, and
//   bank-wide overuse is penalized (nolet had reached 48 of 92 boards), so
//   the letter rules spread instead of collapsing onto one. An exact rule
//   triple that has already run is never repeated.
//
//   SPLITS VARY. The region split is drawn from every legal split, weighted
//   toward the even ones, so boards do not all read 2-2-2-2-2-1-1.
//
//   FAIR READING. On a board with any vowel rule, no item contains Y (the
//   engine counts AEIOU only, and a solver can reasonably count Y). On a hides
//   board every real word hidden inside an item must already be classified in
//   HIDDEN or scripts/venn-hidden-review.mjs, the same census the verifier
//   runs, so a generated board can never introduce an unreviewed decoy.
//
//   US SPELLINGS. Items pass scripts/us-spellings.mjs and a variant screen
//   (COLOUR, DEFENCE, REALISE, CENTRE, TRAVELLED all drop out when the US form
//   is itself a word).
//
// Deterministic: the RNG is seeded from the board NUMBER, offset from any seed
// used before, so the new segment never replays a frozen board and a rerun
// from the same bank prints the same boards. The bank prefix is never touched:
// without --out the new boards print to stdout; with --out they are spliced in
// front of the closing `];` of app/venn/puzzles.js.
//
//   node scripts/gen-venn-bank.mjs --to 2026-11-30 [--out]
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { ruleFn, HIDDEN, hides, LETTERS, VOW } from '../lib/venn-rules.js';
import { DOMAINS } from '../lib/venn-facts.js';
import { REVIEWED } from './venn-hidden-review.mjs';
import { scanUS } from './us-spellings.mjs';

const here = dirname(fileURLToPath(import.meta.url));
const arg = (k, d) => { const i = process.argv.indexOf(k); return i > 0 ? process.argv[i + 1] : d; };
const TO = arg('--to');
if (!TO) { console.error('usage: gen-venn-bank.mjs --to YYYY-MM-DD [--out]'); process.exit(1); }
const BANK = join(here, '..', 'app', 'venn', 'puzzles.js');
const { PUZZLES } = await import(BANK);

export const ITEM_CEILING = 6;          // a knowledge row, across the whole bank
const WHEEL = ['letters', 'country', 'state', 'letters', 'element', 'president', 'country', 'letters'];
const HIDES_CYCLE = ['animal', 'body', 'number'];
const SEED_BASE = 0x5e1dface;

let seed = 1;
const rnd = () => { seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0; return seed / 4294967296; };
const shuffle = (a) => { const b = a.slice(); for (let i = b.length - 1; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); [b[i], b[j]] = [b[j], b[i]]; } return b; };

const readList = (p) => fs.readFileSync(join(here, '..', p), 'utf8').split('\n').map((w) => w.trim().toUpperCase()).filter(Boolean);
const DICT = new Set(readList('public/tuck-dict.txt'));

// ── US spelling screen for a single word ──────────────────────────────────
const britishVariant = (w) => {
  if (scanUS(w.toLowerCase()).length) return true;
  const alt = [
    [/OUR(S|ED|ING|ITE|ITES|ABLE)?$/, (m) => 'OR' + (m[1] || '')],
    [/OUR(?=[A-Z])/, () => 'OR'],
    [/ISE(S|D)?$/, (m) => 'IZE' + (m[1] || '')],
    [/ISING$/, () => 'IZING'], [/ISATION(S)?$/, (m) => 'IZATION' + (m[1] || '')],
    [/YSE(S|D)?$/, (m) => 'YZE' + (m[1] || '')],
    [/TRE(S)?$/, (m) => 'TER' + (m[1] || '')],
    [/ENCE(S)?$/, (m) => 'ENSE' + (m[1] || '')],
    [/LL(ED|ING|ER|ERS)$/, (m) => 'L' + m[1]],
    [/OGUE(S)?$/, (m) => 'OG' + (m[1] || '')],
    [/AE/, () => 'E'], [/OE/, () => 'E'], [/MME$/, () => 'M'],
  ];
  for (const [re, f] of alt) {
    const m = w.match(re);
    if (!m) continue;
    const us = w.slice(0, m.index) + f(m) + w.slice(m.index + m[0].length);
    if (us !== w && DICT.has(us) && COMMON.has(us)) return true;
  }
  return false;
};
const COMMON = new Set(readList('lib/anon-common.txt'));

// ── what the bank already holds ────────────────────────────────────────────
const itemUses = new Map();
for (const p of PUZZLES) for (const w of p.items) itemUses.set(w, (itemUses.get(w) || 0) + 1);
const ruleKey = (r) => r.k === 'fact' ? `fact:${r.p}` : r.k === 'hides' ? `hides:${r.set}` : r.k;
const tripleKey = (rules, domain) => `${domain || '-'}|${rules.map((r) => JSON.stringify(r)).sort().join(',')}`;
const kindUses = new Map(), triplesSeen = new Set();
const history = [];   // rule keys per board, in order
for (const p of PUZZLES) {
  for (const r of p.rules) kindUses.set(ruleKey(r), (kindUses.get(ruleKey(r)) || 0) + 1);
  triplesSeen.add(tripleKey(p.rules, p.domain));
  history.push({ domain: p.domain || 'letters', keys: p.rules.map(ruleKey) });
}

// ── candidate rules ────────────────────────────────────────────────────────
const ORTH = [
  { k: 'dbl' }, { k: 'norepeat' }, { k: 'sameends' }, { k: 'startvowel' },
  { k: 'endvowel' }, { k: 'twinvowel' }, { k: 'onevowel' }, { k: 'altvc' },
  { k: 'len', n: 4 }, { k: 'len', n: 5 }, { k: 'len', n: 6 }, { k: 'len', n: 7 },
  { k: 'lenGte', n: 6 }, { k: 'lenGte', n: 7 }, { k: 'lenGte', n: 8 },
  { k: 'vowels', n: 2 }, { k: 'vowels', n: 3 }, { k: 'vowels', n: 4 },
  ...'ABCDEHILMNOPRSTU'.split('').map((c) => ({ k: 'nolet', c })),
];
const VOWEL_RULES = new Set(['vowels', 'onevowel', 'startvowel', 'endvowel', 'twinvowel', 'altvc']);
const SPACE_RULES = new Set(['len', 'lenGte', 'alpha']);
const sameFamily = (a, b) => (a.k === b.k) || (['len', 'lenGte'].includes(a.k) && ['len', 'lenGte'].includes(b.k))
  || (['vowels', 'onevowel'].includes(a.k) && ['vowels', 'onevowel'].includes(b.k));

// ── letter pool ────────────────────────────────────────────────────────────
// Everyday words only: a word must be common English (lib/anon-common.txt), a
// real dictionary word (public/tuck-dict.txt, which drops names), AND carry a
// hand-written crossword clue in the Emcee/Encore banks, whose own rule is "no
// obscurities". The third list is what keeps out ABBA, HARAM, LIPID and ESTER,
// which the first two both admit. The clue banks are READ here, never edited.
const CLUED = new Set();
for (const f of ['emcee-wordbank.txt', 'encore-wordbank.txt']) {
  for (const line of fs.readFileSync(join(here, f), 'utf8').split('\n')) {
    const i = line.indexOf('|');
    if (i > 0) CLUED.add(line.slice(0, i).trim());
  }
}
const LETTER_POOL = [...COMMON].filter((w) => /^[A-Z]{4,9}$/.test(w) && DICT.has(w) && CLUED.has(w)
  && !itemUses.has(w) && !britishVariant(w));

// census: every dictionary word hidden in w is a member or reviewed, and the
// item does not merely BE a member (the verifier's "only IS that word" rule)
function censusOk(w, set) {
  const t = LETTERS(w), mem = new Set(HIDDEN[set]), rev = new Set(REVIEWED[set]);
  for (let i = 0; i < t.length; i++) for (let j = i + 3; j <= t.length; j++) {
    const sub = t.slice(i, j);
    if (DICT.has(sub) && hides(t, sub) && !mem.has(sub) && !rev.has(sub)) return false;
  }
  const hits = HIDDEN[set].filter((h) => w.includes(h));
  if (hits.length && !hits.some((h) => w !== h && w !== h + 'S' && w !== h + 'ES')) return false;
  return true;
}

// ── splits ─────────────────────────────────────────────────────────────────
const REGIONS = [1, 2, 4, 3, 5, 6, 7];
function targetsFor(sunday) {
  const TOTAL = sunday ? 15 : 12, CAP = sunday ? 4 : 3, out = [];
  const span = Array.from({ length: CAP }, (_, i) => i + 1);
  for (const a of span) for (const b of span) for (const c of span) for (const d of span)
    for (const e of span) for (const f of span) for (const g of [1, 2]) {
      if (a + b + c + d + e + f + g === TOTAL) out.push({ 1: a, 2: b, 4: c, 3: d, 5: e, 6: f, 7: g });
    }
  return out;
}
const TARGETS = { false: targetsFor(false), true: targetsFor(true) };

// ── one board ──────────────────────────────────────────────────────────────
function buildBoard(t, kind, hidesSet, usedNew) {
  const domain = kind === 'letters' ? null : kind;
  const D = domain ? DOMAINS[domain] : null;
  const recent = history.slice(-4).flatMap((h) => h.keys);
  // the last two boards of the SAME kind (same domain, or letters): a domain
  // comes round every few days, so a plain recency window never sees them
  const sameKind = history.filter((h) => h.domain === kind).slice(-2).flatMap((h) => h.keys);
  const pairKey = (rules) => rules.filter((r) => r.k === 'fact' || r.k === 'hides').map(ruleKey).sort().join('+');
  const pairUses = new Map();
  for (const h of history) if (h.domain === kind) { const k = h.keys.filter((x) => x.startsWith('fact:') || x.startsWith('hides:')).sort().join('+'); pairUses.set(k, (pairUses.get(k) || 0) + 1); }
  const ruleSets = [];
  if (!domain) {
    const base = hidesSet ? [{ k: 'hides', set: hidesSet }] : [];
    const need = 3 - base.length;
    const combos = need === 2
      ? ORTH.flatMap((a, i) => ORTH.slice(i + 1).map((b) => [a, b]))
      : ORTH.flatMap((a, i) => ORTH.slice(i + 1).flatMap((b, j) => ORTH.slice(i + j + 2).map((c) => [a, b, c])));
    for (const c of combos) ruleSets.push([...base, ...c]);
  } else {
    const facts = Object.keys(D.props).map((p) => ({ k: 'fact', p }));
    for (let i = 0; i < facts.length; i++) for (let j = i + 1; j < facts.length; j++) for (const o of ORTH) ruleSets.push([facts[i], facts[j], o]);
    for (const f of facts) for (let i = 0; i < ORTH.length; i++) for (let j = i + 1; j < ORTH.length; j++) ruleSets.push([f, ORTH[i], ORTH[j]]);
  }

  const scored = [];
  for (const rules0 of ruleSets) {
    const ortho = rules0.filter((r) => r.k !== 'fact' && r.k !== 'hides');
    if (ortho.some((a, i) => ortho.some((b, j) => j > i && sameFamily(a, b)))) continue;
    if (triplesSeen.has(tripleKey(rules0, domain))) continue;
    const vowelBoard = rules0.some((r) => VOWEL_RULES.has(r.k));
    const spaceBoard = rules0.some((r) => SPACE_RULES.has(r.k));
    let pool = domain ? Object.keys(D.rows).filter((w) => w.length <= 9 && (itemUses.get(w) || 0) < ITEM_CEILING) : LETTER_POOL.filter((w) => !usedNew.has(w));
    if (vowelBoard) pool = pool.filter((w) => !w.includes('Y'));
    if (spaceBoard) pool = pool.filter((w) => !w.includes(' '));
    if (hidesSet) pool = pool.filter((w) => censusOk(w, hidesSet));
    const fns = rules0.map((r) => ruleFn(r, domain));
    const buckets = {}; REGIONS.forEach((r) => { buckets[r] = []; });
    for (const w of pool) {
      const r = (fns[0](w) ? 1 : 0) | (fns[1](w) ? 2 : 0) | (fns[2](w) ? 4 : 0);
      if (r) buckets[r].push(w);
    }
    const splits = TARGETS[t.sunday].filter((s) => REGIONS.every((r) => buckets[r].length >= s[r]));
    if (!splits.length) continue;
    // Prefer rule kinds the bank has used least and the last few boards not at all.
    let pen = 0;
    for (const r of rules0) {
      const k = ruleKey(r);
      pen += (kindUses.get(k) || 0) * (r.k === 'fact' ? 0.6 : 0.4);
      if (recent.includes(k)) pen += 12;
      if (sameKind.includes(k) && r.k !== 'hides') pen += 15;
      if (r.k === 'nolet' && recent.some((x) => x === 'nolet')) pen += 8;
    }
    // Buckets that barely cover the split make for a forced board; reward slack.
    const slack = REGIONS.reduce((s, r) => s + Math.min(buckets[r].length, 8), 0);
    pen -= slack * 0.4;
    if (domain && rules0.filter((r) => r.k === 'fact').length === 2) pen -= 6;   // house style
    if (domain) pen += (pairUses.get(pairKey(rules0)) || 0) * 10;
    scored.push({ rules: rules0, buckets, splits, pen: pen + rnd() * 6 });
  }
  if (!scored.length) return null;
  scored.sort((a, b) => a.pen - b.pen);
  // Take a seeded pick from the best three; if its split cannot be filled
  // without two same-stem items, fall through to the next candidate.
  const first = Math.floor(rnd() * Math.min(3, scored.length));
  const order = [scored[first], ...scored.filter((_, i) => i !== first)];
  for (const pick of order.slice(0, 40)) {
    const items = fillPick(pick);
    if (items) return finish(pick, items);
  }
  return null;

  function fillPick(pick) {

    // Draw a split, weighted toward the even ones but never always the same.
    const TOTAL = t.sunday ? 15 : 12;
    const sd = (s) => REGIONS.reduce((a, r) => a + (s[r] - TOTAL / 7) ** 2, 0);
    const ws = pick.splits.map((s) => Math.exp(-sd(s) / 1.5));
    let x = rnd() * ws.reduce((a, b) => a + b, 0), split = pick.splits[0];
    for (let i = 0; i < ws.length; i++) { x -= ws[i]; if (x <= 0) { split = pick.splits[i]; break; } }

    const items = [];
    for (const r of REGIONS) {
      let b = shuffle(pick.buckets[r]);
      // knowledge rows: least-used first, table order (the better-known rows
      // lead each table) breaking ties, so a board is not all deep cuts
      if (domain) {
        const order = Object.keys(D.rows);
        const key = new Map(b.map((w) => [w, (itemUses.get(w) || 0) + (order.indexOf(w) / order.length) * 0.5 + rnd() * 0.8]));
        b = b.sort((p, q) => key.get(p) - key.get(q));
      }
      // no two items on a board where one is the other plus an ending
      // (HEADER / HEADERS, TONE / TONES): they read as the same word twice
      const stem = (a, c) => a.length >= 3 && (c.startsWith(a) || a.startsWith(c));
      let got = 0;
      for (const w of b) {
        if (got >= split[r]) break;
        if (items.some((o) => stem(o, w))) continue;
        items.push(w); got++;
      }
      if (got < split[r]) return null;
    }
    return items;
  }

  function finish(pick, items) {
    const board = { ...t, domain, rules: pick.rules, items: shuffle(items) };
    if (t.sunday) {
      const pool = shuffle([1, 2, 3, 4, 5, 6]);
      board.hiddenCounts = [pool[0], pool[1]];
    }
    return board;
  }
}

// ── calendar ───────────────────────────────────────────────────────────────
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const last = PUZZLES[PUZZLES.length - 1];
const out = [], usedNew = new Set();
let letterCount = 0;
for (let tms = Date.parse(`${last.live}T00:00:00Z`) + 86400000, num = last.num + 1; tms <= Date.parse(`${TO}T00:00:00Z`); tms += 86400000, num++) {
  const dt = new Date(tms), y = dt.getUTCFullYear(), m = dt.getUTCMonth() + 1, d = dt.getUTCDate();
  const t = {
    num, quizId: `venn-${m}-${d}-${String(y).slice(2)}`,
    live: `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`,
    dateLabel: `${MONTHS[m - 1]} ${d}, ${y}`, sunday: dt.getUTCDay() === 0,
  };
  seed = (SEED_BASE + num * 7919) >>> 0;
  let kind = WHEEL[num % WHEEL.length];
  if (kind !== 'letters' && history.length && history[history.length - 1].domain === kind) kind = 'letters';
  const hidesSet = kind === 'letters' && letterCount % 2 === 0 ? HIDES_CYCLE[(letterCount / 2) % 3] : null;
  let b = buildBoard(t, kind, hidesSet, usedNew);
  if (!b && hidesSet) b = buildBoard(t, kind, null, usedNew);
  if (!b) { console.error(`FAILED ${t.quizId} (${kind})`); process.exit(2); }
  if (kind === 'letters') letterCount++;
  for (const w of b.items) { itemUses.set(w, (itemUses.get(w) || 0) + 1); if (!b.domain) usedNew.add(w); }
  for (const r of b.rules) kindUses.set(ruleKey(r), (kindUses.get(ruleKey(r)) || 0) + 1);
  triplesSeen.add(tripleKey(b.rules, b.domain));
  history.push({ domain: b.domain || 'letters', keys: b.rules.map(ruleKey) });
  out.push(b);
}

// ── emit in the bank's hand-authored format ───────────────────────────────
const q = (s) => `'${s}'`;
const fmtRule = (r) => {
  const parts = [`k: ${q(r.k)}`];
  if (r.n !== undefined) parts.push(`n: ${r.n}`);
  if (r.c !== undefined) parts.push(`c: ${q(r.c)}`);
  if (r.set !== undefined) parts.push(`set: ${q(r.set)}`);
  if (r.p !== undefined) parts.push(`p: ${q(r.p)}`);
  return `{ ${parts.join(', ')} }`;
};
const text = out.map((b) => {
  const lines = [
    '  {',
    `    num: ${b.num}, quizId: ${q(b.quizId)}, live: ${q(b.live)}, dateLabel: ${q(b.dateLabel)}, sunday: ${b.sunday},`,
  ];
  if (b.domain) lines.push(`    domain: ${q(b.domain)},`);
  lines.push(`    rules: [${b.rules.map(fmtRule).join(', ')}],`);
  lines.push('    items: [');
  for (let i = 0; i < b.items.length; i += 4) lines.push(`      ${b.items.slice(i, i + 4).map(q).join(', ')},`);
  lines.push('    ],');
  if (b.hiddenCounts) lines.push(`    hiddenCounts: [${b.hiddenCounts.join(', ')}],`);
  lines.push('  },');
  return lines.join('\n');
}).join('\n') + '\n';

console.error(`letter pool ${LETTER_POOL.length}; built ${out.length} boards (${out.filter((b) => !b.domain).length} letters, ` +
  Object.keys(DOMAINS).map((d) => `${out.filter((b) => b.domain === d).length} ${d}`).join(', ') + ')');
if (process.argv.includes('--out')) {
  const src = fs.readFileSync(BANK, 'utf8');
  const cut = src.lastIndexOf('];');
  if (cut < 0 || !/\},\s*$/.test(src.slice(0, cut))) { console.error('cannot find the closing ]; of the bank'); process.exit(1); }
  fs.writeFileSync(BANK, src.slice(0, cut) + text + src.slice(cut));
  console.error(`spliced ${out.length} boards into app/venn/puzzles.js`);
} else {
  process.stdout.write(text);
}
