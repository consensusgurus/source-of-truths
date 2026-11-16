// scripts/gen-dash-spec.mjs: the week's ramp and the restaurants for Dash, read by the generator
// (gen-dash.mjs) and the checker (verify-dash.mjs). Keyed by weekday (0 is Sunday); the intro board
// uses Monday's.
//               band        the night        town  orders shift bag  not ready at six   the best shift delivers   a plain plan falls short by
export const SPEC = {
  1: ['gentle', 'Quiet Night', [6, 5], 5, 60, 2, 0, [3, 4], 3],
  2: ['gentle', 'Dinner Shift', [6, 5], 6, 60, 2, 0, [4, 5], 3],
  3: ['gentle', 'Midweek Run', [6, 5], 6, 60, 2, 1, [4, 5], 4],
  4: ['moderate', 'Busy Night', [6, 6], 7, 90, 2, 2, [5, 6], 5],
  5: ['tough', 'Friday Rush', [6, 6], 8, 90, 2, 3, [5, 7], 6],
  6: ['tough', 'Saturday Night', [7, 6], 9, 90, 3, 3, [6, 8], 7],
  0: ['sunday', 'The Big Night', [7, 7], 10, 120, 3, 4, [7, 9], 8],
};
// name (twelve letters at most) and picture. Invented names, no real chains.
export const PLACES = [
  ["Sal's Slice", '🍕'], ['Patty Shack', '🍔'], ['Koi House', '🍣'], ['Luna Tacos', '🌮'], ['Golden Bowl', '🍜'], ['Green Fork', '🥗'],
  ['Wing Yard', '🍗'], ['Curry Leaf', '🍛'], ['Dumpling Den', '🥟'], ['Hero Subs', '🥪'], ['Bento Corner', '🍱'], ['Scoop Shop', '🍨'],
  ['Donut Dock', '🍩'], ['Burrito Bay', '🌯'], ['Pasta Nova', '🍝'], ['Falafel Stop', '🥙'], ['Fry House', '🍟'], ['Bagel Bench', '🥯'],
  ['Waffle Hut', '🧇'], ['Soup Pot', '🍲'],
];
