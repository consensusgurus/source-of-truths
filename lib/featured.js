// THE FEATURED POOL (owner, 2026-11-13 and 2026-11-15). FEATURED_KEYS is the
// Featured row on All Puzzles, in its order. FEATURED_RECENT is what left that
// row recently. Together they are the puzzles the phone home's Top Puzzles row
// leads with and the only ones the entry door's Top Puzzle tile may show.
// When a puzzle leaves the row, move its key to FEATURED_RECENT; when it is no
// longer recent, delete it there. See docs/claude/home-and-ui.md.
export const FEATURED_KEYS = ['pack', 'chef', 'mop', 'carmen'];   // Pack in, Sudoclue out (owner, 2026-11-14: five would wrap on desktop)
export const FEATURED_RECENT = ['sudoclue'];
