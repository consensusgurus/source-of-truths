'use client';

// Scales: the daily balance-scale weights puzzle (owner, 2026-11-26: picked
// "the weights one" from a list of new ideas, approved the mockup, ruled
// "Checks then time", approved the weekly ramp and ordered it built the same
// day). A few scales carry shapes and numbered weights; the player gives every
// shape a weight and presses Check, and each scale swings to where THOSE
// weights put it. The board says how many scales match the picture and never
// which shape is wrong. Runs on the shared stage shell (app/SimpleDaily.jsx);
// the boards, the weighing and the drawing all come from lib/scales-engine.js,
// the module the generator and the checker read.
//
// THE SCALES CARD IS WHITE IN BOTH LOOKS, like Glimpse's panel: the shapes are
// soft pastels with dark outlines and they read the same day or night. The
// chips, keys, hints and buttons follow the stage ink, so they flip.
//
// NO ON-SCREEN KEYS ON DESKTOP (owner, 2026-10-30): a pointer that is not
// coarse types its weights on the keyboard, and the key pad is not drawn.

import React, { useEffect, useMemo, useState } from 'react';
import SimpleDaily from '../SimpleDaily';
import {
  SHAPES, SHAPE_NAME, BANDS, SCALE_W, SCALE_H, BEAM_Y, FULCRUM, beamSvg, tiltDeg, tiltOf, shapeSvg, scaleLabel,
} from '@/lib/scales-engine';

const checksOf = (s) => s.checks || 0;
const plural = (n, w) => `${n} ${w}${n === 1 ? '' : 's'}`;
const SHOULD = { '=': 'Should balance', '>': 'Left should be heavier', '<': 'Right should be heavier' };

const CSS = `
.scl{display:flex;flex-direction:column;gap:10px;width:100%;max-width:520px;margin:0 auto;font-family:'Manrope',system-ui,sans-serif;color:var(--pst-ink,#0b0f1a);}
.scl-card{display:grid;grid-template-columns:minmax(0,1fr);border:1px solid var(--pst-ink,#0b0f1a);border-radius:14px;overflow:hidden;background:#ffffff;color:#0b0f1a;}
.scl-row{position:relative;padding:2px 10px 5px;line-height:0;}
.scl-row+.scl-row{border-top:1px solid #d9dde4;}
.scl-row svg{display:block;width:100%;height:auto;overflow:visible;}
.scl-beam{transform-box:view-box;transition:transform .45s ease;}
.scl-note{position:absolute;left:12px;bottom:5px;line-height:1.3;font-size:12.5px;font-weight:800;}
.scl-note.r{left:auto;right:12px;}
.scl-note.ok{color:#166534;}
.scl-note.no{color:#9a3412;}
.scl-msg{margin:0;min-height:22px;text-align:center;font-size:15px;font-weight:800;line-height:1.45;}
.scl-chips{display:grid;gap:8px;}
.scl-chip{min-height:52px;border:1px solid var(--pst-ink,#0b0f1a);border-radius:12px;background:var(--pst-cell,#f1f4f8);display:flex;align-items:center;justify-content:center;gap:7px;padding:4px 2px;font-size:18px;font-weight:800;line-height:1.3;}
.scl-chip.col{flex-direction:column;gap:2px;font-size:16px;}
.scl-chip.on{background:var(--pst-acc,#f4c7a1);color:var(--pst-on-acc,#0b0f1a);box-shadow:inset 0 0 0 1px var(--pst-ink,#0b0f1a);}
.scl-chip:disabled{cursor:default;}
.scl-chip:focus-visible,.scl-key:focus-visible{outline:3px solid var(--pst-ink,#0b0f1a);outline-offset:2px;}
.scl-chip i{display:block;line-height:0;font-style:normal;}
.scl-keys{display:grid;grid-template-columns:repeat(6,minmax(0,1fr));gap:6px;}
.scl-key{min-height:44px;border:1px solid var(--pst-ink,#0b0f1a);border-radius:10px;background:var(--pst-cell,#f1f4f8);font-size:18px;font-weight:800;padding:0;}
.scl-key.wide{grid-column:span 2;font-size:15px;}
.scl-hint{margin:0;text-align:center;font-size:14px;font-weight:600;line-height:1.5;opacity:.8;}
@media (min-width:900px){
  .scl.big{max-width:900px;}
  .scl.big .scl-card{grid-template-columns:repeat(2,minmax(0,1fr));}
  .scl.big .scl-row+.scl-row{border-top:0;}
  .scl.big .scl-row:nth-child(n+3){border-top:1px solid #d9dde4;}
  .scl.big .scl-row:nth-child(even){border-left:1px solid #d9dde4;}
  .scl.big .scl-row:last-child:nth-child(odd){grid-column:1 / -1;justify-self:center;width:50%;border-left:1px solid #d9dde4;border-right:1px solid #d9dde4;}
  .scl.big .scl-tail{width:100%;max-width:520px;margin:0 auto;display:flex;flex-direction:column;gap:12px;}
}
.scl-tail{display:flex;flex-direction:column;gap:10px;}
@media (prefers-reduced-motion:reduce){.scl-beam{transition:none;}}
`;

