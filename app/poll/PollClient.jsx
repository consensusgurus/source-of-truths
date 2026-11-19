'use client';

// Poll, the daily crowd-percentage game (owner, 2026-11-16).
//
// Five questions a day, every one A or B ("Cheez-Its or Goldfish?"). On each
// the player gives their OWN pick, then drags a slider to the percentage of
// today's players they think picked each side. Only the percentage is scored:
// 20 points a question, one lost for every point the guess misses the real
// split by, out of 100. There is no answer key, only the crowd: the server
// scores leave-one-out against every ballot in the pool (lib/poll-score.js)
// and keeps re-scoring as the field fills in. A house crowd seeds the pool
// until ten real players are in, then retires for all.
//
// Forked from HerdClient's frame: same daily plumbing (Eastern-date banks,
// per-puzzle saves, ?p=N archive, stats and streaks, the stage), with Herd's
// one tap a question swapped for a pick and a slider. An answer in state is
// { k, p }: k the pick (0 or 1), p the guessed share for option A. It goes to
// the server as ONE integer, k * 1000 + p (enc below; lib/poll-score.js).

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useSearchParams } from 'next/navigation';
import { HelpCircle, X, Smartphone, Users, Crown } from 'lucide-react';
import Grain from '../Grain';
import Footer from '../Footer';
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
import PlayStage, { usePhoneStage } from '../PlayStage';
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
import { endGrade } from '@/lib/end-verdict';
import HelpSheet from '../HelpSheet';

const COLORS = {
  cream: T.surface,
  paper: T.paper,
  ink: T.ink,
  ember: T.accent,
  rust: T.danger,
  faded: T.muted,
  accent: '#0f766e',       // Poll identity: deep teal
  accentSoft: T.surfaceAlt,
  gold: T.gold,
  green: T.successDeep,
  greenSoft: '#eefaf1',
};
const SANS = "'Manrope', system-ui, -apple-system, sans-serif";
const MONO = "'Manrope', ui-monospace, 'SFMono-Regular', monospace";
const HELP_KEY = 'sot_poll_help_seen';
const STATS_KEY = 'sot_poll_stats';

// THE QUESTIONS ON THE WHITE STAGE (owner, 2026-11-12). The stage resets every
// button's font to the page's, so the stepper's own sizes are restated here.
const PL_ST_CSS = `
.pst .pl-st .pl-sw{font-weight:800;font-size:20px;}
.pst .pl-st .pl-grid-many .pl-sw{font-size:17px;}
.pst .pl-st .pl-card{font-weight:800;font-size:17px;}
.pst .pl-st .pl-back{font-weight:700;font-size:15px;}
.pst .pl-st .pl-go{font-weight:800;font-size:15px;}
.pst .pl-st .pl-face.pl-go{font-size:14px;}
.pst .pl-st .pl-opt{font-weight:800;font-size:13.5px;}
.pst .pl-st .pl-btn{font-weight:800;font-size:14px;}
.pst .pl-st :is(.pl-card-on,.pl-go-on,.pl-face){color:var(--stg-onramp,#fff);}
.pst .pl-st .pl-nudge{font-weight:700;font-size:22px;}
.pst .pl-st :is(.pl-eyebrow,.pl-seg-tag,.pl-pick){font-family:'Manrope',system-ui,sans-serif;letter-spacing:.06em;font-weight:800;}
@media(max-width:640px){.pst .pl-st .pl-sw,.pst .pl-st .pl-grid-many .pl-sw{font-size:17px;}.pst .pl-st .pl-card{font-size:15.5px;}}
`;

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
// from the /api/poll response (result.board), which recomputes every
// registered player's total against the current field on every request.
function PollLiveBoard({ board }) {
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
              <span style={{ flex: '0 0 auto', fontFamily: MONO, fontSize: 12.5, fontWeight: 500, color: `var(--stg-ink, ${COLORS.ink})`, fontVariantNumeric: 'tabular-nums' }}>{r.total}<span style={{ color: `var(--stg-mute, ${COLORS.faded})`, fontSize: 10.5 }}>/100</span></span>
            </div>
          ))}
        </div>
      )}
      {board.youRegistered && !youShown && board.you ? (
        <div style={{ marginTop: 8, paddingTop: 8, borderTop: '1px solid rgba(28,30,36,0.1)', display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ flex: '0 0 26px', fontFamily: MONO, fontSize: 12, fontWeight: 700, color: '#8a6d1a', textAlign: 'right' }}>{board.you.rank}</span>
          <span style={{ flex: '1 1 auto', fontFamily: SANS, fontSize: 13, fontWeight: 800, color: '#8a6d1a' }}>You</span>
          <span style={{ flex: '0 0 auto', fontFamily: MONO, fontSize: 12.5, fontWeight: 500, color: `var(--stg-ink, ${COLORS.ink})` }}>{board.you.total}<span style={{ color: `var(--stg-mute, ${COLORS.faded})`, fontSize: 10.5 }}>/100</span></span>
        </div>
      ) : null}
      {!board.youRegistered ? (
        <div style={{ marginTop: 8, fontFamily: SANS, fontSize: 11, fontWeight: 700, color: `var(--stg-mute, ${COLORS.faded})` }}>Join the leaderboard below to take your place as the field grows.</div>
      ) : null}
    </div>
  );
}

const TOTAL = 100;
// An answer is finished when it has both halves: the pick and the percentage.
const isDone = (a) => !!a && (a.k === 0 || a.k === 1) && Number.isInteger(a.p) && a.p >= 0 && a.p <= 100;
const enc = (a) => (a.k ? 1000 : 0) + a.p;

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
  const rec = { ...s.rec, [num]: { s: sc, t: TOTAL, g: prev.g != null ? prev.g : 0, won: sc >= 70 } };
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
    const sc = Math.max(0, Math.min(TOTAL, Math.round(m.scorePct || 0)));
    if (!changed) { rec = { ...rec }; changed = true; }
    rec[p.num] = { s: sc, t: TOTAL, g: null, won: sc >= 70 };
  }
  if (!changed) return s;
  const s2 = { ...s, rec };
  try { localStorage.setItem(STATS_KEY, JSON.stringify(s2)); } catch (e) {}
  return s2;
}

function freshState() {
  return {
    v: 1,
    ans: {},                    // promptIdx -> { k: pick 0|1, p: guessed percent for option A }
    status: 'playing',          // playing | done
    result: null,               // /api/poll response
    t0: null,
    tEnd: null,
  };
}

