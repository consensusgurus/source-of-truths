'use client';

import { useState, useEffect, useMemo } from 'react';
import KidsShell, { useKidsSave, SHAPES, Confetti } from '../KidsShell';

// Shape Sixes. Six shapes instead of six digits, a tray to pick from, and a
// conflict is a shake rather than a strike: a shape already in that row,
// column or box simply will not stick. Nothing is scored against the kid.
// The Numbers toggle shows 1-6 for kids who are ready to read a real sudoku.

const CSS = `
.sx-board{display:grid;grid-template-columns:repeat(6,1fr);background:var(--kink);border:4px solid var(--kink);border-radius:18px;overflow:hidden;width:100%;max-width:420px;aspect-ratio:1}
.sx-cell{background:var(--ktile);display:flex;align-items:center;justify-content:center;cursor:pointer;position:relative;border:1px solid #e6dcc6;padding:0;font:inherit}
.sx-cell svg{width:64%;height:64%;transition:transform .12s}
.sx-cell.given{background:#f3ecd8}
.sx-cell.given svg{transform:scale(.92)}
.sx-cell.peer{background:#f4efe2}
.sx-cell.same{background:#dbe8ff}
.sx-cell.same svg{transform:scale(1.06)}
.sx-cell.off{background:#ece6d8;background-image:radial-gradient(#d9d0bb 1.2px,transparent 1.4px);background-size:8px 8px;cursor:not-allowed}
.sx-cell.off::after{content:'';position:absolute;inset:38%;border-radius:50%;background:#d3c9b2}
.sx-cell.sel{outline:4px solid var(--kblue);outline-offset:-4px;z-index:2;background:#e9f1ff}
.sx-cell.num span{font-family:var(--kdisp);font-weight:700;font-size:clamp(22px,4.8vw,34px)}
.sx-cell.given.num span{color:var(--kink2)}
.sx-cell:nth-child(3n){border-right:3px solid var(--kink)}
.sx-cell:nth-child(n+13):nth-child(-n+18),.sx-cell:nth-child(n+25):nth-child(-n+30){border-top:3px solid var(--kink)}
.sx-board.won .sx-cell{animation:kdpop .5s both}
.sx-board.won .sx-cell:nth-child(6n+2){animation-delay:.05s}.sx-board.won .sx-cell:nth-child(6n+3){animation-delay:.1s}.sx-board.won .sx-cell:nth-child(6n+4){animation-delay:.15s}.sx-board.won .sx-cell:nth-child(6n+5){animation-delay:.2s}.sx-board.won .sx-cell:nth-child(6n+6){animation-delay:.25s}
.sx-tray{display:grid;grid-template-columns:repeat(6,1fr);gap:8px;max-width:420px}
.sx-tray button{aspect-ratio:1;border:2px solid var(--kline);background:var(--ktile);border-radius:16px;cursor:pointer;box-shadow:0 4px 0 #e9d9ad;display:flex;align-items:center;justify-content:center;padding:0;transition:transform .1s}
.sx-tray button svg{width:62%;height:62%}
.sx-tray button span{font-family:var(--kdisp);font-weight:700;font-size:26px}
.sx-tray button.on{transform:translateY(3px);box-shadow:0 1px 0 #e9d9ad;border-color:var(--kblue);background:#e9f1ff}
.sx-tray button.done{opacity:.35}
.sx-left{margin-top:10px;font-size:14px;color:var(--kink2)}
.sx-left b{font-family:var(--kdisp);font-size:18px;color:var(--kink)}
`;

