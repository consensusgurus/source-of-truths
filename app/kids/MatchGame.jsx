'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import SiteHeader from '../SiteHeader';
import Grain from '../Grain';
import Footer from '../Footer';
import { formatCount } from '../Count';
import { T as THEME } from '@/lib/theme';

// Generic Kids Corner matching (concentration) game engine.
//
// Two content modes:
//  - `items`: [{ n, s }] -> each item appears twice (identical pairs), e.g. the
//    Treats / Pizza / Dog games.
//  - `pairs`: [{ a, b, name }] -> the two cards of a pair show DIFFERENT faces
//    (a and b), e.g. Addition (equation <-> answer), Letters (UPPER <-> lower),
//    Colors (word <-> swatch). Each face is an inline SVG string.
//
// Sizing: the card size defaults to a per-device "fit" value (computed from the
// viewport so the whole board fits one screen, larger on desktop/tablet than on
// a phone), and a Size slider lets the player make the squares bigger or smaller
// on any device. `cols` caps how many columns the board can use; `maxCard` caps
// the default card size (so dense boards do not balloon on big screens). Players
// (1-4) are chosen on a pre-game screen. Page views are recorded via the
// quiz-view system (the given `quizId`).
const C = { ink: THEME.ink, accent: THEME.accent, muted: THEME.muted, soft: THEME.muted, line: 'rgba(20,22,28,0.30)' };
const FONT = "'Manrope', system-ui, -apple-system, sans-serif";

const Star = () => (
  <svg viewBox="0 0 24 24" width="30" height="30" fill={THEME.white} aria-hidden="true"><path d="M12 2l2.9 6.3 6.9.7-5.1 4.6 1.4 6.8L12 17.8 5 20.4l1.4-6.8L1.3 9l6.9-.7z" /></svg>
);
const Refresh = () => (
  <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M3 12a9 9 0 1 0 3-6.7L3 8" /><path d="M3 3v5h5" /></svg>
);
const Eye = () => (
  <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7z" /><circle cx="12" cy="12" r="3" /></svg>
);
const Trophy = () => (
  <svg viewBox="0 0 24 24" width="40" height="40" fill="none" stroke="#0f6e56" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M8 21h8M12 17v4M7 4h10v5a5 5 0 0 1-10 0z" /><path d="M7 6H4v2a3 3 0 0 0 3 3M17 6h3v2a3 3 0 0 1-3 3" /></svg>
);

