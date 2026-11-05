'use client';

// THE ONE-PAGE ENDING (owner, 2026-10-25). It replaced the sticky ending of
// 2026-10-18, which was a full-colour screen of three answers and a "See full
// details" link that closed it onto a second page of doors and drawers. The
// owner's ruling: one page, not multiple with details, on dailies and on runs.
//
// THE ORDER, top to bottom, on every width:
//
//   1. The result     verdict, the game's own key figure, today's field, you
//                     against yourself; Replay and Return to board beside it
//   2. Rankings       today's board (top three, then you) and your groups
//   3. Challenge      a friend, with the real GIF on show (tap to share it)
//   4. Play next      the run to finish, Play similar, Play another, the rest
//                     of the category as glyph tiles, every category, the slate
//   5. Full stats     streak, all-time rank, the set, your recent runs
//
// No IQ on it (owner, 2026-10-25). Glyphs only, never the full tile art.
//
// PHONE: the category colour IS the page. It takes the screen, the result
// lands, and the cards follow underneath on the same colour, one scroll.
//
// DESKTOP (over 900px): the colour fills the WHOLE screen first, header and
// sidebars included, and holds the result for a beat. Then it pulls back onto
// the result band at the top of the game column, revealing the site again,
// and the cards land under it. The in-page copy is mounted from the start
// (hidden) so the colour has a real rectangle to land on.
//
// Every figure is computed by StageFinish and passed in, so this file renders
// and animates and nothing else. Mock-up: the "One-page mobile ending" canvas.

import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { DRAWING } from '@/lib/drawing';
import { useMyTickets } from './TicketDoor';
import { gameStats, mmss } from '@/lib/daily-row-stats';
import GameGlyph from './GameGlyph';
import StageRoll from './StageRoll';
import { MemeStack } from './MemeShare';
import FinishGroupLine from './groups/FinishGroupLine';
import { dailyMeIdentity } from './dailyMeClient';
import { sharedGet } from './sharedGet';
import { useStageChrome } from './GauntletScreens';
import { dailyDept, DAILY_GAME_MAP } from '@/lib/daily-games';
import { CIRCUITS, runEngine, runGamesFor, circuitEntryHref } from '@/lib/circuits';
import { SKILL_TAGS, SKILL_MAP } from '@/lib/daily-skills';
import { categoryColor, softGround } from '@/lib/category-ramp';
import { usePuzzleStandings, StandBeat, StandCard, PassCard, PassPlay, beatDuration } from './WhereYouStand';

// RUNS, NOT THEIR PARTS (owner, 2026-10-26: "don't send users to individual
// run components. show runs in place of those"). A game that is one question
// set of a gauntlet-style run (Trivia, English and Math Gauntlets, Price
// Check, Passport: owner, 2026-10-26) is offered as its run. Standalone
// dailies a run also deals (the Dojo sudokus, the Judged cases, the
// crosswords) stay themselves.
const PART_ENGINES = new Set(['quiz', 'math', 'price', 'passport']);
const RUN_OF = (() => {
  const m = new Map();
  for (const c of CIRCUITS) {
    if (!PART_ENGINES.has(runEngine(c.id))) continue;
    const serve = runGamesFor(c.id);
    for (const k of c.keys || []) if (serve.includes(k) && !m.has(k)) m.set(k, c);
  }
  return m;
})();
// Folds run parts into one entry per run, kept at the place of its first part.
function foldRuns(list, players) {
  const out = [];
  const seen = new Map();
  for (const g of list) {
    const c = RUN_OF.get(g.key);
    if (!c) { out.push(g); continue; }
    const n = players ? players(g.key) : 0;
    if (seen.has(c.id)) { const r = seen.get(c.id); r.players = Math.max(r.players, n); continue; }
    const r = { key: g.key, run: c.id, name: c.name, href: circuitEntryHref(c.id), cat: 'Run', done: false, players: n };
    seen.set(c.id, r); out.push(r);
  }
  return out;
}

const useIsoLayout = typeof window !== 'undefined' ? useLayoutEffect : useEffect;

const SANS = "Manrope, ui-sans-serif, system-ui, -apple-system, sans-serif";

// When each block lands, from the mount (ms). Fast on purpose (2026-10-24,
// player report on a slow ending): everything is usable inside 1.5s, and a tap
// anywhere lands it all at once.
const T = { s1: 100, count: 350, s2: 450, fill: 550, s3: 750, marks: 850, chal: 1050, play: 1250, more: 1450 };
// Desktop: how long the full-screen colour holds before it pulls back, and the
// pull-back itself.
const HOLD_MS = 2800;
const RETRACT_MS = 900;
// THE ENDING WAITS FOR ITS FIGURES (owner, 2026-10-25: "things fill in
// piecemeal with jitters"). The verdict lands at once; everything that reads
// the day's standings waits until those have arrived, then lands finished. If
// they have not arrived after this long, it lands anyway and fills in place.
const READY_WAIT_MS = 1600;
const DESK_MQ = '(min-width: 901px)';
// How long the ending waits for the standings before going on without the beat.
const STAND_WAIT_MS = 2600;
// Desktop: the standings beat starts this long after the mount, under the result.
const BEAT_AT_MS = 1300;

const ease = (t) => 1 - Math.pow(1 - t, 3);

