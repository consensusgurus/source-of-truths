// lib/wanted-server.js: Wanted's server side (the schedule, the crowd, filing
// results). SERVER-ONLY: imports the service-role client and the full boards.
//
// STORAGE, no table of its own (all in outwit_picks, as Poll does; every reader
// of that table filters by quiz_id, so the games never mix):
//   - a player's finds on a board: quiz_id = the board's key, anon_id = the
//     player key (u:<user id> or a:<anon id>), answers = { f: [index...],
//     d: [Eastern day number of each find, parallel to f], t0 }
//   - '#solved' on a board's key: answers.at = when its last entry was first
//     found (the board then closes at max(open + 24h, that); no cap since 2026-11-26)
//   - '#settled' on a board's key: the final results were filed after it closed
// The site day results (quiz_results, quiz ids wanted-M-D-YY from ./puzzles.js)
// hold each player's points FOR FINDS MADE THAT DAY, valued at the current
// split, one row per player per day, updated in place as the values move.
import { createHash } from 'node:crypto';
import { supabaseAdmin } from '@/lib/supabase-server';
import { BOARDS } from '@/app/wanted/boards';
import { wantedWindows, wantedValue, wantedRankPoints, etDayNum, dayNumToIso, WANTED_POT } from '@/lib/wanted';

export const BOARD_BY_NUM = new Map(BOARDS.map((b) => [b.num, b]));
export const pubId = (key) => createHash('sha256').update('wanted|' + key).digest('base64url').slice(0, 10);

function quizIdOfDay(n) {
  const [y, m, d] = dayNumToIso(n).split('-').map(Number);
  return `wanted-${m}-${d}-${String(y).slice(2)}`;
}

// ---- schedule ---------------------------------------------------------------
let schedCache = { at: 0, solved: null };
export async function wantedSolvedMap(fresh = false) {
  if (!fresh && schedCache.solved && Date.now() - schedCache.at < 20000) return schedCache.solved;
  const solved = {};
  try {
    const keys = BOARDS.map((b) => b.key);
    const { data } = await supabaseAdmin.from('outwit_picks').select('quiz_id, answers').eq('anon_id', '#solved').in('quiz_id', keys);
    for (const r of data || []) {
      const b = BOARDS.find((x) => x.key === r.quiz_id);
      if (b && r.answers && r.answers.at) solved[b.num] = Number(r.answers.at);
    }
  } catch (e) { /* no markers: every board runs its full window */ }
  schedCache = { at: Date.now(), solved };
  return solved;
}
export async function wantedSchedule(now = Date.now()) {
  const solved = await wantedSolvedMap();
  return wantedWindows(BOARDS.length, solved, now);
}

// ---- the crowd ----------------------------------------------------------------
async function loadRows(key) {
  const out = [];
  for (let from = 0; from < 40000; from += 1000) {
    const { data, error } = await supabaseAdmin.from('outwit_picks')
      .select('id, anon_id, user_id, answers').eq('quiz_id', key).range(from, from + 999);
    if (error || !Array.isArray(data)) break;
    out.push(...data);
    if (data.length < 1000) break;
  }
  return out.filter((r) => !String(r.anon_id).startsWith('#'));
}

export function findsOf(row, N) {
  const a = row && row.answers;
  const f = a && Array.isArray(a.f) ? a.f : [];
  const d = a && Array.isArray(a.d) ? a.d : [];
  const fallback = a && a.t0 ? etDayNum(Number(a.t0)) : etDayNum();
  const out = new Map();
  f.forEach((i, k) => { if (Number.isInteger(i) && i >= 0 && i < N && !out.has(i)) out.set(i, Number.isInteger(d[k]) ? d[k] : fallback); });
  return out; // index -> Eastern day number of the find
}

async function namesFor(userIds) {
  const names = new Map();
  for (let k = 0; k < userIds.length; k += 200) {
    try {
      const { data } = await supabaseAdmin.from('quiz_users').select('id, username').in('id', userIds.slice(k, k + 200));
      for (const u of data || []) if (u.username) names.set(u.id, u.username);
    } catch (e) { /* guests' labels */ }
  }
  return names;
}

