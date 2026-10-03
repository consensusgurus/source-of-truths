// FINISH SETS (owner, 2026-09-28): small, OVERLAPPING sets of three, used ONLY
// by the ending card (app/StageFinish.jsx) to keep a finisher playing. They are
// not the home's sets: lib/daily-groups.js still partitions each category for
// the home bands, the welcome and the Sunday ledger, and nothing here touches
// that.
//
// The rule, in the owner's words: when a game finishes, show the best set it
// belongs to (the one closest to done); once that set is done, serve the next
// closest. Because the sets overlap, almost every finish lands in a set that is
// already partly done, which is the whole point: "1 of 3 left" pulls harder
// than "1 of 17".
//
// Rules the verifier (scripts/verify-finish-sets.mjs) holds:
//   * every key is a real registry key, and every set shares ONE category, so
//     the flood's category rack can light the set's pips inside it;
//   * sets are 2 to 4 keys (a category of two is one set of two);
//   * no two sets hold the same keys;
//   * every live game is in at least one set.
// Names stand alone, because the card prints them with no category beside it.
// Order inside a set is display order only; the card hands over the QUICKEST
// open game first (lib/game-medians), not the first listed.
import { typicalSeconds } from './game-medians.js';

export const FINISH_SETS = [
  // Word
  { name: 'Crosswords', cat: 'Word', keys: ['emcee', 'encore', 'shards'] },
  { name: 'Small grids', cat: 'Word', keys: ['emcee', 'crux', 'glyph'] },
  { name: 'Clueless crosswords', cat: 'Word', keys: ['crux', 'glyph', 'anon'] },
  { name: 'Big word boards', cat: 'Word', keys: ['encore', 'babel', 'anon'] },
  { name: 'Letter racks', cat: 'Word', keys: ['tuck', 'babel', 'lode'] },
  { name: 'Word hunts', cat: 'Word', keys: ['lode', 'strata', 'shards'] },
  { name: 'Letter shuffles', cat: 'Word', keys: ['rung', 'garble', 'barter'] },
  { name: 'Word chains', cat: 'Word', keys: ['rung', 'hinge', 'links'] },
  { name: 'Word meanings', cat: 'Word', keys: ['links', 'warmer', 'stet'] },
  { name: 'Quick words', cat: 'Word', keys: ['garble', 'warmer', 'hinge'] },
  { name: 'Wordsmith mix', cat: 'Word', keys: ['stet', 'tuck', 'strata'] },
  { name: 'Trade and swap', cat: 'Word', keys: ['barter', 'links', 'emcee'] },
  // Logic
  { name: 'Traffic jams', cat: 'Logic', keys: ['park', 'impound', 'junkyard'] },
  { name: 'Whodunits', cat: 'Logic', keys: ['alibi', 'sworn', 'fib'] },
  { name: 'Liars and witnesses', cat: 'Logic', keys: ['hearsay', 'fib', 'sworn'] },
  { name: 'Grid drawing', cat: 'Logic', keys: ['etch', 'hedge', 'plot', 'duet'] },
  { name: 'Path finding', cat: 'Logic', keys: ['paths', 'hedge', 'plot'] },
  { name: 'Fit the pieces', cat: 'Logic', keys: ['snug', 'jester', 'plot'] },
  { name: 'Sorting puzzles', cat: 'Logic', keys: ['venn', 'docket', 'stands'] },
  { name: 'Rule finding', cat: 'Logic', keys: ['axiom', 'suffice', 'stands'] },
  { name: 'Deduction grids', cat: 'Logic', keys: ['docket', 'alibi', 'jester'] },
  { name: 'Slide and shift', cat: 'Logic', keys: ['chomp', 'park', 'junkyard'] },
  { name: 'Fill the grid', cat: 'Logic', keys: ['etch', 'snug', 'suffice', 'duet'] },
  { name: 'Quick logic', cat: 'Logic', keys: ['chomp', 'sworn', 'impound'] },
  { name: 'Testimony and rules', cat: 'Logic', keys: ['hearsay', 'axiom', 'venn'] },
  // Trivia
  { name: 'Trivia gauntlets', cat: 'Trivia', keys: ['streak', 'deep', 'sport'] },
  { name: 'Business and sport', cat: 'Trivia', keys: ['biz', 'sport', 'streak'] },
  { name: 'Words on screen', cat: 'Trivia', keys: ['quotes', 'script', 'thread'] },
  { name: 'Put it in order', cat: 'Trivia', keys: ['dating', 'listed', 'bracket'] },
  { name: 'Story trivia', cat: 'Trivia', keys: ['extra', 'thread', 'redact'] },
  { name: 'Picture trivia', cat: 'Trivia', keys: ['focus', 'redact', 'slot'] },
  { name: 'One topic deep', cat: 'Trivia', keys: ['niche', 'slot', 'deep'] },
  { name: 'Quick trivia', cat: 'Trivia', keys: ['dating', 'deep', 'bracket'] },
  { name: 'Quotes and business', cat: 'Trivia', keys: ['quotes', 'biz', 'listed'] },
  { name: 'Guess the picture', cat: 'Trivia', keys: ['focus', 'niche', 'script'] },
  // Sudoku
  { name: 'Classic sudokus', cat: 'Sudoku', keys: ['suds', 'sixes', 'diag'] },
  { name: 'Warm-up sudokus', cat: 'Sudoku', keys: ['sixes', 'whittle', 'suds'] },
  { name: 'Sum sudokus', cat: 'Sudoku', keys: ['cages', 'sando', 'frame'] },
  { name: 'Outside clues', cat: 'Sudoku', keys: ['frame', 'rim', 'towers'] },
  { name: 'Marked sudokus', cat: 'Sudoku', keys: ['mercury', 'polka', 'knight'] },
  { name: 'Odd-shaped sudokus', cat: 'Sudoku', keys: ['quilt', 'diag', 'knight'] },
  { name: 'Sudoku sampler', cat: 'Sudoku', keys: ['whittle', 'cages', 'towers'] },
  { name: 'Lines and dots', cat: 'Sudoku', keys: ['polka', 'mercury', 'quilt'] },
  { name: 'Edge sums', cat: 'Sudoku', keys: ['sando', 'rim', 'sixes'] },
  // Numbers
  { name: 'Mental math', cat: 'Numbers', keys: ['blitz', 'blitzed', 'calc'] },
  { name: 'Number grids', cat: 'Numbers', keys: ['sums', 'tally', 'carve'] },
  { name: 'Number puzzles', cat: 'Numbers', keys: ['cipher', 'crunch', 'calc'] },
  { name: 'Speed and sums', cat: 'Numbers', keys: ['blitz', 'sums', 'crunch'] },
  { name: 'Codes and cuts', cat: 'Numbers', keys: ['cipher', 'carve', 'blitzed'] },
  { name: 'Price and sums', cat: 'Numbers', keys: ['pricer', 'crunch', 'tally'] },
  { name: 'Big tickets', cat: 'Numbers', keys: ['dealer', 'realtor', 'curator'] },
  { name: 'Prices on the move', cat: 'Numbers', keys: ['agent', 'dealer', 'pricer'] },
  // End Game
  { name: 'Chess endings', cat: 'End Game', keys: ['mate', 'defend', 'queen'] },
  { name: 'Board endgames', cat: 'End Game', keys: ['four', 'check', 'turn'] },
  { name: 'Territory', cat: 'End Game', keys: ['chain', 'yose', 'turn'] },
  { name: 'Find the win', cat: 'End Game', keys: ['mate', 'four', 'chain'] },
  { name: 'Hold the line', cat: 'End Game', keys: ['defend', 'check', 'yose'] },
  // Geography
  { name: 'Maps and routes', cat: 'Geography', keys: ['span', 'ping', 'flank'] },
  { name: 'Countries', cat: 'Geography', keys: ['atlas', 'flank', 'ping', 'passport'] },
  // Cards
  { name: 'Card tables', cat: 'Cards', keys: ['taire', 'crib', 'hands'] },
  { name: 'Bridge and blackjack', cat: 'Cards', keys: ['finesse', 'shoe', 'hands'] },
  { name: 'Solitaire and cribbage', cat: 'Cards', keys: ['taire', 'crib', 'shoe'] },
  // Crowd Psychology
  { name: 'Read the crowd', cat: 'Crowd Psychology', keys: ['outwit', 'outrank', 'feud'] },
  // Arcade
  { name: 'Arcade', cat: 'Arcade', keys: ['sweep', 'blocks'] },
];

