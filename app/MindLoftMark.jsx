// The Mind Loft mark (owner, 2026-10-26): a solid house whose lower half is the M.
// The opening under the M's V is a true cutout, so it always shows the background.
// The geometry lives in lib/mindloft-mark.js, which every string-built copy (share
// cards, OG images, icon scripts) also reads, so there is one drawing on the whole
// site. Import this component; never paste the path.
//
// COLOUR (owner, 2026-10-26, "A2"): the HOUSE carries the colour and the words beside
// it are plain ink. The fill is `accent` (default --stg-brand: sky on the home, the
// category hue on a game page). It is also available in black: pass `mono`, or put
// data-brand-mono on any ancestor, which turns --stg-brand into the ink colour.
//
// ON A COLOURED PAGE IT IS AN OUTLINE (owner, 2026-10-26): when the ground behind
// the mark is a light colour (a pastel stage, a category-filled page, the desktop
// cap matching a Blitz or gauntlet stage) the house draws as a black outline
// filled with that ground. White, grey and dark grounds keep the coloured fill.
//
// OUTLINE ONLY WHERE NEEDED: after mount the mark reads its own computed fill and the
// first opaque background behind it, and draws a thin outline in a deeper shade of its
// own colour when the fill falls under 3:1 against that ground (lib/mindloft-mark.js
// outlineFor). Sky on the light home gets one; a deep category step, or anything on the
// dark register, does not. It re-checks when the theme or the page colour changes.
//
// CAP ALIGNMENT (owner, 2026-10-26): when the mark sits beside the "Mind Loft"
// wordmark, its roof peak and wall feet line up with the top and bottom of the M.
// After mount it measures the wordmark's font size, sizes itself to the cap height
// (Manrope's is 0.72em) and sits on the baseline. Nothing at the call site changes.
// A mark with no wordmark beside it keeps its square `size`.

'use client';

import { useLayoutEffect, useRef } from 'react';
import { isMud } from '../lib/use-brand-fit';
import { HOUSE, TIGHT_BOX, TIGHT_ASPECT, CAP_RATIO, CAP_OVERSHOOT, OUTLINE_W, outlineFor } from '../lib/mindloft-mark';

const useIso = typeof window === 'undefined' ? () => {} : useLayoutEffect;

function groundOf(el) {
  for (let n = el && el.parentElement; n; n = n.parentElement) {
    const bg = getComputedStyle(n).backgroundColor;
    if (bg && !/rgba\([^)]*,\s*0\)$/.test(bg) && bg !== 'transparent') return bg;
  }
  return 'rgb(255, 255, 255)';
}

const OUTLINE_INK = '#111111';
const OUTLINE_STROKE = 10; // in 120-grid units, centred on the edge

