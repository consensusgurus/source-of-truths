'use client';

// THE SIMPLE DAILY SHELL (2026-11-01). Swap, Slide, Spin, Fill, Connect and Pairs
// launched together, and each is one board and one counter, so they share this
// frame instead of six copies of the same 900 lines. It carries everything a
// stage daily needs around its board, copied from Scour and Mahj: the saves and
// the day breadcrumb (sot_<key>_<num>, sot_<key>_day), the start gate, the white
// stage at every width (PlayStage), the cap, the clock, the two-tap Give up in
// the foot, result posting and the abandon flush, the held finish and its beat,
// LoftFinish, share, the How to play sheet and the About prose.
//
// A game hands in one GAME object (see app/swap/SwapClient.jsx for the shape).
// Its Board only draws and calls setS; the shell decides when the board is
// solved (GAME.solved), stamps the finish, and scores it (GAME.result). The
// board never knows about saves, posting or the ending.

import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import { Smartphone } from 'lucide-react';
import useDuelContext, { DuelBanner } from './quiz/[id]/useDuelContext';
import JoinLeaderboardForm from './quiz/[id]/JoinLeaderboardForm';
import useEndHold, { HOLD_SHORT } from './useEndHold';
import { isMobileDevice } from '@/lib/is-mobile';
import useAbandonFlush from './quiz/[id]/useAbandonFlush';
import { withRef } from '@/lib/referrals';
import { notifyShareCredit } from './ShareCreditPop';
import ReportIssue from './ReportIssue';
import StageFold from './StageFold';
import StageChrome from './StageChrome';
import { useStageTheme } from '@/lib/stage-theme';
import { gameColor, gameColorLight, gameOnrampLight, gameAccentInkLight } from '@/lib/category-ramp';
import useIqStanding from './useIqStanding';
import useNextUnplayed, { useUnplayedSimilar } from './useNextUnplayed';
import useDailyBoard from './useDailyBoard';
import useGameAllTime from './useGameAllTime';
import useDayStats from './useDayStats';
import useCategoryRank from './useCategoryRank';
import LoftFinish from './LoftFinish';
import { CONTEST, contestIsLive } from '@/lib/contest';
import { endSolved } from '@/lib/end-verdict';
import DailyRules from './DailyRules';
import { meRequest } from '@/app/quizMeClient';
import PlayStage from './PlayStage';
import HelpSheet from './HelpSheet';

const SANS = "'Manrope', system-ui, -apple-system, sans-serif";
const ARM_MIN_MS = 400;
const EMPTY_BOARD = { plays: 0, best: null, topTime: null, leaderboard: [], leaderboardAll: [], leaderboardMobile: [], leaderboardFirst: [], leaderboards: {} };

export function etToday() {
  try { return new Date().toLocaleDateString('en-CA', { timeZone: 'America/New_York' }); }
  catch (e) { return new Date().toISOString().slice(0, 10); }
}
export function pickPuzzle(puzzles, forceNum) {
  if (forceNum) { const p = puzzles.find((x) => x.num === forceNum); if (p) return p; }
  const today = etToday();
  const open = puzzles.filter((p) => p.live <= today);
  return open.length ? open[open.length - 1] : puzzles[0];
}
export function fmtTime(ms) {
  const s = Math.max(0, Math.round(ms / 1000));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
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
const isIosDevice = () => typeof navigator !== 'undefined' && (/iPad|iPhone|iPod/.test(navigator.userAgent || '') || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1));

