'use client';

import { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import Link from 'next/link';
import Footer from '../Footer';
import { KidsHeader, KIDS_CSS, Confetti, KidsStrip } from './KidsShell';

// Kids Jigsaw (/kids/jigsaw) and Kids Tall Jigsaw (/kids/tall-jigsaw): two
// kids dailies that serve THE SAME PHOTO as today's Jig and today's Saw
// (owner, 2026-11-11), with the kid choosing 6, 12, 20 or 30 pieces. Drag
// each piece onto the board and it snaps home when it lands near its spot.
// "All pictures" opens the kids Jigsaw Puzzle Shelf: every Jig and Saw photo
// so far, wide and tall, from one shared list. Not scored; the only memory is
// local (the kids done flag the hub reads, and which photos were finished).
// Photos come through the grown-up routes (/api/jig/img, /api/saw/img), which
// refuse a day not yet live.

const S = 100;        // one piece, in board units
const KNOB = 30;      // room a tab reaches past its square
const SNAP = 0.5 * S; // generous: a drop this close to its spot locks in
const COUNTS = [6, 12, 20, 30];
const GRID = {
  wide: { 6: [3, 2], 12: [4, 3], 20: [5, 4], 30: [6, 5] },
  tall: { 6: [2, 3], 12: [3, 4], 20: [4, 5], 30: [5, 6] },
};
const N_KEY = 'sot_kids_jigsaw_pieces';

function rng(seed) {
  let st = seed >>> 0;
  return () => { st = (st * 1664525 + 1013904223) >>> 0; return st / 4294967296; };
}

// The same tab-and-blank cut as Jig (app/jig/JigClient.jsx cutPieces), kept
// separate so the grown-up game can change without touching the kids one.
function cutPieces(C, R, seed) {
  const rnd = rng(seed);
  const Hz = [], Vt = [];
  for (let r = 0; r <= R; r++) { Hz[r] = []; for (let c = 0; c < C; c++) Hz[r][c] = (r === 0 || r === R) ? 0 : (rnd() < 0.5 ? 1 : -1); }
  for (let r = 0; r < R; r++) { Vt[r] = []; for (let c = 0; c <= C; c++) Vt[r][c] = (c === 0 || c === C) ? 0 : (rnd() < 0.5 ? 1 : -1); }
  const wob = {};
  const wobOf = (k) => { if (!wob[k]) wob[k] = [rnd() * 0.08 - 0.04, rnd() * 0.06 - 0.03]; return wob[k]; };
  const f = (n) => Math.round(n * 10) / 10;
  const edge = (x0, y0, x1, y1, sg, key) => {
    if (!sg) return ` L${x1} ${y1}`;
    const L = Math.hypot(x1 - x0, y1 - y0), dx = (x1 - x0) / L, dy = (y1 - y0) / L, nx = dy, ny = -dx;
    const [w0, w1] = wobOf(key.k);
    const sh = key.rev ? -w0 : w0;
    const P = (u, v) => {
      const uu = u + sh, vv = v * (1 + w1);
      return `${f(x0 + dx * uu * L + nx * vv * L * sg)} ${f(y0 + dy * uu * L + ny * vv * L * sg)}`;
    };
    return ` L${P(0.35, 0)} C${P(0.40, 0)} ${P(0.42, 0.05)} ${P(0.38, 0.10)}`
      + ` C${P(0.32, 0.20)} ${P(0.42, 0.28)} ${P(0.50, 0.28)}`
      + ` C${P(0.58, 0.28)} ${P(0.68, 0.20)} ${P(0.62, 0.10)}`
      + ` C${P(0.58, 0.05)} ${P(0.60, 0)} ${P(0.65, 0)} L${x1} ${y1}`;
  };
  const out = [];
  for (let r = 0; r < R; r++) for (let c = 0; c < C; c++) {
    const x = c * S, y = r * S;
    const d = `M${x} ${y}`
      + edge(x, y, x + S, y, -Hz[r][c], { k: `h${r}-${c}`, rev: false })
      + edge(x + S, y, x + S, y + S, Vt[r][c + 1], { k: `v${r}-${c + 1}`, rev: false })
      + edge(x + S, y + S, x, y + S, Hz[r + 1][c], { k: `h${r + 1}-${c}`, rev: true })
      + edge(x, y + S, x, y, -Vt[r][c], { k: `v${r}-${c}`, rev: true })
      + ' Z';
    out.push({ i: r * C + c, x, y, d });
  }
  return out;
}

function shuffled(n, seed) {
  const rnd = rng(seed * 31 + 7);
  const a = Array.from({ length: n }, (_, i) => i);
  for (let i = n - 1; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); const t = a[i]; a[i] = a[j]; a[j] = t; }
  return a;
}

