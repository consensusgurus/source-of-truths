'use client';

// Roll's board: the floor and the die, drawn on a canvas in a three-quarter
// view that LEANS so three faces of the die show at once: the top, the front
// (south) and the right (east) side (owner, 2026-10-20: "maybe we get a
// diagonal view so can see 3 sides at once"). The lean only shifts height to
// the left; the board's rows and columns stay square to the screen, so Up still
// rolls up the screen and a swipe goes the way it looks (Topple's rule).
//
// THE LOOK (rebuilt 2026-11-02, owner: "can we greatly improve the visuals of
// roll and topple?"), shared with Topple through lib/roll-toy-kit.js: white or
// slate tiles edged in the stage ink, a pastel die in the category colour with
// bevelled faces and ink pips. The old board painted the die with --stg-acc,
// the INK on the light register, so the die was navy; the kit reads the pastel.
//
// THE NUMBERED SQUARES ARE BUTTONS. A square not yet lit stands a little
// proud of the floor, so a shut square looks like something the die cannot
// roll onto; the NEXT one is tinted in the category colour, carries its number
// in bold and breathes with a soft halo; a square still waiting its turn shows
// a muted number and a small lock. The die presses the next square flush as it
// lands on it with the right face up, and the square lights pastel with a tick
// and a ring. State is said three ways (number, height and lock or tick), so
// nothing rests on colour alone, and nothing is dashed (owner, 2026-10-25).
//
// THE PEEK (2026-11-02): each square next to the still die wears a small die
// face in a top corner, the face that roll would bring up (see
// peekOf and step 5 of draw). Pastel when that roll lights the next square,
// an empty faint outline when the rules refuse it.
//
// The roll is a real quarter turn about the die's leading bottom edge, with
// a squash and a puff of dust as it lands. A refused roll tips the die a few
// degrees and settles back. A cracked square breaks into shards as the die
// leaves it. A win hops the die and throws confetti.

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { RotateCcw, Undo2, Eye, ArrowUp, ArrowDown, ArrowLeft, ArrowRight } from 'lucide-react';
import { step } from '@/lib/roll-engine';
import { readPalette, slab, cracks, contact, face, roundQuad, inset, css, mix, Fx, prefersReduced } from '@/lib/roll-toy-kit';
import usePlayStageFit from '@/lib/play-stage-fit';

const SANS = "'Manrope', system-ui, -apple-system, sans-serif";
const TW = 54;            // one square, left to right
const TH = 42;            // one square, top to bottom (depth is foreshortened)
const KX = 13;            // the lean: one unit of height shifts this far LEFT
const TZ = 34;            // how far one unit of height rises
const SLAB = 0.38;        // tile thickness, in die units
const GAP = 0.05;         // the seam between two tiles
const RAISE = 0.13;       // how proud an unlit numbered square stands
const PAD = 16;
const INSET = 0.06;       // the die sits this far inside its square on every side
const ROLL_MS = 170;
const BUMP_MS = 200;
const SQUASH_MS = 140;
const WIN_MS = 1100;

const VIEW = (() => { const v = [KX / TW, TZ / TH, 1]; const m = Math.hypot(...v); return v.map((c) => c / m); })();
const LIGHT = (() => { const v = [0.35, -0.55, 1]; const m = Math.hypot(...v); return v.map((c) => c / m); })();

