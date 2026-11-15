'use client';

// Seated: the daily seating-chart puzzle (owner, 2026-11-14: a "practical
// puzzle" beside Mop, Chef and Pack; "Seated - it's great"). A room of round
// tables, a list of guests and a list of requests: these two are not speaking,
// those two came together, Grandma needs the table by the door. Tap a guest,
// tap a chair. Every guest gets a chair and every request has to be met.
//
// The model is lib/seated-engine.js (shared with the generator and the checker).
// Runs on app/SimpleDaily.jsx. Seating the room is the solve; re-seats (a guest
// who already had a chair is moved, swapped or stood back up) are the miss
// column, lower first, then the clock. The Seating Ladder names the rung the
// re-seats earned. ANY seating that meets every request solves the board; the
// stored one never reaches the browser.
//
// THE BOARD NEVER MOVES AT THE FINISH (owner rule): the ending beat is on the
// chairs already there (each guest pops in turn, table by table, and the tables
// take the category colour), and only then does the full-screen fill open with
// the ladder climb, the same shape as Chef's and Pack's.

import React, { useState } from 'react';
import SimpleDaily from '../SimpleDaily';
import { endSolved } from '@/lib/end-verdict';
import { seatOf, ruleState, seatedCount, tagOf, rankOf } from '@/lib/seated-engine';
// the guests are Sudoclue's cast, with the same drawn portraits (owner, 2026-11-15: "re use the names we have
// from sudoclue ... and use the same images ... people images")
import { CAST, portrait } from '@/lib/sudoclue-art';

