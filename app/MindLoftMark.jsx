// The Mind Loft mark (owner, 2026-10-26): a solid house whose lower half is the M.
// The opening under the M's V is a true cutout, so it always shows the background.
// The geometry lives in lib/mindloft-mark.js, which every string-built copy (share
// cards, OG images, icon scripts) also reads, so there is one drawing on the whole
// site. Import this component; never paste the path.
//
// COLOUR (owner, 2026-10-26): the mark takes the colour of "Loft" beside it, which
// is `accent` (default --stg-brand, the same variable the word reads). It is also
// available in black: pass `mono`, or put data-brand-mono on any ancestor, which
// turns --stg-brand into the ink colour for the whole subtree.
//
// CAP ALIGNMENT (owner, 2026-10-26): when the mark sits beside the "Mind Loft"
// wordmark, its roof peak and wall feet line up with the top and bottom of the M.
// After mount it measures the wordmark's font size, sizes itself to the cap height
// (Manrope's is 0.72em) and sits on the baseline. Nothing at the call site changes.
// A mark with no wordmark beside it keeps its square `size`.

'use client';

import { useLayoutEffect, useRef } from 'react';
import { HOUSE, TIGHT_BOX, TIGHT_ASPECT, CAP_RATIO } from '../lib/mindloft-mark';

const useIso = typeof window === 'undefined' ? () => {} : useLayoutEffect;

function wordmarkNext(el) {
  const sib = el && el.nextElementSibling;
  if (sib && /Mind\s*Loft/.test(sib.textContent || '')) return sib;
  return null;
}

export default function MindLoftMark({ size = 32, ink = 'var(--stg-ink, var(--ink, #0b0d12))', accent, mono = false, title = 'Mind Loft' }) {
  const ref = useRef(null);
  const fill = mono ? ink : (accent || 'var(--stg-brand, #7dd3fc)');

  useIso(() => {
    const el = ref.current;
    const word = wordmarkNext(el);
    if (!word) return undefined;
    const fit = () => {
      const fs = parseFloat(getComputedStyle(word).fontSize) || 0;
      if (!fs) return;
      const h = fs * CAP_RATIO;
      el.setAttribute('viewBox', TIGHT_BOX);
      el.style.height = h.toFixed(2) + 'px';
      el.style.width = (h * TIGHT_ASPECT).toFixed(2) + 'px';
      el.style.alignSelf = 'baseline';
      el.style.display = 'inline-block';
      el.style.verticalAlign = 'baseline';
      word.style.alignSelf = 'baseline';
    };
    fit();
    let ro;
    try { ro = new ResizeObserver(fit); ro.observe(word); } catch (e) {}
    window.addEventListener('resize', fit);
    return () => { try { ro && ro.disconnect(); } catch (e) {} window.removeEventListener('resize', fit); };
  }, []);

  return (
    <svg
      ref={ref}
      width={size}
      height={size}
      viewBox="0 0 120 120"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-label={title || undefined}
      aria-hidden={title ? undefined : true}
      style={{ display: 'block', flex: 'none' }}
    >
      <path className="mlm-house" d={HOUSE} fill={fill} stroke={fill} strokeWidth="3" strokeLinejoin="round" />
    </svg>
  );
}
