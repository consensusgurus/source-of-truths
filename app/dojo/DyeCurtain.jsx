'use client';

// DYE THE BELT: the Dojo's ending, before the settled card (owner-approved
// mockup, 2026-10-17).
//
// Each form takes over the whole screen in its own colour: its grid fills in a
// diagonal ripple, its clock counts to the real time it took, and its points
// land. A strip of scrolls along the bottom fills one per form. Then the
// colour drains back to the midnight ground and the run total climbs the belt
// ladder: every belt it reaches floods the screen in that belt's colour for a
// beat while the drawn belt is dyed to it. Then the examiner's seal comes down
// with a small shake, the belt is tied, and the curtain lifts onto the card.
//
// IT IS A CURTAIN. It posts nothing and stores nothing; every figure is one the
// run already holds (each form's filed result, its clock, the points the Dojo
// scorer gave it, the belt ladder, and the board's rank when it has landed).
//
// THE GRID IS THE PLAYER'S OWN. A solved form fills with the board's solution,
// which is exactly what the player put down. A form that was not solved never
// shows the answer: it fills with the printed digits only.
//
// THE PAINT GOES ON THE ROOT, a fixed element that IS the screen (the
// GauntletFinale lesson). Numbers that count sit in fixed boxes with tabular
// figures, so nothing moves as they tick.

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { DOJO_BELTS, DOJO_MAX, dojoTierOf } from '@/lib/dojo';

const B = DOJO_BELTS;
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
const STEP = 650;    // one belt on the climb
const FLASH = 260;   // the flood
const GAP = 600;     // the last belt, held, before the seal
const HOLD = 2600;   // the tied belt, before the card

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

function gridOf(sec, res) {
  const p = (sec && sec.puzzle) || {};
  const n = sec && sec.key === 'sixes' ? 6 : 9;
  const solved = !!(res && !res.unknown && Number(res.total) > 0 && Number(res.score) >= Number(res.total));
  const ok = (g) => Array.isArray(g) && g.length === n && g.every((row) => Array.isArray(row) && row.length === n);
  let digits;
  if (solved && ok(p.sol)) digits = p.sol;
  else if (solved) {
    // A solved board whose solution did not ship: a valid-looking pattern.
    digits = Array.from({ length: n }, (_, r) => Array.from({ length: n }, (_, c) => (n === 9
      ? ((r * 3 + Math.floor(r / 3) + c) % 9) + 1
      : (((r % 2) * 3 + Math.floor(r / 2) + c) % 6) + 1)));
  } else digits = ok(p.given) ? p.given : Array.from({ length: n }, () => Array(n).fill(0));
  return { n, digits };
}

function Grid({ sec, res }) {
  const { n, digits } = useMemo(() => gridOf(sec, res), [sec, res]);
  const box = n === 6 ? [2, 3] : [3, 3];
  const cells = [];
  for (let r = 0; r < n; r++) for (let c = 0; c < n; c++) {
    const d = r + c;
    const on = waveAt(d, n);
    const off = waveAt(d + 2, n);
    const v = digits[r][c];
    cells.push(
      <div key={`${r}-${c}`} className="dc-c" style={{
        borderRight: c === n - 1 ? '0' : ((c + 1) % box[1] === 0 ? '3px solid #0b0f1a' : '1px solid rgba(11,15,26,.3)'),
        borderBottom: r === n - 1 ? '0' : ((r + 1) % box[0] === 0 ? '3px solid #0b0f1a' : '1px solid rgba(11,15,26,.3)'),
        '--wd': `${Math.round(on)}ms`, '--wl': `${Math.max(60, Math.round(off - on))}ms`,
      }}>
        {v ? <span>{v}</span> : null}
      </div>,
    );
  }
  return <div className={`dc-grid n${n}`} style={{ gridTemplateColumns: `repeat(${n}, minmax(0, 1fr))` }}>{cells}</div>;
}

function Belt({ ti, tied }) {
  const t = B[ti];
  return (
    <div className={`dc-belt${tied ? ' tied' : ''}`} style={{ '--b': t[3], '--st': t[4] }} aria-hidden="true">
      <i className="dc-band" />
      <i className="dc-tab" />
      <i className="dc-knot" />
      {tied ? <><i className="dc-tail l" /><i className="dc-tail r" /></> : null}
    </div>
  );
}

