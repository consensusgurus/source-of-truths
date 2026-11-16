'use client';

// Dash: the daily delivery puzzle (owner, 2026-11-15: "a DoorDash/delivery driver
// puzzle where user has to maximize tips across large grid with 10 or so
// restaurants", named Dash by him, then "Build and implement"). One shift, more
// orders than there is time for, a bag that holds two or three, and tips that
// shrink once the food goes cold. Make the most you can.
//
// The model is lib/dash-engine.js (shared with the generator and the checker).
// Runs on app/SimpleDaily.jsx. The whole state is a list of taps: the first tap
// of an order drives to its restaurant, the second to its door. Trying a plan
// costs nothing: Undo and Start Over are free, and every order row shows what
// its next tap would do from where the car is now (when you would arrive and
// what it would pay). END SHIFT commits. The miss column is dollars short of the
// best possible shift (`best` on the row; the taps that make it never reach the
// browser), lower first, then the clock. The Tip Ladder names the rung.
//
// THE MAP IS KEPT PLAIN ON PURPOSE (owner, 2026-11-15: "the visual grid could
// look cleaner and more compact"): grey blocks, thin streets, no names printed
// on it, one colour per order shared by its restaurant (a circle) and its door
// (a square). The names and numbers live in the order list.
//
// THE BOARD NEVER MOVES AT THE FINISH (owner rule): the doors pop in the order
// they were delivered, then the full-screen fill opens with the ladder climb.

import React, { useState } from 'react';
import { COLS_CSS } from '@/lib/practical-cols';
import SimpleDaily from '../SimpleDaily';
import { endSolved } from '@/lib/end-verdict';
import { walk, next, anyMove, clock, rankOf, offer, PER, STAY } from '@/lib/dash-engine';