const CSS = `
.rl{font-family:${SANS};}
.rl-meter{max-width:620px;margin:0 auto 14px;}
.rl-mhead{display:flex;justify-content:space-between;align-items:baseline;gap:10px;font-size:11px;font-weight:700;letter-spacing:.09em;text-transform:uppercase;color:var(--stg-mute,#8b95a8);}
.rl-mhead b{font-weight:800;color:var(--stg-ink,#e9edf4);}
.rl-mhead .rl-mv{font-size:16px;color:var(--stg-acc-ink,var(--stg-acc));}
.rl-mtrack{position:relative;height:10px;border-radius:3px;background:var(--stg-line2,rgba(255,255,255,.17));margin-top:8px;}
.rl-mfill{position:absolute;left:0;top:0;bottom:0;border-radius:3px;transition:width .18s ease-out;}
.rl-mtick{position:absolute;top:-4px;width:2px;height:18px;}
.rl-mlabs{position:relative;height:14px;margin-top:3px;font-size:10px;font-weight:800;letter-spacing:.08em;text-transform:uppercase;}
.rl-mlabs span{position:absolute;white-space:nowrap;}
.rl-panel{max-width:620px;margin:0 auto;background:var(--stg-surf,rgba(255,255,255,.045));border:1px solid var(--stg-line,rgba(255,255,255,.11));border-radius:20px;padding:18px 16px 14px;}
.rl-seq{display:flex;justify-content:center;gap:8px;margin:0 0 10px;flex-wrap:wrap;}
.rl-sq{width:34px;height:34px;border-radius:9px;display:flex;align-items:center;justify-content:center;font-size:15px;font-weight:800;border:1.5px solid var(--stg-line2,rgba(255,255,255,.17));color:var(--stg-mute,#8b95a8);}
.rl-sq.next{border:2px solid var(--stg-acc-ink,var(--stg-acc));color:var(--stg-acc-ink,var(--stg-acc));}
.rl-sq.lit{background:var(--stg-acc);border-color:var(--stg-acc);color:var(--stg-onramp,#08222e);}
.rl-canvas{display:block;width:100%;height:auto;margin:0 auto;touch-action:none;cursor:pointer;-webkit-tap-highlight-color:transparent;}
.rl-probe{position:absolute;width:0;height:0;overflow:hidden;pointer-events:none;}
.rl-row{display:flex;align-items:center;gap:14px;margin-top:14px;padding-top:12px;border-top:1px solid var(--stg-line,rgba(255,255,255,.11));flex-wrap:wrap;}
.rl-say{flex:1 1 220px;min-width:0;display:flex;flex-direction:column;gap:3px;}
.rl-say1{font-size:15px;font-weight:700;line-height:1.4;color:var(--stg-ink,#e9edf4);}
.rl-say2{font-size:12px;font-weight:600;line-height:1.45;color:var(--stg-mute,#8b95a8);}
/* NO ON-SCREEN CONTROLS ON A DESKTOP WITH A MOUSE (owner, 2026-10-30): the keyboard already does all of this. */
@media (min-width:900px) and (hover:hover) and (pointer:fine){.rl-pad{display:none !important;}}
.rl-pad{display:grid;grid-template-columns:repeat(3,50px);grid-template-rows:repeat(3,44px);gap:5px;flex:0 0 auto;}
.rl-key{position:relative;font-family:${SANS};border:1.5px solid var(--stg-mute2,#78859d);background:transparent;color:var(--stg-ink,#e9edf4);border-radius:11px;display:flex;align-items:center;justify-content:center;cursor:pointer;padding:0;}
.rl-key:hover:not(:disabled){background:var(--stg-surf2,rgba(255,255,255,.08));}
.rl-key:active:not(:disabled){background:var(--stg-acc);color:var(--stg-onramp,#08222e);border-color:var(--stg-acc);}
.rl-key.lights{border:2px solid var(--stg-acc-ink,var(--stg-acc));color:var(--stg-acc-ink,var(--stg-acc));}
.rl-key.lock{opacity:.55;border-style:solid;}
.rl-key:disabled{opacity:.3;cursor:default;}
.rl-key i{position:absolute;right:4px;bottom:2px;font-style:normal;font-size:10px;font-weight:800;}
.rl-acts{display:flex;gap:8px;flex-wrap:wrap;}
.rl-btn{font-family:${SANS};font-weight:700;font-size:14px;background:transparent;color:var(--stg-ink2,#aab5c7);border:1.5px solid var(--stg-mute2,#78859d);border-radius:12px;padding:0 16px;min-height:46px;display:inline-flex;align-items:center;justify-content:center;gap:7px;cursor:pointer;}
.rl-btn:hover:not(:disabled){background:var(--stg-surf2,rgba(255,255,255,.08));}
.rl-btn:disabled{opacity:.45;cursor:default;}
.rl-foot{max-width:620px;margin:10px auto 0;display:flex;justify-content:space-between;align-items:center;gap:12px;}
.rl-rule{font-size:12px;font-weight:600;color:var(--stg-mute,#8b95a8);line-height:1.45;}
.rl-giveup{min-height:44px;background:none;border:none;cursor:pointer;font-family:${SANS};font-weight:700;font-size:12.5px;text-decoration:underline;text-underline-offset:3px;display:inline-flex;align-items:center;gap:5px;padding:0 4px;flex:0 0 auto;}
.rl-key:focus-visible,.rl-btn:focus-visible,.rl-giveup:focus-visible{outline:2px solid var(--stg-acc-ink,var(--stg-acc));outline-offset:2px;}
@media(max-width:560px){
  .rl-panel{background:transparent;border:0;border-radius:0;padding:2px 0 0;}
  .rl-row{border-top:0;justify-content:center;}
  .rl-say{flex-basis:100%;text-align:center;}
  .rl-pad{grid-template-columns:repeat(3,58px);grid-template-rows:repeat(3,50px);}
  .rl-acts{flex-direction:column;}
  .rl-rule{display:none;}
  .rl-foot{justify-content:flex-end;margin-top:4px;}
}
`;

// THE WHITE STAGE (owner, 2026-11-12: "paths, roll and topple game play boards
// should stay unchanged ... make sure that these can be larger to fit larger
// screens"). On PlayStage the canvas is the same drawing as the page board; only
// the furniture around it changes: the numbered chips stay above it, the pad and
// Undo / Restart are the stage's ink-outlined buttons, and the canvas is fitted
// to the height the stage has, so it grows with a big desktop screen.
const ST_CSS = `
.rl-st{display:flex;flex-direction:column;align-items:center;gap:12px;width:100%;}
.rl-st .rl-seq{margin:0;}
.rl-st .rl-sq{border:1px solid var(--pst-cell-line);color:var(--pst-mute);background:var(--pst-bg);}
.rl-st .rl-sq.next{border:2px solid var(--pst-ink);color:var(--pst-ink);}
.rl-st .rl-sq.lit{background:var(--pst-acc);border:1px solid var(--pst-ink);color:var(--pst-on-acc);}
.rl-cvbox{position:relative;max-width:100%;}
.rl-st .rl-canvas{width:100%;max-width:none;}
.rl-stctl{display:flex;align-items:center;justify-content:center;gap:14px;flex-wrap:wrap;}
.rl-st .rl-pad{grid-template-columns:repeat(3,58px);grid-template-rows:repeat(3,48px);}
.rl-st .rl-key{border:1px solid var(--pst-ink);color:var(--pst-ink);border-radius:12px;}
.rl-st .rl-key:hover:not(:disabled){background:var(--pst-cell);}
.rl-st .rl-key:active:not(:disabled),.rl-st .rl-key.lights{background:var(--pst-acc);color:var(--pst-on-acc);border:1px solid var(--pst-ink);}
.rl-st .rl-key.lock{opacity:.45;}
.rl-stacts{display:flex;flex-direction:column;gap:8px;}
/* Desktop rolls with the arrow keys (owner, 2026-10-30: no on-screen controls on
   desktop), so the pad goes and Undo / Restart sit in one row. */
@media (min-width:900px) and (hover:hover) and (pointer:fine){.rl-stacts{flex-direction:row;}.rl-st .rl-pad{display:none;}}
`;

