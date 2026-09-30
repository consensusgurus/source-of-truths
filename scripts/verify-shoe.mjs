// Verify the Shoe (daily blackjack) bank.
//
// app/shoe/puzzles.js promises, per board:
//   - the shoe is exactly what its banked `seed` deals, at the size its era
//     demands (from 2026-09-30: 10 hands off a 72-card cut of TWO decks on a
//     weekday, 14 hands off the whole 104-card double deck on Sunday; before
//     that, single-deck: 5 hands off 36 cards, 7 off the whole 52), every card
//     from a standard deck and no code more often than the decks allow;
//   - `par` is basic strategy played blind on that shoe — and the banked par
//     LINE (app/shoe/proofs.js) is the book line decision for decision, not
//     merely some line that happens to reach the same chips;
//   - `ace` is a REAL blind playout (the best of the generator's runs), whose
//     banked line replays to exactly the claimed chips;
//   - `ceiling` is the EXACT clairvoyant maximum over every legal line;
//   - every legal line of play — every hit chain, every double, every dealer
//     draw — fits inside the shoe, so no player can run the day out of cards.
//
// None of that is taken on trust, and per the Cages rule the generator and
// this verifier do NOT share solvers:
//   - par is recomputed against an INDEPENDENT basic-strategy table, typed
//     here as literal matrices off the published S17 chart rather than the
//     rule-form conditionals in app/shoe/rules.js;
//   - the ceiling is recomputed with this file's own exhaustive search, and
//     must match the banked number EXACTLY (the search is exact, so unlike
//     Hands' annealed ceilings there is no tolerance);
//   - the consumption bound falls out of that same search, which walks every
//     reachable state and hard-fails on any overrun.
//
// The proof REPLAYS go through the real engine (app/shoe/rules.js `replay`),
// because that engine IS the live game: a rules change that silently
// invalidated the bank fails here rather than ships.
//
// Also checked: num/quizId/live/dateLabel consistency, consecutive dates with
// no gaps, `sunday` true exactly on real Sundays with that era's Edition
// config, the ten-point scale landing on 8 at par / 10 at ace / 1 at
// the worst possible day, par < ace <= ceiling with the generator's gap
// floors, no duplicate shoes, no repeated opening four cards, and bank runway.
//
// Run: node scripts/verify-shoe.mjs
import { PUZZLES } from '../app/shoe/puzzles.js';
import { PROOFS } from '../app/shoe/proofs.js';
import {
  STAKE, NATURAL_PAY, shoeFor, replay, handTotal, isNatural,
  rankOf, suitOf, scoreForPoints, worstChips,
} from '../app/shoe/rules.js';

let BAD = 0;
const fail = (id, msg) => { BAD++; console.error(`✗ ${id}: ${msg}`); };
const ok = (id, msg) => console.log(`✓ ${id}  ${msg}`);
const note = (id, msg) => console.log(`… ${id}  ${msg}`);

// Two eras. Boards before TEN_HANDS_FROM are played and frozen, so they are
// checked against the single-deck rule they shipped under; everything from
// that date must carry the ten-hand, two-deck config (owner rule 2026-09-29:
// at least ten hands a day).
const TEN_HANDS_FROM = '2026-09-30';
const ERA = {
  single: { WEEKDAY: { hands: 5, shoe: 36, decks: 1 }, SUNDAY: { hands: 7, shoe: 52, decks: 1 } },
  ten: { WEEKDAY: { hands: 10, shoe: 72, decks: 2 }, SUNDAY: { hands: 14, shoe: 104, decks: 2 } },
};
const MIN_HANDS_FROM_TEN = 10;
const ACE_GAP_WEEK = 25, ACE_GAP_SUN = 30, CEIL_GAP = 40;

