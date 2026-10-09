'use client';

// THE PUZZLE ARCHIVE, in the home's stage style (owner, 2026-10-09). Replaces
// the old /daily hub (navy cards, a leaderboard per row, one daily-game read
// per game, so ~130 requests a load). This page asks for ONE thing, the
// viewer's play history (daily-status, the same cached client the home uses),
// and reads the per-puzzle saves already on this device.
//
// THE SHAPE. CircuitFrame (the cap, the register switch, the stage footer),
// then a hero, a strip of category chips and a search box, then one shelf per
// category in the home's fixed order (Words, Numbers, Logic, Sudoku, Trivia,
// Geography, then the rest) with games A to Z inside, exactly like the home.
// Retired games sit on a shelf of their own at the foot.
//
// A CARD is the home tile grown by two things: how much of that game's archive
// the viewer has played (a count and a bar in the category step), and the last
// fourteen boards as day squares, each one a link to that board. "All days"
// opens the card across the whole row with a two-month calendar of every
// board, plus a link straight to the newest board the viewer has not played.
//
// MARKS. Solved fills the square with the category step, played but not solved
// rings it, started (a save with a first move, never a page merely opened: the
// t0 rule) dashes it. Server rows (daily-status) and this device's saves are
// merged, so a board played on another device still shows.
//
// NOTHING HERE MAY NAME AN ANSWER. Only dates, numbers and the Sunday flag
// reach this component.

import { useEffect, useMemo, useState } from 'react';
import { ArrowRight, Search, X } from 'lucide-react';
import CircuitFrame from '../circuits/CircuitFrame';
import GameGlyph from '../GameGlyph';
import { fetchDayStatus } from '../useDayStats';
import { DAILY_GAME_MAP, isRetiredDaily } from '@/lib/daily-games';
import { categoryColor, categoryColorLight, categoryAccentInkLight, categoryOnrampLight, RAMP_INK } from '@/lib/category-ramp';
import { useThemeQs } from '@/lib/stage-theme';

const MONO = "'Manrope', ui-monospace, SFMono-Regular, Menlo, monospace";
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