// THE COUNT NEVER RESIZES ITS BOX: the final text sits underneath, invisible,
// and holds the width; the counting text is laid over it.
function Count({ fig, run }) {
  const [v, setV] = useState(null);
  // IT COUNTS ONCE. The parent rebuilds fig every render, so keying the effect
  // on the object restarted the count over and over; it keys on the number,
  // and a ref holds it at the final figure once it has landed.
  const doneRef = useRef(false);
  const n = fig && fig.n != null ? fig.n : null;
  useEffect(() => {
    if (!run || n == null || doneRef.current) return undefined;
    const t0 = performance.now();
    let raf = 0;
    const tick = (t) => {
      const p = Math.min(1, (t - t0) / T.count);
      setV(n * ease(p));
      if (p < 1) raf = requestAnimationFrame(tick);
      else doneRef.current = true;
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [run, n]);
  if (!fig) return null;
  const shown = fig.n == null || v == null || doneRef.current ? fig.text
    : fig.kind === 'time' ? mmss(Math.round(v))
    : `${fig.pre || ''}${Number.isInteger(fig.n) ? Math.round(v).toLocaleString('en-US') : v.toFixed(1)}${fig.post || ''}`;
  return (
    <span className="sst-cnt">
      <span className="sst-cnt-hold" aria-hidden="true">{fig.text}</span>
      <span className="sst-cnt-now">{shown}</span>
    </span>
  );
}

// THE OVERALL BOARD HOLDS FIVE PLACES (owner, 2026-10-26). A small field
// left the table a row or two in a tall card; the places nobody holds yet read
// Empty. Only a plain top of the board pads: a board that jumps (a gap row
// carrying the reader's own place further down) is already past five.
// The all-time board, top five, then the reader's own place when it is
// further down, in the same shape the day's board uses.
function allRows(at, n = 5) {
  const board = (Array.isArray(at && at.board) ? at.board : []).map((r) => ({ rank: r.rank, username: r.username, points: r.points, me: !!r.isMe }));
  const top = board.slice(0, 5);
  if (at && at.myRank && !top.some((r) => r.me)) {
    top.push({ gap: true }, { rank: at.myRank, points: at.myPoints, me: true });
  }
  return fillRows(top, board, n);
}

function padRows(rows, n = 5) {
  const list = Array.isArray(rows) ? rows : [];
  if (list.some((r) => r.gap) || list.length >= n) return list;
  const top = list.reduce((m, r) => Math.max(m, Number(r.rank) || 0), 0);
  const out = list.slice();
  for (let k = top + 1; out.length < n; k += 1) out.push({ empty: true, rank: k });
  return out;
}

// THE BOARD FILLS ITS CARD (owner, 2026-10-27: "top five should fill down for
// as many ranks as fit"). `list` is the five-place board (with a gap and the
// reader's own rows when they sit further down); `pool` is every ranked row the
// read carried. With room for `n` rows the top runs on down to n, and when the
// reader's place falls inside that run the gap closes and the list is simply
// contiguous. Ranks nobody holds yet read Empty, as before.
function fillRows(list, pool, n) {
  const rows = Array.isArray(list) ? list : [];
  const all = Array.isArray(pool) ? pool.filter((r) => r && !r.gap && !r.empty) : [];
  if (n <= 5 || !all.length) return padRows(rows, Math.max(5, n));
  const gi = rows.findIndex((r) => r.gap);
  if (gi < 0) return padRows(all.slice(0, n), n);
  const tail = rows.slice(gi + 1);
  const last = Number(tail.length ? tail[tail.length - 1].rank : NaN);
  if (Number.isFinite(last) && last <= n && tail.every((r) => Number.isFinite(Number(r.rank)))) {
    const byRank = new Map(all.slice(0, last).map((r) => [Number(r.rank), r]));
    tail.forEach((r) => byRank.set(Number(r.rank), r));
    return padRows([...byRank.values()].sort((a, b) => Number(a.rank) - Number(b.rank)), n);
  }
  const head = all.slice(0, Math.max(5, n - tail.length - 1));
  return head.concat([{ gap: true }], tail);
}

export default function StageStick({
  tone = '', eyebrow, verdict, metric, field, self, chal = null, similar = null, another = null, run = null, allHref = '/#all',
  sheet = {}, onLeave, onBack = null, archiveHref = null, archiveLabel = 'Past puzzles', replayNow = null, meme = null, shelf = null, cats = null,
  ready = true, allGames = null, share = null, retry = null, archive = null, curISO = null, rankHead = null,
  standing = null,
}) {
  const [host] = useState(() => (typeof document === 'undefined' ? null : (document.querySelector('.stage-page') || document.body)));
  const [step, setStep] = useState(0);        // 0..6, how many blocks have landed
  const [fill, setFill] = useState(false);
  const [marks, setMarks] = useState(false);
  // 'show': the colour covers the screen. 'retract': desktop, pulling back.
  // 'inline': desktop, the colour has gone and the page copy is the ending.
  const [phase, setPhase] = useState('show');
  const [desk, setDesk] = useState(() => { try { return typeof window !== 'undefined' && window.matchMedia(DESK_MQ).matches; } catch (e) { return false; } });
  const [clip, setClip] = useState(null);
  const [inkLight, setInkLight] = useState(false);
  const timers = useRef([]);
  // `go` flips once the figures are in (or the wait runs out), and never back.
  const mountAt = useRef(0);
  const [go, setGo] = useState(!!ready);
  useEffect(() => { if (ready) setGo(true); }, [ready]);
  useEffect(() => {
    if (go) return undefined;
    const t = setTimeout(() => setGo(true), READY_WAIT_MS);
    return () => clearTimeout(t);
  }, [go]);
  const inlineRef = useRef(null);
  const heroRef = useRef(null);
  const rootRef = useRef(null);
  const tk = useMyTickets();
  // THE GROUP READ, handed up by FinishGroupLine, for the phone's result bar.
  const [grp, setGrp] = useState(null);
  // KEEP PLAYING (owner, 2026-10-26, direction B): on desktop the bottom of
  // the ending offers the categories, more puzzles AND quizzes, in place of
  // the record card. The quizzes are the most-played one per department (the
  // same cached read DailyEndCard uses), the game's own department first.
  const [quizzes, setQuizzes] = useState(null);
  // TODAY / ALL TIME on the board (owner, 2026-10-26: "a subtle toggle to
  // select the all-time leaderboard; its data must not load unless the player
  // selects it"). Nothing is asked for until All time is pressed, and then once.
  const [scope, setScope] = useState('today');
  // How many board rows fit the card on a desktop (never fewer than five).
  const [fitN, setFitN] = useState(5);
  const [rowH, setRowH] = useState(38);
  const fillRef = useRef(null);
  const [allTime, setAllTime] = useState(null);
  const askedAll = useRef(false);
  const boardGame = sheet && sheet.gameKey;
  // WHERE YOU STAND (owner, 2026-11-03): this puzzle, its category and the
  // whole day, as a beat after the result and a card on the page. The first
  // row's board is the game's own board this ending already holds.
  const sRows = sheet && Array.isArray(sheet.rows) ? sheet.rows : [];
  const stand = usePuzzleStandings({
    on: !!(standing && standing.game), gameKey: standing && standing.gameKey, gameName: standing && standing.gameName,
    cat: standing && standing.cat, game: standing && standing.game,
    board: sRows.map((r) => (r.gap ? { gap: true } : r.empty ? null : { rank: r.rank, name: r.username, fig: gameStats(r, sheet.missLabel, sheet.gameKey), me: !!r.me })).filter(Boolean),
    next: (() => {
      // The player just above on this puzzle's board, and the clock between you
      // on a race (else just their figure).
      const i = sRows.findIndex((r) => r && r.me);
      const up = i > 0 ? sRows[i - 1] : null;
      if (!up || up.gap || up.empty || !up.username) return null;
      const mine = sRows[i];
      const a = Number(up.timeElapsed), b = Number(mine && mine.timeElapsed);
      const race = !!(standing && standing.game && standing.game.race) && Number.isFinite(a) && Number.isFinite(b) && b >= a;
      const d = race ? Math.round(b - a) : null;
      return { name: up.username, fig: gameStats(up, sheet.missLabel, sheet.gameKey) || '', gapText: race ? `${d < 60 ? `${d}s` : mmss(d)} behind` : `#${up.rank} next`, fill: race && b > 0 ? Math.max(0.05, Math.min(1, a / b)) : 0.85 };
    })(),
  });
  const standRows = stand.rows && stand.rows.length >= 2 ? stand.rows : null;
  // The beat waits for its figures, but never long: past STAND_WAIT_MS the
  // ending goes on without it and the card simply fills in when they land.
  // A board read that lands after the mount (owner report, 2026-11-04: Roll's
  // ending showed no Where You Stand boxes) still gets its beat: without a
  // standing the ending waits up to STAND_WAIT_MS for one before going on.
  const hasStanding = !!(standing && standing.game);
  const [standGo, setStandGo] = useState(false);
  const standGoAt = useRef(0);
  const [beatRows, setBeatRows] = useState(null);
  useEffect(() => {
    if (standGo || hasStanding) return undefined;
    const t = setTimeout(() => { standGoAt.current = Date.now(); setStandGo(true); }, STAND_WAIT_MS);
    return () => clearTimeout(t);
  }, [hasStanding, standGo]);   // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (standGo || !hasStanding) return undefined;
    if (stand.ready) {
      standGoAt.current = Date.now();
      setBeatRows(standRows);
      setStandGo(true);
      return undefined;
    }
    const t = setTimeout(() => { standGoAt.current = Date.now(); setStandGo(true); }, STAND_WAIT_MS);
    return () => clearTimeout(t);
  }, [stand.ready, standGo, hasStanding]);   // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (scope !== 'all' || askedAll.current || !boardGame) return;
    askedAll.current = true;
    const { anonId, email } = dailyMeIdentity();
    const qs = new URLSearchParams({ game: boardGame });
    if (anonId) qs.set('anonId', anonId);
    if (email) qs.set('email', email);
    sharedGet('/api/quiz/daily-game?' + qs.toString())
      .then((d) => setAllTime(d && d.allTime ? d.allTime : { board: [] }))
      .catch(() => setAllTime({ board: [] }));
  }, [scope, boardGame]);
  useEffect(() => {
    if (!desk) return undefined;
    let alive = true;
    fetch('/api/quiz/popular-by-category').then((r) => (r.ok ? r.json() : null)).then((d) => {
      if (!alive || !d || !Array.isArray(d.cats)) return;
      setQuizzes(d.cats);
    }).catch(() => {});
    return () => { alive = false; };
  }, [desk]);
  // UP NEXT IN THE RAIL (owner, 2026-10-26: the ending "looks really bad off
  // center ... maybe we keep right panel on full width but it displays
  // something else? today's top puzzles?"). On a desktop with the side rail
  // the ending stays in the board's column and the rail turns into Up next:
  // today's most played puzzles (the home pane's /api/quiz/pulse read, held
  // by the CDN), the rest of this category, a few quizzes and the categories.
  const [rail, setRail] = useState(null);
  const [pulse, setPulse] = useState(null);
  useEffect(() => {
    if (!desk) { setRail(null); return undefined; }
    // Re-found when the frame comes and goes (Hide menus & leaderboard), and
    // looked for again for a few seconds: the frame can mount after the ending
    // does, and a missed rail left it showing an empty Board tab.
    let poll = null;
    const find = () => {
      const el = document.querySelector('html.lc-on .lc-side');
      setRail(el);
      clearInterval(poll); poll = null;
      if (!el) {
        let n = 0;
        poll = setInterval(() => {
          const e2 = document.querySelector('html.lc-on .lc-side');
          if (e2 || ++n > 25) { clearInterval(poll); poll = null; if (e2) setRail(e2); }
        }, 400);
      }
    };
    find();
    let mo = null;
    try { mo = new MutationObserver(find); mo.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] }); } catch (e) {}
    let alive = true;
    fetch('/api/quiz/pulse').then((r) => (r.ok ? r.json() : null)).then((d) => {
      if (alive && d && d.gameToday) setPulse(d.gameToday);
    }).catch(() => {});
    return () => { alive = false; if (mo) mo.disconnect(); clearInterval(poll); };
  }, [desk]);

  const retract = () => {
    if (phase !== 'show') return;
    const hero = heroRef.current;
    if (!hero) { setPhase('inline'); return; }
    // Bring the band to the top of the screen first, so the colour lands on
    // something the reader can see.
    // THE SCROLL IS INSTANT (owner report, 2026-10-26: the band "renders much
    // higher initially"). html carries scroll-behavior:smooth, so a plain
    // scrollTo glided AFTER the clip had been measured: the colour pulled back
    // onto where the band was before the scroll, then the band slid away from
    // it. Scroll at once, let layout settle a frame, then measure.
    try {
      const r0 = hero.getBoundingClientRect();
      const want = window.scrollY + r0.top - 84;
      if (Math.abs(r0.top - 84) > 4) window.scrollTo({ top: Math.max(0, want), behavior: 'instant' });
    } catch (e) {}
    setPhase('retract');
    requestAnimationFrame(() => {
      const r = hero.getBoundingClientRect();
      const W = window.innerWidth, H = window.innerHeight;
      // THE RULE UNDER THE BAND STAYS IN VIEW (owner report, 2026-10-27: the line
      // "comes in piecemeal, bold on the side initially before filling"). The
      // colour used to land on the band's full box, rule included, with all
      // four corners rounded: the rule hid under it and only its two ends
      // showed through the rounded bottom corners until the cover went. It now
      // lands just above the rule, square at the bottom, so the line is whole
      // the whole time.
      let bb = 2;
      try { bb = parseFloat(getComputedStyle(hero).borderBottomWidth) || 0; } catch (e) {}
      setClip(`inset(${Math.max(0, r.top)}px ${Math.max(0, W - r.right)}px ${Math.max(0, H - r.bottom + bb)}px ${Math.max(0, r.left)}px round 10px 10px 0 0)`);
      timers.current.push(setTimeout(() => setPhase('inline'), RETRACT_MS + 40));
    });
  };

  const skip = () => {
    timers.current.forEach(clearTimeout); timers.current = [];
    setStep(6); setFill(true); setMarks(true);
  };
  useEffect(() => {
    let reduced = false;
    try { reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches; } catch (e) { reduced = false; }
    mountAt.current = Date.now();
    if (reduced) { skip(); return undefined; }
    // The verdict needs nothing from the server, so it never waits.
    const t = setTimeout(() => setStep((s) => Math.max(s, 1)), T.s1);
    timers.current.push(t);
    return () => { timers.current.forEach(clearTimeout); timers.current = []; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  // The rest lands on its usual beat, counted from the mount, but never before
  // the figures it shows are in. Each block lands complete or not at all.
  useEffect(() => {
    if (!go) return undefined;
    let reduced = false;
    try { reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches; } catch (e) { reduced = false; }
    if (reduced) { skip(); return undefined; }
    const since = Date.now() - (mountAt.current || Date.now());
    // On time: each block at its usual moment. Late: the same rhythm, started now.
    const at = (ms, fn) => timers.current.push(setTimeout(fn, since <= T.s2 ? ms - since : ms - T.s2));
    at(T.s2, () => setStep((s) => Math.max(s, 2)));
    at(T.fill, () => setFill(true));
    at(T.s3, () => setStep((s) => Math.max(s, 3)));
    at(T.marks, () => setMarks(true));
    at(T.chal, () => setStep((s) => Math.max(s, 4)));
    at(T.play, () => setStep((s) => Math.max(s, 5)));
    at(T.more, () => setStep((s) => Math.max(s, 6)));
    return undefined;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [go]);

  // DESKTOP: hold, then pull back. Reduced motion goes straight to the page.
  // The hold counts from the mount as before, but the colour never pulls back
  // before the figures under it have landed, so the page it reveals is whole.
  useEffect(() => {
    if (!desk) return undefined;
    let reduced = false;
    try { reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches; } catch (e) { reduced = false; }
    if (reduced) { setPhase('inline'); return undefined; }
    if (!go || !standGo) return undefined;
    const since = Date.now() - (mountAt.current || Date.now());
    // With the standings beat on the cover, the colour holds until it has played.
    const beatEnd = beatRows ? Math.max(BEAT_AT_MS, (standGoAt.current || 0) - (mountAt.current || 0)) + beatDuration(beatRows.length) + 1100 : 0;
    const t = setTimeout(() => retract(), Math.max(HOLD_MS - since, T.more - T.s2 + 600, beatEnd - since));
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [desk, go, standGo]);

  // The page under the colour does not scroll while the colour is up.
  const covering = phase !== 'inline';
  useEffect(() => {
    if (!covering) return undefined;
    const html = document.documentElement;
    const prev = html.style.overflow;
    html.style.overflow = 'hidden';
    return () => { html.style.overflow = prev; };
  }, [covering]);
  useEffect(() => {
    const onKey = (e) => {
      if (e.key !== 'Escape') return;
      if (step < 6) skip();
      else if (desk) retract();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step, desk, phase]);

  // The cards sit on a quieter step of the category colour. Which direction
  // depends on the ink: dark ink on a pastel lifts toward white, white ink on
  // a deep step drops toward black. Read off the painted ink, so it is right
  // in either register without knowing which one it is.
  useEffect(() => {
    const el = rootRef.current || inlineRef.current;
    if (!el) return;
    try {
      const m = /rgba?\((\d+),\s*(\d+),\s*(\d+)/.exec(getComputedStyle(el).color);
      if (m) {
        const lum = (0.2126 * m[1] + 0.7152 * m[2] + 0.0722 * m[3]) / 255;
        setInkLight(lum > 0.6);
      }
    } catch (e) {}
  }, [host, desk]);

  // FULL SCREEN MEANS THE BARS TOO (owner, 2026-10-25): on a phone the page
  // ground, Safari's top and bottom bars and the theme colour all take the
  // ending's colour while it is up, the same way the phone stages paint them.
  const [chromeColor, setChromeColor] = useState(null);
  useEffect(() => {
    if (desk) { setChromeColor(null); return; }
    const el = rootRef.current;
    if (!el) return;
    try { setChromeColor(getComputedStyle(el).backgroundColor || null); } catch (e) { setChromeColor(null); }
  }, [host, desk]);
  useStageChrome(desk ? null : chromeColor);

  const trackRef = useRef(null);
  const trackKey = self && self.track ? self.track.map((p) => `${p.k}:${p.x}:${p.label}:${p.fig}`).join('|') : '';
  const fitTrack = () => {
    const el = trackRef.current;
    if (!el) return;
    const lbs = [...el.querySelectorAll('.pt:not(.today) .lb')];
    lbs.forEach((l) => { l.style.marginLeft = ''; l.classList.remove('r2'); });
    el.classList.remove('two');
    if (lbs.length < 2) return;
    const box = el.getBoundingClientRect();
    const GAP = 12, BLEED = 10;
    const rs = lbs.map((l) => { const b = l.getBoundingClientRect(); return { l, left: b.left, right: b.right }; })
      .sort((a, b) => a.left - b.left);
    for (let i = 1; i < rs.length; i++) {
      const A = rs[i - 1], B = rs[i];
      const need = A.right + GAP - B.left;
      if (need <= 0) continue;
      const dB = Math.min(need, Math.max(0, box.right + BLEED - B.right));
      const dA = Math.min(need - dB, Math.max(0, A.left - (box.left - BLEED)));
      if (dA + dB >= need) {
        const mA = (parseFloat(A.l.style.marginLeft) || 0) - dA;
        A.l.style.marginLeft = `${mA}px`; A.left -= dA; A.right -= dA;
        B.l.style.marginLeft = `${dB}px`; B.left += dB; B.right += dB;
      } else {
        B.l.classList.add('r2'); el.classList.add('two');
      }
    }
  };
  useIsoLayout(() => { fitTrack(); }, [trackKey, host, phase, desk]);   // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (!trackKey) return undefined;
    const re = () => fitTrack();
    window.addEventListener('resize', re);
    try { document.fonts && document.fonts.ready.then(re); } catch (e) {}
    return () => window.removeEventListener('resize', re);
  }, [trackKey, host, phase]);

  // THE ENDING IS ITS OWN WIDTH, NOT THE GAME'S (owner, 2026-10-26: "I liked
  // the prior format better, wider top element with side by side lower
  // elements"). The in-page ending sits inside each game's own board column,
  // which runs 620px on Sixes and 880px on Jig, so the same ending came out
  // single file on one game and two across on another. It now takes up to
  // 880px of the page's content area (inside the side rails), centred on the
  // game column, and only drops to one column when that room is not there.
  const fitWide = () => {
    const el = inlineRef.current;
    if (!el) return;
    el.style.width = ''; el.style.maxWidth = ''; el.style.marginLeft = '';
    const par = el.parentElement;
    const pg = el.closest('.stage-page');
    if (!par || !pg) return;
    const hb = pg.getBoundingClientRect();
    const cs = getComputedStyle(pg);
    const L = hb.left + (parseFloat(cs.paddingLeft) || 0);
    const R = hb.right - (parseFloat(cs.paddingRight) || 0);
    const pb = par.getBoundingClientRect();
    const Wd = Math.min(1240, R - L);
    if (Wd <= pb.width + 1) return;
    const left = Math.max(L, Math.min(pb.left + pb.width / 2 - Wd / 2, R - Wd));
    el.style.maxWidth = 'none';
    el.style.width = `${Math.round(Wd)}px`;
    el.style.marginLeft = `${Math.round(left - pb.left)}px`;
  };
  useIsoLayout(() => { if (desk) fitWide(); }, [host, desk, phase]);   // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (!desk) return undefined;
    const re = () => fitWide();
    window.addEventListener('resize', re);
    return () => window.removeEventListener('resize', re);
  }, [host, desk]);   // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const el = fillRef.current;
    if (!desk || !el || typeof ResizeObserver === 'undefined') return undefined;
    const measure = () => {
      const tr = el.querySelector('tr');
      const rh = tr ? tr.getBoundingClientRect().height : 0;
      if (!rh) return;
      setRowH((p) => (Math.abs(p - rh) < 0.5 ? p : rh));
      const n = Math.max(5, Math.floor((el.clientHeight + 1) / rh));
      setFitN((p) => (p === n ? p : n));
    };
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    measure();
    return () => ro.disconnect();
  });
  if (!host) return null;
  const on = (n) => 'sst-b' + (step >= n ? ' on' : '');
  const bgTap = (e) => {
    if (e.target.closest && e.target.closest('a,button')) return;
    if (step < 6) skip();
    else if (desk && phase === 'show') retract();
  };

  const tickets = chal && chal.draw
    ? (tk.named === false ? `${DRAWING.prizeLabel} drawing: pick a name for tickets`
      : `${DRAWING.prizeLabel} drawing: you have ${tk.count == null ? '…' : tk.count} ${tk.count === 1 ? 'ticket' : 'tickets'}`)
    : null;
  const chalSub = chal ? (chal.msg || [chal.lead, tickets || 'No spoilers'].filter(Boolean).join(' · ')) : '';

  const s = sheet || {};
  // The board's heading, with the quiet Today / All time switch beside it.
  // A quiz board is already all-time, so it carries no switch.
  const boardHead = (label) => (
    <div className="sst-bh">
      <div className="sst-sl">{label}</div>
      {s.gameKey && !s.boardLabel ? (
        <div className="sst-scope" role="tablist" aria-label="Leaderboard">
          <button type="button" role="tab" aria-selected={scope === 'today'} className={scope === 'today' ? 'on' : ''} onClick={() => setScope('today')}>Today</button>
          {desk && standRows ? standRows.slice(1).map((r) => (
            <button key={r.id} type="button" role="tab" aria-selected={scope === r.id} className={scope === r.id ? 'on' : ''} onClick={() => setScope(r.id)}>{r.name}</button>
          )) : null}
          <button type="button" role="tab" aria-selected={scope === 'all'} className={scope === 'all' ? 'on' : ''} onClick={() => setScope('all')}>All time</button>
        </div>
      ) : null}
    </div>
  );
  // NO COUNTING ON ANY SUDOKU (owner, 2026-10-26): the time lands whole.
  const noCount = !!(s.gameKey && DAILY_GAME_MAP[s.gameKey] && DAILY_GAME_MAP[s.gameKey].cat === 'Sudoku');
  const pos = (v) => `${Math.round(Math.max(0, Math.min(1, v)) * 100)}%`;

  // Return to board / Reveal answer, and Replay. Both leave this page for the
  // board, so both close it first.
  // BACK TO BOARD (owner, 2026-10-25) shows the board itself, with a way back
  // to this page, and none of the older card underneath. onBack is that
  // board view; onLeave stays the path for Replay.
  const back = s.back ? () => { if (onBack) onBack(); else if (onLeave) onLeave(); s.back(); } : null;
  const replayBtn = replayNow ? (replayNow.href
    ? <a className="sst-hb" href={replayNow.href} onClick={replayNow.onClick || undefined}>Replay</a>
    : <button type="button" className="sst-hb" onClick={(e) => { if (onLeave) onLeave(); if (replayNow.onClick) replayNow.onClick(e); }}>Replay</button>) : null;

  // ── 1. THE RESULT ──────────────────────────────────────────────────────
  // `live` is true on exactly ONE copy at a time, the one the reader can
  // see, so the measured track and the counted figure belong to it.
  // Today's field and you against yourself: the second half of the result, on
  // its own so the phone's rolling ending can play it as its own beat.
  const resultStats = (live) => (
    <div className="sst-h2">
      {(
      <section className={on(2)}>
        <div className="sst-lab">Today&rsquo;s field</div>
        <div className="sst-hl">{field && field.line ? field.line : 'The board is still filling'}</div>
        <div className="sst-bar" aria-hidden="true">
          <span style={{ width: fill && field && field.pct != null ? pos(field.pct / 100) : '0%' }} />
        </div>
        <div className="sst-caps">
          <span>{field && field.lo ? field.lo : ' '}</span>
          <span>{field && field.hi ? field.hi : ' '}</span>
        </div>
      </section>
      )}
      <section className={on(3)}>
        <div className="sst-lab">Against yourself</div>
        <div className="sst-hl">{self ? self.head : ' '}</div>
        {self && self.track ? (
          <div className="sst-track" ref={live ? trackRef : undefined} aria-hidden="true">
            <span className="ln" />
            {self.track.map((p) => (
              <span key={p.k} className={'pt ' + p.k + (p.edge ? ' ' + p.edge : '') + (marks ? ' on' : '')} style={{ left: pos(p.x) }}>
                <s />
                <span className="lb"><em>{p.label}</em><small>{p.fig}</small></span>
              </span>
            ))}
          </div>
        ) : self && self.strip ? (
          <div className="sst-strip" aria-hidden="true">
            {self.strip.map((w, i) => (
              <s key={i} className={(w ? 'w' : 'l') + (marks ? ' on' : '') + (i === self.strip.length - 1 ? ' now' : '')}
                style={{ transitionDelay: `${i * 60}ms` }} />
            ))}
          </div>
        ) : (
          <div className="sst-sub">{self && self.sub ? self.sub : ' '}</div>
        )}
      </section>
    </div>
  );
  // THE BAND ON A DESKTOP (owner, 2026-11-04): the three standings boxes,
  // each naming who is next to pass, take the place of Today's field and
  // Against yourself once they are in.
  const result = (live, band = false) => (
    <div className="sst-hero">
      <section className={on(1) + ' sst-h1'}>
        <div className="sst-eb">{eyebrow}</div>
        <div className="sst-v">{verdict}</div>
        {metric ? (
          <div className="sst-m">
            <b>{live && !noCount ? <Count fig={metric} run={step >= 1} /> : metric.text}</b>
            {metric.label ? <i>{metric.label}</i> : null}
          </div>
        ) : null}
        {(replayBtn || back) ? (
          <div className="sst-hbs">
            {replayBtn}
            {back ? <button type="button" className="sst-hb" onClick={back}>{s.backLabel || 'Return to board'}</button> : null}
          </div>
        ) : null}
        {/* THE ARCHIVE, prominent on every ending (owner, 2026-10-25). */}
        {archiveHref ? (
          <a className="sst-arc" href={archiveHref}>
            <span>{archiveLabel}</span>
            <span aria-hidden="true">&rarr;</span>
          </a>
        ) : null}
      </section>
      {band && desk && standRows ? <div className={'sst-h2 sst-bandwys ' + on(2)}><PassCard rows={standRows} band /></div> : resultStats(live)}
    </div>
  );

  // THE SLIM BAND, desktop (owner, 2026-11-05, ending direction C): the result
  // on one line, the three standings as small boxes beside it, and Replay /
  // Back to board / the archive as plain links at the right edge.
  const bandC = (live) => (
    <div className="sst-hero sst-hc">
      <section className={on(1) + ' sst-h1'}>
        <div className="sst-eb">{eyebrow}</div>
        <div className="sst-vm">
          <span className="sst-v">{verdict}</span>
          {metric ? <b className="sst-mc">{live && !noCount ? <Count fig={metric} run={step >= 1} /> : metric.text}</b> : null}
          {metric && metric.label ? <i className="sst-ml">{metric.label}</i> : null}
        </div>
      </section>
      {standRows ? <div className={'sst-h2 sst-bandwys ' + on(2)}><PassCard rows={standRows} band /></div> : <div className="sst-hsp" />}
      <section className={on(1) + ' sst-hl3'}>
        {replayNow ? (replayNow.href
          ? <a className="sst-tl" href={replayNow.href} onClick={replayNow.onClick || undefined}>Replay</a>
          : <button type="button" className="sst-tl" onClick={(e) => { if (onLeave) onLeave(); if (replayNow.onClick) replayNow.onClick(e); }}>Replay</button>) : null}
        {back ? <button type="button" className="sst-tl" onClick={back}>{s.backLabel || 'Return to board'}</button> : null}
        {archiveHref ? <a className="sst-tl" href={archiveHref}>{archiveLabel}</a> : null}
      </section>
    </div>
  );

  // KEEP PLAYING, desktop (owner, 2026-10-26, direction B). The categories
  // first, then the rest of this category and a few quizzes side by side. It
  // stands in for the record card, which the desktop no longer shows: the
  // game page's own You and Archive tabs carry that.
  const myDept = s.gameKey ? dailyDept(s.gameKey) : null;
  const quizPicks = quizzes ? quizzes.slice().sort((x, y) => (x.dept === myDept ? -1 : 0) - (y.dept === myDept ? -1 : 0)).slice(0, 4) : [];
  const leftToday = cats ? cats.reduce((t, c) => t + Math.max(0, c.total - c.n), 0) : null;
  const plays = (k) => (pulse && pulse[k] ? pulse[k].players || 0 : 0);
  const myRun = s.gameKey ? RUN_OF.get(s.gameKey) : null;
  const topToday = (allGames && pulse)
    ? foldRuns(allGames.filter((g) => g.key !== s.gameKey && plays(g.key) > 0)
      .sort((a, b) => (plays(b.key) - plays(a.key)) || a.name.localeCompare(b.name)), plays)
      .filter((g) => !(myRun && g.run === myRun.id))
      .map((g) => (g.run ? g : { ...g, players: plays(g.key) }))
      .slice(0, 6)
    : null;
  const moreHere = shelf && shelf.games
    ? foldRuns(shelf.games.slice().sort((a, b) => (a.done ? 1 : 0) - (b.done ? 1 : 0)))
      .filter((g) => !(myRun && g.run === myRun.id)).slice(0, 4)
    : [];
  const railRow = (g, sub) => (
    <a key={g.run || g.key} href={g.href} className={'sst-rr' + (g.done ? ' done' : '')}>
      <span className="gl"><GameGlyph gameKey={g.key} size={20} /></span>
      <span className="tx"><b>{g.name}</b><small>{sub}</small></span>
      <span className="ar" aria-hidden="true">{g.done ? '\u2713' : '\u2192'}</span>
    </a>
  );
  const upNext = (
    <div className={'sst-rail' + (phase !== 'show' ? ' in' : '')}>
      <div className="sst-rh"><b>Up next</b>{leftToday ? <span>{leftToday} left today</span> : null}</div>
      <div className="sst-rs">
        <div className="sst-rl">Most played today</div>
        {topToday === null ? <div className="sst-rhold" aria-hidden="true" /> : topToday.map((g) => railRow(g,
          `${g.cat} \u00b7 ${g.players} ${g.players === 1 ? 'player' : 'players'}`))}
      </div>
      {moreHere.length ? (
        <div className="sst-rs">
          <div className="sst-rl">More {shelf.cat}{shelf.total ? <span>{shelf.n} of {shelf.total}</span> : null}</div>
          {moreHere.map((g) => railRow(g, g.run ? 'Run' : g.done ? 'Played' : (g.time || 'Today\u2019s puzzle')))}
        </div>
      ) : null}
      {quizPicks.length ? (
        <div className="sst-rs">
          <div className="sst-rl">Quizzes<a href="/quizzes">All</a></div>
          {quizPicks.slice(0, 3).map((q) => (
            <a key={q.id} href={q.href} className="sst-rr q">
              <span className="tx"><b>{q.title}</b><small>{q.label}</small></span>
              <span className="ar" aria-hidden="true">&rarr;</span>
            </a>
          ))}
        </div>
      ) : null}
      {cats && cats.length ? (
        <div className="sst-rs">
          <div className="sst-rl">Categories</div>
          <div className="sst-rc">
            {cats.map((c) => (
              <a key={c.name} href={c.href} className="sst-catc" style={{ '--cc': c.bg }}>
                <span className="n">{c.n}/{c.total}</span>{c.name}
              </a>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
  const keepPlaying = (
    <div className="sst-kp">
      <div className="sst-kph"><b>Keep playing</b>{leftToday ? <span>{leftToday} {leftToday === 1 ? 'puzzle' : 'puzzles'} left today</span> : null}</div>
      {cats && cats.length ? (
        <div className="sst-cats">
          {cats.map((c) => (
            <a key={c.name} href={c.href} className="sst-catc" style={{ '--cc': c.bg }}>
              <span className="n">{c.n}/{c.total}</span>{c.name}
            </a>
          ))}
        </div>
      ) : null}
      <div className={'sst-kpg' + (quizPicks.length ? '' : ' one')}>
        {shelf && shelf.games && shelf.games.length ? (
          <div className="sst-shelf">
            <div className="sst-shd2"><b>More {shelf.cat} puzzles</b>{shelf.total ? <span>{shelf.n} of {shelf.total} played</span> : null}</div>
            <div className="sst-kpt">
              {shelf.games.slice(0, 9).map((g) => (
                <a key={g.key} href={g.href} className={'sst-kpc' + (g.done ? ' done' : '')}>
                  <span className="gl"><GameGlyph gameKey={g.key} size={22} /></span>
                  <span className="tx"><b>{g.name}</b><small>{g.done ? 'Played' : (g.time || ' ')}</small></span>
                </a>
              ))}
            </div>
          </div>
        ) : null}
        {quizPicks.length ? (
          <div className="sst-shelf">
            <div className="sst-shd2"><b>Quizzes to try</b><a href="/quizzes">All quizzes</a></div>
            <div className="sst-kpq">
              {quizPicks.map((q) => (
                <a key={q.id} href={q.href} className="sst-kpc q">
                  <span className="tx"><b>{q.title}</b><small>{q.label}</small></span>
                  <span className="ar" aria-hidden="true">&rarr;</span>
                </a>
              ))}
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );

  // ── WHO'S NEXT TO PASS and THE EASIEST POINTS LEFT (owner, 2026-11-03) ───
  // The picks come from the day board (lib: daily-combined `stand.picks`):
  // expected points per minute, never a puzzle most players don't finish or
  // one that runs past 10 minutes. Run parts are left out (a run is not a
  // quick play), and so is anything played today.
  const liveBy = new Map((allGames || []).map((g) => [g.key, g]));
  const usable = (list) => (list || []).filter((p) => p && p.key !== s.gameKey && !RUN_OF.has(p.key) && liveBy.has(p.key) && !liveBy.get(p.key).done)
    .map((p) => ({ ...p, g: liveBy.get(p.key) }));
  const dayPicks = usable(stand.dayPicks);
  const catPicks = usable(stand.catPicks);
  const dayRow = standRows ? standRows.find((r) => r.id === 'day') : null;
  const catRow = standRows ? standRows.find((r) => r.id === 'cat') : null;
  // THE NEXT PLAY IS LIKE THIS ONE (owner, 2026-11-04: "people playing Jig
  // would not play Defend"). Every quick, finishable pick from the day and the
  // category is scored on how close it is to the puzzle just played: the same
  // primary skill counts most, then each shared skill, then the same category.
  // The ease order from the server (expected points per minute) only breaks
  // ties, so the easiest points still win among equally close games, and a
  // game with nothing in common is offered only when nothing closer is left.
  const curTags = SKILL_TAGS[s.gameKey] || [];
  const curCat = (DAILY_GAME_MAP[s.gameKey] && DAILY_GAME_MAP[s.gameKey].cat) || null;
  const pool = [];
  const seen = new Set();
  [...dayPicks.map((p) => ({ ...p, from: 'day' })), ...catPicks.map((p) => ({ ...p, from: 'cat' }))].forEach((p, i) => { if (!seen.has(p.key)) { seen.add(p.key); pool.push({ ...p, ease: i }); } });
  const affinity = (p) => {
    const t = SKILL_TAGS[p.key] || [];
    const shared = t.filter((x) => curTags.includes(x));
    const sameCat = !!curCat && p.g.cat === curCat;
    const score = (t[0] && t[0] === curTags[0] ? 3 : 0) + 2 * shared.length + (sameCat ? 2 : 0);
    const sk = shared.length ? SKILL_MAP[shared[0]] : null;
    const nm = s.gameName || 'this one';
    const why = sk ? `${sk.short || sk.name}, like ${nm}` : sameCat ? `${curCat}, like ${nm}` : 'Easiest points left';
    const whyLong = sk ? `Trains ${sk.name.toLowerCase()}, like ${nm}${sameCat ? `, and it is another ${curCat} puzzle` : ''}.`
      : sameCat ? `Another ${curCat} puzzle, like ${nm}.` : 'Nothing closer to this one is left today, and these are the quickest points.';
    // Short tags for the Play Next cards (owner, 2026-11-05, direction B).
    const tags = sk ? [sk.short || sk.name, `Like ${nm}`, p.g.cat] : sameCat ? [`Like ${nm}`, p.g.cat] : ['Easiest points left', p.g.cat];
    return { score, why, whyLong, tags };
  };
  const ranked = pool.map((p) => ({ ...p, ...affinity(p) })).sort((a, b) => b.score - a.score || a.ease - b.ease);
  const mainPick = ranked[0] || null;
  const catPick = ranked.find((p) => p !== mainPick && p.g.cat === curCat) || null;
  const otherPick = catPick || ranked.find((p) => p !== mainPick) || null;
  // A pick's `after` is a rank on the board it came from: All today, or the
  // category today for a pick only the category read offered.
  const passLine = (p) => {
    const row = p && p.from === 'cat' ? catRow : dayRow;
    if (!p || !row) return '';
    const where = p.from === 'cat' && curCat ? `${curCat} today` : 'All today';
    const head = `A typical finish (~${p.pts} ${p.pts === 1 ? 'pt' : 'pts'})`;
    if (!p.after || p.after >= row.rank) return `${head} adds to your day in ${where}.`;
    if (row.next && p.pts >= row.next.gap) return `${head} passes ${row.next.name} and moves you to about #${p.after} in ${where}.`;
    return `${head} moves you to about #${p.after} in ${where}.`;
  };
  // The same read as passLine, in parts, for the Play Next rank ladder.
  const passInfo = (p) => {
    const row = p && p.from === 'cat' ? catRow : dayRow;
    if (!p || !row) return null;
    const where = p.from === 'cat' && curCat ? `${curCat} today` : 'All today';
    const moves = !!p.after && p.after < row.rank;
    const passes = moves && row.next && p.pts >= row.next.gap ? row.next.name : null;
    return { from: row.rank, to: moves ? p.after : null, where, passes };
  };
  const small = [];
  if (otherPick) {
    const nx = otherPick === catPick && catRow && catRow.next && otherPick.pts >= catRow.next.gap ? `passes ${catRow.next.name}` : `${otherPick.mins} min \u00b7 ~${otherPick.pts} pts`;
    small.push({ title: `Play ${otherPick.g.name}`, sub: `${otherPick.g.cat} \u00b7 ${nx}`, href: otherPick.g.href });
  }
  // The Challenge button ("GIFs at right") is gone (owner, 2026-11-03); the GIFs keep their own card.
  const playNode = mainPick || small.length ? (
    <PassPlay main={mainPick ? { key: mainPick.key, name: mainPick.g.name, href: mainPick.g.href, mins: mainPick.mins, why: mainPick.why, line: passLine(mainPick) } : null} small={small} />
  ) : null;
  const passNode = standRows ? <PassCard rows={standRows} wide={desk} /> : null;
  // PLAY NEXT, desktop (owner, 2026-11-04): with the standings up in the band,
  // the row below is three big picks, each with the game's own description,
  // why it is suggested and what a typical finish would do for you today.
  const nextList = ranked.slice(0, 3);
  const nextCards = nextList.length ? (
    <div className="sst-nx">
      <div className="sst-sl">Play Next</div>
      <div className="sst-nxl">
        {nextList.map((p, i) => {
          const d = DAILY_GAME_MAP[p.key] || {};
          const fx = passInfo(p);
          const base = categoryColor(p.g.cat);
          return (
            <a key={p.key} className={'sst-nxc' + (i === 0 ? ' main' : '')} href={p.g.href}
              style={{ '--nxp': softGround(base), '--nxl': softGround(base, 0.62) }}>
              <span className="hd">
                <span className="gl"><GameGlyph gameKey={p.key} size={20} /></span>
                <span className="nm"><b>Play {p.g.name}</b><small>{p.mins} min &middot; {p.finish}% finish</small></span>
                <span className="pt"><b>+{p.pts}</b><i>pts</i></span>
              </span>
              {fx ? (
                <span className="ld">
                  {fx.to ? (<><span className="r fr">#{fx.from}</span><svg width="22" height="14" viewBox="0 0 22 14" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M1 7h18M14 2l5 5-5 5" /></svg><span className="r">#{fx.to}</span></>)
                    : <span className="r">#{fx.from}</span>}
                  <small>{fx.where}{fx.passes ? <><br />passes <em>{fx.passes}</em></> : fx.to ? null : <><br />adds to your day</>}</small>
                </span>
              ) : null}
              {d.tagLong || d.tag ? <span className="ds">{d.tagLong || d.tag}</span> : null}
              {p.tags && p.tags.length ? <span className="tg">{p.tags.map((t) => <span key={t}>{t}</span>)}</span> : null}
            </a>
          );
        })}
      </div>
    </div>
  ) : null;
  // The standing GIF's caption: the day, and what this puzzle moved.
  const standCaption = dayRow ? `#${dayRow.rank} of ${dayRow.of.toLocaleString('en-US')} today.${dayRow.up ? ` Up ${dayRow.up} with ${s.gameName || 'this puzzle'}.` : ''}` : null;
  const ezList = desk ? dayPicks.slice(0, 5) : [];

  // ── 2-5. THE CARDS ─────────────────────────────────────────────────────
  const rankCard = (s.rows && s.rows.length) || s.gameKey ? (
        <section className={'sst-card sst-rk ' + on(4)}>
          <div className="sst-rkb">
            {(scope === 'cat' || scope === 'day') && standRows && standRows.find((r) => r.id === scope) ? (() => {
              const sr = standRows.find((r) => r.id === scope);
              return (
                <>
                  {boardHead(`${sr.lab} \u00b7 ${sr.of.toLocaleString('en-US')} ${sr.of === 1 ? 'player' : 'players'}`)}
                  <table className="sst-tbl"><tbody>
                    {sr.board.map((r, i) => (r.gap ? (
                      <tr key={'g' + i} className="gap"><td colSpan={3}>&middot;&middot;&middot;</td></tr>
                    ) : (
                      <tr key={(r.name || '') + r.rank + i} className={r.me ? 'me' : undefined}>
                        <td className="p">#{r.rank}</td>
                        <td className="w">{r.me ? 'You' : (r.name || 'Guest')}</td>
                        <td className="st">{r.fig}</td>
                      </tr>
                    )))}
                  </tbody></table>
                  <div className="sst-wysf">{sr.foot}</div>
                </>
              );
            })() : scope === 'all' ? (
              <>
                {boardHead(`All-time board${allTime && allTime.field ? ` · ${allTime.field} ${allTime.field === 1 ? 'player' : 'players'}` : ''}`)}
                {allTime ? (
                  <div ref={fillRef} className={desk ? 'sst-tfill' : undefined} style={desk ? { minHeight: allRows(allTime).length * rowH } : undefined}>
                  <table className="sst-tbl"><tbody>
                    {allRows(allTime, desk ? fitN : 5).map((r, i) => (r.empty ? (
                      <tr key={'e' + i} className="empty"><td className="p">#{r.rank}</td><td className="w">Empty</td><td className="st">—</td></tr>
                    ) : r.gap ? (
                      <tr key={'g' + i} className="gap"><td colSpan={3}>&middot;&middot;&middot;</td></tr>
                    ) : (
                      <tr key={(r.username || '') + r.rank + i} className={r.me ? 'me' : undefined}>
                        <td className="p">#{r.rank}</td>
                        <td className="w">{r.me ? 'You' : (r.username || 'Guest')}</td>
                        <td className="st">{Math.round(Number(r.points) || 0)} pts</td>
                      </tr>
                    )))}
                  </tbody></table>
                  </div>
                ) : (
                  <table className="sst-tbl sst-tbl-empty" aria-hidden="true"><tbody>
                    {[1, 2, 3, 4, 5].map((n) => (
                      <tr key={n}><td className="p">#{n}</td><td className="w" /><td className="st">—</td></tr>
                    ))}
                  </tbody></table>
                )}
              </>
            ) : s.rows && s.rows.length ? (
              <>
                {boardHead(`${s.boardLabel || 'Today’s board'}${s.field ? ` · ${s.field} ${s.field === 1 ? 'player' : 'players'}` : ''}`)}
                <div ref={fillRef} className={desk ? 'sst-tfill' : undefined} style={desk ? { minHeight: padRows(s.rows).length * rowH } : undefined}>
                <table className="sst-tbl"><tbody>
                  {(desk ? fillRows(s.rows, s.allTop, fitN) : padRows(s.rows)).map((r, i) => (r.empty ? (
                    <tr key={'e' + i} className="empty"><td className="p">#{r.rank}</td><td className="w">Empty</td><td className="st">—</td></tr>
                  ) : r.gap ? (
                    <tr key={'g' + i} className="gap"><td colSpan={3}>&middot;&middot;&middot;</td></tr>
                  ) : (
                    <tr key={(r.username || '') + r.rank + i} className={r.me ? 'me' : undefined}>
                      <td className="p">#{r.rank}</td>
                      <td className="w">{r.me ? 'You' : (r.username || 'Guest')}</td>
                      <td className="st">{gameStats(r, s.missLabel, s.gameKey) || '—'}</td>
                    </tr>
                  )))}
                </tbody></table>
                </div>
              </>
            ) : (
              /* EMPTY SLOTS WHILE THE BOARD LOADS (owner, 2026-10-26): the card
                 holds its place, so the challenge card beside it never starts on
                 the left and jumps right when the rows land. The group board
                 gets no slots; it opens when it arrives. */
              <>
                {boardHead(s.boardLabel || 'Today’s board')}
                <table className="sst-tbl sst-tbl-empty" aria-hidden="true"><tbody>
                  {[1, 2, 3, 4, 5].map((n) => (
                    <tr key={n}><td className="p">#{n}</td><td className="w" /><td className="st">—</td></tr>
                  ))}
                </tbody></table>
              </>
            )}
          </div>
          {s.gameKey ? <div className="sst-grp"><FinishGroupLine gameKey={s.gameKey} gameName={s.gameName} missLabel={s.missLabel} promo={desk} onData={setGrp} /></div> : null}
        </section>
      ) : null;
  const chalCard = chal || share ? (
        <section className={'sst-card sst-ch ' + on(4)}>
          {chal ? (
            <button type="button" className="sst-chal" onClick={chal.onSend}>
              <span className="tx">
                <b>{chal.title}</b>
                <i>{chalSub}</i>
              </span>
              <span className="ar" aria-hidden="true">{chal.copied ? '✓' : '→'}</span>
            </button>
          ) : null}
          {share ? (
            <button type="button" className="sst-shr" onClick={share.onClick}>
              <span className="tx">
                <b>{share.label}</b>
                <i>{share.sub || 'Your result, no spoilers'}</i>
              </span>
              <span className="ar" aria-hidden="true">{share.label === 'Copied' ? '✓' : '→'}</span>
            </button>
          ) : null}
          {meme && meme.ctx ? <div className="sst-gif" id="sst-gifs"><MemeStack ctx={meme.ctx} onOpen={meme.onOpen} standing={standCaption} /></div> : null}
        </section>
      ) : null;
  // THE GIF RAIL (owner, 2026-11-03, desktop): with the side rail present the
  // challenge and the three GIFs take the rail, and the sheet's challenge slot
  // lists the easiest points left instead.
  const gifRail = (chal || (meme && meme.ctx)) ? (
    <div className={'sst-rail sst-grail' + (phase !== 'show' ? ' in' : '')}>
      <div className="sst-rh"><b>Send a GIF</b><span>tap one to share</span></div>
      <div className="sst-rs" id="sst-rail-gifs">
        {chal ? (
          <button type="button" className="sst-chal" onClick={chal.onSend}>
            <span className="tx"><b>{chal.title}</b><i>{chalSub}</i></span>
            <span className="ar" aria-hidden="true">{chal.copied ? '\u2713' : '\u2192'}</span>
          </button>
        ) : null}
        {share ? (
          <button type="button" className="sst-shr" onClick={share.onClick}>
            <span className="tx"><b>{share.label}</b><i>{share.sub || 'Your result, no spoilers'}</i></span>
            <span className="ar" aria-hidden="true">{share.label === 'Copied' ? '\u2713' : '\u2192'}</span>
          </button>
        ) : null}
        {meme && meme.ctx ? <div className="sst-gif"><MemeStack ctx={meme.ctx} onOpen={meme.onOpen} standing={standCaption} /></div> : null}
      </div>
    </div>
  ) : null;
  const ezCard = ezList.length ? (
    <section className={'sst-card sst-ch sst-ez ' + on(4)}>
      <div className="sst-sl">Easiest Points Left</div>
      {ezList.map((p) => railRow({ key: p.key, name: p.g.name, href: p.g.href }, `${p.g.cat} \u00b7 ${p.mins} min \u00b7 ${p.finish}% finish \u00b7 ~${p.pts} pts`))}
    </section>
  ) : null;
  const railGifs = !!(desk && rail && gifRail);
  const runLink = run ? (
            <a className="sst-run" href={run.href}>
              <span className="top">
                <span className="tx"><small>{run.eyebrow}</small><b>{run.title}</b></span>
                <span className="ar" aria-hidden="true">→</span>
              </span>
              <span className="pips" aria-hidden="true">
                {run.pips.map((p) => <s key={p.k} className={p.now ? 'now' : p.done ? 'd' : ''} />)}
              </span>
              <span className="ft">
                <span className="sb">{run.sub}</span>
                {run.next ? <span className="go">Play {run.next} next</span> : null}
              </span>
            </a>
          ) : null;
  const shelfNode = shelf && shelf.games && shelf.games.length ? (
            <div className="sst-shelf">
              <div className="sst-shd2"><b>More {shelf.cat} puzzles</b>{shelf.total ? <span>{shelf.n} of {shelf.total} played</span> : null}</div>
              <div className="sst-tiles">
                {shelf.games.map((g) => (
                  <a key={g.key} href={g.href} className={'sst-tile' + (g.done ? ' done' : '')}>
                    <span className="gl"><GameGlyph gameKey={g.key} size={28} /></span>
                    <b>{g.name}</b>
                    <small>{g.done ? 'Played' : (g.time || ' ')}</small>
                  </a>
                ))}
              </div>
            </div>
          ) : null;
  const catsNode = cats && cats.length ? (
            <div className="sst-shelf">
              <div className="sst-shd2"><b>Every category</b></div>
              <div className="sst-cats">
                {cats.map((c) => (
                  <a key={c.name} href={c.href} className="sst-catc" style={{ '--cc': c.bg }}>
                    <span className="n">{c.n}/{c.total}</span>{c.name}
                  </a>
                ))}
              </div>
            </div>
          ) : null;
  const recordCard = (s.streak || s.allTime || s.set || (s.recent && s.recent.length)) ? (
        <section className={'sst-card sst-st ' + on(6)}>
          <div className="sst-sl">{s.gameName ? `You and ${s.gameName}` : 'Your record'}</div>
          {(s.streak || s.allTime || s.set) ? (
            <div className="sst-figs">
              {s.streak ? <div><b>{s.streak}</b><i>day streak</i></div> : null}
              {s.allTime ? <div><b>{s.allTime.value}</b><i>{s.allTime.label || 'all time'}</i></div> : null}
              {s.set ? <div><b>{s.set.n}<small>/{s.set.total}</small></b><i>{s.set.name}</i></div> : null}
            </div>
          ) : null}
          {s.recent && s.recent.length ? (
            <div className="sst-runs">
              {s.recent.map((r) => (
                <a key={r.num} href={r.href} className={r.won ? 'w' : 'l'}>
                  <span>{r.date}</span><b>{r.fig}</b>
                </a>
              ))}
            </div>
          ) : null}
          <div className="sst-links">
            {s.catHref ? <a href={s.catHref}>All {s.catName} puzzles</a> : null}
            <a href={s.homeHref || '/'}>All daily puzzles</a>
          </div>
        </section>
      ) : null;

  // WHO'S NEXT TO PASS LEADS THE SHEET (owner, 2026-11-05, direction C): one
  // big next play with its Start, six more picks under it, and the run, the
  // challenge and the GIF beside it. The right rail folds away.
  const moveOf = (p) => { const fx = passInfo(p); return fx && fx.to ? `#${fx.from} \u2192 #${fx.to}` : (p.g.cat || ''); };
  const nextC = mainPick ? (() => {
    const fx = passInfo(mainPick);
    const d = DAILY_GAME_MAP[mainPick.key] || {};
    const head = fx && fx.passes ? `Pass ${fx.passes} in ${fx.where}` : fx && fx.to ? `Up to #${fx.to} in ${fx.where}` : mainPick.why;
    const more = ranked.slice(1, 7);
    return (
      <section className={'sst-card sst-nc ' + on(3)}>
        <div className="sst-ncm">
          <div className="sst-sl">Who&rsquo;s Next to Pass</div>
          <a className="sst-ncb" href={mainPick.g.href} style={{ '--nxp': softGround(categoryColor(mainPick.g.cat)) }}>
            <span className="tx">
              <small>{head}</small>
              <b>Play {mainPick.g.name}</b>
              <span className="ds">{[d.tagLong || d.tag, mainPick.mins ? `${mainPick.mins} min` : null, mainPick.finish != null ? `${mainPick.finish}% finish` : null].filter(Boolean).join(' \u00b7 ')}</span>
            </span>
            <span className="rt">
              <b>+{mainPick.pts}</b>
              {fx && fx.to ? <em>#{fx.from} &rarr; #{fx.to}</em> : null}
              <span className="go">Start</span>
            </span>
          </a>
          {more.length ? (
            <div className="sst-ncl">
              {more.map((p) => (
                <a key={p.key} href={p.g.href} className="sst-ncr">
                  <span className="nm"><b>{p.g.name}</b>{p.mins ? <small> {p.mins} min</small> : null}</span>
                  <span className="mv">{moveOf(p)}</span>
                  <b className="pt">+{p.pts}</b>
                </a>
              ))}
            </div>
          ) : null}
        </div>
        <div className="sst-ncs">{runLink}{chalCard}</div>
      </section>
    );
  })() : null;

  const cards = (
    <div className={'sst-cards' + (nextC ? ' sst-cC' : '')}>
      {nextC}
      {/* WHO'S NEXT TO PASS and the next play (owner, 2026-11-03) */}
      {nextC ? null : desk && standRows && nextCards ? <section className={'sst-card sst-pass ' + on(3)}>{nextCards}</section>
        : desk && (passNode || playNode) ? <section className={'sst-card sst-pass ' + on(3)}>{passNode}{playNode}</section> : null}

      {/* 2. RANKINGS */}
      {rankCard}

      {/* 3. CHALLENGE, with the GIF itself on show. Crux also keeps its
          emoji result grid as a plain text Share (owner, 2026-10-26: a Crux
          player reported the board could no longer be shared once the
          one-page ending replaced the old door grid). With the GIF rail
          on, the rail carries it and this slot lists the easiest points. */}
      {nextC ? null : chalCard}

      {/* 4. PLAY NEXT */}
      <section className={'sst-card sst-pn ' + on(5)}>
        {nextC ? null : <div className="sst-sl">Play next</div>}
        <div className="sst-acts">
          {nextC ? null : runLink}
          {(similar || another) ? (
            <div className={'sst-row' + (similar && another ? '' : ' one')}>
              {similar ? (
                <a className="sst-ob pri" href={similar.href} onClick={similar.onClick || undefined}>
                  <span className="g">{similar.key ? <GameGlyph gameKey={similar.key} size={24} /> : null}</span>
                  <span className="t"><b>Play similar</b><i>{similar.name}{similar.time ? <small> · {similar.time}</small> : null}</i></span>
                </a>
              ) : null}
              {another ? (
                <a className="sst-ob" href={another.href}>
                  <span className="g">{another.key ? <GameGlyph gameKey={another.key} size={24} /> : null}</span>
                  <span className="t"><b>Play another</b><i>{another.name}</i></span>
                </a>
              ) : null}
            </div>
          ) : null}
        </div>
        {desk ? keepPlaying : (
          <>
          {shelfNode}
          {catsNode}
          </>
        )}
        {allHref ? <a className="sst-all" href={allHref}>See all Daily Puzzles</a> : null}
      </section>

      {/* 5. FULL STATS, at the bottom */}
      {recordCard}
    </div>
  );

  const toneCls = (tone ? ' t-' + tone : '') + (inkLight ? ' ink-l' : '');

  // THE PHONE: the rolling ending (app/StageRoll.jsx, owner 2026-10-28). The
  // colour is the page; the message, then the stats, roll up into one result
  // bar, and what stays on screen is Play next and the Challenge. Always the
  // category pastel, a loss included: Fail gets no colour of its own.
  if (!desk) {
    const replayProps = retry ? { onReplay: retry.onReplay }
      : replayNow ? (replayNow.href
        ? { replayHref: replayNow.href, onReplay: replayNow.onClick || null }
        : { onReplay: (e) => { if (onLeave) onLeave(); if (replayNow.onClick) replayNow.onClick(e); } })
      : {};
    return createPortal((
      <div ref={rootRef} className={'sst' + (inkLight ? ' ink-l' : '')} role="dialog" aria-modal="true" aria-label={`${eyebrow}: ${verdict}`}>
        <style dangerouslySetInnerHTML={{ __html: CSS }} />
        <StageRoll
          eyebrow={eyebrow} verdict={verdict} metric={metric} self={self} rankHead={rankHead} go={go}
          gameKey={s.gameKey} gameName={s.gameName} grp={grp}
          statsNode={resultStats(true)} rankNode={rankCard} recordNode={recordCard} chalNode={chalCard}
          runNode={runLink} shelfNode={shelfNode} catsNode={catsNode} allHref={allHref}
          similar={similar} another={another} archive={archive} curISO={curISO}
          onShowBoard={back} showBoardLabel={s.backLabel && s.backLabel !== 'Back to board' ? s.backLabel : 'Show Board'}
          retry={retry} homeHref={allHref || '/'}
          standRows={standRows} beatRows={beatRows} standGo={standGo} noCount={noCount}
          passNode={passNode} playNode={playNode}
          {...replayProps}
        />
      </div>
    ), host);
  }

  // THE DESKTOP: the in-page ending, plus the full-screen colour over it until
  // it pulls back onto the band.
  return (
    <>
      <div ref={inlineRef} className={'sst-page sst-pc' + toneCls + (phase === 'inline' ? ' in' : phase === 'retract' ? ' rt' : '')}>
        <style dangerouslySetInnerHTML={{ __html: CSS }} />
        <div className="sst-band" ref={heroRef}>{bandC(phase === 'inline')}</div>
        {cards}
      </div>
      {/* The rail folds away while the ending is up (direction C). */}
      {rail ? createPortal(<div className="sst-fold" aria-hidden="true" />, rail) : null}
      {phase !== 'inline' ? createPortal((
        <div ref={rootRef} className={'sst sst-cover' + toneCls + (phase === 'retract' ? ' go' : '') + (beatRows ? ' wys-on' : '')}
          style={clip ? { clipPath: clip, WebkitClipPath: clip } : undefined}
          onClick={bgTap} role="dialog" aria-modal="true" aria-label={`${eyebrow}: ${verdict}`}>
          <style dangerouslySetInnerHTML={{ __html: CSS }} />
          <div className="sst-in sst-cin">
            {result(true)}
            {beatRows ? (
              <div className="sst-wys">
                <StandBeat rows={beatRows} wide noCount={noCount}
                  delay={Math.max(0, BEAT_AT_MS - ((standGoAt.current || 0) - (mountAt.current || 0)))} />
              </div>
            ) : null}
          </div>
        </div>
      ), host) : null}
    </>
  );
}

const CSS = `
/* THE COLOUR IS THE SOFT STEP (owner, 2026-10-25): the same 40%-lighter
   pastel the phone pages use (--sp-g, set by the boot script), and on a page
   without one the category step mixed 40% toward white. Dark ink on every one. */
.sst,.sst-page{--sst-bg:var(--sp-g,color-mix(in srgb,var(--stg-acc) 60%,#ffffff));--sst-ink:#08222e;
  --sst-card:color-mix(in srgb,var(--sst-bg) 58%,#ffffff);--sst-rule:color-mix(in srgb,var(--sst-ink) 14%,transparent);
  --sst-wash:color-mix(in srgb,#ffffff 55%,transparent);font-family:${SANS};-webkit-tap-highlight-color:transparent;}
.sst.ink-l,.sst-page.ink-l{--sst-card:color-mix(in srgb,var(--sst-bg) 82%,#000000);--sst-wash:color-mix(in srgb,#ffffff 12%,transparent);}
.sst.t-lost,.sst-page.t-lost{--sst-bg:color-mix(in srgb,var(--stg-bad) 13%,var(--stg-raise));--sst-ink:var(--stg-ink);--wys-chip-tx:var(--stg-raise,#ffffff);}
.sst{position:fixed;inset:0;z-index:9000;height:100vh;height:100dvh;overflow-y:auto;overscroll-behavior:contain;
  background:var(--sst-bg);color:var(--sst-ink);}
/* THE WHITE STRIP (owner report, 2026-10-25): iOS Safari can leave a band of
   the game page showing above a fixed layer pinned to top:0 once the toolbar
   has moved. The phone layer reaches well past both edges, padded back, so
   no part of the page under it can show. */
.sst:not(.sst-cover){top:-160px;bottom:-160px;height:auto;padding:160px 0;}
.sst *,.sst-page *{box-sizing:border-box;}
.sst-in{width:100%;max-width:560px;margin:0 auto;display:flex;flex-direction:column;gap:16px;
  padding:max(10px,env(safe-area-inset-top)) max(14px,env(safe-area-inset-right)) max(30px,env(safe-area-inset-bottom)) max(14px,env(safe-area-inset-left));}
.sst-top{display:flex;align-items:center;gap:12px;padding:2px 2px 0;}
.sst-tb{display:inline-flex;align-items:center;gap:4px;height:36px;padding:0 12px;border:1px solid var(--sst-ink);border-radius:99px;
  color:var(--sst-ink);font-size:13px;font-weight:800;text-decoration:none;}
.sst-brand{color:var(--sst-ink);font-size:16px;font-weight:800;text-decoration:none;}
.sst-hero{display:flex;flex-direction:column;gap:18px;padding:6px 8px 4px;}
.sst-h2{display:flex;flex-direction:column;gap:18px;}
/* A block that has not landed yet takes NO taps (2026-10-24, player report: a
   tap meant to hurry the screen hit a link that was still invisible). */
.sst-b{opacity:0;transform:translateY(10px);pointer-events:none;transition:opacity .3s ease,transform .3s cubic-bezier(.2,.8,.2,1);}
.sst-b.on{opacity:1;transform:none;pointer-events:auto;}
.sst section,.sst-page section{min-width:0;}
.sst-eb{font-size:12px;font-weight:800;letter-spacing:.14em;text-transform:uppercase;}
.sst-v{font-size:clamp(36px,11vw,46px);font-weight:800;letter-spacing:-.035em;line-height:1.02;margin-top:6px;}
.sst-m{display:flex;align-items:baseline;gap:10px;flex-wrap:wrap;margin-top:8px;}
.sst-m b{font-size:clamp(46px,14vw,62px);font-weight:800;letter-spacing:-.04em;line-height:1;font-variant-numeric:tabular-nums;}
.sst-m i{font-style:normal;font-size:15px;font-weight:700;}
.sst-cnt{display:inline-grid;}
.sst-cnt > span{grid-area:1/1;white-space:nowrap;}
.sst-cnt-hold{visibility:hidden;}
.sst-hbs{display:flex;gap:8px;margin-top:14px;}
.sst-hb{flex:1;max-width:200px;height:40px;display:flex;align-items:center;justify-content:center;padding:0 14px;border:1px solid var(--sst-ink);border-radius:12px;
  background:transparent;color:var(--sst-ink);font:inherit;font-size:14px;font-weight:800;text-decoration:none;cursor:pointer;white-space:nowrap;}
.sst-hb:hover{background:var(--sst-wash);}
.sst-arc{display:flex;align-items:center;justify-content:space-between;gap:10px;max-width:408px;min-height:46px;margin-top:8px;padding:0 16px;border-radius:12px;
  background:var(--sst-ink);color:var(--sst-bg);font-size:14.5px;font-weight:800;text-decoration:none;}
.sst-arc:hover{filter:brightness(1.12);}
.sst-arc:focus-visible{outline:2px solid var(--sst-ink);outline-offset:3px;}
.sst-lab{font-size:11.5px;font-weight:800;letter-spacing:.13em;text-transform:uppercase;}
.sst-hl{font-size:clamp(18px,5vw,22px);font-weight:800;letter-spacing:-.015em;line-height:1.22;margin-top:6px;overflow-wrap:anywhere;}
.sst-sub{font-size:14px;font-weight:700;line-height:1.4;margin-top:8px;}
.sst-bar{position:relative;height:10px;border-radius:99px;margin-top:12px;overflow:hidden;
  background:color-mix(in srgb,var(--sst-ink) 20%,transparent);}
.sst-bar span{position:absolute;left:0;top:0;bottom:0;border-radius:99px;background:var(--sst-ink);transition:width 1.1s cubic-bezier(.2,.8,.2,1);}
.sst-caps{display:flex;justify-content:space-between;gap:12px;margin-top:7px;font-size:12.5px;font-weight:700;}
.sst-caps span{min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;padding-bottom:.16em;margin-bottom:-.16em;}
.sst-track{position:relative;height:84px;margin:12px 12px 0;}
.sst-track .ln{position:absolute;left:0;right:0;top:38.5px;height:3px;border-radius:3px;background:color-mix(in srgb,var(--sst-ink) 28%,transparent);}
.sst-track .pt{position:absolute;top:0;bottom:0;width:0;opacity:0;transition:opacity .4s ease;}
.sst-track .pt.on{opacity:1;}
.sst-track .pt.today{transition-delay:.15s;}
.sst-track .pt.best{transition-delay:.3s;}
.sst-track .pt s{position:absolute;top:34px;left:-6px;width:12px;height:12px;border-radius:50%;background:var(--sst-bg);border:3px solid var(--sst-ink);}
.sst-track .pt.today s{top:30px;left:-10px;width:20px;height:20px;background:var(--sst-ink);}
.sst-track .lb{position:absolute;top:55px;left:0;transform:translateX(-50%);display:flex;flex-direction:column;align-items:center;white-space:nowrap;line-height:1.2;}
.sst-track .pt.today .lb{top:0;}
.sst-track .pt.first .lb{transform:none;left:-6px;align-items:flex-start;}
.sst-track .pt.last .lb{transform:translateX(-100%);left:6px;align-items:flex-end;}
.sst-track.two{height:112px;}
.sst-track .lb.r2{top:83px;}
.sst-track .lb em{font-style:normal;font-size:10.5px;font-weight:800;letter-spacing:.1em;text-transform:uppercase;}
.sst-track .lb small{font-size:13px;font-weight:800;font-variant-numeric:tabular-nums;}
.sst-strip{display:flex;gap:7px;margin-top:14px;}
.sst-strip s{flex:1;max-width:38px;height:30px;border-radius:7px;opacity:0;transform:scale(.6);
  transition:opacity .3s ease,transform .3s cubic-bezier(.3,1.6,.5,1);}
.sst-strip s.on{opacity:1;transform:none;}
.sst-strip s.w{background:var(--sst-ink);}
.sst-strip s.l{border:2.5px solid var(--sst-ink);}
.sst-strip s.now{box-shadow:0 0 0 3px var(--sst-bg),0 0 0 5px var(--sst-ink);}

/* WHERE YOU STAND (app/WhereYouStand.jsx) takes this surface's colours, read
   where it sits, so the band's pastel and the sheet's page ink both carry. */
.sst .wys-host,.sst .wys-card,.sst-page .wys-rows,.sst-page .wys-card{--wys-ink:var(--sst-ink);--wys-bg:var(--sst-bg);--wys-card:var(--sst-card);--wys-wash:var(--sst-wash);}
.sst-wys{margin-top:34px;}
.sst-cover.wys-on .sst-h2{display:none;}
.sst-cover.wys-on .sst-cin{padding-top:max(36px,calc(50vh - 380px));}
.sst-wysf{font-size:12.5px;font-weight:700;margin:8px 6px 0;opacity:.8;}
.sst .wys-pass,.sst .wys-pp,.sst-page .wys-pass,.sst-page .wys-pp{--wys-ink:var(--sst-ink);--wys-bg:var(--sst-bg);--wys-card:var(--sst-card);--wys-wash:var(--sst-wash);}
.sst-page .sst-pass{grid-column:1 / -1;display:flex;flex-direction:column;gap:14px;}
.sst-page .sst-pass .wys-pass{padding:0;}
.sst-band .sst-bandwys .wys-pass{--wys-ink:var(--sst-ink);--wys-wash:var(--sst-wash);}
.sst-nxl{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:12px;margin-top:10px;}
.sst-nxc{display:flex;flex-direction:column;gap:12px;min-width:0;padding:16px;border-radius:16px;border:1px solid var(--sst-ink);color:var(--sst-ink);text-decoration:none;transition:transform .15s;}
.sst-nxc.main{background:var(--sst-ink);color:var(--sst-bg);}
.sst-nxc:hover{transform:translateY(-2px);}
.sst-nxc:not(.main):hover{background:color-mix(in srgb,var(--sst-ink) 4%,transparent);}
.sst-nxc:focus-visible{outline:2px solid var(--sst-ink);outline-offset:2px;}
.sst-nxc .hd{display:flex;align-items:center;gap:11px;min-width:0;}
.sst-nxc .gl{flex:none;width:40px;height:40px;border-radius:11px;display:flex;align-items:center;justify-content:center;background:var(--nxp);color:#08222e;border:1px solid var(--sst-ink);}
.sst-nxc.main .gl{border-color:var(--sst-bg);}
.sst-nxc .nm{display:flex;flex-direction:column;gap:1px;flex:1;min-width:0;}
.sst-nxc .nm b{font-size:18px;font-weight:800;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}
.sst-nxc .nm small{font-size:12.5px;font-weight:700;opacity:.7;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;padding-bottom:.16em;margin-bottom:-.16em;}
.sst-nxc .pt{flex:none;display:flex;flex-direction:column;align-items:flex-end;line-height:1;}
.sst-nxc .pt b{font-size:26px;font-weight:800;font-variant-numeric:tabular-nums;}
.sst-nxc .pt i{font-style:normal;font-size:10.5px;font-weight:800;letter-spacing:.1em;text-transform:uppercase;opacity:.7;margin-top:3px;}
.sst-nxc .ld{display:flex;align-items:center;gap:10px;padding:10px 12px;border-radius:12px;background:var(--nxl);color:#08222e;}
.sst-nxc .ld .r{font-size:20px;font-weight:800;font-variant-numeric:tabular-nums;}
.sst-nxc .ld .r.fr{opacity:.45;}
.sst-nxc .ld svg{flex:none;}
.sst-nxc .ld small{flex:1;min-width:0;font-size:12.5px;font-weight:700;line-height:1.3;text-align:right;}
.sst-nxc .ld small em{font-style:normal;font-weight:800;}
.sst-nxc .ds{font-size:14px;font-weight:600;line-height:1.42;}
.sst-nxc .tg{display:flex;gap:6px;flex-wrap:wrap;margin-top:auto;}
.sst-nxc .tg span{display:inline-flex;align-items:center;height:22px;padding:0 9px;border-radius:99px;font-size:11.5px;font-weight:800;white-space:nowrap;background:color-mix(in srgb,var(--sst-ink) 7%,transparent);}
.sst-nxc.main .tg span{background:color-mix(in srgb,var(--sst-bg) 14%,transparent);}
@media (prefers-reduced-motion:reduce){ .sst-nxc{transition:none;} }
@container (max-width:699px){ .sst-nxl{grid-template-columns:minmax(0,1fr);} }
@container (min-width:700px){ .sst-page .sst-pass .wys-pp{display:grid;grid-template-columns:minmax(0,1fr) minmax(0,1fr);align-items:stretch;} .sst-page .sst-pass .wys-sm{grid-template-columns:minmax(0,1fr);} }
.sst-grail{--sst-ink:var(--stg-ink,#0b0d12);--sst-bg:var(--sp-g,#b1e5fd);}
.sst-grail .sst-rs{display:flex;flex-direction:column;gap:12px;}
.sst-grail .sst-gif{margin-top:0;}
.sst-ez .sst-rr{margin:0;}
.sst-band .wys-rows{margin-top:10px;}

/* THE CARDS: a quieter step of the colour, no shadow, ink text. */
.sst-cards{display:flex;flex-direction:column;gap:12px;}
.sst-card{background:var(--sst-card);color:var(--sst-ink);border-radius:18px;padding:16px;}
.sst-sl{font-size:11.5px;font-weight:800;letter-spacing:.12em;text-transform:uppercase;margin-bottom:9px;opacity:.82;}
.sst-page .sst-rkb{display:flex;flex-direction:column;}
.sst-tfill{position:relative;flex:1 1 auto;overflow:hidden;}
.sst-tfill > .sst-tbl{position:absolute;left:0;right:0;top:0;}
.sst-bh{display:flex;align-items:baseline;justify-content:space-between;gap:10px;}
.sst-bh .sst-sl{min-width:0;}
.sst-scope{flex:none;display:flex;gap:10px;margin-bottom:9px;}
.sst-scope button{border:0;background:none;padding:0 0 2px;font:inherit;font-size:11.5px;font-weight:700;color:var(--sst-ink);opacity:.5;cursor:pointer;
  border-bottom:1.5px solid transparent;border-radius:0;}
.sst-scope button.on{opacity:1;font-weight:800;border-bottom-color:currentColor;}
.sst-scope button:hover{opacity:.85;}
.sst-scope button:focus-visible{outline:2px solid var(--sst-ink);outline-offset:2px;}
/* SEPARATE borders, spacing 0 (owner, 2026-10-27: the You bubble looked
   notched against the rows above). In the collapsed model a cell background
   stops short of its shared border and border-radius is ignored, so the wash
   read as a squared, inset box under the rounded names. */
.sst-tbl{width:100%;border-collapse:separate;border-spacing:0;font-size:14.5px;}
.sst-tbl td{padding:9px 6px;border-top:1px solid var(--sst-rule);}
.sst-tbl tr:first-child td{border-top:0;}
.sst-tbl .p{width:48px;font-weight:800;}
.sst-tbl .w{font-weight:700;max-width:0;width:40%;min-width:84px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;}
.sst-tbl .st{text-align:right;font-weight:800;font-variant-numeric:tabular-nums;font-size:13.5px;line-height:1.25;}
.sst-tbl tr.me td{background:var(--sst-wash);border-top-color:transparent;}
.sst-tbl tr.me td:first-child{border-radius:10px 0 0 10px;}
.sst-tbl tr.me td:last-child{border-radius:0 10px 10px 0;}
.sst-tbl tr.me + tr td{border-top-color:transparent;}
.sst-tbl tr.gap td{text-align:center;padding:2px;opacity:.6;}
.sst-grp:not(:empty){margin-top:12px;padding-top:12px;border-top:1px solid var(--sst-rule);}
.sst-tbl-empty td{opacity:.42;}
.sst-tbl-empty .w::before{content:"";display:inline-block;width:60%;height:.7em;border-radius:4px;background:var(--sst-rule);vertical-align:middle;}
/* The group line is the one read that lands seconds after everything else, so
   it OPENS rather than appearing: a jump of a whole table pushed every card
   under it down at once (owner, 2026-10-25: "jitters"). */
.sst-grp:not(:empty){display:grid;grid-template-rows:1fr;animation:sstgrp .45s cubic-bezier(.2,.7,.3,1) both;}
.sst-grp:not(:empty)>*{min-height:0;overflow:hidden;}
@keyframes sstgrp{from{grid-template-rows:0fr;opacity:0;margin-top:0;padding-top:0;border-top-color:transparent;}}
@media (prefers-reduced-motion:reduce){.sst-grp:not(:empty){animation:none;}}
.sst-grp .stf-eb{font-size:11.5px;font-weight:800;letter-spacing:.12em;text-transform:uppercase;color:inherit;opacity:.82;margin-bottom:8px;}
.sst-grp .fgl-card{background:transparent;border:0;padding:0;}
.sst-grp .fgl,.sst-grp .fgl *{color:var(--sst-ink);}
.sst-grp .fgl-r{border-top-color:var(--sst-rule);}
/* THE GROUP ROWS SIT IN THE SAME GUTTER AS THE BOARD ROWS ABOVE (owner,
   2026-10-26: the 15 touched the right edge). The base .me row bleeds 8px
   past its column, and .sst-grp clips its children, so the wash was cut off
   flush with the text. Here every row is inset 6px, like the table cells. */
.sst-grp .fgl-r{padding:7px 6px;}
.sst-grp .fgl-r.me{background:var(--sst-wash);margin:0;padding:7px 6px;border-radius:10px;}
.sst-grp .fgl-av0{background:var(--sst-rule);}
.sst-grp .fgl-r.empty .n,.sst-grp .fgl-r.empty .s{color:var(--sst-ink);opacity:.55;}
.sst-grp .fgl .fgl-pbtn{background:var(--sst-ink);color:var(--sst-bg);}
.sst-grp .fgl .fgl-pbtn *{color:var(--sst-bg);}
.sst-grp .fgl-mini{background:var(--sst-wash);border-color:var(--sst-rule);}
.sst-chal{display:flex;align-items:center;gap:12px;width:100%;min-height:64px;padding:11px 16px 11px 18px;border:0;border-radius:14px;
  background:var(--sst-ink);color:var(--sst-bg);font:inherit;text-align:left;cursor:pointer;}
.sst-chal .tx{display:flex;flex-direction:column;gap:3px;min-width:0;flex:1;}
.sst-chal b{font-size:17px;font-weight:800;line-height:1.2;}
.sst-chal i{font-style:normal;font-size:12.5px;font-weight:700;line-height:1.3;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;padding-bottom:.16em;margin-bottom:-.16em;}
.sst-chal .ar{flex:none;font-size:22px;font-weight:800;}
.sst-shr{display:flex;align-items:center;gap:12px;width:100%;min-height:56px;padding:10px 16px 10px 18px;border:1.5px solid var(--sst-ink);border-radius:14px;
  background:transparent;color:var(--sst-ink);font:inherit;text-align:left;cursor:pointer;}
.sst-chal + .sst-shr{margin-top:10px;}
.sst-shr .tx{display:flex;flex-direction:column;gap:3px;min-width:0;flex:1;}
.sst-shr b{font-size:16px;font-weight:800;line-height:1.2;}
.sst-shr i{font-style:normal;font-size:12.5px;font-weight:700;line-height:1.3;}
.sst-shr .ar{flex:none;font-size:20px;font-weight:800;}
.sst-shr:hover{filter:brightness(1.08);}
.sst-shr:focus-visible{outline:2px solid var(--sst-ink);outline-offset:3px;}
.sst-gif{margin-top:12px;}
.sst-gif .msh-peek{box-shadow:none;margin:0;}
.sst-acts{display:flex;flex-direction:column;gap:10px;}
.sst-run{position:relative;display:flex;flex-direction:column;gap:9px;padding:12px 16px 12px 18px;border-radius:16px;overflow:hidden;
  background:var(--sst-ink);color:var(--sst-bg);text-decoration:none;}
.sst-run::after{content:"";position:absolute;top:0;bottom:0;left:-60%;width:40%;pointer-events:none;transform:skewX(-18deg);
  background:linear-gradient(100deg,transparent,color-mix(in srgb,var(--sst-bg) 16%,transparent),transparent);animation:sst-shine 2.8s ease-in-out 1.2s infinite;}
@keyframes sst-shine{0%{left:-60%}45%,100%{left:130%}}
.sst-run .top{display:flex;align-items:center;gap:10px;}
.sst-run .tx{display:flex;flex-direction:column;gap:2px;min-width:0;flex:1;}
.sst-run small{font-size:10.5px;font-weight:800;letter-spacing:.13em;text-transform:uppercase;}
.sst-run b{font-size:19px;font-weight:800;line-height:1.15;letter-spacing:-.01em;}
.sst-run .ar{flex:none;font-size:22px;font-weight:800;}
.sst-run .pips{display:flex;gap:4px;}
.sst-run .pips s{flex:1;height:8px;border-radius:3px;background:color-mix(in srgb,var(--sst-bg) 22%,transparent);}
.sst-run .pips s.d,.sst-run .pips s.now{background:var(--sst-bg);}
.sst-run .ft{display:flex;align-items:center;justify-content:space-between;gap:10px;}
.sst-run .sb{font-size:12.5px;font-weight:700;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;padding-bottom:.16em;margin-bottom:-.16em;}
.sst-run .go{flex:none;border-radius:99px;padding:6px 12px;background:var(--sst-bg);color:var(--sst-ink);font-size:13px;font-weight:800;white-space:nowrap;}
.sst-row{display:grid;grid-template-columns:1fr 1fr;gap:10px;}
.sst-row.one{grid-template-columns:1fr;}
.sst-ob{display:flex;align-items:center;gap:10px;min-width:0;min-height:60px;padding:9px 12px;border-radius:14px;
  border:1px solid var(--sst-ink);color:var(--sst-ink);text-decoration:none;}
.sst-ob.pri{background:var(--sst-ink);color:var(--sst-bg);}
.sst-ob .g{flex:none;display:flex;}
.sst-ob .g:empty{display:none;}
.sst-ob .t{display:flex;flex-direction:column;gap:2px;min-width:0;}
.sst-ob b{font-size:15.5px;font-weight:800;line-height:1.2;}
.sst-ob i{font-style:normal;font-size:12.5px;font-weight:700;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;padding-bottom:.16em;margin-bottom:-.16em;}
.sst-ob i small{font-size:11.5px;font-weight:700;}
.sst-shelf{margin-top:16px;}
.sst-shd2{display:flex;align-items:baseline;justify-content:space-between;gap:10px;margin-bottom:10px;}
.sst-shd2 b{font-size:15px;font-weight:800;}
.sst-shd2 span{font-size:12.5px;font-weight:800;opacity:.82;}
.sst-tiles{display:flex;gap:6px;overflow-x:auto;scrollbar-width:none;margin:0 -16px;padding:0 16px 2px;}
.sst-tiles::-webkit-scrollbar{display:none;}
.sst-tile{flex:none;width:84px;display:flex;flex-direction:column;align-items:center;gap:5px;text-decoration:none;color:var(--sst-ink);text-align:center;}
.sst-tile .gl{width:58px;height:58px;border-radius:16px;background:var(--sst-wash);display:flex;align-items:center;justify-content:center;}
.sst-tile b{font-size:12.5px;font-weight:800;line-height:1.2;max-width:100%;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;}
.sst-tile small{font-size:11px;font-weight:700;opacity:.82;}
.sst-tile.done .gl{opacity:.45;}
.sst-tile:hover .gl{filter:brightness(1.06);}
.sst-cats{display:flex;gap:6px;overflow-x:auto;scrollbar-width:none;margin:0 -16px;padding:0 16px;}
.sst-cats::-webkit-scrollbar{display:none;}
.sst-catc{flex:none;display:inline-flex;align-items:center;gap:7px;height:36px;padding:0 13px 0 6px;border-radius:99px;
  background:var(--cc);color:#08222e;font-size:13px;font-weight:800;text-decoration:none;white-space:nowrap;}
.sst-catc .n{min-width:24px;height:24px;padding:0 5px;border-radius:99px;background:#ffffff;display:inline-flex;align-items:center;justify-content:center;font-size:11px;}
.sst-all{display:flex;align-items:center;justify-content:center;min-height:46px;margin-top:16px;border-radius:13px;background:var(--sst-wash);
  color:var(--sst-ink);font-size:14.5px;font-weight:800;text-decoration:none;}
.sst-figs{display:flex;gap:8px;flex-wrap:wrap;}
.sst-figs > div{flex:1 1 90px;min-width:0;background:var(--sst-wash);border-radius:12px;padding:10px 12px;display:flex;flex-direction:column;gap:2px;}
.sst-figs b{font-size:22px;font-weight:800;line-height:1.1;font-variant-numeric:tabular-nums;}
.sst-figs b small{font-size:14px;opacity:.75;}
.sst-figs i{font-style:normal;font-size:12px;font-weight:700;opacity:.82;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;padding-bottom:.16em;margin-bottom:-.16em;}
.sst-runs{display:grid;grid-template-columns:repeat(auto-fill,minmax(88px,1fr));gap:8px;margin-top:12px;}
.sst-runs a{display:flex;flex-direction:column;gap:2px;padding:9px 11px;border-radius:10px;background:var(--sst-wash);color:var(--sst-ink);text-decoration:none;min-width:0;}
.sst-runs a span{font-size:11.5px;font-weight:700;opacity:.82;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;padding-bottom:.16em;margin-bottom:-.16em;}
.sst-runs a b{font-size:16px;font-weight:800;font-variant-numeric:tabular-nums;}
.sst-runs a.l b{opacity:.6;}
.sst-links{display:flex;flex-wrap:wrap;gap:6px 22px;margin-top:14px;}
.sst-links a{color:var(--sst-ink);font-size:13.5px;font-weight:800;text-decoration:underline;text-underline-offset:3px;}
.sst-chal:hover,.sst-ob:hover,.sst-run:hover{filter:brightness(1.08);}
.sst-chal:focus-visible,.sst-ob:focus-visible,.sst-hb:focus-visible,.sst-run:focus-visible,.sst-tb:focus-visible,.sst-all:focus-visible{outline:2px solid var(--sst-ink);outline-offset:3px;}

/* DESKTOP. The cover holds the result at display size, centred. */
.sst-cover{overflow:hidden;cursor:pointer;transition:clip-path ${RETRACT_MS}ms cubic-bezier(.7,0,.2,1),-webkit-clip-path ${RETRACT_MS}ms cubic-bezier(.7,0,.2,1);}
/* Anchored from the TOP at about where the finished result centres, never
   centred live: centred, every figure that filled in underneath nudged the
   verdict up the screen (owner, 2026-10-25: "jitters"). */
.sst-cin{min-height:100%;max-width:720px;justify-content:flex-start;padding:max(40px,calc(50vh - 340px)) 40px 40px;}
.sst-cover .sst-v{font-size:clamp(56px,7vw,96px);}
.sst-cover .sst-m b{font-size:clamp(60px,6vw,84px);}
.sst-cover .sst-hl{font-size:24px;}
.sst-cover .sst-cin{transition:opacity .3s ease;}
/* THE COVER IS LEFT-ALIGNED like the in-page band it fades into (owner,
   2026-10-31: reverted the 2026-10-30 centred cover from 51ba941d4). Do not
   centre the cover's hero again without asking. */
.sst-cover.go .sst-cin{opacity:0;}
/* The in-page ending: hidden under the cover, revealed when it pulls back.
   DIRECTION B (owner, 2026-10-26: "too disjointed" with the page around it).
   One sheet made of the page's own materials: the raised surface with the 2px
   ink rule and 12px corners the rails and buttons wear, the category colour
   only on the result band across its top. No pastel cards on a pastel ground;
   the sections inside are divided by rules, not boxed. */
.sst-page{color:var(--sst-ink);width:100%;max-width:1240px;margin:14px auto 28px;display:flex;flex-direction:column;gap:0;padding:0;
  visibility:hidden;container-type:inline-size;background:var(--stg-raise,#fff);border:1px solid var(--stg-ink,#0b0d12);border-radius:12px;overflow:hidden;}
.sst-page.in{visibility:visible;}
/* THE HAND-OFF IS ONE MOVE (owner, 2026-10-26: "make sure the animations still
   work in harmony"). While the colour pulls back, the sheet and its band are
   already there underneath with the result on them, so the cover's verdict
   fades into the band's own copy rather than into an empty frame; the sections
   below the band then rise in once the colour has gone, as before. */
.sst-page.rt{visibility:visible;}
.sst-page.rt .sst-band .sst-b{opacity:1;transform:none;transition:opacity .35s ease .15s;}
.sst-band{background:var(--sst-bg);border-radius:0;padding:22px 26px;border-bottom:1px solid var(--stg-ink,#0b0d12);}
.sst-band .sst-hero{padding:0;}
/* Below the band the sheet speaks the page's ink, not the pastel's. */
.sst-page .sst-cards{--wys-chip-tx:var(--stg-raise,#ffffff);--sst-ink:var(--stg-ink,#0b0d12);--sst-bg:var(--stg-raise,#fff);--sst-rule:var(--stg-line,#e2e5ea);
  --sst-wash:color-mix(in srgb,var(--sp-g,#b1e5fd) 45%,var(--stg-raise,#fff));--sst-card:transparent;color:var(--stg-ink,#0b0d12);
  display:grid;grid-template-columns:minmax(0,1fr);gap:0;align-items:stretch;}
.sst-page .sst-card{background:transparent;border-radius:0;padding:18px 20px;border-top:2px solid var(--stg-line,#e2e5ea);}
.sst-page .sst-cards > .sst-card:first-child{border-top:0;}
/* The record moves to the game page's You and Archive tabs on desktop. */
.sst-page .sst-st{display:none;}
.sst-page .sst-tbl tr.empty td{opacity:.5;font-weight:600;}
/* Two across from 700px: the board beside the group, the challenge under. */
@container (min-width:700px){
  .sst-band .sst-hero{display:grid;grid-template-columns:minmax(0,1fr) minmax(0,1fr);gap:28px;align-items:start;}
  .sst-page .sst-rk{display:grid;grid-template-columns:minmax(0,1fr) minmax(0,1fr);column-gap:0;padding:0;}
  .sst-page .sst-rk > *{padding:18px 20px;min-width:0;}
  .sst-page .sst-rk > .sst-grp:not(:empty){margin:0;padding:18px 20px;border-top:0;border-left:2px solid var(--stg-line,#e2e5ea);}
  .sst-page .sst-rk:has(> .sst-grp:empty),.sst-page .sst-rk:not(:has(> .sst-grp)){grid-template-columns:minmax(0,1fr);}
  .sst-page .sst-ch{display:grid;grid-template-columns:minmax(0,1fr) minmax(0,1fr);gap:16px;align-items:start;}
  .sst-page .sst-ch .sst-gif{margin-top:0;}
}
/* Three across from 1000px: board, group, challenge, as in the mock-up. */
@container (min-width:1000px){
  .sst-page .sst-cards{grid-template-columns:repeat(3,minmax(0,1fr));}
  .sst-page .sst-rk{grid-column:span 2;}
  .sst-page .sst-ch{grid-column:span 1;display:block;border-top:0;border-left:2px solid var(--stg-line,#e2e5ea);}
  .sst-page .sst-ch .sst-gif{margin-top:12px;}
  .sst-page .sst-pn{grid-column:1 / -1;}
}
/* KEEP PLAYING: categories, then more puzzles beside quizzes. */
.sst-kp{margin:18px -20px -18px;padding:16px 20px 20px;border-top:1px solid var(--stg-ink,#0b0d12);background:color-mix(in srgb,var(--stg-ink,#0b0d12) 3%,var(--stg-raise,#fff));
  display:flex;flex-direction:column;gap:14px;}
.sst-kph{display:flex;align-items:baseline;justify-content:space-between;gap:12px;}
.sst-kph b{font-size:20px;font-weight:800;letter-spacing:-.01em;}
.sst-kph span{font-size:12.5px;font-weight:700;opacity:.75;}
.sst-kpg{display:grid;grid-template-columns:minmax(0,3fr) minmax(0,2fr);gap:16px;align-items:start;}
.sst-kpg.one{grid-template-columns:minmax(0,1fr);}
.sst-kp .sst-shelf{margin-top:0;}
.sst-shd2 a{font-size:12.5px;font-weight:800;color:inherit;}
.sst-kpt{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:8px;}
.sst-kpq{display:flex;flex-direction:column;gap:8px;}
.sst-kpc{display:flex;align-items:center;gap:9px;min-width:0;padding:9px 11px;border:1px solid var(--stg-ink,#0b0d12);border-radius:12px;
  background:var(--stg-raise,#fff);color:var(--stg-ink,#0b0d12);text-decoration:none;}
.sst-kpc .gl{flex:none;width:30px;height:30px;border-radius:8px;background:var(--sst-wash);display:flex;align-items:center;justify-content:center;}
.sst-kpc .tx{display:flex;flex-direction:column;min-width:0;flex:1;}
.sst-kpc b{font-size:14px;font-weight:800;line-height:1.2;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;padding-bottom:.16em;margin-bottom:-.16em;}
.sst-kpc small{font-size:11.5px;font-weight:700;opacity:.72;}
.sst-kpc.done{opacity:.55;}
.sst-kpc .ar{flex:none;font-weight:800;}
.sst-kpc:hover{background:var(--sst-wash);}
.sst-kpc:focus-visible{outline:2px solid var(--stg-ink,#0b0d12);outline-offset:2px;}
@container (max-width:999px){ .sst-kpt{grid-template-columns:repeat(2,minmax(0,1fr));} }
@container (max-width:699px){ .sst-kpg{grid-template-columns:minmax(0,1fr);} }
/* THE RIGHT RAIL FOLDS AWAY while the ending is up (direction B): the
   ending takes the stage, and it carries the boards the rail would repeat. */
/* UP NEXT: the rail's own tabs step aside while the ending holds it. */
html.lc-on .lc-side:has(> .sst-rail) > :not(.sst-rail){display:none !important;}
.sst-rail{font-family:${SANS};color:var(--stg-ink,#0b0d12);opacity:0;transform:translateY(8px);
  transition:opacity .45s ease .25s,transform .45s cubic-bezier(.2,.8,.2,1) .25s;}
.sst-rail.in{opacity:1;transform:none;}
.sst-rh{display:flex;align-items:baseline;justify-content:space-between;gap:10px;padding:12px 14px;border-bottom:1px solid var(--stg-ink,#0b0d12);}
.sst-rh b{font-size:17px;font-weight:800;letter-spacing:-.01em;}
.sst-rh span{font-size:12px;font-weight:700;opacity:.75;}
.sst-rs{padding:12px 14px 10px;border-top:1.5px solid color-mix(in srgb,var(--stg-ink,#0b0d12) 14%,transparent);}
.sst-rh + .sst-rs{border-top:0;}
.sst-rl{display:flex;align-items:baseline;justify-content:space-between;gap:8px;margin-bottom:6px;font-size:10.5px;font-weight:800;letter-spacing:.09em;text-transform:uppercase;}
.sst-rl span,.sst-rl a{font-size:11px;letter-spacing:0;text-transform:none;font-weight:700;color:inherit;opacity:.75;}
.sst-rr{display:flex;align-items:center;gap:9px;min-width:0;padding:6px 6px;margin:0 -6px;border-radius:9px;color:inherit;text-decoration:none;}
.sst-rr:hover{background:color-mix(in srgb,var(--stg-ink,#0b0d12) 6%,transparent);}
.sst-rr:focus-visible{outline:2px solid var(--stg-ink,#0b0d12);outline-offset:1px;}
.sst-rr .gl{flex:none;width:28px;height:28px;border-radius:8px;background:color-mix(in srgb,var(--sp-g,var(--stg-acc,#c9d2fd)) 55%,#ffffff);display:flex;align-items:center;justify-content:center;color:#08222e;}
.sst-rr .tx{display:flex;flex-direction:column;min-width:0;flex:1;}
.sst-rr b{font-size:13.5px;font-weight:800;line-height:1.25;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;}
.sst-rr small{font-size:11.5px;font-weight:600;opacity:.72;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;}
.sst-rr .ar{flex:none;font-weight:800;opacity:.8;}
.sst-rr.done{opacity:.55;}
.sst-rhold{height:180px;}
.sst-rc{display:flex;flex-wrap:wrap;gap:6px;}
.sst-rc .sst-catc{height:30px;font-size:12px;padding:0 10px 0 4px;}
.sst-rc .sst-catc .n{min-width:22px;height:22px;font-size:10.5px;}
@media (prefers-reduced-motion: reduce){.sst-rail{transition:none;}}
.sst-page .sst-tiles,.sst-page .sst-cats{flex-wrap:wrap;overflow:visible;margin:0;padding:0;}
.sst-page .sst-gif .msh-peek img{max-height:300px;}
.sst-page:not(.in) .sst-b{opacity:0;}
.sst-page.in .sst-card{animation:sst-up .5s cubic-bezier(.2,.8,.2,1) both;}
.sst-page.in .sst-cards > section:nth-child(2){animation-delay:.12s;}
.sst-page.in .sst-cards > section:nth-child(3){animation-delay:.24s;}
.sst-page.in .sst-cards > section:nth-child(4){animation-delay:.36s;}
@keyframes sst-up{from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:none}}
/* While the one-page ending is on, it IS the finish: the older band, doors and
   drawers StageFinish draws stay mounted (their reads still run) but hidden. */
.stf:has(> .sst-page) > :not(.sst-page):not(style):not(.msh):not(.msh-scrim){display:none !important;}

@media (prefers-reduced-motion:reduce){
  .sst-b,.sst-bar span,.sst-track .pt,.sst-strip s,.sst-cover,.sst-cover .sst-cin{transition:none;}
  .sst-run::after{animation:none;}
  .sst-page.in .sst-card{animation:none;}
}
/* ── ENDING DIRECTION C (owner, 2026-11-05): a slim result band, the next play
   leading the sheet, the rail folded away. ── */
html.lc-on .lc-side:has(> .sst-fold){display:none !important;}
html.lc-on:has(.lc-side > .sst-fold) .lc-host{padding-right:22px !important;}
html.lc-on:has(.lc-side > .sst-fold) .lc-host .stg-fg{padding-right:20px;}
.sst-page.sst-pc{max-width:1500px;}
.sst-band .sst-hero.sst-hc{display:flex !important;flex-direction:row;align-items:center;gap:28px;}
.sst-hc .sst-h1{flex:none;}
.sst-hc .sst-vm{display:flex;align-items:baseline;gap:16px;margin-top:4px;}
.sst-hc .sst-v{font-size:40px;margin:0;}
.sst-hc .sst-mc{font-size:40px;font-weight:800;letter-spacing:-.035em;line-height:1.02;font-variant-numeric:tabular-nums;}
.sst-hc .sst-ml{font-style:normal;font-size:14px;font-weight:700;}
.sst-hc .sst-bandwys,.sst-hc .sst-hsp{flex:1;min-width:0;}
.sst-hc .wys-pass .wys-sl{display:none;}
.sst-hc .wys-pass.band .wys-pl{flex-direction:row;gap:10px;}
.sst-hc .wys-pass.band .wys-pr{flex:1 1 0;min-width:0;padding:9px 12px 10px;}
.sst-hc .wys-pass.band .wys-ph{display:grid;grid-template-columns:minmax(0,1fr) auto;row-gap:4px;align-items:center;}
.sst-hc .wys-pass.band .wys-chip{justify-self:start;max-width:100%;}
.sst-hc .wys-pass.band .wys-ph .wys-pt{grid-column:1 / -1;grid-row:2;}
.sst-hc .wys-pass.band .wys-prk{grid-column:2;grid-row:1;}
.sst-hc .wys-pass.band .wys-pb{margin-top:7px;}
.sst-hc .wys-pass.band .wys-pk{height:6px;}
.sst-hc .sst-hl3{flex:none;display:flex;flex-direction:column;align-items:flex-end;gap:7px;}
.sst-hc .sst-tl{background:none;border:0;padding:0;font:inherit;font-size:13.5px;font-weight:800;color:var(--sst-ink);cursor:pointer;text-decoration:none;white-space:nowrap;}
.sst-hc .sst-tl:hover{text-decoration:underline;text-underline-offset:3px;}
.sst-hc .sst-tl:focus-visible{outline:2px solid var(--sst-ink);outline-offset:2px;}
.sst-page .sst-cards.sst-cC{grid-template-columns:minmax(0,1fr) !important;}
.sst-page .sst-cards.sst-cC > section{grid-column:1 / -1 !important;}
.sst-page .sst-cC .sst-rk{grid-template-columns:minmax(0,2fr) minmax(0,1fr);}
.sst-page .sst-nc{display:grid;grid-template-columns:minmax(0,2fr) minmax(0,1fr);padding:0;}
.sst-ncm{padding:18px 20px;min-width:0;}
.sst-ncs{padding:18px 20px;border-left:2px solid var(--stg-line,#e2e5ea);display:flex;flex-direction:column;gap:12px;min-width:0;}
.sst-page .sst-ncs > .sst-card{padding:0;border:0;display:block;animation:none;}
.sst-page .sst-ncs .sst-gif{margin-top:12px;}
.sst-ncb{display:grid;grid-template-columns:minmax(0,1fr) auto;gap:24px;align-items:center;margin-top:10px;padding:18px 20px;border:2px solid var(--sst-ink);
  border-radius:16px;color:var(--sst-ink);text-decoration:none;background:var(--stg-raise,#fff);transition:background .15s;}
.sst-ncb:hover{background:color-mix(in srgb,var(--nxp) 35%,var(--stg-raise,#fff));}
.sst-ncb:focus-visible{outline:2px solid var(--sst-ink);outline-offset:2px;}
.sst-ncb .tx{display:flex;flex-direction:column;gap:3px;min-width:0;}
.sst-ncb .tx small{font-size:13px;font-weight:700;opacity:.75;}
.sst-ncb .tx b{font-size:32px;font-weight:800;letter-spacing:-.02em;line-height:1.12;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;padding-bottom:.08em;}
.sst-ncb .ds{font-size:14px;font-weight:600;line-height:1.4;}
.sst-ncb .rt{display:flex;flex-direction:column;align-items:center;gap:4px;}
.sst-ncb .rt > b{font-size:38px;font-weight:800;line-height:1;font-variant-numeric:tabular-nums;}
.sst-ncb .rt em{font-style:normal;font-size:13px;font-weight:800;white-space:nowrap;}
.sst-ncb .go{margin-top:8px;background:var(--sst-ink);color:var(--stg-raise,#fff);border-radius:10px;padding:10px 26px;font-size:15px;font-weight:800;}
.sst-ncl{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));column-gap:28px;margin-top:14px;}
.sst-ncr{display:grid;grid-template-columns:minmax(0,1fr) auto auto;gap:14px;align-items:baseline;padding:10px 0;border-top:1px solid var(--stg-line,#e2e5ea);
  color:var(--sst-ink);text-decoration:none;font-size:14px;}
.sst-ncr .nm{min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;}
.sst-ncr b{font-weight:800;}
.sst-ncr small{font-size:12.5px;font-weight:600;opacity:.7;}
.sst-ncr .mv{font-size:12.5px;font-weight:700;opacity:.75;white-space:nowrap;}
.sst-ncr:hover .nm b{text-decoration:underline;text-underline-offset:3px;}
@container (max-width:999px){
  .sst-page .sst-nc,.sst-page .sst-cC .sst-rk{grid-template-columns:minmax(0,1fr);}
  .sst-ncs{border-left:0;border-top:2px solid var(--stg-line,#e2e5ea);}
  .sst-band .sst-hero.sst-hc{flex-wrap:wrap;}
}

`;
