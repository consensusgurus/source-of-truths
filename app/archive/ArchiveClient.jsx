'use client';

// THE PUZZLE ARCHIVE (owner, 2026-10-09; REBUILT 2026-11-07 in the home's
// look: "it doesn't even use updated pastels"). Replaces the old /daily hub.
// This page asks for ONE thing, the viewer's play history (daily-status, the
// same cached client the home uses), and reads the per-puzzle saves already on
// this device.
//
// THE LOOK is the live home's, not the 2026-10-09 stage draft: 1px ink
// outlines, 12px rounded tiles, ink pills, Title Case headings in Manrope, and
// the SITE PASTEL (lib/category-ramp.js sitePastel: the raw step on the dark
// page, the step 60/40 with white on the light page). The deep light-ramp
// steps (navy, crimson, forest) and the mono caps labels and 4px rails of the
// first draft are gone. Category colour only ever FILLS (bands, chips, solved
// squares) under one dark ink; it is never text on paper. The glyph keeps the
// accent-as-ink step on the light page because a pastel cannot draw on white.
//
// THE SHAPE. CircuitFrame (cap, register switch, stage footer), then an ink
// summary card beside the lede and figures, a row of category chips that fill
// with the share you have played (the home index's progress fill), a search
// pill, the key, and one shelf per category in the home's fixed order with
// games A to Z inside. Retired games sit on a shelf of their own at the foot.
//
// A CARD is the home tile: glyph and name, the tag, then the last fourteen
// boards as day squares, and a pastel band across the foot that fills with
// how much of that game's archive you have played. "All N days" opens the card
// across the row with a two-month calendar and a link to the newest board you
// have not played.
//
// MARKS. Solved is the full pastel, played the pale pastel, started a pastel
// corner, not played a plain grey cell. No dashed or dotted marks anywhere
// (owner rule). Server rows (daily-status) and this device's saves are merged,
// so a board played on another device still shows.
//
// NOTHING HERE MAY NAME AN ANSWER. Only dates, numbers and the Sunday flag
// reach this component.

import { useEffect, useMemo, useState } from 'react';
import { migrateJigSaves } from '@/lib/jig-renum';
import { ArrowRight, ChevronLeft, ChevronRight, Search, X } from 'lucide-react';
import CircuitFrame from '../circuits/CircuitFrame';
import GameGlyph from '../GameGlyph';
import { fetchDayStatus } from '../useDayStats';
import { DAILY_GAME_MAP, isRetiredDaily, isUnlaunchedDaily } from '@/lib/daily-games';
import { categoryColor, categoryAccentInkLight } from '@/lib/category-ramp';
import { useThemeQs } from '@/lib/stage-theme';

const CAT_FIXED = ['Word', 'Numbers', 'Logic', 'Sudoku', 'Trivia', 'Geography', 'End Game', 'Cards', 'Arcade', 'Crowd Psychology'];
const catLabel = (c) => (c === 'Word' ? 'Words' : c);
const RETIRED = 'Retired';
const STRIP = 14;
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const MON3 = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const WD3 = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const WD1 = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

// The per-puzzle save keys a game writes. Crux carries a revision suffix on a
// board that was corrected after it went live.
function keysFor(gameKey, num, rev) {
  const ks = [`sot_${gameKey}_${num}`];
  if (gameKey === 'crux' && rev) ks.push(`sot_crux_${num}_r${rev}`);
  return ks;
}

function isoParts(iso) {
  const [y, m, d] = String(iso || '').split('-').map(Number);
  return { y, m, d };
}
function dow(iso) {
  const { y, m, d } = isoParts(iso);
  return new Date(Date.UTC(y, m - 1, d)).getUTCDay();
}
function shortDay(iso) {
  const { m, d } = isoParts(iso);
  return `${WD3[dow(iso)]}, ${MON3[m - 1]} ${d}`;
}
function addMonths(ym, delta) {
  let [yy, mm] = ym.split('-').map(Number);
  mm += delta;
  while (mm < 1) { mm += 12; yy -= 1; }
  while (mm > 12) { mm -= 12; yy += 1; }
  return `${yy}-${String(mm).padStart(2, '0')}`;
}

// The category's raw step and its as-ink twin ride on the element; the
// stylesheet turns the step into the site pastel per register, so a
// server-rendered card never repaints under the reader on first paint.
function hueVars(cat) {
  return { '--cfull': categoryColor(cat), '--cink': categoryAccentInkLight(cat) };
}

