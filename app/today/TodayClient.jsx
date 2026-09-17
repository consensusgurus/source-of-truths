'use client';

// The marquee category home (live preview at /today), on the light paper ground
// since 2026-08-24 (owner-approved blend, artifact "the-blend"), deepened to
// #e7ecf3 on 2026-08-25 so the white cards and tiles read as lit surfaces
// rather than three shades of the same white: the navy site header
// stays untouched above this component; the component itself flips to the light
// paper theme the game pages use. Top to bottom:
//   - NO welcome band. It carried a greeting, the day meter (played / IQ
//     gained / progress) and two jump chips until 2026-08-25, when the owner
//     moved every figure on it up into the navy header (which already named the
//     player, their rank and their IQ total, so the band was restating the same
//     person one card lower) and the Leaderboards jump with them. The Live feed
//     chip was not kept: the feed sits beside the boards it pointed at.
//   - a FOR YOU row (blue chrome): paused games, the Daily Five's next game,
//     the next unplayed game, and a date-rotated spotlight pick. Every Resume
//     control is GOLD (owner rule); gold otherwise marks only paused tiles.
//   - one white shelf CARD per category: tinted header strip with a 4px rule
//     in the category color, a done-count + progress bar on the label, and a
//     CTA chip filled with the category color (gold when it is a Resume).
//     A category with every game done collapses to a green band with the
//     scores ("Show tiles" expands it).
//
// DATA is the same plumbing the slate uses, deliberately:
//   - done/paused detection is DailyStrip's three-pass recipe verbatim:
//     (1) sot_<key>_day breadcrumbs on first paint, (2) fetchDayStatus
//     (completed/played/abandoned/inProgress ids, streaks), (3) per-puzzle
//     saves keyed by the daily-combined payload's nums, gated on t0 per the
//     opening-is-not-starting rule.
//   - per-game plays/standings/leaders come from /api/quiz/daily-combined.
//   - a tile is a LINK AND NOTHING ELSE (owner, 2026-08-24). The status chip
//     used to open a DailyTilePanel drawer under the shelf; that panel now
//     lives at the foot of each game's own page, behind "See stats, archive,
//     leaderboard, and more" (app/GamePanel.jsx), where the person reading it
//     is the person playing. Nothing on this page expands any more.
//   - the Sudoku shelf is the sudoku circuit POOL (all eight grids publish a
//     puzzle every day). The date is read in an EFFECT, never during render,
//     so SSR and the client agree.
//   - the live feed section is ANONYMOUS by owner rule (2026-08-10): rows
//     carry results without attribution, the band carries the day's totals.
//   - completed games sink to the FAR RIGHT of their row (owner, 2026-08-24);
//     paused games are NOT moved.
//
// NEVER add a blanket `.tdy a { color: ... }` rule here. It out-specifies the
// single-class selectors the tiles and rails style their own anchors with, and
// it once turned a Play button white-on-white (caught live, 2026-08-24). Style
// anchors by their own class only.

import { useEffect, useMemo, useRef, useState } from 'react';
import StageToday from './StageToday';
import { useStageTheme } from '@/lib/stage-theme';
import { DAILY_GAMES, DAILY_GAME_MAP } from '@/lib/daily-games';
import { CIRCUITS, ALL_CIRCUITS, DISPLAY_CIRCUITS, CIRCUIT_BASE, circuitById, circuitKeysFor, circuitPageHref, circuitEntryHref } from '@/lib/circuits';
import { catBlue } from '@/lib/home-blues';
import StageLadder from '../StageLadder';
import { fetchDayStatus, etToday, DAY_ROSTER } from '../useDayStats';
// The pins are the ones the old console (DailyStrip) already wrote: same
// /api/quiz/favorites, same account column, same two-tier promotion. Nothing
// new is stored for My games.
import useMyGames from '../useMyGames';
import GauntletPop from './GauntletPop';

const CAT_ORDER = ['Word', 'Sudoku', 'End Game', 'Logic', 'Numbers', 'Trivia', 'Crowd Psychology', 'Geography', 'Cards', 'Arcade'];

// Sum a set of games' per-game boards into one standings list. Same known
// limit as the Loft's category leaders: each per-game board carries only its
// named top rows, so a player outside every game's top board is invisible to
// the sum. Shared by the shelf-header leader chip and the standings panel.
function aggregateShelf(bgames, games) {
  const acc = new Map();
  for (const g of games) {
    const bg = bgames.find((x) => x && x.key === g.key);
    const rows = bg && Array.isArray(bg.board) ? bg.board : [];
    for (const r of rows) {
      if (!r || !r.userKey) continue;
      const cur = acc.get(r.userKey) || { userKey: r.userKey, username: r.username, pts: 0, games: 0 };
      cur.pts += (typeof r.points === 'number' ? r.points : 0);
      cur.games += 1;
      acc.set(r.userKey, cur);
    }
  }
  return [...acc.values()]
    .sort((a, b) => b.pts - a.pts || a.games - b.games || String(a.username || '').localeCompare(String(b.username || '')));
}

function catColor(name) {
  if (name === 'Crowd Psychology') return catBlue('crowd');
  return catBlue(name);
}

function identityQs() {
  const p = new URLSearchParams();
  try { const a = localStorage.getItem('sot_quiz_anon'); if (a) p.set('anonId', a); } catch (e) {}
  try { const id = JSON.parse(localStorage.getItem('sot_quiz_identity') || 'null'); if (id && id.email) p.set('email', id.email); } catch (e) {}
  return p.toString();
}

// The two hero chips jump down to the boards row. A bare hash lands the target
// flush with the viewport top, which on the homepage is UNDER the pinned
// masthead, so the heading you asked for is the one thing you cannot see. Same
// fix focusListSearch in QuizCommandHeader uses: measure whatever bar is
// actually pinned and scroll to the target minus its height. The candidates
// differ by width (the masthead is one sticky .qchm on desktop and collapses to
// display:contents with .qchm-r1 pinned on a phone) and /today has no masthead
// at all, so take the tallest one whose COMPUTED position is sticky or fixed.
function pinnedBarH() {
  let h = 0;
  for (const sel of ['.qch-bar', '.qchm-r1', '.qchm']) {
    const el = document.querySelector(sel);
    if (!el) continue;
    let pos = '';
    try { pos = getComputedStyle(el).position; } catch (e) {}
    if (pos !== 'sticky' && pos !== 'fixed') continue;
    h = Math.max(h, el.getBoundingClientRect().height);
  }
  return h;
}
// The category jump bar is sticky UNDERNEATH the masthead, so a jump has to
// clear BOTH. pinnedBarH takes the tallest sticky masthead; this adds the bar's
// own height on top of that rather than folding it into the same max.
function jumpBarH() {
  try {
    const el = document.querySelector('.tdy-jb');
    if (!el) return 0;
    if (getComputedStyle(el).position !== 'sticky') return 0;
    return el.getBoundingClientRect().height;
  } catch (e) { return 0; }
}

// A section id for a shelf, stable across the categories and circuits views.
function secId(shelf) {
  return 'tdy-' + (shelf.kind || 'cat') + '-' + String(shelf.name).toLowerCase().replace(/[^a-z0-9]+/g, '-');
}

// The hand-dragged category order lives on this browser. Pins live on the
// account (they are a set worth carrying between devices); a shelf order is a
// per-screen preference, so it needs no column and no migration.
const CAT_ORDER_KEY = 'sot_cat_order';

// WHICH SHELVES ARE OPEN, and a first load opens NONE of them (owner,
// 2026-09-01). Seventy games in ten sideways rows is a lot of page to hand a
// reader who has not asked for any of it, so the page now opens as a run of
// TITLES: every shelf paints its own coloured band, and the band is the
// control that opens it.
//
// THE TILES STAY IN THE HTML, hidden with display:none rather than dropped
// from the render. That is not about animation: this page is the crawl path to
// every daily, and a collapse that removed the tiles would take ~70 internal
// links with it. It also keeps TilesRow's ResizeObserver on a real element, so
// a row measures its own overflow the moment it is shown.
//
// OPENING A SHELF STICKS, per browser, beside the category order and for the
// same reason it gave: pins are a set worth carrying between devices, a shelf
// order and a shelf's open state are per-screen preferences, so neither needs a
// column or a migration. The stored value is an explicit OVERRIDE map, never a
// list of open shelves: a shelf the reader has never touched keeps following
// the default (which changes the day they pin something), and a shelf they shut
// by hand stays shut even where the default would open it.
const SHELF_OPEN_KEY = 'sot_shelf_open';
const MINE_ID = 'tdy-mine';
const CIRC_ID = 'tdy-circuits';

// THE CIRCUITS ROW SHOWS ONE CIRCUIT (owner, 2026-09-01): the Trivia Gauntlet.
// Seventeen tiles was the whole family laid out for a reader who had not asked
// for any particular one, and the family already has its own index page. The
// row's last tile opens the rest in place, which is also where their stars are.
const LEAD_CIRCUITS = ['gauntlet', 'five', 'sudoku'];   // the shelf's front three (owner, 2026-09-01)

// A pinned CIRCUIT is stored as `c:<id>` (owner, 2026-09-01). One favorites
// column, one star control, two kinds of thing in it: the prefix is what stops
// a circuit id ever colliding with a game key, and every consumer that reads
// that column for GAMES (sortByMyGames, the old console) simply never matches a
// prefixed key, so none of them needed touching. /api/quiz/favorites validates
// the prefix against ALL_CIRCUITS. No migration: the column is a text array.
const CIRC_PIN = 'c:';
const circPinKey = (id) => CIRC_PIN + id;
const isCircPin = (k) => typeof k === 'string' && k.slice(0, 2) === CIRC_PIN;
const circPinId = (k) => (isCircPin(k) ? k.slice(2) : null);

function jumpTo(e, id) {
  try {
    const el = document.getElementById(id);
    if (!el) return;
    e.preventDefault();
    const y = el.getBoundingClientRect().top + window.scrollY - (pinnedBarH() + jumpBarH() + 14);
    const max = Math.max(0, document.documentElement.scrollHeight - window.innerHeight);
    window.scrollTo({ top: Math.min(max, Math.max(0, y)), behavior: 'smooth' });
    try { window.history.replaceState(null, '', '#' + id); } catch (x) {}
  } catch (x) {}
}

const TROPHY = (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#e8b43a" strokeWidth="2.1" aria-hidden="true" style={{ flex: 'none' }}>
    <path d="M6 4h12v3.5a6 6 0 0 1-12 0zM6 5H3.5v1.8a3 3 0 0 0 3 3M18 5h2.5v1.8a3 3 0 0 1-3 3M9.5 20h5M12 13.5V20" />
  </svg>
);
const CROWN = (
  <svg width="10" height="10" viewBox="0 0 24 24" fill="#e8b43a" aria-hidden="true" style={{ flex: 'none' }}>
    <path d="M3 7l3.8 3.4L12 3l5.2 7.4L21 7l-1.7 12H4.7z" />
  </svg>
);

// A shelf's tile track with desktop scroll affordances: an edge nudge chip on
// whichever side has more to show, plus a short white fade under it (the
// tracks all live inside white cards on the paper ground). On touch the chips
// are hidden and the track simply flicks.
function TilesRow({ children, light = false }) {
  const ref = useRef(null);
  const [can, setCan] = useState({ l: false, r: false });
  useEffect(() => {
    const el = ref.current;
    if (!el) return undefined;
    const upd = () => setCan({ l: el.scrollLeft > 4, r: el.scrollLeft < el.scrollWidth - el.clientWidth - 4 });
    upd();
    el.addEventListener('scroll', upd, { passive: true });
    window.addEventListener('resize', upd);
    const ro = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(upd) : null;
    if (ro) ro.observe(el);
    return () => {
      el.removeEventListener('scroll', upd);
      window.removeEventListener('resize', upd);
      if (ro) ro.disconnect();
    };
  }, []);
  const nudge = (dir) => {
    const el = ref.current;
    if (el) el.scrollBy({ left: dir * Math.max(200, el.clientWidth - 160), behavior: 'smooth' });
  };
  return (
    <div className={'tdy-tw' + (light ? ' light' : '')}>
      <div className="tdy-tiles" ref={ref}>{children}</div>
      <div className={'tdy-fade l' + (can.l ? ' on' : '')} aria-hidden="true" />
      <div className={'tdy-fade r' + (can.r ? ' on' : '')} aria-hidden="true" />
      {can.l ? <button type="button" className="tdy-nud l" onClick={() => nudge(-1)} aria-label="Scroll back">‹</button> : null}
      {can.r ? <button type="button" className="tdy-nud r" onClick={() => nudge(1)} aria-label="Scroll forward">›</button> : null}
    </div>
  );
}

