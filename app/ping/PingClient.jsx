'use client';

// Ping — the daily city hunt.
//
// One secret world city a day, no clues. Type any well-known city and each
// guess pings back one number: the great-circle distance in miles to the secret
// city. Keep guessing (there's no limit) and home in until you land on it. Two
// outcomes only: you GET THE CITY or you GIVE UP. Score is out of 10 - getting
// the city scores 6-10 (fewer guesses = higher), giving up scores 1-5 by how
// close your best guess got. Getting it always outranks giving up; the daily
// board ranks by score, then guesses, then time. One free hint reveals the
// continent (unregistered players).
//
// Same daily plumbing as Circa/Span: banked cities gated by Eastern date on the
// server (app/ping/page.js), per-puzzle localStorage saves, /ping?p=N archive
// pinning, streaks + stats, and the shared /api/quiz/* board flow. Sundays hide
// a trickier, more out-of-the-way city. The full guessable atlas lives in
// lib/ping-cities.js; only TODAY's answer city ships to the browser.

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useSearchParams } from 'next/navigation';
import { HelpCircle, X, Lightbulb, Eye, Smartphone, MapPin, Search } from 'lucide-react';
import Grain from '../Grain';
import DailyRules from '../DailyRules';
import Footer from '../Footer';
import useDuelContext, { DuelBanner } from '../quiz/[id]/useDuelContext';
import JoinLeaderboardForm from '../quiz/[id]/JoinLeaderboardForm';
import DailyGamesGrid from '../DailyGamesGrid';
import DailyEndCard from '../DailyEndCard';
import DailyChrome from '../DailyChrome';
import DailyBoardPanel from '../quiz/[id]/DailyBoardPanel';
import { isMobileDevice } from '@/lib/is-mobile';
import useAbandonFlush from '../quiz/[id]/useAbandonFlush';
import { CITIES, findCity, suggestCities, citiesInCountry, haversineMiles, continentOf, normCity } from '@/lib/ping-cities';
import { withRef } from '@/lib/referrals';
import { notifyShareCredit } from '../ShareCreditPop';
import DailyMasthead from '../DailyMasthead';
import ReportIssue from '../ReportIssue';
import StageFold from '../StageFold';
import LoftCap from '../LoftCap';
import StageChrome from '../StageChrome';
import { isStage } from '@/lib/stage';
import { useStageTheme } from '@/lib/stage-theme';
import { gameColor, gameColorLight, RAMP_INK, STAGE_GROUND, gameOnrampLight, gameAccentInkLight } from '@/lib/category-ramp';
import GamePanel from '../GamePanel';
import useIqStanding from '../useIqStanding';
import useNextUnplayed, { useUnplayedSimilar } from '../useNextUnplayed';
import useDailyBoard from '../useDailyBoard';
import useGameAllTime from '../useGameAllTime';
import useDayStats from '../useDayStats';
import useCategoryRank from '../useCategoryRank';
import LoftFinish from '../LoftFinish';
import { CONTEST, contestIsLive } from '@/lib/contest';
import { isLoft } from '@/lib/loft';
import { hintAllowed, spendHint } from '@/lib/hint-gate';
import { T } from '@/lib/theme';
import { meRequest } from '@/app/quizMeClient';

const COLORS = {
  cream: T.surface,
  paper: T.paper,
  ink: T.ink,
  ember: T.accent,
  rust: T.danger,
  faded: T.muted,
  accent: '#0284c7',       // Ping identity — signal/ocean azure
  accentSoft: '#e0f2fe',
  accentDeep: '#075985',
  green: T.successDeep,        // found it
  greenSoft: '#eefaf1',
};
// The arm-then-confirm controls do not move when armed, so the second tap of
// an accidental double-tap used to land on the armed state long before the
// label change could be read. A confirm this fast was never a decision.
const ARM_MIN_MS = 400;
const SANS = "'Manrope', system-ui, -apple-system, sans-serif";
const MONO = "'DM Mono', ui-monospace, 'SFMono-Regular', monospace";
const PAPER = '#fbf9f4';
const HELP_KEY = 'sot_ping_help_seen';
const UNIT_KEY = 'sot_ping_unit';
const STATS_KEY = 'sot_ping_stats';

// heat bands by distance in miles (after the win check at dist === 0)
const BANDS = [
  { max: 200, key: 'hot', label: 'within 200 mi', color: '#9a3d0c', bg: '#ffedd5', border: 'rgba(234,88,12,0.55)', sq: '\u{1F7E7}' },
  { max: 750, key: 'warm', label: 'within 750 mi', color: '#92610b', bg: '#fef3c7', border: 'rgba(217,119,6,0.5)', sq: '\u{1F7E8}' },
  { max: 2500, key: 'cool', label: 'within 2,500 mi', color: '#0a1730', bg: '#dbeafe', border: 'rgba(14,29,64,0.45)', sq: '\u{1F7E6}' },
  { max: Infinity, key: 'cold', label: 'over 2,500 mi', color: '#475569', bg: '#e2e8f0', border: 'rgba(71,85,105,0.4)', sq: '⬜' },
];
const bandOf = (mi) => BANDS.find((b) => mi <= b.max);

// THE BANDS ARE A HUE ON THE STAGE, not a pastel (owner, 2026-08-31). Each
// band's paper is hardcoded light (#fef3c7 and friends), which is correct on
// cream and unreadable on the dark register, where the row's own type is
// var(--stg-ink). So on the stage the band names a THEME TOKEN instead --
// those flip per register, unlike a literal -- and the fill is mixed out of
// it over var(--stg-raise), the one background that is opaque in both.
const STAGE_HUE = { hot: 'var(--stg-bad)', warm: 'var(--stg-warn)', cool: 'var(--stg-cool)', cold: 'var(--stg-mute)' };
function bandSkin(b, stage) {
  if (!stage) return { bg: b.bg, border: b.border, color: b.color };
  const h = STAGE_HUE[b.key] || 'var(--stg-acc-ink)';
  return {
    bg: `color-mix(in srgb, ${h} 13%, var(--stg-raise))`,
    border: `color-mix(in srgb, ${h} 48%, transparent)`,
    color: h,
  };
}
const fmtMi = (mi) => mi.toLocaleString('en-US');

// Distance is computed, banded, and scored in MILES everywhere (haversineMiles,
// BANDS, PROX_MILES). Kilometres are a display-layer conversion only, so a
// player's unit choice can never change their score or their heat band.
const KM_PER_MI = 1.609344;
const toKm = (mi) => Math.round(mi * KM_PER_MI);
const fmtDistIn = (mi, unit) =>
  unit === 'km' ? `${toKm(mi).toLocaleString('en-US')} km` : `${fmtMi(mi)} mi`;
const unitWord = (unit) => (unit === 'km' ? 'kilometers' : 'miles');

// Score is out of 10. Two outcomes: you GET THE CITY (6-10, fewer guesses is
// higher, a first-guess find is a perfect 10) or you GIVE UP (1-5 by how close
// your best guess got, within 100 mi = 5). The worst solve (6) still beats the
// best give-up (5), so getting the city always ranks above quitting.
const TOTAL = 10;
const PROX_MILES = [100, 500, 1500, 4000]; // give-up bands -> 5,4,3,2 (else 1)
function proximityScore(mi) {
  if (mi == null) return 0;
  for (let i = 0; i < PROX_MILES.length; i++) if (mi <= PROX_MILES[i]) return 5 - i;
  return 1;
}
const getScore = (n) => Math.max(6, 11 - n);

const isIosDevice = () =>
  typeof navigator !== 'undefined' &&
  (/iPad|iPhone|iPod/.test(navigator.userAgent || '') ||
    (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1));

