'use client';

// Slot, the daily blind ranking. Ten things on one hard numeric axis
// (countries by population, films by running time, metals by density)
// arrive ONE AT A TIME. Each has to be dropped into an empty slot before
// the next is shown, and a placement never moves: the tenth item takes the
// last slot left. The reveal then shows the true order beside yours.
//
// Score is exact placements out of ten (twelve on the Sunday Edition). One
// slot off counts for nothing on the score but is posted as `progress` (the
// near misses), so the board ranks score, then how close the misses were,
// then the clock. First attempt stands. `par` on the board is the modelled
// sensible player's average on THIS reveal order (scripts/slot-sim.mjs),
// and the outcome reads as "made par" when the score reaches it.
//
// The reveal order is the difficulty. Monday opens with the anchors and all
// but plays itself; Saturday opens with the middle of the board, which is
// where a blind placement breaks. The server page ships only the picked
// day's items and order (page.js), so tomorrow's answers never reach a
// browser.

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useSearchParams } from 'next/navigation';
import { X, Smartphone } from 'lucide-react';
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

const COLORS = {
  cream: T.surface, paper: T.paper, ink: T.ink, ember: T.accent,
  rust: T.danger, faded: T.muted,
  accent: '#4a5d23',        // Slot identity, a moss green, the felt the slots sit on
  accentSoft: '#eef2e3', green: T.successDeep,
};
const SANS = "'Manrope', system-ui, -apple-system, sans-serif";
const MONO = "'Manrope', ui-monospace, 'SFMono-Regular', monospace";
const HELP_KEY = 'sot_slot_help_seen';
const STATS_KEY = 'sot_slot_stats';

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
// The total varies by day (ten weekday, twelve Sunday), so the cross-device
// merge reads it off the puzzle row rather than a constant.
function totalFor(p) { return p.sunday ? 12 : 10; }
function mergeServerStats(s, recent, puzzles) {
  if (!s || !Array.isArray(recent) || !recent.length) return s;
  const byQuiz = {};
  for (const p of puzzles) byQuiz[p.quizId] = p;
  let rec = s.rec, changed = false;
  for (const m of recent) {
    const p = m && byQuiz[m.quizId];
    if (!p || m.attempt !== 1) continue;
    if (rec[p.num]) continue;
    const tot = totalFor(p);
    const sc = Math.max(0, Math.min(tot, Math.round(((m.scorePct || 0) / 100) * tot)));
    if (!changed) { rec = { ...rec }; changed = true; }
    rec[p.num] = { s: sc, t: tot, won: p.par != null ? sc >= p.par : sc * 2 >= tot };
  }
  if (!changed) return s;
  const s2 = { ...s, rec };
  try { localStorage.setItem(STATS_KEY, JSON.stringify(s2)); } catch (e) {}
  return s2;
}

const HAPT = { wrong: [0, 26, 34, 26], hit: [12], win: [10, 40, 20, 40, 20, 60] };
function vibrate(p) { try { if (typeof navigator !== 'undefined' && navigator.vibrate) navigator.vibrate(p); } catch (e) {} }

// placed: slot -> item index (or null). k: how many items have been dealt
// and placed. gave: the player ended it early (the open slots stay open and
// score nothing).
const freshState = () => ({ v: 1, placed: [], k: 0, gave: false, status: 'playing', t0: null, tEnd: null });

