'use client';

import { useLayoutEffect, useState } from 'react';

// THE BOARD FITS THE HEIGHT IT HAS ON THE PLAY STAGE (lib/stage-fit.js's
// rule, for PlayStage hosts; Duet and Fib, 2026-10-31): the board is square, so its width is capped at the stage's
// height minus everything else that stands in the column with it, measured,
// never a constant. Nothing measured depends on the board's own size (the
// column is a fixed width), so there is no feedback loop. Inline (desktop with
// the site navigation) the page scrolls, so no cap there.
//
// BESIDE (opt-in, the End Game boards on desktop, owner 2026-11-02: "make the
// boards a bit bigger to fill the space"): with `beside` on, the board may sit
// in a row with a rail next to it, any number of wrappers deep under the ref.
// Every wrapper from the board up to the column is walked, and at each level
// only the siblings stacked ABOVE or BELOW the path are counted; a sibling that
// shares the path's rows (the rail) is beside it and costs no height. Inline,
// the board fits the window below the stage's top edge instead of being
// uncapped, so the controls stay on screen with the page scrolled to the top.
// Without `beside` the hook is exactly what it was.
// MIN (opt-in, Carmen 2026-11-08): the smallest the board may be. 260 suits a
// grid; a globe can go smaller, and on a short phone it must, or the buttons
// under it fall off the screen.
export default function usePlayStageFit(ref, boardSel, on, beside = false, min = 260) {
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
    const shown = (el) => [...el.children].filter((k) => k.tagName !== 'STYLE' && getComputedStyle(k).display !== 'none' && getComputedStyle(k).position !== 'absolute');
    // BESIDE: the height a level spends on siblings stacked with the path child.
    const stacked = (el, path, nat) => {
      const pr = path.getBoundingClientRect();
      const kids = shown(el).filter((k) => {
        if (k === path) return true;
        const r = k.getBoundingClientRect();
        return !(r.top < pr.bottom - 1 && r.bottom > pr.top + 1);
      });
      let h = Math.max(0, kids.length - 1) * px(getComputedStyle(el).rowGap);
      for (const k of kids) if (k !== path) h += nat ? natural(k) : k.getBoundingClientRect().height;
      return h;
    };
    const measure = () => {
      const dus = ref.current;
      if (!dus) return;
      const board = dus.querySelector(boardSel);
      const top = dus.closest('.pst-top');
      const col = dus.closest('.pst-col');
      const pst = dus.closest('.pst');
      const inl = !!pst && pst.classList.contains('inl');
      if (!board || !top || !col || !pst || (inl && !beside)) { setFit(null); return; }
      const others = (el, skip, nat) => {
        const kids = shown(el);
        const cs = getComputedStyle(el);
        const gap = px(cs.rowGap);
        let h = Math.max(0, kids.length - 1) * gap;
        for (const k of kids) if (k !== skip) h += nat ? natural(k) : k.getBoundingClientRect().height;
        return h;
      };
      const ccs = getComputedStyle(col);
      let room = px(ccs.paddingTop) + px(ccs.paddingBottom);
      if (beside) {
        for (let c = board; c && c !== col; c = c.parentElement) room += stacked(c.parentElement, c, c.parentElement === col);
      } else {
        room += others(col, top, true) + others(top, dus, false) + others(dus, board, false);
      }
      // Inline the stage is in the page's flow: it has the window below its
      // own top edge (as laid out with the page at the top), less a margin.
      const avail = inl ? window.innerHeight - (pst.getBoundingClientRect().top + window.scrollY) - 12 : pst.clientHeight;
      const next = Math.max(min, Math.floor(avail - room - 2));
      setFit((cur) => (cur != null && Math.abs(cur - next) <= 2 ? cur : next));
    };
    const tick = () => { cancelAnimationFrame(raf); raf = requestAnimationFrame(measure); };
    tick();
    let ro = null;
    try { ro = new ResizeObserver(tick); const el = ref.current; const col = el && el.closest('.pst-col'); if (col) ro.observe(col); if (el) ro.observe(el); } catch (e) {}
    window.addEventListener('resize', tick);
    return () => { cancelAnimationFrame(raf); window.removeEventListener('resize', tick); if (ro) ro.disconnect(); };
  }, [ref, boardSel, on, beside, min]);
  return fit;
}
