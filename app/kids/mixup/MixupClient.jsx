'use client';

import { useState } from 'react';
import KidsShell, { useKidsSave, Confetti } from '../KidsShell';

// Mix-Up. Each row is a picture and its word's letters in the wrong order.
// Tap a letter, then tap another, and they swap. The row turns green the
// moment the letters read the word. Nothing is counted against the kid.

const CSS = `
.mx-rows{display:flex;flex-direction:column;gap:14px;width:100%}
.mx-row{display:flex;align-items:center;gap:8px;flex-wrap:wrap}
.mx-pic{font-size:36px;width:52px;text-align:center;flex:none;line-height:1}
.mx-t{width:46px;height:52px;border-radius:11px;background:#fff;border:2px solid var(--kline);display:flex;align-items:center;justify-content:center;font-family:var(--kdisp);font-weight:700;font-size:24px;text-transform:uppercase;box-shadow:0 4px 0 #e9d9ad;cursor:pointer;padding:0;transition:transform .1s,background .15s}
.mx-t:active{transform:translateY(2px)}
.mx-t.sel{background:#e9f1ff;border-color:var(--kblue);transform:translateY(3px);box-shadow:0 1px 0 #e9d9ad}
.mx-row.ok .mx-t{background:var(--kgreen);color:#fff;border-color:#2f9a60;box-shadow:0 4px 0 #2f9a60;cursor:default;animation:kdpop .5s both}
.mx-row.ok .mx-t:nth-child(3){animation-delay:.05s}.mx-row.ok .mx-t:nth-child(4){animation-delay:.1s}.mx-row.ok .mx-t:nth-child(5){animation-delay:.15s}.mx-row.ok .mx-t:nth-child(6){animation-delay:.2s}
.mx-tick{font-family:var(--kdisp);font-weight:700;color:var(--kgreen);margin-left:4px;min-width:20px}
@media (max-width:420px){.mx-t{width:40px;height:46px;font-size:20px}.mx-pic{font-size:30px;width:42px}}
`;

export default function MixupClient({ game, puzzle, dayKey, dayNum, dayLabel }) {
  const start = () => puzzle.words.map((w) => [...w.s]);
  const [g, setG] = useKidsSave('mixup', dayKey, { rows: start(), done: false, swaps: 0 });
  const [sel, setSel] = useState(null);
  const [cheer, setCheer] = useState(false);
  const rows = g.rows && g.rows.length === puzzle.words.length ? g.rows : start();
  const okRow = (i) => rows[i].join('') === puzzle.words[i].w;

  function tap(i, j) {
    if (okRow(i)) return;
    if (!sel || sel[0] !== i) { setSel([i, j]); return; }
    if (sel[1] === j) { setSel(null); return; }
    const next = rows.map((r) => r.slice());
    [next[i][sel[1]], next[i][j]] = [next[i][j], next[i][sel[1]]];
    setSel(null);
    const won = next.every((r, k) => r.join('') === puzzle.words[k].w);
    setG((s) => ({ ...s, rows: next, swaps: (s.swaps || 0) + 1, done: s.done || won }));
    if (won) setCheer(true);
  }
  function reset() { setG({ rows: start(), done: false, swaps: 0 }); setSel(null); setCheer(false); }

  const solved = rows.filter((r, i) => r.join('') === puzzle.words[i].w).length;

  return (
    <KidsShell game={game} dayKey={dayKey} dayNum={dayNum} dayLabel={dayLabel}>
      <style dangerouslySetInnerHTML={{ __html: CSS }} />
      <Confetti go={cheer} />
      <div className="kd-card kd-game" style={{ gridTemplateColumns: '1fr' }}>
        <div className="kd-side">
          <h2>Tap two letters to swap them.</h2>
          <p className="kd-how">Look at the picture. The letters spell what it is, but they got mixed up. Swap letters until the word reads right, and the row turns green.</p>
        </div>
        <div className="mx-rows">
          {puzzle.words.map((w, i) => (
            <div key={i} className={`mx-row${okRow(i) ? ' ok' : ''}`}>
              <span className="mx-pic" aria-hidden="true">{w.e}</span>
              {rows[i].map((ch, j) => (
                <button
                  key={j}
                  type="button"
                  className={`mx-t${sel && sel[0] === i && sel[1] === j ? ' sel' : ''}`}
                  onClick={() => tap(i, j)}
                  aria-label={`Letter ${ch.toUpperCase()}, word ${i + 1}, position ${j + 1}`}
                >{ch}</button>
              ))}
              <span className="mx-tick" aria-live="polite">{okRow(i) ? '✓' : ''}</span>
            </div>
          ))}
        </div>
        <div className="kd-side">
          <div className="kd-stats"><div>Words<b>{solved} / {puzzle.words.length}</b></div><div>Swaps<b>{g.swaps || 0}</b></div></div>
          <div className="kd-ctrls"><button type="button" className="kd-btn" onClick={reset}>Start over</button></div>
          <div className={`kd-cheer${g.done ? ' show' : ''}`}>
            <span>All five words! 🎉</span>
            <small>You unscrambled them in {g.swaps || 0} swaps. New words tomorrow.</small>
          </div>
        </div>
      </div>
    </KidsShell>
  );
}
