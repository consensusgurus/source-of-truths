'use client';

// Bot: the daily programming puzzle (owner, 2026-11-18: picked Bot from the
// retro list; asked for a Jump command, a more dynamic board, P2 and P3 on
// Sunday, a clearer facing arrow and Jump icon, and a plain answer to "what
// does a light do"; then "build and implement both", and in the same push "an
// option to show the answer"). Mockup: https://claude.ai/artifact/WX3qGQ6FMtykK8sLwHKEZm
// (its Spiral Stair is No. 1).
//
// Write a program in rows (Main, P1, and on Sunday P2 and P3), press Run or
// Step, and the robot walks it on a little 3D board. Light up switches on the
// lamp the robot stands on; the day is solved the moment every lamp is on.
// Runs are free: a run that does not finish the board costs nothing. The
// program that finishes it is the score: fewest commands, then the clock
// (guesses_used is the command count; a solve is 10, a give-up 0). Par is the
// fewest possible on weekdays and the setter's best on Sunday.
//
// The save is { prog, runs, won }: `prog` the rows as typed, `runs` the runs
// started, `won` the program that lit every lamp (set when its playback ends).
// The model is lib/bot-engine.js. Runs on app/SimpleDaily.jsx.

import React, { useEffect, useMemo, useRef, useState } from 'react';
import useSquareCells from '@/lib/use-square-cells';
import SimpleDaily from '../SimpleDaily';
import { run, modelOf, heightAt, commandsIn, legalProgram, rowsOf, ROWS } from '@/lib/bot-engine';

const BAND = { gentle: 'Gentle', moderate: 'Moderate', tough: 'Tough', sunday: 'Sunday Edition' };
const cmdsOf = (n) => `${n} ${n === 1 ? 'command' : 'commands'}`;
const ROW_NAME = { main: 'Main', p1: 'P1', p2: 'P2', p3: 'P3' };
const CMDS = [{ k: 'F', n: 'Forward' }, { k: 'J', n: 'Jump' }, { k: 'L', n: 'Left' }, { k: 'R', n: 'Right' }, { k: 'O', n: 'Light up' }];
const CALLS = [{ k: '1', n: 'P1', row: 'p1' }, { k: '2', n: 'P2', row: 'p2' }, { k: '3', n: 'P3', row: 'p3' }];
const emptyProg = () => ({ main: '', p1: '', p2: '', p3: '' });

