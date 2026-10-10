// scripts/trivia-recycle.mjs - RECYCLING UNANSWERED TRIVIA QUESTIONS (owner,
// 2026-10-09). Shared by the seven trivia gauntlet verifiers and by
// scripts/trivia-recycle-pool.mjs.
//
// WHY. Every trivia gauntlet (Streak, Deep, Atlas, Sport, Biz, Quotes, Script)
// is one life in a fixed order, so the deeper a question sits on its day the
// fewer players ever see it. On the 2026-10-09 snapshot roughly a third of the
// hard-tier questions already played had NEVER been answered by anybody. A
// question nobody has answered is, to every player, a new question, so it can
// be dealt again instead of authoring a replacement. The authoring budget then
// goes where it is actually spent: the low tiers every player reaches.
//
// WHAT "NEVER ANSWERED" MEANS, EXACTLY. /api/quiz/board's `best` for a day is
// the highest score anybody recorded on it (daily, archive and Gauntlet run
// plays all post under the same quizId). Scores count questions answered right
// in play order, so on a day whose best is B, questions 1..B were answered
// right by somebody and question B+1 was the miss that ended the best run. A
// question at position B+2 or later was never shown to anyone. That is the
// whole pool; the miss itself (B+1) is NOT in it, because it was seen.
//
// SNAPSHOTS. The `best` figures live in scripts/trivia-recycle/play-snapshot-
// <YYYY-MM-DD>.txt, one `<quizId>=<best>` line per played day, pulled in the
// browser (the board route is not reachable from a sandbox). NEVER DELETE AN
// OLD SNAPSHOT: a recycled question is proved against the snapshot that was
// current when it was recycled, and an archive player who reaches the original
// later must not turn a live board red. A recycle is legal when ANY snapshot
// dated before the recycled copy's live date shows the original unanswered,
// with the original's day at least MIN_AGE_DAYS old on that snapshot (a day
// still being played has not finished showing its questions).
//
// THE RULES (checkRecycled enforces every one of them):
//   1. A recycled question carries `from: '<game>:<id>'` naming the question
//      it repeats. Nothing else may repeat question text; the repeat checks in
//      each verifier exempt exactly the `from` pair and nothing more.
//   2. SAME GAME, SAME LANE, SAME TIER. A tier is a difficulty promise the
//      original was written to; the lane keeps the day's lane cycle intact.
//   3. SAME STEM AND SAME ANSWER as the original as it stands now. Distractors
//      may be improved. If the original is wrong, fix the original too (owner
//      ruling 2026-10-08: content errors on played boards are fixed).
//   4. EACH ORIGINAL IS RECYCLED ONCE. If the copy also goes unanswered it may
//      be recycled again, by pointing `from` at the copy.
//   5. DEEP IS THE EXCEPTION. Deep is one topic a day, so an unanswered Deep
//      question cannot go back into Deep. It may go to STREAK ONLY, ONLY IN
//      TIER 5 (the very end of the forty), at most DEEP_PER_STREAK_DAY a day,
//      in whichever Streak lane fits it. Its stem MAY be rewritten (and must
//      be, whenever it leaned on the day's topic: "the city on the Tiber",
//      "this emperor"); its answer may not change.
//   6. A recycled question still passes every rule of the bank it lands in:
//      US spellings, the sports rules cap, no expiring facts, the answer cap.
//      Questions from frozen days that predate those rules will fail them,
//      and the fix is to skip that question, not to loosen the rule.
//   7. CONTENT REVIEW STILL APPLIES (scripts/CONTENT-REVIEW.md). A recycled
//      question is re-read like new copy: the 2026-10-08 audit found wrong
//      keys on played days, and a recycle must not carry one forward.

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, '..');
export const SNAP_DIR = path.join(HERE, 'trivia-recycle');

export const GAMES = ['streak', 'deep', 'atlas', 'sport', 'biz', 'quotes', 'script'];
export const MIN_AGE_DAYS = 14;
export const DEEP_TO_STREAK_TIER = 5;
export const DEEP_PER_STREAK_DAY = 2;

const norm = (s) => String(s).toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')
  .replace(/[^a-z0-9]+/g, ' ').trim();
const dayMs = 86400000;
const toMs = (iso) => Date.parse(`${iso}T12:00:00Z`);

export function loadSnapshots(dir = SNAP_DIR) {
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir)
    .map((f) => /^play-snapshot-(\d{4}-\d\d-\d\d)\.txt$/.exec(f))
    .filter(Boolean)
    .map((m) => {
      const best = new Map();
      for (const line of fs.readFileSync(path.join(dir, m[0]), 'utf8').split(/\r?\n/)) {
        const t = line.trim();
        if (!t || t.startsWith('#')) continue;
        const [k, v] = t.split('=');
        best.set(k.trim(), Number(v));
      }
      return { date: m[1], best };
    })
    .sort((a, b) => a.date.localeCompare(b.date));
}

const bankCache = new Map();
export async function loadBank(game) {
  if (!bankCache.has(game)) {
    const P = await import(pathToFileURL(path.join(ROOT, 'app', game, 'puzzles.js')).href);
    const Q = await import(pathToFileURL(path.join(ROOT, 'app', game, 'questions.js')).href);
    bankCache.set(game, { PUZZLES: P.PUZZLES, QUESTIONS: Q.QUESTIONS });
  }
  return bankCache.get(game);
}

