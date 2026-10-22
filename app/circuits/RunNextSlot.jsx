'use client';

// THE SLOT BESIDE THE CHALLENGE on every run's scorecard (owner, 2026-10-20).
// On a Polymath leg (the Trivia, Math and English Gauntlets) it is the Polymath
// meter while the three are still in progress, and on the run that completes
// them, so the reveal plays there. Once the title was already revealed on an
// earlier visit, or on any run that is not a Polymath leg, it lists what to play
// next: the other runs still open today, then the dailies this device has not
// finished, the run's own categories first. Read from local saves in an effect,
// so the server and the first paint agree.

import { useEffect, useState } from 'react';
import PolymathMeter from './PolymathMeter';
import { POLY_IDS, etToday } from '@/lib/polymath';
import { RUN_DOORS, runDoneToday } from './RunDoorPop';
import { RUN_ORDER } from './MoreRuns';
import { DAILY_GAME_MAP, liveDailyKeys } from '@/lib/daily-games';
import { categoryColor } from '@/lib/category-ramp';

const CSS = `
.rns{border:1px solid var(--rs-line,rgba(255,255,255,.12));border-radius:14px;padding:14px 14px 10px;background:var(--rs-surf,rgba(255,255,255,.04));
  color:var(--rs-ink,#e9edf4);font-family:Manrope,system-ui,-apple-system,sans-serif}
.rns-eb{font-size:11px;font-weight:800;letter-spacing:.13em;text-transform:uppercase;color:var(--rs-mute,#9aa8c4);margin:0 0 8px}
.rns a{display:flex;align-items:center;gap:10px;padding:9px 2px;border-top:1px solid var(--rs-line,rgba(255,255,255,.12));text-decoration:none;color:inherit}
.rns a:first-of-type{border-top:none}
.rns i{flex:none;width:4px;align-self:stretch;border-radius:2px;background:var(--a)}
.rns span{flex:1;min-width:0}
.rns b{display:block;font-size:14.5px;font-weight:800;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.rns small{display:block;font-size:12px;font-weight:700;color:var(--rs-mute,#9aa8c4);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.rns em{font-style:normal;font-size:13px;font-weight:800;color:var(--rs-me,#7dd3fc);white-space:nowrap}
.rns a:hover b{text-decoration:underline;text-underline-offset:3px}
.rns-done{font-size:13px;font-weight:700;color:var(--rs-mute,#9aa8c4);margin:4px 0}
.rns .pmm{margin:0}
`;

function dailyDone(key, day) {
  try {
    const b = JSON.parse(localStorage.getItem(`sot_${key}_day`) || 'null');
    return !!(b && b.d === day && b.done);
  } catch (e) { return false; }
}

export default function RunNextSlot({ circuitId, right = 0, exclude = [], cats = [], max = 4 }) {
  const [mode, setMode] = useState(null);
  const [items, setItems] = useState([]);
  const exKey = exclude.join(',');
  const catKey = cats.join(',');

  useEffect(() => {
    const day = etToday();
    // A POLYMATH LEG ALWAYS ENDS ON THE METER (owner, 2026-10-22). It used to
    // step aside once the day's reveal had been seen, but the board-top meter
    // on the same page writes that flag first, so the run that completed all
    // three showed no Polymath at all. The meter carries the title once earned.
    if (POLY_IDS.includes(circuitId)) { setMode('poly'); return; }
    const runs = RUN_ORDER.filter((id) => id !== circuitId && RUN_DOORS[id] && !runDoneToday(id))
      .map((id) => ({ key: `run:${id}`, href: RUN_DOORS[id].href, name: RUN_DOORS[id].name, sub: RUN_DOORS[id].eyebrow || 'Daily run', accent: RUN_DOORS[id].accent, go: 'Start' }));
    const skip = new Set(exKey ? exKey.split(',') : []);
    const want = catKey ? catKey.split(',') : [];
    const open = liveDailyKeys(day).filter((k) => !skip.has(k) && DAILY_GAME_MAP[k] && !dailyDone(k, day));
    open.sort((a, b) => {
      const ca = want.indexOf(DAILY_GAME_MAP[a].cat); const cb = want.indexOf(DAILY_GAME_MAP[b].cat);
      return (ca < 0 ? 99 : ca) - (cb < 0 ? 99 : cb);
    });
    const games = open.map((k) => {
      const g = DAILY_GAME_MAP[k];
      return { key: `g:${k}`, href: g.href || `/${k}`, name: g.name, sub: g.tag || g.cat, accent: categoryColor(g.cat), go: 'Play' };
    });
    const nRuns = Math.min(runs.length, Math.max(2, max - Math.min(games.length, 2)));
    setItems([...runs.slice(0, nRuns), ...games].slice(0, max));
    setMode('links');
  }, [circuitId, right, exKey, catKey, max]);

  if (!mode) return null;
  if (mode === 'poly') return <PolymathMeter circuitId={circuitId} right={right} />;
  const anyRun = items.some((x) => x.key.startsWith('run:'));
  return (
    <section className="rns" aria-label="Play next">
      <style dangerouslySetInnerHTML={{ __html: CSS }} />
      <div className="rns-eb">{anyRun ? 'More runs and puzzles today' : 'More puzzles today'}</div>
      {items.length ? items.map((x) => (
        <a key={x.key} href={x.href} style={{ '--a': x.accent }}>
          <i aria-hidden="true" />
          <span><b>{x.name}</b><small>{x.sub}</small></span>
          <em>{x.go} &rsaquo;</em>
        </a>
      )) : <p className="rns-done">You have played everything today. New puzzles open at midnight Eastern.</p>}
    </section>
  );
}