// Where the board's picture actually sits on screen: the SVG letterboxes its
// viewBox (meet), so the scale is the smaller of the two fits and the picture
// is centred inside the element. Returns the screen point of board unit
// (-KNOB, -KNOB), i.e. a piece box's origin maps from (left - x) / scale.
function fitOf(el, BW, BH) {
  const r = el.getBoundingClientRect();
  const W = BW + 2 * KNOB, H = BH + 2 * KNOB;
  const scale = Math.min(r.width / W, r.height / H) || 0;
  return { scale, x: r.left + (r.width - W * scale) / 2, y: r.top + (r.height - H * scale) / 2 };
}

// Finished photos, keyed by board key ('jig-12', 'saw-3'), each a list of the
// piece counts done.
const DONE_KEY = 'sot_kids_jigsaw_photos';
function readDone() {
  try { const o = JSON.parse(localStorage.getItem(DONE_KEY) || '{}'); return o && typeof o === 'object' ? o : {}; } catch (e) { return {}; }
}
function markDone(key, n) {
  try {
    const o = readDone();
    const a = Array.isArray(o[key]) ? o[key] : [];
    if (!a.includes(n)) a.push(n);
    o[key] = a.sort((x, y) => x - y);
    localStorage.setItem(DONE_KEY, JSON.stringify(o));
    return o;
  } catch (e) { return null; }
}

// One piece drawn on its own, the photo clipped to its outline. `idp` must be
// unique on the page (tray, floating and board copies each get their own).
function PieceSvg({ p, BW, BH, src, idp, size, lift }) {
  return (
    <svg viewBox={`${p.x - KNOB} ${p.y - KNOB} ${S + 2 * KNOB} ${S + 2 * KNOB}`} width={size} height={size}
      style={{ display: 'block', overflow: 'visible', filter: lift ? 'drop-shadow(0 10px 10px rgba(27,31,59,.35))' : 'drop-shadow(0 3px 0 rgba(27,31,59,.18))' }} aria-hidden="true">
      <defs><clipPath id={idp}><path d={p.d} /></clipPath></defs>
      <rect x={p.x - KNOB} y={p.y - KNOB} width={S + 2 * KNOB} height={S + 2 * KNOB} fill="#fffdf6" clipPath={`url(#${idp})`} />
      <image href={src} x="0" y="0" width={BW} height={BH} preserveAspectRatio="xMidYMid slice" clipPath={`url(#${idp})`} />
      <path d={p.d} fill="none" stroke="rgba(255,255,255,.9)" strokeWidth="5" />
      <path d={p.d} fill="none" stroke="rgba(27,31,59,.55)" strokeWidth="2" />
    </svg>
  );
}

const SHAPES = [['all', 'All'], ['wide', 'Wide'], ['tall', 'Tall']];

