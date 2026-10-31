'use client';

// THE GAUNTLET STAGE, AROUND THE QUESTIONS (owner, 2026-10-23): the entry,
// the handover between quizzes and the end screen, drawn in the same style as
// GauntletStage (full screen, the bank's pastel ladder step as the ground, one
// dark ink, Manrope, no white text). From the mockup canvas "Gauntlet Stage:
// Entry, Between, End", which the owner approved ("looks great").
//
// - GauntletGate: today's lineup as coloured bands and one Start button, on
//   the first quiz's colour.
// - GauntletBetween: wipes up in the next quiz's colour; a progress strip, the
//   quiz that just ended, the next quiz's name set large, the live standing
//   and a Start button that counts down to the automatic start.
// - GauntletEndStage: a sweep of the day's colours, the count-up, the title,
//   the rank, one table of you / field / best per quiz, the challenge and the
//   Polymath meter, one quick play next, the Mind Loft logo home and a back
//   link (owner, same night: "make sure there is a mind loft logo in end card
//   to send back to main page, and a link back button too"). "See full
//   details" closes it onto the existing done card underneath.
//
// These only DRAW. RunClient keeps every rule: timing, posting, the verdict
// dwell, hold. They invent nothing either: a figure that is missing drops its
// line, and the trivia total is never shown as "out of" the questions asked.

