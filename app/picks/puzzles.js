// PICKS: the six calls in the middle of Price Check, one board a day from
// 2026-11-07 (owner, 2026-11-06). Game logic and scoring: lib/picks.js.
//
// Every item is a row of the retired Dealer, Agent or Curator bank, named by
// its quizId, or (from 2026-11-15, owner 2026-11-12) a row of the Picks pool in
// app/picks/pool.js, named by its id (pick-d### a vehicle, pick-c### a luxury
// piece); Dealer, Agent and Curator stay retired and gain no new days. Each is
// resolved through lib/price-ship.js, so it carries that row's photo, credit,
// price and "as of" date. A pool list price is dealt within 60 days of being
// read. Fields:
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
  {"num":9,"quizId":"picks-11-15-26","live":"2026-11-15","dateLabel":"November 15, 2026","start":"pick-d015","chain":["pick-c012","pick-d006","pick-d014","pick-d013"],"ou":{"ref":"pick-d020","line":10000000},"tags":["pick-c041","pick-c019","pick-d031"],"tagOrder":[1,2,0]},
  {"num":10,"quizId":"picks-11-16-26","live":"2026-11-16","dateLabel":"November 16, 2026","start":"pick-c014","chain":["pick-d005","pick-d036","pick-c039","pick-c040"],"ou":{"ref":"pick-c006","line":250000},"tags":["pick-d025","pick-c007","pick-d008"],"tagOrder":[1,0,2]},
  {"num":11,"quizId":"picks-11-17-26","live":"2026-11-17","dateLabel":"November 17, 2026","start":"pick-c016","chain":["pick-d004","pick-c045","pick-d001","pick-d035"],"ou":{"ref":"pick-d021","line":5000000},"tags":["pick-c011","pick-d012","pick-d043"],"tagOrder":[2,1,0]},
  {"num":12,"quizId":"picks-11-18-26","live":"2026-11-18","dateLabel":"November 18, 2026","start":"pick-d026","chain":["pick-d023","pick-c010","pick-d030","pick-d037"],"ou":{"ref":"pick-d003","line":5000000},"tags":["pick-d049","pick-c008","pick-d029"],"tagOrder":[1,2,0]},
  {"num":13,"quizId":"picks-11-19-26","live":"2026-11-19","dateLabel":"November 19, 2026","start":"pick-d048","chain":["pick-c020","pick-d045","pick-d042","pick-c042"],"ou":{"ref":"pick-c031","line":2500000000},"tags":["pick-d046","pick-d022","pick-c017"],"tagOrder":[2,1,0]},
  {"num":14,"quizId":"picks-11-20-26","live":"2026-11-20","dateLabel":"November 20, 2026","start":"pick-d016","chain":["pick-d034","pick-d018","pick-d028","pick-c044"],"ou":{"ref":"pick-c028","line":4000000000},"tags":["pick-d007","pick-d041","pick-c043"],"tagOrder":[1,2,0]},
  {"num":15,"quizId":"picks-11-21-26","live":"2026-11-21","dateLabel":"November 21, 2026","start":"pick-d011","chain":["pick-d010","pick-d047","pick-c021","pick-d044"],"ou":{"ref":"pick-c025","line":8000000000},"tags":["pick-c018","pick-d038","pick-c015"],"tagOrder":[2,1,0]},
  {"num":16,"quizId":"picks-11-22-26","live":"2026-11-22","dateLabel":"November 22, 2026","start":"pick-c009","chain":["pick-d002","pick-d009","pick-c013","pick-d032"],"ou":{"ref":"pick-c026","line":6000000000},"tags":["pick-c037","pick-d039","pick-c038"],"tagOrder":[1,0,2]},
  {"num":17,"quizId":"picks-11-23-26","live":"2026-11-23","dateLabel":"November 23, 2026","start":"agent-10-9-26","chain":["pick-c001","agent-11-10-26","pick-c002","agent-11-4-26"],"ou":{"ref":"curator-11-2-26","line":7500000000},"tags":["agent-10-26-26","pick-c004","agent-10-29-26"],"tagOrder":[2,1,0]},
  {"num":18,"quizId":"picks-11-24-26","live":"2026-11-24","dateLabel":"November 24, 2026","start":"pick-c003","chain":["agent-11-8-26","agent-11-13-26","agent-10-22-26","agent-11-3-26"],"ou":{"ref":"pick-c033","line":3000000000},"tags":["dealer-10-24-26","curator-10-5-26","dealer-11-8-26"],"tagOrder":[0,2,1]},
  {"num":19,"quizId":"picks-11-25-26","live":"2026-11-25","dateLabel":"November 25, 2026","start":"pick-c060","chain":["pick-d017","pick-c051","pick-c050","pick-d024"],"ou":{"ref":"pick-c053","line":750000},"tags":["pick-d040","pick-d019","pick-c062"],"tagOrder":[2,1,0]},
  {"num":20,"quizId":"picks-11-26-26","live":"2026-11-26","dateLabel":"November 26, 2026","start":"pick-d027","chain":["pick-d051","pick-d056","pick-c063","pick-c066"],"ou":{"ref":"pick-c005","line":200000},"tags":["pick-c056","pick-d033","pick-d050"],"tagOrder":[1,0,2]},
  {"num":21,"quizId":"picks-11-27-26","live":"2026-11-27","dateLabel":"November 27, 2026","start":"agent-10-27-26","chain":["pick-c046","pick-c054","pick-c052","pick-c057"],"ou":{"ref":"agent-10-6-26","line":25000},"tags":["dealer-11-1-26","pick-c059","pick-d057"],"tagOrder":[1,0,2]},
  {"num":22,"quizId":"picks-11-28-26","live":"2026-11-28","dateLabel":"November 28, 2026","start":"pick-c047","chain":["pick-c055","dealer-11-6-26","dealer-11-7-26","dealer-10-16-26"],"ou":{"ref":"curator-10-12-26","line":60000000000},"tags":["pick-d055","dealer-10-14-26","pick-c064"],"tagOrder":[2,0,1]},
  {"num":23,"quizId":"picks-11-29-26","live":"2026-11-29","dateLabel":"November 29, 2026","start":"dealer-10-5-26","chain":["dealer-10-7-26","pick-c058","dealer-11-12-26","dealer-10-9-26"],"ou":{"ref":"curator-10-18-26","line":6000000000},"tags":["pick-d054","curator-11-11-26","curator-11-7-26"],"tagOrder":[2,1,0]},
  {"num":24,"quizId":"picks-11-30-26","live":"2026-11-30","dateLabel":"November 30, 2026","start":"pick-c069","chain":["dealer-11-2-26","pick-d060","dealer-11-9-26","dealer-10-29-26"],"ou":{"ref":"pick-d059","line":6000000},"tags":["agent-10-31-26","pick-c067","agent-10-13-26"],"tagOrder":[2,0,1]},
];