function Picker({ boards, done, n, setN, onPick, shape, setShape }) {
  const shown = boards.filter((b) => shape === 'all' || (shape === 'tall') === !!b.tall);
  const count = (k) => boards.filter((b) => k === 'all' || (k === 'tall') === !!b.tall).length;
  return (
    <>
      <div className="kj-count">
        <span className="kd-lbl">How many pieces?</span>
        <div className="kj-counts" role="radiogroup" aria-label="Number of pieces">
          {COUNTS.map((c) => (
            <button key={c} type="button" role="radio" aria-checked={n === c} className={n === c ? 'on' : ''} onClick={() => setN(c)}>
              <b>{c}</b><span>{c === 6 ? 'Easy' : c === 12 ? 'Medium' : c === 20 ? 'Hard' : 'Super'}</span>
            </button>
          ))}
        </div>
      </div>
      <div className="kj-count">
        <span className="kd-lbl">Which pictures?</span>
        <div className="kd-seg" role="radiogroup" aria-label="Picture shape">
          {SHAPES.map(([k, lab]) => (
            <button key={k} type="button" role="radio" aria-checked={shape === k} className={shape === k ? 'on' : ''} onClick={() => setShape(k)}>{lab} {count(k)}</button>
          ))}
        </div>
      </div>
      <div className="kj-shelf">
        {shown.map((b) => {
          const got = Array.isArray(done[b.key]) ? done[b.key] : [];
          return (
            <button key={b.key} type="button" className={`kj-pic${b.tall ? ' tall' : ''}${got.length ? ' done' : ''}`} onClick={() => onPick(b.key)}>
              <span className="kj-thumb"><img src={`${b.img}?n=${b.num}&w=330`} alt={b.name} loading="lazy" /></span>
              <span className="kj-nm">{b.name}</span>
              <span className="kj-meta">{got.length ? `Done with ${got.join(', ')} pieces ✓` : (b.tall ? 'Tall picture' : 'Wide picture')}</span>
            </button>
          );
        })}
      </div>
      {!shown.length ? <p className="kd-note">The first pictures arrive tomorrow. Check back soon!</p> : null}
    </>
  );
}

