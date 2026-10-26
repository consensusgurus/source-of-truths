'use client';

// THE DRAWING BANNER (owner, 2026-10-21): a strip at the top of the homepage
// while the ticket drawing runs. Chosen over a pop-up, so it never covers a
// game. The X hides it for three days in this browser, then it comes back.
//
// Renders nothing on the server and nothing until mounted, because whether it
// shows depends on the clock and on this browser's storage. It sits OUTSIDE
// the homepage snapshot box (lib/home-snapshot.js), or a cached copy would
// keep painting a banner the reader already closed.

import { useEffect, useState } from 'react';
import { DRAWING, drawingIsLive, formatTickets } from '@/lib/drawing';
import { useStageTheme } from '@/lib/stage-theme';
const KEY = 'sot_drawing_banner_until';
const HIDE_MS = 3 * 24 * 60 * 60 * 1000;
const FONT = "'Manrope', system-ui, -apple-system, sans-serif";

export default function DrawingBanner() {
  const [show, setShow] = useState(false);
  const [mine, setMine] = useState(null);
  // The reader's own register, so the bar wears the same tokens as the page.
  const [theme] = useStageTheme();

  useEffect(() => {
    if (!drawingIsLive()) return undefined;
    try {
      const until = Number(localStorage.getItem(KEY) || 0);
      if (until && Date.now() < until) return undefined;
    } catch { /* private mode: show it */ }
    setShow(true);
    let alive = true;
    const qs = new URLSearchParams({ limit: '1' });
    try {
      const anon = localStorage.getItem('sot_quiz_anon') || '';
      if (anon) qs.set('anonId', anon);
      const id = JSON.parse(localStorage.getItem('sot_quiz_identity') || 'null');
      if (id && id.email) qs.set('email', id.email);
    } catch { /* ignore */ }
    fetch(`/api/quiz/drawing?${qs}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => { if (alive && d && d.me) setMine(d.me.count || 0); })
      .catch(() => {});
    return () => { alive = false; };
  }, []);

  if (!show) return null;

  const close = () => {
    try { localStorage.setItem(KEY, String(Date.now() + HIDE_MS)); } catch { /* ignore */ }
    setShow(false);
  };

  return (
    <aside className="dbn" data-dbn-theme={theme} aria-label={`The ${DRAWING.prizeLabel} drawing`}>
      <style dangerouslySetInnerHTML={{ __html: CSS }} />
      <div className="dbn-in">
        <svg className="dbn-tk" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M2 9a3 3 0 0 1 0 6v2a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-2a3 3 0 0 1 0-6V7a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2Z" /><path d="M13 5v2M13 17v2M13 11v2" />
        </svg>
        <div className="dbn-tx">
          <span className="dbn-eb">The {DRAWING.prizeLabel} Drawing · Through {DRAWING.endLabel}</span>
          <span className="dbn-ln">
            Earn tickets for new players you bring in, 7-day streaks and wins.
            {mine != null ? <> You have <b>{formatTickets(mine)} ticket{mine === 1 ? '' : 's'}</b>.</> : null}
          </span>
        </div>
        <a className="dbn-go" href="/quizzes/community#drawing-earn">See all ways to earn</a>
        <button type="button" className="dbn-x" onClick={close} aria-label="Hide for 3 days">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18" /></svg>
        </button>
      </div>
    </aside>
  );
}

// The stage's own values for both registers (app/globals.css, .stage-page and
// its light block), mirrored here rather than borrowed: several components
// attach overlays to the FIRST .stage-page in the document, and this bar sits
// above the page, so it must not carry that class. The
// type and the pill follow the home's top bar (.sty-cap); gold is the colour
// the cap already gives the ticket count.
const CSS = `
.dbn{--b-raise:#0e131f;--b-line:hsla(0,0%,100%,.11);--b-surf2:hsla(0,0%,100%,.08);--b-ink:#e9edf4;--b-ink2:#aab5c7;--b-mute:#8b95a8;--b-acc:#e9edf4;--b-tint:hsla(0,0%,100%,.1);--dbn-gold:#f5c84c;
  font-family:'Manrope',system-ui,-apple-system,sans-serif;background:var(--b-raise);color:var(--b-ink);border-bottom:1px solid var(--b-line)}
html:not([data-stage-boot='dark']) .dbn[data-dbn-theme='light']{--b-raise:#ffffff;--b-line:rgba(11,15,26,.14);--b-surf2:#e4e9f1;--b-ink:#0b0d12;--b-ink2:#3f4757;--b-mute:#5f6774;--b-acc:#0b0d12;--b-tint:rgba(11,13,18,.07);--dbn-gold:#8a5a00}
.dbn-in{display:flex;align-items:center;gap:14px;padding:9px 12px 9px 22px}
.dbn-tk{flex:none;color:var(--dbn-gold)}
.dbn-tx{flex:1 1 auto;min-width:0;display:flex;align-items:baseline;gap:12px;flex-wrap:wrap;row-gap:2px}
.dbn-eb{font-size:9.5px;font-weight:800;letter-spacing:.12em;text-transform:uppercase;color:var(--dbn-gold);white-space:nowrap}
.dbn-ln{font-size:13px;font-weight:600;line-height:1.45;color:var(--b-ink2)}
.dbn-ln b{color:var(--dbn-gold);font-weight:800}
.dbn-go{flex:none;font-size:12.5px;font-weight:800;color:var(--b-acc);text-decoration:none;border:2px solid var(--b-acc);border-radius:999px;padding:6px 12px;white-space:nowrap}
.dbn-go:hover{background:var(--b-tint)}
.dbn-x{flex:none;width:32px;height:32px;border:0;border-radius:8px;background:transparent;color:var(--b-mute);cursor:pointer;display:flex;align-items:center;justify-content:center}
.dbn-x:hover{background:var(--b-surf2);color:var(--b-ink)}
@media(max-width:720px){
  .dbn-in{display:grid;grid-template-columns:20px minmax(0,1fr) 44px;column-gap:10px;row-gap:10px;align-items:start;padding:12px 4px 14px 16px}
  .dbn-tk{grid-column:1;grid-row:1;margin-top:1px}
  .dbn-tx{grid-column:2;grid-row:1;flex-direction:column;gap:3px}
  .dbn-eb{white-space:normal;line-height:1.35}
  .dbn-x{grid-column:3;grid-row:1;width:44px;height:44px;margin-top:-12px}
  .dbn-go{grid-column:2 / 4;grid-row:2;justify-self:start;padding:9px 14px}
}
`;
