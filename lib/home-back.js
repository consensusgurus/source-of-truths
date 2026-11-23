// BACK TO WHERE YOU WERE (owner feedback, 2026-11-23: "would it be possible to
// have a button that brings you back to the category you were just in? ... the
// back button brings me to the main screen ... maybe with the sub category
// selected too?"). The reader plays in the home-screen app on an iPhone, which
// has no browser Back, so the header's own back pill has to do it.
//
// The home notes the pane a game was opened from (its /#cat=<id> or /#all hash)
// in sessionStorage when a game tile is tapped. A puzzle page's back pill then
// goes to that pane instead of bare /, and the home, landing there from the
// pill, scrolls the tile of the game just played into view, which puts the
// reader back on its band (Chess, Cards, and so on). Opened from anywhere
// without a pane hash (the tiles, My Puzzles, a shared link), the pill goes to
// / as before. Session only: a fresh launch starts on the home.
const KEY = 'ml_back';
const GO = 'ml_back_go';

const read = () => {
  try { return JSON.parse(sessionStorage.getItem(KEY) || 'null'); } catch (e) { return null; }
};
const okHash = (h) => typeof h === 'string' && (h === '#all' || /^#cat=[A-Za-z0-9%._-]{1,60}$/.test(h));

/** On the home: a tap on a game tile notes the open pane, or clears it when no pane is open. */
export function rememberHomeSpot(hash) {
  try {
    if (okHash(hash)) sessionStorage.setItem(KEY, JSON.stringify({ h: hash }));
    else sessionStorage.removeItem(KEY);
  } catch (e) {}
}

/** The back pill's target: `href` ('/' or '/?...') plus the pane it came from, when there is one. */
export function homeBackHref(href) {
  if (typeof window === 'undefined') return href;
  const s = String(href || '/');
  if (!(s === '/' || s.startsWith('/?'))) return href;
  const b = read();
  return b && okHash(b.h) ? s + b.h : href;
}

/** The back pill was pressed: the home should scroll to this page's tile when it lands. */
export function markBackNav() {
  try { sessionStorage.setItem(GO, window.location.pathname); } catch (e) {}
}

/** On the home: the path of the game to bring into view, once, or null. */
export function takeBackTarget() {
  try {
    const p = sessionStorage.getItem(GO);
    if (p) sessionStorage.removeItem(GO);
    return p && /^\/[A-Za-z0-9/_-]{1,60}$/.test(p) ? p : null;
  } catch (e) { return null; }
}
