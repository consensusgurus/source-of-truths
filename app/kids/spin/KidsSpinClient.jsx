'use client';

// Spin for kids: the grown-up Spin's photo, cut into big squares, every
// square turned. Tap a square to spin it a quarter turn; get the whole picture
// the right way up. Nothing counts against you: no tap count, no clock, a
// little picture to peek at, and Show me turns one square straight for you.
// A square that looks the same at every angle (clear sky, flat water) is set
// straight for you and does not move, exactly as on the grown-up board.

import React, { useEffect, useMemo, useState } from 'react';
import KidsShell, { useKidsSave, Confetti } from '../KidsShell';
import usePhotoSquare, { tileStyle } from '../../usePhotoSquare';
import { seeded } from '@/lib/kids-daily';

const SIZES = [3, 4];
const K = 24, SAME = 9;

// The same test grown-up Spin uses (app/spin/SpinClient.jsx), kept as a copy.
function lockedSquares(canvas, n) {
  const W = canvas.width;
  const c = document.createElement('canvas'); c.width = K * n; c.height = K * n;
  const x = c.getContext('2d');
  x.drawImage(canvas, 0, 0, W, W, 0, 0, K * n, K * n);
  const px = x.getImageData(0, 0, K * n, K * n).data;
  const out = [];
  for (let t = 0; t < n * n; t++) {
    const r0 = Math.floor(t / n) * K, c0 = (t % n) * K;
    const gr = (y, xx) => { const i = ((r0 + y) * K * n + c0 + xx) * 4; return 0.299 * px[i] + 0.587 * px[i + 1] + 0.114 * px[i + 2]; };
    let d90 = 0, d180 = 0, d270 = 0;
    for (let y = 0; y < K; y++) for (let xx = 0; xx < K; xx++) {
      const v = gr(y, xx);
      d90 += Math.abs(v - gr(K - 1 - xx, y));
      d180 += Math.abs(v - gr(K - 1 - y, K - 1 - xx));
      d270 += Math.abs(v - gr(xx, K - 1 - y));
    }
    if (Math.min(d90, d180, d270) / (K * K) < SAME) out.push(t);
  }
  return out;
}

// The day's turns for an n x n cut: every square turned one, two or three
// quarters, the same for every kid who opens that day.
function deal(dayKey, n) {
  const R = seeded(`kids-spin-${dayKey}-${n}`);
  return Array.from({ length: n * n }, () => 1 + Math.floor(R() * 3));
}

const CSS = `
.ksp-board{position:relative;display:grid;width:100%;max-width:440px;aspect-ratio:1/1;gap:3px;padding:3px;margin:0 auto;border-radius:22px;background:var(--kink);user-select:none;-webkit-user-select:none;touch-action:manipulation;}
.ksp-t{position:relative;border:0;padding:0;margin:0;border-radius:8px;background-color:#fffdf6;background-repeat:no-repeat;cursor:pointer;transition:transform .25s ease;-webkit-tap-highlight-color:transparent;}
.ksp-t.lk{cursor:default;}
.ksp-board.solved{gap:0;}
.ksp-board.solved .ksp-t{border-radius:0;}
.ksp-load{position:absolute;inset:0;display:flex;align-items:center;justify-content:center;text-align:center;padding:20px;border-radius:19px;background:var(--kink);font-family:var(--kdisp);font-weight:600;font-size:17px;color:#fff;z-index:3;}
.ksp-peek{display:flex;align-items:center;gap:12px;margin-top:16px;}
.ksp-peek img{width:96px;height:96px;border-radius:14px;border:2px solid var(--kink);object-fit:cover;}
.ksp-say{min-height:26px;margin-top:12px;text-align:center;font-family:var(--kdisp);font-weight:600;font-size:17px;color:var(--kink);}
`;