function Play({ board, n, setN, onBack, onDone }) {
  const { img, tall } = board;
  const [C, R] = GRID[tall ? 'tall' : 'wide'][n];
  const BW = C * S, BH = R * S;
  const src = `${img}?n=${board.num}&w=960`;
  const pieces = useMemo(() => cutPieces(C, R, (board.num * 7919 + n * 131) >>> 0), [C, R, board.num, n]);
  const order = useMemo(() => shuffled(pieces.length, board.num * 17 + n), [pieces.length, board.num, n]);
  const [placed, setPlaced] = useState(() => new Set());
  const [ghost, setGhost] = useState(true);
  const [drag, setDrag] = useState(null); // { i, px, py }
  const [miss, setMiss] = useState(null);
  const [cheer, setCheer] = useState(0);
  const [scale, setScale] = useState(0);
  const [narrow, setNarrow] = useState(false);
  const boardRef = useRef(null);
  const dragRef = useRef(null);
  dragRef.current = drag;
  const finished = placed.size === pieces.length;

  useEffect(() => {
    const el = boardRef.current;
    if (!el) return undefined;
    const measure = () => {
      setScale(fitOf(el, BW, BH).scale);
      setNarrow(window.innerWidth < 640);
    };
    measure();
    let ro = null;
    try { ro = new ResizeObserver(measure); ro.observe(el); } catch (e) { window.addEventListener('resize', measure); }
    return () => { if (ro) ro.disconnect(); else window.removeEventListener('resize', measure); };
  }, [BW]);

  const box = (S + 2 * KNOB) * scale;            // a piece at board size, px
  const trayBox = Math.min(box, narrow ? 84 : 118); // a piece waiting in the tray

  const place = useCallback((i) => {
    setPlaced((prev) => { const nx = new Set(prev); nx.add(i); return nx; });
  }, []);
  // The finish is noticed after the render that completes the board, never
  // inside the state update (that would set the parent's state mid-render).
  useEffect(() => {
    if (finished && placed.size) { onDone(n); setCheer((c) => c + 1); }
  }, [finished]); // eslint-disable-line react-hooks/exhaustive-deps

  // Drag: the lifted piece follows the finger at full board size, centred
  // under it. On release, if its top-left sits within SNAP of its own spot it
  // locks in; otherwise it hops back to the tray with a little shake.
  useEffect(() => {
    if (!drag) return undefined;
    const move = (e) => { setDrag((d) => (d ? { ...d, px: e.clientX, py: e.clientY } : d)); };
    const up = (e) => {
      const d = dragRef.current;
      setDrag(null);
      if (!d || !boardRef.current) return;
      const fit = fitOf(boardRef.current, BW, BH);
      const left = e.clientX - box / 2, top = e.clientY - box / 2 - d.lift;
      const ux = (left - fit.x) / fit.scale, uy = (top - fit.y) / fit.scale;
      const p = pieces[d.i];
      if (Math.abs(ux - p.x) < SNAP && Math.abs(uy - p.y) < SNAP) place(d.i);
      else if (d.moved) { setMiss(d.i); setTimeout(() => setMiss(null), 400); }
    };
    document.documentElement.classList.add('kj-nosel');
    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', up);
    window.addEventListener('pointercancel', up);
    return () => {
      document.documentElement.classList.remove('kj-nosel');
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerup', up);
      window.removeEventListener('pointercancel', up);
    };
  }, [drag ? drag.i : null, box, scale, pieces, place]); // eslint-disable-line react-hooks/exhaustive-deps

  const startDrag = (i) => (e) => {
    if (finished || !scale) return;
    e.preventDefault();
    const touch = e.pointerType === 'touch';
    setDrag({ i, px: e.clientX, py: e.clientY, lift: touch ? Math.min(40, box * 0.3) : 0, moved: false, sx: e.clientX, sy: e.clientY });
  };
  useEffect(() => {
    if (drag && !drag.moved && Math.hypot(drag.px - drag.sx, drag.py - drag.sy) > 6) setDrag((d) => (d ? { ...d, moved: true } : d));
  }, [drag]);

  const helpMe = () => {
    const next = order.find((i) => !placed.has(i));
    if (next != null) place(next);
  };
  const restart = () => { setPlaced(new Set()); setCheer(0); };

  const tray = order.filter((i) => !placed.has(i));
  const pre = `kj-${board.key}-${n}`;
  const aspect = (BW + 2 * KNOB) / (BH + 2 * KNOB);

  return (
    <>
      <div className="kj-bar">
        <button type="button" className="kd-btn" onClick={onBack}>All pictures</button>
        <div className="kd-seg" role="radiogroup" aria-label="Number of pieces">
          {COUNTS.map((c) => (
            <button key={c} type="button" role="radio" aria-checked={n === c} className={n === c ? 'on' : ''} onClick={() => setN(c)}>{c}</button>
          ))}
        </div>
        <span className="kj-left">{finished ? 'All done!' : `${tray.length} piece${tray.length === 1 ? '' : 's'} to go`}</span>
      </div>

      <div className={`kj-play${tall ? ' tall' : ''}`}>
        <div className="kd-card kj-boardcard">
          <svg ref={boardRef} className="kj-board" viewBox={`${-KNOB} ${-KNOB} ${BW + 2 * KNOB} ${BH + 2 * KNOB}`}
            style={{ width: `min(100%, calc(64vh * ${aspect.toFixed(3)}))`, aspectRatio: `${BW + 2 * KNOB} / ${BH + 2 * KNOB}` }} role="img" aria-label={`Jigsaw board: ${board.name}`}>
            <rect x="-6" y="-6" width={BW + 12} height={BH + 12} rx="14" fill="#fffdf6" stroke="#ecdfbd" strokeWidth="5" />
            {ghost && !finished ? <image href={src} x="0" y="0" width={BW} height={BH} preserveAspectRatio="xMidYMid slice" opacity="0.22" /> : null}
            {pieces.filter((p) => placed.has(p.i)).map((p) => (
              <g key={p.i} className="kj-in">
                <clipPath id={`${pre}-b${p.i}`}><path d={p.d} /></clipPath>
                <image href={src} x="0" y="0" width={BW} height={BH} preserveAspectRatio="xMidYMid slice" clipPath={`url(#${pre}-b${p.i})`} />
                {!finished ? <path d={p.d} fill="none" stroke="rgba(255,255,255,.75)" strokeWidth="2" /> : null}
              </g>
            ))}
            {finished ? <image className="kj-whole" href={src} x="0" y="0" width={BW} height={BH} preserveAspectRatio="xMidYMid slice" /> : null}
          </svg>
          {finished ? (
            <div className="kd-cheer show">
              You did it! {board.name}.
              <small>Photo: {board.by}, {board.lic}, via Wikimedia Commons</small>
            </div>
          ) : null}
          <div className="kd-ctrls">
            {finished ? (
              <>
                {n < 30 ? <button type="button" className="kd-btn pri" onClick={() => setN(COUNTS[COUNTS.indexOf(n) + 1])}>Try {COUNTS[COUNTS.indexOf(n) + 1]} pieces</button> : null}
                <button type="button" className="kd-btn" onClick={restart}>Play again</button>
                <button type="button" className="kd-btn" onClick={onBack}>Pick another picture</button>
              </>
            ) : (
              <>
                <button type="button" className="kd-btn" onClick={() => setGhost((g) => !g)}>{ghost ? 'Hide the picture' : 'Show the picture'}</button>
                <button type="button" className="kd-btn" onClick={helpMe}>Help me</button>
                <button type="button" className="kd-btn" onClick={restart} disabled={!placed.size}>Start over</button>
              </>
            )}
          </div>
        </div>

        {!finished ? (
          <div className="kj-tray" aria-label="Pieces">
            {tray.map((i) => (
              <div key={i} className={`kj-tp${miss === i ? ' kd-shake' : ''}`} style={{ width: trayBox, height: trayBox, visibility: drag && drag.i === i ? 'hidden' : 'visible' }}
                data-home={`${pieces[i].x},${pieces[i].y}`} onPointerDown={startDrag(i)}>
                <PieceSvg p={pieces[i]} BW={BW} BH={BH} src={src} idp={`${pre}-t${i}`} size={trayBox} />
              </div>
            ))}
          </div>
        ) : null}
      </div>

      <h2 className="kj-howh">How to play</h2>
      <p className="kd-how kj-how">Drag a piece onto the board. When it lands near its own spot it clicks in. Stuck? Show the picture underneath, or tap Help me and one piece jumps home. Pick more pieces when you want a bigger challenge.</p>

      {drag ? (
        <div className="kj-float" style={{ left: drag.px - box / 2, top: drag.py - box / 2 - drag.lift, width: box, height: box }}>
          <PieceSvg p={pieces[drag.i]} BW={BW} BH={BH} src={src} idp={`${pre}-f${drag.i}`} size={box} lift />
        </div>
      ) : null}
      <Confetti go={cheer} />
    </>
  );
}