function fmt(s) { return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`; }

export default function SixesJrClient({ game, board, dayKey, dayNum, dayLabel }) {
  const given = board ? board.given : null;
  const sol = board ? board.sol : null;
  const [g, setG, ready] = useKidsSave('sixes', dayKey, {
    grid: given ? given.map((r) => r.slice()) : null, hints: 0, secs: 0, done: false,
  });
  const [sel, setSel] = useState(null);
  const [pick, setPick] = useState(null);
  const [mode, setMode] = useState('shape');
  const [shake, setShake] = useState(null);
  const [cheer, setCheer] = useState(false);

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

  if (!board || !grid) {
    return (
      <KidsShell game={game} dayKey={dayKey} dayNum={dayNum} dayLabel={dayLabel}>
        <div className="kd-card">No board today. Come back tomorrow!</div>
      </KidsShell>
    );
  }

  const glyph = (v) => (mode === 'shape'
    ? <span dangerouslySetInnerHTML={{ __html: SHAPES[v] }} style={{ display: 'contents' }} />
    : <span>{v}</span>);

  function conflicts(r, c, v) {
    for (let i = 0; i < 6; i++) {
      if (i !== c && grid[r][i] === v) return true;
      if (i !== r && grid[i][c] === v) return true;
    }
    const r0 = r - (r % 2); const c0 = c - (c % 3);
    for (let i = r0; i < r0 + 2; i++) for (let j = c0; j < c0 + 3; j++) if ((i !== r || j !== c) && grid[i][j] === v) return true;
    return false;
  }

  function commit(next) {
    const won = next.every((row, r) => row.every((v, c) => v === sol[r][c]));
    setG((s) => ({ ...s, grid: next, done: s.done || won }));
    if (won) { setSel(null); setPick(null); setCheer(true); }
  }

  function place(r, c, v) {
    if (given[r][c] || g.done) return;
    const next = grid.map((row) => row.slice());
    if (next[r][c] === v) { next[r][c] = 0; commit(next); return; }
    if (v && conflicts(r, c, v)) { setShake(r * 6 + c); setTimeout(() => setShake(null), 400); return; }
    next[r][c] = v;
    commit(next);
  }

  // Selection-aware shading, the way the grown-up board does it: the picked
  // shape (from the tray, or the shape sitting in the selected square) lights
  // every square that already holds it, the selected square's row, column and
  // box shade lightly, and with a shape picked every EMPTY square that shape
  // cannot go in is greyed and dotted, so a kid can see the off-limits squares
  // before tapping rather than after a shake.
  const hlVal = pick || (sel ? grid[sel[0]][sel[1]] : 0);
  function cellCls(r, c) {
    const v = grid[r][c];
    const isSel = sel && sel[0] === r && sel[1] === c;
    if (isSel) return ' sel';
    if (hlVal && v === hlVal) return ' same';
    if (pick && !v && !g.done && conflicts(r, c, pick)) return ' off';
    if (sel && (r === sel[0] || c === sel[1] || (r - (r % 2) === sel[0] - (sel[0] % 2) && c - (c % 3) === sel[1] - (sel[1] % 3)))) return ' peer';
    return '';
  }

  function onCell(r, c) {
    if (g.done || given[r][c]) return;
    if (pick) { place(r, c, pick); setSel([r, c]); return; }
    setSel(sel && sel[0] === r && sel[1] === c ? null : [r, c]);
  }

  function onTray(v) {
    if (g.done) return;
    if (sel) place(sel[0], sel[1], v);
    else setPick(pick === v ? null : v);
  }

  function hint() {
    if (g.done) return;
    const wrong = [];
    for (let r = 0; r < 6; r++) for (let c = 0; c < 6; c++) if (grid[r][c] !== sol[r][c]) wrong.push([r, c]);
    if (!wrong.length) return;
    const target = sel && grid[sel[0]][sel[1]] !== sol[sel[0]][sel[1]] ? sel : wrong[Math.floor(Math.random() * wrong.length)];
    const next = grid.map((row) => row.slice());
    next[target[0]][target[1]] = sol[target[0]][target[1]];
    setSel(target);
    setG((s) => ({ ...s, hints: (s.hints || 0) + 1 }));
    commit(next);
  }

  function reset() {
    setG({ grid: given.map((r) => r.slice()), hints: 0, secs: 0, done: false });
    setSel(null); setPick(null); setCheer(false);
  }

  function onKey(e) {
    if (!sel || g.done) return;
    const k = e.key;
    if (k >= '1' && k <= '6') place(sel[0], sel[1], +k);
    else if (k === 'Backspace' || k === 'Delete' || k === '0') { if (!given[sel[0]][sel[1]]) { const n = grid.map((row) => row.slice()); n[sel[0]][sel[1]] = 0; commit(n); } }
    else if (k.startsWith('Arrow')) {
      e.preventDefault();
      let [r, c] = sel;
      if (k === 'ArrowUp') r = (r + 5) % 6; if (k === 'ArrowDown') r = (r + 1) % 6;
      if (k === 'ArrowLeft') c = (c + 5) % 6; if (k === 'ArrowRight') c = (c + 1) % 6;
      setSel([r, c]);
    }
  }

  return (
    <KidsShell game={game} dayKey={dayKey} dayNum={dayNum} dayLabel={dayLabel}>
      <style dangerouslySetInnerHTML={{ __html: CSS }} />
      <Confetti go={cheer} />
      <div className="kd-card kd-game">
        <div>
          <div className={`sx-board${g.done ? ' won' : ''}`} role="grid" aria-label="Shape Sixes board" tabIndex={0} onKeyDown={onKey}>
            {grid.map((row, r) => row.map((v, c) => (
              <button
                key={`${r}-${c}`}
                type="button"
                role="gridcell"
                className={`sx-cell${given[r][c] ? ' given' : ''}${mode === 'num' ? ' num' : ''}${cellCls(r, c)}${shake === r * 6 + c ? ' kd-shake' : ''}`}
                onClick={() => onCell(r, c)}
                aria-label={`Row ${r + 1} column ${c + 1}${v ? `, shape ${v}` : ', empty'}`}
              >
                {v ? glyph(v) : null}
              </button>
            )))}
          </div>
          <div className="sx-left">Empty squares left: <b>{empty}</b></div>
        </div>
        <div className="kd-side">
          <h2>Tap a square, then tap a shape.</h2>
          <p className="kd-how">Each row, each column and each box needs all six shapes, one of each. Pick a shape and the squares it cannot go in turn grey, and the squares that already have it light up blue. If you tap a grey square anyway it just shakes. Nothing counts against you.</p>
          <div className="sx-tray">
            {[1, 2, 3, 4, 5, 6].map((v) => (
              <button key={v} type="button" className={`${pick === v ? 'on' : ''}${counts[v] === 6 ? ' done' : ''}`} onClick={() => onTray(v)} aria-label={`Shape ${v}`}>
                {glyph(v)}
              </button>
            ))}
          </div>
          <div className="kd-ctrls">
            <div className="kd-seg">
              <button type="button" className={mode === 'shape' ? 'on' : ''} onClick={() => setMode('shape')}>Shapes</button>
              <button type="button" className={mode === 'num' ? 'on' : ''} onClick={() => setMode('num')}>Numbers</button>
            </div>
            <button type="button" className="kd-btn" onClick={hint} disabled={g.done}>Show me one</button>
            <button type="button" className="kd-btn" onClick={reset}>Start over</button>
          </div>
          <div className="kd-stats">
            <div>Time<b>{fmt(g.secs || 0)}</b></div>
            <div>Hints<b>{g.hints || 0}</b></div>
          </div>
          <div className={`kd-cheer${g.done ? ' show' : ''}`}>
            <span>You did it! 🎉</span>
            <small>Every row, column and box has all six shapes. Come back tomorrow for #{dayNum + 1}.</small>
          </div>
        </div>
      </div>
    </KidsShell>
  );
}
