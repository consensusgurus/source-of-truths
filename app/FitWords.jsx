'use client';

// FitWords: a big title that never breaks inside a word (owner, 2026-11-11,
// on the Due Diligence "Up next" card reading "compan / y" on a phone). The
// title keeps its CSS size until its LONGEST WORD would not fit the width it
// sits in; then the whole title steps down until that word fits on one line.
// Lines still wrap between words. Measured, never guessed: the width of the
// longest word is the element's min-content width (the CSS must use
// overflow-wrap:break-word, not anywhere, which would make min-content one
// letter). offsetWidth ignores transforms, so an entry animation that scales
// the title does not skew the reading. Re-measured on resize and once the
// web font has loaded.

import { useLayoutEffect, useRef } from 'react';

export default function FitWords({ as: Tag = 'span', className, min = 22, children, ...rest }) {
  const ref = useRef(null);
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el || typeof window === 'undefined') return undefined;
    const parent = el.parentElement;
    const fit = () => {
      el.style.fontSize = '';
      const ps = getComputedStyle(parent);
      const avail = parent.clientWidth - parseFloat(ps.paddingLeft || 0) - parseFloat(ps.paddingRight || 0);
      if (!(avail > 0)) return;
      const base = parseFloat(getComputedStyle(el).fontSize);
      const keepW = el.style.width;
      const keepD = el.style.display;
      el.style.display = 'inline-block';
      el.style.width = 'min-content';
      const word = el.offsetWidth;
      el.style.width = keepW;
      el.style.display = keepD;
      if (word > avail) el.style.fontSize = `${Math.max(min, Math.floor(base * (avail / word) * 0.97))}px`;
    };
    fit();
    let ro = null;
    try { ro = new ResizeObserver(fit); ro.observe(parent); } catch (e) { window.addEventListener('resize', fit); }
    try { document.fonts && document.fonts.ready.then(fit); } catch (e) {}
    return () => { if (ro) ro.disconnect(); else window.removeEventListener('resize', fit); };
  }, [children, min]);
  return <Tag ref={ref} className={className} {...rest}>{children}</Tag>;
}
