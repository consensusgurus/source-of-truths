// THE PRICE CHECK FAMILY (owner, 2026-10-01): five daily price-guessing games
// on one engine, and one run that plays all five back to back.
//
//   Pricer   an Amazon product, at the price Amazon showed the day we read it
//   Dealer   a vehicle at its maker's starting MSRP (cars mostly, a work van or
//            truck about once a week, a motorcycle now and then)
//   Realtor  a house for sale, at its current asking price
//   Agent    a trip: one named flight (airline, day, date, departure, cabin) or
//            one hotel stay, at the fare quoted on the day we read it
//   Curator  a luxury piece: a work sold at auction (price with premium) or a
//            luxury item at its list price
//
// Every game scores the same way, so the run can add them up: five guesses,
// the closest one is the score, 0 to 10, measured as a RATIO so half and
// double are equally far, and within 1% is a bullseye that ends the day.
// Each game files its own row under its own quizId prefix, and the Price Check
// circuit (lib/circuits) ranks on the sum of the five scores ('correct' mode).
//
// This file is plain data plus the scoring arithmetic, importable from the
// server, the clients and the verifiers alike.

export const PRICE_KEYS = ['pricer', 'dealer', 'realtor', 'agent', 'curator'];

export const PRICE_GAMES = {
  pricer: {
    key: 'pricer', name: 'Pricer', path: '/pricer', word: 'The find',
    noun: 'product', tag: 'Guess the price',
    lead: 'One real product a day. Guess what it costs.',
    blurb: 'One Amazon product a day and five guesses at its price.',
    how: 'One real product a day and five guesses at what it costs. Each guess says higher or lower and how hot you are, Freezing to Burning. Your score is your closest guess, 0 to 10, measured as a ratio so half and double are equally far; within 1% is a bullseye and ends the day. Everything is on Amazon, from hot sauce to laptops.',
    basis: 'the price Amazon showed that day',
    tagDark: '#4ade80', tagLight: '#15803d',
  },
  dealer: {
    key: 'dealer', name: 'Dealer', path: '/dealer', word: 'The ride',
    noun: 'vehicle', tag: 'Guess the sticker price',
    lead: 'One vehicle a day. Guess its starting price.',
    blurb: 'One vehicle a day, from a hatchback to a work van to a supercar, and five guesses at its starting MSRP.',
    how: 'One vehicle a day and five guesses at its starting MSRP, the maker\'s own base price. Each guess says higher or lower and how hot you are. Your closest guess is your score, 0 to 10; within 1% is a bullseye. Cars mostly, with a work van, a pickup or a motorcycle now and then.',
    basis: 'the maker\'s starting MSRP, before destination, taxes and options',
    tagDark: '#fbbf24', tagLight: '#b45309',
  },
  realtor: {
    key: 'realtor', name: 'Realtor', path: '/realtor', word: 'The home',
    noun: 'home', tag: 'Guess the asking price',
    lead: 'One home for sale a day. Guess the asking price.',
    blurb: 'One house for sale a day: the curb, the kitchen, one more room, the city and the size. Five guesses at the asking price.',
    how: 'One home for sale a day: three photos, the city, the beds, baths and square feet. Five guesses at its asking price, each one higher or lower and hot or cold. Your closest guess is your score, 0 to 10; within 1% is a bullseye.',
    basis: 'the asking price on the listing that day',
    tagDark: '#7dd3fc', tagLight: '#0369a1',
  },
  agent: {
    key: 'agent', name: 'Agent', path: '/agent', word: 'The trip',
    noun: 'trip', tag: 'Guess the fare',
    lead: 'One trip a day: a flight or a hotel stay. Guess the price.',
    blurb: 'One trip a day, a named flight or a hotel night, and five guesses at the fare.',
    how: 'One trip a day: a named flight (airline, day, date, time and cabin) or a hotel stay. Five guesses at the fare we were quoted, each one higher or lower and hot or cold. Your closest guess is your score, 0 to 10; within 1% is a bullseye.',
    basis: 'the fare we were quoted that day, taxes and fees in',
    tagDark: '#f472b6', tagLight: '#be185d',
  },
  curator: {
    key: 'curator', name: 'Curator', path: '/curator', word: 'The piece',
    noun: 'piece', tag: 'Guess what it sold for',
    lead: 'One luxury piece a day. Guess what it cost.',
    blurb: 'One luxury piece a day, a masterpiece off the auction block or a watch off the shelf, and five guesses at the price.',
    how: 'One luxury piece a day: a work sold at auction, priced with the buyer\'s premium, or a luxury item at its list price. Five guesses, each one higher or lower and hot or cold. Your closest guess is your score, 0 to 10; within 1% is a bullseye.',
    basis: 'the auction result with buyer\'s premium, or the list price that day',
    tagDark: '#c4b5fd', tagLight: '#6d28d9',
  },
};