export default function MatchGame({ items, pairs, title, intro, quizId, cols = 5, maxCard, backLabel = 'Back to all games' }) {
  const pairList = pairs || (items || []).map((it) => ({ a: it.s, b: it.s, name: it.n }));
  const N = pairList.length;

  function buildDeck() {
    const d = [];
    for (let i = 0; i < N; i++) {
      d.push({ pid: i, face: pairList[i].a, name: pairList[i].name });
      d.push({ pid: i, face: pairList[i].b, name: pairList[i].name });
    }
    for (let i = d.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); const t = d[i]; d[i] = d[j]; d[j] = t; }
    return d.map((c, idx) => ({ ...c, key: idx }));
  }

  const [phase, setPhase] = useState('select');
  const [numPlayers, setNumPlayers] = useState(1);
  const [deck, setDeck] = useState([]);
  const [flipped, setFlipped] = useState([]);
  const [done, setDone] = useState([]);
  const [cur, setCur] = useState(1);
  const [scores, setScores] = useState({ 1: 0 });
  const [won, setWon] = useState(false);
  const [views, setViews] = useState(null);
  const [vp, setVp] = useState({ w: 1200, h: 800 });
  const [size, setSize] = useState(0);

  const flipRef = useRef([]);
  const doneRef = useRef([]);
  const lock = useRef(false);

  useEffect(() => {
    let on = true;
    fetch('/api/quiz/view', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ quizId }) })
      .then((r) => r.json())
      .then((d) => { if (on && d && typeof d.count === 'number') setViews(d.count); })
      .catch(() => {});
    return () => { on = false; };
  }, [quizId]);

  useEffect(() => {
    const f = () => setVp({ w: window.innerWidth, h: window.innerHeight });
    f();
    window.addEventListener('resize', f);
    return () => window.removeEventListener('resize', f);
  }, []);

  // Default ("fit") card size: largest square that fits all cards on one screen.
  function fitSize(w, h) {
    const T = N * 2;
    const availW = Math.min(w, 1180) - (w <= 560 ? 28 : 44);
    const availH = Math.max(240, h - (316 + (numPlayers > 1 ? 70 : 0)));
    const gap = 10;
    let best = 0;
    for (let c = Math.min(cols, T); c >= 1; c--) {
      const rows = Math.ceil(T / c);
      const cw = (availW - (c - 1) * gap) / c;
      const ch = (availH - (rows - 1) * gap) / rows;
      const s = Math.min(cw, ch);
      if (s > best) best = s;
    }
    if (maxCard && best > maxCard) best = maxCard;
    return Math.max(40, Math.min(140, Math.floor(best)));
  }

  useEffect(() => {
    setSize((s) => (s === 0 ? fitSize(vp.w, vp.h) : s));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [vp, numPlayers]);

  const sizePx = size || 64;
  const gap = sizePx <= 46 ? 6 : 9;
  const availW = Math.min(vp.w, 1180) - (vp.w <= 560 ? 28 : 44);
  const colsNow = Math.max(1, Math.min(cols, N * 2, Math.floor((availW + gap) / (sizePx + gap))));

  function start() {
    const sc = {};
    for (let i = 1; i <= numPlayers; i++) sc[i] = 0;
    setDeck(buildDeck());
    flipRef.current = []; doneRef.current = []; lock.current = false;
    setFlipped([]); setDone([]); setCur(1); setScores(sc); setWon(false);
    setSize(fitSize(vp.w, vp.h));
    setPhase('play');
  }
  function toSelect() {
    lock.current = false; flipRef.current = []; doneRef.current = [];
    setWon(false); setFlipped([]); setDone([]); setPhase('select');
  }

  function onCard(i) {
    if (lock.current || won) return;
    if (flipRef.current.includes(i) || doneRef.current.includes(i)) return;
    const nf = [...flipRef.current, i];
    flipRef.current = nf;
    setFlipped(nf);
    if (nf.length < 2) return;
    lock.current = true;
    const [a, b] = nf;
    const player = cur;
    const np = numPlayers;
    if (deck[a].pid === deck[b].pid) {
      setTimeout(() => {
        const nd = [...doneRef.current, a, b];
        doneRef.current = nd;
        setDone(nd);
        setScores((prev) => ({ ...prev, [player]: (prev[player] || 0) + 1 }));
        flipRef.current = [];
        setFlipped([]);
        lock.current = false;
        if (nd.length === deck.length) setWon(true);
      }, 500);
    } else {
      setTimeout(() => {
        flipRef.current = [];
        setFlipped([]);
        if (np > 1) setCur((p) => (p % np) + 1);
        lock.current = false;
      }, 850);
    }
  }

  let winTitle = 'You found them all!';
  let winSub = 'Great matching.';
  if (won && numPlayers > 1) {
    const vals = Object.values(scores);
    const max = Math.max(...vals);
    const winners = Object.keys(scores).filter((k) => scores[k] === max);
    winTitle = winners.length === 1 ? `Player ${winners[0]} wins!` : "It's a tie!";
    winSub = Object.keys(scores).map((k) => `Player ${k}: ${scores[k]}`).join('   ·   ');
  }

  return (
    <div style={{ minHeight: '100vh', background: THEME.surface, color: C.ink, position: 'relative', overflow: 'clip', fontFamily: FONT }}>
      <Grain />
      <div style={{ position: 'relative', zIndex: 2 }}>
        <SiteHeader active="" />
      </div>
      <div style={{ position: 'relative', zIndex: 2, maxWidth: 1180, margin: '0 auto', padding: '18px 22px 70px' }}>
        <style dangerouslySetInnerHTML={{ __html: `
          .mm-reset{display:inline-flex;align-items:center;gap:6px;border:1px solid ${C.line};background:var(--white);color:${C.ink};font-family:${FONT};font-weight:700;font-size:13.5px;padding:8px 14px;border-radius:10px;cursor:pointer;}
          .mm-reset:hover{border-color:${C.accent};color:${C.accent};}
          .mm-textbtn{border:none;background:transparent;color:${C.muted};font-family:${FONT};font-weight:700;font-size:13.5px;padding:8px 6px;border-radius:8px;cursor:pointer;}
          .mm-textbtn:hover{color:${C.accent};}
          .mm-size{display:inline-flex;align-items:center;gap:8px;margin-left:auto;}
          .mm-size span{font-size:12.5px;font-weight:700;color:${C.soft};text-transform:uppercase;letter-spacing:.04em;}
          .mm-size input[type=range]{width:118px;accent-color:${C.accent};cursor:pointer;}
          .mm-setup{background:var(--white);border:1px solid ${C.line};border-radius:16px;padding:26px 22px;max-width:420px;margin:8px auto 0;text-align:center;}
          .mm-setup-q{font-size:16px;font-weight:700;color:${C.ink};margin:0 0 16px;}
          .mm-pnums{display:flex;gap:10px;justify-content:center;margin:0 0 20px;}
          .mm-pnums button{width:54px;height:54px;border:1.5px solid ${C.line};background:var(--white);border-radius:12px;font-family:${FONT};font-size:20px;font-weight:800;color:${C.ink};cursor:pointer;}
          .mm-pnums button.on{background:${C.accent};border-color:${C.accent};color:var(--white);}
          .mm-start{border:none;background:${C.accent};color:var(--white);font-family:${FONT};font-weight:800;font-size:16px;padding:12px 34px;border-radius:12px;cursor:pointer;}
          .mm-start:hover{background:var(--accent);}
          .mm-scores{display:flex;gap:10px;margin:0 0 16px;flex-wrap:wrap;}
          .mm-pl{flex:1 1 120px;background:var(--white);border:2px solid transparent;border-radius:12px;padding:9px 13px;}
          .mm-pl.on{border-color:${C.accent};background:#eef3fe;}
          .mm-pl .l{font-size:12px;font-weight:700;color:${C.soft};margin:0;text-transform:uppercase;letter-spacing:.05em;}
          .mm-pl.on .l{color:${C.accent};}
          .mm-pl .v{font-size:22px;font-weight:800;margin:2px 0 0;color:${C.ink};}
          .mm-board-wrap{position:relative;margin:0 auto;}
          .mm-board{display:grid;justify-content:center;}
          .mm-card{position:relative;aspect-ratio:1;border:none;background:transparent;padding:0;cursor:pointer;perspective:700px;}
          .mm-inner{position:absolute;inset:0;transition:transform .35s;transform-style:preserve-3d;}
          .mm-card.flip .mm-inner,.mm-card.done .mm-inner{transform:rotateY(180deg);}
          .mm-face{position:absolute;inset:0;display:flex;align-items:center;justify-content:center;border-radius:14px;backface-visibility:hidden;-webkit-backface-visibility:hidden;box-shadow:0 1px 3px rgba(20,22,28,0.08);}
          .mm-front{background:${C.accent};}
          .mm-back{background:var(--white);border:2px solid ${C.line};transform:rotateY(180deg);}
          .mm-card.done .mm-back{border-color:#1d9e75;background:#e7f6ef;}
          .mm-card.done{cursor:default;}
          .mm-back svg{width:80%;height:80%;}
          .mm-win{position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;background:rgba(231,246,239,.96);border-radius:16px;padding:1rem;}
          .mm-win h3{font-size:21px;font-weight:800;margin:8px 0 4px;color:#04342c;}
          .mm-win p{font-size:14px;color:#0f6e56;margin:0 0 16px;font-weight:600;}
          .mm-win-row{display:flex;gap:10px;}
          .mm-views{display:flex;align-items:center;justify-content:center;gap:6px;font-size:13px;color:${C.soft};font-weight:600;margin:20px 0 0;}
        ` }} />

        <Link href="/kids" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 13, fontWeight: 700, color: C.muted, textDecoration: 'none', marginBottom: 12 }}>
          <span style={{ fontSize: 16, lineHeight: 1 }}>&#8592;</span> {backLabel}
        </Link>

        <h1 style={{ fontSize: 28, fontWeight: 800, letterSpacing: '-0.02em', margin: '0 0 4px' }}>{title}</h1>
        <p style={{ fontSize: 15.5, color: C.muted, margin: '0 0 18px', lineHeight: 1.5, maxWidth: 560 }}>
          {intro}
        </p>

        {phase === 'select' ? (
          <div className="mm-setup">
            <p className="mm-setup-q">How many players?</p>
            <div className="mm-pnums">
              {[1, 2, 3, 4].map((n) => (
                <button key={n} className={numPlayers === n ? 'on' : ''} onClick={() => setNumPlayers(n)}>{n}</button>
              ))}
            </div>
            <button className="mm-start" onClick={start}>Start</button>
          </div>
        ) : (
          <>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', margin: '0 0 16px' }}>
              <button className="mm-reset" onClick={start}><Refresh /> New game</button>
              <button className="mm-textbtn" onClick={toSelect}>Change players</button>
              <label className="mm-size">
                <span>Size</span>
                <input type="range" min="40" max="150" step="4" value={sizePx} onChange={(e) => setSize(Number(e.target.value))} aria-label="Card size" />
              </label>
            </div>

            {numPlayers > 1 && (
              <div className="mm-scores">
                {Object.keys(scores).map((k) => (
                  <div key={k} className={`mm-pl${String(cur) === k ? ' on' : ''}`}><p className="l">Player {k}</p><p className="v">{scores[k]}</p></div>
                ))}
              </div>
            )}

            <div className="mm-board-wrap">
              <div className="mm-board" style={{ gridTemplateColumns: `repeat(${colsNow}, ${sizePx}px)`, gap: `${gap}px` }}>
                {deck.map((c, i) => {
                  const up = flipped.includes(i) || done.includes(i);
                  const isDone = done.includes(i);
                  return (
                    <button key={c.key} className={`mm-card${up ? ' flip' : ''}${isDone ? ' done' : ''}`} onClick={() => onCard(i)} aria-label={up ? c.name : 'Hidden card'}>
                      <span className="mm-inner">
                        <span className="mm-face mm-front"><Star /></span>
                        <span className="mm-face mm-back" dangerouslySetInnerHTML={{ __html: c.face }} />
                      </span>
                    </button>
                  );
                })}
              </div>
              {won && (
                <div className="mm-win">
                  <Trophy />
                  <h3>{winTitle}</h3>
                  <p>{winSub}</p>
                  <div className="mm-win-row">
                    <button className="mm-reset" onClick={start}><Refresh /> Play again</button>
                    <button className="mm-textbtn" onClick={toSelect}>Change players</button>
                  </div>
                </div>
              )}
            </div>
          </>
        )}

        <div className="mm-views"><Eye /> {views == null ? '—' : formatCount(views)} views</div>
      </div>
      <Footer />
    </div>
  );
}
