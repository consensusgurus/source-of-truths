'use client';

// Docket — the daily deduction game.
//
// One setup, four to seven conditions, five questions. The conditions stay PINNED
// on screen while you work, because that is the whole shape of the format: you
// read a small formal system once, diagram it, and then answer several questions
// off the same diagram. Reusing the deductions is the game, so anything that made
// you scroll back to the rules would be taking the game away.
//
// The format is a familiar but retired section of an important standardized test.
// We do not name it anywhere, here or in the metadata, on purpose.
//
// Scoring: one point per question, out of five. Ties on the daily board break by
// fewest wrong, then fastest time, so `guessesUsed` posts the wrong count.
//
// No answer key is shipped: page.js sends each day's formal spec and its rendered
// prose, and solveDay() here enumerates every arrangement the conditions allow to
// derive which choice is correct. That is for integrity rather than secrecy, since
// anyone holding the conditions can already deduce the answers, which is the whole
// point of the format. Deriving beats storing because a stored key is a second
// copy of the truth and second copies drift. Enumeration is milliseconds, memoised
// for the day.
//
// Same daily plumbing as Suffice/Sworn/Alibi: banked days gated by Eastern date
// on the server, per-day localStorage saves, /docket?p=N archive pinning, streaks
// and stats, and the shared /api/quiz/* board flow.
//
// Two working tools, both saved with the day so a reload cannot cost you them:
// a SCRATCHPAD pinned under the conditions, which carries across all five
// questions because the diagram is the thing you are meant to reuse, and a
// CROSS-OFF on each choice. A crossed choice is LOCKED rather than merely
// struck through: you get one shot per question with no going back, so ruling a
// choice out has to protect you from a stray tap on it as well. Tapping a
// crossed choice brings it back instead of answering. Neither tool touches the
// score, the clock, or what posts to the board.

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useSearchParams } from 'next/navigation';
import { HelpCircle, X, Check, Minus, ChevronDown, ChevronUp, Scale, Pencil } from 'lucide-react';
import Grain from '../Grain';
import Footer from '../Footer';
import useDuelContext, { DuelBanner } from '../quiz/[id]/useDuelContext';
import DailyGamesGrid from '../DailyGamesGrid';
import DailyEndCard from '../DailyEndCard';
import DailyChrome from '../DailyChrome';
import DailyBoardPanel from '../quiz/[id]/DailyBoardPanel';
import useAbandonFlush from '../quiz/[id]/useAbandonFlush';
import DailyMasthead from '../DailyMasthead';
import { isLoft } from '@/lib/loft';
import ReportIssue from '../ReportIssue';
import LoftCap from '../LoftCap';
import StageChrome from '../StageChrome';
import { isStage } from '@/lib/stage';
import { useStageTheme } from '@/lib/stage-theme';
import { gameColor, gameColorLight, RAMP_INK, STAGE_GROUND, gameOnrampLight, gameAccentInkLight } from '@/lib/category-ramp';
import GamePanel from '../GamePanel';
import { useRunEmbed } from '../RunEmbed';
import useIqStanding from '../useIqStanding';
import useNextUnplayed, { useUnplayedSimilar } from '../useNextUnplayed';
import useDailyBoard from '../useDailyBoard';
import useGameAllTime from '../useGameAllTime';
import useDayStats from '../useDayStats';
import useCategoryRank from '../useCategoryRank';
import LoftFinish from '../LoftFinish';
import AddToHome from '../AddToHome';
import { CONTEST, contestIsLive } from '@/lib/contest';
import DailyRules from '../DailyRules';
import { isMobileDevice } from '@/lib/is-mobile';
import { T } from '@/lib/theme';
import { solveDay, CHOICE_KEYS, showSolution, WORD } from './engine';

const COLORS = {
  ink: T.ink,
  faded: T.muted,
  accent: '#5b2333',        // Docket identity — a law-library oxblood
  accentSoft: '#f7e8ec',
  accentDeep: '#3d1622',
  green: T.successDeep,
};
const SANS = "'Manrope', system-ui, -apple-system, sans-serif";
const MONO = "'Manrope', ui-monospace, 'SFMono-Regular', monospace";
const HELP_KEY = 'sot_docket_help_seen';

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
function getAnonId() {
  try {
    let a = localStorage.getItem('sot_quiz_anon');
    if (!a) { a = Math.random().toString(36).slice(2) + Date.now().toString(36); localStorage.setItem('sot_quiz_anon', a); }
    return a;
  } catch (e) { return ''; }
}

// cross[i] is a bitmask over that question's choices, notes is the day's
// scratchpad. Both are absent from every save written before they existed, so
// the load merge below leaves them at these defaults and no version bump (which
// would discard a day in progress) is needed.
const freshState = (n) => ({ v: 1, i: 0, picks: Array(n).fill(null), cross: Array(n).fill(0), notes: '', notesOpen: false, t0: null, tEnd: null, status: 'playing' });
const EMPTY_BOARD = { plays: 0, best: null, leaderboard: [] };

// ── stats (same shape every daily uses) ──────────────────────────────────────
const STATS_KEY = 'sot_docket_stats';
function getStats() {
  try { const s = JSON.parse(localStorage.getItem(STATS_KEY)); return s && s.byNum ? s : { byNum: {} }; }
  catch (e) { return { byNum: {} }; }
}
function recordStat(num, rec) {
  const s = getStats();
  const s2 = { ...s, byNum: { ...s.byNum, [num]: rec } };
  try { localStorage.setItem(STATS_KEY, JSON.stringify(s2)); } catch (e) {}
  return s2;
}
function deriveStats(stats, todayNum) {
  if (!stats) return { played: 0, wins: 0, cur: 0, max: 0 };
  const byNum = stats.byNum || {};
  const nums = Object.keys(byNum).map(Number).sort((a, b) => a - b);
  const played = nums.length;
  const wins = nums.filter((n) => byNum[n].won).length;
  let cur = 0;
  for (let n = todayNum; n >= 1; n--) {
    const r = byNum[n];
    if (!r) { if (n === todayNum) continue; break; }
    if (!r.won) break;
    cur++;
  }
  let max = 0, run = 0, prev = null;
  for (const n of nums) {
    if (!byNum[n].won) { run = 0; prev = n; continue; }
    run = prev !== null && n === prev + 1 ? run + 1 : 1;
    if (run > max) max = run;
    prev = n;
  }
  return { played, wins, cur, max: Math.max(max, cur) };
}

// ── the sketch ───────────────────────────────────────────────────────────────
// A free working surface: the day's real entity letters and the day's real
// slots, laid out the way the archetype is shaped. It is the player's own
// bookkeeping and nothing else: purely local state, never scored, never saved,
// never posted, and gone on a new puzzle or a replay (the parent keys this
// component on the puzzle number plus a reset counter, so remounting IS the
// clear). It shows only what the player puts in it, so it can never hold an
// answer the board does not already show.
//
// One shape per archetype:
//   seq   one slot per position, in order
//   hyb   one slot per position, plus a mark under each filled slot for the
//         second dimension (the asterisk the choices use)
//   sel   one slot per pick, unordered (the ones chosen); the tray is the rest
//   match one zone per group, each holding any number of letters
//
// Paintings get picture frames (a physical object, so it keeps fixed colours
// that read on both grounds); every other theme gets neutral slots.
const FRAMED = new Set(['gallery', 'groupshow']);
const FRAME = { edge: '#7a6a4a', canvas: '#e8e0cc', ink: '#2a2418' };

