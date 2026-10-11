'use client';

// THE RUN LANES (owner, 2026-10-10), the run's shape on the Trivia Gauntlet
// and the Math Gauntlet alike: one row per quiz (or game), a name, a bar and a
// score. They replaced the towers (Trivia) and the side-by-side bars (Math) the
// same day, so both runs now draw one object.
//
// EVERY BAR IS THE SAME WIDTH whatever the question count, so a bar is a share
// of its own quiz: Deep's 15 and Streak's 40 sit on one scale. Fill = got/total,
// left to right.
//   won    full fill
//   lost   fill to the miss, then a red end cap where the miss was
//   live   fill to the question on screen, then an outlined pip there
//   up     next to play (the handover): empty, rimmed in its own colour
//   next   empty, quiet name
// Nothing about a question past the current one is ever drawn.
//
// THE ORDER (owner, 2026-10-10): the quiz in play rises to the TOP, finished
// ones follow most recently finished first (so each moves down one as the next
// comes in), upcoming ones last in run order. order="run" (the scorecard)
// keeps run order. A reorder slides (FLIP) from where the rows last stood,
// which survives the remount between the play screen and the handover because
// the last positions are kept per list id at module level.
//
// COLOURS are the run page's own palette on its own dark ground (#0b0f1a), not
// the --stg tokens: the ramp steps, #8b95a8 for quiet text (5.7:1), #c9d0de for
// an upcoming name (11:1), #616d88 for a bar outline (3.3:1, a mark), #f87171
// for the miss (6.2:1), and #8b95a8 for the average tick (a mark).

import React, { useEffect, useLayoutEffect, useRef } from 'react';
import { rampFor } from '@/lib/circuits';

const MISS = '#f87171';
const useIsoLayout = typeof window === 'undefined' ? useEffect : useLayoutEffect;

// RunClient files 'won' | 'lost' | 'banked'. A banked game finished on its own
// page; short of a clean run, it ended on a miss there too.
function frozen(res) {
  if (!res) return null;
  const got = Number.isFinite(res.score) ? res.score : 0;
  const total = res.total || 0;
  return { got, lost: res.status === 'lost' || (res.status === 'banked' && got < total) };
}

const pc = (v) => `${Math.round(Math.max(0, Math.min(1, v)) * 10000) / 100}%`;

// The state of every section, in run order, plus its place in the finish order.
function laneStates(sections, results, liveIndex, liveAnswered, upIndex) {
  const byKey = {};
  const doneAt = {};
  (results || []).forEach((x, k) => { if (x && x.key) { byKey[x.key] = x; doneAt[x.key] = k; } });
  return sections.map((s, bi) => {
    const n = s.questions ? s.questions.length : 0;
    const res = frozen(byKey[s.key]);
    const live = !res && bi === liveIndex;
    const st = res ? (res.lost ? 'lost' : 'won') : (live ? 'live' : (bi === upIndex ? 'up' : 'next'));
    const got = res ? res.got : (live ? liveAnswered : 0);
    return {
      key: s.key, name: s.name, n, got, st, bi,
      fin: res ? doneAt[s.key] : -1,
      c: rampFor(s.slot != null ? s.slot : bi),
    };
  });
}

// Live on top, then finished (latest first), then upcoming in run order.
export function laneOrder(lanes, order) {
  if (order === 'run') return lanes;
  const live = lanes.filter((l) => l.st === 'live');
  const fin = lanes.filter((l) => l.fin >= 0).sort((a, b) => b.fin - a.fin);
  const rest = lanes.filter((l) => l.st !== 'live' && l.fin < 0);
  return [...live, ...fin, ...rest];
}

// Last measured offsets of each row, per list id, so a remount can slide.
const LAST = {};

