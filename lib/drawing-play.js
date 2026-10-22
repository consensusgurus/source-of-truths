// PLAY TICKETS for the drawing (owner, 2026-10-21; rules revised the same
// night). A registered player WITH AN EMAIL earns, from the moment the email
// was added (never for anything before it):
//
//   email    1 ticket for having an email on the account
//   streak   1/2 for every 7 days in a row with at least one daily played
//   winDay   1/2 for finishing #1 on a completed day's combined board
//   winGame  1/4 for finishing #1 on a completed day's single daily board,
//            at most DRAWING.play.winGameCap tickets this way
//
// Streaks and wins together are capped at DRAWING.play.cap; the email ticket
// sits outside the cap. Friend tickets live in lib/drawing-server.js.
//
// Like the friend tickets these are DERIVED, never stored, from the same rows
// every board reads. Wins are only counted for days that are over (Eastern),
// using the same scoreGame and combineDaily the live boards and
// /api/quiz/daily-history use, with the same two freezes: rows posted after the
// day ended do not count, and an account created after the day ended is scored
// as the guest it was that night. A single-game win needs at least two
// registered finishers on that board.

import { DRAWING } from './drawing.js';
import { scoreGame, combineDaily, bestNForSuffix, etDayEndMs } from './daily-combined';
import { DAILY_KEYS } from './daily-games';

const DAILY_RE = new RegExp(`^(${DAILY_KEYS.join('|')})-(\\d+)-(\\d+)-(\\d+)$`);
const ET_DAY = new Intl.DateTimeFormat('en-CA', { timeZone: 'America/New_York', year: 'numeric', month: '2-digit', day: '2-digit' });
const DAY_MS = 86400000;

function etIso(ms) { return ET_DAY.format(new Date(ms)); }
// etDayEndMs builds Intl formatters, so it is memoized per day: called once per
// row it cost tens of thousands of formatter constructions and hung the route.
const dayEndMemo = new Map();
function dayEnd(iso) {
  let v = dayEndMemo.get(iso);
  if (v === undefined) { v = etDayEndMs(iso); dayEndMemo.set(iso, v); }
  return v;
}
function isoOfSuffix(s) {
  const [M, D, YY] = s.split('-').map(Number);
  return `${2000 + YY}-${String(M).padStart(2, '0')}-${String(D).padStart(2, '0')}`;
}
// 'YYYY-MM-DD' -> whole days since epoch, so consecutive dates differ by 1.
function dayNo(iso) { return Math.round(Date.parse(`${iso}T12:00:00Z`) / DAY_MS); }

// When an account's email was added: quiz_users.email_at (migration 61), else
// the account's creation (every account made before the column existed).
export function emailAddedAt(u) {
  if (!u || !u.email || !String(u.email).trim()) return null;
  const t = Date.parse(u.email_at || u.created_at || '');
  return Number.isFinite(t) ? t : Date.parse(DRAWING.startsAt);
}
// When tickets start for this account: the later of the drawing's start and
// the email being added. Null for an account with no email (it earns nothing).
export function ticketStartOf(u) {
  const t = emailAddedAt(u);
  return t == null ? null : Math.max(Date.parse(DRAWING.startsAt), t);
}

/**
 * @param rows   quiz_results rows (the shared cache; read-only)
 * @param users  quiz_users rows: { id, email, created_at, email_at? }
 * @param now    ms, for tests
 * @returns Map(userId -> { email, streak, winDay, winGame, raw, play, earned, streakRuns, dayWins, gameWins, startAt })
 */
