// THE SETS: every daily category of more than five games split into groups of
// three to five (owner, 2026-09-07), so the solved screen can say "2 of 3
// Crosswords today" rather than "2 of 17 Word", which nobody finishes.
//
// A category with five games or fewer (Geography, Cards, Crowd Psychology,
// Arcade) has NO groups and is its own set; groupOf() returns null there and
// every reader falls back to the category. A category is either grouped in
// full or not at all: scripts/verify-daily-groups.mjs fails a grouped category
// with a live game left out, and a group whose games do not share a category.
//
// NAMES STAND ALONE (owner, 2026-09-07): a set name is read off a home band
// or a finish card with no category beside it, so 'Classic' is not a name and
// 'Classic sudokus' is. Names are display strings only; renaming one touches
// nothing keyed.
//
// KEYS ARE REGISTRY KEYS, not routes or names (Parker is `park`, Jesters is
// `jester`). The order inside a group is the order its pips render in.
//
// Judgment calls, so the next session does not re-argue them: Strata could sit
// with the shuffles (it reads as a hunt); Stet is an editing game with no
// natural sibling and lives with Meaning; Towers is a skyscraper puzzle rather
// than a sudoku and sits with the two other edge-clue grids; Deep is a one-life
// gauntlet by shape but the gauntlet group was already at five. Circa is
// retired and absent; Extra retires 2026-09-29 and its group simply drops to
// three, since the finish reads the LIVE roster.

export const GROUPS = [
  // Word (17)
  { name: 'Crosswords', cat: 'Word', keys: ['emcee', 'encore', 'shards'] },
  { name: 'Clueless crosswords', cat: 'Word', keys: ['crux', 'glyph', 'anon'] },
  { name: 'Letter tiles', cat: 'Word', keys: ['tuck', 'babel', 'lode', 'strata'] },
  { name: 'Letter shuffles', cat: 'Word', keys: ['rung', 'garble', 'barter'] },
  { name: 'Word meanings', cat: 'Word', keys: ['links', 'hinge', 'warmer', 'stet'] },
  // Logic (18)
  { name: 'Traffic jams', cat: 'Logic', keys: ['park', 'impound', 'junkyard'] },
  { name: 'Whodunits', cat: 'Logic', keys: ['alibi', 'sworn', 'fib', 'hearsay'] },
  { name: 'Grid drawing', cat: 'Logic', keys: ['etch', 'hedge', 'plot', 'paths'] },
  { name: 'Sorting puzzles', cat: 'Logic', keys: ['jester', 'chomp', 'docket', 'venn'] },
  { name: 'Rule finding', cat: 'Logic', keys: ['axiom', 'suffice', 'stands'] },
  // Trivia (15 live)
  { name: 'Trivia gauntlets', cat: 'Trivia', keys: ['streak', 'biz', 'sport', 'quotes', 'script'] },
  { name: 'Ordering trivia', cat: 'Trivia', keys: ['dating', 'listed', 'bracket'] },
  { name: 'Picture and story trivia', cat: 'Trivia', keys: ['focus', 'extra', 'redact', 'thread'] },
  { name: 'Single-topic trivia', cat: 'Trivia', keys: ['deep', 'niche', 'slot'] },
  // Sudoku (11)
  { name: 'Classic sudokus', cat: 'Sudoku', keys: ['suds', 'sixes', 'diag', 'whittle'] },
  { name: 'Edge clue sudokus', cat: 'Sudoku', keys: ['cages', 'sando', 'towers'] },
  { name: 'Marked sudokus', cat: 'Sudoku', keys: ['quilt', 'mercury', 'polka', 'knight'] },
  // Numbers (8: Pricer is not a registry row, it lives only in the server
  // slate, so it cannot be in a set and never reaches the finish's rack)
  { name: 'Mental math', cat: 'Numbers', keys: ['blitz', 'blitzed', 'calc', 'crunch'] },
  { name: 'Number grids', cat: 'Numbers', keys: ['sums', 'carve', 'tally', 'cipher'] },
  // End Game (7)
  { name: 'Chess endings', cat: 'End Game', keys: ['mate', 'defend', 'queen'] },
  { name: 'Board endgames', cat: 'End Game', keys: ['four', 'check', 'chain', 'turn'] },
];

const BY_KEY = Object.fromEntries(GROUPS.flatMap((g) => g.keys.map((k) => [k, g])));

// The group a game belongs to, or null for a game in an ungrouped category.
export function groupOf(key) {
  return BY_KEY[key] || null;
}

// Every group in a category, in the order above. Empty for an ungrouped one.
export function groupsIn(cat) {
  return GROUPS.filter((g) => g.cat === cat);
}
