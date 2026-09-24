// Verify the Venn bank (app/venn/puzzles.js) from scratch:
//   - structural: nums sequential, quizId/live/dateLabel agree, sunday flag
//     matches the real weekday, 12 items on weekdays and 15 on Sundays, items
//     distinct and plain uppercase, three rule specs and all three different
//   - every one of the SEVEN regions is non-empty, so the diagram is fully used
//   - the triple overlap holds 1 or 2 items, never a dump
//   - no region holds more than 3 (weekday) or 4 (Sunday)
//   - no item falls outside all three circles
//   - hidden counts appear only on Sundays, exactly two of them, never the
//     triple overlap
//   - HIDES BOARDS: every real English word hidden inside an item is either a
//     scoring member or a reviewed non-member; an unclassified word fails
//   - KNOWLEDGE BOARDS: the declared domain exists, every item is a row in it,
//     and every fact rule names a property that domain declares
//   - the domain tables themselves are internally consistent (no tag used that
//     is not declared, no property declared that is never true)
// The board carries no answer: an item's region is recomputed here from the
// rules, exactly as the client recomputes it. Both sides now import the one
// engine in lib/venn-rules.js rather than keeping hand-synced copies.
// FRESH BOARDS (live >= FRESH_FROM, the 2026-10-24 restock and after; every
// board before it is played history and grandfathered):
//   - US spellings: no item fails scripts/us-spellings.mjs
//   - a letter-board item has never appeared on ANY earlier board (the last
//     month of letter boards recycled the bank's own items until ESTATE sat
//     on eight boards)
//   - a knowledge row appears at most ITEM_CEILING times across the bank
//   - an exact rule triple (domain + rules) never repeats an earlier board
//   - no knowledge domain runs on two consecutive days
//   - a board with a vowel rule carries no item containing Y (the engine
//     counts AEIOU only; a solver can reasonably count Y)
// Run: node scripts/verify-venn.mjs
//      node scripts/verify-venn.mjs --census   list unclassified hidden words
import fs from 'node:fs';
import { PUZZLES } from '../app/venn/puzzles.js';
import { ruleFn, HIDDEN, hides, LETTERS } from '../lib/venn-rules.js';
import { DOMAINS } from '../lib/venn-facts.js';
import { REVIEWED } from './venn-hidden-review.mjs';
import { scanUS } from './us-spellings.mjs';

const FRESH_FROM = '2026-10-24';
const ITEM_CEILING = 6;

let fails = 0;
const fail = (m) => { console.error('FAIL:', m); fails++; };

// ─── the census gate ───────────────────────────────────────────────────────
// A `hides` rule tests a closed member list but its label promises a whole
// category, so the danger has always been the word we simply forgot: FEELING
// hides an EEL, CARPET hides a CARP, WOMBAT hides a WOMB, and each read as
// misfiled to anyone who spotted it. The old guard was a second hand-written
// list of such words, which failed the same way the first one did the moment
// something was missing from BOTH (WOMBAT shipped on 2026-08-06 that way).
//
// So the guard is no longer a list of bad words. It is a census: pull EVERY
// real English word hidden inside every item, and require each one to have been
// classified, either as a member in HIDDEN or as a reviewed non-member in
// scripts/venn-hidden-review.mjs. A word nobody has looked at fails the board.
// Forgetting is now impossible; the worst case is a build that stops and asks.
//
// Knowledge rules need no equivalent. A domain table carries every property of
// every row, and an item off the table fails outright, so a knowledge board
// cannot assert something false by omission the way a member list can.
const DICT = new Set(
  fs.readFileSync(new URL('../public/tuck-dict.txt', import.meta.url), 'utf8')
    .split('\n').map((w) => w.trim().toUpperCase()).filter(Boolean),
);

// Every dictionary word of three letters or more sitting inside `w` without
// being `w` itself (or just its plural) — the same test the rule uses, so the
// census sees exactly what the scoring engine could have seen.
function hiddenWords(w) {
  const t = LETTERS(w); const out = new Set();
  for (let i = 0; i < t.length; i++) {
    for (let j = i + 3; j <= t.length; j++) {
      const sub = t.slice(i, j);
      if (DICT.has(sub) && hides(t, sub)) out.add(sub);
    }
  }
  return [...out];
}

const CENSUS = process.argv.includes('--census');
const unreviewed = { animal: new Map(), body: new Map(), number: new Map() };