// A seeded generator, for any game that needs one on the client.
export function rng(seed) {
  let s = seed >>> 0;
  return () => { s = (s + 0x6D2B79F5) >>> 0; let t = s; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
}

export default function SimpleDaily({ puzzles = [], forceNum = null, game: GAME }) {
  const KEY = GAME.key, NAME = GAME.name;
  const STORE_KEY_OF = (n) => `sot_${KEY}_${n}`;
  const STATS_KEY = `sot_${KEY}_stats`;
  const HELP_KEY = `sot_${KEY}_help_seen`;
  const PUZZLE = useMemo(() => pickPuzzle(puzzles, forceNum), [puzzles, forceNum]);
  const STORE_KEY = STORE_KEY_OF(PUZZLE.num);
  const REC_KEY = `sot_${KEY}_rec_${PUZZLE.num}`;
  const fresh = () => ({ v: 1, status: 'playing', t0: null, tEnd: null, s: GAME.fresh(PUZZLE) });

  const [g, setG] = useState(fresh);
  const gRef = useRef(g);
  gRef.current = g;
  const [showHelp, setShowHelp] = useState(false);
  const [gateRules, setGateRules] = useState(false);
  const [copied, setCopied] = useState(false);
  const [revealed, setRevealed] = useState(false);
  const [shareCta, setShareCta] = useState('Share');
  useEffect(() => { if (contestIsLive()) setShareCta(`Share for ${CONTEST.prizeLabel}*`); }, []);
  const endHold = useEndHold(1100);
  const [hydrated, setHydrated] = useState(false);
  const [identity, setIdentity] = useState(null);
  const [stats, setStats] = useState(null);
  const [armGive, setArmGive] = useState(false);
  useEffect(() => {
    if (!armGive) return undefined;
    const t = setTimeout(() => setArmGive(false), 3500);
    return () => clearTimeout(t);
  }, [armGive]);
  const [installEvt, setInstallEvt] = useState(null);
  const [showA2hsHelp, setShowA2hsHelp] = useState(false);
  const [standalone, setStandalone] = useState(false);
  const [mobileUi, setMobileUi] = useState(false);
  useEffect(() => {
    try {
      setStandalone(window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true);
      setMobileUi(isMobileDevice());
    } catch (e) {}
    const onBip = (e) => { e.preventDefault(); setInstallEvt(e); };
    const onInstalled = () => { setStandalone(true); setInstallEvt(null); };
    window.addEventListener('beforeinstallprompt', onBip);
    window.addEventListener('appinstalled', onInstalled);
    return () => { window.removeEventListener('beforeinstallprompt', onBip); window.removeEventListener('appinstalled', onInstalled); };
  }, []);
  const a2hsClick = () => { const e = installEvt; if (e) { setInstallEvt(null); e.prompt(); } else { setShowA2hsHelp(true); } };
  const searchParams = useSearchParams();
  const { duelToken, duelInfo, duelSubmitted } = useDuelContext(PUZZLE.quizId, searchParams);
  const viewedRef = useRef(false);

  // ── stats (the local record, topped up from the server) ──────────────────
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
  function mergeServerStats(s, recent) {
    if (!s || !Array.isArray(recent) || !recent.length) return s;
    const byQuiz = {};
    for (const p of puzzles) byQuiz[p.quizId] = p;
    let rec = s.rec, changed = false;
    for (const m of recent) {
      const pz = m && byQuiz[m.quizId];
      if (!pz || m.attempt !== 1 || rec[pz.num]) continue;
      if (!changed) { rec = { ...rec }; changed = true; }
      rec[pz.num] = { s: m.perfect ? 1 : 0, won: !!m.perfect };
    }
    if (!changed) return s;
    const s2 = { ...s, rec };
    try { localStorage.setItem(STATS_KEY, JSON.stringify(s2)); } catch (e) {}
    return s2;
  }

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORE_KEY);
      if (raw) {
        const saved = JSON.parse(raw);
        if (saved && saved.v === 1 && saved.s && (!GAME.validSave || GAME.validSave(PUZZLE, saved.s))) {
          const next = { ...fresh(), ...saved };
          gRef.current = next;
          setG(next);
        }
      }
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
        const dn = g.status !== 'playing';
        if (dn || g.t0) localStorage.setItem(`sot_${KEY}_day`, JSON.stringify({ d: etToday(), done: dn }));
        else localStorage.removeItem(`sot_${KEY}_day`);
      }
    } catch (e) {}
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [g, hydrated]);

  useEffect(() => {
    try { const id = JSON.parse(localStorage.getItem('sot_quiz_identity')); if (id && id.email) setIdentity(id); } catch (e) {}
    try {
      const anon = getAnonId();
      let em = '';
      try { const idj = JSON.parse(localStorage.getItem('sot_quiz_identity') || 'null'); if (idj && idj.email) em = `&email=${encodeURIComponent(idj.email)}`; } catch (e) {}
      if (anon || em) {
        meRequest(`/api/quiz/me?anonId=${encodeURIComponent(anon || '')}${em}&history=1`)
          .then((r) => r.json())
          .then((d) => { if (d && Array.isArray(d.recent)) setStats((cur) => mergeServerStats(cur || getStats(), d.recent)); })
          .catch(() => {});
      }
    } catch (e) {}
    if (!viewedRef.current) {
      viewedRef.current = true;
      fetch('/api/quiz/view', { method: 'POST', keepalive: true, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ quizId: PUZZLE.quizId }) }).catch(() => {});
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── the clock ─────────────────────────────────────────────────────────────
  const [nowTick, setNowTick] = useState(() => Date.now());
  useEffect(() => {
    if (g.status !== 'playing' || !g.t0 || g.tEnd) return undefined;
    setNowTick(Date.now());
    const iv = setInterval(() => setNowTick(Date.now()), 500);
    return () => clearInterval(iv);
  }, [g.status, g.t0, g.tEnd]);

  const playing = g.status === 'playing';
  const preStart = playing && !g.t0;
  const started = playing && !!g.t0;
  const won = g.status === 'won';
  const elapsed = g.t0 ? fmtTime((g.tEnd || nowTick) - g.t0) : '0:00';
  const [stageTheme] = useStageTheme();
  const STAGE_ACC = { '--stg-acc-dk': gameColor(KEY), '--stg-acc-lt': gameColorLight(KEY), '--stg-onramp-lt': gameOnrampLight(KEY), '--stg-acc-ink-lt': gameAccentInkLight(KEY) };
  const INK = 'var(--stg-ink,#e9edf4)';
  const MUTE = 'var(--stg-mute,#8b95a8)';
  const prevPuzzle = puzzles.find((x) => x.num === PUZZLE.num - 1) || null;
  const isTodays = PUZZLE.num === pickPuzzle(puzzles, null).num;
  const todayNum = pickPuzzle(puzzles, null).num;
  const myStreak = useMemo(() => {
    const rec = (stats && stats.rec) || {};
    let cur = 0, at = rec[todayNum] ? todayNum : todayNum - 1;
    while (rec[at]) { cur++; at--; }
    return cur;
  }, [stats, todayNum]);

  // ── posting ───────────────────────────────────────────────────────────────
  const abandon = useAbandonFlush(() => {
    const cur = gRef.current;
    if (cur.status !== 'playing' || !cur.t0 || !GAME.touched(cur.s)) return null;
    try { if (localStorage.getItem(REC_KEY)) return null; } catch (e) {}
    try { localStorage.setItem(REC_KEY, '1'); } catch (e) {}
    const el = Math.min(36000, Math.max(1, Math.round((Date.now() - cur.t0) / 1000)));
    const r = GAME.result(PUZZLE, cur.s, false);
    return { quizId: PUZZLE.quizId, ...r, timeElapsed: el, abandoned: true, email: identity?.email || undefined, anonId: getAnonId(), isMobile: isMobileDevice(), referrer: (typeof document !== 'undefined' ? document.referrer : '') };
  });
  function postResult(g2, isWon) {
    abandon.markFlushed();
    const el = g2.t0 ? Math.max(1, Math.round(((g2.tEnd || Date.now()) - g2.t0) / 1000)) : 1;
    const r = GAME.result(PUZZLE, g2.s, isWon);
    try {
      fetch('/api/quiz/result', {
        method: 'POST', keepalive: true, headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ quizId: PUZZLE.quizId, ...r, timeElapsed: el, email: identity?.email || undefined, anonId: getAnonId(), isMobile: isMobileDevice(), referrer: (typeof document !== 'undefined' ? document.referrer : '') }),
      }).catch(() => {});
    } catch (e) {}
  }
  function finish(cur, isWon) {
    if (cur.status !== 'playing') return;
    const g2 = { ...cur, status: isWon ? 'won' : 'done', tEnd: Date.now(), gaveUp: !isWon };
    try { setStats(recordStat(PUZZLE.num, { s: isWon ? 1 : 0, won: isWon })); } catch (e) {}
    postResult(g2, isWon);
    gRef.current = g2;
    setG(g2);
    setArmGive(false);
    endHold.hold(HOLD_SHORT);
  }
  // The board's one door into the state. A move that solves the board ends the
  // game in the same update, so a solved board is never left in play.
  // Stable across renders (the clock re-renders the page twice a second), so a
  // board can list it in an effect's dependencies without restarting a timer.
  const setSImpl = useRef(null);
  setSImpl.current = setSNow;
  const setS = useCallback((upd) => setSImpl.current(upd), []);
  function setSNow(upd) {
    const cur = gRef.current;
    if (cur.status !== 'playing' || !cur.t0) return;
    const s2 = typeof upd === 'function' ? upd(cur.s) : upd;
    if (s2 === cur.s) return;
    const next = { ...cur, s: s2 };
    if (GAME.solved(PUZZLE, s2)) { finish(next, true); return; }
    // A game that can be lost by play (Tape: a miss with every clue open) ends
    // in the same update too, unsolved.
    if (GAME.failed && GAME.failed(PUZZLE, s2)) { finish(next, false); return; }
    gRef.current = next;
    setG(next);
  }
  function giveUp() {
    if (armGive) {
      if (Date.now() - armGive < ARM_MIN_MS) return;
      finish(gRef.current, false);
    } else setArmGive(Date.now());
  }
  function startGame() {
    setG((cur) => { const n = cur.t0 ? cur : { ...cur, t0: Date.now() }; gRef.current = n; return n; });
    try { localStorage.setItem(HELP_KEY, '1'); } catch (e) {}
  }
  function resetGame() {
    try { localStorage.removeItem(STORE_KEY); } catch (e) {}
    const f = { ...fresh(), t0: Date.now() };
    gRef.current = f;
    setG(f); setRevealed(false); setArmGive(false); endHold.release();
  }

  // ── share ─────────────────────────────────────────────────────────────────
  const url = withRef(`mindloftdaily.com/${KEY}`);
  function copyShare() {
    const text = playing ? `${NAME} #${PUZZLE.num}: ${GAME.pitch(PUZZLE)}\n${url}` : `${GAME.shareLine(PUZZLE, g.s, won, elapsed)}\n${url}`;
    if (notifyShareCredit(text)) return;
    try { if (typeof navigator !== 'undefined' && navigator.share && isMobileDevice()) { navigator.share({ text }).catch(() => {}); return; } } catch (e) {}
    try { navigator.clipboard?.writeText(text).then(() => { setCopied(true); setTimeout(() => setCopied(false), 1800); }); } catch (e) {}
  }

  const ended = !playing;
  const iq = useIqStanding({ game: KEY, quizId: PUZZLE.quizId, active: ended });
  const nextUp = useNextUnplayed({ self: KEY, active: ended });
  const upNext = useUnplayedSimilar({ self: KEY, active: ended });
  const dailyBoard = useDailyBoard({ quizId: PUZZLE.quizId, active: ended });
  const allTime = useGameAllTime({ game: KEY, active: ended });
  const dayStats = useDayStats();
  const catRank = useCategoryRank({ self: KEY, active: ended });

  const rulesBody = <DailyRules {...GAME.rules(PUZZLE)} />;
  const boardProps = { P: PUZZLE, s: g.s, setS, active: started, done: ended, onStage: true };
  const Board = GAME.Board;
  const sundayLabel = PUZZLE.sunday ? (GAME.sundayLabel ? GAME.sundayLabel(PUZZLE) : 'Sunday Edition') : null;
  const count = GAME.count(g.s);

  // THE STAGE, at every width, from Start through the finish (the ending hides
  // it when it arrives, app/StageHost.jsx). See the board swaps it for the
  // board drawn in the page, as Mahj and Scour do.
  const stage = g.t0 && (playing || !revealed) ? (
    <PlayStage wide={!!GAME.wide} bg={gameColor(KEY)} label={NAME}
      eyebrow={GAME.eyebrow(PUZZLE, g.s, { sundayLabel })}
      top={<Board {...boardProps} />}
      bottom={GAME.tools ? GAME.tools({ ...boardProps, active: started }) : null}
      foot={GAME.foot(PUZZLE, g.s)}
      frac={GAME.frac ? GAME.frac(PUZZLE, g.s) : null}
      clock={elapsed}
      done={ended}
      giveUp={started ? { armed: !!armGive, onPress: giveUp, armedLabel: GAME.giveUpLabel || 'Tap again to give up' } : null} />
  ) : null;

  return (
    <div className="stage-page" data-stage-theme={stageTheme}
      style={{ ...STAGE_ACC, minHeight: '100vh', position: 'relative', background: 'var(--stg-ground)', color: INK, overflowX: 'hidden' }}>
      {stage}
      <StageChrome gameKey={KEY} quizId={PUZZLE.quizId}
        name={NAME}
        cat={GAME.cat}
        outcome={playing ? null : (won ? 'won' : 'lost')}
        num={PUZZLE.num}
        tiles={playing ? null : upNext}
        dateLabel={PUZZLE.dateLabel}
        onHelp={() => setShowHelp(true)}
        sunday={sundayLabel}
        figures={[
          ...(GAME.miss ? [{ v: String(count), k: count === 1 ? GAME.miss.replace(/s$/, '') : GAME.miss }] : []),
          { v: elapsed, k: 'time' },
        ]}
      />
      <div className="sd-wrap" style={{ position: 'relative', zIndex: 2, maxWidth: 1180, margin: '0 auto', padding: '18px 24px 80px', fontFamily: SANS }}>
        <style dangerouslySetInnerHTML={{ __html: `
          @media(max-width:560px){.sd-wrap{padding-left:10px !important;padding-right:10px !important;}}
          .sd-btn{font-family:${SANS};font-weight:800;font-size:15px;border:2px solid var(--stg-acc-ink, var(--stg-acc));background:var(--stg-acc);color:var(--stg-onramp, #08222e);border-radius:999px;padding:11px 24px;cursor:pointer;}
          .sd-link{background:none;border:none;padding:0;cursor:pointer;font-family:${SANS};font-size:13px;font-weight:700;color:${MUTE};text-decoration:underline;}
          .sd-tool{font-family:${SANS};font-weight:800;font-size:13.5px;border:1.5px solid var(--stg-cell-line, rgba(28,30,36,.35));background:transparent;color:${INK};border-radius:999px;padding:0 15px;min-height:44px;cursor:pointer;display:inline-flex;align-items:center;justify-content:center;gap:6px;}
        ` }} />
        <div>
          {preStart && (
            <div className="stg-gate" style={{ maxWidth: 640, margin: '0 auto 16px', background: 'var(--stg-surf,#fff)', border: '1px solid var(--stg-line,rgba(11,15,26,.14))', borderRadius: 12, padding: 22, display: 'flex', flexDirection: 'column' }}>
              <div style={{ fontSize: 20, fontWeight: 800, color: INK, marginBottom: 10 }}>{gateRules ? 'How to play' : GAME.gateTitle(PUZZLE)}</div>
              {gateRules ? rulesBody : (
                <div style={{ fontSize: 14, lineHeight: 1.55, color: INK, fontWeight: 600 }}>
                  <p style={{ margin: 0 }}>{GAME.gateLine(PUZZLE)}</p>
                </div>
              )}
              <div style={{ marginTop: 18, display: 'flex', flexDirection: 'row-reverse', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
                <button className="sd-btn" onClick={startGame}>Start</button>
                <button type="button" className="sd-link" onClick={() => setGateRules((v) => !v)}>{gateRules ? 'Back' : 'How to play'}</button>
              </div>
            </div>
          )}
          {ended && !endHold.held && revealed && (
            <div className="stg-board" style={{ maxWidth: 640, margin: '0 auto 12px' }}>
              <Board {...boardProps} onStage={false} />
            </div>
          )}
          {ended && !endHold.held && revealed && (
            <button className="stf-hideboard" onClick={() => setRevealed(false)}>&#8630; Hide the board</button>
          )}
          {ended && !endHold.held && (
            <LoftFinish
              name={NAME}
              catRank={catRank}
              outcome={won ? 'won' : 'lost'}
              title={endSolved(won)}
              detail={GAME.detail(PUZZLE, g.s, won, elapsed)}
              missLabel={GAME.miss ? GAME.miss[0].toUpperCase() + GAME.miss.slice(1) : null}
              // The game's own figure (turns, moves, clues) is what a challenge
              // and the GIF share lead with, not the clock: lib/challenge-metric.js
              // says which games count it. Without this every stage-shell game fell
              // back to its time (owner, 2026-11-06, on Tape).
              challengeMetric={won && GAME.count ? GAME.count(g.s) : null}
              iq={iq}
              board={dailyBoard}
              gameRank={allTime && allTime.ready
                ? { value: allTime.rank != null ? `#${Number(allTime.rank).toLocaleString()}` : '—',
                    label: allTime.field != null ? `of ${Number(allTime.field).toLocaleString()} ${NAME} all time` : 'all-time rank' }
                : null}
              day={dayStats}
              streak={isTodays ? myStreak : null}
              archive={puzzles
                .filter((p) => p.live <= etToday() && p.num !== PUZZLE.num)
                .sort((x, y) => y.num - x.num)
                .map((p) => ({ num: p.num, dateLabel: p.dateLabel, sunday: !!p.sunday, href: `/${KEY}?p=${p.num}`,
                  done: !!(stats && stats.rec && stats.rec[p.num]), score: null }))}
              options={[
                { label: copied ? 'Copied' : (shareCta || 'Share'), sub: 'Your result, no spoilers', kind: 'gold', onClick: copyShare },
                { tone: 'board', label: 'See the board', sub: won ? 'Your finished board' : 'Where you stopped', onClick: () => setRevealed(true) },
                prevPuzzle && { tone: 'another', label: `Play another ${NAME}`, sub: `No. ${prevPuzzle.num}, ${prevPuzzle.dateLabel}`, href: `/${KEY}?p=${prevPuzzle.num}` },
                nextUp && { tone: 'similar', label: 'Play similar', sub: `${nextUp.name} · ${nextUp.tag}`, href: nextUp.href },
                { tone: 'replay', label: 'Replay', sub: 'This puzzle again, unscored', onClick: resetGame },
                { label: 'Back to main', sub: 'The day’s full board', tone: 'main', href: '/' },
              ]}
            />
          )}
        </div>

        <div style={{ margin: '30px auto 0', maxWidth: 680 }}>
          <ReportIssue self={KEY} name={NAME} accent="#ffffff" align="center" onHelp={() => setShowHelp(true)} />
          {ended && mobileUi && !standalone && (
            <div style={{ textAlign: 'center', marginTop: 16 }}>
              <button className="sd-tool" onClick={a2hsClick}><Smartphone size={14} /> Add to Home Screen</button>
            </div>
          )}
          <div id="stf-stats-slot" />
        </div>

        {showA2hsHelp && (
          <div onClick={() => setShowA2hsHelp(false)} style={{ position: 'fixed', inset: 0, background: 'rgba(20,22,28,0.55)', zIndex: 90, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
            <div onClick={(e) => e.stopPropagation()} style={{ background: 'var(--stg-raise,#fff)', border: '1px solid var(--stg-ink,#08222e)', borderRadius: 16, padding: 20, maxWidth: 380, fontFamily: SANS }}>
              <div style={{ fontSize: 17, fontWeight: 800, color: INK, marginBottom: 8 }}>Add {NAME} to your home screen</div>
              <p style={{ fontSize: 13.5, fontWeight: 600, color: INK, lineHeight: 1.55, margin: '0 0 14px' }}>
                {isIosDevice() ? 'Tap the Share button in Safari, scroll down, and choose Add to Home Screen.' : 'Open your browser menu and choose Install app, or Add to Home screen.'}
              </p>
              <button className="sd-tool" onClick={() => setShowA2hsHelp(false)}>Got it</button>
            </div>
          </div>
        )}
        {ended && !identity && (
          <div id="daily-join" style={{ margin: '18px auto 0', maxWidth: 680 }}>
            <JoinLeaderboardForm hideIcon heading="See your stats and join the leaderboard" />
          </div>
        )}
      </div>
      <DuelBanner token={duelToken} info={duelInfo} submitted={duelSubmitted} />

      {showHelp && (
        <HelpSheet onClose={() => { setShowHelp(false); try { localStorage.setItem(HELP_KEY, '1'); } catch (e) {} }} self={KEY} name={NAME}>
          {rulesBody}
        </HelpSheet>
      )}

      <StageFold />
      <section style={{ maxWidth: 640, margin: '0 auto', padding: '10px 24px 42px', fontFamily: SANS }}>
        <h2 style={{ fontSize: 17, fontWeight: 800, color: INK, margin: '0 0 8px' }}>{GAME.aboutTitle || `About ${NAME}`}</h2>
        {GAME.about.map((para, i) => (
          <p key={i} style={{ fontSize: 13.5, fontWeight: 600, color: MUTE, lineHeight: 1.6, margin: i === GAME.about.length - 1 ? 0 : '0 0 9px' }}>{para}</p>
        ))}
      </section>
    </div>
  );
}
