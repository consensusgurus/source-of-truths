// Crux bank generator. Committed on purpose: the Aug 11 to Sep 29 2026 batch
// was built by a script that was never checked in, which is why nobody could
// re-run it, nobody could read what it optimized for, and nobody noticed it had
// collapsed onto four categories (Colors on 25 of 50 boards, Metals on 23,
// BRONZE on 19). A generator you cannot re-run is a bank you cannot fix.
//
//   node scripts/gen-crux.mjs --from 2026-08-20 --to 2026-09-29 --startnum 46
//   node scripts/gen-crux.mjs --from 2026-09-30 --days 60 --startnum 87
//
// It prints puzzle objects ready to splice into app/crux/puzzles.js, and it
// reads the EXISTING bank first so the spacing rules are measured against the
// frozen boards too: a board generated for Aug 20 knows what Aug 19 used.
//
// WHAT IT GUARANTEES, per board:
//   * 4 categories, 2 words each (3 on a Sunday Edition, 27 guesses).
//   * At least 2 cross-category collisions (3 on a Sunday), each declared in
//     the emitted `collisions` field, each reading a category ON the board.
//   * Exactly ONE way to file the words into the categories, counted over the
//     memberships READS declares. Not "the intended filing works" — exactly one
//     filing exists. See scripts/crux-pool.mjs.
//   * Exactly ONE way to file the words into the SLOTS, so a solver who has
//     deduced the words places them one way only.
//   * A legal lattice: crossings letter-matched, both ends of every word open,
//     no orthogonal adjacency outside a shared slot, every slot connected.
//
// WHAT IT GUARANTEES, across the bank (the part that was missing):
//   * No category name repeats within CAT_GAP days.
//   * No answer word repeats within WORD_GAP days.
//   * No category+wordset pair EVER repeats.
//   * Whole-bank ceilings on how often a category and a word may appear.
// scripts/verify-daily-banks.mjs re-checks every one of these against the
// committed file, so a hand-edited board cannot slip past them either.
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { CATEGORIES, HOME, readsOf } from './crux-pool.mjs';

const here = dirname(fileURLToPath(import.meta.url));

// ── the variety rules (owner ruling, 2026-08-19) ───────────────────────────
// Deliberately the loose end of what was on the table: enough to stop a
// category or an answer coming back while a player still remembers it, not so
// tight that a 60-day bank becomes unbankable. Raising either number is safe;
// the generator simply searches longer.
export const CAT_GAP = 7;        // days before a category name may return
export const WORD_GAP = 14;      // days before an answer word may return
export const CAT_CEIL_PER_50 = 7;   // whole-bank ceiling, scaled by bank length
export const WORD_CEIL_PER_50 = 4;

const MAX_COLS = 12;             // mobile cell size; Sunday is allowed 13
const arg = (k, d) => {
  const i = process.argv.indexOf(`--${k}`);
  return i > 0 && process.argv[i + 1] ? process.argv[i + 1] : d;
};
const FROM = arg('from', null);
const TO = arg('to', null);
const DAYS = Number(arg('days', 0));
const STARTNUM = Number(arg('startnum', 0));
const SEED = Number(arg('seed', 20260819));
if (!FROM || !STARTNUM) {
  console.error('usage: gen-crux.mjs --from YYYY-MM-DD (--to YYYY-MM-DD | --days N) --startnum N [--seed N]');
  process.exit(2);
}

// deterministic RNG so a re-run reproduces the bank byte for byte
let _s = SEED >>> 0;
const rnd = () => (((_s = (_s * 1664525 + 1013904223) >>> 0)) / 4294967296);
const pick = (a) => a[Math.floor(rnd() * a.length)];
const shuffled = (a) => { const b = a.slice(); for (let i = b.length - 1; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); [b[i], b[j]] = [b[j], b[i]]; } return b; };

