'use client';

import { useState, useMemo, useEffect } from 'react';
import KidsShell, { useKidsSave, Confetti } from '../KidsShell';
import { fromData, grid, moves as legalSlides, apply, solved } from '@/lib/jam-core';

// Unpark. A 6x6 lot, the red car on the exit row, every other car stuck to
// its own lane. Tap a car, then tap where it should go; the car slides as far
// as that. Drive the red car through the gap on the right and the lot is done.
// The move rules are lib/jam-core's, the same engine Parker plays by, so a
// kid's solve here is a real Parker solve.

const N = 6;
const EXIT_ROW = 2;
const CAR_HUES = ['#3a86ff', '#3bb273', '#ff9f1c', '#8e5ae0', '#ffd23f', '#ff7bb0', '#0ea5e9', '#a16207', '#14b8a6', '#f97316', '#84cc16', '#6366f1'];

const CSS = `
.up-lot{position:relative;width:100%;max-width:420px;aspect-ratio:1;background:#f3ecd8;border:6px solid var(--kink);border-radius:20px;overflow:visible}
.up-lot::before{content:'';position:absolute;inset:0;background-image:linear-gradient(#e6dcc6 1px,transparent 1px),linear-gradient(90deg,#e6dcc6 1px,transparent 1px);background-size:calc(100%/6) calc(100%/6);border-radius:14px}
.up-exit{position:absolute;right:-6px;top:calc(100%*2/6);height:calc(100%/6);width:6px;background:#f3ecd8;border-radius:0 4px 4px 0}
.up-exit::after{content:'→';position:absolute;right:-26px;top:50%;transform:translateY(-50%);font-family:var(--kdisp);font-weight:700;font-size:22px;color:var(--kgreen)}
.up-cell{position:absolute;width:calc(100%/6);height:calc(100%/6);border:0;background:transparent;padding:0;cursor:default}
.up-cell.tgt{cursor:pointer}
.up-cell.tgt::after{content:'';position:absolute;inset:38%;border-radius:50%;background:var(--kblue);opacity:.55}
.up-car{position:absolute;padding:5px;transition:left .22s ease,top .22s ease;cursor:pointer;border:0;background:transparent}
.up-car .up-body{width:100%;height:100%;border-radius:12px;box-shadow:inset 0 -5px 0 rgba(0,0,0,.18),0 3px 0 rgba(0,0,0,.12);position:relative}
.up-car .up-body::before,.up-car .up-body::after{content:'';position:absolute;background:rgba(255,255,255,.45);border-radius:4px}
.up-car.h .up-body::before{left:18%;top:20%;width:24%;height:60%}
.up-car.h .up-body::after{right:18%;top:20%;width:24%;height:60%}
.up-car.v .up-body::before{top:14%;left:20%;height:22%;width:60%}
.up-car.v .up-body::after{bottom:14%;left:20%;height:22%;width:60%}
.up-car.sel .up-body{outline:4px solid var(--kink);outline-offset:-2px}
.up-car.red .up-body{background:var(--kred)}
.up-car.gone{transition:left .6s ease-in}
.up-lot.won .up-cell{display:none}
`;

