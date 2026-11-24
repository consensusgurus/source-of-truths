'use client';

// Crate: the daily warehouse puzzle, Sokoban as a daily (owner, 2026-11-18:
// asked for Lemmings, Pipe Dream and Sokoban mocked up, then "Build and
// implement crate"). Mockup: https://claude.ai/artifact/CuquWkC1WXmbur5WJbapsp
// (its board is No. 1).
//
// Walk with arrows, swipes, the pad or a tap (a tap walks the shortest clear
// route there, never pushing). Walk into a crate to push it; no pulling, no
// pushing two. The day is done when every crate is on a spot.
//
// EVERY STEP COUNTS. Undo and Restart get you out of a stuck crate, but the
// steps you take back stay on the count, so a clean first line is what ranks.
// Ranked on moves, then the clock (the default first-attempt order: score,
// guesses_used, time; guesses_used is the move count). A solve is 10, a
// give-up 0 (SOLVE_ONLY). The result shows the best possible beside yours.
//
// The save is { line, moves }: `line` is the moves from the start to where the
// worker stands now (Undo drops its last letter, Restart empties it) and
// `moves` every step ever taken. The model and solver are lib/crate-engine.js.
// Runs on app/SimpleDaily.jsx.

import React, { useEffect, useMemo, useRef, useState } from 'react';
import SimpleDaily from '../SimpleDaily';
import { parseMap, tryMove, walkTo, DIRS, DIR_KEYS } from '@/lib/crate-engine';

const S = 56;
const BAND = { gentle: 'Gentle', moderate: 'Moderate', tough: 'Tough', sunday: 'Sunday Edition' };
const movesOf = (n) => `${n} ${n === 1 ? 'move' : 'moves'}`;
const MODELS = typeof WeakMap !== 'undefined' ? new WeakMap() : null;
function modelOf(P) {
  let m = MODELS && MODELS.get(P);
  if (!m) { m = parseMap(P.map); if (MODELS) MODELS.set(P, m); }
  return m;
}
// Replay a line, keeping each crate's identity (for the slide animation).
function play(M, line) {
  let st = { p: M.player, boxes: M.boxes.slice() };
  const ids = M.boxes.slice(); // ids[k] = where crate k is now
  let face = 'D';
  for (const k of line) {
    const n = tryMove(M, st, k);
    if (!n) return null;
    if (n.pushed) { const k2 = ids.indexOf(n.p); ids[k2] = n.p + DIRS[k][0] + DIRS[k][1] * M.W; }
    st = n; face = k;
  }
  return { ...st, ids, face, placed: st.boxes.filter((b) => M.goal[b]).length };
}

const CSS = `
.crate{align-self:center;margin-left:auto;margin-right:auto;width:100%;display:flex;flex-direction:column;align-items:center;gap:10px;
--cr-floor:#f1efea;--cr-floor-line:#ffffff;--cr-wall:#d4cfc5;--cr-wall-lo:#b9b2a5;--cr-crate:#ddb985;--cr-crate-lo:#a87e48;--cr-on:#cfe6c4;--cr-on-lo:#5f9a50;--cr-spot:#6aa35a;--cr-hat:#f2c94c;--cr-skin:#f0c8a0;--cr-shirt:#7aa6d6;--cr-eye:#15171c;--cr-ink:#15171c;}
/* the dark look: the stored register on load, and the live look switch on <html> */
.stage-page[data-stage-theme='dark'] .crate,html:is([data-stage-pastel='darktint'],[data-stage-tone='darktint']) .crate{--cr-floor:#1d232c;--cr-floor-line:#151a21;--cr-wall:#3d4552;--cr-wall-lo:#2f3640;--cr-crate:#a7814f;--cr-crate-lo:#76572f;--cr-on:#33502d;--cr-on-lo:#7fbf6a;--cr-spot:#7fbf6a;--cr-hat:#d4ad3a;--cr-skin:#d9ae84;--cr-shirt:#5b87b8;--cr-ink:#eef1f6;}
.crate-yard{width:100%;touch-action:none;user-select:none;-webkit-user-select:none;cursor:pointer;}
.crate-yard svg{display:block;width:100%;height:auto;overflow:visible;}
.crate-yard .bx,.crate-yard .wk{transition:transform .09s linear;}
.crate-yard.shake svg{animation:crate-shake .22s;}
@keyframes crate-shake{25%{transform:translateX(-4px)}75%{transform:translateX(4px)}}
.crate-msg{min-height:22px;text-align:center;font:800 13px/1.6 'Manrope',system-ui,sans-serif;color:var(--stg-mute,#8b95a8);}
.crate-msg.bad{color:var(--pst-bad,#be123c);}
.crate-pad{display:none;grid-template-columns:repeat(3,60px);grid-template-rows:repeat(2,50px);gap:6px;justify-content:center;}
.crate-pad button{all:unset;box-sizing:border-box;display:grid;place-items:center;border:1px solid var(--stg-cell-line,rgba(28,30,36,.35));border-radius:14px;font:800 20px/1 'Manrope',system-ui,sans-serif;color:var(--cr-ink);cursor:pointer;}
.crate-pad button:active{background:var(--cr-floor);}
.crate-pad .u{grid-column:2;grid-row:1}.crate-pad .l{grid-column:1;grid-row:2}.crate-pad .d{grid-column:2;grid-row:2}.crate-pad .r{grid-column:3;grid-row:2}
@media (pointer:coarse){.crate-pad{display:grid;}}
`;

