// Shoe — the rules engine, shared by the live game (ShoeClient), the bank
// generator (scripts/gen-shoe.mjs) and the bank verifier (scripts/verify-shoe.mjs),
// so none of them can drift from the others.
//
// Card code = rank * 4 + suit, exactly the Hands convention: rank 2..14 with 14
// the ace, suit 0..3 in the order spades, hearts, diamonds, clubs.
//
// THE GAME. One fixed shoe per day, the same cards in the same order for every
// player. From 2026-09-30 a weekday shoe is the top 72 cards of two shuffled
// standard decks (32 cards never come into play) and plays TEN hands; the
// Sunday Edition deals the ENTIRE 104-card double deck over FOURTEEN hands,
// which is what makes a perfect count possible there. Every hand is staked at
// 10 chips. (Boards before that date were single-deck: five hands off a
// 36-card cut, seven on Sunday off the whole 52. They are frozen and replay
// exactly as they shipped; the engine reads the size off each board.)
//
// THE RULES, in full (they are deliberately small):
//   - Deal order per hand: player, dealer up-card, player, dealer hole card.
//   - The dealer PEEKS: a dealer natural settles the hand before any decision
//     (you lose the stake, or push if you also hold a natural). A player
//     natural pays 15 (3 chips to 2) and settles immediately.
//   - Player actions: HIT, STAND, or DOUBLE. Double is allowed only on the
//     first two cards: the stake becomes 20 and exactly one card arrives.
//     No splits, no insurance, no surrender.
//   - A hand standing at exactly 21 stands itself: the game auto-stands, so
//     nobody can bust a made 21 by mistake.
//   - The dealer stands on ALL 17s (soft included) and draws to 16.
//   - If the player busts, the hand is over: the dealer reveals the hole card
//     but draws nothing, so a bust never changes what the next hand is dealt
//     beyond the cards already out.
//   - Win pays the stake, loss costs it, a tie pushes. The bank can go
//     negative; the floor is losing a doubled stake on every hand.
//
// Everything the engine does is a pure function of (shoe, hand count, the
// decision strings), which is what makes a saved game replayable and a banked
// proof verifiable: `replay` below IS the game.

export const STAKE = 10;
export const NATURAL_PAY = 15; // 3:2 on a 10-chip stake

