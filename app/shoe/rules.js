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
//     No insurance, no surrender.
//   - SPLIT, on boards that carry `split: true` (from 2026-10-17): a pair of
//     the same rank splits once into two hands of 10 chips each, played in
//     order. Double after a split is allowed; split aces take one card each.
//     A 21 after a split pays even money. Boards before that date have no
//     split and replay exactly as they shipped.
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
// `acts` is one string per STARTED hand, each a sequence of 'H' / 'S' / 'D' / 'P'
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
export function replay(shoe, nHands, acts, opts = {}) {
  const allowSplit = !!(opts && opts.split);
  const out = { invalid: false, hands: [], chips: 0, busts: 0, pos: 0, phase: 'idle', legal: [] };
  if (!Array.isArray(acts)) { out.invalid = true; return out; }
  if (acts.length > nHands) { out.invalid = true; return out; }
  let pos = 0;
  let lastSeats = null;
  let lastSplit = false;

  for (let h = 0; h < acts.length; h++) {
    const a = String(acts[h] || '');
    if (pos + 4 > shoe.length) { out.invalid = true; return out; }
    const p = [shoe[pos], shoe[pos + 2]];
    const d = [shoe[pos + 1], shoe[pos + 3]];
    pos += 4;
    const rec = { p, d, doubled: false, settled: false, net: 0, bust: false, reveal: false, note: '', split: false, parts: null, active: -1 };
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

    // SEATS. An unsplit hand is one seat. A split turns the pair into two
    // seats, each staked at 10, played in order: the first seat takes its
    // second card at once and plays out, then the second seat takes its
    // second card and plays out, then the dealer plays once against both.
    // Split aces take one card each and stand. A 21 after a split is not a
    // natural and pays even money. One split per hand, no resplits.
    const seats = [{ p: p.slice(), stake: STAKE, doubled: false, bust: false, done: false, aces: false }];
    let split = false;
    const active = () => seats.find((x) => !x.done) || null;
    // Deal a split seat its second card when it comes up, and stand any seat
    // sitting on 21 (21 stands itself, so no action exists there).
    const prime = () => {
      for (;;) {
        const s = active();
        if (!s) return true;
        if (s.p.length === 1) {
          if (pos >= shoe.length) return false;
          s.p.push(shoe[pos++]);
          if (s.aces) { s.done = true; continue; }
        }
        if (handTotal(s.p).total === 21) { s.done = true; continue; }
        return true;
      }
    };
    if (!prime()) { out.invalid = true; return out; }

    for (let k = 0; k < a.length; k++) {
      const s = active();
      if (!s) { out.invalid = true; return out; }
      const ch = a[k];
      if (ch === 'H') {
        if (s.aces) { out.invalid = true; return out; }
        if (pos >= shoe.length) { out.invalid = true; return out; }
        s.p.push(shoe[pos++]);
        if (handTotal(s.p).total > 21) { s.bust = true; s.done = true; out.busts++; }
      } else if (ch === 'D') {
        if (s.p.length !== 2 || s.aces) { out.invalid = true; return out; }
        if (pos >= shoe.length) { out.invalid = true; return out; }
        s.doubled = true; s.stake = STAKE * 2;
        s.p.push(shoe[pos++]);
        if (handTotal(s.p).total > 21) { s.bust = true; out.busts++; }
        s.done = true;
      } else if (ch === 'S') {
        s.done = true;
      } else if (ch === 'P') {
        if (!allowSplit || split || seats.length !== 1 || s.p.length !== 2 || rankOf(s.p[0]) !== rankOf(s.p[1])) { out.invalid = true; return out; }
        split = true;
        const aces = rankOf(s.p[0]) === 14;
        const [c0, c1] = s.p;
        seats.length = 0;
        seats.push(
          { p: [c0], stake: STAKE, doubled: false, bust: false, done: false, aces },
          { p: [c1], stake: STAKE, doubled: false, bust: false, done: false, aces },
        );
      } else { out.invalid = true; return out; }
      if (!prime()) { out.invalid = true; return out; }
    }

    rec.split = split;
    rec.parts = split ? seats : null;
    const act = active();
    rec.active = act ? seats.indexOf(act) : -1;
    rec.p = act ? act.p : seats[seats.length - 1].p;
    if (!split) { rec.doubled = seats[0].doubled; rec.bust = seats[0].bust; }

    if (!act) {
      const live = seats.filter((x) => !x.bust);
      if (!live.length) {
        // every seat busted: the dealer turns the hole card and draws nothing
        rec.bust = true;
        for (const x of seats) x.net = -x.stake;
        const net = seats.reduce((t, x) => t + x.net, 0);
        if (!split) {
          const t = handTotal(seats[0].p).total;
          settle(net, seats[0].doubled ? `Bust on ${t}, doubled.` : `Bust on ${t}.`);
        } else settle(net, `Both split hands bust.`);
      } else {
        rec.reveal = true;
        while (handTotal(rec.d).total < 17) {
          if (pos >= shoe.length) { out.invalid = true; return out; }
          rec.d = rec.d.concat(shoe[pos++]);
        }
        const dt = handTotal(rec.d).total;
        for (const x of seats) {
          const pt = handTotal(x.p).total;
          x.net = x.bust ? -x.stake : dt > 21 ? x.stake : pt > dt ? x.stake : pt < dt ? -x.stake : 0;
        }
        const net = seats.reduce((t, x) => t + x.net, 0);
        if (!split) {
          const pt = handTotal(seats[0].p).total;
          if (dt > 21) settle(net, `Dealer busts on ${dt}.`);
          else if (pt > dt) settle(net, `${pt} beats ${dt}.`);
          else if (pt < dt) settle(net, `${dt} beats ${pt}.`);
          else settle(net, `${pt} apiece. Push.`);
        } else {
          const word = (x) => {
            const t = handTotal(x.p).total;
            if (x.bust) return `bust on ${t}`;
            return `${t} ${x.net > 0 ? 'wins' : x.net < 0 ? 'loses' : 'pushes'}`;
          };
          settle(net, `Split: ${word(seats[0])}, ${word(seats[1])}. Dealer ${dt > 21 ? `busts on ${dt}` : `has ${dt}`}.`);
        }
      }
    }

    if (!rec.settled && h !== acts.length - 1) { out.invalid = true; return out; } // only the last hand may be mid-play
    lastSeats = seats; lastSplit = split;
  }

  out.pos = pos;
  const last = out.hands[out.hands.length - 1] || null;
  if (!out.hands.length) out.phase = 'idle';
  else if (last && !last.settled) {
    out.phase = 'act';
    const s = lastSeats.find((x) => !x.done);
    const legal = ['H', 'S'];
    if (s.p.length === 2 && !s.aces) legal.push('D');
    if (allowSplit && !lastSplit && lastSeats.length === 1 && s.p.length === 2 && rankOf(s.p[0]) === rankOf(s.p[1])) legal.push('P');
    out.legal = legal;
  } else {
    out.phase = out.hands.length === nHands ? 'over' : 'settled';
  }
  return out;
}