function Scale({ sc, vals, tilt, note }) {
  const inner = useMemo(() => beamSvg(sc, vals), [sc, vals]);
  return (
    <div className="scl-row">
      <svg viewBox={`0 10 ${SCALE_W} ${SCALE_H - 10}`} role="img" aria-label={scaleLabel(sc)}>
        <g className="scl-beam" style={{ transform: `rotate(${tiltDeg(tilt)}deg)`, transformOrigin: `${SCALE_W / 2}px ${BEAM_Y + 4}px` }} dangerouslySetInnerHTML={{ __html: inner }} />
        <polygon points={FULCRUM} fill="#0b0f1a" />
      </svg>
      {/* the note sits under the raised arm, where the beam leaves room */}
      {note ? <span className={'scl-note ' + note.k + (tilt === '>' ? ' r' : '')}>{note.t}</span> : null}
    </div>
  );
}

function Board({ P, s, setS, active, done, gaveUp }) {
  const n = P.n;
  const letters = SHAPES.slice(0, n);
  const [touch, setTouch] = useState(false);
  useEffect(() => {
    try { setTouch(!!(window.matchMedia && window.matchMedia('(pointer: coarse)').matches)); } catch (e) {}
  }, []);

  const v = Array.isArray(s.v) ? s.v : [];
  const full = letters.every((_, i) => v[i] != null);
  const live = active && !done;

  const select = (i) => setS((st) => ({ ...st, sel: i, fr: true }));
  const type = (d) => setS((st) => {
    const i = Math.min(st.sel || 0, n - 1), cur = st.v[i];
    let nv = st.fr || cur == null ? d : cur * 10 + d;
    if (nv > P.max) nv = d;
    if (nv === 0) nv = null;
    const nxt = st.v.slice(); nxt[i] = nv;
    let sel = i, fr = false;
    // a weight that cannot take another digit is finished: move to the next empty shape
    if (nv != null && nv * 10 > P.max) {
      for (let k = 1; k < n; k++) { const j = (i + k) % n; if (nxt[j] == null) { sel = j; fr = true; break; } }
    }
    return { ...st, v: nxt, sel, fr, last: null };
  });
  const erase = () => setS((st) => {
    const i = Math.min(st.sel || 0, n - 1);
    if (st.v[i] == null) return st;
    const nxt = st.v.slice(); nxt[i] = null;
    return { ...st, v: nxt, fr: true, last: null };
  });
  const step = (by) => setS((st) => ({ ...st, sel: ((st.sel || 0) + by + n) % n, fr: true }));
  // One check: every scale swings to where these weights put it. Pressing it
  // again on the same weights does nothing, so a double tap never costs a check.
  const check = () => setS((st) => {
    if (st.last || !letters.every((_, i) => st.v[i] != null)) return st;
    const last = P.scales.map((sc) => tiltOf(sc, st.v));
    return { ...st, checks: (st.checks || 0) + 1, last, won: last.every((t, i) => t === P.scales[i].t) };
  });

  // The keyboard, at any width: digits, Backspace, arrows or Tab, Enter.
  useEffect(() => {
    if (!live) return undefined;
    const onKey = (e) => {
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      const tag = (e.target && e.target.tagName) || '';
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;
      if (/^[0-9]$/.test(e.key)) { e.preventDefault(); type(Number(e.key)); }
      else if (e.key === 'Backspace' || e.key === 'Delete') { e.preventDefault(); erase(); }
      else if (e.key === 'ArrowRight' || e.key === 'ArrowDown') { e.preventDefault(); step(1); }
      else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') { e.preventDefault(); step(-1); }
      else if (e.key === 'Enter') { e.preventDefault(); check(); }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [live, n, P.max]);

  // What is printed on the shapes and where each beam sits. In play the scales
  // sit as drawn until a check, then where the player's weights put them. A
  // finished board shows the answer.
  const shown = done ? (s.won ? v : P.sol) : v;
  const tilts = P.scales.map((sc, i) => (done ? sc.t : s.last ? s.last[i] : sc.t));
  const hits = s.last ? s.last.filter((t, i) => t === P.scales[i].t).length : 0;
  const allEven = P.scales.every((sc) => sc.t === '=');
  const c = checksOf(s);
  let msg;
  if (done) msg = s.won ? `Solved in ${plural(c, 'check')}.` : 'These are the weights.';
  else if (s.last) msg = `${hits} of ${P.scales.length} scales ${allEven ? 'balance' : 'match'}. Change a weight and check again.`;
  else if (c) msg = `${plural(c, 'check')} so far.`;
  else msg = `Whole-number weights, 1 to ${P.max}.`;

  return (
    <div className={'scl' + (n >= 4 ? ' big' : '')}>
      <style dangerouslySetInnerHTML={{ __html: CSS }} />
      <div className="scl-card">
        {P.scales.map((sc, i) => (
          <Scale key={i} sc={sc} vals={shown} tilt={tilts[i]}
            note={!done && s.last ? (s.last[i] === sc.t ? { k: 'ok', t: 'Matches' } : { k: 'no', t: SHOULD[sc.t] }) : null} />
        ))}
      </div>
      <div className="scl-tail">
        <p className="scl-msg" aria-live="polite">{msg}</p>
        <div className="scl-chips" style={{ gridTemplateColumns: `repeat(${n}, minmax(0, 1fr))` }}>
          {letters.map((k, i) => {
            const val = shown[i];
            return (
              <button type="button" key={k} disabled={!live} aria-pressed={live && (s.sel || 0) === i}
                aria-label={`${SHAPE_NAME[k]}: ${val == null ? 'no weight yet' : val}`}
                className={'scl-chip' + (n >= 5 ? ' col' : '') + (live && (s.sel || 0) === i ? ' on' : '')} onClick={() => select(i)}>
                <i dangerouslySetInnerHTML={{ __html: shapeSvg(k, 26) }} />
                <span>{n >= 5 ? (val == null ? '?' : val) : `= ${val == null ? '?' : val}`}</span>
              </button>
            );
          })}
        </div>
        {live && touch ? (
          <div className="scl-keys">
            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 0].map((d) => (
              <button type="button" key={d} className="scl-key" onClick={() => type(d)}>{d}</button>
            ))}
            <button type="button" className="scl-key wide" onClick={erase}>Clear</button>
          </div>
        ) : null}
        {live && !touch ? <p className="scl-hint">Type a weight. Arrow keys move between shapes. Enter checks.</p> : null}
        {live ? <button type="button" className="pst-tb wide on" disabled={!full || !!s.last} onClick={check}>Check the scales</button> : null}
      </div>
    </div>
  );
}

