'use client';

// Witness: the daily scene-memory game (owner, 2026-11-12, picked from a list
// of immersive daily ideas and approved from the mockup). A street scene shows
// for P.study seconds, disappears, and the player answers P.qs from memory.
// Nothing is graded until the last answer; then the scene comes back with a
// numbered pin on each thing that was asked about.
//
// The scene grows through the week and the clock never shortens (owner, same
// day): see scripts/gen-witness.mjs for the ramp. Runs on the shared stage
// shell (app/SimpleDaily.jsx); the picture is drawn by lib/witness-scene.js,
// the same module the generator and verifier read.
//
// THE STUDY CLOCK IS STAMPED INTO THE SAVE (s.t), so a reload mid-study comes
// back with the time already spent and a reload after it comes back to the
// questions: leaving and returning never buys a second look.

import React, { useEffect, useMemo, useState } from 'react';
import SimpleDaily from '../SimpleDaily';
import { sceneSvg } from '@/lib/witness-scene';
import { endGrade } from '@/lib/end-verdict';

const right = (P, s) => (s.ans || []).reduce((n, a, i) => n + (P.qs[i] && a === P.qs[i].a ? 1 : 0), 0);
const short = (q) => q.t.replace(/^On the sidewalk, /, '').replace(/^w/, 'W');

const CSS = `
.wt{display:flex;flex-direction:column;gap:12px;width:100%;max-width:520px;margin:0 auto;font-family:'Manrope',system-ui,sans-serif;color:var(--pst-ink,#0b0f1a);}
.wt-row{display:flex;justify-content:space-between;align-items:baseline;gap:12px;font-size:15px;font-weight:800;line-height:1.4;}
.wt-bar{height:10px;border:1px solid var(--pst-ink,#0b0f1a);border-radius:6px;overflow:hidden;background:#fff;}
.wt-bar i{display:block;height:100%;background:#0b0f1a;transition:width .2s linear;}
.wt-scene{border-radius:12px;overflow:hidden;background:#fff;line-height:0;}
.wt-note{margin:0;text-align:center;font-size:14px;font-weight:600;line-height:1.5;opacity:.8;}
.wt-segs{display:flex;gap:6px;}
.wt-segs i{flex:1;height:8px;border:1px solid var(--pst-ink,#0b0f1a);border-radius:5px;background:transparent;}
.wt-segs i.on{background:color-mix(in srgb, var(--pst-ink,#0b0f1a) 45%, transparent);}
.wt-segs i.now{background:var(--pst-ink,#0b0f1a);}
.wt-qs{display:grid;}
.wt-qs>*{grid-area:1/1;}
.wt-q{margin:0;font-size:clamp(22px,6.4vw,28px);font-weight:800;line-height:1.3;letter-spacing:-.01em;}
.wt-gone{min-height:120px;border:1px solid var(--pst-ink,#0b0f1a);border-radius:12px;display:flex;align-items:center;justify-content:center;padding:16px 28px;text-align:center;font-size:14px;font-weight:600;line-height:1.5;opacity:.8;}
.wt-opts{display:grid;grid-template-columns:1fr 1fr;gap:12px;}
.wt .wt-opt{min-height:64px;padding:8px 10px;background:transparent;color:inherit;border:1px solid var(--pst-ink,#0b0f1a);border-radius:14px;font-family:inherit;font-size:18px;font-weight:800;line-height:1.3;cursor:pointer;}
.wt .wt-opt:hover{background:var(--pst-tint,#fda4af);color:#0b0f1a;}
.wt-list{display:flex;flex-direction:column;}
.wt-li{display:flex;align-items:flex-start;gap:10px;padding:9px 0;border-bottom:1px solid rgba(11,15,26,.18);font-size:14px;line-height:1.45;}
.wt-li:last-child{border-bottom:none;}
.wt-n{flex:none;width:22px;height:22px;border-radius:11px;background:var(--pst-ink,#0b0f1a);color:var(--pst-bg,#fff);font-size:12px;font-weight:800;display:flex;align-items:center;justify-content:center;}
.wt-li b{font-weight:800;}
.wt-li span{display:block;font-weight:600;}
.wt-li .miss{text-decoration:line-through;opacity:.7;}
.wt-mark{flex:none;margin-left:auto;font-size:13px;font-weight:800;white-space:nowrap;}
`;

