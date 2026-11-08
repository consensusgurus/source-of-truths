// THE COLOUR SUDOKUS (owner, 2026-11-08). Seven twins of the numbers sudokus
// play the same rules with colors in place of digits: SixesToo, SudsToo, DiagToo,
// WindowToo, KnightToo, RacecarToo, RimToo. Their banks are built from the originals by
// scripts/gen-colour-twins.mjs (21 days later, moved and relabelled) and
// checked by scripts/colour-twins-verify.mjs. Internally every board is still
// digits 1..n; only the paint changes, so scoring, saves, hints and posting are
// the numbers clients' own, untouched.
//
// THE PALETTE is the site's own pastels (owner, 2026-11-07: boards use the
// softer home-tile tones, not the raw ramp steps), in the REGION_RAMP spread
// order so neighbouring digits never sit near each other in hue, and with gold,
// orange and amber kept apart (amber is left out: it reads as gold). Light look:
// the step mixed 60/40 with white (sitePastelHex); dark looks: the raw step.
//
// THE LOOK (approved mockup https://claude.ai/artifact/Bhi1ZCnfeLnYC73ogwjy83):
// every colored square fills edge to edge, a printed clue is marked by a darker
// inset outline (owner, 2026-11-08, replacing the inset-tile entries), notes are dots in a fixed spot per color, the selected
// square is an ink ring (not the accent fill, which would hide its color) and
// the lit row, column and box are a neutral grey (the periwinkle tint is one of
// the nine colors). A Shapes tool adds a faint ink mark per color for
// color-blind players.
export const COLOURS = [
  { name: 'Sky', dk: '#7dd3fc', lt: '#b1e5fd' },
  { name: 'Gold', dk: '#e8b43a', lt: '#f1d289' },
  { name: 'Mint', dk: '#6ee7b7', lt: '#a8f1d4' },
  { name: 'Rose', dk: '#fb7185', lt: '#fdaab6' },
  { name: 'Violet', dk: '#c084fc', lt: '#d9b5fd' },
  { name: 'Lime', dk: '#bef264', lt: '#d8f7a2' },
  { name: 'Magenta', dk: '#e879f9', lt: '#f1b0fb' },
  { name: 'Periwinkle', dk: '#a5b4fc', lt: '#c9d2fd' },
  { name: 'Orange', dk: '#fb923c', lt: '#fdbd92' },
];
export const COLOUR_TWINS = ['sixestoo', 'sudstoo', 'diagtoo', 'windowtoo', 'knighttoo', 'racecartoo', 'rimtoo', 'kayaktoo', 'liptoo', 'gianttoo'];
export const isColourTwin = (key) => COLOUR_TWINS.includes(key);

// The light pastels for n colors (the dark steps are picked by SudokuBoard).
export const colourPalette = (n) => COLOURS.slice(0, n).map((c) => c.lt);
export const colourPaletteDark = (n) => COLOURS.slice(0, n).map((c) => c.dk);
export const colourName = (d) => (COLOURS[d - 1] ? COLOURS[d - 1].name : String(d));

// One ink mark per color, in a 24-unit box, for the Shapes tool.
export const COLOUR_SHAPES = [
  'M12 4a8 8 0 1 0 0.01 0z',
  'M12 3L21 20H3z',
  'M4 4h16v16H4z',
  'M12 2L22 12L12 22L2 12z',
  'M9 2h6v7h7v6h-7v7H9v-7H2V9h7z',
  'M12 2l2.9 6.6 7.1.7-5.4 4.7 1.6 7-6.2-3.7-6.2 3.7 1.6-7L2 9.3l7.1-.7z',
  'M12 21L3 4h18z',
  'M3 9h18v6H3z',
  'M7 3h10l5 9-5 9H7l-5-9z',
];
export const SHAPES_KEY = 'sot_colour_shapes';

