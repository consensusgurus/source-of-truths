// verify-pairs: the checker for Pairs (app/pairs/puzzles.js), discovered by
// scripts/verify-all.mjs. Decodes every deal (the encoding is described in
// scripts/gen-pairs.mjs and re-implemented here) and re-checks:
//   - one board a day from 2026-11-01, quizId / dateLabel / sunday from `live`
//   - 6x6 (18 pairs) every day, 8x6 (24 pairs) on the Sunday Edition
//   - every card is a real card and appears once
//   - every card has its pair on the table: the same rank in the same colour
//   - at least four near misses (a rank dealt in both colours)
//   - the decoder the client uses (app/pairs/deal.js) reads the same cards
import { checker, checkDays, dowOf } from './six-verify-common.mjs';
const { PUZZLES } = await import(new URL('../app/pairs/puzzles.js', import.meta.url));
const { decodeDeal } = await import(new URL('../app/pairs/deal.js', import.meta.url));
const { bad, done } = checker('pairs');
checkDays('pairs', PUZZLES, bad);
const RANKS = ['A', '2', '3', '4', '5', '6', '7', '8', '9', 'T', 'J', 'Q', 'K'];
const DECK = RANKS.flatMap((r) => ['S', 'H', 'D', 'C'].map((s) => r + s));
const colour = (c) => ('HD'.includes(c[1]) ? 'r' : 'b');
for (const p of PUZZLES) {
  const sun = dowOf(p.live) === 0;
  const [cols, rows] = sun ? [8, 6] : [6, 6];
  if (p.cols !== cols || p.rows !== rows) bad(p.num, `table ${p.cols}x${p.rows}, should be ${cols}x${rows}`);
  const n = cols * rows;
  if (typeof p.deal !== 'string' || p.deal.length !== 2 * n) { bad(p.num, 'deal has the wrong length'); continue; }
  const cards = [];
  for (let i = 0; i < n; i++) cards.push(DECK[(((parseInt(p.deal.slice(2 * i, 2 * i + 2), 36) - 7 * i - p.num) % 52) + 52) % 52]);
  const mine = decodeDeal(p.deal, p.num);
  if (mine.join() !== cards.join()) bad(p.num, 'the client decoder reads a different deal');
  if (new Set(cards).size !== n) bad(p.num, 'a card appears twice');
  for (const c of cards) if (!cards.some((d) => d !== c && d[0] === c[0] && colour(d) === colour(c))) bad(p.num, `${c} has no pair`);
  const both = RANKS.filter((r) => cards.some((c) => c[0] === r && colour(c) === 'r') && cards.some((c) => c[0] === r && colour(c) === 'b')).length;
  if (both < 4) bad(p.num, `${both} near misses, at least 4`);
}
done(PUZZLES);