export const GUESSES = 5;
export const TOTAL = 10;

// Heat bands on the ratio error. The colours are meaning, so each band carries
// a stage token with a fallback; the thermometer runs blue (far) to red (near).
export const BANDS = [
  { max: 0.01, key: 'bull', label: 'Bullseye', col: 'var(--stg-good, #15803d)' },
  { max: 0.05, key: 'burning', label: 'Burning', col: 'var(--pr-burning)' },
  { max: 0.15, key: 'hot', label: 'Hot', col: 'var(--pr-hot)' },
  { max: 0.35, key: 'warm', label: 'Warm', col: 'var(--pr-warm)' },
  { max: 0.75, key: 'cool', label: 'Cool', col: 'var(--pr-cool)' },
  { max: 1.5, key: 'cold', label: 'Cold', col: 'var(--pr-cold)' },
  { max: Infinity, key: 'freezing', label: 'Freezing', col: 'var(--pr-freezing)' },
];
export const SCORE_TABLE = [[0.01, 10], [0.025, 9], [0.05, 8], [0.10, 7], [0.15, 6], [0.25, 5], [0.35, 4], [0.50, 3], [0.75, 2], [1.00, 1]];
export const errOf = (g, p) => Math.max(g / p, p / g) - 1;
export const bandOf = (e) => BANDS.find((b) => e <= b.max);
export const scoreOf = (e) => { for (const [m, s] of SCORE_TABLE) if (e <= m) return s; return 0; };
export const pctLabel = (e) => (e < 0.001 ? 'dead on' : `${(Math.round(e * 1000) / 10).toLocaleString()}% off`);

// Cents in, dollars out; cents shown only when the figure has them.
export function fmtCents(c) {
  const whole = Math.floor(c / 100), cents = c % 100;
  return `$${whole.toLocaleString('en-US')}${cents ? `.${String(cents).padStart(2, '0')}` : ''}`;
}
// "24.99", "$1,250", "135k", "1.2m", "2b" all parse; returns cents or null.
export function parseGuess(raw) {
  const s = String(raw || '').trim().toLowerCase().replace(/[$,\s]/g, '');
  const m = s.match(/^(\d+(?:\.\d*)?|\.\d+)([kmb])?$/);
  if (!m) return null;
  let v = Number(m[1]);
  if (m[2] === 'k') v *= 1e3;
  if (m[2] === 'm') v *= 1e6;
  if (m[2] === 'b') v *= 1e9;
  const c = Math.round(v * 100);
  return c > 0 && c < 1e14 ? c : null;
}

// The Price Check run's verdict on a total out of 50: THE SHOPPERS (owner,
// 2026-10-01). Sharpest first. [cutoff, persona, line, card, card subline].
// The end card shows the persona as a payment card that gets better as you
// climb: prepaid, debit, credit, gold, black.
//
// WEIGHTED TO THE LOW END (owner, 2026-10-01): hot/cold guessing lets a
// careful player walk most prices to a bullseye, so first-day runs landed at
// 39 to 49 of 50 and the old 45/35/25/15 cut put nearly everyone on Black.
// The cards now sit high so most runs land on Debit or Prepaid and there is a
// card to come back for: Black is a perfect 50, Gold 49, Credit 48, Debit 44
// to 47, Prepaid 43 and under.
export const RUN_RANKS = [
  [50, 'The Insider', 'You know the markup before the tag goes on.', 'Black', 'By invitation'],
  [49, 'The Haggler', 'Nobody sells to you at sticker price.', 'Gold', 'Credit'],
  [48, 'The Regular', 'You know your way around the aisles.', 'Credit', 'Classic'],
  [44, 'The Impulse Buyer', 'It looked nice, so it went in the cart.', 'Debit', ''],
  [0, 'The Full-Price Payer', 'You have never once checked for a coupon.', 'Prepaid', 'Reloadable'],
];
export const runTierOf = (total) => { const i = RUN_RANKS.findIndex((r) => total >= r[0]); return i < 0 ? RUN_RANKS.length - 1 : i; };
export const runRankOf = (total) => RUN_RANKS[runTierOf(total)];

export function fmtIsoDate(iso, opts) {
  try { return new Date(`${iso}T12:00:00Z`).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', timeZone: 'UTC', ...(opts || {}) }); }
  catch (e) { return iso; }
}