export default function ArchiveClient({ games = [], today = '' }) {
  const tq = useThemeQs();
  const withTq = (href) => (tq ? href + (href.includes('?') ? tq : `?${tq.slice(1)}`) : href);

  const [marks, setMarks] = useState(() => ({ solved: new Set(), played: new Set(), started: new Set(), ready: false }));
  const [cat, setCat] = useState('all');
  const [q, setQ] = useState('');
  const [openKey, setOpenKey] = useState(null);

  // Every game the server sent, joined to its registry row. A key the registry
  // no longer knows is skipped rather than drawn half empty.
  const rows = useMemo(() => games
    .map((g) => {
      const reg = DAILY_GAME_MAP[g.key];
      if (!reg) return null;
      if (isUnlaunchedDaily(g.key, today)) return null;
      const retired = isRetiredDaily(g.key, today);
      // Unpack the lean server shape (see page.js) into named fields.
      const puzzles = (g.puzzles || []).map((x) => {
        const { y, m, d } = isoParts(x.d);
        return { num: x.n, live: x.d, rev: x.r || null, sunday: !!x.s, quizId: x.q || `${g.key}-${m}-${d}-${y % 100}` };
      });
      return { ...reg, puzzles, retired, shelf: retired ? RETIRED : reg.cat };
    })
    .filter(Boolean), [games, today]);

  // quizId -> "key:num", so server history lands on the right square.
  const byQuiz = useMemo(() => {
    const m = new Map();
    for (const g of rows) for (const p of g.puzzles) if (p.quizId) m.set(p.quizId, `${g.key}:${p.num}`);
    return m;
  }, [rows]);

  // Marks: this device first (instant), then the server history merged in.
  useEffect(() => {
    let alive = true;
    migrateJigSaves();
    const solved = new Set();
    const played = new Set();
    const started = new Set();
    for (const g of rows) {
      for (const p of g.puzzles) {
        const id = `${g.key}:${p.num}`;
        for (const k of keysFor(g.key, p.num, p.rev)) {
          let sv = null;
          try { sv = JSON.parse(localStorage.getItem(k) || 'null'); } catch (e) { sv = null; }
          if (!sv || typeof sv !== 'object') continue;
          const st = sv.status;
          if (st && st !== 'playing') played.add(id);
          if (st === 'won') solved.add(id);
          if (st === 'playing' && sv.t0) started.add(id);
        }
      }
    }
    for (const id of played) started.delete(id);
    setMarks({ solved, played, started, ready: true });

    fetchDayStatus().then((d) => {
      if (!alive || !d) return;
      const s2 = new Set(solved);
      const p2 = new Set(played);
      const o2 = new Set(started);
      const take = (list, set) => { for (const qid of list || []) { const k = byQuiz.get(qid); if (k) set.add(k); } };
      take(d.played, p2);
      take(d.completed, p2);
      take(d.completed, s2);
      take(d.abandoned, o2);
      take(d.inProgress, o2);
      for (const id of p2) o2.delete(id);
      setMarks({ solved: s2, played: p2, started: o2, ready: true });
    }).catch(() => {});
    return () => { alive = false; };
  }, [rows, byQuiz]);

  // Deep link: /archive?game=<key> (or the old /daily?archive=<key>, which the
  // redirect carries over) opens that game's calendar and brings it into view.
  useEffect(() => {
    let key = null;
    try {
      const sp = new URLSearchParams(window.location.search);
      key = sp.get('game') || sp.get('archive');
    } catch (e) { key = null; }
    if (!key || !rows.some((g) => g.key === key)) return undefined;
    setOpenKey(key);
    const t = setTimeout(() => {
      const el = document.getElementById(`arc-${key}`);
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 120);
    return () => clearTimeout(t);
  }, [rows]);

  const needle = q.trim().toLowerCase();
  const matches = (g) => !needle || g.name.toLowerCase().includes(needle) || (g.tag || '').toLowerCase().includes(needle);

  const isPlayed = (g, p) => marks.played.has(`${g.key}:${p.num}`);
  const playedOf = (g) => (marks.ready ? g.puzzles.filter((p) => isPlayed(g, p)).length : 0);

  // Shelves in the home's fixed order, games A to Z, retired last.
  const shelves = useMemo(() => {
    const order = [...CAT_FIXED];
    for (const g of rows) if (!order.includes(g.shelf) && g.shelf !== RETIRED) order.push(g.shelf);
    order.push(RETIRED);
    return order
      .map((c) => ({ cat: c, games: rows.filter((g) => g.shelf === c).sort((a, b) => a.name.localeCompare(b.name)) }))
      .filter((s) => s.games.length);
  }, [rows]);

  const shelfStat = (s) => {
    const total = s.games.reduce((n, g) => n + g.puzzles.length, 0);
    const done = s.games.reduce((n, g) => n + playedOf(g), 0);
    return { total, done, f: total ? done / total : 0 };
  };

  const totalBoards = rows.reduce((n, g) => n + g.puzzles.length, 0);
  const totalPlayed = marks.ready ? rows.reduce((n, g) => n + playedOf(g), 0) : null;
  const pct = totalPlayed != null && totalBoards ? Math.round((totalPlayed / totalBoards) * 100) : null;
  const liveGames = rows.filter((g) => !g.retired).length;

  const visible = shelves
    .filter((s) => cat === 'all' || s.cat === cat)
    .map((s) => ({ ...s, games: s.games.filter(matches) }))
    .filter((s) => s.games.length);

  const hrefFor = (g, p) => withTq(p.live === today && !g.retired ? g.href : `${g.href}?p=${p.num}`);

  return (
    <CircuitFrame label="Puzzle Archive">
      <style dangerouslySetInnerHTML={{ __html: CSS }} />
      <div className="arc">
        <section className="arc-top">
          <div className="arc-card">
            <h1>Puzzle Archive</h1>
            <p>{totalPlayed == null ? `${totalBoards.toLocaleString()} boards` : `${totalPlayed.toLocaleString()} of ${totalBoards.toLocaleString()} played`}</p>
            <div className="arc-cbar" aria-hidden="true"><span style={{ width: `${pct || 0}%` }} /></div>
          </div>
          <div className="arc-intro">
            <p className="arc-lede">
              Every board that has ever run on Mind Loft, kept by game and by day. Pick a game, pick a day, and play it.
            </p>
            <div className="arc-figs">
              <div><b>{totalBoards.toLocaleString()}</b><i>Boards</i></div>
              <div><b>{liveGames}</b><i>Daily Games</i></div>
              <div><b>{totalPlayed == null ? '0' : totalPlayed.toLocaleString()}</b><i>Played By You</i></div>
              <div><b>{pct == null ? '0%' : `${pct}%`}</b><i>Of The Archive</i></div>
            </div>
          </div>
        </section>

        <div className="arc-tools">
          <nav className="arc-chips" aria-label="Filter by category">
            <button type="button" className={'arc-chip all' + (cat === 'all' ? ' on' : '')} aria-pressed={cat === 'all'} onClick={() => setCat('all')}
              style={{ '--f': `${(pct || 0)}%` }}>
              <span>All Games</span><em>{rows.length}</em>
            </button>
            {shelves.map((s) => {
              const st = shelfStat(s);
              const ret = s.cat === RETIRED;
              return (
                <button key={s.cat} type="button" className={'arc-chip' + (ret ? ' ret' : '') + (cat === s.cat ? ' on' : '')} aria-pressed={cat === s.cat}
                  style={{ ...(ret ? null : hueVars(s.cat)), '--f': `${Math.round(st.f * 100)}%` }}
                  onClick={() => setCat(cat === s.cat ? 'all' : s.cat)}>
                  <span>{catLabel(s.cat)}</span><em>{marks.ready ? `${st.done} of ${st.total}` : st.total}</em>
                </button>
              );
            })}
          </nav>
          <label className="arc-search">
            <Search size={16} strokeWidth={2.4} aria-hidden="true" />
            <input type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Find a game" aria-label="Find a game" />
            {q ? <button type="button" onClick={() => setQ('')} aria-label="Clear search"><X size={14} strokeWidth={2.6} /></button> : null}
          </label>
        </div>

        <div className="arc-key" aria-hidden="true">
          <span><s className="arc-d solved" />Solved</span>
          <span><s className="arc-d played" />Played</span>
          <span><s className="arc-d started" />Started</span>
          <span><s className="arc-d" />Not Played</span>
          <span><s className="arc-d today" />Today</span>
          <span><s className="arc-d sun" />Sunday Edition</span>
        </div>

        {visible.length ? visible.map((s) => {
          const st = shelfStat(s);
          const ret = s.cat === RETIRED;
          return (
            <section key={s.cat} className={'arc-shelf' + (ret ? ' ret' : '')}>
              <div className="arc-head">
                <h2>{ret ? 'Retired' : catLabel(s.cat)}</h2>
                <span className="arc-headct">
                  {s.games.length} {s.games.length === 1 ? 'game' : 'games'}
                  {marks.ready ? <> · {st.done.toLocaleString()} of {st.total.toLocaleString()} played</> : null}
                </span>
                {ret ? <span className="arc-headnote">No new boards. Every past one still plays.</span> : null}
              </div>
              <div className="arc-grid">
                {s.games.map((g) => (
                  <GameCard key={g.key} g={g} marks={marks} today={today} hrefFor={hrefFor} done={playedOf(g)}
                    open={openKey === g.key} onToggle={() => setOpenKey(openKey === g.key ? null : g.key)} />
                ))}
              </div>
            </section>
          );
        }) : (
          <p className="arc-none">No game matches &ldquo;{q}&rdquo;. <button type="button" onClick={() => { setQ(''); setCat('all'); }}>Show every game</button></p>
        )}

        <nav className="arc-more" aria-label="More">
          <a href={withTq('/')}>Today&apos;s Puzzles</a>
          <a href={withTq('/circuits')}>Runs</a>
          <a href={withTq('/') + '#sty-quizzes'}>All Quizzes</a>
        </nav>
      </div>
    </CircuitFrame>
  );
}

function stateOf(marks, g, p) {
  const id = `${g.key}:${p.num}`;
  if (marks.solved.has(id)) return 'solved';
  if (marks.played.has(id)) return 'played';
  if (marks.started.has(id)) return 'started';
  return '';
}
const STATE_WORD = { solved: 'Solved', played: 'Played', started: 'Started', '': 'Not played' };

function GameCard({ g, marks, today, hrefFor, done, open, onToggle }) {
  const total = g.puzzles.length;
  const frac = total ? done / total : 0;
  const todays = g.retired ? null : g.puzzles.find((p) => p.live === today) || null;
  // Newest board first in g.puzzles; the strip reads oldest to newest.
  const strip = g.puzzles.slice(0, STRIP).reverse();
  const missed = marks.ready ? g.puzzles.find((p) => p.live !== today && !marks.played.has(`${g.key}:${p.num}`)) : null;
  const canOpen = total > STRIP || open;

  return (
    <article id={`arc-${g.key}`} className={'arc-g' + (open ? ' open' : '') + (marks.ready && total && done === total ? ' full' : '')} style={hueVars(g.cat)}>
      <div className="arc-gbody">
        <div className="arc-gtop">
          <a className="arc-gnm" href={hrefFor(g, todays || g.puzzles[0])}>
            <GameGlyph gameKey={g.key} size={18} className="arc-gi" />
            <span>{g.name}</span>
          </a>
          {todays ? (
            <a className="arc-go" href={hrefFor(g, todays)} aria-label={`Play today's ${g.name}`}>Today <ArrowRight size={12} strokeWidth={2.8} /></a>
          ) : <span className="arc-gnote">{g.retired ? 'Retired' : 'No board today'}</span>}
        </div>
        <p className="arc-gt">{g.tag}</p>

        <div className="arc-strip" role="list" aria-label={`${g.name}, the last ${strip.length} boards`}>
          {strip.map((p) => {
            const st = stateOf(marks, g, p);
            const isToday = p.live === today;
            return (
              <a key={p.num} role="listitem" href={hrefFor(g, p)}
                className={'arc-d ' + st + (p.sunday ? ' sun' : '') + (isToday ? ' today' : '')}
                title={`${shortDay(p.live)} · No. ${p.num}${p.sunday ? ' · Sunday Edition' : ''} · ${isToday ? 'Today' : STATE_WORD[st]}`}
                aria-label={`${g.name} No. ${p.num}, ${shortDay(p.live)}${isToday ? ', today' : ''}, ${STATE_WORD[st].toLowerCase()}`}>
                {isoParts(p.live).d}
              </a>
            );
          })}
        </div>

        {open ? <Calendar g={g} marks={marks} today={today} hrefFor={hrefFor} missed={missed} /> : null}
      </div>

      <div className="arc-band" style={{ '--f': `${Math.round(frac * 100)}%` }}>
        <span className="arc-bct">{marks.ready ? <><b>{done}</b> of {total} played</> : <>{total} {total === 1 ? 'board' : 'boards'}</>}</span>
        {canOpen ? (
          <button type="button" className="arc-all" aria-expanded={open} aria-controls={`arc-cal-${g.key}`} onClick={onToggle}>
            {open ? 'Close calendar' : `All ${total} days`}
          </button>
        ) : null}
      </div>
    </article>
  );
}

function Calendar({ g, marks, today, hrefFor, missed }) {
  const byISO = useMemo(() => {
    const m = new Map();
    for (const p of g.puzzles) if (p.live) m.set(p.live, p);
    return m;
  }, [g]);
  const isos = g.puzzles.map((p) => p.live).filter(Boolean).sort();
  const earliest = isos.length ? isos[0].slice(0, 7) : today.slice(0, 7);
  const latest = isos.length ? isos[isos.length - 1].slice(0, 7) : today.slice(0, 7);
  const [month, setMonth] = useState(latest);
  const prev = addMonths(month, -1);
  const canPrev = prev >= earliest;
  const canNext = month < latest;

  const grid = (ym, second) => {
    const [yy, mm] = ym.split('-').map(Number);
    const lead = new Date(Date.UTC(yy, mm - 1, 1)).getUTCDay();
    const dim = new Date(Date.UTC(yy, mm, 0)).getUTCDate();
    const cells = [];
    for (let k = 0; k < lead; k++) cells.push(null);
    for (let d = 1; d <= dim; d++) cells.push(d);
    const inMonth = g.puzzles.filter((p) => p.live && p.live.startsWith(ym));
    const playedIn = marks.ready ? inMonth.filter((p) => marks.played.has(`${g.key}:${p.num}`)).length : null;
    return (
      <div className={'arc-mo' + (second ? ' second' : '')} key={ym}>
        <div className="arc-mohd">
          <span>{MONTHS[mm - 1]} {yy}</span>
          {inMonth.length ? <em>{playedIn == null ? `${inMonth.length} boards` : `${playedIn} of ${inMonth.length}`}</em> : null}
        </div>
        <div className="arc-cal">
          {WD1.map((w, i) => <span className="wd" key={`w${i}`}>{w}</span>)}
          {cells.map((d, i) => {
            if (d == null) return <span className="c pad" key={`e${i}`} />;
            const iso = `${ym}-${String(d).padStart(2, '0')}`;
            const p = byISO.get(iso);
            if (!p) return <span className="c none" key={iso}>{d}</span>;
            const st = stateOf(marks, g, p);
            const isToday = iso === today;
            return (
              <a key={iso} href={hrefFor(g, p)} className={'c arc-d ' + st + (p.sunday ? ' sun' : '') + (isToday ? ' today' : '')}
                title={`${shortDay(iso)} · No. ${p.num}${p.sunday ? ' · Sunday Edition' : ''} · ${isToday ? 'Today' : STATE_WORD[st]}`}>
                {d}
              </a>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div className="arc-calwrap" id={`arc-cal-${g.key}`}>
      <div className="arc-calnav">
        <button type="button" onClick={() => setMonth((m) => addMonths(m, -1))} disabled={!canPrev} aria-label="Earlier month"><ChevronLeft size={16} strokeWidth={2.6} /></button>
        <button type="button" onClick={() => setMonth((m) => addMonths(m, 1))} disabled={!canNext} aria-label="Later month"><ChevronRight size={16} strokeWidth={2.6} /></button>
        {missed ? (
          <a className="arc-missed" href={hrefFor(g, missed)}>
            Newest unplayed: No. {missed.num}, {shortDay(missed.live)} <ArrowRight size={12} strokeWidth={2.8} />
          </a>
        ) : marks.ready ? <span className="arc-allin">Every past board played.</span> : null}
      </div>
      <div className="arc-mos">
        {canPrev ? grid(prev, true) : null}
        {grid(month, false)}
      </div>
    </div>
  );
}

// NOTE: a JS template literal, so no backticks in comments. Light-register
// rules carry the boot guard (the register is decided before first paint), so
// a dark reader never sees one frame of them.
//
// THE PASTEL TOKENS, set on every element that carries --cfull:
//   --pst   the site pastel (raw step on dark, 60/40 with white on light)
//   --pst2  the pale pastel (played squares, the unfilled half of a band)
//   --gi    the glyph colour (the pastel on dark, the as-ink step on light)
// Mono (data-stage-color=mono) folds all three to greys.
const CSS = `
.arc{--ln:1px solid var(--stg-ink);--pk:#0b0d12;display:flex;flex-direction:column;gap:26px;}
.arc-shelf,.arc-g,.arc-chip{--pst:var(--cfull,var(--stg-surf2));--pst2:color-mix(in srgb,var(--cfull,var(--stg-surf2)) 32%,var(--stg-surf));--pb:color-mix(in srgb,var(--cfull,#c9ced8) 45%,#fff);--pdp:color-mix(in srgb,var(--cfull,#c9ced8) 45%,#fff);--gi:var(--cfull,var(--stg-ink));}
html:not([data-stage-boot='dark']) [data-stage-theme='light'] .arc-shelf,
html:not([data-stage-boot='dark']) [data-stage-theme='light'] .arc-g,
html:not([data-stage-boot='dark']) [data-stage-theme='light'] .arc-chip{
  --pst:color-mix(in srgb,var(--cfull,#e6e9ef) 60%,#fff);--pst2:color-mix(in srgb,var(--cfull,#e6e9ef) 22%,#fff);--pb:var(--pst2);--pdp:color-mix(in srgb,var(--cfull,#e6e9ef) 30%,#fff);--gi:var(--cink,var(--stg-ink));}
html[data-stage-color='mono']:not(#arc-x) .arc-shelf,
html[data-stage-color='mono']:not(#arc-x) .arc-g,
html[data-stage-color='mono']:not(#arc-x) .arc-chip{
  --pst:color-mix(in srgb,var(--stg-ink) 18%,var(--stg-surf));--pst2:color-mix(in srgb,var(--stg-ink) 7%,var(--stg-surf));--pb:var(--pst2);--pdp:var(--pst2);--pk:var(--stg-ink);--gi:var(--stg-ink);}
.arc-key{--pst:#b1e5fd;--pdp:#e1f4fe;--pk:#0b0d12;}
.arc-chip.ret,.arc-chip.all{--pst:color-mix(in srgb,var(--stg-ink) 16%,var(--stg-surf));}

/* THE TOP: the ink card (the home's All Puzzles card) beside the lede */
.arc-top{display:grid;grid-template-columns:minmax(260px,330px) minmax(0,1fr);gap:28px;align-items:center;}
.arc-card{background:var(--stg-ink);color:var(--stg-ground);border-radius:14px;padding:20px 20px 18px;}
.arc-card h1{margin:0;font-size:clamp(26px,3.4vw,32px);font-weight:800;letter-spacing:-0.02em;line-height:1.1;color:inherit;}
.arc-card p{margin:8px 0 0;font-size:14px;font-weight:700;font-variant-numeric:tabular-nums;opacity:.92;}
.arc-cbar{height:8px;border-radius:999px;background:color-mix(in srgb,var(--stg-ground) 22%,transparent);margin-top:12px;overflow:hidden;}
.arc-cbar span{display:block;height:100%;min-width:8px;background:var(--stg-ground);border-radius:999px;transition:width .5s cubic-bezier(.2,.7,.3,1);}
.arc-lede{margin:0;font-size:15.5px;font-weight:600;line-height:1.55;max-width:58ch;color:var(--stg-ink2,var(--stg-ink));}
.arc-figs{display:flex;gap:30px;margin-top:16px;flex-wrap:wrap;}
.arc-figs b{display:block;font-size:22px;font-weight:800;letter-spacing:-0.02em;line-height:1.1;color:var(--stg-ink);font-variant-numeric:tabular-nums;}
.arc-figs i{font-style:normal;display:block;font-size:12px;font-weight:600;color:var(--stg-mute);margin-top:3px;}

/* THE TOOLS: chips that fill like the home index, and a search pill */
.arc-tools{display:flex;gap:14px;align-items:flex-start;flex-wrap:wrap;margin-top:-4px;}
.arc-chips{display:flex;flex-wrap:wrap;gap:8px;flex:1 1 520px;min-width:0;}
.arc-chip{position:relative;overflow:hidden;isolation:isolate;display:inline-flex;align-items:center;gap:10px;font:inherit;font-size:13.5px;font-weight:800;
  color:var(--stg-ink);background:var(--stg-surf);border:var(--ln);border-radius:12px;padding:7px 12px;cursor:pointer;line-height:1.2;}
.arc-chip::before{content:'';position:absolute;left:0;bottom:0;height:4px;width:var(--f,0%);background:var(--pst);z-index:-1;transition:width .5s cubic-bezier(.2,.7,.3,1);}
html:not([data-stage-boot='dark']) [data-stage-theme='light'] .arc-chip::before{top:0;height:auto;}
.arc-chip em{font-style:normal;font-size:12px;font-weight:600;font-variant-numeric:tabular-nums;white-space:nowrap;}
.arc-chip:hover{filter:brightness(.97);}
.arc-chip.on{background:var(--stg-ink);color:var(--stg-ground);}
.arc-chip.on::before{display:none;}
.arc-search{display:flex;align-items:center;gap:8px;height:38px;padding:0 14px;border:var(--ln);border-radius:999px;background:var(--stg-surf);color:var(--stg-ink);flex:0 1 260px;min-width:200px;box-sizing:border-box;}
.arc-search input{flex:1;min-width:0;border:0;background:none;outline:none;font:inherit;font-size:14px;font-weight:600;color:var(--stg-ink);}
.arc-search input::placeholder{color:var(--stg-mute);}
.arc-search input::-webkit-search-cancel-button{display:none;}
.arc-search:focus-within{box-shadow:0 0 0 1px var(--stg-ink);}
.arc-search button{border:0;background:none;color:var(--stg-ink);cursor:pointer;padding:2px;display:flex;border-radius:50%;}

/* THE KEY */
.arc-key{display:flex;flex-wrap:wrap;gap:8px 18px;margin-top:-10px;font-size:12.5px;font-weight:600;color:var(--stg-ink2,var(--stg-ink));}
.arc-key span{display:inline-flex;align-items:center;gap:7px;}
.arc-key .arc-d{width:16px;height:16px;border-radius:5px;}

/* SHELVES */
.arc-head{display:flex;align-items:baseline;gap:6px 14px;margin-bottom:12px;flex-wrap:wrap;}
.arc-head h2{margin:0;font-size:26px;font-weight:800;letter-spacing:-0.015em;line-height:1.25;color:var(--stg-ink);}
.arc-headct{font-size:13px;font-weight:600;color:var(--stg-mute);font-variant-numeric:tabular-nums;}
.arc-headnote{font-size:13px;font-weight:600;color:var(--stg-mute);}
.arc-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(280px,1fr));gap:12px;}

/* THE CARD: the home tile, with the archive's days and a pastel band */
.arc-g{display:flex;flex-direction:column;min-width:0;background:var(--stg-surf);border:var(--ln);border-radius:12px;overflow:hidden;color:var(--stg-ink);}
.arc-g.open{grid-column:1/-1;}
.arc-gbody{display:flex;flex-direction:column;min-width:0;padding:10px 12px 12px;flex:1;}
.arc-gtop{display:flex;align-items:center;gap:10px;}
.arc-gnm{display:flex;align-items:center;gap:7px;min-width:0;flex:1;font-size:16px;font-weight:800;letter-spacing:-0.01em;color:var(--stg-ink);text-decoration:none;}
.arc-gnm span{overflow:hidden;text-overflow:ellipsis;white-space:nowrap;padding-bottom:.16em;margin-bottom:-.16em;}
.arc-gnm:hover span{text-decoration:underline;text-underline-offset:3px;}
.arc-gi{flex:none;color:var(--gi);}
.arc-go{flex:none;display:inline-flex;align-items:center;gap:4px;padding:4px 10px;border-radius:999px;background:var(--stg-ink);color:var(--stg-ground);
  font-size:12px;font-weight:800;text-decoration:none;line-height:1.2;}
.arc-go:hover{filter:brightness(1.25);}
.arc-gnote{flex:none;font-size:12px;font-weight:600;color:var(--stg-mute);}
.arc-gt{margin:2px 0 10px;font-size:12.5px;font-weight:600;color:var(--stg-ink2,var(--stg-ink));opacity:.85;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;}

.arc-band{position:relative;isolation:isolate;display:flex;align-items:center;justify-content:space-between;gap:10px;min-height:34px;box-sizing:border-box;
  padding:5px 8px 5px 12px;border-top:var(--ln);background:var(--pb);color:var(--pk);font-size:12.5px;font-weight:600;}
.arc-band::before{content:'';position:absolute;inset:0 auto 0 0;width:var(--f,0%);background:var(--pst);z-index:-1;transition:width .5s cubic-bezier(.2,.7,.3,1);}
.arc-bct{font-variant-numeric:tabular-nums;white-space:nowrap;}
.arc-bct b{font-weight:800;}
.arc-all{font:inherit;font-size:12px;font-weight:800;color:var(--pk);background:transparent;border:1px solid var(--pk);border-radius:999px;padding:3px 10px;cursor:pointer;white-space:nowrap;}
.arc-all:hover,.arc-g.open .arc-all{background:var(--pk);color:var(--pb);}

/* DAY SQUARES. No dashed or dotted marks (owner rule). */
.arc-strip{display:flex;gap:4px;}
.arc-d{position:relative;display:flex;align-items:center;justify-content:center;text-decoration:none;font-size:10.5px;font-weight:700;font-variant-numeric:tabular-nums;
  color:var(--stg-ink2,var(--stg-ink));background:color-mix(in srgb,var(--stg-ink) 7%,var(--stg-surf));border:1px solid transparent;border-radius:5px;box-sizing:border-box;}
.arc-strip .arc-d{flex:1 1 0;min-width:0;max-width:30px;aspect-ratio:1;}
a.arc-d:hover{border-color:var(--stg-ink);color:var(--stg-ink);}
.arc-d.solved{background:var(--pst);border-color:var(--stg-ink);color:var(--pk);font-weight:800;}
.arc-d.played{background:var(--pdp);color:var(--pk);}
.arc-d.started{background:linear-gradient(135deg,var(--pst) 0 42%,color-mix(in srgb,var(--stg-ink) 7%,var(--stg-surf)) 42%);}
.arc-d.today{box-shadow:0 0 0 2px var(--stg-surf),0 0 0 3.5px var(--stg-ink);}
.arc-key .arc-d.today{background:var(--stg-surf);}
.arc-key .arc-d.sun{background:var(--stg-surf);border-color:var(--stg-line,#d5d9e0);}
.arc-d.sun::after{content:'';position:absolute;right:1.5px;top:1.5px;width:3.5px;height:3.5px;border-radius:50%;background:var(--stg-ink);}
.arc-d.solved.sun::after{background:var(--pk);}
.arc-d:focus-visible,.arc-gnm:focus-visible,.arc-go:focus-visible,.arc-all:focus-visible,.arc-chip:focus-visible,.arc-missed:focus-visible,.arc-calnav button:focus-visible,.arc-more a:focus-visible{outline:2px solid var(--stg-ink);outline-offset:2px;}

/* THE CALENDAR */
.arc-calwrap{margin-top:14px;padding-top:14px;border-top:var(--ln);}
.arc-calnav{display:flex;align-items:center;gap:8px;flex-wrap:wrap;margin-bottom:12px;}
.arc-calnav button{display:inline-grid;place-items:center;width:32px;height:32px;padding:0;border-radius:50%;border:var(--ln);background:var(--stg-surf);color:var(--stg-ink);cursor:pointer;}
.arc-calnav button:hover:not(:disabled){background:var(--stg-ink);color:var(--stg-ground);}
.arc-calnav button:disabled{opacity:.3;cursor:default;}
.arc-missed{margin-left:auto;display:inline-flex;align-items:center;gap:5px;padding:6px 12px;border-radius:999px;background:var(--stg-ink);color:var(--stg-ground);font-size:12.5px;font-weight:800;text-decoration:none;}
.arc-missed:hover{filter:brightness(1.25);}
.arc-allin{margin-left:auto;font-size:13px;font-weight:700;color:var(--stg-ink);}
.arc-mos{display:grid;grid-template-columns:repeat(2,minmax(0,300px));gap:36px;}
.arc-mohd{display:flex;align-items:baseline;justify-content:space-between;gap:10px;margin-bottom:8px;}
.arc-mohd span{font-size:15px;font-weight:800;color:var(--stg-ink);}
.arc-mohd em{font-style:normal;font-size:12px;font-weight:600;color:var(--stg-mute);font-variant-numeric:tabular-nums;}
.arc-cal{display:grid;grid-template-columns:repeat(7,minmax(0,1fr));gap:5px;}
.arc-cal .wd{text-align:center;font-size:11px;font-weight:700;color:var(--stg-mute);padding-bottom:2px;}
.arc-cal .c{aspect-ratio:1;font-size:12px;}
.arc-cal .c.pad{visibility:hidden;}
.arc-cal .c.none{display:flex;align-items:center;justify-content:center;color:var(--stg-mute);opacity:.45;font-weight:600;}

.arc-none{margin:0;font-size:14px;font-weight:600;color:var(--stg-ink);}
.arc-none button{font:inherit;font-weight:800;color:var(--stg-ink);background:none;border:0;padding:0;cursor:pointer;text-decoration:underline;text-underline-offset:3px;}
.arc-more{display:flex;flex-wrap:wrap;gap:8px;padding-top:20px;border-top:var(--ln);}
.arc-more a{display:inline-flex;align-items:center;padding:7px 14px;border:var(--ln);border-radius:999px;color:var(--stg-ink);font-size:13.5px;font-weight:800;text-decoration:none;}
.arc-more a:hover{background:var(--stg-ink);color:var(--stg-ground);}

@media (max-width:820px){
  .arc-top{grid-template-columns:minmax(0,1fr);gap:16px;}
}
@media (max-width:720px){
  .arc{gap:22px;}
  .arc-tools{flex-direction:column;flex-wrap:nowrap;align-items:stretch;}
  .arc-chips{flex-wrap:nowrap;overflow-x:auto;scrollbar-width:none;flex:none;padding:1px 1px 2px;}
  .arc-chips::-webkit-scrollbar{display:none;}
  .arc-chip{flex:none;}
  .arc-search{flex:none;min-width:0;}
  .arc-figs{gap:14px 22px;}
  .arc-figs b{font-size:19px;}
  .arc-head h2{font-size:22px;}
  .arc-grid{grid-template-columns:1fr;}
  .arc-mos{grid-template-columns:minmax(0,1fr);}
  .arc-mo.second{display:none;}
  .arc-missed,.arc-allin{margin-left:0;flex-basis:100%;justify-content:center;}
}
@media (prefers-reduced-motion:reduce){.arc-cbar span,.arc-chip::before,.arc-band::before{transition:none;}}
`;
