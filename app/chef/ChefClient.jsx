'use client';

// Chef: the daily kitchen puzzle (owner, 2026-11-13). Tickets print through a
// service; every dish needs its own station for a set number of minutes and
// the stations have limited room. The clock only moves when you tap Next
// Minute. Finished dishes wait on the pass; once every dish on a check has been
// fired the check turns into a tray, you put the waiting dishes on it, and the
// order goes out when the tray is full. A minute a table waits costs 1 and a
// minute a finished dish sits costs 2, so the whole order should finish
// together and leave hot.
//
// The model is lib/chef-engine.js (shared with the generator and the checker)
// and the drawings are lib/chef-art.js. Runs on app/SimpleDaily.jsx. Finishing
// the service is a solve; the penalty is the miss column, lower first, then the
// clock. The Kitchen Ladder names the rung the penalty earned against the
// board's stored best.
//
// NOTHING ON THE LINE CHANGES SIZE (owner): every equipment slot has the same
// three rows under its drawing whether it is free or cooking, the pass has a
// fixed height, and a ticket keeps every original line in place as a check and
// as a tray.

import React, { useState } from 'react';
import SimpleDaily from '../SimpleDaily';
import { endSolved } from '@/lib/end-verdict';
import { STATIONS, STATION_NAME, MENU, HOLD, SIT_WEIGHT, dishList, newState, cloneState, isOpen, canStart, start, unstart, hasTray, plate, tick, isDone, penalty, sitNow, waitNow, rankOf } from '@/lib/chef-engine';
import { ART, ICO, LAMP, PLATE, HAT, CHEF_LIGHT, CHEF_DARK, CHEF_ART_CSS } from '@/lib/chef-art';

const BAND = { intro: 'Intro', gentle: 'Gentle', moderate: 'Moderate', tough: 'Tough', sunday: 'Sunday Edition' };
const WHERE = { stove: 'On the stove', oven: 'In the oven', grill: 'On the grill', fryer: 'In the fryer', cold: 'On the board' };
const html = (s) => ({ __html: s });
const STEP = 150, OPEN = 900, CLIMB = 1350;

