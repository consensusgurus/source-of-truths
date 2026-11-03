import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-server';
import { loadDailyResultsCached } from '@/lib/daily-results-cache';
import { fetchAllRows } from '@/lib/fetch-all';
import { QUIZ_RESULT_COL_TIERS, isMissingColumn } from '@/lib/quiz-results-cache';
import { findQuizIdentity } from '@/lib/quiz-identity';
import { scoreGame, rowsWithinDay } from '@/lib/daily-combined';
import { gamesForSuffix, suffixOfDate, etTodayServer } from '@/lib/daily-slate';
import { circuitKeysFor } from '@/lib/circuits';
import { MC_RUNS, MC_IDS, MC_FROM, MC_PERIOD_IDS, periodRange, addDays } from '@/lib/multiple-choice';

// GET /api/quiz/multiple-choice?period=today|week|month|all&anonId=&email=&fresh=1&less=<runId>
//
// MULTIPLE CHOICE LEADERS (owner, 2026-11-03): every correct answer across the
// Trivia Gauntlet, Trivia Encore, Math Gauntlet, Science Gauntlet and English
// Gauntlet, over today, the last 7 days, the last 30 days or all time.
//
// A LENS, NOTHING STORED. Each day's games for each run come from
// circuitKeysFor (the same roster the run boards use), each game is scored by
// the shared scoreGame (first attempt, the same row every per-game board
// keeps), and a player's figure is the sum of their scores, which on these
// runs is their questions right. A game is counted once a day even if two
// rosters ever named it. Guests count toward the day's totals; the boards list
// named players only, like every public board.
//
// COST. Today's rows come through loadDailyResultsCached with exactly the
// quizId set each run's own board asks for, so the slices are shared with
// /api/quiz/daily-combined. Finished days are read once per server, scoped by
// quizId, reduced to per-player sums and kept (a finished day cannot change);
// the rows themselves are not held.
export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';
export const maxDuration = 60;

const TODAY_HEADERS = { 'Cache-Control': 'public, s-maxage=30, stale-while-revalidate=90' };
const PAST_HEADERS = { 'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=900' };
const NO_STORE = { 'Cache-Control': 'no-store' };
const BOARD_ALL = 50;
const BOARD_RUN = 25;
const CHUNK = 60;
const TODAY_TTL = 20 * 1000;

// ── One day's games, by run ────────────────────────────────────────────────
function dayGames(iso, today) {
  const suffix = suffixOfDate(iso);
  const seen = new Set();
  const out = [];
  for (const r of MC_RUNS) {
    const keys = circuitKeysFor(r.id, iso);
    if (!keys.length) continue;
    for (const g of gamesForSuffix(keys, suffix, today)) {
      if (seen.has(g.quizId)) continue;
      seen.add(g.quizId);
      out.push({ run: r.id, key: g.key, quizId: g.quizId });
    }
  }
  return { iso, suffix, games: out };
}

// A day's per-player sums. userKey -> { name, by: { runId: right }, runs, time }.
function aggregate(plan, rowsByQuiz, frozen) {
  const users = new Map();
  let correct = 0;
  const touched = new Map(); // userKey -> Set(runId)
  for (const g of plan.games) {
    let rows = rowsByQuiz.get(g.quizId) || [];
    if (frozen) rows = rowsWithinDay(rows, plan.suffix);
    if (!rows.length) continue;
    const gr = scoreGame(rows);
    for (const p of gr.players.values()) {
      let u = users.get(p.userKey);
      if (!u) { u = { name: null, by: {}, runs: 0, time: 0 }; users.set(p.userKey, u); }
      if (p.username) u.name = p.username;
      const s = Number(p.score) || 0;
      u.by[g.run] = (u.by[g.run] || 0) + s;
      u.time += Number(p.timeElapsed) || 0;
      correct += s;
      let t = touched.get(p.userKey);
      if (!t) { t = new Set(); touched.set(p.userKey, t); }
      t.add(g.run);
    }
  }
  for (const [k, t] of touched) users.get(k).runs = t.size;
  let runsPlayed = 0;
  for (const t of touched.values()) runsPlayed += t.size;
  return { users, correct, runsPlayed };
}

// ── Finished days: read once, kept as sums ─────────────────────────────────
const pastMemo = new Map(); // iso -> aggregate
let pastChain = Promise.resolve();

async function fetchRows(ids) {
  for (let i = 0; i < QUIZ_RESULT_COL_TIERS.length; i++) {
    const r = await fetchAllRows(supabaseAdmin, 'quiz_results', QUIZ_RESULT_COL_TIERS[i], ['id'], (q) => q.in('quiz_id', ids));
    if (r.error && isMissingColumn(r.error)) continue;
    if (r.error) throw new Error(r.error.message || 'quiz_results read failed');
    return r.data || [];
  }
  throw new Error('quiz_results: no column tier matched');
}