// ─── independent basic strategy ─────────────────────────────────────────────
// Typed straight off the published multi-deck S17 chart (double any two, no
// splits, no surrender) as lookup matrices — deliberately a different shape
// from the engine's conditionals, so a transcription slip in either shows up.
// Index: dealer up 2..11 (11 = ace). H hit, S stand, D double-else-hit,
// T double-else-stand.
const HARD = {
  //      2    3    4    5    6    7    8    9   10    A
  4:  ['H', 'H', 'H', 'H', 'H', 'H', 'H', 'H', 'H', 'H'],
  5:  ['H', 'H', 'H', 'H', 'H', 'H', 'H', 'H', 'H', 'H'],
  6:  ['H', 'H', 'H', 'H', 'H', 'H', 'H', 'H', 'H', 'H'],
  7:  ['H', 'H', 'H', 'H', 'H', 'H', 'H', 'H', 'H', 'H'],
  8:  ['H', 'H', 'H', 'H', 'H', 'H', 'H', 'H', 'H', 'H'],
  9:  ['H', 'D', 'D', 'D', 'D', 'H', 'H', 'H', 'H', 'H'],
  10: ['D', 'D', 'D', 'D', 'D', 'D', 'D', 'D', 'H', 'H'],
  11: ['D', 'D', 'D', 'D', 'D', 'D', 'D', 'D', 'D', 'H'], // S17: hit 11 vs ace
  12: ['H', 'H', 'S', 'S', 'S', 'H', 'H', 'H', 'H', 'H'],
  13: ['S', 'S', 'S', 'S', 'S', 'H', 'H', 'H', 'H', 'H'],
  14: ['S', 'S', 'S', 'S', 'S', 'H', 'H', 'H', 'H', 'H'],
  15: ['S', 'S', 'S', 'S', 'S', 'H', 'H', 'H', 'H', 'H'],
  16: ['S', 'S', 'S', 'S', 'S', 'H', 'H', 'H', 'H', 'H'],
  17: ['S', 'S', 'S', 'S', 'S', 'S', 'S', 'S', 'S', 'S'],
  18: ['S', 'S', 'S', 'S', 'S', 'S', 'S', 'S', 'S', 'S'],
  19: ['S', 'S', 'S', 'S', 'S', 'S', 'S', 'S', 'S', 'S'],
  20: ['S', 'S', 'S', 'S', 'S', 'S', 'S', 'S', 'S', 'S'],
  21: ['S', 'S', 'S', 'S', 'S', 'S', 'S', 'S', 'S', 'S'],
};
const SOFT = {
  //      2    3    4    5    6    7    8    9   10    A
  13: ['H', 'H', 'H', 'D', 'D', 'H', 'H', 'H', 'H', 'H'],
  14: ['H', 'H', 'H', 'D', 'D', 'H', 'H', 'H', 'H', 'H'],
  15: ['H', 'H', 'D', 'D', 'D', 'H', 'H', 'H', 'H', 'H'],
  16: ['H', 'H', 'D', 'D', 'D', 'H', 'H', 'H', 'H', 'H'],
  17: ['H', 'D', 'D', 'D', 'D', 'H', 'H', 'H', 'H', 'H'],
  18: ['S', 'T', 'T', 'T', 'T', 'S', 'S', 'H', 'H', 'H'],
  19: ['S', 'S', 'S', 'S', 'S', 'S', 'S', 'S', 'S', 'S'],
  20: ['S', 'S', 'S', 'S', 'S', 'S', 'S', 'S', 'S', 'S'],
  21: ['S', 'S', 'S', 'S', 'S', 'S', 'S', 'S', 'S', 'S'],
};
function bookAction(playerCards, dealerUp, canDouble) {
  const { total, soft } = handTotal(playerCards);
  const upRank = rankOf(dealerUp);
  const up = upRank === 14 ? 11 : Math.min(10, upRank);
  const row = soft ? SOFT[total] : HARD[total];
  if (!row) return 'H';
  const cell = row[up - 2];
  if (cell === 'D') return canDouble ? 'D' : 'H';
  if (cell === 'T') return canDouble ? 'D' : 'S';
  return cell;
}

