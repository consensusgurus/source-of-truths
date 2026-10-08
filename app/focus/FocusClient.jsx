'use client';

// Focus — the daily zoomed-photo game.
//
// One photo a day, shown first as a crop at nine times magnification.
// Six frames. Name it and the day is solved; a wrong name pulls the camera
// back one frame, and the sixth frame is the whole photo, one last guess.
// Score is the frame you solved on, counted down: frame 1 is 6 points, frame
// 6 is 1, a miss on the full photo is 0. Ties break by wrong guesses then
// time, the same as everywhere else on the slate.
//
// A guess is a PICK from the type-ahead, never free text: the weekday subject
// (subjects.js) carries the whole answer universe, so a typo costs nothing
// and every spent frame was a real, named wrong answer. Enter takes the top
// suggestion. The matching itself lives in matchOptions (subjects.js) and
// reads WORDS in any order, so "Starry Starry Night" finds The Starry Night;
// and when it finds nothing the line under the box says so on the keystroke,
// because an empty list with no explanation is what this game got wrong
// first (reader report, 2026-09-02).
//
// The photo comes from /api/focus/img?n=<num>, which refuses a day that is
// not yet live, so the client never holds tomorrow's picture. The bank row
// itself (answer, Commons title, attribution) is stripped on the server and
// only today's is shipped, the way Flank does it.

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useSearchParams } from 'next/navigation';
import { X, Smartphone, Aperture } from 'lucide-react';
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
import { isLoft } from '@/lib/loft';
import { T } from '@/lib/theme';
import { meRequest } from '@/app/quizMeClient';
import { subjectFor, fold, matchOptions } from './subjects';

const COLORS = {
  cream: T.surface, paper: T.paper, ink: T.ink, ember: T.accent,
  rust: T.danger, faded: T.muted,
  accent: '#8a4b08',        // Focus identity — darkroom amber
  accentSoft: '#fdf1ea', green: T.successDeep,
};
const SANS = "'Manrope', system-ui, -apple-system, sans-serif";
const MONO = "'DM Mono', ui-monospace, 'SFMono-Regular', monospace";
const HELP_KEY = 'sot_focus_help_seen';
const STATS_KEY = 'sot_focus_stats';

// Six frames. The magnification per frame, first to last; the last is the
// whole photo. It launched at 14x (frame 1 impossible) and was tried at 6x
// (frame 1 already clear); the owner's rule is that frame 1 should show a
// DISCERNIBLE COLOURATION DIFFERENCE and no more, so it sits at 9x, with a
// touch of blur on the first two so the upscale reads as a lens rather than
// as broken pixels.
const FRAMES = 6;
const ZOOM = [9, 6, 4, 2.5, 1.5, 1];
const BLUR = [0.8, 0.3, 0, 0, 0, 0];
const TOTAL = FRAMES;
const pointsFor = (frame) => Math.max(0, FRAMES + 1 - frame);

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
// The total is a constant six, so the cross-device merge only needs the
// percentage back as a count.
function mergeServerStats(s, recent, puzzles) {
  if (!s || !Array.isArray(recent) || !recent.length) return s;
  const byQuiz = {};
  for (const p of puzzles) byQuiz[p.quizId] = p;
  let rec = s.rec, changed = false;
  for (const m of recent) {
    const p = m && byQuiz[m.quizId];
    if (!p || m.attempt !== 1) continue;
    if (rec[p.num]) continue;
    const sc = Math.max(0, Math.min(TOTAL, Math.round(((m.scorePct || 0) / 100) * TOTAL)));
    if (!changed) { rec = { ...rec }; changed = true; }
    rec[p.num] = { s: sc, t: TOTAL, won: sc > 0 };
  }
  if (!changed) return s;
  const s2 = { ...s, rec };
  try { localStorage.setItem(STATS_KEY, JSON.stringify(s2)); } catch (e) {}
  return s2;
}

const HAPT = { wrong: [0, 26, 34, 26], win: [10, 40, 20, 40, 20, 60] };
function vibrate(p) { try { if (typeof navigator !== 'undefined' && navigator.vibrate) navigator.vibrate(p); } catch (e) {} }

// frame is the frame on screen, 1..6. wrong holds the names spent, in order.
const freshState = () => ({ v: 1, frame: 1, wrong: [], status: 'playing', t0: null, tEnd: null });

