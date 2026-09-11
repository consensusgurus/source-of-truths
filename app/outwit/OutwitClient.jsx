'use client';

// Outwit — the daily crowd puzzle. Your opponent is everyone else playing today.
//
// Five quick prompts against the whole field: undercut the average, dodge the
// popular pick, read the herd, find the meeting point, be the rare bird. There
// are no right answers — only what the crowd does. Answer all five, then face
// the field: the server scores you against the whole pool as it stands right
// now, and keeps re-scoring. Nothing is final — every time a new player locks
// in, the field changes and your score and rank move with it, so a run that
// looks last against a tiny early crowd can climb to first once the field fills
// in. The pre-written "house crowd" seeds the pool until ten real players have
// picked, then retires for everyone. The reveal shows the actual distributions
// — where the crowd really landed — and the client re-asks the server on a
// timer so the result stays live while you watch.
//
// Same daily plumbing as Circa/Stet: banked days gated by Eastern date on the
// server (app/outwit/page.js — which also strips the house answers before
// anything reaches the browser), per-puzzle localStorage saves, /outwit?p=N
// archive pinning, streaks + stats, and the shared /api/quiz/* board flow.

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useSearchParams } from 'next/navigation';
import { HelpCircle, X, Smartphone, Users, Crown } from 'lucide-react';
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
  accent: '#1f2937',       // Outwit identity — graphite, with the site gold
  accentSoft: T.surfaceAlt,
  gold: T.gold,
  green: T.successDeep,
  greenSoft: '#eefaf1',
};
const SANS = "'Manrope', system-ui, -apple-system, sans-serif";
const MONO = "'DM Mono', ui-monospace, 'SFMono-Regular', monospace";
const HELP_KEY = 'sot_outwit_help_seen';
const STATS_KEY = 'sot_outwit_stats';

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
// from the /api/outwit response (result.board), which recomputes every
// registered player's total against the current field on every request.
function OutwitLiveBoard({ board }) {
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
        Nothing here is final. Every new player re-scores the whole board &mdash; your place climbs or slips as the crowd fills in.
        {board.houseActive ? ' The house crowd is still seeding until ten players lock in.' : ''}
      </div>
      {top.length === 0 ? (
        <div style={{ fontFamily: SANS, fontSize: 12.5, fontWeight: 700, color: `var(--stg-mute, ${COLORS.faded})`, padding: '6px 0' }}>No one has joined the board yet &mdash; be the first name on it.</div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
          {top.map((r, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '5px 8px', borderRadius: 6, background: r.you ? 'rgba(232,180,58,0.16)' : (i % 2 ? `var(--stg-surf, ${COLORS.cream})` : 'transparent'), border: r.you ? `1px solid ${COLORS.gold}` : '1px solid transparent' }}>
              <span style={{ flex: '0 0 26px', fontFamily: MONO, fontSize: 12, fontWeight: 500, color: r.rank <= 3 ? `var(--stg-ink, ${COLORS.ink})` : `var(--stg-mute, ${COLORS.faded})`, textAlign: 'right' }}>{r.rank}</span>
              <span style={{ flex: '1 1 auto', fontFamily: SANS, fontSize: 13, fontWeight: r.you ? 800 : 600, color: r.you ? '#8a6d1a' : `var(--stg-ink, ${COLORS.ink})`, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{r.name}{r.you ? ' \u00b7 you' : ''}</span>
              <span style={{ flex: '0 0 auto', fontFamily: MONO, fontSize: 12.5, fontWeight: 500, color: `var(--stg-ink, ${COLORS.ink})`, fontVariantNumeric: 'tabular-nums' }}>{r.total}<span style={{ color: `var(--stg-mute, ${COLORS.faded})`, fontSize: 10.5 }}>/10</span></span>
            </div>
          ))}
        </div>
      )}
      {board.youRegistered && !youShown && board.you ? (
        <div style={{ marginTop: 8, paddingTop: 8, borderTop: '1px solid rgba(28,30,36,0.1)', display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ flex: '0 0 26px', fontFamily: MONO, fontSize: 12, fontWeight: 700, color: '#8a6d1a', textAlign: 'right' }}>{board.you.rank}</span>
          <span style={{ flex: '1 1 auto', fontFamily: SANS, fontSize: 13, fontWeight: 800, color: '#8a6d1a' }}>You</span>
          <span style={{ flex: '0 0 auto', fontFamily: MONO, fontSize: 12.5, fontWeight: 500, color: `var(--stg-ink, ${COLORS.ink})` }}>{board.you.total}<span style={{ color: `var(--stg-mute, ${COLORS.faded})`, fontSize: 10.5 }}>/10</span></span>
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
  const rec = { ...s.rec, [num]: { s: sc, t: 10, g: prev.g != null ? prev.g : 0, won: sc >= 7 } };
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
    const sc = Math.max(0, Math.min(10, Math.round(((m.scorePct || 0) / 100) * 10)));
    if (!changed) { rec = { ...rec }; changed = true; }
    rec[p.num] = { s: sc, t: 10, g: null, won: sc >= 7 };
  }
  if (!changed) return s;
  const s2 = { ...s, rec };
  try { localStorage.setItem(STATS_KEY, JSON.stringify(s2)); } catch (e) {}
  return s2;
}

function freshState() {
  return {
    v: 1,
    ans: {},                    // promptIdx -> value (number; option index for choices)
    status: 'playing',          // playing | done
    result: null,               // /api/outwit response
    t0: null,
    tEnd: null,
  };
}

export default function OutwitClient({ puzzles = [], forceNum = null }) {
  const PUZZLE = useMemo(() => pickPuzzle(puzzles, forceNum), [puzzles, forceNum]);
  const PROMPTS = PUZZLE.prompts;
  const TOTAL = PROMPTS.length * 2;
  const STORE_KEY = `sot_outwit_${PUZZLE.num}`;

  const [g, setG] = useState(freshState);
  const [numVals, setNumVals] = useState({}); // promptIdx -> raw input string
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
  const LOFT = isLoft('outwit');
  const STAGE = isStage('outwit', searchParams);
  const STAGE_C = STAGE ? 'var(--stg-acc)' : gameColor('outwit');
  const Cap = STAGE ? StageChrome : LoftCap;
  const STAGE_ACC = { '--stg-acc-dk': gameColor('outwit'), '--stg-acc-lt': gameColorLight('outwit'), '--stg-onramp-lt': gameOnrampLight('outwit'), '--stg-acc-ink-lt': gameAccentInkLight('outwit') };
  const [stageTheme] = useStageTheme();
  const INK = STAGE ? 'var(--stg-ink,#e9edf4)' : COLORS.ink;
  const FADED = STAGE ? 'var(--stg-mute,#8b95a8)' : COLORS.faded;
  const SURF = STAGE ? 'var(--stg-surf,rgba(255,255,255,0.045))' : T.white;
  const SURF_B = STAGE ? 'var(--stg-line,rgba(255,255,255,0.11))' : 'rgba(28,30,36,0.42)';
  const ACC = STAGE ? STAGE_C : COLORS.accent;
  const ACC_DEEP = STAGE ? STAGE_C : COLORS.accentDeep;
  const ACC_SOFT = STAGE ? 'var(--stg-line,rgba(255,255,255,0.11))' : COLORS.accentSoft;
  const ON_ACC = STAGE ? 'var(--stg-onramp, #08222e)' : 'var(--white)';
  const preStart = playing && !g.t0;
  const started = playing && !!g.t0;
  const focusMode = playing && !showChrome;
  const answered = Object.keys(g.ans).length;
  const result = g.result;
  const score = result ? result.points : 0;
  const sharp = g.status === 'done' && score >= 7; // "outwitted the crowd" day

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
          setG({ ...freshState(), ...saved });
          const nv = {};
          for (const [k, v] of Object.entries(saved.ans)) {
            if (!PROMPTS[k] || PROMPTS[k].options) continue;
            nv[k] = String(v);
          }
          setNumVals(nv);
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
        (function(){ var _dn = g.status !== 'playing'; if (_dn || g.t0) localStorage.setItem('sot_outwit_day', JSON.stringify({ d: etToday(), done: _dn })); else localStorage.removeItem('sot_outwit_day'); })();
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
      const r = await fetch('/api/outwit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ quizId: PUZZLE.quizId, answers, anonId: getAnonId(), email: identity?.email || undefined }),
      });
      const d = await r.json();
      if (d && !d.error && Array.isArray(d.prompts)) {
        setG((cur) => (cur.status === 'done' ? { ...cur, result: d } : cur));
        try { setStats(recordLiveStat(PUZZLE.num, d.points)); } catch (e) {}
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
  const iq = useIqStanding({ game: 'outwit', quizId: PUZZLE.quizId, active: LOFT && !playing });
  const nextUp = useNextUnplayed({ self: 'outwit', active: LOFT && !playing });
  const upNext = useUnplayedSimilar({ self: 'outwit', active: LOFT && !playing });
  const dailyBoard = useDailyBoard({ quizId: PUZZLE.quizId, active: LOFT && !playing });
  const allTime = useGameAllTime({ game: 'outwit', active: LOFT && !playing });
  const dayStats = useDayStats();
  const catRank = useCategoryRank({ self: 'outwit', active: LOFT && !playing });
  const prevPuzzle = puzzles.find((x) => x.num === PUZZLE.num - 1) || null;
  const myStats = deriveStats(stats, pickPuzzle(puzzles, null).num);

  const REC_KEY = `sot_outwit_rec_${PUZZLE.num}`;
  const abandon = useAbandonFlush(() => {
    const acted = Object.keys(g.ans).length > 0;
    if (!acted || g.status !== 'playing') return null;
    try { if (localStorage.getItem(REC_KEY)) return null; } catch (e) {}
    const el = Math.min(36000, Math.max(1, Math.round((Date.now() - (g.t0 || Date.now())) / 1000)));
    try { localStorage.setItem(REC_KEY, '1'); } catch (e) {}
    return { quizId: PUZZLE.quizId, score: 0, total: TOTAL, correct: 0, guessesUsed: 0, timeElapsed: el, abandoned: true, email: identity?.email || undefined, anonId: getAnonId(), isMobile: isMobileDevice(), referrer: (typeof document !== 'undefined' ? document.referrer : '') };
  });

  function postResult(g2, sc) {
    abandon.markFlushed();
    const el = g2.t0 ? Math.max(1, Math.round(((g2.tEnd || Date.now()) - g2.t0) / 1000)) : 1;
    try { setStats(recordStat(PUZZLE.num, { s: sc, t: TOTAL, g: 0, won: sc >= 7 })); } catch (e) {}
    try {
      fetch('/api/quiz/result', {
        method: 'POST',
        keepalive: true,
        headers: { 'Content-Type': 'application/json' },
        // guessesUsed = 0 for everyone (there are no wrong answers to count), so
        // the daily board's tiebreak falls through to fastest time.
        body: JSON.stringify({ quizId: PUZZLE.quizId, score: sc, total: TOTAL, correct: sc >= 7 ? 1 : 0, guessesUsed: 0, timeElapsed: el, email: identity?.email || undefined, anonId: getAnonId(), isMobile: isMobileDevice(), referrer: (typeof document !== 'undefined' ? document.referrer : '') }),
      })
        .then((r) => r.json())
        .then((d) => { if (d && !d.error) setBoard({ ...EMPTY_BOARD, ...d }); })
        .catch(() => {});
    } catch (e) {}
  }

  function setAnswer(i, v) {
    if (!playing) return;
    setG((cur) => {
      const g2 = { ...cur, ans: { ...cur.ans, [i]: v } };
      if (!g2.t0) g2.t0 = Date.now();
      return g2;
    });
  }
  function setNumRaw(i, raw) {
    const cleaned = raw.replace(/[^0-9]/g, '').slice(0, 9);
    setNumVals((cur) => ({ ...cur, [i]: cleaned }));
    if (cleaned === '') {
      setG((cur) => { const a = { ...cur.ans }; delete a[i]; return { ...cur, ans: a }; });
      return;
    }
    const v = parseInt(cleaned, 10);
    const pr = PROMPTS[i];
    if (Number.isInteger(v) && v >= pr.min && v <= pr.max) setAnswer(i, v);
    else setG((cur) => { const a = { ...cur.ans }; delete a[i]; return { ...cur, ans: a }; });
  }

  async function faceTheCrowd() {
    if (!playing || sending) return;
    if (answered < PROMPTS.length) { say(`Answer all ${PROMPTS.length} first — ${PROMPTS.length - answered} to go.`); return; }
    setSending(true);
    try {
      const answers = PROMPTS.map((_, i) => g.ans[i]);
      const r = await fetch('/api/outwit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ quizId: PUZZLE.quizId, answers, anonId: getAnonId(), email: identity?.email || undefined }),
      });
      const d = await r.json();
      if (!d || d.error || !Array.isArray(d.prompts)) {
        say('Couldn’t reach the crowd — try again in a moment.');
        setSending(false);
        return;
      }
      const g2 = { ...g, status: 'done', result: d, tEnd: Date.now() };
      if (!g2.t0) g2.t0 = Date.now();
      postResult(g2, d.points);
      setG(g2);
    } catch (e) {
      say('Couldn’t reach the crowd — try again in a moment.');
    }
    setSending(false);
  }

  function startGame() {
    setG((cur) => (cur.t0 ? cur : { ...cur, t0: Date.now() }));
    try { localStorage.setItem(HELP_KEY, '1'); } catch (e) {}
  }

  function resetGame() {
    try { localStorage.removeItem(STORE_KEY); } catch (e) {}
    setG(freshState()); setNumVals({}); setEndClosed(false);
  }

  function shareText() {
    const squares = (result ? result.prompts : []).map((p) => (p.pts === 2 ? '\u{1F7E9}' : p.pts === 1 ? '\u{1F7E8}' : '⬜')).join('');
    const streakBit = isTodays && myStats.cur >= 2 ? ` · streak ${myStats.cur}` : '';
    const crowdBit = result ? ` · crowd of ${fmtBig(result.poolSize)}` : '';
    return `Outwit #${PUZZLE.num} · ${score}/${TOTAL}${crowdBit}${streakBit}\n${squares}\n${shareUrl()}`;
  }
  function shareUrl() {
    return withRef(`mindloftdaily.com/outwit${isTodays ? '' : `?p=${PUZZLE.num}`}`);
  }
  function copyShare() {
    const text = playing
      ? `Outwit #${PUZZLE.num} — the daily crowd puzzle from Mind Loft.\n${shareUrl()}`
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

  const ptsChip = (pts) => (
    <span style={{ marginLeft: 'auto', flex: '0 0 auto', fontFamily: SANS, fontSize: 12, fontWeight: 800, borderRadius: 6, padding: '3px 9px', color: pts === 2 ? T.white : pts === 1 ? '#7c5a08' : COLORS.faded, background: pts === 2 ? COLORS.green : pts === 1 ? '#fdf0cd' : `var(--stg-surf, ${COLORS.paper})` }}>
      +{pts}
    </span>
  );

  // Options tied at the rarest ACTUALLY-PICKED count. A 0-vote option is nobody's
  // pick, so it is never "rarest"; when several options tie at the lowest count,
  // all of them are flagged, not just one.
  const rarestSet = (counts) => {
    const nz = counts.filter((c) => c > 0);
    if (!nz.length) return new Set();
    const min = Math.min(...nz);
    const out = new Set();
    counts.forEach((c, i) => { if (c > 0 && c === min) out.add(i); });
    return out;
  };
  // Options tied at the most-picked count (Meeting Point / crowd).
  const commonSet = (counts) => {
    const max = Math.max(0, ...counts);
    if (max <= 0) return new Set();
    const out = new Set();
    counts.forEach((c, i) => { if (c === max) out.add(i); });
    return out;
  };

  // ---- reveal blocks ----
  function revealChoice(rp) {
    const maxC = Math.max(1, ...rp.counts);
    const totC = rp.counts.reduce((a, b) => a + b, 0) || 1;
    // "fewest" flags every option tied at the lowest NON-ZERO count (a 0-vote
    // option is nobody's pick, so it never wins); "crowd" flags the most-picked.
    const winSet = rp.type === 'least' ? rarestSet(rp.counts) : commonSet(rp.counts);
    return (
      <div style={{ marginTop: 10, display: 'flex', flexDirection: 'column', gap: 5 }}>
        {rp.options.map((opt, oi) => {
          const you = rp.yourAnswer === oi;
          const win = winSet.has(oi);
          return (
            <div key={oi} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ flex: '0 0 108px', fontFamily: SANS, fontSize: 12, fontWeight: you ? 800 : 600, color: you ? `var(--stg-ink, ${COLORS.ink})` : `var(--stg-mute, ${COLORS.faded})`, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', textAlign: 'right' }}>{opt}</span>
              <div style={{ flex: '1 1 auto', height: 16, background: STAGE ? 'var(--stg-surf2)' : COLORS.paper, borderRadius: 5, overflow: 'hidden', position: 'relative' }}>
                <div style={{ width: `${Math.round((rp.counts[oi] / maxC) * 100)}%`, height: '100%', background: you ? COLORS.gold : win ? '#94a3b8' : '#c8cfd9', borderRadius: 5, minWidth: rp.counts[oi] ? 4 : 0 }} />
              </div>
              <span style={{ flex: '0 0 74px', fontFamily: MONO, fontSize: 10.5, color: FADED, whiteSpace: 'nowrap' }}>
                {Math.round((rp.counts[oi] / totC) * 100)}%{you ? ' · you' : win ? (rp.type === 'least' ? ' · fewest' : ' · crowd') : ''}
              </span>
            </div>
          );
        })}
      </div>
    );
  }
  function revealNumeric(rp) {
    const maxC = Math.max(1, ...rp.buckets.map((b) => b.count));
    return (
      <div style={{ marginTop: 10 }}>
        <div style={{ display: 'flex', alignItems: 'flex-end', gap: 3, height: 58 }}>
          {rp.buckets.map((b, bi) => (
            <div key={bi} style={{ flex: '1 1 0', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2, height: '100%', justifyContent: 'flex-end' }}>
              <div style={{ width: '100%', height: `${Math.max(3, Math.round((b.count / maxC) * 100))}%`, background: b.you ? COLORS.gold : '#c8cfd9', borderRadius: '4px 4px 0 0', position: 'relative' }}>
                {b.target && <div style={{ position: 'absolute', top: -7, left: '50%', transform: 'translateX(-50%)', width: 0, height: 0, borderLeft: '5px solid transparent', borderRight: '5px solid transparent', borderTop: `6px solid ${COLORS.rust}` }} />}
              </div>
            </div>
          ))}
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontFamily: MONO, fontSize: 9, color: FADED, marginTop: 3 }}>
          <span>{rp.buckets[0].label.split('–')[0]}</span>
          <span style={{ color: `var(--stg-ink, ${COLORS.rust})` }}>▾ target {fmtBig(rp.target)}</span>
          <span>{rp.buckets[rp.buckets.length - 1].label.split('–')[1]}</span>
        </div>
        <div style={{ fontFamily: SANS, fontSize: 12, fontWeight: 700, color: FADED, marginTop: 7, lineHeight: 1.5 }}>
          You said <b style={{ color: INK }}>{fmtBig(rp.yourAnswer)}</b> — closer than <b style={{ color: INK }}>{rp.beatPct}%</b> of the crowd.
          {rp.truth != null && (
            <> True answer: <b style={{ color: INK }}>{fmtBig(rp.truth)}</b> (crowd median {fmtBig(rp.median)}).{rp.truthNote ? ` ${rp.truthNote}` : ''}</>
          )}
        </div>
      </div>
    );
  }
  function revealUnique(rp) {
    // Themed "rarest wins" reveal — same horizontal-bar layout as revealChoice,
    // labelled for rarity. (Legacy numeric bars fall through below.)
    if (rp.options) {
      const maxC = Math.max(1, ...rp.counts);
      const totC = rp.counts.reduce((a, b) => a + b, 0) || 1;
      // Flag every option tied at the rarest NON-ZERO count (never a 0-vote one).
      const winSet = rarestSet(rp.counts);
      return (
        <div style={{ marginTop: 10, display: 'flex', flexDirection: 'column', gap: 5 }}>
          {rp.options.map((opt, oi) => {
            const you = rp.yourAnswer === oi;
            const win = winSet.has(oi);
            return (
              <div key={oi} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ flex: '0 0 108px', fontFamily: SANS, fontSize: 12, fontWeight: you ? 800 : 600, color: you ? `var(--stg-ink, ${COLORS.ink})` : `var(--stg-mute, ${COLORS.faded})`, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', textAlign: 'right' }}>{opt}</span>
                <div style={{ flex: '1 1 auto', height: 16, background: STAGE ? 'var(--stg-surf2)' : COLORS.paper, borderRadius: 5, overflow: 'hidden', position: 'relative' }}>
                  <div style={{ width: `${Math.round((rp.counts[oi] / maxC) * 100)}%`, height: '100%', background: you ? COLORS.gold : win ? COLORS.green : '#c8cfd9', borderRadius: 5, minWidth: rp.counts[oi] ? 4 : 0 }} />
                </div>
                <span style={{ flex: '0 0 74px', fontFamily: MONO, fontSize: 10.5, color: FADED, whiteSpace: 'nowrap' }}>
                  {Math.round((rp.counts[oi] / totC) * 100)}%{you ? ' · you' : win ? ' · rarest' : ''}
                </span>
              </div>
            );
          })}
          <div style={{ fontFamily: SANS, fontSize: 12, fontWeight: 700, color: FADED, marginTop: 6 }}>
            Rarest pick: <b style={{ color: COLORS.green }}>{[...winSet].map((i) => rp.options[i]).join(' / ') || rp.options[rp.winner]}</b> · you took <b style={{ color: INK }}>{rp.options[rp.yourAnswer]}</b>.
          </div>
        </div>
      );
    }
    const maxC = Math.max(1, ...rp.counts);
    const winSet = rarestSet(rp.counts);
    return (
      <div style={{ marginTop: 10 }}>
        <div style={{ display: 'flex', alignItems: 'flex-end', gap: 2, height: 52 }}>
          {rp.counts.map((c, ci) => {
            const n = ci + rp.min;
            const you = rp.yourAnswer === n;
            const win = winSet.has(ci);
            return (
              <div key={ci} style={{ flex: '1 1 0', height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', alignItems: 'center' }}>
                <div title={`${n}: ${c}`} style={{ width: '100%', height: `${Math.max(4, Math.round((c / maxC) * 100))}%`, background: you ? COLORS.gold : win ? COLORS.green : '#c8cfd9', borderRadius: '3px 3px 0 0' }} />
              </div>
            );
          })}
        </div>
        <div style={{ display: 'flex', gap: 2, marginTop: 2 }}>
          {rp.counts.map((c, ci) => {
            const n = ci + rp.min;
            const you = rp.yourAnswer === n;
            const win = winSet.has(ci);
            return <span key={ci} style={{ flex: '1 1 0', textAlign: 'center', fontFamily: MONO, fontSize: 8.5, fontWeight: you || win ? 700 : 500, color: you ? '#8a6d1a' : win ? COLORS.green : `var(--stg-mute, ${COLORS.faded})` }}>{n}</span>;
          })}
        </div>
        <div style={{ fontFamily: SANS, fontSize: 12, fontWeight: 700, color: FADED, marginTop: 6 }}>
          Rarest pick: <b style={{ color: COLORS.green }}>{[...winSet].map((i) => i + rp.min).join(' / ') || rp.winner}</b> · you took <b style={{ color: INK }}>{rp.yourAnswer}</b>.
        </div>
      </div>
    );
  }

  function renderPrompt(i) {
    const pr = PROMPTS[i];
    const rp = result ? result.prompts[i] : null;
    const val = g.ans[i];
    return (
      <div key={i} style={{ background: STAGE ? SURF : T.white, border: `1.5px solid ${rp ? (rp.pts === 2 ? 'rgba(21,128,61,0.5)' : rp.pts === 1 ? 'rgba(202,138,4,0.5)' : 'rgba(28,30,36,0.18)') : 'rgba(28,30,36,0.2)'}`, borderRadius: 10, padding: '12px 14px', marginBottom: 9 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 7 }}>
          <span style={{ fontFamily: MONO, fontSize: 10, letterSpacing: '0.1em', textTransform: 'uppercase', fontWeight: 500, color: `var(--stg-onramp, ${T.white})`, background: `var(--stg-acc, ${COLORS.accent})`, borderRadius: 4, padding: '2px 7px' }}>{i + 1} · {pr.tag}</span>
          {rp ? ptsChip(rp.pts) : (val != null ? <span style={{ marginLeft: 'auto', color: `var(--stg-ink, ${COLORS.green})`, display: 'flex' }}><Crown size={14} style={{ display: 'none' }} /><svg viewBox="0 0 12 12" width="14" height="14" fill="none"><path d="M2.5 6.2 L5 8.6 L9.5 3.6" stroke={T.successDeep} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg></span> : null)}
        </div>
        <div style={{ fontFamily: SANS, fontSize: 15, fontWeight: 800, letterSpacing: '-0.01em', color: INK, lineHeight: 1.4, marginBottom: 9 }}>
          {pr.q}
        </div>
        {!rp && pr.options && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7 }}>
            {pr.options.map((opt, oi) => (
              <button key={oi} onClick={() => setAnswer(i, oi)} className={`ow-opt${val === oi ? ' ow-opt-on' : ''}`}>{opt}</button>
            ))}
          </div>
        )}
        {!rp && !pr.options && (
          <input
            className="ow-inp"
            type="text"
            inputMode="numeric"
            pattern="[0-9]*"
            placeholder={`${fmtBig(pr.min)}–${fmtBig(pr.max)}`}
            value={numVals[i] ?? ''}
            onChange={(e) => setNumRaw(i, e.target.value)}
            aria-label={pr.q}
          />
        )}
        {rp && (rp.type === 'unique' ? revealUnique(rp) : rp.options ? revealChoice(rp) : rp.buckets ? revealNumeric(rp) : revealUnique(rp))}
      </div>
    );
  }

  // Shared rules body — rendered in both the how-to-play modal and the start gate.
  const rulesBody = (
    <DailyRules
      accent={COLORS.accent} accentSoft={COLORS.accentSoft}
      lead="Your opponent is everyone playing today."
      banner="Five prompts, no right answers. You score by reading the crowd."
      steps={[
        <><b>Road Less Traveled</b>: pick what fewest pick. <b>Herd</b>: closest to the crowd&rsquo;s median.</>,
        <><b>Meeting Point</b>: match the most-picked answer. <b>Rare Bird</b>: the rarest pick wins.</>,
        <><b>Undercut</b> comes last: closest to a fraction of the crowd&rsquo;s average, and the fraction changes every day, so read the prompt.</>,
        <><b>Lock in</b> to reveal where the crowd actually went.</>,
      ]}
      knack="Play the answer you think the average player types, not the one you like. Your own taste is the trap."
      note={<><b>Nothing is final.</b> Every new player re-scores the whole field, including you, so your rank moves all day.</>}
      footer="Each prompt pays 0, 1, or 2 points. 7 of 10 means you outwitted them, for now."
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
      <DailyChrome slug="outwit" name="Outwit" collapsed={started} loft={LOFT} />
      )}
      {LOFT && (
        <Cap gameKey="outwit" quizId={PUZZLE.quizId}
          name="Outwit"
          cat="Crowd Psychology"
          outcome={playing ? null : (score > 0 ? 'won' : 'lost')}
          num={PUZZLE.num}
          tiles={playing ? null : upNext}
          dateLabel={PUZZLE.dateLabel}
          onHelp={() => setShowHelp(true)}
          sunday={PUZZLE.sunday ? 'Sunday Edition' : null}
          figures={playing ? [
            { v: `${score}/${TOTAL}`, k: 'score' },
            { v: elapsed, k: 'time' },
          ] : [
            { v: `${score}/${TOTAL}`, k: 'score' },
            { v: elapsed, k: 'time' },
          ]}
        />
      )}
      <div className="ow-wrap" style={{ position: 'relative', zIndex: 2, maxWidth: 1180, margin: '0 auto', padding: '18px 38px 80px', fontFamily: SANS }}>
        <style>{`
          @media(max-width:560px){.ow-wrap{padding-left:12px !important;padding-right:12px !important;}}
          .ow-btn{font-family:${SANS};font-weight:800;font-size:14px;border:2px solid ${STAGE ? 'var(--stg-line2)' : 'var(--blue-deep)'};background:${STAGE ? 'transparent' : 'var(--white)'};color:${STAGE ? 'var(--stg-ink)' : 'var(--blue-deep)'};border-radius:8px;padding:9px 16px;cursor:pointer;display:inline-flex;align-items:center;gap:7px;}
          .ow-btn:hover{background:var(--stg-surf2, var(--accent-soft));}
          .ow-opt{font-family:${SANS};font-weight:800;font-size:13.5px;border: 2px solid var(--stg-line, rgba(28,30,36,0.3));background:${STAGE ? 'var(--stg-surf)' : 'var(--white)'};color:${INK};border-radius:9px;padding:9px 14px;cursor:pointer;}
          .ow-opt:hover{border-color:var(--stg-acc, ${COLORS.accent});}
          .ow-opt-on{background:var(--stg-acc, ${COLORS.accent});border-color:var(--stg-acc, ${COLORS.accent});color:var(--stg-onramp, var(--white));box-shadow:0 0 0 3px rgba(232,180,58,0.45);}
          .ow-inp{font-family:${MONO};font-weight:500;font-size:22px;letter-spacing:0.06em;width:200px;max-width:100%;border:2px solid ${COLORS.ink};border-radius:9px;padding:8px 12px;background:${STAGE ? 'var(--stg-surf)' : 'var(--white)'};color:${INK};outline:none;}
          .ow-inp:focus{border-color:var(--stg-acc, ${COLORS.accent});box-shadow:0 0 0 3px color-mix(in srgb, var(--stg-acc, ${COLORS.accent}) 14%, transparent);}
          .ow-face{font-family:${SANS};font-weight:800;font-size:15px;letter-spacing:0.05em;text-transform:uppercase;border:none;background:var(--stg-acc, ${COLORS.accent});color:var(--stg-onramp, var(--white));border-radius:10px;padding:0 26px;height:56px;cursor:pointer;display:inline-flex;align-items:center;gap:10px;box-shadow:0 3px 0 rgba(20,22,28,0.25);}
          .ow-face:active{transform:translateY(1px);box-shadow:0 2px 0 rgba(20,22,28,0.25);}
          .ow-face:disabled{opacity:.55;cursor:default;}
          .ow-face .ow-gold{color:${COLORS.gold};}
          @media(max-width:560px){.ow-ttl{flex-direction:column;align-items:flex-start;gap:1px;}.ow-ttl h1{font-size:21px;letter-spacing:0.02em;}.ow-ttl .ow-ttl-dt{font-size:15px;}.ow-ttl-dot{display:none;}}
        `}</style>

        <div style={{ maxWidth: 640, margin: '0 auto' }}>


        {/* masthead: pressed OUTWIT tiles with No./date inline */}
        {!LOFT && (
        <DailyMasthead
          slug="outwit"
          num={PUZZLE.num}
          dateLabel={PUZZLE.dateLabel}
          accent={COLORS.accent}
          blockGap={4}
          helpTop={13}
          marginBottom={16}
          onHelp={() => setShowHelp(true)}
          sunday={PUZZLE.sunday && <span style={{ fontFamily: MONO, fontSize: 9.5, letterSpacing: '0.1em', textTransform: 'uppercase', fontWeight: 500, color: `var(--stg-onramp, ${T.white})`, background: `var(--stg-acc, ${COLORS.accent})`, borderRadius: 4, padding: '2px 6px' }}>Sunday Edition &middot; Six prompts</span>}
          blocks={'OUTWIT'.split('').map((ch, i) => (
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
            <div style={{ fontSize: 20, fontWeight: 800, color: INK, marginBottom: 10 }}>{gateRules ? 'How to play' : 'Outwit is ready'}</div>
            {gateRules ? rulesBody : (
              <div style={{ fontSize: 14, lineHeight: 1.55, color: INK, fontWeight: 600 }}>
                <p style={{ margin: '0 0 6px' }}>Five prompts, no right answers. You score by reading today&rsquo;s crowd.</p>
              </div>
            )}
            <div style={{ marginTop: 18, display: 'flex', flexDirection: 'row-reverse', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
              <button className="ow-btn" onClick={startGame} style={{ borderColor: STAGE ? STAGE_C : undefined, background: STAGE ? STAGE_C : T.cta, color: STAGE ? 'var(--stg-onramp, #08222e)' : T.white, fontSize: 15, padding: '11px 22px' }}>Start</button>
              <div>
                <button type="button" onClick={() => setGateRules((v) => !v)} style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', fontFamily: SANS, fontSize: 13, fontWeight: 700, color: FADED, textDecoration: 'underline' }}>
                  {gateRules ? 'Hide detailed instructions' : 'Show detailed instructions'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* the five prompts */}
        {!preStart && (
        <div className={STAGE ? 'stg-board' : undefined} style={{ background: `var(--stg-surf, ${COLORS.accentSoft})`, border: `2px solid var(--stg-line, ${COLORS.ink})`, borderRadius: 10, padding: '15px 17px 12px', boxShadow: '5px 5px 0 rgba(28,30,36,0.16)', marginBottom: 12 }}>
          <div style={{ display: LOFT ? 'none' : 'flex', alignItems: 'center', gap: 12, fontFamily: MONO, fontSize: 11.5, letterSpacing: '0.1em', textTransform: 'uppercase', color: FADED, borderBottom: '1px solid rgba(28,30,36,0.18)', paddingBottom: 8, marginBottom: 12, flexWrap: 'wrap' }}>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, whiteSpace: 'nowrap' }}><Users size={12} /> five prompts vs. today&rsquo;s crowd</span>
            <span style={{ marginLeft: 'auto', whiteSpace: 'nowrap' }}>answered <b style={{ color: INK, fontWeight: 500 }}>{answered}</b>/{PROMPTS.length}</span>
          </div>
          {PROMPTS.map((_, i) => renderPrompt(i))}
          {started && (
            <div style={{ textAlign: 'center', margin: '14px 0 8px' }}>
              <button className="ow-face" onClick={faceTheCrowd} disabled={sending || answered < PROMPTS.length}>
                <Users size={17} className="ow-gold" /> {sending ? 'Facing the crowd…' : 'Face the crowd'}
              </button>
              <div style={{ fontFamily: SANS, fontSize: 11.5, fontWeight: 700, color: FADED, marginTop: 8 }}>
                No right answers — only what everyone else does. Lock all five, then see the real numbers.
              </div>
            </div>
          )}
        </div>
        )}


          </div>
          <div className={STAGE ? undefined : 'loft-sol'}>
          {/* result */}
          {!playing && result && (
            <>
              <div style={{ maxWidth: 472, margin: '0 auto 12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 14, background: STAGE ? SURF : T.white, border: STAGE ? `1px solid ${SURF_B}` : '1.5px solid rgba(28,30,36,0.18)', borderRadius: 10, padding: '12px 14px' }}>
                  <span style={{ fontFamily: MONO, fontSize: 32, fontWeight: 500, color: sharp ? COLORS.green : `var(--stg-ink, ${COLORS.ink})`, fontVariantNumeric: 'tabular-nums', letterSpacing: '0.04em', flex: '0 0 auto' }}>{score}/{TOTAL}</span>
                  <span style={{ fontFamily: SANS, fontSize: 13, fontWeight: 700, color: INK, lineHeight: 1.45 }}>
                    {sharp ? 'You outwitted the crowd.' : score >= 4 ? 'You held your own against the crowd.' : 'The crowd got you today.'}
                    {' '}<span style={{ color: FADED, fontWeight: 600 }}>{result.board && result.board.youRegistered && result.board.you ? <>Live rank #{result.board.you.rank} of {fmtBig(result.board.registered)} &middot; </> : null}A field of {fmtBig(result.realCount != null ? result.realCount : result.poolSize)} &middot; {elapsed}</span>
                  </span>
                </div>
              </div>
              <OutwitLiveBoard board={result.board} />
              <p className={STAGE ? undefined : 'loft-tailnote'} style={{ fontSize: 12, color: FADED, fontWeight: 600, margin: '12px 0 0' }}>
                {isTodays ? (
                  <>
                    {countdown ? <>Next Outwit in <b style={{ color: INK, fontVariantNumeric: 'tabular-nums' }}>{countdown}</b>.</> : 'A new crowd forms at midnight Eastern.'}
                    {prevPuzzle && (
                      <>
                        {' '}Meanwhile:{' '}
                        <a href={`/outwit?p=${prevPuzzle.num}`} style={{ color: `var(--stg-ink, ${COLORS.ember})`, fontWeight: 800, textDecoration: 'underline' }}>
                          play yesterday&rsquo;s Outwit &rarr;
                        </a>
                      </>
                    )}
                  </>
                ) : (
                  <>
                    You&rsquo;re playing the {PUZZLE.dateLabel.replace(', 2026', '')} archive.{' '}
                    <a href="/outwit" style={{ color: `var(--stg-ink, ${COLORS.ember})`, fontWeight: 800, textDecoration: 'underline' }}>Back to today&rsquo;s Outwit &rarr;</a>
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
              name="Outwit"
              catRank={catRank}
              outcome={score > 0 ? 'won' : 'lost'}
              title={score > 0 ? 'complete' : 'not complete'}
              detail={`${`${score}/${TOTAL}`} \u00b7 ${elapsed}`}
              iq={iq}
              board={dailyBoard}
              gameRank={allTime && allTime.ready
                ? { value: allTime.rank != null ? `#${Number(allTime.rank).toLocaleString()}` : '\u2014',
                    label: allTime.field != null ? `of ${Number(allTime.field).toLocaleString()} Outwit all time` : 'all-time rank' }
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
                  href: `/outwit?p=${p.num}`,
                  done: !!(stats && stats.rec && stats.rec[p.num]),
                  score: (stats && stats.rec && stats.rec[p.num]) ? stats.rec[p.num].s : null,
                }))}
              options={[
                { label: copied ? 'Copied' : (shareCta || 'Share'), sub: 'Your result, no spoilers', kind: 'gold', onClick: copyShare },
                { tone: (score > 0) ? 'board' : 'reveal', label: (score > 0) ? 'Return to board' : 'Reveal answer',
                  sub: (score > 0) ? 'Your finished board' : 'Show what you missed', onClick: () => setRevealed(true) },
              prevPuzzle && { tone: 'another', label: 'Play another Outwit', sub: `No. ${prevPuzzle.num}, yesterday\u2019s puzzle`, href: `/outwit?p=${prevPuzzle.num}` },
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
        {!STAGE && <GamePanel self="outwit" name="Outwit" onShow={() => setShowChrome(true)} />}
        <div style={{ display: (focusMode && !STAGE) ? 'none' : 'block', margin: '30px auto 0' }}>
          {LOFT && (
            <div className={STAGE ? undefined : 'loft-report'}>
              <ReportIssue self="outwit" name="Outwit" accent="#ffffff" align="center" onHelp={() => setShowHelp(true)} />
            </div>
          )}
          {!LOFT && (
          <DailyGamesGrid replay={!playing && result ? resetGame : null}
            self="outwit"
            maxWidth={640}
            challengeHref={`/duel/new?quiz=${encodeURIComponent(PUZZLE.quizId)}`}
            share={{ label: copied ? 'Copied' : 'Share', onClick: copyShare }}
            light
            boardSlot={<DailyBoardPanel self="outwit" quizId={PUZZLE.quizId} maxWidth={640} streak={{ current: myStats.cur, best: myStats.max }} />}
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
              <div style={{ fontSize: 17, fontWeight: 800, color: INK, marginBottom: 8 }}>Add Outwit to your Home Screen</div>
              {isIosDevice() ? (
                <ol style={{ margin: '0 0 4px', paddingLeft: 20, color: INK, fontSize: 14, lineHeight: 1.7 }}>
                  <li>Tap the <b>Share</b> button in Safari&apos;s toolbar.</li>
                  <li>Scroll down and tap <b>Add to Home Screen</b>.</li>
                  <li>Tap <b>Add</b> &mdash; the tile opens today&apos;s crowd, every day.</li>
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

      {/* the end-of-puzzle popup: the shared DailyEndCard as a dismissible modal */}
      {!playing && result && !endClosed && !LOFT && (
        <DailyEndCard
          modal
          self="outwit"
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
            <button className="ow-btn" onClick={() => { setShowHelp(false); try { localStorage.setItem(HELP_KEY, '1'); } catch (e) {} }} style={{ marginTop: 14, background: COLORS.ink, color: T.white }}>Play</button>
          </div>
        </div>
      )}

      {/* The desktop fold: the About prose below starts one screen down (app/StageFold.jsx). */}
      <StageFold />
      {/* About Outwit — crawlable prose for search, server-rendered into the HTML */}
      <section style={{ display: (focusMode && !STAGE) ? 'none' : 'block', position: 'relative', zIndex: 2, maxWidth: 640, margin: '0 auto', padding: '10px 24px 42px', fontFamily: SANS }}>
        <h2 style={{ margin: '0 0 8px', fontSize: 15, fontWeight: 800, letterSpacing: '-0.01em', color: INK }}>About Outwit</h2>
        <p style={{ margin: '0 0 8px', fontSize: 13, lineHeight: 1.65, color: FADED, fontWeight: 600 }}>
          Outwit is a free daily puzzle from Mind Loft where the puzzle is other people. Every day, five quick prompts pit you against the entire field of players: pick the option the fewest will touch, guess where the herd&rsquo;s median lands, meet the crowd at its favorite answer, find the number nobody else takes, and finish by undercutting the crowd&rsquo;s average, by a fraction that shifts from day to day, so the equilibrium is never the same twice.
        </p>
        <p style={{ margin: '0 0 8px', fontSize: 13, lineHeight: 1.65, color: FADED, fontWeight: 600 }}>
          There are no trivia answers to know, the classic game-theory twist is that everyone is reasoning about everyone else. And the score is alive: every time a new player locks in, the entire field is re-scored, so your points and your place on the board keep moving through the day. You are always measured against the whole crowd as it stands right now, a run that trails a small early field can lead once thousands more have played, and a morning sweep can slip as the day goes on. A pre-written house field seeds the small hours, then retires once ten real players are in, so by breakfast you're playing purely against people, and the standings never stop shifting.
        </p>
        <p style={{ margin: 0, fontSize: 13, lineHeight: 1.65, color: FADED, fontWeight: 600 }}>
          A new crowd forms every day at midnight Eastern. No app, no signup, play free in your browser, keep a streak, and race the daily leaderboard. More dailies: <a href="/tally" style={{ color: INK, fontWeight: 800 }}>Tally</a>, our row-and-column logic puzzle, <a href="/suds" style={{ color: INK, fontWeight: 800 }}>Suds</a>, our daily sudoku, and <a href="/outrank" style={{ color: INK, fontWeight: 800 }}>Outrank</a>, our crowd-ranking puzzle.
        </p>
      </section>

      {!STAGE && <div style={{ display: focusMode ? 'none' : 'block', position: 'relative', zIndex: 2 }}><Footer /></div>}
    </div>
  );
}
