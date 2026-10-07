'use client';

// Dario — the daily side-scroller (Arcade).
//
// Three short levels played as one timed run: The Valley, The Data Center and
// The Launch Site, a send-up of the AI race told through parody billboards. The
// geometry never changes, so every day is beatable; the day's REMIX (where the
// bots, robotaxis, chips and the shield crate sit, rocket and platform timing)
// is seeded off the quizId in lib/dario-engine.js, so everyone runs the same
// course on the same day.
//
// It is an Arcade game: as many runs as you like and the board keeps your BEST.
// A full clear scores 10 and posts its run time in tenths of a second as
// guessesUsed, so the arcade tiebreak ranks clears by speed. An unfinished run
// scores by levels reached and posts 10000 minus the tiles travelled, so going
// further ranks higher. The all-time FASTEST CLEARS live in their own list
// (/api/quiz/dario-fastest), shown under the board.
//
// Plumbing forked from app/snake/SnakeClient.jsx.

import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import { createPortal } from 'react-dom';
import { X, Pause, Play, RotateCcw, Maximize2, Volume2, VolumeX, Zap } from 'lucide-react';
import Grain from '../Grain';
import Footer from '../Footer';
import useDuelContext, { DuelBanner } from '../quiz/[id]/useDuelContext';
import JoinLeaderboardForm from '../quiz/[id]/JoinLeaderboardForm';
import DailyGamesGrid from '../DailyGamesGrid';
import DailyEndCard from '../DailyEndCard';
import DailyChrome from '../DailyChrome';
import DailyRules from '../DailyRules';
import DailyBoardPanel from '../quiz/[id]/DailyBoardPanel';
import DailyMasthead from '../DailyMasthead';
import { isLoft } from '@/lib/loft';
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
import AddToHome from '../AddToHome';
import { CONTEST, contestIsLive } from '@/lib/contest';
import { isMobileDevice } from '@/lib/is-mobile';
import useAbandonFlush from '../quiz/[id]/useAbandonFlush';
import useEndHold, { HOLD_LONG } from '../useEndHold';
import { notifyShareCredit } from '../ShareCreditPop';
import { withRef } from '@/lib/referrals';
import { T } from '@/lib/theme';
import { arcadeRanksForKey } from '@/lib/daily-games';
import { meRequest } from '@/app/quizMeClient';
import { createDario, fmtRun, DARIO_TOTAL, TENTHS_CAP, LEVEL_NAMES, primeDarioAudio } from '@/lib/dario-engine';

const SANS = "'Manrope', system-ui, -apple-system, sans-serif";
const MONO = "'DM Mono', ui-monospace, 'SFMono-Regular', monospace";
const COLORS = { ink: T.ink, cream: '#f7f8fa', faded: '#3f4757', line: '#e5e7eb', accent: '#9a3412', accentSoft: '#fff1e6' };
const HELP_KEY = 'sot_dario_help_seen';
const STATS_KEY = 'sot_dario_stats';
const BEST_KEY = 'sot_dario_best_ever';
const MUSIC_KEY = 'sot_dario_music';

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
const dateOfQuiz = (id) => { const m = /^dario-(\d+)-(\d+)-(\d+)$/.exec(id || ''); return m ? `${m[1]}/${m[2]}/${m[3]}` : ''; };

// ---- stats: the record is the BEST run, as on every arcade game ----------
function getStats() {
  try { const s = JSON.parse(localStorage.getItem(STATS_KEY)); if (s && s.v === 1 && s.rec) return s; } catch (e) {}
  return { v: 1, rec: {} };
}
const RUN_RANK = arcadeRanksForKey('dario');
const asRun = (e) => ({ score: e.s, guesses_used: e.g ?? null, time_elapsed: null });
function betterRun(next, prev) {
  if (!prev) return true;
  return RUN_RANK ? RUN_RANK(asRun(next), asRun(prev)) < 0 : next.s > prev.s;
}
function recordStat(num, entry) {
  const s = getStats();
  if (!betterRun(entry, s.rec[num])) return s;
  const s2 = { ...s, rec: { ...s.rec, [num]: entry } };
  try { localStorage.setItem(STATS_KEY, JSON.stringify(s2)); } catch (e) {}
  return s2;
}
function deriveStats(s, todayNum) {
  const rec = (s && s.rec) || {};
  const nums = Object.keys(rec).map(Number).sort((a, b) => a - b);
  let max = 0, run = 0, prev = null;
  for (const n of nums) { run = prev != null && n === prev + 1 ? run + 1 : 1; if (run > max) max = run; prev = n; }
  let cur = 0, at = rec[todayNum] ? todayNum : todayNum - 1;
  while (rec[at]) { cur++; at--; }
  return { played: nums.length, cleared: nums.filter((n) => rec[n].won).length, cur, max, rec };
}
function mergeServerStats(s, recent, puzzles) {
  if (!s || !Array.isArray(recent) || !recent.length) return s;
  const byQuiz = {};
  for (const p of puzzles) byQuiz[p.quizId] = p;
  let rec = s.rec, changed = false;
  for (const m of recent) {
    const p = m && byQuiz[m.quizId];
    if (!p || rec[p.num]) continue;
    const sc = Math.max(0, Math.round(((m.scorePct || 0) / 100) * DARIO_TOTAL));
    if (!changed) { rec = { ...rec }; changed = true; }
    rec[p.num] = { s: sc, g: null, won: !!m.perfect };
  }
  if (!changed) return s;
  const s2 = { ...s, rec };
  try { localStorage.setItem(STATS_KEY, JSON.stringify(s2)); } catch (e) {}
  return s2;
}
function freshG() { return { v: 1, status: 'playing', t0: null, result: null, runs: 0 }; }

