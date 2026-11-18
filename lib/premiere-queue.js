// lib/premiere-queue.js: which new-game pop-up a returning player is owed today.
//
// ONE A DAY, FROM A BACKLOG (owner, 2026-11-14: "let's also stagger our pop-ups.
// i want one per day, and use the backlog across users who haven't played it. so
// mop, chef, bag, seated should extend out that many days one at a time for
// players returning"). Four dailies launched in two days and a returning player
// was shown one card naming the newest batch, with every other launch stamped as
// seen and never offered. Now each launch waits in a queue:
//
//   - a launch from QUEUE_FROM on stays in the queue for QUEUE_DAYS days after it
//     premiered, whatever its `until` says. Launches before QUEUE_FROM are done:
//     they were announced under the old rule and are not announced again;
//   - the queue runs oldest launch first, and launches of the same day run in the
//     order they were added (the bottom of that day's block in PREMIERES first);
//   - the card names ONE game, and one card is shown per browser per Eastern day
//     (app/PremierePop.jsx stamps sot_premiere_day); a run's launch card counts
//     as that day's card;
//   - only the game shown is stamped as seen, so the rest keep their turn. The
//     stamp is sot_premiere_q_<key>, a NEW name: the old sot_premiere_<key> was
//     written for every open launch whenever any card showed, so it says nothing
//     about whether this browser was ever shown that game;
//   - a game the player has already played, here or on another device, is
//     skipped without using up the day.
//
// So somebody back after a week away gets Mop today, Chef tomorrow, Pack the day
// after, and so on, and somebody who plays Chef on their own never sees its card.
// FRONT OF THE QUEUE (owner, 2026-11-17, Machine: "make this the first pop-up
// people see upon return (put it to the front of the queue"). A launch marked
// `front: true` jumps every older launch still waiting. While its card is owed,
// app/PremierePop.jsx also holds the visit's pop-up budget for it
// (lib/pop-budget.js holdPop), so no other self-opening card takes the visit
// first. Everything else about the queue is unchanged: one card a day, a played
// game is skipped, and the older launches follow in their usual order.
//
// Pure functions, no browser: checked by scripts/verify-premiere-queue.mjs.
export const QUEUE_FROM = '2026-11-13';
export const QUEUE_DAYS = 30;

export function daysAgo(iso, today) {
  const a = Date.parse(`${iso}T12:00:00Z`), b = Date.parse(`${today}T12:00:00Z`);
  return Number.isFinite(a) && Number.isFinite(b) ? Math.round((b - a) / 86400000) : 99;
}

// Is this launch still being announced today?
export function premiereOpen(p, today) {
  if (!p || today < p.from || p.from < QUEUE_FROM) return false;
  return today <= p.until || daysAgo(p.from, today) <= QUEUE_DAYS;
}

// The open launches in the order their cards are owed. `ok(key)` drops a launch
// (not a live game, opted out, part of a run that has its own card).
export function premiereQueue(premieres, today, ok = () => true) {
  return premieres
    .map((p, i) => ({ p, i }))
    .filter(({ p }) => premiereOpen(p, today) && ok(p.key))
    .sort((a, b) => (!!b.p.front - !!a.p.front) || (a.p.from < b.p.from ? -1 : a.p.from > b.p.from ? 1 : b.i - a.i))
    .map(({ p }) => p.key);
}
