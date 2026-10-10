'use client';
// Shared player-profile building blocks, used by BOTH the public profile page
// (/player/[name]) and the Stat Hub's Player tab so the two render identically
// from one implementation. Moved out of StatHubClient.jsx 2026-07-31 when the
// profile page shipped; any visual change here shows up in both surfaces.
//
// The components style themselves through the .qzhub class rules; a page that
// renders them outside the Stat Hub must include `profileCss` (the hub keeps
// its own superset copy of these rules).
import React, { useState, useEffect, useMemo, useRef } from 'react';
import Link from 'next/link';
import {
  Crown, Flame, Star, Trophy, ArrowUpRight, ChevronDown, Lock,
  Play, ListChecks, Layers, Shield, Anchor, Hash, BookOpen, Compass, GraduationCap,
  Sparkles, Gem, Zap, CalendarCheck, CalendarDays, Infinity as InfinityIcon, Clock,
  Hourglass, Cake, Sunrise, LayoutGrid, CheckCircle2, Repeat, Medal, Castle,
  TrendingUp, ChevronsUp, Award, Swords,
} from 'lucide-react';
import { dailyLabel } from '@/lib/daily-games';
import { TROPHY_TIERS, TROPHY_GROUPS } from '@/lib/trophy-defs';
import { T } from '@/lib/theme';

export const C = {
  bg: T.white, surface: T.white, ink: T.ink, muted: T.muted,
  soft: T.muted, line: 'rgba(20,22,28,0.30)', accent: T.accent,
  accsoft: '#e8effb', live: '#047857', danger: T.danger,
};
// The light palette under its own name, so a component can shadow `C` without
// referencing `C` in its own initialiser.
const C_LIGHT = C;
// The stage register, read through the CSS variables globals.css publishes on
// .stage-page, so BOTH stage registers work and neither is hardcoded here.
// A MEANING COLOUR ON THE STAGE IS A TOKEN, NEVER A LITERAL. Every
// `stage ? x : y` below reads its stage half from a --stg-* pair, because the
// stage has TWO registers and a literal can only ever be right in one of them.
// Written out here rather than inline so the eight call sites cannot drift.
const S_GOLD = 'var(--stg-warn,#fbbf24)';        // a perfect score, a trophy
const S_GOLD_BG = 'rgba(232,180,58,0.16)';       // a gold wash: legible over either ground
const S_LIVE = 'var(--stg-good,#6ee7b7)';        // a gain, a personal best
const S_LIVE_BG = 'rgba(110,231,183,0.14)';
const S_TRACK = 'var(--stg-surf2,rgba(255,255,255,0.08))';   // a bar's empty half, a quiet chip
const S_WELL = 'var(--stg-surf,rgba(255,255,255,0.045))';    // a locked trophy's disc
const S_MUTE = 'var(--stg-mute,#8b95a8)';
const C_STAGE = {
  bg: 'var(--stg-ground,#0b0f1a)',
  surface: 'var(--stg-surf,rgba(255,255,255,0.045))',
  ink: 'var(--stg-ink,#e9edf4)',
  muted: 'var(--stg-mute,#8b95a8)',
  soft: 'var(--stg-dim,#747f97)',
  line: 'var(--stg-line,rgba(255,255,255,0.11))',
  accent: 'var(--stg-acc,#7dd3fc)',
  accsoft: 'var(--stg-surf2,rgba(255,255,255,0.08))',
  live: 'var(--stg-up,#6ee7b7)',
  danger: 'var(--stg-dn,#fb7185)',
};

export const FONT = "'Manrope', system-ui, -apple-system, sans-serif";

// Medal palette for the #1/#2/#3 rank chips (gold, silver, bronze). RankChip
// moved here with its palette; the Stat Hub keeps its own copy for its podium.
const MEDAL_INK = ['#8a5300', '#5b6472', '#8a4f24'];
const MEDAL_BG = ['#fbf2dc', '#eef0f2', '#f6e9df'];

function cleanTitle(t) { return (t || '').replace(/^Name (the )?/i, '').trim(); }

// Initials avatar (own copy; the Stat Hub's Duel Arena keeps its own).
export function Avatar({ name, size = 48, bg, fg }) {
  const s = String(name || '').trim();
  const parts = s.split(/[\s_-]+/).filter(Boolean);
  const init = !s ? '?' : parts.length >= 2 ? (parts[0][0] + parts[1][0]).toUpperCase() : s.slice(0, 2).toUpperCase();
  return <span style={{ width: size, height: size, borderRadius: '50%', background: bg || C.accent, color: fg || T.white, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: Math.max(11, Math.round(size * 0.34)), flex: 'none' }}>{init}</span>;
}

export function RankChip({ rank, total }) {
  if (!rank) return null;
  const i = rank >= 1 && rank <= 3 ? rank - 1 : -1;
  const st = i >= 0 ? { color: MEDAL_INK[i], background: MEDAL_BG[i] } : undefined;
  return <span className="rankchip" style={st}>#{rank}{total ? ` of ${total.toLocaleString()}` : ''}</span>;
}

export function ChipMetric({ label, value, rank, cls }) {
  return (
    <div className={cls}>
      <div className="lbl">{label}</div>
      <div style={{ fontSize: 18, fontWeight: 700 }}>{value}<RankChip rank={rank} /></div>
    </div>
  );
}

export const CAT_COLS = [
  { key: 'label', label: 'Category', align: 'left', get: (c) => (c.label || '').toLowerCase() },
  { key: 'correct', label: 'Correct', align: 'right', get: (c, cr) => cr.correct, chip: 'correctRank' },
  { key: 'played', label: 'Played', align: 'right', get: (c, cr) => (cr.played != null ? cr.played : cr.matches), chip: 'playedRank' },
  { key: 'completed', label: 'Completed', align: 'right', get: (c, cr) => cr.completed, chip: 'completedRank' },
  { key: 'accuracy', label: 'Accuracy', align: 'right', get: (c, cr) => cr.accuracy, chip: 'accuracyRank' },
  { key: 'days', label: 'Days', align: 'right', get: (c, cr) => cr.daysPlayed || 0, chip: 'daysRank' },
  { key: 'xp', label: 'IQ', align: 'right', get: (c, cr) => cr.xp, chip: 'rank' },
];

export function completedPct(n, d) {
  if (!d || n == null) return '';
  if (n > 0 && n / d < 0.005) return '<1%';
  return `${Math.round((n / d) * 100)}%`;
}

