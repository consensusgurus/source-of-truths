'use client';

// HOUSE LIGHTS: Read the Room's ending, before the verdict card (owner, 2026-10-17).
//
// Each of the day's rooms takes the whole screen in its own colour. A crowd of
// dots fills in, one per player in that room's real field (capped at CAP, with
// a note of the real count), the dots the player out-read light up in sequence
// until their own seat glows gold, and the out-read share and the room's points
// count in fixed boxes. A meter strip along the bottom fills one room at a time.
// Then the house lights go down and a spotlight walks the six ROOM_LADDER titles,
// lit as marquee signs, and stops on the player's title while the total climbs.
//
// IT IS A CURTAIN. It posts nothing, stores nothing, and unmounts onto the
// existing verdict card underneath. Every figure is one the run already holds:
// each room's `read` ({rank, field}) and its points off roomPoints. A room with
// no read yet says so rather than drawing a crowd it does not know.
//
// Any tap or key skips. prefers-reduced-motion gets no curtain at all. The
// caller decides that it plays once (Verdict's `animate`).
//
// Timings copy the approved mockups (Room.dc.html / PhoneRoom.dc.html):
// P0 300ms lights down, PD 1900ms a room, CNT 2600ms the climb, +300 hold.

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { ROOM_LADDER, roomBeat } from '@/lib/read-room';

const P0 = 300;
const PD = 1900;
const CNT = 2600;
const HOLD = 300;
const SWEEP_AT = 150;     // the first out-read dot lights this far into a room
const SWEEP_MS = 1100;    // and the player's seat lights this long after
const PTS_AT = 1350;      // the room's points land
const METER_AT = 1300;    // the room's meter fills
const CAP = 72;           // the most dots a room draws
const INK = '#0b0f1a';

const ease = (x) => { const v = Math.max(0, Math.min(1, x)); return 1 - Math.pow(1 - v, 3); };
// The inverse of `ease`: when the eased sweep reaches x.
const uneased = (x) => 1 - Math.cbrt(1 - Math.max(0, Math.min(1, x)));
const now = () => (typeof performance !== 'undefined' ? performance.now() : Date.now());

