// scripts/gen-crib.mjs — builds app/crib/puzzles.js, the daily cribbage throw.
//
//   node scripts/gen-crib.mjs pool <seed> <count> <out.jsonl>   value random hands
//   node scripts/gen-crib.mjs bank <from YYYY-MM-DD> <days> <pool.jsonl...>
//
// Two phases because valuing a hand is the whole cost (about 0.3s: fifteen
// throws, each averaged over 46 cuts and, for the crib, 45,540 cut-and-pair
// combinations). `pool` values random six-card hands and writes one JSON line
// each; run it as several processes with different seeds. `bank` reads the
// pools and deals the calendar, printing the module to stdout.
//
// THE RAMP IS THE GAP. A hand's `gap` is how far its best throw beats the
// second best, and it is measured, never assumed. Measured on 150 random hands:
// median 1.24, lower quartile 0.52, one in ten under 0.08. So a Monday asks for
// hands whose best throw is obvious by two full points, and the week narrows
// the gap until a Saturday throw is right by a fifth of a point.
//
//   Mon  gap >= 2.0              5 hands
//   Tue  1.3 <= gap < 2.6        5 hands
//   Wed  0.9 <= gap < 1.7        5 hands, at least 1 where the crib decides it
//   Thu  0.6 <= gap < 1.15       5 hands, at least 1 where the crib decides it
//   Fri  0.4 <= gap < 0.85       5 hands, at least 2 where the crib decides it
//   Sat  0.2 <= gap < 0.6        5 hands, at least 2 where the crib decides it
//   Sun  0.2 <= gap < 1.0        7 hands, at least 3 where the crib decides it
//
// "The crib decides it" (`flip`) means the throw that keeps the best four cards
// is NOT the best throw once the crib is counted: the hand you would keep
// looking only at your own cards is the wrong one. It is the idea the game
// exists to teach, so the week asks for more of it.
//
// Within a day the hands alternate whose crib it is, starting with yours, and
// run widest gap first. No six-card hand repeats anywhere in the bank, and no
// rank pattern (the six ranks, sorted, plus whose crib) repeats inside 21 days.
import fs from 'fs';
import { fileURLToPath } from 'url';
import { valueThrows } from '../lib/crib-core.js';

const r3 = (x) => Math.round(x * 1000) / 1000;

function rng(seed) {
  let s = (seed >>> 0) || 1;
  return () => { s ^= s << 13; s >>>= 0; s ^= s >>> 17; s ^= s << 5; s >>>= 0; return s / 4294967296; };
}

function valueHand(six, yours) {
  const v = valueThrows(six, yours);
  const order = v.map((_, i) => i).sort((a, b) => v[b].value - v[a].value);
  const byHand = v.map((_, i) => i).sort((a, b) => v[b].hand - v[a].hand)[0];
  return {
    cards: six,
    yours,
    best: order[0],
    gap: r3(v[order[0]].value - v[order[1]].value),
    flip: byHand !== order[0],
    hand: v.map((x) => r3(x.hand)),
    crib: v.map((x) => r3(x.crib)),
    value: v.map((x) => r3(x.value)),
  };
}

function pool(seed, count, out) {
  const rand = rng(seed);
  const fd = fs.openSync(out, 'a');
  for (let n = 0; n < count; n++) {
    const deck = [...Array(52).keys()];
    for (let i = 51; i > 0; i--) { const j = Math.floor(rand() * (i + 1)); [deck[i], deck[j]] = [deck[j], deck[i]]; }
    const six = deck.slice(0, 6).sort((a, b) => a - b);
    // Both cribs for every hand: the same six cards are a different puzzle with
    // the crib on the other side, and this doubles the pool for free.
    for (const yours of [true, false]) fs.writeSync(fd, JSON.stringify(valueHand(six, yours)) + '\n');
  }
  fs.closeSync(fd);
}