async function loadPastNow(isos, today) {
  const need = isos.filter((d) => !pastMemo.has(d));
  if (!need.length) return;
  const plans = need.map((iso) => dayGames(iso, today));
  const ids = [...new Set(plans.flatMap((p) => p.games.map((g) => g.quizId)))].sort();
  const rowsByQuiz = new Map();
  const chunks = [];
  for (let i = 0; i < ids.length; i += CHUNK) chunks.push(ids.slice(i, i + CHUNK));
  // Four reads at a time: enough to keep a cold all-time load short without
  // crowding the database the run boards depend on.
  for (let i = 0; i < chunks.length; i += 4) {
    const parts = await Promise.all(chunks.slice(i, i + 4).map(fetchRows));
    for (const rows of parts) {
      for (const r of rows) {
        if (!r || !r.quiz_id) continue;
        let a = rowsByQuiz.get(r.quiz_id);
        if (!a) { a = []; rowsByQuiz.set(r.quiz_id, a); }
        a.push(r);
      }
    }
  }
  for (const p of plans) pastMemo.set(p.iso, aggregate(p, rowsByQuiz, true));
}

// One load at a time per server, so two cold requests do not read the same
// days twice; the second finds them in the memo.
function loadPast(isos, today) {
  const run = pastChain.then(() => loadPastNow(isos, today));
  pastChain = run.catch(() => {});
  return run;
}

// ── Today: shared slices with the run boards ───────────────────────────────
let todayMemo = null; // { iso, at, agg }

async function loadToday(today, fresh) {
  if (!fresh && todayMemo && todayMemo.iso === today && Date.now() - todayMemo.at < TODAY_TTL) return todayMemo.agg;
  const plan = dayGames(today, today);
  const rowsByQuiz = new Map();
  const byRun = new Map();
  for (const g of plan.games) {
    if (!byRun.has(g.run)) byRun.set(g.run, []);
    byRun.get(g.run).push(g.quizId);
  }
  const loads = await Promise.all([...byRun.values()].map((ids) => loadDailyResultsCached(supabaseAdmin, ids, { force: fresh })));
  for (const res of loads) {
    if (res.error) throw new Error(res.error.message || 'today read failed');
    for (const r of res.data || []) {
      if (!r || !r.quiz_id) continue;
      let a = rowsByQuiz.get(r.quiz_id);
      if (!a) { a = []; rowsByQuiz.set(r.quiz_id, a); }
      a.push(r);
    }
  }
  const agg = aggregate(plan, rowsByQuiz, false);
  todayMemo = { iso: today, at: Date.now(), agg };
  return agg;
}

// ── Windows ────────────────────────────────────────────────────────────────
function daysIn(from, to) {
  const out = [];
  if (!from || !to || to < from) return out;
  for (let d = from; d <= to; d = addDays(d, 1)) out.push(d);
  return out;
}

function sumAggs(aggs) {
  const users = new Map();
  let correct = 0, runsPlayed = 0;
  for (const a of aggs) {
    if (!a) continue;
    correct += a.correct;
    runsPlayed += a.runsPlayed;
    for (const [k, u] of a.users) {
      let t = users.get(k);
      if (!t) { t = { name: null, by: {}, runs: 0, time: 0 }; users.set(k, t); }
      if (u.name) t.name = u.name;
      for (const [id, n] of Object.entries(u.by)) t.by[id] = (t.by[id] || 0) + n;
      t.runs += u.runs;
      t.time += u.time;
    }
  }
  for (const u of users.values()) u.total = MC_IDS.reduce((s, id) => s + (u.by[id] || 0), 0);
  return { users, correct, runsPlayed };
}

const valOf = (u, key) => (key === 'all' ? u.total : (u.by[key] || 0));

// The named field for one key, best first: correct answers, then fewer runs,
// then the shorter clock. Shared positions for a full tie on the first two.
function ranked(users, key) {
  const rows = [];
  for (const [k, u] of users) {
    if (!u.name) continue;
    const v = valOf(u, key);
    if (v <= 0) continue;
    rows.push({ k, u, v });
  }
  rows.sort((a, b) => (b.v - a.v) || (a.u.runs - b.u.runs) || (a.u.time - b.u.time) || String(a.u.name).localeCompare(String(b.u.name)));
  let rank = 0, prev = null;
  rows.forEach((r, i) => {
    const sig = `${r.v}|${r.u.runs}`;
    if (sig !== prev) { rank = i + 1; prev = sig; }
    r.rank = rank;
  });
  return rows;
}

const coreMemo = new Map(); // `${period}|${today}` -> { at, core }

