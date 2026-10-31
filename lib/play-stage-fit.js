'use client';

import { useLayoutEffect, useState } from 'react';

// THE BOARD FITS THE HEIGHT IT HAS ON THE PLAY STAGE (lib/stage-fit.js's
// rule, for PlayStage hosts; Duet and Fib, 2026-10-31): the board is square, so its width is capped at the stage's
// height minus everything else that stands in the column with it, measured,
// never a constant. Nothing measured depends on the board's own size (the
// column is a fixed width), so there is no feedback loop. Inline (desktop with
// the site navigation) the page scrolls, so no cap there.
export default function usePlayStageFit(ref, boardSel, on) {
  const [fit, setFit] = useState(null);
  useLayoutEffect(() => {
    if (!on) return undefined;
    let raf = 0;
    const px = (v) => parseFloat(v) || 0;
    // A child's own height from its contents, not its box: a bar that a flex
    // column stretches would otherwise count its slack as chrome, and the
    // board would shrink into the slack it just made.
    const natural = (el) => {
      const kids = [...el.children].filter((k) => k.tagName !== 'STYLE');
      if (!kids.length) return el.getBoundingClientRect().height;
      let lo = Infinity, hi = -Infinity;
      for (const k of kids) { const r = k.getBoundingClientRect(); if (!r.height) continue; lo = Math.min(lo, r.top); hi = Math.max(hi, r.bottom); }
      if (hi < lo) return el.getBoundingClientRect().height;
      const cs = getComputedStyle(el);
      return Math.min(el.getBoundingClientRect().height, hi - lo + px(cs.paddingTop) + px(cs.paddingBottom) + px(cs.borderTopWidth) + px(cs.borderBottomWidth));
    };
    const measure = () => {
      const dus = ref.current;
      if (!dus) return;
      const board = dus.querySelector(boardSel);
      const top = dus.closest('.pst-top');
      const col = dus.closest('.pst-col');
      const pst = dus.closest('.pst');
      if (!board || !top || !col || !pst || pst.classList.contains('inl')) { setFit(null); return; }
      const others = (el, skip, nat) => {
        const kids = [...el.children].filter((k) => k.tagName !== 'STYLE' && getComputedStyle(k).display !== 'none' && getComputedStyle(k).position !== 'absolute');
        const cs = getComputedStyle(el);
        const gap = px(cs.rowGap);
        let h = Math.max(0, kids.length - 1) * gap;
        for (const k of kids) if (k !== skip) h += nat ? natural(k) : k.getBoundingClientRect().height;
        return h;
      };
      const ccs = getComputedStyle(col);
      const room = px(ccs.paddingTop) + px(ccs.paddingBottom) + others(col, top, true) + others(top, dus, false) + others(dus, board, false);
      const next = Math.max(260, Math.floor(pst.clientHeight - room - 2));
      setFit((cur) => (cur != null && Math.abs(cur - next) <= 2 ? cur : next));
    };
    const tick = () => { cancelAnimationFrame(raf); raf = requestAnimationFrame(measure); };
    tick();
    let ro = null;
    try { ro = new ResizeObserver(tick); const el = ref.current; const col = el && el.closest('.pst-col'); if (col) ro.observe(col); if (el) ro.observe(el); } catch (e) {}
    window.addEventListener('resize', tick);
    return () => { cancelAnimationFrame(raf); window.removeEventListener('resize', tick); if (ro) ro.disconnect(); };
  }, [ref, boardSel, on]);
  return fit;
}
