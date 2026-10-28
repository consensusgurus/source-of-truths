'use client';

// THE WORD STAGE (owner, 2026-10-24): Garble, Scram and Arcos play on the
// gauntlet stage on a PHONE. One full-screen pastel ground, one dark ink, the
// prompt big, the answer squares under it, Back / progress / Next, then a lit
// keyboard and one quiet line at the foot. Desktop never mounts it (the page
// keeps its own board), and nothing here keeps state or scores: the host game
// passes what to draw and handles every key exactly as its own board does.
//
// Mounted only while the game is in play; the moment it ends the host stops
// rendering it and the finish plays on the page's own board underneath.

import React, { useEffect, useState } from 'react';
import { RAMP_INK, softGround } from '@/lib/category-ramp';
import { useStageLook, stagePalette, useStageChrome } from './GauntletScreens';
import { nextMainLook } from '@/lib/stage-look';
import StageTopBar from './StageTopBar';
import StageFoot from './StageFoot';
import { useHostedStage } from './StageHost';

export const WORD_STAGE_BG = '#7dd3fc'; // the Word step of the pastel ramp

// SHOULD THE STAGE DRAW? Once named for phones only; from 2026-10-28 (owner:
// "move all of the full screen only designs like hinge to all views") it is
// true on every width of a stage page, and the stage itself decides how to sit
// (app/StageHost.jsx: fixed on a phone and in desktop full screen, in the page's
// column with the site navigation showing). A legacy non-stage page keeps the
// old phone-only rule. False on the server and the first paint, so the page
// renders as before and the stage comes in once the effect has run.
export function usePhoneStage() {
  const [on, setOn] = useState(false);
  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return undefined;
    const mq = window.matchMedia('(max-width: 899px)');
    const f = () => setOn(mq.matches || !!document.querySelector('.stage-page'));
    f();
    if (mq.addEventListener) mq.addEventListener('change', f); else mq.addListener(f);
    return () => { if (mq.removeEventListener) mq.removeEventListener('change', f); else mq.removeListener(f); };
  }, []);
  return on;
}

const ROWS = ['QWERTYUIOP', 'ASDFGHJKL', 'ZXCVBNM'];

