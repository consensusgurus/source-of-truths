'use client';

// THE GAUNTLET STAGE (owner, 2026-10-23): every gauntlet question, in a run or
// on a daily's own page, plays on one full-screen stage that shows the question
// and its answers and nothing else, built after a crowd game's play screen ("I want all
// gauntlet questions to look just like this. A counter can run below, but
// otherwise this simple").
//
// - The ground is the bank's PASTEL step of the gauntlet ladder (lib/circuits
//   rampFor, "each color category of the gauntlet itself will match
//   background", "it needs to use the pastel colors"), and everything on it is
//   the one dark ink, RAMP_INK, like the end card. No white text.
// - The counter below is quiet (owner: "clock and standing but subtly"): a thin
//   clock bar and one small line.
// - The host keeps every rule: timing, scoring, keys 1 to 4, what a wrong answer
//   does. This file only draws. `lockIdx` lights the right answer while the
//   host holds between questions; `qKey` changes with every question so the
//   entrance plays again.
// - THE SPOTLIGHT (owner, 2026-11-07, "let's do spotlight on all of the
//   gauntlets"): on a miss, wrong pick or clock out, the stage holds for
//   MISS_MS. The pick shakes and is tagged "Your pick", then the stage dims and
//   only the question and the right answer stay lit. `missRight` is the right
//   answer's index while the hold runs (null otherwise), `missPick` the pick
//   (null on a timeout). Dailies get the hold from useMissReveal below, which
//   keeps the game's own state untouched (the loss is saved and posted at once);
//   the run delays its section verdict by MISS_MS instead.
//
// Fixed to the viewport at the page root's stacking level, phone and desktop.

import React from 'react';
import { RAMP_INK, softGround } from '@/lib/category-ramp';
import StageTopBar from './StageTopBar';
import { useGauntletLook, stagePalette, useStageChrome, LookButton } from './GauntletScreens';
import { nextLook } from '@/lib/stage-look';

export const MISS_MS = 1900;
// THE RECAP REVEAL (owner, 2026-11-07, "implement, and use the full screen
// reveal version"). Inside a run, a miss holds on the spotlight this long, then
// the lit answer grows out of its own tile to fill the screen with the recap
// (where the quiz ended, the question, the answer, the pick, the standing) and
// an "On to <next>" button. The button shrinks the answer back into its tile and
// hands off to the host, which starts the next quiz's first question.
export const REVEAL_DELAY = 1400;
export const SLOT_MS = 620;

// THE HOLD FOR A DAILY. Watches the game's status and, on the render where it
// goes from 'playing' to 'lost', opens a MISS_MS window (decided during render,
// so the ending never paints for a frame before the spotlight). The client
// treats the window as still playing, so its ending waits. A page that loads
// on a board already lost never sees the transition and gets no hold.
// `started` is the game's own clock-started flag (g.t0): a client mounts on a
// fresh unstarted board and loads the saved one after, so a saved loss arrives
// as an unstarted 'playing' flipping to 'lost', which must NOT hold.
export function useMissReveal(status, pick, timedOut, started) {
  const prev = React.useRef({ status, started });
  const hold = React.useRef(null);
  const [, bump] = React.useState(0);
  if (status === 'playing') hold.current = null;
  else if (prev.current.status === 'playing' && prev.current.started && status === 'lost' && !hold.current) {
    hold.current = { pick: timedOut ? null : (pick == null ? null : pick), until: Date.now() + MISS_MS };
  }
  prev.current = { status, started };
  const live = hold.current && Date.now() < hold.current.until ? hold.current : null;
  const until = live ? live.until : 0;
  React.useEffect(() => {
    if (!until) return undefined;
    const t = setTimeout(() => bump((n) => n + 1), Math.max(0, until - Date.now()) + 20);
    return () => clearTimeout(t);
  }, [until]);
  return live;
}

