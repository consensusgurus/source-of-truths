'use client';

// Tangled — the daily rope untangling puzzle (owner, 2026-11-07).
//
// Rope ends sit in holes round a frame whose shape changes every day. Drag an
// end into an empty hole (or tap the end, then the hole). The board is solved
// when no two ropes cross. NO PAR (owner: "no one cares about par"): any solve
// scores 10 and the board ranks on TIME alone. Give up (tap twice) eases the
// ropes back to the untangled board and posts 0.
//
// The rules live in lib/tangled-engine.js; the board (physics, two-strand
// cords, the over/under) in app/tangled/TangledBoard.jsx. The shell is the
// white stage every newer daily wears (Simon's), and the Space Cadet run mounts
// this client through app/RunEmbed.jsx.

import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import { Smartphone } from 'lucide-react';
import useDuelContext, { DuelBanner } from '../quiz/[id]/useDuelContext';
import JoinLeaderboardForm from '../quiz/[id]/JoinLeaderboardForm';
import DailyRules from '../DailyRules';
import ReportIssue from '../ReportIssue';
import StageFold from '../StageFold';
import StageChrome from '../StageChrome';
import PlayStage from '../PlayStage';
import usePlayStageFit from '@/lib/play-stage-fit';
import { useStageTheme } from '@/lib/stage-theme';
import { useStageLook, isDarkLook } from '@/lib/stage-look';
import { gameColor, gameColorLight, gameOnrampLight, gameAccentInkLight } from '@/lib/category-ramp';
import useIqStanding from '../useIqStanding';
import useNextUnplayed, { useUnplayedSimilar } from '../useNextUnplayed';
import useDailyBoard from '../useDailyBoard';
import useGameAllTime from '../useGameAllTime';
import useDayStats from '../useDayStats';
import useCategoryRank from '../useCategoryRank';
import LoftFinish from '../LoftFinish';
import { CONTEST, contestIsLive } from '@/lib/contest';
import { isMobileDevice } from '@/lib/is-mobile';
import useAbandonFlush from '../quiz/[id]/useAbandonFlush';
import useEndHold, { HOLD_LONG } from '../useEndHold';
import { notifyShareCredit } from '../ShareCreditPop';
import { withRef } from '@/lib/referrals';
import { meRequest } from '@/app/quizMeClient';
import { endSolved } from '@/lib/end-verdict';
import { crossingCount, isSolved, SHAPE_NAME } from '@/lib/tangled-engine';
import { useRunEmbed, useRunHelp } from '../RunEmbed';
import { embedLook } from '../LogicStage';
import RunDoorPop from '../circuits/RunDoorPop';
import HelpSheet from '../HelpSheet';
import TangledBoard, { TANGLED_BOARD_CSS } from './TangledBoard';

const SANS = "'Manrope', system-ui, -apple-system, sans-serif";
const COLORS = { accent: '#0f766e', accentSoft: '#ccfbf1' };
const ARM_MIN_MS = 400;
const isIosDevice = () => typeof navigator !== 'undefined' && (/iPad|iPhone|iPod/.test(navigator.userAgent || '') || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1));
const HELP_KEY = 'sot_tangled_help_seen';
const STATS_KEY = 'sot_tangled_stats';
const WORDS = ['zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten'];

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
function fmtTime(ms) {
  const s = Math.max(0, Math.floor(ms / 1000));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
}

// ---- stats: the first result of each day counts ----------------------------
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
  const rec = (s && s.rec) || {};
  const nums = Object.keys(rec).map(Number).sort((a, b) => a - b);
  let cur = 0, at = rec[todayNum] ? todayNum : todayNum - 1;
  while (rec[at]) { cur++; at--; }
  return { played: nums.length, cur, rec };
}
function mergeServerStats(s, recent, puzzles) {
  if (!s || !Array.isArray(recent) || !recent.length) return s;
  const byQuiz = {};
  for (const p of puzzles) byQuiz[p.quizId] = p;
  let rec = s.rec, changed = false;
  for (const m of recent) {
    const p = m && byQuiz[m.quizId];
    if (!p || rec[p.num]) continue;
    const sc = Math.max(0, Math.round(((m.scorePct || 0) / 100) * 10));
    if (!changed) { rec = { ...rec }; changed = true; }
    rec[p.num] = { s: sc, t: 10, won: sc > 0 };
  }
  if (!changed) return s;
  const s2 = { ...s, rec };
  try { localStorage.setItem(STATS_KEY, JSON.stringify(s2)); } catch (e) {}
  return s2;
}