const secs = (k) => { const s = typicalSeconds(k); return s == null ? 600 : s; };

// The pick for a finish. `meKey` is the game just finished; `isDone(k)` says
// whether k is finished today (the caller counts meKey as done); `liveKeys` is
// the live roster, so a retired game drops out of every set on its own.
//
// Returns null when the game is in no set. Otherwise:
//   { set, open, complete: false }       the closest-to-done open set this game is in
//   { set, open: [], complete: true, next } every set this game is in is done;
//     `next` is the closest open set anywhere ({ set, open }), or null.
// `open` is ordered quickest first, which is what the hand-off serves.
export function finishPick(meKey, isDone, liveKeys) {
  const live = new Set(liveKeys);
  const sets = FINISH_SETS
    .map((s, i) => ({ ...s, i, keys: s.keys.filter((k) => live.has(k)) }))
    .filter((s) => s.keys.length >= 2);
  const openOf = (s) => s.keys.filter((k) => k !== meKey && !isDone(k)).sort((a, b) => secs(a) - secs(b) || a.localeCompare(b));
  const cost = (open) => open.reduce((t, k) => t + secs(k), 0);
  const withOpen = sets.map((s) => ({ s, open: openOf(s) }));
  const mine = withOpen.filter((x) => x.s.keys.includes(meKey));
  if (!mine.length) return null;
  const byClosest = (a, b) => (a.open.length - b.open.length)
    || ((b.s.keys.length - b.open.length) - (a.s.keys.length - a.open.length))
    || (cost(a.open) - cost(b.open))
    || (a.s.i - b.s.i);
  const openMine = mine.filter((x) => x.open.length).sort(byClosest);
  if (openMine.length) return { set: openMine[0].s, open: openMine[0].open, complete: false };
  // Every set this game is in is done. Show the biggest of them as the one
  // just finished, and serve the next closest open set: same category first,
  // then anywhere.
  const doneSet = mine.slice().sort((a, b) => (b.s.keys.length - a.s.keys.length) || (a.s.i - b.s.i))[0].s;
  const cat = doneSet.cat;
  const rest = withOpen.filter((x) => x.open.length && !x.s.keys.includes(meKey))
    .sort((a, b) => ((a.s.cat === cat ? 0 : 1) - (b.s.cat === cat ? 0 : 1)) || byClosest(a, b));
  const next = rest.length ? { set: rest[0].s, open: rest[0].open } : null;
  return { set: doneSet, open: [], complete: true, next };
}
