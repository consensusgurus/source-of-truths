// Hold chips and the Why reveal (owner, 2026-11-23). Run: node scripts/verify-hold-chips.mjs
//
// The bank is not rewritten for chips, so this checks the three things the
// change added: (1) holdWhy agrees with the bank's own `win` values on every
// hold of a sampled hand from every chip board, and its per-card chances
// average back to the chance to win; (2) chips are whole, bounded, and a best
// hold banks the most; (3) the SCORE_VIEW round trip: a chip total prints
// chips and an older count keeps its fraction, which depends on every chip
// board's total being larger than any count of hands.
import { register } from 'node:module';
register('./alias-loader.mjs', import.meta.url);
const { PUZZLES } = await import('../app/hold/puzzles.js');
const core = await import('../lib/hold-core.js');
const { scoreText, scoreIsCount, scoreView } = await import('../lib/daily-games.js');
const { holdWhy, isChipBoard, chipsOf, handChips, handBestChips, boardMaxChips, CHIPS_FROM, POT, showScore, heldCards } = core;

let fails = 0, checks = 0;
const ok = (cond, msg) => { checks++; if (!cond) { fails++; if (fails <= 20) console.error('FAIL', msg); } };

const chip = PUZZLES.filter(isChipBoard);
ok(chip.length > 0, 'no chip boards in the bank');
ok(PUZZLES.every((p) => isChipBoard(p) === (!!p.showdown && p.live >= CHIPS_FROM)), 'isChipBoard disagrees with showdown + date');
ok(PUZZLES.filter((p) => p.live < CHIPS_FROM).every((p) => !isChipBoard(p)), 'a board before CHIPS_FROM is a chip board');
const sv = scoreView('hold');
ok(sv && sv.v === 'points' && sv.unit === 'chips' && sv.countMax === 15, 'SCORE_VIEW.hold');

for (const p of chip) {
  const mx = boardMaxChips(p);
  ok(mx > sv.countMax, `No. ${p.num}: max chips ${mx} would read as a count`);
  ok(mx <= p.hands.length * POT, `No. ${p.num}: max chips over the pots`);
  ok(!scoreIsCount('hold', mx) && scoreText('hold', mx, mx) === `${mx.toLocaleString('en-US')} chips`, `No. ${p.num}: scoreText`);
  for (const h of p.hands) {
    const top = Math.max(...h.win);
    ok(handBestChips(h) === chipsOf(top) && handChips(h, h.best) === handBestChips(h), `No. ${p.num}: best hold banks the most`);
    for (let m = 0; m < 32; m++) {
      const c = handChips(h, m);
      ok(Number.isInteger(c) && c >= 0 && c <= handBestChips(h), `No. ${p.num}: chips out of range`);
    }
  }
  // One hand a board, every hold, against the bank (rounded to 5 places).
  const h = p.hands[p.num % p.hands.length];
  for (let m = 0; m < 32; m++) {
    const y = holdWhy(h.cards, h.rivals, m);
    ok(Math.abs(y.win - h.win[m]) < 6e-6, `No. ${p.num} mask ${m}: holdWhy ${y.win} vs bank ${h.win[m]}`);
    ok(y.deck.length === 37, `No. ${p.num}: deck size`);
    if (y.draws > 0) {
      const mean = y.cond.reduce((a, b) => a + b, 0) / y.deck.length;
      ok(Math.abs(mean - y.win) < 1e-9, `No. ${p.num} mask ${m}: per-card chances do not average to the chance to win`);
      ok(y.cond.every((x) => x >= -1e-12 && x <= 1 + 1e-12), `No. ${p.num} mask ${m}: a chance out of range`);
    }
    if (y.draws === 1) {
      // Independent of the walk: finish the hand with each unseen card.
      const best = Math.max(...h.rivals.map(showScore));
      const held = heldCards(h.cards, m);
      const outs = y.deck.filter((c) => showScore([...held, c]) > best);
      const splits = y.deck.filter((c) => showScore([...held, c]) === best);
      ok(outs.join() === y.outs.join() && splits.join() === y.splits.join(), `No. ${p.num} mask ${m}: outs`);
      ok(y.blocked.every((c) => h.rivals.flat().includes(c) && showScore([...held, c]) >= best), `No. ${p.num} mask ${m}: blocked`);
    } else ok(!y.outs.length && !y.blocked.length, `No. ${p.num} mask ${m}: outs on a multi-card draw`);
  }
}
ok(scoreText('hold', 7, 10) === '7/10' && scoreText('hold', 12, 15) === '12/15', 'an older Hold row lost its fraction');
ok(scoreText('hold', 1, 300) === '1 chip' && scoreText('hold', 512, null) === '512 chips', 'chip wording');
ok(chipsOf(0.615) === 62 && chipsOf(0.6149) === 61 && chipsOf(1) === 100 && chipsOf(0) === 0, 'chipsOf rounding');

if (fails) { console.error(`verify-hold-chips: ${fails} of ${checks} checks FAILED`); process.exit(1); }
console.log(`verify-hold-chips: ${checks} checks OK over ${chip.length} chip boards`);