const DAY = 864e5;
const dnum = (s) => Math.round(Date.parse(`${s}T00:00:00Z`) / DAY);
const dstr = (n) => new Date(n * DAY).toISOString().slice(0, 10);
const LABEL = (s) => new Date(`${s}T12:00:00Z`).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric', timeZone: 'UTC' });
const isSunday = (s) => new Date(`${s}T12:00:00Z`).getUTCDay() === 0;
const qid = (s) => { const [y, m, d] = s.split('-').map(Number); return `crux-${m}-${d}-${y % 100}`; };

// ── pool sanity ────────────────────────────────────────────────────────────
{
  const seen = new Map();
  for (const c of CATEGORIES) for (const w of c.words) {
    if (seen.has(w)) { console.error(`pool: ${w} is in both ${seen.get(w)} and ${c.name}`); process.exit(1); }
    seen.set(w, c.name);
  }
  const names = new Set(CATEGORIES.map((c) => c.name));
  for (const w of Object.keys(HOME)) for (const r of readsOf(w)) {
    if (!names.has(r)) { console.error(`pool: ${w} reads "${r}", which is not a category`); process.exit(1); }
  }
}
const CAT = Object.fromEntries(CATEGORIES.map((c) => [c.name, c]));

// ── the collision graph ────────────────────────────────────────────────────
// Four categories drawn at random almost never collide: measured over 20,000
// random draws from this pool, only 2.7% clear the weekday floor and 0.27%
// clear the Sunday one, which is why a naive generator ends up recycling the
// same four categories forever — they are the ones that collide. So a board is
// GROWN from an edge of this graph instead of sampled and tested: A links to B
// when some word of A reads as B, and each new category is drawn from the
// neighbours of the ones already chosen.
const NBR = new Map();
for (const c of CATEGORIES) for (const w of c.words) for (const r of readsOf(w)) {
  if (!NBR.has(c.name)) NBR.set(c.name, new Set());
  if (!NBR.has(r)) NBR.set(r, new Set());
  NBR.get(c.name).add(r);
  NBR.get(r).add(c.name);
}
for (const c of CATEGORIES) if (!NBR.has(c.name)) NBR.set(c.name, new Set());

// ── history: the frozen boards are part of the spacing calculation ─────────
const { PUZZLES } = await import(join(here, '../app/crux/puzzles.js'));
const history = [];   // { day, cats:[names], words:[...], sigs:Set }
for (const p of PUZZLES) {
  if (p.live >= FROM) continue;   // regenerated boards do not count as history
  history.push({
    day: dnum(p.live),
    live: p.live,
    cats: p.categories.map((c) => c.name),
    words: p.categories.flatMap((c) => c.words),
    sigs: p.categories.map((c) => `${c.name}:${[...c.words].sort().join('/')}`),
    colls: (p.collisions ?? []).map((c) => `${c.word}|${c.reads}`),
  });
}

const dates = [];
if (TO) { for (let d = dnum(FROM); d <= dnum(TO); d++) dates.push(dstr(d)); }
else { for (let i = 0; i < DAYS; i++) dates.push(dstr(dnum(FROM) + i)); }
const catCeil = Math.max(2, Math.round((CAT_CEIL_PER_50 * dates.length) / 50));
const wordCeil = Math.max(1, Math.round((WORD_CEIL_PER_50 * dates.length) / 50));

const lastCat = new Map(), lastWord = new Map(), usedSig = new Set();
const catCount = new Map(), wordCount = new Map(), pairCount = new Map();
// The collision ceiling is a BANK-WIDE rule, not a per-run one: keep this in
// step with CRUX_VARIETY_FROM in scripts/verify-daily-banks.mjs. pairCount used
// to start empty, so a run only counted the traps it had just made and happily
// took a pair to its third or fourth appearance on top of the frozen boards.
// The Sep 30 to Oct 31 batch tripped exactly that: 32 fresh boards pushed 32
// pairs (CORNET|Cookware, SNARE|Trapping gear, MONITOR|Computer parts and the
// rest) past the limit, and only the verifier noticed.
const VARIETY_FROM = '2026-08-20';
const trapSets = [];   // collision-pair sets of every board in the window, for the overlap rule
for (const h of history) {
  for (const c of h.cats) lastCat.set(c, Math.max(lastCat.get(c) ?? -1e9, h.day));
  for (const w of h.words) lastWord.set(w, Math.max(lastWord.get(w) ?? -1e9, h.day));
  for (const s of h.sigs) usedSig.add(s);
  if (h.live >= VARIETY_FROM) for (const k of h.colls) pairCount.set(k, (pairCount.get(k) ?? 0) + 1);
  if (h.live >= VARIETY_FROM) trapSets.push(new Set(h.colls));
}

