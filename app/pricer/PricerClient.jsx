'use client';

// Pricer — the daily price game (relaunched 2026-10-02).
//
// One real product a day; guess what it costs. Five guesses, and after each one
// an arrow (higher or lower) and a heat label. The score is your CLOSEST guess,
// 0 to 10, measured as a RATIO, so guessing half the price is exactly as far off
// as guessing double. A guess within 1% is a bullseye: it scores 10 and ends the
// day early. Weekdays are Amazon products at the price Amazon showed on the day
// it was read; Sundays are the big-ticket edition at the maker's starting price.
//
// The board ranks on score, then on exact closeness (priceTiebreak, posted as
// the best guess's error in basis points, lower first; migration 50 and the
// pricer branch in lib/quiz-anon + lib/daily-combined), then fewer guesses,
// then time.
//
// The bank is resolved on the server and only the picked day ships, so
// tomorrow's price never reaches a browser.

import React, { useState, useEffect, useMemo, useRef } from 'react';
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

const COLORS = {
  cream: T.surface, ink: T.ink, ember: T.accent, rust: T.danger, faded: T.muted,
  accent: '#15803d', accentSoft: '#e9f7ee', green: T.successDeep,
};
const SANS = "'Manrope', system-ui, -apple-system, sans-serif";
const MONO = "'DM Mono', ui-monospace, 'SFMono-Regular', monospace";
const HELP_KEY = 'sot_pricer_help_seen';
const STATS_KEY = 'sot_pricer2_stats';
const GUESSES = 5;
const TOTAL = 10;

// Heat bands on the ratio error. The colours are meaning, so each band carries a
// stage token with a fallback; the thermometer runs blue (far) to red (near).
export const BANDS = [
  { max: 0.01, key: 'bull', label: 'Bullseye', col: 'var(--stg-good, #15803d)' },
  { max: 0.05, key: 'burning', label: 'Burning', col: 'var(--pr-burning)' },
  { max: 0.15, key: 'hot', label: 'Hot', col: 'var(--pr-hot)' },
  { max: 0.35, key: 'warm', label: 'Warm', col: 'var(--pr-warm)' },
  { max: 0.75, key: 'cool', label: 'Cool', col: 'var(--pr-cool)' },
  { max: 1.5, key: 'cold', label: 'Cold', col: 'var(--pr-cold)' },
  { max: Infinity, key: 'freezing', label: 'Freezing', col: 'var(--pr-freezing)' },
];
export const SCORE_TABLE = [[0.01, 10], [0.025, 9], [0.05, 8], [0.10, 7], [0.15, 6], [0.25, 5], [0.35, 4], [0.50, 3], [0.75, 2], [1.00, 1]];
export const errOf = (g, p) => Math.max(g / p, p / g) - 1;
export const bandOf = (e) => BANDS.find((b) => e <= b.max);
export const scoreOf = (e) => { for (const [m, s] of SCORE_TABLE) if (e <= m) return s; return 0; };
const pctLabel = (e) => (e < 0.001 ? 'dead on' : `${(Math.round(e * 1000) / 10).toLocaleString()}% off`);

