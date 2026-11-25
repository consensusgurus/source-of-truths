'use client';

import { useLayoutEffect } from 'react';

// SQUARE CELLS WITHOUT TRUSTING A BUTTON'S OWN ASPECT-RATIO (2026-11-25).
// iPad Safari stretched Duet's button squares taller than wide (aspect-ratio on
// a <button> grid item is not reliable there), and the board's rows slid out of
// line. A board that is an N by N square locks its rows in CSS instead. This
// hook is for the grids that cannot be a plain square (a header column, a row of
// slots): it measures the column width and writes it to --sq-cell on each grid,
// and the grid uses it as its row height (grid-template-rows / grid-auto-rows),
// so every row is exactly one column wide whatever the browser does with the
// buttons. Until the first measure the var is unset and the rows fall back to
// auto, which is what they were before.
//
// ref:      the element to watch (the grid itself, or a wrapper holding several)
// selector: null for the ref itself, or a selector for the grids under it
// cols:     how many equal columns the grid has
// lead:     px of a fixed leading column before them (a header), 0 for none
export default function useSquareCells(ref, selector, cols, lead = 0) {
  useLayoutEffect(() => {
    const root = ref.current;
    if (!root || !cols) return undefined;
    const px = (v) => parseFloat(v) || 0;
    const measure = () => {
      const grids = selector ? [...root.querySelectorAll(selector)] : [root];
      for (const g of grids) {
        const cs = getComputedStyle(g);
        const inner = g.clientWidth - px(cs.paddingLeft) - px(cs.paddingRight);
        const gap = px(cs.columnGap);
        const gaps = (cols - 1 + (lead ? 1 : 0)) * gap;
        const cell = Math.floor(((inner - lead - gaps) / cols) * 100) / 100;
        if (cell > 0) g.style.setProperty('--sq-cell', `${cell}px`);
      }
    };
    measure();
    let ro = null;
    try { ro = new ResizeObserver(measure); ro.observe(root); } catch (e) { window.addEventListener('resize', measure); }
    return () => { if (ro) ro.disconnect(); else window.removeEventListener('resize', measure); };
  });
}
