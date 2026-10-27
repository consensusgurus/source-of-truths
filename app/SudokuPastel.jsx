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

import { useEffect, useState } from 'react';
import { usePhoneStage } from './WordStage';
import { useStageLook, nextMainLook, readLook } from '@/lib/stage-look';
import { forceStageTheme } from '@/lib/stage-theme';
import { softGround } from '@/lib/category-ramp';

let holders = 0;
function hold() {
  holders += 1;
  if (holders === 1 && typeof document !== 'undefined') document.documentElement.setAttribute('data-stage-pastel', document.documentElement.getAttribute('data-stage-pastel') || 'tint');
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
// THE DESKTOP FULL SCREEN IS THE PHONE STAGE (owner, 2026-10-26: "the desktop
// stage does not match the mobile stage, and it should except for the site
// navigation button"). While Layout C is in focus (html.lc-focus, set before
// paint by the boot script and by LayoutCInner), the page takes the phone
// register too; showing the site navigation turns focus off and the desktop
// tone comes back.
function useLcFocus() {
  const read = () => typeof document !== 'undefined' && document.documentElement.classList.contains('lc-focus');
  const [f, setF] = useState(false);
  useEffect(() => {
    setF(read());
    const mo = new MutationObserver(() => setF(read()));
    mo.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
    return () => mo.disconnect();
  }, []);
  return f;
}

// `lookIn` lets a run drive the register with its own look (owner, 2026-10-27:
// the Dojo plays inside the run frame, whose one switch is the run's look,
// gauntlet key and all five looks); without it the register follows the main
// page look as before.
export default function useSudokuPastel(active, ground, lookIn = null) {
  const focus = useLcFocus();
  const narrow = usePhoneStage();
  const phone = narrow || focus;
  const on = !!active && phone;
  // ONE OWNER FOR --sp-g (owner report, 2026-10-27: Taire's ending band came
  // out a dull orchid instead of the Cards pastel). Two effects used to set it,
  // one for the phone/focus register and one for the desktop tone, and each
  // removed it on cleanup. Showing the site navigation (which the ending does)
  // turns focus off, so the phone effect's cleanup REMOVED --sp-g while the
  // desktop effect, whose deps had not changed, never put it back. Everything
  // painted with var(--sp-g, fallback) then fell back to the deep accent. The
  // soft category ground is the same value at every width, so it is set once
  // here for as long as the game is on the stage, whatever the width or focus.
  useEffect(() => {
    if (!active || typeof document === 'undefined') return undefined;
    const r = document.documentElement;
    // softened 40% toward white, like every phone stage ground (lib/category-ramp.js)
    r.style.setProperty('--sp-g', softGround(ground || '#a5b4fc'));
    return () => { r.style.removeProperty('--sp-g'); };
  }, [active, ground]);
  const [mainLookNow, setLook] = useStageLook();
  const look = lookIn || mainLookNow;
  useEffect(() => (on ? hold() : undefined), [on]);
  // The page under the stage look stays in the light register (lib/stage-theme.js).
  useEffect(() => {
    if (!on) return undefined;
    forceStageTheme('light');
    return () => forceStageTheme(null);
  }, [on]);
  useEffect(() => {
    if (!on || typeof document === 'undefined') return;
    // Read the stored look, not the state: the state starts on the default for
    // one render, which repainted the page in the wrong look for a frame.
    document.documentElement.setAttribute('data-stage-pastel', lookIn || readLook());
  }, [on, look]);
  // THE DESKTOP TONE (owner, 2026-10-26): on a desktop the same colours are
  // set through html[data-stage-tone] (see the end of app/globals.css), which
  // remaps only the stage tokens and leaves the desktop's own frame alone.
  // A DESKTOP IN FULL SCREEN CARRIES BOTH (owner report, 2026-10-27: dark mode
  // showed a white page on the play and start screens). Focus sets the phone's
  // data-stage-pastel, whose colours all sit under max-width:899px, so a wide
  // window in focus had no register at all and fell back to the light stage.
  // The desktop tone now follows the WIDTH alone, so a wide focus page gets the
  // data-stage-tone colours (min-width:900px) beside the phone header.
  const desk = !!active && !narrow;
  useEffect(() => {
    if (!desk || typeof document === 'undefined') return undefined;
    const r = document.documentElement;
    r.setAttribute('data-stage-tone', lookIn || readLook());
    forceStageTheme('light');
    return () => { r.removeAttribute('data-stage-tone'); forceStageTheme(null); };
  }, [desk, ground, look]);
  return { on, look, flip: () => setLook(nextMainLook(look)) };
}