import React, { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { RAMP_INK, softGround, categoryColor, gameCategory } from '@/lib/category-ramp';
import { rampFor, LADDER_RAMP } from '@/lib/circuits';
import MindLoftMark from './MindLoftMark';
import StageTopBar from './StageTopBar';
import RunRoll from './RunRoll';
import RunFinale from './RunFinale';
import { mathText } from '@/app/MathText';
import { holdRootPaint } from '@/lib/root-paint';
import { holdThemeColor } from '@/lib/theme-color-hold';

// THE STAGE'S OWN LOOK (owner, 2026-10-23): the gauntlet stages always open on
// the pastel ground with dark ink, whatever the site's light/dark setting is.
// The button on the stage is a separate switch with its own key: Plain is a
// white page with black type and nothing coloured. The phone's top and bottom
// bars are painted to match whichever look is on.
import { LOOK_KEY, GAUNTLET_LOOK_KEY, useStageLook, useGauntletLook, nextLook, LOOK_NAMES, isDarkLook } from '@/lib/stage-look';
export { useStageLook, useGauntletLook };
export const PLAIN = { bg: '#ffffff', ink: '#111111' };
export const DARK = { bg: '#0b0f1a', ink: '#e9edf4', fill: '#1a2130' };
export function stagePalette(pastel, look) {
  if (look === 'plain') return { ...PLAIN };
  if (look === 'dark') return { bg: DARK.bg, ink: DARK.ink };
  // Black with color: the near-black page, the colour on the tiles, deepened so light type reads on it.
  if (look === 'darktint') return { bg: DARK.bg, ink: DARK.ink, tile: `color-mix(in srgb, ${softGround(pastel)} 34%, ${DARK.bg})` };
  // FOUR LOOKS (owner, 2026-10-25): 'tint' is a white page with the colour on
  // the tiles and cards (`tile`); 'color' keeps the coloured page.
  if (look === 'tint') return { bg: '#ffffff', ink: INK, tile: softGround(pastel) };
  return { bg: softGround(pastel), ink: INK };
}
// Paints <html>/<body> and the browser's theme-color so Safari's top and
// bottom bars match the stage, and puts both back on unmount.
// Safari (iOS 26 included) does not reliably re-tint its bars when an existing
// theme-color tag's content changes or a CSS variable on <html> changes: the
// switch flipped the page and left the bars on the old colour (owner,
// 2026-10-23). So every change swaps in a FRESH theme-color tag, writes the
// colour straight onto <html> and <body>, and lays a fresh 12px band of the
// colour along both edges for Safari to sample (see below). The page's own tags and backgrounds are
// saved on the first hold and put back when the last stage screen unmounts.
const chrome = { stack: [], saved: null };
// Dark ink on a light stage ground, light ink on a dark one. The colour can be a
// color-mix() string, so the browser resolves it on a probe first.
function inkOn(color) {
  try {
    const p = document.createElement('span');
    p.style.color = color;
    p.style.display = 'none';
    document.body.appendChild(p);
    const v = getComputedStyle(p).color;
    p.remove();
    const n = (v.match(/[\d.]+/g) || []).map(Number);
    if (n.length < 3) return '#111111';
    const [r, g, b] = /color\(srgb/.test(v) ? n.slice(0, 3).map((x) => x * 255) : n.slice(0, 3);
    return (0.299 * r + 0.587 * g + 0.114 * b) > 140 ? '#111111' : '#e9edf4';
  } catch (e) { return '#111111'; }
}
function paintChrome() {
  if (typeof document === 'undefined') return;
  const html = document.documentElement;
  const body = document.body;
  const top = chrome.stack[chrome.stack.length - 1];
  if (top && !chrome.saved) {
    chrome.saved = {
      html: html.style.backgroundColor,
      body: body ? body.style.backgroundColor : '',
    };
  }
  // The page's own theme-color tags never leave <head> (lib/theme-color-hold.js):
  // removing Next's tags crashed the next client navigation.
  if (chrome.release) { chrome.release(); chrome.release = null; }
  if (top) {
    chrome.release = holdThemeColor(top.color);
    html.style.backgroundColor = top.color;
    if (body) body.style.backgroundColor = top.color;
    // THE HEADER MATCHES THE STAGE (owner, 2026-10-26: "if we color blitz and
    // others, the header must match"). The desktop cap (LayoutC's .lc-cap) sits
    // ABOVE a full-screen stage, so it reads these two and takes the stage's
    // ground and ink instead of the site's.
    html.style.setProperty('--chrome-bg', top.color);
    html.style.setProperty('--chrome-ink', inkOn(top.color));
    html.setAttribute('data-stage-chrome', '');
  } else if (chrome.saved) {
    html.style.backgroundColor = chrome.saved.html;
    if (body) body.style.backgroundColor = chrome.saved.body;
    chrome.saved = null;
  }
  if (!top) {
    html.style.removeProperty('--chrome-bg');
    html.style.removeProperty('--chrome-ink');
    html.removeAttribute('data-stage-chrome');
  }
  // Fixed bands on both edges, and THEY are what tints Safari's bars. iOS 26
  // Safari samples the fixed element under each edge (WebKit
  // LocalFrameView::fixedContainerEdges) and, when that element is the size of
  // the viewport (every stage screen is position:fixed inset:0), it KEEPS the
  // colour it already had: that is why the bars froze on the first colour.
  // A full-width band that is not viewport-sized is read fresh, but only if it
  // is taller than 10px (thinner boxes are skipped) and covers the hit point
  // 4px in from the edge. Re-inserting the nodes is what makes Safari look
  // again (adding a fixed element schedules a new sample).
  document.querySelectorAll('[data-gsx-edge]').forEach((n) => n.parentNode && n.parentNode.removeChild(n));
  if (top && body) {
    ['top', 'bottom'].forEach((side) => {
      const d = document.createElement('div');
      d.setAttribute('data-gsx-edge', side);
      d.setAttribute('aria-hidden', 'true');
      d.style.cssText = `position:fixed;left:0;right:0;${side}:0;height:12px;background:${top[side] || top.color};z-index:2147483000;pointer-events:none`;
      body.appendChild(d);
    });
  }
}
// `edges` lets an animation tint the two bars apart for a moment (the end
// sweep runs a different colour along the top and the bottom of the screen).
export function useStageChrome(color, edges) {
  const eTop = edges && edges.top;
  const eBot = edges && edges.bottom;
  useEffect(() => {
    if (!color || typeof document === 'undefined') return undefined;
    const release = holdRootPaint(color);
    const h = { color, top: eTop || color, bottom: eBot || color };
    chrome.stack.push(h);
    paintChrome();
    return () => {
      release();
      const i = chrome.stack.indexOf(h);
      if (i >= 0) chrome.stack.splice(i, 1);
      paintChrome();
    };
  }, [color, eTop, eBot]);
}
// A WHITE-PAGE RUN (Judged, owner 2026-10-30: "a white page with
// category-coloured tiles"). `paper` paints the Color look as White with
// color, so the page stays white and only the tiles carry the colour. The
// look switch still reports and cycles the reader's real look.
function useStagePalette(pastel, edges, paper = false) {
  const [realLook, setLook] = useGauntletLook();
  const look = paper && realLook === 'color' ? 'tint' : realLook;
  const p = stagePalette(pastel, look);
  useStageChrome(p.bg, edges);
  return {
    ...p, look: realLook,
    plain: look === 'plain',
    fill: (c) => (look === 'plain' ? PLAIN.bg : look === 'dark' ? DARK.fill : look === 'darktint' ? `color-mix(in srgb, ${softGround(c)} 34%, ${DARK.bg})` : softGround(c)),
    flip: () => setLook(nextLook(realLook)),
    vars: {
      '--gsx-bg': p.bg, '--gsx-ink': p.ink, '--gsx-tray': look === 'plain' ? PLAIN.ink : isDarkLook(look) ? '#1e2636' : INK,
      // THE TICKET CARD TAKES THE PAGE'S COLOUR, NOT GOLD (owner, 2026-10-25:
      // "the color of this element, gold, kills the page aesthetic"). In the
      // dark tray it is a lighter step of the ground with the page's own ink.
      '--gsx-card': isDarkLook(look) ? '#2a3346' : look === 'plain' ? '#ffffff' : look === 'tint' ? (p.tile || '#ffffff') : `color-mix(in srgb, ${p.bg} 62%, #ffffff)`,
      '--gsx-card-ink': isDarkLook(look) ? '#e9edf4' : look === 'plain' ? PLAIN.ink : INK,
      '--gsx-card-paper': isDarkLook(look) ? '#141a26' : '#ffffff',
    },
  };
}
export function LookButton({ look, onFlip, className = 'gsx-theme' }) {
  const next = LOOK_NAMES[nextLook(look)];
  return (
    <button type="button" className={className} onClick={onFlip} aria-label={`Look: ${LOOK_NAMES[look] || 'Color'}. Switch to ${next}`} title={`Switch to ${next}`}>
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" aria-hidden="true"><circle cx="12" cy="12" r="8.5" /><path d="M12 3.5a8.5 8.5 0 0 1 0 17z" fill="currentColor" stroke="none" /></svg>
    </button>
  );
}
function ThemeButton({ pal }) {
  return <LookButton look={pal.look} onFlip={pal.flip} />;
}

const INK = RAMP_INK;
const slotOf = (s, i) => (s && s.slot != null ? s.slot : i);

// THE SITE'S OWN HEADER (owner, 2026-10-25): "All Puzzles" is gone; the run
// screens carry the same back-arrow + Mind Loft mark pill and look switch as
// every phone stage page (StageTopBar), so a run reads like the rest of the site.
function TopBar({ pal, title = null, sub = null }) {
  return (
    <div className="gsx-top">
      <StageTopBar look={pal.look} onFlip={pal.flip} ink={pal.ink} href="/" title={title} sub={sub} allLooks />
    </div>
  );
}
export { TopBar as GauntletTopBar };

// ── PLAY ─────────────────────────────────────────────────────────────────
// THE RUN'S PLAY PAGE ON THE STAGE (owner, 2026-10-25: every run's entry,
// transition, play page and conclusion in the one style). The page takes the
// current leg's soft pastel step as its ground, the site's header pill sits
// on top with the run name and the leg, a slim strip shows the legs done, and
// the game itself draws below on the light register (dark ink). The game's own
// window and any real photos are left as they are (owner, 2026-10-24); only
// the chrome around them takes the stage look. A quiet `foot` line can carry
// the run total and the clock.
// `pastel` puts every leg on one colour (a run in its category's colour, like
// Judged's Logic rose) instead of each leg's ladder step; `paper` keeps the
// page white on the Color look (see useStagePalette).
export function RunPlayFrame({ sections = [], idx = 0, title, sub = null, foot = null, pastel = null, paper = false, children }) {
  const cur = sections[idx];
  const pal = useStagePalette(pastel || rampFor(slotOf(cur, idx)), undefined, paper);
  const light = !isDarkLook(pal.look);
  return (
    <div key={pal.look} className="gsx-play" data-stage-theme={light ? 'light' : 'dark'} style={{ ...pal.vars, background: pal.bg, color: pal.ink }}>
      <style dangerouslySetInnerHTML={{ __html: CSS }} />
      <div className="gsx-pcol">
        <TopBar pal={pal} title={title} sub={sub} />
        <div className="gsx-strip gsx-pstrip" style={{ gridTemplateColumns: `repeat(${sections.length}, minmax(0,1fr))` }} aria-label={`${idx} of ${sections.length} done`}>
          {sections.map((s, i) => (
            <span key={s.key} className="gsx-seg">
              <span className="gsx-sb" style={{ background: i < idx ? pal.ink : i === idx ? pal.fill(pastel || rampFor(slotOf(s, i))) : 'transparent', borderWidth: i === idx ? 3 : 2, animation: 'none' }} />
              <span className="gsx-sn" style={{ opacity: i <= idx ? 1 : 0.55 }}>{s.name}</span>
            </span>
          ))}
        </div>
      </div>
      <div className="gsx-pbody">{children}</div>
      {foot ? <div className="gsx-pfoot">{foot}</div> : null}
    </div>
  );
}

// ── ENTRY ────────────────────────────────────────────────────────────────
// The entry's ground is a ramp colour NO quiz in today's lineup wears (owner,
// 2026-10-24: on the first quiz's colour its band vanished into the page).
// If every step is taken, the second quiz's colour.
export function gateColour(sections = []) {
  // THE ENTRY WEARS ITS GENRE (owner, 2026-10-24): the category the run's games
  // belong to (Trivia orange, Numbers mint, Word sky), not a free ladder step.
  const tally = {};
  sections.forEach((s) => { const c = s && s.key ? gameCategory(s.key) : null; if (c) tally[c] = (tally[c] || 0) + 1; });
  const top = Object.keys(tally).sort((a, b) => tally[b] - tally[a])[0];
  if (top) return categoryColor(top);
  const used = new Set(sections.map((s, i) => rampFor(slotOf(s, i))));
  const free = LADDER_RAMP.find((c) => !used.has(c));
  if (free) return free;
  return rampFor(slotOf(sections[1], 1));
}
// What the run page paints before it has read its save (owner, 2026-10-24:
// the old load screen showed for a second). Just the entry's ground, full
// screen, so the page opens on the colour the entry is about to use. A tiny
// inline script turns it white at once for a reader on the Plain look.
export function GauntletCover({ sections = [], paper = false }) {
  const c = gateColour(sections);
  return (
    <>
      <div id="gsx-cover" aria-hidden="true" suppressHydrationWarning style={{ position: 'fixed', inset: 0, zIndex: 90, background: paper ? '#ffffff' : softGround(c) }} />
      <script dangerouslySetInnerHTML={{ __html: `try{var L=localStorage.getItem('${GAUNTLET_LOOK_KEY}');if(L&&(L!=='color'||${paper ? 1 : 0})){var D=L==='dark'||L==='darktint';var e=document.getElementById('gsx-cover');if(e)e.style.background=D?'#0b0f1a':'#ffffff'}}catch(e){}` }} />
    </>
  );
}
// One line per quiz, name then subject (owner, 2026-10-24).
// `bandColour` paints every lineup band in one colour (the run's category)
// instead of each leg's ladder step; `paper` as in useStagePalette.
export function GauntletGate({ circuitName, dateLabel, sections = [], lineFor, onStart, fieldLine = null, banner = null, rule = 'A wrong answer ends that quiz and the next one starts.', unit = 'quizzes', headline = null, bandNote = null, lineup = null, startLabel = null, centerpiece = null, after = null, bandColour = null, paper = false }) {
  const first = sections[0];
  const pal = useStagePalette(gateColour(sections), undefined, paper);
  const word = ['Zero', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten'][sections.length] || String(sections.length);
  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Enter' && !e.metaKey && !e.ctrlKey) { e.preventDefault(); onStart && onStart(); } };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onStart]);
  // THE START BUTTON WEARS THE RUN'S CATEGORY, as on every daily's start
  // screen; the two black-and-white looks keep the ink button.
  const cat = gateColour(sections);
  const goStyle = pal.look === 'plain' || pal.look === 'dark' ? undefined : { background: cat, color: '#08222e', border: '2px solid #08222e' };
  const go = <button type="button" className="gsx-go gsx-startgo" style={goStyle} onClick={onStart}>{startLabel || `Start with ${first ? first.name : 'the run'}`}</button>;
  return (
    <div key={pal.look} className={`gsx gsx-gate gsx-gs${centerpiece ? ' gsx-cp' : ''}`} role="dialog" aria-label={`${circuitName}, start`} style={pal.vars}>
      <style dangerouslySetInnerHTML={{ __html: CSS }} />
      {/* THE RUN'S START SCREEN IS THE DAILY START SCREEN (owner, 2026-10-27:
          the runs still had the old start screen). One centred group on every
          width: a small eyebrow, the run's name very large, its short rules,
          the lineup kept compact, and one full-width Start in the category
          colour. The top bar keeps the back arrow, the mark and the look
          switch at the right edge. */}
      <div className="gsx-col gsx-start">
        <TopBar pal={pal} />
        <div className="gsx-sgrp">
          {banner ? <div className="gsx-banner">{banner}</div> : null}
          <div className="gsx-head gsx-rise">
            <div className="gsx-eye gsx-eye1">Daily Run · {dateLabel}</div>
            <h1 className="gsx-h1 gsx-sname">{circuitName}</h1>
            <p className="gsx-lede"><b className="gsx-tag">{headline || <>{word} {unit.charAt(0).toUpperCase() + unit.slice(1)}. One Life in Each.</>}</b> {rule}{lineup ? ` ${lineup}` : ''}</p>
          </div>
          {/* A run's own picture (the Dojo's doors, Judged's gavel), kept small. */}
          {centerpiece ? <div className="gsx-piece">{centerpiece}</div> : null}
          {/* The whole lineup starts the run too (owner, 2026-10-24). */}
          <div className="gsx-bands gsx-bgo" role="button" tabIndex={0} aria-label={`Start with ${first ? first.name : 'the run'}`} onClick={onStart}
            onKeyDown={(e) => { if (e.key === ' ') { e.preventDefault(); onStart && onStart(); } }}>
            {sections.map((s, i) => (
              <div key={s.key} className="gsx-band" style={{ background: pal.fill(bandColour || rampFor(slotOf(s, i))), animationDelay: `${0.15 + i * 0.07}s` }}>
                <span className="gsx-bn">{i + 1}</span>
                <span className="gsx-bt"><b>{s.name}</b>{lineFor && lineFor(s) ? <i>{lineFor(s)}</i> : null}</span>
                <span className="gsx-bq">{bandNote ? bandNote(s) : `${s.questions.length} Qs`}</span>
              </div>
            ))}
          </div>
          <div className="gsx-gowrap">
            {go}
            {after}
          </div>
        </div>
      </div>
    </div>
  );
}

// ── BETWEEN ──────────────────────────────────────────────────────────────
function useCountdown(ms, held, resetKey) {
  const [left, setLeft] = useState(ms);
  const end = useRef(0);
  useEffect(() => { end.current = Date.now() + ms; setLeft(ms); }, [ms, resetKey]);
  useEffect(() => {
    if (held) return undefined;
    const t = setInterval(() => setLeft(Math.max(0, end.current - Date.now())), 250);
    return () => clearInterval(t);
  }, [held, resetKey]);
  return Math.ceil(left / 1000);
}

// GENERAL ENOUGH FOR EVERY RUN (owner, 2026-10-25: "make all consistent").
// The quiz runs pass `last` / `lastMiss` and get the miss card; a run whose
// legs are not one-life quizzes (Price Check, Passport, Judged, Read the Room)
// passes `lastBody` (the card's text) and `lastFig` ({ v, unit }) instead, its
// own `stepWord` ("Tag", "Leg", "Case", "Room") and `nextLine`. `auto={false}`
// drops the countdown and Hold: the page waits for the player's Next (owner,
// 2026-10-16: Judged and Read the Room must not auto-advance).
export function GauntletBetween({ circuitName, sections = [], results = [], lastSec, last, lastMiss, upNext, upIdx = -1, lineFor, stand = null, dwellMs = 20000, held = false, resetKey = 0, onGo, onHold, leaveHref, mathText = (x) => x,
  stepWord = 'Quiz', lastBody = null, lastFig = null, lastExtra = null, nextLine = null, auto = true, doneCount = null, goLabel = null, fine = null, pastel = null, paper = false }) {
  const secs = useCountdown(dwellMs, held || !auto, resetKey);
  const fromBg = pastel || (lastSec ? rampFor(slotOf(lastSec, sections.indexOf(lastSec))) : rampFor(0));
  const pal = useStagePalette(pastel || (upNext ? rampFor(slotOf(upNext, upIdx)) : fromBg), undefined, paper);
  const prev = stagePalette(fromBg, paper && pal.look === 'color' ? 'tint' : pal.look);
  const doneKeys = new Set(results.map((x) => x && x.key));
  const nDone = doneCount != null ? doneCount : results.length;
  const missed = lastMiss && !lastMiss.cleared;
  const sub = nextLine != null ? nextLine : (upNext ? `${lineFor ? lineFor(upNext) : ''}${upNext.questions ? ` · ${upNext.questions.length} questions, one life` : ''}` : '');
  return (
    <div key={pal.look} className="gsx gsx-between" role="dialog" aria-label={`Up next, ${upNext ? upNext.name : ''}`} style={{ ...pal.vars, background: prev.bg }}>
      <style dangerouslySetInnerHTML={{ __html: CSS }} />
      <div className="gsx-wipe" style={{ background: pal.bg }}>
        <div className="gsx-col gsx-bcol">
          <TopBar pal={pal} />
          <div className="gsx-rise" style={{ animationDelay: '.3s' }}>
            <div className="gsx-prow"><span>{circuitName}</span><span>{nDone} of {sections.length} done</span></div>
            <div className="gsx-strip" style={{ gridTemplateColumns: `repeat(${sections.length}, minmax(0,1fr))` }}>
              {sections.map((s, i) => {
                const isDone = doneCount != null ? i < doneCount : doneKeys.has(s.key);
                const isNext = upNext && s.key === upNext.key;
                return (
                  <span key={s.key} className="gsx-seg">
                    <span className="gsx-sb" style={{ background: isDone ? pal.ink : 'transparent', animationDelay: `${0.4 + i * 0.05}s`, borderWidth: isNext ? 3 : 2 }} />
                    <span className="gsx-sn" style={{ opacity: isDone || isNext ? 1 : 0.55 }}>{s.name}</span>
                  </span>
                );
              })}
            </div>
          </div>
          <div className="gsx-mid">
            <div className="gsx-rise gsx-eye2" style={{ animationDelay: '.35s' }}>Up Next · {stepWord} {upIdx >= 0 ? upIdx + 1 : nDone + 1}</div>
            <div className="gsx-pop">{upNext ? upNext.name : ''}</div>
            {upNext && sub ? <div className="gsx-rise gsx-sub" style={{ animationDelay: '.6s' }}>{sub}</div> : null}
          </div>
          <div className="gsx-rise gsx-low" style={{ animationDelay: '.75s' }}>
            {lastBody || last ? (
              <div className="gsx-last" style={{ background: pal.fill(fromBg) }}>
                <span className="gsx-lt">
                  {lastBody || (
                    <>
                      <b>{lastSec ? lastSec.name : 'That quiz'} {missed ? `ended on question ${last.score + 1}` : 'run clean, no misses'}</b>
                      {missed && lastMiss.q ? <span>The one that got you: {mathText(lastMiss.q)}</span> : null}
                      {missed && lastMiss.right != null ? <span>Answer: <b>{mathText(lastMiss.right)}</b>{lastMiss.timedOut ? ' · the clock ran out' : ''}</span> : null}
                    </>
                  )}
                  {stand ? <b className="gsx-st">You&rsquo;d place #{stand.pos} of {Number(stand.field).toLocaleString()} if you stopped here</b> : null}
                </span>
                {lastFig ? <span className="gsx-ls">{lastFig.v}<i>{lastFig.unit}</i></span>
                  : last ? <span className="gsx-ls">{last.score}<i>right</i></span> : null}
              </div>
            ) : null}
            {/* A run can hang one more block under the card about the leg just
                played (Price Check's crowd guess, owner 2026-10-25). */}
            {lastExtra ? <div className="gsx-lx">{lastExtra}</div> : null}
            <div className="gsx-acts">
              <button type="button" className="gsx-go gsx-goc" onClick={onGo}>
                <span>{goLabel || `Start ${upNext ? upNext.name : ''}`}</span>
                {auto ? <span className="gsx-cd" aria-label={held ? 'held' : `starts in ${secs} seconds`}>{held ? '||' : secs}</span> : <span aria-hidden="true">&rarr;</span>}
              </button>
              {auto ? (
                <div className="gsx-lesser">
                  <button type="button" className="gsx-lb" onClick={onHold}>{held ? 'Resume' : 'Hold'}</button>
                  <a className="gsx-lb" href={leaveHref}>Leave the run</a>
                </div>
              ) : null}
            </div>
            {fine ? <div className="gsx-fine gsx-lowfine">{fine}</div> : null}
          </div>
        </div>
      </div>
    </div>
  );
}

// ── END ──────────────────────────────────────────────────────────────────
function useCountUp(to, delay, on, dur = 900, inOut = false, replayKey = 0) {
  const [v, setV] = useState(on ? 0 : to);
  const [fin, setFin] = useState(!on);
  useEffect(() => {
    if (!on) { setV(to); setFin(true); return undefined; }
    setV(0); setFin(false);
    let raf = 0;
    const t0 = performance.now() + delay;
    const tick = (now) => {
      const p = Math.max(0, Math.min(1, (now - t0) / dur));
      const e = inOut ? (p < 0.5 ? 2 * p * p : 1 - Math.pow(-2 * p + 2, 2) / 2) : 1 - Math.pow(1 - p, 3);
      setV(Math.round(to * e));
      if (p < 1) raf = requestAnimationFrame(tick); else setFin(true);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [to, delay, on, dur, inOut, replayKey]);
  return [v, fin];
}

// THE CLIMB TO THE TITLE (owner, 2026-10-25: "run thru the build up to the rank
// title that each earns"). The whole ladder, best rung on top, each rung named
// across (never a vertical bar). As the score counts up every rung it passes
// lights in its colour, the one it is on swells, and when the count lands the
// earned rung turns ink and opens to its line; the rung above says how far
// off it is. `ladder` is bottom to top: [{ min, name, line, colour, chip? }].
function TitleClimb({ ladder, score, shown, landed, pal, heading, onReplay }) {
  const top = ladder.slice().reverse();
  let earned = -1;
  top.forEach((t, i) => { if (earned < 0 && score >= t.min) earned = i; });
  let climbing = -1;
  top.forEach((t, i) => { if (climbing < 0 && shown >= t.min) climbing = i; });
  return (
    <div className="gsx-climb" role="list" aria-label={heading || 'Title ladder'}>
      <div className="gsx-clh"><b>{heading || 'Your title'}</b>{onReplay ? <button type="button" className="gsx-rp" onClick={onReplay}>Replay</button> : null}</div>
      {top.map((t, i) => {
        const lit = shown >= t.min;
        const here = landed && i === earned;
        const cls = 'gsx-rung' + (lit ? ' lit' : '') + (here ? ' here' : '') + (!landed && i === climbing ? ' on' : '');
        let tail = `${t.min}+`;
        if (here) tail = 'You';
        else if (landed && i === earned - 1) tail = `${t.min - score} to go`;
        return (
          <div key={t.name} role="listitem" className={cls} style={{ '--rc': here ? pal.ink : lit ? pal.fill(t.colour) : 'transparent' }}>
            {t.card ? <span className="gsx-rcard" aria-hidden="true">{t.card}</span>
              : <i className="gsx-rchip" style={{ background: t.chip || pal.fill(t.colour) }} aria-hidden="true" />}
            <span className="gsx-rt"><b data-rf={here ? 'title' : undefined}>{t.name}</b>{here && t.line ? <em>{t.line}</em> : null}</span>
            <span className="gsx-rtail">{tail}</span>
          </div>
        );
      })}
    </div>
  );
}

// THE FLASK CLIMB (owner, 2026-10-30: "the filled flask end animation", the
// Science Gauntlet). The same climb as TitleClimb, drawn as an Erlenmeyer
// flask: the liquid rises as the score counts up, taking the colour of each
// title it passes, and the titles are graduation marks on the glass at their
// cutoffs. When the count lands the earned mark turns ink and opens to its
// line, the mark above says how far off it is, and the surface wobbles.
const FLASK_PATH = 'M84 14 L136 14 L136 112 L206 384 Q210 400 194 400 L26 400 Q10 400 14 384 L84 112 Z';
function FlaskClimb({ ladder, score, shown, landed, pal, heading, onReplay, max }) {
  const top = ladder.slice().reverse();
  const cap = Math.max(Number(max) || 0, (ladder[ladder.length - 1] || {}).min + 6 || 50, score);
  const yOf = (v) => 398 - (Math.max(0, Math.min(cap, v)) / cap) * 300;
  let earned = -1;
  top.forEach((t, i) => { if (earned < 0 && score >= t.min) earned = i; });
  let climbing = 0;
  ladder.forEach((t, i) => { if (shown >= t.min) climbing = i; });
  // The liquid is the title's full colour (not its pastel), taken a little
  // toward ink, so it reads on the stage even when the ground wears that same
  // title's pastel.
  const liqRaw = ladder[climbing] ? ladder[climbing].colour : '#e9edf4';
  const liq = pal.look === 'color' ? `color-mix(in srgb, ${liqRaw} 90%, var(--gsx-ink))` : `color-mix(in srgb, ${pal.fill(liqRaw)} 60%, var(--gsx-ink))`;
  const ly = yOf(shown);
  const H = 420, scale = H / 410;
  return (
    <div className="gsx-climb" role="list" aria-label={heading || 'Title ladder'}>
      <div className="gsx-clh"><b>{heading || 'Your title'}</b>{onReplay ? <button type="button" className="gsx-rp" onClick={onReplay}>Replay</button> : null}</div>
      <div className="gsx-flask" style={{ height: H }}>
        <svg className="gsx-fsvg" height={H} viewBox="0 0 220 410" preserveAspectRatio="none" aria-hidden="true">
          <defs><clipPath id="gsxFlaskClip"><path d={FLASK_PATH} /></clipPath></defs>
          <path d={FLASK_PATH} fill="color-mix(in srgb, var(--gsx-ink) 6%, transparent)" />
          <g clipPath="url(#gsxFlaskClip)">
            <rect x="0" y={ly} width="220" height="420" fill={liq} style={{ transition: 'fill .3s ease' }} />
            <rect className={landed ? 'gsx-fwob' : undefined} x="0" y={ly} width="220" height="5" fill="var(--gsx-ink)" opacity=".2" />
            {[60, 110, 150, 90, 132].map((cx, i) => <circle key={i} className={`gsx-bub b${i}`} cx={cx} cy="392" r={[5, 4, 6, 3, 4][i]} fill="#ffffff" opacity=".8" />)}
          </g>
          <path d={FLASK_PATH} fill="none" stroke="var(--gsx-ink)" strokeWidth="4" strokeLinejoin="round" vectorEffect="non-scaling-stroke" />
          <rect x="74" y="4" width="72" height="12" rx="5" fill="var(--gsx-ink)" />
          {ladder.map((t) => {
            const y = yOf(t.min);
            const edge = y < 112 ? 136 : 136 + (y - 112) * (70 / 272);
            return <line key={t.name} x1={edge - 16} x2={edge + 2} y1={y} y2={y} stroke="var(--gsx-ink)" strokeWidth="4" strokeLinecap="round" vectorEffect="non-scaling-stroke" />;
          })}
        </svg>
        {top.map((t, i) => {
          const lit = shown >= t.min;
          const here = landed && i === earned;
          let tail = `${t.min}+`;
          if (here) tail = 'You';
          else if (landed && i === earned - 1) tail = `${t.min - score} to go`;
          return (
            <div key={t.name} role="listitem" className={'gsx-fmk' + (lit ? ' lit' : '') + (here ? ' here' : '')}
              style={{ top: yOf(t.min) * scale, '--rc': here ? 'var(--gsx-ink)' : lit ? pal.fill(t.colour) : 'transparent' }}>
              <span className="gsx-fmt"><b data-rf={here ? 'title' : undefined}>{t.name}</b></span>
              <span className="gsx-rtail">{tail}</span>
            </div>
          );
        })}
      </div>
      {landed && earned >= 0 && top[earned] && top[earned].line ? (
        <div className="gsx-fline"><b>{top[earned].name}.</b> {top[earned].line}</div>
      ) : null}
    </div>
  );
}

export function GauntletEndStage({
  circuitName, dateLabel, sections = [], results = [], score = 0, title = null,
  rank = null, fieldSize = null, avg = null, top = null, leaderScore = null,
  challenge = null, polymath = null, similar = null, onShare, copied = false,
  onDetails, sweep = true, unitWord = 'right', colLabel = 'Quiz', extra = null,
  // THE ONE-PAGE ENDING (owner, 2026-10-25): what used to sit behind "See full
  // details" is on this page now. `board` is today's board (top three, then
  // you), `misses` the question that ended each quiz (missOf, by section
  // index), `more` the other runs still open today.
  board = null, misses = null, more = null, onPractice = null,
  // A run's own card right under today's board (Price Check's week, owner 2026-10-25).
  afterBoard = null,
  // THE CLIMB (owner, 2026-10-25): every run's ending builds up its title
  // ladder. `ladder` is bottom to top; `ladderHeading` names it ("Which
  // shopper are you?"). `rows` overrides the per-leg table for runs whose legs
  // carry their own figures; `topNote` is a line under the rank (Read the
  // Room's early read); `tableTotal` overrides the total row.
  ladder = null, ladderHeading = null, rowsIn = null, topNote = null,
  // THE GIF (owner, 2026-10-25): the meme preview and its share sheet
  // (RunMeme), heading the right column so the two columns balance.
  meme = null,
  // THE PRIZE (owner, 2026-10-25): a picture of what the climb earned (Price
  // Check's payment card), landing under the score when the count does.
  prize = null,
  // THE FLASK (owner, 2026-10-30, the Science Gauntlet): `climbStyle: 'flask'`
  // draws the same climb as an Erlenmeyer flask filling to the score, its
  // graduation marks the titles; `climbMax` is the run's question count.
  climbStyle = null, climbMax = null,
  // ONE COLOUR FOR THE RUN (Judged, owner 2026-10-30): `pastel` grounds the
  // page and the sweep in the run's category colour instead of the earned
  // title's and each leg's ladder step; `paper` as in useStagePalette.
  pastel = null, paper = false,
  // THE RUN FINALE (owner, 2026-10-31): `finale` plays app/RunFinale.jsx over a
  // fresh finish (only when `sweep` is on and there is a ladder): the recap
  // ring, the run's own title piece, then the glide onto this page, which then
  // arrives already landed. { key, legMax: [per section], legSub?, legRanks?:
  // [{ rank, plays }], oneLife?, legWord? }.
  finale = null,
}) {
  const [openRow, setOpenRow] = useState(-1);
  const Climb = climbStyle === 'flask' ? FlaskClimb : TitleClimb;
  // PHONES ROLL (owner, 2026-10-28): see RunRoll.jsx. Desktop is unchanged.
  const [phone, setPhone] = useState(() => typeof window !== 'undefined' && !!window.matchMedia && window.matchMedia('(max-width:899px)').matches);
  useEffect(() => {
    if (!window.matchMedia) return undefined;
    const mq = window.matchMedia('(max-width:899px)');
    const on = () => setPhone(mq.matches);
    on();
    if (mq.addEventListener) mq.addEventListener('change', on);
    return () => { if (mq.removeEventListener) mq.removeEventListener('change', on); };
  }, []);
  const reduce = typeof window !== 'undefined' && window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const climb = !!(ladder && ladder.length);
  // The finale replaces this page's own sweep and count: while it plays the
  // page sits underneath, held (its rises paused, the glide targets hidden);
  // at the glide it is released and its blocks rise in around the standing.
  const finOn = !!(finale && sweep && !reduce && climb && sections.length);
  const [finPhase, setFinPhase] = useState(finOn ? 'play' : 'done');
  const anim = sweep && !reduce && !finOn;
  const [replays, setReplays] = useState(0);
  const [shown, landed] = useCountUp(score, anim ? 1500 : 200, !reduce && !finOn, climb ? 2800 : 900, climb, replays);
  // Everything below the climb waits for it (2.2s more than without one).
  const late = climb && !finOn ? 2.3 : 0;
  // While the sweep runs, Safari's bars take the colours under them: the
  // first quiz's stripe along the top, the last quiz's along the bottom.
  const [sweeping, setSweeping] = useState(anim && sections.length > 0);
  useEffect(() => {
    if (!sweeping) return undefined;
    const t = setTimeout(() => setSweeping(false), 1500 + Math.max(0, sections.length - 1) * 60);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const [lookNow] = useGauntletLook();
  const plainNow = lookNow === 'plain';
  const sweepEdges = sweeping && lookNow === 'color' && !paper ? {
    top: softGround(pastel || rampFor(slotOf(sections[0], 0))),
    bottom: softGround(pastel || rampFor(slotOf(sections[sections.length - 1], sections.length - 1))),
  } : null;
  const pal = useStagePalette(pastel || (title && title.colour) || '#7dd3fc', sweepEdges, paper);
  const bg = pal.bg;
  const d0 = (s) => ({ animationDelay: anim ? s : `${Math.max(0, parseFloat(s) - 1.4)}s` });
  const d = (s) => d0(`${parseFloat(s) >= 1.9 ? parseFloat(s) + late : parseFloat(s)}s`);
  const byKey = Object.fromEntries(results.filter(Boolean).map((x) => [x.key, x]));
  const rows = rowsIn || sections.map((s, i) => {
    const res = byKey[s.key];
    const a = avg && avg[s.key] != null ? Number(avg[s.key]) : null;
    const b = top && top[s.key] != null ? Number(top[s.key]) : null;
    return { key: s.key, name: s.name, bg: pastel || rampFor(slotOf(s, i)), you: res ? res.score : '–', field: a != null ? (a < 10 ? a.toFixed(1) : Math.round(a)) : '–', best: b != null ? b : '–' };
  });
  const avgTotal = avg && Object.keys(avg).length ? Math.round(sections.reduce((t, s) => t + (Number(avg[s.key]) || 0), 0)) : null;
  const ahead = rank && fieldSize && fieldSize >= 2 ? Math.max(0, Math.round(((fieldSize - rank) / fieldSize) * 100)) : null;
  const rankText = rank ? `#${rank}${fieldSize ? ` of ${Number(fieldSize).toLocaleString()}` : ''}${ahead != null ? ` · ahead of ${ahead}%` : ''}` : '';
  const finaleNode = finOn && finPhase !== 'done' ? (() => {
    const fx = finale || {};
    const legs = rows.map((x, i) => {
      const s = sections[i] || {};
      const got = Number(x.you);
      const qn = Array.isArray(s.questions) ? s.questions.length : 0;
      const max = Number(fx.legMax && fx.legMax[i]) || qn || 0;
      const lr = fx.legRanks && fx.legRanks[i];
      return {
        name: x.name, colour: x.bg, got: Number.isFinite(got) ? got : 0, shown: x.you,
        max: max > 0 ? max : null,
        sub: (fx.legSub && fx.legSub[i]) || s.topic || s.subject || '',
        rank: lr && Number.isFinite(lr.rank) ? lr.rank : null, plays: lr && Number.isFinite(lr.plays) ? lr.plays : null,
      };
    });
    // A leg with no known maximum takes an even share of the best leg seen.
    const known = legs.filter((g) => g.max);
    const fallback = known.length ? known.reduce((a, g) => a + g.max, 0) / known.length : Math.max(1, ...legs.map((g) => g.got));
    legs.forEach((g) => { if (!g.max) g.max = Math.max(fallback, g.got, 1); });
    return (
      <RunFinale
        runKey={fx.key} circuitName={circuitName} dateLabel={dateLabel} unitWord={unitWord}
        heading={ladderHeading} legWord={fx.legWord || colLabel} legs={legs} oneLife={!!fx.oneLife}
        score={score} ladder={ladder} rankText={rankText} ink={pal.ink} endBg={pal.bg}
        colorGround={pal.look === 'color' && !paper}
        onGlide={() => setFinPhase('glide')} onDone={() => setFinPhase('done')}
      />
    );
  })() : null;
  const finCls = finPhase === 'play' ? ' gsx-held gsx-fly' : finPhase === 'glide' ? ' gsx-fly' : '';
  const [moveN, setMoveN] = useState(0);
  const leftRef = useRef(null);
  const rightRef = useRef(null);
  const tailRefs = useRef({});
  const moveRef = useRef(0);
  moveRef.current = moveN;
  useIsoLayoutEffect(() => {
    const L = leftRef.current;
    const R = rightRef.current;
    if (!L || !R) return undefined;
    const mq = window.matchMedia('(min-width:900px)');
    const GAP = 14; // .gsx-eleft / .gsx-eright flex gap
    let raf = 0;
    const measure = () => {
      raf = 0;
      if (!mq.matches) { if (moveRef.current) setMoveN(0); return; }
      const ids = ['more', 'all', 'stats'].filter((id) => tailRefs.current[id]);
      const hOf = (id) => tailRefs.current[id].getBoundingClientRect().height + GAP;
      const n0 = Math.min(moveRef.current, ids.length);
      let hl = L.getBoundingClientRect().height;
      let hr = R.getBoundingClientRect().height;
      ids.slice(ids.length - n0).forEach((id) => { const h = hOf(id); hl -= h; hr += h; });
      let n = 0;
      while (n < ids.length) {
        const h = hOf(ids[ids.length - 1 - n]);
        if (hr - hl <= h) break; // moving it would leave the left side the longer one by more
        hl += h; hr -= h; n += 1;
      }
      if (n !== moveRef.current) setMoveN(n);
    };
    const kick = () => { if (!raf) raf = requestAnimationFrame(measure); };
    measure();
    const ro = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(kick) : null;
    if (ro) { ro.observe(L); ro.observe(R); }
    if (mq.addEventListener) mq.addEventListener('change', kick);
    return () => {
      if (raf) cancelAnimationFrame(raf);
      if (ro) ro.disconnect();
      if (mq.removeEventListener) mq.removeEventListener('change', kick);
    };
  }, []);
  const boardCard = board && board.rows && board.rows.length ? (
    <div className="gsx-rise gsx-card gsx-board" style={d('2.2s')}>
      <div className="gsx-ch"><span>Today&rsquo;s board{board.field ? ` · ${Number(board.field).toLocaleString()}` : ''}</span>{board.href ? <a href={board.href}>See all</a> : null}</div>
      {board.rows.map((r, i) => (r.gap ? (
        <div key={'g' + i} className="gsx-br gsx-gap">&middot;&middot;&middot;</div>
      ) : (
        <div key={(r.name || '') + i} className={'gsx-br' + (r.me ? ' me' : '')}>
          <span className="p">#{r.rank}</span><span className="n">{r.me ? 'You' : r.name}</span><span className="s">{r.score}</span>
        </div>
      )))}
    </div>
  ) : null;
  // THE COLUMNS END LEVEL ON DESKTOP (owner, 2026-10-25: "move elements
  // around ... so they fill space more evenly, ideally not overstretch").
  // The right column's tail (more, All Daily Puzzles, the full stats) is
  // movable: blocks go, last first, to the foot of the left column for as
  // long as each move brings the two columns closer to level. Always
  // recomputed from the unmoved baseline, so it settles and never flips back
  // and forth. Phones keep one column and move nothing. Nothing stretches.
  const statsNode = (
    <>
        {/* 5. FULL STATS: quiz by quiz, and the question that ended each */}
        <div className="gsx-rise gsx-table" style={d('2.65s')}>
          <div className="gsx-tr gsx-th"><span>{colLabel}</span><span>You</span><span>Field</span><span>Best</span></div>
          {rows.map((x, i) => {
            const m = misses ? misses[i] : null;
            const can = !!(m && !m.cleared && m.q);
            const open = can && openRow === i;
            return (
              <div key={x.key} className="gsx-rw">
                <button type="button" className={'gsx-tr gsx-row' + (can ? ' can' : '')} style={{ background: pal.fill(x.bg) }}
                  onClick={can ? () => setOpenRow(open ? -1 : i) : undefined} aria-expanded={can ? open : undefined} disabled={!can}>
                  <span><b>{x.name}</b>{can ? <em aria-hidden="true">{open ? ' −' : ' +'}</em> : null}</span><span><b>{x.you}</b></span><span>{x.field}</span><span>{x.best}</span>
                </button>
                {open ? (
                  <div className="gsx-miss">
                    <div className="q">{mathText(m.q)}</div>
                    <div className="a"><b>{mathText(m.right)}</b>{m.yours ? <span> · you said {mathText(m.yours)}</span> : m.timedOut ? <span> · the clock ran out</span> : null}</div>
                  </div>
                ) : null}
              </div>
            );
          })}
          <div className="gsx-tr gsx-tt">
            <span>Total</span><span>{score}</span><span>{avgTotal != null ? avgTotal : '–'}</span><span>{leaderScore != null ? leaderScore : '–'}</span>
          </div>
        </div>
        {misses && misses.some((m) => m && !m.cleared && m.q) ? <div className="gsx-fine">Tap a quiz to see the question that ended it.</div> : null}
        {onPractice ? <button type="button" className="gsx-det" onClick={onPractice}>Practice replay</button> : null}
    </>
  );
  if (phone) {
    // The title the climb earned: the prop when a run passes one, else the
    // highest rung the score reaches.
    let titleName = title && title.name ? title.name : null;
    if (!titleName && climb) {
      ladder.forEach((t) => { if (score >= t.min) titleName = t.name; });
    }
    return (
      <div key={pal.look} className={'gsx gsx-end gsx-roll' + finCls} role="dialog" aria-label={`${circuitName} finished`} style={pal.vars}>
        <style dangerouslySetInnerHTML={{ __html: CSS }} />
        {finaleNode}
        {anim ? (
          <div className="gsx-show" aria-hidden="true">
            {sections.map((s, i) => <span key={s.key} style={{ background: pal.fill(pastel || rampFor(slotOf(s, i))), animationDelay: `${i * 0.06}s` }} />)}
          </div>
        ) : null}
        <div className="gsx-col">
          <RunRoll
            anim={anim}
            arrived={finOn}
            landed={landed}
            shown={shown}
            unitWord={unitWord}
            eyebrow={`${circuitName} · ${dateLabel}`}
            rank={rank}
            fieldSize={fieldSize}
            titleName={titleName}
            climbHero={climb ? <Climb ladder={ladder} score={score} shown={shown} landed={landed} pal={pal} heading={ladderHeading} max={climbMax} /> : null}
            climbDone={climb ? <Climb ladder={ladder} score={score} shown={score} landed pal={pal} heading={ladderHeading} max={climbMax} /> : title ? (
              <div className="gsx-title"><b style={{ color: bg }}>{title.name}</b>{title.line ? <span>{title.line}</span> : null}</div>
            ) : null}
            prize={prize}
            topNote={topNote}
            board={board && board.rows && board.rows.length ? (
              <div className="gsx-card gsx-board">
                <div className="gsx-ch"><span>Today&rsquo;s board{board.field ? ` · ${Number(board.field).toLocaleString()}` : ''}</span>{board.href ? <a href={board.href}>See all</a> : null}</div>
                {board.rows.map((r, i) => (r.gap ? (
                  <div key={'g' + i} className="gsx-br gsx-gap">&middot;&middot;&middot;</div>
                ) : (
                  <div key={(r.name || '') + i} className={'gsx-br' + (r.me ? ' me' : '')}>
                    <span className="p">#{r.rank}</span><span className="n">{r.me ? 'You' : r.name}</span><span className="s">{r.score}</span>
                  </div>
                )))}
              </div>
            ) : null}
            afterBoard={afterBoard}
            stats={<div className="rrl-stats">{statsNode}</div>}
            extra={extra}
            challenge={challenge}
            polymath={polymath}
            meme={meme}
            onShare={onShare}
            copied={copied}
            onPractice={onPractice}
            similar={similar}
            more={more}
          />
        </div>
      </div>
    );
  }
  const tail = [];
  if (more) tail.push({ id: 'more', node: <div className="gsx-rise gsx-card gsx-more" style={d('2.55s')}>{more}</div> });
  tail.push({ id: 'all', node: <a className="gsx-rise gsx-ob" href="/" style={d('2.6s')}>All Daily Puzzles</a> });
  tail.push({ id: 'stats', node: statsNode });
  const renderTail = (t) => (
    <div key={t.id} className="gsx-tb" ref={(el) => { tailRefs.current[t.id] = el; }}>{t.node}</div>
  );
  return (
    <div key={pal.look} className={'gsx gsx-end' + finCls} role="dialog" aria-label={`${circuitName} finished`} style={pal.vars}>
      <style dangerouslySetInnerHTML={{ __html: CSS }} />
      {finaleNode}
      {anim ? (
        <div className="gsx-show" aria-hidden="true">
          {sections.map((s, i) => <span key={s.key} style={{ background: pal.fill(pastel || rampFor(slotOf(s, i))), animationDelay: `${i * 0.06}s` }} />)}
        </div>
      ) : null}
      <div className="gsx-col gsx-ecol">
        <div className="gsx-rise" style={d('1.4s')}><TopBar pal={pal} /></div>
        <div className="gsx-egrid">
          <div className="gsx-eleft" ref={leftRef}>
            <div className="gsx-rise gsx-eye gsx-c" style={d('1.5s')}>{circuitName} · {dateLabel}</div>
            <div className={(finOn ? '' : 'gsx-rise ') + 'gsx-score'} style={finOn ? undefined : d('1.6s')}>
              <span data-rf="score">{shown}</span>
              <i data-rf="unit">{unitWord}</i>
            </div>
            {rank ? (
              <div className={(finOn ? '' : 'gsx-rise ') + 'gsx-rank'} style={finOn ? undefined : d('2.1s')} data-rf="rank">
                {rankText}
              </div>
            ) : null}
            {prize ? <div className={'gsx-prize' + (landed ? ' in' : '')} aria-hidden={landed ? undefined : 'true'}>{prize}</div> : null}
            {topNote ? <div className="gsx-rise gsx-note" style={d('1.7s')}>{topNote}</div> : null}
            {climb ? (
              <div className={finOn ? undefined : 'gsx-rise'} style={finOn ? undefined : d0('1.65s')}>
                <Climb ladder={ladder} score={score} shown={shown} landed={landed} pal={pal} heading={ladderHeading} max={climbMax} onReplay={() => (finOn ? setFinPhase('play') : setReplays((k) => k + 1))} />
              </div>
            ) : title ? (
              <div className="gsx-title" style={d('1.9s')}>
                <b data-rf="title" style={{ color: bg }}>{title.name}</b>
                {title.line ? <span>{title.line}</span> : null}
              </div>
            ) : null}
            {boardCard ? <div className={meme ? 'gsx-bdl' : undefined}>{boardCard}</div> : null}
            {afterBoard}
            {/* 3. CHALLENGE (+ Polymath), and sharing the score */}
            <div className="gsx-rise gsx-tray" style={d('2.4s')}>
              {extra}
              {challenge}
              {polymath ? <div className="gsx-poly">{polymath}</div> : null}
            </div>
            {onShare ? (
              <button type="button" className="gsx-rise gsx-ib gsx-share" style={d('2.45s')} onClick={onShare}>{copied ? 'Copied' : 'Share Your Score'}</button>
            ) : null}
            {tail.slice(tail.length - moveN).map(renderTail)}
          </div>
          <div className="gsx-eright" ref={rightRef}>
            {meme ? <div className="gsx-rise gsx-meme" style={d('2.45s')}>{meme}</div> : null}
            {/* With the GIF on show, today's board sits under it on the right,
                so the two columns come out even (owner, 2026-10-25). */}
            {meme && boardCard ? <div className="gsx-bdr">{boardCard}</div> : null}
            {/* 4. PLAY NEXT */}
            {similar && similar.href ? (
              <a className="gsx-rise gsx-next" href={similar.href} style={{ ...d('2.5s'), background: pal.fill('#6ee7b7') }}>
                <span><i>One Quick Play Next</i><b>{similar.name}</b></span>
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6" /></svg>
              </a>
            ) : null}
            {tail.slice(0, tail.length - moveN).map(renderTail)}
          </div>
        </div>
      </div>
    </div>
  );
}

const useIsoLayoutEffect = typeof window === 'undefined' ? useEffect : useLayoutEffect;

const CSS = `
.gsx{position:fixed;inset:0;z-index:85;background:var(--gsx-bg);color:var(--gsx-ink);overflow-y:auto;overflow-x:hidden;font-family:Manrope,system-ui,sans-serif;-webkit-tap-highlight-color:transparent}
.gsx{color:var(--gsx-ink)}
/* THE FINALE HOLD (app/RunFinale.jsx): under the finale the page waits with its
   rises paused and the glide targets hidden; the glide releases both. */
.gsx-held .gsx-rise,.gsx-held .rrl-r1,.gsx-held .rrl-r2,.gsx-held .rrl.sw{animation-play-state:paused}
.gsx-fly [data-rf]{visibility:hidden}
.gsx a{color:var(--gsx-ink)}
.gsx-col{width:100%;max-width:600px;margin:0 auto;box-sizing:border-box;padding:18px 18px 26px;min-height:100%;display:flex;flex-direction:column;gap:18px}
.gsx-top{display:flex;align-items:center;justify-content:space-between;gap:12px}
.gsx-logo{display:inline-flex;align-items:center;gap:8px;text-decoration:none;font-weight:800;font-size:16px;letter-spacing:-.01em}
.gsx-back{display:inline-flex;align-items:center;gap:6px;min-height:40px;padding:0 14px;border-radius:999px;border:2px solid var(--gsx-ink);text-decoration:none;font-weight:800;font-size:14px}
.gsx-back:hover,.gsx-logo:hover span{text-decoration:underline;text-underline-offset:3px}
.gsx-banner{border-radius:14px;overflow:hidden}
.gsx-banner:empty{display:none}
.gsx-eye{font-size:13px;font-weight:800;letter-spacing:.06em;text-transform:uppercase;opacity:.75}
.gsx-c{text-align:center}
.gsx-h1{margin:0;font-size:38px;line-height:1.05;font-weight:800;letter-spacing:-.02em}
.gsx-lede{margin:0;font-size:15px;line-height:1.4;font-weight:600}
.gsx-head{display:flex;flex-direction:column;gap:12px}
.gsx-bands{display:flex;flex-direction:column;border:2px solid var(--gsx-ink);border-radius:18px;overflow:hidden}
.gsx-band{color:var(--gsx-ink);display:flex;align-items:center;gap:14px;min-height:54px;padding:4px 18px;border-top:2px solid var(--gsx-ink);animation:gsxSlide .55s cubic-bezier(.2,.8,.2,1) both}
.gsx-band:first-child{border-top:0}
.gsx-bn{width:20px;font-size:15px;font-weight:800;opacity:.6}
.gsx-bt{flex:1;display:flex;align-items:baseline;gap:10px;line-height:1.15;min-width:0;white-space:nowrap;overflow:hidden}
.gsx-bt b{font-size:19px;font-weight:800;flex:none}
.gsx-bt i{font-style:normal;font-size:14px;font-weight:700;opacity:.75;min-width:0;overflow:hidden;text-overflow:ellipsis}
.gsx-bgo{cursor:pointer}
.gsx-bgo:hover .gsx-band{filter:brightness(1.04)}
.gsx-bgo:focus-visible{outline:3px solid var(--gsx-ink);outline-offset:3px}
.gsx-eye1{white-space:nowrap;overflow:hidden;text-overflow:ellipsis;padding-bottom:.16em;margin-bottom:-.16em;}
@media(max-width:899px){
  .gsx-gate .gsx-col{gap:12px;padding-top:14px;padding-bottom:18px}
  .gsx-gate .gsx-head{gap:8px}
  .gsx-gate .gsx-eye1{font-size:clamp(11px,3.3vw,13px);letter-spacing:.03em}
  .gsx-gate .gsx-h1{font-size:30px}
  .gsx-gate .gsx-lede{font-size:14px}
  .gsx-gate .gsx-band{min-height:42px;padding:2px 16px;gap:12px}
  .gsx-gate .gsx-bt b{font-size:18px}
  .gsx-gate .gsx-go{min-height:56px;font-size:19px}
  /* Fill the screen (owner, 2026-10-24): the lineup takes whatever height the
     phone leaves, each band growing equally, so nothing sits empty below. */
  .gsx-gate .gsx-col{min-height:100%;min-height:100dvh}
  .gsx-gate .gsx-bands{flex:1 1 auto}
  .gsx-gate .gsx-band{flex:1 1 0;min-height:42px}
  .gsx-gate .gsx-bt b{font-size:clamp(18px,2.6vh,22px)}
  .gsx-gate .gsx-bt i{font-size:clamp(13px,1.9vh,16px)}
  .gsx-gate.gsx-cp .gsx-bands{flex:0 0 auto}
  .gsx-gate.gsx-cp .gsx-band{flex:0 0 auto;min-height:46px}
  .gsx-gate.gsx-cp .gsx-bt b{font-size:17px}
  .gsx-gate.gsx-cp .gsx-bt i{font-size:13px}
  /* The picture never pushes Start below the fold on a phone (owner, 2026-10-25). */
  .gsx-piece{flex:0 1 auto;min-height:0;display:flex}
}
.gsx-bq{font-size:13px;font-weight:800;white-space:nowrap}
.gsx-gowrap{display:flex;flex-direction:column;gap:10px}
.gsx-wide{display:none}
.gsx-go{display:flex;align-items:center;justify-content:center;gap:12px;width:100%;min-height:64px;border-radius:18px;border:0;background:var(--gsx-ink);color:var(--gsx-bg);font:inherit;font-size:21px;font-weight:800;cursor:pointer;transition:transform .1s,background .15s}
.gsx-go:hover{filter:brightness(.86)}.gsx-go:active{transform:scale(.99)}
.gsx-fine{text-align:center;font-size:13px;font-weight:700;opacity:.75}
.gsx-wipe{position:absolute;inset:0;overflow-y:auto;animation:gsxWipe .6s cubic-bezier(.7,0,.2,1) both}
.gsx-bcol{gap:16px}
.gsx-prow{display:flex;justify-content:space-between;font-size:13px;font-weight:800;letter-spacing:.05em;text-transform:uppercase;opacity:.8;margin-bottom:8px}
.gsx-strip{display:grid;gap:5px}
.gsx-seg{display:flex;flex-direction:column;gap:5px;min-width:0}
.gsx-sb{display:block;height:12px;border-radius:6px;border:2px solid var(--gsx-ink);box-sizing:border-box;transform-origin:left;animation:gsxFill .4s ease-out both}
.gsx-sn{font-size:10px;font-weight:800;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;padding-bottom:.16em;margin-bottom:-.16em;}
.gsx-mid{flex:1;display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;gap:8px;padding:0}
.gsx-eye2{font-size:15px;font-weight:800;letter-spacing:.08em;text-transform:uppercase;opacity:.75}
.gsx-pop{font-size:80px;line-height:1.14;padding-bottom:.04em;font-weight:800;letter-spacing:-.04em;animation:gsxPop .6s cubic-bezier(.2,.8,.2,1) .45s both;overflow-wrap:anywhere}
.gsx-sub{font-size:17px;font-weight:700}
.gsx-low{display:flex;flex-direction:column;gap:14px}
.gsx-last{color:var(--gsx-ink);display:flex;align-items:center;gap:14px;padding:14px 16px;border-radius:16px;border:2px solid var(--gsx-ink)}
.gsx-lt{flex:1;display:flex;flex-direction:column;gap:3px;font-size:13px;font-weight:600;min-width:0}
.gsx-lt b{font-weight:800}
.gsx-lx{color:var(--gsx-ink);margin-top:10px}
.gsx-st{margin-top:3px;font-variant-numeric:tabular-nums}
.gsx-ls{font-size:30px;font-weight:800;line-height:1;text-align:right;font-variant-numeric:tabular-nums}
.gsx-ls i{display:block;font-style:normal;font-size:12px;font-weight:700;opacity:.75}
.gsx-acts{display:flex;flex-direction:column;gap:10px}
.gsx-cd{display:inline-flex;align-items:center;justify-content:center;min-width:32px;height:32px;border-radius:16px;border:2px solid var(--gsx-bg);font-size:15px;font-variant-numeric:tabular-nums;box-sizing:border-box}
.gsx-lesser{display:grid;grid-template-columns:minmax(0,1fr) minmax(0,1fr);gap:10px}
.gsx-lb{flex:1;box-sizing:border-box;min-width:0;display:flex;align-items:center;justify-content:center;min-height:46px;border-radius:14px;border:2px solid var(--gsx-ink);background:transparent;color:var(--gsx-ink);font:inherit;font-size:15px;font-weight:800;text-decoration:none;cursor:pointer}
.gsx-lb:hover,.gsx-ob:hover{background:color-mix(in srgb, var(--gsx-ink) 10%, transparent)}
.gsx-show{position:fixed;inset:0;display:flex;flex-direction:column;pointer-events:none;z-index:2}
.gsx-show span{flex:1;animation:gsxSweep 1.5s cubic-bezier(.7,0,.3,1) both}
.gsx-ecol{gap:16px}
.gsx-egrid{display:flex;flex-direction:column;gap:16px}
.gsx-eleft,.gsx-eright{display:flex;flex-direction:column;gap:14px}
.gsx-tb{display:flex;flex-direction:column;gap:14px}
.gsx-score{display:flex;flex-direction:column;align-items:center}
.gsx-score span{display:inline-block;min-width:3ch;text-align:center;font-size:96px;line-height:1;font-weight:800;letter-spacing:-.04em;font-variant-numeric:tabular-nums}
.gsx-score i{font-style:normal;font-size:17px;font-weight:800}
.gsx-title{display:flex;flex-direction:column;align-items:center;gap:6px;padding:14px 18px;border-radius:18px;background:var(--gsx-ink);text-align:center;animation:gsxStamp .55s cubic-bezier(.2,.8,.2,1) both}
.gsx-title b{font-size:26px;font-weight:800;letter-spacing:-.01em}
.gsx-title span{font-size:14px;font-weight:600;color:var(--gsx-bg);opacity:.85}
.gsx-rank{text-align:center;font-size:16px;font-weight:800;font-variant-numeric:tabular-nums}
.gsx-tray{display:flex;flex-direction:column;gap:12px;padding:14px;border-radius:18px;background:var(--gsx-tray);color:#e9edf4;border:2px solid var(--gsx-ink)}
.gsx-tray:empty{display:none}
.gsx-tray a:not([class]){color:#7dd3fc}
.gsx-poly{margin:0}
.gsx-table{border:2px solid var(--gsx-ink);border-radius:16px;overflow:hidden}
.gsx-tr{display:grid;grid-template-columns:minmax(0,1.5fr) repeat(3,minmax(0,1fr));align-items:center;min-height:38px;padding:0 12px;border-top:1px solid color-mix(in srgb, var(--gsx-ink) 35%, transparent);font-size:15px;font-weight:700;font-variant-numeric:tabular-nums}
.gsx-tr>span:not(:first-child){text-align:right}
.gsx-th{min-height:34px;border-top:0;font-size:11px;font-weight:800;letter-spacing:.05em;text-transform:uppercase}
.gsx-row{color:var(--gsx-ink);border-top-color:color-mix(in srgb, var(--gsx-ink) 35%, transparent)}
.gsx-band{border-top-color:var(--gsx-ink)}
.gsx-tt{min-height:42px;border-top:2px solid var(--gsx-ink);font-size:16px;font-weight:800}
.gsx .gsx-next{color:var(--gsx-ink)}
.gsx-next{display:flex;align-items:center;gap:14px;padding:14px 16px;border-radius:16px;border:2px solid var(--gsx-ink);text-decoration:none}
.gsx-next>span{flex:1;display:flex;flex-direction:column;gap:2px}
.gsx-next i{font-style:normal;font-size:12px;font-weight:800;letter-spacing:.05em;text-transform:uppercase;opacity:.75}
.gsx-next b{font-size:19px;font-weight:800}
.gsx-next:hover{filter:brightness(.95)}
.gsx-two{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px}
.gsx-ob,.gsx-ib{display:flex;align-items:center;justify-content:center;min-height:50px;border-radius:14px;font:inherit;font-size:15px;font-weight:800;text-decoration:none;cursor:pointer;text-align:center;padding:0 8px}
.gsx-ob{border:2px solid var(--gsx-ink);background:transparent}
.gsx-ib{border:0;background:var(--gsx-ink);color:var(--gsx-bg)}
.gsx-ib:hover{filter:brightness(.86)}
.gsx-card{border:2px solid var(--gsx-ink);border-radius:16px;padding:12px 14px}
.gsx-ch{display:flex;justify-content:space-between;align-items:baseline;gap:10px;font-size:11.5px;font-weight:800;letter-spacing:.08em;text-transform:uppercase;margin-bottom:4px}
.gsx-ch a{font-size:13px;letter-spacing:0;text-transform:none;text-decoration:underline;text-underline-offset:3px}
.gsx-br{display:grid;grid-template-columns:44px minmax(0,1fr) auto;gap:8px;align-items:center;padding:8px 0;border-top:1px solid color-mix(in srgb, var(--gsx-ink) 25%, transparent);font-size:15px;font-weight:700;font-variant-numeric:tabular-nums}
.gsx-br:nth-child(2){border-top:0}
.gsx-br .p{font-weight:800;opacity:.8}
.gsx-br .n{min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.gsx-br .s{font-weight:800}
.gsx-br.me{background:color-mix(in srgb, var(--gsx-ink) 10%, transparent);border-radius:10px;padding:8px;margin:2px -8px 0;border-top-color:transparent}
.gsx-gap{display:block;text-align:center;padding:2px 0;opacity:.6}
.gsx-share{width:100%}
.gsx-more .mr{margin:0}
.gsx-rw{display:block}
.gsx-row{width:100%;border:0;border-top:1px solid color-mix(in srgb, var(--gsx-ink) 35%, transparent);font:inherit;color:var(--gsx-ink);text-align:left;cursor:default}
.gsx-row{border-radius:0;margin:0;box-sizing:border-box;display:grid}
.gsx-bdr{display:none}
@media(min-width:900px){.gsx-bdl{display:none}.gsx-bdr{display:block}}
.gsx-meme .msh-peek{margin:0;box-shadow:none;border:2px solid var(--gsx-ink);border-radius:16px}
.gsx-meme .msh-peek img{max-height:280px}
.gsx-row.can{cursor:pointer}
.gsx-row.can:hover{filter:brightness(.96)}
.gsx-row:disabled{opacity:1}
.gsx-row em{font-style:normal;font-weight:800;opacity:.7}
.gsx-miss{padding:10px 12px 12px;border-top:1px solid color-mix(in srgb, var(--gsx-ink) 35%, transparent);font-size:14px;font-weight:600;line-height:1.35}
.gsx-miss .a{margin-top:5px;font-size:13.5px}
.gsx-miss .a b{font-weight:800}
.gsx-det{align-self:center;background:none;border:0;padding:8px;color:var(--gsx-ink);font:inherit;font-size:14px;font-weight:800;text-decoration:underline;text-underline-offset:3px;cursor:pointer}
.gsx-rise{animation:gsxRise .5s ease-out both}
@keyframes gsxRise{from{transform:translateY(16px);opacity:0}to{transform:none;opacity:1}}
@keyframes gsxSlide{from{transform:translateX(60px);opacity:0}to{transform:none;opacity:1}}
@keyframes gsxWipe{from{clip-path:inset(0 0 100% 0)}to{clip-path:inset(0 0 0 0)}}
@keyframes gsxPop{0%{transform:scale(.6);opacity:0}70%{transform:scale(1.05);opacity:1}100%{transform:scale(1)}}
@keyframes gsxFill{from{transform:scaleX(0)}to{transform:scaleX(1)}}
@keyframes gsxSweep{0%{transform:translateX(-101%)}45%{transform:none}100%{transform:translateX(101%)}}
@keyframes gsxStamp{0%{transform:scale(1.3);opacity:0}60%{transform:scale(.97);opacity:1}100%{transform:scale(1)}}
@media(min-width:900px){
  .gsx-col{max-width:1040px;padding:24px 32px 32px}
  .gsx-split{display:grid;grid-template-columns:minmax(0,1fr) minmax(0,1fr);gap:56px;align-items:center;align-content:center}
  .gsx-split > .gsx-top{grid-column:1 / -1;grid-row:1;align-self:start;margin-bottom:-28px}
  .gsx-gate:not(.gsx-cp) .gsx-split{align-items:end}
  /* LEFT AND RIGHT SHARE A TOP AND A FOOT (owner, 2026-10-26): the head
     stretches to the lineup's height, the eyebrow sits on the lineup's top
     edge and Start sits on its bottom edge, full width of the column. */
  .gsx-gate:not(.gsx-cp) .gsx-split{align-items:stretch}
  .gsx-gate:not(.gsx-cp) .gsx-head{justify-content:flex-start}
  .gsx-gate:not(.gsx-cp) .gsx-h1{font-size:clamp(60px,6.4vw,78px);line-height:1}
  .gsx-gate:not(.gsx-cp) .gsx-lede{font-size:20px;max-width:none}
  .gsx-gate:not(.gsx-cp) .gsx-wide{margin-top:auto;max-width:none}
  .gsx-gate:not(.gsx-cp) .gsx-wide .gsx-go{min-height:72px;font-size:22px}
  .gsx-gate:not(.gsx-cp) .gsx-band{flex:1 1 auto}
  .gsx-gate .gsx-head{gap:16px}
  .gsx-h1{font-size:60px}
  .gsx-lede{font-size:18px;max-width:440px}
  .gsx-wide{display:flex;max-width:340px;margin-top:8px}
  .gsx-narrow{display:none}
  .gsx-band{min-height:68px;padding:4px 24px}
  .gsx-bt b{font-size:22px}.gsx-bt i{font-size:14px}
  .gsx-bcol{max-width:860px;justify-content:center;gap:28px}
  .gsx-sn{font-size:13px}
  .gsx-pop{font-size:128px}
  .gsx-sub{font-size:21px}
  .gsx-low{display:grid;grid-template-columns:minmax(0,1fr) minmax(0,1fr);gap:16px;align-items:stretch}
  /* EVENLY DISTRIBUTED (owner, 2026-10-25, every run): the result cards share
     the top row at one height (the leg card spans it alone when nothing sits
     beside it), and the buttons take a FULL-WIDTH row under them: Start across
     the whole width, Hold and Leave splitting it evenly beneath. */
  .gsx-low .gsx-last{min-height:100%;box-sizing:border-box}
  .gsx-low .gsx-last:not(:has(+ .gsx-lx)){grid-column:1 / -1}
  .gsx-low .gsx-lx{margin-top:0;display:flex;flex-direction:column}
  .gsx-low .gsx-lx>*{flex:1 1 auto;box-sizing:border-box}
  .gsx-low .gsx-acts{grid-column:1 / -1}
  .gsx-low .gsx-lowfine{grid-column:1 / -1}
  .gsx-ecol{justify-content:center}
  .gsx-egrid{display:grid;grid-template-columns:minmax(0,1fr) minmax(0,1.1fr);gap:40px;align-items:start}
  .gsx-score span{font-size:132px}
  .gsx-title b{font-size:30px}
  .gsx-tr{min-height:44px;font-size:17px}
}
@media(max-width:400px){.gsx-h1{font-size:32px}.gsx-gate .gsx-h1{font-size:28px}.gsx-pop{font-size:64px}.gsx-score span{font-size:80px}}

.gsx-note{align-self:center;display:inline-flex;align-items:center;min-height:30px;padding:2px 12px;border-radius:999px;border:2px solid var(--gsx-ink);font-size:13px;font-weight:800;text-align:center}
.gsx-climb{display:flex;flex-direction:column;gap:6px}
.gsx-clh{display:flex;align-items:center;justify-content:space-between;gap:10px;margin-bottom:2px}
.gsx-clh b{font-size:16px;font-weight:800;min-width:0}
.gsx-rp{flex:none;min-height:32px;padding:0 12px;border-radius:999px;border:2px solid var(--gsx-ink);background:transparent;color:var(--gsx-ink);font:inherit;font-size:13px;font-weight:800;cursor:pointer}
.gsx-rung{display:flex;align-items:center;gap:12px;min-height:44px;padding:6px 14px;border:2px solid var(--gsx-ink);border-radius:12px;box-sizing:border-box;background:var(--rc);color:var(--gsx-ink);opacity:.45;transition:background .25s,color .25s,opacity .25s,transform .3s,padding .3s}
.gsx-rung.lit{opacity:1}
.gsx-rung.on{transform:scale(1.03)}
.gsx-rung.here{opacity:1;color:var(--gsx-bg);padding:12px 14px;transform:scale(1.02)}
.gsx-rcard{flex:none;display:block;width:46px}
.gsx-rung.here .gsx-rcard{width:58px}
.gsx-prize{align-self:center;width:min(250px,72%);opacity:0;transform:translateY(40px) rotate(-10deg) scale(.7)}
.gsx-prize.in{opacity:1;transform:rotate(-3deg);animation:gsxLand .8s cubic-bezier(.2,.9,.25,1) both}
@keyframes gsxLand{0%{opacity:0;transform:translateY(40px) rotate(-10deg) scale(.7)}70%{opacity:1;transform:translateY(-4px) rotate(-2deg) scale(1.02)}100%{opacity:1;transform:rotate(-3deg)}}
.gsx-rchip{flex:none;width:22px;height:22px;border-radius:50%;border:2px solid currentColor;box-sizing:border-box}
.gsx-rt{flex:1;min-width:0;display:flex;flex-direction:column;gap:2px}
.gsx-rt b{font-size:15px;font-weight:800;line-height:1.28;overflow-wrap:anywhere}
.gsx-rung.here .gsx-rt b{font-size:21px}
.gsx-rt em{font-style:normal;font-size:13.5px;font-weight:600;line-height:1.3;overflow-wrap:anywhere}
.gsx-rtail{flex:none;font-size:13px;font-weight:800;white-space:nowrap;font-variant-numeric:tabular-nums}
.gsx-flask{position:relative;width:100%;margin-top:6px}
.gsx-fsvg{position:absolute;left:0;top:0;overflow:visible;width:140px}
@media(min-width:900px){.gsx-fsvg{width:190px}.gsx-flask .gsx-fmk{left:205px}}
.gsx-fmk{position:absolute;left:150px;right:0;transform:translateY(-50%);display:flex;align-items:center;gap:8px;min-height:34px;padding:4px 10px;white-space:nowrap;border:2px solid var(--gsx-ink);border-radius:11px;box-sizing:border-box;background:var(--rc);color:var(--gsx-ink);opacity:.45;transition:background .25s,color .25s,opacity .25s,padding .3s}
.gsx-fmk.lit{opacity:1}
.gsx-fmk.here{opacity:1;color:var(--gsx-bg);z-index:1;box-shadow:0 0 0 3px var(--gsx-ink)}
.gsx-fmt{flex:1;min-width:0;display:flex;flex-direction:column;gap:1px}
.gsx-fmt{overflow:hidden}
.gsx-fmt b{font-size:14px;font-weight:800;line-height:1.2;overflow:hidden;text-overflow:ellipsis}
.gsx-fline{margin-top:10px;font-size:15px;font-weight:600;line-height:1.35;text-align:center;animation:gsxFline .45s ease-out both}
.gsx-fline b{font-weight:800}
@keyframes gsxFline{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:none}}
@media(max-width:380px){.gsx-fmt b{font-size:13px}}
.gsx-bub{animation:gsxBub 2.6s ease-in infinite;transform-box:fill-box}
.gsx-bub.b1{animation-delay:.6s;animation-duration:2.2s}.gsx-bub.b2{animation-delay:1.2s;animation-duration:3s}
.gsx-bub.b3{animation-delay:1.8s;animation-duration:2.4s}.gsx-bub.b4{animation-delay:.3s;animation-duration:2.8s}
@keyframes gsxBub{0%{transform:translateY(0);opacity:0}15%{opacity:.85}100%{transform:translateY(-260px);opacity:0}}
.gsx-fwob{animation:gsxWob .9s ease-in-out 3;transform-box:fill-box;transform-origin:center}
@keyframes gsxWob{0%,100%{transform:scaleY(1)}50%{transform:scaleY(1.6)}}
@media (prefers-reduced-motion: reduce){.gsx-bub,.gsx-fwob{animation:none}}
.gsx .stb{width:100%}

.gsx-play{min-height:100vh;min-height:100dvh;font-family:Manrope,system-ui,sans-serif;display:flex;flex-direction:column;--stg-ground:var(--gsx-bg);--stg-ink:var(--gsx-ink)}
.gsx-play .gsx-pcol{width:100%;max-width:760px;margin:0 auto;box-sizing:border-box;padding:14px 16px 6px;display:flex;flex-direction:column;gap:12px}
.gsx-play .gsx-pbody{flex:1;width:100%;max-width:960px;margin:0 auto;box-sizing:border-box;padding:4px 0 8px}
.gsx-play .gsx-pfoot{text-align:center;font-size:13px;font-weight:700;opacity:.75;padding:6px 16px 18px;font-variant-numeric:tabular-nums}
.gsx-play .gsx-pstrip .gsx-sn{font-size:10.5px}

/* THE TRAY READS IN EVERY WIDTH (2026-10-25): the ticket card in the end
   column is phone-narrow even on desktop, so it takes its phone layout there;
   the tray's own links and buttons are light on its dark ground. */
@media(min-width:561px){
.gsx-tray .tkd-top{flex-wrap:wrap;gap:14px}
.gsx-tray .tkd-tx{flex:1 1 180px}
.gsx-tray .tkd-go{flex:1 1 100%;justify-content:center}
}
.gsx .gsx-tray .pmm-lnk{color:#7dd3fc}
.gsx .gsx-tray .gsx-lb{color:#e9edf4;border-color:#e9edf4}
.gsx-tray .tkd{--tkd-bg:var(--gsx-card);--tkd-ink:var(--gsx-card-ink);--tkd-sub:color-mix(in srgb, var(--gsx-card-ink) 78%, transparent);--tkd-paper:var(--gsx-card-paper);--tkd-go-ink:var(--gsx-card);border:2px solid var(--gsx-card-ink)}
.gsx-rung.on{transform:none;box-shadow:0 0 0 3px var(--gsx-ink)}
.gsx-rung.here{transform:none}

.gsx-theme{display:inline-flex;align-items:center;justify-content:center;width:40px;height:40px;border-radius:20px;border:2px solid var(--gsx-ink);background:transparent;color:var(--gsx-ink);cursor:pointer;padding:0;flex:none}
.gsx-theme:hover{background:color-mix(in srgb, var(--gsx-ink) 12%, transparent)}
.gsx-tr2{display:flex;align-items:center;gap:8px}
/* THE RUN START SCREEN (owner, 2026-10-27): the daily start screen's grammar.
   Everything below is scoped to .gsx-gs so the between and end screens are
   untouched, and it wins over each run's old two-column desktop placement
   because .gsx-start is not a grid. */
.gsx-gs .gsx-start{max-width:640px !important;padding:14px 16px 22px !important;gap:0 !important;min-height:100%}
.gsx-gs .gsx-sgrp{flex:1 1 auto;display:flex;flex-direction:column;justify-content:center;gap:14px;padding:12px 0 8px}
.gsx-gs .gsx-head{gap:6px !important}
.gsx-gs .gsx-eye1{font-size:13px !important;font-weight:700;letter-spacing:.08em !important;text-transform:uppercase;opacity:.7}
.gsx-gs .gsx-sname{font-size:clamp(46px,13.5vw,96px) !important;line-height:.95 !important;font-weight:800;letter-spacing:-.035em;overflow-wrap:anywhere;margin:4px 0 6px !important}
.gsx-gs .gsx-lede{font-size:17px !important;line-height:1.42 !important;font-weight:600;max-width:34em !important}
.gsx-gs .gsx-tag{display:block;font-weight:800;font-size:1.12em;margin-bottom:4px}
.gsx-gs .gsx-piece{flex:0 0 auto !important;display:flex;height:140px;min-height:0;overflow:hidden;border-radius:18px}
.gsx-gs .gsx-piece > *{flex:1 1 auto;height:100%;max-height:none;min-height:0 !important}
.gsx-gs .gsx-bands{flex:0 0 auto !important;border-radius:14px}
.gsx-gs .gsx-band{flex:0 0 auto !important;min-height:40px !important;padding:2px 14px !important;gap:10px !important}
.gsx-gs .gsx-bt b{font-size:16px !important}
.gsx-gs .gsx-bt i{font-size:13px !important}
.gsx-gs .gsx-bq{font-size:12px}
.gsx-gs .gsx-gowrap{display:flex !important;max-width:none !important;margin-top:6px !important}
.gsx-gs .gsx-startgo{min-height:70px !important;font-size:23px !important;border-radius:18px}
.gsx-gs .gsx-startgo:hover{filter:brightness(.95)}
@media(min-width:900px){
  .gsx-gs .gsx-start{max-width:680px !important;padding:24px 24px 32px !important}
  .gsx-gs .gsx-lede{font-size:19px !important}
  .gsx-gs .gsx-band{min-height:46px !important}
  .gsx-gs .gsx-bt b{font-size:18px !important}
  .gsx-gs .gsx-piece{height:170px}
}
@media(max-height:700px){
  .gsx-gs .gsx-piece{display:none !important}
  .gsx-gs .gsx-sname{font-size:clamp(40px,11vw,72px) !important}
}
@media (prefers-reduced-motion: reduce){.gsx *,.gsx{animation:none !important}}
`;