// ---- basic strategy --------------------------------------------------------
// The book line for the exact rules above (S17, double any first two). On a
// board without splits a pair simply plays as its hard or soft total. This is what PAR is:
// the chips this policy banks on the day's shoe, playing blind.
// PAIRS (split boards only, `canSplit`): the multi-deck S17 chart with double
// after split. Aces and eights always; tens and fives never; nines against
// 2-6, 8 and 9; sevens, threes and twos against 2-7; sixes against 2-6;
// fours against 5 and 6. Only a pair of the same RANK splits here, so ten-J
// is never a pair.
export function splitsPair(rank, up) {
  if (rank === 14 || rank === 8) return true;
  if (rank >= 10 || rank === 5) return false;
  if (rank === 9) return (up >= 2 && up <= 6) || up === 8 || up === 9;
  if (rank === 7 || rank === 3 || rank === 2) return up >= 2 && up <= 7;
  if (rank === 6) return up >= 2 && up <= 6;
  if (rank === 4) return up === 5 || up === 6;
  return false;
}

export function basicAction(playerCards, dealerUp, canDouble, canSplit = false) {
  const { total: t, soft } = handTotal(playerCards);
  const up = rankOf(dealerUp) === 14 ? 11 : Math.min(10, rankOf(dealerUp));
  if (canSplit && playerCards.length === 2 && rankOf(playerCards[0]) === rankOf(playerCards[1]) && splitsPair(rankOf(playerCards[0]), up)) return 'P';
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

// Play a whole day with a decision policy. `decide(p, dealerUp, canDouble,
// canSplit)` returns 'H' / 'S' / 'D' / 'P'; `p` is the seat in play. Returns
// the finished replay plus the action strings the policy produced (which is
// what the proofs bank).
export function playPolicy(shoe, nHands, decide, opts = {}) {
  const acts = [];
  for (let h = 0; h < nHands; h++) {
    acts.push('');
    for (;;) {
      const r = replay(shoe, nHands, acts, opts);
      if (r.invalid) return { invalid: true, acts };
      if (r.phase !== 'act') break;
      const rec = r.hands[r.hands.length - 1];
      const canD = r.legal.includes('D');
      const canP = r.legal.includes('P');
      let ch = decide(rec.p, rec.d[0], canD, canP);
      if (ch === 'P' && !canP) ch = decide(rec.p, rec.d[0], canD, false);
      if (ch === 'D' && !canD) ch = 'H';
      acts[h] += ch;
    }
  }
  return { ...replay(shoe, nHands, acts, opts), acts };
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
