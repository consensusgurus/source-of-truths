// Verify the Hearsay bank (app/hearsay/puzzles.js) from scratch:
//   - structural: nums sequential, quizId/live/dateLabel agree, sunday flag
//     matches the real weekday, Sundays run three voices and weekdays two,
//     cards distinct within a case, every statement well-formed and spoken by
//     a character who exists
//   - the script leaves EXACTLY ONE card by public-announcement simulation
//   - every line narrows the list, and at most one line may shave a single
//     card (a case of one-card nibbles reads as filler)
//   - the list stays ambiguous until the final line (>= 2 alive before it)
//   - the answer is not pinnable from any single attribute at the start
// Run: node scripts/verify-hearsay.mjs
import { PUZZLES } from '../app/hearsay/puzzles.js';
import { scanUS } from './us-spellings.mjs';

// From the 2026-11-01 extension on: US spellings and no dashes in every
// reader-facing string, and no noun (the day's domain) repeated from any
// earlier board. Earlier boards are frozen (they ship "the harbour board"
// and repeat a few nouns).
const COPY_FROM = '2026-11-01';
const seenNouns = new Set();

let fails = 0;
const fail = (msg) => { console.error('FAIL:', msg); fails++; };

// Kept byte-identical to the engine in app/hearsay/HearsayClient.jsx. The
// client derives the answer with its copy; this proves the bank with the same
// maths.
const countBy = (S, cards, attr, val) => S.filter((i) => cards[i][attr] === val).length;
function applyStatement(S, cards, st) {
  const a = st.who, b = st.other;
  if (st.type === 'dontKnow' || st.type === 'stillDontKnow') return S.filter((i) => countBy(S, cards, a, cards[i][a]) >= 2);
  if (st.type === 'know') return S.filter((i) => countBy(S, cards, a, cards[i][a]) === 1);
  if (st.type === 'knowOtherDoesnt') {
    return S.filter((i) => {
      if (countBy(S, cards, a, cards[i][a]) < 2) return false;
      return S.filter((j) => cards[j][a] === cards[i][a]).every((j) => countBy(S, cards, b, cards[j][b]) >= 2);
    });
  }
  if (st.type === 'knowNowOtherStill') {
    return S.filter((i) => countBy(S, cards, a, cards[i][a]) === 1 && countBy(S, cards, b, cards[i][b]) >= 2);
  }
  return null;
}

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const KEYS = ['a', 'b', 'c'];
const TYPES = new Set(['dontKnow', 'stillDontKnow', 'know', 'knowOtherDoesnt', 'knowNowOtherStill']);
const HIGHER = new Set(['knowOtherDoesnt', 'knowNowOtherStill']);
// The difficulty step: cases from 25 July run longer chains with at least one
// higher-order line. The launch case (24 July) shipped under the old ruleset
// and was already in play when the change landed, so it keeps its own bar.
const V2_FROM = '2026-07-25';
const seenIds = new Set();