// ONE ROW PER PLAYER (owner via the Idea Board, 2026-11-23: "opening on
// different devices ... counts them separately as two people"). A player who
// found entries on a browser before it was tied to their account has a guest
// row (a:<anon>) beside their account row (u:<id>). The POST below folds those
// together as soon as either device syncs; this does the same at read time, so
// a pair that has not synced since still shows as one player with one set of
// finds (the union, each at its earliest day), and counts each entry once.
async function accountsOfAnons(anons) {
  const out = new Map(); // anon -> user id
  for (let k = 0; k < anons.length; k += 200) {
    const chunk = anons.slice(k, k + 200);
    try {
      const { data } = await supabaseAdmin.from('quiz_users').select('id, anon_id').in('anon_id', chunk);
      for (const u of data || []) if (u.anon_id && !out.has(u.anon_id)) out.set(u.anon_id, u.id);
    } catch (e) { /* stays a guest */ }
    const rest = chunk.filter((a) => !out.has(a));
    if (!rest.length) continue;
    try {
      const { data } = await supabaseAdmin.from('quiz_results').select('anon_id, user_id')
        .in('anon_id', rest).not('user_id', 'is', null).limit(5000);
      for (const r of data || []) if (r.anon_id && r.user_id && !out.has(r.anon_id)) out.set(r.anon_id, r.user_id);
    } catch (e) { /* stays a guest */ }
  }
  return out;
}
async function onePerPlayer(sets) {
  const guests = sets.map((x) => String(x.r.anon_id)).filter((k) => k.startsWith('a:')).map((k) => k.slice(2));
  const owner = guests.length ? await accountsOfAnons([...new Set(guests)]) : new Map();
  const by = new Map();
  for (const x of sets) {
    const key = String(x.r.anon_id);
    const uid = key.startsWith('u:') ? (x.r.user_id || key.slice(2)) : (owner.get(key.slice(2)) || null);
    const g = uid ? `u:${uid}` : key;
    const cur = by.get(g);
    if (!cur) {
      by.set(g, { r: key === g ? x.r : { ...x.r, anon_id: g, user_id: uid }, s: new Map(x.s) });
      continue;
    }
    if (key === g) cur.r = x.r; // the account's own row names the player
    for (const [i, d] of x.s) if (!cur.s.has(i) || d < cur.s.get(i)) cur.s.set(i, d);
  }
  return [...by.values()];
}

const crowdCache = new Map(); // board num -> { at, value }
export async function wantedCrowd(board, win, { fresh = false } = {}) {
  const hit = crowdCache.get(board.num);
  if (!fresh && hit && Date.now() - hit.at < 30000) return hit.value;
  const N = board.n;
  const rows = await loadRows(board.key);
  const counts = new Array(N).fill(0);
  const sets = await onePerPlayer(rows.map((r) => ({ r, s: findsOf(r, N) })).filter((x) => x.s.size > 0));
  for (const { s } of sets) for (const i of s.keys()) counts[i]++;
  const names = await namesFor([...new Set(sets.map((x) => x.r.user_id).filter(Boolean))]);
  const players = sets.map(({ r, s }) => {
    let points = 0, solo = 0;
    for (const i of s.keys()) { points += wantedValue(counts[i]); if (counts[i] === 1) solo++; }
    const id = pubId(r.anon_id);
    const named = r.user_id && names.get(r.user_id);
    return { id, name: named || `Guest ${id.slice(0, 4).toUpperCase()}`, points, solo, total: s.size, _row: r, _s: s, _named: named || null };
  }).sort((a, b) => wantedRankPoints(a, b) || a.name.localeCompare(b.name));
  let place = 0;
  players.forEach((pl, i) => { if (i === 0 || wantedRankPoints(players[i - 1], pl) !== 0) place = i + 1; pl.place = place; });
  const crowdFound = counts.filter((c) => c > 0).length;

  // The moment the crowd has every entry, stamp it: the board can now close.
  if (crowdFound === N && !(win && win.solvedAt)) {
    try { await supabaseAdmin.from('outwit_picks').insert({ quiz_id: board.key, anon_id: '#solved', answers: { at: Date.now() } }); } catch (e) { /* stamped already */ }
    schedCache.at = 0;
  }
  const closed = !!(win && win.closes && win.closes <= Date.now());
  const value = {
    board: board.num, at: Date.now(), N, closed,
    opens: win ? win.opens : null, closes: win ? win.closes : null, min: win ? win.min : null, cap: win ? win.cap : null,
    solvedAt: win ? win.solvedAt : null, crowdFound,
    players: players.length, counts,
    standings: players.slice(0, 100).map(({ id, name, points, solo, total, place: p }) => ({ id, name, points, solo, total, place: p })),
    field: players.map((pl) => [pl.points, pl.total]),
    // Who found each entry (up to four names, earliest day first), so a fresh find
    // can say who else has it (owner, 2026-11-21). Only entries with a finder.
    whoBy: (() => {
      const by = {};
      for (let i = 0; i < N; i++) if (counts[i] > 0) by[i] = [];
      for (const pl of players) for (const [i, day] of pl._s) by[i].push([day || 0, pl.name]);
      for (const k of Object.keys(by)) by[k] = by[k].sort((a, b) => a[0] - b[0]).slice(0, 4).map((x) => x[1]);
      return by;
    })(),
    // On a closed board, who found each entry nobody else did.
    soloBy: closed ? Object.fromEntries(players.flatMap((pl) => [...pl._s.keys()].filter((i) => counts[i] === 1).map((i) => [i, pl.name]))) : undefined,
    _players: players,
  };
  crowdCache.set(board.num, { at: Date.now(), value });
  return value;
}
export function publicCrowd(c) { const { _players, ...rest } = c; return rest; }