// slots: array of groups; each group an array of { ch, mark, spine, cur, ghost }
// live(ch): null = every key is live; a number = how many are left (0 dims it)
export default function WordStage({
  bg = WORD_STAGE_BG, label = 'Puzzle', eyebrow, spine = null, clue = null,
  scramble = null, scrambleKind = 'text', slots = [], rowState = null, rowKey = 0, slotsKey = 0,
  note = null, action = null, nav = null, live = null, onKey, enter = false,
  foot = null, frac = null, giveUp = null,
}) {
  const [look, setLook] = useStageLook();
  // WHITE PAGE, COLOURED TILES (owner, 2026-10-25): the colour look keeps the
  // page white and puts the category colour on the squares and keys.
  const pal = stagePalette(bg, look);
  const host = useHostedStage(false);
  useStageChrome(host.chrome ? pal.bg : null);
  const n = slots.reduce((s, g) => s + g.length, 0) + Math.max(0, slots.length - 1);
  const sn = scramble ? scramble.replace(/ /g, '').length : 0;
  return host.render(
    <div className={'wst' + (host.inline ? ' inl' : '')} role={host.inline ? 'region' : 'dialog'} aria-label={label} style={{ '--wst-bg': pal.bg, '--wst-ink': pal.ink, '--wst-tile': pal.tile || 'color-mix(in srgb, ' + pal.ink + ' 8%, transparent)', '--wst-n': Math.max(n, 4), '--wst-sn': Math.max(sn, 5) }}>
      <style dangerouslySetInnerHTML={{ __html: CSS }} />
      <div className="wst-col">
        {host.inline ? null : <StageTopBar look={look} onFlip={() => setLook(nextMainLook(look))} ink={pal.ink} title={label} dot={bg} nav={host.nav} />}
        <div className="wst-top" key={rowKey}>
          {eyebrow ? <div className="wst-eb">{eyebrow}</div> : null}
          {spine}
          {clue ? <h2 className="wst-clue">{clue}</h2> : null}
          {scramble ? (
            scrambleKind === 'tiles' ? (
              <div className="wst-tiles" aria-label={`Scrambled: ${scramble}`}>
                {scramble.split('').map((ch, i) => <span key={i}>{ch}</span>)}
              </div>
            ) : (
              <div className="wst-scr" aria-label={`Scrambled: ${scramble}`}>{scramble}</div>
            )
          ) : null}
          <div key={slotsKey} className={'wst-slots' + (rowState ? ' ' + rowState : '')} aria-label="Your answer">
            {slots.map((grp, gi) => (
              <div className="wst-grp" key={gi}>
                {grp.map((s, j) => (
                  <span key={j} className={'wst-s' + (s.cur ? ' cur' : '') + (s.mark ? ' mk' : '') + (s.spine ? ' sp' : '') + (s.ghost ? ' gh' : '')}>{s.ch || ''}</span>
                ))}
              </div>
            ))}
          </div>
          {note ? <div className="wst-note">{note}</div> : null}
          {action}
        </div>
        {nav ? (
          <div className="wst-nav">
            <button type="button" className="wst-nb" onClick={nav.onBack}>Back</button>
            <div className="wst-pips">
              {nav.pips.map((p, i) => (
                <button key={i} type="button" className={'wst-pip' + (p.done ? ' done' : '') + (p.cur ? ' cur' : '')} onClick={p.onClick} aria-label={p.label} aria-current={p.cur ? 'true' : undefined}><i /></button>
              ))}
            </div>
            <button type="button" className="wst-nb" onClick={nav.onNext}>{nav.nextLabel || 'Next'}</button>
          </div>
        ) : null}
        <div className="wst-kb">
          {ROWS.map((row, ri) => (
            <div className="wst-kr" key={ri}>
              {ri === 2 && enter ? <button type="button" className="wst-k w ent" onClick={() => onKey('ENTER')}>Enter</button> : null}
              {row.split('').map((ch) => {
                const left = live ? (live(ch) || 0) : null;
                const dim = left === 0;
                return (
                  <button key={ch} type="button" className={'wst-k' + (dim ? ' d' : '')} disabled={dim} onClick={() => onKey(ch)} aria-label={dim ? `${ch}, not in this word` : ch}>
                    {ch}{left > 1 ? <b>{left}</b> : null}
                  </button>
                );
              })}
              {ri === 2 ? (
                <button type="button" className="wst-k w" onClick={() => onKey('BACK')} aria-label="Delete">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M21 4H8l-7 8 7 8h13a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2z" /><path d="m18 9-6 6M12 9l6 6" /></svg>
                </button>
              ) : null}
            </div>
          ))}
        </div>
        {(foot || frac != null) ? (
          <div className="wst-foot">
            {frac != null ? <span className="wst-bar"><span style={{ width: `${Math.max(0, Math.min(1, frac)) * 100}%` }} /></span> : null}
            {foot ? <span className="wst-line">{foot}</span> : null}
          </div>
        ) : null}
        {/* THE FOOT ROW (owner, 2026-10-28): Clock, How to play, Give up. */}
        <StageFoot giveUp={giveUp ? { ...giveUp, armedLabel: giveUp.armedLabel || 'Tap again to give up' } : null} bg={pal.bg} />
      </div>
    </div>
  );
}

