'use client';

// THE ROLLING RUN ENDING, PHONES ONLY (owner, 2026-10-28: "similar ends for
// the runs, but keeping animation and idea ... emphasis of play next and
// challenge"). The run's own ending (GauntletEndStage) still plays its sweep and
// the score counting up the title ladder. When the count lands, that whole hero
// rolls up into ONE full-width bar ("74 right · Know-It-All · #39 of 214"), and
// the page below it is the two things a finished player can do next:
//
//   1. PLAY NEXT: one quick play next, the other runs still open, All Daily
//      Puzzles.
//   2. CHALLENGE: the challenge button, the Polymath meter, the full GIF and
//      Share Your Score, in the dark tray.
//
// Everything else the old one-page ending carried (the climb, the rank, the
// prize, today's board, the leg-by-leg table) lives in the bar's dropdown.
// The header is the house logo home, Practice and Share. Desktop keeps the
// two-column ending untouched. Any tap on the hero skips to the rolled view;
// reduced motion lands there directly.

import React, { useEffect, useLayoutEffect, useRef, useState } from 'react';

const useIso = typeof window === 'undefined' ? useEffect : useLayoutEffect;
const HOLD_MS = 1100;   // the landed climb holds this long before it rolls up
const LEAVE_MS = 420;   // the roll-up itself

