// Housing Watch data refresh, one PART per call so each stays well inside a
// function's time limit. The cron route (app/api/cron/housing) calls runPart.
//
// A source that fails keeps its previous values, so one bad download never
// blanks a page. Every run records what failed in status.json.
import { fetchFred } from './sources/fred.mjs';
import { fetchListings } from './sources/listings.mjs';
import { fetchSec } from './sources/sec.mjs';
import { fetchMetros } from './sources/metros.mjs';
import { SEGMENTS } from './config.mjs';

export const PARTS = ['macro', ...Object.keys(SEGMENTS).map((k) => `sec-${k}`), 'metros'];

/**
 * store: { get(name) -> object|null, put(name, object) }
 * returns { part, ok, failed, log }
 */
export async function runPart(part, store, { now = new Date(), log: echo } = {}) {
  if (!PARTS.includes(part)) throw new Error(`unknown part "${part}"`);
  const lines = [];
  const log = (s) => { lines.push(s); if (echo) echo(s); };
  const stamp = now.toISOString();
  let failed = [];
  let refreshed = 0;

  if (part === 'macro') {
    const prev = (await store.get('series.json'))?.series ?? {};
    const fred = await fetchFred(log);
    const listings = await fetchListings(log);
    refreshed = Object.keys(fred.series).length + Object.keys(listings.series).length;
    failed = [...fred.failed, ...listings.failed];
    if (refreshed) {
      await store.put('series.json', { updatedAt: stamp, series: { ...prev, ...fred.series, ...listings.series } });
    }
  } else if (part.startsWith('sec-')) {
    const seg = part.slice(4);
    const prevDoc = (await store.get('companies.json')) ?? { companies: {} };
    const sec = await fetchSec(log, [seg]);
    refreshed = Object.keys(sec.companies).length;
    failed = sec.failed;
    if (refreshed) {
      // Re-read right before writing: the segments run minutes apart and share this file.
      const latest = (await store.get('companies.json')) ?? prevDoc;
      await store.put('companies.json', {
        updatedAt: stamp,
        companies: { ...(latest.companies || {}), ...sec.companies },
      });
    }
  } else if (part === 'metros') {
    try {
      const metros = await fetchMetros(log, now);
      await store.put('metros.json', { updatedAt: stamp, ...metros });
      refreshed = metros.metros.length;
    } catch (e) {
      failed = [e.message];
      log(`  metros FAILED (${e.message})`);
    }
  }

  const status = (await store.get('status.json')) ?? {};
  status[part] = { ranAt: stamp, refreshed, failed, log: lines.slice(-80) };
  await store.put('status.json', status);
  return { part, ok: refreshed > 0, refreshed, failed, log: lines };
}