export default function KidsSpinClient({ game, board, dayKey, dayNum, dayLabel, todayNum }) {
  const blank = () => ({ n: 3, rot: {}, done: false, shown: 0 });
  const [g, setG, ready] = useKidsSave('spin', dayKey, blank());
  const [cheer, setCheer] = useState(false);
  const [peek, setPeek] = useState(true);
  const [say, setSay] = useState('');
  const photo = usePhotoSquare(board ? board.jig : null, undefined, board ? board.saw : null);
  const n = SIZES.includes(g.n) ? g.n : 3;
  const locks = useMemo(() => (photo.canvas ? lockedSquares(photo.canvas, n) : []), [photo.canvas, n]);
  const lockSet = useMemo(() => new Set(locks), [locks]);
  const saved = g.rot && Array.isArray(g.rot[n]) && g.rot[n].length === n * n ? g.rot[n] : null;
  const rot = (saved || deal(dayKey, n)).map((v, i) => (lockSet.has(i) ? 0 : v));
  const ok = photo.url && rot.every((v) => v % 4 === 0);
  const doneHere = !!(g.solved && g.solved[n]);

  useEffect(() => { setSay(''); }, [n]);

  if (!board) {
    return (
      <KidsShell game={game} dayKey={dayKey} dayNum={dayNum} dayLabel={dayLabel} todayNum={todayNum}>
        <div className="kd-card"><p className="kd-note">Today&rsquo;s picture is not ready yet. Come back in a little while.</p></div>
      </KidsShell>
    );
  }

  const save = (next, extra = {}) => {
    const won = next.every((v) => v % 4 === 0);
    setG((s) => ({ ...s, rot: { ...(s.rot || {}), [n]: next }, solved: won ? { ...(s.solved || {}), [n]: true } : s.solved, done: s.done || won, ...extra(s) }));
    if (won) { setCheer(false); setTimeout(() => setCheer(true), 10); setSay(''); }
  };
  const tap = (i) => {
    if (!ready || !photo.url || doneHere || lockSet.has(i)) return;
    const next = rot.slice(); next[i] = next[i] + 1;
    save(next, () => ({}));
  };
  const showOne = () => {
    if (!ready || !photo.url || doneHere) return;
    const i = rot.findIndex((v, k) => v % 4 !== 0 && !lockSet.has(k));
    if (i < 0) return;
    const next = rot.slice(); next[i] = Math.ceil(next[i] / 4) * 4;
    setSay('There, that one is straight now.');
    save(next, (s) => ({ shown: (s.shown || 0) + 1 }));
  };
  const reset = () => { setG((s) => ({ ...s, rot: { ...(s.rot || {}), [n]: deal(dayKey, n) }, solved: { ...(s.solved || {}), [n]: false } })); setCheer(false); setSay(''); };
  const pickSize = (m) => { setG((s) => ({ ...s, n: m })); setCheer(false); };

  const straight = rot.filter((v) => v % 4 === 0).length;

  return (
    <KidsShell game={game} dayKey={dayKey} dayNum={dayNum} dayLabel={dayLabel} todayNum={todayNum}>
      <style dangerouslySetInnerHTML={{ __html: CSS }} />
      <Confetti go={cheer} />
      <div className="kd-card kd-game">
        <div>
          <div className={`ksp-board${ok ? ' solved' : ''}`} style={{ gridTemplateColumns: `repeat(${n}, 1fr)` }} role="grid" aria-label={`Spin board, ${n} by ${n}`}>
            {!photo.url ? <div className="ksp-load">{photo.error ? 'The picture did not load. Refresh to try again.' : 'Getting the picture...'}</div> : null}
            {rot.map((q, i) => (
              <button key={`${n}-${i}`} type="button" className={`ksp-t${lockSet.has(i) ? ' lk' : ''}`}
                style={{ ...tileStyle(photo.url, i, n), transform: `rotate(${q * 90}deg)` }}
                aria-label={`Square ${i + 1}${q % 4 === 0 ? ', straight' : ', turned'}`}
                onClick={() => tap(i)} />
            ))}
          </div>
          <div className="ksp-say" aria-live="polite">{ok ? 'The picture is the right way up!' : say || 'Tap a square to spin it.'}</div>
        </div>
        <div className="kd-side">
          <h2>Spin the squares until the picture is right.</h2>
          <p className="kd-how">A picture got cut into squares and every square got turned. Tap a square to spin it a quarter turn. Keep tapping until it looks right, then do the next one. Look at the little picture if you need help. Want it harder? Try <b>16</b> squares. Stuck? <b>Show me</b> turns one square the right way for you.</p>
          <div className="kd-ctrls">
            <div className="kd-seg" role="group" aria-label="Number of squares">
              {SIZES.map((m) => <button key={m} type="button" className={m === n ? 'on' : ''} aria-pressed={m === n} onClick={() => pickSize(m)}>{m * m} squares</button>)}
            </div>
          </div>
          <div className="kd-stats"><div>Squares<b>{n * n}</b></div><div>Straight<b>{straight}</b></div><div>Shown<b>{g.shown || 0}</b></div></div>
          <div className="kd-ctrls">
            <button type="button" className="kd-btn pri" onClick={showOne} disabled={!photo.url || doneHere}>Show me</button>
            <button type="button" className="kd-btn" onClick={reset}>Start over</button>
            <button type="button" className="kd-btn" onClick={() => setPeek((v) => !v)}>{peek ? 'Hide picture' : 'Peek at picture'}</button>
          </div>
          {peek && photo.url ? <div className="ksp-peek"><img src={photo.url} alt="The whole picture, the right way up" /><span className="kd-note">This is how it should look.</span></div> : null}
          <div className={`kd-cheer${doneHere ? ' show' : ''}`}>
            <span>You did it! Every square is straight! 🎉</span>
            <small>{n === 3 ? 'Want a bigger challenge? Try 16 squares.' : 'Wow, 16 squares!'}</small>
          </div>
        </div>
      </div>
    </KidsShell>
  );
}
