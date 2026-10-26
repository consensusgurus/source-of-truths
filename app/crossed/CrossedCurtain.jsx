'use client';

// CROSSED'S ENDING: the Dojo's curtain timing (app/dojo/DyeCurtain.jsx) in
// Crossed Up's own dress (owner, 2026-10-20): crossword grids and THE WEEK,
// seven squares MON to PEN that ink in as the total climbs (app/crossed/Week.jsx).
//
// Each puzzle takes over the whole screen in its own colour: its grid fills in
// a diagonal ripple, its clock counts to the real time it took, and its points
// land. Then the colour drains back to the midnight ground and the run total
// climbs the week, Monday to In Pen: every rank it reaches floods the screen in
// that rank's colour for a beat while its square of the week is inked, and the
// seal comes down on the last one before the curtain lifts onto the card.
//
// IT IS A CURTAIN. It posts nothing and stores nothing; every figure is one the
// run already holds. A puzzle that was not solved never shows its answer: its
// grid shows the shape alone.
//
// THE PAINT GOES ON THE ROOT, a fixed element that IS the screen (the
// GauntletFinale lesson). Numbers that count sit in fixed boxes with tabular
// figures, so nothing moves as they tick.

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { holdRootPaint } from '@/lib/root-paint';
import { CROSSED_BELTS, CROSSED_MAX, crossedTierOf } from '@/lib/crossed';
import Week, { WEEK_CSS } from './Week';

const B = CROSSED_BELTS;
const LOW = B.length - 1;
const NUMS = ['One', 'Two', 'Three', 'Four', 'Five'];
const MID = '#0b0f1a';
const INK_LT = '#e9edf4';

// The mockup's clock, to the millisecond.
const P0 = 300;      // lights down
const PD = 2000;     // one form owns the screen
const WAVE = 1250;   // the ripple, after a 100ms beat
const CLOCK = 1350;  // the clock's count
const SCROLL = 1450; // the scroll fills
const STEP = 650;    // one rank on the climb
const FLASH = 260;   // the flood
const GAP = 600;     // the last rank, held, before the seal
const HOLD = 2600;   // the inked week, before the card

const ease = (x) => { const v = Math.max(0, Math.min(1, x)); return 1 - Math.pow(1 - v, 3); };
const fmtClock = (s) => { const v = Math.max(0, Math.round(Number(s) || 0)); return `${Math.floor(v / 60)}:${String(v % 60).padStart(2, '0')}`; };

function inkOn(hex) {
  const h = String(hex || '').replace('#', '');
  if (h.length !== 6) return MID;
  const n = parseInt(h, 16);
  const lin = (c) => { const s = c / 255; return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4); };
  const L = 0.2126 * lin((n >> 16) & 255) + 0.7152 * lin((n >> 8) & 255) + 0.0722 * lin(n & 255);
  return L > 0.3 ? MID : '#ffffff';
}

