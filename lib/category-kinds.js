// THE CATEGORY SORT AND FILTER CONTROLS (owner, 2026-11-10, from a player
// asking to filter the sudokus by size or type). Shared by the category pages
// (app/puzzle-category/CategoryLanding.jsx) and the home panes
// (app/today/StageToday.jsx) so the two never drift.
//
// One or two controls per page, never a wall of chips: Sudoku gets a Both /
// Numbers / Color toggle and sorts by grid size; Logic, Visual, Table Games
// and Word get one Kind row whose kinds fold the category sets in
// lib/daily-groups.js. A NEW SET for any of those four must be added to KIND_OF_SET, or its games show only
// with the Kind row on All.

import { GROUPS } from './daily-groups.js';
import { SUDOKU_SIZE } from './colour-sudoku.js';

export const KINDS = {
  Logic: [['grid', 'Grid Puzzles'], ['story', 'Deduction Stories'], ['test', 'Reasoning Tests']],
  // Visual and Table Games from the 2026-11-12 reorg (owner).
  Visual: [['photo', 'Photo Puzzles'], ['watch', 'Observation'], ['move', 'Moving Pieces']],
  'Table Games': [['cards', 'Cards'], ['chess', 'Chess'], ['board', 'Board Endgames']],
  Word: [['cross', 'Crosswords'], ['letters', 'Letter Games'], ['meaning', 'Word Meanings'], ['gauntlet', 'Word Gauntlets']],
};

export const KIND_OF_SET = {
  'Grid drawing': 'grid', 'Grid filling': 'grid',
  'Traffic jams': 'move', 'Roll and route': 'move', 'Pack and untangle': 'move', 'Photo puzzles': 'photo', 'Observation puzzles': 'watch',
  'Solitaire and poker': 'cards', 'Card tables': 'cards', 'Chess endings': 'chess', 'Board endgames': 'board', 'Territory endgames': 'board',
  Whodunits: 'story',
  'Sorting puzzles': 'test', 'Rule finding': 'test',
  Crosswords: 'cross', 'Clueless crosswords': 'cross',
  'Letter tiles': 'letters', 'Letter shuffles': 'letters',
  'Word meanings': 'meaning', 'Word gauntlets': 'gauntlet',
};

// Game key -> kind, off the groups.
export const KIND_OF_KEY = (() => {
  const m = {};
  for (const g of GROUPS) {
    const k = KIND_OF_SET[g.name];
    if (k && KINDS[g.cat]) for (const key of g.keys) m[key] = k;
  }
  return m;
})();

// Towers is the one sudoku that is not one fixed square (5x5 weekdays, 7x7 Sundays).
const SIZE_EXTRA = { towers: ['5x5 and 7x7', 6] };

export function sudokuSizeLabel(key) {
  const n = SUDOKU_SIZE[key];
  return n ? `${n}x${n}` : SIZE_EXTRA[key] ? SIZE_EXTRA[key][0] : null;
}

// For sorting: grid side, with anything unknown last.
export function sudokuSizeN(key) {
  return SUDOKU_SIZE[key] || (SIZE_EXTRA[key] ? SIZE_EXTRA[key][1] : 99);
}

// A generic label without its trailing size ("Mini sudoku, 6x6", "Racecar at
// 6x6"), for lines the size already leads.
export function bareGeneric(s) {
  return s ? s.replace(/,?\s*(?:at\s+)?\d+x\d+$/i, '').trim() : '';
}