export default function SlotClient({ puzzles = [], dayByNum = {}, forceNum = null }) {
  const PUZZLE = useMemo(() => pickPuzzle(puzzles, forceNum), [puzzles, forceNum]);
  const DAY = dayByNum[PUZZLE.num] || { items: [], reveal: [] };
  const ITEMS = DAY.items || [];            // [name, display] in TRUE order
  const REVEAL = DAY.reveal || [];          // the order they are dealt
  const N = ITEMS.length || (PUZZLE.sunday ? 12 : 10);
  const PAR = DAY.par != null ? DAY.par : Math.round(N * 0.4);
  const TOTAL = N;
  const STORE_KEY = `sot_slot_${PUZZLE.num}`;

  const [g, setG] = useState(() => freshState());
  const gRef = useRef(g);
  const [now, setNow] = useState(() => Date.now());
  const [notice, setNotice] = useState(null);
  const [showHelp, setShowHelp] = useState(false);
  const [gateRules, setGateRules] = useState(false);
  const [copied, setCopied] = useState(false);
  const [endClosed, setEndClosed] = useState(false);
  const [revealed, setRevealed] = useState(false);
  const [dealt, setDealt] = useState(0);
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

  const playing = g.status === 'playing';
  const preStart = playing && !g.t0;
  const started = playing && !!g.t0;
  const focusMode = playing && !showChrome;
  const won = g.status === 'won';
  const LOFT = isLoft('slot');
  const STAGE = isStage('slot', searchParams);
  const [stageTheme] = useStageTheme();
  const STAGE_C = STAGE ? 'var(--stg-acc)' : gameColor('slot');
  const STAGE_ACC = { '--stg-acc-dk': gameColor('slot'), '--stg-acc-lt': gameColorLight('slot'), '--stg-onramp-lt': gameOnrampLight('slot'), '--stg-acc-ink-lt': gameAccentInkLight('slot') };
  const Cap = STAGE ? StageChrome : LoftCap;
  const INK = STAGE ? 'var(--stg-ink,#e9edf4)' : COLORS.ink;
  const FADED = STAGE ? 'var(--stg-mute,#8b95a8)' : COLORS.faded;
  const SURF = STAGE ? 'var(--stg-surf,rgba(255,255,255,0.045))' : T.white;
  const SURF_B = STAGE ? 'var(--stg-line,rgba(255,255,255,0.11))' : 'rgba(28,30,36,0.42)';
  const ACC = STAGE ? STAGE_C : COLORS.accent;
  // THE ACCENT AS TEXT: --stg-acc paints, --stg-acc-ink writes (three of the
  // ten category steps are pastels that cannot also be ink on paper).
  const ACC_INK = STAGE ? 'var(--stg-acc-ink)' : COLORS.accent;

  // The placed array is sized to the board; a save from before hydration is
  // padded so an index read never lands on undefined.
  const placed = useMemo(() => { const a = new Array(N).fill(null); (g.placed || []).forEach((v, i) => { if (i < N) a[i] = v; }); return a; }, [g.placed, N]);
  const k = Math.min(g.k || 0, N);
  const current = playing && started && k < N ? REVEAL[k] : null;   // the item in hand
  const openCount = N - k;
  const marks = useMemo(() => placed.map((it, s) => (it == null ? null : Math.abs(it - s))), [placed]);   // 0 exact, 1 one off
  const score = marks.filter((d) => d === 0).length;
  const near = marks.filter((d) => d === 1).length;
  // The slot that broke the board: the first slot, in dealing order, that
  // took the wrong item. Only readable on the reveal.
  const broke = useMemo(() => {
    for (let i = 0; i < k; i++) { const item = REVEAL[i]; const s = placed.indexOf(item); if (s >= 0 && s !== item) return s; }
    return null;
  }, [placed, k, REVEAL]);

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
        if (saved && saved.v === 1 && Array.isArray(saved.placed)) {
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
        if (done || g.t0) localStorage.setItem('sot_slot_day', JSON.stringify({ d: etToday(), done }));
        else localStorage.removeItem('sot_slot_day');
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
  // The hand card animates in each time a new item is dealt.
  useEffect(() => { setDealt((d) => d + 1); }, [k]);

  const elapsed = g.t0 ? fmtTime((g.tEnd || now) - g.t0) : '0:00';
  const isTodays = PUZZLE.num === pickPuzzle(puzzles, null).num;
  const iq = useIqStanding({ game: 'slot', quizId: PUZZLE.quizId, active: LOFT && !playing });
  const nextUp = useNextUnplayed({ self: 'slot', active: LOFT && !playing });
  const upNext = useUnplayedSimilar({ self: 'slot', active: LOFT && !playing });
  const dailyBoard = useDailyBoard({ quizId: PUZZLE.quizId, active: LOFT && !playing });
  const allTime = useGameAllTime({ game: 'slot', active: LOFT && !playing });
  const dayStats = useDayStats();
  const catRank = useCategoryRank({ self: 'slot', active: LOFT && !playing });
  const prevPuzzle = puzzles.find((x) => x.num === PUZZLE.num - 1) || null;
  const myStats = deriveStats(stats, pickPuzzle(puzzles, null).num);

  function tally(cur) {
    const pl = cur.placed || [];
    let sc = 0, nr = 0;
    for (let s = 0; s < N; s++) { const it = pl[s]; if (it == null) continue; const d = Math.abs(it - s); if (d === 0) sc++; else if (d === 1) nr++; }
    return { sc, nr };
  }

  // A started-and-left run files a row ONLY once the player has placed
  // something: opening the page and leaving is not a start.
  const REC_KEY = `sot_slot_rec_${PUZZLE.num}`;
  const abandon = useAbandonFlush(() => {
    const cur = gRef.current;
    if (!cur.t0 || cur.status !== 'playing') return null;
    if (!(cur.k > 0)) return null;
    try { if (localStorage.getItem(REC_KEY)) return null; } catch (e) {}
    const el = Math.min(36000, Math.max(1, Math.round((Date.now() - (cur.t0 || Date.now())) / 1000)));
    try { localStorage.setItem(REC_KEY, '1'); } catch (e) {}
    const { sc, nr } = tally(cur);
    return { quizId: PUZZLE.quizId, score: sc, total: TOTAL, correct: sc, guessesUsed: 0, progress: nr, timeElapsed: el, abandoned: true, email: identity?.email || undefined, anonId: getAnonId(), isMobile: isMobileDevice(), referrer: (typeof document !== 'undefined' ? document.referrer : '') };
  });

  function postResult(g2) {
    abandon.markFlushed();
    const el = g2.t0 ? Math.max(1, Math.round(((g2.tEnd || Date.now()) - g2.t0) / 1000)) : 1;
    const { sc, nr } = tally(g2);
    try { setStats(recordStat(PUZZLE.num, { s: sc, t: TOTAL, won: g2.status === 'won', near: nr })); } catch (e) {}
    try {
      fetch('/api/quiz/result', {
        method: 'POST', keepalive: true, headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ quizId: PUZZLE.quizId, score: sc, total: TOTAL, correct: sc, guessesUsed: 0, progress: nr, timeElapsed: el, email: identity?.email || undefined, anonId: getAnonId(), isMobile: isMobileDevice(), referrer: (typeof document !== 'undefined' ? document.referrer : '') }),
      })
        .then((r) => r.json())
        .then((d) => { if (d && !d.error) setBoard({ ...EMPTY_BOARD, ...d }); })
        .catch(() => {});
    } catch (e) {}
  }

  // "Replay": wipe the saved board and run today's board again as practice.
  function resetGame() {
    try { localStorage.removeItem(STORE_KEY); } catch (e) {}
    setG(freshState());
    setNotice(null);
    setEndClosed(false);
    setRevealed(false);
  }

  function commit(next) { gRef.current = next; setG(next); }
  function startGame() {
    const cur = gRef.current;
    if (cur.t0) return;
    commit({ ...cur, placed: new Array(N).fill(null), k: 0, t0: Date.now() });
    setNow(Date.now());
    try { localStorage.setItem(HELP_KEY, '1'); } catch (e) {}
  }

  function say(msg, kind) {
    setNotice({ msg, kind: kind || 'note' });
    if (noticeRef.current) clearTimeout(noticeRef.current);
    noticeRef.current = setTimeout(() => setNotice(null), 2200);
  }

  // The round ends on its own when the last slot fills. Made par is the win.
  function finish(next, gave) {
    const { sc } = tally(next);
    const fin = { ...next, gave: !!gave, status: sc >= PAR ? 'won' : 'lost', tEnd: Date.now() };
    vibrate(fin.status === 'won' ? HAPT.win : HAPT.wrong);
    postResult(fin);
    return fin;
  }

  function place(slot) {
    const cur = gRef.current;
    if (cur.status !== 'playing' || !cur.t0) return;
    const kk = Math.min(cur.k || 0, N);
    if (kk >= N) return;
    const pl = (cur.placed && cur.placed.length === N) ? cur.placed.slice() : new Array(N).fill(null);
    if (pl[slot] != null) return;
    pl[slot] = REVEAL[kk];
    let next = { ...cur, placed: pl, k: kk + 1 };
    vibrate(HAPT.hit);
    if (kk + 1 === N) next = finish(next, false);
    else say(`${ITEMS[REVEAL[kk]][0]} locked in slot ${slot + 1}.`, 'hit');
    commit(next);
  }

  // Give up: the open slots stay open and score nothing. The day ends.
  function giveUp() {
    const cur = gRef.current;
    if (cur.status !== 'playing' || !cur.t0) return;
    commit(finish(cur, true));
  }

  // Digit keys place into slots 1 to 9, 0 into slot 10.
  useEffect(() => {
    if (!started || !playing) return undefined;
    const onKey = (e) => {
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      const t = e.target;
      if (t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA')) return;
      if (/^[0-9]$/.test(e.key)) { const s = e.key === '0' ? 9 : Number(e.key) - 1; if (s < N) { e.preventDefault(); place(s); } }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [started, playing, N]);

  function shareUrl() { return withRef(`mindloftdaily.com/slot${isTodays ? '' : `?p=${PUZZLE.num}`}`); }
  function brokeBit() {
    if (broke == null) return score === N ? 'never broke' : 'held the line';
    return `broke on ${ITEMS[placed[broke]][0]}`;
  }
  function strip() {
    // Green exact, amber one off, white a miss. The breaking slot is marked.
    return placed.map((it, s) => (it == null ? '⬛' : marks[s] === 0 ? '🟩' : marks[s] === 1 ? '🟨' : '⬜')).join('');
  }
  function shareText() {
    // The axis and the strip travel, never a placement and never a figure.
    const streakBit = isTodays && myStats.cur >= 2 ? ` · streak ${myStats.cur}` : '';
    const head = `Slot #${PUZZLE.num} · ${score}/${N} · par ${PAR} · ${brokeBit()} · ${elapsed}${streakBit}`;
    return `${head}\n${DAY.axis}\n${strip()}\n${shareUrl()}`;
  }
  function copyShare() {
    const text = playing
      ? `Slot #${PUZZLE.num}: ${N} things, one at a time, place each before you see the next. From Mind Loft.\n${shareUrl()}`
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
      lead={`${PUZZLE.sunday ? 'Twelve' : 'Ten'} things on one axis, shown one at a time. Drop each into a slot before you see the next.`}
      banner={PUZZLE.sunday ? 'Sunday Edition · twelve slots' : null}
      steps={[
        <>The board is <b>{N} empty slots</b> on one hard numeric axis, slot 1 at the top: today, <b>{DAY.axis ? DAY.axis.toLowerCase() : 'the axis'}</b>. Slot 1 is {DAY.top ? DAY.top.toLowerCase() : 'the top'}, slot {N} is {DAY.bottom ? DAY.bottom.toLowerCase() : 'the bottom'}.</>,
        <>The items arrive <b>one at a time</b>. Tap any open slot to drop the item in hand there, and it is <b>locked for good</b>. You will not see what is still to come. The last item takes the last slot left.</>,
        <>The reveal shows the true order beside yours. <b>Green</b> is the right slot and scores a point; <b>amber</b> is one slot off, which scores nothing but breaks a tie on the board; white is a miss.</>,
        <><b>Par</b> is what a sensible player averages on today&rsquo;s order of arrival (today: <b>{PAR}</b>). The order changes how hard the same ten things are, and the week climbs: Monday deals the anchors first, Saturday deals the middle of the board first.</>,
      ]}
      knack="Leave room. The first item is almost never a 1 or a 10, so the mistake is spending an end slot on it. Ask where it sits among everything that COULD be on this board, not among what you have seen."
      footer="Ranks by exact placements, then near misses, then the clock. First attempt stands."
    />
  );

  const slotLabel = (s) => (s === 0 ? DAY.top : s === N - 1 ? DAY.bottom : null);

  return (
    <div className={STAGE ? 'stage-page' : (LOFT ? 'loft-page' : undefined)}
      data-stage-theme={STAGE ? stageTheme : undefined}
      style={{ ...(STAGE ? STAGE_ACC : null), minHeight: '100vh', background: STAGE ? 'var(--stg-ground)' : T.surface, color: STAGE ? 'var(--stg-ink,#e9edf4)' : undefined, position: 'relative', overflowX: (STAGE || LOFT) ? 'hidden' : undefined }}>
      {!STAGE && <Grain />}
      {!STAGE && (
      <DailyChrome slug="slot" name="Slot" collapsed={started} loft={LOFT} />
      )}
      {LOFT && (
        <Cap gameKey="slot" quizId={PUZZLE.quizId}
          name="Slot"
          cat="Trivia"
          sunday={PUZZLE.sunday ? 'Sunday Edition' : null}
          outcome={playing ? null : (won ? 'won' : 'lost')}
          num={PUZZLE.num}
          tiles={playing ? null : upNext}
          dateLabel={PUZZLE.dateLabel}
          progress={playing ? k / N : score / TOTAL}
          onHelp={() => setShowHelp(true)}
          figures={playing ? [
            { v: `${k}/${N}`, k: 'placed' },
            { v: String(PAR), k: 'par' },
            { v: elapsed, k: 'time' },
          ] : [
            { v: `${score}/${TOTAL}`, k: 'score' },
            { v: String(PAR), k: 'par' },
            { v: elapsed, k: 'time' },
          ]}
        />
      )}
      <div className="sl-wrap" style={{ position: 'relative', zIndex: 2, maxWidth: 1180, margin: '0 auto', padding: '18px 38px 80px', fontFamily: SANS }}>
        {/* dangerouslySetInnerHTML, not a text child: Next escapes a quote in a
            text child to &#x27; and the CSS parser drops that declaration. */}
        <style dangerouslySetInnerHTML={{ __html: `
          @media(max-width:560px){.sl-wrap{padding-left:10px !important;padding-right:10px !important;}}
          .sl-btn{font-family:${SANS};font-weight:800;font-size:14px;border:2px solid ${STAGE ? 'var(--stg-line2)' : 'var(--blue-deep)'};background:${STAGE ? 'transparent' : 'var(--white)'};color:${STAGE ? 'var(--stg-ink)' : 'var(--blue-deep)'};border-radius:8px;padding:9px 16px;cursor:pointer;display:inline-flex;align-items:center;gap:7px;}
          .sl-btn:hover{background:var(--stg-surf2, var(--accent-soft));}
          .sl-btn:disabled{opacity:.45;cursor:default;}
          .sl-hand{position:sticky;top:0;z-index:6;background:${STAGE ? 'var(--stg-ground)' : T.surface};padding:6px 0 10px;}
          .sl-card{border:2px solid var(--stg-acc, ${COLORS.accent});border-radius:10px;padding:12px 14px;display:grid;grid-template-columns:1fr auto;gap:4px 12px;align-items:center;background:var(--stg-cell, ${T.white});color:${INK};}
          .sl-card.pop{animation:slpop .22s ease-out;}
          @keyframes slpop{from{opacity:0}to{opacity:1}}
          .sl-card .lab{grid-column:1/-1;font-family:${MONO};font-size:10px;letter-spacing:.14em;text-transform:uppercase;color:var(--stg-acc-ink, ${COLORS.accent});}
          /* Two lines of room whatever the name, so the card, and everything
             under it, holds one height from deal to deal. */
          .sl-card .nm{font-size:24px;font-weight:800;letter-spacing:-.02em;line-height:1.05;text-wrap:balance;min-height:2.1em;display:flex;align-items:center;}
          .sl-note{font-family:${MONO};font-size:11px;line-height:17px;min-height:17px;margin-top:6px;color:var(--stg-acc-ink, ${COLORS.accent});}
          .sl-card .cnt{font-family:${MONO};font-size:12px;color:${FADED};text-align:right;white-space:nowrap;}
          .sl-axis{font-size:15px;font-weight:800;letter-spacing:-.01em;color:${INK};margin:0 0 2px;}
          .sl-sub{font-size:12.5px;font-weight:600;color:${FADED};margin:0 0 10px;}
          .sl-slots{display:grid;gap:6px;}
          .sl-slot{display:grid;grid-template-columns:40px 1fr auto;align-items:center;min-height:46px;border:1.5px solid var(--stg-cell-line, rgba(28,30,36,0.35));border-radius:8px;background:var(--stg-cell, ${T.white});text-align:left;padding:0;overflow:hidden;color:${INK};font-family:${SANS};}
          .sl-slot .n{font-family:${MONO};font-size:13px;color:${FADED};text-align:center;font-variant-numeric:tabular-nums;}
          .sl-slot .nm{font-weight:800;font-size:15px;padding:7px 0;min-width:0;}
          .sl-slot .nm small{display:block;font-size:10px;font-weight:700;letter-spacing:.1em;text-transform:uppercase;color:${FADED};}
          .sl-slot .r{font-family:${MONO};font-size:11px;color:${FADED};padding:0 12px 0 8px;text-align:right;white-space:nowrap;line-height:1.3;}
          .sl-slot .r b{display:block;font-family:${SANS};font-weight:700;font-size:12.5px;color:${INK};}
          .sl-slot.open{border-style:dashed;cursor:pointer;}
          .sl-slot.open .nm{color:${FADED};font-weight:600;}
          .sl-slot.open:hover,.sl-slot.open:focus-visible{border-style:solid;border-color:var(--stg-acc, ${COLORS.accent});background:var(--stg-acc-tint, ${COLORS.accentSoft});}
          .sl-slot.locked{cursor:default;}
          .sl-slot.g{border-color:var(--stg-good, ${COLORS.green});border-left-width:6px;}
          .sl-slot.a{border-color:var(--stg-warn, #b45309);border-left-width:6px;}
          .sl-slot.x{border-color:var(--stg-bad, ${COLORS.rust});border-left-width:6px;}
          .sl-slot.g .n{color:var(--stg-good, ${COLORS.green});} .sl-slot.a .n{color:var(--stg-warn, #b45309);} .sl-slot.x .n{color:var(--stg-bad, ${COLORS.rust});}
          .sl-slot.broke .nm small{color:var(--stg-bad, ${COLORS.rust});}
          .sl-strip{display:flex;gap:4px;margin:12px 0 6px;}
          .sl-strip i{flex:1;aspect-ratio:1;border-radius:3px;background:var(--stg-line2, #cfd5e0);display:block;max-width:28px;}
          .sl-strip i.g{background:var(--stg-good, ${COLORS.green});} .sl-strip i.a{background:var(--stg-warn, #b45309);}
          .sl-strip i.b{outline:2px solid var(--stg-bad, ${COLORS.rust});outline-offset:-2px;}
          .sl-card2{background:${SURF};border:1px solid ${SURF_B};border-radius:9px;padding:14px;margin-top:12px;}
          .sl-card2 h3{margin:0 0 6px;font-family:${MONO};font-size:10.5px;letter-spacing:.14em;text-transform:uppercase;color:${FADED};font-weight:500;}
        ` }} />

        <div style={{ maxWidth: 640, margin: '0 auto' }}>

        {!LOFT && (
        <DailyMasthead
          slug="slot" num={PUZZLE.num} dateLabel={PUZZLE.dateLabel} accent={COLORS.accent}
          blockGap={5} helpTop={13} marginBottom={16} onHelp={() => setShowHelp(true)}
          blocks={'SLOT'.split('').map((ch, i) => (
            <div key={i} style={{ width: 38, height: 38, borderRadius: 5, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: SANS, fontWeight: 900, fontSize: 22, background: i === 0 ? `var(--stg-acc, ${COLORS.accent})` : COLORS.ink, color: i === 0 ? `var(--stg-onramp, ${T.white})` : T.white, boxShadow: 'inset 0 2px 5px rgba(0,0,0,0.5), 0 1px 0 rgba(255,255,255,0.65)' }}>{ch}</div>
          ))}
        />
        )}

        <div className={LOFT && !STAGE ? 'loft-stage' : undefined}>
          <div className={LOFT && !STAGE && !playing ? (revealed ? 'loft-flip' : 'loft-flip on') : undefined}>
          <div className={LOFT && !STAGE && !playing ? 'loft-flip-in' : undefined}>
          <div className={LOFT && !STAGE && !playing ? 'loft-face' : undefined}>

        {preStart && (
          <div className={STAGE ? 'stg-gate' : undefined} style={{ maxWidth: 640, margin: '0 auto', background: STAGE ? SURF : COLORS.cream, border: STAGE ? `1px solid ${SURF_B}` : `2px solid ${COLORS.ink}`, borderRadius: 12, padding: '22px', display: 'flex', flexDirection: 'column' }}>
            <div style={{ fontSize: 20, fontWeight: 800, color: INK, marginBottom: 10 }}>{gateRules ? 'How to play' : 'Slot is ready'}</div>
            {gateRules ? rulesBody : (
              <div style={{ fontSize: 14, lineHeight: 1.55, color: INK, fontWeight: 600 }}>
                <p style={{ margin: '0 0 6px' }}><b>{DAY.axis}.</b> {N} things arrive one at a time; place each in a slot before you see the next, and nothing moves once it is down. Par today is {PAR}. The clock starts when you do.</p>
              </div>
            )}
            <div style={{ marginTop: 18, display: 'flex', flexDirection: 'row-reverse', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
              <button className="sl-btn" onClick={startGame} style={{ background: STAGE ? STAGE_C : T.cta, color: STAGE ? 'var(--stg-onramp, #08222e)' : T.white, fontSize: 15, padding: '11px 22px', borderColor: 'transparent' }}>Start</button>
              <div>
                <button type="button" onClick={() => setGateRules((v) => !v)} style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', fontFamily: SANS, fontSize: 13, fontWeight: 700, color: FADED, textDecoration: 'underline' }}>
                  {gateRules ? 'Hide detailed instructions' : 'Show detailed instructions'}
                </button>
              </div>
            </div>
          </div>
        )}

        {!preStart && (
        <div className={STAGE ? 'stg-board' : (LOFT ? 'loft-card' : undefined)} style={{ background: STAGE ? 'transparent' : T.white, border: STAGE ? 'none' : `2px solid ${COLORS.ink}`, borderRadius: 10, padding: STAGE ? 0 : '13px 15px 15px', boxShadow: STAGE ? 'none' : '5px 5px 0 rgba(28,30,36,0.16)', marginBottom: 12 }}>
          {!LOFT && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, fontFamily: MONO, fontSize: 11.5, letterSpacing: '0.1em', textTransform: 'uppercase', color: FADED, borderBottom: '1px solid rgba(28,30,36,0.18)', paddingBottom: 8, marginBottom: 12, flexWrap: 'wrap' }}>
            <span style={{ whiteSpace: 'nowrap' }}>placed <b style={{ color: INK, fontWeight: 500, fontVariantNumeric: 'tabular-nums' }}>{k}/{N}</b></span>
            <span style={{ whiteSpace: 'nowrap' }}>time <b style={{ color: INK, fontWeight: 500, fontVariantNumeric: 'tabular-nums' }}>{elapsed}</b></span>
            <span style={{ marginLeft: 'auto', whiteSpace: 'nowrap' }}>par <b style={{ color: INK, fontWeight: 500 }}>{PAR}</b></span>
          </div>
          )}

          <p className="sl-axis">{DAY.axis}</p>
          <p className="sl-sub">Slot 1 is {DAY.top ? DAY.top.toLowerCase() : 'the top'}, slot {N} is {DAY.bottom ? DAY.bottom.toLowerCase() : 'the bottom'}. {playing ? 'A placement locks the moment you tap it.' : `Source: ${DAY.source}.`}</p>

          {playing && (
            <div className="sl-hand">
              {current != null ? (
                <div key={dealt} className="sl-card pop" role="status" aria-live="polite">
                  <div className="lab">Item {k + 1} of {N} · in hand</div>
                  <div className="nm">{ITEMS[current][0]}</div>
                  <div className="cnt">{openCount === 1 ? 'the last one, one slot left' : `${openCount - 1} still to come`}</div>
                </div>
              ) : null}
              {/* The line is always in the flow: a notice that came and went
                  used to push the slot list down and back up on every tap. */}
              <div className="sl-note" aria-live="polite">{notice ? notice.msg : ' '}</div>
            </div>
          )}

          <div className="sl-slots" role="group" aria-label={`${N} slots`}>
            {placed.map((it, s) => {
              const open = it == null;
              const cls = !playing && !open ? (marks[s] === 0 ? ' g' : marks[s] === 1 ? ' a' : ' x') : '';
              const isBroke = !playing && broke === s;
              const truth = ITEMS[s];
              const Tag = open && playing ? 'button' : 'div';
              return (
                <Tag key={s} type={open && playing ? 'button' : undefined} className={`sl-slot${open ? ' open' : ' locked'}${cls}${isBroke ? ' broke' : ''}`}
                  onClick={open && playing ? () => place(s) : undefined}
                  aria-label={open ? `Slot ${s + 1}, open` : `Slot ${s + 1}: ${ITEMS[it][0]}`}>
                  <span className="n">{s + 1}</span>
                  <span className="nm">
                    {open ? (playing ? (slotLabel(s) || 'Open') : (slotLabel(s) ? `${slotLabel(s)} · open` : 'Open')) : ITEMS[it][0]}
                    {!open && isBroke && <small>broke here</small>}
                    {open && playing && slotLabel(s) && <small>slot {s + 1}</small>}
                  </span>
                  {!playing && (won || !LOFT || revealed || (!open && marks[s] === 0)) && (
                    <span className="r">
                      {open ? <>actual<b>{truth[0]} · {truth[1]}</b></> : marks[s] === 0 ? <b>{ITEMS[it][1]}</b> : <>actual<b>{truth[0]} · {truth[1]}</b></>}
                    </span>
                  )}
                </Tag>
              );
            })}
          </div>

          {playing && started && (
            <div style={{ display: 'flex', gap: 8, marginTop: 12, flexWrap: 'wrap', alignItems: 'center' }}>
              <button type="button" className="sl-btn" onClick={giveUp} style={{ fontSize: 12.5, padding: '7px 12px' }}>Give up</button>
              <span style={{ fontFamily: MONO, fontSize: 10.5, color: FADED }}>Keys 1 to {N > 9 ? '9 and 0' : N} place too.</span>
            </div>
          )}

          {!playing && (
            <div className="sl-card2">
              <h3>Result</h3>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 6 }}>
                <div><div style={{ fontFamily: MONO, fontSize: 22, color: ACC_INK }}>{score}<span style={{ fontSize: 13, color: FADED }}>/{TOTAL}</span></div><div style={{ fontFamily: MONO, fontSize: 9.5, letterSpacing: '.12em', textTransform: 'uppercase', color: FADED }}>right slot</div></div>
                <div><div style={{ fontFamily: MONO, fontSize: 22, color: INK }}>{near}</div><div style={{ fontFamily: MONO, fontSize: 9.5, letterSpacing: '.12em', textTransform: 'uppercase', color: FADED }}>one off</div></div>
                <div><div style={{ fontFamily: MONO, fontSize: 22, color: INK }}>{PAR}</div><div style={{ fontFamily: MONO, fontSize: 9.5, letterSpacing: '.12em', textTransform: 'uppercase', color: FADED }}>par</div></div>
              </div>
              <div className="sl-strip" aria-hidden="true">
                {placed.map((it, s) => <i key={s} className={`${it == null ? '' : marks[s] === 0 ? 'g' : marks[s] === 1 ? 'a' : ''}${broke === s ? ' b' : ''}`} />)}
              </div>
              <div style={{ fontSize: 13, fontWeight: 700, color: won ? `var(--stg-good, ${COLORS.green})` : `var(--stg-ink, ${COLORS.rust})` }}>
                {score === N ? `Perfect. Every one of the ${N} in its slot, in ${elapsed}.` : `${won ? 'Made par.' : 'Short of par.'} ${score} of ${N} in the right slot${broke != null ? `, ${brokeBit()}` : ''}. ${elapsed}.`}
              </div>
            </div>
          )}
        </div>
        )}

          <div className={STAGE ? undefined : 'loft-sol'}>
          {!playing && (
            <div style={{ maxWidth: 560, margin: '0 auto' }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: FADED, margin: '8px 0 4px', lineHeight: 1.5 }}>
                {score === N ? 'The reveal order was chosen to break this board somewhere in the middle. It did not break you.' : broke != null && broke > 0 && broke < N - 1
                  ? 'The middle band is where a blind placement goes wrong: an item that arrives early and belongs near the middle spends a slot the later, bigger items needed.'
                  : 'The end slots are the safe ones and the middle is the trap. Tomorrow is a different axis and a different order.'}
              </div>
              {isTodays && myStats.cur >= 2 && (
                <div style={{ fontSize: 13, fontWeight: 800, margin: '12px 0 0', display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                  <span style={{ color: 'var(--stg-warn, #b45309)' }}>{myStats.cur}-day streak</span>
                </div>
              )}
              <p className={STAGE ? undefined : 'loft-tailnote'} style={{ fontSize: 12, color: FADED, fontWeight: 600, margin: '12px 0 0' }}>
                {isTodays ? (
                  <>
                    {countdown ? <>Next Slot in <b style={{ color: INK, fontVariantNumeric: 'tabular-nums' }}>{countdown}</b>.</> : 'A new board drops at midnight Eastern.'}
                    {prevPuzzle && (<>{' '}Meanwhile: <a href={`/slot?p=${prevPuzzle.num}`} style={{ color: COLORS.ember, fontWeight: 800, textDecoration: 'underline' }}>try yesterday&rsquo;s board &rarr;</a></>)}
                  </>
                ) : (
                  <>
                    You&rsquo;re playing the {PUZZLE.dateLabel.replace(', 2026', '')} archive.{' '}
                    <a href="/slot" style={{ color: COLORS.ember, fontWeight: 800, textDecoration: 'underline' }}>Back to today&rsquo;s Slot &rarr;</a>
                    {' · '}<a href="/archive" style={{ color: FADED, fontWeight: 700, textDecoration: 'underline' }}>Puzzle archive</a>
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
              name="Slot"
              catRank={catRank}
              outcome={won ? 'won' : 'lost'}
              title={score === N ? 'Perfect' : won ? 'Made par' : 'Under par'}
              detail={`${score}/${N} in the right slot · par ${PAR} · ${brokeBit()} · ${elapsed}`}
              iq={iq}
              board={dailyBoard}
              gameRank={allTime && allTime.ready
                ? { value: allTime.rank != null ? `#${Number(allTime.rank).toLocaleString()}` : '—',
                    label: allTime.field != null ? `of ${Number(allTime.field).toLocaleString()} Slot all time` : 'all-time rank' }
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
                  href: `/slot?p=${p.num}`,
                  done: !!(stats && stats.rec && stats.rec[p.num]),
                  score: (stats && stats.rec && stats.rec[p.num]) ? stats.rec[p.num].s : null,
                }))}
              options={[
                { label: copied ? 'Copied' : (shareCta || 'Share'), sub: 'The strip and the axis, never a placement', kind: 'gold', onClick: copyShare },
                { tone: won ? 'board' : 'reveal', label: 'Return to board',
                  sub: 'The true order beside yours', onClick: () => setRevealed(true) },
                prevPuzzle && { tone: 'another', label: 'Play another Slot', sub: `No. ${prevPuzzle.num}, yesterday’s board`, href: `/slot?p=${prevPuzzle.num}` },
                nextUp && { tone: 'similar', label: 'Play similar', sub: `${nextUp.name} · ${nextUp.tag}`, href: nextUp.href },
                { tone: 'replay', label: 'Replay', sub: 'This board again, unscored', onClick: resetGame },
                { label: 'Back to main', sub: 'The day’s full board', tone: 'main', href: '/' },
              ]}
            />
          )}
          </div>
          </div>
        </div>

        {!STAGE && <GamePanel self="slot" name="Slot" onShow={() => setShowChrome(true)} />}
        <div style={{ display: (focusMode && !STAGE) ? 'none' : 'block', margin: '30px auto 0' }}>
          {LOFT && (
            <div className={STAGE ? undefined : 'loft-report'}>
              <ReportIssue self="slot" name="Slot" accent="#ffffff" align="center" onHelp={() => setShowHelp(true)} />
            </div>
          )}
          {!LOFT && (
          <DailyGamesGrid replay={!playing ? resetGame : null} self="slot" maxWidth={620}
            challengeHref={`/duel/new?quiz=${encodeURIComponent(PUZZLE.quizId)}`}
            share={{ label: copied ? 'Copied' : 'Share', onClick: copyShare }} light
            boardSlot={<DailyBoardPanel self="slot" quizId={PUZZLE.quizId} maxWidth={620} streak={{ current: myStats.cur, best: myStats.max }} />}
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
              <div style={{ fontSize: 17, fontWeight: 800, color: INK, marginBottom: 8 }}>Add Slot to your Home Screen</div>
              {isIosDevice() ? (
                <ol style={{ margin: '0 0 4px', paddingLeft: 20, color: INK, fontSize: 14, lineHeight: 1.7 }}>
                  <li>Tap the <b>Share</b> button in Safari&apos;s toolbar.</li>
                  <li>Scroll down and tap <b>Add to Home Screen</b>.</li>
                  <li>Tap <b>Add</b>. The tile opens today&apos;s board, every day.</li>
                </ol>
              ) : (
                <p style={{ margin: '0 0 4px', color: INK, fontSize: 14, lineHeight: 1.7 }}>Open your browser&apos;s menu and choose <b>Add to Home Screen</b> (or <b>Install app</b>). The tile opens today&apos;s board, every day.</p>
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
        <DailyEndCard modal self="slot" won={won}
          headline={score === N ? <>Perfect.</> : won ? <>Made par.</> : <>Short of par.</>}
          subline={<>{score}/{N} in the right slot &middot; par {PAR} &middot; {brokeBit()} &middot; {elapsed}</>}
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
            <button className="sl-btn" onClick={() => { setShowHelp(false); try { localStorage.setItem(HELP_KEY, '1'); } catch (e) {} }} style={{ marginTop: 14, background: COLORS.ink, color: T.white }}>Play</button>
          </div>
        </div>
      )}

      {/* The desktop fold: the About prose below starts one screen down (app/StageFold.jsx). */}
      <StageFold />
      <section style={{ position: 'relative', display: (focusMode && !STAGE) ? 'none' : 'block', zIndex: 2, maxWidth: 620, margin: '0 auto', padding: '10px 24px 42px', fontFamily: SANS }}>
        <h2 style={{ margin: '0 0 8px', fontSize: 15, fontWeight: 800, letterSpacing: '-0.01em', color: INK }}>About Slot</h2>
        <p style={{ margin: '0 0 8px', fontSize: 13, lineHeight: 1.65, color: FADED, fontWeight: 600 }}>
          Slot is a free daily blind ranking puzzle from Mind Loft. Ten real things on one hard numeric axis, countries by population, films by running time, metals by density, arrive one at a time, and each has to be dropped into an empty slot before the next is shown. A placement never moves. The tenth item takes the last slot left, and the reveal shows the true order beside yours with the real figures.
        </p>
        <p style={{ margin: '0 0 8px', fontSize: 13, lineHeight: 1.65, color: FADED, fontWeight: 600 }}>
          Score is exact placements out of ten, and every board carries a par: what a sensible player averages on that day&rsquo;s order of arrival. The order is the difficulty. The same ten things dealt anchors first all but play themselves; dealt middle first, they break most boards somewhere around slot five. The week climbs from Monday to Saturday and the Sunday Edition runs twelve slots. Everyone gets the same board and the same order, so the daily leaderboard ranks by exact placements, then near misses, then time.
        </p>
        <p style={{ margin: 0, fontSize: 13, lineHeight: 1.65, color: FADED, fontWeight: 600 }}>
          A new board drops every day at midnight Eastern. No app, no signup, play free in your browser, keep a streak, and race the daily leaderboard. More trivia dailies: <a href="/listed" style={{ color: INK, fontWeight: 800 }}>Listed</a>, our full-information ranking puzzle, <a href="/bracket" style={{ color: INK, fontWeight: 800 }}>Bracket</a>, our daily bracket of real things, and <a href="/thread" style={{ color: INK, fontWeight: 800 }}>Thread</a>, nine films described badly.
        </p>
      </section>

      {!STAGE && <div style={{ position: 'relative', zIndex: 2, display: focusMode ? 'none' : 'block' }}><Footer /></div>}
    </div>
  );
}
