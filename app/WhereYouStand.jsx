'use client';

// WHERE YOU STAND (owner, 2026-11-03: "what if each ending, both puzzle and
// run, displayed puzzle standings, category standings, day standings").
// Approved on the "Standings Ending Mockups" canvas.
//
// Three ranks, one after another, after the single result:
//   1. THIS PUZZLE (or this run)   where the finish placed you in it
//   2. THE CATEGORY TODAY          your points in this category today (MC Runs
//                                  for the five multiple choice runs)
//   3. ALL PUZZLES TODAY           your points across the whole day
// Rows 2 and 3 count from where you stood BEFORE this finish, and an "Up N"
// chip says what the finish moved.
//
// COST (owner question, 2026-11-03). A puzzle ending reads the day board and
// the category board from /api/quiz/daily-combined WITHOUT fresh=1: the heavy
// work (scoring the day) is memoized per server and shared with every other
// caller, and the edge holds the response 30s. The just-finished game's own row
// may not be in that shared read yet, so the request carries ?plus=<points>
// (the ladder points this finish is worth) and the server also answers where
// the player stands once those land. A run ending happens far less often and
// its legs posted over several minutes, so it reads fresh=1 after this tab's
// result posts settle. The MC Runs row is /api/quiz/multiple-choice, the same
// read McCard makes.
//
// THE BEAT is imperative (beatHtml + playBeat) so RunFinale, which builds its
// show with innerHTML, plays exactly the same thing as the React endings.
// Every class here carries the wys- prefix (RunClient's globals leaked into
// short class names once: see RunFinale).

import { useEffect, useRef, useState } from 'react';
import { DAILY_GAMES, DAILY_GAME_MAP } from '@/lib/daily-games';
import { MC_IDS } from '@/lib/multiple-choice';
import { dailyMeIdentity } from './dailyMeClient';
import { resultPostsSettled } from './ResultQueue';
import { sharedGet } from './sharedGet';
import GameGlyph from './GameGlyph';

// The daily points ladder (lib/daily-combined LADDER), by registered place.
const LADDER = [15, 12, 10, 8, 7, 6, 5, 4, 3, 2];
export const ladderPts = (pos) => (Number.isFinite(pos) && pos >= 1 && pos <= LADDER.length ? LADDER[pos - 1] : 1);