const CSS = `
.chef{align-self:center;width:100%;max-width:560px;display:flex;flex-direction:column;gap:10px;font-family:'Manrope',system-ui,sans-serif;font-weight:600;color:var(--ck-ink);line-height:1.35;
${CHEF_LIGHT}}
.stage-page[data-stage-theme='dark'] .chef{${CHEF_DARK}}
.chef button{font:inherit;color:inherit;cursor:pointer;background:none;border:0;padding:0;margin:0;}
${CHEF_ART_CSS}
.ck-on{--ck-ln:#141414;color:#141414;}
.ck-stat{display:flex;border:1px solid var(--ck-ink);border-radius:10px;overflow:hidden;background:var(--ck-bg);}
.ck-stat div{flex:1;padding:6px 4px;text-align:center;border-left:1px solid var(--ck-ink);}
.ck-stat div:first-child{border-left:0;}
.ck-stat b{display:block;font-size:17px;font-weight:800;line-height:1.3;}.ck-stat span{font-size:11px;color:var(--ck-mute);}
.ck-h{font-size:12px;letter-spacing:.04em;color:var(--ck-mute);margin:2px 0 -4px;font-weight:700;text-transform:uppercase;}
.ck-kitchen{border:1px solid var(--ck-ink);border-radius:10px;overflow:hidden;background:var(--ck-bg);}
.ck-pass{position:relative;border-bottom:1px solid var(--ck-ink);padding:0 10px;background:linear-gradient(var(--ck-grey2) 1px,transparent 1px) 0 0/100% 15px,linear-gradient(90deg,var(--ck-grey2) 1px,transparent 1px) 0 0/30px 100%,var(--ck-bg);}
.ck-lamps{display:flex;justify-content:space-around;height:30px;padding-left:76px;--ck-st:var(--ck-lamp);}
.ck-lamps svg{width:44px;height:30px;}
.ck-plates{display:flex;flex-wrap:wrap;gap:4px 10px;min-height:74px;align-items:flex-end;padding:2px 0 0;}
.chef button.ck-plate{display:block;border-radius:8px;width:56px;text-align:center;font-size:11px;line-height:1.2;padding:2px 0 5px;}
.chef button.ck-plate.can{box-shadow:inset 0 0 0 1px var(--ck-ink);background:var(--ck-bg);}
.ck-plate svg{width:40px;height:26px;display:block;margin:0 auto;--ck-ln:#141414;--ck-pb:var(--ck-tile);}
.ck-plate b{display:block;font-weight:800;font-size:12px;}
.ck-pips{display:flex;gap:3px;justify-content:center;margin-top:3px;}
.ck-pips i{width:7px;height:7px;border-radius:50%;border:1px solid var(--ck-ink);background:var(--ck-bg);}.ck-pips i.on{background:var(--ck-ink);}
.ck-none{font-size:12px;color:var(--ck-mute);padding:0 0 8px;align-self:center;}
.ck-shelf{height:5px;background:var(--ck-ink);margin:0 -10px;}
.ck-passlab{position:absolute;left:10px;top:6px;font-size:11px;font-weight:800;background:var(--ck-bg);padding:1px 5px;border:1px solid var(--ck-ink);border-radius:5px;}
.ck-line{display:flex;flex-wrap:wrap;}
.ck-stn{flex:var(--n) 1 calc(var(--n)*104px);border-right:1px solid var(--ck-ink);border-bottom:1px solid var(--ck-ink);margin:0 -1px -1px 0;min-width:0;}
.ck-lab{font-size:12px;font-weight:800;padding:5px 8px 0;display:flex;align-items:center;gap:5px;}
.ck-ico{width:14px;height:14px;flex:none;display:block;}
.ck-chip{display:inline-flex;background:var(--ck-st);border-radius:4px;padding:2px;flex:none;--ck-ln:#141414;}
.ck-units{display:flex;}
.chef .ck-unit{flex:1;min-width:0;padding:2px 6px 7px;text-align:center;display:block;font-size:11px;line-height:1.25;}
.ck-art{width:100%;max-width:120px;height:62px;display:block;margin:0 auto;}
.ck-unit.on .ck-art{--ck-ln:#141414;--ck-pb:var(--ck-tile);--ck-pg:var(--ck-tile2);}
.ck-unit.new .ck-art{outline:2px solid var(--ck-ink);outline-offset:-1px;border-radius:8px;}
.ck-nm{font-weight:800;font-size:13px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;padding-bottom:1px;}
.ck-nm.free{font-weight:600;color:var(--ck-mute);}
.ck-sub{color:var(--ck-mute);white-space:nowrap;}
.ck-trk{height:4px;background:var(--ck-grey2);border-radius:2px;margin:3px 6px 0;overflow:hidden;}.ck-trk i{display:block;height:100%;background:var(--ck-ink);}
.ck-floor{height:14px;background:repeating-conic-gradient(var(--ck-grey2) 0 25%,var(--ck-bg) 0 50%) 0 0/14px 14px;}
.ck-tix{display:grid;grid-template-columns:repeat(3,1fr);gap:16px 8px;padding-top:6px;}
@media (min-width:520px){.ck-tix{grid-template-columns:repeat(4,1fr);}}
.ck-tk{position:relative;border:1px solid var(--ck-ink);border-top:0;background:var(--ck-bg);padding:0 0 7px;box-shadow:2px 3px 0 var(--ck-grey2);}
.ck-tk::before{content:"";position:absolute;left:-5px;right:-5px;top:-6px;height:6px;background:var(--ck-ink);}
.ck-tk.tray{border-top:1px solid var(--ck-ink);border-radius:14px;background:var(--ck-grey2);box-shadow:inset 0 0 0 4px var(--ck-grey2),0 3px 0 var(--ck-ink);overflow:hidden;margin-top:-1px;}
.ck-tk.tray::before{display:none;}
.ck-th{display:flex;justify-content:space-between;align-items:baseline;padding:7px 7px 5px;font-size:12px;font-weight:800;border-bottom:1px solid var(--ck-ink);}
.ck-tk.tray .ck-th{border-bottom:0;}
.ck-th span{font-weight:600;color:var(--ck-mute);font-size:11px;}
.chef button.ck-dish{display:block;width:100%;border-radius:0;padding:6px 7px;border-top:1px solid var(--ck-grey2);font-size:11px;text-align:left;min-height:46px;line-height:1.25;}
.chef button.ck-dish:first-of-type{border-top:0;}
.chef .ck-tk.tray button.ck-dish{background:var(--ck-bg);margin:0 5px;width:calc(100% - 10px);}
.ck-d1{font-weight:800;font-size:13px;display:flex;align-items:center;gap:5px;}.ck-d2{color:var(--ck-mute);display:block;}
.chef button.ck-dish.cook{background:var(--ck-grey);}
.chef .ck-tk button.ck-dish.tray{background:var(--ck-st);color:#141414;}
.ck-dish.tray .ck-d2{color:#141414;}.ck-dish.tray .ck-chip{background:none;}
.ck-dish.wait .ck-d2,.ck-dish.cold .ck-d2{color:var(--ck-ink);font-weight:800;}
.chef button.ck-dish.wait.can{box-shadow:inset 0 0 0 2px var(--ck-ink);}
.ck-dish.blocked .ck-d1,.ck-dish.blocked .ck-d2{opacity:.5;}
.ck-empty{border:1px solid var(--ck-grey2);border-radius:10px;padding:18px;text-align:center;color:var(--ck-mute);font-size:13px;grid-column:1/-1;}
/* THE CLOCK STAYS IN REACH: the line and the rail together are taller than a phone, so the
   message and Next Minute ride the bottom of the screen while the board scrolls under them. */
.ck-bar{position:sticky;bottom:0;z-index:3;background:var(--pst-bg,var(--ck-bg));padding:6px 0 10px;margin-top:-4px;display:flex;flex-direction:column;gap:6px;}
.ck-msg{min-height:20px;font-size:13px;font-weight:700;text-align:center;}
.chef button.ck-next{display:block;width:100%;border:1px solid var(--ck-ink);border-radius:10px;padding:13px 14px;font-weight:800;font-size:15px;background:var(--ck-acc);color:#141414;text-align:center;}
.chef button.ck-next:disabled{opacity:.45;cursor:default;}
.ck-card{border:1px solid var(--ck-ink);border-radius:10px;background:var(--ck-bg);overflow:hidden;}
.ck-cardh{font-size:12px;color:var(--ck-mute);font-weight:700;letter-spacing:.04em;padding:10px 12px 6px;text-transform:uppercase;}
.ck-row{display:flex;justify-content:space-between;align-items:center;gap:10px;padding:7px 12px;font-size:14px;border-top:1px solid var(--ck-grey2);}
.ck-row b{font-weight:800;}.ck-row span{color:var(--ck-mute);font-size:12px;text-align:right;}
.ck-row.me{background:var(--ck-acc);color:#141414;}.ck-row.me span{color:#141414;font-weight:800;}
@keyframes ck-fl{0%,100%{background-color:transparent}45%{background-color:var(--ck-st)}}
.ck-kitchen.fin .ck-stn{animation:ck-fl .45s ease both;}
.ck-kitchen.fin .ck-stn:nth-child(2){animation-delay:.14s}.ck-kitchen.fin .ck-stn:nth-child(3){animation-delay:.28s}.ck-kitchen.fin .ck-stn:nth-child(4){animation-delay:.42s}.ck-kitchen.fin .ck-stn:nth-child(5){animation-delay:.56s}
.ck-kitchen.fin .ck-pass{--ck-st:var(--ck-lamp);animation:ck-fl .5s .72s ease both;}
.ck-fin{position:fixed;inset:0;z-index:60;background:var(--ck-acc);color:#141414;--ck-ln:#141414;--ck-pb:#ffffff;display:flex;align-items:center;justify-content:center;animation:ck-open .45s ${OPEN}ms ease-out backwards;}
@keyframes ck-open{from{clip-path:circle(0 at 50% 30%)}to{clip-path:circle(150% at 50% 30%)}}
.ck-fin-in{text-align:center;width:270px;}
.ck-hat{width:64px;height:56px;display:block;margin:0 auto 8px;}
.ck-rung{height:36px;line-height:34px;border:1px solid #141414;border-radius:10px;margin:6px 0;font-weight:800;font-size:15px;background:#ffffff;animation:ck-lit .12s backwards;}
.ck-rung.over{opacity:.3;background:transparent;animation:none;}
.ck-rung.me{background:#141414;color:#ffffff;transform:scale(1.07);animation:ck-earn .15s backwards;}
@keyframes ck-lit{from{opacity:.3;background:transparent}}
@keyframes ck-earn{from{opacity:.3;background:transparent;color:#141414;transform:none}}
.ck-fin-t{font-size:28px;font-weight:800;height:44px;line-height:44px;margin-top:10px;white-space:nowrap;animation:ck-rise .25s backwards;}
.ck-fin-s{font-size:15px;height:22px;animation:ck-rise .25s backwards;}
@keyframes ck-rise{from{opacity:0;transform:translateY(8px)}}
@media (prefers-reduced-motion: reduce){.ck-fin,.ck-fin *,.ck-kitchen.fin .ck-stn,.ck-kitchen.fin .ck-pass{animation:none !important;}}
`;