const JIG_CSS = `
.kj-count{display:flex;align-items:center;gap:14px;flex-wrap:wrap;margin:4px 0 18px}
.kj-counts{display:flex;gap:10px;flex-wrap:wrap}
.kj-counts button{display:flex;flex-direction:column;align-items:center;min-width:76px;padding:8px 14px;border:2.5px solid var(--kline);border-radius:16px;background:#fff;box-shadow:0 4px 0 #e9d9ad;line-height:1.1}
.kj-counts button b{font-size:24px;font-weight:700}
.kj-counts button span{font-size:12px;font-weight:600;color:var(--kink2)}
.kj-counts button.on{background:var(--kink);border-color:var(--kink);color:#fff;box-shadow:0 4px 0 #0c0f24}
.kj-counts button.on span{color:#fff;opacity:.85}
.kj-shelf{display:flex;flex-wrap:wrap;align-items:flex-end;gap:22px 16px;padding:6px 4px 0}
.kj-back{margin:0 0 12px}
.kj-linkbtn{border:0;background:none;padding:0;font-family:var(--kdisp);font-weight:700;font-size:15px;color:var(--kblue);text-decoration:underline;cursor:pointer}
.kj-pic{width:200px;display:flex;flex-direction:column;align-items:stretch;text-align:left;padding:0;border:2px solid var(--kline);border-radius:20px;background:#fff;overflow:hidden;box-shadow:var(--kshadow);transition:transform .15s,border-color .15s}
.kj-pic:hover{transform:translateY(-3px);border-color:var(--kink)}
.kj-thumb{display:block;aspect-ratio:4/3;background:#f3e3b5;overflow:hidden}
.kj-pic.tall{width:150px}
.kj-pic.tall .kj-thumb{aspect-ratio:4/5}
@media (max-width:520px){.kj-shelf{gap:18px 10px}.kj-pic{width:calc(50% - 5px)}.kj-pic.tall{width:calc(50% - 5px)}}
.kj-thumb img{width:100%;height:100%;object-fit:cover;display:block}
.kj-nm{font-family:var(--kdisp);font-weight:600;font-size:16px;line-height:1.2;padding:10px 12px 2px}
.kj-meta{font-family:var(--kbody);font-size:12.5px;font-weight:700;color:var(--kink2);padding:0 12px 12px}
.kj-pic.done{border-color:#bfe7d1;background:#f0faf3}
.kj-pic.done .kj-meta{color:var(--kgreen)}
.kj-bar{display:flex;align-items:center;gap:12px;flex-wrap:wrap;margin:0 0 14px}
.kj-left{font-family:var(--kdisp);font-weight:600;color:var(--kink2);margin-left:auto}
.kj-play{display:flex;flex-direction:column;gap:18px}
.kj-boardcard{padding:16px}
.kj-board{display:block;margin:0 auto;height:auto;touch-action:manipulation;user-select:none}
.kj-in{animation:kjin .35s ease-out}
@keyframes kjin{from{opacity:.4}to{opacity:1}}
.kj-whole{animation:kjin .8s ease-out}
.kj-tray{display:flex;flex-wrap:wrap;gap:6px;justify-content:center;align-content:flex-start;padding:14px;background:rgba(255,255,255,.6);border:2px dashed transparent;border-radius:22px}
.kj-tp{cursor:grab;touch-action:none;user-select:none;-webkit-user-select:none;-webkit-touch-callout:none}
.kj-tp:active{cursor:grabbing}
.kj-nosel,.kj-nosel *{user-select:none!important;-webkit-user-select:none!important;cursor:grabbing}
.kj-float{position:fixed;z-index:60;pointer-events:none;touch-action:none}
.kj-howh{font-size:17px;font-weight:700;margin:26px 0 0;padding-top:16px;border-top:2px solid var(--kline);color:var(--kink2)}
.kj-how{max-width:60ch}
/* Desktop: the tray sits beside the board so every piece is in reach. */
@media (min-width:900px){
  .kj-play{display:grid;grid-template-columns:minmax(0,1.35fr) minmax(0,1fr);align-items:start}
  .kj-play.tall{grid-template-columns:minmax(0,1.1fr) minmax(0,1fr)}
  .kj-tray{max-height:80vh;overflow:auto}
}
/* Phones: two rows that scroll sideways right under the board. A sideways
   swipe scrolls the strip (pan-x); lifting a piece up drags it. */
@media (max-width:639px){
  .kj-play{gap:12px}
  .kj-tray{display:grid;grid-auto-flow:column;grid-template-rows:repeat(2,auto);grid-auto-columns:max-content;overflow-x:auto;justify-content:start;padding:10px;gap:4px;-webkit-overflow-scrolling:touch}
  .kj-tp{touch-action:pan-x}
}
`;

