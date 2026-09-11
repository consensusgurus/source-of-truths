'use client';

import { useState } from 'react';
import KidsShell, { useKidsSave, Confetti } from '../KidsShell';

// Math Dash. One sum at a time, a number pad, three hearts. A right answer
// lights the next star; a wrong one shows the right answer, costs a heart, and
// moves on. Ten sums or three misses ends the run. Score is stars.

const CSS = `
.md-q{font-family:var(--kdisp);font-weight:700;font-size:clamp(40px,9vw,64px);text-align:center;letter-spacing:.02em;margin:6px 0 10px;font-variant-numeric:tabular-nums}
.md-q .md-ans{display:inline-block;min-width:1.4em;border-bottom:5px solid var(--kink);padding:0 6px;color:var(--kblue)}
.md-q .md-ans.empty{color:transparent}
.md-pad{display:grid;grid-template-columns:repeat(3,1fr);gap:8px;max-width:300px;margin:0 auto}
.md-pad button{height:58px;border-radius:14px;border:2px solid var(--kline);background:#fff;font-family:var(--kdisp);font-weight:700;font-size:26px;cursor:pointer;box-shadow:0 4px 0 #e9d9ad;padding:0}
.md-pad button:active{transform:translateY(2px);box-shadow:0 1px 0 #e9d9ad}
.md-pad button.go{background:var(--kgreen);color:#fff;border-color:#2f9a60;box-shadow:0 4px 0 #2f9a60}
.md-pad button.del{background:#fff3d6}
.md-stars{display:flex;gap:6px;justify-content:center;margin-bottom:8px;flex-wrap:wrap}
.md-stars span{width:26px;height:26px;border-radius:50%;background:#efe7d1;display:inline-flex;align-items:center;justify-content:center;font-size:16px}
.md-stars span.on{background:var(--kyellow)}
.md-stars span.x{background:#ffd9db}
.md-hearts{font-size:22px;letter-spacing:2px;text-align:center;margin-bottom:6px}
.md-fb{min-height:26px;text-align:center;font-family:var(--kdisp);font-weight:700;font-size:18px}
.md-fb.good{color:var(--kgreen)}
.md-fb.bad{color:var(--kred)}
.md-end{text-align:center}
.md-end b{font-family:var(--kdisp);font-size:54px;display:block;line-height:1}
`;

export default function MathDashClient({ game, questions, dayKey, dayNum, dayLabel }) {
  const [g, setG] = useKidsSave('mathdash', dayKey, { i: 0, right: 0, hearts: 3, results: [], done: false });
  const [typed, setTyped] = useState('');
  const [fb, setFb] = useState(null);
  const [cheer, setCheer] = useState(false);
  const i = Math.min(g.i || 0, questions.length);
  const q = questions[i];
  const results = g.results || [];

  function submit() {
    if (g.done || !q || typed === '' || fb) return;
    const n = parseInt(typed, 10);
    const ok = n === q.ans;
    const hearts = ok ? g.hearts : g.hearts - 1;
    const right = ok ? (g.right || 0) + 1 : g.right || 0;
    const nextI = i + 1;
    const done = nextI >= questions.length || hearts <= 0;
    setFb(ok ? { t: 'Yes! ⭐', good: true } : { t: `Not quite. ${q.a} ${q.op} ${q.b} = ${q.ans}`, good: false });
    setTimeout(() => {
      setFb(null); setTyped('');
      setG({ i: nextI, right, hearts, results: [...results, ok], done });
      if (done && right >= 7) setCheer(true);
    }, ok ? 700 : 1600);
  }
  function key(k) {
    if (fb || g.done) return;
    if (k === 'del') setTyped((t) => t.slice(0, -1));
    else if (k === 'go') submit();
    else if (typed.length < 2) setTyped((t) => t + k);
  }
  function reset() { setG({ i: 0, right: 0, hearts: 3, results: [], done: false }); setTyped(''); setFb(null); setCheer(false); }

  const hearts = '❤️'.repeat(Math.max(0, g.hearts)) + '🤍'.repeat(Math.max(0, 3 - Math.max(0, g.hearts)));

  return (
    <KidsShell game={game} dayKey={dayKey} dayNum={dayNum} dayLabel={dayLabel}>
      <style dangerouslySetInnerHTML={{ __html: CSS }} />
      <Confetti go={cheer} />
      <div className="kd-card kd-game">
        <div>
          <div className="md-stars" aria-label={`${g.right || 0} right so far`}>
            {questions.map((_, k) => <span key={k} className={results[k] === true ? 'on' : results[k] === false ? 'x' : ''}>{results[k] === true ? '⭐' : results[k] === false ? '✕' : ''}</span>)}
          </div>
          <div className="md-hearts" aria-label={`${g.hearts} hearts left`}>{hearts}</div>
          {!g.done && q ? (
            <>
              <div className="md-q" aria-live="polite">{q.a} {q.op} {q.b} = <span className={`md-ans${typed === '' ? ' empty' : ''}`}>{typed || '0'}</span></div>
              <div className={`md-fb${fb ? (fb.good ? ' good' : ' bad') : ''}`} aria-live="polite">{fb ? fb.t : ''}</div>
              <div className="md-pad">
                {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((k) => <button key={k} type="button" onClick={() => key(k)}>{k}</button>)}
                <button type="button" className="del" onClick={() => key('del')} aria-label="Delete">⌫</button>
                <button type="button" onClick={() => key('0')}>0</button>
                <button type="button" className="go" onClick={() => key('go')} aria-label="Check">✓</button>
              </div>
            </>
          ) : (
            <div className="md-end">
              <b>{g.right || 0} / {questions.length}</b>
              <div style={{ fontFamily: 'var(--kdisp)', fontWeight: 700, fontSize: 20, marginTop: 6 }}>
                {g.right >= 10 ? 'Every single one!' : g.right >= 7 ? 'Great counting!' : g.right >= 4 ? 'Good try!' : 'Tomorrow is a new dash.'}
              </div>
            </div>
          )}
        </div>
        <div className="kd-side">
          <h2>Ten sums, three hearts.</h2>
          <p className="kd-how">Type the answer and tap the green check. A right answer earns a star. A wrong one shows you the answer and costs a heart. Ten sums or three lost hearts and the dash is over. They start easy and get a little bigger.</p>
          <div className="kd-stats"><div>Stars<b>{g.right || 0}</b></div><div>Sum<b>{Math.min(i + 1, questions.length)} of {questions.length}</b></div></div>
          <div className="kd-ctrls"><button type="button" className="kd-btn" onClick={reset}>Start over</button></div>
          <div className={`kd-cheer${g.done && g.right >= 7 ? ' show' : ''}`}>
            <span>{g.right >= 10 ? 'Perfect dash! 🎉' : 'Nice dash! 🎉'}</span>
            <small>{g.right} stars out of {questions.length}. Come back tomorrow for ten new sums.</small>
          </div>
        </div>
      </div>
    </KidsShell>
  );
}
