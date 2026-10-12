'use client';

// WHERE A RUN ENDED — the one place the misses are derived and drawn.
//
// Two surfaces want the same fact and must not describe it differently: the
// handover between quizzes, which names the answer you wanted a moment after
// you wanted it, and the Miss summary card on the scorecard, which lays out all
// seven at once. Both read `missOf` and both draw `rnm-` rows, so a change to
// how a clock-out or an unrecorded pick reads happens once.
//
// NOTHING IS STORED FOR THIS. On a one-life quiz the score IS how many
// questions came before the miss, so the question that ended a bank is
// `questions[score]`. The only thing not derivable is which wrong answer was
// picked, and that already rides on the run's result row and on the per-puzzle
// save a game finished on its own page wrote.

import { mathText } from '@/app/MathText';
import React from 'react';

export function missOf(section, res) {
  if (!section || !res) return null;
  const cleared = res.status === 'won' || (res.total > 0 && res.score === res.total);
  if (cleared) return { cleared: true };
  const q = (section.questions || [])[res.score] || null;
  if (!q || !Array.isArray(q.choices)) return null;
  // A run out of clock has no wrong answer to name, and a row saved before the
  // pick was recorded has none either. Both say so rather than guessing.
  const known = !res.timedOut && Number.isFinite(res.pick);
  return {
    cleared: false,
    q: q.q,
    right: q.choices[q.correct],
    yours: known ? q.choices[res.pick] : null,
    timedOut: !!res.timedOut,
    unknown: !res.timedOut && !Number.isFinite(res.pick),
  };
}

// The answer line on its own, for the handover, where the question is already
// on screen a second earlier and the card is about the quiz just played.
export function MissAnswer({ miss }) {
  if (!miss || miss.cleared) return null;
  return (
    <div className="rnm-miss">
      <div className="rnm-q">{mathText(miss.q)}</div>
      <div className="rnm-ans">
        {miss.yours ? <span className="rnm-w">you said {mathText(miss.yours)}</span> : null}
        {miss.timedOut ? <span className="rnm-w">the clock ran out</span> : null}
        {miss.unknown ? <span className="rnm-w">answered wrong</span> : null}
        <span className="rnm-r">{mathText(miss.right)}</span>
      </div>
    </div>
  );
}

// All seven, on the scorecard, behind the Miss summary button.
export default function MissList({ sections = [], results = [], colourOf }) {
  return (
    <div className="rnm-card">
      <span className="rnm-h">Where each run ended</span>
      <div className="rnm-rows">
        {sections.map((s, i) => {
          const res = results[i] || null;
          const m = missOf(s, res);
          if (!m) return null;
          const c = colourOf ? colourOf(s, i) : '#7dd3fc';
          return (
            <div className="rnm-row" key={s.key} style={{ borderLeftColor: c }}>
              <div className="rnm-nm" style={{ color: c }}>
                {s.name}<i>{res.score}/{res.total}</i>
              </div>
              {m.cleared ? (
                <div className="rnm-q cleared">Cleared. Every question.</div>
              ) : (
                <>
                  <div className="rnm-q">{mathText(m.q)}</div>
                  <div className="rnm-ans">
                    {m.yours ? <span className="rnm-w">you said {mathText(m.yours)}</span> : null}
                    {m.timedOut ? <span className="rnm-w">the clock ran out</span> : null}
                    {m.unknown ? <span className="rnm-w">answered wrong</span> : null}
                    <span className="rnm-r">{mathText(m.right)}</span>
                  </div>
                </>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// Interpolated into RunClient's own stylesheet rather than shipped as a second
// <style>: both surfaces live on that page, and the run's ground is the one
// these colours were chosen against.
export const MISS_CSS = `
.rnm-card{border:1px solid rgba(255,255,255,.1);border-radius:13px;padding:18px 20px 20px;
  margin:12px 0 4px;background:rgba(255,255,255,.02);}
.rnm-h{display:block;font-size:9.5px;font-weight:800;letter-spacing:.16em;text-transform:uppercase;
  color:#66748f;margin-bottom:12px;}
.rnm-rows{display:flex;flex-direction:column;gap:9px;}
.rnm-row{border-left:3px solid;padding:5px 0 6px 13px;}
.rnm-nm{font-size:11.5px;font-weight:800;letter-spacing:.1em;text-transform:uppercase;
  display:flex;align-items:baseline;gap:8px;}
.rnm-nm i{font-style:normal;font-size:11px;font-weight:600;letter-spacing:.04em;color:#8ea6d6;
  text-transform:none;font-variant-numeric:tabular-nums;}
.rnm-q{font-size:14px;font-weight:600;line-height:1.35;margin:3px 0 5px;color:#eef2fa;}
.rnm-q.cleared{margin-bottom:0;color:#9aa8c4;font-weight:500;}
.rnm-ans{display:flex;flex-wrap:wrap;gap:6px 10px;font-size:12.5px;font-weight:600;}
.rnm-w{color:#fb7185;text-decoration:line-through;text-decoration-color:rgba(251,113,133,.55);}
.rnm-r{color:#6ee7b7;}

/* THE HANDOVER'S COPY of the same fact: no card around it, since the chamber is
   already a card, and it sits between the figures and the next quiz's name. */
.rnm-miss{margin:20px 0 0;padding:13px 0 0;border-top:1px solid rgba(255,255,255,.11);}
.rnm-miss .rnm-q{font-size:15px;margin:0 0 6px;}

@media (max-width:640px){
  .rnm-card{padding:14px 14px 16px;}
  .rnm-q{font-size:13px;}
  .rnm-miss .rnm-q{font-size:13.5px;}
  .rnm-ans{font-size:11.5px;}
}
`;
