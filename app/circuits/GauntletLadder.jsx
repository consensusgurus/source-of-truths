'use client';

// THE LADDER, the one graphic the whole run is drawn on.
//
// It replaced a rail of seven pips that each read "Atlas 17/25" in 10.5px
// mono. The pips said what you scored and nothing about what you did not
// reach, which on a one-life quiz is the entire point: a run that ends on
// question 18 of 25 leaves seven questions dark, and that is both the thing
// that stings and the thing that brings a player back tomorrow.
//
// It is DISPLAY ONLY. It reads the run's state and owns none of it, so the
// rail, the scorecard and the poster can all draw it without any of them
// agreeing about anything except the props below.
//
// LAYERS
//   1. YOURS. One rung per question, grouped into the run's banks in run
//      order, lit in that bank's ramp colour. A rung widens as the tier
//      climbs, so a block's silhouette is its own difficulty ramp. Where the
//      player missed, the rung is danger red and the rest of that block is
//      hatched out, which is the dead zone that stays on screen for the rest
//      of the run.
//   2. THEIRS, optional. Pass `field` and every rung the player has NOT
//      reached is brightened by the share of today's field still alive at it,
//      so the untravelled ladder becomes the survival curve and a hairline
//      marks today's average score. WITHOUT `field` nothing else changes:
//      unlit rungs render at the flat base dim and no mark is drawn. That
//      matters on the day a bank launches, when there is no field to draw.
//
// WHY THE RUNGS FLEX. A fixed rung width is the one thing that breaks this as
// the roster grows: at seven banks a 2.5px rung plus its gap is 180 x 4px of
// fixed track, which overflows the page under about 900px. In `row` each
// block takes flex weight equal to its question count and the rungs split it,
// so the ladder is exactly its container's width at any size and any roster
// length. In `col` the pitch is derived from a height budget instead.
//
// USAGE
//
//   <GauntletLadder
//     sections={sections}                  // the run's own sections array
//     results={r.results}                  // the run's own results array
//     activeIndex={r.phase === 'playing' ? r.si : -1}
//     activeAnswered={r.i}
//     labels                               // name + score under each block
//     field={curves}                       // optional, see above
//   />

import React, { useMemo } from 'react';
import { LADDER_RAMP, rampFor } from '@/lib/circuits';

// The run-local ramp, cool to warm in run order.
//
// It is LOCAL TO THIS GRAPHIC on purpose and is deliberately not each game's
// registry colour. Those hues were each chosen for one game against a navy
// slate row and never as a set: Atlas (#4ade9c) and Biz (#4fbf8b) are the same
// colour at rung width, and now that the roster is seven no single registry
// edit separates them all. Every game keeps its own colour everywhere else it
// appears; here the tie back to identity is the label under the block.
//
// The ramp earns its keep too. Run order is shortest first, so a monotonic hue
// walk means the ladder reads as heat climbing across the run, which makes the
// ordering rule visible for free.
// Re-exported from lib/circuits, which is where the ramp lives now: the share
// card renders on the server and wants the same colours, and this is a client
// module. Callers of this file did not have to change.
export { LADDER_RAMP, rampFor };

// THE AVERAGE SCORE on a bank today, from that bank's survival curve.
//
// On a one-life quiz the score IS the number answered before the miss, so the
// expected score is simply the sum of the curve: `curve[i]` is the chance of
// still being alive at question i, which is exactly P(score >= i).
//
// Exported because the roster, the chamber and this ladder's own hairline all
// want the figure, and three components deriving it separately is three
// chances for the number on screen to disagree with the mark beside it.
export function averageScore(curve, n) {
  if (!curve) return null;
  let e = 0;
  for (let i = 1; i <= n; i += 1) e += curve[i] != null ? curve[i] : 0;
  return e;
}

const BASE_DIM = 0.05;    // alpha of a rung nobody reached
const FIELD_LIFT = 0.17;  // how much of the alpha the field layer controls
const MIN_PITCH = 2;      // px, floor for a rung plus its gap in `col`
const BLOCK_GAP = 8;      // px between banks