const CSS = `
.wst{position:fixed;inset:0;z-index:85;background:var(--wst-bg);color:var(--wst-ink);display:flex;justify-content:center;overflow-y:auto;overflow-x:hidden;font-family:'Manrope',system-ui,sans-serif;-webkit-tap-highlight-color:transparent;}
.wst *{color:var(--wst-ink);}
.wst-look{position:fixed;top:max(12px, env(safe-area-inset-top));right:12px;z-index:2;display:inline-flex;align-items:center;justify-content:center;width:40px;height:40px;border-radius:20px;border:2px solid var(--wst-ink);background:transparent;cursor:pointer;padding:0;opacity:.8}
.wst-col{width:100%;max-width:520px;box-sizing:border-box;padding:max(12px, env(safe-area-inset-top)) 10px max(14px, env(safe-area-inset-bottom));display:flex;flex-direction:column;gap:16px;min-height:100%;}
.wst-top{flex:1;display:flex;flex-direction:column;justify-content:center;align-items:center;gap:20px;animation:wstRise .35s ease-out both;}
.wst-eb{text-align:center;font-size:13px;font-weight:800;letter-spacing:.06em;text-transform:uppercase;opacity:.75;max-width:100%;}
.wst-clue{margin:0;text-align:center;font-size:clamp(23px,7.4vw,30px);line-height:1.18;font-weight:800;letter-spacing:-.02em;}
.wst-scr{text-align:center;font-weight:800;letter-spacing:.14em;font-size:min(44px, calc((100vw - 40px) / var(--wst-sn) / 1.05));white-space:nowrap;}
.wst-tiles{display:flex;justify-content:center;gap:7px;}
.wst-tiles span{width:min(52px, calc((100vw - 40px - (var(--wst-sn) - 1) * 7px) / var(--wst-sn)));aspect-ratio:52/60;border-radius:12px;background:var(--wst-ink);color:var(--wst-bg);display:flex;align-items:center;justify-content:center;font-size:min(30px, calc((100vw - 40px) / var(--wst-sn) * .55));font-weight:800;}
.wst-slots{display:flex;justify-content:center;flex-wrap:nowrap;gap:calc(min(52px, (100vw - 40px) / var(--wst-n)) * .45);}
.wst-grp{display:flex;gap:6px;}
.wst-s{--w:min(52px, calc((100vw - 40px - (var(--wst-n) - 1) * 6px) / var(--wst-n)));width:var(--w);aspect-ratio:52/60;box-sizing:border-box;border-radius:12px;border:2px solid var(--wst-ink);background:var(--wst-tile);display:flex;align-items:center;justify-content:center;font-size:calc(var(--w) * .56);font-weight:800;position:relative;transition:background .15s;}
.wst-s.cur{box-shadow:0 0 0 3px var(--wst-bg),0 0 0 5px var(--wst-ink);}
.wst-s.mk{padding-bottom:9px;}
.wst-s.mk::after{content:"";position:absolute;bottom:5px;left:50%;width:7px;height:7px;margin-left:-3.5px;border-radius:4px;background:var(--wst-ink);}
.wst-s.sp{border-style:solid;border-width:2.5px;}
.wst-s.gh{opacity:.45;}
.wst-slots.ok .wst-s{background:var(--wst-ink);color:var(--wst-bg);animation:wstPop .45s ease-out both;}
.wst-slots.ok .wst-s.mk::after{background:var(--wst-bg);}
.wst-slots.shown .wst-s{border-style:solid;}
.wst-slots.bad{animation:wstShake .4s cubic-bezier(.2,.7,.3,1);}
.wst-spine{display:flex;justify-content:center;gap:6px;flex-wrap:wrap;}
.wst-spine span{width:36px;height:36px;box-sizing:border-box;border-radius:9px;border:2px solid var(--wst-ink);display:flex;align-items:center;justify-content:center;font-size:17px;font-weight:800;}
.wst-spine span.f{background:var(--wst-ink);color:var(--wst-bg);}
.wst-spine span.now{box-shadow:0 0 0 3px var(--wst-bg),0 0 0 5px var(--wst-ink);}
.wst-acts{display:flex;justify-content:center;flex-wrap:wrap;gap:8px;}
.wst-combo{display:flex;flex-direction:column;align-items:center;gap:10px;font-size:22px;font-weight:800;letter-spacing:.08em;}
.wst-combo i{font-style:normal;opacity:.55;}
.wst-line1{min-width:min(320px,100%);min-height:60px;box-sizing:border-box;border-radius:14px;border:2px solid var(--wst-ink);background:var(--wst-tile);display:flex;align-items:center;justify-content:center;padding:0 14px;font-size:28px;font-weight:800;letter-spacing:.12em;white-space:nowrap;overflow:hidden;}
.wst-line1.ok{background:var(--wst-ink);color:var(--wst-bg);}
.wst-tries{display:flex;gap:10px;justify-content:center;flex-wrap:wrap;font-size:13px;font-weight:800;letter-spacing:.06em;}
.wst-tries s{opacity:.7;}
.wst-note{text-align:center;font-size:14px;font-weight:700;opacity:.8;max-width:340px;}
.wst-act{align-self:center;min-height:44px;padding:0 18px;border-radius:999px;border:2px solid var(--wst-ink);background:transparent;font:inherit;font-size:14px;font-weight:800;cursor:pointer;}
.wst-act.on{background:var(--wst-ink);color:var(--wst-bg);}
.wst-act:disabled{opacity:.4;cursor:default;}
.wst-nav{display:flex;justify-content:space-between;align-items:center;gap:8px;}
.wst-nb{min-height:44px;min-width:70px;padding:0 14px;border-radius:999px;border:2px solid var(--wst-ink);background:transparent;font:inherit;font-size:14px;font-weight:800;cursor:pointer;}
.wst-nb:active{transform:scale(.97);}
.wst-pips{display:flex;flex-wrap:nowrap;justify-content:center;gap:1px;min-width:0;}
.wst-pip{width:18px;height:28px;padding:0;border:none;background:none;display:flex;align-items:center;justify-content:center;cursor:pointer;}
.wst-pip i{display:block;width:13px;height:13px;border-radius:7px;border:2px solid var(--wst-ink);box-sizing:border-box;}
.wst-pip.done i{background:var(--wst-ink);}
.wst-pip.cur i{width:15px;height:15px;box-shadow:0 0 0 2px var(--wst-bg),0 0 0 4px var(--wst-ink);}
.wst-kb{display:flex;flex-direction:column;gap:7px;}
.wst-kr{display:flex;justify-content:center;gap:5px;}
.wst-k{position:relative;flex:1 1 0;max-width:40px;height:50px;border-radius:9px;border:2px solid var(--wst-ink);background:var(--wst-tile);font-family:inherit;font-size:17px;font-weight:800;padding:0;cursor:pointer;display:flex;align-items:center;justify-content:center;touch-action:manipulation;}
.wst-k b{position:absolute;top:2px;right:4px;font-size:10px;font-weight:800;}
.wst-k:active{background:color-mix(in srgb, var(--wst-ink) 20%, transparent);}
.wst-k.d{opacity:.22;border-color:transparent;cursor:default;}
.wst-k.w{flex:1.6 1 0;max-width:64px;font-size:13px;}
.wst-k.ent{background:var(--wst-ink);color:var(--wst-bg);}
.wst-foot{display:flex;flex-direction:column;align-items:center;gap:6px;opacity:.72;}
.wst-bar{display:block;width:120px;height:4px;border-radius:2px;background:color-mix(in srgb, var(--wst-ink) 22%, transparent);overflow:hidden;}
.wst-bar>span{display:block;height:100%;background:var(--wst-ink);transition:width .25s;}
.wst-line{font-size:13px;font-weight:700;text-align:center;font-variant-numeric:tabular-nums;}
.wst-give{background:none;border:none;padding:4px 8px;font:inherit;font-size:12px;font-weight:700;text-decoration:underline;text-underline-offset:3px;cursor:pointer;}
.wst-give.on{font-weight:800;}
.wst.inl{position:relative;inset:auto;z-index:auto;overflow:visible;border-radius:22px;margin:0 auto;max-width:640px;}
.wst.inl .wst-col{min-height:min(720px, calc(100vh - 200px));padding:18px 12px;}
@keyframes wstRise{from{transform:translateY(10px);opacity:0}to{transform:none;opacity:1}}
@keyframes wstPop{0%{transform:scale(.9)}60%{transform:scale(1.06)}100%{transform:none}}
@keyframes wstShake{0%,100%{transform:none}20%{transform:translateX(-8px)}50%{transform:translateX(7px)}80%{transform:translateX(-3px)}}
@media(max-height:700px){.wst-col{gap:10px}.wst-top{gap:14px}.wst-k{height:44px}.wst-kb{gap:5px}}
@media (prefers-reduced-motion: reduce){.wst-top,.wst-slots.ok .wst-s,.wst-slots.bad{animation:none}}
`;