// v2 (2026-11-09) saves the wraps with the ropes. A v1 save in progress was
// made under the old rules, so it starts fresh; a finished v1 save is kept.
const freshG = () => ({ v: 2, status: 'playing', t0: null, tEnd: null, ropes: null, wraps: null, moves: 0 });

const HAPT = { move: [6], win: [20, 40, 20] };
function vibrate(p) { try { if (typeof navigator !== 'undefined' && navigator.vibrate) navigator.vibrate(p); } catch (e) {} }

export default function TangledClient({ puzzles = [], forceNum = null }) {
  const searchParams = useSearchParams();
  const PUZZLE = useMemo(() => pickPuzzle(puzzles, forceNum), [puzzles, forceNum]);
  const STORE_KEY = `sot_tangled_${PUZZLE.num}`;
  const REC_KEY = `sot_tangled_rec_${PUZZLE.num}`;
  const isTodays = PUZZLE.num === pickPuzzle(puzzles, null).num;
  const EMBED = useRunEmbed();

  const [g, setG] = useState(freshG);
  const gRef = useRef(g);
  const [hydrated, setHydrated] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const [gateRules, setGateRules] = useState(false);
  const [revealed, setRevealed] = useState(false);
  const [armGiveUp, setArmGiveUp] = useState(false);
  const [giveSeq, setGiveSeq] = useState(0);
  const [giving, setGiving] = useState(false);
  const [boardKey, setBoardKey] = useState(0);
  const [copied, setCopied] = useState(false);
  const [identity, setIdentity] = useState(null);
  const [stats, setStats] = useState(null);
  const [touchOnly, setTouchOnly] = useState(false);
  const [installEvt, setInstallEvt] = useState(null);
  const [showA2hsHelp, setShowA2hsHelp] = useState(false);
  const [standalone, setStandalone] = useState(false);
  const [practice, setPractice] = useState(false);
  useEffect(() => {
    try { setStandalone(window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true); } catch (e) {}
    const onBip = (e) => { e.preventDefault(); setInstallEvt(e); };
    const onInstalled = () => { setStandalone(true); setInstallEvt(null); };
    window.addEventListener('beforeinstallprompt', onBip);
    window.addEventListener('appinstalled', onInstalled);
    return () => { window.removeEventListener('beforeinstallprompt', onBip); window.removeEventListener('appinstalled', onInstalled); };
  }, []);
  const a2hsClick = () => { const e = installEvt; if (e) { setInstallEvt(null); e.prompt(); } else { setShowA2hsHelp(true); } };
  const [shareCta, setShareCta] = useState('Share');
  useEffect(() => { if (contestIsLive()) setShareCta(`Share for ${CONTEST.prizeLabel}*`); }, []);
  const viewedRef = useRef(false);
  const { duelToken, duelInfo, duelSubmitted } = useDuelContext(PUZZLE.quizId, searchParams);

  const commit = useCallback((next) => {
    gRef.current = next;
    setG(next);
    if (practice) return;
    try { localStorage.setItem(STORE_KEY, JSON.stringify(next)); } catch (e) {}
  }, [STORE_KEY, practice]);

  const playing = g.status === 'playing';
  const preStart = playing && !g.t0;
  const over = !playing;
  const won = g.status === 'won';
  const endHold = useEndHold();
  const holdEnd = endHold.hold;
  const STAGE_ACC = { '--stg-acc-dk': gameColor('tangled'), '--stg-acc-lt': gameColorLight('tangled'), '--stg-onramp-lt': gameOnrampLight('tangled'), '--stg-acc-ink-lt': gameAccentInkLight('tangled') };
  const [stageTheme] = useStageTheme();
  const [stageLook] = useStageLook();
  const look = EMBED ? embedLook(EMBED) : stageLook;
  const dark = isDarkLook(look);
  const INK = 'var(--stg-ink,#e9edf4)';
  const MUTE = 'var(--stg-mute,#8b95a8)';
  const active = !playing && !EMBED;
  const iq = useIqStanding({ game: 'tangled', quizId: PUZZLE.quizId, active });
  const prevPuzzle = puzzles.find((x) => x.num === PUZZLE.num - 1) || null;
  const nextUp = useNextUnplayed({ self: 'tangled', active });
  const upNext = useUnplayedSimilar({ self: 'tangled', active });
  const dailyBoard = useDailyBoard({ quizId: PUZZLE.quizId, active });
  const allTime = useGameAllTime({ game: 'tangled', active });
  const dayStats = useDayStats();
  const catRank = useCategoryRank({ self: 'tangled', active });
  const myStats = useMemo(() => deriveStats(stats || { rec: {} }, PUZZLE.num), [stats, PUZZLE.num]);

  // ---- hydrate -------------------------------------------------------------
  useEffect(() => {
    let saved = null;
    try { saved = JSON.parse(localStorage.getItem(STORE_KEY)); } catch (e) {}
    if (saved && saved.v === 1 && saved.status !== 'playing') saved = { ...saved, v: 2, ropes: null, wraps: null };
    if (saved && saved.v === 2) {
      let s = { ...freshG(), ...saved };
      if (s.status === 'playing' && Array.isArray(s.ropes) && !s.wraps) s = { ...s, ropes: null };
      // closed on the winning move: the move is saved, the status not yet turned
      if (s.status === 'playing' && Array.isArray(s.ropes) && isSolved(s.ropes, s.wraps)) s = { ...s, status: 'won', tEnd: s.tEnd || Date.now() };
      gRef.current = s; setG(s);
    }
    setStats(getStats());
    try { setIdentity(JSON.parse(localStorage.getItem('sot_quiz_identity'))); } catch (e) {}
    try { setTouchOnly(isMobileDevice()); } catch (e) {}
    setHydrated(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ---- identity + view ping -----------------------------------------------
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
      try {
        fetch('/api/quiz/view', { method: 'POST', keepalive: true, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ quizId: PUZZLE.quizId }) }).catch(() => {});
      } catch (e) {}
    }
  }, [hydrated, PUZZLE.quizId, puzzles]);

  // ---- the hub slate flag --------------------------------------------------
  useEffect(() => {
    if (!hydrated || !isTodays || practice) return;
    try {
      const done = g.status !== 'playing';
      if (done || g.t0) localStorage.setItem('sot_tangled_day', JSON.stringify({ d: etToday(), done }));
      else localStorage.removeItem('sot_tangled_day');
    } catch (e) {}
  }, [hydrated, isTodays, g.status, g.t0, practice]);

  const secsOf = (g2) => (g2.t0 ? Math.min(36000, Math.max(1, Math.round(((g2.tEnd || Date.now()) - g2.t0) / 1000))) : 1);

  // ---- abandon flush -------------------------------------------------------
  const abandon = useAbandonFlush(() => {
    const cur = gRef.current;
    if (practice || cur.status !== 'playing' || !cur.t0 || !cur.moves) return null;
    try { if (localStorage.getItem(REC_KEY)) return null; } catch (er) {}
    try { localStorage.setItem(REC_KEY, '1'); } catch (er) {}
    return {
      quizId: PUZZLE.quizId, score: 0, total: 10, correct: 0, guessesUsed: 0,
      timeElapsed: secsOf({ ...cur, tEnd: Date.now() }), abandoned: true,
      email: (identity && identity.email) || undefined, anonId: getAnonId(),
      isMobile: isMobileDevice(), referrer: (typeof document !== 'undefined' ? document.referrer : ''),
    };
  });

  const postResult = useCallback((g2, score) => {
    if (practice) return;
    abandon.markFlushed();
    if (!EMBED) holdEnd(HOLD_LONG);
    const el = secsOf(g2);
    try { setStats(recordStat(PUZZLE.num, { s: score, t: 10, el, won: score > 0 })); } catch (er) {}
    try {
      fetch('/api/quiz/result', {
        method: 'POST', keepalive: true, headers: { 'Content-Type': 'application/json' },
        // Ranked on time alone: every solve scores 10, and guesses stay 0 so
        // the board resolves every solver tie on the clock.
        body: JSON.stringify({
          quizId: PUZZLE.quizId, score, total: 10, correct: score > 0 ? 1 : 0, guessesUsed: 0, timeElapsed: el,
          email: (identity && identity.email) || undefined, anonId: getAnonId(),
          isMobile: isMobileDevice(), referrer: (typeof document !== 'undefined' ? document.referrer : ''),
        }),
      }).catch(() => {});
    } catch (er) {}
    if (EMBED) EMBED.onResult({ key: 'tangled', score, total: 10, won: score > 0, t0: g2.t0, tEnd: g2.tEnd || Date.now() });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [holdEnd, abandon, PUZZLE.quizId, PUZZLE.num, identity, EMBED, practice]);

  const startGame = useCallback(() => {
    const cur = gRef.current;
    if (cur.t0) return;
    try { localStorage.setItem(HELP_KEY, '1'); } catch (e) {}
    commit({ ...cur, t0: Date.now() });
  }, [commit]);
  useRunHelp(EMBED, () => setShowHelp(true));
  useEffect(() => { if (EMBED && EMBED.autostart && hydrated && preStart) startGame(); }, [EMBED, hydrated, preStart, startGame]);

  const onMove = useCallback((ropes, wraps, solved) => {
    const cur = gRef.current;
    if (cur.status !== 'playing') return;
    const g2 = { ...cur, ropes, wraps, moves: (cur.moves || 0) + 1, t0: cur.t0 || Date.now() };
    if (solved) {
      g2.status = 'won'; g2.tEnd = Date.now();
      vibrate(HAPT.win);
      postResult(g2, 10);
      // the last rope settles before the ending takes over
      setTimeout(() => commit(g2), 450);
      gRef.current = g2;
      return;
    }
    vibrate(HAPT.move);
    commit(g2);
  }, [commit, postResult]);

  const onGaveUp = useCallback(() => {
    const cur = gRef.current;
    if (cur.status !== 'playing') return;
    const g2 = { ...cur, status: 'gaveup', tEnd: cur.tEnd || Date.now() };
    setGiving(false);
    postResult(g2, 0);
    commit(g2);
  }, [commit, postResult]);

  const giveUp = useCallback(() => {
    if (gRef.current.status !== 'playing' || giving) return;
    if (!armGiveUp) { setArmGiveUp(Date.now()); return; }
    if (Date.now() - armGiveUp < ARM_MIN_MS) return;
    setArmGiveUp(false);
    // stop the clock now; the ropes ease home and then the ending lands
    gRef.current = { ...gRef.current, tEnd: Date.now() };
    setGiving(true);
    setGiveSeq((x) => x + 1);
  }, [armGiveUp, giving]);
  useEffect(() => {
    if (!armGiveUp) return undefined;
    const t = setTimeout(() => setArmGiveUp(false), 3500);
    return () => clearTimeout(t);
  }, [armGiveUp]);

  // Replay: the same board again, unscored and unsaved.
  const replay = useCallback(() => {
    endHold.release();
    setPractice(true);
    setRevealed(false);
    const n = { ...freshG(), t0: Date.now() };
    gRef.current = n; setG(n);
    setBoardKey((k) => k + 1);
  }, [endHold]);

  // ---- the clock -----------------------------------------------------------
  const [, setTick] = useState(0);
  useEffect(() => {
    if (!playing || !g.t0) return undefined;
    const iv = setInterval(() => setTick((x) => x + 1), 500);
    return () => clearInterval(iv);
  }, [playing, g.t0]);
  const clockMs = g.t0 ? ((g.tEnd || gRef.current.tEnd || Date.now()) - g.t0) : 0;
  const clockShown = fmtTime(clockMs);
  const crossing = crossingCount(g.ropes ? g.wraps : PUZZLE.wraps);

  // ---- share ---------------------------------------------------------------
  function shareUrl() {
    return withRef(`mindloftdaily.com/tangled${isTodays ? '' : `?p=${PUZZLE.num}`}`);
  }
  function shareText() {
    return won
      ? `Tangled #${PUZZLE.num} · ${PUZZLE.R} ropes untangled in ${clockShown}\n${shareUrl()}`
      : `Tangled #${PUZZLE.num} · still tangled\n${shareUrl()}`;
  }
  function copyShare() {
    const txt = over ? shareText() : `Tangled #${PUZZLE.num}, the daily rope untangling puzzle from Mind Loft. Same ropes for everybody.\n${shareUrl()}`;
    if (notifyShareCredit(txt)) return;
    try {
      if (isMobileDevice() && navigator.share) { navigator.share({ text: txt }).catch(() => {}); return; }
      navigator.clipboard.writeText(txt);
      setCopied(true); setTimeout(() => setCopied(false), 1600);
    } catch (e) {}
  }

  // ---- rules ---------------------------------------------------------------
  const rulesBody = (
    <DailyRules
      accent={COLORS.accent}
      accentSoft={COLORS.accentSoft}
      lead="Untangle the ropes so that no two of them cross."
      banner="Everyone gets the same ropes today, and the fastest solve takes the board."
      sub="There is no par and no move count. The clock is the whole score."
      steps={[
        <>Every rope runs between two <b>pegs</b> in holes round the frame, and there are always <b>two empty holes</b>.</>,
        <><b>Drag</b> a peg into an empty hole, or <b>tap</b> a peg and then tap an empty hole.</>,
        <>The ropes are <b>really wound</b> round each other. A peg you move is <b>lifted over</b> every rope in its way.</>,
        <>Lift a peg back over a rope it lies <b>on top of</b> and that crossing slides off. Lift it over a rope it lies <b>under</b> and the two wind one turn tighter.</>,
        <>The board is solved the moment <b>no two ropes cross</b>. Any untangled layout counts.</>,
      ]}
      knack="Follow a twist to its end and look at which rope is on top there. The peg on top is the one to move, back the way it came."
      footer="Ranked on time alone, from Start to the last rope. Four ropes on Monday, five midweek, six on Thursday and Friday, seven on Saturday and eight on Sunday, and the frame changes shape every day."
    />
  );

  const boardRef = useRef(null);
  const onStage = !!g.t0 && (playing || !revealed);
  const fit = usePlayStageFit(boardRef, '.tg-board', onStage && !EMBED);
  const board = (live) => (
    <div ref={live ? boardRef : undefined} className="tg-wrap">
      <TangledBoard key={`${PUZZLE.quizId}-${boardKey}${live ? '' : '-done'}`} puzzle={PUZZLE}
        ropes={live ? (g.ropes || null) : (won && g.ropes ? g.ropes : PUZZLE.solved)}
        wraps={live ? (g.wraps || null) : (won && g.ropes ? g.wraps : {})}
        live={live && playing && !giving} dark={dark} giveUpSeq={live ? giveSeq : 0}
        width={live && fit ? fit : null}
        onTouch={() => { if (!gRef.current.t0) startGame(); }}
        onMove={onMove} onGaveUp={onGaveUp} />
    </div>
  );

  const statusLine = giving ? 'Easing the ropes apart…'
    : crossing === 0 ? 'No ropes cross. Solved.'
      : `${crossing} crossing${crossing === 1 ? '' : 's'} left. Drag a peg into an empty hole.`;

  const stage = onStage ? (
    <PlayStage bg={gameColor('tangled')} label="Tangled" inline={!!EMBED} look={EMBED ? embedLook(EMBED) : null}
      eyebrow={`${SHAPE_NAME[PUZZLE.shape]} · ${WORDS[PUZZLE.R] || PUZZLE.R} ropes${practice ? ' · practice' : ''}`}
      top={board(true)}
      foot={playing ? statusLine : (won ? `Untangled in ${clockShown}.` : 'Still tangled.')}
      clock={clockShown}
      done={!playing}
      giveUp={playing && !giving ? { armed: !!armGiveUp, onPress: giveUp, armedLabel: 'Tap again to give up' } : null} />
  ) : null;

  return (
    <div className={`stage-page${EMBED ? ' lgs-hosted' : ''}`} data-stage-theme={EMBED ? (EMBED.theme || 'dark') : stageTheme}
      data-stage-pin={EMBED ? '' : undefined}
      style={{ ...STAGE_ACC, minHeight: EMBED ? 0 : '100vh', position: 'relative', background: EMBED ? 'transparent' : 'var(--stg-ground)', color: INK, overflowX: 'hidden' }}>
      <style dangerouslySetInnerHTML={{ __html: TANGLED_BOARD_CSS }} />
      {stage}
      {!EMBED && (
        <StageChrome gameKey="tangled" quizId={PUZZLE.quizId}
          name="Tangled"
          cat="Visual"
          outcome={playing ? null : (won ? 'won' : 'lost')}
          num={PUZZLE.num}
          tiles={playing ? null : upNext}
          dateLabel={PUZZLE.dateLabel}
          onHelp={() => setShowHelp(true)}
          sunday={null}
          figures={[
            { v: playing ? `${crossing}` : (won ? 'Solved' : 'Unfinished'), k: playing ? 'crossings' : 'result' },
            { v: clockShown, k: 'time' },
          ]}
        />
      )}
      <div className="tg-page" style={{ position: 'relative', zIndex: 2, maxWidth: 1180, margin: '0 auto', padding: EMBED ? '0' : '18px 24px 80px', fontFamily: SANS }}>
        <div>
          {preStart && !(EMBED && EMBED.autostart) && (
            <div className="stg-gate" style={{ maxWidth: 640, margin: '0 auto 16px', background: 'var(--stg-surf,#fff)', border: '1px solid var(--stg-line,rgba(11,15,26,.14))', borderRadius: 12, padding: 22, display: 'flex', flexDirection: 'column' }}>
              <div style={{ fontSize: 20, fontWeight: 800, color: INK, marginBottom: 10 }}>{gateRules ? 'How to play' : `Tangled No. ${PUZZLE.num}`}</div>
              {gateRules ? rulesBody : (
                <div style={{ fontSize: 14, lineHeight: 1.55, color: INK, fontWeight: 600 }}>
                  <p style={{ margin: 0 }}>Today: {WORDS[PUZZLE.R] || PUZZLE.R} ropes on a {SHAPE_NAME[PUZZLE.shape].toLowerCase()}. Drag the pegs into empty holes until no two ropes cross. The clock starts on Start and the fastest solve wins.</p>
                </div>
              )}
              <div style={{ marginTop: 18, display: 'flex', flexDirection: 'row-reverse', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
                <button className="tg-btn" onClick={startGame}>Start</button>
                <button type="button" className="tg-link" onClick={() => setGateRules((v) => !v)}>{gateRules ? 'Back' : 'How to play'}</button>
              </div>
            </div>
          )}
          {over && !EMBED && !endHold.held && revealed && (
            <div className="stg-board" style={{ maxWidth: 560, margin: '0 auto 12px' }}>
              {board(false)}
              <p style={{ textAlign: 'center', fontSize: 14, fontWeight: 700, color: INK, margin: '12px 0 0' }}>
                {won ? `Untangled in ${clockShown}.` : 'The ropes eased apart for you. One untangled layout is shown.'}
              </p>
            </div>
          )}
          {over && !EMBED && !endHold.held && revealed && (
            <button className="stf-hideboard" onClick={() => setRevealed(false)}>&#8630; Hide the board</button>
          )}
          {over && !EMBED && !endHold.held && (
            <LoftFinish
              name="Tangled"
              catRank={catRank}
              outcome={won ? 'won' : 'lost'}
              title={endSolved(won)}
              detail={won ? `${WORDS[PUZZLE.R] || PUZZLE.R} ropes · ${clockShown}` : 'Gave up'}
              iq={iq}
              board={dailyBoard}
              gameRank={allTime && allTime.ready
                ? { value: allTime.rank != null ? `#${Number(allTime.rank).toLocaleString()}` : '–',
                    label: allTime.field != null ? `of ${Number(allTime.field).toLocaleString()} Tangled all time` : 'all-time rank' }
                : null}
              day={dayStats}
              streak={isTodays ? myStats.cur : null}
              missLabel={null}
              archive={puzzles
                .filter((p) => p.live <= etToday() && p.num !== PUZZLE.num)
                .sort((x, y) => y.num - x.num)
                .map((p) => ({
                  num: p.num,
                  dateLabel: p.dateLabel,
                  sunday: !!p.sunday,
                  href: `/tangled?p=${p.num}`,
                  done: !!(myStats.rec && myStats.rec[p.num]),
                  score: (myStats.rec && myStats.rec[p.num]) ? myStats.rec[p.num].s : null,
                }))}
              options={[
                { tone: 'board', label: won ? 'See the board' : 'Show a solve', sub: won ? 'Your untangled ropes' : 'One untangled layout', onClick: () => setRevealed(true) },
                prevPuzzle && { tone: 'another', label: 'Play another Tangled', sub: `No. ${prevPuzzle.num}, ${prevPuzzle.dateLabel}`, href: `/tangled?p=${prevPuzzle.num}` },
                nextUp && { tone: 'similar', label: 'Play similar', sub: `${nextUp.name} · ${nextUp.tag}`, href: nextUp.href },
                { label: copied ? 'Copied' : (shareCta || 'Share'), sub: 'Your result, no spoilers', kind: 'gold', onClick: copyShare },
                { tone: 'replay', label: 'Replay', sub: 'This board again, unscored', onClick: replay },
                { label: 'Back to main', sub: 'The day’s full board', tone: 'main', href: '/' },
              ]}
            />
          )}
        </div>

        {!EMBED && (
          <div style={{ margin: '30px auto 0', maxWidth: 680 }}>
            <ReportIssue self="tangled" name="Tangled" accent="#ffffff" align="center" onHelp={() => setShowHelp(true)} />
            {over && touchOnly && !standalone && (
              <div style={{ textAlign: 'center', marginTop: 16 }}>
                <button className="tg-tool" onClick={a2hsClick}><Smartphone size={14} /> Add to Home Screen</button>
              </div>
            )}
            <div id="stf-stats-slot" />
          </div>
        )}

        {showA2hsHelp && (
          <div onClick={() => setShowA2hsHelp(false)} style={{ position: 'fixed', inset: 0, background: 'rgba(20,22,28,0.55)', zIndex: 90, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
            <div onClick={(e) => e.stopPropagation()} style={{ background: 'var(--stg-raise,#fff)', border: '1px solid var(--stg-ink,#08222e)', borderRadius: 16, padding: 20, maxWidth: 380, fontFamily: SANS }}>
              <div style={{ fontSize: 17, fontWeight: 800, color: INK, marginBottom: 8 }}>Add Tangled to your home screen</div>
              <p style={{ fontSize: 13.5, fontWeight: 600, color: INK, lineHeight: 1.55, margin: '0 0 14px' }}>
                {isIosDevice() ? 'Tap the Share button in Safari, scroll down, and choose Add to Home Screen.' : 'Open your browser menu and choose Install app, or Add to Home screen.'}
              </p>
              <button className="tg-tool" onClick={() => setShowA2hsHelp(false)}>Got it</button>
            </div>
          </div>
        )}
        {over && !EMBED && !identity && (
          <div id="daily-join" style={{ margin: '18px auto 0', maxWidth: 680 }}>
            <JoinLeaderboardForm hideIcon heading="See your stats and join the leaderboard" identity={identity} onJoined={(u) => setIdentity(u)} />
          </div>
        )}
      </div>
      {!EMBED && <DuelBanner token={duelToken} info={duelInfo} submitted={duelSubmitted} />}
      <RunDoorPop id="spacecadet" game="tangled" ready={hydrated && preStart && isTodays && !EMBED} self="Tangled" />

      {showHelp && (
        <HelpSheet onClose={() => { setShowHelp(false); try { localStorage.setItem(HELP_KEY, '1'); } catch (e) {} }} self="tangled" name="Tangled">
          {rulesBody}
        </HelpSheet>
      )}

      {!EMBED && <StageFold />}
      {!EMBED && (
        <section style={{ maxWidth: 640, margin: '0 auto', padding: '10px 24px 42px', fontFamily: SANS }}>
          <h2 style={{ fontSize: 17, fontWeight: 800, color: INK, margin: '0 0 8px' }}>About Tangled</h2>
          <p style={{ fontSize: 13.5, fontWeight: 600, color: MUTE, lineHeight: 1.6, margin: '0 0 9px' }}>
            Tangled is a free daily rope puzzle from Mind Loft. Ropes run between pegs set in holes round a frame, really
            wound round each other. A peg you move is lifted over the ropes in its way, so a twist has to be unwound the
            way it went in. Move the pegs into the empty holes until no two ropes cross, and the fastest untangling of
            the day takes the board.
          </p>
          <p style={{ fontSize: 13.5, fontWeight: 600, color: MUTE, lineHeight: 1.6, margin: '0 0 9px' }}>
            The frame changes shape every day: a circle, a hexagon, a square, a triangle, a rectangle, a diamond or a
            pentagon. Monday has four ropes and the week builds to eight on Sunday. Every board is made by tangling an
            untangled one, so every board can be solved, and any layout with no crossings counts.
          </p>
          <p style={{ fontSize: 13.5, fontWeight: 600, color: MUTE, lineHeight: 1.6, margin: 0 }}>
            Tangled is the third leg of <a href="/spacecadet" style={{ color: INK }}>Space Cadet</a>, the daily spatial run.
            More spatial puzzles: <a href="/roll" style={{ color: INK }}>Roll</a>,{' '}
            <a href="/parker" style={{ color: INK }}>Parker</a> and{' '}
            <a href="/topple" style={{ color: INK }}>Topple</a>.
          </p>
        </section>
      )}

      <style dangerouslySetInnerHTML={{ __html: `
        @media(max-width:560px){.tg-page{padding-left:10px !important;padding-right:10px !important;}}
        .tg-btn{font-family:${SANS};font-weight:800;font-size:15px;border:2px solid var(--stg-acc-ink, var(--stg-acc));background:var(--stg-acc);color:var(--stg-onramp, #08222e);border-radius:999px;padding:11px 24px;cursor:pointer;}
        .tg-link{background:none;border:none;padding:0;cursor:pointer;font-family:${SANS};font-size:13px;font-weight:700;color:${MUTE};text-decoration:underline;}
        .tg-tool{font-family:${SANS};font-weight:800;font-size:13.5px;border:1.5px solid var(--stg-cell-line, rgba(28,30,36,.35));background:transparent;color:${INK};border-radius:999px;padding:0 15px;min-height:44px;cursor:pointer;display:inline-flex;align-items:center;justify-content:center;gap:6px;}
        .tg-wrap{display:flex;flex-direction:column;align-items:center;width:100%;}
      ` }} />
    </div>
  );
}
