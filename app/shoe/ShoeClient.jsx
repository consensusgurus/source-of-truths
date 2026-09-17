'use client';

// Shoe — the daily blackjack shoe.
//
// One fixed shoe per day, the same cards in the same order for every player:
// five hands of blackjack off a 36-card shoe on a weekday, seven hands off the
// ENTIRE 52-card deck on the Sunday Edition. Hit, stand, or double; the dealer
// peeks and stands on all 17s; blackjack pays 3:2; no splits. The fixed shoe
// is what turns blackjack from luck into a decision game a leaderboard can
// rank — and the skill is the count, because every card you have seen changes
// what is left.
//
// Scoring is the Hands par/ace model: par is basic strategy played blind on
// this exact shoe (scores 8), ace is the best of 600 blind runs (scores 10),
// and the exact clairvoyant ceiling is a footnote, never a target. The whole
// game is a pure function of the decision strings (app/shoe/rules.js
// `replay`), which is what makes the save file tiny and every banked claim
// verifiable.
//
// Same daily plumbing as every other board: banked puzzles gated by Eastern
// date on the server (app/shoe/page.js), per-puzzle localStorage saves,
// /shoe?p=N archive pinning, streaks, and the shared /api/quiz/* flow.

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useSearchParams } from 'next/navigation';
import { X, Smartphone } from 'lucide-react';
import Grain from '../Grain';
import DailyRules from '../DailyRules';
import Footer from '../Footer';
import useDuelContext, { DuelBanner } from '../quiz/[id]/useDuelContext';
import JoinLeaderboardForm from '../quiz/[id]/JoinLeaderboardForm';
import DailyGamesGrid from '../DailyGamesGrid';
import ReportIssue from '../ReportIssue';
import StageFold from '../StageFold';
import DailyEndCard from '../DailyEndCard';
import DailyChrome from '../DailyChrome';
import DailyBoardPanel from '../quiz/[id]/DailyBoardPanel';
import { isMobileDevice } from '@/lib/is-mobile';
import useAbandonFlush from '../quiz/[id]/useAbandonFlush';
import { withRef } from '@/lib/referrals';
import { notifyShareCredit } from '../ShareCreditPop';
import DailyMasthead from '../DailyMasthead';
import LoftCap from '../LoftCap';
import StageChrome from '../StageChrome';
import { isStage } from '@/lib/stage';
import { useStageTheme } from '@/lib/stage-theme';
import { gameColor, gameColorLight, RAMP_INK, STAGE_GROUND, gameOnrampLight, gameAccentInkLight } from '@/lib/category-ramp';
import GamePanel from '../GamePanel';
import LoftFinish from '../LoftFinish';
import { CONTEST, contestIsLive } from '@/lib/contest';
import useIqStanding from '../useIqStanding';
import useNextUnplayed, { useUnplayedSimilar } from '../useNextUnplayed';
import useDailyBoard from '../useDailyBoard';
import useGameAllTime from '../useGameAllTime';
import useDayStats from '../useDayStats';
import useCategoryRank from '../useCategoryRank';
import { isLoft } from '@/lib/loft';
import { T } from '@/lib/theme';
import { meRequest } from '@/app/quizMeClient';
import {
  RANK_LABEL, SUIT_PIP, rankOf, suitOf, isRed,
  replay, handTotal, scoreForPoints, fmtChips,
} from './rules';

// Shoe identity is MARINE, the deep blue of a card-room table at night —
// distinct from both Cards siblings (Taire green, Hands wine) and from the
// lighter blues already on the roster (Stet, Ping, Sixes).
const ACCENT = '#0c4a6e';
const COLORS = {
  cream: T.surface, paper: T.paper, ink: T.ink, ember: T.accent,
  rust: T.danger, faded: T.muted,
  accent: ACCENT,
  accentSoft: '#e8f3fa',
  green: T.successDeep,
  gold: '#b45309',
};
// The felt carried no information and was the largest object in the game, so it is
// a surface now, and the table's EDGE carries the category instead. A card face
// is light in either register, so it takes the same token a chessboard's light
// square does. Loft (?stage=0) still renders the original felt via the fallback.
const FELT = 'var(--stg-surf2, #0d5175)';
const FELT_EDGE = 'color-mix(in srgb, var(--stg-acc, #082f49) 60%, transparent)';
const CARD_FACE = 'var(--stg-sq-l, #fdfcf9)';
const CARD_EDGE = 'rgba(20,22,28,0.30)';
const RED_PIP = 'var(--stg-bad, #c8282e)';
const BLACK_PIP = T.ink;

const SANS = "'Manrope', system-ui, -apple-system, sans-serif";
const MONO = "'DM Mono', ui-monospace, 'SFMono-Regular', monospace";
const HELP_KEY = 'sot_shoe_help_seen';
const STATS_KEY = 'sot_shoe_stats';

function pickPuzzle(puzzles, forceNum) {
  if (!puzzles.length) return null;
  if (forceNum) {
    const hit = puzzles.find((p) => p.num === forceNum);
    if (hit) return hit;
  }
  return puzzles[puzzles.length - 1];
}
function etToday() {
  try { return new Date().toLocaleDateString('en-CA', { timeZone: 'America/New_York' }); }
  catch (e) { return new Date().toISOString().slice(0, 10); }
}
function fmtTime(ms) {
  const s = Math.max(0, Math.floor(ms / 1000));
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
  const beat = nums.filter((n) => rec[n].won).length;
  let max = 0, run = 0, prev = null;
  for (const n of nums) {
    run = prev != null && n === prev + 1 ? run + 1 : 1;
    if (run > max) max = run;
    prev = n;
  }
  let cur = 0, at = rec[todayNum] ? todayNum : todayNum - 1;
  while (rec[at]) { cur++; at--; }
  return { played, beat, cur, max };
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
    rec[p.num] = { s: sc, t: 10, g: null, won: sc >= 8 };
  }
  if (!changed) return s;
  const s2 = { ...s, rec };
  try { localStorage.setItem(STATS_KEY, JSON.stringify(s2)); } catch (e) {}
  return s2;
}

