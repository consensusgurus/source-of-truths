'use client';

// Flank — the daily borders game.
//
// One country a day, and every country that shares a land border with it is
// an answer. Type them all. A wrong country costs a strike and three strikes
// end the run (four on Sundays, which hand you a giant). Typos and unknown
// words cost nothing; only a real country that does not border counts against
// you. Score is borders named, ties break by wrong guesses then time.
//
// Matching happens live on every keystroke: a complete country name banks
// itself with no Enter needed. The four aliases that are a proper prefix of
// another country's name (uk/ukraine, niger/nigeria, guinea/guinea-bissau,
// dominica/dominican republic) commit on Enter only, so typing through them
// can never bank or strike the wrong country. See buildPrefixAmbiguous in
// borders.js; the verifier audits the whole alias table for this.

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useSearchParams } from 'next/navigation';
import { X, Smartphone, Milestone } from 'lucide-react';
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
import { isLoft } from '@/lib/loft';
import { T } from '@/lib/theme';
import { meRequest } from '@/app/quizMeClient';
import { BORDERS, buildAliasMap, buildPrefixAmbiguous, normGuess } from './borders';

const COLORS = {
  cream: T.surface, paper: T.paper, ink: T.ink, ember: T.accent,
  rust: T.danger, faded: T.muted,
  accent: '#3f6212',        // Flank identity — boundary-line olive
  accentSoft: '#eef7e2', green: T.successDeep,
};
const SANS = "'Manrope', system-ui, -apple-system, sans-serif";
const MONO = "'DM Mono', ui-monospace, 'SFMono-Regular', monospace";
const HELP_KEY = 'sot_flank_help_seen';
const STATS_KEY = 'sot_flank_stats';

const ALIAS = buildAliasMap();
const PREFIX_AMBIG = buildPrefixAmbiguous(ALIAS);
const nameOf = (code) => (BORDERS[code] ? BORDERS[code].name : code);

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
// Flank's total varies by day (the neighbor count), so the cross-device merge
// reads each puzzle's own total off the light puzzles array.
function mergeServerStats(s, recent, puzzles) {
  if (!s || !Array.isArray(recent) || !recent.length) return s;
  const byQuiz = {};
  for (const p of puzzles) byQuiz[p.quizId] = p;
  let rec = s.rec, changed = false;
  for (const m of recent) {
    const p = m && byQuiz[m.quizId];
    if (!p || m.attempt !== 1) continue;
    if (rec[p.num]) continue;
    const tot = p.total || 1;
    const sc = Math.max(0, Math.min(tot, Math.round(((m.scorePct || 0) / 100) * tot)));
    if (!changed) { rec = { ...rec }; changed = true; }
    rec[p.num] = { s: sc, t: tot, won: !!m.perfect };
  }
  if (!changed) return s;
  const s2 = { ...s, rec };
  try { localStorage.setItem(STATS_KEY, JSON.stringify(s2)); } catch (e) {}
  return s2;
}

const HAPT = { ok: [7], wrong: [0, 26, 34, 26], win: [10, 40, 20, 40, 20, 60] };
function vibrate(p) { try { if (typeof navigator !== 'undefined' && navigator.vibrate) navigator.vibrate(p); } catch (e) {} }

// found/wrong hold entity codes in the order they were played. Strikes are
// wrong.length; the budget is 3, 4 on a Sunday giant.
const freshState = () => ({ v: 1, found: [], wrong: [], status: 'playing', t0: null, tEnd: null });

