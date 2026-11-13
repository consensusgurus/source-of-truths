'use client';

// Spot: the daily spot the difference game (owner, 2026-11-12, approved from
// the mockup: "love it"). Two copies of one past Jig photograph; the second is
// altered in P.diffs places. Tap either copy where they differ.
//
// SCORING. The score is the number found, a real count, so Spot keeps its
// fraction and is not in SCORE_VIEW. The board comparator then reads
// guesses_used, lowest first, which here is the MISS FIGURE: a wrong tap is one
// and a hint is two. Then the clock. So a clean run beats a fast mash, and the
// clock is never docked: nothing is added to the time, the misses rank ahead of
// it. A hint is PAID (two misses), so it is open to everyone on every board and
// is not behind the first-play gate (docs/claude/scoring.md, "PAID hints").
//
// Runs on the shared stage shell (app/SimpleDaily.jsx). The pair, the zoom and
// the tap maths live in app/spot/SpotBoard.jsx, shared with the kids copy.

import React, { useEffect, useRef, useState } from 'react';
import SimpleDaily from '../SimpleDaily';
import SpotPair, { spotHit, SpotCredit, SPOT_CSS } from './SpotBoard';
import { endGrade } from '@/lib/end-verdict';

const MISS_LOCK_MS = 600;
const HINT_COST = 2;
const missFig = (s) => (s.miss || 0) + HINT_COST * (s.hints || 0);
const WORDS = ['no', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten'];
const word = (n) => WORDS[n] || String(n);
const Word = (n) => { const w = word(n); return w[0].toUpperCase() + w.slice(1); };

const CSS = SPOT_CSS + `
.spt{font-family:'Manrope',system-ui,sans-serif;color:var(--pst-ink,#0b0f1a);--spt-ink:var(--pst-ink,#0b0f1a);--spt-ring:var(--pst-acc,#fda4af);--spt-on:var(--pst-acc,#fda4af);--spt-cell:var(--pst-cell,#eef1f6);}
.spt .spt-btn{border:1px solid var(--pst-ink,#0b0f1a);background:transparent;color:inherit;border-radius:999px;padding:8px 16px;font:inherit;font-size:13px;font-weight:800;line-height:1.3;cursor:pointer;}
.spt .spt-btn:hover{background:var(--pst-acc,#fda4af);color:#0b0f1a;}
.spt .spt-btn:disabled{opacity:.45;cursor:default;background:transparent;color:inherit;}
.spt-wait{width:100%;max-width:520px;min-height:160px;border:1px solid var(--pst-ink,#0b0f1a);border-radius:12px;display:flex;align-items:center;justify-content:center;padding:16px 24px;text-align:center;font-size:14px;font-weight:600;line-height:1.5;}
.spt-list{display:grid;grid-template-columns:repeat(auto-fill,minmax(260px,1fr));gap:2px 20px;width:100%;max-width:900px;}
.spt-li{display:flex;align-items:center;gap:9px;padding:6px 0;font-size:14px;font-weight:600;line-height:1.45;}
.spt-dot{flex:none;width:12px;height:12px;border-radius:50%;border:1px solid var(--pst-ink,#0b0f1a);background:var(--pst-acc,#fda4af);}
.spt-dot.lost{background:transparent;}
/* PHONE ROOM (owner, 2026-11-13: "spot on mobile could allow more space for
   the pictures themselves"). The stage column's side padding shrinks so the
   stacked photos run nearly edge to edge, and the pair's height reserve in
   SpotBoard.jsx drops from 320px to 210px. */
@media (max-width:899px){.pst:has(.spt) .pst-col{padding-left:6px;padding-right:6px;gap:10px;}.pst:has(.spt) .pst-top{gap:8px;}.spt{gap:8px;}}
/* THE FOUND LIST IN PLAY (owner, 2026-11-13: "need the descriptions below the
   zoom and above the misses"). What has been found so far, in the order found,
   sits at the bottom, under the zoom bar and the misses line.
   Only found ones are listed, so nothing is given away. */
.spt-tally{width:100%;}
.spt-got{display:flex;flex-direction:column;gap:2px;width:100%;max-width:900px;}
.spt-got .spt-li{padding:3px 4px;font-size:13.5px;}
@media (min-width:900px){.spt-got{display:grid;grid-template-columns:repeat(auto-fill,minmax(260px,1fr));gap:2px 20px;}}
.spt-li em{margin-left:auto;padding-left:8px;font-style:normal;font-size:12.5px;font-weight:800;white-space:nowrap;}
`;

function Board({ P, s, setS, active, done }) {
  const [say, setSay] = useState('');
  const [hint, setHint] = useState(null);
  const lock = useRef(0);
  const n = P.diffs.length;
  const found = s.found || [];
  useEffect(() => { if (!hint) return undefined; const t = setTimeout(() => setHint(null), 2700); return () => clearTimeout(t); }, [hint]);

  if (done) {
    const lost = P.diffs.map((_, i) => i).filter((i) => !found.includes(i));
    return (
      <div className="spt">
        <style dangerouslySetInnerHTML={{ __html: CSS }} />
        <SpotPair P={P} found={found} lost={lost} live={false} />
        <div className="spt-list">
          {P.diffs.map((d, i) => (
            <div className="spt-li" key={i}>
              <span className={'spt-dot' + (found.includes(i) ? '' : ' lost')} />
              <span>{d.t}</span>
              <em>{found.includes(i) ? 'Found' : 'Missed'}</em>
            </div>
          ))}
        </div>
        <SpotCredit P={P} />
      </div>
    );
  }

  const onTap = (nx, ny, minR) => {
    if (!active || Date.now() < lock.current) return null;
    const i = spotHit(P, nx, ny, minR, found);
    if (i < 0) {
      lock.current = Date.now() + MISS_LOCK_MS;
      setS((st) => ({ ...st, miss: (st.miss || 0) + 1 }));
      setSay('Nothing there. That is a miss.');
      return 'miss';
    }
    if (found.includes(i)) { setSay('Already found.'); return null; }
    const left = n - found.length - 1;
    setSay(left ? `Found one. ${Word(left)} to go.` : 'That is all of them.');
    setS((st) => ((st.found || []).includes(i) ? st : { ...st, found: [...(st.found || []), i] }));
    return 'hit';
  };
  const giveHint = () => {
    if (!active) return;
    const open = P.diffs.map((_, i) => i).filter((i) => !found.includes(i));
    if (!open.length) return;
    const d = P.diffs[open[Math.floor(Math.random() * open.length)]];
    // A loose circle that holds the difference somewhere inside it, never dead centre.
    const R = Math.max(0.11, Math.max(d.rx, d.ry) * 1.6), a = Math.random() * Math.PI * 2, k = Math.random() * 0.5 * R;
    const hx = Math.min(Math.max(d.x + Math.cos(a) * k, R * 0.6), 1 - R * 0.6);
    const hy = Math.min(Math.max(d.y + Math.sin(a) * k * (P.w / P.h), R * 0.6), 1 - R * 0.6);
    setHint({ x: hx, y: hy, r: R, n: Date.now() });
    setS((st) => ({ ...st, hints: (st.hints || 0) + 1 }));
    setSay('One is somewhere in the circle. A hint counts as two misses.');
  };

  return (
    <div className="spt">
      <style dangerouslySetInnerHTML={{ __html: CSS }} />
      <SpotPair P={P} found={found} onTap={onTap} show={active} live={active} hint={hint}
        tools={active ? <button type="button" className="spt-btn" onClick={giveHint}>Hint</button> : null} />
      {active ? (
        <div className="pst-foot spt-tally">
          <span className="pst-bar"><span style={{ width: `${(found.length / n) * 100}%` }} /></span>
          <span className="pst-line">{GAME.tally(P, s)}</span>
        </div>
      ) : null}
      <p className="spt-say" aria-live="polite">{active ? (say || 'Tap either photo where they differ.') : ''}</p>
      {active && found.length ? (
        <div className="spt-got">
          {found.map((i) => (
            <div className="spt-li" key={i}>
              <span className="spt-dot" />
              <span>{P.diffs[i] ? P.diffs[i].t : ''}</span>
            </div>
          ))}
        </div>
      ) : null}
      {active ? <SpotCredit P={P} /> : null}
    </div>
  );
}

const marks = (P, s) => P.diffs.map((_, i) => ((s.found || []).includes(i) ? '\u{1F7E9}' : '⬜')).join('');

const GAME = {
  key: 'spot', name: 'Spot', cat: 'Visual', miss: 'misses', missOne: 'miss', wide: true, big: true,
  runDoor: 'eagleeye',
  fresh: () => ({ found: [], miss: 0, hints: 0 }),
  validSave: (P, s) => Array.isArray(s.found) && s.found.length <= P.diffs.length && s.found.every((i) => Number.isInteger(i) && i >= 0 && i < P.diffs.length),
  touched: (s) => (s.found || []).length > 0 || missFig(s) > 0,
  solved: (P, s) => (s.found || []).length >= P.diffs.length,
  count: (s) => missFig(s),
  // Points are the differences found; a give-up keeps what was found so far.
  result: (P, s) => ({ score: (s.found || []).length, total: P.diffs.length, correct: (s.found || []).length, guessesUsed: missFig(s) }),
  title: (P, s) => endGrade((s.found || []).length, P.diffs.length, 'Solved!'),
  metric: (P, s) => (s.found || []).length,
  Board,
  eyebrow: (P, s) => `No. ${P.num} · ${(s.found || []).length} of ${P.diffs.length} found`,
  // The misses line is drawn by the board itself, straight under the zoom bar,
  // so the found descriptions can sit below it at the bottom (owner,
  // 2026-11-13: "the descriptions should sit at the bottom, below zoom and
  // misses"). The stage's own foot and bar stay empty for Spot.
  foot: () => null,
  tally: (P, s) => { const m = missFig(s); return `${m} ${m === 1 ? 'miss' : 'misses'}${s.hints ? ` · ${s.hints} ${s.hints === 1 ? 'hint' : 'hints'}` : ''}`; },
  gateTitle: (P) => `Today: ${word(P.diffs.length)} differences`,
  gateLine: (P) => `Two copies of one photograph, and the second has been changed in ${word(P.diffs.length)} places. Tap either photo wherever they differ. A wrong tap is a miss, and misses count before the clock does. The photos appear the moment you press Start.`,
  rules: (P) => ({
    lead: 'Find every difference between the two photos.',
    banner: 'Everyone gets the same two photos today.',
    steps: [
      <>The second photo has been changed in <b>{word(P.diffs.length)} places</b>: a color, something missing, something added. <b>Tap</b> the spot on either photo and a ring marks it on both.</>,
      <>A tap on nothing is a <b>miss</b>. Misses do not stop you, but a clean run ranks above a fast one with misses.</>,
      <><b>Zoom</b> to 2x or 3x and drag to look closer; both photos move together. Stuck? A <b>Hint</b> circles the area around one difference and counts as two misses.</>,
    ],
    knack: 'Work in strips rather than hunting. Sweep the sky, then the skyline, then the middle, then the bottom edge, comparing one small patch at a time. Color changes jump out at 1x; the small removals need the zoom.',
    footer: 'Scored on differences found, then fewest misses, then the clock. Give up and you keep what you found.',
  }),
  pitch: (P) => `two photos, ${word(P.diffs.length)} differences. Can you find them all?`,
  shareLine: (P, s, won, el) => { const m = missFig(s); return `Spot #${P.num} · ${(s.found || []).length} of ${P.diffs.length} · ${m} ${m === 1 ? 'miss' : 'misses'} · ${el}\n${marks(P, s)}`; },
  detail: (P, s, won, el) => { const m = missFig(s); return `${(s.found || []).length} of ${P.diffs.length} found · ${m} ${m === 1 ? 'miss' : 'misses'} · ${el}`; },
  aboutTitle: 'About Spot',
  about: [
    'Spot is a free daily spot the difference game from Mind Loft. Every day it shows two copies of one real photograph, a harbor, a castle, a city street, and the second copy has been changed in seven places. A boat is gone, a roof has turned blue, a cloud has appeared that was never there. Tap either photo wherever they differ and a ring marks the spot on both.',
    'There is no limit on taps, but a tap on nothing is a miss, and a board is ranked on differences found, then on fewest misses, then on the clock. You can zoom to two or three times the size and drag the photo around, and both copies move together so the same patch is always side by side. A hint circles the area around one difference and costs two misses.',
    <>The photographs are Wikimedia Commons featured pictures that have already run as the day&rsquo;s jigsaw on <a href="/jig" style={{ color: 'inherit', fontWeight: 800 }}>Jig</a>, each credited under the board. More photo puzzles: <a href="/saw" style={{ color: 'inherit', fontWeight: 800 }}>Saw</a>, <a href="/swap" style={{ color: 'inherit', fontWeight: 800 }}>Swap</a>, <a href="/slide" style={{ color: 'inherit', fontWeight: 800 }}>Slide</a> and <a href="/spin" style={{ color: 'inherit', fontWeight: 800 }}>Spin</a>. For another test of a sharp eye, <a href="/witness" style={{ color: 'inherit', fontWeight: 800 }}>Witness</a> shows a street scene and then asks what you saw.</>,
  ],
};

export default function SpotClient(props) {
  return <SimpleDaily {...props} game={GAME} />;
}
