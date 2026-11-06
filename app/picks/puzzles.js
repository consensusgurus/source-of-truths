// PICKS: the six calls in the middle of Price Check, one board a day from
// 2026-11-07 (owner, 2026-11-06). Game logic and scoring: lib/picks.js.
//
// Every item is a row of the retired Dealer, Agent or Curator bank, named by
// its quizId and resolved through lib/price-ship.js, so it carries that row's
// photo, credit, price and "as of" date. Fields:
//   start     the opening item, on top for pick 1
//   chain     the four challengers for picks 1, 2, 4 and 6, in order
//   ou        pick 3: { ref, line }, line in integer cents, a round number
//   tags      pick 5: the three items; tagOrder is the order their price tags
//             are dealt in (never the items' own order)
//
// What makes a board good, and what scripts/verify-picks.mjs fails:
//   * an ab pair is never within 18% (a coin flip) or more than 8x apart (no call)
//   * the last pair is a close call, 18% to 80% apart
//   * the item on top keeps it at least once, and ends higher than it started
//   * the day opens on something under $60,000; the opener and four challengers
//     come from at least two of the three banks, with at most two auction lots
//   * the three tags come from at least two banks
//   * the over/under line is a round number 20% to 60% off the price
//   * the three tags are each at least 1.5x apart and within 30x of each other
//   * no item appears twice anywhere in the bank
// No Sunday Edition: the run is the same shape every day.
//
// Dealt by scripts/build-picks-bank.mjs FROM TO, which keeps days before FROM.

export const PUZZLES = [
  {"num":1,"quizId":"picks-11-7-26","live":"2026-11-07","dateLabel":"November 7, 2026","start":"curator-10-3-26","chain":["curator-11-6-26","agent-10-25-26","agent-10-14-26","dealer-10-8-26"],"ou":{"ref":"dealer-11-5-26","line":3000000},"tags":["dealer-10-15-26","agent-10-28-26","agent-10-18-26"],"tagOrder":[1,2,0]},
  {"num":2,"quizId":"picks-11-8-26","live":"2026-11-08","dateLabel":"November 8, 2026","start":"curator-10-13-26","chain":["dealer-10-2-26","dealer-10-1-26","dealer-11-14-26","dealer-10-6-26"],"ou":{"ref":"dealer-10-28-26","line":3000000},"tags":["dealer-11-4-26","agent-10-10-26","dealer-10-27-26"],"tagOrder":[0,2,1]},
  {"num":3,"quizId":"picks-11-9-26","live":"2026-11-09","dateLabel":"November 9, 2026","start":"agent-11-6-26","chain":["agent-11-1-26","agent-11-12-26","curator-10-31-26","agent-11-7-26"],"ou":{"ref":"agent-10-24-26","line":15000},"tags":["curator-10-7-26","dealer-10-30-26","dealer-10-17-26"],"tagOrder":[1,2,0]},
  {"num":4,"quizId":"picks-11-10-26","live":"2026-11-10","dateLabel":"November 10, 2026","start":"agent-11-14-26","chain":["agent-10-4-26","curator-11-13-26","agent-10-2-26","agent-10-3-26"],"ou":{"ref":"dealer-10-23-26","line":2500000},"tags":["curator-10-1-26","dealer-10-21-26","agent-11-11-26"],"tagOrder":[2,1,0]},
  {"num":5,"quizId":"picks-11-11-26","live":"2026-11-11","dateLabel":"November 11, 2026","start":"agent-10-21-26","chain":["agent-10-12-26","dealer-10-12-26","dealer-10-13-26","dealer-10-22-26"],"ou":{"ref":"curator-11-1-26","line":15000000000},"tags":["dealer-11-11-26","agent-10-5-26","curator-11-12-26"],"tagOrder":[1,2,0]},
  {"num":6,"quizId":"picks-11-12-26","live":"2026-11-12","dateLabel":"November 12, 2026","start":"agent-10-20-26","chain":["curator-10-25-26","agent-10-11-26","agent-10-7-26","agent-11-9-26"],"ou":{"ref":"agent-10-30-26","line":75000},"tags":["curator-10-17-26","dealer-10-20-26","agent-10-16-26"],"tagOrder":[2,1,0]},
  {"num":7,"quizId":"picks-11-13-26","live":"2026-11-13","dateLabel":"November 13, 2026","start":"agent-10-17-26","chain":["curator-10-21-26","agent-11-2-26","agent-11-5-26","agent-10-23-26"],"ou":{"ref":"curator-10-9-26","line":1500000000},"tags":["dealer-10-19-26","dealer-10-31-26","curator-11-8-26"],"tagOrder":[2,1,0]},
  {"num":8,"quizId":"picks-11-14-26","live":"2026-11-14","dateLabel":"November 14, 2026","start":"dealer-11-13-26","chain":["curator-10-30-26","dealer-10-11-26","dealer-10-10-26","dealer-10-3-26"],"ou":{"ref":"curator-11-14-26","line":10000000000},"tags":["dealer-10-4-26","agent-10-8-26","dealer-10-26-26"],"tagOrder":[1,0,2]},
];
