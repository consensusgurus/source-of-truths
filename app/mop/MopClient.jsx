'use client';

// Mop: the daily mop-every-tile puzzle (owner, 2026-11-13). A house seen from
// above, one mop, and one rule: every tile gets mopped exactly once, a mopped
// tile is never stepped on again, and you finish on the tile inside the way
// out. Walls, doorways and furniture shape the route. Friday and Saturday are
// two floors (from 2026-11-20) and the Sunday Edition three (Upstairs, Ground
// Floor, Basement), each floor its own screen, joined by staircases that are
// one tile shared by two floors.
//
// QUICK REPLAY from the 2026-11-17 board (owner, 2026-11-16, with Mow: "we
// should maybe change rules for mow, and also use this for mop, this will get
// quick replay like the end games do ... replays are accepted. scoring should
// show total replays"). Undo and Restart go. Stepping on a tile you have
// already mopped flashes red and the mop is back at the door in under a
// second, the clock still running: one replay. Replay does the same by hand.
// The board ranks on the clock, replays breaking a tie (CLOCK_FIRST in
// lib/daily-games.js), and the result always shows the replays. An earlier
// board keeps the old free Undo and Restart, so a day already played is not
// played under two rules.
//
// The board model is lib/mop-engine.js (shared with the generator and the
// checker). The check here is the rule, not an answer key: any route that
// covers the house and ends at the door is a solve. Runs on app/SimpleDaily.jsx.

import React, { useEffect, useMemo, useRef, useState } from 'react';
import SimpleDaily from '../SimpleDaily';
import { mopModel } from '@/lib/mop-engine';
import { U, DIRS, MOP, drawFloor, MOP_LIGHT, MOP_DARK, MOP_ART_CSS } from '@/lib/mop-art';

const PAD = 34, PADY = 80;
const MODELS = typeof WeakMap !== 'undefined' ? new WeakMap() : null;
function modelOf(P) {
  let m = MODELS && MODELS.get(P);
  if (!m) { m = mopModel(P); if (MODELS) MODELS.set(P, m); }
  return m;
}
const cellOn = (M, node, k) => { const p = M.at[node].find((a) => a[0] === k); return p ? p[1] : -1; };
const same = (P) => P.sides[0] === P.sides[1];
const BAND = { gentle: 'Gentle', moderate: 'Moderate', tough: 'Tough', sunday: 'Sunday Edition' };
export const REPLAY_FROM = '2026-11-17';
const replays = (P) => !P.live || P.live >= REPLAY_FROM;
const FLASH_MS = 650;
const plural = (n) => `${n} ${n === 1 ? 'replay' : 'replays'}`;

const CSS = `
.mop{align-self:center;width:100%;max-width:min(540px, calc((100dvh - 310px) / 1.14));display:flex;flex-direction:column;gap:10px;
${MOP_LIGHT}}
.stage-page[data-stage-theme='dark'] .mop{${MOP_DARK}}
@media (min-width:900px){.mop{max-width:min(600px, calc((100dvh - 300px) / 1.14));}}
.mop-yard{position:relative;border-radius:14px;overflow:hidden;border:1px solid var(--mop-ink);touch-action:none;user-select:none;-webkit-user-select:none;
background-color:var(--mop-grass);background-image:radial-gradient(ellipse 2px 5px at 7px 9px,var(--mop-grass2) 98%,transparent),radial-gradient(ellipse 2px 5px at 11px 11px,var(--mop-grass2) 98%,transparent),radial-gradient(ellipse 2px 5px at 27px 30px,var(--mop-grass2) 98%,transparent),radial-gradient(ellipse 2px 4px at 31px 31px,var(--mop-grass2) 98%,transparent);background-size:44px 44px;}
.mop-yard.earth{background-color:var(--mop-earth);background-image:radial-gradient(circle 2px at 8px 10px,var(--mop-earth2) 98%,transparent),radial-gradient(circle 3px at 30px 28px,var(--mop-earth2) 98%,transparent),radial-gradient(circle 1.5px at 20px 38px,var(--mop-earth2) 98%,transparent);background-size:44px 44px;}
.mop-yard svg{display:block;width:100%;height:auto;overflow:visible;font-family:'Manrope',system-ui,sans-serif;}
.mop-yard.shake svg{animation:mop-shake .25s;}
@keyframes mop-shake{25%{transform:translateX(-4px)}75%{transform:translateX(4px)}}
${MOP_ART_CSS}
.mop-tabs{display:flex;align-self:center;border:1px solid var(--mop-ink);border-radius:10px;overflow:hidden;background:var(--mop-ground);}
.mop-tabs button{all:unset;cursor:pointer;padding:8px 13px;font:800 13px/1.4 'Manrope',system-ui,sans-serif;color:var(--mop-ink);border-left:1px solid var(--mop-ink);border-radius:0;}
.mop-tabs button:first-child{border-left:0;}
.mop-tabs button[aria-current=true]{background:#fda4af;color:#08222e;}
.mop-tabs button.here::before{content:"";display:inline-block;width:8px;height:8px;border-radius:50%;background:currentColor;margin-right:6px;vertical-align:1px;}
.mop-msg{min-height:22px;text-align:center;font:800 13px/1.6 'Manrope',system-ui,sans-serif;color:var(--pst-bad,#be123c);}
.mop-msg.ok{color:var(--mop-ink);}
.mop .t.x{fill:var(--pst-bad,#e11d48);}
`;