const esc = (s) => String(s == null ? '' : s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const ease = (p) => 1 - Math.pow(1 - p, 3);
const fmt = (n) => Number(n).toLocaleString('en-US');
const r1 = (n) => Math.round((Number(n) || 0) * 10) / 10;
const pctOf = (rank, of) => (of > 1 ? Math.max(0, Math.floor(((of - rank) / of) * 100)) : 100);
const plural = (n, a, b) => `${fmt(n)} ${n === 1 ? a : b}`;

// Every daily key in a category (the server keeps the ones published today).
export function categoryKeys(cat) {
  return DAILY_GAMES.filter((g) => g.cat === cat && !g.retired).map((g) => g.key).slice(0, 40);
}
// A run's category: the one most of its legs belong to.
export function runCategory(keys) {
  const n = {};
  for (const k of keys || []) { const c = DAILY_GAME_MAP[k] && DAILY_GAME_MAP[k].cat; if (c) n[c] = (n[c] || 0) + 1; }
  let best = null;
  for (const c of Object.keys(n)) if (!best || n[c] > n[best]) best = c;
  return best;
}

function qsOf(extra) {
  const { anonId, email } = dailyMeIdentity();
  const q = new URLSearchParams();
  if (anonId) q.set('anonId', anonId);
  if (email) q.set('email', email);
  for (const [k, v] of Object.entries(extra)) if (v != null && v !== '') q.set(k, String(v));
  return q.toString();
}

// A board of points: the top three, then you between your real neighbours.
function pointsBoard(st, rank, total, near) {
  const top = Array.isArray(st.top) ? st.top : [];
  const rows = [];
  const me = { rank, name: 'You', fig: `${fmt(r1(total))} pts`, me: true };
  if (rank <= 4) {
    top.slice(0, rank - 1).forEach((r, i) => rows.push({ rank: i + 1, name: r.username, fig: `${fmt(r.total)} pts` }));
    rows.push(me);
    if (near && near.down) rows.push({ rank: rank + 1, name: near.down.username, fig: `${fmt(near.down.total)} pts` });
    return rows;
  }
  top.slice(0, 3).forEach((r, i) => rows.push({ rank: i + 1, name: r.username, fig: `${fmt(r.total)} pts` }));
  rows.push({ gap: true });
  if (near && near.up && rank - 1 > 3) rows.push({ rank: rank - 1, name: near.up.username, fig: `${fmt(near.up.total)} pts` });
  rows.push(me);
  if (near && near.down) rows.push({ rank: rank + 1, name: near.down.username, fig: `${fmt(near.down.total)} pts` });
  return rows;
}

// One points row (category or day) out of a daily-combined read.
// `plus` is the ladder value of the finish when its row may not be in the read.
function pointsRow(d, { id, lab, name, word, plus = 0 }) {
  const st = d && d.stand;
  if (!st) return null;
  const inRead = Array.isArray(st.have) && st.have.length > 0;
  const rank = inRead ? st.rank : (plus > 0 ? st.plus : st.rank);
  if (!rank) return null;
  const total = inRead ? st.base : st.base + plus;
  const games = inRead ? st.games : st.games + (plus > 0 ? 1 : 0);
  const before = inRead ? st.before : (st.base > 0 ? st.rank : null);
  const of = Math.max(Number(st.field) || 0, rank) + (inRead || st.base > 0 || plus <= 0 ? 0 : 1);
  const up = before && before > rank ? before - rank : 0;
  return {
    id, lab, name, rank, of, from: before || of, fromLast: !before, up, pct: pctOf(rank, of),
    cap: `${fmt(r1(total))} pts from ${plural(games, word, word + 's')}`,
    foot: up ? `Up ${up} ${up === 1 ? 'place' : 'places'} with this finish` : `${plural(of, 'player', 'players')} today`,
    board: pointsBoard(st, rank, total, inRead ? st.nearRank : (plus > 0 ? st.nearPlus : st.nearRank)),
    next: nextOf(inRead ? st.nearRank : (plus > 0 ? st.nearPlus : st.nearRank), total, rank),
    picks: Array.isArray(st.picks) ? st.picks : [],
  };
}

// WHO'S NEXT TO PASS (owner, 2026-11-03, option B2): the named player just
// above, and the points between you.
function nextOf(near, total, rank) {
  if (!near || !near.up || rank <= 1) return null;
  const them = Number(near.up.total) || 0;
  const gap = r1(Math.max(0, them - total));
  return { name: near.up.username, fig: `${fmt(them)} pts`, gap, gapText: `${fmt(gap || 0.1)} ${gap === 1 ? 'pt' : 'pts'} behind`, fill: them > 0 ? Math.max(0.05, Math.min(1, total / them)) : 1 };
}

function mcRow(d) {
  const me = d && d.me;
  if (!me || !me.rank) return null;
  const of = Math.max(Number(d.field && d.field.all) || 0, me.rank);
  const up = me.before && me.before > me.rank ? me.before - me.rank : 0;
  const all = (d.boards && d.boards.all) || [];
  const rows = [];
  const mine = { rank: me.rank, name: 'You', fig: `${fmt(me.total)} right`, me: true };
  const others = all.filter((r) => !(me.name && r.name === me.name));
  if (me.rank <= 4) {
    others.slice(0, me.rank - 1).forEach((r) => rows.push({ rank: r.rank, name: r.name, fig: `${fmt(r.value)} right` }));
    rows.push(mine);
    const nx = others.find((r) => r.rank > me.rank);
    if (nx) rows.push({ rank: nx.rank, name: nx.name, fig: `${fmt(nx.value)} right` });
  } else {
    others.slice(0, 3).forEach((r) => rows.push({ rank: r.rank, name: r.name, fig: `${fmt(r.value)} right` }));
    rows.push({ gap: true });
    rows.push(mine);
  }
  const above = others.filter((r) => Number(r.value) > Number(me.total)).pop();
  const next = above ? { name: above.name, fig: `${fmt(above.value)} right`, gap: above.value - me.total, gapText: `${fmt(above.value - me.total)} right behind`, fill: Math.max(0.05, Math.min(1, me.total / above.value)) } : null;
  return {
    next, picks: [],
    id: 'cat', lab: 'MC Runs', name: 'Today\u2019s Runs', rank: me.rank, of, from: me.before || of, fromLast: !me.before, up, pct: pctOf(me.rank, of),
    cap: `${fmt(me.total)} right across ${plural(me.runs || 1, 'run', 'runs')}`,
    foot: up ? `Up ${up} ${up === 1 ? 'place' : 'places'} in today\u2019s runs with this run` : `${plural(of, 'player', 'players')} in today\u2019s runs`,
    board: rows,
  };
}

// ── THE PUZZLE ENDING'S THREE ROWS ─────────────────────────────────────────
// game: { rank, n, guest, race } from the ending's own board read.
// board: today's board for the game, [{ rank, name, fig, me, gap }].
export function usePuzzleStandings({ on, gameKey, gameName, cat, game, board, next = null }) {
  const [rows2, setRows2] = useState(null);
  const [ready, setReady] = useState(false);
  const asked = useRef(false);
  useEffect(() => {
    if (!on || asked.current || !gameKey || !game || !game.rank) return undefined;
    asked.current = true;
    let alive = true;
    const plus = ladderPts(game.guest ? null : game.rank);
    const keys = cat ? categoryKeys(cat) : [];
    resultPostsSettled(4000).then(() => {
      const day = sharedGet('/api/quiz/daily-combined?' + qsOf({ less: gameKey, plus })).catch(() => null);
      const catP = keys.length >= 2
        ? sharedGet('/api/quiz/daily-combined?' + qsOf({ keys: keys.join(','), less: gameKey, plus })).catch(() => null)
        : Promise.resolve(null);
      return Promise.all([catP, day]);
    }).then(([c, d]) => {
      if (!alive) return;
      const out = [];
      if (c && (Number(c.gameCount) || 0) >= 2) {
        const r = pointsRow(c, { id: 'cat', lab: `${cat} Puzzles`, name: cat, word: 'puzzle', plus });
        if (r) out.push(r);
      }
      const r3 = pointsRow(d, { id: 'day', lab: 'All Puzzles', name: 'All today', word: 'puzzle', plus });
      if (r3) out.push(r3);
      setRows2(out);
      setReady(true);
    }).catch(() => { if (alive) { setRows2([]); setReady(true); } });
    return () => { alive = false; };
  }, [on, gameKey, cat, game && game.rank]);   // eslint-disable-line react-hooks/exhaustive-deps
  if (!on || !game || !game.rank) return { rows: null, ready: true };
  const of = Math.max(Number(game.n) || 0, game.rank);
  const pct = pctOf(game.rank, of);
  const first = {
    id: 'game', lab: 'This Puzzle', name: gameName || 'This puzzle',
    rank: game.rank, of, from: of, up: 0, pct, guest: !!game.guest,
    cap: of < 2 ? 'First on the board today' : game.rank === 1 ? 'Top of the board' : `${game.race ? 'Faster than' : 'Ahead of'} ${pct}%`,
    foot: of < 2 ? 'First on the board today' : `${game.race ? 'Faster than' : 'Ahead of'} ${pct}% of ${plural(of, 'player', 'players')}`,
    board: board || [],
    next, picks: [],
  };
  const all = rows2 || [];
  const day = all.find((r) => r.id === 'day');
  const catRow = all.find((r) => r.id === 'cat');
  return { rows: ready ? [first, ...all] : null, ready, first, dayPicks: day ? day.picks : [], catPicks: catRow ? catRow.picks : [] };
}

// ── THE RUN ENDING'S THREE ROWS ────────────────────────────────────────────
// run: { rank, n }; board: [{ rank, name, fig, me, gap }]; keys: the legs' daily keys.
export function useRunStandings({ on, runId, runName, keys, run, board, unitWord = 'right' }) {
  const [rows2, setRows2] = useState(null);
  const [ready, setReady] = useState(false);
  const promise = useRef(null);
  const resolve = useRef(null);
  if (!promise.current) promise.current = new Promise((res) => { resolve.current = res; });
  const asked = useRef(false);
  const legs = (keys || []).filter((k) => DAILY_GAME_MAP[k]);
  const isMc = MC_IDS.includes(runId);
  const cat = isMc ? null : runCategory(legs);
  useEffect(() => {
    if (!on || asked.current || !runId) return undefined;
    asked.current = true;
    let alive = true;
    resultPostsSettled(8000).then(() => {
      const day = legs.length
        ? sharedGet('/api/quiz/daily-combined?' + qsOf({ less: legs.join(','), fresh: 1 }), { fresh: true }).catch(() => null)
        : Promise.resolve(null);
      let catP = Promise.resolve(null);
      if (isMc) {
        catP = sharedGet('/api/quiz/multiple-choice?' + qsOf({ period: 'today', less: runId, fresh: 1 }), { fresh: true }).catch(() => null);
      } else if (cat) {
        const ck = categoryKeys(cat);
        const mine = legs.filter((k) => ck.includes(k));
        if (ck.length >= 2) catP = sharedGet('/api/quiz/daily-combined?' + qsOf({ keys: ck.join(','), less: mine.join(','), fresh: 1 }), { fresh: true }).catch(() => null);
      }
      return Promise.all([catP, day]);
    }).then(([c, d]) => {
      if (!alive) return;
      const out = [];
      const rc = isMc ? mcRow(c) : (c ? pointsRow(c, { id: 'cat', lab: `${cat} Puzzles`, name: cat, word: 'puzzle' }) : null);
      if (rc) out.push(rc);
      // THE RUN ENDING'S LABELS (owner, 2026-11-04): Today's Runs, Today's Puzzles.
      const rd = pointsRow(d, { id: 'day', lab: 'All Puzzles', name: 'Today\u2019s Puzzles', word: 'puzzle' });
      if (rd) out.push(rd);
      setRows2(out);
      setReady(true);
    }).catch(() => { if (alive) { setRows2([]); setReady(true); } });
    return () => { alive = false; };
  }, [on, runId]);   // eslint-disable-line react-hooks/exhaustive-deps
  let first = null;
  if (run && run.rank) {
    const of = Math.max(Number(run.n) || 0, run.rank);
    const pct = pctOf(run.rank, of);
    first = {
      id: 'game', lab: 'This Run', name: runName || 'This run', rank: run.rank, of, from: of, fromLast: true, up: 0, pct,
      cap: of < 2 ? 'First on the board today' : run.rank === 1 ? 'Top of the board' : `${unitWord === 'right' ? 'More right than' : 'Ahead of'} ${pct}%`,
      foot: of < 2 ? 'First on the board today' : `Ahead of ${pct}% of ${plural(of, 'run', 'runs')}`,
      board: board || [],
    };
  }
  const rows = ready && first ? [first, ...(rows2 || [])] : (ready ? (rows2 || []) : null);
  useEffect(() => { if (ready && resolve.current) resolve.current(rows); });
  return { rows, ready, promise: promise.current };
}

// ── THE BEAT (imperative, shared with RunFinale) ───────────────────────────
export function beatHtml(rows, { wide = false } = {}) {
  return `<div class="wys-beat${wide ? ' wide' : ''}"><div class="wys-lab">Where You Stand</div><div class="wys-cards">${rows.map((r, i) => {
    const hold = `#${fmt(Math.max(r.from || 0, r.rank))}`;
    return `<div class="wys-c" data-i="${i}"><div class="wys-t"><span class="wys-n"><small>${esc(r.lab)}</small><b>${esc(r.name)}</b></span><span class="wys-r"><b class="wys-num"><span class="wys-hold" aria-hidden="true">${esc(hold)}</span><span class="wys-now">#${esc(fmt(r.from || r.rank))}</span></b><i>of ${esc(fmt(r.of))}</i></span></div><div class="wys-k"><span class="wys-f"></span></div><div class="wys-ft"><span class="wys-cap">${esc(r.cap)}</span>${r.up ? `<span class="wys-up">&uarr; Up ${esc(r.up)}</span>` : ''}</div></div>`;
  }).join('')}</div></div>`;
}

// Plays the beat inside `root` (which holds beatHtml). Resolves when the last
// chip has landed. `land()` on the returned handle jumps to the end.
export const BEAT_STEP = 520;
export function beatDuration(n) { return Math.max(0, n - 1) * BEAT_STEP + 1500; }
export function playBeat(root, rows, { noCount = false, delay = 0 } = {}) {
  let alive = true;
  const timers = [];
  const cards = [...root.querySelectorAll('.wys-c')];
  const finish = (c, r) => {
    c.classList.add('in', 'on');
    const now = c.querySelector('.wys-now'); if (now) now.textContent = `#${fmt(r.rank)}`;
    const f = c.querySelector('.wys-f'); if (f) f.style.width = `${r.pct}%`;
  };
  const land = () => { alive = false; timers.forEach(clearTimeout); cards.forEach((c, i) => rows[i] && finish(c, rows[i])); };
  const done = new Promise((res) => {
    const lab = root.querySelector('.wys-lab');
    timers.push(setTimeout(() => { if (lab) lab.classList.add('in'); }, delay));
    cards.forEach((c, i) => {
      const r = rows[i];
      if (!r) return;
      const at = delay + 150 + i * BEAT_STEP;
      timers.push(setTimeout(() => {
        if (!alive) return;
        c.classList.add('in');
        const f = c.querySelector('.wys-f');
        timers.push(setTimeout(() => { if (alive && f) f.style.width = `${r.pct}%`; }, 160));
        const now = c.querySelector('.wys-now');
        const from = Number(r.from) || r.rank;
        if (noCount || from === r.rank || !now) { if (now) now.textContent = `#${fmt(r.rank)}`; }
        else {
          const t0 = performance.now() + 160;
          const tick = (t) => {
            if (!alive) return;
            const p = Math.max(0, Math.min(1, (t - t0) / 1000));
            now.textContent = `#${fmt(Math.round(from + (r.rank - from) * ease(p)))}`;
            if (p < 1) requestAnimationFrame(tick);
          };
          requestAnimationFrame(tick);
        }
        timers.push(setTimeout(() => { if (alive) c.classList.add('on'); }, 1200));
      }, at));
    });
    timers.push(setTimeout(() => res(), delay + beatDuration(rows.length)));
  });
  return { done, land, stop: () => { alive = false; timers.forEach(clearTimeout); } };
}