// A number that counts, on its own frame loop.
function Count({ from = 0, to, ms, fmt }) {
  const [v, setV] = useState(from);
  useEffect(() => {
    setV(from);
    const t0 = performance.now();
    let raf = 0;
    const tick = (t) => {
      const p = Math.min(1, (t - t0) / Math.max(1, ms));
      setV(from + (to - from) * ease(p));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [from, to, ms]);
  const n = Math.round(v);
  return <>{fmt ? fmt(n) : n}</>;
}

// When the ripple reaches anti-diagonal d (cells with r + c = d): the mockup's
// wave is ease((t - 100) / 1250) * (2n - 1), and a cell is on once the wave
// passes it, so this inverts the ease.
function waveAt(d, n) {
  const span = 2 * n - 1;
  const y = Math.min(1, d / span);
  return 100 + WAVE * (1 - Math.cbrt(1 - y));
}

// The day's grid as rows of letters, '#' for a black square, ' ' for a white
// square left blank. A solved puzzle shows its letters; anything else shows
// the shape alone, so a curtain never prints an answer the player did not get.
export function gridOf(sec, res) {
  const p = (sec && sec.puzzle) || {};
  const solved = !!(res && !res.unknown && Number(res.total) > 0 && Number(res.score) >= Number(res.total));
  let rows = [];
  if (Array.isArray(p.grid)) rows = p.grid.map((r) => String(r));
  else if (Array.isArray(p.rows) && typeof p.key === 'string') {
    const k = p.key;
    rows = p.rows.map((r) => String(r).replace(/\./g, '#').replace(/[a-z]/g, (c) => k[c.charCodeAt(0) - 97] || ' '));
  } else if (Array.isArray(p.rounds)) {
    const w = Math.max(4, ...p.rounds.flatMap((rd) => (rd.rows || []).map((x) => String(x.a || '').length)));
    p.rounds.forEach((rd, ri) => {
      if (ri > 0) rows.push('#'.repeat(w));
      for (const x of rd.rows || []) { const a = String(x.a || '').toUpperCase(); rows.push(a + '#'.repeat(Math.max(0, w - a.length))); }
    });
  }
  if (!rows.length) rows = Array.from({ length: 5 }, () => '     ');
  const w = Math.max(...rows.map((r) => r.length));
  const cells = rows.map((r) => {
    const out = [];
    for (let c = 0; c < w; c++) {
      const ch = r[c] === undefined ? '#' : r[c];
      out.push(ch === '#' ? '#' : (solved && /[A-Za-z]/.test(ch) ? ch.toUpperCase() : ' '));
    }
    return out;
  });
  return { w, h: cells.length, cells };
}

function Grid({ sec, res }) {
  const { w, h, cells } = useMemo(() => gridOf(sec, res), [sec, res]);
  const n = Math.max(w, h);
  const out = [];
  for (let r = 0; r < h; r++) for (let c = 0; c < w; c++) {
    const d = r + c;
    const on = waveAt(d, n);
    const off = waveAt(d + 2, n);
    const v = cells[r][c];
    const black = v === '#';
    out.push(
      <div key={`${r}-${c}`} className={`dc-c${black ? ' blk' : ''}`} style={{
        borderRight: c === w - 1 ? '0' : '1px solid rgba(11,15,26,.3)',
        borderBottom: r === h - 1 ? '0' : '1px solid rgba(11,15,26,.3)',
        '--wd': `${Math.round(on)}ms`, '--wl': `${Math.max(60, Math.round(off - on))}ms`,
      }}>
        {!black && v !== ' ' ? <span>{v}</span> : null}
      </div>,
    );
  }
  const fs = Math.max(9, Math.min(30, Math.round(220 / n)));
  return (
    <div className="dc-grid" style={{ gridTemplateColumns: `repeat(${w}, minmax(0, 1fr))`, gridTemplateRows: `repeat(${h}, minmax(0, 1fr))`, aspectRatio: `${w} / ${h}`, '--fs': `${fs}px` }}>{out}</div>
  );
}

export default function CrossedCurtain({ sections = [], counted = [], parts = [], total = 0, runClock = 0, dateShort = '', board = null, onDone }) {
  const N = sections.length;
  const fti = crossedTierOf(total);
  // The ranks the total climbs through, Monday first.
  const climb = useMemo(() => { const out = []; for (let i = LOW; i >= fti; i--) out.push(i); return out; }, [fti]);
  const pts = parts.map((p) => Math.round(p));

  // step: -1 lights down, 0..N-1 a form, N the climb, N + 1 the seal.
  const [step, setStep] = useState(-1);
  const [filled, setFilled] = useState(0);
  const [k, setK] = useState(0);
  const [flash, setFlash] = useState(false);
  const [thud, setThud] = useState(false);
  const doneRef = useRef(false);
  const finish = () => {
    if (doneRef.current) return;
    doneRef.current = true;
    if (typeof onDone === 'function') onDone();
  };

  useEffect(() => {
    if (!N) { finish(); return undefined; }
    const timers = [];
    const at = (ms, fn) => timers.push(setTimeout(fn, ms));
    for (let i = 0; i < N; i++) {
      at(P0 + i * PD, () => setStep(i));
      at(P0 + i * PD + SCROLL, () => setFilled(i + 1));
    }
    const RP = P0 + N * PD;
    at(RP, () => { setStep(N); setK(0); });
    climb.forEach((_, j) => {
      at(RP + j * STEP, () => { setK(j); setFlash(true); });
      at(RP + j * STEP + FLASH, () => setFlash(false));
    });
    const BOARD = RP + climb.length * STEP + GAP;
    at(BOARD, () => { setStep(N + 1); setThud(true); });
    at(BOARD + 450, () => setThud(false));
    at(BOARD + HOLD, finish);
    return () => timers.forEach(clearTimeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [N]);

  useEffect(() => {
    const go = () => finish();
    window.addEventListener('keydown', go);
    return () => window.removeEventListener('keydown', go);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  // The page underneath stays put while the curtain is up.
  useEffect(() => {
    let prev = '';
    try { prev = document.documentElement.style.overflow; document.documentElement.style.overflow = 'hidden'; } catch (e) {}
    return () => { try { document.documentElement.style.overflow = prev; } catch (e) {} };
  }, []);

  const painting = step >= 0 && step < N;
  const counting = step === N;
  const sealed = step === N + 1;
  const sec = painting ? sections[step] : null;
  const res = painting ? counted[step] : null;
  const bi = counting ? climb[Math.min(k, climb.length - 1)] : fti;
  const rank = B[bi];
  let bg = MID, ink = INK_LT;
  if (painting) { bg = sec.color; ink = MID; } else if (counting && flash) { bg = rank[3]; ink = inkOn(rank[3]); }
  const capRight = painting ? `Puzzle ${step + 1} of ${N}` : sealed ? 'Graded' : '';

  // The climb: each rank counts from its own cutoff to just under the next one,
  // and the last to the real total.
  const lastK = climb.length - 1;
  const kk = Math.min(k, lastK);
  const lo = B[climb[kk]][0];
  const hi = kk === lastK ? total : B[climb[kk + 1]][0] - 1;

  const me = board && board.data && board.data.me;
  const field = board && board.data && Array.isArray(board.data.overall) ? (board.data.uniquePlayers || board.data.overall.length) : null;
  const up = fti > 0 ? B[fti - 1] : null;
  const short = up ? Math.max(1, up[0] - total) : 0;

  // The root takes the curtain's colour while it is up, so the scrollbar
  // gutter is never a dark strip beside it (lib/root-paint.js).
  useEffect(() => holdRootPaint(bg), [bg]);
  return (
    <div
      className={`dc${thud ? ' thud' : ''}`}
      style={{ background: bg, color: ink, transition: `background ${counting && flash ? '.05s' : '.45s'} ease, color .3s ease` }}
      onClick={finish}
      role="button"
      tabIndex={0}
      aria-label="Skip to your rank"
    >
      <style dangerouslySetInnerHTML={{ __html: CSS }} />
      <div className="dc-cap"><span>Crossed Up</span><span>{dateShort}</span><span className="r">{capRight}</span></div>

      {painting && (
        <div className="dc-paint" key={`f${step}`}>
          <div className="dc-hd">
            <div className="dc-k">Puzzle {NUMS[step] || step + 1} · {sec.name}</div>
            <div className="dc-line">{sec.chip || sec.form}</div>
          </div>
          <Grid sec={sec} res={res} />
          <div className="dc-side">
            <div className="dc-k">Puzzle {NUMS[step] || step + 1} · {sec.name}</div>
            <div className="dc-line">{sec.chip || sec.form}</div>
            <div className="dc-figs">
              <div className="dc-clk">{res && !res.unknown && res.secs ? <Count from={0} to={res.secs} ms={CLOCK} fmt={fmtClock} /> : '-:--'}</div>
              <div className="dc-pts">+{pts[step] || 0} <span>of {sec.weight}</span></div>
            </div>
          </div>
        </div>
      )}

      {counting && (
        <div className="dc-count">
          <div className="dc-ex">Climbing the week</div>
          <div className="dc-tot"><span className="dc-totn"><Count key={kk} from={lo} to={hi} ms={STEP - 150} /></span><span className="dc-of"> / {CROSSED_MAX}</span></div>
          <div className="dc-dye"><Week ti={bi} circle={false} /></div>
          <div className="dc-bn">{rank[1]}</div>
        </div>
      )}

      {sealed && (
        <div className="dc-board">
          <div className="dc-top">
            <div className="dc-pop"><Week ti={fti} /></div>
            <div className="dc-seal"><b>Inked</b><small>{B[fti][2]}</small></div>
          </div>
          <div className="dc-pop" style={{ animationDelay: '.5s' }}>
            <div className="dc-you">You solve like a</div>
            <div className="dc-nm">{B[fti][1]}</div>
            <div className="dc-sum">
              {total} / {CROSSED_MAX} · {fmtClock(runClock)}
              {me && me.rank ? <> · #{me.rank}{field ? ` of ${Number(field).toLocaleString()}` : ''} today</> : null}
              {up ? <> · <b style={{ color: up[4] }}>{short} {short === 1 ? 'point' : 'points'} from {up[1]}</b></> : <> · <b>Top of the ladder</b></>}
            </div>
          </div>
          <div className="dc-pop dc-forms" style={{ animationDelay: '.7s' }}>
            {sections.map((s, i) => (
              <div key={s.key} style={{ borderTopColor: s.color }}>
                <span>{s.name} · {counted[i] && !counted[i].unknown && counted[i].secs ? fmtClock(counted[i].secs) : '-'}</span>
                <b>{counted[i] ? pts[i] : '-'}<small>/{s.weight}</small></b>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="dc-strip">
          {sections.map((s, i) => {
            const on = i < filled;
            const dark = painting;
            return (
              <div key={s.key} className="dc-sc" style={{
                background: on ? s.color : (dark ? 'rgba(11,15,26,.1)' : 'rgba(255,255,255,.05)'),
                color: on ? MID : (dark ? 'rgba(11,15,26,.55)' : '#9aa8c4'),
                border: on ? '1px solid rgba(11,15,26,.35)' : (dark ? '1px solid rgba(11,15,26,.3)' : '1px solid rgba(255,255,255,.18)'),
              }}>
                <span>{s.name}</span><b>{on ? pts[i] : ''}</b>
              </div>
            );
          })}
        </div>
    </div>
  );
}

const CSS = WEEK_CSS + `
.dc{position:fixed;inset:0;z-index:2147483000;display:flex;flex-direction:column;overflow:hidden;font-family:'Manrope',system-ui,-apple-system,sans-serif;cursor:pointer;-webkit-tap-highlight-color:transparent;outline:none}
.dc *{box-sizing:border-box}
.dc.thud{animation:dcthud .35s ease both}
@keyframes dcthud{0%,100%{transform:none}20%{transform:translate(3px,2px)}40%{transform:translate(-3px,-1px)}60%{transform:translate(2px,-2px)}}
@keyframes dcpop{from{opacity:0;transform:translateY(14px) scale(.96)}to{opacity:1;transform:none}}
@keyframes dcseal{0%{opacity:0;transform:rotate(-10deg) scale(2.6)}60%{opacity:1;transform:rotate(-10deg) scale(.94)}100%{opacity:.9;transform:rotate(-10deg) scale(1)}}
@keyframes dccell{from{opacity:0;transform:scale(1.6)}to{opacity:1;transform:none}}
@keyframes dcwhite{from{background:#ffffff}to{background:transparent}}
.dc-cap{flex:none;display:flex;align-items:center;gap:12px;padding:18px 28px 0;font-size:11px;font-weight:800;letter-spacing:.16em;text-transform:uppercase;opacity:.78}
.dc-cap .r{margin-left:auto}
.dc-paint{flex:1 1 auto;display:flex;align-items:center;justify-content:center;gap:60px;padding:0 40px;min-height:0}
.dc-paint .dc-hd{display:none}
.dc-grid{width:auto;height:330px;max-width:330px;flex:none;display:grid;border:4px solid #0b0f1a;border-radius:6px;overflow:hidden;background:rgba(255,255,255,.35)}
.dc-c{display:flex;align-items:center;justify-content:center;font-weight:800;color:#0b0f1a;font-variant-numeric:tabular-nums;animation:dcwhite var(--wl) linear var(--wd) forwards}
.dc-c{font-size:var(--fs,22px)}
.dc-c.blk{background:#0b0f1a;animation:none}
.dc-c span{display:block;animation:dccell .25s ease var(--wd) both}
.dc-side{width:440px;flex:none;display:flex;flex-direction:column;gap:10px}
.dc-k{font-size:13px;font-weight:800;letter-spacing:.18em;text-transform:uppercase}
.dc-line{font-size:20px;font-weight:700;height:28px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;padding-bottom:.16em;margin-bottom:-.16em;}
.dc-figs{display:flex;flex-direction:column;gap:10px}
.dc-clk{width:2.95em;height:1em;font-size:120px;font-weight:800;line-height:1;font-variant-numeric:tabular-nums;text-align:right;white-space:nowrap}
.dc-pts{height:52px;font-size:44px;font-weight:800;line-height:1.1;font-variant-numeric:tabular-nums;white-space:nowrap;animation:dcpop .4s cubic-bezier(.2,.8,.2,1) 1.5s both}
.dc-pts span{font-size:20px}
.dc-count{flex:1 1 auto;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:26px;min-height:0}
.dc-ex{font-size:13px;font-weight:800;letter-spacing:.18em;text-transform:uppercase;opacity:.75}
.dc-tot{font-size:120px;font-weight:800;line-height:1;font-variant-numeric:tabular-nums;white-space:nowrap}
.dc-totn{display:inline-block;width:1.9em;text-align:right}
.dc-of{font-size:36px;opacity:.6}
.dc-dye{display:flex;justify-content:center}
.dc-dye .cw{--s:80px}
.dc-bn{height:34px;font-size:26px;font-weight:800;letter-spacing:.06em;white-space:nowrap}
.dc-board{flex:1 1 auto;display:flex;flex-direction:column;justify-content:center;gap:14px;width:440px;max-width:calc(100vw - 32px);margin:0 auto;min-height:0}
.dc-top{position:relative;height:112px}
.dc-top .dc-pop{position:absolute;left:0;right:120px;top:20px}
.dc-top .cw{--s:42px}
.dc-seal{position:absolute;right:0;top:0;width:104px;height:104px;border-radius:50%;border:4px solid #b4232a;color:#b4232a;display:flex;flex-direction:column;align-items:center;justify-content:center;background:rgba(246,241,228,.92);animation:dcseal .45s cubic-bezier(.2,.9,.2,1) .35s both}
.dc-seal b{font-size:15px;font-weight:800;letter-spacing:.1em;text-transform:uppercase}
.dc-seal small{font-size:11px;font-weight:800}
.dc-pop{animation:dcpop .4s cubic-bezier(.2,.8,.2,1) both}
.dc-you{font-size:11px;font-weight:800;letter-spacing:.16em;text-transform:uppercase;color:#7dd3fc}
.dc-nm{font-size:30px;font-weight:800;line-height:1.1}
.dc-sum{font-size:14px;font-weight:700;color:#c9d3e6;margin-top:4px;font-variant-numeric:tabular-nums}
.dc-forms{display:flex;gap:6px}
.dc-forms div{flex:1 1 0;min-width:0;border-radius:8px;padding:8px 6px;background:rgba(255,255,255,.05);border-top:3px solid;text-align:center}
.dc-forms span{display:block;font-size:10px;font-weight:800;letter-spacing:.1em;text-transform:uppercase;color:#9aa8c4;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;padding-bottom:.16em;margin-bottom:-.16em;}
.dc-forms b{font-size:20px;font-weight:800;font-variant-numeric:tabular-nums}
.dc-forms b small{font-size:12px;color:#9aa8c4}
.dc-strip{flex:none;display:flex;gap:8px;padding:14px 28px 18px}
.dc-sc{flex:1 1 0;min-width:0;height:40px;border-radius:8px;display:flex;align-items:center;justify-content:space-between;padding:0 14px;font-size:12px;font-weight:800;letter-spacing:.08em;text-transform:uppercase;transition:all .3s ease}
.dc-sc span{white-space:nowrap;overflow:hidden;text-overflow:ellipsis;padding-bottom:.16em;margin-bottom:-.16em;}
.dc-sc b{flex:none;width:2.2em;text-align:right;font-size:18px;font-variant-numeric:tabular-nums}
@media(max-width:640px){
.dc-cap{padding:16px 18px 0;font-size:10px;gap:10px}
.dc-paint{flex-direction:column;align-items:stretch;justify-content:center;gap:14px;padding:0 24px}
.dc-paint .dc-hd{display:flex;flex-direction:column;gap:8px}
.dc-paint .dc-hd .dc-k{font-size:12px;letter-spacing:.16em}
.dc-paint .dc-hd .dc-line{font-size:18px;height:24px}
.dc-side > .dc-k,.dc-side > .dc-line{display:none}
.dc-grid{height:min(342px,calc(100vw - 48px));max-width:calc(100vw - 48px)}
.dc-side{width:auto}
.dc-figs{flex-direction:row;align-items:baseline;justify-content:space-between}
.dc-clk{font-size:72px}
.dc-pts{height:44px;font-size:38px}
.dc-pts span{font-size:16px}
.dc-count{gap:24px}
.dc-ex{font-size:12px;letter-spacing:.16em}
.dc-tot{font-size:96px}
.dc-of{font-size:30px}
.dc-dye{width:340px;max-width:calc(100vw - 40px)}
.dc-dye .cw{--s:min(46px,calc((100vw - 48px) / 7))}
.dc-bn{font-size:24px}
.dc-board{width:auto;max-width:none;margin:0;padding:14px 16px 0;justify-content:flex-start;gap:11px}
.dc-top{height:92px}
.dc-top .dc-pop{right:96px;top:16px}
.dc-top .cw{--s:min(36px,calc((100vw - 140px) / 7))}
.dc-seal{width:88px;height:88px}
.dc-seal b{font-size:13px;letter-spacing:.08em}
.dc-seal small{font-size:10px}
.dc-you{font-size:10px}
.dc-nm{font-size:26px}
.dc-sum{font-size:13px;margin-top:3px}
.dc-strip{gap:6px;padding:12px 14px 16px}
.dc-sc{padding:0 10px;font-size:11px;letter-spacing:.06em}
.dc-sc b{font-size:16px}
}
/* WIDE DESKTOPS (owner, 2026-10-17): the curtain draws in a centred column
   rather than from edge to edge. */
@media (min-width:1180px){
  .dc-cap,.dc-strip{width:100%;max-width:1040px;margin-left:auto;margin-right:auto;box-sizing:border-box}
  .dc-paint{gap:48px}
}
`;
