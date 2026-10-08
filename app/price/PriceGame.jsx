'use client';

// PriceGame — the one engine behind the Price Check family (Pricer, Dealer,
// Realtor, Agent, Curator; see lib/price-games.js). It is Pricer's client,
// generalised on 2026-10-01: the scoring, the five guess rows, the heat
// ladder, the finish and the item pop-up are the same for every game, and
// what differs (the photo layout, the facts, the "as of" sentence and the
// link) arrives already written in the day's item from the server.
//
// TWO MODES. Solo (the game's own page) is the full page: cap, gate, finish,
// archive, pop-ups. Run (`run` prop, used by /pricecheck) is the board alone,
// started at once; it still files the solo row and does every local write the
// solo page does (state, day breadcrumb, stats, abandon marker), so a game
// played inside the run IS that day's play of that game. `run.practice`
// replays a game already played today: nothing is saved or posted, and the
// run keeps the original score (owner, 2026-10-01).
//
// The board ranks on score, then on exact closeness (priceTiebreak, the best
// guess's error in basis points, lower first; migration 50 and the price
// branch in lib/quiz-anon + lib/daily-combined), then fewer guesses, then time.
// The bank is resolved on the server and only the picked day ships, so
// tomorrow's price never reaches a browser.

import React, { useState, useEffect, useLayoutEffect, useMemo, useRef } from 'react';
import { useSearchParams } from 'next/navigation';
import { X, Smartphone, ArrowUp, ArrowDown, ExternalLink } from 'lucide-react';
import Grain from '../Grain';
import DailyRules from '../DailyRules';
import Footer from '../Footer';
import useDuelContext, { DuelBanner } from '../quiz/[id]/useDuelContext';
import JoinLeaderboardForm from '../quiz/[id]/JoinLeaderboardForm';
import DailyChrome from '../DailyChrome';
import { isMobileDevice } from '@/lib/is-mobile';
import useAbandonFlush from '../quiz/[id]/useAbandonFlush';
import { withRef } from '@/lib/referrals';
import { notifyShareCredit } from '../ShareCreditPop';
import ReportIssue from '../ReportIssue';
import StageFold from '../StageFold';
import LoftCap from '../LoftCap';
import StageChrome from '../StageChrome';
import { isStage } from '@/lib/stage';
import { useStageTheme } from '@/lib/stage-theme';
import { gameColor, gameColorLight, gameOnrampLight, gameAccentInkLight } from '@/lib/category-ramp';
import GamePanel from '../GamePanel';
import useIqStanding from '../useIqStanding';
import useNextUnplayed, { useUnplayedSimilar } from '../useNextUnplayed';
import useDailyBoard from '../useDailyBoard';
import useGameAllTime from '../useGameAllTime';
import useDayStats from '../useDayStats';
import useCategoryRank from '../useCategoryRank';
import LoftFinish from '../LoftFinish';
import { CONTEST, contestIsLive } from '@/lib/contest';
import { T } from '@/lib/theme';
import { meRequest } from '@/app/quizMeClient';
import RunDoorPop from '../circuits/RunDoorPop';
import { PRICE_GAMES, GUESSES, TOTAL, errOf, bandOf, scoreOf, pctLabel, fmtCents, parseGuess } from '@/lib/price-games';

// AUTO COMMAS IN THE GUESS BAR (owner, 2026-10-06). The guess is regrouped as
// it is typed, so 1250000 reads 1,250,000. Keeps one decimal point, keeps a
// trailing k / m / b shorthand, and drops anything else. parseGuess already
// strips commas, so scoring is unchanged.
export function groupGuess(raw) {
  let s = String(raw || '').replace(/[^0-9.kmbKMB]/g, '');
  let suf = '';
  const li = s.search(/[kmbKMB]/);
  if (li >= 0) { suf = /\d/.test(s.slice(0, li)) ? s[li].toLowerCase() : ''; s = s.slice(0, li); }
  const dot = s.indexOf('.');
  let int = dot < 0 ? s : s.slice(0, dot);
  const dec = dot < 0 ? null : s.slice(dot + 1).replace(/\./g, '');
  int = int.replace(/^0+(?=\d)/, '');
  const grouped = int.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  return grouped + (dec != null ? '.' + dec : '') + suf;
}
// Where the caret belongs in the regrouped text: after the same number of
// meaningful characters (digits, the point, the suffix) it followed before.
export function caretAfter(text, sig) {
  if (sig <= 0) return 0;
  let n = 0;
  for (let i = 0; i < text.length; i++) { if (text[i] !== ',' && ++n === sig) return i + 1; }
  return text.length;
}

const COLORS = {
  cream: T.surface, ink: T.ink, ember: T.accent, rust: T.danger, faded: T.muted,
  accent: '#15803d', accentSoft: '#e9f7ee', green: T.successDeep,
};
const SANS = "'Manrope', system-ui, -apple-system, sans-serif";
const MONO = "'Manrope', ui-monospace, 'SFMono-Regular', monospace";

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
    const next = new Date(et); next.setHours(24, 0, 0, 0);
    return next - et;
  } catch (e) { return 0; }
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

// Per-game local stats. Pricer keeps the key it shipped with.
export const statsKeyOf = (key) => (key === 'pricer' ? 'sot_pricer2_stats' : `sot_${key}_stats`);
function getStats(SK) {
  try { const s = JSON.parse(localStorage.getItem(SK)); if (s && s.v === 1 && s.rec) return s; } catch (e) {}
  return { v: 1, rec: {} };
}
function recordStat(SK, num, entry) {
  const s = getStats(SK);
  if (s.rec[num]) return s;
  const s2 = { ...s, rec: { ...s.rec, [num]: entry } };
  try { localStorage.setItem(SK, JSON.stringify(s2)); } catch (e) {}
  return s2;
}
function deriveStats(s, todayNum) {
  const rec = s && s.rec ? s.rec : {};
  let cur = 0, at = rec[todayNum] ? todayNum : todayNum - 1;
  while (rec[at]) { cur++; at--; }
  return { played: Object.keys(rec).length, cur };
}
function mergeServerStats(SK, s, recent, puzzles) {
  if (!s || !Array.isArray(recent) || !recent.length) return s;
  const byQuiz = {};
  for (const p of puzzles) byQuiz[p.quizId] = p;
  let rec = s.rec, changed = false;
  for (const m of recent) {
    const p = m && byQuiz[m.quizId];
    if (!p || m.attempt !== 1 || rec[p.num]) continue;
    const sc = Math.max(0, Math.min(TOTAL, Math.round(((m.scorePct || 0) / 100) * TOTAL)));
    if (!changed) { rec = { ...rec }; changed = true; }
    rec[p.num] = { s: sc, t: TOTAL, won: sc > 0 };
  }
  if (!changed) return s;
  const s2 = { ...s, rec };
  try { localStorage.setItem(SK, JSON.stringify(s2)); } catch (e) {}
  return s2;
}

// A finished solo save for this game's day, or null. The run reads this to
// bank a game already played on its own page.
export function readDoneSave(key, num) {
  try {
    const s = JSON.parse(localStorage.getItem(`sot_${key}_${num}`) || 'null');
    if (s && s.v === 2 && Array.isArray(s.guesses) && s.status === 'done') return s;
  } catch (e) {}
  return null;
}

const HAPT = { tick: [12], win: [10, 40, 20, 40, 20, 60] };
function vibrate(p) { try { if (typeof navigator !== 'undefined' && navigator.vibrate) navigator.vibrate(p); } catch (e) {} }

