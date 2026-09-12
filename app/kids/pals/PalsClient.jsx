'use client';

import { useState, useMemo } from 'react';
import KidsShell, { useKidsSave, Confetti } from '../KidsShell';

// Pixel Pals: a 5x5 picture nonogram. Paint mode fills a square, Dot mode marks
// a square you know is empty. A row or column whose runs match its clue gets a
// tick; when every line ticks, the picture is done and gets its name. The
// answer never reaches the browser, the clues are the whole test.

const CSS = `
.pp-wrap{display:grid;grid-template-columns:auto repeat(5,1fr);grid-auto-rows:auto;gap:4px;width:100%;max-width:380px}
.pp-c{display:flex;align-items:flex-end;justify-content:center;padding-bottom:2px;font-family:var(--kdisp);font-weight:700;font-size:15px;color:var(--kink2);gap:3px;min-height:26px}
.pp-c.ok,.pp-r.ok{color:var(--kgreen)}
.pp-r{display:flex;align-items:center;justify-content:flex-end;padding-right:6px;min-width:44px;font-family:var(--kdisp);font-weight:700;font-size:15px;color:var(--kink2);gap:4px}
.pp-q{aspect-ratio:1;border-radius:9px;background:#fff;border:2px solid var(--kline);cursor:pointer;padding:0;position:relative;transition:transform .08s}
.pp-q:active{transform:scale(.94)}
.pp-q.f{background:var(--kred);border-color:#e04a50}
.pp-q.x::after{content:'';position:absolute;inset:36%;border-radius:50%;background:#dcd3bd}
.pp-done .pp-q.f{animation:kdpop .5s both}
.pp-done .pp-q{cursor:default}
.pp-tools{display:flex;gap:10px;margin-top:14px;align-items:center;flex-wrap:wrap}
.pp-reveal{margin-top:12px;font-family:var(--kdisp);font-weight:700;font-size:20px}
`;

function runsOf(line) {
  const out = [];
  let n = 0;
  for (const v of line) { if (v === 1) n++; else if (n) { out.push(n); n = 0; } }
  if (n) out.push(n);
  return out;
}
function sameRuns(a, b) { return a.length === b.length && a.every((v, i) => v === b[i]); }

export default function PalsClient({ game, puzzle, dayKey, dayNum, dayLabel, todayNum }) {
  const empty = () => Array.from({ length: 5 }, () => Array(5).fill(0));
  const [g, setG] = useKidsSave('pals', dayKey, { grid: empty(), mode: 'paint', done: false, secs: 0 });
  const [cheer, setCheer] = useState(false);
  const grid = g.grid && g.grid.length === 5 ? g.grid : empty();
  const mode = g.mode || 'paint';

  const rowOk = useMemo(() => grid.map((row, r) => sameRuns(runsOf(row), puzzle.rows[r])), [grid, puzzle.rows]);
  const colOk = useMemo(() => [0, 1, 2, 3, 4].map((c) => sameRuns(runsOf(grid.map((row) => row[c])), puzzle.cols[c])), [grid, puzzle.cols]);
  const filled = grid.flat().filter((v) => v === 1).length;
  const need = puzzle.rows.reduce((s, r) => s + r.reduce((a, b) => a + b, 0), 0);

  function tap(r, c) {
    if (g.done) return;
    const next = grid.map((row) => row.slice());
    const cur = next[r][c];
    if (mode === 'paint') next[r][c] = cur === 1 ? 0 : 1;
    else next[r][c] = cur === 2 ? 0 : 2;
    const rOk = next.map((row, i) => sameRuns(runsOf(row), puzzle.rows[i]));
    const cOk = [0, 1, 2, 3, 4].map((k) => sameRuns(runsOf(next.map((row) => row[k])), puzzle.cols[k]));
    const won = rOk.every(Boolean) && cOk.every(Boolean);
    setG((s) => ({ ...s, grid: next, done: s.done || won }));
    if (won) setCheer(true);
  }

  function reset() { setG({ grid: empty(), mode: 'paint', done: false, secs: 0 }); setCheer(false); }

  const clue = (arr) => (arr.length ? arr.map((n, i) => <span key={i}>{n}</span>) : <span>0</span>);

  return (
    <KidsShell game={game} dayKey={dayKey} dayNum={dayNum} dayLabel={dayLabel} todayNum={todayNum}>
      <style dangerouslySetInnerHTML={{ __html: CSS }} />
      <Confetti go={cheer} />
      <div className="kd-card kd-game">
        <div>
          <div className={`pp-wrap${g.done ? ' pp-done' : ''}`} role="grid" aria-label="Pixel Pals board">
            <div />
            {puzzle.cols.map((c, k) => <div key={`c${k}`} className={`pp-c${colOk[k] ? ' ok' : ''}`}>{clue(c)}</div>)}
            {grid.map((row, r) => (
              <FragmentRow key={r} r={r} row={row} clue={clue(puzzle.rows[r])} ok={rowOk[r]} tap={tap} />
            ))}
          </div>
          <div className="pp-reveal">{g.done ? `It's ${puzzle.name}!` : `${filled} of ${need} squares colored`}</div>
        </div>
        <div className="kd-side">
          <h2>Count and color.</h2>
          <p className="kd-how">The numbers say how many squares in a row are colored in, in order. A <b>3</b> means three squares together. A <b>1 1</b> means one, a gap, then one. A <b>0</b> means none. When a line is right, its number turns green. Fill every line and a picture pops out.</p>
          <div className="pp-tools">
            <div className="kd-seg">
              <button type="button" className={mode === 'paint' ? 'on' : ''} onClick={() => setG((s) => ({ ...s, mode: 'paint' }))}>Paint</button>
              <button type="button" className={mode === 'dot' ? 'on' : ''} onClick={() => setG((s) => ({ ...s, mode: 'dot' }))}>Dot (this one is empty)</button>
            </div>
            <button type="button" className="kd-btn" onClick={reset}>Start over</button>
          </div>
          <div className={`kd-cheer${g.done ? ' show' : ''}`}>
            <span>It&apos;s {puzzle.name}! 🎉</span>
            <small>Every line matches its numbers. Tomorrow is a new picture.</small>
          </div>
        </div>
      </div>
    </KidsShell>
  );
}

function FragmentRow({ r, row, clue, ok, tap }) {
  return (
    <>
      <div className={`pp-r${ok ? ' ok' : ''}`}>{clue}</div>
      {row.map((v, c) => (
        <button
          key={c}
          type="button"
          role="gridcell"
          className={`pp-q${v === 1 ? ' f' : ''}${v === 2 ? ' x' : ''}`}
          onClick={() => tap(r, c)}
          aria-label={`Row ${r + 1} column ${c + 1}${v === 1 ? ', colored' : v === 2 ? ', marked empty' : ''}`}
        />
      ))}
    </>
  );
}
