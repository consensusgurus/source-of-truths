'use client';

// Spin: the daily photo puzzle where every square is turned. Tap a square to
// turn it a quarter clockwise; set the whole picture straight. Score: solved or
// not; fewer taps, then the clock, decide the board. The photo is Jig's or Saw's from
// three weeks earlier (scripts/gen-photo-trio.mjs).
//
// SQUARES THAT LOOK THE SAME TURNED ARE SET STRAIGHT FOR YOU. A patch of clear
// sky or flat water reads the same at every angle, so nobody could tell which
// way is up. Once the photo has loaded, each square is compared with itself
// turned 90, 180 and 270 degrees; one that barely changes is locked straight
// and drawn with a small lock. The rest is the puzzle.

import React, { useEffect, useMemo } from 'react';
import SimpleDaily from '../SimpleDaily';
import usePhotoSquare, { tileStyle, PHOTO_CSS } from '../usePhotoSquare';

const K = 24; // each square is sampled at K x K grey levels
const SAME = 9; // mean difference (0..255) under which a turned square counts as the same

function lockedSquares(canvas, n) {
  const W = canvas.width;
  const c = document.createElement('canvas'); c.width = K * n; c.height = K * n;
  const x = c.getContext('2d');
  x.drawImage(canvas, 0, 0, W, W, 0, 0, K * n, K * n);
  const px = x.getImageData(0, 0, K * n, K * n).data;
  const out = [];
  for (let t = 0; t < n * n; t++) {
    const r0 = Math.floor(t / n) * K, c0 = (t % n) * K;
    const gr = (y, xx) => { const i = ((r0 + y) * K * n + c0 + xx) * 4; return 0.299 * px[i] + 0.587 * px[i + 1] + 0.114 * px[i + 2]; };
    let d90 = 0, d180 = 0, d270 = 0;
    for (let y = 0; y < K; y++) for (let xx = 0; xx < K; xx++) {
      const v = gr(y, xx);
      d90 += Math.abs(v - gr(K - 1 - xx, y));
      d180 += Math.abs(v - gr(K - 1 - y, K - 1 - xx));
      d270 += Math.abs(v - gr(xx, K - 1 - y));
    }
    const m = Math.min(d90, d180, d270) / (K * K);
    if (m < SAME) out.push(t);
  }
  return out;
}

function Board({ P, s, setS, active, done }) {
  const n = P.size;
  const photo = usePhotoSquare(P.jig, undefined, P.saw);
  const locks = useMemo(() => (photo.canvas ? lockedSquares(photo.canvas, n) : null), [photo.canvas, n]);
  // Hand the locks to the state once, so the solve check and the save know them.
  useEffect(() => {
    if (!locks || s.locked || !active) return;
    setS((cur) => ({ ...cur, locked: locks, rot: cur.rot.map((v, i) => (locks.includes(i) ? 0 : v)) }));
  }, [locks, s.locked, active, setS]);
  const solved = s.locked && s.rot.every((v) => v % 4 === 0);
  const lockSet = new Set(s.locked || locks || []);
  const tap = (i) => {
    if (!active || done || !s.locked || lockSet.has(i)) return;
    setS((cur) => { const rot = cur.rot.slice(); rot[i] = rot[i] + 1; return { ...cur, rot, taps: cur.taps + 1 }; });
  };
  return (
    <div className="ph-wrap">
      <style dangerouslySetInnerHTML={{ __html: PHOTO_CSS + `
.spn-t{transition:transform .2s ease;}
.spn-t.lk{cursor:default;}
.spn-t.lk::after{content:"";position:absolute;left:5px;top:5px;width:7px;height:7px;border-radius:2px;background:var(--pst-bg, #fff);box-shadow:0 0 0 1.5px var(--pst-ink, #0b0f1a);opacity:.85;}
.ph-board.solved .spn-t.lk::after{display:none;}
` }} />
      <div className={'ph-board' + (solved ? ' solved' : '')} style={{ gridTemplateColumns: `repeat(${n}, 1fr)` }} role="grid" aria-label={`Spin board, ${n} by ${n}`}>
        {!photo.url ? <div className="ph-load">{photo.error ? 'The photo did not load. Refresh to try again.' : 'Loading the photo'}</div> : null}
        {s.rot.map((q, i) => (
          <button key={i} type="button" className={'ph-t spn-t' + (lockSet.has(i) ? ' lk' : '')}
            style={{ ...tileStyle(photo.url, i, n), transform: `rotate(${q * 90}deg)` }}
            aria-label={`Square ${i + 1}${lockSet.has(i) ? ', locked straight' : (q % 4 === 0 ? ', straight' : '')}`}
            onClick={() => tap(i)} />
        ))}
      </div>
    </div>
  );
}

