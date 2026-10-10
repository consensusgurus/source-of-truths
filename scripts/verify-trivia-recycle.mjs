// scripts/verify-trivia-recycle.mjs - the gate for RECYCLED trivia questions
// (owner, 2026-10-09; rules in scripts/trivia-recycle.mjs). Picked up by
// verify-all. Two halves:
//   1. every play snapshot in scripts/trivia-recycle/ parses: known game,
//      well-formed quizId of a day that exists, best inside 0..day length;
//   2. a selftest that feeds checkRecycled synthetic banks and proves every
//      rule goes red on purpose (a check that has never gone red is untested).
// The per-bank proof of each real recycle runs inside each game's own
// verifier (verify-streak/atlas/sport/biz/quotes/script).
import { checkRecycled, loadSnapshots, loadBank, GAMES } from './trivia-recycle.mjs';

let snapBad = 0;
const snaps = loadSnapshots();
if (!snaps.length) { console.error('FAIL no play snapshot in scripts/trivia-recycle/'); snapBad++; }
for (const s of snaps) {
  for (const [quizId, best] of s.best) {
    const g = quizId.split('-')[0];
    if (!GAMES.includes(g)) { console.error(`FAIL ${s.date}: ${quizId}: unknown game`); snapBad++; continue; }
    const { PUZZLES } = await loadBank(g);
    const p = PUZZLES.find((x) => x.quizId === quizId);
    if (!p) { console.error(`FAIL ${s.date}: ${quizId}: no such day`); snapBad++; continue; }
    if (p.live > s.date) { console.error(`FAIL ${s.date}: ${quizId} goes live ${p.live}, after the snapshot`); snapBad++; }
    if (!Number.isInteger(best) || best < 0 || best > p.qids.length) { console.error(`FAIL ${s.date}: ${quizId}=${best} is outside 0..${p.qids.length}`); snapBad++; }
  }
  console.log(`snapshot ${s.date}: ${s.best.size} days`);
}
if (snapBad) process.exit(1);

const day = (game, num, live, n, extra = {}) => ({
  num, live, quizId: `${game}-${Number(live.slice(5, 7))}-${Number(live.slice(8))}-26`,
  qids: Array.from({ length: n }, (_, i) => `d${String(num).padStart(2, '0')}q${String(i + 1).padStart(2, '0')}`), ...extra,
});
const qOf = (id, tier, cat, stem, ans, extra = {}) => ({ id, cat, tier, q: stem, choices: [ans, 'W1', 'W2', 'W3'], correct: 0, ...extra });

// Atlas-shaped bank: day 1 (Sep 1) of 5 questions, day 2 (Oct 20) recycles.
function atlas(mut = (x) => x) {
  const P = [day('atlas', 1, '2026-09-01', 5), day('atlas', 2, '2026-10-20', 5), day('atlas', 3, '2026-10-21', 5)];
  const Q = [];
  for (const p of P) p.qids.forEach((id, i) => Q.push(qOf(id, i + 1, 'Capitals', `Stem ${id}?`, `Ans ${id}`)));
  return mut({ PUZZLES: P, QUESTIONS: Q });
}
// best 2 on Sep 1: positions 1-2 right, 3 the miss, 4-5 NEVER answered.
const snap = (date, best = 2) => ({ date, best: new Map([['atlas-9-1-26', best], ['deep-9-1-26', 1]]) });
const SNAPS = [snap('2026-10-09')];
const recycle = (bank, slot, origId, patch = {}) => {
  const q = bank.QUESTIONS.find((x) => x.id === slot);
  const o = bank.QUESTIONS.find((x) => x.id === origId);
  Object.assign(q, { q: o.q, choices: [...o.choices], correct: o.correct, tier: o.tier, cat: o.cat, from: `atlas:${origId}` }, patch);
  return bank;
};

let bad = 0;
async function expect(name, wantRed, args) {
  const { errs } = await checkRecycled({ snapshots: SNAPS, ...args });
  const red = errs.length > 0;
  if (red !== wantRed) { bad++; console.error(`SELFTEST FAIL: ${name}: expected ${wantRed ? 'red' : 'green'}, got ${red ? errs.join(' | ') : 'green'}`); }
  else console.log(`ok  ${name}${red ? `  (${errs[0]})` : ''}`);
}

