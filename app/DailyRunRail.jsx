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
import { readDailyRun, dailyRunHref, playedToday } from '@/lib/daily-run';

export default function DailyRunRail({ gameKey }) {
  const [keys, setKeys] = useState([]);
  const [played, setPlayed] = useState({});

  useEffect(() => { setKeys(readDailyRun(window.location.search)); }, []);

  useEffect(() => {
    if (!keys.length) return undefined;
    const read = () => setPlayed(Object.fromEntries(keys.map((k) => [k, playedToday(k)])));
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
  const doneCount = keys.filter((k) => played[k]).length;
  const allDone = doneCount === keys.length;

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: CSS }} />
      <div className="drr" role="navigation" aria-label="Your run">
        <span className="drr-eb">Your run · {at + 1} of {keys.length}</span>
        <span className="drr-chips">
          {keys.map((k) => (
            <a key={k} href={dailyRunHref(k, keys)} className={'drr-c' + (k === gameKey ? ' now' : '') + (played[k] ? ' done' : '')}>
              {played[k] ? '✓ ' : ''}{(DAILY_GAME_MAP[k] || {}).name || k}
            </a>
          ))}
        </span>
        <a className="drr-x" href={(DAILY_GAME_MAP[gameKey] || {}).href || '/'}>Leave run</a>
      </div>
      {thisDone ? (
        <div className="drr-bar" role="region" aria-label="Next in your run">
          {allDone ? (
            <>
              <span className="drr-bt"><b>Run complete</b><small>{keys.length} games played</small></span>
              <a className="drr-go" href="/iq">IQ tests</a>
              <a className="drr-go alt" href="/">Home</a>
            </>
          ) : next ? (
            <>
              <span className="drr-bt"><b>Next in your run: {next.name}</b><small>{doneCount} of {keys.length} played</small></span>
              <a className="drr-go" href={dailyRunHref(nextKey, keys)}>Play</a>
            </>
          ) : null}
        </div>
      ) : null}
    </>
  );
}

const CSS = `
.drr{display:flex;align-items:center;gap:10px;flex-wrap:wrap;padding:7px 16px;border-bottom:1px solid var(--stg-line,rgba(127,127,127,.25));
  font-family:'Manrope',system-ui,sans-serif;font-size:12px;}
.drr-eb{font-family:'DM Mono',ui-monospace,monospace;font-size:10px;letter-spacing:.12em;text-transform:uppercase;color:var(--stg-mute,#8a93a6);}
.drr-chips{display:flex;gap:6px;flex-wrap:wrap;}
.drr-c{padding:3px 9px;border-radius:999px;border:1px solid var(--stg-line,rgba(127,127,127,.3));color:var(--stg-ink2,inherit);
  text-decoration:none;font-weight:700;}
.drr-c.now{border-color:var(--stg-acc);color:var(--stg-acc-ink,var(--stg-acc));}
.drr-c.done{color:var(--stg-mute,#8a93a6);}
.drr-x{margin-left:auto;color:var(--stg-mute,#8a93a6);font-weight:700;text-decoration:none;}
.drr-bar{position:fixed;left:50%;bottom:14px;transform:translateX(-50%);z-index:60;width:min(520px,calc(100vw - 24px));
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
