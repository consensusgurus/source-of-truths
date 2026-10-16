'use client';

// THE ENTRY DOOR (owner, 2026-10-16). A first visit gets it on arrival, and a
// returning reader gets it again once a week (ENTRY_EVERY_MS). Every other
// visit opens straight on the home, with no arrival animation at all.
//
// It replaced app/StageWelcome.jsx, the once-a-day arrival that played the Ramp
// and then stamped the reader's own figures (IQ today, rank, streak, the two
// boards). The owner retired that whole sequence and the reads that fed it on
// the same day, so nothing here fetches anything: the only figures on screen are
// the games left today per skill, from the static registry and this device's own breadcrumbs.
//
// WHAT IT IS: the ten category bands rise and the ground wipes across them (the
// Ramp, kept as a one-time opening), the mark and the three brand lines land,
// and the curtain lifts onto "what do you want to sharpen today?" with one tile
// per SKILL (owner, 2026-10-16; lib/daily-skills.js). A tile starts today's run
// for that skill: up to five unplayed games whose primary skill it is, carried
// game to game as an ordinary daily run (?run=, lib/daily-run.js), so nothing
// new is scored. A skill whose games are all played today opens the home pane
// of its most common category instead. The button at the foot just closes the
// door onto the home as it is.
//
// ALWAYS DARK, whatever the reader's register. The owner asked for the dark
// version for everyone, so every colour here is a literal on the near-black
// ground and the dark ramp, and none of it reads the stage tokens.
//
// THE KEY IS VERSIONED. A future change to who sees this takes a new key, never
// an edit to the gate, or every browser that stamped the old one is shut out.
// ?entry=1 previews it without stamping. A load carrying a #hash is a deep link
// to a section of the home, so it is not interrupted and nothing is stamped:
// the door simply waits for the next plain visit.
//
// IT HOLDS THE OTHER HOME CARDS BACK while it is up: data-sot-modal on <html>
// (GauntletPop and the rest read it) and the .ent-door class (PremierePop and
// the theme bubble poll for it).

import { useEffect, useMemo, useRef, useState } from 'react';
import { DAILY_GAME_MAP, liveDailyKeys } from '@/lib/daily-games';
import { CATEGORY_RAMP, RAMP_INK, RAMP_ORDER } from '@/lib/category-ramp';
import { SKILLS, skillPool, skillRun } from '@/lib/daily-skills';
import { dailyRunHref, playedToday } from '@/lib/daily-run';
import MindLoftMark from './MindLoftMark';
import { etToday } from './useDayStats';

const KEY = 'sot_entry_v1';
// ONCE A WEEK (owner, 2026-10-16): the first visit, then a returning reader
// sees it again when a week has passed since it last showed. The key holds the
// time it last showed, in ms; any other value (or none) counts as never.
export const ENTRY_EVERY_MS = 7 * 24 * 3600 * 1000;
const LIFT_AT = 6600;   // the curtain's hold, then the lift (the three lines arrive one at a time)
const LIFT_MS = 640;

const LINES = ['Sharpen your mind', 'Gain IQ points', 'Elevate your thinking'];

