// CHALLENGE A FRIEND (owner, 2026-10-07).
//
// A finished daily can be sent to ONE person as a link that carries the
// sender's name and result and nothing about the answers. The whole challenge
// lives in the link: there is no table, no row and no account behind it, so it
// works for a guest and costs no request. What that buys and what it costs:
//
//   - the receiver sees the figure to beat on the way in (app/ChallengeStrip)
//     and a head-to-head band on the way out (app/StageFinish);
//   - the sender is NOT told who took it. That return leg needs server state
//     and was deliberately left out of this pass.
//
// THE LINK IS FRIENDLY, NOT TRUSTED. Anyone can type a faster time into it.
// Nothing here touches a leaderboard, so a forged link beats nobody but the
// person it was sent to.
//
// Shape, one query param:   vs=<name>~<secs>~<score>-<total>~<num>~<won>~<day>
//   name   display name, URI-encoded, 24 chars at most ('A friend' for a guest)
//   secs   the run's clock, or empty when the game kept none
//   num    the puzzle number, which is what makes two runs the SAME board
//   won    1 or 0
//   x      (optional) a run's status line, empty when there is none
//   m      (optional) the game's own figure, from lib/challenge-metric.js:
//          47 points on Hands, 3 trades on Barter. The game key says what it
//          counts, so the link carries only the number.
//   day    the Eastern date it was sent on as yyyymmdd, or 0 when the sender
//          was already on an archive board. The landing page reads it to know
//          whether "today's board" is still the same board.

import { metricDef, fmtMetric } from './challenge-metric';
import { CIRCUITS, isMarquee, circuitScoreMode, runHref } from './circuits.js';

const clean = (s) => String(s == null ? '' : s).replace(/[~\u0000-\u001f<>]/g, '').trim().slice(0, 24);
const int = (v) => { const n = Number(v); return Number.isFinite(n) && n >= 0 ? Math.round(n) : null; };

export function mmssOf(secs) {
  const t = Math.max(0, Math.round(Number(secs) || 0));
  return `${Math.floor(t / 60)}:${String(t % 60).padStart(2, '0')}`;
}

export function encodeChallenge(c) {
  const name = encodeURIComponent(clean(c.name) || 'A friend');
  const t = c.t != null && int(c.t) != null ? int(c.t) : '';
  const out = [name, t, `${int(c.s) || 0}-${int(c.o) || 0}`, int(c.n) || 0, c.won ? 1 : 0, String(c.d || 0).replace(/\D/g, '') || 0];
  // A seventh part, for the runs: the status the card prints (a tier, a card,
  // quizzes cleared). Optional, so every older link still reads.
  const m = Number(c.m);
  const hasM = c.m != null && c.m !== '' && Number.isFinite(m) && Math.abs(m) < 1e7;
  if (clean(c.x) || hasM) out.push(clean(c.x) ? encodeURIComponent(clean(c.x)) : '');
  // An eighth part, the game's own figure (owner, 2026-10-07). Optional too.
  if (hasM) out.push(String(Math.round(m * 10) / 10));
  return out.join('~');
}

export function decodeChallenge(raw) {
  if (!raw || typeof raw !== 'string' || raw.length > 160) return null;
  const p = raw.split('~');
  if (p.length < 6) return null;
  let name = '';
  try { name = clean(decodeURIComponent(p[0])); } catch (e) { name = clean(p[0]); }
  const so = String(p[2]).split('-');
  const n = int(p[3]);
  if (!n) return null;
  const t = p[1] === '' ? null : int(p[1]);
  const c = { name: name || 'A friend', t: t != null && t < 86400 ? t : null, s: int(so[0]) || 0, o: int(so[1]) || 0, n, won: p[4] === '1', d: String(p[5] || '0') };
  if (p[7] != null && p[7] !== '') {
    const m = Number(p[7]);
    if (Number.isFinite(m) && Math.abs(m) < 1e7) c.m = m;
  }
  // A challenge has to carry SOMETHING to beat.
  // A MISS WITH NOTHING TO BEAT still decodes when it names the board's size
  // (owner, 2026-10-07: even a loss offers the challenge). Before 2026-10-15 it
  // was rejected here, so every 0-score loss sent a link whose landing said it
  // "did not come through whole".
  if (c.t == null && !c.s && c.m == null && !c.o) return null;
  if (p[6]) { try { c.x = clean(decodeURIComponent(p[6])); } catch (e) { c.x = clean(p[6]); } }
  return c;
}

