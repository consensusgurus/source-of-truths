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

export default function GauntletFinale({
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
