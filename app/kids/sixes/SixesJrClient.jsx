'use client';

import { useState, useEffect, useMemo, useRef } from 'react';
import KidsShell, { useKidsSave, SHAPES, Confetti } from '../KidsShell';

// Shape Sixes. Six shapes instead of six digits, and the grown-up Sixes
// interaction model rather than a tray off to the side (owner, 2026-09-12:
// the two-column version was "really tough to use"):
//   - ONE column: board, then the shape pad directly under it, then controls.
//   - ARM a shape from the pad and drop it into square after square; the pad
//     button stays lit until you tap it again. With a shape armed the board
//     lights every square already holding it, EXACTLY the grown-up shading
//     and nothing more: an earlier cut also greyed every square the shape
//     could not go in, which handed the answer over (owner, 2026-09-12:
//     "gives away answers too easily"). A kid has to look along the row,
//     down the column and around the box, the same as a grown-up.
//   - Or tap a square first, then a shape, the classic way. That fills the
//     square and does NOT arm the shape.
//   - Each pad button shows how many of that shape are still to place.
//   - A conflict is a shake, never a strike; Undo takes any move back.
// The Numbers toggle shows 1-6 for kids who are ready to read a real sudoku.

const CSS = `
.sx-stack{max-width:440px;margin:0 auto}
.sx-board{display:grid;grid-template-columns:repeat(6,1fr);background:var(--kink);border:4px solid var(--kink);border-radius:18px;overflow:hidden;width:100%;aspect-ratio:1}
.sx-cell{background:var(--ktile);display:flex;align-items:center;justify-content:center;cursor:pointer;position:relative;border:1px solid #e6dcc6;padding:0;font:inherit;-webkit-tap-highlight-color:transparent}
.sx-cell svg{width:64%;height:64%;transition:transform .12s}
.sx-cell.given{background:#f3ecd8}
.sx-cell.given svg{transform:scale(.92)}
.sx-cell.peer{background:#f4efe2}
.sx-cell.same{background:#dbe8ff}
.sx-cell.same svg{transform:scale(1.06)}
.sx-cell.sel{outline:4px solid var(--kblue);outline-offset:-4px;z-index:2;background:#e9f1ff}
.sx-cell.num span{font-family:var(--kdisp);font-weight:700;font-size:clamp(22px,4.8vw,34px)}
.sx-cell.given.num span{color:var(--kink2)}
.sx-cell:nth-child(3n){border-right:3px solid var(--kink)}
.sx-cell:nth-child(n+13):nth-child(-n+18),.sx-cell:nth-child(n+25):nth-child(-n+30){border-top:3px solid var(--kink)}
.sx-board.won .sx-cell{animation:kdpop .5s both}
.sx-board.won .sx-cell:nth-child(6n+2){animation-delay:.05s}.sx-board.won .sx-cell:nth-child(6n+3){animation-delay:.1s}.sx-board.won .sx-cell:nth-child(6n+4){animation-delay:.15s}.sx-board.won .sx-cell:nth-child(6n+5){animation-delay:.2s}.sx-board.won .sx-cell:nth-child(6n+6){animation-delay:.25s}
.sx-pad{display:grid;grid-template-columns:repeat(6,1fr);gap:8px;margin-top:14px}
.sx-pad button{aspect-ratio:1;border:3px solid var(--kline);background:var(--ktile);border-radius:16px;cursor:pointer;box-shadow:0 4px 0 #e9d9ad;display:flex;align-items:center;justify-content:center;padding:0;position:relative;transition:transform .1s,background .1s;-webkit-tap-highlight-color:transparent}
.sx-pad button svg{width:60%;height:60%}
.sx-pad button span.n{font-family:var(--kdisp);font-weight:700;font-size:clamp(22px,6vw,30px)}
.sx-pad button .left{position:absolute;right:5px;bottom:3px;font-family:var(--kdisp);font-weight:700;font-size:12px;color:var(--kink2);background:var(--kpaper);border-radius:999px;min-width:18px;height:18px;line-height:18px;text-align:center;border:1.5px solid var(--kline)}
.sx-pad button.on{border-color:var(--kblue);background:#dbe8ff;box-shadow:0 4px 0 var(--kblue);transform:translateY(-2px)}
.sx-pad button.on .left{background:var(--kblue);color:#fff;border-color:var(--kblue)}
.sx-pad button.done{opacity:.3}
.sx-status{margin-top:12px;min-height:22px;font-family:var(--kdisp);font-weight:600;font-size:15px;color:var(--kink2);display:flex;align-items:center;gap:6px;flex-wrap:wrap}
.sx-status.on{color:var(--kblue)}
.sx-status svg{width:22px;height:22px}
.sx-left{margin-top:8px;font-size:14px;color:var(--kink2)}
.sx-left b{font-family:var(--kdisp);font-size:18px;color:var(--kink)}
.sx-stack .kd-ctrls{margin-top:12px}
`;

