// FOCUS THE ANSWER BOX THE MOMENT A GAME STARTS (owner, 2026-10-17).
// A typed daily's input only renders once the start gate closes, so a
// focus() called from the Start handler can run before the box exists (and
// inside a one-page run the game itself mounts late). focusSoon retries on
// animation frames until the element is there, then focuses it without
// scrolling the page. `get` is a function returning the element, or a CSS
// selector. Safe on the server (does nothing).
export function focusSoon(get, tries = 20) {
  if (typeof window === 'undefined') return;
  let n = 0;
  const step = () => {
    let el = null;
    try { el = typeof get === 'string' ? document.querySelector(get) : get(); } catch (e) { el = null; }
    if (el && typeof el.focus === 'function' && !el.disabled) {
      try { el.focus({ preventScroll: true }); } catch (e) { try { el.focus(); } catch (e2) { /* nothing to do */ } }
      return;
    }
    n += 1;
    if (n < tries) window.requestAnimationFrame(step);
  };
  window.requestAnimationFrame(step);
}
