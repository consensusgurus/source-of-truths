#!/usr/bin/env node
// Generate the Shoe bank: seeded daily shoes with proven par / ace / ceiling.
//
//   node scripts/gen-shoe.mjs [--from 2026-09-30] [--days 51] [--startnum 41]
//                             [--seed 600000] [--keep]
//
// Writes app/shoe/puzzles.js and app/shoe/proofs.js. With --keep, every board
// already banked BEFORE --from (and its proof) is carried over byte for byte and
// the new deal is appended after it: played boards are frozen, so a bank
// extension or a format change must never regenerate them. --startnum must then
// be the next number after the last kept board. Every number banked is a
// PLAYOUT or an EXACT search, never an estimate:
//
//   par      the chips basic strategy (the book line for these exact rules,
//            played blind) banks on this shoe. Deterministic. Scores 8.
//   ace      the best bank of ACE_RUNS blind runs: each run follows the book
//            but deviates at random EPS of the time, exactly the Hands model
//            of "a blind player on a great day". Its full decision line is
//            banked in proofs.js so the verifier can replay it. Scores 10.
//            ACE_RUNS is kept SMALL on purpose: the decision space here is
//            tiny, and at 600 runs the explorer found the exact clairvoyant
//            ceiling on most weekday boards, which made 10 unreachable for a
//            person. At 120 runs the best is a lucky blind day, which is what
//            the anchor means.
//   ceiling  the EXACT clairvoyant maximum, by exhaustive search over every
//            legal decision sequence (memoized on hand index + shoe position,
//            which fully determines the future). A footnote on the page, never
//            a scoring anchor — nobody plays blind and hits it.
//
// A shoe is ACCEPTED only when:
//   - every legal line of play fits inside it (the ceiling search doubles as
//     the worst-case consumption proof: it walks every reachable state, and an
//     overrun anywhere rejects the shoe);
//   - par sits in a playable band (PAR_MIN..PAR_MAX);
//   - ace clears par by ACE_GAP so the 8..10 band has room;
//   - ceiling clears par by CEIL_GAP so there is real skill headroom;
//   - its opening four cards (the first thing every player sees) repeat
//     nowhere else in the bank.
//
// Weekdays: 10 hands off a 72-card cut of a two-deck shoe (32 cards never in
// play). Sunday Edition: 14 hands off the ENTIRE 104-card double deck — the
// whole shoe is the twist, because a perfect counter then knows exactly what is
// left. (Owner ruling 2026-09-29: at least ten hands a day. One deck cannot hold
// that, since the worst legal line of a ten-hand day needs 52 to 67 cards, so
// the shoe went to two decks and Sunday kept its 1.4x step, 14 against 10.)
// Boards before 2026-09-30 were single-deck, 5 hands off 36 cards and 7 off 52;
// they are frozen and never regenerated.
import { writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import {
  STAKE, NATURAL_PAY, shoeFor, replay, playPolicy, basicAction, handTotal,
  isNatural, mulberry32, scoreForPoints, worstChips,
} from '../app/shoe/rules.js';

const args = process.argv.slice(2);
const argOf = (k, dflt) => { const i = args.indexOf(k); return i >= 0 ? args[i + 1] : dflt; };
const FROM = argOf('--from', '2026-08-22');
const DAYS = Number(argOf('--days', '90'));
const STARTNUM = Number(argOf('--startnum', '1'));
const SEED0 = Number(argOf('--seed', '600000'));
const KEEP = args.includes('--keep');

const WEEKDAY = { hands: 10, shoe: 72, decks: 2 };
const SUNDAY = { hands: 14, shoe: 104, decks: 2 };
const ACE_RUNS = 120;  // few enough that the best run is a lucky day, not the exact maximum
const EPS = 0.25;
const PAR_MIN = -10;   // the book may lose one stake, never suffer a rout
const PAR_MAX = 55;
const ACE_GAP = 25;   // ace must clear par by this much (30 on Sunday)
const CEIL_GAP = 40;  // ceiling must clear par by this much

// ---- exact clairvoyant search (also the consumption proof) -----------------
// Returns { best, overrun } — best chips over every legal decision sequence,
// or overrun=true if ANY legal line (player or dealer draw) would run off the
// end of the shoe, which rejects the shoe outright.
function ceilingOf(shoe, nHands) {
  const memo = new Map();
  let overrun = false;
  const need = (i) => { if (i >= shoe.length) { overrun = true; return false; } return true; };

  function fromHand(h, pos) {
    if (overrun) return 0;
    if (h === nHands) return 0;
    const key = h * 256 + pos; // pos < 256 for any shoe up to four decks
    if (memo.has(key)) return memo.get(key);
    if (pos + 4 > shoe.length) { overrun = true; return 0; }
    const p = [shoe[pos], shoe[pos + 2]];
    const d = [shoe[pos + 1], shoe[pos + 3]];
    const base = pos + 4;
    let best = -Infinity;

    const settleStand = (cards, pos2, stake) => {
      let dd = d.slice(); let q = pos2;
      while (handTotal(dd).total < 17) { if (!need(q)) return -Infinity; dd = dd.concat(shoe[q++]); }
      const pt = handTotal(cards).total, dt = handTotal(dd).total;
      const net = dt > 21 ? stake : pt > dt ? stake : pt < dt ? -stake : 0;
      return net + fromHand(h + 1, q);
    };

    if (isNatural(d) || isNatural(p)) {
      const net = isNatural(d) && isNatural(p) ? 0 : isNatural(d) ? -STAKE : NATURAL_PAY;
      best = net + fromHand(h + 1, base);
    } else {
      const rec = (cards, pos2, stake, canD) => {
        if (overrun) return;
        const t = handTotal(cards).total;
        if (t > 21) { best = Math.max(best, -stake + fromHand(h + 1, pos2)); return; }
        if (t === 21) { best = Math.max(best, settleStand(cards, pos2, stake)); return; }
        best = Math.max(best, settleStand(cards, pos2, stake));       // stand
        if (need(pos2)) rec(cards.concat(shoe[pos2]), pos2 + 1, stake, false); // hit
        if (canD && need(pos2)) {                                      // double
          const c2 = cards.concat(shoe[pos2]);
          if (handTotal(c2).total > 21) best = Math.max(best, -(2 * STAKE) + fromHand(h + 1, pos2 + 1));
          else best = Math.max(best, settleStand(c2, pos2 + 1, 2 * STAKE));
        }
      };
      rec(p, base, STAKE, true);
    }
    memo.set(key, best);
    return best;
  }

  const best = fromHand(0, 0);
  return { best, overrun };
}

// ---- the blind explorer (ace) ---------------------------------------------
function aceOf(shoe, nHands, seed) {
  let best = -Infinity, bestActs = null;
  for (let run = 0; run < ACE_RUNS; run++) {
    const rng = mulberry32(((seed ^ Math.imul(run + 1, 2654435761)) >>> 0) || 1);
    const decide = (p, up, canD) => {
      if (rng() < EPS) {
        const legal = canD ? ['H', 'S', 'D'] : ['H', 'S'];
        return legal[Math.floor(rng() * legal.length)];
      }
      return basicAction(p, up, canD);
    };
    const r = playPolicy(shoe, nHands, decide);
    if (r.invalid) continue;
    if (r.chips > best) { best = r.chips; bestActs = r.acts; }
  }
  return { best, acts: bestActs };
}

// ---- dates -----------------------------------------------------------------
function* dates(fromISO, days) {
  const d = new Date(`${fromISO}T12:00:00Z`);
  for (let i = 0; i < days; i++) {
    const iso = d.toISOString().slice(0, 10);
    yield { iso, sunday: d.getUTCDay() === 0 };
    d.setUTCDate(d.getUTCDate() + 1);
  }
}
const labelOf = (iso) => new Date(`${iso}T12:00:00Z`).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric', timeZone: 'UTC' });
const quizIdOf = (iso) => {
  const [y, m, d] = iso.split('-').map(Number);
  return `shoe-${m}-${d}-${String(y).slice(2)}`;
};

// ---- generate --------------------------------------------------------------
const boards = [];
const proofs = {};
const openings = new Set();
let seedScan = SEED0;
let rejected = { overrun: 0, par: 0, ace: 0, ceil: 0, open: 0 };

// ---- carry the frozen past over untouched ---------------------------------
const here0 = dirname(fileURLToPath(import.meta.url));
if (KEEP) {
  const { PUZZLES: OLD } = await import('../app/shoe/puzzles.js');
  const { PROOFS: OLDP } = await import('../app/shoe/proofs.js');
  for (const b of OLD) {
    if (b.live >= FROM) continue;
    boards.push(b);
    proofs[b.quizId] = OLDP[b.quizId];
    openings.add(b.shoe.slice(0, 4).join(','));
    if (b.seed >= seedScan) throw new Error(`kept board ${b.quizId} used seed ${b.seed}; pass --seed above it`);
  }
  const lastNum = boards.length ? boards[boards.length - 1].num : 0;
  if (lastNum + 1 !== STARTNUM) throw new Error(`--startnum ${STARTNUM}, but the last kept board is #${lastNum}`);
  void here0; void existsSync;
}

let num = STARTNUM;
for (const { iso, sunday } of dates(FROM, DAYS)) {
  const cfg = sunday ? SUNDAY : WEEKDAY;
  for (;;) {
    const seed = seedScan++;
    const shoe = shoeFor(seed, cfg.shoe, cfg.decks);
    const { best: ceiling, overrun } = ceilingOf(shoe, cfg.hands);
    if (overrun) { rejected.overrun++; continue; }
    const parRun = playPolicy(shoe, cfg.hands, basicAction);
    if (parRun.invalid) { rejected.overrun++; continue; }
    const par = parRun.chips;
    if (par < PAR_MIN || par > PAR_MAX) { rejected.par++; continue; }
    if (ceiling - par < CEIL_GAP) { rejected.ceil++; continue; }
    const { best: ace, acts: aceActs } = aceOf(shoe, cfg.hands, seed);
    if (!aceActs || ace - par < (sunday ? 30 : ACE_GAP)) { rejected.ace++; continue; }
    if (ace > ceiling) throw new Error(`ace ${ace} above exact ceiling ${ceiling} — engine bug`);
    const open = shoe.slice(0, 4).join(',');
    if (openings.has(open)) { rejected.open++; continue; }
    openings.add(open);

    // sanity: the scale lands where it must
    if (scoreForPoints(par, par, ace, cfg.hands) !== 8) throw new Error('par !== 8pt');
    if (scoreForPoints(ace, par, ace, cfg.hands) !== 10) throw new Error('ace !== 10pt');
    if (scoreForPoints(worstChips(cfg.hands), par, ace, cfg.hands) !== 1) throw new Error('worst !== 1pt');

    const quizId = quizIdOf(iso);
    boards.push({
      num, quizId, live: iso, dateLabel: labelOf(iso), sunday,
      seed, decks: cfg.decks, hands: cfg.hands, shoe, par, ace, ceiling,
    });
    proofs[quizId] = { par: parRun.acts, ace: aceActs };
    break;
  }
  num++;
}

// ---- write -----------------------------------------------------------------
const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, '..');
mkdirSync(join(root, 'app/shoe'), { recursive: true });

