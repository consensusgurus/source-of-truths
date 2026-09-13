'use client';

import { useState, useMemo } from 'react';
import KidsShell, { useKidsSave, Confetti } from '../KidsShell';

// Fit It. Snug for kids: a 5x5 board with a few squares missing and four or
// five pieces that fill it exactly, every piece ALREADY TURNED THE RIGHT WAY.
// Tap a piece, then tap the board where one of its squares should go; the
// piece drops in if it fits there. Tap a piece on the board to pick it back
// up. Nothing counts against you: a piece that will not fit just wobbles, and
// "Show me one" drops the next piece in for free, as many times as you like.
// The bank is app/kids/fitit/puzzles.js (scripts/gen-kids-fitit.mjs), and
// every board has exactly one way to lay its pieces as printed.

const N = 5;
const HUES = ['#ff5a5f', '#3a86ff', '#3bb273', '#ff9f1c', '#8e5ae0', '#ff7bb0'];

const CSS = `
.ft-board{position:relative;width:100%;max-width:420px;aspect-ratio:1;display:grid;grid-template-columns:repeat(5,1fr);grid-template-rows:repeat(5,1fr);gap:4px;padding:8px;background:var(--kink);border-radius:20px}
.ft-sq{border:0;padding:0;border-radius:9px;background:#fffdf6;cursor:pointer;position:relative;transition:transform .12s}
.ft-sq.hole{background:transparent;cursor:default}
.ft-sq.on{box-shadow:inset 0 -4px 0 rgba(0,0,0,.16)}
.ft-sq.on:active{transform:scale(.96)}
.ft-sq.hint::after{content:'';position:absolute;inset:30%;border-radius:50%;background:var(--kblue);opacity:.35}
.ft-board.wobble{animation:kdshake .35s}
.ft-tray{display:flex;flex-wrap:wrap;gap:14px;margin-top:16px;align-items:flex-start}
.ft-piece{border:0;background:transparent;padding:6px;border-radius:14px;cursor:pointer;display:grid;gap:3px;transition:transform .12s}
.ft-piece.armed{background:#fff3d6;box-shadow:0 0 0 3px var(--kink);transform:scale(1.05)}
.ft-piece.used{opacity:.22;pointer-events:none}
.ft-piece i{display:block;width:26px;height:26px;border-radius:6px;box-shadow:inset 0 -3px 0 rgba(0,0,0,.16)}
.ft-piece i.no{visibility:hidden}
.ft-hand{font-family:var(--kdisp);font-weight:700;font-size:15px;color:var(--kink2);margin-top:14px}
@media (max-width:420px){.ft-piece i{width:20px;height:20px}}
`;

function fits(board, placed, pieces, i, dr, dc) {
  const occ = new Set();
  placed.forEach((off, j) => { if (off && j !== i) for (const [r, c] of pieces[j]) occ.add(`${r + off[0]},${c + off[1]}`); });
  for (const [r, c] of pieces[i]) {
    const rr = r + dr, cc = c + dc;
    if (rr < 0 || cc < 0 || rr >= N || cc >= N) return false;
    if (board.mask[rr][cc] !== '1') return false;
    if (occ.has(`${rr},${cc}`)) return false;
  }
  return true;
}

