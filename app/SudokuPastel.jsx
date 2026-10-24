'use client';

// THE SUDOKU STAGE ON A PHONE (owner, 2026-10-24): under 900px wide every
// sudoku plays on the gauntlet stage's look, the periwinkle Sudoku pastel for
// the ground and one dark ink, with the selected square inked solid and its row,
// column and box shaded. Desktop is unchanged.
//
// It is a TOKEN REGISTER, not a second board: while the page carries
// html[data-stage-pastel] the stage tokens are remapped (app/globals.css, under
// "THE PASTEL REGISTER"), so every sudoku client keeps its own board and rules
// and simply draws in these colours. The selected square reads --stg-sel, which
// nothing else sets, so the other registers are untouched. The register stands
// down by itself while a finish card is up (the :has(.stf) guard in the CSS),
// so the ending keeps its own colours.
//
// Several mounts can want it at once (a run page and the board inside it), so
// the attribute is counted rather than set and cleared by whoever ran last.

import { useEffect } from 'react';
import { usePhoneStage } from './WordStage';

let holders = 0;
function hold() {
  holders += 1;
  if (holders === 1 && typeof document !== 'undefined') document.documentElement.setAttribute('data-stage-pastel', '');
  return () => {
    holders = Math.max(0, holders - 1);
    if (holders === 0 && typeof document !== 'undefined') document.documentElement.removeAttribute('data-stage-pastel');
  };
}

export default function useSudokuPastel(active) {
  const phone = usePhoneStage();
  const on = !!active && phone;
  useEffect(() => (on ? hold() : undefined), [on]);
  return on;
}
