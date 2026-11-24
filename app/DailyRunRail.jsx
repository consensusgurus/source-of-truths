'use client';

// DailyRunRail — the thin band under a daily's cap while a DAILY RUN is open
// (lib/daily-run.js, ?run=a,b,c). It names where you are in the run, ticks what
// is played, and once this page's game is finished it raises a bar at the foot
// of the screen that is the next game, so a finished game turns into the next
// one without a trip back to the home.
//
// Renders nothing without ?run= or when this game is not in the run, so an
// ordinary page load costs one mounted component and no request. Mounted once
// in StageChrome, which puts it on every daily.
import React, { useEffect, useState } from 'react';
import { DAILY_GAME_MAP } from '@/lib/daily-games';
import { readDailyRun, dailyRunHref, playedToday, readRunMeta, builtRunHref, isDayMeta, getMyDayItems, isRunItem } from '@/lib/daily-run';
import { validItem, itemDone, itemHref, itemName } from './my-day/dayRuns';

export default function DailyRunRail({ gameKey }) {
  const [keys, setKeys] = useState([]);
  const [played, setPlayed] = useState({});
  // A BUILT run (owner, 2026-11-07) carries its name and maker, &rn= and &rb=.
  const [meta, setMeta] = useState(null);
  // MIND LOFT DAILY WITH RUN PAGES (owner, 2026-11-23): the paper's whole order,
  // games and runs, so "Page n of N" and the next page count the runs too.
  const [paper, setPaper] = useState(null);

  useEffect(() => { setKeys(readDailyRun(window.location.search)); setMeta(readRunMeta(window.location.search)); }, []);

  useEffect(() => {
    if (!keys.length) return undefined;
    const read = () => {
      setPlayed(Object.fromEntries(keys.map((k) => [k, playedToday(k)])));
      if (isDayMeta(readRunMeta(window.location.search))) {
        const items = getMyDayItems().filter(validItem);
        // Only when the saved paper still holds every game on this link.
        setPaper(items.some(isRunItem) && keys.every((k) => items.includes(k)) ? items.map((x) => [x, itemDone(x)]) : null);
      }
    };
    read();
    const id = setInterval(read, 1500);
    return () => clearInterval(id);
  }, [keys]);

  if (!keys.length || !keys.includes(gameKey)) return null;
  const at = keys.indexOf(gameKey);
  const thisDone = !!played[gameKey];
  // Next: the first unplayed game after this one, wrapping, so skipping ahead
  // and coming back still finds the gap.
  const order = [...keys.slice(at + 1), ...keys.slice(0, at)];
  const nextKey = order.find((k) => !played[k]) || null;
  const next = nextKey ? DAILY_GAME_MAP[nextKey] : null;
  let doneCount = keys.filter((k) => played[k]).length;
  let allDone = doneCount === keys.length;
  let total = keys.length;
  let pageAt = at;
  // A paper with run pages: the next page is the next unread one in the
  // paper's own order, game or run, and the paper is complete only once the
  // runs are finished too.
  let nextPage = null;
  if (paper) {
    const order2 = paper.map((x) => x[0]);
    const me = order2.indexOf(gameKey);
    const left = [...paper.slice(me + 1), ...paper.slice(0, me)].filter(([x, d]) => !d && x !== gameKey);
    nextPage = left.length ? left[0][0] : null;
    total = paper.length;
    pageAt = me;
    doneCount = paper.filter(([x, d]) => (x === gameKey ? thisDone : d)).length;
    allDone = doneCount === total;
  }
  const nextRun = nextPage && isRunItem(nextPage) ? nextPage : null;

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: CSS }} />
      <div className="drr" role="navigation" aria-label="Your run">
        <span className="drr-eb">{meta && meta.name ? meta.name : 'Your run'} · {pageAt + 1} of {total}</span>
        <span className={'drr-chips' + (keys.length > 8 ? ' drr-long' : '')}>
          {keys.map((k) => (
            <a key={k} href={dailyRunHref(k, keys, meta)} className={'drr-c' + (k === gameKey ? ' now' : '') + (played[k] ? ' done' : '')}>
              {played[k] ? '✓ ' : ''}{(DAILY_GAME_MAP[k] || {}).name || k}
            </a>
          ))}
        </span>
        {meta ? <a className="drr-x" href={builtRunHref(keys, meta)}>{isDayMeta(meta) ? 'Your Day' : 'Run page'}</a> : null}
        <a className={meta ? 'drr-x drr-x2' : 'drr-x'} href={(DAILY_GAME_MAP[gameKey] || {}).href || '/'}>{isDayMeta(meta) ? 'Leave' : 'Leave run'}</a>
      </div>
      {thisDone ? (
        <div className="drr-bar" role="region" aria-label="Next in your run">
          {allDone && meta ? (
            /* A built run ends on its own page: the head-to-head and the board. */
            <>
              <span className="drr-bt"><b>{isDayMeta(meta) ? 'Day complete' : 'Run complete'}</b><small>{isDayMeta(meta) ? 'Every puzzle done' : meta.by ? `See how you did against ${meta.by}` : 'See how you did'}</small></span>
              <a className="drr-go" href={builtRunHref(keys, meta)}>{isDayMeta(meta) ? 'See Your Results' : 'See Results'}</a>
            </>
          ) : allDone ? (
            <>
              <span className="drr-bt"><b>Run complete</b><small>{keys.length} games played</small></span>
              <a className="drr-go" href="/tests">IQ tests</a>
              <a className="drr-go alt" href="/">Home</a>
            </>
          ) : nextRun ? (
            /* The next page of the paper is a whole run: it opens on its own page. */
            <>
              <span className="drr-bt"><b>Next in your day: {itemName(nextRun)}</b><small>{doneCount} of {total} done</small></span>
              <a className="drr-go" href={itemHref(nextRun, keys)}>Play</a>
            </>
          ) : next ? (
            <>
              <span className="drr-bt"><b>Next in your run: {next.name}</b><small>{doneCount} of {keys.length} played</small></span>
              <a className="drr-go" href={dailyRunHref(nextKey, keys, meta)}>Play</a>
            </>
          ) : null}
        </div>
      ) : null}
    </>
  );
}

