'use client';

import React, { useState, useEffect, useLayoutEffect, useMemo, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { ArrowLeft, Share2, Check, X, Flag, Trophy, HelpCircle, Eye, SkipForward, Crown, RotateCcw, Shuffle, Swords } from 'lucide-react';
import JoinLeaderboardForm from './JoinLeaderboardForm';
import QuizStandings from './QuizStandings';
import LeaderboardSnippet from './LeaderboardSnippet';
import LeaderboardStrip from './LeaderboardStrip';
import RegisterRankLine from './RegisterRankLine';
import { QUIZZES, getQuiz } from '@/lib/quizzes';
import { getChallenge, challengeQuizIds } from '@/lib/challenges';
import { quizDept as deptOf, DEPT_LABEL } from '@/lib/quiz-departments';
import Grain from '../../Grain';
import Footer from '../../Footer';
import Count from '../../Count';
import QuizNavHeader from '../../quizzes/QuizNavHeader';
import StageChrome from '../../StageChrome';
import { isQuizStage, QUIZ_ACC_VARS } from '@/lib/quiz-stage';
import { useStageTheme } from '@/lib/stage-theme';
import { isMobileDevice } from '@/lib/is-mobile';
import useAbandonFlush from './useAbandonFlush';
import useDuelContext, { DuelBanner } from './useDuelContext';
import QuizIdleActions from './QuizIdleActions';
import { LB_POPS, LB_FILTERS, pickLb, lbEmptyNote, registerRank } from '@/lib/quiz-lb';
import useIsMobile from './useIsMobile';
import dynamic from 'next/dynamic';
import { flushSync } from 'react-dom';
import QuizPlayOverlay from './QuizPlayOverlay';
import { similarQuizId, nextQuizMeta, familyQuizzes, allowInSimilar } from '@/lib/quiz-similar';
import SimilarQuizTiles from './SimilarQuizTiles';
import UpNextCard from './UpNextCard';
import ScrollToTopOnMount from './ScrollToTopOnMount';
import { ArrowRight, Play } from 'lucide-react';
import { withRef } from '@/lib/referrals';
import { notifyShareCredit } from '@/app/ShareCreditPop';
import { savedIdentity } from '@/lib/saved-identity';
import { T } from '@/lib/theme';
import MindLoftMark from '../../MindLoftMark';
// The Loft format, shared with the 65 daily puzzles. DailyChrome is the same
// header the dailies carry (it renders QuizNavHeader itself and adds the loft
// treatment: no selector rail, no stat row, the player's standing in the top
// bar). LoftCap is the blue band that replaces the page's own title block, and
// QuizLoftFinish is the thin adapter onto the shared end card.
import DailyChrome from '../../DailyChrome';
import LoftCap from '../../LoftCap';
import useQuizLoft from '../../useQuizLoft';
import QuizLoftFinish from './QuizLoftFinish';

const MapQuizBoard = dynamic(() => import('./MapQuizBoard'), { ssr: false, loading: () => null });
const StreetMapBoard = dynamic(() => import('./StreetMapBoard'), { ssr: false, loading: () => null });
const MatchQuizBoard = dynamic(() => import('./MatchQuizBoard'), { ssr: false, loading: () => null });
const BankQuizBoard = dynamic(() => import('./BankQuizBoard'), { ssr: false, loading: () => null });
const OrderBankBoard = dynamic(() => import('./OrderBankBoard'), { ssr: false, loading: () => null });
const TypeItBoard = dynamic(() => import('./TypeItBoard'), { ssr: false, loading: () => null });
const TimedMcqBoard = dynamic(() => import('./TimedMcqClient'), { ssr: false, loading: () => null });
const LogicGridBoard = dynamic(() => import('./LogicGridClient'), { ssr: false, loading: () => null });
const PhotoBoard = dynamic(() => import('./PhotoBoard'), { ssr: false, loading: () => null });
const PhotoMatchBoard = dynamic(() => import('./PhotoMatchBoard'), { ssr: false, loading: () => null });
const GridFillBoard = dynamic(() => import('./GridFillBoard'), { ssr: false, loading: () => null });
const WordScrambleBoard = dynamic(() => import('./WordScrambleBoard'), { ssr: false, loading: () => null });
const MapPlaceBoard = dynamic(() => import('./MapPlaceClient'), { ssr: false, loading: () => null });
const GeoAerialBoard = dynamic(() => import('./GeoAerialClient'), { ssr: false, loading: () => null });
const GlobePlaceBoard = dynamic(() => import('./GlobePlaceClient'), { ssr: false, loading: () => null });
const SurviveStateBoard = dynamic(() => import('./SurviveStateBoard'), { ssr: false, loading: () => null });
const LogicGameBoard = dynamic(() => import('./LogicGameClient'), { ssr: false, loading: () => null });
const HigherLowerBoard = dynamic(() => import('./HigherLowerBoard'), { ssr: false, loading: () => null });
const CloserBoard = dynamic(() => import('./CloserBoard'), { ssr: false, loading: () => null });
const ConnectionsBoard = dynamic(() => import('./ConnectionsBoard'), { ssr: false, loading: () => null });

function shuffleIdx(n) {
  const a = [...Array(n).keys()];
  for (let i = n - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; }
  return a;
}

// Palette inlined (not imported from the 3.6MB lib/data) to keep this route
// bundle tiny.
const COLORS = {
  cream: T.surface,
  paper: T.paper,
  ink: T.ink,
  ember: T.accent,
  soft: T.muted,
  line: 'rgba(20,22,28,0.30)',
  accSoft: T.accentSoft,
  accBorder: T.accentBorder,
  gold: T.gold,
  silver: T.silver,
  bronze: T.bronze,
  rust: T.danger,
  forest: T.success,
  faded: T.muted,
};
const MONO = "'Manrope', system-ui, -apple-system, sans-serif";
const SERIF = "'Manrope', system-ui, -apple-system, sans-serif";
const SANS = "'Manrope', system-ui, -apple-system, sans-serif";

// Brand mark (gradient ids suffixed per render so multiple instances stay unique).
let __logoSeq = 0;
function Logo({ size = 22 }) {
  return <MindLoftMark size={size} />;
}

// eslint-disable-next-line no-unused-vars -- size default kept at 22


function norm(s) {
  return (s || '').toLowerCase().replace(/[^a-z0-9 ]/g, ' ').replace(/\s+/g, ' ').trim();
}

// Order-independent key match. A key counts when the normalized guess CONTAINS
// it as a substring (so a fuller guess satisfies a short key, e.g. "delta air
// lines" -> key "delta"), OR when the key is two-plus words and every one of
// those words appears as a whole token in the guess regardless of order (so
// "disneyland tokyo" satisfies the key "tokyo disneyland"). Single-word keys
// stay substring-only, which preserves partial-typing and the existing
// collision rules. Used for both keys (accept) and anti (block).
function deArticle(s) {
  return s.replace(/^(?:the|a|an) (?=.{2})/, '');
}
function keyHit(g, key) {
  const k = deArticle(norm(key));
  if (!k) return false;
  if (g.includes(k)) return true;
  const kt = k.split(' ');
  if (kt.length >= 2) {
    const gt = g.split(' ');
    if (kt.every((w) => gt.includes(w))) return true;
  }
  // Space-insensitive whole-answer match: "sanmarino" === "san marino",
  // "unitedstates" === "united states". Full-string equality only (never a
  // substring), so it can never glue a short key onto its neighbours (no
  // "la" -> "dallas", "as" -> "kansas"). Adds 0 cross-answer collisions.
  return g.replace(/ /g, '') === k.replace(/ /g, '');
}
function anyKey(g, keys) {
  return (keys || []).some((k) => keyHit(g, k));
}
// Ordered same-label group match: in an ordered matched quiz, consecutive
// slots that share a label (e.g. the same year) form a group that may be
// answered in ANY order; sequence is enforced only ACROSS groups. Returns the
// index of an unfound slot in the CURRENT group whose keys the guess hits, or
// -1. With unique labels the group is a single slot, so existing ordered
// quizzes behave exactly as before.
function orderedGroupHit(g, answers, found, nameKeys) {
  const first = found.findIndex((x) => !x);
  if (first < 0) return -1;
  const curLabel = answers[first].label;
  for (let j = first; j < answers.length; j++) {
    if (answers[j].label !== curLabel) break;
    if (found[j]) continue;
    if ((anyKey(g, answers[j].keys) || anyKey(g, (nameKeys || [])[j])) && !anyKey(g, answers[j].anti)) return j;
  }
  return -1;
}
// Sudden-death live helper: is the partial typed guess `g` still on track to
// reach one of `keys`? True when `g` is a prefix of an accepted form, or when
// the words of a multi-word key can still all be completed (any order). Used
// ONLY by strike ordered quizzes to end the run the instant a wrong character
// makes the current target unreachable, without waiting for Enter.
function couldReach(g, keys) {
  if (!g) return true;
  const gt = g.split(' ');
  const lastPartial = gt[gt.length - 1];
  const completed = gt.slice(0, -1);
  for (const key of keys || []) {
    const k = deArticle(norm(key));
    if (!k) continue;
    if (k.startsWith(g)) return true;
    if (k.replace(/ /g, '').startsWith(g.replace(/ /g, ''))) return true; // spaceless typing stays reachable
    const kt = k.split(' ');
    if (kt.length < 2) continue;
    const remaining = kt.slice();
    let ok = true;
    for (const w of completed) {
      const idx = remaining.indexOf(w);
      if (idx === -1) { ok = false; break; }
      remaining.splice(idx, 1);
    }
    if (ok && (lastPartial === '' || remaining.some((w) => w.startsWith(lastPartial)))) return true;
  }
  return false;
}
// The bare name a player naturally types: the answer's display `t` with any
// parenthetical disambiguator stripped ("Moscow (Idaho)" -> "moscow"). Authored
// `keys` sometimes only list the disambiguated forms ("moscow idaho"), which a
// multi-word key never matches from the short guess, so the answer silently
// rejects its own name. We accept the bare name implicitly to close that gap.
function baseName(t) {
  return norm(String(t || '').replace(/\([^)]*\)/g, ' '));
}
// For each answer, the implicit name keys accepted IN ADDITION to its authored
// keys: the full normalized name and the parenthetical-stripped base name, but
// ONLY when that candidate is UNAMBIGUOUS across the quiz, i.e. it does not match
// any other answer's keys, is not a substring of any other answer's name, and is
// not another answer's base name. The guard guarantees an implicit key can only
// ever credit its own slot, so this never steals a guess from a sibling answer
// (sequel/substring collisions still require authored `anti`, exactly as before).
function buildImplicitNameKeys(answers) {
  const list = answers || [];
  const norms = list.map((a) => norm(a && a.t));
  const bases = list.map((a) => baseName(a && a.t));
  const unambiguous = (cand, i) => {
    if (!cand) return false;
    for (let j = 0; j < list.length; j++) {
      if (j === i) continue;
      if (anyKey(cand, list[j].keys)) return false; // would match another slot's key
      if (norms[j] && norms[j].includes(cand)) return false; // substring of another name
      if (bases[j] && bases[j] === cand) return false; // shared base name
    }
    return true;
  };
  return list.map((a, i) => {
    const out = [];
    for (const cand of [norms[i], bases[i]]) {
      if (cand && !out.includes(cand) && unambiguous(cand, i)) out.push(cand);
    }
    return out;
  });
}
// Local date + time a leaderboard entry was played (viewer's timezone).
function fmtWhen(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleString('en-US', { year: 'numeric', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });
}
function fmtTime(sec) {
  const s = Math.max(0, Math.round(sec || 0));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
}

// Ordinal label for a per-user attempt number: 1 -> "1st", 2 -> "2nd", 23 -> "23rd".
function ordinal(n) {
  const v = Number(n) || 0;
  const mod100 = v % 100;
  if (mod100 >= 11 && mod100 <= 13) return `${v}th`;
  switch (v % 10) {
    case 1: return `${v}st`;
    case 2: return `${v}nd`;
    case 3: return `${v}rd`;
    default: return `${v}th`;
  }
}

// ── Personal stats (client-side) ──
function statsKey(id) {
  return `sot_quiz_${id}`;
}
function loadStats(id) {
  if (typeof window === 'undefined') return { attempts: 0, best: 0, totalCorrect: 0 };
  try {
    return JSON.parse(localStorage.getItem(statsKey(id))) || { attempts: 0, best: 0, totalCorrect: 0 };
  } catch {
    return { attempts: 0, best: 0, totalCorrect: 0 };
  }
}
function recordResult(id, score) {
  const s = loadStats(id);
  const next = { attempts: s.attempts + 1, best: Math.max(s.best, score), totalCorrect: s.totalCorrect + score };
  try {
    localStorage.setItem(statsKey(id), JSON.stringify(next));
  } catch {}
  return next;
}
// Stable per-browser anonymous id. Sent with every result and used on join/claim
// to link games played BEFORE signing up to the new account, so warm-up runs
// can't be hidden to fake a "1st Try" high score.
function getAnonId() {
  if (typeof window === 'undefined') return null;
  try {
    let a = localStorage.getItem('sot_quiz_anon');
    if (!a) {
      a = (window.crypto && crypto.randomUUID)
        ? crypto.randomUUID()
        : `a_${Date.now()}_${Math.random().toString(36).slice(2)}`;
      localStorage.setItem('sot_quiz_anon', a);
    }
    return a;
  } catch {
    return null;
  }
}


// Real share of OTHER completed attempts this run beat, from the recorded score
// distribution (board.scoreDist). null when there are no other attempts yet.
function pctAttemptsBeaten(scoreDist, plays, myScore) {
  if (!scoreDist || typeof myScore !== 'number') return null;
  let beaten = 0;
  for (const k in scoreDist) { if (Number(k) < myScore) beaten += scoreDist[k] || 0; }
  const others = (plays || 0) - 1;
  if (others <= 0) return null;
  return Math.round((beaten / others) * 100);
}