// ─── independent exact ceiling + consumption proof ──────────────────────────
// Same claim as the generator's search, different code: memo keyed as a
// string map over "h:pos", explicit worklist of in-hand card stacks, and its
// own dealer playout. Exact, so the banked ceiling must match to the chip.
function exactCeiling(shoe, nHands) {
  const memo = Object.create(null);
  let overrun = false;

  const dealerOut = (dealer, pos) => {
    const d = dealer.slice();
    let q = pos;
    while (handTotal(d).total < 17) {
      if (q >= shoe.length) { overrun = true; return null; }
      d.push(shoe[q++]);
    }
    return { dt: handTotal(d).total, q };
  };

  const solve = (h, pos) => {
    if (h === nHands) return 0;
    const key = `${h}:${pos}`;
    if (key in memo) return memo[key];
    if (pos + 4 > shoe.length) { overrun = true; return 0; }
    const p0 = [shoe[pos], shoe[pos + 2]];
    const d0 = [shoe[pos + 1], shoe[pos + 3]];
    const start = pos + 4;
    let best = -Infinity;
    const consider = (v) => { if (v != null && v > best) best = v; };

    if (isNatural(d0) || isNatural(p0)) {
      const net = isNatural(d0) && isNatural(p0) ? 0 : isNatural(d0) ? -STAKE : NATURAL_PAY;
      consider(net + solve(h + 1, start));
    } else {
      // worklist of undecided in-hand states: [cards, pos, stake, canDouble]
      const stack = [[p0, start, STAKE, true]];
      while (stack.length) {
        const [cards, at, stake, canD] = stack.pop();
        const t = handTotal(cards).total;
        if (t > 21) { consider(-stake + solve(h + 1, at)); continue; }
        if (t < 21) {
          // hit
          if (at >= shoe.length) { overrun = true; break; }
          stack.push([cards.concat(shoe[at]), at + 1, stake, false]);
          // double: one card then done, win or lose twice the stake
          if (canD) {
            const c2 = cards.concat(shoe[at]);
            if (handTotal(c2).total > 21) consider(-2 * STAKE + solve(h + 1, at + 1));
            else {
              const dOut = dealerOut(d0, at + 1);
              if (dOut) {
                const pt = handTotal(c2).total;
                const net = dOut.dt > 21 ? 2 * STAKE : pt > dOut.dt ? 2 * STAKE : pt < dOut.dt ? -2 * STAKE : 0;
                consider(net + solve(h + 1, dOut.q));
              }
            }
          }
        }
        // stand (forced at 21)
        const dOut = dealerOut(d0, at);
        if (dOut) {
          const net = dOut.dt > 21 ? stake : t > dOut.dt ? stake : t < dOut.dt ? -stake : 0;
          consider(net + solve(h + 1, dOut.q));
        }
      }
    }
    memo[key] = best;
    return best;
  };

  const best = solve(0, 0);
  return { best, overrun };
}

// ─── per board ──────────────────────────────────────────────────────────────
const seenShoes = new Map();
const seenOpenings = new Map();
let prevLive = null;

