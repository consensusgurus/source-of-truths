// THE SETS: every daily category of more than five games split into groups of
// three to five (owner, 2026-09-07), so the solved screen can say "2 of 3
// Crosswords today" rather than "2 of 17 Word", which nobody finishes.
//
// A category with five games or fewer (Geography, Crowd Psychology) has NO
// groups and is its own set; groupOf() returns null there and every reader
// falls back to the category. A category is either grouped in
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
  { name: 'Crosswords', cat: 'Word', keys: ['emcee', 'encore', 'shards', 'arcos', 'fill'] },
  { name: 'Word gauntlets', cat: 'Word', keys: ['gram', 'vocab', 'spell', 'origin', 'idiom'] },
  { name: 'Clueless crosswords', cat: 'Word', keys: ['crux', 'glyph', 'anon'] },
  { name: 'Letter tiles', cat: 'Word', keys: ['tuck', 'babel', 'lode', 'strata', 'scour'] },
  { name: 'Letter shuffles', cat: 'Word', keys: ['rung', 'garble', 'scram', 'barter'] },
  { name: 'Word meanings', cat: 'Word', keys: ['links', 'hinge', 'warmer', 'stet'] },
  // Logic (21)
  { name: 'Whodunits', cat: 'Logic', keys: ['alibi', 'sudoclue', 'fib', 'hearsay', 'sworn'] },
  { name: 'Grid drawing', cat: 'Logic', keys: ['etch', 'hedge', 'plot'] },
  { name: 'Grid filling', cat: 'Logic', keys: ['duet', 'lamps', 'snug', 'connect', 'mop'] },
  { name: 'Sorting puzzles', cat: 'Logic', keys: ['jester', 'judges', 'venn', 'defuse', 'chef'] },
  { name: 'Rule finding', cat: 'Logic', keys: ['axiom', 'suffice', 'stands', 'docket', 'ergo'] },
  // Visual (17): split out of Logic on 2026-11-12 (owner), with Focus from Trivia
  { name: 'Photo puzzles', cat: 'Visual', keys: ['jig', 'saw', 'swap', 'slide', 'spin'] },
  { name: 'Observation puzzles', cat: 'Visual', keys: ['spot', 'witness', 'focus'] },
  { name: 'Traffic jams', cat: 'Visual', keys: ['park', 'impound', 'junkyard'] },
  { name: 'Roll and route', cat: 'Visual', keys: ['topple', 'roll', 'chomp'] },
  { name: 'Pack and untangle', cat: 'Visual', keys: ['pack', 'tangled', 'paths'] },
  // Trivia (17 live)
  { name: 'Trivia gauntlets', cat: 'Trivia', keys: ['streak', 'biz', 'sport', 'quotes', 'script'] },
  { name: 'Classroom gauntlets', cat: 'Trivia', keys: ['sci', 'art', 'history', 'foodie'] },
  { name: 'Science gauntlets', cat: 'Trivia', keys: ['pulse', 'gene', 'orbit', 'eureka', 'bond'] },
  { name: 'Lists and rankings', cat: 'Trivia', keys: ['dating', 'listed', 'bracket'] },
  { name: 'Quiz mixes', cat: 'Trivia', keys: ['potluck', 'mixtape', 'mishmash'] },
  { name: 'Picture and story trivia', cat: 'Trivia', keys: ['extra', 'redact', 'thread', 'tape'] },
  { name: 'Single-topic trivia', cat: 'Trivia', keys: ['deep', 'niche', 'slot'] },
  { name: 'Guessing games', cat: 'Trivia', keys: ['clade', 'dossier', 'bacon', 'resume', 'filing'] },
  // Sudoku (39)
  { name: 'Classic sudokus', cat: 'Sudoku', keys: ['suds', 'sixes', 'giant', 'diag', 'whittle'] },
  { name: 'Edge clue sudokus', cat: 'Sudoku', keys: ['cages', 'sando', 'frame', 'rim', 'towers'] },
  { name: 'Marked sudokus', cat: 'Sudoku', keys: ['quilt', 'window', 'arrow', 'knight', 'racecar'] },
  { name: 'Order sudokus', cat: 'Sudoku', keys: ['mercury', 'polka', 'sumo', 'five'] },
  // The color twins, MercuryToo, GiantToo and the Small 6x6 sudokus (owner, 2026-11-08).
  { name: 'Color sudokus', cat: 'Sudoku', keys: ['sudstoo', 'sixestoo', 'gianttoo', 'diagtoo', 'windowtoo'] },
  { name: 'Color marked sudokus', cat: 'Sudoku', keys: ['knighttoo', 'racecartoo', 'rimtoo'] },
  { name: 'Color 6x6 and rainbow', cat: 'Sudoku', keys: ['mercurytoo', 'kayaktoo', 'liptoo'] },
  { name: 'Small sudokus', cat: 'Sudoku', keys: ['kayak', 'lip', 'fever', 'bout', 'dot'] },
  { name: 'Small sum sudokus', cat: 'Sudoku', keys: ['snack', 'coop', 'trim', 'dart'] },
  // Numbers (8: Pricer is not a registry row, it lives only in the server
  // slate, so it cannot be in a set and never reaches the finish's rack)
  { name: 'Mental math', cat: 'Numbers', keys: ['blitz', 'blitzed', 'calc', 'crunch'] },
  { name: 'Math Gauntlet', cat: 'Numbers', keys: ['gap', 'series', 'back'] },
  { name: 'Price Check', cat: 'Numbers', keys: ['pricer', 'dealer', 'realtor', 'agent', 'curator'] },
  { name: 'Number grids', cat: 'Numbers', keys: ['sums', 'carve', 'tally', 'cipher'] },
  // Table Games (19): Cards and End Game merged 2026-11-12 (owner). The card
  // sets, grouped from 2026-10-14, when Hold and Cell took Cards past five
  { name: 'Solitaire and poker', cat: 'Table Games', keys: ['taire', 'cell', 'mahj', 'hold', 'hands'] },
  { name: 'Card tables', cat: 'Table Games', keys: ['shoe', 'crib', 'finesse', 'pairs'] },
  // Arcade (6): grouped from 2026-11-07, when Simon took it past five
  { name: 'Action arcade', cat: 'Arcade', keys: ['snake', 'dario', 'blocks'] },
  { name: 'Puzzle arcade', cat: 'Arcade', keys: ['squash', 'sweep', 'simon'] },
  // The endgame sets of Table Games (10): Board endgames split on 2026-10-16, when Gift took it past five
  { name: 'Chess endings', cat: 'Table Games', keys: ['mate', 'defend', 'swindle', 'queen'] },
  { name: 'Board endgames', cat: 'Table Games', keys: ['four', 'gift', 'check'] },
  { name: 'Territory endgames', cat: 'Table Games', keys: ['chain', 'turn', 'yose'] },
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
