'use client';

// LAYOUT C, behind a hidden link (owner, 2026-10-09). Opened only by ?layout=c
// on a game page whose page.js mounts this, on a desktop-width window.
//
// Round two (owner, same night):
//  - THE HEADER IS THE MAIN PAGE'S CAP, same markup, same classes, same rules
//    (copied from StageToday's CSS), same reads: the brand and date, the day's
//    StageLadder strip, your name, one figure per group, Today, All-Time, and
//    the light switch on the shared stage-theme store.
//  - THE LEFT INDEX IS THE MAIN PAGE'S INDEX, item for item and in the same
//    order (hand order from sot_cat_order when the reader set one), and it is
//    WIRED to the main page: a category writes sot_home_pane and opens /today
//    on that pane, the info panes open /today#<pane>, exactly the two things
//    the home reads on load. The game's own category opens under its button.
//  - "Hide menus & leaderboard" lives in the SUBHEADER, the game's own figures
//    row (.stg-fg), so the control stays in place when the frame is hidden.
//  - The index scrolls with a thin, ground-coloured scrollbar that only shows
//    while the pointer is over it.
//
// It PORTALS INTO the game's .stage-page root (the one holding .stg-top) so it
// inherits the register's --stg-* tokens, which are undefined outside it.
// The finish flood is position:fixed at z 9000 and covers all of this on its own.

import React, { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import Link from 'next/link';
import { DAILY_GAMES as ALL_GAMES, DAILY_GAME_MAP, liveDailyKeys } from '@/lib/daily-games';
import { RAMP_ORDER, categoryColor, categoryColorLight } from '@/lib/category-ramp';
import { gameStatsShort } from '@/lib/daily-row-stats';
import { savedIdentity } from '@/lib/saved-identity';
import { useStageTheme } from '@/lib/stage-theme';
import { fetchDailyMe, dailyMeQuery, dailyMeIdentity } from './dailyMeClient';
import useDayStats, { etToday } from './useDayStats';
import useGroupStanding from './groups/groupStanding';
import StageLadder from './StageLadder';
import MindLoftMark from './MindLoftMark';

const MIN_W = 1100;
const CAT_FIXED = ['Word', 'Numbers', 'Logic', 'Sudoku', 'Trivia', 'Geography', 'End Game', 'Cards', 'Arcade', 'Crowd Psychology'];
const catLabel = (c) => (c === 'Word' ? 'Words' : c);
const PANE_KEY = 'sot_home_pane';
const useIsoLayoutEffect = typeof window !== 'undefined' ? useLayoutEffect : useEffect;
const MONO = "'Manrope', ui-monospace, SFMono-Regular, Menlo, monospace";

function fmtDate(ymd) {
  if (!ymd) return '';
  const [y, m, d] = ymd.split('-').map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d));
  return dt.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', timeZone: 'UTC' });
}
function monthName(iso) {
  try { return new Date(iso + 'T12:00:00Z').toLocaleDateString('en-US', { month: 'long', year: 'numeric', timeZone: 'UTC' }); }
  catch (e) { return ''; }
}
function identityQs() {
  const { anonId, email } = dailyMeIdentity();
  const p = new URLSearchParams();
  if (anonId) p.set('anonId', anonId);
  if (email) p.set('email', email);
  return p.toString();
}