// ─── domain table integrity, once, before any board is read ────────────────
// A mistyped tag is the one way a knowledge board can quietly lie:
// 'landlockd' simply reads as false and the item lands in the wrong region
// with nothing to catch it. Both halves of this check exist to stop that.
for (const [name, d] of Object.entries(DOMAINS)) {
  const declared = new Set(Object.keys(d.props));
  const used = new Set();
  for (const [row, tags] of Object.entries(d.rows)) {
    if (!Array.isArray(tags)) { fail(`domain ${name}: row ${row} is not an array`); continue; }
    if (!/^[A-Z]{2,}(?: [A-Z]{2,})*$/.test(row)) fail(`domain ${name}: row "${row}" is not plain uppercase`);
    if (new Set(tags).size !== tags.length) fail(`domain ${name}: row ${row} repeats a tag`);
    for (const t of tags) {
      if (!declared.has(t)) fail(`domain ${name}: row ${row} uses undeclared property "${t}"`);
      used.add(t);
    }
  }
  for (const p of declared) if (!used.has(p)) fail(`domain ${name}: property "${p}" is never true of any row`);
}

const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];
const REGIONS = [1,2,4,3,5,6,7];
const seen = new Set();

PUZZLES.forEach((p, i) => {
  const tag = `#${p.num} (${p.live})`;
  if (p.num !== i + 1) fail(`${tag}: num out of sequence`);
  if (seen.has(p.quizId)) fail(`${tag}: duplicate quizId`);
  seen.add(p.quizId);
  const [y, m, d] = p.live.split('-').map(Number);
  if (p.quizId !== `venn-${m}-${d}-${String(y).slice(2)}`) fail(`${tag}: quizId does not match live date`);
  if (p.dateLabel !== `${MONTHS[m-1]} ${d}, ${y}`) fail(`${tag}: dateLabel does not match live date`);
  if (!!p.sunday !== (new Date(Date.UTC(y, m-1, d)).getUTCDay() === 0)) fail(`${tag}: sunday flag wrong`);

  if (p.rules.length !== 3) { fail(`${tag}: ${p.rules.length} rules (want 3)`); return; }

  // ─── knowledge board wiring ──────────────────────────────────────────────
  const factRules = p.rules.filter((r) => r.k === 'fact');
  const dom = p.domain ? DOMAINS[p.domain] : null;
  if (factRules.length && !p.domain) { fail(`${tag}: uses a fact rule but declares no domain`); return; }
  if (p.domain && !dom) { fail(`${tag}: unknown domain "${p.domain}"`); return; }
  if (p.domain && !factRules.length) fail(`${tag}: declares a domain but no rule uses it`);
  if (dom) {
    for (const r of factRules) {
      if (!dom.props[r.p]) fail(`${tag}: fact rule names "${r.p}", not a property of ${p.domain}`);
    }
    // The anti-decoy guarantee: an item off the table has no declared truth,
    // so it could score wrongly with nothing to catch it.
    for (const w of p.items) {
      if (!Object.prototype.hasOwnProperty.call(dom.rows, w)) fail(`${tag}: ${w} is not in the ${p.domain} table`);
    }
    // Three knowledge rules is a pub quiz, not a Venn: at least one circle has
    // to be checkable off the item itself, so a player who does not know the
    // subject cold still has a way in.
    if (factRules.length === 3) fail(`${tag}: all three rules are knowledge rules (keep one readable off the item)`);
  }

  const fns = p.rules.map((r) => ruleFn(r, p.domain));
  if (fns.some((f) => !f)) { fail(`${tag}: unknown rule spec`); return; }
  if (new Set(p.rules.map((r) => JSON.stringify(r))).size !== 3) fail(`${tag}: two circles carry the same rule`);

  const want = p.sunday ? 15 : 12;
  if (p.items.length !== want) fail(`${tag}: ${p.items.length} items (want ${want})`);
  if (new Set(p.items).size !== p.items.length) fail(`${tag}: duplicate item`);
  // One internal space is allowed so two-word entities (NEW YORK, VAN BUREN)
  // can play; nine characters total is what a filed item can still be read at
  // in the 76px region tray.
  if (p.items.some((w) => !/^[A-Z]{2,}(?: [A-Z]{2,})?$/.test(w) || w.length < 3 || w.length > 9)) {
    fail(`${tag}: an item is not plain uppercase, or runs past nine characters`);
  }

  // A two-word item and a length rule cannot share a board. Letter rules strip
  // the space, so NEW YORK is seven letters to the engine and eight to a player
  // counting characters, and on "eight letters or more" those disagree about
  // the answer. Same for `alpha`, where the space breaks the run. Every other
  // rule reads the same either way.
  if (p.items.some((w) => w.includes(' ')) && p.rules.some((r) => ['len','lenGte','alpha'].includes(r.k))) {
    fail(`${tag}: a two-word item shares the board with a length rule, so the space is ambiguous`);
  }

  const region = (w) => (fns[0](w) ? 1 : 0) | (fns[1](w) ? 2 : 0) | (fns[2](w) ? 4 : 0);
  const counts = {}; REGIONS.forEach((r) => { counts[r] = 0; });
  p.items.forEach((w) => {
    const r = region(w);
    if (r === 0) fail(`${tag}: ${w} sits outside all three circles`);
    else counts[r]++;
  });
  REGIONS.forEach((r) => { if (!counts[r]) fail(`${tag}: region ${r} is empty`); });
  // No item may LOOK like it hides a word without qualifying. An item that
  // is the hidden word itself, or just its plural, reads to a solver as a
  // member of that circle while scoring outside it, which is unfair.
  const hr = p.rules.find((r) => r.k === 'hides');
  if (hr) {
    p.items.forEach((w) => {
      const hits = HIDDEN[hr.set].filter((h) => w.includes(h));
      if (hits.length && !hits.some((h) => w !== h && w !== h + 'S' && w !== h + 'ES')) {
        fail(`${tag}: ${w} reads as hiding ${hits.join('/')} but only IS that word`);
      }
      // ... and every real word hidden in the item must have been classified,
      // so a category member we never thought of cannot slip through unscored.
      const members = new Set(HIDDEN[hr.set]);
      const reviewed = new Set(REVIEWED[hr.set]);
      for (const h of hiddenWords(w)) {
        if (members.has(h) || reviewed.has(h)) continue;
        if (!unreviewed[hr.set].has(h)) unreviewed[hr.set].set(h, []);
        unreviewed[hr.set].get(h).push(`#${p.num} ${w}`);
        if (!CENSUS) fail(`${tag}: ${w} hides "${h}", which nobody has classified. Add it to HIDDEN if it is ${hr.set === 'body' ? 'a body part' : hr.set === 'animal' ? 'an animal' : 'a number'}, otherwise to scripts/venn-hidden-review.mjs`);
      }
    });
  }

  if (counts[7] < 1 || counts[7] > 2) fail(`${tag}: triple overlap holds ${counts[7]} (want 1 or 2)`);
  const cap = p.sunday ? 4 : 3;
  REGIONS.forEach((r) => { if (counts[r] > cap) fail(`${tag}: region ${r} holds ${counts[r]} (cap ${cap})`); });

  const hid = p.hiddenCounts || [];
  if (!p.sunday && hid.length) fail(`${tag}: weekday board hides counts`);
  if (p.sunday && hid.length !== 2) fail(`${tag}: Sunday hides ${hid.length} counts (want 2)`);
  if (hid.includes(7)) fail(`${tag}: the triple overlap count must never be hidden`);
  if (hid.some((r) => !REGIONS.includes(r))) fail(`${tag}: hidden count names a region that does not exist`);
});