// ---- filing site results ---------------------------------------------------------
// One quiz_results row per player per Eastern day: the points from finds made
// that day, at the current split. Updated in place, never duplicated.
async function upsertDay(day, who, points, finds, N) {
  const quizId = quizIdOfDay(day);
  let q = supabaseAdmin.from('quiz_results').select('id, score').eq('quiz_id', quizId).order('id', { ascending: false }).limit(1);
  q = who.userId ? q.eq('user_id', who.userId) : q.is('user_id', null).eq('anon_id', who.anon);
  const { data } = await q;
  const row = data && data[0];
  if (row && Number(row.score) === points) return;
  const fields = { score: points, total: N * WANTED_POT, correct_count: points > 0 ? 1 : 0, guesses_used: finds, time_elapsed: 60, abandoned: false };
  if (row) await supabaseAdmin.from('quiz_results').update(fields).eq('id', row.id);
  else await supabaseAdmin.from('quiz_results').insert({ quiz_id: quizId, user_id: who.userId, username: who.name, anon_id: who.anon, ...fields });
}

export async function wantedFile(board, who, finds, counts, onlyDays = null) {
  const byDay = new Map();
  for (const [i, day] of finds) {
    const e = byDay.get(day) || { points: 0, n: 0 };
    e.points += wantedValue(counts[i]); e.n++;
    byDay.set(day, e);
  }
  for (const [day, e] of byDay) {
    if (onlyDays && !onlyDays.has(day)) continue;
    try { await upsertDay(day, who, e.points, e.n, board.n); } catch (e2) { /* the next sync files it */ }
  }
}

// Once a board closes, file everyone's final values, once.
export async function wantedSettle(board, crowd) {
  if (!crowd.closed) return;
  const { data } = await supabaseAdmin.from('outwit_picks').select('id').eq('quiz_id', board.key).eq('anon_id', '#settled').limit(1);
  if (data && data.length) return;
  const { error } = await supabaseAdmin.from('outwit_picks').insert({ quiz_id: board.key, anon_id: '#settled', answers: { at: Date.now() } });
  if (error) return; // another request is settling it
  for (const pl of crowd._players.slice(0, 3000)) {
    const key = String(pl._row.anon_id);
    const who = key.startsWith('u:')
      ? { userId: pl._row.user_id || key.slice(2), name: pl._named, anon: null }
      : { userId: null, name: null, anon: key.slice(2) };
    await wantedFile(board, who, pl._s, crowd.counts);
  }
}
