'use client';

// THE START SCREEN (owner, 2026-10-26: "I want all of our puzzle pages to be
// simplified and matching our full screen stage aesthetics. Short instructions
// by default for all. Big instructions and flag an issue small buttons / links
// at bottom or off screen. Big start button." Mockup approved the same night:
// "push live to all for every puzzle").
//
// Every daily's pre-start card carries the shared .stg-gate class, so this is
// one restyle of that class rather than an edit to 120 clients. It is mounted
// from StageChrome on daily pages only (gameKey set), so the quiz pages that
// share StageChrome keep their own gate.
//
// What the gate becomes, top to bottom, filling the first screen:
//   - a small eyebrow, category and date        (::before, from --stg-gate-eye)
//   - the game's name, very large               (::after,  from --stg-gate-name)
//   - the game's own one-paragraph short rules, larger
//   - one full-width Start button at the foot of the screen
//   (no How to play link under it: the ? in the header opens the rules)
// The "How to play / Report an issue" row the page already carries sits just
// below the fold. The name and eyebrow come from CSS variables written in the
// server-rendered <style>, so the first paint already has them (no jitter).
// The clients' "X is ready" titles were blanked to null (an empty first child
// hides), so the name is never said twice; in the rules view that first child
// says "How to play" and shows as a heading.
//
// THE GROUP IS CENTRED ON THE SCREEN, not spread down it (owner, 2026-10-27):
// the eyebrow, name, rules and Start sit together, and the gate
// pads its foot by the header's height so the group's middle is the screen's.
// The gate's height is MEASURED: it fills from its own top to the bottom of the
// screen (--stg-gate-y, written on <html>), because the header above it is not
// the same height on every game or at every width. Until the measure lands a
// 120px estimate holds, and the gate is hidden until hydration anyway.
//
// No backtick may appear in the CSS string below, comments included.

import { useEffect } from 'react';

function cssString(s) {
  return '"' + String(s || '').replace(/\\/g, '\\\\').replace(/"/g, '\\"').replace(/[\r\n]+/g, ' ') + '"';
}

function measure() {
  try {
    const gate = document.querySelector('.stage-page .stg-gate');
    const root = document.documentElement;
    if (!gate) return;
    const y = Math.max(0, Math.round(gate.getBoundingClientRect().top + window.scrollY));
    const cur = root.style.getPropertyValue('--stg-gate-y');
    if (cur !== y + 'px') root.style.setProperty('--stg-gate-y', y + 'px');
  } catch (e) { /* a missing measure leaves the estimate in place */ }
}

export default function GateScreen({ name, eye, accent = null }) {
  useEffect(() => {
    if (typeof document === 'undefined') return undefined;
    let raf = 0;
    const kick = () => { cancelAnimationFrame(raf); raf = requestAnimationFrame(measure); };
    measure();
    const mo = new MutationObserver(kick);
    const host = document.querySelector('.stage-page') || document.body;
    mo.observe(host, { childList: true, subtree: true });
    mo.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
    window.addEventListener('resize', kick);
    const t = setTimeout(kick, 400);
    return () => {
      mo.disconnect();
      window.removeEventListener('resize', kick);
      clearTimeout(t);
      cancelAnimationFrame(raf);
      try {
        document.documentElement.style.removeProperty('--stg-gate-y');
      } catch (e) {}
    };
  }, []);

  // THE START BUTTON WEARS THE CATEGORY (owner, 2026-10-26: "the start button
  // can match the category color"), with the dark run ink on it, the same pair
  // the run stage's call to action uses.
  const acc = /^#[0-9a-f]{3,8}$/i.test(String(accent || '')) ? accent : null;
  const vars = ':root{--stg-gate-name:' + cssString(name) + ';--stg-gate-eye:' + cssString(eye) + ';'
    + (acc ? '--stg-gate-acc:' + acc + ';' : '') + '}';
  return <style dangerouslySetInnerHTML={{ __html: vars + CSS }} />;
}

const CSS = `
html .stage-page .stg-gate{
  display:flex !important;flex-direction:column !important;justify-content:center !important;box-sizing:border-box;
  min-height:calc(100svh - var(--stg-gate-y, 120px) - 8px) !important;
  padding:6px 8px calc(var(--stg-gate-y, 120px) + 24px) !important;max-width:640px;margin-left:auto;margin-right:auto;
}
html .stage-page .stg-gate::before{
  content:var(--stg-gate-eye, "");order:-2;
  font-size:13px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;
  color:var(--stg-ink,#08222e);opacity:.7;
}
html .stage-page .stg-gate::after,
html[style*="--stg-glyph"] .stage-page .stg-gate::after{
  content:var(--stg-gate-name, "") !important;order:-1;display:block;
  position:static !important;width:auto !important;height:auto !important;
  background:none !important;-webkit-mask:none !important;mask:none !important;
  opacity:1 !important;animation:none !important;clip-path:none !important;
  margin:12px 0 18px;color:var(--stg-ink,#08222e);
  font-size:clamp(56px, 17vw, 108px);line-height:.95;font-weight:800;letter-spacing:-.035em;
  overflow-wrap:anywhere;
}
html .stage-page .stg-gate > div:first-child:empty{display:none !important;}
html .stage-page .stg-gate > :first-child:not(:empty){
  font-size:22px !important;line-height:1.25;margin-bottom:12px !important;
}
html .stage-page .stg-gate > :not(:first-child):not(:last-child){
  font-size:20px !important;line-height:1.42 !important;font-weight:600;max-width:34em;
}
html .stage-page .stg-gate > div:last-child{
  flex-direction:column !important;align-items:stretch !important;justify-content:flex-start !important;
  gap:14px !important;margin-top:30px !important;padding-top:0 !important;flex-wrap:nowrap !important;
}
html .stage-page .stg-gate > div:last-child > button:first-child:not([type=button]){
  width:100% !important;min-height:74px;justify-content:center;text-align:center;
  font-size:25px !important;font-weight:800 !important;letter-spacing:.01em;
  padding:16px 22px !important;border-radius:18px !important;
  background:var(--stg-gate-acc, var(--stg-acc, #7dd3fc)) !important;color:#08222e !important;
  border:2px solid #08222e !important;box-shadow:none !important;
}
html .stage-page .stg-gate > div:last-child > div{text-align:center;}
/* NO HOW TO PLAY LINK UNDER START (owner, 2026-10-27): the ? in the header
   opens the rules sheet, so the gate toggle is hidden on every daily. In all
   132 gates the action row holds only Start and that toggle. */
html .stage-page .stg-gate > div:last-child > button:not(:first-child),
html .stage-page .stg-gate > div:last-child > div:has(> button[type=button]){display:none !important;}
@media (min-width: 641px){
  html .stage-page .stg-gate{padding:6px 8px calc(var(--stg-gate-y, 120px) + 24px) !important;}
}
html:has(.stage-page .stg-gate) .stg-fg,
html:has(.stage-page .stg-gate) .stg-strip,
html:has(.stage-page .stg-gate) .stg-prog{display:none !important;}
html:has(.stage-page .stg-gate) .stb-tx,
html:has(.stage-page .stg-gate) .stg-cap .stg-id{visibility:hidden;}
`;