export default function PollClient({ puzzles = [], forceNum = null }) {
  const PUZZLE = useMemo(() => pickPuzzle(puzzles, forceNum), [puzzles, forceNum]);
  const PROMPTS = PUZZLE.prompts;
  const PER = Math.round(TOTAL / PROMPTS.length);
  const STORE_KEY = `sot_poll_${PUZZLE.num}`;

  const [g, setG] = useState(freshState);
  // One prompt at a time (board rebuild, 2026-10-07): which prompt is on screen.
  const [step, setStep] = useState(0);
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
  const toastTimer = useRef(null);
  const viewedRef = useRef(false);

  const [showChrome, setShowChrome] = useState(false);
  const playing = g.status === 'playing';
  const LOFT = isLoft('poll');
  const STAGE = isStage('poll', searchParams);
  const STAGE_C = STAGE ? 'var(--stg-acc)' : gameColor('poll');
  const STAGE_C_INK = STAGE ? 'var(--stg-acc-ink, var(--stg-acc))' : gameColor('poll');
  const Cap = STAGE ? StageChrome : LoftCap;
  const STAGE_ACC = { '--stg-acc-dk': gameColor('poll'), '--stg-acc-lt': gameColorLight('poll'), '--stg-onramp-lt': gameOnrampLight('poll'), '--stg-acc-ink-lt': gameAccentInkLight('poll') };
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
  // IN A RUN THE GAME STARTS ON ITS OWN (owner, 2026-10-27): the run's own entry is the
  // start screen, so no second start screen sits between the legs (RunEmbed autostart).
  useEffect(() => { if (EMBED && EMBED.autostart && hydrated && preStart) startGame(); }, [EMBED, hydrated, preStart]); // eslint-disable-line react-hooks/exhaustive-deps
  const started = playing && !!g.t0;
  const phoneStage = usePhoneStage();
  // THE STAGE (owner, 2026-11-12): Poll's questions on the shared white stage
  // from Start to the ending's board view; inside a run the run's frame draws them.
  const stageOn = STAGE && !EMBED && phoneStage && !!g.t0 && (playing || !revealed);
  const focusMode = playing && !showChrome;
  const answered = PROMPTS.filter((_, i) => isDone(g.ans[i])).length;
  const result = g.result;
  const score = result ? result.points : 0;
  const sharp = g.status === 'done' && score >= 70; // a sharp read of the room

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
          const firstOpen = PROMPTS.findIndex((_, k) => !isDone(saved.ans[k]));
          setStep(firstOpen < 0 ? Math.max(0, PROMPTS.length - 1) : firstOpen);
        }
      }
      setGateRules(false);
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
        (function(){ var _dn = g.status !== 'playing'; if (_dn || g.t0) localStorage.setItem('sot_poll_day', JSON.stringify({ d: etToday(), done: _dn })); else localStorage.removeItem('sot_poll_day'); })();
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
      if (!g.ans || PROMPTS.some((_, i) => !isDone(g.ans[i]))) return;
      const answers = PROMPTS.map((_, i) => enc(g.ans[i]));
      const r = await fetch('/api/poll', {
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
  const iq = useIqStanding({ game: 'poll', quizId: PUZZLE.quizId, active: LOFT && !playing });
  const nextUp = useNextUnplayed({ self: 'poll', active: LOFT && !playing });
  const upNext = useUnplayedSimilar({ self: 'poll', active: LOFT && !playing });
  const dailyBoard = useDailyBoard({ quizId: PUZZLE.quizId, active: LOFT && !playing });
  const allTime = useGameAllTime({ game: 'poll', active: LOFT && !playing });
  const dayStats = useDayStats();
  const catRank = useCategoryRank({ self: 'poll', active: LOFT && !playing });
  const prevPuzzle = puzzles.find((x) => x.num === PUZZLE.num - 1) || null;
  const myStats = deriveStats(stats, pickPuzzle(puzzles, null).num);

  const REC_KEY = `sot_poll_rec_${PUZZLE.num}`;
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
    // The room's read is where this run stands in the live field (lib/read-room.js).
    if (EMBED) EMBED.onResult({ key: 'poll', score: sc, total: TOTAL, t0: g2 && g2.t0, tEnd: (g2 && g2.tEnd) || Date.now(), read: null, field: (g2 && g2.result && (g2.result.realCount != null ? g2.result.realCount : g2.result.board && g2.result.board.field)) || null });
    const el = g2.t0 ? Math.max(1, Math.round(((g2.tEnd || Date.now()) - g2.t0) / 1000)) : 1;
    try { setStats(recordStat(PUZZLE.num, { s: sc, t: TOTAL, g: 0, won: sc >= 70 })); } catch (e) {}
    try {
      fetch('/api/quiz/result', {
        method: 'POST',
        keepalive: true,
        headers: { 'Content-Type': 'application/json' },
        // guessesUsed = 0 for everyone (there are no wrong answers to count), so
        // the daily board's tiebreak falls through to fastest time.
        body: JSON.stringify({ quizId: PUZZLE.quizId, score: sc, total: TOTAL, correct: sc >= 70 ? 1 : 0, guessesUsed: 0, timeElapsed: el, email: identity?.email || undefined, anonId: getAnonId(), isMobile: isMobileDevice(), referrer: (typeof document !== 'undefined' ? document.referrer : '') }),
      })
        .then((r) => r.json())
        .then((d) => { if (d && !d.error) setBoard({ ...EMPTY_BOARD, ...d }); })
        .catch(() => {});
    } catch (e) {}
  }

  function setHalf(i, half) {
    if (!playing) return;
    setG((cur) => {
      const g2 = { ...cur, ans: { ...cur.ans, [i]: { ...(cur.ans[i] || {}), ...half } } };
      if (!g2.t0) g2.t0 = Date.now();
      return g2;
    });
  }
  const setPick = (i, k) => setHalf(i, { k });
  const setPct = (i, p) => setHalf(i, { p });

  async function faceTheCrowd() {
    if (!playing || sending) return;
    if (answered < PROMPTS.length) { say(`Finish all ${PROMPTS.length} first: a pick and a percentage on each. ${PROMPTS.length - answered} to go.`); return; }
    setSending(true);
    try {
      const answers = PROMPTS.map((_, i) => enc(g.ans[i]));
      const r = await fetch('/api/poll', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ quizId: PUZZLE.quizId, answers, anonId: getAnonId(), email: identity?.email || undefined }),
      });
      const d = await r.json();
      if (!d || d.error || !Array.isArray(d.prompts)) {
        say('Couldn’t reach the poll. Try again in a moment.');
        setSending(false);
        return;
      }
      const g2 = { ...g, status: 'done', result: d, tEnd: Date.now() };
      if (!g2.t0) g2.t0 = Date.now();
      postResult(g2, d.points);
      setG(g2);
    } catch (e) {
      say('Couldn’t reach the poll. Try again in a moment.');
    }
    setSending(false);
  }

  function startGame() {
    setG((cur) => (cur.t0 ? cur : { ...cur, t0: Date.now() }));
    try { localStorage.setItem(HELP_KEY, '1'); } catch (e) {}
  }

  function resetGame() {
    try { localStorage.removeItem(STORE_KEY); } catch (e) {}
    setG(freshState()); setEndClosed(false); setStep(0);
  }

  function shareText() {
    const squares = (result ? result.prompts : []).map((p) => (p.pts >= PER * 0.75 ? '\u{1F7E9}' : p.pts >= PER * 0.4 ? '\u{1F7E8}' : '⬜')).join('');
    const streakBit = isTodays && myStats.cur >= 2 ? ` · streak ${myStats.cur}` : '';
    const crowdBit = result ? ` · crowd of ${fmtBig(result.poolSize)}` : '';
    return `Poll #${PUZZLE.num} · ${score}/${TOTAL}${crowdBit}${streakBit}\n${squares}\n${shareUrl()}`;
  }
  function shareUrl() {
    return withRef(`mindloftdaily.com/poll${isTodays ? '' : `?p=${PUZZLE.num}`}`);
  }
  function copyShare() {
    const text = playing
      ? `Poll #${PUZZLE.num}, the daily guess-the-split game from Mind Loft.\n${shareUrl()}`
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

  const ptsChip = (rp) => {
    const good = rp.pts >= PER * 0.75;
    return (
      <span style={{ marginLeft: 'auto', flex: '0 0 auto', fontFamily: SANS, fontSize: 12, fontWeight: 800, borderRadius: 6, padding: '3px 9px', color: good ? T.white : `var(--stg-ink, ${COLORS.ink})`, background: good ? COLORS.green : `var(--stg-surf2, ${COLORS.paper})` }}>
        {rp.pts} of {PER} points
      </span>
    );
  };

  // The real split, in the counts the points were scored on (your own pick removed),
  // with a marker where your guess sat.
  function revealSplit(rp) {
    const a = Math.max(0, Math.min(100, rp.actual));
    const g0 = Math.max(0, Math.min(100, rp.yourPct));
    return (
      <div style={{ marginTop: 10 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10, fontFamily: SANS, fontSize: 13, fontWeight: 800, color: INK, marginBottom: 6 }}>
          <span style={{ minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{rp.options[0]} <span style={{ fontVariantNumeric: 'tabular-nums' }}>{a}%</span></span>
          <span style={{ minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', textAlign: 'right' }}><span style={{ fontVariantNumeric: 'tabular-nums' }}>{100 - a}%</span> {rp.options[1]}</span>
        </div>
        <div className="pl-bar">
          <div className="pl-bar-a" style={{ width: `${a}%` }} />
          <div className="pl-bar-you" style={{ left: `${g0}%` }} aria-hidden="true"><span style={{ transform: `translateX(-${g0 < 12 ? 10 : g0 > 88 ? 90 : 50}%)` }}>You {g0}%</span></div>
        </div>
        <div style={{ marginTop: 20, fontFamily: SANS, fontSize: 12, fontWeight: 600, color: FADED, lineHeight: 1.45 }}>
          You picked <b style={{ color: INK }}>{rp.options[rp.yourPick]}</b> and guessed {g0}% for {rp.options[0]}. {rp.err === 0 ? 'Dead on.' : `Off by ${rp.err}.`}
        </div>
      </div>
    );
  }

  function renderPrompt(i) {
    const pr = PROMPTS[i];
    const rp = result ? result.prompts[i] : null;
    if (!rp) return null;
    return (
      <div key={i} style={{ background: STAGE ? SURF : T.white, border: '1px solid var(--stg-line, rgba(28,30,36,0.2))', borderRadius: 10, padding: '12px 14px', marginBottom: 9 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 7 }}>
          <span style={{ fontFamily: MONO, fontSize: 10, letterSpacing: '0.1em', textTransform: 'uppercase', fontWeight: 800, color: `var(--stg-onramp, ${T.white})`, background: `var(--stg-acc, ${COLORS.accent})`, borderRadius: 4, padding: '2px 7px' }}>Question {i + 1}</span>
          {ptsChip(rp)}
        </div>
        <div style={{ fontFamily: SANS, fontSize: 15, fontWeight: 800, letterSpacing: '-0.01em', color: INK, lineHeight: 1.4 }}>
          {pr.q}
        </div>
        {revealSplit(rp)}
      </div>
    );
  }

  // ---- the play board: ONE QUESTION AT A TIME ----
  // A strip across the top with a segment per question, the current question
  // large, its two options as cards (your own pick), then the slider (your
  // guess at how everyone split). The last step submits through faceTheCrowd.
  const answerLabel = (i) => {
    const a = g.ans[i];
    if (!isDone(a)) return '';
    return `${a.p}%`;
  };
  function renderStepper() {
    const N = PROMPTS.length;
    const cur = Math.min(Math.max(0, step), N - 1);
    const pr = PROMPTS[cur];
    const a = g.ans[cur] || {};
    const picked = a.k === 0 || a.k === 1;
    const guessed = Number.isInteger(a.p);
    const done = picked && guessed;
    const pct = guessed ? a.p : 50;
    const last = cur === N - 1;
    const allIn = answered >= N;
    const goNext = () => setStep(Math.min(N - 1, cur + 1));
    const submitAll = () => {
      if (!allIn) {
        const open = PROMPTS.findIndex((_, k) => !isDone(g.ans[k]));
        if (open >= 0) setStep(open);
      }
      faceTheCrowd();
    };
    const nudge = (d) => setPct(cur, Math.max(0, Math.min(100, pct + d)));
    return (
      <div className="pl-step">
        <div className="pl-strip" style={{ gridTemplateColumns: `repeat(${N}, minmax(0, 1fr))` }}>
          {PROMPTS.map((p, i) => {
            const fin = isDone(g.ans[i]);
            const on = i === cur;
            return (
              <button key={i} type="button" className="pl-seg" onClick={() => setStep(i)} aria-current={on ? 'step' : undefined}
                aria-label={`Question ${i + 1} of ${N}${fin ? `, guessed ${answerLabel(i)}` : ', not finished yet'}`}>
                <span className="pl-seg-bar" style={{ background: on ? 'var(--stg-ink, ' + COLORS.ink + ')' : fin ? `var(--stg-acc, ${COLORS.accent})` : `var(--stg-cell-line, rgba(28,30,36,0.3))` }} />
                <span className="pl-seg-tag" style={{ color: on ? INK : FADED }}>{i + 1}</span>
                <span className="pl-seg-ans" style={{ color: fin ? INK : FADED }}>{fin ? answerLabel(i) : (on ? 'Now' : 'Open')}</span>
              </button>
            );
          })}
        </div>

        <div className="pl-cur">
          <div className="pl-eyebrow" style={{ color: ACC_INK_OW }}>Question {cur + 1} of {N}</div>
          <div className="pl-q" style={{ color: INK }}>{pr.q}</div>
        </div>

        <div className="pl-part" style={{ color: FADED }}><b style={{ color: INK }}>1</b> Your own pick</div>
        <div className="pl-grid pl-grid-txt">
          {pr.options.map((opt, oi) => {
            const on = a.k === oi;
            return (
              <button key={oi} type="button" className={`pl-card${on ? ' pl-card-on' : ''}`} onClick={() => setPick(cur, oi)} aria-pressed={on}>
                <span>{opt}</span>
                {on && <span className="pl-pick" style={{ background: 'var(--stg-ink, #0b0d12)', color: 'var(--stg-ground, #ffffff)' }}>Your pick</span>}
              </button>
            );
          })}
        </div>

        <div className="pl-part" style={{ color: FADED, marginTop: 22 }}><b style={{ color: INK }}>2</b> How did today&rsquo;s players split?</div>
        <div className={`pl-split${guessed ? '' : ' pl-split-idle'}`}>
          <div className="pl-split-row">
            <div className="pl-side"><b>{guessed ? `${pct}%` : '?'}</b><span>{pr.options[0]}</span></div>
            <div className="pl-side pl-side-r"><b>{guessed ? `${100 - pct}%` : '?'}</b><span>{pr.options[1]}</span></div>
          </div>
          <div className="pl-range-wrap">
            <button type="button" className="pl-nudge" onClick={() => nudge(-1)} aria-label={`One point less for ${pr.options[0]}`}>&minus;</button>
            <input
              key={cur}
              className="pl-range"
              type="range" min="0" max="100" step="1"
              value={pct}
              style={{ '--p': `${pct}%` }}
              onChange={(e) => setPct(cur, Number(e.target.value))}
              onPointerDown={() => { if (!guessed) setPct(cur, pct); }}
              onKeyDown={(e) => { if (!guessed && (e.key === 'Enter' || e.key === ' ')) setPct(cur, pct); }}
              aria-label={`Percent of players who picked ${pr.options[0]}`}
              aria-valuetext={`${pct} percent ${pr.options[0]}, ${100 - pct} percent ${pr.options[1]}`}
            />
            <button type="button" className="pl-nudge" onClick={() => nudge(1)} aria-label={`One point more for ${pr.options[0]}`}>+</button>
          </div>
          <div className="pl-split-hint" style={{ color: FADED }}>
            {guessed ? 'Drag, or tap the buttons to fine tune.' : 'Drag the slider to your guess.'}
          </div>
        </div>

        <div className="pl-nav">
          <button type="button" className="pl-back" onClick={() => setStep(Math.max(0, cur - 1))} disabled={cur === 0}>Back</button>
          {last ? (
            <button type="button" className="pl-face pl-go" onClick={submitAll} disabled={sending}>
              <Users size={17} className="pl-gold" /> {sending ? 'Counting the room…' : (allIn ? 'See the real splits' : `See the real splits · ${N - answered} to go`)}
            </button>
          ) : (
            <button type="button" className={`pl-go ${done ? 'pl-go-on' : 'pl-go-off'}`} onClick={goNext}>
              {done ? 'Next question' : 'Skip'}
            </button>
          )}
        </div>
        <div style={{ fontFamily: SANS, fontSize: 12, fontWeight: 700, color: FADED, marginTop: 10, textAlign: 'center' }}>
          Your pick is your honest answer. Only the percentage is scored: up to {PER} points a question, one point lost for each point you miss by.
        </div>
      </div>
    );
  }

  // Shared rules body — rendered in both the how-to-play modal and the start gate.
  const rulesBody = (
    <DailyRules
      accent={COLORS.accent} accentSoft={COLORS.accentSoft}
      lead="The poll is everyone playing today."
      banner="Five A or B questions. Pick yours, then guess how everyone split."
      steps={[
        <><b>Pick your own answer.</b> Cheez-Its or Goldfish? Be honest: your pick is not scored, it is your vote in today&rsquo;s poll.</>,
        <><b>Drag the slider</b> to the percentage of today&rsquo;s players you think picked each side.</>,
        <><b>Each question is worth 20 points.</b> You lose one point for every percentage point your guess misses the real split by, so the day is out of 100.</>,
      ]}
      knack="A close call scores as well as a landslide. What matters is how big you think the gap is."
      note={<><b>Nothing is final.</b> Every new player moves the splits, so your points and rank move all day. Your own vote is left out of the split you are scored on.</>}
      footer="Ties on the board go to the smaller total miss, then to the earliest player."
    />
  );

  return (
    <div className={STAGE ? 'stage-page' : (LOFT ? 'loft-page' : undefined)}
      data-stage-theme={STAGE ? (EMBED ? (EMBED.theme || 'dark') : stageTheme) : undefined}
      data-stage-pin={STAGE && EMBED ? '' : undefined}
      style={{ ...(STAGE ? STAGE_ACC : null), minHeight: '100vh', position: 'relative', background: STAGE ? 'var(--stg-ground)' : T.surface, color: STAGE ? 'var(--stg-ink,#e9edf4)' : undefined, overflowX: (STAGE || LOFT) ? 'hidden' : undefined }}>
      {stageOn && (
        <PlayStage bg={gameColor('poll')} label="Poll" wide
          eyebrow={`Poll · ${PROMPTS.length} questions, a pick and a percentage on each`}
          top={<div className="pl-st" style={{ width: '100%', textAlign: 'left' }}><style dangerouslySetInnerHTML={{ __html: PL_ST_CSS }} />{started ? renderStepper() : PROMPTS.map((_, i) => renderPrompt(i))}</div>}
          foot={`${answered} of ${PROMPTS.length} finished`}
          clock={elapsed} done={!playing} />
      )}
      {!STAGE && <Grain />}
      {/* Shared daily chrome (app/DailyChrome.jsx): home masthead + stat bar +
          today's slate rail, collapsing to one line once the clock runs. Outside
          the page wrapper so the bands run full bleed; nothing here is pinned. */}
      {!STAGE && (
      <DailyChrome slug="poll" name="Poll" collapsed={started} loft={LOFT} />
      )}
      {LOFT && !EMBED && (
        <Cap gameKey="poll" quizId={PUZZLE.quizId}
          name="Poll"
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
      <div className="pl-wrap" style={{ position: 'relative', zIndex: 2, maxWidth: 1180, margin: '0 auto', padding: '18px 38px 80px', fontFamily: SANS }}>
        <style dangerouslySetInnerHTML={{ __html: `
          @media(max-width:560px){.pl-wrap{padding-left:12px !important;padding-right:12px !important;}}
          .pl-btn{font-family:${SANS};font-weight:800;font-size:14px;border:2px solid ${STAGE ? 'var(--stg-line2)' : 'var(--blue-deep)'};background:${STAGE ? 'transparent' : 'var(--white)'};color:${STAGE ? 'var(--stg-ink)' : 'var(--blue-deep)'};border-radius:8px;padding:9px 16px;cursor:pointer;display:inline-flex;align-items:center;gap:7px;}
          .pl-btn:hover{background:var(--stg-surf2, var(--accent-soft));}
          .pl-opt{font-family:${SANS};font-weight:800;font-size:13.5px;border: 2px solid var(--stg-line, rgba(28,30,36,0.3));background:${STAGE ? 'var(--stg-surf)' : 'var(--white)'};color:${INK};border-radius:9px;padding:9px 14px;cursor:pointer;}
          .pl-opt:hover{border-color:var(--stg-acc-ink, var(--stg-acc, ${COLORS.accent}));}
          .pl-opt-on{background:var(--stg-acc, ${COLORS.accent});border-color:var(--stg-acc-ink, var(--stg-acc, ${COLORS.accent}));color:var(--stg-onramp, var(--white));box-shadow:0 0 0 3px rgba(232,180,58,0.45);}
          .pl-inp{font-family:${MONO};font-weight:500;font-size:22px;letter-spacing:0.06em;width:200px;max-width:100%;border:1px solid ${COLORS.ink};border-radius:9px;padding:8px 12px;background:${STAGE ? 'var(--stg-surf)' : 'var(--white)'};color:${INK};outline:none;}
          .pl-inp:focus{border-color:var(--stg-acc-ink, var(--stg-acc, ${COLORS.accent}));box-shadow:0 0 0 3px color-mix(in srgb, var(--stg-acc-ink, var(--stg-acc, ${COLORS.accent})) 14%, transparent);}
          .pl-face{font-family:${SANS};font-weight:800;font-size:15px;letter-spacing:0.05em;text-transform:uppercase;border:none;background:var(--stg-acc, ${COLORS.accent});color:var(--stg-onramp, var(--white));border-radius:10px;padding:0 26px;height:56px;cursor:pointer;display:inline-flex;align-items:center;gap:10px;box-shadow:0 3px 0 rgba(20,22,28,0.25);}
          .pl-face:active{transform:translateY(1px);box-shadow:0 2px 0 rgba(20,22,28,0.25);}
          .pl-face:disabled{opacity:.55;cursor:default;}
          .pl-face .pl-gold{color:${COLORS.gold};}
          .pl-step{display:flex;flex-direction:column;}
          .pl-strip{display:grid;gap:8px;}
          .pl-seg{display:flex;flex-direction:column;align-items:stretch;gap:6px;min-height:44px;background:none;border:0;padding:0 0 4px;margin:0;cursor:pointer;text-align:left;font-family:${SANS};min-width:0;}
          .pl-seg-bar{display:block;height:6px;border-radius:3px;}
          .pl-seg-tag{font-family:${MONO};font-size:10px;font-weight:500;letter-spacing:0.12em;text-transform:uppercase;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}
          .pl-seg-ans{font-size:13px;font-weight:800;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;padding-bottom:.16em;margin-bottom:-.16em;}
          .pl-cur{display:flex;flex-direction:column;gap:10px;margin:28px 0 22px;}
          .pl-eyebrow{font-family:${MONO};font-size:12px;font-weight:500;letter-spacing:0.16em;text-transform:uppercase;}
          .pl-q{font-size:30px;font-weight:800;line-height:1.18;letter-spacing:-0.02em;}
          .pl-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:14px;}
          .pl-grid-many{grid-template-columns:repeat(4,minmax(0,1fr));}
          .pl-grid-txt.pl-grid-many{grid-template-columns:repeat(2,minmax(0,1fr));gap:10px;}
          .pl-sw{position:relative;display:flex;flex-direction:column;justify-content:flex-end;align-items:flex-start;height:150px;border-radius:18px;border:2px solid var(--stg-line2, rgba(28,30,36,0.24));padding:16px 18px;box-sizing:border-box;font-family:${SANS};font-weight:800;font-size:20px;cursor:pointer;text-align:left;}
          .pl-grid-many .pl-sw{height:112px;font-size:17px;padding:12px 14px;}
          .pl-sw-on{border:4px solid var(--stg-ink, ${COLORS.ink});box-shadow:0 0 0 3px var(--stg-ground, #fff), 0 0 0 5px var(--stg-ink, ${COLORS.ink});}
          .pl-pick{position:absolute;top:12px;right:12px;font-family:${MONO};font-size:11px;font-weight:500;letter-spacing:0.12em;text-transform:uppercase;background:#0b0f1a;color:#ffffff;border:1.5px solid rgba(255,255,255,0.75);border-radius:6px;padding:4px 8px;}
          .pl-card{position:relative;display:flex;align-items:flex-start;min-height:76px;border-radius:14px;border:2px solid var(--stg-line3, rgba(28,30,36,0.35));background:var(--stg-surf2, #fff);color:${INK};padding:30px 16px 14px;box-sizing:border-box;font-family:${SANS};font-weight:800;font-size:17px;line-height:1.25;cursor:pointer;text-align:left;}
          .pl-card:hover{border-color:var(--stg-acc-ink, var(--stg-acc, ${COLORS.accent}));}
          .pl-card-on{background:var(--stg-acc, ${COLORS.accent});border-color:var(--stg-acc-ink, var(--stg-acc, ${COLORS.accent}));color:var(--stg-onramp, #fff);}
          .pl-card .pl-pick{top:9px;left:14px;right:auto;border:0;}
          .pl-numwrap{display:flex;flex-direction:column;align-items:flex-start;gap:8px;}
          .pl-big{font-family:${MONO};font-weight:500;font-size:44px;letter-spacing:0.04em;width:280px;max-width:100%;box-sizing:border-box;border:2px solid var(--stg-cell-line, ${COLORS.ink});border-radius:14px;padding:12px 18px;background:var(--stg-cell, #fff);color:${INK};outline:none;}
          .pl-big::placeholder{color:var(--stg-mute, ${COLORS.faded});font-size:22px;letter-spacing:0;}
          .pl-big:focus{border-color:var(--stg-acc-ink, var(--stg-acc, ${COLORS.accent}));box-shadow:0 0 0 3px color-mix(in srgb, var(--stg-acc-ink, var(--stg-acc, ${COLORS.accent})) 22%, transparent);}
          .pl-numhint{font-size:13px;font-weight:700;}
          .pl-sealed{display:flex;align-items:center;gap:14px;background:var(--stg-surf, ${COLORS.accentSoft});border:1px solid var(--stg-line, rgba(28,30,36,0.12));border-radius:14px;padding:14px 16px;margin-top:22px;font-size:14px;font-weight:600;line-height:1.45;}
          .pl-nav{display:flex;align-items:center;justify-content:space-between;gap:10px;margin-top:20px;}
          .pl-back{font-family:${SANS};font-weight:700;font-size:15px;background:transparent;color:${INK};border:1.5px solid var(--stg-line3, rgba(28,30,36,0.4));border-radius:12px;padding:0 20px;min-height:50px;cursor:pointer;}
          .pl-back:disabled{opacity:.4;cursor:default;}
          .pl-go{font-family:${SANS};font-weight:800;font-size:15px;border-radius:12px;padding:0 24px;min-height:50px;cursor:pointer;}
          .pl-go-on{background:var(--stg-acc, ${COLORS.accent});color:var(--stg-onramp, #fff);border:0;}
          .pl-go-off{background:transparent;color:${INK};border:1.5px solid var(--stg-line3, rgba(28,30,36,0.4));}
          .pl-face.pl-go{height:auto;min-height:50px;font-size:14px;}
          @media(max-width:640px){
            .pl-strip{gap:5px;}
            .pl-seg-tag{font-size:8.5px;letter-spacing:0.06em;}
            .pl-seg-ans{display:none;}
            .pl-strip{gap:3px;}
            .pl-cur{margin:20px 0 18px;gap:8px;}
            .pl-eyebrow{font-size:11px;letter-spacing:0.14em;}
            .pl-q{font-size:24px;line-height:1.2;}
            .pl-grid{gap:10px;}
            .pl-grid-many{grid-template-columns:repeat(2,minmax(0,1fr));}
            .pl-sw,.pl-grid-many .pl-sw{height:auto;min-height:112px;font-size:17px;padding:12px 14px;border-radius:16px;}
            .pl-grid:not(.pl-grid-many) .pl-sw{min-height:150px;}
            .pl-pick{font-size:9px;top:10px;right:10px;padding:4px 6px;}
            .pl-card{min-height:70px;font-size:15.5px;padding:28px 12px 12px;}
            .pl-sealed{font-size:13px;padding:12px 14px;}
            .pl-sealed svg{display:none;}
            .pl-back{flex:1;padding:0 10px;}
            .pl-go{flex:2;padding:0 12px;min-height:52px;}
            .pl-face.pl-go{justify-content:center;}
          }
          .pl-part{display:flex;align-items:center;gap:8px;font-family:${SANS};font-size:13px;font-weight:800;margin:0 0 10px;}
          .pl-part b{display:inline-flex;align-items:center;justify-content:center;width:20px;height:20px;border-radius:50%;border:1px solid var(--stg-ink, ${COLORS.ink});font-size:11px;font-weight:800;}
          .pl-split{border:1px solid var(--stg-line3, rgba(28,30,36,0.35));border-radius:14px;background:var(--stg-surf2, #fff);padding:14px 16px 12px;}
          .pl-split-row{display:flex;justify-content:space-between;align-items:flex-end;gap:12px;}
          .pl-side{display:flex;flex-direction:column;gap:2px;min-width:0;max-width:48%;}
          .pl-side-r{align-items:flex-end;text-align:right;}
          .pl-side b{font-size:34px;font-weight:800;line-height:1.1;letter-spacing:-0.02em;font-variant-numeric:tabular-nums;color:${INK};}
          .pl-side span{font-size:14px;font-weight:800;line-height:1.3;color:${INK};overflow:hidden;text-overflow:ellipsis;white-space:nowrap;max-width:100%;padding-bottom:.12em;}
          .pl-split-idle .pl-side b{color:var(--stg-mute, ${COLORS.faded});}
          .pl-range-wrap{display:flex;align-items:center;gap:10px;margin-top:10px;}
          .pl-nudge{flex:0 0 auto;width:40px;height:40px;border-radius:10px;border:1px solid var(--stg-line3, rgba(28,30,36,0.4));background:transparent;color:${INK};font-family:${SANS};font-size:22px;font-weight:700;line-height:1;cursor:pointer;display:inline-flex;align-items:center;justify-content:center;padding:0;}
          .pl-nudge:hover{background:var(--stg-surf, rgba(28,30,36,0.06));}
          .pl-range{-webkit-appearance:none;appearance:none;flex:1 1 auto;min-width:0;height:44px;margin:0;padding:0;background:transparent;cursor:pointer;touch-action:pan-y;--p:50%;}
          .pl-range:focus{outline:none;}
          .pl-range::-webkit-slider-runnable-track{height:16px;border-radius:8px;border:1px solid var(--stg-ink, ${COLORS.ink});background:linear-gradient(to right, var(--stg-acc, ${COLORS.accent}) 0, var(--stg-acc, ${COLORS.accent}) var(--p), var(--stg-surf, #e8ebf0) var(--p), var(--stg-surf, #e8ebf0) 100%);}
          .pl-range::-moz-range-track{height:14px;border-radius:8px;border:1px solid var(--stg-ink, ${COLORS.ink});background:linear-gradient(to right, var(--stg-acc, ${COLORS.accent}) 0, var(--stg-acc, ${COLORS.accent}) var(--p), var(--stg-surf, #e8ebf0) var(--p), var(--stg-surf, #e8ebf0) 100%);}
          .pl-range::-webkit-slider-thumb{-webkit-appearance:none;appearance:none;width:32px;height:32px;border-radius:50%;margin-top:-9px;background:var(--stg-ground, #fff);border:2px solid var(--stg-ink, ${COLORS.ink});box-shadow:0 1px 4px rgba(20,22,28,0.3);}
          .pl-range::-moz-range-thumb{width:28px;height:28px;border-radius:50%;background:var(--stg-ground, #fff);border:2px solid var(--stg-ink, ${COLORS.ink});box-shadow:0 1px 4px rgba(20,22,28,0.3);}
          .pl-range:focus-visible::-webkit-slider-thumb{box-shadow:0 0 0 4px color-mix(in srgb, var(--stg-acc, ${COLORS.accent}) 45%, transparent);}
          .pl-range:focus-visible::-moz-range-thumb{box-shadow:0 0 0 4px color-mix(in srgb, var(--stg-acc, ${COLORS.accent}) 45%, transparent);}
          .pl-split-idle .pl-range::-webkit-slider-runnable-track{background:var(--stg-surf, #e8ebf0);}
          .pl-split-idle .pl-range::-moz-range-track{background:var(--stg-surf, #e8ebf0);}
          .pl-split-hint{font-size:12px;font-weight:700;text-align:center;margin-top:4px;}
          .pl-bar{position:relative;height:18px;border-radius:9px;border:1px solid var(--stg-ink, ${COLORS.ink});background:var(--stg-surf, #e8ebf0);}
          .pl-bar-a{height:100%;border-radius:8px 0 0 8px;background:var(--stg-acc, ${COLORS.accent});animation:pl-grow .9s cubic-bezier(.2,.8,.2,1) both;}
          @keyframes pl-grow{from{width:50%;}}
          .pl-bar-you{position:absolute;top:-4px;bottom:-4px;width:0;border-left:3px solid var(--stg-ink, ${COLORS.ink});transform:translateX(-1.5px);}
          .pl-bar-you span{position:absolute;top:calc(100% + 2px);left:50%;transform:translateX(-50%);white-space:nowrap;font-family:${SANS};font-size:10.5px;font-weight:800;color:${INK};}
          @media(prefers-reduced-motion:reduce){.pl-bar-a{animation:none;}}
          @media(max-width:640px){.pl-side b{font-size:28px;}.pl-side span{font-size:13px;}.pl-split{padding:12px 12px 10px;}.pl-nudge{width:38px;height:44px;}}
          @media(max-width:560px){.pl-ttl{flex-direction:column;align-items:flex-start;gap:1px;}.pl-ttl h1{font-size:21px;letter-spacing:0.02em;}.pl-ttl .pl-ttl-dt{font-size:15px;}.pl-ttl-dot{display:none;}}
        ` }} />

        <div style={{ maxWidth: 640, margin: '0 auto' }}>


        {/* masthead: pressed OUTWIT tiles with No./date inline */}
        {!LOFT && (
        <DailyMasthead
          slug="poll"
          num={PUZZLE.num}
          dateLabel={PUZZLE.dateLabel}
          accent={COLORS.accent}
          blockGap={4}
          helpTop={13}
          marginBottom={16}
          onHelp={() => setShowHelp(true)}
          sunday={PUZZLE.sunday && <span style={{ fontFamily: MONO, fontSize: 9.5, letterSpacing: '0.1em', textTransform: 'uppercase', fontWeight: 500, color: `var(--stg-onramp, ${T.white})`, background: `var(--stg-acc, ${COLORS.accent})`, borderRadius: 4, padding: '2px 6px' }}>Sunday Edition &middot; Six prompts</span>}
          blocks={'POLL'.split('').map((ch, i) => (
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
            <div style={{ fontSize: 20, fontWeight: 800, color: INK, marginBottom: 10 }}>{gateRules ? 'How to play' : null}</div>
            {gateRules ? rulesBody : (
              <div style={{ fontSize: 14, lineHeight: 1.55, color: INK, fontWeight: 600 }}>
                <p style={{ margin: '0 0 6px' }}>Five A or B questions. Pick yours, then guess the percentage of today&rsquo;s players on each side.</p>
              </div>
            )}
            <div style={{ marginTop: 18, display: 'flex', flexDirection: 'row-reverse', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
              <button className="pl-btn" onClick={startGame} style={{ borderColor: STAGE ? STAGE_C_INK : undefined, background: STAGE ? STAGE_C : T.cta, color: STAGE ? 'var(--stg-onramp, #08222e)' : T.white, fontSize: 15, padding: '11px 22px' }}>Start</button>
              <div>
                <button type="button" onClick={() => setGateRules((v) => !v)} style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', fontFamily: SANS, fontSize: 13, fontWeight: 700, color: FADED, textDecoration: 'underline' }}>
                  {gateRules ? 'Back' : 'How to play'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* the five questions */}
        {!preStart && !stageOn && (
        <div className={STAGE ? 'stg-board' : undefined} style={{ background: `var(--stg-surf, ${COLORS.accentSoft})`, border: `2px solid var(--stg-line, ${COLORS.ink})`, borderRadius: 10, padding: '15px 17px 12px', boxShadow: '5px 5px 0 rgba(28,30,36,0.16)', marginBottom: 12 }}>
          <div style={{ display: LOFT ? 'none' : 'flex', alignItems: 'center', gap: 12, fontFamily: MONO, fontSize: 11.5, letterSpacing: '0.1em', textTransform: 'uppercase', color: FADED, borderBottom: '1px solid rgba(28,30,36,0.18)', paddingBottom: 8, marginBottom: 12, flexWrap: 'wrap' }}>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, whiteSpace: 'nowrap' }}><Users size={12} /> five questions vs. today&rsquo;s room</span>
            <span style={{ marginLeft: 'auto', whiteSpace: 'nowrap' }}>finished <b style={{ color: INK, fontWeight: 500 }}>{answered}</b>/{PROMPTS.length}</span>
          </div>
          {started ? renderStepper() : PROMPTS.map((_, i) => renderPrompt(i))}
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
                    {score >= 85 ? 'You read the room almost exactly.' : sharp ? 'A sharp read of the room.' : score >= 50 ? 'A fair read of the room.' : 'The room surprised you today.'}{' '}{result.lean >= 4 ? `You overrated how many people agree with you by ${result.lean} points.` : result.lean <= -4 ? `You underrated how many people agree with you by ${-result.lean} points.` : 'You judged your own side about right.'}
                    {' '}<span style={{ color: FADED, fontWeight: 600 }}>{result.board && result.board.youRegistered && result.board.you ? <>Live rank #{result.board.you.rank} of {fmtBig(result.board.registered)} &middot; </> : null}A field of {fmtBig(result.realCount != null ? result.realCount : result.poolSize)} &middot; {elapsed}</span>
                  </span>
                </div>
              </div>
              <PollLiveBoard board={result.board} />
              {!STAGE && (<p className={STAGE ? undefined : 'loft-tailnote'} style={{ display: EMBED ? 'none' : undefined, fontSize: 12, color: FADED, fontWeight: 600, margin: '12px 0 0' }}>
                {isTodays ? (
                  <>
                    {countdown ? <>Next Poll in <b style={{ color: INK, fontVariantNumeric: 'tabular-nums' }}>{countdown}</b>.</> : 'A new poll opens at midnight Eastern.'}
                    {prevPuzzle && (
                      <>
                        {' '}Meanwhile:{' '}
                        <a href={`/poll?p=${prevPuzzle.num}`} style={{ color: `var(--stg-ink, ${COLORS.ember})`, fontWeight: 800, textDecoration: 'underline' }}>
                          play yesterday&rsquo;s Poll &rarr;
                        </a>
                      </>
                    )}
                  </>
                ) : (
                  <>
                    You&rsquo;re playing the {PUZZLE.dateLabel.replace(', 2026', '')} archive.{' '}
                    <a href="/poll" style={{ color: `var(--stg-ink, ${COLORS.ember})`, fontWeight: 800, textDecoration: 'underline' }}>Back to today&rsquo;s Poll &rarr;</a>
                    {' · '}
                    <a href="/archive" style={{ color: FADED, fontWeight: 700, textDecoration: 'underline' }}>Puzzle archive</a>
                  </>
                )}
              </p>)}
            </>
          )}
          </div>
          {LOFT && !playing && revealed && (
            <button className={STAGE ? 'stf-hideboard' : 'loft-showopts'} onClick={() => setRevealed(false)}>&#8630; Hide game board</button>
          )}
          </div>
          {LOFT && !playing && !EMBED && (
            <LoftFinish
              name="Poll"
              catRank={catRank}
              outcome={score > 0 ? 'won' : 'lost'}
              challengeMetric={result ? score : null}
              title={endGrade(score, TOTAL)}
              detail={`${`${score}/${TOTAL}`} \u00b7 ${elapsed}`}
              iq={iq}
              board={dailyBoard}
              gameRank={allTime && allTime.ready
                ? { value: allTime.rank != null ? `#${Number(allTime.rank).toLocaleString()}` : '\u2014',
                    label: allTime.field != null ? `of ${Number(allTime.field).toLocaleString()} Poll all time` : 'all-time rank' }
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
                  href: `/poll?p=${p.num}`,
                  done: !!(stats && stats.rec && stats.rec[p.num]),
                  score: (stats && stats.rec && stats.rec[p.num]) ? stats.rec[p.num].s : null,
                }))}
              options={[
                { label: copied ? 'Copied' : (shareCta || 'Share'), sub: 'Your result, no spoilers', kind: 'gold', onClick: copyShare },
                { tone: (score > 0) ? 'board' : 'reveal', label: (score > 0) ? 'Return to board' : 'Reveal the splits',
                  sub: (score > 0) ? 'Your finished board' : 'Show how the room split', onClick: () => setRevealed(true) },
              prevPuzzle && { tone: 'another', label: 'Play another Poll', sub: `No. ${prevPuzzle.num}, yesterday\u2019s puzzle`, href: `/poll?p=${prevPuzzle.num}` },
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
        {!STAGE && <GamePanel self="poll" name="Poll" onShow={() => setShowChrome(true)} />}
        <div style={{ display: (EMBED || (focusMode && !STAGE)) ? 'none' : 'block', margin: '30px auto 0' }}>
          {LOFT && (
            <div className={STAGE ? undefined : 'loft-report'}>
              <ReportIssue self="poll" name="Poll" accent="#ffffff" align="center" onHelp={() => setShowHelp(true)} />
            </div>
          )}
          {!LOFT && (
          <DailyGamesGrid replay={!playing && result ? resetGame : null}
            self="poll"
            maxWidth={640}
            share={{ label: copied ? 'Copied' : 'Share', onClick: copyShare }}
            light
            boardSlot={<DailyBoardPanel self="poll" quizId={PUZZLE.quizId} maxWidth={640} streak={{ current: myStats.cur, best: myStats.max }} />}
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
              <div style={{ fontSize: 17, fontWeight: 800, color: INK, marginBottom: 8 }}>Add Poll to your Home Screen</div>
              {isIosDevice() ? (
                <ol style={{ margin: '0 0 4px', paddingLeft: 20, color: INK, fontSize: 14, lineHeight: 1.7 }}>
                  <li>Tap the <b>Share</b> button in Safari&apos;s toolbar.</li>
                  <li>Scroll down and tap <b>Add to Home Screen</b>.</li>
                  <li>Tap <b>Add</b>. The tile opens today&apos;s poll, every day.</li>
                </ol>
              ) : (
                <p style={{ margin: '0 0 4px', color: INK, fontSize: 14, lineHeight: 1.7 }}>
                  Open your browser&apos;s menu and choose <b>Add to Home Screen</b> (or <b>Install app</b>). The tile opens today&apos;s poll, every day.
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
          self="poll"
          won={sharp}
          completed
          score={<>{score}/{TOTAL}</>}
          onShare={copyShare}
          shareLabel={copied ? 'Copied' : 'Share Result'}
          onReplay={resetGame}
          onClose={() => setEndClosed(true)}
        />
      )}


      {toast && (
        <div style={{ position: 'fixed', left: '50%', bottom: 26, transform: 'translateX(-50%)', background: COLORS.ink, color: T.white, fontFamily: SANS, fontWeight: 800, fontSize: 13.5, padding: '10px 18px', borderRadius: 9, zIndex: 60, boxShadow: '0 6px 18px rgba(20,22,28,0.25)', maxWidth: '86vw', textAlign: 'center' }}>
          {toast}
        </div>
      )}

      {/* help modal */}
      {showHelp && (
        <HelpSheet onClose={() => { setShowHelp(false); try { localStorage.setItem(HELP_KEY, '1'); } catch (e) {} }} self="poll" name="Poll">
            {rulesBody}
          </HelpSheet>
      )}

      {/* The desktop fold: the About prose below starts one screen down (app/StageFold.jsx). */}
      {!EMBED && <StageFold />}
      {/* About Poll — crawlable prose for search, server-rendered into the HTML */}
      <section style={{ display: (EMBED || (focusMode && !STAGE)) ? 'none' : 'block', position: 'relative', zIndex: 2, maxWidth: 640, margin: '0 auto', padding: '10px 24px 42px', fontFamily: SANS }}>
        <h2 style={{ margin: '0 0 8px', fontSize: 15, fontWeight: 800, letterSpacing: '-0.01em', color: INK }}>About Poll</h2>
        <p style={{ margin: '0 0 8px', fontSize: 13, lineHeight: 1.65, color: FADED, fontWeight: 600 }}>
          Poll is a free daily crowd game from Mind Loft. Every day brings five quick A or B questions across a wide range of topics: Cheez-Its or Goldfish, window or aisle, dark mode or light mode, fly or be invisible. First you give your own honest pick. Then you drag a slider to the percentage of today&rsquo;s players you think landed on each side.
        </p>
        <p style={{ margin: '0 0 8px', fontSize: 13, lineHeight: 1.65, color: FADED, fontWeight: 600 }}>
          Only the percentage is scored. Each question is worth 20 points and you lose one for every percentage point your guess misses the real split by, so the day is out of 100. A near tie is as playable as a landslide, because the skill is judging the size of the gap. There is no answer key: the answer is the crowd, and it keeps moving. Your own vote is left out of the split you are scored on, every new player re-scores the whole field, and a house crowd seeds the first hours until ten real players are in. The ending also tells you whether you tend to overrate how many people agree with you.
        </p>
        <p style={{ margin: 0, fontSize: 13, lineHeight: 1.65, color: FADED, fontWeight: 600 }}>
          A new poll opens every day at midnight Eastern. No app, no signup. More crowd games: <a href="/herd" style={{ color: INK, fontWeight: 800 }}>Herd</a>, <a href="/outwit" style={{ color: INK, fontWeight: 800 }}>Outwit</a>, <a href="/outrank" style={{ color: INK, fontWeight: 800 }}>Outrank</a> and <a href="/feud" style={{ color: INK, fontWeight: 800 }}>Feud</a>.
        </p>
      </section>

      {!STAGE && <div style={{ display: focusMode ? 'none' : 'block', position: 'relative', zIndex: 2 }}><Footer /></div>}
    </div>
  );
}
