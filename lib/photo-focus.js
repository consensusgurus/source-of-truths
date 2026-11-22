// WHERE TO HOLD A JIG OR SAW PHOTO WHEN A PREVIEW CROPS IT (owner, 2026-11-22:
// "why do the kissing prairie dogs here run off the preview? can we fix that
// here and everywhere"). Previews are boxes of a fixed shape (the Jigsaw
// Puzzles cards are 4:3, the hero is very wide, a Private Mural pick is 8:5)
// and cover-crop the photo. Cropped from the middle, a square photo loses its
// top and bottom eighth and a tall Saw photo half its height, so heads, domes
// and birds ran off the top.
//
// The value is the vertical object-position in percent: 0 keeps the top edge,
// 50 is the middle, 100 keeps the bottom edge. A photo not listed sits at the
// default for its game: Jig photos are wide and crop little, so the middle;
// Saw photos are tall and their subject usually sits in the upper part.
// Set by eye from each full photo. A NEW photo that crops badly gets a line here.
// Previews only: the puzzle boards themselves keep their own cut.
export const PHOTO_FOCUS = {
  'jig-1': 30, 'jig-8': 0, 'jig-23': 40, 'jig-36': 40, 'jig-40': 25,
  'saw-1': 35, 'saw-2': 30, 'saw-3': 40, 'saw-4': 35, 'saw-5': 50, 'saw-6': 30, 'saw-7': 35,
  'saw-8': 35, 'saw-9': 50, 'saw-10': 30, 'saw-11': 50, 'saw-12': 25, 'saw-13': 45, 'saw-14': 50,
  'saw-15': 40, 'saw-16': 15,
};
const DEFAULT = { jig: 50, saw: 40 };

export function focusY(g, n) {
  const v = PHOTO_FOCUS[`${g}-${n}`];
  return typeof v === 'number' ? v : (DEFAULT[g] ?? 50);
}
// For a style prop: style={focusStyle('jig', 8)}
export function focusStyle(g, n) { return { objectPosition: `50% ${focusY(g, n)}%` }; }