export default function TodayClient({ onSignup = null } = {}) {
  // THE HOME ON THE STAGE is its own surface, not this one re-coloured: a token
  // remap over this page moved the text and left the artwork, which is the
  // white-card-with-white-text failure in another costume. Read in an EFFECT,
  // because this page is statically rendered and useSearchParams returns null
  // here — that is what made ?stage=1 a silent no-op the first time.
  // THE HOME IS ON THE STAGE TOO (owner, 2026-08-31, sitewide). '?stage=0' is
  // the way back to this page for one load, matching the games' own opt-out in
  // lib/stage.js, so a report about the home can be checked against the old one
  // without a deploy.
  //
  // Still read in an EFFECT, not during render: useSearchParams() returns null
  // on a statically rendered page and fails the build, and resolving it during
  // render would make the client's first paint disagree with the server's. So
  // the default here is FALSE and the stage arrives a beat later, which is the
  // same shape every clock- and storage-dependent read on this site uses.
  const [stageOn, setStageOn] = useState(false);
  useEffect(() => {
    try { setStageOn(new URLSearchParams(window.location.search).get('stage') !== '0'); } catch (e) { setStageOn(true); }
  }, []);
  useStageTheme();
  // Build the shelves once: the sudoku circuit pool leaves Numbers and becomes
  // its own category. Static, so the server and client render the same rows.
  const shelves = useMemo(() => {
    const live = new Set(DAY_ROSTER);
    const pool = (circuitById('sudoku') || { keys: [] }).keys.filter((k) => live.has(k));
    const poolSet = new Set(pool);
    return CAT_ORDER.map((name) => {
      let games;
      // THE POOL IS NOT THE CATEGORY. The shelf used to render the sudoku circuit
      // pool and nothing else, so a game carrying cat: 'Sudoku' but sitting outside
      // the pool matched this shelf and was excluded from it, and no other shelf
      // claimed it either: Whittle launched invisible on this page (2026-09-04).
      // Pool first, so the rotation keeps its order, then any other live sudoku.
      if (name === 'Sudoku') games = pool.map((k) => DAILY_GAME_MAP[k]).filter(Boolean)
        .concat(DAILY_GAMES.filter((g) => live.has(g.key) && g.cat === 'Sudoku' && !poolSet.has(g.key)));
      else games = DAILY_GAMES.filter((g) => live.has(g.key) && g.cat === name && !poolSet.has(g.key));
      // Alphabetical within each shelf (owner, 2026-08-24).
      games = games.slice().sort((a, b) => a.name.localeCompare(b.name));
      return { name, color: catColor(name), games };
    }).filter((s) => s.games.length);
  }, []);
  const totalGames = useMemo(() => shelves.reduce((n, s) => n + s.games.length, 0), [shelves]);

  // ── THE READER'S OWN NAVIGATION (owner, 2026-08-25) ──────────────────
  // 69 games across ten sideways-scrolling shelves meant roughly half the
  // slate sat off-screen with no way to reach it by name, and the ten shelves
  // ran in an editorial order that suited nobody in particular. Four
  // additions, all of them personal to the reader:
  //   1. a STICKY BAR of category jump chips, each chip's own tint fill being
  //      its done/total meter, so the bar doubles as the day's progress.
  //   2. MY GAMES, the pinned set, above every category, with a star on every
  //      tile. Pins are the account-stored ones /api/quiz/favorites already
  //      holds (migration 45), so a guest gets a teaser instead.
  //   3. REORDER, a hand-dragged category order, DEFAULTING to how much this
  //      player plays each category.
  //   4. an A TO Z index of the whole slate, reachable from the bar at any
  //      scroll depth.
  // SSR SAFETY, the same discipline sinkDone already follows: pins,
  // archive counts and the stored order all start empty, so the server and the
  // first client paint render the plain editorial order with no My games
  // shelf, and the personal layer lands a moment later from its effects.
  const { favorites, canPin, registered, loaded: pinsLoaded, max: pinMax, toggleFavorite } = useMyGames();

  // A REJECTED PIN MUST SAY SO (owner report, 2026-08-26). toggleFavorite is
  // optimistic and settles against the server, so a rejection un-fills the star
  // and drops the tile back out of My games. Discarding its result, which this
  // page did, makes that read as the star mechanism being broken: the reported
  // symptom was "i star them and they unstar and remove themselves". The cap
  // that caused it is gone, but every other rejection (signed out, write failed,
  // offline) rolls back exactly the same way, so the note is the real fix and
  // the cap removal is the specific one. The old DailyStrip console got this
  // right by disabling the star and explaining; this is the same duty on a page
  // whose star is never disabled.
  const [pinErr, setPinErr] = useState(null);
  useEffect(() => {
    if (!pinErr) return undefined;
    const t = setTimeout(() => setPinErr(null), 6000);
    return () => clearTimeout(t);
  }, [pinErr]);

  // Per-game archive counts ride along on the SAME fetchDayStatus payload the
  // day state already reads (pass 2 below): archive[key].played is how many of
  // that game's days this player has played. No extra request, which is what
  // makes a play-count-ordered home cheap enough to ship at all (the 2026-08-02
  // most-played tier was cut because it put a full quiz_results scan on the
  // homepage critical path; this reads a payload that was already in flight).
  const [archive, setArchive] = useState(null);
  // null = the default order. An array = the reader dragged their own.
  const [catOrder, setCatOrder] = useState(null);
  // NULL until the browser's own overrides are read, which keeps the server and
  // the first client paint agreeing on the default (everything shut).
  const [shelfOpen, setShelfOpen] = useState(null);
  // The circuits row past its one lead tile. Not persisted: it is a look at the
  // family, not a preference about the page.
  const [circAll, setCircAll] = useState(false);
  // 'az' | 'order' | null, the bar's two dropdowns.
  const [sheet, setSheet] = useState(null);
  // The chip track scrolls, and until 2026-08-25 the only ways to scroll it
  // were a touch drag and a trackpad swipe: on a desktop mouse the categories
  // past the right edge were unreachable (owner). Two arrows, rendered only
  // when there is something that way to reach, and never on a touch pointer
  // where the drag already works.
  const jbtRef = useRef(null);
  const [jbNav, setJbNav] = useState({ l: false, r: false });
  const readJbNav = () => {
    const el = jbtRef.current;
    if (!el) return;
    const over = el.scrollWidth > el.clientWidth + 4;
    setJbNav((cur) => {
      const l = over && el.scrollLeft > 4;
      const r = over && el.scrollLeft < el.scrollWidth - el.clientWidth - 4;
      return (cur.l === l && cur.r === r) ? cur : { l, r };
    });
  };
  const jbNudge = (dir) => {
    const el = jbtRef.current;
    if (!el) return;
    el.scrollBy({ left: dir * Math.max(180, Math.round(el.clientWidth * 0.7)), behavior: 'smooth' });
  };
  // Which chip is ringed. Set from a scroll listener, so it bails out when the
  // answer has not changed.
  const [here, setHere] = useState(null);
  // The bar sticks under whatever masthead this page has, and the two differ
  // by width, so the offset is measured rather than hardcoded.
  const [barTop, setBarTop] = useState(0);
  // THE BAR HAS NO GROUND UNTIL IT STICKS (owner, 2026-08-28). Painting it the
  // page colour was not enough: any ground at all is a rectangle the moment the
  // colour underneath it is not exactly that colour, which is every page whose
  // ground is not #e7ecf3 and every future move of that literal. At rest the
  // bar paints NOTHING, so there is nothing to line up and nothing to see. It
  // takes an opaque ground only while it is pinned, where it needs one to be a
  // floor for the tiles scrolling under it. Set from the same scroll listener
  // the chip spy already runs, so it costs no extra listener.
  const [stuck, setStuck] = useState(false);
  const dragFrom = useRef(null);

  useEffect(() => {
    try {
      const raw = JSON.parse(localStorage.getItem(CAT_ORDER_KEY) || 'null');
      if (Array.isArray(raw) && raw.length) {
        const clean = raw.filter((n) => CAT_ORDER.includes(n));
        if (clean.length) setCatOrder(clean);
      }
    } catch (e) {}
  }, []);

  useEffect(() => {
    try {
      const raw = JSON.parse(localStorage.getItem(SHELF_OPEN_KEY) || 'null');
      if (raw && typeof raw === 'object' && !Array.isArray(raw)) {
        const clean = {};
        for (const k of Object.keys(raw)) if (typeof raw[k] === 'boolean') clean[k] = raw[k];
        setShelfOpen(clean);
      } else {
        setShelfOpen({});
      }
    } catch (e) { setShelfOpen({}); }
  }, []);

  useEffect(() => {
    const upd = () => setBarTop(pinnedBarH());
    upd();
    window.addEventListener('resize', upd);
    // The masthead can settle after its own fonts and chips land.
    const t = setTimeout(upd, 500);
    // AND IT CHANGES HEIGHT LATER, with no resize event to announce it: the
    // stats row reads differently once the player's own row lands, and a
    // longer handle can wrap. A one-off measurement plus a 500ms retry then
    // leaves the bar pinned to a height the masthead no longer has, and the
    // difference is a strip of page content scrolling through the gap.
    // Watch the elements themselves; the callback is the same idempotent
    // setState, so an extra fire costs a comparison.
    let ro = null;
    try {
      ro = new ResizeObserver(upd);
      for (const sel of ['.qch-bar', '.qchm-r1', '.qchm']) {
        const el = document.querySelector(sel);
        if (el) ro.observe(el);
      }
    } catch (e) {}
    return () => {
      window.removeEventListener('resize', upd);
      clearTimeout(t);
      if (ro) ro.disconnect();
    };
  }, []);

  const catPlays = useMemo(() => {
    const out = {};
    for (const s of shelves) {
      out[s.name] = archive
        ? s.games.reduce((n, g) => n + ((archive[g.key] && archive[g.key].played) || 0), 0)
        : 0;
    }
    return out;
  }, [shelves, archive]);

  // A hand-dragged order wins. Otherwise the shelves sort by how much this
  // player plays each category. Array.prototype.sort is stable, so categories
  // the player has never touched keep the editorial order among themselves.
  const orderedShelves = useMemo(() => {
    if (catOrder && catOrder.length) {
      const idx = new Map(catOrder.map((n, i) => [n, i]));
      return shelves.slice().sort((a, b) => (idx.has(a.name) ? idx.get(a.name) : 99) - (idx.has(b.name) ? idx.get(b.name) : 99));
    }
    if (!archive) return shelves;
    return shelves.slice().sort((a, b) => (catPlays[b.name] || 0) - (catPlays[a.name] || 0));
  }, [shelves, catOrder, archive, catPlays]);

  const azGames = useMemo(() => {
    const all = [];
    for (const s of shelves) for (const g of s.games) all.push({ g, color: s.color });
    all.sort((a, b) => a.g.name.localeCompare(b.g.name));
    const groups = [];
    for (const it of all) {
      const L = it.g.name.charAt(0).toUpperCase();
      if (!groups.length || groups[groups.length - 1].letter !== L) groups.push({ letter: L, items: [] });
      groups[groups.length - 1].items.push(it);
    }
    return { groups, count: all.length };
  }, [shelves]);

  // ── the day, read in an effect so SSR and the client never disagree ──
  const [today, setToday] = useState(null);
  useEffect(() => {
    const iso = etToday();
    setToday(iso);
  }, []);
  // NOTE: every sudoku grid publishes a puzzle every day. The circuit's 5-of-8
  // rotating window (circuitKeysFor) only decides which five count toward the
  // sudoku CIRCUIT that day; it is NOT a playability signal. An earlier version
  // dimmed the other three "Back soon" and blocked their clicks, which was
  // wrong (owner caught Mercury, 2026-08-24). All eight tiles render normally.

  // THE SELECTOR IS GONE (owner, 2026-08-26). Categories and Circuits were two
  // views under a tablist in the jump bar, which made the reader choose between
  // them before seeing either, and hid whichever one they did not pick. There is
  // ONE slate now: the categories, with the circuits as a single shelf of their
  // own sitting where the Continue row used to, treated like any other category
  // (its own jump-bar chip, its own header band, its own tiles row). A game can
  // sit in several circuits, which is the nature of circuits, not a bug.
  // MEASURE ON MUTATION, NOT ON RESIZE (fixed 2026-08-26). The overflow that
  // decides whether the scroll arrows render is a property of the track's
  // CONTENT, but the only things re-measuring it were scroll, window resize,
  // and a ResizeObserver on the track itself, whose width never changes: it is
  // flex:1 1 auto inside a fixed bar. So chips that arrive AFTER first paint,
  // which is all of them that depend on the player (My games) or on the day
  // (Circuits), pushed the track into overflow with nothing left to notice, and
  // the right arrow simply never appeared. The MutationObserver on the track's
  // subtree is the fix; the RO stays for the width case.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    const el = jbtRef.current;
    if (!el) return undefined;
    readJbNav();
    el.addEventListener('scroll', readJbNav, { passive: true });
    const ro = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(readJbNav) : null;
    if (ro) ro.observe(el);
    const mo = typeof MutationObserver !== 'undefined' ? new MutationObserver(readJbNav) : null;
    if (mo) mo.observe(el, { childList: true, subtree: true, characterData: true });
    window.addEventListener('resize', readJbNav);
    return () => {
      el.removeEventListener('scroll', readJbNav);
      if (ro) ro.disconnect();
      if (mo) mo.disconnect();
      window.removeEventListener('resize', readJbNav);
    };
  }, []);
  // ALL_CIRCUITS, NOT CIRCUITS (owner, 2026-08-26, asking where the Daily Five
  // had gone). The family's head is the marquee, and lib/circuits already puts
  // it first for exactly this reason; the shelf was missing it only because the
  // map ran over the skill circuits alone. `circuitKeysFor` delegates the
  // marquee to lib/daily-five, so its roster is the day's real run rather than
  // a fixed array, and it takes GOLD rather than its first game's category
  // colour: the roster changes at midnight, so no one category owns it.
  const circuitShelves = useMemo(() => {
    if (!today) return [];
    return DISPLAY_CIRCUITS.map((c) => {
      let keys;
      try { keys = circuitKeysFor(c.id, today) || []; } catch (e) { keys = []; }
      const games = keys.map((k) => DAILY_GAME_MAP[k]).filter(Boolean);
      if (!games.length) return null;
      let color = catColor(games[0].cat);
      if (c.marquee) color = '#e8b43a';
      else if (c.id === 'sudoku') color = catBlue('sudoku');
      return { kind: 'circuit', id: c.id, name: c.name, blurb: c.blurb || '', color, games };
    }).filter(Boolean);
  }, [today]);

  // MY GAMES HOLDS BOTH KINDS (owner, 2026-09-01). Pins, resolved against
  // today's slate: the route cleans against the roster, which still holds
  // retired games, and a circuit resolves through circuitShelves so it carries
  // the day's real roster rather than a fixed array.
  //
  // DECLARED HERE, BELOW circuitShelves, and that placement is load-bearing:
  // this memo's body runs during render, so reading a `const` declared further
  // down the component is a TDZ ReferenceError, not a stale value.
  const pinned = useMemo(() => {
    if (!canPin || !favorites || !favorites.length) return [];
    const onSlate = new Map();
    for (const s of shelves) for (const g of s.games) onSlate.set(g.key, g);
    const circs = new Map(circuitShelves.map((c) => [circPinKey(c.id), c]));
    return favorites.map((k) => {
      if (isCircPin(k)) {
        const c = circs.get(k);
        return c ? { ...c, pinKey: k, href: circuitEntryHref(c.id) } : null;
      }
      const g = onSlate.get(k);
      return g ? { ...g, pinKey: k } : null;
    }).filter(Boolean);
  }, [favorites, canPin, shelves, circuitShelves]);

  // ── play state: DailyStrip's three passes ──
  const [done, setDone] = useState(() => new Set());
  const [inprog, setInprog] = useState(() => new Set());

  // (1) same-device breadcrumbs, first paint
  useEffect(() => {
    const t = etToday();
    const d = new Set(); const ip = new Set();
    for (const g of DAILY_GAMES) {
      try {
        const c = JSON.parse(localStorage.getItem(g.store) || 'null');
        if (c && c.d === t) { if (c.done) d.add(g.key); else ip.add(g.key); }
      } catch (e) {}
    }
    if (d.size) setDone(d);
    if (ip.size) setInprog(ip);
  }, []);

  // (2) cross-device, via the shared daily-status fetch
  useEffect(() => {
    let alive = true;
    fetchDayStatus().then((data) => {
      if (!alive || !data) return;
      // Free with this payload: per-game archive progress, which is what the
      // default category order sorts on.
      if (data.archive && typeof data.archive === 'object') setArchive(data.archive);
      const [Y, M, D] = etToday().split('-').map(Number);
      const yy = Y % 100;
      const completed = new Set(data.completed || []);
      const played = new Set(data.played || []);
      const abandoned = new Set(data.abandoned || []);
      const openIds = new Set(data.inProgress || []);
      setDone((cur) => {
        const next = new Set(cur);
        for (const g of DAILY_GAMES) {
          const id = `${g.key}-${M}-${D}-${yy}`;
          if (completed.has(id) || played.has(id)) next.add(g.key);
        }
        return next;
      });
      setInprog((cur) => {
        const next = new Set(cur);
        for (const g of DAILY_GAMES) {
          const id = `${g.key}-${M}-${D}-${yy}`;
          if ((abandoned.has(id) || openIds.has(id)) && !completed.has(id) && !played.has(id)) next.add(g.key);
        }
        return next;
      });
    });
    return () => { alive = false; };
  }, []);

  // ── the day's combined board: per-game plays, standings, leaders, my rows ──
  const [board, setBoard] = useState(null);
  useEffect(() => {
    let alive = true;
    const qs = identityQs();
    fetch('/api/quiz/daily-combined' + (qs ? `?${qs}` : ''))
      .then((r) => r.json())
      .then((d) => { if (alive && d && Array.isArray(d.overall)) setBoard(d); })
      .catch(() => {});
    return () => { alive = false; };
  }, []);
  const bgames = board && Array.isArray(board.games) ? board.games : null;
  const meKey = board && board.me ? board.me.userKey : null;
  const bgFor = (key) => (bgames ? bgames.find((x) => x && x.key === key) || null : null);
  const playsOf = (key) => {
    const b = bgFor(key);
    return b && typeof b.plays === 'number' ? b.plays : null;
  };
  const leaderOf = (key) => {
    const b = bgFor(key);
    const top = b && Array.isArray(b.board) && b.board[0] ? b.board[0] : null;
    return top && top.username ? top.username : null;
  };

  // (3) per-puzzle saves for today, keyed by the payload's puzzle nums
  useEffect(() => {
    if (!bgames || !bgames.length) return;
    const ip = new Set(); const dn = new Set();
    for (const g of bgames) {
      if (!g || g.num == null) continue;
      const saveKeys = [`sot_${g.key}_${g.num}`];
      if (g.key === 'crux' && g.rev) saveKeys.push(`sot_crux_${g.num}_r${g.rev}`);
      let playing = false, finished = false;
      for (const k of saveKeys) {
        try {
          const sv = JSON.parse(localStorage.getItem(k) || 'null') || {};
          // t0 is the started signal; 'playing' alone is a game merely opened.
          if (sv.status === 'playing') { if (sv.t0) playing = true; }
          else if (sv.status) finished = true;
        } catch (e) {}
      }
      if (finished) dn.add(g.key);
      else if (playing) ip.add(g.key);
    }
    if (dn.size) setDone((cur) => new Set([...cur, ...dn]));
    if (ip.size) setInprog((cur) => new Set([...cur, ...ip]));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [board]);

  // ── feed data ──
  // The day's own figures (played, IQ gained, daily rank, rank movement) are
  // the HEADER's line now, and it reads them from the same memoized
  // fetchDayStatus, so nothing here has to carry them a second time.
  const [totals, setTotals] = useState(null);
  const [recent, setRecent] = useState(null);
  // Plays SO FAR TODAY per quiz id, so each feed row can say how busy that
  // game is (owner, 2026-08-24). /api/quiz/recent already computes it as
  // todayByQuiz; the feed just was not reading it. Since 2026-08-25 the row
  // FACE carries its own play number (p.dayIndex) and this total is what the
  // tooltip reads, so a row says both where it sits and how big the day is.
  const [dayCounts, setDayCounts] = useState(null);
  useEffect(() => {
    let alive = true;
    fetch('/api/quiz/totals').then((r) => r.json()).then((d) => {
      if (alive && d && !d.error) setTotals({ today: d.today || 0, todayPlayers: d.todayPlayers || 0, todayTime: d.todayTime || 0 });
    }).catch(() => {});
    fetch('/api/quiz/recent').then((r) => r.json()).then((d) => {
      if (!alive || !d) return;
      if (Array.isArray(d.plays)) setRecent(d.plays.slice(0, 18));
      if (d.todayByQuiz && typeof d.todayByQuiz === 'object') setDayCounts(d.todayByQuiz);
    }).catch(() => {});
    return () => { alive = false; };
  }, []);

  // THE LIVE FEED IS CAPPED TO THE LEADERBOARD BESIDE IT (owner, 2026-08-25).
  // The two are columns of one grid row with align-items:start, so each takes
  // its own content height: eighteen feed rows came out at 841px against the
  // board's 594px, and the page ran on under a column of white. Measured rather
  // than picked, because the board's height moves with its tab (the game,
  // category and circuit views each carry a picker row above the standings).
  //
  // Observing the BOARD and sizing the FEED cannot loop: the feed's height
  // feeds the grid ROW, never the board column's own content height. Under the
  // 900px breakpoint the grid is a single column, so the cap comes off and the
  // feed runs at its natural length.
  const lbColRef = useRef(null);
  const [feedH, setFeedH] = useState(null);
  useEffect(() => {
    const el = lbColRef.current;
    if (!el || typeof window === 'undefined') return undefined;
    const apply = () => {
      if (window.innerWidth <= 900) { setFeedH(null); return; }
      const h = Math.round(el.getBoundingClientRect().height);
      setFeedH(h > 260 ? h : null);
    };
    apply();
    let ro = null;
    try { ro = new ResizeObserver(apply); ro.observe(el); } catch (e) { ro = null; }
    // THE MUTATION OBSERVER IS THE ONE THAT ACTUALLY CARRIES THIS, and the two
    // above it are the backstops. A resize observation is delivered in the
    // rendering steps, so a hidden tab never gets one, and the board's own rows
    // land whenever its fetch does, which on a cold read is past any timer worth
    // setting (measured: two timers at 1.2s and 4s both fired while the column
    // was still the short loading state, and the column was 594px by 6.5s). A
    // mutation callback is a microtask and fires on the DOM change itself, tab
    // visible or not, so the cap lands the moment the standings render.
    //
    // It cannot loop: apply only ever sets the FEED column's height, which is a
    // different subtree, and setting the same number again is a no-op React
    // bails out of.
    let mo = null;
    try {
      mo = new MutationObserver(apply);
      mo.observe(el, { childList: true, subtree: true });
    } catch (e) { mo = null; }
    window.addEventListener('resize', apply);
    // A HIDDEN TAB DELIVERS NO RESIZE OBSERVATIONS. They are dispatched in the
    // rendering steps, which a background tab does not run, so a page opened in
    // one measures the board at its loading height, never hears it grow, and
    // carries an uncapped feed for as long as the reader stays away. Measured on
    // the live page with visibilityState 'hidden': the observer never fired once,
    // and a dispatched resize sized the column correctly on the spot. So the
    // visibility flip re-measures, and two late timers cover the ordinary case
    // where the board's own fetch lands after this effect has run.
    document.addEventListener('visibilitychange', apply);
    const t1 = setTimeout(apply, 1200);
    const t2 = setTimeout(apply, 4000);
    return () => {
      if (ro) ro.disconnect();
      if (mo) mo.disconnect();
      clearTimeout(t1); clearTimeout(t2);
      window.removeEventListener('resize', apply);
      document.removeEventListener('visibilitychange', apply);
    };
  }, []);

  // ── the foot leaderboards: Overall / By game / By category / Circuits ──
  const [mode, setMode] = useState('overall');
  const [pickGame, setPickGame] = useState('crux');
  const [pickCat, setPickCat] = useState('Word');
  const [pickCirc, setPickCirc] = useState(CIRCUITS[0] ? CIRCUITS[0].id : 'sudoku');
  const [circBoards, setCircBoards] = useState({});
  useEffect(() => {
    if (mode !== 'circuits' || !pickCirc || circBoards[pickCirc]) return;
    const qs = identityQs();
    let alive = true;
    fetch('/api/quiz/daily-combined?circuit=' + encodeURIComponent(pickCirc) + (qs ? `&${qs}` : ''))
      .then((r) => r.json())
      .then((d) => { if (alive && d && Array.isArray(d.overall)) setCircBoards((cur) => ({ ...cur, [pickCirc]: d })); })
      .catch(() => {});
    return () => { alive = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, pickCirc]);

  // Ordered, not editorial: if a reader has put Trivia at the top, the flat
  // walk of the slate starts in Trivia. Feeds the By game leaderboard.
  const flat = useMemo(() => orderedShelves.flatMap((s) => s.games.map((g) => ({ g, shelf: s }))), [orderedShelves]);

  // A finished category still collapses to the green band with its scores, but
  // it is no longer its own piece of state: EVERY shelf collapses now, so the
  // done band is simply what a shut shelf looks like once all of it is done,
  // and "Show tiles" is the same toggle as the band above it. The old
  // `openDone` set is gone.

  // Completed games sink to the FAR RIGHT of their row (owner, 2026-08-24). A
  // shelf is read left to right as "what should I play next", so a game you
  // have already finished today is the one tile on it with nothing left to
  // offer, and it was sitting mid-strip purely because of the alphabet. Stable
  // partition, so the shelf's alphabetical order survives inside each block,
  // and paused games are NOT moved: they are unfinished business and belong
  // where the reader expects them. `done` is empty on the first render and
  // filled in an effect, so the server and the first client paint agree and
  // the tiles reorder only once the day's state lands.
  const sinkDone = (games) => {
    const open = [];
    const finished = [];
    for (const g of games) (done.has(g.key) ? finished : open).push(g);
    return finished.length ? open.concat(finished) : games;
  };

  const shelfCta = (shelf) => {
    if (shelf.kind === 'circuit') return { label: 'Play the circuit', href: circuitEntryHref(shelf.id), gold: false };
    const paused = shelf.games.find((g) => inprog.has(g.key) && !done.has(g.key));
    if (paused) return { label: `Resume · ${paused.name}`, href: paused.href, gold: true };
    const next = shelf.games.find((g) => !done.has(g.key));
    if (next) return { label: `Next · ${next.name}`, href: next.href, gold: false };
    return { label: 'All done today', href: shelf.games[0].href, gold: false };
  };

  // THE TILE REPORTS THE CROWD, NOT THE READER (owner, 2026-08-26). Two rules,
  // and both are absolute:
  //
  //   NEVER the reader's own score. A line reading "0/10" under a game they
  //   played is the one number on this page that can only make them feel worse,
  //   it is the same figure on every one of their tiles by the end of the day,
  //   and it is already on the end card and in their record. That a game is
  //   PLAYED is still on the tile, carried by the plate's tick badge and ring,
  //   which is the part a reader actually scans for.
  //
  //   ALWAYS both crowd facts, even at zero. The count and the leader are the
  //   two things a tile knows that the reader does not, so they render on every
  //   tile whatever their value: "0 playing" is information (nobody is on this
  //   one yet), and a leader line that appears and disappears made the shelf
  //   jump as the day filled in. A game with no leader yet says so.
  const playsLine = (g) => {
    const n = playsOf(g.key);
    return `${(typeof n === 'number' ? n : 0).toLocaleString()} playing`;
  };

  // ── the pin star ────────────────────────────────────────────────────
  // Bottom-left of the tile, mirroring where the old console put it. A tap
  // leaves :hover stuck on a phone until the next tap elsewhere, so the
  // handler drops focus explicitly and every hover rule sits behind
  // @media(hover:hover) (the 2026-08-02 star lesson).
  const pinBtn = (key) => {
    if (!canPin) return null;
    const on = favorites.indexOf(key) >= 0;
    const nm = isCircPin(key)
      ? ((circuitById(circPinId(key)) || {}).name || 'this circuit')
      : (DAILY_GAME_MAP[key] ? DAILY_GAME_MAP[key].name : key);
    return (
      <button
        type="button"
        className={'tdy-pinb' + (on ? ' on' : '')}
        aria-pressed={on}
        aria-label={on ? `Unpin ${nm} from My games` : `Pin ${nm} to My games`}
        title={on ? 'Unpin from My games' : `Pin to My games${pinMax ? ` (up to ${pinMax})` : ''}`}
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          try { e.currentTarget.blur(); } catch (x) {}
          setPinErr(null);
          Promise.resolve(toggleFavorite(key)).then((r) => {
            if (r && r.ok) return;
            const code = (r && r.error) || 'failed';
            if (code === 'limit') {
              setPinErr(`You have ${pinMax || favorites.length} games pinned. Unpin one first.`);
            } else if (code === 'not_registered') {
              setPinErr('Sign in to pin games to My games.');
            } else if (code === 'network') {
              setPinErr('No connection, so that pin was not saved. Try again.');
            } else {
              setPinErr('That pin could not be saved. Try again in a moment.');
            }
          });
        }}
      >
        {on ? '\u2605' : '\u2606'}
      </button>
    );
  };

  // A pinned CIRCUIT is done when every game on its card today is done, which
  // is exactly what the circuits shelf's own counter says. One pair of helpers
  // so the meter, the CTA and the tile all answer the question the same way.
  const itemDone = (it) => (it.kind === 'circuit'
    ? (it.games.length > 0 && it.games.every((g) => done.has(g.key)))
    : done.has(it.key));
  const itemProg = (it) => (it.kind === 'circuit'
    ? it.games.some((g) => inprog.has(g.key) && !done.has(g.key))
    : inprog.has(it.key));

  const mineDone = pinned.filter(itemDone).length;
  const mineCta = (() => {
    if (!pinned.length) return null;
    const paused = pinned.find((it) => itemProg(it) && !itemDone(it));
    if (paused) return { label: `Resume \u00b7 ${paused.name}`, href: paused.href, gold: true };
    const next = pinned.find((it) => !itemDone(it));
    if (next) return { label: `Play \u00b7 ${next.name}`, href: next.href, gold: false };
    return { label: 'All done today', href: pinned[0].href, gold: false };
  })();

  // ── which shelves are open ──────────────────────────────────────────
  // A reader with pins is a reader who has been here before, so their two
  // personal shelves open and every category stays a title. Nobody else gets an
  // open shelf until they open one.
  const hasPins = !!(canPin && pinned.length);
  const openDefault = (id) => (id === CIRC_ID || id === 'tdy-cat-word' ? true : (id === MINE_ID ? hasPins : false));   // Circuits and Word open for everyone (owner, 2026-09-01)
  const isOpen = (id) => (shelfOpen && Object.prototype.hasOwnProperty.call(shelfOpen, id)
    ? !!shelfOpen[id]
    : openDefault(id));
  const setOpen = (id, on) => {
    setShelfOpen((cur) => {
      const next = { ...(cur || {}), [id]: !!on };
      try { localStorage.setItem(SHELF_OPEN_KEY, JSON.stringify(next)); } catch (e) {}
      return next;
    });
  };
  // The header band is the toggle, but it also carries the CTA and the star, so
  // a click that landed on a control of its own is not a click on the band.
  const headClick = (id) => (e) => {
    try { if (e.target && e.target.closest && e.target.closest('a,button')) return; } catch (x) {}
    setOpen(id, !isOpen(id));
  };
  const togBtn = (id) => (
    <button
      type="button"
      className={'tdy-tog' + (isOpen(id) ? ' on' : '')}
      aria-expanded={isOpen(id)}
      aria-controls={id + '-body'}
      aria-label={isOpen(id) ? 'Collapse this shelf' : 'Show the games on this shelf'}
      onClick={(e) => { e.stopPropagation(); setOpen(id, !isOpen(id)); }}
    >{'\u2304'}</button>
  );

  // ── the hand-dragged category order ─────────────────────────────────
  const applyOrder = (names) => {
    setCatOrder(names);
    try { localStorage.setItem(CAT_ORDER_KEY, JSON.stringify(names)); } catch (e) {}
  };
  const moveCat = (i, d) => {
    const names = orderedShelves.map((s) => s.name);
    const j = i + d;
    if (j < 0 || j >= names.length) return;
    const t = names[i]; names[i] = names[j]; names[j] = t;
    applyOrder(names);
  };
  const resetOrder = () => {
    setCatOrder(null);
    try { localStorage.removeItem(CAT_ORDER_KEY); } catch (e) {}
  };

  // ── which chip is ringed ────────────────────────────────────────────
  const spyShelves = orderedShelves;
  // My games and Circuits are sections above the categories, so they belong in
  // the spy list too, in DOCUMENT order (the walk keeps the LAST id whose top
  // has passed the line). Without them their chips carried a `here` ring that
  // could never light, and scrolling through them ringed nothing at all.
  const spyIds = useMemo(() => [
    ...(canPin && pinned.length ? ['tdy-mine'] : []),
    ...(circuitShelves.length ? ['tdy-circuits'] : []),
    ...spyShelves.map((s) => secId(s)),
  ], [canPin, pinned.length, circuitShelves.length, spyShelves]);
  useEffect(() => {
    const ids = spyIds;
    const spy = () => {
      let best = null;
      const line = pinnedBarH() + jumpBarH() + 40;
      for (const id of ids) {
        const el = document.getElementById(id);
        if (!el) continue;
        if (el.getBoundingClientRect().top - line <= 0) best = id;
      }
      setHere((cur) => (cur === best ? cur : best));
      // Pinned when the bar has reached its own sticky offset. Read off the
      // element rather than a scroll threshold, since the offset is itself a
      // live measurement of whichever masthead this page carries.
      try {
        const bar = document.querySelector('.tdy-jb');
        if (bar) {
          const on = bar.getBoundingClientRect().top <= pinnedBarH() + 0.5;
          setStuck((cur) => (cur === on ? cur : on));
        }
      } catch (x) {}
    };
    spy();
    window.addEventListener('scroll', spy, { passive: true });
    window.addEventListener('resize', spy);
    return () => { window.removeEventListener('scroll', spy); window.removeEventListener('resize', spy); };
  }, [spyIds]);

  const azPanel = () => (
    <>
      <div className="tdy-shhd"><b>Every game, A to Z</b><i>{`${azGames.count} on the slate today`}</i></div>
      <div className="tdy-az">
        {azGames.groups.map((grp) => (
          <div className="tdy-azg" key={grp.letter}>
            <span className="tdy-azl">{grp.letter}</span>
            <div className="tdy-azw">
              {grp.items.map(({ g, color }) => (
                <a
                  key={g.key}
                  className={'tdy-azi' + (done.has(g.key) ? ' done' : inprog.has(g.key) ? ' paused' : '')}
                  href={g.href}
                >
                  <img src={g.img} alt="" aria-hidden="true" loading="lazy" />
                  <span className="cd" style={{ background: color }} aria-hidden="true" />
                  {g.name}
                </a>
              ))}
            </div>
          </div>
        ))}
      </div>
    </>
  );

  const orderPanel = () => (
    <>
      <div className="tdy-shhd">
        <b>Your category order</b>
        <i>{catOrder && catOrder.length ? 'Your own order, kept on this browser' : 'Sorted by how much you play each one'}</i>
      </div>
      <div className="tdy-reo">
        {orderedShelves.map((s, i) => (
          <div
            key={s.name}
            className="tdy-reor"
            draggable
            onDragStart={() => { dragFrom.current = i; }}
            onDragEnd={() => { dragFrom.current = null; }}
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
              e.preventDefault();
              const from = dragFrom.current;
              dragFrom.current = null;
              if (from == null || from === i) return;
              const names = orderedShelves.map((x) => x.name);
              const moved = names.splice(from, 1)[0];
              names.splice(i, 0, moved);
              applyOrder(names);
            }}
          >
            <span className="gr" aria-hidden="true">{'\u22ee\u22ee'}</span>
            <span className="dot" style={{ background: s.color }} aria-hidden="true" />
            <span className="nm">{s.name}</span>
            <span className="pl">{archive ? `${(catPlays[s.name] || 0).toLocaleString()} played` : `${s.games.length} games`}</span>
            <span className="mv">
              <button type="button" onClick={() => moveCat(i, -1)} aria-label={`Move ${s.name} up`}>{'\u2191'}</button>
              <button type="button" onClick={() => moveCat(i, 1)} aria-label={`Move ${s.name} down`}>{'\u2193'}</button>
            </span>
          </div>
        ))}
      </div>
      <div className="tdy-reoft">
        {catOrder && catOrder.length ? (
          <button type="button" className="tdy-jb2" onClick={resetOrder}>Reset to my play counts</button>
        ) : null}
        <span className="note">Drag a row, or use the arrows on a phone. It saves as you go.</span>
      </div>
    </>
  );

  // WHICH PUZZLE, not just which game (owner, 2026-08-25). A daily quiz id
  // carries its own date as an M-D-YY suffix, and the feed shows archive plays
  // alongside today's, so a row reading "Paths" alone cannot tell the two apart.
  // Read off the ID and never off playedAt, which is when the ROW was written
  // and would stamp today's date on a July board played this afternoon.
  const feedDate = (quizId) => {
    const m = /-(\d{1,2})-(\d{1,2})-(\d{2})$/.exec(quizId || '');
    if (!m) return '';
    const d = new Date(2000 + Number(m[3]), Number(m[1]) - 1, Number(m[2]));
    if (Number.isNaN(d.getTime())) return '';
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };
  const feedGame = (quizId) => {
    const m = /^([a-z]+)-\d/.exec(quizId || '');
    return m && DAILY_GAME_MAP[m[1]] ? DAILY_GAME_MAP[m[1]] : null;
  };
  const agoLabel = (iso) => {
    if (!iso) return '';
    const m = Math.round((Date.now() - new Date(iso).getTime()) / 60000);
    if (!(m >= 1)) return 'now';
    if (m < 60) return `${m}m ago`;
    return `${Math.round(m / 60)}h ago`;
  };
  const fmtPts = (n) => (typeof n === 'number' ? (Math.round(n * 10) / 10).toLocaleString() : '');
  const fmtClock = (s) => {
    if (typeof s !== 'number' || !(s >= 0)) return '';
    const m = Math.floor(s / 60), ss = Math.round(s % 60);
    return m >= 60 ? `${Math.floor(m / 60)}h ${m % 60}m` : `${m}:${String(ss).padStart(2, '0')}`;
  };
  const fmtDur = (s) => {
    if (typeof s !== 'number' || s <= 0) return '0m';
    const m = Math.floor(s / 60);
    const d = Math.floor(m / 1440), h = Math.floor((m % 1440) / 60), mm = m % 60;
    const parts = [];
    if (d) parts.push(`${d}d`);
    if (h) parts.push(`${h}h`);
    if (mm || !parts.length) parts.push(`${mm}m`);
    return parts.join(' ');
  };

  // Category standings, summed from the per-game boards the payload already
  // carries (same approach as the Loft's category leaders, same known limit:
  // only each game's named top-board players are visible to the sum).
  const catAgg = useMemo(() => {
    if (!bgames) return null;
    const out = {};
    for (const s of shelves) out[s.name] = aggregateShelf(bgames, s.games).slice(0, 12);
    return out;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bgames]);

  // THE SHELF'S LEADER, rendered beside the category name (owner, 2026-08-24).
  // The per-tile crown names who is top of ONE game; this names who is top of
  // the whole CATEGORY today, on the same combined points the standings panel
  // below and the daily board itself run on. Keyed kind+name so the circuits
  // shelf gets one too (a circuit is a set of games like any other shelf).
  const shelfLead = useMemo(() => {
    if (!bgames) return {};
    const out = {};
    for (const s of [...shelves, ...circuitShelves]) {
      const top = aggregateShelf(bgames, s.games)[0];
      if (top && top.username) out[(s.kind || 'cat') + s.name] = top;
    }
    return out;
  }, [bgames, shelves, circuitShelves]);

  // The circuits shelf counts CIRCUITS, not games: a circuit is done when every
  // game on today's card is done, which is exactly what its own progress ring
  // says. Empty on the server (done starts empty), so hydration agrees.
  // ONE TILE IN THE ROW, and it is the Trivia Gauntlet (owner, 2026-09-01).
  // `circAll` opens the rest in place. The fallback keeps the row from going
  // empty on a day the lead circuit has no card: it falls back to the head of
  // the family, which lib/circuits already orders for exactly this.
  const circRow = useMemo(() => {
    if (circAll) return circuitShelves;
    const byId = new Map(circuitShelves.map((c) => [c.id, c]));
    const lead = LEAD_CIRCUITS.map((id) => byId.get(id)).filter(Boolean);
    return lead.length ? lead : circuitShelves.slice(0, 3);
  }, [circuitShelves, circAll]);

  const circTot = circuitShelves.length;
  const circDone = circuitShelves.filter((c) => c.games.every((g) => done.has(g.key))).length;

  const gauntletKeys = useMemo(() => {
    if (!today) return [];
    try { return circuitKeysFor('gauntlet', today) || []; } catch (e) { return []; }
  }, [today]);
  const gauntletUnplayed = gauntletKeys.length > 0 && !gauntletKeys.some((k) => done.has(k));

  // ── the Trivia Gauntlet nudge ──
  // Unplayed means NOT ONE game of the circuit finished today. `done` is the
  // merge of all three passes above, so this reads the same truth the tiles
  // do, and the pop-up itself waits on `board` (the server's word) before it
  // decides anything.
  const overall = board && Array.isArray(board.overall) ? board.overall : [];

  // ── YOUR SUNDAY ────────────────────────────────────────────────────
  // Behind ?stage=1 while it is reviewed. The flag is read in an EFFECT and
  // never during render: the server has no query string to read, so deciding
  // it during render makes the first client paint disagree with the server's
  // and React throws. Same rule isSundayET and contestIsLive follow.
  const [dayOn, setDayOn] = useState(false);
  useEffect(() => {
    try { setDayOn(new URLSearchParams(window.location.search).get('stage') === '1'); } catch (e) {}
  }, []);
  const dayBlocks = useMemo(() => orderedShelves.map((sh) => ({
    n: sh.games.length,
    c: sh.color,
    on: sh.games.map((g) => done.has(g.key)),
    half: sh.games.map((g) => !done.has(g.key) && inprog.has(g.key)),
  })), [orderedShelves, done, inprog]);
  const dayPlayed = useMemo(() => orderedShelves.reduce((a, sh) => a + sh.games.filter((g) => done.has(g.key)).length, 0), [orderedShelves, done]);
  const dayPaused = useMemo(() => orderedShelves.reduce((a, sh) => a + sh.games.filter((g) => !done.has(g.key) && inprog.has(g.key)).length, 0), [orderedShelves, done, inprog]);
  const dayLeader = overall[0] || null;
  // The SERVER's rank, not an index into a list that may be truncated or
  // renumbered around guests. Falls back to the index only if a row arrives
  // without one.
  const dayMyRow = meKey ? overall.find((r) => r && r.userKey === meKey) : null;
  const dayMyRank = dayMyRow
    ? (dayMyRow.rank || overall.indexOf(dayMyRow) + 1)
    : 0;
  const dayOrd = (v) => v + (['th', 'st', 'nd', 'rd'][((v % 100) - 20) % 10] || ['th', 'st', 'nd', 'rd'][v % 100] || 'th');
  const meInTop = meKey ? overall.slice(0, 12).some((r) => r && r.userKey === meKey) : true;
  const bestN = board && typeof board.bestN === 'number' ? board.bestN : 25;

  if (stageOn) return <StageToday />;

  return (
    <div className="tdy">
      <style dangerouslySetInnerHTML={{ __html: CSS }} />
      <GauntletPop ready={!!board && !!today} unplayed={gauntletUnplayed} day={today || ''} />

      <div className="tdy-wrap">
        <div className={'tdy-jb' + (stuck ? ' stuck' : '')} style={{ top: barTop }}>
          <div className="tdy-jbin">
            <div className={'tdy-jbtw' + (jbNav.l ? ' fl' : '') + (jbNav.r ? ' fr' : '')}>
            {jbNav.l ? <button type="button" className="tdy-jbar l" aria-label="Scroll categories left" onClick={() => jbNudge(-1)}>{'\u2039'}</button> : null}
            {jbNav.r ? <button type="button" className="tdy-jbar r" aria-label="Scroll categories right" onClick={() => jbNudge(1)}>{'\u203a'}</button> : null}
            <div className="tdy-jbt" ref={jbtRef}>
              {canPin && pinned.length ? (
                <button
                  type="button"
                  className={'tdy-jc mine' + (here === 'tdy-mine' ? ' here' : '')}
                  style={{ '--pc': `${Math.round((100 * mineDone) / pinned.length)}%` }}
                  onClick={(e) => { setOpen(MINE_ID, true); jumpTo(e, 'tdy-mine'); }}
                >
                  <span className="nm">{'\u2605 My games'}</span>
                  <span className="ct">{`${mineDone}/${pinned.length}`}</span>
                </button>
              ) : null}
              {circTot ? (
                <button
                  type="button"
                  className={'tdy-jc' + (circDone >= circTot ? ' full' : '') + (here === 'tdy-circuits' ? ' here' : '')}
                  style={{ '--cc': '#233a63', '--pc': `${Math.round((100 * circDone) / circTot)}%` }}
                  onClick={(e) => { setOpen(CIRC_ID, true); jumpTo(e, 'tdy-circuits'); }}
                >
                  <span className="dot" aria-hidden="true" />
                  <span className="nm">Circuits</span>
                  <span className="ct">{`${circDone}/${circTot}`}</span>
                </button>
              ) : null}
              {spyShelves.map((s) => {
                const dn = s.games.filter((g) => done.has(g.key)).length;
                const tot = s.games.length;
                const id = secId(s);
                return (
                  <button
                    key={id}
                    type="button"
                    className={'tdy-jc' + (tot > 0 && dn >= tot ? ' full' : '') + (here === id ? ' here' : '')}
                    style={{ '--cc': s.color, '--pc': `${tot ? Math.round((100 * dn) / tot) : 0}%` }}
                    onClick={(e) => { setOpen(id, true); jumpTo(e, id); }}
                  >
                    <span className="dot" aria-hidden="true" />
                    <span className="nm">{s.name}</span>
                    <span className="ct">{`${dn}/${tot}`}</span>
                  </button>
                );
              })}
            </div>
            </div>
            <div className="tdy-jbc">
              <button
                type="button"
                className={'tdy-jb2' + (sheet === 'az' ? ' on' : '')}
                aria-expanded={sheet === 'az'}
                onClick={() => setSheet(sheet === 'az' ? null : 'az')}
              >A to Z</button>
              <button
                type="button"
                className={'tdy-jb2' + (sheet === 'order' ? ' on' : '')}
                aria-expanded={sheet === 'order'}
                onClick={() => setSheet(sheet === 'order' ? null : 'order')}
              >Reorder</button>
            </div>
          </div>
          {sheet ? (
            <div className="tdy-jbsh">
              <div className="tdy-jbshin">{sheet === 'az' ? azPanel() : orderPanel()}</div>
            </div>
          ) : null}
        </div>

        {pinErr ? (
          <div className="tdy-teaser tdy-pinerr" role="status">
            <span className="ti">{'\u2605 My games'}</span>
            <span className="ts">{pinErr}</span>
          </div>
        ) : null}

        {dayOn ? (
          <section className="tdy-row" id="tdy-day" style={{ scrollMarginTop: 112 }}>
            <div className="tdy-day">
              <div className="tdy-dayhd">
                <h2>Your day</h2>
                <span className="tdy-dayfig">
                  <b>{dayPlayed}</b> played{dayPaused ? <> &middot; <b>{dayPaused}</b> paused</> : null} &middot; <b>{totalGames}</b> on the slate
                </span>
              </div>
              <StageLadder light height={46} blocks={dayBlocks} />
              <div className="tdy-daykey">
                {orderedShelves.map((sh) => (
                  <span key={sh.name}>
                    <i style={{ background: sh.color }} aria-hidden="true" />
                    {sh.name} {sh.games.filter((g) => done.has(g.key)).length}/{sh.games.length}
                  </span>
                ))}
              </div>
            </div>
            {/* The strip SCROLLS rather than expands: the full board is already
                at the foot of this page, and an expansion here would be the
                same table twice. It needs a leader to be drawn at all. */}
            {dayLeader ? (
              <button
                type="button"
                className="tdy-daystrip"
                onClick={() => { const el = document.getElementById('tdy-boards'); if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' }); }}
              >
                <span className="e">Today</span>
                <b>{dayLeader.username || 'Player'}</b>
                <s>{fmtPts(dayLeader.total)} pts</s>
                <span className="d">&middot; {overall.length} {overall.length === 1 ? 'player' : 'players'}</span>
                <u>{dayMyRank ? `You ${dayOrd(dayMyRank)}` : 'Not on the board yet'} &rsaquo;</u>
              </button>
            ) : null}
          </section>
        ) : null}

        {canPin && pinned.length ? (
          <section className="tdy-row" id="tdy-mine" style={{ scrollMarginTop: 112 }}>
            <div className="tdy-shc" style={{ '--cc': '#2b3241' }}>
              <div className="tdy-hd" onClick={headClick(MINE_ID)}>
                <div>
                  <div className="eb">{`Yours \u00b7 ${pinned.length} pinned`}</div>
                  <div className="tdy-hnm">
                    <h2>{'\u2605 My games'}</h2>
                    <span className={'tdy-prg' + (mineDone >= pinned.length ? ' full' : '')}>
                      <b>{`${mineDone} of ${pinned.length}`}</b>
                      <span className="pb" aria-hidden="true"><span style={{ width: `${Math.round((100 * mineDone) / pinned.length)}%` }} /></span>
                    </span>
                  </div>
                </div>
                {mineCta ? (
                  <a
                    className={mineCta.gold ? 'tdy-cta resume' : 'tdy-cta'}
                    href={mineCta.href}
                  >{mineCta.label}</a>
                ) : null}
                {togBtn(MINE_ID)}
              </div>
              <div id={MINE_ID + '-body'} className={'tdy-body' + (isOpen(MINE_ID) ? '' : ' shut')}>
              <TilesRow>
                {pinned.map((it) => {
                  const fin = itemDone(it);
                  const cls = [it.kind === 'circuit' ? 'tdy-ct' : 'tdy-t'];
                  if (fin) cls.push('done');
                  else if (itemProg(it)) cls.push('paused');
                  if (it.kind === 'circuit') {
                    const dn = it.games.filter((g) => done.has(g.key)).length;
                    return (
                      <a
                        key={it.pinKey}
                        className={cls.join(' ')}
                        href={it.href}
                        style={{ '--cc': it.color }}
                        title={`${it.name}: ${it.games.map((g) => g.name).join(', ')}`}
                      >
                        <span className="tdy-pl">
                          <span className="tdy-cgrid">
                            {it.games.map((g) => (
                              <img key={g.key} src={g.img} alt="" aria-hidden="true" loading="lazy" />
                            ))}
                          </span>
                          {fin ? <span className="tdy-bdg" aria-hidden="true">{'\u2713'}</span> : null}
                          {pinBtn(it.pinKey)}
                        </span>
                        <b>{it.name}</b>
                        <span className={'tdy-st' + (fin ? ' tk' : '')}>
                          <i>{fin ? `All ${it.games.length}` : `${dn}/${it.games.length} done`}</i>
                        </span>
                      </a>
                    );
                  }
                  const leader = leaderOf(it.key);
                  return (
                    <a key={it.pinKey} className={cls.join(' ')} href={it.href}>
                      <span className="tdy-pl">
                        <img src={it.img} alt="" aria-hidden="true" loading="lazy" />
                        {fin ? <span className="tdy-bdg" aria-hidden="true">{'\u2713'}</span>
                          : itemProg(it) ? <span className="tdy-bdg" aria-hidden="true">{'\u25B6'}</span> : null}
                        {pinBtn(it.key)}
                      </span>
                      <b>{it.name}</b>
                      <span className="tdy-st"><i>{playsLine(it)}</i></span>
                      <span className="tdy-ld">{CROWN}<i>{leader || 'Nobody yet'}</i></span>
                    </a>
                  );
                })}
              </TilesRow>
              </div>
            </div>
          </section>
        ) : null}

        {/* THE CIRCUITS SHELF (owner, 2026-08-26). It sits where the Continue row
            sat and is built like a category: eyebrow, filled header band, jump-bar
            chip, one scrolling row. The tiles carry no art, because a circuit is
            not one game and borrowing one member's picture says the wrong thing;
            they carry the circuit's name and the games in it, at a size down from
            a game tile, which is also what lets sixteen of them read as a row
            rather than a wall. */}
        {circTot ? (
          <section className="tdy-row" id="tdy-circuits" style={{ scrollMarginTop: 112 }}>
            <div className="tdy-shc circuits" style={{ '--cc': '#233a63' }}>
              <div className="tdy-hd" onClick={headClick(CIRC_ID)}>
                <div>
                  <div className="eb">{`Sets \u00b7 ${circTot} circuits`}</div>
                  <div className="tdy-hnm">
                    <h2>Circuits</h2>
                    <span className={'tdy-prg' + (circDone >= circTot ? ' full' : '')}>
                      <b>{`${circDone} of ${circTot}`}</b>
                      <span className="pb" aria-hidden="true"><span style={{ width: `${Math.round((100 * circDone) / circTot)}%` }} /></span>
                    </span>
                  </div>
                </div>
                <a className="tdy-cta" href={CIRCUIT_BASE}>All circuits</a>
                {togBtn(CIRC_ID)}
              </div>
              <div id={CIRC_ID + '-body'} className={'tdy-body' + (isOpen(CIRC_ID) ? '' : ' shut')}>
              <TilesRow>
                {circRow.map((c) => {
                  const dn = c.games.filter((g) => done.has(g.key)).length;
                  const tot = c.games.length;
                  const all = tot > 0 && dn >= tot;
                  return (
                    <a
                      key={c.id}
                      className={'tdy-ct' + (all ? ' done' : '')}
                      href={circuitEntryHref(c.id)}
                      style={{ '--cc': c.color }}
                      title={`${c.name}: ${c.games.map((g) => g.name).join(', ')}`}
                    >
                      <span className="tdy-pl">
                        <span className="tdy-cgrid">
                          {c.games.map((g) => (
                            <img key={g.key} src={g.img} alt="" aria-hidden="true" loading="lazy" />
                          ))}
                        </span>
                        {all ? <span className="tdy-bdg" aria-hidden="true">{'\u2713'}</span> : null}
                        {pinBtn(circPinKey(c.id))}
                      </span>
                      <b>{c.name}</b>
                      <span className={'tdy-st' + (all ? ' tk' : '')}>
                        <i>{all ? `All ${tot}` : `${dn}/${tot} done`}</i>
                      </span>
                    </a>
                  );
                })}
                {circuitShelves.length > circRow.length || circAll ? (
                  <button
                    type="button"
                    className="tdy-ct more"
                    onClick={() => setCircAll(!circAll)}
                  >{circAll ? 'Show less' : `The other ${circuitShelves.length - circRow.length} circuits`}</button>
                ) : null}
              </TilesRow>
              </div>
            </div>
          </section>
        ) : null}

        {canPin && !pinned.length ? (
          <div className="tdy-teaser">
            <span className="ti">{'\u2605 My games'}</span>
            <span className="ts">Star any game and it sits right here, above every category.</span>
          </div>
        ) : null}

        {pinsLoaded && !registered ? (
          <div className="tdy-teaser">
            <span className="ti">{'\u2605 My games'}</span>
            <span className="ts">Pin the handful you actually play and they sit right here, above every category.</span>
            {onSignup ? <button type="button" className="tb" onClick={onSignup}>Sign in to pin</button> : null}
          </div>
        ) : null}

        {/* EVERY CATEGORY BREAK IS THE SAME BREAK (owner, 2026-08-26). The
            shelves used to be split four-and-the-rest by a "The rest of the
            slate" band, which read as a demotion of everything under it and
            put one gap on the page bigger than all the others. The band is
            gone: the shelves are one uniform run, each spaced by the shelf
            card's own 14px top margin. Do not reintroduce a divider between
            shelves. */}
        {spyShelves.map((shelf) => {
          const cta = shelfCta(shelf);
          const dn = shelf.games.filter((g) => done.has(g.key)).length;
          const tot = shelf.games.length;
          const allDone = tot > 0 && dn >= tot;
          const id = secId(shelf);
          const open = isOpen(id);
          // A category that is both SHUT and finished says so with the green
          // band rather than its own colour: it is the one shut state that has
          // something to report, and it still links every game it names.
          if (!open && allDone) {
            return (
              <section key={(shelf.kind || 'cat') + shelf.name} id={id} style={{ scrollMarginTop: 112 }} className="tdy-row">
                <div className="tdy-catdone">
                  <b className="nm">{shelf.name}</b>
                  <span className="ck">{`All ${tot} done`}</span>
                  {shelf.games.map((g) => (
                    <a key={g.key} className="it" href={g.href}>
                      <img src={g.img} alt="" aria-hidden="true" loading="lazy" />
                      <span>{`${g.name} \u2713`}</span>
                    </a>
                  ))}
                  <button type="button" className="show" onClick={() => setOpen(id, true)}>Show tiles</button>
                </div>
              </section>
            );
          }
          return (
            <section key={(shelf.kind || 'cat') + shelf.name} id={id} style={{ scrollMarginTop: 112 }} className="tdy-row">
              <div className="tdy-shc" style={{ '--cc': shelf.color }}>
                <div className="tdy-hd" onClick={headClick(id)}>
                  <div>
                    <div className="eb">{shelf.kind === 'circuit' ? `Circuit · ${shelf.games.length} today` : (shelf.name === 'Sudoku' ? `Category · ${shelf.games.length} grids` : `Category · ${shelf.games.length} ${shelf.games.length === 1 ? 'game' : 'games'}`)}</div>
                    <div className="tdy-hnm">
                      <h2>{shelf.name}</h2>
                      <span className={'tdy-prg' + (dn >= tot ? ' full' : '')}>
                        <b>{`${dn} of ${tot}`}</b>
                        <span className="pb" aria-hidden="true"><span style={{ width: `${tot ? Math.round((100 * dn) / tot) : 0}%` }} /></span>
                      </span>
                      {(() => {
                        const L = shelfLead[(shelf.kind || 'cat') + shelf.name];
                        if (!L) return null;
                        return (
                          <span className="tdy-hld" title={L.username + ' leads ' + shelf.name + ' today: ' + L.pts + ' points across ' + L.games + (L.games === 1 ? ' game' : ' games')}>
                            {CROWN}<i>{L.username}</i><b>{L.pts} pts</b>
                          </span>
                        );
                      })()}
                    </div>
                    {shelf.kind === 'circuit' && shelf.blurb ? (
                      <div className="nt">{shelf.blurb}</div>
                    ) : null}
                  </div>
                  <a className={cta.gold ? 'tdy-cta resume' : 'tdy-cta'} href={cta.href}>{cta.label}</a>
                  {togBtn(id)}
                </div>
                <div id={id + '-body'} className={'tdy-body' + (open ? '' : ' shut')}>
                <TilesRow>
                  {sinkDone(shelf.games).map((g) => {
                    const leader = leaderOf(g.key);
                    const cls = ['tdy-t'];
                    if (done.has(g.key)) cls.push('done');
                    else if (inprog.has(g.key)) cls.push('paused');
                    return (
                      <a key={g.key} className={cls.join(' ')} href={g.href}>
                        <span className="tdy-pl">
                          <img src={g.img} alt="" aria-hidden="true" loading="lazy" />
                          {done.has(g.key) ? <span className="tdy-bdg" aria-hidden="true">{'\u2713'}</span>
                            : inprog.has(g.key) ? <span className="tdy-bdg" aria-hidden="true">{'\u25B6'}</span> : null}
                          {pinBtn(g.key)}
                        </span>
                        <b>{g.name}</b>
                        <span className="tdy-st"><i>{playsLine(g)}</i></span>
                        <span className="tdy-ld">{CROWN}<i>{leader || 'Nobody yet'}</i></span>
                      </a>
                    );
                  })}
                </TilesRow>
                </div>
              </div>
            </section>
          );
        })}

        <div className="tdy-two" id="tdy-boards">
          <div ref={lbColRef}>
            <div className="tdy-restband" style={{ paddingTop: 38 }}>
              <h3>{TROPHY}<span style={{ marginLeft: 8 }}>Today&rsquo;s leaderboards</span></h3>
              <i>Resets at midnight Eastern</i>
            </div>
            <div className="tdy-card">
              <div className="tdy-tabs">
                {[['overall', 'Overall'], ['games', 'By game'], ['cats', 'By category'], ['circuits', 'Circuits']].map(([k, l]) => (
                  <button key={k} type="button" className={'tdy-tab' + (mode === k ? ' on' : '')} onClick={() => setMode(k)}>{l}</button>
                ))}
              </div>

              {mode === 'games' ? (
                <TilesRow light>
                  {flat.map(({ g }) => (
                    <button key={g.key} type="button" className={'tdy-pick' + (pickGame === g.key ? ' on' : '')} onClick={() => setPickGame(g.key)}>
                      <img src={g.img} alt="" aria-hidden="true" loading="lazy" />{g.name}
                    </button>
                  ))}
                </TilesRow>
              ) : null}
              {mode === 'cats' ? (
                <TilesRow light>
                  {shelves.map((s) => (
                    <button key={s.name} type="button" className={'tdy-pick txt' + (pickCat === s.name ? ' on' : '')} onClick={() => setPickCat(s.name)}>{s.name}</button>
                  ))}
                </TilesRow>
              ) : null}
              {mode === 'circuits' ? (
                <TilesRow light>
                  {CIRCUITS.map((c) => (
                    <button key={c.id} type="button" className={'tdy-pick txt' + (pickCirc === c.id ? ' on' : '')} onClick={() => setPickCirc(c.id)}>{c.name}</button>
                  ))}
                </TilesRow>
              ) : null}

              {mode === 'overall' ? (
                overall.length ? (
                  <>
                    <div className="tdy-sub">{board && typeof board.maxTotal === 'number' ? `Best ${bestN} of ${totalGames} games · ${board.maxTotal.toLocaleString()} pts max` : 'Combined placement across the day'}</div>
                    <div className="tdy-cols"><b>#</b><span>Player</span><s>Games</s><s>Total</s></div>
                    {overall.slice(0, 12).map((r, i) => (
                      <div key={(r && r.userKey) || i} className={'tdy-lr' + (i === 0 ? ' first' : '') + (meKey && r && r.userKey === meKey ? ' me' : '')}>
                        <b>{(r && r.rank) || i + 1}</b>
                        <span className="nm">{i === 0 ? CROWN : null}{(r && r.username) || 'Player'}{meKey && r && r.userKey === meKey ? ' · You' : ''}</span>
                        <span className="cell">{r && typeof r.gamesPlayed === 'number' ? `${r.gamesPlayed}/${totalGames}` : ''}</span>
                        <span className="cell pts">{fmtPts(r && r.total)}</span>
                      </div>
                    ))}
                    {!meInTop && board && board.me && typeof board.me.rank === 'number' ? (
                      <div className="tdy-lr me">
                        <b>{board.me.rank}</b>
                        <span className="nm">{board.me.username || 'You'} · You</span>
                        <span className="cell">{typeof board.me.gamesPlayed === 'number' ? `${board.me.gamesPlayed}/${totalGames}` : ''}</span>
                        <span className="cell pts">{fmtPts(board.me.total)}</span>
                      </div>
                    ) : null}
                    <a className="tdy-more" href="/quizzes/hub?tab=daily">Full standings on the Stat Hub →</a>
                  </>
                ) : (
                  <div className="tdy-empty">The day&rsquo;s board is loading, or nobody has played yet.</div>
                )
              ) : null}

              {mode === 'games' ? (() => {
                const g = DAILY_GAME_MAP[pickGame];
                const bg = bgFor(pickGame);
                const rows = bg && Array.isArray(bg.board) ? bg.board : (bgames ? [] : null);
                const eg = g && g.cat === 'End Game';
                const missLabel = eg ? 'Tries' : (g && g.miss ? g.miss : null);
                return (
                  <>
                    <div className="tdy-sub">{bg ? `${(bg.field || 0).toLocaleString()} played today${g && g.tag ? ` · ${g.tag}` : ''}` : 'Loading the board…'}</div>
                    {rows === null ? (
                      <div className="tdy-empty">Loading the board&hellip;</div>
                    ) : rows.length ? (
                      <>
                        <div className="tdy-cols"><b>#</b><span>Player</span><s>Score</s>{missLabel ? <s>{missLabel}</s> : null}<s>Time</s><s>Pts</s></div>
                        {rows.slice(0, 12).map((r, i) => (
                          <div key={(r && r.userKey) || i} className={'tdy-lr' + (i === 0 ? ' first' : '') + (meKey && r && r.userKey === meKey ? ' me' : '')}>
                            <b>{(r && r.rank) || i + 1}</b>
                            <span className="nm">{i === 0 ? CROWN : null}{(r && r.username) || 'Player'}{meKey && r && r.userKey === meKey ? ' · You' : ''}</span>
                            <span className="cell">{r && r.score != null ? `${r.score}${r.total ? '/' + r.total : ''}` : ''}</span>
                            {missLabel ? <span className="cell">{eg ? (r && r.tries != null ? r.tries : '—') : (r && r.guessesUsed != null ? r.guessesUsed : '—')}</span> : null}
                            <span className="cell">{fmtClock(r && r.timeElapsed)}</span>
                            <span className="cell pts">{fmtPts(r && r.points)}</span>
                          </div>
                        ))}
                        <a className="tdy-more" href={g ? g.href : '#'}>{g ? `Play ${g.name} →` : ''}</a>
                      </>
                    ) : (
                      <div className="tdy-empty">No registered results on this board yet today.</div>
                    )}
                  </>
                );
              })() : null}

              {mode === 'cats' ? (() => {
                const s = shelves.find((x) => x.name === pickCat);
                const rows = catAgg ? (catAgg[pickCat] || []) : null;
                return (
                  <>
                    <div className="tdy-sub">{`Placement points summed across ${s ? s.games.length : 0} ${pickCat} games`}</div>
                    {rows === null ? (
                      <div className="tdy-empty">Loading the board&hellip;</div>
                    ) : rows.length ? (
                      <>
                        <div className="tdy-cols"><b>#</b><span>Player</span><s>Games</s><s>Pts</s></div>
                        {rows.map((r, i) => (
                          <div key={r.userKey} className={'tdy-lr' + (i === 0 ? ' first' : '') + (meKey && r.userKey === meKey ? ' me' : '')}>
                            <b>{i + 1}</b>
                            <span className="nm">{i === 0 ? CROWN : null}{r.username || 'Player'}{meKey && r.userKey === meKey ? ' · You' : ''}</span>
                            <span className="cell">{`${r.games}/${s ? s.games.length : 0}`}</span>
                            <span className="cell pts">{fmtPts(r.pts)}</span>
                          </div>
                        ))}
                      </>
                    ) : (
                      <div className="tdy-empty">Nobody on this category&rsquo;s boards yet today.</div>
                    )}
                  </>
                );
              })() : null}

              {mode === 'circuits' ? (() => {
                const d = circBoards[pickCirc];
                const c = circuitById(pickCirc);
                const rows = d && Array.isArray(d.overall) ? d.overall : null;
                return (
                  <>
                    <div className="tdy-sub">{(c && c.blurb) || ''}{d && typeof d.maxTotal === 'number'
                      ? `${c && c.blurb ? ' · ' : ''}${d.scoreMode === 'correct' ? `${d.maxTotal} questions max` : d.scoreMode === 'time' ? 'Ranked on the clock' : `Best ${d.bestN} · ${d.maxTotal} pts max`}`
                      : ''}</div>
                    {rows === null ? (
                      <div className="tdy-empty">Loading the circuit board&hellip;</div>
                    ) : rows.length ? (
                      <>
                        <div className="tdy-cols"><b>#</b><span>Player</span><s>Games</s><s>Total</s></div>
                        {rows.slice(0, 12).map((r, i) => (
                          <div key={(r && r.userKey) || i} className={'tdy-lr' + (i === 0 ? ' first' : '') + (meKey && r && r.userKey === meKey ? ' me' : '')}>
                            <b>{(r && r.rank) || i + 1}</b>
                            <span className="nm">{i === 0 ? CROWN : null}{(r && r.username) || 'Player'}{meKey && r && r.userKey === meKey ? ' · You' : ''}</span>
                            <span className="cell">{r && typeof r.gamesPlayed === 'number' ? `${r.gamesPlayed}${d && d.gameCount ? '/' + d.gameCount : ''}` : ''}</span>
                            <span className="cell pts">{d.scoreMode === 'time' && r
                              ? `${Math.floor((r.timeTotal || 0) / 60)}:${String(Math.round(r.timeTotal || 0) % 60).padStart(2, '0')}`
                              : fmtPts(r && r.total)}</span>
                          </div>
                        ))}
                        <a className="tdy-more" href={circuitPageHref(pickCirc)}>{c ? `The ${c.name} circuit →` : ''}</a>
                      </>
                    ) : (
                      <div className="tdy-empty">No complete runs on this circuit yet today. A circuit ranks players who finish all of the day&rsquo;s games in it.</div>
                    )}
                  </>
                );
              })() : null}
            </div>
          </div>

          <div id="tdy-feed" className={feedH ? 'tdy-feedcol fit' : 'tdy-feedcol'} style={feedH ? { height: feedH } : undefined}>
            <div className="tdy-restband" style={{ paddingTop: 38 }}>
              <h3><span className="tdy-pulse" style={{ display: 'inline-block' }} /><span style={{ marginLeft: 8 }}>Live feed</span></h3>
              <i>Results as they land, anonymous by design</i>
            </div>
            <div className="tdy-card">
              <div className="tdy-fstats">
                <div><b>{totals ? totals.today.toLocaleString() : '—'}</b><span>Plays today</span></div>
                <div><b>{totals ? totals.todayPlayers.toLocaleString() : '—'}</b><span>Players</span></div>
                <div><b>{totals ? fmtDur(totals.todayTime) : '—'}</b><span>Time played</span></div>
              </div>
              <div className="tdy-flist">
              {recent && recent.length ? recent.map((p, i) => {
                const g = feedGame(p.quizId);
                // This row's OWN play number for the day, not the day total
                // (owner, 2026-08-25): the feed counts up as it climbs, so ten
                // rows of the same game read #6 through #15 instead of ten
                // copies of "15 plays". The total stays on the tooltip.
                const n = Number(p.dayIndex) || 0;
                const tot = dayCounts ? Number(dayCounts[p.quizId]) || 0 : 0;
                return (
                  <div key={i} className="tdy-lr feed">
                    {g ? <img className="fic" src={g.img} alt="" aria-hidden="true" loading="lazy" /> : <span className="fdot" aria-hidden="true" />}
                    <span className="nm">
                      <i className="fnm">{g ? g.name : (p.quizId || 'Quiz')}</i>
                      {feedDate(p.quizId) ? <i className="fdt">{feedDate(p.quizId)}</i> : null}
                      {n > 0 ? <i className="fx" title={tot > 0 ? `Play ${n.toLocaleString()} of ${tot.toLocaleString()} today` : `Play ${n.toLocaleString()} today`}>{`play #${n.toLocaleString()}`}</i> : null}
                    </span>
                    {p && p.total > 0 ? <span className="gm">{`${p.score}/${p.total}`}</span> : <span className="gm" />}
                    <span className="sc">{agoLabel(p.playedAt)}</span>
                  </div>
                );
              }) : (
                <div className="tdy-empty">Recent results land here.</div>
              )}
              </div>
            </div>
          </div>
        </div>

        <div className="tdy-foot">{`${totalGames} daily puzzles · new drops at midnight Eastern`}</div>
      </div>
    </div>
  );
}

const CSS = `
/* YOUR DAY. Eighty games as one picture, in the reader's own shelf order. */
.tdy-day{background:#fff;border:1px solid #e7e9ee;border-radius:14px;padding:16px 18px 14px;}
.tdy-dayhd{display:flex;align-items:baseline;justify-content:space-between;gap:16px;margin-bottom:13px;flex-wrap:wrap;}
.tdy-dayhd h2{margin:0;font-size:20px;font-weight:800;letter-spacing:-.02em;color:#1c1e24;}
.tdy-dayfig{font-family:'DM Mono',ui-monospace,monospace;font-size:11.5px;color:#6b7280;}
.tdy-dayfig b{color:#1c1e24;font-weight:500;}
.tdy-daykey{display:flex;flex-wrap:wrap;gap:9px 15px;margin-top:12px;}
.tdy-daykey span{display:flex;align-items:center;gap:6px;font-family:'DM Mono',ui-monospace,monospace;
  font-size:9.5px;letter-spacing:.1em;text-transform:uppercase;color:#6b7280;}
.tdy-daykey i{width:9px;height:9px;border-radius:2px;display:block;flex:none;}
.tdy-daystrip{display:flex;align-items:center;gap:10px;width:100%;text-align:left;cursor:pointer;
  margin-top:10px;padding:9px 14px;border-radius:10px;font-size:12.5px;color:#1c1e24;
  background:#fff;border:1px solid #e7e9ee;}
.tdy-daystrip:hover{background:#f4f6f9;}
.tdy-daystrip .e{font-family:'DM Mono',ui-monospace,monospace;font-size:9.5px;letter-spacing:.14em;
  text-transform:uppercase;color:#6b7280;}
.tdy-daystrip b{font-weight:800;}
.tdy-daystrip s{text-decoration:none;font-family:'DM Mono',ui-monospace,monospace;font-size:11.5px;color:#3f4757;}
.tdy-daystrip .d{color:#6b7280;font-size:11.5px;}
.tdy-daystrip u{text-decoration:none;margin-left:auto;font-family:'DM Mono',ui-monospace,monospace;
  font-size:10px;letter-spacing:.1em;text-transform:uppercase;color:#2563eb;flex:none;}
@media(max-width:640px){
  .tdy-day{padding:13px 13px 12px;border-radius:12px;}
  .tdy-dayhd h2{font-size:17px;}
  .tdy-daystrip .d{display:none;}
}

.tdy{background:transparent;font-family:'Manrope',system-ui,-apple-system,sans-serif;-webkit-font-smoothing:antialiased;
/* EVERY SHELF ON THE PAGE IS THE SAME HEIGHT (owner, 2026-08-26), and this is
   the one knob that keeps them so. The header band is identical on all of them,
   so the shelf's height is its tile's height, and the game tile's is intrinsic
   (a 66px plate, the name, and up to two conditional lines under it: the
   score or Resume, and today's leader). Pinning BOTH tile types to the same
   min-height makes the circuits shelf match the categories by construction
   rather than by a number typed in twice.

   MEASURED, NEVER GUESSED (owner, 2026-08-26). It sat at 147px, the height of
   the CARD tile that reserved three label rows whether it had anything to put
   in them or not, and every shelf carried the difference as dead air. The plate
   tile renders a row only when it HAS one, so the floor is now the bare tile:
   109px, a plate and a name and nothing else, read off the live page with the
   floor removed. One line takes it to about 127 and two to 145, and the floor
   lets them: it is a FLOOR, not a height.

   So a shelf grows as its games fill up over the day rather than reserving the
   room at midnight, which does mean a quiet shelf is shorter than a busy one.
   That is the trade the owner asked for, twice, against a page that was mostly
   empty rows. Re-measure the same way after any change to the tile's stack: set
   .tdy-t/.tdy-ct min-height:0 and take the tallest bare tile. */
--tile-h:109px;--tile-w:96px;}
.tdy-wrap{max-width:1560px;margin:0 auto;padding:0 clamp(16px,1.7vw,24px) 24px;}
/* On the homepage the marquee lives inside .qzh (maxWidth 1560 with its own
   side padding), so the wrap sheds its own width cap and padding there to line
   up exactly with the quiz browse sections below. The phone negative margins
   mirror .qzh's side padding (16px to 900px, 14px under 560) so the full-bleed
   phone treatment still reaches the screen edges. */
.dhx-marquee .tdy-wrap{max-width:none;padding-left:0;padding-right:0;padding-bottom:0;}
@media(min-width:901px){.dhx-marquee .tdy-jb{margin-top:0;}}

.tdy-pulse{width:6px;height:6px;border-radius:50%;background:#22a35f;box-shadow:0 0 0 0 rgba(34,163,95,.5);animation:tdypul 2s infinite;flex:none;}
@keyframes tdypul{0%{box-shadow:0 0 0 0 rgba(34,163,95,.5);}70%{box-shadow:0 0 0 7px rgba(34,163,95,0);}100%{box-shadow:0 0 0 0 rgba(34,163,95,0);}}

/* ── shelf cards: white on paper, tinted header strip, 4px category rule ── */
.tdy-row{display:block;}
/* NO CARD RECTANGLE (owner, 2026-08-26). The shelf was a white card with a
   hairline border and a shadow, sitting on the paper ground, so every category
   carried a rectangle drawn around it in a colour the page does not otherwise
   use. The card is transparent now and the tiles sit straight on the ground;
   what a shelf still IS on the page is its filled header band and its row of
   tiles, both of which already read as objects. The radius and the overflow
   clip stay, because they are what round the header band's top corners. */
.tdy-shc{background:transparent;border:0;border-radius:14px;overflow:hidden;box-shadow:none;margin:14px 2px 0;}
.tdy-shc.circuits{margin-top:16px;}
/* ── the circuit tile: THE SAME BOX AS A GAME TILE (owner, 2026-08-26) ──────
   Same width and same height off the same two variables, and the same plate,
   name and status line, so the circuits row lines up column for column with
   every category row under it rather than running a grid of its own. It cannot
   carry its members as TEXT at this width, so it carries them as ART: where a
   game plate holds one 50px icon, a circuit plate holds its members' icons in
   a small grid, which is the one thing that says "these five games" in 96px.
   The names are on the anchor's title, and the plate takes a wash of the
   circuit's colour so the row still reads by circuit at a glance. */
.tdy-ct{flex:none;width:var(--tile-w);min-height:var(--tile-h);background:none;border:0;border-radius:0;padding:11px 3px 10px;display:flex;flex-direction:column;align-items:center;gap:8px;text-decoration:none;box-shadow:none;}
.tdy-ct .tdy-pl{background:color-mix(in srgb,var(--cc,#233a63) 14%,#fff);}
.tdy-cgrid{display:flex;flex-wrap:wrap;justify-content:center;align-content:center;gap:2.5px;width:50px;height:50px;}
.tdy-cgrid img{width:15px;height:15px;border-radius:4px;display:block;flex:none;}
/* THE HEADER IS A FILLED BAND (owner, 2026-08-25). It was a 9% tint of the
   category colour with a 4px rule; the whole strip now takes the colour solid
   and everything on it inverts to white. The rail is gone: a 4px rule on a
   filled band of the same colour is invisible by definition.

   NOTHING HERE IS DIMMED WITH OPACITY, and that is load-bearing rather than a
   style choice. The hues in lib/home-blues clear 4.5:1 against PURE white with
   no headroom, so white at .78 lands at 3.46 on Word and the 9.5px eyebrow
   fails. Hierarchy on this band comes from size and weight only. Same reason
   the leader chip keeps its opaque gold instead of becoming a white wash of the
   hue, which fails on five of the ten categories. */
.tdy-hd{display:flex;align-items:center;gap:12px;padding:10px 14px 10px 16px;position:relative;background:var(--cc,#2563eb);}
.tdy-hd .eb{font-size:9.5px;letter-spacing:.13em;text-transform:uppercase;font-weight:800;color:var(--white);}
/* line-height 1.35, not 1.1: this heading is clipped (overflow:hidden, one
   line, ellipsis) at phone width, and a clip box only as tall as 1.1 cuts the
   tail off every descender in it. */
.tdy-hd h2{font-size:17px;font-weight:800;letter-spacing:-.02em;line-height:1.35;margin:0;color:var(--white);}
.tdy-hd .nt{font-size:11.5px;font-weight:600;color:var(--white);margin-top:3px;}
.tdy-hnm{display:flex;align-items:center;gap:10px;min-width:0;}
.tdy-prg{display:inline-flex;align-items:center;gap:6px;flex:none;margin-top:2px;}
.tdy-prg b{font-size:11px;font-weight:800;color:var(--white);font-variant-numeric:tabular-nums;white-space:nowrap;}
.tdy-prg .pb{width:44px;height:4px;border-radius:99px;background:rgba(255,255,255,.32);overflow:hidden;}
.tdy-prg .pb span{display:block;height:100%;background:var(--white);border-radius:99px;transition:width .3s;}
/* a full bar is a solid white bar at 100%: green on a coloured band either
   clashes or, on Trivia, disappears into it */
.tdy-prg.full b{color:var(--white);}
.tdy-prg.full .pb span{background:var(--white);}
/* THE LEADER IS INSET INTO THE BAND, NOT STUCK ON TOP OF IT (owner,
   2026-08-26). A cream capsule behind a tan outline was the last sticker on
   the page: it read as something pasted onto the band rather than as part of
   it, and it was the one warm rectangle on ten differently-coloured bands.

   THE GROUND IS A BLACK WASH, and that is the whole trick. The note above
   rules out a WHITE wash because the hues clear 4.5:1 on pure white with no
   headroom, so a white veil eats the margin. Darkening the hue can only ADD
   contrast for white type, so one rule works on all ten categories: measured,
   white lands between 7.45 (Word) and 14.7 (My games), the points line at 82%
   between 5.6 and 10.3, and the gold crown at 3.9 and up, which clears the 3:1
   bar for a graphic. The crown keeps its gold and is the only warm thing left
   on the band, which is where gold reads properly. */
.tdy-hld{display:inline-flex;align-items:center;gap:6px;flex:none;max-width:190px;border-radius:8px;padding:3px 9px 3px 8px;background:rgba(6,10,20,.24);border:none;}
.tdy-hld i{font-style:normal;font-size:11px;font-weight:800;color:var(--white);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}
.tdy-hld b{font-size:10.5px;font-weight:700;color:rgba(255,255,255,.82);font-variant-numeric:tabular-nums;flex:none;}
/* the CTA inverts with the band. It used to carry an inline background too,
   which would have won over this rule, so that was removed at the call site. */
/* TWO NEUTRAL PILLS, NOT TWO COLOURS (owner, 2026-08-25). Resume was gold and
   the owner called it ugly on the filled bands, which it is. No HUE can replace
   it: whatever you pick collides with the band that matches it (amber on the
   Arcade umber band is 1.4:1), and a dark pill dies on the graphite My games
   band at 1.36:1, which is exactly where Resume appears most.

   So the two actions are told apart by FILL, not by colour, and both are white,
   which means both inherit the band's own contrast on all twelve grounds:

     Resume   solid white pill, band-hue ink   the strong action
     Next     white outline, white ink         the quiet one

   Gold is not gone from the surface, it still marks the leader chips and the My
   games star, which is where it reads properly. */
/* Owner, 2026-08-26: the outlined uppercase pill became type with an arrow.
   On a filled band a ghost pill was a second rectangle inside a rectangle, and
   it was the weakest thing on the row while looking like the strongest. */
.tdy-cta{margin-left:auto;border:none;background:none;color:var(--white);font-size:12px;font-weight:800;letter-spacing:normal;text-transform:none;border-radius:999px;padding:6px 2px;white-space:nowrap;flex:none;text-decoration:none;transition:opacity .14s;}
.tdy-cta:not(.resume)::after{content:' →';font-weight:700;}
.tdy-cta:hover{filter:none;background:none;opacity:.78;}
/* RESUME KEEPS THE SOLID WHITE PILL. It is the one thing on a band a reader is
   meant to press, so it stays the one thing on a band shaped like a button. */
.tdy-cta.resume{background:var(--white);border:none;color:var(--cc,#2563eb);border-radius:999px;padding:7px 15px;}
.tdy-cta.resume:hover{filter:none;background:#eef2f8;opacity:1;}

/* ── tile tracks ── */
.tdy-tw{position:relative;}
/* THE TILES ARE THE OBJECTS (owner, 2026-08-25). They used to be #f7f8fa with
   a #edeff3 hairline and no shadow, sitting on a white card: a 3% delta on the
   one thing the page is actually about. They are white chips with a real edge
   and a small lift now, and the track they sit in is tinted 5% with the
   category colour, so each shelf reads as its own tray. The light-variant tracks (the
   foot leaderboard's game and category pickers) keep the plain white card
   behind them, which is why the tint is scoped away from them. */
.tdy-tiles{display:flex;gap:9px;overflow-x:auto;padding:12px 14px 12px;scrollbar-width:none;}
/* THE TRAY CARRIES THE CATEGORY COLOUR (owner, 2026-08-26, "direction C").
   This is NOT a revert of the same day's "no card rectangle" ruling, which
   took away a WHITE card with a hairline border and a shadow: a rectangle
   drawn around a category in a colour the page does not otherwise use. What
   is here instead is a 5% wash of the category's OWN colour, no border and no
   shadow, running edge to edge directly under that category's filled header
   band and clipped to the same corner radius. It reads as the band's body
   rather than as a box around the shelf, and it is the ground the tiles need
   now that the tile itself is no longer a card (see .tdy-t below). It is also
   what the .tdy-fade gradients on either end of the track have always faded
   to, so the track's edges match their surface again. */
.tdy-tw:not(.light) .tdy-tiles{background:color-mix(in srgb,var(--cc,#2563eb) 5%,#fff);}
.tdy-tiles::-webkit-scrollbar{display:none;}
.tdy-fade{position:absolute;top:0;bottom:0;width:46px;pointer-events:none;opacity:0;transition:opacity .15s;z-index:3;}
.tdy-fade.l{left:0;background:linear-gradient(90deg,color-mix(in srgb,var(--cc,#2563eb) 5%,#fff),rgba(255,255,255,0));}
.tdy-fade.r{right:0;background:linear-gradient(270deg,color-mix(in srgb,var(--cc,#2563eb) 5%,#fff),rgba(255,255,255,0));}
.tdy-fade.on{opacity:1;}
.tdy-nud{position:absolute;top:50%;transform:translateY(-50%);width:30px;height:30px;border-radius:50%;background:var(--white);border:1px solid #d7dce6;color:var(--slate);font-size:17px;font-weight:800;line-height:1;cursor:pointer;z-index:4;display:flex;align-items:center;justify-content:center;padding:0 0 2px;font-family:inherit;box-shadow:0 2px 8px rgba(16,24,40,.14);}
.tdy-nud:hover{border-color:#a8b6cc;color:var(--ink);}
.tdy-nud.l{left:4px;}
.tdy-nud.r{right:4px;}
/* ── THE TILE IS A PLATE, NOT A CARD (owner, 2026-08-26) ──────────────────
   The tile was a white card with a hairline and two shadows holding a 58px
   icon in the middle of a 130x147 box, which is sixty-five borders and
   sixty-five shadows down a page whose entire subject is the icons. The card
   is gone. What is left is the art on a white plate, the name under it, and
   two lines of CROWD underneath: how many are playing it today and who leads
   it (see playsLine above). Never the reader's own score.

   Three things carry the work the card used to do, and each of them is doing
   it better than a tinted rectangle did:
     - the TRAY. .tdy-tiles takes a 5% wash of the category colour (above),
       and it is now the only ground the tiles sit on, so a shelf reads as one
       object rather than as six cards floating on a tint.
     - the RING. State is a 2px ring on its own box at inset -4px, never a
       border on the plate: a border would eat into the art and, worse, would
       move every other tile in the row by 2px the moment a game was solved.
     - the BADGE. A tick or a play mark on the plate's bottom-right corner, so
       state is legible at a glance without reading the line under the name.

   96px wide instead of 130, which is nine across where six used to fit. */
.tdy-t{flex:none;width:var(--tile-w);min-height:var(--tile-h);background:none;border:0;border-radius:0;padding:11px 3px 10px;display:flex;flex-direction:column;align-items:center;gap:8px;text-decoration:none;box-shadow:none;}
.tdy-pl{position:relative;width:66px;height:66px;flex:none;border-radius:19px;background:var(--white);display:flex;align-items:center;justify-content:center;box-shadow:0 2px 5px rgba(16,24,40,.08),0 10px 22px rgba(16,24,40,.10);}
.tdy-pl::before{content:"";position:absolute;inset:-4px;border-radius:23px;border:2px solid transparent;pointer-events:none;}
.tdy-t.done .tdy-pl::before,.tdy-ct.done .tdy-pl::before{border-color:var(--success-deep);}
.tdy-t.paused .tdy-pl::before{border-color:var(--gold);}
/* Behind hover:hover with the pin star, and for the same reason: a tap applies
   :hover on a phone and the browser keeps painting it until you tap elsewhere,
   so a tile would sit lifted after you came back from playing it. The lift is
   on the PLATE now, since the tile is no longer a thing that can lift. */
@media(hover:hover){
  .tdy-pl{transition:box-shadow .14s,transform .14s;}
  .tdy-t:hover .tdy-pl,.tdy-ct:hover .tdy-pl{box-shadow:0 3px 6px rgba(16,24,40,.10),0 14px 28px rgba(16,24,40,.17);transform:translateY(-2px);}
}
.tdy-t img{width:50px;height:50px;border-radius:12px;display:block;flex:none;}
.tdy-bdg{position:absolute;right:-4px;bottom:-4px;width:20px;height:20px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:10.5px;font-weight:800;line-height:1;color:var(--white);box-shadow:0 2px 6px rgba(16,24,40,.25);}
.tdy-t.done .tdy-bdg,.tdy-ct.done .tdy-bdg{background:var(--success-deep);}
.tdy-t.paused .tdy-bdg{background:var(--gold);color:#3b2c05;}
.tdy-t b,.tdy-ct b{color:var(--ink);font-size:12.5px;font-weight:800;letter-spacing:-.01em;text-align:center;line-height:1.15;}
.tdy-st{font-style:normal;display:flex;align-items:center;justify-content:center;gap:3px;max-width:92px;margin-top:-3px;font-size:10px;font-weight:800;letter-spacing:.02em;color:#8a919e;white-space:nowrap;overflow:hidden;}
.tdy-st i{font-style:normal;min-width:0;overflow:hidden;text-overflow:ellipsis;}
.tdy-st.tk{color:var(--success-deep);}
.tdy-st.tp{color:#a16207;}
.tdy-ld{display:flex;align-items:center;justify-content:center;gap:3px;max-width:92px;margin-top:-4px;overflow:hidden;}
.tdy-ld i{font-style:normal;font-size:9.5px;font-weight:700;color:#9aa0ab;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}

/* ── a finished category collapses to a band ── */
.tdy-catdone{display:flex;align-items:center;gap:14px;background:var(--white);border:1px solid #e7e9ee;border-left:4px solid var(--success-deep);border-radius:14px;padding:12px 16px;margin:14px 2px 0;flex-wrap:wrap;box-shadow:0 1px 2px rgba(16,24,40,.04);}
.tdy-catdone .nm{font-size:14.5px;font-weight:800;color:var(--ink);letter-spacing:-.01em;}
.tdy-catdone .ck{font-size:11px;font-weight:800;color:var(--success-deep);white-space:nowrap;}
.tdy-catdone .it{display:flex;align-items:center;gap:7px;font-size:12px;font-weight:700;color:#3f4757;padding-left:10px;border-left:1px solid #e7e9ee;white-space:nowrap;text-decoration:none;}
.tdy-catdone .it img{width:20px;height:20px;border-radius:5px;display:block;}
.tdy-catdone .show{margin-left:auto;font-family:inherit;font-size:10px;font-weight:800;letter-spacing:.05em;text-transform:uppercase;color:var(--blue-deep);border:1.5px solid #cddffb;background:#eef3ff;border-radius:999px;padding:6px 12px;cursor:pointer;white-space:nowrap;}
.tdy-catdone .show:hover{background:#e2ecff;}

.tdy-restband{display:flex;align-items:baseline;gap:12px;padding:26px 2px 0;flex-wrap:wrap;}
/* LEGIBLE ON THE PAPER GROUND (owner, 2026-08-26). These two titles sat at
   #9aa0ab over the #e7ecf3 ground, which measures 2.19:1, and the line beside
   them at #b3b9c4 measured 1.64:1. At 12px that is barely a title at all, and
   the owner reported it on a phone, where these bands are the only thing
   introducing the boards and the feed. They now take the palette's own
   secondary and tertiary text tokens, 7.8:1 and 4.4:1 on the same ground, so
   the heading leads and the caption still steps back from it. Measure any
   replacement against #e7ecf3 rather than against white. */
.tdy-restband h3{font-size:12px;letter-spacing:.15em;text-transform:uppercase;font-weight:800;color:var(--muted);margin:0;display:inline-flex;align-items:center;}
.tdy-restband i{font-style:normal;font-size:12px;font-weight:600;color:var(--slate);}

/* ── the foot boards + live feed ── */
.tdy-two{display:grid;grid-template-columns:1fr 1fr;gap:0 18px;align-items:start;}
.tdy-two>div{min-width:0;}
/* The feed column, capped to the board beside it. See the measure in the
   component: .fit is only ever set when a height was actually taken, so the
   phone (one column, no height) keeps a plain, unclipped, natural-length feed
   and the scroller never appears where it would trap a flick. */
.tdy-feedcol.fit{display:flex;flex-direction:column;min-height:0;}
.tdy-feedcol.fit>.tdy-card{flex:1 1 auto;min-height:0;display:flex;flex-direction:column;overflow:hidden;}
.tdy-feedcol.fit .tdy-flist{flex:1 1 auto;min-height:0;overflow-y:auto;overscroll-behavior:contain;}
.tdy-card{background:var(--white);border:1px solid #e7e9ee;border-radius:12px;box-shadow:0 1px 2px rgba(16,24,40,.04);padding:10px 12px;margin:10px 2px 0;}
.tdy-cols{display:flex;align-items:center;gap:9px;padding:4px 10px 8px;font-size:9.5px;letter-spacing:.11em;text-transform:uppercase;color:#9aa0ab;font-weight:800;border-bottom:1px solid var(--border);margin-bottom:4px;}
.tdy-cols b{width:18px;flex:none;font-weight:800;}
.tdy-cols span{flex:1 1 auto;}
.tdy-cols s{text-decoration:none;flex:none;width:56px;text-align:right;}
.tdy-lr{display:flex;align-items:center;gap:9px;padding:8px 10px;border-left:4px solid transparent;border-radius:0 7px 7px 0;font-size:13px;color:var(--ink);}
.tdy-lr b{font-size:11px;color:#9aa0ab;width:18px;flex:none;font-variant-numeric:tabular-nums;font-weight:800;}
.tdy-lr .nm{min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font-weight:800;flex:1 1 auto;display:inline-flex;align-items:center;gap:6px;}
.tdy-lr .gm{flex:none;width:56px;text-align:right;font-variant-numeric:tabular-nums;color:#9aa0ab;font-weight:700;font-size:11.5px;}
.tdy-lr .sc{flex:none;width:56px;text-align:right;font-variant-numeric:tabular-nums;color:var(--slate);white-space:nowrap;font-weight:800;font-size:12.5px;}
.tdy-lr.first{border-left-color:var(--gold);background:#fffaf0;}
.tdy-lr.me{border-left-color:var(--blue);background:#eef3ff;}
.tdy-lr.me .nm{color:var(--blue-deep);}
.tdy-lr .fic{width:22px;height:22px;border-radius:5px;flex:none;}
.tdy-lr .fdot{width:22px;height:22px;border-radius:5px;flex:none;background:var(--surface-alt);}
.tdy-lr.feed .sc{font-weight:700;color:#9aa0ab;font-size:11.5px;width:64px;}
/* The feed row's name is now two pieces (the game, then how many plays it has
   taken today), so the ellipsis moves off .nm and onto the name itself or the
   count gets squeezed out of a narrow column. */
.tdy-lr.feed .nm{overflow:visible;}
.tdy-lr.feed .fnm{font-style:normal;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;}
.tdy-lr.feed .fx{font-style:normal;flex:none;font-size:10.5px;font-weight:800;color:#9aa0ab;letter-spacing:.01em;white-space:nowrap;font-variant-numeric:tabular-nums;}
.tdy-lr.feed .fdt{font-style:normal;flex:none;font-size:10.5px;font-weight:700;color:#b3b9c4;white-space:nowrap;font-variant-numeric:tabular-nums;}
/* Backstop for a native hash jump (no JS, or a /#tdy-feed link followed cold):
   jumpTo does the real offsetting, this keeps the heading off the masthead. */
#tdy-boards,#tdy-feed{scroll-margin-top:112px;}
.tdy-more{display:block;font-size:11.5px;font-weight:800;color:var(--blue-deep);padding:10px 10px 4px;text-decoration:none;}
.tdy-tabs{display:flex;gap:6px;padding:2px 4px 10px;border-bottom:1px solid var(--border);margin-bottom:8px;flex-wrap:wrap;}
.tdy-tab{font-family:inherit;font-size:10.5px;font-weight:800;letter-spacing:.05em;text-transform:uppercase;padding:6px 12px;border-radius:999px;background:var(--surface);color:var(--slate);border:0;cursor:pointer;}
.tdy-tab.on{background:var(--accent);color:var(--white);}
.tdy-tab:hover:not(.on){background:var(--surface-alt);color:var(--ink);}
.tdy-tw.light .tdy-tiles{padding:2px 2px 8px;gap:6px;}
.tdy-pick{font-family:inherit;display:inline-flex;align-items:center;gap:6px;flex:none;padding:5px 11px 5px 6px;border-radius:999px;background:var(--surface);font-size:11.5px;font-weight:800;color:var(--ink);border:0;cursor:pointer;white-space:nowrap;}
.tdy-pick img{width:18px;height:18px;border-radius:4px;display:block;}
.tdy-pick.txt{padding:6px 12px;}
.tdy-pick.on{background:var(--accent);color:var(--white);}
.tdy-pick:hover:not(.on){background:var(--surface-alt);}
.tdy-tw.light .tdy-fade{bottom:8px;}
.tdy-tw.light .tdy-fade.l{background:linear-gradient(90deg,var(--white),rgba(255,255,255,0));}
.tdy-tw.light .tdy-fade.r{background:linear-gradient(270deg,var(--white),rgba(255,255,255,0));}
.tdy-tw.light .tdy-nud{background:var(--white);border-color:var(--border);color:var(--slate);box-shadow:0 2px 8px rgba(3,7,18,.18);}
.tdy-tw.light .tdy-nud:hover{color:var(--ink);border-color:#c9d2e0;background:var(--white);}
.tdy-sub{font-size:11px;font-weight:700;color:#9aa0ab;padding:2px 10px 8px;}
.tdy-lr .cell{flex:none;width:52px;text-align:right;font-variant-numeric:tabular-nums;color:var(--slate);font-weight:700;font-size:12px;white-space:nowrap;}
.tdy-lr .cell.pts{font-weight:800;color:var(--ink);}
.tdy-cols s{width:52px;}
.tdy-fstats{display:flex;border-bottom:1px solid var(--border);margin-bottom:8px;padding:4px 0 10px;}
.tdy-fstats>div{flex:1 1 0;padding:0 12px;border-right:1px solid var(--border);}
.tdy-fstats>div:last-child{border-right:none;}
.tdy-fstats b{display:block;font-size:17px;font-weight:800;letter-spacing:-.01em;font-variant-numeric:tabular-nums;color:var(--ink);}
.tdy-fstats span{font-size:9px;letter-spacing:.12em;text-transform:uppercase;color:#9aa0ab;font-weight:800;}
.tdy-empty{padding:14px 10px;font-size:12.5px;font-weight:600;color:var(--slate);}
/* Same ground, same 2.19:1, same fix as the rest bands above. */
.tdy-foot{padding:24px 2px 10px;color:var(--slate);font-size:11px;font-weight:600;letter-spacing:.04em;}
@media(max-width:900px){
  .tdy-wrap{padding:0 0 30px;}
  .dhx-marquee{margin-left:-16px;margin-right:-16px;}
  /* NOTHING ON THE PHONE STACK IS SEPARATED BY A GAP (owner, 2026-08-28).
     Every block here already runs edge to edge, so the 14px between them was
     a strip of page ground doing the job the coloured header band above each
     shelf does anyway. The page is one continuous run of bands now: the two
     nav rows, then header, tiles, header, tiles, all touching. Each shelf's
     own header IS the separator, which is why none is needed between them.

     .tdy-shc.circuits carries its own margin at a higher specificity than the
     plain .tdy-shc below, so it has to be zeroed by name or the circuits shelf
     alone keeps a 16px gap. Same trap for anything else that sets a margin on
     a compound selector. */
  .tdy-shc{border-radius:0;border-left:none;border-right:none;margin:0;}
  .tdy-shc.circuits{margin-top:0;}
  /* ONE LINE, THREE THINGS (owner, 2026-08-26). The two-row grid this replaces
     was still taller than what it had to say, and it fell apart on any shelf
     with no leader yet: row two then held a lone CTA against an empty half, so
     the same header came out at two different heights depending on whether
     anybody had played that category today. Every band is one line now:

       name .......................... N of M   leader chip

     THE CTA IS GONE from the category bands, and that is what buys the line. It
     read "Next \u00b7 <game>" and pointed at a tile sitting directly underneath it,
     so it was the one element on the band that said nothing the reader could
     not already see. It stays on the two shelves where it is the point rather
     than a duplicate: My games and Circuits, whose CTA is the resume action or
     the way out to the circuit index, and neither of which carries a leader
     chip, so both still fit their name, count and CTA on the one line.

     The leader chip drops its POINTS at this width. The handle is the half a
     reader recognises, and carrying "48 pts" as well costs about 45px, which is
     the difference between "Crowd Psychology" fitting the line and ellipsising,
     and between a long handle showing whole and reading "badgerbea...". The
     figure is still in the chip's title attribute and on the leaderboard.

     The rest is as before: the name ellipsises rather than wraps, the progress
     BAR is dropped because the "N of M" beside it says the same thing, and
     display:contents on both wrappers promotes .eb, h2, .tdy-prg and .tdy-hld
     into the one flex line. */
  .tdy-hd{display:flex;flex-wrap:wrap;align-items:center;gap:9px;padding:9px 14px 9px 16px;}
  .tdy-hd > div{display:contents;}
  .tdy-hnm{display:contents;}
  .tdy-hd .eb{display:none;}
  .tdy-hd h2{flex:1 1 auto;min-width:0;font-size:16px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}
  .tdy-prg{flex:none;margin-top:0;}
  .tdy-prg .pb{display:none;}
  .tdy-hld{flex:none;max-width:136px;margin-left:0;padding:3px 8px;}
  .tdy-hld b{display:none;}
  .tdy-cta{display:none;}
  .tdy-hd .nt{flex:1 0 100%;margin-top:0;}
  #tdy-mine .tdy-cta,.tdy-shc.circuits .tdy-cta{display:block;flex:none;margin-left:auto;max-width:58%;overflow:hidden;white-space:nowrap;text-overflow:ellipsis;padding:7px 13px;}
  #tdy-mine .tdy-tiles,.tdy-shc.circuits .tdy-tiles{padding-top:9px;padding-bottom:10px;}
  .tdy-tiles{padding-left:14px;padding-right:14px;}
  .tdy{--tile-w:88px;}
  .tdy-nud{display:none;}
  .tdy-fade{display:none;}
  .tdy-catdone{border-radius:0;border-left-width:4px;border-right:none;margin:0;}
  .tdy-restband{padding-left:16px;padding-right:16px;}
  .tdy-two{grid-template-columns:1fr;}
  .tdy-card{border-radius:0;border-left:none;border-right:none;margin:0;}
  .tdy-foot{padding-left:16px;}
}
@media(max-width:560px){
  .dhx-marquee{margin-left:-14px;margin-right:-14px;}
}

/* ══ the reader's own navigation (owner, 2026-08-25) ══ */

/* The sticky category jump bar. Its top offset is set inline from a live
   measurement of whatever masthead this page carries, since the desktop and
   phone mastheads are different elements.

   NO BAND RECTANGLE (owner, 2026-08-28). It carried a 94% ground plus a 9px
   backdrop blur plus a hairline bottom border, and the three together drew a
   lighter rectangle across the page with a visible left edge, right edge and
   underline: a box around the navigation, in a tone the page does not
   otherwise use. Same objection as the shelf card above. The bar's ground is
   now the page ground EXACTLY and opaquely (#e7ecf3, the .qzloft / .tdy-page
   colour), with no border and no blur, so it is invisible where it sits and
   simply an opaque floor for the tiles once it sticks. If the page ground ever
   moves, this literal and the two fade stops below move with it. */
.tdy-jb{position:sticky;z-index:40;background:transparent;margin:14px 0 0;}
.tdy-jb.stuck{background:#e7ecf3;}
.tdy-jbin{display:flex;align-items:center;gap:12px;padding:8px 2px;}
.tdy-jbtw{position:relative;flex:1 1 auto;min-width:0;display:flex;}
.tdy-jbt{display:flex;gap:6px;overflow-x:auto;scrollbar-width:none;flex:1 1 auto;min-width:0;padding:1px;}
/* Only on a fine pointer: a touch device scrolls the track by dragging it, and
   a floating arrow over the first chip would just be a thing to mis-tap. */
.tdy-jbar{display:none;}
@media(hover:hover) and (pointer:fine){
  .tdy-jbar{position:absolute;top:50%;transform:translateY(-50%);z-index:2;display:flex;align-items:center;justify-content:center;width:25px;height:25px;padding:0 0 2px;border-radius:50%;background:var(--white);border:1px solid #d7dce6;box-shadow:0 2px 7px rgba(16,24,40,.16);font-family:inherit;font-size:16px;font-weight:800;line-height:1;color:var(--blue-deep);cursor:pointer;}
  .tdy-jbar:hover{background:#f2f6ff;border-color:#a8b6cc;}
  .tdy-jbar.l{left:-3px;}
  .tdy-jbar.r{right:-3px;}
}
.tdy-jbt::-webkit-scrollbar{display:none;}
/* CHIPS FADE OUT, THEY DO NOT RUN UNDER THE BUTTONS (owner, 2026-08-26). The
   track's right edge sits 12px from A to Z, so a chip scrolled half out of it
   was cut off mid-word right beside a button and read as sliding behind it.
   The gradient matches the bar's own ground, and the arrow (z-index 2) rides
   above it. */
.tdy-jbtw::before,.tdy-jbtw::after{content:'';position:absolute;top:0;bottom:0;width:36px;pointer-events:none;z-index:1;opacity:0;transition:opacity .16s;}
.tdy-jbtw::before{left:0;background:linear-gradient(to left,rgba(231,236,243,0),#e7ecf3);}
.tdy-jbtw::after{right:0;background:linear-gradient(to right,rgba(231,236,243,0),#e7ecf3);}
.tdy-jbtw.fl::before{opacity:1;}
.tdy-jbtw.fr::after{opacity:1;}
.tdy-jbc{display:flex;align-items:center;gap:8px;flex:none;}
/* The chip's own tint fill IS its progress meter, which is what keeps ten
   categories and both buttons on one line at desktop widths. A separate
   meter element cost ~32px a chip and pushed the last category off the bar. */
/* A CHIP IS A TINTED FILL, NOT AN OUTLINE (owner, 2026-08-26). Ten white
   pills behind ten grey 1px borders read as a form control from 2012, and the
   border was doing the same job the category's own colour can do for free. The
   chip's ground is now that colour at 9%, and its ::before meter, which is
   still the progress bar and still the reason there is no separate meter
   element, deepens to 24% of the same hue. ORDER IS LOAD-BEARING below: a chip
   can carry .mine AND .here at once (My games is a jump target like any other),
   so .here is declared LAST and wins. */
.tdy-jc{position:relative;overflow:hidden;flex:none;display:inline-flex;align-items:center;gap:7px;background:color-mix(in srgb,var(--cc,#2563eb) 9%,#fff);border:1px solid transparent;border-radius:10px;padding:6px 13px 6px 10px;cursor:pointer;font-family:inherit;color:var(--ink);-webkit-tap-highlight-color:transparent;transition:background .14s;}
.tdy-jc::before{content:'';position:absolute;left:0;top:0;bottom:0;width:var(--pc,0%);background:color-mix(in srgb,var(--cc,#2563eb) 24%,#fff);transition:width .25s;}
.tdy-jc>*{position:relative;}
.tdy-jc:hover{background:color-mix(in srgb,var(--cc,#2563eb) 17%,#fff);}
.tdy-jc .dot{width:7px;height:7px;border-radius:50%;background:var(--cc);flex:none;}
.tdy-jc .nm{font-size:12px;font-weight:800;letter-spacing:-.01em;white-space:nowrap;}
.tdy-jc .ct{font-size:10.5px;font-weight:700;color:#7b8494;font-variant-numeric:tabular-nums;white-space:nowrap;}
.tdy-jc.full{background:#e6f6e9;}
.tdy-jc.full::before{background:#d5efdb;}
.tdy-jc.full:hover{background:#dcf0e1;}
.tdy-jc.full .ct{color:var(--success-deep);}
.tdy-jc.mine{background:#fbf0d2;}
.tdy-jc.mine::before{background:#f6e3ac;}
.tdy-jc.mine:hover{background:#f8e9c2;}
.tdy-jc.mine .nm{color:#8a6d1a;}
.tdy-jc.mine .ct{color:var(--gold-ink);}
/* THE CATEGORY YOU ARE IN IS FILLED, NOT RINGED. A 2px blue halo around a
   white pill was the browser's own focus ring by another name, and it said
   "blue" on a bar where every other chip speaks its own category's colour.
   Every category hue is a dark saturated step (the lightest, umber #92400e, is
   6.9:1), so white type carries on all of them. */
.tdy-jc.here{background:var(--cc,#2563eb);}
.tdy-jc.here::before{background:rgba(255,255,255,.2);}
.tdy-jc.here:hover{background:var(--cc,#2563eb);filter:brightness(1.1);}
.tdy-jc.here .nm{color:var(--white);}
.tdy-jc.here .ct{color:rgba(255,255,255,.74);}
.tdy-jc.here .dot{background:var(--white);}
/* A to Z and Reorder open a drawer, they do not act, so they read as type with
   a hover ground rather than as two more filled pills beside ten chips. */
.tdy-jb2{flex:none;font-family:inherit;font-size:12px;font-weight:700;letter-spacing:normal;text-transform:none;color:var(--muted);background:none;border:none;border-radius:8px;padding:7px 9px;cursor:pointer;white-space:nowrap;transition:color .14s,background .14s;}
.tdy-jb2:hover{background:rgba(15,23,42,.055);color:var(--ink);}
.tdy-jb2.on{background:none;color:var(--blue-deep);text-decoration:underline;text-decoration-thickness:2px;text-underline-offset:4px;}
/* A sticky element is a positioned element, so the dropdown anchors to the
   bar rather than to the page. */
.tdy-jbsh{position:absolute;left:0;right:0;top:100%;background:var(--white);border-bottom:1px solid #e3e7ee;box-shadow:0 14px 28px rgba(16,24,40,.10);max-height:62vh;overflow:auto;}
.tdy-jbshin{padding:14px clamp(16px,1.7vw,24px) 18px;}
.tdy-shhd{display:flex;align-items:baseline;gap:10px;margin-bottom:11px;}
.tdy-shhd b{font-size:13px;font-weight:800;color:var(--ink);}
.tdy-shhd i{font-style:normal;font-size:11.5px;font-weight:600;color:#9aa0ab;}

/* A to Z */
.tdy-az{display:flex;flex-wrap:wrap;gap:6px 8px;}
.tdy-azg{display:flex;align-items:flex-start;gap:8px;flex:none;margin-right:10px;}
.tdy-azl{font-size:12px;font-weight:800;color:#c0c6d2;width:13px;flex:none;padding-top:5px;}
.tdy-azw{display:flex;flex-wrap:wrap;gap:5px;max-width:660px;}
.tdy-azi{display:inline-flex;align-items:center;gap:6px;background:var(--surface);border:1px solid #e9edf3;border-radius:8px;padding:4px 9px 4px 5px;font-size:12px;font-weight:700;color:var(--ink);text-decoration:none;}
.tdy-azi:hover{background:#e9eff7;}
.tdy-azi img{width:18px;height:18px;border-radius:4px;display:block;}
.tdy-azi .cd{width:6px;height:6px;border-radius:50%;flex:none;}
.tdy-azi.done{background:#eef7ef;border-color:#d8ecd9;}
.tdy-azi.paused{background:#fff7e0;border-color:#ecd9a0;}

/* Reorder */
.tdy-reo{display:flex;flex-wrap:wrap;gap:8px;}
.tdy-reor{display:flex;align-items:center;gap:10px;background:var(--surface);border:1px solid #e6eaf1;border-radius:10px;padding:8px 10px;width:300px;cursor:grab;}
.tdy-reor .gr{color:#b6bdc9;font-size:14px;line-height:1;letter-spacing:2px;flex:none;}
.tdy-reor .dot{width:9px;height:9px;border-radius:50%;flex:none;}
.tdy-reor .nm{font-size:13px;font-weight:800;color:var(--ink);flex:1 1 auto;}
.tdy-reor .pl{font-size:10.5px;font-weight:800;color:#9aa0ab;white-space:nowrap;font-variant-numeric:tabular-nums;}
.tdy-reor .mv{display:flex;gap:3px;flex:none;}
.tdy-reor .mv button{font-family:inherit;width:22px;height:22px;border-radius:6px;border:1px solid #dfe4ec;background:var(--white);color:var(--slate);font-size:11px;font-weight:800;cursor:pointer;padding:0;line-height:1;}
.tdy-reor .mv button:hover{border-color:#b6c2d6;color:var(--ink);}
.tdy-reoft{display:flex;align-items:center;gap:10px;margin-top:14px;flex-wrap:wrap;}
.tdy-reoft .note{font-size:11.5px;font-weight:600;color:#9aa0ab;}

/* The pin star. Every hover rule sits behind @media(hover:hover): on a phone a
   tap applies :hover and the browser keeps painting it until you tap
   elsewhere, which left a block behind the star on the old console. It hangs
   off the PLATE's top-left corner rather than the tile's bottom-left, which
   with the card gone would have sat on top of the game's name. */
.tdy-t{position:relative;}
.tdy-pinb{position:absolute;left:-5px;top:-5px;width:21px;height:21px;border-radius:50%;border:0;background:rgba(255,255,255,.92);color:#c3c9d4;cursor:pointer;font-size:12px;line-height:1;padding:0;font-family:inherit;-webkit-tap-highlight-color:transparent;box-shadow:0 1px 4px rgba(16,24,40,.18);display:flex;align-items:center;justify-content:center;}
.tdy-pinb.on{color:var(--gold);}
@media(hover:hover){
  .tdy-pinb{opacity:0;transition:opacity .12s;}
  .tdy-t:hover .tdy-pinb,.tdy-pinb:focus-visible,.tdy-pinb.on{opacity:1;}
  .tdy-pinb:hover{background:var(--white);color:#8a919e;}
}

/* The guest teaser: pins live on the account, so a signed-out reader is shown
   what the row is for rather than an empty shelf. */
.tdy-pinerr{border-left-color:#c0392b;}
.tdy-teaser{display:flex;align-items:center;gap:14px;background:var(--white);border:1px solid #e7e9ee;border-left:4px solid var(--gold);border-radius:14px;padding:13px 18px;margin:14px 2px 0;flex-wrap:wrap;box-shadow:0 1px 2px rgba(16,24,40,.04);}
.tdy-teaser .ti{font-size:14.5px;font-weight:800;color:var(--ink);}
.tdy-teaser .ts{font-size:12.5px;font-weight:700;color:var(--slate);}
.tdy-teaser .tb{margin-left:auto;font-family:inherit;font-size:10.5px;font-weight:800;letter-spacing:.05em;text-transform:uppercase;background:var(--accent);color:var(--white);border:0;border-radius:999px;padding:7px 15px;cursor:pointer;white-space:nowrap;}
.tdy-teaser .tb:hover{background:#2d4a7d;}

@media(max-width:900px){
  /* THE BAR IS TWO ROWS ON A PHONE (owner, 2026-08-25): the controls up top,
     the categories on a scrolling row of their own underneath, where they get
     the full width instead of whatever is left after four buttons.
     column-reverse rather than a DOM change, so the desktop bar keeps its one
     row and its source order.

     BOTH ROWS ARE FULL-WIDTH BANDS THAT TOUCH (owner, 2026-08-28). Every
     category header on this page is already a filled band running edge to
     edge, and the nav above them was the one part still built out of rounded
     pills floating on a gutter, which read as a control panel bolted onto a
     page made of bands. So the bar carries no padding and no gaps: the two
     buttons split the top row and meet on a hairline, the chips run as one
     continuous strip of rectangles separated by hairlines, and both rows sit
     flush against each other and against the masthead above. The chip track
     needs no negative margin any more, since the row it sits in has no
     padding to bleed back out of.

     Both rows stick, and everything in them is a size down: two rows at the
     desktop's sizes measured 98px of permanently locked screen against the old
     bar's 48, and locking a quarter of a phone is not a trade worth making for
     a row of chips. At these sizes it is ~73px, and the selector row it
     replaced below the shelves was 42 of them.

     THESE RULES LIVE IN THIS BLOCK, not the big phone block above, and that is
     load-bearing: the jump bar's own rules are declared AFTER that block, so at
     equal specificity they win. A copy up there is a copy that does nothing. */
  .tdy-jb{margin-top:0;}
  /* THE SEAM UNDER THE MASTHEAD (owner, 2026-08-28). The masthead and this bar
     are two separately sticky elements, so they are two compositor layers, and
     during a phone's momentum scroll one can be repositioned a frame after the
     other. Sampled mid-scroll on the live site: the masthead's bottom read 1px
     while the bar was already pinned at 114, which is a 113px window of page
     content opening between the blue rule and the buttons.

     So the bar paints the masthead's own bottom edge upward into the space the
     masthead is supposed to occupy: its lower row's navy, its upper row's navy
     above that, and the 3px blue rule flush against the bar's top. The masthead
     is z-index 90 to this bar's 40, so it covers all of this whenever it is
     where it belongs; nothing about the resting page changes. This only decides
     what a dropped frame shows, and page content is the one answer that reads
     as a bug.

     Only while pinned. At rest the bar sits in the flow with real content above
     it, and a navy block there would be a bug rather than a backstop. The
     stop positions mirror the masthead's two rows and are cosmetic: they are
     never seen except for a frame, so drift costs nothing. */
  .tdy-jb.stuck::before{content:'';position:absolute;left:0;right:0;bottom:100%;height:160px;pointer-events:none;background:linear-gradient(to top,#2563eb 0 3px,#101d44 3px 59px,#233a63 59px 100%);}
  /* ONE HEIGHT FOR BOTH ROWS (owner, 2026-08-28), declared once here and taken
     as a min-height by both, rather than left to fall out of two different
     paddings around two different content boxes. A button's box is its own
     text; a chip's is the .nm line beside a dot, so equal padding gave 35px
     against 31px and the two bands read as one big row over one thin one. */
  .tdy-jbin{flex-direction:column-reverse;align-items:stretch;gap:0;padding:0;--navh:35px;}
  .tdy-jbtw{width:100%;}
  .tdy-jbt{margin:0;padding:0;gap:0;}
  .tdy-jbc{overflow:visible;gap:0;}
  /* On a phone these two are full-width targets rather than two words at
     the end of a row, so they take a surface back: a hover ground is no
     affordance at all on touch. Each takes half the row and they meet on a
     hairline, so the pair reads as one band rather than two buttons. */
  .tdy-jb2{flex:1 1 0;min-width:0;display:flex;align-items:center;justify-content:center;min-height:var(--navh);font-size:11.5px;padding:0 4px;text-align:center;background:var(--white);border-radius:0;box-shadow:none;border-right:1px solid #dfe4ec;}
  .tdy-jbc .tdy-jb2:last-child{border-right:0;}
  .tdy-jb2.on{background:var(--accent-soft);}
  /* The chips lose their corners and their gap for the same reason, so the
     track is one strip of tinted rectangles. The hairline is what tells two
     neighbouring tints apart; the chip's own ::before meter is unaffected,
     since it fills the padding box and the border sits outside it. */
  .tdy-jc{border:0;border-right:1px solid rgba(15,23,42,.09);border-radius:0;min-height:var(--navh);padding:0 12px 0 10px;}
  .tdy-jc .nm{font-size:11.5px;}
  .tdy-jbshin{padding:14px 14px 18px;}
  .tdy-reor{width:100%;}
  .tdy-azw{max-width:none;}
  .tdy-teaser{border-radius:0;border-left-width:4px;border-right:none;margin:0;}
}

/* ── A SHUT SHELF IS ITS TITLE BAND (owner, 2026-09-01) ──
   display:none rather than an unrendered row, so the tiles stay in the HTML:
   this page is the crawl path to every daily, and dropping them would drop ~70
   internal links with them. The band itself is unchanged, which is what makes
   the shut page a run of the same coloured bands the open one is built from. */
.tdy-body.shut{display:none;}
.tdy-hd{cursor:pointer;}
.tdy-tog{font-family:inherit;flex:none;margin-left:8px;width:26px;height:26px;display:inline-flex;align-items:center;justify-content:center;font-size:17px;line-height:1;font-weight:800;color:var(--white);background:rgba(255,255,255,.16);border:0;border-radius:999px;cursor:pointer;padding:0;transition:transform .18s,background .14s;}
.tdy-tog:hover{background:rgba(255,255,255,.32);}
.tdy-tog.on{transform:rotate(180deg);}
/* The circuits row's last tile opens the other sixteen where they are, so the
   header keeps the one link that leaves the page and the row keeps its own way
   through to the rest (and to their stars). */
.tdy-ct{position:relative;}
.tdy-ct.more{justify-content:center;text-align:center;color:var(--blue-deep);background:none;border:0;font-family:inherit;cursor:pointer;font-size:11.5px;font-weight:800;line-height:1.35;padding:11px 6px;}
.tdy-ct.more:hover{color:var(--accent);text-decoration:underline;}
@media(hover:hover){.tdy-ct:hover .tdy-pinb{opacity:1;}}
`;