function Board({ P, s, setS, active, done }) {
  const M = modelOf(P), multi = P.floors.length > 1;
  const [peek, setPeek] = useState(null);
  const [note, setNote] = useState(null);
  const [shake, setShake] = useState(0);
  const [flash, setFlash] = useState(null);
  const timer = useRef(null);
  useEffect(() => () => clearTimeout(timer.current), []);
  const RR = replays(P);
  const svgRef = useRef(null), drag = useRef(false);
  const view = done && peek != null ? peek : Math.min(s.view || 0, P.floors.length - 1);
  const F = P.floors[view], W = F.w, H = F.h;
  const here = s.path[s.path.length - 1];
  const on = useMemo(() => new Set(s.path), [s.path]);
  const art = useMemo(() => drawFloor(P, M, view), [P, M, view]);
  const solved = s.path.length === M.n && here === M.end;
  const live = active && !done && flash == null;

  const nudge = (t) => { setNote({ t, bad: true }); setShake((n) => n + 1); };
  const step = (dx, dy, quiet) => {
    if (!live) return;
    const pc = cellOn(M, here, view);
    if (pc < 0) { if (!quiet) setNote({ t: `The mop is on the ${P.floors[M.at[here][0][0]].name}. Switch to that floor to move.`, bad: true }); return; }
    const x = (pc % W) + dx, y = Math.floor(pc / W) + dy;
    if (x < 0 || y < 0 || x >= W || y >= H) return;
    const c = y * W + x, nd = M.floors[view].node[c];
    if (nd < 0) { if (!quiet) nudge('Furniture in the way.'); return; }
    if (!M.floors[view].open(pc, c)) { if (!quiet) nudge('There is a wall there.'); return; }
    if (on.has(nd)) {
      if (!RR) { if (!quiet) nudge('Already mopped. Keep off it.'); return; }
      // a drag wobbling back onto the tile it just left is a slip, not a choice
      if (quiet && s.path.length > 1 && nd === s.path[s.path.length - 2]) return;
      setFlash(c); setNote({ t: 'Already mopped. Replay.', bad: true });
      timer.current = setTimeout(() => {
        setFlash(null);
        setS((st) => ({ ...st, path: [M.start], view: P.start[0], replays: (st.replays || 0) + 1 }));
        setNote({ t: 'Back at the door. The clock is still running.' });
      }, FLASH_MS);
      return;
    }
    const pl = M.at[nd], nv = pl.length > 1 ? pl.find((a) => a[0] !== view)[0] : pl[0][0];
    const len = s.path.length + 1;
    if (RR && nd === M.end && len !== M.n) { if (!quiet) nudge('That is the way out. Mop the rest first.'); return; }
    if (len === M.n && nd === M.end) setNote({ t: 'Spotless. Out you go.' });
    else if (nd === M.end) setNote({ t: 'That is the way out, but the floors are not done. Undo.', bad: true });
    else if (!M.adj[nd].some((q) => q !== here && !on.has(q))) setNote({ t: RR ? 'Boxed in. Tap Replay.' : 'Boxed in. Undo or Restart.', bad: true });
    else setNote(null);
    setS((st) => (st.path[st.path.length - 1] !== here ? st : { ...st, path: [...st.path, nd], view: nv }));
  };
  const stepRef = useRef(step); stepRef.current = step;
  useEffect(() => {
    if (!live) return undefined;
    const KEYS = { ArrowUp: [0, -1], ArrowDown: [0, 1], ArrowLeft: [-1, 0], ArrowRight: [1, 0], w: [0, -1], s: [0, 1], a: [-1, 0], d: [1, 0] };
    const onKey = (ev) => {
      if (ev.metaKey || ev.ctrlKey || ev.altKey) return;
      const tag = (ev.target && ev.target.tagName) || '';
      if (tag === 'INPUT' || tag === 'TEXTAREA') return;
      const d = KEYS[ev.key]; if (!d) return;
      ev.preventDefault(); stepRef.current(d[0], d[1]);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [live]);
  useEffect(() => { if (s.path.length < 2 && flash == null) setNote((n) => (n && n.bad ? null : n)); }, [s.path.length, flash]);

  const delta = (ev) => {
    const svg = svgRef.current; if (!svg) return null;
    const pc = cellOn(M, here, view); if (pc < 0) return 'off';
    const r = svg.getBoundingClientRect();
    const x = ((ev.clientX - r.left) / r.width) * (W * U + PAD * 2) - PAD, y = ((ev.clientY - r.top) / r.height) * (H * U + PADY * 2) - PADY;
    return [Math.floor(x / U) - (pc % W), Math.floor(y / U) - Math.floor(pc / W)];
  };
  const down = (ev) => {
    if (!live) return;
    drag.current = true;
    const d = delta(ev);
    if (d === 'off') { step(1, 0); return; }
    if (d && Math.abs(d[0]) + Math.abs(d[1]) === 1) step(d[0], d[1]);
  };
  const move = (ev) => {
    if (!drag.current || !live) return;
    const d = delta(ev);
    if (d && d !== 'off' && Math.abs(d[0]) + Math.abs(d[1]) === 1) step(d[0], d[1], true);
  };
  const up = () => { drag.current = false; };

  const pc = cellOn(M, here, view);
  let bx = 0, by = 0;
  if (pc >= 0) { bx = (pc % W) * U + 50; by = Math.floor(pc / W) * U + 50; }
  const gone = solved && pc >= 0 && view === P.end[0];
  if (gone) by += DIRS[P.sides[1]][1] * 130;
  const tiles = [];
  for (let c = 0; c < W * H; c++) {
    const id = M.floors[view].node[c];
    tiles.push(<rect key={c} className={`t${id < 0 ? ' f' : flash === c ? ' x' : on.has(id) ? ' c' : ''}`} x={(c % W) * U} y={Math.floor(c / W) * U} width={U} height={U} />);
  }
  const left = M.n - s.path.length;
  return (
    <div className="mop">
      <style dangerouslySetInnerHTML={{ __html: CSS }} />
      {multi ? (
        <div className="mop-tabs" role="tablist" aria-label="Floors">
          {P.floors.map((f, k) => (
            <button key={f.name} type="button" role="tab" aria-current={k === view} className={cellOn(M, here, k) >= 0 ? 'here' : ''}
              onClick={() => { if (done) setPeek(k); else setS((st) => ({ ...st, view: k })); }}>{f.name}</button>
          ))}
        </div>
      ) : null}
      <div key={shake} className={`mop-yard${F.name === 'Basement' ? ' earth' : ''}${shake ? ' shake' : ''}`}
        onPointerDown={down} onPointerMove={move} onPointerUp={up} onPointerCancel={up} onPointerLeave={up}>
        <svg ref={svgRef} viewBox={`${-PAD} ${-PADY} ${W * U + PAD * 2} ${H * U + PADY * 2}`} role="img"
          aria-label={`${multi ? `${F.name}, ` : ''}a house floor plan ${W} by ${H}, ${left} ${left === 1 ? 'tile' : 'tiles'} left to mop`}>
          <g dangerouslySetInnerHTML={{ __html: art.under }} />
          {tiles}
          <g dangerouslySetInnerHTML={{ __html: art.over }} />
          {pc >= 0 ? <g className={`bot${gone ? ' out' : ''}`} style={{ transform: `translate(${bx}px,${by}px)` }} dangerouslySetInnerHTML={{ __html: MOP }} /> : null}
        </svg>
      </div>
      <div className={`mop-msg${note && !note.bad ? ' ok' : ''}`} aria-live="polite">{live && note ? note.t : ''}</div>
    </div>
  );
}

function Tools({ P, s, setS, active, done }) {
  if (done) return null;
  const M = modelOf(P), can = active && s.path.length > 1;
  const undo = () => setS((st) => {
    if (st.path.length < 2) return st;
    const path = st.path.slice(0, -1), nd = path[path.length - 1], prev = path[path.length - 2], pl = M.at[nd];
    let view = st.view;
    if (cellOn(M, nd, view) < 0) view = pl[0][0];
    else if (pl.length > 1 && prev !== undefined) { const other = pl.find((a) => a[0] !== view)[0]; if (cellOn(M, prev, view) >= 0 && cellOn(M, prev, other) < 0) view = other; }
    return { ...st, path, view, undos: (st.undos || 0) + 1 };
  });
  const restart = () => setS((st) => (st.path.length < 2 ? st : { ...st, path: [M.start], view: P.start[0], undos: (st.undos || 0) + 1 }));
  if (replays(P)) {
    const replay = () => setS((st) => (st.path.length < 2 ? st : { ...st, path: [M.start], view: P.start[0], replays: (st.replays || 0) + 1 }));
    const n = s.replays || 0;
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 12 }}>
        <button type="button" className="sd-tool" onClick={replay} disabled={!can} style={{ opacity: can ? 1 : 0.4 }}>Replay</button>
        <span style={{ font: "800 13px/1 'Manrope',system-ui,sans-serif", color: 'var(--stg-mute,#8b95a8)' }}>{plural(n)}</span>
      </div>
    );
  }
  return (
    <div style={{ display: 'flex', justifyContent: 'center', gap: 10 }}>
      <button type="button" className="sd-tool" onClick={undo} disabled={!can} style={{ opacity: can ? 1 : 0.4 }}>Undo</button>
      <button type="button" className="sd-tool" onClick={restart} disabled={!can} style={{ opacity: can ? 1 : 0.4 }}>Restart</button>
    </div>
  );
}