function fmt(s) { return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`; }

export default function SixesJrClient({ game, board, dayKey, dayNum, dayLabel, todayNum }) {
  const given = board ? board.given : null;
  const sol = board ? board.sol : null;
  const [g, setG, ready] = useKidsSave('sixes', dayKey, {
    grid: given ? given.map((r) => r.slice()) : null, hints: 0, secs: 0, done: false,
  });
  const [sel, setSel] = useState(null);      // [r, c] of a tapped square (classic order)
  const [armed, setArmed] = useState(0);     // shape picked up from the pad (1-6, 0 = none)
  const [mode, setMode] = useState('shape');
  const [shake, setShake] = useState(null);
  const [cheer, setCheer] = useState(false);
  const undoRef = useRef([]);
  const [canUndo, setCanUndo] = useState(false);

  // A save from a different board (the bank cycled under a stale save) is
  // discarded rather than drawn over the wrong givens.
  useEffect(() => {
    if (!ready || !given || !g.grid) return;
    const fits = g.grid.every((row, r) => row.every((v, c) => !given[r][c] || v === given[r][c]));
    if (!fits) setG({ grid: given.map((r) => r.slice()), hints: 0, secs: 0, done: false });
  }, [ready, given, g.grid, setG]);

  const grid = g.grid || (given ? given.map((r) => r.slice()) : null);

  useEffect(() => {
    if (!ready || g.done) return undefined;
    const t = setInterval(() => setG((s) => ({ ...s, secs: (s.secs || 0) + 1 })), 1000);
    return () => clearInterval(t);
  }, [ready, g.done, setG]);

  const counts = useMemo(() => {
    const c = [0, 0, 0, 0, 0, 0, 0];
    if (grid) grid.forEach((r) => r.forEach((v) => { if (v) c[v]++; }));
    return c;
  }, [grid]);
  const empty = grid ? grid.flat().filter((v) => !v).length : 0;

  // The sixth copy of an armed shape puts it down for you, like the grown-up
  // pad marking a digit done, so the next tap on the board does not shake.
  useEffect(() => { if (armed && counts[armed] >= 6) setArmed(0); }, [armed, counts]);

  if (!board || !grid) {
    return (
      <KidsShell game={game} dayKey={dayKey} dayNum={dayNum} dayLabel={dayLabel} todayNum={todayNum}>
        <div className="kd-card">No board today. Come back tomorrow!</div>
      </KidsShell>
    );
  }

  const glyph = (v) => (mode === 'shape'
    ? <span dangerouslySetInnerHTML={{ __html: SHAPES[v] }} style={{ display: 'contents' }} />
    : <span className="n">{v}</span>);
  const NAMES = ['', 'circle', 'star', 'heart', 'triangle', 'square', 'diamond'];

  function conflicts(r, c, v) {
    for (let i = 0; i < 6; i++) {
      if (i !== c && grid[r][i] === v) return true;
      if (i !== r && grid[i][c] === v) return true;
    }
    const r0 = r - (r % 2); const c0 = c - (c % 3);
    for (let i = r0; i < r0 + 2; i++) for (let j = c0; j < c0 + 3; j++) if ((i !== r || j !== c) && grid[i][j] === v) return true;
    return false;
  }

  function pushUndo() {
    undoRef.current.push(grid.map((row) => row.slice()));
    if (undoRef.current.length > 60) undoRef.current.shift();
    if (!canUndo) setCanUndo(true);
  }
  function undo() {
    const prev = undoRef.current.pop();
    setCanUndo(undoRef.current.length > 0);
    if (!prev || g.done) return;
    setG((s) => ({ ...s, grid: prev }));
  }

  function commit(next) {
    const won = next.every((row, r) => row.every((v, c) => v === sol[r][c]));
    setG((s) => ({ ...s, grid: next, done: s.done || won }));
    if (won) { setSel(null); setArmed(0); setCheer(true); }
  }

  // Put shape v into (r, c). Same shape again clears it; a conflict shakes the
  // square and changes nothing; otherwise it lands (replacing whatever was there).
  function place(r, c, v) {
    if (given[r][c] || g.done) return;
    if (grid[r][c] === v) { pushUndo(); const n = grid.map((row) => row.slice()); n[r][c] = 0; commit(n); return; }
    if (v && conflicts(r, c, v)) { setShake(r * 6 + c); setTimeout(() => setShake(null), 400); return; }
    pushUndo();
    const next = grid.map((row) => row.slice());
    next[r][c] = v;
    commit(next);
  }

  // Board tap. With a shape armed it drops that shape and leaves nothing
  // selected, so the next pad tap switches shapes rather than overwriting the
  // square just filled (that was the bug in the first build). With nothing
  // armed it selects the square for a shape to follow.
  function onCell(r, c) {
    if (g.done) return;
    if (armed) { if (!given[r][c]) place(r, c, armed); return; }
    if (given[r][c]) { setSel(null); return; }
    setSel(sel && sel[0] === r && sel[1] === c ? null : [r, c]);
  }

  // Pad tap. With a square selected it fills that square and does NOT arm,
  // exactly like the grown-up pad. Otherwise it arms (or disarms) the shape.
  function onPad(v) {
    if (g.done) return;
    if (sel && !armed) { place(sel[0], sel[1], v); return; }
    setSel(null);
    setArmed((a) => (a === v ? 0 : v));
  }

  function hint() {
    if (g.done) return;
    const wrong = [];
    for (let r = 0; r < 6; r++) for (let c = 0; c < 6; c++) if (grid[r][c] !== sol[r][c]) wrong.push([r, c]);
    if (!wrong.length) return;
    const target = sel && grid[sel[0]][sel[1]] !== sol[sel[0]][sel[1]] ? sel : wrong[Math.floor(Math.random() * wrong.length)];
    pushUndo();
    const next = grid.map((row) => row.slice());
    next[target[0]][target[1]] = sol[target[0]][target[1]];
    setSel(target); setArmed(0);
    setG((s) => ({ ...s, hints: (s.hints || 0) + 1 }));
    commit(next);
  }

  function reset() {
    undoRef.current = []; setCanUndo(false);
    setG({ grid: given.map((r) => r.slice()), hints: 0, secs: 0, done: false });
    setSel(null); setArmed(0); setCheer(false);
  }

  function onKey(e) {
    if (g.done) return;
    const k = e.key;
    if (k >= '1' && k <= '6') { if (sel) place(sel[0], sel[1], +k); else setArmed((a) => (a === +k ? 0 : +k)); }
    else if (k === 'Escape') { setArmed(0); setSel(null); }
    else if ((k === 'Backspace' || k === 'Delete' || k === '0') && sel) { if (!given[sel[0]][sel[1]] && grid[sel[0]][sel[1]]) place(sel[0], sel[1], grid[sel[0]][sel[1]]); }
    else if (k.startsWith('Arrow')) {
      e.preventDefault();
      let [r, c] = sel || [0, 0];
      if (k === 'ArrowUp') r = (r + 5) % 6; if (k === 'ArrowDown') r = (r + 1) % 6;
      if (k === 'ArrowLeft') c = (c + 5) % 6; if (k === 'ArrowRight') c = (c + 1) % 6;
      setSel([r, c]);
    }
  }

  // Selection-aware shading, the way the grown-up board does it: the armed
  // shape (or the shape in the selected square) lights every square holding
  // it, and the selected square's row, column and box shade lightly. No
  // off-limits shading: that is the solving, and it stays with the kid.
  const hlVal = armed || (sel ? grid[sel[0]][sel[1]] : 0);
  function cellCls(r, c) {
    const v = grid[r][c];
    const isSel = sel && sel[0] === r && sel[1] === c;
    if (isSel) return ' sel';
    if (hlVal && v === hlVal) return ' same';
    if (sel && (r === sel[0] || c === sel[1] || (r - (r % 2) === sel[0] - (sel[0] % 2) && c - (c % 3) === sel[1] - (sel[1] % 3)))) return ' peer';
    return '';
  }

  const status = g.done
    ? null
    : armed
      ? <><span>Placing</span>{glyph(armed)}<span>Tap every square it goes in. Blue squares already have one.</span></>
      : sel
        ? <span>Now tap a shape below.</span>
        : <span>Tap a shape below, then the squares it goes in.</span>;

  return (
    <KidsShell game={game} dayKey={dayKey} dayNum={dayNum} dayLabel={dayLabel} todayNum={todayNum}>
      <style dangerouslySetInnerHTML={{ __html: CSS }} />
      <Confetti go={cheer} />
      <div className="kd-card">
        <div className="sx-stack">
          <div className={`sx-board${g.done ? ' won' : ''}`} role="grid" aria-label="Shape Sixes board" tabIndex={0} onKeyDown={onKey}>
            {grid.map((row, r) => row.map((v, c) => (
              <button
                key={`${r}-${c}`}
                type="button"
                role="gridcell"
                className={`sx-cell${given[r][c] ? ' given' : ''}${mode === 'num' ? ' num' : ''}${cellCls(r, c)}${shake === r * 6 + c ? ' kd-shake' : ''}`}
                onClick={() => onCell(r, c)}
                aria-label={`Row ${r + 1} column ${c + 1}${v ? `, ${NAMES[v]}` : ', empty'}`}
              >
                {v ? glyph(v) : null}
              </button>
            )))}
          </div>

          <div className="sx-pad" role="toolbar" aria-label="Shapes">
            {[1, 2, 3, 4, 5, 6].map((v) => {
              const left = 6 - counts[v];
              return (
                <button key={v} type="button" className={`${armed === v ? 'on' : ''}${left === 0 ? ' done' : ''}`} onClick={() => { if (left > 0 || armed === v) onPad(v); }} aria-label={`${NAMES[v]}, ${left} left`} aria-pressed={armed === v}>
                  {glyph(v)}
                  {left > 0 && <span className="left">{left}</span>}
                </button>
              );
            })}
          </div>
          <div className={`sx-status${armed ? ' on' : ''}`} aria-live="polite">{status}</div>

          <div className="kd-ctrls">
            <div className="kd-seg">
              <button type="button" className={mode === 'shape' ? 'on' : ''} onClick={() => setMode('shape')}>Shapes</button>
              <button type="button" className={mode === 'num' ? 'on' : ''} onClick={() => setMode('num')}>Numbers</button>
            </div>
            <button type="button" className="kd-btn" onClick={undo} disabled={!canUndo || g.done}>Undo</button>
            <button type="button" className="kd-btn" onClick={hint} disabled={g.done}>Show me one</button>
            <button type="button" className="kd-btn" onClick={reset}>Start over</button>
          </div>
          <div className="kd-stats">
            <div>Empty squares<b>{empty}</b></div>
            <div>Time<b>{fmt(g.secs || 0)}</b></div>
            <div>Hints<b>{g.hints || 0}</b></div>
          </div>
          <div className={`kd-cheer${g.done ? ' show' : ''}`}>
            <span>You did it! 🎉</span>
            <small>Every row, column and box has all six shapes. Try another one below, or come back tomorrow.</small>
          </div>
          <div className="kd-side">
            <h2>Tap a shape, then tap where it goes.</h2>
            <p className="kd-how">Each row, each column and each box needs all six shapes, one of each. Pick a shape from the row under the board: the squares that already have it turn blue, and the little number says how many are still to place. Look along the row, down the column and around the box before you tap. If a shape cannot go there, the square just shakes. Tap a shape you placed to take it back, or press Undo. Nothing counts against you.</p>
          </div>
        </div>
      </div>
    </KidsShell>
  );
}