// HOW LONG A BLOCK IS DRAWN (owner, 2026-10-07). Not its full question count:
// on a one-life quiz almost nobody gets near 25, so a bar that long is always
// nearly empty. It is anchored to the best score posted today instead, set
// close to the end and not on it, and it stretches if the player passes that.
export function shownLength(n, top, done) {
  const ref = Math.max(Number(top) || 0, Number(done) || 0);
  if (!n) return 0;
  return Math.min(n, Math.max(6, ref + 1, Math.round(ref / 0.9)));
}

// RunClient files 'won' | 'lost' | 'banked'. A banked game is one the player
// finished earlier today on its own page, so the run steps over it; it counts
// as cleared when it was itself run clean, which is the same call the run's
// own `perfect` tally makes.
function stateOf(res) {
  if (!res) return 'open';
  if (res.status === 'won') return 'won';
  if (res.status === 'banked') return res.total > 0 && res.score === res.total ? 'won' : 'bank';
  return 'lost';
}

export default function GauntletLadder({
  sections = [],
  results = [],
  activeIndex = -1,
  activeAnswered = 0,
  orientation = 'row',
  height = 480,
  labels = false,
  // { [sectionKey]: number[] } where entry n is the share of today's field
  // (0 to 1) still alive at question n of that bank. A short array is fine, a
  // missing key is fine, and an absent prop turns layer 2 off entirely.
  field = null,
  // { [sectionKey]: number } the best score posted on that bank today.
  tops = null,
  className = '',
}) {
  const row = orientation !== 'col';

  // Derived pitch, never a fixed rung height. `height` is the budget the
  // caller can spare and the rungs divide what is left after the gaps. A
  // roster big enough to reach MIN_PITCH should scroll its gutter rather than
  // shave the rung any thinner.
  const pitch = useMemo(() => {
    if (row) return null;
    const totalQ = sections.reduce((a, s, bi) => {
      const n = s.questions ? s.questions.length : 0;
      const res = (results || []).find((x) => x && x.key === s.key);
      const dn = res ? res.score : (bi === activeIndex ? activeAnswered : 0);
      return a + shownLength(n, tops ? tops[s.key] : 0, dn);
    }, 0);
    if (!totalQ) return MIN_PITCH;
    const gaps = Math.max(0, sections.length - 1) * BLOCK_GAP + (labels ? sections.length * 15 : 0);
    return Math.max(MIN_PITCH, (height - gaps) / totalQ);
  }, [row, sections, height, labels, tops, results, activeIndex, activeAnswered]);

  const byKey = useMemo(() => {
    const m = {};
    for (const r of results || []) if (r && r.key) m[r.key] = r;
    return m;
  }, [results]);

  return (
    <div className={`gl ${row ? 'gl-row' : 'gl-col'} ${className}`.trim()}
         style={row ? undefined : { height }}>
      <style dangerouslySetInnerHTML={{ __html: CSS }} />
      {sections.map((s, bi) => {
        const n = s.questions ? s.questions.length : 0;
        const res = byKey[s.key];
        const st = stateOf(res);
        const live = bi === activeIndex && !res;
        const done = res ? res.score : (live ? activeAnswered : 0);
        const dead = st === 'lost';
        const curve = field && field[s.key] ? field[s.key] : null;

        // Today's average score, marked with a hairline. Only drawn when the
        // field layer is on, since without it the mark would be asserting
        // something this component was never told.
        let mark = -1;
        if (curve) {
          const avg = averageScore(curve, n);
          if (avg != null) mark = Math.min(n - 1, Math.round(avg));
        }

        const topScore = tops && Number.isFinite(tops[s.key]) ? tops[s.key] : 0;
        const shown = shownLength(n, topScore, done);
        const rungs = [];
        for (let i = 0; i < shown; i += 1) {
          const alive = curve && curve[i] != null ? Math.max(0, Math.min(1, curve[i])) : 0;
          let cls = '';
          if (i < done) cls = 'on';
          else if (dead && i === done) cls = 'fatal';
          else if (dead) cls = 'spent';
          if (live && i === done) cls = 'now';
          if (!cls && i === mark) cls = 'avg';
          if (!cls && topScore > 0 && i === topScore - 1) cls = 'top';
          rungs.push(
            <i
              key={i}
              className={cls || undefined}
              style={{
                '--t': `${40 + Math.round(60 * (n > 1 ? i / (n - 1) : 0))}%`,
                '--f': alive,
                // The rung IS the pitch, with no gap subtracted: `.gl-col`
                // sets gap 0. Measured on the live page, seven banks and 180
                // questions give a pitch near 2.7px, and taking a 1px gap out
                // of that left a 1px rung beside a 1px hole, which reads as a
                // faint dotted line rather than a ladder. Contiguous rungs
                // still show the tier ramp, because in this orientation the
                // ramp is the rung's WIDTH.
                ...(row ? null : { height: `${Math.max(1, pitch)}px` }),
              }}
            />
          );
        }

        return (
          <div
            key={s.key}
            className={[
              'gl-b',
              dead ? 'gone' : '',
              st === 'won' ? 'clear' : '',
              st === 'bank' ? 'bank' : '',
              live ? 'live' : '',
            ].filter(Boolean).join(' ')}
            style={{
              '--c': s.ladderColor || rampFor(bi),
              '--q': shown,
              '--cut': `${shown ? (((done + 1) / shown) * 100).toFixed(2) : 0}%`,
            }}
          >
            <span className="gl-rungs" aria-hidden="true">{rungs}</span>
            {labels ? (
              <span className="gl-k">
                <b>{s.name}</b>
                <em>{res || live ? `${done}/${n}` : n}</em>
              </span>
            ) : null}
          </div>
        );
      })}
    </div>
  );
}