// MERCURYTOO (owner, 2026-11-08): Mercury's thermometers in color, where "bigger"
// means "further along the rainbow". The nine site pastels in hue order, so the
// order reads at a glance: red, orange, yellow, lime, green, sky, periwinkle,
// violet, magenta. The pad prints them in this order.
export const RAINBOW = [
  { name: 'Red', dk: '#fb7185', lt: '#fdaab6' },
  { name: 'Orange', dk: '#fb923c', lt: '#fdbd92' },
  { name: 'Yellow', dk: '#e8b43a', lt: '#f1d289' },
  { name: 'Lime', dk: '#bef264', lt: '#d8f7a2' },
  { name: 'Green', dk: '#6ee7b7', lt: '#a8f1d4' },
  { name: 'Sky', dk: '#7dd3fc', lt: '#b1e5fd' },
  { name: 'Periwinkle', dk: '#a5b4fc', lt: '#c9d2fd' },
  { name: 'Violet', dk: '#c084fc', lt: '#d9b5fd' },
  { name: 'Magenta', dk: '#e879f9', lt: '#f1b0fb' },
];
export const rainbowPalette = () => RAINBOW.map((c) => c.lt);
export const rainbowPaletteDark = () => RAINBOW.map((c) => c.dk);
export const rainbowName = (d) => (RAINBOW[d - 1] ? RAINBOW[d - 1].name : String(d));

// GIANTTOO (owner, 2026-11-08: "trying a giant could be interesting with colors
// only", then "closer to pastels"). Sixteen colors as EIGHT families, each in a
// soft pastel (digits 1 to 8, the site's pastels) and a brighter pastel of the
// same hue (digits 9 to 16). The pad prints them two rows of eight with each
// family in one column, so a color is "which family, then soft or bright".
// Approved mockup: https://claude.ai/artifact/NVZt9ck6ByvFMJSUUhfzie
export const GIANT_COLOURS = [
  { name: 'Soft rose', c: '#fdaab6' }, { name: 'Soft orange', c: '#fdbd92' },
  { name: 'Soft yellow', c: '#f7e08a' }, { name: 'Soft green', c: '#a8f1d4' },
  { name: 'Soft blue', c: '#b1e5fd' }, { name: 'Soft violet', c: '#d9b5fd' },
  { name: 'Soft pink', c: '#f1b0fb' }, { name: 'Soft grey', c: '#cbd2dc' },
  { name: 'Bright rose', c: '#f7708a' }, { name: 'Bright orange', c: '#f99a52' },
  { name: 'Bright yellow', c: '#eab308' }, { name: 'Bright green', c: '#3ccf99' },
  { name: 'Bright blue', c: '#5aaef5' }, { name: 'Bright violet', c: '#a88bf8' },
  { name: 'Bright pink', c: '#e27ff2' }, { name: 'Bright grey', c: '#8b97aa' },
];
export const giantPalette = () => GIANT_COLOURS.map((x) => x.c);
export const giantName = (d) => (GIANT_COLOURS[d - 1] ? GIANT_COLOURS[d - 1].name : String(d));

// THE SUDOKU PAGE FILTERS (owner, 2026-11-08: "the sudoku category page should
// have a toggle for 6x6, 9x9, color/number"). Size of each sudoku's grid and
// whether it is played in color. Giant (16x16) and Towers (5x5 and 7x7) show
// under All only. A new sudoku must be added here or it shows under All only.
export const SUDOKU_SIZE = {
  sixes: 6, sixestoo: 6, whittle: 6, kayak: 6, kayaktoo: 6, lip: 6, liptoo: 6,
  fever: 6, snack: 6, coop: 6, dart: 6, trim: 6, bout: 6, dot: 6,
  suds: 9, sudstoo: 9, quilt: 9, cages: 9, sando: 9, mercury: 9, mercurytoo: 9, arrow: 9, polka: 9,
  knight: 9, knighttoo: 9, diag: 9, diagtoo: 9, frame: 9, rim: 9, rimtoo: 9, sumo: 9, window: 9,
  windowtoo: 9, five: 9, racecar: 9, racecartoo: 9,
  giant: 16, gianttoo: 16,
};
export const SUDOKU_COLOUR = new Set(['sixestoo', 'sudstoo', 'diagtoo', 'windowtoo', 'knighttoo', 'racecartoo', 'rimtoo', 'mercurytoo', 'kayaktoo', 'liptoo', 'gianttoo']);