const straight = (s) => s.rot.filter((v) => v % 4 === 0).length;
const GAME = {
  key: 'spin', name: 'Spin', cat: 'Visual', miss: 'taps',
  fresh: (P) => ({ rot: P.rot.slice(), taps: 0, locked: null }),
  validSave: (P, s) => Array.isArray(s.rot) && s.rot.length === P.rot.length,
  touched: (s) => s.taps > 0,
  solved: (P, s) => !!s.locked && s.rot.every((v) => v % 4 === 0),
  count: (s) => s.taps,
  result: (P, s, won) => ({ score: won ? 10 : 0, total: 10, correct: won ? 1 : 0, guessesUsed: s.taps }),
  Board,
  eyebrow: (P, s, { sundayLabel }) => `${sundayLabel || `${P.size} by ${P.size}`} · No. ${P.num}`,
  foot: (P, s) => `${s.taps} tap${s.taps === 1 ? '' : 's'} · ${straight(s)} of ${s.rot.length} straight`,
  frac: (P, s) => straight(s) / s.rot.length,
  sundayLabel: (P) => `Sunday Edition · ${P.size}×${P.size}`,
  gateTitle: (P) => `Today: a ${P.size} by ${P.size} spin`,
  gateLine: (P) => `A photograph cut into ${P.size * P.size} squares, almost every one turned. Tap a square to turn it a quarter clockwise, and set the whole picture straight in as few taps as you can.`,
  rules: (P) => ({
    lead: 'Every square of the photo is turned. Set them all straight.',
    steps: [
      <>A photograph is cut into a <b>{P.size} by {P.size}</b> grid and nearly every square is <b>turned</b> a quarter, a half or three quarters.</>,
      <><b>Tap</b> a square to turn it a quarter <b>clockwise</b>. Four taps bring it back where it started, so every tap counts.</>,
      <>A square that would look the same at any angle, such as clear sky, is <b>locked straight</b> for you and marked with a small square.</>,
    ],
    knack: 'Look for a line that should run straight across the picture, like a horizon, a roof or a shoreline, and follow it square by square.',
    footer: 'A finished picture ranks on taps, then on the clock.',
  }),
  pitch: (P) => `a ${P.size}x${P.size} photo with every square turned.`,
  shareLine: (P, s, won, el) => `Spin #${P.num} · ${won ? `${s.taps} taps · ${el}` : 'unfinished'}`,
  detail: (P, s, won, el) => `${s.taps} tap${s.taps === 1 ? '' : 's'} · ${el}`,
  aboutTitle: 'About Spin',
  about: [
    'Spin is a free daily photo puzzle from Mind Loft. Each day a photograph is cut into a six by six grid and nearly every square is turned, and you tap each square round, a quarter turn at a time, until the whole picture is straight.',
    'Taps only turn clockwise, so a square turned a quarter the wrong way costs three taps to fix: read the square before you tap it. A finished picture ranks on taps, then on the clock, and squares that would look the same at any angle are locked straight for you. The Sunday Edition is eight by eight.',
    <>The photos come from the daily jigsaws, <a href="/jig" style={{ color: 'inherit', fontWeight: 800 }}>Jig</a> and <a href="/saw" style={{ color: 'inherit', fontWeight: 800 }}>Saw</a>, three weeks earlier. More photo puzzles: <a href="/swap" style={{ color: 'inherit', fontWeight: 800 }}>Swap</a> and <a href="/slide" style={{ color: 'inherit', fontWeight: 800 }}>Slide</a>.</>,
  ],
};

export default function SpinClient(props) {
  return <SimpleDaily {...props} game={GAME} />;
}
