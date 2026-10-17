'use client';

// THE BROADCAST — the run's ending, before the scorecard (owner, 2026-08-30).
//
// A run of 180 questions used to end on a card that faded in. This is the ten
// seconds before it: every bank paints the whole screen in its own colour while
// its count runs, the ladder fills its block along the bottom and the climb
// column grows up the side, then the paint drops out, the two edges repaint
// themselves in the ramp at once, and the position falls to the player's slot.
//
// IT IS A CURTAIN, NOT A REPLACEMENT. It plays once, over the finished run, and
// unmounts onto the `rn-done` card underneath, which still carries the ladder,
// the figures, the board, the share button and Claim your spot. Nothing that
// already works moves, and it posts nothing: every result row was filed by
// finishSection long before this mounts.
//
// IT INVENTS NOTHING. Every figure is one the finish already holds: the counts
// and the clock from the run's own state, the average off useGauntletField's
// survival curves, the leader and the rank off the board the finish already
// fetches. Where a figure is missing (a small field, a guest with no
// provisional rank) its line is simply not drawn — the sequence never fills a
// gap with a guess, and it never scrolls a field of invented names past.
//
// FOUR RULES IT MUST KEEP:
//   1. Any tap, any key, skips to the end. It is on the way to the scorecard,
//      never in front of it.
//   2. prefers-reduced-motion gets no curtain at all: the card, immediately.
//   3. It plays ONCE per run. A player who comes back to a finished run, or who
//      finished the seven games on their own pages, gets the card directly.
//   4. It never congratulates. A player who missed on question one is watching
//      a row of low numbers, so the copy states them and says nothing else.
//
// THE PAINT GOES ON THE ROOT ELEMENT of the overlay. A full-bleed child of the
// stage did not render its own background when this was prototyped, and the
// colour is the whole idea, so it sits on the fixed element that IS the screen.
//
// The graphics are CSS transitions rather than per-frame React state: each
// ladder block is one masked fill whose width animates, and each column segment
// is a height. Only the numbers tick per frame, inside their own components, so
// a step costs one render of ten nodes rather than sixty renders of two hundred.
//
// EACH BANK CARRIES ITS PLACE ON ITS OWN FIELD (owner, 2026-09-03: "just the
// rank per each of the 7 elements"). Once a bank's count has landed, the line
// under it reads `#14 of 218 on this quiz today`, and the board phase repeats
// all seven in a row under the position. It costs no request: the run already
// fetched every bank's scoreDist for the average, and a rank on a one-life quiz
// is everyone who scored more, plus one (useGauntletField's `rank`). A bank
// under the field floor says how many have played and no more, the same rule
// the average follows: a rank over eleven attempts looks authoritative and is
// noise. The owner saw and declined a per-sub-topic layer the same day, so the
// paint carries the rank and nothing else beneath the count.

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { rampFor } from '@/lib/circuits';
import { shownLength } from './GauntletLadder';
import { titleLadder, titleFor } from '@/lib/run-titles';
import { mathText } from '@/app/MathText';
import { encodeChallenge, ymdCompact, RUN_CHALLENGES } from '@/lib/challenge';
import { withRef } from '@/lib/referrals';
import { newCid, withCid, recordSend } from '@/lib/challenge-client';
import { drawingIsLive, DRAWING } from '@/lib/drawing';
import { savedIdentity } from '@/lib/saved-identity';
import { useMyTickets } from '../TicketDoor';

const PAINT_MS = 1250;     // one bank owns the screen for this long (980 before the rank line)
const COUNT_MS = 560;      // its number, its ladder block and its segment
const REPAINT_MS = 1250;   // the colours come back, the total lands
const CLIMB_MS = 3400;     // the position falls to the player's slot
const HOLD_MS = 1500;      // the finished frame, before the card
const RANK_AT_MS = COUNT_MS + 120;  // the rank line, once the bank's count has landed
const SLOT_FROM_MS = 500;   // the first by-quiz slot lands this long into the board
const SLOT_GAP_MS = 300;    // and the rest follow at this pace

// A dark ink for a ramp colour. Every colour in LADDER_RAMP is a high-lightness
// pastel, so a flat scale toward black is legible on all eight without a table
// of hand-picked inks that would have to grow with the roster.
function inkFor(hex) {
  const h = String(hex || '').replace('#', '');
  if (h.length !== 6) return '#0b0f1a';
  const n = parseInt(h, 16);
  const r = Math.round(((n >> 16) & 255) * 0.17);
  const g = Math.round(((n >> 8) & 255) * 0.17);
  const b = Math.round((n & 255) * 0.17);
  return `rgb(${r},${g},${b})`;
}

const ease = (t) => 1 - Math.pow(1 - t, 3);

// THE TWO GAUNTLETS' SET PIECES (owner, 2026-10-17). The Trivia Gauntlet
// lights a row of question pips to the miss and climbs a shelf of six titles;
// the Math Gauntlet races a calculator readout through the game's real
// problems to an ERR and climbs six title rows beside an LCD total. Every other
// circuit that mounts this curtain (the Trivia Encore) gets none of it, and its
// timings below are the ones it always had.
const MODE_TIMING = {
  trivia: { start: 300, paint: 1300, count: 700, rank: 900, miss: 760 },
  math: { start: 300, paint: 1500, count: 800, rank: 1000, miss: 900 },
};
const TITLE_STEP = 600;     // one title of the climb
const TITLE_FLASH = 220;    // the stage flashes the title's colour as it is crossed
const TITLE_TAIL = 300;     // the earned title pulls out this long into its step
const WORDS = ['zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten'];
const spell = (n) => (n >= 0 && n < WORDS.length ? WORDS[n] : String(n));

// When the count on a bank reaches i + 1, under the same ease the Count uses.
function pipDelay(i, got, ms) {
  if (!got) return 0;
  const v = Math.min(1, (i + 0.5) / got);
  return Math.round((1 - Math.pow(1 - v, 1 / 3)) * ms);
}

// A solved problem as one readout line: the blank filled in, or "= answer".
function readoutLine(q) {
  if (!q) return '';
  const c = Array.isArray(q.choices) ? q.choices[q.correct] : '';
  const a = typeof c === 'number' ? c.toLocaleString('en-US') : String(c == null ? '' : c);
  const s = String(q.q || '');
  return s.indexOf('?') !== -1 ? s.split('?').join(a) : `${s} = ${a}`;
}