// A ground counts as COLOURED when it carries real hue: the pastel and category
// grounds do, white, the greys and the near-black register do not. Chroma
// (max - min channel) rather than HSL saturation, which inflates near-whites.
function isColoredGround(bg) {
  const n = String(bg || '').match(/[\d.]+/g);
  if (!n || n.length < 3) return false;
  let [r, g, b] = n.slice(0, 3).map(Number);
  if (/color\(srgb/.test(bg)) { r *= 255; g *= 255; b *= 255; }
  if (n.length >= 4 && !/color\(srgb/.test(bg) && Number(n[3]) < 0.5) return false;
  // Light grounds only: a black outline on a deep navy or a dark tint would vanish,
  // so those keep the coloured fill.
  if (0.299 * r + 0.587 * g + 0.114 * b < 140) return false;
  return (Math.max(r, g, b) - Math.min(r, g, b)) / 255 >= 0.1;
}

function wordmarkNext(el) {
  const sib = el && el.nextElementSibling;
  if (sib && /Mind\s*Loft/.test(sib.textContent || '')) return sib;
  return null;
}

export default function MindLoftMark({ size = 32, ink = 'var(--stg-ink, var(--ink, #0b0d12))', accent, mono = false, title = 'Mind Loft' }) {
  const ref = useRef(null);
  const olRef = useRef(null);
  const houseRef = useRef(null);
  const fill = mono ? ink : (accent || 'var(--stg-brand, #7dd3fc)');

  useIso(() => {
    const el = ref.current;
    const word = wordmarkNext(el);
    if (!word) return undefined;
    const fit = () => {
      const fs = parseFloat(getComputedStyle(word).fontSize) || 0;
      if (!fs) return;
      const h = fs * CAP_RATIO * CAP_OVERSHOOT;
      el.setAttribute('viewBox', TIGHT_BOX);
      el.style.height = h.toFixed(2) + 'px';
      el.style.width = (h * TIGHT_ASPECT).toFixed(2) + 'px';
      el.style.display = 'inline-block';
      el.style.verticalAlign = 'baseline';
      // SIT ON THE BASELINE BY MEASUREMENT, NOT BY align-self (owner, 2026-10-26, "logo
      // name glitching"). align-self:baseline on a flex child pulls the mark AND the
      // words to the TOP of a centred flex row (the baseline group is placed at
      // cross-start), so in the back pill they rode up against the border while the
      // chevron stayed centred. Leave the parent's alignment alone; read the words'
      // real baseline with a zero-size probe and nudge the mark's feet onto it.
      el.style.transform = '';
      const probe = document.createElement('span');
      probe.style.cssText = 'display:inline-block;width:0;height:0;padding:0;margin:0;border:0;vertical-align:baseline;';
      word.appendChild(probe);
      const base = probe.getBoundingClientRect().bottom;
      word.removeChild(probe);
      const r = el.getBoundingClientRect();
      const scale = r.height && h ? r.height / h : 1; // an ancestor may be scaled (BrandFit)
      const dy = (base - r.bottom) / (scale || 1);
      if (Math.abs(dy) > 0.25) el.style.transform = `translateY(${dy.toFixed(2)}px)`;
    };
    fit();
    let ro;
    try { ro = new ResizeObserver(fit); ro.observe(word); } catch (e) {}
    window.addEventListener('resize', fit);
    try { document.fonts && document.fonts.ready.then(fit); } catch (e) {}
    return () => { try { ro && ro.disconnect(); } catch (e) {} window.removeEventListener('resize', fit); };
  }, []);

  useIso(() => {
    const ol = olRef.current, house = houseRef.current;
    if (!ol || !house) return undefined;
    const check = () => {
      // THE WARM STEPS GO INK (owner, 2026-10-26): Trivia's rust, End Game's
      // and the Arcade's browns read as mud on the house wherever it sits, the
      // headers BrandFit does not wrap included, so the mark checks itself.
      house.style.fill = ''; house.style.stroke = ''; house.style.strokeWidth = '';
      const ground = groundOf(ref.current);
      // ON A COLOURED PAGE THE MARK IS AN OUTLINE (owner, 2026-10-26): a black
      // outline filled with the page's own colour. Off colour (white, grey, the
      // dark register) it keeps its matching pastel or main colour fill.
      if (!mono && isColoredGround(ground)) {
        house.style.fill = ground;
        house.style.stroke = OUTLINE_INK;
        house.style.strokeWidth = String(OUTLINE_STROKE);
        ol.style.display = 'none';
        return;
      }
      const own = String(getComputedStyle(house).fill || '').match(/\d+/g);
      if (!mono && own && own.length >= 3 && isMud(own.slice(0, 3).map(Number))) { house.style.fill = ink; house.style.stroke = ink; }
      const c = outlineFor(getComputedStyle(house).fill, ground);
      if (c) { ol.setAttribute('stroke', c); ol.style.display = ''; } else { ol.style.display = 'none'; }
    };
    check();
    let mo;
    try {
      mo = new MutationObserver(check);
      // the register lives on .stage-page (a descendant), the page colour on <html>'s style
      mo.observe(document.documentElement, { attributes: true, subtree: true, attributeFilter: ['data-stage-theme', 'data-theme', 'data-brand-mono', 'data-stage-pastel', 'data-stage-tone', 'data-stage-chrome'] });
      mo.observe(document.documentElement, { attributes: true, attributeFilter: ['class', 'style', 'data-stage-chrome'] });
    } catch (e) {}
    const t = setTimeout(check, 400);
    return () => { clearTimeout(t); try { mo && mo.disconnect(); } catch (e) {} };
  }, [fill, ink, mono]);

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
      overflow="visible"
      style={{ display: 'block', flex: 'none', overflow: 'visible' }}
    >
      <path ref={olRef} className="mlm-ol" d={HOUSE} fill="none" stroke="none" strokeWidth={3 + OUTLINE_W} strokeLinejoin="round" style={{ display: 'none' }} />
      <path ref={houseRef} className="mlm-house" d={HOUSE} fill={fill} stroke={fill} strokeWidth="3" strokeLinejoin="round" />
    </svg>
  );
}
