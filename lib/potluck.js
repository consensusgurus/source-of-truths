// Potluck (owner, 2026-10-09): the daily Trivia game made of three catalog
// quizzes, played on their own pages and scored together.
//
// HOW A DAY RUNS. /potluck shows the day's three (app/potluck/puzzles.js, a
// dated bank built by scripts/gen-potluck.mjs). Each opens at
// /quiz/<id>?potluck=<num>&i=<slot>; QuizClient plays it exactly as it always
// does, then calls recordPotluck() with that quiz's score and clock and sends
// the player back here. The player TURNS IT IN whenever they like (owner: you
// do not have to play all three), and finishing the third turns it in on its
// own. A quiz never played counts zero.
//
// SCORING. Each quiz is worth 10, scaled by the share of it you got
// (round(10 x score / total)), so a 12-answer list and a 40-answer map weigh
// the same. The day is out of 30; the summed quiz clocks break ties.
//
// WHAT IS POSTED. One row, quizId potluck-M-D-YY, through the ordinary
// /api/quiz/result route, once. The three quiz rows QuizClient posts as it
// always has are left alone: they are real plays of real quizzes.
//
// Client-safe: no node imports, and nothing here imports lib/quizzes.js, which
// is 4MB. The server page resolves the quiz metadata the hub needs.

// Which formats Potluck may pick, and the family each belongs to. ONLY formats
// the shared shell (app/quiz/[id]/QuizClient.jsx) plays: the full-page boards
// post on their own and would never report back.
export const POTLUCK_FAMILY = {
  default: 'typed',
  'type-it': 'typed',
  careers: 'typed',
  'word-scramble': 'typed',
  bank: 'match',
  matched: 'match',
  pairs: 'match',
  'order-bank': 'match',
  'photo-match': 'match',
  map: 'visual',
  photo: 'visual',
  logos: 'visual',
  posters: 'visual',
  images: 'visual',
};
export const FAMILY_LABEL = { typed: 'Name them', match: 'Match them', visual: 'Spot them' };
export const PER_QUIZ = 10;
export const POT_TOTAL = 30;

function srcLabel(q) {
  return typeof q.source === 'string' ? q.source : (q.source && q.source.label) || '';
}
function answerCount(q) {
  if (Array.isArray(q.pairs) && ['bank', 'pairs', 'type-it', 'photo', 'photo-match', 'order-bank', 'word-scramble', 'careers'].includes(q.format)) return q.pairs.length;
  return Array.isArray(q.answers) ? q.answers.length : 0;
}
export { answerCount as potluckAnswerCount };

// The eligibility rule, shared by the generator and the verifier so the two
// cannot disagree. listMode: Map of list id -> mode ('facts' is the only one a
// paired quiz may point at).
export function potluckEligible(q, listMode, nowMs) {
  if (!q || !q.id) return false;
  const fam = POTLUCK_FAMILY[q.format || 'default'];
  if (!fam) return false;
  if (q.unlisted || q.hidden || q.retired) return false;
  if (/mobile-preview/.test(q.id)) return false;
  if (q.publishedAt && Date.parse(q.publishedAt) > nowMs) return false;
  if (q.listId && listMode && listMode.get(q.listId) !== 'facts') return false;
  if (/consensus/i.test(srcLabel(q))) return false;
  if (q.strike || q.suddenDeath) return false;
  const n = answerCount(q);
  if (n < 8 || n > 50) return false;
  if (!q.timeLimit) return false;
  return true;
}

// ── run state, kept on this device ──────────────────────────────────────────
export function etToday() {
  try { return new Date().toLocaleDateString('en-CA', { timeZone: 'America/New_York' }); }
  catch (e) { return new Date().toISOString().slice(0, 10); }
}
export const runKey = (num) => `sot_potluck_run_${num}`;
export function loadRun(num) {
  try {
    const r = JSON.parse(localStorage.getItem(runKey(num)) || 'null');
    if (r && r.v === 1 && r.done) return r;
  } catch (e) {}
  return { v: 1, done: {}, turnedIn: false, t0: null };
}
function saveRun(num, run) {
  try { localStorage.setItem(runKey(num), JSON.stringify(run)); } catch (e) {}
}

