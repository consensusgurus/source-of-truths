// mathText — draws the division sign as a real obelus (owner, 2026-10-12).
//
// The font's ÷ has dots too small to see at question size, so "63 ÷ 9" read as
// "63 + 9". Every math surface passes its question and choice strings through
// this: each ÷ becomes an inline SVG with a full-width bar and two solid dots,
// in currentColor so it takes whatever ink the text around it has. Anything
// that is not a string, or holds no ÷, comes back untouched.
import React from 'react';

export function Obelus() {
  return (
    <svg viewBox="0 0 10 10" width="0.84em" height="0.84em" aria-hidden="true" focusable="false"
      style={{ display: 'inline-block', verticalAlign: '-0.05em', margin: '0 0.06em', overflow: 'visible' }}>
      <circle cx="5" cy="1.5" r="1.7" fill="currentColor" />
      <rect x="0.2" y="4.1" width="9.6" height="1.8" rx="0.9" fill="currentColor" />
      <circle cx="5" cy="8.5" r="1.7" fill="currentColor" />
    </svg>
  );
}

export function mathText(s) {
  if (typeof s !== 'string' || s.indexOf('÷') === -1) return s;
  const parts = s.split('÷');
  const out = [];
  parts.forEach((p, i) => {
    if (i) out.push(<React.Fragment key={'o' + i}><Obelus /><span className="sr-only" style={{ position: 'absolute', width: 1, height: 1, overflow: 'hidden', clip: 'rect(0 0 0 0)', whiteSpace: 'nowrap' }}>÷</span></React.Fragment>);
    if (p) out.push(<React.Fragment key={'t' + i}>{p}</React.Fragment>);
  });
  return out;
}