export default function FocusClient({ puzzles = [], dayByNum = {}, forceNum = null }) {
  const PUZZLE = useMemo(() => pickPuzzle(puzzles, forceNum), [puzzles, forceNum]);
  const DAY = dayByNum[PUZZLE.num] || { a: null, lic: '', by: '', fx: 0.5, fy: 0.5 };
  const SUBJECT = useMemo(() => subjectFor(PUZZLE.live), [PUZZLE.live]);
  const OPTIONS = SUBJECT.options;
  const STORE_KEY = `sot_focus_${PUZZLE.num}`;
  const IMG = `/api/focus/img?n=${PUZZLE.num}`;

  const [g, setG] = useState(() => freshState());
  const gRef = useRef(g);
  const [now, setNow] = useState(() => Date.now());
  const [q, setQ] = useState('');
  const [open, setOpen] = useState(false);
  const [notice, setNotice] = useState(null);
  const [showHelp, setShowHelp] = useState(false);
  const [gateRules, setGateRules] = useState(false);
  const [copied, setCopied] = useState(false);
  const [endClosed, setEndClosed] = useState(false);
  const [revealed, setRevealed] = useState(false);
  const [imgOk, setImgOk] = useState(null);   // null loading, true, false
  const [shareCta, setShareCta] = useState('Share');
  useEffect(() => {
    if (contestIsLive()) setShareCta(`Share for ${CONTEST.prizeLabel}*`);
  }, []);
  const [hydrated, setHydrated] = useState(false);
  const [board, setBoard] = useState(EMPTY_BOARD);
  const [identity, setIdentity] = useState(null);
  const [stats, setStats] = useState(null);
  // eslint-disable-next-line no-unused-vars -- the player chip lives in
  // DailyChrome; the fetch below stays for the cross-device stats merge.
  const [player, setPlayer] = useState(null);
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
  const askRef = useRef(null);

  const playing = g.status === 'playing';
  const preStart = playing && !g.t0;
  const started = playing && !!g.t0;
  const focusMode = playing && !showChrome;
  const won = g.status === 'won';
  const LOFT = isLoft('focus');
  const STAGE = isStage('focus', searchParams);
  const [stageTheme] = useStageTheme();
  const STAGE_C = STAGE ? 'var(--stg-acc)' : gameColor('focus');
  const STAGE_ACC = { '--stg-acc-dk': gameColor('focus'), '--stg-acc-lt': gameColorLight('focus'), '--stg-onramp-lt': gameOnrampLight('focus'), '--stg-acc-ink-lt': gameAccentInkLight('focus') };
  const Cap = STAGE ? StageChrome : LoftCap;
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
  const frame = g.frame;
  const misses = g.wrong.length;
  const score = won ? pointsFor(frame) : 0;
  // The photo the viewer shows: the live frame while playing, the whole
  // photo once the day is over either way.
  const viewFrame = playing ? frame : FRAMES;

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
        if (saved && saved.v === 1 && Array.isArray(saved.wrong)) {
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
        if (done || g.t0) localStorage.setItem('sot_focus_day', JSON.stringify({ d: etToday(), done }));
        else localStorage.removeItem('sot_focus_day');
      }
    } catch (e) {}
  }, [g, hydrated, STORE_KEY, PUZZLE, puzzles]);

  useEffect(() => {
    if (g.status === 'playing') return;
    const tick = () => setCountdown(fmtCountdown(msToMidnightET()));
    tick();
    const iv = setInterval(tick, 1000);
    return () => clearInterval(iv);
  }, [g.status]);

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
            if (d && Array.isArray(d.recent)) setStats((cur) => mergeServerStats(cur || getStats(), d.recent, puzzles));
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

  // The elapsed clock. It has to visibly tick while the board is live.
  useEffect(() => {
    if (!started || !playing) return undefined;
    const iv = setInterval(() => setNow(Date.now()), 500);
    return () => clearInterval(iv);
  }, [started, playing]);

  // The type-ahead closes on any click outside it.
  useEffect(() => {
    if (!open) return undefined;
    const onDoc = (e) => { if (askRef.current && !askRef.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, [open]);

  const elapsed = g.t0 ? fmtTime((g.tEnd || now) - g.t0) : '0:00';
  const isTodays = PUZZLE.num === pickPuzzle(puzzles, null).num;
  const iq = useIqStanding({ game: 'focus', quizId: PUZZLE.quizId, active: LOFT && !playing });
  const nextUp = useNextUnplayed({ self: 'focus', active: LOFT && !playing });
  const upNext = useUnplayedSimilar({ self: 'focus', active: LOFT && !playing });
  const dailyBoard = useDailyBoard({ quizId: PUZZLE.quizId, active: LOFT && !playing });
  const allTime = useGameAllTime({ game: 'focus', active: LOFT && !playing });
  const dayStats = useDayStats();
  const catRank = useCategoryRank({ self: 'focus', active: LOFT && !playing });
  const prevPuzzle = puzzles.find((x) => x.num === PUZZLE.num - 1) || null;
  const myStats = deriveStats(stats, pickPuzzle(puzzles, null).num);

  const REC_KEY = `sot_focus_rec_${PUZZLE.num}`;
  const abandon = useAbandonFlush(() => {
    const cur = gRef.current;
    if (!cur.t0 || cur.status !== 'playing') return null;
    try { if (localStorage.getItem(REC_KEY)) return null; } catch (e) {}
    const el = Math.min(36000, Math.max(1, Math.round((Date.now() - (cur.t0 || Date.now())) / 1000)));
    try { localStorage.setItem(REC_KEY, '1'); } catch (e) {}
    return { quizId: PUZZLE.quizId, score: 0, total: TOTAL, correct: 0, guessesUsed: cur.wrong.length, timeElapsed: el, abandoned: true, email: identity?.email || undefined, anonId: getAnonId(), isMobile: isMobileDevice(), referrer: (typeof document !== 'undefined' ? document.referrer : '') };
  });

  function postResult(g2) {
    abandon.markFlushed();
    const el = g2.t0 ? Math.max(1, Math.round(((g2.tEnd || Date.now()) - g2.t0) / 1000)) : 1;
    const sc = g2.status === 'won' ? pointsFor(g2.frame) : 0;
    try { setStats(recordStat(PUZZLE.num, { s: sc, t: TOTAL, won: g2.status === 'won', f: g2.frame })); } catch (e) {}
    try {
      fetch('/api/quiz/result', {
        method: 'POST', keepalive: true, headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ quizId: PUZZLE.quizId, score: sc, total: TOTAL, correct: sc, guessesUsed: g2.wrong.length, timeElapsed: el, email: identity?.email || undefined, anonId: getAnonId(), isMobile: isMobileDevice(), referrer: (typeof document !== 'undefined' ? document.referrer : '') }),
      })
        .then((r) => r.json())
        .then((d) => { if (d && !d.error) setBoard({ ...EMPTY_BOARD, ...d }); })
        .catch(() => {});
    } catch (e) {}
  }

  // "Replay": wipe the saved board and run today's photo again as practice.
  function resetGame() {
    try { localStorage.removeItem(STORE_KEY); } catch (e) {}
    setG(freshState());
    setQ('');
    setNotice(null);
    setEndClosed(false);
    setRevealed(false);
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
    noticeRef.current = setTimeout(() => setNotice(null), 2200);
  }

  const suggestions = useMemo(() => matchOptions(q, OPTIONS, g.wrong), [q, OPTIONS, g.wrong]);
  // SILENCE IS THE BUG. An empty list used to say nothing at all: no row, no
  // Enter chip, and a standing hint that still read "Type, then choose a
  // name", which is advice for someone who has not typed yet. So the moment
  // the list comes back empty the line under the box says so, and says the
  // one thing the reader is actually asking, which is whether that cost them
  // a frame. Persistent, not a toast: the 2.2s notice was the other half of
  // why this went unexplained.
  const noMatch = fold(q).length >= 2 && suggestions.length === 0;

  function guess(name) {
    const cur = gRef.current;
    if (cur.status !== 'playing' || !cur.t0) return;
    setQ(''); setOpen(false);
    if (cur.wrong.includes(name)) { say(`${name} already cost you a frame.`); return; }
    if (name === DAY.a) {
      const done = { ...cur, status: 'won', tEnd: Date.now() };
      vibrate(HAPT.win);
      postResult(done);
      commit(done);
      return;
    }
    const wrong = [...cur.wrong, name];
    vibrate(HAPT.wrong);
    if (cur.frame >= FRAMES) {
      const done = { ...cur, wrong, status: 'lost', tEnd: Date.now() };
      postResult(done);
      commit(done);
      return;
    }
    say(`Not ${name}. Pulling back.`, 'miss');
    commit({ ...cur, wrong, frame: cur.frame + 1 });
    setTimeout(() => { try { inputRef.current && inputRef.current.focus(); } catch (e) {} }, 30);
  }
  function onEnter() {
    // Enter takes the top suggestion, and does nothing at all when there is
    // none. It used to flash a toast saying nothing matched; the line under
    // the box now says that permanently, so the toast was the same sentence
    // twice, one of which erased itself.
    if (suggestions.length) guess(suggestions[0]);
  }

  function shareUrl() { return withRef(`mindloftdaily.com/focus${isTodays ? '' : `?p=${PUZZLE.num}`}`); }
  function shareText() {
    const ladder = Array.from({ length: FRAMES }, (_, i) => {
      const f = i + 1;
      if (won) return f < frame ? '\u{1F7E5}' : f === frame ? '\u{1F7E9}' : '⬜';
      return '\u{1F7E5}';
    }).join('');
    const streakBit = isTodays && myStats.cur >= 2 ? ` · streak ${myStats.cur}` : '';
    const head = won
      ? `Focus #${PUZZLE.num} · frame ${frame}/${FRAMES} · ${elapsed}${streakBit}`
      : `Focus #${PUZZLE.num} · X/${FRAMES} · ${elapsed}${streakBit}`;
    return `${head}\n${ladder}\n${shareUrl()}`;
  }
  function copyShare() {
    const text = playing
      ? `Focus #${PUZZLE.num} — the daily zoomed-photo game from Mind Loft. Name it before the camera pulls all the way back.\n${shareUrl()}`
      : shareText();
    if (notifyShareCredit(text)) return;
    try {
      if (typeof navigator !== 'undefined' && navigator.share && isMobileDevice()) { navigator.share({ text }).catch(() => {}); return; }
    } catch (e) {}
    try {
      navigator.clipboard?.writeText(text).then(() => { setCopied(true); setTimeout(() => setCopied(false), 1800); });
    } catch (e) {}
  }

  const rulesBody = (
    <DailyRules
      accent={COLORS.accent} accentSoft={COLORS.accentSoft}
      lead="One photo a day, zoomed in close. Name it before the camera pulls all the way back."
      banner={`Today: ${SUBJECT.label}`}
      sub={SUBJECT.blurb}
      steps={[
        <>Frame 1 is a tight crop at nine times. <b>Type a name and choose it from the list</b>; only today&apos;s subject list is offered, so a typo never costs anything. <b>Enter</b> takes the top suggestion.</>,
        <>A wrong name <b>pulls the camera back one frame</b>. Six frames, and the sixth is the whole photo with one last guess.</>,
        <>The earlier the frame, the more it pays: <b>frame 1 is 6 points</b>, frame 6 is 1, a miss on the full photo is 0. Ties on the board break by wrong guesses, then time.</>,
        <>A different subject every day of the week: Space on Sunday, then Landmarks, Animals, Paintings, Machines, Faces, and the world From above on Saturday.</>,
      ]}
      knack="Do not guess the first frame from the colour. Read the texture: brushstroke, fur, rivet, brick, and the grain of the print all say what KIND of thing it is before you know which one. Spend frame 1 only when the list has one name that fits."
      footer="Photos are from Wikimedia Commons under public-domain or Creative Commons licences; the author and licence are printed under the reveal."
    />
  );

  const pip = (i) => {
    const f = i + 1;
    let bg = 'var(--stg-cell, #ffffff)', bd = 'var(--stg-cell-line, rgba(28,30,36,0.28))';
    if (!playing) {
      if (won) { if (f < frame) { bg = `var(--stg-bad, ${COLORS.rust})`; bd = bg; } else if (f === frame) { bg = `var(--stg-good, ${COLORS.green})`; bd = bg; } }
      else { bg = `var(--stg-bad, ${COLORS.rust})`; bd = bg; }
    } else if (f < frame) { bg = `var(--stg-bad, ${COLORS.rust})`; bd = bg; }
    else if (f === frame) { bg = ACC; bd = ACC; }
    return <i key={f} className="fc-pip" style={{ background: bg, borderColor: bd }} aria-label={`frame ${f}`} />;
  };

  return (
    <div className={STAGE ? 'stage-page' : (LOFT ? 'loft-page' : undefined)}
      data-stage-theme={STAGE ? stageTheme : undefined}
      style={{ ...(STAGE ? STAGE_ACC : null), minHeight: '100vh', background: STAGE ? 'var(--stg-ground)' : T.surface, color: STAGE ? 'var(--stg-ink,#e9edf4)' : undefined, position: 'relative', overflowX: (STAGE || LOFT) ? 'hidden' : undefined }}>
      {!STAGE && <Grain />}
      {!STAGE && (
      <DailyChrome slug="focus" name="Focus" collapsed={started} loft={LOFT} />
      )}
      {LOFT && (
        <Cap gameKey="focus" quizId={PUZZLE.quizId}
          name="Focus"
          cat="Trivia"
          outcome={playing ? null : (won ? 'won' : 'lost')}
          num={PUZZLE.num}
          tiles={playing ? null : upNext}
          dateLabel={PUZZLE.dateLabel}
          onHelp={() => setShowHelp(true)}
          figures={playing ? [
            { v: `${frame}/${FRAMES}`, k: 'frame' },
            { v: elapsed, k: 'time' },
            { v: String(misses), k: 'misses' },
          ] : [
            { v: won ? `${frame}/${FRAMES}` : `X/${FRAMES}`, k: 'frame' },
            { v: `${score}`, k: 'points' },
            { v: elapsed, k: 'time' },
          ]}
        />
      )}
      <div className="fc-wrap" style={{ position: 'relative', zIndex: 2, maxWidth: 1180, margin: '0 auto', padding: '18px 38px 80px', fontFamily: SANS }}>
        {/* dangerouslySetInnerHTML, not a text child: Next escapes a quote in a
            text child to &#x27; and the CSS parser drops that declaration. */}
        <style dangerouslySetInnerHTML={{ __html: `
          @media(max-width:560px){.fc-wrap{padding-left:10px !important;padding-right:10px !important;}}
          .fc-btn{font-family:${SANS};font-weight:800;font-size:14px;border:2px solid ${STAGE ? 'var(--stg-line2)' : 'var(--blue-deep)'};background:${STAGE ? 'transparent' : 'var(--white)'};color:${STAGE ? 'var(--stg-ink)' : 'var(--blue-deep)'};border-radius:8px;padding:9px 16px;cursor:pointer;display:inline-flex;align-items:center;gap:7px;}
          .fc-btn:hover{background:var(--stg-surf2, var(--accent-soft));}
          .fc-view{position:relative;width:100%;aspect-ratio:1/1;overflow:hidden;border-radius:8px;background:var(--stg-cell, #eef0f3);border:1px solid var(--stg-cell-line, rgba(28,30,36,0.28));}
          .fc-view img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;display:block;user-select:none;-webkit-user-drag:none;pointer-events:none;transition:transform .9s cubic-bezier(.2,.8,.2,1),filter .9s ease;}
          @media(prefers-reduced-motion:reduce){.fc-view img{transition:none;}}
          .fc-tag{position:absolute;top:10px;font-family:${MONO};font-size:10.5px;letter-spacing:.12em;text-transform:uppercase;color:#fff;background:rgba(0,0,0,.58);padding:4px 7px;border-radius:4px;}
          .fc-ladder{display:flex;gap:6px;margin-top:10px;}
          .fc-pip{flex:1;height:8px;border-radius:2px;border:1px solid;display:block;transition:background .2s;}
          .fc-input{font-family:${SANS};font-weight:700;font-size:16px;width:100%;border:2px solid var(--stg-cell-line, rgba(28,30,36,0.4));border-radius:9px;padding:12px 13px;color:${INK};background:var(--stg-cell, ${T.white});outline:none;}
          .fc-input:focus{border-color:var(--stg-acc, ${COLORS.accent});}
          .fc-input.shake{animation:fcshake .3s linear;}
          @keyframes fcshake{0%,100%{transform:translateX(0)}25%{transform:translateX(-5px)}75%{transform:translateX(5px)}}
          .fc-sugg{position:absolute;left:0;right:0;top:calc(100% + 4px);z-index:8;background:var(--stg-raise, ${T.white});border:1px solid var(--stg-cell-line, rgba(28,30,36,0.4));border-radius:9px;overflow:hidden;box-shadow:0 10px 30px rgba(0,0,0,.25);}
          .fc-sugg button{display:flex;width:100%;text-align:left;background:none;border:0;border-top:1px solid var(--stg-line, rgba(28,30,36,0.1));padding:11px 14px;font-family:${SANS};font-weight:700;font-size:15px;color:${INK};cursor:pointer;align-items:center;gap:10px;}
          .fc-sugg button:first-child{border-top:0;}
          .fc-sugg button:hover,.fc-sugg button:focus-visible{background:var(--stg-acc-tint, ${COLORS.accentSoft});outline:none;}
          .fc-sugg button small{margin-left:auto;font-family:${MONO};font-size:10px;letter-spacing:.1em;text-transform:uppercase;color:${FADED};}
          .fc-miss{display:flex;align-items:center;gap:10px;padding:8px 12px;border:1px solid var(--stg-line, rgba(28,30,36,0.18));border-radius:7px;background:var(--stg-surf, transparent);font-family:${SANS};font-weight:700;font-size:14px;color:${INK};}
          .fc-miss .x{color:var(--stg-bad, ${COLORS.rust});font-family:${MONO};}
          .fc-miss small{margin-left:auto;font-family:${MONO};font-size:10px;letter-spacing:.1em;text-transform:uppercase;color:${FADED};}
        ` }} />

        <div style={{ maxWidth: 560, margin: '0 auto' }}>

        {!LOFT && (
        <DailyMasthead
          slug="focus" num={PUZZLE.num} dateLabel={PUZZLE.dateLabel} accent={COLORS.accent}
          blockGap={5} helpTop={13} marginBottom={16} onHelp={() => setShowHelp(true)}
          blocks={'FOCUS'.split('').map((ch, i) => (
            <div key={i} style={{ width: 38, height: 38, borderRadius: 5, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: SANS, fontWeight: 900, fontSize: 22, background: i === 0 ? `var(--stg-acc, ${COLORS.accent})` : COLORS.ink, color: i === 0 ? `var(--stg-onramp, ${T.white})` : T.white, boxShadow: 'inset 0 2px 5px rgba(0,0,0,0.5), 0 1px 0 rgba(255,255,255,0.65)' }}>{ch}</div>
          ))}
        />
        )}

        <div className={LOFT && !STAGE ? 'loft-stage' : undefined}>
          <div className={LOFT && !STAGE && !playing ? (revealed ? 'loft-flip' : 'loft-flip on') : undefined}>
          <div className={LOFT && !STAGE && !playing ? 'loft-flip-in' : undefined}>
          <div className={LOFT && !STAGE && !playing ? 'loft-face' : undefined}>

        {preStart && (
          <div className={STAGE ? 'stg-gate' : undefined} style={{ background: STAGE ? SURF : COLORS.cream, border: STAGE ? `1px solid ${SURF_B}` : `2px solid ${COLORS.ink}`, borderRadius: 12, padding: '22px', display: 'flex', flexDirection: 'column' }}>
            <div style={{ fontSize: 20, fontWeight: 800, color: INK, marginBottom: 10 }}>{gateRules ? 'How to play' : 'Focus is ready'}</div>
            {gateRules ? rulesBody : (
              <div style={{ fontSize: 14, lineHeight: 1.55, color: INK, fontWeight: 600 }}>
                <p style={{ margin: '0 0 6px' }}>Today&apos;s subject is <b>{SUBJECT.label}</b>. One photo zoomed in close, six frames, one name. The clock starts when you do.</p>
              </div>
            )}
            <div style={{ marginTop: 18, display: 'flex', flexDirection: 'row-reverse', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
              <button className="fc-btn" onClick={startGame} style={{ borderColor: STAGE ? STAGE_C : undefined, background: STAGE ? STAGE_C : T.cta, color: STAGE ? 'var(--stg-onramp, #08222e)' : T.white, fontSize: 15, padding: '11px 22px' }}>Start</button>
              <div>
                <button type="button" onClick={() => setGateRules((v) => !v)} style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', fontFamily: SANS, fontSize: 13, fontWeight: 700, color: FADED, textDecoration: 'underline' }}>
                  {gateRules ? 'Hide detailed instructions' : 'Show detailed instructions'}
                </button>
              </div>
            </div>
          </div>
        )}

        {!preStart && (
        <div className={STAGE ? 'stg-board' : (LOFT ? 'loft-card' : undefined)} style={{ background: STAGE ? SURF : T.white, border: STAGE ? `1px solid ${SURF_B}` : `2px solid ${COLORS.ink}`, borderRadius: 10, padding: '13px 15px 15px', boxShadow: STAGE ? 'none' : '5px 5px 0 rgba(28,30,36,0.16)', marginBottom: 12 }}>
          {!LOFT && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, fontFamily: MONO, fontSize: 11.5, letterSpacing: '0.1em', textTransform: 'uppercase', color: FADED, borderBottom: '1px solid rgba(28,30,36,0.18)', paddingBottom: 8, marginBottom: 12, flexWrap: 'wrap' }}>
            <span style={{ whiteSpace: 'nowrap', display: 'inline-flex', alignItems: 'center', gap: 5 }}>
              <Aperture size={13} style={{ color: ACC_INK }} />
              <b style={{ color: INK, fontWeight: 500, fontVariantNumeric: 'tabular-nums' }}>{frame}/{FRAMES}</b>
              <span>frame</span>
            </span>
            <span style={{ whiteSpace: 'nowrap' }}>time <b style={{ color: INK, fontWeight: 500, fontVariantNumeric: 'tabular-nums' }}>{elapsed}</b></span>
            <span style={{ marginLeft: 'auto', whiteSpace: 'nowrap' }}>misses <b style={{ color: INK, fontWeight: 500 }}>{misses}</b></span>
          </div>
          )}

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 10, marginBottom: 10, fontFamily: MONO, fontSize: 10.5, letterSpacing: '0.12em', textTransform: 'uppercase', fontWeight: 500 }}>
            <span style={{ color: ACC_INK }}>{SUBJECT.label}</span>
            <span style={{ color: FADED }}>{playing ? (frame === FRAMES ? 'Last frame · the whole photo' : frame === 1 ? 'Every miss pulls back' : `${FRAMES - frame} more pull${FRAMES - frame === 1 ? '' : 's'} left`) : (won ? `Solved at frame ${frame}` : 'Out of frames')}</span>
          </div>

          {/* The photo. A square window; the image is cover-fit and scaled
              about the day's focal point, so every frame is a real crop of
              the same picture and the last frame is the picture itself. */}
          <div className="fc-view" aria-label={playing ? `Frame ${frame} of ${FRAMES}` : ((won || !LOFT || revealed) && DAY.a) || 'The photo'}>
            {imgOk === false ? (
              <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20, textAlign: 'center', fontSize: 13.5, fontWeight: 700, color: FADED }}>
                The photo did not load. Reload the page; if it keeps happening, report it below.
              </div>
            ) : (
              <img
                src={IMG} alt=""
                draggable={false}
                onLoad={() => setImgOk(true)}
                onError={() => setImgOk(false)}
                style={{ transformOrigin: `${Math.round((DAY.fx ?? 0.5) * 100)}% ${Math.round((DAY.fy ?? 0.5) * 100)}%`, transform: `scale(${ZOOM[viewFrame - 1]})`, filter: BLUR[viewFrame - 1] ? `blur(${BLUR[viewFrame - 1]}px)` : 'none', opacity: imgOk ? 1 : 0 }}
              />
            )}
            {imgOk === null && (
              <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: MONO, fontSize: 11, letterSpacing: '0.12em', textTransform: 'uppercase', color: FADED }}>Developing…</div>
            )}
            <span className="fc-tag" style={{ left: 10 }}>Frame <b style={{ color: `var(--stg-acc-ink, ${COLORS.accent})`, fontWeight: 500 }}>{viewFrame}</b> of {FRAMES}</span>
            <span className="fc-tag" style={{ right: 10 }}>{ZOOM[viewFrame - 1]}×</span>
          </div>
          <div className="fc-ladder" aria-label={`frame ${frame} of ${FRAMES}`}>
            {Array.from({ length: FRAMES }, (_, i) => pip(i))}
          </div>

          {playing && started && (
            <div ref={askRef} style={{ marginTop: 14, position: 'relative' }}>
              <input
                ref={inputRef}
                className={`fc-input${notice && notice.kind === 'miss' ? ' shake' : ''}`}
                value={q}
                onChange={(e) => { setQ(e.target.value); setOpen(true); }}
                onFocus={() => setOpen(true)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') { e.preventDefault(); onEnter(); }
                  else if (e.key === 'Escape') { setOpen(false); }
                }}
                placeholder={frame === FRAMES ? `Last guess. ${SUBJECT.prompt}` : SUBJECT.prompt}
                autoCapitalize="off" autoComplete="off" autoCorrect="off" spellCheck={false}
                aria-label={SUBJECT.prompt}
                aria-autocomplete="list" aria-expanded={open && suggestions.length > 0}
              />
              {open && suggestions.length > 0 && (
                <div className="fc-sugg" role="listbox">
                  {suggestions.map((s, i) => (
                    <button type="button" key={s} role="option" aria-selected={i === 0} onMouseDown={(e) => e.preventDefault()} onClick={() => guess(s)}>
                      {s}{i === 0 && <small>Enter</small>}
                    </button>
                  ))}
                </div>
              )}
              <div style={{ minHeight: 19, marginTop: 6, fontFamily: SANS, fontSize: 12.5, fontWeight: 700, color: notice && notice.kind === 'miss' ? `var(--stg-bad, ${COLORS.rust})` : `var(--stg-mute, ${COLORS.faded})` }}>
                {/* THE LIST COMMITS, IT DOES NOT FILL. Every other autocomplete on earth
                    puts the suggestion in the box and waits, so a reader taps one to see
                    it written down and has spent a frame instead. That is worth warning
                    about, but the warning has to name the COST in the unit on screen: it
                    read "A pick is a guess", which invents "pick" for an action nobody
                    has named and then defines it as another word from the rules panel
                    (owner, 2026-09-01: "that seems dumb"). Say what happens. */}
                {notice ? notice.msg
                  : noMatch ? <>No name on today’s list matches that. <b style={{ color: INK }}>It has cost you nothing.</b></>
                  : <>Type, then choose a name. <b style={{ color: INK }}>Choosing one spends a frame.</b></>}
              </div>
            </div>
          )}

          {!playing && (
            <div style={{ marginTop: 14 }}>
              {(won || !LOFT || revealed) && (
              <div style={{ fontFamily: SANS, fontSize: 22, fontWeight: 900, letterSpacing: '-0.01em', color: INK, lineHeight: 1.1 }}>{DAY.a}</div>
              )}
              <div style={{ marginTop: 5, fontFamily: SANS, fontSize: 12, fontWeight: 600, color: FADED }}>
                Photo: {DAY.by || 'Wikimedia Commons'} · {DAY.lic || 'Wikimedia Commons'} · via Wikimedia Commons
              </div>
              <div style={{ fontFamily: SANS, fontSize: 14.5, fontWeight: 800, marginTop: 10, color: won ? `var(--stg-good, ${COLORS.green})` : `var(--stg-ink, ${COLORS.rust})` }}>
                {won ? `Named at frame ${frame} in ${elapsed}: ${score} point${score === 1 ? '' : 's'}.` : `Six frames, no name. The whole photo is above.`}
              </div>
            </div>
          )}

          {(g.wrong.length > 0) && (
            <div style={{ marginTop: 12, display: 'flex', flexDirection: 'column', gap: 6 }}>
              {[...g.wrong].reverse().map((w, i) => (
                <div key={w} className="fc-miss"><span className="x">✗</span>{w}<small>frame {g.wrong.length - i}</small></div>
              ))}
            </div>
          )}
        </div>
        )}

          <div className={STAGE ? undefined : 'loft-sol'}>
          {!playing && (
            <div style={{ maxWidth: 472, margin: '0 auto' }}>
              <div style={{ fontSize: 15, fontWeight: 800, color: INK, margin: '8px 0 0' }}>
                {won ? <>Frame <span style={{ color: ACC_INK }}>{frame} of {FRAMES}</span>, {misses} wrong.</> : <>The camera pulled all the way back.</>}
              </div>
              <div style={{ fontSize: 13, fontWeight: 600, color: FADED, margin: '6px 0 4px', lineHeight: 1.5 }}>
                {won
                  ? frame === 1 ? 'From a single crop. Nobody beats that; they can only match it faster.'
                  : frame <= 3 ? 'Early. The texture gave it away before the shape did.'
                  : 'It took the shape. Tomorrow starts from the grain again.'
                  : 'Some days the whole photo still hides. Tomorrow is a new subject.'}
              </div>
              {isTodays && myStats.cur >= 2 && (
                <div style={{ fontSize: 13, fontWeight: 800, margin: '12px 0 0', display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                  <span style={{ color: 'var(--stg-warn, #b45309)' }}>{myStats.cur}-day streak</span>
                </div>
              )}
              <p className={STAGE ? undefined : 'loft-tailnote'} style={{ fontSize: 12, color: FADED, fontWeight: 600, margin: '12px 0 0' }}>
                {isTodays ? (
                  <>
                    {countdown ? <>Next Focus in <b style={{ color: INK, fontVariantNumeric: 'tabular-nums' }}>{countdown}</b>.</> : 'A new photo drops at midnight Eastern.'}
                    {prevPuzzle && (<>{' '}Meanwhile: <a href={`/focus?p=${prevPuzzle.num}`} style={{ color: COLORS.ember, fontWeight: 800, textDecoration: 'underline' }}>try yesterday&rsquo;s photo &rarr;</a></>)}
                  </>
                ) : (
                  <>
                    You&rsquo;re playing the {PUZZLE.dateLabel.replace(', 2026', '')} archive.{' '}
                    <a href="/focus" style={{ color: COLORS.ember, fontWeight: 800, textDecoration: 'underline' }}>Back to today&rsquo;s Focus &rarr;</a>
                    {' · '}<a href="/daily" style={{ color: FADED, fontWeight: 700, textDecoration: 'underline' }}>All daily puzzles</a>
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
          {LOFT && !playing && (
            <LoftFinish
              name="Focus"
              catRank={catRank}
              outcome={won ? 'won' : 'lost'}
              challengeMetric={won ? frame : null}
              title={won ? 'Solved' : 'Not solved'}
              detail={won ? `frame ${frame}/${FRAMES} · ${misses} wrong · ${elapsed}` : `X/${FRAMES} · ${misses} wrong · ${elapsed}`}
              iq={iq}
              board={dailyBoard}
              gameRank={allTime && allTime.ready
                ? { value: allTime.rank != null ? `#${Number(allTime.rank).toLocaleString()}` : '—',
                    label: allTime.field != null ? `of ${Number(allTime.field).toLocaleString()} Focus all time` : 'all-time rank' }
                : null}
              day={dayStats}
              streak={isTodays ? myStats.cur : null}
              missLabel="Misses"
              archive={puzzles
                .filter((p) => p.live <= etToday() && p.num !== PUZZLE.num)
                .sort((x, y) => y.num - x.num)
                .map((p) => ({
                  num: p.num,
                  dateLabel: p.dateLabel,
                  sunday: !!p.sunday,
                  href: `/focus?p=${p.num}`,
                  done: !!(stats && stats.rec && stats.rec[p.num]),
                  score: (stats && stats.rec && stats.rec[p.num]) ? stats.rec[p.num].s : null,
                }))}
              options={[
                { label: copied ? 'Copied' : (shareCta || 'Share'), sub: 'Your frame, not the photo', kind: 'gold', onClick: copyShare },
                { tone: won ? 'board' : 'reveal', label: won ? 'Return to photo' : 'Reveal the photo',
                  sub: won ? 'The whole picture and its credit' : 'See what it was', onClick: () => setRevealed(true) },
                prevPuzzle && { tone: 'another', label: 'Play another Focus', sub: `No. ${prevPuzzle.num}, yesterday’s photo`, href: `/focus?p=${prevPuzzle.num}` },
                nextUp && { tone: 'similar', label: 'Play similar', sub: `${nextUp.name} · ${nextUp.tag}`, href: nextUp.href },
                { tone: 'replay', label: 'Replay', sub: 'This photo again, unscored', onClick: resetGame },
                { label: 'Back to main', sub: 'The day’s full board', tone: 'main', href: '/' },
              ]}
            />
          )}
          </div>
          </div>
        </div>

        {!STAGE && <GamePanel self="focus" name="Focus" onShow={() => setShowChrome(true)} />}
        <div style={{ display: (focusMode && !STAGE) ? 'none' : 'block', margin: '30px auto 0' }}>
          {LOFT && (
            <div className={STAGE ? undefined : 'loft-report'}>
              <ReportIssue self="focus" name="Focus" accent="#ffffff" align="center" onHelp={() => setShowHelp(true)} />
            </div>
          )}
          {!LOFT && (
          <DailyGamesGrid replay={!playing ? resetGame : null} self="focus" maxWidth={620}
            challengeHref={`/duel/new?quiz=${encodeURIComponent(PUZZLE.quizId)}`}
            share={{ label: copied ? 'Copied' : 'Share', onClick: copyShare }} light
            boardSlot={<DailyBoardPanel self="focus" quizId={PUZZLE.quizId} maxWidth={620} streak={{ current: myStats.cur, best: myStats.max }} />}
            divider />
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
              <div style={{ fontSize: 17, fontWeight: 800, color: INK, marginBottom: 8 }}>Add Focus to your Home Screen</div>
              {isIosDevice() ? (
                <ol style={{ margin: '0 0 4px', paddingLeft: 20, color: INK, fontSize: 14, lineHeight: 1.7 }}>
                  <li>Tap the <b>Share</b> button in Safari&apos;s toolbar.</li>
                  <li>Scroll down and tap <b>Add to Home Screen</b>.</li>
                  <li>Tap <b>Add</b> &mdash; the tile opens today&apos;s photo, every day.</li>
                </ol>
              ) : (
                <p style={{ margin: '0 0 4px', color: INK, fontSize: 14, lineHeight: 1.7 }}>Open your browser&apos;s menu and choose <b>Add to Home Screen</b> (or <b>Install app</b>). The tile opens today&apos;s photo, every day.</p>
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
        <DailyEndCard modal self="focus" won={won}
          headline={won ? <>Named at frame {frame}.</> : <>The whole photo, and no name.</>}
          subline={won
            ? <>frame {frame}/{FRAMES} &middot; {misses} wrong &middot; {elapsed}</>
            : <>X/{FRAMES} &middot; {misses} wrong &middot; {elapsed}</>}
          onShare={copyShare} shareLabel={copied ? 'Copied' : 'Share Result'}
          onReplay={resetGame}
          onClose={() => setEndClosed(true)} />
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
            <button className="fc-btn" onClick={() => { setShowHelp(false); try { localStorage.setItem(HELP_KEY, '1'); } catch (e) {} }} style={{ marginTop: 14, background: COLORS.ink, color: T.white }}>Play</button>
          </div>
        </div>
      )}

      {/* The desktop fold: the About prose below starts one screen down (app/StageFold.jsx). */}
      <StageFold />
      <section style={{ position: 'relative', display: (focusMode && !STAGE) ? 'none' : 'block', zIndex: 2, maxWidth: 620, margin: '0 auto', padding: '10px 24px 42px', fontFamily: SANS }}>
        <h2 style={{ margin: '0 0 8px', fontSize: 15, fontWeight: 800, letterSpacing: '-0.01em', color: INK }}>About Focus</h2>
        <p style={{ margin: '0 0 8px', fontSize: 13, lineHeight: 1.65, color: FADED, fontWeight: 600 }}>
          Focus is a free daily picture game from Mind Loft. One photo a day is shown as a tight crop at nine times magnification, and the puzzle is to name it. Every wrong name pulls the camera back a frame; the sixth frame is the whole photo and one last guess. The earlier the frame, the more it pays.
        </p>
        <p style={{ margin: '0 0 8px', fontSize: 13, lineHeight: 1.65, color: FADED, fontWeight: 600 }}>
          The week has a rhythm: Space on Sunday, then Landmarks, Animals, Paintings, Machines, Faces from the history books, and on Saturday the world From above. Everyone gets the same photo each day, so the daily leaderboard is a straight fight: earliest frame, then fewest wrong names, then time.
        </p>
        <p style={{ margin: 0, fontSize: 13, lineHeight: 1.65, color: FADED, fontWeight: 600 }}>
          A new photo drops every day at midnight Eastern. No app, no signup, play free in your browser, keep a streak, and race the daily leaderboard. More trivia dailies: <a href="/niche" style={{ color: INK, fontWeight: 800 }}>Niche</a>, our daily trivia grid, <a href="/redact" style={{ color: INK, fontWeight: 800 }}>Redact</a>, our uncover-the-story daily, and <a href="/atlas" style={{ color: INK, fontWeight: 800 }}>Atlas</a>, our geography gauntlet.
        </p>
      </section>

      {!STAGE && <div style={{ position: 'relative', zIndex: 2, display: focusMode ? 'none' : 'block' }}><Footer /></div>}
    </div>
  );
}
