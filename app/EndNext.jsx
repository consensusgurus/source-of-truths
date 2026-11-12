'use client';

// UP NEXT AND YOUR DAY. Up next is ONE element of three equal boxes (owner,
// 2026-11-12), one per next stop: glyph, name, short description, the week's
// difficulty band and the typical minutes. It replaced retention ending C's
// big Up next card, Start button, Then strip and Keep going switch (owner,
// 2026-11-07), whose points and rank moves "dont have much meaning to lay
// user". The three are the puzzles MOST SIMILAR to the one just played.
// Beside it (under it on a phone) is Your Day: a goal ring
// ("3 more for Top 20 in Today's Puzzles"), the countdown to tomorrow's
// puzzles with a calendar reminder, and a group nudge. No streak row (owner,
// 2026-11-11).
//
import { useEffect, useState } from 'react';
import GameGlyph from './GameGlyph';
import { categoryColor, softGround } from '@/lib/category-ramp';
import { DAILY_GAME_MAP } from '@/lib/daily-games';
import { tierOf } from '@/lib/daily-difficulty';
import { fetchDayStatus } from './useDayStats';

const MILESTONES = [500, 200, 100, 50, 20, 10, 5, 3, 1];

// Rank on the day board for a total, from the totals above the reader.
// `ladder` holds the nearest totals above (ascending); `farN` counts the ones
// above those, which a climb this short never reaches.
function rankFor(ladder, farN, x) {
  let n = 1 + farN;
  for (const t of ladder) if (t > x + 1e-9) n += 1;
  return n;
}

// The stops, in the order StageStick ranked them: MOST SIMILAR to the puzzle
// just played first (owner, 2026-11-12). `ranked` holds { key, pts, mins,
// finish } per open puzzle; pts is set only for the server's priced picks.
// There is no stored path any more: every ending offers what is closest to
// ITS game.
export function buildStops({ curKey, ranked, liveBy, dayRow, max = 4 }) {
  const byKey = new Map((ranked || []).map((p) => [p.key, p]));
  const open = (k) => k !== curKey && liveBy.has(k) && !liveBy.get(k).done;
  const keys = (ranked || []).map((p) => p.key).filter(open);
  const seen = new Set();
  const out = [];
  let cum = 0;
  const ladder = dayRow && Array.isArray(dayRow.ladder) ? dayRow.ladder : null;
  const total = dayRow && typeof dayRow.total === 'number' ? dayRow.total : null;
  for (const k of keys) {
    if (seen.has(k) || out.length >= max) continue;
    seen.add(k);
    const p = byKey.get(k);
    const g = liveBy.get(k);
    const pts = p && p.pts ? p.pts : null;
    if (pts) cum += pts;
    const rank = ladder && total != null && pts ? rankFor(ladder, Math.max(0, (Number(dayRow.ladderN) || ladder.length) - ladder.length), total + cum) : null;
    out.push({ key: k, name: g.name, href: g.href, cat: g.cat, mins: p ? p.mins : null, finish: p ? p.finish : null, pts, rank, why: p ? p.why : null });
  }
  return { stops: out, cont: false };
}

// THE THREE STANDINGS AS CHIPS (the desktop band). rows: Where You Stand rows.
export function StandChips({ rows, gameName }) {
  if (!rows || !rows.length) return null;
  const lab = (r) => (r.id === 'game' ? (gameName || 'This puzzle') : r.id === 'day' ? 'Today\u2019s Puzzles:' : (r.name || r.lab));
  return (
    <div className="enx-chips">
      <style dangerouslySetInnerHTML={{ __html: CSS }} />
      {rows.map((r, i) => (
        <span key={r.id} className="enx-chip" style={{ animationDelay: `${i * 120}ms` }}>
          {lab(r)} <b>#{r.rank}</b> of {r.of}{r.up ? <em>Up {r.up}</em> : null}
        </span>
      ))}
    </div>
  );
}

function Glyph({ k, cat, size = 28, box = 'm' }) {
  return (
    <span className={'enx-gl ' + box} style={{ '--nxp': softGround(categoryColor(cat)) }}>
      <GameGlyph gameKey={k} size={size} />
    </span>
  );
}

// The week's difficulty ratings: one shared, CDN-cached read per page load.
let ratingsOnce = null;
function ratings() {
  if (!ratingsOnce) {
    ratingsOnce = fetch('/api/quiz/difficulty').then((r) => r.json()).then((d) => (d && d.ratings) || {}).catch(() => ({}));
  }
  return ratingsOnce;
}

