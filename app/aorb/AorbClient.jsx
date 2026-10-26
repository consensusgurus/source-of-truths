'use client';

// Aorb, the daily A-or-B crowd game (owner, 2026-10-23).
//
// Ten pairs a day. On every pair the player taps ME on their own honest pick
// and CROWD on the side they think most players picked as their own. The call
// is scored on the real split (call the 72 side, earn 72), and an own pick that
// beats what the room predicted for it pays a surprise bonus. There is no
// answer key, only the crowd: /api/aorb scores leave-one-out against every
// ballot and keeps re-scoring as the field fills (lib/aorb-score.js).
//
// PLAY IS ONE FULL-SCREEN STAGE in the category colour, showing nothing but
// the question and the two answers (owner, 2026-10-23). Each pair is revealed
// the moment both picks are in, with a run-end style light show, and waits for
// a tap before moving on. A first-time player gets a one-line hint on the first
// pair only. A returning player who played an earlier Aorb first sees how
// their last room settled (owner, 2026-10-23).
//
// Built from HerdClient's frame: the same daily plumbing (Eastern-date banks,
// per-puzzle saves, ?p=N archive, stats and streaks, the stage, the finish).

import { BrandFit } from '@/lib/use-brand-fit';
import MindLoftMark from '../MindLoftMark';
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useSearchParams } from 'next/navigation';
import { X, Smartphone } from 'lucide-react';
import Grain from '../Grain';
import Footer from '../Footer';
import useDuelContext, { DuelBanner } from '../quiz/[id]/useDuelContext';
import JoinLeaderboardForm from '../quiz/[id]/JoinLeaderboardForm';
import DailyGamesGrid from '../DailyGamesGrid';
import DailyEndCard from '../DailyEndCard';
import DailyChrome from '../DailyChrome';
import DailyRules from '../DailyRules';
import DailyBoardPanel from '../quiz/[id]/DailyBoardPanel';
import { isMobileDevice } from '@/lib/is-mobile';
import useAbandonFlush from '../quiz/[id]/useAbandonFlush';
import { withRef } from '@/lib/referrals';
import { notifyShareCredit } from '../ShareCreditPop';
import DailyMasthead from '../DailyMasthead';
import { isLoft } from '@/lib/loft';
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
import { useRunEmbed, useRunHelp } from '../RunEmbed';
import { CONTEST, contestIsLive } from '@/lib/contest';
import { T } from '@/lib/theme';
import { meRequest } from '@/app/quizMeClient';

const COLORS = {
  cream: T.surface,
  paper: T.paper,
  ink: T.ink,
  ember: T.accent,
  rust: T.danger,
  faded: T.muted,
  accent: '#6d28d9',       // Aorb identity: the Crowd Psychology violet
  accentSoft: T.surfaceAlt,
  gold: T.gold,
  green: T.successDeep,
  greenSoft: '#eefaf1',
};
const SANS = "'Manrope', system-ui, -apple-system, sans-serif";
const MONO = "'Manrope', ui-monospace, 'SFMono-Regular', monospace";
const HELP_KEY = 'sot_aorb_help_seen';
const STATS_KEY = 'sot_aorb_stats';
const HINT_KEY = 'sot_aorb_hint_seen';

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

// Live standings — the board that re-shuffles as picks arrive. Fed straight
// from the /api/aorb response (result.board), which recomputes every
// registered player's total against the current field on every request.
function AorbLiveBoard({ board }) {
  if (!board) return null;
  const top = Array.isArray(board.top) ? board.top : [];
  const youShown = top.some((r) => r.you);
  return (
    <div style={{ maxWidth: 472, margin: '0 auto 12px', background: 'var(--stg-surf, var(--white))', border: '1.5px solid var(--stg-line, rgba(28,30,36,0.18))', borderRadius: 10, padding: '13px 15px' }}>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginBottom: 3 }}>
        <span style={{ fontFamily: MONO, fontSize: 10.5, fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.1em', color: `var(--stg-ink, ${COLORS.accent})` }}>Live standings</span>
        <span style={{ fontFamily: SANS, fontSize: 11, fontWeight: 700, color: `var(--stg-mute, ${COLORS.faded})`, marginLeft: 'auto' }}>{fmtBig(board.field || 0)} in the field</span>
      </div>
      <div style={{ fontFamily: SANS, fontSize: 11.5, fontWeight: 600, color: `var(--stg-mute, ${COLORS.faded})`, lineHeight: 1.45, marginBottom: 10 }}>
        Nothing here is final. Every new player re-scores the whole board, so your place climbs or slips as the crowd fills in.
        {board.houseActive ? ' The house crowd is still seeding until ten players lock in.' : ''}
      </div>
      {top.length === 0 ? (
        <div style={{ fontFamily: SANS, fontSize: 12.5, fontWeight: 700, color: `var(--stg-mute, ${COLORS.faded})`, padding: '6px 0' }}>No one has joined the board yet. Be the first name on it.</div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
          {top.map((r, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '5px 8px', borderRadius: 6, background: r.you ? 'rgba(232,180,58,0.16)' : (i % 2 ? `var(--stg-surf, ${COLORS.cream})` : 'transparent'), border: r.you ? `1px solid ${COLORS.gold}` : '1px solid transparent' }}>
              <span style={{ flex: '0 0 26px', fontFamily: MONO, fontSize: 12, fontWeight: 500, color: r.rank <= 3 ? `var(--stg-ink, ${COLORS.ink})` : `var(--stg-mute, ${COLORS.faded})`, textAlign: 'right' }}>{r.rank}</span>
              <span style={{ flex: '1 1 auto', fontFamily: SANS, fontSize: 13, fontWeight: r.you ? 800 : 600, color: r.you ? '#8a6d1a' : `var(--stg-ink, ${COLORS.ink})`, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{r.name}{r.you ? ' \u00b7 you' : ''}</span>
              <span style={{ flex: '0 0 auto', fontFamily: MONO, fontSize: 12.5, fontWeight: 500, color: `var(--stg-ink, ${COLORS.ink})`, fontVariantNumeric: 'tabular-nums' }}>{r.total}</span>
            </div>
          ))}
        </div>
      )}
      {board.youRegistered && !youShown && board.you ? (
        <div style={{ marginTop: 8, paddingTop: 8, borderTop: '1px solid rgba(28,30,36,0.1)', display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ flex: '0 0 26px', fontFamily: MONO, fontSize: 12, fontWeight: 700, color: '#8a6d1a', textAlign: 'right' }}>{board.you.rank}</span>
          <span style={{ flex: '1 1 auto', fontFamily: SANS, fontSize: 13, fontWeight: 800, color: '#8a6d1a' }}>You</span>
          <span style={{ flex: '0 0 auto', fontFamily: MONO, fontSize: 12.5, fontWeight: 500, color: `var(--stg-ink, ${COLORS.ink})` }}>{board.you.total}</span>
        </div>
      ) : null}
      {!board.youRegistered ? (
        <div style={{ marginTop: 8, fontFamily: SANS, fontSize: 11, fontWeight: 700, color: `var(--stg-mute, ${COLORS.faded})` }}>Join the leaderboard below to take your place as the field grows.</div>
      ) : null}
    </div>
  );
}

function fmtBig(n) {
  const v = Number(n) || 0;
  return v.toLocaleString('en-US');
}

// ─── Personal stats + streak (localStorage), Circa/Stet pattern ─────────────
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
function recordLiveStat(num, sc) {
  const s = getStats();
  const prev = s.rec[num] || {};
  const rec = { ...s.rec, [num]: { ...prev, s: sc, t: 100, g: prev.g != null ? prev.g : 0, won: sc >= 60, fin: prev.fin != null ? prev.fin : sc } };
  const s2 = { ...s, rec };
  try { localStorage.setItem(STATS_KEY, JSON.stringify(s2)); } catch (e) {}
  return s2;
}
function deriveStats(s, todayNum) {
  const rec = s && s.rec ? s.rec : {};
  const nums = Object.keys(rec).map(Number).sort((a, b) => a - b);
  const played = nums.length;
  const sharp = nums.filter((n) => rec[n].won).length;
  let max = 0, run = 0, prev = null;
  for (const n of nums) {
    run = prev != null && n === prev + 1 ? run + 1 : 1;
    if (run > max) max = run;
    prev = n;
  }
  let cur = 0, at = rec[todayNum] ? todayNum : todayNum - 1;
  while (rec[at]) { cur++; at--; }
  return { played, sharp, cur, max };
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
    const sc = Math.max(0, Math.min(100, Math.round(m.scorePct || 0)));
    if (!changed) { rec = { ...rec }; changed = true; }
    rec[p.num] = { s: sc, t: 100, g: null, won: sc >= 60 };
  }
  if (!changed) return s;
  const s2 = { ...s, rec };
  try { localStorage.setItem(STATS_KEY, JSON.stringify(s2)); } catch (e) {}
  return s2;
}