export const RANK_LABEL = ['', '', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A'];
export const SUIT_PIP = ['♠', '♥', '♦', '♣'];
export const SUIT_NAME = ['spades', 'hearts', 'diamonds', 'clubs'];

export const rankOf = (c) => c >> 2;
export const suitOf = (c) => c & 3;
export const isRed = (c) => (c & 3) === 1 || (c & 3) === 2;
export const cardName = (c) => `${RANK_LABEL[rankOf(c)]} of ${SUIT_NAME[suitOf(c)]}`;

// Blackjack value of one card: ace counts 11 here and is downgraded by
// handTotal when it must play low.
const cardVal = (c) => {
  const r = rankOf(c);
  if (r === 14) return 11;
  return r > 10 ? 10 : r;
};

// Total and softness of a hand. `soft` means an ace is currently counting 11.
export function handTotal(cards) {
  let t = 0, aces = 0;
  for (const c of cards) { t += cardVal(c); if (rankOf(c) === 14) aces++; }
  while (t > 21 && aces > 0) { t -= 10; aces--; }
  return { total: t, soft: aces > 0 };
}

export const isNatural = (cards) => cards.length === 2 && handTotal(cards).total === 21;

// ---- the fixed shoe --------------------------------------------------------
// The bank stores a seed alongside every shoe so each board is reproducible
// from first principles. Same shuffle as Hands (mulberry32 + Fisher-Yates).
export function mulberry32(a) {
  return function () {
    a |= 0; a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// `decks` is how many standard decks are shuffled together. Boards up to
// 2026-09-29 were single-deck and carry no `decks` field; with decks = 1 this
// builds exactly the deck it always did, so every one of them still reproduces
// from its seed. From 2026-09-30 the shoe is TWO decks, because ten hands do
// not fit in one: the worst legal line of a ten-hand day needs 52 to 67 cards.
export function shoeFor(seed, count, decks = 1) {
  const deck = [];
  for (let k = 0; k < decks; k++) for (let r = 2; r <= 14; r++) for (let s = 0; s < 4; s++) deck.push(r * 4 + s);
  const rand = mulberry32(seed);
  for (let i = deck.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    const t = deck[i]; deck[i] = deck[j]; deck[j] = t;
  }
  return deck.slice(0, count);
}

// ---- the whole game, as one pure function ---------------------------------
// `acts` is one string per STARTED hand, each a sequence of 'H' / 'S' / 'D'
// decisions in the order they were made. A hand that settled with no decision
// (either natural showing) has the empty string. Starting the next hand IS
// pushing the next empty string.
//
// Returns:
//   invalid   true when acts asks for something the rules refuse (an action on
//             a settled hand, a double after a hit, more hands than the day
//             has, decisions left over). The verifier treats invalid as a hard
//             failure; the client simply never produces it.
//   hands     one record per started hand: { p, d, doubled, settled, net,
//             bust, reveal, note } — `d` always holds both dealer cards; the
//             CLIENT decides whether the hole card renders face down (reveal).
//   chips     the running bank across settled hands.
//   busts     hands the PLAYER busted (the leaderboard's miss column).
//   pos       cards consumed off the shoe so far.
//   phase     'idle' (no hand started), 'act' (last hand awaits a decision),
//             'settled' (last hand done, more remain), 'over' (all hands done).
//   legal     the actions available right now ('act' phase only).
export function replay(shoe, nHands, acts) {
  const out = { invalid: false, hands: [], chips: 0, busts: 0, pos: 0, phase: 'idle', legal: [] };
  if (!Array.isArray(acts)) { out.invalid = true; return out; }
  if (acts.length > nHands) { out.invalid = true; return out; }
  let pos = 0;

  for (let h = 0; h < acts.length; h++) {
    const a = String(acts[h] || '');
    if (pos + 4 > shoe.length) { out.invalid = true; return out; }
    const p = [shoe[pos], shoe[pos + 2]];
    const d = [shoe[pos + 1], shoe[pos + 3]];
    pos += 4;
    const rec = { p, d, doubled: false, settled: false, net: 0, bust: false, reveal: false, note: '' };
    out.hands.push(rec);

    const pNat = isNatural(p);
    const dNat = isNatural(d);

    const settle = (net, note) => {
      rec.settled = true; rec.net = net; rec.note = note; rec.reveal = true;
      out.chips += net;
    };

    if (dNat || pNat) {
      // The peek: naturals settle before any decision, so this hand's string
      // must be empty.
      if (a.length) { out.invalid = true; return out; }
      if (dNat && pNat) settle(0, 'Two naturals. Push.');
      else if (dNat) settle(-STAKE, 'Dealer blackjack.');
      else settle(NATURAL_PAY, 'Blackjack! Pays 3 to 2.');
      continue;
    }

    let stake = STAKE;
    let stood = false;
    let k = 0;
    for (; k < a.length; k++) {
      if (rec.settled || stood) { out.invalid = true; return out; }
      const ch = a[k];
      if (handTotal(rec.p).total === 21) { out.invalid = true; return out; } // 21 auto-stands; no action exists there
      if (ch === 'H') {
        if (pos >= shoe.length) { out.invalid = true; return out; }
        rec.p = rec.p.concat(shoe[pos++]);
        const t = handTotal(rec.p).total;
        if (t > 21) { rec.bust = true; out.busts++; settle(-stake, `Bust on ${t}.`); }
        else if (t === 21) stood = true; // auto-stand
      } else if (ch === 'D') {
        if (rec.p.length !== 2) { out.invalid = true; return out; }
        if (pos >= shoe.length) { out.invalid = true; return out; }
        rec.doubled = true; stake = STAKE * 2;
        rec.p = rec.p.concat(shoe[pos++]);
        const t = handTotal(rec.p).total;
        if (t > 21) { rec.bust = true; out.busts++; settle(-stake, `Bust on ${t}, doubled.`); }
        else stood = true;
      } else if (ch === 'S') {
        stood = true;
      } else { out.invalid = true; return out; }
    }
    // A made 21 stands itself even with no action string left.
    if (!rec.settled && !stood && handTotal(rec.p).total === 21) stood = true;

    if (!rec.settled && stood) {
      // dealer plays: stands on all 17s, draws to 16
      rec.reveal = true;
      while (handTotal(rec.d).total < 17) {
        if (pos >= shoe.length) { out.invalid = true; return out; }
        rec.d = rec.d.concat(shoe[pos++]);
      }
      const pt = handTotal(rec.p).total;
      const dt = handTotal(rec.d).total;
      if (dt > 21) settle(stake, `Dealer busts on ${dt}.`);
      else if (pt > dt) settle(stake, `${pt} beats ${dt}.`);
      else if (pt < dt) settle(-stake, `${dt} beats ${pt}.`);
      else settle(0, `${pt} apiece. Push.`);
    }

    if (!rec.settled && h !== acts.length - 1) { out.invalid = true; return out; } // only the last hand may be mid-play
  }

  out.pos = pos;
  const last = out.hands[out.hands.length - 1] || null;
  if (!out.hands.length) out.phase = 'idle';
  else if (last && !last.settled) {
    out.phase = 'act';
    out.legal = last.p.length === 2 ? ['H', 'S', 'D'] : ['H', 'S'];
  } else {
    out.phase = out.hands.length === nHands ? 'over' : 'settled';
  }
  return out;
}

// ---- basic strategy --------------------------------------------------------
// The book line for the exact rules above (S17, double any first two, no
// splits: a pair simply plays as its hard or soft total). This is what PAR is:
// the chips this policy banks on the day's shoe, playing blind.
export function basicAction(playerCards, dealerUp, canDouble) {
  const { total: t, soft } = handTotal(playerCards);
  const up = rankOf(dealerUp) === 14 ? 11 : Math.min(10, rankOf(dealerUp));
  if (soft) {
    if (t >= 19) return 'S';
    if (t === 18) {
      if (up >= 3 && up <= 6) return canDouble ? 'D' : 'S';
      if (up === 2 || up === 7 || up === 8) return 'S';
      return 'H';
    }
    if (t === 17) return canDouble && up >= 3 && up <= 6 ? 'D' : 'H';
    if (t === 16 || t === 15) return canDouble && up >= 4 && up <= 6 ? 'D' : 'H';
    if (t === 14 || t === 13) return canDouble && up >= 5 && up <= 6 ? 'D' : 'H';
    return 'H'; // soft 12: a pair of aces, played as a hand, just hits
  }
  if (t >= 17) return 'S';
  if (t >= 13) return up <= 6 ? 'S' : 'H';
  if (t === 12) return up >= 4 && up <= 6 ? 'S' : 'H';
  if (t === 11) return canDouble && up <= 10 ? 'D' : 'H'; // S17: hit 11 vs ace
  if (t === 10) return canDouble && up <= 9 ? 'D' : 'H';
  if (t === 9) return canDouble && up >= 3 && up <= 6 ? 'D' : 'H';
  return 'H';
}

// Play a whole day with a decision policy. `decide(p, dealerUp, canDouble)`
// returns 'H' / 'S' / 'D'. Returns the finished replay plus the action strings
// the policy produced (which is what the proofs bank).
export function playPolicy(shoe, nHands, decide) {
  const acts = [];
  for (let h = 0; h < nHands; h++) {
    acts.push('');
    for (;;) {
      const r = replay(shoe, nHands, acts);
      if (r.invalid) return { invalid: true, acts };
      if (r.phase !== 'act') break;
      const rec = r.hands[r.hands.length - 1];
      const ch = decide(rec.p, rec.d[0], rec.p.length === 2);
      acts[h] += ch === 'D' && rec.p.length !== 2 ? 'H' : ch;
    }
  }
  return { ...replay(shoe, nHands, acts), acts };
}

// ---- the ten point scale ---------------------------------------------------
// Par and ace anchor it, exactly the Hands model: par is the book line played
// blind (scores 8), ace is the best of hundreds of blind runs (scores 10), and
// the ceiling — the clairvoyant maximum, which here IS exact — is a footnote,
// never a target. Below par the step is a seventh of the distance to the
// worst possible day (every hand a doubled loss), so the absolute floor lands
// exactly on 1.
export function worstChips(nHands) { return -2 * STAKE * nHands; }

export function scaleFor(par, ace, nHands) {
  const up = Math.max(1, ((Number(ace) || 0) - (Number(par) || 0)) / 2);
  const down = Math.max(1, ((Number(par) || 0) - worstChips(nHands)) / 7);
  return { up, down };
}

export function scoreForPoints(chips, par, ace, nHands) {
  const t = Number(chips) || 0;
  const p = Number(par) || 0;
  const { up, down } = scaleFor(p, ace, nHands);
  if (t >= p) return Math.max(8, Math.min(10, 8 + Math.floor((t - p) / up)));
  return Math.max(1, 8 - Math.ceil((p - t) / down));
}

// Chips rendered the way a bank prints them: signed, so a push day reads "0".
export function fmtChips(n) {
  const v = Number(n) || 0;
  return v > 0 ? `+${v}` : String(v);
}