// UP NEXT: ONE ELEMENT, THREE BOXES (owner, 2026-11-12: "+12", "#5 -> #4"
// "dont have much meaning to lay user ... combine the elements into one 3 box
// element for the three puzzles ... just the title, short descript. and tags
// (hard, gentle, etc), and time to finish"). The big Up next card, its Start
// button, the Then strip and the Keep going switch are one row of three equal
// boxes. No points, no ranks, no "passes <name>" line. The boxes are plain
// links, most similar first (see buildStops).
// `from`, `passName` and `armed` are accepted and ignored (nothing starts by
// itself, and nothing here is priced).
export function EndNext({ stops, phone = false, picks = null }) {
  const [diff, setDiff] = useState(null);
  useEffect(() => {
    let alive = true;
    ratings().then((r) => { if (alive) setDiff(r); });
    return () => { alive = false; };
  }, []);
  // THE SAME THREE AS THE FIRST SCREEN (owner, 2026-11-12): when the ending
  // passes its picks (Play Similar, Switch Gears, the run), the row shows
  // exactly those, in that order, each under its own label.
  const usePicks = Array.isArray(picks) && picks.length > 0;
  const three = usePicks ? [] : (stops || []).slice(0, 3);
  if (usePicks) {
    return (
      <div className={'enx' + (phone ? ' ph' : '')}>
        <style dangerouslySetInnerHTML={{ __html: CSS }} />
        <div className="enx-sl">Up next</div>
        <div className={'enx-three n' + picks.length}>
          {picks.map((p, i) => {
            const g = p.glyph ? (DAILY_GAME_MAP[p.glyph] || {}) : {};
            return (
              <a key={p.eyebrow + p.name} className="enx-box" href={p.href} onClick={p.onClick || undefined} style={{ animationDelay: `${i * 110}ms` }}>
                {p.glyph ? <Glyph k={p.glyph} cat={g.cat || g.category || ''} size={24} /> : null}
                <span className="tx">
                  <span className="eb">{p.eyebrow}</span>
                  <b>{p.name}</b>
                  {p.sub ? <span className="ds">{p.sub}</span> : null}
                </span>
              </a>
            );
          })}
        </div>
      </div>
    );
  }
  if (!three.length) return null;
  return (
    <div className={'enx' + (phone ? ' ph' : '')}>
      <style dangerouslySetInnerHTML={{ __html: CSS }} />
      <div className="enx-sl">Up next</div>
      <div className={'enx-three n' + three.length}>
        {three.map((s, i) => {
          const d = DAILY_GAME_MAP[s.key] || {};
          const tier = diff ? tierOf(Number(diff[s.key])) : null;
          const desc = d.tag || s.cat || '';
          return (
            <a key={s.key} className="enx-box" href={s.href} style={{ animationDelay: `${i * 110}ms` }}>
              <Glyph k={s.key} cat={s.cat} size={24} />
              <span className="tx">
                <b>{s.name}</b>
                {desc ? <span className="ds">{desc}</span> : null}
                <span className="tg">
                  {tier ? <i>{tier.label}</i> : null}
                  {s.mins ? <i>{s.mins} min</i> : null}
                </span>
              </span>
            </a>
          );
        })}
      </div>
    </div>
  );
}

