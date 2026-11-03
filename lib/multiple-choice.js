// MULTIPLE CHOICE LEADERS (owner, 2026-11-03): one board over the five
// multiple choice runs, the Trivia Gauntlet, Trivia Encore, Math Gauntlet,
// Science Gauntlet and English Gauntlet. It replaced Polymath on every surface
// a player sees (Polymath's route, API and library stay in the tree, unlinked).
//
// A LENS, NEVER A NEW SCORE, exactly like Polymath and the circuit boards. The
// five runs play and post as they always have. The board reads the same
// quiz_results rows every per-game board reads, scored by the same scoreGame,
// and adds up each player's CORRECT ANSWERS: a game's score on these runs IS its
// questions right. Nothing is stored, no IQ Points move, no run board changes.
//
// Shared by the route (app/api/quiz/multiple-choice), the page
// (/multiple-choice), the run endings and start screens (app/circuits/McCard),
// and the home (app/today/StageToday). No 'use client' and no browser globals at
// module scope, so the server can import it.

// The five runs, in the order every surface lists them. `colour` is the pastel
// each run is drawn in on these surfaces (the run's own family: Trivia peach,
// Encore pink, Math mint, Science violet, English sky), carried with dark ink.
// `climb` orders the "Climb" suggestion: the shortest run first.
export const MC_RUNS = [
  { id: 'gauntlet', name: 'Trivia Gauntlet', short: 'Trivia', href: '/trivia', colour: '#fdbe8a', strong: '#fb923c', climb: 5 },
  { id: 'triviaencore', name: 'Trivia Encore', short: 'Encore', href: '/triviaencore', colour: '#f1affb', strong: '#e879f9', climb: 3 },
  { id: 'math', name: 'Math Gauntlet', short: 'Math', href: '/math', colour: '#a8f1d4', strong: '#6ee7b7', climb: 4 },
  { id: 'science', name: 'Science Gauntlet', short: 'Science', href: '/science', colour: '#d9b5fd', strong: '#c084fc', climb: 1 },
  { id: 'english', name: 'English Gauntlet', short: 'English', href: '/english', colour: '#b1e5fd', strong: '#7dd3fc', climb: 2 },
];
export const MC_IDS = MC_RUNS.map((r) => r.id);
export const MC_BY_ID = Object.fromEntries(MC_RUNS.map((r) => [r.id, r]));
export const MC_INK = '#08222e';
export const MC_HREF = '/multiple-choice';

// The first day the board counts: THE RUN launched on 2026-08-27, when the
// Trivia Gauntlet became one continuous quiz. Plays before it were separate
// dailies with a different roster, so All Time starts here.
export const MC_FROM = '2026-08-27';

// The four windows. Last Week and Last Month are the trailing 7 and 30 Eastern
// days, today included. `prev` is the window each is compared against for the
// movement arrows: yesterday, the 7 days before, the 30 days before, and for
// All Time the board as it stood a week ago.
export const MC_PERIODS = [
  { id: 'today', label: 'Today', days: 1, prevLabel: 'yesterday' },
  { id: 'week', label: 'Last Week', days: 7, prevLabel: 'the week before' },
  { id: 'month', label: 'Last Month', days: 30, prevLabel: 'the month before' },
  { id: 'all', label: 'All Time', days: 0, prevLabel: 'a week ago' },
];
export const MC_PERIOD_IDS = MC_PERIODS.map((p) => p.id);

export function etTodayIso() {
  try { return new Date().toLocaleDateString('en-CA', { timeZone: 'America/New_York' }); }
  catch (e) { return new Date().toISOString().slice(0, 10); }
}

export function addDays(iso, n) {
  const t = Date.parse(iso + 'T12:00:00Z') + n * 86400000;
  return new Date(t).toISOString().slice(0, 10);
}

// The inclusive [from, to] ISO days of a window ending on `today`, and of the
// window it is compared with. Never earlier than MC_FROM.
export function periodRange(id, today) {
  const clamp = (iso) => (iso < MC_FROM ? MC_FROM : iso);
  if (id === 'all') return { from: MC_FROM, to: today, prevFrom: MC_FROM, prevTo: addDays(today, -7) };
  const p = MC_PERIODS.find((x) => x.id === id) || MC_PERIODS[0];
  const from = clamp(addDays(today, -(p.days - 1)));
  const prevTo = addDays(from, -1);
  const prevFrom = clamp(addDays(from, -p.days));
  return { from, to: today, prevFrom, prevTo };
}

// ── This device's runs today, read off each run's own save ─────────────────
// sot_run_<id>_<day> is the run client's save (the same one Polymath read):
// phase 'done' is a finished run, and results[].score sums to its questions
// right. `override` is the run just finished, so the ending never reads stale.
export function localMcRun(id, day) {
  try {
    const run = JSON.parse(localStorage.getItem(`sot_run_${id}_${day}`) || 'null');
    if (!run || !run.phase || run.phase === 'idle' || run.practice) return { id, state: 'none', right: 0 };
    const right = (run.results || []).reduce((a, x) => a + (Number(x && x.score) || 0), 0);
    return { id, state: run.phase === 'done' ? 'done' : 'started', right };
  } catch (e) { return { id, state: 'none', right: 0 }; }
}

export function localMc(day = etTodayIso(), override = null) {
  const runs = MC_RUNS.map((r) => (override && override.id === r.id
    ? { id: r.id, state: 'done', right: Number(override.right) || 0 }
    : localMcRun(r.id, day)));
  const done = runs.filter((x) => x.state === 'done').length;
  const total = runs.reduce((a, x) => a + (x.state === 'none' ? 0 : x.right), 0);
  return { runs, done, total };
}

// The run to suggest next: the shortest one not finished today.
export function nextMcRun(local, exceptId = null) {
  const open = MC_RUNS.filter((r) => r.id !== exceptId && !(local && local.runs.find((x) => x.id === r.id && x.state === 'done')));
  open.sort((a, b) => a.climb - b.climb);
  return open[0] || null;
}

// The query string a client sends: the period plus this browser's identity.
export function mcQuery(period, ident, extra = {}) {
  const q = new URLSearchParams();
  q.set('period', MC_PERIOD_IDS.includes(period) ? period : 'today');
  if (ident && ident.anonId) q.set('anonId', ident.anonId);
  if (ident && ident.email) q.set('email', ident.email);
  for (const [k, v] of Object.entries(extra)) if (v != null && v !== '') q.set(k, String(v));
  return q.toString();
}
