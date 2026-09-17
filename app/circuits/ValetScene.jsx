'use client';

// ValetScene — the Valet Gauntlet's picture, and it is THE BOARD ITSELF.
//
// The first version was a cartoon (a jacketed valet, a car with spinning
// wheels, a key toss) and the owner called it corny (2026-09-05). This one is
// direction C of the mockup that replaced it: a miniature of the lot, a few
// muted blocks, the red bar, the lit exit in the wall, and the ONE move that
// matters, the red bar leaving. Between lots the miniature steps up in size,
// six to seven to eight, so the ladder is visible before it is climbed. The
// valet is reduced to a corner mark: a circle with the sunglasses bar.
//
// THREE MOMENTS, one component, keyed by `mode`:
//   arrive  the gate. The lot's miniature rises in, the exit pulses, the
//           ladder of sizes shows the current rung lit.
//   depart  the handover. The blocker in the red lane clears, the red bar
//           slides out through the exit and off, a lime tick draws, and the
//           ladder lights the next rung.
//   park    the finish. The lots stand side by side in lime, each with its
//           tick, lit in turn.
//   still   no motion: the finish pose only. Every mode collapses to its own
//           resting pose under prefers-reduced-motion.
//
// IT MUST RENDER AT EVERY WIDTH. The whole picture is one SVG on a fixed
// viewBox (400 x 150) scaled by width, so a 320px phone and a 640px column get
// the same drawing, only smaller; nothing is positioned in CSS pixels and no
// text is below 12 viewBox units (about 9px at the narrowest phone). The only
// CSS motion is transform and opacity on SVG groups, with `transform-box:
// fill-box` so a group animates about its own drawing, and every travel
// distance is a custom property set inline per element, since the distance
// depends on the lot's size. Colours are literals matched to the run stage's
// near-black ground (the run page and the pop-up both paint that ground
// themselves), so the scene reads the same in either site register.
//
// Props: `mode`; `sizes` (the run's lot sizes in order, default [6, 7, 8]);
// `step` (index of the lot the moment is about, default 0: on `arrive` the lot
// about to be dealt, on `depart` the lot just parked); `compact` narrows it.

import React from 'react';
import { T } from '@/lib/theme';

const RED = T.danger;
const RED_EDGE = '#7a2318';
const ACC = '#bef264';
const INK = '#eef2fa';
const MUTE = '#8b95a8';
const DIM = '#3a4256';
const CELL = '#1a1d28';
const WALL = '#3a4256';
const BLOCK = '#2c3650';
const BLOCK_EDGE = '#3d4a68';
const MONO = "'DM Mono', ui-monospace, 'SFMono-Regular', monospace";

// One illustrative layout per size, in cells: the red bar (row, col, len), the
// blocker in its lane (row, col, w, h; it sits on the red row and clears by
// dropping its own height, into cells the other blocks leave free) and a
// handful of fleet blocks. Not
// today's board (the real one is on the play surface), just a lot that reads
// as that size.
const LAYOUTS = {
  6: { exit: 2, red: [2, 1, 2], lane: [0, 4, 1, 3], blocks: [[0, 0, 1, 2], [0, 1, 2, 1], [0, 5, 1, 2], [4, 0, 2, 1], [3, 2, 1, 3], [4, 5, 1, 2]] },
  7: { exit: 3, red: [3, 1, 2], lane: [1, 5, 1, 3], blocks: [[0, 0, 2, 1], [0, 3, 1, 3], [1, 0, 1, 2], [0, 6, 1, 2], [4, 0, 1, 3], [5, 2, 3, 1], [1, 4, 1, 2], [6, 6, 1, 1]] },
  8: { exit: 3, red: [3, 2, 2], lane: [1, 6, 1, 3], blocks: [[0, 0, 1, 3], [0, 1, 3, 1], [1, 4, 1, 2], [0, 7, 1, 2], [4, 0, 2, 1], [5, 2, 1, 3], [4, 3, 2, 1], [5, 7, 1, 3], [7, 4, 2, 1], [1, 5, 1, 1]] },
};
function layoutFor(n) { return LAYOUTS[n] || LAYOUTS[Math.max(6, Math.min(8, n))]; }

