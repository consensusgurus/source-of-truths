'use client';

// Errands: the daily route-planning puzzle (owner, 2026-11-15: the third
// "practical puzzle" mockup with Seated and Bag; "also do the same for errands.
// create and push"). A town of streets seen from above, a list of stops and a few
// rules: the bank shuts at 9:45, the cleaners open at 10:00, the ice cream has to
// be home within half an hour. Tap the stops in the order you will drive them and
// be home as soon as you can.
//
// The model is lib/errands-engine.js (shared with the generator and the checker).
// Runs on app/SimpleDaily.jsx. Trying an order costs nothing: the route, the
// timetable and every rule update as you tap, and the last stop can always be
// taken back. DRIVE HOME commits the trip, and only when every rule is kept.
// The miss column is minutes behind the soonest possible time home (`best` on the
// row; the order that gets it never reaches the browser), lower first, then the
// clock. The Errand Ladder names the rung.
//
// THE BOARD NEVER MOVES AT THE FINISH (owner rule): the stops pop in the order
// they were driven, then the full-screen fill opens with the ladder climb.

import React, { useState } from 'react';
import SimpleDaily from '../SimpleDaily';
import { endSolved } from '@/lib/end-verdict';
import { walk, ruleState, pathBetween, clock, rankOf } from '@/lib/errands-engine';