// The one figure a run is known by: the game's own figure when the link carries
// one (47 points, 3 trades), else its clock when it was solved on one,
// otherwise its score. Pass the game key, or the game's figure cannot be named.
// A MISS WITH NOTHING TO BEAT (owner, 2026-10-07: even a loss offers the
// challenge). No solve, no score, no game figure: the link dares the friend to
// crack it rather than printing 0/1 as though it were a result.
export function isBlankMiss(c) {
  return !!c && !c.won && !(Number(c.s) > 0) && c.m == null;
}

export function challengeFig(c, key = null) {
  if (!c) return '';
  if (c.m != null && metricDef(key)) return fmtMetric(key, c.m);
  if (c.won && c.t != null) return mmssOf(c.t);
  // A questions-right run names the count only, never the total (owner,
  // 2026-10-15): "61 right", not "61/180". Older links still carry o.
  if (key && RUN_CHALLENGES[key] && RUN_CHALLENGES[key].unit === 'right') return `${c.s} right`;
  return c.o ? `${c.s}/${c.o}` : String(c.s);
}

// You against them, on the same board. A solve beats a miss; two solves with
// clocks go to the faster; anything else goes to the higher score.
export function challengeResult(you, them, key = null) {
  if (!you || !them) return null;
  // THE GAME'S OWN FIGURE DECIDES, when both runs carry it. A game where a
  // solve comes first still puts a solve ahead of a miss.
  const md = metricDef(key);
  if (md && you.m != null && them.m != null && !(md.solveFirst && you.won !== them.won)) {
    const diff = md.dir === 'low' ? them.m - you.m : you.m - them.m;
    if (diff !== 0) {
      const gap = Math.round(Math.abs(diff) * 10) / 10;
      return { res: diff > 0 ? 'win' : 'loss', by: `by ${fmtMetric(key, gap).replace(/ off$/, '')}` };
    }
    if (!(you.won && them.won && you.t != null && them.t != null)) return { res: 'tie', by: '' };
  }
  if (you.won !== them.won) return { res: you.won ? 'win' : 'loss', by: '' };
  if (you.won && you.t != null && them.t != null) {
    const d = them.t - you.t;
    const secs = (x) => `${x} second${x === 1 ? '' : 's'}`;
    return d === 0 ? { res: 'tie', by: '' } : { res: d > 0 ? 'win' : 'loss', by: `by ${Math.abs(d) >= 90 ? mmssOf(Math.abs(d)) : secs(Math.abs(d))}` };
  }
  const f = (r) => (r.o ? r.s / r.o : r.s);
  const d = f(you) - f(them);
  return d === 0 ? { res: 'tie', by: '' } : { res: d > 0 ? 'win' : 'loss', by: '' };
}