export function computePlayTickets(rows, users, now = Date.now()) {
  const P = DRAWING.play;
  const startMs = Date.parse(DRAWING.startsAt);
  const endMs = Date.parse(DRAWING.endsAt);
  const startIso = etIso(startMs);
  const endIso = etIso(endMs);
  const todayIso = etIso(Math.min(now, endMs + 1000));
  const cutoff = Math.min(now, endMs);

  const acctMs = new Map();
  const startOf = new Map(); // userId -> ms tickets start (email holders only)
  const out = new Map();
  for (const u of users || []) {
    const t = Date.parse(u.created_at);
    if (!Number.isNaN(t)) acctMs.set(u.id, t);
    const s = ticketStartOf(u);
    if (s == null || s > cutoff) continue;
    startOf.set(u.id, s);
    out.set(u.id, { email: P.email, streak: 0, winDay: 0, winGame: 0, raw: 0, play: 0, earned: 0,
      streakRuns: 0, dayWins: 0, gameWins: 0, startAt: new Date(s).toISOString() });
  }
  const startIsoOf = new Map([...startOf].map(([id, s]) => [id, etIso(s)]));

  // One pass over the rows: the days each email holder played after their
  // start, and every completed day's daily rows by game.
  const played = new Map(); // userId -> Set(dayNo)
  const byDay = new Map();  // suffix -> Map(key -> rows)
  for (const r of rows || []) {
    const qid = r && r.quiz_id;
    if (!qid) continue;
    const m = qid.match(DAILY_RE);
    if (!m) continue;
    const at = Date.parse(r.created_at || '');
    const s = r.user_id ? startOf.get(r.user_id) : undefined;
    if (s != null && !r.abandoned && Number.isFinite(at) && at >= s && at <= cutoff) {
      let set = played.get(r.user_id);
      if (!set) { set = new Set(); played.set(r.user_id, set); }
      set.add(dayNo(etIso(at)));
    }
    const suffix = `${m[2]}-${m[3]}-${m[4]}`;
    const iso = isoOfSuffix(suffix);
    if (iso < startIso || iso > endIso || iso >= todayIso) continue; // only finished days in the window
    if (Number.isFinite(at) && at >= dayEnd(iso)) continue;          // posted after the day closed
    let dm = byDay.get(suffix);
    if (!dm) { dm = new Map(); byDay.set(suffix, dm); }
    let arr = dm.get(m[1]);
    if (!arr) { arr = []; dm.set(m[1], arr); }
    arr.push(r);
  }

  // Streaks: every full 7 days inside a run of consecutive days earns a half.
  for (const [uid, set] of played) {
    const days = [...set].sort((a, b) => a - b);
    let run = 0; let prev = null; let runs = 0;
    const close = () => { runs += Math.floor(run / P.streakDays); };
    for (const d of days) {
      run = prev != null && d === prev + 1 ? run + 1 : (close(), 1);
      prev = d;
    }
    close();
    const t = out.get(uid);
    if (t && runs) { t.streakRuns = runs; t.streak = runs * P.streak; }
  }

  // Wins, day by day, credited only on days on or after the winner's start.
  const credit = (uid, iso) => {
    const t = out.get(uid);
    return t && iso >= startIsoOf.get(uid) ? t : null;
  };
  for (const [suffix, dm] of byDay) {
    const iso = isoOfSuffix(suffix);
    const closeMs = dayEnd(iso);
    const asPlayed = (rs) => rs.map((r) => {
      if (!r.user_id || !r.anon_id) return r;
      const born = acctMs.get(r.user_id);
      return (born && born >= closeMs) ? { ...r, user_id: null, username: null } : r;
    });
    const gameResults = [];
    for (const [key, rs] of dm) {
      const gr = scoreGame(asPlayed(rs));
      if (gr.field <= 0) continue;
      gameResults.push({ key, quizId: `${key}-${suffix}`, field: gr.field, players: gr.players });
      const named = [...gr.players.values()].filter((p) => p.registered && !p.abandoned);
      if (named.length < 2) continue;
      for (const p of named) {
        if (p.rankedPos !== 1) continue;
        const t = credit(p.userKey.slice(2), iso);
        if (t) t.gameWins += 1;
      }
    }
    if (!gameResults.length) continue;
    const overall = combineDaily(gameResults, bestNForSuffix(suffix));
    const champ = overall.find((o) => String(o.userKey || '').startsWith('u:'));
    if (champ) {
      const t = credit(champ.userKey.slice(2), iso);
      if (t) { t.dayWins += 1; t.winDay += P.winDay; }
    }
  }

  for (const t of out.values()) {
    t.winGame = Math.min(P.winGameCap, t.gameWins * P.winGame);
    t.raw = t.streak + t.winDay + t.winGame;
    t.play = Math.min(P.cap, t.raw);
    t.earned = t.play + t.email;
  }
  return out;
}
