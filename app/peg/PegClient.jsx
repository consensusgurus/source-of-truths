'use client';

// Peg: the daily peg solitaire (owner, 2026-11-18: picked Peg from the retro
// list, then "build and implement both"; in the same push, "an option to show
// the answer"). Mockup: https://claude.ai/artifact/WX3qGQ6FMtykK8sLwHKEZm
// (its Arrow is No. 1).
//
// Tap a peg, then the empty hole it jumps to; the jumped peg comes off. The day
// is solved when one peg is left, in the center hole. Undo and Restart get you
// out of a dead end, but EVERY JUMP COUNTS, the undone ones too, so a clean
// first line is what ranks: fewest jumps (the best possible is pegs - 1), then
// the clock. guesses_used is the jump count; a solve is 10, a give-up 0.
//
// The save is { line, jumps }: `line` is the jumps from the start to the board
// now (two letters each, lib/peg-engine.js), `jumps` every jump ever made.
// Once the day is over, Show the answer fetches the stored line from
// /api/daily-answer and plays it on the board. Runs on app/SimpleDaily.jsx.

import React, { useEffect, useMemo, useRef, useState } from 'react';
import SimpleDaily from '../SimpleDaily';
import { HOLES, HOLE_CH, holeAt, parseBoard, replay, jumpsFrom, legalJumps, code, isSolved, pegsIn, targetOf, apply } from '@/lib/peg-engine';

const BAND = { gentle: 'Gentle', moderate: 'Moderate', tough: 'Tough', sunday: 'Sunday Edition' };
const jumpsOf = (n) => `${n} ${n === 1 ? 'jump' : 'jumps'}`;
const PC = 80, PO = 40;

function crossPath() {
  const a = PO + 2 * PC - 38, b = PO + 4 * PC + 38, e0 = PO - 38, e1 = PO + 6 * PC + 38, r = 16;
  const V = [[a, e0], [b, e0], [b, a], [e1, a], [e1, b], [b, b], [b, e1], [a, e1], [a, b], [e0, b], [e0, a], [a, a]];
  let d = '';
  V.forEach((p, i) => {
    const to = (q) => { const dx = q[0] - p[0], dy = q[1] - p[1], L = Math.hypot(dx, dy); return [p[0] + (dx / L) * r, p[1] + (dy / L) * r]; };
    const s1 = to(V[(i + V.length - 1) % V.length]), s2 = to(V[(i + 1) % V.length]);
    d += (i ? 'L' : 'M') + s1.join(' ') + 'Q' + p.join(' ') + ' ' + s2.join(' ');
  });
  return d + 'Z';
}
const CROSS = crossPath();

const CSS = `
.peg{align-self:center;margin-left:auto;margin-right:auto;width:100%;display:flex;flex-direction:column;align-items:center;gap:10px;
--pg-board:#ffffff;--pg-edge:#15171c;--pg-hole:#e6e2da;--pg-hole-lo:#cfc9bd;--pg-peg:#e9b8a4;--pg-peg-lo:#c98a73;--pg-sel:#b9d7a8;--pg-sel-lo:#5f9a50;--pg-land:#d9e8d0;--pg-ring:#8b95a8;--pg-shine:rgba(255,255,255,.55);}
.stage-page[data-stage-theme='dark'] .peg,html:is([data-stage-pastel='darktint'],[data-stage-tone='darktint']) .peg{--pg-board:#171b23;--pg-edge:#eef1f6;--pg-hole:#262c37;--pg-hole-lo:#11151b;--pg-peg:#c98a73;--pg-peg-lo:#e9b8a4;--pg-sel:#5f8f4f;--pg-sel-lo:#a8d595;--pg-land:#2c3f27;--pg-ring:#98a2b3;--pg-shine:rgba(255,255,255,.3);}
.peg svg{display:block;width:100%;height:auto;user-select:none;-webkit-user-select:none;touch-action:manipulation;}
.peg .hole{cursor:pointer;}
.peg .landing{animation:peg-pulse 1.1s ease-in-out infinite;}
@keyframes peg-pulse{0%,100%{opacity:.55}50%{opacity:1}}
.peg-msg{min-height:22px;text-align:center;font:800 13px/1.6 'Manrope',system-ui,sans-serif;color:var(--stg-mute,#8b95a8);}
.peg-msg.bad{color:var(--pst-bad,#be123c);}
.peg-ans{font:800 13.5px/1.2 'Manrope',system-ui,sans-serif;border:1.5px solid var(--stg-cell-line,rgba(28,30,36,.35));background:transparent;color:inherit;border-radius:999px;padding:0 16px;min-height:44px;cursor:pointer;}
`;

