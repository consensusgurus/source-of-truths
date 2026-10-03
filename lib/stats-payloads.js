// Stored copies of computed stats payloads (migration 59, 2026-10-02).
//
// WHY: every deploy makes every lambda cold, and this project deploys often.
// A cold /api/sitestats measured 28.6s and a cold /admin 10s, because both
// recompute from scratch. Keeping the LAST computed payload in one small row
// lets a cold lambda answer at once from the stored copy and refresh behind
// it. This stores a finished payload, not rows, so it is only ever used for
// display surfaces that say how old their figures are. No scoring reads it.
//
// SAFE BEFORE THE MIGRATION: every call is wrapped. A missing table reads as
// "nothing stored" and writes are dropped, so callers fall back to computing
// live, which is what they did before this file existed.

import zlib from 'node:zlib';
import { supabaseAdmin } from './supabase-server';

const TABLE = 'stats_payloads';
// A payload far beyond this is a bug in the caller, not something to store.
const MAX_BYTES = 6 * 1024 * 1024;

// -> { payload, at } or null. `at` is epoch ms of the row's updated_at.
export async function readPayload(key) {
  try {
    const { data, error } = await supabaseAdmin
      .from(TABLE)
      .select('payload, updated_at')
      .eq('key', key)
      .limit(1);
    if (error || !Array.isArray(data) || !data.length) return null;
    const payload = JSON.parse(zlib.gunzipSync(Buffer.from(data[0].payload, 'base64')).toString('utf8'));
    if (!payload || typeof payload !== 'object') return null;
    return { payload, at: Date.parse(data[0].updated_at || '') || 0 };
  } catch (e) {
    return null;
  }
}

// Awaited by callers on purpose: a lambda can be frozen the moment it returns
// its response, so a fire-and-forget write would often never land.
export async function writePayload(key, payload) {
  try {
    const body = zlib.gzipSync(Buffer.from(JSON.stringify(payload), 'utf8')).toString('base64');
    if (body.length > MAX_BYTES) return false;
    const { error } = await supabaseAdmin
      .from(TABLE)
      .upsert({ key, payload: body, updated_at: new Date().toISOString() }, { onConflict: 'key' });
    return !error;
  } catch (e) {
    return false;
  }
}

// Resolve `promise`, or reject after `ms`. Used so one slow database
// aggregate cannot hold a whole stats build hostage.
export function withTimeout(promise, ms, label = 'timeout') {
  let timer;
  const gate = new Promise((_, reject) => { timer = setTimeout(() => reject(new Error(label)), ms); });
  return Promise.race([promise, gate]).finally(() => clearTimeout(timer));
}
