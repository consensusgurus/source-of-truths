'use client';

// Slide: the daily sliding-tile photo puzzle (the 15-puzzle, bigger). One
// square of the photo is missing; tap any square in the gap's row or column to
// slide it, and every square between, into the gap. Arrow keys work too. Score:
// solved or not; fewer squares moved, then the clock, decide the board. The
// photo is Jig's or Saw's from two weeks earlier (scripts/gen-photo-trio.mjs).

import React, { useEffect } from 'react';
import SimpleDaily from '../SimpleDaily';
import usePhotoSquare, { tileStyle, PHOTO_CSS } from '../usePhotoSquare';

// Slide the line of squares between `i` and the gap toward the gap. Returns the
// new board and how many squares moved, or null when `i` is not in line.
export function slideFrom(cur, n, i) {
  const gap = n * n - 1;
  const g = cur.indexOf(gap);
  if (i === g) return null;
  const gr = Math.floor(g / n), gc = g % n, r = Math.floor(i / n), c = i % n;
  if (r !== gr && c !== gc) return null;
  const step = r === gr ? (c > gc ? 1 : -1) : (r > gr ? n : -n);
  const out = cur.slice();
  let at = g, moved = 0;
  while (at !== i) { out[at] = out[at + step]; at += step; moved++; }
  out[i] = gap;
  return { cur: out, moved };
}

function Board({ P, s, setS, active, done }) {
  const n = P.size, gap = n * n - 1;
  const photo = usePhotoSquare(P.jig, undefined, P.saw);
  const solved = s.cur.every((t, i) => t === i);
  const tap = (i) => {
    if (!active || done) return;
    setS((cur) => { const r = slideFrom(cur.cur, n, i); return r ? { cur: r.cur, moves: cur.moves + r.moved } : cur; });
  };
  useEffect(() => {
    if (!active || done) return undefined;
    const onKey = (e) => {
      const d = { ArrowUp: n, ArrowDown: -n, ArrowLeft: 1, ArrowRight: -1 }[e.key];
      if (d == null) return;
      // An arrow moves the square that sits on that side of the gap INTO it.
      setS((cur) => {
        const g = cur.cur.indexOf(gap), i = g + d;
        if (i < 0 || i >= n * n || (Math.abs(d) === 1 && Math.floor(i / n) !== Math.floor(g / n))) return cur;
        const r = slideFrom(cur.cur, n, i);
        return r ? { cur: r.cur, moves: cur.moves + r.moved } : cur;
      });
      e.preventDefault();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [active, done, n, gap, setS]);
  return (
    <div className="ph-wrap">
      <style dangerouslySetInnerHTML={{ __html: PHOTO_CSS + `
.sld-gap{background:var(--pst-cell, #f1f4f8) !important;background-image:none !important;cursor:default;}
` }} />
      <div className={'ph-board' + (solved ? ' solved' : '')} style={{ gridTemplateColumns: `repeat(${n}, 1fr)` }} role="grid" aria-label={`Slide board, ${n} by ${n}`}>
        {!photo.url ? <div className="ph-load">{photo.error ? 'The photo did not load. Refresh to try again.' : 'Loading the photo'}</div> : null}
        {s.cur.map((t, i) => (
          t === gap && !solved
            ? <div key={i} className="ph-t sld-gap" aria-label="The gap" />
            : <button key={i} type="button" className="ph-t" style={tileStyle(photo.url, t, n)} aria-label={`Square ${i + 1}`} onClick={() => tap(i)} />
        ))}
      </div>
    </div>
  );
}

const GAME = {
  key: 'slide', name: 'Slide', cat: 'Logic', miss: 'moves',
  fresh: (P) => ({ cur: P.tiles.slice(), moves: 0 }),
  validSave: (P, s) => Array.isArray(s.cur) && s.cur.length === P.tiles.length,
  touched: (s) => s.moves > 0,
  solved: (P, s) => s.cur.every((t, i) => t === i),
  count: (s) => s.moves,
  result: (P, s, won) => ({ score: won ? 10 : 0, total: 10, correct: won ? 1 : 0, guessesUsed: s.moves }),
  Board,
  wide: false,
  eyebrow: (P, s, { sundayLabel }) => `${sundayLabel || `${P.size} by ${P.size}`} · No. ${P.num}`,
  foot: (P, s) => { const home = s.cur.filter((t, i) => t === i && t !== s.cur.length - 1).length; return `${s.moves} move${s.moves === 1 ? '' : 's'} · ${home} of ${s.cur.length - 1} in place`; },
  frac: (P, s) => s.cur.filter((t, i) => t === i && t !== s.cur.length - 1).length / (s.cur.length - 1),
  sundayLabel: (P) => `Sunday Edition · ${P.size}×${P.size}`,
  gateTitle: (P) => `Today: a ${P.size} by ${P.size} slide`,
  gateLine: (P) => `A photograph cut into ${P.size * P.size} squares with one missing, all shuffled. Slide squares into the gap until the picture is whole, the bottom right corner left empty.`,
  rules: (P) => ({
    lead: 'The sliding-tile puzzle, with a photograph and a bigger board.',
    steps: [
      <>A photograph is cut into a <b>{P.size} by {P.size}</b> grid, the bottom right square taken out, and the rest shuffled.</>,
      <><b>Tap</b> a square in the gap&rsquo;s row or column to slide it into the gap, with every square between. On a keyboard the <b>arrow keys</b> slide a square into the gap.</>,
      <>Finish with the picture whole and the gap back in the <b>bottom right corner</b>. Every board can be solved.</>,
    ],
    knack: 'Finish the top row, then the left column, and the puzzle shrinks by one row and one column each time. Save the last two squares of a row for last and bring them in together.',
    footer: 'A finished picture ranks on squares moved, then on the clock.',
  }),
  pitch: (P) => `a ${P.size}x${P.size} sliding photo puzzle.`,
  shareLine: (P, s, won, el) => `Slide #${P.num} · ${won ? `${s.moves} moves · ${el}` : 'unfinished'}`,
  detail: (P, s, won, el) => `${s.moves} move${s.moves === 1 ? '' : 's'} · ${el}`,
  aboutTitle: 'About Slide',
  about: [
    'Slide is a free daily sliding-tile puzzle from Mind Loft, the classic fifteen puzzle grown to a five by five photograph. One square is missing, and you slide the others through the gap until the picture is whole.',
    'Tap any square in line with the gap to slide a whole row or column at once, or use the arrow keys. Every board is checked to be solvable before it ships, and a finished picture ranks on how many squares you moved, then on the clock. The Sunday Edition is six by six.',
    <>The photos come from the daily jigsaws, <a href="/jig" style={{ color: 'inherit', fontWeight: 800 }}>Jig</a> and <a href="/saw" style={{ color: 'inherit', fontWeight: 800 }}>Saw</a>, two weeks earlier. More photo puzzles: <a href="/swap" style={{ color: 'inherit', fontWeight: 800 }}>Swap</a> and <a href="/spin" style={{ color: 'inherit', fontWeight: 800 }}>Spin</a>.</>,
  ],
};

export default function SlideClient(props) {
  return <SimpleDaily {...props} game={GAME} />;
}
