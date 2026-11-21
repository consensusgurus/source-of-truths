// JIGSAW SIZES (owner, 2026-11-21: the jigsaw portal "with toggles for piece
// count", then "why can't piece count go higher up to mural count?" and "if it
// doesn't work on larger sizes, make it unavailable ... Greyed").
//
// Shared by the portal (/jig/shelf), the free-play board (/jig/big) and the
// route that works out each photo's biggest size (/api/jigsaw/fit). No imports,
// so it is safe in a client bundle.
//
// A size is a NOMINAL piece count; the cut is the nearest whole grid that keeps
// the photo's own shape, so 4,000 on a wide Jig photo is 71 x 56 = 3,976.
// The daily's own size (Jig 80, Saw 77 or 80) opens the ordinary archived board
// (/jig?p=N, /saw?p=N); every other size plays on the Mural board, built alone,
// nothing scored, kept in the browser.

export const JIGSAW_SIZES = [24, 48, 80, 150, 300, 500, 1000, 2000, 4000];
// Every size up to here works on every photo; only bigger ones can be greyed.
export const ALWAYS_OK = 300;
// Phones show a shorter row (a size picked on a computer still applies).
export const PHONE_SIZES = [24, 48, 80, 300, 1000, 4000];
export const DEFAULT_SIZE = 80;
export const SIZE_KEY = 'sot_jigsaw_size';
// Finished free-play sizes, this browser only: { 'jig-12-2000': 1, ... }.
export const DONE_KEY = 'sot_jigsaw_done';

export const sizeLabel = (s) => Number(s).toLocaleString('en-US');
export const shortSize = (s) => (s >= 1000 ? `${s / 1000}K` : String(s));

// The grid for a nominal size on a photo whose daily cut is c0 x r0.
export function cutFor(size, c0, r0) {
  const a = c0 / r0;
  let cols = Math.max(2, Math.round(Math.sqrt(size * a)));
  let rows = Math.max(2, Math.round(size / cols));
  // Keep the long side on the photo's long side.
  if ((a >= 1) !== (cols >= rows)) [cols, rows] = [rows, cols];
  return { cols, rows };
}

// The size chip that stands for the daily's own cut (77 is the 80 chip).
export function ownSize(c0, r0) {
  const n = c0 * r0;
  let best = JIGSAW_SIZES[0];
  for (const s of JIGSAW_SIZES) if (Math.abs(s - n) < Math.abs(best - n)) best = s;
  return best;
}

// Where a photo opens at a size. `b` is { g, n, c, r }.
export function playHref(b, size) {
  if (size === ownSize(b.c, b.r)) return `/${b.g}?p=${b.n}`;
  return `/jig/big?g=${b.g}&n=${b.n}&pieces=${size}`;
}

// The Mural board's id for a free-play copy; also its save key's suffix.
export const freeId = (g, n, size) => `photo-${g}-${n}-${size}`;

// RESOLUTION: a piece needs this many source pixels across, or it smears when
// zoomed (the Mural board's own floor, see SHARPNESS in app/mural/engine.js:
// 3840 / 80 = 48). DETAIL: the share of plain pieces (almost no texture) a size
// may have; big boards of sky or water are the ones that are no fun.
export const MIN_PIECE_PX = 40;
export const PLAIN_LIMIT = { 500: 0.6, 1000: 0.5, 2000: 0.4, 4000: 0.3 };
// The biggest flat one-colour patch (a sky, a lake), as a share of the board.
// Tuned 2026-11-21 on the live photos: a castle under a clear sky still does
// 1,000, a lake from above stops at 500, rice terraces go all the way.
export const FLAT_BLOCK_LIMIT = { 500: 0.3, 1000: 0.15, 2000: 0.08, 4000: 0.04 };