// ── semantic uniqueness: count the filings of words into categories ────────
// A word may live in its home or in any category it reads as that is ON this
// board. Exactly one complete filing must exist, or the board has two answers.
function filingCount(cats, words, capacity, cap2 = 2) {
  const idx = Object.fromEntries(cats.map((c, i) => [c, i]));
  const opts = words.map((w) => {
    const set = [idx[HOME[w]]];
    for (const r of readsOf(w)) if (idx[r] !== undefined && !set.includes(idx[r])) set.push(idx[r]);
    return set;
  });
  const left = capacity.slice();
  let n = 0;
  (function rec(i) {
    if (n >= cap2) return;
    if (i === words.length) { n++; return; }
    for (const c of opts[i]) {
      if (!left[c]) continue;
      left[c]--; rec(i + 1); left[c]++;
      if (n >= cap2) return;
    }
  })(0);
  return n;
}

// ── lattice ────────────────────────────────────────────────────────────────
// Random-restart assembly. Every placement is validated against the four
// structural rules at the moment it is made, so a completed lattice is legal
// by construction and only the bounding box and the slot-filing uniqueness
// still have to be judged.
function tryLattice(words, maxCols) {
  const N = 60, OFF = 30;
  const grid = new Map();           // "r,c" -> letter
  const owner = new Map();          // "r,c" -> [slotIndex,...]
  const placed = [];                // { word, row, col, dir }
  const K = (r, c) => `${r},${c}`;

  const fits = (word, row, col, dir, first) => {
    let crossings = 0;
    const dr = dir === 'D' ? 1 : 0, dc = dir === 'A' ? 1 : 0;
    // both ends open
    const br = row - dr, bc = col - dc;
    if (grid.has(K(br, bc))) return -1;
    if (grid.has(K(row + dr * word.length, col + dc * word.length))) return -1;
    for (let i = 0; i < word.length; i++) {
      const r = row + dr * i, c = col + dc * i;
      if (r < 0 || c < 0 || r >= N || c >= N) return -1;
      const cur = grid.get(K(r, c));
      if (cur !== undefined) {
        if (cur !== word[i]) return -1;
        // an occupied cell may only be reused as a genuine perpendicular crossing
        const os = owner.get(K(r, c)) || [];
        if (os.some((si) => placed[si].dir === dir)) return -1;
        crossings++;
      } else {
        // an empty cell must not touch anything sideways, or we create an
        // adjacency that belongs to no shared slot
        const sr = dir === 'D' ? 0 : 1, sc = dir === 'D' ? 1 : 0;
        if (grid.has(K(r - sr, c - sc)) || grid.has(K(r + sr, c + sc))) return -1;
      }
    }
    if (!first && crossings === 0) return -1;
    return crossings;
  };

  const put = (word, row, col, dir) => {
    const si = placed.length;
    placed.push({ word, row, col, dir });
    const dr = dir === 'D' ? 1 : 0, dc = dir === 'A' ? 1 : 0;
    for (let i = 0; i < word.length; i++) {
      const k = K(row + dr * i, col + dc * i);
      grid.set(k, word[i]);
      owner.set(k, [...(owner.get(k) || []), si]);
    }
  };

  const order = shuffled(words).sort((a, b) => b.length - a.length);
  put(order[0], OFF, OFF - Math.floor(order[0].length / 2), 'A');
  for (let wi = 1; wi < order.length; wi++) {
    const word = order[wi];
    const cands = [];
    for (const p of placed) {
      const pdr = p.dir === 'D' ? 1 : 0, pdc = p.dir === 'A' ? 1 : 0;
      const dir = p.dir === 'A' ? 'D' : 'A';
      const ddr = dir === 'D' ? 1 : 0, ddc = dir === 'A' ? 1 : 0;
      for (let i = 0; i < p.word.length; i++) {
        for (let j = 0; j < word.length; j++) {
          if (p.word[i] !== word[j]) continue;
          const r = p.row + pdr * i - ddr * j, c = p.col + pdc * i - ddc * j;
          const x = fits(word, r, c, dir, false);
          if (x >= 1) cands.push({ r, c, dir });
        }
      }
    }
    if (!cands.length) return null;
    // prefer a placement that keeps the board square and small
    const rs = placed.flatMap((p) => [p.row, p.row + (p.dir === 'D' ? p.word.length - 1 : 0)]);
    const cs = placed.flatMap((p) => [p.col, p.col + (p.dir === 'A' ? p.word.length - 1 : 0)]);
    const score = (x) => {
      const r0 = Math.min(...rs, x.r), r1 = Math.max(...rs, x.r + (x.dir === 'D' ? word.length - 1 : 0));
      const c0 = Math.min(...cs, x.c), c1 = Math.max(...cs, x.c + (x.dir === 'A' ? word.length - 1 : 0));
      return (r1 - r0 + 1) * (c1 - c0 + 1) + Math.abs((r1 - r0) - (c1 - c0)) * 2;
    };
    const best = cands.map((x) => [score(x), x]).sort((a, b) => a[0] - b[0]);
    const take = best[Math.floor(rnd() * Math.min(3, best.length))][1];
    put(word, take.r, take.c, take.dir);
  }

  const r0 = Math.min(...placed.map((p) => p.row)), c0 = Math.min(...placed.map((p) => p.col));
  const r1 = Math.max(...placed.map((p) => p.row + (p.dir === 'D' ? p.word.length - 1 : 0)));
  const c1 = Math.max(...placed.map((p) => p.col + (p.dir === 'A' ? p.word.length - 1 : 0)));
  const rows = r1 - r0 + 1, cols = c1 - c0 + 1;
  if (cols > maxCols || rows > maxCols + 1) return null;
  const slots = placed.map((p) => ({ word: p.word, row: p.row - r0, col: p.col - c0, dir: p.dir }));

  // exactly one way to file the deduced words into these slots
  if (slotFilings(slots) !== 1) return null;

  // Crossword numbering, reading order, numbered by START CELL rather than by
  // slot: an Across and a Down beginning in the same square share a number
  // (3A and 3D), which is both the convention and what the client renders —
  // `startNum` in CruxClient keeps the first number it finds per cell, so two
  // numbers on one square would leave one of the pair labelled with the
  // other's.
  const cellNum = new Map();
  let n = 0;
  for (const s of slots.slice().sort((a, b) => (a.row - b.row) || (a.col - b.col))) {
    const k = `${s.row},${s.col}`;
    if (!cellNum.has(k)) cellNum.set(k, ++n);
  }
  for (const s of slots) s.id = `${cellNum.get(`${s.row},${s.col}`)}${s.dir}`;
  slots.sort((a, b) => (parseInt(a.id, 10) - parseInt(b.id, 10)) || a.dir.localeCompare(b.dir));
  return { rows, cols, slots: slots.map((s) => ({ id: s.id, word: s.word, row: s.row, col: s.col, dir: s.dir })) };
}

