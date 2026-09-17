// Housing Watch: shared helpers for the data pipeline. Plain ESM with relative
// imports only, so scripts/housing tests can load it with node directly.
import zlib from 'node:zlib';
import fs from 'node:fs';
import path from 'node:path';

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
export { sleep };

// Fetch a URL as text. With HOUSING_FIXTURE_DIR set (tests only), read
// <dir>/<fixture> instead of the network.
export async function fetchText(url, { fixture, headers = {}, retries = 3 } = {}) {
  const fx = process.env.HOUSING_FIXTURE_DIR;
  if (fx) {
    const p = path.join(fx, fixture || 'missing');
    if (!fs.existsSync(p)) throw new Error(`fixture not found: ${fixture}`);
    return decode(fs.readFileSync(p));
  }
  let lastErr;
  for (let i = 0; i < retries; i++) {
    try {
      const init = {
        headers: { 'User-Agent': process.env.SEC_USER_AGENT || 'Housing Watch data refresh', ...headers },
        signal: AbortSignal.timeout(60_000),
      };
      // Inside Next, keep these large downloads out of the fetch data cache.
      if (globalThis.fetch && globalThis.fetch.__nextPatched) init.cache = 'no-store';
      const res = await fetch(url, init);
      if (!res.ok) throw new Error(`HTTP ${res.status} for ${url}`);
      return decode(Buffer.from(await res.arrayBuffer()));
    } catch (e) {
      lastErr = e;
      if (/HTTP 404/.test(e.message)) break;
      await sleep(1000 * (i + 1));
    }
  }
  throw lastErr;
}

function decode(buf) {
  const gz = buf.length > 2 && buf[0] === 0x1f && buf[1] === 0x8b;
  return (gz ? zlib.gunzipSync(buf) : buf).toString('utf8');
}

export async function fetchJSON(url, opts) {
  return JSON.parse(await fetchText(url, opts));
}

// Minimal RFC 4180 parser. Handles quoted fields, embedded commas and newlines.
export function parseDelimited(text, delim = ',') {
  const rows = [];
  let row = [];
  let field = '';
  let q = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (q) {
      if (c === '"') {
        if (text[i + 1] === '"') { field += '"'; i++; } else q = false;
      } else field += c;
    } else if (c === '"') q = true;
    else if (c === delim) { row.push(field); field = ''; }
    else if (c === '\n' || c === '\r') {
      if (c === '\r' && text[i + 1] === '\n') i++;
      row.push(field); rows.push(row); row = []; field = '';
    } else field += c;
  }
  if (field !== '' || row.length) { row.push(field); rows.push(row); }
  return rows.filter((r) => !(r.length === 1 && r[0].trim() === ''));
}

// Parse into objects keyed by the header row.
export function parseTable(text, delim = ',') {
  const [head, ...rows] = parseDelimited(text, delim);
  if (!head) return [];
  const keys = head.map((h) => h.trim().replace(/^﻿/, ''));
  return rows.map((r) => Object.fromEntries(keys.map((k, i) => [k, (r[i] ?? '').trim()])));
}

export const num = (v) => {
  if (v === null || v === undefined) return null;
  const s = String(v).replace(/[$,%\s]/g, '');
  if (s === '' || s === '.' || s.toLowerCase() === 'na') return null;
  const n = Number(s);
  return Number.isFinite(n) ? n : null;
};

export const daysBetween = (a, b) => (new Date(b) - new Date(a)) / 86_400_000;

export const round = (v, d = 1) => (v === null || v === undefined || !Number.isFinite(v) ? null : Math.round(v * 10 ** d) / 10 ** d);

export function monthsAgoISO(n, from = new Date()) {
  const d = new Date(Date.UTC(from.getUTCFullYear(), from.getUTCMonth() - n, 1));
  return d.toISOString().slice(0, 10);
}