// The rungs themselves are decorative: every figure they encode is stated in
// text by the labels or by the card beside them, so they carry aria-hidden and
// the labels do the announcing.
const CSS = `
.gl{display:flex;max-width:100%;min-width:0}
.gl-b{display:flex;flex-direction:column;position:relative;min-width:0}
.gl-rungs{display:flex;min-width:0}
.gl-b i{display:block;border-radius:1px;
  background:rgba(255,255,255,calc(${BASE_DIM} + ${FIELD_LIFT} * var(--f,0)))}
.gl-b i.on{background:var(--c);box-shadow:0 0 5px color-mix(in srgb,var(--c) 55%,transparent)}
.gl-b i.now{background:#fff;box-shadow:0 0 0 1.5px rgba(255,255,255,.3),0 0 12px rgba(255,255,255,.7)}
.gl-b i.fatal{background:#c0392b;box-shadow:0 0 10px rgba(192,57,43,.85)}
.gl-b i.spent{background:rgba(255,255,255,.045)}
.gl-b i.avg{box-shadow:0 0 0 .5px rgba(255,255,255,.45)}
.gl-b i.top{background:rgba(255,255,255,.3);box-shadow:0 0 0 .5px rgba(255,255,255,.7)}
.gl-b.bank{opacity:.6}
.gl-b.gone::after{content:'';position:absolute;pointer-events:none;
  background:repeating-linear-gradient(-45deg,transparent 0 5px,rgba(192,57,43,.13) 5px 6px)}

/* The label under a block, which is what makes the ladder readable without a
   legend: the name, and how far into it you got. */
.gl-k{display:flex;align-items:baseline;gap:5px;margin-top:6px;min-width:0}
.gl-k b{font-size:11px;font-weight:800;letter-spacing:.01em;color:#8ea6d6;
  white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.gl-k em{font-style:normal;font-family:'Manrope',ui-monospace,monospace;font-size:10px;
  color:#66748f;font-variant-numeric:tabular-nums;flex:none}
.gl-b.live .gl-k b{color:#fff}
.gl-b.clear .gl-k b{color:#10b981}
.gl-b.gone .gl-k b{color:#e08074}

/* ROW, the orientation the run and both cards use. Rungs flex, so the ladder
   is its container's width whatever the roster length. */
.gl-row{flex-direction:row;gap:${BLOCK_GAP}px;width:100%}
.gl-row .gl-b{flex:var(--q,25) 1 0}
.gl-row .gl-rungs{flex-direction:row;align-items:flex-end;height:46px}
.gl-row .gl-b i{flex:1 1 0;min-width:0;height:var(--t);margin-right:1px}
.gl-row .gl-b i:last-child{margin-right:0}
.gl-row .gl-b i.now,.gl-row .gl-b i.fatal{flex:1.8 1 0}
.gl-row .gl-b.gone::after{left:var(--cut);right:0;top:0;height:46px}

/* COL, the tall gutter. Rung height comes from the derived pitch inline. */
.gl-col{flex-direction:column;gap:${BLOCK_GAP}px}
.gl-col .gl-rungs{flex-direction:column;gap:0}
.gl-col .gl-b i{width:var(--t)}
.gl-col .gl-k{order:-1;margin:0 0 4px}
.gl-col .gl-b.gone::after{left:0;right:0;top:var(--cut);bottom:0}

/* PHONE. Measured on the live page at 390px: seven banks and 180 questions
   put a rung at about 1.15px, and a 1px gap beside a 1.15px rung is half the
   block, so the comb stops reading as a comb and starts reading as noise. The
   gap goes to zero here and the rungs abut, which turns each block into one
   continuous shape whose silhouette is still the tier ramp and whose colour is
   still where you got to. The current rung and the fatal one keep their extra
   flex, so the two things you must be able to find stay findable. */
/* PHONE: THE TALL GUTTER LIES DOWN. A column ladder is 640px of rungs, which
   beside a question on a 390px screen is most of the viewport spent on
   furniture. Under 820px it becomes the same condensed strip the row
   orientation draws, 26px of rungs, with each bank NAMED under it.

   THE NAMES STAY (owner, 2026-08-30). They were dropped here on the reasoning
   that seven of them would not fit across 350px and that the card beside the
   strip names the bank you are on. Neither held: measured on the Gauntlet's
   roster the blocks take flex weight from their question counts, so on a 390px
   phone the narrowest (Deep, 15 questions) is 26px and the widest (Streak, 40)
   is 70px, against three-to-six-character names at 8.5px/800, which run 18 to
   36px. And the card names only the CURRENT bank, while the whole point of the
   strip is the six the reader is not on. Only games servable as one continuous
   board reach this ladder, and lib/circuits' RUN_GAMES is the entire list, so
   the names are known and short; anything that does overrun ellipsises.

   Everything the caller set inline has to be overridden here, which is what
   the !important marks are for: the height on the container and on every rung
   is a literal px value from the derived pitch.
   NO BACKTICKS IN THIS BLOCK. It is a template literal, and one closes it. */
@media (max-width:820px){
  .gl-col{flex-direction:row;gap:6px;align-items:flex-end;width:100%;height:auto!important}
  .gl-col .gl-b{flex:var(--q,25) 1 0;height:auto}
  .gl-col .gl-rungs{flex-direction:row;align-items:flex-end;height:26px;width:100%}
  .gl-col .gl-b i{flex:1 1 0;min-width:0;width:auto!important;height:var(--t)!important}
  /* NAMED, not hidden (owner, 2026-08-30). See the note above the block: the
     label goes back, under the bars. order is reset because the tall gutter
     puts it ABOVE the rungs and the strip wants it below, which is the source
     order. The hatch stops at the rungs so a spent bank does not cross out its
     own name. */
  .gl-col .gl-k{display:flex;order:0;margin:5px 0 0;justify-content:center}
  .gl-col .gl-k b{font-size:8.5px;letter-spacing:.01em}
  .gl-col .gl-k em{display:none}
  .gl-col .gl-b.gone::after{left:var(--cut);right:0;top:0;height:26px;bottom:auto}
}
@media (max-width:640px){
  .gl-row{gap:5px}
  .gl-row .gl-rungs{height:34px}
  .gl-row .gl-b i{margin-right:0}
  .gl-row .gl-b.gone::after{height:34px}
  /* Centred under its own block rather than ranged left, which on a 26px
     block read as the name of the gap beside it. */
  .gl-k{justify-content:center}
  .gl-k b{font-size:8.5px}
  .gl-k em{display:none}
}
/* THE NARROWEST PHONE. Measured in an iframe at 330px: everything reads at
   8.5px except the shortest bank, whose block is only as wide as its share of
   the questions (Deep is 15 of 180, so 22px), and "Deep" ellipsised to "De…".
   Four pixels off each gap and half a pixel off the type buys it back, and at
   330px there is no other claim on the width. Verified: all seven labels
   render uncut. */
@media (max-width:400px){
  .gl-col,.gl-row{gap:4px}
  .gl-k b{font-size:8px;letter-spacing:0}
}
`;
