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
import { DRAWING, DRAWING_COPY, drawingIsLive, formatTickets } from '@/lib/drawing';

const KEY = 'sot_drawing_banner_until';
const HIDE_MS = 3 * 24 * 60 * 60 * 1000;
const FONT = "'Manrope', system-ui, -apple-system, sans-serif";
const TICKET = 'M9 1 H87 A8 8 0 0 1 95 9 V25 A8 8 0 0 0 95 41 V57 A8 8 0 0 1 87 65 H9 A8 8 0 0 1 1 57 V41 A8 8 0 0 0 1 25 V9 A8 8 0 0 1 9 1 Z';

export default function DrawingBanner() {
  const [show, setShow] = useState(false);
  const [mine, setMine] = useState(null);

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
    <aside className="dbn" aria-label={`The ${DRAWING.prizeLabel} drawing`} style={{ fontFamily: FONT }}>
      <style dangerouslySetInnerHTML={{ __html: CSS }} />
      <div className="dbn-in">
        <svg className="dbn-tk" viewBox="0 0 96 66" aria-hidden="true">
          <path d={TICKET} fill="#e8b43a" stroke="#2a1f04" strokeWidth="3" />
          <line x1="27" y1="7" x2="27" y2="59" stroke="#2a1f04" strokeWidth="3" strokeDasharray="4 5" />
          <text x="61" y="44" textAnchor="middle" fontFamily="inherit" fontSize="24" fontWeight="800" fill="#2a1f04">{DRAWING.prizeLabel}</text>
        </svg>
        <div className="dbn-tx">
          <b>Win {DRAWING.prizeLabel} in the Mind Loft drawing.</b>
          <span>
            {DRAWING_COPY.banner}
            {mine != null ? <> You have <strong>{formatTickets(mine)} ticket{mine === 1 ? '' : 's'}</strong>.</> : null}
            {' '}Drawn {DRAWING.drawLabel}.
          </span>
        </div>
        <a className="dbn-go" href="/quizzes/community#drawing-earn">See all ways to earn</a>
        <button type="button" className="dbn-x" onClick={close} aria-label="Hide for 3 days">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18" /></svg>
        </button>
      </div>
    </aside>
  );
}

// Fixed colours, not stage tokens: the banner sits outside the stage root, and
// a pale gold strip with near-black ink reads on either register.
const CSS = `
.dbn{background:#fff8e6;border-bottom:1px solid rgba(232,180,58,.6);color:#0b0d12}
.dbn-in{max-width:1120px;margin:0 auto;padding:12px 16px 12px 24px;display:flex;align-items:center;gap:16px}
.dbn-tk{flex:none;width:54px;height:38px}
.dbn-tx{flex:1 1 auto;min-width:0;line-height:1.45}
.dbn-tx b{display:block;font-size:15.5px;font-weight:800}
.dbn-tx span{display:block;font-size:14px;color:#3f4757}
.dbn-tx strong{color:#0b0d12;font-weight:800}
.dbn-go{flex:none;display:inline-flex;align-items:center;height:42px;padding:0 18px;border-radius:10px;background:#2563eb;color:#fff;font-size:14px;font-weight:800;text-decoration:none}
.dbn-go:hover{background:#1d4ed8;color:#fff}
.dbn-x{flex:none;width:44px;height:44px;border:0;border-radius:10px;background:transparent;color:#5f6774;cursor:pointer;display:flex;align-items:center;justify-content:center}
.dbn-x:hover{background:rgba(232,180,58,.2);color:#0b0d12}
@media(max-width:720px){
  .dbn-in{flex-wrap:wrap;padding:12px 6px 14px 16px;gap:10px 12px;align-items:flex-start}
  .dbn-tk{width:44px;height:31px;margin-top:3px}
  .dbn-tx{flex:1 1 0}
  .dbn-tx b{font-size:15px}
  .dbn-tx span{font-size:13.5px}
  .dbn-x{margin-top:-6px}
  .dbn-go{order:3;flex:1 1 100%;justify-content:center;height:44px;margin:0 10px 0 56px}
}
`;