export default function RunRoll({
  anim, landed, shown, unitWord, eyebrow, rank = null, fieldSize = null, titleName = null,
  climbHero = null, climbDone = null, prize = null, topNote = null, board = null, afterBoard = null,
  stats = null, extra = null, challenge = null, polymath = null, meme = null,
  onShare = null, copied = false, onPractice = null, similar = null, more = null, dark = false,
}) {
  const [rolled, setRolled] = useState(!anim);
  const [leaving, setLeaving] = useState(false);
  const [open, setOpen] = useState(false);
  // The other runs show two at a time, so Challenge stays near the top.
  const moreRef = useRef(null);
  const [moreN, setMoreN] = useState(0);
  const [allRuns, setAllRuns] = useState(false);
  // The hero rolls up and shrinks into the bar's spot, then the bar takes it.
  const roll = () => { if (!leaving && !rolled) setLeaving(true); };
  useEffect(() => {
    if (!leaving) return undefined;
    const t = setTimeout(() => setRolled(true), LEAVE_MS);
    return () => clearTimeout(t);
  }, [leaving]);
  useEffect(() => {
    if (rolled || leaving || !landed) return undefined;
    const t = setTimeout(roll, HOLD_MS);
    return () => clearTimeout(t);
  }, [landed, rolled, leaving]);   // eslint-disable-line react-hooks/exhaustive-deps

  // ── THE BAR'S TEXT, fitted to its width ────────────────────────────────
  const head = `${shown} ${unitWord}`;
  const rk = rank ? `#${rank}${fieldSize ? ` of ${Number(fieldSize).toLocaleString()}` : ''}` : null;
  const variants = [
    [head, titleName, rk].filter(Boolean).join(' · '),
    [head, rk].filter(Boolean).join(' · '),
    head,
  ].filter((v, i, a) => a.indexOf(v) === i);
  const [barText, setBarText] = useState(variants[0]);
  const [barFs, setBarFs] = useState(20);
  const barRef = useRef(null);
  const measRef = useRef(null);
  const vKey = variants.join('|');
  const fit = () => {
    const box = barRef.current;
    const m = measRef.current;
    if (!box || !m || !box.clientWidth) return;
    const room = box.clientWidth;
    for (let i = 0; i < variants.length; i += 1) {
      m.textContent = variants[i];
      let s = 24;
      m.style.fontSize = `${s}px`;
      while (s > 13 && m.offsetWidth > room) { s -= 0.5; m.style.fontSize = `${s}px`; }
      if (s >= 16 || i === variants.length - 1) { setBarText(variants[i]); setBarFs(s); return; }
    }
  };
  useIso(() => { if (rolled) fit(); }, [vKey, rolled]);   // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (!rolled) return undefined;
    const re = () => fit();
    window.addEventListener('resize', re);
    try { document.fonts && document.fonts.ready.then(re); } catch (e) { /* older browsers */ }
    return () => window.removeEventListener('resize', re);
  }, [vKey, rolled]);   // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const el = moreRef.current;
    if (!el) return undefined;
    const count = () => { const rows = el.querySelector('.mr-rows'); setMoreN(rows ? rows.children.length : 0); };
    count();
    const mo = typeof MutationObserver !== 'undefined' ? new MutationObserver(count) : null;
    if (mo) mo.observe(el, { childList: true, subtree: true });
    return () => { if (mo) mo.disconnect(); };
  }, [rolled]);

  return (
    <div className={'rrl' + (rolled ? ' in' : '') + (dark ? ' dk' : '') + (anim ? ' sw' : '')}>
      <style dangerouslySetInnerHTML={{ __html: CSS }} />
      <div className="rrl-top">
        <a className="rrl-tb rrl-home" href="/" aria-label="All Puzzles">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M15 18l-6-6 6-6" /></svg>
          <svg width="18" height="17" viewBox="0 4 120 112" aria-hidden="true"><path d="M60 10L113 43V109H93V63L60 86L27 63V109H7V43Z" fill="var(--gsx-bg)" stroke="currentColor" strokeWidth="9" strokeLinejoin="round" /></svg>
          <span>Mind Loft</span>
        </a>
        <span className="rrl-tr">
          {onPractice ? (
            <button type="button" className="rrl-tb" onClick={onPractice}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M3 12a9 9 0 1 0 3-6.7" /><path d="M3 4v5h5" /></svg>
              Practice
            </button>
          ) : null}
          {onShare ? (
            <button type="button" className="rrl-tb" onClick={onShare}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M12 3v12" /><path d="M7 8l5-5 5 5" /><path d="M5 13v7h14v-7" /></svg>
              {copied ? 'Copied' : 'Share'}
            </button>
          ) : null}
        </span>
      </div>

      {!rolled ? (
        <button type="button" className={'rrl-hero' + (leaving ? ' gone' : '')} onClick={roll} aria-label="Continue">
          <span className="gsx-eye gsx-c">{eyebrow}</span>
          <span className="gsx-score"><span>{shown}</span><i>{unitWord}</i></span>
          {prize ? <span className={'gsx-prize' + (landed ? ' in' : '')}>{prize}</span> : null}
          {climbHero}
        </button>
      ) : (
        <>
          <button type="button" className={'rrl-bar' + (open ? ' open' : '')} onClick={() => setOpen((o) => !o)}
            aria-expanded={open} aria-label={`${barText}. Show the climb, the board and the stats`}>
            <span className="tx">
              <b ref={barRef} style={{ fontSize: barFs }}>{barText}</b>
              <span ref={measRef} className="rrl-meas" aria-hidden="true" />
            </span>
            <span className="ch" aria-hidden="true"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round"><path d="M6 9l6 6 6-6" /></svg></span>
          </button>

          {open ? (
            <div className="rrl-dd">
              {topNote ? <div className="gsx-note">{topNote}</div> : null}
              {prize ? <div className="gsx-prize in">{prize}</div> : null}
              {climbDone}
              {board}
              {afterBoard}
              {stats}
            </div>
          ) : null}

          <section className="rrl-card rrl-r1" aria-label="Play next">
            <div className="rrl-k">Play next</div>
            {similar && similar.href ? (
              <a className="rrl-next" href={similar.href}>
                <span><i>One quick play next</i><b>{similar.name}</b></span>
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6" /></svg>
              </a>
            ) : null}
            {more ? <div ref={moreRef} className={'rrl-more' + (allRuns ? '' : ' cap')}>{more}</div> : null}
            {more && !allRuns && moreN > 2 ? (
              <button type="button" className="rrl-show" onClick={() => setAllRuns(true)}>Show {moreN - 2} more {moreN - 2 === 1 ? 'run' : 'runs'}</button>
            ) : null}
            <a className="rrl-all" href="/">See all Daily Puzzles</a>
          </section>

          <section className="gsx-tray rrl-r2" aria-label="Challenge">
            {extra}
            {challenge}
            {polymath ? <div className="gsx-poly">{polymath}</div> : null}
            {meme ? <div className="gsx-meme">{meme}</div> : null}
            {onShare ? <button type="button" className="rrl-share" onClick={onShare}>{copied ? 'Copied' : 'Share Your Score'}</button> : null}
          </section>
        </>
      )}
    </div>
  );
}

