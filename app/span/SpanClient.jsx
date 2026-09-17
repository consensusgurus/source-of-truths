'use client';

// Span — cross the map, border by border.
//
// Each day: a start country and a destination. Build a chain of countries
// where every step shares a land border with the last. The target is the
// shortest path — score is 10 if your final chain matches it, minus one per
// country over, floor 1 — hops are derived from the chain, so undo truly
// refunds a step. A country that doesn't border your position is a miss
// (misses break ties). One free hint walks you one step down a shortest road.
//
// Same daily plumbing as Crux: banked puzzles gated by Eastern date on the
// server (app/span/page.js), per-puzzle localStorage saves, /span?p=N
// archive pinning, streaks + stats, and the shared /api/quiz/* board flow.
// The border graph (app/span/borders.js) ships to the client — it holds no
// answers, just the world.
//
// SUNDAY EDITIONS: a Sunday puzzle carries `via` (the chain must pass through
// that country before the destination) or `avoid` (that country is closed and
// can't be entered). perfect is the CONSTRAINED shortest, so scoring needs no
// special-casing; the rules are enforced in addCountry, and hint/reveal route
// around them. See the authoring notes in app/span/puzzles.js.
//
// END-OF-GAME MAP: the result card draws the player's road on a real world
// map (app/span/map-geo.js, simplified from lib/world-geo.js), with a
// shortest road dashed alongside when the player didn't find one.

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useSearchParams } from 'next/navigation';
import { HelpCircle, Share2, RotateCcw, X, Undo2, Flag, Swords, Smartphone, Lightbulb, Eye } from 'lucide-react';
import Grain from '../Grain';
import DailyRules from '../DailyRules';
import Footer from '../Footer';
import DailyGamesPromo from '../DailyGamesPromo';
import useDuelContext, { DuelBanner } from '../quiz/[id]/useDuelContext';
import JoinLeaderboardForm from '../quiz/[id]/JoinLeaderboardForm';
import DailyGamesGrid from '../DailyGamesGrid';
import DailyEndCard from '../DailyEndCard';
import DailyChrome from '../DailyChrome';
import DailyBoardPanel from '../quiz/[id]/DailyBoardPanel';
import { isMobileDevice } from '@/lib/is-mobile';
import useAbandonFlush from '../quiz/[id]/useAbandonFlush';
import { buildAdj, buildLookup, shortestRoute, viaRoute, distancesFrom, normName, COUNTRIES } from './borders';
import { MAP } from './map-geo';
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
import { hintAllowed, spendHint } from '@/lib/hint-gate';
import { T } from '@/lib/theme';
import { meRequest } from '@/app/quizMeClient';

const COLORS = {
  cream: T.surface,
  paper: T.paper,
  ink: T.ink,
  ember: T.accent,
  rust: T.danger,
  faded: T.muted,
  trail: T.successDeep,
  trailSoft: '#eefaf1',
};
// The arm-then-confirm controls do not move when armed, so the second tap of
// an accidental double-tap used to land on the armed state long before the
// label change could be read. A confirm this fast was never a decision.
const ARM_MIN_MS = 400;
const SANS = "'Manrope', system-ui, -apple-system, sans-serif";
const MONO = "'DM Mono', ui-monospace, 'SFMono-Regular', monospace";
const PAPER = '#fbf9f4';
const HELP_KEY = 'sot_span_help_seen';
const STATS_KEY = 'sot_span_stats';

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

