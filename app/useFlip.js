'use client';

// FLIP FOR A REORDER (owner, 2026-09-16, motion pass): when React moves the
// children of a container, the elements SLIDE to their new places instead of
// teleporting. First, Last, Invert, Play: after every commit, read where each
// keyed child now sits, compare with where it sat after the previous commit,
// and animate the difference back to zero with the Web Animations API. No
// library, no class churn, no state.
//
//   - Children are found by `data-fk` (a stable key the caller renders), so a
//     re-keyed or newly mounted element has no previous box and simply appears.
//   - A NESTED key measures against its nearest keyed ancestor. A card inside
//     a section that slides would otherwise be animated twice, once by the
//     section's transform and once by its own, and land at double the distance.
//   - THE MEASUREMENT IS THE LAYOUT POSITION, NEVER THE MID-FLIGHT ONE. A
//     getBoundingClientRect read while a previous slide is still playing
//     includes that slide's transform, and a commit that lands mid-flight then
//     measures a phantom move and answers it with a bigger one, which the next
//     commit doubles again (the first build of this oscillated a section off
//     the page in a dozen commits). So every slide this hook starts is
//     remembered, its current translate is read off the computed transform
//     and subtracted to recover the layout box, and when a NEW move arrives
//     mid-flight the old slide is cancelled and its remaining distance folded
//     into the new one, so the eye sees one continuous motion.
//   - An element that was or is display:none has a zero-sized box and is
//     skipped: it has no honest place to slide from.
//   - Runs after EVERY commit of the owning component, not only on the reorder,
//     because the reorder is not the only thing that moves a card: a played
//     game drops to the end of its row the moment the day's status lands. On
//     the home that is under a hundred rect reads per commit, and nothing on
//     that page re-renders on a clock.
//   - prefers-reduced-motion skips the play step and keeps the measurement, so
//     the boxes stay current for the day the preference changes.
import { useLayoutEffect, useRef } from 'react';

const EASE = 'cubic-bezier(.2,.7,.3,1)';

export default function useFlip(ref, { duration = 380 } = {}) {
  const prev = useRef(null);
  const live = useRef(new Map());   // element -> the slide this hook started on it
  useLayoutEffect(() => {
    const root = ref.current;
    if (!root) return;
    let still = false;
    try { still = window.matchMedia('(prefers-reduced-motion: reduce)').matches; } catch (e) {}
    const canPlay = !still && typeof Element !== 'undefined' && !!Element.prototype.animate;
    const els = root.querySelectorAll('[data-fk]');   // document order: a host before its children
    const sx = window.scrollX || 0, sy = window.scrollY || 0;
    const now = new Map();
    const residual = new Map();
    // The translate a running slide is currently applying, read off the
    // computed transform, so the layout position is the on-screen box minus it
    // and a slide that has nothing new to do is left running rather than
    // restarted on every commit.
    const shift = (el) => {
      if (!live.current.has(el)) return { x: 0, y: 0 };
      const t = getComputedStyle(el).transform;
      const m = /matrix\(([^)]+)\)/.exec(t || '');
      if (!m) return { x: 0, y: 0 };
      const v = m[1].split(',').map(Number);
      return { x: v[4] || 0, y: v[5] || 0 };
    };
    const boxes = new Map();
    els.forEach((el) => {
      const b = el.getBoundingClientRect();
      const sh = shift(el);
      boxes.set(el, { left: b.left - sh.x, top: b.top - sh.y, width: b.width, height: b.height });
      if (sh.x || sh.y) residual.set(el, sh);
    });
    els.forEach((el) => {
      const r = boxes.get(el);
      if (!r.width || !r.height) return;
      const host = el.parentElement && el.parentElement.closest('[data-fk]');
      const o = host ? boxes.get(host) : { left: -sx, top: -sy };
      now.set(el.dataset.fk, { el, x: r.left - o.left, y: r.top - o.top });
    });
    const was = prev.current;
    prev.current = now;
    if (!was || !canPlay) return;
    now.forEach((cur, k) => {
      const old = was.get(k);
      if (!old) return;
      const mx = old.x - cur.x, my = old.y - cur.y;
      // No new move: whatever slide is on it keeps playing untouched. The
      // threshold clears the 1px hover lift a card carries in its own CSS.
      if (Math.abs(mx) < 2 && Math.abs(my) < 2) return;
      const res = residual.get(cur.el) || { x: 0, y: 0 };
      const dx = mx + res.x, dy = my + res.y;
      const prior = live.current.get(cur.el);
      if (prior) { try { prior.cancel(); } catch (e) {} live.current.delete(cur.el); }
      try {
        const anim = cur.el.animate(
          [{ transform: 'translate(' + dx + 'px,' + dy + 'px)' }, { transform: 'none' }],
          { duration, easing: EASE },
        );
        live.current.set(cur.el, anim);
        const drop = () => { if (live.current.get(cur.el) === anim) live.current.delete(cur.el); };
        anim.finished.then(drop, drop);
      } catch (e) {}
    });
  });
}