async function buildCore(period, today, fresh) {
  const key = `${period}|${today}`;
  const hit = coreMemo.get(key);
  const ttl = period === 'today' ? TODAY_TTL : 2 * 60 * 1000;
  if (!fresh && hit && Date.now() - hit.at < ttl) return hit.core;
  const rg = periodRange(period, today);
  const cur = daysIn(rg.from, rg.to);
  const prev = daysIn(rg.prevFrom, rg.prevTo);
  const past = [...new Set([...cur, ...prev])].filter((d) => d < today && d >= MC_FROM);
  if (past.length) await loadPast(past, today);
  const todayAgg = cur.includes(today) || prev.includes(today) ? await loadToday(today, fresh) : null;
  const pick = (d) => (d === today ? todayAgg : pastMemo.get(d));
  const now = sumAggs(cur.map(pick));
  const before = sumAggs(prev.map(pick));
  const keys = ['all', ...MC_IDS];
  const boards = {};
  const prevRank = {};
  for (const k of keys) {
    boards[k] = ranked(now.users, k);
    prevRank[k] = new Map(ranked(before.users, k).map((r) => [r.k, r.rank]));
  }
  let players = 0;
  for (const u of now.users.values()) if (u.total > 0 || u.runs > 0) players += 1;
  const core = { range: rg, users: now.users, boards, prevRank, players, correct: now.correct, runsPlayed: now.runsPlayed, hasPrev: prev.length > 0 };
  coreMemo.set(key, { at: Date.now(), core });
  while (coreMemo.size > 8) coreMemo.delete(coreMemo.keys().next().value);
  return core;
}

function rowOut(r, key, core) {
  const p = core.prevRank[key].get(r.k);
  return {
    name: r.u.name,
    rank: r.rank,
    value: r.v,
    total: r.u.total,
    by: Object.fromEntries(MC_IDS.map((id) => [id, r.u.by[id] || 0])),
    runs: r.u.runs,
    move: !core.hasPrev ? null : (p ? p - r.rank : 'new'),
    k: r.k,
  };
}

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const period = MC_PERIOD_IDS.includes(searchParams.get('period')) ? searchParams.get('period') : 'today';
  const anonId = (searchParams.get('anonId') || '').trim() || null;
  const email = (searchParams.get('email') || '').trim() || null;
  const fresh = searchParams.get('fresh') === '1';
  const less = MC_IDS.includes(searchParams.get('less')) ? searchParams.get('less') : null;
  const today = etTodayServer();
  try {
    const core = await buildCore(period, today, fresh);
    const boards = {};
    const champions = {};
    for (const k of ['all', ...MC_IDS]) {
      const list = core.boards[k];
      boards[k] = list.slice(0, k === 'all' ? BOARD_ALL : BOARD_RUN).map((r) => rowOut(r, k, core));
      champions[k] = boards[k][0] || null;
    }
    const field = Object.fromEntries(['all', ...MC_IDS].map((k) => [k, core.boards[k].length]));

    // The viewer: an account by email, else this browser.
    let myKey = null;
    try {
      const ident = await findQuizIdentity(supabaseAdmin, { email, anonId });
      if (ident && ident.id) myKey = `u:${ident.id}`;
      else if (anonId) myKey = `a:${anonId}`;
    } catch (e) { if (anonId) myKey = `a:${anonId}`; }
    let me = null;
    const mine = myKey ? core.users.get(myKey) : null;
    if (mine && (mine.total > 0 || mine.runs > 0)) {
      const ranks = {};
      for (const k of ['all', ...MC_IDS]) {
        const v = valOf(mine, k);
        if (v <= 0) { ranks[k] = null; continue; }
        const at = core.boards[k].find((r) => r.k === myKey);
        if (at) { ranks[k] = at.rank; continue; }
        // A guest, or a name not yet attached: where they would stand.
        ranks[k] = core.boards[k].filter((r) => r.v > v || (r.v === v && r.u.runs < mine.runs)).length + 1;
      }
      const p = core.prevRank.all.get(myKey);
      me = {
        name: mine.name || null,
        provisional: !mine.name,
        total: mine.total,
        by: Object.fromEntries(MC_IDS.map((id) => [id, mine.by[id] || 0])),
        runs: mine.runs,
        rank: ranks.all,
        ranks,
        move: !core.hasPrev || !ranks.all ? null : (p ? p - ranks.all : 'new'),
      };
      // `less`: the combined rank this player held without one run's answers,
      // so an ending can show the climb that run bought.
      if (less) {
        const t = mine.total - (mine.by[less] || 0);
        me.before = t > 0
          ? core.boards.all.filter((r) => r.k !== myKey && (r.v > t || (r.v === t && r.u.runs < mine.runs - 1))).length + 1
          : null;
      }
      // The next name up the combined board, and how many it takes to pass.
      if (ranks.all && ranks.all > 1) {
        const above = core.boards.all.filter((r) => r.k !== myKey && r.v > mine.total);
        const last = above[above.length - 1];
        if (last) me.toPass = { rank: last.rank, need: last.v - mine.total + 1 };
      }
    }
    // Strip internal keys from the public rows.
    for (const k of Object.keys(boards)) for (const r of boards[k]) delete r.k;

    return NextResponse.json({
      period,
      from: core.range.from,
      to: core.range.to,
      today,
      runs: MC_RUNS.map((r) => ({ id: r.id, name: r.name, short: r.short, href: r.href })),
      players: core.players,
      runsPlayed: core.runsPlayed,
      correct: core.correct,
      field,
      champions,
      boards,
      me,
    }, { headers: fresh ? NO_STORE : (period === 'today' ? TODAY_HEADERS : PAST_HEADERS) });
  } catch (e) {
    console.error('multiple-choice error', e);
    return NextResponse.json({ period, error: 'unavailable' }, { status: 503, headers: NO_STORE });
  }
}