// EVERY RUN CAN BE CHALLENGED (owner, 2026-10-15: "include it on EVERY
// conclusion"). This used to be a hand-kept list of three, and every run built
// after it (Math Gauntlet, Trivia Encore, Judged, Dojo, Read the Room, Valet)
// shipped with no Challenge door, because a run that is not listed here cannot
// make a link, a landing or a card. The list is now DERIVED from lib/circuits:
// any circuit flagged `run` gets an entry, so a new run is challengeable the day
// it ships. OVERRIDES keeps the three hand-tuned entries exactly as they were
// (Price Check counts points, Passport opens older boards). A run that needs
// its own wording adds a line there; it never has to be added to be included.
// scripts/verify-challenge-coverage.mjs fails the build if a run is missing.
//
// `archive` says whether ?p=<num> opens an older one; a run with no board
// number only ever has today's. `unit` is how its figure reads: 'right' (a
// questions-right run shares "61 right", never the total), 'time' (the clock
// decides), or 'points'.
const RUN_OVERRIDES = {
  gauntlet: { key: 'gauntlet', name: 'Trivia Gauntlet', the: 'the Trivia Gauntlet', cat: 'Trivia', href: '/trivia', unit: 'right', archive: false },
  pricecheck: { key: 'pricecheck', name: 'Price Check', the: 'Price Check', cat: 'Numbers', href: '/pricecheck', unit: 'points', archive: false },
  passport: { key: 'passport', name: 'Passport', the: 'Passport', cat: 'Geography', href: '/passport', unit: 'points', archive: true },
};
// The category a run's card is painted in, by the engine that deals it.
const ENGINE_CAT = { quiz: 'Trivia', math: 'Numbers', jam: 'Logic', law: 'Logic', dojo: 'Sudoku', room: 'Crowd Psychology', price: 'Numbers', passport: 'Geography' };
const theOf = (name) => (/gauntlet$/i.test(name) ? `the ${name}` : name);
function buildRunChallenges() {
  const out = {};
  for (const c of CIRCUITS) {
    if (!c || !c.run || isMarquee(c.id)) continue;
    const mode = circuitScoreMode(c.id);
    out[c.id] = {
      key: c.id, name: c.name, the: theOf(c.name), cat: ENGINE_CAT[c.engine || 'quiz'] || 'Trivia',
      href: runHref(c.id), unit: mode === 'correct' ? 'right' : mode === 'time' ? 'time' : 'points', archive: false,
    };
  }
  return { ...out, ...RUN_OVERRIDES };
}
export const RUN_CHALLENGES = buildRunChallenges();
export const isChallengeableRun = (id) => !!(id && RUN_CHALLENGES[id]);
// The day as a board number (10-07 is 1007), for the runs that have none.
export const runDayNum = (iso) => { const p = String(iso || '').split('-'); return (Number(p[1]) || 0) * 100 + (Number(p[2]) || 0); };

export const ymdCompact = (iso) => String(iso || '').replace(/\D/g, '');

// Where the link sends a player: the game itself, on the archive board when
// the day it was sent on is over (or it was an archive board to begin with).
export function challengeDest(href, raw, c, todayIso, archive = true) {
  const sameDay = c.d !== '0' && c.d === ymdCompact(todayIso);
  const q = new URLSearchParams();
  if (!sameDay && archive) q.set('p', String(c.n));
  q.set('vs', raw);
  return `${href}?${q.toString()}`;
}

// ── browser side ──────────────────────────────────────────────────────────
// The link's param is read once and kept for the TAB (sessionStorage), because
// a client that rewrites its own URL mid-game would otherwise lose it before
// the finish card asks.
const KEY = (k) => `sot_vs_${k}`;
export function readChallenge(gameKey) {
  if (typeof window === 'undefined' || !gameKey) return null;
  try {
    const m = /[?&]vs=([^&#]+)/.exec(window.location.search);
    if (m) {
      const raw = decodeURIComponent(m[1]);
      if (decodeChallenge(raw)) { try { sessionStorage.setItem(KEY(gameKey), raw); } catch (e) { /* private window */ } }
      const c = decodeChallenge(raw);
      if (c) return c;
    }
    return decodeChallenge(sessionStorage.getItem(KEY(gameKey)) || '');
  } catch (e) { return null; }
}
export function dropChallenge(gameKey) {
  try { sessionStorage.removeItem(KEY(gameKey)); } catch (e) { /* nothing to drop */ }
}