export function potluckScore(day, run) {
  let score = 0, time = 0, played = 0;
  (day.quizzes || []).forEach((_, i) => {
    const r = run.done[i];
    if (!r) return;
    played++;
    score += r.t > 0 ? Math.max(0, Math.min(PER_QUIZ, Math.round((PER_QUIZ * r.s) / r.t))) : 0;
    time += Math.max(0, r.e || 0);
  });
  return { score, total: POT_TOTAL, time, played };
}

// The daily contract every client keeps (see CLAUDE.md, "Opening a game is not
// starting it"): the per-puzzle save with t0, the day breadcrumb, the stats.
function writeDaily(day, run) {
  try {
    const done = !!run.turnedIn;
    localStorage.setItem(`sot_potluck_${day.num}`, JSON.stringify({ v: 1, status: done ? 'done' : 'playing', t0: run.t0 }));
    if (day.live === etToday()) {
      if (done || run.t0) localStorage.setItem('sot_potluck_day', JSON.stringify({ d: etToday(), done }));
    }
  } catch (e) {}
}

export function startRun(day) {
  const run = loadRun(day.num);
  if (!run.t0) { run.t0 = Date.now(); saveRun(day.num, run); writeDaily(day, run); }
  return run;
}

// One quiz finished inside a Potluck run. Write-once per slot: a replay of the
// same quiz never moves the day's figure, and nothing records after turn-in.
export function recordPotluck(day, i, res) {
  const run = loadRun(day.num);
  if (run.turnedIn || run.done[i]) return run;
  if (!run.t0) run.t0 = Date.now();
  run.done[i] = { s: Number(res.s) || 0, t: Number(res.t) || 0, e: Number(res.e) || 0 };
  saveRun(day.num, run);
  writeDaily(day, run);
  if (Object.keys(run.done).length >= (day.quizzes || []).length) return turnInPotluck(day);
  return run;
}

function anonId() {
  try {
    let a = localStorage.getItem('sot_quiz_anon');
    if (!a) {
      a = (window.crypto && crypto.randomUUID) ? crypto.randomUUID() : `a_${Date.now()}_${Math.random().toString(36).slice(2)}`;
      localStorage.setItem('sot_quiz_anon', a);
    }
    return a;
  } catch (e) { return null; }
}

// Post the day, once. Returns the run (turnedIn set) and the fetch promise.
export function turnInPotluck(day) {
  const run = loadRun(day.num);
  if (run.turnedIn) return run;
  const { score, total, time, played } = potluckScore(day, run);
  if (!played) return run;
  run.turnedIn = true;
  run.result = { score, total, time, played };
  saveRun(day.num, run);
  writeDaily(day, run);
  try {
    const st = JSON.parse(localStorage.getItem('sot_potluck_stats') || 'null') || { v: 1, rec: {} };
    if (!st.rec) st.rec = {};
    if (!st.rec[day.num]) st.rec[day.num] = { s: score, t: total, won: score === total };
    localStorage.setItem('sot_potluck_stats', JSON.stringify(st));
  } catch (e) {}
  let email;
  try { const id = JSON.parse(localStorage.getItem('sot_quiz_identity') || 'null'); if (id && id.email) email = id.email; } catch (e) {}
  let mobile = false;
  try { mobile = /Mobi|Android|iPhone|iPad/i.test(navigator.userAgent || ''); } catch (e) {}
  try {
    fetch('/api/quiz/result', {
      method: 'POST', keepalive: true, headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        quizId: day.quizId, score, total, correct: score, guessesUsed: 0,
        timeElapsed: Math.max(1, Math.round(time)), email, anonId: anonId(), isMobile: mobile,
        referrer: (typeof document !== 'undefined' ? document.referrer : ''),
      }),
    }).catch(() => {});
  } catch (e) {}
  return run;
}