// THE READOUT. A fixed box with fixed-height lines (owner: nothing resizes),
// racing through the problems this game actually asked that the player got
// right, then flashing ERR on the one that ended it.
function Readout({ qs = [], got = 0, missed = false, resetKey, missAt = 900 }) {
  const [tick, setTick] = useState(-1);
  const [err, setErr] = useState(false);
  useEffect(() => {
    setTick(-1);
    setErr(false);
    const timers = [];
    const n = Math.min(got, qs.length);
    const every = n > 0 ? Math.min(140, 880 / n) : 140;
    for (let i = 0; i < n; i++) timers.push(setTimeout(() => setTick(i), Math.round(i * every)));
    if (missed) timers.push(setTimeout(() => setErr(true), missAt));
    return () => timers.forEach(clearTimeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resetKey]);
  const lines = [];
  for (let j = 3; j >= 0; j--) {
    const idx = tick - j;
    if (idx < 0) continue;
    lines.push({ idx, cur: j === 0, op: j === 0 ? 1 : 0.35 + (3 - j) * 0.15 });
  }
  return (
    <div className="gfin-calc" aria-hidden="true">
      <div className="gfin-scr">
        {lines.map((ln) => (
          <div key={ln.idx} className={`gfin-ln${ln.cur ? ' cur' : ''}`} style={{ opacity: ln.op }}>
            {mathText(readoutLine(qs[ln.idx]))}
          </div>
        ))}
        {err ? <div className="gfin-err">ERR</div> : null}
      </div>
    </div>
  );
}

// A number that counts. It owns its own frame loop so a tick re-renders this
// component and nothing else.
function Count({ to, ms = COUNT_MS, from = 0, resetKey, fmt }) {
  const [v, setV] = useState(from);
  const cur = useRef(from);
  useEffect(() => {
    cur.current = from;
    setV(from);
    const a = from;
    const t0 = (typeof performance !== 'undefined' ? performance.now() : Date.now());
    let raf = 0;
    const tick = (t) => {
      const p = Math.min(1, (t - t0) / Math.max(1, ms));
      cur.current = a + (to - a) * ease(p);
      setV(cur.current);
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [to, ms, resetKey]);
  const n = Math.round(v);
  return <>{fmt ? fmt(n) : n}</>;
}

function Broadcast({
  sections = [],
  results = [],
  score = 0,
  total = 0,
  avgTotal = null,
  leaderScore = null,
  rank = null,
  fieldSize = null,
  rows = [],
  meKey = null,
  guest = false,
  field = null,
  circuitId = null,
  onDone,
}) {
  const N = sections.length;
  // trivia / math carry the set pieces and the title climb; anything else
  // (the Trivia Encore) plays the Broadcast exactly as it always has.
  const mode = circuitId === 'gauntlet' ? 'trivia' : circuitId === 'math' ? 'math' : null;
  const tm = mode ? MODE_TIMING[mode] : null;
  const paintMs = tm ? tm.paint : PAINT_MS;
  const countMs = tm ? tm.count : COUNT_MS;
  const ladder = mode ? titleLadder(circuitId) : null;
  const earned = mode ? titleFor(circuitId, score) : null;
  const K = earned ? earned.index : 0;
  // -1 waiting a beat, 0..N-1 a bank, N the repaint and the total, N+1 the board.
  // NOTHING IS DRAWN AT -1. The middle's non-painting branch is the TOTAL, so
  // rendering it before the first bank flashed the run's final score for a
  // quarter of a second and gave away the ending the sequence exists to build.
  const [step, setStep] = useState(-1);
  // The bank whose rank line is up, and how many by-quiz slots have landed.
  const [rankIn, setRankIn] = useState(-1);
  const [landed, setLanded] = useState(0);
  // The title climb: which title the total is in, the flash, and the pull-out.
  const [climbK, setClimbK] = useState(-1);
  const [flash, setFlash] = useState(false);
  const [pulled, setPulled] = useState(false);
  const doneRef = useRef(false);

  const banks = useMemo(() => sections.map((s, i) => {
    const res = results[i] || null;
    const asked = (s.questions && s.questions.length) || (res && res.total) || 0;
    const got = res && Number.isFinite(res.score) ? res.score : 0;
    const colour = rampFor(Number.isFinite(s.slot) ? s.slot : i);
    // The place on this bank's own field, or null under the floor. `plays` is
    // reported either way so the line can say how many have played so far.
    const rank = field && typeof field.rank === 'function' ? field.rank(s.key, got) : null;
    const plays = field && field.plays && Number.isFinite(field.plays[s.key]) ? field.plays[s.key] : null;
    // The bar's length: anchored to today's best on this bank, not to all 25.
    const shown = shownLength(asked, field && field.top ? field.top[s.key] : 0, got) || 1;
    const qs = Array.isArray(s.questions) ? s.questions : [];
    return { key: s.key, name: s.name || s.key, subject: s.subject || (mode ? s.topic : '') || '', asked, shown, got, colour, ink: inkFor(colour), rank, plays, qs };
  }), [sections, results, field]);

  const running = useMemo(() => {
    const out = [];
    let n = 0;
    banks.forEach((b) => { n += b.got; out.push(n); });
    return out;
  }, [banks]);

  const finish = () => {
    if (doneRef.current) return;
    doneRef.current = true;
    if (typeof onDone === 'function') onDone();
  };

  // The whole schedule, laid out once. Every timer is cleared on unmount, so a
  // skip mid-sequence cannot fire a later beat onto a card that is already up.
  useEffect(() => {
    const reduced = typeof window !== 'undefined' && window.matchMedia
      && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduced || !N) { finish(); return undefined; }
    const timers = [];
    const at = (ms, fn) => timers.push(setTimeout(fn, ms));
    const t0 = tm ? tm.start : 260;
    const rankAt = tm ? tm.rank : RANK_AT_MS;
    banks.forEach((b, i) => {
      at(t0 + i * paintMs, () => setStep(i));
      at(t0 + i * paintMs + rankAt, () => setRankIn(i));
    });
    const end = t0 + N * paintMs;
    // The repaint is the title climb on the two gauntlets: one step per title
    // the total crosses, each flashing the stage in that title's colour.
    let repaint = REPAINT_MS;
    if (mode && ladder) {
      for (let k = 0; k <= K; k++) {
        at(end + k * TITLE_STEP, () => { setStep(N); setClimbK(k); setFlash(true); });
        at(end + k * TITLE_STEP + TITLE_FLASH, () => setFlash(false));
      }
      at(end + K * TITLE_STEP + TITLE_TAIL, () => setPulled(true));
      repaint = (K + 1) * TITLE_STEP + TITLE_TAIL + TITLE_TAIL;
    } else {
      at(end, () => setStep(N));
    }
    at(end + repaint, () => setStep(N + 1));
    banks.forEach((b, i) => at(end + repaint + SLOT_FROM_MS + i * SLOT_GAP_MS, () => setLanded(i + 1)));
    at(end + repaint + CLIMB_MS + HOLD_MS, finish);
    return () => timers.forEach(clearTimeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [N]);

  // Any tap, any key.
  useEffect(() => {
    const go = () => finish();
    window.addEventListener('keydown', go);
    return () => window.removeEventListener('keydown', go);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const painting = step >= 0 && step < N;
  const cur = painting ? banks[step] : null;
  const restored = step >= N;
  const flashC = mode && ladder && flash && step === N && climbK >= 0 ? ladder[climbK].colour : null;
  const ground = painting ? cur.colour : flashC || '#0b0f1a';
  const ink = painting ? cur.ink : flashC ? '#0b0f1a' : '#f2f6ff';
  const titling = !!(mode && ladder && step === N);
  const noDenom = mode === 'trivia';

  // THE CLIMB'S SCALE (owner, 2026-10-07): the best total on the board sits
  // near the top of the column, not 180 at the top with everyone in the
  // bottom fifth. The player's own total takes over if it is the best.
  const scaleTop = Math.max(Number(leaderScore) || 0, Number(score) || 0, Number(avgTotal) || 0);
  const scale = scaleTop > 0 ? Math.min(total, Math.max(scaleTop + 1, scaleTop / 0.9)) : total;
  const avgPct = avgTotal != null && scale > 0 ? Math.min(100, (avgTotal / scale) * 100) : null;
  const leadPct = leaderScore != null && scale > 0 ? Math.min(100, (leaderScore / scale) * 100) : null;
  const passedAvg = avgTotal != null && (painting ? running[step] : score) >= avgTotal;

  const top = Array.isArray(rows) ? rows.slice(0, 5) : [];
  const meIn = !!(meKey && top.some((x) => x.userKey === meKey));
  const meRow = meKey ? (rows || []).find((x) => x.userKey === meKey) : null;

  return (
    <div
      className={`gfin${restored ? ' restored' : ''}${mode ? ` m-${mode}` : ''}`}
      style={{ background: ground, color: ink, ...(flashC ? { transition: 'background-color .05s ease,color .3s ease' } : null) }}
      onClick={finish}
      role="button"
      tabIndex={0}
      aria-label="Skip to your scorecard"
    >
      <style dangerouslySetInnerHTML={{ __html: CSS }} />

      <div className="gfin-run">
        {step < 0 ? null : restored
          ? (noDenom
            ? <><Count to={score} ms={800} from={0} resetKey="tot" /> right</>
            : <><Count to={score} ms={800} from={0} resetKey="tot" /> of {total} right</>)
          : <>running · <Count to={running[step]} ms={COUNT_MS} from={step > 0 ? running[step - 1] : 0} resetKey={step} /></>}
      </div>

      {/* THE MIDDLE. One bank at a time while the paint is up, then the total,
          then out of the way so the board owns the screen. */}
      <div className={`gfin-mid${step === N + 1 ? ' gone' : ''}${restored ? ' up' : ''}`}>
        {step < 0 ? null : painting && mode === 'math' ? (
          <div className="gfin-mrow">
            <Readout qs={cur.qs} got={cur.got} missed={cur.got < cur.asked} resetKey={step} missAt={tm.miss} />
            <div className="gfin-mcol">
              <div className="gfin-sub">Game {step + 1} of {N}{cur.subject ? ` \u00B7 ${cur.subject}` : ''}</div>
              <div className="gfin-nm">{cur.name}</div>
              <div className="gfin-n fx"><Count to={cur.got} ms={countMs} from={0} resetKey={step} /></div>
              {cur.rank != null || cur.plays != null ? (
                <div className={`gfin-rk${rankIn === step ? ' in' : ''}`}>
                  {cur.rank != null
                    ? <><span className="n">#{cur.rank}</span><span className="h">of {cur.plays} on {cur.name} today</span></>
                    : <span className="h">{cur.plays} played so far · no field yet</span>}
                </div>
              ) : null}
            </div>
          </div>
        ) : painting && mode === 'trivia' ? (
          <>
            <div className="gfin-sub">Quiz {step + 1} of {N}{cur.subject ? ` \u00B7 ${cur.subject}` : ''}</div>
            <div className="gfin-nm">{cur.name}</div>
            {cur.asked > 0 ? (() => {
              const nP = Math.min(cur.asked, Math.max(28, cur.got + 1));
              const missI = cur.got < cur.asked ? cur.got : -1;
              const pips = [];
              for (let i = 0; i < nP; i++) {
                if (i < cur.got) pips.push(<span key={i} className="gfin-pip r" style={{ animationDelay: `${pipDelay(i, cur.got, countMs)}ms` }} />);
                else if (i === missI) pips.push(<span key={i} className="gfin-pip"><span className="xk" style={{ animationDelay: `${tm.miss}ms` }}>{'\u00D7'}</span></span>);
                else pips.push(<span key={i} className="gfin-pip" />);
              }
              return <div className="gfin-pips" key={step} aria-hidden="true">{pips}</div>;
            })() : null}
            <div className="gfin-n fx"><Count to={cur.got} ms={countMs} from={0} resetKey={step} /></div>
            <div className="gfin-of">{cur.got === cur.asked ? 'cleared, no miss' : 'right before the miss'}</div>
            {cur.rank != null || cur.plays != null ? (
              <div className={`gfin-rk${rankIn === step ? ' in' : ''}`}>
                {cur.rank != null
                  ? <><span className="n">#{cur.rank}</span><span className="h">of {cur.plays} on this quiz today</span></>
                  : <span className="h">{cur.plays} played so far · no field yet</span>}
              </div>
            ) : null}
          </>
        ) : mode && restored ? null : painting ? (
          <>
            {cur.subject ? <div className="gfin-sub">{cur.subject}</div> : null}
            <div className="gfin-nm">{cur.name}</div>
            <div className="gfin-n"><Count to={cur.got} ms={COUNT_MS} from={0} resetKey={step} /></div>
            <div className="gfin-of">{cur.got === cur.asked ? 'cleared' : `of ${cur.asked} before the miss`}</div>
            {/* THE RANK LINE waits for the count. It is drawn on the same
                condition as the average: a field, or an honest count of who
                has played and no number over it. */}
            {cur.rank != null || cur.plays != null ? (
              <div className={`gfin-rk${rankIn === step ? ' in' : ''}`}>
                {cur.rank != null
                  ? <><span className="n">#{cur.rank}</span><span className="h">of {cur.plays} on this quiz today</span></>
                  : <span className="h">{cur.plays} played so far · no field yet</span>}
              </div>
            ) : null}
          </>
        ) : (
          <>
            <div className="gfin-sub">questions right</div>
            <div className="gfin-n"><Count to={score} ms={800} from={0} resetKey="total" /></div>
            <div className="gfin-of">of {total} asked</div>
          </>
        )}
      </div>

      {/* THE TITLE CLIMB (the two gauntlets only). The total climbs through the
          run's titles, each crossed one lights and flashes the stage, and the
          earned one pulls out: a stack of books on the Trivia Gauntlet, six
          title rows beside an LCD total on the Math Gauntlet. Every number sits
          in a fixed box so nothing resizes as it counts. */}
      {mode && ladder ? (() => {
        const lo = climbK >= 0 ? ladder[climbK].min : 0;
        const hi = climbK < 0 ? 0 : climbK === K ? score : ladder[climbK + 1].min - 1;
        const at = Math.max(0, climbK);
        const shown = climbK >= 0;
        const num = <Count to={hi} ms={TITLE_STEP - 150} from={lo} resetKey={`t${climbK}`} />;
        return (
          <div className={`gfin-tph${titling ? ' in' : ''}`} aria-hidden={!titling}>
            {mode === 'trivia' ? (
              <>
                <div className="gfin-tlead">
                  <div className="gfin-teb">Questions right, all {spell(N)} quizzes</div>
                  <div className="gfin-ttot">{shown ? num : null}</div>
                </div>
                <div className="gfin-shelf">
                  {ladder.map((t, i) => {
                    const lit = shown && i <= at;
                    const cls = `gfin-book${lit ? ' lit' : ''}${shown && i === at ? ' at' : ''}${shown && i === K && pulled ? ' out' : ''}`;
                    return (
                      <div key={t.name} className={cls} style={{ '--tc': t.colour, '--bw': `${100 - i * 4.7}%` }}>
                        <span className="nm">{t.name}</span><span className="mn">{t.min}+</span>
                      </div>
                    );
                  })}
                </div>
              </>
            ) : (
              <>
                <div className="gfin-tlead">
                  <div className="gfin-teb">Right answers, all {spell(N)} games</div>
                  <div className="gfin-lcd"><span className="v">{shown ? num : null}</span></div>
                </div>
                <div className="gfin-trows">
                  {ladder.map((t, i) => {
                    const lit = shown && i <= at;
                    const cls = `gfin-trow${lit ? ' lit' : ''}${shown && i === at ? ' at' : ''}${shown && i === K && pulled ? ' out' : ''}`;
                    return (
                      <div key={t.name} className={cls} style={{ '--tc': t.colour }}>
                        <span className="nm">{t.name}</span><span className="mn">{t.min}+</span>
                      </div>
                    );
                  })}
                </div>
              </>
            )}
          </div>
        );
      })() : null}

      {/* THE LADDER, along the bottom. One masked fill per bank rather than a
          rung per question: the mask draws the rungs and the width animates. */}
      <div className="gfin-lad">
        {banks.map((b, i) => {
          const pct = i <= step || restored ? Math.min(100, (b.got / b.shown) * 100) : 0;
          const mask = `repeating-linear-gradient(90deg,#000 0 calc(100% / ${b.shown} * 0.78),transparent calc(100% / ${b.shown} * 0.78) calc(100% / ${b.shown}))`;
          return (
            <div className="gfin-blk" key={b.key} style={{ flex: `${b.shown} 1 0` }}>
              <div className="gfin-trk" style={{ WebkitMaskImage: mask, maskImage: mask }} />
              <div
                className={`gfin-fill${i === step ? ' cur' : ''}`}
                style={{
                  clipPath: `inset(0 ${100 - pct}% 0 0)`,
                  WebkitClipPath: `inset(0 ${100 - pct}% 0 0)`,
                  WebkitMaskImage: mask,
                  maskImage: mask,
                  background: restored ? b.colour : 'currentColor',
                  transitionDuration: `${COUNT_MS}ms`,
                }}
              />
            </div>
          );
        })}
      </div>

      {/* THE CLIMB, up the side, against the two lines that were drawn before
          the player started. */}
      <div className="gfin-side">
        <div className="gfin-track" />
        <div className="gfin-col">
          {banks.map((b, i) => (
            <div
              key={b.key}
              className="gfin-seg"
              style={{
                height: `${(i <= step || restored) && total > 0 ? (b.got / scale) * 100 : 0}%`,
                background: restored ? b.colour : 'currentColor',
                transitionDuration: `${COUNT_MS + 60}ms`,
              }}
            />
          ))}
        </div>
        {avgPct != null ? (
          <div className={`gfin-mark${passedAvg ? ' hit' : ''}`} style={{ bottom: `${avgPct}%` }}>
            <span className="tx">average {Math.round(avgTotal)}</span><span className="ln" />
          </div>
        ) : null}
        {leadPct != null ? (
          <div className={`gfin-mark lead${restored ? ' hit' : ''}`} style={{ bottom: `${leadPct}%` }}>
            <span className="tx">lead {leaderScore}</span><span className="ln" />
          </div>
        ) : null}
      </div>

      {/* THE BOARD. The position falls to the player's slot over the real top
          five. There is no field of names scrolling past, because the only way
          to draw one would be to invent the names. */}
      <div className={`gfin-board${step === N + 1 ? ' in' : ''}`}>
        {earned ? (
          <div className="gfin-ttl" style={{ '--tc': earned.colour }}>
            <span className="eb">Today&rsquo;s title</span>
            <span className="nm">{earned.name}</span>
            <span className="ln">
              {earned.line}
              {earned.next ? <b>{` ${earned.toNext} more right and you are ${/^[aeiou]/i.test(earned.next.name) ? 'an' : 'a'} ${earned.next.name}.`}</b> : null}
            </span>
          </div>
        ) : null}
        {rank != null && fieldSize ? (
          <div className="gfin-pos">
            <span className="h">position</span>
            <span className="n">#<Count to={rank} ms={CLIMB_MS} from={fieldSize} resetKey="pos" /></span>
          </div>
        ) : null}
        {/* A GUEST'S POSITION IS PROVISIONAL, and the number alone does not say
            so (owner, 2026-08-31). The ladder pays registered names only, so a
            guest watching their slot land is watching a spot nobody is holding.
            The card underneath carries the form; this line is the only thing on
            the curtain that says the spot has to be claimed. It is drawn on the
            same condition as the number, because it is a note about that
            number and nothing else. */}
        {rank != null && fieldSize && guest ? (
          <div className="gfin-claim">(select a name to claim)</div>
        ) : null}
        {/* BY QUIZ. Seven slots in the ramp, each bank's place on its own
            field, landing in run order under the position as it falls. The
            best of the seven is raised; a bank with no field says so in the
            slot rather than leaving a hole in the row. */}
        {banks.some((b) => b.rank != null || b.plays != null) ? (() => {
          let best = null;
          banks.forEach((b) => { if (b.rank != null && (best == null || b.rank < best.rank)) best = b; });
          return (
            <>
              <div className="gfin-qh"><span>by quiz · your place on each field</span><span>today</span></div>
              <div className="gfin-quiz" style={{ '--gfin-cols': banks.length }}>
                {banks.map((b, i) => (
                  <div
                    key={b.key}
                    className={`gfin-q${i < landed ? ' in' : ''}${b.rank == null ? ' nofield' : ''}${best === b ? ' best' : ''}`}
                    style={{ '--c': b.colour }}
                  >
                    <span className="nm">{b.name}</span>
                    <span className="rk">{b.rank != null ? `#${b.rank}` : 'no field'}</span>
                    <span className="of">{noDenom
                      ? (b.rank != null && b.plays != null ? `${b.got} right · ${b.plays} played` : `${b.got} right`)
                      : (b.rank != null && b.plays != null ? `${b.got} of ${b.asked} · ${b.plays} played` : `${b.got} of ${b.asked}`)}</span>
                  </div>
                ))}
              </div>
            </>
          );
        })() : null}
        <div className="gfin-rows">
          {top.map((row, i) => (
            <div key={row.userKey || i} className={`gfin-row${meKey && row.userKey === meKey ? ' me' : ''}`}>
              <span className="p">#{i + 1}</span>
              <span className="nm">{row.username || 'Guest'}</span>
              <span className="s">{Math.round(Number(row.total) * 10) / 10}</span>
            </div>
          ))}
          {!meIn && meRow ? (
            <div className="gfin-row me">
              <span className="p">{rank != null ? `#${rank}` : ''}</span>
              <span className="nm">{meRow.username || 'You'}</span>
              <span className="s">{Math.round(Number(meRow.total) * 10) / 10}</span>
            </div>
          ) : null}
        </div>
      </div>

      <div className="gfin-skip">tap to skip</div>
    </div>
  );
}

const CSS = `
.gfin{position:fixed;inset:0;z-index:80;overflow:hidden;cursor:pointer;
  transition:background-color .42s ease,color .42s ease;
  font-family:Manrope,system-ui,-apple-system,'Segoe UI',sans-serif}
.gfin:focus{outline:none}
.gfin-run{position:absolute;left:30px;top:58px;font-size:12px;font-weight:700;
  letter-spacing:.16em;text-transform:uppercase;opacity:.72}
.gfin-mid{position:absolute;left:0;right:0;top:50%;transform:translateY(-58%);
  display:flex;flex-direction:column;align-items:center;gap:1px;text-align:center;
  padding:0 132px 0 46px;
  transition:top .5s cubic-bezier(.2,.8,.25,1),transform .5s ease,opacity .4s ease}
.gfin-mid.up{top:15%;transform:none}
.gfin-mid.gone{opacity:0}
.gfin-sub{font-size:13px;font-weight:700;letter-spacing:.26em;text-transform:uppercase;opacity:.62}
.gfin-nm{font-size:clamp(34px,6.5vw,72px);font-weight:800;letter-spacing:-.04em;line-height:.98}
.gfin-n{font-size:clamp(76px,15vw,164px);font-weight:800;letter-spacing:-.05em;line-height:.9;
  font-variant-numeric:tabular-nums;transition:font-size .5s ease}
.gfin-mid.up .gfin-n{font-size:clamp(44px,7vw,78px)}
.gfin-of{font-size:13px;font-weight:600;letter-spacing:.14em;text-transform:uppercase;opacity:.62}
.gfin-rk{margin-top:14px;display:flex;align-items:baseline;gap:10px;opacity:0;transform:translateY(8px);
  transition:opacity .35s ease,transform .35s cubic-bezier(.2,.8,.25,1)}
.gfin-rk.in{opacity:1;transform:none}
.gfin-rk .n{font-size:clamp(30px,4.6vw,52px);font-weight:800;letter-spacing:-.04em;line-height:1;
  font-variant-numeric:tabular-nums}
.gfin-rk .h{font-size:12px;font-weight:700;letter-spacing:.16em;text-transform:uppercase;opacity:.62}

.gfin-lad{position:absolute;left:30px;right:126px;bottom:76px;height:42px;display:flex;gap:5px}
.gfin-blk{position:relative;height:100%}
.gfin-trk{position:absolute;inset:0;background:currentColor;opacity:.14}
.gfin-fill{position:absolute;inset:0;opacity:.55;clip-path:inset(0 100% 0 0);
  transition:clip-path 560ms cubic-bezier(.2,.75,.3,1),background-color .5s ease,opacity .3s ease}
.gfin-blk .gfin-fill.cur{opacity:1}
.gfin.restored .gfin-fill{opacity:1}

.gfin-side{position:absolute;right:34px;top:64px;bottom:76px;width:58px}
.gfin-track{position:absolute;inset:0;background:currentColor;opacity:.12;border-radius:8px}
.gfin-col{position:absolute;inset:0;display:flex;flex-direction:column-reverse;
  border-radius:8px;overflow:hidden}
.gfin-seg{width:100%;height:0;opacity:.6;
  transition:height 620ms cubic-bezier(.2,.75,.3,1),background-color .5s ease,opacity .5s ease}
.gfin.restored .gfin-seg{opacity:1}
.gfin-mark{position:absolute;right:66px;display:flex;align-items:center;gap:9px;white-space:nowrap;
  transform:translateY(50%);font-size:11px;font-weight:700;letter-spacing:.12em;
  text-transform:uppercase;opacity:.45;transition:opacity .3s ease}
.gfin-mark .ln{width:30px;height:1px;background:currentColor}
.gfin-mark.hit{opacity:1}

.gfin-board{position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;
  justify-content:center;gap:14px;padding:0 132px 96px 46px;opacity:0;
  transition:opacity .45s ease;pointer-events:none}
.gfin-board.in{opacity:1}
.gfin-pos{display:flex;align-items:baseline;gap:12px}
.gfin-pos .h{font-size:clamp(14px,2.4vw,20px);font-weight:700;letter-spacing:.14em;
  text-transform:uppercase;opacity:.5}
.gfin-pos .n{font-size:clamp(64px,13vw,120px);font-weight:800;letter-spacing:-.05em;
  line-height:.9;font-variant-numeric:tabular-nums}
.gfin-claim{margin-top:-8px;font-size:clamp(12.5px,1.9vw,16px);font-weight:700;
  letter-spacing:.03em;opacity:.62;text-align:center}
.gfin-qh{width:min(640px,100%);display:flex;justify-content:space-between;font-size:11px;font-weight:700;
  letter-spacing:.14em;text-transform:uppercase;opacity:.5;margin-top:8px}
.gfin-quiz{width:min(640px,100%);display:grid;grid-template-columns:repeat(var(--gfin-cols,7),1fr);gap:5px;margin-top:-6px}
.gfin-q{display:flex;flex-direction:column;gap:3px;padding:8px 8px 7px;border-radius:7px;background:rgba(255,255,255,.04);
  border-top:3px solid var(--c);opacity:0;transform:translateY(8px);
  transition:opacity .35s ease,transform .35s cubic-bezier(.2,.8,.25,1)}
.gfin-q.in{opacity:1;transform:none}
.gfin-q .nm{font-size:10.5px;font-weight:700;letter-spacing:.1em;text-transform:uppercase;opacity:.62;
  white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.gfin-q .rk{font-size:clamp(18px,2.4vw,26px);font-weight:800;letter-spacing:-.03em;line-height:1;
  font-variant-numeric:tabular-nums;color:var(--c)}
.gfin-q .of{font-size:10.5px;font-weight:600;letter-spacing:.04em;opacity:.5;font-variant-numeric:tabular-nums}
.gfin-q.best{background:rgba(255,255,255,.09)}
.gfin-q.nofield .rk{font-size:10px;white-space:nowrap;font-weight:700;letter-spacing:.06em;color:inherit;opacity:.5;
  line-height:clamp(18px,2.4vw,26px)}
.gfin-rows{width:min(520px,100%);display:flex;flex-direction:column;gap:2px}
.gfin-row{display:grid;grid-template-columns:44px 1fr auto;gap:12px;align-items:center;
  padding:7px 14px;border-radius:8px;font-size:14px;font-weight:600;
  font-variant-numeric:tabular-nums;background:rgba(255,255,255,.04)}
.gfin-row .p{opacity:.5}
.gfin-row .nm{overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.gfin-row.me{background:#7dd3fc;color:#08222e}
/* .85, not .34 (2026-10-10): .34 was about 2.9:1. At .85 the label holds
   5.06:1 or better on the dark ground and on every ramp step it paints over. */
.gfin-skip{position:absolute;left:0;right:0;bottom:26px;text-align:center;font-size:11px;
  font-weight:600;letter-spacing:.18em;text-transform:uppercase;opacity:.85}

@media (max-width: 760px){
  .gfin-run{left:16px;top:42px;font-size:10px;letter-spacing:.1em}
  .gfin-mid{padding:0 70px 0 18px}
  .gfin-sub{font-size:10px;letter-spacing:.2em}
  .gfin-nm{font-size:38px}
  .gfin-n{font-size:84px}
  .gfin-mid.up .gfin-n{font-size:52px}
  .gfin-of{font-size:10.5px}
  .gfin-rk{margin-top:10px}
  .gfin-rk .n{font-size:34px}
  .gfin-rk .h{font-size:10px}
  .gfin-lad{left:16px;right:62px;bottom:56px;height:28px;gap:3px}
  .gfin-side{right:16px;top:44px;bottom:56px;width:32px}
  .gfin-mark{right:40px;gap:5px;font-size:9px;letter-spacing:.06em}
  .gfin-mark .ln{width:12px}
  .gfin-board{padding:0 62px 74px 18px;gap:10px}
  .gfin-pos .n{font-size:62px}
  .gfin-claim{margin-top:-4px;font-size:12px}
  .gfin-qh{font-size:9.5px}
  .gfin-quiz{grid-template-columns:repeat(4,1fr);gap:4px}
  .gfin-q{padding:6px 6px 5px}
  .gfin-q .nm{font-size:9px}
  .gfin-q .rk{font-size:17px}
  .gfin-q .of{font-size:9px}
  .gfin-rows{width:100%}
  .gfin-row{grid-template-columns:34px 1fr auto;gap:8px;padding:6px 10px;font-size:12.5px}
  .gfin-skip{bottom:18px;font-size:10px}
}

/* ── THE TWO GAUNTLETS' SET PIECES (gauntlet + math only) ─────────────── */
.gfin.m-trivia .gfin-run,.gfin.m-math .gfin-run{font-variant-numeric:tabular-nums}
.gfin-n.fx{width:2.2ch;text-align:center}
.gfin-pips{display:flex;flex-wrap:wrap;justify-content:center;gap:5px;max-width:min(840px,100%);margin:14px 0 10px}
.gfin-pip{position:relative;width:26px;height:26px;border-radius:6px;box-sizing:border-box;
  border:2px solid rgba(11,15,26,.25);flex:none}
.gfin-pip.r{animation:gfinPip .14s ease both}
@keyframes gfinPip{from{background:transparent;border-color:rgba(11,15,26,.25)}to{background:#0b0f1a;border-color:#0b0f1a}}
.gfin-pip .xk{position:absolute;inset:-2px;border-radius:6px;display:flex;align-items:center;justify-content:center;
  background:#b4232a;border:2px solid #0b0f1a;color:#fff;font-size:15px;font-weight:800;line-height:1;
  animation:gfinCrack .4s ease both}
@keyframes gfinCrack{0%{opacity:0;transform:scale(1)}1%{opacity:1}40%{opacity:1;transform:scale(1.5) rotate(-8deg)}100%{opacity:1;transform:scale(1.2) rotate(0)}}

.gfin-mrow{display:flex;align-items:center;gap:48px;text-align:left}
.gfin-mcol{display:flex;flex-direction:column;align-items:flex-start;gap:6px;min-width:0}
.gfin.m-math .gfin-mcol .gfin-n.fx{text-align:left;width:2.2ch;height:.9em}
.gfin-calc{width:380px;flex:none;border-radius:18px;background:#0b0f1a;padding:18px;box-sizing:border-box;
  box-shadow:0 20px 50px rgba(0,0,0,.35)}
.gfin-scr{border-radius:10px;background:#131c12;padding:16px 18px;display:flex;flex-direction:column;
  justify-content:flex-end;gap:6px;height:214px;overflow:hidden;box-sizing:border-box}
.gfin-ln{height:26px;line-height:26px;flex:none;font-size:20px;font-weight:800;color:#bef264;text-align:right;
  white-space:nowrap;overflow:hidden;text-overflow:ellipsis;font-variant-numeric:tabular-nums;letter-spacing:.04em;
  animation:gfinTick .12s ease both}
.gfin-ln.cur{height:36px;line-height:36px;font-size:30px}
@keyframes gfinTick{from{opacity:0;transform:translateY(10px)}to{transform:none}}
.gfin-err{height:48px;line-height:48px;flex:none;font-size:44px;font-weight:800;color:#fb7185;text-align:right;
  letter-spacing:.1em;animation:gfinErr .3s steps(2) 3 both}
@keyframes gfinErr{0%,100%{opacity:1}50%{opacity:.2}}

.gfin-tph{position:absolute;left:0;right:0;top:64px;bottom:130px;display:flex;align-items:center;justify-content:center;
  gap:56px;padding:0 132px 0 46px;opacity:0;pointer-events:none;transition:opacity .35s ease}
.gfin-tph.in{opacity:1}
.gfin-tlead{display:flex;flex-direction:column;gap:10px;align-items:flex-start;flex:none}
.gfin-teb{font-size:13px;font-weight:800;letter-spacing:.18em;text-transform:uppercase;opacity:.75}
.gfin-ttot{width:3ch;height:1em;font-size:clamp(84px,12vw,140px);font-weight:800;line-height:1;text-align:right;
  font-variant-numeric:tabular-nums;letter-spacing:-.04em}
.gfin-shelf{display:flex;flex-direction:column-reverse;gap:6px;align-items:center;width:380px;flex:none}
.gfin-book{width:var(--bw);height:46px;border-radius:5px;background:rgba(255,255,255,.06);color:#5b6684;
  border-left:7px solid rgba(0,0,0,.18);box-sizing:border-box;display:flex;align-items:center;justify-content:space-between;
  padding:0 18px;font-size:17px;font-weight:800;white-space:nowrap;transition:all .3s ease}
.gfin-book .mn,.gfin-trow .mn{font-size:12px;opacity:.75;font-variant-numeric:tabular-nums;flex:none;margin-left:12px}
.gfin-book .nm,.gfin-trow .nm{overflow:hidden;text-overflow:ellipsis}
.gfin-book.lit,.gfin-trow.lit{background:var(--tc);color:#0b0f1a}
.gfin-book.at{box-shadow:0 0 0 3px #0b0f1a,0 0 34px var(--tc)}
.gfin-book.out{transform:translateX(26px) rotate(-2deg)}
.gfin-lcd{width:300px;height:160px;box-sizing:border-box;border-radius:14px;background:#131c12;padding:0 26px;
  display:flex;align-items:center;justify-content:flex-end;box-shadow:inset 0 0 0 3px rgba(0,0,0,.5)}
.gfin-lcd .v{font-size:130px;font-weight:800;line-height:1;color:#bef264;font-variant-numeric:tabular-nums;
  text-shadow:0 0 22px rgba(190,242,100,.5)}
.gfin-trows{display:flex;flex-direction:column-reverse;gap:7px;width:330px;flex:none}
.gfin-trow{display:flex;align-items:center;justify-content:space-between;height:40px;padding:0 14px;border-radius:8px;
  background:rgba(255,255,255,.05);color:#5b6684;font-size:15px;font-weight:800;white-space:nowrap;box-sizing:border-box;
  transition:all .25s ease}
.gfin-trow.at{box-shadow:0 0 0 3px #0b0f1a,0 0 30px var(--tc);transform:scale(1.05)}
.gfin-trow.out{transform:scale(1.05) translateX(14px)}

.gfin-ttl{display:flex;flex-direction:column;align-items:center;gap:2px;text-align:center;max-width:min(640px,100%)}
.gfin-ttl .eb{font-size:11px;font-weight:800;letter-spacing:.16em;text-transform:uppercase;color:#7dd3fc}
.gfin-ttl .nm{font-size:clamp(24px,3.4vw,32px);font-weight:800;line-height:1.1;color:var(--tc)}
.gfin-ttl .ln{font-size:13.5px;font-weight:700;opacity:.82}
.gfin-ttl .ln b{color:#e8b43a;font-weight:800}

@media (max-width: 760px){
  .gfin-pips{display:grid;grid-template-columns:repeat(10,minmax(0,1fr));width:100%;margin:10px 0 8px}
  .gfin-pip{width:auto;height:24px}
  .gfin-mrow{flex-direction:column;align-items:stretch;gap:12px;width:100%}
  .gfin-mcol{align-items:flex-start}
  .gfin-calc{width:100%;padding:12px;border-radius:16px}
  .gfin-scr{height:196px;padding:14px 16px;gap:5px}
  .gfin-ln{height:24px;line-height:24px;font-size:18px}
  .gfin-ln.cur{height:34px;line-height:34px;font-size:28px}
  .gfin-err{height:42px;line-height:42px;font-size:38px}
  .gfin.m-math .gfin-mid{padding:0 62px 0 18px}
  .gfin.m-math .gfin-nm{font-size:30px}
  .gfin.m-math .gfin-mcol .gfin-n.fx{font-size:64px}
  .gfin-tph{flex-direction:column;gap:16px;top:44px;bottom:96px;padding:0 62px 0 18px}
  .gfin-tlead{align-items:center}
  .gfin-teb{font-size:11px;letter-spacing:.14em;text-align:center}
  .gfin-ttot{font-size:84px;text-align:center}
  .gfin-shelf{width:100%;max-width:300px;gap:5px}
  .gfin-book{height:38px;font-size:13px;padding:0 12px;border-left-width:6px}
  .gfin-book.out{transform:translateX(18px) rotate(-3deg)}
  .gfin-lcd{width:240px;height:132px;padding:0 24px}
  .gfin-lcd .v{font-size:108px}
  .gfin-trows{width:100%;gap:6px}
  .gfin-trow{height:36px;font-size:14px}
  .gfin-ttl .nm{font-size:22px}
  .gfin-ttl .ln{font-size:12px}
}

@media (prefers-reduced-motion: reduce){
  .gfin,.gfin-mid,.gfin-fill,.gfin-seg,.gfin-board,.gfin-mark,.gfin-n,.gfin-rk,.gfin-q,.gfin-tph,.gfin-book,.gfin-trow{transition:none}
}
`;

// ══ THE TWO GAUNTLETS' ENDINGS (owner, 2026-10-17: "It should match the
// mockup, fully.") ══════════════════════════════════════════════════════════
//
// The Trivia Gauntlet's "Bookshelf" and the Math Gauntlet's "Readout", built
// to the approved mockups (TriviaGauntlet / PhoneTrivia / MathGauntlet /
// PhoneMath). Every other circuit that mounts this curtain (the Trivia
// Encore) gets the Broadcast above, untouched.
//
// Three phases on ONE clock, the mockups' own timeline:
//   PAINT  each quiz owns the screen in its ramp colour for PD ms, its count
//          easing up, the miss cracking at MISS ms and its rank at RANK ms.
//   COUNT  the colours drain, the total climbs the run's title ladder, STEP ms
//          a title, the stage flashing the title's colour for FLASH ms at each
//          crossing, and the earned title pulls out.
//   BOARD  the title, the per-quiz tiles, the challenge and the real board.
//          It HOLDS: a tap outside its links, Escape, or See your results
//          closes the curtain onto the end card below.
// A tap or a key before the board jumps straight to it (the mockups' skip).
//
// IT INVENTS NOTHING. Scores and clocks are the run's own; ranks and fields
// come off useGauntletField; the board rows, their per-quiz scores and the
// player's place come off the circuit board RunClient already reads; the
// ticket count is the drawing's own read. A figure that is missing drops its
// line.
//
// Counting numbers sit in boxes sized to their FINAL value in ch, with
// tabular figures, so nothing beside them moves while they count.

const GE = {
  trivia: { P0: 300, PD: 1300, COUNT: 700, MISS: 760, RANK: 900, FILL: 800 },
  math: { P0: 300, PD: 1500, COUNT: 800, MISS: 900, RANK: 1000, FILL: 900 },
};
const GE_STEP = 600;
const GE_FLASH = 220;
const GE_INK = '#0b0f1a';
const GE_LIGHT = '#e9edf4';
const geEase = (x) => { const v = Math.max(0, Math.min(1, x)); return 1 - Math.pow(1 - v, 3); };
const article = (name) => (/^[aeiou]/i.test(String(name || '')) ? 'an' : 'a');
const digits = (n) => String(Math.max(0, Math.round(Number(n) || 0))).length;
function clockOf(secs) {
  const s = Math.max(0, Math.round(Number(secs) || 0));
  if (!s) return '';
  const h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60), r = s % 60;
  return h ? `${h}:${String(m).padStart(2, '0')}:${String(r).padStart(2, '0')}` : `${m}:${String(r).padStart(2, '0')}`;
}
function geEtToday() {
  try { return new Date().toLocaleDateString('en-CA', { timeZone: 'America/New_York' }); }
  catch (e) { return new Date().toISOString().slice(0, 10); }
}
function geDate(phone) {
  try {
    const o = phone ? { month: 'short', day: 'numeric' } : { weekday: 'short', month: 'short', day: 'numeric' };
    return new Date().toLocaleDateString('en-US', { ...o, timeZone: 'America/New_York' }).replace(/,/g, '');
  } catch (e) { return ''; }
}

// The readout's lines: the problems this game actually asked that the player
// got right, racing past, then ERR on the one that ended it.
function geReadoutLines(qs, got, local) {
  const n = Math.min(got, qs.length);
  if (!n) return [];
  const every = Math.min(140, 880 / n);
  const tick = Math.min(n - 1, Math.floor(Math.min(local, 880) / every));
  const out = [];
  for (let j = 3; j >= 0; j--) {
    const idx = tick - j;
    if (idx < 0) continue;
    out.push({ idx, cur: j === 0, op: j === 0 ? 1 : 0.35 + (3 - j) * 0.15 });
  }
  return out;
}

// THE CHALLENGE CARD. The send is the run end card's own (RunChallengeButton
// in app/RunChallenge.jsx): the same link, the same referral, the same send
// record, so a challenge sent from the curtain is the challenge the end card
// would have sent. Kept in step by hand; the two must not drift.
function GeChallenge({ gameKey, challenge }) {
  const [msg, setMsg] = useState('');
  const [draw, setDraw] = useState(false);
  const tk = useMyTickets();
  useEffect(() => { setDraw(drawingIsLive()); }, []);
  const score = challenge.score || 0;
  const blank = !(score > 0);
  const send = () => {
    let who = 'A friend';
    try { who = savedIdentity().username || who; } catch (e) { /* a guest */ }
    const unit = RUN_CHALLENGES[gameKey] ? RUN_CHALLENGES[gameKey].unit : 'points';
    const o = unit === 'right' ? 0 : (challenge.total || 0);
    const day = geEtToday();
    const d = ymdCompact(day);
    const tt = challenge.t != null ? challenge.t : (blank && !o ? 0 : null);
    const raw = encodeChallenge({ name: who, t: tt, s: score, o, n: challenge.n, won: false, d, x: challenge.status || '' });
    const cid = newCid();
    const url = withRef(withCid(`${window.location.origin}/vs?g=${encodeURIComponent(gameKey)}&vs=${encodeURIComponent(raw)}&v=3`, cid));
    recordSend({ cid, gameKey, num: challenge.n, day, fig: { s: score, o, t: tt, won: false, x: challenge.status || '' }, source: 'run' });
    const copy = () => { try { navigator.clipboard.writeText(url).then(() => setMsg('Link copied. Paste it to a friend.'), () => setMsg(url)); } catch (e) { setMsg(url); } };
    let touch = false;
    try { touch = !!(window.matchMedia && window.matchMedia('(pointer: coarse)').matches); } catch (e) { touch = false; }
    if (touch && navigator.share) navigator.share({ url }).catch(() => {}); else copy();
  };
  const n = tk && Number.isFinite(tk.count) ? tk.count : null;
  const tickets = draw && tk && tk.named && n != null
    ? `You have ${n} ticket${n === 1 ? '' : 's'} for the ${DRAWING.prizeLabel} drawing. Each new friend who finishes from your link adds one.`
    : null;
  return (
    <div className="ge-pop ge-chal">
      <div className="ge-chal-h">{blank ? 'Challenge a friend to beat your run' : `Challenge a friend to get past ${score}`}</div>
      {tickets ? <div className="ge-chal-s">{tickets}</div> : null}
      <button type="button" className="ge-chal-go" onClick={send}>{msg ? (msg.startsWith('Link copied') ? 'Link copied' : 'Copy this link') : 'Send the challenge'}</button>
      {msg && !msg.startsWith('Link copied') ? <div className="ge-chal-u">{msg}</div> : null}
    </div>
  );
}

function GauntletEnding({
  sections = [],
  results = [],
  score = 0,
  avgTotal = null,
  rows = [],
  meRow = null,
  fieldSize = null,
  field = null,
  circuitId = null,
  circuitName = '',
  clock = 0,
  challenge = null,
  similar = null,
  boardHref = '',
  onDone,
}) {
  const N = sections.length;
  const mode = circuitId === 'math' ? 'math' : 'trivia';
  const TM = GE[mode];
  const ladder = titleLadder(circuitId) || [];
  const earned = titleFor(circuitId, score);
  const K = earned ? earned.index : 0;

  const [phone, setPhone] = useState(() => {
    try { return typeof window !== 'undefined' && !!window.matchMedia && window.matchMedia('(max-width: 640px)').matches; }
    catch (e) { return false; }
  });
  const [t, setT] = useState(0);
  const baseRef = useRef(0);
  const doneRef = useRef(false);

  const banks = useMemo(() => sections.map((s, i) => {
    const res = results[i] || null;
    const asked = (s.questions && s.questions.length) || (res && res.total) || 0;
    const got = res && Number.isFinite(res.score) ? res.score : 0;
    const colour = rampFor(Number.isFinite(s.slot) ? s.slot : i);
    const rank = field && typeof field.rank === 'function' ? field.rank(s.key, got) : null;
    const plays = field && field.plays && Number.isFinite(field.plays[s.key]) ? field.plays[s.key] : null;
    return {
      key: s.key, num: i + 1, name: s.name || s.key,
      sub: mode === 'math' ? (s.subject || s.tag || '') : (s.topic || s.subject || s.cat || s.tag || ''),
      asked, got, colour, rank, plays, qs: Array.isArray(s.questions) ? s.questions : [],
    };
  }), [sections, results, field, mode]);

  const TOTAL = score;
  const P0 = TM.P0, PD = TM.PD;
  const RP = P0 + N * PD;
  const CNT = GE_STEP * (K + 1) + 300;
  const BOARD = RP + CNT + 300;
  const END = BOARD + 3600;

  const finish = () => {
    if (doneRef.current) return;
    doneRef.current = true;
    if (typeof onDone === 'function') onDone();
  };
  const toBoard = () => {
    const now = typeof performance !== 'undefined' ? performance.now() : Date.now();
    if (now - baseRef.current < BOARD) { baseRef.current = now - BOARD; setT(BOARD); }
  };

  // The clock. Thirty frames a second is all the mockups' timeline needs, and
  // it stops once the board has fully landed, so a held board costs nothing.
  useEffect(() => {
    const reduced = typeof window !== 'undefined' && window.matchMedia
      && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduced || !N) { finish(); return undefined; }
    baseRef.current = typeof performance !== 'undefined' ? performance.now() : Date.now();
    const iv = setInterval(() => {
      const now = typeof performance !== 'undefined' ? performance.now() : Date.now();
      const e = now - baseRef.current;
      setT(e);
      if (e > END) clearInterval(iv);
    }, 33);
    return () => clearInterval(iv);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [N]);

  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return undefined;
    const mq = window.matchMedia('(max-width: 640px)');
    const on = () => setPhone(mq.matches);
    if (mq.addEventListener) mq.addEventListener('change', on); else if (mq.addListener) mq.addListener(on);
    return () => { if (mq.removeEventListener) mq.removeEventListener('change', on); else if (mq.removeListener) mq.removeListener(on); };
  }, []);

  // Escape closes; any other key before the board jumps to it. On the board
  // keys are left alone, so Tab reaches its links.
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') { finish(); return; }
      const now = typeof performance !== 'undefined' ? performance.now() : Date.now();
      if (now - baseRef.current < BOARD) toBoard();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [BOARD]);

  const onStageClick = (e) => {
    if (t < BOARD) { toBoard(); return; }
    const el = e && e.target && e.target.closest ? e.target.closest('a,button') : null;
    if (el) return;
    finish();
  };

  // ── where on the timeline ──
  const pi = t >= P0 && t < RP ? Math.min(N - 1, Math.floor((t - P0) / PD)) : -1;
  const local = pi >= 0 ? t - P0 - pi * PD : 0;
  const b = pi >= 0 ? banks[pi] : banks[0];
  const isPaint = pi >= 0;
  const isCount = t >= RP && t < BOARD;
  const isBoard = t >= BOARD;
  const count = b ? Math.round(b.got * geEase(local / TM.COUNT)) : 0;
  const missShown = local > TM.MISS;
  const showRank = local > TM.RANK;

  const cl = t - RP;
  const k = isCount ? Math.min(K, Math.max(0, Math.floor(cl / GE_STEP))) : K;
  const kl = cl - k * GE_STEP;
  const lo = ladder[k] ? ladder[k].min : 0;
  const hi = k === K ? TOTAL : (ladder[k + 1] ? ladder[k + 1].min - 1 : TOTAL);
  const total = isCount ? Math.round(lo + (hi - lo) * geEase(kl / (GE_STEP - 150))) : TOTAL;
  let at = 0;
  ladder.forEach((x, i) => { if (total >= x.min) at = i; });
  const flash = isCount && kl < GE_FLASH;
  const pulled = isCount && k === K && kl > 300;

  let bg = '#0b0f1a', ink = GE_LIGHT;
  if (isPaint && b) { bg = b.colour; ink = GE_INK; } else if (flash && ladder[at]) { bg = ladder[at].colour; ink = GE_INK; }

  // ── the side bar (Trivia only): the total against today's average and best ──
  const finishedRows = (Array.isArray(rows) ? rows : []).filter((x) => Number.isFinite(Number(x.total)));
  const markersOn = mode === 'trivia' && finishedRows.length >= 2;
  const best = markersOn ? Math.max(...finishedRows.map((x) => Number(x.total) || 0)) : null;
  const avg = markersOn && Number.isFinite(Number(avgTotal)) ? Math.round(Number(avgTotal)) : null;
  const barScale = Math.max(1, best || 0, TOTAL);
  const sideW = Math.max(digits(barScale), 2);

  // ── the board ──
  const meKey = meRow && meRow.userKey ? meRow.userKey : null;
  const top = finishedRows.slice(0, 3);
  const meInTop = !!(meKey && top.some((x) => x.userKey === meKey));
  const meRank = meRow && Number.isFinite(Number(meRow.rank)) ? Number(meRow.rank) : null;
  const ahead = meRank && fieldSize && fieldSize >= 2 ? Math.max(0, Math.round(((fieldSize - meRank) / fieldSize) * 100)) : null;
  const boardRows = top.map((x, i) => ({
    key: x.userKey || `r${i}`, rank: String(x.rank || i + 1), name: x.username || 'Player',
    title: (titleFor(circuitId, x.total) || {}).name || '', total: Math.round(Number(x.total) || 0),
    per: x.perGame || null, me: !!(meKey && x.userKey === meKey), rc: ['#e8b43a', '#b8bcc4', '#c8814b'][i] || GE_LIGHT,
  }));
  if (meRow && !meInTop && meRank) {
    const ttl = (earned && earned.name) || '';
    boardRows.push({
      key: 'me', rank: `#${meRank}`, name: meRow.username || 'You',
      title: ahead != null ? `${ttl} · ahead of ${ahead}%` : ttl, total: TOTAL,
      per: Object.fromEntries(banks.map((x) => [x.key, { score: x.got }])), me: true, rc: '#7dd3fc',
    });
  }
  boardRows.forEach((r) => { if (r.me && r.key !== 'me' && ahead != null) r.title = `${r.title} · ahead of ${ahead}%`; });
  const barMax = Math.max(1, ...boardRows.flatMap((r) => (r.per ? banks.map((x) => Number(r.per[x.key] && r.per[x.key].score) || 0) : [0])));
  const rowOn = (i) => t >= BOARD + (phone ? 2000 + i * 300 : 400 + i * 320);
  const chalOn = t >= BOARD + (phone ? 1200 : 1800);
  const fieldWord = Number.isFinite(Number(fieldSize)) && fieldSize > 0 ? fieldSize : null;

  const capRight = isPaint ? `${mode === 'math' ? 'Game' : 'Quiz'} ${pi + 1} of ${N}` : isBoard ? 'Final' : '';
  const capDate = geDate(phone);
  const noun = mode === 'math' ? 'games' : 'quizzes';
  const clockTxt = clockOf(clock);
  const nextTxt = earned && earned.next ? `${earned.toNext} more right and you are ${article(earned.next.name)} ${earned.next.name}.` : null;
  const fromTxt = earned && earned.next ? `${earned.toNext} from ${earned.next.name}` : null;

  // ── pieces ──
  const pips = () => {
    if (!b || !b.asked) return null;
    const room = phone ? Math.max(20, Math.ceil((b.got + 1) / 10) * 10) : Math.max(28, b.got + 1);
    const nP = Math.min(b.asked, room);
    const out = [];
    for (let i = 0; i < nP; i++) {
      const right = i < count;
      const miss = i === b.got && b.got < b.asked && missShown;
      out.push(
        <div key={i} className={`ge-pip${miss ? ' g-crack' : ''}`} style={{
          background: right ? GE_INK : miss ? '#b4232a' : 'transparent',
          border: right || miss ? `2px solid ${GE_INK}` : '2px solid rgba(11,15,26,.25)',
        }}>{miss ? '×' : ''}</div>,
      );
    }
    return <div className={phone ? 'ge-pips ph' : 'ge-pips'} aria-hidden="true">{out}</div>;
  };

  const readout = () => {
    const lines = geReadoutLines(b.qs, b.got, local);
    const err = b.got < b.asked && missShown;
    return (
      <div className={phone ? 'ge-calc ph' : 'ge-calc'} aria-hidden="true">
        <div className="ge-scr">
          {lines.map((ln) => (
            <div key={`${pi}-${ln.idx}`} className={`ge-ln m-tick${ln.cur ? ' cur' : ''}`} style={{ opacity: ln.op }}>
              {mathText(readoutLine(b.qs[ln.idx]))}
            </div>
          ))}
          {err ? <div className="ge-err m-err">ERR</div> : null}
        </div>
      </div>
    );
  };

  const rankLine = (where) => (b && b.rank != null && b.plays != null && showRank
    ? <div className="ge-pop ge-rk">{where(b)}</div> : null);

  const countBox = (fs) => (
    <div className="ge-cnt" style={{ fontSize: fs, width: `${digits(b ? b.got : 0)}ch` }}>{count}</div>
  );

  const sideBar = () => {
    if (mode !== 'trivia') return null;
    const pct = (v) => `${Math.min(100, Math.max(0, (v / barScale) * 100))}%`;
    const L = ladder.length || 6;
    const h = phone ? L * 40 + (L - 1) * 5 : L * 46 + (L - 1) * 6;
    const lw = `calc(${sideW}ch + ${phone ? 2.6 : 2.8}em)`;
    const rw = `calc(${sideW}ch + ${phone ? 3.1 : 3.3}em)`;
    return (
      <div className={phone ? 'ge-side ph' : 'ge-side'} aria-hidden="true" style={{ height: h }}>
        <div className="ge-side-col l" style={{ width: lw }}><span style={{ bottom: pct(total) }}>You {total}</span></div>
        <div className="ge-side-trk">
          <div className="ge-side-fill" style={{ height: pct(total) }} />
          {avg != null ? <div className="ge-side-tick" style={{ bottom: pct(avg) }} /> : null}
          {best != null ? <div className="ge-side-tick" style={{ bottom: pct(best) }} /> : null}
        </div>
        <div className="ge-side-col r" style={{ width: rw }}>
          {avg != null ? <span style={{ bottom: pct(avg) }}>Avg {avg}</span> : null}
          {best != null ? <span style={{ bottom: pct(best) }}>Best {best}</span> : null}
        </div>
      </div>
    );
  };

  const books = (w0, dw, h, fs, tx, rot, centred) => (
    <div className="ge-books" style={{ width: w0, gap: phone ? 5 : 6 }}>
      {ladder.map((x, i) => {
        const lit = i <= at;
        return (
          <div key={x.name} className="ge-book" style={{
            width: w0 - i * dw, height: h, fontSize: fs, background: lit ? x.colour : 'rgba(255,255,255,.06)',
            color: lit ? GE_INK : '#5b6684', borderLeftWidth: phone ? 6 : 7,
            boxShadow: i === at ? `0 0 0 3px ${GE_INK}, 0 0 ${phone ? 28 : 34}px ${x.colour}` : 'none',
            transform: i === at && pulled ? `translateX(${tx}px) rotate(${rot}deg)` : 'none',
            justifyContent: centred ? 'center' : 'space-between', padding: centred ? 0 : '0 18px',
          }}>
            <span className="ge-bnm">{x.name}</span>{centred ? null : <span className="ge-bmn">{x.min}+</span>}
          </div>
        );
      })}
    </div>
  );

  const titleRows = () => (
    <div className="ge-trows" style={phone ? { width: '100%', gap: 6 } : null}>
      {ladder.map((x, i) => {
        const lit = i <= at;
        return (
          <div key={x.name} className="ge-trow" style={{
            height: phone ? 38 : 40, background: lit ? x.colour : 'rgba(255,255,255,.05)', color: lit ? GE_INK : '#5b6684',
            boxShadow: i === at ? `0 0 0 3px ${GE_INK}, 0 0 ${phone ? 26 : 30}px ${x.colour}` : 'none',
            transform: i === at ? `scale(${phone ? 1.04 : 1.05})` : 'none',
          }}>
            <span>{x.name}</span><span className="ge-tmn">{x.min}+</span>
          </div>
        );
      })}
    </div>
  );

  const lcd = (w, h, fs, pad) => (
    <div className="ge-lcd" style={{ width: w, height: h, padding: `0 ${pad}px` }}>
      <div style={{ fontSize: fs, width: `${digits(TOTAL)}ch`, textAlign: 'right' }}>{total}</div>
    </div>
  );

  const bars = (r, h, gap) => (r.per ? (
    <div className="ge-bars" style={{ height: h, gap }}>
      {banks.map((x) => {
        const v = Number(r.per[x.key] && r.per[x.key].score) || 0;
        return <div key={x.key} style={{ height: `${Math.min(100, Math.round((v / barMax) * 100))}%`, background: x.colour, borderRadius: phone ? '2px 2px 0 0' : '3px 3px 0 0' }} />;
      })}
    </div>
  ) : <div />);

  const boardList = () => (
    <>
      <div className="ge-bhd">
        <div className="ge-bt">Today&rsquo;s board{fieldWord ? ` · ${fieldWord}${phone ? '' : ' players'}` : ''}</div>
        {boardHref ? <a href={boardHref} className="ge-blink">Full board</a> : null}
      </div>
      <div className="ge-rows">
        {boardRows.map((r, i) => (rowOn(i) ? (
          <div key={r.key} className={`ge-row ${mode === 'math' ? 'm-row' : 'g-row'}${phone ? ' ph' : ''}${r.me ? ' me' : ''}`}
            style={phone ? { gridTemplateColumns: `34px minmax(0, 1fr) ${mode === 'math' ? 52 : 60}px ${mode === 'math' ? 30 : 34}px` } : null}>
            <div className="ge-rr" style={{ color: r.me ? '#7dd3fc' : r.rc }}>{r.rank}</div>
            <div style={{ minWidth: 0 }}>
              <div className="ge-rn">{r.name}</div>
              {r.title ? <div className="ge-rt">{r.title}</div> : null}
            </div>
            {bars(r, phone ? 22 : 26, phone ? 2 : 3)}
            <div className="ge-rtot">{r.total}</div>
          </div>
        ) : null))}
      </div>
      {!phone && boardRows.length ? (
        <div className="ge-foot">
          {mode === 'math'
            ? `Bars: right answers on ${banks.map((x) => x.name).join(', ').replace(/, ([^,]*)$/, ' and $1')}.`
            : `Bars: questions right on each of the ${spell(N)}.`}
        </div>
      ) : null}
    </>
  );

  const chalAndSimilar = () => (chalOn ? (
    <>
      {challenge ? <GeChallenge gameKey={circuitId} challenge={challenge} /> : null}
      {similar && similar.href ? (
        <a href={similar.href} className="ge-pop ge-sim" style={{ animationDelay: '.15s' }}>Play similar: {similar.name}</a>
      ) : null}
    </>
  ) : null);

  const tiles = (cls, delay) => (
    <div className={`ge-pop ge-tiles ${cls}`} style={{ animationDelay: delay, gridTemplateColumns: `repeat(${N}, minmax(0, 1fr))` }}>
      {banks.map((x) => (
        <div key={x.key} className="ge-tile" style={{ borderTopColor: x.colour }}>
          <div className="ge-tn">{x.name}</div>
          <div className="ge-ts">{x.got}</div>
          {!phone && x.rank != null ? <div className="ge-tr">#{x.rank}</div> : null}
        </div>
      ))}
    </div>
  );

  // ── the bottom strip ──
  const strip = mode === 'trivia' ? (
    <div className={phone ? 'ge-lad ph' : 'ge-lad'}>
      {banks.map((x, i) => {
        const filled = t >= P0 + i * PD + TM.FILL;
        return (
          <div key={x.key} className="ge-lseg" style={{ flex: `${Math.max(1, x.asked)} 1 0` }}>
            <div className="ge-llb" style={{ color: isPaint ? GE_INK : '#9aa8c4' }}>
              {phone ? (filled ? `${x.name} ${x.got}` : x.name) : <>{x.name} <span className="ge-lv">{filled ? x.got : ''}</span></>}
            </div>
            <div className="ge-ltr" style={{ background: isPaint ? 'rgba(11,15,26,.14)' : 'rgba(255,255,255,.08)' }}>
              <div style={{ height: '100%', width: filled && x.asked ? `${Math.round((x.got / x.asked) * 100)}%` : '0%', background: isPaint ? GE_INK : x.colour, transition: 'width .55s ease' }} />
            </div>
          </div>
        );
      })}
    </div>
  ) : (
    <div className={phone ? 'ge-mst ph' : 'ge-mst'}>
      {banks.map((x, i) => {
        const filled = t >= P0 + i * PD + TM.FILL;
        return (
          <div key={x.key} className="ge-mtile" style={{
            background: filled ? x.colour : (isPaint ? 'rgba(11,15,26,.1)' : 'rgba(255,255,255,.05)'),
            color: filled ? GE_INK : (isPaint ? 'rgba(11,15,26,.55)' : '#9aa8c4'),
            border: filled ? '1px solid rgba(11,15,26,.35)' : (isPaint ? '1px dashed rgba(11,15,26,.3)' : '1px dashed rgba(255,255,255,.18)'),
          }}>
            <span>{x.name}</span><span className="ge-mv" style={{ width: `${digits(x.got)}ch` }}>{filled ? x.got : ''}</span>
          </div>
        );
      })}
    </div>
  );

  // ── the phases ──
  let middle = null;
  if (isPaint && b) {
    if (mode === 'trivia') {
      middle = phone ? (
        <div className="ge-paint ph">
          <div className="ge-eb">Quiz {b.num} of {N}{b.sub ? ` · ${b.sub}` : ''}</div>
          <div className="ge-nm" style={{ fontSize: 52 }}>{b.name}</div>
          {pips()}
          <div className="ge-crow">
            {countBox(84)}
            <div className="ge-clb" style={{ fontSize: 16 }}>{b.got === b.asked ? 'right, no miss' : 'right before the miss'}</div>
          </div>
          <div style={{ minHeight: 24 }}>{rankLine((x) => `#${x.rank} of ${x.plays} on this quiz today`)}</div>
        </div>
      ) : (
        <div className="ge-paint">
          <div className="ge-eb" style={{ fontSize: 13, letterSpacing: '.18em' }}>Quiz {b.num} of {N}{b.sub ? ` · ${b.sub}` : ''}</div>
          <div className="ge-nm" style={{ fontSize: 64 }}>{b.name}</div>
          {pips()}
          <div className="ge-crow" style={{ gap: 22 }}>
            {countBox(96)}
            <div className="ge-clb" style={{ fontSize: 20 }}>{b.got === b.asked ? 'right, no miss' : 'right before the miss'}</div>
            {b.rank != null && b.plays != null && showRank
              ? <div className="ge-pop ge-rk" style={{ marginLeft: 'auto', fontSize: 20 }}>#{b.rank} of {b.plays} on this quiz today</div> : null}
          </div>
        </div>
      );
    } else {
      middle = phone ? (
        <div className="ge-paint ph">
          <div className="ge-eb">Game {b.num} of {N}{b.sub ? ` · ${b.sub}` : ''}</div>
          <div className="ge-nm" style={{ fontSize: 52 }}>{b.name}</div>
          {readout()}
          <div className="ge-crow" style={{ justifyContent: 'space-between' }}>
            {countBox(84)}
            {b.rank != null && b.plays != null && showRank
              ? <div className="ge-pop ge-rk" style={{ fontSize: 16, textAlign: 'right' }}>#{b.rank} of {b.plays}<br />today</div> : null}
          </div>
        </div>
      ) : (
        <div className="ge-mpaint">
          {readout()}
          <div className="ge-mcol">
            <div className="ge-eb" style={{ fontSize: 13, letterSpacing: '.18em' }}>Game {b.num} of {N}</div>
            <div className="ge-nm" style={{ fontSize: 60 }}>{b.name}</div>
            {b.sub ? <div style={{ fontSize: 18, fontWeight: 700 }}>{b.sub}.</div> : null}
            <div className="ge-cnt" style={{ fontSize: 104, height: 104, width: 150 }}>{count}</div>
            {b.rank != null && b.plays != null && showRank
              ? <div className="ge-pop ge-rk" style={{ fontSize: 18 }}>#{b.rank} of {b.plays} on {b.name} today</div> : null}
          </div>
        </div>
      );
    }
  } else if (isCount) {
    if (mode === 'trivia') {
      middle = phone ? (
        <div className="ge-count ph">
          <div className="ge-eb" style={{ opacity: 0.75 }}>Questions right, all {spell(N)}</div>
          <div className="ge-tot" style={{ fontSize: 100, width: `${digits(TOTAL)}ch` }}>{total}</div>
          <div className="ge-shelfrow">
            {books(252, 14, 40, 13, 18, -3, true)}
            {sideBar()}
          </div>
        </div>
      ) : (
        <div className="ge-count">
          <div className="ge-lead">
            <div className="ge-eb" style={{ fontSize: 13, letterSpacing: '.18em', opacity: 0.75 }}>Questions right, all {spell(N)} quizzes</div>
            <div className="ge-tot" style={{ fontSize: 140, width: `${digits(TOTAL)}ch` }}>{total}</div>
          </div>
          {books(380, 18, 46, 17, 26, -2, false)}
          {sideBar()}
        </div>
      );
    } else {
      middle = phone ? (
        <div className="ge-count ph" style={{ padding: '0 22px' }}>
          <div className="ge-eb" style={{ opacity: 0.75 }}>Right answers, all {spell(N)} {noun}</div>
          {lcd(240, 132, 108, 24)}
          {titleRows()}
        </div>
      ) : (
        <div className="ge-count" style={{ gap: 46 }}>
          <div className="ge-lead">
            <div className="ge-eb" style={{ fontSize: 13, letterSpacing: '.18em', opacity: 0.75 }}>Right answers, all {spell(N)} {noun}</div>
            {lcd(300, 160, 130, 26)}
          </div>
          {titleRows()}
        </div>
      );
    }
  } else if (isBoard) {
    const titleHead = mode === 'math' ? 'Today you are' : `Today you are ${article(earned ? earned.name : '')}`;
    if (phone) {
      middle = (
        <div className="ge-board ph">
          {mode === 'math' ? (
            <div style={{ display: 'flex', gap: 14, alignItems: 'center' }}>
              <div className="ge-pop ge-mini-lcd" style={{ padding: '6px 14px' }}><div style={{ fontSize: 44 }}>{TOTAL}</div></div>
              <div className="ge-pop" style={{ animationDelay: '.3s' }}>
                <div className="ge-th" style={{ fontSize: 10 }}>{titleHead}</div>
                <div className="ge-tname" style={{ fontSize: 24 }}>{earned ? earned.name : ''}</div>
                <div className="ge-tsub" style={{ fontSize: 13, marginTop: 3 }}>
                  {[clockTxt, null].filter(Boolean).join(' · ')}
                  {fromTxt ? <>{clockTxt ? ' · ' : ''}<b style={{ color: '#e8b43a' }}>{fromTxt}</b></> : null}
                </div>
              </div>
            </div>
          ) : (
            <div className="ge-pop">
              <div className="ge-th" style={{ fontSize: 10 }}>{titleHead}</div>
              <div className="ge-tname" style={{ fontSize: 27 }}>{earned ? earned.name : ''}</div>
              <div className="ge-tsub" style={{ fontSize: 13, marginTop: 3 }}>
                {TOTAL} right{clockTxt ? ` · ${clockTxt}` : ''}
                {fromTxt ? <> {'·'} <b style={{ color: '#e8b43a' }}>{fromTxt}</b></> : null}
              </div>
            </div>
          )}
          {mode === 'trivia' ? tiles('ph', '.3s') : null}
          {chalAndSimilar()}
          {boardList()}
        </div>
      );
    } else {
      middle = (
        <div className="ge-board">
          <div className="ge-bl">
            {mode === 'math' ? (
              <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
                <div className="ge-pop ge-mini-lcd" style={{ padding: '8px 16px' }}><div style={{ fontSize: 54 }}>{TOTAL}</div></div>
                <div className="ge-pop" style={{ animationDelay: '.3s' }}>
                  <div className="ge-th">{titleHead}</div>
                  <div className="ge-tname" style={{ fontSize: 30 }}>{earned ? earned.name : ''}</div>
                  <div className="ge-tsub">{TOTAL} right{clockTxt ? ` · ${clockTxt}` : ''}</div>
                </div>
              </div>
            ) : (
              <div style={{ display: 'flex', gap: 18, alignItems: 'flex-end' }}>
                <div className="ge-mshelf">
                  {ladder.map((x, i) => (
                    <div key={x.name} style={{ width: 120 - i * 8, background: i <= K ? x.colour : 'rgba(255,255,255,.1)', transform: i === K ? 'translateX(10px)' : 'none' }} />
                  ))}
                </div>
                <div className="ge-pop" style={{ animationDelay: '.3s' }}>
                  <div className="ge-th">{titleHead}</div>
                  <div className="ge-tname" style={{ fontSize: 30 }}>{earned ? earned.name : ''}</div>
                  <div className="ge-tsub">{TOTAL} questions right{clockTxt ? ` · ${clockTxt}` : ''}</div>
                </div>
              </div>
            )}
            {earned ? (
              <div className="ge-pop ge-tline" style={{ animationDelay: '.5s' }}>
                {earned.line}{nextTxt ? <> <b style={{ color: '#e8b43a' }}>{nextTxt}</b></> : null}
              </div>
            ) : null}
            {tiles('', '.7s')}
            {chalAndSimilar()}
          </div>
          <div className="ge-br">{boardList()}</div>
        </div>
      );
    }
  }

  return (
    <div
      className={`ge${phone ? ' ph' : ''}`}
      style={{ background: bg, color: ink, transition: `background ${flash ? '.05s' : '.4s'} ease, color .3s ease` }}
      onClick={onStageClick}
      role="dialog"
      aria-label={`${circuitName || 'Run'} ending`}
    >
      <style dangerouslySetInnerHTML={{ __html: GE_CSS }} />
      <div className="ge-cap">
        <span>{circuitName}</span>{capDate ? <span>{capDate}</span> : null}
        <span style={{ marginLeft: 'auto' }}>{capRight}</span>
        {isBoard ? <button type="button" className="ge-see" onClick={finish}>See your results</button> : null}
      </div>
      <div className="ge-mid">{middle}</div>
      {strip}
    </div>
  );
}

export default function GauntletFinale(props) {
  const c = props && props.circuitId;
  if (c === 'gauntlet' || c === 'math') return <GauntletEnding {...props} />;
  return <Broadcast {...props} />;
}

const GE_CSS = `
.ge{position:fixed;inset:0;z-index:80;overflow:hidden;display:flex;flex-direction:column;cursor:pointer;
  font-family:Manrope,system-ui,-apple-system,'Segoe UI',sans-serif}
.ge a{color:#7dd3fc}.ge a:hover{color:#bae6fd}
.ge-cap{display:flex;align-items:center;gap:12px;padding:18px 28px 0;font-size:11px;font-weight:800;letter-spacing:.16em;text-transform:uppercase;flex:none}
.ge-cap>span{opacity:.78}
.ge.ph .ge-cap{gap:10px;padding:16px 18px 0;font-size:10px}
.ge-see{font:inherit;font-size:11px;letter-spacing:.06em;text-transform:none;font-weight:800;color:#7dd3fc;background:none;border:0;padding:0;cursor:pointer;opacity:1}
.ge-see:hover{color:#bae6fd;text-decoration:underline}
.ge-mid{flex:1 1 auto;display:flex;flex-direction:column;min-height:0;overflow-y:auto;overflow-x:hidden}
.ge-eb{font-size:12px;font-weight:800;letter-spacing:.16em;text-transform:uppercase}
.ge-nm{font-weight:800;line-height:1}
.ge-paint{flex:1 1 auto;display:flex;flex-direction:column;justify-content:center;padding:0 64px;gap:16px}
.ge-paint.ph{padding:0 22px;gap:14px}
.ge-pips{display:flex;flex-wrap:wrap;gap:5px;max-width:840px}
.ge-pips.ph{display:grid;grid-template-columns:repeat(10,minmax(0,1fr));max-width:none}
.ge-pip{width:26px;height:26px;border-radius:6px;color:#fff;display:flex;align-items:center;justify-content:center;font-size:15px;font-weight:800;box-sizing:border-box}
.ge-pips.ph .ge-pip{width:auto;height:28px}
.ge-crow{display:flex;align-items:baseline;gap:14px}
.ge-cnt{font-weight:800;line-height:1;font-variant-numeric:tabular-nums;text-align:right;flex:none}
.ge-clb{font-weight:700}
.ge-rk{font-weight:800;font-size:17px;font-variant-numeric:tabular-nums}
.ge-mpaint{flex:1 1 auto;display:flex;align-items:center;gap:48px;padding:0 64px}
.ge-mcol{display:flex;flex-direction:column;gap:12px;min-width:0}
.ge-mcol .ge-cnt{text-align:left}
.ge-calc{width:380px;flex:none;border-radius:18px;background:#0b0f1a;padding:18px;box-sizing:border-box;box-shadow:0 20px 50px rgba(0,0,0,.35)}
.ge-calc.ph{width:auto;border-radius:16px;padding:14px;box-shadow:0 18px 40px rgba(0,0,0,.35)}
.ge-scr{border-radius:10px;background:#131c12;padding:16px 18px;display:flex;flex-direction:column;justify-content:flex-end;gap:6px;height:214px;overflow:hidden;box-sizing:border-box}
.ge-calc.ph .ge-scr{border-radius:9px;padding:14px 16px;gap:5px;height:196px}
.ge-ln{height:26px;line-height:26px;flex:none;font-size:20px;font-weight:800;color:#bef264;text-align:right;white-space:nowrap;overflow:hidden;
  font-variant-numeric:tabular-nums;letter-spacing:.04em}
.ge-ln.cur{height:36px;line-height:36px;font-size:30px}
.ge-calc.ph .ge-ln{height:24px;line-height:24px;font-size:18px;letter-spacing:0}
.ge-calc.ph .ge-ln.cur{height:34px;line-height:34px;font-size:28px}
.ge-err{height:48px;line-height:48px;flex:none;font-size:44px;font-weight:800;color:#fb7185;text-align:right;letter-spacing:.1em}
.ge-calc.ph .ge-err{height:42px;line-height:42px;font-size:38px}
.ge-count{flex:1 1 auto;display:flex;flex-wrap:wrap;align-items:center;justify-content:center;gap:40px 60px;padding:0 24px}
.ge-count.ph{flex-direction:column;gap:18px;padding:0}
.ge-lead{display:flex;flex-direction:column;gap:10px;align-items:flex-start;flex:none}
.ge-tot{font-weight:800;line-height:1;font-variant-numeric:tabular-nums;text-align:right;flex:none}
.ge-books{display:flex;flex-direction:column-reverse;align-items:center;flex:none}
.ge-book{border-radius:5px;display:flex;align-items:center;font-weight:800;border-left:7px solid rgba(0,0,0,.18);box-sizing:border-box;
  transition:all .3s ease;white-space:nowrap;overflow:hidden}
.ge.ph .ge-book{border-radius:4px}
.ge-bnm{overflow:hidden;text-overflow:ellipsis}
.ge-bmn{font-size:12px;opacity:.75;font-variant-numeric:tabular-nums;flex:none;margin-left:12px}
.ge-shelfrow{display:flex;align-items:center;gap:10px}
.ge-trows{display:flex;flex-direction:column-reverse;gap:7px;width:330px;flex:none}
.ge-trow{display:flex;align-items:center;justify-content:space-between;padding:0 14px;border-radius:8px;font-size:15px;font-weight:800;
  transition:all .25s ease;white-space:nowrap;box-sizing:border-box}
.ge-tmn{font-size:12px;opacity:.8;font-variant-numeric:tabular-nums}
.ge-lcd{box-sizing:border-box;border-radius:14px;background:#131c12;display:flex;align-items:center;justify-content:flex-end;
  box-shadow:inset 0 0 0 3px rgba(0,0,0,.5);flex:none}
.ge-lcd>div,.ge-mini-lcd>div{font-weight:800;line-height:1;color:#bef264;font-variant-numeric:tabular-nums;text-shadow:0 0 22px rgba(190,242,100,.5)}
.ge-mini-lcd{border-radius:12px;background:#131c12;flex:none;box-shadow:inset 0 0 0 3px rgba(0,0,0,.5)}
.ge.ph .ge-mini-lcd{border-radius:11px}
.ge-side{position:relative;flex:none;display:flex;align-items:stretch;gap:8px;font-size:12px;font-weight:800;font-variant-numeric:tabular-nums}
.ge-side.ph{gap:4px;font-size:9.5px}
.ge-side-col{position:relative;flex:none}
.ge-side-col span{position:absolute;transform:translateY(50%);white-space:nowrap;line-height:1}
.ge-side-col.l span{right:0}
.ge-side-col.r span{left:0;opacity:.85}
.ge-side-trk{position:relative;flex:none;width:14px;border-radius:7px;background:rgba(255,255,255,.12)}
.ge-side.ph .ge-side-trk{width:8px;border-radius:4px}
.ge-side-fill{position:absolute;left:0;right:0;bottom:0;border-radius:inherit;background:currentColor}
.ge-side-tick{position:absolute;left:-5px;right:-5px;height:2px;margin-bottom:-1px;background:currentColor;opacity:.85}
.ge-board{flex:1 1 auto;display:grid;grid-template-columns:minmax(300px,410px) minmax(0,1fr);gap:34px;padding:20px 32px 0;cursor:pointer}
.ge-board.ph{display:flex;flex-direction:column;gap:11px;padding:16px 16px 0}
.ge-bl{display:flex;flex-direction:column;gap:13px;min-width:0}
.ge-br{display:flex;flex-direction:column;gap:8px;min-width:0}
.ge-mshelf{display:flex;flex-direction:column-reverse;gap:3px;align-items:center;width:120px;flex:none}
.ge-mshelf>div{height:13px;border-radius:3px;border-left:4px solid rgba(0,0,0,.18);box-sizing:border-box}
.ge-th{font-size:11px;font-weight:800;letter-spacing:.16em;text-transform:uppercase;color:#7dd3fc}
.ge-tname{font-weight:800;line-height:1.1}
.ge-tsub{font-size:15px;font-weight:700;color:#9aa8c4;margin-top:4px;font-variant-numeric:tabular-nums}
.ge-tline{font-size:14px;font-weight:700;color:#c9d3e6}
.ge-tiles{display:grid;gap:5px}
.ge-tiles.ph{gap:4px}
.ge-tile{border-radius:8px;padding:7px 3px;background:rgba(255,255,255,.05);border-top:3px solid;text-align:center;min-width:0}
.ge-tiles.ph .ge-tile{border-radius:7px;padding:6px 2px}
.ge-tn{font-size:11px;font-weight:800;letter-spacing:.02em;color:#c9d3e6;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.ge-tiles.ph .ge-tn{font-size:8px;letter-spacing:.04em;text-transform:uppercase;color:#9aa8c4}
.ge-ts{font-size:18px;font-weight:800;font-variant-numeric:tabular-nums}
.ge-tiles.ph .ge-ts{font-size:16px}
.ge-tr{font-size:9px;font-weight:700;color:#9aa8c4;font-variant-numeric:tabular-nums}
.ge-chal{border-radius:14px;background:#7dd3fc;color:#08222e;padding:14px 16px;display:flex;flex-direction:column;gap:8px;align-items:center;text-align:center;cursor:default}
.ge.ph .ge-chal{padding:12px 14px;gap:7px}
.ge-chal-h{font-size:18px;font-weight:800}
.ge.ph .ge-chal-h{font-size:17px}
.ge-chal-s{font-size:13px;font-weight:700}
.ge.ph .ge-chal-s{font-size:12px}
.ge-chal-go{display:block;width:100%;box-sizing:border-box;padding:11px 0;border-radius:10px;background:#08222e;color:#fff;border:0;font:inherit;font-size:15px;font-weight:800;cursor:pointer}
.ge.ph .ge-chal-go{padding:12px 0}
.ge-chal-go:hover{filter:brightness(1.25)}
.ge-chal-u{font-size:11px;font-weight:700;word-break:break-all}
.ge a.ge-sim{display:block;text-align:center;padding:11px 0;border-radius:10px;border:1px solid rgba(255,255,255,.18);color:#e9edf4;font-size:15px;font-weight:800;text-decoration:none}
.ge.ph a.ge-sim{padding:12px 0}
.ge a.ge-sim:hover{border-color:rgba(255,255,255,.4);color:#fff}
.ge-bhd{display:flex;align-items:baseline;justify-content:space-between}
.ge-bt{font-size:12px;font-weight:800;letter-spacing:.16em;text-transform:uppercase;color:#9aa8c4;font-variant-numeric:tabular-nums}
.ge.ph .ge-bt{font-size:11px;letter-spacing:.14em}
.ge a.ge-blink{font-size:12px;font-weight:800;text-decoration:none}
.ge.ph a.ge-blink{font-size:11px}
.ge-rows{display:flex;flex-direction:column;gap:8px}
.ge.ph .ge-rows{gap:6px}
.ge-row{display:grid;grid-template-columns:40px minmax(0,1fr) 150px 48px;align-items:center;gap:12px;padding:11px 14px;border-radius:12px;
  background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.08)}
.ge-row.ph{gap:10px;padding:7px 12px;border-radius:11px}
.ge-row.me{background:rgba(125,211,252,.12);border-color:#7dd3fc}
.ge-rr{font-size:18px;font-weight:800;font-variant-numeric:tabular-nums}
.ge-row.ph .ge-rr{font-size:15px}
.ge-rn{font-size:16px;font-weight:800;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.ge-row.ph .ge-rn{font-size:14px}
.ge-rt{font-size:12px;font-weight:700;color:#9aa8c4;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.ge-row.ph .ge-rt{font-size:11px}
.ge-bars{display:flex;align-items:flex-end}
.ge-bars>div{flex:1 1 0}
.ge-rtot{font-size:22px;font-weight:800;text-align:right;font-variant-numeric:tabular-nums}
.ge-row.ph .ge-rtot{font-size:19px}
.ge-foot{font-size:12px;font-weight:700;color:#9aa8c4;margin-top:4px}
.ge-lad{display:flex;gap:4px;padding:14px 28px 18px;flex:none}
.ge-lad.ph{gap:3px;padding:12px 14px 16px}
.ge-lseg{display:flex;flex-direction:column;gap:5px;min-width:0}
.ge-lad.ph .ge-lseg{gap:4px}
.ge-llb{font-size:10px;font-weight:800;letter-spacing:.08em;text-transform:uppercase;white-space:nowrap;overflow:hidden;font-variant-numeric:tabular-nums}
.ge-lad.ph .ge-llb{font-size:9px;letter-spacing:0;text-transform:none}
.ge-ltr{height:12px;border-radius:3px;overflow:hidden}
.ge-lad.ph .ge-ltr{height:10px}
.ge-mst{display:flex;gap:6px;padding:14px 28px 18px;flex:none}
.ge-mst.ph{gap:5px;padding:12px 14px 16px}
.ge-mtile{flex:1 1 0;min-width:0;height:40px;border-radius:8px;display:flex;align-items:center;justify-content:space-between;padding:0 14px;box-sizing:border-box;
  font-size:12px;font-weight:800;letter-spacing:.08em;text-transform:uppercase;transition:all .3s ease}
.ge-mst.ph .ge-mtile{height:44px;border-radius:7px;flex-direction:column;justify-content:center;padding:0;font-size:9px;letter-spacing:.06em}
.ge-mv{font-size:18px;font-variant-numeric:tabular-nums;text-align:right}
.ge-mst.ph .ge-mv{font-size:15px;min-height:18px;text-align:center}
@keyframes gpop{from{opacity:0;transform:translateY(14px) scale(.96)}to{opacity:1;transform:none}}
@keyframes gcrack{0%{transform:scale(1)}40%{transform:scale(1.5) rotate(-8deg)}100%{transform:scale(1.2) rotate(0)}}
@keyframes grow{from{opacity:0;transform:translateX(24px)}to{opacity:1;transform:none}}
@keyframes growph{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:none}}
@keyframes merr{0%,100%{opacity:1}50%{opacity:.2}}
@keyframes mtick{from{opacity:0;transform:translateY(10px)}to{transform:none}}
.ge-pop{animation:gpop .4s cubic-bezier(.2,.8,.2,1) both}
.g-crack{animation:gcrack .4s ease both}
.g-row,.m-row{animation:grow .35s ease both}
.ge-row.ph{animation-name:growph}
.m-err{animation:merr .3s steps(2) 3 both}
.m-tick{animation:mtick .12s ease both}
@media (prefers-reduced-motion: reduce){.ge,.ge *{animation:none !important;transition:none !important}}
`;
