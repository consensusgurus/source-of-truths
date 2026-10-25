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

import React, { useEffect, useRef, useState } from 'react';
import { RAMP_INK, softGround, categoryColor, gameCategory } from '@/lib/category-ramp';
import { rampFor, LADDER_RAMP } from '@/lib/circuits';
import MindLoftMark from './MindLoftMark';
import { holdRootPaint } from '@/lib/root-paint';
import { holdThemeColor } from '@/lib/theme-color-hold';

// THE STAGE'S OWN LOOK (owner, 2026-10-23): the gauntlet stages always open on
// the pastel ground with dark ink, whatever the site's light/dark setting is.
// The button on the stage is a separate switch with its own key: Plain is a
// white page with black type and nothing coloured. The phone's top and bottom
// bars are painted to match whichever look is on.
import { LOOK_KEY, useStageLook, nextLook, LOOK_NAMES } from '@/lib/stage-look';
export { useStageLook };
export const PLAIN = { bg: '#ffffff', ink: '#111111' };
export const DARK = { bg: '#0b0f1a', ink: '#e9edf4', fill: '#1a2130' };
export function stagePalette(pastel, look) {
  if (look === 'plain') return { ...PLAIN };
  if (look === 'dark') return { bg: DARK.bg, ink: DARK.ink };
  // WHITE PAGE, COLOURED TILES (owner, 2026-10-25): the colour look's page is
  // white; the colour lives on the tiles and cards (`tile`).
  return { bg: '#ffffff', ink: INK, tile: softGround(pastel) };
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
  } else if (chrome.saved) {
    html.style.backgroundColor = chrome.saved.html;
    if (body) body.style.backgroundColor = chrome.saved.body;
    chrome.saved = null;
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
function useStagePalette(pastel, edges) {
  const [look, setLook] = useStageLook();
  const p = stagePalette(pastel, look);
  useStageChrome(p.bg, edges);
  return {
    ...p, look,
    plain: look === 'plain',
    fill: (c) => (look === 'plain' ? PLAIN.bg : look === 'dark' ? DARK.fill : softGround(c)),
    flip: () => setLook(nextLook(look)),
    vars: { '--gsx-bg': p.bg, '--gsx-ink': p.ink, '--gsx-tray': look === 'plain' ? PLAIN.ink : look === 'dark' ? '#1e2636' : INK },
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

function TopBar({ pal, back = '/', backLabel = 'All Puzzles' }) {
  return (
    <div className="gsx-top">
      <a className="gsx-logo" href="/" aria-label="Mind Loft home">
        <MindLoftMark size={30} ink={pal.ink} accent={pal.ink} title="Mind Loft" />
        <span>Mind Loft</span>
      </a>
      <span className="gsx-tr2">
        <a className="gsx-back" href={back}>
          <span aria-hidden="true">&larr;</span> {backLabel}
        </a>
        <ThemeButton pal={pal} />
      </span>
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
export function GauntletCover({ sections = [] }) {
  const c = gateColour(sections);
  return (
    <>
      <div id="gsx-cover" aria-hidden="true" style={{ position: 'fixed', inset: 0, zIndex: 90, background: '#ffffff' }} />
      <script dangerouslySetInnerHTML={{ __html: `try{if(localStorage.getItem('${LOOK_KEY}')==='plain'||localStorage.getItem('${LOOK_KEY}')==='dark'){var e=document.getElementById('gsx-cover');if(e)e.style.background=localStorage.getItem('${LOOK_KEY}')==='dark'?'#0b0f1a':'#ffffff'}}catch(e){}` }} />
    </>
  );
}
// One line per quiz, name then subject (owner, 2026-10-24).
export function GauntletGate({ circuitName, dateLabel, sections = [], lineFor, onStart, fieldLine = null, banner = null, rule = 'A wrong answer ends that quiz and the next one starts.', unit = 'quizzes', headline = null, bandNote = null, lineup = 'Today\u2019s lineup:', startLabel = null, centerpiece = null }) {
  const first = sections[0];
  const pal = useStagePalette(gateColour(sections));
  const word = ['Zero', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten'][sections.length] || String(sections.length);
  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Enter' && !e.metaKey && !e.ctrlKey) { e.preventDefault(); onStart && onStart(); } };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onStart]);
  return (
    <div key={pal.look} className={`gsx gsx-gate${centerpiece ? ' gsx-cp' : ''}`} role="dialog" aria-label={`${circuitName}, start`} style={pal.vars}>
      <style dangerouslySetInnerHTML={{ __html: CSS }} />
      <div className="gsx-col gsx-split">
        <div className="gsx-head gsx-rise">
          <TopBar pal={pal} />
          {banner ? <div className="gsx-banner">{banner}</div> : null}
          <div className="gsx-eye gsx-eye1">{circuitName} · {dateLabel}</div>
          <h1 className="gsx-h1">{headline || <>{word} {unit.charAt(0).toUpperCase() + unit.slice(1)}.<br />One Life in Each.</>}</h1>
          <p className="gsx-lede">{rule} {lineup}</p>
          <div className="gsx-gowrap gsx-wide">
            <button type="button" className="gsx-go" onClick={onStart}>{startLabel || `Start with ${first ? first.name : 'the run'}`}</button>
            {fieldLine ? <div className="gsx-fine">{fieldLine}</div> : null}
          </div>
        </div>
        {/* A run can put its own picture between the title and the lineup (the
            Dojo's doors, owner 2026-10-24); the lineup then stays compact. */}
        {centerpiece ? <div className="gsx-piece">{centerpiece}</div> : null}
        {/* The whole lineup starts the run too (owner, 2026-10-24). */}
        <div className="gsx-bands gsx-bgo" role="button" tabIndex={0} aria-label={`Start with ${first ? first.name : 'the run'}`} onClick={onStart}
          onKeyDown={(e) => { if (e.key === ' ') { e.preventDefault(); onStart && onStart(); } }}>
          {sections.map((s, i) => (
            <div key={s.key} className="gsx-band" style={{ background: pal.fill(rampFor(slotOf(s, i))), animationDelay: `${0.15 + i * 0.07}s` }}>
              <span className="gsx-bn">{i + 1}</span>
              <span className="gsx-bt"><b>{s.name}</b>{lineFor && lineFor(s) ? <i>{lineFor(s)}</i> : null}</span>
              <span className="gsx-bq">{bandNote ? bandNote(s) : `${s.questions.length} Qs`}</span>
            </div>
          ))}
        </div>
        <div className="gsx-gowrap gsx-narrow">
          <button type="button" className="gsx-go" onClick={onStart}>{startLabel || `Start with ${first ? first.name : 'the run'}`}</button>
          {fieldLine ? <div className="gsx-fine">{fieldLine}</div> : null}
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

export function GauntletBetween({ circuitName, sections = [], results = [], lastSec, last, lastMiss, upNext, upIdx = -1, lineFor, stand = null, dwellMs = 20000, held = false, resetKey = 0, onGo, onHold, leaveHref, mathText = (x) => x }) {
  const secs = useCountdown(dwellMs, held, resetKey);
  const fromBg = lastSec ? rampFor(slotOf(lastSec, sections.indexOf(lastSec))) : rampFor(0);
  const pal = useStagePalette(upNext ? rampFor(slotOf(upNext, upIdx)) : fromBg);
  const prev = stagePalette(fromBg, pal.look);
  const doneKeys = new Set(results.map((x) => x && x.key));
  const missed = lastMiss && !lastMiss.cleared;
  return (
    <div key={pal.look} className="gsx gsx-between" role="dialog" aria-label={`Up next, ${upNext ? upNext.name : ''}`} style={{ ...pal.vars, background: prev.bg }}>
      <style dangerouslySetInnerHTML={{ __html: CSS }} />
      <div className="gsx-wipe" style={{ background: pal.bg }}>
        <div className="gsx-col gsx-bcol">
          <TopBar pal={pal} back={leaveHref} backLabel="Leave" />
          <div className="gsx-rise" style={{ animationDelay: '.3s' }}>
            <div className="gsx-prow"><span>{circuitName}</span><span>{results.length} of {sections.length} done</span></div>
            <div className="gsx-strip" style={{ gridTemplateColumns: `repeat(${sections.length}, minmax(0,1fr))` }}>
              {sections.map((s, i) => {
                const isDone = doneKeys.has(s.key);
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
            <div className="gsx-rise gsx-eye2" style={{ animationDelay: '.35s' }}>Up Next · Quiz {upIdx >= 0 ? upIdx + 1 : results.length + 1}</div>
            <div className="gsx-pop">{upNext ? upNext.name : ''}</div>
            {upNext ? <div className="gsx-rise gsx-sub" style={{ animationDelay: '.6s' }}>{lineFor ? lineFor(upNext) : ''} · {upNext.questions.length} questions, one life</div> : null}
          </div>
          <div className="gsx-rise gsx-low" style={{ animationDelay: '.75s' }}>
            {last ? (
              <div className="gsx-last" style={{ background: pal.fill(fromBg) }}>
                <span className="gsx-lt">
                  <b>{lastSec ? lastSec.name : 'That quiz'} {missed ? `ended on question ${last.score + 1}` : 'run clean, no misses'}</b>
                  {missed && lastMiss.q ? <span>The one that got you: {mathText(lastMiss.q)}</span> : null}
                  {missed && lastMiss.right != null ? <span>Answer: <b>{mathText(lastMiss.right)}</b>{lastMiss.timedOut ? ' · the clock ran out' : ''}</span> : null}
                  {stand ? <b className="gsx-st">You&rsquo;d place #{stand.pos} of {Number(stand.field).toLocaleString()} if you stopped here</b> : null}
                </span>
                <span className="gsx-ls">{last.score}<i>right</i></span>
              </div>
            ) : null}
            <div className="gsx-acts">
              <button type="button" className="gsx-go gsx-goc" onClick={onGo}>
                <span>Start {upNext ? upNext.name : ''}</span>
                <span className="gsx-cd" aria-label={held ? 'held' : `starts in ${secs} seconds`}>{held ? '||' : secs}</span>
              </button>
              <div className="gsx-lesser">
                <button type="button" className="gsx-lb" onClick={onHold}>{held ? 'Resume' : 'Hold'}</button>
                <a className="gsx-lb" href={leaveHref}>Leave the run</a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── END ──────────────────────────────────────────────────────────────────
function useCountUp(to, delay, on) {
  const [v, setV] = useState(on ? 0 : to);
  useEffect(() => {
    if (!on) { setV(to); return undefined; }
    let raf = 0;
    const t0 = performance.now() + delay;
    const dur = 900;
    const tick = (now) => {
      const p = Math.max(0, Math.min(1, (now - t0) / dur));
      setV(Math.round(to * (1 - Math.pow(1 - p, 3))));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [to, delay, on]);
  return v;
}

export function GauntletEndStage({
  circuitName, dateLabel, sections = [], results = [], score = 0, title = null,
  rank = null, fieldSize = null, avg = null, top = null, leaderScore = null,
  challenge = null, polymath = null, similar = null, onShare, copied = false,
  onDetails, sweep = true, unitWord = 'right', colLabel = 'Quiz', extra = null,
}) {
  const reduce = typeof window !== 'undefined' && window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const anim = sweep && !reduce;
  const shown = useCountUp(score, anim ? 1500 : 200, !reduce);
  // While the sweep runs, Safari's bars take the colours under them: the
  // first quiz's stripe along the top, the last quiz's along the bottom.
  const [sweeping, setSweeping] = useState(anim && sections.length > 0);
  useEffect(() => {
    if (!sweeping) return undefined;
    const t = setTimeout(() => setSweeping(false), 1500 + Math.max(0, sections.length - 1) * 60);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const [lookNow] = useStageLook();
  const plainNow = lookNow === 'plain';
  const sweepEdges = false && sweeping && !plainNow && lookNow !== 'dark' ? {
    top: softGround(rampFor(slotOf(sections[0], 0))),
    bottom: softGround(rampFor(slotOf(sections[sections.length - 1], sections.length - 1))),
  } : null;
  const pal = useStagePalette((title && title.colour) || '#7dd3fc', sweepEdges);
  const bg = pal.bg;
  const d = (s) => ({ animationDelay: anim ? s : `${Math.max(0, parseFloat(s) - 1.4)}s` });
  const byKey = Object.fromEntries(results.filter(Boolean).map((x) => [x.key, x]));
  const rows = sections.map((s, i) => {
    const res = byKey[s.key];
    const a = avg && avg[s.key] != null ? Number(avg[s.key]) : null;
    const b = top && top[s.key] != null ? Number(top[s.key]) : null;
    return { key: s.key, name: s.name, bg: rampFor(slotOf(s, i)), you: res ? res.score : '–', field: a != null ? (a < 10 ? a.toFixed(1) : Math.round(a)) : '–', best: b != null ? b : '–' };
  });
  const avgTotal = avg ? Math.round(sections.reduce((t, s) => t + (Number(avg[s.key]) || 0), 0)) : null;
  const ahead = rank && fieldSize && fieldSize >= 2 ? Math.max(0, Math.round(((fieldSize - rank) / fieldSize) * 100)) : null;
  return (
    <div key={pal.look} className="gsx gsx-end" role="dialog" aria-label={`${circuitName} finished`} style={pal.vars}>
      <style dangerouslySetInnerHTML={{ __html: CSS }} />
      {anim ? (
        <div className="gsx-show" aria-hidden="true">
          {sections.map((s, i) => <span key={s.key} style={{ background: pal.fill(rampFor(slotOf(s, i))), animationDelay: `${i * 0.06}s` }} />)}
        </div>
      ) : null}
      <div className="gsx-col gsx-ecol">
        <div className="gsx-rise" style={d('1.4s')}><TopBar pal={pal} /></div>
        <div className="gsx-egrid">
          <div className="gsx-eleft">
            <div className="gsx-rise gsx-eye gsx-c" style={d('1.5s')}>{circuitName} · {dateLabel}</div>
            <div className="gsx-rise gsx-score" style={d('1.6s')}>
              <span>{shown}</span>
              <i>{unitWord}</i>
            </div>
            {title ? (
              <div className="gsx-title" style={d('1.9s')}>
                <b style={{ color: bg }}>{title.name}</b>
                {title.line ? <span>{title.line}</span> : null}
              </div>
            ) : null}
            {rank ? (
              <div className="gsx-rise gsx-rank" style={d('2.1s')}>
                #{rank}{fieldSize ? ` of ${Number(fieldSize).toLocaleString()}` : ''}{ahead != null ? ` · ahead of ${ahead}%` : ''}
              </div>
            ) : null}
            <div className="gsx-rise gsx-tray" style={d('2.4s')}>
              {extra}
              {challenge}
              {polymath ? <div className="gsx-poly">{polymath}</div> : null}
            </div>
          </div>
          <div className="gsx-eright">
            <div className="gsx-rise gsx-table" style={d('2.25s')}>
              <div className="gsx-tr gsx-th"><span>{colLabel}</span><span>You</span><span>Field</span><span>Best</span></div>
              {rows.map((x) => (
                <div key={x.key} className="gsx-tr gsx-row" style={{ background: pal.fill(x.bg) }}>
                  <span><b>{x.name}</b></span><span><b>{x.you}</b></span><span>{x.field}</span><span>{x.best}</span>
                </div>
              ))}
              <div className="gsx-tr gsx-tt">
                <span>Total</span><span>{score}</span><span>{avgTotal != null ? avgTotal : '–'}</span><span>{leaderScore != null ? leaderScore : '–'}</span>
              </div>
            </div>
            {similar && similar.href ? (
              <a className="gsx-rise gsx-next" href={similar.href} style={{ ...d('2.5s'), background: pal.fill('#6ee7b7') }}>
                <span><i>One Quick Play Next</i><b>{similar.name}</b></span>
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6" /></svg>
              </a>
            ) : null}
            <div className="gsx-rise gsx-two" style={d('2.6s')}>
              <a className="gsx-ob" href="/">All Daily Puzzles</a>
              <button type="button" className="gsx-ib" onClick={onShare}>{copied ? 'Copied' : 'Share Your Score'}</button>
            </div>
            <button type="button" className="gsx-rise gsx-det" style={d('2.65s')} onClick={onDetails}>See full details</button>
          </div>
        </div>
      </div>
    </div>
  );
}

const CSS = `
.gsx{position:fixed;inset:0;z-index:85;background:var(--gsx-bg);color:var(--gsx-ink);overflow-y:auto;overflow-x:hidden;font-family:Manrope,system-ui,sans-serif;-webkit-tap-highlight-color:transparent}
.gsx{color:var(--gsx-ink)}
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
  .gsx-piece{flex:1 1 auto;min-height:160px;display:flex}
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
.gsx-pop{font-size:80px;line-height:1;font-weight:800;letter-spacing:-.04em;animation:gsxPop .6s cubic-bezier(.2,.8,.2,1) .45s both;overflow-wrap:anywhere}
.gsx-sub{font-size:17px;font-weight:700}
.gsx-low{display:flex;flex-direction:column;gap:14px}
.gsx-last{color:var(--gsx-ink);display:flex;align-items:center;gap:14px;padding:14px 16px;border-radius:16px;border:2px solid var(--gsx-ink)}
.gsx-lt{flex:1;display:flex;flex-direction:column;gap:3px;font-size:13px;font-weight:600;min-width:0}
.gsx-lt b{font-weight:800}
.gsx-st{margin-top:3px;font-variant-numeric:tabular-nums}
.gsx-ls{font-size:30px;font-weight:800;line-height:1;text-align:right;font-variant-numeric:tabular-nums}
.gsx-ls i{display:block;font-style:normal;font-size:12px;font-weight:700;opacity:.75}
.gsx-acts{display:flex;flex-direction:column;gap:10px}
.gsx-cd{display:inline-flex;align-items:center;justify-content:center;min-width:32px;height:32px;border-radius:16px;border:2px solid var(--gsx-bg);font-size:15px;font-variant-numeric:tabular-nums;box-sizing:border-box}
.gsx-lesser{display:flex;gap:10px}
.gsx-lb{flex:1;display:flex;align-items:center;justify-content:center;min-height:46px;border-radius:14px;border:2px solid var(--gsx-ink);background:transparent;color:var(--gsx-ink);font:inherit;font-size:15px;font-weight:800;text-decoration:none;cursor:pointer}
.gsx-lb:hover,.gsx-ob:hover{background:color-mix(in srgb, var(--gsx-ink) 10%, transparent)}
.gsx-show{position:fixed;inset:0;display:flex;flex-direction:column;pointer-events:none;z-index:2}
.gsx-show span{flex:1;animation:gsxSweep 1.5s cubic-bezier(.7,0,.3,1) both}
.gsx-ecol{gap:16px}
.gsx-egrid{display:flex;flex-direction:column;gap:16px}
.gsx-eleft,.gsx-eright{display:flex;flex-direction:column;gap:14px}
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
  .gsx-acts{justify-content:center}
  .gsx-ecol{justify-content:center}
  .gsx-egrid{display:grid;grid-template-columns:minmax(0,1fr) minmax(0,1.1fr);gap:40px;align-items:center}
  .gsx-score span{font-size:132px}
  .gsx-title b{font-size:30px}
  .gsx-tr{min-height:44px;font-size:17px}
}
@media(max-width:400px){.gsx-h1{font-size:32px}.gsx-gate .gsx-h1{font-size:28px}.gsx-pop{font-size:64px}.gsx-score span{font-size:80px}}

.gsx-theme{display:inline-flex;align-items:center;justify-content:center;width:40px;height:40px;border-radius:20px;border:2px solid var(--gsx-ink);background:transparent;color:var(--gsx-ink);cursor:pointer;padding:0;flex:none}
.gsx-theme:hover{background:color-mix(in srgb, var(--gsx-ink) 12%, transparent)}
.gsx-tr2{display:flex;align-items:center;gap:8px}
@media (prefers-reduced-motion: reduce){.gsx *,.gsx{animation:none !important}}
`;
