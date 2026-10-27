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
//
// Fixed to the viewport at the page root's stacking level, phone and desktop.

import React from 'react';
import { RAMP_INK, softGround } from '@/lib/category-ramp';
import StageTopBar from './StageTopBar';
import { useGauntletLook, stagePalette, useStageChrome, LookButton } from './GauntletScreens';
import { nextLook } from '@/lib/stage-look';

export default function GauntletStage({ bg, ink = RAMP_INK, qKey, question, choices = [], onPick, lockIdx = null, disabled = false, frac = null, hot = false, footer = null, label = 'Question', kicker = null }) {
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
  return (
    <div key={look} className="gst" role="dialog" aria-label={label} style={{ '--gst-bg': pal.bg, '--gst-ink': pal.ink, '--gst-tile': pal.tile || 'color-mix(in srgb, ' + pal.ink + ' 8%, transparent)' }}>
      <style dangerouslySetInnerHTML={{ __html: CSS }} />
      {/* The site's header pill, back arrow + Mind Loft mark, and the look
          switch (owner, 2026-10-25), the same element every stage page uses. */}
      <div className="gst-top"><StageTopBar look={look} onFlip={() => setLook(nextLook(look))} ink={pal.ink} href="/" allLooks /></div>
      <div className="gst-col" key={qKey}>
        {/* THE KICKER (owner, 2026-10-26): a faint line naming what the
            question is about, for a quiz whose subject is the day (Deep's
            topic) rather than a lane printed on each question. Quiet on
            purpose: it must not pull the eye off the question. */}
        {kicker ? <div className="gst-kick">{kicker}</div> : null}
        <div className="gst-q">{question}</div>
        <div className={`gst-ch${choices.length > 2 ? ' many' : ''}${shortSet ? ' grid' : ''}${tiny ? ' tiny' : ''}`}>
          {choices.map((c, k) => (
            <button key={k} type="button"
              className={`gst-c${lockIdx === k ? ' ok' : ''}`}
              style={{ animationDelay: `${120 + k * 60}ms` }}
              onClick={() => onPick && onPick(k)} disabled={disabled}>
              <span>{c}</span>
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
    </div>
  );
}

const CSS = `
.gst{position:fixed;inset:0;z-index:85;background:var(--gst-bg);color:var(--gst-ink);display:flex;justify-content:center;overflow-y:auto;overflow-x:hidden;font-family:'Manrope',system-ui,sans-serif;-webkit-tap-highlight-color:transparent;}
.gst *{color:var(--gst-ink);}
.gst-top{position:fixed;top:max(12px, env(safe-area-inset-top));left:14px;right:12px;z-index:2;color:var(--gst-ink)}
.gst-look{position:fixed;top:max(12px, env(safe-area-inset-top));right:12px;z-index:2;display:inline-flex;align-items:center;justify-content:center;width:40px;height:40px;border-radius:20px;border:2px solid var(--gst-ink);background:transparent;cursor:pointer;padding:0;opacity:.8}
.gst-look:hover{opacity:1}
.gst-brand{position:fixed;top:max(12px, env(safe-area-inset-top));left:14px;z-index:2;display:inline-flex;align-items:center;gap:8px;height:40px;text-decoration:none;font-weight:800;font-size:16px;letter-spacing:-.01em;}
.gst-col{width:100%;max-width:600px;box-sizing:border-box;padding:max(68px, calc(env(safe-area-inset-top) + 56px)) 16px 22px;display:flex;flex-direction:column;justify-content:center;gap:28px;min-height:100%;}
.gst-q{text-align:center;font-size:30px;line-height:1.18;font-weight:800;letter-spacing:-0.02em;animation:gstRise .45s ease-out both;}
.gst-kick{text-align:center;font-size:12px;font-weight:700;letter-spacing:.14em;text-transform:uppercase;opacity:.42;margin-bottom:-14px;animation:gstRise .45s ease-out both;}
.gst-q h2{margin:0;font:inherit;letter-spacing:inherit;}
.gst-q blockquote{margin:0 0 12px;font-size:20px;font-weight:700;line-height:1.35;font-style:italic;}
/* THE QUOTE LEADS (owner, 2026-10-25): on a quote question the line itself is
   the big type and the prompt under it is the small one. */
.gst-q:has(blockquote){font-size:18px;line-height:1.3;font-weight:700;letter-spacing:-.01em}
.gst-q:has(blockquote) blockquote{font-size:28px;line-height:1.25;font-weight:800;margin-bottom:14px;letter-spacing:-.015em}
.gst-q .gst-sub{display:block;margin-top:10px;font-size:17px;font-weight:700;}
.gst-ch{display:flex;flex-direction:column;gap:12px;}
.gst-c{position:relative;display:flex;align-items:center;justify-content:center;min-height:72px;width:100%;box-sizing:border-box;border-radius:18px;padding:14px 16px;text-align:center;cursor:pointer;background:var(--gst-tile);border:2px solid var(--gst-ink);font-family:inherit;font-size:22px;line-height:1.2;font-weight:800;animation:gstIn .5s cubic-bezier(.2,.8,.2,1) both;transition:background .15s, transform .1s;}
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
@media(min-width:900px){.gst-col{max-width:820px;gap:40px;padding:48px 32px 28px;}.gst-q{font-size:44px;}.gst-q blockquote{font-size:26px;}.gst-q:has(blockquote){font-size:22px;}.gst-q:has(blockquote) blockquote{font-size:40px;}.gst-ch{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:16px;}.gst-c{min-height:150px;font-size:26px;padding:22px;}.gst-ch.many .gst-c{min-height:120px;font-size:23px;}.gst-ch.tiny .gst-c{font-size:38px;}}
@media(max-width:400px){.gst-q{font-size:25px;}.gst-q:has(blockquote){font-size:16px;}.gst-q:has(blockquote) blockquote{font-size:24px;}.gst-c{font-size:19px;min-height:64px;}.gst-ch.many .gst-c{font-size:17px;min-height:54px;}.gst-ch.grid .gst-c{font-size:18px;min-height:76px;}.gst-ch.tiny .gst-c{font-size:27px;}}
@media (prefers-reduced-motion: reduce){.gst-q,.gst-c,.gst-c.ok{animation:none}}
`;