function etToday() {
  try { return new Date().toLocaleDateString('en-CA', { timeZone: 'America/New_York' }); }
  catch (e) { return new Date().toISOString().slice(0, 10); }
}
function pickPuzzle(puzzles, forceNum) {
  if (forceNum) { const p = puzzles.find((x) => x.num === forceNum); if (p) return p; }
  const today = etToday();
  const open = puzzles.filter((p) => p.live <= today);
  return open.length ? open[open.length - 1] : puzzles[0];
}
function fmtTime(ms) {
  const s = Math.max(0, Math.round(ms / 1000));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
}
function msToMidnightET() {
  try {
    const now = new Date();
    const et = new Date(now.toLocaleString('en-US', { timeZone: 'America/New_York' }));
    const next = new Date(et);
    next.setHours(24, 0, 0, 0);
    return next - et;
  } catch (e) {
    const now = new Date();
    const next = new Date(now);
    next.setHours(24, 0, 0, 0);
    return next - now;
  }
}
function fmtCountdown(ms) {
  const s = Math.max(0, Math.floor(ms / 1000));
  return `${Math.floor(s / 3600)}:${String(Math.floor((s % 3600) / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;
}
function getAnonId() {
  if (typeof window === 'undefined') return null;
  try {
    let a = localStorage.getItem('sot_quiz_anon');
    if (!a) {
      a = (window.crypto && crypto.randomUUID) ? crypto.randomUUID() : `a_${Date.now()}_${Math.random().toString(36).slice(2)}`;
      localStorage.setItem('sot_quiz_anon', a);
    }
    return a;
  } catch (e) { return null; }
}
const EMPTY_BOARD = { plays: 0, best: null, topTime: null, leaderboard: [], leaderboardAll: [], leaderboardMobile: [], leaderboardFirst: [], leaderboards: {} };

// ─── Personal stats + streak (localStorage), Circa/Suds pattern ─────────────
function getStats() {
  try {
    const s = JSON.parse(localStorage.getItem(STATS_KEY));
    if (s && s.v === 1 && s.rec) return s;
  } catch (e) {}
  return { v: 1, rec: {} };
}
function recordStat(num, entry) {
  const s = getStats();
  if (s.rec[num]) return s;
  const s2 = { ...s, rec: { ...s.rec, [num]: entry } };
  try { localStorage.setItem(STATS_KEY, JSON.stringify(s2)); } catch (e) {}
  return s2;
}
function deriveStats(s, todayNum) {
  const rec = s && s.rec ? s.rec : {};
  const nums = Object.keys(rec).map(Number).sort((a, b) => a - b);
  const played = nums.length;
  const solvedNums = nums.filter((n) => rec[n].won);
  const gVals = solvedNums.map((n) => rec[n].g).filter((g) => typeof g === 'number' && g > 0);
  const avg = gVals.length ? Math.round((gVals.reduce((a, b) => a + b, 0) / gVals.length) * 10) / 10 : null;
  let max = 0, run = 0, prev = null;
  for (const n of nums) {
    run = prev != null && n === prev + 1 ? run + 1 : 1;
    if (run > max) max = run;
    prev = n;
  }
  let cur = 0, at = rec[todayNum] ? todayNum : todayNum - 1;
  while (rec[at]) { cur++; at--; }
  return { played, avg, cur, max };
}
function mergeServerStats(s, recent, puzzles) {
  if (!s || !Array.isArray(recent) || !recent.length) return s;
  const byQuiz = {};
  for (const p of puzzles) byQuiz[p.quizId] = p;
  let rec = s.rec, changed = false;
  for (const m of recent) {
    const p = m && byQuiz[m.quizId];
    if (!p || m.attempt !== 1) continue;
    if (rec[p.num]) continue;
    const solved = (m.scorePct || 0) > 0;
    if (!changed) { rec = { ...rec }; changed = true; }
    rec[p.num] = { s: Math.max(0, Math.min(10, Math.round(((m.scorePct || 0) / 100) * 10))), t: 10, g: null, won: solved };
  }
  if (!changed) return s;
  const s2 = { ...s, rec };
  try { localStorage.setItem(STATS_KEY, JSON.stringify(s2)); } catch (e) {}
  return s2;
}

function freshState() {
  return {
    v: 1,
    guesses: [],                // [{ name, country, mi, bearing }] in order
    hintUsed: false,
    status: 'playing',          // playing | won | revealed
    t0: null,
    tEnd: null,
  };
}

export default function PingClient({ puzzles = [], forceNum = null }) {
  const PUZZLE = useMemo(() => pickPuzzle(puzzles, forceNum), [puzzles, forceNum]);
  const TARGET = useMemo(
    () => findCity(PUZZLE.city) || { name: PUZZLE.city, country: PUZZLE.country, lat: PUZZLE.lat, lng: PUZZLE.lng },
    [PUZZLE]
  );
  const STORE_KEY = `sot_ping_${PUZZLE.num}`;

  const [g, setG] = useState(freshState);
  const [val, setVal] = useState('');
  const [sugIdx, setSugIdx] = useState(-1);
  const [showHelp, setShowHelp] = useState(false);
  const [gateRules, setGateRules] = useState(false);
  const [toast, setToast] = useState(null);
  const [copied, setCopied] = useState(false);
  const [armReveal, setArmReveal] = useState(false);
  const [justWon, setJustWon] = useState(false);
  const [endClosed, setEndClosed] = useState(false);
  // The finished board starts turned OVER, showing what to do next.
  const [revealed, setRevealed] = useState(false);
  const [shareCta, setShareCta] = useState('Share');
  useEffect(() => {
    if (contestIsLive()) setShareCta(`Share for ${CONTEST.prizeLabel}*`);
  }, []);
  const [hydrated, setHydrated] = useState(false);
  const [board, setBoard] = useState(EMPTY_BOARD);
  const [identity, setIdentity] = useState(null);
  const [stats, setStats] = useState(null);
  // One free hint, first play only (see lib/hint-gate.js). Eligibility is
  // re-read whenever stats change, so the server-history merge can revoke it
  // for a returning player on a new device.
  const [hintOk, setHintOk] = useState(false);
  useEffect(() => { if (stats) setHintOk(hintAllowed('ping', stats)); }, [stats]);
  useEffect(() => { if (g.hintUsed) spendHint('ping'); }, [g.hintUsed]);
  const [player, setPlayer] = useState(null);
  const [countdown, setCountdown] = useState('');
  const [installEvt, setInstallEvt] = useState(null);
  const [showA2hsHelp, setShowA2hsHelp] = useState(false);
  const [standalone, setStandalone] = useState(false);
  const [mobileUi, setMobileUi] = useState(false);
  const [unit, setUnit] = useState('mi');   // 'mi' or 'km', display only
  const searchParams = useSearchParams();
  const { duelToken, duelInfo, duelSubmitted } = useDuelContext(PUZZLE.quizId, searchParams);
  const toastTimer = useRef(null);
  const viewedRef = useRef(false);
  const inputRef = useRef(null);

  const [showChrome, setShowChrome] = useState(false);
  const playing = g.status === 'playing';
  const preStart = playing && !g.t0;
  const started = playing && !!g.t0;
  const focusMode = playing && !showChrome;
  const LOFT = isLoft('ping');
  const STAGE = isStage('ping', searchParams);
  const STAGE_C = STAGE ? 'var(--stg-acc)' : gameColor('ping');
  const Cap = STAGE ? StageChrome : LoftCap;
  const STAGE_ACC = { '--stg-acc-dk': gameColor('ping'), '--stg-acc-lt': gameColorLight('ping'), '--stg-onramp-lt': gameOnrampLight('ping'), '--stg-acc-ink-lt': gameAccentInkLight('ping') };
  const [stageTheme] = useStageTheme();
  const INK = STAGE ? 'var(--stg-ink,#e9edf4)' : COLORS.ink;
  const FADED = STAGE ? 'var(--stg-mute,#8b95a8)' : COLORS.faded;
  const SURF = STAGE ? 'var(--stg-surf,rgba(255,255,255,0.045))' : T.white;
  const SURF_B = STAGE ? 'var(--stg-line,rgba(255,255,255,0.11))' : 'rgba(28,30,36,0.42)';
  const ACC = STAGE ? STAGE_C : COLORS.accent;
  const ACC_DEEP = STAGE ? STAGE_C : COLORS.accentDeep;
  const ACC_DEEP_INK = STAGE ? 'var(--stg-acc-ink)' : COLORS.accentDeep;
  const ACC_SOFT = STAGE ? 'var(--stg-line,rgba(255,255,255,0.11))' : COLORS.accentSoft;
  const ON_ACC = STAGE ? 'var(--stg-onramp, #08222e)' : 'var(--white)';
  const won = g.status === 'won';
  const guesses = g.guesses;

  // key of the secret city (name|country), for comparing guesses
  const targetKey = `${normCity(TARGET.name)}|${normCity(TARGET.country)}`;
  const guessedKeys = useMemo(() => new Set(guesses.map((x) => `${normCity(x.name)}|${normCity(x.country)}`)), [guesses]);

  // display helpers bound to the player's unit choice
  const fmtDist = (mi) => fmtDistIn(mi, unit);
  const changeUnit = (u) => {
    setUnit(u);
    try { localStorage.setItem(UNIT_KEY, u); } catch (e) {}
  };

  // closest miss so far (never the winning guess)
  const closest = useMemo(() => {
    let best = null;
    for (const x of guesses) { if (x.mi > 0 && (best == null || x.mi < best.mi)) best = x; }
    return best;
  }, [guesses]);

  // Live autocomplete: city names AND countries (typing "japan" lists the
  // Japanese cities), minus anything already guessed. The list does NOT hide
  // itself once the field exactly names a city (owner rule, 2026-08-23): it
  // used to drop the single remaining row as an "echo", so finishing a city
  // name made the row you were reaching for vanish under your finger, which
  // reads as the game refusing the guess. The row is a valid tap target and
  // stays; committing the guess is what clears it.
  const suggestions = useMemo(() => {
    if (!playing) return [];
    return suggestCities(val, 8)
      .filter((c) => !guessedKeys.has(`${normCity(c.name)}|${normCity(c.country)}`))
      .slice(0, 6);
  }, [val, playing, guessedKeys]);

  useEffect(() => {
    if (!armReveal) return undefined;
    const t = setTimeout(() => setArmReveal(false), 3500);
    return () => clearTimeout(t);
  }, [armReveal]);
  useEffect(() => {
    try {
      setStandalone(window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true);
      setMobileUi(isMobileDevice());
    } catch {}
    const onBip = (e) => { e.preventDefault(); setInstallEvt(e); };
    const onInstalled = () => { setStandalone(true); setInstallEvt(null); };
    window.addEventListener('beforeinstallprompt', onBip);
    window.addEventListener('appinstalled', onInstalled);
    return () => { window.removeEventListener('beforeinstallprompt', onBip); window.removeEventListener('appinstalled', onInstalled); };
  }, []);
  const a2hsClick = () => { const e = installEvt; if (e) { setInstallEvt(null); e.prompt(); } else { setShowA2hsHelp(true); } };

  // ---- persistence ----
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORE_KEY);
      if (raw) {
        const saved = JSON.parse(raw);
        if (saved && saved.v === 1 && Array.isArray(saved.guesses)) {
          setG({ ...freshState(), ...saved });
        }
      }
      setGateRules(!localStorage.getItem(HELP_KEY));
      const savedUnit = localStorage.getItem(UNIT_KEY);
      if (savedUnit === 'km' || savedUnit === 'mi') setUnit(savedUnit);
    } catch (e) {}
    try { setStats(getStats()); } catch (e) {}
    setHydrated(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  useEffect(() => {
    if (!hydrated) return;
    try { localStorage.setItem(STORE_KEY, JSON.stringify(g)); } catch (e) {}
    try {
      if (PUZZLE.num === pickPuzzle(puzzles, null).num) {
        (function(){ var _dn = g.status !== 'playing'; if (_dn || g.t0) localStorage.setItem('sot_ping_day', JSON.stringify({ d: etToday(), done: _dn })); else localStorage.removeItem('sot_ping_day'); })();
      }
    } catch (e) {}
  }, [g, hydrated, STORE_KEY, PUZZLE, puzzles]);

  // Live game clock. `elapsed` below is derived from the current time, and it
  // used to read Date.now() during render, so the displayed clock only advanced
  // when something else happened to re-render the board. This ticks a state
  // value while the game is actually running, so the readout moves on its own.
  // Display only: the elapsed time recorded on the result is still computed
  // from a real Date.now() delta at the moment the game ends.
  const [nowTick, setNowTick] = useState(() => Date.now());
  useEffect(() => {
    if (g.status !== 'playing' || !g.t0 || g.tEnd) return undefined;
    setNowTick(Date.now());
    const iv = setInterval(() => setNowTick(Date.now()), 500);
    return () => clearInterval(iv);
  }, [g.status, g.t0, g.tEnd]);

  useEffect(() => {
    if (g.status === 'playing') return;
    const tick = () => setCountdown(fmtCountdown(msToMidnightET()));
    tick();
    const iv = setInterval(tick, 1000);
    return () => clearInterval(iv);
  }, [g.status]);

  // ---- metrics + leaderboard (same /api/quiz/* flow as every other board) ----
  useEffect(() => {
    try {
      const id = JSON.parse(localStorage.getItem('sot_quiz_identity'));
      if (id && id.email) setIdentity(id);
    } catch (e) {}
    try {
      const anon = getAnonId();
      let em = '';
      try {
        const idj = JSON.parse(localStorage.getItem('sot_quiz_identity') || 'null');
        if (idj && idj.email) em = `&email=${encodeURIComponent(idj.email)}`;
      } catch (e) {}
      if (anon || em) {
        meRequest(`/api/quiz/me?anonId=${encodeURIComponent(anon || '')}${em}&history=1`)
          .then((r) => r.json())
          .then((d) => {
            if (d && Array.isArray(d.recent)) {
              setStats((cur) => mergeServerStats(cur || getStats(), d.recent, puzzles));
            }
            if (d && d.found && d.name) setPlayer({ name: d.name, rank: (d.ranks && d.ranks.xp) || d.rank || null, key: d.userKey || null });
          })
          .catch(() => {});
      }
    } catch (e) {}
    fetch(`/api/quiz/board?quizId=${encodeURIComponent(PUZZLE.quizId)}`)
      .then((r) => r.json())
      .then((d) => { if (d && !d.error) setBoard({ ...EMPTY_BOARD, ...d }); })
      .catch(() => {});
    if (!viewedRef.current) {
      viewedRef.current = true;
      fetch('/api/quiz/view', { method: 'POST', keepalive: true, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ quizId: PUZZLE.quizId }) }).catch(() => {});
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function say(msg) {
    setToast(msg);
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(null), 2400);
  }

  const elapsed = g.t0 ? fmtTime((g.tEnd || nowTick) - g.t0) : '0:00';
  const isTodays = PUZZLE.num === pickPuzzle(puzzles, null).num;
  const iq = useIqStanding({ game: 'ping', quizId: PUZZLE.quizId, active: LOFT && !playing });
  const nextUp = useNextUnplayed({ self: 'ping', active: LOFT && !playing });
  const upNext = useUnplayedSimilar({ self: 'ping', active: LOFT && !playing });
  const dailyBoard = useDailyBoard({ quizId: PUZZLE.quizId, active: LOFT && !playing });
  const allTime = useGameAllTime({ game: 'ping', active: LOFT && !playing });
  const dayStats = useDayStats();
  const catRank = useCategoryRank({ self: 'ping', active: LOFT && !playing });
  const prevPuzzle = puzzles.find((x) => x.num === PUZZLE.num - 1) || null;
  const myStats = deriveStats(stats, pickPuzzle(puzzles, null).num);
  // finished: 11-20 by guess count; gave up (revealed): 1-10 by closest miss.
  const finalScore = won
    ? getScore(guesses.length)
    : (g.status === 'revealed' ? proximityScore(closest ? closest.mi : null) : 0);
  // GUESSES ONLY on the end card's detail line (owner, 2026-08-15). It read
  // `${finalScore} · ${guesses.length} guesses`, and with only two figures
  // the middot list read as a RANGE: "6 · 9 guesses" looks like "6-9 guesses"
  // rather than a score of 6 in 9 guesses. The score is on the player's own
  // leaderboard row directly below it on the same card.
  const detailLine = `${guesses.length} guess${guesses.length === 1 ? '' : 'es'}`;

  const REC_KEY = `sot_ping_rec_${PUZZLE.num}`;
  const abandon = useAbandonFlush(() => {
    // A play counts only once the player actually guesses (or takes a hint).
    // Opening the puzzle and dismissing the start gate does not log a 0-score.
    const acted = g.guesses.length > 0 || g.hintUsed;
    if (!acted || g.status !== 'playing') return null;
    try { if (localStorage.getItem(REC_KEY)) return null; } catch (e) {}
    const el = Math.min(36000, Math.max(1, Math.round((Date.now() - (g.t0 || Date.now())) / 1000)));
    try { localStorage.setItem(REC_KEY, '1'); } catch (e) {}
    return { quizId: PUZZLE.quizId, score: 0, total: TOTAL, correct: 0, guessesUsed: 0, timeElapsed: el, abandoned: true, email: identity?.email || undefined, anonId: getAnonId(), isMobile: isMobileDevice(), referrer: (typeof document !== 'undefined' ? document.referrer : '') };
  });

  function postResult(g2, score) {
    abandon.markFlushed();
    const el = g2.t0 ? Math.max(1, Math.round(((g2.tEnd || Date.now()) - g2.t0) / 1000)) : 1;
    const solved = g2.status === 'won';
    try { setStats(recordStat(PUZZLE.num, { s: score, t: TOTAL, g: solved ? g2.guesses.length : null, won: solved })); } catch (e) {}
    try {
      fetch('/api/quiz/result', {
        method: 'POST',
        keepalive: true,
        headers: { 'Content-Type': 'application/json' },
        // guessesUsed = guesses so the daily board (score, then guesses, then
        // time) resolves ties by fewest guesses and then fastest finish.
        body: JSON.stringify({ quizId: PUZZLE.quizId, score, total: TOTAL, correct: solved ? 1 : 0, guessesUsed: g2.guesses.length, timeElapsed: el, email: identity?.email || undefined, anonId: getAnonId(), isMobile: isMobileDevice(), referrer: (typeof document !== 'undefined' ? document.referrer : '') }),
      })
        .then((r) => r.json())
        .then((d) => { if (d && !d.error) setBoard({ ...EMPTY_BOARD, ...d }); })
        .catch(() => {});
    } catch (e) {}
  }

  // Closing the start gate begins the clock (sets t0) and marks the rules as
  // seen. A no-op once started, so re-reading the rules never resets the timer.
  function startGame() {
    setG((cur) => (cur.t0 ? cur : { ...cur, t0: Date.now() }));
    try { localStorage.setItem(HELP_KEY, '1'); } catch (e) {}
  }

  function commitGuess(city) {
    if (!playing || !city) return;
    const key = `${normCity(city.name)}|${normCity(city.country)}`;
    if (guessedKeys.has(key)) { say(`You already guessed ${city.name}.`); return; }
    const mi = haversineMiles(city, TARGET);
    const entry = { name: city.name, country: city.country, mi };
    const g2 = { ...g, guesses: [...guesses, entry] };
    if (!g2.t0) g2.t0 = Date.now();
    setVal('');
    setSugIdx(-1);
    if (key === targetKey || mi === 0) {
      g2.status = 'won';
      g2.tEnd = Date.now();
      postResult(g2, getScore(g2.guesses.length));
      setG(g2);
      setJustWon(true);
      return;
    }
    setG(g2);
    if (!mobileUi) { try { inputRef.current && inputRef.current.focus(); } catch (e) {} }
  }

  function submitTyped() {
    if (!playing) return;
    // a highlighted suggestion wins; else an exact name/alias; else the top
    // suggestion ONLY if the typed text is a prefix of it (so "nice" -> Nice,
    // never the substring match Venice); else ask them to pick from the list.
    if (sugIdx >= 0 && suggestions[sugIdx]) { commitGuess(suggestions[sugIdx]); return; }
    const exact = findCity(val);
    if (exact) { commitGuess(exact); return; }
    const q = normCity(val);
    const top = suggestions[0];
    if (top) {
      const hay = [normCity(top.name), ...((top.aliases || []).map(normCity))];
      if (hay.some((h) => h.startsWith(q))) { commitGuess(top); return; }
    }
    // a typed COUNTRY: unambiguous when the atlas holds only one city in it
    // ("iceland" -> Reykjavik), otherwise send them to the list rather than
    // picking one of its cities for them. This runs AFTER the city-prefix
    // check above so "mexico" still commits Mexico City.
    const inCountry = citiesInCountry(val);
    if (inCountry.length === 1) { commitGuess(inCountry[0]); return; }
    if (inCountry.length > 1) { say(`Pick a city in ${inCountry[0].country}.`); return; }
    if (q.length) say('No match. Pick a city from the list.');
  }

  // one free hint: reveal the continent (first play only)
  const continent = continentOf(TARGET);
  function useHint() {
    if (!hintOk) return;
    if (!playing || g.hintUsed) return;
    const g2 = { ...g, hintUsed: true };
    if (!g2.t0) g2.t0 = Date.now();
    setG(g2);
    say(`Hint: the city is in ${continent}.`);
  }

  function revealEnd() {
    const g2 = { ...g, status: 'revealed', tEnd: Date.now() };
    if (!g2.t0) g2.t0 = Date.now();
    postResult(g2, proximityScore(closest ? closest.mi : null));
    setG(g2);
  }

  function resetGame() {
    try { localStorage.removeItem(STORE_KEY); } catch (e) {}
    setG(freshState()); setVal(''); setSugIdx(-1); setJustWon(false); setEndClosed(false);
  }

  function onKeyDown(e) {
    if (e.key === 'ArrowDown') { e.preventDefault(); setSugIdx((i) => Math.min((suggestions.length - 1), i + 1)); return; }
    if (e.key === 'ArrowUp') { e.preventDefault(); setSugIdx((i) => Math.max(-1, i - 1)); return; }
    if (e.key === 'Enter') { e.preventDefault(); submitTyped(); return; }
    if (e.key === 'Escape') { setSugIdx(-1); }
  }

  function shareText() {
    const squares = guesses.map((x, i) => {
      if (g.status === 'won' && i === guesses.length - 1) return '\u{1F7E9}';
      return bandOf(x.mi).sq;
    }).join('');
    const hintBit = g.hintUsed ? ' · \u{1F4A1}' : '';
    const streakBit = isTodays && myStats.cur >= 2 ? ` · streak ${myStats.cur}` : '';
    const head2 = won
      ? `Ping #${PUZZLE.num} · found in ${guesses.length} guess${guesses.length === 1 ? '' : 'es'}${hintBit}${streakBit}`
      : `Ping #${PUZZLE.num} · gave up${closest ? ` · closest ${fmtDist(closest.mi)}` : ''}${hintBit}`;
    return `${head2}\n${squares}\n${shareUrl()}`;
  }
  function shareUrl() {
    return withRef(`mindloftdaily.com/ping${isTodays ? '' : `?p=${PUZZLE.num}`}`);
  }
  function copyShare() {
    const text = playing
      ? `Ping #${PUZZLE.num} — the daily city hunt from Mind Loft.\n${shareUrl()}`
      : shareText();
    if (notifyShareCredit(text)) return;
    try {
      if (typeof navigator !== 'undefined' && navigator.share && isMobileDevice()) {
        navigator.share({ text }).catch(() => {});
        return;
      }
    } catch (e) {}
    try {
      navigator.clipboard?.writeText(text).then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 1800);
      });
    } catch (e) {}
  }

  // mi / km segmented control (display units only, never affects scoring)
  function UnitToggle() {
    return (
      <span role="group" aria-label="Distance units" style={{ display: 'inline-flex', border: `1.5px solid ${STAGE ? 'var(--stg-line2)' : 'rgba(28,30,36,0.28)'}`, borderRadius: 7, overflow: 'hidden', flex: '0 0 auto' }}>
        {['mi', 'km'].map((u) => (
          <button
            key={u}
            onClick={() => changeUnit(u)}
            aria-pressed={unit === u}
            title={u === 'km' ? 'Show distances in kilometers' : 'Show distances in miles'}
            style={{ fontFamily: MONO, fontSize: 10.5, letterSpacing: '0.08em', textTransform: 'uppercase', fontWeight: 500, lineHeight: 1.6, border: 'none', cursor: 'pointer', padding: '2px 9px', background: unit === u ? (STAGE ? 'var(--stg-acc)' : COLORS.ink) : `var(--stg-surf, ${T.white})`, color: unit === u ? (STAGE ? 'var(--stg-onramp, #fff)' : T.white) : FADED }}
          >
            {u}
          </button>
        ))}
      </span>
    );
  }

  // one guess-history row
  function GuessRow({ x, i, last }) {
    const solvedRow = g.status !== 'playing' && x.mi === 0;
    const b = bandOf(x.mi);
    const skin = bandSkin(b, STAGE);
    const bg = solvedRow
      ? (STAGE ? 'color-mix(in srgb, var(--stg-good) 15%, var(--stg-raise))' : COLORS.greenSoft)
      : skin.bg;
    const border = solvedRow
      ? (STAGE ? 'color-mix(in srgb, var(--stg-good) 50%, transparent)' : 'rgba(21,128,61,0.5)')
      : skin.border;
    const color = solvedRow ? (STAGE ? 'var(--stg-good)' : '#166534') : skin.color;
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, background: bg, border: `1.5px solid ${border}`, borderRadius: 9, padding: '8px 12px', animation: last ? ' pgrow .25s ease' : undefined }}>
        <span style={{ fontFamily: MONO, fontSize: 11, color: FADED, width: 14, flex: '0 0 auto' }}>{i + 1}</span>
        <span style={{ fontFamily: SANS, fontSize: 15, fontWeight: 800, color: INK, flex: '1 1 auto', minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {x.name}<span style={{ color: FADED, fontWeight: 600, fontSize: 12.5 }}> · {x.country}</span>
        </span>
        {solvedRow ? (
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontFamily: SANS, fontSize: 13, fontWeight: 800, color, flex: '0 0 auto' }}>
            <MapPin size={15} strokeWidth={2.5} /> found it!
          </span>
        ) : (
          <span style={{ fontFamily: MONO, fontSize: 16, fontWeight: 500, color: INK, fontVariantNumeric: 'tabular-nums', flex: '0 0 auto' }}>{fmtDist(x.mi)}</span>
        )}
      </div>
    );
  }

  // Shared rules body — rendered in both the how-to-play modal and the start gate.
  const rulesBody = (
    <DailyRules
      accent={COLORS.accent} accentSoft={COLORS.accentSoft} accentDeep={COLORS.accentDeep}
      lead="One secret city a day. Find it with distance alone."
      chips={[
        ...['cold', 'cool', 'warm', 'hot'].map((k) => {
          const b = BANDS.find((x) => x.key === k);
          const s = bandSkin(b, STAGE);
          const label = k === 'cold' ? `Cold ${fmtDistIn(2500, unit)}+`
            : k === 'hot' ? `Hot, within ${fmtDistIn(200, unit)}`
            : (k === 'cool' ? 'Cool' : 'Warm');
          return { label, style: { background: s.bg, border: `1.5px solid ${s.border}`, color: s.color } };
        }),
      ]}
      steps={[
        <>Guess <b>any world city</b> to begin. There are <b>no clues</b> and <b>no guess limit</b>. Type a city, or a <b>country</b> to see the cities in it.</>,
        <>Each guess pings back one number: the <b>distance in {unitWord(unit)}</b> to the secret city. No direction, just the distance, and it shrinks as you close in.</>,
        <>Flip the <b>mi / km</b> switch above the guess box any time. It only changes what you read, never your score.</>,
        <>Land on the city, or <b>Give up</b> and still be scored on how close your best guess got, ranked against everyone who played.</>,
      ]}
      knack="Distance alone triangulates fast, so spread your first few guesses across far apart continents rather than crowding one region."
      footer={<>Your score is how few guesses it took. One free <b>hint</b>, on your first ever play, reveals the continent. Ties break on fewest guesses, then fastest time. Sundays hide a trickier city.</>}
    />
  );

  return (
    <div className={STAGE ? 'stage-page' : (LOFT ? 'loft-page' : undefined)}
      data-stage-theme={STAGE ? stageTheme : undefined}
      style={{ ...(STAGE ? STAGE_ACC : null), minHeight: '100vh', position: 'relative', background: STAGE ? 'var(--stg-ground)' : T.surface, color: STAGE ? 'var(--stg-ink,#e9edf4)' : undefined, overflowX: (STAGE || LOFT) ? 'hidden' : undefined }}>
      {!STAGE && <Grain />}
      {/* Shared daily chrome (app/DailyChrome.jsx): home masthead + stat bar +
          today's slate rail, collapsing to one line once the clock runs. Outside
          the page wrapper so the bands run full bleed; nothing here is pinned. */}
      {!STAGE && (
      <DailyChrome slug="ping" name="Ping" collapsed={started} loft={LOFT} />
      )}
      {/* LOFT: the cap replaces the title block AND the board's own stat
          strip. The prompt and the miles/kilometres toggle both stay in the card: one is a
          question and the other is a CONTROL, and neither is a figure. Ping pays
          proximity credit on a give-up, so the cap can go amber. */}
      {LOFT && (
        <Cap gameKey="ping" quizId={PUZZLE.quizId}
          name="Ping"
          cat="Geography"
          outcome={playing ? null : (won ? 'won' : (finalScore > 0 ? 'part' : 'lost'))}
          num={PUZZLE.num}
          tiles={playing ? null : upNext}
          dateLabel={PUZZLE.dateLabel}
          onHelp={() => setShowHelp(true)}
          sunday={PUZZLE.sunday ? 'Sunday Edition · Tricky' : null}
          figures={playing ? [
            { v: guesses.length, k: 'guesses so far' },
          ] : [
            { v: finalScore, k: 'score' },
            { v: guesses.length, k: 'guesses' },
          ]}
        />
      )}
      <div className="pg-wrap" style={{ position: 'relative', zIndex: 2, maxWidth: 1180, margin: '0 auto', padding: '18px 38px 80px', fontFamily: SANS }}>
        <style dangerouslySetInnerHTML={{ __html: `
          @media(max-width:560px){.pg-wrap{padding-left:12px !important;padding-right:12px !important;}}
          .pg-btn{font-family:${SANS};font-weight:800;font-size:14px;border:2px solid ${STAGE ? 'var(--stg-line2)' : 'var(--blue-deep)'};background:${STAGE ? 'transparent' : 'var(--white)'};color:${STAGE ? 'var(--stg-ink)' : 'var(--blue-deep)'};border-radius:8px;padding:9px 16px;cursor:pointer;display:inline-flex;align-items:center;gap:7px;}
          .pg-btn:hover{background:var(--stg-surf2, var(--accent-soft));}
          @keyframes pgfade{from{opacity:0;}}
          @keyframes pgrow{from{opacity:0;transform:translateY(-4px);}}
          @media(max-width:560px){.pg-ttl{flex-direction:column;align-items:flex-start;gap:1px;}.pg-ttl h1{font-size:21px;letter-spacing:0.02em;}.pg-ttl .pg-ttl-dt{font-size:15px;}.pg-ttl-dot{display:none;}}
          .pg-inp{font-family:${SANS};font-weight:700;font-size:18px;width:100%;border:2px solid ${STAGE ? 'var(--stg-line2)' : COLORS.ink};border-radius:9px;padding:13px 14px 13px 42px;background:${STAGE ? 'var(--stg-surf)' : 'var(--white)'};color:${INK};outline:none;}
          .pg-inp:focus{border-color:var(--stg-acc, ${COLORS.accent});box-shadow:0 0 0 3px color-mix(in srgb, var(--stg-acc, ${COLORS.accent}) 18%, transparent);}
          .pg-go{font-family:${SANS};font-weight:800;font-size:15px;letter-spacing:0.04em;text-transform:uppercase;border:2px solid var(--stg-acc, ${COLORS.accent});background:var(--stg-acc, ${COLORS.accent});color:var(--stg-onramp, var(--white));border-radius:9px;padding:0 22px;cursor:pointer;height:52px;flex:0 0 auto;}
          .pg-go:active{transform:translateY(1px);}
          .pg-sug{position:absolute;left:0;right:0;top:calc(100% + 6px);background:${STAGE ? 'var(--stg-raise)' : 'var(--white)'};border:2px solid ${STAGE ? 'var(--stg-line2)' : COLORS.ink};border-radius:10px;box-shadow:0 12px 30px rgba(0,0,0,0.42);overflow:hidden;z-index:20;}
          .pg-sug button{display:flex;align-items:center;gap:8px;width:100%;text-align:left;font-family:${SANS};font-size:15px;font-weight:700;color:${INK};background:${STAGE ? 'var(--stg-raise)' : 'var(--white)'};border:none;border-bottom:1px solid var(--stg-line, rgba(28,30,36,0.08));padding:10px 13px;cursor:pointer;}
          .pg-sug button:last-child{border-bottom:none;}
          .pg-sug button:hover,.pg-sug button.on{background:var(--stg-surf2, ${COLORS.accentSoft});}
          .pg-tool{font-family:${SANS};font-weight:800;font-size:12.5px;border:1.5px solid ${STAGE ? 'var(--stg-line2)' : 'rgba(28,30,36,0.35)'};background:${STAGE ? 'var(--stg-surf2)' : 'var(--white)'};color:${INK};border-radius:8px;padding:7px 11px;cursor:pointer;display:inline-flex;align-items:center;gap:6px;}
        ` }} />

        <div style={{ maxWidth: 620, margin: '0 auto' }}>

        {/* puzzle-native top strip: quiet nav + player chip (hidden in focus mode while playing) */}

        {/* masthead: pressed PING tiles with No./date inline */}
        {!LOFT && (
        <DailyMasthead
          slug="ping"
          num={PUZZLE.num}
          dateLabel={PUZZLE.dateLabel}
          accent={COLORS.accent}
          blockGap={5}
          helpTop={13}
          marginBottom={16}
          onHelp={() => setShowHelp(true)}
          sunday={PUZZLE.sunday && <span style={{ fontFamily: MONO, fontSize: 9.5, letterSpacing: '0.1em', textTransform: 'uppercase', fontWeight: 500, color: `var(--stg-onramp, ${T.white})`, background: `var(--stg-acc, ${COLORS.accent})`, borderRadius: 4, padding: '2px 6px' }}>Sunday Edition &middot; Tricky</span>}
          blocks={'PING'.split('').map((ch, i) => (
              <div key={i} style={{ width: 44, height: 44, borderRadius: 5, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: SANS, fontWeight: 900, fontSize: 26, background: i === 3 ? `var(--stg-acc, ${COLORS.accent})` : COLORS.ink, color: T.white, boxShadow: 'inset 0 2px 5px rgba(0,0,0,0.5), 0 1px 0 rgba(255,255,255,0.65)' }}>{ch}</div>
            ))}
        />
        )}

        {/* LOFT: the play area sits on the navy stage, which runs full bleed
            and fills the first screen. */}
        <div className={LOFT && !STAGE ? 'loft-stage' : undefined}>
          <div className={LOFT && !STAGE && !playing ? (revealed ? 'loft-flip' : 'loft-flip on') : undefined}>
          <div className={LOFT && !STAGE && !playing ? 'loft-flip-in' : undefined}>
          <div className={LOFT && !STAGE && !playing ? 'loft-face' : undefined}>

        {/* start gate — the hunt stays sealed until Start begins the clock */}
        {preStart && (
          <div className={STAGE ? 'stg-gate' : undefined} style={{ background: STAGE ? SURF : COLORS.cream, border: STAGE ? `1px solid ${SURF_B}` : `2px solid ${COLORS.ink}`, borderRadius: 12, padding: '22px', minHeight: 220, display: 'flex', flexDirection: 'column', marginBottom: 12 }}>
            <div style={{ fontSize: 20, fontWeight: 800, color: INK, marginBottom: 10 }}>{gateRules ? 'How to play' : 'Ping is ready'}</div>
            {gateRules ? rulesBody : (
              <div style={{ fontSize: 14, lineHeight: 1.55, color: INK, fontWeight: 600 }}>
                <p style={{ margin: '0 0 6px' }}>One secret city, no clues. Guess any world city and each ping tells you how far off you are.</p>
              </div>
            )}
            <div style={{ marginTop: 'auto', paddingTop: 18, display: 'flex', flexDirection: 'row-reverse', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
              <button className="pg-btn" onClick={startGame} style={{ borderColor: STAGE ? STAGE_C : undefined, background: STAGE ? STAGE_C : T.cta, color: STAGE ? 'var(--stg-onramp, #08222e)' : T.white, fontSize: 15, padding: '11px 22px' }}>Start</button>
              <div>
                <button type="button" onClick={() => setGateRules((v) => !v)} style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', fontFamily: SANS, fontSize: 13, fontWeight: 700, color: FADED, textDecoration: 'underline' }}>
                  {gateRules ? 'Hide detailed instructions' : 'Show detailed instructions'}
                </button>
              </div>
            </div>
          </div>
        )}
        {/* the hunt */}
        {!preStart && (
        <div className={STAGE ? 'stg-board' : (LOFT ? 'loft-card' : undefined)} style={{ background: STAGE ? SURF : T.white, border: STAGE ? `1px solid ${SURF_B}` : `2px solid ${COLORS.ink}`, borderRadius: 10, padding: '15px 17px 17px', boxShadow: STAGE ? 'none' : '5px 5px 0 rgba(28,30,36,0.16)', marginBottom: 12 }}>
          {/* These figures move UP into the cap on a loft page; printing
              them twice is the one thing to avoid. */}
          {!LOFT && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, fontFamily: MONO, fontSize: 11.5, letterSpacing: '0.1em', textTransform: 'uppercase', color: FADED, borderBottom: `1px solid ${STAGE ? 'var(--stg-line)' : 'rgba(28,30,36,0.18)'}`, paddingBottom: 8, marginBottom: 12, flexWrap: 'wrap' }}>
            <span style={{ whiteSpace: 'nowrap' }}>name the secret city</span>
            <span style={{ marginLeft: 'auto', display: 'inline-flex' }}><UnitToggle /></span>
            <span style={{ whiteSpace: 'nowrap' }}>guess <b style={{ color: INK, fontWeight: 500 }}>{guesses.length}</b>{playing ? ' so far' : ''}</span>
          </div>
          )}
          {/* The PROMPT stays here. It is a question (and for Ping a
              control), not a figure, so it belongs with the board rather
              than in the cap. Restyled off the retired mono texture. */}
          {LOFT && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontFamily: SANS, fontSize: 12.5, fontWeight: 700, color: FADED, borderBottom: `1px solid ${STAGE ? 'var(--stg-line)' : 'rgba(28,30,36,0.12)'}`, paddingBottom: 8, marginBottom: 12, flexWrap: 'wrap' }}>
            <span>Name the secret city</span>
            <span style={{ marginLeft: 'auto', display: 'inline-flex' }}><UnitToggle /></span>
          </div>
          )}

          <div style={{ fontFamily: SANS, fontSize: 17, fontWeight: 700, letterSpacing: '-0.01em', color: INK, lineHeight: 1.4, margin: '2px 0 4px' }}>
            One city, no clues. Guess any world city and I&rsquo;ll tell you exactly how far away it is. Close in from there.
          </div>
          {g.hintUsed && playing && (
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontFamily: SANS, fontSize: 12.5, fontWeight: 800, color: ACC_DEEP_INK, background: `var(--stg-surf, ${COLORS.accentSoft})`, border: '1.5px solid rgba(2,132,199,0.4)', borderRadius: 7, padding: '4px 10px', marginTop: 8 }}>
              <Lightbulb size={13} /> It&rsquo;s in {continent}.
            </div>
          )}

          {/* input row */}
          {started && (
            <div style={{ marginTop: 14 }}>
              <div style={{ display: 'flex', gap: 9, alignItems: 'stretch', position: 'relative' }}>
                <div style={{ position: 'relative', flex: '1 1 auto' }}>
                  <Search size={17} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: FADED, pointerEvents: 'none' }} />
                  <input
                    ref={inputRef}
                    className="pg-inp"
                    type="text"
                    placeholder="Guess a city…"
                    value={val}
                    autoFocus={!mobileUi}
                    autoComplete="off"
                    autoCorrect="off"
                    spellCheck={false}
                    onChange={(e) => { setVal(e.target.value); setSugIdx(-1); }}
                    onKeyDown={onKeyDown}
                    aria-label="Your city guess"
                  />
                  {suggestions.length > 0 && (
                    <div className="pg-sug">
                      {suggestions.map((c, i) => (
                        <button
                          key={`${c.name}|${c.country}`}
                          className={i === sugIdx ? 'on' : ''}
                          onMouseEnter={() => setSugIdx(i)}
                          onClick={() => commitGuess(c)}
                        >
                          <MapPin size={14} style={{ color: FADED, flex: '0 0 auto' }} />
                          <span>{c.name}<span style={{ color: FADED, fontWeight: 600 }}> · {c.country}</span></span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                <button className="pg-go" onClick={submitTyped}>Guess</button>
              </div>
              <div style={{ fontFamily: SANS, fontSize: 12, fontWeight: 700, color: FADED, marginTop: 8 }}>
                {closest ? (
                  <>Closest so far: <b style={{ color: INK }}>{closest.name}</b>, {fmtDist(closest.mi)} away &middot; no guess limit</>
                ) : (
                  <>Any major world city &middot; type a <b style={{ color: INK }}>country</b> to see its cities &middot; no guess limit</>
                )}
              </div>
            </div>
          )}

          {/* guess history — newest on top */}
          {guesses.length > 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: 14 }}>
              {guesses.slice().reverse().map((x, ri) => {
                const i = guesses.length - 1 - ri;
                return <GuessRow key={i} x={x} i={i} last={ri === 0} />;
              })}
            </div>
          )}

          {/* tools */}
          {started && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 13, flexWrap: 'wrap' }}>
              {hintOk && !g.hintUsed && (
                <button className="pg-tool" onClick={useHint} title="Reveal the continent (one hint, first play only)" style={{ background: `var(--stg-surf, ${COLORS.accentSoft})`, borderColor: 'rgba(2,132,199,0.5)', color: ACC_DEEP_INK }}>
                  <Lightbulb size={14} /> Hint: the continent
                </button>
              )}
              {guesses.length > 0 && (
                <button onClick={() => { if (armReveal) { if (Date.now() - armReveal < ARM_MIN_MS) return; setArmReveal(false); revealEnd(); } else { setArmReveal(Date.now()); } }}
                  title="Give up: reveals the city and scores you on your closest guess"
                  style={{ marginLeft: 'auto', background: 'none', border: 'none', cursor: 'pointer', fontFamily: SANS, fontWeight: 700, fontSize: 12, color: armReveal ? `var(--stg-bad, ${COLORS.rust})` : `var(--stg-mute, ${COLORS.faded})`, textDecoration: 'underline', textUnderlineOffset: 3, display: 'inline-flex', alignItems: 'center', gap: 5 }}>
                  <Eye size={13} /> {armReveal ? 'Tap again to give up (you keep your closeness score)' : 'Give up & reveal'}
                </button>
              )}
            </div>
          )}
        </div>
        )}


          <div className={STAGE ? undefined : 'loft-sol'}>
          {/* result */}
          {!playing && (
            <>
              <div style={{ maxWidth: 472, margin: '0 auto 12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 14, background: STAGE ? 'var(--stg-raise)' : PAPER, border: `1.5px solid ${STAGE ? 'var(--stg-line2)' : 'rgba(28,30,36,0.18)'}`, borderRadius: 10, padding: '12px 14px' }}>
                  <MapPin size={30} strokeWidth={2.2} style={{ color: won ? COLORS.green : `var(--stg-ink, ${COLORS.ink})`, flex: '0 0 auto' }} />
                  <span style={{ fontFamily: SANS, fontSize: 13, fontWeight: 700, color: INK, lineHeight: 1.45 }}>
                    <b style={{ fontSize: 16 }}>{TARGET.name}, {TARGET.country}.</b> <span style={{ color: FADED, fontWeight: 600 }}>{PUZZLE.blurb}</span>
                  </span>
                </div>
                {PUZZLE.sunday && (
                  <div style={{ fontSize: 12.5, fontWeight: 600, color: FADED, fontStyle: 'italic', margin: '8px 0 0' }}>The Sunday Edition: a trickier city to find.</div>
                )}
                {!won && closest && (
                  <div style={{ fontSize: 12.5, fontWeight: 700, color: ACC_DEEP_INK, margin: '8px 0 0' }}>
                    Your closest: {closest.name}, {fmtDist(closest.mi)} away &middot; scored {finalScore}/{TOTAL}.
                  </div>
                )}
              </div>
              <p className={STAGE ? undefined : 'loft-tailnote'} style={{ fontSize: 12, color: FADED, fontWeight: 600, margin: '12px 0 0' }}>
                {isTodays ? (
                  <>
                    {countdown ? <>Next Ping in <b style={{ color: INK, fontVariantNumeric: 'tabular-nums' }}>{countdown}</b>.</> : 'A new city drops at midnight Eastern.'}
                    {prevPuzzle && (
                      <>
                        {' '}Meanwhile:{' '}
                        <a href={`/ping?p=${prevPuzzle.num}`} style={{ color: `var(--stg-ink, ${COLORS.ember})`, fontWeight: 800, textDecoration: 'underline' }}>
                          play yesterday&rsquo;s Ping &rarr;
                        </a>
                      </>
                    )}
                  </>
                ) : (
                  <>
                    You&rsquo;re playing the {PUZZLE.dateLabel.replace(', 2026', '')} archive.{' '}
                    <a href="/ping" style={{ color: `var(--stg-ink, ${COLORS.ember})`, fontWeight: 800, textDecoration: 'underline' }}>Back to today&rsquo;s Ping &rarr;</a>
                    {' · '}
                    <a href="/daily" style={{ color: FADED, fontWeight: 700, textDecoration: 'underline' }}>All daily puzzles</a>
                  </>
                )}
              </p>
            </>
          )}
          </div>
          {LOFT && !playing && revealed && (
            <button className={STAGE ? 'stf-hideboard' : 'loft-showopts'} onClick={() => setRevealed(false)}>&#8630; Hide game board</button>
          )}
          </div>
          {LOFT && !playing && (
            <LoftFinish
              name="Ping"
              catRank={catRank}
              outcome={won ? 'won' : (finalScore > 0 ? 'part' : 'lost')}
              title={won ? 'Solved' : 'Not solved'}
              detail={detailLine}
              iq={iq}
              board={dailyBoard}
              gameRank={allTime && allTime.ready
                ? { value: allTime.rank != null ? `#${Number(allTime.rank).toLocaleString()}` : '\u2014',
                    label: allTime.field != null ? `of ${Number(allTime.field).toLocaleString()} Ping all time` : 'all-time rank' }
                : null}
              day={dayStats}
              streak={isTodays ? myStats.cur : null}
              missLabel="Guesses"
              archive={puzzles
                .filter((p) => p.live <= etToday() && p.num !== PUZZLE.num)
                .sort((x, y) => y.num - x.num)
                .map((p) => ({
                  num: p.num,
                  dateLabel: p.dateLabel,
                  sunday: !!p.sunday,
                  href: `/ping?p=${p.num}`,
                  done: !!(stats && stats.rec && stats.rec[p.num]),
                  score: (stats && stats.rec && stats.rec[p.num]) ? stats.rec[p.num].s : null,
                }))}
              options={[
                { label: copied ? 'Copied' : (shareCta || 'Share'), sub: 'Your result, no spoilers', kind: 'gold', onClick: copyShare },
                { tone: won ? 'board' : 'reveal', label: won ? 'Return to board' : 'Reveal answer',
                  sub: won ? 'Your finished board' : 'Show what you missed', onClick: () => setRevealed(true) },
              prevPuzzle && { tone: 'another', label: 'Play another Ping', sub: `No. ${prevPuzzle.num}, yesterday\u2019s puzzle`, href: `/ping?p=${prevPuzzle.num}` },
                nextUp && { tone: 'similar', label: 'Play similar', sub: `${nextUp.name} \u00b7 ${nextUp.tag}`, href: nextUp.href },
                { tone: 'replay', label: 'Replay', sub: 'This puzzle again, unscored', onClick: resetGame },
                { label: 'Back to main', sub: 'The day\u2019s full board', tone: 'main', href: '/' },
              ]}
            />
          )}
          </div>
          </div>
        {/* end of the navy play stage; everything below is the light tail */}
        </div>


        {/* The game's own record, archive and leaderboards, at the foot of the
            page (owner, 2026-08-24). This is the panel that used to open from a
            home-page puzzle tile. GamePanel renders its own button and also
            flips the page out of focus mode on first open, which is all the
            "Show overview and more" control it replaces ever did. */}
        {/* The strip in the cap answers what this opens, without being pressed. */}
        {!STAGE && <GamePanel self="ping" name="Ping" onShow={() => setShowChrome(true)} />}
        {/* standard quiz-page bottom: challenge + stats + join + leaderboard */}
        <div style={{ display: (focusMode && !STAGE) ? 'none' : 'block', margin: '30px auto 0' }}>
          {LOFT && (
            <div className={STAGE ? undefined : 'loft-report'}>
              <ReportIssue self="ping" name="Ping" accent="#ffffff" align="center" onHelp={() => setShowHelp(true)} />
            </div>
          )}
          {!LOFT && (
          <DailyGamesGrid replay={!playing ? resetGame : null}
            self="ping"
            maxWidth={620}
            challengeHref={`/duel/new?quiz=${encodeURIComponent(PUZZLE.quizId)}`}
            share={{ label: copied ? 'Copied' : 'Share', onClick: copyShare }}
            light
            boardSlot={<DailyBoardPanel self="ping" quizId={PUZZLE.quizId} maxWidth={620} streak={{ current: myStats.cur, best: myStats.max }} />}
            divider
          />
          )}
          {!focusMode && mobileUi && !standalone && (
            <button onClick={a2hsClick} style={{ marginTop: 10, width: '100%', fontFamily: SANS, fontSize: 13.5, letterSpacing: '0.05em', textTransform: 'uppercase', fontWeight: 800, height: 54, borderRadius: 10, border: 'none', background: `var(--stg-acc, ${COLORS.accent})`, color: `var(--stg-onramp, ${T.white})`, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 9, whiteSpace: 'nowrap' }}>
              <Smartphone size={15} strokeWidth={2.5} /> Add to Home Screen
            </button>
          )}
        </div>
        {showA2hsHelp && (
          <div onClick={() => setShowA2hsHelp(false)} style={{ position: 'fixed', inset: 0, background: 'rgba(20,22,28,0.55)', zIndex: 90, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 18 }}>
            <div onClick={(e) => e.stopPropagation()} style={{ background: STAGE ? 'var(--stg-raise,#0e131f)' : T.white, borderRadius: 14, maxWidth: 430, width: '100%', padding: '22px 22px 16px', fontFamily: SANS, border: STAGE ? '1px solid var(--stg-line)' : '1.5px solid rgba(20,22,28,0.12)' }}>
              <div style={{ fontSize: 17, fontWeight: 800, color: INK, marginBottom: 8 }}>Add Ping to your Home Screen</div>
              {isIosDevice() ? (
                <ol style={{ margin: '0 0 4px', paddingLeft: 20, color: INK, fontSize: 14, lineHeight: 1.7 }}>
                  <li>Tap the <b>Share</b> button in Safari&apos;s toolbar.</li>
                  <li>Scroll down and tap <b>Add to Home Screen</b>.</li>
                  <li>Tap <b>Add</b> &mdash; the tile opens today&apos;s city, every day.</li>
                </ol>
              ) : (
                <p style={{ margin: '0 0 4px', color: INK, fontSize: 14, lineHeight: 1.7 }}>
                  Open your browser&apos;s menu and choose <b>Add to Home Screen</b> (or <b>Install app</b>). The tile opens today&apos;s city, every day.
                </p>
              )}
              <button onClick={() => setShowA2hsHelp(false)} style={{ marginTop: 10, fontFamily: SANS, fontSize: 12.5, letterSpacing: '0.05em', textTransform: 'uppercase', fontWeight: 700, height: 44, width: '100%', borderRadius: 10, border: 'none', background: STAGE ? 'var(--stg-acc)' : COLORS.ink, color: STAGE ? 'var(--stg-onramp, #fff)' : T.white, cursor: 'pointer' }}>Got it</button>
            </div>
          </div>
        )}
        {!focusMode && !identity && (
          <div id="daily-join" style={{ margin: '18px auto 0' }}>
            <JoinLeaderboardForm hideIcon heading="See your stats and join the leaderboard" identity={identity} onJoined={(id) => { setIdentity(id); if (id && id.username) setPlayer((p) => p || { name: id.username, rank: null }); }} />
          </div>
        )}
        </div>

        {/* Personal stats wiring (myStats) is retained for the share string and
            streak logic; the on-page "Your stats" tile row is no longer shown.
            The daily leaderboard now renders in DailyGamesGrid's boardSlot,
            directly under the Challenge / Share actions (owner, 2026-07-23). */}
      </div>

      {/* the end-of-puzzle popup: the shared DailyEndCard as a dismissible modal (win or loss) */}
      {!playing && !endClosed && !LOFT && (
        <DailyEndCard
          modal
          self="ping"
          won={won}
          headline={won ? <>You found it!</> : (closest && closest.mi <= 400 ? <>So close!</> : <>Gave up</>)}
          answer={won ? null : <>{TARGET.name}, {TARGET.country}</>}
          subline={won
            ? <>{TARGET.name} &middot; found in {guesses.length} guess{guesses.length === 1 ? '' : 'es'} &middot; {elapsed}{g.hintUsed ? <> &middot; 1 hint</> : null}</>
            : (closest
              ? <>Closest: {closest.name}, {fmtDist(closest.mi)} &middot; scored {finalScore}/{TOTAL}</>
              : <>You revealed {TARGET.name} without guessing</>)}
          onShare={copyShare}
          shareLabel={copied ? 'Copied' : 'Share Result'}
          onReplay={resetGame}
          onClose={() => setEndClosed(true)}
        />
      )}

      <DuelBanner token={duelToken} info={duelInfo} submitted={duelSubmitted} />

      {toast && (
        <div style={{ position: 'fixed', left: '50%', bottom: 26, transform: 'translateX(-50%)', background: COLORS.ink, color: T.white, fontFamily: SANS, fontWeight: 800, fontSize: 13.5, padding: '10px 18px', borderRadius: 9, zIndex: 60, boxShadow: '0 6px 18px rgba(20,22,28,0.25)', maxWidth: '86vw', textAlign: 'center' }}>
          {toast}
        </div>
      )}

      {/* help modal */}
      {showHelp && (
        <div onClick={() => { setShowHelp(false); try { localStorage.setItem(HELP_KEY, '1'); } catch (e) {} }}
          style={{ position: 'fixed', inset: 0, background: 'rgba(20,22,28,0.55)', zIndex: 70, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
          <div onClick={(e) => e.stopPropagation()} style={{ width: '100%', maxWidth: 460, background: STAGE ? 'var(--stg-raise,#0e131f)' : COLORS.cream, borderRadius: 12, border: STAGE ? '1px solid var(--stg-line)' : `2px solid ${COLORS.ink}`, padding: '20px 22px', fontFamily: SANS, maxHeight: '86vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', alignItems: 'center', marginBottom: 10 }}>
              <div style={{ fontSize: 21, fontWeight: 800, color: INK }}>How to play</div>
              <button onClick={() => { setShowHelp(false); try { localStorage.setItem(HELP_KEY, '1'); } catch (e) {} }} aria-label="Close" style={{ marginLeft: 'auto', background: 'none', border: 'none', cursor: 'pointer', color: FADED }}><X size={20} /></button>
            </div>
            {rulesBody}
            <button className="pg-btn" onClick={() => { setShowHelp(false); try { localStorage.setItem(HELP_KEY, '1'); } catch (e) {} }} style={{ marginTop: 14, background: STAGE ? 'var(--stg-acc)' : COLORS.ink, color: STAGE ? 'var(--stg-onramp, #fff)' : T.white, borderColor: 'transparent' }}>Play</button>
          </div>
        </div>
      )}

      {/* The desktop fold: the About prose below starts one screen down (app/StageFold.jsx). */}
      <StageFold />
      {/* About Ping — crawlable prose for search, server-rendered into the HTML */}
      <section style={{ display: (focusMode && !STAGE) ? 'none' : 'block', position: 'relative', zIndex: 2, maxWidth: 620, margin: '0 auto', padding: '10px 24px 42px', fontFamily: SANS }}>
        <h2 style={{ margin: '0 0 8px', fontSize: 15, fontWeight: 800, letterSpacing: '-0.01em', color: INK }}>About Ping</h2>
        <p style={{ margin: '0 0 8px', fontSize: 13, lineHeight: 1.65, color: FADED, fontWeight: 600 }}>
          Ping is a free daily geography puzzle from Mind Loft, the daily city hunt. Each day there&rsquo;s one secret city somewhere in the world and not a single clue to start. Name any well-known city and Ping answers with one number: the great-circle distance to the target, in miles or kilometers, whichever you prefer.
        </p>
        <p style={{ margin: '0 0 8px', fontSize: 13, lineHeight: 1.65, color: FADED, fontWeight: 600 }}>
          From there it&rsquo;s pure triangulation: watch the distance fall and close in on the answer. There&rsquo;s no limit on guesses, so everyone gets there in the end, the goal is to do it in as few guesses as you can. Give up any time and you&rsquo;re still scored on how close you got. One free hint, on your first ever play, reveals the continent.
        </p>
        <p style={{ margin: 0, fontSize: 13, lineHeight: 1.65, color: FADED, fontWeight: 600 }}>
          A new city drops every day at midnight Eastern, with a trickier one on Sundays. No app, no signup, play free in your browser, keep a streak, and race the daily leaderboard. More dailies: <a href="/span" style={{ color: INK, fontWeight: 800 }}>Span</a>, our geography puzzle, <a href="/outrank" style={{ color: INK, fontWeight: 800 }}>Outrank</a>, the daily crowd-ranking puzzle, and <a href="/crux" style={{ color: INK, fontWeight: 800 }}>Crux</a>, our clueless crossword.
        </p>
      </section>

      {!STAGE && <div style={{ display: focusMode ? 'none' : 'block', position: 'relative', zIndex: 2 }}><Footer /></div>}
    </div>
  );
}
