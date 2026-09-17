'use client';

// Stet — the daily copy-desk puzzle.
//
// One news brief a day: five sentences (seven on Sundays). Most sentences hide
// exactly one wrong word — a real word (an eggcorn, a homophone, a malaprop, a
// grammar slip), so a spellchecker sails past it. But not all: some sentences
// are CLEAN, and the player earns their points by stamping them "stet" (the
// proofreader's mark for "let it stand"). Sundays are tougher, and a Sunday
// sentence can hide TWO errors — so Sundays let you flag up to two words
// before locking a sentence in.
//
// Scoring: each error is worth 2 (1 for flagging the right word, 1 for typing
// the right fix); a clean sentence is worth 2 for a correct stet. The day's
// total is the sum (a plain weekday is 10). Ties on the daily board break by
// fewest mis-flags (wrongly flagged words + wrongly stetted sentences), then
// fastest time.
//
// Same daily plumbing as Circa/Suds/Tally: banked briefs gated by Eastern date
// on the server (app/stet/page.js), per-puzzle localStorage saves, /stet?p=N
// archive pinning, streaks + stats, and the shared /api/quiz/* board flow.

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useSearchParams } from 'next/navigation';
import { HelpCircle, X, Smartphone, Pencil, Stamp } from 'lucide-react';
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
import { acceptsAnswer } from '@/lib/dialect-variants';
import { meRequest } from '@/app/quizMeClient';

const COLORS = {
  cream: T.surface,
  paper: T.paper,
  ink: T.ink,
  ember: T.accent,
  rust: T.danger,
  faded: T.muted,
  accent: '#0369a1',       // Stet identity — the copy editor's blue pencil
  accentSoft: '#e8f3fa',
  green: T.successDeep,
  greenSoft: '#eefaf1',
};
const SANS = "'Manrope', system-ui, -apple-system, sans-serif";
const MONO = "'DM Mono', ui-monospace, 'SFMono-Regular', monospace";
const PAPER = '#fbf9f4';
const HELP_KEY = 'sot_stet_help_seen';
const STATS_KEY = 'sot_stet_stats';

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

// strip a token down to its comparable word form (keeps inner hyphens/apostrophes)
const stripTok = (w) => (w || '').toLowerCase().replace(/^[^a-z0-9'’-]+|[^a-z0-9'’-]+$/g, '');
// normalize a typed fix for comparison (also fold curly apostrophes)
const normFix = (w) => stripTok(String(w || '').trim()).replace(/’/g, "'");

// per-sentence point value: 2 per error; a clean sentence is worth 2 for the stet
const itemValue = (it) => (it.errors.length ? it.errors.length * 2 : 2);

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
  const perfect = nums.filter((n) => rec[n].won).length;
  let max = 0, run = 0, prev = null;
  for (const n of nums) {
    run = prev != null && n === prev + 1 ? run + 1 : 1;
    if (run > max) max = run;
    prev = n;
  }
  let cur = 0, at = rec[todayNum] ? todayNum : todayNum - 1;
  while (rec[at]) { cur++; at--; }
  return { played, perfect, cur, max };
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
    rec[p.num] = { s: sc, t: 10, g: null, won: !!m.perfect };
  }
  if (!changed) return s;
  const s2 = { ...s, rec };
  try { localStorage.setItem(STATS_KEY, JSON.stringify(s2)); } catch (e) {}
  return s2;
}

function freshState() {
  return {
    v: 2,
    sub: {},                    // itemIdx -> { staged: [{tok, fix}], stet: bool }
    status: 'playing',          // playing | done
    t0: null,
    tEnd: null,
  };
}

