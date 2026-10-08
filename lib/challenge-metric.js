// THE FIGURE A CHALLENGE IS FOUGHT ON, PER GAME (owner, 2026-10-07).
//
// The challenge link first carried the CLOCK on a solve and score/total
// otherwise. That is right for a solve-or-not puzzle and wrong for most of the
// rest: a Hands run was sent as "2:19 to beat" when the run was 47 POINTS, and
// the 8/10 beside it is only a grade worked out from those points.
//
// Each game below names the one figure that decides a head-to-head, worked out
// game by game from how it scores and what its board ranks on. The client
// hands the finished run's value to LoftFinish as `challengeMetric`; it rides
// the link as its eighth part (lib/challenge.js) and the button, the landing
// page, the strip and the preview card all print it.
//
// A game NOT listed keeps the old rule, which is the right one for it:
//   - the clock, where the result is solved or not and the clock separates
//     solvers: every sudoku, the End Game titles, Emcee, Encore, Garble, Fib,
//     Glyph, Carve, Alibi, Sworn, Anon, Strata, Dario, Four;
//   - score/total, where the score IS the count a player knows and a perfect
//     is rare: the one-life quizzes (Streak, Deep, Atlas, Sport, Biz, Script,
//     Quotes, Blitz, Blitzed), Bracket, Crib, Stet, Axiom, Suffice, Docket,
//     Niche, Thread, Slot, Flank.
//
//   unit / one   plural and singular, as a player says it
//   dir          'high' when more is better, 'low' when less is
//   solveFirst   a solved run beats an unsolved one whatever the figure
//                (moves to solve, guesses to solve); the client passes null
//                on an unsolved run and the old rule applies to it
//   lead         the unit goes before the number ('cost 14', as Paths prints it)
//   pre          printed before the number ('$')
//   say          how the sentence reads, see metricLine (default: 'scored' for
//                more-is-better, 'in' for a solve)
export const CHALLENGE_METRIC = {
  // Points are the whole result.
  hands: { unit: 'points', one: 'point', dir: 'high' },
  tuck: { unit: 'points', one: 'point', dir: 'high' },
  babel: { unit: 'points', one: 'point', dir: 'high', signed: true },
  lode: { unit: 'points', one: 'point', dir: 'high' },
  shards: { unit: 'points', one: 'point', dir: 'high' },
  stands: { unit: 'points', one: 'point', dir: 'high' },
  outwit: { unit: 'points', one: 'point', dir: 'high' },
  outrank: { unit: 'points', one: 'point', dir: 'high' },
  feud: { unit: 'points', one: 'point', dir: 'high' },
  shoe: { unit: 'chips', one: 'chip', dir: 'high', say: 'finished' },
  sweep: { unit: 'cells', one: 'cell', dir: 'high', say: 'uncovered' },
  snake: { unit: 'apples', one: 'apple', dir: 'high', say: 'ate' },
  blocks: { unit: 'rows', one: 'row', dir: 'high', say: 'cleared' },
  whittle: { unit: 'clues left', one: 'clue left', dir: 'low', say: 'finished' },
  // Closeness: the board ranks the best guess's distance from the price.
  pricer: { unit: '% off', one: '% off', dir: 'low', say: 'was' },
  dealer: { unit: '% off', one: '% off', dir: 'low', say: 'was' },
  realtor: { unit: '% off', one: '% off', dir: 'low', say: 'was' },
  agent: { unit: '% off', one: '% off', dir: 'low', say: 'was' },
  curator: { unit: '% off', one: '% off', dir: 'low', say: 'was' },
  // How efficiently it was solved.
  barter: { unit: 'trades', one: 'trade', dir: 'low', solveFirst: true },
  park: { unit: 'moves', one: 'move', dir: 'low', solveFirst: true },
  junkyard: { unit: 'moves', one: 'move', dir: 'low', solveFirst: true },
  impound: { unit: 'moves', one: 'move', dir: 'low', solveFirst: true },
  chomp: { unit: 'moves', one: 'move', dir: 'low', solveFirst: true },
  taire: { unit: 'moves', one: 'move', dir: 'low', solveFirst: true },
  tally: { unit: 'moves', one: 'move', dir: 'low', solveFirst: true },
  rung: { unit: 'rungs', one: 'rung', dir: 'low', solveFirst: true },
  crunch: { unit: 'steps', one: 'step', dir: 'low', solveFirst: true },
  span: { unit: 'hops', one: 'hop', dir: 'low', solveFirst: true },
  paths: { unit: 'cost', one: 'cost', dir: 'low', solveFirst: true, lead: true, say: 'at' },
  // How few tries it took.
  crux: { unit: 'guesses', one: 'guess', dir: 'low', solveFirst: true },
  circa: { unit: 'guesses', one: 'guess', dir: 'low', solveFirst: true },
  ping: { unit: 'guesses', one: 'guess', dir: 'low', solveFirst: true },
  warmer: { unit: 'guesses', one: 'guess', dir: 'low', solveFirst: true },
  clade: { unit: 'guesses', one: 'guess', dir: 'low', solveFirst: true },
  dossier: { unit: 'guesses', one: 'guess', dir: 'low', solveFirst: true },
  redact: { unit: 'guesses', one: 'guess', dir: 'low', solveFirst: true },
  focus: { unit: 'guesses', one: 'guess', dir: 'low', solveFirst: true },
  dating: { unit: 'checks', one: 'check', dir: 'low', solveFirst: true },
  listed: { unit: 'submits', one: 'submit', dir: 'low', solveFirst: true },
  finesse: { unit: 'tries', one: 'try', dir: 'low', solveFirst: true },
  calc: { unit: 'tries', one: 'try', dir: 'low', solveFirst: true },
  // How few mistakes on the way.
  links: { say: 'with', unit: 'mistakes', one: 'mistake', dir: 'low', solveFirst: true },
  extra: { say: 'with', unit: 'tears', one: 'tear', dir: 'low', solveFirst: true },
  etch: { say: 'with', unit: 'errors', one: 'error', dir: 'low', solveFirst: true },
  hedge: { say: 'with', unit: 'errors', one: 'error', dir: 'low', solveFirst: true },
  plot: { say: 'with', unit: 'errors', one: 'error', dir: 'low', solveFirst: true },
  hearsay: { say: 'with', unit: 'wrong names', one: 'wrong name', dir: 'low', solveFirst: true },
  venn: { say: 'with', unit: 'rejected sheets', one: 'rejected sheet', dir: 'low', solveFirst: true },
};