const storeys = (P) => (P.floors.length === 3 ? 'Three floors' : P.floors.length === 2 ? 'Two floors' : null);
const doors = (P) => (same(P) ? 'Come in by the front door and leave by the same door: it is two tiles wide, in on one side and out on the other.' : 'Come in the front door and leave by the back door.');
const doorLine = (P) => (P.floors.length === 3 ? `Three floors today, the ground floor, the upstairs and the basement. ${doors(P)}`
  : P.floors.length === 2 ? `Two floors today, the ground floor and the upstairs. ${doors(P)}` : doors(P));

const GAME = {
  key: 'mop', name: 'Mop', cat: 'Logic', miss: 'Replays', missOne: 'replay',
  fresh: (P) => ({ path: [modelOf(P).start], view: P.start[0], undos: 0, replays: 0 }),
  validSave: (P, s) => { const M = modelOf(P); return Array.isArray(s.path) && s.path.length >= 1 && s.path[0] === M.start && s.path.every((v) => Number.isInteger(v) && v >= 0 && v < M.n); },
  touched: (s) => s.path.length > 1 || (s.replays || 0) > 0,
  solved: (P, s) => { const M = modelOf(P); return s.path.length === M.n && s.path[s.path.length - 1] === M.end; },
  count: (s) => s.replays || 0,
  metric: (P, s, won) => (won ? s.replays || 0 : null),
  result: (P, s, won) => ({ score: won ? 10 : 0, total: 10, correct: won ? 1 : 0, guessesUsed: replays(P) ? s.replays || 0 : 0 }),
  Board,
  tools: (props) => <Tools {...props} />,
  eyebrow: (P, s, { sundayLabel }) => `${sundayLabel || `${BAND[P.band]} · ${P.floors.length === 2 ? 'Two Floors' : P.house}`} · No. ${P.num}`,
  foot: (P, s) => `Mopped ${s.path.length} of ${modelOf(P).n}`,
  frac: (P, s) => s.path.length / modelOf(P).n,
  sundayLabel: () => 'Sunday Edition · Three Floors',
  gateTitle: (P) => (storeys(P) ? `Today: ${storeys(P).toLowerCase()}, ${modelOf(P).n} tiles` : `Today: the ${P.house}, ${modelOf(P).n} tiles`),
  gateLine: (P) => (replays(P) ? `Mop every tile exactly once. Step on a tile you have already mopped and you replay from the door, with the clock still running. ${doorLine(P)}` : `Mop every tile exactly once, and never step on a tile you have already mopped. ${doorLine(P)}`),
  rules: (P) => ({
    lead: 'Mop every tile once, then get out.',
    steps: [
      <><b>Tap</b> or <b>drag</b> to the next tile, up, down, left or right (arrow keys work too). Every tile you step on is mopped.</>,
      <>A mopped tile is wet: you can <b>never step on it again</b>. Walls and furniture block you, and rooms join only at their doorways.</>,
      <>{doorLine(P)} The last tile you mop has to be the one inside the way <b>Out</b>.</>,
      ...(P.floors.length > 1 ? [<>A <b>staircase</b> is one tile shared by two floors. Step on it and you change floor, so leave the ground floor by one staircase and come back by the other. The tabs show any floor, and a dot marks the one the mop is on.</>] : []),
      replays(P)
        ? <>Step on a tile you have <b>already mopped</b> and it is a <b>replay</b>: the mop is back at the door and the clock keeps running. <b>Replay</b> does the same any time you are boxed in.</>
        : <><b>Undo</b> takes back a step and <b>Restart</b> clears the house. Both are free.</>,
    ],
    knack: 'Look for the dead ends first. A tile with only two ways in and out has to be passed straight through, and a room with one doorway has to be the first or the last thing you mop.',
    footer: replays(P) ? 'A spotless house ranks on fewest replays, then the clock. Giving up scores nothing.' : 'A spotless house ranks on the clock. Giving up scores nothing.',
  }),
  pitch: (P) => (storeys(P) ? `${storeys(P)} and ${modelOf(P).n} tiles. Mop every one exactly once and get out.` : `${modelOf(P).n} tiles in the ${P.house}. Mop every one exactly once and get out.`),
  shareLine: (P, s, won, el) => `Mop #${P.num} · ${storeys(P) ? storeys(P).toLowerCase() : P.house} · ${won ? (replays(P) ? `${el} · ${plural(s.replays || 0)}` : el) : 'unfinished'}`,
  detail: (P, s, won, el) => `${storeys(P) || P.house} · ${modelOf(P).n} tiles · ${replays(P) ? `${plural(s.replays || 0)} · ` : ''}${el}`,
  aboutTitle: 'About Mop',
  about: [
    'Mop is a free daily route puzzle from Mind Loft. A house is drawn from above, with rooms, doorways and furniture, and you push a mop through it one tile at a time. Every tile has to be mopped exactly once, a wet tile can never be stepped on again, and the last tile you mop is the one inside the door you leave by.',
    'Monday is the easy day, a six by six cottage, and every day after it is harder: a seven by seven house on Tuesday, eight by eight on Wednesday, two floors on Thursday and Friday, and three floors on Saturday. Some days you leave by the back door and some days by the same front door you came in. The Sunday Edition is the biggest house of the week, three floors of seven by seven: upstairs, ground floor and basement. The floors are joined by staircases, and each staircase can be used once.',
    'Step on a wet tile and the mop goes straight back to the door for a replay, with the clock still running. Every house is generated fresh and solved before it is dealt, so there is always a way through. The fastest spotless house tops the daily leaderboard, and fewer replays break a tie.',
    <>More route puzzles: <a href="/mow" style={{ color: 'inherit', fontWeight: 800 }}>Mow</a>, <a href="/connect" style={{ color: 'inherit', fontWeight: 800 }}>Connect</a>, <a href="/chomp" style={{ color: 'inherit', fontWeight: 800 }}>Chomp</a> and <a href="/hedge" style={{ color: 'inherit', fontWeight: 800 }}>Hedge</a>.</>,
  ],
};

export default function MopClient(props) {
  return <SimpleDaily {...props} game={GAME} />;
}