const CSS = `
.gsx-roll .gsx-col{gap:12px;padding:12px 14px 26px}
.rrl{display:flex;flex-direction:column;gap:12px;--rrl-card:var(--gsx-card)}
/* NOTHING SHOWS UNDER THE SWEEP (owner, 2026-10-28): the page waits until the
   colour bands have crossed, the way the desktop ending's rises do. */
.rrl.sw{animation:rrlUnder .45s ease-out 1.35s both}
@keyframes rrlUnder{from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:none}}
.rrl-top{display:flex;align-items:center;justify-content:space-between;gap:8px;min-height:40px}
.rrl-tr{display:flex;gap:0;flex:none}
.rrl-tb{display:inline-flex;align-items:center;gap:5px;min-height:40px;padding:0 8px;white-space:nowrap;border:0;border-radius:999px;background:transparent;color:var(--gsx-ink);font:inherit;font-size:14px;font-weight:800;text-decoration:none;cursor:pointer}
.rrl-tb:active{background:color-mix(in srgb, var(--gsx-ink) 10%, transparent)}
.rrl-home{padding-left:2px;min-width:0;overflow:hidden}
@media(max-width:359px){.rrl-home span{display:none}}
.rrl-hero{display:flex;flex-direction:column;align-items:stretch;gap:12px;width:100%;padding:6px 0 0;border:0;border-radius:0;background:transparent;color:var(--gsx-ink);font:inherit;text-align:left;cursor:pointer}
.rrl-hero .gsx-score{align-items:center}
.rrl-hero{transform-origin:50% 0;transition:transform .42s cubic-bezier(.5,0,.75,0),opacity .42s ease-in}
.rrl-hero.gone{transform:translateY(-64px) scale(.88);opacity:0}
.rrl-bar{display:flex;align-items:center;gap:4px;width:100%;height:54px;padding:0 10px 0 16px;border:0;border-radius:16px;background:var(--rrl-card);color:var(--gsx-ink);font:inherit;cursor:pointer;text-align:left;animation:rrlTake .6s cubic-bezier(.2,.9,.25,1.2) both}
.rrl-bar .tx{flex:1;min-width:0;position:relative}
.rrl-bar b{display:block;width:100%;font-size:20px;font-weight:800;letter-spacing:-.015em;line-height:1.15;padding:.08em 0 .2em;margin:-.08em 0 -.2em;white-space:nowrap;overflow:hidden;font-variant-numeric:tabular-nums}
.rrl-meas{position:absolute;left:0;top:0;visibility:hidden;white-space:nowrap;font-weight:800;letter-spacing:-.015em;font-variant-numeric:tabular-nums;pointer-events:none}
.rrl-bar .ch{flex:none;width:26px;height:26px;display:flex;align-items:center;justify-content:center;opacity:.65;transition:transform .35s cubic-bezier(.2,.8,.2,1)}
.rrl-bar.open .ch{transform:rotate(180deg);opacity:1}
.rrl-bar:focus-visible{outline:2px solid var(--gsx-ink);outline-offset:2px}
.rrl-dd{display:flex;flex-direction:column;gap:12px;padding:12px;border-radius:16px;background:var(--rrl-card);animation:rrlDrop .35s ease-out both}
.rrl-dd .gsx-climb{margin:0}
.rrl-dd .gsx-rise{animation:none}
.rrl-stats{display:flex;flex-direction:column;gap:10px}
.rrl-card{display:flex;flex-direction:column;gap:10px;padding:14px;border-radius:16px;background:var(--rrl-card)}
.rrl-k{font-size:11.5px;font-weight:800;letter-spacing:.08em;text-transform:uppercase;opacity:.8}
.gsx .rrl-next{display:flex;align-items:center;gap:14px;padding:14px 16px;border-radius:14px;background:var(--gsx-ink);color:var(--gsx-bg);text-decoration:none}
.rrl-next>span{flex:1;display:flex;flex-direction:column;gap:2px;min-width:0}
.rrl-next i{font-style:normal;font-size:12px;font-weight:800;letter-spacing:.05em;text-transform:uppercase;opacity:.8}
.rrl-next b{font-size:19px;font-weight:800}
.rrl-more .mr{margin:0}
.rrl-more.cap .mr-rows>:nth-child(n+3){display:none}
.rrl-show{align-self:center;min-height:36px;padding:0 12px;border:0;border-radius:999px;background:transparent;color:var(--gsx-ink);font:inherit;font-size:14px;font-weight:800;cursor:pointer}
.rrl-show:active{background:color-mix(in srgb, var(--gsx-ink) 10%, transparent)}
.gsx .rrl-all{display:flex;align-items:center;justify-content:center;min-height:48px;border-radius:14px;background:color-mix(in srgb, var(--gsx-ink) 8%, transparent);font-size:15px;font-weight:800;text-decoration:none}
.rrl-share{display:flex;align-items:center;justify-content:center;min-height:50px;border:0;border-radius:14px;background:#e9edf4;color:#08222e;font:inherit;font-size:15px;font-weight:800;cursor:pointer}
.rrl-r1,.rrl-r2{animation:rrlRise .5s ease-out both}
.rrl-r1{animation-delay:.25s}
.rrl-r2{animation-delay:.4s}
@keyframes rrlTake{0%{transform:translateY(46px) scale(.9);opacity:0}55%{transform:translateY(-3px) scale(1.02);opacity:1}100%{transform:none}}
@keyframes rrlRise{from{transform:translateY(18px);opacity:0}to{transform:none;opacity:1}}
@keyframes rrlDrop{from{transform:translateY(-8px);opacity:0}to{transform:none;opacity:1}}
@media (prefers-reduced-motion: reduce){.rrl.sw,.rrl-bar,.rrl-r1,.rrl-r2,.rrl-dd{animation:none}}
`;