// The beat as a React block (the puzzle endings).
export function StandBeat({ rows, noCount = false, wide = false, delay = 0 }) {
  const ref = useRef(null);
  const key = rows ? rows.map((r) => `${r.id}:${r.rank}`).join('|') : '';
  useEffect(() => {
    const el = ref.current;
    if (!el || !rows || !rows.length) return undefined;
    el.innerHTML = beatHtml(rows, { wide });
    let reduced = false;
    try { reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches; } catch (e) { reduced = false; }
    const h = playBeat(el, rows, { noCount, delay });
    if (reduced) h.land();
    return () => h.stop();
  }, [key]);   // eslint-disable-line react-hooks/exhaustive-deps
  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: BEAT_CSS }} />
      <div ref={ref} className="wys-host" />
    </>
  );
}

// ── THE CARD ON THE FINISHED PAGE: three tabs and the chosen board ─────────
export function StandCard({ rows, label = 'Where You Stand', className = '' }) {
  const [tab, setTab] = useState(0);
  if (!rows || !rows.length) return null;
  const t = Math.min(tab, rows.length - 1);
  const cur = rows[t];
  return (
    <section className={'wys-card ' + className}>
      <style dangerouslySetInnerHTML={{ __html: CARD_CSS }} />
      <div className="wys-sl">{label}</div>
      <div className="wys-tabs" role="tablist" aria-label={label} style={{ gridTemplateColumns: `repeat(${rows.length}, minmax(0, 1fr))` }}>
        {rows.map((r, i) => (
          <button key={r.id} type="button" role="tab" aria-selected={i === t} className={'wys-tab' + (i === t ? ' on' : '')} onClick={() => setTab(i)}>
            <span>{r.name}</span>
            <b>#{fmt(r.rank)}</b>
          </button>
        ))}
      </div>
      {cur.board && cur.board.length ? (
        <table className="wys-tbl"><tbody>
          {cur.board.map((r, i) => (r.gap ? (
            <tr key={'g' + i} className="gap"><td colSpan={3}>&middot;&middot;&middot;</td></tr>
          ) : (
            <tr key={(r.name || '') + r.rank + i} className={r.me ? 'me' : undefined}>
              <td className="p">#{r.rank}</td>
              <td className="w">{r.me ? 'You' : (r.name || 'Guest')}</td>
              <td className="st">{r.fig || '—'}</td>
            </tr>
          )))}
        </tbody></table>
      ) : null}
      <div className="wys-foot">{cur.foot}</div>
    </section>
  );
}

