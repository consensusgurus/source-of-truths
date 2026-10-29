'use client';

// ONE STAGE IN EVERY VIEW (owner, 2026-10-28: "move all of the full screen only
// designs like hinge to all views"). The full-screen stages (PlayStage,
// WordStage, BracketStage) began as phone-only screens. They now draw in all
// three views a daily has:
//
//   phone    under 900px: fixed over the page, as they always were
//   full     desktop full screen (html.lc-focus): fixed over the page, with the
//            page's Show Site Navigation control in the stage's top bar
//   inline   desktop with the site navigation showing: the SAME board drawn in
//            the page's own column, where the old board was. The game's column
//            (the root child that holds Report an issue, .ri-wrap) keeps its
//            header and hides the rest while the stage is up, and gets it all
//            back the moment the stage unmounts (the round ended).
//
// The stage is still mounted where every host already mounts it, at the top of
// its root, so no game had to move its markup: in the inline view it portals
// itself into a slot at the top of the game's column. If a page has no such
// column it simply stays fixed, as on a phone.

import React, { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

const useIso = typeof window === 'undefined' ? useEffect : useLayoutEffect;

export function readStageMode() {
  if (typeof window === 'undefined') return 'phone';
  try {
    if (window.matchMedia && window.matchMedia('(max-width: 899px)').matches) return 'phone';
    return document.documentElement.classList.contains('lc-focus') ? 'full' : 'inline';
  } catch (e) { return 'phone'; }
}

export function useStageMode() {
  const [m, setM] = useState(readStageMode);
  useEffect(() => {
    const f = () => setM(readStageMode());
    f();
    let mq = null;
    try { mq = window.matchMedia('(max-width: 899px)'); } catch (e) {}
    if (mq) { if (mq.addEventListener) mq.addEventListener('change', f); else mq.addListener(f); }
    const mo = new MutationObserver(f);
    mo.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
    return () => {
      if (mq) { if (mq.removeEventListener) mq.removeEventListener('change', f); else mq.removeListener(f); }
      mo.disconnect();
    };
  }, []);
  return m;
}

// The game's column: the child of the game's root that holds Report an issue.
// Read straight off the DOM during render (a stage only ever mounts on the
// client, after Start), so the stage never spends a frame in the wrong place.
function findHost(anchor) {
  if (typeof document === 'undefined') return null;
  const root = (anchor && anchor.closest('.stage-page')) || document.querySelector('.stage-page');
  if (!root) return null;
  for (const c of Array.from(root.children)) {
    if (anchor && c.contains(anchor)) continue;
    if (c.querySelector('.ri-wrap')) return c;
  }
  return null;
}

// The slot is created once and rendered into straight away (a portal into a
// detached node works); the layout effect puts it in the column before paint.
function useStageSlot(anchorRef, on) {
  const [el] = useState(() => (typeof document === 'undefined' ? null : document.createElement('div')));
  const host = on ? findHost(anchorRef.current) : null;
  useIso(() => {
    if (!host || !el) return undefined;
    el.className = 'stg-hslot';
    host.insertBefore(el, host.firstChild);
    host.classList.add('stg-hosting');
    return () => {
      host.classList.remove('stg-hosting');
      try { el.remove(); } catch (e) {}
    };
  }, [host, el]);
  return host && el ? el : null;
}

const HOST_CSS = `
html:not(:has(.loft-back, .stf, .sst-page, .srl)) .stg-hosting > :not(.stg-hslot):not(.stg-top):not(:has(.stg-top)){display:none !important;}
.stg-hslot{padding:6px 0 18px;}
`;

// THE ENDING TAKES OVER (2026-10-29). A stage now stays mounted through the
// finish so no old board flashes, which means it is still up when the ending
// arrives. The moment an ending is on screen (.loft-back, .stf, .sst-page,
// .srl) the column comes back and every stage steps aside (the global rule in
// app/globals.css hides the fixed ones too); before that, through the finish
// hold, the finished stage board is what shows.
// Wraps a stage's markup. `force` keeps the old explicit inline mode (the stage
// rendered in place by its host). Returns { mode, inline, chrome, render }:
// `inline` says to draw the in-page version (no top bar, no fixed frame),
// `chrome` whether to paint the browser bars, and render(node) places it.
export function useHostedStage(force = false) {
  const mode = useStageMode();
  const anchorRef = useRef(null);
  const auto = !force && mode === 'inline';
  const slot = useStageSlot(anchorRef, auto);
  const inline = !!force || (auto && !!slot);
  const anchor = <span ref={anchorRef} hidden aria-hidden="true" />;
  const render = (node) => {
    if (auto && slot) {
      return (
        <>
          {anchor}
          {createPortal(<><style dangerouslySetInnerHTML={{ __html: HOST_CSS }} />{node}</>, slot)}
        </>
      );
    }
    return <>{anchor}{node}</>;
  };
  const nav = mode === 'full' ? {
    label: 'Show Site Navigation',
    onPress: () => { try { const b = document.querySelector('.lc-sub-btn'); if (b) b.click(); } catch (e) {} },
  } : null;
  return { mode, inline, chrome: !inline, render, nav };
}
