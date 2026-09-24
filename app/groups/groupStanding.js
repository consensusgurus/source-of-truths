'use client';
// ONE CLIENT FOR /api/groups/standing (owner, 2026-09-17).
//
// Seven surfaces read where the viewer stands in their groups, and most of
// them can be on one page at once (the home carries the band, the badge, the
// tile dots and the arrival). They all go through here, so a page asks once:
// the in-flight promise is shared, and a short sessionStorage copy means a
// reader bouncing between the home and a game does not pay for it every time.
//
// A BROWSER WITH NO SAVED NAME NEVER ASKS. Only an account can be in a group,
// and every account this site makes leaves sot_quiz_identity behind, so the
// guest majority costs nothing.
//
// fresh: true skips the copy (the finish line asks after a score has posted).
// A finished game also clears the copy through `invalidateGroupStanding`, so
// the home a player returns to shows the move they just made.
import { useEffect, useState } from 'react';
import { getVisitorId } from '@/lib/visitor';

const TTL = 45 * 1000;
const SS = (day) => `sot_grpstand_${day}`;
const pending = {};

export function standingIdentity() {
  if (typeof window === 'undefined') return null;
  let id = null;
  try { id = JSON.parse(localStorage.getItem('sot_quiz_identity') || 'null'); } catch (e) { id = null; }
  if (!id || !id.username) return null;
  const q = new URLSearchParams();
  const a = getVisitorId();
  if (a) q.set('anonId', a);
  if (id.email) q.set('email', id.email);
  return q;
}

function etToday() {
  try { return new Date().toLocaleDateString('en-CA', { timeZone: 'America/New_York' }); }
  catch (e) { return new Date().toISOString().slice(0, 10); }
}

export function invalidateGroupStanding() {
  try { sessionStorage.removeItem(SS('today')); } catch (e) {}
  delete pending.today;
}

export function fetchGroupStanding({ day = 'today', fresh = false } = {}) {
  const q = standingIdentity();
  if (!q) return Promise.resolve(null);
  if (!fresh) {
    try {
      const c = JSON.parse(sessionStorage.getItem(SS(day)) || 'null');
      if (c && c.at && Date.now() - c.at < TTL && c.et === etToday() && c.data) return Promise.resolve(c.data);
    } catch (e) {}
    if (pending[day]) return pending[day];
  }
  if (day === 'yesterday') q.set('day', 'yesterday');
  const p = fetch(`/api/groups/standing?${q.toString()}`, { cache: 'no-store' })
    .then((r) => (r.ok ? r.json() : null))
    .then((d) => {
      const ok = d && d.registered && Array.isArray(d.groups) ? d : null;
      try { if (ok) sessionStorage.setItem(SS(day), JSON.stringify({ at: Date.now(), et: etToday(), data: ok })); } catch (e) {}
      return ok;
    })
    .catch(() => null)
    .finally(() => { if (pending[day] === p) delete pending[day]; });
  pending[day] = p;
  return p;
}

// Returns undefined while reading, null when there is nothing to show (a guest,
// no groups, a failed read), or the payload.
export default function useGroupStanding(day = 'today', enabled = true) {
  const [data, setData] = useState(undefined);
  useEffect(() => {
    if (!enabled) return undefined;
    let alive = true;
    fetchGroupStanding({ day }).then((d) => {
      if (!alive) return;
      setData(d && d.groups && d.groups.length ? d : null);
    });
    return () => { alive = false; };
  }, [day, enabled]);
  return data;
}

