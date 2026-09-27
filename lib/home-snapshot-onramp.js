// The ink each game's FINISHED tile carries on its category step in the light
// register (see GameCard in app/today/StageToday.jsx). The snapshot's inline
// script needs it before React runs, to mark a tile the reader finished after
// the snapshot was taken; the dark register uses RAMP_INK for every step.
import { DAILY_GAMES } from '@/lib/daily-games';
import { categoryOnrampLight } from '@/lib/category-ramp';

export function onrampMap() {
  const m = {};
  for (const g of DAILY_GAMES) {
    try { m[g.key] = categoryOnrampLight(g.cat); } catch (e) {}
  }
  return m;
}
