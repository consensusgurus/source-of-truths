'use client';

// THE STAGE BOARD FOR THE PASSPORT GAMES (owner, 2026-10-26). Ping, Flank and
// Span draw their play area in the gauntlet stage's own vocabulary: the
// question big in the middle, the answers under it as 2px ink tiles, and a
// quiet line at the foot. One look, two homes:
//
//   - INSIDE THE PASSPORT RUN the board sits on the run's play frame
//     (app/GauntletScreens RunPlayFrame), so it reads the frame's own tokens
//     (--gsx-ink, --gsx-card, --gsx-card-paper) and follows its five looks.
//   - ON THE GAME'S OWN PAGE it sits on the white stage ground with the
//     game's own colour on the tiles (owner: "white background versions for
//     the individual puzzles"), and follows the page's light/dark register.
//
// This file only draws. Each client keeps every rule it had: matching,
// scoring, saves, the result row and the run hand-off. LEG_ON is the one
// switch back to the old boards, should a report need it.
//
// No dotted or dashed lines anywhere here (owner, 2026-10-25), and no type
// other than Manrope.

import React from 'react';
import { categoryColor, gameCategory, softGround } from '@/lib/category-ramp';

export const LEG_ON = true;

// The game's category pastel, the same step the gauntlet stage paints with.
function pastelOf(game) {
  try { const c = gameCategory(game); const hex = c ? categoryColor(c) : null; return hex ? softGround(hex) : '#c4e6fd'; } catch (e) { return '#c4e6fd'; }
}

export function legVars(embed, game) {
  if (embed) {
    return {
      '--lg-ink': 'var(--gsx-ink, #08222e)',
      '--lg-tile': 'var(--gsx-card, rgba(8,34,46,0.08))',
      '--lg-paper': 'var(--gsx-card-paper, #ffffff)',
      '--lg-on': 'var(--gsx-bg, #ffffff)',
    };
  }
  const soft = pastelOf(game);
  return {
    '--lg-ink': 'var(--stg-ink, #08222e)',
    '--lg-tile-lt': soft,
    '--lg-tile-dk': `color-mix(in srgb, ${soft} 34%, var(--stg-raise, #0e131f))`,
    '--lg-tile': soft,
    '--lg-paper': 'var(--stg-raise, #ffffff)',
    '--lg-on': 'var(--stg-raise, #ffffff)',
  };
}

export function LegShell({ embed, game, boardRef, children }) {
  return (
    <div className={`lg-wrap${embed ? '' : ' lg-page'}`} style={legVars(embed, game)} ref={boardRef || undefined}>
      <style dangerouslySetInnerHTML={{ __html: LEG_CSS }} />
      <div className={`lg${embed ? ' lg-run' : ''}`}>{children}</div>
    </div>
  );
}

