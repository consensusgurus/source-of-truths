'use client';

// Outrank — the daily crowd-ranking puzzle. The answer key is everyone else.
//
// One themed slate a day (six items; seven in the Sunday Edition). Two moves:
// first VOTE — tap your personal favorite, which becomes part of the crowd —
// then CALL IT — put the whole slate in the order you think today's crowd
// ranks it by favorite votes. Lock in and face the field: the server grades
// your call against the crowd's real order as it stands right now, and keeps
// re-grading. Nothing is final — every new vote can reshuffle the order, so
// your score and rank move all day (same adaptive contract as Outwit). The
// pre-written house crowd seeds the pool until ten real players are in, then
// retires for everyone. Your prediction is always graded on the crowd MINUS
// your own vote, so your ballot never tips the order you're scored against.
//
// Same daily plumbing as Outwit: banked days gated by Eastern date on the
// server (app/outrank/page.js — which also strips the house votes before
// anything reaches the browser), per-puzzle localStorage saves, /outrank?p=N
// archive pinning, streaks + stats, and the shared /api/quiz/* board flow.

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useSearchParams } from 'next/navigation';
import { HelpCircle, X, Smartphone, Users, Crown, RotateCcw } from 'lucide-react';
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
  accent: '#4338ca',       // Outrank identity — indigo podium
  accentSoft: '#eef0fb',
  gold: T.gold,
  green: T.successDeep,
  greenSoft: '#eefaf1',
};
const SANS = "'Manrope', system-ui, -apple-system, sans-serif";
const MONO = "'DM Mono', ui-monospace, 'SFMono-Regular', monospace";
const HELP_KEY = 'sot_outrank_help_seen';
const STATS_KEY = 'sot_outrank_stats';

// "You outranked the crowd" threshold: ~70% of the day's max (8/12; 10/14 on
// Sundays), matching Outwit's 7/10 bar.
const winBar = (total) => Math.round(total * 0.7);

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

function fmtBig(n) {
  const v = Number(n) || 0;
  return v.toLocaleString('en-US');
}

// Live standings — the board that re-shuffles as votes arrive. Fed straight
// from the /api/outrank response (result.board), which recomputes every
// registered player's total against the current field on every request.
function OutrankLiveBoard({ board, total }) {
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
        Nothing here is final. Every new vote can reshuffle the crowd&rsquo;s order &mdash; your place climbs or slips as the field fills in.
        {board.houseActive ? ' The house crowd is still seeding until ten players lock in.' : ''}
      </div>
      {top.length === 0 ? (
        <div style={{ fontFamily: SANS, fontSize: 12.5, fontWeight: 700, color: `var(--stg-mute, ${COLORS.faded})`, padding: '6px 0' }}>No one has joined the board yet &mdash; be the first name on it.</div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
          {top.map((r, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '5px 8px', borderRadius: 6, background: r.you ? 'rgba(232,180,58,0.16)' : (i % 2 ? `var(--stg-surf, ${COLORS.cream})` : 'transparent'), border: r.you ? `1px solid ${COLORS.gold}` : '1px solid transparent' }}>
              <span style={{ flex: '0 0 26px', fontFamily: MONO, fontSize: 12, fontWeight: 500, color: r.rank <= 3 ? `var(--stg-ink, ${COLORS.ink})` : `var(--stg-mute, ${COLORS.faded})`, textAlign: 'right' }}>{r.rank}</span>
              <span style={{ flex: '1 1 auto', fontFamily: SANS, fontSize: 13, fontWeight: r.you ? 800 : 600, color: r.you ? '#8a6d1a' : `var(--stg-ink, ${COLORS.ink})`, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{r.name}{r.you ? ' · you' : ''}</span>
              <span style={{ flex: '0 0 auto', fontFamily: MONO, fontSize: 12.5, fontWeight: 500, color: `var(--stg-ink, ${COLORS.ink})`, fontVariantNumeric: 'tabular-nums' }}>{r.total}<span style={{ color: `var(--stg-mute, ${COLORS.faded})`, fontSize: 10.5 }}>/{total}</span></span>
            </div>
          ))}
        </div>
      )}
      {board.youRegistered && !youShown && board.you ? (
        <div style={{ marginTop: 8, paddingTop: 8, borderTop: '1px solid rgba(28,30,36,0.1)', display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ flex: '0 0 26px', fontFamily: MONO, fontSize: 12, fontWeight: 700, color: '#8a6d1a', textAlign: 'right' }}>{board.you.rank}</span>
          <span style={{ flex: '1 1 auto', fontFamily: SANS, fontSize: 13, fontWeight: 800, color: '#8a6d1a' }}>You</span>
          <span style={{ flex: '0 0 auto', fontFamily: MONO, fontSize: 12.5, fontWeight: 500, color: `var(--stg-ink, ${COLORS.ink})` }}>{board.you.total}<span style={{ color: `var(--stg-mute, ${COLORS.faded})`, fontSize: 10.5 }}>/{total}</span></span>
        </div>
      ) : null}
      {!board.youRegistered ? (
        <div style={{ marginTop: 8, fontFamily: SANS, fontSize: 11, fontWeight: 700, color: `var(--stg-mute, ${COLORS.faded})` }}>Join the leaderboard below to take your place as the field grows.</div>
      ) : null}
    </div>
  );
}