export default function FlankClient({ puzzles = [], dayByNum = {}, forceNum = null }) {
  const PUZZLE = useMemo(() => pickPuzzle(puzzles, forceNum), [puzzles, forceNum]);
  const DAY = dayByNum[PUZZLE.num] || { c: null, a: [] };
  const ANSWERS = DAY.a;
  const TOTAL = ANSWERS.length;
  const STRIKES = PUZZLE.sunday ? 4 : 3;
  const STORE_KEY = `sot_flank_${PUZZLE.num}`;

  const [g, setG] = useState(() => freshState());
  const gRef = useRef(g);
  const [now, setNow] = useState(() => Date.now());
  const [q, setQ] = useState('');
  const [notice, setNotice] = useState(null);   // { msg, kind } cleared on a timer
  const [flash, setFlash] = useState(null);     // code of the slot that just filled
  const [showHelp, setShowHelp] = useState(false);
  const [gateRules, setGateRules] = useState(false);
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

  const playing = g.status === 'playing';
  const preStart = playing && !g.t0;
  const started = playing && !!g.t0;
  const focusMode = playing && !showChrome;
  const won = g.status === 'won';
  const LOFT = isLoft('flank');
  const STAGE = isStage('flank', searchParams);
  // The register comes from the shared store the switch in the cap writes.
  // Resolved in an effect: the server cannot know what is stored.
  const [stageTheme] = useStageTheme();
  const STAGE_C = STAGE ? 'var(--stg-acc)' : gameColor('flank');
  const STAGE_ACC = { '--stg-acc-dk': gameColor('flank'), '--stg-acc-lt': gameColorLight('flank'), '--stg-onramp-lt': gameOnrampLight('flank'), '--stg-acc-ink-lt': gameAccentInkLight('flank') };
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
  const ACC_DEEP = STAGE ? STAGE_C : COLORS.accentDeep;
  const ACC_SOFT = STAGE ? 'var(--stg-line,rgba(255,255,255,0.11))' : COLORS.accentSoft;
  const ON_ACC = STAGE ? 'var(--stg-onramp, #08222e)' : 'var(--white)';
  const foundCount = g.found.length;
  const strikes = g.wrong.length;

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
        if (saved && saved.v === 1 && Array.isArray(saved.found)) {
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
        if (done || g.t0) localStorage.setItem('sot_flank_day', JSON.stringify({ d: etToday(), done }));
        else localStorage.removeItem('sot_flank_day');
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

  const elapsed = g.t0 ? fmtTime((g.tEnd || now) - g.t0) : '0:00';
  const isTodays = PUZZLE.num === pickPuzzle(puzzles, null).num;
  const iq = useIqStanding({ game: 'flank', quizId: PUZZLE.quizId, active: LOFT && !playing });
  const nextUp = useNextUnplayed({ self: 'flank', active: LOFT && !playing });
  const upNext = useUnplayedSimilar({ self: 'flank', active: LOFT && !playing });
  const dailyBoard = useDailyBoard({ quizId: PUZZLE.quizId, active: LOFT && !playing });
  const allTime = useGameAllTime({ game: 'flank', active: LOFT && !playing });
  const dayStats = useDayStats();
  const catRank = useCategoryRank({ self: 'flank', active: LOFT && !playing });
  const prevPuzzle = puzzles.find((x) => x.num === PUZZLE.num - 1) || null;
  const myStats = deriveStats(stats, pickPuzzle(puzzles, null).num);

  const REC_KEY = `sot_flank_rec_${PUZZLE.num}`;
  const abandon = useAbandonFlush(() => {
    const cur = gRef.current;
    if (!cur.t0 || cur.status !== 'playing') return null;
    try { if (localStorage.getItem(REC_KEY)) return null; } catch (e) {}
    const el = Math.min(36000, Math.max(1, Math.round((Date.now() - (cur.t0 || Date.now())) / 1000)));
    try { localStorage.setItem(REC_KEY, '1'); } catch (e) {}
    return { quizId: PUZZLE.quizId, score: cur.found.length, total: TOTAL, correct: cur.found.length, guessesUsed: cur.wrong.length, timeElapsed: el, abandoned: true, email: identity?.email || undefined, anonId: getAnonId(), isMobile: isMobileDevice(), referrer: (typeof document !== 'undefined' ? document.referrer : '') };
  });

  function postResult(g2) {
    abandon.markFlushed();
    const el = g2.t0 ? Math.max(1, Math.round(((g2.tEnd || Date.now()) - g2.t0) / 1000)) : 1;
    const score = g2.found.length;
    try { setStats(recordStat(PUZZLE.num, { s: score, t: TOTAL, won: g2.status === 'won' })); } catch (e) {}
    try {
      fetch('/api/quiz/result', {
        method: 'POST', keepalive: true, headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ quizId: PUZZLE.quizId, score, total: TOTAL, correct: score, guessesUsed: g2.wrong.length, timeElapsed: el, email: identity?.email || undefined, anonId: getAnonId(), isMobile: isMobileDevice(), referrer: (typeof document !== 'undefined' ? document.referrer : '') }),
      })
        .then((r) => r.json())
        .then((d) => { if (d && !d.error) setBoard({ ...EMPTY_BOARD, ...d }); })
        .catch(() => {});
    } catch (e) {}
  }

  // "Replay": wipe the saved board and run today's country again as practice.
  // The first completed attempt is what the daily leaderboard and the local
  // streak keep (recordStat is write-once per puzzle number).
  function resetGame() {
    try { localStorage.removeItem(STORE_KEY); } catch (e) {}
    setG(freshState());
    setQ('');
    setNotice(null);
    setEndClosed(false);
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
    noticeRef.current = setTimeout(() => setNotice(null), 2000);
  }

  const SUBJECT = DAY.c ? nameOf(DAY.c) : '';

  function commitGuess(code) {
    const cur = gRef.current;
    if (cur.status !== 'playing' || !cur.t0) return;
    setQ('');
    if (code === DAY.c) { say(`${nameOf(code)} is today's country.`); return; }
    if (cur.found.includes(code)) { say(`${nameOf(code)} is already on the board.`); return; }
    if (cur.wrong.includes(code)) { say(`${nameOf(code)} already cost you a strike.`); return; }
    if (ANSWERS.includes(code)) {
      vibrate(HAPT.ok);
      setFlash(code);
      setTimeout(() => setFlash(null), 600);
      const found = [...cur.found, code];
      if (found.length >= TOTAL) {
        const done = { ...cur, found, status: 'won', tEnd: Date.now() };
        vibrate(HAPT.win);
        postResult(done);
        commit(done);
        return;
      }
      commit({ ...cur, found });
    } else {
      const wrong = [...cur.wrong, code];
      vibrate(HAPT.wrong);
      say(`${nameOf(code)} does not border ${SUBJECT}.`, 'strike');
      if (wrong.length >= STRIKES) {
        const done = { ...cur, wrong, status: 'lost', tEnd: Date.now() };
        postResult(done);
        commit(done);
        return;
      }
      commit({ ...cur, wrong });
    }
  }

  // Live matching on every keystroke: a complete, unambiguous country name
  // commits itself. A name that is a proper prefix of another country's name
  // waits for Enter, so typing through it never fires.
  function onType(v) {
    setQ(v);
    const cur = gRef.current;
    if (cur.status !== 'playing' || !cur.t0) return;
    const n = normGuess(v);
    if (!n) return;
    const code = ALIAS.get(n);
    if (code && !PREFIX_AMBIG.has(n)) commitGuess(code);
  }
  function onEnter() {
    const cur = gRef.current;
    if (cur.status !== 'playing' || !cur.t0) return;
    const n = normGuess(q);
    if (!n) return;
    const code = ALIAS.get(n);
    if (code) { commitGuess(code); return; }
    if (n === 'congo') { say('Which Congo? Try DR Congo or Congo-Brazzaville.'); setQ(''); return; }
    say('Not a country we recognize. Check the spelling; it costs nothing.');
  }

  const slots = useMemo(() => ANSWERS.map((code) => ({ code, name: nameOf(code) })), [ANSWERS]);

  function shareUrl() { return withRef(`mindloftdaily.com/flank${isTodays ? '' : `?p=${PUZZLE.num}`}`); }
  function shareText() {
    const bar = '\u{1F7E9}'.repeat(foundCount) + '⬜'.repeat(Math.max(0, TOTAL - foundCount));
    const xs = strikes ? ` ${'❌'.repeat(strikes)}` : '';
    const streakBit = isTodays && myStats.cur >= 2 ? ` · streak ${myStats.cur}` : '';
    const head = won
      ? `Flank #${PUZZLE.num} · all ${TOTAL} borders · ${elapsed}${streakBit}`
      : `Flank #${PUZZLE.num} · ${foundCount}/${TOTAL} borders · ${elapsed}${streakBit}`;
    return `${head}\n${bar}${xs}\n${shareUrl()}`;
  }
  function copyShare() {
    const text = playing
      ? `Flank #${PUZZLE.num} — the daily borders game from Mind Loft. One country, name every neighbor.\n${shareUrl()}`
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
      lead="One country a day. Name every country on its border."
      steps={[
        <>Type countries. <b>A correct neighbor banks itself the moment the name is complete</b>, no Enter needed.</>,
        <>A real country that does <b>not</b> border today&apos;s country costs a <b>strike</b>, and {PUZZLE.sunday ? 'four strikes end a Sunday run' : 'three strikes end the run'}. Typos and unknown words cost nothing.</>,
        <>Every border named is a point. Name them all and the day is solved; ties on the board break by wrong guesses, then time.</>,
        <>Mondays start with a one-border country and the week climbs from there. <b>Sundays hand you a giant</b> with a fourth strike to spend.</>,
      ]}
      knack="Work the map outward: coastlines cut the field down fast, and the neighbors you cannot picture are the ones worth a careful second look before you spend a strike."
      footer="Borders are between sovereign states, counting Kosovo, Palestine and Western Sahara the way standard border quizzes do. Dependent territory does not count, so China does not border Hong Kong."
    />
  );

  const slotChip = (s, i) => {
    const isFound = g.found.includes(s.code);
    const dead = !playing;
    const missed = dead && !isFound;
    let bg = T.white, border = 'rgba(28,30,36,0.28)', color = COLORS.faded;
    if (isFound) { bg = '#eef7e2'; border = COLORS.accent; color = '#2c4a0a'; }
    if (missed) { bg = '#fdecef'; border = COLORS.rust; color = COLORS.rust; }
    if (flash === s.code) { bg = '#dff0c8'; }
    return (
      <div key={s.code} className="fl-slot" style={{ background: bg, borderColor: border, color }}>
        <span style={{ fontFamily: MONO, fontSize: 10.5, fontWeight: 500, opacity: 0.6, marginRight: 8 }}>{i + 1}</span>
        <span style={{ fontWeight: 800 }}>{isFound || missed ? s.name : '· · · · ·'}</span>
      </div>
    );
  };

  return (
    <div className={STAGE ? 'stage-page' : (LOFT ? 'loft-page' : undefined)}
      data-stage-theme={STAGE ? stageTheme : undefined}
      style={{ ...(STAGE ? STAGE_ACC : null), minHeight: '100vh', background: STAGE ? 'var(--stg-ground)' : T.surface, color: STAGE ? 'var(--stg-ink,#e9edf4)' : undefined, position: 'relative', overflowX: (STAGE || LOFT) ? 'hidden' : undefined }}>
      {!STAGE && <Grain />}
      {!STAGE && (
      <DailyChrome slug="flank" name="Flank" collapsed={started} loft={LOFT} />
      )}
      {/* LOFT: the cap replaces the title block AND the board's own stat
          strip. Naming some of the borders is a partial, so the cap goes
          amber on anything banked. */}
      {LOFT && (
        <Cap gameKey="flank" quizId={PUZZLE.quizId}
          name="Flank"
          cat="Geography"
          outcome={playing ? null : (won ? 'won' : (foundCount > 0 ? 'part' : 'lost'))}
          num={PUZZLE.num}
          tiles={playing ? null : upNext}
          dateLabel={PUZZLE.dateLabel}
          onHelp={() => setShowHelp(true)}
          figures={playing ? [
            { v: `${foundCount}/${TOTAL}`, k: 'borders' },
            { v: elapsed, k: 'time' },
            { v: `${strikes}/${STRIKES}`, k: 'strikes' },
          ] : [
            { v: `${foundCount}/${TOTAL}`, k: 'borders' },
            { v: elapsed, k: 'time' },
          ]}
        />
      )}
      <div className="fl-wrap" style={{ position: 'relative', zIndex: 2, maxWidth: 1180, margin: '0 auto', padding: '18px 38px 80px', fontFamily: SANS }}>
        <style dangerouslySetInnerHTML={{ __html: `
          @media(max-width:560px){.fl-wrap{padding-left:10px !important;padding-right:10px !important;}}
          .fl-btn{font-family:${SANS};font-weight:800;font-size:14px;border:2px solid ${STAGE ? 'var(--stg-line2)' : 'var(--blue-deep)'};background:${STAGE ? 'transparent' : 'var(--white)'};color:${STAGE ? 'var(--stg-ink)' : 'var(--blue-deep)'};border-radius:8px;padding:9px 16px;cursor:pointer;display:inline-flex;align-items:center;gap:7px;}
          .fl-btn:hover{background:var(--stg-surf2, var(--accent-soft));}
          .fl-grid{display:grid;grid-template-columns:1fr 1fr;gap:8px;}
          @media(max-width:560px){.fl-grid{grid-template-columns:1fr;}}
          .fl-slot{display:flex;align-items:center;font-family:${SANS};font-size:14px;border:2px solid;border-radius:9px;padding:10px 12px;line-height:1.3;transition:background .15s ease,border-color .15s ease;}
          .fl-input{font-family:${SANS};font-weight:700;font-size:16px;width:100%;border: 2px solid var(--stg-line, rgba(28,30,36,0.4));border-radius:9px;padding:11px 13px;color:${INK};background:var(--stg-surf, ${T.white});outline:none;}
          .fl-input:focus{border-color:var(--stg-acc, ${COLORS.accent});}
          .fl-input.shake{animation:flshake .3s linear;}
          @keyframes flshake{0%,100%{transform:translateX(0)}25%{transform:translateX(-5px)}75%{transform:translateX(5px)}}
          .fl-pip{width:15px;height:15px;border-radius:4px;border:2px solid ${COLORS.rust};display:inline-block;}
          .fl-pip.on{background:${COLORS.rust};}
        ` }} />

        <div style={{ maxWidth: 660, margin: '0 auto' }}>

        {!LOFT && (
        <DailyMasthead
          slug="flank" num={PUZZLE.num} dateLabel={PUZZLE.dateLabel} accent={COLORS.accent}
          blockGap={5} helpTop={13} marginBottom={16} onHelp={() => setShowHelp(true)}
          blocks={'FLANK'.split('').map((ch, i) => (
            <div key={i} style={{ width: 38, height: 38, borderRadius: 5, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: SANS, fontWeight: 900, fontSize: 22, background: i === 0 ? `var(--stg-acc, ${COLORS.accent})` : COLORS.ink, color: i === 0 ? `var(--stg-onramp, ${T.white})` : T.white, boxShadow: 'inset 0 2px 5px rgba(0,0,0,0.5), 0 1px 0 rgba(255,255,255,0.65)' }}>{ch}</div>
          ))}
        />
        )}

        {/* LOFT: the start tile and the board sit on the navy stage. */}
        <div className={LOFT && !STAGE ? 'loft-stage' : undefined}>
          <div className={LOFT && !STAGE && !playing ? (revealed ? 'loft-flip' : 'loft-flip on') : undefined}>
          <div className={LOFT && !STAGE && !playing ? 'loft-flip-in' : undefined}>
          <div className={LOFT && !STAGE && !playing ? 'loft-face' : undefined}>

        {preStart && (
          <div className={STAGE ? 'stg-gate' : undefined} style={{ background: STAGE ? SURF : COLORS.cream, border: STAGE ? `1px solid ${SURF_B}` : `2px solid ${COLORS.ink}`, borderRadius: 12, padding: '22px', display: 'flex', flexDirection: 'column' }}>
            <div style={{ fontSize: 20, fontWeight: 800, color: INK, marginBottom: 10 }}>{gateRules ? 'How to play' : 'Flank is ready'}</div>
            {gateRules ? rulesBody : (
              <div style={{ fontSize: 14, lineHeight: 1.55, color: INK, fontWeight: 600 }}>
                <p style={{ margin: '0 0 6px' }}>One country, {TOTAL === 1 ? 'one border' : `${TOTAL} borders`}, {STRIKES} strikes. Type every country that touches it; typos are free, wrong countries are not. The clock starts when you do.</p>
              </div>
            )}
            <div style={{ marginTop: 18, display: 'flex', flexDirection: 'row-reverse', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
              <button className="fl-btn" onClick={startGame} style={{ borderColor: STAGE ? STAGE_C : undefined, background: STAGE ? STAGE_C : T.cta, color: STAGE ? 'var(--stg-onramp, #08222e)' : T.white, fontSize: 15, padding: '11px 22px' }}>Start</button>
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
          {/* These figures move UP into the cap on a loft page. */}
          {!LOFT && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, fontFamily: MONO, fontSize: 11.5, letterSpacing: '0.1em', textTransform: 'uppercase', color: FADED, borderBottom: '1px solid rgba(28,30,36,0.18)', paddingBottom: 8, marginBottom: 12, flexWrap: 'wrap' }}>
            <span style={{ whiteSpace: 'nowrap', display: 'inline-flex', alignItems: 'center', gap: 5 }}>
              <Milestone size={13} style={{ color: ACC_INK }} />
              <b style={{ color: INK, fontWeight: 500, fontVariantNumeric: 'tabular-nums' }}>{foundCount}/{TOTAL}</b>
              <span>borders</span>
            </span>
            <span style={{ whiteSpace: 'nowrap' }}>time <b style={{ color: INK, fontWeight: 500, fontVariantNumeric: 'tabular-nums' }}>{elapsed}</b></span>
            <span style={{ marginLeft: 'auto', whiteSpace: 'nowrap' }}>strikes <b style={{ color: `var(--stg-ink, ${COLORS.rust})`, fontWeight: 500 }}>{strikes}/{STRIKES}</b></span>
          </div>
          )}

          {/* The prompt: today's country. A question stays with the board. */}
          <div style={{ marginBottom: 12 }}>
            <div style={{ fontFamily: MONO, fontSize: 10.5, letterSpacing: '0.12em', textTransform: 'uppercase', fontWeight: 500, color: ACC_INK, marginBottom: 4 }}>
              Today&apos;s country{PUZZLE.sunday ? ' · Sunday Edition' : ''}
            </div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, flexWrap: 'wrap' }}>
              <span style={{ fontFamily: SANS, fontSize: 27, fontWeight: 900, letterSpacing: '-0.01em', color: INK, lineHeight: 1.1 }}>{SUBJECT}</span>
              <span style={{ fontFamily: SANS, fontSize: 13.5, fontWeight: 700, color: FADED }}>{TOTAL === 1 ? 'has 1 land border' : `has ${TOTAL} land borders`}</span>
            </div>
          </div>

          {playing && started && (
            <div style={{ marginBottom: 12 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <input
                  ref={inputRef}
                  className={`fl-input${notice && notice.kind === 'strike' ? ' shake' : ''}`}
                  value={q}
                  onChange={(e) => onType(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); onEnter(); } }}
                  placeholder={`Type a country that borders ${SUBJECT}...`}
                  autoCapitalize="off" autoComplete="off" autoCorrect="off" spellCheck={false}
                  aria-label="Type a bordering country"
                />
                <span style={{ display: 'inline-flex', gap: 5, flex: 'none' }} aria-label={`${strikes} of ${STRIKES} strikes used`}>
                  {Array.from({ length: STRIKES }, (_, i) => <i key={i} className={`fl-pip${i < strikes ? ' on' : ''}`} />)}
                </span>
              </div>
              <div style={{ minHeight: 19, marginTop: 6, fontFamily: SANS, fontSize: 12.5, fontWeight: 700, color: notice && notice.kind === 'strike' ? `var(--stg-bad, ${COLORS.rust})` : `var(--stg-mute, ${COLORS.faded})` }}>
                {notice ? notice.msg : ''}
              </div>
            </div>
          )}

          {g.status === 'lost' && (
            <div style={{ fontFamily: SANS, fontSize: 14.5, fontWeight: 800, color: `var(--stg-ink, ${COLORS.rust})`, marginBottom: 10 }}>
              {STRIKES} strikes. The run ends at {foundCount} of {TOTAL}; the missed borders are marked below.
            </div>
          )}
          {won && (
            <div style={{ fontFamily: SANS, fontSize: 14.5, fontWeight: 800, color: COLORS.green, marginBottom: 10 }}>
              Every border named in {elapsed}.
            </div>
          )}

          <div className="fl-grid">
            {slots.map((s, i) => slotChip(s, i))}
          </div>

          {(g.wrong.length > 0 || !playing) && (
            <div style={{ marginTop: 12, paddingTop: 10, borderTop: '1px solid rgba(28,30,36,0.10)', fontFamily: SANS, fontSize: 12.5, fontWeight: 700, color: FADED, display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'baseline' }}>
              <span style={{ fontFamily: MONO, fontSize: 10.5, letterSpacing: '0.1em', textTransform: 'uppercase' }}>Wrong</span>
              {g.wrong.length ? g.wrong.map((code) => (
                <span key={code} style={{ color: `var(--stg-ink, ${COLORS.rust})`, textDecoration: 'line-through' }}>{nameOf(code)}</span>
              )) : <span>none yet</span>}
            </div>
          )}
        </div>
        )}

          <div className={STAGE ? undefined : 'loft-sol'}>
          {!playing && (
            <div style={{ maxWidth: 472, margin: '0 auto' }}>
              <div style={{ fontSize: 15, fontWeight: 800, color: INK, margin: '8px 0 0' }}>
                {won ? <>A clean sweep: <span style={{ color: ACC_INK }}>all {TOTAL} borders</span>.</> : <>You named <span style={{ color: ACC_INK }}>{foundCount} of {TOTAL}</span>.</>}
              </div>
              <div style={{ fontSize: 13, fontWeight: 600, color: FADED, margin: '6px 0 4px', lineHeight: 1.5 }}>
                {won
                  ? 'Nobody can beat that. They can only tie it with fewer wrong guesses, or faster.'
                  : foundCount >= TOTAL - 1 ? 'One border short. That is the one to look up tonight.'
                  : foundCount > 0 ? 'The map keeps its corners quiet. Tomorrow is a new country.'
                  : 'A blank board happens to everyone once. Tomorrow is a new country.'}
              </div>
              {isTodays && myStats.cur >= 2 && (
                <div style={{ fontSize: 13, fontWeight: 800, margin: '12px 0 0', display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                  <span style={{ color: 'var(--stg-warn, #b45309)' }}>{myStats.cur}-day streak</span>
                </div>
              )}
              <p className={STAGE ? undefined : 'loft-tailnote'} style={{ fontSize: 12, color: FADED, fontWeight: 600, margin: '12px 0 0' }}>
                {isTodays ? (
                  <>
                    {countdown ? <>Next Flank in <b style={{ color: INK, fontVariantNumeric: 'tabular-nums' }}>{countdown}</b>.</> : 'A new country drops at midnight Eastern.'}
                    {prevPuzzle && (<>{' '}Meanwhile: <a href={`/flank?p=${prevPuzzle.num}`} style={{ color: COLORS.ember, fontWeight: 800, textDecoration: 'underline' }}>run yesterday&rsquo;s country &rarr;</a></>)}
                  </>
                ) : (
                  <>
                    You&rsquo;re playing the {PUZZLE.dateLabel.replace(', 2026', '')} archive.{' '}
                    <a href="/flank" style={{ color: COLORS.ember, fontWeight: 800, textDecoration: 'underline' }}>Back to today&rsquo;s Flank &rarr;</a>
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
              name="Flank"
              catRank={catRank}
              outcome={won ? 'won' : (foundCount > 0 ? 'part' : 'lost')}
              title={won ? 'Solved' : (foundCount > 0 ? 'Partly solved' : 'Not solved')}
              detail={`${foundCount}/${TOTAL} borders · ${strikes} wrong · ${elapsed}`}
              iq={iq}
              board={dailyBoard}
              gameRank={allTime && allTime.ready
                ? { value: allTime.rank != null ? `#${Number(allTime.rank).toLocaleString()}` : '—',
                    label: allTime.field != null ? `of ${Number(allTime.field).toLocaleString()} Flank all time` : 'all-time rank' }
                : null}
              day={dayStats}
              streak={isTodays ? myStats.cur : null}
              missLabel="Wrong"
              archive={puzzles
                .filter((p) => p.live <= etToday() && p.num !== PUZZLE.num)
                .sort((x, y) => y.num - x.num)
                .map((p) => ({
                  num: p.num,
                  dateLabel: p.dateLabel,
                  sunday: !!p.sunday,
                  href: `/flank?p=${p.num}`,
                  done: !!(stats && stats.rec && stats.rec[p.num]),
                  score: (stats && stats.rec && stats.rec[p.num]) ? stats.rec[p.num].s : null,
                }))}
              options={[
                { label: copied ? 'Copied' : (shareCta || 'Share'), sub: 'Your result, no spoilers', kind: 'gold', onClick: copyShare },
                { tone: won ? 'board' : 'reveal', label: won ? 'Return to board' : 'Reveal answer',
                  sub: won ? 'Your finished board' : 'Show the borders you missed', onClick: () => setRevealed(true) },
                prevPuzzle && { tone: 'another', label: 'Play another Flank', sub: `No. ${prevPuzzle.num}, yesterday’s country`, href: `/flank?p=${prevPuzzle.num}` },
                nextUp && { tone: 'similar', label: 'Play similar', sub: `${nextUp.name} · ${nextUp.tag}`, href: nextUp.href },
                { tone: 'replay', label: 'Replay', sub: 'This country again, unscored', onClick: resetGame },
                { label: 'Back to main', sub: 'The day’s full board', tone: 'main', href: '/' },
              ]}
            />
          )}
          </div>
          </div>
        {/* end of the navy play stage; everything below is the light tail */}
        </div>

        {/* The strip in the cap answers what this opens, without being pressed. */}
        {!STAGE && <GamePanel self="flank" name="Flank" onShow={() => setShowChrome(true)} />}
        <div style={{ display: (focusMode && !STAGE) ? 'none' : 'block', margin: '30px auto 0' }}>
          {LOFT && (
            <div className={STAGE ? undefined : 'loft-report'}>
              <ReportIssue self="flank" name="Flank" accent="#ffffff" align="center" onHelp={() => setShowHelp(true)} />
            </div>
          )}
          {!LOFT && (
          <DailyGamesGrid replay={!playing ? resetGame : null} self="flank" maxWidth={620}
            challengeHref={`/duel/new?quiz=${encodeURIComponent(PUZZLE.quizId)}`}
            share={{ label: copied ? 'Copied' : 'Share', onClick: copyShare }} light
            boardSlot={<DailyBoardPanel self="flank" quizId={PUZZLE.quizId} maxWidth={620} streak={{ current: myStats.cur, best: myStats.max }} />}
            divider />
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
              <div style={{ fontSize: 17, fontWeight: 800, color: INK, marginBottom: 8 }}>Add Flank to your Home Screen</div>
              {isIosDevice() ? (
                <ol style={{ margin: '0 0 4px', paddingLeft: 20, color: INK, fontSize: 14, lineHeight: 1.7 }}>
                  <li>Tap the <b>Share</b> button in Safari&apos;s toolbar.</li>
                  <li>Scroll down and tap <b>Add to Home Screen</b>.</li>
                  <li>Tap <b>Add</b> &mdash; the tile opens today&apos;s country, every day.</li>
                </ol>
              ) : (
                <p style={{ margin: '0 0 4px', color: INK, fontSize: 14, lineHeight: 1.7 }}>Open your browser&apos;s menu and choose <b>Add to Home Screen</b> (or <b>Install app</b>). The tile opens today&apos;s country, every day.</p>
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
        <DailyEndCard modal self="flank" won={won}
          headline={won ? <>Every border named.</> : foundCount > 0 ? <>The map kept a few.</> : <>The map won this one.</>}
          subline={won
            ? <>all {TOTAL} borders &middot; {strikes} wrong &middot; {elapsed}</>
            : <>{foundCount}/{TOTAL} borders &middot; {STRIKES} strikes &middot; {elapsed}</>}
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
            <button className="fl-btn" onClick={() => { setShowHelp(false); try { localStorage.setItem(HELP_KEY, '1'); } catch (e) {} }} style={{ marginTop: 14, background: COLORS.ink, color: T.white }}>Play</button>
          </div>
        </div>
      )}

      {/* The desktop fold: the About prose below starts one screen down (app/StageFold.jsx). */}
      <StageFold />
      <section style={{ position: 'relative', display: (focusMode && !STAGE) ? 'none' : 'block', zIndex: 2, maxWidth: 620, margin: '0 auto', padding: '10px 24px 42px', fontFamily: SANS }}>
        <h2 style={{ margin: '0 0 8px', fontSize: 15, fontWeight: 800, letterSpacing: '-0.01em', color: INK }}>About Flank</h2>
        <p style={{ margin: '0 0 8px', fontSize: 13, lineHeight: 1.65, color: FADED, fontWeight: 600 }}>
          Flank is a free daily geography game from Mind Loft. One country is revealed each day, and your job is to name every country that shares a land border with it. A correct neighbor banks itself the moment you finish typing it. A real country that does not border costs a strike, and three strikes end the run, so the game is less about typing speed and more about whether you can actually see the map in your head.
        </p>
        <p style={{ margin: '0 0 8px', fontSize: 13, lineHeight: 1.65, color: FADED, fontWeight: 600 }}>
          The week has a shape. Monday starts with a one-border country anyone can clear, the difficulty climbs a step a day, and Sunday hands you a giant like China or Russia with fourteen neighbors and a fourth strike to spend. Everyone plays the same country each day, so the daily leaderboard is a straight fight: most borders named, then fewest wrong guesses, then time.
        </p>
        <p style={{ margin: 0, fontSize: 13, lineHeight: 1.65, color: FADED, fontWeight: 600 }}>
          A new country drops every day at midnight Eastern. No app, no signup, play free in your browser, keep a streak, and race the daily leaderboard. More geography dailies: <a href="/atlas" style={{ color: INK, fontWeight: 800 }}>Atlas</a>, our twenty-five question gauntlet, <a href="/ping" style={{ color: INK, fontWeight: 800 }}>Ping</a>, our daily secret city, and <a href="/span" style={{ color: INK, fontWeight: 800 }}>Span</a>, our daily border chain.
        </p>
      </section>

      {!STAGE && <div style={{ position: 'relative', zIndex: 2, display: focusMode ? 'none' : 'block' }}><Footer /></div>}
    </div>
  );
}