export default function DyeCurtain({ sections = [], counted = [], parts = [], total = 0, runClock = 0, dateShort = '', board = null, onDone }) {
  const N = sections.length;
  const fti = dojoTierOf(total);
  // The belts the total climbs through, white first.
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
  const belt = B[bi];
  let bg = MID, ink = INK_LT;
  if (painting) { bg = sec.color; ink = MID; } else if (counting && flash) { bg = belt[3]; ink = inkOn(belt[3]); }
  const capRight = painting ? `Form ${step + 1} of ${N}` : sealed ? 'Graded' : '';

  // The climb: each belt counts from its own cutoff to just under the next one,
  // and the last to the real total.
  const lastK = climb.length - 1;
  const kk = Math.min(k, lastK);
  const lo = B[climb[kk]][0];
  const hi = kk === lastK ? total : B[climb[kk + 1]][0] - 1;

  const me = board && board.data && board.data.me;
  const field = board && board.data && Array.isArray(board.data.overall) ? (board.data.uniquePlayers || board.data.overall.length) : null;
  const up = fti > 0 ? B[fti - 1] : null;
  const short = up ? Math.max(1, up[0] - total) : 0;

  return (
    <div
      className={`dc${thud ? ' thud' : ''}`}
      style={{ background: bg, color: ink, transition: `background ${counting && flash ? '.05s' : '.45s'} ease, color .3s ease` }}
      onClick={finish}
      role="button"
      tabIndex={0}
      aria-label="Skip to your belt"
    >
      <style dangerouslySetInnerHTML={{ __html: CSS }} />
      <div className="dc-cap"><span>Enter the Dojo</span><span>{dateShort}</span><span className="r">{capRight}</span></div>

      {painting && (
        <div className="dc-paint" key={`f${step}`}>
          <div className="dc-hd">
            <div className="dc-k">Form {NUMS[step] || step + 1} · {sec.name}</div>
            <div className="dc-line">{sec.chip || sec.form}</div>
          </div>
          <Grid sec={sec} res={res} />
          <div className="dc-side">
            <div className="dc-k">Form {NUMS[step] || step + 1} · {sec.name}</div>
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
          <div className="dc-ex">The examiner dyes your belt</div>
          <div className="dc-tot"><span className="dc-totn"><Count key={kk} from={lo} to={hi} ms={STEP - 150} /></span><span className="dc-of"> / {DOJO_MAX}</span></div>
          <div className="dc-dye"><Belt ti={bi} tied={false} /></div>
          <div className="dc-bn">{belt[1]}</div>
        </div>
      )}

      {sealed && (
        <div className="dc-board">
          <div className="dc-top">
            <div className="dc-pop"><Belt ti={fti} tied /></div>
            <div className="dc-seal"><b>Promoted</b><small>{B[fti][2]}</small></div>
          </div>
          <div className="dc-pop" style={{ animationDelay: '.5s' }}>
            <div className="dc-you">You tie on the</div>
            <div className="dc-nm">{B[fti][1]}</div>
            <div className="dc-sum">
              {total} / {DOJO_MAX} · {fmtClock(runClock)}
              {me && me.rank ? <> · #{me.rank}{field ? ` of ${Number(field).toLocaleString()}` : ''} today</> : null}
              {up ? <> · <b style={{ color: up[4] }}>{short} {short === 1 ? 'point' : 'points'} from {up[1].replace(' Belt', '')}</b></> : <> · <b>Top of the ladder</b></>}
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
                border: on ? '1px solid rgba(11,15,26,.35)' : (dark ? '1px dashed rgba(11,15,26,.3)' : '1px dashed rgba(255,255,255,.18)'),
              }}>
                <span>{s.name}</span><b>{on ? pts[i] : ''}</b>
              </div>
            );
          })}
        </div>
    </div>
  );
}