function Board({ P, s, setS, active, done, onStage }) {
  const M = modelOf(P);
  // Show the answer (owner, 2026-11-18), once the day is over: the stored line
  // comes from /api/daily-answer (the page strips it) and walks on this board.
  const [ans, setAns] = useState(null); // { line, i } while the answer shows
  const [ansNote, setAnsNote] = useState('');
  const shownLine = ans ? ans.line.slice(0, ans.i) : s.line;
  const now = useMemo(() => play(M, shownLine) || play(M, ''), [M, shownLine]);
  useEffect(() => {
    if (!ans || ans.i >= ans.line.length) return undefined;
    const t = setTimeout(() => setAns((a) => (a ? { ...a, i: a.i + 1 } : a)), ans.i === 0 ? 500 : 130);
    return () => clearTimeout(t);
  }, [ans]);
  const showAnswer = async () => {
    setAnsNote('');
    try {
      const r = await fetch(`/api/daily-answer?game=crate&num=${P.num}`);
      const j = await r.json();
      if (!j || typeof j.sol !== 'string' || !play(M, j.sol)) throw new Error('no answer');
      setAns({ line: j.sol, i: 0 });
    } catch (e) { setAnsNote('The answer could not be loaded. Try again in a moment.'); }
  };
  const [note, setNote] = useState(null);
  const [shake, setShake] = useState(0);
  const timers = useRef([]);
  const live = active && !done;
  useEffect(() => () => timers.current.forEach(clearTimeout), []);
  const cancelWalk = () => { timers.current.forEach(clearTimeout); timers.current = []; };

  const step = (k) => {
    if (!live) return false;
    let ok = false;
    setS((st) => {
      const cur = play(M, st.line);
      if (!cur) return st;
      const n = tryMove(M, cur, k);
      if (!n) return st;
      ok = true;
      return { ...st, line: st.line + k, moves: (st.moves || 0) + 1 };
    });
    return ok;
  };
  const push = (k) => {
    const cur = now; const n = tryMove(M, cur, k);
    if (!n) {
      const d = DIRS[k], ahead = cur.p + d[0] + d[1] * M.W;
      if (cur.boxes.includes(ahead)) { setNote({ t: 'That crate will not budge.', bad: true }); setShake((x) => x + 1); }
      return;
    }
    setNote(null);
    step(k);
  };
  const pushRef = useRef(push); pushRef.current = push;
  useEffect(() => {
    if (!live) return undefined;
    const KEYS = { ArrowUp: 'U', ArrowDown: 'D', ArrowLeft: 'L', ArrowRight: 'R', w: 'U', s: 'D', a: 'L', d: 'R' };
    const onKey = (ev) => {
      if (ev.metaKey || ev.ctrlKey || ev.altKey) return;
      const tag = (ev.target && ev.target.tagName) || '';
      if (tag === 'INPUT' || tag === 'TEXTAREA') return;
      const k = KEYS[ev.key]; if (!k) return;
      ev.preventDefault(); cancelWalk(); pushRef.current(k);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [live]); // eslint-disable-line react-hooks/exhaustive-deps

  // a tap walks there; a swipe is one step
  const svgRef = useRef(null), downAt = useRef(null);
  const cellAt = (ev) => {
    const r = svgRef.current.getBoundingClientRect();
    const x = Math.floor(((ev.clientX - r.left) / r.width) * M.W), y = Math.floor(((ev.clientY - r.top) / r.height) * M.H);
    return x >= 0 && y >= 0 && x < M.W && y < M.H ? y * M.W + x : -1;
  };
  const down = (ev) => { if (live) downAt.current = { x: ev.clientX, y: ev.clientY }; };
  const up = (ev) => {
    const d = downAt.current; downAt.current = null;
    if (!d || !live) return;
    const dx = ev.clientX - d.x, dy = ev.clientY - d.y;
    cancelWalk();
    if (Math.hypot(dx, dy) > 24) { push(Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 'R' : 'L') : (dy > 0 ? 'D' : 'U')); return; }
    const c = cellAt(ev); if (c < 0 || !M.inside[c] || M.wall[c]) return;
    const px = now.p % M.W, py = (now.p - px) / M.W, cx = c % M.W, cy = (c - cx) / M.W;
    if (Math.abs(px - cx) + Math.abs(py - cy) === 1) { push(DIR_KEYS.find((k) => DIRS[k][0] === cx - px && DIRS[k][1] === cy - py)); return; }
    if (now.boxes.includes(c)) { setNote({ t: 'Stand next to a crate to push it.', bad: false }); return; }
    const path = walkTo(M, now, c);
    if (path == null) { setNote({ t: 'No clear way there.', bad: true }); return; }
    setNote(null);
    [...path].forEach((k, i) => timers.current.push(setTimeout(() => step(k), i * 75)));
  };

  // draw
  const tiles = [], marks = [];
  for (let y = 0; y < M.H; y++) for (let x = 0; x < M.W; x++) {
    const i = y * M.W + x, X = x * S, Y = y * S;
    if (M.wall[i]) {
      let near = false;
      for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) { const xx = x + dx, yy = y + dy; if (xx >= 0 && yy >= 0 && xx < M.W && yy < M.H && M.inside[yy * M.W + xx] && !M.wall[yy * M.W + xx]) near = true; }
      if (near) tiles.push(<rect key={`w${i}`} x={X + 1} y={Y + 1} width={S - 2} height={S - 2} rx={7} fill="var(--cr-wall)" stroke="var(--cr-wall-lo)" strokeWidth={2} />);
    } else if (M.inside[i]) {
      tiles.push(<rect key={`f${i}`} x={X} y={Y} width={S} height={S} fill="var(--cr-floor)" stroke="var(--cr-floor-line)" strokeWidth={2} />);
      if (M.goal[i]) marks.push(<circle key={`g${i}`} cx={X + S / 2} cy={Y + S / 2} r={12} fill="none" stroke="var(--cr-spot)" strokeWidth={4} />);
    }
  }
  const crates = now.ids.map((c, k) => {
    const x = c % M.W, y = (c - x) / M.W, on = !!M.goal[c];
    return (
      <g key={`b${k}`} className="bx" style={{ transform: `translate(${x * S}px,${y * S}px)` }}>
        <rect x={6} y={6} width={S - 12} height={S - 12} rx={5} fill={on ? 'var(--cr-on)' : 'var(--cr-crate)'} stroke={on ? 'var(--cr-on-lo)' : 'var(--cr-crate-lo)'} strokeWidth={3} />
        {on ? <path d="M19 29l6 6 12-13" stroke="var(--cr-on-lo)" strokeWidth={4} fill="none" strokeLinecap="round" strokeLinejoin="round" />
          : <path d={`M12 12L${S - 12} ${S - 12}M${S - 12} 12L12 ${S - 12}`} stroke="var(--cr-crate-lo)" strokeWidth={3} strokeLinecap="round" />}
      </g>
    );
  });
  const wx = now.p % M.W, wy = (now.p - wx) / M.W, fx = DIRS[now.face][0] * 5, fy = DIRS[now.face][1] * 3;
  const placed = now.placed, n = M.boxes.length;
  return (
    <div className="crate" style={{ maxWidth: `min(${Math.round(M.W * 62)}px, calc((100dvh - 330px) * ${(M.W / M.H).toFixed(3)}))` }}>
      <style dangerouslySetInnerHTML={{ __html: CSS }} />
      <div key={shake} className={`crate-yard${shake ? ' shake' : ''}`} onPointerDown={down} onPointerUp={up} onPointerCancel={() => { downAt.current = null; }}>
        <svg ref={svgRef} viewBox={`0 0 ${M.W * S} ${M.H * S}`} role="img" aria-label={`A warehouse ${M.W} by ${M.H} with ${n} crates, ${placed} on their spots`}>
          {tiles}{marks}{crates}
          <g className="wk" style={{ transform: `translate(${wx * S + S / 2}px,${wy * S + S / 2}px)` }}>
            <ellipse cx={0} cy={12} rx={13} ry={10} fill="var(--cr-shirt)" />
            <circle cx={0} cy={-3} r={10} fill="var(--cr-skin)" />
            <path d="M-11 -5a11 11 0 0 1 22 0z" fill="var(--cr-hat)" />
            <rect x={-13 + fx} y={-6} width={26} height={3} rx={1.5} fill="var(--cr-hat)" />
            {now.face !== 'U' ? <><circle cx={-3.5 + fx} cy={fy} r={1.6} fill="var(--cr-eye)" /><circle cx={3.5 + fx} cy={fy} r={1.6} fill="var(--cr-eye)" /></> : null}
          </g>
        </svg>
      </div>
      {live ? (
        <div className="crate-pad" aria-label="Move pad">
          {[['u', 'U', '↑'], ['l', 'L', '←'], ['d', 'D', '↓'], ['r', 'R', '→']].map(([c, k, a]) => (
            <button key={k} type="button" className={c} aria-label={{ U: 'Up', D: 'Down', L: 'Left', R: 'Right' }[k]} onClick={() => { cancelWalk(); push(k); }}>{a}</button>
          ))}
        </div>
      ) : null}
      <div className={`crate-msg${(note && note.bad) || ansNote ? ' bad' : ''}`} aria-live="polite">
        {ans ? (ans.i < ans.line.length ? `The answer: move ${ans.i} of ${ans.line.length}` : `The answer: ${movesOf(ans.line.length)}, the fewest possible.`) : ansNote || (live && note ? note.t : '')}
      </div>
      {done && !onStage ? (
        <button type="button" className="sd-tool" onClick={ans ? () => setAns(null) : showAnswer}>
          {ans ? (ans.i < ans.line.length ? 'Stop' : 'Back to my warehouse') : 'Show the answer'}
        </button>
      ) : null}
    </div>
  );
}

