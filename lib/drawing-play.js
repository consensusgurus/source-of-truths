// PLAY TICKETS for the drawing (owner, 2026-10-21). Bringing in a new player
// is still one ticket and is uncapped (lib/drawing-server.js); on top of that a
// registered player earns tickets for playing, capped at DRAWING.play.cap:
//
//   streak   1/2 for every 7 days in a row with at least one daily played
//   winDay   1/2 for finishing #1 on a completed day's combined board
//   winGame  1/4 for finishing #1 on a completed day's single daily board
//   email    1/4 for having an email on the account (existing ones count too)
//
// Like the friend tickets these are DERIVED, never stored, from the same rows
// every board reads, so they cannot drift from what players see. Wins are only
// counted for days that are over (Eastern), using the same scoreGame and
// combineDaily the live boards and /api/quiz/daily-history use, with the same
// two freezes: rows posted after the day ended do not count, and an account
// created after the day ended is scored as the guest it was that night.
//
// A single-game win needs at least two registered finishers on that board, so
// a game nobody else played that day cannot be farmed for tickets.

import { DRAWING } from './drawing.js';
import { scoreGame, combineDaily, bestNForSuffix, etDayEndMs } from './daily-combined';
import { DAILY_KEYS } from './daily-games';

const DAILY_RE = new RegExp(`^(${DAILY_KEYS.join('|')})-(\\d+)-(\\d+)-(\\d+)$`);
const ET_DAY = new Intl.DateTimeFormat('en-CA', { timeZone: 'America/New_York', year: 'numeric', month: '2-digit', day: '2-digit' });
const DAY_MS = 86400000;

function etIso(ms) { return ET_DAY.format(new Date(ms)); }
function isoOfSuffix(s) {
  const [M, D, YY] = s.split('-').map(Number);
  return `${2000 + YY}-${String(M).padStart(2, '0')}-${String(D).padStart(2, '0')}`;
}
// 'YYYY-MM-DD' -> whole days since epoch, so consecutive dates differ by 1.
function dayNo(iso) { return Math.round(Date.parse(`${iso}T12:00:00Z`) / DAY_MS); }

/**
 * @param rows   quiz_results rows (the shared cache; read-only)
 * @param users  quiz_users rows: { id, username, ref_code, email, created_at }
 * @param now    ms, for tests
 * @returns Map(userId -> { streak, winDay, winGame, email, raw, play, streakRuns, dayWins, gameWins })
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
  const out = new Map();
  const get = (id) => {
    let t = out.get(id);
    if (!t) { t = { streak: 0, winDay: 0, winGame: 0, email: 0, raw: 0, play: 0, streakRuns: 0, dayWins: 0, gameWins: 0 }; out.set(id, t); }
    return t;
  };
  for (const u of users || []) {
    const t = Date.parse(u.created_at);
    if (!Number.isNaN(t)) acctMs.set(u.id, t);
    if (u.email && String(u.email).trim()) get(u.id).email = P.email;
  }

  // One pass over the rows: the days each player played, and every completed
  // day's daily rows by game.
  const played = new Map(); // userId -> Set(dayNo)
  const byDay = new Map();  // suffix -> Map(key -> rows)
  for (const r of rows || []) {
    const qid = r && r.quiz_id;
    if (!qid) continue;
    const m = qid.match(DAILY_RE);
    if (!m) continue;
    const at = Date.parse(r.created_at || '');
    if (r.user_id && !r.abandoned && Number.isFinite(at) && at >= startMs && at <= cutoff) {
      let s = played.get(r.user_id);
      if (!s) { s = new Set(); played.set(r.user_id, s); }
      s.add(dayNo(etIso(at)));
    }
    const suffix = `${m[2]}-${m[3]}-${m[4]}`;
    const iso = isoOfSuffix(suffix);
    if (iso < startIso || iso > endIso || iso >= todayIso) continue; // only finished days in the window
    if (Number.isFinite(at) && at >= etDayEndMs(iso)) continue;       // posted after the day closed
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
    if (runs) { const t = get(uid); t.streakRuns = runs; t.streak = runs * P.streak; }
  }

  // Wins, day by day.
  for (const [suffix, dm] of byDay) {
    const dayEnd = etDayEndMs(isoOfSuffix(suffix));
    const asPlayed = (rs) => rs.map((r) => {
      if (!r.user_id || !r.anon_id) return r;
      const born = acctMs.get(r.user_id);
      return (born && born >= dayEnd) ? { ...r, user_id: null, username: null } : r;
    });
    const gameResults = [];
    for (const [key, rs] of dm) {
      const gr = scoreGame(asPlayed(rs));
      if (gr.field <= 0) continue;
      gameResults.push({ key, quizId: `${key}-${suffix}`, field: gr.field, players: gr.players });
      const named = [...gr.players.values()].filter((p) => p.registered && !p.abandoned);
      if (named.length < 2) continue;
      for (const p of named) {
        if (p.rankedPos === 1) {
          const t = get(p.userKey.slice(2));
          t.gameWins += 1;
          t.winGame += P.winGame;
        }
      }
    }
    if (!gameResults.length) continue;
    const overall = combineDaily(gameResults, bestNForSuffix(suffix));
    const champ = overall.find((o) => String(o.userKey || '').startsWith('u:'));
    if (champ) {
      const t = get(champ.userKey.slice(2));
      t.dayWins += 1;
      t.winDay += P.winDay;
    }
  }

  for (const t of out.values()) {
    t.raw = t.streak + t.winDay + t.winGame + t.email;
    t.play = Math.min(P.cap, t.raw);
  }
  return out;
}
