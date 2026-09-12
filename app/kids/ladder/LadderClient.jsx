'use client';

import { useState } from 'react';
import KidsShell, { useKidsSave, Confetti } from '../KidsShell';
import { LADDER_SET } from '@/lib/kids-ladder-words';

// Ladder. The current word sits at the top of the climb; tap one of its
// letters, tap a new letter on the keyboard, and if that makes a real word it
// becomes the next rung. Reach the end word and the ladder is done. Undo
// takes the last rung back for free. Any word in the vocabulary is a step.

const CSS = `
.ld-lad{display:flex;flex-direction:column;gap:8px;align-items:center}
.ld-rung{display:flex;gap:6px}
.ld-l{width:54px;height:60px;border-radius:12px;display:flex;align-items:center;justify-content:center;font-family:var(--kdisp);font-weight:700;font-size:28px;text-transform:uppercase;background:#fff;border:2px solid var(--kline);box-shadow:0 4px 0 #e9d9ad}
.ld-rung.fixed .ld-l{background:var(--kink);color:#fff;border-color:var(--kink);box-shadow:0 4px 0 #0d0f20}
.ld-rung.end .ld-l{background:var(--kgreen);color:#fff;border-color:#2f9a60;box-shadow:0 4px 0 #2f9a60}
.ld-rung.past .ld-l{background:#f3ecd8;box-shadow:none}
.ld-rung.cur .ld-l{cursor:pointer}
.ld-rung.cur .ld-l.sel{background:#e9f1ff;border-color:var(--kblue);outline:3px solid var(--kblue)}
.ld-arrow{font-family:var(--kdisp);color:var(--kink2);font-size:14px}
.ld-kb{display:grid;grid-template-columns:repeat(9,1fr);gap:6px;max-width:420px;margin-top:14px}
.ld-kb button{aspect-ratio:1;border-radius:10px;border:2px solid var(--kline);background:#fff;font-family:var(--kdisp);font-weight:700;font-size:18px;text-transform:uppercase;cursor:pointer;box-shadow:0 3px 0 #e9d9ad;padding:0}
.ld-kb button:active{transform:translateY(2px);box-shadow:0 1px 0 #e9d9ad}
.ld-kb button:disabled{opacity:.35;cursor:default}
.ld-msg{min-height:22px;margin-top:10px;font-weight:700;color:var(--kink2)}
.ld-msg.bad{color:var(--kred)}
`;

const LETTERS = 'abcdefghijklmnopqrstuvwxyz'.split('');

export default function LadderClient({ game, puzzle, dayKey, dayNum, dayLabel, todayNum }) {
  const [g, setG] = useKidsSave('ladder', dayKey, { rungs: [puzzle.start], done: false, tries: 0 });
  const [sel, setSel] = useState(null);
  const [msg, setMsg] = useState({ t: '', bad: false });
  const [cheer, setCheer] = useState(false);
  const rungs = g.rungs && g.rungs[0] === puzzle.start ? g.rungs : [puzzle.start];
  const cur = rungs[rungs.length - 1];
  const steps = rungs.length - 1;

  function pressLetter(ch) {
    if (sel == null || g.done) return;
    const next = cur.slice(0, sel) + ch + cur.slice(sel + 1);
    if (next === cur) { setSel(null); return; }
    if (!LADDER_SET.has(next)) {
      setMsg({ t: `${next.toUpperCase()} is not a word we know. Try another letter.`, bad: true });
      setG((s) => ({ ...s, tries: (s.tries || 0) + 1 }));
      return;
    }
    if (rungs.includes(next)) { setMsg({ t: `You already stood on ${next.toUpperCase()}.`, bad: true }); return; }
    const won = next === puzzle.end;
    setG((s) => ({ ...s, rungs: [...rungs, next], done: s.done || won }));
    setSel(null);
    setMsg({ t: won ? '' : `${next.toUpperCase()}! Keep climbing.`, bad: false });
    if (won) setCheer(true);
  }
  function undo() {
    if (g.done || rungs.length < 2) return;
    setG((s) => ({ ...s, rungs: rungs.slice(0, -1) }));
    setSel(null); setMsg({ t: '', bad: false });
  }
  function reset() { setG({ rungs: [puzzle.start], done: false, tries: 0 }); setSel(null); setMsg({ t: '', bad: false }); setCheer(false); }

  return (
    <KidsShell game={game} dayKey={dayKey} dayNum={dayNum} dayLabel={dayLabel} todayNum={todayNum}>
      <style dangerouslySetInnerHTML={{ __html: CSS }} />
      <Confetti go={cheer} />
      <div className="kd-card kd-game">
        <div>
          <div className="ld-lad" aria-label="Your ladder">
            <div className="ld-rung end" aria-label={`Goal word ${puzzle.end}`}>{[...puzzle.end].map((c, i) => <span key={i} className="ld-l">{c}</span>)}</div>
            <div className="ld-arrow">climb up to here</div>
            {!g.done && (
              <div className="ld-rung cur" aria-label={`Current word ${cur}`}>
                {[...cur].map((c, i) => (
                  <button key={i} type="button" className={`ld-l${sel === i ? ' sel' : ''}`} onClick={() => setSel(sel === i ? null : i)} aria-label={`Letter ${c}, tap to change`}>{c}</button>
                ))}
              </div>
            )}
            {rungs.slice(0, -1).reverse().map((w) => (
              <div key={w} className={`ld-rung ${w === puzzle.start ? 'fixed' : 'past'}`}>
                {[...w].map((c, j) => <span key={j} className="ld-l">{c}</span>)}
              </div>
            ))}
          </div>
          <div className={`ld-msg${msg.bad ? ' bad' : ''}`} aria-live="polite">{msg.t}</div>
        </div>
        <div className="kd-side">
          <h2>Change one letter at a time.</h2>
          <p className="kd-how">Tap a letter in your top word, then tap the letter you want instead. If that makes a real word, it becomes your next step. Climb until you reach <b>{puzzle.end.toUpperCase()}</b>. Any real word counts, and Undo takes a step back for free.</p>
          <div className="ld-kb">
            {LETTERS.map((ch) => (
              <button key={ch} type="button" onClick={() => pressLetter(ch)} disabled={sel == null || g.done || cur[sel] === ch}>{ch}</button>
            ))}
          </div>
          <div className="kd-ctrls">
            <button type="button" className="kd-btn" onClick={undo} disabled={g.done || rungs.length < 2}>Undo a step</button>
            <button type="button" className="kd-btn" onClick={reset}>Start over</button>
          </div>
          <div className="kd-stats"><div>Steps<b>{steps}</b></div><div>Best possible<b>{puzzle.best}</b></div></div>
          <div className={`kd-cheer${g.done ? ' show' : ''}`}>
            <span>You made it! 🎉</span>
            <small>{steps === puzzle.best ? `${steps} steps, and that is the shortest ladder there is.` : `${steps} steps. The shortest ladder is ${puzzle.best}. Want to try for it? Start over.`}</small>
          </div>
        </div>
      </div>
    </KidsShell>
  );
}