function Board({ P, s, setS, active, done, onStage }) {
  const [sel, setSel] = useState(null);
  const [note, setNote] = useState(null);
  const [ans, setAns] = useState(null); // { line, i } while the answer plays
  const live = active && !done;
  const now = useMemo(() => replay(P, s.line) || parseBoard(P.pegs), [P, s.line]);
  const shown = ans ? replay(P, ans.line.slice(0, ans.i * 2)) : now;
  useEffect(() => { if (!live) setSel(null); }, [live]);

  useEffect(() => {
    if (!ans || ans.i * 2 >= ans.line.length) return undefined;
    const t = setTimeout(() => setAns((a) => (a ? { ...a, i: a.i + 1 } : a)), ans.i === 0 ? 700 : 520);
    return () => clearTimeout(t);
  }, [ans]);

  const showAnswer = async () => {
    setNote(null);
    try {
      const r = await fetch(`/api/daily-answer?game=peg&num=${P.num}`);
      const j = await r.json();
      if (!j || typeof j.sol !== 'string') throw new Error('no answer');
      setAns({ line: j.sol, i: 0 });
    } catch (e) { setNote({ t: 'The answer could not be loaded. Try again in a moment.', bad: true }); }
  };

  const tap = (i) => {
    if (!live) return;
    if (now[i]) {
      if (sel === i) { setSel(null); return; }
      if (!jumpsFrom(now, i).length) { setSel(null); setNote({ t: 'That peg has no jump right now.', bad: true }); return; }
      setSel(i); setNote(null); return;
    }
    if (sel == null) return;
    const j = jumpsFrom(now, sel).find((x) => x[2] === i);
    if (!j) { setNote({ t: 'A peg jumps one neighbor into the empty hole just past it.', bad: true }); return; }
    const after = apply(now, j);
    setS((st) => ({ ...st, line: st.line + code(j), jumps: (st.jumps || 0) + 1 }));
    // keep the same peg picked up if it can keep jumping
    setSel(jumpsFrom(after, j[2]).length ? j[2] : null);
    if (!isSolved(P, after) && !legalJumps(after).length) setNote({ t: `No jumps left with ${pegsIn(after)} pegs. Undo, or Restart.`, bad: true });
    else setNote(null);
  };

  const land = sel != null && live ? jumpsFrom(now, sel).map((j) => j[2]) : [];
  const target = targetOf(P);
  const holes = HOLES.map(([r, c], i) => {
    const cx = PO + c * PC, cy = PO + r * PC, on = !!shown[i], isLand = land.includes(i), picked = sel === i && live;
    return (
      <g key={i} className="hole" onClick={() => tap(i)}>
        <circle cx={cx} cy={cy} r={36} fill="transparent" />
        <circle cx={cx} cy={cy} r={15} fill={isLand ? 'var(--pg-land)' : 'var(--pg-hole)'} stroke={isLand ? 'var(--pg-sel-lo)' : 'var(--pg-hole-lo)'} strokeWidth={isLand ? 3 : 2} className={isLand ? 'landing' : undefined} />
        {i === target && !on ? <circle cx={cx} cy={cy} r={23} fill="none" stroke="var(--pg-ring)" strokeWidth={1.5} opacity={0.7} /> : null}
        {on ? (
          <>
            <ellipse cx={cx} cy={cy + 16} rx={20} ry={6} fill="rgba(0,0,0,.12)" />
            <circle cx={cx} cy={cy} r={24} fill={picked ? 'var(--pg-sel)' : 'var(--pg-peg)'} stroke={picked ? 'var(--pg-sel-lo)' : 'var(--pg-peg-lo)'} strokeWidth={3} />
            <circle cx={cx - 8} cy={cy - 8} r={6} fill="var(--pg-shine)" />
          </>
        ) : null}
      </g>
    );
  });
  const n = pegsIn(shown);
  const playing = ans && ans.i * 2 < ans.line.length;
  return (
    <div className="peg" style={{ maxWidth: 'min(560px, calc(100dvh - 300px))' }}>
      <style dangerouslySetInnerHTML={{ __html: CSS }} />
      <svg viewBox="-14 -14 588 588" role="img" aria-label={`A peg solitaire board with ${n} pegs`}>
        <path d={CROSS} fill="var(--pg-board)" stroke="var(--pg-edge)" strokeWidth={1} />
        {holes}
      </svg>
      <div className={`peg-msg${note && note.bad ? ' bad' : ''}`} aria-live="polite">
        {ans ? (playing ? `The answer: jump ${ans.i} of ${ans.line.length / 2}` : `The answer: ${jumpsOf(ans.line.length / 2)}, one peg in the center.`) : note ? note.t : ''}
      </div>
      {done && !onStage ? (
        <button type="button" className="peg-ans" onClick={ans ? () => setAns(null) : showAnswer}>{ans ? (playing ? 'Stop' : 'Back to my board') : 'Show the answer'}</button>
      ) : null}
    </div>
  );
}

