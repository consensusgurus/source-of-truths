'use client';

// THE STICKY ENDING (owner, 2026-10-18). A daily finish no longer floods the
// screen, shrinks into a band and hands over to a page of doors. The category
// colour takes the whole screen and STAYS, and three questions land on it in
// order, each answered once:
//
//   1. How did I do?          the verdict and the game's own key figure
//   2. Where do I stand today? rank and share of the field, on one line, a bar
//   3. Against myself?         a headline and a track (average, today, best),
//                              or the last seven days on a loss
//
// Under them, never more than four rows and always on screen: Challenge a
// friend, Play similar + Play another, and "See full details", which opens a
// light sheet with the board, recent runs, streak, set progress and IQ.
//
// Every figure is computed by StageFinish and passed in, so this file renders
// and animates and nothing else. Spacing is space-evenly on the real viewport
// height (100dvh) with a 16px floor, and every block reserves its space from
// the first frame and only fades in, so nothing on the screen moves once it
// has landed.
//
// Mock-up: the "Ending" canvas (Before / Main / Hands / Crux), 2026-10-18.

import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { DRAWING } from '@/lib/drawing';
import { useMyTickets } from './TicketDoor';
import { gameStats, mmss } from '@/lib/daily-row-stats';

const SANS = "Manrope, ui-sans-serif, system-ui, -apple-system, sans-serif";

// When each block lands, from the mount (ms). The mock's timings.
const T = { s1: 250, count: 900, s2: 1600, fill: 1750, s3: 3000, marks: 3150, chal: 4500, play: 5000, more: 5600 };

const ease = (t) => 1 - Math.pow(1 - t, 3);