export default function StetClient({ puzzles = [], forceNum = null }) {
  const PUZZLE = useMemo(() => pickPuzzle(puzzles, forceNum), [puzzles, forceNum]);
  const ITEMS = PUZZLE.items;
  const TOTAL = ITEMS.reduce((s, it) => s + itemValue(it), 0);
  const MAX_FLAGS = PUZZLE.sunday ? 2 : 1;
  const STORE_KEY = `sot_stet_${PUZZLE.num}`;

  const [g, setG] = useState(freshState);
  const [sel, setSel] = useState(null);        // { item, tok } — the armed pick (pre-stage)
  const [fixVal, setFixVal] = useState('');
  const [pending, setPending] = useState({});  // itemIdx -> [{tok, fix}] staged (Sunday flow)
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
  const fixRef = useRef(null);

  const [showChrome, setShowChrome] = useState(false);
  const playing = g.status === 'playing';
  const LOFT = isLoft('stet');
  const STAGE = isStage('stet', searchParams);
  const STAGE_C = STAGE ? 'var(--stg-acc)' : gameColor('stet');
  const Cap = STAGE ? StageChrome : LoftCap;
  const STAGE_ACC = { '--stg-acc-dk': gameColor('stet'), '--stg-acc-lt': gameColorLight('stet'), '--stg-onramp-lt': gameOnrampLight('stet'), '--stg-acc-ink-lt': gameAccentInkLight('stet') };
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
  const preStart = playing && !g.t0;
  const started = playing && !!g.t0;
  const focusMode = playing && !showChrome;
  const solvedCount = Object.keys(g.sub).length;

  // tokenized sentences: [{ raw, isWord }] — whitespace kept as its own parts
  const TOKS = useMemo(
    () => ITEMS.map((it) => it.text.split(/(\s+)/).filter((s) => s.length > 0).map((raw) => ({ raw, isWord: !/^\s+$/.test(raw) && stripTok(raw).length > 0 }))),
    [ITEMS]
  );
  // per item: each error's true token index (parallel to it.errors)
  const WRONG_TOKS = useMemo(
    () => ITEMS.map((it, i) => it.errors.map((e) => TOKS[i].findIndex((t) => t.isWord && stripTok(t.raw) === e.wrong.toLowerCase()))),
    [ITEMS, TOKS]
  );

  // Score one finalized sentence from its sub. Pure — recomputed at render.
  function scoreItem(i, sub) {
    const it = ITEMS[i];
    const staged = (sub && sub.staged) || [];
    let pts = 0, misses = 0;
    const errTok = WRONG_TOKS[i];
    for (let e = 0; e < it.errors.length; e++) {
      const s = staged.find((x) => x.tok === errTok[e]);
      if (s) {
        pts += 1;
        const accepted = [it.errors[e].fix, ...(it.errors[e].alts || [])].map(normFix);
        if (acceptsAnswer(accepted, normFix(s.fix))) pts += 1;
      }
    }
    for (const s of staged) { if (!errTok.includes(s.tok)) misses += 1; }
    if (!it.errors.length && sub && sub.stet && staged.length === 0) pts = 2;
    if (sub && sub.stet && it.errors.length) misses += 1;
    return { pts, misses, value: itemValue(it) };
  }

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

  // ---- persistence (v2 saves only; v1 pre-launch saves are discarded) ----
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORE_KEY);
      if (raw) {
        const saved = JSON.parse(raw);
        if (saved && saved.v === 2 && saved.sub) {
          setG({ ...freshState(), ...saved });
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
        (function(){ var _dn = g.status !== 'playing'; if (_dn || g.t0) localStorage.setItem('sot_stet_day', JSON.stringify({ d: etToday(), done: _dn })); else localStorage.removeItem('sot_stet_day'); })();
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
  const iq = useIqStanding({ game: 'stet', quizId: PUZZLE.quizId, active: LOFT && !playing });
  const nextUp = useNextUnplayed({ self: 'stet', active: LOFT && !playing });
  const upNext = useUnplayedSimilar({ self: 'stet', active: LOFT && !playing });
  const dailyBoard = useDailyBoard({ quizId: PUZZLE.quizId, active: LOFT && !playing });
  const allTime = useGameAllTime({ game: 'stet', active: LOFT && !playing });
  const dayStats = useDayStats();
  const catRank = useCategoryRank({ self: 'stet', active: LOFT && !playing });
  const prevPuzzle = puzzles.find((x) => x.num === PUZZLE.num - 1) || null;
  const myStats = deriveStats(stats, pickPuzzle(puzzles, null).num);

  const results = ITEMS.map((_, i) => (g.sub[i] ? scoreItem(i, g.sub[i]) : null));
  const score = results.reduce((s, r) => s + (r ? r.pts : 0), 0);
  const misses = results.reduce((s, r) => s + (r ? r.misses : 0), 0);
  const perfect = g.status === 'done' && score === TOTAL;

  const REC_KEY = `sot_stet_rec_${PUZZLE.num}`;
  const abandon = useAbandonFlush(() => {
    const acted = Object.keys(g.sub).length > 0 || Object.keys(pending).length > 0 || !!sel;
    if (!acted || g.status !== 'playing') return null;
    try { if (localStorage.getItem(REC_KEY)) return null; } catch (e) {}
    const el = Math.min(36000, Math.max(1, Math.round((Date.now() - (g.t0 || Date.now())) / 1000)));
    try { localStorage.setItem(REC_KEY, '1'); } catch (e) {}
    return { quizId: PUZZLE.quizId, score: 0, total: TOTAL, correct: 0, guessesUsed: 0, timeElapsed: el, abandoned: true, email: identity?.email || undefined, anonId: getAnonId(), isMobile: isMobileDevice(), referrer: (typeof document !== 'undefined' ? document.referrer : '') };
  });

  function postResult(g2, sc, ms) {
    abandon.markFlushed();
    const el = g2.t0 ? Math.max(1, Math.round(((g2.tEnd || Date.now()) - g2.t0) / 1000)) : 1;
    try { setStats(recordStat(PUZZLE.num, { s: sc, t: TOTAL, g: ms, won: sc === TOTAL })); } catch (e) {}
    try {
      fetch('/api/quiz/result', {
        method: 'POST',
        keepalive: true,
        headers: { 'Content-Type': 'application/json' },
        // guessesUsed = mis-flags (wrongly flagged words + wrongly stetted
        // sentences), so the daily board's ties break by sharper eyes.
        body: JSON.stringify({ quizId: PUZZLE.quizId, score: sc, total: TOTAL, correct: sc === TOTAL ? 1 : 0, guessesUsed: ms, timeElapsed: el, email: identity?.email || undefined, anonId: getAnonId(), isMobile: isMobileDevice(), referrer: (typeof document !== 'undefined' ? document.referrer : '') }),
      })
        .then((r) => r.json())
        .then((d) => { if (d && !d.error) setBoard({ ...EMPTY_BOARD, ...d }); })
        .catch(() => {});
    } catch (e) {}
  }

  function startClock() {
    setG((cur) => (cur.t0 ? cur : { ...cur, t0: Date.now() }));
  }

  function tapWord(itemIdx, tokIdx) {
    if (!playing || g.sub[itemIdx]) return;
    const staged = pending[itemIdx] || [];
    if (staged.some((s) => s.tok === tokIdx)) { say('Already flagged — remove it below to change the fix.'); return; }
    if (staged.length >= MAX_FLAGS) { say(`You can flag up to ${MAX_FLAGS} word${MAX_FLAGS > 1 ? 's' : ''} here. Remove one first.`); return; }
    startClock();
    if (sel && sel.item === itemIdx && sel.tok === tokIdx) { setSel(null); setFixVal(''); return; }
    setSel({ item: itemIdx, tok: tokIdx });
    setFixVal('');
    setTimeout(() => { try { fixRef.current && fixRef.current.focus(); } catch (e) {} }, 30);
  }

  function finalizeItem(i, staged, stet) {
    const sub = { staged, stet };
    const nextSub = { ...g.sub, [i]: sub };
    const g2 = { ...g, sub: nextSub };
    if (!g2.t0) g2.t0 = Date.now();
    const done = Object.keys(nextSub).length >= ITEMS.length;
    if (done) {
      g2.status = 'done';
      g2.tEnd = Date.now();
      let sc = 0, ms = 0;
      ITEMS.forEach((_, k) => { const r = scoreItem(k, nextSub[k]); sc += r.pts; ms += r.misses; });
      postResult(g2, sc, ms);
    }
    setG(g2);
    setSel(null);
    setFixVal('');
    setPending((cur) => { const c = { ...cur }; delete c[i]; return c; });
  }

  function submitFix() {
    if (!playing || !sel) return;
    const fixTyped = normFix(fixVal);
    if (!fixTyped) { say('Type the replacement word first.'); return; }
    const i = sel.item;
    const entry = { tok: sel.tok, fix: fixVal.trim() };
    const staged = [...(pending[i] || []), entry];
    if (MAX_FLAGS === 1) {
      finalizeItem(i, staged, false);
      return;
    }
    // Sunday: stage it; the sentence locks on "Lock it in"
    setPending((cur) => ({ ...cur, [i]: staged }));
    setSel(null);
    setFixVal('');
  }

  function unstage(i, tok) {
    setPending((cur) => ({ ...cur, [i]: (cur[i] || []).filter((s) => s.tok !== tok) }));
  }

  function stetItem(i) {
    if (!playing || g.sub[i]) return;
    if ((pending[i] || []).length) { say('You have a flag staged — remove it first to stet the sentence.'); return; }
    startClock();
    finalizeItem(i, [], true);
  }

  function startGame() {
    setG((cur) => (cur.t0 ? cur : { ...cur, t0: Date.now() }));
    try { localStorage.setItem(HELP_KEY, '1'); } catch (e) {}
  }

  function resetGame() {
    try { localStorage.removeItem(STORE_KEY); } catch (e) {}
    setG(freshState()); setSel(null); setFixVal(''); setPending({}); setEndClosed(false);
  }

  function shareText() {
    const squares = ITEMS.map((it, i) => {
      const r = results[i];
      if (!r) return '⬜';
      return r.pts === r.value ? '\u{1F7E6}' : r.pts > 0 ? '\u{1F7E8}' : '⬜';
    }).join('');
    const streakBit = isTodays && myStats.cur >= 2 ? ` · streak ${myStats.cur}` : '';
    const head2 = `Stet #${PUZZLE.num} · ${score}/${TOTAL}${perfect ? ' · clean desk' : ''}${streakBit}`;
    return `${head2}\n${squares}\n${shareUrl()}`;
  }
  function shareUrl() {
    return withRef(`mindloftdaily.com/stet${isTodays ? '' : `?p=${PUZZLE.num}`}`);
  }
  function copyShare() {
    const text = playing
      ? `Stet #${PUZZLE.num} — the daily copy-desk puzzle from Mind Loft.\n${shareUrl()}`
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

  // Plain render helper (NOT a nested component — a nested component's identity
  // would change every render and remount the fix input on each keystroke).
  function renderSentence(i) {
    const it = ITEMS[i];
    const sub = g.sub[i] || null;
    const staged = pending[i] || [];
    const armed = sel && sel.item === i ? sel.tok : null;
    const r = sub ? scoreItem(i, sub) : null;
    const errTok = WRONG_TOKS[i];
    const borderCol = r
      ? (r.pts === r.value ? 'rgba(21,128,61,0.5)' : r.pts > 0 ? 'rgba(202,138,4,0.5)' : 'rgba(192,57,43,0.5)')
      : 'rgba(28,30,36,0.2)';
    return (
      <div key={i} style={{ background: STAGE ? SURF : T.white, border: `1.5px solid ${borderCol}`, borderRadius: 10, padding: '12px 14px', marginBottom: 9 }}>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
          <span style={{ fontFamily: MONO, fontSize: 11, color: FADED, flex: '0 0 auto' }}>{i + 1}</span>
          <p style={{ margin: 0, fontFamily: SANS, fontSize: 16.5, fontWeight: 600, lineHeight: 1.65, color: INK }}>
            {TOKS[i].map((t, j) => {
              if (!t.isWord) return <span key={j}>{t.raw}</span>;
              if (!sub) {
                const isArmed = armed === j;
                const isStaged = staged.some((s) => s.tok === j);
                return (
                  <span
                    key={j}
                    role="button"
                    tabIndex={0}
                    onClick={() => tapWord(i, j)}
                    onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); tapWord(i, j); } }}
                    className={`st-w${isArmed ? ' st-w-on' : ''}${isStaged ? ' st-w-staged' : ''}`}
                  >{t.raw}</span>
                );
              }
              // scored render: strike each TRUE wrong word, insert its fix after it
              const eIdx = errTok.indexOf(j);
              if (eIdx >= 0) {
                const e = it.errors[eIdx];
                const found = (sub.staged || []).some((s) => s.tok === j);
                const trail = t.raw.slice(t.raw.toLowerCase().indexOf(e.wrong.toLowerCase()) + e.wrong.length);
                return (
                  <span key={j}>
                    <s style={{ color: found ? `var(--stg-acc-ink, ${COLORS.accent})` : `var(--stg-bad, ${COLORS.rust})`, textDecorationThickness: 2 }}>{e.wrong}</s>
                    {' '}<b style={{ color: `var(--stg-ink, ${COLORS.green})` }}>{e.fix}</b>{trail}
                  </span>
                );
              }
              const wasFlag = (sub.staged || []).some((s) => s.tok === j);
              return <span key={j} style={wasFlag ? { background: STAGE ? 'var(--stg-surf2)' : '#fdeeee', borderRadius: 3, boxShadow: '0 0 0 2px #fdeeee' } : undefined}>{t.raw}</span>;
            })}
            {sub && !it.errors.length && sub.stet && (
              <span style={{ marginLeft: 7, fontFamily: MONO, fontSize: 10.5, letterSpacing: '0.08em', color: `var(--stg-ink, ${COLORS.green})`, border: '1px solid rgba(21,128,61,0.45)', borderRadius: 4, padding: '1px 6px', whiteSpace: 'nowrap' }}>STET ✓</span>
            )}
          </p>
          {r && (
            <span style={{ marginLeft: 'auto', flex: '0 0 auto', fontFamily: MONO, fontSize: 11, fontWeight: 500, color: r.pts === r.value ? COLORS.green : r.pts > 0 ? T.goldInk : `var(--stg-bad, ${COLORS.rust})` }}>
              +{r.pts}
            </span>
          )}
        </div>

        {/* staged flags (Sunday flow) */}
        {!sub && staged.length > 0 && (
          <div style={{ marginTop: 8, display: 'flex', alignItems: 'center', gap: 7, flexWrap: 'wrap' }}>
            {staged.map((s) => (
              <span key={s.tok} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontFamily: SANS, fontSize: 12, fontWeight: 700, color: INK, background: `var(--stg-surf, ${COLORS.accentSoft})`, border: `1.5px solid rgba(3,105,161,0.4)`, borderRadius: 7, padding: '3px 8px' }}>
                <s>{stripTok(TOKS[i][s.tok].raw)}</s> → <b style={{ color: ACC_INK }}>{s.fix}</b>
                <button onClick={() => unstage(i, s.tok)} aria-label="Remove this flag" style={{ background: 'none', border: 'none', cursor: 'pointer', color: FADED, padding: 0, display: 'flex' }}><X size={13} /></button>
              </span>
            ))}
            {armed == null && (
              <>
                <button className="st-lock" onClick={() => finalizeItem(i, staged, false)}>Lock it in</button>
                {staged.length < MAX_FLAGS && (
                  <span style={{ fontFamily: SANS, fontSize: 11.5, fontWeight: 600, color: FADED }}>…or tap another word if you smell a second error.</span>
                )}
              </>
            )}
          </div>
        )}

        {!sub && armed != null && (
          <div style={{ marginTop: 9, paddingTop: 9, borderTop: '1px dashed rgba(28,30,36,0.16)' }}>
            <div style={{ fontFamily: SANS, fontSize: 12, fontWeight: 700, color: FADED, marginBottom: 6 }}>
              Replace <b style={{ color: ACC_INK }}>&ldquo;{stripTok(TOKS[i][armed].raw)}&rdquo;</b> with:
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <input
                ref={fixRef}
                className="st-inp"
                type="text"
                autoCapitalize="off"
                autoCorrect="off"
                spellCheck={false}
                value={fixVal}
                onChange={(e) => setFixVal(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') submitFix(); }}
                placeholder="the correct word"
                aria-label="Your correction"
              />
              <button className="st-go" onClick={submitFix}>{MAX_FLAGS === 1 ? 'Fix it' : 'Flag it'}</button>
            </div>
            <div style={{ fontFamily: SANS, fontSize: 11, fontWeight: 600, color: FADED, marginTop: 6 }}>
              {MAX_FLAGS === 1
                ? 'Tap a different word to change your pick — submitting locks this sentence.'
                : 'Sunday desk: you can flag up to two words before locking the sentence.'}
            </div>
          </div>
        )}

        {/* stet control — only while open with nothing staged/armed */}
        {!sub && armed == null && staged.length === 0 && (
          <div style={{ marginTop: 8 }}>
            <button className="st-stet" onClick={() => stetItem(i)} title="Mark this sentence as clean — no errors">
              <Stamp size={13} strokeWidth={2.4} /> Stet — it&rsquo;s clean
            </button>
          </div>
        )}

        {sub && (
          <div style={{ marginTop: 8, paddingTop: 8, borderTop: '1px dashed rgba(28,30,36,0.14)', fontFamily: SANS, fontSize: 12.5, fontWeight: 600, color: FADED, lineHeight: 1.5 }}>
            {it.errors.length === 0 ? (
              <>
                {sub.stet
                  ? null
                  : <>Nothing was wrong here{(sub.staged || []).length && TOKS[i][sub.staged[0].tok] ? <> &mdash; you flagged &ldquo;{stripTok(TOKS[i][sub.staged[0].tok].raw)}&rdquo;</> : null}. </>}
                {it.cleanNote}
              </>
            ) : (
              <>
                {sub.stet && <>You let it stand, but the desk didn&rsquo;t. </>}
                {it.errors.map((e, k) => {
                  const s = (sub.staged || []).find((x) => x.tok === errTok[k]);
                  const accepted = [e.fix, ...(e.alts || [])].map(normFix);
                  const ok = acceptsAnswer(accepted, normFix(s ? s.fix : ''));
                  return (
                    <span key={k}>
                      {!s && !sub.stet && <>Missed: <b style={{ color: INK }}>{e.wrong}</b> &rarr; {e.fix}. </>}
                      {s && !ok && <>Right word, but the fix is <b style={{ color: INK }}>{e.fix}</b>, not &ldquo;{s.fix}&rdquo;. </>}
                      {e.note}{' '}
                    </span>
                  );
                })}
              </>
            )}
          </div>
        )}
      </div>
    );
  }

  // Shared rules body — rendered in both the how-to-play modal and the start gate.
  const rulesBody = (
    <DailyRules
      accent={COLORS.accent} accentSoft={COLORS.accentSoft}
      lead={<>You&rsquo;re the copy desk. Most sentences in today&rsquo;s brief hide <b>one slip</b>, but some are clean.</>}
      chips={[
        { label: 'Right word flagged = 1', tone: 'good' },
        { label: 'Right fix typed = 1', tone: 'good' },
        { label: 'Correct Stet = 2', tone: 'good' },
        { label: 'Flag in clean copy = 0', tone: 'bad' },
      ]}
      steps={[
        <>The slip is always a <b>real word</b>, so spellcheck is no help: think &ldquo;free reign&rdquo;, &ldquo;should of&rdquo;, &ldquo;a mute point&rdquo;. Word choice <i>and</i> grammar are fair game.</>,
        <><b>Flag</b> the wrong word, then type the right fix.</>,
        <>If nothing&rsquo;s wrong, stamp it <b>Stet</b>, the proofreader&rsquo;s mark for &ldquo;let it stand&rdquo;, and take the points.</>,
        <>{PUZZLE.sunday ? <><b>Sunday Edition:</b> a sentence can hide <b>two</b> errors, so flag up to two words, then lock it in.</> : <>On Sundays the brief runs seven sentences and can hide two errors in one sentence.</>}</>,
      ]}
      knack="Read for sense, not for spelling. The trap is always a word that is spelled perfectly and simply the wrong one."
      footer="Ties on the daily board break by fewest mis-flags, then fastest time."
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
      <DailyChrome slug="stet" name="Stet" collapsed={started} loft={LOFT} />
      )}
      {LOFT && (
        <Cap gameKey="stet" quizId={PUZZLE.quizId}
          name="Stet"
          cat="Word"
          outcome={playing ? null : (perfect ? 'won' : (score > 0 ? 'part' : 'lost'))}
          num={PUZZLE.num}
          tiles={playing ? null : upNext}
          dateLabel={PUZZLE.dateLabel}
          onHelp={() => setShowHelp(true)}
          sunday={PUZZLE.sunday ? 'Sunday Edition' : null}
          figures={playing ? [
            { v: `${solvedCount}/${ITEMS.length}`, k: 'filed' },
            { v: elapsed, k: 'time' },
          ] : [
            { v: `${score}/${TOTAL}`, k: 'score' },
            { v: `${solvedCount}/${ITEMS.length}`, k: 'filed' },
            { v: elapsed, k: 'time' },
          ]}
        />
      )}
      <div className="st-wrap" style={{ position: 'relative', zIndex: 2, maxWidth: 1180, margin: '0 auto', padding: '18px 38px 80px', fontFamily: SANS }}>
        <style dangerouslySetInnerHTML={{ __html: `
          @media(max-width:560px){.st-wrap{padding-left:12px !important;padding-right:12px !important;}}
          .st-btn{font-family:${SANS};font-weight:800;font-size:14px;border:2px solid ${STAGE ? 'var(--stg-line2)' : 'var(--blue-deep)'};background:${STAGE ? 'transparent' : 'var(--white)'};color:${STAGE ? 'var(--stg-ink)' : 'var(--blue-deep)'};border-radius:8px;padding:9px 16px;cursor:pointer;display:inline-flex;align-items:center;gap:7px;}
          .st-btn:hover{background:var(--stg-surf2, var(--accent-soft));}
          .st-w{cursor:pointer;border-radius:4px;padding:0 1px;transition:background .1s;}
          .st-w:hover{background:var(--stg-surf2, ${COLORS.accentSoft});box-shadow:0 0 0 2px var(--stg-surf2, ${COLORS.accentSoft});}
          .st-w-on{background:color-mix(in srgb, var(--stg-acc, ${COLORS.accent}) 16%, transparent);box-shadow:0 0 0 2px var(--stg-acc, ${COLORS.accent});border-radius:4px;}
          .st-w-staged{background:color-mix(in srgb, var(--stg-acc, ${COLORS.accent}) 16%, transparent);box-shadow:0 0 0 2px color-mix(in srgb, var(--stg-acc, ${COLORS.accent}) 35%, transparent);border-radius:4px;text-decoration:line-through;}
          .st-inp{font-family:${SANS};font-weight:700;font-size:16px;flex:1 1 auto;min-width:0;border:2px solid ${COLORS.ink};border-radius:9px;padding:9px 12px;background:${STAGE ? 'var(--stg-surf)' : 'var(--white)'};color:${INK};outline:none;}
          .st-inp:focus{border-color:var(--stg-acc, ${COLORS.accent});box-shadow:0 0 0 3px color-mix(in srgb, var(--stg-acc, ${COLORS.accent}) 16%, transparent);}
          .st-go{font-family:${SANS};font-weight:800;font-size:13.5px;letter-spacing:0.04em;text-transform:uppercase;border:2px solid var(--stg-acc, ${COLORS.accent});background:var(--stg-acc, ${COLORS.accent});color:var(--stg-onramp, var(--white));border-radius:9px;padding:0 18px;cursor:pointer;}
          .st-go:active{transform:translateY(1px);}
          .st-lock{font-family:${SANS};font-weight:800;font-size:12px;letter-spacing:0.04em;text-transform:uppercase;border:2px solid ${COLORS.ink};background:${COLORS.ink};color:var(--white);border-radius:8px;padding:6px 13px;cursor:pointer;}
          .st-stet{font-family:${SANS};font-weight:800;font-size:11.5px;letter-spacing:0.05em;text-transform:uppercase;border:1.5px dashed rgba(28,30,36,0.35);background:none;color:${FADED};border-radius:7px;padding:5px 11px;cursor:pointer;display:inline-flex;align-items:center;gap:6px;}
          .st-stet:hover{border-color:${COLORS.green};color:${COLORS.green};}
          @media(max-width:560px){.st-ttl{flex-direction:column;align-items:flex-start;gap:1px;}.st-ttl h1{font-size:21px;letter-spacing:0.02em;}.st-ttl .st-ttl-dt{font-size:15px;}.st-ttl-dot{display:none;}}
        ` }} />

        <div style={{ maxWidth: 640, margin: '0 auto' }}>


        {/* masthead: pressed STET tiles with No./date inline */}
        {!LOFT && (
        <DailyMasthead
          slug="stet"
          num={PUZZLE.num}
          dateLabel={PUZZLE.dateLabel}
          accent={COLORS.accent}
          blockGap={5}
          helpTop={13}
          marginBottom={16}
          onHelp={() => setShowHelp(true)}
          sunday={PUZZLE.sunday && <span style={{ fontFamily: MONO, fontSize: 9.5, letterSpacing: '0.1em', textTransform: 'uppercase', fontWeight: 500, color: `var(--stg-onramp, ${T.white})`, background: `var(--stg-acc, ${COLORS.accent})`, borderRadius: 4, padding: '2px 6px' }}>Sunday Edition &middot; Two errors</span>}
          blocks={'STET'.split('').map((ch, i) => (
              <div key={i} style={{ width: 44, height: 44, borderRadius: 5, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: SANS, fontWeight: 900, fontSize: 26, background: i === 0 ? `var(--stg-acc, ${COLORS.accent})` : COLORS.ink, color: i === 0 ? `var(--stg-onramp, ${T.white})` : T.white, boxShadow: 'inset 0 2px 5px rgba(0,0,0,0.5), 0 1px 0 rgba(255,255,255,0.65)' }}>{ch}</div>
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

        {/* start tile — sits where the brief goes; the sentences stay sealed
            until the player presses Start, which begins the clock. */}
        {preStart && (
          <div className={STAGE ? 'stg-gate' : undefined} style={{ background: STAGE ? SURF : COLORS.cream, border: STAGE ? `1px solid ${SURF_B}` : `2px solid ${COLORS.ink}`, borderRadius: 12, padding: '22px', display: 'flex', flexDirection: 'column' }}>
            <div style={{ fontSize: 20, fontWeight: 800, color: INK, marginBottom: 10 }}>{gateRules ? 'How to play' : 'Stet is ready'}</div>
            {gateRules ? rulesBody : (
              <div style={{ fontSize: 14, lineHeight: 1.55, color: INK, fontWeight: 600 }}>
                <p style={{ margin: '0 0 6px' }}>Catch the wrong word or grammar slip in each sentence, or stamp a clean one stet.</p>
              </div>
            )}
            <div style={{ marginTop: 18, display: 'flex', flexDirection: 'row-reverse', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
              <button className="st-btn" onClick={startGame} style={{ borderColor: STAGE ? STAGE_C : undefined, background: STAGE ? STAGE_C : T.cta, color: STAGE ? 'var(--stg-onramp, #08222e)' : T.white, fontSize: 15, padding: '11px 22px' }}>Start</button>
              <div>
                <button type="button" onClick={() => setGateRules((v) => !v)} style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', fontFamily: SANS, fontSize: 13, fontWeight: 700, color: FADED, textDecoration: 'underline' }}>
                  {gateRules ? 'Hide detailed instructions' : 'Show detailed instructions'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* the brief */}
        {!preStart && (
        <div className={STAGE ? 'stg-board' : (LOFT ? 'loft-card' : undefined)} style={{ background: STAGE ? 'var(--stg-surf)' : PAPER, border: `2px solid var(--stg-line, ${COLORS.ink})`, borderRadius: 10, padding: '15px 17px 12px', boxShadow: '5px 5px 0 rgba(28,30,36,0.16)', marginBottom: 12 }}>
          {!LOFT && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, fontFamily: MONO, fontSize: 11.5, letterSpacing: '0.1em', textTransform: 'uppercase', color: FADED, borderBottom: '1px solid rgba(28,30,36,0.18)', paddingBottom: 8, marginBottom: 12, flexWrap: 'wrap' }}>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, whiteSpace: 'nowrap' }}><Pencil size={12} /> one slip per sentence &mdash; maybe</span>
            <span style={{ marginLeft: 'auto', whiteSpace: 'nowrap' }}>filed <b style={{ color: INK, fontWeight: 500 }}>{solvedCount}</b>/{ITEMS.length}</span>
          </div>
          )}
          {LOFT && <div className={STAGE ? undefined : 'loft-prompt'}>one slip per sentence, maybe</div>}
          {ITEMS.map((_, i) => renderSentence(i))}
          {started && (
            <div style={{ fontFamily: SANS, fontSize: 12, fontWeight: 700, color: FADED, margin: '2px 2px 6px' }}>
              Tap the word that doesn&rsquo;t belong and fix it &mdash; or stamp a clean sentence <i>stet</i>. Wrong words and grammar slips, but never typos: spellcheck is no help.
            </div>
          )}
        </div>
        )}


          </div>
          <div className={STAGE ? undefined : 'loft-sol'}>
          {/* result */}
          {!playing && (
            <>
              <div style={{ maxWidth: 472, margin: '0 auto 12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 14, background: STAGE ? SURF : T.white, border: STAGE ? `1px solid ${SURF_B}` : '1.5px solid rgba(28,30,36,0.18)', borderRadius: 10, padding: '12px 14px' }}>
                  <span style={{ fontFamily: MONO, fontSize: 32, fontWeight: 500, color: perfect ? COLORS.green : `var(--stg-ink, ${COLORS.ink})`, fontVariantNumeric: 'tabular-nums', letterSpacing: '0.04em', flex: '0 0 auto' }}>{score}/{TOTAL}</span>
                  <span style={{ fontFamily: SANS, fontSize: 13, fontWeight: 700, color: INK, lineHeight: 1.45 }}>
                    {perfect ? 'A clean desk — every call was right.' : misses === 0 ? 'Sharp eyes — a fix or two got away.' : `${misses} mis-flag${misses === 1 ? '' : 's'} on the desk today.`}
                    {' '}<span style={{ color: FADED, fontWeight: 600 }}>{elapsed}</span>
                  </span>
                </div>
                {PUZZLE.sunday && (
                  <div style={{ fontSize: 12.5, fontWeight: 600, color: FADED, fontStyle: 'italic', margin: '8px 0 0' }}>The Sunday Edition — seven sentences, up to two errors each, and the desk splits hairs.</div>
                )}
              </div>
              <p className={STAGE ? undefined : 'loft-tailnote'} style={{ fontSize: 12, color: FADED, fontWeight: 600, margin: '12px 0 0' }}>
                {isTodays ? (
                  <>
                    {countdown ? <>Next Stet in <b style={{ color: INK, fontVariantNumeric: 'tabular-nums' }}>{countdown}</b>.</> : 'A new brief lands at midnight Eastern.'}
                    {prevPuzzle && (
                      <>
                        {' '}Meanwhile:{' '}
                        <a href={`/stet?p=${prevPuzzle.num}`} style={{ color: `var(--stg-ink, ${COLORS.ember})`, fontWeight: 800, textDecoration: 'underline' }}>
                          play yesterday&rsquo;s Stet &rarr;
                        </a>
                      </>
                    )}
                  </>
                ) : (
                  <>
                    You&rsquo;re playing the {PUZZLE.dateLabel.replace(', 2026', '')} archive.{' '}
                    <a href="/stet" style={{ color: `var(--stg-ink, ${COLORS.ember})`, fontWeight: 800, textDecoration: 'underline' }}>Back to today&rsquo;s Stet &rarr;</a>
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
              name="Stet"
              catRank={catRank}
              outcome={perfect ? 'won' : (score > 0 ? 'part' : 'lost')}
              title={perfect ? 'Solved' : (score > 0 ? 'Partly solved' : 'Not solved')}
              detail={`${`${score}/${TOTAL}`} \u00b7 ${`${solvedCount}/${ITEMS.length}`} filed \u00b7 ${elapsed}`}
              iq={iq}
              board={dailyBoard}
              gameRank={allTime && allTime.ready
                ? { value: allTime.rank != null ? `#${Number(allTime.rank).toLocaleString()}` : '\u2014',
                    label: allTime.field != null ? `of ${Number(allTime.field).toLocaleString()} Stet all time` : 'all-time rank' }
                : null}
              day={dayStats}
              streak={isTodays ? myStats.cur : null}
              missLabel="Miss"
              archive={puzzles
                .filter((p) => p.live <= etToday() && p.num !== PUZZLE.num)
                .sort((x, y) => y.num - x.num)
                .map((p) => ({
                  num: p.num,
                  dateLabel: p.dateLabel,
                  sunday: !!p.sunday,
                  href: `/stet?p=${p.num}`,
                  done: !!(stats && stats.rec && stats.rec[p.num]),
                  score: (stats && stats.rec && stats.rec[p.num]) ? stats.rec[p.num].s : null,
                }))}
              options={[
                { label: copied ? 'Copied' : (shareCta || 'Share'), sub: 'Your result, no spoilers', kind: 'gold', onClick: copyShare },
                { tone: perfect ? 'board' : 'reveal', label: perfect ? 'Return to board' : 'Reveal answer',
                  sub: perfect ? 'Your finished board' : 'Show what you missed', onClick: () => setRevealed(true) },
              prevPuzzle && { tone: 'another', label: 'Play another Stet', sub: `No. ${prevPuzzle.num}, yesterday\u2019s puzzle`, href: `/stet?p=${prevPuzzle.num}` },
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
        {!STAGE && <GamePanel self="stet" name="Stet" onShow={() => setShowChrome(true)} />}
        <div style={{ display: (focusMode && !STAGE) ? 'none' : 'block', margin: '30px auto 0' }}>
          {LOFT && (
            <div className={STAGE ? undefined : 'loft-report'}>
              <ReportIssue self="stet" name="Stet" accent="#ffffff" align="center" onHelp={() => setShowHelp(true)} />
            </div>
          )}
          {!LOFT && (
          <DailyGamesGrid replay={!playing ? resetGame : null}
            self="stet"
            maxWidth={640}
            challengeHref={`/duel/new?quiz=${encodeURIComponent(PUZZLE.quizId)}`}
            share={{ label: copied ? 'Copied' : 'Share', onClick: copyShare }}
            light
            boardSlot={<DailyBoardPanel self="stet" quizId={PUZZLE.quizId} maxWidth={640} streak={{ current: myStats.cur, best: myStats.max }} />}
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
              <div style={{ fontSize: 17, fontWeight: 800, color: INK, marginBottom: 8 }}>Add Stet to your Home Screen</div>
              {isIosDevice() ? (
                <ol style={{ margin: '0 0 4px', paddingLeft: 20, color: INK, fontSize: 14, lineHeight: 1.7 }}>
                  <li>Tap the <b>Share</b> button in Safari&apos;s toolbar.</li>
                  <li>Scroll down and tap <b>Add to Home Screen</b>.</li>
                  <li>Tap <b>Add</b> &mdash; the tile opens today&apos;s brief, every day.</li>
                </ol>
              ) : (
                <p style={{ margin: '0 0 4px', color: INK, fontSize: 14, lineHeight: 1.7 }}>
                  Open your browser&apos;s menu and choose <b>Add to Home Screen</b> (or <b>Install app</b>). The tile opens today&apos;s brief, every day.
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
      {!playing && !endClosed && !LOFT && (
        <DailyEndCard
          modal
          self="stet"
          won={misses === 0}
          completed
          headline={perfect ? <>Clean desk!</> : <>You scored {Math.round((score / TOTAL) * 100)}%</>}
          subline={<>Stet #{PUZZLE.num} &middot; {score}/{TOTAL}{perfect ? <> &middot; clean desk</> : null} &middot; {elapsed}</>}
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
            <button className="st-btn" onClick={() => { setShowHelp(false); try { localStorage.setItem(HELP_KEY, '1'); } catch (e) {} }} style={{ marginTop: 14, background: COLORS.ink, color: T.white }}>Play</button>
          </div>
        </div>
      )}

      {/* The desktop fold: the About prose below starts one screen down (app/StageFold.jsx). */}
      <StageFold />
      {/* About Stet — crawlable prose for search, server-rendered into the HTML */}
      <section style={{ display: (focusMode && !STAGE) ? 'none' : 'block', position: 'relative', zIndex: 2, maxWidth: 640, margin: '0 auto', padding: '10px 24px 42px', fontFamily: SANS }}>
        <h2 style={{ margin: '0 0 8px', fontSize: 15, fontWeight: 800, letterSpacing: '-0.01em', color: INK }}>About Stet</h2>
        <p style={{ margin: '0 0 8px', fontSize: 13, lineHeight: 1.65, color: FADED, fontWeight: 600 }}>
          Stet is a free daily word puzzle from Mind Loft, the copy-desk puzzle. Each day serves up a short news brief where almost every sentence hides one wrong word: an eggcorn, a swapped homophone, a malaprop, or a grammar slip like &ldquo;should of&rdquo; or &ldquo;had ran&rdquo;. The catch is that every error is a real English word, so a spellchecker would wave the whole brief through. Only a sharp eye catches &ldquo;free reign&rdquo;, &ldquo;baited breath&rdquo;, or a report that &ldquo;peaked&rdquo; someone&rsquo;s interest.
        </p>
        <p style={{ margin: '0 0 8px', fontSize: 13, lineHeight: 1.65, color: FADED, fontWeight: 600 }}>
          Tap the word that doesn&rsquo;t belong, type the correction, and lock it in, a point for finding each error and a point for fixing it. But stay honest: some sentences are perfectly clean, and the only way to score them is to stamp them <i>stet</i>, the proofreader&rsquo;s mark, Latin for &ldquo;let it stand.&rdquo; Miss a call either way and the desk shows you what you should have caught, with a one-line note on why.
        </p>
        <p style={{ margin: 0, fontSize: 13, lineHeight: 1.65, color: FADED, fontWeight: 600 }}>
          A new brief lands every day at midnight Eastern, with a seven-sentence Sunday edition where a single sentence can hide two errors. No app, no signup, play free in your browser, keep a streak, and race the daily leaderboard. More dailies: <a href="/crux" style={{ color: INK, fontWeight: 800 }}>Crux</a>, our clueless crossword, <a href="/garble" style={{ color: INK, fontWeight: 800 }}>Garble</a>, our unscrambling puzzle, and <a href="/extra" style={{ color: INK, fontWeight: 800 }}>Extra</a>, our front-page history puzzle.
        </p>
      </section>

      {!STAGE && <div style={{ display: focusMode ? 'none' : 'block', position: 'relative', zIndex: 2 }}><Footer /></div>}
    </div>
  );
}