// ─── The end-of-puzzle route map ──────────────────────────────────────────────
// Draws the player's chain (and, when they didn't find one, a shortest road)
// on the simplified world map. Anchors start at country centroids; countries
// with a big footprint (Russia, China, Brazil…) get their anchor pulled to
// the polygon vertex nearest the route corridor so the line reads like a
// border-to-border road instead of shooting off to Siberia, and so the crop
// can stay tight around the route.
const mapPtsCache = new Map();
function mapPathPts(name) {
  let pts = mapPtsCache.get(name);
  if (pts) return pts;
  pts = [];
  const d = MAP.paths[name] || '';
  for (const seg of d.split('M')) {
    if (!seg) continue;
    for (const pair of seg.replace(/Z/g, '').split('L')) {
      const [x, y] = pair.split(',').map(Number);
      if (Number.isFinite(x) && Number.isFinite(y)) pts.push([x, y]);
    }
  }
  mapPtsCache.set(name, pts);
  return pts;
}
const mapDiag = (b) => Math.hypot(b[2] - b[0], b[3] - b[1]);
function mapAnchors(countries) {
  const anchors = countries.map((c) => (MAP.c[c] ? [...MAP.c[c]] : null));
  for (let pass = 0; pass < 2; pass++) {
    for (let i = 0; i < countries.length; i++) {
      const c = countries[i];
      if (!anchors[i] || !MAP.bb[c] || mapDiag(MAP.bb[c]) < 60) continue;
      const nb = [];
      if (i > 0 && anchors[i - 1]) nb.push(anchors[i - 1]);
      if (i < countries.length - 1 && anchors[i + 1]) nb.push(anchors[i + 1]);
      if (!nb.length) continue;
      const tx = nb.reduce((s, p) => s + p[0], 0) / nb.length;
      const ty = nb.reduce((s, p) => s + p[1], 0) / nb.length;
      let best = null, bd = Infinity;
      for (const p of mapPathPts(c)) {
        const d2 = (p[0] - tx) * (p[0] - tx) + (p[1] - ty) * (p[1] - ty);
        if (d2 < bd) { bd = d2; best = p; }
      }
      if (!best) continue;
      const [cx, cy] = MAP.c[c];
      anchors[i] = [best[0] + (cx - best[0]) * 0.12, best[1] + (cy - best[1]) * 0.12];
    }
  }
  return anchors;
}
function SpanMap({ chain, best, alts }) {
  const view = useMemo(() => {
    const chainArr = (chain || []).filter((c) => MAP.c[c]);
    const bestArr = (best || []).filter((c) => MAP.c[c]);
    const altArr = (alts || []).filter((c) => MAP.c[c]);
    if (!chainArr.length && !bestArr.length) return null;
    const cA = mapAnchors(chainArr);
    let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
    for (const p of [...cA, ...mapAnchors(bestArr)]) {
      if (!p) continue;
      x0 = Math.min(x0, p[0]); y0 = Math.min(y0, p[1]);
      x1 = Math.max(x1, p[0]); y1 = Math.max(y1, p[1]);
    }
    // small countries stay fully in frame; big ones are represented by anchors
    for (const c of new Set([...chainArr, ...bestArr, ...altArr])) {
      const b = MAP.bb[c];
      if (b && mapDiag(b) < 45) { x0 = Math.min(x0, b[0]); y0 = Math.min(y0, b[1]); x1 = Math.max(x1, b[2]); y1 = Math.max(y1, b[3]); }
    }
    let w = Math.max(1, x1 - x0), h = Math.max(1, y1 - y0);
    const padX = w * 0.16 + 8, padY = h * 0.16 + 8;
    x0 -= padX; y0 -= padY; x1 += padX; y1 += padY; w = x1 - x0; h = y1 - y0;
    if (w < 90) { const a = (90 - w) / 2; x0 -= a; x1 += a; w = 90; }
    if (h < w * 0.52) { const a = (w * 0.52 - h) / 2; y0 -= a; y1 += a; h = w * 0.52; }
    if (h > w * 0.85) { const a = (h / 0.85 - w) / 2; x0 -= a; x1 += a; w = h / 0.85; }
    return { x0, y0, w, h, cA, chainArr, bestArr, altArr };
  }, [chain, best, alts]);
  if (!view) return null;
  const { x0, y0, w, h, cA, chainArr, bestArr, altArr } = view;
  const chainSet = new Set(chainArr);
  const bestSet = new Set(bestArr);
  const altSet = new Set(altArr);
  const k = w / 560; // world units per on-screen px at the card's width
  const showBest = bestArr.length > 0 && bestArr.join('|') !== chainArr.join('|');
  const showAlts = showBest && altArr.some((c) => !bestSet.has(c) && !chainSet.has(c));
  const showRoad = chainArr.length > 1; // no lone marker before the road exists
  const r = 10 * k;
  const swatch = (bg) => ({ width: 13, height: 13, borderRadius: 3, background: bg, border: '1px solid rgba(28,30,36,0.25)', display: 'inline-block' });
  return (
    <div style={{ margin: '10px 0 4px' }}>
      <svg viewBox={`${x0} ${y0} ${w} ${h}`} style={{ display: 'block', width: '100%', height: 'auto', borderRadius: 9, border: '1.5px solid rgba(28,30,36,0.22)' }} role="img" aria-label="Map of the route">
        <rect x={x0} y={y0} width={w} height={h} fill="#e7edf3" />
        {Object.entries(MAP.paths).map(([name, d]) => {
          const onChain = chainSet.has(name);
          const onBest = !onChain && showBest && bestSet.has(name);
          const onAlt = !onChain && !onBest && showBest && altSet.has(name);
          const ends = onChain && (name === chainArr[0] || (chainArr.length > 1 && name === chainArr[chainArr.length - 1]));
          const fill = onChain ? (ends ? T.successDeep : '#8fdcab') : onBest ? '#a7cbf3' : onAlt ? '#d9e7fa' : '#dfe3e8';
          return <path key={name} d={d} fill={fill} stroke={T.white} strokeWidth={k} />;
        })}
        {showRoad && (
          <polyline points={cA.map((p) => p.join(',')).join(' ')} fill="none" stroke="#14532d" strokeWidth={2.6 * k} strokeLinejoin="round" />
        )}
        {showRoad && chainArr.map((c, i) => {
          const [x, y] = cA[i];
          const ends = i === 0 || i === chainArr.length - 1;
          return (
            <g key={`d${i}`}>
              <circle cx={x} cy={y} r={r} fill={ends ? '#14532d' : T.white} stroke="#14532d" strokeWidth={1.6 * k} />
              <text x={x} y={y + r * 0.06} fontSize={r * 1.15} textAnchor="middle" dominantBaseline="central" fill={ends ? T.white : '#14532d'} fontFamily={SANS} fontWeight="700">{i + 1}</text>
            </g>
          );
        })}
      </svg>
      <div style={{ display: 'flex', gap: 16, alignItems: 'center', flexWrap: 'wrap', fontFamily: MONO, fontSize: 10.5, letterSpacing: '0.06em', color: `var(--stg-mute, ${COLORS.faded})`, marginTop: 6 }}>
        {showRoad && (
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
            <span style={swatch('#8fdcab')} /> your road
          </span>
        )}
        {showBest && (
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
            <span style={swatch('#a7cbf3')} /> a shortest road
          </span>
        )}
        {showAlts && (
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
            <span style={swatch('#d9e7fa')} /> alternate shortest roads
          </span>
        )}
      </div>
    </div>
  );
}

// ─── Personal stats + streak (localStorage), Crux pattern ──────────────────
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
    v: 1,
    chain: null,       // [start, ...] — set from PUZZLE on mount
    misses: 0,         // rejected attempts (no border / unknown / reused)
    hintUsed: false,
    status: 'playing', // playing | won | revealed
    t0: null,
    tEnd: null,
  };
}

