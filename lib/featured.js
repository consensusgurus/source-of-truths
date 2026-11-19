// THE FEATURED POOL (owner, 2026-11-13 and 2026-11-15). FEATURED_KEYS is the
// Featured row on All Puzzles, in its order. FEATURED_RECENT is what left that
// row recently. Together they are the puzzles the phone home's Top Puzzles row
// leads with and the only ones the entry door's Top Puzzle tile may show.
// When a puzzle leaves the row, move its key to FEATURED_RECENT; when it is no
// longer recent, delete it there. See docs/claude/home-and-ui.md.
// Machine and Plow in (owner, 2026-11-18); Crate in beside Machine the same day
// ("crate and machine need to go in featured"). The row is no longer capped at four:
// these lead, and the home fills the rest of the row with the newest and most
// popular non-run puzzles, dropping any you have finished (StageToday featFor).
// MURAL AND MURALTOO are not in this list (owner, 2026-11-19): exactly one of
// them leads the row, whichever closes soonest, chosen by the clock in
// lib/mural-shared.js muralFeaturedKey() and placed by StageToday featFor.
export const FEATURED_KEYS = ['machine', 'crate', 'plow', 'dash', 'pack', 'chef', 'mop'];
export const FEATURED_RECENT = ['carmen', 'sudoclue'];