// ── THE RUN ENDING'S THREE TILES (owner, 2026-11-04, phones) ────────────────
// The leaderboard moved into the top bar's dropdown; the page keeps three big
// full-pastel tiles, each with its rank and the move up. A first run of the day
// counts up from last place ("from last"); a later one shows what this run
// moved ("with this run"). A guest gets one strip under them to save the spot.
const TILE_TONES = ['#8fdcbb', '#d6c8ff', '#ffcfa8'];
export function StandTiles({ rows, claim = null }) {
  const [p, setP] = useState(0);
  const key = rows ? rows.map((r) => `${r.id}:${r.rank}:${r.from}`).join('|') : '';
  useEffect(() => {
    if (!rows || !rows.length) return undefined;
    let reduced = false;
    try { reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches; } catch (e) { reduced = false; }
    if (reduced) { setP(1); return undefined; }
    let raf = 0;
    let t0 = null;
    const tick = (t) => {
      if (t0 === null) t0 = t;
      const q = Math.max(0, Math.min(1, (t - t0 - 250) / 1400));
      setP(q);
      if (q < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [key]);   // eslint-disable-line react-hooks/exhaustive-deps
  if (!rows || !rows.length) return null;
  const e = ease(p);
  const list = rows.slice(0, 3);
  const meRank = list[0] && list[0].rank;
  // ONE SIZE FOR ALL THREE (owner, 2026-11-04: "the numbers should be horizontally
  // aligned across the three"): the longest figure any tile passes through picks it.
  const longest = Math.max(...list.map((r) => `#${fmt(Math.max(Number(r.fromLast ? r.of : r.from) || r.rank, r.rank))}`.length));
  const fs = longest <= 4 ? 38 : longest === 5 ? 33 : 28;
  return (
    <section className="wys-tiles" aria-label="Where You Stand">
      <style dangerouslySetInnerHTML={{ __html: TILES_CSS }} />
      <div className="wys-sl">Where You Stand</div>
      <div className="wys-tg" style={{ gridTemplateColumns: `repeat(${list.length}, minmax(0, 1fr))` }}>
        {list.map((r, i) => {
          const from = Math.max(Number(r.fromLast ? r.of : r.from) || r.rank, r.rank);
          const up = from - r.rank;
          return (
            <div key={r.id} className="wys-tl" style={{ background: TILE_TONES[i % TILE_TONES.length] }}>
              <div className="nm">{r.name}</div>
              <div>
                <div className="rk" style={{ fontSize: fs }} aria-label={`#${fmt(r.rank)} of ${fmt(r.of)}`}>#{fmt(Math.round(from - up * e))}</div>
                <div className="of">of {fmt(r.of)}</div>
              </div>
              <div className="ft">
                {up > 0 ? (
                  <span className="up">
                    <svg width="12" height="12" viewBox="0 0 12 12" aria-hidden="true"><path d="M6 10V2.5M2.8 5.5L6 2.3l3.2 3.2" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
                    <b>{fmt(Math.round(up * e))}</b>
                  </span>
                ) : null}
                <div className="nt">{up > 0 ? (r.fromLast ? 'from last' : 'with this run') : 'held your spot'}{claim ? ' · not saved' : ''}</div>
              </div>
            </div>
          );
        })}
      </div>
      {claim ? (
        <div className="wys-claim">
          <span><b>These spots aren&rsquo;t saved yet</b><small>Pick a name to keep #{fmt(meRank)} on the board</small></span>
          <button type="button" onClick={claim}>Save my spot</button>
        </div>
      ) : null}
    </section>
  );
}

const TILES_CSS = `
.wys-tiles{display:flex;flex-direction:column;gap:10px;color:var(--wys-ink,#08222e);font-family:Manrope,ui-sans-serif,system-ui,sans-serif}
.wys-tiles .wys-sl{font-size:11.5px;font-weight:800;letter-spacing:.12em;text-transform:uppercase;opacity:.82;padding-left:4px}
.wys-tg{display:grid;gap:8px}
.wys-tl{display:flex;flex-direction:column;gap:14px;min-width:0;min-height:178px;box-sizing:border-box;padding:14px 10px 14px 12px;border:1px solid #0f1f2b;border-radius:20px;color:#0f1f2b}
/* The name always takes two lines of room, so every rank sits on the same line. */
.wys-tl .nm{font-size:13px;font-weight:800;line-height:1.2;height:2.4em;overflow:hidden}
.wys-tl .ft{margin-top:auto}
.wys-tl .rk{font-weight:800;letter-spacing:-.03em;line-height:1;font-variant-numeric:tabular-nums;white-space:nowrap}
.wys-tl .of{margin-top:4px;font-size:12px;font-weight:700;opacity:.85;font-variant-numeric:tabular-nums}
.wys-tl .up{display:inline-flex;align-items:center;gap:4px;padding:5px 9px 5px 7px;border-radius:99px;background:#0f1f2b;color:#fff}
.wys-tl .up b{font-size:15px;font-weight:800;font-variant-numeric:tabular-nums}
.wys-tl .nt{margin-top:5px;font-size:12px;font-weight:700;opacity:.85}
.wys-claim{display:flex;align-items:center;gap:12px;padding:12px 12px 12px 16px;border:1px solid #0f1f2b;border-radius:18px;background:#fff6c9;color:#0f1f2b}
.wys-claim span{flex:1;display:flex;flex-direction:column;gap:2px;min-width:0}
.wys-claim b{font-size:15px;font-weight:800}
.wys-claim small{font-size:13px;font-weight:600}
.wys-claim button{flex:none;min-height:44px;padding:0 16px;border:0;border-radius:12px;background:#0f1f2b;color:#fff;font:inherit;font-size:15px;font-weight:800;cursor:pointer}
`;

// The three ranks as quiet rows (the desktop band, after the beat has played).
export function StandRows({ rows }) {
  if (!rows || !rows.length) return null;
  return (
    <div className="wys-rows">
      <style dangerouslySetInnerHTML={{ __html: ROWS_CSS }} />
      {rows.map((r) => (
        <div key={r.id} className="wys-rw">
          <span className="wys-rn">
            <small>{r.lab}</small>
            <span><b>{r.name}</b>{r.up ? <em>Up {r.up}</em> : null}</span>
          </span>
          <span className="wys-rk" aria-hidden="true"><span style={{ width: `${r.pct}%` }} /></span>
          <span className="wys-rr"><b>#{fmt(r.rank)}</b> of {fmt(r.of)}</span>
        </div>
      ))}
    </div>
  );
}

const ROWS_CSS = `
.wys-rows{display:flex;flex-direction:column;gap:8px;margin-top:8px;color:var(--wys-ink,#08222e);font-family:Manrope,ui-sans-serif,system-ui,sans-serif}
.wys-rw{display:grid;grid-template-columns:minmax(0,1fr) minmax(60px,110px) auto;align-items:center;gap:12px;padding:9px 12px;border-radius:12px;background:var(--wys-wash,rgba(255,255,255,.5))}
.wys-rn{display:flex;flex-direction:column;gap:1px;min-width:0}
.wys-rn small{font-size:10px;font-weight:800;letter-spacing:.11em;text-transform:uppercase;opacity:.8;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.wys-rn > span{display:flex;align-items:center;gap:7px;min-width:0}
.wys-rn b{font-size:15px;font-weight:800;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.wys-rn em{flex:none;font-style:normal;display:inline-flex;align-items:center;height:19px;padding:0 7px;border-radius:99px;background:var(--wys-ink,#08222e);color:var(--wys-bg,#fff);font-size:10.5px;font-weight:800}
.wys-rk{position:relative;height:7px;border-radius:99px;overflow:hidden;background:color-mix(in srgb,var(--wys-ink,#08222e) 16%,transparent)}
.wys-rk span{position:absolute;left:0;top:0;bottom:0;border-radius:99px;background:var(--wys-ink,#08222e)}
.wys-rr{text-align:right;white-space:nowrap;font-size:12px;font-weight:700}
.wys-rr b{font-size:20px;font-weight:800;font-variant-numeric:tabular-nums}
`;

// ── WHO'S NEXT TO PASS (owner, 2026-11-03, B2 on phones, the cards on
// desktop): All today, the category today, then this puzzle today. Each box
// names its scope on an ink chip (owner, 2026-11-04: "add today", black with
// white letters, flipped in dark mode), the rank in that scope, and the
// player just above with the gap, with a bar for how close you are.
const passScope = (r) => (r.id === 'day' ? 'All today' : `${r.name} today`);
export function PassCard({ rows, wide = false, band = false }) {
  if (!rows || !rows.length) return null;
  const list = rows.slice().reverse();
  return (
    <section className={'wys-pass' + (band ? ' band' : wide ? ' wide' : '')}>
      <style dangerouslySetInnerHTML={{ __html: PASS_CSS }} />
      <div className="wys-sl">Where You Stand &middot; Who&rsquo;s Next to Pass</div>
      <div className="wys-pl">
        {list.map((r) => {
          // ONE LINE ABOVE THE BAR in the desktop band (owner, 2026-11-04: "condense the three boxes on the right by
          // removing three rows and placing stats above the line"): chip, who is next, rank; then the bar alone.
          const pt = (
            <div className="wys-pt">
              {r.next
                ? <>Next to pass: <b>{r.next.name}</b>{/ behind$/.test(r.next.gapText) ? `, ${r.next.gapText.replace(/ behind$/, '')} ahead of you` : (r.next.fig ? ` \u00b7 ${r.next.fig}` : '')}</>
                : <>You lead {passScope(r)}</>}
            </div>
          );
          return (
            <div key={r.id} className="wys-pr">
              <div className="wys-ph">
                <span className="wys-chip">{passScope(r)}</span>
                {band ? pt : null}
                <span className="wys-prk"><b>#{fmt(r.rank)}</b> of {fmt(r.of)}</span>
              </div>
              <div className="wys-pb">
                <span className="wys-pk"><span style={{ width: `${Math.round((r.next ? r.next.fill : 1) * 100)}%` }} /></span>
              </div>
              {band ? null : pt}
            </div>
          );
        })}
      </div>
    </section>
  );
}

// The one big play and the two small ones under it.
// main: { key, name, href, mins, line }; small: [{ title, sub, href, onClick }].
export function PassPlay({ main, small = [] }) {
  if (!main && !small.length) return null;
  return (
    <div className="wys-pp">
      <style dangerouslySetInnerHTML={{ __html: PASS_CSS }} />
      {main ? (
        // ONE BUTTON HIGH (owner, 2026-11-03): the black play button is the same height as the
        // small play button beside it. The "typical finish" sentence rides as its tooltip.
        <a className="wys-cta" href={main.href} title={main.line || undefined}>
          <span className="top">
            <span className="gl">{main.key ? <GameGlyph gameKey={main.key} size={18} /> : null}</span>
            <span className="tx"><b>Play {main.name}</b><small>{main.why || 'Easiest points left'}{main.mins ? ` \u00b7 ${main.mins} min` : ''}</small></span>
            <span className="ar" aria-hidden="true">&rarr;</span>
          </span>
        </a>
      ) : null}
      {small.length ? (
        <div className={'wys-sm' + (small.length === 1 ? ' one' : '')}>
          {small.map((x) => (
            <a key={x.title} className="wys-sb" href={x.href || '#'} onClick={x.onClick || undefined}>
              <b>{x.title}</b><span>{x.sub}</span>
            </a>
          ))}
        </div>
      ) : null}
    </div>
  );
}

const PASS_CSS = `
.wys-pass{color:var(--wys-ink,#08222e);background:var(--wys-card,rgba(255,255,255,.5));border-radius:18px;padding:13px 14px 4px;font-family:Manrope,ui-sans-serif,system-ui,sans-serif;min-width:0}
.wys-pass .wys-sl{font-size:11.5px;font-weight:800;letter-spacing:.12em;text-transform:uppercase;opacity:.82;margin-bottom:2px}
.wys-pr{padding:10px 0 11px;border-top:1px solid color-mix(in srgb,var(--wys-ink,#08222e) 14%,transparent)}
.wys-pr:first-child{border-top:0}
.wys-ph{display:flex;align-items:center;justify-content:space-between;gap:8px;font-size:12.5px;font-weight:700}
.wys-chip{flex:none;display:inline-flex;align-items:center;height:24px;padding:0 10px;border-radius:99px;background:var(--wys-ink,#08222e);color:var(--wys-chip-tx,#ffffff);font-size:12.5px;font-weight:800;white-space:nowrap;max-width:62%;overflow:hidden;text-overflow:ellipsis}
.wys-prk{white-space:nowrap}
.wys-prk b{font-size:17px;font-weight:800;font-variant-numeric:tabular-nums}
.wys-pb{margin-top:8px}
.wys-pk{display:block;position:relative;height:10px;border-radius:99px;background:color-mix(in srgb,var(--wys-ink,#08222e) 16%,transparent);overflow:hidden}
.wys-pk span{position:absolute;left:0;top:0;bottom:0;border-radius:99px;background:var(--wys-ink,#08222e);animation:wysFill .9s cubic-bezier(.2,.8,.2,1) both}
@keyframes wysFill{from{width:0}}
.wys-pt{margin-top:6px;font-size:12.5px;font-weight:700;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;padding-bottom:.16em;margin-bottom:-.16em}
.wys-pt b{font-weight:800}
.wys-pass.wide .wys-pl{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:14px}
.wys-pass.wide .wys-pr{border-top:0;padding:12px 14px 13px;border-radius:14px;border:1px solid color-mix(in srgb,var(--wys-ink,#08222e) 18%,transparent)}
.wys-pass.wide .wys-sl{margin-bottom:10px}
.wys-pass.wide .wys-pt{max-width:none}
.wys-pp{display:flex;flex-direction:column;gap:10px;font-family:Manrope,ui-sans-serif,system-ui,sans-serif}
.wys-cta{display:flex;flex-direction:column;justify-content:center;padding:10px 12px;border-radius:14px;border:1px solid var(--wys-ink,#08222e);min-width:0;background:var(--wys-ink,#08222e);color:var(--wys-bg,#fff);text-decoration:none;animation:wysNudge 2.6s ease-in-out 1.6s 2}
@keyframes wysNudge{0%,100%{transform:none}50%{transform:scale(1.02)}}
.wys-cta .top{display:flex;align-items:center;gap:10px;min-width:0}
.wys-cta .gl{flex:none;width:30px;height:30px;border-radius:8px;background:var(--wys-bg,#fff);color:var(--wys-ink,#08222e);display:flex;align-items:center;justify-content:center}
.wys-cta .tx{display:flex;flex-direction:column;gap:2px;flex:1;min-width:0}
.wys-cta small{font-size:12px;font-weight:700;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;padding-bottom:.16em;margin-bottom:-.16em}
.wys-cta b{font-size:15px;font-weight:800;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.wys-cta .ar{flex:none;font-size:18px;font-weight:800}
.wys-cta:hover{filter:brightness(1.08)}
.wys-sm{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px}
.wys-sm.one{grid-template-columns:minmax(0,1fr)}
.wys-sb{display:flex;flex-direction:column;gap:2px;min-width:0;padding:10px 12px;border-radius:14px;border:1px solid var(--wys-ink,#08222e);color:var(--wys-ink,#08222e);text-decoration:none}
.wys-sb b{font-size:15px;font-weight:800}
.wys-sb span{font-size:12px;font-weight:700;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;padding-bottom:.16em;margin-bottom:-.16em}
.wys-sb:hover{background:color-mix(in srgb,var(--wys-ink,#08222e) 6%,transparent)}
.wys-pass.band{background:transparent;padding:0}
.wys-pass.band .wys-pl{display:flex;flex-direction:column;gap:10px}
.wys-pass.band .wys-pr{border:1px solid color-mix(in srgb,var(--wys-ink,#08222e) 22%,transparent);border-radius:14px;padding:11px 14px 12px;background:var(--wys-wash,rgba(255,255,255,.5))}
.wys-pass.band .wys-sl{margin-bottom:10px}
.wys-pass.band .wys-prk b{font-size:20px}
.wys-pass.band .wys-ph .wys-pt{flex:1;min-width:0;margin:0;padding:0 0 .12em}
.wys-pass.band .wys-pr{padding:10px 14px 11px}
.wys-pass.band .wys-pb{margin-top:9px}
@media (prefers-reduced-motion:reduce){.wys-pk span,.wys-cta{animation:none}}
`;

// The colours come from the surface: --wys-ink, --wys-bg (the ground the
// chip's text takes), --wys-card and --wys-wash. Each host sets them.
export const BEAT_CSS = `
.wys-beat{display:flex;flex-direction:column;gap:10px;width:100%;color:var(--wys-ink,#08222e);font-family:Manrope,ui-sans-serif,system-ui,sans-serif}
.wys-lab{font-size:11.5px;font-weight:800;letter-spacing:.13em;text-transform:uppercase;opacity:0;transition:opacity .35s ease}
.wys-lab.in{opacity:1}
.wys-cards{display:flex;flex-direction:column;gap:10px}
.wys-beat.wide .wys-cards{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:14px}
.wys-c{background:var(--wys-card,rgba(255,255,255,.5));border-radius:18px;padding:14px 16px 12px;min-width:0;opacity:0;transform:translateY(14px);
  transition:opacity .38s ease,transform .45s cubic-bezier(.2,.8,.2,1)}
.wys-c.in{opacity:1;transform:none}
.wys-t{display:flex;align-items:flex-start;justify-content:space-between;gap:10px}
.wys-n{display:flex;flex-direction:column;gap:3px;min-width:0}
.wys-n small{font-size:10.5px;font-weight:800;letter-spacing:.12em;text-transform:uppercase;opacity:.82;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.wys-n b{font-size:18px;font-weight:800;letter-spacing:-.01em;line-height:1.15;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.wys-r{display:flex;align-items:baseline;gap:5px;flex:none}
.wys-num{display:inline-grid;font-size:34px;font-weight:800;letter-spacing:-.03em;line-height:1;font-variant-numeric:tabular-nums;text-align:right}
.wys-num > span{grid-area:1/1;white-space:nowrap}
.wys-hold{visibility:hidden}
.wys-r i{font-style:normal;font-size:12.5px;font-weight:700;white-space:nowrap}
.wys-k{position:relative;height:8px;border-radius:99px;margin-top:11px;overflow:hidden;background:color-mix(in srgb,var(--wys-ink,#08222e) 16%,transparent)}
.wys-f{position:absolute;left:0;top:0;bottom:0;width:0;border-radius:99px;background:var(--wys-ink,#08222e);transition:width 1s cubic-bezier(.2,.8,.2,1)}
.wys-ft{display:flex;align-items:center;justify-content:space-between;gap:10px;margin-top:8px;min-height:22px}
.wys-cap{font-size:12.5px;font-weight:700;min-width:0;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;padding-bottom:.16em;margin-bottom:-.16em}
.wys-up{flex:none;display:inline-flex;align-items:center;gap:3px;height:22px;padding:0 9px;border-radius:99px;background:var(--wys-ink,#08222e);color:var(--wys-bg,#ffffff);
  font-size:11.5px;font-weight:800;white-space:nowrap;opacity:0;transform:scale(.6);transition:opacity .3s ease,transform .35s cubic-bezier(.3,1.6,.5,1)}
.wys-c.on .wys-up{opacity:1;transform:none}
.wys-beat.wide .wys-num{font-size:52px}
.wys-beat.wide .wys-t{flex-direction:column;align-items:flex-start;gap:12px}
.wys-beat.wide .wys-n{max-width:100%}
.wys-beat.wide .wys-num{text-align:left}
.wys-beat.wide .wys-r{flex-direction:column;align-items:flex-start;gap:4px}
.wys-beat.wide .wys-cap{white-space:normal}
.wys-beat.wide .wys-c{padding:16px 18px 14px}
@media (prefers-reduced-motion:reduce){.wys-c,.wys-lab,.wys-f,.wys-up{transition:none}}
`;

export const CARD_CSS = `
.wys-card{color:var(--wys-ink,#08222e);font-family:Manrope,ui-sans-serif,system-ui,sans-serif;min-width:0}
.wys-sl{font-size:11.5px;font-weight:800;letter-spacing:.12em;text-transform:uppercase;opacity:.82;margin-bottom:10px}
.wys-tabs{display:grid;gap:6px}
.wys-tab{display:flex;flex-direction:column;align-items:flex-start;gap:1px;min-width:0;min-height:52px;padding:7px 10px;border:1px solid var(--wys-ink,#08222e);border-radius:12px;
  background:transparent;color:var(--wys-ink,#08222e);font:inherit;text-align:left;cursor:pointer}
.wys-tab span{font-size:11.5px;font-weight:800;max-width:100%;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;padding-bottom:.16em;margin-bottom:-.16em}
.wys-tab b{font-size:18px;font-weight:800;font-variant-numeric:tabular-nums}
.wys-tab.on{background:var(--wys-ink,#08222e);color:var(--wys-bg,#ffffff)}
.wys-tab:focus-visible{outline:2px solid var(--wys-ink,#08222e);outline-offset:2px}
.wys-tbl{width:100%;border-collapse:separate;border-spacing:0;font-size:14.5px;margin-top:8px}
.wys-tbl td{padding:8px 6px;border-top:1px solid color-mix(in srgb,var(--wys-ink,#08222e) 14%,transparent)}
.wys-tbl tr:first-child td{border-top:0}
.wys-tbl .p{width:52px;font-weight:800}
.wys-tbl .w{font-weight:700;max-width:0;width:50%;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.wys-tbl .st{text-align:right;font-weight:800;font-variant-numeric:tabular-nums;font-size:13.5px}
.wys-tbl tr.me td{background:var(--wys-wash,rgba(255,255,255,.55));border-top-color:transparent}
.wys-tbl tr.me td:first-child{border-radius:10px 0 0 10px}
.wys-tbl tr.me td:last-child{border-radius:0 10px 10px 0}
.wys-tbl tr.me + tr td{border-top-color:transparent}
.wys-tbl tr.gap td{text-align:center;padding:2px;opacity:.6}
.wys-foot{font-size:12.5px;font-weight:700;margin:8px 6px 0;opacity:.85}
`;

