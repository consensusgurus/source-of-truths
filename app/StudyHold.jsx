'use client';

// THE STUDY HOLD (owner, 2026-10-10). A reader asked for time to look at a
// finished Anon or Redact board before the end card takes the screen: the
// answers are the interesting part of those two games, and the finish used to
// flip to the card before anyone could read them.
//
// So a finish starts a hold instead of mounting the end card. The board stays
// up with the answers shown, a bar under it counts down, and the reader can
// stop the countdown (Keep looking) or skip it (See results). The end card
// mounts only when the hold ends, which also means the finish beat and the
// curtain play when the reader is ready, not before.
//
// A hold is started only by a finish that happens on this page load, never by
// opening a board finished earlier, so a returning reader goes straight to the
// card as before. Nothing here is stored.

import React, { useCallback, useEffect, useState } from 'react';

export const STUDY_MS = 8000;

export function useStudyHold() {
  // null = no hold; a number = counting down to that time; 'stay' = held open.
  const [hold, setHold] = useState(null);
  const [now, setNow] = useState(0);

  useEffect(() => {
    if (typeof hold !== 'number') return undefined;
    setNow(Date.now());
    const iv = setInterval(() => {
      const t = Date.now();
      setNow(t);
      if (t >= hold) setHold(null);
    }, 250);
    return () => clearInterval(iv);
  }, [hold]);

  const start = useCallback((ms = STUDY_MS) => setHold(Date.now() + ms), []);
  const stay = useCallback(() => setHold('stay'), []);
  const done = useCallback(() => setHold(null), []);
  const left = typeof hold === 'number' ? Math.max(0, Math.ceil((hold - now) / 1000)) : null;

  return { active: hold !== null, staying: hold === 'stay', left, start, stay, done };
}

export function StudyBar({ hold, note }) {
  if (!hold || !hold.active) return null;
  return (
    <div className="sth-bar" role="status">
      <style dangerouslySetInnerHTML={{ __html: CSS }} />
      <span className="sth-tx">
        {note}{' '}
        {hold.staying ? 'Take your time.' : `Your results open in ${hold.left || 1}s.`}
      </span>
      <span className="sth-acts">
        {!hold.staying && (
          <button type="button" className="sth-b" onClick={hold.stay}>Keep looking</button>
        )}
        <button type="button" className="sth-b sth-go" onClick={hold.done}>See results</button>
      </span>
    </div>
  );
}

const CSS = `
.sth-bar{display:flex;align-items:center;justify-content:space-between;gap:10px 14px;flex-wrap:wrap;margin:14px 0 4px;padding:12px 14px;border-radius:10px;border:1px solid var(--stg-line,rgba(28,30,36,.14));background:var(--stg-surf,#fff);color:var(--stg-ink,#14161b);font-size:14px;font-weight:700;line-height:1.4;}
.sth-tx{flex:1 1 220px;min-width:0;}
.sth-acts{display:flex;gap:8px;flex-wrap:wrap;margin-left:auto;}
.sth-b{font:inherit;font-size:13.5px;font-weight:800;padding:8px 14px;border-radius:8px;cursor:pointer;border:1.5px solid var(--stg-line2,rgba(28,30,36,.3));background:transparent;color:var(--stg-ink,#14161b);}
.sth-go{border-color:transparent;background:var(--stg-acc,#2563eb);color:var(--stg-onramp,#fff);}
`;