const puzzlesHeader = `// Puzzle data for Shoe, the daily blackjack shoe. Imported ONLY by the server
// page (app/shoe/page.js), which filters live<=today before handing the bank
// to the client, so tomorrow's shoe never reaches a browser.
//
// From 2026-09-30 a weekday is TEN hands of blackjack off a 72-card shoe (the
// top 72 of a seeded two-deck shuffle, so 32 cards never come into play) and
// the Sunday Edition is FOURTEEN hands off the ENTIRE 104-card double deck,
// which is what makes a perfect count possible there. \`decks: 2\` marks those
// boards. Boards before that date carry no \`decks\` field and are single-deck:
// five hands off a 36-card cut, seven off the whole 52 on Sunday. They are
// frozen. A two-deck shoe holds every card code twice. Card code = rank * 4 + suit, rank 2..14
// (14 = ace), suit 0..3 (spades, hearts, diamonds, clubs) — the Hands
// convention. Rules live in app/shoe/rules.js and are deliberately small:
// dealer peeks and stands on all 17s, blackjack pays 3:2 (+15 on the 10-chip
// stake), double on any first two cards, no splits, 21 stands itself, a
// player bust ends the hand with no dealer draw.
//
//   par      the chips BASIC STRATEGY banks on this exact shoe, played blind.
//            Deterministic, replayed move-for-move by the verifier. Scores 8.
//   ace      the best bank of 120 blind runs (the book line with random
//            deviations — a blind player on a great day). A REAL playout,
//            banked as a decision line in app/shoe/proofs.js. Scores 10.
//   ceiling  the EXACT clairvoyant maximum over every legal line, by
//            exhaustive search. A footnote on the page, never a target:
//            nobody plays blind and hits it.
//   seed     the generator seed; the shoe is reproducible from it.
//
// Do NOT hand-edit a board here. Regenerate with scripts/gen-shoe.mjs and
// re-run scripts/verify-shoe.mjs (which recomputes par with its own strategy
// table and the ceiling with its own search — nothing is taken on trust).
export const PUZZLES = [
`;
const rows = boards.map((b) => `  ${JSON.stringify(b)},`).join('\n');
writeFileSync(join(root, 'app/shoe/puzzles.js'), `${puzzlesHeader}${rows}\n];\n`);

