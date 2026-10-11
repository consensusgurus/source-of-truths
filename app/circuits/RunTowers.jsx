'use client';

// THE RUN TOWERS (owner approved 2026-10-10), the run's shape as one tower per
// quiz on the Trivia Gauntlet, and one bar per game on the Math Gauntlet.
//
// DISPLAY ONLY, like GauntletLadder: it reads the run's sections and results
// and owns none of it. No hooks at all, so nothing can ever sit after an early
// return.
//
// A quiz of N questions is a tower of rows (one per tier, bottom row first),
// `perTier` cells to a row: Deep 3, the 25-question banks 5, Streak 8. Cell i
// is question i + 1.
//   i < got                      cleared, filled in the bank's ramp colour
//   i === got, quiz live         the question on screen: tinted, ramp outline
//   i === got, quiz lost         the miss that ended it: red, ink outline
//   anything else                empty, a 1px outline that holds 3:1
// Nothing about a question past the current one is ever drawn, only the bank
// name, which the rules already publish.
//
// COLOURS are the run page's own palette on its own dark ground (#0b0f1a), not
// the --stg tokens: the ramp steps, #8b95a8 for quiet text (6.3:1), #c9d0de for
// an upcoming name (12.4:1), #616d88 for an empty cell outline (3.7:1, a mark),
// #f87171 for the miss (6.9:1), and #08222e for ink on any ramp fill (6.1:1 or
// better on every step).

import React from 'react';
import { rampFor } from '@/lib/circuits';

const MISS = '#f87171';

// RunClient files 'won' | 'lost' | 'banked'. A banked game finished on its own
// page; short of a clean run, it ended on a miss there too.
function frozen(res) {
  if (!res) return null;
  const got = Number.isFinite(res.score) ? res.score : 0;
  const total = res.total || 0;
  return { got, lost: res.status === 'lost' || (res.status === 'banked' && got < total) };
}

function colsOf(s, n) {
  const c = Number(s.perTier) || 0;
  if (c > 0) return c;
  return Math.max(1, Math.round(n / 5));
}

// The state of every section, in run order, shared by the towers and the bars.
function laneStates(sections, results, liveIndex, liveAnswered, upIndex) {
  const byKey = {};
  for (const x of results || []) if (x && x.key) byKey[x.key] = x;
  return sections.map((s, bi) => {
    const n = s.questions ? s.questions.length : 0;
    const res = frozen(byKey[s.key]);
    const live = !res && bi === liveIndex;
    const st = res ? (res.lost ? 'lost' : 'won') : (live ? 'live' : (bi === upIndex ? 'up' : 'next'));
    const got = res ? res.got : (live ? liveAnswered : 0);
    return {
      key: s.key, name: s.name, n, got, st,
      cols: colsOf(s, n),
      c: rampFor(s.slot != null ? s.slot : bi),
    };
  });
}

// ONE TOWER. `big` draws the numbered version (the live quiz, or the one that
// just ended on the handover); `hatch` strikes out the cells a lost quiz never
// reached, which only the big frozen tower does.
function Tower({ lane, big, hatch }) {
  const { n, cols, got, st } = lane;
  const rows = [];
  for (let start = 0; start < n; start += cols) {
    const cells = [];
    for (let i = start; i < Math.min(n, start + cols); i += 1) {
      let cls = 'rt-c';
      let num = false;
      if (i < got) { cls += ' f'; num = true; }
      else if (i === got && st === 'lost') { cls += ' x'; num = true; }
      else if (i === got && st === 'live') { cls += ' now'; num = true; }
      else if (hatch && st === 'lost') cls += ' h';
      cells.push(<span key={i} className={cls}>{big && num ? <i>{i + 1}</i> : null}</span>);
    }
    rows.push(<span key={start} className="rt-r">{cells}</span>);
  }
  return (
    <span className={`rt-t${big ? ' big' : ''}${cols >= 7 ? ' w' : ''}`} style={{ '--c': lane.c }} aria-hidden="true">
      {rows}
    </span>
  );
}