// The main page's cap and index rules, copied from app/today/StageToday.jsx
// (desktop only) so the two read identically. Keep them in step.
const CSS = `
html.lc-on .lc-host{padding:var(--lc-hh,56px) 330px 0 232px !important;box-sizing:border-box;min-height:100vh;}
html.lc-on.lc-focus .lc-host{padding:0 !important;}
html.lc-on .lc-host .stg-cap,html.lc-on .lc-host .stg-strip,html.lc-on .lc-host .stg-prog{display:none !important;}
html.lc-on .stage-tail{display:none !important;}
html.lc-on .lc-host .stg-fg{position:relative;padding-right:240px;}
.lc-sub-btn{position:absolute;right:20px;top:50%;transform:translateY(-50%);height:30px;padding:0 12px;border-radius:999px;
  border:1px solid var(--stg-line,rgba(255,255,255,.16));background:transparent;color:var(--stg-ink2,var(--stg-ink));
  font:700 12px Manrope,system-ui,sans-serif;letter-spacing:0;text-transform:none;cursor:pointer;white-space:nowrap;}
.lc-sub-btn:hover{border-color:var(--stg-acc);color:var(--stg-ink);}
.lc-cap,.lc-nav,.lc-side{font-family:Manrope,ui-sans-serif,system-ui,sans-serif;color:var(--stg-ink);box-sizing:border-box;-webkit-font-smoothing:antialiased;}
.lc-cap *,.lc-nav *,.lc-side *{box-sizing:border-box;}
.lc-cap{position:fixed;top:0;left:0;right:0;z-index:80;background:var(--stg-ground);}
.lc-cap .sty-cap{display:grid;grid-template-columns:auto minmax(60px,1fr) auto;align-items:center;gap:26px;padding:11px 22px;position:relative;
  border-bottom:1px solid var(--stg-line);}
.lc-cap .sty-id{display:flex;align-items:baseline;gap:11px;min-width:0;}
.lc-cap .sty-brand{display:flex;align-items:baseline;gap:8px;min-width:0;color:inherit;text-decoration:none;}
.lc-cap .sty-brand>svg{align-self:center;}
.lc-cap .sty-id b{font-size:16px;font-weight:800;letter-spacing:-0.01em;white-space:nowrap;}
.lc-cap .sty-id b em{font-style:normal;color:var(--stg-brand,#7dd3fc);}
.lc-cap .sty-date{font-family:${MONO};font-size:9.5px;font-weight:500;letter-spacing:.12em;
  text-transform:uppercase;color:var(--stg-mute);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}
.lc-cap .sty-capl{min-width:0;width:100%;}
.lc-cap .sty-capl .stl{height:12px;}
.lc-cap .sty-rt{display:flex;align-items:center;gap:22px;min-width:0;}
.lc-cap .sty-figs{display:flex;gap:20px;}
.lc-cap .sty-figs>div{text-align:right;}
.lc-cap .sty-figs b{display:block;font-size:15px;font-weight:800;font-variant-numeric:tabular-nums;line-height:1.1;}
.lc-cap .sty-figs b i{font-style:normal;font-weight:600;color:var(--stg-mute);font-size:12px;}
.lc-cap .sty-figs>div>i{font-style:normal;font-family:${MONO};font-size:9.5px;font-weight:500;letter-spacing:.12em;
  text-transform:uppercase;color:var(--stg-mute);}
.lc-cap .sty-who b{font-weight:800;}
.lc-cap .sty-fca{display:block;text-align:right;text-decoration:none;color:inherit;}
.lc-cap .sty-fca>i{display:block;font-style:normal;font-family:${MONO};font-size:9.5px;font-weight:500;letter-spacing:.12em;
  text-transform:uppercase;color:var(--stg-mute);}
.lc-cap .sty-fca:hover>b{color:var(--stg-acc-ink);}
.lc-cap .sty-keep{display:inline-flex;align-items:center;border-radius:999px;background:var(--stg-acc);
  color:var(--stg-onramp,#08222e);padding:8px 14px;font-size:12.5px;font-weight:800;text-decoration:none;white-space:nowrap;}
.lc-cap .sty-cx{flex:none;font-family:${MONO};font-size:9.5px;font-weight:500;letter-spacing:.12em;text-transform:uppercase;
  color:var(--stg-ink2);text-decoration:none;border:1px solid var(--stg-line);border-radius:8px;padding:6px 10px;}
.lc-cap .sty-cx:hover{border-color:var(--stg-line2);color:var(--stg-ink);}
.lc-cap .sty-tg{display:inline-flex;align-items:center;justify-content:center;padding:6px 9px;background:none;cursor:pointer;font:inherit;}
@media (max-width:1400px){ .lc-cap .sty-date{display:none;} }

.lc-nav{position:fixed;top:var(--lc-hh,56px);left:0;bottom:0;width:232px;z-index:80;overflow-y:auto;padding:14px 10px 24px;
  background:var(--stg-ground);border-right:1px solid var(--stg-line);
  scrollbar-width:thin;scrollbar-color:transparent transparent;}
.lc-nav:hover{scrollbar-color:var(--stg-line) transparent;}
.lc-nav::-webkit-scrollbar{width:6px;}
.lc-nav::-webkit-scrollbar-track{background:transparent;}
.lc-nav::-webkit-scrollbar-thumb{background:transparent;border-radius:6px;}
.lc-nav:hover::-webkit-scrollbar-thumb{background:var(--stg-line);}
.lc-nav .sty-ixn{display:flex;flex-direction:column;gap:2px;}
.lc-nav .sty-ixb{display:grid;grid-template-columns:10px minmax(0,1fr) auto;align-items:center;gap:10px;border:0;
  background:none;border-radius:8px;padding:8px 10px;font:inherit;font-size:13.5px;font-weight:700;
  color:var(--stg-ink2);text-align:left;cursor:pointer;text-decoration:none;}
.lc-nav .sty-ixb > i{width:10px;height:10px;border-radius:3px;background:var(--cc);}
.lc-nav .sty-ixb > span{white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}
.lc-nav .sty-ixb:hover{color:var(--stg-ink);background:var(--stg-surf);}
.lc-nav .sty-ixb.on{background:var(--stg-chip);color:var(--stg-ink);font-weight:800;}
.lc-nav .sty-ixb:focus-visible{outline:2px solid var(--stg-acc);outline-offset:2px;}
.lc-nav .sty-ixsep{flex:none;height:1px;background:var(--stg-line);margin:6px 10px;}
.lc-nav .lc-sub{display:flex;flex-direction:column;gap:1px;margin:2px 0 6px 20px;}
.lc-nav .lc-g{display:flex;align-items:center;gap:8px;padding:6px 10px;border-radius:7px;color:var(--stg-mute);
  text-decoration:none;font-size:13px;font-weight:600;}
.lc-nav .lc-g:hover{color:var(--stg-ink);background:var(--stg-surf);}
.lc-nav .lc-g.now{color:var(--stg-ink);background:var(--stg-surf);box-shadow:inset 2px 0 0 var(--cc);font-weight:800;}
.lc-nav .lc-g s{text-decoration:none;margin-left:auto;font-size:11px;font-weight:700;}
.lc-nav .lc-g s.up{color:var(--stg-acc-ink,var(--stg-acc));}
.lc-nav .lc-g s.pz{color:var(--stg-warn,#e8b43a);display:inline-flex;}
.lc-nav button.sty-ixb{width:100%;}

.lc-side{position:fixed;top:var(--lc-hh,56px);right:0;bottom:0;width:330px;z-index:80;display:flex;flex-direction:column;
  background:var(--stg-ground);border-left:1px solid var(--stg-line);}
.lc-tabs{display:flex;border-bottom:1px solid var(--stg-line);padding:0 8px;flex:none;}
.lc-tab{flex:1;height:40px;border:0;border-bottom:2px solid transparent;background:transparent;color:var(--stg-mute);font:700 12.5px Manrope,system-ui,sans-serif;cursor:pointer;}
.lc-tab.on{color:var(--stg-ink);border-bottom-color:var(--stg-acc);}
.lc-body{flex:1;overflow-y:auto;padding:16px 20px;font-size:13px;scrollbar-width:thin;scrollbar-color:transparent transparent;}
.lc-body:hover{scrollbar-color:var(--stg-line) transparent;}
.lc-cap2{display:flex;justify-content:space-between;font-size:12px;color:var(--stg-mute);margin-bottom:6px;}
.lc-row{display:grid;grid-template-columns:24px 1fr auto;gap:10px;padding:7px 0;border-bottom:1px solid var(--stg-line);align-items:baseline;}
.lc-row span:first-child{color:var(--stg-mute);font-weight:700;}
.lc-row em{font-style:normal;color:var(--stg-mute);}
.lc-row.me{background:var(--stg-chip);margin:0 -10px;padding:7px 10px;border-radius:6px;box-shadow:inset 3px 0 0 var(--stg-acc);border-bottom:0;}
.lc-stats{display:grid;grid-template-columns:1fr 1fr;gap:10px;}
.lc-stat{background:var(--stg-surf);border-radius:10px;padding:12px;}
.lc-stat b{display:block;font-size:22px;font-weight:800;}
.lc-stat i{font-style:normal;font-size:11px;color:var(--stg-mute);}
.lc-cal{display:grid;grid-template-columns:repeat(7,minmax(0,1fr));gap:4px;}
.lc-day{aspect-ratio:1;border-radius:5px;display:flex;align-items:center;justify-content:center;font-size:11px;font-weight:700;text-decoration:none;
  color:var(--stg-mute);background:var(--stg-surf);}
.lc-day.p{background:var(--stg-acc);color:var(--stg-onramp,#08222e);}
.lc-day.t{box-shadow:inset 0 0 0 2px var(--stg-acc);color:var(--stg-ink);}
.lc-mo{font-size:11px;font-weight:800;letter-spacing:.1em;text-transform:uppercase;margin:14px 0 8px;}
.lc-mo:first-child{margin-top:0;}
.lc-how{font-size:14px;line-height:1.55;}
.lc-empty{color:var(--stg-mute);}
.lc-hold{height:200px;}
`;

