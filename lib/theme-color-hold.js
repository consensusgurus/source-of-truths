// THE BROWSER BAR COLOUR, HELD WITHOUT TOUCHING REACT'S TAGS (2026-10-23).
// The gauntlet and sudoku stages repaint Safari's bars by adding a FRESH
// <meta name="theme-color"> (Safari does not re-read one whose content
// changed). They used to REMOVE the page's own theme-color tags while doing it
// and put them back on the way out. Those tags belong to Next's metadata, so a
// client navigation could ask React to remove a tag that was not in <head> at
// that moment, which throws and lands the reader on the error page (owner
// report: Sixes to the home page). Now the page's tags never leave <head>: they
// are switched off with media="not all" while a stage holds the bars, and
// switched back on when the last hold is released. Only our own tags are ever
// removed.
const holds = [];
const MARK = 'data-sot-tc';
function apply() {
  if (typeof document === 'undefined') return;
  const head = document.head;
  head.querySelectorAll(`meta[${MARK}]`).forEach((m) => m.parentNode && m.parentNode.removeChild(m));
  const top = holds[holds.length - 1];
  head.querySelectorAll('meta[name="theme-color"]').forEach((m) => {
    if (top) {
      if (!m.hasAttribute('data-sot-off')) {
        m.setAttribute('data-sot-off', m.getAttribute('media') || '');
        m.setAttribute('media', 'not all');
      }
    } else if (m.hasAttribute('data-sot-off')) {
      const was = m.getAttribute('data-sot-off');
      if (was) m.setAttribute('media', was); else m.removeAttribute('media');
      m.removeAttribute('data-sot-off');
    }
  });
  if (top) {
    const m = document.createElement('meta');
    m.setAttribute('name', 'theme-color');
    m.setAttribute('content', top.color);
    m.setAttribute(MARK, '');
    head.appendChild(m);
  }
}
export function holdThemeColor(color) {
  if (!color || typeof document === 'undefined') return () => {};
  const h = { color };
  holds.push(h);
  apply();
  return () => { const i = holds.indexOf(h); if (i >= 0) { holds.splice(i, 1); apply(); } };
}
