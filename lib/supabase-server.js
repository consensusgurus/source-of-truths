// Server-only Supabase client. Uses the service_role key, which bypasses
// Row Level Security. NEVER import this from a 'use client' component or
// expose it to the browser.

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!serviceRoleKey && typeof window === 'undefined') {
  console.warn('SUPABASE_SERVICE_ROLE_KEY is not set. Admin routes will fail.');
}

// EVERY REQUEST GETS A DEADLINE (Vercel cost fix, 2026-10-27).
//
// Node's fetch waits up to 300 seconds for a response by default, and so did
// every function that awaited one. On 2026-10-27 the logs showed dozens of
// routes an hour ending in "Task timed out after 300 seconds" (iq-standing,
// daily-me, board, daily-save...), each one holding a function instance and
// its memory open for five minutes. That was the jump in Fluid Provisioned
// Memory on the bill. A Supabase answer that has not arrived in 20s is not
// going to, so it now fails fast and the caller's existing error path runs
// (the row caches serve what they hold). Storage downloads of the results
// snapshot are several MB, so they get longer.
const DB_TIMEOUT_MS = 20 * 1000;
const STORAGE_TIMEOUT_MS = 45 * 1000;

function deadlineSignal(ms, given) {
  const t = AbortSignal.timeout(ms);
  if (!given) return t;
  if (typeof AbortSignal.any === 'function') return AbortSignal.any([given, t]);
  return given;
}

function timedFetch(input, init = {}) {
  const url = typeof input === 'string' ? input : (input && input.url) || String(input || '');
  const ms = /\/storage\/v1\//.test(url) ? STORAGE_TIMEOUT_MS : DB_TIMEOUT_MS;
  return fetch(input, { ...init, signal: deadlineSignal(ms, init && init.signal) });
}

export const supabaseAdmin = createClient(supabaseUrl || '', serviceRoleKey || '', {
  auth: { persistSession: false, autoRefreshToken: false },
  global: { fetch: timedFetch },
});
