'use client';

// Mop for kids (owner, 2026-11-15). The grown-up Mop's rule on a little
// one-floor house: push the mop over every floor tile once, never step on a
// wet (mopped) tile, and finish on the tile inside the way Out. Same drawing
// as the real game (lib/mop-art.js) and the same board model
// (lib/mop-engine.js), in the kids look and with nothing counting against
// you. Show me takes the next step for you; if the mop has wandered into a
// spot it cannot finish from, Show me backs it up one step instead.

import React, { useEffect, useMemo, useRef, useState } from 'react';
import KidsShell, { useKidsSave, Confetti } from '../KidsShell';
import { mopModel } from '@/lib/mop-engine';
import { U, DIRS, MOP, drawFloor, MOP_LIGHT, MOP_ART_CSS } from '@/lib/mop-art';

const PAD = 34, PADY = 80;

const CSS = `
.mop{width:100%;max-width:460px;margin:0 auto;${MOP_LIGHT}}
.mop-yard{position:relative;border-radius:22px;overflow:hidden;border:3px solid var(--kink);touch-action:none;user-select:none;-webkit-user-select:none;
background-color:var(--mop-grass);background-image:radial-gradient(ellipse 2px 5px at 7px 9px,var(--mop-grass2) 98%,transparent),radial-gradient(ellipse 2px 5px at 11px 11px,var(--mop-grass2) 98%,transparent),radial-gradient(ellipse 2px 5px at 27px 30px,var(--mop-grass2) 98%,transparent),radial-gradient(ellipse 2px 4px at 31px 31px,var(--mop-grass2) 98%,transparent);background-size:44px 44px;}
.mop-yard svg{display:block;width:100%;height:auto;overflow:visible;font-family:'Fredoka','Nunito',system-ui,sans-serif;}
.mop-yard.shake svg{animation:kdshake .35s;}
${MOP_ART_CSS}
.mop .t.c{fill:#bfe8ff;}
.mop .t.hint{fill:#ffe58a;}
.km-say{min-height:26px;margin-top:12px;text-align:center;font-family:var(--kdisp);font-weight:600;font-size:17px;color:var(--kink);}
.km-say.bad{color:#d6336c;}
`;

// Can the mop still finish from here? A depth-first search over the tiles not
// yet mopped (at most 25 on a kids house). Returns the rest of a route, or null.
function finish(M, path) {
  const vis = new Uint8Array(M.n); path.forEach((v) => { vis[v] = 1; });
  const out = [];
  const left0 = M.n - path.length;
  function go(p, left) {
    if (left === 0) return p === M.end;
    if (p === M.end) return false;
    for (const q of M.adj[p]) {
      if (vis[q]) continue;
      vis[q] = 1; out.push(q);
      if (go(q, left - 1)) return true;
      out.pop(); vis[q] = 0;
    }
    return false;
  }
  return go(path[path.length - 1], left0) ? out : null;
}