export const LEG_CSS = `
.lg-wrap{container-type:inline-size;width:100%}
[data-stage-theme="dark"] .lg-page{--lg-tile:var(--lg-tile-dk) !important}
.lg{--lg-line:color-mix(in srgb,var(--lg-ink) 30%,transparent);display:flex;flex-direction:column;gap:18px;max-width:600px;margin:0 auto;padding:8px 0 12px;box-sizing:border-box;color:var(--lg-ink);font-family:'Manrope',system-ui,-apple-system,sans-serif;-webkit-tap-highlight-color:transparent}
.lg-run{padding:4px 16px 12px}
.lg *{box-sizing:border-box}
.lg-kick{text-align:center;font-size:12px;font-weight:700;letter-spacing:.14em;text-transform:uppercase;opacity:.6;margin-bottom:-10px;color:var(--lg-ink)}
.lg-q{text-align:center;font-size:28px;line-height:1.18;font-weight:800;letter-spacing:-.02em;text-wrap:balance;margin:0;color:var(--lg-ink);animation:lgIn .45s ease-out both}
.lg-q small{display:block;margin-top:8px;font-size:16px;font-weight:700;letter-spacing:0;opacity:.78}
.lg-chip{align-self:center;display:inline-flex;align-items:center;gap:6px;padding:6px 14px;border-radius:999px;border:2px solid var(--lg-ink);font-size:14px;font-weight:800;color:var(--lg-ink);background:var(--lg-tile)}
.lg-in{position:relative;display:flex;align-items:center;gap:10px;min-height:62px;border:2px solid var(--lg-ink);border-radius:18px;background:var(--lg-tile);padding:0 8px 0 18px}
.lg-in:focus-within{box-shadow:0 0 0 3px color-mix(in srgb,var(--lg-ink) 22%,transparent)}
.lg-in.shake{animation:lgShake .4s}
.lg-in input{flex:1;min-width:0;border:0;background:transparent;outline:none;font:800 21px 'Manrope',system-ui,sans-serif;color:var(--lg-ink);padding:14px 0;-webkit-appearance:none;border-radius:0}
.lg-in input::placeholder{color:var(--lg-ink);opacity:.45;font-weight:700}
.lg-go{flex:none;min-height:46px;padding:0 16px;border-radius:12px;border:0;background:var(--lg-ink);color:var(--lg-on);font:800 14px 'Manrope',system-ui,sans-serif;cursor:pointer}
.lg-go:active{transform:translateY(1px)}
.lg-sug{position:absolute;left:-2px;right:-2px;top:calc(100% + 6px);z-index:6;background:var(--lg-paper);border:2px solid var(--lg-ink);border-radius:16px;overflow:hidden;box-shadow:0 12px 28px rgba(0,0,0,.18)}
.lg-sug button{display:flex;gap:8px;align-items:baseline;width:100%;text-align:left;padding:12px 16px;min-height:46px;border:0;border-bottom:1px solid var(--lg-line);background:transparent;color:var(--lg-ink);font:700 16px 'Manrope',system-ui,sans-serif;cursor:pointer}
.lg-sug button:last-child{border-bottom:0}
.lg-sug button.on,.lg-sug button:hover{background:var(--lg-tile)}
.lg-sug small{font-weight:600;opacity:.65;font-size:13px}
.lg-say{min-height:21px;margin-top:-8px;text-align:center;font-size:15px;font-weight:700;color:var(--lg-ink)}
.lg-foot{display:flex;flex-wrap:wrap;justify-content:center;align-items:center;gap:4px 18px;font-size:13px;font-weight:700;color:var(--lg-ink);opacity:.85;font-variant-numeric:tabular-nums}
.lg-act{background:none;border:0;padding:8px 2px;min-height:40px;font:800 13px 'Manrope',system-ui,sans-serif;color:var(--lg-ink);text-decoration:underline;text-underline-offset:3px;cursor:pointer}
.lg-act.arm{text-decoration:none;background:var(--lg-ink);color:var(--lg-on);border-radius:999px;padding:8px 14px}
.lg-act:focus-visible,.lg-go:focus-visible,.lg-btn:focus-visible,.lg-ans:focus-visible,.lg-zoom button:focus-visible{outline:3px solid var(--lg-ink);outline-offset:2px}

.lg-pbody{display:flex;flex-direction:column;gap:12px}
.lg-rows{display:flex;flex-direction:column;gap:8px}
.lg-row{display:grid;grid-template-columns:auto minmax(0,1fr) auto;align-items:center;gap:12px;padding:8px 14px;min-height:46px;border:2px solid var(--lg-ink);border-radius:14px;background:var(--lg-tile);color:var(--lg-ink)}
.lg-row b{font-size:17px;font-weight:800;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;color:inherit}
.lg-row b small{font-weight:600;opacity:.68;font-size:13px}
.lg-row span{font-size:17px;font-weight:800;font-variant-numeric:tabular-nums;color:inherit;white-space:nowrap}
.lg-row.best{background:var(--lg-ink);color:var(--lg-on)}
.lg-num{width:22px;height:22px;border-radius:11px;border:2px solid currentColor;display:inline-flex;align-items:center;justify-content:center;font-size:11px;font-weight:800;font-style:normal;font-variant-numeric:tabular-nums}
.lg-new{animation:lgIn .45s cubic-bezier(.2,.8,.2,1) both}

.lg-map{position:relative;margin:0;border:2px solid var(--lg-ink);border-radius:16px;overflow:hidden;background:var(--lg-paper)}
.lg-map svg{display:block;width:100%;height:auto}
.lg-map figcaption{position:absolute;left:10px;top:8px;right:90px;font-size:11px;font-weight:800;letter-spacing:.1em;text-transform:uppercase;opacity:.8;color:var(--lg-ink);pointer-events:none}
.lg-zoom{position:absolute;right:8px;bottom:8px;display:flex;gap:6px}
.lg-zoom button{width:38px;height:38px;border-radius:19px;border:2px solid var(--lg-ink);background:var(--lg-paper);color:var(--lg-ink);font:800 18px 'Manrope',system-ui,sans-serif;cursor:pointer;display:flex;align-items:center;justify-content:center;padding:0}
.lg-zoom button:disabled{opacity:.35;cursor:default}

.lg-slots{display:grid;grid-template-columns:repeat(var(--lg-cols,3),minmax(0,1fr));gap:8px;width:100%;max-width:calc(var(--lg-cols,3) * 200px);margin:0 auto}
.lg-slot{min-height:52px;display:flex;align-items:center;justify-content:center;text-align:center;padding:6px;border-radius:14px;font-size:15px;font-weight:800;line-height:1.15;border:2px solid var(--lg-ink);color:var(--lg-ink);overflow-wrap:anywhere}
.lg-slot.f{background:var(--lg-ink);color:var(--lg-on)}
.lg-slot.e{border-color:var(--lg-line)}
.lg-slot.m{background:var(--lg-tile);opacity:.62}
.lg-slot.flash{animation:lgPop .5s ease-out}
.lg-strikes{display:flex;gap:6px;justify-content:center;align-items:center}
.lg-strikes i{width:24px;height:24px;border-radius:12px;border:2px solid var(--lg-ink);display:inline-flex;align-items:center;justify-content:center;font-style:normal;font-size:13px;font-weight:800;color:var(--lg-ink)}
.lg-strikes i.x{background:var(--lg-ink);color:var(--lg-on)}
.lg-struck{text-decoration:line-through;font-weight:700}

.lg-road{display:flex;flex-direction:column}
.lg-road.shake{animation:lgShake .4s}
.lg-stop{display:flex;align-items:center;gap:12px;min-height:50px;padding:6px 16px;border-radius:14px;font-size:19px;font-weight:800;border:2px solid var(--lg-ink);background:var(--lg-tile);color:var(--lg-ink)}
.lg-stop .n{width:24px;flex:none;font-size:12px;font-weight:800;opacity:.6;font-variant-numeric:tabular-nums}
.lg-stop .tag{margin-left:auto;font-size:11px;font-weight:800;letter-spacing:.1em;text-transform:uppercase;opacity:.7;white-space:nowrap}
.lg-stop.s{background:var(--lg-ink);color:var(--lg-on)}
.lg-stop.dst{background:transparent}
.lg-link{width:2px;height:12px;background:var(--lg-ink);margin-left:28px;opacity:.5}
.lg-gap{width:2px;height:24px;background:var(--lg-ink);margin-left:28px;opacity:.2}
.lg-row2{display:flex;gap:10px}
.lg-btn{flex:1;min-height:48px;border-radius:14px;border:2px solid var(--lg-ink);background:var(--lg-tile);color:var(--lg-ink);font:800 15px 'Manrope',system-ui,sans-serif;cursor:pointer}

.lg-known{display:flex;justify-content:space-between;align-items:baseline;gap:12px;padding:12px 16px;border-radius:14px;border:2px solid var(--lg-ink);font-weight:800;color:var(--lg-ink)}
.lg-known b{font-size:17px;min-width:0}
.lg-known span{font-size:20px;font-variant-numeric:tabular-nums;white-space:nowrap}
.lg-pair{display:grid;grid-template-columns:1fr 1fr;gap:12px}
.lg-ans{display:flex;flex-direction:column;align-items:center;justify-content:center;min-height:96px;padding:10px;border-radius:18px;border:2px solid var(--lg-ink);background:var(--lg-tile);color:var(--lg-ink);font:800 24px 'Manrope',system-ui,sans-serif;text-align:center;cursor:pointer;transition:transform .1s,background .15s}
.lg-ans em{font-style:normal;font-size:14px;font-weight:700;margin-top:4px;color:inherit}
.lg-ans:active{transform:scale(.99)}
.lg-ans:disabled{cursor:default}
.lg-ans.ok{background:var(--lg-ink);color:var(--lg-on);animation:lgGlow .7s ease-out both}
.lg-ans.dim{opacity:.4}
@media(hover:hover){.lg-ans:not(:disabled):hover{background:color-mix(in srgb,var(--lg-ink) 16%,var(--lg-tile))}}
.lg-dots{display:flex;gap:7px;justify-content:center;align-items:center}
.lg-dots i{display:block;width:11px;height:11px;border-radius:6px;border:2px solid var(--lg-ink);box-sizing:border-box}
.lg-dots i.ok{background:var(--lg-ink)}
.lg-dots i.ko{background:color-mix(in srgb,var(--lg-ink) 25%,transparent);border-color:color-mix(in srgb,var(--lg-ink) 45%,transparent)}
.lg-dots i.cur{width:24px}
@keyframes lgGlow{0%{box-shadow:0 0 0 0 color-mix(in srgb,var(--lg-ink) 45%,transparent)}100%{box-shadow:0 0 0 14px transparent}}
@keyframes lgIn{from{transform:translateY(12px);opacity:0}to{transform:none;opacity:1}}
@keyframes lgPop{0%{transform:scale(.92)}60%{transform:scale(1.04)}100%{transform:none}}
@keyframes lgShake{0%,100%{transform:none}25%{transform:translateX(-6px)}75%{transform:translateX(6px)}}
@container (min-width:700px){
  .lg{max-width:820px;gap:24px}
  .lg-q{font-size:40px}
  .lg-q small{font-size:18px}
  .lg-in{min-height:72px}
  .lg-in input{font-size:24px}
  .lg-pbody.two{display:grid;grid-template-columns:3fr 2fr;gap:16px;align-items:start}
  .lg-slots{grid-template-columns:repeat(var(--lg-cols-w,4),minmax(0,1fr));max-width:calc(var(--lg-cols-w,4) * 200px)}
  .lg-slot{min-height:60px;font-size:16px}
  .lg-ans{min-height:150px;font-size:30px}
  .lg-road{flex-direction:row;flex-wrap:wrap;align-items:center;gap:6px}
  .lg-link{width:16px;height:2px;margin:0}
  .lg-gap{width:36px;height:2px;margin:0}
  .lg-stop .n{display:none}
  .lg-stop .tag{margin-left:6px}
}
@media (prefers-reduced-motion: reduce){.lg *{animation:none !important}}
`;

// THE WHITE PAGE (owner, 2026-10-26: "white background versions for the
// individual puzzles"). On its own page a game with the stage board paints
// the light register's ground white instead of the stage's pale grey. The
// client renders this from its first paint (not from the board), so the page
// never changes colour when Start is pressed. The dark register is untouched.
// The ID in :not() is there for weight only: the phone look rules in
// globals.css carry one (html[data-stage-pastel]:not(#sot-x)) and must lose here.
// The dark looks are excluded (owner report, 2026-10-27): the stage register
// is forced light under the look, so data-stage-theme alone said "light" and
// painted these pages white in Black with color too.
const LG_LIGHT = 'html:not(#lg-x):not([data-stage-pastel^="dark"]):not([data-stage-tone^="dark"])';
export const LEG_PAGE_CSS = `${LG_LIGHT} .stage-page.lg-white[data-stage-theme="light"]{--stg-ground:#ffffff !important;background:#ffffff !important}
${LG_LIGHT}:has(.stage-page.lg-white[data-stage-theme="light"]),${LG_LIGHT}:has(.stage-page.lg-white[data-stage-theme="light"]) body{background:#ffffff !important}`;
