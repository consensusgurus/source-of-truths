'use client';
import React, { useState, useMemo, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Check, X, Eye, EyeOff, LogOut, Pencil, Trash2, MapPin, ShieldAlert } from 'lucide-react';
import { LISTS } from '@/lib/data';
import Grain from '@/app/Grain';
import GeoMapPanel from './GeoMapPanel';
import { exportUsersCsv, exportGamesCsv, downloadCsvFile } from './csv-export';
import { T } from '@/lib/theme';

// Local theme palette: the live-site look (Manrope + soft blue) applied to the
// admin desk. Shadows the magazine COLORS from lib/data so the public site is
// untouched; same keys the admin uses, remapped to the new theme.
const COLORS = {
  cream: T.surface,
  paper: T.white,
  ink: T.ink,
  faded: T.muted,
  ember: T.accent,
  forest: T.success,
  rust: '#b45309',
  line: 'rgba(20,22,28,0.30)',
};

function formatDate(iso) {
  if (!iso) return '';
  try {
    return new Date(iso).toLocaleString();
  } catch {
    return iso;
  }
}

// Seconds -> m:ss, for a quiz play's elapsed time.
function formatClock(secs) {
  const s = Number(secs);
  if (!Number.isFinite(s) || s < 0) return '—';
  const m = Math.floor(s / 60);
  const r = s % 60;
  return `${m}:${String(r).padStart(2, '0')}`;
}

// Calendar-day key (local time) for a play timestamp. Distinct days played is
// the simplest robust proxy for "separate sessions" without per-session
// tracking: two games on the same day count as one session, games on different
// days count separately.

// Short date (no time) for the "last session" column.
function formatDay(iso) {
  if (!iso) return '—';
  try {
    return new Date(iso).toLocaleDateString();
  } catch {
    return iso;
  }
}

// Compact date + time for the "last session" column, so same-day sessions are
// distinguishable and the time-based sort is visibly correct: "Jun 15, 2:23 PM".
function formatDayTime(iso) {
  if (!iso) return '—';
  try {
    return new Date(iso).toLocaleString(undefined, { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });
  } catch {
    return iso;
  }
}

// Compact M/D/YY date for the analytics tables, where horizontal room is tight.
function fmtShort(iso) {
  if (!iso) return '—';
  try {
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return iso;
    return `${d.getMonth() + 1}/${d.getDate()}/${String(d.getFullYear()).slice(-2)}`;
  } catch {
    return iso;
  }
}

// Compact M/D/YY + time-of-day, for the "last played" columns where the time of
// day matters (two sessions on the same day are distinguishable). e.g.
// "6/15/26 2:23 PM".
function fmtShortDateTime(iso) {
  if (!iso) return '—';
  try {
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return iso;
    const date = `${d.getMonth() + 1}/${d.getDate()}/${String(d.getFullYear()).slice(-2)}`;
    const time = d.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' });
    return `${date} ${time}`;
  } catch {
    return iso;
  }
}

const DOW = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

// Seconds -> "1m 23s" / "45s", for the avg-time-per-game stat.
function fmtDuration(secs) {
  const s = Number(secs);
  if (!Number.isFinite(s) || s < 0) return '—';
  const m = Math.floor(s / 60);
  const r = Math.round(s % 60);
  return m > 0 ? `${m}m ${r}s` : `${r}s`;
}

// 0-23 hour -> "8 PM".
function fmtHour(h) {
  if (h == null) return '—';
  const ap = h < 12 ? 'AM' : 'PM';
  const h12 = h % 12 === 0 ? 12 : h % 12;
  return `${h12} ${ap}`;
}

// A timestamp rendered in a given IANA timezone (the player's), so "last played"
// can be shown in THEIR local time, not just the admin's. Falls back to the
// admin-local compact format when no timezone is known.
function fmtLocalTime(iso, tz) {
  if (!iso) return '—';
  try {
    const opts = { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' };
    if (tz) opts.timeZone = tz;
    return new Date(iso).toLocaleString(undefined, opts);
  } catch {
    return fmtShortDateTime(iso);
  }
}

// Time of day only, in Eastern. The top-players board covers a single day, so
// repeating the date on every row would be noise.
function fmtEtClock(iso) {
  if (!iso) return '\u2014';
  try {
    return new Date(iso).toLocaleString('en-US', { timeZone: 'America/New_York', hour: 'numeric', minute: '2-digit' });
  } catch {
    return '\u2014';
  }
}

// One labeled stat in the expanded player summary grid.
function Stat({ label, value }) {
  return (
    <div style={{ minWidth: 0 }}>
      <div style={{ fontFamily: 'DM Mono, monospace', fontSize: 10, letterSpacing: '0.1em', textTransform: 'uppercase', color: COLORS.faded }}>{label}</div>
      <div style={{ fontFamily: 'Manrope, system-ui, -apple-system, sans-serif', fontSize: 10, fontWeight: 700, color: COLORS.ink, marginTop: 1, overflow: 'hidden', textOverflow: 'ellipsis' }}>{value}</div>
    </div>
  );
}

// The per-player stat grid shown at the top of an expanded row: engagement,
// tenure, behavioral, and the full device/OS/browser/geo/timezone/language/
// traffic-source sets. Surfaces everything the columns can't fit.
function PlayerSummary({ stats }) {
  if (!stats) return null;
  const s = stats;
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px 28px', padding: '4px 12px 8px' }}>
      <Stat label="Plays" value={s.plays} />
      <Stat label="Quizzes" value={s.quizzes} />
      <Stat label="Accuracy" value={s.accuracy != null ? `${s.accuracy}%` : '—'} />
      <Stat label="Best score" value={s.bestScore != null ? s.bestScore : '—'} />
      <Stat label="Perfect" value={s.perfect} />
      <Stat label="Avg time" value={fmtDuration(s.avgTime)} />
      <Stat label="First seen" value={s.firstSeen ? fmtShort(s.firstSeen) : '—'} />
      <Stat label="Sessions" value={s.sessions != null ? s.sessions : '—'} />
      <Stat label="Active days" value={s.activeDays} />
      <Stat label="Most played" value={s.mostPlayed ? `${s.mostPlayed.title} (${s.mostPlayed.count})` : '—'} />
      <Stat label="Peak time" value={s.peakHour != null ? `${fmtHour(s.peakHour)} · ${DOW[s.peakDow] || ''}` : '—'} />
    </div>
  );
}

// Group a player's plays into sessions (gap-based sittings: a new session
// starts when the gap since the previous play exceeds 30 minutes) with
// per-session plays, average score %, and total time. Newest session first.
// Mirrors the SESSION_GAP_MS definition in app/admin/page.js playerStats.
const SESSION_GAP_MS = 30 * 60 * 1000;
function sessionsFromPlays(plays) {
  const sorted = (plays || [])
    .filter((p) => !Number.isNaN(Date.parse(p.createdAt)))
    .slice()
    .sort((a, b) => Date.parse(a.createdAt) - Date.parse(b.createdAt));
  const groups = [];
  for (const p of sorted) {
    const t = Date.parse(p.createdAt);
    const g = groups[groups.length - 1];
    if (!g || t - g.lastT > SESSION_GAP_MS) {
      groups.push({ start: p.createdAt, latest: p.createdAt, lastT: t, items: [p] });
    } else {
      g.items.push(p);
      g.latest = p.createdAt;
      g.lastT = t;
    }
  }
  const distinct = (items, f) => {
    const seen = new Set();
    const out = [];
    for (const p of items) { const v = p[f]; if (v && !seen.has(v)) { seen.add(v); out.push(v); } }
    return out;
  };
  return groups.map((g) => {
    let scoreSum = 0, scoreN = 0, timeSum = 0;
    for (const p of g.items) {
      if (typeof p.score === 'number' && typeof p.total === 'number' && p.total > 0) { scoreSum += Math.min(1, p.score / p.total); scoreN += 1; }
      if (typeof p.timeElapsed === 'number' && p.timeElapsed >= 0) timeSum += p.timeElapsed;
    }
    return {
      start: g.start, latest: g.latest, plays: g.items.length,
      acc: scoreN ? Math.round((scoreSum / scoreN) * 100) : null, time: timeSum,
      devices: distinct(g.items, 'device'), oses: distinct(g.items, 'os'),
      browsers: distinct(g.items, 'browser'), geos: distinct(g.items, 'geo'),
      timezones: distinct(g.items, 'timezone'), languages: distinct(g.items, 'language'),
      referrers: distinct(g.items, 'referrer'),
    };
  }).sort((a, b) => String(b.latest).localeCompare(String(a.latest)));
}

// Per-session (per-day) table shown in an expanded player row, above the
// individual play history. Each session carries that day's context — device,
// OS, browser, location, timezone, language, traffic source — since those can
// change from one session to the next.
function SessionTable({ plays, limit = DETAIL_ROWS }) {
  const all = sessionsFromPlays(plays);
  const [showAll, setShowAll] = useState(false);
  if (!all.length) return null;
  const capped = limit != null && !showAll && all.length > limit;
  const sessions = capped ? all.slice(0, limit) : all;
  const H = ({ label, flex, right }) => (
    <span style={{ flex, textAlign: right ? 'right' : 'left' }}>{label}</span>
  );
  return (
    <div style={{ marginBottom: 12 }}>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, margin: '2px 0 6px' }}>
        <span style={{ fontFamily: 'DM Mono, monospace', fontSize: 10, letterSpacing: '0.12em', textTransform: 'uppercase', color: COLORS.faded }}>
          Sessions · {capped ? `${sessions.length} of ${all.length}` : all.length}
        </span>
        {all.length > limit ? <MoreButton open={showAll} n={all.length} noun="session" onClick={() => setShowAll((v) => !v)} /> : null}
      </div>
      <div style={{ border: `1px solid ${COLORS.ink}33`, background: COLORS.paper }}>
        <div style={{ display: 'flex', gap: 12, fontFamily: 'DM Mono, monospace', fontSize: 10, letterSpacing: '0.12em', textTransform: 'uppercase', color: COLORS.faded, padding: '3px 12px', borderBottom: `1px solid ${COLORS.ink}33` }}>
          <H label="Session" flex="0 0 118px" />
          <H label="Plays" flex="0 0 38px" right />
          <H label="Avg %" flex="0 0 42px" right />
          <H label="Time" flex="0 0 54px" right />
          <H label="Device" flex="0 0 52px" />
          <H label="OS" flex="0 0 52px" />
          <H label="Browser" flex="0 0 60px" />
          <H label="Geo" flex="0 0 96px" />
          <H label="Timezone" flex="0 0 116px" />
          <H label="Lang" flex="0 0 50px" />
          <H label="Source" flex="0 0 84px" />
        </div>
        {sessions.map((s, j) => (
          <div key={s.start} style={{ display: 'flex', gap: 12, alignItems: 'center', fontFamily: 'Manrope, system-ui, -apple-system, sans-serif', fontSize: 10, color: COLORS.ink, padding: '3px 12px', borderBottom: j < sessions.length - 1 ? `1px solid ${COLORS.ink}1a` : 'none' }}>
            <span style={{ flex: '0 0 118px', fontFamily: 'DM Mono, monospace', fontSize: 10 }}>{fmtShortDateTime(s.start)}</span>
            <span style={{ flex: '0 0 38px', textAlign: 'right', fontFamily: 'DM Mono, monospace', fontSize: 10, fontWeight: 700, color: COLORS.ember }}>{s.plays}</span>
            <span style={{ flex: '0 0 42px', textAlign: 'right', fontFamily: 'DM Mono, monospace', fontSize: 10, color: COLORS.faded }}>{s.acc != null ? `${s.acc}%` : '—'}</span>
            <span style={{ flex: '0 0 54px', textAlign: 'right', fontFamily: 'DM Mono, monospace', fontSize: 10, color: COLORS.faded }}>{fmtDuration(s.time)}</span>
            <MultiCell values={s.devices} flex="0 0 52px" />
            <MultiCell values={s.oses} flex="0 0 52px" />
            <MultiCell values={s.browsers} flex="0 0 60px" />
            <MultiCell values={s.geos} flex="0 0 96px" />
            <MultiCell values={s.timezones} flex="0 0 116px" />
            <MultiCell values={s.languages} flex="0 0 50px" />
            <MultiCell values={s.referrers} flex="0 0 84px" />
          </div>
        ))}
      </div>
    </div>
  );
}

// ---- Shared expanded-row detail -------------------------------------------
// A player row expands to a summary + sessions + the games they played. Both
// inner tables show only the most recent DETAIL_ROWS entries; the rest are one
// click away, so opening a heavy player no longer dumps hundreds of rows.
const DETAIL_ROWS = 5;

function MoreButton({ open, n, noun, onClick }) {
  return (
    <button
      onClick={(e) => { e.stopPropagation(); onClick(); }}
      style={{ padding: '2px 8px', background: 'transparent', border: `1px solid ${COLORS.line}`, borderRadius: 999, color: COLORS.ember, fontFamily: 'DM Mono, monospace', fontSize: 9, letterSpacing: '0.08em', textTransform: 'uppercase', fontWeight: 700, cursor: 'pointer' }}
    >
      {open ? 'Show fewer' : `Show all ${n} ${noun}${n === 1 ? '' : 's'}`}
    </button>
  );
}