// THE DIE IS A BODY. Each face value lives on a fixed axis of the die and its
// pips are laid out on that face once, so a 2, 3 or 6 keeps its slant as the
// die turns and lands exactly as it was mid-roll. The world orientation comes
// from the engine's top/north/east: the top face's axis points up (+z), north
// points up the screen (-y), east points right (+x). A quarter turn of this
// matrix is exactly the engine's next state (checked for all 24 positions).
const BODY = {
  1: { n: [0, 0, 1], u: [1, 0, 0], v: [0, 1, 0] },
  6: { n: [0, 0, -1], u: [1, 0, 0], v: [0, -1, 0] },
  2: { n: [0, -1, 0], u: [1, 0, 0], v: [0, 0, -1] },
  5: { n: [0, 1, 0], u: [-1, 0, 0], v: [0, 0, -1] },
  3: { n: [1, 0, 0], u: [0, 1, 0], v: [0, 0, -1] },
  4: { n: [-1, 0, 0], u: [0, -1, 0], v: [0, 0, -1] },
};
const dot3 = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
const orient = (s) => (b) => [dot3(BODY[s.e].n, b), -dot3(BODY[s.n].n, b), dot3(BODY[s.t].n, b)];

const PIPS = {
  1: [[0.5, 0.5]],
  2: [[0.27, 0.27], [0.73, 0.73]],
  3: [[0.27, 0.27], [0.5, 0.5], [0.73, 0.73]],
  4: [[0.27, 0.27], [0.73, 0.27], [0.27, 0.73], [0.73, 0.73]],
  5: [[0.27, 0.27], [0.73, 0.27], [0.5, 0.5], [0.27, 0.73], [0.73, 0.73]],
  6: [[0.27, 0.25], [0.73, 0.25], [0.27, 0.5], [0.73, 0.5], [0.27, 0.75], [0.73, 0.75]],
};

// Rolls so far against perfect and par, the Topple meter.
function RollMeter({ used, par, perfect }) {
  const max = Math.max(par + (par - perfect), used, par + 1);
  const pct = (v) => Math.max(0, Math.min(100, (v / max) * 100));
  const over = used > par;
  return (
    <div className="rl-meter" role="meter" aria-label="Rolls" aria-valuemin={0} aria-valuemax={max} aria-valuenow={used}>
      <div className="rl-mhead">
        <span>Rolls <b className="rl-mv">{used}</b></span>
        <span>Perfect <b>{perfect}</b> &middot; Par <b>{par}</b></span>
      </div>
      <div className="rl-mtrack">
        <div className="rl-mfill" style={{ width: `${pct(used)}%`, background: 'var(--stg-acc-ink, var(--stg-acc))', opacity: over ? 0.7 : 1 }} />
        <span className="rl-mtick" style={{ left: `calc(${pct(perfect)}% - 1px)`, background: 'var(--stg-ink, #e9edf4)' }} />
        <span className="rl-mtick" style={{ left: `calc(${pct(par)}% - 1px)`, background: 'var(--stg-mute, #8b95a8)' }} />
      </div>
      <div className="rl-mlabs">
        <span style={{ right: `calc(${100 - pct(perfect)}% + 5px)`, color: 'var(--stg-ink, #e9edf4)' }}>Perfect</span>
        <span style={{ left: `calc(${pct(par)}% + 5px)`, color: 'var(--stg-mute, #8b95a8)' }}>Par</span>
      </div>
    </div>
  );
}

// Rotate a point about the die's leading bottom edge for a roll in `dir`.
function rotAbout(p, dir, a, x0, x1, y0, y1) {
  const c = Math.cos(a), s = Math.sin(a);
  let [x, y, z] = p;
  if (dir === 'R') { const u = x - x1; x = x1 + u * c + z * s; z = -u * s + z * c; }
  else if (dir === 'L') { const u = x - x0; x = x0 + u * c - z * s; z = u * s + z * c; }
  else if (dir === 'D') { const u = y - y1; y = y1 + u * c + z * s; z = -u * s + z * c; }
  else if (dir === 'U') { const u = y - y0; y = y0 + u * c - z * s; z = u * s + z * c; }
  return [x, y, z];
}


// What each roll from `s` would bring up on top, read off the engine's own
// step(): one entry per neighbouring square the die could stand on. A roll off
// the floor or onto a crumbled square ('edge') gets nothing; a refused roll
// ('order', 'face') still says what would land, so the refusal can be read.
// The canvas also carries it as data-peek (e.g. "U3 D4 R5x"; x = refused,
// * = lights), so a check can compare it with what actually lands.
const DIR_SAY = { U: 'up', D: 'down', L: 'left', R: 'right' };
const DSTEP = { U: [0, -1], D: [0, 1], L: [-1, 0], R: [1, 0] };
function peekOf(P, s) {
  const out = [];
  for (const d of ['U', 'D', 'L', 'R']) {
    const r = step(P, s, d);
    if (r.result === 'edge') continue;
    const ok = r.result === 'ok' || r.result === 'win';
    out.push({
      d, x: s.x + DSTEP[d][0], y: s.y + DSTEP[d][1],
      top: ok ? r.state.t : r.top,
      kind: !ok ? 'refused' : (r.lit || r.result === 'win') ? 'lights' : 'quiet',
    });
  }
  return out;
}

const ease = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
const smooth = (t) => { const k = Math.max(0, Math.min(1, t)); return k * k * (3 - 2 * k); };