function capFirst(s) { return s ? s.charAt(0).toUpperCase() + s.slice(1) : s; }

function DocketSketch({ spec, notes, notesOpen, onNotes, onToggleNotes, total }) {
  const k = spec.k;
  const ents = spec.ents || [];
  const theme = spec.theme || {};
  const framed = FRAMED.has(theme.id);
  const isMatch = k === 'match';
  const isSel = k === 'sel';
  const isHyb = k === 'hyb';
  const slotCount = isMatch ? (spec.groups || []).length : isSel ? (spec.pick || 0) : ents.length;
  const slotLabel = (i) => (isMatch ? ((theme.groupsShort || [])[i] || String(i + 1)) : isSel ? theme.verb : String(i + 1));
  const [at, setAt] = useState(() => Array(ents.length).fill(null));
  const [mark, setMark] = useState(() => Array(ents.length).fill(false));
  const [pick, setPick] = useState(null);

  const inSlot = (s) => ents.map((_, e) => e).filter((e) => at[e] === s);
  const tray = ents.map((_, e) => e).filter((e) => at[e] === null);

  function tapTray(e) { setPick((p) => (p === e ? null : e)); }
  function placeAt(s) {
    if (pick === null) return false;
    setAt((cur) => {
      const nx = cur.slice();
      // A one-letter slot sends its occupant back to the tray.
      if (!isMatch) cur.forEach((v, e) => { if (v === s) nx[e] = null; });
      nx[pick] = s;
      return nx;
    });
    setPick(null);
    return true;
  }
  function sendBack(e) { setAt((cur) => { const nx = cur.slice(); nx[e] = null; return nx; }); }
  function tapSlot(s) {
    if (placeAt(s)) return;
    const occ = inSlot(s);
    if (!isMatch && occ.length) sendBack(occ[0]);
  }
  function clearAll() { setAt(Array(ents.length).fill(null)); setMark(Array(ents.length).fill(false)); setPick(null); }

  const tileCls = (e, extra = '') => `dk-tile${framed ? ' fr' : ''}${pick === e ? ' sel' : ''}${extra}`;
  const letter = (e) => (<>{ents[e]}{isHyb && mark[e] && <sup className="dk-star">*</sup>}</>);

  const slotWord = isMatch ? (theme.groupNoun || 'group') : isSel ? 'slot' : (theme.slot || 'position');
  const head = isMatch
    ? `Your sketch · ${theme.groupNouns || 'groups'}`
    : isSel ? `Your sketch · the ${WORD[slotCount] || slotCount} ${theme.verb}` : `Your sketch · ${theme.slots || 'positions'} 1 to ${slotCount}`;
  const placed = ents.length - tray.length;

  return (
    <div className="dk-panel dk-sketch">
      <div className="dk-skhead">
        <span className="dk-sklab">{head}</span>
        <span className="dk-skfree">Free, not scored</span>
      </div>
      <div className="dk-skhow">
        Tap a letter in the tray, then tap a {slotWord} to put it there. Tap a placed letter to send it back.
        {isHyb && <> The * under a filled {theme.slot || 'slot'} marks that one {theme.attrShort}.</>}
      </div>

      {isMatch ? (
        <div className="dk-zones" style={{ gridTemplateColumns: `repeat(${slotCount}, minmax(0,1fr))` }}>
          {Array.from({ length: slotCount }, (_, s) => (
            <div key={s}
              className={`dk-zone${pick !== null ? ' armed' : ''}`}
              role="button" tabIndex={0}
              aria-label={pick !== null ? `Put ${ents[pick]} on ${slotLabel(s)}` : `${capFirst(slotLabel(s))}: ${inSlot(s).map((e) => ents[e]).join(', ') || 'empty'}`}
              onClick={() => placeAt(s)}
              onKeyDown={(ev) => { if (ev.key === 'Enter' || ev.key === ' ') { ev.preventDefault(); placeAt(s); } }}>
              <span className="dk-zlab">{slotLabel(s)}</span>
              <div className="dk-ztiles">
                {inSlot(s).map((e) => (
                  <button key={e} type="button" className={tileCls(e)} aria-label={`Send ${ents[e]} back to the tray`}
                    onClick={(ev) => { ev.stopPropagation(); if (pick !== null) placeAt(s); else sendBack(e); }}>{letter(e)}</button>
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="dk-slots" style={{ gridTemplateColumns: `repeat(${slotCount}, minmax(0,1fr))` }}>
          {Array.from({ length: slotCount }, (_, s) => {
            const occ = inSlot(s)[0];
            const has = occ !== undefined;
            return (
              <div key={s} className="dk-slotcol">
                <button type="button"
                  className={`dk-slot${framed ? ' fr' : ''}${has ? ' full' : ''}${pick !== null ? ' armed' : ''}`}
                  aria-label={pick !== null ? `Put ${ents[pick]} in ${slotWord} ${slotLabel(s)}` : has ? `Send ${ents[occ]} back from ${slotWord} ${slotLabel(s)}` : `${capFirst(slotWord)} ${slotLabel(s)}, empty`}
                  onClick={() => tapSlot(s)}>
                  {has ? letter(occ) : ''}
                </button>
                <span className="dk-slotn">{slotLabel(s)}</span>
                {isHyb && has && (
                  <button type="button" className={`dk-mark${mark[occ] ? ' on' : ''}`} aria-pressed={mark[occ]}
                    aria-label={`Mark ${ents[occ]} ${theme.attrShort}`}
                    onClick={() => setMark((cur) => { const nx = cur.slice(); nx[occ] = !nx[occ]; return nx; })}>*</button>
                )}
              </div>
            );
          })}
        </div>
      )}

      <div className="dk-tray">
        <span className="dk-traylab">Tray</span>
        {tray.length ? tray.map((e) => (
          <button key={e} type="button" className={tileCls(e)} aria-pressed={pick === e}
            aria-label={pick === e ? `${ents[e]} picked up, tap a ${slotWord}` : `Pick up ${ents[e]}`}
            onClick={() => tapTray(e)}>{letter(e)}</button>
        )) : <span className="dk-trayempty">Every letter is placed.</span>}
        {placed > 0 && <button type="button" className="dk-fold dk-skclear" onClick={clearAll}>Clear sketch</button>}
      </div>

      {/* The scratchpad folds in here: the written half of the same diagram. It
          IS saved with the day, as it always was. */}
      <div className="dk-sknotes">
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
          <Pencil size={14} style={{ flex: '0 0 auto', color: 'var(--stg-acc-ink, #5b2333)' }} />
          <span className="dk-sklab" style={{ flex: '0 0 auto' }}>Notes</span>
          {!notesOpen && !!(notes || '').trim() && (
            <span className="dk-nlead">{(notes || '').trim().split('\n')[0]}</span>
          )}
          <button className="dk-fold" style={{ marginLeft: 'auto', flex: '0 0 auto' }} onClick={onToggleNotes}>
            {notesOpen ? <>Hide <ChevronUp size={13} /></> : <>Write <ChevronDown size={13} /></>}
          </button>
        </div>
        {notesOpen && (
          <textarea
            className="dk-notes"
            value={notes || ''}
            onChange={(e) => onNotes(e.target.value)}
            placeholder={`Write deductions here. Unlike the sketch, notes stay with you through all ${total} questions and through a reload.`}
            rows={4}
            spellCheck={false}
            aria-label="Scratchpad notes"
          />
        )}
      </div>
    </div>
  );
}

// "N, K*, J" -> [{ l: 'N', star: false }, { l: 'K', star: true }, ...]
function seqBoxes(txt) {
  return String(txt).split(',').map((s) => s.trim()).filter(Boolean).map((s) => ({ l: s.replace(/\*$/, ''), star: /\*$/.test(s) }));
}

export default function DocketClient({ puzzles = [], forceNum = null }) {
  const PUZZLE = useMemo(() => pickPuzzle(puzzles, forceNum), [puzzles, forceNum]);
  const QS = PUZZLE.questions;
  const TOTAL = QS.length;
  const STORE_KEY = `sot_docket_${PUZZLE.num}`;

  // Every arrangement the conditions allow, and the derived key. Once per day.
  const SOLVED = useMemo(() => solveDay(PUZZLE), [PUZZLE]);
  const KEY = SOLVED.keys.map((k) => k.correct);

  const [g, setG] = useState(() => freshState(TOTAL));
  const [revealed, setRevealed] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const [gateRules, setGateRules] = useState(false);
  const [endClosed, setEndClosed] = useState(false);
  // The finished board starts turned OVER, showing what to do next.
  const [loftRevealed, setLoftRevealed] = useState(false);
  const [shareCta, setShareCta] = useState('Share');
  useEffect(() => {
    if (contestIsLive()) setShareCta(`Share for ${CONTEST.prizeLabel}*`);
  }, []);
  const [hydrated, setHydrated] = useState(false);
  const [board, setBoard] = useState(EMPTY_BOARD);
  const [identity, setIdentity] = useState(null);
  const [stats, setStats] = useState(null);
  const [copied, setCopied] = useState(false);
  const [mobileUi, setMobileUi] = useState(false);
  const [setupOpen, setSetupOpen] = useState(true);
  // Bumped by a replay so the sketch (keyed on it) starts clean.
  const [sketchGen, setSketchGen] = useState(0);
  const searchParams = useSearchParams();
  const { duelToken, duelInfo, duelSubmitted } = useDuelContext(PUZZLE.quizId, searchParams);
  const viewedRef = useRef(false);

  const playing = g.status === 'playing';
  const LOFT = isLoft('docket');
  const STAGE = isStage('docket', searchParams);
  const STAGE_C = STAGE ? 'var(--stg-acc)' : gameColor('docket');
  const Cap = STAGE ? StageChrome : LoftCap;
  const STAGE_ACC = { '--stg-acc-dk': gameColor('docket'), '--stg-acc-lt': gameColorLight('docket'), '--stg-onramp-lt': gameOnrampLight('docket'), '--stg-acc-ink-lt': gameAccentInkLight('docket') };
  const [stageTheme] = useStageTheme();
  // Inside the Judged run (app/RunEmbed.jsx) the page furniture drops away
  // and the board sits on the run's dark ground; the game itself is unchanged.
  const EMBED = useRunEmbed();
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
  const ACC_DEEP_INK = STAGE ? 'var(--stg-acc-ink)' : COLORS.accentDeep;
  const ACC_SOFT = STAGE ? 'var(--stg-line,rgba(255,255,255,0.11))' : COLORS.accentSoft;
  const ON_ACC = STAGE ? 'var(--stg-onramp, #08222e)' : 'var(--white)';
  const prevPuzzle = puzzles.find((x) => x.num === PUZZLE.num - 1) || null;
  const [showChrome, setShowChrome] = useState(false);
  const focusMode = playing && !showChrome;
  const preStart = playing && !g.t0;
  const idx = Math.min(g.i, TOTAL - 1);
  const q = QS[idx];
  const correct = g.picks.filter((p, i) => p !== null && p === KEY[i]).length;
  const wrong = g.picks.filter((p, i) => p !== null && p !== KEY[i]).length;
  const score = correct;

  useEffect(() => { try { setMobileUi(isMobileDevice()); } catch (e) {} }, []);
  // On a phone the setup paragraph folds away once you start, because the
  // CONDITIONS are what you keep needing and the setup is read once.
  useEffect(() => { if (mobileUi && g.t0) setSetupOpen(false); }, [mobileUi, g.t0]);

  // ---- persistence ----
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORE_KEY);
      if (raw) {
        const saved = JSON.parse(raw);
        if (saved && saved.v === 1 && Array.isArray(saved.picks) && saved.picks.length === TOTAL) {
          const merged = { ...freshState(TOTAL), ...saved };
          if (!Array.isArray(merged.cross) || merged.cross.length !== TOTAL) merged.cross = Array(TOTAL).fill(0);
          if (typeof merged.notes !== 'string') merged.notes = '';
          setG(merged);
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
        if (done || g.t0) localStorage.setItem('sot_docket_day', JSON.stringify({ d: etToday(), done }));
        else localStorage.removeItem('sot_docket_day');
      }
    } catch (e) {}
  }, [g, hydrated, STORE_KEY, PUZZLE, puzzles]);

  // Live clock, ticked from state so the readout moves on its own.
  const [nowTick, setNowTick] = useState(() => Date.now());
  useEffect(() => {
    if (!playing || !g.t0 || g.tEnd) return undefined;
    setNowTick(Date.now());
    const iv = setInterval(() => setNowTick(Date.now()), 500);
    return () => clearInterval(iv);
  }, [playing, g.t0, g.tEnd]);
  const elapsed = g.t0 ? fmtTime((g.tEnd || nowTick) - g.t0) : '0:00';

  // ---- metrics + leaderboard ----
  useEffect(() => {
    try {
      const id = JSON.parse(localStorage.getItem('sot_quiz_identity'));
      if (id && id.email) setIdentity(id);
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

  // An abandoned day still records, per the site-wide rule. Answering at least
  // one question is the "started" signal; opening the page and leaving is not.
  const REC_KEY = `sot_docket_rec_${PUZZLE.num}`;
  const abandon = useAbandonFlush(() => {
    if (!playing || !g.picks.some((p) => p !== null)) return null;
    try { if (localStorage.getItem(REC_KEY)) return null; } catch (e) {}
    const el = Math.min(36000, Math.max(1, Math.round((Date.now() - (g.t0 || Date.now())) / 1000)));
    try { localStorage.setItem(REC_KEY, '1'); } catch (e) {}
    return { quizId: PUZZLE.quizId, score: correct, total: TOTAL, correct, guessesUsed: wrong, timeElapsed: el, abandoned: true, email: identity?.email || undefined, anonId: getAnonId(), isMobile: isMobileDevice(), referrer: (typeof document !== 'undefined' ? document.referrer : '') };
  });

  function postResult(g2, sc, wr) {
    abandon.markFlushed();
    if (EMBED) EMBED.onResult({ key: 'docket', score: sc, total: TOTAL, t0: g2 && g2.t0, tEnd: (g2 && g2.tEnd) || Date.now() });
    const el = g2.t0 ? Math.max(1, Math.round(((g2.tEnd || Date.now()) - g2.t0) / 1000)) : 1;
    try { setStats(recordStat(PUZZLE.num, { s: sc, t: TOTAL, g: wr, won: sc === TOTAL })); } catch (e) {}
    try {
      fetch('/api/quiz/result', {
        method: 'POST', keepalive: true, headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ quizId: PUZZLE.quizId, score: sc, total: TOTAL, correct: sc, guessesUsed: wr, timeElapsed: el, email: identity?.email || undefined, anonId: getAnonId(), isMobile: isMobileDevice(), referrer: (typeof document !== 'undefined' ? document.referrer : '') }),
      })
        .then((r) => r.json())
        .then((d) => { if (d && !d.error) setBoard({ ...EMPTY_BOARD, ...d }); })
        .catch(() => {});
    } catch (e) {}
  }

  function start() {
    setG((cur) => (cur.t0 ? cur : { ...cur, t0: Date.now() }));
    try { localStorage.setItem(HELP_KEY, '1'); } catch (e) {}
    setGateRules(false);
  }

  const crossMask = (i) => ((g.cross || [])[i] || 0);
  const isCrossed = (i, ci) => !!(crossMask(i) & (1 << ci));

  // Your own bookkeeping, so it never touches the score. It DOES stop the
  // choice answering, because Docket allows one answer per question and no
  // going back: having ruled a choice out, you should not be able to lose the
  // question to a stray tap on it. Tapping it again brings it back.
  function toggleCross(ci) {
    if (!playing || revealed || g.picks[idx] !== null) return;
    setG((cur) => {
      const cross = Array.isArray(cur.cross) && cur.cross.length === TOTAL ? cur.cross.slice() : Array(TOTAL).fill(0);
      cross[idx] = (cross[idx] || 0) ^ (1 << ci);
      return { ...cur, cross };
    });
  }

  function answer(ci) {
    if (!playing || revealed || g.picks[idx] !== null) return;
    if (isCrossed(idx, ci)) { toggleCross(ci); return; }
    setG((cur) => {
      const picks = cur.picks.slice();
      picks[idx] = ci;
      return { ...cur, picks };
    });
    setRevealed(true);
  }

  function next() {
    setRevealed(false);
    if (idx + 1 >= TOTAL) {
      setG((cur) => {
        const g2 = { ...cur, status: 'done', tEnd: Date.now() };
        const c = g2.picks.filter((p, i) => p !== null && p === KEY[i]).length;
        const w = g2.picks.filter((p, i) => p !== null && p !== KEY[i]).length;
        postResult(g2, c, w);
        return g2;
      });
    } else {
      setG((cur) => ({ ...cur, i: cur.i + 1 }));
    }
  }

  function resetGame() {
    setG(freshState(TOTAL));
    setRevealed(false);
    setEndClosed(false);
    setSetupOpen(true);
    setSketchGen((n) => n + 1);
  }

  function copyShare() {
    // Squares only. The pattern shows how you did and never which choice was
    // right, so a shared result cannot hand anyone the key.
    const marks = g.picks.map((p, i) => (p === KEY[i] ? '🟥' : '⬜')).join('');
    const txt = `Docket #${PUZZLE.num}\n${score}/${TOTAL} · ${elapsed}\n${marks}\nmindloftdaily.com/docket`;
    try {
      navigator.clipboard.writeText(txt);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (e) {}
  }

  const isTodays = PUZZLE.num === pickPuzzle(puzzles, null).num;
  const iq = useIqStanding({ game: 'docket', quizId: PUZZLE.quizId, active: LOFT && !playing });
  const nextUp = useNextUnplayed({ self: 'docket', active: LOFT && !playing });
  const upNext = useUnplayedSimilar({ self: 'docket', active: LOFT && !playing });
  const dailyBoard = useDailyBoard({ quizId: PUZZLE.quizId, active: LOFT && !playing });
  const allTime = useGameAllTime({ game: 'docket', active: LOFT && !playing });
  const dayStats = useDayStats();
  const catRank = useCategoryRank({ self: 'docket', active: LOFT && !playing });
  const myStats = deriveStats(stats, pickPuzzle(puzzles, null).num);
  const picked = g.picks[idx];
  const answerKey = KEY[idx];
  const hyb = PUZZLE.spec.k === 'hyb';

  return (
    <div className={STAGE ? 'stage-page' : (LOFT ? 'loft-page' : undefined)}
      data-stage-theme={STAGE ? (EMBED ? 'dark' : stageTheme) : undefined}
      style={{ ...(STAGE ? STAGE_ACC : null), minHeight: '100vh', position: 'relative', background: STAGE ? 'var(--stg-ground)' : T.surface, color: STAGE ? 'var(--stg-ink,#e9edf4)' : undefined, overflowX: (STAGE || LOFT) ? 'hidden' : undefined }}>
      {!STAGE && <Grain />}
      {!STAGE && (
      <DailyChrome slug="docket" name="Docket" collapsed={!!g.t0} loft={LOFT} />
      )}
      {LOFT && !EMBED && (
        <Cap gameKey="docket" quizId={PUZZLE.quizId}
          name="Docket"
          cat="Logic"
          outcome={playing ? null : (score > 0 ? 'won' : 'lost')}
          num={PUZZLE.num}
          tiles={playing ? null : upNext}
          dateLabel={PUZZLE.dateLabel}
          onHelp={() => setShowHelp(true)}
          sunday={PUZZLE.sunday ? 'Sunday Edition' : null}
          figures={playing ? [
            { v: `${score}/${TOTAL}`, k: 'score' },
            { v: elapsed, k: 'time' },
          ] : [
            { v: `${score}/${TOTAL}`, k: 'score' },
            { v: elapsed, k: 'time' },
          ]}
        />
      )}
      <div className="dk-wrap" style={{ position: 'relative', zIndex: 2, maxWidth: 1180, margin: '0 auto', padding: '18px 38px 80px', fontFamily: SANS }}>
        <style dangerouslySetInnerHTML={{ __html: `
          @media(max-width:560px){.dk-wrap{padding-left:12px !important;padding-right:12px !important;}}
          .dk-btn{font-family:${SANS};font-weight:800;font-size:14px;border:2px solid ${STAGE ? 'var(--stg-line2)' : COLORS.accentDeep};background:${STAGE ? 'transparent' : 'var(--white)'};color:${STAGE ? 'var(--stg-ink)' : COLORS.accentDeep};border-radius:8px;padding:9px 16px;cursor:pointer;display:inline-flex;align-items:center;gap:7px;}
          .dk-btn:hover{background:var(--stg-surf2, ${COLORS.accentSoft});}
          .dk-btn.primary{background:var(--stg-acc, ${COLORS.accent});border-color:var(--stg-acc, ${COLORS.accent});color:var(--stg-onramp, var(--white));}
          .dk-btn.primary:hover{background:color-mix(in srgb, var(--stg-acc, ${COLORS.accentDeep}) 86%, var(--stg-ink, var(--white)));}
          .dk-row{display:flex;align-items:stretch;gap:6px;margin-bottom:7px;}
          .dk-choice{display:flex;gap:11px;align-items:flex-start;flex:1;min-width:0;text-align:left;background:${STAGE ? 'var(--stg-surf)' : 'var(--white)'};border: 1.5px solid var(--stg-line, rgba(28,30,36,0.16));border-radius:10px;padding:11px 13px;min-height:48px;box-sizing:border-box;cursor:pointer;font-family:${SANS};font-size:14px;line-height:1.45;color:${INK};}
          .dk-choice:hover:not(:disabled){border-color:var(--stg-acc, ${COLORS.accent});background:var(--stg-surf2, ${COLORS.accentSoft});}
          .dk-choice:disabled{cursor:default;}
          .dk-choice .k{flex:0 0 auto;width:26px;height:26px;border-radius:6px;background:color-mix(in srgb, var(--stg-acc, ${COLORS.accent}) 16%, transparent);color:${STAGE ? 'var(--stg-ink)' : COLORS.accentDeep};font-weight:900;font-size:14px;display:flex;align-items:center;justify-content:center;}
          .dk-choice.right{border-color:${COLORS.green};background:${STAGE ? 'var(--stg-surf2)' : '#dcfce7'};}
          .dk-choice.right .k{background:${COLORS.green};color:var(--white);}
          .dk-choice.wrong{border-color:#b91c1c;background:${STAGE ? 'var(--stg-surf2)' : '#fee2e2'};}
          .dk-choice.wrong .k{background:#b91c1c;color:var(--white);}
          .dk-choice .mono{font-family:${MONO};letter-spacing:0.02em;}
          .dk-choice.off{opacity:0.5;border-style:dashed;}
          .dk-choice.off .t{text-decoration:line-through;}
          .dk-choice.off:hover:not(:disabled){border-color:rgba(28,30,36,0.16);background:${STAGE ? 'var(--stg-surf)' : 'var(--white)'};}
          .dk-x{flex:0 0 auto;width:44px;min-height:44px;border: 1.5px solid var(--stg-line, rgba(28,30,36,0.16));border-radius:10px;background:${STAGE ? 'var(--stg-surf)' : 'var(--white)'};color:${FADED};cursor:pointer;display:flex;align-items:center;justify-content:center;opacity:0.5;padding:0;}
          .dk-x:hover:not(:disabled){opacity:1;border-color:var(--stg-acc, ${COLORS.accent});color:var(--stg-acc-ink, ${COLORS.accent});}
          .dk-x.on{opacity:1;background:var(--stg-acc, ${COLORS.accentDeep});border-color:var(--stg-acc, ${COLORS.accentDeep});color:var(--stg-onramp, var(--white));}
          .dk-x:disabled{cursor:default;}
          .dk-x:disabled:not(.on){opacity:0.16;}
          .dk-x.on:disabled{opacity:0.8;}
          .dk-notes{width:100%;box-sizing:border-box;margin-top:8px;font-family:${MONO};font-size:13px;line-height:1.7;color:${INK};background:${STAGE ? 'var(--stg-surf)' : 'var(--white)'};border: 1px solid var(--stg-line, rgba(28,30,36,0.16));border-radius:8px;padding:9px 11px;resize:vertical;min-height:96px;}
          .dk-notes:focus{outline:none;border-color:var(--stg-acc, ${COLORS.accent});}
          .dk-notes::placeholder{color:${FADED};opacity:0.7;}
          .dk-nlead{font-size:12.5px;font-weight:700;color:${FADED};overflow:hidden;text-overflow:ellipsis;white-space:nowrap;min-width:0;}
          .dk-chips{display:flex;flex-wrap:wrap;gap:7px;}
          .dk-chip{display:inline-flex;align-items:baseline;gap:8px;max-width:100%;box-sizing:border-box;background:var(--stg-surf2, #f6f1f2);border:1.5px solid var(--stg-line2, rgba(28,30,36,0.18));border-radius:18px;padding:7px 12px;font-size:13px;font-weight:700;line-height:1.4;color:${INK};}
          .dk-chip > span{white-space:normal;min-width:0;overflow-wrap:anywhere;}
          .dk-chip .n{font-family:${MONO};font-weight:700;color:var(--stg-acc-ink, ${COLORS.accent});flex:0 0 auto;}
          .dk-sketch{padding:14px 14px 12px;}
          .dk-skhead{display:flex;justify-content:space-between;align-items:baseline;gap:10px;flex-wrap:wrap;}
          .dk-sklab{font-family:${MONO};font-size:10.5px;letter-spacing:0.12em;text-transform:uppercase;font-weight:700;color:var(--stg-acc-ink, ${COLORS.accent});}
          .dk-skfree{font-family:${MONO};font-size:10.5px;letter-spacing:0.1em;text-transform:uppercase;font-weight:700;color:${FADED};}
          .dk-skhow{font-size:12.5px;line-height:1.5;color:${FADED};font-weight:600;margin:5px 0 10px;}
          .dk-slots{display:grid;gap:8px;}
          .dk-slotcol{display:flex;flex-direction:column;align-items:center;gap:4px;min-width:0;}
          .dk-slot{width:100%;min-height:52px;aspect-ratio:3/4;max-height:96px;box-sizing:border-box;border:2px solid var(--stg-cell-line, rgba(28,30,36,0.4));background:var(--stg-cell, #fff);border-radius:8px;display:flex;align-items:center;justify-content:center;font-family:${MONO};font-size:22px;font-weight:500;color:${INK};cursor:pointer;padding:0;}
          .dk-slot.full{background:var(--stg-surf2, #f1f1f3);border-color:var(--stg-line3, rgba(28,30,36,0.5));}
          .dk-slot.armed:not(.full){border-style:dashed;border-color:var(--stg-acc, ${COLORS.accent});}
          .dk-slot.fr{border-width:5px;border-radius:3px;}
          .dk-slot.fr.full{background:${FRAME.canvas};border-color:${FRAME.edge};color:${FRAME.ink};}
          .dk-slotn{font-family:${MONO};font-size:11px;color:${FADED};font-weight:700;}
          .dk-mark{width:100%;min-height:44px;box-sizing:border-box;border:1.5px solid var(--stg-line2, rgba(28,30,36,0.2));background:transparent;border-radius:8px;font-family:${MONO};font-size:18px;font-weight:700;color:${FADED};cursor:pointer;padding:0;}
          .dk-mark.on{background:var(--stg-acc, ${COLORS.accent});border-color:var(--stg-acc, ${COLORS.accent});color:var(--stg-onramp, #fff);}
          .dk-zones{display:grid;gap:8px;}
          .dk-zone{min-height:104px;box-sizing:border-box;border:2px solid var(--stg-cell-line, rgba(28,30,36,0.4));background:var(--stg-cell, #fff);border-radius:10px;padding:6px;display:flex;flex-direction:column;gap:6px;cursor:pointer;min-width:0;}
          .dk-zone.armed{border-style:dashed;border-color:var(--stg-acc, ${COLORS.accent});}
          .dk-zone:focus-visible,.dk-slot:focus-visible,.dk-tile:focus-visible{outline:2px solid var(--stg-acc, ${COLORS.accent});outline-offset:2px;}
          .dk-zlab{font-family:${MONO};font-size:10.5px;letter-spacing:0.08em;text-transform:uppercase;font-weight:700;color:${FADED};text-align:center;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;}
          .dk-ztiles{display:flex;flex-wrap:wrap;gap:5px;justify-content:center;}
          .dk-tray{display:flex;flex-wrap:wrap;gap:7px;align-items:center;margin-top:12px;}
          .dk-traylab{font-family:${MONO};font-size:10px;letter-spacing:0.14em;text-transform:uppercase;font-weight:700;color:${FADED};margin-right:2px;}
          .dk-trayempty{font-size:12.5px;color:${FADED};font-weight:600;}
          .dk-skclear{margin-left:auto;min-height:44px;}
          .dk-tile{width:44px;height:48px;box-sizing:border-box;border:2px solid var(--stg-line3, rgba(28,30,36,0.5));background:var(--stg-surf2, #f1f1f3);border-radius:7px;display:inline-flex;align-items:center;justify-content:center;font-family:${MONO};font-size:18px;font-weight:500;color:${INK};cursor:pointer;padding:0;transition:transform .12s;}
          .dk-tile.fr{border:3px solid ${FRAME.edge};background:${FRAME.canvas};color:${FRAME.ink};border-radius:4px;}
          .dk-tile.sel{background:var(--stg-acc, ${COLORS.accent});border-color:var(--stg-acc, ${COLORS.accent});color:var(--stg-onramp, #fff);transform:translateY(-3px);}
          .dk-star{font-size:.62em;margin-left:1px;}
          .dk-sknotes{margin-top:12px;padding-top:10px;border-top:1px solid var(--stg-line, rgba(28,30,36,0.12));}
          .dk-seq{display:inline-flex;flex-wrap:wrap;gap:4px;}
          .dk-sbox{width:28px;height:32px;box-sizing:border-box;border:2px solid var(--stg-cell-line, rgba(28,30,36,0.4));background:var(--stg-cell, #fff);border-radius:4px;display:inline-flex;align-items:center;justify-content:center;font-family:${MONO};font-size:14px;font-weight:500;color:${INK};}
          .dk-choice.off .dk-sbox{border-style:dashed;}
          .dk-struck{margin-left:auto;align-self:center;flex:0 0 auto;font-family:${MONO};font-size:10.5px;letter-spacing:0.1em;text-transform:uppercase;font-weight:700;color:${FADED};}
          @media(max-width:640px){
            .dk-slots,.dk-zones{gap:5px;}
            .dk-slot{font-size:17px;border-radius:6px;}
            .dk-slot.fr{border-width:4px;}
            .dk-sketch{padding:12px 10px 10px;}
            .dk-chip{font-size:12px;padding:6px 10px;}
            .dk-sbox{width:26px;height:30px;font-size:13px;}
            .dk-seq{gap:3px;}
            .dk-struck{display:none;}
          }
          .dk-pip{width:100%;height:5px;border-radius:3px;background:rgba(28,30,36,0.13);}
          .dk-pip.on{background:var(--stg-acc, ${COLORS.accent});}
          .dk-pip.miss{background:#b91c1c;}
          .dk-panel{background:${STAGE ? 'var(--stg-surf)' : 'var(--white)'};border: 1px solid var(--stg-line, rgba(28,30,36,0.14));border-radius:11px;padding:12px 14px;margin-bottom:10px;}
          .dk-setup{font-size:14px;line-height:1.6;color:${FADED};font-weight:600;}
          .dk-fold{background:none;border:none;padding:0;cursor:pointer;font-family:${MONO};font-size:10.5px;letter-spacing:0.09em;text-transform:uppercase;font-weight:700;color:var(--stg-acc-ink, ${COLORS.accent});display:inline-flex;align-items:center;gap:4px;}
        ` }} />

        <div style={{ maxWidth: 760, margin: '0 auto' }}>
          {!LOFT && (
          <DailyMasthead
            slug="docket"
            num={PUZZLE.num}
            dateLabel={PUZZLE.dateLabel}
            accent={COLORS.accent}
            blockGap={4}
            helpTop={8}
            onHelp={() => setShowHelp(true)}
            sunday={PUZZLE.sunday && <span style={{ fontFamily: MONO, fontSize: 9.5, letterSpacing: '0.1em', textTransform: 'uppercase', fontWeight: 500, color: `var(--stg-onramp, ${T.white})`, background: `var(--stg-acc, ${COLORS.accent})`, borderRadius: 4, padding: '2px 6px' }}>Sunday Edition &middot; Two Dimensions</span>}
            blocks={'DOCKET'.split('').map((ch, i) => (
              <div key={i} style={{ width: 34, height: 34, borderRadius: 5, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: SANS, fontWeight: 900, fontSize: 19, background: i === 0 ? `var(--stg-acc, ${COLORS.accent})` : COLORS.ink, color: i === 0 ? `var(--stg-onramp, ${T.white})` : T.white, boxShadow: 'inset 0 2px 5px rgba(0,0,0,0.5), 0 1px 0 rgba(255,255,255,0.65)' }}>{ch}</div>
            ))}
          />
          )}

        {/* LOFT: the play area sits on the navy stage, which runs full bleed
            and fills the first screen, so the board is the one lit object. */}
        <div className={LOFT && !STAGE ? 'loft-stage' : undefined}>
          <div className={LOFT && !STAGE && !playing ? (loftRevealed ? 'loft-flip' : 'loft-flip on') : undefined}>
          <div className={LOFT && !STAGE && !playing ? 'loft-flip-in' : undefined}>
          <div className={LOFT && !STAGE && !playing ? 'loft-face' : undefined}>
          <div className={LOFT && !STAGE ? 'loft-sheet' : undefined}>

          {/* start tile */}
          {preStart && (
            <div className={STAGE ? 'stg-gate' : undefined} style={{ background: STAGE ? SURF : T.white, border: STAGE ? `1px solid ${SURF_B}` : '1px solid rgba(28,30,36,0.14)', borderRadius: 12, padding: '20px 22px', margin: '4px 0 14px' }}>
              <h2 style={{ fontSize: 19, fontWeight: 900, color: INK, margin: '0 0 8px' }}>
                One small world, {TOTAL} questions about it.
              </h2>
              <p style={{ fontSize: 14.5, lineHeight: 1.6, color: FADED, fontWeight: 600, margin: '0 0 12px' }}>
                Today it is <b style={{ color: ACC_DEEP_INK }}>{PUZZLE.title}</b>. Read the setup and the
                conditions, work out what they force, then answer. The conditions stay on screen the whole
                time, because <b style={{ color: ACC_DEEP_INK }}>the deductions are meant to be reused</b>.
                There is a sketch to lay the letters out in, a notes pad, and you can cross off a choice you have ruled out.
                If the format feels familiar, it is: this is the reasoning section a well known standardized
                test used to run, and quietly retired.
              </p>
              {gateRules && (
                <div style={{ marginBottom: 14 }}>
                  <DailyRules
                    accent={COLORS.accent} accentSoft={COLORS.accentSoft} accentDeep={COLORS.accentDeep}
                    steps={[
                      <>Diagram the conditions <b>before</b> you look at the first question.</>,
                      <>Chain them. Two conditions together usually force a third thing neither says.</>,
                      <>&ldquo;Must be true&rdquo; means true in <b>every</b> arrangement the conditions allow, not just a likely one.</>,
                      <>Rule a choice out with the <b>&times;</b> beside it. It is struck through and stops answering, so a stray tap cannot cost you the question. Tap it again to bring it back.</>,
                    ]}
                    knack="For could-be-true, try to build one arrangement that does it. For must-be-true, try to build one that does not. One counterexample settles it either way."
                    footer={`One point per question, ${TOTAL} today. No going back once you answer. The sketch is free and never scored, and your notes keep across all ${TOTAL}.`}
                  />
                </div>
              )}
              <div style={{ display: 'flex', flexDirection: 'row-reverse', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
                <button className="dk-btn primary" onClick={start}>Start</button>
                {!gateRules && (
                  <button className="dk-btn" onClick={() => setGateRules(true)}>Show instructions</button>
                )}
              </div>
            </div>
          )}

          {/* The sketch leads once play starts (the mockup's order): it is the
              diagram, and the diagram outlives every individual question. */}
          {!preStart && playing && (
            <DocketSketch
              key={`${PUZZLE.num}:${sketchGen}`}
              spec={PUZZLE.spec}
              total={TOTAL}
              notes={g.notes}
              notesOpen={!!g.notesOpen}
              onNotes={(v) => setG((cur) => ({ ...cur, notes: v }))}
              onToggleNotes={() => setG((cur) => ({ ...cur, notesOpen: !cur.notesOpen }))}
            />
          )}

          {/* ── the pinned brief: setup + conditions, always available ───────── */}
          <div className="dk-panel">
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: setupOpen ? 7 : 8 }}>
              <Scale size={15} style={{ flex: '0 0 auto', color: ACC_INK }} />
              <span style={{ fontFamily: MONO, fontSize: 10.5, letterSpacing: '0.09em', textTransform: 'uppercase', fontWeight: 700, color: ACC_INK }}>
                {PUZZLE.title}
              </span>
              <button className="dk-fold" style={{ marginLeft: 'auto' }} onClick={() => setSetupOpen((v) => !v)}>
                {setupOpen ? <>Hide setup <ChevronUp size={13} /></> : <>Show setup <ChevronDown size={13} /></>}
              </button>
            </div>
            {setupOpen && <div className="dk-setup" style={{ marginBottom: 9 }}>{PUZZLE.setup}</div>}
            <div className="dk-chips" role="list" aria-label="Conditions">
              {PUZZLE.rules.map((r, i) => (
                <span className="dk-chip" role="listitem" key={i}><b className="n">{i + 1}</b><span>{r}</span></span>
              ))}
            </div>
          </div>

          {!preStart && (
            <>
              {/* progress + clock */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, margin: '2px 0 12px' }}>
                <div style={{ display: 'flex', gap: 4, flex: 1 }}>
                  {QS.map((_, i) => (
                    <div key={i} className={`dk-pip${g.picks[i] !== null ? (g.picks[i] === KEY[i] ? ' on' : ' miss') : ''}`} />
                  ))}
                </div>
                <div style={{ fontFamily: MONO, fontSize: 12.5, fontWeight: 700, color: FADED }}>
                  {Math.min(idx + 1, TOTAL)}/{TOTAL} &middot; {elapsed}
                </div>
              </div>

              {playing && (
                <>
                  <div style={{ fontFamily: MONO, fontSize: 10.5, letterSpacing: '0.1em', textTransform: 'uppercase', color: FADED, fontWeight: 700, marginBottom: 6 }}>
                    Question {idx + 1}
                  </div>
                  <div style={{ background: STAGE ? SURF : T.white, border: STAGE ? `1px solid ${SURF_B}` : '1px solid rgba(28,30,36,0.14)', borderRadius: 11, padding: '14px 16px', marginBottom: 10 }}>
                    <div style={{ fontSize: 16.5, fontWeight: 800, color: INK, lineHeight: 1.45 }}>{q.q}</div>
                  </div>

                  {q.choices.map((c, ci) => {
                    const off = isCrossed(idx, ci);
                    let cls = 'dk-choice';
                    // At the reveal the right/wrong colouring has to read
                    // cleanly, so the strike comes off the choice. The chip
                    // beside it stays lit, which is what tells you whether you
                    // had ruled the right answer out.
                    if (off && !revealed) cls += ' off';
                    if (revealed) {
                      if (ci === answerKey) cls += ' right';
                      else if (ci === picked) cls += ' wrong';
                    }
                    const mono = q.kind === 'accept' || q.kind === 'list';
                    // An ORDERING (the acceptability question on a sequence or
                    // hybrid day) reads as a row of boxes, one letter per
                    // position, the same object as the sketch. Every other
                    // choice is a sentence or a list and keeps its text.
                    const boxes = q.kind === 'accept' && (PUZZLE.spec.k === 'seq' || PUZZLE.spec.k === 'hyb');
                    return (
                      <div className="dk-row" key={ci}>
                        <button className={cls} disabled={revealed || picked !== null} onClick={() => answer(ci)}>
                          <span className="k">{CHOICE_KEYS[ci]}</span>
                          {boxes ? (
                            <span className="t dk-seq" aria-label={c}>
                              {seqBoxes(c).map((b, bi) => (
                                <span key={bi} className="dk-sbox" aria-hidden="true">{b.l}{b.star && <sup className="dk-star">*</sup>}</span>
                              ))}
                            </span>
                          ) : (
                            <span className={mono ? 't mono' : 't'}>{c}</span>
                          )}
                          {off && !revealed && <span className="dk-struck">Crossed off</span>}
                          {revealed && ci === answerKey && <Check size={17} style={{ marginLeft: 'auto', flex: '0 0 auto', color: `var(--stg-ink, ${COLORS.green})` }} />}
                          {revealed && ci === picked && ci !== answerKey && <X size={17} style={{ marginLeft: 'auto', flex: '0 0 auto', color: '#b91c1c' }} />}
                        </button>
                        <button
                          className={`dk-x${off ? ' on' : ''}`}
                          disabled={revealed || picked !== null}
                          aria-pressed={off}
                          title={off ? `Bring ${CHOICE_KEYS[ci]} back` : `Cross off ${CHOICE_KEYS[ci]}`}
                          aria-label={off ? `Bring choice ${CHOICE_KEYS[ci]} back` : `Cross off choice ${CHOICE_KEYS[ci]}`}
                          onClick={() => toggleCross(ci)}
                        >
                          <X size={15} />
                        </button>
                      </div>
                    );
                  })}

                  {/* the reveal, which is where the format actually teaches */}
                  {revealed && (
                    <div style={{ background: `var(--stg-surf, ${COLORS.accentSoft})`, border: `1px solid var(--stg-line, ${COLORS.accent})`, borderRadius: 10, padding: '12px 14px', marginTop: 10 }}>
                      <div style={{ fontSize: 14, fontWeight: 800, color: ACC_DEEP_INK, marginBottom: 7 }}>
                        {picked === answerKey ? 'Correct.' : `Not quite. The answer is ${CHOICE_KEYS[answerKey]}.`}
                      </div>
                      <div style={{ fontSize: 13.5, lineHeight: 1.6, color: INK }}>{q.note}</div>
                      <button className="dk-btn primary" style={{ marginTop: 11 }} onClick={next}>
                        {idx + 1 >= TOTAL ? 'Finish' : 'Next question'}
                      </button>
                    </div>
                  )}
                </>
              )}

              {!playing && (
                <div style={{ background: STAGE ? SURF : T.white, border: STAGE ? `1px solid ${SURF_B}` : '1px solid rgba(28,30,36,0.14)', borderRadius: 12, padding: '18px 20px', marginBottom: 16 }}>
                  <div style={{ fontSize: 20, fontWeight: 900, color: INK, marginBottom: 4 }}>{score}/{TOTAL} &middot; {elapsed}</div>
                  <div style={{ fontFamily: MONO, fontSize: 11.5, color: FADED, marginBottom: 10 }}>
                    {SOLVED.sols.length} arrangement{SOLVED.sols.length === 1 ? '' : 's'} satisfied every condition
                    {hyb ? ' (an asterisk marks the second dimension)' : ''}
                  </div>
                  {QS.map((qq, i) => (
                    <div key={i} style={{ display: 'flex', gap: 9, alignItems: 'center', padding: '5px 0', borderTop: i ? '1px solid rgba(28,30,36,0.08)' : 'none', fontSize: 13.5 }}>
                      <span style={{ fontFamily: MONO, color: FADED, flex: '0 0 auto', width: 20 }}>{i + 1}</span>
                      <span style={{ flex: '0 0 auto', width: 22, height: 22, borderRadius: 5, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, fontSize: 12, background: g.picks[i] === KEY[i] ? COLORS.green : '#b91c1c', color: T.white }}>{CHOICE_KEYS[KEY[i]]}</span>
                      <span style={{ color: INK, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{qq.q}</span>
                      {g.picks[i] !== null && g.picks[i] !== KEY[i] && <span style={{ marginLeft: 'auto', flex: '0 0 auto', fontFamily: MONO, fontSize: 12, color: FADED }}>you said {CHOICE_KEYS[g.picks[i]]}</span>}
                      {g.picks[i] === null && <Minus size={14} style={{ marginLeft: 'auto', flex: '0 0 auto', color: FADED }} />}
                    </div>
                  ))}
                </div>
              )}
            </>
          )}


          </div>
          {LOFT && !playing && loftRevealed && (
            <button className={STAGE ? 'stf-hideboard' : 'loft-showopts'} onClick={() => setLoftRevealed(false)}>&#8630; Hide game board</button>
          )}
          </div>
          {LOFT && !playing && !EMBED && (
            <LoftFinish
              name="Docket"
              catRank={catRank}
              outcome={score > 0 ? 'won' : 'lost'}
              title={score > 0 ? 'Complete' : 'Not complete'}
              detail={`${`${score}/${TOTAL}`} \u00b7 ${elapsed}`}
              iq={iq}
              board={dailyBoard}
              gameRank={allTime && allTime.ready
                ? { value: allTime.rank != null ? `#${Number(allTime.rank).toLocaleString()}` : '\u2014',
                    label: allTime.field != null ? `of ${Number(allTime.field).toLocaleString()} Docket all time` : 'all-time rank' }
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
                  href: `/docket?p=${p.num}`,
                  done: !!(stats && stats.rec && stats.rec[p.num]),
                  score: (stats && stats.rec && stats.rec[p.num]) ? stats.rec[p.num].s : null,
                }))}
              options={[
                { label: copied ? 'Copied' : (shareCta || 'Share'), sub: 'Your result, no spoilers', kind: 'gold', onClick: copyShare },
                { tone: (score > 0) ? 'board' : 'reveal', label: (score > 0) ? 'Return to board' : 'Reveal answer',
                  sub: (score > 0) ? 'Your finished board' : 'Show what you missed', onClick: () => setLoftRevealed(true) },
                prevPuzzle && { tone: 'another', label: 'Play another Docket', sub: `No. ${prevPuzzle.num}, yesterday\u2019s puzzle`, href: `/docket?p=${prevPuzzle.num}` },
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
          {!STAGE && <GamePanel self="docket" name="Docket" onShow={() => setShowChrome(true)} />}
          <div style={{ display: (EMBED || (focusMode && !STAGE)) ? 'none' : 'block', margin: '30px auto 0', maxWidth: 640 }}>
            {LOFT && (
              <div className={STAGE ? undefined : 'loft-report'}>
                <ReportIssue self="docket" name="Docket" accent="#ffffff" align="center" onHelp={() => setShowHelp(true)} />
              </div>
            )}
            {/* Add to Home Screen, then the finish card's stat cards (app/StageFinish.jsx), as every daily has them. */}
            {!focusMode && <AddToHome name="Docket" />}
            <div id="stf-stats-slot" />
            {!LOFT && (
            <DailyGamesGrid
              self="docket"
              maxWidth={640}
              replay={!playing ? resetGame : null}
              challengeHref={`/duel/new?quiz=${encodeURIComponent(PUZZLE.quizId)}`}
              share={{ label: copied ? 'Copied' : 'Share', onClick: copyShare }}
              light
              divider
              boardSlot={<DailyBoardPanel self="docket" quizId={PUZZLE.quizId} maxWidth={640} streak={{ current: myStats.cur, best: myStats.max }} />}
            />
            )}
          </div>
        </div>
      </div>

      {!playing && !endClosed && !LOFT && (
        <DailyEndCard
          modal
          self="docket"
          won={score === TOTAL}
          completed
          headline={score === TOTAL ? <>All five</> : <>{score} of {TOTAL}</>}
          subline={<>Docket #{PUZZLE.num} &middot; {score}/{TOTAL} &middot; {wrong} wrong &middot; {elapsed}</>}
          onShare={copyShare}
          shareLabel={copied ? 'Copied' : 'Share Result'}
          onReplay={resetGame}
          onClose={() => setEndClosed(true)}
        />
      )}

      <DuelBanner token={duelToken} info={duelInfo} submitted={duelSubmitted} />

      {showHelp && (
        <div onClick={() => { setShowHelp(false); try { localStorage.setItem(HELP_KEY, '1'); } catch (e) {} }}
          style={{ position: 'fixed', inset: 0, background: 'rgba(20,22,28,0.55)', zIndex: 70, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
          <div onClick={(e) => e.stopPropagation()} style={{ background: STAGE ? 'var(--stg-raise,#0e131f)' : T.white, borderRadius: 13, padding: '20px 22px', maxWidth: 460, fontFamily: SANS }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 9, marginBottom: 10 }}>
              <HelpCircle size={19} color={COLORS.accent} />
              <b style={{ fontSize: 17, color: INK }}>How Docket works</b>
              <button onClick={() => setShowHelp(false)} aria-label="Close" style={{ marginLeft: 'auto', background: 'none', border: 'none', cursor: 'pointer', color: FADED }}><X size={20} /></button>
            </div>
            <p style={{ fontSize: 14, lineHeight: 1.6, color: INK, margin: '0 0 10px' }}>
              A setup describes a small world, the numbered conditions constrain it, and every question is
              about what those conditions do and do not force. It is the analytical reasoning format a
              well known standardized test ran for decades before retiring it.
            </p>
            <ul style={{ fontSize: 13.5, lineHeight: 1.7, color: INK, margin: '0 0 12px', paddingLeft: 20 }}>
              <li>Diagram first. The conditions stay pinned so you only do that once.</li>
              <li>&ldquo;Could be true&rdquo; needs one arrangement that works. &ldquo;Must be true&rdquo; needs all of them.</li>
              <li>A question that starts &ldquo;If ...&rdquo; applies only inside that question.</li>
              <li>Cross a choice out with the &times; beside it. It stays struck through and cannot be answered until you bring it back.</li>
              <li>The sketch is a free working surface: tap a letter in the tray, then tap a slot. It is never scored and clears on a new puzzle. The notes under it save with the day, so they survive a reload.</li>
              <li>One point per question, {TOTAL} on the board today.</li>
            </ul>
            <button className="dk-btn primary" onClick={() => { setShowHelp(false); try { localStorage.setItem(HELP_KEY, '1'); } catch (e) {} }}>Play</button>
          </div>
        </div>
      )}

      {!STAGE && <div style={{ display: focusMode ? 'none' : 'block' }}><Footer /></div>}
    </div>
  );
}
