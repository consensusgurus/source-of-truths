'use client';

// THE SCANNER, Price Check's ending (owner-approved mockup, 2026-10-17).
//
// A CURTAIN over the finished run, in the pattern of the Trivia Gauntlet's
// Broadcast (app/circuits/GauntletFinale.jsx). Each of the five games takes
// the whole screen in its own tag colour: a laser sweeps top to bottom, the
// real price rolls up on an odometer, the player's FIRST guess and its heat
// band stamp in, then the points. A price-tag strip along the bottom fills one
// tag per game. Then the colour drains to the midnight ground, the total climbs
// the five payment cards, the earned card lands with a sheen, and the curtain
// unmounts onto the run's existing settled card.
//
// It posts nothing and stores nothing. Every figure is one the Finale already
// holds: the item and its price from the shipped day, the first guess and the
// score from the counted results, the ladder from ranksFor(). A guess that is
// not on record simply drops its line.
//
// Rules it keeps: any tap or key skips to the card; the Finale never mounts it
// under prefers-reduced-motion or for a run finished on an earlier load; the
// paint sits on the fixed root element; nothing that counts resizes its box.

import React, { useEffect, useRef, useState } from 'react';
import { PRICE_GAMES, fmtCents, errOf, bandOf, runTierOf } from '@/lib/price-games';

const SANS = "'Manrope', system-ui, -apple-system, sans-serif";
const INK = '#0b0f1a';
const GROUND = '#0b0f1a';

// Phase timings, from the mockup (ms).
const P0 = 300;        // lights down
const PD = 1500;       // one game owns the screen
const SCAN = 700;      // the laser's sweep
const ROLL = 850;      // the odometer rolls to the price
const GUESS_AT = 850;  // the first guess and its heat stamp in
const PTS_AT = 1050;   // then the points
const TAG_AT = 1000;   // that game's tag fills
const CNT = 1700;      // the drain and the climb up the cards
const CLIMB = 1500;    // the total counts over this much of it
const GAP = 300;       // before the card lands
const HOLD = 2600;     // the landed card, before the settled card

const ease = (x) => { const v = Math.max(0, Math.min(1, x)); return 1 - Math.pow(1 - v, 3); };
const fmtClock = (s) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;

// The price on an odometer: every digit is a strip that rolls to its place.
// The box is the final string, character for character, so it never resizes.
function Odometer({ text }) {
  const chars = String(text).split('');
  let di = 0;
  const nDig = chars.filter((c) => /\d/.test(c)).length;
  return (
    <span className="ps-odo" aria-label={text}>
      {chars.map((c, i) => {
        if (!/\d/.test(c)) return <span key={i} className="ps-oc" aria-hidden="true">{c}</span>;
        const d = Number(c);
        const k = di++;
        // the rightmost digits spin furthest, like a real counter
        const laps = k >= nDig - 2 ? 2 : 1;
        const to = laps * 10 + d;
        return (
          <span key={i} className="ps-od" aria-hidden="true">
            <i style={{ '--to': `-${to}em`, animationDuration: `${ROLL}ms` }}>
              {Array.from({ length: 30 }, (_, j) => <b key={j}>{j % 10}</b>)}
            </i>
          </span>
        );
      })}
    </span>
  );
}