// Ordinals, place words and a stable colour index per member.
export function ordinal(n) {
  const s = ['th', 'st', 'nd', 'rd'];
  const v = n % 100;
  return n + (s[(v - 20) % 10] || s[v] || s[0]);
}
export function hueIndex(key) {
  let h = 0;
  const k = String(key || '');
  for (let i = 0; i < k.length; i++) h = (h * 31 + k.charCodeAt(i)) >>> 0;
  return h % 7;
}
// WHOLE NUMBERS ONLY on the group surfaces (owner, 2026-09-24): the ladder
// rows, the tiles, the band and the feed read 90 and 15, never 90.0. A tie
// that averages to a half rounds up.
export function fmtPts(n) {
  const v = Number(n);
  return Number.isFinite(v) ? String(Math.round(v)) : '0';
}

// The best place across the viewer's groups today, for the badge.
export function bestPlace(data) {
  if (!data || !data.groups) return null;
  let best = null;
  for (const g of data.groups) {
    if (g.rank && (!best || g.rank < best.rank)) best = { rank: g.rank, name: g.name, code: g.code };
  }
  return best;
}

// Where a total would have placed on a group's board, ignoring the viewer's own
// row. Used for "before this game".
export function placeFor(total, totals, myKey) {
  const t10 = Math.round((Number(total) || 0) * 10);
  if (t10 <= 0) return null;
  let above = 0;
  for (const r of totals || []) {
    if (r.userKey === myKey) continue;
    if (Math.round(r.total * 10) > t10) above += 1;
  }
  return above + 1;
}

// The viewer's total with one game taken out, on the day's best-N rule.
export function totalWithout(myPoints, gameKey, bestN) {
  const pts = Object.entries(myPoints || {})
    .filter(([k]) => k !== gameKey)
    .map(([, v]) => Number(v) || 0)
    .sort((a, b) => b - a)
    .slice(0, bestN || 25);
  return Math.round(pts.reduce((s, v) => s + v, 0) * 10) / 10;
}

// Shared avatar colours for both registers, keyed off .stage-page's attribute.
export const AVATAR_CSS = `
.gsa{width:22px;height:22px;border-radius:50%;display:inline-grid;place-items:center;flex:none;
  font:800 9.5px/1 Manrope,system-ui,sans-serif;color:#08222e;}
.gsa0{background:#7dd3fc}.gsa1{background:#6ee7b7}.gsa2{background:#fb7185}.gsa3{background:#c084fc}
.gsa4{background:#fbbf24}.gsa5{background:#a5b4fc}.gsa6{background:#e879f9}
[data-stage-theme=light] .gsa{color:#ffffff;}
[data-stage-theme=light] .gsa0{background:#1d4ed8}[data-stage-theme=light] .gsa1{background:#047857}
[data-stage-theme=light] .gsa2{background:#be123c}[data-stage-theme=light] .gsa3{background:#7e22ce}
[data-stage-theme=light] .gsa4{background:#9c5d02}[data-stage-theme=light] .gsa5{background:#4338ca}
[data-stage-theme=light] .gsa6{background:#a21caf}
.gsa.off{background:var(--stg-surf2,rgba(255,255,255,.08));color:var(--stg-mute,#8b95a8);}
`;

export function MiniAvatar({ name, userKey, off = false, className = '' }) {
  return (
    <span className={`gsa gsa${hueIndex(userKey || name)}${off ? ' off' : ''}${className ? ' ' + className : ''}`} aria-hidden="true">
      {String(name || '?').slice(0, 1).toUpperCase()}
    </span>
  );
}

// HOW LONG AGO, in one or two characters. Reads the clock, so it may only be
// called from a render that never happens on the server: the band waits for the
// standing fetch, which is client-only, so it is safe there (2026-09-22).
export function relTime(iso) {
  const t = Date.parse(iso || '');
  if (!t) return '';
  const s = Math.max(0, Math.round((Date.now() - t) / 1000));
  if (s < 90) return 'now';
  const m = Math.round(s / 60);
  if (m < 60) return m + 'm';
  const h = Math.floor(m / 60);
  if (h < 24) return h + 'h';
  return Math.floor(h / 24) + 'd';
}