// Hues for both registers on the element; the stylesheet picks one, so a
// server-rendered card never repaints under the reader on first paint.
function hueVars(cat) {
  return {
    '--cc-dk': categoryColor(cat),
    '--cc-lt': categoryColorLight(cat),
    '--cci-lt': categoryAccentInkLight(cat),
    '--cco-dk': RAMP_INK,
    '--cco-lt': categoryOnrampLight(cat),
  };
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

  // Shelves in the home's fixed order, games A to Z, retired last.
  const shelves = useMemo(() => {
    const order = [...CAT_FIXED];
    for (const g of rows) if (!order.includes(g.shelf) && g.shelf !== RETIRED) order.push(g.shelf);
    order.push(RETIRED);
    return order
      .map((c) => ({ cat: c, games: rows.filter((g) => g.shelf === c).sort((a, b) => a.name.localeCompare(b.name)) }))
      .filter((s) => s.games.length);
  }, [rows]);

  const isPlayed = (g, p) => marks.played.has(`${g.key}:${p.num}`);
  const totalBoards = rows.reduce((n, g) => n + g.puzzles.length, 0);
  const totalPlayed = marks.ready ? rows.reduce((n, g) => n + g.puzzles.filter((p) => isPlayed(g, p)).length, 0) : null;
  const pct = totalPlayed != null && totalBoards ? Math.round((totalPlayed / totalBoards) * 100) : null;

  const visible = shelves
    .filter((s) => cat === 'all' || s.cat === cat)
    .map((s) => ({ ...s, games: s.games.filter(matches) }))
    .filter((s) => s.games.length);

  const hrefFor = (g, p) => withTq(p.live === today && !g.retired ? g.href : `${g.href}?p=${p.num}`);

  return (
    <CircuitFrame label="Puzzle archive">
      <style dangerouslySetInnerHTML={{ __html: CSS }} />
      <div className="arc">
        <section className="arc-hero">
          <p className="arc-eb">The archive</p>
          <h1 className="arc-h1">Every puzzle, every day</h1>
          <p className="arc-lede">
            Every board that has ever run on Mind Loft, kept by game and by day. Pick a game, pick a day, and play it.
            The squares show what you have already solved, played or started.
          </p>
          <div className="arc-figs">
            <div><b>{totalBoards.toLocaleString()}</b><i>boards</i></div>
            <div><b>{rows.filter((g) => !g.retired).length}</b><i>daily games</i></div>
            <div><b>{totalPlayed == null ? '—' : totalPlayed.toLocaleString()}</b><i>played by you</i></div>
            <div><b>{pct == null ? '—' : `${pct}%`}</b><i>of the archive</i></div>
          </div>
        </section>

        <div className="arc-tools">
          <nav className="arc-chips" aria-label="Filter by category">
            <button type="button" className={cat === 'all' ? 'on' : ''} aria-pressed={cat === 'all'} onClick={() => setCat('all')}>
              All <em>{rows.length}</em>
            </button>
            {shelves.map((s) => (
              <button key={s.cat} type="button" className={cat === s.cat ? 'on' : ''} aria-pressed={cat === s.cat}
                style={s.cat === RETIRED ? undefined : hueVars(s.cat)} onClick={() => setCat(cat === s.cat ? 'all' : s.cat)}>
                {s.cat === RETIRED ? null : <i aria-hidden="true" />}
                {catLabel(s.cat)} <em>{s.games.length}</em>
              </button>
            ))}
          </nav>
          <label className="arc-search">
            <Search size={15} strokeWidth={2.4} aria-hidden="true" />
            <input type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Find a game" aria-label="Find a game" />
            {q ? <button type="button" onClick={() => setQ('')} aria-label="Clear search"><X size={14} strokeWidth={2.6} /></button> : null}
          </label>
        </div>

        <div className="arc-key" aria-hidden="true">
          <span><s className="k solved" />Solved</span>
          <span><s className="k played" />Played</span>
          <span><s className="k started" />Started</span>
          <span><s className="k" />Not played</span>
          <span><s className="k sun" />Sunday Edition</span>
        </div>

        {visible.length ? visible.map((s) => (
          <section key={s.cat} className={'arc-shelf' + (s.cat === RETIRED ? ' ret' : '')} style={s.cat === RETIRED ? undefined : hueVars(s.cat)}>
            <div className="arc-head">
              <h2>{s.cat === RETIRED ? 'Retired' : catLabel(s.cat)}</h2>
              <b>{s.games.length}</b>
              {s.cat === RETIRED ? <span className="arc-headnote">No new boards. Every past one still plays.</span> : null}
            </div>
            <div className="arc-grid">
              {s.games.map((g) => (
                <GameCard key={g.key} g={g} marks={marks} today={today} hrefFor={hrefFor}
                  open={openKey === g.key} onToggle={() => setOpenKey(openKey === g.key ? null : g.key)} />
              ))}
            </div>
          </section>
        )) : (
          <p className="arc-none">No game matches &ldquo;{q}&rdquo;. <button type="button" onClick={() => { setQ(''); setCat('all'); }}>Show every game</button></p>
        )}

        <nav className="arc-more" aria-label="More">
          <span>More puzzles:</span>
          <a href={withTq('/')}>Today&apos;s puzzles</a>
          <a href={withTq('/circuits')}>Circuits</a>
          <a href={withTq('/quizzes/all')}>All quizzes</a>
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

function GameCard({ g, marks, today, hrefFor, open, onToggle }) {
  const total = g.puzzles.length;
  const done = marks.ready ? g.puzzles.filter((p) => marks.played.has(`${g.key}:${p.num}`)).length : 0;
  const frac = total ? done / total : 0;
  const todays = g.retired ? null : g.puzzles.find((p) => p.live === today) || null;
  // Newest board first in g.puzzles; the strip reads oldest to newest.
  const strip = g.puzzles.slice(0, STRIP).reverse();
  const missed = marks.ready ? g.puzzles.find((p) => p.live !== today && !marks.played.has(`${g.key}:${p.num}`)) : null;

  return (
    <article id={`arc-${g.key}`} className={'arc-g' + (open ? ' open' : '') + (marks.ready && done === total ? ' full' : '')}>
      <div className="arc-gtop">
        <a className="arc-gnm" href={hrefFor(g, todays || g.puzzles[0])}>
          <GameGlyph gameKey={g.key} size={20} className="arc-gi" />
          <span>{g.name}</span>
        </a>
        <span className="arc-gct">{marks.ready ? <><b>{done}</b> of {total}</> : <>{total} {total === 1 ? 'board' : 'boards'}</>}</span>
      </div>
      <p className="arc-gt">{g.tag}</p>
      <div className="arc-bar" aria-hidden="true"><span style={{ width: `${Math.round(frac * 100)}%` }} /></div>

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

      <div className="arc-gfoot">
        {todays ? (
          <a className="arc-go" href={hrefFor(g, todays)}>Today&apos;s board <ArrowRight size={13} strokeWidth={2.6} /></a>
        ) : <span className="arc-gnote">{g.retired ? 'Retired' : 'No board today'}</span>}
        {total > STRIP || open ? (
          <button type="button" className="arc-all" aria-expanded={open} aria-controls={`arc-cal-${g.key}`} onClick={onToggle}>
            {open ? 'Close calendar' : `All ${total} days`}
          </button>
        ) : null}
      </div>

      {open ? <Calendar g={g} marks={marks} today={today} hrefFor={hrefFor} missed={missed} /> : null}
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
        <button type="button" onClick={() => setMonth((m) => addMonths(m, -1))} disabled={!canPrev} aria-label="Earlier month">&lsaquo;</button>
        <button type="button" onClick={() => setMonth((m) => addMonths(m, 1))} disabled={!canNext} aria-label="Later month">&rsaquo;</button>
        {missed ? (
          <a className="arc-missed" href={hrefFor(g, missed)}>
            Newest one you have not played: No. {missed.num}, {shortDay(missed.live)} <ArrowRight size={12} strokeWidth={2.6} />
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
// rules carry the boot guard (see CLAUDE.md, the register is decided before
// first paint), so a dark reader never sees one frame of them.
const CSS = `
.arc{display:flex;flex-direction:column;gap:26px;}
.arc-shelf,.arc-g,.arc-chips button{--cc:var(--cc-dk,var(--stg-ink2));--cci:var(--cc-dk,var(--stg-ink2));--cco:var(--cco-dk,#08222e);}
html:not([data-stage-boot='dark']) [data-stage-theme='light'] .arc-shelf,
html:not([data-stage-boot='dark']) [data-stage-theme='light'] .arc-g,
html:not([data-stage-boot='dark']) [data-stage-theme='light'] .arc-chips button{--cc:var(--cc-lt,var(--stg-ink2));--cci:var(--cci-lt,var(--stg-ink2));--cco:var(--cco-lt,#fff);}

.arc-hero{position:relative;padding-left:16px;}
.arc-hero::before{content:'';position:absolute;left:0;top:3px;bottom:3px;width:4px;background:var(--stg-acc);border-radius:2px;}
.arc-eb{margin:0;font-family:${MONO};font-size:9.5px;letter-spacing:.15em;text-transform:uppercase;color:var(--stg-mute);}
.arc-h1{margin:7px 0 0;font-size:clamp(26px,4.2vw,38px);font-weight:800;letter-spacing:-0.025em;line-height:1.06;color:var(--stg-ink);text-wrap:balance;}
.arc-lede{margin:12px 0 0;font-size:15px;font-weight:600;line-height:1.58;max-width:64ch;color:var(--stg-ink2);}
.arc-figs{display:flex;gap:26px;margin-top:18px;flex-wrap:wrap;}
.arc-figs b{display:block;font-size:22px;font-weight:800;letter-spacing:-0.02em;line-height:1;color:var(--stg-ink);font-variant-numeric:tabular-nums;}
.arc-figs i{font-style:normal;display:block;font-family:${MONO};font-size:9px;letter-spacing:.14em;text-transform:uppercase;color:var(--stg-mute);margin-top:5px;}

.arc-tools{display:flex;gap:12px;align-items:center;flex-wrap:wrap;margin-top:-6px;}
.arc-chips{display:flex;flex-wrap:wrap;gap:6px;flex:1 1 420px;min-width:0;}
.arc-chips button{display:inline-flex;align-items:center;gap:6px;font-family:${MONO};font-size:10px;letter-spacing:.11em;text-transform:uppercase;font-weight:700;
  color:var(--stg-ink2);background:var(--stg-surf);border:1px solid var(--stg-line);border-radius:7px;padding:7px 10px;cursor:pointer;line-height:1;}
.arc-chips button i{width:8px;height:8px;border-radius:2px;background:var(--cc);flex:none;}
.arc-chips button em{font-style:normal;color:var(--stg-mute);font-variant-numeric:tabular-nums;}
.arc-chips button:hover{border-color:var(--stg-line2);color:var(--stg-ink);}
.arc-chips button.on{border-color:var(--cc,var(--stg-acc));color:var(--stg-ink);box-shadow:inset 0 0 0 1px var(--cc,var(--stg-acc));}
.arc-chips button:first-child.on{--cc:var(--stg-acc);}
.arc-search{display:flex;align-items:center;gap:7px;height:36px;padding:0 10px;border:1px solid var(--stg-line);border-radius:8px;background:var(--stg-surf);color:var(--stg-mute);flex:0 1 240px;min-width:180px;}
.arc-search:focus-within{border-color:var(--stg-acc);}
.arc-search input{flex:1;min-width:0;border:0;background:none;outline:none;font:inherit;font-size:13.5px;font-weight:600;color:var(--stg-ink);}
.arc-search input::placeholder{color:var(--stg-mute);}
.arc-search input::-webkit-search-cancel-button{display:none;}
.arc-search button{border:0;background:none;color:var(--stg-mute);cursor:pointer;padding:2px;display:flex;border-radius:4px;}
.arc-search button:hover{color:var(--stg-ink);}

.arc-key{display:flex;flex-wrap:wrap;gap:6px 16px;margin-top:-12px;font-size:11.5px;font-weight:600;color:var(--stg-mute);--cc:var(--stg-acc);--cco:var(--stg-onramp,#08222e);}
.arc-key span{display:inline-flex;align-items:center;gap:6px;}
.arc-key .k{display:inline-block;width:12px;height:12px;border-radius:3px;background:var(--stg-cell,var(--stg-surf2));border:1px solid var(--stg-cell-line,var(--stg-line));}
.arc-key .k.solved{background:var(--cc);border-color:var(--cc);}
.arc-key .k.played{border:2px solid var(--cc);}
.arc-key .k.started{border:1.5px dashed var(--cc);}
.arc-key .k.sun{position:relative;}
.arc-key .k.sun::after{content:'';position:absolute;right:1px;top:1px;width:4px;height:4px;border-radius:50%;background:var(--stg-warn,#e8b43a);}

.arc-shelf{position:relative;padding-left:16px;}
.arc-shelf::before{content:'';position:absolute;left:0;top:2px;bottom:2px;width:4px;border-radius:2px;background:var(--cc);}
.arc-shelf.ret::before{background:var(--stg-line2);}
.arc-head{display:flex;align-items:baseline;gap:11px;margin-bottom:10px;flex-wrap:wrap;}
.arc-head h2{margin:0;font-size:13px;font-weight:800;letter-spacing:.05em;text-transform:uppercase;color:var(--stg-ink);}
.arc-head b{font-family:${MONO};font-size:12px;font-weight:700;color:var(--stg-ink2);font-variant-numeric:tabular-nums;}
.arc-headnote{font-size:12px;font-weight:600;color:var(--stg-mute);}
.arc-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(270px,1fr));gap:10px;}

.arc-g{display:flex;flex-direction:column;min-width:0;background:var(--stg-surf);border:1px solid var(--stg-line);border-radius:8px;padding:11px 12px 10px;color:var(--stg-ink);
  transition:border-color .12s,box-shadow .12s;}
.arc-g:hover{border-color:var(--cc);box-shadow:0 3px 10px rgba(var(--stg-lift,11,15,26),.08);}
.arc-g.open{grid-column:1/-1;border-color:var(--cc);}
.arc-g>*{min-width:0;}
.arc-gtop{display:flex;align-items:center;gap:10px;}
.arc-gnm{display:flex;align-items:center;gap:7px;min-width:0;flex:1;font-size:14.5px;font-weight:800;letter-spacing:-0.01em;color:var(--stg-ink);text-decoration:none;}
.arc-gnm span{overflow:hidden;text-overflow:ellipsis;white-space:nowrap;}
.arc-gnm:hover{color:var(--cci);}
.arc-gi{flex:none;color:var(--cc);}
.arc-gct{flex:none;font-family:${MONO};font-size:10.5px;font-weight:600;color:var(--stg-mute);font-variant-numeric:tabular-nums;}
.arc-gct b{color:var(--stg-ink);font-weight:800;}
.arc-g.full .arc-gct b{color:var(--cci);}
.arc-gt{margin:2px 0 0;font-size:11.5px;font-weight:600;color:var(--stg-mute);overflow:hidden;text-overflow:ellipsis;white-space:nowrap;}
.arc-bar{height:3px;border-radius:2px;background:var(--stg-line);margin:9px 0 9px;overflow:hidden;}
.arc-bar span{display:block;height:100%;background:var(--cc);border-radius:2px;transition:width .4s cubic-bezier(.2,.7,.3,1);}

.arc-strip{display:flex;gap:3px;}
.arc-d{position:relative;display:flex;align-items:center;justify-content:center;text-decoration:none;font-size:10px;font-weight:700;font-variant-numeric:tabular-nums;
  color:var(--stg-ink2);background:var(--stg-cell,var(--stg-surf2));border:1px solid var(--stg-cell-line,var(--stg-line));border-radius:4px;box-sizing:border-box;}
.arc-strip .arc-d{flex:1 1 0;min-width:0;max-width:28px;aspect-ratio:1;}
.arc-d:hover{border-color:var(--cc);color:var(--stg-ink);}
.arc-d.solved{background:var(--cc);border-color:var(--cc);color:var(--cco);}
.arc-d.played{border:2px solid var(--cc);color:var(--stg-ink);}
.arc-d.started{border:1.5px dashed var(--cc);}
.arc-d.today{outline:2px solid var(--stg-ink);outline-offset:1px;}
.arc-d.sun::after{content:'';position:absolute;right:2px;top:2px;width:4px;height:4px;border-radius:50%;background:var(--stg-warn,#e8b43a);}
.arc-d.solved.sun::after{background:var(--cco);}
.arc-d:focus-visible,.arc-gnm:focus-visible,.arc-go:focus-visible,.arc-all:focus-visible,.arc-chips button:focus-visible,.arc-missed:focus-visible,.arc-calnav button:focus-visible{outline:2px solid var(--cc,var(--stg-acc));outline-offset:2px;}

.arc-gfoot{display:flex;align-items:center;justify-content:space-between;gap:10px;margin-top:10px;}
.arc-go{display:inline-flex;align-items:center;gap:5px;font-size:12px;font-weight:800;color:var(--cci);text-decoration:none;}
.arc-go:hover{text-decoration:underline;}
.arc-gnote{font-family:${MONO};font-size:9.5px;letter-spacing:.12em;text-transform:uppercase;color:var(--stg-mute);}
.arc-all{font:inherit;font-family:${MONO};font-size:9.5px;letter-spacing:.12em;text-transform:uppercase;font-weight:700;color:var(--stg-ink2);
  background:none;border:1px solid var(--stg-line);border-radius:6px;padding:6px 9px;cursor:pointer;}
.arc-all:hover{border-color:var(--cc);color:var(--stg-ink);}
.arc-g.open .arc-all{border-color:var(--cc);}

.arc-calwrap{margin-top:12px;padding-top:12px;border-top:1px solid var(--stg-line);}
.arc-calnav{display:flex;align-items:center;gap:6px;flex-wrap:wrap;margin-bottom:10px;}
.arc-calnav button{width:30px;height:30px;border-radius:7px;border:1px solid var(--stg-line);background:var(--stg-surf2,var(--stg-surf));color:var(--stg-ink);font-size:17px;font-weight:700;line-height:1;cursor:pointer;}
.arc-calnav button:hover:not(:disabled){border-color:var(--cc);}
.arc-calnav button:disabled{opacity:.35;cursor:default;}
.arc-missed{margin-left:auto;display:inline-flex;align-items:center;gap:5px;font-size:12px;font-weight:800;color:var(--cci);text-decoration:none;}
.arc-missed:hover{text-decoration:underline;}
.arc-allin{margin-left:auto;font-size:12px;font-weight:700;color:var(--cci);}
.arc-mos{display:grid;grid-template-columns:repeat(2,minmax(0,290px));gap:32px;}
.arc-mohd{display:flex;align-items:baseline;justify-content:space-between;gap:10px;margin-bottom:7px;}
.arc-mohd span{font-size:13px;font-weight:800;color:var(--stg-ink);}
.arc-mohd em{font-style:normal;font-family:${MONO};font-size:10px;font-weight:600;color:var(--stg-mute);font-variant-numeric:tabular-nums;}
.arc-cal{display:grid;grid-template-columns:repeat(7,minmax(0,1fr));gap:4px;}
.arc-cal .wd{text-align:center;font-family:${MONO};font-size:9px;font-weight:700;letter-spacing:.08em;color:var(--stg-mute);padding-bottom:2px;}
.arc-cal .c{aspect-ratio:1;font-size:11.5px;}
.arc-cal .c.pad{visibility:hidden;}
.arc-cal .c.none{display:flex;align-items:center;justify-content:center;color:var(--stg-mute);opacity:.45;font-weight:600;}

.arc-none{margin:0;font-size:14px;font-weight:600;color:var(--stg-ink2);}
.arc-none button{font:inherit;font-weight:800;color:var(--stg-acc-ink);background:none;border:0;padding:0;cursor:pointer;text-decoration:underline;}
.arc-more{display:flex;flex-wrap:wrap;gap:6px 14px;font-size:13px;font-weight:600;color:var(--stg-mute);padding-top:18px;border-top:1px solid var(--stg-line);}
.arc-more a{color:var(--stg-ink);font-weight:700;text-decoration:none;}
.arc-more a:hover{color:var(--stg-acc-ink);}

@media (max-width:720px){
  .arc{gap:22px;}
  .arc-tools{flex-direction:column;flex-wrap:nowrap;align-items:stretch;}
  .arc-chips{flex-wrap:nowrap;overflow-x:auto;scrollbar-width:none;flex:none;padding-bottom:2px;}
  .arc-figs{gap:14px 20px;}
  .arc-figs b{font-size:19px;}
  .arc-search{min-width:0;}
  .arc-chips::-webkit-scrollbar{display:none;}
  .arc-chips button{flex:none;}
  .arc-search{flex:none;}
  .arc-grid{grid-template-columns:1fr;}
  .arc-mos{grid-template-columns:minmax(0,1fr);}
  .arc-mo.second{display:none;}
  .arc-missed,.arc-allin{margin-left:0;flex-basis:100%;}
}
@media (prefers-reduced-motion:reduce){.arc-bar span,.arc-g{transition:none;}}
`;
