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
import { useStageLook, nextLook } from '@/lib/stage-look';
import { forceStageTheme } from '@/lib/stage-theme';

let holders = 0;
function hold() {
  holders += 1;
  if (holders === 1 && typeof document !== 'undefined') document.documentElement.setAttribute('data-stage-pastel', document.documentElement.getAttribute('data-stage-pastel') || 'color');
  return () => {
    holders = Math.max(0, holders - 1);
    if (holders === 0 && typeof document !== 'undefined') document.documentElement.removeAttribute('data-stage-pastel');
  };
}

// The stage's own look switch applies here too (owner, 2026-10-24): 'color'
// is the periwinkle pastel, 'plain' is a white page with black type. Returns
// whether the register is on, the look, and the switch, so a cap can draw the
// same circle button the gauntlet stage carries.
// `ground` is the page colour for the colour look: the Sudoku periwinkle by
// default, a game's own category pastel when another family uses the register
// (the End Game titles, 2026-10-24).
export default function useSudokuPastel(active, ground) {
  const phone = usePhoneStage();
  const on = !!active && phone;
  useEffect(() => {
    if (!on || typeof document === 'undefined' || !ground) return undefined;
    const r = document.documentElement;
    r.style.setProperty('--sp-g', ground);
    return () => { r.style.removeProperty('--sp-g'); };
  }, [on, ground]);
  const [look, setLook] = useStageLook();
  useEffect(() => (on ? hold() : undefined), [on]);
  // The page under the stage look stays in the light register (lib/stage-theme.js).
  useEffect(() => {
    if (!on) return undefined;
    forceStageTheme('light');
    return () => forceStageTheme(null);
  }, [on]);
  useEffect(() => {
    if (!on || typeof document === 'undefined') return;
    document.documentElement.setAttribute('data-stage-pastel', look);
  }, [on, look]);
  return { on, look, flip: () => setLook(nextLook(look)) };
}
