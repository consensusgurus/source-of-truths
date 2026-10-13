// SERVER ONLY. Measures Enter the Dojo's speed clocks for one Eastern day from
// every solve of each grid over the DOJO_WINDOW_DAYS before it, blends them
// with the seed (lib/dojo.js), and registers them with setDojoClocks so the
// circuit scorer, the run page and the board all grade that day the same way.
//
// Deterministic for a day: only puzzles from the window before the day are
// read, and only rows filed before the day began (04:00 UTC, Eastern midnight
// in daylight time), so every lambda computes the same clocks and a day never
// re-scores. Memoized per lambda; a failed read leaves the seed in force.

import { supabaseAdmin } from './supabase-server';
import { fetchAllRows } from './fetch-all';
import { DOJO_CLOCK, DOJO_WINDOW_DAYS, DOJO_RUN_ID, dojoBlendClock, setDojoClocks, dojoClocksFor } from './dojo';

const DONE = new Map();     // iso -> Promise
const KEYS = Object.keys(DOJO_CLOCK);

function suffixOf(ms) {
  const d = new Date(ms);
  return `${d.getUTCMonth() + 1}-${d.getUTCDate()}-${String(d.getUTCFullYear()).slice(2)}`;
}
function pct(sorted, p) {
  if (!sorted.length) return null;
  return sorted[Math.min(sorted.length - 1, Math.max(0, Math.floor(p * (sorted.length - 1))))];
}

async function measure(iso) {
  const day0 = Date.parse(`${iso}T12:00:00Z`);
  if (!Number.isFinite(day0)) return null;
  const ids = [];
  for (let i = 1; i <= DOJO_WINDOW_DAYS; i++) {
    const sfx = suffixOf(day0 - i * 86400000);
    for (const k of KEYS) ids.push(`${k}-${sfx}`);
  }
  const cutoff = `${iso}T04:00:00Z`;
  const r = await fetchAllRows(supabaseAdmin, 'quiz_results', 'id, quiz_id, user_id, anon_id, score, total, time_elapsed, abandoned, created_at', ['id'],
    (q) => q.in('quiz_id', ids).lt('created_at', cutoff));
  if (r.error || !Array.isArray(r.data)) return null;
  const times = Object.fromEntries(KEYS.map((k) => [k, []]));
  const seen = new Set();
  for (const row of r.data) {
    const who = row.user_id || row.anon_id;
    const id = `${row.quiz_id}|${who || row.id}`;
    if (seen.has(id)) continue;           // a player's first filed row only
    seen.add(id);
    if (row.abandoned) continue;
    const t = Number(row.total), s = Number(row.score), secs = Number(row.time_elapsed);
    if (!(t > 0) || s < t || !(secs > 0) || secs > 4 * 3600) continue;
    const key = String(row.quiz_id).replace(/-\d+-\d+-\d+$/, '');
    if (times[key]) times[key].push(secs);
  }
  const out = {};
  for (const k of KEYS) {
    const arr = times[k].sort((a, b) => a - b);
    out[k] = dojoBlendClock(DOJO_CLOCK[k], arr.length ? [pct(arr, 0.25), pct(arr, 0.9)] : null, arr.length);
  }
  return out;
}

// Make sure `iso`'s clocks are registered. Safe to await repeatedly.
export async function primeDojoClocks(iso) {
  if (!iso) return dojoClocksFor(iso);
  if (!DONE.has(iso)) {
    DONE.set(iso, measure(iso).then((c) => { if (c) setDojoClocks(iso, c); else DONE.delete(iso); return c; })
      .catch(() => { DONE.delete(iso); return null; }));
  }
  await DONE.get(iso);
  return dojoClocksFor(iso);
}

// The circuit routes' hook: a no-op for every circuit but the Dojo.
export async function primeCircuitClocks(circuitId, iso) {
  if (circuitId !== DOJO_RUN_ID || !iso) return;
  try { await primeDojoClocks(iso); } catch (e) {}
}