export const SPEC = {
  1: { lo: 2.0, hi: 99, flips: 0, n: 5 },
  2: { lo: 1.3, hi: 2.6, flips: 0, n: 5 },
  3: { lo: 0.9, hi: 1.7, flips: 1, n: 5 },
  4: { lo: 0.6, hi: 1.15, flips: 1, n: 5 },
  5: { lo: 0.4, hi: 0.85, flips: 2, n: 5 },
  6: { lo: 0.2, hi: 0.6, flips: 2, n: 5 },
  0: { lo: 0.2, hi: 1.0, flips: 3, n: 7 },
};

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
function addDays(ymd, k) {
  const d = new Date(`${ymd}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() + k);
  return d.toISOString().slice(0, 10);
}
const dow = (ymd) => new Date(`${ymd}T12:00:00Z`).getUTCDay();
const rankSig = (h) => h.cards.map((c) => c % 13).sort((a, b) => a - b).join('.') + (h.yours ? 'y' : 't');

function bank(from, days, files) {
  const hands = [];
  const seen = new Set();
  for (const f of files) {
    for (const line of fs.readFileSync(f, 'utf8').split('\n')) {
      if (!line.trim()) continue;
      const h = JSON.parse(line);
      const k = h.cards.join(',') + (h.yours ? 'y' : 't');
      if (seen.has(k)) continue;
      seen.add(k);
      hands.push(h);
    }
  }
  const used = new Set();           // six-card sets, whichever crib
  const sigDay = new Map();         // rank signature -> last day index used
  const out = [];
  for (let d = 0; d < days; d++) {
    const live = addDays(from, d);
    const wd = dow(live);
    const spec = SPEC[wd];
    const ok = (h, yours) => h.yours === yours && h.gap >= spec.lo && h.gap < spec.hi
      && !used.has(h.cards.join(','))
      && !(sigDay.has(rankSig(h)) && d - sigDay.get(rankSig(h)) < 21);
    // Take flip hands first up to the day's quota, then fill, alternating cribs.
    const picked = [];
    const need = spec.n;
    const cribs = [...Array(need)].map((_, i) => i % 2 === 0);
    let flipsLeft = spec.flips;
    for (const yours of cribs) {
      const wantFlip = flipsLeft > 0;
      let h = hands.find((x) => ok(x, yours) && (!wantFlip || x.flip) && !picked.includes(x));
      if (!h) h = hands.find((x) => ok(x, yours) && !picked.includes(x));
      if (!h) throw new Error(`${live}: pool exhausted (${yours ? 'your' : 'their'} crib, gap ${spec.lo}-${spec.hi})`);
      if (h.flip) flipsLeft--;
      picked.push(h);
      used.add(h.cards.join(','));
      sigDay.set(rankSig(h), d);
    }
    if (flipsLeft > 0) throw new Error(`${live}: only ${spec.flips - flipsLeft} crib-decided hands`);
    // Widest gap first, keeping the your/their alternation by sorting within
    // each crib and re-interleaving.
    const mine = picked.filter((h) => h.yours).sort((a, b) => b.gap - a.gap);
    const theirs = picked.filter((h) => !h.yours).sort((a, b) => b.gap - a.gap);
    const order = [];
    for (let i = 0; i < need; i++) order.push(i % 2 === 0 ? mine.shift() : theirs.shift());
    const [y, m, dd] = live.split('-').map(Number);
    out.push({
      num: d + 1,
      quizId: `crib-${m}-${dd}-${String(y).slice(2)}`,
      live,
      dateLabel: `${MONTHS[m - 1]} ${dd}, ${y}`,
      sunday: wd === 0,
      hands: order.map((h) => ({ cards: h.cards, yours: h.yours, best: h.best, gap: h.gap, flip: h.flip, hand: h.hand, crib: h.crib, value: h.value })),
    });
  }
  return out;
}

const HEADER = `// Puzzle data for Crib, the daily cribbage throw. Imported ONLY by the server
// page (app/crib/page.js), which filters live<=today before handing the bank to
// the client, so tomorrow's hands never reach a browser.
//
// GENERATED by scripts/gen-crib.mjs and checked by scripts/verify-crib.mjs,
// which recomputes every number below with its own scorer. Do not hand edit.
//
// Each day is five hands (seven on the Sunday Edition). A hand:
//   cards   six cards, 0..51: rank = card % 13 (0 ace ... 12 king),
//           suit = floor(card / 13) (clubs, diamonds, hearts, spades)
//   yours   true when the crib is yours, false when it is your opponent's;
//           the day alternates, starting with yours
//   hand    for each of the fifteen throws (lib/crib-core.js THROWS order:
//           card pairs i<j, lexicographic), the points the four kept cards
//           average over all 46 cut cards
//   crib    the crib's average for that throw, over every cut card and every
//           pair of the 45 cards the opponent might throw, equally weighted
//   value   hand + crib when the crib is yours, hand - crib when it is theirs
//   best    the throw with the highest value (unique: see gap)
//   gap     how far the best value beats the second best; the difficulty
//           dial, narrowing through the week (see the ramp in the generator)
//   flip    true when the throw that keeps the best four cards is NOT the best
//           throw once the crib is counted
// Scoring: 2 points for the best throw, 1 for a throw within 0.75 of it.
// Values are rounded to three places; the verifier allows 0.0015.
`;

const isMain = process.argv[1] && fileURLToPath(import.meta.url) === fs.realpathSync(process.argv[1]);
if (isMain) {
  const [mode, ...args] = process.argv.slice(2);
  if (mode === 'pool') pool(Number(args[0]), Number(args[1]), args[2]);
  else if (mode === 'bank') {
    const b = bank(args[0], Number(args[1]), args.slice(2));
    const body = b.map((p) => '  ' + JSON.stringify(p)).join(',\n');
    process.stdout.write(`${HEADER}export const PUZZLES = [\n${body},\n];\n`);
  } else {
    console.error('usage: gen-crib.mjs pool <seed> <count> <out> | bank <from> <days> <pool...>');
    process.exit(1);
  }
}