await expect('legit recycle, position 4 never answered', false, { game: 'atlas', ...atlas((b) => recycle(b, 'd02q04', 'd01q04')) });
await expect('position 3 was the miss, so it was seen', true, { game: 'atlas', ...atlas((b) => recycle(b, 'd02q03', 'd01q03')) });
await expect('stem changed', true, { game: 'atlas', ...atlas((b) => recycle(b, 'd02q04', 'd01q04', { q: 'Other stem?' })) });
await expect('answer changed', true, { game: 'atlas', ...atlas((b) => recycle(b, 'd02q04', 'd01q04', { choices: ['Other', 'W1', 'W2', 'W3'] })) });
await expect('tier changed', true, { game: 'atlas', ...atlas((b) => recycle(b, 'd02q04', 'd01q04', { tier: 3 })) });
await expect('lane changed', true, { game: 'atlas', ...atlas((b) => recycle(b, 'd02q04', 'd01q04', { cat: 'Flags' })) });
await expect('same original recycled twice', true, { game: 'atlas', ...atlas((b) => recycle(recycle(b, 'd02q04', 'd01q04'), 'd03q04', 'd01q04')) });
await expect('cross-game from (sport into atlas)', true, { game: 'atlas', ...atlas((b) => recycle(b, 'd02q04', 'd01q04', { from: 'sport:d01q04' })) });
await expect('bad from shape', true, { game: 'atlas', ...atlas((b) => recycle(b, 'd02q04', 'd01q04', { from: 'atlas-d01q04' })) });
await expect('original day under 14 days old on the snapshot', true, { game: 'atlas', snapshots: [snap('2026-09-10')], ...atlas((b) => recycle(b, 'd02q04', 'd01q04')) });
await expect('snapshot taken after the copy went live is no proof', true, { game: 'atlas', snapshots: [snap('2026-10-25')], ...atlas((b) => recycle(b, 'd02q04', 'd01q04')) });
await expect('older snapshot still proves it after a newer one shows it answered', false, { game: 'atlas', snapshots: [snap('2026-10-09'), snap('2026-10-15', 5)], ...atlas((b) => recycle(b, 'd02q04', 'd01q04')) });

// Deep -> Streak.
const deep = { PUZZLES: [day('deep', 1, '2026-09-01', 5, { topic: 'Ancient Rome' })], QUESTIONS: [] };
deep.PUZZLES[0].qids.forEach((id, i) => deep.QUESTIONS.push(qOf(id, i + 1, undefined, `Deep ${id}?`, `DAns ${id}`)));
function streak(slots) {
  const P = [day('streak', 1, '2026-10-20', 6)];
  const Q = P[0].qids.map((id) => qOf(id, 5, 'History', `Streak ${id}?`, `SAns ${id}`));
  slots.forEach(([slot, from, patch = {}]) => {
    const q = Q.find((x) => x.id === slot); const o = deep.QUESTIONS.find((x) => x.id === from.split(':')[1]);
    Object.assign(q, { q: 'A rewritten, self-contained stem?', choices: [...o.choices], correct: o.correct, from }, patch);
  });
  return { PUZZLES: P, QUESTIONS: Q };
}
const DS = [{ date: '2026-10-09', best: new Map([['deep-9-1-26', 1]]) }];   // deep positions 3-5 never answered
const dx = (name, red, slots) => expect(name, red, { game: 'streak', snapshots: DS, sources: { deep }, ...streak(slots) });
await dx('Deep into Streak tier 5, stem rewritten', false, [['d01q01', 'deep:d01q03']]);
await dx('Deep into Streak tier 4', true, [['d01q01', 'deep:d01q03', { tier: 4 }]]);
await dx('Deep answer changed', true, [['d01q01', 'deep:d01q03', { choices: ['Else', 'W1', 'W2', 'W3'] }]]);
await dx('three Deep questions on one Streak day', true, [['d01q01', 'deep:d01q03'], ['d01q02', 'deep:d01q04'], ['d01q03', 'deep:d01q05']]);
await dx('Deep question that was answered', true, [['d01q01', 'deep:d01q02']]);
await expect('Deep into Atlas', true, { game: 'atlas', snapshots: DS, sources: { deep }, ...atlas((b) => recycle(b, 'd02q04', 'd01q04', { from: 'deep:d01q03' })) });

if (bad) { console.error(`${bad} selftest case(s) wrong`); process.exit(1); }
console.log('trivia-recycle selftest: every rule fires');