const CSS = `
.drr{display:flex;align-items:center;gap:10px;flex-wrap:wrap;padding:7px 20px;border-bottom:1px solid var(--stg-line,rgba(127,127,127,.25));
  font-family:'Manrope',system-ui,sans-serif;font-size:12px;}
/* THE RAIL LINES UP WITH THE TOP BAR (owner, 2026-11-22: "alignment is off in
   header, on the left and on the right ... should align with the back and
   light dark elements"). Where the simple top bar (StageTopBar, .stg-sim) is the
   header, the rail's edges take that bar's edges: 14px on a phone, and on a
   desktop the bar's own centred width, min(1040px, 100vw - 48px). */
@media (max-width:900px){.drr{padding-left:13px;padding-right:13px;}}
html[data-stage-pastel] .stg-top:has(.stg-sim) .drr{padding-left:14px;padding-right:14px;}
@media (min-width:900px){
  html[data-stage-pastel] .stg-top:has(.stg-sim) .drr{--drr-w:min(1040px, calc(100vw - 48px));
    padding-left:max(14px, calc((100% - var(--drr-w)) / 2));padding-right:max(14px, calc((100% - var(--drr-w)) / 2));}
}
@media (min-width:900px) and (max-width:1099px){
  html:not([data-stage-pastel]) .stg-top:has(.stg-sim) .drr{--drr-w:min(1040px, calc(100vw - 48px));
    padding-left:max(14px, calc((100% - var(--drr-w)) / 2));padding-right:max(14px, calc((100% - var(--drr-w)) / 2));}
}
.drr-eb{font-family:'Manrope',ui-monospace,monospace;font-size:10px;letter-spacing:.12em;text-transform:uppercase;color:var(--stg-mute,#8a93a6);}
.drr-chips{display:flex;gap:6px;flex-wrap:wrap;}
.drr-chips.drr-long{flex-wrap:nowrap;overflow-x:auto;max-width:100%;scrollbar-width:none;}
.drr-chips.drr-long::-webkit-scrollbar{display:none;}
.drr-long .drr-c{flex:none;}
.drr-c{padding:3px 9px;border-radius:999px;border:1px solid var(--stg-line,rgba(127,127,127,.3));color:var(--stg-ink2,inherit);
  text-decoration:none;font-weight:700;}
.drr-c.now{border-color:var(--stg-acc-ink, var(--stg-acc));color:var(--stg-acc-ink,var(--stg-acc));}
.drr-c.done{color:var(--stg-mute,#8a93a6);}
.drr-x{margin-left:auto;color:var(--stg-mute,#8a93a6);font-weight:700;text-decoration:none;}
.drr-x2{margin-left:0;}
/* ABOVE THE ENDING (owner report, 2026-11-23: finishing a game in Mind Loft
   Daily "doesn't suggest the next one in line"). The phone ending (StageStick
   .sst) is a full-screen layer at z-index 9000 that stays up, so at 60 this bar
   was drawn underneath it and never seen. 9500 sits above the ending and below
   the safe-area strip (10000). */
.drr-bar{position:fixed;left:50%;bottom:max(14px,calc(env(safe-area-inset-bottom) + 8px));transform:translateX(-50%);z-index:9500;width:min(520px,calc(100vw - 24px));
  display:flex;align-items:center;gap:10px;padding:10px 12px;border-radius:14px;background:var(--stg-ink,#0f172a);color:var(--stg-ground,#fff);
  box-shadow:0 14px 34px -10px rgba(0,0,0,.45);font-family:'Manrope',system-ui,sans-serif;animation:drrUp .45s cubic-bezier(.2,.9,.3,1.2) both;}
.drr-bt{display:flex;flex-direction:column;line-height:1.25;min-width:0;}
.drr-bt b{font-size:14px;font-weight:800;}
.drr-bt small{font-size:11.5px;font-weight:600;opacity:.7;}
.drr-go{margin-left:auto;flex:none;background:var(--stg-acc);color:var(--stg-onramp,#fff);border-radius:10px;padding:9px 16px;font-weight:800;font-size:14px;text-decoration:none;}
.drr-go.alt{margin-left:0;background:transparent;color:inherit;border:1px solid currentColor;}
@keyframes drrUp{from{transform:translate(-50%,130%)}to{transform:translate(-50%,0)}}
@media (prefers-reduced-motion:reduce){.drr-bar{animation:none;}}
`;