PUZZLES.forEach((p, idx) => {
  const tag = `#${p.num} (${p.live})`;
  if (p.num !== idx + 1) fail(`${tag}: num out of sequence`);
  if (seenIds.has(p.quizId)) fail(`${tag}: duplicate quizId`);
  seenIds.add(p.quizId);
  if (p.live >= COPY_FROM) {
    if (seenNouns.has(p.noun)) fail(`${tag}: noun "${p.noun}" already used`);
    for (const t of [p.noun, p.listLabel, ...p.attrs, ...p.who, ...p.cards.flatMap((c) => Object.values(c))]) {
      for (const h of scanUS(t)) fail(`${tag}: British form "${h.found}" (US: ${h.us})`);
      if (/[\u2013\u2014]/.test(t)) fail(`${tag}: dash in "${t}"`);
    }
  }
  seenNouns.add(p.noun);

  const [y, m, d] = p.live.split('-').map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d));
  if (p.quizId !== `hearsay-${m}-${d}-${String(y).slice(2)}`) fail(`${tag}: quizId does not match live date`);
  if (p.dateLabel !== `${MONTHS[m - 1]} ${d}, ${y}`) fail(`${tag}: dateLabel does not match live date`);
  if (!!p.sunday !== (dt.getUTCDay() === 0)) fail(`${tag}: sunday flag does not match the weekday`);

  const nWho = p.sunday ? 3 : 2;
  if (p.who.length !== nWho) fail(`${tag}: ${p.who.length} voices (want ${nWho})`);
  if (p.attrs.length !== nWho) fail(`${tag}: ${p.attrs.length} attributes for ${nWho} voices`);
  if (new Set(p.who).size !== p.who.length) fail(`${tag}: two voices share a name`);
  if (p.cards.length < 8) fail(`${tag}: only ${p.cards.length} cards on the shortlist`);
  const keyOf = (c) => KEYS.slice(0, nWho).map((k) => c[k]).join('|');
  if (new Set(p.cards.map(keyOf)).size !== p.cards.length) fail(`${tag}: duplicate card on the shortlist`);
  p.cards.forEach((c, i) => {
    KEYS.slice(0, nWho).forEach((k) => { if (!c[k]) fail(`${tag}: card ${i} is missing attribute ${k}`); });
    if (nWho === 2 && c.c) fail(`${tag}: card ${i} carries a third attribute nobody was told`);
  });

  // script shape
  if (!p.script.length) { fail(`${tag}: empty script`); return; }
  p.script.forEach((st, i) => {
    if (!TYPES.has(st.type)) fail(`${tag}: line ${i} has unknown type ${st.type}`);
    if (KEYS.indexOf(st.who) < 0 || KEYS.indexOf(st.who) >= nWho) fail(`${tag}: line ${i} is spoken by a character who does not exist`);
    // the two higher-order types name the person they are about
    const aboutOther = st.type === 'knowOtherDoesnt' || st.type === 'knowNowOtherStill';
    if (aboutOther) {
      if (KEYS.indexOf(st.other) < 0 || KEYS.indexOf(st.other) >= nWho) fail(`${tag}: line ${i} speaks about a character who does not exist`);
      if (st.other === st.who) fail(`${tag}: line ${i} speaks about itself`);
    }
    if (!aboutOther && st.other) fail(`${tag}: line ${i} carries a stray other`);
  });
  if (p.script[p.script.length - 1].type !== 'know') fail(`${tag}: the last line should be the one that settles it`);
  const v2 = p.live >= V2_FROM;
  if (v2) {
    const wantLines = p.sunday ? 5 : 4;
    if (p.script.length < wantLines) fail(`${tag}: ${p.script.length} lines (want >= ${wantLines})`);
    const higher = p.script.filter((st) => HIGHER.has(st.type)).length;
    if (higher < (p.sunday ? 2 : 1)) fail(`${tag}: ${higher} higher-order lines (want >= ${p.sunday ? 2 : 1})`);
    if (p.cards.length < (p.sunday ? 14 : 11)) fail(`${tag}: only ${p.cards.length} cards for the harder ruleset`);
  }

  // simulate
  let S = p.cards.map((_, i) => i);
  const trace = [S.length];
  for (const st of p.script) {
    const next = applyStatement(S, p.cards, st);
    if (!next) { fail(`${tag}: unsimulatable statement`); return; }
    S = next;
    trace.push(S.length);
  }
  if (S.length !== 1) { fail(`${tag}: ${S.length} cards survive the script (need exactly 1)`); return; }

  let weak = 0;
  for (let i = 1; i < trace.length; i++) {
    if (trace[i] >= trace[i - 1]) fail(`${tag}: line ${i - 1} narrows nothing (${trace[i - 1]} -> ${trace[i]})`);
    if (trace[i - 1] - trace[i] < 2) weak++;
  }
  if (weak > (p.sunday ? 3 : 1)) fail(`${tag}: ${weak} lines shave only one card`);
  const minPenult = !v2 ? 2 : (p.sunday ? 4 : 3);
  if (trace[trace.length - 2] < minPenult) fail(`${tag}: only ${trace[trace.length - 2]} alive before the final line (want >= ${minPenult})`);

  const ans = p.cards[S[0]];
  KEYS.slice(0, nWho).forEach((k, i) => {
    if (p.cards.filter((c) => c[k] === ans[k]).length < 2) fail(`${tag}: the ${p.attrs[i]} alone gives the answer away at the start`);
  });
});

if (fails) { console.error(`\nverify-hearsay: ${fails} FAILURE(S)`); process.exit(1); }
console.log(`verify-hearsay: all ${PUZZLES.length} cases pass (unique survivor, every line narrows, no early giveaway)`);