const BAND = { intro: 'Intro', gentle: 'Gentle', moderate: 'Moderate', tough: 'Tough', sunday: 'Sunday Edition' };
const STEP = 140, RUNG_H = 8, POP = 170;
const openAt = (n) => 150 + (n + 1) * POP + 550;
const climbAt = (n) => openAt(n) + 650;
const html = (s) => ({ __html: s });
const NUM = ['no', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine'];

// pictures, drawn in a 20 by 20 box
const PIC = {
  bank: '<path d="M3 8l7-4 7 4M4.5 8v7M8 8v7M12 8v7M15.5 8v7M3 16h14"/>', bread: '<path d="M4 16V9a3 3 0 013-3h6a3 3 0 013 3v7zM8 6v3M12 6v3"/>',
  mail: '<path d="M3 6h14v9H3zM3 6l7 5 7-5"/>', shirt: '<path d="M7 4L3 7l2 3 2-1v7h6V9l2 1 2-3-4-3-3 2z"/>',
  basket: '<path d="M4 9h12l-1.5 7h-9zM7 9l3-5 3 5"/>', cross: '<path d="M8 4h4v4h4v4h-4v4H8v-4H4V8h4z"/>',
  book: '<path d="M10 6.5V16M4 5h4.5A1.5 1.5 0 0110 6.5 1.5 1.5 0 0111.5 5H16v10h-4.5M4 5v10h4.5"/>',
  flower: '<circle cx="10" cy="8" r="2"/><path d="M10 3v3M10 10v7M5.7 5.5l2.6 1.5M14.3 5.5l-2.6 1.5M5.7 10.5L8.3 9M14.3 10.5L11.7 9M7 17h6"/>',
  knife: '<path d="M4 16L15 4q1.5 5-3 9zM4 16h3"/>', hammer: '<path d="M5 5h7l3 2.5-3 2.5H5zM9 10v7"/>',
  paw: '<path d="M10 11q4 1 3 5H7q-1-4 3-5z"/><circle cx="5.5" cy="9" r="1.2"/><circle cx="8.3" cy="5.8" r="1.2"/><circle cx="11.7" cy="5.8" r="1.2"/><circle cx="14.5" cy="9" r="1.2"/>',
  cup: '<path d="M5 8h9v4a4 4 0 01-4 4H9a4 4 0 01-4-4zM14 9h1.2a1.8 1.8 0 010 3.6H14M7.5 3.5v2M10.5 3.5v2"/>',
  cone: '<path d="M6 9l4 8 4-8M5.5 9a4.5 4.5 0 019 0z"/>', fish: '<path d="M3 10q4-5 9-2l4-3v10l-4-3q-5 3-9-2z"/><circle cx="7" cy="9.5" r=".6"/>',
  needle: '<path d="M4 16L15 5M13 3.5l3.5 3.5M4 16q5-1 6-5"/>', scissors: '<circle cx="6" cy="14.5" r="2"/><circle cx="14" cy="14.5" r="2"/><path d="M7 12.8L14 4M13 12.8L6 4"/>',
  kite: '<path d="M10 3l5 6-5 6-5-6zM10 15q-2 1 0 3"/>', wrench: '<path d="M4.5 16.5l6-6M10 10.5A3.6 3.6 0 0114.6 5.9L12.2 8.3l1.5 1.5 2.4-2.4A3.6 3.6 0 0110 10.5z"/>',
  pizza: '<path d="M4 5.5q6-3 12 0l-6 11.5z"/><circle cx="8.5" cy="8" r=".7"/><circle cx="11.5" cy="10" r=".7"/>',
  home: '<path d="M3 10l7-6.5 7 6.5M5 9v7.5h10V9M8.8 16.5v-4h2.4v4"/>',
};
const pic = (k, x, y, size) => `<g transform="translate(${x - size / 2} ${y - size / 2}) scale(${size / 20})" fill="none" stroke="#141414" stroke-width="${1.5 * (20 / size) * (size / 20)}" stroke-linecap="round" stroke-linejoin="round">${PIC[k] || PIC.home}</g>`;
const CAR = '<svg class="er-ico" viewBox="0 0 120 48" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round" stroke-linecap="round" aria-hidden="true"><path d="M22 34h-8v-9l8-3 8-10h30l12 10 20 4v8h-8"/><path d="M34 34h36"/><circle cx="28" cy="34" r="6"/><circle cx="78" cy="34" r="6"/><path d="M33 22h36L60 14H40z"/><path d="M50 14v8"/><path d="M98 12h10M102 18h10M96 24h8"/></svg>';

const CSS = `
.errands{align-self:center;width:100%;max-width:560px;display:flex;flex-direction:column;gap:10px;font-family:'Manrope',system-ui,sans-serif;font-weight:600;color:var(--er-ink);line-height:1.4;
--er-bg:#ffffff;--er-ink:#141414;--er-mute:#6b6b6b;--er-grey:#f1f1ef;--er-grey2:#e3e3df;--er-road:#dcdcd6;--er-block:#eef4ea;--er-ok:#bfe6c8;--er-bad:#f3b0b0;--er-sat:62%;--er-lit:84%;--er-acc:var(--pst-acc,#fecdd3);--er-on:var(--pst-on-acc,#141414);}
.stage-page[data-stage-theme='dark'] .errands,.pst.dk .errands{--er-bg:#161616;--er-ink:#f2f2ee;--er-mute:#a3a39d;--er-grey:#232323;--er-grey2:#333333;--er-road:#3d3d3a;--er-block:#1d241d;--er-ok:#3f7a52;--er-bad:#9c5050;--er-sat:40%;--er-lit:66%;}
.errands button{font:inherit;color:inherit;cursor:pointer;background:none;border:0;padding:0;margin:0;}
.er-stat{display:flex;border:1px solid var(--er-ink);border-radius:10px;overflow:hidden;background:var(--er-bg);}
.er-stat div{flex:1;padding:6px 4px;text-align:center;border-left:1px solid var(--er-ink);}
.er-stat div:first-child{border-left:0;}
.er-stat b{display:block;font-size:17px;font-weight:800;line-height:1.3;}.er-stat span{font-size:11px;color:var(--er-mute);}
.er-ev{display:flex;align-items:center;gap:12px;color:var(--pst-ink,var(--er-ink));}
.er-ico{width:84px;height:34px;flex:none;display:block;}
.er-ev b{display:block;font-size:15px;font-weight:800;line-height:1.3;}.er-ev span{font-size:12px;color:var(--pst-mute,var(--er-mute));}
.er-map{border:1px solid var(--er-ink);border-radius:10px;background:var(--er-bg);padding:4px;}
.er-map svg{display:block;width:100%;height:auto;touch-action:manipulation;-webkit-user-select:none;user-select:none;}
.er-map text{font-family:'Manrope',system-ui,sans-serif;pointer-events:none;}
.er-blk{fill:var(--er-block);}
.er-road{stroke:var(--er-road);stroke-linecap:round;}
.er-dug{fill:var(--er-bad);stroke:var(--er-ink);}
.er-route{fill:none;stroke:var(--er-ink);stroke-linejoin:round;stroke-linecap:round;}
.er-stop{cursor:pointer;}
.er-stop circle.c{fill:hsl(var(--h) var(--er-sat) var(--er-lit));stroke:var(--er-ink);}
.er-stop.in circle.c{fill:var(--er-acc);}
.er-stop.bad circle.c{fill:var(--er-bad);}
.er-n{fill:var(--er-ink);}.er-nt{fill:var(--er-bg);font-size:9.5px;font-weight:800;}
.er-lab{font-size:9.5px;font-weight:800;fill:var(--er-ink);paint-order:stroke;stroke:var(--er-bg);stroke-width:3px;stroke-linejoin:round;}
.er-home rect{fill:var(--er-ink);}
.er-home g{stroke:var(--er-bg);}
.er-msg{min-height:20px;text-align:center;font-size:13px;font-weight:700;color:var(--pst-ink,var(--er-ink));}
.er-card{border:1px solid var(--er-ink);border-radius:10px;background:var(--er-bg);overflow:hidden;}
.er-cardh{font-size:12px;color:var(--er-mute);font-weight:700;letter-spacing:.04em;padding:10px 12px 6px;text-transform:uppercase;}
.er-req{display:flex;gap:10px;align-items:flex-start;padding:8px 12px;font-size:14px;border-top:1px solid var(--er-grey2);}
.er-req i{font-style:normal;flex:none;width:22px;height:22px;border-radius:999px;border:1px solid var(--er-ink);display:flex;align-items:center;justify-content:center;font-size:12px;font-weight:800;line-height:1;margin-top:1px;}
.er-req.ok i{background:var(--er-ok);}.er-req.bad i{background:var(--er-bad);}
.er-req b{font-weight:800;}.er-req small{display:block;font-size:12px;color:var(--er-mute);}
.er-row{display:flex;justify-content:space-between;align-items:center;gap:10px;padding:7px 12px;font-size:14px;border-top:1px solid var(--er-grey2);}
.er-row b{font-weight:800;}.er-row span{color:var(--er-mute);font-size:12px;text-align:right;}
.er-row.me{background:var(--er-acc);color:var(--er-on);}.er-row.me span{color:var(--er-on);font-weight:800;}
.er-row em{font-style:normal;font-weight:800;font-variant-numeric:tabular-nums;min-width:44px;display:inline-block;}
.er-row.late em,.er-row.late b{color:var(--er-ink);}.er-row.late{background:var(--er-bad);}
.er-btns{display:grid;grid-template-columns:1fr 1fr 1.3fr;gap:6px;}
.errands button.er-btn{border:1px solid var(--er-ink);border-radius:10px;padding:9px 4px;font-weight:800;font-size:14px;background:var(--er-bg);text-align:center;line-height:1.3;}
.errands button.er-btn.go{background:var(--er-ink);color:var(--er-bg);}
.errands button.er-btn:disabled{opacity:.45;cursor:default;}
.er-fin-on .er-stop{transform-box:fill-box;transform-origin:center;animation:er-pop .34s ease-out backwards;}
@keyframes er-pop{0%{transform:scale(1)}45%{transform:scale(1.28)}100%{transform:scale(1)}}
.er-fin{position:fixed;inset:0;z-index:60;background:var(--er-acc);color:#141414;display:flex;align-items:center;justify-content:center;animation:er-open .5s ease-out backwards;}
@keyframes er-open{from{clip-path:circle(0 at 50% 36%)}to{clip-path:circle(150% at 50% 36%)}}
.er-fin-in{text-align:center;width:280px;}
.er-fin .er-ico{width:120px;height:48px;margin:0 auto 6px;}
.er-rung{height:36px;line-height:34px;border:1px solid #141414;border-radius:10px;margin:6px 0;font-weight:800;font-size:15px;background:#ffffff;white-space:nowrap;animation:er-lit .12s backwards;}
.er-rung.over{opacity:.3;background:transparent;animation:none;}
.er-rung.me{background:#141414;color:#ffffff;transform:scale(1.07);animation:er-earn .15s backwards;}
@keyframes er-lit{from{opacity:.3;background:transparent}}
@keyframes er-earn{from{opacity:.3;background:transparent;color:#141414;transform:none}}
.er-fin-t{font-size:26px;font-weight:800;height:44px;line-height:44px;margin-top:10px;white-space:nowrap;animation:er-rise .25s backwards;}
.er-fin-s{font-size:15px;height:22px;animation:er-rise .25s backwards;}
@keyframes er-rise{from{opacity:0;transform:translateY(8px)}}
@media (prefers-reduced-motion: reduce){.er-fin,.er-fin *,.er-fin-on *{animation:none !important;}}
`;

const behindOf = (P, s) => Math.max(0, walk(P, s.route).home - P.best);
const behindLine = (n) => (n === 0 ? 'The soonest possible' : `${n} min behind the soonest`);
const rankName = (P, s) => { const r = rankOf(behindOf(P, s)); return r.rows[r.at].name; };
const ruleText = (P, r) => {
  const S = (i) => P.stops[i].n;
  if (r.t === 'closes') return <>The {S(r.s)} <b>shuts at {clock(r.at)}</b>. Be there by then.</>;
  if (r.t === 'opens') return <>The {S(r.s)} <b>opens at {clock(r.at)}</b>. Arrive early and you wait.</>;
  if (r.t === 'fresh') return <>{r.what} from the {S(r.s)} must be <b>home within {r.m} minutes</b>.</>;
  return <>The <b>{S(r.a)} comes before</b> the {S(r.b)}.</>;
};

function Board({ P, s, setS, active, done, held, release }) {
  const N = P.stops.length;
  const [note, setNote] = useState('');
  const live = active && !done;
  const w = walk(P, s.route);
  const st = P.rules.map((r) => ruleState(P, s.route, r, w));
  const broken = st.filter((x) => x === 'bad').length;
  const full = s.route.length === N;
  const won = done && s.home;
  const finale = won && held;
  const behind = full ? Math.max(0, w.home - P.best) : 0;

  // the sheet: 340 wide, corners evenly spaced
  const M = 30, gap = (340 - 2 * M) / (P.W - 1), Hh = M + (P.H - 1) * gap + M + 12;
  const X = (x) => M + x * gap, Y = (y) => M + y * gap;
  const R = gap > 60 ? 15.5 : 13.5;
  const shut = new Set((P.closed || []).map((c) => c.join()));
  const roads = [];
  for (let y = 0; y < P.H; y++) for (let x = 0; x < P.W; x++) {
    if (x + 1 < P.W) roads.push([x, y, x + 1, y]);
    if (y + 1 < P.H) roads.push([x, y, x, y + 1]);
  }
  const pts = [P.home].concat(s.route.map((i) => P.stops[i].at)).concat(s.home || full ? [P.home] : []);
  let line = '';
  for (let i = 1; i < pts.length; i++) { const p = pathBetween(P, pts[i - 1], pts[i]) || []; line += p.map(([x, y], k) => `${i === 1 && k === 0 ? 'M' : 'L'}${X(x)} ${Y(y)}`).join(''); }
  const flagged = new Set();
  P.rules.forEach((r, i) => { if (st[i] === 'bad') { if (r.t === 'before') { flagged.add(r.a); flagged.add(r.b); } else flagged.add(r.s); } });

  const tap = (i) => {
    if (finale) { release(); return; }
    if (!live) return;
    const at = s.route.indexOf(i);
    if (at === s.route.length - 1 && at >= 0) { setS({ ...s, route: s.route.slice(0, -1) }); setNote(`The ${P.stops[i].n} is off the route.`); return; }
    if (at >= 0) { setNote('Only the last stop can be taken off. Use Undo to step back.'); return; }
    const route = s.route.concat(i), w2 = walk(P, route), bad2 = P.rules.filter((r) => ruleState(P, route, r, w2) === 'bad').length;
    setS({ ...s, route, mv: s.mv + 1 });
    setNote(bad2 ? (bad2 === 1 ? 'That breaks a rule.' : `That breaks ${NUM[bad2]} rules.`) : route.length === N ? `Home at ${clock(w2.home)}. Drive home, or try another order.` : '');
  };
  const undo = () => { if (!live || !s.route.length) return; setS({ ...s, route: s.route.slice(0, -1) }); setNote(''); };
  const reset = () => { if (!live || !s.route.length) return; setS({ ...s, route: [] }); setNote('A clean map.'); };
  const go = () => { if (!live || !full || broken) return; setS({ ...s, home: true, behind: Math.max(0, w.home - P.best), mv: s.mv + 1 }); };

  const rank = won ? rankOf(behind) : null;
  const detail = (r, i) => {
    const leg = w.legs.find((l) => l.s === (r.t === 'before' ? -1 : r.s));
    if (r.t === 'closes' && leg) return `You arrive at ${clock(leg.arrive)}.`;
    if (r.t === 'opens' && leg) return leg.wait ? `You arrive at ${clock(leg.arrive)} and wait ${leg.wait} minutes.` : `You arrive at ${clock(leg.arrive)}. No wait.`;
    if (r.t === 'fresh' && leg) return full || st[i] === 'bad' ? `${w.home - leg.leave} minutes from the shop to your door${full ? '' : ' if you turned for home now'}.` : 'Picked up. The clock is running.';
    return null;
  };

  return (
    <div className="errands">
      <style dangerouslySetInnerHTML={html(CSS)} />
      <div className="er-stat" aria-label="The trip so far">
        <div><b>{s.route.length}/{N}</b><span>Stops</span></div>
        <div><b>{w.blocks - (full || s.home ? 0 : w.homeBlocks)}</b><span>Blocks Driven</span></div>
        <div><b>{full ? clock(w.home) : '-:--'}</b><span>Home At</span></div>
      </div>
      <div className="er-ev">
        <span dangerouslySetInnerHTML={html(CAR)} />
        <div><b>{P.day}</b><span>{NUM[N][0].toUpperCase()}{NUM[N].slice(1)} stops · leave at {clock(P.start)} · {P.per} min a block, {P.stay} a stop</span></div>
      </div>
      <div className="er-map">
        <svg viewBox={`0 0 340 ${Hh}`} className={finale ? 'er-fin-on' : undefined} role="img" aria-label={`A town of ${P.W} by ${P.H} corners with ${N} stops`}>
          {Array.from({ length: (P.W - 1) * (P.H - 1) }, (_, k) => { const x = k % (P.W - 1), y = Math.floor(k / (P.W - 1)); return <rect key={k} className="er-blk" x={X(x) + 8} y={Y(y) + 8} width={gap - 16} height={gap - 16} rx={5} />; })}
          {roads.map((e) => (shut.has(e.join()) ? null : <line key={e.join()} className="er-road" x1={X(e[0])} y1={Y(e[1])} x2={X(e[2])} y2={Y(e[3])} strokeWidth={9} />))}
          {(P.closed || []).map((e) => { const cx = (X(e[0]) + X(e[2])) / 2, cy = (Y(e[1]) + Y(e[3])) / 2; return (
            <g key={`c${e.join()}`}><circle className="er-dug" cx={cx} cy={cy} r={8} /><path d={`M${cx - 3.2} ${cy - 3.2}l6.4 6.4M${cx + 3.2} ${cy - 3.2}l-6.4 6.4`} stroke="var(--er-ink)" strokeWidth={1.6} strokeLinecap="round" /></g>); })}
          {line ? <path className="er-route" d={line} strokeWidth={3} /> : null}
          <g className="er-home"><rect x={X(P.home[0]) - R} y={Y(P.home[1]) - R} width={R * 2} height={R * 2} rx={6} /><g dangerouslySetInnerHTML={html(pic('home', X(P.home[0]), Y(P.home[1]), R * 1.35).replace('stroke="#141414"', ''))} />
            <text className="er-lab" x={X(P.home[0])} y={Y(P.home[1]) + R + 10.5} textAnchor="middle">Home</text></g>
          {P.stops.map((sp, i) => {
            const at = s.route.indexOf(i), x = X(sp.at[0]), y = Y(sp.at[1]);
            return (
              <g key={i} data-stop={i} className={`er-stop${at >= 0 ? ' in' : ''}${flagged.has(i) && !done ? ' bad' : ''}`} onClick={() => tap(i)}
                style={{ '--h': (i * 47 + 20) % 360, ...(finale ? { animationDelay: `${150 + Math.max(0, at) * POP}ms` } : null) }}>
                <circle className="c" cx={x} cy={y} r={R} />
                <g dangerouslySetInnerHTML={html(pic(sp.k, x, y, R * 1.3))} />
                <text className="er-lab" x={x} y={y + R + 10.5} textAnchor="middle">{sp.n}</text>
                {at >= 0 ? <><circle className="er-n" cx={x + R * 0.78} cy={y - R * 0.78} r={7.5} /><text className="er-nt" x={x + R * 0.78} y={y - R * 0.78 + 3.4} textAnchor="middle">{at + 1}</text></> : null}
              </g>);
          })}
        </svg>
      </div>

      {won && !held ? (
        <>
          <div className="er-card">
            <div className="er-cardh">Errand Ladder</div>
            {rank.rows.map((r, i) => <div key={r.name} className={`er-row${i === rank.at ? ' me' : ''}`}><b>{r.name}</b><span>{i === rank.at ? 'You · ' : ''}{r.label}</span></div>)}
          </div>
          <div className="er-card">
            <div className="er-cardh">The Trip</div>
            <div className="er-row"><b>Home At</b><span>{clock(w.home)}</span></div>
            <div className="er-row"><b>Soonest Possible</b><span>{clock(P.best)}</span></div>
            <div className="er-row"><b>Blocks Driven</b><span>{w.blocks}</span></div>
          </div>
        </>
      ) : (
        <>
          {done ? null : <div className="er-msg" aria-live="polite">{live ? note || (s.route.length ? '' : 'Tap the stops in the order you will drive them.') : ''}</div>}
          {done ? null : (
            <div className="er-btns">
              <button type="button" className="er-btn" onClick={undo} disabled={!live || !s.route.length}>Undo</button>
              <button type="button" className="er-btn" onClick={reset} disabled={!live || !s.route.length}>Start Over</button>
              <button type="button" className="er-btn go" data-go="1" onClick={go} disabled={!live || !full || broken > 0}>Drive Home</button>
            </div>
          )}
          <div className="er-card">
            <div className="er-cardh">The Rules</div>
            {P.rules.map((r, i) => (
              <div key={i} className={`er-req${st[i] === 'open' ? '' : ` ${st[i]}`}`}>
                <i aria-hidden="true">{st[i] === 'ok' ? '✓' : st[i] === 'bad' ? '✕' : ''}</i>
                <div>{ruleText(P, r)}{detail(r, i) ? <small>{detail(r, i)}</small> : null}</div>
              </div>
            ))}
          </div>
          <div className="er-card">
            <div className="er-cardh">Timetable</div>
            <div className="er-row"><b><em>{clock(P.start)}</em> Leave Home</b><span /></div>
            {w.legs.map((l, i) => (
              <div key={i} className={`er-row${flagged.has(l.s) && !done ? ' late' : ''}`}><b><em>{clock(l.arrive)}</em> {P.stops[l.s].n}</b><span>{l.blocks} {l.blocks === 1 ? 'block' : 'blocks'}{l.wait ? ` · wait ${l.wait} min` : ''} · {P.stops[l.s].task}</span></div>
            ))}
            {s.route.length ? <div className="er-row"><b><em>{clock(w.home)}</em> Home</b><span>{full ? `${w.homeBlocks} ${w.homeBlocks === 1 ? 'block' : 'blocks'}` : 'if you turned for home now'}</span></div> : null}
          </div>
        </>
      )}

      {finale ? (
        <div className="er-fin" style={{ animationDelay: `${openAt(N)}ms` }} onClick={release} role="status" aria-label={`${rank.rows[rank.at].name}. ${behindLine(behind)}.`}>
          <div className="er-fin-in">
            <span dangerouslySetInnerHTML={html(CAR)} />
            {rank.rows.map((r, i) => (
              <div key={r.name} className={`er-rung${i < rank.at ? ' over' : i === rank.at ? ' me' : ''}`}
                style={i >= rank.at ? { animationDelay: `${climbAt(N) + (RUNG_H - 1 - i) * STEP}ms` } : undefined}>{r.name}</div>
            ))}
            <div className="er-fin-t" style={{ animationDelay: `${climbAt(N) + (RUNG_H - 1 - rank.at) * STEP + 250}ms` }}>{rank.rows[rank.at].name}</div>
            <div className="er-fin-s" style={{ animationDelay: `${climbAt(N) + (RUNG_H - 1 - rank.at) * STEP + 250}ms` }}>Home at {clock(w.home)} · {behindLine(behind).toLowerCase()}</div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

const GAME = {
  key: 'errands', name: 'Errands', cat: 'Logic', miss: 'minutes behind', missOne: 'minute behind',
  fresh: () => ({ route: [], home: false, mv: 0 }),
  validSave: (P, s) => !!s && Array.isArray(s.route) && typeof s.home === 'boolean' && Number.isInteger(s.mv)
    && s.route.length <= P.stops.length && new Set(s.route).size === s.route.length && s.route.every((i) => Number.isInteger(i) && i >= 0 && i < P.stops.length)
    && (!s.home || (s.route.length === P.stops.length && P.rules.every((r) => ruleState(P, s.route, r) === 'ok'))),
  touched: (s) => s.mv > 0,
  solved: (P, s) => s.home === true,
  count: (s) => (s.home ? s.behind || 0 : 0),
  result: (P, s, won) => ({ score: won ? 10 : 0, total: 10, correct: won ? 1 : 0, guessesUsed: won ? behindOf(P, s) : 0 }),
  metric: (P, s, won) => (won ? behindOf(P, s) : null),
  Board,
  wide: false,
  holdMs: (P, s, won) => { if (!won) return 1200; const r = rankOf(behindOf(P, s)), n = P.stops.length; return climbAt(n) + (RUNG_H - 1 - r.at) * STEP + 250 + 1500; },
  title: (P, s, won) => (won ? rankName(P, s) : endSolved(false)),
  eyebrow: (P, s, { sundayLabel }) => `${sundayLabel || `${BAND[P.band]} · ${P.day}`} · No. ${P.num}`,
  foot: (P, s) => `${s.route.length} of ${P.stops.length} stops${s.route.length === P.stops.length ? ` · home at ${clock(walk(P, s.route).home)}` : ''}`,
  frac: (P, s) => (s.home ? 1 : s.route.length / (P.stops.length + 1)),
  // the intro board falls on a Sunday and is not a Sunday Edition
  sundayLabel: (P) => (P.band === 'sunday' ? 'Sunday Edition · The Big Day' : null),
  gateTitle: (P) => `Today: ${P.day}, ${NUM[P.stops.length]} stops and home again`,
  gateLine: (P) => `Leave home at ${clock(P.start)}. Every block takes ${P.per} minutes and every stop ${P.stay}. Tap the stops in the order you will drive them, keep every rule, and be home as soon as you can.`,
  rules: (P) => ({
    lead: 'Pick the order of your stops, keep every rule, and get home as soon as you can.',
    steps: [
      <><b>Tap the stops</b> in the order you will drive them. The route draws itself along the streets and the timetable fills in under the map.</>,
      <>You leave home at {clock(P.start)}. Every <b>block</b> takes {P.per} minutes and every <b>stop</b> takes {P.stay}.</>,
      <>A shop that <b>shuts</b> has to be reached by its time. A shop that <b>opens</b> late can be reached early, but you wait at the door. Something that <b>spoils</b> has to be home in time, counted from when you leave the shop. One stop may have to come <b>before</b> another.</>,
      <>Each rule turns <b>green</b> when it is kept and <b>red</b> when it is broken. Trying an order costs nothing: tap the last stop again, or Undo, to take it off.</>,
      (P.closed || []).length
        ? <>A red cross marks a block <b>dug up for roadworks</b>. You drive round it, and the timetable counts the extra blocks.</>
        : <>When every stop is on the route and every rule is green, press <b>Drive Home</b>. That is the trip you are scored on.</>,
    ],
    knack: 'The shortest loop is rarely allowed. Find the stop the rules pin down hardest, place it first in your head, and fit the others round it.',
    footer: 'Finishing a trip that keeps every rule counts. The fewest minutes behind the soonest possible trip ranks first, then the clock, and the Errand Ladder names your rung.',
  }),
  pitch: (P) => `${P.stops.length} stops, ${P.rules.length} rules. How soon can you be home?`,
  shareLine: (P, s, won, el) => `Errands #${P.num} · ${won ? `${rankName(P, s)} · ${behindLine(behindOf(P, s)).toLowerCase()} · ${el}` : 'unfinished'}`,
  detail: (P, s, won, el) => (won ? `${behindLine(behindOf(P, s))} · ${el}` : `${s.route.length} of ${P.stops.length} stops · ${el}`),
  aboutTitle: 'About Errands',
  about: [
    'Errands is a free daily route-planning puzzle from Mind Loft. A small town of streets seen from above, a handful of stops and a short list of rules. Tap the stops in the order you will drive them, and the route, the timetable and every rule update as you go. The aim is to be back home as early as the day allows.',
    'There are four kinds of rule. A shop can shut, so you have to be there by a certain time. A shop can open late, so arriving early means waiting at the door. Something you buy can spoil, so it has to be home within so many minutes of leaving the shop. And one stop can have to come before another. Every block takes four minutes and every stop takes ten.',
    'Trying an order costs nothing, so the puzzle is in comparing them: the shortest loop round town usually breaks a rule, and the order that keeps them all often doubles back. Each board has one order that is soonest home, and you are scored on how many minutes behind it you finish.',
    'The town grows through the week: four stops on Monday, more stops and more rules by Thursday, blocks dug up for roadworks on Friday and Saturday, and on Sunday the big day of eight stops in the largest town. The Errand Ladder names your rung, from Back for the Milk up to Phileas Fogg.',
    <>More everyday puzzles: <a href="/seated" style={{ color: 'inherit', fontWeight: 800 }}>Seated</a>, <a href="/bag" style={{ color: 'inherit', fontWeight: 800 }}>Bag</a>, <a href="/chef" style={{ color: 'inherit', fontWeight: 800 }}>Chef</a>, <a href="/pack" style={{ color: 'inherit', fontWeight: 800 }}>Pack</a> and <a href="/mop" style={{ color: 'inherit', fontWeight: 800 }}>Mop</a>.</>,
  ],
};

export default function ErrandsClient(props) {
  return <SimpleDaily {...props} game={GAME} />;
}