export default function KidsMopClient({ game, board, dayKey, dayNum, dayLabel, todayNum }) {
  const P = board;
  const M = useMemo(() => (P ? mopModel(P) : null), [P]);
  const art = useMemo(() => (P ? drawFloor(P, M, 0) : null), [P, M]);
  const blank = () => ({ path: M ? [M.start] : [], shown: 0, done: false });
  const [g, setG, ready] = useKidsSave('mop', dayKey, blank());
  const [say, setSay] = useState(null);
  const [shake, setShake] = useState(0);
  const [cheer, setCheer] = useState(false);
  const [glow, setGlow] = useState(-1);
  const svgRef = useRef(null), drag = useRef(false);

  const path = M && Array.isArray(g.path) && g.path.length && g.path[0] === M.start && g.path.every((v) => Number.isInteger(v) && v >= 0 && v < M.n) ? g.path : (M ? [M.start] : []);
  const on = useMemo(() => new Set(path), [path]);
  const here = path[path.length - 1];
  const live = ready && !g.done;

  const stepRef = useRef(null);
  useEffect(() => {
    if (!live) return undefined;
    const KEYS = { ArrowUp: [0, -1], ArrowDown: [0, 1], ArrowLeft: [-1, 0], ArrowRight: [1, 0] };
    const onKey = (ev) => { const d = KEYS[ev.key]; if (!d || ev.metaKey || ev.ctrlKey || ev.altKey) return; ev.preventDefault(); if (stepRef.current) stepRef.current(d[0], d[1]); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [live]);

  if (!P) {
    return (
      <KidsShell game={game} dayKey={dayKey} dayNum={dayNum} dayLabel={dayLabel} todayNum={todayNum}>
        <div className="kd-card"><p className="kd-note">No house today. Come back tomorrow!</p></div>
      </KidsShell>
    );
  }

  const F = P.floors[0], W = F.w, H = F.h, FL = M.floors[0];
  const cellOf = (id) => M.at[id][0][1];
  const nudge = (t) => { setSay({ t, bad: true }); setShake((n) => n + 1); };

  const moveTo = (nd, shown) => {
    const next = [...path, nd];
    const won = next.length === M.n && nd === M.end;
    setG((s) => ({ ...s, path: next, shown: (s.shown || 0) + (shown ? 1 : 0), done: s.done || won }));
    if (won) { setSay({ t: 'Sparkly clean! Out you go!' }); setCheer(true); return; }
    if (nd === M.end) setSay({ t: 'That is the way out, but some tiles are still dirty. Tap Undo.', bad: true });
    else if (!M.adj[nd].some((q) => q !== here && !next.includes(q))) setSay({ t: 'Oops, the mop is stuck! Tap Undo.', bad: true });
    else setSay(shown ? { t: 'There! Keep going.' } : null);
  };

  const step = (dx, dy, quiet) => {
    if (!live) return;
    const pc = cellOf(here);
    const x = (pc % W) + dx, y = Math.floor(pc / W) + dy;
    if (x < 0 || y < 0 || x >= W || y >= H) return;
    const c = y * W + x, nd = FL.node[c];
    if (nd < 0) { if (!quiet) nudge('Furniture is in the way.'); return; }
    if (!FL.open(pc, c)) { if (!quiet) nudge('That is a wall. Find the doorway.'); return; }
    if (on.has(nd)) { if (!quiet) nudge('That tile is wet. Keep off it!'); return; }
    moveTo(nd, false);
  };
  stepRef.current = step;

  const delta = (ev) => {
    const svg = svgRef.current; if (!svg) return null;
    const pc = cellOf(here), r = svg.getBoundingClientRect();
    const x = ((ev.clientX - r.left) / r.width) * (W * U + PAD * 2) - PAD, y = ((ev.clientY - r.top) / r.height) * (H * U + PADY * 2) - PADY;
    return [Math.floor(x / U) - (pc % W), Math.floor(y / U) - Math.floor(pc / W)];
  };
  const down = (ev) => { if (!live) return; drag.current = true; const d = delta(ev); if (d && Math.abs(d[0]) + Math.abs(d[1]) === 1) step(d[0], d[1]); };
  const move = (ev) => { if (!drag.current || !live) return; const d = delta(ev); if (d && Math.abs(d[0]) + Math.abs(d[1]) === 1) step(d[0], d[1], true); };
  const up = () => { drag.current = false; };

  const undo = () => {
    if (!live || path.length < 2) return;
    setG((s) => ({ ...s, path: path.slice(0, -1) }));
    setSay(null);
  };
  const showOne = () => {
    if (!live) return;
    const rest = finish(M, path);
    if (rest && rest.length) { setGlow(rest[0]); setTimeout(() => setGlow(-1), 600); moveTo(rest[0], true); return; }
    if (path.length > 1) { setG((s) => ({ ...s, path: path.slice(0, -1), shown: (s.shown || 0) + 1 })); setSay({ t: 'That way gets stuck. I backed up one step. Tap Show me again.' }); }
  };
  const reset = () => { setG(blank()); setSay(null); setCheer(false); };

  const pc = cellOf(here);
  let bx = (pc % W) * U + 50, by = Math.floor(pc / W) * U + 50;
  const gone = g.done && here === M.end;
  if (gone) by += DIRS[P.sides[1]][1] * 130;
  const tiles = [];
  for (let c = 0; c < W * H; c++) {
    const id = FL.node[c];
    tiles.push(<rect key={c} className={`t${id < 0 ? ' f' : on.has(id) ? ' c' : id === glow ? ' hint' : ''}`} x={(c % W) * U} y={Math.floor(c / W) * U} width={U} height={U} />);
  }
  const left = M.n - path.length;
  const same = P.sides[0] === P.sides[1];

  return (
    <KidsShell game={game} dayKey={dayKey} dayNum={dayNum} dayLabel={dayLabel} todayNum={todayNum} sub={`${W} by ${H} ${P.house}`}>
      <style dangerouslySetInnerHTML={{ __html: CSS }} />
      <Confetti go={cheer} />
      <div className="kd-card kd-game">
        <div className="mop">
          <div key={shake} className={`mop-yard${shake ? ' shake' : ''}`} onPointerDown={down} onPointerMove={move} onPointerUp={up} onPointerCancel={up} onPointerLeave={up}>
            <svg ref={svgRef} viewBox={`${-PAD} ${-PADY} ${W * U + PAD * 2} ${H * U + PADY * 2}`} role="img" aria-label={`A little house ${W} by ${H}, ${left} ${left === 1 ? 'tile' : 'tiles'} left to mop`}>
              <g dangerouslySetInnerHTML={{ __html: art.under }} />
              {tiles}
              <g dangerouslySetInnerHTML={{ __html: art.over }} />
              <g className={`bot${gone ? ' out' : ''}`} style={{ transform: `translate(${bx}px,${by}px)` }} dangerouslySetInnerHTML={{ __html: MOP }} />
            </svg>
          </div>
          <div className={`km-say${say && say.bad ? ' bad' : ''}`} aria-live="polite">{g.done ? 'Sparkly clean! You mopped the whole house!' : say ? say.t : 'Tap the tile next to the mop to move.'}</div>
        </div>
        <div className="kd-side">
          <h2>Mop every tile, then get out.</h2>
          <p className="kd-how">The floor is dirty! Tap the tile next to the mop, or drag, to push it up, down, left or right. Every tile you step on gets clean and wet, and you can not step on a wet tile again. Walls and furniture are in the way, so go through the doorways. Mop every tile and finish on the tile by <b>Out</b>{same ? ' (it is right next to the door you came in)' : ''}. Stuck? <b>Undo</b> takes a step back, and <b>Show me</b> moves the mop for you.</p>
          <div className="kd-stats"><div>Tiles<b>{M.n}</b></div><div>Left<b>{left}</b></div><div>Shown<b>{g.shown || 0}</b></div></div>
          <div className="kd-ctrls">
            <button type="button" className="kd-btn pri" onClick={showOne} disabled={!live}>Show me</button>
            <button type="button" className="kd-btn" onClick={undo} disabled={!live || path.length < 2}>Undo</button>
            <button type="button" className="kd-btn" onClick={reset}>Start over</button>
          </div>
          <div className={`kd-cheer${g.done ? ' show' : ''}`}>
            <span>Squeaky clean! 🧽🎉</span>
            <small>{(g.shown || 0) === 0 ? 'You found the whole way yourself.' : `${g.shown} shown. Want to try it all by yourself? Start over.`}</small>
          </div>
        </div>
      </div>
    </KidsShell>
  );
}