function untilMidnightET() {
  try {
    const now = new Date();
    const parts = new Intl.DateTimeFormat('en-US', { timeZone: 'America/New_York', hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' }).formatToParts(now);
    const v = (t) => Number((parts.find((p) => p.type === t) || {}).value || 0);
    const secs = 86400 - ((v('hour') % 24) * 3600 + v('minute') * 60 + v('second'));
    return Math.max(0, secs);
  } catch (e) { return null; }
}
const hm = (secs) => `${Math.floor(secs / 3600)}:${String(Math.floor((secs % 3600) / 60)).padStart(2, '0')}`;

// YOUR DAY: goal ring, streak, tomorrow, group nudge.
export function EndDay({ dayRow, stops, grp }) {
  const [streak, setStreak] = useState(null);
  const [left, setLeft] = useState(() => untilMidnightET());
  const [sent, setSent] = useState('');
  useEffect(() => {
    let alive = true;
    fetchDayStatus().then((d) => { if (alive && d && typeof d.streak === 'number') setStreak(d.streak); }).catch(() => {});
    const t = setInterval(() => setLeft(untilMidnightET()), 30000);
    return () => { alive = false; clearInterval(t); };
  }, []);

  // The goal: the nearest "Top N" above the reader that the path reaches.
  let goal = null;
  if (dayRow && dayRow.rank > 1) {
    const target = MILESTONES.find((m) => m < dayRow.rank);
    if (target) {
      const i = (stops || []).findIndex((s) => s.rank && s.rank <= target);
      if (i !== -1) goal = { k: i + 1, target, mins: stops.slice(0, i + 1).reduce((t, s) => t + (s.mins || 0), 0) };
    }
  }
  const played = dayRow ? (Number(dayRow.games) || 0) : 0;
  const ringOf = goal ? played + goal.k : played;
  const frac = ringOf ? played / ringOf : 0;
  const C = 2 * Math.PI * 28;

  const lead = grp && grp.groups ? grp.groups.filter((g) => !g.failed && g.rank)[0] : null;
  const waiting = lead ? Math.max(0, (Number(lead.members) || 0) - (Number(lead.played) || 0)) : 0;
  const nudge = async () => {
    const url = `${window.location.origin}/groups/${lead.code}`;
    const text = `I'm on today's Mind Loft puzzles. Come play in ${lead.name}:`;
    try {
      if (navigator.share && window.matchMedia('(pointer: coarse)').matches) { await navigator.share({ text, url }); setSent('Sent'); return; }
    } catch (e) { return; }
    try { await navigator.clipboard.writeText(`${text} ${url}`); setSent('Link copied'); } catch (e) { setSent(''); }
  };

  if (!dayRow && streak == null && !lead) return null;
  return (
    <section className="enx-day">
      <style dangerouslySetInnerHTML={{ __html: CSS }} />
      <div className="enx-sl">Your day</div>
      {dayRow ? (
        <div className="enx-goal">
          <svg width="68" height="68" viewBox="0 0 68 68" aria-hidden="true">
            <circle cx="34" cy="34" r="28" fill="none" className="tr" strokeWidth="7" />
            <circle cx="34" cy="34" r="28" fill="none" className="pr" strokeWidth="7" strokeLinecap="round"
              transform="rotate(-90 34 34)" style={{ strokeDasharray: C, '--off': C * (1 - frac), '--c': C }} />
            <text x="34" y="39" textAnchor="middle">{played}{goal ? `/${ringOf}` : ''}</text>
          </svg>
          <span className="tx">
            {dayRow.rank === 1 ? <><b>You lead Today&rsquo;s Puzzles</b><i>{played} {played === 1 ? 'puzzle' : 'puzzles'} played</i></>
              : goal ? <><b>{goal.k} more for {goal.target === 1 ? 'first place' : `Top ${goal.target}`} in Today&rsquo;s Puzzles</b><i>{(stops || []).slice(0, goal.k).map((s) => s.name).join(', ')}{goal.mins ? `, about ${goal.mins} min` : ''}</i></>
                : <><b>{played} {played === 1 ? 'puzzle' : 'puzzles'} today</b><i>#{dayRow.rank} of {dayRow.of} in Today&rsquo;s Puzzles</i></>}
          </span>
        </div>
      ) : null}
      {/* No streak row (owner, 2026-11-11: "i dont care about streak"). */}
      {left != null ? (
        <div className="enx-row">
          <svg width="24" height="24" viewBox="0 0 26 26" fill="none" strokeWidth="2" aria-hidden="true" className="ic"><circle cx="13" cy="13" r="10" /><path d="M13 7v6l4 3" /></svg>
          <span className="tx"><b>New puzzles in {hm(left)}</b><i>Tomorrow&rsquo;s lineup at midnight ET</i></span>
          <a className="enx-pill k" href="/remind" download="mind-loft-reminder.ics">Remind me</a>
        </div>
      ) : null}
      {lead && waiting > 0 && lead.code ? (
        <div className="enx-row">
          <span className="tx"><b>{waiting} in {lead.name} {waiting === 1 ? "hasn't" : "haven't"} played</b><i>{sent || 'Send them the group board'}</i></span>
          <button type="button" className="enx-pill" onClick={nudge}>Nudge</button>
        </div>
      ) : null}
    </section>
  );
}

const CSS = `
.enx,.enx-day,.enx-chips{--ex-ink:var(--sst-ink,#141a24);--ex-raise:var(--stg-raise,#fff);--ex-line:var(--stg-line,#e2e5ea);color:var(--ex-ink);}
.enx-sl{font-size:11px;font-weight:800;letter-spacing:.12em;text-transform:uppercase;opacity:.75;margin-bottom:10px;}
.enx-chips{display:flex;flex-wrap:wrap;gap:8px;flex:1;min-width:0;}
.enx-chip{background:color-mix(in srgb,var(--ex-raise) 70%,transparent);border-radius:999px;padding:7px 14px;font-size:13.5px;font-weight:600;display:inline-flex;gap:6px;align-items:center;white-space:nowrap;animation:enxPop .38s ease-out both;}
.enx-chip b{font-weight:800;}
.enx-chip em{font-style:normal;background:var(--ex-ink);color:var(--ex-raise);border-radius:999px;padding:1px 8px;font-size:11px;font-weight:800;}
.enx-gl{display:inline-flex;align-items:center;justify-content:center;flex:none;background:var(--nxp);border-radius:10px;width:40px;height:40px;}
.enx-three{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:10px;}
.enx-three.n2{grid-template-columns:repeat(2,minmax(0,1fr));}
.enx-three.n1{grid-template-columns:minmax(0,1fr);}
.enx-box{display:flex;align-items:flex-start;gap:12px;border:1px solid var(--ex-ink);border-radius:14px;padding:14px;background:var(--ex-raise);color:var(--ex-ink);text-decoration:none;min-width:0;animation:enxRise .4s ease-out both;transition:background .15s;}
.enx-box:hover{background:color-mix(in srgb,var(--ex-ink) 5%,var(--ex-raise));}
.enx-box:focus-visible,.enx-pill:focus-visible{outline:2px solid var(--ex-ink);outline-offset:2px;}
.enx-box .tx{display:flex;flex-direction:column;gap:3px;min-width:0;flex:1;}
.enx-box b{font-size:18px;font-weight:800;letter-spacing:-.01em;line-height:1.25;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;}
.enx-box .ds{font-size:13px;font-weight:600;opacity:.8;line-height:1.35;}
.enx-box .eb{font-size:11px;font-weight:800;letter-spacing:.1em;text-transform:uppercase;opacity:.75;}
.enx-box .tg{display:flex;flex-wrap:wrap;gap:6px;margin-top:7px;}
.enx-box .tg:empty{display:none;}
.enx-box .tg i{font-style:normal;font-size:11.5px;font-weight:800;line-height:1.3;border-radius:999px;padding:3px 9px;background:color-mix(in srgb,var(--ex-ink) 8%,transparent);white-space:nowrap;}
.enx.ph .enx-three,.enx.ph .enx-three.n2{grid-template-columns:minmax(0,1fr);gap:8px;}
@container (max-width:620px){.enx-three,.enx-three.n2{grid-template-columns:minmax(0,1fr);}}
.enx-day{border:1px solid var(--ex-line);border-radius:14px;padding:16px 18px;background:var(--ex-raise);animation:enxRise .45s .25s ease-out both;}
.enx-goal{display:flex;align-items:center;gap:14px;}
.enx-goal .tr{stroke:var(--ex-line);}
.enx-goal .pr{stroke:var(--ex-ink);stroke-dashoffset:var(--c);animation:enxRing 1.1s .6s ease-out forwards;}
.enx-goal text{font-family:Manrope,system-ui,sans-serif;font-weight:800;font-size:15px;fill:var(--ex-ink);}
.enx-goal .tx,.enx-row .tx{display:flex;flex-direction:column;gap:2px;min-width:0;}
.enx-goal b{font-size:16px;font-weight:800;}
.enx-goal i,.enx-row i{font-style:normal;font-size:12.5px;font-weight:600;opacity:.8;}
.enx-row{display:flex;align-items:center;gap:10px;margin-top:12px;padding-top:12px;border-top:1px solid var(--ex-line);}
.enx-row b{font-size:14px;font-weight:800;}
.enx-row .fl{fill:#fdd97c;stroke:var(--ex-ink);}
.enx-row .ic{stroke:var(--ex-ink);}
.enx-pill{margin-left:auto;flex:none;border:1px solid var(--ex-ink);background:var(--ex-raise);color:var(--ex-ink);font:inherit;font-size:13px;font-weight:800;border-radius:10px;padding:9px 14px;text-decoration:none;cursor:pointer;}
.enx-pill.k{background:var(--ex-ink);color:var(--ex-raise);}
@keyframes enxRise{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:none}}
@keyframes enxPop{from{opacity:0;transform:scale(.88)}to{opacity:1;transform:none}}
@keyframes enxRing{to{stroke-dashoffset:var(--off)}}
@media (prefers-reduced-motion:reduce){.enx-box,.enx-day,.enx-chip{animation:none;}.enx-goal .pr{animation:none;stroke-dashoffset:var(--off);}}
`;
