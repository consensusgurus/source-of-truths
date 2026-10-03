// Gate for lib/admin-data.js (2026-10-02).
//
// Two things in that file are new rather than moved, and both are checked
// here by LIFTING the code out of the file, so the check cannot drift from
// what it certifies:
//
//   1. etParts is memoized by UTC hour. That is only sound if every instant
//      inside one UTC hour has the same Eastern day, hour and weekday. Checked
//      against a fresh, uncached formatter at three instants in every hour of
//      2025 through 2027, which crosses six daylight-saving changes.
//   2. sliceAnalytics trims the player tables for the first paint. Checked:
//      the trimmed tables are the most recently active rows, the counts
//      describe the FULL tables, and no slice carries the full tables.
//
// The builders themselves (time by day, new users, daily games, return play,
// top players, player stats) were moved from app/admin/page.js verbatim and
// were compared against the old page code on 60,000 synthetic rows at the
// time of the move: byte-identical output.

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const src = fs.readFileSync(path.join(here, '..', 'lib', 'admin-data.js'), 'utf8');
let fails = 0;
const fail = (m) => { fails += 1; console.error('FAIL', m); };

function between(startMark, endMark) {
  const a = src.indexOf(startMark);
  const b = src.indexOf(endMark, a + startMark.length);
  if (a < 0 || b < 0) { fail(`could not find ${JSON.stringify(startMark.slice(0, 40))}`); return ''; }
  return src.slice(a, b);
}

// ---- 1. etParts ------------------------------------------------------------
{
  const code = between('const ET_FMT = new Intl.DateTimeFormat', '// A session is a sitting, not a day');
  const etParts = new Function(`${code}\nreturn etParts;`)();
  const fmt = new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/New_York', weekday: 'short', hour: '2-digit', hourCycle: 'h23',
    year: 'numeric', month: '2-digit', day: '2-digit',
  });
  const DOW = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };
  const direct = (d) => {
    const p = {};
    for (const x of fmt.formatToParts(d)) p[x.type] = x.value;
    return { hour: parseInt(p.hour, 10) % 24, dow: DOW[p.weekday], day: `${p.year}-${p.month}-${p.day}` };
  };
  const start = Date.UTC(2025, 0, 1);
  const end = Date.UTC(2028, 0, 1);
  let n = 0, bad = 0;
  for (let t = start; t < end; t += 3600000) {
    for (const off of [0, 29 * 60000 + 59000, 3599999]) {
      const d = new Date(t + off);
      const a = etParts(d), b = direct(d);
      n += 1;
      if (a.hour !== b.hour || a.dow !== b.dow || a.day !== b.day) {
        bad += 1;
        if (bad <= 5) fail(`etParts ${d.toISOString()} -> ${JSON.stringify(a)} expected ${JSON.stringify(b)}`);
      }
    }
  }
  if (bad > 5) fail(`etParts: ${bad} mismatches in all`);
  console.log(`etParts: ${n} instants checked, ${bad} wrong`);
}

// ---- 2. sliceAnalytics -----------------------------------------------------
{
  const code = between('export const PLAYERS_TOP', 'function remember(full)')
    .replace(/export /g, '')
    .replace(/const STORE_KEY[\s\S]*?let inflight = null;\n/, '');
  const { sliceAnalytics, PLAYERS_TOP } = new Function(`${code}\nreturn { sliceAnalytics, PLAYERS_TOP };`)();
  const iso = (i) => new Date(Date.UTC(2026, 0, 1) + i * 60000).toISOString();
  const N_REG = PLAYERS_TOP + 137, N_ANON = PLAYERS_TOP * 3 + 11;
  const order = (n) => Array.from({ length: n }, (_, i) => (i * 7919) % n);   // a fixed shuffle
  const full = {
    quizSignups: order(N_REG).map((i) => ({ id: `u${i}`, playCount: 2, stats: { lastSeen: iso(i) } })),
    anonPlayers: order(N_ANON).map((i) => ({ key: `a:${i}`, plays: 3, lastPlayed: iso(i) })),
    views24h: [{ views24h: 4 }, { views24h: 6 }],
    quizStats: [{ plays: 10 }, { plays: 5 }, { plays: 0 }],
    dailyRetention: { breadth: { total: 42 } },
    geoMap: { totals: { locatedPlayers: 9 } },
    activeUsers: {}, timeByDay: {}, newUsers: {}, dailyByGame: {}, topPlayersToday: {},
    builtAt: 'x', rowCount: 1, timings: {},
  };
  const parts = sliceAnalytics(full);
  const A = parts.analytics;
  if (A.quizSignups.length !== PLAYERS_TOP) fail(`signups trimmed to ${A.quizSignups.length}`);
  if (A.anonPlayers.length !== PLAYERS_TOP) fail(`anon trimmed to ${A.anonPlayers.length}`);
  if (A.quizSignups[0].id !== `u${N_REG - 1}` || A.quizSignups[PLAYERS_TOP - 1].id !== `u${N_REG - PLAYERS_TOP}`) fail('signups are not the most recently active, newest first');
  if (A.anonPlayers[0].key !== `a:${N_ANON - 1}` || A.anonPlayers[PLAYERS_TOP - 1].key !== `a:${N_ANON - PLAYERS_TOP}`) fail('anon players are not the most recently active, newest first');
  const c = A.counts;
  const want = { registered: N_REG, anonymous: N_ANON, playerPlays: N_REG * 2 + N_ANON * 3, lists: 2, quizzes: 3, views24hTotal: 10, quizPlaysTotal: 15, retentionTotal: 42, locatedPlayers: 9 };
  for (const k of Object.keys(want)) if (c[k] !== want[k]) fail(`counts.${k} = ${c[k]}, expected ${want[k]}`);
  if (full.quizSignups.length !== N_REG || full.quizSignups[0].id !== `u${order(N_REG)[0]}`) fail('sliceAnalytics reordered or cut the full table it was given');
  for (const [name, part] of Object.entries(parts)) {
    const size = JSON.stringify(part).length;
    if (name !== 'analytics' && (part.quizSignups || part.anonPlayers)) fail(`${name} carries player tables`);
    if (name === 'analytics' && size > JSON.stringify(full.quizSignups).length + JSON.stringify(full.anonPlayers).length) fail('analytics slice is not smaller than the full tables');
  }
  console.log('sliceAnalytics: trimmed tables, counts and slices checked');
}

if (fails) { console.error(`verify-admin-data: ${fails} failure(s)`); process.exit(1); }
console.log('verify-admin-data: OK');