// Cents in, dollars out; cents shown only when the figure has them.
function fmtCents(c) {
  const whole = Math.floor(c / 100), cents = c % 100;
  return `$${whole.toLocaleString('en-US')}${cents ? `.${String(cents).padStart(2, '0')}` : ''}`;
}
// "24.99", "$1,250", "135k", "1.2m" all parse; returns cents or null.
export function parseGuess(raw) {
  const s = String(raw || '').trim().toLowerCase().replace(/[$,\s]/g, '');
  const m = s.match(/^(\d+(?:\.\d*)?|\.\d+)([km])?$/);
  if (!m) return null;
  let v = Number(m[1]);
  if (m[2] === 'k') v *= 1e3;
  if (m[2] === 'm') v *= 1e6;
  const c = Math.round(v * 100);
  return c > 0 && c < 1e12 ? c : null;
}

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
function fmtGathered(iso) {
  try { return new Date(`${iso}T12:00:00Z`).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', timeZone: 'UTC' }); }
  catch (e) { return iso; }
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

function getStats() {
  try { const s = JSON.parse(localStorage.getItem(STATS_KEY)); if (s && s.v === 1 && s.rec) return s; } catch (e) {}
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
  let cur = 0, at = rec[todayNum] ? todayNum : todayNum - 1;
  while (rec[at]) { cur++; at--; }
  return { played: Object.keys(rec).length, cur };
}
function mergeServerStats(s, recent, puzzles) {
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
  try { localStorage.setItem(STATS_KEY, JSON.stringify(s2)); } catch (e) {}
  return s2;
}

const HAPT = { tick: [12], win: [10, 40, 20, 40, 20, 60] };
function vibrate(p) { try { if (typeof navigator !== 'undefined' && navigator.vibrate) navigator.vibrate(p); } catch (e) {} }

// guesses holds cents, in order.
const freshState = () => ({ v: 2, guesses: [], status: 'playing', t0: null, tEnd: null });

export default function PricerClient({ puzzles = [], dayByNum = {}, forceNum = null }) {
  const PUZZLE = useMemo(() => pickPuzzle(puzzles, forceNum), [puzzles, forceNum]);
  const DAY = dayByNum[PUZZLE.num] || null;
  const PRICE = DAY ? DAY.price : 1;
  const STORE_KEY = `sot_pricer_${PUZZLE.num}`;

  const [g, setG] = useState(() => freshState());
  const gRef = useRef(g);
  const [now, setNow] = useState(() => Date.now());
  const [q, setQ] = useState('');
  const [notice, setNotice] = useState(null);
  const [showHelp, setShowHelp] = useState(false);
  const [gateRules, setGateRules] = useState(false);
  const [copied, setCopied] = useState(false);
  const [revealed, setRevealed] = useState(false);
  // THE PRODUCT POP-UP (owner, 2026-10-01). Pricer's own ending: once the
  // finish curtain has landed, the product itself comes up over it with its
  // price, the date that price was read, and the link. Once per page load.
  const [showProduct, setShowProduct] = useState(false);
  const productShownRef = useRef(false);
  const [imgOk, setImgOk] = useState(null);
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

  const playing = g.status === 'playing';
  const preStart = playing && !g.t0;
  const started = playing && !!g.t0;
  const focusMode = playing && !showChrome;
  const LOFT = true;
  const STAGE = isStage('pricer', searchParams);
  const [stageTheme] = useStageTheme();
  const STAGE_C = STAGE ? 'var(--stg-acc)' : gameColor('pricer');
  const STAGE_ACC = { '--stg-acc-dk': gameColor('pricer'), '--stg-acc-lt': gameColorLight('pricer'), '--stg-onramp-lt': gameOnrampLight('pricer'), '--stg-acc-ink-lt': gameAccentInkLight('pricer') };
  const Cap = STAGE ? StageChrome : LoftCap;
  const INK = STAGE ? 'var(--stg-ink,#e9edf4)' : COLORS.ink;
  const FADED = STAGE ? 'var(--stg-mute,#8b95a8)' : COLORS.faded;
  const SURF = STAGE ? 'var(--stg-surf,rgba(255,255,255,0.045))' : T.white;
  const SURF_B = STAGE ? 'var(--stg-line,rgba(255,255,255,0.11))' : 'rgba(28,30,36,0.42)';
  const ACC_INK = STAGE ? 'var(--stg-acc-ink)' : COLORS.accent;
  // The heat ramp, one pair of values per register: the dark values read on
  // the dark ground and the light values on paper, both at 4.5:1 or better.
  const darkReg = STAGE && stageTheme !== 'light';
  // The photo mat is white in BOTH registers on purpose: product shots are
  // cut out on white, and a dark mat would ring every one of them. The buy
  // button is the same gold either way and carries its own dark ink.
  // THE PANELS POP (owner, 2026-10-01): the product, the input and every guess
  // row sit on their own lifted panel with a rule and a shadow, one value per
  // register, because the stage ground and its 4% surface read as one colour.
  const MAT = { '--pr-mat': '#ffffff', '--pr-buy': '#f0b23a',
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

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORE_KEY);
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
    try { setStats(getStats()); } catch (e) {}
    setHydrated(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  useEffect(() => {
    if (!hydrated) return;
    try { localStorage.setItem(STORE_KEY, JSON.stringify(g)); } catch (e) {}
    try {
      if (PUZZLE.num === pickPuzzle(puzzles, null).num) {
        const done = g.status !== 'playing';
        if (done || g.t0) localStorage.setItem('sot_pricer_day', JSON.stringify({ d: etToday(), done }));
        else localStorage.removeItem('sot_pricer_day');
      }
    } catch (e) {}
  }, [g, hydrated, STORE_KEY, PUZZLE, puzzles]);

  useEffect(() => {
    if (!hydrated || g.status === 'playing' || productShownRef.current) return undefined;
    const t = setTimeout(() => { productShownRef.current = true; setShowProduct(true); }, 2600);
    return () => clearTimeout(t);
  }, [hydrated, g.status]);
  useEffect(() => {
    if (!showProduct) return undefined;
    const onKey = (e) => { if (e.key === 'Escape') setShowProduct(false); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [showProduct]);

  useEffect(() => {
    if (g.status === 'playing') return undefined;
    const tick = () => setCountdown(fmtCountdown(msToMidnightET()));
    tick();
    const iv = setInterval(tick, 1000);
    return () => clearInterval(iv);
  }, [g.status]);

  useEffect(() => {
    try { const id = JSON.parse(localStorage.getItem('sot_quiz_identity')); if (id && id.email) setIdentity(id); } catch (e) {}
    try {
      const anon = getAnonId();
      let em = '';
      try { const idj = JSON.parse(localStorage.getItem('sot_quiz_identity') || 'null'); if (idj && idj.email) em = `&email=${encodeURIComponent(idj.email)}`; } catch (e) {}
      if (anon || em) {
        meRequest(`/api/quiz/me?anonId=${encodeURIComponent(anon || '')}${em}&history=1`)
          .then((r) => r.json())
          .then((d) => { if (d && Array.isArray(d.recent)) setStats((cur) => mergeServerStats(cur || getStats(), d.recent, puzzles)); })
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
  const iq = useIqStanding({ game: 'pricer', quizId: PUZZLE.quizId, active: !playing });
  const nextUp = useNextUnplayed({ self: 'pricer', active: !playing });
  const upNext = useUnplayedSimilar({ self: 'pricer', active: !playing });
  const dailyBoard = useDailyBoard({ quizId: PUZZLE.quizId, active: !playing });
  const allTime = useGameAllTime({ game: 'pricer', active: !playing });
  const dayStats = useDayStats();
  const catRank = useCategoryRank({ self: 'pricer', active: !playing });
  const prevPuzzle = puzzles.find((x) => x.num === PUZZLE.num - 1) || null;
  const myStats = deriveStats(stats, pickPuzzle(puzzles, null).num);

  const bpsOf = (cur) => {
    const ts = cur.guesses.map((c) => errOf(c, PRICE));
    return ts.length ? Math.round(Math.min(...ts) * 10000) : null;
  };
  const REC_KEY = `sot_pricer_rec_${PUZZLE.num}`;
  const abandon = useAbandonFlush(() => {
    const cur = gRef.current;
    if (!cur.t0 || cur.status !== 'playing' || !cur.guesses.length) return null;
    try { if (localStorage.getItem(REC_KEY)) return null; } catch (e) {}
    const el = Math.min(36000, Math.max(1, Math.round((Date.now() - (cur.t0 || Date.now())) / 1000)));
    try { localStorage.setItem(REC_KEY, '1'); } catch (e) {}
    return { quizId: PUZZLE.quizId, score: 0, total: TOTAL, correct: 0, guessesUsed: cur.guesses.length, timeElapsed: el, abandoned: true, email: identity?.email || undefined, anonId: getAnonId(), isMobile: isMobileDevice(), referrer: (typeof document !== 'undefined' ? document.referrer : '') };
  });

  function postResult(g2) {
    abandon.markFlushed();
    const el = g2.t0 ? Math.max(1, Math.round(((g2.tEnd || Date.now()) - g2.t0) / 1000)) : 1;
    const bps = bpsOf(g2);
    const sc = bps == null ? 0 : scoreOf(bps / 10000);
    try { setStats(recordStat(PUZZLE.num, { s: sc, t: TOTAL, won: sc > 0, b: bps })); } catch (e) {}
    try {
      fetch('/api/quiz/result', {
        method: 'POST', keepalive: true, headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ quizId: PUZZLE.quizId, score: sc, total: TOTAL, correct: sc, guessesUsed: g2.guesses.length, priceTiebreak: bps == null ? undefined : bps, timeElapsed: el, email: identity?.email || undefined, anonId: getAnonId(), isMobile: isMobileDevice(), referrer: (typeof document !== 'undefined' ? document.referrer : '') }),
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
    setTimeout(() => { try { inputRef.current && inputRef.current.focus(); } catch (e) {} }, 50);
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
    if (c == null) { say('Type a dollar amount, like 24.99 or 1,250. That cost you nothing.'); return; }
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
    setTimeout(() => { try { inputRef.current && inputRef.current.focus(); } catch (err) {} }, 30);
  }

  function shareUrl() { return withRef(`mindloftdaily.com/pricer${isTodays ? '' : `?p=${PUZZLE.num}`}`); }
  function shareText() {
    const lines = tries.map((x) => { const b = bandOf(x.e); return b.key === 'bull' ? 'Bullseye' : `${x.up ? '▲' : '▼'} ${b.label}`; });
    const streakBit = isTodays && myStats.cur >= 2 ? ` · streak ${myStats.cur}` : '';
    return `Pricer #${PUZZLE.num}${PUZZLE.sunday ? ' (Sunday Edition)' : ''} · ${score}/10 · ${best ? pctLabel(best.e) : ''}${streakBit}\n${lines.join('\n')}\n${shareUrl()}`;
  }
  function copyShare() {
    const text = playing
      ? `Pricer #${PUZZLE.num}: one real product, five guesses at its price. The daily price game from Mind Loft.\n${shareUrl()}`
      : shareText();
    if (notifyShareCredit(text)) return;
    try { if (typeof navigator !== 'undefined' && navigator.share && isMobileDevice()) { navigator.share({ text }).catch(() => {}); return; } } catch (e) {}
    try { navigator.clipboard?.writeText(text).then(() => { setCopied(true); setTimeout(() => setCopied(false), 1800); }); } catch (e) {}
  }

  const rulesBody = (
    <DailyRules
      accent={COLORS.accent} accentSoft={COLORS.accentSoft}
      lead="One real product a day. Guess what it costs."
      banner={PUZZLE.sunday ? 'Sunday Edition: the big-ticket item' : null}
      steps={[
        <><b>Five guesses.</b> After each one you get an arrow, <b>higher</b> or <b>lower</b>, and how hot you are: Freezing, Cold, Cool, Warm, Hot, Burning.</>,
        <>Your score is your <b>closest guess</b>, 0 to 10. Within 1% is a <b>bullseye</b>: it scores 10 and ends the day early.</>,
        <>Close is measured as a ratio, so guessing <b>half the price is as far off as guessing double</b>. Within 5% scores 8, within 15% scores 6, within 50% scores 3.</>,
        <>Weekdays are Amazon products, at the price Amazon showed on the day we checked it. <b>Sundays are the big-ticket edition</b>: a car, a watch, a motorcycle, at the maker&apos;s starting price.</>,
        <>Ties on the board go to the closer guess, then fewer guesses, then time.</>,
      ]}
      knack="Bracket it. A guess that comes back Cold is off by more than 75%, so your next one should move a long way; save the small steps for Hot and Burning. You can type 1.2k for $1,200."
      footer="Product links go to the listing; Amazon links carry our affiliate tag, which never changes the price."
    />
  );

  if (!DAY) return null;
  const gathered = fmtGathered(DAY.gathered);

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

  return (
    <div className={STAGE ? 'stage-page' : 'loft-page'}
      data-stage-theme={STAGE ? stageTheme : undefined}
      style={{ ...(STAGE ? STAGE_ACC : null), ...HEAT, ...MAT, minHeight: '100vh', background: STAGE ? 'var(--stg-ground)' : T.surface, color: STAGE ? 'var(--stg-ink,#e9edf4)' : undefined, position: 'relative', overflowX: 'hidden' }}>
      {!STAGE && <Grain />}
      {!STAGE && <DailyChrome slug="pricer" name="Pricer" collapsed={started} loft={LOFT} />}
      <Cap gameKey="pricer" quizId={PUZZLE.quizId}
        name="Pricer"
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
        <style dangerouslySetInnerHTML={{ __html: `
          @media(max-width:560px){.pr-wrap{padding-left:10px !important;padding-right:10px !important;}}
          .pr-btn{font-family:${SANS};font-weight:800;font-size:14px;border:2px solid ${STAGE ? 'var(--stg-line2)' : 'var(--blue-deep)'};background:${STAGE ? 'transparent' : 'var(--white)'};color:${STAGE ? 'var(--stg-ink)' : 'var(--blue-deep)'};border-radius:8px;padding:9px 16px;cursor:pointer;display:inline-flex;align-items:center;gap:7px;}
          .pr-prod{display:flex;gap:16px;align-items:center;background:var(--pr-panel);border:1.5px solid var(--pr-panel-line);border-left:5px solid var(--stg-acc, ${COLORS.accent});border-radius:14px;padding:12px 16px 12px 12px;box-shadow:var(--pr-shadow);}
          .pr-ph{flex:0 0 150px;height:150px;border-radius:10px;background:var(--pr-mat);display:flex;align-items:center;justify-content:center;overflow:hidden;position:relative;}
          .pr-ph.wide{flex-basis:220px;}
          .pr-ph img{max-width:94%;max-height:94%;object-fit:contain;display:block;}
          .pr-ph.cover img{max-width:none;max-height:none;width:100%;height:100%;object-fit:cover;}
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
          @media(max-width:480px){.pr-prod{flex-direction:column;align-items:stretch;}.pr-ph,.pr-ph.wide{flex-basis:auto;height:210px;}.pr-row{grid-template-columns:18px 1fr auto 74px;}}
        ` }} />

        <div style={{ maxWidth: 560, margin: '0 auto' }}>
        <div className={STAGE ? undefined : 'loft-stage'}>
          <div className={!STAGE && !playing ? (revealed ? 'loft-flip' : 'loft-flip on') : undefined}>
          <div className={!STAGE && !playing ? 'loft-flip-in' : undefined}>
          <div className={!STAGE && !playing ? 'loft-face' : undefined}>

        {preStart && (
          <div className={STAGE ? 'stg-gate' : undefined} style={{ background: STAGE ? SURF : COLORS.cream, border: STAGE ? `1px solid ${SURF_B}` : `2px solid ${COLORS.ink}`, borderRadius: 12, padding: '22px', display: 'flex', flexDirection: 'column' }}>
            <div style={{ fontSize: 20, fontWeight: 800, color: INK, marginBottom: 10 }}>{gateRules ? 'How to play' : 'Pricer is ready'}</div>
            {gateRules ? rulesBody : (
              <div style={{ fontSize: 14, lineHeight: 1.55, color: INK, fontWeight: 600 }}>
                <p style={{ margin: '0 0 6px' }}>{PUZZLE.sunday ? <>It&apos;s the <b>Sunday Edition</b>: today&apos;s item is a big-ticket one.</> : <>One real product, five guesses at its price.</>} Your closest guess is your score. The clock starts when you do.</p>
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

        {!preStart && (
        <div className={STAGE ? 'stg-board' : 'loft-card'} style={{ background: SURF, border: STAGE ? `1px solid ${SURF_B}` : `2px solid ${COLORS.ink}`, borderRadius: 10, padding: '15px', marginBottom: 12 }}>
          <div className="pr-prod">
            <div className={`pr-ph${DAY.shop === 'brand' ? ' wide cover' : ''}`}>
              {imgOk === false ? (
                <div style={{ padding: 12, textAlign: 'center', fontSize: 12.5, fontWeight: 800, color: '#334155' }}>{DAY.name}</div>
              ) : (
                <img src={DAY.img} alt={DAY.name} draggable={false} onLoad={() => setImgOk(true)} onError={() => setImgOk(false)} referrerPolicy="no-referrer" />
              )}
            </div>
            <div style={{ minWidth: 0 }}>
              <div className="pr-eb" style={{ color: ACC_INK }}>{PUZZLE.sunday ? `Sunday Edition · ${DAY.cat}` : DAY.cat}</div>
              <h2 className="pr-name">{DAY.name}</h2>
              <div style={{ fontSize: 12.5, color: FADED, fontWeight: 600 }}>
                {DAY.shop === 'amazon' ? <>Sold on Amazon · <b style={{ color: INK }}>pricing as of {gathered}</b></> : <>{DAY.note} · <b style={{ color: INK }}>pricing as of {gathered}</b></>}
              </div>
            </div>
          </div>

          {playing && started && (
            <>
              <div className="pr-ask">
                <label className="pr-money">
                  <span>$</span>
                  <input ref={inputRef} type="text" inputMode="decimal" autoComplete="off" value={q}
                    onChange={(e) => setQ(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); guess(); } }}
                    placeholder={left === 1 ? 'Last guess' : 'Your guess'} aria-label="Your price guess in dollars" />
                </label>
                <button type="button" className="pr-go" onClick={guess}>Guess</button>
              </div>
              <div style={{ minHeight: 19, marginTop: 6, fontSize: 12.5, fontWeight: 700, color: FADED }}>
                {notice ? notice.msg
                  : tries.length ? (() => { const x = tries[tries.length - 1]; const b = bandOf(x.e); return <>{b.label}. Go <b style={{ color: INK }}>{x.up ? 'higher' : 'lower'}</b>. {left} guess{left === 1 ? '' : 'es'} left.</>; })()
                  : <>Type a price and press Enter. {PUZZLE.sunday ? 'Big numbers: 45k works.' : ''}</>}
              </div>
            </>
          )}

          <div className="pr-rows">{Array.from({ length: GUESSES }, (_, i) => guessRow(i))}</div>

          {!playing && (
            <div style={{ marginTop: 14, borderTop: `1px solid ${SURF_B}`, paddingTop: 14 }}>
              <div className="pr-eb" style={{ color: FADED }}>The price</div>
              <div style={{ fontSize: 34, fontWeight: 900, letterSpacing: '-0.02em', color: INK }}>{fmtCents(PRICE)}</div>
              <div style={{ fontSize: 15, fontWeight: 800, color: ACC_INK, marginTop: 2 }}>
                {score}/10 · your closest was {best ? fmtCents(best.c) : '—'}, {best ? pctLabel(best.e) : ''}
              </div>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 12 }}>
                <a className="pr-buy" href={DAY.href} target="_blank" rel={DAY.shop === 'amazon' ? 'noopener sponsored' : 'noopener'}>
                  {DAY.shop === 'amazon' ? 'See it on Amazon' : 'See it on the maker’s site'} <ExternalLink size={14} />
                </a>
              </div>
              <div className="pr-ladder">
                {[[10, '≤1%'], [9, '≤2.5%'], [8, '≤5%'], [7, '≤10%'], [6, '≤15%'], [5, '≤25%'], [4, '≤35%'], [3, '≤50%'], [2, '≤75%'], [1, '≤100%'], [0, 'beyond']].map(([s, l]) => (
                  <div key={s} className={s === score ? 'on' : ''}><b>{s}</b>{l}</div>
                ))}
              </div>
              <div style={{ marginTop: 10, fontSize: 11.5, color: FADED, fontWeight: 600, lineHeight: 1.5 }}>
                {DAY.shop === 'amazon'
                  ? `Pricing as of ${gathered}: the price Amazon showed that day. It may have moved since.`
                  : <>Pricing as of {gathered}: {DAY.note.charAt(0).toLowerCase() + DAY.note.slice(1)}. Taxes, destination and options extra. {DAY.creditUrl ? <a href={DAY.creditUrl} target="_blank" rel="noopener" style={{ color: FADED }}>{DAY.credit}</a> : DAY.credit}</>}
              </div>
            </div>
          )}
        </div>
        )}

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
                  <>{countdown ? <>Next Pricer in <b style={{ color: INK, fontVariantNumeric: 'tabular-nums' }}>{countdown}</b>.</> : 'A new product drops at midnight Eastern.'}</>
                ) : (
                  <>You&rsquo;re playing the {PUZZLE.dateLabel} archive.{' '}<a href="/pricer" style={{ color: COLORS.ember, fontWeight: 800, textDecoration: 'underline' }}>Back to today&rsquo;s Pricer &rarr;</a></>
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
              name="Pricer"
              catRank={catRank}
              outcome={outcome}
              title={score === 10 ? 'Bullseye' : `${score} of 10`}
              detail={`${fmtCents(PRICE)} · closest ${best ? fmtCents(best.c) : '—'} · ${elapsed}`}
              iq={iq}
              board={dailyBoard}
              gameRank={allTime && allTime.ready
                ? { value: allTime.rank != null ? `#${Number(allTime.rank).toLocaleString()}` : '—',
                    label: allTime.field != null ? `of ${Number(allTime.field).toLocaleString()} Pricer all time` : 'all-time rank' }
                : null}
              day={dayStats}
              streak={isTodays ? myStats.cur : null}
              missLabel="Guesses"
              handoff={false}
              archive={puzzles
                .filter((p) => p.live <= etToday() && p.num !== PUZZLE.num)
                .sort((x, y) => y.num - x.num)
                .map((p) => ({
                  num: p.num, dateLabel: p.dateLabel, sunday: !!p.sunday, href: `/pricer?p=${p.num}`,
                  done: !!(stats && stats.rec && stats.rec[p.num]),
                  score: (stats && stats.rec && stats.rec[p.num]) ? stats.rec[p.num].s : null,
                }))}
              options={[
                { label: copied ? 'Copied' : (shareCta || 'Share'), sub: 'Your hot and cold, not the price', kind: 'gold', onClick: copyShare },
                { tone: 'board', label: 'Return to board', sub: 'Your five guesses, hot and cold', onClick: () => setRevealed(true) },
                { tone: 'reveal', label: 'See the product', sub: `The price and the link · as of ${gathered}`, onClick: () => setShowProduct(true) },
                prevPuzzle && { tone: 'another', label: 'Play another Pricer', sub: `No. ${prevPuzzle.num}, yesterday’s product`, href: `/pricer?p=${prevPuzzle.num}` },
                nextUp && { tone: 'similar', label: 'Play similar', sub: `${nextUp.name} · ${nextUp.tag}`, href: nextUp.href },
                { tone: 'replay', label: 'Replay', sub: 'This product again, unscored', onClick: resetGame },
                { label: 'Back to main', sub: 'The day’s full board', tone: 'main', href: '/' },
              ]}
            />
          )}
          </div>
          </div>
        </div>

        {!STAGE && <GamePanel self="pricer" name="Pricer" onShow={() => setShowChrome(true)} />}
        <div style={{ display: (focusMode && !STAGE) ? 'none' : 'block', margin: '30px auto 0' }}>
          <div className={STAGE ? undefined : 'loft-report'}>
            <ReportIssue self="pricer" name="Pricer" accent="#ffffff" align="center" onHelp={() => setShowHelp(true)} />
          </div>
          {!focusMode && mobileUi && !standalone && (
            <button onClick={a2hsClick} style={{ marginTop: 10, width: '100%', fontFamily: SANS, fontSize: 13.5, letterSpacing: '0.05em', textTransform: 'uppercase', fontWeight: 800, height: 54, borderRadius: 10, border: 'none', background: `var(--stg-acc, ${COLORS.accent})`, color: `var(--stg-onramp, ${T.white})`, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 9, whiteSpace: 'nowrap' }}>
              <Smartphone size={15} strokeWidth={2.5} /> Add to Home Screen
            </button>
          )}
        </div>
        {showA2hsHelp && (
          <div onClick={() => setShowA2hsHelp(false)} style={{ position: 'fixed', inset: 0, background: 'rgba(20,22,28,0.55)', zIndex: 90, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 18 }}>
            <div onClick={(e) => e.stopPropagation()} style={{ background: STAGE ? 'var(--stg-raise,#0e131f)' : T.white, borderRadius: 14, maxWidth: 430, width: '100%', padding: '22px 22px 16px', fontFamily: SANS, border: STAGE ? '1px solid var(--stg-line)' : '1.5px solid rgba(20,22,28,0.12)' }}>
              <div style={{ fontSize: 17, fontWeight: 800, color: INK, marginBottom: 8 }}>Add Pricer to your Home Screen</div>
              <p style={{ margin: '0 0 4px', color: INK, fontSize: 14, lineHeight: 1.7 }}>Open your browser&apos;s menu and choose <b>Add to Home Screen</b> (on iPhone, tap <b>Share</b> first). The tile opens today&apos;s product, every day.</p>
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
        <div className="pr-pop" onClick={() => setShowProduct(false)} role="dialog" aria-modal="true" aria-label={`${DAY.name}: the price`}>
          <style dangerouslySetInnerHTML={{ __html: `
            .pr-pop{position:fixed;inset:0;z-index:95;background:rgba(6,10,20,.62);display:flex;align-items:center;justify-content:center;padding:16px;animation:prfade .25s ease both;}
            .pr-popc{width:100%;max-width:420px;background:var(--stg-raise,#ffffff);border:1px solid var(--stg-line,rgba(20,22,28,.14));border-radius:16px;overflow:hidden;font-family:${SANS};box-shadow:0 24px 60px rgba(0,0,0,.35);animation:prrise .35s cubic-bezier(.2,.8,.2,1) both;max-height:92vh;overflow-y:auto;}
            .pr-popi{background:var(--pr-mat);height:230px;display:flex;align-items:center;justify-content:center;position:relative;}
            .pr-popi img{max-width:86%;max-height:88%;object-fit:contain;}
            .pr-popi.cover img{max-width:none;max-height:none;width:100%;height:100%;object-fit:cover;}
            .pr-popx{position:absolute;top:10px;right:10px;width:34px;height:34px;border-radius:50%;border:0;background:rgba(6,10,20,.6);color:#fff;display:flex;align-items:center;justify-content:center;cursor:pointer;}
            @keyframes prfade{from{opacity:0}to{opacity:1}}
            @keyframes prrise{from{opacity:0;transform:translateY(18px) scale(.97)}to{opacity:1;transform:none}}
            @media(prefers-reduced-motion:reduce){.pr-pop,.pr-popc{animation:none;}}
          ` }} />
          <div className="pr-popc" onClick={(e) => e.stopPropagation()}>
            <div className={`pr-popi${DAY.shop === 'brand' ? ' cover' : ''}`}>
              <img src={DAY.img} alt={DAY.name} referrerPolicy="no-referrer" />
              <button type="button" className="pr-popx" aria-label="Close" onClick={() => setShowProduct(false)}><X size={18} /></button>
            </div>
            <div style={{ padding: '16px 18px 18px' }}>
              <div className="pr-eb" style={{ color: ACC_INK }}>{PUZZLE.sunday ? `Sunday Edition · ${DAY.cat}` : DAY.cat}</div>
              <div style={{ fontSize: 17, fontWeight: 800, color: INK, lineHeight: 1.25, margin: '4px 0 10px' }}>{DAY.name}</div>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, flexWrap: 'wrap' }}>
                <span style={{ fontSize: 36, fontWeight: 900, letterSpacing: '-0.02em', color: INK }}>{fmtCents(PRICE)}</span>
                <span style={{ fontSize: 14, fontWeight: 800, color: ACC_INK }}>{score}/10{best ? ` · you said ${fmtCents(best.c)}` : ''}</span>
              </div>
              <div style={{ marginTop: 6, fontSize: 12.5, fontWeight: 700, color: FADED, lineHeight: 1.45 }}>
                Pricing as of {gathered}: {DAY.shop === 'amazon' ? 'the price Amazon showed that day. It may have moved since.' : `${DAY.note.charAt(0).toLowerCase() + DAY.note.slice(1)}, before taxes, destination and options.`}
              </div>
              <a className="pr-buy" href={DAY.href} target="_blank" rel={DAY.shop === 'amazon' ? 'noopener sponsored' : 'noopener'} style={{ marginTop: 14, width: '100%', justifyContent: 'center', boxSizing: 'border-box' }}>
                {DAY.shop === 'amazon' ? 'See it on Amazon' : 'See it on the maker’s site'} <ExternalLink size={14} />
              </a>
              <button type="button" onClick={() => setShowProduct(false)} style={{ marginTop: 10, width: '100%', background: 'none', border: 'none', cursor: 'pointer', fontFamily: SANS, fontSize: 13, fontWeight: 700, color: FADED, textDecoration: 'underline' }}>Back to your results</button>
              {DAY.credit && <div style={{ marginTop: 8, fontSize: 10.5, color: FADED, fontWeight: 600 }}>{DAY.credit}</div>}
            </div>
          </div>
        </div>
      )}

      <DuelBanner token={duelToken} info={duelInfo} submitted={duelSubmitted} />

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
        <h2 style={{ margin: '0 0 8px', fontSize: 15, fontWeight: 800, letterSpacing: '-0.01em', color: INK }}>About Pricer</h2>
        <p style={{ margin: '0 0 8px', fontSize: 13, lineHeight: 1.65, color: FADED, fontWeight: 600 }}>
          Pricer is a free daily price-guessing game from Mind Loft. Every day there is one real product, and you have five guesses at what it costs. Each guess tells you to go higher or lower and how hot you are, from Freezing to Burning, and your score is your closest guess, out of 10. Land within 1% and it is a bullseye.
        </p>
        <p style={{ margin: '0 0 8px', fontSize: 13, lineHeight: 1.65, color: FADED, fontWeight: 600 }}>
          Weekdays are everyday things on Amazon, from hot sauce to laptops, at the price Amazon showed when we checked. Sundays are the big-ticket edition: a car, a watch, a motorcycle, priced at the maker&apos;s starting price. Everyone gets the same product, so the leaderboard ranks your score, then exactly how close you got, then fewer guesses, then time.
        </p>
        <p style={{ margin: 0, fontSize: 13, lineHeight: 1.65, color: FADED, fontWeight: 600 }}>
          A new product drops every day at midnight Eastern. No app, no signup. More number games: <a href="/crunch" style={{ color: INK, fontWeight: 800 }}>Crunch</a>, <a href="/blitz" style={{ color: INK, fontWeight: 800 }}>Blitz</a> and <a href="/cipher" style={{ color: INK, fontWeight: 800 }}>Cipher</a>.
        </p>
      </section>

      {!STAGE && <div style={{ position: 'relative', zIndex: 2, display: focusMode ? 'none' : 'block' }}><Footer /></div>}
    </div>
  );
}
