'use client';

// Mow: the daily mow-every-square lawn puzzle (owner, 2026-11-16: "the same
// concept as Mop, but outside of the house mowing the lawn with trees, bushes,
// water features, maybe a shed, fence... all to take into account when trying
// to get from point a to point b without double mowing a tile of grass").
// A yard seen from above, one mower, one rule: mow every square of grass
// exactly once and leave by the gate marked Out. Fences split the yard into
// sections and the gates are the only ways through; trees, bushes, beds, the
// pond, the shed and (from Friday) the house stand in the way.
//
// QUICK REPLAY (owner, 2026-11-16: "this will get quick replay like the end
// games do ... replays are accepted. scoring should show total replays"). There
// is no Undo. Driving onto grass you have already mown flashes red and the
// mower is back at the gate in under a second, the clock still running, and
// that is one replay. Replay does the same by hand. The board ranks on the
// clock, with replays breaking a tie (lib/daily-games.js CLOCK_FIRST), and the
// result always shows the replays, 0 included. Mop plays by the same rule from
// its 2026-11-17 board.
//
// The model is lib/mop-engine.js (one floor), the drawing lib/mow-art.js.
// Runs on app/SimpleDaily.jsx.

import React, { useEffect, useMemo, useRef, useState } from 'react';
import SimpleDaily from '../SimpleDaily';
import { mopModel } from '@/lib/mop-engine';
import { U, DIRS, MOWER, MOW_DEFS, drawYard, mowerTurn, MOW_LIGHT, MOW_DARK, MOW_ART_CSS } from '@/lib/mow-art';

const PAD = 34, PADY = 80, FLASH_MS = 650;
const MODELS = typeof WeakMap !== 'undefined' ? new WeakMap() : null;
function modelOf(P) {
  let m = MODELS && MODELS.get(P);
  if (!m) { m = mopModel(P); if (MODELS) MODELS.set(P, m); }
  return m;
}
const BAND = { gentle: 'Gentle', moderate: 'Moderate', tough: 'Tough', sunday: 'Sunday Edition' };
const NAMES = { tree: 'A tree', bush: 'A bush', hedge: 'A hedge', flowers: 'A flower bed', veg: 'The vegetable bed', rock: 'A rock', birdbath: 'The birdbath', fountain: 'The fountain', kennel: 'The kennel', pond: 'The pond', shed: 'The shed', trampoline: 'The trampoline', house: 'The house', corner: 'The house' };
const pieceAt = (P, c) => { const F = P.floors[0], x = c % F.w, y = Math.floor(c / F.w); return F.pieces.find(([px, py, w, h]) => x >= px && x < px + w && y >= py && y < py + h); };
const same = (P) => P.sides[0] === P.sides[1];
const dirOf = (a, b, W) => (b === a + 1 ? 'E' : b === a - 1 ? 'W' : b > a ? 'S' : 'N');
const cellOf = (M, id) => M.at[id][0][1];

const CSS = `
.mow{align-self:center;width:100%;display:flex;flex-direction:column;gap:10px;${MOW_LIGHT}}
.stage-page[data-stage-theme='dark'] .mow{${MOW_DARK}}
.mow-yard{position:relative;border-radius:14px;overflow:hidden;border:1px solid var(--mw-ink);touch-action:none;user-select:none;-webkit-user-select:none;background:var(--mw-gravel);}
.mow-yard svg{display:block;width:100%;height:auto;overflow:visible;font-family:'Manrope',system-ui,sans-serif;}
.mow-yard.shake svg{animation:mow-shake .25s;}
@keyframes mow-shake{25%{transform:translateX(-4px)}75%{transform:translateX(4px)}}
${MOW_ART_CSS}
.mow-msg{min-height:22px;text-align:center;font:800 13px/1.6 'Manrope',system-ui,sans-serif;color:var(--pst-bad,#be123c);}
.mow-msg.ok{color:var(--mw-ink);}
`;