const CSS = `
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
.dc-grid{width:330px;height:330px;flex:none;display:grid;border:4px solid #0b0f1a;border-radius:6px;overflow:hidden;background:rgba(255,255,255,.35)}
.dc-c{display:flex;align-items:center;justify-content:center;font-weight:800;color:#0b0f1a;font-variant-numeric:tabular-nums;animation:dcwhite var(--wl) linear var(--wd) forwards}
.dc-grid.n6 .dc-c{font-size:30px}
.dc-grid.n9 .dc-c{font-size:22px}
.dc-c span{display:block;animation:dccell .25s ease var(--wd) both}
.dc-side{width:440px;flex:none;display:flex;flex-direction:column;gap:10px}
.dc-k{font-size:13px;font-weight:800;letter-spacing:.18em;text-transform:uppercase}
.dc-line{font-size:20px;font-weight:700;height:28px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.dc-figs{display:flex;flex-direction:column;gap:10px}
.dc-clk{width:2.95em;height:1em;font-size:120px;font-weight:800;line-height:1;font-variant-numeric:tabular-nums;text-align:right;white-space:nowrap}
.dc-pts{height:52px;font-size:44px;font-weight:800;line-height:1.1;font-variant-numeric:tabular-nums;white-space:nowrap;animation:dcpop .4s cubic-bezier(.2,.8,.2,1) 1.5s both}
.dc-pts span{font-size:20px}
.dc-count{flex:1 1 auto;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:26px;min-height:0}
.dc-ex{font-size:13px;font-weight:800;letter-spacing:.18em;text-transform:uppercase;opacity:.75}
.dc-tot{font-size:120px;font-weight:800;line-height:1;font-variant-numeric:tabular-nums;white-space:nowrap}
.dc-totn{display:inline-block;width:1.9em;text-align:right}
.dc-of{font-size:36px;opacity:.6}
.dc-dye{width:640px;max-width:calc(100vw - 48px)}
.dc-bn{height:34px;font-size:26px;font-weight:800;letter-spacing:.06em;white-space:nowrap}
.dc-belt{position:relative;width:100%;height:64px;--bh:36px;--kw:60px;--kh:56px;--tab:54px;--tr:40px}
.dc-band{position:absolute;left:0;right:0;top:14px;height:var(--bh);border-radius:6px;background:var(--b);box-shadow:0 0 0 2px rgba(0,0,0,.35),0 18px 40px rgba(0,0,0,.35);transition:background .25s ease}
.dc-tab{position:absolute;right:var(--tr);top:14px;width:var(--tab);height:var(--bh);background:var(--st);transition:background .25s ease}
.dc-knot{position:absolute;left:50%;top:4px;width:var(--kw);height:var(--kh);margin-left:calc(var(--kw) / -2);border-radius:10px;background:var(--b);box-shadow:inset 0 0 0 3px rgba(0,0,0,.28);transition:background .25s ease}
.dc-tail{position:absolute;top:calc(var(--kh) - 4px);width:14px;height:44px;background:var(--b)}
.dc-tail.l{left:calc(50% - 15px);transform:rotate(14deg)}
.dc-tail.r{left:calc(50% + 2px);transform:rotate(-14deg)}
.dc-board{flex:1 1 auto;display:flex;flex-direction:column;justify-content:center;gap:14px;width:440px;max-width:calc(100vw - 32px);margin:0 auto;min-height:0}
.dc-top{position:relative;height:112px}
.dc-top .dc-pop{position:absolute;left:0;right:120px;top:20px}
.dc-top .dc-belt{--bh:30px;--kw:52px;--kh:50px;--tab:44px;--tr:30px;height:92px}
.dc-top .dc-band,.dc-top .dc-tab{top:10px}
.dc-top .dc-knot{top:0}
.dc-seal{position:absolute;right:0;top:0;width:104px;height:104px;border-radius:50%;border:4px solid #b4232a;color:#b4232a;display:flex;flex-direction:column;align-items:center;justify-content:center;background:rgba(246,241,228,.92);animation:dcseal .45s cubic-bezier(.2,.9,.2,1) .35s both}
.dc-seal b{font-size:15px;font-weight:800;letter-spacing:.1em;text-transform:uppercase}
.dc-seal small{font-size:11px;font-weight:800}
.dc-pop{animation:dcpop .4s cubic-bezier(.2,.8,.2,1) both}
.dc-you{font-size:11px;font-weight:800;letter-spacing:.16em;text-transform:uppercase;color:#7dd3fc}
.dc-nm{font-size:30px;font-weight:800;line-height:1.1}
.dc-sum{font-size:14px;font-weight:700;color:#c9d3e6;margin-top:4px;font-variant-numeric:tabular-nums}
.dc-forms{display:flex;gap:6px}
.dc-forms div{flex:1 1 0;min-width:0;border-radius:8px;padding:8px 6px;background:rgba(255,255,255,.05);border-top:3px solid;text-align:center}
.dc-forms span{display:block;font-size:10px;font-weight:800;letter-spacing:.1em;text-transform:uppercase;color:#9aa8c4;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.dc-forms b{font-size:20px;font-weight:800;font-variant-numeric:tabular-nums}
.dc-forms b small{font-size:12px;color:#9aa8c4}
.dc-strip{flex:none;display:flex;gap:8px;padding:14px 28px 18px}
.dc-sc{flex:1 1 0;min-width:0;height:40px;border-radius:8px;display:flex;align-items:center;justify-content:space-between;padding:0 14px;font-size:12px;font-weight:800;letter-spacing:.08em;text-transform:uppercase;transition:all .3s ease}
.dc-sc span{white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.dc-sc b{flex:none;width:2.2em;text-align:right;font-size:18px;font-variant-numeric:tabular-nums}
@media(max-width:640px){
.dc-cap{padding:16px 18px 0;font-size:10px;gap:10px}
.dc-paint{flex-direction:column;align-items:stretch;justify-content:center;gap:14px;padding:0 24px}
.dc-paint .dc-hd{display:flex;flex-direction:column;gap:8px}
.dc-paint .dc-hd .dc-k{font-size:12px;letter-spacing:.16em}
.dc-paint .dc-hd .dc-line{font-size:18px;height:24px}
.dc-side > .dc-k,.dc-side > .dc-line{display:none}
.dc-grid{width:min(342px,calc(100vw - 48px));height:min(342px,calc(100vw - 48px))}
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
.dc-dye .dc-belt{--bh:32px;--kw:50px;--kh:52px;--tab:40px;--tr:22px;height:60px}
.dc-bn{font-size:24px}
.dc-board{width:auto;max-width:none;margin:0;padding:14px 16px 0;justify-content:flex-start;gap:11px}
.dc-top{height:92px}
.dc-top .dc-pop{right:96px;top:16px}
.dc-top .dc-belt{--bh:26px;--kw:46px;--kh:44px;--tab:36px;--tr:14px;height:76px}
.dc-tail{width:12px;height:34px}
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
`;