// ---- the all-time fastest clears -----------------------------------------
function FastestList({ refreshKey, myName, ink, faded, surf, line, acc }) {
  const [rows, setRows] = useState(null);
  useEffect(() => {
    let live = true;
    fetch('/api/quiz/dario-fastest', { cache: 'no-store' })
      .then((r) => r.json())
      .then((d) => { if (live) setRows(Array.isArray(d && d.rows) ? d.rows : []); })
      .catch(() => { if (live) setRows([]); });
    return () => { live = false; };
  }, [refreshKey]);
  let best = null;
  try { const b = Number(localStorage.getItem(BEST_KEY)); if (b > 0) best = b; } catch (e) {}
  return (
    <section style={{ maxWidth: 620, margin: '22px auto 0', background: surf, border: `1px solid ${line}`, borderRadius: 12, padding: '14px 16px' }}>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, flexWrap: 'wrap' }}>
        <h2 style={{ margin: 0, fontSize: 15, fontWeight: 800, color: ink, display: 'flex', alignItems: 'center', gap: 6 }}><Zap size={15} /> Fastest clears, all time</h2>
        {best != null && <span style={{ marginLeft: 'auto', fontSize: 12, fontWeight: 700, color: faded }}>Your best ever <b style={{ color: ink, fontFamily: MONO }}>{fmtRun(best)}</b></span>}
      </div>
      <p style={{ margin: '4px 0 10px', fontSize: 12, color: faded }}>Every day's course is a different remix, so this is the master list of raw speed. Registered players only, one row each.</p>
      {rows == null ? (
        <div style={{ fontSize: 13, color: faded }}>Loading…</div>
      ) : rows.length === 0 ? (
        <div style={{ fontSize: 13, color: faded }}>No full clears yet. Be the first.</div>
      ) : (
        <ol style={{ listStyle: 'none', margin: 0, padding: 0 }}>
          {rows.map((r, i) => {
            const me = myName && r.name === myName;
            return (
              <li key={`${r.name}-${i}`} style={{ display: 'grid', gridTemplateColumns: '28px minmax(0,1fr) auto auto', gap: 10, alignItems: 'baseline', padding: '6px 0', borderTop: i ? `1px solid ${line}` : 'none', fontSize: 13.5, color: ink, fontWeight: me ? 800 : 600 }}>
                <span style={{ fontFamily: MONO, color: i < 3 ? acc : faded, fontWeight: 800 }}>{i + 1}</span>
                <span style={{ minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.name}{me ? ' (you)' : ''}</span>
                <span style={{ fontSize: 11.5, color: faded, fontFamily: MONO }}>{dateOfQuiz(r.quizId)}</span>
                <span style={{ fontFamily: MONO, fontVariantNumeric: 'tabular-nums', fontWeight: 800 }}>{fmtRun(r.tenths)}</span>
              </li>
            );
          })}
        </ol>
      )}
    </section>
  );
}