// A number that counts on its own frame loop, so a tick renders only itself.
function Count({ to, ms, delay = 0, onValue }) {
  const [v, setV] = useState(0);
  useEffect(() => {
    let raf = 0;
    const t0 = now() + delay;
    const tick = () => {
      const p = Math.max(0, Math.min(1, (now() - t0) / Math.max(1, ms)));
      const n = Math.round(to * ease(p));
      setV(n);
      if (onValue) onValue(n);
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [to, ms, delay]);
  return <>{v}</>;
}

// One room's crowd. Delays are computed once so the sweep runs on CSS alone.
function Crowd({ room }) {
  const cells = [];
  const { shown, lit } = room;
  for (let i = 0; i < CAP; i++) {
    if (i >= shown) { cells.push(<i key={i} className="hl-d no" />); continue; }
    if (i === lit) {
      cells.push(<i key={i} className="hl-d me" style={{ '--dl': `${SWEEP_AT + SWEEP_MS}ms` }} />);
    } else if (i < lit) {
      const dl = SWEEP_AT + Math.round(SWEEP_MS * uneased((i + 1) / Math.max(1, lit)));
      cells.push(<i key={i} className="hl-d on" style={{ '--dl': `${dl}ms` }} />);
    } else {
      cells.push(<i key={i} className="hl-d" />);
    }
  }
  return <div className="hl-crowd" aria-hidden="true">{cells}</div>;
}

function Climb({ total, max, delay, ms }) {
  // ROOM_LADDER is best first; the signs read lowest to highest.
  const signs = useMemo(() => ROOM_LADDER.slice().reverse(), []);
  const [v, setV] = useState(0);
  let at = 0;
  signs.forEach((s, i) => { if (v >= s[0]) at = i; });
  return (
    <div className="hl-climb">
      <div className="hl-q">House lights down. Where do you stand at this party?</div>
      <div className="hl-tot"><span className="hl-totn"><Count to={total} ms={ms} delay={delay} onValue={setV} /></span><span className="hl-totof"> / {max}</span></div>
      <div className="hl-signs" style={{ '--at': at, '--c': at % 2, '--r': Math.floor(at / 2) }}>
        <div className="hl-beam" aria-hidden="true" />
        {signs.map((s, i) => (
          <div key={s[1]} className={`hl-sign${i === at ? ' at' : i < at ? ' past' : ''}`}>
            <span>{s[1]}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function HouseLights({ rooms = [], total = 0, max = 100, dateShort = '', onDone }) {
  const N = rooms.length;
  // -1 lights down, 0..N-1 a room, N the climb.
  const [step, setStep] = useState(-1);
  const [filled, setFilled] = useState(0);
  const doneRef = useRef(false);

  const finish = () => {
    if (doneRef.current) return;
    doneRef.current = true;
    if (typeof onDone === 'function') onDone();
  };

  const view = useMemo(() => rooms.map((r, i) => {
    const read = r.read || null;
    const field = read ? Number(read.field) || 0 : 0;
    const rank = read ? Number(read.rank) || 0 : 0;
    const beat = read ? roomBeat(rank, field) : null;
    const has = beat != null && field >= 1;
    const shown = has ? Math.min(field, CAP) : 0;
    const lit = !has ? 0 : field <= CAP ? Math.max(0, field - rank) : Math.round(beat * (shown - 1));
    return {
      key: r.key, name: r.name, phrase: r.phrase || '', color: r.color || '#a5b4fc', num: i + 1,
      has, field, rank, beat: has ? beat : 0, shown, lit,
      pct: has ? Math.round(100 * beat) : null,
      pts: Math.round(Number(r.pts) || 0),
    };
  }), [rooms]);

  useEffect(() => {
    const reduced = typeof window !== 'undefined' && window.matchMedia
      && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduced || !N) { finish(); return undefined; }
    const timers = [];
    const at = (ms, fn) => timers.push(setTimeout(fn, ms));
    for (let i = 0; i < N; i++) {
      at(P0 + i * PD, () => setStep(i));
      at(P0 + i * PD + METER_AT, () => setFilled(i + 1));
    }
    const climb = P0 + N * PD;
    at(climb, () => setStep(N));
    at(climb + CNT + HOLD, finish);
    return () => timers.forEach(clearTimeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [N]);

  useEffect(() => {
    const go = () => finish();
    window.addEventListener('keydown', go);
    return () => window.removeEventListener('keydown', go);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const painting = step >= 0 && step < N;
  const rm = painting ? view[step] : null;
  const climbing = step >= N;

  return (
    <div
      className={`hl${painting ? ' paint' : ''}${climbing ? ' dark' : ''}`}
      style={{ background: painting ? rm.color : (climbing ? '#05070d' : INK), color: painting ? INK : '#e9edf4' }}
      onClick={finish}
      role="button"
      tabIndex={0}
      aria-label="Skip to your verdict"
    >
      <style dangerouslySetInnerHTML={{ __html: CSS }} />
      <div className="hl-cap">
        <span>Read the Room</span>{dateShort ? <span>{dateShort}</span> : null}
        <span className="hl-capr">{painting ? `Room ${rm.num} of ${N}` : ''}</span>
      </div>

      <div className="hl-main">
        {painting ? (
          <div className="hl-room" key={rm.key}>
            <div className="hl-rhd">Room {rm.num} · {rm.name}{rm.phrase ? <span className="hl-ph"><span className="hl-dot"> · </span>{rm.phrase}</span> : null}</div>
            <Crowd room={rm} />
            <div className="hl-note">{rm.has && rm.field > CAP ? `Showing ${CAP} of ${rm.field.toLocaleString()} players` : rm.has ? `${rm.field.toLocaleString()} ${rm.field === 1 ? 'player' : 'players'} in the room` : 'The room has not answered yet'}</div>
            <div className="hl-figs">
              <div className="hl-pct"><span className="hl-pctn">{rm.has ? <Count to={rm.pct} ms={SWEEP_MS + 100} delay={SWEEP_AT} /> : '-'}</span><span className="hl-pcts">%</span></div>
              <div className="hl-lbl"><span className="hl-full">of the room </span>out-read<br /><b>{rm.has ? `#${rm.rank} of ${rm.field.toLocaleString()}` : ' '}</b></div>
              <div className="hl-pts"><span>+{rm.pts}</span></div>
            </div>
          </div>
        ) : climbing ? (
          <Climb total={total} max={max} delay={200} ms={CNT - 900} />
        ) : null}
      </div>

      <div className="hl-meters">
        {view.map((r, i) => {
          const on = i < filled;
          return (
            <div key={r.key} className="hl-m">
              <div className="hl-mh" style={{ color: painting ? INK : '#9aa8c4' }}><span>{r.name}</span><span className="hl-mv">{on ? r.pts : ''}</span></div>
              <div className="hl-mt" style={{ background: painting ? 'rgba(11,15,26,.14)' : 'rgba(255,255,255,.08)' }}>
                <div className="hl-mf" style={{ width: on ? `${Math.round(r.beat * 100)}%` : '0%', background: painting ? INK : r.color }} />
              </div>
            </div>
          );
        })}
      </div>
      <div className="hl-skip">Tap to skip</div>
    </div>
  );
}

const CSS = `
.hl{position:fixed;inset:0;z-index:80;display:flex;flex-direction:column;overflow:hidden;cursor:pointer;
  font-family:Manrope,system-ui,-apple-system,'Segoe UI',sans-serif;transition:background-color .3s ease,color .3s ease}
.hl:focus{outline:none}
.hl *{box-sizing:border-box}
.hl-cap{display:flex;align-items:center;gap:12px;padding:18px 28px 0;font-size:11px;font-weight:800;letter-spacing:.16em;text-transform:uppercase;opacity:.78}
.hl-capr{margin-left:auto}
.hl-main{position:relative;flex:1 1 auto;display:flex;flex-direction:column;justify-content:center;min-height:0}
.hl-room{display:flex;flex-direction:column;gap:18px;padding:0 60px;max-width:880px;width:100%;margin:0 auto}
.hl-rhd{font-size:13px;font-weight:800;letter-spacing:.18em;text-transform:uppercase}
.hl-crowd{display:grid;grid-template-columns:repeat(18,minmax(0,30px));gap:9px;max-width:760px}
.hl-d{display:block;width:100%;aspect-ratio:1;border-radius:50%;background:rgba(11,15,26,.12);border:2px solid rgba(11,15,26,.22)}
.hl-d.no{background:transparent;border-color:transparent}
.hl-d.on{animation:hlOn .18s ease var(--dl) both}
.hl-d.me{border-color:${INK};animation:hlMe .3s cubic-bezier(.2,.8,.2,1) var(--dl) both,hlPulse 1.2s ease-in-out calc(var(--dl) + .3s) infinite}
@keyframes hlOn{from{background:rgba(11,15,26,.12);transform:none}to{background:${INK};transform:scale(.86)}}
@keyframes hlMe{from{background:rgba(11,15,26,.12);transform:none}to{background:#e8b43a;transform:scale(1.35)}}
@keyframes hlPulse{0%,100%{box-shadow:0 0 0 0 rgba(232,180,58,.9)}50%{box-shadow:0 0 0 9px rgba(232,180,58,0)}}
.hl-note{font-size:12px;font-weight:700;letter-spacing:.06em;opacity:.78;margin-top:-8px;min-height:16px}
.hl-figs{display:flex;align-items:baseline;gap:28px}
.hl-pct{font-size:92px;font-weight:800;line-height:1;font-variant-numeric:tabular-nums;white-space:nowrap}
.hl-pctn{display:inline-block;width:1.95em;text-align:right}
.hl-pcts{font-size:40px}
.hl-lbl{font-size:20px;font-weight:700;line-height:1.3}
.hl-lbl b{font-weight:800;font-variant-numeric:tabular-nums}
.hl-pts{margin-left:auto;font-size:44px;font-weight:800;font-variant-numeric:tabular-nums;width:2.4em;text-align:right}
.hl-pts span{display:inline-block;opacity:0;animation:hlPop .4s cubic-bezier(.2,.8,.2,1) ${PTS_AT}ms both}
@keyframes hlPop{from{opacity:0;transform:translateY(14px) scale(.96)}to{opacity:1;transform:none}}
.hl-climb{display:flex;flex-direction:column;align-items:center;gap:30px;padding:0 20px}
.hl-q{font-size:13px;font-weight:800;letter-spacing:.18em;text-transform:uppercase;color:#9aa8c4;text-align:center}
.hl-tot{font-size:110px;font-weight:800;line-height:1;font-variant-numeric:tabular-nums;white-space:nowrap}
.hl-totn{display:inline-block;width:1.95em;text-align:right}
.hl-totof{font-size:36px;color:#9aa8c4}
.hl-signs{position:relative;display:flex;gap:10px;width:min(842px,calc(100vw - 40px))}
.hl-beam{position:absolute;width:300px;height:840px;top:-469px;pointer-events:none;
  left:calc((100% - 50px) / 6 * (var(--at) + .5) + var(--at) * 10px);transform:translateX(-50%);
  background:radial-gradient(ellipse 150px 420px at 50% 60%,rgba(255,240,200,.22),rgba(255,240,200,.05) 60%,transparent 75%);
  transition:left .25s ease,top .25s ease}
.hl-sign{position:relative;flex:1 1 0;min-width:0;height:70px;border-radius:10px;border:3px dotted rgba(255,255,255,.14);
  background:rgba(255,255,255,.03);color:#5b6684;display:flex;align-items:center;justify-content:center;text-align:center;
  font-size:14px;font-weight:800;padding:0 8px;line-height:1.2;transition:all .25s ease}
.hl-sign.past{border-color:rgba(232,180,58,.45);color:#c9d3e6}
.hl-sign.at{border-color:#e8b43a;background:rgba(232,180,58,.16);color:#ffffff;transform:translateY(-10px) scale(1.08)}
.hl-meters{display:flex;gap:8px;padding:14px 28px 6px}
.hl-m{flex:1 1 0;min-width:0;display:flex;flex-direction:column;gap:6px}
.hl-mh{display:flex;justify-content:space-between;gap:6px;font-size:12px;font-weight:800;letter-spacing:.08em;text-transform:uppercase;transition:color .3s ease}
.hl-mh span:first-child{overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.hl-mv{font-variant-numeric:tabular-nums}
.hl-mt{height:8px;border-radius:4px;overflow:hidden;transition:background-color .3s ease}
.hl-mf{height:100%;transition:width .5s ease,background-color .3s ease}
.hl-skip{text-align:center;padding:4px 0 14px;font-size:10.5px;font-weight:700;letter-spacing:.18em;text-transform:uppercase;opacity:.85}
@media(max-width:640px){
  .hl-cap{gap:10px;padding:16px 18px 0;font-size:10px}
  .hl-room{padding:0 22px;gap:18px}
  .hl-rhd{font-size:12px;letter-spacing:.16em}
  .hl-ph{display:block;font-size:20px;font-weight:700;letter-spacing:0;text-transform:none;margin-top:8px}
  .hl-dot{display:none}
  .hl-crowd{grid-template-columns:repeat(12,minmax(0,21px));gap:7px}
  .hl-figs{align-items:flex-end;gap:14px}
  .hl-pct{font-size:76px}
  .hl-pcts{font-size:32px}
  .hl-lbl{font-size:15px;padding-bottom:8px}
  .hl-full{display:none}
  .hl-pts{font-size:38px;padding-bottom:4px}
  .hl-climb{gap:26px}
  .hl-q{font-size:12px;letter-spacing:.16em}
  .hl-tot{font-size:92px}
  .hl-totof{font-size:30px}
  .hl-signs{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px;width:min(332px,calc(100vw - 36px))}
  .hl-sign{height:52px;flex:none}
  .hl-beam{width:240px;height:600px;
    left:calc((100% - 12px) / 2 * (var(--c) + .5) + var(--c) * 12px);
    top:calc(var(--r) * 64px + 26px - 440px);
    background:radial-gradient(ellipse 120px 300px at 50% 60%,rgba(255,240,200,.24),rgba(255,240,200,.06) 60%,transparent 76%)}
  .hl-meters{gap:8px;padding:12px 16px 4px}
  .hl-m{gap:5px}
  .hl-mh{font-size:10px;letter-spacing:.06em}
  .hl-mt{height:7px}
}
`;
