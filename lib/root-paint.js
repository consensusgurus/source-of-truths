// THE ROOT PAINT (owner report, 2026-10-20: a black bar down the right edge
// during the full-colour ending). The page reserves a scrollbar gutter
// (`scrollbar-gutter: stable` in app/globals.css) and a stage page paints the
// root near-black, while the iris and the flood are position:fixed overlays,
// which can never paint into the gutter or the scrollbar track. So while one
// of them is up, the ROOT takes its colour too: the background and the
// scrollbar colours on <html>, through one attribute and one variable.
//
// A STACK, not a flag: the iris hands over to the flood in the same colour,
// and the iris is removed after the flood has mounted, so a flag cleared by
// the iris would take the flood's paint with it. Each hold returns its own
// release; the root shows the newest hold still open, and nothing once all
// are released.
const holds = [];
let seq = 0;
function apply() {
  if (typeof document === 'undefined') return;
  const el = document.documentElement;
  const top = holds[holds.length - 1];
  try {
    if (top) { el.style.setProperty('--sot-root-paint', top.color); el.setAttribute('data-sot-paint', ''); }
    else { el.removeAttribute('data-sot-paint'); el.style.removeProperty('--sot-root-paint'); }
  } catch (e) {}
}
export function holdRootPaint(color) {
  if (!color || typeof document === 'undefined') return () => {};
  const h = { id: ++seq, color };
  holds.push(h);
  apply();
  return () => { const i = holds.indexOf(h); if (i >= 0) { holds.splice(i, 1); apply(); } };
}