// ONE BAR. `curve` (the gate) shades it by how many of today's players got
// that far; `avg` drops a tick at today's average share of the quiz.
export function LaneBar({ lane = null, n = 0, curve = null, avg = null, big = false }) {
  const total = lane ? lane.n : n;
  const st = lane ? lane.st : 'next';
  const got = lane ? lane.got : 0;
  const unit = total ? 1 / total : 0;
  const filled = st === 'won' ? 1 : total ? Math.min(1, got / total) : 0;
  let shade;
  if (curve && total) {
    const stops = [];
    for (let i = 0; i < total; i += 1) {
      const alive = curve[i] != null ? Math.max(0, Math.min(1, curve[i])) : 0;
      const a = (0.06 + 0.54 * alive).toFixed(3);
      stops.push(`rgba(97,109,136,${a}) ${pc(i * unit)} ${pc((i + 1) * unit)}`);
    }
    shade = { background: `linear-gradient(90deg,${stops.join(',')})` };
  }
  const tick = Number.isFinite(avg) && total ? Math.min(1, Math.max(0, avg / total)) : null;
  return (
    <span className={`rl-trk${big ? ' big' : ''}`} aria-hidden="true">
      <span className="rl-bar" style={st === 'up' ? { ...shade, borderColor: lane.c } : shade}>
        {filled > 0 ? <span className="rl-f" style={{ width: pc(filled), background: lane.c }} /> : null}
        {st === 'lost' && got < total
          ? <span className="rl-x" style={{ left: pc(filled), width: `max(5px, ${pc(unit)})` }} /> : null}
        {st === 'live' && got < total ? (
          <span
            className="rl-pip"
            style={{ left: pc(filled), width: `max(8px, ${pc(unit)})`, borderColor: lane.c, background: `color-mix(in srgb,${lane.c} 24%,#0b0f1a)` }}
          />
        ) : null}
      </span>
      {tick != null ? <span className="rl-avg" style={{ left: pc(tick) }} /> : null}
    </span>
  );
}

// THE LIST.
export default function RunLanes({
  id = 'run',
  sections = [],
  results = [],
  liveIndex = -1,
  liveAnswered = 0,
  upIndex = -1,
  avg = null,
  order = 'live',
  className = '',
}) {
  const lanes = laneOrder(laneStates(sections, results, liveIndex, liveAnswered, upIndex), order);
  const box = useRef(null);
  const sig = lanes.map((l) => l.key).join('|');

  // FLIP: measure where each row is now (relative to the list) and slide it
  // from where it last stood. One read and one write per row, and nothing at
  // all when the order did not change.
  useIsoLayout(() => {
    const el = box.current;
    if (!el || !el.getBoundingClientRect) return;
    const top0 = el.getBoundingClientRect().top;
    const now = {};
    const rows = Array.from(el.children);
    for (const row of rows) now[row.dataset.k] = row.getBoundingClientRect().top - top0;
    const prev = LAST[id];
    LAST[id] = { sig, at: now };
    if (!prev || prev.sig === sig) return;
    let still = false;
    try { still = window.matchMedia('(prefers-reduced-motion: reduce)').matches; } catch (e) { still = true; }
    if (still) return;
    const moved = [];
    for (const row of rows) {
      const from = prev.at[row.dataset.k];
      const dy = from != null ? from - now[row.dataset.k] : 0;
      if (!dy) continue;
      row.style.transition = 'none';
      row.style.transform = `translateY(${dy}px)`;
      moved.push(row);
    }
    if (!moved.length) return;
    void el.offsetHeight; // one forced layout, then every row glides home
    for (const row of moved) {
      row.style.transition = 'transform .55s cubic-bezier(.2,.8,.2,1)';
      row.style.transform = '';
    }
  }, [sig, id]);

  return (
    <div className={`rl ${className}`.trim()} ref={box}>
      {lanes.map((ln) => {
        const on = ln.st === 'won' || ln.st === 'lost' || ln.st === 'live';
        const a = avg && Number.isFinite(avg[ln.key]) ? avg[ln.key] : null;
        return (
          <div key={ln.key} data-k={ln.key} className={`rl-row ${ln.st}`}>
            <b className="rl-nm" style={{ color: on ? ln.c : '#c9d0de' }}>{ln.name}</b>
            <LaneBar lane={ln} avg={a} big={ln.st === 'live'} />
            <em className={`rl-sc${on ? ' on' : ''}`}>{on ? `${ln.got}/${ln.n}` : ln.n}</em>
          </div>
        );
      })}
    </div>
  );
}