// A miniature lot at (x, y), `size` viewBox units on a side.
function MiniLot({ n, x, y, size, finish = false, lit = false, delay = 0 }) {
  const L = layoutFor(n);
  const c = size / n;
  const pad = c * 0.14;
  const [rr, rc, rl] = L.red;
  const [lr, lc, lw, lh] = L.lane;
  const outDist = (n - rc - rl) * c + 26;   // through the gap, parked just past the wall
  const rect = (r, col, w, h, key, fill, edge) => (
    <rect key={key}
      x={col * c + pad} y={r * c + pad} width={w * c - pad * 2} height={h * c - pad * 2}
      rx={Math.max(2, c * 0.18)} fill={fill} stroke={edge} strokeWidth="1.2" />
  );
  return (
    <g transform={`translate(${x} ${y})`}>
    <g className={`vs-lot${lit ? ' lit' : ''}`} style={{ '--d': `${delay}ms` }}>
      <rect x="0" y="0" width={size} height={size} rx={size * 0.06} fill={CELL} stroke={lit ? ACC : WALL} strokeWidth={lit ? 3 : 4} />
      {Array.from({ length: n - 1 }).map((_, i) => (
        <React.Fragment key={i}>
          <line x1={(i + 1) * c} y1="0" x2={(i + 1) * c} y2={size} stroke="rgba(255,255,255,.06)" strokeWidth="1" />
          <line x1="0" y1={(i + 1) * c} x2={size} y2={(i + 1) * c} stroke="rgba(255,255,255,.06)" strokeWidth="1" />
        </React.Fragment>
      ))}
      {/* the exit: a lit gap in the right wall at the red bar's row */}
      <rect className="vs-exit" x={size - 2} y={L.exit * c + 1} width="5" height={c - 2} fill={ACC} />
      {L.blocks.map(([r, col, w, h], i) => rect(r, col, w, h, i, BLOCK, BLOCK_EDGE))}
      {finish ? null : (
        <g className="vs-lane" style={{ '--dn': `${lh * c}px` }}>
          {rect(lr, lc, lw, lh, 'lane', BLOCK, BLOCK_EDGE)}
        </g>
      )}
      {finish ? null : (
        <g className="vs-red" style={{ '--out': `${outDist}px` }}>
          {rect(rr, rc, rl, 1, 'red', RED, RED_EDGE)}
        </g>
      )}
      {/* a parked lot is empty of the car and carries its tick */}
      {finish ? (
        <path className="vs-tick" d={`M${size * 0.32} ${size * 0.52} l${size * 0.11} ${size * 0.11} l${size * 0.24} -${size * 0.26}`}
          fill="none" stroke={ACC} strokeWidth={Math.max(3, size * 0.045)} strokeLinecap="round" strokeLinejoin="round" />
      ) : null}
    </g>
    </g>
  );
}

// The valet, reduced to a mark: a circle with the sunglasses bar.
function Mark({ x, y }) {
  return (
    <g transform={`translate(${x} ${y})`}>
      <circle cx="9" cy="9" r="9" fill="none" stroke={INK} strokeWidth="1.6" />
      <rect x="3" y="7" width="12" height="3.4" rx="1.5" fill={INK} />
    </g>
  );
}