// mirrors the check in scripts/verify-daily-banks.mjs
function slotFilings(slots) {
  const n = slots.length;
  const pos = slots.map((s) => [...s.word].map((_, i) => (s.dir === 'A' ? `${s.row},${s.col + i}` : `${s.row + i},${s.col}`)));
  const words = slots.map((s) => s.word);
  const cross = {};
  for (let i = 0; i < n; i++) for (let j = i + 1; j < n; j++) for (const c of pos[i]) if (pos[j].includes(c)) {
    (cross[i] = cross[i] || []).push([pos[i].indexOf(c), j, pos[j].indexOf(c)]);
    (cross[j] = cross[j] || []).push([pos[j].indexOf(c), i, pos[i].indexOf(c)]);
  }
  const cand = pos.map((pp) => words.map((w, wi) => [w, wi]).filter(([w]) => w.length === pp.length).map(([, wi]) => wi));
  const order = [...Array(n).keys()].sort((a, b) => cand[a].length - cand[b].length);
  const asg = Array(n).fill(-1), used = Array(n).fill(false);
  let count = 0;
  (function rec(k) {
    if (count >= 2) return;
    if (k === n) { count++; return; }
    const s = order[k];
    for (const wi of cand[s]) {
      if (used[wi]) continue;
      const w = words[wi];
      let good = true;
      for (const [ci, o, cj] of (cross[s] || [])) if (asg[o] >= 0 && w[ci] !== words[asg[o]][cj]) { good = false; break; }
      if (!good) continue;
      asg[s] = wi; used[wi] = true; rec(k + 1); asg[s] = -1; used[wi] = false;
      if (count >= 2) return;
    }
  })(0);
  return count;
}