export default function LayoutCInner({ gameKey }) {
  const game = DAILY_GAME_MAP[gameKey] || null;
  const [host, setHost] = useState(null);
  const [fgEl, setFgEl] = useState(null);
  const [focus, setFocus] = useState(false);
  const [tab, setTab] = useState('board');
  const [statusRaw, setStatusRaw] = useState(null);
  const [me, setMe] = useState(null);
  const [data, setData] = useState(null);
  const [mine, setMine] = useState(null);
  const [who, setWho] = useState('');
  const [day, setDay] = useState('');
  const [order, setOrder] = useState(null);
  const [tick, setTick] = useState(0);
  const [flag, setFlag] = useState(true);
  const [openCat, setOpenCat] = useState(null);
  const capRef = useRef(null);
  const [theme, setTheme] = useStageTheme();
  const light = theme === 'light';
  const stats = useDayStats();
  const grp = useGroupStanding('today', !!host);

  // ONLY behind ?layout=c, read on the client before paint.
  useIsoLayoutEffect(() => {
    try { setFlag(new URLSearchParams(window.location.search).get('layout') === 'c'); } catch (e) {}
  }, []);

  const live = useMemo(() => new Set(liveDailyKeys()), []);
  const games = useMemo(() => ALL_GAMES.filter((g) => live.has(g.key)), [live]);
  const cats = useMemo(() => RAMP_ORDER
    .map((cat) => ({ cat, games: games.filter((g) => g.cat === cat).sort((a, b) => a.name.localeCompare(b.name)) }))
    .filter((c) => c.games.length), [games]);
  const orderedCats = useMemo(() => {
    if (order && order.length) {
      const r = new Map(order.map((c, i) => [c, i]));
      return [...cats].sort((a, b) => (r.has(a.cat) ? r.get(a.cat) : 99) - (r.has(b.cat) ? r.get(b.cat) : 99));
    }
    const at = (c) => { const i = CAT_FIXED.indexOf(c.cat); return i < 0 ? 99 : i; };
    return [...cats].map((c, i) => [c, i]).sort((a, b) => (at(a[0]) - at(b[0])) || (a[1] - b[1])).map(([c]) => c);
  }, [cats, order]);
  const hueFor = (cat) => (light ? categoryColorLight(cat) : categoryColor(cat));
  const myCat = game ? game.cat : null;
  const shownCat = openCat === null ? myCat : openCat;

  // Attach on a wide window only, BEFORE paint so a page switch never shows
  // a frame without the panels. The server never renders any of this.
  useIsoLayoutEffect(() => {
    if (!game || !flag) return undefined;
    let el = null;
    const attach = () => {
      el = Array.from(document.querySelectorAll('.stage-page')).find((n) => n.querySelector('.stg-top')) || null;
      if (!el || window.innerWidth < MIN_W) {
        document.documentElement.classList.remove('lc-on');
        if (el) el.classList.remove('lc-host');
        setHost(null);
        return;
      }
      el.classList.add('lc-host');
      document.documentElement.classList.add('lc-on');
      setHost(el);
      setFgEl(el.querySelector('.stg-fg'));
    };
    attach();
    const late = setTimeout(attach, 500);
    window.addEventListener('resize', attach);
    return () => {
      clearTimeout(late);
      window.removeEventListener('resize', attach);
      document.documentElement.classList.remove('lc-on', 'lc-focus');
      document.documentElement.style.removeProperty('--lc-hh');
      if (el) el.classList.remove('lc-host');
    };
  }, [game, flag]);

  useEffect(() => { document.documentElement.classList.toggle('lc-focus', focus); }, [focus]);

  // The cap's real height drives the padding and the side columns' top.
  useEffect(() => {
    const el = capRef.current;
    if (!el || typeof ResizeObserver === 'undefined') return undefined;
    const set = () => document.documentElement.style.setProperty('--lc-hh', el.offsetHeight + 'px');
    set();
    const ro = new ResizeObserver(set);
    ro.observe(el);
    return () => ro.disconnect();
  });

  useEffect(() => {
    setWho(savedIdentity().username || '');
    setDay(etToday());
    try {
      const raw = JSON.parse(localStorage.getItem('sot_cat_order') || 'null');
      if (Array.isArray(raw) && raw.length) setOrder(raw);
    } catch (e) {}
  }, []);

  useEffect(() => {
    if (!host || !game) return undefined;
    let alive = true;
    const qs = identityQs();
    const fresh = tick > 0;
    if (qs) {
      fetch('/api/quiz/daily-status?' + qs).then((r) => r.json())
        .then((d) => { if (alive && d) setStatusRaw(d); }).catch(() => {});
      fetch('/api/quiz/me?light=1&' + qs).then((r) => r.json())
        .then((d) => { if (alive && d && d.found !== false) setMine(d); }).catch(() => {});
    }
    const { anonId, email } = dailyMeIdentity();
    fetchDailyMe(dailyMeQuery({ anonId, email, game: game.key }), { fresh })
      .then((d) => { if (alive && d && !d.error) setMe(d); }).catch(() => {});
    const gq = new URLSearchParams({ game: game.key });
    if (anonId) gq.set('anonId', anonId);
    if (email) gq.set('email', email);
    fetch('/api/quiz/daily-game?' + gq.toString()).then((r) => r.json())
      .then((d) => { if (alive && d && !d.error) setData(d); }).catch(() => {});
    return () => { alive = false; };
  }, [host, game, tick]);

  useEffect(() => {
    const on = (e) => {
      const d = e && e.detail;
      if (d && d.open === false) return;
      setTimeout(() => setTick((t) => t + 1), 1500);
    };
    window.addEventListener('sot:loft-finish', on);
    return () => window.removeEventListener('sot:loft-finish', on);
  }, []);

  // Today's done / in-progress sets, read the way the main page reads them.
  const { done, inprog } = useMemo(() => {
    const d = new Set();
    const p = new Set();
    const t = day || etToday();
    const [Y, M, D] = t.split('-').map(Number);
    const yy = Y % 100;
    if (statusRaw) {
      const completed = new Set(statusRaw.completed || []);
      const played = new Set(statusRaw.played || []);
      const abandoned = new Set(statusRaw.abandoned || []);
      const open = new Set(statusRaw.inProgress || []);
      for (const g of games) {
        const id = `${g.key}-${M}-${D}-${yy}`;
        if (completed.has(id) || played.has(id)) d.add(g.key);
        else if (abandoned.has(id) || open.has(id)) p.add(g.key);
      }
    }
    if (typeof window !== 'undefined') {
      for (const g of games) {
        try {
          const c = JSON.parse(localStorage.getItem(`sot_${g.key}_day`) || 'null');
          if (c && c.d === t && c.done) d.add(g.key);
        } catch (e) {}
      }
    }
    return { done: d, inprog: p };
  }, [statusRaw, games, day, tick]);   // eslint-disable-line react-hooks/exhaustive-deps

  if (!game || !host || !flag) return null;

  const blocks = cats.map(({ cat, games: gs }) => ({
    n: gs.length,
    c: hueFor(cat),
    on: gs.map((g) => done.has(g.key)),
    half: gs.map((g) => inprog.has(g.key) || g.key === game.key),
    pop: gs.map(() => false),
  }));
  const rank = mine ? ((mine.ranks && mine.ranks.xp) || mine.rank || null) : null;
  const openGames = (cats.find((c) => c.cat === shownCat) || { games: [] }).games;
  const nextUp = openGames.find((g) => g.key !== game.key && !done.has(g.key) && !inprog.has(g.key));
  const toggleCat = (cat) => setOpenCat(shownCat === cat ? '' : cat);
  const gameHref = (g) => (g.href || '/' + g.key) + '?layout=c';

  // The main page reads sot_home_pane for a games pane and the hash for an info pane.
  // The main page reads sot_home_pane for a games pane and the hash for an
  // info pane. Both go through next/link, so the switch is a client navigation
  // inside the same document: no reload, no boot flash.
  const setPane = (id) => () => { try { localStorage.setItem(PANE_KEY, id); } catch (err) {} };
  const ixLink = (id, label, hue) => (
    <Link key={id} className="sty-ixb" href="/today" style={{ '--cc': hue }} onClick={setPane(id)}>
      <i aria-hidden="true" /><span>{label}</span>
    </Link>
  );
  const ixHash = (hash, label) => (
    <Link key={hash} className="sty-ixb" href={'/today#' + hash} style={{ '--cc': 'var(--stg-mute)' }}>
      <i aria-hidden="true" /><span>{label}</span>
    </Link>
  );
  const ixDoor = (href, label) => (
    <Link key={href} className="sty-ixb" href={href} style={{ '--cc': 'var(--stg-mute)' }}>
      <i aria-hidden="true" /><span>{label}</span>
    </Link>
  );
  const pauseIcon = (
    <svg viewBox="0 0 12 12" width="11" height="11" aria-label="Paused" role="img"><rect x="2.5" y="2" width="2.6" height="8" rx=".8" fill="currentColor" /><rect x="6.9" y="2" width="2.6" height="8" rx=".8" fill="currentColor" /></svg>
  );
  const groups = grp && Array.isArray(grp.groups) ? grp.groups.filter((g) => !g.failed) : [];
  const tabs = [['board', 'Board']].concat(groups.length ? [['group', 'Group']] : [], [['you', 'You'], ['archive', 'Archive'], ['rules', 'Rules']]);
  const ago = (iso) => {
    const t = Date.parse(iso);
    if (!t) return '';
    const m = Math.max(0, Math.round((Date.now() - t) / 60000));
    return m < 1 ? 'just now' : m < 60 ? m + 'm ago' : Math.round(m / 60) + 'h ago';
  };

  const board = me && me.game && Array.isArray(me.game.board) ? me.game.board : null;
  const field = me && me.game && typeof me.game.field === 'number' ? me.game.field : (board ? board.length : 0);
  const meRow = me && me.me && me.me.rank != null ? me.me : null;
  const mineRec = data && data.mine ? data.mine : null;
  const drops = data && Array.isArray(data.drops) ? data.drops.slice(-42) : [];
  const months = [];
  drops.forEach((d) => {
    const m = monthName(d.dateISO);
    if (!months.length || months[months.length - 1].m !== m) months.push({ m, days: [] });
    months[months.length - 1].days.push(d);
  });

  const subBtn = (
    <button type="button" className="lc-sub-btn" onClick={() => setFocus((v) => !v)}>
      {focus ? 'Show menus & leaderboard' : 'Hide menus & leaderboard'}
    </button>
  );

  const frame = focus ? null : (
    <>
      <div className="lc-cap" ref={capRef}>
        <div className="sty-cap v2">
          <div className="sty-id">
            <Link className="sty-brand" href="/today">
              <MindLoftMark size={20} ink="var(--stg-ink)" accent="var(--stg-brand,#7dd3fc)" />
              <b>Mind <em>Loft</em></b>
            </Link>
            <span className="sty-date">{fmtDate(day)}</span>
          </div>
          <div className="sty-capl"><StageLadder blocks={blocks} light={light} /></div>
          <div className="sty-rt">
            <div className="sty-figs">
              {!who ? <a className="sty-keep" href="/?signup=1">Keep stats, play with friends</a> : null}
              {who ? <div className="sty-who"><b>{who}</b><i>player</i></div> : null}
              {who && grp && Array.isArray(grp.groups) ? grp.groups.map((g) => (
                <a key={g.code} className="sty-fca" href="/today#sty-group">
                  <b>{g.rank ? '#' + g.rank : '–'}{typeof g.members === 'number' && g.members ? <i> of {g.members}</i> : null}</b>
                  <i>{g.name}</i>
                </a>
              )) : null}
              {who ? (
                <a className="sty-fca" href="/today#sty-board">
                  <b>{stats.dayRank ? '#' + stats.dayRank : '–'}</b><i>Today</i>
                </a>
              ) : null}
              {who ? (
                <a className="sty-fca" href="/quizzes/hub">
                  <b>{rank ? '#' + rank : '–'}</b><i>All-Time</i>
                </a>
              ) : null}
            </div>
            <button type="button" className="sty-cx sty-tg"
              onClick={() => setTheme(light ? 'dark' : 'light')}
              aria-label={light ? 'Switch to dark' : 'Switch to light'} title={light ? 'Switch to dark' : 'Switch to light'}>
              {light ? (
                <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" aria-hidden="true">
                  <path d="M20 14.5A8 8 0 1 1 9.5 4a6.5 6.5 0 0 0 10.5 10.5Z" />
                </svg>
              ) : (
                <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" aria-hidden="true">
                  <circle cx="12" cy="12" r="4" />
                  <path d="M12 3v2M12 19v2M3 12h2M19 12h2M5.6 5.6l1.4 1.4M17 17l1.4 1.4M18.4 5.6L17 7M7 17l-1.4 1.4" />
                </svg>
              )}
            </button>
          </div>
        </div>
      </div>

      <nav className="lc-nav" aria-label="Sections">
        <div className="sty-ixn">
          {ixLink('all', 'All Puzzles', 'var(--stg-ink)')}
          {ixLink('sty-mine', 'My Puzzles', 'var(--stg-acc)')}
          <span className="sty-ixsep" aria-hidden="true" />
          {orderedCats.map(({ cat, games: gs }) => (
            <React.Fragment key={cat}>
              <button type="button" className={'sty-ixb' + (cat === shownCat ? ' on' : '')} style={{ '--cc': hueFor(cat) }}
                aria-expanded={cat === shownCat} onClick={() => toggleCat(cat)}>
                <i aria-hidden="true" /><span>{catLabel(cat)}</span>
              </button>
              {cat === shownCat ? (
                <div className="lc-sub">
                  {gs.map((g) => {
                    const isNow = g.key === game.key;
                    const paused = !done.has(g.key) && inprog.has(g.key) && !isNow;
                    const mark = done.has(g.key) ? '\u2713' : isNow ? 'Playing' : paused ? pauseIcon : (nextUp && nextUp.key === g.key ? 'Up next' : '');
                    return isNow ? (
                      <span key={g.key} aria-current="page" className="lc-g now" style={{ '--cc': hueFor(cat) }}>
                        {g.name}<s>{mark}</s>
                      </span>
                    ) : (
                      <Link key={g.key} href={gameHref(g)} className="lc-g" style={{ '--cc': hueFor(cat) }}>
                        {g.name}<s className={mark === 'Up next' ? 'up' : paused ? 'pz' : undefined}>{mark}</s>
                      </Link>
                    );
                  })}
                </div>
              ) : null}
            </React.Fragment>
          ))}
          <span className="sty-ixsep" aria-hidden="true" />
          {ixLink('sty-circs', 'Circuits', 'var(--stg-mute)')}
          {ixHash('sty-quizzes', 'Quizzes')}
          {ixHash('sty-iq', 'IQ Tests')}
          {ixHash('sty-exams', 'School Tests')}
          {ixDoor('/kids', 'Kids')}
          {ixDoor('/lists', 'Top 10 Lists')}
          {ixDoor('/archive', 'Puzzle Archive')}
          <span className="sty-ixsep" aria-hidden="true" />
          {ixHash('sty-board', 'Leaderboards + Stats')}
          {ixHash('sty-comm', 'Most Appreciated')}
        </div>
      </nav>

      <aside className="lc-side" aria-label={game.name + ' panel'}>
        <div className="lc-tabs" role="tablist">
          {tabs.map(([id, label]) => (
            <button key={id} type="button" role="tab" aria-selected={tab === id}
              className={'lc-tab' + (tab === id ? ' on' : '')} onClick={() => setTab(id)}>{label}</button>
          ))}
        </div>
        <div className="lc-body">
          {tab === 'board' ? (
            board === null ? <div className="lc-hold" aria-hidden="true" /> : (
              <>
                <div className="lc-cap2"><span>Today{field ? ` · ${field} ${field === 1 ? 'player' : 'players'}` : ''}</span></div>
                {board.length ? board.slice(0, 14).map((r, i) => {
                  const isMe = meRow && r.userKey && r.userKey === meRow.userKey;
                  return (
                    <div key={(r.userKey || r.username || '') + i} className={'lc-row' + (isMe ? ' me' : '')}>
                      <span>{r.rank != null ? r.rank : i + 1}</span>
                      <b>{isMe ? 'You' : (r.username || 'Guest')}</b>
                      <em>{gameStatsShort(r, game.key) || ''}</em>
                    </div>
                  );
                }) : <div className="lc-empty">Nobody on the board yet today.</div>}
                {meRow && !board.slice(0, 14).some((r) => r.userKey && r.userKey === meRow.userKey) ? (
                  <div className="lc-row me"><span>{meRow.rank}</span><b>You</b><em>{gameStatsShort(meRow, game.key) || ''}</em></div>
                ) : null}
              </>
            )
          ) : null}
          {tab === 'group' ? (
            groups.length ? groups.map((g) => {
              const rows = (g.boards && g.boards[game.key]) || [];
              const feed = Array.isArray(g.feed) ? g.feed.slice(0, 8) : [];
              return (
                <div key={g.code} style={{ marginBottom: 18 }}>
                  <div className="lc-cap2"><b style={{ color: 'var(--stg-ink)' }}>{g.name}</b><span>{g.rank ? `You #${g.rank}${g.members ? ' of ' + g.members : ''} today` : ''}</span></div>
                  <div className="lc-mo">{game.name} in the group</div>
                  {rows.length ? rows.slice(0, 8).map((r, i) => {
                    const isMe = r.userKey && r.userKey === grp.userKey;
                    return (
                      <div key={(r.userKey || '') + i} className={'lc-row' + (isMe ? ' me' : '')}>
                        <span>{r.rank != null ? r.rank : i + 1}</span>
                        <b>{isMe ? 'You' : (r.username || 'Member')}</b>
                        <em>{r.abandoned ? 'Paused' : (gameStatsShort(r, game.key) || '')}</em>
                      </div>
                    );
                  }) : <div className="lc-empty">Nobody in the group has played {game.name} today.</div>}
                  <div className="lc-mo">Group activity</div>
                  {feed.length ? feed.map((f, i) => (
                    <div key={i} className="lc-row" style={{ gridTemplateColumns: '1fr auto' }}>
                      <span style={{ color: 'var(--stg-ink)', fontWeight: 600 }}>
                        <b>{f.userKey === grp.userKey ? 'You' : f.username}</b>{' finished '}{(DAILY_GAME_MAP[f.key] || {}).name || f.key}{f.lead ? ' \u00b7 leads' : ''}
                      </span>
                      <em>{ago(f.at)}</em>
                    </div>
                  )) : <div className="lc-empty">No finishes in the group yet today.</div>}
                </div>
              );
            }) : null
          ) : null}
          {tab === 'you' ? (
            mineRec ? (
              <div className="lc-stats">
                <div className="lc-stat"><b>{mineRec.plays || 0}</b><i>Played</i></div>
                <div className="lc-stat"><b>{mineRec.currentStreak || 0}</b><i>Current streak</i></div>
                <div className="lc-stat"><b>{mineRec.longestStreak || 0}</b><i>Longest streak</i></div>
                <div className="lc-stat"><b>{mineRec.avgPoints != null ? mineRec.avgPoints : '–'}</b><i>Avg points</i></div>
              </div>
            ) : (data ? <div className="lc-empty">Play a day and your record shows up here.</div> : <div className="lc-hold" aria-hidden="true" />)
          ) : null}
          {tab === 'archive' ? (
            months.length ? months.map((mo) => (
              <div key={mo.m}>
                <div className="lc-mo">{mo.m}</div>
                <div className="lc-cal">
                  {mo.days.map((d) => (
                    <Link key={d.num} className={'lc-day' + (d.isToday ? ' t' : d.played ? ' p' : '')}
                      href={d.isToday ? `${game.href || '/' + game.key}?layout=c` : `${game.href || '/' + game.key}?p=${d.num}&layout=c`}
                      title={d.dateISO}>{Number(String(d.dateISO).slice(8, 10))}</Link>
                  ))}
                </div>
              </div>
            )) : <div className="lc-hold" aria-hidden="true" />
          ) : null}
          {tab === 'rules' ? (
            <div className="lc-how"><p style={{ marginTop: 0 }}><b>{game.tag}.</b></p><p>{game.how}</p></div>
          ) : null}
        </div>
      </aside>
    </>
  );

  return (
    <>
      {createPortal(<><style dangerouslySetInnerHTML={{ __html: CSS }} />{frame}{fgEl ? null : <div style={{ position: 'fixed', top: 8, right: 16, zIndex: 81 }}>{subBtn}</div>}</>, host)}
      {fgEl ? createPortal(subBtn, fgEl) : null}
    </>
  );
}