function freshState() {
  return {
    v: 1,
    ans: {},                    // pairIdx -> [me, call] (0 = A, 1 = B)
    peeks: {},                  // pairIdx -> that pair's reveal (/api/aorb peek)
    status: 'playing',          // playing | done
    result: null,               // /api/aorb response
    t0: null,
    tEnd: null,
  };
}

export default function AorbClient({ puzzles = [], forceNum = null }) {
  const PUZZLE = useMemo(() => pickPuzzle(puzzles, forceNum), [puzzles, forceNum]);
  const PROMPTS = PUZZLE.prompts;
  const TOTAL = PROMPTS.length;
  const STORE_KEY = `sot_aorb_${PUZZLE.num}`;

  const [g, setG] = useState(freshState);
  // One pair at a time on the full-screen stage: which pair is up, the picks made
  // on it so far, and the reveal animation clocks.
  const [step, setStep] = useState(0);
  const [cur, setCur] = useState({ me: null, call: null });
  const [peeking, setPeeking] = useState(false);
  const [tReveal, setTReveal] = useState(1);
  const [tEnter, setTEnter] = useState(1);
  const [hintSeen, setHintSeen] = useState(true);
  const [prior, setPrior] = useState(null);       // the last earlier Aorb this player played, settled
  const [priorDone, setPriorDone] = useState(false);
  const rafRef = useRef({});
  const [sending, setSending] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const [gateRules, setGateRules] = useState(false); // start tile: full rules (first-timer) vs compact card
  const [toast, setToast] = useState(null);
  const [copied, setCopied] = useState(false);
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
  // eslint-disable-next-line no-unused-vars -- the player chip moved into
  // DailyChrome (QuizNavHeader fetches its own identity); the fetch below
  // stays for the cross-device stats merge.
  const [player, setPlayer] = useState(null);
  const [countdown, setCountdown] = useState('');
  const [installEvt, setInstallEvt] = useState(null);
  const [showA2hsHelp, setShowA2hsHelp] = useState(false);
  const [standalone, setStandalone] = useState(false);
  const [mobileUi, setMobileUi] = useState(false);
  const searchParams = useSearchParams();
  const { duelToken, duelInfo, duelSubmitted } = useDuelContext(PUZZLE.quizId, searchParams);
  const toastTimer = useRef(null);
  const viewedRef = useRef(false);

  const [showChrome, setShowChrome] = useState(false);
  const playing = g.status === 'playing';
  const LOFT = isLoft('aorb');
  const STAGE = isStage('aorb', searchParams);
  const STAGE_C = STAGE ? 'var(--stg-acc)' : gameColor('aorb');
  const STAGE_C_INK = STAGE ? 'var(--stg-acc-ink, var(--stg-acc))' : gameColor('aorb');
  const Cap = STAGE ? StageChrome : LoftCap;
  const STAGE_ACC = { '--stg-acc-dk': gameColor('aorb'), '--stg-acc-lt': gameColorLight('aorb'), '--stg-onramp-lt': gameOnrampLight('aorb'), '--stg-acc-ink-lt': gameAccentInkLight('aorb') };
  const [stageTheme] = useStageTheme();
  // Inside the Read the Room run (app/RunEmbed.jsx) the page furniture drops
  // away and the board sits on the run's dark ground; the game is unchanged.
  const EMBED = useRunEmbed();
  useRunHelp(EMBED, () => setShowHelp(true));
  const INK = STAGE ? 'var(--stg-ink,#e9edf4)' : COLORS.ink;
  const FADED = STAGE ? 'var(--stg-mute,#8b95a8)' : COLORS.faded;
  const SURF = STAGE ? 'var(--stg-surf,rgba(255,255,255,0.045))' : T.white;
  const SURF_B = STAGE ? 'var(--stg-line,rgba(255,255,255,0.11))' : 'rgba(28,30,36,0.42)';
  const ACC = STAGE ? STAGE_C : COLORS.accent;
  const ACC_DEEP = STAGE ? STAGE_C : COLORS.accentDeep;
  const ACC_SOFT = STAGE ? 'var(--stg-line,rgba(255,255,255,0.11))' : COLORS.accentSoft;
  const ON_ACC = STAGE ? 'var(--stg-onramp, #08222e)' : 'var(--white)';
  // The accent as TEXT (eyebrows, lit words): never --stg-acc, which is a fill.
  const ACC_INK_OW = STAGE ? 'var(--stg-acc-ink)' : COLORS.accent;
  const preStart = playing && !g.t0;
  const started = playing && !!g.t0;
  const focusMode = playing && !showChrome;
  const answered = Object.keys(g.ans).length;
  const result = g.result;
  const score = result ? result.posted : 0;
  const sharp = g.status === 'done' && score >= 60; // a strong read of the room

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
        if (saved && saved.v === 1 && saved.ans) {
          setG({ ...freshState(), ...saved, peeks: saved.peeks || {} });
          const firstOpen = PROMPTS.findIndex((_, k) => saved.ans[k] == null);
          setStep(firstOpen < 0 ? Math.max(0, PROMPTS.length - 1) : firstOpen);
        }
      }
      setGateRules(!localStorage.getItem(HELP_KEY));
      setHintSeen(localStorage.getItem(HINT_KEY) === '1');
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
        (function(){ var _dn = g.status !== 'playing'; if (_dn || g.t0) localStorage.setItem('sot_aorb_day', JSON.stringify({ d: etToday(), done: _dn })); else localStorage.removeItem('sot_aorb_day'); })();
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

  // ADAPTIVE: a finished run is never frozen. While the result is on screen we
  // re-ask the server for the current score + live standings, so as new players
  // lock in the number and the board move under you. This path never inserts
  // (the browser already has its row) — it only re-scores against the live field.
  async function refreshLive() {
    if (g.status !== 'done') return;
    try {
      const answers = PROMPTS.map((_, i) => (g.ans ? g.ans[i] : undefined));
      if (answers.some((v) => v == null)) return;
      const r = await fetch('/api/aorb', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ quizId: PUZZLE.quizId, answers, anonId: getAnonId(), email: identity?.email || undefined }),
      });
      const d = await r.json();
      if (d && !d.error && Array.isArray(d.prompts)) {
        setG((cur) => (cur.status === 'done' ? { ...cur, result: d } : cur));
        try { setStats(recordLiveStat(PUZZLE.num, d.posted)); } catch (e) {}
      }
    } catch (e) {}
  }
  useEffect(() => {
    if (!hydrated || g.status !== 'done') return;
    let alive = true;
    const run = () => { if (alive && (typeof document === 'undefined' || document.visibilityState !== 'hidden')) refreshLive(); };
    run();
    const iv = setInterval(run, 25000);
    const onVis = () => { if (document.visibilityState === 'visible') run(); };
    if (typeof document !== 'undefined') document.addEventListener('visibilitychange', onVis);
    return () => { alive = false; clearInterval(iv); if (typeof document !== 'undefined') document.removeEventListener('visibilitychange', onVis); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hydrated, g.status, PUZZLE.quizId, identity?.email]);

  function say(msg) {
    setToast(msg);
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(null), 2400);
  }

  const elapsed = g.t0 ? fmtTime((g.tEnd || nowTick) - g.t0) : '0:00';
  const isTodays = PUZZLE.num === pickPuzzle(puzzles, null).num;
  const iq = useIqStanding({ game: 'aorb', quizId: PUZZLE.quizId, active: LOFT && !playing });
  const nextUp = useNextUnplayed({ self: 'aorb', active: LOFT && !playing });
  const upNext = useUnplayedSimilar({ self: 'aorb', active: LOFT && !playing });
  const dailyBoard = useDailyBoard({ quizId: PUZZLE.quizId, active: LOFT && !playing });
  const allTime = useGameAllTime({ game: 'aorb', active: LOFT && !playing });
  const dayStats = useDayStats();
  const catRank = useCategoryRank({ self: 'aorb', active: LOFT && !playing });
  const prevPuzzle = puzzles.find((x) => x.num === PUZZLE.num - 1) || null;
  const myStats = deriveStats(stats, pickPuzzle(puzzles, null).num);

  const REC_KEY = `sot_aorb_rec_${PUZZLE.num}`;
  const abandon = useAbandonFlush(() => {
    const acted = Object.keys(g.ans).length > 0;
    if (!acted || g.status !== 'playing') return null;
    try { if (localStorage.getItem(REC_KEY)) return null; } catch (e) {}
    const el = Math.min(36000, Math.max(1, Math.round((Date.now() - (g.t0 || Date.now())) / 1000)));
    try { localStorage.setItem(REC_KEY, '1'); } catch (e) {}
    return { quizId: PUZZLE.quizId, score: 0, total: 100, correct: 0, guessesUsed: 0, timeElapsed: el, abandoned: true, email: identity?.email || undefined, anonId: getAnonId(), isMobile: isMobileDevice(), referrer: (typeof document !== 'undefined' ? document.referrer : '') };
  });

  function postResult(g2, sc) {
    abandon.markFlushed();
    // The room's read is where this run stands in the live field (lib/read-room.js).
    if (EMBED) EMBED.onResult({ key: 'aorb', score: sc, total: 100, t0: g2 && g2.t0, tEnd: (g2 && g2.tEnd) || Date.now(), read: (g2 && g2.result && g2.result.board && g2.result.board.read) || null, field: (g2 && g2.result && (g2.result.realCount != null ? g2.result.realCount : g2.result.board && g2.result.board.field)) || null });
    const el = g2.t0 ? Math.max(1, Math.round(((g2.tEnd || Date.now()) - g2.t0) / 1000)) : 1;
    try { setStats(recordStat(PUZZLE.num, { s: sc, t: 100, g: 0, won: sc >= 60, fin: sc })); } catch (e) {}
    try {
      fetch('/api/quiz/result', {
        method: 'POST',
        keepalive: true,
        headers: { 'Content-Type': 'application/json' },
        // guessesUsed = 0 for everyone (there are no wrong answers to count), so
        // the daily board's tiebreak falls through to fastest time.
        body: JSON.stringify({ quizId: PUZZLE.quizId, score: sc, total: 100, correct: sc >= 60 ? 1 : 0, guessesUsed: 0, timeElapsed: el, email: identity?.email || undefined, anonId: getAnonId(), isMobile: isMobileDevice(), referrer: (typeof document !== 'undefined' ? document.referrer : '') }),
      })
        .then((r) => r.json())
        .then((d) => { if (d && !d.error) setBoard({ ...EMPTY_BOARD, ...d }); })
        .catch(() => {});
    } catch (e) {}
  }

  // ---- animation clocks (requestAnimationFrame, eased) ----
  function tween(key, setter, delay, dur) {
    if (rafRef.current[key]) cancelAnimationFrame(rafRef.current[key]);
    const t0 = performance.now();
    setter(0);
    const tick = (now) => {
      const p = Math.max(0, Math.min(1, (now - t0 - delay) / dur));
      setter(1 - Math.pow(1 - p, 3));
      rafRef.current[key] = p < 1 ? requestAnimationFrame(tick) : null;
    };
    rafRef.current[key] = requestAnimationFrame(tick);
  }
  useEffect(() => () => { Object.values(rafRef.current).forEach((id) => id && cancelAnimationFrame(id)); }, []);

  // ---- the previous room, settled (owner, 2026-10-23) ----
  // Only for a player who played an EARLIER Aorb: the latest one on record,
  // re-scored now that its day is over, shown before today's first pair.
  useEffect(() => {
    if (!hydrated || !isTodays || !playing || g.t0) return;
    const rec = (stats && stats.rec) || {};
    const prevNums = Object.keys(rec).map(Number).filter((n) => n < PUZZLE.num).sort((x, y) => y - x);
    const lastNum = prevNums[0];
    const lastP = lastNum ? puzzles.find((x) => x.num === lastNum) : null;
    if (!lastP) return;
    let alive = true;
    const em = identity?.email ? `&email=${encodeURIComponent(identity.email)}` : '';
    fetch(`/api/aorb?quizId=${encodeURIComponent(lastP.quizId)}&anonId=${encodeURIComponent(getAnonId() || '')}${em}`)
      .then((r) => r.json())
      .then((d) => {
        if (!alive || !d || !d.played || !Array.isArray(d.prompts)) return;
        setPrior({ puzzle: lastP, result: d, fin: rec[lastNum] && rec[lastNum].fin != null ? rec[lastNum].fin : null });
      })
      .catch(() => {});
    return () => { alive = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hydrated, stats ? Object.keys(stats.rec || {}).length : 0, identity?.email]);

  // When a new pair comes up, it slides in.
  useEffect(() => {
    if (started) tween('enter', setTEnter, 0, 650);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step, started]);

  function startGame() {
    setG((c) => (c.t0 ? c : { ...c, t0: Date.now() }));
    setPriorDone(true);
    try { localStorage.setItem(HELP_KEY, '1'); } catch (e) {}
  }

  // A pick on the stage. When both are in, the pair commits and reveals.
  function pick(kind, side) {
    if (!playing || peeking) return;
    if (g.peeks && g.peeks[step]) return;
    const next = { ...cur, [kind]: side };
    setCur(next);
    if (next.me != null && next.call != null) {
      const i = step;
      setTimeout(() => lockPair(i, next.me, next.call), 280);
    }
  }
  async function lockPair(i, me, call) {
    setPeeking(true);
    setG((c) => ({ ...c, ans: { ...c.ans, [i]: [me, call] }, t0: c.t0 || Date.now() }));
    let pk = null;
    try {
      const r = await fetch('/api/aorb', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ quizId: PUZZLE.quizId, peek: { i, me, call } }),
      });
      const d = await r.json();
      if (d && !d.error && Array.isArray(d.pct)) pk = d;
    } catch (e) {}
    // Offline: the pair still locks, and the reveal says the split is pending.
    if (!pk) pk = { i, me, call, pct: null, read: null, bonus: 0, crowd: -1, offline: true };
    setG((c) => ({ ...c, peeks: { ...c.peeks, [i]: pk } }));
    setPeeking(false);
    tween('reveal', setTReveal, 350, 950);
  }
  // A tap once the reveal has played moves on; after the tenth, the ballot goes in.
  function stageTap() {
    const pk = g.peeks && g.peeks[step];
    if (!pk || tReveal < 1 || sending) return;
    if (!hintSeen) { setHintSeen(true); try { localStorage.setItem(HINT_KEY, '1'); } catch (e) {} }
    if (step < TOTAL - 1) {
      setCur({ me: null, call: null });
      setStep(step + 1);
    } else {
      faceTheCrowd();
    }
  }

  async function faceTheCrowd() {
    if (!playing || sending) return;
    const answers = PROMPTS.map((_, i) => g.ans[i]);
    if (answers.some((v) => !Array.isArray(v))) {
      const open = answers.findIndex((v) => !Array.isArray(v));
      setStep(open); setCur({ me: null, call: null });
      return;
    }
    setSending(true);
    try {
      const r = await fetch('/api/aorb', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ quizId: PUZZLE.quizId, answers, anonId: getAnonId(), email: identity?.email || undefined }),
      });
      const d = await r.json();
      if (!d || d.error || !Array.isArray(d.prompts)) {
        say('Couldn’t reach the crowd. Tap to try again.');
        setSending(false);
        return;
      }
      const g2 = { ...g, status: 'done', result: d, tEnd: Date.now() };
      if (!g2.t0) g2.t0 = Date.now();
      postResult(g2, d.posted);
      setG(g2);
    } catch (e) {
      say('Couldn’t reach the crowd. Tap to try again.');
    }
    setSending(false);
  }

  function resetGame() {
    try { localStorage.removeItem(STORE_KEY); } catch (e) {}
    setG(freshState()); setEndClosed(false); setStep(0); setCur({ me: null, call: null });
  }

  function shareText() {
    const squares = (result ? result.prompts : []).map((p) => (p.read >= 50 ? '\u{1F7EA}' : '⬜')).join('');
    const streakBit = isTodays && myStats.cur >= 2 ? ` · streak ${myStats.cur}` : '';
    const bonusBit = result && result.bonus ? ` · +${result.bonus} surprise` : '';
    return `Aorb #${PUZZLE.num} · read the room ${result ? result.read : 0}${bonusBit}${streakBit}\n${squares}\n${shareUrl()}`;
  }
  function shareUrl() {
    return withRef(`mindloftdaily.com/aorb${isTodays ? '' : `?p=${PUZZLE.num}`}`);
  }
  function copyShare() {
    const text = playing
      ? `Aorb #${PUZZLE.num}, the daily A or B crowd game from Mind Loft.\n${shareUrl()}`
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

  // ---- THE STAGE: question and answers, nothing else (owner, 2026-10-23) ----
  function renderStage() {
    const i = Math.min(Math.max(0, step), TOTAL - 1);
    const pr = PROMPTS[i];
    const pk = g.peeks ? g.peeks[i] : null;
    const shown = !!pk;
    const me = shown ? pk.me : cur.me;
    const call = shown ? pk.call : cur.call;
    const t = shown ? tReveal : 0;
    const e = tEnter;
    const eOpt = Math.max(0, Math.min(1, (e - 0.2) / 0.8));
    const firstHint = !hintSeen && i === 0 && isTodays;
    const pct = shown && pk.pct ? pk.pct : null;
    return (
      <div className="ab-stage" role="dialog" aria-label={`Aorb, pair ${i + 1} of ${TOTAL}`} onClick={shown ? stageTap : undefined}
        style={{ cursor: shown ? 'pointer' : 'default' }}>
        {shown && <div className="ab-sweep" aria-hidden="true" />}
        <BrandFit><a className="ab-brand" href="/" aria-label="Mind Loft home" onClick={(ev) => ev.stopPropagation()}>
          <MindLoftMark size={24} ink="currentColor" accent="var(--stg-brand,#7dd3fc)" title="Mind Loft" />
          <span>Mind <span style={{ color: 'var(--stg-brand,#7dd3fc)' }}>Loft</span></span>
        </a></BrandFit>
        <div className="ab-col">
          <div className="ab-qwrap" style={{ opacity: e, transform: `translateY(${Math.round((1 - e) * 18)}px)` }}>
            <h1 className="ab-q">{pr.q}</h1>
            {firstHint && !shown && (
              <p className="ab-hint ab-rise">Tap <b>Me</b> on your honest pick and <b>Crowd</b> on what most players will pick.</p>
            )}
          </div>
          <div className="ab-opts">
            {[0, 1].map((side) => {
              const win = shown && pct && pk.crowd === side;
              const fill = pct ? Math.round(pct[side] * t) : 0;
              return (
                <div key={side} className={`ab-opt${shown ? (win ? ' ab-win' : ' ab-lose') : ''}`}
                  style={{ opacity: eOpt, transform: `translateX(${Math.round((side ? 1 : -1) * (1 - eOpt) * 60)}px)` }}>
                  <div className="ab-fill" style={{ width: `${fill}%`, '--ab-fill': `${fill}%` }} />
                  <div className="ab-name">
                    <span>{pr.options[side]}</span>
                    {shown && (
                      <span className="ab-tags">
                        {me === side && <span className="ab-tag">Me</span>}
                        {call === side && <span className="ab-tag ab-tag-on">Crowd Call</span>}
                      </span>
                    )}
                  </div>
                  {!shown && (
                    <div className="ab-pills">
                      <button type="button" className={`ab-pill${me === side ? ' on' : ''}`} aria-pressed={me === side} onClick={() => pick('me', side)} disabled={peeking}>Me</button>
                      <button type="button" className={`ab-pill${call === side ? ' on' : ''}`} aria-pressed={call === side} onClick={() => pick('call', side)} disabled={peeking}>Crowd</button>
                    </div>
                  )}
                  {shown && <span className="ab-pct">{pct ? `${Math.round(pct[side] * t)}%` : '…'}</span>}
                  {win && (
                    <div className="ab-burst" aria-hidden="true"><div className="ab-ring" />{[1, 2, 3, 4, 5, 6, 7, 8].map((k) => <div key={k} className={`ab-dot d${k}`} />)}</div>
                  )}
                </div>
              );
            })}
          </div>
          {shown && firstHint && <p className="ab-hint ab-rise2">Tap anywhere to continue</p>}
          {shown && sending && <p className="ab-hint">Sending your ten to the crowd…</p>}
        </div>
      </div>
    );
  }

  // ---- the last room, settled: shown before a returning player's first pair ----
  function renderPrior() {
    const r = prior.result;
    const best = r.prompts.reduce((b, p) => (b == null || p.read > b.read ? p : b), null);
    const worst = r.prompts.reduce((b, p) => (b == null || p.read < b.read ? p : b), null);
    const moved = prior.fin != null ? r.posted - prior.fin : null;
    const rank = r.board && r.board.you;
    return (
      <div className="ab-stage ab-prior">
        <div className="ab-col">
          <div className="ab-qwrap">
            <span className="ab-eyebrow">Your last Aorb · {prior.puzzle.dateLabel.replace(/, \d{4}$/, '')}</span>
            <h1 className="ab-q" style={{ fontSize: 30 }}>Your last room has settled.</h1>
          </div>
          <div className="ab-priorcard">
            <div className="ab-priorrow">
              <div><span className="ab-k">Final score</span><span className="ab-big">{r.posted}</span></div>
              {prior.fin != null && (
                <div style={{ textAlign: 'right' }}>
                  <span className="ab-k">At your finish</span><span className="ab-mid">{prior.fin}</span>
                  <span className="ab-k">{moved > 0 ? `Up ${moved} since` : moved < 0 ? `Down ${-moved} since` : 'Held steady'}</span>
                </div>
              )}
            </div>
            <div className="ab-line" />
            <div className="ab-priorrow" style={{ fontSize: 15, fontWeight: 800 }}>
              <span>Read the room {r.read}{r.bonus ? ` · +${r.bonus} surprise` : ''}</span>
              {rank ? <span>#{rank.rank} of {fmtBig(r.board.registered)}</span> : null}
            </div>
          </div>
          {best && (
            <div className="ab-note"><span className="ab-k">Best read</span><b>{best.options[0]} or {best.options[1]}</b><span>You called {best.options[best.call]}. It settled at {best.pct ? best.pct[best.call] : best.read}%.</span></div>
          )}
          {worst && worst !== best && (
            <div className="ab-note"><span className="ab-k">Biggest miss</span><b>{worst.options[0]} or {worst.options[1]}</b><span>You called {worst.options[worst.call]}. The room went {worst.pct ? worst.pct[1 - worst.call] : 100 - worst.read}% the other way.</span></div>
          )}
          <button type="button" className="ab-go" onClick={startGame}>Start Today&rsquo;s Aorb</button>
        </div>
      </div>
    );
  }

  // Shared rules body — rendered in both the how-to-play modal and the start gate.
  const rulesBody = (
    <DailyRules
      accent={COLORS.accent} accentSoft={COLORS.accentSoft}
      lead="The crowd is everyone playing today."
      banner="Ten A or B pairs. On each one, make your pick AND call the crowd's."
      steps={[
        <><b>Tap Me</b> on the side you honestly prefer, and <b>tap Crowd</b> on the side you think most players picked as their own. They can differ.</>,
        <><b>Your crowd call scores the real split:</b> call the side that went 72 to 28 and you earn 72, call the 28 side and you earn 28. Ten pairs are averaged into a score out of 100.</>,
        <><b>Surprise bonus:</b> +1 when your own pick turns out more popular than the room predicted it would be.</>,
      ]}
      knack="Your own pick never counts for you: every call is checked against everyone else."
      note={<><b>Nothing is final.</b> Every new player re-scores the whole field, so your score and rank move until midnight.</>}
      footer="Ties on the board go to the sharper crowd read, then to the earliest player."
    />
  );

  return (
    <div className={STAGE ? 'stage-page' : (LOFT ? 'loft-page' : undefined)}
      data-stage-theme={STAGE ? (EMBED ? (EMBED.theme || 'dark') : stageTheme) : undefined}
      data-stage-pin={STAGE && EMBED ? '' : undefined}
      style={{ ...(STAGE ? STAGE_ACC : null), minHeight: '100vh', position: 'relative', background: STAGE ? 'var(--stg-ground)' : T.surface, color: STAGE ? 'var(--stg-ink,#e9edf4)' : undefined, overflowX: (STAGE || LOFT) ? 'hidden' : undefined }}>
      {!STAGE && <Grain />}
      {/* THE STAGE: full screen while playing (renderStage), and the last
          room's settled result before a returning player starts. Rendered at the
          page root so no stacking context can sit above it. */}
      {started && renderStage()}
      {preStart && prior && !priorDone && renderPrior()}
      {/* Shared daily chrome (app/DailyChrome.jsx): home masthead + stat bar +
          today's slate rail, collapsing to one line once the clock runs. Outside
          the page wrapper so the bands run full bleed; nothing here is pinned. */}
      {!STAGE && (
      <DailyChrome slug="aorb" name="Aorb" collapsed={started} loft={LOFT} />
      )}
      {LOFT && !EMBED && (
        <Cap gameKey="aorb" quizId={PUZZLE.quizId}
          name="Aorb"
          cat="Crowd Psychology"
          outcome={playing ? null : 'won'}
          num={PUZZLE.num}
          tiles={playing ? null : upNext}
          dateLabel={PUZZLE.dateLabel}
          onHelp={() => setShowHelp(true)}
          sunday={PUZZLE.sunday ? 'Sunday Edition' : null}
          figures={playing ? [
            { v: `${answered}/${TOTAL}`, k: 'pairs' },
            { v: elapsed, k: 'time' },
          ] : [
            { v: String(score), k: 'score' },
            { v: elapsed, k: 'time' },
          ]}
        />
      )}
      <div className="ab-wrap" style={{ position: 'relative', zIndex: 2, maxWidth: 1180, margin: '0 auto', padding: '18px 38px 80px', fontFamily: SANS }}>
        <style dangerouslySetInnerHTML={{ __html: `
          @media(max-width:560px){.ab-wrap{padding-left:12px !important;padding-right:12px !important;}}
          .ab-btn{font-family:${SANS};font-weight:800;font-size:14px;border:2px solid ${STAGE ? 'var(--stg-line2)' : 'var(--blue-deep)'};background:${STAGE ? 'transparent' : 'var(--white)'};color:${STAGE ? 'var(--stg-ink)' : 'var(--blue-deep)'};border-radius:8px;padding:9px 16px;cursor:pointer;display:inline-flex;align-items:center;gap:7px;}
          .ab-btn:hover{background:var(--stg-surf2, var(--accent-soft));}
          .ab-opt{font-family:${SANS};font-weight:800;font-size:13.5px;border: 2px solid var(--stg-line, rgba(28,30,36,0.3));background:${STAGE ? 'var(--stg-surf)' : 'var(--white)'};color:${INK};border-radius:9px;padding:9px 14px;cursor:pointer;}
          .ab-opt:hover{border-color:var(--stg-acc-ink, var(--stg-acc, ${COLORS.accent}));}
          .ab-opt-on{background:var(--stg-acc, ${COLORS.accent});border-color:var(--stg-acc-ink, var(--stg-acc, ${COLORS.accent}));color:var(--stg-onramp, var(--white));box-shadow:0 0 0 3px rgba(232,180,58,0.45);}
          .ab-inp{font-family:${MONO};font-weight:500;font-size:22px;letter-spacing:0.06em;width:200px;max-width:100%;border:2px solid ${COLORS.ink};border-radius:9px;padding:8px 12px;background:${STAGE ? 'var(--stg-surf)' : 'var(--white)'};color:${INK};outline:none;}
          .ab-inp:focus{border-color:var(--stg-acc-ink, var(--stg-acc, ${COLORS.accent}));box-shadow:0 0 0 3px color-mix(in srgb, var(--stg-acc-ink, var(--stg-acc, ${COLORS.accent})) 14%, transparent);}
          .ab-face{font-family:${SANS};font-weight:800;font-size:15px;letter-spacing:0.05em;text-transform:uppercase;border:none;background:var(--stg-acc, ${COLORS.accent});color:var(--stg-onramp, var(--white));border-radius:10px;padding:0 26px;height:56px;cursor:pointer;display:inline-flex;align-items:center;gap:10px;box-shadow:0 3px 0 rgba(20,22,28,0.25);}
          .ab-face:active{transform:translateY(1px);box-shadow:0 2px 0 rgba(20,22,28,0.25);}
          .ab-face:disabled{opacity:.55;cursor:default;}
          .ab-face .ab-gold{color:${COLORS.gold};}
          .ab-step{display:flex;flex-direction:column;}
          .ab-strip{display:grid;gap:8px;}
          .ab-seg{display:flex;flex-direction:column;align-items:stretch;gap:6px;min-height:44px;background:none;border:0;padding:0 0 4px;margin:0;cursor:pointer;text-align:left;font-family:${SANS};min-width:0;}
          .ab-seg-bar{display:block;height:6px;border-radius:3px;}
          .ab-seg-tag{font-family:${MONO};font-size:10px;font-weight:500;letter-spacing:0.12em;text-transform:uppercase;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}
          .ab-seg-ans{font-size:13px;font-weight:800;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;padding-bottom:.16em;margin-bottom:-.16em;}
          .ab-cur{display:flex;flex-direction:column;gap:10px;margin:28px 0 22px;}
          .ab-eyebrow{font-family:${MONO};font-size:12px;font-weight:500;letter-spacing:0.16em;text-transform:uppercase;}
          .ab-q{font-size:30px;font-weight:800;line-height:1.18;letter-spacing:-0.02em;}
          .ab-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:14px;}
          .ab-grid-many{grid-template-columns:repeat(4,minmax(0,1fr));}
          .ab-grid-txt.ab-grid-many{grid-template-columns:repeat(2,minmax(0,1fr));gap:10px;}
          .ab-sw{position:relative;display:flex;flex-direction:column;justify-content:flex-end;align-items:flex-start;height:150px;border-radius:18px;border:2px solid var(--stg-line2, rgba(28,30,36,0.24));padding:16px 18px;box-sizing:border-box;font-family:${SANS};font-weight:800;font-size:20px;cursor:pointer;text-align:left;}
          .ab-grid-many .ab-sw{height:112px;font-size:17px;padding:12px 14px;}
          .ab-sw-on{border:4px solid var(--stg-ink, ${COLORS.ink});box-shadow:0 0 0 3px var(--stg-ground, #fff), 0 0 0 5px var(--stg-ink, ${COLORS.ink});}
          .ab-pick{position:absolute;top:12px;right:12px;font-family:${MONO};font-size:11px;font-weight:500;letter-spacing:0.12em;text-transform:uppercase;background:#0b0f1a;color:#ffffff;border:1.5px solid rgba(255,255,255,0.75);border-radius:6px;padding:4px 8px;}
          .ab-card{position:relative;display:flex;align-items:flex-start;min-height:76px;border-radius:14px;border:2px solid var(--stg-line3, rgba(28,30,36,0.35));background:var(--stg-surf2, #fff);color:${INK};padding:30px 16px 14px;box-sizing:border-box;font-family:${SANS};font-weight:800;font-size:17px;line-height:1.25;cursor:pointer;text-align:left;}
          .ab-card:hover{border-color:var(--stg-acc-ink, var(--stg-acc, ${COLORS.accent}));}
          .ab-card-on{background:var(--stg-acc, ${COLORS.accent});border-color:var(--stg-acc-ink, var(--stg-acc, ${COLORS.accent}));color:var(--stg-onramp, #fff);}
          .ab-card .ab-pick{top:9px;left:14px;right:auto;border:0;}
          .ab-numwrap{display:flex;flex-direction:column;align-items:flex-start;gap:8px;}
          .ab-big{font-family:${MONO};font-weight:500;font-size:44px;letter-spacing:0.04em;width:280px;max-width:100%;box-sizing:border-box;border:2px solid var(--stg-cell-line, ${COLORS.ink});border-radius:14px;padding:12px 18px;background:var(--stg-cell, #fff);color:${INK};outline:none;}
          .ab-big::placeholder{color:var(--stg-mute, ${COLORS.faded});font-size:22px;letter-spacing:0;}
          .ab-big:focus{border-color:var(--stg-acc-ink, var(--stg-acc, ${COLORS.accent}));box-shadow:0 0 0 3px color-mix(in srgb, var(--stg-acc-ink, var(--stg-acc, ${COLORS.accent})) 22%, transparent);}
          .ab-numhint{font-size:13px;font-weight:700;}
          .ab-sealed{display:flex;align-items:center;gap:14px;background:var(--stg-surf, ${COLORS.accentSoft});border:1px solid var(--stg-line, rgba(28,30,36,0.12));border-radius:14px;padding:14px 16px;margin-top:22px;font-size:14px;font-weight:600;line-height:1.45;}
          .ab-nav{display:flex;align-items:center;justify-content:space-between;gap:10px;margin-top:20px;}
          .ab-back{font-family:${SANS};font-weight:700;font-size:15px;background:transparent;color:${INK};border:1.5px solid var(--stg-line3, rgba(28,30,36,0.4));border-radius:12px;padding:0 20px;min-height:50px;cursor:pointer;}
          .ab-back:disabled{opacity:.4;cursor:default;}
          .ab-go{font-family:${SANS};font-weight:800;font-size:15px;border-radius:12px;padding:0 24px;min-height:50px;cursor:pointer;}
          .ab-go-on{background:var(--stg-acc, ${COLORS.accent});color:var(--stg-onramp, #fff);border:0;}
          .ab-go-off{background:transparent;color:${INK};border:1.5px solid var(--stg-line3, rgba(28,30,36,0.4));}
          .ab-face.ab-go{height:auto;min-height:50px;font-size:14px;}
          @media(max-width:640px){
            .ab-strip{gap:5px;}
            .ab-seg-tag{font-size:8.5px;letter-spacing:0.06em;}
            .ab-seg-ans{display:none;}
            .ab-strip{gap:3px;}
            .ab-cur{margin:20px 0 18px;gap:8px;}
            .ab-eyebrow{font-size:11px;letter-spacing:0.14em;}
            .ab-q{font-size:24px;line-height:1.2;}
            .ab-grid{gap:10px;}
            .ab-grid-many{grid-template-columns:repeat(2,minmax(0,1fr));}
            .ab-sw,.ab-grid-many .ab-sw{height:auto;min-height:112px;font-size:17px;padding:12px 14px;border-radius:16px;}
            .ab-grid:not(.ab-grid-many) .ab-sw{min-height:150px;}
            .ab-pick{font-size:9px;top:10px;right:10px;padding:4px 6px;}
            .ab-card{min-height:70px;font-size:15.5px;padding:28px 12px 12px;}
            .ab-sealed{font-size:13px;padding:12px 14px;}
            .ab-sealed svg{display:none;}
            .ab-back{flex:1;padding:0 10px;}
            .ab-go{flex:2;padding:0 12px;min-height:52px;}
            .ab-face.ab-go{justify-content:center;}
          }
          .ab-stage{position:fixed;inset:0;z-index:85;background:var(--stg-acc, #6d28d9);color:var(--stg-onramp, #fff);display:flex;justify-content:center;overflow-y:auto;overflow-x:hidden;font-family:${SANS};-webkit-tap-highlight-color:transparent;}
          /* The play stage wears the soft Crowd ground with the dark ink in both registers (owner, 2026-10-24). */
          .stage-page .ab-stage{--stg-acc:#d9b5fd;--stg-onramp:#08222e;}
          .ab-stage, .ab-stage .ab-opt, .ab-stage .ab-name, .ab-stage .ab-name span, .ab-stage .ab-pill, .ab-stage .ab-pct, .ab-stage .ab-tag, .ab-stage .ab-q, .ab-stage .ab-hint, .ab-stage .ab-note, .ab-stage .ab-k, .ab-stage .ab-big, .ab-stage .ab-mid, .ab-stage .ab-eyebrow{color:var(--stg-onramp, #fff) !important;opacity:1;}
          .ab-stage .ab-pill.on, .ab-stage .ab-tag-on, .ab-stage .ab-go{color:var(--stg-acc, #6d28d9) !important;}
          .ab-brand{position:fixed;top:max(12px, env(safe-area-inset-top));left:14px;z-index:3;display:inline-flex;align-items:center;gap:8px;height:40px;text-decoration:none;color:inherit;font-weight:800;font-size:16px;letter-spacing:-.01em;}
          .ab-col{position:relative;z-index:2;width:100%;max-width:560px;box-sizing:border-box;padding:max(68px, calc(env(safe-area-inset-top) + 56px)) 16px 28px;display:flex;flex-direction:column;justify-content:center;gap:30px;min-height:100%;}
          .ab-qwrap{text-align:center;}
          .ab-q{margin:0;font-size:36px;line-height:1.1;font-weight:800;letter-spacing:-0.02em;color:inherit;}
          .ab-eyebrow{display:block;margin-bottom:10px;font-size:13px;font-weight:800;letter-spacing:0.12em;text-transform:uppercase;opacity:.85;}
          .ab-hint{margin:14px 0 0;text-align:center;font-size:15px;line-height:1.4;font-weight:700;opacity:.92;}
          .ab-opts{display:flex;flex-direction:column;gap:12px;}
          .ab-opt{position:relative;overflow:visible;box-sizing:border-box;min-height:124px;border-radius:18px;padding:16px;display:flex;align-items:center;gap:12px;background:color-mix(in srgb, currentColor 8%, transparent);border:2px solid currentColor;}
          .ab-opt.ab-win{border-color:currentColor;animation:abGlow 1s ease-out .6s 2;}
          .ab-opt.ab-lose{border-color:color-mix(in srgb, currentColor 35%, transparent);}
          .ab-fill{position:absolute;left:0;top:0;bottom:0;border-radius:16px;background:color-mix(in srgb, currentColor 22%, transparent);pointer-events:none;}
          .ab-name{position:relative;z-index:1;flex:1;min-width:0;display:flex;flex-direction:column;gap:6px;font-size:23px;line-height:1.15;font-weight:800;}
          .ab-tags{display:flex;gap:6px;flex-wrap:wrap;}
          .ab-tag{font-size:12px;font-weight:800;border:1.5px solid currentColor;border-radius:999px;padding:3px 9px;}
          .ab-tag-on{background:var(--stg-onramp, #fff);color:var(--stg-acc, #6d28d9);border-color:var(--stg-onramp, #fff);}
          .ab-pills{position:relative;z-index:1;display:flex;flex-direction:column;gap:8px;flex:none;}
          .ab-pill{width:88px;min-height:44px;border-radius:999px;font-family:${SANS};font-size:14px;font-weight:800;cursor:pointer;background:transparent;color:inherit;border:2px solid currentColor;transition:background .15s,color .15s;}
          .ab-pill.on{background:var(--stg-onramp, #fff);color:var(--stg-acc, #6d28d9);border-color:var(--stg-onramp, #fff);}
          .ab-pill:focus-visible{outline:3px solid currentColor;outline-offset:2px;}
          .ab-pct{position:relative;z-index:1;flex:none;min-width:100px;text-align:right;font-size:46px;line-height:1;font-weight:800;font-variant-numeric:tabular-nums;}
          .ab-sweep{position:fixed;inset:0;z-index:1;pointer-events:none;background:linear-gradient(90deg,transparent,color-mix(in srgb, var(--stg-onramp, #fff) 20%, transparent) 30%,color-mix(in srgb, var(--stg-onramp, #fff) 55%, transparent) 50%,color-mix(in srgb, var(--stg-onramp, #fff) 20%, transparent) 70%,transparent);animation:abSweep .8s cubic-bezier(.6,0,.3,1) forwards;}
          .ab-burst{position:absolute;right:58px;top:50%;width:0;height:0;pointer-events:none;z-index:2;}
          .ab-ring{position:absolute;left:0;top:0;width:80px;height:80px;border-radius:50%;border:3px solid currentColor;animation:abRing .85s ease-out .55s both;}
          .ab-dot{position:absolute;left:-5px;top:-5px;width:10px;height:10px;border-radius:50%;background:currentColor;animation-duration:.9s;animation-timing-function:ease-out;animation-delay:.6s;animation-fill-mode:both;}
          .ab-dot.d2,.ab-dot.d5,.ab-dot.d8{opacity:.7}.ab-dot.d3,.ab-dot.d6{opacity:.45}
          .ab-dot.d1{animation-name:abD1}.ab-dot.d2{animation-name:abD2}.ab-dot.d3{animation-name:abD3}.ab-dot.d4{animation-name:abD4}.ab-dot.d5{animation-name:abD5}.ab-dot.d6{animation-name:abD6}.ab-dot.d7{animation-name:abD7}.ab-dot.d8{animation-name:abD8}
          .ab-rise{animation:abRise .45s ease-out .2s both;}.ab-rise2{animation:abRise .45s ease-out 1.4s both;}
          .ab-priorcard{border-radius:18px;padding:18px;background:color-mix(in srgb, currentColor 12%, transparent);border:2px solid currentColor;display:flex;flex-direction:column;gap:12px;}
          .ab-priorrow{display:flex;justify-content:space-between;align-items:flex-end;gap:12px;}
          .ab-k{display:block;font-size:13px;font-weight:700;opacity:.85;}
          .ab-big{display:block;font-size:56px;line-height:1;font-weight:800;}
          .ab-mid{display:block;font-size:24px;font-weight:800;}
          .ab-line{height:1px;background:color-mix(in srgb, currentColor 30%, transparent);}
          .ab-note{border-radius:14px;padding:12px 14px;background:color-mix(in srgb, currentColor 10%, transparent);display:flex;flex-direction:column;gap:3px;font-size:14px;line-height:1.4;}
          .ab-note b{font-size:16px;}
          .ab-go{min-height:54px;border-radius:14px;border:0;cursor:pointer;background:var(--stg-onramp, #fff);color:var(--stg-acc, #6d28d9);font-family:${SANS};font-size:17px;font-weight:800;}
          @keyframes abSweep{0%{transform:translateX(-105%)}45%{transform:translateX(0)}100%{transform:translateX(105%)}}
          @keyframes abGlow{0%{box-shadow:0 0 0 0 color-mix(in srgb, currentColor 60%, transparent)}100%{box-shadow:0 0 0 16px transparent}}
          @keyframes abRise{from{transform:translateY(14px);opacity:0}to{transform:none;opacity:1}}
          @keyframes abRing{0%{transform:translate(-50%,-50%) scale(.2);opacity:.9}100%{transform:translate(-50%,-50%) scale(3);opacity:0}}
          @keyframes abD1{to{transform:translate(80px,-70px);opacity:0}}@keyframes abD2{to{transform:translate(-80px,-70px);opacity:0}}
          @keyframes abD3{to{transform:translate(110px,0);opacity:0}}@keyframes abD4{to{transform:translate(-110px,0);opacity:0}}
          @keyframes abD5{to{transform:translate(70px,70px);opacity:0}}@keyframes abD6{to{transform:translate(-70px,70px);opacity:0}}
          @keyframes abD7{to{transform:translate(0,-85px);opacity:0}}@keyframes abD8{to{transform:translate(0,85px);opacity:0}}
          @media(min-width:900px){.ab-col{max-width:820px;gap:44px;padding:48px 32px;}.ab-q{font-size:58px;}.ab-opts{flex-direction:row;gap:20px;}.ab-opt{flex:1 1 0;min-height:260px;flex-direction:column;align-items:stretch;justify-content:space-between;padding:24px;}.ab-name{font-size:32px;}.ab-pills{flex-direction:row;}.ab-pill{flex:1;width:auto;min-height:52px;font-size:16px;}.ab-pct{text-align:left;font-size:64px;}.ab-fill{left:0;right:0;top:auto;bottom:0;width:auto !important;height:var(--ab-fill);}.ab-burst{right:50%;top:60%;}.ab-hint{font-size:17px;}.ab-big{font-size:72px;}}
          @media(max-width:420px){.ab-q{font-size:30px;}.ab-name{font-size:20px;}.ab-pct{font-size:38px;min-width:84px;}.ab-pill{width:76px;}}
          @media (prefers-reduced-motion: reduce){.ab-sweep,.ab-burst{display:none}.ab-opt.ab-win,.ab-rise,.ab-rise2{animation:none}}
          @media(max-width:560px){.ab-ttl{flex-direction:column;align-items:flex-start;gap:1px;}.ab-ttl h1{font-size:21px;letter-spacing:0.02em;}.ab-ttl .ab-ttl-dt{font-size:15px;}.ab-ttl-dot{display:none;}}
        ` }} />

        <div style={{ maxWidth: 640, margin: '0 auto' }}>


        {/* masthead: pressed OUTWIT tiles with No./date inline */}
        {!LOFT && (
        <DailyMasthead
          slug="aorb"
          num={PUZZLE.num}
          dateLabel={PUZZLE.dateLabel}
          accent={COLORS.accent}
          blockGap={4}
          helpTop={13}
          marginBottom={16}
          onHelp={() => setShowHelp(true)}
          sunday={PUZZLE.sunday && <span style={{ fontFamily: MONO, fontSize: 9.5, letterSpacing: '0.1em', textTransform: 'uppercase', fontWeight: 500, color: `var(--stg-onramp, ${T.white})`, background: `var(--stg-acc, ${COLORS.accent})`, borderRadius: 4, padding: '2px 6px' }}>Sunday Edition &middot; Six prompts</span>}
          blocks={'AORB'.split('').map((ch, i) => (
              <div key={i} style={{ width: 38, height: 38, borderRadius: 5, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: SANS, fontWeight: 900, fontSize: 22, background: i >= 3 ? `var(--stg-acc, ${COLORS.accent})` : COLORS.ink, color: i >= 3 ? COLORS.gold : T.white, boxShadow: 'inset 0 2px 5px rgba(0,0,0,0.5), 0 1px 0 rgba(255,255,255,0.65)' }}>{ch}</div>
            ))}
        />
        )}

        {/* LOFT: the play area sits on the navy stage, which runs full bleed
            and fills the first screen, so the board is the one lit object. */}
        <div className={LOFT && !STAGE ? 'loft-stage' : undefined}>
          <div className={LOFT && !STAGE && !playing ? (revealed ? 'loft-flip' : 'loft-flip on') : undefined}>
          <div className={LOFT && !STAGE && !playing ? 'loft-flip-in' : undefined}>
          <div className={LOFT && !STAGE && !playing ? 'loft-face' : undefined}>
          <div className={LOFT && !STAGE ? 'loft-sheet' : undefined}>

        {/* start tile — sits where the prompts go; the prompts stay sealed
            until the player presses Start, which begins the clock. */}
        {preStart && (
          <div className={STAGE ? 'stg-gate' : (LOFT ? 'loft-card' : undefined)} style={{ background: `var(--stg-surf, ${COLORS.accentSoft})`, border: `2px solid var(--stg-line, ${COLORS.ink})`, borderRadius: 12, padding: '22px', display: 'flex', flexDirection: 'column' }}>
            <div style={{ fontSize: 20, fontWeight: 800, color: INK, marginBottom: 10 }}>{gateRules ? 'How to play' : 'Aorb is ready'}</div>
            {gateRules ? rulesBody : (
              <div style={{ fontSize: 14, lineHeight: 1.55, color: INK, fontWeight: 600 }}>
                <p style={{ margin: '0 0 6px' }}>Ten A or B pairs. Make your own pick, then call the crowd&rsquo;s.</p>
              </div>
            )}
            <div style={{ marginTop: 18, display: 'flex', flexDirection: 'row-reverse', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
              <button className="ab-btn" onClick={startGame} style={{ borderColor: STAGE ? STAGE_C_INK : undefined, background: STAGE ? STAGE_C : T.cta, color: STAGE ? 'var(--stg-onramp, #08222e)' : T.white, fontSize: 15, padding: '11px 22px' }}>Start</button>
              <div>
                <button type="button" onClick={() => setGateRules((v) => !v)} style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', fontFamily: SANS, fontSize: 13, fontWeight: 700, color: FADED, textDecoration: 'underline' }}>
                  {gateRules ? 'Hide detailed instructions' : 'Show detailed instructions'}
                </button>
              </div>
            </div>
          </div>
        )}

          </div>
          <div className={STAGE ? undefined : 'loft-sol'}>
          {/* result */}
          {!playing && result && (
            <>
              <div style={{ maxWidth: 472, margin: '0 auto 12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 14, background: STAGE ? SURF : T.white, border: STAGE ? `1px solid ${SURF_B}` : '1.5px solid rgba(28,30,36,0.18)', borderRadius: 10, padding: '12px 14px' }}>
                  <span style={{ fontFamily: MONO, fontSize: 34, fontWeight: 800, color: `var(--stg-ink, ${COLORS.ink})`, fontVariantNumeric: 'tabular-nums', flex: '0 0 auto' }}>{result.total}</span>
                  <span style={{ fontFamily: SANS, fontSize: 13, fontWeight: 700, color: INK, lineHeight: 1.45 }}>
                    Read the room {result.read}{result.bonus ? <> &middot; +{result.bonus} surprise</> : null}
                    {' '}<span style={{ color: FADED, fontWeight: 600 }}>{result.board && result.board.youRegistered && result.board.you ? <>Live rank #{result.board.you.rank} of {fmtBig(result.board.registered)}{result.board.beat != null ? <> &middot; better than {result.board.beat}%</> : null} &middot; </> : null}A field of {fmtBig(result.realCount != null ? result.realCount : result.poolSize)}</span>
                    <span style={{ display: 'block', color: FADED, fontWeight: 700, fontSize: 12 }}>{result.early ? `Early read: only ${fmtBig(result.realCount)} players so far, so this will move.` : 'Live: it moves until midnight Eastern.'}</span>
                  </span>
                </div>
              </div>
              {/* All ten, each with the split it was scored on. */}
              <div style={{ maxWidth: 472, margin: '0 auto 12px', display: 'flex', flexDirection: 'column', gap: 6 }}>
                {result.prompts.map((rp, i) => (
                  <div key={i} style={{ background: STAGE ? SURF : T.white, border: STAGE ? `1px solid ${SURF_B}` : '1.5px solid rgba(28,30,36,0.14)', borderRadius: 10, padding: '10px 12px' }}>
                    <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginBottom: 6 }}>
                      <span style={{ fontSize: 12, fontWeight: 800, color: FADED }}>{rp.q}</span>
                      <span style={{ marginLeft: 'auto', fontSize: 13, fontWeight: 800, color: INK, fontVariantNumeric: 'tabular-nums' }}>+{rp.read}{rp.bonus ? <span style={{ color: ACC_INK_OW }}> &middot; +1</span> : null}</span>
                    </div>
                    {[0, 1].map((side) => (
                      <div key={side} style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 3 }}>
                        <span style={{ flex: '0 0 44%', fontSize: 13, fontWeight: rp.call === side ? 800 : 600, color: INK, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', paddingBottom: '0.16em', marginBottom: '-0.16em' }}>{rp.options[side]}</span>
                        <div style={{ flex: '1 1 auto', height: 12, borderRadius: 6, background: 'var(--stg-surf2, rgba(28,30,36,0.08))', overflow: 'hidden' }}>
                          <div style={{ width: `${rp.pct ? rp.pct[side] : 0}%`, height: '100%', background: 'var(--stg-acc, #6d28d9)', opacity: rp.crowd === side ? 1 : 0.45 }} />
                        </div>
                        <span style={{ flex: '0 0 auto', minWidth: 96, fontSize: 11.5, fontWeight: 700, color: FADED, whiteSpace: 'nowrap' }}>{rp.pct ? rp.pct[side] : 0}%{rp.me === side ? ' · me' : ''}{rp.call === side ? ' · call' : ''}</span>
                      </div>
                    ))}
                  </div>
                ))}
              </div>
              <AorbLiveBoard board={result.board} />
              <p className={STAGE ? undefined : 'loft-tailnote'} style={{ display: EMBED ? 'none' : undefined, fontSize: 12, color: FADED, fontWeight: 600, margin: '12px 0 0' }}>
                {isTodays ? (
                  <>
                    {countdown ? <>Next Aorb in <b style={{ color: INK, fontVariantNumeric: 'tabular-nums' }}>{countdown}</b>.</> : 'A new crowd forms at midnight Eastern.'}
                    {prevPuzzle && (
                      <>
                        {' '}Meanwhile:{' '}
                        <a href={`/aorb?p=${prevPuzzle.num}`} style={{ color: `var(--stg-ink, ${COLORS.ember})`, fontWeight: 800, textDecoration: 'underline' }}>
                          play yesterday&rsquo;s Aorb &rarr;
                        </a>
                      </>
                    )}
                  </>
                ) : (
                  <>
                    You&rsquo;re playing the {PUZZLE.dateLabel.replace(', 2026', '')} archive.{' '}
                    <a href="/aorb" style={{ color: `var(--stg-ink, ${COLORS.ember})`, fontWeight: 800, textDecoration: 'underline' }}>Back to today&rsquo;s Aorb &rarr;</a>
                    {' · '}
                    <a href="/archive" style={{ color: FADED, fontWeight: 700, textDecoration: 'underline' }}>Puzzle archive</a>
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
          {LOFT && !playing && !EMBED && (
            <LoftFinish
              name="Aorb"
              catRank={catRank}
              outcome="won"
              challengeMetric={result ? score : null}
              title={score >= 95 ? 'Mind Reader' : score >= 80 ? 'The Host' : score >= 60 ? 'Life of the Party' : score >= 40 ? 'Plus-One' : score >= 20 ? 'Wallflower' : 'Wrong Party'}
              detail={result ? `Read the room ${result.read}${result.bonus ? ` \u00b7 +${result.bonus} surprise` : ''}` : ''}
              iq={iq}
              board={dailyBoard}
              gameRank={allTime && allTime.ready
                ? { value: allTime.rank != null ? `#${Number(allTime.rank).toLocaleString()}` : '\u2014',
                    label: allTime.field != null ? `of ${Number(allTime.field).toLocaleString()} Aorb all time` : 'all-time rank' }
                : null}
              day={dayStats}
              streak={isTodays ? myStats.cur : null}
              archive={puzzles
                .filter((p) => p.live <= etToday() && p.num !== PUZZLE.num)
                .sort((x, y) => y.num - x.num)
                .map((p) => ({
                  num: p.num,
                  dateLabel: p.dateLabel,
                  sunday: !!p.sunday,
                  href: `/aorb?p=${p.num}`,
                  done: !!(stats && stats.rec && stats.rec[p.num]),
                  score: (stats && stats.rec && stats.rec[p.num]) ? stats.rec[p.num].s : null,
                }))}
              options={[
                { label: copied ? 'Copied' : (shareCta || 'Share'), sub: 'Your result, no spoilers', kind: 'gold', onClick: copyShare },
                { tone: 'board', label: 'Return to board', sub: 'All ten splits', onClick: () => setRevealed(true) },
              prevPuzzle && { tone: 'another', label: 'Play another Aorb', sub: `No. ${prevPuzzle.num}, yesterday\u2019s puzzle`, href: `/aorb?p=${prevPuzzle.num}` },
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
        {!STAGE && <GamePanel self="aorb" name="Aorb" onShow={() => setShowChrome(true)} />}
        <div style={{ display: (EMBED || (focusMode && !STAGE)) ? 'none' : 'block', margin: '30px auto 0' }}>
          {LOFT && (
            <div className={STAGE ? undefined : 'loft-report'}>
              <ReportIssue self="aorb" name="Aorb" accent="#ffffff" align="center" onHelp={() => setShowHelp(true)} />
            </div>
          )}
          {!LOFT && (
          <DailyGamesGrid replay={!playing && result ? resetGame : null}
            self="aorb"
            maxWidth={640}
            challengeHref={`/duel/new?quiz=${encodeURIComponent(PUZZLE.quizId)}`}
            share={{ label: copied ? 'Copied' : 'Share', onClick: copyShare }}
            light
            boardSlot={<DailyBoardPanel self="aorb" quizId={PUZZLE.quizId} maxWidth={640} streak={{ current: myStats.cur, best: myStats.max }} />}
            divider
          />
          )}
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
              <div style={{ fontSize: 17, fontWeight: 800, color: INK, marginBottom: 8 }}>Add Aorb to your Home Screen</div>
              {isIosDevice() ? (
                <ol style={{ margin: '0 0 4px', paddingLeft: 20, color: INK, fontSize: 14, lineHeight: 1.7 }}>
                  <li>Tap the <b>Share</b> button in Safari&apos;s toolbar.</li>
                  <li>Scroll down and tap <b>Add to Home Screen</b>.</li>
                  <li>Tap <b>Add</b>. The tile opens today&apos;s crowd, every day.</li>
                </ol>
              ) : (
                <p style={{ margin: '0 0 4px', color: INK, fontSize: 14, lineHeight: 1.7 }}>
                  Open your browser&apos;s menu and choose <b>Add to Home Screen</b> (or <b>Install app</b>). The tile opens today&apos;s crowd, every day.
                </p>
              )}
              <button onClick={() => setShowA2hsHelp(false)} style={{ marginTop: 10, fontFamily: SANS, fontSize: 12.5, letterSpacing: '0.05em', textTransform: 'uppercase', fontWeight: 700, height: 44, width: '100%', borderRadius: 10, border: 'none', background: COLORS.ink, color: T.white, cursor: 'pointer' }}>Got it</button>
            </div>
          </div>
        )}
        {!EMBED && !focusMode && !identity && (
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

      {/* the end-of-puzzle popup: the shared DailyEndCard as a dismissible modal */}
      {!playing && result && !endClosed && !LOFT && (
        <DailyEndCard
          modal
          self="aorb"
          won={sharp}
          completed
          score={<>{score}/{TOTAL}</>}
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
            <button className="ab-btn" onClick={() => { setShowHelp(false); try { localStorage.setItem(HELP_KEY, '1'); } catch (e) {} }} style={{ marginTop: 14, background: COLORS.ink, color: T.white }}>Play</button>
          </div>
        </div>
      )}

      {/* The desktop fold: the About prose below starts one screen down (app/StageFold.jsx). */}
      {!EMBED && <StageFold />}
      {/* THE ROOM DOOR: on today's start gate, the Read the Room run is
          offered, once a day. Never inside the run. */}
      {/* About Aorb — crawlable prose for search, server-rendered into the HTML */}
      <section style={{ display: (EMBED || (focusMode && !STAGE)) ? 'none' : 'block', position: 'relative', zIndex: 2, maxWidth: 640, margin: '0 auto', padding: '10px 24px 42px', fontFamily: SANS }}>
        <h2 style={{ margin: '0 0 8px', fontSize: 15, fontWeight: 800, letterSpacing: '-0.01em', color: INK }}>About Aorb</h2>
        <p style={{ margin: '0 0 8px', fontSize: 13, lineHeight: 1.65, color: FADED, fontWeight: 600 }}>
          Aorb is a free daily A or B game from Mind Loft. Every day brings ten pairs to weigh: better movie, better burger, better trip, who is more attractive. On each one you make two picks: your own honest pick, and your call on which side most of today&rsquo;s players picked.
        </p>
        <p style={{ margin: '0 0 8px', fontSize: 13, lineHeight: 1.65, color: FADED, fontWeight: 600 }}>
          Your call scores the real split: call the side that went 72 to 28 and you earn 72, call the 28 side and you earn 28. Ten pairs make a score out of 100, and you earn a surprise bonus whenever your own pick turns out more popular than the room predicted. There is no answer key, only the crowd, and every new player re-scores the field until midnight.
        </p>
        <p style={{ margin: 0, fontSize: 13, lineHeight: 1.65, color: FADED, fontWeight: 600 }}>
          New pairs every day at midnight Eastern. No app, no signup. More crowd games: <a href="/herd" style={{ color: INK, fontWeight: 800 }}>Herd</a>, <a href="/outwit" style={{ color: INK, fontWeight: 800 }}>Outwit</a>, <a href="/outrank" style={{ color: INK, fontWeight: 800 }}>Outrank</a> and <a href="/feud" style={{ color: INK, fontWeight: 800 }}>Feud</a>, or play the crowd run <a href="/room" style={{ color: INK, fontWeight: 800 }}>Read the Room</a>.
        </p>
      </section>

      {!STAGE && <div style={{ display: focusMode ? 'none' : 'block', position: 'relative', zIndex: 2 }}><Footer /></div>}
    </div>
  );
}