const GAME = {
  key: 'scales', name: 'Scales', cat: 'Numbers', miss: 'Checks', missOne: 'check', wide: true,
  fresh: (P) => ({ v: new Array(P.n).fill(null), sel: 0, fr: true, checks: 0, last: null, won: false }),
  validSave: (P, s) => Array.isArray(s.v) && s.v.length === P.n && s.v.every((x) => x == null || (Number.isInteger(x) && x >= 1 && x <= P.max)) && Number.isInteger(s.checks || 0),
  touched: (s) => checksOf(s) > 0 || (Array.isArray(s.v) && s.v.some((x) => x != null)),
  // The day ends on the check that puts every scale where it is drawn.
  solved: (P, s) => !!s.won,
  count: (s) => checksOf(s),
  // Solve or not: 10 for a solve, 0 for a give-up. Checks ride in guessesUsed,
  // which the board ranks before the clock (owner, 2026-11-26).
  result: (P, s, won) => ({ score: won ? 10 : 0, total: 10, correct: won ? 1 : 0, guessesUsed: checksOf(s) }),
  metric: (P, s, won) => (won ? checksOf(s) : null),
  Board,
  sundayLabel: () => 'Sunday Edition',
  eyebrow: (P, s, { sundayLabel } = {}) => `No. ${P.num} · ${sundayLabel || BANDS[P.band].label} · weights 1 to ${P.max}`,
  foot: (P, s) => `${plural(checksOf(s), 'check')} · ranked on checks, then the clock`,
  frac: (P, s) => (s.last ? s.last.filter((t, i) => t === P.scales[i].t).length / P.scales.length : 0),
  gateTitle: (P) => (P.sunday ? 'Today\'s Scales: the Sunday Edition' : `Today's Scales: ${BANDS[P.band].label}`),
  gateLine: (P) => `${P.n === 3 ? 'Three' : P.n === 4 ? 'Four' : P.n === 5 ? 'Five' : 'Six'} scales with shapes on them. Work out what each shape weighs, 1 to ${P.max}, then check. Fewest checks wins, then the clock.`,
  rules: (P) => ({
    lead: 'Work out what each shape weighs.',
    banner: 'Everyone gets the same scales today.',
    steps: [
      <>Each shape weighs a <b>whole number from 1 to {P.max}</b>, and a shape weighs the same on every scale. A dark weight with a number on it weighs that number.</>,
      <>A level scale <b>balances</b>: both sides weigh the same.{P.scales.some((sc) => sc.t !== '=') ? <> A <b>tilted</b> scale only tells you which side is heavier: the low side.</> : <> Later in the week some scales are tilted, which only tells you which side is heavier.</>}</>,
      <>Give every shape a weight, then press <b>Check the scales</b>. Each scale swings to where your weights put it, and you are told how many match the picture.</>,
      <>It never says which shape is wrong. Change a weight and check again. The day ends when every scale matches.</>,
    ],
    knack: 'Do the sums before you check. Start with the scale that has the fewest different shapes on it, and when a shape sits on both sides, take it off both first.',
    footer: 'Ranked on the fewest checks, then the clock. Three shapes on Monday and Tuesday, four from Wednesday to Friday, five with a tilted scale on Saturday, and six on the Sunday Edition.',
  }),
  pitch: () => 'Work out what each shape weighs from the scales.',
  shareLine: (P, s, won, el) => `Scales #${P.num} · ${won ? plural(checksOf(s), 'check') : 'not solved'} · ${el}`,
  detail: (P, s, won, el) => `${won ? `Solved in ${plural(checksOf(s), 'check')}` : plural(checksOf(s), 'check')} · ${BANDS[P.band].label} · ${el}`,
  aboutTitle: 'About Scales',
  about: [
    'Scales is a free daily balance scale puzzle from Mind Loft. A handful of scales each hold shapes and numbered weights. Every shape has one hidden weight, a whole number, and it weighs the same wherever it appears. Your job is to work out what each shape weighs.',
    'It is algebra you can see. A level scale is an equation: a circle and a 12 weight on one side, a square and a diamond on the other. A shape on both sides cancels. A tilted scale is an inequality: it only tells you which side is heavier, so it narrows a shape to a range and another scale has to pin it down. Every board has exactly one answer, proved by computer before it is published.',
    'When you have a weight for every shape, check the scales. Each one swings to where your weights put it and you see how many match the picture, but never which shape is off. The daily leaderboard ranks the fewest checks first and then the clock, so working it out beats guessing. The boards grow through the week: three shapes early on, four midweek, five with a tilted scale on Saturday, and six on the Sunday Edition.',
  ],
};

export default function ScalesClient(props) {
  return <SimpleDaily {...props} game={GAME} />;
}