// THE RUN ROW: every quiz as a tower, in run order, the name in its ramp
// colour under each (an upcoming one in quiet ink) and its score.
export default function RunTowers({
  sections = [],
  results = [],
  liveIndex = -1,
  liveAnswered = 0,
  bigIndex = -1,
  className = '',
}) {
  const lanes = laneStates(sections, results, liveIndex, liveAnswered, -1);
  return (
    <div className={`rt-row ${className}`.trim()}>
      {lanes.map((ln, bi) => {
        const big = bi === bigIndex;
        const on = ln.st !== 'next';
        return (
          <div key={ln.key} className={`rt-b${big ? ' big' : ''}`}>
            <Tower lane={ln} big={big} hatch={big} />
            <span className="rt-k">
              <b style={{ color: on ? ln.c : '#c9d0de' }}>{ln.name}</b>
              <em className={on ? 'on' : ''}>{on ? `${ln.got}/${ln.n}` : ln.n}</em>
            </span>
          </div>
        );
      })}
    </div>
  );
}

// THE MATH LANES: one bar per game, lighter than the towers. Filled to what
// you got, a red cap where a miss ended it, the live (or next up) bar rimmed
// in its own colour.
export function RunBars({
  sections = [],
  results = [],
  liveIndex = -1,
  liveAnswered = 0,
  upIndex = -1,
  className = '',
}) {
  const lanes = laneStates(sections, results, liveIndex, liveAnswered, upIndex);
  return (
    <div className={`rb-row ${className}`.trim()}>
      {lanes.map((ln) => {
        const on = ln.st === 'won' || ln.st === 'lost' || ln.st === 'live';
        const fill = ln.n ? `${Math.min(100, (ln.got / ln.n) * 100)}%` : '0%';
        return (
          <div key={ln.key} className="rb-g">
            <b className="rb-nm" style={{ color: ln.st === 'next' ? '#c9d0de' : ln.c }}>{ln.name}</b>
            <em className={`rb-sc${on ? ' on' : ''}`}>{on ? `${ln.got}/${ln.n}` : ln.n}</em>
            <span
              className="rb-bar"
              style={{ borderColor: ln.st === 'live' || ln.st === 'up' ? ln.c : undefined }}
              aria-hidden="true"
            >
              {on ? <span className="rb-f" style={{ width: fill, background: ln.c }} /> : null}
              {ln.st === 'lost' ? <span className="rb-cap" style={{ left: `calc(${fill} + 2px)` }} /> : null}
            </span>
          </div>
        );
      })}
    </div>
  );
}