// Where each question sits: id -> { day, live, quizId, pos (1-based), topic }.
export function placements(PUZZLES) {
  const at = new Map();
  for (const p of PUZZLES) p.qids.forEach((id, i) => at.set(id, { live: p.live, quizId: p.quizId, pos: i + 1, topic: p.topic || null, num: p.num }));
  return at;
}

// Ids never answered on ONE snapshot, for a bank.
export function unansweredOn(snap, PUZZLES) {
  const out = new Set();
  const cutoff = toMs(snap.date) - MIN_AGE_DAYS * dayMs;
  for (const p of PUZZLES) {
    if (toMs(p.live) > cutoff) continue;
    const b = snap.best.get(p.quizId);
    if (b == null || !Number.isFinite(b)) continue;   // not in the snapshot: unknown, never pooled
    p.qids.forEach((id, i) => { if (i + 1 > b + 1) out.add(id); });
  }
  return out;
}

const answerOf = (q) => q.choices[q.correct];

// The verifier half. Returns { errs, recycled } for the bank `game` whose
// QUESTIONS/PUZZLES are passed in (the verifier's own import, so a selftest can
// feed a synthetic bank).
export async function checkRecycled({ game, QUESTIONS, PUZZLES, snapshots = loadSnapshots(), sources = {} }) {
  const bankOf = async (g) => sources[g] || loadBank(g);
  const errs = [];
  const fail = (m) => errs.push(`recycle: ${m}`);
  const at = placements(PUZZLES);
  const used = new Map();
  const deepPerDay = new Map();
  const unansweredCache = new Map();
  const unanswered = async (srcGame, snap) => {
    const k = `${srcGame}@${snap.date}`;
    if (!unansweredCache.has(k)) {
      const src = srcGame === game ? { PUZZLES } : await bankOf(srcGame);
      unansweredCache.set(k, unansweredOn(snap, src.PUZZLES));
    }
    return unansweredCache.get(k);
  };
  let recycled = 0;
  for (const q of QUESTIONS) {
    if (q.from == null) continue;
    recycled++;
    const m = /^(\w+):(d\d{2,3}q\d\d)$/.exec(String(q.from));
    if (!m) { fail(`${q.id}: from "${q.from}" is not <game>:<id>`); continue; }
    const [, srcGame, srcId] = m;
    if (srcGame !== game && !(game === 'streak' && srcGame === 'deep')) {
      fail(`${q.id}: from ${q.from}: a question is recycled inside its own game only (Deep may go to Streak)`); continue;
    }
    if (used.has(q.from)) fail(`${q.id}: ${q.from} was already recycled as ${used.get(q.from)}; each original is recycled once`);
    used.set(q.from, q.id);
    const src = srcGame === game ? { QUESTIONS, PUZZLES } : await bankOf(srcGame);
    const orig = src.QUESTIONS.find((x) => x.id === srcId);
    if (!orig) { fail(`${q.id}: from ${q.from}: no such question`); continue; }
    const here = at.get(q.id);
    if (!here) { fail(`${q.id}: recycled question is not dealt on any day`); continue; }
    const there = placements(src.PUZZLES).get(srcId);
    if (!there) { fail(`${q.id}: from ${q.from}: the original is not dealt on any day`); continue; }
    if (there.live >= here.live) fail(`${q.id}: from ${q.from}: the original (${there.live}) must be live before the copy (${here.live})`);
    if (norm(answerOf(orig)) !== norm(answerOf(q))) fail(`${q.id}: answer "${answerOf(q)}" differs from the original's "${answerOf(orig)}"`);
    if (srcGame === game) {
      if (norm(orig.q) !== norm(q.q)) fail(`${q.id}: stem differs from ${q.from}; a same-game recycle repeats the stem (fix both if the original is wrong)`);
      if (orig.tier !== q.tier) fail(`${q.id}: tier ${q.tier} differs from the original's ${orig.tier}`);
      if ((orig.cat || null) !== (q.cat || null)) fail(`${q.id}: lane "${q.cat}" differs from the original's "${orig.cat}"`);
    } else {
      if (q.tier !== DEEP_TO_STREAK_TIER) fail(`${q.id}: a Deep question goes to Streak tier ${DEEP_TO_STREAK_TIER} only, not tier ${q.tier}`);
      const n = (deepPerDay.get(here.live) || 0) + 1;
      deepPerDay.set(here.live, n);
      if (n > DEEP_PER_STREAK_DAY) fail(`${here.live}: more than ${DEEP_PER_STREAK_DAY} Deep questions on one Streak day`);
    }
    let proved = null;
    for (const snap of snapshots) {
      if (snap.date >= here.live) continue;
      if ((await unanswered(srcGame, snap)).has(srcId)) { proved = snap.date; break; }
    }
    if (!proved) fail(`${q.id}: from ${q.from}: no snapshot before ${here.live} shows the original (pos ${there.pos} on ${there.live}) as never answered`);
  }
  return { errs, recycled };
}

// The verifier repeat-check exemption: true when `q` is the declared recycle of
// `earlierId` in the same bank.
export const isRecycleOf = (game, q, earlierId) => q.from === `${game}:${earlierId}`;