PUZZLES.forEach((p, i) => {
  const errs = [];

  // -- identity and the calendar --
  if (p.num !== i + 1) errs.push(`num ${p.num} != ${i + 1}`);
  const m = /^shoe-(\d+)-(\d+)-(\d+)$/.exec(p.quizId || '');
  if (!m) errs.push('bad quizId');
  else {
    const iso = `20${m[3]}-${String(m[1]).padStart(2, '0')}-${String(m[2]).padStart(2, '0')}`;
    if (iso !== p.live) errs.push(`live ${p.live} != quizId date ${iso}`);
  }
  const wantLabel = p.live ? new Date(`${p.live}T12:00:00Z`).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric', timeZone: 'UTC' }) : null;
  if (wantLabel && p.dateLabel !== wantLabel) errs.push(`dateLabel "${p.dateLabel}" != "${wantLabel}"`);
  if (prevLive) {
    const want = new Date(`${prevLive}T12:00:00Z`);
    want.setUTCDate(want.getUTCDate() + 1);
    if (want.toISOString().slice(0, 10) !== p.live) errs.push(`live ${p.live} does not follow ${prevLive} — a gap in the bank strands a day with no puzzle`);
  }
  prevLive = p.live;
  const isSun = new Date(`${p.live}T12:00:00Z`).getUTCDay() === 0;
  if (!!p.sunday !== isSun) errs.push(`sunday flag ${p.sunday} but ${p.live} ${isSun ? 'IS' : 'is not'} a Sunday`);

  // -- the Sunday Edition scaling, proven per board --
  const era = p.live >= TEN_HANDS_FROM ? ERA.ten : ERA.single;
  const cfg = p.sunday ? era.SUNDAY : era.WEEKDAY;
  if (p.hands !== cfg.hands) errs.push(`hands ${p.hands}, want ${cfg.hands}`);
  if (p.live >= TEN_HANDS_FROM && !(p.hands >= MIN_HANDS_FROM_TEN)) errs.push(`only ${p.hands} hands; every day from ${TEN_HANDS_FROM} deals at least ${MIN_HANDS_FROM_TEN}`);
  if ((p.decks || 1) !== cfg.decks) errs.push(`decks ${p.decks || 1}, want ${cfg.decks}`);
  if (!Array.isArray(p.shoe) || p.shoe.length !== cfg.shoe) errs.push(`shoe holds ${p.shoe ? p.shoe.length : 0} cards, want ${cfg.shoe}`);

  // -- the shoe itself --
  if (Array.isArray(p.shoe)) {
    const counts = new Map();
    for (const c of p.shoe) counts.set(c, (counts.get(c) || 0) + 1);
    for (const [c, k] of counts) if (k > cfg.decks) errs.push(`card ${c} appears ${k} times in a ${cfg.decks}-deck shoe`);
    if (cfg.shoe === 52 * cfg.decks && counts.size !== 52) errs.push(`a whole-shoe Sunday must hold all 52 codes, holds ${counts.size}`);
    for (const c of p.shoe) {
      const r = rankOf(c), s = suitOf(c);
      if (r < 2 || r > 14 || s < 0 || s > 3) errs.push(`card ${c} is outside a standard deck`);
    }
    if (typeof p.seed === 'number') {
      if (shoeFor(p.seed, cfg.shoe, cfg.decks).join(',') !== p.shoe.join(',')) errs.push('shoe does not match what its own seed deals');
    } else errs.push('missing seed');
  }

  // -- par: the banked line must BE the book, decision for decision --
  const proof = PROOFS[p.quizId];
  if (!proof || !Array.isArray(proof.par) || !Array.isArray(proof.ace)) errs.push('no playout proof in app/shoe/proofs.js');
  if (!errs.length && proof) {
    // replay the banked par line through the real engine
    const rp = replay(p.shoe, p.hands, proof.par);
    if (rp.invalid) errs.push('par line is not a legal round');
    else {
      if (rp.phase !== 'over') errs.push('par line leaves the day unfinished');
      if (rp.chips !== p.par) errs.push(`par line banks ${rp.chips}, but the bank claims ${p.par}`);
    }
    // and independently re-derive the book line with THIS file's tables
    const acts = [];
    let independentOk = true;
    for (let h = 0; h < p.hands && independentOk; h++) {
      acts.push('');
      for (;;) {
        const r = replay(p.shoe, p.hands, acts);
        if (r.invalid) { errs.push('independent book replay went invalid — engine disagreement'); independentOk = false; break; }
        if (r.phase !== 'act') break;
        const rec = r.hands[r.hands.length - 1];
        acts[h] += bookAction(rec.p, rec.d[0], rec.p.length === 2);
      }
    }
    if (independentOk) {
      const same = acts.length === proof.par.length && acts.every((s, k) => s === proof.par[k]);
      if (!same) errs.push(`banked par line ${JSON.stringify(proof.par)} is not the book line ${JSON.stringify(acts)} — the independent strategy table disagrees`);
      const rb = replay(p.shoe, p.hands, acts);
      if (!rb.invalid && rb.chips !== p.par) errs.push(`independent book line banks ${rb.chips}, bank claims ${p.par}`);
    }
    // -- ace: a real, legal blind round reaching exactly the claim --
    const ra = replay(p.shoe, p.hands, proof.ace);
    if (ra.invalid) errs.push('ace line is not a legal round');
    else {
      if (ra.phase !== 'over') errs.push('ace line leaves the day unfinished');
      if (ra.chips !== p.ace) errs.push(`ace line banks ${ra.chips}, but the bank claims ${p.ace}`);
    }
  }

  // -- ceiling: exact, and every legal line fits the shoe --
  if (!errs.length) {
    const { best, overrun } = exactCeiling(p.shoe, p.hands);
    if (overrun) errs.push('a legal line of play runs the shoe out of cards — the consumption bound is broken');
    else if (best !== p.ceiling) errs.push(`independent exact search puts the ceiling at ${best}, bank claims ${p.ceiling}`);
  }

  // -- anchors and the ten point scale --
  if (!(p.par < p.ace)) errs.push(`par ${p.par} is not under ace ${p.ace}`);
  if (!(p.ace <= p.ceiling)) errs.push(`ace ${p.ace} is above the ceiling ${p.ceiling}`);
  if (p.ace - p.par < (p.sunday ? ACE_GAP_SUN : ACE_GAP_WEEK)) errs.push(`ace clears par by only ${p.ace - p.par}, under the ${p.sunday ? ACE_GAP_SUN : ACE_GAP_WEEK} floor`);
  if (p.ceiling - p.par < CEIL_GAP) errs.push(`ceiling clears par by only ${p.ceiling - p.par}, under the ${CEIL_GAP} floor`);
  if (scoreForPoints(p.par, p.par, p.ace, p.hands) !== 8) errs.push('par does not score 8');
  if (scoreForPoints(p.ace, p.par, p.ace, p.hands) !== 10) errs.push('ace does not score 10');
  if (scoreForPoints(worstChips(p.hands), p.par, p.ace, p.hands) !== 1) errs.push('the worst possible day does not floor at 1');

  // -- pool bookkeeping --
  if (Array.isArray(p.shoe)) {
    const key = p.shoe.join(',');
    seenShoes.set(key, (seenShoes.get(key) || []).concat(p.quizId));
    const open = p.shoe.slice(0, 4).join(',');
    seenOpenings.set(open, (seenOpenings.get(open) || []).concat(p.quizId));
  }

  errs.length
    ? fail(p.quizId, errs.join('; '))
    : ok(p.quizId, `${p.sunday ? 'Sunday, ' : ''}par ${p.par} is the book to the move, ace ${p.ace} replays, ceiling ${p.ceiling} exact`);
});

