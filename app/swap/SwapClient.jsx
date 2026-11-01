'use client';

// Swap: the daily photo puzzle where every square of the picture starts in the
// wrong place. Tap two squares (or drag one onto another) to trade them. Every
// board starts with no square at home; the fewest swaps that can fix it is
// printed only in the rules. Score: solved or not; fewer swaps then the clock
// decide the board. The photo is Jig's from a week earlier (scripts/gen-photo-trio.mjs).

import React, { useState, useRef } from 'react';
import SimpleDaily from '../SimpleDaily';
import usePhotoSquare, { tileStyle, PHOTO_CSS } from '../usePhotoSquare';

function par(perm) {
  const seen = new Array(perm.length).fill(false); let c = 0;
  for (let i = 0; i < perm.length; i++) { if (seen[i]) continue; c++; let j = i; while (!seen[j]) { seen[j] = true; j = perm[j]; } }
  return perm.length - c;
}

function Board({ P, s, setS, active, done }) {
  const n = P.size;
  const photo = usePhotoSquare(P.jig);
  const [sel, setSel] = useState(-1);
  const drag = useRef(null);
  const lastDrag = useRef(0);
  const solved = s.cur.every((t, i) => t === i);
  const swap = (a, b) => {
    if (a === b) return;
    setS((cur) => { const c = cur.cur.slice(); [c[a], c[b]] = [c[b], c[a]]; return { cur: c, moves: cur.moves + 1 }; });
    setSel(-1);
  };
  const tap = (i) => {
    if (!active || done) return;
    if (sel < 0) setSel(i);
    else if (sel === i) setSel(-1);
    else swap(sel, i);
  };
  const tileAt = (e) => { const el = document.elementFromPoint(e.clientX, e.clientY); const b = el && el.closest && el.closest('[data-swap]'); return b ? Number(b.getAttribute('data-swap')) : -1; };
  return (
    <div className="ph-wrap">
      <style dangerouslySetInnerHTML={{ __html: PHOTO_CSS + `
.swp-t.sel{box-shadow:inset 0 0 0 4px var(--pst-acc, #7dd3fc), inset 0 0 0 6px var(--pst-ink, #0b0f1a);z-index:2;}
.swp-t.home::after{content:"";position:absolute;right:4px;bottom:4px;width:7px;height:7px;border-radius:50%;background:var(--pst-acc, #7dd3fc);box-shadow:0 0 0 1.5px var(--pst-ink, #0b0f1a);}
.ph-board.solved .swp-t.home::after{display:none;}
` }} />
      <div className={'ph-board' + (solved ? ' solved' : '')} style={{ gridTemplateColumns: `repeat(${n}, 1fr)`, touchAction: active ? 'none' : 'auto' }} role="grid" aria-label={`Swap board, ${n} by ${n}`}
        onPointerDown={(e) => { const i = tileAt(e); drag.current = i >= 0 ? { i, x: e.clientX, y: e.clientY } : null; }}
        onPointerUp={(e) => {
          const d = drag.current; drag.current = null;
          if (!d || !active || done) return;
          const j = tileAt(e);
          if (j >= 0 && j !== d.i && Math.hypot(e.clientX - d.x, e.clientY - d.y) > 12) { swap(d.i, j); lastDrag.current = Date.now(); }
        }}>
        {!photo.url ? <div className="ph-load">{photo.error ? 'The photo did not load. Refresh to try again.' : 'Loading the photo'}</div> : null}
        {s.cur.map((t, i) => (
          <button key={i} type="button" data-swap={i} className={'ph-t swp-t' + (sel === i ? ' sel' : '') + (t === i ? ' home' : '')}
            style={tileStyle(photo.url, t, n)} aria-label={`Square ${i + 1}${t === i ? ', in place' : ''}`}
            onClick={() => { if (Date.now() - lastDrag.current > 350) tap(i); }} />
        ))}
      </div>
    </div>
  );
}

const GAME = {
  key: 'swap', name: 'Swap', cat: 'Logic', miss: 'swaps',
  fresh: (P) => ({ cur: P.perm.slice(), moves: 0 }),
  validSave: (P, s) => Array.isArray(s.cur) && s.cur.length === P.perm.length,
  touched: (s) => s.moves > 0,
  solved: (P, s) => s.cur.every((t, i) => t === i),
  count: (s) => s.moves,
  result: (P, s, won) => ({ score: won ? 10 : 0, total: 10, correct: won ? 1 : 0, guessesUsed: s.moves }),
  Board,
  eyebrow: (P, s, { sundayLabel }) => `${sundayLabel || `${P.size} by ${P.size}`} · No. ${P.num}`,
  foot: (P, s) => { const home = s.cur.filter((t, i) => t === i).length; return `${s.moves} swap${s.moves === 1 ? '' : 's'} · ${home} of ${s.cur.length} in place`; },
  frac: (P, s) => s.cur.filter((t, i) => t === i).length / s.cur.length,
  giveUpLabel: 'Tap again to give up',
  sundayLabel: (P) => `Sunday Edition · ${P.size}×${P.size}`,
  gateTitle: (P) => `Today: a ${P.size} by ${P.size} photo`,
  gateLine: (P) => `A photograph cut into ${P.size * P.size} squares and shuffled, with not one square in its place. Swap two squares at a time until the picture is whole, in as few swaps as you can.`,
  rules: (P) => ({
    lead: 'Put the photo back together by swapping squares, two at a time.',
    steps: [
      <>A photograph is cut into a <b>{P.size} by {P.size}</b> grid and shuffled. <b>No square</b> starts in its place.</>,
      <><b>Tap</b> one square and then another to swap them, or <b>drag</b> one onto the other. A small dot marks a square that is home.</>,
      <>Every board can be fixed in a known <b>fewest swaps</b>: today that is {par(P.perm)}. A square you swap into its home stays right, so look for swaps that put both squares home at once.</>,
    ],
    knack: 'Start with the corners and the edges of the picture, where the sky, the ground and the frame are easiest to read.',
    footer: 'A finished photo ranks on swaps, then on the clock.',
  }),
  pitch: (P) => `a ${P.size}x${P.size} photo, every square out of place. Swap it back.`,
  shareLine: (P, s, won, el) => `Swap #${P.num} · ${won ? `${s.moves} swaps · ${el}` : 'unfinished'}`,
  detail: (P, s, won, el) => `${s.moves} swap${s.moves === 1 ? '' : 's'} · ${el}`,
  aboutTitle: 'About Swap',
  about: [
    'Swap is a free daily photo puzzle from Mind Loft. Each day a photograph is cut into a six by six grid of squares and shuffled so that not one square starts in its place, and you put it back together by swapping squares two at a time.',
    'Every board has a known fewest number of swaps, and a finished picture ranks on how many swaps you took, then on the clock. The photos are the same Wikimedia Commons pictures as the daily jigsaw, Jig, from a week earlier. The Sunday Edition is a seven by seven grid.',
    <>More photo puzzles: <a href="/jig" style={{ color: 'inherit', fontWeight: 800 }}>Jig</a>, <a href="/slide" style={{ color: 'inherit', fontWeight: 800 }}>Slide</a> and <a href="/spin" style={{ color: 'inherit', fontWeight: 800 }}>Spin</a>.</>,
  ],
};

export default function SwapClient(props) {
  return <SimpleDaily {...props} game={GAME} />;
}
