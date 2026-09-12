'use client';

import { useState } from 'react';
import KidsShell, { useKidsSave, Confetti } from '../KidsShell';

// Sort It. Three named bins, twelve word tiles. Tap a word, then tap a bin;
// a word that does not belong bounces back with a shake and costs nothing.

const HUES = ['#3a86ff', '#3bb273', '#ff9f1c'];
const TINTS = ['#e9f1ff', '#e7f6ef', '#fff3d6'];

const CSS = `
.si-board{display:grid;grid-template-columns:repeat(4,1fr);gap:8px;margin-bottom:16px}
.si-w{border-radius:12px;padding:10px 6px;text-align:center;font-family:var(--kdisp);font-weight:600;font-size:15px;background:#fff;border:2px solid var(--kline);box-shadow:0 3px 0 #e9d9ad;cursor:pointer;transition:transform .1s;min-height:44px}
.si-w.sel{background:#fff8dc;border-color:var(--kink);transform:translateY(2px);box-shadow:0 1px 0 #e9d9ad}
.si-w.gone{visibility:hidden}
.si-bins{display:grid;grid-template-columns:repeat(3,1fr);gap:10px}
.si-bin{border-radius:18px;padding:10px;border:3px dashed var(--kline);min-height:150px;cursor:pointer;transition:transform .1s,border-color .15s;text-align:left;font:inherit;color:inherit}
.si-bin.arm{border-style:solid;transform:scale(1.02)}
.si-bin.full{border-style:solid}
.si-bin h3{font-size:16px;font-weight:700;margin-bottom:8px;line-height:1.15}
.si-bin .si-in{display:flex;flex-direction:column;gap:5px}
.si-bin .si-in span{background:#fff;border-radius:8px;padding:5px 8px;font-family:var(--kdisp);font-weight:600;font-size:14px}
.si-bin.full .si-in span{animation:kdpop .5s both}
@media (max-width:560px){.si-board{grid-template-columns:repeat(3,1fr)}.si-bins{grid-template-columns:1fr}.si-bin{min-height:auto}.si-bin .si-in{flex-direction:row;flex-wrap:wrap}}
`;

export default function SortitClient({ game, puzzle, dayKey, dayNum, dayLabel, todayNum }) {
  const [g, setG] = useKidsSave('sortit', dayKey, { placed: {}, done: false, bounces: 0 });
  const [sel, setSel] = useState(null);
  const [shake, setShake] = useState(null);
  const [cheer, setCheer] = useState(false);
  const placed = g.placed || {};
  const groupOf = (w) => puzzle.groups.findIndex((gr) => gr.words.includes(w));

  function drop(binIdx) {
    if (sel == null || g.done) return;
    const w = sel;
    if (groupOf(w) !== binIdx) {
      setShake(binIdx); setTimeout(() => setShake(null), 400);
      setG((s) => ({ ...s, bounces: (s.bounces || 0) + 1 }));
      setSel(null);
      return;
    }
    const next = { ...placed, [w]: binIdx };
    const won = Object.keys(next).length === puzzle.board.length;
    setG((s) => ({ ...s, placed: next, done: s.done || won }));
    setSel(null);
    if (won) setCheer(true);
  }
  function reset() { setG({ placed: {}, done: false, bounces: 0 }); setSel(null); setCheer(false); }

  const left = puzzle.board.filter((w) => placed[w] == null).length;

  return (
    <KidsShell game={game} dayKey={dayKey} dayNum={dayNum} dayLabel={dayLabel} todayNum={todayNum}>
      <style dangerouslySetInnerHTML={{ __html: CSS }} />
      <Confetti go={cheer} />
      <div className="kd-card">
        <div className="kd-side" style={{ marginBottom: 14 }}>
          <h2>Tap a word, then tap its group.</h2>
          <p className="kd-how">The three groups are named already. Every word belongs to exactly one of them. A word in the wrong group just hops back out, so there is no such thing as a mistake here.</p>
        </div>
        <div className="si-board" role="list" aria-label="Words to sort">
          {puzzle.board.map((w) => (
            <button
              key={w}
              type="button"
              className={`si-w${sel === w ? ' sel' : ''}${placed[w] != null ? ' gone' : ''}`}
              onClick={() => setSel(sel === w ? null : w)}
              disabled={placed[w] != null || g.done}
            >{w}</button>
          ))}
        </div>
        <div className="si-bins">
          {puzzle.groups.map((gr, i) => {
            const inBin = puzzle.board.filter((w) => placed[w] === i);
            const full = inBin.length === 4;
            return (
              <button
                key={gr.name}
                type="button"
                className={`si-bin${sel != null ? ' arm' : ''}${full ? ' full' : ''}${shake === i ? ' kd-shake' : ''}`}
                style={{ borderColor: HUES[i], background: TINTS[i] }}
                onClick={() => drop(i)}
                aria-label={`Group: ${gr.name}, ${inBin.length} of 4`}
              >
                <h3 style={{ color: HUES[i] }}>{gr.name} {full ? '✓' : `${inBin.length}/4`}</h3>
                <div className="si-in">{inBin.map((w) => <span key={w}>{w}</span>)}</div>
              </button>
            );
          })}
        </div>
        <div className="kd-stats"><div>Left to sort<b>{left}</b></div><div>Hops back<b>{g.bounces || 0}</b></div></div>
        <div className="kd-ctrls"><button type="button" className="kd-btn" onClick={reset}>Start over</button></div>
        <div className={`kd-cheer${g.done ? ' show' : ''}`}>
          <span>All sorted! 🎉</span>
          <small>Three groups, twelve words, every one in the right place. New groups tomorrow.</small>
        </div>
      </div>
    </KidsShell>
  );
}