function Board({ P, s, setS, active, done }) {
  const M = modelOf(P), F = P.floors[0], W = F.w, H = F.h;
  const [note, setNote] = useState(null);
  const [shake, setShake] = useState(0);
  const [flash, setFlash] = useState(null);
  const svgRef = useRef(null), drag = useRef(false), timer = useRef(null);
  useEffect(() => () => clearTimeout(timer.current), []);
  const here = s.path[s.path.length - 1];
  const on = useMemo(() => new Set(s.path), [s.path]);
  // which way each square was mown, so the stripes follow the route
  const cut = useMemo(() => {
    const d = {};
    s.path.forEach((id, i) => {
      const c = cellOf(M, id), prev = i ? cellOf(M, s.path[i - 1]) : null;
      d[c] = prev == null ? (P.sides[0] === 'S' || P.sides[0] === 'N' ? 'v' : 'h') : (Math.abs(c - prev) === 1 ? 'h' : 'v');
    });
    return d;
  }, [s.path, M, P]);
  const art = useMemo(() => drawYard(P, M, { padX: PAD, padY: PADY }), [P, M]);
  const solved = s.path.length === M.n && here === M.end;
  const live = active && !done && !flash;

  const nudge = (t) => { setNote({ t, bad: true }); setShake((n) => n + 1); };
  const replay = (why) => {
    setNote({ t: why, bad: true });
    timer.current = setTimeout(() => {
      setFlash(null);
      setS((st) => ({ ...st, path: [M.start], dir: null, replays: (st.replays || 0) + 1 }));
      setNote({ t: 'Back at the gate. The clock is still running.' });
    }, FLASH_MS);
  };
  const step = (dx, dy, quiet) => {
    if (!live) return;
    const pc = cellOf(M, here);
    const x = (pc % W) + dx, y = Math.floor(pc / W) + dy;
    if (x < 0 || y < 0 || x >= W || y >= H) return;
    const c = y * W + x, nd = M.floors[0].node[c];
    if (nd < 0) { if (!quiet) { const p = pieceAt(P, c); nudge(`${p ? NAMES[p[4]] || 'Something' : 'Something'} in the way.`); } return; }
    if (!M.floors[0].open(pc, c)) { if (!quiet) nudge('A fence. Find a gate.'); return; }
    if (on.has(nd)) {
      // a drag that wobbles back onto the square it just left is a slip of the
      // finger, not a choice: ignore it; any other mown square is a replay
      if (quiet && s.path.length > 1 && nd === s.path[s.path.length - 2]) return;
      setFlash(c); replay('Already mown. Replay.'); return;
    }
    const len = s.path.length + 1;
    if (nd === M.end && len !== M.n) { if (!quiet) nudge('That is the way out. Mow the rest first.'); return; }
    if (len === M.n && nd === M.end) setNote({ t: 'Every blade. Out you go.' });
    else if (!M.adj[nd].some((q) => q !== here && !on.has(q))) setNote({ t: 'Boxed in. Tap Replay.', bad: true });
    else setNote(null);
    const dir = dirOf(pc, c, W);
    setS((st) => (st.path[st.path.length - 1] !== here ? st : { ...st, path: [...st.path, nd], dir }));
  };
  const stepRef = useRef(step); stepRef.current = step;
  useEffect(() => {
    if (!active || done) return undefined;
    const KEYS = { ArrowUp: [0, -1], ArrowDown: [0, 1], ArrowLeft: [-1, 0], ArrowRight: [1, 0], w: [0, -1], s: [0, 1], a: [-1, 0], d: [1, 0] };
    const onKey = (ev) => {
      if (ev.metaKey || ev.ctrlKey || ev.altKey) return;
      const tag = (ev.target && ev.target.tagName) || '';
      if (tag === 'INPUT' || tag === 'TEXTAREA') return;
      const k = KEYS[ev.key]; if (!k) return;
      ev.preventDefault(); stepRef.current(k[0], k[1]);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [active, done]);
  // the Replay button clears the note through the path going back to one square
  useEffect(() => { if (s.path.length < 2 && !flash) setNote((n) => (n && n.bad ? null : n)); }, [s.path.length, flash]);

  const delta = (ev) => {
    const svg = svgRef.current; if (!svg) return null;
    const pc = cellOf(M, here), r = svg.getBoundingClientRect();
    const x = ((ev.clientX - r.left) / r.width) * (W * U + PAD * 2) - PAD, y = ((ev.clientY - r.top) / r.height) * (H * U + PADY * 2) - PADY;
    return [Math.floor(x / U) - (pc % W), Math.floor(y / U) - Math.floor(pc / W)];
  };
  const down = (ev) => {
    if (!live) return;
    drag.current = true;
    const d = delta(ev);
    if (d && Math.abs(d[0]) + Math.abs(d[1]) === 1) step(d[0], d[1]);
  };
  const move = (ev) => {
    if (!drag.current || !live) return;
    const d = delta(ev);
    if (d && Math.abs(d[0]) + Math.abs(d[1]) === 1) step(d[0], d[1], true);
  };
  const up = () => { drag.current = false; };

  const pc = cellOf(M, here);
  let bx = (pc % W) * U + 50, by = Math.floor(pc / W) * U + 50;
  const gone = solved;
  if (gone) by += DIRS[P.sides[1]][1] * 140;
  const facing = gone ? P.sides[1] : (s.dir || (P.sides[0] === 'S' ? 'N' : 'S'));
  const tiles = [];
  for (let c = 0; c < W * H; c++) {
    const id = M.floors[0].node[c];
    const cls = id < 0 ? 'f' : flash === c ? 'x' : on.has(id) ? cut[c] || 'h' : 'u';
    tiles.push(<rect key={c} className={`g ${cls}`} x={(c % W) * U} y={Math.floor(c / W) * U} width={U} height={U} />);
  }
  const left = M.n - s.path.length;
  // the board fits the screen's height too, so a big Sunday yard draws smaller
  // squares rather than running off a phone (owner, 2026-11-16)
  const aspect = (H * U + PADY * 2) / (W * U + PAD * 2);
  return (
    <div className="mow" style={{ maxWidth: `min(640px, calc((100dvh - 300px) / ${aspect.toFixed(3)}))` }}>
      <style dangerouslySetInnerHTML={{ __html: CSS }} />
      <div key={shake} className={`mow-yard${shake ? ' shake' : ''}`}
        onPointerDown={down} onPointerMove={move} onPointerUp={up} onPointerCancel={up} onPointerLeave={up}>
        <svg ref={svgRef} viewBox={`${-PAD} ${-PADY} ${W * U + PAD * 2} ${H * U + PADY * 2}`} role="img"
          aria-label={`A yard ${W} by ${H}, ${left} ${left === 1 ? 'square' : 'squares'} of grass left to mow`}>
          <g dangerouslySetInnerHTML={{ __html: MOW_DEFS + art.under }} />
          {tiles}
          <g dangerouslySetInnerHTML={{ __html: art.over }} />
          <g className={`bot${gone ? ' out' : ''}`} style={{ transform: `translate(${bx}px,${by}px)` }}>
            <g style={{ transform: `rotate(${mowerTurn(facing)}deg) scale(.95)` }} dangerouslySetInnerHTML={{ __html: MOWER }} />
          </g>
        </svg>
      </div>
      <div className={`mow-msg${note && !note.bad ? ' ok' : ''}`} aria-live="polite">{active && !done && note ? note.t : ''}</div>
    </div>
  );
}

function Tools({ P, s, setS, active, done }) {
  if (done) return null;
  const M = modelOf(P), can = active && s.path.length > 1;
  const replay = () => setS((st) => (st.path.length < 2 ? st : { ...st, path: [M.start], dir: null, replays: (st.replays || 0) + 1 }));
  const n = s.replays || 0;
  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 12 }}>
      <button type="button" className="sd-tool" onClick={replay} disabled={!can} style={{ opacity: can ? 1 : 0.4 }}>Replay</button>
      <span style={{ font: "800 13px/1 'Manrope',system-ui,sans-serif", color: 'var(--stg-mute,#8b95a8)' }}>{n} {n === 1 ? 'replay' : 'replays'}</span>
    </div>
  );
}