// ── build one board ────────────────────────────────────────────────────────
function build(date) {
  const day = dnum(date);
  const sunday = isSunday(date);
  const per = sunday ? 3 : 2;
  const floor = sunday ? 3 : 2;
  const maxCols = sunday ? MAX_COLS + 1 : MAX_COLS;

  const openCats = CATEGORIES.filter((c) => (day - (lastCat.get(c.name) ?? -1e9)) >= CAT_GAP
    && (catCount.get(c.name) || 0) < catCeil);
  // least recently used first, so the rotation spreads rather than clumps
  openCats.sort((a, b) => (lastCat.get(a.name) ?? -1e9) - (lastCat.get(b.name) ?? -1e9));

  if (openCats.length < 4) return null;
  const openSet = new Set(openCats.map((c) => c.name));

  for (let attempt = 0; attempt < 6000; attempt++) {
    // seed from the staler end of the pool, then grow along collision edges
    const seedPool = openCats.slice(0, Math.max(10, Math.ceil(openCats.length * (attempt < 3000 ? 0.5 : 1))));
    const names = [pick(seedPool).name];
    while (names.length < 4) {
      const nbrs = [...new Set(names.flatMap((n) => [...NBR.get(n)]))]
        .filter((n) => openSet.has(n) && !names.includes(n));
      // one slot in four is drawn freely, so the graph's dense corner cannot
      // become the whole bank the way Colors and Metals did
      const from = (nbrs.length && rnd() < 0.85) ? nbrs : openCats.map((c) => c.name).filter((n) => !names.includes(n));
      if (!from.length) break;
      names.push(pick(from));
    }
    if (names.length < 4) continue;
    const four = names.map((n) => CAT[n]);

    // words each category may still use
    const avail = four.map((c) => c.words.filter((w) => (day - (lastWord.get(w) ?? -1e9)) >= WORD_GAP
      && (wordCount.get(w) || 0) < wordCeil));
    if (avail.some((a) => a.length < per)) continue;

    // prefer words that actually collide into this board
    const collides = (w) => readsOf(w).filter((r) => names.includes(r));
    const chosen = avail.map((a) => {
      const hot = shuffled(a.filter((w) => collides(w).length));
      const cold = shuffled(a.filter((w) => !collides(w).length));
      return [...hot, ...cold].slice(0, per);
    });

    const words = chosen.flat();
    if (new Set(words).size !== words.length) continue;
    const sigs = names.map((n, i) => `${n}:${[...chosen[i]].sort().join('/')}`);
    if (sigs.some((s) => usedSig.has(s))) continue;

    const collisions = words.flatMap((w) => collides(w).map((r) => ({ word: w, reads: r })));
    if (collisions.length < floor) continue;
    // the same trap three times is a flat bank even when the words differ, so
    // hold it to the limit verify-daily-banks.mjs already enforces
    if (collisions.some((c) => (pairCount.get(`${c.word}|${c.reads}`) || 0) >= 2)) continue;
    // Two boards built on the same two traps read as one board served twice,
    // even three weeks apart and with different filler words: the Nov 2026
    // run first came out with Chess pieces / Beekeeping / Hairstyles / Fish on
    // Nov 8 AND Nov 28, both on QUEEN, MULLET and BEEHIVE. So a board may share
    // at most ONE collision pair with any earlier board in the variety window.
    {
      const mine = collisions.map((c) => `${c.word}|${c.reads}`);
      if (trapSets.some((t) => mine.filter((k) => t.has(k)).length >= 2)) continue;
    }
    if (filingCount(names, words, Array(4).fill(per)) !== 1) continue;

    for (let t = 0; t < 300; t++) {
      const lat = tryLattice(words, maxCols);
      if (!lat) continue;
      return {
        num: 0,
        quizId: qid(date),
        live: date,
        dateLabel: LABEL(date),
        ...(sunday ? { sunday: true } : {}),
        guesses: sunday ? 27 : 18,
        rows: lat.rows,
        cols: lat.cols,
        collisions,
        categories: names.map((n, i) => ({ name: n, words: chosen[i] })),
        slots: lat.slots,
      };
    }
  }
  return null;
}