function Scene({ P, pins, label }) {
  const html = useMemo(() => sceneSvg(P.scene, { pins, label }), [P, pins, label]);
  return <div className="wt-scene" dangerouslySetInnerHTML={{ __html: html }} />;
}

function Board({ P, s, setS, active, done }) {
  const total = P.study * 1000;
  const [now, setNow] = useState(() => Date.now());
  const studying = !done && active && s.phase === 'study';
  // Stamp the start of the look the first time the scene is on screen.
  useEffect(() => { if (studying && !s.t) setS((st) => (st.t ? st : { ...st, t: Date.now() })); }, [studying, s.t, setS]);
  useEffect(() => {
    if (!studying || !s.t) return undefined;
    const tick = () => {
      const n = Date.now();
      setNow(n);
      if (n - s.t >= total) setS((st) => (st.phase === 'study' ? { ...st, phase: 'ask' } : st));
    };
    tick();
    const id = setInterval(tick, 200);
    return () => clearInterval(id);
  }, [studying, s.t, total, setS]);

  if (done) {
    // The reveal: the scene again, a pin on everything asked. Pin numbers
    // follow the question numbers; a question with no single place (which
    // thing was NOT there) carries no pin, so its slot is skipped.
    const pins = P.qs.map((q) => q.at);
    const html = sceneSvg(P.scene, { label: 'The scene again, with a numbered pin on each thing you were asked about' })
      .replace('</svg>', pins.map((at, i) => (at ? `<circle cx="${at[0]}" cy="${at[1]}" r="10" fill="#0b0f1a" stroke="#ffffff" stroke-width="1.5"/><text x="${at[0]}" y="${at[1] + 4}" text-anchor="middle" font-size="11.5" font-weight="800" fill="#ffffff">${i + 1}</text>` : '')).join('') + '</svg>');
    return (
      <div className="wt">
        <style dangerouslySetInnerHTML={{ __html: CSS }} />
        <div className="wt-scene" dangerouslySetInnerHTML={{ __html: html }} />
        <div className="wt-list">
          {P.qs.map((q, i) => {
            const a = (s.ans || [])[i], ok = a === q.a;
            return (
              <div className="wt-li" key={i}>
                <div className="wt-n">{i + 1}</div>
                <div>
                  <b>{short(q)}</b>
                  <span>{a == null ? `Not answered. It was ${q.o[q.a]}.` : ok ? q.o[q.a] : <><span className="miss" style={{ display: 'inline' }}>{q.o[a]}</span> It was {q.o[q.a]}.</>}</span>
                </div>
                <div className="wt-mark">{a == null ? '' : ok ? 'Right' : 'Missed'}</div>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  if (s.phase === 'study') {
    const left = s.t ? Math.max(0, total - (now - s.t)) : total;
    const secs = Math.ceil(left / 1000);
    return (
      <div className="wt">
        <style dangerouslySetInnerHTML={{ __html: CSS }} />
        <div className="wt-row"><span>Study the scene</span><span aria-live="off">{secs} {secs === 1 ? 'second' : 'seconds'} left</span></div>
        <div className="wt-bar" aria-hidden="true"><i style={{ width: `${(left / total) * 100}%` }} /></div>
        <Scene P={P} label="Today's street scene. Study it before it disappears." />
        <p className="wt-note">Anything here could be asked. The scene disappears when the bar runs out.</p>
      </div>
    );
  }

  const i = Math.min((s.ans || []).length, P.qs.length - 1), q = P.qs[i];
  return (
    <div className="wt">
      <style dangerouslySetInnerHTML={{ __html: CSS }} />
      <div className="wt-segs" aria-hidden="true">{P.qs.map((_, k) => <i key={k} className={k < i ? 'on' : k === i ? 'now' : undefined} />)}</div>
      {/* Every question of the day is laid in the same grid cell and only the
          current one shows, so the space is always as tall as the longest
          question and nothing below it moves between questions (owner,
          2026-11-12: "the clues jitter too much"). */}
      <div className="wt-qs">
        {P.qs.map((x, k) => <h2 key={k} className="wt-q" aria-hidden={k === i ? undefined : true} style={k === i ? undefined : { visibility: 'hidden' }}>{x.t}</h2>)}
      </div>
      <div className="wt-gone">The scene is gone. Answer from memory.</div>
      <div className="wt-opts">
        {q.o.map((o, k) => (
          <button type="button" className="wt-opt" key={`${i}-${k}`} onClick={() => setS((st) => ((st.ans || []).length === i ? { ...st, ans: [...(st.ans || []), k] } : st))}>{o}</button>
        ))}
      </div>
    </div>
  );
}

const GAME = {
  key: 'witness', name: 'Witness', cat: 'Logic', miss: null,
  fresh: () => ({ phase: 'study', t: null, ans: [] }),
  validSave: (P, s) => (s.phase === 'study' || s.phase === 'ask') && Array.isArray(s.ans) && s.ans.length <= P.qs.length,
  touched: (s) => !!s.t,
  solved: (P, s) => (s.ans || []).length >= P.qs.length,
  count: (s) => (s.ans || []).length,
  // Points are the questions answered right; a give-up keeps what was right so far.
  result: (P, s) => ({ score: right(P, s), total: P.qs.length, correct: right(P, s), guessesUsed: (s.ans || []).length }),
  title: (P, s) => endGrade(right(P, s), P.qs.length, 'Perfect!'),
  metric: (P, s) => right(P, s),
  Board,
  eyebrow: (P, s) => (s.phase === 'study' ? `No. ${P.num} · ${P.tier}` : `No. ${P.num} · Question ${Math.min((s.ans || []).length + 1, P.qs.length)} of ${P.qs.length}`),
  foot: (P, s) => (s.phase === 'study' ? `${P.qs.length} questions follow · ${P.objects} things in the scene` : 'Answers are graded at the end'),
  frac: (P, s) => (s.phase === 'study' ? 0 : (s.ans || []).length / P.qs.length),
  gateTitle: (P) => `Today's scene: ${P.tier}`,
  gateLine: (P) => `A street scene shows for ${P.study} seconds, then disappears. Answer ${P.qs.length === 8 ? 'eight' : 'six'} questions about it from memory. The scene starts the moment you press Start, so be ready to look.`,
  rules: (P) => ({
    lead: 'Study the scene, then answer from memory.',
    banner: 'Everyone sees the same scene today.',
    steps: [
      <>Press <b>Start</b> and the street appears for <b>{P.study} seconds</b>. Take in the shops, the sidewalk, the road and the sky.</>,
      <>When the bar runs out the scene <b>disappears</b> for good. {P.qs.length === 8 ? 'Eight' : 'Six'} questions follow, four choices each. Tap your answer; there is no going back.</>,
      <>Nothing is graded until the last answer. Then the scene <b>comes back</b> with a numbered pin on everything you were asked about.</>,
    ],
    knack: 'Sweep in the same order every day: sky, shop names and colors left to right, then the sidewalk, then the road. Count anything there is more than one of.',
    footer: 'Scored on answers right, then the clock. The scene gets busier through the week: Gentle on Monday and Tuesday, Moderate midweek, Tough on Friday and Saturday, and the fullest street on Sunday, with eight questions and thirty seconds.',
  }),
  pitch: () => 'Study a street scene, then answer from memory.',
  shareLine: (P, s, won, el) => `Witness #${P.num} · ${right(P, s)} of ${P.qs.length} · ${el}\n${P.qs.map((q, i) => ((s.ans || [])[i] == null ? '⬜' : (s.ans || [])[i] === q.a ? '\u{1F7E9}' : '\u{1F7E5}')).join('')}`,
  detail: (P, s, won, el) => `${right(P, s)} of ${P.qs.length} right · ${P.tier} scene · ${el}`,
  aboutTitle: 'About Witness',
  about: [
    'Witness is a free daily memory game from Mind Loft. Every day it shows one illustrated street scene for twenty seconds: shops with signs and awnings, people on the sidewalk, cars on the road, something in the sky. Then the scene disappears and you answer six questions about what you saw, four choices each.',
    'The questions are the kind a detective would ask a witness. What color was the van? How many people were waiting? What time did the clock show? Which of these was not there? Nothing is graded until your last answer, and then the scene returns with a numbered pin on everything you were asked about, so you can see exactly what you missed.',
    'The scene grows through the week while the clock stays the same. Monday and Tuesday are Gentle, with two shops and a handful of things to notice. Midweek adds a clock, a bus stop and birds to count. Friday and Saturday are Tough: four numbered shops, look-alike vehicles and questions about what stood next to what. Sunday is the fullest street of the week, with eight questions and thirty seconds to study it. Your score is the number of answers right, and the clock breaks ties.',
  ],
};

export default function WitnessClient(props) {
  return <SimpleDaily {...props} game={GAME} />;
}
