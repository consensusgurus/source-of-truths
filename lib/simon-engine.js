// Simon, the engine. Pure and deterministic, no DOM.
//
// Shared on purpose: app/simon/SimonClient.jsx plays from this and
// scripts/verify-simon.mjs proves the day's sequence from the SAME code, so a
// checker can never pass a sequence the game does not actually show.
//
// The rules, in full (owner, 2026-11-07):
//   - Nine pads in a 3x3 grid. The game lights a sequence of pads, one at a
//     time, and the player taps them back in the same order.
//   - Every round repeats the whole sequence so far and adds ONE pad to the end.
//   - One wrong tap ends the run. The score is the longest sequence repeated in
//     full (rounds completed).
//   - THE PACE NEVER CHANGES. Every pad is lit for LIT_MS with GAP_MS between,
//     from round one to the last. No sound at all.
//
// THE SEQUENCE IS THE DAY'S. dayPlan(quizId) is a fixed list of pads, identical
// for every player, far longer than any run. The same pad never lights three
// times running, which reads as a stall rather than a sequence.

export const PADS = 9;
export const PLAN_LEN = 200;
export const LIT_MS = 520;     // how long a pad stays lit during the show
export const GAP_MS = 180;     // the dark beat between two pads
export const LEAD_MS = 700;    // the pause before a round's show begins
export const TAP_MS = 180;     // the flash a tapped pad gives back

export function hashStr(s) {
  let h = 2166136261 >>> 0;
  for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); }
  return h >>> 0;
}
function rng(seed) {
  let a = seed >>> 0;
  return function () {
    a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// The day's pads, 0..8 in reading order.
export function dayPlan(quizId, count = PLAN_LEN, pads = PADS) {
  const r = rng(hashStr('simon:' + quizId)), out = [];
  while (out.length < count) {
    const i = Math.floor(r() * pads);
    const n = out.length;
    if (n >= 2 && out[n - 1] === i && out[n - 2] === i) continue;
    out.push(i);
  }
  return out;
}

// How long the show of a round lasts, start to the moment input opens.
export function showMs(round) { return LEAD_MS + round * LIT_MS + Math.max(0, round - 1) * GAP_MS; }

// A run: `round` is the length being shown or asked for, `pos` how many of it
// have been tapped back, `score` the longest sequence repeated in full.
export function newGame(plan) {
  return { plan, round: 1, pos: 0, score: 0, taps: 0, alive: true, miss: null };
}

// One tap. Returns 'ok' (right pad, round continues), 'round' (right pad, the
// round is complete and the next one is one longer), or 'miss' (run over).
export function press(e, pad) {
  if (!e.alive) return 'dead';
  e.taps += 1;
  const want = e.plan[e.pos];
  if (pad !== want) { e.alive = false; e.miss = { pad, want, at: e.pos }; return 'miss'; }
  e.pos += 1;
  if (e.pos >= e.round) {
    e.score = e.round;
    e.round += 1;
    e.pos = 0;
    if (e.round > e.plan.length) { e.alive = false; return 'round'; }
    return 'round';
  }
  return 'ok';
}

// The pads of the round being shown.
export function roundPads(e) { return e.plan.slice(0, e.round); }