// ─── Personal stats + streak (localStorage), Outwit pattern ─────────────────
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
function recordLiveStat(num, sc, total) {
  const s = getStats();
  const prev = s.rec[num] || {};
  const rec = { ...s.rec, [num]: { s: sc, t: total, g: prev.g != null ? prev.g : 0, won: sc >= winBar(total) } };
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
    const t = p.items.length * 2;
    const sc = Math.max(0, Math.min(t, Math.round(((m.scorePct || 0) / 100) * t)));
    if (!changed) { rec = { ...rec }; changed = true; }
    rec[p.num] = { s: sc, t, g: null, won: sc >= winBar(t) };
  }
  if (!changed) return s;
  const s2 = { ...s, rec };
  try { localStorage.setItem(STATS_KEY, JSON.stringify(s2)); } catch (e) {}
  return s2;
}

function freshState() {
  return {
    v: 1,
    fav: null,                  // your favorite (item index) — your VOTE
    order: [],                  // your predicted crowd order (item indices, best first)
    status: 'playing',          // playing | done
    result: null,               // /api/outrank response
    t0: null,
    tEnd: null,
  };
}

export default function OutrankClient({ puzzles = [], forceNum = null }) {
  const PUZZLE = useMemo(() => pickPuzzle(puzzles, forceNum), [puzzles, forceNum]);
  const ITEMS = PUZZLE.items;
  const K = ITEMS.length;
  const TOTAL = K * 2;
  const STORE_KEY = `sot_outrank_${PUZZLE.num}`;

  const [g, setG] = useState(freshState);
  const [sending, setSending] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const [gateRules, setGateRules] = useState(false); // start tile: full rules (first-timer) vs compact start card
  const [toast, setToast] = useState(null);
  const [copied, setCopied] = useState(false);
  const [endClosed, setEndClosed] = useState(false);
  // The finished board starts turned OVER, showing what to do next.
  const [revealed, setRevealed] = useState(false);
  const [shareCta, setShareCta] = useState('Share');
  useEffect(() => {
    if (contestIsLive()) setShareCta(`Share for ${CONTEST.prizeLabel}*`);
  }, []);
  const [endCardReady, setEndCardReady] = useState(false);
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
  const LOFT = isLoft('outrank');
  const STAGE = isStage('outrank', searchParams);
  const STAGE_C = STAGE ? 'var(--stg-acc)' : gameColor('outrank');
  const Cap = STAGE ? StageChrome : LoftCap;
  const STAGE_ACC = { '--stg-acc-dk': gameColor('outrank'), '--stg-acc-lt': gameColorLight('outrank'), '--stg-onramp-lt': gameOnrampLight('outrank'), '--stg-acc-ink-lt': gameAccentInkLight('outrank') };
  const [stageTheme] = useStageTheme();
  const INK = STAGE ? 'var(--stg-ink,#e9edf4)' : COLORS.ink;
  const FADED = STAGE ? 'var(--stg-mute,#8b95a8)' : COLORS.faded;
  const SURF = STAGE ? 'var(--stg-surf,rgba(255,255,255,0.045))' : T.white;
  const SURF_B = STAGE ? 'var(--stg-line,rgba(255,255,255,0.11))' : 'rgba(28,30,36,0.42)';
  const ACC = STAGE ? STAGE_C : COLORS.accent;
  // THE ACCENT AS TEXT. On the light register the accent has two values,
  // because three of the ten category steps are pastels chosen to be a FILL
  // carrying dark ink, and a pastel cannot also be ink on paper (gold was
  // 1.68:1 on the light ground, amber 1.47). --stg-acc still paints; this
  // writes. On the dark register the two resolve to the same value.
  const ACC_INK = STAGE ? 'var(--stg-acc-ink)' : COLORS.accent;
  const ACC_DEEP = STAGE ? STAGE_C : COLORS.accentDeep;
  const ACC_SOFT = STAGE ? 'var(--stg-line,rgba(255,255,255,0.11))' : COLORS.accentSoft;
  const ON_ACC = STAGE ? 'var(--stg-onramp, #08222e)' : 'var(--white)';
  const preStart = playing && !g.t0;   // not begun: show the start tile where the board goes
  const started = playing && !!g.t0;    // clock running: show the board
  const focusMode = playing && !showChrome;
  const result = g.result;
  const score = result ? result.points : 0;
  const sharp = g.status === 'done' && score >= winBar(TOTAL); // "outranked the crowd" day
  const placedAll = g.fav != null && g.order.length === K;

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
        if (saved && saved.v === 1 && Array.isArray(saved.order)) {
          setG({ ...freshState(), ...saved });
        }
      }
      // The start tile shows in place of the board until the player begins (t0 set
      // on Start). First-timers see the full rules on the tile; a returning player
      // gets the compact start card with a "Show instructions" toggle.
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
        (function(){ var _dn = g.status !== 'playing'; if (_dn || g.t0) localStorage.setItem('sot_outrank_day', JSON.stringify({ d: etToday(), done: _dn })); else localStorage.removeItem('sot_outrank_day'); })();
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
    // Cross-device hydrate: if THIS ACCOUNT already locked in today (possibly on
    // another device), pull the graded result so we show the finished board
    // instead of the play screen. A local finish on this device always wins.
    try {
      const hyAnon = getAnonId();
      let hyMail = '';
      try { const idj = JSON.parse(localStorage.getItem('sot_quiz_identity') || 'null'); if (idj && idj.email) hyMail = idj.email; } catch (e) {}
      const hyQs = `quizId=${encodeURIComponent(PUZZLE.quizId)}&anonId=${encodeURIComponent(hyAnon || '')}${hyMail ? `&email=${encodeURIComponent(hyMail)}` : ''}`;
      fetch(`/api/outrank?${hyQs}`)
        .then((r) => r.json())
        .then((d) => {
          if (!d || !d.played || !Array.isArray(d.answers) || d.answers.length < 2) return;
          const ans = d.answers.map(Number);
          setG((cur) => (cur.status === 'done' ? cur : { ...cur, status: 'done', fav: ans[0], order: ans.slice(1), result: d, tEnd: cur.tEnd || Date.now() }));
          try { setStats(recordLiveStat(PUZZLE.num, d.points, TOTAL)); } catch (e) {}
        })
        .catch(() => {});
    } catch (e) {}
    if (!viewedRef.current) {
      viewedRef.current = true;
      fetch('/api/quiz/view', { method: 'POST', keepalive: true, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ quizId: PUZZLE.quizId }) }).catch(() => {});
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ADAPTIVE: a finished run is never frozen. While the result is on screen we
  // re-ask the server for the current score + live standings, so as new votes
  // land the order and the board move under you. This path never inserts (the
  // browser already has its row) — it only re-scores against the live field.
  async function refreshLive() {
    if (g.status !== 'done') return;
    try {
      if (g.fav == null || g.order.length !== K) return;
      const answers = [g.fav, ...g.order];
      const r = await fetch('/api/outrank', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ quizId: PUZZLE.quizId, answers, anonId: getAnonId(), email: identity?.email || undefined }),
      });
      const d = await r.json();
      if (d && !d.error && Array.isArray(d.reveal)) {
        setG((cur) => (cur.status === 'done' ? { ...cur, result: d } : cur));
        try { setStats(recordLiveStat(PUZZLE.num, d.points, TOTAL)); } catch (e) {}
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

  // Hold the end-of-puzzle popup back a few seconds after the crowd is faced, so the
  // player sees the reveal + live standings first and the fetched crowd data has
  // time to settle before the modal covers the board. Wins are already held by
  // DailyEndCard's own confetti reveal, so this outer hold only covers the other
  // outcomes; it resets whenever the puzzle returns to play (archive/replay).
  useEffect(() => {
    if (g.status !== 'done') { setEndCardReady(false); return undefined; }
    const t = setTimeout(() => setEndCardReady(true), 3500);
    return () => clearTimeout(t);
  }, [g.status]);

  function say(msg) {
    setToast(msg);
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(null), 2400);
  }

  const elapsed = g.t0 ? fmtTime((g.tEnd || nowTick) - g.t0) : '0:00';
  const isTodays = PUZZLE.num === pickPuzzle(puzzles, null).num;
  const iq = useIqStanding({ game: 'outrank', quizId: PUZZLE.quizId, active: LOFT && !playing });
  const nextUp = useNextUnplayed({ self: 'outrank', active: LOFT && !playing });
  const upNext = useUnplayedSimilar({ self: 'outrank', active: LOFT && !playing });
  const dailyBoard = useDailyBoard({ quizId: PUZZLE.quizId, active: LOFT && !playing });
  const allTime = useGameAllTime({ game: 'outrank', active: LOFT && !playing });
  const dayStats = useDayStats();
  const catRank = useCategoryRank({ self: 'outrank', active: LOFT && !playing });
  const prevPuzzle = puzzles.find((x) => x.num === PUZZLE.num - 1) || null;
  const myStats = deriveStats(stats, pickPuzzle(puzzles, null).num);

  const REC_KEY = `sot_outrank_rec_${PUZZLE.num}`;
  const abandon = useAbandonFlush(() => {
    // A play counts only once the player actually acts (casts a vote or places any
    // item in the order). Merely opening the puzzle and dismissing the start gate
    // does not log a 0-score attempt.
    const acted = g.fav != null || g.order.length > 0;
    if (!acted || g.status !== 'playing') return null;
    try { if (localStorage.getItem(REC_KEY)) return null; } catch (e) {}
    const el = Math.min(36000, Math.max(1, Math.round((Date.now() - (g.t0 || Date.now())) / 1000)));
    try { localStorage.setItem(REC_KEY, '1'); } catch (e) {}
    return { quizId: PUZZLE.quizId, score: 0, total: TOTAL, correct: 0, guessesUsed: 0, timeElapsed: el, abandoned: true, email: identity?.email || undefined, anonId: getAnonId(), isMobile: isMobileDevice(), referrer: (typeof document !== 'undefined' ? document.referrer : '') };
  });

  function postResult(g2, sc, exact) {
    abandon.markFlushed();
    const el = g2.t0 ? Math.max(1, Math.round(((g2.tEnd || Date.now()) - g2.t0) / 1000)) : 1;
    try { setStats(recordStat(PUZZLE.num, { s: sc, t: TOTAL, g: 0, won: sc >= winBar(TOTAL) })); } catch (e) {}
    try {
      fetch('/api/quiz/result', {
        method: 'POST',
        keepalive: true,
        headers: { 'Content-Type': 'application/json' },
        // guessesUsed = 0 for everyone (there are no wrong answers to count), so
        // the daily board's tiebreak falls through to fastest time.
        body: JSON.stringify({ quizId: PUZZLE.quizId, score: sc, total: TOTAL, correct: exact, guessesUsed: 0, timeElapsed: el, email: identity?.email || undefined, anonId: getAnonId(), isMobile: isMobileDevice(), referrer: (typeof document !== 'undefined' ? document.referrer : '') }),
      })
        .then((r) => r.json())
        .then((d) => { if (d && !d.error) setBoard({ ...EMPTY_BOARD, ...d }); })
        .catch(() => {});
    } catch (e) {}
  }

  // Pressing Start begins the clock (sets t0) and marks the rules as seen.
  // A no-op once started, so re-reading the rules later never resets the timer.
  function startGame() {
    setG((cur) => (cur.t0 ? cur : { ...cur, t0: Date.now() }));
    try { localStorage.setItem(HELP_KEY, '1'); } catch (e) {}
  }

  function pickFav(i) {
    if (!playing) return;
    setG((cur) => {
      const g2 = { ...cur, fav: cur.fav === i ? null : i };
      if (!g2.t0) g2.t0 = Date.now();
      return g2;
    });
  }
  function tapOrder(i) {
    if (!playing) return;
    setG((cur) => {
      const at = cur.order.indexOf(i);
      const order = at >= 0 ? cur.order.filter((x) => x !== i) : (cur.order.length < K ? [...cur.order, i] : cur.order);
      const g2 = { ...cur, order };
      if (!g2.t0) g2.t0 = Date.now();
      return g2;
    });
  }
  function resetOrder() {
    if (!playing) return;
    setG((cur) => ({ ...cur, order: [] }));
  }

  async function faceTheCrowd() {
    if (!playing || sending) return;
    if (g.fav == null) { say('Cast your vote first — tap your favorite.'); return; }
    if (g.order.length < K) { say(`Place all ${K} in order — ${K - g.order.length} to go.`); return; }
    setSending(true);
    try {
      const answers = [g.fav, ...g.order];
      const r = await fetch('/api/outrank', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ quizId: PUZZLE.quizId, answers, anonId: getAnonId(), email: identity?.email || undefined }),
      });
      const d = await r.json();
      if (!d || d.error || !Array.isArray(d.reveal)) {
        say('Couldn’t reach the crowd — try again in a moment.');
        setSending(false);
        return;
      }
      const g2 = { ...g, status: 'done', result: d, tEnd: Date.now() };
      if (!g2.t0) g2.t0 = Date.now();
      const exact = (d.slotPts || []).filter((p) => p === 2).length;
      postResult(g2, d.points, exact);
      setG(g2);
    } catch (e) {
      say('Couldn’t reach the crowd — try again in a moment.');
    }
    setSending(false);
  }

  function resetGame() {
    try { localStorage.removeItem(STORE_KEY); } catch (e) {}
    setG(freshState()); setEndClosed(false);
  }

  function shareText() {
    const squares = (result ? result.slotPts || [] : []).map((p) => (p === 2 ? '\u{1F7E9}' : p === 1 ? '\u{1F7E8}' : '⬜')).join('');
    const streakBit = isTodays && myStats.cur >= 2 ? ` · streak ${myStats.cur}` : '';
    const crowdBit = result ? ` · crowd of ${fmtBig(result.poolSize)}` : '';
    return `Outrank #${PUZZLE.num} · ${score}/${TOTAL}${crowdBit}${streakBit}\n${squares}\n${shareUrl()}`;
  }
  function shareUrl() {
    return withRef(`mindloftdaily.com/outrank${isTodays ? '' : `?p=${PUZZLE.num}`}`);
  }
  function copyShare() {
    const text = playing
      ? `Outrank #${PUZZLE.num} — the daily crowd-ranking puzzle from Mind Loft.\n${shareUrl()}`
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
    <span style={{ flex: '0 0 auto', fontFamily: SANS, fontSize: 12, fontWeight: 800, borderRadius: 6, padding: '3px 9px', color: pts === 2 ? T.white : pts === 1 ? '#7c5a08' : COLORS.faded, background: pts === 2 ? COLORS.green : pts === 1 ? '#fdf0cd' : `var(--stg-surf, ${COLORS.paper})` }}>
      +{pts}
    </span>
  );

  // ---- the reveal: crowd order vs. your call ----
  function revealBoard() {
    const rows = result.reveal || [];
    const maxV = Math.max(1, ...rows.map((r) => r.votes));
    return (
      <div style={{ background: STAGE ? SURF : T.white, border: STAGE ? `1px solid ${SURF_B}` : '1.5px solid rgba(28,30,36,0.18)', borderRadius: 10, padding: '13px 15px', maxWidth: 472, margin: '0 auto 12px' }}>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginBottom: 9 }}>
          <span style={{ fontFamily: MONO, fontSize: 10.5, fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.1em', color: ACC_INK }}>The crowd&rsquo;s order</span>
          <span style={{ fontFamily: SANS, fontSize: 11, fontWeight: 700, color: FADED, marginLeft: 'auto' }}>{fmtBig(result.poolSize)} votes in</span>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {rows.map((r, i) => {
            const off = Math.abs(r.yourRank - r.rank);
            return (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
                <span style={{ flex: '0 0 20px', fontFamily: MONO, fontSize: 13, fontWeight: 700, color: r.rank <= 3 ? `var(--stg-ink, ${COLORS.ink})` : `var(--stg-mute, ${COLORS.faded})`, textAlign: 'right' }}>{r.rank}</span>
                <div style={{ flex: '1 1 auto', minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
                    <span style={{ fontFamily: SANS, fontSize: 13.5, fontWeight: r.yourFav ? 800 : 700, color: INK, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {r.item}{r.yourFav ? ' ♥' : ''}
                    </span>
                    <span style={{ fontFamily: MONO, fontSize: 10.5, color: FADED, whiteSpace: 'nowrap' }}>{r.pct}%</span>
                  </div>
                  <div style={{ height: 7, background: STAGE ? 'var(--stg-surf2)' : COLORS.paper, borderRadius: 4, overflow: 'hidden', marginTop: 3 }}>
                    <div style={{ width: `${Math.round((r.votes / maxV) * 100)}%`, height: '100%', background: r.yourFav ? COLORS.gold : '#b9c0f0', borderRadius: 4, minWidth: r.votes ? 4 : 0 }} />
                  </div>
                </div>
                <span style={{ flex: '0 0 auto', fontFamily: SANS, fontSize: 11, fontWeight: 700, color: off === 0 ? COLORS.green : `var(--stg-mute, ${COLORS.faded})`, whiteSpace: 'nowrap' }}>
                  you: #{r.yourRank}
                </span>
                {ptsChip(r.pts)}
              </div>
            );
          })}
        </div>
        <div style={{ fontFamily: SANS, fontSize: 12, fontWeight: 700, color: FADED, marginTop: 10, lineHeight: 1.5 }}>
          Your favorite: <b style={{ color: INK }}>{ITEMS[result.yourFav]}</b> &mdash; you and <b style={{ color: INK }}>{result.favPct}%</b> of the crowd.
        </div>
      </div>
    );
  }

  // Shared rules body — rendered in both the how-to-play modal and the start gate.
  const rulesBody = (
    <DailyRules
      accent={COLORS.accent} accentSoft={COLORS.accentSoft}
      lead="The answer key is everyone playing today."
      chips={[
        { label: '2 = exact slot', tone: 'good' },
        { label: '1 = one slot off', tone: 'warn' },
        { label: '0 = anywhere else', tone: 'bad' },
      ]}
      steps={[
        <><b>Vote</b>: tap your honest favorite, and your taste becomes part of the crowd.</>,
        <><b>Call it</b>: put the whole slate in the order you think today&rsquo;s crowd ranks it by favorite votes.</>,
        <>Score <b>{winBar(TOTAL)} of {TOTAL}</b> and you outranked the crowd, for now.</>,
      ]}
      knack={<>Rank what the crowd likes, not what you like. Your own favorite is one vote among all of today&rsquo;s.</>}
      note={<><b>Nothing is final.</b> Every new vote can reshuffle the crowd&rsquo;s order, so your score and rank move all day.</>}
      footer="One themed slate, two moves, and the standings keep re-scoring until the day is out."
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
      <DailyChrome slug="outrank" name="Outrank" collapsed={started} loft={LOFT} />
      )}
      {LOFT && (
        <Cap gameKey="outrank" quizId={PUZZLE.quizId}
          name="Outrank"
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
      <div className="ork-wrap" style={{ position: 'relative', zIndex: 2, maxWidth: 1180, margin: '0 auto', padding: '18px 38px 80px', fontFamily: SANS }}>
        <style>{`
          @media(max-width:560px){.ork-wrap{padding-left:12px !important;padding-right:12px !important;}}
          .ork-btn{font-family:${SANS};font-weight:800;font-size:14px;border:2px solid ${STAGE ? 'var(--stg-line2)' : 'var(--blue-deep)'};background:${STAGE ? 'transparent' : 'var(--white)'};color:${STAGE ? 'var(--stg-ink)' : 'var(--blue-deep)'};border-radius:8px;padding:9px 16px;cursor:pointer;display:inline-flex;align-items:center;gap:7px;}
          .ork-btn:hover{background:var(--stg-surf2, var(--accent-soft));}
          .ork-item{font-family:${SANS};font-weight:800;font-size:13.5px;border: 2px solid var(--stg-line, rgba(28,30,36,0.3));background:${STAGE ? 'var(--stg-surf)' : 'var(--white)'};color:${INK};border-radius:9px;padding:9px 13px;cursor:pointer;display:inline-flex;align-items:center;gap:8px;}
          .ork-item:hover{border-color:var(--stg-acc, ${COLORS.accent});}
          .ork-item-on{background:var(--stg-acc, ${COLORS.accent});border-color:var(--stg-acc, ${COLORS.accent});color:var(--stg-onramp, var(--white));box-shadow:0 0 0 3px rgba(232,180,58,0.45);}
          .ork-slot{background:var(--stg-acc, ${COLORS.accent});border-color:var(--stg-acc, ${COLORS.accent});color:var(--stg-onramp, var(--white));}
          .ork-face{font-family:${SANS};font-weight:800;font-size:15px;letter-spacing:0.05em;text-transform:uppercase;border:none;background:var(--stg-acc, ${COLORS.accent});color:var(--stg-onramp, var(--white));border-radius:10px;padding:0 26px;height:56px;cursor:pointer;display:inline-flex;align-items:center;gap:10px;box-shadow:0 3px 0 rgba(20,22,28,0.25);}
          .ork-face:active{transform:translateY(1px);box-shadow:0 2px 0 rgba(20,22,28,0.25);}
          .ork-face:disabled{opacity:.55;cursor:default;}
          .ork-face .ork-gold{color:${COLORS.gold};}
          @media(max-width:560px){.ork-ttl{flex-direction:column;align-items:flex-start;gap:1px;}.ork-ttl h1{font-size:21px;letter-spacing:0.02em;}.ork-ttl .ork-ttl-dt{font-size:15px;}.ork-ttl-dot{display:none;}.ork-mh-tile{width:30px !important;height:30px !important;font-size:17px !important;}}
        `}</style>

        <div style={{ maxWidth: 640, margin: '0 auto' }}>


        {/* masthead: pressed OUTRANK tiles with No./date inline */}
        {!LOFT && (
        <DailyMasthead
          slug="outrank"
          num={PUZZLE.num}
          dateLabel={PUZZLE.dateLabel}
          accent={COLORS.accent}
          blockGap={4}
          helpTop={13}
          marginBottom={16}
          onHelp={() => setShowHelp(true)}
          sunday={PUZZLE.sunday && <span style={{ fontFamily: MONO, fontSize: 9.5, letterSpacing: '0.1em', textTransform: 'uppercase', fontWeight: 500, color: `var(--stg-onramp, ${T.white})`, background: `var(--stg-acc, ${COLORS.accent})`, borderRadius: 4, padding: '2px 6px' }}>Sunday Edition &middot; Seven items</span>}
          blocks={'OUTRANK'.split('').map((ch, i) => (
              <div key={i} className="ork-mh-tile" style={{ width: 34, height: 34, borderRadius: 5, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: SANS, fontWeight: 900, fontSize: 20, background: i >= 3 ? `var(--stg-acc, ${COLORS.accent})` : COLORS.ink, color: T.white, boxShadow: 'inset 0 2px 5px rgba(0,0,0,0.5), 0 1px 0 rgba(255,255,255,0.65)' }}>{ch}</div>
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

        {/* start tile — sits where the slate goes; the slate and its two moves
            stay sealed (not rendered) until the player presses Start, which begins the clock. */}
        {preStart && (
          <div className={STAGE ? 'stg-gate' : (LOFT ? 'loft-card' : undefined)} style={{ background: STAGE ? SURF : COLORS.cream, border: STAGE ? `1px solid ${SURF_B}` : `2px solid ${COLORS.ink}`, borderRadius: 12, padding: '22px', margin: '0 auto 12px', display: 'flex', flexDirection: 'column' }}>
            <div style={{ fontSize: 20, fontWeight: 800, color: INK, marginBottom: 10 }}>{gateRules ? 'How to play' : 'Outrank is ready'}</div>
            {gateRules ? rulesBody : (
              <div style={{ fontSize: 14, lineHeight: 1.55, color: INK, fontWeight: 600 }}>
                <p style={{ margin: '0 0 6px' }}>Two moves: vote for your honest favorite, then predict how today&rsquo;s crowd ranks the whole slate. The slate stays sealed until you begin.</p>
              </div>
            )}
            <div style={{ marginTop: 18, display: 'flex', flexDirection: 'row-reverse', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
              <button className="ork-btn" onClick={startGame} style={{ borderColor: STAGE ? STAGE_C : undefined, background: STAGE ? STAGE_C : T.cta, color: STAGE ? 'var(--stg-onramp, #08222e)' : T.white, fontSize: 15, padding: '11px 22px' }}>Start</button>
              <div>
                <button type="button" onClick={() => setGateRules((v) => !v)} style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', fontFamily: SANS, fontSize: 13, fontWeight: 700, color: FADED, textDecoration: 'underline' }}>
                  {gateRules ? 'Hide detailed instructions' : 'Show detailed instructions'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* the day's slate */}
        {!preStart && (
        <div className={STAGE ? 'stg-board' : undefined} style={{ background: `var(--stg-surf, ${COLORS.accentSoft})`, border: `2px solid var(--stg-line, ${COLORS.ink})`, borderRadius: 10, padding: '15px 17px 12px', boxShadow: '5px 5px 0 rgba(28,30,36,0.16)', marginBottom: 12 }}>
          <div style={{ display: LOFT ? 'none' : 'flex', alignItems: 'center', gap: 12, fontFamily: MONO, fontSize: 11.5, letterSpacing: '0.1em', textTransform: 'uppercase', color: FADED, marginBottom: 9, flexWrap: 'wrap' }}>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, whiteSpace: 'nowrap' }}><Users size={12} /> today&rsquo;s category</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'stretch', gap: 10, borderBottom: '1px solid rgba(28,30,36,0.18)', paddingBottom: 12, marginBottom: 12 }}>
            <span aria-hidden style={{ flex: '0 0 auto', width: 5, background: `var(--stg-acc, ${COLORS.accent})`, borderRadius: 3 }} />
            <span style={{ fontFamily: SANS, fontSize: 23, fontWeight: 800, letterSpacing: '-0.02em', lineHeight: 1.12, color: ACC_INK, textTransform: 'uppercase' }}>{PUZZLE.theme}</span>
          </div>
          <div style={{ fontFamily: SANS, fontSize: 13, fontWeight: 700, color: FADED, marginBottom: 12, lineHeight: 1.5 }}><b style={{ color: INK }}>{PUZZLE.theme}:</b> {PUZZLE.flavor}</div>

          {playing ? (
            <>
              {/* step 1 — your vote */}
              <div style={{ background: STAGE ? SURF : T.white, border: STAGE ? `1px solid ${SURF_B}` : '1.5px solid rgba(28,30,36,0.18)', borderRadius: 10, padding: '12px 14px', marginBottom: 9 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                  <span style={{ fontFamily: MONO, fontSize: 10, letterSpacing: '0.1em', textTransform: 'uppercase', fontWeight: 500, color: `var(--stg-onramp, ${T.white})`, background: `var(--stg-acc, ${COLORS.accent})`, borderRadius: 4, padding: '2px 7px' }}>1 &middot; Your vote</span>
                  {g.fav != null && <span style={{ marginLeft: 'auto', color: `var(--stg-ink, ${COLORS.green})`, display: 'flex' }}><svg viewBox="0 0 12 12" width="14" height="14" fill="none"><path d="M2.5 6.2 L5 8.6 L9.5 3.6" stroke={T.successDeep} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg></span>}
                </div>
                <div style={{ fontFamily: SANS, fontSize: 15, fontWeight: 800, letterSpacing: '-0.01em', color: INK, lineHeight: 1.4, marginBottom: 9 }}>
                  Tap your honest favorite. Your vote helps build the crowd&rsquo;s real order.
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7 }}>
                  {ITEMS.map((it, i) => (
                    <button key={i} onClick={() => pickFav(i)} className={`ork-item${g.fav === i ? ' ork-item-on' : ''}`}>
                      {g.fav === i ? <Crown size={13} style={{ color: COLORS.gold }} /> : null}{it}
                    </button>
                  ))}
                </div>
              </div>

              {/* step 2 — call the crowd */}
              <div style={{ background: STAGE ? SURF : T.white, border: STAGE ? `1px solid ${SURF_B}` : '1.5px solid rgba(28,30,36,0.18)', borderRadius: 10, padding: '12px 14px', marginBottom: 9 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                  <span style={{ fontFamily: MONO, fontSize: 10, letterSpacing: '0.1em', textTransform: 'uppercase', fontWeight: 500, color: `var(--stg-onramp, ${T.white})`, background: `var(--stg-acc, ${COLORS.accent})`, borderRadius: 4, padding: '2px 7px' }}>2 &middot; Call the crowd</span>
                  <span style={{ marginLeft: 'auto', fontFamily: MONO, fontSize: 10.5, color: FADED }}>placed {g.order.length}/{K}</span>
                </div>
                <div style={{ fontFamily: SANS, fontSize: 15, fontWeight: 800, letterSpacing: '-0.01em', color: INK, lineHeight: 1.4, marginBottom: 9 }}>
                  Now forget your taste. Tap the items in the order TODAY&rsquo;S CROWD ranks them, favorite first.
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7 }}>
                  {ITEMS.map((it, i) => {
                    const pos = g.order.indexOf(i);
                    return (
                      <button key={i} onClick={() => tapOrder(i)} className={`ork-item${pos >= 0 ? ' ork-slot' : ''}`}>
                        {pos >= 0 ? <span style={{ fontFamily: MONO, fontSize: 11, fontWeight: 700, background: 'rgba(255,255,255,0.25)', borderRadius: 4, padding: '1px 6px' }}>#{pos + 1}</span> : null}{it}
                      </button>
                    );
                  })}
                </div>
                {g.order.length > 0 && (
                  <button onClick={resetOrder} style={{ marginTop: 9, fontFamily: SANS, fontSize: 11.5, fontWeight: 800, color: FADED, background: 'none', border: 'none', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 5, padding: 0 }}>
                    <RotateCcw size={12} /> Reset the order
                  </button>
                )}
              </div>

              <div style={{ textAlign: 'center', margin: '14px 0 8px' }}>
                <button className="ork-face" onClick={faceTheCrowd} disabled={sending || !placedAll}>
                  <Users size={17} className="ork-gold" /> {sending ? 'Facing the crowd…' : 'Face the crowd'}
                </button>
                <div style={{ fontFamily: SANS, fontSize: 11.5, fontWeight: 700, color: FADED, marginTop: 8 }}>
                  Exact slot pays 2, one off pays 1. The order is whatever today&rsquo;s players vote it to be.
                </div>
              </div>
            </>
          ) : (
            <div style={{ fontFamily: SANS, fontSize: 12.5, fontWeight: 700, color: FADED }}>
              Locked in. The crowd&rsquo;s order below keeps updating as votes arrive.
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
                    {sharp ? 'You outranked the crowd.' : score >= TOTAL / 2 ? 'You read the room respectably.' : 'The crowd surprised you today.'}
                    {' '}<span style={{ color: FADED, fontWeight: 600 }}>{result.board && result.board.youRegistered && result.board.you ? <>Live rank #{result.board.you.rank} of {fmtBig(result.board.registered)} &middot; </> : null}A field of {fmtBig(result.realCount != null ? result.realCount : result.poolSize)} &middot; {elapsed}</span>
                  </span>
                </div>
              </div>
              {revealBoard()}
              <OutrankLiveBoard board={result.board} total={TOTAL} />
              <p className={STAGE ? undefined : 'loft-tailnote'} style={{ fontSize: 12, color: FADED, fontWeight: 600, margin: '12px 0 0' }}>
                {isTodays ? (
                  <>
                    {countdown ? <>Next Outrank in <b style={{ color: INK, fontVariantNumeric: 'tabular-nums' }}>{countdown}</b>.</> : 'A new crowd forms at midnight Eastern.'}
                    {prevPuzzle && (
                      <>
                        {' '}Meanwhile:{' '}
                        <a href={`/outrank?p=${prevPuzzle.num}`} style={{ color: `var(--stg-ink, ${COLORS.ember})`, fontWeight: 800, textDecoration: 'underline' }}>
                          play yesterday&rsquo;s Outrank &rarr;
                        </a>
                      </>
                    )}
                  </>
                ) : (
                  <>
                    You&rsquo;re playing the {PUZZLE.dateLabel.replace(', 2026', '')} archive.{' '}
                    <a href="/outrank" style={{ color: `var(--stg-ink, ${COLORS.ember})`, fontWeight: 800, textDecoration: 'underline' }}>Back to today&rsquo;s Outrank &rarr;</a>
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
              name="Outrank"
              catRank={catRank}
              outcome={score > 0 ? 'won' : 'lost'}
              title={score > 0 ? 'complete' : 'not complete'}
              detail={`${`${score}/${TOTAL}`} \u00b7 ${elapsed}`}
              iq={iq}
              board={dailyBoard}
              gameRank={allTime && allTime.ready
                ? { value: allTime.rank != null ? `#${Number(allTime.rank).toLocaleString()}` : '\u2014',
                    label: allTime.field != null ? `of ${Number(allTime.field).toLocaleString()} Outrank all time` : 'all-time rank' }
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
                  href: `/outrank?p=${p.num}`,
                  done: !!(stats && stats.rec && stats.rec[p.num]),
                  score: (stats && stats.rec && stats.rec[p.num]) ? stats.rec[p.num].s : null,
                }))}
              options={[
                { label: copied ? 'Copied' : (shareCta || 'Share'), sub: 'Your result, no spoilers', kind: 'gold', onClick: copyShare },
                { tone: (score > 0) ? 'board' : 'reveal', label: (score > 0) ? 'Return to board' : 'Reveal answer',
                  sub: (score > 0) ? 'Your finished board' : 'Show what you missed', onClick: () => setRevealed(true) },
              prevPuzzle && { tone: 'another', label: 'Play another Outrank', sub: `No. ${prevPuzzle.num}, yesterday\u2019s puzzle`, href: `/outrank?p=${prevPuzzle.num}` },
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
        {!STAGE && <GamePanel self="outrank" name="Outrank" onShow={() => setShowChrome(true)} />}
        <div style={{ display: (focusMode && !STAGE) ? 'none' : 'block', margin: '30px auto 0' }}>
          {LOFT && (
            <div className={STAGE ? undefined : 'loft-report'}>
              <ReportIssue self="outrank" name="Outrank" accent="#ffffff" align="center" onHelp={() => setShowHelp(true)} />
            </div>
          )}
          {!LOFT && (
          <DailyGamesGrid replay={!playing && result ? resetGame : null}
            self="outrank"
            maxWidth={640}
            challengeHref={`/duel/new?quiz=${encodeURIComponent(PUZZLE.quizId)}`}
            share={{ label: copied ? 'Copied' : 'Share', onClick: copyShare }}
            light
            boardSlot={<DailyBoardPanel self="outrank" quizId={PUZZLE.quizId} maxWidth={640} streak={{ current: myStats.cur, best: myStats.max }} />}
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
              <div style={{ fontSize: 17, fontWeight: 800, color: INK, marginBottom: 8 }}>Add Outrank to your Home Screen</div>
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
      {!playing && result && !endClosed && (sharp || endCardReady) && !LOFT && (
        <DailyEndCard
          modal
          self="outrank"
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
            <button className="ork-btn" onClick={() => { setShowHelp(false); try { localStorage.setItem(HELP_KEY, '1'); } catch (e) {} }} style={{ marginTop: 14, background: COLORS.ink, color: T.white }}>Play</button>
          </div>
        </div>
      )}

      {/* The desktop fold: the About prose below starts one screen down (app/StageFold.jsx). */}
      <StageFold />
      {/* About Outrank — crawlable prose for search, server-rendered into the HTML */}
      <section style={{ display: (focusMode && !STAGE) ? 'none' : 'block', position: 'relative', zIndex: 2, maxWidth: 640, margin: '0 auto', padding: '10px 24px 42px', fontFamily: SANS }}>
        <h2 style={{ margin: '0 0 8px', fontSize: 15, fontWeight: 800, letterSpacing: '-0.01em', color: INK }}>About Outrank</h2>
        <p style={{ margin: '0 0 8px', fontSize: 13, lineHeight: 1.65, color: FADED, fontWeight: 600 }}>
          Outrank is a free daily puzzle from Mind Loft where the crowd itself is the answer key. Every day brings a new themed slate, breakfast classics, candy bars, karaoke closers, the seven deadly sins, and every player makes two moves: vote for their honest favorite, then predict how the entire field of players ranks the whole list. Your vote helps build the real order; your prediction is scored against it.
        </p>
        <p style={{ margin: '0 0 8px', fontSize: 13, lineHeight: 1.65, color: FADED, fontWeight: 600 }}>
          There is no trivia to know, the puzzle is pure crowd-reading. Placing an item in its exact crowd slot pays two points, one slot off pays one, and the daily maximum is a perfect call of the whole board. And the score is alive: the crowd&rsquo;s order is recomputed from every vote as it arrives, so your points and your place on the live standings keep moving all day. A pre-written house crowd seeds the small hours, then retires once ten real players are in; your own prediction is always graded on the crowd minus your own vote, so you can never tip the order you&rsquo;re scored against. On Sundays the slate grows to seven items.
        </p>
        <p style={{ margin: 0, fontSize: 13, lineHeight: 1.65, color: FADED, fontWeight: 600 }}>
          A new crowd forms every day at midnight Eastern. No app, no signup, play free in your browser, keep a streak, and race the daily leaderboard. More dailies: <a href="/outwit" style={{ color: INK, fontWeight: 800 }}>Outwit</a>, our five-prompt crowd puzzle, <a href="/tally" style={{ color: INK, fontWeight: 800 }}>Tally</a>, our row-and-column logic puzzle, and <a href="/suds" style={{ color: INK, fontWeight: 800 }}>Suds</a>, our daily sudoku.
        </p>
      </section>

      {!STAGE && <div style={{ display: focusMode ? 'none' : 'block', position: 'relative', zIndex: 2 }}><Footer /></div>}
    </div>
  );
}