export default function UnparkClient({ game, board, dayKey, dayNum, dayLabel, todayNum }) {
  const start = () => (board ? board.pieces.map((p) => p.slice()) : []);
  const [g, setG] = useKidsSave('unpark', dayKey, { pieces: start(), moves: 0, done: false });
  const [sel, setSel] = useState(null);
  const [shake, setShake] = useState(false);
  const [cheer, setCheer] = useState(false);
  const [gone, setGone] = useState(false);

  const data = g.pieces && g.pieces.length === (board ? board.pieces.length : 0) ? g.pieces : start();
  const ps = useMemo(() => fromData(data), [data]);
  const legal = useMemo(() => legalSlides(ps, N), [ps]);
  const occ = useMemo(() => grid(ps, N), [ps]);

  useEffect(() => { if (g.done) setGone(true); }, [g.done]);

  if (!board) {
    return (
      <KidsShell game={game} dayKey={dayKey} dayNum={dayNum} dayLabel={dayLabel} todayNum={todayNum}>
        <div className="kd-card">No lot today. Come back tomorrow!</div>
      </KidsShell>
    );
  }

  // Cells the selected car can reach, keyed "r,c".
  const targets = new Set();
  if (sel != null && !g.done) {
    const p = ps[sel];
    for (const [i, d] of legal) {
      if (i !== sel) continue;
      const np = p.pos + d;
      for (let k = 0; k < p.len; k++) {
        const r = p.horiz ? p.fixed : np + k;
        const c = p.horiz ? np + k : p.fixed;
        if (occ && occ[r][c] === -1) targets.add(`${r},${c}`);
      }
    }
  }

  function slideTo(r, c) {
    if (sel == null || g.done) return;
    const p = ps[sel];
    const along = p.horiz ? c : r;
    const other = p.horiz ? r : c;
    if (other !== p.fixed) return;
    let d;
    if (along < p.pos) d = along - p.pos;
    else if (along >= p.pos + p.len) d = along - (p.pos + p.len - 1);
    else return;
    const ok = legal.some(([i, dd]) => i === sel && dd === d);
    if (!ok) { setShake(true); setTimeout(() => setShake(false), 400); return; }
    const next = apply(ps, [sel, d]);
    const won = solved(next, N);
    setG((s) => ({ ...s, pieces: next.map((q) => [q.len, q.horiz ? 1 : 0, q.fixed, q.pos]), moves: (s.moves || 0) + 1, done: s.done || won }));
    setSel(null);
    if (won) setCheer(true);
  }

  function reset() { setG({ pieces: start(), moves: 0, done: false }); setSel(null); setCheer(false); setGone(false); }

  const cell = 100 / N;

  return (
    <KidsShell game={game} dayKey={dayKey} dayNum={dayNum} dayLabel={dayLabel} todayNum={todayNum}>
      <style dangerouslySetInnerHTML={{ __html: CSS }} />
      <Confetti go={cheer} />
      <div className="kd-card kd-game">
        <div>
          <div className={`up-lot${g.done ? ' won' : ''}${shake ? ' kd-shake' : ''}`} aria-label="Parking lot">
            <div className="up-exit" aria-hidden="true" />
            {Array.from({ length: N * N }, (_, k) => {
              const r = Math.floor(k / N); const c = k % N;
              const t = targets.has(`${r},${c}`);
              return (
                <button
                  key={k}
                  type="button"
                  className={`up-cell${t ? ' tgt' : ''}`}
                  style={{ left: `${c * cell}%`, top: `${r * cell}%` }}
                  onClick={() => (t ? slideTo(r, c) : setSel(null))}
                  aria-label={t ? `Slide here, row ${r + 1} column ${c + 1}` : ''}
                  tabIndex={t ? 0 : -1}
                />
              );
            })}
            {ps.map((p, i) => {
              const isRed = i === 0;
              const left = (p.horiz ? p.pos : p.fixed) * cell;
              const top = (p.horiz ? p.fixed : p.pos) * cell;
              const w = (p.horiz ? p.len : 1) * cell;
              const h = (p.horiz ? 1 : p.len) * cell;
              const out = isRed && gone;
              return (
                <button
                  key={i}
                  type="button"
                  className={`up-car ${p.horiz ? 'h' : 'v'}${isRed ? ' red' : ''}${sel === i ? ' sel' : ''}${out ? ' gone' : ''}`}
                  style={{ left: `${out ? 130 : left}%`, top: `${top}%`, width: `${w}%`, height: `${h}%` }}
                  onClick={() => { if (!g.done) setSel(sel === i ? null : i); }}
                  aria-label={isRed ? 'The red car' : `Car ${i}`}
                  aria-pressed={sel === i}
                >
                  <div className="up-body" style={isRed ? undefined : { background: CAR_HUES[i % CAR_HUES.length] }} />
                </button>
              );
            })}
          </div>
        </div>
        <div className="kd-side">
          <h2>Tap a car, then tap where it goes.</h2>
          <p className="kd-how">Every car only slides along its own lane: sideways cars go left and right, up-and-down cars go up and down. Get the other cars out of the way so the <b>red car</b> can drive out through the gap on the right. Blue dots show where a car can go.</p>
          <div className="kd-stats"><div>Moves<b>{g.moves || 0}</b></div><div>Fewest possible<b>{board.par}</b></div></div>
          <div className="kd-ctrls"><button type="button" className="kd-btn" onClick={reset}>Start over</button></div>
          <div className={`kd-cheer${g.done ? ' show' : ''}`}>
            <span>Vroom! The red car is out! 🎉</span>
            <small>{(g.moves || 0) <= board.par ? `${g.moves} moves, the fewest there is.` : `${g.moves} moves. It can be done in ${board.par}. Want another go? Start over.`}</small>
          </div>
        </div>
      </div>
    </KidsShell>
  );
}