export default function DarioClient({ puzzles = [], forceNum = null }) {
  const searchParams = useSearchParams();
  const PUZZLE = useMemo(() => pickPuzzle(puzzles, forceNum), [puzzles, forceNum]);
  const STORE_KEY = `sot_dario_${PUZZLE.num}`;
  const REC_KEY = `sot_dario_rec_${PUZZLE.num}`;
  const isTodays = PUZZLE.num === pickPuzzle(puzzles, null).num;

  const [g, setG] = useState(freshG);
  const gRef = useRef(g);
  const engRef = useRef(null);
  const cvsRef = useRef(null);
  const boxRef = useRef(null);
  const [fig, setFig] = useState({ level: 0, tenths: 0, lives: 3, gpus: 0 });
  const [paused, setPaused] = useState(false);
  const [hydrated, setHydrated] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const [gateRules, setGateRules] = useState(true);
  const [endClosed, setEndClosed] = useState(false);
  const [revealed, setRevealed] = useState(false);
  const [copied, setCopied] = useState(false);
  const [identity, setIdentity] = useState(null);
  const [stats, setStats] = useState(null);
  const [touchOnly, setTouchOnly] = useState(false);
  const [runLock, setRunLock] = useState(false);
  const [music, setMusic] = useState(true);
  const [fsOk, setFsOk] = useState(false);
  const [fastKey, setFastKey] = useState(0);
  const [imm, setImm] = useState(false);
  const [fit, setFit] = useState(null);   // the play layer's measured size, so the screen fills it
  const [shareCta, setShareCta] = useState('Share');
  useEffect(() => { if (contestIsLive()) setShareCta(`Share for ${CONTEST.prizeLabel}*`); }, []);
  const viewedRef = useRef(false);
  const { duelToken, duelInfo, duelSubmitted } = useDuelContext(PUZZLE.quizId, searchParams);

  const commit = useCallback((next) => {
    gRef.current = next;
    setG(next);
    try { localStorage.setItem(STORE_KEY, JSON.stringify(next)); } catch (e) {}
  }, [STORE_KEY]);

  const playing = g.status === 'playing';
  const endHold = useEndHold();
  const holdEnd = endHold.hold;
  const releaseEnd = endHold.release;
  const LOFT = isLoft('dario');
  const STAGE = isStage('dario', searchParams);
  const STAGE_C = STAGE ? 'var(--stg-acc)' : gameColor('dario');
  const Cap = STAGE ? StageChrome : LoftCap;
  const STAGE_ACC = { '--stg-acc-dk': gameColor('dario'), '--stg-acc-lt': gameColorLight('dario'), '--stg-onramp-lt': gameOnrampLight('dario'), '--stg-acc-ink-lt': gameAccentInkLight('dario') };
  const [stageTheme] = useStageTheme();
  const INK = STAGE ? 'var(--stg-ink,#e9edf4)' : COLORS.ink;
  const FADED = STAGE ? 'var(--stg-mute,#8b95a8)' : COLORS.faded;
  const SURF = STAGE ? 'var(--stg-surf,rgba(255,255,255,0.045))' : T.white;
  const SURF_B = STAGE ? 'var(--stg-line,rgba(255,255,255,0.11))' : 'rgba(28,30,36,0.42)';
  const ACC_INK = STAGE ? 'var(--stg-acc-ink)' : COLORS.accent;
  const iq = useIqStanding({ game: 'dario', quizId: PUZZLE.quizId, active: LOFT && !playing });
  const prevPuzzle = puzzles.find((x) => x.num === PUZZLE.num - 1) || null;
  const nextUp = useNextUnplayed({ self: 'dario', active: LOFT && !playing });
  const upNext = useUnplayedSimilar({ self: 'dario', active: LOFT && !playing });
  const dailyBoard = useDailyBoard({ quizId: PUZZLE.quizId, active: LOFT && !playing });
  const allTime = useGameAllTime({ game: 'dario', active: LOFT && !playing });
  const dayStats = useDayStats();
  const catRank = useCategoryRank({ self: 'dario', active: LOFT && !playing });

  const [showChrome, setShowChrome] = useState(false);
  const started = playing && !!g.t0;
  const focusMode = playing && !showChrome;
  const preStart = playing && !g.t0;
  const over = g.status !== 'playing';
  const res = g.result;
  const cleared = !!(res && res.cleared);
  const verdictTone = cleared ? 'won' : 'part';
  const verdictWord = cleared ? 'Dario now controls all software business globally' : 'A rival shipped first';
  const myStats = useMemo(() => deriveStats(stats || { rec: {} }, PUZZLE.num), [stats, PUZZLE.num]);
  const bestRec = myStats.rec && myStats.rec[PUZZLE.num];
  const bestToday = bestRec && bestRec.won && bestRec.g != null ? bestRec.g : null;

  // ---- hydrate -------------------------------------------------------------
  useEffect(() => {
    let saved = null;
    try { saved = JSON.parse(localStorage.getItem(STORE_KEY)); } catch (e) {}
    if (saved && saved.v === 1) {
      // A run cannot be resumed after a reload; an unfinished one was already
      // filed by the abandon flush, so the page reopens on the gate.
      const s = { ...freshG(), ...saved };
      if (s.status === 'playing') { s.t0 = null; }
      gRef.current = s; setG(s);
    }
    try { setGateRules(!localStorage.getItem(HELP_KEY)); } catch (e) {}
    try { const m = localStorage.getItem(MUSIC_KEY); if (m === '0') setMusic(false); } catch (e) {}
    setStats(getStats());
    try { setIdentity(JSON.parse(localStorage.getItem('sot_quiz_identity'))); } catch (e) {}
    try { setTouchOnly(isMobileDevice() || (window.matchMedia && window.matchMedia('(pointer: coarse)').matches) || (navigator.maxTouchPoints > 1 && /Macintosh/.test(navigator.userAgent))); } catch (e) {}
    try { setFsOk(!!(document.documentElement.requestFullscreen || document.documentElement.webkitRequestFullscreen)); } catch (e) {}
    setHydrated(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    const anon = getAnonId();
    let em = '';
    try { const id = JSON.parse(localStorage.getItem('sot_quiz_identity')); if (id && id.email) em = `&email=${encodeURIComponent(id.email)}`; } catch (e) {}
    meRequest(`/api/quiz/me?anonId=${encodeURIComponent(anon || '')}${em}&history=1`)
      .then((r) => r.json())
      .then((d) => { if (d && Array.isArray(d.recent)) setStats((cur) => mergeServerStats(cur || getStats(), d.recent, puzzles)); })
      .catch(() => {});
    if (!viewedRef.current) {
      viewedRef.current = true;
      try { fetch('/api/quiz/view', { method: 'POST', keepalive: true, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ quizId: PUZZLE.quizId }) }).catch(() => {}); } catch (e) {}
    }
  }, [hydrated, PUZZLE.quizId, puzzles]);

  // ---- the hub slate flag ---------------------------------------------------
  useEffect(() => {
    if (!hydrated || !isTodays) return;
    try {
      const done = g.status !== 'playing' || !!bestRec;
      if (done || g.t0) localStorage.setItem('sot_dario_day', JSON.stringify({ d: etToday(), done }));
      else localStorage.removeItem('sot_dario_day');
    } catch (e) {}
  }, [hydrated, isTodays, g.status, g.t0, bestRec]);

  // ---- posting ---------------------------------------------------------------
  const payloadOf = useCallback((r, abandoned) => ({
    quizId: PUZZLE.quizId,
    score: r.score,
    total: DARIO_TOTAL,
    correct: r.cleared ? 1 : 0,
    guessesUsed: r.cleared ? Math.min(TENTHS_CAP, Math.max(1, r.tenths)) : Math.max(0, TENTHS_CAP - r.progress),
    timeElapsed: Math.min(36000, Math.max(1, Math.round(r.tenths / 10))),
    ...(abandoned ? { abandoned: true } : {}),
    email: (identity && identity.email) || undefined, anonId: getAnonId(),
    isMobile: isMobileDevice(), referrer: (typeof document !== 'undefined' ? document.referrer : ''),
  }), [PUZZLE.quizId, identity]);

  const abandon = useAbandonFlush(() => {
    const cur = gRef.current, e = engRef.current;
    if (cur.status !== 'playing' || !cur.t0 || !e) return null;
    const s = e.state();
    if (!s || s.tenths < 30) return null;
    try { if (localStorage.getItem(REC_KEY)) return null; } catch (er) {}
    try { localStorage.setItem(REC_KEY, '1'); } catch (er) {}
    const pr = e.peek();
    if (!pr) return null;
    return payloadOf(pr, true);
  });

  const onEnd = useCallback((r) => {
    const cur = gRef.current;
    if (cur.status !== 'playing') return;
    abandon.markFlushed();
    holdEnd(HOLD_LONG);
    commit({ ...cur, status: 'over', result: r, runs: (cur.runs || 0) + 1 });
    const gUsed = r.cleared ? Math.min(TENTHS_CAP, Math.max(1, r.tenths)) : Math.max(0, TENTHS_CAP - r.progress);
    try { setStats(recordStat(PUZZLE.num, { s: r.score, g: gUsed, won: r.cleared })); } catch (er) {}
    if (r.cleared) {
      try { const b = Number(localStorage.getItem(BEST_KEY)); if (!(b > 0) || r.tenths < b) localStorage.setItem(BEST_KEY, String(r.tenths)); } catch (er) {}
    }
    try {
      fetch('/api/quiz/result', { method: 'POST', keepalive: true, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payloadOf(r, false)) })
        .then(() => setTimeout(() => setFastKey((k) => k + 1), 1500))
        .catch(() => {});
    } catch (er) {}
  }, [abandon, holdEnd, commit, PUZZLE.num, payloadOf]);
  const onEndRef = useRef(onEnd);
  useEffect(() => { onEndRef.current = onEnd; }, [onEnd]);

  // ---- the engine lives as long as the canvas does ------------------------------
  useEffect(() => {
    if (!hydrated || preStart) return undefined;
    const cv = cvsRef.current;
    if (!cv || engRef.current) return undefined;
    const eng = createDario({
      canvas: cv,
      quizId: PUZZLE.quizId,
      music,
      onEnd: (r) => onEndRef.current(r),
      onTick: (s) => { setFig({ level: s.level, tenths: s.tenths, lives: s.lives, gpus: s.gpus }); setPaused(!!(engRef.current && engRef.current.isPaused())); },
    });
    engRef.current = eng;
    if (gRef.current.status === 'playing' && gRef.current.t0) eng.start();
    return () => { eng.destroy(); engRef.current = null; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hydrated, preStart, PUZZLE.quizId]);

  useEffect(() => { if (engRef.current) engRef.current.setRunLock(runLock); }, [runLock]);
  // the engine can be created after the play layer was measured; give it the view
  useEffect(() => { if (engRef.current) engRef.current.setView(imm && fit ? fit.ar : 400 / 224); }, [imm, fit, playing]);

  // leaving the tab pauses the run (the clock stops with it)
  useEffect(() => {
    const hide = () => { if (document.hidden && engRef.current) { engRef.current.pause(); setPaused(true); } };
    document.addEventListener('visibilitychange', hide);
    return () => document.removeEventListener('visibilitychange', hide);
  }, []);

  const startRun = useCallback(() => {
    releaseEnd();
    setEndClosed(false); setRevealed(false); setPaused(false);
    try { localStorage.removeItem(REC_KEY); } catch (e) {}
    const cur = gRef.current;
    commit({ ...cur, status: 'playing', t0: Date.now(), result: null });
    if (engRef.current) engRef.current.start();
    if (touchOnly) enterImm();
  }, [releaseEnd, commit, REC_KEY, touchOnly]);

  function enterImm() {
    setImm(true);
    try {
      const de = document.documentElement;
      const fn = de.requestFullscreen || de.webkitRequestFullscreen;
      if (fn) { const pr = fn.call(de); if (pr && pr.then) pr.then(() => { try { if (screen.orientation && screen.orientation.lock) screen.orientation.lock('landscape').catch(() => {}); } catch (e) {} }).catch(() => {}); }
    } catch (e) {}
  }
  function leaveImm(pause) {
    if (pause && engRef.current && gRef.current.status === 'playing') { engRef.current.pause(); setPaused(true); }
    setImm(false);
    try { if (document.fullscreenElement || document.webkitFullscreenElement) (document.exitFullscreen || document.webkitExitFullscreen).call(document); } catch (e) {}
  }
  useEffect(() => {
    if (!imm) return undefined;
    const b = document.body.style.overflow, h = document.documentElement.style.overflow;
    document.body.style.overflow = 'hidden'; document.documentElement.style.overflow = 'hidden';
    return () => { document.body.style.overflow = b; document.documentElement.style.overflow = h; };
  }, [imm]);
  useEffect(() => {
    if (!imm || playing) return undefined;
    const t = setTimeout(() => leaveImm(false), 3200);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [imm, playing]);

  // Size the screen from the VISIBLE viewport, not CSS svh: on iPhone, svh in
  // landscape assumes both browser bars are showing, which made the sideways
  // screen barely bigger than the upright one (owner report, 2026-10-07).
  useEffect(() => {
    if (!imm) { setFit(null); if (engRef.current) engRef.current.setView(400 / 224); return undefined; }
    const measure = () => {
      const vv = window.visualViewport;
      const W = Math.round(vv ? vv.width : window.innerWidth), H = Math.round(vv ? vv.height : window.innerHeight);
      const land = W > H;
      // the notch and home-bar insets the layer pads itself with
      let sl = 0, sr = 0, stp = 0, sb = 0;
      const lay = document.querySelector('.dr-imm');
      if (lay) { const cs = getComputedStyle(lay); sl = parseFloat(cs.paddingLeft) || 0; sr = parseFloat(cs.paddingRight) || 0; stp = parseFloat(cs.paddingTop) || 0; sb = parseFloat(cs.paddingBottom) || 0; }
      const iw = W - sl - sr, ih = H - stp - sb;
      // FILL THE SPACE (owner, 2026-10-07): the picture takes the whole room
      // between the pads. Sideways it widens (no black bars); upright it
      // narrows, so the world is drawn bigger. Gameplay is unchanged.
      const availW = land ? iw - (64 * 2 + 12 * 2 + 20) : iw - 16;
      const availH = land ? ih - 12 : ih - 70 - 14 - 60 - 24;
      const want = Math.max(300 / 224, Math.min(520 / 224, availW / Math.max(1, availH)));
      const v = engRef.current ? engRef.current.setView(want) : Math.round((224 * want) / 2) * 2;
      const ar = v / 224;
      const cw = Math.min(availW, availH * ar);
      setFit({ w: W, h: H, cw: Math.max(200, Math.floor(cw)), ar, land });
    };
    measure();
    const later = () => { measure(); setTimeout(measure, 250); setTimeout(measure, 700); };
    window.addEventListener('resize', later);
    window.addEventListener('orientationchange', later);
    if (window.visualViewport) window.visualViewport.addEventListener('resize', later);
    return () => {
      window.removeEventListener('resize', later);
      window.removeEventListener('orientationchange', later);
      if (window.visualViewport) window.visualViewport.removeEventListener('resize', later);
    };
  }, [imm]);

  function startGame() {
    if (music) primeDarioAudio();
    try { localStorage.setItem(HELP_KEY, '1'); } catch (e) {}
    startRun();
  }

  const togglePause = useCallback(() => {
    const e = engRef.current; if (!e) return;
    e.togglePause(); setPaused(e.isPaused());
  }, []);
  const toggleMusic = useCallback(() => {
    // Inside the tap itself: iOS only lets a page start sound from a gesture,
    // and a React state updater runs later, outside it (owner report, 2026-10-07).
    const next = !music;
    if (next) primeDarioAudio();
    if (engRef.current) engRef.current.setMusic(next);
    setMusic(next);
    try { localStorage.setItem(MUSIC_KEY, next ? '1' : '0'); } catch (e) {}
  }, [music]);
  const goFull = useCallback(() => {
    const el = boxRef.current; if (!el) return;
    try {
      if (document.fullscreenElement || document.webkitFullscreenElement) { (document.exitFullscreen || document.webkitExitFullscreen).call(document); return; }
      const fn = el.requestFullscreen || el.webkitRequestFullscreen;
      if (fn) { const pr = fn.call(el); if (pr && pr.then) pr.then(() => { try { screen.orientation && screen.orientation.lock && screen.orientation.lock('landscape').catch(() => {}); } catch (e) {} }).catch(() => {}); }
    } catch (e) {}
  }, []);

  // Touch buttons: hold to move, tap to jump (hold for height). Run locks on.
  const hold = (k) => ({
    onPointerDown: (ev) => { ev.preventDefault(); try { ev.currentTarget.setPointerCapture(ev.pointerId); } catch (er) {} ev.currentTarget.classList.add('on'); engRef.current && engRef.current.press(k, true); },
    onPointerUp: (ev) => { ev.currentTarget.classList.remove('on'); engRef.current && engRef.current.press(k, false); },
    onPointerCancel: (ev) => { ev.currentTarget.classList.remove('on'); engRef.current && engRef.current.press(k, false); },
    onContextMenu: (ev) => ev.preventDefault(),
  });

  // ---- share -------------------------------------------------------------------
  function shareUrl() { return withRef(`mindloftdaily.com/dario${isTodays ? '' : `?p=${PUZZLE.num}`}`); }

  // Sharing hands over the LINK and nothing else (owner, 2026-10-07): the
  // preview card (public/og/dario-v3.png plus the page title) is the whole message.
  function copyShare() {
    const url = `https://${shareUrl()}`;
    if (notifyShareCredit(url)) return;
    try {
      if (isMobileDevice() && navigator.share) { navigator.share({ url }).catch(() => {}); return; }
      navigator.clipboard.writeText(url);
      setCopied(true); setTimeout(() => setCopied(false), 1600);
    } catch (e) {}
  }


  const rulesBody = (
    <DailyRules
      accent={COLORS.accent}
      accentSoft={COLORS.accentSoft}
      lead="Run Dario through three levels of the AI race, The Valley, The Data Center and The Launch Site, as fast as you can."
      banner="Today's course is remixed for everyone: the bots, robotaxis, chips and the shield crate are in the same places for every player."
      sub="The clock only runs while you play. It stops for pauses and level cards, and keeps going while you lose a life."
      steps={[
        <>Move with the <b>arrow keys</b> or <b>A D</b>, jump with <b>Space</b> or <b>Up</b> (hold for a higher jump), and hold <b>Shift</b> or <b>X</b> to run. On a phone use the pad; <b>Run</b> stays on once you tap it.</>,
        <>Stomp the <b>rogue SaaS bots</b> (NOW, TEAM, WDAY and friends). Never land on a <b>robotaxi</b> or touch a <b>rocket</b>. Bump crates for GPUs; one crate holds a <b>shield</b> that lets you take one hit.</>,
        <>You get <b>three lives</b>. Losing one restarts that level, and the clock keeps running.</>,
      ]}
      knack="Speed is the whole score, so learn the course on your first run and race it on the next. Running jumps go further and higher; a stomp bounces you over the next gap."
      footer={`Scored on SPEED, and you can run the day as often as you like: the board keeps your BEST run. A full clear of all three levels beats any run that stops short, and clears rank by time to the tenth of a second. Runs that stop short rank by how far they got. The all-time list of fastest clears sits under the board. Dario pays at most 1 IQ point a day however many runs you play.`}
    />
  );

  const btn = { fontFamily: SANS, fontWeight: 800, fontSize: 14, border: `2px solid var(--stg-line, ${COLORS.accent})`, background: STAGE ? SURF : '#fff', color: ACC_INK, borderRadius: 8, padding: '9px 16px', cursor: 'pointer' };
  const iconBtn = { border: `1px solid ${SURF_B}`, background: SURF, color: FADED, borderRadius: 7, width: 32, height: 30, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' };
  const figLabel = { fontSize: 10.5, fontWeight: 800, letterSpacing: '0.09em', textTransform: 'uppercase', color: FADED };

  const gameBox = (
                      <div ref={boxRef} className={`dr-box${touchOnly ? ' touch' : ''}`}>
                        {imm && (
                          <div className="dr-ctl">
                            <button className="dr-x" aria-label="Leave full screen" onClick={() => leaveImm(true)}>&#10005;</button>
                            <button className="dr-x" aria-label={music ? 'Sound off' : 'Sound on'} onClick={toggleMusic}>{music ? <Volume2 size={17} /> : <VolumeX size={17} />}</button>
                            {playing && <button className="dr-x" aria-label={paused ? 'Resume' : 'Pause'} onClick={togglePause}>{paused ? <Play size={16} /> : <Pause size={16} />}</button>}
                          </div>
                        )}
                        {imm && <div className="dr-rot">Turn your phone sideways for a bigger screen</div>}
                        {playing && touchOnly && (
                          <div className="dr-pl" aria-label="Move">
                            <button className="dr-b" aria-label="Left" {...hold('l')}>&#9664;</button>
                            <button className="dr-b" aria-label="Right" {...hold('r')}>&#9654;</button>
                          </div>
                        )}
                        <canvas
                          ref={(el) => { cvsRef.current = el; if (el && engRef.current) engRef.current.setCanvas(el); }}
                          width={800}
                          height={448}
                          className="dr-cv"
                          style={imm && fit ? { width: `${fit.cw}px`, maxWidth: 'none', aspectRatio: String(fit.ar) } : undefined}
                          role="img"
                          aria-label="Dario game screen"
                          onPointerDown={() => { if (engRef.current && engRef.current.isPaused()) { engRef.current.resume(); setPaused(false); } }}
                        />
                        {playing && touchOnly && (
                          <div className="dr-pr" aria-label="Run and jump">
                            <button className={`dr-b dr-run${runLock ? ' lock' : ''}`} aria-pressed={runLock} aria-label="Run" onPointerDown={(ev) => { ev.preventDefault(); setRunLock((v) => !v); }}>RUN</button>
                            <button className="dr-b dr-jump" aria-label="Jump" {...hold('j')}>JUMP</button>
                          </div>
                        )}
                      </div>
  );

  return (
    <div className={STAGE ? 'stage-page' : (LOFT ? 'loft-page' : undefined)}
      data-stage-theme={STAGE ? stageTheme : undefined}
      style={{ ...(STAGE ? STAGE_ACC : null), minHeight: '100vh', fontFamily: SANS, background: STAGE ? 'var(--stg-ground)' : COLORS.cream, color: STAGE ? 'var(--stg-ink,#e9edf4)' : undefined, overflowX: (STAGE || LOFT) ? 'hidden' : undefined }}>
      <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Press+Start+2P&display=swap" />
      {!STAGE && <Grain />}
      {!STAGE && <DailyChrome slug="dario" name="Dario" collapsed={started} loft={LOFT} />}
      {LOFT && (
        <Cap gameKey="dario" quizId={PUZZLE.quizId}
          name="Dario"
          cat="Arcade"
          outcome={playing ? null : verdictTone}
          num={PUZZLE.num}
          tiles={playing ? null : upNext}
          dateLabel={PUZZLE.dateLabel}
          figures={[
            { v: playing ? fmtRun(fig.tenths) : (res ? fmtRun(res.tenths) : '–'), k: 'run' },
            { v: playing ? `1-${fig.level + 1}` : (res ? (res.cleared ? 'clear' : `1-${res.level + 1}`) : '–'), k: 'level' },
            { v: bestToday != null ? fmtRun(bestToday) : '–', k: 'best' },
          ]}
        />
      )}

      <div style={{ maxWidth: 960, margin: '0 auto', padding: '18px 14px 40px', position: 'relative', zIndex: 2 }}>
        <DuelBanner token={duelToken} info={duelInfo} submitted={duelSubmitted} />

        {!LOFT && (
          <DailyMasthead slug="dario" num={PUZZLE.num} dateLabel={PUZZLE.dateLabel} accent={COLORS.accent} helpTop={13} marginBottom={16} onHelp={() => setShowHelp(true)} />
        )}

        <div className={LOFT && !STAGE ? 'loft-stage' : undefined}>
          <div className={LOFT && !STAGE && !playing && !endHold.held ? (revealed ? 'loft-flip' : 'loft-flip on') : undefined}>
            <div className={LOFT && !STAGE && !playing && !endHold.held ? 'loft-flip-in' : undefined}>
              <div className={LOFT && !STAGE && !playing && !endHold.held ? 'loft-face' : undefined}>
                <div className={LOFT && !STAGE ? 'loft-sheet' : undefined}>

                  {preStart && (
                    <div className="dr-hero">
                      <img src="/og/dario-v3.png" alt="Dario: race to the frontier. Dario jumps over SaaS bots past a ClosedAI billboard while a rocket launches." className="dr-hero-img" width={1200} height={630} />
                      <div className="dr-hero-bar">
                        <button onClick={startGame} className="dr-start">START</button>
                        <div className="dr-hero-row">
                          <span>{bestToday != null ? `Your best today ${fmtRun(bestToday)}` : 'Three levels · one clock · a new course every day'}</span>
                          <button type="button" className="dr-hero-ic" onClick={toggleMusic} aria-label={music ? 'Sound off' : 'Sound on'}>{music ? <Volume2 size={16} /> : <VolumeX size={16} />}</button>
                        </div>
                      </div>
                    </div>
                  )}

                  {!preStart && (
                    <div className={STAGE ? 'stg-board' : undefined} style={{ background: STAGE ? SURF : '#fff', border: STAGE ? `1px solid ${SURF_B}` : `1px solid ${COLORS.line}`, borderRadius: 12, padding: 12, position: 'relative', margin: '0 auto' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 10, flexWrap: 'wrap' }}>
                        <span style={figLabel}>Run <b style={{ color: INK, fontFamily: MONO }}>{fmtRun(playing ? fig.tenths : (res ? res.tenths : 0))}</b></span>
                        <span style={figLabel}>Level <b style={{ color: INK }}>{LEVEL_NAMES[Math.min(2, playing ? fig.level : (res ? res.level : 0))]}</b></span>
                        <span style={{ marginLeft: 'auto', display: 'flex', gap: 6 }}>
                          {playing && (
                            <button onClick={togglePause} aria-label={paused ? 'Resume' : 'Pause'} style={iconBtn}>{paused ? <Play size={14} /> : <Pause size={14} />}</button>
                          )}
                          <button onClick={toggleMusic} aria-label={music ? 'Music off' : 'Music on'} style={iconBtn}>{music ? <Volume2 size={15} /> : <VolumeX size={15} />}</button>
                          {(fsOk || touchOnly) && <button onClick={touchOnly ? enterImm : goFull} aria-label="Full screen" style={iconBtn}><Maximize2 size={14} /></button>}
                        </span>
                      </div>

                      {imm && typeof document !== 'undefined' ? createPortal(<div className="dr-imm" style={fit ? { height: `${fit.h}px`, width: `${fit.w}px` } : undefined}>{gameBox}</div>, document.body) : gameBox}
                      {over && (
                        <button onClick={startRun} style={{ marginTop: 12, width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, fontFamily: SANS, fontWeight: 800, fontSize: 15, color: STAGE ? 'var(--stg-onramp, #08222e)' : T.white, background: STAGE ? STAGE_C : T.cta, border: `2px solid ${STAGE ? STAGE_C : T.cta}`, borderRadius: 10, padding: '13px 18px', cursor: 'pointer' }}>
                          <RotateCcw size={16} /> Run it again
                        </button>
                      )}
                      {over && res && (
                        <p style={{ margin: '12px 0 0', fontSize: 12.5, color: FADED, fontWeight: 600, textAlign: 'center' }}>
                          {res.cleared ? `Dario now controls all software business globally. All three levels in ${fmtRun(res.tenths)}${res.splits && res.splits.length === 3 ? ` (${res.splits.map(fmtRun).join(' · ')})` : ''}.` : `Out of lives in ${LEVEL_NAMES[Math.min(2, res.level)]} after ${fmtRun(res.tenths)}.`}
                          {bestToday != null && (!res.cleared || bestToday < res.tenths) ? ` Your best today is ${fmtRun(bestToday)}.` : ''}
                        </p>
                      )}
                    </div>
                  )}

                </div>
                {LOFT && !playing && !endHold.held && revealed && (
                  <button className={STAGE ? 'stf-hideboard' : 'loft-showopts'} onClick={() => setRevealed(false)}>&#8630; Hide game board</button>
                )}
              </div>
              {LOFT && !playing && !endHold.held && (
                <LoftFinish
                  name="Dario"
                  catRank={catRank}
                  outcome={verdictTone}
                  title={verdictWord}
                  detail={res ? (res.cleared ? `Cleared in ${fmtRun(res.tenths)}` : `Reached ${LEVEL_NAMES[Math.min(2, res.level)]}`) : ''}
                  iq={iq}
                  board={dailyBoard}
                  gameRank={allTime && allTime.ready
                    ? { value: allTime.rank != null ? `#${Number(allTime.rank).toLocaleString()}` : '—', label: allTime.field != null ? `of ${Number(allTime.field).toLocaleString()} Dario all time` : 'all-time rank' }
                    : null}
                  day={dayStats}
                  streak={isTodays ? myStats.cur : null}
                  archive={puzzles
                    .filter((p) => p.live <= etToday() && p.num !== PUZZLE.num)
                    .sort((x, y) => y.num - x.num)
                    .map((p) => ({ num: p.num, dateLabel: p.dateLabel, sunday: false, href: `/dario?p=${p.num}`, done: !!(myStats.rec && myStats.rec[p.num]), score: (myStats.rec && myStats.rec[p.num]) ? myStats.rec[p.num].s : null }))}
                  options={[
                    { label: copied ? 'Link copied' : (shareCta || 'Share'), sub: 'Send the Dario link', kind: 'gold', onClick: copyShare },
                    { tone: 'board', label: 'Return to board', sub: 'The finished run', onClick: () => setRevealed(true) },
                    prevPuzzle && { tone: 'another', label: 'Play another Dario', sub: `No. ${prevPuzzle.num}, yesterday’s remix`, href: `/dario?p=${prevPuzzle.num}` },
                    nextUp && { tone: 'similar', label: 'Play similar', sub: `${nextUp.name} · ${nextUp.tag}`, href: nextUp.href },
                    { tone: 'replay', label: 'Run it again', sub: 'Your fastest clear counts', onClick: startRun },
                    { label: 'Back to main', sub: 'The day’s full board', tone: 'main', href: '/' },
                  ]}
                />
              )}
            </div>
          </div>
        </div>

        {!STAGE && <GamePanel self="dario" name="Dario" onShow={() => setShowChrome(true)} />}
        <div style={{ display: (focusMode && !STAGE) ? 'none' : 'block' }}>
          {LOFT && (
            <div className={STAGE ? undefined : 'loft-report'}>
              <ReportIssue self="dario" name="Dario" accent="#ffffff" align="center" />
            </div>
          )}
          <div id="stf-stats-slot" />
          {!LOFT && (
            <DailyGamesGrid
              self="dario"
              maxWidth={620}
              challengeHref={`/duel/new?quiz=${encodeURIComponent(PUZZLE.quizId)}`}
              share={{ label: copied ? 'Copied' : 'Share', onClick: copyShare }}
              light
              divider
              boardSlot={<DailyBoardPanel self="dario" quizId={PUZZLE.quizId} maxWidth={620} streak={{ current: myStats.cur, best: myStats.max }} />}
            />
          )}
        </div>

        <StageFold />
        {/* Below the fold (owner, 2026-10-07): the play screen carries nothing but the game and Report an issue. */}
        <FastestList refreshKey={fastKey} myName={identity && identity.username} ink={INK} faded={FADED} surf={SURF} line={SURF_B} acc={ACC_INK} />

        {!focusMode && !identity && (
          <div id="daily-join" style={{ marginTop: 20 }}>
            <JoinLeaderboardForm hideIcon heading="Put your name on the speed board" identity={identity} onJoined={(u) => setIdentity(u)} />
          </div>
        )}

        {!focusMode && <AddToHome name="Dario" />}
        <section style={{ display: (focusMode && !STAGE) ? 'none' : 'block', maxWidth: 620, margin: '26px auto 0', fontSize: 13.5, lineHeight: 1.6, color: FADED }}>
          <h2 style={{ fontSize: 15, fontWeight: 800, color: INK, margin: '0 0 8px' }}>About Dario</h2>
          <p style={{ margin: '0 0 9px' }}>
            Dario is a free daily side-scrolling platformer from Mind Loft, drawn in 16-bit pixel art. Run, jump and stomp through three short levels of the AI race,
            past parody billboards for ClosedAI, Goggle, Teslo, DeepSink and Space-Y, and reach the AGI gate as fast as you can. Stomp SaaS bots and humanoid robots, dodge Teslo and Wayno robotaxis, and grab a GIGAWATT energy drink to throw energy bolts.
          </p>
          <p style={{ margin: '0 0 9px' }}>
            The course is remixed every day and is the same for every player, so the daily board is a straight race. Run it as often as you
            like; your fastest full clear takes the board, and the quickest clears ever made stay on the all-time list.
          </p>
          <p style={{ margin: 0 }}>
            The music is original chiptune arrangements of public-domain classics: Grieg&rsquo;s In the Hall of the Mountain King, Rimsky-Korsakov&rsquo;s
            Flight of the Bumblebee and Wagner&rsquo;s Ride of the Valkyries for the three levels, Elgar&rsquo;s Pomp and Circumstance for a win, and
            Gounod&rsquo;s Funeral March of a Marionette when a rival ships first.
            All companies named in the game are parodies.
          </p>
        </section>
      </div>

      {!playing && !endClosed && !LOFT && (
        <DailyEndCard
          modal
          self="dario"
          won={cleared}
          quizId={PUZZLE.quizId}
          completed
          score={res ? (res.cleared ? <>Cleared in {fmtRun(res.tenths)}</> : <>Reached {LEVEL_NAMES[Math.min(2, res.level)]}</>) : null}
          subline={res ? <>{res.gpus} GPUs · {res.deaths} lives lost</> : null}
          onShare={copyShare}
          shareLabel={copied ? 'Copied' : 'Share Result'}
          onReplay={startRun}
          onClose={() => setEndClosed(true)}
        />
      )}

      {showHelp && (
        <div onClick={() => { setShowHelp(false); try { localStorage.setItem(HELP_KEY, '1'); } catch (e) {} }}
          style={{ position: 'fixed', inset: 0, background: 'rgba(20,22,28,0.55)', zIndex: 70, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
          <div onClick={(e) => e.stopPropagation()} style={{ width: '100%', maxWidth: 460, background: STAGE ? 'var(--stg-raise,#0e131f)' : COLORS.cream, borderRadius: 12, border: STAGE ? '1px solid var(--stg-line)' : `2px solid ${COLORS.ink}`, padding: '20px 22px', fontFamily: SANS, maxHeight: '86vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', alignItems: 'center', marginBottom: 10 }}>
              <div style={{ fontSize: 21, fontWeight: 800, color: INK }}>How to play</div>
              <button onClick={() => { setShowHelp(false); try { localStorage.setItem(HELP_KEY, '1'); } catch (e) {} }} aria-label="Close" style={{ marginLeft: 'auto', background: 'none', border: 'none', cursor: 'pointer', color: FADED }}><X size={20} /></button>
            </div>
            {rulesBody}
            <button onClick={() => { setShowHelp(false); try { localStorage.setItem(HELP_KEY, '1'); } catch (e) {} }} style={{ ...btn, marginTop: 14, background: COLORS.ink, borderColor: COLORS.ink, color: T.white }}>Play</button>
          </div>
        </div>
      )}

      <style dangerouslySetInnerHTML={{ __html: `
        .dr-box { position: relative; display: grid; grid-template-columns: minmax(0, 1fr); justify-items: center; width: 100%; max-width: min(900px, calc((100svh - 170px) * 1.7857)); margin: 0 auto; line-height: 0; }
        .dr-cv { grid-area: cv; display: block; width: 100%; height: auto; aspect-ratio: 400 / 224; image-rendering: pixelated; image-rendering: crisp-edges; touch-action: none; background: #000; border-radius: 6px; }
        .dr-box { grid-template-areas: "cv"; }
        .dr-box.touch { max-width: 900px; grid-template-columns: 1fr 1fr; grid-template-areas: "cv cv" "pl pr"; gap: 10px; }
        .dr-pl { grid-area: pl; justify-self: start; display: flex; gap: 10px; line-height: normal; }
        .dr-pr { grid-area: pr; justify-self: end; display: flex; gap: 10px; line-height: normal; }
        .dr-b { width: 68px; height: 62px; border-radius: 14px; border: 1px solid var(--stg-cell-line, #cfd5df); background: var(--stg-cell, #ffffff); color: var(--stg-ink, #1c1f27); font: 800 15px ${SANS}; touch-action: none; user-select: none; -webkit-user-select: none; -webkit-touch-callout: none; cursor: pointer; }
        .dr-b.on { filter: brightness(.86); transform: translateY(1px); }
        .dr-run.lock { background: var(--stg-acc, #c2410c); border-color: var(--stg-acc, #c2410c); color: var(--stg-onramp, #ffffff); }
        .dr-jump { width: 92px; background: var(--stg-acc, #c2410c); border-color: var(--stg-acc, #c2410c); color: var(--stg-onramp, #ffffff); }
        /* Landscape on a phone or tablet: the controls sit BESIDE the screen, never on it. */
        @media (orientation: landscape) and (pointer: coarse) {
          .dr-box.touch { max-width: none; grid-template-columns: auto minmax(0, 1fr) auto; grid-template-areas: "pl cv pr"; align-items: end; gap: 12px; }
          .dr-box.touch .dr-cv { max-width: calc((100svh - 28px) * 1.7857); justify-self: center; }
          .dr-box.touch .dr-pl, .dr-box.touch .dr-pr { justify-self: auto; flex-direction: column; padding-bottom: 4px; }
          .dr-box.touch .dr-b { width: 64px; height: 58px; }
          .dr-box.touch .dr-jump { height: 76px; }
        }
        .dr-box:fullscreen, .dr-box:-webkit-full-screen { max-width: none; width: 100vw; height: 100vh; padding: 12px; box-sizing: border-box; background: #000; grid-template-columns: auto minmax(0, 1fr) auto; grid-template-areas: "pl cv pr"; align-items: center; gap: 12px; }
        .dr-box:fullscreen .dr-cv { max-width: calc((100vh - 24px) * 1.7857); justify-self: center; }
        .dr-box:fullscreen .dr-pl, .dr-box:fullscreen .dr-pr { flex-direction: column; }
        /* Full-screen play layer on phones and tablets: covers the whole window, controls beside the screen. */
        .dr-imm { position: fixed; top: 0; left: 0; right: 0; bottom: 0; z-index: 9999; background: #000; touch-action: none; overscroll-behavior: none; padding: env(safe-area-inset-top, 0px) env(safe-area-inset-right, 0px) env(safe-area-inset-bottom, 0px) env(safe-area-inset-left, 0px); }
        .dr-imm .dr-box, .dr-imm .dr-box.touch { position: relative; max-width: none; width: 100%; height: 100%; box-sizing: border-box; padding: 12px; grid-template-columns: 1fr 1fr; grid-template-rows: 1fr auto; grid-template-areas: "cv cv" "pl pr"; align-items: center; align-content: center; gap: 14px; }
        .dr-imm .dr-cv { width: 100%; max-width: calc((100svh - 150px) * 1.7857); justify-self: center; }
        .dr-imm .dr-b { background: #1c2030; color: #ffffff; border-color: #3a4358; width: 76px; height: 70px; }
        .dr-imm .dr-jump, .dr-imm .dr-run.lock { background: #c2410c; border-color: #c2410c; color: #ffffff; }
        .dr-imm .dr-jump { width: 104px; }
        .dr-ctl { position: absolute; top: 10px; right: 10px; z-index: 3; display: flex; gap: 8px; line-height: normal; }
        .dr-x { display: flex; align-items: center; justify-content: center; width: 40px; height: 40px; border-radius: 999px; border: 1px solid #3a4358; background: rgba(28,32,48,.85); color: #ffffff; font: 700 16px ${SANS}; line-height: 1; cursor: pointer; }
        .dr-rot { display: none; }
        @media (orientation: portrait) { .dr-imm .dr-rot { display: block; position: absolute; top: 20px; left: 14px; right: 160px; color: #9aa3bb; font: 700 12px ${SANS}; line-height: 1.3; } }
        @media (orientation: landscape) {
          .dr-imm .dr-box, .dr-imm .dr-box.touch { grid-template-columns: auto minmax(0, 1fr) auto; grid-template-rows: 1fr; grid-template-areas: "pl cv pr"; align-items: end; padding: 6px 10px; gap: 12px; }
          .dr-imm .dr-cv { align-self: center; max-width: calc((100svh - 16px) * 1.7857); }
          .dr-imm .dr-pl, .dr-imm .dr-pr { flex-direction: column; padding-bottom: 6px; }
          .dr-imm .dr-ctl { flex-direction: column; top: 8px; right: auto; left: 22px; }
          .dr-imm .dr-b { width: 64px; height: 60px; }
          .dr-imm .dr-jump { width: 64px; height: 90px; }
        }
        /* The start screen: the share card, then one big button. */
        .dr-hero { max-width: 900px; margin: 0 auto; border-radius: 12px; overflow: hidden; background: #12141c; box-shadow: 0 10px 30px rgba(0,0,0,.25); }
        .dr-hero-img { display: block; width: 100%; height: auto; aspect-ratio: 1200 / 630; image-rendering: pixelated; }
        .dr-hero-bar { display: flex; flex-direction: column; align-items: center; gap: 12px; padding: 16px 16px 18px; }
        .dr-start { width: min(100%, 420px); font-family: "Press Start 2P", ui-monospace, monospace; font-size: 22px; letter-spacing: .08em; color: #ffffff; background: #c2410c; border: 0; border-bottom: 6px solid #7c2d12; border-radius: 12px; padding: 18px 24px; cursor: pointer; }
        .dr-start:hover { filter: brightness(1.08); }
        .dr-start:active { transform: translateY(3px); border-bottom-width: 3px; }
        .dr-start:focus-visible { outline: 3px solid #f2c14e; outline-offset: 3px; }
        .dr-hero-row { display: flex; align-items: center; justify-content: center; flex-wrap: wrap; gap: 10px; color: #c9d2e0; font: 700 12px ${SANS}; line-height: 1.4; }
        .dr-hero-ic { display: flex; align-items: center; justify-content: center; width: 34px; height: 34px; border-radius: 999px; border: 1px solid #3a4358; background: #1c2030; color: #ffffff; cursor: pointer; }
      ` }} />

      {!STAGE && <div style={{ display: focusMode ? 'none' : 'block' }}><Footer /></div>}
    </div>
  );
}