export default function SpanClient({ puzzles = [], forceNum = null }) {
  const PUZZLE = useMemo(() => pickPuzzle(puzzles, forceNum), [puzzles, forceNum]);
  const STORE_KEY = `sot_span_${PUZZLE.num}`;
  const ADJ = useMemo(() => buildAdj(), []);
  const LOOKUP = useMemo(() => buildLookup(), []);
  const [g, setG] = useState(() => freshState());
  const [typed, setTyped] = useState('');
  const [showHelp, setShowHelp] = useState(false);
  const [gateRules, setGateRules] = useState(false); // start tile: full rules (first-timer) vs compact card
  const [toast, setToast] = useState(null);
  const [copied, setCopied] = useState(false);
  const [shake, setShake] = useState(false);
  const [armReveal, setArmReveal] = useState(false);
  const [justWon, setJustWon] = useState(false);
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
  // One free hint, first play only (see lib/hint-gate.js). Eligibility is
  // re-read whenever stats change, so the server-history merge can revoke it
  // for a returning player on a new device.
  const [hintOk, setHintOk] = useState(false);
  useEffect(() => { if (stats) setHintOk(hintAllowed('span', stats)); }, [stats]);
  useEffect(() => { if (g.hintUsed) spendHint('span'); }, [g.hintUsed]);
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
  const inputRef = useRef(null);

  const chain = g.chain || [PUZZLE.start];
  const head = chain[chain.length - 1];
  const hops = chain.length - 1; // score meter: final path length vs perfect
  const [showChrome, setShowChrome] = useState(false);
  const playing = g.status === 'playing';
  const LOFT = isLoft('span');
  const STAGE = isStage('span', searchParams);
  const STAGE_C = STAGE ? 'var(--stg-acc)' : gameColor('span');
  const Cap = STAGE ? StageChrome : LoftCap;
  const STAGE_ACC = { '--stg-acc-dk': gameColor('span'), '--stg-acc-lt': gameColorLight('span'), '--stg-onramp-lt': gameOnrampLight('span'), '--stg-acc-ink-lt': gameAccentInkLight('span') };
  const [stageTheme] = useStageTheme();
  const INK = STAGE ? 'var(--stg-ink,#e9edf4)' : COLORS.ink;
  const FADED = STAGE ? 'var(--stg-mute,#8b95a8)' : COLORS.faded;
  const SURF = STAGE ? 'var(--stg-surf,rgba(255,255,255,0.045))' : T.white;
  const SURF_B = STAGE ? 'var(--stg-line,rgba(255,255,255,0.11))' : 'rgba(28,30,36,0.42)';
  const ACC = STAGE ? STAGE_C : COLORS.accent;
  const ACC_DEEP = STAGE ? STAGE_C : COLORS.accentDeep;
  const ACC_SOFT = STAGE ? 'var(--stg-line,rgba(255,255,255,0.11))' : COLORS.accentSoft;
  const ON_ACC = STAGE ? 'var(--stg-onramp, #08222e)' : 'var(--white)';
  const preStart = playing && !g.t0;   // not begun: show the start tile in place of the board
  const started = playing && !!g.t0;   // clock running: show the board
  const focusMode = playing && !showChrome;
  const won = g.status === 'won';

  // Sunday Edition twist (one per Sunday puzzle, never both): perfect already
  // accounts for the constraint, so scoring below stays untouched.
  const VIA = PUZZLE.via || null;
  const AVOID = PUZZLE.avoid || null;
  // `sunday: true` is the SINGLE source of truth (see the Sunday Editions
  // section of CLAUDE.md). Do NOT infer the edition from VIA/AVOID: a weekday
  // that ever carried a route rule would falsely announce a Sunday Edition,
  // and a Sunday authored without one used to fall through to the AVOID branch
  // and render "undefined is closed today".
  const isSundayEd = !!PUZZLE.sunday;
  const sundayRule = VIA || AVOID ? true : false;
  const viaDone = !VIA || chain.includes(VIA);

  useEffect(() => {
    if (!armReveal) return undefined;
    const t = setTimeout(() => setArmReveal(false), 3500);
    return () => clearTimeout(t);
  }, [armReveal]);
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
        if (saved && saved.v === 1 && Array.isArray(saved.chain) && saved.chain[0] === PUZZLE.start) setG({ ...freshState(), ...saved });
      }
      // The start tile shows in place of the board until the player begins (t0
      // set on Start). First-timers see the full rules on the tile; a returning
      // player gets the compact start card with a "Show instructions" toggle.
      setGateRules(!localStorage.getItem(HELP_KEY));
    } catch (e) {}
    try { setStats(getStats()); } catch (e) {}
    setHydrated(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  useEffect(() => {
    if (!hydrated) return;
    try { localStorage.setItem(STORE_KEY, JSON.stringify(g)); } catch (e) {}
    // same-device day breadcrumb for cross-puzzle recommendations — only for
    // TODAY'S puzzle (archive replays must not mark today as played)
    try {
      if (PUZZLE.num === pickPuzzle(puzzles, null).num) {
        (function(){ var _dn = g.status !== 'playing'; if (_dn || g.t0) localStorage.setItem('sot_span_day', JSON.stringify({ d: etToday(), done: _dn })); else localStorage.removeItem('sot_span_day'); })();
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
  const iq = useIqStanding({ game: 'span', quizId: PUZZLE.quizId, active: LOFT && !playing });
  const nextUp = useNextUnplayed({ self: 'span', active: LOFT && !playing });
  const upNext = useUnplayedSimilar({ self: 'span', active: LOFT && !playing });
  const dailyBoard = useDailyBoard({ quizId: PUZZLE.quizId, active: LOFT && !playing });
  const allTime = useGameAllTime({ game: 'span', active: LOFT && !playing });
  const dayStats = useDayStats();
  const catRank = useCategoryRank({ self: 'span', active: LOFT && !playing });
  const prevPuzzle = puzzles.find((x) => x.num === PUZZLE.num - 1) || null;
  const myStats = deriveStats(stats, pickPuzzle(puzzles, null).num);
  const finalScore = won ? Math.max(1, Math.min(10, 10 - (hops - PUZZLE.perfect))) : 0;

  const REC_KEY = `sot_span_rec_${PUZZLE.num}`;
  const abandon = useAbandonFlush(() => {
    // A play counts only once the player actually acts (a step, a miss, or a
    // hint). Opening the puzzle and dismissing the start gate does not log.
    const acted = (Array.isArray(g.chain) && g.chain.length > 1) || g.misses > 0 || g.hintUsed;
    if (!acted || g.status !== 'playing') return null;
    try { if (localStorage.getItem(REC_KEY)) return null; } catch (e) {}
    const el = Math.min(36000, Math.max(1, Math.round((Date.now() - (g.t0 || Date.now())) / 1000)));
    try { localStorage.setItem(REC_KEY, '1'); } catch (e) {}
    return { quizId: PUZZLE.quizId, score: 0, total: 10, correct: 0, guessesUsed: 0, timeElapsed: el, abandoned: true, email: identity?.email || undefined, anonId: getAnonId(), isMobile: isMobileDevice(), referrer: (typeof document !== 'undefined' ? document.referrer : '') };
  });

  function postResult(g2, score) {
    abandon.markFlushed();
    const el = g2.t0 ? Math.max(1, Math.round(((g2.tEnd || Date.now()) - g2.t0) / 1000)) : 1;
    try { setStats(recordStat(PUZZLE.num, { s: score, t: 10, g: g2.misses, won: g2.status === 'won' && (g2.chain.length - 1) === PUZZLE.perfect })); } catch (e) {}
    try {
      fetch('/api/quiz/result', {
        method: 'POST',
        keepalive: true,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ quizId: PUZZLE.quizId, score, total: 10, correct: g2.status === 'won' ? 1 : 0, guessesUsed: g2.misses, timeElapsed: el, email: identity?.email || undefined, anonId: getAnonId(), isMobile: isMobileDevice(), referrer: (typeof document !== 'undefined' ? document.referrer : '') }),
      })
        .then((r) => r.json())
        .then((d) => { if (d && !d.error) setBoard({ ...EMPTY_BOARD, ...d }); })
        .catch(() => {});
    } catch (e) {}
  }

  // Pressing Start begins the clock (sets t0) and marks the rules as seen. A
  // no-op once started, so re-reading the rules later never resets the timer.
  function startGame() {
    setG((cur) => (cur.t0 ? cur : { ...cur, t0: Date.now() }));
    try { localStorage.setItem(HELP_KEY, '1'); } catch (e) {}
  }

  function miss(g2, msg) {
    g2.misses = g2.misses + 1;
    setShake(true);
    setTimeout(() => setShake(false), 500);
    say(msg);
    setG(g2);
  }

  function addCountry(name) {
    if (!playing) return;
    const g2 = { ...g, chain: [...chain] };
    if (!g2.t0) g2.t0 = Date.now();
    const canonical = LOOKUP.get(normName(name));
    if (!canonical) { miss(g2, 'Not a country on the Span map'); return; }
    if (chain.includes(canonical)) { miss(g2, `${canonical} is already on your road`); return; }
    if (!ADJ[head] || !ADJ[head].has(canonical)) { miss(g2, `${canonical} doesn't border ${head}`); return; }
    if (AVOID && canonical === AVOID) { miss(g2, `Sunday rule: ${AVOID} is closed today`); return; }
    if (VIA && canonical === PUZZLE.end && !viaDone) { miss(g2, `Sunday rule: pass through ${VIA} before ${PUZZLE.end}`); return; }
    g2.chain.push(canonical);
    setTyped('');
    if (canonical === PUZZLE.end) {
      g2.status = 'won';
      g2.tEnd = Date.now();
      const score = Math.max(1, Math.min(10, 10 - ((g2.chain.length - 1) - PUZZLE.perfect)));
      postResult(g2, score);
      setG(g2);
      setJustWon(true);
      return;
    }
    say(`${canonical} — ${g2.chain.length - 1} hop${g2.chain.length - 1 === 1 ? '' : 's'} in.`);
    setG(g2);
  }

  function undo() {
    if (!playing || chain.length <= 1) return;
    const g2 = { ...g, chain: chain.slice(0, -1) };
    setG(g2);
  }

  // One free hint: take one step down a shortest road from where you stand.
  // It costs its move like any step — the share string carries the 💡.
  // Constraint-aware: routes around the avoided country, heads for the via
  // country first when it's still owed, and never doubles back through the
  // chain (blocked set) unless the chain has boxed the player in.
  function useHint() {
    if (!hintOk) return;
    if (!playing || g.hintUsed) return;
    const target = VIA && !viaDone ? VIA : PUZZLE.end;
    const blocked = new Set(chain.filter((c) => c !== head));
    if (AVOID) blocked.add(AVOID);
    if (VIA && !viaDone) blocked.add(PUZZLE.end);
    let route = shortestRoute(ADJ, head, target, blocked);
    if (!route || route.length < 2) route = shortestRoute(ADJ, head, target, AVOID || undefined);
    if (!route || route.length < 2) return;
    const next = route[1];
    if (chain.includes(next)) return;
    const g2 = { ...g, chain: [...chain, next], hintUsed: true };
    if (!g2.t0) g2.t0 = Date.now();
    if (next === PUZZLE.end) {
      g2.status = 'won';
      g2.tEnd = Date.now();
      const score = Math.max(1, Math.min(10, 10 - ((g2.chain.length - 1) - PUZZLE.perfect)));
      postResult(g2, score);
      setG(g2);
      setJustWon(true);
      return;
    }
    say(`Hint: ${next}. That was the one.`);
    setG(g2);
  }

  function revealEnd() {
    const g2 = { ...g, status: 'revealed', tEnd: Date.now() };
    if (!g2.t0) g2.t0 = Date.now();
    postResult(g2, 0);
    setG(g2);
  }

  function resetGame() {
    try { localStorage.removeItem(STORE_KEY); } catch (e) {}
    setG(freshState()); setTyped(''); setJustWon(false); setEndClosed(false);
  }

  // typeahead suggestions: prefix matches first, then contains
  const suggestions = useMemo(() => {
    if (!playing) return [];
    const q = normName(typed);
    if (q.length < 2) return [];
    const pre = [], mid = [];
    for (const c of COUNTRIES) {
      const n = normName(c);
      if (chain.includes(c)) continue;
      if (n.startsWith(q)) pre.push(c);
      else if (n.includes(q)) mid.push(c);
    }
    return [...pre, ...mid].slice(0, 6);
  }, [typed, playing, chain]);

  const beatPct = (() => {
    if (g.status === 'playing') return null;
    const dist = board.scoreDist;
    if (!dist) return null;
    const my = finalScore;
    let below = 0, all = 0;
    for (const [k, v] of Object.entries(dist)) {
      const n = Number(v) || 0;
      all += n;
      if (Number(k) < my) below += n;
    }
    const others = all - 1;
    if (others < 10) return null;
    return Math.max(0, Math.min(100, Math.round((below / others) * 100)));
  })();

  function shareText() {
    const hops = chain.length - 1;
    const squares = won
      ? '\u{1F7E9}' + '\u{1F7E6}'.repeat(Math.max(0, hops - 1)) + '\u{1F3C1}'
      : '\u{1F7E9}' + '\u{1F7E6}'.repeat(Math.max(0, hops)) + '⬛';
    const hintBit = g.hintUsed ? ' · 💡' : '';
    const streakBit = isTodays && myStats.cur >= 2 ? ` · streak ${myStats.cur}` : '';
    const ruleBit = VIA ? ` via ${VIA}` : AVOID ? ` (${AVOID} closed)` : '';
    const head2 = won
      ? `Span #${PUZZLE.num} · ${PUZZLE.start} → ${PUZZLE.end}${ruleBit} · ${hops} hops · ${elapsed}${hintBit}${streakBit}`
      : `Span #${PUZZLE.num} · ${PUZZLE.start} → ${PUZZLE.end}${ruleBit} · gave up at ${hops} hop${hops === 1 ? '' : 's'}${hintBit}`;
    return `${head2}\n${squares}\n${shareUrl()}`;
  }
  function shareUrl() {
    return withRef(`mindloftdaily.com/span${isTodays ? '' : `?p=${PUZZLE.num}`}`);
  }
  function copyShare() {
    const text = playing
      ? `Span #${PUZZLE.num} — get from ${PUZZLE.start} to ${PUZZLE.end}, border by border.${VIA ? ` Sunday Edition: the road must pass through ${VIA}.` : AVOID ? ` Sunday Edition: ${AVOID} is closed.` : ''} Shortest path is ${PUZZLE.perfect}.\n${shareUrl()}`
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

  // one CONSTRAINED shortest road (Sunday rules respected) — the reveal list,
  // and the dashed comparison line on the end-of-puzzle map
  const bestRoute = useMemo(() => {
    if (playing) return null;
    if (AVOID) return shortestRoute(ADJ, PUZZLE.start, PUZZLE.end, AVOID);
    if (VIA) return viaRoute(ADJ, PUZZLE.start, VIA, PUZZLE.end);
    return shortestRoute(ADJ, PUZZLE.start, PUZZLE.end);
  }, [playing, ADJ, PUZZLE, AVOID, VIA]);
  const revealRoute = g.status === 'revealed' ? bestRoute : null;
  // every country on ANY shortest road (there are often several): a country
  // sits on one iff dist(start,c) + dist(c,end) === the shortest length.
  // Countries beyond the primary road show in a lighter blue on the map.
  const altRoads = useMemo(() => {
    if (playing || !bestRoute) return null;
    const on = new Set();
    const addOnPath = (a, b, blocked) => {
      const dA = distancesFrom(ADJ, a, blocked);
      const dB = distancesFrom(ADJ, b, blocked);
      const len = dA[b];
      if (len == null) return;
      for (const c of Object.keys(dA)) {
        if (c === a || c === b) continue;
        if (dB[c] != null && dA[c] + dB[c] === len) on.add(c);
      }
    };
    if (VIA) {
      addOnPath(PUZZLE.start, VIA);
      addOnPath(VIA, PUZZLE.end);
    } else {
      addOnPath(PUZZLE.start, PUZZLE.end, AVOID || undefined);
    }
    return [...on];
  }, [playing, bestRoute, ADJ, PUZZLE, VIA, AVOID]);

  function chip(name, kind, key) {
    const base = { display: 'inline-flex', alignItems: 'center', gap: 6, fontFamily: SANS, fontWeight: 800, fontSize: 13.5, borderRadius: 8, padding: '7px 11px', border: '1.5px solid rgba(28,30,36,0.35)' };
    if (kind === 'start') return <span key={key} style={{ ...base, background: COLORS.ink, color: T.white }}>{name}</span>;
    if (kind === 'end') return <span key={key} style={{ ...base, background: STAGE ? SURF : T.white, color: INK, borderStyle: 'dashed' }}><Flag size={13} /> {name}</span>;
    if (kind === 'goal') return <span key={key} style={{ ...base, background: COLORS.trail, color: T.white, borderColor: COLORS.trail }}><Flag size={13} /> {name}</span>;
    return <span key={key} style={{ ...base, background: `var(--stg-surf, ${COLORS.trailSoft})`, color: '#14532d', borderColor: 'rgba(21,128,61,0.45)' }}>{name}</span>;
  }
  const arrow = (k) => <span key={k} style={{ color: `var(--stg-ink2, ${T.muted})`, fontWeight: 800 }}>&rarr;</span>;

  // Shared rules body — rendered in both the how-to-play modal and the start gate.
  const rulesBody = (
    <DailyRules
      lead={<>Get from <b>{PUZZLE.start}</b> to <b>{PUZZLE.end}</b> by land border.</>}
      banner={<>Perfect is <b>{PUZZLE.perfect} hops</b>, the proven shortest road.</>}
      steps={[
        <>Type a country that shares a <b>land border</b> with where you stand, and keep going until you reach {PUZZLE.end}.</>,
        <>Mainland borders only: overseas territories don&apos;t count (sorry, France&ndash;Brazil), and neither do bridges or tunnels.</>,
        <>A country that doesn&apos;t border your position is a <b>miss</b>. <b>Undo</b> any step for free.</>,
      ]}
      knack="Head for the country that opens the most onward borders, not the one that simply looks closest on the map."
      note={isSundayEd && sundayRule ? (
        <><b>Sunday Edition:</b> {VIA ? <>your road must pass through <b>{VIA}</b> before it reaches {PUZZLE.end}. The {PUZZLE.perfect}-hop shortest road already takes the detour.</> : <><b>{AVOID}</b> is closed today, so the road has to go around it. The {PUZZLE.perfect}-hop shortest road already does.</>}</>
      ) : null}
      footer="Score is 10 if your final chain matches perfect, minus one for each country over. Misses break leaderboard ties. One free hint, on your first ever play, walks you one step down a shortest road."
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
      <DailyChrome slug="span" name="Span" collapsed={started} loft={LOFT} />
      )}
      {LOFT && (
        <Cap gameKey="span" quizId={PUZZLE.quizId}
          name="Span"
          cat="Geography"
          outcome={playing ? null : (won ? 'won' : 'lost')}
          num={PUZZLE.num}
          tiles={playing ? null : upNext}
          dateLabel={PUZZLE.dateLabel}
          onHelp={() => setShowHelp(true)}
          sunday={null}
          figures={playing ? [
            { v: hops, k: 'hops' },
            { v: PUZZLE.perfect, k: 'perfect' },
            { v: elapsed, k: 'time' },
          ] : [
            { v: finalScore, k: 'score' },
            { v: hops, k: 'hops' },
            { v: elapsed, k: 'time' },
          ]}
        />
      )}
      <div className="sp-wrap" style={{ position: 'relative', zIndex: 2, maxWidth: 1180, margin: '0 auto', padding: '18px 38px 80px', fontFamily: SANS }}>
        <style dangerouslySetInnerHTML={{ __html: `
          @media(max-width:560px){.sp-wrap{padding-left:14px !important;padding-right:14px !important;}}
          .sp-btn{font-family:${SANS};font-weight:800;font-size:14px;border:2px solid ${STAGE ? 'var(--stg-line2)' : 'var(--blue-deep)'};background:${STAGE ? 'transparent' : 'var(--white)'};color:${STAGE ? 'var(--stg-ink)' : 'var(--blue-deep)'};border-radius:8px;padding:9px 16px;cursor:pointer;display:inline-flex;align-items:center;gap:7px;}
          .sp-btn:hover{background:var(--stg-surf2, var(--accent-soft));}
          @keyframes spshake{0%,100%{transform:translateX(0);}20%,60%{transform:translateX(-5px);}40%,80%{transform:translateX(5px);}}
          .sp-shake{animation:spshake .45s ease;}
          @keyframes spfade{from{opacity:0;}}
          @keyframes spstamp{from{opacity:0;transform:scale(.94);}}
          .sp-sug{display:block;width:100%;text-align:left;background:${STAGE ? 'var(--stg-surf)' : 'var(--white)'};border:none;border-bottom:1px solid var(--stg-line, rgba(28,30,36,0.08));font-family:${SANS};font-weight:700;font-size:14px;color:${INK};padding:9px 13px;cursor:pointer;}
          .sp-sug:hover{background:${STAGE ? 'var(--stg-surf2)' : '#eef4ff'};}
          @media(max-width:520px){.sp-htp-f{display:none;}.sp-htp-s{display:inline;}}
          @media(max-width:560px){.sp-ttl{flex-direction:column;align-items:flex-start;gap:1px;}.sp-ttl h1{font-size:21px;letter-spacing:0.02em;}.sp-ttl .sp-ttl-dt{font-size:15px;}.sp-ttl-dot{display:none;}}
          .sp-htp-s{display:none;}
        ` }} />

        <div style={{ maxWidth: 620, margin: '0 auto' }}>

        {/* puzzle-native top strip (Crux pattern): quiet nav + player chip */}

        {/* masthead: pressed SPAN tiles with No./date inline, one rule beneath */}
        {!LOFT && (
        <DailyMasthead
          slug="span"
          num={PUZZLE.num}
          dateLabel={PUZZLE.dateLabel}
          accent={COLORS.trail}
          blockGap={5}
          helpTop={13}
          marginBottom={16}
          onHelp={() => setShowHelp(true)}
          blocks={'SPAN'.split('').map((ch, i) => (
              <div key={i} style={{ width: 46, height: 46, borderRadius: 5, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: SANS, fontWeight: 900, fontSize: 28, background: i === 2 ? COLORS.trail : COLORS.ink, color: T.white, boxShadow: 'inset 0 2px 5px rgba(0,0,0,0.5), 0 1px 0 rgba(255,255,255,0.65)' }}>{ch}</div>
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

        {/* start tile — sits where the board goes until the player presses Start,
            which begins the clock. The assignment stays sealed until then. */}
        {preStart && (
          <div className={STAGE ? 'stg-gate' : undefined} style={{ background: STAGE ? SURF : COLORS.cream, border: STAGE ? `1px solid ${SURF_B}` : `2px solid ${COLORS.ink}`, borderRadius: 12, padding: '22px', display: 'flex', flexDirection: 'column' }}>
            <div style={{ fontSize: 20, fontWeight: 800, color: INK, marginBottom: 10 }}>{gateRules ? 'How to play' : 'Span is ready'}</div>
            {gateRules ? rulesBody : (
              <div style={{ fontSize: 14, lineHeight: 1.55, color: INK, fontWeight: 600 }}>
                <p style={{ margin: '0 0 6px' }}>Cross the map country by country, each step sharing a land border with the last.</p>
              </div>
            )}
            <div style={{ marginTop: 18, display: 'flex', flexDirection: 'row-reverse', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
              <button className="sp-btn" onClick={startGame} style={{ borderColor: STAGE ? STAGE_C : undefined, background: STAGE ? STAGE_C : T.cta, color: STAGE ? 'var(--stg-onramp, #08222e)' : T.white, fontSize: 15, padding: '11px 22px' }}>Start</button>
              <div>
                <button type="button" onClick={() => setGateRules((v) => !v)} style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', fontFamily: SANS, fontSize: 13, fontWeight: 700, color: FADED, textDecoration: 'underline' }}>
                  {gateRules ? 'Hide detailed instructions' : 'Show detailed instructions'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* the assignment */}
        {!preStart && (
        <div className={STAGE ? 'stg-board' : (LOFT ? 'loft-card' : undefined)} style={{ background: STAGE ? SURF : T.white, border: STAGE ? `1px solid ${SURF_B}` : `2px solid ${COLORS.ink}`, borderRadius: 10, padding: '13px 15px', boxShadow: STAGE ? 'none' : '5px 5px 0 rgba(28,30,36,0.16)', marginBottom: 12 }}>
          {isSundayEd && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 9, fontFamily: MONO, fontSize: 11, letterSpacing: '0.09em', textTransform: 'uppercase', color: '#8a6d1a', background: STAGE ? 'var(--stg-surf2)' : '#fdf6e3', border: '1px solid rgba(230,185,63,0.6)', borderRadius: 7, padding: '6px 10px', marginBottom: 11, flexWrap: 'wrap' }}>
              <b style={{ fontWeight: 800, color: '#92400e', whiteSpace: 'nowrap' }}>Sunday Edition</b>
              {sundayRule && (
                <span style={{ whiteSpace: 'nowrap' }}>
                  {VIA ? <>route through <b style={{ fontWeight: 800 }}>{VIA}</b>{viaDone ? <b style={{ color: `var(--stg-ink, ${COLORS.trail})`, fontWeight: 800 }}> &#10003;</b> : null}</> : <><b style={{ fontWeight: 800 }}>{AVOID}</b> is closed today</>}
                </span>
              )}
            </div>
          )}
          {!LOFT && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, fontFamily: MONO, fontSize: 11.5, letterSpacing: '0.1em', textTransform: 'uppercase', color: FADED, borderBottom: '1px solid rgba(28,30,36,0.18)', paddingBottom: 8, marginBottom: 12, flexWrap: 'wrap' }}>
            <span style={{ whiteSpace: 'nowrap' }}><b style={{ color: INK, fontWeight: 500 }}>{PUZZLE.start}</b> &rarr; <b style={{ color: INK, fontWeight: 500 }}>{PUZZLE.end}</b></span>
            <span style={{ marginLeft: 'auto', whiteSpace: 'nowrap' }}>perfect <b style={{ color: INK, fontWeight: 500 }}>{PUZZLE.perfect}</b> &middot; hops <b style={{ color: hops > PUZZLE.perfect ? `var(--stg-bad, ${COLORS.rust})` : `var(--stg-ink, ${COLORS.ink})`, fontWeight: 500 }}>{hops}</b> &middot; misses <b style={{ color: g.misses > 0 ? COLORS.rust : COLORS.ink, fontWeight: 500 }}>{g.misses}</b></span>
          </div>
          )}
          {LOFT && <div className={STAGE ? undefined : 'loft-prompt'}>{PUZZLE.start} → {PUZZLE.end}</div>}

          {/* the road so far */}
          <div className={shake ? 'sp-shake' : undefined} style={{ display: 'flex', alignItems: 'center', gap: 7, flexWrap: 'wrap', marginBottom: 4 }}>
            {chain.map((c, i) => {
              const kind = i === 0 ? 'start' : won && i === chain.length - 1 ? 'goal' : 'step';
              const parts = [chip(c, kind, `c${i}`)];
              if (i < chain.length - 1) parts.push(arrow(`a${i}`));
              return parts;
            })}
            {!won && [arrow('af'), <span key="dots" style={{ color: `var(--stg-ink2, ${T.muted})`, fontWeight: 800, letterSpacing: 2 }}>&hellip;</span>, arrow('ae'), chip(PUZZLE.end, 'end', 'endchip')]}
          </div>
          {won && <div style={{ fontFamily: MONO, fontSize: 11, color: `var(--stg-ink, ${COLORS.trail})`, fontWeight: 500, marginTop: 6 }}>Spanned in {chain.length - 1} hop{chain.length - 1 === 1 ? '' : 's'}.</div>}
        </div>
        )}

        {/* input */}
        {started && (
          <div style={{ marginBottom: 12 }}>
            <div style={{ display: 'flex', gap: 8, alignItems: 'stretch' }}>
              <div style={{ position: 'relative', flex: 1 }}>
                <input
                  ref={inputRef}
                  value={typed}
                  onChange={(e) => setTyped(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); if (suggestions.length === 1) addCountry(suggestions[0]); else addCountry(typed); } }}
                  placeholder={`Next stop from ${head}…`}
                  autoComplete="off" autoCorrect="off" autoCapitalize="off" spellCheck={false}
                  style={{ width: '100%', boxSizing: 'border-box', fontFamily: SANS, fontWeight: 700, fontSize: 15, color: INK, background: STAGE ? SURF : T.white, border: STAGE ? `1px solid ${SURF_B}` : `2px solid ${COLORS.ink}`, borderRadius: 9, padding: '11px 13px', outline: 'none' }}
                />
                {suggestions.length > 0 && (
                  <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 30, background: STAGE ? 'var(--stg-raise,#0e131f)' : T.white, border: STAGE ? '1.5px solid var(--stg-line2,rgba(255,255,255,0.17))' : '1.5px solid rgba(28,30,36,0.35)', borderRadius: 9, marginTop: 4, overflow: 'hidden', boxShadow: '0 8px 20px rgba(20,22,28,0.14)' }}>
                    {suggestions.map((c) => (
                      <button key={c} className="sp-sug" onMouseDown={(e) => { e.preventDefault(); addCountry(c); }}>{c}</button>
                    ))}
                  </div>
                )}
              </div>
              <button className="sp-btn" onClick={() => { if (suggestions.length === 1) addCountry(suggestions[0]); else addCountry(typed); }} style={{ background: COLORS.trail, color: T.white, borderColor: COLORS.trail }}>Go</button>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 9, flexWrap: 'wrap' }}>
              {chain.length > 1 && (
                <button className="sp-btn" onClick={undo} style={{ borderColor: '#c3c8cf', color: FADED, padding: '6px 12px', fontSize: 12.5 }}>
                  <Undo2 size={14} /> Undo last step
                </button>
              )}
              {hintOk && !g.hintUsed && (
                <button className="sp-btn" onClick={useHint} title="Take one step down a shortest road (one hint, first play only)"
                  style={{ background: STAGE ? 'var(--stg-surf2)' : '#fdf6e3', border: '1.5px solid rgba(230,185,63,0.7)', color: '#8a6d1a', padding: '6px 12px', fontSize: 12.5 }}>
                  <Lightbulb size={14} /> Hint
                </button>
              )}
              {identity && (chain.length > 1 || g.misses > 0) && (
                <button onClick={() => { if (armReveal) { if (Date.now() - armReveal < ARM_MIN_MS) return; setArmReveal(false); revealEnd(); } else { setArmReveal(Date.now()); } }}
                  style={{ marginLeft: 'auto', background: 'none', border: 'none', cursor: 'pointer', fontFamily: SANS, fontWeight: 700, fontSize: 12, color: armReveal ? `var(--stg-bad, ${COLORS.rust})` : `var(--stg-mute, ${COLORS.faded})`, textDecoration: 'underline', textUnderlineOffset: 3, display: 'inline-flex', alignItems: 'center', gap: 5 }}>
                  <Eye size={13} /> {armReveal ? 'Tap again — ends the puzzle and shows a shortest road' : 'Reveal a road & end'}
                </button>
              )}
            </div>
          </div>
        )}


          </div>
          <div className={STAGE ? undefined : 'loft-sol'}>
          {/* result */}
          {!playing && (
            <>
              <div style={{ maxWidth: 472, margin: '0 auto 12px' }}>
                <SpanMap chain={chain} best={won && hops === PUZZLE.perfect ? null : bestRoute} alts={altRoads} />
                {revealRoute && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap', margin: '8px 0 4px' }}>
                    {revealRoute.map((c, i) => {
                      const parts = [chip(c, i === 0 ? 'start' : i === revealRoute.length - 1 ? 'goal' : 'step', `r${i}`)];
                      if (i < revealRoute.length - 1) parts.push(arrow(`ra${i}`));
                      return parts;
                    })}
                  </div>
                )}
                {PUZZLE.note && (
                  <div style={{ fontSize: 12.5, fontWeight: 600, color: FADED, fontStyle: 'italic', margin: '6px 0 10px', lineHeight: 1.5 }}>{PUZZLE.note}</div>
                )}
              </div>
              <p className={STAGE ? undefined : 'loft-tailnote'} style={{ fontSize: 12, color: FADED, fontWeight: 600, margin: '12px 0 0' }}>
                {isTodays ? (
                  <>
                    {countdown ? <>Next Span in <b style={{ color: INK, fontVariantNumeric: 'tabular-nums' }}>{countdown}</b>.</> : 'A new route drops at midnight Eastern.'}
                    {prevPuzzle && (
                      <>
                        {' '}Meanwhile:{' '}
                        <a href={`/span?p=${prevPuzzle.num}`} style={{ color: `var(--stg-ink, ${COLORS.ember})`, fontWeight: 800, textDecoration: 'underline' }}>
                          play yesterday&rsquo;s Span &rarr;
                        </a>
                      </>
                    )}
                  </>
                ) : (
                  <>
                    You&rsquo;re playing the {PUZZLE.dateLabel.replace(', 2026', '')} archive.{' '}
                    <a href="/span" style={{ color: `var(--stg-ink, ${COLORS.ember})`, fontWeight: 800, textDecoration: 'underline' }}>Back to today&rsquo;s Span &rarr;</a>
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
              name="Span"
              catRank={catRank}
              outcome={won ? 'won' : 'lost'}
              title={won ? 'Solved' : 'Not solved'}
              detail={`${finalScore} \u00b7 ${hops} hops \u00b7 ${elapsed}`}
              iq={iq}
              board={dailyBoard}
              gameRank={allTime && allTime.ready
                ? { value: allTime.rank != null ? `#${Number(allTime.rank).toLocaleString()}` : '\u2014',
                    label: allTime.field != null ? `of ${Number(allTime.field).toLocaleString()} Span all time` : 'all-time rank' }
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
                  href: `/span?p=${p.num}`,
                  done: !!(stats && stats.rec && stats.rec[p.num]),
                  score: (stats && stats.rec && stats.rec[p.num]) ? stats.rec[p.num].s : null,
                }))}
              options={[
                { label: copied ? 'Copied' : (shareCta || 'Share'), sub: 'Your result, no spoilers', kind: 'gold', onClick: copyShare },
                { tone: won ? 'board' : 'reveal', label: won ? 'Return to board' : 'Reveal answer',
                  sub: won ? 'Your finished board' : 'Show what you missed', onClick: () => setRevealed(true) },
              prevPuzzle && { tone: 'another', label: 'Play another Span', sub: `No. ${prevPuzzle.num}, yesterday\u2019s puzzle`, href: `/span?p=${prevPuzzle.num}` },
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
        {!STAGE && <GamePanel self="span" name="Span" onShow={() => setShowChrome(true)} />}
        {/* standard quiz-page bottom: challenge + stats + join + leaderboard */}
        <div style={{ display: (focusMode && !STAGE) ? 'none' : 'block', margin: '30px auto 0' }}>
          {LOFT && (
            <div className={STAGE ? undefined : 'loft-report'}>
              <ReportIssue self="span" name="Span" accent="#ffffff" align="center" onHelp={() => setShowHelp(true)} />
            </div>
          )}
          {!LOFT && (
          <DailyGamesGrid replay={!playing ? resetGame : null}
            self="span"
            maxWidth={620}
            challengeHref={`/duel/new?quiz=${encodeURIComponent(PUZZLE.quizId)}`}
            share={{ label: copied ? 'Copied' : 'Share', onClick: copyShare }}
            light
            boardSlot={<DailyBoardPanel self="span" quizId={PUZZLE.quizId} maxWidth={620} streak={{ current: myStats.cur, best: myStats.max }} />}
            divider
          />
          )}
          {!focusMode && mobileUi && !standalone && (
            <button onClick={a2hsClick} style={{ marginTop: 10, width: '100%', fontFamily: SANS, fontSize: 13.5, letterSpacing: '0.05em', textTransform: 'uppercase', fontWeight: 800, height: 54, borderRadius: 10, border: 'none', background: '#21b45e', color: T.white, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 9, whiteSpace: 'nowrap' }}>
              <Smartphone size={15} strokeWidth={2.5} /> Add to Home Screen
            </button>
          )}
        </div>
        {showA2hsHelp && (
          <div onClick={() => setShowA2hsHelp(false)} style={{ position: 'fixed', inset: 0, background: 'rgba(20,22,28,0.55)', zIndex: 90, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 18 }}>
            <div onClick={(e) => e.stopPropagation()} style={{ background: STAGE ? 'var(--stg-raise,#0e131f)' : T.white, borderRadius: 14, maxWidth: 430, width: '100%', padding: '22px 22px 16px', fontFamily: SANS, border: STAGE ? '1px solid var(--stg-line)' : '1.5px solid rgba(20,22,28,0.12)' }}>
              <div style={{ fontSize: 17, fontWeight: 800, color: INK, marginBottom: 8 }}>Add Span to your Home Screen</div>
              {isIosDevice() ? (
                <ol style={{ margin: '0 0 4px', paddingLeft: 20, color: INK, fontSize: 14, lineHeight: 1.7 }}>
                  <li>Tap the <b>Share</b> button in Safari&apos;s toolbar.</li>
                  <li>Scroll down and tap <b>Add to Home Screen</b>.</li>
                  <li>Tap <b>Add</b> &mdash; the green-route tile opens today&apos;s puzzle, every day.</li>
                </ol>
              ) : (
                <p style={{ margin: '0 0 4px', color: INK, fontSize: 14, lineHeight: 1.7 }}>
                  Open your browser&apos;s menu and choose <b>Add to Home Screen</b> (or <b>Install app</b>). The green-route tile opens today&apos;s puzzle, every day.
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

      {/* the end-of-puzzle popup: the shared DailyEndCard as a dismissible modal (win or loss) */}
      {!playing && !endClosed && !LOFT && (
        <DailyEndCard
          modal
          self="span"
          won={won}
          headline={won ? <>You made the span!</> : <>You scored {Math.round(((won ? finalScore : 0) / 10) * 100)}%</>}
          subline={won
            ? <>{finalScore}/10 &middot; {hops} hops (perfect {PUZZLE.perfect}) &middot; {g.misses} miss{g.misses === 1 ? '' : 'es'} &middot; {elapsed}{g.hintUsed ? <> &middot; 1 hint</> : null}</>
            : <>0/10 &middot; a shortest road is below</>}
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
            <button className="sp-btn" onClick={() => { setShowHelp(false); try { localStorage.setItem(HELP_KEY, '1'); } catch (e) {} }} style={{ marginTop: 14, background: COLORS.ink, color: T.white }}>Play</button>
          </div>
        </div>
      )}

      {/* The desktop fold: the About prose below starts one screen down (app/StageFold.jsx). */}
      <StageFold />
      {/* About Span — crawlable prose for search, server-rendered into the initial HTML */}
      <section style={{ position: 'relative', display: (focusMode && !STAGE) ? 'none' : 'block', zIndex: 2, maxWidth: 620, margin: '0 auto', padding: '10px 24px 42px', fontFamily: SANS }}>
        <h2 style={{ margin: '0 0 8px', fontSize: 15, fontWeight: 800, letterSpacing: '-0.01em', color: INK }}>About Span</h2>
        <p style={{ margin: '0 0 8px', fontSize: 13, lineHeight: 1.65, color: FADED, fontWeight: 600 }}>
          Span is a free daily geography puzzle from Mind Loft. Each day hands you two countries; your job is to connect them with the shortest chain of land borders you can find. Match the shortest path on the map and you&apos;ve spanned the day.
        </p>
        <p style={{ margin: '0 0 8px', fontSize: 13, lineHeight: 1.65, color: FADED, fontWeight: 600 }}>
          The map plays by strict rules: mainland land borders only, so overseas territories, bridges, and tunnels don&apos;t count, which is why Scandinavia&apos;s only way out is through Russia, and why the Sinai is the single land door between Africa and Asia. Contiguous exclaves do count: Kaliningrad, Nakhchivan, and Cabinda are all in play.
        </p>
        <p style={{ margin: 0, fontSize: 13, lineHeight: 1.65, color: FADED, fontWeight: 600 }}>
          A new route drops every day at midnight Eastern, and every puzzle ends with your road drawn on the world map. On Sundays the Sunday Edition adds a twist: a country your road must pass through, or one whose borders are closed for the day. No app, no signup, play free in your browser, keep a streak, and race the daily leaderboard. More dailies: <a href="/crux" style={{ color: INK, fontWeight: 800 }}>Crux</a>, our clueless crossword, <a href="/garble" style={{ color: INK, fontWeight: 800 }}>Garble</a>, our word scramble, and <a href="/links" style={{ color: INK, fontWeight: 800 }}>Links</a>, our word grouping puzzle.
        </p>
      </section>

      {!STAGE && <div style={{ position: 'relative', zIndex: 2, display: focusMode ? 'none' : 'block' }}><Footer /></div>}
    </div>
  );
}