// The total, counting, and the five cards it climbs. Its own frame loop so a
// tick re-renders this and nothing else.
function Climb({ total, max, ranks, cardCol }) {
  const [v, setV] = useState(0);
  useEffect(() => {
    const t0 = performance.now();
    let raf = 0;
    const tick = (t) => {
      const p = Math.min(1, (t - t0) / CLIMB);
      setV(Math.round(total * ease(p)));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [total]);
  const at = runTierOf(Math.round(v * 50 / Math.max(1, max)), ranks);
  const order = ranks.map((_, i) => ranks.length - 1 - i); // Prepaid first, Black last
  const w = `${String(max).length}ch`;
  return (
    <div className="ps-count">
      <div className="ps-q">Which card are you paying with?</div>
      <div className="ps-tot"><span className="ps-totn" style={{ width: w }}>{v}</span><small> / {max}</small></div>
      <div className="ps-cards">
        {order.map((ti) => {
          const r = ranks[ti];
          const [bg, ink] = cardCol[ti] || ['#333', '#fff'];
          const reached = ti >= at;
          const cur = ti === at;
          return (
            <div key={ti} className="ps-cw">
              <div className={`ps-cd${cur ? ' cur' : reached ? ' got' : ''}`} style={{ background: bg, color: ink }}>
                <i className="ps-chip" />
                <span>{r[3]}</span>
              </div>
              <div className="ps-min">{Math.ceil(r[0] * max / 50)}+</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function PriceScanner({ sections, counted, total, max, ranks, dateShort, cardCol, renderCard, onDone }) {
  const N = sections.length;
  const RP = P0 + N * PD;
  const BOARD = RP + CNT + GAP;
  const END = BOARD + HOLD;
  // step: -1 lights down, 0..N-1 a game's paint, N the climb, N+1 the card
  const [step, setStep] = useState(-1);
  const doneRef = useRef(false);
  const finish = useRef(null);
  finish.current = () => { if (doneRef.current) return; doneRef.current = true; if (typeof onDone === 'function') onDone(); };

  useEffect(() => {
    const ts = [];
    for (let i = 0; i < N; i++) ts.push(setTimeout(() => setStep(i), P0 + i * PD));
    ts.push(setTimeout(() => setStep(N), RP));
    ts.push(setTimeout(() => setStep(N + 1), BOARD));
    ts.push(setTimeout(() => finish.current(), END));
    const go = () => finish.current();
    window.addEventListener('keydown', go);
    let prev = '';
    try { prev = document.documentElement.style.overflow; document.documentElement.style.overflow = 'hidden'; } catch (e) {}
    return () => {
      ts.forEach(clearTimeout);
      window.removeEventListener('keydown', go);
      try { document.documentElement.style.overflow = prev; } catch (e) {}
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const paint = step >= 0 && step < N;
  const sec = paint ? sections[step] : null;
  const col = (key) => (PRICE_GAMES[key] && PRICE_GAMES[key].tagDark) || '#7dd3fc';
  const bg = paint ? col(sec.key) : GROUND;
  const ink = paint ? INK : '#e9edf4';

  let gameBody = null;
  if (sec) {
    const D = sec.day || {};
    const c = counted[step];
    const price = D.price;
    const first = c && typeof c.first === 'number' && c.first > 0 ? c.first : null;
    const band = first && price ? bandOf(errOf(first, price)) : null;
    const item = D.name || D.revealName || '';
    const ptxt = price ? fmtCents(price) : '';
    gameBody = (
      <div key={`g${step}`} className="ps-game">
        <div className="ps-scan" style={{ animationDuration: `${SCAN}ms` }} />
        <div className="ps-k">{String(step + 1).padStart(2, '0')} · {sec.name} · {sec.word}</div>
        {item ? <div className="ps-item">{item}</div> : null}
        {ptxt ? <div className="ps-price" style={{ fontSize: `min(132px, calc((100vw - 48px) / ${(ptxt.length * 0.62).toFixed(2)}))` }}><Odometer text={ptxt} /></div> : null}
        <div className="ps-row">
          {first ? <div className="ps-guess" style={{ animationDelay: `${GUESS_AT}ms` }}>Your first guess <b>{fmtCents(first)}</b></div> : null}
          {band ? <div className="ps-heat" style={{ animationDelay: `${GUESS_AT}ms` }}>{band.label}</div> : null}
          <div className="ps-pts" style={{ animationDelay: `${PTS_AT}ms` }}>+{c ? c.score : 0}</div>
        </div>
      </div>
    );
  }

  const fti = runTierOf(Math.round(total * 50 / Math.max(1, max)), ranks);
  const t = ranks[fti];
  const secs = counted.reduce((a, x) => a + (x && x.secs ? x.secs : 0), 0);
  const short = fti > 0 ? Math.max(1, Math.ceil(ranks[fti - 1][0] * max / 50) - total) : 0;

  return (
    <div className={`ps${paint ? ' on' : ''}`} style={{ background: bg, color: ink }} onClick={() => finish.current()} role="presentation">
      <style dangerouslySetInnerHTML={{ __html: CSS }} />
      <div className="ps-cap">
        <span>Price Check</span><span>{dateShort}</span>
        <span className="ps-capr">{paint ? `Item ${step + 1} of ${N}` : step > N ? 'Final' : ''}</span>
      </div>
      <div className="ps-body">
        {gameBody}
        {step === N && <Climb total={total} max={max} ranks={ranks} cardCol={cardCol} />}
        {step > N && (
          <div className="ps-land">
            <div className="ps-lcard">
              {renderCard(fti)}
              <div className="ps-sheen" />
            </div>
            <div className="ps-lt">
              <div className="ps-paid">You paid with</div>
              <div className="ps-nm">{t[1]}</div>
              <div className="ps-sub">{total} / {max}{secs ? ` · ${fmtClock(secs)}` : ''}</div>
              <div className="ps-ln">{t[2]}{short ? <> <b>{short} {short === 1 ? 'point' : 'points'} short of {ranks[fti - 1][3]}.</b></> : null}</div>
            </div>
          </div>
        )}
      </div>
      <div className="ps-tags">
        {sections.map((s, i) => {
          const done = step > i;
          const now = step === i;
          const c = counted[i];
          return (
            <div key={s.key} className={`ps-tag${done ? ' full' : now ? ' now' : ''}`} style={{ '--c': col(s.key), animationDelay: now ? `${TAG_AT}ms` : undefined }}>
              <span>{s.name}</span><b>{c ? c.score : 0}</b>
            </div>
          );
        })}
      </div>
      <div className="ps-skip">Tap anywhere to skip</div>
    </div>
  );
}

const CSS = `
.ps{position:fixed;inset:0;z-index:4000;display:flex;flex-direction:column;font-family:${SANS};overflow:hidden;transition:background .28s ease,color .28s ease;cursor:pointer;user-select:none;-webkit-user-select:none}
.ps *{box-sizing:border-box}
.ps-cap{display:flex;align-items:center;gap:12px;padding:18px 28px 0;font-size:11px;font-weight:800;letter-spacing:.16em;text-transform:uppercase;opacity:.78}
.ps-capr{margin-left:auto}
.ps-body{position:relative;flex:1 1 auto;display:flex;flex-direction:column;min-height:0}
.ps-game{flex:1 1 auto;display:flex;flex-direction:column;justify-content:center;padding:0 64px;gap:10px;max-width:1100px;width:100%;margin:0 auto}
.ps-scan{position:fixed;left:0;right:0;top:0;height:3px;background:${INK};box-shadow:0 0 14px 4px rgba(255,255,255,.75),0 0 2px 1px #fff;animation:psscan linear both;pointer-events:none}
@keyframes psscan{from{top:0}to{top:100%;opacity:.0}}
.ps-k{font-size:13px;font-weight:800;letter-spacing:.18em;text-transform:uppercase}
.ps-item{font-size:26px;font-weight:700;line-height:1.25;max-width:640px}
.ps-price{font-weight:800;line-height:1;letter-spacing:-.03em;font-variant-numeric:tabular-nums}
.ps-odo{display:inline-flex;height:1em;overflow:hidden;line-height:1}
.ps-oc{display:inline-block;height:1em}
.ps-od{display:inline-block;height:1em;overflow:hidden}
.ps-od i{display:flex;flex-direction:column;font-style:normal;animation-name:psroll;animation-timing-function:cubic-bezier(.2,.7,.2,1);animation-fill-mode:both}
.ps-od b{display:block;height:1em;font-weight:800}
@keyframes psroll{from{transform:translateY(0)}to{transform:translateY(var(--to))}}
.ps-row{display:flex;flex-wrap:wrap;align-items:center;gap:14px;min-height:52px}
.ps-guess{font-size:18px;font-weight:700;animation:pspop .4s cubic-bezier(.2,.8,.2,1) both}
.ps-guess b{font-weight:800;font-variant-numeric:tabular-nums}
.ps-heat{padding:6px 14px;border:3px solid ${INK};border-radius:8px;font-size:18px;font-weight:800;letter-spacing:.1em;text-transform:uppercase;animation:psslam .42s cubic-bezier(.2,.9,.2,1) both}
.ps-pts{margin-left:auto;font-size:44px;font-weight:800;font-variant-numeric:tabular-nums;animation:pspop .4s cubic-bezier(.2,.8,.2,1) both}
@keyframes pspop{from{opacity:0;transform:translateY(14px) scale(.96)}to{opacity:1;transform:none}}
@keyframes psslam{0%{opacity:0;transform:scale(1.8) rotate(-8deg)}60%{opacity:1;transform:scale(.94) rotate(-3deg)}100%{opacity:1;transform:rotate(-3deg)}}
.ps-count{flex:1 1 auto;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:26px;padding:0 16px}
.ps-q{font-size:13px;font-weight:800;letter-spacing:.18em;text-transform:uppercase;color:#9aa8c4;text-align:center}
.ps-tot{font-size:120px;font-weight:800;line-height:1;font-variant-numeric:tabular-nums;display:flex;align-items:baseline}
.ps-totn{display:inline-block;text-align:right}
.ps-tot small{font-size:40px;color:#9aa8c4;margin-left:.2em}
.ps-cards{display:flex;gap:14px;align-items:flex-end}
.ps-cw{display:flex;flex-direction:column;align-items:center;gap:8px}
.ps-cd{position:relative;width:120px;height:76px;border-radius:9px;padding:9px 11px;font-size:11px;font-weight:800;letter-spacing:.08em;text-transform:uppercase;overflow:hidden;opacity:.28;transition:all .3s ease}
.ps-cd span{position:absolute;left:11px;bottom:8px}
.ps-cd.got{opacity:1;transform:translateY(-4px)}
.ps-cd.cur{opacity:1;transform:translateY(-16px) scale(1.12);box-shadow:0 0 0 3px #7dd3fc,0 14px 36px rgba(125,211,252,.4)}
.ps-chip{display:block;width:20px;height:14px;border-radius:3px;background:rgba(233,207,127,.85)}
.ps-min{font-size:11px;font-weight:700;color:#9aa8c4;font-variant-numeric:tabular-nums}
.ps-land{flex:1 1 auto;display:flex;align-items:center;justify-content:center;gap:28px;padding:0 32px}
.ps-lcard{position:relative;width:240px;flex:none;container-type:inline-size;overflow:hidden;border-radius:12px;animation:psland .8s cubic-bezier(.2,.9,.25,1) both}
@keyframes psland{0%{opacity:0;transform:translateY(80px) rotate(-10deg) scale(.7)}70%{opacity:1;transform:translateY(-6px) rotate(1deg) scale(1.02)}100%{opacity:1;transform:none}}
.ps-sheen{position:absolute;top:0;bottom:0;left:0;width:40%;background:linear-gradient(90deg,transparent,rgba(255,255,255,.55),transparent);animation:pssheen 2.4s ease-in-out infinite;pointer-events:none;z-index:4}
@keyframes pssheen{from{transform:translateX(-120%) skewX(-18deg)}to{transform:translateX(260%) skewX(-18deg)}}
.ps-lt{min-width:0;max-width:420px;animation:pspop .4s .3s cubic-bezier(.2,.8,.2,1) both}
.ps-paid{font-size:11px;font-weight:800;letter-spacing:.16em;text-transform:uppercase;color:#7dd3fc}
.ps-nm{font-size:30px;font-weight:800;line-height:1.1}
.ps-sub{font-size:15px;font-weight:700;color:#9aa8c4;margin-top:4px;font-variant-numeric:tabular-nums}
.ps-ln{font-size:14px;font-weight:700;color:#c9d3e6;margin-top:12px;line-height:1.45;animation:pspop .4s .5s cubic-bezier(.2,.8,.2,1) both}
.ps-ln b{color:#e9b532}
.ps-tags{display:flex;gap:8px;padding:14px 28px 10px}
.ps-tag{position:relative;flex:1 1 0;min-width:0;height:40px;border-radius:6px 18px 18px 6px;display:flex;align-items:center;justify-content:space-between;padding:0 14px 0 12px;font-size:12px;font-weight:800;letter-spacing:.08em;text-transform:uppercase;background:rgba(255,255,255,.05);color:#9aa8c4;border:1px dashed rgba(255,255,255,.18);transition:background .3s ease,color .3s ease,border-color .3s ease}
.ps-tag span{overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.ps-tag b{font-size:18px;font-weight:800;font-variant-numeric:tabular-nums;opacity:0;flex:none;width:2ch;text-align:right}
.ps.on .ps-tag{background:rgba(11,15,26,.1);color:rgba(11,15,26,.55);border-color:rgba(11,15,26,.3)}
.ps .ps-tag.full,.ps.on .ps-tag.full{background:var(--c);color:${INK};border:1px solid rgba(11,15,26,.35)}
.ps-tag.full b{opacity:1}
.ps-tag.now{animation:pstag .3s ease both}
.ps-tag.now b{animation:psb .3s ease both;animation-delay:inherit}
@keyframes pstag{to{background:var(--c);color:${INK};border:1px solid rgba(11,15,26,.35)}}
@keyframes psb{to{opacity:1}}
.ps-skip{text-align:center;font-size:11px;font-weight:700;letter-spacing:.06em;opacity:.55;padding:0 0 14px}
@media(max-width:640px){
.ps-cap{padding:16px 18px 0;font-size:10px;gap:10px}
.ps-game{padding:0 22px;gap:12px}
.ps-k{font-size:12px;letter-spacing:.16em}
.ps-item{font-size:21px}
.ps-row{gap:10px 12px;min-height:104px;align-content:flex-start}
.ps-guess{flex:0 0 100%}
.ps-guess{font-size:16px}
.ps-heat{font-size:16px;padding:5px 12px}
.ps-pts{font-size:40px}
.ps-tot{font-size:92px}
.ps-tot small{font-size:30px}
.ps-cards{flex-direction:column-reverse;gap:8px;align-items:center}
.ps-cw{flex-direction:row;gap:12px}
.ps-cd{width:150px;height:42px;padding:0 12px;display:flex;align-items:center;gap:10px;font-size:12px}
.ps-cd span{position:static}
.ps-cd .ps-chip{width:18px;height:13px}
.ps-cd.cur{transform:scale(1.08)}
.ps-cd.got{transform:none}
.ps-min{width:34px}
.ps-land{flex-direction:column;align-items:stretch;justify-content:center;gap:16px;padding:0 18px}
.ps-lcard{width:170px;align-self:center}
.ps-nm{font-size:25px}
.ps-sub{font-size:13px}
.ps-tags{gap:5px;padding:12px 14px 8px}
.ps-tag{height:44px;border-radius:5px 14px 14px 5px;flex-direction:column;justify-content:center;padding:0 2px;font-size:9px;letter-spacing:.06em;gap:1px}
.ps-tag span{max-width:100%}
.ps-tag b{font-size:15px;width:auto;text-align:center;min-height:18px}
}
`;