const proofsHeader = `// Shoe — the playout proofs behind every banked par and ace.
//
// Par and ace are not formulas. Par is basic strategy played blind on the
// day's shoe, and ace is the best of 120 blind runs — and these are the actual
// decision lines, one string of H / S / D per hand in the order the decisions
// were made (a hand settled by a natural has the empty string).
//
// This file exists so scripts/verify-shoe.mjs can replay both claims through
// the real rules engine (app/shoe/rules.js) rather than trusting a number in
// the bank. It is deliberately SEPARATE from puzzles.js and imported by
// nothing the browser loads, because the ace line is an excellent round on a
// live shoe and shipping it would hand today's players a solution.
export const PROOFS = {
`;
const proofRows = Object.entries(proofs).map(([k, v]) => `  '${k}': { par: ${JSON.stringify(v.par)}, ace: ${JSON.stringify(v.ace)} },`).join('\n');
writeFileSync(join(root, 'app/shoe/proofs.js'), `${proofsHeader}${proofRows}\n};\n`);

const pars = boards.map((b) => b.par);
const aces = boards.map((b) => b.ace);
console.log(`wrote ${boards.length} boards (${boards.filter((b) => b.sunday).length} Sundays), seeds ${boards[0].seed}..${boards[boards.length - 1].seed}`);
console.log(`par ${Math.min(...pars)}..${Math.max(...pars)}, ace ${Math.min(...aces)}..${Math.max(...aces)}, rejected ${JSON.stringify(rejected)}`);
