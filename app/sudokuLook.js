'use client';
// THE SUDOKU STAGE LOOK (owner, 2026-10-23): "take what we did with gauntlet and
// the color flipping button, and apply the same to our sudoku puzzles".
//
// Every sudoku daily's page opens on the Sudoku category's PASTEL with the one
// dark ink (RAMP_INK) on it, whatever the site's light/dark setting is, exactly
// like the gauntlet stage. The look icon in the cap stops opening the page-look
// menu on these pages and FLIPS instead: Plain is a white page with black type
// and nothing coloured but the right/wrong marks. One switch for both: it is
// the gauntlet stage's own key (sot_gstage_look1), so flipping on a gauntlet
// flips the sudokus too and the other way round.
//
// How it lands, with no per-game CSS: the client pins its root to the light
// token set (data-stage-theme='light' + data-stage-pin, the RunEmbed route, so
// the boot stamp cannot suppress it) and spreads `vars` over the root's inline
// style, which outranks the token block on the same element. The ending reads
// --gs-fin (the iris in lib/finish-beat.js, the curtain through globals.css), so
// a solve still floods the pastel rather than the ink.
//
// Embedded in a run (Enter the Dojo) none of this applies: the run owns its look.

import { useEffect } from 'react';
import { RAMP_INK, categoryColor } from '@/lib/category-ramp';
import { SUDOKU_POOL } from '@/lib/circuits';
import { useStageLook, PLAIN } from './GauntletScreens';
import { holdRootPaint } from '@/lib/root-paint';

const KEYS = new Set(SUDOKU_POOL);
export function isSudokuLook(gameKey) { return !!gameKey && KEYS.has(gameKey); }

export const SUDOKU_PASTEL = categoryColor('Sudoku');

function varsFor(look) {
  if (look === 'plain') {
    const ink = PLAIN.ink;
    return {
      '--stg-ground': PLAIN.bg, '--stg-panel': '#f2f2f2', '--stg-surf2': '#ededed', '--stg-chip': '#ededed',
      '--stg-raise': '#ffffff', '--stg-surf': '#ffffff', '--stg-cell': '#ffffff',
      '--stg-ink': ink, '--stg-ink2': ink, '--stg-mute': '#454545', '--stg-mute2': '#454545', '--stg-dim': '#4a4a4a',
      '--stg-brand': ink, '--stg-cell-given': ink,
      '--stg-acc-lt': ink, '--stg-acc-ink-lt': ink, '--stg-onramp-lt': '#ffffff',
      '--gs-fin': PLAIN.bg, '--gs-finink': ink,
    };
  }
  const p = SUDOKU_PASTEL;
  const tint = `color-mix(in srgb, ${p} 42%, #ffffff)`;
  const mute = `color-mix(in srgb, ${RAMP_INK} 80%, ${p})`;
  return {
    '--stg-ground': p, '--stg-panel': tint, '--stg-surf2': tint, '--stg-chip': tint,
    '--stg-raise': '#ffffff', '--stg-surf': '#ffffff', '--stg-cell': '#ffffff',
    '--stg-ink': RAMP_INK, '--stg-ink2': RAMP_INK, '--stg-mute': mute, '--stg-mute2': mute, '--stg-dim': mute,
    '--stg-brand': RAMP_INK, '--stg-good': '#065f46', '--stg-up': '#065f46', '--stg-bad': '#9f1239', '--stg-dn': '#9f1239', '--stg-warn': '#7c4a03',
    '--stg-acc-lt': RAMP_INK, '--stg-acc-ink-lt': '#3949ab', '--stg-onramp-lt': p,
    '--gs-fin': p, '--gs-finink': RAMP_INK,
  };
}

// Paints <html>/<body> and the browser bars while a sudoku page is up, and puts
// the page's own theme-color tags back on the way out. No scroll nudge here:
// unlike the gauntlet stage this page is not covered, so a nudge would show.
function useBars(color) {
  useEffect(() => {
    if (!color || typeof document === 'undefined') return undefined;
    const release = holdRootPaint(color);
    const saved = Array.from(document.querySelectorAll('meta[name="theme-color"]'));
    saved.forEach((m) => m.parentNode && m.parentNode.removeChild(m));
    const m = document.createElement('meta');
    m.setAttribute('name', 'theme-color');
    m.setAttribute('content', color);
    document.head.appendChild(m);
    return () => {
      release();
      if (m.parentNode) m.parentNode.removeChild(m);
      saved.forEach((n) => document.head.appendChild(n));
    };
  }, [color]);
}

// The client's hook. `on` is STAGE && !EMBED. Returns null when off, so a
// client writes `SDK ? ... : ...` and an embedded or paper page is untouched.
export function useSudokuStage(on) {
  const [look] = useStageLook();
  const vars = varsFor(look);
  useBars(on ? vars['--stg-ground'] : null);
  return on ? { look, vars } : null;
}

// The cap's switch: the same store, so every surface flips together.
export function useSudokuFlip() {
  const [look, setLook] = useStageLook();
  return { look, flip: () => setLook(look === 'plain' ? 'color' : 'plain') };
}

export function FlipGlyph({ size = 13 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" aria-hidden="true">
      <circle cx="12" cy="12" r="8.5" />
      <path d="M12 3.5a8.5 8.5 0 0 1 0 17z" fill="currentColor" stroke="none" />
    </svg>
  );
}