// The per-play history table, shared by the registered / anonymous / all-player
// tables (it used to be copy-pasted into each of the three).
function PlayHistoryTable({ plays, limit = DETAIL_ROWS, emptyNote }) {
  const all = plays || [];
  const [showAll, setShowAll] = useState(false);
  if (!all.length) {
    return (
      <p style={{ fontFamily: 'Manrope, system-ui, -apple-system, sans-serif', fontStyle: 'italic', fontSize: 10, color: COLORS.faded, margin: '8px 0' }}>
        {emptyNote || 'No completed games recorded.'}
      </p>
    );
  }
  const capped = limit != null && !showAll && all.length > limit;
  const rows = capped ? all.slice(0, limit) : all;
  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, margin: '2px 0 6px' }}>
        <span style={{ fontFamily: 'DM Mono, monospace', fontSize: 10, letterSpacing: '0.12em', textTransform: 'uppercase', color: COLORS.faded }}>
          Games · {capped ? `${rows.length} of ${all.length}` : all.length}
        </span>
        {all.length > limit ? <MoreButton open={showAll} n={all.length} noun="game" onClick={() => setShowAll((v) => !v)} /> : null}
      </div>
      <div style={{ border: `1px solid ${COLORS.ink}33`, background: COLORS.paper, maxHeight: showAll ? 420 : 'none', overflowY: showAll ? 'auto' : 'visible' }}>
        <div style={{ display: 'flex', gap: 14, position: 'sticky', top: 0, background: COLORS.paper, fontFamily: 'DM Mono, monospace', fontSize: 10, letterSpacing: '0.12em', textTransform: 'uppercase', color: COLORS.faded, padding: '3px 12px', borderBottom: `1px solid ${COLORS.ink}33` }}>
          <span style={{ flex: 3 }}>Quiz</span>
          <span style={{ flex: '0 0 76px', textAlign: 'right' }}>Score</span>
          <span style={{ flex: '0 0 56px', textAlign: 'right' }}>Time</span>
          <span style={{ flex: '0 0 78px' }}>Device</span>
          <span style={{ flex: '0 0 78px' }}>Geo</span>
          <span style={{ flex: '0 0 130px', textAlign: 'right' }}>Played</span>
        </div>
        {rows.map((x, j) => (
          <div key={`${x.quizId}-${j}`} style={{ display: 'flex', gap: 14, alignItems: 'center', fontFamily: 'Manrope, system-ui, -apple-system, sans-serif', fontSize: 10, color: COLORS.ink, padding: '3px 12px', borderBottom: j < rows.length - 1 ? `1px solid ${COLORS.ink}1a` : 'none' }}>
            <span style={{ flex: 3, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              <Link href={`/quiz/${encodeURIComponent(x.quizId)}`} target="_blank" onClick={(e) => e.stopPropagation()} style={{ color: COLORS.ink, textDecoration: 'none' }}>{x.title}</Link>
            </span>
            <span style={{ flex: '0 0 76px', textAlign: 'right', fontFamily: 'DM Mono, monospace', fontSize: 10 }}>{x.score}{x.total != null ? `/${x.total}` : ''}</span>
            <span style={{ flex: '0 0 56px', textAlign: 'right', fontFamily: 'DM Mono, monospace', fontSize: 10, color: COLORS.faded }}>{formatClock(x.timeElapsed)}</span>
            <span style={{ flex: '0 0 78px', fontFamily: 'DM Mono, monospace', fontSize: 10, color: x.device ? COLORS.ink : COLORS.faded }}>{x.device || '\u2014'}</span>
            <span style={{ flex: '0 0 78px', fontFamily: 'DM Mono, monospace', fontSize: 10, color: x.geo ? COLORS.ink : COLORS.faded }}>{x.geo || '\u2014'}</span>
            <span style={{ flex: '0 0 130px', textAlign: 'right', fontFamily: 'DM Mono, monospace', fontSize: 10, color: COLORS.faded }}>{fmtShortDateTime(x.createdAt)}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ---- Per-play detail, fetched when a row is opened ------------------------
// The page used to embed every player's whole play history in its own HTML so
// that expanding a row had the detail ready. Measured on the live site
// 2026-08-28 that was 72,254 play objects and ~34MB of a 35.7MB response, to
// serve rows that get opened one at a time. The collapsed tables only ever
// render each player's precomputed `stats`, which still ships with the page, so
// the detail now arrives from /api/admin/player-plays on expand.
//
// Cached at module scope rather than in component state because the three
// player tables (Signups, Anonymous, All Players) are separate components
// showing overlapping people: opening the same player in two of them, or
// closing and reopening a row, should not re-ask the server.
const playsCache = new Map(); // playerKey -> plays[]

function usePlayerPlays(playerKey, enabled) {
  const [state, setState] = useState(() => ({
    plays: playsCache.get(playerKey) || null,
    error: null,
  }));

  useEffect(() => {
    if (!enabled || !playerKey) return;
    const hit = playsCache.get(playerKey);
    if (hit) { setState({ plays: hit, error: null }); return; }
    // Guards against a stale response landing after the admin has closed this
    // row and opened another one.
    let live = true;
    setState({ plays: null, error: null });
    fetch(`/api/admin/player-plays?key=${encodeURIComponent(playerKey)}`)
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error(`HTTP ${r.status}`))))
      .then((d) => {
        const plays = Array.isArray(d.plays) ? d.plays : [];
        playsCache.set(playerKey, plays);
        if (live) setState({ plays, error: null });
      })
      .catch((e) => { if (live) setState({ plays: null, error: e.message || 'failed' }); });
    return () => { live = false; };
  }, [playerKey, enabled]);

  return state;
}

// The whole expanded body of a player row: the summary (from stats the page
// already shipped) plus the sessions and games tables (fetched). Replaces three
// copies of the same three-component block.
function PlayerDetail({ playerKey, stats, emptyNote }) {
  const { plays, error } = usePlayerPlays(playerKey, true);
  return (
    <div style={{ padding: '4px 14px 14px 48px', background: `${COLORS.ink}0a` }}>
      <PlayerSummary stats={stats} />
      {error ? (
        <p style={{ fontFamily: 'Manrope, system-ui, -apple-system, sans-serif', fontStyle: 'italic', fontSize: 10, color: COLORS.ember, margin: '8px 0' }}>
          Could not load this player&apos;s games ({error}).
        </p>
      ) : plays == null ? (
        <p style={{ fontFamily: 'Manrope, system-ui, -apple-system, sans-serif', fontStyle: 'italic', fontSize: 10, color: COLORS.faded, margin: '8px 0' }}>
          Loading games&hellip;
        </p>
      ) : (
        <>
          <SessionTable plays={plays} />
          <PlayHistoryTable plays={plays} emptyNote={emptyNote} />
        </>
      )}
    </div>
  );
}

// The player tables open showing the 10 most recent players; everything else is
// reachable by scrolling inside the box rather than pushing the charts below it
// off the screen. The box grows when a row is expanded so the detail is legible.
const PLAYERS_VIEW_H = 236;
const PLAYERS_VIEW_H_OPEN = 680;

// ----- Click-to-sort table infrastructure (shared by all analytics tables) ----
// A header cell click sorts by that column. Re-clicking the active column flips
// direction; switching columns picks a sensible default (descending for
// numbers, ascending for text). Numbers compare numerically, everything else by
// string; date columns expose a numeric accessor (Date.parse) so they sort
// chronologically.
function useSort(defaultKey, defaultDir = 'desc') {
  const [key, setKey] = useState(defaultKey);
  const [dir, setDir] = useState(defaultDir);
  const onSort = (k, type) => {
    if (k === key) {
      setDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setKey(k);
      setDir(type === 'string' ? 'asc' : 'desc');
    }
  };
  return { key, dir, onSort };
}

function applySort(rows, key, dir, accessors) {
  const acc = accessors[key];
  if (!acc) return rows;
  const sign = dir === 'asc' ? 1 : -1;
  return rows.slice().sort((a, b) => {
    const av = acc(a);
    const bv = acc(b);
    if (typeof av === 'number' || typeof bv === 'number') {
      return sign * ((Number(av) || 0) - (Number(bv) || 0));
    }
    return sign * String(av ?? '').localeCompare(String(bv ?? ''));
  });
}

// A sortable header cell. `k` is the sort key, `type` 'num' (default) or
// 'string' decides the default direction when first clicked. Shows ▲/▼ on the
// active column and a faint ↕ otherwise; the active column is ember.
function SortHead({ label, k, sort, flex, align = 'left', type = 'num' }) {
  const active = sort.key === k;
  const caret = active ? (sort.dir === 'asc' ? '▲' : '▼') : '↕';
  return (
    <span
      onClick={() => sort.onSort(k, type)}
      title="Sort"
      style={{
        flex,
        cursor: 'pointer',
        userSelect: 'none',
        color: active ? COLORS.ember : COLORS.faded,
        display: 'flex',
        alignItems: 'center',
        gap: 4,
        justifyContent: align === 'right' ? 'flex-end' : 'flex-start',
      }}
    >
      {align === 'right' ? (
        <>
          {label}
          <span style={{ fontSize: 8, opacity: active ? 1 : 0.45 }}>{caret}</span>
        </>
      ) : (
        <>
          <span style={{ fontSize: 8, opacity: active ? 1 : 0.45 }}>{caret}</span>
          {label}
        </>
      )}
    </span>
  );
}

// A cell that shows a player's distinct values for a metadata field: the first
// (newest) value plus an ember "+N" badge when there are more, with the full
// set in a hover title. Empty -> a faded dash.
function MultiCell({ values, flex, align = 'left' }) {
  const arr = (values || []).filter(Boolean);
  const extra = arr.length - 1;
  return (
    <span
      title={arr.join(', ')}
      style={{
        flex,
        textAlign: align,
        minWidth: 0,
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        whiteSpace: 'nowrap',
        fontFamily: 'DM Mono, monospace',
        fontSize: 10,
        color: arr.length ? COLORS.ink : COLORS.faded,
      }}
    >
      {arr.length ? arr[0] : '—'}
      {extra > 0 ? <span style={{ color: COLORS.ember, fontWeight: 700 }}> +{extra}</span> : null}
    </span>
  );
}

// Build a Google Maps "search" URL that resolves to a single place pin.
// Mirrors lib/helpers.js: strip the characters Maps reads as waypoint
// separators so a name like "Lucali (Carroll Gardens)" opens a location,
// not driving directions.
function mapsPlaceUrl(name) {
  const cleaned = String(name || '')
    .replace(/[()]/g, ' ')
    .replace(/[;,]/g, ' ')
    .replace(/&/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(cleaned)}`;
}

export default function AdminClient({ initialLists, initialExtras = [], initialComplaints = [], initialVoteStandings = [], initialVoteEvents = [], initialComments = [], initialAlerts = [], initialViews24h = [], initialEditorNotes = [], initialQuizSignups = [], initialQuizStats = [], initialAnonPlayers = [], initialActiveUsers = { players: { dau: 0, wau: 0, mau: 0 }, visitors: null }, initialGeoMap = null, initialDailyRetention = { games: [], breadth: { total: 0, histogram: [] } }, initialTimeByDay = { series: [], totals: {} }, initialNewUsers = { series: [], totals: {} }, initialDailyByGame = { games: [], totals: {} }, initialTopPlayersToday = { day: null, players: [], totals: {} } }) {
  const router = useRouter();
  const [lists, setLists] = useState(initialLists);
  const [extras, setExtras] = useState(initialExtras);
  const [alerts, setAlerts] = useState(initialAlerts);
  const [complaints, setComplaints] = useState(initialComplaints);
  const [voteStandings, setVoteStandings] = useState(initialVoteStandings);
  const [voteEvents, setVoteEvents] = useState(initialVoteEvents);
  const [comments, setComments] = useState(initialComments);
  const [editorNotes, setEditorNotes] = useState(initialEditorNotes);
  const [views24h] = useState(initialViews24h);
  const [quizSignups] = useState(initialQuizSignups);
  const [anonPlayers] = useState(initialAnonPlayers);
  const [quizStats] = useState(initialQuizStats);
  const [tab, setTab] = useState('analytics');
  const [busy, setBusy] = useState({});

  const filtered = useMemo(() => {
    return lists.filter((l) => (tab === 'pending' ? !l.published : l.published));
  }, [lists, tab]);

  const pendingCount = useMemo(() => lists.filter((l) => !l.published).length, [lists]);
  const publishedCount = useMemo(() => lists.filter((l) => l.published).length, [lists]);
  const extrasCount = useMemo(
    () => extras.reduce((n, g) => n + g.items.length, 0),
    [extras]
  );
  const complaintsCount = complaints.length;
  const commentsCount = comments.length;
  const editorNotesCount = editorNotes.length;
  const views24hTotal = useMemo(
    () => views24h.reduce((n, v) => n + (v.views24h || 0), 0),
    [views24h]
  );
  const quizPlaysTotal = useMemo(
    () => quizStats.reduce((n, q) => n + (q.plays || 0), 0),
    [quizStats]
  );
  const dailyPlaysTotal = (initialDailyByGame && initialDailyByGame.totals && initialDailyByGame.totals.totalPlays) || 0;

  async function deleteComment(id) {
    const key = `cm-${id}`;
    if (busy[key]) return;
    setBusy((b) => ({ ...b, [key]: true }));
    const res = await fetch('/api/admin/comments/delete', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    });
    if (res.ok) setComments((prev) => prev.filter((c) => c.id !== id));
    else alert('Could not delete. Try again.');
    setBusy((b) => ({ ...b, [key]: false }));
  }

  async function deleteVote(listId, itemName) {
    const key = `v-${listId}::${itemName}`;
    if (busy[key]) return;
    if (!confirm(`Delete all votes for "${itemName}" on ${listId}?`)) return;
    setBusy((b) => ({ ...b, [key]: true }));
    const res = await fetch('/api/admin/votes/delete', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ listId, itemName }),
    });
    if (res.ok) {
      setVoteStandings((prev) => prev.filter((s) => !(s.listId === listId && s.itemName === itemName)));
      setVoteEvents((prev) => prev.filter((e) => !(e.listId === listId && e.itemName === itemName)));
    } else alert('Could not delete votes. Try again.');
    setBusy((b) => ({ ...b, [key]: false }));
  }

  async function respond(kind, id, current) {
    const text = window.prompt('Editor response (shown publicly as "Editor: ..."). Leave blank to clear:', current || '');
    if (text === null) return;
    const key = 'r-' + kind + '-' + id;
    if (busy[key]) return;
    setBusy((b) => ({ ...b, [key]: true }));
    const res = await fetch('/api/admin/respond', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ kind, id, response: text }),
    });
    if (res.ok) {
      const val = text.trim() || null;
      if (kind === 'comment') setComments((prev) => prev.map((c) => (c.id === id ? { ...c, editorResponse: val } : c)));
      else setComplaints((prev) => prev.map((c) => (c.id === id ? { ...c, editorResponse: val } : c)));
    } else {
      alert('Could not save response. Try again.');
    }
    setBusy((b) => ({ ...b, [key]: false }));
  }

  async function addNote(listId, note) {
    const lid = (listId || '').trim();
    const text = (note || '').trim();
    if (!lid || !text) { alert('Pick a list and write a note.'); return; }
    if (busy['note-add']) return;
    setBusy((b) => ({ ...b, ['note-add']: true }));
    const res = await fetch('/api/admin/notes', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ listId: lid, note: text }) });
    const data = await res.json().catch(() => ({}));
    if (res.ok && data.note) {
      setEditorNotes((prev) => [{ id: data.note.id, listId: data.note.list_id, note: data.note.note, createdAt: data.note.created_at }, ...prev]);
    } else {
      alert('Could not post note. Try again.');
    }
    setBusy((b) => ({ ...b, ['note-add']: false }));
  }

  async function deleteNote(id) {
    const key = 'note-' + id;
    if (busy[key]) return;
    setBusy((b) => ({ ...b, [key]: true }));
    const res = await fetch('/api/admin/notes', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id, remove: true }) });
    if (res.ok) setEditorNotes((prev) => prev.filter((n) => n.id !== id));
    else alert('Could not delete note.');
    setBusy((b) => ({ ...b, [key]: false }));
  }

  async function dismissComplaint(id) {
    const key = `c-${id}`;
    if (busy[key]) return;
    setBusy((b) => ({ ...b, [key]: true }));
    const res = await fetch('/api/admin/complaints', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    });
    if (res.ok) {
      setComplaints((prev) => prev.filter((c) => c.id !== id));
    } else {
      alert('Could not dismiss. Try again.');
    }
    setBusy((b) => ({ ...b, [key]: false }));
  }

  async function doAction(id, endpoint, optimistic) {
    if (busy[id]) return;
    setBusy((b) => ({ ...b, [id]: true }));
    const res = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    });
    if (res.ok) {
      setLists((prev) => optimistic(prev));
    } else {
      alert('That action failed. Please try again.');
    }
    setBusy((b) => ({ ...b, [id]: false }));
  }

  function approve(id) {
    doAction(id, '/api/admin/approve', (prev) =>
      prev.map((l) => (l.id === id ? { ...l, published: true } : l))
    );
  }
  function unpublish(id) {
    doAction(id, '/api/admin/unpublish', (prev) =>
      prev.map((l) => (l.id === id ? { ...l, published: false } : l))
    );
  }
  function reject(id) {
    if (!confirm('Delete this submission? This cannot be undone.')) return;
    doAction(id, '/api/admin/reject', (prev) => prev.filter((l) => l.id !== id));
  }

  // ----- Extras (user-submitted items inside curated lists) -----

  async function renameExtra(listId, oldName, newName) {
    const key = `extra:${listId}:${oldName}`;
    if (busy[key]) return false;
    const trimmed = (newName || '').trim();
    if (!trimmed) return false;
    if (trimmed === oldName) return true;

    setBusy((b) => ({ ...b, [key]: true }));
    const res = await fetch('/api/admin/extras/rename', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ listId, oldName, newName: trimmed }),
    });
    setBusy((b) => ({ ...b, [key]: false }));

    if (!res.ok) {
      alert('Rename failed. Please try again.');
      return false;
    }

    // Update local state — merge if the new name already exists in the same list.
    setExtras((prev) =>
      prev
        .map((group) => {
          if (group.listId !== listId) return group;
          const oldItem = group.items.find((i) => i.name === oldName);
          const existing = group.items.find((i) => i.name === trimmed);
          let items;
          if (existing) {
            items = group.items
              .filter((i) => i.name !== oldName)
              .map((i) =>
                i.name === trimmed
                  ? { ...i, score: (i.score || 0) + (oldItem?.score || 0) }
                  : i
              );
          } else {
            items = group.items.map((i) =>
              i.name === oldName ? { ...i, name: trimmed } : i
            );
          }
          return { ...group, items };
        })
        .filter((g) => g.items.length > 0)
    );
    return true;
  }

  async function deleteExtra(listId, itemName) {
    if (!confirm(`Delete user-submitted item "${itemName}" from ${listId}? This also clears its votes.`)) {
      return;
    }
    const key = `extra:${listId}:${itemName}`;
    if (busy[key]) return;
    setBusy((b) => ({ ...b, [key]: true }));
    const res = await fetch('/api/admin/extras/delete', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ listId, itemName }),
    });
    setBusy((b) => ({ ...b, [key]: false }));

    if (!res.ok) {
      alert('Delete failed. Please try again.');
      return;
    }

    setExtras((prev) =>
      prev
        .map((group) =>
          group.listId === listId
            ? { ...group, items: group.items.filter((i) => i.name !== itemName) }
            : group
        )
        .filter((g) => g.items.length > 0)
    );
  }

  async function resolveAlert(id) {
    const key = `alert-${id}`;
    if (busy[key]) return;
    setBusy((b) => ({ ...b, [key]: true }));
    const res = await fetch('/api/admin/alerts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    });
    if (res.ok) {
      setAlerts((prev) => prev.filter((a) => a.id !== id));
    } else {
      alert('Could not resolve. Try again.');
    }
    setBusy((b) => ({ ...b, [key]: false }));
  }

  async function logout() {
    await fetch('/api/admin/logout', { method: 'POST' });
    router.push('/admin/login');
    router.refresh();
  }

  return (
    <div
      className="adt"
      style={{
        minHeight: '100vh',
        background: COLORS.cream,
        color: COLORS.ink,
        position: 'relative',
        overflow: 'hidden',
        fontFamily: 'Manrope, system-ui, -apple-system, sans-serif',
      }}
    >
      <style dangerouslySetInnerHTML={{ __html: `
        .adt [style*="border:"]{border-radius:10px;}
        .adt ::placeholder{color:${COLORS.faded};}
      ` }} />
      <Grain />
      <div
        style={{
          position: 'relative',
          zIndex: 2,
          maxWidth: 1180,
          margin: '0 auto',
          padding: '32px 20px 80px',
        }}
      >
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            gap: 16,
            flexWrap: 'wrap',
            marginBottom: 24,
          }}
        >
          <div>
            <div
              style={{
                fontFamily: 'DM Mono, monospace',
                fontSize: 11,
                letterSpacing: '0.25em',
                textTransform: 'uppercase',
                color: COLORS.ember,
                marginBottom: 8,
              }}
            >
              Editorial
            </div>
            <h1
              style={{
                fontFamily: 'Manrope, system-ui, -apple-system, sans-serif',
                fontWeight: 900,
                fontSize: 'clamp(36px, 8vw, 64px)',
                lineHeight: 0.92,
                letterSpacing: '-0.03em',
                margin: 0,
                color: COLORS.ink,
                fontVariationSettings: '"SOFT" 100',
              }}
            >
              Editor's
              <span style={{ fontStyle: 'italic', color: COLORS.ember }}> desk</span>
            </h1>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          {/* Referral-contest fraud review: who brought in people who look like one person. */}
          <Link
            href="/admin/contest"
            style={{
              background: 'transparent',
              color: COLORS.ink,
              border: `1px solid ${COLORS.line}`,
              padding: '8px 14px',
              fontFamily: 'DM Mono, monospace',
              fontSize: 10,
              letterSpacing: '0.18em',
              textTransform: 'uppercase',
              fontWeight: 600,
              textDecoration: 'none',
              display: 'flex',
              alignItems: 'center',
              gap: 6,
            }}
          >
            <ShieldAlert size={12} strokeWidth={2.5} />
            Contest
          </Link>
          {/* Offline / print campaign attribution (?c= codes: QR flyers, stickers). */}
          <Link
            href="/admin/campaigns"
            style={{
              background: 'transparent',
              color: COLORS.ink,
              border: `1px solid ${COLORS.line}`,
              padding: '8px 14px',
              fontFamily: 'DM Mono, monospace',
              fontSize: 10,
              letterSpacing: '0.18em',
              textTransform: 'uppercase',
              fontWeight: 600,
              textDecoration: 'none',
              display: 'flex',
              alignItems: 'center',
              gap: 6,
            }}
          >
            <MapPin size={12} strokeWidth={2.5} />
            Campaigns
          </Link>
          <button
            onClick={logout}
            style={{
              background: 'transparent',
              color: COLORS.ink,
              border: `1px solid ${COLORS.line}`,
              padding: '8px 14px',
              fontFamily: 'DM Mono, monospace',
              fontSize: 10,
              letterSpacing: '0.18em',
              textTransform: 'uppercase',
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 6,
            }}
          >
            <LogOut size={12} strokeWidth={2.5} />
            Sign out
          </button>
          </div>
        </div>

        {/* Tabs */}
        <div
          style={{
            display: 'flex',
            gap: 0,
            marginBottom: 28,
            border: `1px solid ${COLORS.line}`,
          }}
        >
          <TabButton active={tab === 'pending'} onClick={() => setTab('pending')}>
            Pending <span style={{ opacity: 0.6 }}>{pendingCount}</span>
          </TabButton>
          <TabButton active={tab === 'published'} onClick={() => setTab('published')}>
            Published <span style={{ opacity: 0.6 }}>{publishedCount}</span>
          </TabButton>
          <TabButton active={tab === 'extras'} onClick={() => setTab('extras')}>
            By the people <span style={{ opacity: 0.6 }}>{extrasCount}</span>
          </TabButton>
          <TabButton active={tab === 'feedback'} onClick={() => setTab('feedback')}>
            Feedback <span style={{ opacity: 0.6 }}>{complaintsCount + commentsCount}</span>
          </TabButton>
          <TabButton active={tab === 'research'} onClick={() => setTab('research')}>
            Research <span style={{ opacity: 0.6 }}>{alerts.length + editorNotesCount}</span>
          </TabButton>
          <TabButton active={tab === 'analytics'} onClick={() => setTab('analytics')}>
            Analytics <span style={{ opacity: 0.6 }}>{views24hTotal}</span>
          </TabButton>
          <TabButton active={tab === 'daily'} onClick={() => setTab('daily')}>
            Daily Games <span style={{ opacity: 0.6 }}>{dailyPlaysTotal}</span>
          </TabButton>
          <TabButton active={tab === 'groups'} onClick={() => setTab('groups')}>
            Groups
          </TabButton>
        </div>

        {tab === 'analytics' ? (
          <AnalyticsPanel views={views24h} viewsTotal={views24hTotal} quizStats={quizStats} quizPlaysTotal={quizPlaysTotal} signups={quizSignups} anonPlayers={anonPlayers} activeUsers={initialActiveUsers} geoMap={initialGeoMap} dailyRetention={initialDailyRetention} timeByDay={initialTimeByDay} newUsers={initialNewUsers} dailyByGame={initialDailyByGame} topPlayersToday={initialTopPlayersToday} />
        ) : tab === 'daily' ? (
          <DailyGamesPanel data={initialDailyByGame} />
        ) : tab === 'groups' ? (
          <GroupsPanel />
        ) : tab === 'research' ? (
          <ResearchNotesPanel alerts={alerts} busy={busy} onResolve={resolveAlert} notes={editorNotes} lists={LISTS} onAddNote={addNote} onDeleteNote={deleteNote} />
        ) : tab === 'feedback' ? (
          <FeedbackPanel complaints={complaints} comments={comments} busy={busy} onDismiss={dismissComplaint} onDelete={deleteComment} onRespond={respond} />
        ) : tab === 'extras' ? (
          <ExtrasPanel
            extras={extras}
            busy={busy}
            onRename={renameExtra}
            onDelete={deleteExtra}
          />
        ) : filtered.length === 0 ? (
          <div
            style={{
              padding: '60px 20px',
              textAlign: 'center',
              fontFamily: 'Manrope, system-ui, -apple-system, sans-serif',
              fontStyle: 'italic',
              fontSize: 18,
              color: COLORS.faded,
              border: `1px dashed ${COLORS.line}`,
            }}
          >
            {tab === 'pending'
              ? 'No submissions waiting for review.'
              : 'No published reader submissions yet.'}
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {filtered.map((list) => (
              <SubmissionCard
                key={list.id}
                list={list}
                busy={!!busy[list.id]}
                onApprove={() => approve(list.id)}
                onUnpublish={() => unpublish(list.id)}
                onReject={() => reject(list.id)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// Views panel: per-list visitor counts over the rolling past 24 hours.
// Cap long admin tables to roughly 25 visible rows, then scroll vertically.
const TABLE_MAX_H = 940;

// Page views: unified visitor counts for list pages and quiz pages over the
// rolling past 24 hours and all-time. `mode` switches the table between the
// combined feed ('all'), lists only, or quizzes only. Quiz rows also carry
// completed-game plays (all-time and last 24h), folded in from the former
// standalone Quiz Stats tab; lists have no play data, so those columns read an
// em-dash in the combined view.
function PageViewsPanel({ lists, quizzes, mode }) {
  const [query, setQuery] = useState('');
  const sort = useSort('views24h', 'desc');
  const [expanded, setExpanded] = useState(null); // listId of open source-breakdown row
  const [details, setDetails] = useState({});      // listId -> { loading | error | data }

  // Lazily load one list's 24h source breakdown on first expand.
  const toggle = async (listId) => {
    if (expanded === listId) { setExpanded(null); return; }
    setExpanded(listId);
    if (details[listId] && !details[listId].error) return;
    setDetails((d) => ({ ...d, [listId]: { loading: true } }));
    try {
      const res = await fetch(`/api/admin/list-sources?listId=${encodeURIComponent(listId)}&hours=24`);
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`);
      setDetails((d) => ({ ...d, [listId]: { data } }));
    } catch (e) {
      setDetails((d) => ({ ...d, [listId]: { error: String(e.message || e) } }));
    }
  };

  const rows = useMemo(() => {
    const L = (lists || []).map((v) => ({
      kind: 'list',
      id: v.listId,
      title: v.title || '',
      href: `/list/${encodeURIComponent(v.listId)}`,
      views24h: v.views24h || 0,
      viewsTotal: v.viewsTotal || 0,
      plays: null,
      plays24h: null,
    }));
    const Q = (quizzes || []).map((q) => ({
      kind: 'quiz',
      id: q.quizId,
      title: q.title || '',
      href: q.href || `/quiz/${encodeURIComponent(q.quizId)}`,
      views24h: q.views24h || 0,
      viewsTotal: q.viewsTotal || 0,
      plays: q.plays || 0,
      plays24h: q.plays24h || 0,
    }));
    if (mode === 'lists') return L;
    if (mode === 'quizzes') return Q;
    return [...L, ...Q];
  }, [lists, quizzes, mode]);

  const accessors = {
    title: (r) => r.title || '',
    type: (r) => r.kind,
    views24h: (r) => r.views24h || 0,
    viewsTotal: (r) => r.viewsTotal || 0,
    plays: (r) => (r.plays == null ? -1 : r.plays),
    plays24h: (r) => (r.plays24h == null ? -1 : r.plays24h),
  };

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    const filtered = !q
      ? rows
      : rows.filter(
          (r) => r.title.toLowerCase().includes(q) || r.id.toLowerCase().includes(q)
        );
    return applySort(filtered, sort.key, sort.dir, accessors);
  }, [rows, query, sort.key, sort.dir]);

  if (!rows || rows.length === 0) {
    return (
      <div
        style={{
          padding: '60px 20px',
          textAlign: 'center',
          fontFamily: 'Manrope, system-ui, -apple-system, sans-serif',
          fontStyle: 'italic',
          fontSize: 18,
          color: COLORS.faded,
          border: `1px dashed ${COLORS.line}`,
        }}
      >
        No view data yet.
      </div>
    );
  }

  const rowBorder = `1px solid ${COLORS.ink}22`;
  const total24h = rows.reduce((n, r) => n + (r.views24h || 0), 0);
  const activeCount = rows.filter((r) => r.views24h > 0).length;
  const plays24Total = rows.reduce((n, r) => n + (r.plays24h || 0), 0);
  const noun = mode === 'lists' ? 'list' : mode === 'quizzes' ? 'quiz' : 'page';
  const showType = mode === 'all';
  const showPlays = mode !== 'lists';
  const titleLabel = mode === 'lists' ? 'List' : mode === 'quizzes' ? 'Quiz' : 'Page';
  const blurb =
    mode === 'quizzes'
      ? `Per-quiz visitors over the rolling past 24 hours and all-time, plus completed-game plays. Busiest first. ${total24h} view${total24h === 1 ? '' : 's'} and ${plays24Total} play${plays24Total === 1 ? '' : 's'} in the last day.`
      : mode === 'lists'
      ? `Visitor counts per list page over the rolling past 24 hours, busiest first. ${total24h} view${total24h === 1 ? '' : 's'} across ${activeCount} list${activeCount === 1 ? '' : 's'}. All-time totals shown for context.`
      : `Page views across lists and quizzes over the rolling past 24 hours, busiest first. ${total24h} view${total24h === 1 ? '' : 's'} across ${activeCount} active page${activeCount === 1 ? '' : 's'} in the last day.`;

  return (
    <div>
      <p style={{ fontFamily: 'Manrope, system-ui, -apple-system, sans-serif', fontSize: 10, color: COLORS.faded, margin: '0 0 14px' }}>
        {blurb}{mode !== 'quizzes' ? ' Click a list row for its bot/human split and traffic sources.' : ''}
      </p>
      <input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder={`Filter by ${noun} title or id...`}
        style={{
          width: '100%',
          padding: '10px 12px',
          background: COLORS.paper,
          border: `1px solid ${COLORS.line}`,
          color: COLORS.ink,
          fontFamily: 'DM Mono, monospace',
          fontSize: 10,
          outline: 'none',
          marginBottom: 16,
          boxSizing: 'border-box',
        }}
      />
      {visible.length === 0 ? (
        <div
          style={{
            padding: '40px 20px',
            textAlign: 'center',
            fontFamily: 'Manrope, system-ui, -apple-system, sans-serif',
            fontStyle: 'italic',
            fontSize: 16,
            color: COLORS.faded,
            border: `1px dashed ${COLORS.line}`,
          }}
        >
          No matches.
        </div>
      ) : (
        <div style={{ border: `1px solid ${COLORS.line}`, background: COLORS.paper, borderRadius: 12 }}>
          <div style={{ display: 'flex', gap: 16, position: 'sticky', top: 0, zIndex: 1, background: COLORS.cream, fontFamily: 'DM Mono, monospace', fontSize: 10, letterSpacing: '0.14em', textTransform: 'uppercase', color: COLORS.faded, padding: '5px 14px', borderBottom: `1px solid ${COLORS.line}` }}>
            <span style={{ flex: '0 0 36px' }}>#</span>
            {showType && <SortHead label="Type" k="type" sort={sort} flex="0 0 56px" type="string" />}
            <SortHead label={titleLabel} k="title" sort={sort} flex={3} type="string" />
            <SortHead label="Views 24h" k="views24h" sort={sort} flex="0 0 88px" align="right" />
            <SortHead label="Views all" k="viewsTotal" sort={sort} flex="0 0 88px" align="right" />
            {showPlays && <SortHead label="Plays 24h" k="plays24h" sort={sort} flex="0 0 84px" align="right" />}
            {showPlays && <SortHead label="Plays all" k="plays" sort={sort} flex="0 0 84px" align="right" />}
          </div>
          {visible.map((r, i) => {
            const active = r.views24h > 0 || (r.plays24h || 0) > 0;
            const isList = r.kind === 'list';
            const isOpen = isList && expanded === r.id;
            return (
              <React.Fragment key={`${r.kind}:${r.id}`}>
                <div
                  onClick={isList ? () => toggle(r.id) : undefined}
                  role={isList ? 'button' : undefined}
                  aria-expanded={isList ? isOpen : undefined}
                  style={{ display: 'flex', gap: 16, alignItems: 'center', cursor: isList ? 'pointer' : 'default', fontFamily: 'Manrope, system-ui, -apple-system, sans-serif', fontSize: 10, color: COLORS.ink, padding: '3px 14px', borderBottom: (isOpen || i < visible.length - 1) ? rowBorder : 'none', background: isOpen ? `${COLORS.ink}0a` : 'transparent', opacity: active ? 1 : 0.55 }}
                >
                  <span style={{ flex: '0 0 36px', display: 'flex', alignItems: 'center', gap: 4, fontFamily: 'DM Mono, monospace', fontSize: 10, color: COLORS.faded }}>
                    {isList && (
                      <span style={{ display: 'inline-block', width: 7, transform: isOpen ? 'rotate(90deg)' : 'none', transition: 'transform 0.12s' }}>▸</span>
                    )}
                    {i + 1}
                  </span>
                  {showType && (
                    <span style={{ flex: '0 0 56px', fontFamily: 'DM Mono, monospace', fontSize: 10, letterSpacing: '0.08em', textTransform: 'uppercase', color: r.kind === 'quiz' ? COLORS.ember : COLORS.faded }}>
                      {r.kind === 'quiz' ? 'Quiz' : 'List'}
                    </span>
                  )}
                  <span style={{ flex: 3, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    <Link href={r.href} target="_blank" onClick={(e) => e.stopPropagation()} style={{ color: COLORS.ink, textDecoration: 'none' }}>
                      {r.title || r.id}
                    </Link>
                  </span>
                  <span style={{ flex: '0 0 88px', textAlign: 'right', fontFamily: 'DM Mono, monospace', fontWeight: 700, color: r.views24h > 0 ? COLORS.ember : COLORS.faded }}>
                    {r.views24h}
                  </span>
                  <span style={{ flex: '0 0 88px', textAlign: 'right', fontFamily: 'DM Mono, monospace', fontSize: 10, color: COLORS.faded }}>
                    {r.viewsTotal}
                  </span>
                  {showPlays && (
                    <span style={{ flex: '0 0 84px', textAlign: 'right', fontFamily: 'DM Mono, monospace', fontWeight: 700, color: (r.plays24h || 0) > 0 ? COLORS.ink : COLORS.faded }}>
                      {r.plays24h == null ? '—' : r.plays24h}
                    </span>
                  )}
                  {showPlays && (
                    <span style={{ flex: '0 0 84px', textAlign: 'right', fontFamily: 'DM Mono, monospace', fontSize: 10, color: COLORS.faded }}>
                      {r.plays == null ? '—' : r.plays}
                    </span>
                  )}
                </div>
                {isOpen && <SourceBreakdown state={details[r.id]} />}
              </React.Fragment>
            );
          })}
        </div>
      )}
    </div>
  );
}

// Colors for the five traffic channels in the expanded source breakdown.
const CHANNEL_COLORS = {
  organic: COLORS.forest,
  social: COLORS.rust,
  referral: COLORS.faded,
  direct: COLORS.ink,
  internal: '#8a7d63',
  unknown: COLORS.faded,
};

// Expanded detail row under a list in PageViewsPanel: bot/human split, channel
// mix, top referrer hosts, and top countries for the last 24h. `state` is the
// per-list fetch slot: { loading } | { error } | { data }.
function SourceBreakdown({ state }) {
  const wrap = { padding: '10px 14px 14px 44px', background: `${COLORS.ink}0a`, borderBottom: `1px solid ${COLORS.ink}22`, fontFamily: 'Manrope, system-ui, -apple-system, sans-serif', fontSize: 10, color: COLORS.ink };
  const mono = { fontFamily: 'DM Mono, monospace' };
  if (!state || state.loading) return <div style={{ ...wrap, ...mono, color: COLORS.faded }}>Loading sources...</div>;
  if (state.error) return <div style={{ ...wrap, ...mono, color: COLORS.ember }}>Could not load sources: {state.error}</div>;
  const d = state.data;
  if (!d || d.total === 0) return <div style={{ ...wrap, ...mono, color: COLORS.faded }}>No views in the last 24h.</div>;
  const label = { ...mono, fontSize: 9, letterSpacing: '0.12em', textTransform: 'uppercase', color: COLORS.faded, marginBottom: 5 };
  const kv = { ...mono, fontSize: 10, display: 'flex', justifyContent: 'space-between', gap: 12 };
  const channels = (d.channels || []).filter((c) => c.count > 0);
  return (
    <div style={wrap}>
      {d.attribution === false && (
        <div style={{ ...mono, color: COLORS.rust, marginBottom: 8 }}>
          Attribution columns not applied yet (run migration 31) — showing countries only.
        </div>
      )}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 26, rowGap: 12 }}>
        {d.humans != null && (
          <div>
            <div style={label}>Humans vs bots</div>
            <div style={{ ...mono, fontSize: 12 }}>
              <span style={{ color: COLORS.forest, fontWeight: 700 }}>{d.humans}</span> human
              {' · '}
              <span style={{ color: COLORS.ember, fontWeight: 700 }}>{d.bots}</span> bot
              {' '}<span style={{ color: COLORS.faded }}>({d.botPct}%)</span>
            </div>
          </div>
        )}
        {channels.length > 0 && (
          <div>
            <div style={label}>Channels (human)</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
              {channels.map((c) => (
                <span key={c.channel} style={{ ...mono, fontSize: 10, color: COLORS.cream, background: CHANNEL_COLORS[c.channel] || COLORS.faded, padding: '2px 6px', borderRadius: 3 }}>
                  {c.channel} {c.count}
                </span>
              ))}
            </div>
          </div>
        )}
        <div style={{ minWidth: 170 }}>
          <div style={label}>Top referrers (human)</div>
          {(!d.topReferrers || d.topReferrers.length === 0) ? (
            <div style={{ ...mono, color: COLORS.faded }}>None (direct / untagged)</div>
          ) : d.topReferrers.map((r) => (
            <div key={r.host} style={{ ...kv, maxWidth: 280 }}>
              <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.host}</span>
              <span style={{ color: COLORS.faded }}>{r.count}</span>
            </div>
          ))}
        </div>
        <div style={{ minWidth: 120 }}>
          <div style={label}>Top countries</div>
          {(!d.topCountries || d.topCountries.length === 0) ? (
            <div style={{ ...mono, color: COLORS.faded }}>—</div>
          ) : d.topCountries.map((c) => (
            <div key={c.country} style={{ ...kv, maxWidth: 180 }}>
              <span>{c.country}</span>
              <span style={{ color: COLORS.faded }}>{c.count}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// Quiz signups: the email leads captured by the /quiz "join the leaderboard"
// form. One row per email (username + email + date joined), newest first.
function QuizSignupsPanel({ signups }) {
  const [query, setQuery] = useState('');
  const [expandedId, setExpandedId] = useState(null);
  const sort = useSort('recent', 'desc');

  // Last-played and distinct days played come off the summary the server sends,
  // not off a play list. They used to be recomputed here from every play row,
  // which is the only reason those rows had to be in the page at all; stats
  // already carries both (playerStats records lastSeen and activeDays from the
  // same rows, server-side).
  const enriched = useMemo(
    () =>
      (signups || []).map((s) => ({
        ...s,
        playCount: s.playCount || 0,
        lastPlayedAt: (s.stats && s.stats.lastSeen) || '',
        daysPlayed: (s.stats && s.stats.activeDays) || 0,
      })),
    [signups]
  );

  const accessors = {
    name: (s) => s.username || '',
    email: (s) => s.email || '',
    plays: (s) => s.playCount || 0,
    acc: (s) => (s.stats && s.stats.accuracy != null ? s.stats.accuracy : -1),
    device: (s) => (s.devices && s.devices[0]) || '',
    os: (s) => (s.oses && s.oses[0]) || '',
    geo: (s) => (s.geos && s.geos[0]) || '',
    first: (s) => Date.parse((s.stats && s.stats.firstSeen) || '') || 0,
    recent: (s) => Date.parse(s.lastPlayedAt || '') || 0,
    joined: (s) => Date.parse(s.createdAt || '') || 0,
  };

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    const filtered = !q
      ? enriched
      : enriched.filter(
          (s) =>
            (s.username || '').toLowerCase().includes(q) ||
            (s.email || '').toLowerCase().includes(q)
        );
    return applySort(filtered, sort.key, sort.dir, accessors);
  }, [enriched, query, sort.key, sort.dir]);

  if (!signups || signups.length === 0) {
    return (
      <div
        style={{
          padding: '60px 20px',
          textAlign: 'center',
          fontFamily: 'Manrope, system-ui, -apple-system, sans-serif',
          fontStyle: 'italic',
          fontSize: 18,
          color: COLORS.faded,
          border: `1px dashed ${COLORS.line}`,
        }}
      >
        No quiz signups yet.
      </div>
    );
  }

  const rowBorder = `1px solid ${COLORS.ink}22`;
  const copyEmails = () => {
    const text = visible.map((s) => s.email).join('\n');
    if (navigator?.clipboard) navigator.clipboard.writeText(text).catch(() => {});
  };

  return (
    <div>
      <p style={{ fontFamily: 'Manrope, system-ui, -apple-system, sans-serif', fontSize: 10, color: COLORS.faded, margin: '0 0 14px' }}>
        Email signups from the quiz leaderboard join form.
        {' '}{signups.length} signup{signups.length === 1 ? '' : 's'} total.
        {' '}The 10 most recently active are shown; scroll the box for the rest. Click a row for the player's full stats (best score, accuracy, timezone, traffic source, and more) plus their last {DETAIL_ROWS} sessions and games, with the full history one click further. Click a column header to sort.
      </p>
      <div style={{ display: 'flex', gap: 10, marginBottom: 16 }}>
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Filter by username or email…"
          style={{
            flex: 1,
            padding: '10px 12px',
            background: COLORS.paper,
            border: `1px solid ${COLORS.line}`,
            color: COLORS.ink,
            fontFamily: 'DM Mono, monospace',
            fontSize: 10,
            outline: 'none',
            boxSizing: 'border-box',
          }}
        />
        <button
          onClick={copyEmails}
          style={{
            padding: '5px 14px',
            background: COLORS.ink,
            border: `1px solid ${COLORS.line}`,
            color: COLORS.paper,
            fontFamily: 'DM Mono, monospace',
            fontSize: 10,
            letterSpacing: '0.1em',
            textTransform: 'uppercase',
            cursor: 'pointer',
            whiteSpace: 'nowrap',
          }}
        >
          Copy emails
        </button>
      </div>
      {visible.length === 0 ? (
        <div
          style={{
            padding: '40px 20px',
            textAlign: 'center',
            fontFamily: 'Manrope, system-ui, -apple-system, sans-serif',
            fontStyle: 'italic',
            fontSize: 16,
            color: COLORS.faded,
            border: `1px dashed ${COLORS.line}`,
          }}
        >
          No matches.
        </div>
      ) : (
        <div style={{ border: `1px solid ${COLORS.line}`, background: COLORS.paper, borderRadius: 12, maxHeight: expandedId != null ? PLAYERS_VIEW_H_OPEN : PLAYERS_VIEW_H, overflowY: 'auto' }}>
          <div style={{ display: 'flex', gap: 16, position: 'sticky', top: 0, zIndex: 1, background: COLORS.cream, fontFamily: 'DM Mono, monospace', fontSize: 10, letterSpacing: '0.14em', textTransform: 'uppercase', color: COLORS.faded, padding: '5px 14px', borderBottom: `1px solid ${COLORS.line}` }}>
            <span style={{ flex: '0 0 28px' }}>#</span>
            <SortHead label="Username" k="name" sort={sort} flex={2} type="string" />
            <SortHead label="Email" k="email" sort={sort} flex={2} type="string" />
            <SortHead label="Plays" k="plays" sort={sort} flex="0 0 42px" align="right" />
            <SortHead label="Device" k="device" sort={sort} flex="0 0 60px" type="string" />
            <SortHead label="OS" k="os" sort={sort} flex="0 0 56px" type="string" />
            <SortHead label="Geo" k="geo" sort={sort} flex="0 0 110px" type="string" />
            <SortHead label="First" k="first" sort={sort} flex="0 0 58px" align="right" />
            <SortHead label="Last" k="recent" sort={sort} flex="0 0 118px" align="right" />
            <SortHead label="Joined" k="joined" sort={sort} flex="0 0 56px" align="right" />
          </div>
          {visible.map((s, i) => {
            const playCount = s.playCount || 0;
            const daysPlayed = s.daysPlayed || 0;
            const open = expandedId === s.id;
            return (
              <div key={s.id} style={{ borderBottom: i < visible.length - 1 ? rowBorder : 'none' }}>
                <div
                  onClick={() => setExpandedId(open ? null : s.id)}
                  style={{ display: 'flex', gap: 16, alignItems: 'center', fontFamily: 'Manrope, system-ui, -apple-system, sans-serif', fontSize: 10, color: COLORS.ink, padding: '3px 14px', cursor: 'pointer', background: open ? `${COLORS.ink}0a` : 'transparent' }}
                >
                  <span style={{ flex: '0 0 28px', fontFamily: 'DM Mono, monospace', fontSize: 10, color: COLORS.faded, display: 'flex', alignItems: 'center', gap: 4 }}>
                    <span style={{ display: 'inline-block', width: 8, transform: open ? 'rotate(90deg)' : 'none', transition: 'transform 0.12s' }}>▸</span>
                    {i + 1}
                  </span>
                  <span style={{ flex: 2, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontWeight: 600, fontFamily: 'Manrope, system-ui, -apple-system, sans-serif' }}>
                    {s.username}
                  </span>
                  <span style={{ flex: 2, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontFamily: 'DM Mono, monospace', fontSize: 10 }}>
                    <a href={`mailto:${s.email}`} onClick={(e) => e.stopPropagation()} style={{ color: COLORS.ink, textDecoration: 'none' }}>{s.email}</a>
                  </span>
                  <span style={{ flex: '0 0 42px', textAlign: 'right', fontFamily: 'DM Mono, monospace', fontSize: 10, fontWeight: 700, color: playCount > 0 ? COLORS.ember : COLORS.faded }}>
                    {playCount}
                  </span>
                  <MultiCell values={s.devices} flex="0 0 60px" />
                  <MultiCell values={s.oses} flex="0 0 56px" />
                  <MultiCell values={s.geos} flex="0 0 110px" />
                  <span style={{ flex: '0 0 58px', textAlign: 'right', fontFamily: 'DM Mono, monospace', fontSize: 10, color: COLORS.faded }}>
                    {s.stats && s.stats.firstSeen ? fmtShort(s.stats.firstSeen) : '—'}
                  </span>
                  <span style={{ flex: '0 0 118px', textAlign: 'right', fontFamily: 'DM Mono, monospace', fontSize: 10, color: COLORS.faded }}>
                    {s.lastPlayedAt ? fmtShortDateTime(s.lastPlayedAt) : '—'}
                  </span>
                  <span style={{ flex: '0 0 56px', textAlign: 'right', fontFamily: 'DM Mono, monospace', fontSize: 10, color: COLORS.faded }}>
                    {fmtShort(s.createdAt)}
                  </span>
                </div>
                {open && (
                  <PlayerDetail
                    playerKey={`u:${s.id}`}
                    stats={s.stats}
                    emptyNote="Signed up but hasn&apos;t completed a quiz yet."
                  />
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function ResearchPanel({ alerts, busy, onResolve }) {
  if (!alerts || alerts.length === 0) {
    return (
      <div
        style={{
          padding: '60px 20px',
          textAlign: 'center',
          fontFamily: 'Manrope, system-ui, -apple-system, sans-serif',
          fontStyle: 'italic',
          fontSize: 18,
          color: COLORS.faded,
          border: `1px dashed ${COLORS.line}`,
        }}
      >
        No consensus changes awaiting research.
      </div>
    );
  }
  const rowBorder = `1px solid ${COLORS.ink}22`;
  return (
    <div>
      <p style={{ fontFamily: 'Manrope, system-ui, -apple-system, sans-serif', fontSize: 13, color: COLORS.faded, margin: '0 0 14px' }}>
        Items that newly entered a list's consensus top 10 (needs a description) or
        top 3 (needs a hero photo). Resolve once the research has shipped.
      </p>
      <div style={{ border: `1px solid ${COLORS.line}` }}>
        <div style={{ display: 'flex', fontFamily: 'DM Mono, monospace', fontSize: 10, letterSpacing: '0.14em', textTransform: 'uppercase', color: COLORS.faded, padding: '10px 14px', borderBottom: `1px solid ${COLORS.line}` }}>
          <span style={{ flex: 2 }}>List</span>
          <span style={{ flex: 2 }}>Item</span>
          <span style={{ flex: '0 0 110px' }}>Change</span>
          <span style={{ flex: '0 0 130px' }}>Needs</span>
          <span style={{ flex: '0 0 110px', textAlign: 'right' }}>Detected</span>
          <span style={{ flex: '0 0 80px' }} />
        </div>
        {alerts.map((a, i) => {
          const needs = [];
          if (a.changeType === 'entered_top10' && !a.hasDescription) needs.push('Description');
          if (a.changeType === 'entered_top3' && !a.hasHeroImage) needs.push('Hero photo');
          return (
            <div
              key={a.id}
              style={{ display: 'flex', alignItems: 'center', gap: 8, fontFamily: 'Manrope, system-ui, -apple-system, sans-serif', fontSize: 13, color: COLORS.ink, padding: '9px 14px', borderBottom: i < alerts.length - 1 ? rowBorder : 'none' }}
            >
              <span style={{ flex: 2 }}>
                <Link href={`/list/${encodeURIComponent(a.listId)}`} style={{ color: COLORS.ink }}>
                  {a.listTitle}
                </Link>
              </span>
              <span style={{ flex: 2, fontWeight: 600 }}>
                {a.itemName}
                {a.rank ? <span style={{ color: COLORS.faded, fontWeight: 400 }}> · #{a.rank}</span> : null}
              </span>
              <span style={{ flex: '0 0 110px', fontFamily: 'DM Mono, monospace', fontSize: 10, letterSpacing: '0.08em', textTransform: 'uppercase', color: a.changeType === 'entered_top3' ? COLORS.ember : COLORS.faded }}>
                {a.changeType === 'entered_top3' ? 'Into top 3' : 'Into top 10'}
              </span>
              <span style={{ flex: '0 0 130px', fontSize: 12, color: needs.length ? COLORS.ember : COLORS.faded }}>
                {needs.length ? needs.join(' + ') : 'Done, just resolve'}
              </span>
              <span style={{ flex: '0 0 110px', textAlign: 'right', fontSize: 11, color: COLORS.faded }}>
                {formatDate(a.detectedAt)}
              </span>
              <span style={{ flex: '0 0 80px', textAlign: 'right' }}>
                <button
                  onClick={() => onResolve(a.id)}
                  disabled={!!busy[`alert-${a.id}`]}
                  style={{
                    background: 'transparent',
                    color: COLORS.ink,
                    border: `1px solid ${COLORS.line}`,
                    padding: '5px 10px',
                    fontFamily: 'DM Mono, monospace',
                    fontSize: 9,
                    letterSpacing: '0.12em',
                    textTransform: 'uppercase',
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  Resolve
                </button>
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function Metric({ label, value }) {
  return (
    <div style={{ background: COLORS.paper, borderRadius: 8, padding: '12px 18px', minWidth: 120 }}>
      <div style={{ fontFamily: 'DM Mono, monospace', fontSize: 10, letterSpacing: '0.12em', textTransform: 'uppercase', color: COLORS.faded }}>{label}</div>
      <div style={{ fontFamily: 'Manrope, system-ui, -apple-system, sans-serif', fontSize: 26, fontWeight: 700, color: COLORS.ink, lineHeight: 1.1, marginTop: 2 }}>{value}</div>
    </div>
  );
}

function VotesPanel({ standings, events, busy, onDelete }) {
  const hasStandings = standings && standings.length > 0;
  const hasEvents = events && events.length > 0;
  const rowBorder = `1px solid ${COLORS.ink}22`;
  const totalVotes = (standings || []).reduce((n, s) => n + (Number(s.votes) || 0), 0);
  const netPoints = (standings || []).reduce((n, s) => n + (Number(s.score) || 0), 0);
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>
      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
        <Metric label="Total votes" value={totalVotes.toLocaleString()} />
        <Metric label="Net points" value={netPoints >= 0 ? `+${netPoints.toLocaleString()}` : netPoints.toLocaleString()} />
        <Metric label="Items with votes" value={(standings || []).length.toLocaleString()} />
      </div>
      <div>
        <h3 style={{ fontFamily: 'Manrope, system-ui, -apple-system, sans-serif', fontWeight: 700, fontSize: 20, margin: '0 0 12px' }}>Current standings</h3>
        {hasStandings ? (
          <div style={{ border: `1px solid ${COLORS.line}`, background: COLORS.paper, borderRadius: 12, maxHeight: TABLE_MAX_H, overflowY: 'auto' }}>
            <div style={{ display: 'flex', gap: 16, position: 'sticky', top: 0, zIndex: 1, background: COLORS.cream, fontFamily: 'DM Mono, monospace', fontSize: 10, letterSpacing: '0.14em', textTransform: 'uppercase', color: COLORS.faded, padding: '10px 14px', borderBottom: `1px solid ${COLORS.line}` }}>
              <span style={{ flex: 2 }}>List</span>
              <span style={{ flex: 2 }}>Item</span>
              <span style={{ flex: '0 0 60px', textAlign: 'right' }}>Votes</span>
              <span style={{ flex: '0 0 60px', textAlign: 'right' }}>Net</span>
              <span style={{ flex: '0 0 120px', textAlign: 'right' }}>Updated</span>
              <span style={{ flex: '0 0 70px' }} />
            </div>
            {standings.map((s, i) => {
              const bkey = `v-${s.listId}::${s.itemName}`;
              return (
                <div key={`${s.listId}::${s.itemName}::${i}`} style={{ display: 'flex', alignItems: 'center', fontFamily: 'Manrope, system-ui, -apple-system, sans-serif', fontSize: 13, color: COLORS.ink, padding: '9px 14px', borderBottom: i < standings.length - 1 ? rowBorder : 'none' }}>
                  <span style={{ flex: 2, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    <Link href={`/list/${s.listId}`} style={{ color: COLORS.ember, textDecoration: 'none' }}>{s.listId}</Link>
                  </span>
                  <span style={{ flex: 2, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{s.itemName}</span>
                  <span style={{ flex: '0 0 60px', textAlign: 'right', fontFamily: 'DM Mono, monospace', color: COLORS.faded }}>{Number(s.votes) || 0}</span>
                  <span style={{ flex: '0 0 60px', textAlign: 'right', fontWeight: 700, fontFamily: 'DM Mono, monospace', color: s.score >= 0 ? COLORS.forest : COLORS.ember }}>{s.score >= 0 ? `+${s.score}` : s.score}</span>
                  <span style={{ flex: '0 0 120px', textAlign: 'right', fontFamily: 'DM Mono, monospace', fontSize: 11, color: COLORS.faded }}>{s.updatedAt ? formatDate(s.updatedAt) : '—'}</span>
                  <span style={{ flex: '0 0 70px', textAlign: 'right' }}>
                    <button
                      onClick={() => onDelete && onDelete(s.listId, s.itemName)}
                      disabled={busy && busy[bkey]}
                      style={{ cursor: 'pointer', background: 'transparent', color: COLORS.ember, border: `1px solid ${COLORS.ember}`, padding: '4px 10px', fontFamily: 'DM Mono, monospace', fontSize: 10, letterSpacing: '0.1em', textTransform: 'uppercase', opacity: busy && busy[bkey] ? 0.5 : 1 }}
                    >
                      Delete
                    </button>
                  </span>
                </div>
              );
            })}
          </div>
        ) : (
          <p style={{ fontFamily: 'Manrope, system-ui, -apple-system, sans-serif', fontStyle: 'italic', fontSize: 14, color: COLORS.faded }}>No votes recorded yet.</p>
        )}
      </div>
      <div>
        <h3 style={{ fontFamily: 'Manrope, system-ui, -apple-system, sans-serif', fontWeight: 700, fontSize: 20, margin: '0 0 4px' }}>Recent vote log</h3>
        <p style={{ fontFamily: 'Manrope, system-ui, -apple-system, sans-serif', fontSize: 13, color: COLORS.faded, margin: '0 0 12px' }}>
          The {events.length} most recent vote events. A vote for 1st place is +3, 2nd is +2, 3rd is +1.
        </p>
        {hasEvents ? (
          <div style={{ border: `1px solid ${COLORS.line}`, background: COLORS.paper, borderRadius: 12, maxHeight: TABLE_MAX_H, overflowY: 'auto' }}>
            {events.map((e, i) => (
              <div key={e.id} style={{ display: 'flex', alignItems: 'center', gap: 12, fontFamily: 'Manrope, system-ui, -apple-system, sans-serif', fontSize: 13, color: COLORS.ink, padding: '9px 14px', borderBottom: i < events.length - 1 ? rowBorder : 'none' }}>
                <span style={{ flex: '0 0 150px', fontFamily: 'DM Mono, monospace', fontSize: 11, color: COLORS.faded }}>{formatDate(e.createdAt)}</span>
                <span style={{ flex: '0 0 70px', fontWeight: 700, fontFamily: 'DM Mono, monospace', color: e.delta >= 0 ? COLORS.forest : COLORS.ember }}>{e.delta === 3 ? '1st' : e.delta === 2 ? '2nd' : e.delta === 1 ? '3rd' : e.delta > 0 ? `+${e.delta}` : e.delta}</span>
                <span style={{ flex: 2, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{e.itemName}</span>
                <span style={{ flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  <Link href={`/list/${e.listId}`} style={{ color: COLORS.ember, textDecoration: 'none' }}>{e.listId}</Link>
                </span>
              </div>
            ))}
          </div>
        ) : (
          <p style={{ fontFamily: 'Manrope, system-ui, -apple-system, sans-serif', fontStyle: 'italic', fontSize: 14, color: COLORS.faded }}>No vote events logged yet.</p>
        )}
      </div>
    </div>
  );
}

function CommentsPanel({ comments, busy, onDelete, onRespond }) {
  if (!comments || comments.length === 0) {
    return <p style={{ fontFamily: 'Manrope, system-ui, -apple-system, sans-serif', fontStyle: 'italic', fontSize: 14, color: COLORS.faded }}>No public comments yet.</p>;
  }
  const rowBorder = `1px solid ${COLORS.ink}22`;
  return (
    <div style={{ border: `1px solid ${COLORS.line}` }}>
      {comments.map((c, i) => {
        const bkey = `cm-${c.id}`;
        return (
          <div key={c.id} style={{ display: 'flex', gap: 12, alignItems: 'flex-start', padding: '12px 14px', borderBottom: i < comments.length - 1 ? rowBorder : 'none' }}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontFamily: 'DM Mono, monospace', fontSize: 11, color: COLORS.faded }}>
                <Link href={`/list/${c.listId}`} style={{ color: COLORS.ember, textDecoration: 'none' }}>{c.listId}</Link>
                {' · '}{c.name || 'Guest'}{' · '}{formatDate(c.createdAt)}
              </div>
              <div style={{ fontFamily: 'Manrope, system-ui, -apple-system, sans-serif', fontSize: 14, color: COLORS.ink, marginTop: 4, whiteSpace: 'pre-wrap' }}>{c.body}</div>
              {c.editorResponse && (
                <div style={{ marginTop: 6, fontFamily: 'Manrope, system-ui, -apple-system, sans-serif', fontSize: 13, color: COLORS.ink, background: COLORS.cream, borderLeft: '3px solid ' + COLORS.ember, padding: '6px 10px' }}>
                  <strong style={{ fontWeight: 700 }}>Editor:</strong> {c.editorResponse}
                </div>
              )}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6, flexShrink: 0 }}>
              <button
                onClick={() => onRespond && onRespond('comment', c.id, c.editorResponse)}
                style={{ cursor: 'pointer', background: 'transparent', color: COLORS.ink, border: '1px solid ' + COLORS.line, padding: '5px 12px', fontFamily: 'DM Mono, monospace', fontSize: 10, letterSpacing: '0.1em', textTransform: 'uppercase' }}
              >
                {c.editorResponse ? 'Edit reply' : 'Reply'}
              </button>
              <button
                onClick={() => onDelete && onDelete(c.id)}
                disabled={busy && busy[bkey]}
                style={{ cursor: 'pointer', background: 'transparent', color: COLORS.ember, border: '1px solid ' + COLORS.ember, padding: '5px 12px', fontFamily: 'DM Mono, monospace', fontSize: 10, letterSpacing: '0.1em', textTransform: 'uppercase', opacity: busy && busy[bkey] ? 0.5 : 1 }}
              >
                Delete
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function NotesPanel({ notes, lists, busy, onAdd, onDelete }) {
  const [listId, setListId] = useState('');
  const [note, setNote] = useState('');
  const rowBorder = `1px solid ${COLORS.ink}22`;
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <div style={{ border: `1px solid ${COLORS.line}`, padding: 16, background: COLORS.paper }}>
        <h3 style={{ fontFamily: 'Manrope, system-ui, -apple-system, sans-serif', fontWeight: 700, fontSize: 18, margin: '0 0 10px' }}>Post an editor's note</h3>
        <input list="sot-all-lists" value={listId} onChange={(e) => setListId(e.target.value)} placeholder="List id (e.g. fast-food-fries)" style={{ width: '100%', boxSizing: 'border-box', padding: 10, border: `1px solid ${COLORS.line}`, background: T.white, fontFamily: 'DM Mono, monospace', fontSize: 13, marginBottom: 8 }} />
        <datalist id="sot-all-lists">{lists.map((l) => <option key={l.id} value={l.id}>{l.title}</option>)}</datalist>
        <textarea value={note} onChange={(e) => setNote(e.target.value)} rows={3} maxLength={1000} placeholder="Shown publicly as: Editor's Note: ..." style={{ width: '100%', boxSizing: 'border-box', padding: 10, border: `1px solid ${COLORS.line}`, background: T.white, fontFamily: 'Manrope, system-ui, -apple-system, sans-serif', fontSize: 14, resize: 'vertical', marginBottom: 8 }} />
        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <button onClick={() => { onAdd(listId, note); setNote(''); }} disabled={!!busy['note-add']} style={{ cursor: 'pointer', background: COLORS.ember, color: COLORS.cream, border: `1.5px solid ${COLORS.ember}`, padding: '9px 16px', fontFamily: 'DM Mono, monospace', fontSize: 11, letterSpacing: '0.14em', textTransform: 'uppercase', fontWeight: 700 }}>Post note</button>
        </div>
      </div>
      {(!notes || notes.length === 0) ? (
        <p style={{ fontFamily: 'Manrope, system-ui, -apple-system, sans-serif', fontStyle: 'italic', fontSize: 14, color: COLORS.faded }}>No editor notes yet.</p>
      ) : (
        <div style={{ border: `1px solid ${COLORS.line}` }}>
          {notes.map((n, i) => (
            <div key={n.id} style={{ display: 'flex', gap: 12, alignItems: 'flex-start', padding: '12px 14px', borderBottom: i < notes.length - 1 ? rowBorder : 'none' }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontFamily: 'DM Mono, monospace', fontSize: 11, color: COLORS.faded }}>
                  <Link href={`/list/${n.listId}`} style={{ color: COLORS.ember, textDecoration: 'none' }}>{n.listId}</Link>{' · '}{formatDate(n.createdAt)}
                </div>
                <div style={{ fontFamily: 'Manrope, system-ui, -apple-system, sans-serif', fontSize: 14, color: COLORS.ink, marginTop: 4, whiteSpace: 'pre-wrap' }}>{n.note}</div>
              </div>
              <button onClick={() => onDelete(n.id)} disabled={!!busy['note-' + n.id]} style={{ flexShrink: 0, cursor: 'pointer', background: 'transparent', color: COLORS.ember, border: `1px solid ${COLORS.ember}`, padding: '5px 12px', fontFamily: 'DM Mono, monospace', fontSize: 10, letterSpacing: '0.1em', textTransform: 'uppercase' }}>Delete</button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function ComplaintsPanel({ complaints, busy, onDismiss, onRespond }) {
  if (!complaints || complaints.length === 0) {
    return (
      <div
        style={{
          padding: '60px 20px',
          textAlign: 'center',
          fontFamily: 'Manrope, system-ui, -apple-system, sans-serif',
          fontStyle: 'italic',
          fontSize: 18,
          color: COLORS.faded,
          border: `1px dashed ${COLORS.line}`,
        }}
      >
        No reader notices right now.
      </div>
    );
  }
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      {complaints.map((c) => (
        <div key={c.id} style={{ border: `1px solid ${COLORS.line}`, padding: 18, background: COLORS.paper }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
            <div style={{ minWidth: 0 }}>
              <div style={{ fontFamily: 'DM Mono, monospace', fontSize: 10, letterSpacing: '0.15em', textTransform: 'uppercase', color: COLORS.faded, marginBottom: 4 }}>
                {formatDate(c.createdAt)}
              </div>
              <Link href={`${(c.listTitle || '').startsWith('[Quiz]') ? '/quiz/' : '/list/'}${c.listId}`} style={{ fontFamily: 'Manrope, system-ui, -apple-system, sans-serif', fontWeight: 700, fontSize: 18, color: COLORS.ink, textDecoration: 'none' }}>
                {c.listTitle || c.listId}
              </Link>
              {c.message ? (
                <p style={{ fontFamily: 'Manrope, system-ui, -apple-system, sans-serif', fontSize: 14, color: COLORS.ink, margin: '8px 0 0', whiteSpace: 'pre-wrap' }}>{c.message}</p>
              ) : (
                <p style={{ fontFamily: 'Manrope, system-ui, -apple-system, sans-serif', fontStyle: 'italic', fontSize: 14, color: COLORS.faded, margin: '8px 0 0' }}>
                  Requested new research (no message left).
                </p>
              )}
              {c.editorResponse && (
                <p style={{ fontFamily: 'Manrope, system-ui, -apple-system, sans-serif', fontSize: 14, color: COLORS.ink, margin: '10px 0 0', background: COLORS.cream, borderLeft: '3px solid ' + COLORS.ember, padding: '8px 12px', whiteSpace: 'pre-wrap' }}>
                  <strong style={{ fontWeight: 700 }}>Editor:</strong> {c.editorResponse}
                </p>
              )}
              {(c.name || c.email) && (
                <p style={{ fontFamily: 'DM Mono, monospace', fontSize: 12, color: COLORS.faded, margin: '10px 0 0' }}>
                  {c.name ? c.name : 'Anonymous'}
                  {c.email ? (
                    <> &middot; <a href={`mailto:${c.email}`} style={{ color: COLORS.rust, textDecoration: 'none' }}>{c.email}</a></>
                  ) : null}
                </p>
              )}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, flexShrink: 0 }}>
              <button
                onClick={() => onRespond && onRespond('review', c.id, c.editorResponse)}
                style={{ cursor: 'pointer', background: 'transparent', border: '1.5px solid ' + COLORS.ember, color: COLORS.ember, padding: '8px 14px', fontFamily: 'DM Mono, monospace', fontSize: 10, letterSpacing: '0.15em', textTransform: 'uppercase', fontWeight: 600 }}
              >
                {c.editorResponse ? 'Edit reply' : 'Reply'}
              </button>
              <button
                onClick={() => onDismiss(c.id)}
                disabled={!!busy['c-' + c.id]}
                style={{ cursor: 'pointer', background: 'transparent', border: '1px solid ' + COLORS.line, color: COLORS.ink, padding: '8px 14px', fontFamily: 'DM Mono, monospace', fontSize: 10, letterSpacing: '0.15em', textTransform: 'uppercase', fontWeight: 600 }}
              >
                Dismiss
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

function SectionHeading({ children }) {
  return (
    <div style={{ fontFamily: 'DM Mono, monospace', fontSize: 12, letterSpacing: '0.18em', textTransform: 'uppercase', color: COLORS.ink, fontWeight: 700, paddingBottom: 10, marginBottom: 14, borderBottom: `1px solid ${COLORS.line}` }}>
      {children}
    </div>
  );
}

// Analytics tab: list page views and quiz views/plays, stacked into one view.
function AnonPlayersPanel({ players }) {
  const [query, setQuery] = useState('');
  const sort = useSort('recent', 'desc');
  const [expandedKey, setExpandedKey] = useState(null);
  const list = players || [];

  const accessors = {
    player: (p) => p.label || '',
    plays: (p) => p.plays || 0,
    acc: (p) => (p.stats && p.stats.accuracy != null ? p.stats.accuracy : -1),
    device: (p) => (p.devices && p.devices[0]) || '',
    os: (p) => (p.oses && p.oses[0]) || '',
    geo: (p) => (p.geos && p.geos[0]) || '',
    first: (p) => Date.parse((p.stats && p.stats.firstSeen) || '') || 0,
    recent: (p) => Date.parse(p.lastPlayed || '') || 0,
  };

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    const digits = q.replace(/[^0-9]/g, '');
    const arr = !q ? list : list.filter((p) => String(p.label || '').toLowerCase().includes(q) || (digits && String(p.num).includes(digits)));
    return applySort(arr, sort.key, sort.dir, accessors);
  }, [list, query, sort.key, sort.dir]);

  if (!list.length) {
    return (
      <div style={{ padding: '60px 20px', textAlign: 'center', fontFamily: 'Manrope, system-ui, -apple-system, sans-serif', fontStyle: 'italic', fontSize: 18, color: COLORS.faded, border: `1px dashed ${COLORS.line}` }}>
        No anonymous players yet.
      </div>
    );
  }
  const rowBorder = `1px solid ${COLORS.ink}22`;
  const totalPlays = list.reduce((n, p) => n + (p.plays || 0), 0);
  return (
    <div>
      <p style={{ fontFamily: 'Manrope, system-ui, -apple-system, sans-serif', fontSize: 10, color: COLORS.faded, margin: '0 0 14px' }}>
        Players who completed quizzes without signing up, batched by browser and shown under a stable Guest handle.
        {' '}{list.length} anonymous player{list.length === 1 ? '' : 's'}, {totalPlays} play{totalPlays === 1 ? '' : 's'} total.
        {' '}The 10 most recently active are shown; scroll the box for the rest. Click a row to see that player&apos;s last {DETAIL_ROWS} sessions and games, with the full history one click further. Click a column header to sort.
      </p>
      <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Filter by guest handle or number\u2026" style={{ width: '100%', padding: '10px 12px', background: COLORS.paper, border: `1px solid ${COLORS.line}`, color: COLORS.ink, fontFamily: 'DM Mono, monospace', fontSize: 10, outline: 'none', boxSizing: 'border-box', marginBottom: 16 }} />
      {visible.length === 0 ? (
        <div style={{ padding: '40px 20px', textAlign: 'center', fontFamily: 'Manrope, system-ui, -apple-system, sans-serif', fontStyle: 'italic', fontSize: 16, color: COLORS.faded, border: `1px dashed ${COLORS.line}` }}>No matches.</div>
      ) : (
        <div style={{ border: `1px solid ${COLORS.line}`, background: COLORS.paper, borderRadius: 12, maxHeight: expandedKey != null ? PLAYERS_VIEW_H_OPEN : PLAYERS_VIEW_H, overflowY: 'auto' }}>
          <div style={{ display: 'flex', gap: 16, position: 'sticky', top: 0, zIndex: 1, background: COLORS.cream, fontFamily: 'DM Mono, monospace', fontSize: 10, letterSpacing: '0.14em', textTransform: 'uppercase', color: COLORS.faded, padding: '5px 14px', borderBottom: `1px solid ${COLORS.line}` }}>
            <span style={{ flex: '0 0 28px' }}>#</span>
            <SortHead label="Player" k="player" sort={sort} flex={2} type="string" />
            <SortHead label="Plays" k="plays" sort={sort} flex="0 0 42px" align="right" />
            <SortHead label="Device" k="device" sort={sort} flex="0 0 62px" type="string" />
            <SortHead label="OS" k="os" sort={sort} flex="0 0 58px" type="string" />
            <SortHead label="Geo" k="geo" sort={sort} flex="0 0 118px" type="string" />
            <SortHead label="First" k="first" sort={sort} flex="0 0 60px" align="right" />
            <SortHead label="Last" k="recent" sort={sort} flex="0 0 118px" align="right" />
          </div>
          {visible.map((p, i) => {
            const open = expandedKey === p.key;
            return (
              <div key={p.key} style={{ borderBottom: i < visible.length - 1 ? rowBorder : 'none' }}>
                <div onClick={() => setExpandedKey(open ? null : p.key)} style={{ display: 'flex', gap: 16, alignItems: 'center', fontFamily: 'Manrope, system-ui, -apple-system, sans-serif', fontSize: 10, color: COLORS.ink, padding: '3px 14px', cursor: 'pointer', background: open ? `${COLORS.ink}0a` : 'transparent' }}>
                  <span style={{ flex: '0 0 32px', fontFamily: 'DM Mono, monospace', fontSize: 10, color: COLORS.faded, display: 'flex', alignItems: 'center', gap: 4 }}>
                    <span style={{ display: 'inline-block', width: 8, transform: open ? 'rotate(90deg)' : 'none', transition: 'transform 0.12s' }}>&#9656;</span>
                    {i + 1}
                  </span>
                  <span style={{ flex: 2, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontFamily: 'Manrope, system-ui, -apple-system, sans-serif', fontWeight: 700 }}>{p.label}</span>
                  <span style={{ flex: '0 0 42px', textAlign: 'right', fontFamily: 'DM Mono, monospace', fontSize: 10, fontWeight: 700, color: p.plays > 0 ? COLORS.ember : COLORS.faded }}>{p.plays}</span>
                  <MultiCell values={p.devices} flex="0 0 62px" />
                  <MultiCell values={p.oses} flex="0 0 58px" />
                  <MultiCell values={p.geos} flex="0 0 118px" />
                  <span style={{ flex: '0 0 60px', textAlign: 'right', fontFamily: 'DM Mono, monospace', fontSize: 10, color: COLORS.faded }}>{p.stats && p.stats.firstSeen ? fmtShort(p.stats.firstSeen) : '\u2014'}</span>
                  <span style={{ flex: '0 0 118px', textAlign: 'right', fontFamily: 'DM Mono, monospace', fontSize: 10, color: COLORS.faded }}>{p.lastPlayed ? fmtShortDateTime(p.lastPlayed) : '\u2014'}</span>
                </div>
                {open && <PlayerDetail playerKey={p.key} stats={p.stats} />}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// All players, registered AND anonymous, in one unified table. Registered rows
// carry the username/email; anonymous rows carry the stable Guest handle. The
// shared columns (plays, device/browser/geo, last played) line up so the whole
// audience can be ranked together, and each row still expands to its play
// history. This backs the "All" sub-view of Quiz Plays.
function AllPlayersPanel({ signups, anonPlayers }) {
  const [query, setQuery] = useState('');
  const [expandedKey, setExpandedKey] = useState(null);
  const sort = useSort('last', 'desc');

  const rows = useMemo(() => {
    const reg = (signups || []).map((s) => ({
      key: `u:${s.id}`,
      type: 'Registered',
      name: s.username || '(no name)',
      email: s.email || null,
      plays: s.playCount || 0,
      sessions: s.stats ? s.stats.sessions : 0,
      // stats.lastSeen, not plays[0].createdAt: the play list is no longer in
      // the page, and playerStats derived both from the same rows anyway.
      lastAt: (s.stats && s.stats.lastSeen) || '',
      accuracy: s.stats ? s.stats.accuracy : null,
      firstSeen: s.stats ? s.stats.firstSeen : null,
      devices: s.devices,
      oses: s.oses,
      geos: s.geos,
      stats: s.stats,
    }));
    const anon = (anonPlayers || []).map((p) => ({
      key: p.key,
      type: 'Anonymous',
      name: p.label,
      email: null,
      plays: p.plays || 0,
      sessions: p.stats ? p.stats.sessions : 0,
      lastAt: p.lastPlayed || '',
      accuracy: p.stats ? p.stats.accuracy : null,
      firstSeen: p.stats ? p.stats.firstSeen : null,
      devices: p.devices,
      oses: p.oses,
      geos: p.geos,
      stats: p.stats,
    }));
    return [...reg, ...anon];
  }, [signups, anonPlayers]);

  const accessors = {
    name: (r) => r.name || '',
    type: (r) => r.type || '',
    plays: (r) => r.plays || 0,
    sessions: (r) => r.sessions || 0,
    acc: (r) => (r.accuracy == null ? -1 : r.accuracy),
    device: (r) => (r.devices && r.devices[0]) || '',
    os: (r) => (r.oses && r.oses[0]) || '',
    geo: (r) => (r.geos && r.geos[0]) || '',
    first: (r) => Date.parse(r.firstSeen || '') || 0,
    last: (r) => Date.parse(r.lastAt || '') || 0,
  };

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    const filtered = !q
      ? rows
      : rows.filter((r) => (r.name || '').toLowerCase().includes(q) || (r.email || '').toLowerCase().includes(q));
    return applySort(filtered, sort.key, sort.dir, accessors);
  }, [rows, query, sort.key, sort.dir]);

  if (!rows.length) {
    return (
      <div style={{ padding: '60px 20px', textAlign: 'center', fontFamily: 'Manrope, system-ui, -apple-system, sans-serif', fontStyle: 'italic', fontSize: 18, color: COLORS.faded, border: `1px dashed ${COLORS.line}` }}>
        No players yet.
      </div>
    );
  }

  const rowBorder = `1px solid ${COLORS.ink}22`;
  const totalPlays = rows.reduce((n, r) => n + (r.plays || 0), 0);
  const regCount = (signups || []).length;
  const anonCount = (anonPlayers || []).length;

  return (
    <div>
      <p style={{ fontFamily: 'Manrope, system-ui, -apple-system, sans-serif', fontSize: 10, color: COLORS.faded, margin: '0 0 14px' }}>
        Every player, registered and anonymous, in one table.
        {' '}{rows.length} player{rows.length === 1 ? '' : 's'} ({regCount} registered, {anonCount} anonymous), {totalPlays} play{totalPlays === 1 ? '' : 's'} total.
        {' '}The 10 most recently active are shown; scroll the box for the rest. Click a row to see that player&apos;s last {DETAIL_ROWS} sessions and games, with the full history one click further. Click a column header to sort.
      </p>
      <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Filter by name or email…" style={{ width: '100%', padding: '10px 12px', background: COLORS.paper, border: `1px solid ${COLORS.line}`, color: COLORS.ink, fontFamily: 'DM Mono, monospace', fontSize: 10, outline: 'none', boxSizing: 'border-box', marginBottom: 16 }} />
      {visible.length === 0 ? (
        <div style={{ padding: '40px 20px', textAlign: 'center', fontFamily: 'Manrope, system-ui, -apple-system, sans-serif', fontStyle: 'italic', fontSize: 16, color: COLORS.faded, border: `1px dashed ${COLORS.line}` }}>No matches.</div>
      ) : (
        <div style={{ border: `1px solid ${COLORS.line}`, background: COLORS.paper, borderRadius: 12, maxHeight: expandedKey != null ? PLAYERS_VIEW_H_OPEN : PLAYERS_VIEW_H, overflowY: 'auto' }}>
          <div style={{ display: 'flex', gap: 16, position: 'sticky', top: 0, zIndex: 1, background: COLORS.cream, fontFamily: 'DM Mono, monospace', fontSize: 10, letterSpacing: '0.14em', textTransform: 'uppercase', color: COLORS.faded, padding: '5px 14px', borderBottom: `1px solid ${COLORS.line}` }}>
            <span style={{ flex: '0 0 28px' }}>#</span>
            <SortHead label="Player" k="name" sort={sort} flex={2} type="string" />
            <SortHead label="Type" k="type" sort={sort} flex="0 0 76px" type="string" />
            <SortHead label="Plays" k="plays" sort={sort} flex="0 0 42px" align="right" />
            <SortHead label="Sessions" k="sessions" sort={sort} flex="0 0 62px" align="right" />
            <SortHead label="Device" k="device" sort={sort} flex="0 0 62px" type="string" />
            <SortHead label="OS" k="os" sort={sort} flex="0 0 58px" type="string" />
            <SortHead label="Geo" k="geo" sort={sort} flex="0 0 118px" type="string" />
            <SortHead label="First" k="first" sort={sort} flex="0 0 60px" align="right" />
            <SortHead label="Last" k="last" sort={sort} flex="0 0 118px" align="right" />
          </div>
          {visible.map((r, i) => {
            const open = expandedKey === r.key;
            const reg = r.type === 'Registered';
            return (
              <div key={r.key} style={{ borderBottom: i < visible.length - 1 ? rowBorder : 'none' }}>
                <div onClick={() => setExpandedKey(open ? null : r.key)} style={{ display: 'flex', gap: 16, alignItems: 'center', fontFamily: 'Manrope, system-ui, -apple-system, sans-serif', fontSize: 10, color: COLORS.ink, padding: '3px 14px', cursor: 'pointer', background: open ? `${COLORS.ink}0a` : 'transparent' }}>
                  <span style={{ flex: '0 0 28px', fontFamily: 'DM Mono, monospace', fontSize: 10, color: COLORS.faded, display: 'flex', alignItems: 'center', gap: 4 }}>
                    <span style={{ display: 'inline-block', width: 8, transform: open ? 'rotate(90deg)' : 'none', transition: 'transform 0.12s' }}>&#9656;</span>
                    {i + 1}
                  </span>
                  <span style={{ flex: 2, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontWeight: 600, fontFamily: 'Manrope, system-ui, -apple-system, sans-serif' }}>
                    {r.name}
                    {r.email ? <span style={{ color: COLORS.faded, fontWeight: 400, fontFamily: 'DM Mono, monospace', fontSize: 10 }}>{' · '}{r.email}</span> : null}
                  </span>
                  <span style={{ flex: '0 0 76px', fontFamily: 'DM Mono, monospace', fontSize: 10, letterSpacing: '0.06em', textTransform: 'uppercase', color: reg ? COLORS.ember : COLORS.faded }}>{reg ? 'Registered' : 'Anon'}</span>
                  <span style={{ flex: '0 0 42px', textAlign: 'right', fontFamily: 'DM Mono, monospace', fontSize: 10, fontWeight: 700, color: r.plays > 0 ? COLORS.ember : COLORS.faded }}>{r.plays}</span>
                  <span style={{ flex: '0 0 62px', textAlign: 'right', fontFamily: 'DM Mono, monospace', fontSize: 10, color: r.sessions > 0 ? COLORS.ink : COLORS.faded }}>{r.sessions}</span>
                  <MultiCell values={r.devices} flex="0 0 62px" />
                  <MultiCell values={r.oses} flex="0 0 58px" />
                  <MultiCell values={r.geos} flex="0 0 118px" />
                  <span style={{ flex: '0 0 60px', textAlign: 'right', fontFamily: 'DM Mono, monospace', fontSize: 10, color: COLORS.faded }}>{r.firstSeen ? fmtShort(r.firstSeen) : '—'}</span>
                  <span style={{ flex: '0 0 118px', textAlign: 'right', fontFamily: 'DM Mono, monospace', fontSize: 10, color: COLORS.faded }}>{r.lastAt ? fmtShortDateTime(r.lastAt) : '—'}</span>
                </div>
                {open && <PlayerDetail playerKey={r.key} stats={r.stats} />}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// Analytics tab: switched between Quiz Plays and Page Views. Quiz Plays has its
// own sub-toggle (All / Registered / Anonymous). Page Views has a sub-toggle
// (All / Lists / Quizzes) over the unified PageViewsPanel; quiz page views and
// the former Quiz Stats play columns are folded in there. Only one table is on
// screen at a time.
// DAU / WAU / MAU strip pinned to the top of the Analytics tab. Two signals
// side by side: "Active players" (distinct quiz players — registered + anonymous
// browsers — from existing data, with full history) and "Unique visitors"
// (distinct site visitors across all pages, from visitor_active_counts(); shows
// a pending note until migration 30 is applied and data accrues).
function ActiveUsersStrip({ data }) {
  const players = (data && data.players) || { dau: 0, wau: 0, mau: 0 };
  const visitors = data && data.visitors ? data.visitors : null;
  const cols = [
    ['DAU', 'dau', 'past 24 hours'],
    ['WAU', 'wau', 'past 7 days'],
    ['MAU', 'mau', 'past 30 days'],
  ];
  const nf = (n) => (typeof n === 'number' ? n.toLocaleString() : '\u2014');
  const card = (label, value, sub, accent, dim) => (
    <div
      key={label}
      style={{
        flex: 1,
        minWidth: 92,
        background: COLORS.paper,
        border: `1px solid ${COLORS.line}`,
        borderRadius: 12,
        padding: '11px 14px',
        opacity: dim ? 0.55 : 1,
      }}
    >
      <div style={{ fontFamily: 'DM Mono, monospace', fontSize: 10, letterSpacing: '0.16em', textTransform: 'uppercase', color: COLORS.faded }}>
        {label}
      </div>
      <div style={{ fontFamily: 'Manrope, system-ui, -apple-system, sans-serif', fontWeight: 800, fontSize: 26, lineHeight: 1.1, color: accent, marginTop: 2 }}>
        {value}
      </div>
      <div style={{ fontFamily: 'DM Mono, monospace', fontSize: 9, letterSpacing: '0.07em', textTransform: 'uppercase', color: COLORS.faded, marginTop: 3 }}>
        {sub}
      </div>
    </div>
  );
  const group = (heading, note, vals, accent, dim) => (
    <div style={{ flex: '1 1 320px', minWidth: 280 }}>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginBottom: 7 }}>
        <span style={{ fontFamily: 'DM Mono, monospace', fontSize: 11, letterSpacing: '0.12em', textTransform: 'uppercase', fontWeight: 600, color: COLORS.ink }}>
          {heading}
        </span>
        {note && (
          <span style={{ fontFamily: 'Manrope, system-ui, -apple-system, sans-serif', fontSize: 10, fontStyle: 'italic', color: COLORS.faded }}>
            {note}
          </span>
        )}
      </div>
      <div style={{ display: 'flex', gap: 8 }}>
        {cols.map(([label, key, sub]) => card(label, vals ? nf(vals[key]) : '\u2014', sub, accent, dim))}
      </div>
    </div>
  );
  return (
    <div style={{ marginBottom: 26 }}>
      <div style={{ fontFamily: 'DM Mono, monospace', fontSize: 12, letterSpacing: '0.14em', textTransform: 'uppercase', fontWeight: 600, color: COLORS.ink, marginBottom: 12 }}>
        Active Users
      </div>
      <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap' }}>
        {group('Active players', 'distinct quiz players', players, COLORS.ember, false)}
        {group(
          'Unique visitors',
          visitors ? 'distinct site visitors' : 'pending migration 30',
          visitors,
          COLORS.forest,
          !visitors
        )}
      </div>
    </div>
  );
}

function AnalyticsPanel({ views, viewsTotal, quizStats, quizPlaysTotal, signups, anonPlayers, activeUsers, geoMap, dailyRetention = { games: [], breadth: { total: 0, histogram: [] } }, timeByDay = { series: [], totals: {} }, newUsers = { series: [], totals: {} }, dailyByGame = { games: [], totals: {} }, topPlayersToday = { day: null, players: [], totals: {} } }) {
  const [view, setView] = useState('plays');
  const [playsView, setPlaysView] = useState('all');
  const [pvView, setPvView] = useState('all');
  const [gamesBusy, setGamesBusy] = useState(false);

  // One row per completed game, so this is the one export that still needs the
  // per-play detail the page stopped shipping. It is a deliberate whole-table
  // read behind an explicit click rather than a cost every page load pays.
  const exportGames = async () => {
    if (gamesBusy) return;
    setGamesBusy(true);
    try {
      const r = await fetch('/api/admin/player-plays?all=1');
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      const d = await r.json();
      exportGamesCsv(d.players || []);
    } catch (e) {
      alert(`Could not build the games CSV: ${e.message || e}`);
    } finally {
      setGamesBusy(false);
    }
  };
  const regCount = (signups || []).length;
  const anonCount = (anonPlayers || []).length;
  const listCount = (views || []).length;
  const quizCount = (quizStats || []).length;
  const retentionTotal = (dailyRetention && dailyRetention.breadth && dailyRetention.breadth.total) || 0;
  // Time Played is no longer its own tab: its chart, the new-users chart, and
  // the per-game comparison all live under Quiz Plays, below the player table.
  const tabs = [
    ['plays', 'Quiz Plays', regCount + anonCount],
    ['pageviews', 'Page Views', listCount + quizCount],
    ['retention', 'Return Play', retentionTotal],
    ['map', 'Player Map', (geoMap && geoMap.totals && geoMap.totals.locatedPlayers) || 0],
  ];
  const playsSub = [
    ['all', 'All', regCount + anonCount],
    ['registered', 'Registered', regCount],
    ['anonymous', 'Anonymous', anonCount],
  ];
  const pvSub = [
    ['all', 'All', listCount + quizCount],
    ['lists', 'Lists', listCount],
    ['quizzes', 'Quizzes', quizCount],
  ];
  const subTabs = view === 'plays' ? playsSub : view === 'pageviews' ? pvSub : [];
  const subActive = view === 'plays' ? playsView : pvView;
  const setSub = view === 'plays' ? setPlaysView : setPvView;
  const tabStyle = (on) => ({
    padding: '8px 14px',
    background: on ? COLORS.ember : 'transparent',
    border: `1px solid ${on ? COLORS.ember : COLORS.line}`,
    color: on ? COLORS.paper : COLORS.ink,
    fontFamily: 'DM Mono, monospace',
    fontSize: 11,
    letterSpacing: '0.1em',
    textTransform: 'uppercase',
    fontWeight: 600,
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    gap: 6,
  });
  const subTabStyle = (on) => ({
    padding: '6px 12px',
    background: on ? `${COLORS.ember}1a` : 'transparent',
    border: `1px solid ${on ? COLORS.ember : COLORS.line}`,
    color: on ? COLORS.ember : COLORS.faded,
    fontFamily: 'DM Mono, monospace',
    fontSize: 10,
    letterSpacing: '0.08em',
    textTransform: 'uppercase',
    fontWeight: 600,
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    gap: 5,
  });
  return (
    <div>
      <ActiveUsersStrip data={activeUsers} />
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 12, alignItems: 'center' }}>
        {/* The games CSV is one row per completed game, so it needs the play
            detail the page no longer carries. It fetches it on click, which is
            the right moment to pay for it. */}
        {tabs.map(([key, label, count]) => {
          const on = view === key;
          return (
            <button key={key} onClick={() => setView(key)} style={tabStyle(on)}>
              {label}
              <span style={{ opacity: 0.6 }}>{count}</span>
            </button>
          );
        })}
        <div style={{ marginLeft: 'auto', display: 'flex', gap: 6 }}>
          <button
            onClick={() => exportUsersCsv(signups, anonPlayers)}
            title="One row per player (registered + anonymous) with the full stats the player tables show: plays, sessions, accuracy, devices, locations, first/last seen…"
            style={{ padding: '7px 12px', background: COLORS.ink, border: `1px solid ${COLORS.ink}`, color: COLORS.cream, fontFamily: 'DM Mono, monospace', fontSize: 10, letterSpacing: '0.08em', textTransform: 'uppercase', fontWeight: 600, cursor: 'pointer' }}
          >
            ↓ Users CSV
          </button>
          <button
            onClick={exportGames}
            disabled={gamesBusy}
            title="One row per completed game with the per-play detail the expanded rows show: quiz, score, correct, time, device, OS, browser, location, timezone, language, referrer"
            style={{ padding: '7px 12px', background: COLORS.ink, border: `1px solid ${COLORS.ink}`, color: COLORS.cream, fontFamily: 'DM Mono, monospace', fontSize: 10, letterSpacing: '0.08em', textTransform: 'uppercase', fontWeight: 600, cursor: gamesBusy ? 'wait' : 'pointer', opacity: gamesBusy ? 0.6 : 1 }}
          >
            {gamesBusy ? '↓ Building…' : '↓ Games CSV'}
          </button>
        </div>
      </div>
      {subTabs.length ? (
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 22, paddingLeft: 2 }}>
          {subTabs.map(([key, label, count]) => {
            const on = subActive === key;
            return (
              <button key={key} onClick={() => setSub(key)} style={subTabStyle(on)}>
                {label}
                <span style={{ opacity: 0.6 }}>{count}</span>
              </button>
            );
          })}
        </div>
      ) : null}
      {view === 'plays' ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 44 }}>
          {playsView === 'registered' ? (
            <QuizSignupsPanel signups={signups} />
          ) : playsView === 'anonymous' ? (
            <AnonPlayersPanel players={anonPlayers} />
          ) : (
            <AllPlayersPanel signups={signups} anonPlayers={anonPlayers} />
          )}
          <TopPlayersTodayPanel data={topPlayersToday} />
          <TimeByDayPanel data={timeByDay} />
          <NewUsersByDayPanel data={newUsers} />
          <GamesRankedPanel data={dailyByGame} />
        </div>
      ) : view === 'pageviews' ? (
        <PageViewsPanel lists={views} quizzes={quizStats} mode={pvView} />
      ) : view === 'retention' ? (
        <RetentionPanel data={dailyRetention} />
      ) : (
        <GeoMapPanel data={geoMap} />
      )}
    </div>
  );
}

// Analytics -> Return Play. Shows how many players come back to the daily games.
// An "All daily games" tab gives the cross-game breadth (players who touched 1
// of the four games, 2, 3, or all 4); each per-game tab gives that game's
// return distribution — players by number of DISTINCT days they've completed it
// (1 day = played once, 2 = came back once more, and so on). Players include
// anonymous browsers, keyed the same way as the active-user counts.
function RetentionBars({ rows, unitLabel, accent }) {
  const max = rows.reduce((m, r) => Math.max(m, r.count), 0);
  const total = rows.reduce((s, r) => s + r.count, 0);
  if (!total) {
    return <p style={{ fontFamily: 'DM Mono, monospace', fontSize: 12, color: COLORS.faded, fontStyle: 'italic' }}>No plays recorded yet.</p>;
  }
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      {rows.map((r) => {
        const pct = total ? Math.round((r.count / total) * 100) : 0;
        const w = max ? Math.round((r.count / max) * 100) : 0;
        return (
          <div key={r.label} style={{ display: 'grid', gridTemplateColumns: '132px 1fr 96px', gap: 12, alignItems: 'center' }}>
            <div style={{ fontFamily: 'DM Mono, monospace', fontSize: 12, color: COLORS.ink, textAlign: 'right' }}>{r.label}</div>
            <div style={{ background: COLORS.cream, border: `1px solid ${COLORS.line}`, borderRadius: 5, height: 22, position: 'relative', overflow: 'hidden' }}>
              <div style={{ position: 'absolute', inset: 0, width: `${w}%`, background: accent, opacity: 0.85, borderRadius: 4 }} />
            </div>
            <div style={{ fontFamily: 'DM Mono, monospace', fontSize: 12, color: COLORS.faded, textAlign: 'left' }}>
              <span style={{ color: COLORS.ink, fontWeight: 700 }}>{r.count.toLocaleString()}</span> {unitLabel}
              <span style={{ opacity: 0.7 }}> · {pct}%</span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
function RetentionPanel({ data }) {
  const games = (data && data.games) || [];
  const breadth = (data && data.breadth) || { total: 0, histogram: [] };
  const [sub, setSub] = useState('all');
  const subTabStyle = (on) => ({
    padding: '6px 12px',
    background: on ? `${COLORS.ember}1a` : 'transparent',
    border: `1px solid ${on ? COLORS.ember : COLORS.line}`,
    color: on ? COLORS.ember : COLORS.faded,
    fontFamily: 'DM Mono, monospace',
    fontSize: 10,
    letterSpacing: '0.08em',
    textTransform: 'uppercase',
    fontWeight: 600,
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    gap: 5,
  });
  const subs = [['all', 'All daily games', breadth.total], ...games.map((g) => [g.key, g.title, g.players])];
  const activeGame = sub === 'all' ? null : games.find((g) => g.key === sub) || null;
  return (
    <div>
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 22, paddingLeft: 2 }}>
        {subs.map(([key, label, count]) => (
          <button key={key} onClick={() => setSub(key)} style={subTabStyle(sub === key)}>
            {label}
            <span style={{ opacity: 0.6 }}>{count}</span>
          </button>
        ))}
      </div>
      {sub === 'all' ? (
        <div>
          <SectionHeading>Daily games played per user</SectionHeading>
          <p style={{ fontFamily: 'DM Mono, monospace', fontSize: 11, color: COLORS.faded, margin: '0 0 18px', lineHeight: 1.6 }}>
            Of the four daily games (Links, Span, Crux, Garble), how many distinct games each player has ever played.
            <span style={{ color: COLORS.ink }}> {breadth.total.toLocaleString()}</span> players total.
          </p>
          <RetentionBars
            accent={COLORS.ember}
            unitLabel="players"
            rows={(breadth.histogram || []).map((h) => ({ label: `${h.games} game${h.games === 1 ? '' : 's'}`, count: h.count }))}
          />
        </div>
      ) : activeGame ? (
        <div>
          <SectionHeading>{activeGame.title} — return play</SectionHeading>
          <p style={{ fontFamily: 'DM Mono, monospace', fontSize: 11, color: COLORS.faded, margin: '0 0 18px', lineHeight: 1.6 }}>
            Players grouped by how many distinct days they have completed {activeGame.title}.
            <span style={{ color: COLORS.ink }}> {activeGame.players.toLocaleString()}</span> players ·
            <span style={{ color: COLORS.ink }}> {activeGame.returning.toLocaleString()}</span> returned at least once
            {activeGame.players ? <span style={{ opacity: 0.8 }}> ({Math.round((activeGame.returning / activeGame.players) * 100)}%)</span> : null}.
          </p>
          <RetentionBars
            accent={COLORS.forest}
            unitLabel="players"
            rows={(activeGame.histogram || []).map((h) => ({ label: `${h.days} day${h.days === 1 ? '' : 's'}`, count: h.count }))}
          />
        </div>
      ) : null}
    </div>
  );
}

// ---- Analytics -> Time Played -------------------------------------------------
// Total wall-clock time players spent completing quizzes, per day, across the
// full quiz_results history. The daily series arrives gap-filled from the server
// (buildTimeByDay); this panel adds a Day / Week / Month granularity toggle
// (aggregated client-side), a summary strip, a column chart, and a CSV export.
const TBD_MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
// Parse a 'YYYY-MM-DD' day at UTC noon so calendar labels never slip across a
// timezone boundary.
function tbdParseDay(day) {
  return new Date(`${day}T12:00:00Z`);
}
// Human duration. Hours+minutes once past an hour, else minutes+seconds, else
// seconds — keeps tooltips and totals readable at every scale.
function tbdDur(seconds) {
  const s = Math.max(0, Math.round(Number(seconds) || 0));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  if (h > 0) return `${h}h ${m}m`;
  if (m > 0) return `${m}m ${sec}s`;
  return `${sec}s`;
}
// Compact value + unit for the summary cards (e.g. 41.2 / "hours", 18 / "min").
function tbdHoursValue(seconds) {
  const secs = Number(seconds) || 0;
  const h = secs / 3600;
  if (h >= 100) return { value: Math.round(h).toLocaleString(), unit: 'hours' };
  if (h >= 1) return { value: h.toFixed(1), unit: 'hours' };
  return { value: String(Math.round(secs / 60)), unit: 'min' };
}
function tbdLongDate(day) {
  const d = tbdParseDay(day);
  return `${TBD_MONTHS[d.getUTCMonth()]} ${d.getUTCDate()}, ${d.getUTCFullYear()}`;
}
// Roll the daily series up into the chosen granularity. Day passes through;
// Week groups by the Sunday that starts each row's week; Month groups by
// calendar month. Each bucket keeps a display label, a full-range sub-label for
// the tooltip, summed seconds, and summed plays.
function tbdBucketize(series, gran) {
  const rows = series || [];
  if (gran === 'day') {
    return rows.map((r) => ({
      key: r.day,
      label: `${TBD_MONTHS[tbdParseDay(r.day).getUTCMonth()]} ${tbdParseDay(r.day).getUTCDate()}`,
      full: tbdLongDate(r.day),
      seconds: r.seconds,
      plays: r.plays,
    }));
  }
  const map = new Map();
  for (const r of rows) {
    const d = tbdParseDay(r.day);
    let key, label, full;
    if (gran === 'week') {
      const start = new Date(d.getTime());
      start.setUTCDate(start.getUTCDate() - start.getUTCDay()); // back to Sunday
      key = `${start.getUTCFullYear()}-${String(start.getUTCMonth() + 1).padStart(2, '0')}-${String(start.getUTCDate()).padStart(2, '0')}`;
      label = `${TBD_MONTHS[start.getUTCMonth()]} ${start.getUTCDate()}`;
      full = `Week of ${TBD_MONTHS[start.getUTCMonth()]} ${start.getUTCDate()}, ${start.getUTCFullYear()}`;
    } else {
      key = `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}`;
      label = `${TBD_MONTHS[d.getUTCMonth()]} '${String(d.getUTCFullYear()).slice(2)}`;
      full = `${TBD_MONTHS[d.getUTCMonth()]} ${d.getUTCFullYear()}`;
    }
    const cur = map.get(key) || { key, label, full, seconds: 0, plays: 0 };
    cur.seconds += r.seconds;
    cur.plays += r.plays;
    map.set(key, cur);
  }
  return Array.from(map.values()).sort((a, b) => a.key.localeCompare(b.key));
}

// ---- In-progress bucket projection --------------------------------------------
// The final bucket is nearly always still running (today, this week, this
// month), so its bar reads as a collapse next to the completed period beside
// it. These helpers work out how much of that period has already elapsed in US
// Eastern (the zone the server buckets in) and extrapolate where the bucket
// lands at the pace set so far. The chart draws that as a dotted outline on top
// of the solid bar, so the real number stays visually distinct from the guess.

// Below this much of the period elapsed the extrapolation is multiplying noise,
// so no projection is drawn at all.
const TBD_MIN_ELAPSED = 0.1;

// Current wall clock in US Eastern: the day key it falls on, plus how many
// seconds into that day we are.
function tbdEasternNow() {
  const parts = {};
  for (const p of new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/New_York',
    hourCycle: 'h23',
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', second: '2-digit',
  }).formatToParts(new Date())) parts[p.type] = p.value;
  return {
    day: `${parts.year}-${parts.month}-${parts.day}`,
    secondsIntoDay: Number(parts.hour) * 3600 + Number(parts.minute) * 60 + Number(parts.second),
  };
}

// Share of a typical day's play that has landed by the current moment. The
// server ships a measured intraday curve (buildPlayShape): hourCum[h] is the
// cumulative share of a day's seconds banked by the END of ET hour h. We
// interpolate inside the current hour so the number advances smoothly. Without
// a curve this degrades to plain clock time, which is the old behavior.
function tbdDayShare(now, shape) {
  const clock = Math.min(1, now.secondsIntoDay / 86400);
  const cum = shape && Array.isArray(shape.hourCum) && shape.hourCum.length === 24 ? shape.hourCum : null;
  if (!cum) return clock;
  const h = Math.min(23, Math.floor(now.secondsIntoDay / 3600));
  const within = Math.min(1, (now.secondsIntoDay - h * 3600) / 3600);
  const prev = h === 0 ? 0 : cum[h - 1];
  return Math.max(0, Math.min(1, prev + (cum[h] - prev) * within));
}

// The weekday curve, or null when the server could not measure one.
function tbdDowShape(shape) {
  const d = shape && Array.isArray(shape.dow) && shape.dow.length === 7 ? shape.dow : null;
  return d && d.every((x) => typeof x === 'number' && x > 0) ? d : null;
}

// Fraction (0-1] of the bucket's EXPECTED VOLUME that has already landed, or 0
// when the bucket is a finished past period. This is deliberately not "how much
// clock time has passed": dividing by demand-so-far is what makes the projection
// hold up at 8am as well as at 8pm. Bucket keys match the ones tbdBucketize builds.
function tbdElapsedFraction(bucketKey, gran, shape) {
  const now = tbdEasternNow();
  const dayFrac = tbdDayShare(now, shape);
  const d = tbdParseDay(now.day);
  const dow = tbdDowShape(shape);

  if (gran === 'day') return bucketKey === now.day ? dayFrac : 0;

  if (gran === 'week') {
    const start = new Date(d.getTime());
    start.setUTCDate(start.getUTCDate() - start.getUTCDay()); // back to Sunday
    const key = `${start.getUTCFullYear()}-${String(start.getUTCMonth() + 1).padStart(2, '0')}-${String(start.getUTCDate()).padStart(2, '0')}`;
    if (bucketKey !== key) return 0;
    const today = d.getUTCDay();
    if (!dow) return (today + dayFrac) / 7;
    // Completed weekdays at their full share, plus today's share scaled by how
    // far into today's own curve we are.
    let done = 0;
    for (let i = 0; i < today; i++) done += dow[i];
    return Math.max(0, Math.min(1, done + dow[today] * dayFrac));
  }

  const key = `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}`;
  if (bucketKey !== key) return 0;
  const daysInMonth = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + 1, 0)).getUTCDate();
  if (!dow) return (d.getUTCDate() - 1 + dayFrac) / daysInMonth;
  // Weight every calendar day of the month by its weekday share, so a month
  // carrying an extra weekend is not treated as if its days were interchangeable.
  const firstDow = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), 1)).getUTCDay();
  let done = 0, all = 0;
  for (let i = 0; i < daysInMonth; i++) {
    const w = dow[(firstDow + i) % 7];
    all += w;
    if (i < d.getUTCDate() - 1) done += w;
    else if (i === d.getUTCDate() - 1) done += w * dayFrac;
  }
  return all > 0 ? Math.max(0, Math.min(1, done / all)) : (d.getUTCDate() - 1 + dayFrac) / daysInMonth;
}

// Extrapolation of the trailing bucket: seconds so far divided by the share of
// the period's expected volume that has already landed. Returns null for a
// bucket that is complete, empty, or too early in the period to project.
function tbdProjectLastBucket(buckets, gran, shape) {
  const last = buckets && buckets.length ? buckets[buckets.length - 1] : null;
  if (!last || !(last.seconds > 0)) return null;
  const fraction = tbdElapsedFraction(last.key, gran, shape);
  if (!(fraction >= TBD_MIN_ELAPSED) || fraction >= 0.999) return null;
  const seconds = last.seconds / fraction;
  if (!Number.isFinite(seconds) || seconds <= last.seconds) return null;
  const curve = gran === 'day' ? !!(shape && shape.hourCum) : !!(shape && tbdDowShape(shape));
  return { key: last.key, seconds, fraction, actual: last.seconds, curve, basisDays: (shape && shape.basisDays) || 0 };
}

function TimeByDayStat({ value, unit, label, accent }) {
  return (
    <div style={{ flex: '1 1 150px', minWidth: 140, background: COLORS.paper, border: `1px solid ${COLORS.line}`, borderRadius: 8, padding: '14px 16px' }}>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 5 }}>
        <span style={{ fontFamily: 'DM Mono, monospace', fontSize: 24, fontWeight: 700, color: accent || COLORS.ink, lineHeight: 1 }}>{value}</span>
        {unit ? <span style={{ fontFamily: 'DM Mono, monospace', fontSize: 11, color: COLORS.faded }}>{unit}</span> : null}
      </div>
      <div style={{ fontFamily: 'DM Mono, monospace', fontSize: 10, letterSpacing: '0.08em', textTransform: 'uppercase', color: COLORS.faded, marginTop: 8 }}>{label}</div>
    </div>
  );
}

function TimeByDayPanel({ data }) {
  const series = (data && data.series) || [];
  const totals = (data && data.totals) || {};
  const shape = (data && data.shape) || null; // measured intraday / weekday curve
  const [gran, setGran] = useState('day');
  const buckets = useMemo(() => tbdBucketize(series, gran), [series, gran]);
  // The trailing bucket is usually still running, so project where it lands and
  // let the y-scale include that projection so the dotted top always fits.
  const projection = useMemo(() => tbdProjectLastBucket(buckets, gran, shape), [buckets, gran, shape]);
  // Put the measured curve behind a hover on the legend, so a projection that
  // looks wrong can be checked against the shape it came from without going to
  // the data.
  const shapeTip = useMemo(() => {
    const cum = shape && Array.isArray(shape.hourCum) && shape.hourCum.length === 24 ? shape.hourCum : null;
    if (!cum) return '';
    const rows = [];
    for (let h = 2; h < 24; h += 3) rows.push(`${String((h + 1) % 24).padStart(2, '0')}:00  ${(cum[h] * 100).toFixed(0)}%`);
    return `Share of a typical day's play banked by each ET hour.\nMedian of the last ${shape.basisDays} complete days (${shape.firstDay} to ${shape.lastDay}):\n\n${rows.join('\n')}`;
  }, [shape]);
  const maxSeconds = useMemo(
    () => Math.max(buckets.reduce((m, b) => Math.max(m, b.seconds), 0), projection ? projection.seconds : 0),
    [buckets, projection]
  );

  if (!series.length) {
    return <p style={{ fontFamily: 'DM Mono, monospace', fontSize: 12, color: COLORS.faded, fontStyle: 'italic' }}>No completed quiz games recorded yet.</p>;
  }

  const totalHrs = tbdHoursValue(totals.totalSeconds || 0);
  const avgActive = tbdHoursValue(totals.avgActiveDaySeconds || 0);
  const busiest = totals.busiestDay || null;
  // Evenly spread up to ~9 x-axis labels so a long daily history stays legible.
  const labelStep = Math.max(1, Math.ceil(buckets.length / 9));

  const granStyle = (on) => ({
    padding: '6px 12px',
    background: on ? `${COLORS.ember}1a` : 'transparent',
    border: `1px solid ${on ? COLORS.ember : COLORS.line}`,
    color: on ? COLORS.ember : COLORS.faded,
    fontFamily: 'DM Mono, monospace',
    fontSize: 10,
    letterSpacing: '0.08em',
    textTransform: 'uppercase',
    fontWeight: 600,
    cursor: 'pointer',
  });

  const exportCsv = () => {
    const unitLabel = gran === 'day' ? 'Day' : gran === 'week' ? 'Week of' : 'Month';
    const head = [unitLabel, 'Seconds', 'Hours', 'Plays'];
    const rows = buckets.map((b) => [b.full, b.seconds, (b.seconds / 3600).toFixed(3), b.plays]);
    downloadCsvFile(`sot-time-played-by-${gran}`, head, rows);
  };

  return (
    <div>
      <SectionHeading>Time spent playing quizzes</SectionHeading>
      <p style={{ fontFamily: 'DM Mono, monospace', fontSize: 11, color: COLORS.faded, margin: '0 0 18px', lineHeight: 1.6 }}>
        Total wall-clock time players spent completing quizzes, from every recorded game (registered and anonymous), bucketed in US Eastern.
        {totals.firstDay ? <span style={{ color: COLORS.ink }}> {tbdLongDate(totals.firstDay)}</span> : null}
        {totals.lastDay ? <span> → <span style={{ color: COLORS.ink }}>{tbdLongDate(totals.lastDay)}</span></span> : null}.
      </p>

      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 22 }}>
        <TimeByDayStat value={totalHrs.value} unit={totalHrs.unit} label="Total time played" accent={COLORS.ember} />
        <TimeByDayStat value={(totals.totalPlays || 0).toLocaleString()} unit="games" label="Completed games" accent={COLORS.ink} />
        <TimeByDayStat value={(totals.activeDays || 0).toLocaleString()} unit="days" label="Days with plays" accent={COLORS.ink} />
        <TimeByDayStat value={avgActive.value} unit={avgActive.unit} label="Avg / active day" accent={COLORS.forest} />
        <TimeByDayStat
          value={busiest ? tbdHoursValue(busiest.seconds).value : '—'}
          unit={busiest ? tbdHoursValue(busiest.seconds).unit : ''}
          label={busiest ? `Busiest day · ${tbdLongDate(busiest.day)}` : 'Busiest day'}
          accent={COLORS.rust}
        />
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap', marginBottom: 16 }}>
        {[['day', 'Day'], ['week', 'Week'], ['month', 'Month']].map(([key, label]) => (
          <button key={key} onClick={() => setGran(key)} style={granStyle(gran === key)}>{label}</button>
        ))}
        <button
          onClick={exportCsv}
          title="Download the currently shown buckets (period, seconds, hours, plays) as CSV"
          style={{ marginLeft: 'auto', padding: '7px 12px', background: COLORS.ink, border: `1px solid ${COLORS.ink}`, color: COLORS.cream, fontFamily: 'DM Mono, monospace', fontSize: 10, letterSpacing: '0.08em', textTransform: 'uppercase', fontWeight: 600, cursor: 'pointer' }}
        >
          ↓ Time CSV
        </button>
      </div>

      <div style={{ background: COLORS.paper, border: `1px solid ${COLORS.line}`, borderRadius: 8, padding: '18px 16px 10px' }}>
        <div style={{ display: 'flex', alignItems: 'flex-end', gap: buckets.length > 60 ? 1 : 2, height: 190 }}>
          {buckets.map((b) => {
            const h = maxSeconds ? Math.max(b.seconds > 0 ? 2 : 0, Math.round((b.seconds / maxSeconds) * 178)) : 0;
            const proj = projection && projection.key === b.key ? projection : null;
            const projH = proj && maxSeconds ? Math.round((proj.seconds / maxSeconds) * 178) : 0;
            return (
              <div
                key={b.key}
                title={`${b.full}\n${tbdDur(b.seconds)} \u00b7 ${b.plays.toLocaleString()} game${b.plays === 1 ? '' : 's'}${proj ? `\nOn pace for ${tbdDur(proj.seconds)} (${proj.curve ? `${Math.round(proj.fraction * 100)}% of a typical ${gran} of play is in by now` : `${Math.round(proj.fraction * 100)}% of the ${gran} elapsed`})` : ''}`}
                style={{ flex: '1 1 0', minWidth: 2, height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'flex-end' }}
              >
                {proj ? (
                  <div
                    style={{
                      height: Math.max(3, projH - h),
                      boxSizing: 'border-box',
                      border: `1px dashed ${COLORS.ember}`,
                      borderBottom: 'none',
                      borderRadius: '3px 3px 0 0',
                      background: `${COLORS.ember}14`,
                    }}
                  />
                ) : null}
                <div style={{ height: h, background: COLORS.ember, opacity: 0.85, borderRadius: proj ? 0 : '3px 3px 0 0' }} />
              </div>
            );
          })}
        </div>
        <div style={{ display: 'flex', gap: buckets.length > 60 ? 1 : 2, marginTop: 8, borderTop: `1px solid ${COLORS.line}`, paddingTop: 8 }}>
          {buckets.map((b, i) => (
            <div key={b.key} style={{ flex: '1 1 0', minWidth: 2, textAlign: 'center', overflow: 'visible' }}>
              {i % labelStep === 0 ? (
                <span style={{ fontFamily: 'DM Mono, monospace', fontSize: 9, color: COLORS.faded, whiteSpace: 'nowrap' }}>{b.label}</span>
              ) : null}
            </div>
          ))}
        </div>
        {projection ? (
          <div title={shapeTip} style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 12, paddingTop: 10, borderTop: `1px solid ${COLORS.line}`, cursor: shapeTip ? 'help' : 'default' }}>
            <span style={{ flex: '0 0 auto', width: 16, height: 10, boxSizing: 'border-box', border: `1px dashed ${COLORS.ember}`, borderBottom: 'none', borderRadius: '2px 2px 0 0', background: `${COLORS.ember}14`, display: 'inline-block' }} />
            <span style={{ fontFamily: 'DM Mono, monospace', fontSize: 10, color: COLORS.faded, lineHeight: 1.5 }}>
              Dotted outline projects where the current {gran} finishes at the pace set so far:{' '}
              <span style={{ color: COLORS.ink }}>{tbdHoursValue(projection.seconds).value} {tbdHoursValue(projection.seconds).unit}</span>
              {' '}({tbdHoursValue(projection.actual).value} {tbdHoursValue(projection.actual).unit} banked &middot;{' '}
              {projection.curve
                ? `${Math.round(projection.fraction * 100)}% of a typical ${gran}'s play lands by this point, measured over the last ${projection.basisDays} days`
                : `${Math.round(projection.fraction * 100)}% of the ${gran} elapsed, clock time`})
            </span>
          </div>
        ) : null}
      </div>
    </div>
  );
}


// ---- Analytics -> New Users (below the Time Played chart) ---------------------
// Two daily acquisition series plotted side by side: new first-play PLAYERS
// (anonymous + registered, from quiz_results) and new registered SIGNUPS (the
// /quiz join form). Server (buildNewUsersByDay) gap-fills the daily series; this
// panel adds the same Day / Week / Month toggle, summary strip, grouped column
// chart, and CSV export as the Time Played panel above it.
function nubBucketize(series, gran) {
  const rows = series || [];
  if (gran === 'day') {
    return rows.map((r) => ({
      key: r.day,
      label: `${TBD_MONTHS[tbdParseDay(r.day).getUTCMonth()]} ${tbdParseDay(r.day).getUTCDate()}`,
      full: tbdLongDate(r.day),
      players: r.players,
      signups: r.signups,
    }));
  }
  const map = new Map();
  for (const r of rows) {
    const d = tbdParseDay(r.day);
    let key, label, full;
    if (gran === 'week') {
      const start = new Date(d.getTime());
      start.setUTCDate(start.getUTCDate() - start.getUTCDay()); // back to Sunday
      key = `${start.getUTCFullYear()}-${String(start.getUTCMonth() + 1).padStart(2, '0')}-${String(start.getUTCDate()).padStart(2, '0')}`;
      label = `${TBD_MONTHS[start.getUTCMonth()]} ${start.getUTCDate()}`;
      full = `Week of ${TBD_MONTHS[start.getUTCMonth()]} ${start.getUTCDate()}, ${start.getUTCFullYear()}`;
    } else {
      key = `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}`;
      label = `${TBD_MONTHS[d.getUTCMonth()]} '${String(d.getUTCFullYear()).slice(2)}`;
      full = `${TBD_MONTHS[d.getUTCMonth()]} ${d.getUTCFullYear()}`;
    }
    const cur = map.get(key) || { key, label, full, players: 0, signups: 0 };
    cur.players += r.players;
    cur.signups += r.signups;
    map.set(key, cur);
  }
  return Array.from(map.values()).sort((a, b) => a.key.localeCompare(b.key));
}

function NewUsersByDayPanel({ data }) {
  const series = (data && data.series) || [];
  const totals = (data && data.totals) || {};
  const [gran, setGran] = useState('day');
  const buckets = useMemo(() => nubBucketize(series, gran), [series, gran]);
  // Shared y-scale across both series so the two bars are directly comparable.
  const maxVal = useMemo(
    () => buckets.reduce((m, b) => Math.max(m, b.players, b.signups), 0),
    [buckets],
  );

  if (!series.length) {
    return <p style={{ fontFamily: 'DM Mono, monospace', fontSize: 12, color: COLORS.faded, fontStyle: 'italic' }}>No players recorded yet.</p>;
  }

  const busiest = totals.busiestDay || null;
  const labelStep = Math.max(1, Math.ceil(buckets.length / 9));

  const granStyle = (on) => ({
    padding: '6px 12px',
    background: on ? `${COLORS.ember}1a` : 'transparent',
    border: `1px solid ${on ? COLORS.ember : COLORS.line}`,
    color: on ? COLORS.ember : COLORS.faded,
    fontFamily: 'DM Mono, monospace',
    fontSize: 10,
    letterSpacing: '0.08em',
    textTransform: 'uppercase',
    fontWeight: 600,
    cursor: 'pointer',
  });

  const exportCsv = () => {
    const unitLabel = gran === 'day' ? 'Day' : gran === 'week' ? 'Week of' : 'Month';
    const head = [unitLabel, 'New players', 'New signups'];
    const rows = buckets.map((b) => [b.full, b.players, b.signups]);
    downloadCsvFile(`sot-new-users-by-${gran}`, head, rows);
  };

  const LegendDot = ({ color, label }) => (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
      <span style={{ width: 10, height: 10, borderRadius: 2, background: color, display: 'inline-block' }} />
      <span style={{ fontFamily: 'DM Mono, monospace', fontSize: 10, letterSpacing: '0.06em', textTransform: 'uppercase', color: COLORS.faded }}>{label}</span>
    </span>
  );

  return (
    <div>
      <SectionHeading>New users per day</SectionHeading>
      <p style={{ fontFamily: 'DM Mono, monospace', fontSize: 11, color: COLORS.faded, margin: '0 0 18px', lineHeight: 1.6 }}>
        New players (their first-ever recorded quiz play, anonymous and registered alike) and new registered signups from the join form, bucketed in US Eastern.
        {totals.firstDay ? <span style={{ color: COLORS.ink }}> {tbdLongDate(totals.firstDay)}</span> : null}
        {totals.lastDay ? <span> &rarr; <span style={{ color: COLORS.ink }}>{tbdLongDate(totals.lastDay)}</span></span> : null}.
      </p>

      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 22 }}>
        <TimeByDayStat value={(totals.totalPlayers || 0).toLocaleString()} unit="players" label="New players (all-time)" accent={COLORS.ember} />
        <TimeByDayStat value={(totals.totalSignups || 0).toLocaleString()} unit="signups" label="New signups (all-time)" accent={COLORS.forest} />
        <TimeByDayStat value={(totals.activeDays || 0).toLocaleString()} unit="days" label="Days with new players" accent={COLORS.ink} />
        <TimeByDayStat value={(totals.avgActiveDayPlayers || 0).toLocaleString()} unit="/ day" label="Avg new players / active day" accent={COLORS.ink} />
        <TimeByDayStat
          value={busiest ? (busiest.players || 0).toLocaleString() : '—'}
          unit={busiest ? 'players' : ''}
          label={busiest ? `Busiest day · ${tbdLongDate(busiest.day)}` : 'Busiest day'}
          accent={COLORS.rust}
        />
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap', marginBottom: 16 }}>
        {[['day', 'Day'], ['week', 'Week'], ['month', 'Month']].map(([key, label]) => (
          <button key={key} onClick={() => setGran(key)} style={granStyle(gran === key)}>{label}</button>
        ))}
        <div style={{ display: 'flex', gap: 14, marginLeft: 14 }}>
          <LegendDot color={COLORS.ember} label="New players" />
          <LegendDot color={COLORS.forest} label="New signups" />
        </div>
        <button
          onClick={exportCsv}
          title="Download the currently shown buckets (period, new players, new signups) as CSV"
          style={{ marginLeft: 'auto', padding: '7px 12px', background: COLORS.ink, border: `1px solid ${COLORS.ink}`, color: COLORS.cream, fontFamily: 'DM Mono, monospace', fontSize: 10, letterSpacing: '0.08em', textTransform: 'uppercase', fontWeight: 600, cursor: 'pointer' }}
        >
          &darr; Users CSV
        </button>
      </div>

      <div style={{ background: COLORS.paper, border: `1px solid ${COLORS.line}`, borderRadius: 8, padding: '18px 16px 10px' }}>
        <div style={{ display: 'flex', alignItems: 'flex-end', gap: buckets.length > 60 ? 2 : 4, height: 190 }}>
          {buckets.map((b) => {
            const ph = maxVal ? Math.max(b.players > 0 ? 2 : 0, Math.round((b.players / maxVal) * 178)) : 0;
            const sh = maxVal ? Math.max(b.signups > 0 ? 2 : 0, Math.round((b.signups / maxVal) * 178)) : 0;
            return (
              <div
                key={b.key}
                title={`${b.full}\n${b.players.toLocaleString()} new player${b.players === 1 ? '' : 's'} · ${b.signups.toLocaleString()} new signup${b.signups === 1 ? '' : 's'}`}
                style={{ flex: '1 1 0', minWidth: 2, height: '100%', display: 'flex', alignItems: 'flex-end', justifyContent: 'center', gap: 1 }}
              >
                <div style={{ flex: '1 1 0', minWidth: 1, height: ph, background: COLORS.ember, opacity: 0.85, borderRadius: '3px 3px 0 0' }} />
                <div style={{ flex: '1 1 0', minWidth: 1, height: sh, background: COLORS.forest, opacity: 0.85, borderRadius: '3px 3px 0 0' }} />
              </div>
            );
          })}
        </div>
        <div style={{ display: 'flex', gap: buckets.length > 60 ? 2 : 4, marginTop: 8, borderTop: `1px solid ${COLORS.line}`, paddingTop: 8 }}>
          {buckets.map((b, i) => (
            <div key={b.key} style={{ flex: '1 1 0', minWidth: 2, textAlign: 'center', overflow: 'visible' }}>
              {i % labelStep === 0 ? (
                <span style={{ fontFamily: 'DM Mono, monospace', fontSize: 9, color: COLORS.faded, whiteSpace: 'nowrap' }}>{b.label}</span>
              ) : null}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ---- Daily Games tab ----------------------------------------------------------
// One tile per daily game (20 of them), not a day-by-day list. Each tile carries
// the game's all-time averages (plays per active day, time per play) plus its
// unique-player and total-play counts, and the same figures for TODAY's puzzle.
// Server (buildDailyByGame) does the aggregation; this only renders.
// Note: a player who plays several games counts once in each game's unique
// figure, so the per-game uniques sum to more than the site total.
function dgDur(seconds) {
  return seconds == null ? '—' : tbdDur(seconds);
}
function dgNum(n) {
  return n == null ? '—' : Number(n).toLocaleString(undefined, { maximumFractionDigits: 1 });
}
function dgDayLabel(day) {
  // 'YYYY-MM-DD' -> e.g. "Mon, Jul 6, 2026" (UTC noon parse, DST-safe).
  const d = tbdParseDay(day);
  const wd = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][d.getUTCDay()];
  return `${wd}, ${TBD_MONTHS[d.getUTCMonth()]} ${d.getUTCDate()}, ${d.getUTCFullYear()}`;
}
// One metric line inside a tile: label on the left, value right-aligned.
function DgStat({ label, value, accent, dim }) {
  return (
    <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 10 }}>
      <span style={{ fontFamily: 'DM Mono, monospace', fontSize: 10, letterSpacing: '0.06em', textTransform: 'uppercase', color: COLORS.faded }}>{label}</span>
      <span style={{ fontFamily: 'DM Mono, monospace', fontSize: dim ? 13 : 16, fontWeight: 700, color: accent || COLORS.ink, fontVariantNumeric: 'tabular-nums' }}>{value}</span>
    </div>
  );
}
function DailyGameTile({ g }) {
  const quiet = !g.plays;
  return (
    <div style={{ background: COLORS.paper, border: `1px solid ${COLORS.line}`, borderRadius: 8, padding: '14px 16px 12px', opacity: quiet ? 0.55 : 1 }}>
      <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 8, borderBottom: `1px solid ${COLORS.line}`, paddingBottom: 9, marginBottom: 10 }}>
        <span style={{ fontFamily: 'Fraunces, serif', fontSize: 17, fontWeight: 600, color: COLORS.ink }}>{g.title}</span>
        <span style={{ fontFamily: 'DM Mono, monospace', fontSize: 10, color: COLORS.faded }}>{g.daysActive.toLocaleString()} {g.daysActive === 1 ? 'day' : 'days'}</span>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
        <DgStat label="Avg plays / day" value={dgNum(g.avgPlays)} accent={COLORS.ember} />
        <DgStat label="Avg time / play" value={dgDur(g.avgTime)} accent={COLORS.rust} />
        <DgStat label="Unique players" value={g.players.toLocaleString()} dim />
        <DgStat label="Total plays" value={g.plays.toLocaleString()} dim />
      </div>

      <div style={{ marginTop: 11, paddingTop: 9, borderTop: `1px dashed ${COLORS.line}`, display: 'flex', flexDirection: 'column', gap: 6 }}>
        <div style={{ fontFamily: 'DM Mono, monospace', fontSize: 9, letterSpacing: '0.12em', textTransform: 'uppercase', color: COLORS.ember, fontWeight: 700 }}>Today</div>
        <DgStat label="Plays" value={g.today.plays.toLocaleString()} dim />
        <DgStat label="Players" value={g.today.players.toLocaleString()} dim />
        <DgStat label="Avg time / play" value={dgDur(g.today.avgTime)} dim />
      </div>
    </div>
  );
}
// ---- Analytics -> Quiz Plays: today's ten most engaged players --------------
// Ranked by ENGAGED TIME: the seconds a player spent finishing games today
// (Eastern), summed with each individual play capped by the server at
// data.capSeconds, so one tab left idle on a solved puzzle cannot buy the top
// spot. Where a player's uncapped total differs, it is shown in muted text
// next to the capped figure rather than hidden.
function TopPlayersTodayPanel({ data }) {
  const players = (data && data.players) || [];
  const totals = (data && data.totals) || {};
  const capMin = Math.round(((data && data.capSeconds) || 1200) / 60);
  const top = players.length ? players[0].seconds : 0;

  const exportCsv = () => {
    const head = ['Rank', 'Player', 'Type', 'Email', 'Engaged seconds (capped)', 'Engaged time', 'Raw seconds', 'Plays', 'Games', 'Plays over cap', 'Longest game', 'First play', 'Last play', 'Device', 'Location'];
    const rows = players.map((r, i) => [
      i + 1, r.name, r.type, r.email || '', r.seconds, tbdDur(r.seconds), r.rawSeconds, r.plays, r.games, r.capped,
      r.topGame ? r.topGame.title : '', r.firstAt || '', r.lastAt || '', r.device || '', r.geo || '',
    ]);
    downloadCsvFile('sot-top-players-today', head, rows);
  };

  return (
    <div>
      <SectionHeading>Today&apos;s top players</SectionHeading>
      <p style={{ fontFamily: 'DM Mono, monospace', fontSize: 11, color: COLORS.faded, margin: '0 0 18px', lineHeight: 1.6 }}>
        The ten players who spent the most time finishing games today, registered and anonymous alike.
        {data && data.day ? <span> Today is <span style={{ color: COLORS.ink }}>{dgDayLabel(data.day)}</span> (Eastern).</span> : null}
        {' '}Each individual game counts for at most {capMin} minutes, so a tab left idle on a solved puzzle cannot top the board. Where the uncapped total differs it is shown in grey.
      </p>

      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 16 }}>
        <TimeByDayStat value={tbdHoursValue(totals.secondsToday || 0).value} unit={tbdHoursValue(totals.secondsToday || 0).unit} label="Engaged time today" accent={COLORS.ember} />
        <TimeByDayStat value={(totals.playersToday || 0).toLocaleString()} unit="players" label="Players today" accent={COLORS.forest} />
        <TimeByDayStat value={(totals.playsToday || 0).toLocaleString()} unit="games" label="Games finished today" accent={COLORS.ink} />
        <TimeByDayStat value={tbdDur(totals.avgSecondsPerPlayer || 0)} unit="each" label="Avg per player today" accent={COLORS.rust} />
      </div>

      {players.length ? (
        <>
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 12 }}>
            <button
              onClick={exportCsv}
              title="Download today's top ten with engaged time, plays, games, and the longest single game"
              style={{ padding: '7px 12px', background: COLORS.ink, border: `1px solid ${COLORS.ink}`, color: COLORS.cream, fontFamily: 'DM Mono, monospace', fontSize: 10, letterSpacing: '0.08em', textTransform: 'uppercase', fontWeight: 600, cursor: 'pointer' }}
            >
              &#8595; Today CSV
            </button>
          </div>

          <div style={{ background: COLORS.paper, border: `1px solid ${COLORS.line}`, borderRadius: 8, padding: '6px 16px 10px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, fontFamily: 'DM Mono, monospace', fontSize: 10, letterSpacing: '0.12em', textTransform: 'uppercase', color: COLORS.faded, padding: '7px 0', borderBottom: `1px solid ${COLORS.line}` }}>
              <span style={{ flex: '0 0 22px', textAlign: 'right' }}>#</span>
              <span style={{ flex: '0 0 168px' }}>Player</span>
              <span style={{ flex: 1, minWidth: 80 }}>Engaged time</span>
              <span style={{ flex: '0 0 92px', textAlign: 'right' }}>Time</span>
              <span style={{ flex: '0 0 44px', textAlign: 'right' }}>Games</span>
              <span style={{ flex: '0 0 44px', textAlign: 'right' }}>Titles</span>
              <span style={{ flex: '0 0 150px' }}>Longest game</span>
              <span style={{ flex: '0 0 66px', textAlign: 'right' }}>Last</span>
            </div>

            {players.map((r, i) => {
              const w = top ? Math.max(1.5, (r.seconds / top) * 100) : 0;
              const reg = r.type === 'Registered';
              const rawGap = r.rawSeconds > r.seconds + 30;
              return (
                <div
                  key={r.key}
                  title={`${r.name}${r.email ? ` (${r.email})` : ''}\n${tbdDur(r.seconds)} engaged across ${r.plays} game${r.plays === 1 ? '' : 's'} in ${r.games} title${r.games === 1 ? '' : 's'}${r.capped ? `\n${r.capped} game${r.capped === 1 ? '' : 's'} ran past the ${capMin}-minute cap (raw total ${tbdDur(r.rawSeconds)})` : ''}${r.device || r.geo ? `\n${[r.device, r.geo].filter(Boolean).join(' \u00b7 ')}` : ''}`}
                  style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '6px 0', borderBottom: i < players.length - 1 ? `1px solid ${COLORS.ink}12` : 'none' }}
                >
                  <span style={{ flex: '0 0 22px', textAlign: 'right', fontFamily: 'DM Mono, monospace', fontSize: 11, fontWeight: 700, color: i < 3 ? COLORS.ember : COLORS.faded }}>{i + 1}</span>

                  <span style={{ flex: '0 0 168px', minWidth: 0, display: 'flex', flexDirection: 'column', gap: 1 }}>
                    <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontFamily: 'Manrope, system-ui, -apple-system, sans-serif', fontSize: 12, fontWeight: 700, color: COLORS.ink }}>{r.name}</span>
                    <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontFamily: 'DM Mono, monospace', fontSize: 9, letterSpacing: '0.06em', color: reg ? COLORS.ember : COLORS.faded }}>
                      {reg ? 'Registered' : 'Anon'}{r.geo ? <span style={{ color: COLORS.faded, textTransform: 'none', letterSpacing: 0 }}>{' \u00b7 '}{r.geo}</span> : null}
                    </span>
                  </span>

                  <span style={{ flex: 1, minWidth: 80, height: 10, background: `${COLORS.ink}0d`, borderRadius: 2, overflow: 'hidden' }}>
                    <span style={{ display: 'block', width: `${w}%`, height: '100%', background: COLORS.ember, borderRadius: 2 }} />
                  </span>

                  <span style={{ flex: '0 0 92px', textAlign: 'right', fontFamily: 'DM Mono, monospace', fontSize: 11, fontWeight: 700, color: COLORS.ember, fontVariantNumeric: 'tabular-nums' }}>
                    {tbdDur(r.seconds)}
                    {rawGap ? <span style={{ color: COLORS.faded, fontWeight: 400, fontSize: 9 }}>{' '}({tbdDur(r.rawSeconds)})</span> : null}
                  </span>
                  <span style={{ flex: '0 0 44px', textAlign: 'right', fontFamily: 'DM Mono, monospace', fontSize: 11, color: COLORS.ink, fontVariantNumeric: 'tabular-nums' }}>{r.plays}</span>
                  <span style={{ flex: '0 0 44px', textAlign: 'right', fontFamily: 'DM Mono, monospace', fontSize: 11, color: COLORS.faded, fontVariantNumeric: 'tabular-nums' }}>{r.games}</span>
                  <span style={{ flex: '0 0 150px', minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontFamily: 'Manrope, system-ui, -apple-system, sans-serif', fontSize: 10, color: COLORS.faded }}>
                    {r.topGame ? (
                      <Link href={`/quiz/${encodeURIComponent(r.topGame.quizId)}`} target="_blank" style={{ color: COLORS.faded, textDecoration: 'none' }}>{r.topGame.title}</Link>
                    ) : '\u2014'}
                  </span>
                  <span style={{ flex: '0 0 66px', textAlign: 'right', fontFamily: 'DM Mono, monospace', fontSize: 10, color: COLORS.faded }}>{fmtEtClock(r.lastAt)}</span>
                </div>
              );
            })}
          </div>
        </>
      ) : (
        <p style={{ fontFamily: 'DM Mono, monospace', fontSize: 12, color: COLORS.faded, fontStyle: 'italic' }}>No games finished yet today.</p>
      )}
    </div>
  );
}

// ---- Analytics -> Quiz Plays: every daily game on one ranked chart ----------
// Total plays, unique players, and time per play for each daily game, drawn as
// ranked horizontal bars so the whole slate can be compared at a glance. Plays
// and players share one scale (players is always a subset of plays, so the gap
// between the two bars reads as repeat play); time per play has its own scale
// in the right-hand column. Data is the same buildDailyByGame() payload the
// Daily Games tab uses, so nothing new is queried.
//
// LIFETIME TOTALS ARE NOT COMPARABLE ACROSS GAMES. The slate was built up over
// months, so an older game has simply had more days to bank plays (Crux shipped
// first and tops every lifetime chart for that reason alone). The basis toggle
// fixes this: "Per day live" divides plays and players by daysLive, the span
// from a game's first puzzle to today, so a game launched last week is judged
// at the same rate as one that launched in June. Per day live is the DEFAULT
// because it is the honest comparison; Total is there when you want raw volume.
// Days live is shown as its own column so the divisor is never hidden.
function GamesRankedPanel({ data }) {
  const all = (data && data.games) || [];
  const totals = (data && data.totals) || {};
  const [metric, setMetric] = useState('plays');
  const [basis, setBasis] = useState('rate');
  const [showQuiet, setShowQuiet] = useState(false);
  const rate = basis === 'rate';

  // The value each bar and number shows, under the current basis.
  const playsOf = (g) => (rate ? (g.daysLive ? (g.plays || 0) / g.daysLive : 0) : g.plays || 0);
  const playersOf = (g) => (rate ? (g.daysLive ? (g.players || 0) / g.daysLive : 0) : g.players || 0);
  const fmtVal = (v) => (rate ? v.toFixed(1) : Math.round(v).toLocaleString());

  const games = useMemo(() => {
    const live = showQuiet ? all : all.filter((g) => g.plays > 0);
    const by = {
      plays: playsOf,
      players: playersOf,
      time: (g) => (g.avgTime == null ? -1 : g.avgTime),
    }[metric];
    return [...live].sort((a, b) => by(b) - by(a) || (a.title || '').localeCompare(b.title || ''));
  }, [all, metric, showQuiet, basis]);

  const quietCount = all.length - all.filter((g) => g.plays > 0).length;
  const maxPlays = games.reduce((m, g) => Math.max(m, playsOf(g)), 0);
  const maxTime = games.reduce((m, g) => Math.max(m, g.avgTime || 0), 0);

  const pillStyle = (on) => ({
    padding: '6px 12px',
    background: on ? `${COLORS.ember}1a` : 'transparent',
    border: `1px solid ${on ? COLORS.ember : COLORS.line}`,
    color: on ? COLORS.ember : COLORS.faded,
    fontFamily: 'DM Mono, monospace',
    fontSize: 10,
    letterSpacing: '0.08em',
    textTransform: 'uppercase',
    fontWeight: 600,
    cursor: 'pointer',
  });

  const exportCsv = () => {
    const head = ['Game', 'First puzzle', 'Days live', 'Days active', 'Total plays', 'Unique players', 'Plays per day live', 'Players per day live', 'Plays per player', 'Avg seconds/play', 'Avg time/play'];
    const rows = games.map((g) => [
      g.title, g.firstDay || '', g.daysLive || 0, g.daysActive, g.plays, g.players,
      g.daysLive ? (g.plays / g.daysLive).toFixed(2) : '',
      g.daysLive ? (g.players / g.daysLive).toFixed(2) : '',
      g.players ? (g.plays / g.players).toFixed(2) : '',
      g.avgTime == null ? '' : g.avgTime, dgDur(g.avgTime),
    ]);
    downloadCsvFile('sot-games-plays-players-time', head, rows);
  };

  if (!all.length) {
    return (
      <div>
        <SectionHeading>Games at a glance</SectionHeading>
        <p style={{ fontFamily: 'DM Mono, monospace', fontSize: 12, color: COLORS.faded, fontStyle: 'italic' }}>No daily-game plays recorded yet.</p>
      </div>
    );
  }

  const LegendKey = ({ color, label }) => (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
      <span style={{ width: 14, height: 8, borderRadius: 2, background: color, display: 'inline-block' }} />
      <span style={{ fontFamily: 'DM Mono, monospace', fontSize: 10, color: COLORS.faded, letterSpacing: '0.06em', textTransform: 'uppercase' }}>{label}</span>
    </span>
  );

  return (
    <div>
      <SectionHeading>Games at a glance</SectionHeading>
      <p style={{ fontFamily: 'DM Mono, monospace', fontSize: 11, color: COLORS.faded, margin: '0 0 18px', lineHeight: 1.6 }}>
        All {all.length} daily games ranked together: plays, unique players, and average time per play.
        Plays and players share a scale, so the gap between the two bars is repeat play. Registered and anonymous plays both count.
        {rate
          ? ' Shown per day live: each game\u2019s plays and players divided by the days since its first puzzle, so an older game is not credited for simply having existed longer.'
          : ' Shown as lifetime totals, which favour the games that launched earliest. Switch to per day live to compare them fairly.'}
      </p>

      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 16 }}>
        <TimeByDayStat value={(totals.totalPlays || 0).toLocaleString()} unit="plays" label="Total plays (all games)" accent={COLORS.ember} />
        <TimeByDayStat value={(totals.totalPlayers || 0).toLocaleString()} unit="players" label="Unique players (all-time)" accent={COLORS.forest} />
        <TimeByDayStat value={dgDur(totals.avgTime)} unit="per play" label="Avg time / play" accent={COLORS.rust} />
        <TimeByDayStat value={games.length.toLocaleString()} unit={`of ${all.length}`} label="Games with plays" accent={COLORS.ink} />
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap', marginBottom: 14 }}>
        <span style={{ fontFamily: 'DM Mono, monospace', fontSize: 10, letterSpacing: '0.1em', textTransform: 'uppercase', color: COLORS.faded, marginRight: 2 }}>Show</span>
        {[['rate', 'Per day live'], ['total', 'Lifetime total']].map(([key, label]) => (
          <button
            key={key}
            onClick={() => setBasis(key)}
            title={key === 'rate'
              ? 'Divide plays and players by the days since each game\u2019s first puzzle, so games of different ages compare fairly'
              : 'Raw lifetime counts, which favour whichever games launched earliest'}
            style={pillStyle(basis === key)}
          >
            {label}
          </button>
        ))}
        <span style={{ fontFamily: 'DM Mono, monospace', fontSize: 10, letterSpacing: '0.1em', textTransform: 'uppercase', color: COLORS.faded, margin: '0 2px 0 10px' }}>Rank by</span>
        {[['plays', 'Plays'], ['players', 'Players'], ['time', 'Time / play']].map(([key, label]) => (
          <button key={key} onClick={() => setMetric(key)} style={pillStyle(metric === key)}>{label}</button>
        ))}
        {quietCount ? (
          <button onClick={() => setShowQuiet((v) => !v)} style={{ ...pillStyle(showQuiet), marginLeft: 8 }}>
            {showQuiet ? 'Hide' : 'Show'} {quietCount} unplayed
          </button>
        ) : null}
        <button
          onClick={exportCsv}
          title="Download plays, players, plays per player, and time per play for every game shown"
          style={{ marginLeft: 'auto', padding: '7px 12px', background: COLORS.ink, border: `1px solid ${COLORS.ink}`, color: COLORS.cream, fontFamily: 'DM Mono, monospace', fontSize: 10, letterSpacing: '0.08em', textTransform: 'uppercase', fontWeight: 600, cursor: 'pointer' }}
        >
          &#8595; By-game CSV
        </button>
      </div>

      <div style={{ background: COLORS.paper, border: `1px solid ${COLORS.line}`, borderRadius: 8, padding: '14px 16px 10px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 18, paddingBottom: 10, marginBottom: 8, borderBottom: `1px solid ${COLORS.line}` }}>
          <LegendKey color={COLORS.ember} label={rate ? 'Plays / day live' : 'Total plays'} />
          <LegendKey color={COLORS.forest} label={rate ? 'Players / day live' : 'Unique players'} />
          <LegendKey color={COLORS.rust} label="Avg time / play" />
          <span style={{ marginLeft: 'auto', fontFamily: 'DM Mono, monospace', fontSize: 10, color: COLORS.faded }}>
            {rate ? 'Rates are per day since each game\u2019s first puzzle' : 'Raw lifetime counts \u00b7 older games are flattered'}
          </span>
        </div>

        {games.map((g, i) => {
          const pv = playsOf(g);
          const uv = playersOf(g);
          const playW = maxPlays ? Math.max(pv > 0 ? 1.5 : 0, (pv / maxPlays) * 100) : 0;
          const playerW = maxPlays ? Math.max(uv > 0 ? 1.5 : 0, (uv / maxPlays) * 100) : 0;
          const timeW = maxTime && g.avgTime ? Math.max(2, (g.avgTime / maxTime) * 100) : 0;
          const perPlayer = g.players ? g.plays / g.players : 0;
          return (
            <div
              key={g.key}
              title={`${g.title}\nLifetime: ${g.plays.toLocaleString()} play${g.plays === 1 ? '' : 's'} \u00b7 ${g.players.toLocaleString()} player${g.players === 1 ? '' : 's'}${perPlayer ? ` (${perPlayer.toFixed(1)} plays each)` : ''}\nPer day live: ${g.daysLive ? (g.plays / g.daysLive).toFixed(1) : '0'} plays \u00b7 ${g.daysLive ? (g.players / g.daysLive).toFixed(1) : '0'} players\nLive ${g.daysLive.toLocaleString()} day${g.daysLive === 1 ? '' : 's'} since ${g.firstDay || 'launch'} \u00b7 ${g.daysActive.toLocaleString()} with plays\nAvg ${dgDur(g.avgTime)} per play`}
              style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '5px 0', borderBottom: i < games.length - 1 ? `1px solid ${COLORS.ink}12` : 'none', opacity: g.plays ? 1 : 0.45 }}
            >
              <span style={{ flex: '0 0 22px', fontFamily: 'DM Mono, monospace', fontSize: 10, color: COLORS.faded, textAlign: 'right' }}>{i + 1}</span>
              <span style={{ flex: '0 0 132px', minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontFamily: 'Manrope, system-ui, -apple-system, sans-serif', fontSize: 12, fontWeight: 700, color: COLORS.ink }}>{g.title}</span>
              <span style={{ flex: '0 0 42px', textAlign: 'right', fontFamily: 'DM Mono, monospace', fontSize: 10, color: COLORS.faded, fontVariantNumeric: 'tabular-nums' }}>{g.daysLive ? `${g.daysLive}d` : '\u2014'}</span>

              <span style={{ flex: 1, minWidth: 90, display: 'flex', flexDirection: 'column', gap: 3 }}>
                <span style={{ display: 'block', height: 9, background: `${COLORS.ink}0d`, borderRadius: 2, overflow: 'hidden' }}>
                  <span style={{ display: 'block', width: `${playW}%`, height: '100%', background: COLORS.ember, borderRadius: 2 }} />
                </span>
                <span style={{ display: 'block', height: 9, background: `${COLORS.ink}0d`, borderRadius: 2, overflow: 'hidden' }}>
                  <span style={{ display: 'block', width: `${playerW}%`, height: '100%', background: COLORS.forest, borderRadius: 2 }} />
                </span>
              </span>

              <span style={{ flex: '0 0 60px', textAlign: 'right', fontFamily: 'DM Mono, monospace', fontSize: 11, fontWeight: 700, color: g.plays ? COLORS.ember : COLORS.faded, fontVariantNumeric: 'tabular-nums' }}>{fmtVal(pv)}</span>
              <span style={{ flex: '0 0 52px', textAlign: 'right', fontFamily: 'DM Mono, monospace', fontSize: 11, color: g.players ? COLORS.forest : COLORS.faded, fontVariantNumeric: 'tabular-nums' }}>{fmtVal(uv)}</span>
              <span style={{ flex: '0 0 46px', textAlign: 'right', fontFamily: 'DM Mono, monospace', fontSize: 10, color: COLORS.faded, fontVariantNumeric: 'tabular-nums' }}>{perPlayer ? `${perPlayer.toFixed(1)}\u00d7` : '\u2014'}</span>

              <span style={{ flex: '0 0 108px', display: 'flex', alignItems: 'center', gap: 7 }}>
                <span style={{ flex: 1, height: 6, background: `${COLORS.ink}0d`, borderRadius: 2, overflow: 'hidden' }}>
                  <span style={{ display: 'block', width: `${timeW}%`, height: '100%', background: COLORS.rust, borderRadius: 2 }} />
                </span>
                <span style={{ flex: '0 0 46px', textAlign: 'right', fontFamily: 'DM Mono, monospace', fontSize: 10, color: g.avgTime ? COLORS.rust : COLORS.faded, fontVariantNumeric: 'tabular-nums' }}>{dgDur(g.avgTime)}</span>
              </span>
            </div>
          );
        })}
      </div>
      <p style={{ fontFamily: 'DM Mono, monospace', fontSize: 10, color: COLORS.faded, margin: '10px 0 0', lineHeight: 1.6 }}>
        Columns: days live, then {rate ? 'plays per day live, players per day live' : 'total plays, unique players'}, then plays per player (lifetime, so it does not move with the basis). A player who plays several games counts once in each game, so the per-game player counts sum to more than the site total.
      </p>
    </div>
  );
}

// GROUPS (owner, 2026-09-17): every group, its owner and size, and the newest
// joins. Fetched when the tab opens, from /api/admin/groups (admin cookie).
function GroupsPanel() {
  const [data, setData] = useState(null);
  const [q, setQ] = useState('');
  useEffect(() => {
    let dead = false;
    fetch('/api/admin/groups', { cache: 'no-store' })
      .then((r) => r.json())
      .then((d) => { if (!dead) setData(d); })
      .catch(() => { if (!dead) setData({ error: 'Could not load groups.' }); });
    return () => { dead = true; };
  }, []);
  const mono = { fontFamily: 'DM Mono, monospace', fontSize: 11, color: COLORS.faded };
  const when = (iso) => (iso ? new Date(iso).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' }) : '—');
  if (!data) return <div><SectionHeading>Groups</SectionHeading><p style={mono}>Loading…</p></div>;
  if (data.available === false) return <div><SectionHeading>Groups</SectionHeading><p style={mono}>The groups tables are not in the database yet (migration 56).</p></div>;
  if (data.error) return <div><SectionHeading>Groups</SectionHeading><p style={{ ...mono, color: COLORS.rust }}>{data.error}</p></div>;
  const t = data.totals || {};
  const needle = q.trim().toLowerCase();
  const groups = (data.groups || []).filter((g) => !needle
    || String(g.name).toLowerCase().includes(needle)
    || String(g.code).toLowerCase().includes(needle)
    || String(g.owner || '').toLowerCase().includes(needle));
  const th = { textAlign: 'left', padding: '6px 8px', ...mono, fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.08em', borderBottom: `1px solid ${COLORS.line}` };
  const td = { padding: '7px 8px', fontSize: 13, borderBottom: '1px solid rgba(20,22,28,0.08)', color: COLORS.ink };
  const exportCsv = () => downloadCsvFile('mindloft-groups', ['Code', 'Name', 'Owner', 'Members', 'Listing', 'Created', 'Last join'],
    (data.groups || []).map((g) => [g.code, g.name, g.owner || '', g.members, g.visibility === 'public' ? 'Public' : 'Invite', g.createdAt, g.lastJoin || '']));
  return (
    <div>
      <SectionHeading>Groups</SectionHeading>
      <p style={{ ...mono, margin: '0 0 18px', lineHeight: 1.6 }}>
        Every group players have made, newest first, and the latest joins. Joins below exclude the owner joining their own group.
      </p>
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 18 }}>
        <TimeByDayStat value={(t.groups || 0).toLocaleString()} unit="groups" label="Groups (all time)" accent={COLORS.ink} />
        <TimeByDayStat value={(t.players || 0).toLocaleString()} unit="players" label="Players in a group" accent={COLORS.ink} />
        <TimeByDayStat value={t.avgSize || 0} unit="members" label="Average group size" accent={COLORS.ink} />
        <TimeByDayStat value={(t.groups24h || 0).toLocaleString()} unit="new" label="Groups made, 24h" accent={COLORS.ember} />
        <TimeByDayStat value={(t.joins24h || 0).toLocaleString()} unit="joins" label="Joins, 24h" accent={COLORS.ember} />
        <TimeByDayStat value={(t.groups7d || 0).toLocaleString()} unit="new" label="Groups made, 7d" accent={COLORS.rust} />
        <TimeByDayStat value={(t.joins7d || 0).toLocaleString()} unit="joins" label="Joins, 7d" accent={COLORS.rust} />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(420px, 1fr))', gap: 24, alignItems: 'start' }}>
        <div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 8, flexWrap: 'wrap' }}>
            <strong style={{ fontSize: 14 }}>All groups</strong>
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search name, code, owner"
              style={{ marginLeft: 'auto', padding: '6px 10px', border: `1px solid ${COLORS.line}`, fontSize: 12, minWidth: 180 }} />
            <button onClick={exportCsv} style={{ padding: '6px 10px', background: COLORS.ink, border: `1px solid ${COLORS.ink}`, color: COLORS.cream, fontFamily: 'DM Mono, monospace', fontSize: 10, textTransform: 'uppercase', cursor: 'pointer' }}>↓ CSV</button>
          </div>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead><tr><th style={th}>Group</th><th style={th}>Owner</th><th style={{ ...th, textAlign: 'right' }}>Members</th><th style={th}>Listing</th><th style={th}>Created</th><th style={th}>Last join</th></tr></thead>
              <tbody>
                {groups.map((g) => (
                  <tr key={g.code}>
                    <td style={td}><a href={`/groups/${g.code}`} target="_blank" rel="noreferrer" style={{ color: COLORS.ember, fontWeight: 700 }}>{g.name}</a> <span style={mono}>{g.code}</span></td>
                    <td style={td}>{g.owner || '—'}</td>
                    <td style={{ ...td, textAlign: 'right' }}>{g.members}</td>
                    <td style={{ ...td, ...mono }}>{g.visibility === 'public' ? 'Public' : 'Invite'}</td>
                    <td style={{ ...td, ...mono }}>{when(g.createdAt)}</td>
                    <td style={{ ...td, ...mono }}>{when(g.lastJoin)}</td>
                  </tr>
                ))}
                {!groups.length ? <tr><td style={td} colSpan={6}>No groups yet.</td></tr> : null}
              </tbody>
            </table>
          </div>
        </div>
        <div>
          <strong style={{ fontSize: 14, display: 'block', marginBottom: 8 }}>Recent activity</strong>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <tbody>
              {(data.recentJoins || []).map((j, i) => (
                <tr key={i}>
                  <td style={{ ...td, ...mono, whiteSpace: 'nowrap' }}>{when(j.at)}</td>
                  <td style={td}>
                    <b>{j.username}</b>{j.nameOnly ? <span style={mono}> (name only)</span> : null}
                    {j.role === 'owner' ? ' started ' : ' joined '}
                    {j.code ? <a href={`/groups/${j.code}`} target="_blank" rel="noreferrer" style={{ color: COLORS.ember }}>{j.group}</a> : j.group}
                  </td>
                </tr>
              ))}
              {!(data.recentJoins || []).length ? <tr><td style={td}>Nothing yet.</td></tr> : null}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function DailyGamesPanel({ data }) {
  const games = (data && data.games) || [];
  const totals = (data && data.totals) || {};

  const exportGamesCsv = () => {
    const head = ['Game', 'Days active', 'Avg plays/day', 'Avg seconds/play', 'Avg time/play', 'Unique players', 'Total plays', 'Today plays', 'Today players', 'Today avg seconds/play', 'Today avg time/play'];
    const rows = games.map((g) => [
      g.title, g.daysActive, g.avgPlays == null ? '' : g.avgPlays, g.avgTime == null ? '' : g.avgTime, dgDur(g.avgTime),
      g.players, g.plays, g.today.plays, g.today.players, g.today.avgTime == null ? '' : g.today.avgTime, dgDur(g.today.avgTime),
    ]);
    downloadCsvFile('sot-daily-games-by-game', head, rows);
  };

  return (
    <div>
      <SectionHeading>Daily games</SectionHeading>
      <p style={{ fontFamily: 'DM Mono, monospace', fontSize: 11, color: COLORS.faded, margin: '0 0 18px', lineHeight: 1.6 }}>
        Every completed play of the {games.length} daily games (registered and anonymous), one tile per game, most-played first. Averages are per active puzzle day across all time.
        {totals.today ? <span> Today is <span style={{ color: COLORS.ink }}>{dgDayLabel(totals.today)}</span>.</span> : null}
      </p>

      {games.length ? (
        <>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 14 }}>
            <TimeByDayStat value={dgNum(totals.avgPlays)} unit="per day" label="Avg plays / day (all games)" accent={COLORS.ember} />
            <TimeByDayStat value={dgDur(totals.avgTime)} unit="per play" label="Avg time / play" accent={COLORS.rust} />
            <TimeByDayStat value={(totals.totalPlayers || 0).toLocaleString()} unit="players" label="Unique players (all-time)" accent={COLORS.ink} />
            <TimeByDayStat value={(totals.totalPlays || 0).toLocaleString()} unit="plays" label="Total plays" accent={COLORS.ink} />
            <TimeByDayStat value={(totals.todayPlays || 0).toLocaleString()} unit="plays" label="Today: plays" accent={COLORS.ember} />
            <TimeByDayStat value={(totals.todayPlayers || 0).toLocaleString()} unit="players" label="Today: players" accent={COLORS.ember} />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 14 }}>
            <button onClick={exportGamesCsv} style={{ padding: '7px 12px', background: COLORS.ink, border: `1px solid ${COLORS.ink}`, color: COLORS.cream, fontFamily: 'DM Mono, monospace', fontSize: 10, letterSpacing: '0.08em', textTransform: 'uppercase', fontWeight: 600, cursor: 'pointer' }}>↓ By-game CSV</button>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(230px, 1fr))', gap: 12 }}>
            {games.map((g) => <DailyGameTile key={g.key} g={g} />)}
          </div>
        </>
      ) : (
        <p style={{ fontFamily: 'DM Mono, monospace', fontSize: 12, color: COLORS.faded, fontStyle: 'italic' }}>No daily-game plays recorded yet.</p>
      )}
    </div>
  );
}

// Research tab: the consensus-alert research queue plus editor notes, stacked.
function ResearchNotesPanel({ alerts, busy, onResolve, notes, lists, onAddNote, onDeleteNote }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 36 }}>
      <div>
        <SectionHeading>Consensus Alerts</SectionHeading>
        <ResearchPanel alerts={alerts} busy={busy} onResolve={onResolve} />
      </div>
      <div>
        <SectionHeading>Editor Notes</SectionHeading>
        <NotesPanel notes={notes} lists={lists} busy={busy} onAdd={onAddNote} onDelete={onDeleteNote} />
      </div>
    </div>
  );
}

// Feedback tab: reader notices (complaints) and list comments, stacked.
function FeedbackPanel({ complaints, comments, busy, onDismiss, onDelete, onRespond }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 36 }}>
      <div>
        <SectionHeading>Notices</SectionHeading>
        <ComplaintsPanel complaints={complaints} busy={busy} onDismiss={onDismiss} onRespond={onRespond} />
      </div>
      <div>
        <SectionHeading>Comments</SectionHeading>
        <CommentsPanel comments={comments} busy={busy} onDelete={onDelete} onRespond={onRespond} />
      </div>
    </div>
  );
}

function TabButton({ active, onClick, children }) {
  return (
    <button
      onClick={onClick}
      style={{
        flex: 1,
        background: active ? COLORS.ink : 'transparent',
        color: active ? COLORS.cream : COLORS.ink,
        border: 'none',
        padding: '14px 12px',
        fontFamily: 'DM Mono, monospace',
        fontSize: 11,
        letterSpacing: '0.18em',
        textTransform: 'uppercase',
        fontWeight: 600,
        cursor: 'pointer',
      }}
    >
      {children}
    </button>
  );
}

function SubmissionCard({ list, busy, onApprove, onUnpublish, onReject }) {
  return (
    <div
      style={{
        background: COLORS.paper,
        border: `1px solid ${COLORS.line}`,
        padding: 20,
      }}
    >
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          gap: 12,
          marginBottom: 12,
          flexWrap: 'wrap',
        }}
      >
        <div style={{ flex: 1, minWidth: 240 }}>
          <div
            style={{
              fontFamily: 'DM Mono, monospace',
              fontSize: 10,
              letterSpacing: '0.2em',
              textTransform: 'uppercase',
              color: COLORS.faded,
              marginBottom: 6,
            }}
          >
            {list.category || 'Untagged'} · {list.type || 'other'} · {formatDate(list.submittedAt)}
          </div>
          <h3
            style={{
              fontFamily: 'Manrope, system-ui, -apple-system, sans-serif',
              fontWeight: 700,
              fontSize: 24,
              lineHeight: 1.1,
              margin: '0 0 8px',
              color: COLORS.ink,
              fontVariationSettings: '"SOFT" 100',
              letterSpacing: '-0.01em',
            }}
          >
            {list.title}
          </h3>
          <p
            style={{
              fontFamily: 'Manrope, system-ui, -apple-system, sans-serif',
              fontStyle: 'italic',
              fontSize: 15,
              color: COLORS.faded,
              margin: 0,
              lineHeight: 1.4,
            }}
          >
            {list.blurb}
          </p>
        </div>
        {list.published && (
          <Link
            href={`/list/${encodeURIComponent(list.id)}`}
            target="_blank"
            style={{
              fontFamily: 'DM Mono, monospace',
              fontSize: 10,
              letterSpacing: '0.18em',
              textTransform: 'uppercase',
              color: COLORS.ink,
              border: `1px solid ${COLORS.line}`,
              padding: '6px 10px',
              textDecoration: 'none',
            }}
          >
            View →
          </Link>
        )}
      </div>

      <details>
        <summary
          style={{
            cursor: 'pointer',
            fontFamily: 'DM Mono, monospace',
            fontSize: 10,
            letterSpacing: '0.18em',
            textTransform: 'uppercase',
            color: COLORS.faded,
            padding: '6px 0',
            userSelect: 'none',
          }}
        >
          Show {list.items.length} items
        </summary>
        <ol
          style={{
            margin: '10px 0 0 18px',
            padding: 0,
            fontFamily: 'Manrope, system-ui, -apple-system, sans-serif',
            fontSize: 16,
            color: COLORS.ink,
            lineHeight: 1.6,
          }}
        >
          {list.items.map((item, i) => (
            <li key={i}>{item}</li>
          ))}
        </ol>
      </details>

      <div
        style={{
          display: 'flex',
          gap: 8,
          marginTop: 16,
          paddingTop: 16,
          borderTop: `1px solid ${COLORS.line}`,
          flexWrap: 'wrap',
        }}
      >
        {!list.published ? (
          <button
            onClick={onApprove}
            disabled={busy}
            style={{
              background: COLORS.forest,
              color: COLORS.cream,
              border: `1px solid ${COLORS.line}`,
              padding: '10px 16px',
              fontFamily: 'DM Mono, monospace',
              fontSize: 10,
              letterSpacing: '0.18em',
              textTransform: 'uppercase',
              fontWeight: 600,
              cursor: busy ? 'wait' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              opacity: busy ? 0.5 : 1,
            }}
          >
            <Check size={12} strokeWidth={3} />
            Publish
          </button>
        ) : (
          <button
            onClick={onUnpublish}
            disabled={busy}
            style={{
              background: 'transparent',
              color: COLORS.ink,
              border: `1px solid ${COLORS.line}`,
              padding: '10px 16px',
              fontFamily: 'DM Mono, monospace',
              fontSize: 10,
              letterSpacing: '0.18em',
              textTransform: 'uppercase',
              fontWeight: 600,
              cursor: busy ? 'wait' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              opacity: busy ? 0.5 : 1,
            }}
          >
            <EyeOff size={12} strokeWidth={2.5} />
            Unpublish
          </button>
        )}
        <button
          onClick={onReject}
          disabled={busy}
          style={{
            background: 'transparent',
            color: COLORS.ember,
            border: `1.5px solid ${COLORS.ember}`,
            padding: '10px 16px',
            fontFamily: 'DM Mono, monospace',
            fontSize: 10,
            letterSpacing: '0.18em',
            textTransform: 'uppercase',
            fontWeight: 600,
            cursor: busy ? 'wait' : 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            opacity: busy ? 0.5 : 1,
          }}
        >
          <X size={12} strokeWidth={3} />
          Delete
        </button>
      </div>
    </div>
  );
}

// ============================================================================
// Extras panel — user-submitted items inside curated lists
// ============================================================================

function ExtrasPanel({ extras, busy, onRename, onDelete }) {
  const [query, setQuery] = useState('');

  const visibleGroups = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return extras;
    return extras
      .map((group) => {
        if (group.listId.toLowerCase().includes(q)) return group;
        const items = group.items.filter((i) => i.name.toLowerCase().includes(q));
        return items.length ? { ...group, items } : null;
      })
      .filter(Boolean);
  }, [extras, query]);

  if (extras.length === 0) {
    return (
      <div
        style={{
          padding: '60px 20px',
          textAlign: 'center',
          fontFamily: 'Manrope, system-ui, -apple-system, sans-serif',
          fontStyle: 'italic',
          fontSize: 18,
          color: COLORS.faded,
          border: `1px dashed ${COLORS.line}`,
        }}
      >
        No reader-submitted items yet.
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Filter by list id or item name…"
        style={{
          width: '100%',
          padding: '10px 12px',
          background: COLORS.paper,
          border: `1px solid ${COLORS.line}`,
          color: COLORS.ink,
          fontFamily: 'DM Mono, monospace',
          fontSize: 12,
          outline: 'none',
        }}
      />

      {visibleGroups.length === 0 ? (
        <div
          style={{
            padding: '40px 20px',
            textAlign: 'center',
            fontFamily: 'Manrope, system-ui, -apple-system, sans-serif',
            fontStyle: 'italic',
            fontSize: 16,
            color: COLORS.faded,
            border: `1px dashed ${COLORS.line}`,
          }}
        >
          No matches.
        </div>
      ) : (
        visibleGroups.map((group) => (
          <ExtrasGroup
            key={group.listId}
            group={group}
            busy={busy}
            onRename={onRename}
            onDelete={onDelete}
          />
        ))
      )}
    </div>
  );
}

function ExtrasGroup({ group, busy, onRename, onDelete }) {
  return (
    <div
      style={{
        background: COLORS.paper,
        border: `1px solid ${COLORS.line}`,
        padding: 20,
      }}
    >
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          gap: 12,
          marginBottom: 16,
          flexWrap: 'wrap',
        }}
      >
        <div>
          <div
            style={{
              fontFamily: 'DM Mono, monospace',
              fontSize: 10,
              letterSpacing: '0.2em',
              textTransform: 'uppercase',
              color: COLORS.faded,
              marginBottom: 4,
            }}
          >
            List
          </div>
          <h3
            style={{
              fontFamily: 'Manrope, system-ui, -apple-system, sans-serif',
              fontWeight: 700,
              fontSize: 22,
              lineHeight: 1.1,
              margin: 0,
              color: COLORS.ink,
              letterSpacing: '-0.01em',
            }}
          >
            {group.listId}
          </h3>
        </div>
        <Link
          href={`/list/${encodeURIComponent(group.listId)}`}
          target="_blank"
          style={{
            fontFamily: 'DM Mono, monospace',
            fontSize: 10,
            letterSpacing: '0.18em',
            textTransform: 'uppercase',
            color: COLORS.ink,
            border: `1px solid ${COLORS.line}`,
            padding: '6px 10px',
            textDecoration: 'none',
          }}
        >
          View →
        </Link>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {group.items.map((item) => (
          <ExtraRow
            key={item.name}
            listId={group.listId}
            item={item}
            busy={!!busy[`extra:${group.listId}:${item.name}`]}
            onRename={onRename}
            onDelete={onDelete}
          />
        ))}
      </div>
    </div>
  );
}

function ExtraRow({ listId, item, busy, onRename, onDelete }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(item.name);

  async function commit() {
    const ok = await onRename(listId, item.name, draft);
    if (ok) setEditing(false);
  }

  function cancel() {
    setDraft(item.name);
    setEditing(false);
  }

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        padding: '10px 12px',
        background: COLORS.cream,
        border: `1px solid ${COLORS.line}`,
        flexWrap: 'wrap',
      }}
    >
      <div
        style={{
          minWidth: 44,
          fontFamily: 'DM Mono, monospace',
          fontSize: 11,
          letterSpacing: '0.1em',
          color: item.score >= 0 ? COLORS.forest : COLORS.ember,
          fontWeight: 700,
        }}
      >
        {item.score > 0 ? `+${item.score}` : item.score}
      </div>

      {editing ? (
        <input
          autoFocus
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') commit();
            if (e.key === 'Escape') cancel();
          }}
          maxLength={100}
          style={{
            flex: 1,
            minWidth: 200,
            padding: '6px 8px',
            border: `1px solid ${COLORS.line}`,
            background: COLORS.paper,
            color: COLORS.ink,
            fontFamily: 'Manrope, system-ui, -apple-system, sans-serif',
            fontSize: 16,
            outline: 'none',
          }}
        />
      ) : (
        <div
          style={{
            flex: 1,
            minWidth: 200,
            fontFamily: 'Manrope, system-ui, -apple-system, sans-serif',
            fontSize: 16,
            color: COLORS.ink,
          }}
        >
          {item.name}
        </div>
      )}

      {editing ? (
        <>
          <button
            onClick={commit}
            disabled={busy}
            style={iconButton(COLORS.forest, COLORS.cream, busy)}
            title="Save"
          >
            <Check size={12} strokeWidth={3} />
            Save
          </button>
          <button
            onClick={cancel}
            disabled={busy}
            style={iconButton('transparent', COLORS.ink, busy, COLORS.ink)}
            title="Cancel"
          >
            <X size={12} strokeWidth={3} />
            Cancel
          </button>
        </>
      ) : (
        <>
          <a
            href={mapsPlaceUrl(item.name)}
            target="_blank"
            rel="noopener noreferrer"
            style={{ ...iconButton('transparent', COLORS.ink, false, COLORS.ink), textDecoration: 'none' }}
            title="View place on Google Maps"
          >
            <MapPin size={12} strokeWidth={2.5} />
            Map
          </a>
          <button
            onClick={() => setEditing(true)}
            disabled={busy}
            style={iconButton('transparent', COLORS.ink, busy, COLORS.ink)}
            title="Rename"
          >
            <Pencil size={12} strokeWidth={2.5} />
            Rename
          </button>
          <button
            onClick={() => onDelete(listId, item.name)}
            disabled={busy}
            style={iconButton('transparent', COLORS.ember, busy, COLORS.ember)}
            title="Delete"
          >
            <Trash2 size={12} strokeWidth={2.5} />
            Delete
          </button>
        </>
      )}
    </div>
  );
}

function iconButton(bg, color, busy, border) {
  return {
    background: bg,
    color,
    border: `1.5px solid ${border || color}`,
    padding: '6px 10px',
    fontFamily: 'DM Mono, monospace',
    fontSize: 10,
    letterSpacing: '0.16em',
    textTransform: 'uppercase',
    fontWeight: 600,
    cursor: busy ? 'wait' : 'pointer',
    opacity: busy ? 0.5 : 1,
    display: 'flex',
    alignItems: 'center',
    gap: 6,
  };
}