const TW = 46, TH = 23, LH = 20;
const iso = (x, y, h) => [(x - y) * TW, (x + y) * TH - h * LH];
const pts = (a) => a.map((p) => p.join(',')).join(' ');
const ease = (t) => (t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const CSS = `
.bot{align-self:center;margin-left:auto;margin-right:auto;width:100%;display:flex;flex-direction:column;align-items:center;gap:10px;
--bt-ink:#15171c;--bt-tile:#efede8;--bt-side1:#dcd8cf;--bt-side2:#c9c4b9;--bt-edge:#9b958a;--bt-lamp:#cfe0f1;--bt-lamp-lo:#9fbfdf;--bt-lit:#f6e3a1;--bt-lit-lo:#e3c25a;--bt-glow:rgba(246,214,110,.55);--bt-bot:#f4f4f2;--bt-bot-lo:#9aa3ae;--bt-eye:#3d7fc4;--bt-arrow:#15171c;--bt-arrow-edge:#fbfaf7;--bt-slot:#f3f1ec;--bt-slot-line:#e2dfd8;--bt-row-on:#d9e8d0;--bt-row-on-ink:#24401c;--bt-card:#ffffff;
--bt-cF:#cfe0f1;--bt-cJ:#fbdcc4;--bt-cL:#e7d7f0;--bt-cR:#e7d7f0;--bt-cO:#f6e3a1;--bt-c1:#d9e8d0;--bt-c2:#d7ecec;--bt-c3:#f3dbe1;}
.stage-page[data-stage-theme='dark'] .bot,html:is([data-stage-pastel='darktint'],[data-stage-tone='darktint']) .bot{--bt-ink:#eef1f6;--bt-tile:#232934;--bt-side1:#2a313d;--bt-side2:#20262f;--bt-edge:#4a5463;--bt-lamp:#2f4a66;--bt-lamp-lo:#4b6f95;--bt-lit:#c9a93f;--bt-lit-lo:#f0d273;--bt-glow:rgba(240,210,115,.35);--bt-bot:#dfe3e8;--bt-bot-lo:#7b8592;--bt-eye:#5f98c9;--bt-arrow:#f6e3a1;--bt-arrow-edge:#1b2029;--bt-slot:#1f242e;--bt-slot-line:#2c3340;--bt-row-on:#2c3f27;--bt-row-on-ink:#d9e8d0;--bt-card:#171b23;
--bt-cF:#2f4a66;--bt-cJ:#5a3c26;--bt-cL:#4a3b57;--bt-cR:#4a3b57;--bt-cO:#5c4c1f;--bt-c1:#2c3f27;--bt-c2:#22403f;--bt-c3:#4d2c35;}
.bot svg.scene{display:block;width:100%;height:auto;user-select:none;-webkit-user-select:none;}
.bot-pal{width:100%;display:grid;gap:7px;}
.bot-cmd{all:unset;box-sizing:border-box;border:1px solid var(--stg-cell-line,rgba(28,30,36,.35));background:var(--bt-card);color:var(--bt-ink);border-radius:13px;padding:7px 2px;display:flex;flex-direction:column;align-items:center;gap:3px;cursor:pointer;font:800 12px/1.3 'Manrope',system-ui,sans-serif;text-align:center;}
.bot-cmd svg{width:32px;height:32px;}
.bot-cmd[disabled]{opacity:.4;cursor:default;}
.bot-row{all:unset;box-sizing:border-box;width:100%;border:1px solid var(--stg-cell-line,rgba(28,30,36,.35));border-radius:13px;background:var(--bt-card);padding:8px;display:grid;grid-template-columns:52px 1fr;gap:8px;align-items:center;cursor:pointer;}
.bot-row.on{background:var(--bt-row-on);}
.bot-row .nm{font:800 13px/1.3 'Manrope',system-ui,sans-serif;color:var(--bt-ink);}
.bot-row.on .nm,.bot-row.on .nm small{color:var(--bt-row-on-ink);}
.bot-row .nm small{display:block;font:700 11px/1.3 'Manrope',system-ui,sans-serif;color:var(--stg-mute,#8b95a8);}
.bot-slots{display:grid;grid-template-columns:repeat(8,1fr);grid-auto-rows:var(--sq-cell, auto);gap:5px;}
.bot-slot{all:unset;box-sizing:border-box;min-height:0;align-self:stretch;border:1px solid var(--bt-slot-line);border-radius:9px;background:var(--bt-slot);display:grid;place-items:center;}
.bot-slot.full{border-color:var(--stg-cell-line,rgba(28,30,36,.35));cursor:pointer;}
.bot-slot svg{width:80%;height:80%;}
.bot-slot.now{outline:3px solid var(--bt-ink);outline-offset:1px;}
.bot-slot.off{visibility:hidden;}
.bot-msg{min-height:22px;text-align:center;font:800 13px/1.6 'Manrope',system-ui,sans-serif;color:var(--stg-mute,#8b95a8);}
.bot-msg.bad{color:var(--pst-bad,#be123c);}
.bot-act{display:flex;flex-wrap:wrap;justify-content:center;gap:8px;}
.bot-act .go{background:var(--bt-ink);color:var(--bt-card);border-color:var(--bt-ink);}
.bot-act .on{background:var(--bt-row-on);color:var(--bt-row-on-ink);}
@media(max-width:560px){.bot-row{grid-template-columns:1fr;gap:5px}.bot-row .nm{display:flex;gap:8px;align-items:baseline}.bot-row .nm small{display:inline}.bot-cmd svg{width:27px;height:27px}.bot-cmd{font-size:11px}}
`;

function Icon({ k }) {
  const ink = { stroke: 'var(--bt-ink)', strokeWidth: 3.2, fill: 'none', strokeLinecap: 'round', strokeLinejoin: 'round' };
  return (
    <svg viewBox="0 0 40 40" aria-hidden="true">
      <rect x={1} y={1} width={38} height={38} rx={9} fill={`var(--bt-c${k})`} stroke="var(--stg-cell-line,rgba(28,30,36,.35))" strokeWidth={1} />
      {k === 'F' ? <path d="M20 30V11M12 18l8-8 8 8" {...ink} /> : null}
      {k === 'J' ? <><path d="M7 33H33" stroke="var(--bt-ink)" strokeWidth={2} strokeLinecap="round" opacity={0.55} /><path d="M9 29C9 9 30 9 30 27" {...ink} /><path d="M24.5 22.5L30 28L35.5 22.5" {...ink} /></> : null}
      {k === 'L' ? <path d="M27 29v-8a7 7 0 0 0-7-7h-9M16 9l-5 5 5 5" {...ink} /> : null}
      {k === 'R' ? <path d="M13 29v-8a7 7 0 0 1 7-7h9M24 9l5 5-5 5" {...ink} /> : null}
      {k === 'O' ? <path d="M20 9a7.5 7.5 0 0 0-4.5 13.5c1 .8 1.5 1.8 1.5 3h6c0-1.2.5-2.2 1.5-3A7.5 7.5 0 0 0 20 9zM17 29.5h6" {...ink} /> : null}
      {'123'.includes(k) ? <text x={20} y={25.5} textAnchor="middle" fontFamily="Manrope,system-ui,sans-serif" fontWeight={800} fontSize={15} fill="var(--bt-ink)">{`P${k}`}</text> : null}
    </svg>
  );
}

// the isometric board, with the robot at view = { x, y, h, d, depth, squash } and lamps `lit`
function Scene({ P, view, lit }) {
  const M = modelOf(P);
  const lampOf = (x, y) => P.lamps.findIndex(([a, b]) => a === x && b === y);
  const tiles = [];
  for (let y = 0; y < M.H; y++) for (let x = 0; x < M.W; x++) { const h = heightAt(M, x, y); if (h >= 0) tiles.push({ x, y, h }); }
  tiles.sort((a, b) => a.x + a.y - (b.x + b.y) || a.x - b.x);
  // bounds
  let x0 = 1e9, x1 = -1e9, y0 = 1e9, y1 = -1e9;
  for (const t of tiles) for (const [dx, dy] of [[-0.5, -0.5], [0.5, -0.5], [0.5, 0.5], [-0.5, 0.5]]) {
    for (const h of [0, t.h + 0.5]) { const [a, b] = iso(t.x + dx, t.y + dy, h); x0 = Math.min(x0, a); x1 = Math.max(x1, a); y0 = Math.min(y0, b); y1 = Math.max(y1, b); }
  }
  y0 -= 70; x0 -= 20; x1 += 20; y1 += 14;
  const out = [];
  const rd = view.depth != null ? view.depth : view.x + view.y;
  let drawn = false;
  const robot = () => {
    drawn = true;
    const [sx, sy] = iso(view.x, view.y, view.h + 0.5);
    const dirV = [[TW, -TH], [TW, TH], [-TW, TH], [-TW, -TH]][view.d];
    const facing = dirV[1] > 0, ox = dirV[0] > 0 ? 4 : -4, sq = view.squash || 0;
    out.push(
      <g key="bot" transform={`translate(${sx},${sy})`}>
        <ellipse cx={0} cy={0} rx={17} ry={8} fill="rgba(0,0,0,.16)" />
        <g transform={`scale(${1 + sq * 0.1},${1 - sq * 0.18})`}>
          <rect x={-15} y={-38} width={30} height={34} rx={9} fill="var(--bt-bot)" stroke="var(--bt-bot-lo)" strokeWidth={2.5} />
          <rect x={-10} y={-46} width={20} height={10} rx={4} fill="var(--bt-bot)" stroke="var(--bt-bot-lo)" strokeWidth={2.5} />
          <line x1={0} y1={-46} x2={0} y2={-53} stroke="var(--bt-bot-lo)" strokeWidth={2.5} />
          <circle cx={0} cy={-55} r={3.2} fill="var(--bt-lit-lo)" />
          {facing ? (
            <>
              <circle cx={-6 + ox} cy={-25} r={3.6} fill="var(--bt-eye)" /><circle cx={6 + ox} cy={-25} r={3.6} fill="var(--bt-eye)" />
              <path d={`M${-5 + ox} -16 q5 3.5 10 0`} stroke="var(--bt-bot-lo)" strokeWidth={2.2} fill="none" strokeLinecap="round" />
            </>
          ) : <rect x={-7} y={-30} width={14} height={12} rx={3} fill="none" stroke="var(--bt-bot-lo)" strokeWidth={2} />}
        </g>
      </g>,
    );
  };
  for (const t of tiles) {
    if (!drawn && t.x + t.y > rd + 0.01) robot();
    const top = t.h + 0.5, c = (dx, dy, h) => iso(t.x + dx, t.y + dy, h);
    const B0 = c(-0.5, -0.5, top), R0 = c(0.5, -0.5, top), F0 = c(0.5, 0.5, top), L0 = c(-0.5, 0.5, top);
    const F1 = c(0.5, 0.5, 0), L1 = c(-0.5, 0.5, 0), R1 = c(0.5, -0.5, 0);
    const k = `${t.x},${t.y}`;
    out.push(<polygon key={`a${k}`} points={pts([L0, F0, F1, L1])} fill="var(--bt-side1)" stroke="var(--bt-edge)" strokeWidth={1} strokeLinejoin="round" />);
    out.push(<polygon key={`b${k}`} points={pts([F0, R0, R1, F1])} fill="var(--bt-side2)" stroke="var(--bt-edge)" strokeWidth={1} strokeLinejoin="round" />);
    for (let lv = 1; lv <= t.h; lv++) out.push(<polyline key={`l${k}${lv}`} points={pts([c(-0.5, 0.5, lv), c(0.5, 0.5, lv), c(0.5, -0.5, lv)])} fill="none" stroke="var(--bt-edge)" strokeWidth={0.8} opacity={0.45} />);
    out.push(<polygon key={`t${k}`} points={pts([B0, R0, F0, L0])} fill="var(--bt-tile)" stroke="var(--bt-edge)" strokeWidth={1} strokeLinejoin="round" />);
    const li = lampOf(t.x, t.y);
    if (li >= 0) {
      const on = !!(lit && lit[li]), s = 0.3, q = c(0, 0, top);
      if (on) out.push(<ellipse key={`g${k}`} cx={q[0]} cy={q[1]} rx={TW * 0.95} ry={TH * 0.95} fill="var(--bt-glow)" />);
      out.push(<polygon key={`p${k}`} points={pts([c(-s, -s, top), c(s, -s, top), c(s, s, top), c(-s, s, top)])} fill={on ? 'var(--bt-lit)' : 'var(--bt-lamp)'} stroke={on ? 'var(--bt-lit-lo)' : 'var(--bt-lamp-lo)'} strokeWidth={2.5} strokeLinejoin="round" />);
      out.push(
        <g key={`u${k}`} transform={`translate(${q[0]},${q[1] - 16})`}>
          {on ? <circle cx={0} cy={0} r={13} fill="var(--bt-glow)" /> : null}
          <path d="M0 -9a7 7 0 0 0-4.2 12.6c.9.7 1.4 1.6 1.4 2.7h5.6c0-1.1.5-2 1.4-2.7A7 7 0 0 0 0 -9z" fill={on ? 'var(--bt-lit)' : 'var(--bt-card)'} stroke={on ? 'var(--bt-lit-lo)' : 'var(--bt-lamp-lo)'} strokeWidth={2} />
          <rect x={-2.8} y={7.6} width={5.6} height={2.6} rx={1} fill={on ? 'var(--bt-lit-lo)' : 'var(--bt-lamp-lo)'} />
        </g>,
      );
    }
  }
  if (!drawn) robot();
  // the facing arrow on the floor ahead of the robot, drawn last so it always shows
  {
    const D = [[0, -1], [1, 0], [0, 1], [-1, 0]][view.d], Pp = [-D[1], D[0]];
    const [sx, sy] = iso(view.x, view.y, view.h + 0.5);
    const pr = (a, b) => { const u = D[0] * a + Pp[0] * b, v = D[1] * a + Pp[1] * b; return [sx + (u - v) * TW, sy + (u + v) * TH]; };
    out.push(<polygon key="arrow" points={pts([pr(0.34, -0.09), pr(0.62, -0.09), pr(0.62, -0.24), pr(0.95, 0), pr(0.62, 0.24), pr(0.62, 0.09), pr(0.34, 0.09)])} fill="var(--bt-arrow)" stroke="var(--bt-arrow-edge)" strokeWidth={3} strokeLinejoin="round" paintOrder="stroke" />);
  }
  return (
    <svg className="scene" viewBox={`${x0} ${y0} ${x1 - x0} ${y1 - y0}`} role="img" aria-label={`A board of ${tiles.length} tiles with ${P.lamps.length} lamps`}>
      {out}
    </svg>
  );
}

const BUMP = {
  edge: 'Bumped the edge.', step: 'Forward cannot climb or drop. That needs Jump.', flat: 'Jump only works up a step, down a drop, or over a gap.',
  high: 'Too high to jump. One level up is the most.', gap: 'Nothing to land on past that gap.',
};

function Board({ P, s, setS, active, done, onStage }) {
  const M = modelOf(P);
  const rows = rowsOf(P);
  // Slot rows are one slot tall, measured (lib/use-square-cells.js), not the buttons' own aspect-ratio.
  const botRef = useRef(null);
  useSquareCells(botRef, '.bot-slots', 8);
  const startView = useMemo(() => ({ x: M.start[0], y: M.start[1], h: heightAt(M, M.start[0], M.start[1]), d: M.start[2] }), [M]);
  const [view, setView] = useState(startView);
  const [lit, setLit] = useState(() => new Array(P.lamps.length).fill(0));
  const [rowOn, setRowOn] = useState('main');
  const [busy, setBusy] = useState(false);
  const [fast, setFast] = useState(false);
  const [hi, setHi] = useState(null);
  const [note, setNote] = useState(null);
  const [ansProg, setAnsProg] = useState(null);
  const sess = useRef(null); // { r, i, lastBump }
  const alive = useRef(true);
  const fastRef = useRef(fast); fastRef.current = fast;
  useEffect(() => { alive.current = true; return () => { alive.current = false; }; }, []);
  const live = active && !done;
  const prog = ansProg || (done && s.won ? s.won : s.prog);

  const reset = () => { sess.current = null; setView(startView); setLit(new Array(P.lamps.length).fill(0)); setHi(null); };
  const edit = (fn) => { if (!live || busy) return; reset(); setNote(null); setS((st) => ({ ...st, prog: fn({ ...emptyProg(), ...st.prog }) })); };
  const add = (k) => edit((p) => {
    if (p[rowOn].length >= P.slots[rowOn]) { setNote({ t: 'That row is full. Tap a command in it to take one out.', bad: true }); return p; }
    return { ...p, [rowOn]: p[rowOn] + k };
  });
  const drop = (row, i) => edit((p) => ({ ...p, [row]: p[row].slice(0, i) + p[row].slice(i + 1) }));

  const tween = (ms, fn) => new Promise((res) => {
    const t0 = performance.now();
    const f = (now) => { if (!alive.current) return res(); const t = Math.min(1, (now - t0) / ms); fn(ease(t)); if (t < 1) requestAnimationFrame(f); else res(); };
    requestAnimationFrame(f);
  });
  const play = async (st, from) => {
    const dur = fastRef.current ? 120 : 300;
    const fromH = heightAt(M, st.fx, st.fy), toH = heightAt(M, st.x, st.y);
    setHi({ row: st.row, i: st.i });
    if (st.c === 'F' || st.c === 'J') {
      if (st.bump) {
        const DXv = [0, 1, 0, -1][st.d], DYv = [-1, 0, 1, 0][st.d];
        await tween(dur * 0.6, (t) => { const k = Math.sin(t * Math.PI) * 0.18; setView({ x: st.fx + DXv * k, y: st.fy + DYv * k, h: fromH, d: st.d, depth: st.fx + st.fy, squash: st.c === 'J' ? Math.sin(t * Math.PI) : 0 }); });
        setView({ x: st.x, y: st.y, h: toH, d: st.d }); return;
      }
      const depth = Math.max(st.fx + st.fy, st.x + st.y);
      await tween(st.c === 'J' ? dur * 1.25 : dur, (t) => {
        const arc = st.c === 'J' ? Math.sin(t * Math.PI) * (1.1 + Math.max(0, toH - fromH) * 0.5) : 0;
        setView({ x: st.fx + (st.x - st.fx) * t, y: st.fy + (st.y - st.fy) * t, h: fromH + (toH - fromH) * t + arc, d: st.d, depth });
      });
      setView({ x: st.x, y: st.y, h: toH, d: st.d });
      if (st.c === 'J') await tween(110, (t) => setView({ x: st.x, y: st.y, h: toH, d: st.d, squash: Math.sin(t * Math.PI) }));
      return;
    }
    if (st.c === 'L' || st.c === 'R') { setView({ x: st.x, y: st.y, h: toH, d: st.d }); await sleep(dur * 0.8); return; }
    setLit(st.litSet.slice());
    await tween(dur * 0.7, (t) => setView({ x: st.x, y: st.y, h: toH, d: st.d, squash: Math.sin(t * Math.PI) * 0.5 }));
  };

  const begin = (p) => {
    if (!commandsIn(p)) { setNote({ t: 'Add some commands first.', bad: true }); return false; }
    reset();
    sess.current = { r: run(P, p), i: 0, lastBump: null, prog: p };
    return true;
  };
  const finish = () => {
    const S = sess.current; setHi(null);
    if (!S) return;
    if (S.r.won) {
      if (!ansProg) setS((st) => ({ ...st, won: S.prog }));
      setNote(null);
    } else {
      const why = S.r.why === 'cap' ? 'The robot ran out of steps.' : S.r.why === 'deep' ? 'Too many calls inside calls.' : 'The program ended.';
      setNote({ t: `${why} ${S.r.lit} of ${P.lamps.length} lamps on.${S.lastBump ? ' ' + BUMP[S.lastBump] : ''}`, bad: true });
      sess.current = null;
    }
  };
  const stepOnce = async () => { const S = sess.current; const st = S.r.trace[S.i++]; if (st.bump) S.lastBump = st.bump; await play(st); };
  const runAll = async (p, counted) => {
    if (busy) return;
    if (!sess.current && !begin(p)) return;
    if (counted) setS((st) => ({ ...st, runs: (st.runs || 0) + (sess.current.i === 0 ? 1 : 0) }));
    setBusy(true); setNote({ t: 'Running...', bad: false });
    while (alive.current && sess.current && sess.current.i < sess.current.r.trace.length) await stepOnce();
    if (!alive.current) return;
    setBusy(false); finish();
  };
  const step = async () => {
    if (busy || !live) return;
    let fresh = false;
    if (!sess.current) { if (!begin(s.prog)) return; fresh = true; }
    if (fresh) setS((st) => ({ ...st, runs: (st.runs || 0) + 1 }));
    setBusy(true);
    const S = sess.current;
    if (S.i < S.r.trace.length) { await stepOnce(); setNote({ t: `Step ${S.i} of ${S.r.trace.length}. Run plays the rest.`, bad: false }); }
    if (!alive.current) return;
    setBusy(false);
    if (S.i >= S.r.trace.length) finish();
  };
  const showAnswer = async () => {
    setNote(null);
    try {
      const r = await fetch(`/api/daily-answer?game=bot&num=${P.num}`);
      const j = await r.json();
      if (!j || !j.sol || typeof j.sol !== 'object') throw new Error('no answer');
      const p = { ...emptyProg(), ...j.sol };
      setAnsProg(p); sess.current = null; begin(p);
      setTimeout(() => runAll(p, false), 350);
    } catch (e) { setNote({ t: 'The answer could not be loaded. Try again in a moment.', bad: true }); }
  };

  const can = live && !busy;
  return (
    <div ref={botRef} className="bot" style={{ maxWidth: 640 }}>
      <style dangerouslySetInnerHTML={{ __html: CSS }} />
      <div style={{ width: '100%', maxWidth: 'min(560px, calc((100dvh - 420px) * 1.6))' }}><Scene P={P} view={view} lit={lit} /></div>
      <div className={`bot-msg${note && note.bad ? ' bad' : ''}`} aria-live="polite">{ansProg ? `The answer: ${cmdsOf(commandsIn(ansProg))}${P.sunday ? ' (par)' : ', the fewest possible'}.` : note ? note.t : ''}</div>
      {live ? (
        <div className="bot-act">
          <button type="button" className="sd-tool go" onClick={() => runAll(s.prog, true)} disabled={!can} style={{ opacity: can ? 1 : 0.4 }}>Run</button>
          <button type="button" className="sd-tool" onClick={step} disabled={!can} style={{ opacity: can ? 1 : 0.4 }}>Step</button>
          <button type="button" className={`sd-tool${fast ? ' on' : ''}`} onClick={() => setFast((v) => !v)} aria-pressed={fast}>Fast</button>
          <button type="button" className="sd-tool" onClick={() => edit(() => emptyProg())} disabled={!can || !commandsIn(s.prog)} style={{ opacity: can && commandsIn(s.prog) ? 1 : 0.4 }}>Clear</button>
        </div>
      ) : null}
      {live ? (
        <div className="bot-pal" style={{ gridTemplateColumns: `repeat(${5 + rows.length - 1},1fr)` }}>
          {CMDS.map((c) => <button key={c.k} type="button" className="bot-cmd" onClick={() => add(c.k)} disabled={!can}><Icon k={c.k} />{c.n}</button>)}
          {CALLS.filter((c) => rows.includes(c.row)).map((c) => <button key={c.k} type="button" className="bot-cmd" onClick={() => add(c.k)} disabled={!can}><Icon k={c.k} />{c.n}</button>)}
        </div>
      ) : null}
      {rows.map((row) => (
        <div key={row} role="button" tabIndex={0} className={`bot-row${live && rowOn === row ? ' on' : ''}`} onClick={() => live && setRowOn(row)} onKeyDown={(e) => { if (e.key === 'Enter' && live) setRowOn(row); }}>
          <div className="nm">{ROW_NAME[row]}<small>{P.slots[row]} slots</small></div>
          <div className="bot-slots">
            {Array.from({ length: 8 }, (_, i) => {
              const k = (prog[row] || '')[i];
              const off = i >= P.slots[row];
              const now = hi && hi.row === row && hi.i === i;
              return (
                <button key={i} type="button" className={`bot-slot${k ? ' full' : ''}${off ? ' off' : ''}${now ? ' now' : ''}`} aria-label={k ? `Remove ${k}` : 'Empty slot'}
                  onClick={(e) => { e.stopPropagation(); if (k) drop(row, i); else if (live) setRowOn(row); }}>
                  {k ? <Icon k={k} /> : null}
                </button>
              );
            })}
          </div>
        </div>
      ))}
      {done && !onStage ? (
        <button type="button" className="sd-tool" onClick={ansProg ? () => { setAnsProg(null); reset(); } : showAnswer} disabled={busy} style={{ opacity: busy ? 0.4 : 1 }}>
          {ansProg ? 'Back to my program' : 'Show the answer'}
        </button>
      ) : null}
    </div>
  );
}

const progOk = (P, p) => !!p && legalProgram(P, { ...emptyProg(), ...p });

export const GAME = {
  key: 'bot', name: 'Bot', cat: 'Logic', miss: 'Commands', missOne: 'command',
  fresh: () => ({ prog: emptyProg(), runs: 0, won: null }),
  validSave: (P, s) => !!s && progOk(P, s.prog) && Number.isInteger(s.runs) && (s.won == null || progOk(P, s.won)),
  touched: (s) => (s.runs || 0) > 0 || commandsIn(s.prog) > 0,
  solved: (P, s) => !!s.won && run(P, { ...emptyProg(), ...s.won }, { trace: false }).won,
  count: (s) => commandsIn(s.won || s.prog),
  metric: (P, s, won) => (won ? commandsIn(s.won) : null),
  result: (P, s, won) => ({ score: won ? 10 : 0, total: 10, correct: won ? 1 : 0, guessesUsed: won ? commandsIn(s.won) : commandsIn(s.prog) }),
  Board,
  wide: true,
  eyebrow: (P, s, { sundayLabel }) => `${sundayLabel || BAND[P.band]} · ${P.title} · No. ${P.num}`,
  foot: (P, s) => `${cmdsOf(commandsIn(s.won || s.prog))} · par ${P.par} · ${s.runs || 0} ${(s.runs || 0) === 1 ? 'run' : 'runs'}`,
  sundayLabel: () => 'Sunday Edition',
  gateTitle: (P) => `Today: the ${P.title}, ${P.lamps.length} lamps`,
  gateLine: (P) => `Write a program that walks the robot to every lamp and switches it on. Runs are free; the program that finishes the board is your score. Par today is ${cmdsOf(P.par)}${P.sunday ? ', with P2 and P3 to help' : ''}.`,
  rules: (P) => ({
    lead: 'Switch on every lamp.',
    steps: [
      <>Tap a command to add it to the <b>active row</b>. Tap a row to make it active, and tap a placed command to take it out.</>,
      <><b>Forward</b> moves one tile on the same level. <b>Jump</b> goes up one level, down any drop, or over a one-tile gap. <b>Left</b> and <b>Right</b> turn in place. The arrow on the floor shows which way the robot faces.</>,
      <>Each blue tile with a bulb is a <b>lamp</b>. Stand on it and use <b>Light up</b> to switch it on: it turns gold. Light up again switches it back off.</>,
      <><b>P1</b> runs the whole P1 row, then carries on. A row can call itself, and the run stops the moment every lamp is on.{P.sunday ? <> Sunday adds <b>P2</b> and <b>P3</b>, and rows can call each other.</> : null}</>,
      <>Press <b>Run</b>, or <b>Step</b> to go one command at a time. Runs are free: only the program that finishes counts.</>,
    ],
    knack: 'Look for the part of the walk that repeats, put it in P1 once, and let Main (or P1 itself) call it.',
    footer: 'A finished board ranks on commands, fewest first, then the clock. Weekday par is the fewest possible; Sunday par is the best line the setter found. Once the day is over, Show the answer plays the par program.',
  }),
  pitch: (P) => `${P.lamps.length} lamps on the ${P.title}. Light them all in ${cmdsOf(P.par)} or fewer.`,
  shareLine: (P, s, won, el) => `Bot #${P.num} · ${P.title} · ${won ? `${cmdsOf(commandsIn(s.won))} (par ${P.par}) · ${el}` : 'unfinished'}`,
  detail: (P, s, won, el) => `${P.title} · ${won ? cmdsOf(commandsIn(s.won)) : 'unfinished'}, par ${P.par} · ${el}`,
  aboutTitle: 'About Bot',
  about: [
    'Bot is a free daily programming puzzle from Mind Loft, in the spirit of Logo turtles and Light-bot. A little robot stands on a 3D board of tiles at different heights, and you write its program: Forward, Jump, Left, Right and Light up, laid out in a Main row and a P1 row that Main can call.',
    'The goal is every lamp switched on. Light up turns on the lamp the robot is standing on, and turns it back off if it is already on. Forward only works on the level, so steps up and drops need Jump, which also clears a one-tile gap. P1 can call itself, and the run ends the moment the last lamp lights, which is how the shortest programs are written.',
    'Monday and Tuesday are small boards, the week builds through Saturday, and the Sunday Edition adds P2 and P3 on a bigger board. Weekday par is the fewest commands possible, proved by trying every shorter program before the board is dealt. Runs are free; the fewest commands top the leaderboard, with the clock breaking a tie.',
    <>More puzzles about planning ahead: <a href="/chef" style={{ color: 'inherit', fontWeight: 800 }}>Chef</a>, <a href="/mop" style={{ color: 'inherit', fontWeight: 800 }}>Mop</a> and <a href="/machine" style={{ color: 'inherit', fontWeight: 800 }}>Machine</a>.</>,
  ],
};

export default function BotClient(props) {
  return <SimpleDaily {...props} game={GAME} />;
}