// guesses holds cents, in order.
const freshState = () => ({ v: 2, guesses: [], status: 'playing', t0: null, tEnd: null });

// THE PHOTO. Pricer's product sits cut out on a white mat beside its name;
// every other game leads with a full-width photo, and Realtor's three photos
// (curb, kitchen, one more room) swap into the hero from a strip of thumbs.
function Photos({ day, big }) {
  const imgs = Array.isArray(day.imgs) && day.imgs.length ? day.imgs : [];
  const [at, setAt] = useState(0);
  const [bad, setBad] = useState({});
  const cur = imgs[at] || imgs[0];
  if (!cur) return null;
  const fit = day.fit === 'cover' ? 'cover' : 'contain';
  return (
    <div className={`pg-photos${big ? ' big' : ''}`}>
      <div className={`pg-hero ${fit}`}>
        {bad[at] ? (
          <div className="pg-miss">{day.name}</div>
        ) : (
          <img src={cur.src} alt={cur.label ? `${day.name}: ${cur.label}` : day.name} draggable={false} referrerPolicy="no-referrer"
            onError={() => setBad((b) => ({ ...b, [at]: true }))} />
        )}
        {cur.label && imgs.length > 1 && <span className="pg-lab">{cur.label}</span>}
      </div>
      {imgs.length > 1 && (
        <div className="pg-thumbs" role="tablist" aria-label="Photos">
          {imgs.map((im, i) => (
            <button key={i} type="button" role="tab" aria-selected={i === at} className={i === at ? 'on' : ''} onClick={() => setAt(i)}>
              <img src={im.src} alt={im.label || `Photo ${i + 1}`} draggable={false} referrerPolicy="no-referrer" />
              <span>{im.label}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export default function PriceGame({ game = 'pricer', puzzles = [], dayByNum = {}, forceNum = null, run = null }) {
  const CFG = PRICE_GAMES[game] || PRICE_GAMES.pricer;
  const KEY = CFG.key;
  const NAME = CFG.name;
  const PATH = CFG.path;
  const RUN = !!run;
  const PRACTICE = !!(run && run.practice);
  const HELP_KEY = `sot_${KEY}_help_seen`;
  const STATS_KEY = statsKeyOf(KEY);
  const PUZZLE = useMemo(() => pickPuzzle(puzzles, forceNum), [puzzles, forceNum]);
  const DAY = dayByNum[PUZZLE.num] || null;
  const PRICE = DAY ? DAY.price : 1;
  const STORE_KEY = `sot_${KEY}_${PUZZLE.num}`;

  const [g, setG] = useState(() => freshState());
  const gRef = useRef(g);
  const [now, setNow] = useState(() => Date.now());
  const [q, setQ] = useState('');
  const caretRef = useRef(null);
  const [notice, setNotice] = useState(null);
  const [showHelp, setShowHelp] = useState(false);
  const [gateRules, setGateRules] = useState(false);
  const [copied, setCopied] = useState(false);
  const [revealed, setRevealed] = useState(false);
  // THE ITEM POP-UP (owner, 2026-10-01). Once the finish curtain has landed,
  // the item itself comes up over it with its price, the date that price was
  // read, and the link. Once per page load.
  const [showProduct, setShowProduct] = useState(false);
  const productShownRef = useRef(false);
  const [shareCta, setShareCta] = useState('Share');
  useEffect(() => { if (contestIsLive()) setShareCta(`Share for ${CONTEST.prizeLabel}*`); }, []);
  const [hydrated, setHydrated] = useState(false);
  const [identity, setIdentity] = useState(null);
  const [stats, setStats] = useState(null);
  const [countdown, setCountdown] = useState('');
  const [installEvt, setInstallEvt] = useState(null);
  const [showA2hsHelp, setShowA2hsHelp] = useState(false);
  const [standalone, setStandalone] = useState(false);
  const [mobileUi, setMobileUi] = useState(false);
  const [showChrome, setShowChrome] = useState(false);
  const searchParams = useSearchParams();
  const { duelToken, duelInfo, duelSubmitted } = useDuelContext(PUZZLE.quizId, searchParams);
  const viewedRef = useRef(false);
  const noticeRef = useRef(null);
  const inputRef = useRef(null);
  // Put the caret back where the player was typing after a regroup moves commas.
  useLayoutEffect(() => {
    const el = inputRef.current; const sig = caretRef.current;
    if (el == null || sig == null) return;
    caretRef.current = null;
    if (document.activeElement !== el) return;
    const p = caretAfter(q, sig);
    try { el.setSelectionRange(p, p); } catch (e) {}
  }, [q]);
  const runDoneRef = useRef(false);

  const playing = g.status === 'playing';
  const preStart = playing && !g.t0;
  const started = playing && !!g.t0;
  const focusMode = playing && !showChrome;
  const LOFT = true;
  const STAGE = RUN || isStage(KEY, searchParams);
  const [stageTheme] = useStageTheme();
  const STAGE_C = STAGE ? 'var(--stg-acc)' : gameColor(KEY);
  const STAGE_ACC = { '--stg-acc-dk': gameColor(KEY), '--stg-acc-lt': gameColorLight(KEY), '--stg-onramp-lt': gameOnrampLight(KEY), '--stg-acc-ink-lt': gameAccentInkLight(KEY) };
  const Cap = STAGE ? StageChrome : LoftCap;
  const INK = STAGE ? 'var(--stg-ink,#e9edf4)' : COLORS.ink;
  const FADED = STAGE ? 'var(--stg-mute,#8b95a8)' : COLORS.faded;
  const SURF = STAGE ? 'var(--stg-surf,rgba(255,255,255,0.045))' : T.white;
  const SURF_B = STAGE ? 'var(--stg-line,rgba(255,255,255,0.11))' : 'rgba(28,30,36,0.42)';
  const ACC_INK = STAGE ? 'var(--stg-acc-ink)' : COLORS.accent;
  // Inside the Price Check run the page is always the Gauntlet's dark register
  // (owner, 2026-10-01), whatever the reader's stored stage theme says, so the
  // panels must be dark too or they paint white under light ink.
  const darkReg = STAGE && (RUN || stageTheme !== 'light');
  // The photo mat is white in BOTH registers on purpose: product shots are
  // cut out on white, and a dark mat would ring every one of them. Artwork
  // and photos that do not fill the frame sit on a warm gallery wall instead.
  // THE PANELS POP (owner, 2026-10-01): the item, the input and every guess
  // row sit on their own lifted panel with a rule and a shadow, one value per
  // register, because the stage ground and its 4% surface read as one colour.
  const MAT = { '--pr-mat': KEY === 'pricer' ? '#ffffff' : (darkReg ? '#1d2230' : '#ece8df'), '--pr-buy': '#f0b23a',
    ...(darkReg
      ? { '--pr-panel': '#181e2d', '--pr-panel-line': 'rgba(255,255,255,0.22)', '--pr-shadow': '0 10px 26px rgba(0,0,0,0.5)' }
      : { '--pr-panel': '#ffffff', '--pr-panel-line': 'rgba(11,15,26,0.18)', '--pr-shadow': '0 8px 22px rgba(15,23,42,0.12)' }) };
  const HEAT = darkReg
    ? { '--pr-freezing': '#7dd3fc', '--pr-cold': '#93c5fd', '--pr-cool': '#c4b5fd', '--pr-warm': '#fbbf24', '--pr-hot': '#fb923c', '--pr-burning': '#f87171' }
    : { '--pr-freezing': '#0369a1', '--pr-cold': '#1d4ed8', '--pr-cool': '#6d28d9', '--pr-warm': '#a16207', '--pr-hot': '#c2410c', '--pr-burning': '#b91c1c' };

  const tries = g.guesses.map((c) => ({ c, e: errOf(c, PRICE), up: c < PRICE }));
  const best = tries.reduce((m, x) => (!m || x.e < m.e ? x : m), null);
  const score = best ? scoreOf(best.e) : 0;
  const left = GUESSES - tries.length;
  const outcome = score >= 5 ? 'won' : 'lost';

  useEffect(() => { gRef.current = g; }, [g]);

  useEffect(() => {
    if (RUN) return undefined;
    try {
      setStandalone(window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true);
      setMobileUi(isMobileDevice());
    } catch {}
    const onBip = (e) => { e.preventDefault(); setInstallEvt(e); };
    const onInstalled = () => { setStandalone(true); setInstallEvt(null); };
    window.addEventListener('beforeinstallprompt', onBip);
    window.addEventListener('appinstalled', onInstalled);
    return () => { window.removeEventListener('beforeinstallprompt', onBip); window.removeEventListener('appinstalled', onInstalled); };
  }, [RUN]);
  const a2hsClick = () => { const e = installEvt; if (e) { setInstallEvt(null); e.prompt(); } else { setShowA2hsHelp(true); } };

  useEffect(() => {
    try {
      const raw = PRACTICE ? null : localStorage.getItem(STORE_KEY);
      if (raw) {
        const saved = JSON.parse(raw);
        // v 2 only: a bracket-era save at this key must never resume here.
        if (saved && saved.v === 2 && Array.isArray(saved.guesses)) {
          const next = { ...freshState(), ...saved };
          gRef.current = next;
          setG(next);
        }
      }
      setGateRules(!localStorage.getItem(HELP_KEY));
    } catch (e) {}
    try { setStats(getStats(STATS_KEY)); } catch (e) {}
    setHydrated(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  // In the run the board starts the moment it mounts: the run's own gate was
  // the start.
  useEffect(() => {
    if (!RUN || !hydrated) return;
    const cur = gRef.current;
    if (cur.status === 'playing' && !cur.t0) startGame();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [RUN, hydrated]);
  useEffect(() => {
    if (!hydrated || PRACTICE) return;
    try { localStorage.setItem(STORE_KEY, JSON.stringify(g)); } catch (e) {}
    try {
      if (PUZZLE.num === pickPuzzle(puzzles, null).num) {
        const done = g.status !== 'playing';
        if (done || g.t0) localStorage.setItem(`sot_${KEY}_day`, JSON.stringify({ d: etToday(), done }));
        else localStorage.removeItem(`sot_${KEY}_day`);
      }
    } catch (e) {}
  }, [g, hydrated, STORE_KEY, PUZZLE, puzzles, KEY, PRACTICE]);

  // The run hears about the finish once the rows have had a beat on screen.
  useEffect(() => {
    if (!RUN || !hydrated || g.status === 'playing' || runDoneRef.current) return undefined;
    runDoneRef.current = true;
    const bps = bpsOf(g);
    const secs = g.t0 ? Math.max(1, Math.round(((g.tEnd || Date.now()) - g.t0) / 1000)) : 0;
    const t = setTimeout(() => { try { run.onDone && run.onDone({ key: KEY, score: bps == null ? 0 : scoreOf(bps / 10000), bps, guesses: g.guesses.slice(), secs, practice: PRACTICE }); } catch (e) {} }, 1500);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [RUN, hydrated, g.status]);

  useEffect(() => {
    if (RUN || !hydrated || g.status === 'playing' || productShownRef.current) return undefined;
    const t = setTimeout(() => { productShownRef.current = true; setShowProduct(true); }, 2600);
    return () => clearTimeout(t);
  }, [RUN, hydrated, g.status]);
  useEffect(() => {
    if (!showProduct) return undefined;
    const onKey = (e) => { if (e.key === 'Escape') setShowProduct(false); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [showProduct]);

  useEffect(() => {
    if (RUN || g.status === 'playing') return undefined;
    const tick = () => setCountdown(fmtCountdown(msToMidnightET()));
    tick();
    const iv = setInterval(tick, 1000);
    return () => clearInterval(iv);
  }, [RUN, g.status]);

  useEffect(() => {
    try { const id = JSON.parse(localStorage.getItem('sot_quiz_identity')); if (id && id.email) setIdentity(id); } catch (e) {}
    if (RUN) return;
    try {
      const anon = getAnonId();
      let em = '';
      try { const idj = JSON.parse(localStorage.getItem('sot_quiz_identity') || 'null'); if (idj && idj.email) em = `&email=${encodeURIComponent(idj.email)}`; } catch (e) {}
      if (anon || em) {
        meRequest(`/api/quiz/me?anonId=${encodeURIComponent(anon || '')}${em}&history=1`)
          .then((r) => r.json())
          .then((d) => { if (d && Array.isArray(d.recent)) setStats((cur) => mergeServerStats(STATS_KEY, cur || getStats(STATS_KEY), d.recent, puzzles)); })
          .catch(() => {});
      }
    } catch (e) {}
    if (!viewedRef.current) {
      viewedRef.current = true;
      fetch('/api/quiz/view', { method: 'POST', keepalive: true, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ quizId: PUZZLE.quizId }) }).catch(() => {});
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!started || !playing) return undefined;
    const iv = setInterval(() => setNow(Date.now()), 500);
    return () => clearInterval(iv);
  }, [started, playing]);

  const elapsed = g.t0 ? fmtTime((g.tEnd || now) - g.t0) : '0:00';
  const isTodays = PUZZLE.num === pickPuzzle(puzzles, null).num;
  const soloDone = !RUN && !playing;
  const iq = useIqStanding({ game: KEY, quizId: PUZZLE.quizId, active: soloDone });
  const nextUp = useNextUnplayed({ self: KEY, active: soloDone });
  const upNext = useUnplayedSimilar({ self: KEY, active: soloDone });
  const dailyBoard = useDailyBoard({ quizId: PUZZLE.quizId, active: soloDone });
  const allTime = useGameAllTime({ game: KEY, active: soloDone });
  const dayStats = useDayStats();
  const catRank = useCategoryRank({ self: KEY, active: soloDone });
  const prevPuzzle = puzzles.find((x) => x.num === PUZZLE.num - 1) || null;
  const myStats = deriveStats(stats, pickPuzzle(puzzles, null).num);

  function bpsOf(cur) {
    const ts = cur.guesses.map((c) => errOf(c, PRICE));
    return ts.length ? Math.round(Math.min(...ts) * 10000) : null;
  }
  const REC_KEY = `sot_${KEY}_rec_${PUZZLE.num}`;
  const abandon = useAbandonFlush(() => {
    if (PRACTICE) return null;
    const cur = gRef.current;
    if (!cur.t0 || cur.status !== 'playing' || !cur.guesses.length) return null;
    try { if (localStorage.getItem(REC_KEY)) return null; } catch (e) {}
    const el = Math.min(36000, Math.max(1, Math.round((Date.now() - (cur.t0 || Date.now())) / 1000)));
    try { localStorage.setItem(REC_KEY, '1'); } catch (e) {}
    return { quizId: PUZZLE.quizId, score: 0, total: TOTAL, correct: 0, guessesUsed: cur.guesses.length, timeElapsed: el, abandoned: true, email: identity?.email || undefined, anonId: getAnonId(), isMobile: isMobileDevice(), referrer: (typeof document !== 'undefined' ? document.referrer : '') };
  });

  function postResult(g2) {
    abandon.markFlushed();
    if (PRACTICE) return;
    const el = g2.t0 ? Math.max(1, Math.round(((g2.tEnd || Date.now()) - g2.t0) / 1000)) : 1;
    const bps = bpsOf(g2);
    const sc = bps == null ? 0 : scoreOf(bps / 10000);
    try { setStats(recordStat(STATS_KEY, PUZZLE.num, { s: sc, t: TOTAL, won: sc > 0, b: bps })); } catch (e) {}
    try { localStorage.setItem(REC_KEY, '1'); } catch (e) {}
    try {
      fetch('/api/quiz/result', {
        method: 'POST', keepalive: true, headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ quizId: PUZZLE.quizId, score: sc, total: TOTAL, correct: sc, guessesUsed: g2.guesses.length, priceTiebreak: bps == null ? undefined : bps, timeElapsed: el, email: identity?.email || undefined, anonId: getAnonId(), isMobile: isMobileDevice(), referrer: (typeof document !== 'undefined' ? document.referrer : ''), ...(RUN ? { circuit: 'pricecheck' } : {}) }),
      }).catch(() => {});
    } catch (e) {}
  }

  function resetGame() {
    try { localStorage.removeItem(STORE_KEY); } catch (e) {}
    setG(freshState()); gRef.current = freshState();
    setQ(''); setNotice(null); setRevealed(false);
  }
  function commit(next) { gRef.current = next; setG(next); }
  function startGame() {
    const cur = gRef.current;
    if (cur.t0) return;
    commit({ ...cur, t0: Date.now() });
    setNow(Date.now());
    try { localStorage.setItem(HELP_KEY, '1'); } catch (e) {}
    setTimeout(() => { try { inputRef.current && inputRef.current.focus({ preventScroll: true }); } catch (e) {} }, 50);
  }
  function say(msg, kind) {
    setNotice({ msg, kind: kind || 'note' });
    if (noticeRef.current) clearTimeout(noticeRef.current);
    noticeRef.current = setTimeout(() => setNotice(null), 2600);
  }

  function guess() {
    const cur = gRef.current;
    if (cur.status !== 'playing' || !cur.t0) return;
    const c = parseGuess(q);
    if (c == null) { say('Type a dollar amount, like 24.99, 1,250 or 45k. That cost you nothing.'); return; }
    if (cur.guesses.includes(c)) { say(`You already guessed ${fmtCents(c)}. That cost you nothing.`); return; }
    setQ('');
    const guesses = [...cur.guesses, c];
    const e = errOf(c, PRICE);
    const done = e <= 0.01 || guesses.length >= GUESSES;
    if (done) {
      const fin = { ...cur, guesses, status: 'done', tEnd: Date.now() };
      vibrate(HAPT.win);
      postResult(fin);
      commit(fin);
      return;
    }
    vibrate(HAPT.tick);
    commit({ ...cur, guesses });
    setTimeout(() => { try { inputRef.current && inputRef.current.focus({ preventScroll: true }); } catch (err) {} }, 30);
  }

  function shareUrl() { return withRef(`mindloftdaily.com${PATH}${isTodays ? '' : `?p=${PUZZLE.num}`}`); }
  function shareText() {
    const lines = tries.map((x) => { const b = bandOf(x.e); return b.key === 'bull' ? 'Bullseye' : `${x.up ? '▲' : '▼'} ${b.label}`; });
    const streakBit = isTodays && myStats.cur >= 2 ? ` · streak ${myStats.cur}` : '';
    return `${NAME} #${PUZZLE.num} · ${score}/10 · ${best ? pctLabel(best.e) : ''}${streakBit}\n${lines.join('\n')}\n${shareUrl()}`;
  }
  function copyShare() {
    const text = playing
      ? `${NAME} #${PUZZLE.num}: ${CFG.lead} The daily price game from Mind Loft.\n${shareUrl()}`
      : shareText();
    if (notifyShareCredit(text)) return;
    try { if (typeof navigator !== 'undefined' && navigator.share && isMobileDevice()) { navigator.share({ text }).catch(() => {}); return; } } catch (e) {}
    try { navigator.clipboard?.writeText(text).then(() => { setCopied(true); setTimeout(() => setCopied(false), 1800); }); } catch (e) {}
  }

  const rulesBody = (
    <DailyRules
      accent={COLORS.accent} accentSoft={COLORS.accentSoft}
      lead={CFG.lead}
      steps={[
        <><b>Five guesses.</b> After each one you get an arrow, <b>higher</b> or <b>lower</b>, and how hot you are: Freezing, Cold, Cool, Warm, Hot, Burning.</>,
        <>Your score is your <b>closest guess</b>, 0 to 10. Within 1% is a <b>bullseye</b>: it scores 10 and ends the day early.</>,
        <>Close is measured as a ratio, so guessing <b>half the price is as far off as guessing double</b>. Within 5% scores 8, within 15% scores 6, within 50% scores 3.</>,
        <>The price is {CFG.basis}, read on the date shown with the item.</>,
        <>Ties on the board go to the closer guess, then fewer guesses, then time. <b>Price Check</b> plays all five price games back to back.</>,
      ]}
      knack="Bracket it. A guess that comes back Cold is off by more than 75%, so your next one should move a long way; save the small steps for Hot and Burning. You can type 1.2k for $1,200 or 3.5m for $3,500,000."
      footer={KEY === 'pricer' ? 'Product links go to the listing; Amazon links carry our affiliate tag, which never changes the price.' : 'Links go to the source we priced from.'}
    />
  );

  if (!DAY) return null;
  const hero = KEY !== 'pricer';
  const shownName = playing && DAY.hideName ? DAY.name : (DAY.revealName || DAY.name);

  const guessRow = (i) => {
    const x = tries[i];
    if (!x) {
      return (
        <div key={i} className="pr-row empty">
          <span className="n">{i + 1}</span><span className="g">&nbsp;</span><span /><span />
        </div>
      );
    }
    const b = bandOf(x.e);
    const fill = Math.max(6, Math.min(100, 100 - Math.log10(1 + x.e * 10) * 48));
    return (
      <div key={i} className="pr-row" style={{ '--row-c': b.col }}>
        <span className="n">{i + 1}</span>
        <span className="g">{fmtCents(x.c)}</span>
        <span className="dir" style={{ color: b.col }}>
          {b.key === 'bull' ? '' : x.up ? <><ArrowUp size={14} strokeWidth={3} /> higher</> : <><ArrowDown size={14} strokeWidth={3} /> lower</>}
        </span>
        <span className="heat">
          <b style={{ color: b.col }}>{b.label}</b>
          <span className="bar"><i style={{ width: `${fill}%`, background: b.col }} /></span>
        </span>
      </div>
    );
  };

  const CSS = `
          @media(max-width:560px){.pr-wrap{padding-left:10px !important;padding-right:10px !important;}}
          .pr-btn{font-family:${SANS};font-weight:800;font-size:14px;border:2px solid ${STAGE ? 'var(--stg-line2)' : 'var(--blue-deep)'};background:${STAGE ? 'transparent' : 'var(--white)'};color:${STAGE ? 'var(--stg-ink)' : 'var(--blue-deep)'};border-radius:8px;padding:9px 16px;cursor:pointer;display:inline-flex;align-items:center;gap:7px;}
          .pr-prod{display:flex;gap:16px;align-items:center;background:var(--pr-panel);border:1.5px solid var(--pr-panel-line);border-left:5px solid var(--stg-acc, ${COLORS.accent});border-radius:14px;padding:12px 16px 12px 12px;box-shadow:var(--pr-shadow);}
          .pr-prod.hero{display:block;padding:10px 10px 14px;border-left-width:1.5px;border-top:5px solid var(--stg-acc, ${COLORS.accent});}
          .pr-prod.hero .pr-txt{padding:12px 6px 0;}
          .pg-photos{flex:0 0 150px;}
          .pg-hero{height:150px;border-radius:10px;background:var(--pr-mat);display:flex;align-items:center;justify-content:center;overflow:hidden;position:relative;}
          .pg-photos.big .pg-hero{height:auto;aspect-ratio:16/10;max-height:360px;}
          .pg-hero img{max-width:94%;max-height:94%;object-fit:contain;display:block;}
          .pg-hero.cover img{max-width:none;max-height:none;width:100%;height:100%;object-fit:cover;}
          .pg-photos.big .pg-hero.contain img{max-width:96%;max-height:96%;}
          .pg-miss{padding:12px;text-align:center;font-size:12.5px;font-weight:800;color:${FADED};}
          .pg-lab{position:absolute;left:10px;bottom:10px;font-family:${MONO};font-size:10px;letter-spacing:.12em;text-transform:uppercase;background:rgba(6,10,20,.66);color:#fff;padding:4px 8px;border-radius:5px;}
          .pg-thumbs{display:grid;grid-template-columns:repeat(3,1fr);gap:6px;margin-top:6px;}
          .pg-thumbs button{position:relative;padding:0;border:2px solid transparent;border-radius:8px;overflow:hidden;cursor:pointer;background:var(--pr-mat);height:62px;}
          .pg-thumbs button.on{border-color:var(--stg-acc, ${COLORS.accent});}
          .pg-thumbs img{width:100%;height:100%;object-fit:cover;display:block;opacity:.8;}
          .pg-thumbs button.on img{opacity:1;}
          .pg-thumbs span{position:absolute;left:0;right:0;bottom:0;font-family:${MONO};font-size:9px;letter-spacing:.1em;text-transform:uppercase;background:rgba(6,10,20,.62);color:#fff;padding:2px 4px;text-align:left;}
          .pg-facts{display:flex;flex-wrap:wrap;gap:6px;margin:8px 0 6px;}
          .pg-facts span{font-weight:800;font-size:12.5px;color:${INK};border:1.5px solid var(--pr-panel-line);border-radius:999px;padding:4px 10px;background:color-mix(in srgb, var(--stg-acc, ${COLORS.accent}) 9%, transparent);}
          .pr-eb{font-family:${MONO};font-size:10.5px;letter-spacing:.12em;text-transform:uppercase;}
          .pr-name{margin:4px 0 6px;font-size:19px;line-height:1.25;font-weight:800;color:${INK};}
          .pr-ask{margin-top:16px;display:flex;gap:10px;}
          .pr-money{flex:1;display:flex;align-items:center;border:2.5px solid var(--stg-cell-line, rgba(28,30,36,0.4));border-radius:12px;background:var(--pr-panel);padding:0 14px;box-shadow:var(--pr-shadow);}
          .pr-money:focus-within{border-color:var(--stg-acc, ${COLORS.accent});}
          .pr-money span{font-weight:900;font-size:22px;color:${FADED};}
          .pr-money input{flex:1;min-width:0;border:0;outline:0;background:transparent;color:${INK};font:900 23px ${SANS};padding:14px 8px;font-variant-numeric:tabular-nums;}
          .pr-go{font:900 16px ${SANS};border:0;border-radius:12px;padding:0 26px;box-shadow:var(--pr-shadow);cursor:pointer;background:var(--stg-acc, ${COLORS.accent});color:var(--stg-onramp, #ffffff);}
          .pr-rows{margin-top:12px;display:flex;flex-direction:column;gap:8px;}
          .pr-row{display:grid;grid-template-columns:22px 1fr auto 104px;align-items:center;gap:10px;border:1.5px solid var(--pr-panel-line);border-left:5px solid var(--row-c, var(--pr-panel-line));border-radius:11px;padding:12px 14px;background:var(--pr-panel);box-shadow:var(--pr-shadow);}
          .pr-row.empty{background:transparent;border:1.5px dashed var(--stg-cell-line, rgba(28,30,36,0.4));box-shadow:none;}
          .pr-row .n{font-family:${MONO};font-size:12px;font-weight:500;color:${FADED};}
          .pr-row .g{font-weight:900;font-size:19px;font-variant-numeric:tabular-nums;color:${INK};}
          .pr-row .dir{font-weight:900;font-size:14px;white-space:nowrap;display:inline-flex;align-items:center;gap:3px;}
          .pr-row .heat{display:flex;flex-direction:column;gap:4px;}
          .pr-row .heat b{align-self:flex-end;font-family:${MONO};font-weight:500;font-size:10.5px;letter-spacing:.12em;text-transform:uppercase;padding:2px 8px;border-radius:999px;background:color-mix(in srgb, currentColor 16%, transparent);border:1px solid color-mix(in srgb, currentColor 45%, transparent);}
          .pr-row .bar{height:7px;border-radius:3px;background:var(--stg-line, rgba(28,30,36,0.12));overflow:hidden;}
          .pr-row .bar i{display:block;height:100%;border-radius:3px;}
          .pr-buy{display:inline-flex;align-items:center;gap:7px;font:800 14px ${SANS};background:var(--pr-buy);color:#1f1300;text-decoration:none;border-radius:9px;padding:10px 16px;}
          .pr-ladder{margin-top:14px;display:grid;grid-template-columns:repeat(auto-fill,minmax(78px,1fr));gap:5px;font-family:${MONO};font-size:10.5px;}
          .pr-ladder div{border:1px solid var(--stg-line, rgba(28,30,36,0.18));border-radius:6px;padding:5px 7px;color:${FADED};}
          .pr-ladder div.on{border-color:var(--stg-acc, ${COLORS.accent});color:${INK};}
          .pr-ladder b{display:block;font-family:${SANS};font-size:14px;font-weight:800;}
          @media(max-width:480px){.pr-prod{flex-direction:column;align-items:stretch;}.pg-photos{flex-basis:auto;}.pg-hero{height:210px;}.pr-row{grid-template-columns:18px 1fr auto 74px;}}
        `;

  // THE BOARD: the item, the input, the five rows and (once done) the price.
  const board = (
    <div className={STAGE ? 'stg-board' : 'loft-card'} style={{ background: SURF, border: STAGE ? `1px solid ${SURF_B}` : `2px solid ${COLORS.ink}`, borderRadius: 10, padding: RUN ? '0' : '15px', marginBottom: 12, ...(RUN ? { background: 'transparent', border: 0 } : null) }}>
      <div className={`pr-prod${hero ? ' hero' : ''}`}>
        <Photos day={DAY} big={hero} />
        <div className="pr-txt" style={{ minWidth: 0 }}>
          <div className="pr-eb" style={{ color: ACC_INK }}>{DAY.cat}</div>
          <h2 className="pr-name">{shownName}</h2>
          {Array.isArray(DAY.facts) && DAY.facts.length > 0 && (
            <div className="pg-facts">{DAY.facts.map((f, i) => <span key={i}>{f}</span>)}</div>
          )}
          <div style={{ fontSize: 12.5, color: FADED, fontWeight: 600 }}>
            {DAY.line} {DAY.asOfShort ? <>· <b style={{ color: INK }}>{DAY.asOfShort}</b></> : null}
          </div>
        </div>
      </div>

      {playing && started && (
        <>
          <div className="pr-ask">
            <label className="pr-money">
              <span>$</span>
              <input ref={inputRef} type="text" inputMode="decimal" autoComplete="off" value={q}
                onChange={(e) => {
                  const el = e.target; const raw = el.value;
                  const pos = el.selectionStart == null ? raw.length : el.selectionStart;
                  caretRef.current = raw.slice(0, pos).replace(/[^0-9.kmbKMB]/g, '').length;
                  setQ(groupGuess(raw));
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') { e.preventDefault(); guess(); return; }
                  // Backspace or Delete next to a comma removes the digit beside it,
                  // instead of a comma that would only be put straight back.
                  const el = e.target; const a = el.selectionStart, b = el.selectionEnd;
                  if (a == null || a !== b) return;
                  if (e.key === 'Backspace' && a > 0 && el.value[a - 1] === ',') el.setSelectionRange(a - 1, a - 1);
                  else if (e.key === 'Delete' && el.value[a] === ',') el.setSelectionRange(a + 1, a + 1);
                }}
                placeholder={left === 1 ? 'Last guess' : 'Your guess'} aria-label="Your price guess in dollars" />
            </label>
            <button type="button" className="pr-go" onClick={guess}>Guess</button>
          </div>
          <div style={{ minHeight: 19, marginTop: 6, fontSize: 12.5, fontWeight: 700, color: FADED }}>
            {notice ? notice.msg
              : tries.length ? (() => { const x = tries[tries.length - 1]; const b = bandOf(x.e); return <>{b.label}. Go <b style={{ color: INK }}>{x.up ? 'higher' : 'lower'}</b>. {left} guess{left === 1 ? '' : 'es'} left.</>; })()
              : <>Type a price and press Enter. Big numbers: 45k or 2.5m works.</>}
          </div>
        </>
      )}

      {/* NEWEST GUESS ON TOP (owner, 2026-10-01): the latest guess takes the first
          row and older ones shift down, so the one you just made is always on
          screen. Unused slots stay below the guesses. Each row keeps its own
          guess number. */}
      <div className="pr-rows">{[...tries.map((_, i) => tries.length - 1 - i), ...Array.from({ length: Math.max(0, GUESSES - tries.length) }, (_, j) => tries.length + j)].map((i) => guessRow(i))}</div>

      {!playing && (
        <div style={{ marginTop: 14, borderTop: `1px solid ${SURF_B}`, paddingTop: 14 }}>
          <div className="pr-eb" style={{ color: FADED }}>The price{PRACTICE ? ' (practice, your first score stands)' : ''}</div>
          <div style={{ fontSize: 34, fontWeight: 900, letterSpacing: '-0.02em', color: INK }}>{fmtCents(PRICE)}</div>
          <div style={{ fontSize: 15, fontWeight: 800, color: ACC_INK, marginTop: 2 }}>
            {score}/10 · your closest was {best ? fmtCents(best.c) : '—'}, {best ? pctLabel(best.e) : ''}
          </div>
          {!RUN && (
            <>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 12 }}>
                <a className="pr-buy" href={DAY.href} target="_blank" rel={DAY.sponsored ? 'noopener sponsored' : 'noopener'}>
                  {DAY.buy} <ExternalLink size={14} />
                </a>
              </div>
              <div className="pr-ladder">
                {[[10, '≤1%'], [9, '≤2.5%'], [8, '≤5%'], [7, '≤10%'], [6, '≤15%'], [5, '≤25%'], [4, '≤35%'], [3, '≤50%'], [2, '≤75%'], [1, '≤100%'], [0, 'beyond']].map(([s, l]) => (
                  <div key={s} className={s === score ? 'on' : ''}><b>{s}</b>{l}</div>
                ))}
              </div>
              <div style={{ marginTop: 10, fontSize: 11.5, color: FADED, fontWeight: 600, lineHeight: 1.5 }}>
                {DAY.asOf} {DAY.credit ? (DAY.creditUrl ? <a href={DAY.creditUrl} target="_blank" rel="noopener" style={{ color: FADED }}>{DAY.credit}</a> : DAY.credit) : null}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );

  if (RUN) {
    return (
      <div className="pg-run" style={{ ...HEAT, ...MAT, fontFamily: SANS }}>
        <style dangerouslySetInnerHTML={{ __html: CSS }} />
        {board}
      </div>
    );
  }

  return (
    <div className={STAGE ? 'stage-page' : 'loft-page'}
      data-stage-theme={STAGE ? stageTheme : undefined}
      style={{ ...(STAGE ? STAGE_ACC : null), ...HEAT, ...MAT, minHeight: '100vh', background: STAGE ? 'var(--stg-ground)' : T.surface, color: STAGE ? 'var(--stg-ink,#e9edf4)' : undefined, position: 'relative', overflowX: 'hidden' }}>
      {!STAGE && <Grain />}
      {!STAGE && <DailyChrome slug={KEY} name={NAME} collapsed={started} loft={LOFT} />}
      <Cap gameKey={KEY} quizId={PUZZLE.quizId}
        name={NAME}
        cat="Numbers"
        outcome={playing ? null : outcome}
        num={PUZZLE.num}
        tiles={playing ? null : upNext}
        dateLabel={PUZZLE.dateLabel}
        onHelp={() => setShowHelp(true)}
        figures={playing ? [
          { v: String(left), k: 'guesses left' },
          { v: elapsed, k: 'time' },
          { v: best ? String(score) : '—', k: 'best' },
        ] : [
          { v: `${score}/10`, k: 'score' },
          { v: `${tries.length}/${GUESSES}`, k: 'guesses' },
          { v: elapsed, k: 'time' },
        ]}
      />
      <div className="pr-wrap" style={{ position: 'relative', zIndex: 2, maxWidth: 1180, margin: '0 auto', padding: '18px 38px 80px', fontFamily: SANS }}>
        <style dangerouslySetInnerHTML={{ __html: CSS }} />

        <div style={{ maxWidth: 560, margin: '0 auto' }}>
        <div className={STAGE ? undefined : 'loft-stage'}>
          <div className={!STAGE && !playing ? (revealed ? 'loft-flip' : 'loft-flip on') : undefined}>
          <div className={!STAGE && !playing ? 'loft-flip-in' : undefined}>
          <div className={!STAGE && !playing ? 'loft-face' : undefined}>

        {preStart && (
          <div className={STAGE ? 'stg-gate' : undefined} style={{ background: STAGE ? SURF : COLORS.cream, border: STAGE ? `1px solid ${SURF_B}` : `2px solid ${COLORS.ink}`, borderRadius: 12, padding: '22px', display: 'flex', flexDirection: 'column' }}>
            <div style={{ fontSize: 20, fontWeight: 800, color: INK, marginBottom: 10 }}>{gateRules ? 'How to play' : `${NAME} is ready`}</div>
            {gateRules ? rulesBody : (
              <div style={{ fontSize: 14, lineHeight: 1.55, color: INK, fontWeight: 600 }}>
                <p style={{ margin: '0 0 6px' }}>{CFG.lead} Five guesses; your closest is your score. The clock starts when you do.</p>
              </div>
            )}
            <div style={{ marginTop: 18, display: 'flex', flexDirection: 'row-reverse', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
              <button className="pr-btn" onClick={startGame} style={{ borderColor: STAGE ? STAGE_C : undefined, background: STAGE ? STAGE_C : T.cta, color: STAGE ? 'var(--stg-onramp, #08222e)' : T.white, fontSize: 15, padding: '11px 22px' }}>Start</button>
              <div>
                <button type="button" onClick={() => setGateRules((v) => !v)} style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', fontFamily: SANS, fontSize: 13, fontWeight: 700, color: FADED, textDecoration: 'underline' }}>
                  {gateRules ? 'Hide detailed instructions' : 'Show detailed instructions'}
                </button>
              </div>
            </div>
          </div>
        )}

        {!preStart && board}

          <div className={STAGE ? undefined : 'loft-sol'}>
          {!playing && (
            <div style={{ maxWidth: 472, margin: '0 auto' }}>
              <div style={{ fontSize: 15, fontWeight: 800, color: INK, margin: '8px 0 0' }}>
                {score === 10 ? <>Bullseye on guess {tries.length}.</> : score >= 7 ? <>Close: {pctLabel(best.e)}.</> : score >= 4 ? <>In the neighborhood.</> : <>Not your aisle today.</>}
              </div>
              {isTodays && myStats.cur >= 2 && (
                <div style={{ fontSize: 13, fontWeight: 800, margin: '12px 0 0', color: 'var(--stg-warn, #b45309)' }}>{myStats.cur}-day streak</div>
              )}
              <p className={STAGE ? undefined : 'loft-tailnote'} style={{ fontSize: 12, color: FADED, fontWeight: 600, margin: '12px 0 0' }}>
                {isTodays ? (
                  <>{countdown ? <>Next {NAME} in <b style={{ color: INK, fontVariantNumeric: 'tabular-nums' }}>{countdown}</b>.</> : `A new ${CFG.noun} drops at midnight Eastern.`}</>
                ) : (
                  <>You&rsquo;re playing the {PUZZLE.dateLabel} archive.{' '}<a href={PATH} style={{ color: COLORS.ember, fontWeight: 800, textDecoration: 'underline' }}>Back to today&rsquo;s {NAME} &rarr;</a></>
                )}
              </p>
            </div>
          )}
          </div>
          {!playing && revealed && (
            <button className={STAGE ? 'stf-hideboard' : 'loft-showopts'} onClick={() => setRevealed(false)}>&#8630; Hide game board</button>
          )}
          </div>
          {!playing && (
            <LoftFinish
              name={NAME}
              catRank={catRank}
              outcome={outcome}
              challengeMetric={best ? Math.round(best.e * 1000) / 10 : null}
              title={score === 10 ? 'Bullseye' : `${score} of 10`}
              detail={`${fmtCents(PRICE)} · closest ${best ? fmtCents(best.c) : '—'} · ${elapsed}`}
              iq={iq}
              board={dailyBoard}
              gameRank={allTime && allTime.ready
                ? { value: allTime.rank != null ? `#${Number(allTime.rank).toLocaleString()}` : '—',
                    label: allTime.field != null ? `of ${Number(allTime.field).toLocaleString()} ${NAME} all time` : 'all-time rank' }
                : null}
              day={dayStats}
              streak={isTodays ? myStats.cur : null}
              missLabel="Guesses"
              handoff={false}
              archive={puzzles
                .filter((p) => p.live <= etToday() && p.num !== PUZZLE.num)
                .sort((x, y) => y.num - x.num)
                .map((p) => ({
                  num: p.num, dateLabel: p.dateLabel, sunday: false, href: `${PATH}?p=${p.num}`,
                  done: !!(stats && stats.rec && stats.rec[p.num]),
                  score: (stats && stats.rec && stats.rec[p.num]) ? stats.rec[p.num].s : null,
                }))}
              options={[
                { label: copied ? 'Copied' : (shareCta || 'Share'), sub: 'Your hot and cold, not the price', kind: 'gold', onClick: copyShare },
                { tone: 'board', label: 'Return to board', sub: 'Your five guesses, hot and cold', onClick: () => setRevealed(true) },
                { tone: 'reveal', label: `See the ${CFG.noun}`, sub: `The price and the link · ${DAY.asOfShort || ''}`, onClick: () => setShowProduct(true) },
                { tone: 'similar', label: 'Play Price Check', sub: 'All five price games, one run', href: '/pricecheck' },
                prevPuzzle && { tone: 'another', label: `Play another ${NAME}`, sub: `No. ${prevPuzzle.num}, yesterday’s ${CFG.noun}`, href: `${PATH}?p=${prevPuzzle.num}` },
                nextUp && { tone: 'similar', label: 'Play similar', sub: `${nextUp.name} · ${nextUp.tag}`, href: nextUp.href },
                { tone: 'replay', label: 'Replay', sub: `This ${CFG.noun} again, unscored`, onClick: resetGame },
                { label: 'Back to main', sub: 'The day’s full board', tone: 'main', href: '/' },
              ]}
            />
          )}
          </div>
          </div>
        </div>

        {!STAGE && <GamePanel self={KEY} name={NAME} onShow={() => setShowChrome(true)} />}
        <div style={{ display: (focusMode && !STAGE) ? 'none' : 'block', margin: '30px auto 0' }}>
          <div className={STAGE ? undefined : 'loft-report'}>
            <ReportIssue self={KEY} name={NAME} accent="#ffffff" align="center" onHelp={() => setShowHelp(true)} />
          </div>
          {!focusMode && mobileUi && !standalone && (
            <button onClick={a2hsClick} style={{ marginTop: 10, width: '100%', fontFamily: SANS, fontSize: 13.5, letterSpacing: '0.05em', textTransform: 'uppercase', fontWeight: 800, height: 54, borderRadius: 10, border: 'none', background: `var(--stg-acc, ${COLORS.accent})`, color: `var(--stg-onramp, ${T.white})`, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 9, whiteSpace: 'nowrap' }}>
              <Smartphone size={15} strokeWidth={2.5} /> Add to Home Screen
            </button>
          )}
          {/* The finish card's stat cards land here, below Add to Home Screen (app/StageFinish.jsx). */}
          <div id="stf-stats-slot" />
        </div>
        {showA2hsHelp && (
          <div onClick={() => setShowA2hsHelp(false)} style={{ position: 'fixed', inset: 0, background: 'rgba(20,22,28,0.55)', zIndex: 90, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 18 }}>
            <div onClick={(e) => e.stopPropagation()} style={{ background: STAGE ? 'var(--stg-raise,#0e131f)' : T.white, borderRadius: 14, maxWidth: 430, width: '100%', padding: '22px 22px 16px', fontFamily: SANS, border: STAGE ? '1px solid var(--stg-line)' : '1.5px solid rgba(20,22,28,0.12)' }}>
              <div style={{ fontSize: 17, fontWeight: 800, color: INK, marginBottom: 8 }}>Add {NAME} to your Home Screen</div>
              <p style={{ margin: '0 0 4px', color: INK, fontSize: 14, lineHeight: 1.7 }}>Open your browser&apos;s menu and choose <b>Add to Home Screen</b> (on iPhone, tap <b>Share</b> first). The tile opens today&apos;s {CFG.noun}, every day.</p>
              <button onClick={() => setShowA2hsHelp(false)} style={{ marginTop: 10, fontFamily: SANS, fontSize: 12.5, letterSpacing: '0.05em', textTransform: 'uppercase', fontWeight: 700, height: 44, width: '100%', borderRadius: 10, border: 'none', background: COLORS.ink, color: T.white, cursor: 'pointer' }}>Got it</button>
            </div>
          </div>
        )}
        {!focusMode && !identity && (
          <div id="daily-join" style={{ margin: '18px auto 0' }}>
            <JoinLeaderboardForm hideIcon heading="See your stats and join the leaderboard" identity={identity} onJoined={(id) => setIdentity(id)} />
          </div>
        )}
        </div>
      </div>

      {showProduct && !playing && (
        <div className="pr-pop" onClick={() => setShowProduct(false)} role="dialog" aria-modal="true" aria-label={`${DAY.revealName || DAY.name}: the price`}>
          <style dangerouslySetInnerHTML={{ __html: `
            .pr-pop{position:fixed;inset:0;z-index:95;background:rgba(6,10,20,.62);display:flex;align-items:center;justify-content:center;padding:16px;animation:prfade .25s ease both;}
            .pr-popc{width:100%;max-width:420px;background:var(--stg-raise,#ffffff);border:1px solid var(--stg-line,rgba(20,22,28,.14));border-radius:16px;overflow:hidden;font-family:${SANS};box-shadow:0 24px 60px rgba(0,0,0,.35);animation:prrise .35s cubic-bezier(.2,.8,.2,1) both;max-height:92vh;overflow-y:auto;scrollbar-width:none;}
            .pr-popc::-webkit-scrollbar{display:none;}
            .pr-popi{background:var(--pr-mat);height:230px;display:flex;align-items:center;justify-content:center;position:relative;}
            .pr-popi img{max-width:86%;max-height:88%;object-fit:contain;}
            .pr-popi.cover img{max-width:none;max-height:none;width:100%;height:100%;object-fit:cover;}
            .pr-popx{position:absolute;top:10px;right:10px;width:34px;height:34px;border-radius:50%;border:0;background:rgba(6,10,20,.6);color:#fff;display:flex;align-items:center;justify-content:center;cursor:pointer;}
            @keyframes prfade{from{opacity:0}to{opacity:1}}
            @keyframes prrise{from{opacity:0;transform:translateY(18px) scale(.97)}to{opacity:1;transform:none}}
            @media(prefers-reduced-motion:reduce){.pr-pop,.pr-popc{animation:none;}}
          ` }} />
          <div className="pr-popc" onClick={(e) => e.stopPropagation()}>
            <div className={`pr-popi${DAY.fit === 'cover' ? ' cover' : ''}`}>
              {DAY.imgs && DAY.imgs[0] && <img src={DAY.imgs[0].src} alt={DAY.revealName || DAY.name} referrerPolicy="no-referrer" />}
              <button type="button" className="pr-popx" aria-label="Close" onClick={() => setShowProduct(false)}><X size={18} /></button>
            </div>
            <div style={{ padding: '16px 18px 18px' }}>
              <div className="pr-eb" style={{ color: ACC_INK }}>{DAY.cat}</div>
              <div style={{ fontSize: 17, fontWeight: 800, color: INK, lineHeight: 1.25, margin: '4px 0 10px' }}>{DAY.revealName || DAY.name}</div>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, flexWrap: 'wrap' }}>
                <span style={{ fontSize: 36, fontWeight: 900, letterSpacing: '-0.02em', color: INK }}>{fmtCents(PRICE)}</span>
                <span style={{ fontSize: 14, fontWeight: 800, color: ACC_INK }}>{score}/10{best ? ` · you said ${fmtCents(best.c)}` : ''}</span>
              </div>
              <div style={{ marginTop: 6, fontSize: 12.5, fontWeight: 700, color: FADED, lineHeight: 1.45 }}>{DAY.asOf}</div>
              <a className="pr-buy" href={DAY.href} target="_blank" rel={DAY.sponsored ? 'noopener sponsored' : 'noopener'} style={{ marginTop: 14, width: '100%', justifyContent: 'center', boxSizing: 'border-box' }}>
                {DAY.buy} <ExternalLink size={14} />
              </a>
              <button type="button" onClick={() => setShowProduct(false)} style={{ marginTop: 10, width: '100%', background: 'none', border: 'none', cursor: 'pointer', fontFamily: SANS, fontSize: 13, fontWeight: 700, color: FADED, textDecoration: 'underline' }}>Back to your results</button>
              {DAY.credit && <div style={{ marginTop: 8, fontSize: 10.5, color: FADED, fontWeight: 600 }}>{DAY.credit}</div>}
            </div>
          </div>
        </div>
      )}

      <DuelBanner token={duelToken} info={duelInfo} submitted={duelSubmitted} />

      {/* THE PRICE CHECK DOOR (owner, 2026-10-01): anyone who opens one of
          the five on its own page is offered the run first, on the gate,
          before a guess. See app/circuits/RunDoorPop.jsx for the rules. */}
      <RunDoorPop id="pricecheck" ready={hydrated && preStart && isTodays} self={NAME} />

      {showHelp && (
        <div onClick={() => { setShowHelp(false); try { localStorage.setItem(HELP_KEY, '1'); } catch (e) {} }}
          style={{ position: 'fixed', inset: 0, background: 'rgba(20,22,28,0.55)', zIndex: 70, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
          <div onClick={(e) => e.stopPropagation()} style={{ width: '100%', maxWidth: 460, background: STAGE ? 'var(--stg-raise,#0e131f)' : COLORS.cream, borderRadius: 12, border: STAGE ? '1px solid var(--stg-line)' : `2px solid ${COLORS.ink}`, padding: '20px 22px', fontFamily: SANS, maxHeight: '86vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', alignItems: 'center', marginBottom: 10 }}>
              <div style={{ fontSize: 21, fontWeight: 800, color: INK }}>How to play</div>
              <button onClick={() => { setShowHelp(false); try { localStorage.setItem(HELP_KEY, '1'); } catch (e) {} }} aria-label="Close" style={{ marginLeft: 'auto', background: 'none', border: 'none', cursor: 'pointer', color: FADED }}><X size={20} /></button>
            </div>
            {rulesBody}
            <button className="pr-btn" onClick={() => { setShowHelp(false); try { localStorage.setItem(HELP_KEY, '1'); } catch (e) {} }} style={{ marginTop: 14, background: COLORS.ink, color: T.white }}>Play</button>
          </div>
        </div>
      )}

      <StageFold />
      <section style={{ position: 'relative', display: (focusMode && !STAGE) ? 'none' : 'block', zIndex: 2, maxWidth: 620, margin: '0 auto', padding: '10px 24px 42px', fontFamily: SANS }}>
        <h2 style={{ margin: '0 0 8px', fontSize: 15, fontWeight: 800, letterSpacing: '-0.01em', color: INK }}>About {NAME}</h2>
        <p style={{ margin: '0 0 8px', fontSize: 13, lineHeight: 1.65, color: FADED, fontWeight: 600 }}>
          {NAME} is a free daily price-guessing game from Mind Loft. {CFG.how}
        </p>
        <p style={{ margin: '0 0 8px', fontSize: 13, lineHeight: 1.65, color: FADED, fontWeight: 600 }}>
          Everyone gets the same {CFG.noun}, so the leaderboard ranks your score, then exactly how close you got, then fewer guesses, then time. {NAME} is one of five games in <a href="/pricecheck" style={{ color: INK, fontWeight: 800 }}>Price Check</a>, which plays Pricer, Dealer, Realtor, Agent and Curator back to back for one score out of 50.
        </p>
        <p style={{ margin: 0, fontSize: 13, lineHeight: 1.65, color: FADED, fontWeight: 600 }}>
          A new {CFG.noun} drops every day at midnight Eastern. No app, no signup.
        </p>
      </section>

      {!STAGE && <div style={{ position: 'relative', zIndex: 2, display: focusMode ? 'none' : 'block' }}><Footer /></div>}
    </div>
  );
}