// ── run ────────────────────────────────────────────────────────────────────
const out = [];
let num = STARTNUM;
for (const date of dates) {
  const p = build(date);
  if (!p) { console.error(`FAILED to build ${date} — widen the pool or loosen a gap`); process.exit(1); }
  p.num = num++;
  out.push(p);
  const day = dnum(date);
  for (const c of p.categories) {
    lastCat.set(c.name, day);
    catCount.set(c.name, (catCount.get(c.name) || 0) + 1);
    usedSig.add(`${c.name}:${[...c.words].sort().join('/')}`);
    for (const w of c.words) { lastWord.set(w, day); wordCount.set(w, (wordCount.get(w) || 0) + 1); }
  }
  for (const c of p.collisions) {
    const k = `${c.word}|${c.reads}`;
    pairCount.set(k, (pairCount.get(k) || 0) + 1);
  }
  trapSets.push(new Set(p.collisions.map((c) => `${c.word}|${c.reads}`)));
}

const j = (v) => JSON.stringify(v);
const body = out.map((p) => `  {
    num: ${p.num},
    quizId: ${j(p.quizId)},
    live: ${j(p.live)},
    dateLabel: ${j(p.dateLabel)},${p.sunday ? '\n    sunday: true,' : ''}
    guesses: ${p.guesses},
    rows: ${p.rows},
    cols: ${p.cols},
    collisions: [
${p.collisions.map((c) => `      { word: ${j(c.word)}, reads: ${j(c.reads)} },`).join('\n')}
    ],
    categories: [
${p.categories.map((c) => `      { name: ${j(c.name)}, words: [${c.words.map(j).join(', ')}] },`).join('\n')}
    ],
    slots: [
${p.slots.map((s) => `      { id: ${j(s.id)}, word: ${j(s.word)}, row: ${s.row}, col: ${s.col}, dir: ${j(s.dir)} },`).join('\n')}
    ],
  },`).join('\n');
console.log(body);

const cc = new Map(), wc = new Map();
for (const p of out) for (const c of p.categories) {
  cc.set(c.name, (cc.get(c.name) || 0) + 1);
  for (const w of c.words) wc.set(w, (wc.get(w) || 0) + 1);
}
const top = (m) => [...m.entries()].sort((a, b) => b[1] - a[1]).slice(0, 6).map(([k, n]) => `${k} x${n}`).join(', ');
console.error(`\nbuilt ${out.length} boards ${dates[0]} to ${dates[dates.length - 1]}`);
console.error(`categories: ${cc.size} distinct over ${out.length * 4} slots — most used: ${top(cc)}`);
console.error(`words: ${wc.size} distinct over ${out.reduce((n, p) => n + p.slots.length, 0)} slots — most used: ${top(wc)}`);