// Self-contained confetti / fireworks celebration drawn on a full-viewport
// canvas. kind 'big' (gold fireworks + crown, for an all-time top score) or
// 'small' (a quick multicolor burst, for a perfect run that is not the top).
function QuizCelebration({ kind, onDone }) {
  const ref = useRef(null);
  const doneRef = useRef(onDone);
  doneRef.current = onDone;
  useEffect(() => {
    if (!kind) return undefined;
    const canvas = ref.current;
    if (!canvas) return undefined;
    const ctx = canvas.getContext('2d');
    const DPR = Math.min(window.devicePixelRatio || 1, 2);
    let W = 0, H = 0;
    const size = () => { W = window.innerWidth; H = window.innerHeight; canvas.width = W * DPR; canvas.height = H * DPR; ctx.setTransform(DPR, 0, 0, DPR, 0, 0); };
    size();
    window.addEventListener('resize', size);
    const big = kind === 'big';
    const GOLD = ['#fbb615', '#ffe24d', '#f59008', '#ffcb45'];
    const MIX = [T.accent, '#1d4ed8', T.success, '#fbb615', T.white, '#ef476f'];
    const pal = big ? GOLD : MIX;
    const rnd = (a, b) => a + Math.random() * (b - a);
    let parts = [];
    const burst = (cx, cy, n, power) => {
      for (let i = 0; i < n; i++) {
        const a = rnd(0, Math.PI * 2), sp = rnd(0.3, 1) * power;
        parts.push({ x: cx, y: cy, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp - rnd(1, 4), g: 0.12 + Math.random() * 0.06, rot: rnd(0, 6.28), vr: rnd(-0.3, 0.3), s: rnd(5, 12), c: pal[(Math.random() * pal.length) | 0], sh: Math.random() < 0.5 ? 'r' : 'c', life: 0, max: rnd(70, 140) });
      }
    };
    const cx = W / 2, cy = H * 0.4;
    burst(cx, cy, big ? 90 : 80, big ? 9 : 8);
    const shots = big
      ? [[cx, cy - 50], [cx - 110, cy + 10], [cx + 110, cy + 10], [cx - 60, cy - 90], [cx + 60, cy - 90], [cx, cy + 60], [cx - 150, cy - 20], [cx + 150, cy - 20]]
      : [[cx - 70, cy - 10], [cx + 70, cy - 10]];
    let k = 0;
    const iv = setInterval(() => { const sh = shots[k++]; if (!sh) { clearInterval(iv); return; } burst(sh[0], sh[1], big ? 46 : 34, big ? 9 : 6); }, big ? 220 : 160);
    const start = performance.now();
    const fountainStop = start + (big ? 2600 : 1300);
    const stopAt = start + (big ? 3800 : 2300);
    let raf = 0;
    let finished = false;
    const finish = () => { if (finished) return; finished = true; cancelAnimationFrame(raf); clearInterval(iv); window.removeEventListener('resize', size); if (doneRef.current) doneRef.current(); };
    const frame = (now) => {
      ctx.clearRect(0, 0, W, H);
      if (now < fountainStop) {
        for (let i = 0; i < (big ? 4 : 3); i++) parts.push({ x: rnd(0, W), y: -10, vx: rnd(-1, 1), vy: rnd(1.5, 3.5), g: 0.05, rot: rnd(0, 6.28), vr: rnd(-0.3, 0.3), s: rnd(5, 10), c: pal[(Math.random() * pal.length) | 0], sh: Math.random() < 0.5 ? 'r' : 'c', life: 0, max: rnd(140, 220) });
      }
      const gFade = now > stopAt - 500 ? Math.max(0, (stopAt - now) / 500) : 1;
      for (let i = parts.length - 1; i >= 0; i--) {
        const p = parts[i];
        p.life++; p.vy += p.g; p.x += p.vx; p.y += p.vy; p.rot += p.vr;
        const al = p.life > p.max - 30 ? Math.max(0, (p.max - p.life) / 30) : 1;
        ctx.globalAlpha = al * gFade;
        ctx.fillStyle = p.c;
        ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.rot);
        if (p.sh === 'r') ctx.fillRect(-p.s / 2, -p.s / 3, p.s, p.s * 0.66);
        else { ctx.beginPath(); ctx.arc(0, 0, p.s / 2, 0, 6.28); ctx.fill(); }
        ctx.restore();
        if (p.life >= p.max || p.y > H + 30) parts.splice(i, 1);
      }
      ctx.globalAlpha = 1;
      if (now < stopAt) raf = requestAnimationFrame(frame);
      else finish();
    };
    raf = requestAnimationFrame(frame);
    return finish;
  }, [kind]);
  if (!kind) return null;
  return (
    <div aria-hidden="true" style={{ position: 'fixed', inset: 0, zIndex: 9999, pointerEvents: 'none' }}>
      <canvas ref={ref} style={{ width: '100%', height: '100%', display: 'block' }} />
      {kind === 'big' && (
        <div style={{ position: 'absolute', left: '50%', top: '20%', transform: 'translateX(-50%)', animation: 'sotCrownPop 3.6s ease forwards' }}>
          <div style={{ width: 74, height: 74, borderRadius: '50%', background: '#fbb615', display: 'flex', alignItems: 'center', justifyContent: 'center', border: `3px solid ${T.white}`, boxShadow: '0 8px 26px rgba(245,144,8,0.55)' }}>
            <Crown size={38} color="#7a4a00" strokeWidth={2.2} />
          </div>
        </div>
      )}
      <style dangerouslySetInnerHTML={{ __html: `@keyframes sotCrownPop{0%{opacity:0;transform:translateX(-50%) translateY(-34px) scale(.5)}10%{opacity:1;transform:translateX(-50%) translateY(0) scale(1)}82%{opacity:1;transform:translateX(-50%) translateY(0) scale(1)}100%{opacity:0;transform:translateX(-50%) translateY(-8px) scale(.96)}}` }} />
    </div>
  );
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function QuizClient({ quizId }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  // THE STAGE. Same three-way switch every daily uses, keyed by this file
  // rather than by a registry key, because a quiz has no registry row and
  // the unit of rollout is the CLIENT: see lib/quiz-stage.js.
  const QSTAGE = isQuizStage('QuizClient', searchParams);
  const [stageTheme] = useStageTheme();
  // TEXT and FILL are separate names on purpose. Near-black TEXT is
  // invisible on this ground and has to move; a near-black FILL is a
  // perfectly good object on it and stays. One restyled COLORS would
  // conflate the two and turn every dark chip on the board pale.
  const INK = QSTAGE ? 'var(--stg-ink,#e9edf4)' : COLORS.ink;
  const FADED = QSTAGE ? 'var(--stg-mute,#8b95a8)' : COLORS.faded;
  const SURF = QSTAGE ? 'var(--stg-surf,rgba(255,255,255,0.045))' : T.white;
  const SURF_B = QSTAGE ? 'var(--stg-line,rgba(255,255,255,0.11))' : COLORS.line;
  // THE ONE QUIZ ACCENT, read as the variable the root publishes rather
  // than as a literal, so it follows the light switch. See lib/quiz-stage.js.
  const QACC = QSTAGE ? 'var(--stg-acc)' : COLORS.ember;
  const ON_ACC = QSTAGE ? 'var(--stg-onramp,#08222e)' : T.white;
  const Cap = QSTAGE ? StageChrome : LoftCap;
  const quiz = useMemo(() => getQuiz(quizId), [quizId]);

  // ── Daily Challenge run context (?ch=<challengeId>&i=<stepIndex>) ──
  // A "run" walks the player through a challenge's three quizzes in order.
  // The run is ACTIVE only when the challenge resolves, the step index is a
  // valid slot, and this quiz is the quiz that belongs in that slot. When
  // inactive, every challenge value below is null/false and the page behaves
  // exactly as it does outside a challenge (no HUD, no advance controls).
  const chId = searchParams ? searchParams.get('ch') : null;
  const chIRaw = searchParams ? searchParams.get('i') : null;
  const chStepIdx = chIRaw != null && /^\d+$/.test(chIRaw) ? parseInt(chIRaw, 10) : null;
  const challenge = chId ? getChallenge(chId) : null;
  const chStepIds = challenge ? challengeQuizIds(challenge) : [];
  const chN = chStepIds.length;
  const runActive = !!(challenge && chStepIdx != null && chStepIdx >= 0 && chStepIdx < chN && chStepIds[chStepIdx] === quizId);
  const chNextStep = runActive ? chStepIdx + 1 : null;
  const chHasNext = runActive && chNextStep < chN;
  const chAccent = challenge ? (challenge.accent || 'Daily Challenge') : '';

  if (!quiz) {
    return (
      <div className={QSTAGE ? 'stage-page' : (undefined)}
        data-stage-theme={QSTAGE ? stageTheme : undefined}
        style={{ ...(QSTAGE ? QUIZ_ACC_VARS : null), minHeight: '100vh', position: 'relative', background: QSTAGE ? 'var(--stg-ground)' : COLORS.cream, color: QSTAGE ? 'var(--stg-ink,#e9edf4)' : COLORS.ink }}>
        {!QSTAGE && <Grain />}
        <div style={{ position: 'relative', zIndex: 2, padding: 48, textAlign: 'center' }}>
          <p style={{ fontFamily: SERIF, fontStyle: 'italic', color: FADED }}>That quiz seems to have wandered off.</p>
          <button onClick={() => router.push('/')} style={{ marginTop: 16, background: `var(--stg-surf2,${COLORS.ink})`, color: `var(--stg-ink,${COLORS.cream})`, border: 'none', padding: '10px 20px', fontFamily: MONO, fontSize: 11, letterSpacing: '0.2em', textTransform: 'uppercase', cursor: 'pointer' }}>Back home</button>
        </div>
        {!QSTAGE && <Footer />}
      </div>
    );
  }

  const isMobileVP = useIsMobile();
  const mobile = isMobileVP;
  // Duel context: if this quiz was opened from a duel (?duel=<token>),
  // auto-submit the player's score when they finish and show a return bar.
  const { duelToken, duelInfo, duelSubmitted } = useDuelContext(quizId, searchParams);
  const duelBanner = <DuelBanner token={duelToken} info={duelInfo} submitted={duelSubmitted} />;
  if (quiz.format === 'timed-mcq') {
    return (<>{duelBanner}<TimedMcqBoard quizId={quizId} mobile={mobile} /></>);
  }
  if (quiz.format === 'logic-grid') {
    return (<>{duelBanner}<LogicGridBoard quizId={quizId} mobile={mobile} /></>);
  }
  if (quiz.format === 'grid-fill') {
    return (<>{duelBanner}<GridFillBoard quizId={quizId} mobile={mobile} /></>);
  }
  if (quiz.format === 'place-map') {
    return (<>{duelBanner}<MapPlaceBoard quizId={quizId} mobile={mobile} /></>);
  }
  if (quiz.format === 'geo-aerial') {
    return (<>{duelBanner}<GeoAerialBoard quizId={quizId} mobile={mobile} /></>);
  }
  if (quiz.format === 'globe') {
    return (<>{duelBanner}<GlobePlaceBoard quizId={quizId} mobile={mobile} /></>);
  }
  if (quiz.format === 'survive-state') {
    return (<>{duelBanner}<SurviveStateBoard quizId={quizId} mobile={mobile} /></>);
  }
  if (quiz.format === 'logic-game') {
    return (<>{duelBanner}<LogicGameBoard quizId={quizId} mobile={mobile} /></>);
  }
  if (quiz.format === 'higher-lower') {
    return (<>{duelBanner}<HigherLowerBoard quizId={quizId} mobile={mobile} /></>);
  }
  if (quiz.format === 'closer') {
    return (<>{duelBanner}<CloserBoard quizId={quizId} mobile={mobile} /></>);
  }
  if (quiz.format === 'connections') {
    return (<>{duelBanner}<ConnectionsBoard quizId={quizId} mobile={mobile} /></>);
  }
  const answers = quiz.answers;
  const matched = quiz.format === 'matched';
  const nameKeys = useMemo(() => buildImplicitNameKeys(answers), [answers]);
  const mapMode = quiz.format === 'map';
  // Flag-prompt map mode (quiz.mapImgPrompt): the clue is the answer's img
  // (a flag) instead of its name, and every hint that would name the current
  // target is reworded so the flag stays the puzzle.
  const mapImgPrompt = mapMode && !!quiz.mapImgPrompt;
  const mapCapitalPrompt = mapMode && !!quiz.mapCapitalPrompt;
  const capOf = (t) => { const a = answers.find((x) => x && x.t === t); return (a && a.cap) || t; };
  const streetMapMode = quiz.format === 'street-map';
  const pairsMode = quiz.format === 'pairs';
  const bankMode = quiz.format === 'bank';
  const orderBankMode = quiz.format === 'order-bank';
  const typeMode = quiz.format === 'type-it' || quiz.format === 'careers';
  const careersMode = quiz.format === 'careers';
  const scrambleMode = quiz.format === 'word-scramble';
  const photoMode = quiz.format === 'photo';
  // Portrait photo quizzes (e.g. 3/4 headshots) render the image as a narrow
  // centered card; constrain the score/time/Play bar to the same column so it
  // sits directly above the photo instead of spanning the full page width.
  const PHOTO_COL = 420;
  const portraitPhoto = photoMode && (() => { const a = String(quiz.photoAspect || '').split('/'); return a.length === 2 && parseFloat(a[0]) < parseFloat(a[1]); })();
  const photoMatchMode = quiz.format === 'photo-match';
  const logosMode = quiz.format === 'logos' || quiz.format === 'posters' || quiz.format === 'images';
  const tallTiles = quiz.format === 'posters' || quiz.imgTall === true;
  const squareTiles = quiz.imgSquare === true;
  const tileMode = pairsMode || bankMode || typeMode || scrambleMode || photoMode || photoMatchMode || orderBankMode;
  // Tile-mode (bank/pairs) quizzes are answered one prompt per PAIR, so the score
  // denominator is the pair count, not the number of distinct answer tiles. A
  // many-to-one bank quiz (e.g. cocktail -> base spirit: 16 cocktails, 6 spirits)
  // otherwise mis-displays as 13/6 and drives the guesses-left counter negative.
  const total = tileMode && Array.isArray(quiz.pairs) ? quiz.pairs.length : answers.length;
  const ordered = matched && quiz.ordered === true;
  // Inline single-input formats (default name-them-all, logos/posters/images,
  // ordered-matched): the answer input + Play live in QuizClient itself, so
  // they can dock to the bottom thumb bar on mobile.
  const inlineInput = !mapMode && !tileMode && (!matched || ordered);
  const slideshow = matched && !ordered && quiz.slideshow === true;
  // The "reveal the answers" gate is only for quizzes with no companion list and
  // no map board (the plain "table" quizzes). List quizzes already send you to
  // the full ranking to see misses; map quizzes have no table to fill in.
  const canReveal = !quiz.listId;
  // Sibling parts of a multi-part series (Part 1, Part 2, ...), ordered by part
  // number, so we can surface "the rest of the series" on its own once a quiz is
  // finished. Same part-set detection as the recommendations below: a base quiz id
  // plus its numbered siblings, only when the stripped base is itself a real quiz
  // id (so date slugs like ...-2026-06-14 are never mis-grouped).
  const seriesParts = (() => {
    const stripped = quiz.id.replace(/-\d+$/, '');
    // Guard against mis-grouping date slugs: a base ending in a year/date (e.g.
    // 'weekly-business-quiz-2026-06') is never a series, and a 4-digit (>=1000)
    // trailing number is a year, not a part number. A series is otherwise any
    // set of quizzes sharing the same stripped base, whether part 1 is unnumbered
    // ('movie-taglines' + '-2') or numbered ('word-scramble-countries-1' + '-2').
    const m = quiz.id.match(/-(\d+)$/);
    const suffix = m ? parseInt(m[1], 10) : null;
    if ((suffix != null && suffix >= 1000) || /-\d{4}(-\d{2})*$/.test(stripped)) return [];
    const partNum = (id) => { const mm = id.match(/-(\d+)$/); return mm ? parseInt(mm[1], 10) : 1; };
    return QUIZZES
      .filter((x) => x.id !== quiz.id && !x.hideFromRelated && x.id.replace(/-\d+$/, '') === stripped)
      .sort((a, b) => partNum(a.id) - partNum(b.id));
  })();
  const seriesIds = new Set(seriesParts.map((x) => x.id));
  const moreLikeThis = (() => {
    const d = deptOf(quiz);
    // Other parts of a multi-part quiz (pt 2, pt 3...) ALWAYS lead, so they are
    // never crowded out of the eight shown. A part-set is a base quiz (e.g.
    // 'movie-taglines') plus its numbered siblings ('movie-taglines-2'); we only
    // treat the stripped base as a set when it is itself a real quiz id, so an
    // unrelated trailing number (e.g. a date slug) is never mis-grouped.
    // Leading parts of a multi-part series (reuses the same detection as
    // seriesParts so numbered-from-1 series like word-scramble-countries work).
    const parts = seriesParts;
    // Family tier: quizzes of the SAME KIND as this one (shared title signature),
    // so a distinct-per-title family (every "<Show> Character Match", the photo /
    // poster / cover sets, etc.) groups together even when each has its own category.
    // Shares one definition with the "Play next" picker in lib/quiz-similar.js.
    const family = familyQuizzes(quiz);
    const sameCat = QUIZZES.filter((x) => x.id !== quiz.id && !x.hideFromRelated && quiz.category && x.category === quiz.category);
    const sameDept = QUIZZES.filter((x) => x.id !== quiz.id && !x.hideFromRelated && deptOf(x) === d);
    const rest = QUIZZES.filter((x) => x.id !== quiz.id && !x.hideFromRelated);
    const seen = new Set();
    const out = [];
    for (const x of [...parts, ...family, ...sameCat, ...sameDept, ...rest]) {
      if (seen.has(x.id)) continue;
      // Keep Business-News-hub recap quizzes (daily market-moving, etc.) out of
      // the "Similar quizzes" rail unless this quiz is itself a business-news quiz.
      if (!allowInSimilar(quiz, x)) continue;
      seen.add(x.id); out.push(x);
    }
    return out.slice(0, 8);
  })();

  const [tab, setTab] = useState('play');
  const [found, setFound] = useState(() => new Array(total).fill(false));
  const [slideIdx, setSlideIdx] = useState(0);
  const [started, setStarted] = useState(false);
  const [ended, setEnded] = useState(false);
  const [time, setTime] = useState(quiz.timeLimit);
  const [hint, setHint] = useState('');
  const [hintBad, setHintBad] = useState(false);
  // Transient right/wrong verdict banner (mobile users miss the small hint line).
  const [cue, setCue] = useState(null);
  const cueTimer = useRef(null);
  const [guess, setGuess] = useState('');
  const orderRef = useRef(null);
  const [curName, setCurName] = useState(null);
  const [flash, setFlash] = useState(null);
  const [guessesLeft, setGuessesLeft] = useState(null);
  const [lastElapsed, setLastElapsed] = useState(null);
  const [pairsMatched, setPairsMatched] = useState(0);
  const [pairsErrors, setPairsErrors] = useState(0);
  const pairsMatchedRef = useRef(0);

  const [stats, setStats] = useState({ attempts: 0, best: 0, totalCorrect: 0 });
  const [board, setBoard] = useState({ plays: 0, best: null, topTime: null, leaderboard: [], leaderboardAll: [], leaderboardMobile: [], leaderboardFirst: [], leaderboards: {}, scoreDist: {} });
  const [lbPop, setLbPop] = useState('registered');
  const [lbFilter, setLbFilter] = useState('all');
  const [identity, setIdentity] = useState(null); // { username, email }

  // Join form
  const [jName, setJName] = useState('');
  const [jEmail, setJEmail] = useState('');
  const [joinMsg, setJoinMsg] = useState('');
  const [joinErr, setJoinErr] = useState(false);
  const [joinBusy, setJoinBusy] = useState(false);
  const [lastResultId, setLastResultId] = useState(null);
  const [eloBefore, setEloBefore] = useState(null);
  const [eloAfter, setEloAfter] = useState(null);
  const [claimOpen, setClaimOpen] = useState(false);
  const [claimBusy, setClaimBusy] = useState(false);
  const [claimMsg, setClaimMsg] = useState('');
  const [claimErr, setClaimErr] = useState(false);

  const [copied, setCopied] = useState(false);
  // Only promise credit to a viewer who actually has a referral code (see
  // DailyGamesGrid for the same rule).
  const [revealed, setRevealed] = useState(false); // non-list quizzes: misses shown after username gate

  // ── the Loft format ─────────────────────────────────────────────────────
  // Off by default; ?loft=1 turns it on for review. See app/useQuizLoft.js.
  const LOFT = useQuizLoft();
  // On a finish the board card turns over and the end card takes its place.
  // This is the flip BACK, for a player who pressed Reveal or Return to the
  // board: the front rejoins the flow and the card sits under it, which is the
  // same swap every daily makes (.loft-flip:not(.on) .loft-back in LoftCap).
  const [boardShown, setBoardShown] = useState(false);
  const [gameOverDismissed, setGameOverDismissed] = useState(false); // hides the Game Over overlay once acknowledged
  const [celebration, setCelebration] = useState(null); // null | 'small' (perfect, not top) | 'big' (all-time top score)

  // Daily Challenge runner: auto-advance countdown (seconds remaining) and a
  // one-shot guard so the just-finished quiz's outcome is written to the
  // run-state in localStorage exactly once per finish.
  const [chCountdown, setChCountdown] = useState(null); // null = not counting; else integer seconds
  const chWroteRef = useRef(false);
  const chAdvanceTimer = useRef(null);

  // Critique? modal (mirrors the list-page Request Review modal; routes to the
  // same /api/complaints pipeline -> admin Notices tab + daily digest email).
  const [qOpen, setQOpen] = useState(false);
  const [qMsg, setQMsg] = useState('');
  const [qName, setQName] = useState('');
  const [qEmail, setQEmail] = useState('');
  // A signed-in player's name + email prefill the reply fields, so a report
  // always comes back with somewhere to answer it. Still editable, still
  // optional: a guest sees empty fields exactly as before.
  useEffect(() => {
    const who = savedIdentity();
    if (who.username) setQName((v) => v || who.username);
    if (who.email) setQEmail((v) => v || who.email);
  }, []);
  const [qSent, setQSent] = useState(false);
  const [qBusy, setQBusy] = useState(false);

  const timerRef = useRef(null);
  const startRef = useRef(null);
  const inputRef = useRef(null);
  const slotRefs = useRef([]);
  useEffect(() => {
    if (!slideshow || !started || ended) return;
    const i = Math.min(Math.max(slideIdx, 0), answers.length - 1);
    if (found[i]) return;
    const el = slotRefs.current[i];
    if (el) el.focus();
  }, [slideIdx, started, ended, slideshow]);
  const viewedRef = useRef(false);
  const ribbonRef = useRef(null);
  // Keep a ref pointing at the LATEST endGame closure. The countdown
  // setInterval is created once in start(), so the endGame it captured
  // closes over the game-start state (found = all false). On a natural
  // timeout that stale closure posted score 0 at full time. endGame is a
  // hoisted function declaration, so this assignment (re-run every render)
  // always holds the current closure with fresh `found`.
  const endRef = useRef(null);
  endRef.current = endGame;
  const scoreRef = useRef(null);

  // Daily Challenge runner navigation + auto-advance. When the countdown is
  // active it ticks once a second; the final tick navigates to the next step
  // (or the summary page on the last quiz). The Next/Results button below can
  // fire goNextStep() immediately. The timer is cleared on unmount.
  function goNextStep() {
    if (chAdvanceTimer.current) { clearInterval(chAdvanceTimer.current); chAdvanceTimer.current = null; }
    if (!runActive) return;
    if (chHasNext) router.push(`/quiz/${chStepIds[chNextStep]}?ch=${encodeURIComponent(chId)}&i=${chNextStep}`);
    else router.push(`/challenge/${encodeURIComponent(chId)}?done=1`);
  }
  useEffect(() => {
    if (chCountdown == null || !runActive) return;
    if (chCountdown <= 0) { goNextStep(); return; }
    chAdvanceTimer.current = setInterval(() => {
      setChCountdown((c) => (c == null ? c : c - 1));
    }, 1000);
    return () => { if (chAdvanceTimer.current) { clearInterval(chAdvanceTimer.current); chAdvanceTimer.current = null; } };
  }, [chCountdown, runActive]);
  const [ribScroll, setRibScroll] = useState({ left: false, right: false });
  // Measured height of the frozen score/answer block, so each format's clue bar
  // (map Find, photo/bank/type prompt) can stick FLUSH right beneath it. The
  // score block pins to the top (top:0); the nav ribbon is not sticky.
  const [scoreH, setScoreH] = useState(150);
  // On-screen keyboard height, so the mobile bottom control bar rides above it.
  const [kbInset, setKbInset] = useState(0);
  const stickyTop = scoreH;
  useEffect(() => {
    const measure = () => { if (scoreRef.current) setScoreH(scoreRef.current.offsetHeight); };
    measure();
    window.addEventListener('resize', measure);
    return () => window.removeEventListener('resize', measure);
  }, [tab, started, ended, mapMode]);
  useEffect(() => {
    if (!(mobile === true && inlineInput)) { setKbInset(0); return; }
    const vv = window.visualViewport;
    if (!vv) return undefined;
    const onVV = () => setKbInset(Math.max(0, Math.round(window.innerHeight - vv.height - vv.offsetTop)));
    onVV();
    vv.addEventListener('resize', onVV);
    vv.addEventListener('scroll', onVV);
    return () => { vv.removeEventListener('resize', onVV); vv.removeEventListener('scroll', onVV); };
  }, [mobile, inlineInput]);
  useEffect(() => {
    const el = ribbonRef.current;
    if (!el) return undefined;
    const update = () => { const more = el.scrollWidth - el.clientWidth; setRibScroll({ left: el.scrollLeft > 2, right: more > 2 && el.scrollLeft < more - 2 }); };
    update();
    el.addEventListener('scroll', update, { passive: true });
    window.addEventListener('resize', update);
    return () => { el.removeEventListener('scroll', update); window.removeEventListener('resize', update); };
  }, []);

  // One-click retry: the Game Over "Retry with 1 click" button reloads the page
  // after leaving this sessionStorage flag, so the fresh mount auto-starts a new
  // round instead of waiting for the player to press Play again.
  useEffect(() => {
    if (typeof window === 'undefined') return undefined;
    let t;
    try {
      if (sessionStorage.getItem('sot_quiz_retry') === quizId) {
        sessionStorage.removeItem('sot_quiz_retry');
        t = setTimeout(() => { start(); }, 50);
      }
    } catch (e) { /* sessionStorage unavailable */ }
    return () => { if (t) clearTimeout(t); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const score = found.filter(Boolean).length;
  const dispScore = tileMode ? pairsMatched : score;
  // Outright #1 across ALL completed plays (anonymous included): the finished run
  // holds the best score AND ties/beats the fastest time recorded at that score
  // (this run is already counted in board.best/board.topTime, so equality = top).
  const isTopScore = ended && board.best != null && lastElapsed != null
    && dispScore === board.best && board.topTime != null && lastElapsed <= board.topTime;

  // Result description from REAL play data (no modeled probability): the top
  // score, a perfect run that just was not the fastest, or the actual share of
  // other completed attempts this run beat.
  const attemptsPct = pctAttemptsBeaten(board.scoreDist, board.plays, dispScore);
  const resultBlurb = isTopScore
    ? 'you are the top score'
    : dispScore === total
      ? 'perfect, but too slow for first'
      : (attemptsPct != null ? `you beat ${attemptsPct}% of attempts` : 'your first completed run');
  const resultLine = isTopScore
    ? 'You are the top score.'
    : dispScore === total
      ? 'Perfect, but too slow for first.'
      : (attemptsPct != null ? `You beat ${attemptsPct}% of attempts.` : 'Your first completed run.');
  const activeIdx = found.findIndex((x) => !x);
  const foundNamesSet = mapMode ? new Set(answers.filter((a, i) => found[i]).map((a) => a.t)) : null;

  function refreshBoard() {
    fetch(`/api/quiz/board?quizId=${encodeURIComponent(quizId)}`)
      .then((r) => r.json())
      .then((d) => { if (d && !d.error) setBoard({ plays: d.plays || 0, best: d.best != null ? Math.min(d.best, total) : null, topTime: d.topTime ?? null, leaderboard: d.leaderboard || [], leaderboardAll: d.leaderboardAll || [], leaderboardMobile: d.leaderboardMobile || [], leaderboardFirst: d.leaderboardFirst || [], leaderboards: d.leaderboards || {}, scoreDist: d.scoreDist || {} }); })
      .catch(() => {});
  }

  // `fresh` bypasses the 30s CDN cache on /api/quiz/me. Required for the
  // post-game read: it runs right after the result row is POSTed, and a cached
  // pre-game profile would show zero IQ earned and no trophy unlock.
  function fetchQuizMe(setter, { fresh = false } = {}) {
    try {
      const qs = new URLSearchParams();
      const anon = getAnonId();
      if (anon) qs.set('anonId', anon);
      let em = identity && identity.email ? identity.email : null;
      if (!em) { try { const j = JSON.parse(localStorage.getItem('sot_quiz_identity')); if (j && j.email) em = j.email; } catch (e) {} }
      if (em) qs.set('email', em);
      if (fresh) qs.set('fresh', '1');
      fetch(`/api/quiz/me?${qs.toString()}`).then((r) => r.json()).then((d) => { if (d && d.found) setter(d); }).catch(() => {});
    } catch (e) {}
  }

  useEffect(() => {
    setStats(loadStats(quizId));
    try {
      const id = JSON.parse(localStorage.getItem('sot_quiz_identity'));
      if (id && id.username) { setIdentity(id); setJName(id.username || ''); setJEmail(id.email || ''); }
    } catch {}
    refreshBoard();
    fetchQuizMe(setEloBefore);
    // Count one quiz-page view per load (admin analytics). Guarded so React's
    // dev double-invoke and any re-run don't double-count. Best-effort.
    if (!viewedRef.current) {
      viewedRef.current = true;
      fetch('/api/quiz/view', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ quizId }),
      }).catch(() => {});
    }
    return () => clearInterval(timerRef.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [quizId]);

  // Record an in-progress game if the player leaves before finishing.
  const abandon = useAbandonFlush(() => {
    if (!started || ended || !startRef.current) return null;
    const elapsed = Math.min(quiz.timeLimit, Math.round((Date.now() - startRef.current) / 1000));
    if (!elapsed) return null;
    const score = tileMode ? pairsMatchedRef.current : found.filter(Boolean).length;
    return { quizId, score, total, timeElapsed: elapsed, email: identity?.email || undefined, anonId: getAnonId(), isMobile: isMobileDevice() };
  });

  function endGame(win, foundOverride, scoreOverride) {
    if (ended) return;
    abandon.markFlushed();
    setEnded(true);
    clearInterval(timerRef.current);
    const finalScore = scoreOverride != null ? scoreOverride : tileMode ? pairsMatchedRef.current : (foundOverride || found).filter(Boolean).length;
    const elapsed = startRef.current ? Math.min(quiz.timeLimit, Math.round((Date.now() - startRef.current) / 1000)) : quiz.timeLimit;
    setLastElapsed(elapsed);
    // Daily Challenge runner: record this quiz's outcome into the shared
    // run-state (sot_chrun_<chId>) and kick off the auto-advance countdown.
    // Only when an actual challenge run is active for this exact quiz/step.
    if (runActive && !chWroteRef.current) {
      chWroteRef.current = true;
      try {
        const key = `sot_chrun_${chId}`;
        let run;
        try { run = JSON.parse(localStorage.getItem(key) || 'null'); } catch (e) { run = null; }
        if (!run || typeof run !== 'object') run = { ids: chStepIds, scores: {}, startedAt: Date.now() };
        if (!run.ids || !Array.isArray(run.ids)) run.ids = chStepIds;
        if (!run.scores || typeof run.scores !== 'object') run.scores = {};
        run.scores[quizId] = { score: finalScore, total, timeElapsed: elapsed };
        run.updatedAt = Date.now();
        localStorage.setItem(key, JSON.stringify(run));
      } catch (e) { /* localStorage unavailable; advance still works */ }
      setChCountdown(6);
    }
    setStats(recordResult(quizId, finalScore));
    setHint(win ? `Perfect — all ${total} named in ${fmtTime(elapsed)}!` : (quiz.strike ? `Struck out — ${finalScore}/${total} before the miss.` : `Time! You got ${finalScore}/${total}.`));
    setHintBad(!win);
    setGameOverDismissed(false);
    // Map games AND tile games (bank/type-it) keep the board on screen behind
    // the Game Over card so their answer grid is revealed; other formats still
    // jump to the results/leaderboard tab as before.
    // On mobile the default typed format keeps the player on the Play tab so the
    // fullscreen play popup stays open and shows the end-of-game summary inside
    // it; everywhere else still jumps to the results/leaderboard tab.
    // Stay on the Play tab at end so the inline results (with the full leaderboard) render there; no auto-jump to stats.

    // Record the completed game (makes play count + average real; attributes
    // to the leaderboard if signed up).
    fetch('/api/quiz/result', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ quizId, score: finalScore, total, timeElapsed: elapsed, email: identity?.email || undefined, anonId: getAnonId(), isMobile: isMobileDevice(), referrer: (typeof document !== 'undefined' ? document.referrer : '') }),
    })
      .then((r) => r.json())
      .then((d) => { if (d && !d.error) {
        const freshBest = d.best != null ? Math.min(d.best, total) : null;
        setBoard({ plays: d.plays || 0, best: freshBest, topTime: d.topTime ?? null, leaderboard: d.leaderboard || [], leaderboardAll: d.leaderboardAll || [], leaderboardMobile: d.leaderboardMobile || [], leaderboardFirst: d.leaderboardFirst || [], leaderboards: d.leaderboards || {}, scoreDist: d.scoreDist || {}, placement: d.placement ?? null });
        setLastResultId(d.resultId ?? null);
        const topNow = freshBest != null && finalScore === freshBest && d.topTime != null && elapsed <= d.topTime;
        if (topNow) setCelebration('big'); else if (finalScore === total) setCelebration('small');
      } })
      .then(() => fetchQuizMe(setEloAfter, { fresh: true }))
      .catch(() => {});
  }

  // Retroactively post the just-finished anonymous game to the leaderboard:
  // join by email, then attach THIS result row to the new identity.
  async function submitClaim() {
    setClaimErr(false);
    if (!jName.trim() || jName.trim().length > 15) { setClaimErr(true); setClaimMsg('Pick a display name (max 15 characters).'); return; }
    if (jEmail.trim() && !EMAIL_RE.test(jEmail.trim())) { setClaimErr(true); setClaimMsg('Enter a valid email or leave it blank.'); return; }
    setClaimBusy(true);
    try {
      const res = await fetch('/api/quiz/claim', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ quizId, resultId: lastResultId, username: jName.trim(), email: jEmail.trim() || undefined, anonId: getAnonId() }),
      });
      const d = await res.json();
      if (d.error) { setClaimErr(true); setClaimMsg(d.error); setClaimBusy(false); return; }
      const id = { username: d.username, email: d.email };
      try { localStorage.setItem('sot_quiz_identity', JSON.stringify(id)); } catch {}
      setIdentity(id);
      setBoard({ plays: d.plays || 0, best: d.best != null ? Math.min(d.best, total) : null, topTime: d.topTime ?? null, leaderboard: d.leaderboard || [], leaderboardAll: d.leaderboardAll || [], leaderboardMobile: d.leaderboardMobile || [], leaderboardFirst: d.leaderboardFirst || [], leaderboards: d.leaderboards || {}, scoreDist: d.scoreDist || {} });
      setClaimErr(false);
      setClaimOpen(false);
      if (canReveal) {
        setRevealed(true);
        setClaimMsg('Posted! The answers you missed are now filled in below, highlighted.');
        setTab('play');
      } else {
        setClaimMsg(`Posted! You're on the leaderboard below.`);
        setTab('play');
      }
    } catch (e) {
      setClaimErr(true);
      setClaimMsg('Could not post right now. Try again.');
    }
    setClaimBusy(false);
  }

  function start(force) {
    if (!force && (started || ended)) return;
    // On mobile the default typed format opens the fullscreen play popup the
    // moment Play is pressed. Commit started=true synchronously (flushSync) so
    // the popup + its input mount inside this same tap gesture; the focus() at
    // the end of start() then opens the on-screen keyboard (iOS only allows it
    // from within a user gesture, not after an async re-render).
    if (mobile === true) flushSync(() => setStarted(true));
    else setStarted(true);
    startRef.current = Date.now();
    if (mapMode) {
      const ord = shuffleIdx(total);
      orderRef.current = ord;
      setCurName(answers[ord[0]].t);
      setGuessesLeft(total);
      setHint(mapCapitalPrompt
        ? `Erase the country whose capital is ${capOf(answers[ord[0]].t)}. Click it to wipe it off the map. One wrong click ends the run, and there is no skipping.`
        : quiz.erase
        ? `Erase ${answers[ord[0]].t} — click it to wipe it off the map. One wrong click ends the run, and there is no skipping.`
        : quiz.suddenDeath
        ? `Find ${answers[ord[0]].t} — click it. One wrong click ends the game.`
        : `Find ${answers[ord[0]].t} — click it. You get ${total} guesses, one per country.`);
    } else if (bankMode) {
      setHint('Match the prompt to a tile in the bank below.');
    } else if (orderBankMode) {
      setHint(`Tap the ${quiz.noun || 'film'}s in order, oldest first. One wrong tap ends the run.`);
    } else if (pairsMode) {
      setHint('Pick a slogan, then the company it belongs to.');
    } else if (typeMode) {
      setHint('Type the answer for the clue above. Next skips it for now.');
    } else if (scrambleMode) {
      setHint('Unscramble the letters to name the country. Next skips it for now.');
    } else if (photoMode) {
      setHint(`Name the ${quiz.noun || 'city'} in the photo above. Next skips it for now.`);
    } else if (photoMatchMode) {
      setHint(`Tap the title tile that matches the ${quiz.noun || 'picture'} shown. Every tap spends a guess.`);
    } else {
      setHint(ordered ? (quiz.strike ? 'Go — name them in order, from the top. One wrong answer ends it.' : 'Go — answer in order, from the top.') : matched ? (quiz.noun ? `Go — type each ${quiz.noun}.` : "Go — name each year's winner.") : (quiz.strike ? 'Go — one wrong answer ends the run. Name them all.' : 'Go — name them all.'));
    }
    setHintBad(false);
    timerRef.current = setInterval(() => {
      setTime((t) => {
        if (t <= 1) { clearInterval(timerRef.current); (endRef.current || endGame)(false); return 0; }
        return t - 1;
      });
    }, 1000);
    if (inputRef.current) inputRef.current.focus();
  }

  // Restart in place: reset every per-round state atom to its initial value and
  // immediately begin a fresh game, with NO page reload. Backs the Game Over
  // "Play Again" button. start(true) bypasses the started/ended guard, and its
  // setStarted(true) wins over the setStarted(false) reset in the same batch.
  function restartRound() {
    clearInterval(timerRef.current);
    clearTimeout(cueTimer.current);
    if (chAdvanceTimer.current) { clearInterval(chAdvanceTimer.current); chAdvanceTimer.current = null; }
    chWroteRef.current = false;
    pairsMatchedRef.current = 0;
    orderRef.current = null;
    startRef.current = null;
    setEnded(false);
    setStarted(false);
    setGameOverDismissed(false);
    setFound(new Array(total).fill(false));
    setSlideIdx(0);
    setTime(quiz.timeLimit);
    setHint('');
    setHintBad(false);
    setCue(null);
    setGuess('');
    setCurName(null);
    setFlash(null);
    setGuessesLeft(null);
    setLastElapsed(null);
    setPairsMatched(0);
    setPairsErrors(0);
    setChCountdown(null);
    setCelebration(null);
    setRevealed(false);
    setBoardShown(false);
    setCopied(false);
    setTab('play');
    start(true);
  }

  // Flash a bold colored verdict and buzz the device so a right/wrong result
  // is unmissable on a phone, where the 12px hint line alone goes unnoticed.
  function fireCue(ok) {
    const id = Date.now() + Math.random();
    setCue({ ok, id });
    try { if (typeof navigator !== 'undefined' && navigator.vibrate) navigator.vibrate(ok ? 22 : [0, 38, 55, 38]); } catch (e) {}
    clearTimeout(cueTimer.current);
    cueTimer.current = setTimeout(() => setCue((c) => (c && c.id === id ? null : c)), 1000);
  }

  function checkGuess(raw) {
    const g = norm(raw);
    if (!g) return;
    for (let i = 0; i < answers.length; i++) {
      if (found[i]) continue;
      const a = answers[i];
      const hit = anyKey(g, a.keys) || anyKey(g, nameKeys[i]);
      const blocked = anyKey(g, a.anti);
      if (hit && !blocked) {
        const next = found.slice();
        next[i] = true;
        setFound(next);
        setHint(`Correct — ${a.t}`);
        setHintBad(false);
        fireCue(true);
        if (next.every(Boolean)) endGame(true, next);
        return;
      }
    }
    if (quiz.strike) {
      const tried = (raw || '').trim();
      setHint(`Struck out${tried ? ` — "${tried}"` : ''} is not in the top ${total}. Game over.`);
      setHintBad(true);
      fireCue(false);
      endGame(false);
      return;
    }
    setHint('Not on the list — try another.');
    setHintBad(true);
    fireCue(false);
  }

  function onKey(e) {
    if (e.key !== 'Enter' || !started || ended) return;
    checkGuess(e.target.value);
    setGuess('');
  }

  // After a slot is answered, move focus to the next still-blank slot input.
  // Done synchronously inside the user gesture so the mobile on-screen keyboard
  // stays up and the typing cursor does not reset (no re-tap needed).
  function focusNextSlot(fromIdx, foundArr) {
    const n = foundArr.length;
    for (let k = 1; k <= n; k++) {
      const j = (fromIdx + k) % n;
      if (!foundArr[j] && slotRefs.current[j]) { slotRefs.current[j].focus(); return; }
    }
  }
  // Matched mode: each slot has its own input that only accepts that slot's answer.
  function checkSlot(i, raw) {
    const g = norm(raw);
    if (!g || found[i]) return;
    const a = answers[i];
    const hit = anyKey(g, a.keys) || anyKey(g, nameKeys[i]);
    const blocked = anyKey(g, a.anti);
    if (hit && !blocked) {
      const next = found.slice();
      next[i] = true;
      setFound(next);
      setHint(`Correct — ${a.label != null ? a.label + ': ' : ''}${a.t}`);
      setHintBad(false);
      fireCue(true);
      if (next.every(Boolean)) endGame(true, next);
      else focusNextSlot(i, next);
    } else {
      setHintBad(true);
      fireCue(false);
      if (slideshow && quiz.strike) { setHint(`Struck out — ${a.label != null ? a.label + ': ' : ''}${a.t} was the answer.`); endGame(false); }
      else setHint(quiz.noun ? "Not quite. Try again." : "Not that year's winner. Try again.");
    }
  }
  function onSlotKey(i, e) {
    if (e.key !== 'Enter' || !started || ended) return;
    checkSlot(i, e.target.value);
    e.target.value = '';
  }

  // Ordered matched mode: ONE fixed input; slots must be answered in sequence.
  function checkOrdered(raw) {
    const g = norm(raw);
    if (!g) return;
    const first = found.findIndex((x) => !x);
    if (first < 0) return;
    const j = orderedGroupHit(g, answers, found, nameKeys);
    if (j >= 0) {
      const a = answers[j];
      const next = found.slice();
      next[j] = true;
      setFound(next);
      setHint(`Correct — ${a.label != null ? a.label + ': ' : ''}${a.t}`);
      setHintBad(false);
      fireCue(true);
      if (next.every(Boolean)) endGame(true, next);
    } else {
      const a = answers[first];
      fireCue(false);
      // Sudden-death ordered quiz (quiz.strike): a wrong Enter ends the run on
      // the spot. The live keystroke handler (autoOrdered) never strikes, so a
      // player typing toward the correct answer is safe until they hit Enter.
      if (quiz.strike) {
        setHint(`Struck out — ${a.label != null ? a.label + ': ' : ''}${a.t} was next.`);
        setHintBad(true);
        endGame(false);
        return;
      }
      setHint(`Not ${a.label != null ? 'a ' + a.label : 'the'} answer. Work down in order, try again.`);
      setHintBad(true);
    }
  }
  function onOrderedKey(e) {
    if (e.key !== 'Enter' || !started || ended) return;
    checkOrdered(e.target.value);
    setGuess('');
  }

  // Live auto-submit: accept a typed guess THE MOMENT it matches an unsolved
  // answer, with no Enter and no wrong-answer feedback while still typing. Enter
  // (the check* handlers) still works and is what surfaces a miss. Returns true
  // when a guess was accepted so the caller can clear the field.
  // quiz.holdPrefix: hold a live match while the typed text is still the
  // start of a LONGER unfound answer it does not match ("jackson" on the way
  // to "jacksonville"). Enter still accepts it, and finishing the longer name
  // lands on the longer answer. Opt-in per quiz so every other quiz keeps its
  // instant accept.
  function heldForLonger(g, i) {
    if (!quiz.holdPrefix) return false;
    for (let j = 0; j < answers.length; j++) {
      if (j === i || found[j]) continue;
      const b = answers[j];
      if (anyKey(g, b.keys) || anyKey(g, nameKeys[j])) continue;
      const forms = [baseName(b.t), ...(b.keys || []).map(norm)];
      if (forms.some((f) => f.length > g.length && f.startsWith(g))) return true;
    }
    return false;
  }
  function autoName(raw) {
    const g = norm(raw);
    if (!g) return false;
    for (let i = 0; i < answers.length; i++) {
      if (found[i]) continue;
      const a = answers[i];
      if ((anyKey(g, a.keys) || anyKey(g, nameKeys[i])) && !anyKey(g, a.anti)) {
        if (heldForLonger(g, i)) return false;
        const next = found.slice();
        next[i] = true;
        setFound(next);
        setHint(`Correct — ${a.t}`);
        setHintBad(false);
        fireCue(true);
        if (next.every(Boolean)) endGame(true, next);
        return true;
      }
    }
    return false;
  }
  function autoOrdered(raw) {
    const g = norm(raw);
    if (!g) return false;
    const first = found.findIndex((x) => !x);
    if (first < 0) return false;
    const j = orderedGroupHit(g, answers, found, nameKeys);
    if (j >= 0) {
      const a = answers[j];
      const next = found.slice();
      next[j] = true;
      setFound(next);
      setHint(`Correct — ${a.label != null ? a.label + ': ' : ''}${a.t}`);
      setHintBad(false);
      fireCue(true);
      if (next.every(Boolean)) endGame(true, next);
      return true;
    }
    // Sudden-death ordered quiz (quiz.strike): end the run the instant the typed
    // text can no longer reach ANY unfound slot in the current same-label group
    // (a wrong character), without waiting for Enter. Non-strike ordered
    // quizzes never strike here.
    if (quiz.strike) {
      const a = answers[first];
      const curLabel = a.label;
      let groupKeys = [];
      for (let k = first; k < answers.length; k++) {
        if (answers[k].label !== curLabel) break;
        if (found[k]) continue;
        groupKeys = groupKeys.concat(answers[k].keys || [], nameKeys[k] || []);
      }
      if (!couldReach(g, groupKeys)) {
        fireCue(false);
        setHint(`Struck out — ${a.label != null ? a.label + ': ' : ''}${a.t} was next.`);
        setHintBad(true);
        endGame(false);
        return true;
      }
    }
    return false;
  }
  function autoSlot(i, raw) {
    const g = norm(raw);
    if (!g || found[i]) return false;
    const a = answers[i];
    if ((anyKey(g, a.keys) || anyKey(g, nameKeys[i])) && !anyKey(g, a.anti)) {
      const next = found.slice();
      next[i] = true;
      setFound(next);
      setHint(`Correct — ${a.label != null ? a.label + ': ' : ''}${a.t}`);
      setHintBad(false);
      fireCue(true);
      if (next.every(Boolean)) endGame(true, next);
      else focusNextSlot(i, next);
      return true;
    }
    return false;
  }

  function pickCountry(name) {
    if (!started || ended || !mapMode) return;
    const i = answers.findIndex((a) => a.t === name);
    if (i < 0) return;
    // Clicking a country you've already named is harmless and free.
    if (found[i]) {
      if (!quiz.erase && name !== curName) { setFlash({ name, ok: false }); setTimeout(() => setFlash((f) => (f && f.name === name ? null : f)), 400); }
      return;
    }
    // Every genuine pick (right OR wrong) spends one guess from the budget,
    // which equals the number of countries. This makes a perfect game require
    // one correct click per country and stops spam-clicking to 100%.
    const left = (guessesLeft == null ? total : guessesLeft) - 1;
    setGuessesLeft(left);
    if (name === curName) {
      const next = found.slice();
      next[i] = true;
      setFound(next);
      setFlash({ name, ok: true });
      fireCue(true);
      setTimeout(() => setFlash((f) => (f && f.name === name ? null : f)), 400);
      const ord = orderRef.current || [];
      const remaining = ord.filter((j) => !next[j]);
      if (!remaining.length) { setHint(`Correct — ${name}. That's all of them.`); setHintBad(false); setCurName(null); endGame(true, next); return; }
      if (left <= 0) { setHint(`Correct — ${name}. That was your last guess.`); setHintBad(false); setCurName(null); endGame(false, next); return; }
      const nn = answers[remaining[0]].t;
      setCurName(nn);
      setHint(mapImgPrompt
        ? `Correct — ${name}. ${left} ${left === 1 ? 'guess' : 'guesses'} left. Next flag is up.`
        : mapCapitalPrompt
        ? `Erased ${name}. ${left} to go. Next capital: ${capOf(nn)}.`
        : quiz.erase
        ? `Erased ${name}. ${left} to go. Now erase ${nn}.`
        : quiz.suddenDeath
        ? `Correct — ${name}. ${left} to go. Now find ${nn}.`
        : `Correct — ${name}. ${left} ${left === 1 ? 'guess' : 'guesses'} left. Now find ${nn}.`);
      setHintBad(false);
    } else {
      setFlash({ name, ok: false });
      setTimeout(() => setFlash((f) => (f && f.name === name ? null : f)), 400);
      fireCue(false);
      // Sudden-death map: one wrong click ends the run on the spot.
      if (quiz.suddenDeath) { setHint(mapImgPrompt ? `That was ${name} — not this flag's country. Game over.` : mapCapitalPrompt ? `That was ${name}, not the country whose capital is ${capOf(curName)}. Game over.` : `That was ${name}, not ${curName}. One wrong click ends it — game over.`); setHintBad(true); endGame(false); return; }
      if (left <= 0) { setHint(mapImgPrompt ? `That was ${name} — not this flag's country. Out of guesses.` : `That was ${name}, not ${curName}. Out of guesses.`); setHintBad(true); endGame(false); return; }
      setHint(mapImgPrompt ? `That was ${name} — not this flag's country. ${left} ${left === 1 ? 'guess' : 'guesses'} left.` : `Not ${curName} — try again. ${left} ${left === 1 ? 'guess' : 'guesses'} left.`);
      setHintBad(true);
    }
  }

  // Skip the current country: rotate it to the back of the queue (it stays
  // unfound, so it comes back around) and advance to the next one. Lets a
  // player move on when they can't spot a country on the map.
  function skipCountry() {
    if (!started || ended || !mapMode || !curName) return;
    const curIdx = answers.findIndex((a) => a.t === curName);
    if (curIdx < 0) return;
    const ord = orderRef.current || [];
    const remaining = ord.filter((j) => !found[j]);
    if (remaining.length <= 1) {
      setHint(mapImgPrompt ? 'The last flag remains — find its country on the map.' : `${curName} is the last one — find it on the map.`);
      setHintBad(false);
      return;
    }
    const newOrd = ord.filter((j) => j !== curIdx).concat(curIdx);
    orderRef.current = newOrd;
    const nn = answers[newOrd.filter((j) => !found[j])[0]].t;
    setCurName(nn);
    setHint(mapImgPrompt ? `Flag skipped — it comes back around later.` : `Skipped ${curName} — you'll come back to it. Now find ${nn}.`);
    setHintBad(false);
  }

  function onPairMatch(companyIndex, matchedCount, company, slogan) {
    pairsMatchedRef.current = matchedCount;
    setPairsMatched(matchedCount);
    setHint(`Match — ${company}: “${slogan}”.`);
    setHintBad(false);
  }
  function onPairError(errorCount, company) {
    setPairsErrors(errorCount);
    setHint(`Not it. ${company} is struck out for good.`);
    setHintBad(true);
  }
  function onPairHint(msg, bad) {
    setHint(msg);
    setHintBad(!!bad);
  }
  function onPairEnd(win, matchedCount) {
    pairsMatchedRef.current = matchedCount;
    setPairsMatched(matchedCount);
    endGame(win, null, matchedCount);
  }
  function onBankWrong(errorCount, prompt) {
    setPairsErrors(errorCount);
    setHint(`Not the match for ${prompt}. That cost you a guess.`);
    setHintBad(true);
  }


  async function submitQuestion() {
    if (qBusy) return;
    setQBusy(true);
    try {
      // Reuse the list complaints pipeline. Prefixing the title with [Quiz]
      // lets the admin Notices tab and digest distinguish quiz questions and
      // link them to /quiz/{id}.
      await fetch('/api/complaints', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ listId: quiz.id, listTitle: `[Quiz] ${quiz.title}`, message: qMsg.trim(), name: qName.trim(), email: qEmail.trim() }),
      });
    } catch (e) {
      // swallow - we still acknowledge the question to the reader
    }
    setQSent(true);
    setQBusy(false);
  }

  const clock = fmtTime(time);
  const clockMax = fmtTime(quiz.timeLimit);
  // Covered-board intro (pre-start): every format shows the same idle card with
  // Start / Challenge Someone / Leaderboard before the board is revealed
  // (owner rule, 2026-07-02). The board itself renders only once started.
  const introHeadline = mapMode || streetMapMode ? 'Find them all.'
    : (bankMode || pairsMode || photoMatchMode || orderBankMode) ? 'Match them all.'
    : scrambleMode ? 'Unscramble them all.'
    : 'Name them all.';
  const introMech = mapMode ? (mapImgPrompt ? 'A flag appears; click its country on the map.' : mapCapitalPrompt ? 'A capital appears; click its country on the map.' : 'A name appears; click it on the map.')
    : streetMapMode ? 'A name appears; find and click it on the map.'
    : bankMode ? 'One clue at a time; tap the matching tile in the bank below.'
    : pairsMode ? 'Match the two columns, one pick at a time.'
    : photoMatchMode ? 'Tap the photo that matches each prompt.'
    : orderBankMode ? 'Tap the tiles into the right order.'
    : scrambleMode ? 'Unscramble each one; it locks in the moment the letters match.'
    : photoMode ? `Type the ${quiz.noun || 'answer'} for each photo; correct answers lock in the moment they match, no Enter needed.`
    : (matched && !ordered) ? `Type each ${quiz.noun || 'answer'} into its slot; correct answers lock in the moment they match, no Enter needed.`
    : ordered ? 'The answers must come in order; the highlighted slot shows what is next, and a correct answer locks in the moment it matches.'
    : typeMode ? `One clue at a time; type the ${quiz.noun || 'answer'}. Correct answers lock in the moment they match, no Enter needed.`
    : `Type ${/^[aeiou]/.test(quiz.noun || '') ? 'an' : 'a'} ${quiz.noun || 'answer'} and it locks in the moment it matches, no Enter needed.`;
  const introBody = `${total} ${total === 1 ? 'answer' : 'answers'}, ${clockMax} on the clock. ${introMech} Solve as many as you can; time is the tiebreak.`;
  const shareUrl = withRef(typeof window !== 'undefined' ? window.location.href : `https://mindloftdaily.com/quiz/${quiz.id}`);
  const sharePct = total ? Math.round((dispScore / total) * 100) : 0;
  const resultMsg = ended ? `I scored ${dispScore}/${total} on "${quiz.title}". Can you beat me?` : `Can you beat my score on "${quiz.title}"?`;
  const resultImgUrl = `https://mindloftdaily.com/quiz/${quiz.id}/result-image?s=${dispScore}&t=${total}&p=${attemptsPct || 0}`;
  const promoImgUrl = `https://mindloftdaily.com/quiz/${quiz.id}/share-image`;
  function share() {
    if (navigator.share) {
      navigator.share({ title: quiz.title, text: resultMsg, url: shareUrl }).catch(() => {});
    } else {
      navigator.clipboard?.writeText(`${resultMsg} ${shareUrl}`).then(() => { setCopied(true); setTimeout(() => setCopied(false), 1800); });
    }
  }
  function platformShareUrl(kind) {
    const u = encodeURIComponent(shareUrl);
    const t = encodeURIComponent(resultMsg);
    if (kind === 'x') return `https://twitter.com/intent/tweet?text=${t}&url=${u}`;
    if (kind === 'reddit') return `https://www.reddit.com/submit?url=${u}&title=${t}`;
    if (kind === 'facebook') return `https://www.facebook.com/sharer/sharer.php?u=${u}`;
    if (kind === 'whatsapp') return `https://api.whatsapp.com/send?text=${t}%20${u}`;
    return shareUrl;
  }
  function openShare(kind) { try { window.open(platformShareUrl(kind), '_blank', 'noopener,noreferrer'); } catch (e) {} }
  function copyResult() { if (notifyShareCredit(`${resultMsg}\n${shareUrl}`)) return; try { navigator.clipboard?.writeText(`${resultMsg}\n${shareUrl}`).then(() => { setCopied(true); setTimeout(() => setCopied(false), 1800); }); } catch (e) {} }
  async function downloadResultImage() { try { const r = await fetch(resultImgUrl); const b = await r.blob(); const u = URL.createObjectURL(b); const a = document.createElement('a'); a.href = u; a.download = `source-of-truths-${quiz.id}-score.png`; document.body.appendChild(a); a.click(); a.remove(); URL.revokeObjectURL(u); } catch (e) {} }
  async function downloadPromoImage() { try { const r = await fetch(promoImgUrl); const b = await r.blob(); const u = URL.createObjectURL(b); const a = document.createElement('a'); a.href = u; a.download = `source-of-truths-${quiz.id}.png`; document.body.appendChild(a); a.click(); a.remove(); URL.revokeObjectURL(u); } catch (e) {} }

  function chip(key, label, icon) {
    const active = tab === key;
    return (
      <button
        onClick={() => setTab(key)}
        style={{ flex: '1 0 auto', justifyContent: 'center', background: active ? `var(--stg-surf,${T.white})` : 'transparent', color: active ? `var(--stg-ink,${COLORS.ink})` : `var(--stg-mute,${COLORS.faded})`, border: 'none', borderRadius: 7, padding: '9px 14px', whiteSpace: 'nowrap', fontFamily: SANS, fontSize: 13, fontWeight: active ? 700 : 500, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, boxShadow: active ? '0 1px 2px rgba(20,22,28,0.06)' : 'none' }}
      >
        {icon}
        {label}
      </button>
    );
  }

  const bestLabel = board.best != null ? board.best : '—';
  // Leaderboard ranks with ties: equal score AND time share a rank (and are
  // ordered alphabetically by the API), so they display as a tie (T#).
  const lb = pickLb(board, lbPop, lbFilter);
  const lbRanks = [];
  const lbTied = [];
  for (let i = 0; i < lb.length; i++) {
    const prevSame = i > 0 && lb[i].score === lb[i - 1].score && lb[i].timeElapsed === lb[i - 1].timeElapsed;
    lbRanks[i] = prevSame ? lbRanks[i - 1] : i + 1;
  }
  for (let i = 0; i < lb.length; i++) {
    const prevSame = i > 0 && lb[i].score === lb[i - 1].score && lb[i].timeElapsed === lb[i - 1].timeElapsed;
    const nextSame = i < lb.length - 1 && lb[i].score === lb[i + 1].score && lb[i].timeElapsed === lb[i + 1].timeElapsed;
    lbTied[i] = prevSame || nextSame;
  }
  const fullLeaderboard = (
    <>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
                <div style={{ fontFamily: MONO, fontSize: 11, letterSpacing: '0.16em', textTransform: 'uppercase', color: FADED }}>Leaderboard</div>
                <div style={{ fontFamily: MONO, fontSize: 11, letterSpacing: '0.08em', color: FADED }}>{bestLabel} best score · <Count value={board.plays} /> {board.plays === 1 ? 'play' : 'plays'}</div>
              </div>

              {board.plays > 0 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 14, width: 'fit-content' }}>
                  <div style={{ display: 'inline-flex', gap: 4, borderRadius: 10, background: `var(--stg-surf2,${T.surfaceAlt})`, padding: 4, width: 'fit-content' }}>
                    {LB_POPS.map(([k, label]) => {
                      const on = lbPop === k;
                      return (
                        <button key={k} onClick={() => setLbPop(k)} style={{ padding: '6px 14px', background: on ? `var(--stg-surf,${T.white})` : 'transparent', color: on ? `var(--stg-ink,${COLORS.ink})` : `var(--stg-mute,${COLORS.soft})`, border: 'none', borderRadius: 7, fontFamily: SANS, fontSize: 11, letterSpacing: '0.04em', fontWeight: 700, cursor: 'pointer', boxShadow: on ? '0 1px 2px rgba(20,22,28,0.06)' : 'none' }}>{label}</button>
                      );
                    })}
                  </div>
                  <div style={{ display: 'inline-flex', gap: 4, borderRadius: 10, background: `var(--stg-surf2,${T.surfaceAlt})`, padding: 4, width: 'fit-content' }}>
                    {LB_FILTERS.map(([k, label]) => {
                      const on = lbFilter === k;
                      return (
                        <button key={k} onClick={() => setLbFilter(k)} style={{ padding: '6px 14px', background: on ? `var(--stg-surf,${T.white})` : 'transparent', color: on ? `var(--stg-ink,${COLORS.ink})` : `var(--stg-mute,${COLORS.soft})`, border: 'none', borderRadius: 7, fontFamily: SANS, fontSize: 11, letterSpacing: '0.04em', fontWeight: 700, cursor: 'pointer', boxShadow: on ? '0 1px 2px rgba(20,22,28,0.06)' : 'none' }}>{label}</button>
                      );
                    })}
                  </div>
                </div>
              )}

              {lb.length === 0 ? (
                <p style={{ fontFamily: SERIF, fontStyle: 'italic', fontSize: 16, color: FADED }}>
                  {lbEmptyNote(lbFilter) || <>No one has posted a score yet. <button onClick={() => setTab('join')} style={{ background: 'none', border: 'none', padding: 0, color: `var(--stg-acc-ink,${COLORS.ember})`, font: 'inherit', fontStyle: 'italic', textDecoration: 'underline', cursor: 'pointer' }}>Join the leaderboard</button> and be first.</>}
                </p>
              ) : (
                <div>
                  <div style={{ display: 'grid', gridTemplateColumns: '40px 1fr 76px 64px', gap: 8, padding: '0 14px 8px', fontFamily: MONO, fontSize: 10, letterSpacing: '0.12em', textTransform: 'uppercase', color: FADED }}>
                    <span>#</span><span>Display Name</span><span style={{ textAlign: 'right' }}>Correct</span><span style={{ textAlign: 'right' }}>Time</span>
                  </div>
                  {lb.map((row, i) => {
                    const mine = identity && row.username === identity.username;
                    return (
                      <div key={i} style={{ display: 'grid', gridTemplateColumns: '40px 1fr 76px 64px', gap: 8, alignItems: 'center', padding: '11px 14px', marginBottom: 6, background: mine ? `var(--stg-acc-tint,${COLORS.accSoft})` : `var(--stg-surf,${T.white})`, borderRadius: 10, border: `1px solid ${mine ? `var(--stg-acc,${COLORS.accBorder})` : `var(--stg-line,${COLORS.line})`}` }}>
                        <span style={{ fontFamily: SERIF, fontWeight: 800, fontSize: 18, color: lbRanks[i] <= 3 ? COLORS.ember : `var(--stg-mute,${COLORS.faded})` }}>{lbTied[i] ? `T${lbRanks[i]}` : lbRanks[i]}</span>
                        <span style={{ minWidth: 0, display: 'flex', flexDirection: 'column', gap: 2 }}>
                          <span style={{ fontFamily: SERIF, fontSize: 17, fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{row.userKey ? <a href={`/quizzes/hub?player=${encodeURIComponent(row.userKey)}`} style={{ color: 'inherit', textDecoration: 'none', borderBottom: `1px dotted ${COLORS.faded}88`, cursor: 'pointer' }}>{row.username}</a> : row.username}{mine ? ' (you)' : ''}{row.tryNum ? <span style={{ fontFamily: MONO, fontSize: 11, fontWeight: 400, color: FADED, marginLeft: 6 }}>{row.tryNum > 1 ? '(retried)' : '(1st Try)'}</span> : ''}</span>
                          {row.playedAt ? <span style={{ fontFamily: MONO, fontSize: 10.5, color: FADED }}>{fmtWhen(row.playedAt)}</span> : null}
                        </span>
                        <span style={{ fontFamily: MONO, fontSize: 14, textAlign: 'right' }}>{row.score}/{total}</span>
                        <span style={{ fontFamily: MONO, fontSize: 14, textAlign: 'right', color: FADED }}>{fmtTime(row.timeElapsed)}</span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
    </>
  );

  const similarList = ended ? moreLikeThis.filter((rq) => !seriesIds.has(rq.id)) : moreLikeThis;
  const similarQuizzes = similarList.length > 0 ? (
    <div style={{ marginTop: 24, paddingTop: 20, borderTop: `1px solid var(--stg-line,${COLORS.line})` }}>
      <div style={{ fontFamily: MONO, fontSize: 11, letterSpacing: '0.16em', textTransform: 'uppercase', color: `var(--stg-acc-ink,${COLORS.ember})`, marginBottom: 16 }}>Similar quizzes</div>
      <SimilarQuizTiles items={similarList} />
    </div>
  ) : null;

  // Column layout. An EXPLICIT quiz.columnSplit is a fixed reference grid (e.g.
  // a periodic-table block) and is NEVER reordered. Everything else long enough
  // auto-wraps into balanced columns purely for fit, and those columns DO cycle
  // (answered items sink to the bottom) exactly like a single column.
  // quiz.singleColumn forces one column. See the cycling note in CLAUDE.md.
  const explicitCols = (() => {
    if (quiz.singleColumn) return null;
    const cs = quiz.columnSplit;
    if (Array.isArray(cs) && cs.reduce((acc, n) => acc + n, 0) === answers.length) {
      const cols = []; let gi = 0;
      for (const n of cs) { const r = []; for (let k = 0; k < n; k++) r.push(gi++); cols.push(r); }
      return cols;
    }
    return null;
  })();
  const colSplit = explicitCols; // fixed-grid render path uses this
  // Answer rows render at a COMPACT scale (small padding/type) for EVERY text
  // list, not just long ones, so the tiles stay tight and many fit on a phone
  // screen, and short lists still break into multiple columns. Only the text-row
  // path compacts; map/tile/image boards manage their own density. `rz` carries
  // the per-row dimensions.
  const compactList = !mapMode && !tileMode && !logosMode;
  const rz = compactList
    ? { pad: '3px 8px', gap: 8, mb: 4, rank: 12, rankW: 18, name: 12, dash: 10, check: 13 }
    : { pad: '13px 16px', gap: 16, mb: 8, rank: 22, rankW: 30, name: 19, dash: 13, check: 17 };
  const autoColCount = (() => {
    if (quiz.singleColumn || explicitCols) return 1;
    // These formats render their own board, not the answer list.
    if (mapMode || pairsMode || bankMode || typeMode || scrambleMode || photoMode || photoMatchMode) return 1;
    const n = answers.length;
    const maxLen = answers.reduce((m, a) => {
      const labelLen = a && a.label != null ? String(a.label).length + 2 : 0;
      return Math.max(m, String((a && a.t) || '').length + labelLen);
    }, 0);
    let widthCap;
    if (compactList) {
      // Tiny rows: pack as many columns as the answer width allows.
      // Readability is intentionally deprioritized so far more answers fit.
      if (maxLen <= 12) widthCap = 7;
      else if (maxLen <= 20) widthCap = 6;
      else if (maxLen <= 34) widthCap = 5;
      else if (maxLen <= 46) widthCap = 4;
      else widthCap = 3;
    } else {
      if (maxLen <= 14) widthCap = 4;
      else if (maxLen <= 28) widthCap = 3;
      else if (maxLen <= 40) widthCap = 2;
      else widthCap = 1;
    }
    // ~5 rows per column when compact so even a 10-answer quiz splits into 2-3
    // columns (denser, more fits on a phone); else ~6.
    const rowsTarget = compactList ? 5 : 6;
    let cols = Math.max(1, Math.min(widthCap, Math.floor(n / rowsTarget)));
    const per = Math.ceil(n / Math.max(1, cols));
    cols = Math.ceil(n / per); // trim a near-empty trailing column
    return Math.max(1, Math.min(cols, 5)); // cap: only ~5 columns of 200px fit the page width; more wrap a column to full width
  })();
  const asOfRaw = quiz.publishedDate || (quiz.publishedAt ? quiz.publishedAt.slice(0, 10) : null);
  const asOfLabel = asOfRaw ? new Date(asOfRaw + 'T12:00:00Z').toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric', timeZone: 'UTC' }) : null;

  // ── Solved-item cycling ──────────────────────────────────────────────────
  // Whether answered items slide to the bottom so the next unanswered one stays
  // near the input bar. DEFAULT IS OFF: tiles stay in their original (usually
  // ranked) position, so a player watches the list fill in by rank. The only
  // formats that move by default are the independent-answer IMAGE grids
  // (logos / posters / album covers), whose order carries no meaning. Any quiz
  // can override the default with quiz.moveTiles (true forces movement, false
  // pins the order). matched/ordered per-slot, map, and tile boards always keep
  // their fixed order, and multi-column (colSplit) layouts are left alone. Each
  // item keeps its own rank number because the row/tile is always handed its
  // ORIGINAL index. See the cycling note in CLAUDE.md.
  const moveTilesPref = quiz.moveTiles != null ? quiz.moveTiles : logosMode;
  const cyclingOn = started && !ended && !matched && !mapMode && !tileMode && !explicitCols && moveTilesPref;
  const displayOrder = useMemo(() => {
    const base = answers.map((_, i) => i);
    if (!cyclingOn) return base;
    return [...base.filter((i) => !found[i]), ...base.filter((i) => found[i])];
  }, [answers, cyclingOn, found]);

  // FLIP: when the order changes, slide each row/tile from its old position to
  // its new one instead of jumping. Cheap (a handful of nodes) and only fires
  // when the solved set, play state, or active tab changes.
  const flipEls = useRef(new Map());   // originalIndex -> element
  const flipPrev = useRef(new Map());  // originalIndex -> { top, left }
  const setFlipRef = (i) => (el) => { if (el) flipEls.current.set(i, el); else flipEls.current.delete(i); };
  useLayoutEffect(() => {
    if (tab !== 'play') { flipPrev.current = new Map(); return; }
    const els = flipEls.current;
    const next = new Map();
    els.forEach((el, idx) => { if (el && el.isConnected) { const r = el.getBoundingClientRect(); next.set(idx, { top: r.top, left: r.left }); } });
    const prev = flipPrev.current;
    next.forEach((np, idx) => {
      const op = prev.get(idx);
      if (!op) return;
      const dx = op.left - np.left, dy = op.top - np.top;
      if (Math.abs(dx) < 0.5 && Math.abs(dy) < 0.5) return;
      const el = els.get(idx);
      if (!el) return;
      el.style.transition = 'none';
      el.style.transform = `translate(${dx}px, ${dy}px)`;
      requestAnimationFrame(() => {
        el.style.transition = 'transform .32s cubic-bezier(.22,.61,.36,1)';
        el.style.transform = '';
      });
    });
    flipPrev.current = next;
  }, [found, started, ended, tab]);

  const eloDept = deptOf(quiz);
  const eloDeptLabel = DEPT_LABEL[eloDept] || 'Category';
  // "Play next" pick shown by title on the Game Over overlay's Play Similar
  // button (recomputed when the round ends so a just-played quiz drops out).
  const nextMeta = useMemo(() => { try { return nextQuizMeta(quiz); } catch (e) { return null; } }, [quiz, ended]);
  // The shared IQ end card. `placement` is injected at the render site below,
  // where this quiz's finishing rank is known; the boards that render through
  // QuizResultModal get the same injection there. hideCategory was dropped in the
  // 2026-07-31 redesign: the category rank is now one of the three rank tiles, and
  // every quiz shows the same three.
  const eloPanel = <QuizStandings eloAfter={eloAfter} eloBefore={eloBefore} eloDept={eloDept} eloDeptLabel={eloDeptLabel} quiz={quiz} board={board} identity={identity} quizTotal={total} />;

  // Mobile "app" play mode: once a game is in progress on a phone, collapse the non-essential chrome (blurb, leaderboard strip,
  // full-size title) so the answer board fills the screen. Desktop and the
  // pre-game state are untouched.
  const mAppPlay = mobile === true && tab === 'play' && started && !ended;
  // Default name-them-all typed format (single top input; ranked/grid answer
  // list). Excludes map, the tile/bank boards, image grids, slideshow, and the
  // per-slot matched grids, which keep their own layout in phase 1.
  const defaultTyped = !mapMode && !tileMode && !matched && !logosMode && !slideshow;
  // Formats whose live play moves into the mobile fullscreen popup. Phase 1: the
  // default typed name-them-all. Phase 2: the click-the-country map (format
  // 'map', including the no-outline regional maps like asia-no-outline). The
  // Every format QuizClient itself renders uses the mobile popup. The
  // standalone boards (timed-mcq / logic-grid / grid-fill / place-map /
  // geo-aerial / globe) early-return above and wrap their own play surface.
  const overlayFormat = true;
  // Mobile fullscreen play popup: open from Play press until the game ends. The
  // MOMENT the round is over it closes and the player drops to the shared inline
  // results screen (score, leaderboard, actions) in normal page flow, the same
  // one desktop shows. Gameplay itself is unchanged; only the post-end surface
  // moved out of the overlay. Desktop never opens it; the play surface stays inline.
  const mPlayOverlay = mobile === true && overlayFormat && started && tab === 'play' && !ended;
  // Mobile thumb-zone: dock the input + Play to a fixed bottom bar during play
  // on the inline-input formats. HUD (score/timer/progress) stays pinned up top.
  const bottomDock = mobile === true && inlineInput && !ended;
  // Map format: dock the Find/Skip clue bar to the bottom thumb zone on mobile.
  // Inside the mobile play popup the Find/Skip clue sits ABOVE the map (its
  // sticky in-flow position), not bottom-docked; bottom-docking is only for the
  // inline (non-popup) mobile layout.
  const mapBarDock = mobile === true && mapMode && started && !ended && !mPlayOverlay;
  const mapBarStyle = mapBarDock
    ? { position: 'fixed', left: 0, right: 0, bottom: 0, zIndex: 40, display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 12, background: `var(--stg-raise,${COLORS.ink})`, color: COLORS.cream, borderTop: `1px solid var(--stg-line,${COLORS.faded}33)`, padding: '12px 16px', paddingBottom: 'calc(12px + env(safe-area-inset-bottom))', minHeight: 30, boxShadow: '0 -6px 18px rgba(20,22,28,0.10)' }
    : { position: 'sticky', top: stickyTop, zIndex: 4, display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 10, background: started && !ended ? `var(--stg-raise,${COLORS.ink})` : `var(--stg-raise,${COLORS.paper})`, color: started && !ended ? `var(--stg-ink,${COLORS.cream})` : `var(--stg-mute,${COLORS.faded})`, borderRadius: 10, border: `1px solid var(--stg-line,${COLORS.faded}33)`, padding: '7px 14px', marginBottom: 8, minHeight: 0 };

  return (
    <div className={QSTAGE ? 'stage-page' : (LOFT ? 'loft-page' : undefined)}
      data-stage-theme={QSTAGE ? stageTheme : undefined}
      style={{ ...(QSTAGE ? QUIZ_ACC_VARS : null), minHeight: '100vh', position: 'relative', overflowX: 'clip', background: QSTAGE ? 'var(--stg-ground)' : COLORS.cream, color: QSTAGE ? 'var(--stg-ink,#e9edf4)' : COLORS.ink }}>
      <QuizCelebration kind={celebration} onDone={() => setCelebration(null)} />
      {duelBanner}
      <style dangerouslySetInnerHTML={{ __html: `input:focus::placeholder{color:transparent}` }} />
      {!QSTAGE && (LOFT ? <DailyChrome loft /> : <QuizNavHeader />)}
      {/* THE CAP SWAP, and this is the whole trick. StageChrome takes
          LoftCap's own prop names, so the call site does not move; only the
          component behind it changes, plus the four things LoftCap never
          needed to know -- which quiz's board to read, what the ladder draws,
          when the strip comes down, and what the Rankings chip opens.

          TWO SCALES, ONE PROP NAME: LoftCap draws its bar from a PERCENT and
          StageChrome from a FRACTION, so handing the same number to both pins
          the stage hairline at 100% from the first correct answer. Caught by
          reading StageChrome rather than by looking at the page, where a full
          bar looks like a full bar.

          THE STRIP COMES DOWN WHILE THEY WORK. A live figure about other
          people is the one thing that should not sit over a clock, or over a
          keyboard on a phone.

          WHAT THE RANKINGS CHIP OPENS is this page's own standings, not
          DailyBoardPanel: a quiz has no registry row, no archive and no day,
          and two leaderboards for one quiz can disagree about it.

          The comments are HERE rather than between the attributes because a
          JSX comment inside an opening tag does not parse. */}
      {(LOFT || QSTAGE) && (
        <Cap
          name={quiz.title}
          cat={DEPT_LABEL[deptOf(quiz)] || quiz.category || 'Quiz'}
          dateLabel={`${total} ${total === 1 ? 'answer' : 'answers'}`}
          outcome={ended ? (dispScore === total ? 'won' : dispScore > 0 ? 'part' : 'lost') : null}
          figures={ended ? [] : [
            { v: `${dispScore}/${total}`, k: 'Score' },
            { v: clock, k: 'Time left' },
          ]}
          progress={QSTAGE
            ? (total ? dispScore / total : 0)
            : (total ? Math.round((dispScore / total) * 100) : null)}
          quizId={quiz.id}
          scoreWord="correct"
          stripOn={!started || ended}
          panelBody={QSTAGE ? fullLeaderboard : null}
        />
      )}
      <div className="qz-pagewrap" style={{ position: 'relative', zIndex: 2, maxWidth: 1180, margin: '0 auto', padding: '8px 38px 80px' }}><style dangerouslySetInnerHTML={{ __html: `@media(max-width:560px){.qz-pagewrap{padding-left:14px !important;padding-right:14px !important;}}` }} /><div className="qzf-line" aria-hidden="true" />

        <style dangerouslySetInnerHTML={{ __html: `@import url('https://fonts.googleapis.com/css2?family=Manrope:wght@400;500;600;700;800&display=swap');
.qzlg-grid{display:grid;gap:8px;grid-template-columns:repeat(auto-fill,minmax(112px,1fr));}
.qz-acols{display:grid;gap:3px 8px;grid-template-columns:repeat(var(--accolsm,3),minmax(0,1fr));}
.qz-acols>li{margin-bottom:0 !important;}
@media(min-width:560px){.qz-acols{grid-template-columns:repeat(var(--accols,3),minmax(0,1fr));}}
.qzlg-grid.qzlg-big{grid-template-columns:repeat(auto-fill,minmax(140px,1fr));}
.qzlg-cell-tall{height:208px;}
.qzlg-img-tall{max-height:204px;}
@media(min-width:760px){
  .qzlg-grid.qzlg-big{grid-template-columns:repeat(auto-fill,minmax(208px,1fr));}
  .qzlg-cell-tall{height:312px;}
  .qzlg-img-tall{max-height:308px;}
}` }} />

        {/* Header */}
        <div style={{ paddingBottom: 0, marginTop: mAppPlay ? 4 : 12, ...(ended ? { maxWidth: 640, marginLeft: 'auto', marginRight: 'auto' } : null) }}>
          {!LOFT && !QSTAGE && (
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: 'clamp(16px, 4vw, 28px)' }}>
            <h1 style={{ fontFamily: SERIF, fontWeight: 800, fontSize: mAppPlay ? 17 : 'clamp(24px, 4vw, 38px)', lineHeight: 1.02, letterSpacing: '-0.02em', margin: 0, color: INK, fontVariationSettings: '"SOFT" 100' }}>{quiz.title}</h1>
          </div>
          )}
          {runActive && (
            <div style={{ marginTop: 12, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap', padding: '8px 14px', borderRadius: 10, border: `1.5px solid ${COLORS.accBorder}`, background: `var(--stg-acc-tint,${COLORS.accSoft})` }}>
              <span style={{ fontFamily: MONO, fontSize: 11, letterSpacing: '0.14em', textTransform: 'uppercase', fontWeight: 700, color: `var(--stg-acc-ink,${COLORS.ember})` }}>Daily Challenge · {chAccent}</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                  {chStepIds.map((_, k) => (
                    <span key={k} style={{ width: 9, height: 9, borderRadius: '50%', boxSizing: 'border-box', background: k < chStepIdx ? COLORS.ember : 'transparent', border: k === chStepIdx ? `2.5px solid ${COLORS.ember}` : `1.5px solid ${`var(--stg-acc,${COLORS.accBorder})`}` }} />
                  ))}
                </span>
                <span style={{ fontFamily: MONO, fontSize: 11, letterSpacing: '0.1em', textTransform: 'uppercase', fontWeight: 700, color: FADED }}>Quiz {chStepIdx + 1} of {chN}</span>
              </div>
            </div>
          )}
          {!LOFT && !QSTAGE && tab !== 'stats' && !mAppPlay && (!started || ended) && <LeaderboardStrip board={board} identity={identity} onOpen={() => setTab('stats')} />}
        </div>

        {/* Ribbon */}
        <div style={{ marginTop: 8 }}>
          <div style={{ position: 'relative' }}>
            <style dangerouslySetInnerHTML={{ __html: `@keyframes qzCueR{0%,100%{transform:translate(0,-50%);}50%{transform:translate(3px,-50%);}}@keyframes qzCueL{0%,100%{transform:translate(0,-50%);}50%{transform:translate(-3px,-50%);}}.qz-cue{position:absolute;top:50%;z-index:3;display:flex;align-items:center;justify-content:center;width:26px;height:26px;border-radius:50%;background:${COLORS.ember};color:var(--white);box-shadow:0 1px 4px rgba(26,22,17,0.45);pointer-events:none;font-size:15px;line-height:1;}.qz-cue-r{right:10px;animation:qzCueR 1.4s ease-in-out infinite;}.qz-cue-l{left:10px;animation:qzCueL 1.4s ease-in-out infinite;}@media(min-width:760px){.qz-cue{display:none;}}.qz-ribbon{scrollbar-width:none;-ms-overflow-style:none;}.qz-ribbon::-webkit-scrollbar{display:none;}@keyframes qzCueOk{0%{transform:scale(.96);opacity:0;}55%{transform:scale(1.03);}100%{transform:scale(1);opacity:1;}}@keyframes qzCueNo{0%,100%{transform:translateX(0);}15%{transform:translateX(-7px);}30%{transform:translateX(6px);}45%{transform:translateX(-5px);}60%{transform:translateX(4px);}75%{transform:translateX(-2px);}}` }} />
          </div>
        </div>

        {/* ── RESULTS (shared inline end screen, desktop + mobile). No popup:
            score + percentile top-left, placement top-right, three stacked
            actions, reveal (jumps to the board), then the REAL leaderboard
            element (same as the Leaderboard tab), then the answer board. */}
        {ended && tab === 'play' && !LOFT && !QSTAGE && (() => {
          const win = dispScore === total;
          const timeout = !win && time <= 0;
          const heading = isTopScore ? 'New record' : win ? 'Perfect' : timeout ? "Time's up" : 'Game over';
          const myRank = (() => {
            const rows = board.leaderboardAll || [];
            if (identity) { const i = rows.findIndex((r) => r.username === identity.username); if (i >= 0) return i + 1; }
            if (lastElapsed == null || !rows.length) return null;
            let better = 0;
            for (const r of rows) { if (r.score > dispScore || (r.score === dispScore && r.timeElapsed < lastElapsed)) better++; }
            return better + 1;
          })();
          const placement = board.placement != null ? board.placement : myRank;
          const regRank = !identity ? registerRank(board.leaderboard, dispScore, lastElapsed) : null;
          const openRegister = () => { setClaimMsg(''); setClaimErr(false); setClaimOpen(true); };
          const jumpToBoard = () => { if (typeof document !== 'undefined') { const el = document.getElementById('quiz-board'); if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' }); } };
          const stackBtn = { fontFamily: MONO, fontSize: 12.5, letterSpacing: '0.04em', textTransform: 'uppercase', fontWeight: 700, borderRadius: 10, padding: '14px 12px', cursor: 'pointer', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, width: '100%', boxSizing: 'border-box', textDecoration: 'none' };
          return (
            <div style={{ maxWidth: 640, margin: '16px auto 0' }}>
              <ScrollToTopOnMount />
              {/* Centred game stats. The "You placed #N" block opposite them was
                  removed 2026-07-31 (owner); the This Quiz tile on the IQ card
                  below carries the same rank, so `placement` still feeds that. */}
              <div style={{ textAlign: 'center', marginBottom: 18 }}>
                <div style={{ fontFamily: MONO, fontSize: 11, letterSpacing: '0.16em', textTransform: 'uppercase', fontWeight: 800, color: (isTopScore || win) ? COLORS.forest : COLORS.ember, marginBottom: 6 }}>{heading}</div>
                <div style={{ fontFamily: SERIF, fontWeight: 800, fontSize: 38, lineHeight: 1 }}>{dispScore}<span style={{ fontSize: 22, color: FADED }}> / {total}</span></div>
                <p style={{ fontFamily: SANS, fontSize: 13, color: `var(--stg-ink2,#4a4339)`, margin: '6px 0 0' }}>{resultLine}{lastElapsed != null ? ` · ${fmtTime(lastElapsed)}` : ''}</p>
              </div>
              {React.cloneElement(eloPanel, { placement })}
              <RegisterRankLine rank={regRank} onRegister={openRegister} />
              {runActive && (
                <button onClick={goNextStep} style={{ ...stackBtn, marginBottom: 9, background: `var(--stg-acc,${COLORS.ember})`, color: `var(--stg-onramp,${T.white})`, fontSize: 13 }}>
                  {chHasNext
                    ? (chCountdown != null && chCountdown > 0 ? `Next quiz in ${chCountdown}…` : `Next quiz (${chNextStep + 1} of ${chN}) →`)
                    : (chCountdown != null && chCountdown > 0 ? `Your results in ${chCountdown}…` : 'See your results →')}
                </button>
              )}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
                <button onClick={restartRound} style={{ ...stackBtn, background: QSTAGE ? QACC : T.cta, color: QSTAGE ? ON_ACC : T.ctaInk }}><RotateCcw size={15} strokeWidth={2.5} /> Play again</button>
                <UpNextCard quiz={quiz} />
                {/* Challenge + Share sit side by side on desktop and wrap to their own
                    lines on a phone (flex-wrap with a 190px basis), per Marshall.
                    share() uses the ref-stamped shareUrl, so a new player who opens
                    this link and finishes a game credits whoever shared it. */}
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 9 }}>
                  <a href={`/duel/new?quiz=${encodeURIComponent(quiz.id)}`} style={{ ...stackBtn, flex: '1 1 190px', width: 'auto', background: `var(--stg-surf2,${COLORS.ink})`, color: `var(--stg-ink,${T.white})`, borderRadius: 10 }}><Swords size={15} strokeWidth={2.5} /> Challenge Someone</a>
                  <button onClick={() => { if (!notifyShareCredit(`${resultMsg}\n${shareUrl}`)) share(); }} style={{ ...stackBtn, flex: '1 1 190px', width: 'auto', background: `var(--stg-surf2,${COLORS.ink})`, color: `var(--stg-ink,${T.white})`, borderRadius: 10 }}><Share2 size={15} strokeWidth={2.5} /> {copied ? 'Link copied' : 'Share Quiz (for credit)'}</button>
                </div>
              </div>
              <div style={{ marginTop: 9 }}>
                {quiz.listId && (
                  <a href={`/list/${quiz.listId}`} style={{ ...stackBtn, background: `var(--stg-surf,${T.white})`, color: `var(--stg-acc-ink,${COLORS.ember})`, border: `1.5px solid var(--stg-acc,${COLORS.ember})` }}>See the full list detail</a>
                )}
                {canReveal && identity && !revealed && (
                  <button onClick={() => { setRevealed(true); setTab('play'); jumpToBoard(); }} style={{ ...stackBtn, background: `var(--stg-surf,${T.white})`, color: `var(--stg-acc-ink,${COLORS.ember})`, border: `1.5px solid var(--stg-acc,${COLORS.ember})` }}><Eye size={15} strokeWidth={2.5} /> Reveal answers below</button>
                )}
                {canReveal && revealed && (
                  <button onClick={jumpToBoard} style={{ ...stackBtn, background: `var(--stg-surf,${T.white})`, color: COLORS.forest, border: `1.5px solid ${COLORS.forest}` }}><Eye size={15} strokeWidth={2.5} /> Jump to answers</button>
                )}
                {!identity && !claimOpen && (
                  <button onClick={() => { setClaimMsg(''); setClaimErr(false); setClaimOpen(true); }} style={{ ...stackBtn, background: `var(--stg-surf,${T.white})`, color: `var(--stg-acc-ink,${COLORS.ember})`, border: `1.5px solid var(--stg-acc,${COLORS.ember})` }}>{canReveal ? (<><Eye size={15} strokeWidth={2.5} /> Reveal answers below</>) : (<><Trophy size={15} strokeWidth={2.5} /> Post this to the leaderboard</>)}</button>
                )}
                {!identity && claimOpen && (
                  <div style={{ maxWidth: 420, margin: '0 auto' }}>
                    <p style={{ fontFamily: SANS, fontSize: 13, color: `var(--stg-ink2,#4a4339)`, margin: '0 0 10px', textAlign: 'center' }}>
                      {canReveal
                        ? `Pick a display name to reveal the answers you missed. It also posts this ${dispScore}/${total} to the leaderboard. Email is optional (required only for prizes), and no password is needed.`
                        : `Pick a display name to post this ${dispScore}/${total} to the leaderboard. Email is optional (required only for prizes), and no password is needed.`}
                    </p>
                    <input value={jName} onChange={(e) => setJName(e.target.value)} maxLength={15} placeholder="Display name" autoCapitalize="none" autoCorrect="off" spellCheck={false} style={fieldStyle} />
                    <input value={jEmail} onChange={(e) => setJEmail(e.target.value)} type="email" placeholder="Email (optional, required for prizes)" autoCapitalize="none" autoCorrect="off" spellCheck={false} style={{ ...fieldStyle, marginTop: 10 }} />
                    <button onClick={submitClaim} disabled={claimBusy} style={{ ...stackBtn, marginTop: 12, background: QSTAGE ? QACC : T.cta, color: QSTAGE ? ON_ACC : T.ctaInk, opacity: claimBusy ? 0.6 : 1 }}>{claimBusy ? (canReveal ? 'Revealing…' : 'Posting…') : (canReveal ? 'Reveal the answers' : 'Post this to the leaderboard')}</button>
                  </div>
                )}
                {claimMsg && (
                  <p style={{ fontFamily: MONO, fontSize: 12, margin: '8px 0 0', textAlign: 'center', color: claimErr ? COLORS.ember : COLORS.forest }}>{claimMsg}</p>
                )}
              </div>
              {similarQuizzes}
              <div style={{ marginTop: 24, paddingTop: 20, borderTop: `1px solid var(--stg-line,${COLORS.line})` }}>
                {fullLeaderboard}
              </div>
              <div style={{ textAlign: 'center', marginTop: 14 }}>
                <button onClick={() => { setQSent(false); setQOpen(true); }} style={{ background: 'none', border: 'none', padding: 4, cursor: 'pointer', fontFamily: MONO, fontSize: 12, fontWeight: 600, color: FADED, textDecoration: 'underline', textUnderlineOffset: 3 }}>Report an error</button>
              </div>
            </div>
          );
        })()}

        <div style={{ marginTop: 12 }} />

        {/* ── PLAY ── */}
        {tab === 'play' && (
        <div className={LOFT ? 'loft-stage' : undefined}>
        <div className={LOFT ? (ended && !boardShown ? 'loft-flip on' : 'loft-flip') : undefined}>
        <div className={LOFT ? 'loft-flip-in' : undefined}>
        <div className={LOFT ? 'loft-face' : undefined}>
        <div className={LOFT ? 'loft-sheet' : undefined}>
          <QuizPlayOverlay open={mPlayOverlay} stage={QSTAGE}>
            {/* Compact title row, shown only inside the mobile fullscreen popup
                (the page title/header is covered by the overlay). */}
            {mPlayOverlay && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '0 0 8px' }}>
                <Logo size={18} />
                <span style={{ fontFamily: SERIF, fontWeight: 800, fontSize: 15, lineHeight: 1.1, color: INK, flex: '1 1 auto', minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{quiz.title}</span>
                {started && !ended && (
                  <button onClick={() => { endGame(false); setTab('stats'); }} aria-label="Quit this quiz and see results" style={{ flex: 'none', display: 'inline-flex', alignItems: 'center', gap: 5, fontFamily: MONO, fontSize: 11, letterSpacing: '0.1em', textTransform: 'uppercase', fontWeight: 700, padding: '6px 11px', borderRadius: 8, border: `1px solid var(--stg-line,${COLORS.line})`, background: `var(--stg-surf,${T.white})`, color: FADED, cursor: 'pointer' }}>
                    <X size={13} strokeWidth={2.5} /> Quit
                  </button>
                )}
              </div>
            )}
            {/* Freeze the score/time bar AND the answer input together, pinned to
                the top of the viewport. The nav ribbon above is NOT sticky, so
                this is the only frozen element; the list/board scrolls under. */}
            <div ref={scoreRef} id="quiz-board" style={{ position: 'sticky', top: 0, zIndex: 24, background: `var(--stg-ground,${COLORS.cream})` }}>
            <div style={{ display: 'flex', flexWrap: 'nowrap', alignItems: 'center', gap: 8, margin: '4px 0 8px', ...(portraitPhoto ? { maxWidth: PHOTO_COL, marginLeft: 'auto', marginRight: 'auto' } : null) }}>
              {/* The cap carries the score and the clock on a loft page, so
                  printing them here as well says it twice. Only the CHIPS are
                  gated: the answer input and the Play button share this row and
                  stay at both widths. */}
              {!LOFT && !QSTAGE && (() => {
                const base = { display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 4, flex: 'none', height: 50, padding: '0 12px', border: `1px solid var(--stg-line,${COLORS.line})`, borderRadius: 9, background: `var(--stg-surf,${T.white})`, fontFamily: SERIF, fontWeight: 800, fontSize: 16, lineHeight: 1 };
                const live = started && !ended;
                return (<>
                  <span style={{ ...base, fontVariantNumeric: 'tabular-nums' }} title="Your score">{dispScore}<span style={{ fontSize: 11, color: FADED, fontWeight: 700 }}>/{total}</span></span>
                  <span style={{ ...base, fontFamily: MONO, fontVariantNumeric: 'tabular-nums', minWidth: `calc(${clockMax.length}ch + 26px)`, color: time <= 10 && live ? COLORS.ember : `var(--stg-ink,${COLORS.ink})` }} title="Time left">{clock}</span>
                </>);
              })()}
              {(started || ended) && !bottomDock && !mapMode && !tileMode && (!matched || ordered) && (
                <input
                  ref={inputRef}
                  value={guess}
                  disabled={!started || ended}
                  onChange={(e) => {
                    const v = e.target.value;
                    if (started && !ended && (ordered ? autoOrdered(v) : autoName(v))) { setGuess(''); }
                    else { setGuess(v); }
                  }}
                  onKeyDown={ordered ? onOrderedKey : onKey}
                  placeholder={started ? (ordered ? ((answers[activeIdx] && answers[activeIdx].label != null) ? `Type the ${quiz.noun || 'answer'} for ${answers[activeIdx].label}…` : `Type the next ${quiz.noun || 'answer'}…`) : `Type ${/^[aeiou]/.test(quiz.noun || '') ? 'an' : 'a'} ${quiz.noun || 'answer'}…`) : 'Press Play to begin…'}
                  autoComplete="off"
                  autoCapitalize="none"
                  autoCorrect="off"
                  spellCheck={false}
                  style={{ flex: 1, minWidth: 0, fontFamily: SANS, fontSize: 17, height: 50, boxSizing: 'border-box', padding: '0 16px', border: `1.5px solid var(--stg-line,${COLORS.ink})`, borderRadius: 8, background: !started || ended ? `var(--stg-surf,${COLORS.paper})` : `var(--stg-surf,${T.paper})`, color: INK, opacity: !started || ended ? 0.5 : 1 }}
                />
              )}
              {(started || ended) && !bottomDock && (<div style={{ position: 'relative', display: 'flex', flex: (matched && !ordered) || mapMode || tileMode ? 1 : 'none' }}>
              <button onClick={start} disabled={started || ended} style={{ flex: 1, fontFamily: MONO, fontSize: 13, letterSpacing: '0.08em', textTransform: 'uppercase', fontWeight: 700, padding: '0 22px', height: 50, border: 'none', background: QSTAGE ? (started || ended ? 'var(--stg-surf2)' : QACC) : T.cta, color: QSTAGE ? (started || ended ? 'var(--stg-mute)' : ON_ACC) : T.ctaInk, cursor: started || ended ? 'default' : 'pointer', opacity: (started || ended) && !QSTAGE ? 0.5 : 1 }}>
                {ended ? 'Done' : started ? 'Playing' : (matched && !ordered) ? (quiz.noun ? 'Play' : 'Play — name each year') : 'Play'}
              </button>
              {/* Correct/wrong verdict pops over the Play button (replaces the old
                  full-width banner, which forced a large gap below the input). */}
              {cue && started && !ended && (
                <div key={cue.id} aria-live="assertive" style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: cue.ok ? COLORS.forest : COLORS.ember, color: T.white, pointerEvents: 'none', animation: `${cue.ok ? 'qzCueOk' : 'qzCueNo'} .45s ease both` }}>
                  {cue.ok ? <Check size={22} strokeWidth={3} /> : <X size={22} strokeWidth={3} />}
                </div>
              )}
              </div>)}
            </div>
            {mAppPlay && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '0 2px 7px', fontFamily: MONO, fontSize: 11, fontWeight: 700, color: FADED }}>
                <span style={{ fontVariantNumeric: 'tabular-nums' }}>{dispScore}/{total}</span>
                <span style={{ position: 'relative', flex: 1, height: 6, borderRadius: 4, background: `var(--stg-surf2,${COLORS.paper})`, overflow: 'hidden' }}>
                  <span style={{ position: 'absolute', top: 0, bottom: 0, left: 0, right: `${100 - (total ? Math.round((dispScore / total) * 100) : 0)}%`, background: `var(--stg-acc,${COLORS.ember})`, borderRadius: 4, transition: 'right .3s' }} />
                </span>
                <span style={{ fontVariantNumeric: 'tabular-nums' }}>{total ? Math.round((dispScore / total) * 100) : 0}%</span>
              </div>
            )}
            </div>
            {!bottomDock && <div style={{ fontFamily: MONO, fontSize: 12, minHeight: 15, marginTop: 2, marginBottom: 8, color: hintBad ? COLORS.ember : `var(--stg-mute,${COLORS.faded})`, ...(portraitPhoto ? { maxWidth: PHOTO_COL, marginLeft: 'auto', marginRight: 'auto' } : null) }}>{hint}</div>}
            {bottomDock && started && (
              <div style={{ position: 'fixed', left: 0, right: 0, bottom: kbInset, zIndex: 40, background: `var(--stg-ground,${COLORS.cream})`, borderTop: `1px solid var(--stg-line,${COLORS.line})`, boxShadow: '0 -6px 18px rgba(20,22,28,0.10)', padding: '9px 14px', paddingBottom: kbInset > 0 ? 9 : 'calc(9px + env(safe-area-inset-bottom))' }}>
                {hint && <div style={{ fontFamily: MONO, fontSize: 12, marginBottom: 6, color: hintBad ? COLORS.ember : `var(--stg-mute,${COLORS.faded})`, textAlign: 'center', minHeight: 14 }}>{hint}</div>}
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <input
                  ref={inputRef}
                  value={guess}
                  disabled={!started || ended}
                  onChange={(e) => {
                    const v = e.target.value;
                    if (started && !ended && (ordered ? autoOrdered(v) : autoName(v))) { setGuess(''); }
                    else { setGuess(v); }
                  }}
                  onKeyDown={ordered ? onOrderedKey : onKey}
                  placeholder={started ? (ordered ? ((answers[activeIdx] && answers[activeIdx].label != null) ? `Type the ${quiz.noun || 'answer'} for ${answers[activeIdx].label}…` : `Type the next ${quiz.noun || 'answer'}…`) : `Type ${/^[aeiou]/.test(quiz.noun || '') ? 'an' : 'a'} ${quiz.noun || 'answer'}…`) : 'Press Play to begin…'}
                  autoComplete="off"
                  autoCapitalize="none"
                  autoCorrect="off"
                  spellCheck={false}
                  style={{ flex: 1, minWidth: 0, fontFamily: SANS, fontSize: 17, height: 50, boxSizing: 'border-box', padding: '0 16px', border: `1.5px solid var(--stg-line,${COLORS.ink})`, borderRadius: 8, background: !started || ended ? `var(--stg-surf,${COLORS.paper})` : `var(--stg-surf,${T.paper})`, color: INK, opacity: !started || ended ? 0.5 : 1 }}
                />
              <div style={{ position: 'relative', display: 'flex', flex: (matched && !ordered) || mapMode || tileMode ? 1 : 'none' }}>
              <button onClick={start} disabled={started || ended} style={{ flex: 1, fontFamily: MONO, fontSize: 13, letterSpacing: '0.08em', textTransform: 'uppercase', fontWeight: 700, padding: '0 22px', height: 50, border: 'none', background: QSTAGE ? (started || ended ? 'var(--stg-surf2)' : QACC) : T.cta, color: QSTAGE ? (started || ended ? 'var(--stg-mute)' : ON_ACC) : T.ctaInk, cursor: started || ended ? 'default' : 'pointer', opacity: (started || ended) && !QSTAGE ? 0.5 : 1 }}>
                {ended ? 'Done' : started ? 'Playing' : (matched && !ordered) ? (quiz.noun ? 'Play' : 'Play — name each year') : 'Play'}
              </button>
              {/* Correct/wrong verdict pops over the Play button (replaces the old
                  full-width banner, which forced a large gap below the input). */}
              {cue && started && !ended && (
                <div key={cue.id} aria-live="assertive" style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: cue.ok ? COLORS.forest : COLORS.ember, color: T.white, pointerEvents: 'none', animation: `${cue.ok ? 'qzCueOk' : 'qzCueNo'} .45s ease both` }}>
                  {cue.ok ? <Check size={22} strokeWidth={3} /> : <X size={22} strokeWidth={3} />}
                </div>
              )}
              </div>
                </div>
              </div>
            )}

            {!started && !ended && (
              <div style={{ textAlign: 'center', padding: '26px 24px 30px', borderRadius: 10, border: `1.5px solid var(--stg-line,${COLORS.ink})`, background: `var(--stg-surf,${COLORS.paper})`, marginTop: 4 }}>
                <h2 style={{ fontFamily: SERIF, fontWeight: 800, fontSize: 26, margin: '2px 0 6px' }}>{introHeadline}</h2>
                <p style={{ fontFamily: SANS, fontSize: 15, lineHeight: 1.5, color: `var(--stg-ink2,#4a4339)`, maxWidth: 470, margin: '0 auto 6px' }}>{introBody}</p>
                <p style={{ fontFamily: SANS, fontSize: 15, lineHeight: 1.5, color: FADED, maxWidth: 460, margin: '0 auto 16px' }}>{quiz.blurb}</p>
                <QuizIdleActions onStart={start} quizId={quiz.id} onLeaderboard={() => setTab('stats')} />
              </div>
            )}

            {(started || ended) && (photoMode ? (
            <PhotoBoard items={quiz.answers} started={started} ended={ended} revealed={revealed} onMatch={onPairMatch} onWrong={onBankWrong} onEnd={onPairEnd} onHint={onPairHint} answerNoun={quiz.noun} photoAspect={quiz.photoAspect} strike={quiz.strike} noSkip={quiz.strike} stickyTop={stickyTop} mobile={mobile} />
            ) : typeMode ? (
            <TypeItBoard items={quiz.answers} started={started} ended={ended} revealed={revealed} onMatch={onPairMatch} onWrong={onBankWrong} onEnd={onPairEnd} onHint={onPairHint} promptLabel={quiz.leftLabel} answerNoun={quiz.noun} clueVariant={careersMode ? 'careers' : undefined} sequential={quiz.sequential === true} stickyTop={stickyTop} mobile={mobile} />
            ) : scrambleMode ? (
            <WordScrambleBoard items={quiz.answers} started={started} ended={ended} revealed={revealed} onMatch={onPairMatch} onWrong={onBankWrong} onEnd={onPairEnd} onHint={onPairHint} promptLabel={quiz.leftLabel} answerNoun={quiz.noun} stickyTop={stickyTop} mobile={mobile} />
            ) : bankMode ? (
            <BankQuizBoard pairs={quiz.pairs} started={started} ended={ended} revealed={revealed} onMatch={onPairMatch} onWrong={onBankWrong} onEnd={onPairEnd} onHint={onPairHint} promptLabel={quiz.leftLabel} bankLabel={quiz.rightLabel} stickyTop={stickyTop} mobile={mobile} />
            ) : orderBankMode ? (
            <OrderBankBoard items={quiz.answers} started={started} ended={ended} revealed={revealed} onMatch={onPairMatch} onWrong={onBankWrong} onEnd={onPairEnd} onHint={onPairHint} answerNoun={quiz.noun} directions={quiz.directions} bankLabel={quiz.bankLabel} stickyTop={stickyTop} mobile={mobile} />
            ) : photoMatchMode ? (
            <PhotoMatchBoard items={quiz.answers} started={started} ended={ended} revealed={revealed} onMatch={onPairMatch} onWrong={onBankWrong} onEnd={onPairEnd} onHint={onPairHint} answerNoun={quiz.noun} stickyTop={stickyTop} mobile={mobile} />
            ) : pairsMode ? (
            <MatchQuizBoard pairs={quiz.pairs} started={started} ended={ended} revealed={revealed} onMatch={onPairMatch} onError={onPairError} onEnd={onPairEnd} onHint={onPairHint} leftLabel={quiz.leftLabel} rightLabel={quiz.rightLabel} sortLeft={quiz.sortLeft} mobile={mobile} />
            ) : mapMode ? (
            <div>
              <div style={mapBarStyle}>
                <span style={{ fontFamily: MONO, fontSize: 11, letterSpacing: '0.2em', textTransform: 'uppercase', opacity: 0.7, flex: 'none' }}>{quiz.erase ? 'Erase' : 'Find'}</span>
                {(() => {
                  if (mapImgPrompt && started && !ended && curName) {
                    const src = (answers.find((a) => a.t === curName) || {}).img;
                    if (src) return (<span key={curName} style={{ flex: '1 1 auto', minWidth: 0, display: 'flex', alignItems: 'center' }}><img src={src} alt="Mystery flag" style={{ height: 44, maxWidth: 88, objectFit: 'contain', border: '1px solid rgba(20,22,28,0.25)', borderRadius: 3, background: `var(--stg-surf,${T.white})` /* stage: KEPT WHITE, see patch-quizclient-board.mjs */, display: 'block' }} /></span>);
                  }
                  const clueText = ended ? 'Game over' : started ? (mapCapitalPrompt ? (curName ? capOf(curName) : '—') : (curName || '—')) : 'Press Play to start'; return (<span key={clueText} style={{ fontFamily: SERIF, fontWeight: 800, fontSize: 'clamp(16px, 4.2vw, 21px)', lineHeight: 1.15, flex: '1 1 auto', minWidth: 0, overflowWrap: 'break-word', transform: 'translateZ(0)' }}>{clueText}</span>); })()}
                {started && !ended && !quiz.erase && (
                  <button onClick={skipCountry} title="Can't find it? Skip and come back to it later." style={{ marginLeft: 'auto', flex: 'none', fontFamily: MONO, fontSize: 10, letterSpacing: '0.16em', textTransform: 'uppercase', fontWeight: 700, padding: '8px 14px', background: 'transparent', color: COLORS.cream, border: '1px solid rgba(244,237,224,0.4)', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                    <SkipForward size={12} strokeWidth={2.5} /> Skip
                  </button>
                )}
              </div>
              <MapQuizBoard region={quiz.region || 'europe'} noBorders={quiz.noBorders} started={started} ended={ended} revealed={revealed} foundNames={foundNamesSet} flash={flash} onPick={pickCountry} erase={!!quiz.erase} mobile={mobile} />
              {mapBarDock && <div aria-hidden="true" style={{ height: 'calc(116px + env(safe-area-inset-bottom))' }} />}
            </div>
            ) : streetMapMode ? (
            <StreetMapBoard answers={answers} found={found} revealed={revealed} region={quiz.region} mobile={mobile} />
            ) : logosMode ? (
            <ul className={`qzlg-grid${tallTiles || squareTiles ? ' qzlg-big' : ''}`} style={{ margin: 0, padding: 0, listStyle: 'none' }}>
              {displayOrder.map((i) => {
                const a = answers[i];
                const f = found[i];
                const reveal = ended && revealed && !f;
                const bd = f ? COLORS.forest : reveal ? COLORS.rust : COLORS.faded + '33';
                return (
                  <li key={i} ref={setFlipRef(i)} style={{ borderRadius: 10, border: `1px solid ${bd}`, borderRadius: 10, background: `var(--stg-surf,${T.white})`, display: 'flex', flexDirection: 'column', alignItems: 'center', padding: tallTiles || squareTiles ? 6 : 8, transition: 'background .2s, border-color .2s, box-shadow .2s', boxShadow: f ? `inset 0 -3px 0 ${COLORS.forest}` : reveal ? `inset 0 -3px 0 ${COLORS.rust}` : 'none' }}>
                    <div className={tallTiles ? 'qzlg-cell-tall' : ''} style={{ ...(squareTiles ? { aspectRatio: '1 / 1' } : tallTiles ? {} : { height: 62 }), width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2px' }}>
                      {started || ended ? (
                        <img src={a.img} alt={f || reveal ? a.t : `Image ${i + 1}`} loading="lazy" className={tallTiles ? 'qzlg-img-tall' : ''} style={{ maxWidth: tallTiles || squareTiles ? '100%' : '90%', maxHeight: squareTiles ? '100%' : tallTiles ? undefined : 56, objectFit: 'contain' }} />
                      ) : (
                        <span aria-hidden="true" style={{ fontFamily: MONO, fontSize: tallTiles || squareTiles ? 40 : 26, color: FADED, opacity: 0.3 }}>?</span>
                      )}
                    </div>
                    <div style={{ minHeight: 30, marginTop: 5, textAlign: 'center', fontFamily: SERIF, fontWeight: 600, fontSize: 13, lineHeight: 1.12, color: f ? COLORS.forest : reveal ? COLORS.rust : `var(--stg-mute,${COLORS.faded})` }}>
                      {f || reveal ? a.t : <span style={{ fontFamily: MONO, fontSize: 17, opacity: 0.4 }}>?</span>}
                    </div>
                  </li>
                );
              })}
            </ul>
            ) : (
            (() => {
              if (slideshow) {
                const last = answers.length - 1;
                const i = Math.min(Math.max(slideIdx, 0), last);
                const a = answers[i];
                const f = found[i];
                const reveal = ended && revealed && !f;
                const solved = found.filter(Boolean).length;
                const navDisabled = !started;
                // Circular nav that skips already-solved clues while playing: Next past
                // the end wraps to the start, Back before the start wraps to the end, and
                // you never land back on (re-see) an accepted answer. After the game ends,
                // cycle through every slot so missed answers can be reviewed.
                const navTarget = (d) => { const n = answers.length; for (let k = 1; k <= n; k++) { const j = (((i + d * k) % n) + n) % n; if (j === i) break; if (ended || !found[j]) return j; } return i; };
                const go = (d) => { const j = navTarget(d); if (j !== i) setSlideIdx(j); };
                const adv = () => { const n = answers.length; for (let k = 1; k <= n; k++) { const j = (i + k) % n; if (j !== i && !found[j]) { setSlideIdx(j); return; } } };
                return (
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontFamily: MONO, fontSize: 11, letterSpacing: '0.1em', textTransform: 'uppercase', color: FADED, marginBottom: 12 }}>
                      <span>{i + 1} / {answers.length}</span>
                      <span>{solved} solved</span>
                    </div>
                    <div style={{ borderRadius: 14, border: `1px solid ${f ? COLORS.forest : reveal ? COLORS.rust : `var(--stg-line,${COLORS.faded})` + '44'}`, background: f ? `var(--stg-surf,${T.white})` : reveal ? '#f6ead9' : `var(--stg-surf,${COLORS.paper})`, padding: '34px 22px', textAlign: 'center', minHeight: 150, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 18 }}>
                      <div style={{ fontFamily: SERIF, fontWeight: 800, fontSize: 'clamp(26px, 5vw, 40px)', lineHeight: 1.1, color: INK }}>{a.label}</div>
                      {f ? (
                        <div style={{ fontFamily: SERIF, fontSize: 22, fontWeight: 600, color: COLORS.forest }}>{a.t}</div>
                      ) : reveal ? (
                        <div style={{ fontFamily: SERIF, fontSize: 22, fontWeight: 600, color: COLORS.rust }}>{a.t}</div>
                      ) : (
                        <input
                          ref={(el) => { slotRefs.current[i] = el; if (i === 0) inputRef.current = el; }}
                          enterKeyHint="next"
                          disabled={!started || ended}
                          onChange={(e) => { if (started && !ended && autoSlot(i, e.target.value)) { e.target.value = ''; adv(); } }}
                          onKeyDown={(e) => onSlotKey(i, e)}
                          placeholder={started ? `Type the ${quiz.noun || 'answer'}\u2026` : 'Press Play to begin\u2026'}
                          autoComplete="off" autoCapitalize="none" autoCorrect="off" spellCheck={false}
                          style={{ width: '100%', maxWidth: 360, fontFamily: SANS, fontSize: 18, padding: '13px 16px', borderRadius: 8, border: `1.5px solid var(--stg-line,${COLORS.ink})`, background: !started || ended ? `var(--stg-surf,${COLORS.paper})` : `var(--stg-surf,${T.white})`, color: INK, textAlign: 'center', opacity: !started || ended ? 0.5 : 1 }}
                        />
                      )}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 14, gap: 12 }}>
                      <button onClick={() => go(-1)} disabled={navDisabled || navTarget(-1) === i} style={{ fontFamily: MONO, fontSize: 12, letterSpacing: '0.08em', textTransform: 'uppercase', fontWeight: 700, padding: '11px 20px', borderRadius: 8, border: `1.5px solid var(--stg-line,${COLORS.ink})`, background: 'transparent', color: INK, cursor: (navDisabled || navTarget(-1) === i) ? 'default' : 'pointer', opacity: (navDisabled || navTarget(-1) === i) ? 0.4 : 1 }}>&larr; Back</button>
                      <span style={{ fontFamily: MONO, fontSize: 12, color: FADED }}>{f ? 'Solved' : reveal ? 'Missed' : (started ? 'Type your answer' : 'Press Play')}</span>
                      <button onClick={() => go(1)} disabled={navDisabled || navTarget(1) === i} style={{ fontFamily: MONO, fontSize: 12, letterSpacing: '0.08em', textTransform: 'uppercase', fontWeight: 700, padding: '11px 20px', borderRadius: 8, border: 'none', background: (navDisabled || navTarget(1) === i) ? `var(--stg-surf2,${COLORS.ember})` : `var(--stg-acc,${COLORS.ember})`, color: (navDisabled || navTarget(1) === i) ? `var(--stg-mute,${T.white})` : `var(--stg-onramp,${T.white})`, cursor: (navDisabled || navTarget(1) === i) ? 'default' : 'pointer', opacity: (navDisabled || navTarget(1) === i) ? 'var(--stg-inert-op,0.4)' : 1 }}>Next &rarr;</button>
                    </div>
                  </div>
                );
              }
              const renderRow = (a, i) => {
                const f = found[i];
                const isActive = ordered && started && !ended && !f && answers[activeIdx] && a.label === answers[activeIdx].label;
                const reveal = ended && revealed && !f; // a missed answer, now filled in
                const nameWrap = /\s/.test(String(a.t || '').trim())
                  ? { whiteSpace: 'normal', overflowWrap: 'normal', wordBreak: 'normal' } // multi-word: wrap at spaces, never mid-word
                  : { whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }; // single word: ellipsis, don't break
                return (
                  <li key={i} ref={setFlipRef(i)} style={{ display: 'flex', alignItems: 'center', gap: rz.gap, padding: rz.pad, borderRadius: 10, border: `1px solid ${f ? `var(--stg-acc,${COLORS.accBorder})` : isActive ? COLORS.ember : reveal ? COLORS.rust : `var(--stg-line,${COLORS.line})`}`, marginBottom: rz.mb, background: reveal ? '#fdecec' : f ? `var(--stg-acc-tint,${COLORS.accSoft})` : `var(--stg-surf,${T.white})`, boxShadow: isActive ? `inset 4px 0 0 ${COLORS.ember}` : reveal ? `inset 4px 0 0 ${COLORS.rust}` : 'none', transition: 'background .2s, border-color .2s, box-shadow .2s, color .2s' }}>
                    {a.label != null ? (
                      <span style={{ fontFamily: MONO, fontWeight: 500, fontSize: 12, minWidth: 44, maxWidth: '50%', overflowWrap: 'normal', wordBreak: 'normal', whiteSpace: 'normal', lineHeight: 1.2, color: `var(--stg-acc-ink,${COLORS.ember})`, flex: 'none', textAlign: 'left', letterSpacing: '0.04em' }}>{a.label}</span>
                    ) : (
                      quiz.hideNumbers ? null : <span style={{ fontFamily: SERIF, fontWeight: 800, fontSize: rz.rank, width: rz.rankW, color: `var(--stg-acc-ink,${COLORS.ember})`, flex: 'none', textAlign: 'center' }}>{i + 1}</span>
                    )}
                    {f ? (
                      <span style={{ fontFamily: SERIF, fontSize: a.label != null ? 11 : rz.name, fontWeight: a.label != null ? 400 : 500, flex: 1, minWidth: 0, lineHeight: 1.2, ...nameWrap }}>{a.t}</span>
                    ) : reveal ? (
                      <span style={{ fontFamily: SERIF, fontSize: a.label != null ? 11 : rz.name, fontWeight: a.label != null ? 400 : 500, flex: 1, minWidth: 0, lineHeight: 1.2, color: COLORS.rust, ...nameWrap }}>{a.t}</span>
                    ) : (matched && !ordered) ? (
                      <input
                        ref={(el) => { slotRefs.current[i] = el; if (i === 0) inputRef.current = el; }}
                        enterKeyHint="next"
                        disabled={!started || ended}
                        onChange={(e) => { if (started && !ended && autoSlot(i, e.target.value)) e.target.value = ''; }}
                        onKeyDown={(e) => onSlotKey(i, e)}
                        placeholder={started ? `Type the ${quiz.noun || 'winner'}…` : ''}
                        autoComplete="off"
                  autoCapitalize="none"
                  autoCorrect="off"
                  spellCheck={false}
                        style={{ flex: 1, minWidth: 0, fontFamily: SANS, fontSize: 16, padding: '9px 12px', borderRadius: 10, border: `1.5px solid var(--stg-line,${COLORS.ink})`, borderRadius: 8, background: !started || ended ? `var(--stg-surf,${COLORS.paper})` : `var(--stg-surf,${T.paper})`, color: INK, opacity: !started || ended ? 0.5 : 1 }}
                      />
                    ) : isActive ? (
                      <span style={{ fontFamily: SANS, fontSize: 14, fontStyle: 'italic', color: `var(--stg-acc-ink,${COLORS.ember})`, flex: 1 }}>Type it in the box above</span>
                    ) : (
                      <span style={{ fontFamily: MONO, fontSize: rz.dash, letterSpacing: '0.06em', color: FADED, opacity: 0.55, flex: 1, whiteSpace: 'nowrap', overflow: 'hidden' }}>— — —</span>
                    )}
                    {reveal ? (
                      <span style={{ flex: 'none', fontFamily: MONO, fontSize: 9, letterSpacing: '0.12em', textTransform: 'uppercase', color: COLORS.rust, fontWeight: 700 }}>Missed</span>
                    ) : (
                      <span style={{ width: 20, flex: 'none', color: COLORS.forest, opacity: f ? 1 : 0 }}><Check size={rz.check} strokeWidth={3} /></span>
                    )}
                  </li>
                );
              };
              if (quiz.format === 'author-grid') {
                const gridOrder = answers.map((a, gi) => gi).sort((x, y) => (!!found[x] === !!found[y] ? x - y : (found[x] ? 1 : -1)));
                return (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 8 }}>
                    {gridOrder.map((gi) => {
                      const a = answers[gi];
                      const f = found[gi];
                      const rev = ended && revealed && !f;
                      return (
                        <div key={gi} style={{ borderRadius: 10, border: `1px solid ${f ? COLORS.forest : rev ? COLORS.rust : `var(--stg-line,${COLORS.faded})` + '33'}`, borderRadius: 8, background: f ? `var(--stg-surf,${T.white})` : rev ? '#f6ead9' : `var(--stg-surf,${COLORS.paper})`, padding: '9px 11px', transition: 'all .2s' }}>
                          <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
                            <span style={{ fontFamily: MONO, fontSize: 11, color: FADED, flex: 'none' }}>{gi + 1}</span>
                            <span style={{ fontFamily: SANS, fontSize: 13, fontWeight: 500, color: INK, lineHeight: 1.2 }}>{a.clue}</span>
                          </div>
                          <div style={{ marginTop: 4, marginLeft: 22, minHeight: 18 }}>
                            {f || rev ? (
                              <span style={{ fontFamily: SERIF, fontSize: 15, fontWeight: 500, lineHeight: 1.2, color: f ? COLORS.forest : COLORS.rust }}>{a.t}</span>
                            ) : (
                              <span style={{ fontFamily: MONO, fontSize: 12, letterSpacing: '0.04em', color: FADED, opacity: 0.5 }}>&mdash;&nbsp;&mdash;&nbsp;&mdash;</span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                );
              }
              // quiz.groupByLabel: one box per label (a state), its answers
              // stacked inside in authored order. The box carries the label, so
              // the rows drop it.
              if (quiz.groupByLabel) {
                const groups = [];
                answers.forEach((a, gi) => {
                  const last = groups[groups.length - 1];
                  if (last && last.label === a.label) last.idxs.push(gi);
                  else groups.push({ label: a.label, idxs: [gi] });
                });
                return (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 190px), 1fr))', gap: 10 }}>
                    {groups.map((grp) => {
                      const got = grp.idxs.filter((gi) => found[gi]).length;
                      return (
                        <section key={grp.label} style={{ border: `1px solid var(--stg-line,${COLORS.line})`, borderRadius: 12, padding: '8px 8px 4px', minWidth: 0 }}>
                          <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 8, margin: '0 2px 6px', fontFamily: MONO, fontSize: 12, fontWeight: 800, letterSpacing: '0.04em', color: `var(--stg-acc-ink,${COLORS.ember})` }}>
                            <span>{grp.label}</span>
                            <span style={{ fontWeight: 600, fontSize: 11, color: `var(--stg-mute,${COLORS.soft})` }}>{got}/{grp.idxs.length}</span>
                          </div>
                          <ol style={{ margin: 0, padding: 0, listStyle: 'none' }}>
                            {grp.idxs.map((gi) => renderRow({ ...answers[gi], label: undefined }, gi))}
                          </ol>
                        </section>
                      );
                    })}
                  </div>
                );
              }
              if (colSplit) {
                return (
                  <div style={{ display: 'flex', gap: 14, alignItems: 'flex-start', flexWrap: 'wrap' }}>
                    {colSplit.map((idxs, ci) => (
                      <ol key={ci} style={{ margin: 0, padding: 0, listStyle: 'none', flex: '1 1 200px', minWidth: 0 }}>
                        {idxs.map((gi) => renderRow(answers[gi], gi))}
                      </ol>
                    ))}
                  </div>
                );
              }
              if (autoColCount > 1) {
                // Compact (long) lists use a responsive grid so phones still show
                // 2-3 columns instead of collapsing to one; desktop keeps the full
                // autoColCount. displayOrder is row-major, so solved items sink to
                // the bottom rows and the next unsolved stays near the input.
                if (compactList) {
                  const hasLabels = answers.some((a) => a && a.label != null);
                  const mobileCols = Math.min(hasLabels ? 2 : 3, autoColCount);
                  return (
                    <ol className="qz-acols" style={{ margin: 0, padding: 0, listStyle: 'none', '--accols': autoColCount, '--accolsm': mobileCols }}>
                      {displayOrder.map((i) => renderRow(answers[i], i))}
                    </ol>
                  );
                }
                // Auto-wrapped columns follow displayOrder (column-major), so as
                // items are solved they sink toward the last column's bottom and
                // the next unsolved one stays near the input bar.
                const per = Math.ceil(displayOrder.length / autoColCount);
                const cols = [];
                for (let c = 0; c < autoColCount; c++) cols.push(displayOrder.slice(c * per, (c + 1) * per));
                return (
                  <div style={{ display: 'flex', gap: 14, alignItems: 'flex-start', flexWrap: 'wrap' }}>
                    {cols.map((idxs, ci) => (
                      <ol key={ci} style={{ margin: 0, padding: 0, listStyle: 'none', flex: '1 1 200px', minWidth: 0 }}>
                        {idxs.map((i) => renderRow(answers[i], i))}
                      </ol>
                    ))}
                  </div>
                );
              }
              return (
                <ol style={{ margin: 0, padding: 0, listStyle: 'none' }}>
                  {displayOrder.map((i) => renderRow(answers[i], i))}
                </ol>
              );
            })()
            ))}


            {started && !ended && (
              <div style={{ marginTop: 22, display: 'flex', justifyContent: 'center' }}>
                <button onClick={() => endGame(false)} style={{ fontFamily: MONO, fontSize: 12, letterSpacing: '0.12em', textTransform: 'uppercase', fontWeight: 700, padding: '12px 40px', border: 'none', background: QSTAGE ? QACC : T.cta, color: QSTAGE ? ON_ACC : T.ctaInk, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                  <Flag size={14} strokeWidth={2.5} color={T.ink} /> Give up
                </button>
              </div>
            )}
            {((bottomDock && started) || (mobile === true && photoMode && started && !ended)) && <div aria-hidden="true" style={{ height: 'calc(136px + env(safe-area-inset-bottom))' }} />}
          </QuizPlayOverlay>
          {/* Inside the sheet, so it is on screen only while the board is, and
              it is the way back to the card the player turned over to get here.
              Same control, same class, same place as every daily. */}
          {(LOFT || QSTAGE) && ended && boardShown && (
            <button type="button" className={QSTAGE ? 'stf-hideboard' : 'loft-showopts'} onClick={() => setBoardShown(false)}>&#8630; Hide game board</button>
          )}
        </div>
        </div>
        {(LOFT || QSTAGE) && ended && (
          <QuizLoftFinish
            stage={QSTAGE}
            quiz={quiz}
            score={dispScore}
            total={total}
            elapsed={lastElapsed}
            board={board}
            identity={identity}
            topScore={isTopScore}
            timedOut={dispScore !== total && time <= 0}
            beatPct={attemptsPct}
            next={nextMeta}
            canReveal={canReveal}
            copied={copied}
            onReveal={() => {
              if (canReveal && identity) setRevealed(true);
              setBoardShown(true);
            }}
            onReplay={restartRound}
            onShare={() => { if (!notifyShareCredit(`${resultMsg}\n${shareUrl}`)) share(); }}
            onJoin={() => setTab('join')}
          />
        )}
        </div>
        </div>
        </div>
        )}

        {/* ── STATS & LEADERBOARD (quiz stats + leaderboard) ── */}
        {tab === 'stats' && (
          <div>
            <button onClick={() => setTab('play')} style={{ display: 'inline-flex', alignItems: 'center', gap: 5, background: 'none', border: 'none', cursor: 'pointer', fontFamily: SANS, fontSize: 12.5, fontWeight: 600, color: `var(--stg-acc-ink,${COLORS.ember})`, padding: 0, marginBottom: 16 }}><ArrowLeft size={13} strokeWidth={2.5} /> Back to quiz</button>
            {fullLeaderboard}
          </div>
        )}

        {/* ── SHARE ── */}
        {tab === 'share' && (
          <div style={{ textAlign: 'center', padding: '12px 0 8px' }}>
            <div style={{ textAlign: 'left' }}><button onClick={() => setTab('play')} style={{ display: 'inline-flex', alignItems: 'center', gap: 5, background: 'none', border: 'none', cursor: 'pointer', fontFamily: SANS, fontSize: 12.5, fontWeight: 600, color: `var(--stg-acc-ink,${COLORS.ember})`, padding: 0, marginBottom: 16 }}><ArrowLeft size={13} strokeWidth={2.5} /> Back to quiz</button></div>
            <p style={{ fontFamily: SERIF, fontStyle: 'italic', fontSize: 19, color: INK, maxWidth: 480, margin: '0 auto 18px' }}>{ended ? `You scored ${dispScore} of ${total}. Challenge someone to beat it.` : 'Send this quiz to someone who thinks they know better.'}</p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, justifyContent: 'center', marginBottom: 14 }}>
              {[['x', 'X'], ['reddit', 'Reddit'], ['facebook', 'Facebook'], ['whatsapp', 'WhatsApp']].map(([k, label]) => (
                <button key={k} onClick={() => openShare(k)} style={{ fontFamily: MONO, fontSize: 12, letterSpacing: '0.06em', textTransform: 'uppercase', fontWeight: 700, padding: '10px 18px', borderRadius: 10, border: `1.5px solid var(--stg-line,${COLORS.ink})`, background: `var(--stg-surf,${COLORS.cream})`, color: INK, cursor: 'pointer' }}>{label}</button>
              ))}
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, justifyContent: 'center' }}>
              <a href={`/duel/new?quiz=${encodeURIComponent(quiz.id)}`} style={{ fontFamily: MONO, fontSize: 12, letterSpacing: '0.06em', textTransform: 'uppercase', fontWeight: 700, padding: '10px 20px', borderRadius: 10, border: 'none', background: `var(--stg-surf2,${COLORS.ink})`, color: `var(--stg-ink,${T.white})`, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 8, textDecoration: 'none' }}><Swords size={14} strokeWidth={2.5} /> Challenge Someone</a>
              <button onClick={copyResult} style={{ fontFamily: MONO, fontSize: 12, letterSpacing: '0.06em', textTransform: 'uppercase', fontWeight: 700, padding: '10px 20px', borderRadius: 10, border: `1.5px solid var(--stg-line,${COLORS.ink})`, background: `var(--stg-surf,${COLORS.cream})`, color: INK, cursor: 'pointer' }}>Copy result</button>
              <button onClick={downloadPromoImage} style={{ fontFamily: MONO, fontSize: 12, letterSpacing: '0.06em', textTransform: 'uppercase', fontWeight: 700, padding: '10px 20px', borderRadius: 10, border: `1.5px solid var(--stg-line,${COLORS.ink})`, background: `var(--stg-surf,${COLORS.cream})`, color: INK, cursor: 'pointer' }}>Save quiz image</button>
              {ended && (
                <button onClick={downloadResultImage} style={{ fontFamily: MONO, fontSize: 12, letterSpacing: '0.06em', textTransform: 'uppercase', fontWeight: 700, padding: '10px 20px', borderRadius: 10, border: `1.5px solid var(--stg-line,${COLORS.ink})`, background: `var(--stg-surf,${COLORS.cream})`, color: INK, cursor: 'pointer' }}>Download image</button>
              )}
            </div>
            <div style={{ fontFamily: MONO, fontSize: 12, color: FADED, marginTop: 16, wordBreak: 'break-all' }}>{shareUrl}</div>
          </div>
        )}

        {/* ── JOIN THE LEADERBOARD (sign-up) ── */}
        {tab === 'join' && (
          <div><button onClick={() => setTab('play')} style={{ display: 'inline-flex', alignItems: 'center', gap: 5, background: 'none', border: 'none', cursor: 'pointer', fontFamily: SANS, fontSize: 12.5, fontWeight: 600, color: `var(--stg-acc-ink,${COLORS.ember})`, padding: 0, marginBottom: 16 }}><ArrowLeft size={13} strokeWidth={2.5} /> Back to quiz</button><JoinLeaderboardForm identity={identity} onJoined={(id) => { setIdentity(id); refreshBoard(); setTab('stats'); }} onViewLeaderboard={() => setTab('stats')} /></div>
        )}

        {(asOfLabel || quiz.source) && (
          <div style={{ marginTop: 36, paddingTop: 16, borderTop: `1px solid var(--stg-line,${COLORS.faded}33)`, fontFamily: MONO, fontSize: 11, letterSpacing: '0.06em', color: FADED, textAlign: 'center' }}>
            {asOfLabel && <span style={{ textTransform: 'uppercase', letterSpacing: '0.1em' }}>Data as of {asOfLabel}</span>}
            {asOfLabel && quiz.source && <span style={{ opacity: 0.6 }}>{'  \u00b7  '}</span>}
            {quiz.source && (
              <>Source:{' '}
                {quiz.source.url ? (
                  <a href={quiz.source.url} target="_blank" rel="noopener noreferrer" style={{ color: `var(--stg-acc-ink,${COLORS.ember})` }}>{quiz.source.label}</a>
                ) : (
                  quiz.source.label
                )}
              </>
            )}
          </div>
        )}

        {ended && seriesParts.length > 0 && (
          <div style={{ marginTop: 40, paddingTop: 24, borderTop: `1px solid var(--stg-line,${COLORS.faded}33)` }}>
            <div style={{ fontFamily: MONO, fontSize: 11, letterSpacing: '0.16em', textTransform: 'uppercase', color: `var(--stg-acc-ink,${COLORS.ember})`, marginBottom: 16 }}>Rest of the series</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 10 }}>
              {seriesParts.map((sp) => {
                const m = sp.id.match(/-(\d+)$/);
                const partLabel = `Part ${m ? m[1] : '1'}`;
                return (
                  <a key={sp.id} href={`/quiz/${sp.id}`} style={{ textDecoration: 'none', color: `var(--stg-onramp,${T.white})`, background: `var(--stg-acc,${T.accent})`, borderRadius: 10, border: `1px solid ${T.accent}`, padding: '12px 14px', display: 'block', transition: 'all 0.15s ease' }}>
                    <div style={{ fontFamily: MONO, fontSize: 9, letterSpacing: '0.16em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.82)', fontWeight: 700, marginBottom: 6 }}>{partLabel}</div>
                    <div style={{ fontFamily: SERIF, fontSize: 16, fontWeight: 600, lineHeight: 1.15 }}>{sp.title}</div>
                  </a>
                );
              })}
            </div>
          </div>
        )}

      </div>
      {/* Game Over modal removed 2026-07-02: the end-of-game surface is now the
          inline results card in the play area (shared by desktop + mobile, which
          drops out of the play overlay the moment the round ends), so there is no
          overlay to dismiss. The gameOverDismissed state is retained but unused. */}
      {qOpen && (
        <div
          onClick={() => setQOpen(false)}
          style={{ position: 'fixed', inset: 0, zIndex: 60, background: 'rgba(26,22,17,0.55)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '6vh 16px' }}
        >
          <div onClick={(e) => e.stopPropagation()} style={{ width: '100%', maxWidth: 480, background: `var(--stg-panel,${COLORS.cream})`, borderRadius: 10, border: `2px solid ${COLORS.ink}`, padding: 24 }}>
            {qSent ? (
              <>
                <h3 style={{ fontFamily: SERIF, fontWeight: 700, fontSize: 22, margin: '0 0 10px' }}>Thanks, noted.</h3>
                <p style={{ fontFamily: SANS, fontSize: 15, color: FADED, margin: '0 0 20px' }}>
                  Your question went to the editors' desk. We read every one.
                </p>
                <button
                  onClick={() => { setQOpen(false); setQSent(false); setQMsg(''); setQName(''); setQEmail(''); }}
                  style={{ cursor: 'pointer', background: `var(--stg-surf2,${COLORS.ink})`, color: COLORS.cream, borderRadius: 10, border: `1.5px solid var(--stg-line,${COLORS.ink})`, padding: '12px 20px', fontFamily: MONO, fontSize: 11, letterSpacing: '0.16em', textTransform: 'uppercase', fontWeight: 600 }}
                >
                  Close
                </button>
              </>
            ) : (
              <>
                <h3 style={{ fontFamily: SERIF, fontWeight: 700, fontSize: 22, margin: '0 0 6px' }}>Comments? Critique?</h3>
                <p style={{ fontFamily: SANS, fontSize: 14, color: FADED, margin: '0 0 14px' }}>
                  Spot an answer that should count, or something off about this quiz? Tell the editors.
                </p>
                <div style={{ display: 'flex', gap: 10, marginBottom: 10, flexWrap: 'wrap' }}>
                  <input
                    type="text"
                    value={qName}
                    onChange={(e) => setQName(e.target.value)}
                    maxLength={120}
                    placeholder="Name (optional)"
                    style={{ flex: 1, minWidth: 140, boxSizing: 'border-box', padding: 12, borderRadius: 10, border: `1.5px solid var(--stg-line,${COLORS.ink})`, background: `var(--stg-surf,${COLORS.paper})`, fontFamily: SANS, fontSize: 14, color: INK, outline: 'none' }}
                  />
                  <input
                    type="email"
                    value={qEmail}
                    onChange={(e) => setQEmail(e.target.value)}
                    maxLength={200}
                    placeholder="Email (optional)"
                    style={{ flex: 1, minWidth: 140, boxSizing: 'border-box', padding: 12, borderRadius: 10, border: `1.5px solid var(--stg-line,${COLORS.ink})`, background: `var(--stg-surf,${COLORS.paper})`, fontFamily: SANS, fontSize: 14, color: INK, outline: 'none' }}
                  />
                </div>
                <p style={{ fontFamily: MONO, fontSize: 11, color: FADED, margin: '-2px 0 14px', letterSpacing: '0.02em' }}>
                  Include your email for a direct response.
                </p>
                <textarea
                  value={qMsg}
                  onChange={(e) => setQMsg(e.target.value)}
                  maxLength={1000}
                  rows={4}
                  placeholder="What's your question or comment? (optional)"
                  style={{ width: '100%', boxSizing: 'border-box', padding: 12, borderRadius: 10, border: `1.5px solid var(--stg-line,${COLORS.ink})`, background: `var(--stg-surf,${COLORS.paper})`, fontFamily: SANS, fontSize: 14, color: INK, outline: 'none', resize: 'vertical', marginBottom: 16 }}
                />
                <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
                  <button
                    onClick={() => setQOpen(false)}
                    style={{ cursor: 'pointer', background: 'transparent', color: INK, borderRadius: 10, border: `1.5px solid var(--stg-line,${COLORS.ink})`, padding: '10px 18px', fontFamily: MONO, fontSize: 11, letterSpacing: '0.14em', textTransform: 'uppercase', fontWeight: 600 }}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={submitQuestion}
                    disabled={qBusy}
                    style={{ cursor: 'pointer', background: `var(--stg-acc,${COLORS.ember})`, color: `var(--stg-onramp,${T.white})`, borderRadius: 10, border: `1.5px solid var(--stg-acc,${COLORS.ember})`, padding: '10px 18px', fontFamily: MONO, fontSize: 11, letterSpacing: '0.14em', textTransform: 'uppercase', fontWeight: 700, opacity: qBusy ? 0.6 : 1 }}
                  >
                    {qBusy ? 'Sending...' : 'Send to editors'}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {!QSTAGE && <Footer />}
    </div>
  );
}

function ghostBtn(disabled) {
  return { fontFamily: MONO, fontSize: 11, letterSpacing: '0.08em', textTransform: 'uppercase', fontWeight: 600, padding: '10px 18px', background: 'transparent', color: `var(--stg-mute,${COLORS.faded})`, borderRadius: 10, border: `1px solid var(--stg-line,${COLORS.faded}55)`, cursor: disabled ? 'default' : 'pointer', opacity: disabled ? 0.4 : 1, display: 'inline-flex', alignItems: 'center', gap: 6 };
}

const labelStyle = { display: 'block', fontFamily: MONO, fontSize: 10, letterSpacing: '0.14em', textTransform: 'uppercase', color: `var(--stg-mute,${COLORS.faded})`, marginBottom: 6 };
const fieldStyle = { width: '100%', fontFamily: SANS, fontSize: 16, padding: '12px 14px', borderRadius: 10, border: `1.5px solid var(--stg-line,${COLORS.ink})`, background: `var(--stg-surf,${T.white})`, color: `var(--stg-ink,${COLORS.ink})` };

function StatBox({ label, value, accent }) {
  return (
    <div style={{ background: `var(--stg-surf,${T.white})`, borderRadius: 12, border: `1px solid var(--stg-line,${COLORS.line})`, padding: '16px 14px', textAlign: 'center' }}>
      <div style={{ fontFamily: SERIF, fontWeight: 800, fontSize: 28, lineHeight: 1, color: accent ? COLORS.ember : `var(--stg-ink,${COLORS.ink})` }}>{value}</div>
      <div style={{ fontFamily: SANS, fontSize: 10, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', color: `var(--stg-mute,${COLORS.soft})`, marginTop: 7 }}>{label}</div>
    </div>
  );
}