// Today's board counts as the kids daily being done: the same save shape the
// other kids dailies write (sot_kids_<key> = { day, state: { done } }), so the
// hub tile and the strip read it with no special case.
function markDailyDone(gameKey, dayKey) {
  try {
    localStorage.setItem(`sot_kids_${gameKey}`, JSON.stringify({ day: dayKey, state: { done: true } }));
    const a = JSON.parse(localStorage.getItem(`sot_kids_${gameKey}_done`) || '[]');
    if (Array.isArray(a) && !a.includes(dayKey)) { a.push(dayKey); localStorage.setItem(`sot_kids_${gameKey}_done`, JSON.stringify(a.slice(-400))); }
  } catch (e) { /* ignore */ }
}

export default function KidsJigsaw({ game, dailyKey, dayKey, dayLabel, dayNum, isToday, boards, quizId, startShape = 'all' }) {
  // `sel` is the board on screen: the day's photo (same as today's Jig or
  // Saw) unless the kid picked another from the shelf. 'shelf' shows the shelf.
  const [sel, setSel] = useState(dailyKey);
  const [shape, setShape] = useState(startShape);
  const [n, setNState] = useState(12);
  const [done, setDone] = useState({});
  const [ready, setReady] = useState(false);

  // A shelf pick lives in the address (?pic=jig-12&n=20) so a grown-up can
  // link a kid straight to one; ?p stays the kids day number, as on every
  // other kids daily.
  useEffect(() => {
    let nn = 12;
    try { const s = Number(localStorage.getItem(N_KEY)); if (COUNTS.includes(s)) nn = s; } catch (e) { /* ignore */ }
    try {
      const q = new URLSearchParams(window.location.search);
      const qn = Number(q.get('n')); if (COUNTS.includes(qn)) nn = qn;
      const qp = q.get('pic'); if (qp === 'shelf' || boards.some((b) => b.key === qp)) setSel(qp);
    } catch (e) { /* ignore */ }
    setNState(nn);
    setDone(readDone());
    setReady(true);
    fetch('/api/quiz/view', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ quizId }) }).catch(() => {});
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!ready) return;
    try {
      const u = new URL(window.location.href);
      if (sel && sel !== dailyKey) u.searchParams.set('pic', sel); else u.searchParams.delete('pic');
      if (sel !== 'shelf') u.searchParams.set('n', String(n)); else u.searchParams.delete('n');
      window.history.replaceState(null, '', u.pathname + u.search);
    } catch (e) { /* ignore */ }
  }, [sel, n, ready, dailyKey]);

  const setN = (c) => { setNState(c); try { localStorage.setItem(N_KEY, String(c)); } catch (e) { /* ignore */ } };
  const pick = (key) => { setSel(key); try { window.scrollTo({ top: 0 }); } catch (e) { /* ignore */ } };
  const board = sel && sel !== 'shelf' ? boards.find((b) => b.key === sel) : null;
  const isDaily = !!board && board.key === dailyKey;
  const onDone = useCallback((cnt) => {
    const o = markDone(sel, cnt);
    if (o) setDone({ ...o });
    if (sel === dailyKey) markDailyDone(game.key, dayKey);
  }, [sel, dailyKey, game.key, dayKey]);

  const sub = board
    ? (isDaily ? `${isToday ? 'Today' : dayLabel} · ${board.name}` : `From the shelf · ${board.name}`)
    : `Every Jig and Saw photo so far · ${boards.length} pictures`;

  return (
    <div className="kd">
      <style dangerouslySetInnerHTML={{ __html: KIDS_CSS + JIG_CSS }} />
      <div className="kd-wrap">
        <KidsHeader active="today" />
        <div className="kd-title">
          <h1>{board ? game.title : 'Jigsaw Puzzle Shelf'}</h1>
          <span className="kd-sub">{sub}</span>
        </div>
        {board ? (
          <>
            {!isDaily ? (
              <p className="kd-note kj-back">This is a shelf picture. <button type="button" className="kj-linkbtn" onClick={() => pick(dailyKey)}>Back to {isToday ? 'today' : 'the day'}&apos;s puzzle</button></p>
            ) : null}
            <Play key={`${board.key}-${n}`} board={board} n={n} setN={setN} onBack={() => pick('shelf')} onDone={onDone} />
          </>
        ) : (
          <>
            <p className="kd-note kj-back"><button type="button" className="kj-linkbtn" onClick={() => pick(dailyKey)}>← Back to {isToday ? 'today' : 'the day'}&apos;s {game.title}</button></p>
            <Picker boards={boards} done={done} n={n} setN={setN} onPick={pick} shape={shape} setShape={setShape} />
          </>
        )}
        <KidsStrip selfKey={game.key} dayKey={dayKey} />
        <div className="kd-foot">
          <span>Mind Loft Kids · free, no sign-up, no ads. Grown-ups: this is the same photo as today&apos;s <Link href={game.adultHref}>{game.from}</Link>, and every past one is on <Link href="/jig/shelf">the Jigsaw Puzzle Shelf</Link>.</span>
          <span>Puzzle #{dayNum} · {dayLabel}</span>
        </div>
      </div>
      <Footer />
    </div>
  );
}