for (const [, ids] of seenShoes) {
  if (ids.length > 1) fail('shoe pool', `identical shoe shipped on ${ids.length} boards: ${ids.join(', ')}`);
}
for (const [open, ids] of seenOpenings) {
  if (ids.length > 1) fail('shoe pool', `opening deal "${open}" repeats on ${ids.join(', ')}`);
}
for (const id of Object.keys(PROOFS)) {
  if (!PUZZLES.some((p) => p.quizId === id)) fail('shoe pool', `proofs.js carries ${id}, which is not in the bank`);
}

// ─── bank-wide shape and runway ─────────────────────────────────────────────
const pars = PUZZLES.map((p) => p.par).sort((a, b) => a - b);
const sundays = PUZZLES.filter((p) => p.sunday).length;
if (!BAD) {
  ok('shoe pool', `${PUZZLES.length} boards (${sundays} Sunday Editions), all shoes distinct, par ${pars[0]}..${pars[pars.length - 1]}`);
  const last = PUZZLES[PUZZLES.length - 1].live;
  const today = new Date().toLocaleDateString('en-CA', { timeZone: 'America/New_York' });
  const daysLeft = Math.round((new Date(`${last}T12:00:00Z`) - new Date(`${today}T12:00:00Z`)) / 86400000);
  if (daysLeft < 14) fail('shoe pool', `bank runs out ${last} — ${daysLeft} day(s) of runway left, extend it`);
  else note('shoe pool', `bank runs through ${last} (${daysLeft} days of runway)`);
}

console.log(BAD ? `\n${BAD} FAILURE(S)` : '\nAll Shoe boards verified.');
process.exit(BAD ? 1 : 0);