const HAPT = { ok: [7], miss: [30], win: [10, 40, 20, 40, 20, 60] };
function vibrate(p) { try { if (typeof navigator !== 'undefined' && navigator.vibrate) navigator.vibrate(p); } catch (e) {} }

const isIosDevice = () =>
  typeof navigator !== 'undefined' &&
  (/iPad|iPhone|iPod/.test(navigator.userAgent || '') ||
    (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1));

const freshState = () => ({ v: 1, acts: [], status: 'playing', t0: null, tEnd: null });

function CardFace({ card, down = false }) {
  if (down) {
    return (
      <div className="sh-card sh-back" aria-label="Face-down card" />
    );
  }
  const red = isRed(card);
  return (
    <div className="sh-card" style={{ color: red ? RED_PIP : BLACK_PIP }}>
      <span className="sh-rank">{RANK_LABEL[rankOf(card)]}</span>
      <span className="sh-suit">{SUIT_PIP[suitOf(card)]}</span>
    </div>
  );
}

export default function ShoeClient({ puzzles = [], forceNum = null }) {
  const PUZZLE = useMemo(() => pickPuzzle(puzzles, forceNum), [puzzles, forceNum]);
  const HANDS = PUZZLE.hands;
  const STORE_KEY = `sot_shoe_${PUZZLE.num}`;

  const [g, setG] = useState(freshState);
  const [showHelp, setShowHelp] = useState(false);
  const [gateRules, setGateRules] = useState(false);
  const [copied, setCopied] = useState(false);
  const [endClosed, setEndClosed] = useState(false);
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
  const viewedRef = useRef(false);
  const gRef = useRef(g);

  const [showChrome, setShowChrome] = useState(false);
  const playing = g.status === 'playing';
  const preStart = playing && !g.t0;
  const started = playing && !!g.t0;
  const focusMode = playing && !showChrome;
  const won = g.status === 'won';

  // The whole table, derived: replay IS the game.
  const R = useMemo(() => replay(PUZZLE.shoe, HANDS, g.acts), [PUZZLE, HANDS, g.acts]);
  const chips = R.chips;
  const finalScore = playing ? null : scoreForPoints(chips, PUZZLE.par, PUZZLE.ace, HANDS);
  const cur = R.hands[R.hands.length - 1] || null;
  const handNo = Math.min(R.hands.length, HANDS);
  const cardsLeft = PUZZLE.shoe.length - R.pos;

  const LOFT = isLoft('shoe');
  const STAGE = isStage('shoe', searchParams);
  const STAGE_C = STAGE ? 'var(--stg-acc)' : gameColor('shoe');
  const Cap = STAGE ? StageChrome : LoftCap;
  const STAGE_ACC = { '--stg-acc-dk': gameColor('shoe'), '--stg-acc-lt': gameColorLight('shoe'), '--stg-onramp-lt': gameOnrampLight('shoe'), '--stg-acc-ink-lt': gameAccentInkLight('shoe') };
  const [stageTheme] = useStageTheme();
  const INK = STAGE ? 'var(--stg-ink,#e9edf4)' : COLORS.ink;
  const FADED = STAGE ? 'var(--stg-mute,#8b95a8)' : COLORS.faded;
  const SURF = STAGE ? 'var(--stg-surf,rgba(255,255,255,0.045))' : T.white;
  const SURF_B = STAGE ? 'var(--stg-line,rgba(255,255,255,0.11))' : 'rgba(28,30,36,0.42)';
  const ACC = STAGE ? STAGE_C : COLORS.accent;
  const ACC_DEEP = STAGE ? STAGE_C : COLORS.accentDeep;
  const ACC_SOFT = STAGE ? 'var(--stg-line,rgba(255,255,255,0.11))' : COLORS.accentSoft;
  const ON_ACC = STAGE ? 'var(--stg-onramp, #08222e)' : 'var(--white)';
  const [revealed, setRevealed] = useState(false);
  const [shareCta, setShareCta] = useState('Share');
  useEffect(() => {
    if (contestIsLive()) setShareCta(`Share for ${CONTEST.prizeLabel}*`);
  }, []);
  const iq = useIqStanding({ game: 'shoe', quizId: PUZZLE.quizId, active: LOFT && !playing });
  const nextUp = useNextUnplayed({ self: 'shoe', active: LOFT && !playing });
  const upNext = useUnplayedSimilar({ self: 'shoe', active: LOFT && !playing });
  const dailyBoard = useDailyBoard({ quizId: PUZZLE.quizId, active: LOFT && !playing });
  const allTime = useGameAllTime({ game: 'shoe', active: LOFT && !playing });
  const dayStats = useDayStats();
  const catRank = useCategoryRank({ self: 'shoe', active: LOFT && !playing });

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

  // ---- persistence ----
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORE_KEY);
      if (raw) {
        const saved = JSON.parse(raw);
        if (saved && saved.v === 1 && Array.isArray(saved.acts) && saved.acts.every((a) => typeof a === 'string' && /^[HSD]*$/.test(a))) {
          const test = replay(PUZZLE.shoe, HANDS, saved.acts);
          if (!test.invalid) setG({ ...freshState(), ...saved });
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
    // same-device day breadcrumb — TODAY'S puzzle only, and only once the
    // clock is actually running (t0): a save says 'playing' from the first
    // render whether or not anyone has moved.
    try {
      if (PUZZLE.num === pickPuzzle(puzzles, null).num) {
        const done = g.status !== 'playing';
        if (done || g.t0) localStorage.setItem('sot_shoe_day', JSON.stringify({ d: etToday(), done }));
        else localStorage.removeItem('sot_shoe_day');
      }
    } catch (e) {}
  }, [g, hydrated, STORE_KEY, PUZZLE, puzzles]);

  // Live game clock (display only; the recorded time is a real delta).
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

  // ---- metrics + leaderboard (the shared /api/quiz/* flow) ----
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
              setStats((curS) => mergeServerStats(curS || getStats(), d.recent, puzzles));
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

  const elapsed = g.t0 ? fmtTime((g.tEnd || nowTick) - g.t0) : '0:00';
  const isTodays = PUZZLE.num === pickPuzzle(puzzles, null).num;
  const prevPuzzle = puzzles.find((x) => x.num === PUZZLE.num - 1) || null;
  const myStats = deriveStats(stats, pickPuzzle(puzzles, null).num);

  const REC_KEY = `sot_shoe_rec_${PUZZLE.num}`;
  const abandon = useAbandonFlush(() => {
    // A play counts only once the player actually acts: opening the page and
    // reading the gate is not a start.
    const cs = gRef.current;
    if (!cs.t0 || cs.status !== 'playing' || !cs.acts.length) return null;
    try { if (localStorage.getItem(REC_KEY)) return null; } catch (e) {}
    const el = Math.min(36000, Math.max(1, Math.round((Date.now() - (cs.t0 || Date.now())) / 1000)));
    try { localStorage.setItem(REC_KEY, '1'); } catch (e) {}
    return { quizId: PUZZLE.quizId, score: 0, total: 10, correct: 0, guessesUsed: 0, timeElapsed: el, abandoned: true, email: identity?.email || undefined, anonId: getAnonId(), isMobile: isMobileDevice(), referrer: (typeof document !== 'undefined' ? document.referrer : '') };
  });

  function postResult(g2, r2) {
    abandon.markFlushed();
    const score = scoreForPoints(r2.chips, PUZZLE.par, PUZZLE.ace, HANDS);
    const el = g2.t0 ? Math.max(1, Math.round(((g2.tEnd || Date.now()) - g2.t0) / 1000)) : 1;
    try { setStats(recordStat(PUZZLE.num, { s: score, t: 10, g: r2.chips, won: r2.chips >= PUZZLE.par })); } catch (e) {}
    try {
      fetch('/api/quiz/result', {
        method: 'POST', keepalive: true, headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ quizId: PUZZLE.quizId, score, total: 10, correct: r2.chips >= PUZZLE.par ? 1 : 0, guessesUsed: r2.busts, timeElapsed: el, email: identity?.email || undefined, anonId: getAnonId(), isMobile: isMobileDevice(), referrer: (typeof document !== 'undefined' ? document.referrer : '') }),
      })
        .then((r) => r.json())
        .then((d) => { if (d && !d.error) setBoard({ ...EMPTY_BOARD, ...d }); })
        .catch(() => {});
    } catch (e) {}
  }

  // Pressing Start deals the first hand and starts the clock. A no-op once
  // started, so re-reading the rules never resets the timer.
  function startGame() {
    const curG = gRef.current;
    if (curG.t0) return;
    setG({ ...curG, t0: Date.now(), acts: curG.acts.length ? curG.acts : [''] });
    try { localStorage.setItem(HELP_KEY, '1'); } catch (e) {}
  }

  // Apply new decision strings and settle the day if they end it.
  function advance(acts) {
    const g2 = { ...gRef.current, acts };
    const r2 = replay(PUZZLE.shoe, HANDS, acts);
    if (r2.invalid) return; // the UI never produces this
    const last = r2.hands[r2.hands.length - 1];
    const wasSettled = R.hands.filter((hd) => hd.settled).length;
    const nowSettled = r2.hands.filter((hd) => hd.settled).length;
    if (last && nowSettled > wasSettled) {
      vibrate(last.net > 0 ? HAPT.ok : last.net < 0 ? HAPT.miss : [4]);
    }
    if (r2.phase === 'over') {
      const doneG = { ...g2, status: r2.chips >= PUZZLE.par ? 'won' : 'done', tEnd: Date.now() };
      if (r2.chips >= PUZZLE.par) vibrate(HAPT.win);
      postResult(doneG, r2);
      setG(doneG);
      return;
    }
    setG(g2);
  }

  function act(ch) {
    if (!playing || R.phase !== 'act' || !R.legal.includes(ch)) return;
    const acts = gRef.current.acts.slice();
    acts[acts.length - 1] += ch;
    advance(acts);
  }
  function dealNext() {
    if (!playing || R.phase !== 'settled') return;
    advance(gRef.current.acts.concat(''));
  }

  function shareText() {
    // One emoji per hand: win green, loss red, push white, blackjack gold.
    // Nothing about the cards leaks.
    const marks = R.hands.map((hd) => {
      if (hd.net > 0) return hd.net === 15 ? '\u{1F7E8}' : '\u{1F7E9}';
      if (hd.net < 0) return '\u{1F7E5}';
      return '⬜';
    }).join('');
    const streakBit = isTodays && myStats.cur >= 2 ? ` · streak ${myStats.cur}` : '';
    const head = `Shoe #${PUZZLE.num}${PUZZLE.sunday ? ' · Sunday' : ''} · bank ${fmtChips(chips)} · ${finalScore != null ? `${finalScore}/10` : ''} in ${elapsed}${streakBit}`;
    return `${head}\n${marks}\n${shareUrl()}`;
  }
  function shareUrl() {
    return withRef(`mindloftdaily.com/shoe${isTodays ? '' : `?p=${PUZZLE.num}`}`);
  }
  function copyShare() {
    const text = playing
      ? `Shoe #${PUZZLE.num} — the daily blackjack shoe from Mind Loft. Same cards, same order, for everyone.\n${shareUrl()}`
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

  function resetGame() {
    try { localStorage.removeItem(STORE_KEY); } catch (e) {}
    setG(freshState()); setEndClosed(false); setRevealed(false);
  }

  const dealerUpVal = cur ? RANK_LABEL[rankOf(cur.d[0])] : '';

  const rulesBody = (
    <DailyRules
      accent={COLORS.accent} accentSoft={COLORS.accentSoft}
      lead={`${HANDS} hands of blackjack against the dealer, all dealt from ONE fixed shoe: the same cards in the same order for every player today. Beat the dealer's total without going over 21.`}
      steps={[
        <><b>Hit</b> takes a card, <b>Stand</b> keeps your total, <b>Double</b> doubles your 10-chip stake for exactly one more card (first two cards only). Blackjack, an ace plus a ten-card, pays 15.</>,
        <>The dealer stands on <b>every 17</b> and draws to 16. If you bust, the hand is over and the dealer draws nothing. No splits.</>,
        <>The shoe is the skill: <b>{PUZZLE.shoe.length} cards{PUZZLE.sunday ? ', the entire deck' : ' off one standard deck, 16 never in play'}</b>. Count what you have seen, because it changes what is left.</>,
      ]}
      knack="The book line (basic strategy) banks par exactly. To beat it, deviate when the cards already on the table say so: stand a stiff 15 while the tens are still buried, hit it once they are gone."
      footer={`Your score is 1 to 10: matching par scores 8 and the ace line scores 10. Busts then time break ties, and only your first attempt counts. Sundays deal seven hands off the entire 52-card deck, so a perfect counter knows exactly what is left.`}
    />
  );

  return (
    <div className={STAGE ? 'stage-page' : (LOFT ? 'loft-page' : undefined)}
      data-stage-theme={STAGE ? stageTheme : undefined}
      style={{ ...(STAGE ? STAGE_ACC : null), minHeight: '100vh', background: STAGE ? 'var(--stg-ground)' : T.surface, color: STAGE ? 'var(--stg-ink,#e9edf4)' : undefined, position: 'relative', overflowX: (STAGE || LOFT) ? 'hidden' : undefined }}>
      {!STAGE && <Grain />}
      {!STAGE && (
      <DailyChrome slug="shoe" name="Shoe" collapsed={started} loft={LOFT} />
      )}
      {LOFT && (
        <Cap gameKey="shoe" quizId={PUZZLE.quizId}
          name="Shoe"
          cat="Cards"
          outcome={playing ? null : (won ? 'won' : (finalScore > 0 ? 'part' : 'lost'))}
          num={PUZZLE.num}
          tiles={playing ? null : upNext}
          dateLabel={PUZZLE.dateLabel}
          onHelp={() => setShowHelp(true)}
          sunday={PUZZLE.sunday ? 'Sunday Edition · 7 hands, the whole deck' : null}
          figures={playing
            ? [
              { v: fmtChips(chips), k: 'bank' },
              { v: `${handNo || 0}/${HANDS}`, k: 'hand' },
              { v: elapsed, k: 'time' },
            ]
            : [
              { v: finalScore, k: 'score' },
              { v: fmtChips(chips), k: 'bank' },
              { v: `${fmtChips(PUZZLE.par)} · ${fmtChips(PUZZLE.ace)}`, k: 'par · ace' },
              { v: elapsed, k: 'time' },
            ]}
        />
      )}
      <div className="sho-wrap" style={{ position: 'relative', zIndex: 2, maxWidth: 1180, margin: '0 auto', padding: '18px 38px 80px', fontFamily: SANS }}>
        <style dangerouslySetInnerHTML={{ __html: `
          @media(max-width:560px){.sho-wrap{padding-left:10px !important;padding-right:10px !important;}}
          .sho-btn{font-family:${SANS};font-weight:800;font-size:14px;border:2px solid ${STAGE ? 'var(--stg-line2)' : 'var(--blue-deep)'};background:${STAGE ? 'transparent' : 'var(--white)'};color:${STAGE ? 'var(--stg-ink)' : 'var(--blue-deep)'};border-radius:8px;padding:9px 16px;cursor:pointer;display:inline-flex;align-items:center;gap:7px;}
          .sho-btn:hover{background:var(--stg-surf2, ${COLORS.accentSoft});}
          .sh-felt{background:${FELT};border:10px solid ${FELT_EDGE};border-radius:12px;padding:14px 14px 12px;touch-action:manipulation;}
          .sh-card{width:clamp(44px,11.5vw,56px);aspect-ratio:5/7;border-radius:6px;background:${CARD_FACE};border:1px solid ${CARD_EDGE};box-shadow:0 2px 5px rgba(8,15,25,0.45);display:flex;flex-direction:column;align-items:center;justify-content:center;line-height:1;user-select:none;font-family:${SANS};font-weight:800;flex:none;}
          .sh-rank{font-size:clamp(15px,4.4vw,19px);letter-spacing:-0.04em;}
          .sh-suit{font-size:clamp(13px,3.8vw,16px);margin-top:2px;}
          .sh-back{background:repeating-linear-gradient(45deg,#0a3d5c,#0a3d5c 4px,${FELT_EDGE} 4px,${FELT_EDGE} 8px);border-color:rgba(255,255,255,0.25);}
          .sh-row{display:flex;align-items:center;gap:7px;flex-wrap:wrap;min-height:52px;}
          .sh-lab{font-family:${MONO};font-size:10px;letter-spacing:0.14em;text-transform:uppercase;color:var(--stg-mute, rgba(255,255,255,0.75));width:52px;flex:none;}
          .sh-tot{display:inline-flex;align-items:center;justify-content:center;min-width:34px;height:26px;padding:0 7px;border-radius:6px;background:var(--stg-cell, rgba(255,255,255,0.14));border:1px solid var(--stg-cell-line, rgba(255,255,255,0.25));font-family:${MONO};font-size:12px;color:var(--stg-ink, var(--white));}
          .sh-tot.made{background:var(--stg-acc, rgba(255,255,255,0.92));color:var(--stg-onramp, ${INK});border-color:var(--stg-acc, rgba(255,255,255,0.9));font-weight:700;}
          .sh-pill{display:inline-flex;align-items:center;gap:5px;border-radius:999px;padding:3px 10px;font-family:${MONO};font-size:11px;font-weight:500;border:1px solid var(--stg-line2, rgba(255,255,255,0.28));color:var(--stg-ink, var(--white));background:var(--stg-surf, rgba(255,255,255,0.10));}
          .sh-pill.w{background:rgba(74,222,128,0.22);border-color:rgba(74,222,128,0.55);}
          .sh-pill.l{background:rgba(248,113,113,0.20);border-color:rgba(248,113,113,0.5);}
          .sh-pill.bj{background:rgba(232,180,58,0.28);border-color:rgba(232,180,58,0.7);}
          .sh-act{font-family:${SANS};font-weight:800;font-size:15px;letter-spacing:0.02em;border:2px solid var(--stg-cell-line, rgba(255,255,255,0.9));background:var(--stg-cell, rgba(255,255,255,0.94));color:var(--stg-ink, ${COLORS.ink});border-radius:9px;padding:12px 0;flex:1 1 0;cursor:pointer;}
          .sh-act:active{transform:translateY(1px);}
          .sh-act:disabled{opacity:0.35;cursor:default;}
          .sh-act.gold{background:color-mix(in srgb, var(--stg-acc, ${ACCENT}) 16%, transparent);border-color:var(--stg-acc, #e8b43a);color:var(--stg-acc-ink, #5b4104);}
          .sh-act.deal{background:color-mix(in srgb, var(--stg-acc, ${ACCENT}) 16%, transparent);border-color:var(--stg-acc, rgba(255,255,255,0.9));color:var(--stg-acc-ink, ${COLORS.accent});}
          .sh-note{font-family:${SANS};font-weight:800;font-size:14px;color:var(--stg-ink, var(--white));}
          .sh-strip{display:flex;align-items:center;gap:12px;font-family:${MONO};font-size:11px;letter-spacing:0.08em;text-transform:uppercase;color:var(--stg-mute, rgba(255,255,255,0.72));margin-top:11px;flex-wrap:wrap;}
          .sh-strip b{color:var(--stg-ink, var(--white));font-weight:500;font-variant-numeric:tabular-nums;}
        ` }} />

        <div style={{ maxWidth: 620, margin: '0 auto' }}>

        {!LOFT && (
        <DailyMasthead
          slug="shoe"
          num={PUZZLE.num}
          dateLabel={PUZZLE.dateLabel}
          accent={COLORS.accent}
          blockGap={5}
          helpTop={13}
          marginBottom={16}
          onHelp={() => setShowHelp(true)}
          sunday={PUZZLE.sunday && <span style={{ fontFamily: MONO, fontSize: 9.5, letterSpacing: '0.1em', textTransform: 'uppercase', fontWeight: 500, color: `var(--stg-onramp, ${T.white})`, background: `var(--stg-acc, ${COLORS.accent})`, borderRadius: 4, padding: '2px 6px' }}>Sunday Edition &middot; 7 hands</span>}
          blocks={'SHOE'.split('').map((ch, i) => (
              <div key={i} style={{ width: 40, height: 40, borderRadius: 5, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: SANS, fontWeight: 900, fontSize: 23, background: i === 1 ? `var(--stg-acc, ${COLORS.accent})` : COLORS.ink, color: T.white, boxShadow: 'inset 0 2px 5px rgba(0,0,0,0.5), 0 1px 0 rgba(255,255,255,0.65)' }}>{ch}</div>
            ))}
        />
        )}

        <div className={LOFT && !STAGE ? 'loft-stage' : undefined}>

        {preStart && (
          <div className={STAGE ? 'stg-gate' : undefined} style={{ background: STAGE ? SURF : COLORS.cream, border: STAGE ? `1px solid ${SURF_B}` : `2px solid ${COLORS.ink}`, borderRadius: 12, padding: '22px', display: 'flex', flexDirection: 'column' }}>
            <div style={{ fontSize: 20, fontWeight: 800, color: INK, marginBottom: 10 }}>{gateRules ? 'How to play' : 'Shoe is ready'}</div>
            {gateRules ? rulesBody : (
              <div style={{ fontSize: 14, lineHeight: 1.55, color: INK, fontWeight: 600 }}>
                <p style={{ margin: '0 0 6px' }}>{HANDS} hands of blackjack off one fixed {PUZZLE.shoe.length}-card shoe, the same for every player today. Par is {fmtChips(PUZZLE.par)} chips: that is what the book line banks on this shoe, and beating it is the game.</p>
              </div>
            )}
            <div style={{ marginTop: 18, display: 'flex', flexDirection: 'row-reverse', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
              <button className="sho-btn" onClick={startGame} style={{ borderColor: STAGE ? STAGE_C : undefined, background: STAGE ? STAGE_C : T.cta, color: STAGE ? 'var(--stg-onramp, #08222e)' : T.white, fontSize: 15, padding: '11px 22px' }}>Deal the first hand</button>
              <div>
                <button type="button" onClick={() => setGateRules((v) => !v)} style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', fontFamily: SANS, fontSize: 13, fontWeight: 700, color: FADED, textDecoration: 'underline' }}>
                  {gateRules ? 'Hide detailed instructions' : 'Show detailed instructions'}
                </button>
              </div>
            </div>
          </div>
        )}

        {!preStart && (
        <div className={LOFT && !STAGE && !playing ? (revealed ? 'loft-flip' : 'loft-flip on') : undefined}>
        <div className={LOFT && !STAGE && !playing ? 'loft-flip-in' : undefined}>
        <div className={LOFT && !STAGE && !playing ? 'loft-face' : undefined}>
        <div className={STAGE ? 'stg-board' : (LOFT ? 'loft-card' : undefined)} style={{ background: STAGE ? SURF : T.white, border: STAGE ? `1px solid ${SURF_B}` : `2px solid ${COLORS.ink}`, borderRadius: 10, padding: '13px 15px 15px', boxShadow: STAGE ? 'none' : '5px 5px 0 rgba(28,30,36,0.16)', marginBottom: 12 }}>

          {/* settled-hand ledger */}
          {R.hands.length > (playing && cur && !cur.settled ? 1 : 0) && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 10, flexWrap: 'wrap' }}>
              {R.hands.map((hd, i) => (!hd.settled ? null : (
                <span key={i} className={`sh-pill ${hd.net > 0 ? (hd.net === 15 ? 'bj' : 'w') : hd.net < 0 ? 'l' : ''}`} style={{ color: INK, background: hd.net > 0 ? (hd.net === 15 ? '#fdf3d8' : '#e7f6ec') : hd.net < 0 ? '#fbeaea' : 'var(--stg-surf, #f1f3f6)', borderColor: 'rgba(28,30,36,0.2)' }}>
                  #{i + 1} {fmtChips(hd.net)}
                </span>
              )))}
              <span style={{ marginLeft: 'auto', fontFamily: MONO, fontSize: 11.5, color: FADED }}>bank <b style={{ color: chips >= 0 ? COLORS.green : `var(--stg-bad, ${COLORS.rust})`, fontWeight: 700 }}>{fmtChips(chips)}</b></span>
            </div>
          )}

          {/* the table */}
          {cur && (
            <div className="sh-felt">
              <div className="sh-row" style={{ marginBottom: 9 }}>
                <span className="sh-lab">Dealer</span>
                {cur.d.map((c, i) => (
                  <CardFace key={i} card={c} down={i === 1 && !cur.reveal} />
                ))}
                {cur.d.length > 2 || cur.reveal ? (
                  <span className={`sh-tot${handTotal(cur.d).total > 21 ? '' : ' made'}`}>{handTotal(cur.d).total > 21 ? 'bust' : handTotal(cur.d).total}</span>
                ) : (
                  <span className="sh-tot">{dealerUpVal === 'A' ? 'A showing' : `${dealerUpVal} up`}</span>
                )}
              </div>
              <div className="sh-row">
                <span className="sh-lab">You</span>
                {cur.p.map((c, i) => <CardFace key={i} card={c} />)}
                <span className={`sh-tot${cur.settled ? (handTotal(cur.p).total > 21 ? '' : ' made') : ' made'}`}>
                  {handTotal(cur.p).total > 21 ? 'bust' : `${handTotal(cur.p).soft && handTotal(cur.p).total < 21 ? 'soft ' : ''}${handTotal(cur.p).total}`}
                </span>
                {cur.doubled && <span className="sh-pill">doubled</span>}
              </div>

              {/* action row */}
              {playing && R.phase === 'act' && (
                <div style={{ display: 'flex', gap: 8, marginTop: 13 }}>
                  <button className="sh-act" onClick={() => act('H')}>Hit</button>
                  <button className="sh-act" onClick={() => act('S')}>Stand</button>
                  <button className="sh-act gold" onClick={() => act('D')} disabled={!R.legal.includes('D')}>Double</button>
                </div>
              )}
              {playing && R.phase === 'settled' && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 13, flexWrap: 'wrap' }}>
                  <span className="sh-note">{cur.note} <b style={{ color: cur.net > 0 ? '#7ef0a8' : cur.net < 0 ? '#ffb1b1' : 'rgba(255,255,255,0.85)' }}>{fmtChips(cur.net)}</b></span>
                  <button className="sh-act deal" style={{ flex: '0 0 auto', padding: '11px 22px', marginLeft: 'auto' }} onClick={dealNext}>Deal hand {R.hands.length + 1}</button>
                </div>
              )}
              {!playing && (
                <div style={{ marginTop: 13 }}>
                  <span className="sh-note">{cur.note} <b style={{ color: cur.net > 0 ? '#7ef0a8' : cur.net < 0 ? '#ffb1b1' : 'rgba(255,255,255,0.85)' }}>{fmtChips(cur.net)}</b></span>
                </div>
              )}

              <div className="sh-strip">
                <span>hand <b>{handNo}/{HANDS}</b></span>
                <span>bank <b>{fmtChips(chips)}</b></span>
                <span style={{ marginLeft: 'auto' }}>shoe <b>{cardsLeft}</b> left</span>
              </div>
            </div>
          )}

          {/* the standing anchor line: what par and ace are on this shoe */}
          {started && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 11, flexWrap: 'wrap', fontFamily: SANS, fontSize: 12, fontWeight: 700, color: FADED }}>
              <span>Par {fmtChips(PUZZLE.par)} scores 8 &middot; ace {fmtChips(PUZZLE.ace)} scores 10. The book banks par; the count beats it.</span>
            </div>
          )}

          <div className={STAGE ? undefined : 'loft-sol'}>
          {!playing && (
            <div style={{ margin: '0 auto' }}>
              <div style={{ fontSize: 13.5, fontWeight: 700, color: INK, margin: '12px 0 0' }}>
                Bank {fmtChips(chips)} against par {fmtChips(PUZZLE.par)}{won ? ': par beaten.' : ': under par.'} {R.busts > 0 ? `${R.busts} bust${R.busts === 1 ? '' : 's'}.` : 'No busts.'}
              </div>
              <div style={{ fontSize: 12.5, fontWeight: 600, color: FADED, fontStyle: 'italic', margin: '8px 0 0' }}>
                A clairvoyant line on this shoe banks {fmtChips(PUZZLE.ceiling)}. That is the most these cards allowed, seeing every one coming, which nobody does.
              </div>
              {PUZZLE.sunday && (
                <div style={{ fontSize: 12.5, fontWeight: 600, color: FADED, fontStyle: 'italic', margin: '8px 0 0' }}>The Sunday Edition: seven hands off the entire 52-card deck.</div>
              )}
              {isTodays && myStats.cur >= 2 && (
                <div style={{ fontSize: 13, fontWeight: 800, margin: '12px 0 0', display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                  <span style={{ color: 'var(--stg-warn, #b45309)' }}>{myStats.cur}-day streak</span>
                </div>
              )}
              <p className={STAGE ? undefined : 'loft-tailnote'} style={{ fontSize: 12, color: FADED, fontWeight: 600, margin: '12px 0 0' }}>
                {isTodays ? (
                  <>
                    {countdown ? <>Next Shoe in <b style={{ color: INK, fontVariantNumeric: 'tabular-nums' }}>{countdown}</b>.</> : 'A new shoe is dealt at midnight Eastern.'}
                    {prevPuzzle && (
                      <>
                        {' '}Meanwhile:{' '}
                        <a href={`/shoe?p=${prevPuzzle.num}`} style={{ color: COLORS.ember, fontWeight: 800, textDecoration: 'underline' }}>
                          play yesterday&rsquo;s Shoe &rarr;
                        </a>
                      </>
                    )}
                  </>
                ) : (
                  <>
                    You&rsquo;re playing the {PUZZLE.dateLabel.replace(', 2026', '')} archive.{' '}
                    <a href="/shoe" style={{ color: COLORS.ember, fontWeight: 800, textDecoration: 'underline' }}>Back to today&rsquo;s Shoe &rarr;</a>
                    {' · '}
                    <a href="/daily" style={{ color: FADED, fontWeight: 700, textDecoration: 'underline' }}>All daily puzzles</a>
                  </>
                )}
              </p>
            </div>
          )}
          </div>
          {LOFT && !playing && revealed && (
            <button className={STAGE ? 'stf-hideboard' : 'loft-showopts'} onClick={() => setRevealed(false)}>&#8630; Hide game board</button>
          )}
        </div>
        </div>
        {LOFT && !playing && (
          <LoftFinish
            name="Shoe"
            catRank={catRank}
            outcome={won ? 'won' : (finalScore > 0 ? 'part' : 'lost')}
            title={won ? 'Solved' : 'Not solved'}
            detail={`${finalScore}/10 · bank ${fmtChips(chips)} · par ${fmtChips(PUZZLE.par)} · ${elapsed}`}
            iq={iq}
            board={dailyBoard}
            gameRank={allTime && allTime.ready
              ? { value: allTime.rank != null ? `#${Number(allTime.rank).toLocaleString()}` : '—',
                  label: allTime.field != null ? `of ${Number(allTime.field).toLocaleString()} Shoe all time` : 'all-time rank' }
              : null}
            day={dayStats}
            streak={isTodays ? myStats.cur : null}
            missLabel="Busts"
            archive={puzzles
              .filter((p) => p.live <= etToday() && p.num !== PUZZLE.num)
              .sort((a, b) => b.num - a.num)
              .map((p) => ({
                num: p.num,
                dateLabel: p.dateLabel,
                sunday: !!p.sunday,
                href: `/shoe?p=${p.num}`,
                done: !!(stats && stats.rec && stats.rec[p.num]),
                score: (stats && stats.rec && stats.rec[p.num]) ? stats.rec[p.num].s : null,
              }))}
            options={[
              { label: copied ? 'Copied' : (shareCta || 'Share'), sub: 'Your hands, no spoilers', kind: 'gold', onClick: copyShare },
              { tone: won ? 'board' : 'reveal', label: won ? 'Return to board' : 'See the table',
                sub: won ? 'Your finished table' : 'The last hand and the ledger', onClick: () => setRevealed(true) },
              prevPuzzle && { tone: 'another', label: 'Play another Shoe', sub: `No. ${prevPuzzle.num}, a different shoe`, href: `/shoe?p=${prevPuzzle.num}` },
              nextUp && { tone: 'similar', label: 'Play similar', sub: `${nextUp.name} · ${nextUp.tag}`, href: nextUp.href },
              { tone: 'replay', label: 'Replay', sub: 'This shoe again, unscored', onClick: resetGame },
              { label: 'Back to main', sub: 'The day’s full board', tone: 'main', href: '/' },
            ]}
          />
        )}
        </div>
        </div>
        )}

        {/* end of the play stage; everything below is the light tail */}
        </div>

        {/* The game's own record, archive and leaderboards, at the foot of the
            page (owner, 2026-08-24). This is the panel that used to open from a
            home-page puzzle tile. GamePanel renders its own button and also
            flips the page out of focus mode on first open, which is all the
            "Show overview and more" control it replaces ever did. */}
        {/* The strip in the cap answers what this opens, without being pressed. */}
        {!STAGE && <GamePanel self="shoe" name="Shoe" onShow={() => setShowChrome(true)} />}
        <div style={{ display: (focusMode && !STAGE) ? 'none' : 'block', margin: '30px auto 0' }}>
          {LOFT && (
            <div className={STAGE ? undefined : 'loft-report'}>
              <ReportIssue self="shoe" name="Shoe" accent="#ffffff" align="center" onHelp={() => setShowHelp(true)} />
            </div>
          )}
          {!LOFT && (
          <DailyGamesGrid replay={!playing ? resetGame : null}
            self="shoe"
            maxWidth={620}
            challengeHref={`/duel/new?quiz=${encodeURIComponent(PUZZLE.quizId)}`}
            share={{ label: copied ? 'Copied' : 'Share', onClick: copyShare }}
            light
            boardSlot={<DailyBoardPanel self="shoe" quizId={PUZZLE.quizId} maxWidth={620} streak={{ current: myStats.cur, best: myStats.max }} />}
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
              <div style={{ fontSize: 17, fontWeight: 800, color: INK, marginBottom: 8 }}>Add Shoe to your Home Screen</div>
              {isIosDevice() ? (
                <ol style={{ margin: '0 0 4px', paddingLeft: 20, color: INK, fontSize: 14, lineHeight: 1.7 }}>
                  <li>Tap the <b>Share</b> button in Safari&apos;s toolbar.</li>
                  <li>Scroll down and tap <b>Add to Home Screen</b>.</li>
                  <li>Tap <b>Add</b> &mdash; the tile opens the day&apos;s shoe, every day.</li>
                </ol>
              ) : (
                <p style={{ margin: '0 0 4px', color: INK, fontSize: 14, lineHeight: 1.7 }}>
                  Open your browser&apos;s menu and choose <b>Add to Home Screen</b> (or <b>Install app</b>). The tile opens the day&apos;s shoe, every day.
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
      </div>

      {!playing && !endClosed && !LOFT && (
        <DailyEndCard
          modal
          self="shoe"
          won={won}
          headline={won ? <>Par beaten!</> : <>Shoe played out</>}
          subline={<>bank {fmtChips(chips)} against par {fmtChips(PUZZLE.par)}</>}
          onShare={copyShare}
          shareLabel={copied ? 'Copied' : 'Share Result'}
          onReplay={resetGame}
          onClose={() => setEndClosed(true)}
        />
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
            <button className="sho-btn" onClick={() => { setShowHelp(false); try { localStorage.setItem(HELP_KEY, '1'); } catch (e) {} }} style={{ marginTop: 14, background: COLORS.ink, color: T.white }}>Play</button>
          </div>
        </div>
      )}

      {/* The desktop fold: the About prose below starts one screen down (app/StageFold.jsx). */}
      <StageFold />
      {/* About Shoe — crawlable prose, server-rendered into the HTML */}
      <section style={{ position: 'relative', display: (focusMode && !STAGE) ? 'none' : 'block', zIndex: 2, maxWidth: 620, margin: '0 auto', padding: '10px 24px 42px', fontFamily: SANS }}>
        <h2 style={{ margin: '0 0 8px', fontSize: 15, fontWeight: 800, letterSpacing: '-0.01em', color: INK }}>About Shoe</h2>
        <p style={{ margin: '0 0 8px', fontSize: 13, lineHeight: 1.65, color: FADED, fontWeight: 600 }}>
          Shoe is a free daily blackjack puzzle from Mind Loft. Every player faces the same shoe: five hands of blackjack dealt from one fixed 36-card shoe, the same cards in the same order for everyone, which turns blackjack from a gamble into a decision game a leaderboard can rank. Hit, stand, or double on a 10-chip stake; the dealer stands on every 17; blackjack pays 3 to 2; there are no splits.
        </p>
        <p style={{ margin: '0 0 8px', fontSize: 13, lineHeight: 1.65, color: FADED, fontWeight: 600 }}>
          Par is what basic strategy, the book line, banks on the day&apos;s shoe playing blind, and matching it scores 8 out of 10. The ace line, a blind player&apos;s best day, scores 10. Beating the book means counting: the shoe holds 36 cards off one standard deck, so every card on the table changes what is left, and the player who notices stands where the book hits.
        </p>
        <p style={{ margin: 0, fontSize: 13, lineHeight: 1.65, color: FADED, fontWeight: 600 }}>
          A new shoe is dealt every day at midnight Eastern, and Sundays step up to seven hands off the entire 52-card deck, where a perfect counter knows exactly what remains. No app, no signup, play free in your browser, keep a streak, and race the leaderboard. For more cards, try <a href="/taire" style={{ color: INK, fontWeight: 800 }}>Taire</a>, the daily solitaire, or <a href="/hands" style={{ color: INK, fontWeight: 800 }}>Hands</a>, the daily poker solitaire.
        </p>
      </section>

      {!STAGE && <div style={{ position: 'relative', zIndex: 2, display: focusMode ? 'none' : 'block' }}><Footer /></div>}
    </div>
  );
}
