'use client';

// The $100 ticket drawing, on the community board (owner, 2026-10-09).
//
// Sits above the referral standings on /quizzes/community and renders nothing
// once the drawing has closed, so the page reverts to exactly what it was with
// no follow-up deploy. Anchored at #drawing, which is where the pop-up's
// "See the board and rules" link lands. All terms come from lib/drawing.js;
// all figures from /api/quiz/drawing.

import { useEffect, useState, useCallback } from 'react';
import { Copy, Check, Ticket } from 'lucide-react';
import { T } from '@/lib/theme';
import { DRAWING, DRAWING_COPY, drawingIsLive, drawingDaysLeft, ticketLabel } from '@/lib/drawing';

const FONT = "'Manrope', system-ui, -apple-system, sans-serif";

function ago(iso, now) {
  if (!now || !iso) return '';
  const s = Math.max(0, (now - new Date(iso).getTime()) / 1000);
  if (s < 60) return 'just now';
  if (s < 3600) return `${Math.floor(s / 60)} min ago`;
  if (s < 86400) return `${Math.floor(s / 3600)} hours ago`;
  if (s < 86400 * 2) return 'Yesterday';
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

export default function DrawingBoard() {
  const [live, setLive] = useState(false);
  const [days, setDays] = useState(0);
  const [now, setNow] = useState(0);
  const [data, setData] = useState(null);
  const [copied, setCopied] = useState(false);

  // The clock is read after mount, never during render (hydration).
  useEffect(() => {
    const on = drawingIsLive();
    setLive(on);
    setDays(drawingDaysLeft());
    setNow(Date.now());
    if (!on) return undefined;
    let alive = true;
    const qs = new URLSearchParams({ limit: '25' });
    try {
      const anon = localStorage.getItem('sot_quiz_anon') || '';
      if (anon) qs.set('anonId', anon);
      const id = JSON.parse(localStorage.getItem('sot_quiz_identity') || 'null');
      if (id && id.email) qs.set('email', id.email);
    } catch { /* private mode */ }
    fetch(`/api/quiz/drawing?${qs}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => { if (alive && d) setData(d); })
      .catch(() => {});
    return () => { alive = false; };
  }, []);

  const me = data && data.me;
  const copy = useCallback(async () => {
    if (!me || !me.shareUrl) return;
    try {
      await navigator.clipboard.writeText(me.shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch { /* the link is selectable */ }
  }, [me]);

  if (!live) return null;

  const total = data ? data.total : null;
  const board = (data && data.board) || [];
  const feed = (data && data.feed) || [];
  const maxT = board.length ? board[0].tickets : 1;

  return (
    <section id="drawing" className="drb" style={{ fontFamily: FONT }}>
      <style dangerouslySetInnerHTML={{ __html: CSS }} />

      <div className="drb-card drb-hero">
        <div className="drb-ramp" aria-hidden="true" />
        <div className="drb-hin">
          <div className="drb-hl">
            <div className="drb-eb">{DRAWING_COPY.eyebrow} · {DRAWING_COPY.window}</div>
            <h2 className="drb-h">One ticket per friend. One winner. {DRAWING.prizeLabel}.</h2>
            <p className="drb-p">
              Drawn at random on {DRAWING.drawLabel}. The more new players you bring in, the more
              tickets you hold and the better your odds.
            </p>
          </div>
          <div className="drb-hs">
            <div className="drb-stat gold">
              <i>In the drum</i>
              <b>{total == null ? '...' : total}</b>
              <span>{data ? `ticket${total === 1 ? '' : 's'} from ${data.holders} player${data.holders === 1 ? '' : 's'}` : 'tickets'}</span>
            </div>
            <div className="drb-stat">
              <i>Drawing in</i>
              <b>{days}d</b>
              <span>closes {DRAWING.endLabel}</span>
            </div>
          </div>
        </div>
      </div>

      {me ? (
        <div className="drb-card drb-me">
          <div className="drb-row1">
            <h3 className="drb-h3">Your tickets</h3>
            <span className="drb-sub">Signed in as {me.username}</span>
          </div>
          <div className="drb-mine">
            <div className="drb-figs">
              <div><i>Tickets</i><b>{me.count}</b></div>
              <div><i>Odds</i><b>{me.eligible ? (me.odds || '0%') : '--'}</b></div>
              <div><i>Rank</i><b>{me.rank ? `#${me.rank}` : '--'}</b></div>
            </div>
            <div className="drb-stubs">
              {me.tickets.slice(-6).map((t) => (
                <div className="drb-stub" key={t.no}>
                  <span className="drb-stub-ic"><Ticket size={16} strokeWidth={2.2} aria-hidden="true" /></span>
                  <span className="drb-stub-tx"><b>{ticketLabel(t.no)}</b><i>{t.friend || 'a new player'}</i></span>
                </div>
              ))}
              {!me.count ? <span className="drb-none">No tickets yet. Your first friend who finishes a game puts one in.</span> : null}
            </div>
          </div>
          {!me.eligible ? (
            <p className="drb-warn">Add an email to your account to put your tickets in the drum. Tickets you have earned still count once you do.</p>
          ) : null}
          {me.shareUrl ? (
            <div className="drb-link">
              <label htmlFor="drb-url">Your ticket link</label>
              <input id="drb-url" readOnly value={me.shareUrl.replace(/^https?:\/\//, '')} onFocus={(e) => e.target.select()} />
              <button type="button" onClick={copy}>
                {copied ? <Check size={15} strokeWidth={2.4} /> : <Copy size={15} strokeWidth={2.2} />}{copied ? 'Copied' : 'Copy link'}
              </button>
            </div>
          ) : null}
        </div>
      ) : null}

      <div className="drb-two">
        <div className="drb-card drb-board">
          <div className="drb-row1">
            <h3 className="drb-h3">Ticket holders</h3>
            <span className="drb-sub">Odds update live</span>
          </div>
          {board.length ? (
            <>
              <div className="drb-tr drb-th"><span>#</span><span>Player</span><span className="r">Tickets</span><span>Odds</span></div>
              {board.map((r) => {
                const mine = me && me.code && r.refCode && String(r.refCode).toLowerCase() === String(me.code).toLowerCase();
                return (
                  <div className={`drb-tr${mine ? ' me' : ''}`} key={r.refCode || r.username}>
                    <span className="drb-rk">{r.rank}</span>
                    <span className="drb-nm">{r.username}{mine ? ' (you)' : ''}</span>
                    <span className="drb-n r">{r.tickets}</span>
                    <span className="drb-od">
                      <span className="drb-bar"><span style={{ width: `${Math.max(4, Math.round((r.tickets / maxT) * 100))}%` }} /></span>
                      <span className="drb-pct">{r.odds}</span>
                    </span>
                  </div>
                );
              })}
            </>
          ) : (
            <p className="drb-empty">{data ? 'The drum is empty so far. The first friend you bring in puts the first ticket in.' : 'Loading...'}</p>
          )}
        </div>

        <div className="drb-card drb-feed">
          <h3 className="drb-h3">Latest tickets</h3>
          {feed.length ? feed.map((f) => (
            <div className="drb-fr" key={f.no}>
              <span className="drb-fic"><Ticket size={14} strokeWidth={2.4} aria-hidden="true" /></span>
              <span className="drb-ftx"><b>{f.who}</b> brought in {f.friend || 'a new player'}<em>Ticket {ticketLabel(f.no)} · {ago(f.at, now)}</em></span>
            </div>
          )) : <p className="drb-empty">{data ? 'No tickets yet.' : 'Loading...'}</p>}
        </div>
      </div>

      <div className="drb-card drb-how" id="drawing-rules">
        <h3 className="drb-h3">How tickets work</h3>
        <div className="drb-steps">
          <div><b className="n">1</b><b>Share your link</b><span>Your ticket link, and the Share button on every quiz and daily game, carry your name.</span></div>
          <div><b className="n">2</b><b>A friend finishes a game</b><span>A brand-new player who completes one game from your link earns you one ticket. Each person counts once.</span></div>
          <div><b className="n">3</b><b>One ticket is drawn</b><span>On {DRAWING.drawLabel} one ticket is drawn at random for {DRAWING.prizeLabel}, paid by PayPal, bank transfer, gift card or Venmo.</span></div>
        </div>
        <p className="drb-legal">{DRAWING_COPY.legal} The drawing runs {DRAWING_COPY.window} and closes {DRAWING.deadlineLabel}.</p>
      </div>
    </section>
  );
}

const CSS = `
.drb{margin:0 0 18px;color:${T.ink}}
.drb-card{background:${T.white};border:1px solid rgba(20,22,28,.18);border-radius:14px;margin-bottom:14px;overflow:hidden}
.drb-ramp{height:6px;background:#7db0ff}
.drb-hin{padding:22px 24px;display:flex;flex-wrap:wrap;gap:20px;align-items:center;justify-content:space-between}
.drb-hl{flex:999 1 360px;min-width:0}
.drb-eb{font-size:11px;letter-spacing:.14em;text-transform:uppercase;color:${T.blue};font-weight:800}
.drb-h{margin:8px 0 0;font-size:30px;line-height:1.1;font-weight:800;letter-spacing:-.02em}
.drb-p{margin:10px 0 0;font-size:14.5px;line-height:1.55;color:${T.muted}}
.drb-hs{flex:1 1 320px;display:flex;gap:10px}
.drb-stat{flex:1 1 0;border-radius:12px;background:${T.surface};padding:14px 16px}
.drb-stat.gold{background:#fff8e6;border:1px solid #f0d48a}
.drb-stat i{display:block;font-style:normal;font-size:10.5px;letter-spacing:.12em;text-transform:uppercase;font-weight:800;color:${T.slate}}
.drb-stat.gold i{color:#8a5a00}
.drb-stat b{display:block;margin-top:2px;font-size:34px;font-weight:800;letter-spacing:-.02em}
.drb-stat span{font-size:12.5px;font-weight:600;color:${T.slate}}
.drb-me,.drb-board,.drb-feed,.drb-how{padding:20px 24px}
.drb-row1{display:flex;align-items:baseline;justify-content:space-between;gap:10px;flex-wrap:wrap}
.drb-h3{margin:0;font-size:18px;font-weight:800;letter-spacing:-.01em}
.drb-sub{font-size:12.5px;font-weight:600;color:${T.slate}}
.drb-mine{margin-top:14px;display:flex;flex-wrap:wrap;gap:20px;align-items:center}
.drb-figs{display:flex;gap:26px}
.drb-figs i{display:block;font-style:normal;font-size:10.5px;letter-spacing:.12em;text-transform:uppercase;font-weight:800;color:${T.slate}}
.drb-figs b{font-size:28px;font-weight:800}
.drb-stubs{flex:1 1 280px;display:flex;gap:8px;flex-wrap:wrap;justify-content:flex-end;align-items:center}
.drb-stub{display:flex;align-items:stretch;height:42px;border-radius:8px;overflow:hidden;background:${T.gold};color:${T.ink}}
.drb-stub-ic{display:flex;align-items:center;padding:0 10px;border-right:2px dashed rgba(11,13,18,.35)}
.drb-stub-tx{display:flex;flex-direction:column;justify-content:center;padding:0 12px;line-height:1.15}
.drb-stub-tx b{font-size:13px;font-weight:800}
.drb-stub-tx i{font-style:normal;font-size:11px;font-weight:600;max-width:120px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.drb-none{font-size:13px;color:${T.slate};font-weight:600}
.drb-warn{margin:12px 0 0;font-size:13px;font-weight:700;color:#9a3412;line-height:1.5}
.drb-link{margin-top:16px;display:flex;gap:8px;flex-wrap:wrap;align-items:center}
.drb-link label{flex-basis:100%;font-size:10px;letter-spacing:.14em;text-transform:uppercase;font-weight:800;color:${T.slate}}
.drb-link input{flex:1 1 240px;min-width:0;height:44px;box-sizing:border-box;border:1px solid rgba(11,15,26,.24);border-radius:10px;padding:0 12px;font-family:inherit;font-size:14px;color:${T.ink};background:${T.white}}
.drb-link button{height:44px;display:inline-flex;align-items:center;gap:6px;padding:0 16px;border:0;border-radius:10px;background:${T.cta};color:${T.ctaInk};font-family:inherit;font-weight:800;font-size:14px;cursor:pointer}
.drb-two{display:flex;flex-wrap:wrap;gap:14px;align-items:flex-start}
.drb-two>.drb-card{margin-bottom:0}
.drb-board{flex:999 1 440px;min-width:0}
.drb-feed{flex:1 1 260px;min-width:0}
.drb-tr{display:grid;grid-template-columns:34px minmax(0,1fr) 62px minmax(0,150px);gap:0 12px;align-items:center;padding:9px 0;border-bottom:1px solid #f0f1f4}
.drb-th{margin-top:12px;font-size:10.5px;letter-spacing:.12em;text-transform:uppercase;font-weight:800;color:${T.slate};border-bottom:1px solid ${T.border};padding-top:0}
.drb-tr .r{text-align:right}
.drb-tr.me{background:${T.accentSoft}}
.drb-rk{font-size:13px;font-weight:800;color:${T.slate}}
.drb-nm{font-size:14px;font-weight:700;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.drb-tr.me .drb-nm{font-weight:800}
.drb-n{font-size:15px;font-weight:800}
.drb-od{display:flex;align-items:center;gap:8px}
.drb-bar{flex:1 1 auto;height:8px;border-radius:8px;background:#f0f1f4;overflow:hidden}
.drb-bar span{display:block;height:8px;border-radius:8px;background:${T.gold}}
.drb-pct{flex:none;width:44px;text-align:right;font-size:12.5px;font-weight:700;color:${T.muted}}
.drb-empty{margin:12px 0 0;font-size:13.5px;color:${T.slate};line-height:1.5}
.drb-fr{display:flex;gap:10px;align-items:center;padding:9px 0;border-bottom:1px solid #f0f1f4}
.drb-fic{flex:none;width:30px;height:30px;border-radius:999px;background:#fff8e6;border:1px solid #f0d48a;color:#8a5a00;display:flex;align-items:center;justify-content:center}
.drb-ftx{min-width:0;font-size:13.5px;line-height:1.4;color:${T.muted}}
.drb-ftx b{color:${T.ink}}
.drb-ftx em{display:block;font-style:normal;font-size:12px;color:${T.slate}}
.drb-how{margin-top:14px}
.drb-steps{margin-top:12px;display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:12px}
.drb-steps>div{padding:14px 16px;border-radius:12px;background:${T.surface};display:flex;flex-direction:column;gap:4px}
.drb-steps .n{font-size:24px;color:${T.blue}}
.drb-steps b{font-size:14.5px;font-weight:800}
.drb-steps span{font-size:13.5px;line-height:1.5;color:${T.muted}}
.drb-legal{margin:14px 0 0;font-size:12px;line-height:1.6;color:${T.slate}}
@media(max-width:560px){
  .drb-hin,.drb-me,.drb-board,.drb-feed,.drb-how{padding:16px}
  .drb-h{font-size:24px}
  .drb-stubs{justify-content:flex-start}
  .drb-tr{grid-template-columns:28px minmax(0,1fr) 46px 52px}
  .drb-bar{display:none}
}
`;
