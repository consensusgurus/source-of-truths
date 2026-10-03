import { NextResponse } from 'next/server';
import { buildSiteStats } from '@/lib/sitestats-build';
import { readPayload, writePayload } from '@/lib/stats-payloads';

export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';
export const maxDuration = 60;

// GET /api/sitestats            -> the /sitestats payload (public, aggregate only)
// GET /api/sitestats?refresh=1  -> rebuild now (if the stored copy is over a minute old)
//
// ANSWER FIRST, REFRESH SECOND (2026-10-02). A build costs several database
// aggregates and measured 28.6s uncached. The page used to wait for it. Now
// the last built payload is kept (in this lambda, and in stats_payloads so a
// cold lambda has it too) and the route hands that back at once:
//   - under FRESH_MS old: returned as is, CDN-cacheable for what is left of
//     its fresh window.
//   - older: returned with `stale: true`. The page shows it and then asks for
//     ?refresh=1 in the background and swaps the new figures in.
//   - nothing stored (first run, or migration 59 not applied and a cold
//     lambda): built while the caller waits, which is the old behaviour.
// ?refresh=1 never rebuilds a copy under REBUILD_FLOOR_MS old, so the public
// URL cannot be used to queue builds back to back.
const KEY = 'sitestats:v1';
const FRESH_MS = 5 * 60 * 1000;
const REBUILD_FLOOR_MS = 60 * 1000;
const RECHECK_MS = 20 * 1000;

let mem = null;        // { payload, at }
let memCheckedAt = 0;  // last time the stored row was consulted
let inflight = null;

const atOf = (payload) => Date.parse((payload && payload.generatedAt) || '') || 0;

async function latest() {
  const now = Date.now();
  if (mem && now - memCheckedAt < RECHECK_MS) return mem;
  memCheckedAt = now;
  const stored = await readPayload(KEY);
  if (stored && stored.payload) {
    const at = atOf(stored.payload);
    if (!mem || at > mem.at) mem = { payload: stored.payload, at };
  }
  return mem;
}

function rebuild(prev) {
  if (!inflight) {
    inflight = (async () => {
      const payload = await buildSiteStats(prev);
      mem = { payload, at: atOf(payload) };
      memCheckedAt = Date.now();
      await writePayload(KEY, payload);
      return payload;
    })().finally(() => { inflight = null; });
  }
  return inflight;
}

export async function GET(request) {
  let refresh = false;
  try { refresh = new URL(request.url).searchParams.get('refresh') === '1'; } catch (e) { /* no-op */ }

  const cur = await latest();
  const age = cur ? Date.now() - cur.at : Infinity;

  if (cur && (refresh ? age < REBUILD_FLOOR_MS : age < FRESH_MS)) {
    const left = refresh ? 0 : Math.max(10, Math.floor((FRESH_MS - age) / 1000));
    return NextResponse.json(cur.payload, {
      headers: { 'Cache-Control': refresh ? 'no-store' : `public, s-maxage=${left}, stale-while-revalidate=60` },
    });
  }
  if (cur && !refresh) {
    return NextResponse.json({ ...cur.payload, stale: true }, { headers: { 'Cache-Control': 'no-store' } });
  }

  try {
    const payload = await rebuild(cur ? cur.payload : null);
    return NextResponse.json(payload, {
      headers: { 'Cache-Control': refresh ? 'no-store' : 'public, s-maxage=60, stale-while-revalidate=60' },
    });
  } catch (e) {
    console.error('sitestats build error', e);
    if (cur) return NextResponse.json({ ...cur.payload, stale: true }, { headers: { 'Cache-Control': 'no-store' } });
    return NextResponse.json({ error: 'unavailable' }, { status: 503, headers: { 'Cache-Control': 'no-store' } });
  }
}
