// RUNS AS PAGES OF THE PAPER (owner feedback, 2026-11-23). The client half of
// the `run:<id>` pages lib/daily-run.js stores: what a run page is called, where
// it opens, and whether it is read today. A run's own saved state decides that
// (runDoneToday, the same test the run endings and doors use), so nothing new
// is stored. Client components only: RUN_DOORS lives in a 'use client' module.
import { RUN_DOORS, runDoneToday } from '../circuits/RunDoorPop';
import { RUN_ORDER } from '../circuits/MoreRuns';
import { DAILY_GAME_MAP } from '@/lib/daily-games';
import { isRunItem, runItemId, RUN_ITEM, playedToday, dailyRunHref, DAY_META } from '@/lib/daily-run';

/** Every run a paper can hold, in the runs shelf's order. */
export function dayRunList() {
  return RUN_ORDER.filter((id) => RUN_DOORS[id]).map((id) => dayRun(RUN_ITEM + id));
}

/** A run page's facts, or null when the id is not a run. */
export function dayRun(item) {
  const id = runItemId(item);
  const D = id ? RUN_DOORS[id] : null;
  if (!D) return null;
  return { item: RUN_ITEM + id, id, name: D.name, href: D.href, accent: D.accent || '#7dd3fc', sub: (D.tags || []).map((t) => t[0]).join(' · ') };
}

/** Whether a page of the paper (game or run) is a real, offered page. */
export function validItem(item) {
  return isRunItem(item) ? !!dayRun(item) : !!DAILY_GAME_MAP[item];
}

/** Whether a page is read today on this device. */
export function itemDone(item) {
  return isRunItem(item) ? runDoneToday(runItemId(item)) : playedToday(item);
}

/** Where a page opens. A game opens inside the paper's rail when the paper holds two or more games. */
export function itemHref(item, gameKeys) {
  if (isRunItem(item)) { const r = dayRun(item); return r ? r.href : '/my-day'; }
  const g = DAILY_GAME_MAP[item];
  if (!g) return '/my-day';
  return gameKeys && gameKeys.length >= 2 && gameKeys.includes(item) ? dailyRunHref(item, gameKeys, DAY_META) : g.href;
}

/** A page's printed name. */
export function itemName(item) {
  if (isRunItem(item)) { const r = dayRun(item); return r ? r.name : ''; }
  return (DAILY_GAME_MAP[item] || {}).name || item;
}

/** A small stacked-cards mark in the run's colour, for run pages in lists. */
export function runVars(item) {
  const r = dayRun(item);
  const c = r ? r.accent : '#7dd3fc';
  return { '--gd': c, '--gp': c };
}
export function RunMark({ item, size = 18, sm = false }) {
  return (
    <span className={'br-sw' + (sm ? ' sm' : '')} style={runVars(item)} aria-hidden="true">
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="#0b1b2b" strokeWidth="2" strokeLinejoin="round">
        <rect x="7" y="3" width="12" height="15" rx="2" fill="#fff" />
        <rect x="4" y="6" width="12" height="15" rx="2" fill="#fff" />
      </svg>
    </span>
  );
}