export function Metric({ label, value, sub, rank, total, avg }) {
  return (
    <div className="metric">
      <div className="lbl metric-lbl">
        <span style={{ whiteSpace: 'nowrap' }}>{label}</span><RankChip rank={rank} total={total} />
      </div>
      <div className="v">{value}</div>
      {avg != null ? <div style={{ fontSize: 10.5, color: C.muted, marginTop: 2 }}>avg {avg}</div> : null}
      {sub ? <div style={{ fontSize: 10.5, color: C.muted, marginTop: 2 }}>{sub}</div> : null}
    </div>
  );
}

export function CategoryView({ me, scope, cats, totalQuizzes, viewing }) {
  const found = me && me.found;
  const [mode, setMode] = useState('table');
  const a = found ? me.activity : { correct: 0, answered: 0, played: 0, completed: 0, accuracy: 0, daysPlayed: 0 };
  const ranks = (found && me.ranks) || {};
  const base = (found && me.base) || {};
  const totalPlayers = (found && me.totalPlayers) || 0;
  const byCat = (found && me.byCategory) || {};
  const catRows = (scope === 'all' ? cats : cats.filter((c) => c.key === scope));

  // Column sort for the table mode. The Overall row stays pinned on top.
  const [catSort, setCatSort] = useState({ col: 'xp', dir: 'desc' });
  const sortedCatRows = useMemo(() => {
    if (!catSort.col) return catRows;
    const col = CAT_COLS.find((cc) => cc.key === catSort.col) || CAT_COLS[0];
    const arr = [...catRows];
    arr.sort((A, B) => {
      const crA = byCat[A.key], crB = byCat[B.key];
      if (col.key !== 'label') {
        if (!crA && !crB) return A.label.localeCompare(B.label);
        if (!crA) return 1;
        if (!crB) return -1;
      }
      const av = col.get(A, crA || {});
      const bv = col.get(B, crB || {});
      let cmp = typeof av === 'string' ? av.localeCompare(bv) : ((av || 0) - (bv || 0));
      if (catSort.dir === 'desc') cmp = -cmp;
      return cmp;
    });
    return arr;
  }, [catRows, catSort, byCat]);
  const clickCatSort = (col) => setCatSort((st) => (st.col === col.key
    ? { col: col.key, dir: st.dir === 'desc' ? 'asc' : 'desc' }
    : { col: col.key, dir: col.key === 'label' ? 'asc' : 'desc' }));

  // Card-mode ordering: played categories by IQ Points desc, unplayed after.
  const playedCats = catRows.filter((c) => byCat[c.key] && byCat[c.key].matches > 0)
    .sort((x, y) => (byCat[y.key].xp || 0) - (byCat[x.key].xp || 0));
  const unplayedCats = catRows.filter((c) => !byCat[c.key] || !(byCat[c.key].matches > 0));
  // Crown = best IQ Points RANK (the standing, not the raw number); ties break to
  // the higher IQ Points.
  let crownKey = null;
  for (const c of playedCats) {
    const cr = byCat[c.key];
    if (!crownKey) { crownKey = c.key; continue; }
    const b = byCat[crownKey];
    if ((cr.rank || 9e9) < (b.rank || 9e9) || ((cr.rank || 9e9) === (b.rank || 9e9) && (cr.xp || 0) > (b.xp || 0))) crownKey = c.key;
  }
  const maxR = playedCats.length ? Math.max(...playedCats.map((c) => byCat[c.key].xp || 0)) : 0;
  const barPct = (r) => Math.round(Math.max(12, Math.min(100, ((r || 0) / Math.max(1, maxR)) * 100)));

  if (!found) return <div className="card" style={{ padding: '14px 16px', fontSize: 13, color: C.soft }}>Play a few quizzes and the category breakdown shows up here.</div>;

  const modeBtn = (v, lbl) => (
    <button onClick={() => setMode(v)} className={`pvbtn${mode === v ? ' on' : ''}`} style={mode === v ? undefined : undefined}>{lbl}</button>
  );

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 2, marginBottom: 10, background: '#eef0f2', borderRadius: 8, padding: 3, width: 'fit-content', marginLeft: 'auto' }}>
        {modeBtn('table', 'Table')}
        {modeBtn('cards', 'Cards')}
      </div>
      {mode === 'cards' ? (
        <div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(200px,1fr))', gap: 10 }}>
            {playedCats.map((c) => {
              const cr = byCat[c.key];
              const crowned = c.key === crownKey && playedCats.length > 1;
              const first = (cr.rank || 0) === 1;
              return (
                <div key={c.key} className="card" style={{ padding: '13px 14px', position: 'relative', ...(crowned ? { border: '1.5px solid #f0d9a8', background: '#fffdf5' } : {}) }}>
                  {crowned ? <span style={{ position: 'absolute', top: 10, right: 12, color: T.goldInk, display: 'flex' }} title={viewing ? 'Best category' : 'Your best category'}><Crown size={17} /></span> : null}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                    <span className="dot" style={{ background: c.c, borderRadius: '50%', width: 9, height: 9 }} />
                    <span style={{ fontSize: 13, fontWeight: 800 }}>{c.label}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginTop: 6, flexWrap: 'wrap' }}>
                    <span style={{ fontSize: 21, fontWeight: 800, color: C.accent, fontVariantNumeric: 'tabular-nums' }}>{(cr.xp || 0).toLocaleString()}</span>
                    {cr.rank ? <span style={{ fontSize: 10.5, fontWeight: 800, background: first ? '#fbf2dc' : C.accsoft, color: first ? '#a97b12' : C.accent, borderRadius: 999, padding: '2px 8px' }}>#{cr.rank}{cr.catTotal ? ` of ${cr.catTotal.toLocaleString()}` : ''}</span> : null}
                  </div>
                  <div style={{ height: 6, borderRadius: 999, background: '#eef0f2', overflow: 'hidden', marginTop: 8 }}><div style={{ width: `${barPct(cr.xp || 0)}%`, height: '100%', background: c.c, borderRadius: 999 }} /></div>
                  <div style={{ fontSize: 11, color: C.muted, fontWeight: 600, marginTop: 7 }}>
                    {cr.accuracy}% accuracy · {cr.completed} completed{crowned && first ? (viewing ? ' · crown category' : ' · your crown to defend') : ''}
                  </div>
                </div>
              );
            })}
            {unplayedCats.map((c) => (
              <div key={c.key} style={{ border: `1.5px dashed ${C.line}`, borderRadius: 12, padding: '13px 14px', minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                  <span style={{ width: 9, height: 9, borderRadius: '50%', background: '#b4b2a9', flex: 'none' }} />
                  <span style={{ fontSize: 13, fontWeight: 800, color: C.muted }}>{c.label}</span>
                </div>
                <div style={{ fontSize: 12, color: C.soft, fontWeight: 600, marginTop: 8 }}>Unplayed. One quiz puts {viewing ? 'this player' : 'you'} on this board.</div>
                <Link href="/quizzes" style={{ display: 'inline-block', marginTop: 8, fontSize: 11.5, fontWeight: 800, color: C.accent, textDecoration: 'none' }}>Browse {c.label} quizzes →</Link>
              </div>
            ))}
          </div>
          <div style={{ fontSize: 10.5, color: C.soft, marginTop: 10 }}>Each #rank chip is the standing among players active in that category. The bar compares IQ Points across {viewing ? 'this player' : 'your'}{viewing ? "'s" : ''} categories.</div>
        </div>
      ) : (
      <div className="card" style={{ padding: '14px 16px' }}>
        <div style={{ overflow: 'auto' }}>
          <table>
            <thead><tr>
              {CAT_COLS.map((col) => (
                <th key={col.key} onClick={() => clickCatSort(col)} style={{ textAlign: col.align, whiteSpace: 'nowrap', cursor: 'pointer', userSelect: 'none', color: catSort.col === col.key ? C.accent : undefined }}>
                  {col.label}{catSort.col === col.key ? (catSort.dir === 'desc' ? ' ↓' : ' ↑') : ''}
                </th>
              ))}
            </tr></thead>
            <tbody>
              {scope === 'all' ? (
                <tr style={{ background: '#f3f7fe' }}>
                  <td style={{ fontWeight: 800, whiteSpace: 'nowrap' }}>Overall</td>
                  <td style={{ textAlign: 'right', whiteSpace: 'nowrap' }}><b>{a.correct.toLocaleString()}</b><RankChip rank={ranks.correct} />{base.correct != null ? <div style={{ fontSize: 9.5, color: C.muted }}>avg {base.correct.toLocaleString()}</div> : null}</td>
                  <td style={{ textAlign: 'right', whiteSpace: 'nowrap' }}><b>{a.played.toLocaleString()}</b><RankChip rank={ranks.played} />{base.played != null ? <div style={{ fontSize: 9.5, color: C.muted }}>avg {base.played.toLocaleString()}</div> : null}</td>
                  <td style={{ textAlign: 'right', whiteSpace: 'nowrap' }}><b>{a.completed.toLocaleString()}</b>{totalQuizzes ? <span style={{ fontSize: 10, color: C.soft, marginLeft: 4 }}>({completedPct(a.completed, totalQuizzes)})</span> : null}<RankChip rank={ranks.completed} />{base.completed != null ? <div style={{ fontSize: 9.5, color: C.muted }}>avg {base.completed.toLocaleString()}</div> : null}</td>
                  <td style={{ textAlign: 'right', whiteSpace: 'nowrap' }}><b>{a.accuracy}%</b><RankChip rank={ranks.accuracy} />{base.accuracy != null ? <div style={{ fontSize: 9.5, color: C.muted }}>avg {base.accuracy}%</div> : null}</td>
                  <td style={{ textAlign: 'right', whiteSpace: 'nowrap' }}><b>{a.daysPlayed || 0}</b><RankChip rank={ranks.daysPlayed} />{base.daysPlayed != null ? <div style={{ fontSize: 9.5, color: C.muted }}>avg {base.daysPlayed.toLocaleString()}</div> : null}</td>
                  <td className="score" style={{ textAlign: 'right', color: C.accent, whiteSpace: 'nowrap' }}><b>{(me.xp || 0).toLocaleString()}</b><RankChip rank={ranks.xp} total={totalPlayers} />{base.xp != null ? <div style={{ fontSize: 9.5, color: C.muted }}>avg {base.xp.toLocaleString()}</div> : null}</td>
                </tr>
              ) : null}
              {sortedCatRows.map((c) => {
                const cr = byCat[c.key];
                const muted = !cr;
                return (
                  <tr key={c.key}>
                    <td style={{ fontWeight: 600, whiteSpace: 'nowrap' }}><span className="dot" style={{ background: c.c, display: 'inline-block', marginRight: 8, verticalAlign: 'middle' }} />{c.label}</td>
                    <td style={{ textAlign: 'right', color: muted ? C.soft : C.ink, whiteSpace: 'nowrap' }}>{cr ? cr.correct.toLocaleString() : '—'}{cr && cr.correctRank ? <RankChip rank={cr.correctRank} /> : null}</td>
                    <td style={{ textAlign: 'right', color: muted ? C.soft : C.ink, whiteSpace: 'nowrap' }}>{cr ? (cr.played != null ? cr.played : cr.matches) : '—'}{cr && cr.playedRank ? <RankChip rank={cr.playedRank} /> : null}</td>
                    <td style={{ textAlign: 'right', color: muted ? C.soft : C.ink, whiteSpace: 'nowrap' }}>{cr ? <>{cr.completed}{c.count ? <span style={{ fontSize: 10, color: C.soft, marginLeft: 4 }}>({completedPct(cr.completed, c.count)})</span> : null}</> : '—'}{cr && cr.completedRank ? <RankChip rank={cr.completedRank} /> : null}</td>
                    <td style={{ textAlign: 'right', color: muted ? C.soft : C.ink, whiteSpace: 'nowrap' }}>{cr ? `${cr.accuracy}%` : '—'}{cr && cr.accuracyRank ? <RankChip rank={cr.accuracyRank} /> : null}</td>
                    <td style={{ textAlign: 'right', color: muted ? C.soft : C.ink, whiteSpace: 'nowrap' }}>{cr ? (cr.daysPlayed || 0) : '—'}{cr && cr.daysRank ? <RankChip rank={cr.daysRank} /> : null}</td>
                    <td className="score" style={{ textAlign: 'right', color: muted ? C.soft : C.accent, whiteSpace: 'nowrap' }}>{cr ? cr.xp.toLocaleString() : '—'}{cr && cr.rank ? <RankChip rank={cr.rank} total={cr.catTotal} /> : null}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          <div style={{ fontSize: 10.5, color: C.soft, marginTop: 8 }}>The Overall row ranks you against all {totalPlayers.toLocaleString()} players on every metric (avg = player-base average) and stays pinned on top. Each #rank chip in a category row is your standing among the players active in that category. Tap any column header to sort.</div>
        </div>
      </div>
      )}
    </div>
  );
}

export function ActivityFeed({ recent, titleById, viewing, stage }) {
  const C = stage ? C_STAGE : C_LIGHT;
  const who = viewing ? 'This player' : 'You';
  if (!recent || !recent.length) return <div className="card" style={{ padding: '14px 16px', fontSize: 13, color: C.soft }}>No games on record yet. Play a quiz and it shows up here.</div>;
  const DAY = 86400000;
  const keyOf = (t) => new Date(t).toISOString().slice(0, 10);
  const counts = new Map();
  for (const m of recent) { const k = m.createdAt ? String(m.createdAt).slice(0, 10) : null; if (k) counts.set(k, (counts.get(k) || 0) + 1); }
  // Current streak: consecutive UTC days ending today (or yesterday, so an
  // unplayed today doesn't zero a live streak).
  let curStreak = 0;
  { let t = Date.now(); if (!counts.has(keyOf(t))) t -= DAY; while (counts.has(keyOf(t))) { curStreak += 1; t -= DAY; } }
  let bestStreak = 0;
  { const keys = [...counts.keys()].sort(); let run = 0, prev = null;
    for (const k of keys) { const t = Date.parse(k); run = prev != null && t - prev === DAY ? run + 1 : 1; prev = t; if (run > bestStreak) bestStreak = run; } }
  const daysPlayed = counts.size;
  // Heatmap cells: the last 84 days, oldest first, filled column-major so each
  // column is a week and the newest week sits on the right.
  const HM = [(stage ? S_TRACK : '#eef0f2'),
    (stage ? 'color-mix(in srgb, var(--stg-acc,#7dd3fc) 34%, transparent)' : '#b5d4f4'),
    (stage ? 'color-mix(in srgb, var(--stg-acc,#7dd3fc) 66%, transparent)' : '#85b7eb'),
    (stage ? 'var(--stg-acc,#7dd3fc)' : T.accent)];
  const cells = [];
  { const start = Date.now() - 83 * DAY;
    for (let i = 0; i < 84; i++) { const n = counts.get(keyOf(start + i * DAY)) || 0; cells.push(n === 0 ? 0 : n === 1 ? 1 : n <= 3 ? 2 : 3); } }
  // Milestones, oldest-to-newest so "personal best" compares against real history.
  const hist = recent.slice().reverse();
  const bestByQuiz = new Map();
  const events = [];
  const tOf = (id) => (titleById && titleById[id]) || dailyLabel(id) || id;
  for (const m of hist) {
    const prevB = bestByQuiz.get(m.quizId);
    if (m.scorePct === 100 && (prevB == null || prevB < 100)) {
      events.push({ kind: 'perfect', quizId: m.quizId, when: m.createdAt, chip: '100%' });
    } else if (prevB != null && m.scorePct > prevB) {
      events.push({ kind: 'pb', quizId: m.quizId, when: m.createdAt, sub: `${m.scorePct}%, up from ${prevB}%`, chip: `+${m.scorePct - prevB}%` });
    }
    if ((m.xp || 0) >= 75) events.push({ kind: 'surge', quizId: m.quizId, when: m.createdAt, sub: `${m.scorePct}% on a heavyweight quiz`, chip: `+${m.xp} IQ` });
    if (prevB == null || m.scorePct > prevB) bestByQuiz.set(m.quizId, m.scorePct);
  }
  const mile = events.slice(-8).reverse();
  const fmtWhen = (iso) => (iso ? new Date(iso).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' }) : '—');
  const MK = {
    perfect: { bg: (stage ? S_GOLD_BG : '#fbf2dc'), fg: (stage ? S_GOLD : '#a97b12'), Icon: Star, label: (q) => `Perfect score on ${q}` },
    pb: { bg: (stage ? S_LIVE_BG : '#e6f7f0'), fg: (stage ? S_LIVE : '#0b7a55'), Icon: Trophy, label: (q) => `New personal best on ${q}` },
    surge: { bg: C.accsoft, fg: C.accent, Icon: ArrowUpRight, label: (q) => `Big IQ haul on ${q}` },
  };
  const statLbl = { fontSize: 10, color: C.soft, fontWeight: 800, letterSpacing: '.05em', textTransform: 'uppercase' };
  return (
    <div>
      <div className="card" style={{ padding: '14px 16px', marginBottom: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 18, flexWrap: 'wrap' }}>
          <span style={{ flex: 'none' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
              {curStreak >= 2 ? <span className="flameon" style={{ display: 'inline-flex', color: (stage ? S_GOLD : '#f59008') }}><Flame size={19} /></span> : null}
              <span style={{ fontSize: 23, fontWeight: 800 }}>{curStreak}</span>
            </span>
            <span style={statLbl}>Day streak</span>
          </span>
          <span style={{ flex: 'none' }}>
            <span style={{ display: 'block', fontSize: 23, fontWeight: 800 }}>{bestStreak}</span>
            <span style={statLbl}>Best streak</span>
          </span>
          <span style={{ flex: 'none' }}>
            <span style={{ display: 'block', fontSize: 23, fontWeight: 800 }}>{daysPlayed}</span>
            <span style={statLbl}>Days played</span>
          </span>
          <span style={{ flex: 1, minWidth: 200 }}>
            <span style={{ display: 'grid', gridTemplateRows: 'repeat(7, 10px)', gridAutoFlow: 'column', gridAutoColumns: '10px', gap: 3, justifyContent: 'end' }}>
              {cells.map((lv, i) => <span key={i} style={{ width: 10, height: 10, borderRadius: 3, background: HM[lv] }} />)}
            </span>
            <span style={{ display: 'block', fontSize: 10, color: C.soft, fontWeight: 700, textAlign: 'right', marginTop: 5, letterSpacing: '.04em' }}>LAST 12 WEEKS · DARKER = MORE PLAYED</span>
          </span>
        </div>
      </div>
      {mile.length > 0 && (
        <div className="card" style={{ padding: '6px 14px', marginBottom: 10 }}>
          <div style={{ padding: '8px 0 2px', fontSize: 13, fontWeight: 800 }}>Milestones</div>
          {mile.map((ev, i) => {
            const mk = MK[ev.kind];
            const Ic = mk.Icon;
            return (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '9px 0', borderBottom: i < mile.length - 1 ? `1px solid ${C.line}` : 'none' }}>
                <span style={{ flex: 'none', width: 30, height: 30, borderRadius: 9, background: mk.bg, color: mk.fg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Ic size={15} /></span>
                <span style={{ flex: 1, minWidth: 0 }}>
                  <Link href={`/quiz/${ev.quizId}`} style={{ display: 'block', fontSize: 13, fontWeight: 700, color: C.ink, textDecoration: 'none', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{mk.label(tOf(ev.quizId))}</Link>
                  <span style={{ display: 'block', fontSize: 11.5, color: C.soft, fontWeight: 600 }}>{fmtWhen(ev.when)}{ev.sub ? ` · ${ev.sub}` : ''}</span>
                </span>
                <span style={{ flex: 'none', fontSize: 11, fontWeight: 800, background: mk.bg, color: mk.fg, borderRadius: 999, padding: '2px 8px' }}>{ev.chip}</span>
              </div>
            );
          })}
        </div>
      )}
      <div className="card" style={{ padding: '4px 14px' }}>
        <div style={{ padding: '10px 0 4px', fontSize: 13, fontWeight: 800 }}>Full Game Log</div>
        <div style={{ overflow: 'auto', maxHeight: 600 }}>
          <table>
            <thead><tr>
              <th>Quiz</th>
              <th style={{ textAlign: 'right' }}>When</th>
              <th style={{ textAlign: 'right' }}>{viewing ? 'User %' : 'Your %'}</th>
              <th style={{ textAlign: 'right' }}>IQ</th>
              <th style={{ textAlign: 'right' }}>Rank &Delta;</th>
              <th style={{ textAlign: 'right' }}>Cat. Rank &Delta;</th>
            </tr></thead>
            <tbody>
              {recent.map((m, i) => {
                const title = (titleById && titleById[m.quizId]) || dailyLabel(m.quizId) || m.quizId;
                const when = m.createdAt ? new Date(m.createdAt).toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' }) : '—';
                return (
                  <tr key={i}>
                    <td style={{ fontWeight: 600, whiteSpace: 'nowrap' }}><Link href={`/quiz/${m.quizId}`} style={{ color: C.ink, textDecoration: 'none' }}>{title}</Link></td>
                    <td style={{ textAlign: 'right', color: C.muted, whiteSpace: 'nowrap' }}>{when}</td>
                    <td style={{ textAlign: 'right' }}>{m.scorePct}%</td>
                    <td className="score" style={{ textAlign: 'right', color: (m.xp || 0) > 0 ? C.accent : C.muted, fontWeight: 700 }}>{`+${m.xp || 0}`}</td>
                    <td style={{ textAlign: 'right', fontWeight: 700, color: m.rankDelta > 0 ? C.accent : m.rankDelta < 0 ? C.danger : C.muted }}>{m.rankDelta == null ? '—' : m.rankDelta === 0 ? '±0' : m.rankDelta > 0 ? `+${m.rankDelta}` : m.rankDelta}</td>
                    <td style={{ textAlign: 'right', fontWeight: 700, color: m.catRankDelta > 0 ? C.accent : m.catRankDelta < 0 ? C.danger : C.muted }}>{m.catRankDelta == null ? '—' : m.catRankDelta === 0 ? '±0' : m.catRankDelta > 0 ? `+${m.catRankDelta}` : m.catRankDelta}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export function XpPanel({ me, titleById, viewing, stage }) {
  const C = stage ? C_STAGE : C_LIGHT;
  const found = me && me.found;
  const recent = (found && me.recent) || [];
  const prog = (found && me.progress) || { level: 1, xp: 0, levelFloor: 0, levelNext: 25, intoLevel: 0, stepSize: 25, toNext: 25, matches: 0, xp7d: null };
  const [how, setHow] = useState(false);
  const xp = found ? (me.xp || 0) : 0;
  const level = found ? (me.level || 1) : 1;

  // Cumulative IQ Points series from the full game history (oldest first).
  const hist = recent.slice().reverse();
  const series = [0];
  { let cum = 0; for (const m of hist) { cum += (m.xp || 0); series.push(cum); } }
  const weekCut = Date.now() - 7 * 86400000;
  const weekGain = Math.round(hist.reduce((acc, m) => acc + ((m.createdAt && Date.parse(m.createdAt) >= weekCut) ? (m.xp || 0) : 0), 0));

  // Chart: the full IQ Points history sampled to ~70 points and drawn at the
  // container's real pixel width as a smoothed curve over light gridlines.
  const chartRef = useRef(null);
  const [cw, setCw] = useState(0);
  const hasChart = series.length >= 4;
  useEffect(() => {
    const upd = () => { const el = chartRef.current; if (el) setCw(el.clientWidth || 600); };
    upd();
    window.addEventListener('resize', upd);
    return () => window.removeEventListener('resize', upd);
  }, [hasChart, found]);
  const nextLevelAt = prog.levelNext;
  const bandPct = prog.stepSize > 0 ? Math.round(Math.max(4, Math.min(100, (prog.intoLevel / prog.stepSize) * 100))) : 100;
  const tierLabel = found && me.tier ? me.tier : 'Bronze Tier';
  // The API's tierBg/tierFg are a LIGHT-page pair (navy ink on a pale wash),
  // so on the stage they are not a fallback to reach for, they are the thing
  // to ignore: measured 1.55:1 live before this.
  const tierBg = stage ? 'var(--stg-surf2,rgba(255,255,255,0.08))' : (found && me.tierBg ? me.tierBg : T.paper);
  const tierFg = stage ? 'var(--stg-ink,#e9edf4)' : (found && me.tierFg ? me.tierFg : C.muted);

  const explainerCards = (
    <div className="rgrid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 14 }}>
      <div className="card" style={{ padding: '14px 16px' }}>
        <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 8 }}>How IQ Points Work</div>
        <p style={{ fontSize: 13, color: C.muted, lineHeight: 1.6, margin: '0 0 10px' }}>
          Every quiz you finish ADDS IQ Points: your correct answers, multiplied by the quiz{"'"}s difficulty. Easy quizzes pay 1×, the hardest pay 2×. A perfect 100% game earns a 25% bonus, and replaying a quiz you{"'"}ve already taken pays 25% of the usual IQ Points (first attempts pay full).
        </p>
        <p style={{ fontSize: 13, color: C.muted, lineHeight: 1.6, margin: '0 0 10px' }}>
          <b style={{ color: C.ink }}>IQ Points only go up.</b> There is no way to lose them and they never decay — every game moves you forward.
        </p>
        <div className="formula">
          IQ Points = correct × (Dq / 1000)<br />
          × 1.25 if perfect · × 0.25 on replays
        </div>
        <div style={{ fontSize: 11.5, color: C.muted, lineHeight: 1.8, marginTop: 10 }}>
          Dq = quiz difficulty (1,000 easiest – 2,000 hardest) · the step from level L to L+1 costs 25·L IQ Points
        </div>
      </div>
      <div className="card" style={{ padding: '14px 16px' }}>
        <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 10 }}>{viewing ? 'Numbers' : 'Your Numbers'}</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
          <div className="hrow" style={{ borderTop: 'none' }}><span style={{ flex: 1 }}>Level</span><span style={{ fontWeight: 700 }}>{level}</span></div>
          <div className="hrow"><span style={{ flex: 1 }}>Games Counted</span><span style={{ fontWeight: 700 }}>{prog.matches}</span></div>
          <div className="hrow"><span style={{ flex: 1 }}>IQ Points This Week</span><span className="score" style={{ color: weekGain > 0 ? C.accent : C.muted }}>{weekGain > 0 ? `+${weekGain.toLocaleString()}` : '0'}</span></div>
          <div className="hrow"><span style={{ flex: 1 }}>Next Level At</span><span style={{ fontWeight: 700 }}>{nextLevelAt.toLocaleString()} IQ</span></div>
          <div className="hrow" style={{ borderTop: `2px solid ${C.ink}` }}><span style={{ flex: 1, fontWeight: 700 }}>Total IQ Points</span><span style={{ fontWeight: 800, color: C.accent }}>{xp.toLocaleString()}</span></div>
        </div>
      </div>
    </div>
  );

  return (
    <div>
      <div className="card" style={{ padding: '14px 16px', marginBottom: 12 }}>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, flexWrap: 'wrap' }}>
          <span style={{ fontSize: 30, fontWeight: 800, color: C.accent, fontVariantNumeric: 'tabular-nums' }}>Level {level}</span>
          <span style={{ fontSize: 15, fontWeight: 700, color: C.muted, fontVariantNumeric: 'tabular-nums' }}>{xp.toLocaleString()} IQ</span>
          {prog.matches > 0 ? (
            <span style={{ fontSize: 11, fontWeight: 800, background: weekGain > 0 ? (stage ? S_LIVE_BG : '#e6f7f0') : (stage ? S_TRACK : '#eef0f2'), color: weekGain > 0 ? (stage ? S_LIVE : '#0b7a55') : C.muted, borderRadius: 999, padding: '3px 9px' }}>
              {weekGain > 0 ? `▲ +${weekGain.toLocaleString()} IQ this week` : 'No IQ gained this week'}
            </span>
          ) : null}
          <span style={{ fontSize: 11, fontWeight: 800, background: tierBg, color: tierFg, borderRadius: 999, padding: '3px 9px', textTransform: 'uppercase', letterSpacing: '.03em' }}>{tierLabel}</span>
          <span style={{ flex: 1 }} />
          {prog.matches > 0 ? <span style={{ fontSize: 11, color: C.soft, fontWeight: 800, letterSpacing: '.04em' }}>LEVEL {level + 1} AT {nextLevelAt.toLocaleString()} IQ</span> : null}
        </div>
        {hasChart ? (
          <div ref={chartRef} style={{ marginTop: 10 }}>
            {cw > 0 ? (() => {
              const W = cw, H = 150, T = 14, B = 8, Lp = 6, Rp = 6;
              let pts = series;
              if (pts.length > 70) { pts = []; for (let i = 0; i < 70; i++) pts.push(series[Math.round((i * (series.length - 1)) / 69)]); }
              let lo = Math.min(...pts), hi = Math.max(...pts);
              if (nextLevelAt > hi && nextLevelAt - hi <= Math.max(35, prog.stepSize)) hi = nextLevelAt + Math.max(6, Math.round(prog.stepSize * 0.15));
              if (hi - lo < 40) { const mid = (hi + lo) / 2; lo = mid - 20; hi = mid + 20; }
              const vpad = (hi - lo) * 0.06;
              lo -= vpad; hi += vpad;
              const X = (i) => Lp + (pts.length > 1 ? (i / (pts.length - 1)) * (W - Lp - Rp) : 0);
              const Y = (v) => T + (1 - (v - lo) / (hi - lo)) * (H - T - B);
              const P = pts.map((v, i) => [Math.round(X(i) * 10) / 10, Math.round(Y(v) * 10) / 10]);
              let d = `M${P[0][0]},${P[0][1]}`;
              for (let i = 0; i < P.length - 1; i++) {
                const p0 = P[Math.max(0, i - 1)], p1 = P[i], p2 = P[i + 1], p3 = P[Math.min(P.length - 1, i + 2)];
                d += `C${(p1[0] + (p2[0] - p0[0]) / 6).toFixed(1)},${(p1[1] + (p2[1] - p0[1]) / 6).toFixed(1)} ${(p2[0] - (p3[0] - p1[0]) / 6).toFixed(1)},${(p2[1] - (p3[1] - p1[1]) / 6).toFixed(1)} ${p2[0]},${p2[1]}`;
              }
              const area = `${d} L${P[P.length - 1][0]},${H - B} L${P[0][0]},${H - B} Z`;
              const ticks = [lo + (hi - lo) * 0.18, lo + (hi - lo) * 0.5, lo + (hi - lo) * 0.82].map((v) => Math.round(v / 5) * 5);
              const goalY = nextLevelAt >= lo && nextLevelAt <= hi ? Y(nextLevelAt) : null;
              return (
                <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} aria-hidden="true" style={{ display: 'block' }}>
                  {ticks.map((v, i) => (
                    <g key={i}>
                      <line x1={Lp} y1={Y(v)} x2={W - Rp} y2={Y(v)} stroke={C.line} strokeWidth="1" />
                      <text x={W - Rp - 2} y={Y(v) - 4} fontSize="10" fontWeight="700" fill={C.soft} fontFamily={FONT} textAnchor="end">{v.toLocaleString()}</text>
                    </g>
                  ))}
                  <path d={area} fill={C.accsoft} opacity="0.6" />
                  <path d={d} fill="none" stroke={C.accent} strokeWidth="2.25" strokeLinejoin="round" strokeLinecap="round" />
                  {goalY != null ? (
                    <g>
                      <line x1={Lp} y1={goalY} x2={W - Rp} y2={goalY} stroke={T.gold} strokeWidth="1.5" strokeDasharray="5 5" />
                      <text x={Lp + 2} y={Math.max(11, goalY - 5)} fontSize="10.5" fontWeight="800" fill="#a97b12" fontFamily={FONT}>Level {level + 1} at {nextLevelAt.toLocaleString()} IQ</text>
                    </g>
                  ) : null}
                  <circle cx={P[P.length - 1][0]} cy={P[P.length - 1][1]} r="4" fill={C.accent} stroke={stage ? "var(--stg-ground,#0b0f1a)" : T.white} strokeWidth="1.5" />
                </svg>
              );
            })() : <div style={{ height: 150 }} />}
          </div>
        ) : (
          <div style={{ fontSize: 13, color: C.soft, padding: '14px 0 6px' }}>{viewing ? 'A few more finished quizzes and the IQ Points trend chart appears here.' : 'Finish a few quizzes and your IQ Points trend chart appears here.'}</div>
        )}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 10, flexWrap: 'wrap' }}>
          <span style={{ fontSize: 11, fontWeight: 800, color: tierFg, letterSpacing: '.04em', textTransform: 'uppercase', flex: 'none' }}>{tierLabel.replace(' Tier', '')}</span>
          <span style={{ flex: 1, minWidth: 120, height: 8, borderRadius: 999, background: (stage ? S_TRACK : '#eef0f2'), overflow: 'hidden' }}><span style={{ display: 'block', width: `${bandPct}%`, height: '100%', background: C.accent, borderRadius: 999 }} /></span>
          <span style={{ fontSize: 11, fontWeight: 800, color: C.soft, letterSpacing: '.04em', flex: 'none' }}>{`${prog.toNext.toLocaleString()} IQ TO LEVEL ${level + 1}`}</span>
        </div>
      </div>

      <button onClick={() => setHow((v) => !v)} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, border: 'none', background: 'transparent', color: C.accent, fontFamily: FONT, fontSize: 12.5, fontWeight: 800, cursor: 'pointer', padding: '2px 0', marginBottom: 12 }}>
        <ChevronDown size={15} style={{ transform: how ? 'rotate(180deg)' : 'none', transition: 'transform .15s' }} /> How your IQ Points work
      </button>
      {how ? explainerCards : null}

      <div className="card" style={{ padding: '4px 6px' }}>
        <div style={{ padding: '12px 12px 4px', fontSize: 14, fontWeight: 700 }}>Recent IQ Points</div>
        <div style={{ overflow: 'auto' }}>
          <table>
            <thead><tr>
              <th>Quiz</th>
              <th style={{ textAlign: 'right' }}>Difficulty</th>
              <th style={{ textAlign: 'right' }}>{viewing ? 'User %' : 'Your %'}</th>
              <th style={{ textAlign: 'right' }}>Notes</th>
              <th style={{ textAlign: 'right' }}>IQ</th>
            </tr></thead>
            <tbody>
              {recent.length === 0 && (
                <tr><td colSpan={5} style={{ color: C.soft }}>No games yet. Finish a quiz to start earning IQ Points.</td></tr>
              )}
              {recent.slice(0, 40).map((m, i) => (
                <tr key={i}>
                  <td style={{ fontWeight: 600, maxWidth: 260, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    <Link href={`/quiz/${m.quizId}`} className="qlink">{titleById[m.quizId] || dailyLabel(m.quizId) || cleanTitle(m.quizId)}</Link>
                  </td>
                  <td style={{ textAlign: 'right' }}>{(m.dq || 0).toLocaleString()}</td>
                  <td style={{ textAlign: 'right' }}>{m.scorePct}%</td>
                  <td style={{ textAlign: 'right', whiteSpace: 'nowrap' }}>
                    {m.perfect ? <span style={{ fontSize: 10, fontWeight: 800, background: (stage ? S_GOLD_BG : '#fbf2dc'), color: (stage ? S_GOLD : '#a97b12'), borderRadius: 999, padding: '2px 7px' }}>PERFECT</span> : null}
                    {m.attempt > 1 ? <span style={{ fontSize: 10, fontWeight: 800, background: (stage ? S_TRACK : '#eef0f2'), color: C.muted, borderRadius: 999, padding: '2px 7px', marginLeft: m.perfect ? 4 : 0 }}>REPLAY</span> : null}
                    {!m.perfect && !(m.attempt > 1) ? <span style={{ color: C.soft }}>—</span> : null}
                  </td>
                  <td className="score" style={{ textAlign: 'right', color: (m.xp || 0) > 0 ? C.accent : C.muted }}>{`+${m.xp || 0}`}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// ── Trophy Case ─────────────────────────────────────────────────────────────
// Renders the API's trophies payload ({ earnedCount, total, list }): earned
// tiles in their tier colors, locked tiles grayed with a lock, each with the
// live holder percentage. Grouped in TROPHY_GROUPS order.
const TROPHY_ICON = {
  Play, ListChecks, Layers, Shield, Anchor, Hash, BookOpen, Compass, GraduationCap,
  Star, Sparkles, Gem, Zap, Flame, CalendarCheck, CalendarDays, Infinity: InfinityIcon,
  Clock, Hourglass, Cake, Sunrise, LayoutGrid, CheckCircle2, Repeat, Medal, Crown,
  Castle, TrendingUp, ChevronsUp, Award, Swords, Trophy,
};

export function TrophyCase({ trophies, viewing, stage }) {
  const C = stage ? C_STAGE : C_LIGHT;
  if (!trophies || !Array.isArray(trophies.list)) {
    return <div className="card" style={{ padding: '14px 16px', fontSize: 13, color: C.soft }}>Play a few games and the trophy case fills in here.</div>;
  }
  const { list, earnedCount, total } = trophies;
  // An EARNED trophy always has at least one holder, so a pct that rounds to
  // zero (1 of thousands) reads '<1%', never '0%'.
  const rarity = (t) => ((t.pct > 0 && t.pct < 1) || (t.earned && !t.pct) ? '<1' : Math.round(t.pct)) + '% of players';
  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 10, flexWrap: 'wrap', marginBottom: 10 }}>
        <span style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 15, fontWeight: 800 }}><Trophy size={17} style={{ color: (stage ? S_GOLD : '#a97b12') }} /> Trophy Case</span>
        <span style={{ fontSize: 12.5, fontWeight: 700, color: C.muted }}>{earnedCount} of {total} unlocked</span>
      </div>
      {TROPHY_GROUPS.map((g) => {
        const rows = list.filter((t) => t.group === g.key);
        if (!rows.length) return null;
        return (
          <div key={g.key} style={{ marginBottom: 14 }}>
            <div className="lbl" style={{ margin: '0 0 8px 2px' }}>{g.label}</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(210px,1fr))', gap: 9 }}>
              {rows.map((t) => {
                const tier = TROPHY_TIERS[t.tier] || TROPHY_TIERS.bronze;
                const Ic = TROPHY_ICON[t.icon] || Trophy;
                return t.earned ? (
                  <div key={t.id} className="card" style={{ padding: '12px 13px', display: 'flex', gap: 11, alignItems: 'flex-start', borderColor: tier.ring }}>
                    <span style={{ flex: 'none', width: 38, height: 38, borderRadius: '50%', background: tier.bg, color: tier.fg, border: `2px solid ${tier.ring}`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Ic size={18} /></span>
                    <span style={{ minWidth: 0 }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                        <span style={{ fontSize: 13.5, fontWeight: 800 }}>{t.name}</span>
                        <span style={{ fontSize: 9, fontWeight: 800, letterSpacing: '.05em', textTransform: 'uppercase', background: tier.bg, color: tier.fg, borderRadius: 5, padding: '1px 6px' }}>{tier.label}</span>
                      </span>
                      <span style={{ display: 'block', fontSize: 11.5, color: C.muted, lineHeight: 1.45, marginTop: 2 }}>{t.desc}</span>
                      <span style={{ display: 'block', fontSize: 10, color: C.soft, fontWeight: 700, marginTop: 4 }}>{rarity(t)} have this</span>
                    </span>
                  </div>
                ) : (
                  <div key={t.id} style={{ border: `1.5px dashed ${C.line}`, borderRadius: 12, padding: '12px 13px', display: 'flex', gap: 11, alignItems: 'flex-start', minWidth: 0, opacity: 0.75 }}>
                    <span style={{ flex: 'none', width: 38, height: 38, borderRadius: '50%', background: (stage ? S_WELL : '#f2f3f5'), color: (stage ? S_MUTE : '#9aa1ad'), display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
                      <Ic size={18} />
                      <span style={{ position: 'absolute', right: -3, bottom: -3, width: 16, height: 16, borderRadius: '50%', background: stage ? 'var(--stg-raise,#0e131f)' : T.white, border: `1px solid ${C.line}`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: (stage ? S_MUTE : '#9aa1ad') }}><Lock size={9} /></span>
                    </span>
                    <span style={{ minWidth: 0 }}>
                      <span style={{ fontSize: 13.5, fontWeight: 800, color: C.muted }}>{t.name}</span>
                      <span style={{ display: 'block', fontSize: 11.5, color: C.soft, lineHeight: 1.45, marginTop: 2 }}>{t.desc}</span>
                      <span style={{ display: 'block', fontSize: 10, color: C.soft, fontWeight: 700, marginTop: 4 }}>{rarity(t)} have this</span>
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
      <div style={{ fontSize: 10.5, color: C.soft, marginTop: 2 }}>Trophies are awarded from {viewing ? "this player's" : 'your'} full play history and can never be lost. Rarity is live.</div>
    </div>
  );
}

// The .qzhub style rules the shared components rely on, for pages that render
// them OUTSIDE the Stat Hub (which keeps its own superset). Same class names,
// same values; keep the two in sync when a rule changes.
export const profileCss = `
  .qzhub{font-family:${FONT};color:${C.ink};}
  .qzhub .lbl{font-size:10px;font-weight:600;letter-spacing:.04em;text-transform:uppercase;color:${C.muted};}
  .qzhub .card{background:${C.surface};border:1px solid ${C.line};border-radius:12px;overflow:hidden;min-width:0;}
  .qzhub .metric{background:${C.bg};border-radius:10px;padding:12px 14px;}
  .qzhub .metric .v{font-size:21px;font-weight:700;}
  .qzhub .rankchip{font-size:10px;font-weight:700;color:${C.accent};background:${C.accsoft};border-radius:5px;padding:1px 6px;letter-spacing:0;text-transform:none;margin-left:6px;}
  .qzhub .pvbtn{border:none;background:transparent;border-radius:6px;padding:5px 11px;font:inherit;font-family:${FONT};font-size:12px;color:${C.muted};cursor:pointer;}
  .qzhub .pvbtn.on{background:var(--white);color:${C.ink};font-weight:700;box-shadow:0 1px 2px rgba(20,22,28,0.06);}
  .qzhub .hrow{display:flex;align-items:center;gap:10px;padding:7px 0;border-top:1px solid rgba(20,22,28,0.07);font-size:13px;}
  .qzhub .score{font-weight:700;color:${C.accent};font-variant-numeric:tabular-nums;}
  .qzhub table{width:100%;border-collapse:collapse;font-size:12.5px;}
  .qzhub th{text-align:left;font-size:10px;font-weight:700;letter-spacing:.04em;text-transform:uppercase;color:${C.muted};padding:8px 10px;border-bottom:1px solid ${C.line};}
  .qzhub td{padding:8px 10px;border-bottom:1px solid rgba(20,22,28,0.06);}
  .qzhub .formula{background:${C.bg};border:1px solid ${C.line};border-radius:10px;padding:14px 16px;font-family:ui-monospace,Menlo,monospace;font-size:13px;line-height:1.9;}
  .qzhub a.qlink{text-decoration:none;color:inherit;}
  .qzhub .dot{width:9px;height:9px;border-radius:3px;flex:none;}
  .qzhub .pill{display:inline-flex;align-items:center;gap:6px;background:var(--white);border:1px solid rgba(20,22,28,0.30);color:${C.muted};border-radius:999px;padding:7px 15px;font-size:12.5px;font-weight:700;cursor:pointer;font-family:${FONT};}
  .qzhub .pill:hover{border-color:var(--accent-border);}
  .qzhub .pill.on{background:${C.accent};border-color:${C.accent};color:var(--white);font-weight:800;}
  .qzhub .flameon{animation:qzflame 1.4s ease-in-out infinite;}
  @keyframes qzflame{0%,100%{transform:scale(1);}50%{transform:scale(1.16);}}
  @media (prefers-reduced-motion: reduce){.qzhub .flameon{animation:none;}}
`;