function Tools({ s, setS, active, done }) {
  if (done) return null;
  const can = active && s.line.length > 0;
  const undo = () => setS((st) => (st.line.length ? { ...st, line: st.line.slice(0, -2) } : st));
  const restart = () => setS((st) => (st.line.length ? { ...st, line: '' } : st));
  return (
    <div style={{ display: 'flex', justifyContent: 'center', gap: 10 }}>
      <button type="button" className="sd-tool" onClick={undo} disabled={!can} style={{ opacity: can ? 1 : 0.4 }}>Undo</button>
      <button type="button" className="sd-tool" onClick={restart} disabled={!can} style={{ opacity: can ? 1 : 0.4 }}>Restart</button>
    </div>
  );
}

const left = (P, s) => { const r = replay(P, s.line); return r ? pegsIn(r) : P.count; };

export const GAME = {
  key: 'peg', name: 'Peg', cat: 'Table Games', miss: 'Jumps', missOne: 'jump',
  fresh: () => ({ line: '', jumps: 0 }),
  validSave: (P, s) => !!s && typeof s.line === 'string' && Number.isInteger(s.jumps) && s.jumps >= s.line.length / 2 && !!replay(P, s.line),
  touched: (s) => (s.jumps || 0) > 0,
  solved: (P, s) => isSolved(P, replay(P, s.line)),
  count: (s) => s.jumps || 0,
  metric: (P, s, won) => (won ? s.jumps || 0 : null),
  result: (P, s, won) => ({ score: won ? 10 : 0, total: 10, correct: won ? 1 : 0, guessesUsed: s.jumps || 0 }),
  Board,
  tools: (props) => <Tools {...props} />,
  eyebrow: (P, s, { sundayLabel }) => `${sundayLabel || BAND[P.band]} · ${P.title ? `${P.title} · ` : ''}${P.count} pegs · No. ${P.num}`,
  foot: (P, s) => `${jumpsOf(s.jumps || 0)} · ${left(P, s)} pegs left`,
  frac: (P, s) => (P.count - left(P, s)) / Math.max(1, P.count - 1),
  sundayLabel: () => 'Sunday Edition',
  gateTitle: (P) => `Today: ${P.title ? `the ${P.title}, ` : ''}${P.count} pegs`,
  gateLine: (P) => `Jump pegs until one is left, and finish it in the center hole. Every jump counts, Undo included, so the best possible today is ${jumpsOf(P.count - 1)}.`,
  rules: () => ({
    lead: 'Leave one peg, in the center hole.',
    steps: [
      <>Tap a peg, then tap the <b>empty hole</b> two spaces away (up, down, left or right) with a peg between. The holes it can reach pulse.</>,
      <>The peg you jump over <b>comes off</b>. The same peg stays picked up while it can keep jumping.</>,
      <>Keep going until <b>one peg</b> is left. It has to finish in the <b>center</b> hole, the one with the ring.</>,
      <><b>Undo</b> takes back a jump and <b>Restart</b> goes back to the start, but every jump you made still counts.</>,
    ],
    knack: 'Clear the far arms first and work back toward the middle. A peg left alone on an edge, with nothing beside it, can never be taken.',
    footer: 'A solved board ranks on jumps, fewest first (the best possible is one fewer than the pegs), then the clock. Once the day is over, Show the answer plays a winning line.',
  }),
  pitch: (P) => `${P.count} pegs. Jump them down to one, in the center.`,
  shareLine: (P, s, won, el) => `Peg #${P.num} · ${P.count} pegs · ${won ? `${jumpsOf(s.jumps || 0)} (best ${P.count - 1}) · ${el}` : 'unfinished'}`,
  detail: (P, s, won, el) => `${P.count} pegs · ${jumpsOf(s.jumps || 0)}, best possible ${P.count - 1} · ${el}`,
  aboutTitle: 'About Peg',
  about: [
    'Peg is a free daily peg solitaire from Mind Loft, on the classic 33-hole English cross board. A peg jumps over a neighbor into the empty hole beyond, and the jumped peg comes off. The goal is one peg left, standing in the center hole.',
    'Each day starts from a different shape instead of the full board: about ten pegs on Monday and Tuesday, thirteen to seventeen midweek, eighteen to twenty-two on Friday and Saturday, and a Sunday Edition of two dozen or more. Every start is built backwards from the finish, so every board can be solved.',
    'Every jump counts, including the ones you take back with Undo, so the fewest jumps top the leaderboard and the clock breaks a tie. Once your day is over, Show the answer plays a winning line on the board.',
    <>More from the table: <a href="/taire" style={{ color: 'inherit', fontWeight: 800 }}>Taire</a>, <a href="/cell" style={{ color: 'inherit', fontWeight: 800 }}>Cell</a> and <a href="/mahj" style={{ color: 'inherit', fontWeight: 800 }}>Mahj</a>.</>,
  ],
};

export default function PegClient(props) {
  return <SimpleDaily {...props} game={GAME} />;
}