const doors = (P) => (same(P) ? 'Come in from the street and leave by the same gate: it is two squares wide, in on one side and out on the other.' : 'Come in from the street and leave by the back gate.');
const plural = (n) => `${n} ${n === 1 ? 'replay' : 'replays'}`;

const GAME = {
  key: 'mow', name: 'Mow', cat: 'Logic', miss: 'Replays', missOne: 'replay',
  fresh: (P) => ({ path: [modelOf(P).start], dir: null, replays: 0 }),
  validSave: (P, s) => { const M = modelOf(P); return Array.isArray(s.path) && s.path.length >= 1 && s.path[0] === M.start && s.path.every((v) => Number.isInteger(v) && v >= 0 && v < M.n) && new Set(s.path).size === s.path.length; },
  touched: (s) => s.path.length > 1 || (s.replays || 0) > 0,
  solved: (P, s) => { const M = modelOf(P); return s.path.length === M.n && s.path[s.path.length - 1] === M.end; },
  count: (s) => s.replays || 0,
  metric: (P, s, won) => (won ? s.replays || 0 : null),
  result: (P, s, won) => ({ score: won ? 10 : 0, total: 10, correct: won ? 1 : 0, guessesUsed: s.replays || 0 }),
  Board,
  tools: (props) => <Tools {...props} />,
  eyebrow: (P, s, { sundayLabel }) => `${sundayLabel || BAND[P.band]} · The ${P.yard} · No. ${P.num}`,
  foot: (P, s) => `Mowed ${s.path.length} of ${modelOf(P).n}`,
  frac: (P, s) => s.path.length / modelOf(P).n,
  sundayLabel: () => 'Sunday Edition · The Estate',
  gateTitle: (P) => `Today: the ${P.yard}, ${modelOf(P).n} squares of grass`,
  gateLine: (P) => `Mow every square of grass exactly once. Run over grass you have already mown and you replay from the gate, with the clock still running. ${doors(P)}`,
  rules: (P) => ({
    lead: 'Mow every square once, then out the gate.',
    steps: [
      <><b>Tap</b> or <b>drag</b> to the next square, up, down, left or right (arrow keys work too). Every square you drive onto is mown.</>,
      <>Trees, bushes, beds, the pond, the shed and the house are in the way. <b>Fences</b> split the yard, and the gaps between the posts are the <b>gates</b>.</>,
      <>Drive onto grass you have <b>already mown</b> and it is a <b>replay</b>: the mower is back at the gate and the clock keeps running. <b>Replay</b> does the same any time you are boxed in.</>,
      <>{doors(P)} The last square you mow is the one inside the gate marked <b>Out</b>.</>,
    ],
    knack: 'Corners and dead ends first. A square with only two ways in has to be driven straight through, and a section with one gate has to be mown in one go.',
    footer: 'A finished yard ranks on the clock, with fewer replays breaking a tie. Giving up scores nothing.',
  }),
  pitch: (P) => `${modelOf(P).n} squares of grass in the ${P.yard}. Mow every one exactly once and get out the gate.`,
  shareLine: (P, s, won, el) => `Mow #${P.num} · the ${P.yard} · ${won ? `${el} · ${plural(s.replays || 0)}` : 'unfinished'}`,
  detail: (P, s, won, el) => `The ${P.yard} · ${modelOf(P).n} squares · ${plural(s.replays || 0)} · ${el}`,
  aboutTitle: 'About Mow',
  about: [
    'Mow is a free daily route puzzle from Mind Loft, the outdoor sibling of Mop. A yard is drawn from above, with fences, gates, trees, bushes, flower beds, a pond, a shed and sometimes the house, and you push a mower across it one square at a time. Every square of grass has to be mown exactly once, and the last one you mow is inside the gate you leave by.',
    'Run over grass you have already mown and the mower goes straight back to the gate for a replay, with the clock still running. The fastest clean yard tops the daily board, and fewer replays break a tie.',
    'Monday is the easy day, seven by six, and the yard grows a row or a column every day after it, up to the ten by ten Estate on Sunday, with the house more likely from Thursday. Every yard is generated fresh and solved before it is dealt, so there is always a way round.',
    <>More route puzzles: <a href="/mop" style={{ color: 'inherit', fontWeight: 800 }}>Mop</a>, <a href="/connect" style={{ color: 'inherit', fontWeight: 800 }}>Connect</a> and <a href="/chomp" style={{ color: 'inherit', fontWeight: 800 }}>Chomp</a>.</>,
  ],
};

export default function MowClient(props) {
  return <SimpleDaily {...props} game={GAME} />;
}