export default function FitItClient({ game, board, dayKey, dayNum, dayLabel, todayNum }) {
  const pieces = board ? board.pieces : [];
  const blank = () => ({ placed: pieces.map(() => null), hints: 0, done: false, hist: [] });
  const [g, setG] = useKidsSave('fitit', dayKey, blank());
  const [armed, setArmed] = useState(null);
  const [wobble, setWobble] = useState(false);
  const [cheer, setCheer] = useState(false);

  const placed = g.placed && g.placed.length === pieces.length ? g.placed : pieces.map(() => null);
  const owner = useMemo(() => {
    const o = Array.from({ length: N }, () => Array(N).fill(-1));
    placed.forEach((off, i) => { if (off) for (const [r, c] of pieces[i]) o[r + off[0]][c + off[1]] = i; });
    return o;
  }, [placed, pieces]);

  if (!board) {
    return (
      <KidsShell game={game} dayKey={dayKey} dayNum={dayNum} dayLabel={dayLabel} todayNum={todayNum}>
        <div className="kd-card">No board today. Come back tomorrow!</div>
      </KidsShell>
    );
  }

  function commit(nextPlaced, extra = {}) {
    const done = nextPlaced.every((x) => x);
    setG((s) => ({ ...s, placed: nextPlaced, hist: [...(s.hist || []).slice(-30), placed], done: s.done || done, ...extra }));
    if (done) setCheer(true);
  }

  function shakeIt() { setWobble(true); setTimeout(() => setWobble(false), 400); }

  function tapSquare(r, c) {
    if (g.done) return;
    if (board.mask[r][c] !== '1') return;
    const who = owner[r][c];
    if (armed == null) {
      if (who >= 0) { const np = placed.slice(); np[who] = null; commit(np); setArmed(who); }
      return;
    }
    // Drop the armed piece so one of its squares lands here. Prefer the
    // handle (its first square); otherwise the first square that fits.
    const pc = pieces[armed];
    let hit = null;
    for (const [pr, pcol] of pc) {
      const dr = r - pr, dc = c - pcol;
      if (fits(board, placed, pieces, armed, dr, dc)) { hit = [dr, dc]; break; }
    }
    if (!hit) { shakeIt(); return; }
    const np = placed.slice(); np[armed] = hit; commit(np); setArmed(null);
  }

  function tapPiece(i) {
    if (g.done) return;
    if (placed[i]) { const np = placed.slice(); np[i] = null; commit(np); setArmed(i); return; }
    setArmed(armed === i ? null : i);
  }

  function showOne() {
    if (g.done) return;
    // The next unplaced piece goes to its home; anything sitting on that spot
    // is lifted back to the tray.
    const i = placed.findIndex((x) => !x);
    if (i < 0) return;
    const np = placed.slice();
    const home = board.sol[i];
    const cover = new Set(pieces[i].map(([r, c]) => `${r + home[0]},${c + home[1]}`));
    np.forEach((off, j) => { if (off && j !== i && pieces[j].some(([r, c]) => cover.has(`${r + off[0]},${c + off[1]}`))) np[j] = null; });
    np[i] = home;
    commit(np, { hints: (g.hints || 0) + 1 });
    setArmed(null);
  }

  function undo() {
    if (g.done) return;
    const h = g.hist || [];
    if (!h.length) return;
    setG((s) => ({ ...s, placed: h[h.length - 1], hist: h.slice(0, -1) }));
    setArmed(null);
  }

  function reset() { setG(blank()); setArmed(null); setCheer(false); }

  const left = placed.filter((x) => !x).length;

  return (
    <KidsShell game={game} dayKey={dayKey} dayNum={dayNum} dayLabel={dayLabel} todayNum={todayNum}>
      <style dangerouslySetInnerHTML={{ __html: CSS }} />
      <Confetti go={cheer} />
      <div className="kd-card kd-game">
        <div>
          <div className={`ft-board${wobble ? ' wobble' : ''}`} aria-label="The board">
            {Array.from({ length: N * N }, (_, k) => {
              const r = Math.floor(k / N); const c = k % N;
              const hole = board.mask[r][c] !== '1';
              const who = owner[r][c];
              const canDrop = armed != null && !hole && who < 0;
              return (
                <button
                  key={k}
                  type="button"
                  className={`ft-sq${hole ? ' hole' : ''}${who >= 0 ? ' on' : ''}${canDrop ? ' hint' : ''}`}
                  style={who >= 0 ? { background: HUES[who % HUES.length] } : undefined}
                  onClick={() => tapSquare(r, c)}
                  aria-label={hole ? '' : who >= 0 ? `Piece ${who + 1}, tap to pick it up` : `Row ${r + 1} column ${c + 1}`}
                  tabIndex={hole ? -1 : 0}
                />
              );
            })}
          </div>
          <div className="ft-hand" aria-live="polite">
            {g.done ? 'Every piece is in!' : armed != null ? `Piece ${armed + 1} is in your hand. Tap the board to drop it.` : left === pieces.length ? 'Tap a piece to pick it up.' : `${left} to go.`}
          </div>
          <div className="ft-tray" aria-label="Pieces">
            {pieces.map((pc, i) => {
              const h = 1 + Math.max(...pc.map((q) => q[0])), w = 1 + Math.max(...pc.map((q) => q[1]));
              const set = new Set(pc.map((q) => `${q[0]},${q[1]}`));
              return (
                <button
                  key={i}
                  type="button"
                  className={`ft-piece${armed === i ? ' armed' : ''}${placed[i] ? ' used' : ''}`}
                  style={{ gridTemplateColumns: `repeat(${w}, auto)` }}
                  onClick={() => tapPiece(i)}
                  aria-label={`Piece ${i + 1}`}
                  aria-pressed={armed === i}
                >
                  {Array.from({ length: h * w }, (_, k) => {
                    const on = set.has(`${Math.floor(k / w)},${k % w}`);
                    return <i key={k} className={on ? '' : 'no'} style={on ? { background: HUES[i % HUES.length] } : undefined} />;
                  })}
                </button>
              );
            })}
          </div>
        </div>
        <div className="kd-side">
          <h2>Tap a piece, then tap the board.</h2>
          <p className="kd-how">Every piece is already turned the right way. Pick one up, then tap the square on the board where one of its squares should go. If it fits, it drops in. Tap a piece on the board to pick it back up. When every piece is in and no white squares are left, you did it. Stuck? <b>Show me one</b> drops the next piece into its spot.</p>
          <div className="kd-stats"><div>Pieces<b>{pieces.length}</b></div><div>Left<b>{left}</b></div><div>Shown<b>{g.hints || 0}</b></div></div>
          <div className="kd-ctrls">
            <button type="button" className="kd-btn pri" onClick={showOne} disabled={g.done}>Show me one</button>
            <button type="button" className="kd-btn" onClick={undo} disabled={g.done || !(g.hist || []).length}>Undo</button>
            <button type="button" className="kd-btn" onClick={reset}>Start over</button>
          </div>
          <div className={`kd-cheer${g.done ? ' show' : ''}`}>
            <span>Snug as a bug! Every piece fits! 🎉</span>
            <small>{(g.hints || 0) === 0 ? 'You found every spot yourself.' : `${g.hints} shown. Want to try it all by yourself? Start over.`}</small>
          </div>
        </div>
      </div>
    </KidsShell>
  );
}