export default function ValetScene({ mode = 'still', sizes = [6, 7, 8], step = 0, compact = false }) {
  const sz = sizes.length ? sizes : [6, 7, 8];
  const i = Math.max(0, Math.min(sz.length - 1, step));
  const finish = mode === 'park' || mode === 'still';

  let lots = null;
  if (finish) {
    const k = sz.length;
    const base = 76, grow = 14, gap = 10;
    const widths = sz.map((_, j) => base + j * grow);
    const total = widths.reduce((a, b) => a + b, 0) + gap * (k - 1);
    let x = (400 - total) / 2;
    const bottom = 136;
    lots = sz.map((n, j) => {
      const s = widths[j];
      const el = <MiniLot key={j} n={n} x={x} y={bottom - s} size={s} finish lit delay={j * 420} />;
      x += s + gap;
      return el;
    });
  }

  return (
    <div className={`vs vs-${mode}${compact ? ' vs-compact' : ''}`} aria-hidden="true">
      <style dangerouslySetInnerHTML={{ __html: CSS }} />
      <svg viewBox="0 0 400 150" width="100%" preserveAspectRatio="xMidYMid meet" role="img" aria-label="The three lots of the Valet Gauntlet">
        {finish ? lots : (
          <>
            <Mark x={40} y={18} />
            <text x="64" y="32" fontSize="12" fill={MUTE} letterSpacing="1.6" fontFamily={MONO}>VALET</text>
            {/* the ladder of sizes: parked lots lime, the current lot ink, the rest dim */}
            {sz.map((n, j) => {
              const parked = mode === 'depart' ? j <= i : j < i;
              const now = mode === 'depart' ? j === i + 1 : j === i;
              return (
                <text key={j} className={now ? 'vs-now' : ''} x="40" y={66 + j * 20} fontSize="12" letterSpacing="1.6"
                  fontFamily={MONO} fill={parked ? ACC : now ? INK : DIM}>{n}&times;{n}</text>
              );
            })}
            <MiniLot n={sz[i]} x={140} y={14} size={122} />
            {mode === 'depart' ? (
              <path className="vs-check" d="M302 104 l10 10 l20 -22" fill="none" stroke={ACC} strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" />
            ) : null}
          </>
        )}
      </svg>
    </div>
  );
}

const CSS = `
.vs{position:relative;width:100%;max-width:560px;margin:0 auto;line-height:0;}
.vs svg{display:block;width:100%;height:auto;overflow:visible;}
.vs-compact{max-width:380px;}
.vs-lot,.vs-lane,.vs-red,.vs-exit,.vs-tick,.vs-check{transform-box:fill-box;}
.vs-tick,.vs-check{stroke-dasharray:80;stroke-dashoffset:80;}

/* ARRIVE: the lot rises in, the exit breathes. */
.vs-arrive .vs-lot{animation:vsRise .5s cubic-bezier(.2,.8,.2,1) both;}
.vs-arrive .vs-exit{animation:vsPulse 2.2s ease-in-out .5s infinite;}

/* DEPART: the blocker clears, the red bar leaves through the exit, the tick draws. */
.vs-depart .vs-lane{animation:vsClear .45s cubic-bezier(.5,0,.15,1) .15s both;}
.vs-depart .vs-red{animation:vsOut .7s cubic-bezier(.5,0,.15,1) .55s both;}
.vs-depart .vs-check{animation:vsDraw .4s ease-out 1.15s both;}
.vs-depart .vs-now{animation:vsFade .4s ease-out 1.3s both;}

/* PARK: the lots light in turn, each with its tick. */
.vs-park .vs-lot{animation:vsRise .5s cubic-bezier(.2,.8,.2,1) var(--d) both;}
.vs-park .vs-tick{animation:vsDraw .4s ease-out calc(var(--d) + .4s) both;}
.vs-still .vs-tick{stroke-dashoffset:0;}

@keyframes vsRise{from{opacity:0;transform:translateY(8px);}to{opacity:1;transform:none;}}
@keyframes vsPulse{0%,100%{opacity:.45;}50%{opacity:1;}}
@keyframes vsClear{to{transform:translateY(var(--dn));}}
@keyframes vsOut{to{transform:translateX(var(--out));}}
@keyframes vsDraw{to{stroke-dashoffset:0;}}
@keyframes vsFade{from{opacity:.3;}to{opacity:1;}}

@media(prefers-reduced-motion:reduce){
  .vs *{animation:none!important;}
  .vs .vs-tick,.vs .vs-check{stroke-dashoffset:0;}
  .vs-depart .vs-red{transform:translateX(var(--out));}
  .vs-depart .vs-lane{transform:translateY(var(--dn));}
}
`;
