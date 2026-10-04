// Puzzle data for Clade, the daily animal family-tree game. Imported ONLY by
// the server page (app/clade/page.js), which filters live<=today before
// handing puzzles to the client, so future answers never reach a browser.
//
// Each day names one hidden animal from app/clade/animals.js (`answer` is
// that animal's `name`, byte for byte). A guess is answered with the closest
// branch of the family tree it shares with the answer. Eight guesses; solved
// on guess g scores 11 - g, anything else 0.
//
// AUTHORING RULES (all enforced by scripts/verify-clade.mjs):
//   * Contiguous dates from 2026-10-04; quizId is clade-M-D-YY with no zero
//     padding; dateLabel is the long US date; `sunday` is true on real
//     Sundays only.
//   * Tier by weekday: Mon/Tue tier 1, Wed/Thu tier 2, Fri/Sat tier 3, and
//     the Sunday Edition draws a tier 4 (rare) animal.
//   * No answer repeats anywhere in the bank.
//   * No two consecutive days from the same class, and no class more than 3
//     times in any 7 consecutive days. Class = the rung under 'Four-limbed
//     vertebrates' (Mammals, Birds, Reptiles, Amphibians) or, off that
//     branch, the 3rd rung (Ray-finned fish, Insects, ...).
//   * Narrowing: every answer has at least one other animal on the list
//     sharing its first four rungs or more.
//
// Do NOT hand-edit. Regenerate with scripts/gen-clade.mjs and re-run
// scripts/verify-clade.mjs.
export const PUZZLES = [
  {"num":1,"quizId":"clade-10-4-26","live":"2026-10-04","dateLabel":"October 4, 2026","sunday":true,"answer":"Harpy eagle"},
  {"num":2,"quizId":"clade-10-5-26","live":"2026-10-05","dateLabel":"October 5, 2026","sunday":false,"answer":"Lined seahorse"},
  {"num":3,"quizId":"clade-10-6-26","live":"2026-10-06","dateLabel":"October 6, 2026","sunday":false,"answer":"American bullfrog"},
  {"num":4,"quizId":"clade-10-7-26","live":"2026-10-07","dateLabel":"October 7, 2026","sunday":false,"answer":"Red imported fire ant"},
  {"num":5,"quizId":"clade-10-8-26","live":"2026-10-08","dateLabel":"October 8, 2026","sunday":false,"answer":"European anchovy"},
  {"num":6,"quizId":"clade-10-9-26","live":"2026-10-09","dateLabel":"October 9, 2026","sunday":false,"answer":"Andean condor"},
  {"num":7,"quizId":"clade-10-10-26","live":"2026-10-10","dateLabel":"October 10, 2026","sunday":false,"answer":"Pea aphid"},
  {"num":8,"quizId":"clade-10-11-26","live":"2026-10-11","dateLabel":"October 11, 2026","sunday":true,"answer":"Tokay gecko"},
  {"num":9,"quizId":"clade-10-12-26","live":"2026-10-12","dateLabel":"October 12, 2026","sunday":false,"answer":"Polar bear"},
  {"num":10,"quizId":"clade-10-13-26","live":"2026-10-13","dateLabel":"October 13, 2026","sunday":false,"answer":"Boa constrictor"},
  {"num":11,"quizId":"clade-10-14-26","live":"2026-10-14","dateLabel":"October 14, 2026","sunday":false,"answer":"Cane toad"},
  {"num":12,"quizId":"clade-10-15-26","live":"2026-10-15","dateLabel":"October 15, 2026","sunday":false,"answer":"Brown-throated sloth"},
  {"num":13,"quizId":"clade-10-16-26","live":"2026-10-16","dateLabel":"October 16, 2026","sunday":false,"answer":"Atlantic mackerel"},
  {"num":14,"quizId":"clade-10-17-26","live":"2026-10-17","dateLabel":"October 17, 2026","sunday":false,"answer":"Mountain goat"},
  {"num":15,"quizId":"clade-10-18-26","live":"2026-10-18","dateLabel":"October 18, 2026","sunday":true,"answer":"Aldabra giant tortoise"},
  {"num":16,"quizId":"clade-10-19-26","live":"2026-10-19","dateLabel":"October 19, 2026","sunday":false,"answer":"Chicken"},
  {"num":17,"quizId":"clade-10-20-26","live":"2026-10-20","dateLabel":"October 20, 2026","sunday":false,"answer":"Hippopotamus"},
  {"num":18,"quizId":"clade-10-21-26","live":"2026-10-21","dateLabel":"October 21, 2026","sunday":false,"answer":"Blue marlin"},
  {"num":19,"quizId":"clade-10-22-26","live":"2026-10-22","dateLabel":"October 22, 2026","sunday":false,"answer":"Giant clam"},
  {"num":20,"quizId":"clade-10-23-26","live":"2026-10-23","dateLabel":"October 23, 2026","sunday":false,"answer":"Black-tailed jackrabbit"},
  {"num":21,"quizId":"clade-10-24-26","live":"2026-10-24","dateLabel":"October 24, 2026","sunday":false,"answer":"Sandhill crane"},
  {"num":22,"quizId":"clade-10-25-26","live":"2026-10-25","dateLabel":"October 25, 2026","sunday":true,"answer":"Kinkajou"},
  {"num":23,"quizId":"clade-10-26-26","live":"2026-10-26","dateLabel":"October 26, 2026","sunday":false,"answer":"Atlantic cod"},
  {"num":24,"quizId":"clade-10-27-26","live":"2026-10-27","dateLabel":"October 27, 2026","sunday":false,"answer":"Mallard"},
  {"num":25,"quizId":"clade-10-28-26","live":"2026-10-28","dateLabel":"October 28, 2026","sunday":false,"answer":"Water buffalo"},
  {"num":26,"quizId":"clade-10-29-26","live":"2026-10-29","dateLabel":"October 29, 2026","sunday":false,"answer":"Common garter snake"},
  {"num":27,"quizId":"clade-10-30-26","live":"2026-10-30","dateLabel":"October 30, 2026","sunday":false,"answer":"Mongolian gerbil"},
  {"num":28,"quizId":"clade-10-31-26","live":"2026-10-31","dateLabel":"October 31, 2026","sunday":false,"answer":"Common harvestman"},
  {"num":29,"quizId":"clade-11-1-26","live":"2026-11-01","dateLabel":"November 1, 2026","sunday":true,"answer":"Chinese giant salamander"},
  {"num":30,"quizId":"clade-11-2-26","live":"2026-11-02","dateLabel":"November 2, 2026","sunday":false,"answer":"Striped skunk"},
  {"num":31,"quizId":"clade-11-3-26","live":"2026-11-03","dateLabel":"November 3, 2026","sunday":false,"answer":"Ostrich"},
  {"num":32,"quizId":"clade-11-4-26","live":"2026-11-04","dateLabel":"November 4, 2026","sunday":false,"answer":"Staghorn coral"},
  {"num":33,"quizId":"clade-11-5-26","live":"2026-11-05","dateLabel":"November 5, 2026","sunday":false,"answer":"Little brown bat"},
  {"num":34,"quizId":"clade-11-6-26","live":"2026-11-06","dateLabel":"November 6, 2026","sunday":false,"answer":"Asian giant hornet"},
  {"num":35,"quizId":"clade-11-7-26","live":"2026-11-07","dateLabel":"November 7, 2026","sunday":false,"answer":"Musk ox"},
  {"num":36,"quizId":"clade-11-8-26","live":"2026-11-08","dateLabel":"November 8, 2026","sunday":true,"answer":"Shoebill"},
  {"num":37,"quizId":"clade-11-9-26","live":"2026-11-09","dateLabel":"November 9, 2026","sunday":false,"answer":"White-tailed deer"},
  {"num":38,"quizId":"clade-11-10-26","live":"2026-11-10","dateLabel":"November 10, 2026","sunday":false,"answer":"Ruby-throated hummingbird"},
  {"num":39,"quizId":"clade-11-11-26","live":"2026-11-11","dateLabel":"November 11, 2026","sunday":false,"answer":"Tiger shark"},
  {"num":40,"quizId":"clade-11-12-26","live":"2026-11-12","dateLabel":"November 12, 2026","sunday":false,"answer":"Wandering albatross"},
  {"num":41,"quizId":"clade-11-13-26","live":"2026-11-13","dateLabel":"November 13, 2026","sunday":false,"answer":"Northern fur seal"},
  {"num":42,"quizId":"clade-11-14-26","live":"2026-11-14","dateLabel":"November 14, 2026","sunday":false,"answer":"California kingsnake"},
  {"num":43,"quizId":"clade-11-15-26","live":"2026-11-15","dateLabel":"November 15, 2026","sunday":true,"answer":"Aye-aye"},
  {"num":44,"quizId":"clade-11-16-26","live":"2026-11-16","dateLabel":"November 16, 2026","sunday":false,"answer":"Red-bellied piranha"},
  {"num":45,"quizId":"clade-11-17-26","live":"2026-11-17","dateLabel":"November 17, 2026","sunday":false,"answer":"Bottlenose dolphin"},
  {"num":46,"quizId":"clade-11-18-26","live":"2026-11-18","dateLabel":"November 18, 2026","sunday":false,"answer":"African grey parrot"},
  {"num":47,"quizId":"clade-11-19-26","live":"2026-11-19","dateLabel":"November 19, 2026","sunday":false,"answer":"Axolotl"},
  {"num":48,"quizId":"clade-11-20-26","live":"2026-11-20","dateLabel":"November 20, 2026","sunday":false,"answer":"Blue-tongued skink"},
  {"num":49,"quizId":"clade-11-21-26","live":"2026-11-21","dateLabel":"November 21, 2026","sunday":false,"answer":"Common toad"},
  {"num":50,"quizId":"clade-11-22-26","live":"2026-11-22","dateLabel":"November 22, 2026","sunday":true,"answer":"Binturong"},
  {"num":51,"quizId":"clade-11-23-26","live":"2026-11-23","dateLabel":"November 23, 2026","sunday":false,"answer":"Atlantic bluefin tuna"},
  {"num":52,"quizId":"clade-11-24-26","live":"2026-11-24","dateLabel":"November 24, 2026","sunday":false,"answer":"Goat"},
  {"num":53,"quizId":"clade-11-25-26","live":"2026-11-25","dateLabel":"November 25, 2026","sunday":false,"answer":"Peregrine falcon"},
  {"num":54,"quizId":"clade-11-26-26","live":"2026-11-26","dateLabel":"November 26, 2026","sunday":false,"answer":"Alpaca"},
  {"num":55,"quizId":"clade-11-27-26","live":"2026-11-27","dateLabel":"November 27, 2026","sunday":false,"answer":"Eastern newt"},
  {"num":56,"quizId":"clade-11-28-26","live":"2026-11-28","dateLabel":"November 28, 2026","sunday":false,"answer":"Neon tetra"},
  {"num":57,"quizId":"clade-11-29-26","live":"2026-11-29","dateLabel":"November 29, 2026","sunday":true,"answer":"Killdeer"},
  {"num":58,"quizId":"clade-11-30-26","live":"2026-11-30","dateLabel":"November 30, 2026","sunday":false,"answer":"Great white shark"},
  {"num":59,"quizId":"clade-12-1-26","live":"2026-12-01","dateLabel":"December 1, 2026","sunday":false,"answer":"Western diamondback rattlesnake"},
  {"num":60,"quizId":"clade-12-2-26","live":"2026-12-02","dateLabel":"December 2, 2026","sunday":false,"answer":"Cougar"},
  {"num":61,"quizId":"clade-12-3-26","live":"2026-12-03","dateLabel":"December 3, 2026","sunday":false,"answer":"Atlantic herring"},
  {"num":62,"quizId":"clade-12-4-26","live":"2026-12-04","dateLabel":"December 4, 2026","sunday":false,"answer":"Dungeness crab"},
  {"num":63,"quizId":"clade-12-5-26","live":"2026-12-05","dateLabel":"December 5, 2026","sunday":false,"answer":"Haddock"},
  {"num":64,"quizId":"clade-12-6-26","live":"2026-12-06","dateLabel":"December 6, 2026","sunday":true,"answer":"Greater rhea"},
  {"num":65,"quizId":"clade-12-7-26","live":"2026-12-07","dateLabel":"December 7, 2026","sunday":false,"answer":"Gray wolf"},
  {"num":66,"quizId":"clade-12-8-26","live":"2026-12-08","dateLabel":"December 8, 2026","sunday":false,"answer":"Southern black widow"},
  {"num":67,"quizId":"clade-12-9-26","live":"2026-12-09","dateLabel":"December 9, 2026","sunday":false,"answer":"Tasmanian devil"},
  {"num":68,"quizId":"clade-12-10-26","live":"2026-12-10","dateLabel":"December 10, 2026","sunday":false,"answer":"Blue jay"},
  {"num":69,"quizId":"clade-12-11-26","live":"2026-12-11","dateLabel":"December 11, 2026","sunday":false,"answer":"Golden poison frog"},
  {"num":70,"quizId":"clade-12-12-26","live":"2026-12-12","dateLabel":"December 12, 2026","sunday":false,"answer":"Thomson's gazelle"},
  {"num":71,"quizId":"clade-12-13-26","live":"2026-12-13","dateLabel":"December 13, 2026","sunday":true,"answer":"American coot"},
  {"num":72,"quizId":"clade-12-14-26","live":"2026-12-14","dateLabel":"December 14, 2026","sunday":false,"answer":"Guinea pig"},
  {"num":73,"quizId":"clade-12-15-26","live":"2026-12-15","dateLabel":"December 15, 2026","sunday":false,"answer":"Monarch butterfly"},
  {"num":74,"quizId":"clade-12-16-26","live":"2026-12-16","dateLabel":"December 16, 2026","sunday":false,"answer":"Harbor seal"},
  {"num":75,"quizId":"clade-12-17-26","live":"2026-12-17","dateLabel":"December 17, 2026","sunday":false,"answer":"Red-eared slider"},
  {"num":76,"quizId":"clade-12-18-26","live":"2026-12-18","dateLabel":"December 18, 2026","sunday":false,"answer":"Blue-footed booby"},
  {"num":77,"quizId":"clade-12-19-26","live":"2026-12-19","dateLabel":"December 19, 2026","sunday":false,"answer":"Sun bear"},
  {"num":78,"quizId":"clade-12-20-26","live":"2026-12-20","dateLabel":"December 20, 2026","sunday":true,"answer":"Gaboon viper"},
];
