// GAME FAMILIES (owner, 2026-11-05: "why wouldn't this show Encore anywhere?
// that's the most closely aligned"). A family is a set of dailies a player of
// one would naturally play next: the same kind of puzzle, not just the same
// skill tag. Order inside a family is closeness, so the nearest relative of a
// game is the member listed next to it (Emcee's is Encore, Encore's is Emcee).
//
// Used twice:
//   1. The day board (api/quiz/daily-combined) always offers a family member
//      that passes the easiest-points filters, even outside the top eight, and
//      prices it from the player's own place on the puzzle just played rather
//      than the middle of the field (a 0:42 Emcee predicts a strong Encore).
//   2. The puzzle ending shows that relative beside the big next play.
// Registry keys, not routes. A game sits in one family only.
export const FAMILIES = [
  // Word
  ['emcee', 'encore', 'glyph', 'crux', 'shards', 'arcos', 'anon'],
  ['garble', 'scram', 'barter', 'rung', 'hinge'],
  ['tuck', 'babel', 'lode'],
  ['strata', 'scour', 'fill'],
  ['links', 'warmer', 'stet'],
  ['gram', 'vocab', 'spell', 'origin', 'idiom'],
  // Sudoku
  ['suds', 'sudstoo', 'sixes', 'sixestoo', 'diag', 'diagtoo', 'window', 'windowtoo', 'knight', 'knighttoo', 'giant', 'gianttoo', 'quilt', 'sumo', 'bout', 'five', 'racecar', 'racecartoo', 'kayak', 'kayaktoo', 'mercury', 'mercurytoo', 'fever', 'arrow', 'dart', 'cages', 'coop', 'sando', 'snack', 'frame', 'trim', 'rim', 'rimtoo', 'lip', 'liptoo', 'towers', 'polka', 'dot', 'whittle'],
  // Logic
  ['alibi', 'sudoclue', 'sworn', 'hearsay', 'fib', 'witness'],
  ['park', 'impound', 'junkyard'],
  ['topple', 'roll', 'chomp', 'tangled'],
  ['jig', 'saw', 'swap', 'slide', 'spin', 'snug', 'spot'],
  // Jesters and Judges are one puzzle (one seat vs two per row, column and
  // court): each is the other's nearest relative (owner, 2026-11-07).
  ['jester', 'judges', 'lamps', 'duet', 'hedge', 'etch', 'plot', 'connect', 'paths', 'mop'],
  ['axiom', 'ergo', 'docket', 'suffice', 'venn', 'stands', 'defuse', 'chef'],
  // End Game
  ['mate', 'defend', 'swindle', 'queen'],
  ['four', 'check', 'turn', 'yose', 'gift', 'chain'],
  // Cards
  ['taire', 'cell', 'mahj', 'pairs'],
  ['crib', 'hold', 'hands', 'finesse', 'shoe'],
  // Numbers
  ['pricer', 'dealer', 'realtor', 'agent', 'curator'],
  ['blitz', 'blitzed', 'calc', 'crunch'],
  ['tally', 'carve', 'sums', 'cipher'],
  ['gap', 'series', 'back'],
  // Crowd Psychology
  ['outwit', 'outrank', 'feud', 'herd'],
  // Arcade
  ['snake', 'squash', 'simon', 'blocks', 'sweep', 'dario'],
  // Geography
  ['span', 'flank', 'ping', 'atlas', 'carmen'],
  // Trivia
  ['dating', 'circa', 'listed', 'bracket', 'slot'],
  ['thread', 'focus', 'script', 'redact', 'dossier', 'clade', 'tape', 'bacon', 'resume', 'filing'],
];

const FAMILY_OF = new Map();
FAMILIES.forEach((f) => f.forEach((k) => { if (!FAMILY_OF.has(k)) FAMILY_OF.set(k, f); }));

/** The other members of `key`'s family, nearest first (by distance in the list). */
export function relativesOf(key) {
  const f = FAMILY_OF.get(key);
  if (!f) return [];
  const i = f.indexOf(key);
  return f.filter((k) => k !== key).sort((a, b) => Math.abs(f.indexOf(a) - i) - Math.abs(f.indexOf(b) - i) || f.indexOf(a) - f.indexOf(b));
}

/** True when `a` and `b` are in the same family. */
export function sameFamily(a, b) {
  const f = FAMILY_OF.get(a);
  return !!f && a !== b && f.includes(b);
}
