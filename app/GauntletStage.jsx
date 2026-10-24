'use client';

// THE GAUNTLET STAGE (owner, 2026-10-23): every gauntlet question, in a run or
// on a daily's own page, plays on one full-screen stage that shows the question
// and its answers and nothing else, built after Aorb's play screen ("I want all
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
import { RAMP_INK } from '@/lib/category-ramp';
import { useStageLook, stagePalette, useStageChrome, LookButton } from './GauntletScreens';

export default function GauntletStage({ bg, ink = RAMP_INK, qKey, question, choices = [], onPick, lockIdx = null, disabled = false, frac = null, hot = false, footer = null, label = 'Question' }) {
  // The stage's own look switch (owner, 2026-10-23): pastel by default, Plain
  // is white with black type. Separate from the site's light/dark setting.
  const [look, setLook] = useStageLook();
  const pal = look === 'plain' ? stagePalette(bg || '#7dd3fc', 'plain') : { bg: bg || '#7dd3fc', ink };
  useStageChrome(pal.bg);
  return (
    <div className="gst" role="dialog" aria-label={label} style={{ '--gst-bg': pal.bg, '--gst-ink': pal.ink }}>
      <style dangerouslySetInnerHTML={{ __html: CSS }} />
      <LookButton look={look} onFlip={() => setLook(look === 'plain' ? 'color' : 'plain')} className="gst-look" />
      <div className="gst-col" key={qKey}>
        <div className="gst-q">{question}</div>
        <div className={`gst-ch${choices.length > 2 ? ' many' : ''}`}>
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
.gst-look{position:fixed;top:max(12px, env(safe-area-inset-top));right:12px;z-index:2;display:inline-flex;align-items:center;justify-content:center;width:40px;height:40px;border-radius:20px;border:2px solid var(--gst-ink);background:transparent;cursor:pointer;padding:0;opacity:.8}
.gst-look:hover{opacity:1}
.gst-col{width:100%;max-width:600px;box-sizing:border-box;padding:28px 16px 22px;display:flex;flex-direction:column;justify-content:center;gap:28px;min-height:100%;}
.gst-q{text-align:center;font-size:30px;line-height:1.18;font-weight:800;letter-spacing:-0.02em;animation:gstRise .45s ease-out both;}
.gst-q h2{margin:0;font:inherit;letter-spacing:inherit;}
.gst-q blockquote{margin:0 0 12px;font-size:20px;font-weight:700;line-height:1.35;font-style:italic;}
.gst-q .gst-sub{display:block;margin-top:10px;font-size:17px;font-weight:700;}
.gst-ch{display:flex;flex-direction:column;gap:12px;}
.gst-c{position:relative;display:flex;align-items:center;min-height:96px;width:100%;box-sizing:border-box;border-radius:18px;padding:16px 18px;text-align:left;cursor:pointer;background:color-mix(in srgb, var(--gst-ink) 8%, transparent);border:2px solid var(--gst-ink);font-family:inherit;font-size:22px;line-height:1.2;font-weight:800;animation:gstIn .5s cubic-bezier(.2,.8,.2,1) both;transition:background .15s, transform .1s;}
.gst-ch.many .gst-c{min-height:68px;font-size:19px;padding:12px 16px;}
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
@media(min-width:900px){.gst-col{max-width:820px;gap:40px;padding:48px 32px 28px;}.gst-q{font-size:44px;}.gst-q blockquote{font-size:26px;}.gst-ch{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:16px;}.gst-c{min-height:150px;font-size:26px;padding:22px;}.gst-ch.many .gst-c{min-height:120px;font-size:23px;}}
@media(max-width:400px){.gst-q{font-size:25px;}.gst-c{font-size:19px;min-height:80px;}.gst-ch.many .gst-c{font-size:17px;min-height:60px;}}
@media (prefers-reduced-motion: reduce){.gst-q,.gst-c,.gst-c.ok{animation:none}}
`;
