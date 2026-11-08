// Mutation test for scripts/verify-hold.mjs: break the real bank one way at a
// time and require the verifier to FAIL on every break. A checker that has
// never been shown to fail has not been tested.
//
//   node scripts/hold-mutation-test.mjs [word]   (only mutations whose name contains word)
//
// Each mutated bank is verified with --quick (the first hand of each day is
// recomputed), so every value mutation below lands on a first hand.
import { writeFileSync, mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';
import { PUZZLES } from '../app/hold/puzzles.js';

const dir = mkdtempSync(join(tmpdir(), 'hold-mut-'));
const clone = () => JSON.parse(JSON.stringify(PUZZLES));
const SD = (b) => b.filter((p) => p.showdown);
const weekday = (b, dow) => b.find((p) => new Date(`${p.live}T12:00:00Z`).getUTCDay() === dow);
const MUTATIONS = {
  'an ev nudged past tolerance': (b) => { const h = b[2].hands[0]; h.ev[7] = Math.round((h.ev[7] + 0.0004) * 1e5) / 1e5; },
  'best names a worse hold': (b) => { const h = b[3].hands[0]; h.best = h.best === 0 ? 1 : 0; },
  'gap misstated': (b) => { const h = b[4].hands[0]; h.gap = Math.round((h.gap + 0.01) * 1e5) / 1e5; },
  'trap flag flipped': (b) => { const h = b[5].hands[0]; h.trap = !h.trap; },
  'a card swapped (values now wrong)': (b) => { const h = b[6].hands[0]; let c = 0; while (h.cards.includes(c) || h.draw.includes(c)) c++; h.cards[0] = c; },
  'duplicate card in a hand': (b) => { const h = b[7].hands[0]; h.cards[1] = h.cards[0]; },
  'draw uses a dealt card': (b) => { const h = b[8].hands[1]; h.draw[0] = h.cards[0]; },
  'a hand repeated in the bank': (b) => { b[40].hands[3] = JSON.parse(JSON.stringify(b[9].hands[3])); },
  'shape reused within 21 days': (b) => {
    // Same ranks and suit pattern, suits relabelled (clubs <-> spades).
    const src = b[10].hands[2];
    const swap = (c) => { const s = Math.floor(c / 13), r = c % 13; const t = s === 0 ? 3 : s === 3 ? 0 : s; return t * 13 + r; };
    b[12].hands[2] = { ...JSON.parse(JSON.stringify(src)), cards: src.cards.map(swap), draw: src.draw.map(swap) };
  },
  'sunday lost a hand': (b) => { const p = b.find((x) => x.sunday); p.hands.pop(); },
  'sunday flag on a weekday': (b) => { const p = b.find((x) => !x.sunday); p.sunday = true; },
  'monday carries a trap': (b) => { const p = weekday(b, 1); const t = b.find((x) => x.hands.some((h) => h.trap)); const h = t.hands.find((x) => x.trap); p.hands[5] = JSON.parse(JSON.stringify(h)); },
  'quizId does not match its date': (b) => { b[20].quizId = b[21].quizId; },
  'dates not contiguous': (b) => { b[30].live = b[29].live; },
  'bank cut short': (b) => { b.pop(); },
  'ev stored to six places': (b) => { const h = b[14].hands[0]; h.ev[0] = h.ev[0] + 0.000001; },
  // Showdown days (showdown: true, from 2026-11-09).
  'showdown: a win chance nudged': (b) => { const h = SD(b)[1].hands[0]; h.win[9] = Math.round((h.win[9] + 0.0004) * 1e5) / 1e5; },
  'showdown: best names a worse hold': (b) => { const h = SD(b)[2].hands[0]; h.best = h.best === 0 ? 1 : 0; },
  'showdown: rival card changed (values now wrong)': (b) => { const h = SD(b)[3].hands[0]; const all = [...h.cards, ...h.rivals.flat(), ...h.draw]; let c = 0; while (all.includes(c)) c++; h.rivals[0][0] = c; },
  'showdown: rival holds a player card': (b) => { const h = SD(b)[4].hands[1]; h.rivals[1][2] = h.cards[0]; },
  'showdown: draw uses a rival card': (b) => { const h = SD(b)[5].hands[1]; h.draw[0] = h.rivals[0][0]; },
  'showdown: one rival only': (b) => { const h = SD(b)[6].hands[1]; h.rivals.pop(); },
  'showdown: vp hold misstated': (b) => { const h = SD(b)[7].hands[0]; h.vp = h.vp === 31 ? 30 : 31; },
  'showdown: trap flag flipped': (b) => { const h = SD(b)[8].hands[0]; h.trap = !h.trap; },
  'showdown: gap misstated': (b) => { const h = SD(b)[9].hands[0]; h.gap = Math.round((h.gap + 0.01) * 1e5) / 1e5; },
  'showdown: flag dropped from a day': (b) => { delete SD(b)[10].showdown; },
  'showdown: flag on a played day': (b) => { b[0].showdown = true; },
  'showdown: a classic hand slipped in': (b) => { SD(b)[11].hands[2] = JSON.parse(JSON.stringify(b[0].hands[2])); },
};

let caught = 0;
const missed = [];
const ONLY = process.argv[2] || '';
const RUN = Object.entries(MUTATIONS).filter(([n]) => n.includes(ONLY));
for (const [name, fn] of RUN) {
  const bank = clone();
  fn(bank);
  const file = join(dir, `${name.replace(/\W+/g, '-')}.mjs`);
  writeFileSync(file, `export const PUZZLES = ${JSON.stringify(bank)};\n`);
  const res = spawnSync(process.execPath, [new URL('./verify-hold.mjs', import.meta.url).pathname, '--quick'], { env: { ...process.env, VERIFY_HOLD_BANK: file }, encoding: 'utf8' });
  if (res.status !== 0) caught++; else missed.push(name);
}
console.log(`${caught}/${RUN.length} mutations caught`);
for (const m of missed) console.log(`MISSED  ${m}`);
process.exit(missed.length ? 1 : 0);