// THE CLOCK LINE, from the sections themselves (2026-10-10). The Math Gauntlet
// deals Blitz at fifteen seconds and the rest at twenty, so one fixed "Twenty
// seconds a question" was wrong on its first quiz.
const WORDS = { 5: 'five', 10: 'ten', 12: 'twelve', 15: 'fifteen', 20: 'twenty', 25: 'twenty-five', 30: 'thirty', 45: 'forty-five', 60: 'sixty' };
export function spellSecs(n, cap = false) {
  const w = WORDS[n] || String(n);
  return cap ? w.charAt(0).toUpperCase() + w.slice(1) : w;
}
export function secondsLine(sections = [], unit = 'question') {
  const secsOf = (s) => Number(s.seconds) || 20;
  const counts = {};
  for (const s of sections) counts[secsOf(s)] = (counts[secsOf(s)] || 0) + 1;
  const vals = Object.keys(counts).map(Number);
  if (vals.length <= 1) return `${spellSecs(vals[0] || 20, true)} seconds a ${unit}.`;
  // The most common clock is "the rest"; every other clock names its games.
  const rest = vals.sort((a, b) => counts[b] - counts[a] || b - a)[0];
  const parts = [];
  for (const v of vals.filter((x) => x !== rest).sort((a, b) => a - b)) {
    const names = sections.filter((s) => secsOf(s) === v).map((s) => s.name);
    const list = names.length > 1 ? `${names.slice(0, -1).join(', ')} and ${names[names.length - 1]}` : names[0];
    parts.push(`${spellSecs(v)} seconds on ${list}`);
  }
  const line = `${parts.join(', ')}, ${spellSecs(rest)} on the rest.`;
  return line.charAt(0).toUpperCase() + line.slice(1);
}

// NO BACKTICKS IN THIS BLOCK: it is a template literal. Injected once by
// RunClient's own stylesheet.
export const TOWER_CSS = `
.rl{display:flex;flex-direction:column;gap:7px;min-width:0}
.rl-row{display:grid;grid-template-columns:84px minmax(0,1fr) 48px;align-items:center;gap:12px;min-height:22px}
.rl-nm{font-size:13px;font-weight:700;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.rl-row.live .rl-nm{font-weight:800;font-size:14px}
.rl-sc{font-style:normal;font-size:11.5px;font-weight:700;color:#8b95a8;text-align:right;font-variant-numeric:tabular-nums}
.rl-sc.on{color:#e8ecf4}
.rl-row.live .rl-sc{font-size:12.5px;font-weight:800}
.rl-trk{position:relative;display:block;height:10px;min-width:0}
.rl-trk.big{height:16px}
.rl-bar{position:absolute;top:0;left:0;right:0;bottom:0;display:block;box-sizing:border-box;border-radius:5px;
  border:1.5px solid #616d88;overflow:hidden}
.rl-trk.big .rl-bar{border-radius:6px}
.rl-f{position:absolute;left:0;top:0;bottom:0;transition:width .4s cubic-bezier(.2,.8,.2,1)}
.rl-x{position:absolute;top:0;bottom:0;background:${MISS}}
.rl-pip{position:absolute;top:0;bottom:0;box-sizing:border-box;border:2px solid;border-radius:3px;
  transition:left .4s cubic-bezier(.2,.8,.2,1)}
.rl-avg{position:absolute;top:-4px;bottom:-4px;width:2px;margin-left:-1px;border-radius:1px;background:#8b95a8}
@media (prefers-reduced-motion:reduce){.rl-f,.rl-pip{transition:none}}
@media (max-width:640px){
  .rl{gap:6px}
  .rl-row{grid-template-columns:62px minmax(0,1fr) 40px;gap:9px;min-height:20px}
  .rl-nm{font-size:11.5px}
  .rl-row.live .rl-nm{font-size:12.5px}
  .rl-sc{font-size:10.5px}
  .rl-row.live .rl-sc{font-size:11.5px}
  .rl-trk{height:8px}
  .rl-trk.big{height:13px}
}
`;