function Tools({ P, s, setS, active, done }) {
  if (done) return null;
  const can = active && s.line.length > 0;
  const undo = () => setS((st) => (st.line.length ? { ...st, line: st.line.slice(0, -1) } : st));
  const restart = () => setS((st) => (st.line.length ? { ...st, line: '' } : st));
  return (
    <div style={{ display: 'flex', justifyContent: 'center', gap: 10 }}>
      <button type="button" className="sd-tool" onClick={undo} disabled={!can} style={{ opacity: can ? 1 : 0.4 }}>Undo</button>
      <button type="button" className="sd-tool" onClick={restart} disabled={!can} style={{ opacity: can ? 1 : 0.4 }}>Restart</button>
    </div>
  );
}

const crates = (P) => modelOf(P).boxes.length;

export const GAME = {
  key: 'crate', name: 'Crate', cat: 'Visual', miss: 'Moves', missOne: 'move',
  fresh: () => ({ line: '', moves: 0 }),
  validSave: (P, s) => !!s && typeof s.line === 'string' && /^[URDL]*$/.test(s.line) && Number.isInteger(s.moves) && s.moves >= s.line.length && !!play(modelOf(P), s.line),
  touched: (s) => (s.moves || 0) > 0,
  solved: (P, s) => { const r = play(modelOf(P), s.line); return !!r && r.placed === crates(P); },
  count: (s) => s.moves || 0,
  metric: (P, s, won) => (won ? s.moves || 0 : null),
  result: (P, s, won) => ({ score: won ? 10 : 0, total: 10, correct: won ? 1 : 0, guessesUsed: s.moves || 0 }),
  Board,
  tools: (props) => <Tools {...props} />,
  eyebrow: (P, s, { sundayLabel }) => `${sundayLabel || BAND[P.band]} · ${P.title} · No. ${P.num}`,
  foot: (P, s) => { const r = play(modelOf(P), s.line); return `${movesOf(s.moves || 0)} · ${r ? r.placed : 0} of ${crates(P)} crates placed`; },
  frac: (P, s) => { const r = play(modelOf(P), s.line); return r ? r.placed / crates(P) : 0; },
  sundayLabel: () => 'Sunday Edition',
  gateTitle: (P) => `Today: the ${P.title}, ${crates(P)} crates`,
  gateLine: (P) => `Push every crate onto a spot. You can push, never pull, and only one crate at a time. Every step counts, Undo included, so look before you move. The best possible today is ${movesOf(P.best.moves)}.`,
  rules: (P) => ({
    lead: 'Push every crate onto a spot.',
    steps: [
      <>Walk with the <b>arrow keys</b>, a <b>swipe</b> or the pad. <b>Tap</b> a square and the worker walks there the shortest clear way.</>,
      <>Walk into a crate to <b>push</b> it one square. You can never pull a crate, and you cannot push two at once.</>,
      <>A crate in a corner, or flat against a wall with no spot on it, is stuck for good. <b>Undo</b> takes back a step and <b>Restart</b> goes back to the start, but every step you took still counts.</>,
      <>The day is done when <b>every crate</b> is on a spot.</>,
    ],
    knack: 'Work out which crate goes on which spot, and in what order, before you push anything. The crate that would block the others goes last.',
    footer: 'A finished warehouse ranks on moves, fewest first, then the clock. Giving up scores nothing. Once the day is over, Show the answer walks the shortest line.',
  }),
  pitch: (P) => `${crates(P)} crates in the ${P.title}. Push every one onto a spot in as few moves as you can.`,
  shareLine: (P, s, won, el) => `Crate #${P.num} · ${P.title} · ${won ? `${movesOf(s.moves || 0)} (best ${P.best.moves}) · ${el}` : 'unfinished'}`,
  detail: (P, s, won, el) => `${P.title} · ${movesOf(s.moves || 0)}, best possible ${P.best.moves} · ${el}`,
  aboutTitle: 'About Crate: Daily Sokoban Puzzle',
  h1Tail: 'Daily Sokoban Puzzle',
  about: [
    'Crate is a free daily warehouse puzzle from Mind Loft, played by the classic box-pushing rules. A worker stands in a warehouse with a few crates and the same number of marked spots on the floor. Walk into a crate to push it one square. You can never pull one and you can never push two at once, so a crate shoved into a corner is there for good.',
    'Monday and Tuesday have three crates, Wednesday and Thursday four, and Friday and Saturday four in a tighter, longer warehouse. The Sunday Edition has five. Every warehouse is solved exactly before it is dealt, so the shortest possible line is known, and your result shows it beside your own.',
    'Every step counts, including the ones you take back with Undo. The fewest moves top the daily leaderboard, with the clock breaking a tie.',
    <>More puzzles about space and motion: <a href="/parker" style={{ color: 'inherit', fontWeight: 800 }}>Parker</a>, <a href="/topple" style={{ color: 'inherit', fontWeight: 800 }}>Topple</a> and <a href="/machine" style={{ color: 'inherit', fontWeight: 800 }}>Machine</a>.</>,
  ],
};

export default function CrateClient(props) {
  return <SimpleDaily {...props} game={GAME} />;
}