// THE COUNT NEVER RESIZES ITS BOX: the final text sits underneath, invisible,
// and holds the width; the counting text is laid over it.
function Count({ fig, run }) {
  const [v, setV] = useState(null);
  useEffect(() => {
    if (!run || !fig || fig.n == null) return undefined;
    const t0 = performance.now();
    let raf = 0;
    const tick = (t) => {
      const p = Math.min(1, (t - t0) / T.count);
      setV(fig.n * ease(p));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [run, fig]);
  if (!fig) return null;
  const shown = fig.n == null || v == null ? fig.text
    : fig.kind === 'time' ? mmss(Math.round(v))
    : `${fig.pre || ''}${Number.isInteger(fig.n) ? Math.round(v) : v.toFixed(1)}${fig.post || ''}`;
  return (
    <span className="sst-cnt">
      <span className="sst-cnt-hold" aria-hidden="true">{fig.text}</span>
      <span className="sst-cnt-now">{shown}</span>
    </span>
  );
}

export default function StageStick({
  tone = '', eyebrow, verdict, metric, field, self, chal = null, similar = null, another = null,
  sheet = {}, onLeave,
}) {
  const [host] = useState(() => (typeof document === 'undefined' ? null : (document.querySelector('.stage-page') || document.body)));
  const [step, setStep] = useState(0);        // 0..6, how many blocks have landed
  const [fill, setFill] = useState(false);
  const [marks, setMarks] = useState(false);
  const [open, setOpen] = useState(false);
  const timers = useRef([]);
  const tk = useMyTickets();

  const skip = () => { timers.current.forEach(clearTimeout); timers.current = []; setStep(6); setFill(true); setMarks(true); };
  useEffect(() => {
    let reduced = false;
    try { reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches; } catch (e) { reduced = false; }
    if (reduced) { skip(); return undefined; }
    const at = (ms, fn) => timers.current.push(setTimeout(fn, ms));
    at(T.s1, () => setStep((s) => Math.max(s, 1)));
    at(T.s2, () => setStep((s) => Math.max(s, 2)));
    at(T.fill, () => setFill(true));
    at(T.s3, () => setStep((s) => Math.max(s, 3)));
    at(T.marks, () => setMarks(true));
    at(T.chal, () => setStep((s) => Math.max(s, 4)));
    at(T.play, () => setStep((s) => Math.max(s, 5)));
    at(T.more, () => setStep((s) => Math.max(s, 6)));
    return () => { timers.current.forEach(clearTimeout); timers.current = []; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // The page under it does not scroll while the colour is up.
  useEffect(() => {
    const html = document.documentElement;
    const prev = html.style.overflow;
    html.style.overflow = 'hidden';
    return () => { html.style.overflow = prev; };
  }, []);
  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') { if (open) setOpen(false); else skip(); } };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  if (!host) return null;
  const on = (n) => 'sst-b' + (step >= n ? ' on' : '');
  // A tap on the colour (not on a control) lands everything at once.
  const bgTap = (e) => { if (step < 6 && !(e.target.closest && e.target.closest('a,button'))) skip(); };

  const tickets = chal && chal.draw
    ? (tk.named === false ? `${DRAWING.prizeLabel} drawing: pick a name for tickets`
      : `${DRAWING.prizeLabel} drawing: you have ${tk.count == null ? '…' : tk.count} ${tk.count === 1 ? 'ticket' : 'tickets'}`)
    : null;
  const chalSub = chal ? (chal.msg || [chal.lead, tickets || 'No spoilers'].filter(Boolean).join(' · ')) : '';

  const s = sheet || {};
  const pos = (v) => `${Math.round(Math.max(0, Math.min(1, v)) * 100)}%`;

  return createPortal((
    <div className={'sst' + (tone ? ' t-' + tone : '')} onClick={bgTap} role="dialog" aria-modal="true" aria-label={`${eyebrow}: ${verdict}`}>
      <style dangerouslySetInnerHTML={{ __html: CSS }} />
      <div className="sst-in">
        {/* 1. How did I do */}
        <section className={on(1)}>
          <div className="sst-eb">{eyebrow}</div>
          <div className="sst-v">{verdict}</div>
          {metric ? (
            <div className="sst-m">
              <b><Count fig={metric} run={step >= 1} /></b>
              {metric.label ? <i>{metric.label}</i> : null}
            </div>
          ) : null}
        </section>

        {/* 2. Today's field */}
        <section className={on(2)}>
          <div className="sst-lab">Today&rsquo;s field</div>
          <div className="sst-hl">{field && field.line ? field.line : 'The board is still filling'}</div>
          <div className="sst-bar" aria-hidden="true">
            <span style={{ width: fill && field && field.pct != null ? pos(field.pct / 100) : '0%' }} />
          </div>
          <div className="sst-caps">
            <span>{field && field.lo ? field.lo : ' '}</span>
            <span>{field && field.hi ? field.hi : ' '}</span>
          </div>
        </section>

        {/* 3. Against yourself */}
        <section className={on(3)}>
          <div className="sst-lab">Against yourself</div>
          <div className="sst-hl">{self ? self.head : ' '}</div>
          {self && self.track ? (
            <div className="sst-track" aria-hidden="true">
              <span className="ln" />
              {self.track.map((p) => (
                <span key={p.k} className={'pt ' + p.k + (p.edge ? ' ' + p.edge : '') + (marks ? ' on' : '')} style={{ left: pos(p.x) }}>
                  <s />
                  <span className="lb"><em>{p.label}</em><small>{p.fig}</small></span>
                </span>
              ))}
            </div>
          ) : self && self.strip ? (
            <div className="sst-strip" aria-hidden="true">
              {self.strip.map((w, i) => (
                <s key={i} className={(w ? 'w' : 'l') + (marks ? ' on' : '') + (i === self.strip.length - 1 ? ' now' : '')}
                  style={{ transitionDelay: `${i * 60}ms` }} />
              ))}
            </div>
          ) : (
            <div className="sst-sub">{self && self.sub ? self.sub : ' '}</div>
          )}
        </section>

        {/* The four rows. */}
        <div className="sst-acts">
          {chal ? (
            <button type="button" className={'sst-chal ' + on(4)} onClick={chal.onSend}>
              <span className="tx">
                <b>{chal.title}</b>
                <i>{chalSub}</i>
              </span>
              <span className="ar" aria-hidden="true">{chal.copied ? '✓' : '→'}</span>
            </button>
          ) : null}
          {(similar || another) ? (
            <div className={'sst-row ' + on(5) + (similar && another ? '' : ' one')}>
              {similar ? (
                <a className="sst-ob" href={similar.href} onClick={similar.onClick || undefined}>
                  <b>Play similar</b>
                  <i>{similar.name}{similar.time ? <small> {similar.time}</small> : null}</i>
                </a>
              ) : null}
              {another ? (
                <a className="sst-ob" href={another.href}>
                  <b>Play another</b>
                  <i>{another.name}</i>
                </a>
              ) : null}
            </div>
          ) : null}
          <button type="button" className={'sst-more ' + on(6)} onClick={() => setOpen(true)}>See full details</button>
        </div>
      </div>

      {/* THE SHEET */}
      <div className={'sst-scrim' + (open ? ' open' : '')} onClick={() => setOpen(false)} />
      <div className={'sst-sheet' + (open ? ' open' : '')} aria-hidden={!open}>
        <div className="sst-shd">
          <b>{s.title || 'Full details'}</b>
          <button type="button" className="sst-x" onClick={() => setOpen(false)}>Close</button>
        </div>
        {s.iq != null || s.streak ? (
          <div className="sst-figs">
            {s.iq != null ? <div><b>+{Number(s.iq).toLocaleString()}</b><i>IQ earned</i></div> : null}
            {s.streak ? <div><b>{s.streak}</b><i>day streak</i></div> : null}
            {s.set ? <div><b>{s.set.n}<small>/{s.set.total}</small></b><i>{s.set.name}</i></div> : null}
          </div>
        ) : null}
        {s.rows && s.rows.length ? (
          <section>
            <div className="sst-sl">{s.boardLabel || 'Today’s board'}{s.myRank != null ? ` · you are #${s.myRank}${s.field ? ` of ${s.field}` : ''}` : ''}</div>
            <table className="sst-tbl"><tbody>
              {s.rows.map((r, i) => (r.gap ? (
                <tr key={'g' + i} className="gap"><td colSpan={3}>&middot;&middot;&middot;</td></tr>
              ) : (
                <tr key={(r.username || '') + r.rank + i} className={r.me ? 'me' : undefined}>
                  <td className="p">#{r.rank}</td>
                  <td className="w">{r.username || (r.me ? 'You' : 'Guest')}</td>
                  <td className="st">{gameStats(r, s.missLabel, s.gameKey) || '—'}</td>
                </tr>
              )))}
            </tbody></table>
          </section>
        ) : null}
        {s.recent && s.recent.length ? (
          <section>
            <div className="sst-sl">Recent runs</div>
            <div className="sst-runs">
              {s.recent.map((r) => (
                <a key={r.num} href={r.href} className={r.won ? 'w' : 'l'}>
                  <span>{r.date}</span><b>{r.fig}</b>
                </a>
              ))}
            </div>
          </section>
        ) : null}
        {s.set && s.set.games ? (
          <section>
            <div className="sst-sl">{s.set.name} &middot; {s.set.n} of {s.set.total} today</div>
            <div className="sst-set">
              {s.set.games.map((g) => (
                <a key={g.key} href={g.href} className={g.done ? 'd' : ''}>{g.done ? '✓ ' : ''}{g.name}</a>
              ))}
            </div>
          </section>
        ) : null}
        <div className="sst-links">
          {s.back ? <button type="button" onClick={() => { if (onLeave) onLeave(); s.back(); }}>{s.backLabel || 'Back to board'}</button> : null}
          {s.replay ? (s.replay.href
            ? <a href={s.replay.href} onClick={s.replay.onClick || undefined}>Replay</a>
            : <button type="button" onClick={(e) => { if (onLeave) onLeave(); if (s.replay.onClick) s.replay.onClick(e); }}>Replay</button>) : null}
          {s.catHref ? <a href={s.catHref}>All {s.catName} puzzles</a> : null}
          <a href={s.homeHref || '/'}>All daily puzzles</a>
          <button type="button" onClick={() => { if (onLeave) onLeave(); }}>Archive, share and more</button>
          <button type="button" onClick={() => setOpen(false)}>Close</button>
        </div>
      </div>
    </div>
  ), host);
}

const CSS = `
.sst{--sst-bg:var(--stg-acc);--sst-ink:var(--stg-onramp,#08222e);
  position:fixed;inset:0;z-index:9000;height:100vh;height:100dvh;overflow-y:auto;overscroll-behavior:contain;
  background:var(--sst-bg);color:var(--sst-ink);font-family:${SANS};-webkit-tap-highlight-color:transparent;}
.sst *{box-sizing:border-box;}
.sst.t-pb{--sst-bg:#e8b43a;--sst-ink:#2a1f04;}
.sst.t-lost{--sst-bg:color-mix(in srgb,var(--stg-bad) 13%,var(--stg-raise));--sst-ink:var(--stg-ink);}
.sst-in{min-height:100%;width:100%;max-width:560px;margin:0 auto;display:flex;flex-direction:column;
  justify-content:space-evenly;gap:16px;
  padding:max(28px,env(safe-area-inset-top)) max(24px,env(safe-area-inset-right)) max(30px,env(safe-area-inset-bottom)) max(24px,env(safe-area-inset-left));}
.sst-b{opacity:0;transform:translateY(10px);transition:opacity .45s ease,transform .45s cubic-bezier(.2,.8,.2,1);}
.sst-b.on{opacity:1;transform:none;}
.sst section{min-width:0;}
.sst-eb{font-size:12px;font-weight:800;letter-spacing:.14em;text-transform:uppercase;}
.sst-v{font-size:clamp(36px,11vw,44px);font-weight:800;letter-spacing:-.035em;line-height:1.02;margin-top:6px;}
.sst-m{display:flex;align-items:baseline;gap:10px;flex-wrap:wrap;margin-top:8px;}
.sst-m b{font-size:clamp(52px,17vw,70px);font-weight:800;letter-spacing:-.04em;line-height:1;font-variant-numeric:tabular-nums;}
.sst-m i{font-style:normal;font-size:15px;font-weight:700;}
.sst-cnt{display:inline-grid;}
.sst-cnt > span{grid-area:1/1;white-space:nowrap;}
.sst-cnt-hold{visibility:hidden;}
.sst-lab{font-size:11.5px;font-weight:800;letter-spacing:.13em;text-transform:uppercase;}
.sst-hl{font-size:clamp(19px,5.4vw,23px);font-weight:800;letter-spacing:-.015em;line-height:1.22;margin-top:6px;overflow-wrap:anywhere;}
.sst-sub{font-size:14px;font-weight:700;line-height:1.4;margin-top:8px;}
.sst-bar{position:relative;height:10px;border-radius:99px;margin-top:12px;overflow:hidden;
  background:color-mix(in srgb,var(--sst-ink) 20%,transparent);}
.sst-bar span{position:absolute;left:0;top:0;bottom:0;border-radius:99px;background:var(--sst-ink);transition:width 1.1s cubic-bezier(.2,.8,.2,1);}
.sst-caps{display:flex;justify-content:space-between;gap:12px;margin-top:7px;font-size:12.5px;font-weight:700;}
.sst-caps span{min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;}
.sst-track{position:relative;height:84px;margin:12px 12px 0;}
.sst-track .ln{position:absolute;left:0;right:0;top:38.5px;height:3px;border-radius:3px;background:color-mix(in srgb,var(--sst-ink) 28%,transparent);}
.sst-track .pt{position:absolute;top:0;bottom:0;width:0;opacity:0;transition:opacity .4s ease;}
.sst-track .pt.on{opacity:1;}
.sst-track .pt.today{transition-delay:.15s;}
.sst-track .pt.best{transition-delay:.3s;}
.sst-track .pt s{position:absolute;top:34px;left:-6px;width:12px;height:12px;border-radius:50%;background:var(--sst-bg);border:3px solid var(--sst-ink);}
.sst-track .pt.today s{top:30px;left:-10px;width:20px;height:20px;background:var(--sst-ink);}
.sst-track .lb{position:absolute;top:55px;left:0;transform:translateX(-50%);display:flex;flex-direction:column;align-items:center;white-space:nowrap;line-height:1.2;}
.sst-track .pt.today .lb{top:0;}
.sst-track .pt.first .lb{transform:none;left:-6px;align-items:flex-start;}
.sst-track .pt.last .lb{transform:translateX(-100%);left:6px;align-items:flex-end;}
.sst-track .lb em{font-style:normal;font-size:10.5px;font-weight:800;letter-spacing:.1em;text-transform:uppercase;}
.sst-track .lb small{font-size:13px;font-weight:800;font-variant-numeric:tabular-nums;}
.sst-strip{display:flex;gap:7px;margin-top:14px;}
.sst-strip s{flex:1;max-width:38px;height:30px;border-radius:7px;opacity:0;transform:scale(.6);
  transition:opacity .3s ease,transform .3s cubic-bezier(.3,1.6,.5,1);}
.sst-strip s.on{opacity:1;transform:none;}
.sst-strip s.w{background:var(--sst-ink);}
.sst-strip s.l{border:2.5px solid var(--sst-ink);}
.sst-strip s.now{box-shadow:0 0 0 3px var(--sst-bg),0 0 0 5px var(--sst-ink);}
.sst-acts{display:flex;flex-direction:column;gap:10px;}
.sst-chal{display:flex;align-items:center;gap:12px;width:100%;min-height:64px;padding:11px 16px 11px 18px;border:0;border-radius:14px;
  background:var(--sst-ink);color:var(--sst-bg);font:inherit;text-align:left;cursor:pointer;}
.sst-chal .tx{display:flex;flex-direction:column;gap:3px;min-width:0;flex:1;}
.sst-chal b{font-size:17px;font-weight:800;line-height:1.2;}
.sst-chal i{font-style:normal;font-size:12.5px;font-weight:700;line-height:1.3;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;}
.sst-chal .ar{flex:none;font-size:22px;font-weight:800;}
.sst-row{display:grid;grid-template-columns:1fr 1fr;gap:10px;}
.sst-row.one{grid-template-columns:1fr;}
.sst-ob{display:flex;flex-direction:column;justify-content:center;gap:2px;min-width:0;min-height:60px;padding:9px 14px;border-radius:14px;
  border:2px solid var(--sst-ink);color:var(--sst-ink);text-decoration:none;}
.sst-ob b{font-size:15.5px;font-weight:800;line-height:1.2;}
.sst-ob i{font-style:normal;font-size:12.5px;font-weight:700;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;}
.sst-ob i small{font-size:11px;font-weight:700;}
.sst-chal:hover,.sst-ob:hover{filter:brightness(1.08);}
.sst-chal:focus-visible,.sst-ob:focus-visible,.sst-more:focus-visible{outline:2px solid var(--sst-ink);outline-offset:3px;}
.sst-more{align-self:center;background:none;border:0;color:var(--sst-ink);font:inherit;font-size:14.5px;font-weight:800;
  text-decoration:underline;text-decoration-thickness:1.5px;text-underline-offset:4px;padding:6px 10px;cursor:pointer;}
.sst-scrim{position:fixed;inset:0;z-index:9001;background:rgba(5,8,14,.45);opacity:0;pointer-events:none;transition:opacity .3s ease;}
.sst-scrim.open{opacity:1;pointer-events:auto;}
.sst-sheet{position:fixed;left:0;right:0;bottom:0;z-index:9002;max-width:600px;margin:0 auto;max-height:88vh;max-height:88dvh;overflow-y:auto;
  background:#ffffff;color:#0b0d12;border-radius:20px 20px 0 0;padding:18px 20px max(22px,env(safe-area-inset-bottom));
  transform:translateY(105%);visibility:hidden;transition:transform .38s cubic-bezier(.2,.8,.2,1),visibility 0s linear .38s;box-shadow:0 -10px 40px rgba(0,0,0,.25);}
.sst-sheet.open{transform:none;visibility:visible;transition:transform .38s cubic-bezier(.2,.8,.2,1),visibility 0s;}
.sst-shd{display:flex;align-items:center;justify-content:space-between;gap:12px;margin-bottom:12px;}
.sst-shd b{font-size:18px;font-weight:800;}
.sst-x{background:#eef1f6;border:0;border-radius:99px;padding:7px 14px;font:inherit;font-size:13px;font-weight:800;color:#0b0d12;cursor:pointer;}
.sst-figs{display:flex;gap:10px;flex-wrap:wrap;margin-bottom:6px;}
.sst-figs > div{flex:1 1 90px;min-width:0;background:#f3f5f9;border-radius:12px;padding:10px 12px;display:flex;flex-direction:column;gap:2px;}
.sst-figs b{font-size:22px;font-weight:800;line-height:1.1;font-variant-numeric:tabular-nums;}
.sst-figs b small{font-size:14px;color:#5b6475;}
.sst-figs i{font-style:normal;font-size:12px;font-weight:700;color:#5b6475;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;}
.sst-sheet section{margin-top:16px;}
.sst-sl{font-size:11.5px;font-weight:800;letter-spacing:.11em;text-transform:uppercase;color:#5b6475;margin-bottom:7px;}
.sst-tbl{width:100%;border-collapse:collapse;font-size:14px;}
.sst-tbl td{padding:8px 6px;border-bottom:1px solid #e6e9ef;}
.sst-tbl .p{width:46px;font-weight:800;color:#5b6475;}
.sst-tbl .w{font-weight:700;max-width:0;width:45%;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;}
.sst-tbl .st{text-align:right;font-weight:700;color:#3a4252;font-variant-numeric:tabular-nums;white-space:nowrap;}
.sst-tbl tr.me td{background:#e7efff;color:#0b2a6b;}
.sst-tbl tr.me .p,.sst-tbl tr.me .st{color:#0b2a6b;}
.sst-tbl tr.gap td{text-align:center;color:#8a93a3;padding:3px;}
.sst-runs{display:grid;grid-template-columns:repeat(auto-fill,minmax(96px,1fr));gap:8px;}
.sst-runs a{display:flex;flex-direction:column;gap:2px;padding:9px 11px;border-radius:10px;background:#f3f5f9;color:#0b0d12;text-decoration:none;min-width:0;}
.sst-runs a span{font-size:11.5px;font-weight:700;color:#5b6475;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;}
.sst-runs a b{font-size:16px;font-weight:800;font-variant-numeric:tabular-nums;}
.sst-runs a.l b{color:#9a2a2a;}
.sst-set{display:flex;flex-wrap:wrap;gap:8px;}
.sst-set a{padding:8px 12px;border-radius:99px;border:1.5px solid #d6dbe4;color:#0b0d12;text-decoration:none;font-size:13.5px;font-weight:700;}
.sst-set a.d{background:#e7f5ec;border-color:#bfe3cc;color:#14532d;}
.sst-links{display:flex;flex-wrap:wrap;gap:8px;margin-top:20px;}
.sst-links a,.sst-links button{flex:1 1 150px;padding:12px 14px;border-radius:12px;border:1.5px solid #d6dbe4;background:#fff;color:#0b0d12;
  font:inherit;font-size:14px;font-weight:800;text-align:center;text-decoration:none;cursor:pointer;}
.sst-links a:hover,.sst-links button:hover{background:#f3f5f9;}
@media (max-height:640px){
  .sst-in{gap:12px;}
  .sst-v{font-size:34px;}
  .sst-m b{font-size:50px;}
  .sst-hl{font-size:18px;}
}
@media (prefers-reduced-motion:reduce){
  .sst-b,.sst-bar span,.sst-track .pt,.sst-strip s,.sst-sheet,.sst-scrim{transition:none;}
}
`;
