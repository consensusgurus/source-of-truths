'use client';

// Spot for kids: the same photo pair and the same differences as the grown-up
// daily (app/spot), in the kids look and with nothing counting against you.
// A wrong tap is only a "keep looking", there is no clock, and Show me one
// rings a difference. The pair, the zoom and the tap maths are the shared
// app/spot/SpotBoard.jsx, so a tap means the same thing on both pages.

import React, { useEffect, useState } from 'react';
import KidsShell, { useKidsSave, Confetti } from './KidsShell';
import SpotPair, { spotHit, SpotCredit, SPOT_CSS } from '../spot/SpotBoard';

const CSS = SPOT_CSS + `
.kd .spt{--spt-ink:#1b1f3b;--spt-ring:#ff5a5f;--spt-on:#ffd23f;--spt-cell:#ffffff;align-items:stretch;}
.kd .spt-pair{grid-template-columns:1fr;max-width:620px;margin:0 auto;}
.kd .spt-vp{border-width:2px;border-radius:16px;}
.kd .spt-say{font-family:var(--kdisp);font-size:17px;font-weight:600;color:var(--kink);min-height:26px;}
.kd .spt-seg{border-width:2px;font-family:var(--kdisp);}
.kd .spt-credit{color:var(--kink2);opacity:1;}
.ks-list{margin:14px 0 0;padding:0;list-style:none;display:grid;gap:4px;font-size:15px;color:var(--kink2);}
.ks-list li{display:flex;gap:8px;align-items:center;}
.ks-list i{flex:none;width:12px;height:12px;border-radius:50%;background:#ff5a5f;border:2px solid #1b1f3b;}
`;

export default function KidsSpot({ game, board, dayKey, dayNum, dayLabel, todayNum, quizId }) {
  const blank = () => ({ found: [], shown: 0, done: false });
  const [g, setG, ready] = useKidsSave('spot', dayKey, blank());
  const [say, setSay] = useState('');
  const [cheer, setCheer] = useState(false);
  useEffect(() => {
    fetch('/api/quiz/view', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ quizId }) }).catch(() => {});
  }, [quizId]);

  if (!board) {
    return (
      <KidsShell game={game} dayKey={dayKey} dayNum={dayNum} dayLabel={dayLabel} todayNum={todayNum}>
        <div className="kd-card"><p className="kd-note">Today&rsquo;s photos are not ready yet. Come back in a little while.</p></div>
      </KidsShell>
    );
  }

  const n = board.diffs.length;
  const found = (g.found || []).filter((i) => i >= 0 && i < n);
  const left = n - found.length;
  const add = (i, shown) => {
    setG((s) => {
      if ((s.found || []).includes(i)) return s;
      const f = [...(s.found || []), i];
      return { ...s, found: f, shown: (s.shown || 0) + (shown ? 1 : 0), done: s.done || f.length >= n };
    });
    if (found.length + 1 >= n) setCheer(true);
  };
  const onTap = (nx, ny, minR) => {
    if (g.done) return null;
    const i = spotHit(board, nx, ny, minR, found);
    if (i < 0) { setSay('Not that spot. Keep looking!'); return 'miss'; }
    if (found.includes(i)) { setSay('You already found that one.'); return null; }
    setSay(left - 1 > 0 ? `Yes! ${left - 1} to go.` : 'Yes!');
    add(i, false);
    return 'hit';
  };
  const showOne = () => {
    if (g.done) return;
    const open = board.diffs.map((_, i) => i).filter((i) => !found.includes(i));
    if (!open.length) return;
    setSay('There is one. Can you see what changed?');
    add(open[0], true);
  };
  const reset = () => { setG(blank()); setSay(''); setCheer(false); };

  return (
    <KidsShell game={game} dayKey={dayKey} dayNum={dayNum} dayLabel={dayLabel} todayNum={todayNum}>
      <style dangerouslySetInnerHTML={{ __html: CSS }} />
      <Confetti go={cheer} />
      <div className="kd-card kd-game">
        <div className="spt">
          <SpotPair P={board} found={ready ? found : []} onTap={onTap} live={!g.done} />
          <p className="spt-say" aria-live="polite">{g.done ? 'You found them all!' : say || 'Tap a photo where something is different.'}</p>
          <SpotCredit P={board} />
        </div>
        <div className="kd-side">
          <h2>Find what changed.</h2>
          <p className="kd-how">These two photos look the same, but the bottom one has been changed in {n} places. Something is missing, something is a new color, something is extra. Tap the spot on either photo and a ring shows you got it. Tap 2x or 3x to make the photos bigger, then drag to look around. Stuck? <b>Show me one</b> rings a difference for you.</p>
          <div className="kd-stats"><div>Found<b>{found.length}</b></div><div>Left<b>{left}</b></div><div>Shown<b>{g.shown || 0}</b></div></div>
          <div className="kd-ctrls">
            <button type="button" className="kd-btn pri" onClick={showOne} disabled={g.done}>Show me one</button>
            <button type="button" className="kd-btn" onClick={reset}>Start over</button>
          </div>
          <div className={`kd-cheer${g.done ? ' show' : ''}`}>
            <span>Eagle eyes! You found all {n}! 🎉</span>
            <small>{(g.shown || 0) === 0 ? 'You spotted every one yourself.' : `${g.shown} shown. Want to find them all by yourself? Start over.`}</small>
          </div>
          {found.length ? (
            <ul className="ks-list">
              {found.map((i) => <li key={i}><i />{board.diffs[i].t}</li>)}
            </ul>
          ) : null}
        </div>
      </div>
    </KidsShell>
  );
}