const BAND = { intro: 'Intro', gentle: 'Gentle', moderate: 'Moderate', tough: 'Tough', sunday: 'Sunday Edition' };
const STEP = 140, RUNG_H = 8;
const lightStep = (n) => Math.min(110, 1300 / n);
const openAt = (n) => 150 + n * lightStep(n) + 650;      // the fill opens once every guest has had their moment
const climbAt = (n) => openAt(n) + 650;
const html = (s) => ({ __html: s });
const NUM = ['no', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight'];
const roomLine = (P) => {
  const T = P.tables.length, n = P.tables[0].seats;
  return T === 1 ? `One table of ${NUM[n]}` : `${NUM[T][0].toUpperCase()}${NUM[T].slice(1)} tables of ${NUM[n]}`;
};
// two glasses meeting over a round table
const GLASS = '<svg class="st-ico" viewBox="0 0 120 48" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round" stroke-linecap="round" aria-hidden="true"><path d="M38 6l14 3-3 13a7.5 7.5 0 01-14.6-3.2zM41 29.5l-3 12M31 39l14 3.2"/><path d="M82 6L68 9l3 13a7.5 7.5 0 0014.6-3.2zM79 29.5l3 12M89 39l-14 3.2"/><path d="M60 2v5M53 4l2 4M67 4l-2 4"/></svg>';

const CSS = `
.seated{align-self:center;width:100%;max-width:560px;display:flex;flex-direction:column;gap:10px;font-family:'Manrope',system-ui,sans-serif;font-weight:600;color:var(--st-ink);line-height:1.4;
--st-bg:#ffffff;--st-ink:#141414;--st-mute:#6b6b6b;--st-grey:#f1f1ef;--st-grey2:#e3e3df;--st-ok:#bfe6c8;--st-bad:#f3b0b0;--st-sat:64%;--st-lit:83%;--st-acc:var(--pst-acc,#fecdd3);--st-on:var(--pst-on-acc,#141414);}
.stage-page[data-stage-theme='dark'] .seated,.pst.dk .seated{--st-bg:#161616;--st-ink:#f2f2ee;--st-mute:#a3a39d;--st-grey:#232323;--st-grey2:#333333;--st-ok:#3f7a52;--st-bad:#9c5050;--st-sat:42%;--st-lit:66%;}
.seated button{font:inherit;color:inherit;cursor:pointer;background:none;border:0;padding:0;margin:0;}
.st-stat{display:flex;border:1px solid var(--st-ink);border-radius:10px;overflow:hidden;background:var(--st-bg);}
.st-stat div{flex:1;padding:6px 4px;text-align:center;border-left:1px solid var(--st-ink);}
.st-stat div:first-child{border-left:0;}
.st-stat b{display:block;font-size:17px;font-weight:800;line-height:1.3;}.st-stat span{font-size:11px;color:var(--st-mute);}
/* the event line, the headings and the message sit straight on the stage, so they take the stage's ink */
.st-ev{display:flex;align-items:center;gap:12px;color:var(--pst-ink,var(--st-ink));}
.st-ico{width:84px;height:34px;flex:none;display:block;}
.st-ev b{display:block;font-size:15px;font-weight:800;line-height:1.3;}.st-ev span{font-size:12px;color:var(--pst-mute,var(--st-mute));}
.st-board{border:1px solid var(--st-ink);border-radius:10px;background:var(--st-bg);padding:6px;}
.st-board svg{display:block;width:100%;height:auto;touch-action:manipulation;-webkit-user-select:none;user-select:none;}
.st-board text{font-family:'Manrope',system-ui,sans-serif;pointer-events:none;}
.st-top{fill:#fffdf6;stroke:#141414;}
.st-hem{fill:none;stroke:#e3ddcb;}
.st-plate{fill:#ffffff;stroke:#b9b4a6;stroke-width:.8;}.st-plate.in{fill:none;stroke:#dedacd;}
.st-cut{stroke:#b9b4a6;stroke-width:1.2;stroke-linecap:round;fill:none;}
.st-chair{cursor:pointer;}
.st-seat{fill:#e2b77f;stroke:#141414;}.st-back{fill:#b9844a;stroke:#141414;}
.st-chair.open .st-seat{fill:var(--st-acc);}
.st-face{fill:hsl(var(--h) var(--st-sat) var(--st-lit));}
.st-ini{font-weight:800;fill:#141414;dominant-baseline:middle;}
.st-ring{fill:none;stroke:#141414;}
.st-chair.sel .st-ring{stroke:var(--st-ink);stroke-width:3.5;}
.st-tag{fill:#ffffff;stroke:#141414;stroke-width:.9;}
.st-chair.sel .st-tag{fill:#141414;}.st-chair.sel .st-tagt{fill:#ffffff;}
.st-tagt{font-weight:800;fill:#141414;}
.st-pt{width:24px;height:24px;border-radius:999px;overflow:hidden;border:1px solid #141414;flex:none;display:block;background:#fff;}
.st-flag{fill:var(--st-bad);stroke:var(--st-ink);}
.st-h{font-size:12px;letter-spacing:.04em;color:var(--pst-mute,var(--st-mute));margin:2px 0 -4px;font-weight:700;text-transform:uppercase;}
.st-bar{position:sticky;bottom:0;z-index:3;background:var(--pst-bg,var(--st-bg));padding:2px 0 2px;margin:-4px 0;}
.st-msg{min-height:30px;font-size:13px;font-weight:700;text-align:center;color:var(--pst-ink,var(--st-ink));display:flex;align-items:center;justify-content:center;}
.st-tray{display:flex;flex-wrap:wrap;gap:6px;min-height:44px;}
.seated button.st-chip{display:inline-flex;align-items:center;gap:6px;border:1px solid var(--st-ink);border-radius:999px;padding:6px 12px 6px 6px;font-weight:800;font-size:14px;line-height:1.3;color:#141414;background:hsl(var(--h) var(--st-sat) var(--st-lit));}
.seated button.st-chip.sel{background:var(--st-ink);color:var(--st-bg);}
.st-none{font-size:13px;color:var(--pst-mute,var(--st-mute));align-self:center;}
.st-card{border:1px solid var(--st-ink);border-radius:10px;background:var(--st-bg);overflow:hidden;}
.st-cardh{font-size:12px;color:var(--st-mute);font-weight:700;letter-spacing:.04em;padding:10px 12px 6px;text-transform:uppercase;}
.st-req{display:flex;gap:10px;align-items:flex-start;padding:8px 12px;font-size:14px;border-top:1px solid var(--st-grey2);text-align:left;width:100%;}
.st-req:first-child{border-top:0;}
.st-req i{font-style:normal;flex:none;width:22px;height:22px;border-radius:999px;border:1px solid var(--st-ink);display:flex;align-items:center;justify-content:center;font-size:12px;font-weight:800;line-height:1;margin-top:1px;}
.st-req.ok i{background:var(--st-ok);}.st-req.bad i{background:var(--st-bad);}
.st-req b{font-weight:800;}
.st-req.mine{background:var(--st-grey);}
.seated button.st-btn{border:1px solid var(--st-ink);border-radius:10px;padding:9px 4px;font-weight:800;font-size:14px;background:var(--st-bg);text-align:center;line-height:1.3;width:100%;}
.seated button.st-btn:disabled{opacity:.45;cursor:default;}
.st-row{display:flex;justify-content:space-between;align-items:center;gap:10px;padding:7px 12px;font-size:14px;border-top:1px solid var(--st-grey2);}
.st-row b{font-weight:800;}.st-row span{color:var(--st-mute);font-size:12px;text-align:right;}
.st-row.me{background:var(--st-acc);color:var(--st-on);}.st-row.me span{color:var(--st-on);font-weight:800;}
/* the ending beat on the board: each guest pops in turn and the tables take the colour */
.st-fin-on .st-chair{transform-box:fill-box;transform-origin:center;animation:st-pop .32s ease-out backwards;}
.st-fin-on .st-top{animation:st-fill .3s ease-out both;}
@keyframes st-pop{0%{transform:scale(1)}45%{transform:scale(1.22)}100%{transform:scale(1)}}
@keyframes st-fill{to{fill:var(--st-acc)}}
.stage-page[data-stage-theme='dark'] .seated .st-chair.sel .st-ring,.pst.dk .seated .st-chair.sel .st-ring{stroke:#ffffff;}
.st-fin{position:fixed;inset:0;z-index:60;background:var(--st-acc);color:#141414;display:flex;align-items:center;justify-content:center;animation:st-open .5s ease-out backwards;}
@keyframes st-open{from{clip-path:circle(0 at 50% 36%)}to{clip-path:circle(150% at 50% 36%)}}
.st-fin-in{text-align:center;width:280px;}
.st-fin .st-ico{width:120px;height:48px;margin:0 auto 6px;}
.st-rung{height:36px;line-height:34px;border:1px solid #141414;border-radius:10px;margin:6px 0;font-weight:800;font-size:15px;background:#ffffff;white-space:nowrap;animation:st-lit .12s backwards;}
.st-rung.over{opacity:.3;background:transparent;animation:none;}
.st-rung.me{background:#141414;color:#ffffff;transform:scale(1.07);animation:st-earn .15s backwards;}
@keyframes st-lit{from{opacity:.3;background:transparent}}
@keyframes st-earn{from{opacity:.3;background:transparent;color:#141414;transform:none}}
.st-fin-t{font-size:26px;font-weight:800;height:44px;line-height:44px;margin-top:10px;white-space:nowrap;animation:st-rise .25s backwards;}
.st-fin-s{font-size:15px;height:22px;animation:st-rise .25s backwards;}
@keyframes st-rise{from{opacity:0;transform:translateY(8px)}}
@media (prefers-reduced-motion: reduce){.st-fin,.st-fin *,.st-fin-on *{animation:none !important;}.st-fin-on .st-top{fill:var(--st-acc);}}
`;

const rs = (n) => `${n} ${n === 1 ? 're-seat' : 're-seats'}`;
const rankName = (P, s) => { const r = rankOf(P, s.rs); return r.rows[r.at].name; };

// Where each table stands on a 340-wide sheet: one big table alone, otherwise
// two to a row with an odd last one centred.
function layout(P) {
  const T = P.tables.length;
  if (T === 1) return { h: 262, tabs: [{ cx: 170, cy: 131, top: 58, orbit: 96, r: 26 }] };
  const rows = Math.ceil(T / 2), tabs = [];
  for (let i = 0; i < T; i++) {
    const row = Math.floor(i / 2), lone = i === T - 1 && T % 2 === 1;
    tabs.push({ cx: lone ? 170 : 86 + (i % 2) * 168, cy: 86 + row * 172, top: 36, orbit: 59, r: 20 });
  }
  return { h: rows * 172, tabs };
}

// What one request asks of one of its guests, short enough for the bar under the board.
function ask(P, r, g) {
  const o = r.b == null ? null : P.guests[r.a === g ? r.b : r.a].n;
  if (r.t === 'next') return `beside ${o}`;
  if (r.t === 'notnext') return `not beside ${o}`;
  if (r.t === 'across') return `across from ${o}`;
  if (r.t === 'same') return `same table as ${o}`;
  if (r.t === 'apart') return `not at ${o}'s table`;
  return r.t === 'table' ? `at ${P.tables[r.table].name}` : `not at ${P.tables[r.table].name}`;
}

function Board({ P, s, setS, active, done, held, release }) {
  const N = P.guests.length, T = P.tables.length;
  const [sel, setSel] = useState(null);
  const [note, setNote] = useState('');
  const live = active && !done;
  const seat = s.seat;
  const st = P.rules.map((r) => ruleState(seat, r));
  const met = st.filter((x) => x === 'ok').length, broken = st.filter((x) => x === 'bad').length;
  const placed = seatedCount(seat);
  const won = done && placed === N && broken === 0 && met === P.rules.length;
  const finale = won && held;
  const L = layout(P);
  const cid = `st${P.num}`;
  const flagged = new Set();
  P.rules.forEach((r, i) => { if (st[i] === 'bad') { flagged.add(r.a); if (r.b != null) flagged.add(r.b); } });
  const mine = (g) => P.rules.filter((r) => r.a === g || r.b === g);
  const brief = (g) => { const m = mine(g); return m.length ? `${P.guests[g].n}: ${m.map((r) => ask(P, r, g)).join(' · ')}` : `${P.guests[g].n} has no requests. Any chair will do.`; };

  const after = (next, moved) => {
    const nb = P.rules.filter((r) => ruleState(next, r) === 'bad').length, full = seatedCount(next) === N;
    setNote(nb ? (full ? `Everyone has a chair, but ${nb === 1 ? 'a request is' : `${nb} requests are`} broken.` : nb === 1 ? 'A request is broken.' : `${nb} requests are broken.`) : moved ? 'That is a re-seat.' : '');
  };
  const pickGuest = (g) => {
    if (!live) return;
    if (sel === g) { setSel(null); setNote(''); return; }
    setSel(g); setNote(brief(g));
  };
  const tapSeat = (t, i) => {
    if (finale) { release(); return; }
    if (!live) return;
    const here = seat[t][i];
    if (sel == null) { if (here != null) { setSel(here); setNote(brief(here)); } else setNote('Tap a guest first.'); return; }
    const from = seatOf(seat, sel), next = seat.map((x) => x.slice());
    if (here === sel) { next[t][i] = null; setSel(null); setS({ ...s, seat: next, rs: s.rs + 1 }); after(next, true); return; }
    if (from) next[from[0]][from[1]] = here; // a swap, or a move into an empty chair
    next[t][i] = sel;
    const moved = !!from || here != null;
    setSel(null); setS({ ...s, seat: next, rs: s.rs + (moved ? 1 : 0), mv: s.mv + 1 }); after(next, moved);
  };
  const clear = () => {
    if (!live || !placed) return;
    setSel(null); setNote('Everyone is standing again.');
    setS({ ...s, seat: P.tables.map((t) => new Array(t.seats).fill(null)), rs: s.rs + placed });
  };

  const rank = won ? rankOf(P, s.rs) : null;
  const step = lightStep(N);
  let k = 0;
  const svg = (
    <svg viewBox={`0 0 340 ${L.h}`} className={finale ? 'st-fin-on' : undefined} role="img" aria-label={`${roomLine(P)}, ${placed} of ${N} guests seated`}>
      <defs><clipPath id={`${cid}-p`}><circle cx={50} cy={50} r={50} /></clipPath></defs>
      {P.tables.map((tb, t) => {
        const g = L.tabs[t], first = k;
        const chairs = seat[t].map((id, i) => {
          const a = -Math.PI / 2 + (i * 2 * Math.PI) / tb.seats, x = g.cx + Math.cos(a) * g.orbit, y = g.cy + Math.sin(a) * g.orbit, n = k++, r = g.r;
          const who = id != null ? P.guests[id] : null, art = who && CAST[who.n] ? portrait(who.n) : null, rp = r * 0.9;
          const cls = `st-chair${id != null ? ' has' : ''}${live && id != null && id === sel ? ' sel' : ''}${live && id == null && sel != null ? ' open' : ''}`;
          const tagW = who ? who.n.length * (T === 1 ? 5.6 : 4.9) + 9 : 0, tagH = T === 1 ? 13 : 11.5, tagY = y + rp * 0.62;
          return (
            <g key={i} data-seat={`${t},${i}`} className={cls} onClick={() => tapSeat(t, i)}
              style={{ '--h': who ? who.hue : 0, ...(finale ? { animationDelay: `${150 + n * step}ms` } : null) }}>
              {/* the chair, turned to face the table: a seat and a curved back on the far side */}
              <g transform={`translate(${x} ${y}) rotate(${(a * 180) / Math.PI + 90})`}>
                <rect className="st-back" x={-r * 0.92} y={-r * 1.04} width={r * 1.84} height={r * 0.5} rx={r * 0.22} />
                <rect className="st-seat" x={-r * 0.8} y={-r * 0.74} width={r * 1.6} height={r * 1.5} rx={r * 0.3} />
              </g>
              {who ? (
                <>
                  {art
                    ? <g transform={`translate(${x - rp} ${y - rp}) scale(${(rp * 2) / 100})`} clipPath={`url(#${cid}-p)`} dangerouslySetInnerHTML={html(art)} />
                    : <><circle className="st-face" cx={x} cy={y} r={rp} /><text className="st-ini" x={x} y={y + rp * 0.1} textAnchor="middle" fontSize={rp * 0.95}>{who.n[0]}</text></>}
                  <circle className="st-ring" cx={x} cy={y} r={rp} />
                  <rect className="st-tag" x={x - tagW / 2} y={tagY} width={tagW} height={tagH} rx={tagH / 2} />
                  <text className="st-tagt" x={x} y={tagY + tagH * 0.74} textAnchor="middle" fontSize={T === 1 ? 9.6 : 8.4}>{who.n}</text>
                </>
              ) : null}
              {id != null && flagged.has(id) && !done ? <circle className="st-flag" cx={x + rp * 0.74} cy={y - rp * 0.74} r={5} /> : null}
            </g>);
        });
        // a place setting in front of every chair: a plate, and on the big table a fork and a knife
        const settings = seat[t].map((_, i) => {
          const a = -Math.PI / 2 + (i * 2 * Math.PI) / tb.seats, pr = g.top - (T === 1 ? 13 : 8.5), x = g.cx + Math.cos(a) * pr, y = g.cy + Math.sin(a) * pr, q = T === 1 ? 7 : 4.4;
          return (
            <g key={`p${i}`} transform={`translate(${x} ${y}) rotate(${(a * 180) / Math.PI + 90})`}>
              <circle className="st-plate" r={q} /><circle className="st-plate in" r={q * 0.58} />
              {T === 1 ? <path className="st-cut" d={`M${-q - 3.5} ${-q * 0.8}v${q * 1.6}M${q + 3.5} ${-q * 0.8}v${q * 1.6}`} /> : null}
            </g>);
        });
        return (
          <g key={t}>
            <circle className="st-top" cx={g.cx} cy={g.cy} r={g.top} style={finale ? { animationDelay: `${150 + (first + tb.seats) * step}ms` } : undefined} />
            <circle className="st-hem" cx={g.cx} cy={g.cy} r={g.top - (T === 1 ? 4 : 2.6)} />
            {settings}
            <text x={g.cx} y={g.cy - (T === 1 ? 2 : 2)} textAnchor="middle" fontSize={T === 1 ? 14 : 10.5} fontWeight="800" fill="#141414">{tb.name}</text>
            <text x={g.cx} y={g.cy + (T === 1 ? 14 : 8.5)} textAnchor="middle" fontSize={T === 1 ? 10.5 : 7.4} fontWeight="700" fill="#6b6b6b">{tb.note}</text>
            {chairs}
          </g>);
      })}
    </svg>
  );
  const standing = P.guests.map((_, i) => i).filter((i) => !seatOf(seat, i));

  return (
    <div className="seated">
      <style dangerouslySetInnerHTML={html(CSS)} />
      <div className="st-stat" aria-label="The room so far">
        <div><b>{placed}/{N}</b><span>Seated</span></div>
        <div><b>{met}/{P.rules.length}</b><span>Requests Met</span></div>
        <div><b>{s.rs}</b><span>Re-seats</span></div>
      </div>
      <div className="st-ev">
        <span dangerouslySetInnerHTML={html(GLASS)} />
        <div><b>{P.event}</b><span>{roomLine(P)} · {P.rules.length} requests</span></div>
      </div>
      <div className="st-board">{svg}</div>

      {won && !held ? (
        <>
          <div className="st-card">
            <div className="st-cardh">Seating Ladder</div>
            {rank.rows.map((r, i) => <div key={r.name} className={`st-row${i === rank.at ? ' me' : ''}`}><b>{r.name}</b><span>{i === rank.at ? 'You · ' : ''}{r.label}</span></div>)}
          </div>
          <div className="st-card">
            <div className="st-cardh">The Room</div>
            <div className="st-row"><b>Re-seats</b><span>{s.rs}</span></div>
            <div className="st-row"><b>Requests Met</b><span>{met} of {P.rules.length}</span></div>
          </div>
        </>
      ) : (
        <>
          {done ? null : (
            <>
              <div className="st-bar"><div className="st-msg" aria-live="polite">{live ? note || (placed ? '' : 'Tap a guest, then tap a chair.') : ''}</div></div>
              <div className="st-h">Still Standing</div>
              <div className="st-tray">
                {standing.length ? standing.map((i) => (
                  <button key={i} type="button" data-guest={i} className={`st-chip${live && sel === i ? ' sel' : ''}`} style={{ '--h': P.guests[i].hue }} onClick={() => pickGuest(i)} aria-pressed={live && sel === i}>
                    {CAST[P.guests[i].n] ? <span className="st-pt"><svg viewBox="0 0 100 100" width="24" height="24" dangerouslySetInnerHTML={html(portrait(P.guests[i].n))} /></span> : <span style={{ width: 4 }} />}{P.guests[i].n}</button>
                )) : <span className="st-none">Everyone has a chair. Tap a guest at a table to move them.</span>}
              </div>
            </>
          )}
          <div className="st-card">
            <div className="st-cardh">Requests</div>
            {P.rules.map((r, i) => (
              <div key={i} className={`st-req${st[i] === 'open' ? '' : ` ${st[i]}`}${live && sel != null && (r.a === sel || r.b === sel) ? ' mine' : ''}`}>
                <i aria-hidden="true">{st[i] === 'ok' ? '✓' : st[i] === 'bad' ? '✕' : ''}</i>
                <div>{r.why} <b>{tagOf(P, r)}</b></div>
              </div>
            ))}
          </div>
          {done ? null : <button type="button" className="st-btn" onClick={clear} disabled={!live || !placed}>Clear the Tables</button>}
        </>
      )}

      {finale ? (
        <div className="st-fin" style={{ animationDelay: `${openAt(N)}ms` }} onClick={release} role="status" aria-label={`${rank.rows[rank.at].name}. ${rs(s.rs)}.`}>
          <div className="st-fin-in">
            <span dangerouslySetInnerHTML={html(GLASS)} />
            {rank.rows.map((r, i) => (
              <div key={r.name} className={`st-rung${i < rank.at ? ' over' : i === rank.at ? ' me' : ''}`}
                style={i >= rank.at ? { animationDelay: `${climbAt(N) + (RUNG_H - 1 - i) * STEP}ms` } : undefined}>{r.name}</div>
            ))}
            <div className="st-fin-t" style={{ animationDelay: `${climbAt(N) + (RUNG_H - 1 - rank.at) * STEP + 250}ms` }}>{rank.rows[rank.at].name}</div>
            <div className="st-fin-s" style={{ animationDelay: `${climbAt(N) + (RUNG_H - 1 - rank.at) * STEP + 250}ms` }}>{rs(s.rs)}</div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

const isWon = (P, s) => seatedCount(s.seat) === P.guests.length && P.rules.every((r) => ruleState(s.seat, r) === 'ok');
const metOf = (P, s) => P.rules.filter((r) => ruleState(s.seat, r) === 'ok').length;

const GAME = {
  key: 'seated', name: 'Seated', cat: 'Logic', miss: 're-seats', missOne: 're-seat',
  fresh: (P) => ({ seat: P.tables.map((t) => new Array(t.seats).fill(null)), rs: 0, mv: 0 }),
  validSave: (P, s) => {
    if (!s || !Array.isArray(s.seat) || s.seat.length !== P.tables.length || !Number.isInteger(s.rs) || !Number.isInteger(s.mv)) return false;
    if (!s.seat.every((t, i) => Array.isArray(t) && t.length === P.tables[i].seats && t.every((x) => x === null || (Number.isInteger(x) && x >= 0 && x < P.guests.length)))) return false;
    const all = s.seat.flat().filter((x) => x !== null);
    return new Set(all).size === all.length;
  },
  touched: (s) => s.mv > 0,
  solved: (P, s) => isWon(P, s),
  count: (s) => s.rs,
  result: (P, s, won) => ({ score: won ? 10 : 0, total: 10, correct: won ? 1 : 0, guessesUsed: s.rs }),
  metric: (P, s, won) => (won ? s.rs : null),
  Board,
  wide: false,
  holdMs: (P, s, won) => { if (!won) return 1200; const r = rankOf(P, s.rs), n = P.guests.length; return climbAt(n) + (RUNG_H - 1 - r.at) * STEP + 250 + 1500; },
  title: (P, s, won) => (won ? rankName(P, s) : endSolved(false)),
  eyebrow: (P, s, { sundayLabel }) => `${sundayLabel || `${BAND[P.band]} · ${P.event}`} · No. ${P.num}`,
  foot: (P, s) => `${seatedCount(s.seat)} of ${P.guests.length} seated · ${rs(s.rs)}`,
  frac: (P, s) => (seatedCount(s.seat) + metOf(P, s)) / (P.guests.length + P.rules.length),
  // the second intro board falls on a Sunday and is not a Sunday Edition
  sundayLabel: (P) => (P.band === 'sunday' ? 'Sunday Edition · The Wedding' : null),
  gateTitle: (P) => `Today: the ${P.event}, ${P.guests.length} guests to seat`,
  gateLine: (P) => `${roomLine(P)} and ${P.rules.length} requests. Tap a guest, then tap a chair. Every guest gets a chair and every request has to be met.`,
  rules: (P) => ({
    lead: 'Give every guest a chair and meet every request, moving as few people as you can.',
    steps: [
      <><b>Tap a guest</b>, then <b>tap a chair</b>. The bar under the room shows what that guest has been asked for, and their requests are shaded in the list.</>,
      <>Each request ends with what it needs. <b>Side by side</b> means neighbouring chairs at the same table. <b>Directly across</b> means opposite chairs. <b>Same table</b> and <b>Different tables</b> mean just that.</>,
      <>A request turns <b>green</b> when it is met and <b>red</b> when it is broken, as soon as everyone it names has a chair. A guest caught in a broken request gets a red dot.</>,
      <>To change your mind, tap a seated guest and then another chair. Moving a guest, swapping two, or standing one back up is a <b>re-seat</b>, and so is each guest Clear the Tables removes.</>,
      P.tables.length === 1
        ? <>Today is one round table, so it is all about who sits beside whom. The table has no head: only the order round it matters.</>
        : <>Today is {roomLine(P).toLowerCase()}. Work out who shares a table first, then the order round each one.</>,
    ],
    knack: 'Read every request before you seat anyone. Start with the guests named most often, and with any request that names a table.',
    footer: 'Seating the room counts. The fewest re-seats ranks first, then the clock, and the Seating Ladder names your rung.',
  }),
  pitch: (P) => `${P.guests.length} guests, ${P.rules.length} requests. Seat the ${P.event}.`,
  shareLine: (P, s, won, el) => `Seated #${P.num} · ${won ? `${rankName(P, s)} · ${rs(s.rs)} · ${el}` : 'unfinished'}`,
  detail: (P, s, won, el) => (won ? `${rs(s.rs)} · ${el}` : `${metOf(P, s)} of ${P.rules.length} requests met · ${el}`),
  aboutTitle: 'About Seated',
  about: [
    'Seated is a free daily seating-chart puzzle from Mind Loft. A room of round tables, a list of guests and a list of requests: two uncles are not speaking, a couple came together, a grandmother needs the table by the door. Tap a guest, tap a chair, and keep going until every guest is seated and every request is met.',
    'There are seven kinds of request. Two guests can ask to sit side by side, not side by side, directly across from each other, at the same table or at different tables, and a guest can ask for a table or ask to be kept away from one. Each request shows green or red the moment everyone it names has a chair, so you always know where the room stands.',
    'Every room has one answer to the question of who shares a table with whom, and it can be reasoned out from the requests alone. The room grows through the week: a dinner party at one table on Monday, a birthday dinner, a rehearsal dinner, an office party, a class reunion and a charity gala, and on Sunday a wedding reception of twenty guests at four tables.',
    'Moving a guest who already had a chair is a re-seat. At the end the Seating Ladder names your rung by how few you needed, from Seated the Exes Together up through Gracious Host and Wedding Planner to a room seated right the first time.',
    <>More everyday puzzles: <a href="/chef" style={{ color: 'inherit', fontWeight: 800 }}>Chef</a>, <a href="/pack" style={{ color: 'inherit', fontWeight: 800 }}>Pack</a> and <a href="/mop" style={{ color: 'inherit', fontWeight: 800 }}>Mop</a>.</>,
  ],
};

export default function SeatedClient(props) {
  return <SimpleDaily {...props} game={GAME} />;
}