// WHERE THE GAP WENT. The per-game difference between the viewer and one other
// member, biggest first. It is NOT an arithmetic decomposition of the day's
// total, because best-N means the totals need not be the sum of these: it is
// the honest "these are the games you are apart on", which is what a reader
// can actually act on. Games neither of them played contribute nothing.
export function swingVs(g, myKey, otherKey) {
  if (!g || !g.boards || !myKey || !otherKey) return [];
  const out = [];
  for (const key of Object.keys(g.boards)) {
    let mine = null;
    let theirs = null;
    for (const r of g.boards[key] || []) {
      if (r.userKey === myKey) mine = Number(r.points) || 0;
      else if (r.userKey === otherKey) theirs = Number(r.points) || 0;
    }
    if (mine === null && theirs === null) continue;
    const diff = Math.round(((mine || 0) - (theirs || 0)) * 10) / 10;
    if (!diff) continue;
    out.push({ key, diff });
  }
  out.sort((a, b) => Math.abs(b.diff) - Math.abs(a.diff));
  return out.slice(0, 3);
}

// EVERY MEMBER'S DAY, for the ladders under the reader's own. Ordered by points,
// the reader lifted out, and the tail past `max` folded into one row: six is
// what the home draws, so a fifty-member group shows the five above the reader
// and a remainder rather than fifty ladders (2026-09-22).
export function memberRows(g, myKey, max = 6) {
  const empty = { me: null, rows: [], rest: 0, restGames: 0, played: 0 };
  if (!g || !g.roster || !g.roster.length) return empty;
  const rowOf = new Map((g.rows || []).map((r) => [r.userKey, r]));
  const playedOf = {};
  // DISTINCT GAMES, and FINISHED ones. Two traps, both seen live:
  //
  //   1. Not a count of member-game pairs. The home prints this as "N of
  //      today's 94", and pairs run past 94 the moment two members play the
  //      same puzzle.
  //   2. Not `g.games`, which keeps an ABANDONED row whenever it carries
  //      points. Points are positional, so a run abandoned scoring 0 is still
  //      paid 15 when nobody else has played that game, and the summary then
  //      read "11 of today's 94" beside a day's progress of 10. These ladders
  //      sit directly under the reader's own, which counts finished games, so
  //      they have to mean the same thing.
  //
  // The dots on the tiles still read `g.games`: "somebody is on this" is a fair
  // reading there, and that behaviour predates this.
  const touched = new Set();
  const src = g.boards && Object.keys(g.boards).length ? g.boards : null;
  if (src) {
    for (const key of Object.keys(src)) {
      for (const r of src[key] || []) {
        if (r.abandoned) continue;
        if (!playedOf[r.userKey]) playedOf[r.userKey] = new Set();
        playedOf[r.userKey].add(key);
        touched.add(key);
      }
    }
  } else {
    for (const key of Object.keys(g.games || {})) {
      for (const uk of g.games[key] || []) {
        if (!playedOf[uk]) playedOf[uk] = new Set();
        playedOf[uk].add(key);
        touched.add(key);
      }
    }
  }
  const played = touched.size;
  const all = g.roster.map((m) => {
    const r = rowOf.get(m.userKey) || null;
    const keys = playedOf[m.userKey] || new Set();
    return {
      userKey: m.userKey,
      username: m.username,
      total: r ? r.total : 0,
      rank: r ? r.rank : null,
      games: keys.size,
      keys,
      me: m.userKey === myKey,
    };
  }).sort((a, b) => b.total - a.total
    || b.games - a.games
    || String(a.username || '').localeCompare(String(b.username || '')));
  const me = all.find((x) => x.me) || null;
  const others = all.filter((x) => !x.me);
  const shown = others.slice(0, Math.max(0, max - 1));
  const hidden = others.slice(shown.length);
  return {
    me,
    rows: shown,
    rest: hidden.length,
    restGames: hidden.reduce((n, x) => n + x.games, 0),
    played,
  };
}

export { etToday as standingToday };