// THE GATE'S MINI TOWER: empty, shaded by how many of today's players reached
// each question (curve[i] is the share still alive at question i + 1), with
// the average score's cell outlined bright. With no curve it is a plain empty
// tower.
export function MiniTower({ section, curve = null, avg = null }) {
  const n = section.questions ? section.questions.length : 0;
  const cols = colsOf(section, n);
  const mark = Number.isFinite(avg) ? Math.min(n - 1, Math.round(avg)) : -1;
  const rows = [];
  for (let start = 0; start < n; start += cols) {
    const cells = [];
    for (let i = start; i < Math.min(n, start + cols); i += 1) {
      const alive = curve && curve[i] != null ? Math.max(0, Math.min(1, curve[i])) : 0;
      const pct = curve ? Math.round(6 + 54 * alive) : 0;
      cells.push(
        <span
          key={i}
          className={`rt-c${i === mark ? ' avg' : ''}`}
          style={pct ? { background: `color-mix(in srgb,#616d88 ${pct}%,transparent)` } : undefined}
        />
      );
    }
    rows.push(<span key={start} className="rt-r">{cells}</span>);
  }
  return <span className={`rt-t mini${cols >= 7 ? ' w' : ''}`} aria-hidden="true">{rows}</span>;
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
.rt-row{display:flex;align-items:flex-end;justify-content:space-between;gap:6px;min-width:0}
.rt-b{display:flex;flex-direction:column;align-items:center;gap:6px;min-width:62px}
.rt-t{display:flex;flex-direction:column-reverse;gap:2px}
.rt-r{display:flex;gap:2px}
.rt-c{display:flex;align-items:center;justify-content:center;box-sizing:border-box;width:8px;height:8px;
  border-radius:2px;border:1px solid #616d88;background:transparent}
.rt-t.w .rt-r,.rt-t.w{gap:1.5px}
.rt-t.w .rt-c{width:5px}
.rt-c.f{background:var(--c);border:0}
.rt-c.x{background:${MISS};border:1.5px solid #e8ecf4}
.rt-c.now{background:color-mix(in srgb,var(--c) 22%,#0b0f1a);border:1.5px solid var(--c)}
.rt-c.h{border-color:#8b95a8;background:repeating-linear-gradient(135deg,#616d88 0 1.5px,transparent 1.5px 6px)}
.rt-c i{font-style:normal;font-size:9.5px;font-weight:800;line-height:1;color:#08222e;
  font-variant-numeric:tabular-nums}
.rt-c.now i{color:var(--c)}
.rt-t.big,.rt-t.big .rt-r{gap:3px}
.rt-t.big .rt-c{width:22px;height:22px;border-radius:5px}
.rt-t.big .rt-c.x{border-width:2px}
.rt-t.big .rt-c.now{border-width:2.5px}
.rt-k{display:flex;flex-direction:column;align-items:center;line-height:1.25}
.rt-k b{font-size:12.5px;font-weight:800;white-space:nowrap}
.rt-k em{font-style:normal;font-size:11px;font-weight:700;color:#8b95a8;font-variant-numeric:tabular-nums}
.rt-k em.on{color:#e8ecf4}

.rt-t.mini,.rt-t.mini .rt-r{gap:2px}
.rt-t.mini .rt-c{width:7px;height:7px;border-radius:1.5px}
.rt-t.mini.w,.rt-t.mini.w .rt-r{gap:1.5px}
.rt-t.mini.w .rt-c{width:5px}
.rt-t.mini .rt-c.avg{border:1.5px solid #e8ecf4}

.rb-row{display:flex;gap:10px;min-width:0}
.rb-g{flex:1 1 0;min-width:0;display:grid;grid-template-columns:1fr auto;grid-template-areas:"nm sc" "bar bar";
  align-items:baseline;gap:6px 4px}
.rb-nm{grid-area:nm;font-size:13px;font-weight:800;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.rb-sc{grid-area:sc;font-style:normal;font-size:11.5px;font-weight:700;color:#8b95a8;font-variant-numeric:tabular-nums}
.rb-sc.on{color:#e8ecf4}
.rb-bar{grid-area:bar;position:relative;display:block;height:12px;box-sizing:border-box;border-radius:6px;
  border:1.5px solid #616d88;overflow:hidden}
.rb-f{position:absolute;left:0;top:0;bottom:0}
.rb-cap{position:absolute;top:0;bottom:0;width:6px;background:${MISS}}

@media (max-width:640px){
  .rt-row{gap:3px}
  .rt-b{min-width:0;gap:4px}
  .rt-t,.rt-r{gap:1.5px}
  .rt-c{width:5.5px;height:5.5px;border-radius:1px}
  .rt-t.w,.rt-t.w .rt-r{gap:1px}
  .rt-t.w .rt-c{width:3.4px}
  .rt-t.big,.rt-t.big .rt-r{gap:2px}
  .rt-t.big .rt-c{width:11px;height:11px;border-radius:2.5px}
  .rt-t.big .rt-c.x,.rt-t.big .rt-c.now{border-width:1.5px}
  .rt-c i{display:none}
  .rt-k b{font-size:9.5px}
  .rt-k em{font-size:9.5px}
  .rt-t.mini .rt-c{width:6px;height:6px}
  .rt-t.mini.w .rt-c{width:4px}
  .rb-row{gap:6px}
  .rb-g{grid-template-columns:1fr;grid-template-areas:"nm" "bar" "sc";gap:4px}
  .rb-nm,.rb-sc{font-size:10.5px}
  .rb-bar{height:10px;border-radius:5px}
}
`;