export default function EntryDoor({ onPick }) {
  // null: not showing. 'cur': the curtain is up. 'lift': it is lifting.
  // 'page': the tiles. Nothing renders on the server.
  const [phase, setPhase] = useState(null);
  const timers = useRef([]);
  const btnRef = useRef(null);

  // Per skill: today's run (unplayed, rotated, capped) and the category its
  // pool leans on, for the all-played fallback. Client only: phase is set in an
  // effect, so the server never reads the breadcrumbs.
  const runs = useMemo(() => {
    if (!phase) return {};
    const out = {};
    try {
      const today = etToday();
      for (const sk of SKILLS) {
        const pool = skillPool(sk.id, today);
        const tally = {};
        for (const k of pool) { const c = DAILY_GAME_MAP[k] && DAILY_GAME_MAP[k].cat; if (c) tally[c] = (tally[c] || 0) + 1; }
        const cat = Object.keys(tally).sort((x, y) => tally[y] - tally[x])[0] || null;
        out[sk.id] = { keys: skillRun(sk.id, today, playedToday), pool: pool.length, cat };
      }
    } catch (e) {}
    return out;
  }, [phase]);

  useEffect(() => {
    let preview = false;
    try {
      const sp = new URLSearchParams(window.location.search);
      preview = sp.get('entry') === '1';
      if (!preview) {
        if (sp.get('entry') === '0') return undefined;
        const last = Number(window.localStorage.getItem(KEY)) || 0;
        if (last && Date.now() - last < ENTRY_EVERY_MS) return undefined;
        if (window.location.hash) return undefined;
        window.localStorage.setItem(KEY, String(Date.now()));
      }
    } catch (e) {
      // Storage refused (private mode): the read failing is not evidence it was
      // seen, but a door on every load would be worse, so it stays shut.
      if (!preview) return undefined;
    }
    let still = false;
    try { still = window.matchMedia('(prefers-reduced-motion: reduce)').matches; } catch (e) {}
    setPhase(still ? 'page' : 'cur');
    if (!still) {
      timers.current.push(setTimeout(() => setPhase((p) => (p === 'cur' ? 'lift' : p)), LIFT_AT));
    }
    return () => { timers.current.forEach(clearTimeout); timers.current = []; };
  }, []);

  // The lift ends on the page.
  useEffect(() => {
    if (phase !== 'lift') return undefined;
    const t = setTimeout(() => setPhase('page'), LIFT_MS);
    return () => clearTimeout(t);
  }, [phase]);

  // Hold the page still and the other cards back while the door is up.
  useEffect(() => {
    if (!phase) return undefined;
    const html = document.documentElement;
    const body = document.body;
    const prev = body.style.overflow;
    body.style.overflow = 'hidden';
    try { html.dataset.sotModal = 'entry'; } catch (e) {}
    const onKey = (e) => { if (e.key === 'Escape') close(); };
    window.addEventListener('keydown', onKey);
    return () => {
      body.style.overflow = prev;
      try { if (html.dataset.sotModal === 'entry') delete html.dataset.sotModal; } catch (e) {}
      window.removeEventListener('keydown', onKey);
    };
    // close is stable enough for this: it only calls setPhase.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [!!phase]);

  useEffect(() => {
    if (phase === 'page' && btnRef.current) {
      try { btnRef.current.focus({ preventScroll: true }); } catch (e) {}
    }
  }, [phase]);

  function close() {
    timers.current.forEach(clearTimeout);
    timers.current = [];
    try { window.__sotPopAt = Date.now(); } catch (e) {}
    setPhase(null);
  }
  function skip() {
    setPhase((p) => (p === 'cur' ? 'lift' : p));
  }
  function pick(cat) {
    close();
    if (onPick) {
      try { requestAnimationFrame(() => onPick(cat)); } catch (e) { onPick(cat); }
    }
  }
  // A skill tile starts its run. Two or more games ride ?run=; one game is just
  // that game; none left falls back to the home pane of the skill's category.
  function start(id) {
    const r = runs[id];
    const keys = (r && r.keys) || [];
    if (!keys.length) { pick(r && r.cat); return; }
    close();
    const g = DAILY_GAME_MAP[keys[0]];
    const href = keys.length >= 2 ? dailyRunHref(keys[0], keys) : (g ? g.href : '/');
    try { window.location.assign(href); } catch (e) {}
  }

  if (!phase) return null;
  const curtain = phase === 'cur' || phase === 'lift';

  return (
    <div className="ent-door" role="dialog" aria-modal="true" aria-label="Welcome to Mind Loft">
      <style dangerouslySetInnerHTML={{ __html: CSS }} />
      <div className={'ent-pg' + (phase === 'page' ? ' rise' : '')} aria-hidden={curtain ? 'true' : undefined}>
        <h2 className="ent-ask">What do you want to sharpen today?</h2>
        <ul className="ent-tiles">
          {SKILLS.map((t, i) => {
            const r = runs[t.id] || { keys: [], pool: 0 };
            const n = r.keys.length;
            const meta = n ? `${n} game${n === 1 ? '' : 's'} today` : (r.pool ? 'All played today' : '');
            return (
              <li key={t.id} style={{ '--i': i }}>
                <button type="button" className="ent-tile" style={{ '--c': CATEGORY_RAMP[t.ramp] }} onClick={() => start(t.id)}
                  aria-label={`${t.name}: ${n ? `start a run of ${n}` : 'open the puzzles'}`}>
                  <span className="ent-sk">
                    {t.short ? <><span className="ent-cl">{t.name}</span><span className="ent-cs">{t.short}</span></> : t.name}
                  </span>
                  <span className="ent-meta">
                    <span>{meta}</span>
                    <span className="ent-go" aria-hidden="true">→</span>
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
        <div className="ent-foot">
          <button type="button" ref={btnRef} className="ent-go-all" onClick={close}>
            Proceed to all of today&apos;s puzzles <span aria-hidden="true">→</span>
          </button>
          <p className="ent-h">
            Loft your Mind in the{' '}
            <span className="ent-bn">
              <span className="ent-mk"><MindLoftMark size="1em" ink="#eef2f9" accent="#7dd3fc" title="" /></span>
              Mind <span className="ent-loft">Loft</span>
            </span>
          </p>
        </div>
      </div>

      {curtain ? (
        <div className={'ent-cur run' + (phase === 'lift' ? ' lift' : '')} onClick={skip} aria-hidden="true">
          <div className="ent-bands">
            {RAMP_ORDER.map((c, i) => <span key={c} style={{ '--c': CATEGORY_RAMP[i], '--i': i }} />)}
          </div>
          <div className="ent-wipe" />
          <div className="ent-say">
            <div className="ent-word">
              <MindLoftMark size="1.2em" ink="#eef2f9" accent="#7dd3fc" title="" />
              <span>Mind <span className="ent-loft">Loft</span></span>
            </div>
            <div className="ent-lines">
              {LINES.map((l, i) => <span key={l} style={{ '--i': i }}>{l}</span>)}
            </div>
          </div>
          <div className="ent-ladder">
            {RAMP_ORDER.map((c, i) => <i key={c} style={{ '--c': CATEGORY_RAMP[i], '--i': i }} />)}
          </div>
        </div>
      ) : null}
    </div>
  );
}

const INK = RAMP_INK;
const CSS = `
.ent-door{position:fixed;inset:0;z-index:6000;background:#0b0f1a;color:#eef2f9;font-family:'Manrope',system-ui,-apple-system,sans-serif;-webkit-font-smoothing:antialiased}
.ent-pg{position:absolute;inset:0;box-sizing:border-box;overflow-y:auto;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:clamp(16px,3.4vh,34px);
  padding:max(28px,env(safe-area-inset-top,0px)) max(16px,env(safe-area-inset-right,0px)) max(24px,env(safe-area-inset-bottom,0px)) max(16px,env(safe-area-inset-left,0px))}
.ent-ask{margin:0;font-size:clamp(30px,4.2vw,50px);line-height:1.1;font-weight:800;letter-spacing:-0.03em;text-align:center;text-wrap:balance;max-width:900px;color:#eef2f9}
.ent-foot{display:flex;flex-direction:column;align-items:center;gap:14px}
.ent-h{margin:0;font-size:clamp(17px,1.7vw,21px);font-weight:700;color:#a7b1c4;text-align:center;letter-spacing:-0.01em}
.ent-bn{white-space:nowrap;color:#eef2f9}
.ent-mk{display:inline-block;width:1em;height:1em;vertical-align:-0.14em;margin-right:.16em}
.ent-loft{color:#7dd3fc}
.ent-tiles{width:100%;max-width:960px;display:grid;grid-template-columns:repeat(5,minmax(0,1fr));gap:10px;list-style:none;margin:0;padding:0}
.ent-tiles li{display:flex;min-width:0}
.ent-tile{flex:1;min-width:0;min-height:128px;display:flex;flex-direction:column;justify-content:space-between;gap:16px;text-align:left;padding:16px 16px 14px;border:0;border-radius:10px;cursor:pointer;
  font:inherit;background:var(--c);color:${INK};transition:transform .18s ease,box-shadow .18s ease}
.ent-tile:hover{transform:translateY(-3px);box-shadow:0 12px 26px -14px rgba(0,0,0,.7)}
.ent-tile:focus-visible{outline:3px solid #eef2f9;outline-offset:3px}
.ent-sk{font-size:19px;font-weight:800;letter-spacing:-0.015em;line-height:1.15}
.ent-meta{display:flex;justify-content:space-between;align-items:baseline;gap:8px;font-size:12.5px;font-weight:700}
.ent-meta b{font-weight:800;font-variant-numeric:tabular-nums}
.ent-cs{display:none}
.ent-go{transition:transform .18s ease}
.ent-tile:hover .ent-go{transform:translateX(3px)}
.ent-go-all{display:inline-flex;align-items:center;justify-content:center;gap:10px;padding:16px 28px;border:0;border-radius:999px;cursor:pointer;font:inherit;font-weight:700;font-size:16px;
  background:#7dd3fc;color:${INK};transition:background .18s ease}
.ent-go-all:hover{background:#bae6fd}
.ent-go-all:focus-visible{outline:3px solid #eef2f9;outline-offset:3px}
.ent-pg.rise .ent-ask,.ent-pg.rise .ent-tiles li,.ent-pg.rise .ent-foot{animation:ent-up .55s cubic-bezier(.2,.7,.2,1) both}
.ent-pg.rise .ent-tiles li{animation-delay:calc(.12s + var(--i) * .04s)}
.ent-pg.rise .ent-foot{animation-delay:.6s}
.ent-pg.rise .ent-mk{animation:ent-mk .7s cubic-bezier(.2,.9,.25,1.2) .8s both}
@keyframes ent-up{from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:none}}
@keyframes ent-mk{from{opacity:0;transform:translateX(-.6em) scale(.7)}to{opacity:1;transform:none}}

.ent-cur{position:absolute;inset:0;z-index:2;background:#0b0f1a;overflow:hidden;cursor:pointer}
.ent-bands{position:absolute;inset:0;display:flex}
.ent-bands span{flex:1;background:var(--c);transform:translateY(101%)}
.ent-wipe{position:absolute;inset:0;background:#0b0f1a;transform:scaleX(0);transform-origin:left}
.ent-say{position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:18px;text-align:center;padding:0 20px}
.ent-word{display:flex;align-items:center;gap:14px;font-size:clamp(32px,6vw,54px);font-weight:800;letter-spacing:-0.035em;opacity:0}
.ent-lines{display:flex;flex-direction:column;gap:8px;font-size:clamp(18px,2.5vw,23px);font-weight:600;color:#a7b1c4}
.ent-lines span{opacity:0}
.ent-ladder{position:absolute;left:0;right:0;bottom:0;height:6px;display:flex;opacity:0}
.ent-ladder i{flex:1;background:var(--c);opacity:.25}
.ent-cur.run .ent-bands span{animation:ent-rise .55s cubic-bezier(.2,.8,.2,1) forwards;animation-delay:calc(var(--i) * .06s)}
.ent-cur.run .ent-wipe{animation:ent-wipe .5s cubic-bezier(.7,0,.2,1) 1.15s forwards}
.ent-cur.run .ent-word{animation:ent-stamp .5s cubic-bezier(.2,.9,.25,1.2) 1.6s forwards}
/* ONE AT A TIME (owner, 2026-10-16): each line rises in on its own, 1.1s apart. */
.ent-cur.run .ent-lines span{animation:ent-line .8s cubic-bezier(.2,.7,.2,1) forwards;animation-delay:calc(2.4s + var(--i) * 1.1s)}
.ent-cur.run .ent-ladder{animation:ent-fade .3s ease 2.1s forwards}
.ent-cur.run .ent-ladder i{animation:ent-rung 1.1s ease-in-out infinite;animation-delay:calc(2.1s + var(--i) * .09s)}
.ent-cur.lift{animation:ent-lift ${LIFT_MS}ms cubic-bezier(.7,0,.2,1) forwards}
@keyframes ent-rise{to{transform:translateY(0)}}
@keyframes ent-wipe{to{transform:scaleX(1)}}
@keyframes ent-stamp{from{opacity:0;transform:scale(1.12)}to{opacity:1;transform:none}}
@keyframes ent-fade{to{opacity:1}}
@keyframes ent-line{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:none}}
@keyframes ent-rung{0%,100%{opacity:.25}40%{opacity:1}}
@keyframes ent-lift{from{clip-path:inset(0 0 0 0)}to{clip-path:inset(0 0 100% 0)}}

/* A PHONE FITS ON ONE SCREEN (owner, 2026-10-16). The tiles take whatever height
   the headline and the button leave, five rows of two, so the button is always
   on screen without scrolling. */
@media (max-width:760px){
  .ent-pg{justify-content:flex-start;gap:clamp(12px,2.4vh,22px);padding-top:max(22px,env(safe-area-inset-top,0px));padding-bottom:max(16px,env(safe-area-inset-bottom,0px))}
  .ent-ask{font-size:clamp(26px,8vw,34px)}
  .ent-foot{width:100%;gap:12px}
  .ent-h{font-size:clamp(15px,4.3vw,18px)}
  .ent-tiles{flex:1 1 auto;min-height:0;grid-template-columns:repeat(2,minmax(0,1fr));grid-template-rows:repeat(5,minmax(52px,1fr));gap:8px}
  .ent-tile{min-height:0;gap:6px;padding:11px 12px 10px}
  .ent-sk{font-size:16.5px}
  .ent-meta{font-size:12px}
  .ent-cl{display:none}
  .ent-cs{display:inline}
  .ent-go-all{width:100%;flex:none;padding:15px 18px}
}
@media (max-width:760px) and (max-height:600px){
  .ent-tile{padding:8px 11px}
  .ent-sk{font-size:15px}
}
@media (prefers-reduced-motion:reduce){
  .ent-pg.rise *, .ent-pg.rise .ent-mk{animation:none!important}
}
`;