const pts = (n) => `${n} penalty ${n === 1 ? 'minute' : 'minutes'}`;
const dishCount = (P) => dishList(P).length;
const rankName = (P, s) => { const r = rankOf(P, penalty(s)); return r.rows[r.at].name; };

function Board({ P, s, setS, active, done, held, release }) {
  const L = dishList(P);
  const [note, setNote] = useState('');
  const live = active && !done;
  const won = done && isDone(s);
  const finale = won && held;
  const change = (fn) => setS((st) => { const n = cloneState(st); fn(n); return n; });

  const tap = (i) => {
    if (!live) return;
    const d = s.d[i], [nm, st] = MENU[L[i].k], ti = L[i].t;
    if (d.st === 'todo') {
      if (!canStart(P, s, i)) { setNote(`${STATION_NAME[st]} is full.`); return; }
      change((n) => start(P, n, i)); setNote(`${nm} fired. Tap it again to pull it before the clock moves.`);
    } else if (d.st === 'cook') {
      if (d.at !== s.m) { setNote('Already cooking. It cannot come off now.'); return; }
      change((n) => unstart(P, n, i)); setNote(`${nm} pulled.`);
    } else if (d.st === 'pass') {
      if (!hasTray(P, s, ti)) { setNote(`Ticket ${ti + 1} still has dishes on the check. The tray comes once the check is empty.`); return; }
      const probe = cloneState(s), r = plate(P, probe, i);
      change((n) => plate(P, n, i)); setNote(r === 'out' ? `Ticket ${ti + 1} out.` : `${nm} on the tray.`);
    } else if (d.st === 'tray') setNote('On the tray, waiting for the rest.');
  };
  const next = () => {
    if (!live) return;
    const probe = cloneState(s), ev = tick(P, probe), say = [];
    if (ev.ready.length) say.push(`${ev.ready.map((i) => MENU[L[i].k][0]).join(', ')} ready on the pass.`);
    if (ev.cold.length) say.push(`${ev.cold.map((i) => MENU[L[i].k][0]).join(', ')} went cold.`);
    if (ev.printed.length) say.push(`New ticket ${ev.printed.map((i) => i + 1).join(', ')}.`);
    change((n) => tick(P, n)); setNote(say.join(' '));
  };

  const pass = []; L.forEach((x, i) => { if (s.d[i].st === 'pass') pass.push(i); });
  const open = P.tickets.map((t, i) => i).filter((i) => isOpen(P, s, i));
  const outN = s.t.filter((t) => t.out >= 0).length;
  const rank = won ? rankOf(P, penalty(s)) : null;

  return (
    <div className="chef">
      <style dangerouslySetInnerHTML={html(CSS)} />
      <div className="ck-stat" aria-label="Service so far">
        <div><b>{s.m}</b><span>Minute</span></div>
        <div><b>{waitNow(P, s)}</b><span>Table Wait</span></div>
        <div><b>{sitNow(s)}</b><span>Food Sat</span></div>
        <div><b>{outN}/{P.tickets.length}</b><span>Out</span></div>
      </div>
      <div className="ck-h">The Kitchen</div>
      <div className={`ck-kitchen${finale ? ' fin' : ''}`}>
        <div className="ck-pass">
          <span className="ck-passlab">The Pass</span>
          <div className="ck-lamps" dangerouslySetInnerHTML={html(LAMP(pass.length > 0).repeat(3))} />
          <div className="ck-plates">
            {pass.length ? pass.map((i) => {
              const [nm, st] = MENU[L[i].k], left = HOLD - s.d[i].age;
              return (
                <button key={i} type="button" data-d={i} className={`ck-plate${hasTray(P, s, L[i].t) ? ' can' : ''}`} style={{ '--ck-st': `var(--ck-${st})` }} onClick={() => tap(i)}
                  aria-label={`${nm}, ticket ${L[i].t + 1}, keeps ${left} more ${left === 1 ? 'minute' : 'minutes'}`}>
                  <span dangerouslySetInnerHTML={html(PLATE)} /><b>{nm}</b>Ticket {L[i].t + 1}
                  <span className="ck-pips">{[0, 1].map((k) => <i key={k} className={k < left ? 'on' : ''} />)}</span>
                </button>
              );
            }) : <span className="ck-none">Nothing under the lamps.</span>}
          </div>
          <div className="ck-shelf" />
        </div>
        <div className="ck-line">
          {STATIONS.map(([st, nm]) => {
            const cook = []; L.forEach((x, i) => { if (s.d[i].st === 'cook' && MENU[x.k][1] === st) cook.push(i); });
            const units = [];
            for (let u = 0; u < P.caps[st]; u++) {
              const i = cook[u];
              if (i === undefined) units.push(<div key={u} className="ck-unit"><span dangerouslySetInnerHTML={html(ART[st](false))} /><div className="ck-nm free">Free</div><div className="ck-sub">&nbsp;</div><div className="ck-trk" /></div>);
              else {
                const d = s.d[i], tot = MENU[L[i].k][2];
                units.push(
                  <button key={u} type="button" className={`ck-unit on${d.at === s.m ? ' new' : ''}`} onClick={() => tap(i)}>
                    <span dangerouslySetInnerHTML={html(ART[st](true))} /><div className="ck-nm">{MENU[L[i].k][0]}</div>
                    <div className="ck-sub">Ticket {L[i].t + 1} &middot; {d.rem} min</div><div className="ck-trk"><i style={{ width: `${Math.round((100 * (tot - d.rem)) / tot)}%` }} /></div>
                  </button>);
              }
            }
            return (
              <div key={st} className="ck-stn" style={{ '--n': P.caps[st], '--ck-st': `var(--ck-${st})` }}>
                <div className="ck-lab"><span className="ck-chip" dangerouslySetInnerHTML={html(ICO[st])} />{nm}</div>
                <div className="ck-units">{units}</div>
              </div>);
          })}
        </div>
        <div className="ck-floor" />
      </div>

      {won && !held ? (
        <>
          <div className="ck-card">
            <div className="ck-cardh">Kitchen Ladder</div>
            {rank.rows.map((r, i) => <div key={r.name} className={`ck-row${i === rank.at ? ' me' : ''}`}><b>{r.name}</b><span>{i === rank.at ? 'You · ' : ''}{r.label}</span></div>)}
          </div>
          <div className="ck-card">
            <div className="ck-cardh">The Service</div>
            <div className="ck-row"><b>Penalty</b><span>{penalty(s)} ({s.wait} wait + {SIT_WEIGHT} x {s.sit} sat)</span></div>
            {P.tickets.map((t, i) => <div key={i} className="ck-row"><b>Ticket {i + 1}</b><span>{s.t[i].out - t.at} min wait &middot; {s.t[i].sat ? `sat ${s.t[i].sat}` : 'hot'}</span></div>)}
          </div>
        </>
      ) : (
        <>
          <div className="ck-h">Ticket Rail</div>
          <div className="ck-tix">
            {open.length ? open.map((ti) => {
              const tray = hasTray(P, s, ti);
              return (
                <div key={ti} className={`ck-tk${tray ? ' tray' : ''}`}>
                  <div className="ck-th">{tray ? 'Tray' : 'Check'} {ti + 1}<span>{s.m - P.tickets[ti].at} min</span></div>
                  {L.map((x, i) => {
                    if (x.t !== ti) return null;
                    const d = s.d[i], [nm, st, tm] = MENU[x.k];
                    let c = '', r = '';
                    if (d.st === 'todo') { r = `${d.cold ? 'Cold. Recook. ' : ''}${STATION_NAME[st]} ${tm} min`; c = `${d.cold ? 'cold ' : ''}${canStart(P, s, i) ? '' : 'blocked'}`; }
                    else if (d.st === 'cook') { r = `${WHERE[st]}, ${d.rem} min`; c = 'cook'; }
                    else if (d.st === 'pass') { r = tray ? 'Ready. Tap to tray' : 'Ready, waiting'; c = `wait${tray ? ' can' : ''}`; }
                    else { r = 'On the tray'; c = 'tray'; }
                    return (
                      <button key={i} type="button" data-d={i} className={`ck-dish ${c}`} style={{ '--ck-st': `var(--ck-${st})` }} onClick={() => tap(i)}>
                        <span className="ck-d1"><span className="ck-chip" dangerouslySetInnerHTML={html(ICO[st])} />{nm}</span><span className="ck-d2">{r}</span>
                      </button>);
                  })}
                </div>);
            }) : <div className="ck-empty">{done ? 'Service is over.' : 'The rail is empty. Run the clock for the next ticket.'}</div>}
          </div>
        </>
      )}
      {done ? null : (
        <div className="ck-bar">
          <div className="ck-msg" aria-live="polite">{live ? note : ''}</div>
          <button type="button" className="ck-next" onClick={next} disabled={!live}>Next Minute</button>
        </div>
      )}

      {finale ? (
        <div className="ck-fin" onClick={release} role="status" aria-label={`${rank.rows[rank.at].name}. ${pts(penalty(s))}.`}>
          <div className="ck-fin-in">
            <span dangerouslySetInnerHTML={html(HAT)} />
            {rank.rows.map((r, i) => (
              <div key={r.name} className={`ck-rung${i < rank.at ? ' over' : i === rank.at ? ' me' : ''}`}
                style={i >= rank.at ? { animationDelay: `${CLIMB + (rank.rows.length - 1 - i) * STEP}ms` } : undefined}>{r.name}</div>
            ))}
            <div className="ck-fin-t" style={{ animationDelay: `${CLIMB + (rank.rows.length - 1 - rank.at) * STEP + 250}ms` }}>{rank.rows[rank.at].name}</div>
            <div className="ck-fin-s" style={{ animationDelay: `${CLIMB + (rank.rows.length - 1 - rank.at) * STEP + 250}ms` }}>{pts(penalty(s))}</div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

const line = (P) => (P.caps.oven > 1 ? 'the big line: three burners, two ovens, two grills, two fryers and the cold board' : 'two burners, one oven, one grill, one fryer and the cold board');

const GAME = {
  key: 'chef', name: 'Chef', cat: 'Logic', miss: 'penalty minutes', missOne: 'penalty minute',
  fresh: (P) => newState(P),
  validSave: (P, s) => !!s && Array.isArray(s.d) && s.d.length === dishCount(P) && Array.isArray(s.t) && s.t.length === P.tickets.length && Number.isInteger(s.m),
  touched: (s) => s.m > 0 || s.d.some((d) => d.st !== 'todo'),
  solved: (P, s) => isDone(s),
  count: (s) => penalty(s),
  result: (P, s, won) => ({ score: won ? 10 : 0, total: 10, correct: won ? 1 : 0, guessesUsed: penalty(s) }),
  metric: (P, s, won) => (won ? penalty(s) : null),
  Board,
  wide: false,
  holdMs: (P, s, won) => { if (!won) return 1200; const r = rankOf(P, penalty(s)); return CLIMB + (r.rows.length - 1 - r.at) * STEP + 250 + 1500; },
  title: (P, s, won) => (won ? rankName(P, s) : endSolved(false)),
  eyebrow: (P, s, { sundayLabel }) => `${sundayLabel || `${BAND[P.band]} · ${P.service}`} · No. ${P.num}`,
  foot: (P, s) => `Minute ${s.m} · ${s.t.filter((t) => t.out >= 0).length} of ${P.tickets.length} orders out`,
  frac: (P, s) => s.t.filter((t) => t.out >= 0).length / P.tickets.length,
  sundayLabel: () => 'Sunday Edition · Brunch Rush',
  gateTitle: (P) => `Today: ${P.service}, ${P.tickets.length} tickets and ${dishCount(P)} dishes`,
  gateLine: (P) => `Run the kitchen one minute at a time on ${line(P)}. Fire each dish so a whole order finishes together and goes out hot.`,
  rules: (P) => ({
    lead: 'Get every order out together, and hot.',
    steps: [
      <><b>Tap a dish</b> on a check to fire it. Every dish needs its own station for a set number of minutes, and a station only has so many slots. A dish fired this minute can be tapped again to pull it back.</>,
      <><b>Next Minute</b> runs the clock. Nothing moves until you tap it, and new tickets print as the service goes on.</>,
      <>A finished dish waits on <b>the pass</b>. Once every dish on a check has been fired, the check becomes a <b>tray</b>: tap a waiting dish to put it on its tray. The order goes out when the tray holds every dish.</>,
      <>Every minute a table waits costs <b>1</b>. Every minute a finished dish sits costs <b>{SIT_WEIGHT}</b>, and after {HOLD} minutes it goes cold and has to be cooked again.</>,
      <>Today&rsquo;s line is {line(P)}.</>,
    ],
    knack: 'Work back from the slowest dish on the ticket. Fire it first, then start each quicker dish late enough that everything lands in the same minute.',
    footer: 'Finishing the service counts. The fewest penalty minutes ranks first, then the clock, and the Kitchen Ladder names your rung against the best service found for the day.',
  }),
  pitch: (P) => `${P.tickets.length} tickets and ${dishCount(P)} dishes. Get every order out together and hot.`,
  shareLine: (P, s, won, el) => `Chef #${P.num} · ${won ? `${rankName(P, s)} · ${pts(penalty(s))} · ${el}` : 'unfinished'}`,
  detail: (P, s, won, el) => (won ? `${pts(penalty(s))} · ${el}` : `${s.t.filter((t) => t.out >= 0).length} of ${P.tickets.length} orders out · ${el}`),
  aboutTitle: 'About Chef',
  about: [
    'Chef is a free daily kitchen puzzle from Mind Loft. Tickets print through a service, and every dish on them needs its own station for a set number of minutes: a burner, the oven, the grill, the fryer or the cold board. The stations only have so much room, and the clock moves one minute at a time, when you say so.',
    'An order only leaves when every dish on it is ready. Finished dishes wait on the pass, the check turns into a tray once everything on it has been fired, and you put the dishes on the tray yourself. A minute a table waits costs one penalty minute and a minute a finished dish sits costs two, so the best service times each dish to land with the rest of its ticket.',
    'The services grow through the week: a short lunch on Monday and Tuesday, a dinner service midweek, a Friday and Saturday night rush, and a Sunday Edition brunch on a bigger line. The same tickets print for everyone, and you do not see a ticket until it prints.',
    'At the end the Kitchen Ladder names your rung, from Dishwasher up through Line Cook and Sous Chef to the great names of the kitchen, measured against the best service found for that day.',
    <>More planning puzzles: <a href="/mop" style={{ color: 'inherit', fontWeight: 800 }}>Mop</a>, <a href="/connect" style={{ color: 'inherit', fontWeight: 800 }}>Connect</a> and <a href="/defuse" style={{ color: 'inherit', fontWeight: 800 }}>Defuse</a>.</>,
  ],
};

export default function ChefClient(props) {
  return <SimpleDaily {...props} game={GAME} />;
}