const BAND = { intro: 'Intro', gentle: 'Gentle', moderate: 'Moderate', tough: 'Tough', sunday: 'Sunday Edition' };
const STEP = 140, RUNG_H = 8, POP = 170;
const openAt = (n) => 150 + (n + 1) * POP + 550;
const climbAt = (n) => openAt(n) + 650;
const html = (s) => ({ __html: s });
const NUM = ['no', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten', 'eleven', 'twelve'];
const Cap = (s) => s[0].toUpperCase() + s.slice(1);
const hue = (i) => (i * 47 + 20) % 360;
const HOUSE = 'M-6 0.5L0 -5.5 6 0.5M-4.2 -0.8V5.5H4.2V-0.8';
const CAR = '<svg class="ds-ico" viewBox="0 0 120 48" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round" stroke-linecap="round" aria-hidden="true"><path d="M22 34h-8v-9l8-3 8-10h30l12 10 20 4v8h-8"/><path d="M34 34h36"/><circle cx="28" cy="34" r="6"/><circle cx="78" cy="34" r="6"/><path d="M33 22h36L60 14H40z"/><path d="M50 14v8"/><path d="M40 4h20v6H40zM46 4V1h8v3"/></svg>';

const CSS = `
.dash{align-self:center;width:100%;max-width:1040px;display:flex;flex-direction:column;gap:10px;font-family:'Manrope',system-ui,sans-serif;font-weight:600;color:var(--ds-ink);line-height:1.4;
--ds-bg:#ffffff;--ds-ink:#141414;--ds-mute:#6b6b6b;--ds-grey:#f1f1ef;--ds-grey2:#e3e3df;--ds-road:#dcdcd6;--ds-block:#f3f3f0;--ds-ok:#bfe6c8;--ds-warn:#f8e3a1;--ds-bad:#f3b0b0;--ds-sat:62%;--ds-lit:84%;--ds-acc:var(--pst-acc,#fecdd3);--ds-on:var(--pst-on-acc,#141414);}
.stage-page[data-stage-theme='dark'] .dash,.pst.dk .dash{--ds-bg:#161616;--ds-ink:#f2f2ee;--ds-mute:#a3a39d;--ds-grey:#232323;--ds-grey2:#333333;--ds-road:#3d3d3a;--ds-block:#1f1f1f;--ds-ok:#3f7a52;--ds-warn:#8a6d1c;--ds-bad:#9c5050;--ds-sat:40%;--ds-lit:66%;}
.dash button{font:inherit;color:inherit;cursor:pointer;background:none;border:0;padding:0;margin:0;}
.ds-stat{display:flex;border:1px solid var(--ds-ink);border-radius:10px;overflow:hidden;background:var(--ds-bg);}
.ds-stat div{flex:1;padding:6px 4px;text-align:center;border-left:1px solid var(--ds-ink);}
.ds-stat div:first-child{border-left:0;}
.ds-stat b{display:block;font-size:17px;font-weight:800;line-height:1.3;}.ds-stat span{font-size:11px;color:var(--ds-mute);}
.ds-ev{display:flex;align-items:center;gap:12px;color:var(--pst-ink,var(--ds-ink));}
.ds-ico{width:84px;height:34px;flex:none;display:block;}
.ds-ev b{display:block;font-size:15px;font-weight:800;line-height:1.3;}.ds-ev span{font-size:12px;color:var(--pst-mute,var(--ds-mute));}
.ds-map{border:1px solid var(--ds-ink);border-radius:10px;background:var(--ds-bg);padding:4px;}
.ds-map svg{display:block;width:100%;height:auto;touch-action:manipulation;-webkit-user-select:none;user-select:none;}
.ds-map text{font-family:'Manrope',system-ui,sans-serif;pointer-events:none;}
.ds-blk{fill:var(--ds-block);}
.ds-road{stroke:var(--ds-road);stroke-linecap:round;}
.ds-dug{fill:var(--ds-bad);stroke:var(--ds-ink);}
.ds-route{fill:none;stroke:var(--ds-ink);stroke-linejoin:round;stroke-linecap:round;}
.ds-stop{cursor:pointer;}
.ds-stop circle.c{fill:hsl(var(--h) var(--ds-sat) var(--ds-lit));stroke:var(--ds-ink);}
.ds-stop.in circle.c{fill:var(--ds-acc);}
.ds-stop.bad circle.c{fill:var(--ds-bad);}
.ds-n{fill:var(--ds-ink);}.ds-nt{fill:var(--ds-bg);font-size:9.5px;font-weight:800;}
.ds-lab{font-size:9.5px;font-weight:800;fill:var(--ds-ink);paint-order:stroke;stroke:var(--ds-bg);stroke-width:3px;stroke-linejoin:round;}
.ds-home rect{fill:var(--ds-ink);}
.ds-home g{stroke:var(--ds-bg);}
.ds-msg{min-height:20px;text-align:center;font-size:13px;font-weight:700;color:var(--pst-ink,var(--ds-ink));}
.ds-card{border:1px solid var(--ds-ink);border-radius:10px;background:var(--ds-bg);overflow:hidden;}
.ds-cardh{font-size:12px;color:var(--ds-mute);font-weight:700;letter-spacing:.04em;padding:10px 12px 6px;text-transform:uppercase;}
.ds-req{display:flex;gap:10px;align-items:flex-start;padding:8px 12px;font-size:14px;border-top:1px solid var(--ds-grey2);}
.ds-req i{font-style:normal;flex:none;width:22px;height:22px;border-radius:999px;border:1px solid var(--ds-ink);display:flex;align-items:center;justify-content:center;font-size:12px;font-weight:800;line-height:1;margin-top:1px;}
.ds-req.ok i{background:var(--ds-ok);}.ds-req.bad i{background:var(--ds-bad);}
.ds-req b{font-weight:800;}.ds-req small{display:block;font-size:12px;color:var(--ds-mute);}
.ds-row{display:flex;justify-content:space-between;align-items:center;gap:10px;padding:7px 12px;font-size:14px;border-top:1px solid var(--ds-grey2);}
.ds-row b{font-weight:800;}.ds-row span{color:var(--ds-mute);font-size:12px;text-align:right;}
.ds-row.me{background:var(--ds-acc);color:var(--ds-on);}.ds-row.me span{color:var(--ds-on);font-weight:800;}
.ds-row em{font-style:normal;font-weight:800;font-variant-numeric:tabular-nums;min-width:44px;display:inline-block;}
.ds-row.late em,.ds-row.late b{color:var(--ds-ink);}.ds-row.late{background:var(--ds-bad);}
.ds-cap{text-align:center;font-size:12.5px;color:var(--pst-mute,var(--ds-mute));line-height:1.5;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}
.ds-cap b{font-weight:800;color:var(--pst-ink,var(--ds-ink));}
.ds-ord{display:grid;grid-template-columns:34px minmax(0,1fr) auto;align-items:center;gap:10px;width:100%;padding:5px 12px !important;border-top:1px solid var(--ds-grey2) !important;text-align:left;min-height:46px;}
.ds-ord .sw{width:32px;height:32px;border-radius:999px;border:1px solid var(--ds-ink);display:flex;align-items:center;justify-content:center;font-size:19px;line-height:1;background:hsl(var(--h) var(--ds-sat) var(--ds-lit));}
.ds-ord b{display:block;font-size:14px;font-weight:800;line-height:1.35;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}
.ds-ord small{display:block;font-size:12px;color:var(--ds-mute);line-height:1.4;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}
.ds-ord i{font-style:normal;font-size:12px;font-weight:800;line-height:1.5;padding:2px 9px;border-radius:999px;border:1px solid var(--ds-ink);background:var(--ds-bg);white-space:nowrap;font-variant-numeric:tabular-nums;}
.ds-ord i.ok{background:var(--ds-ok);}.ds-ord i.warn{background:var(--ds-warn);}.ds-ord i.no{background:var(--ds-grey);border-color:var(--ds-grey2);color:var(--ds-mute);}
.ds-ord.bag{background:var(--ds-acc);color:var(--ds-on);}.ds-ord.bag small{color:var(--ds-on);}
.ds-ord.fin{background:var(--ds-grey);}
.ds-ord:disabled{cursor:default;}
.ds-rest circle.c,.ds-house rect.c{fill:hsl(var(--h) var(--ds-sat) var(--ds-lit));stroke:var(--ds-ink);}
.ds-rest,.ds-house{cursor:pointer;}
.ds-rest.gone{opacity:.3;}
.ds-house.bag rect.c{fill:var(--ds-acc);stroke-width:2.2;}
.ds-house.fin rect.c{fill:var(--ds-ok);}
.ds-house .bd{fill:var(--ds-bg);stroke:var(--ds-ink);}
.ds-car circle{fill:var(--ds-ink);}
.ds-at{fill:none;stroke:var(--ds-ink);}
.ds-emo{font-family:'Apple Color Emoji','Segoe UI Emoji','Noto Color Emoji',sans-serif;}
.ds-btns{display:grid;grid-template-columns:1fr 1fr 1.3fr;gap:6px;}
.dash button.ds-btn{border:1px solid var(--ds-ink);border-radius:10px;padding:9px 4px;font-weight:800;font-size:14px;background:var(--ds-bg);text-align:center;line-height:1.3;}
.dash button.ds-btn.go{background:var(--ds-ink);color:var(--ds-bg);}
.dash button.ds-btn:disabled{opacity:.45;cursor:default;}
.ds-fin-on .ds-stop.fin{transform-box:fill-box;transform-origin:center;animation:ds-pop .34s ease-out backwards;}
@keyframes ds-pop{0%{transform:scale(1)}45%{transform:scale(1.28)}100%{transform:scale(1)}}
.ds-fin{position:fixed;inset:0;z-index:60;background:var(--ds-acc);color:#141414;display:flex;align-items:center;justify-content:center;animation:ds-open .5s ease-out backwards;}
@keyframes ds-open{from{clip-path:circle(0 at 50% 36%)}to{clip-path:circle(150% at 50% 36%)}}
.ds-fin-in{text-align:center;width:280px;}
.ds-fin .ds-ico{width:120px;height:48px;margin:0 auto 6px;}
.ds-rung{height:36px;line-height:34px;border:1px solid #141414;border-radius:10px;margin:6px 0;font-weight:800;font-size:15px;background:#ffffff;white-space:nowrap;animation:ds-lit .12s backwards;}
.ds-rung.over{opacity:.3;background:transparent;animation:none;}
.ds-rung.me{background:#141414;color:#ffffff;transform:scale(1.07);animation:ds-earn .15s backwards;}
@keyframes ds-lit{from{opacity:.3;background:transparent}}
@keyframes ds-earn{from{opacity:.3;background:transparent;color:#141414;transform:none}}
.ds-fin-t{font-size:26px;font-weight:800;height:44px;line-height:44px;margin-top:10px;white-space:nowrap;animation:ds-rise .25s backwards;}
.ds-fin-s{font-size:15px;height:22px;animation:ds-rise .25s backwards;}
@keyframes ds-rise{from{opacity:0;transform:translateY(8px)}}
@media (prefers-reduced-motion: reduce){.ds-fin,.ds-fin *,.ds-fin-on *{animation:none !important;}}
`;

const shortOf = (P, s) => Math.max(0, P.best - walk(P, s.taps).earn);
const shortLine = (n) => (n === 0 ? 'The best possible shift' : `$${n} short of the best`);
const rankName = (P, s) => { const r = rankOf(shortOf(P, s)); return r.rows[r.at].name; };
const WHY = { full: 'Bag Full', late: 'Too Late', end: 'Past Closing' };

function Board({ P, s, setS, active, done, held, release }) {
  const N = P.orders.length;
  const [note, setNote] = useState('');
  const live = active && !done;
  const w = walk(P, s.taps);
  const won = done && s.over;
  const finale = won && held;
  const short = Math.max(0, P.best - w.earn);
  const stuck = !anyMove(P, w);

  // the sheet: 340 wide, corners evenly spaced, nothing printed on it
  // (streets run closer together down the page than across it, so the town is short enough to keep the orders in view)
  const M = 22, gap = (340 - 2 * M) / (P.W - 1), gy = gap * 0.8, Hh = M + (P.H - 1) * gy + M;
  const X = (x) => M + x * gap, Y = (y) => M + y * gy;
  const R = gap > 55 ? 14 : 11.5;
  const line = w.pts.map(([x, y], k) => `${k ? 'L' : 'M'}${X(x)} ${Y(y)}`).join('');
  const busy = (c) => P.orders.some((o) => (o.r[0] === c[0] && o.r[1] === c[1]) || (o.h[0] === c[0] && o.h[1] === c[1]));
  const off = busy(w.pos) ? R * 0.95 : 0;

  const tap = (i) => {
    if (finale) { release(); return; }
    if (!live) return;
    const o = P.orders[i], n = next(P, w, i);
    if (n.kind === 'done') { setNote(`${o.n} is delivered. Use Undo to step back.`); return; }
    if (n.kind === 'no') { setNote(n.why === 'full' ? `The bag holds ${NUM[P.cap]}. Drop an order off first.` : n.why === 'end' ? `You cannot reach that door by ${clock(P.end)}.` : `No time left to pick up ${o.n} and deliver it.`); return; }
    setS({ ...s, taps: s.taps.concat(i), mv: s.mv + 1 });
    setNote(n.kind === 'pick' ? (n.wait ? `Waited ${n.wait} minutes for ${o.n}.` : '') : n.tip < o.tip ? `${o.n} arrived cold: $${n.tip} of $${o.tip}.` : '');
  };
  const undo = () => { if (!live || !s.taps.length) return; setS({ ...s, taps: s.taps.slice(0, -1) }); setNote(''); };
  const reset = () => { if (!live || !s.taps.length) return; setS({ ...s, taps: [] }); setNote('Back at the start.'); };
  const go = () => { if (!live || !w.count) return; setS({ ...s, over: true, short, mv: s.mv + 1 }); };

  const rank = won ? rankOf(short) : null;
  const order = Object.keys(w.del).map(Number).sort((a, b) => w.del[a].t - w.del[b].t);
  const idle = live ? note || (s.taps.length ? (stuck ? 'No moves left. End the shift, or undo.' : '') : 'Tap an order to pick it up, then again to drop it off.') : '';

  return (
    <div className="dash">
      <style dangerouslySetInnerHTML={html(CSS + COLS_CSS)} />
      <div className="pz-wrap"><div className="pz-cols"><div className="pz-main">
      <div className="ds-stat" aria-label="The shift so far">
        <div><b>{clock(w.t)}</b><span>Clock</span></div>
        <div><b>{w.bag.length ? <span className="ds-emo" style={{ fontSize: 17, color: 'inherit' }}>{w.bag.map((i) => P.orders[i].e).join(' ')}</span> : 'Empty'}</b><span>Bag of {Cap(NUM[P.cap])}</span></div>
        <div><b>${w.earn}</b><span>Tips</span></div>
      </div>
      <div className="ds-cap"><b>{P.day}</b> · {clock(0)} to {clock(P.end)} · {PER} min a block, {STAY} a stop</div>
      <div className="ds-map">
        <svg viewBox={`0 0 340 ${Hh}`} className={finale ? 'ds-fin-on' : undefined} role="img" aria-label={`A town of ${P.W} by ${P.H} corners with ${N} restaurants and ${N} doors`}>
          {Array.from({ length: (P.W - 1) * (P.H - 1) }, (_, k) => { const x = k % (P.W - 1), y = Math.floor(k / (P.W - 1)); return <rect key={k} className="ds-blk" x={X(x) + 6} y={Y(y) + 6} width={gap - 12} height={gy - 12} rx={4} />; })}
          {Array.from({ length: P.H }, (_, y) => <line key={`rh${y}`} className="ds-road" x1={X(0)} y1={Y(y)} x2={X(P.W - 1)} y2={Y(y)} strokeWidth={6} />)}
          {Array.from({ length: P.W }, (_, x) => <line key={`rv${x}`} className="ds-road" x1={X(x)} y1={Y(0)} x2={X(x)} y2={Y(P.H - 1)} strokeWidth={6} />)}
          {w.pts.length > 1 ? <path className="ds-route" d={line} strokeWidth={3} /> : null}
          <circle className="ds-at" cx={X(P.start[0])} cy={Y(P.start[1])} r={5} strokeWidth={2} />
          {P.orders.map((o, i) => {
            const x = X(o.r[0]), y = Y(o.r[1]);
            return (
              <g key={`r${i}`} data-rest={i} className={`ds-rest${w.picked.includes(i) ? ' gone' : ''}`} onClick={() => tap(i)} style={{ '--h': hue(i) }}>
                <circle className="c" cx={x} cy={y} r={R} />
                <text className="ds-emo" x={x} y={y + R * 0.4} textAnchor="middle" fontSize={R * 1.15}>{o.e}</text>
              </g>);
          })}
          {P.orders.map((o, i) => {
            const x = X(o.h[0]), y = Y(o.h[1]), fin = !!w.del[i], at = order.indexOf(i), q = R * 0.92;
            return (
              <g key={`h${i}`} data-house={i} className={`ds-house ds-stop${fin ? ' fin' : w.bag.includes(i) ? ' bag' : ''}`} onClick={() => tap(i)}
                style={{ '--h': hue(i), ...(finale && fin ? { animationDelay: `${150 + at * POP}ms` } : null) }}>
                <rect className="c" x={x - q} y={y - q} width={q * 2} height={q * 2} rx={4.5} />
                <path d={HOUSE} transform={`translate(${x} ${y + 0.5}) scale(${R / 13})`} fill="none" stroke="#141414" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" />
                <circle className="bd" cx={x + q} cy={y - q} r={7} />
                {fin ? <path d={`M${x + q - 3} ${y - q}l2.2 2.2 3.8-4.2`} fill="none" stroke="var(--ds-ink)" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round" />
                  : <text className="ds-emo" x={x + q} y={y - q + 3.3} textAnchor="middle" fontSize={9}>{o.e}</text>}
              </g>);
          })}
          <g className="ds-car" pointerEvents="none" transform={`translate(${X(w.pos[0]) - off} ${Y(w.pos[1]) + off})`}>
            <circle r={9.5} />
            <path d="M-5.5 2.2v-2l1.6-.5 1.5-2.4h4.6l1.9 2.4 1.6.6v1.9M-3.4 2.2h6.6" fill="none" stroke="var(--ds-bg)" strokeWidth={1.3} strokeLinecap="round" strokeLinejoin="round" />
            <circle cx={-3.4} cy={2.6} r={1.1} style={{ fill: 'var(--ds-bg)' }} /><circle cx={3.4} cy={2.6} r={1.1} style={{ fill: 'var(--ds-bg)' }} />
          </g>
        </svg>
      </div>
      {won && !held ? null : (
        <>
          {done ? null : <div className="ds-msg" aria-live="polite">{idle}</div>}
          {done ? null : (
            <div className="ds-btns">
              <button type="button" className="ds-btn" onClick={undo} disabled={!live || !s.taps.length}>Undo</button>
              <button type="button" className="ds-btn" onClick={reset} disabled={!live || !s.taps.length}>Start Over</button>
              <button type="button" className="ds-btn go" data-go="1" onClick={go} disabled={!live || !w.count}>End Shift</button>
            </div>
          )}
        </>
      )}
      </div>
      <div className="pz-side">
      {won && !held ? (
        <>
          <div className="ds-card">
            <div className="ds-cardh">Tip Ladder</div>
            {rank.rows.map((r, i) => <div key={r.name} className={`ds-row${i === rank.at ? ' me' : ''}`}><b>{r.name}</b><span>{i === rank.at ? 'You · ' : ''}{r.label}</span></div>)}
          </div>
          <div className="ds-card">
            <div className="ds-cardh">The Shift</div>
            <div className="ds-row"><b>Tips</b><span>${w.earn}</span></div>
            <div className="ds-row"><b>Best Possible</b><span>${P.best}</span></div>
            <div className="ds-row"><b>On Offer</b><span>${offer(P)}</span></div>
            <div className="ds-row"><b>Orders Delivered</b><span>{w.count}</span></div>
            <div className="ds-row"><b>Blocks Driven</b><span>{w.blocks}</span></div>
          </div>
        </>
      ) : null}
      <div className="ds-card">
        <div className="ds-cardh">Orders</div>
        {P.orders.map((o, i) => {
          const n = next(P, w, i), d = w.del[i];
          let cls = '', txt = '';
          if (d) { cls = d.tip === o.tip ? 'ok' : 'warn'; txt = `+$${d.tip} at ${clock(d.t)}`; }
          else if (n.kind === 'pick') txt = `Pick Up ${clock(n.t)}`;
          else if (n.kind === 'drop') { cls = n.tip === o.tip ? 'ok' : 'warn'; txt = `Drop ${clock(n.t)} · $${n.tip}`; }
          else { cls = 'no'; txt = WHY[n.why]; }
          return (
            <button type="button" key={i} data-ord={i} className={`ds-ord${d ? ' fin' : w.bag.includes(i) ? ' bag' : ''}`} onClick={() => tap(i)} disabled={!live} style={{ '--h': hue(i) }}>
              <span className="sw ds-emo" aria-hidden="true">{o.e}</span>
              <span><b>{o.n} · ${o.tip}</b><small>{o.ready ? `Ready ${clock(o.ready)} · ` : ''}Hot until {clock(o.by)}</small></span>
              <i className={cls}>{txt}</i>
            </button>);
        })}
      </div>
      </div></div></div>

      {finale ? (
        <div className="ds-fin" style={{ animationDelay: `${openAt(w.count)}ms` }} onClick={release} role="status" aria-label={`${rank.rows[rank.at].name}. ${shortLine(short)}.`}>
          <div className="ds-fin-in">
            <span dangerouslySetInnerHTML={html(CAR)} />
            {rank.rows.map((r, i) => (
              <div key={r.name} className={`ds-rung${i < rank.at ? ' over' : i === rank.at ? ' me' : ''}`}
                style={i >= rank.at ? { animationDelay: `${climbAt(w.count) + (RUNG_H - 1 - i) * STEP}ms` } : undefined}>{r.name}</div>
            ))}
            <div className="ds-fin-t" style={{ animationDelay: `${climbAt(w.count) + (RUNG_H - 1 - rank.at) * STEP + 250}ms` }}>{rank.rows[rank.at].name}</div>
            <div className="ds-fin-s" style={{ animationDelay: `${climbAt(w.count) + (RUNG_H - 1 - rank.at) * STEP + 250}ms` }}>${w.earn} in tips · {shortLine(short).toLowerCase()}</div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

const okTaps = (P, taps) => Array.isArray(taps) && taps.length <= P.orders.length * 2 && taps.every((i) => Number.isInteger(i) && i >= 0 && i < P.orders.length) && walk(P, taps).skipped === 0;
const GAME = {
  key: 'dash', name: 'Dash', cat: 'Logic', miss: 'dollars short', missOne: 'dollar short',
  fresh: () => ({ taps: [], over: false, mv: 0 }),
  validSave: (P, s) => !!s && typeof s.over === 'boolean' && Number.isInteger(s.mv) && okTaps(P, s.taps) && (!s.over || walk(P, s.taps).count > 0),
  touched: (s) => s.mv > 0,
  solved: (P, s) => s.over === true,
  count: (s) => (s.over ? s.short || 0 : 0),
  result: (P, s, won) => ({ score: won ? 10 : 0, total: 10, correct: won ? 1 : 0, guessesUsed: won ? shortOf(P, s) : 0 }),
  metric: (P, s, won) => (won ? shortOf(P, s) : null),
  Board,
  wide: true,
  holdMs: (P, s, won) => { if (!won) return 1200; const r = rankOf(shortOf(P, s)), n = walk(P, s.taps).count; return climbAt(n) + (RUNG_H - 1 - r.at) * STEP + 250 + 1500; },
  title: (P, s, won) => (won ? rankName(P, s) : endSolved(false)),
  eyebrow: (P, s, { sundayLabel }) => `${sundayLabel || `${BAND[P.band]} · ${P.day}`} · No. ${P.num}`,
  foot: (P, s) => { const w = walk(P, s.taps); return `$${w.earn} in tips · ${clock(w.t)}`; },
  frac: (P, s) => (s.over ? 1 : Math.min(0.95, walk(P, s.taps).t / P.end)),
  // the intro board falls on a Sunday and is not a Sunday Edition
  sundayLabel: (P) => (P.band === 'sunday' ? 'Sunday Edition · The Big Night' : null),
  gateTitle: (P) => `Tonight: ${P.day}, ${NUM[P.orders.length]} orders and a bag of ${NUM[P.cap]}`,
  gateLine: (P) => `Your shift runs from ${clock(0)} to ${clock(P.end)} and there is not time for every order. Every block takes ${PER} minutes and every stop ${STAY}. Choose what to carry and in what order, and make the most in tips.`,
  rules: (P) => ({
    lead: 'One shift, more orders than you can deliver. Make the most you can in tips.',
    steps: [
      <><b>Tap an order</b> to drive to its restaurant and pick it up. <b>Tap it again</b> to drive to its door and drop it off. You can tap the list or the map: a restaurant is a circle and its door is a square of the same colour.</>,
      <>The shift runs from {clock(0)} to {clock(P.end)}. Every <b>block</b> takes {PER} minutes and every <b>stop</b> takes {STAY}. Nothing counts after {clock(P.end)}.</>,
      <>Your <b>bag holds {NUM[P.cap]}</b>, so you can pick up orders that are heading the same way before you drop any of them.</>,
      <>Every order is <b>hot until</b> a set time. After that the tip drops a dollar for every two minutes.{P.orders.some((o) => o.ready) ? <> An order marked <b>Ready</b> is not cooked yet: arrive early and you wait.</> : null}</>,
      <>Each row shows what its next tap would do from where you are now: when you would arrive and what it would pay. Trying a plan costs nothing. <b>Undo</b> steps back and <b>Start Over</b> clears the night.</>,
      <>Press <b>End Shift</b> when you are happy with the night. That is the shift you are scored on.</>,
    ],
    knack: 'The biggest tip is not always worth the drive. Look for two restaurants close together whose doors lie the same way, and for the order that goes cold first.',
    footer: 'Ending a shift with at least one delivery counts. The fewest dollars short of the best possible shift ranks first, then the clock, and the Tip Ladder names your rung.',
  }),
  pitch: (P) => `${Cap(NUM[P.orders.length])} orders, $${offer(P)} on offer and not enough time. How much can you make?`,
  shareLine: (P, s, won, el) => `Dash #${P.num} · ${won ? `${rankName(P, s)} · $${walk(P, s.taps).earn} in tips · ${shortLine(shortOf(P, s)).toLowerCase()} · ${el}` : 'unfinished'}`,
  detail: (P, s, won, el) => { const w = walk(P, s.taps); return won ? `$${w.earn} in tips · ${shortLine(shortOf(P, s))} · ${el}` : `$${w.earn} in tips · ${el}`; },
  aboutTitle: 'About Dash',
  about: [
    'Dash is a free daily delivery puzzle from Mind Loft. You drive one evening shift in a small town seen from above. Restaurants have orders waiting, every order has a door to reach and a tip, and there is never time to deliver them all. Choose which orders to take and in what order, and finish the night with as much in tips as you can.',
    'Three things shape the night. Every block of driving takes two minutes and every pickup or drop-off takes two more. Your bag holds two orders, three at the weekend, so you can stack pickups that are heading the same way. And every order is hot until a set time: after that the tip falls a dollar for every two minutes it is late.',
    'Trying a plan costs nothing. Each order shows when you would arrive and what it would pay from where the car is now, and Undo steps back as far as you like. The puzzle is in the choosing: the biggest tip is often a long drive, and the best shift usually leaves a tempting order behind. Every board has a best possible total, and you are scored on how many dollars short of it you finish.',
    'The town grows through the week: five orders in an hour on Monday, food that is not ready yet from Wednesday, ninety minutes and more orders by Thursday, a bag of three on Saturday, and on Sunday the big night of ten restaurants across the largest town. The Tip Ladder names your rung, from Wrong Address up to Five Stars.',
    <>More everyday puzzles: <a href="/errands" style={{ color: 'inherit', fontWeight: 800 }}>Errands</a>, <a href="/bag" style={{ color: 'inherit', fontWeight: 800 }}>Bag</a>, <a href="/chef" style={{ color: 'inherit', fontWeight: 800 }}>Chef</a>, <a href="/seated" style={{ color: 'inherit', fontWeight: 800 }}>Seated</a>, <a href="/pack" style={{ color: 'inherit', fontWeight: 800 }}>Pack</a> and <a href="/mop" style={{ color: 'inherit', fontWeight: 800 }}>Mop</a>.</>,
  ],
};

export default function DashClient(props) {
  return <SimpleDaily {...props} game={GAME} />;
}