export default function GauntletStage({ bg, ink = RAMP_INK, qKey, question, choices = [], onPick, lockIdx = null, disabled = false, frac = null, hot = false, footer = null, label = 'Question', kicker = null, missRight = null, missPick = null, recap = null }) {
  // The stage's own look switch (owner, 2026-10-23): pastel by default, Plain
  // is white with black type. Separate from the site's light/dark setting.
  const [look, setLook] = useGauntletLook();
  const pal = look === 'color' ? { bg: softGround(bg || '#7dd3fc'), ink } : stagePalette(bg || '#7dd3fc', look);
  useStageChrome(pal.bg);
  // SHORT ANSWERS GO 2x2 ON A PHONE (2026-10-24, player report on Blitz): four
  // numbers stacked in one tall column made the eye travel down the screen to
  // compare them. When every choice is short the phone uses the same 2x2 grid
  // as desktop; long trivia answers keep the single column so they never wrap
  // into a cramped box. `tiny` (all six characters or fewer, e.g. Blitz's
  // numbers) also sets the type larger so it fills its card.
  const lens = choices.map((c) => (typeof c === 'string' || typeof c === 'number' ? String(c).length : 99));
  const shortSet = choices.length === 4 && lens.every((n) => n <= 16);
  const tiny = shortSet && lens.every((n) => n <= 6);
  const miss = missRight != null;
  // The recap reveal: measured off the lit tile so it grows from exactly there.
  const btnRefs = React.useRef([]);
  const recapRef = React.useRef(recap);
  recapRef.current = recap;
  const [big, setBig] = React.useState(null);
  const recapOn = !!recap && miss;
  React.useEffect(() => {
    if (!recapOn) { setBig(null); return undefined; }
    let raf = 0;
    const t = setTimeout(() => {
      const el = btnRefs.current[missRight];
      if (!el) return;
      const b = el.getBoundingClientRect();
      setBig({ r: { top: b.top, left: b.left, width: b.width, height: b.height }, open: false });
      raf = requestAnimationFrame(() => { raf = requestAnimationFrame(() => setBig((x) => (x ? { ...x, open: true } : x))); });
    }, REVEAL_DELAY);
    return () => { clearTimeout(t); cancelAnimationFrame(raf); };
  }, [recapOn, missRight, qKey]);
  const goingRef = React.useRef(false);
  React.useEffect(() => { goingRef.current = false; }, [qKey]);
  // THE SLOW TIMER (owner, 2026-11-07: "a slow timer to show for next category
  // play"). Once the recap is open it counts recap.autoMs down on the button
  // (seconds plus a bar draining along its foot) and moves on by itself at zero.
  const autoMs = recap && recap.autoMs ? recap.autoMs : 0;
  const [left, setLeft] = React.useState(0);
  const open = !!(big && big.open);
  React.useEffect(() => {
    if (!open || !autoMs) return undefined;
    const end = Date.now() + autoMs;
    setLeft(autoMs);
    const iv = setInterval(() => {
      const l = Math.max(0, end - Date.now());
      setLeft(l);
      if (l <= 0) { clearInterval(iv); recapGo(); }
    }, 250);
    return () => clearInterval(iv);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, autoMs, qKey]);
  function recapGo() {
    if (goingRef.current) return;
    goingRef.current = true;
    setBig((x) => (x ? { ...x, open: false } : x));
    setTimeout(() => { const rc = recapRef.current; if (rc && rc.onGo) rc.onGo(); }, SLOT_MS);
  }
  // Spotlight colours per look: a dark veil of the ink on the light looks, black
  // on the dark ones; the lit answer is the ground (or the tint tile) with ink on
  // the light looks, and inverted (ink fill, ground type) on the dark ones.
  const darkLook = look === 'dark' || look === 'darktint';
  const spot = darkLook
    ? { dim: 'rgba(0,0,0,.72)', on: pal.ink, rvBg: pal.ink, rvInk: pal.bg }
    : { dim: 'color-mix(in srgb, ' + pal.ink + ' 74%, transparent)', on: '#ffffff', rvBg: look === 'tint' && pal.tile ? pal.tile : pal.bg, rvInk: pal.ink };
  return (
    <div key={look} className={`gst${miss ? ' miss' : ''}`} role="dialog" aria-label={label} style={{ '--gst-bg': pal.bg, '--gst-ink': pal.ink, '--gst-tile': pal.tile || 'color-mix(in srgb, ' + pal.ink + ' 8%, transparent)', '--gst-dimc': spot.dim, '--gst-ondim': spot.on, '--gst-rv-bg': spot.rvBg, '--gst-rv-ink': spot.rvInk }}>
      <style dangerouslySetInnerHTML={{ __html: CSS }} />
      {/* The site's header pill, back arrow + Mind Loft mark, and the look
          switch (owner, 2026-10-25), the same element every stage page uses. */}
      <div className="gst-top"><StageTopBar look={look} onFlip={() => setLook(nextLook(look))} ink={pal.ink} href="/" allLooks /></div>
      <div className="gst-dim" aria-hidden="true" />
      <div className="gst-col" key={qKey}>
        {/* THE KICKER (owner, 2026-10-26), now a TAG (owner, 2026-10-31: "Sport
            and maybe Deep need some indication of what the sub category is"):
            a full-ink pill naming what the question is about, Deep's day topic
            or the sport of a Sport question (app/sport/sport-tags.js). */}
        {kicker ? <div className="gst-kick">{kicker}</div> : null}
        <div className="gst-q">{question}</div>
        <div className={`gst-ch${choices.length > 2 ? ' many' : ''}${shortSet ? ' grid' : ''}${tiny ? ' tiny' : ''}`}>
          {choices.map((c, k) => (
            <button key={k} type="button" ref={(el) => { btnRefs.current[k] = el; }}
              className={`gst-c${miss ? (k === missRight ? ' rv' : (k === missPick ? ' pk' : '')) : (lockIdx === k ? ' ok' : '')}`}
              style={{ animationDelay: `${120 + k * 60}ms` }}
              onClick={() => onPick && onPick(k)} disabled={disabled || miss}>
              <span>{c}</span>
              {miss && k === missPick ? <span className="gst-tag">Your pick</span> : null}
            </button>
          ))}
        </div>
        {(frac != null || footer) && (
          <div className="gst-foot">
            {frac != null && <span className={`gst-bar${hot ? ' hot' : ''}`}><span style={{ width: `${Math.max(0, Math.min(1, frac)) * 100}%` }} /></span>}
            {footer ? <span className="gst-line">{footer}</span> : null}
          </div>
        )}
      </div>
      {recapOn && big ? (
        <div className={`gst-big${big.open ? ' open' : ''}`} role="group" aria-label="The answer"
          style={big.open ? { top: 0, left: 0, width: '100vw', height: '100%' } : { top: big.r.top, left: big.r.left, width: big.r.width, height: big.r.height }}>
          <div className="gst-bin">
            <span className="gst-bx gst-blab">{recap.label}</span>
            <span className="gst-bx gst-bq">{question}</span>
            <span className="gst-bans">{choices[missRight]}</span>
            {missPick != null && choices[missPick] != null
              ? <span className="gst-bx gst-byou">You picked {choices[missPick]}</span>
              : recap.timedOut ? <span className="gst-bx gst-byou">The clock ran out</span> : null}
            <span className="gst-bx gst-bstand"><b>{recap.right}</b> right{recap.stand ? <> &middot; {recap.stand}</> : null}</span>
            <button type="button" className="gst-bx gst-bgo" onClick={recapGo} disabled={!big.open}
              aria-label={autoMs ? `${recap.goLabel}, starts in ${Math.ceil(left / 1000)} seconds` : recap.goLabel}>
              <span>{recap.goLabel}</span>
              {autoMs ? <span className="gst-bsec">{Math.ceil(left / 1000)}</span>
                : <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6" /></svg>}
              {autoMs ? <span className="gst-bbar" aria-hidden="true"><span style={{ width: `${Math.max(0, Math.min(1, left / autoMs)) * 100}%` }} /></span> : null}
            </button>
          </div>
          {recap.leaveHref ? <a className="gst-bleave" href={recap.leaveHref}>Leave the run</a> : null}
        </div>
      ) : null}
    </div>
  );
}

const CSS = `
.gst{position:fixed;inset:0;z-index:85;background:var(--gst-bg);color:var(--gst-ink);display:flex;justify-content:center;overflow-y:auto;overflow-x:hidden;font-family:'Manrope',system-ui,sans-serif;-webkit-tap-highlight-color:transparent;}
.gst *{color:var(--gst-ink);}
.gst-top{position:fixed;top:max(12px, env(safe-area-inset-top));left:14px;right:12px;z-index:2;color:var(--gst-ink)}
.gst-look{position:fixed;top:max(12px, env(safe-area-inset-top));right:12px;z-index:2;display:inline-flex;align-items:center;justify-content:center;width:40px;height:40px;border-radius:20px;border:1px solid var(--gst-ink);background:transparent;cursor:pointer;padding:0;opacity:.8}
.gst-look:hover{opacity:1}
/* SITE NAVIGATION SHOWN (owner, 2026-10-30: the light/dark, back and share
   buttons showed twice above the question). With the frame's own header up,
   the stage starts under it and its private top bar steps aside; full screen
   (lc-focus) and the phone keep the bar. */
html.lc-on:not(.lc-focus) .gst{top:var(--lc-hh,62px);}
html.lc-on:not(.lc-focus) .gst-top,html.lc-on:not(.lc-focus) .gst-look,html.lc-on:not(.lc-focus) .gst-brand{display:none !important;}
html.lc-on:not(.lc-focus) .gst-col{padding-top:28px;}
.gst-brand{position:fixed;top:max(12px, env(safe-area-inset-top));left:14px;z-index:2;display:inline-flex;align-items:center;gap:8px;height:40px;text-decoration:none;font-weight:800;font-size:16px;letter-spacing:-.01em;}
.gst-col{width:100%;max-width:600px;box-sizing:border-box;padding:max(68px, calc(env(safe-area-inset-top) + 56px)) 16px 22px;display:flex;flex-direction:column;justify-content:center;gap:28px;min-height:100%;}
.gst-q{text-align:center;font-size:30px;line-height:1.18;font-weight:800;letter-spacing:-0.02em;animation:gstRise .45s ease-out both;}
.gst-kick{align-self:center;display:inline-flex;align-items:center;gap:7px;max-width:100%;padding:5px 13px 5px 10px;border:1px solid var(--gst-ink);border-radius:999px;font-size:12px;font-weight:800;letter-spacing:.1em;text-transform:uppercase;line-height:1.2;margin-bottom:-10px;animation:gstRise .45s ease-out both;}
.gst-kick::before{content:'';flex:none;width:7px;height:7px;border-radius:50%;background:var(--gst-ink);}
.gst-q h2{margin:0;font:inherit;letter-spacing:inherit;}
.gst-q blockquote{margin:0 0 12px;font-size:20px;font-weight:700;line-height:1.35;font-style:italic;}
/* THE QUOTE LEADS (owner, 2026-10-25): on a quote question the line itself is
   the big type and the prompt under it is the small one. */
.gst-q:has(blockquote){font-size:18px;line-height:1.3;font-weight:700;letter-spacing:-.01em}
.gst-q:has(blockquote) blockquote{font-size:28px;line-height:1.25;font-weight:800;margin-bottom:14px;letter-spacing:-.015em}
.gst-q .gst-sub{display:block;margin-top:10px;font-size:17px;font-weight:700;}
.gst-ch{display:flex;flex-direction:column;gap:12px;}
.gst-c{position:relative;display:flex;align-items:center;justify-content:center;min-height:72px;width:100%;box-sizing:border-box;border-radius:18px;padding:14px 16px;text-align:center;cursor:pointer;background:var(--gst-tile);border:1px solid var(--gst-ink);font-family:inherit;font-size:22px;line-height:1.2;font-weight:800;animation:gstIn .5s cubic-bezier(.2,.8,.2,1) both;transition:background .15s, transform .1s;}
.gst-ch.many .gst-c{min-height:58px;font-size:19px;padding:10px 14px;}
.gst-ch.grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px;}
.gst-ch.grid .gst-c{min-height:84px;font-size:20px;padding:10px 10px;}
.gst-ch.tiny .gst-c{font-size:30px;font-variant-numeric:tabular-nums;}
.gst-c:active{transform:scale(.99);}
@media(hover:hover){.gst-c:hover{background:color-mix(in srgb, var(--gst-ink) 16%, transparent);}}
.gst-c:disabled{cursor:default;}
.gst-c.ok{background:var(--gst-ink);}
.gst-c.ok, .gst-c.ok *{color:var(--gst-bg);}
.gst-c.ok{animation:gstGlow .7s ease-out both;}
.gst-foot{display:flex;flex-direction:column;align-items:center;gap:8px;opacity:.72;}
.gst-bar{display:block;width:120px;height:4px;border-radius:2px;background:color-mix(in srgb, var(--gst-ink) 22%, transparent);overflow:hidden;}
.gst-bar>span{display:block;height:100%;background:var(--gst-ink);transition:width .25s linear;}
.gst-bar.hot>span{animation:gstPulse .6s ease-in-out infinite alternate;}
.gst-line{font-size:13px;font-weight:700;text-align:center;font-variant-numeric:tabular-nums;}
@keyframes gstRise{from{transform:translateY(14px);opacity:0}to{transform:none;opacity:1}}
@keyframes gstIn{from{transform:translateY(18px);opacity:0}to{transform:none;opacity:1}}
@keyframes gstGlow{0%{box-shadow:0 0 0 0 color-mix(in srgb, var(--gst-ink) 45%, transparent)}100%{box-shadow:0 0 0 14px transparent}}
@keyframes gstPulse{from{opacity:1}to{opacity:.35}}
/* THE SPOTLIGHT on a miss (owner, 2026-11-07). The veil is fixed to the
   viewport inside the stage; the question, its kicker and the right answer
   rise above it. The pick shakes first, then the veil comes down. */
.gst-dim{position:fixed;inset:0;z-index:3;background:var(--gst-dimc);opacity:0;pointer-events:none;transition:opacity .35s ease .3s;}
.gst.miss .gst-dim{opacity:1;}
.gst.miss .gst-q,.gst.miss .gst-kick{position:relative;z-index:4;}
.gst.miss .gst-q,.gst.miss .gst-q *,.gst.miss .gst-kick,.gst.miss .gst-kick *{color:var(--gst-ondim);transition:color .3s ease .3s;}
.gst.miss .gst-kick{border-color:var(--gst-ondim);}
.gst.miss .gst-kick::before{background:var(--gst-ondim);}
.gst-c.rv{animation:none;z-index:4;background:var(--gst-rv-bg);border-color:var(--gst-rv-bg);transform:scale(1.04);box-shadow:0 12px 32px rgba(0,0,0,.28);transition:background .3s ease .3s,border-color .3s ease .3s,transform .35s ease .3s,box-shadow .35s ease .3s;}
.gst-c.rv, .gst-c.rv *{color:var(--gst-rv-ink);}
.gst-c.pk{animation:gstShake .38s ease-in-out 0s both !important;}
/* YOUR PICK STAYS FINDABLE (owner, 2026-11-07: "too hard to see 'your pick'").
   It rises above the veil as a faint light outline, second to the lit answer. */
.gst.miss .gst-c.pk{z-index:4;background:transparent;border:2px solid color-mix(in srgb, var(--gst-ondim) 55%, transparent);transition:background .3s ease .3s,border-color .3s ease .3s;}
.gst.miss .gst-c.pk>span:first-child{color:var(--gst-ondim);opacity:.75;transition:color .3s ease .3s;}
.gst.miss .gst-c.pk .gst-tag{color:var(--gst-ink);}
.gst-tag{position:absolute;top:-10px;right:14px;font-size:11px;font-weight:800;letter-spacing:.08em;text-transform:uppercase;line-height:1.3;background:var(--gst-bg);border:1px solid var(--gst-ink);border-radius:999px;padding:2px 8px;animation:gstTag .25s ease-out .35s both;}
/* THE RECAP REVEAL: the lit answer's own colours, grown from its tile to the
   whole screen (fixed, so it covers the stage at every width), and back. */
.gst-big{position:fixed;z-index:7;box-sizing:border-box;background:var(--gst-rv-bg);border-radius:19px;overflow:hidden;display:flex;align-items:center;justify-content:center;transition:top .6s cubic-bezier(.2,.8,.2,1),left .6s cubic-bezier(.2,.8,.2,1),width .6s cubic-bezier(.2,.8,.2,1),height .6s cubic-bezier(.2,.8,.2,1),border-radius .6s;}
.gst-big.open{border-radius:0;}
.gst-big,.gst-big *{color:var(--gst-rv-ink);}
.gst-bin{width:100%;max-width:640px;box-sizing:border-box;padding:0 16px;display:flex;flex-direction:column;align-items:center;text-align:center;gap:0;transition:gap .4s,padding .6s;}
.gst-big.open .gst-bin{gap:14px;padding:max(24px, env(safe-area-inset-top)) 22px 24px;}
.gst-bans{font-weight:800;font-size:22px;line-height:1.08;letter-spacing:-.02em;transition:font-size .6s cubic-bezier(.2,.8,.2,1);overflow-wrap:anywhere;}
.gst-big.open .gst-bans{font-size:clamp(36px, 10vw, 68px);}
.gst-bx{opacity:0;max-height:0;overflow:hidden;transition:opacity .2s,max-height .3s;}
.gst-big.open .gst-bx{opacity:1;max-height:260px;transition:opacity .35s ease .45s,max-height .3s ease .3s;}
.gst-blab{font-size:12px;font-weight:800;letter-spacing:.12em;text-transform:uppercase;}
.gst-big.open .gst-blab{opacity:.75;}
.gst-bq{font-size:17px;font-weight:700;line-height:1.35;max-width:520px;}
.gst-bq h2,.gst-bq blockquote{margin:0;font:inherit;letter-spacing:0;}
.gst-bq blockquote{font-style:italic;margin-bottom:4px;}
.gst-byou{font-size:15px;font-weight:700;}
.gst-big.open .gst-byou{opacity:.7;}
.gst-bstand{font-size:14px;font-weight:700;padding:8px 14px;border-radius:999px;border:1px solid var(--gst-rv-ink);}
.gst-bstand b{font-size:16px;}
.gst-bgo{position:relative;overflow:hidden;display:flex;align-items:center;justify-content:center;gap:12px;width:100%;max-width:440px;min-height:58px;border:0;border-radius:18px;background:var(--gst-rv-ink);font-family:inherit;font-size:20px;font-weight:800;cursor:pointer;margin-top:8px;}
.gst-bsec{display:inline-flex;align-items:center;justify-content:center;min-width:30px;height:30px;border-radius:15px;border:2px solid var(--gst-rv-bg);box-sizing:border-box;font-size:14px;font-variant-numeric:tabular-nums;}
.gst-bbar{position:absolute;left:0;right:0;bottom:0;height:5px;background:color-mix(in srgb, var(--gst-rv-bg) 22%, transparent);}
.gst-bbar>span{display:block;height:100%;background:var(--gst-rv-bg);transition:width .25s linear;}
.gst-big .gst-bgo,.gst-big .gst-bgo *{color:var(--gst-rv-bg);}
.gst-bgo:active{transform:scale(.98);}
/* Leave the run (owner, 2026-11-07): a small underlined link at the foot of the screen, not a button. */
.gst-bleave{position:absolute;left:50%;bottom:max(22px, calc(env(safe-area-inset-bottom) + 14px));transform:translateX(-50%);font-size:13px;font-weight:700;text-decoration:underline;text-underline-offset:3px;white-space:nowrap;opacity:0;pointer-events:none;transition:opacity .2s;}
.gst-big.open .gst-bleave{opacity:.75;pointer-events:auto;transition:opacity .35s ease .6s;}
@media(min-width:900px){.gst-big.open .gst-bin{gap:18px;}.gst-bq{font-size:20px;}}
@keyframes gstShake{0%,100%{transform:none}20%{transform:translateX(-7px)}40%{transform:translateX(6px)}60%{transform:translateX(-4px)}80%{transform:translateX(3px)}}
@keyframes gstTag{from{opacity:0;transform:translateY(4px)}to{opacity:1;transform:none}}
@media(min-width:900px){.gst-col{max-width:820px;gap:40px;padding:48px 32px 28px;}.gst-q{font-size:44px;}.gst-q blockquote{font-size:26px;}.gst-q:has(blockquote){font-size:22px;}.gst-q:has(blockquote) blockquote{font-size:40px;}.gst-ch{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:16px;}.gst-c{min-height:150px;font-size:26px;padding:22px;}.gst-ch.many .gst-c{min-height:120px;font-size:23px;}.gst-ch.tiny .gst-c{font-size:38px;}}
@media(max-width:400px){.gst-q{font-size:25px;}.gst-q:has(blockquote){font-size:16px;}.gst-q:has(blockquote) blockquote{font-size:24px;}.gst-c{font-size:19px;min-height:64px;}.gst-ch.many .gst-c{font-size:17px;min-height:54px;}.gst-ch.grid .gst-c{font-size:18px;min-height:76px;}.gst-ch.tiny .gst-c{font-size:27px;}}
@media (prefers-reduced-motion: reduce){.gst-q,.gst-c,.gst-c.ok,.gst-c.pk,.gst-tag{animation:none}.gst-dim,.gst-c.rv,.gst-big,.gst-bans,.gst-bx{transition:none}}
`;