export default function RollBoard({
  P, state, anim, onAnimEnd, playing, used, par, perfect,
  onMove, onUndo, onRestart, canUndo, armed, onGiveUp, doneLine, themeKey, won, stage = false,
}) {
  const stRef = useRef(null);
  const cvRef = useRef(null);
  const probeRef = useRef(null);
  const colors = useRef(null);
  const fx = useRef(new Fx());
  const seen = useRef({ land: null, crumble: null });
  const crumbled = useRef(new Set());
  const squash = useRef(null);
  const winT = useRef(null);
  const shown = useRef(0);
  const dirty = useRef(true);
  const [, force] = useState(0);

  const W = Math.round(P.w * TW + KX * 1.4 + PAD * 2 + SLAB * KX + 6);
  const H = Math.round(P.h * TH + TZ * 1.4 + SLAB * TZ + PAD * 2 + 8);
  // Up to about 100px a square on a big screen (owner, 2026-11-12), never more.
  const fit = usePlayStageFit(stRef, '.rl-cvbox', stage, true, 220, Math.round(H * 100 / TW));
  const OX = PAD + KX * 1.4 + 2;
  const OY = PAD + TZ * 1.4;
  const pr = useCallback((x, y, z) => [OX + x * TW - z * KX, OY + y * TH - z * TZ], [OX, OY]);

  const readColors = useCallback(() => {
    if (probeRef.current) colors.current = readPalette(probeRef.current);
    dirty.current = true;
  }, []);

  useEffect(() => { if (won && winT.current == null) winT.current = performance.now(); if (!won) winT.current = null; }, [won]);
  // a restart or an undo can mend a crumbled square: forget it, so it draws whole
  useEffect(() => {
    for (const key of [...crumbled.current]) {
      const [x, y] = key.split(',').map(Number);
      if (!((state.broken >> P.crackBit[y * P.w + x]) & 1)) crumbled.current.delete(key);
    }
  }, [state, P]);

  const draw = useCallback((now) => {
    const cv = cvRef.current;
    if (!cv || !colors.current) return;
    const C = colors.current;
    const reduce = prefersReduced();
    const dpr = Math.min(3, window.devicePixelRatio || 1);
    const cw = shown.current || cv.clientWidth || W;
    const bw = Math.max(1, Math.round(cw * dpr)), bh = Math.max(1, Math.round((cw * H / W) * dpr));
    if (cv.width !== bw || cv.height !== bh) { cv.width = bw; cv.height = bh; }
    const ctx = cv.getContext('2d');
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, bw, bh);
    ctx.setTransform(bw / W, 0, 0, bh / H, 0, 0);
    ctx.lineJoin = 'round'; ctx.lineCap = 'round';

    let a = null;
    if (anim) {
      const t = now - anim.t0;
      if (anim.result === 'bump') a = { phase: 'bump', k: Math.min(1, t / BUMP_MS) };
      else a = { phase: 'roll', k: ease(Math.min(1, t / ROLL_MS)), t };
    }
    // what the board shows: during a roll, the state it is rolling FROM, so a
    // square does not light before the die has landed on it
    const S = anim && anim.from ? anim.from : state;
    const broken = (x, y) => P.crackBit[y * P.w + x] != null && (S.broken >> P.crackBit[y * P.w + x]) & 1;
    const lighting = a && a.phase === 'roll' && anim.to && anim.to.k > anim.from.k;

    // effects keyed to the roll's moments, each fired once
    if (a && a.phase === 'roll' && !reduce) {
      if (anim.crumble && seen.current.crumble !== anim.id && a.t >= ROLL_MS * 0.35) {
        seen.current.crumble = anim.id;
        const [x, y] = anim.crumble;
        crumbled.current.add(`${x},${y}`);
        const top = css(C.frag), edge = css(C.tileLine, Math.min(1, C.tileLineA + 0.2));
        [[0, 0, 0.5, 0.45], [0.5, 0, 1, 0.55], [0, 0.45, 0.52, 1], [0.52, 0.55, 1, 1]].forEach(([u0, v0, u1, v1], i) => {
          const q = [pr(x + u0 + 0.05, y + v0 + 0.05, 0), pr(x + u1 - 0.05, y + v0 + 0.05, 0), pr(x + u1 - 0.05, y + v1 - 0.05, 0), pr(x + u0 + 0.05, y + v1 - 0.05, 0)];
          fx.current.shard(now, q, top, edge, (u0 - 0.4) * 0.05, -0.02 - Math.random() * 0.03, (Math.random() - 0.5) * 0.008, i * 30);
        });
      }
      if (a.t >= ROLL_MS && seen.current.land !== anim.id) {
        seen.current.land = anim.id;
        const { x, y } = anim.to;
        fx.current.dust(now, [pr(x + 0.1, y + 1 - INSET, 0), pr(x + 0.9, y + 1 - INSET, 0), pr(x + INSET, y + 0.5, 0)], css(C.dust), 2);
        squash.current = { t: now };
        if (lighting) {
          fx.current.ring(now, [pr(x, y, 0), pr(x + 1, y, 0), pr(x + 1, y + 1, 0), pr(x, y + 1, 0)], css(C.body), 520);
          if (anim.result === 'win') {
            const c = pr(x + 0.5, y + 0.5, 1.2);
            fx.current.confetti(now, c[0], c[1], [css(C.body), css(C.line), css(C.bodyTop), css(mix(C.body, [255, 255, 255], 0.55))], 50);
          }
        }
      }
    }

    // 1. one soft shadow under the whole floor
    ctx.save();
    ctx.shadowColor = `rgba(0,0,0,${C.shadowA})`;
    ctx.shadowBlur = 22; ctx.shadowOffsetY = 12;
    ctx.fillStyle = css(C.tileFront);
    ctx.beginPath();
    for (let y = 0; y < P.h; y++) for (let x = 0; x < P.w; x++) {
      if (P.grid[y][x] === '.' || broken(x, y) || crumbled.current.has(`${x},${y}`)) continue;
      const q = [pr(x + GAP, y + GAP, 0), pr(x + 1 - GAP, y + GAP, 0), pr(x + 1 - GAP, y + 1 - GAP, -SLAB), pr(x + GAP, y + 1 - GAP, -SLAB)];
      ctx.moveTo(...q[0]); ctx.lineTo(...q[1]); ctx.lineTo(...q[2]); ctx.lineTo(...q[3]); ctx.closePath();
    }
    ctx.fill();
    ctx.restore();

    // 2. the squares
    const tile = (x, y, top, z = 0, opts = {}) => slab(ctx, pr, C, x + GAP, y + GAP, x + 1 - GAP, y + 1 - GAP, z, SLAB + z, top, opts);
    const breathe = reduce ? 0.5 : 0.5 + 0.5 * Math.sin(now / 420);
    const lock = (cx, cy, color) => {
      ctx.fillStyle = color; ctx.strokeStyle = color; ctx.lineWidth = 1.6;
      ctx.beginPath(); ctx.arc(cx, cy - 2.5, 2.6, Math.PI, 0); ctx.stroke();
      roundQuad(ctx, [[cx - 4, cy - 2.5], [cx + 4, cy - 2.5], [cx + 4, cy + 3.5], [cx - 4, cy + 3.5]], 1.4); ctx.fill();
    };
    const numbered = (x, y, v) => {
      const kind = v < S.k ? 'lit' : v === S.k ? 'next' : 'lock';
      if (kind === 'lit') {
        tile(x, y, C.body, 0, { front: mix(C.body, C.line, 0.2), side: mix(C.body, C.line, 0.28) });
        const [cx, cy] = pr(x + 0.5, y + 0.5, 0);
        ctx.strokeStyle = css(C.line); ctx.lineWidth = 3.2;
        ctx.beginPath(); ctx.moveTo(cx - 9, cy + 0.5); ctx.lineTo(cx - 2.5, cy + 6.5); ctx.lineTo(cx + 10, cy - 6); ctx.stroke();
        return;
      }
      // the die presses the next square flush as it lands on it
      let z = RAISE;
      if (kind === 'next' && lighting && anim.to.x === x && anim.to.y === y) z = RAISE * (1 - smooth((a.k - 0.55) / 0.45));
      if (kind === 'next') {
        // a halo that breathes, so the square to aim for is found at a glance
        const t = [pr(x + GAP, y + GAP, z), pr(x + 1 - GAP, y + GAP, z), pr(x + 1 - GAP, y + 1 - GAP, z), pr(x + GAP, y + 1 - GAP, z)];
        roundQuad(ctx, inset(t, 1.1 + breathe * 0.08), 8);
        ctx.strokeStyle = css(C.dark ? C.body : C.body, 0.35 + 0.35 * breathe); ctx.lineWidth = 4; ctx.stroke();
        tile(x, y, C.next, z, { front: mix(C.next, C.line, 0.16), side: mix(C.next, C.line, 0.24), lw: 2 });
        const [cx, cy] = pr(x + 0.5, y + 0.5, z);
        ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.font = `800 24px Manrope, system-ui, sans-serif`;
        ctx.fillStyle = css(C.line);
        ctx.fillText(String(v), cx, cy + 1);
        return;
      }
      tile(x, y, C.tileTop, z);
      const [cx, cy] = pr(x + 0.5, y + 0.5, z);
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.font = `800 19px Manrope, system-ui, sans-serif`;
      ctx.fillStyle = css(C.mute, 0.75);
      ctx.fillText(String(v), cx - 3, cy + 1);
      lock(cx + 11, cy + 4, css(C.mute, 0.75));
    };

    const drawRow = (y) => {
      for (let x = 0; x < P.w; x++) {
        const c = P.grid[y][x];
        if (c === '.') continue;
        if (c === 'C') {
          if (broken(x, y) || crumbled.current.has(`${x},${y}`)) {
            // reduced motion has no shards, so the square simply goes
            continue;
          }
          tile(x, y, C.frag, 0, { front: mix(C.frag, C.line, 0.18), side: mix(C.frag, C.line, 0.26) });
          cracks(ctx, pr, x, y, 0, css(C.line, C.dark ? 0.9 : 0.72), 1.7);
          continue;
        }
        if (c >= '1' && c <= '6') { numbered(x, y, +c); continue; }
        tile(x, y, (x + y) % 2 ? C.tileTop : mix(C.tileTop, C.ink, C.dark ? 0.03 : 0.025));
      }
    };

    // 3. the die: a body turned by its orientation, then by the roll about its
    // leading bottom edge. The centre follows a full square's arc and the die
    // is drawn a little inside it, so it starts and lands exactly on its square.
    const h = 1 - 2 * INSET;
    const pv = (d) => [d[0] * TW - d[2] * KX, d[1] * TH - d[2] * TZ];
    const drawDie = (s, dir, th, dz, sq = 1) => {
      const M = orient(s);
      const R = (v) => (dir && th ? rotAbout(v, dir, th, 0, 0, 0, 0) : v);
      const c0 = [s.x + 0.5, s.y + 0.5, 0.5];
      const cc = dir && th ? rotAbout(c0, dir, th, s.x, s.x + 1, s.y, s.y + 1) : c0;
      const ctr = [cc[0], cc[1], cc[2] - INSET + dz];
      // a landing squash: shorter and a touch wider, about the die's foot
      const SQ = (r) => [r[0] * (1 + (1 - sq) * 0.5), r[1] * (1 + (1 - sq) * 0.5), r[2] * sq];
      const foot = (1 - sq) * h / 2;
      const W3 = (b) => { const r = SQ(R(M(b))); return [ctr[0] + r[0] * h, ctr[1] + r[1] * h, ctr[2] - foot + r[2] * h]; };
      const Wv = (b) => { const r = SQ(R(M(b))); return [r[0] * h, r[1] * h, r[2] * h]; };

      let mnz = 1e9;
      for (const sx of [-0.5, 0.5]) for (const sy of [-0.5, 0.5]) for (const sz of [-0.5, 0.5]) mnz = Math.min(mnz, W3([sx, sy, sz])[2]);
      contact(ctx, pr, C, ctr[0] - h / 2, ctr[1] - h / 2, ctr[0] + h / 2, ctr[1] + h / 2, Math.max(0, mnz) * 1.4);

      for (let v = 1; v <= 6; v++) {
        const F = BODY[v];
        const nw = R(M(F.n));
        if (nw[0] * VIEW[0] + nw[1] * VIEW[1] + nw[2] * VIEW[2] <= 1e-3) continue;
        const c = [F.n[0] / 2, F.n[1] / 2, F.n[2] / 2];
        const corner = (a1, a2) => W3([c[0] + F.u[0] * a1 + F.v[0] * a2, c[1] + F.u[1] * a1 + F.v[1] * a2, c[2] + F.u[2] * a1 + F.v[2] * a2]);
        const sp = [corner(-0.5, -0.5), corner(0.5, -0.5), corner(0.5, 0.5), corner(-0.5, 0.5)].map((q) => pr(q[0], q[1], q[2]));
        const lit = nw[0] * LIGHT[0] + nw[1] * LIGHT[1] + nw[2] * LIGHT[2];
        const k = Math.max(0, Math.min(1, (lit + 0.1) / 1.0));
        face(ctx, sp, mix(C.bodySide, C.bodyTop, k), `rgba(255,255,255,${(0.08 + Math.max(0, nw[2]) * 0.2).toFixed(3)})`, C.line, 2);
        // pips: each a true circle on its face, drawn through the face's own frame
        const A = pv(Wv(F.u)), B = pv(Wv(F.v));
        const r = 0.1;
        ctx.fillStyle = css(C.line);
        for (const [pu, pq] of PIPS[v]) {
          const q = W3([c[0] + F.u[0] * (pu - 0.5) + F.v[0] * (pq - 0.5), c[1] + F.u[1] * (pu - 0.5) + F.v[1] * (pq - 0.5), c[2] + F.u[2] * (pu - 0.5) + F.v[2] * (pq - 0.5)]);
          const p0 = pr(q[0], q[1], q[2]);
          ctx.save();
          ctx.transform(A[0] * r, A[1] * r, B[0] * r, B[1] * r, p0[0], p0[1]);
          ctx.beginPath(); ctx.arc(0, 0, 1, 0, Math.PI * 2);
          ctx.restore();
          ctx.fill();
        }
      }
    };

    // 4. back to front, row by row, the die right after the last row it stands on
    let job = null, jobRow = P.h - 1;
    if (a && a.phase === 'roll') {
      const k = a.k;
      job = () => drawDie(anim.from, anim.dir, k * Math.PI / 2, Math.sin(k * Math.PI) * 0.05);
      jobRow = Math.max(anim.from.y, anim.to.y);
    } else if (a && a.phase === 'bump') {
      const k = Math.sin(a.k * Math.PI) * 0.2;
      job = () => drawDie(state, anim.dir, k, 0);
      jobRow = state.y;
    } else {
      let dz = 0, sq = 1;
      if (won && winT.current != null && !reduce) {
        const t = (now - winT.current) / 1000;
        dz = t < WIN_MS / 1000 ? Math.abs(Math.sin(t * Math.PI * 2.7)) * Math.max(0, 0.42 - t * 0.33) : 0;
      }
      if (squash.current && !reduce) {
        const t = now - squash.current.t;
        if (t < SQUASH_MS) sq = 1 - 0.08 * Math.sin(Math.PI * t / SQUASH_MS);
      }
      job = () => drawDie(state, null, 0, dz, sq);
      jobRow = state.y;
    }
    for (let y = 0; y < P.h; y++) {
      drawRow(y);
      if (job && y === jobRow) { job(); job = null; }
    }
    if (job) job();

    // 5. THE PEEK (owner, 2026-11-02: "we need a way to show what would flip
    // onto the top when the user moves a die down"). Each square next to the
    // die carries, in a top corner, a small die face lying on the floor: the
    // face that would be on top if the die rolled there. It is the engine's
    // own roll (peekOf, from step()), never a separate guess. Pips, not a
    // digit, so it can never be read as a numbered square. The square to the
    // LEFT takes its top left corner, because the die's lean covers the right
    // edge of that square; the others take the top right, clear of a square's
    // number (centred) and lock (bottom right). Drawn after the die, only
    // while the die is still and the game is on. Three looks:
    //   quiet    an ordinary roll: a pale filled face, ink pips at low strength
    //   lights   the roll would light the next square: a pastel face with full
    //            ink pips and edge, the die's own colours
    //   refused  the rules refuse the roll (a shut square, or the wrong face
    //            for the next one): an empty outline with faint pips, which
    //            explains the refusal without inviting the roll
    if (playing && !won && !anim) {
      for (const pk of peekOf(P, state)) {
        const { x, y, top, kind, d } = pk;
        const c = P.grid[y][x];
        const raised = c >= '1' && c <= '6' && +c >= state.k;
        const z = raised ? RAISE : 0;
        const u0 = x + (d === 'L' ? 0.08 : 0.63), u1 = u0 + 0.29, v0 = y + 0.08, v1 = y + 0.4;
        const q = [pr(u0, v0, z), pr(u1, v0, z), pr(u1, v1, z), pr(u0, v1, z)];
        roundQuad(ctx, q, 3.2);
        if (kind === 'lights') ctx.fillStyle = css(C.body);
        else if (kind === 'quiet') ctx.fillStyle = css(mix(C.tileTop, C.ink, C.dark ? 0.12 : 0.05));
        if (kind !== 'refused') ctx.fill();
        ctx.strokeStyle = kind === 'lights' ? css(C.line) : css(C.ink, kind === 'refused' ? 0.3 : (C.dark ? 0.45 : 0.4));
        ctx.lineWidth = kind === 'lights' ? 1.8 : 1.1;
        ctx.stroke();
        const pw = q[1][0] - q[0][0], ph = q[3][1] - q[0][1];
        ctx.fillStyle = kind === 'lights' ? css(C.line) : css(C.ink, kind === 'refused' ? 0.38 : (C.dark ? 0.8 : 0.7));
        const pipR = Math.min(pw, ph) * 0.105;
        for (const [pu, pq] of PIPS[top]) {
          ctx.beginPath();
          ctx.ellipse(q[0][0] + pw * (0.12 + pu * 0.76), q[0][1] + ph * (0.12 + pq * 0.76), pipR * 1.08, pipR, 0, 0, Math.PI * 2);
          ctx.fill();
        }
      }
    }
    fx.current.draw(ctx, now, C.dark ? null : css(C.line, 0.5));
  }, [P, anim, state, pr, W, H, won, playing]);

  useEffect(() => { readColors(); force((n) => n + 1); }, [readColors, themeKey]);
  useEffect(() => {
    const cv = cvRef.current;
    if (!cv || typeof ResizeObserver === 'undefined') return undefined;
    const ro = new ResizeObserver((es) => {
      const w = es[0] && es[0].contentRect ? es[0].contentRect.width : cv.clientWidth;
      if (w && Math.abs(w - shown.current) > 0.25) { shown.current = w; dirty.current = true; }
    });
    ro.observe(cv);
    return () => ro.disconnect();
  }, []);
  useEffect(() => {
    const mq = window.matchMedia ? window.matchMedia('(prefers-color-scheme: dark)') : null;
    const on = () => { readColors(); };
    mq && mq.addEventListener && mq.addEventListener('change', on);
    return () => { mq && mq.removeEventListener && mq.removeEventListener('change', on); };
  }, [readColors]);

  // ONE LOOP for the board: it plays the roll, keeps the shards, dust and
  // confetti moving, breathes the next square's halo at about 30 frames a
  // second while idle, and tells the client when a roll has finished. With
  // reduced motion nothing moves on its own and a roll ends at once.
  const live = useRef(null);
  live.current = { anim, draw, onAnimEnd, won };
  useEffect(() => { dirty.current = true; });
  useEffect(() => {
    let raf = 0, idleAt = 0, ended = null;
    const loop = (now) => {
      const { anim: an, draw: dr, onAnimEnd: done, won: w } = live.current;
      const reduce = prefersReduced();
      const total = an ? (an.result === 'bump' ? BUMP_MS : ROLL_MS) : 0;
      if (an && ended !== an.id && (reduce || now - an.t0 >= total)) {
        ended = an.id;
        dr(reduce ? an.t0 + total : now);
        dirty.current = false;
        done(an.id);
      } else if ((an && ended !== an.id) || fx.current.busy(now) || (squash.current && now - squash.current.t < SQUASH_MS + 20)
        || (w && winT.current != null && now - winT.current < WIN_MS)) {
        dr(now); dirty.current = false;
      } else if (dirty.current || (!reduce && now - idleAt > 33)) {
        dr(now); dirty.current = false; idleAt = now;
      }
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, []);
  useEffect(() => { fx.current.clear(); squash.current = null; crumbled.current.clear(); }, [P]);

  // swipe on the board
  const sw = useRef(null);
  const onDown = (e) => { sw.current = [e.clientX, e.clientY]; };
  const onUp = (e) => {
    if (!sw.current) return;
    const dx = e.clientX - sw.current[0], dy = e.clientY - sw.current[1];
    sw.current = null;
    if (Math.hypot(dx, dy) < 22) return;
    onMove(Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 'R' : 'L') : (dy > 0 ? 'D' : 'U'));
  };

  const nextNum = state.k;
  const peeks = playing && !won ? peekOf(P, state) : [];
  const peekAttr = peeks.map((p) => `${p.d}${p.top}${p.kind === 'refused' ? 'x' : p.kind === 'lights' ? '*' : ''}`).join(' ');
  const peekSay = peeks.length ? ` Rolling ${peeks.map((p) => `${DIR_SAY[p.d]} brings up ${p.top}${p.kind === 'refused' ? ' (refused)' : p.kind === 'lights' ? ` (lights ${nextNum})` : ''}`).join(', ')}.` : '';
  const say1 = !playing ? doneLine
    : nextNum <= P.N ? `Light square ${nextNum} next: roll onto it with a ${nextNum} on top.` : 'Every square is lit.';
  const say2 = playing
    ? 'A numbered square stays shut until it is next and your roll would land the right number on top. Cracked squares crumble once you leave them.'
    : null;
  // What each pad key would do from here, so a refused roll can be seen coming.
  const keyState = (d) => {
    if (!playing) return 'off';
    const r = step(P, state, d);
    if (r.result === 'edge') return 'edge';
    if (r.result === 'order' || r.result === 'face') return 'lock';
    if (r.lit || r.result === 'win') return 'lights';
    return 'ok';
  };
  const key = (d, Icon, area, label) => {
    const ks = keyState(d);
    return (
      <button type="button" className={`rl-key${ks === 'lights' ? ' lights' : ''}${ks === 'lock' ? ' lock' : ''}`} style={{ gridArea: area }}
        disabled={!playing || ks === 'edge'} onClick={() => onMove(d)}
        aria-label={`${label}${ks === 'lights' ? `, lights square ${nextNum}` : ks === 'lock' ? ', blocked' : ks === 'edge' ? ', off the floor' : ''}`}>
        <Icon size={22} strokeWidth={2.6} />
        {ks === 'lights' && <i>{nextNum}</i>}
      </button>
    );
  };

  const canvas = (
    <canvas ref={cvRef} className="rl-canvas"
      style={stage ? { aspectRatio: `${W} / ${H}` } : { maxWidth: W * 1.4, aspectRatio: `${W} / ${H}` }}
      role="img" aria-label={`Roll board, ${P.w} by ${P.h}. The die shows ${state.t} on top. Square ${Math.min(nextNum, P.N)} is next.${peekSay}`}
      data-top={state.t} data-peek={peekAttr}
      onPointerDown={onDown} onPointerUp={onUp} onPointerCancel={() => { sw.current = null; }} />
  );
  const seq = (
    <div className="rl-seq" aria-label="Squares to light, in order">
      {Array.from({ length: P.N }, (_, i) => i + 1).map((v) => (
        <span key={v} className={`rl-sq${v < state.k ? ' lit' : v === state.k ? ' next' : ''}`}>{v < state.k ? '✓' : v}</span>
      ))}
    </div>
  );
  const pad = (
    <div className="rl-pad" style={{ gridTemplateAreas: '". u ." "l . r" ". d ."' }}>
      {key('U', ArrowUp, 'u', 'Roll up')}
      {key('L', ArrowLeft, 'l', 'Roll left')}
      {key('R', ArrowRight, 'r', 'Roll right')}
      {key('D', ArrowDown, 'd', 'Roll down')}
    </div>
  );
  if (stage) {
    return (
      <div ref={stRef} className="rl rl-st">
        <style dangerouslySetInnerHTML={{ __html: CSS + ST_CSS }} />
        <span ref={probeRef} className="rl-probe" aria-hidden="true" />
        {seq}
        <div className="stg-board rl-board rl-cvbox" style={{ width: fit ? `min(100%, ${Math.floor(fit * W / H)}px)` : '100%' }}>{canvas}</div>
        {playing && (
          <div className="rl-stctl">
            {pad}
            <div className="rl-stacts">
              <button type="button" className="pst-tb" onClick={onUndo} disabled={!canUndo} title="Take back the last roll. It still counts.">
                <Undo2 size={16} strokeWidth={2.4} />Undo
              </button>
              <button type="button" className="pst-tb" onClick={onRestart} disabled={!used} title="Put the die back on the start. Your rolls still count.">
                <RotateCcw size={16} strokeWidth={2.4} />Restart
              </button>
            </div>
          </div>
        )}
        <p className="pst-note" aria-live="polite" style={{ margin: 0 }}>{say1}</p>
      </div>
    );
  }

  return (
    <div className="rl">
      <style dangerouslySetInnerHTML={{ __html: CSS }} />
      <RollMeter used={used} par={par} perfect={perfect} />
      <div className="stg-board rl-board">
        <div className="rl-panel" style={{ position: 'relative' }}>
          <span ref={probeRef} className="rl-probe" aria-hidden="true" />
          <div className="rl-seq" aria-label="Squares to light, in order">
            {Array.from({ length: P.N }, (_, i) => i + 1).map((v) => (
              <span key={v} className={`rl-sq${v < state.k ? ' lit' : v === state.k ? ' next' : ''}`}>{v < state.k ? '✓' : v}</span>
            ))}
          </div>
          <canvas ref={cvRef} className="rl-canvas"
            style={{ maxWidth: W * 1.4, aspectRatio: `${W} / ${H}` }}
            role="img" aria-label={`Roll board, ${P.w} by ${P.h}. The die shows ${state.t} on top. Square ${Math.min(nextNum, P.N)} is next.${peekSay}`}
            data-top={state.t} data-peek={peekAttr}
            onPointerDown={onDown} onPointerUp={onUp} onPointerCancel={() => { sw.current = null; }} />
          <div className="rl-row">
            <div className="rl-say">
              <span className="rl-say1" aria-live="polite">{say1}</span>
              {say2 && <span className="rl-say2">{say2}</span>}
            </div>
            {playing && (
              <>
                <div className="rl-pad" style={{ gridTemplateAreas: '". u ." "l . r" ". d ."' }}>
                  {key('U', ArrowUp, 'u', 'Roll up')}
                  {key('L', ArrowLeft, 'l', 'Roll left')}
                  {key('R', ArrowRight, 'r', 'Roll right')}
                  {key('D', ArrowDown, 'd', 'Roll down')}
                </div>
                <div className="rl-acts">
                  <button type="button" className="rl-btn" onClick={onUndo} disabled={!canUndo} title="Take back the last roll. It still counts.">
                    <Undo2 size={16} strokeWidth={2.2} /> Undo
                  </button>
                  <button type="button" className="rl-btn" onClick={onRestart} disabled={!used} title="Put the die back on the start. Your rolls still count.">
                    <RotateCcw size={16} strokeWidth={2.2} /> Restart
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
      {playing && (
        <div className="rl-foot">
          <span className="rl-rule">Light 1 to {P.N} in order, each with its own number on top.</span>
          <button type="button" className="rl-giveup" onClick={onGiveUp}
            style={{ color: armed ? 'var(--stg-bad, #fb7185)' : 'var(--stg-ink2, #aab5c7)' }}>
            <Eye size={13} /> {armed ? 'Tap again to give up and score nothing' : 'Give up'}
          </button>
        </div>
      )}
    </div>
  );
}