export function metricDef(key) {
  return (key && CHALLENGE_METRIC[key]) || null;
}

// "47 points", "1 move", "3.2% off", "-6 points" (Babel's spread can be below zero).
export function fmtMetric(key, v) {
  const d = metricDef(key);
  const n = Number(v);
  if (!d || !Number.isFinite(n)) return '';
  const num = (d.pre || '') + (Number.isInteger(n) ? String(n) : n.toFixed(1));
  const unit = Math.abs(n) === 1 ? d.one : d.unit;
  if (d.lead) return `${unit} ${num}`;
  return unit.startsWith('%') ? num + unit : `${num} ${unit}`;
}

// THE SENTENCE, on the preview card, the landing page and the strip:
//   Gator85 scored 47 points on Hands.     Gator85 solved Barter in 3 trades.
//   Gator85 solved Links with 1 mistake.   Gator85 was 3.2% off on Dealer.
//   Gator85 finished Whittle with 2 clues left.   Gator85 ate 30 apples on Snake.
// `game` may be a name or "this board".
export function metricLine(key, name, game, fig) {
  const d = metricDef(key);
  const say = (d && d.say) || (d && d.dir === 'high' ? 'scored' : 'in');
  if (say === 'in') return `${name} solved ${game} in ${fig}.`;
  if (say === 'with') return `${name} solved ${game} with ${fig}.`;
  if (say === 'finished') return `${name} finished ${game} with ${fig}.`;
  if (say === 'at') return `${name} solved ${game} at ${fig}.`;
  if (say === 'was') return `${name} was ${fig} on ${game}.`;
  return `${name} ${say} ${fig} on ${game}.`;
}