// ─── fresh-board variety and copy rules ─────────────────────────────────────
{
  const VOWEL_RULES = new Set(['vowels', 'onevowel', 'startvowel', 'endvowel', 'twinvowel', 'altvc']);
  const uses = new Map();
  for (const p of PUZZLES) for (const w of p.items) uses.set(w, (uses.get(w) || 0) + 1);
  const seenItems = new Set(), seenTriples = new Set();
  PUZZLES.forEach((p, i) => {
    const tag = `#${p.num} (${p.live})`;
    const triple = `${p.domain || '-'}|${p.rules.map((r) => JSON.stringify(r)).sort().join(',')}`;
    if (p.live >= FRESH_FROM) {
      for (const w of p.items) {
        for (const hit of scanUS(w.toLowerCase())) fail(`${tag}: ${w} is a British form (US: ${hit.us})`);
        if (!p.domain && seenItems.has(w)) fail(`${tag}: letter item ${w} already appeared on an earlier board`);
        if (p.domain && uses.get(w) > ITEM_CEILING) fail(`${tag}: ${w} appears ${uses.get(w)} times in the bank (ceiling ${ITEM_CEILING})`);
      }
      if (seenTriples.has(triple)) fail(`${tag}: rule triple repeats an earlier board`);
      const prev = PUZZLES[i - 1];
      if (p.domain && prev && prev.domain === p.domain) fail(`${tag}: ${p.domain} two days running`);
      if (p.rules.some((r) => VOWEL_RULES.has(r.k))) {
        for (const w of p.items) if (w.includes('Y')) fail(`${tag}: ${w} contains Y on a board with a vowel rule`);
      }
    }
    for (const w of p.items) seenItems.add(w);
    seenTriples.add(triple);
  });
}

if (CENSUS) {
  let n = 0;
  for (const [set, m] of Object.entries(unreviewed)) {
    if (!m.size) continue;
    n += m.size;
    console.log(`\n${set}: ${m.size} unclassified word(s)`);
    for (const [h, where] of [...m].sort()) console.log(`  ${h.padEnd(10)} ${where.join(', ')}`);
  }
  console.log(n ? `\nclassify these, then re-run without --census` : '\ncensus clean: every hidden word is classified');
}

const known = PUZZLES.filter((p) => p.domain).length;
if (fails) { console.error(`\nverify-venn: ${fails} FAILURE(S)`); process.exit(1); }
console.log(`verify-venn: all ${PUZZLES.length} boards pass (${known} knowledge boards; regions all used, overlap sane, membership recomputed)`);
