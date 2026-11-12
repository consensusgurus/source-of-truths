'use client';

// UP NEXT, THE PATH AND YOUR DAY (owner, 2026-11-07, "Retention Ending
// Mockups", direction C). The daily ending leads with ONE next play: a big
// Start that starts by itself after 8 seconds unless the reader touches the
// page. Under it, "Then": the next easiest stops in order, with the rank in
// All Puzzles the reader reaches after each. "Keep going after each" (on by
// default) remembers the path, so every ending on the way points its Start at
// the next stop. Beside it (under it on a phone) is Your Day: a goal ring
// ("3 more for Top 20 in Today's Puzzles"; the day board was "All" until the
// owner renamed it 2026-11-11, the day he also dropped the streak row), the countdown to
// tomorrow's puzzles with a calendar reminder, and a group nudge.
//
// The path is stored per ET day in localStorage `sot_path`:
//   { d: 'YYYY-MM-DD', keys: [k1, k2, ...], on: true|false }
// An ending whose game is on today's stored path (and `on`) continues it;
// any other ending builds a fresh one from the easiest picks.

import { useEffect, useRef, useState } from 'react';
import GameGlyph from './GameGlyph';
import { categoryColor, softGround } from '@/lib/category-ramp';
import { DAILY_GAME_MAP } from '@/lib/daily-games';
import { etToday, fetchDayStatus } from './useDayStats';

const PATH_KEY = 'sot_path';
const AUTO_DELAY_MS = 1200;
const AUTO_MS = 8000;
const MILESTONES = [500, 200, 100, 50, 20, 10, 5, 3, 1];

export function readPath() {
  try {
    const p = JSON.parse(localStorage.getItem(PATH_KEY) || 'null');
    if (p && p.d === etToday() && Array.isArray(p.keys)) return p;
  } catch (e) { /* nothing stored */ }
  return null;
}
function savePath(keys, on) {
  try { localStorage.setItem(PATH_KEY, JSON.stringify({ d: etToday(), keys, on: !!on })); } catch (e) { /* private mode */ }
}

// Rank on the day board for a total, from the totals above the reader.
// `ladder` holds the nearest totals above (ascending); `farN` counts the ones
// above those, which a climb this short never reaches.
function rankFor(ladder, farN, x) {
  let n = 1 + farN;
  for (const t of ladder) if (t > x + 1e-9) n += 1;
  return n;
}

// The stops: the stored path continued, else the picks in their ending order.
// `ranked` is StageStick's ordered pick list (each { key, pts, mins, finish, g }).
export function buildStops({ curKey, ranked, liveBy, dayRow, max = 4 }) {
  const byKey = new Map((ranked || []).map((p) => [p.key, p]));
  const open = (k) => k !== curKey && liveBy.has(k) && !liveBy.get(k).done;
  const stored = readPath();
  let keys = null;
  let cont = false;
  if (stored && stored.on && stored.keys.includes(curKey)) {
    const rest = stored.keys.slice(stored.keys.indexOf(curKey) + 1).filter(open);
    if (rest.length) { keys = rest; cont = true; }
  }
  if (!keys) keys = (ranked || []).map((p) => p.key).filter(open);
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
  return { stops: out, cont };
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

// UP NEXT + THEN. armed: the ending has settled and this is a fresh finish.
export function EndNext({ stops, from = null, passName = null, armed = false, phone = false }) {
  const [keep, setKeep] = useState(() => { const p = readPath(); return p ? p.on !== false : true; });
  const [auto, setAuto] = useState('idle');   // idle | run | off
  const timer = useRef(null);
  const first = stops && stops[0];
  const go = (href) => {
    if (keep) savePath(stops.map((s) => s.key), true);
    else savePath([], false);
    if (href) window.location.assign(href);
  };
  const stop = () => {
    if (timer.current) { clearTimeout(timer.current); timer.current = null; }
    setAuto((a) => (a === 'run' || a === 'idle' ? 'off' : a));
  };
  useEffect(() => {
    if (!armed || !first || auto !== 'idle') return undefined;
    let ok = true;
    try {
      if (/[?&]p=/.test(window.location.search)) ok = false;
      if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) ok = false;
      if (document.visibilityState === 'hidden') ok = false;
    } catch (e) { ok = false; }
    if (!ok) { setAuto('off'); return undefined; }
    const t0 = setTimeout(() => {
      setAuto('run');
      timer.current = setTimeout(() => { timer.current = null; go(first.href); }, AUTO_MS);
    }, AUTO_DELAY_MS);
    // Any touch, key, wheel or tab switch cancels it.
    const cancel = () => { clearTimeout(t0); stop(); };
    const vis = () => { if (document.visibilityState === 'hidden') cancel(); };
    const opts = { capture: true, passive: true };
    window.addEventListener('pointerdown', cancel, opts);
    window.addEventListener('keydown', cancel, opts);
    window.addEventListener('wheel', cancel, opts);
    window.addEventListener('touchstart', cancel, opts);
    document.addEventListener('visibilitychange', vis);
    return () => {
      clearTimeout(t0);
      if (timer.current) { clearTimeout(timer.current); timer.current = null; }
      window.removeEventListener('pointerdown', cancel, opts);
      window.removeEventListener('keydown', cancel, opts);
      window.removeEventListener('wheel', cancel, opts);
      window.removeEventListener('touchstart', cancel, opts);
      document.removeEventListener('visibilitychange', vis);
    };
  }, [armed, first && first.key]);   // eslint-disable-line react-hooks/exhaustive-deps

  if (!first) return null;
  const rest = stops.slice(1);
  const d = DAILY_GAME_MAP[first.key] || {};
  const head = passName ? `Up next · passes ${passName} in Today\u2019s Puzzles`
    : first.rank && from && first.rank < from ? `Up next · up to #${first.rank} in Today\u2019s Puzzles` : 'Up next';
  const last = stops.filter((s) => s.rank).pop();
  const allMins = stops.reduce((t, s) => t + (s.mins || 0), 0);
  const onStart = (e) => { e.preventDefault(); stop(); go(first.href); };
  const flip = () => {
    const v = !keep;
    setKeep(v);
    savePath(v ? stops.map((s) => s.key) : [], v);
  };
  return (
    <div className={'enx' + (phone ? ' ph' : '')}>
      <style dangerouslySetInnerHTML={{ __html: CSS }} />
      <div className="enx-up">
        <div className="enx-sl">{head}</div>
        <a className="enx-main" href={first.href} onClick={onStart}>
          <Glyph k={first.key} cat={first.cat} size={phone ? 34 : 44} box="l" />
          <span className="tx">
            <b>Play {first.name}</b>
            <span className="ds">{phone ? null : (d.tag ? d.tag + ' · ' : null)}{[first.mins ? `${first.mins} min` : null, first.finish != null ? `${first.finish}% finish` : null].filter(Boolean).join(' · ')}</span>
          </span>
          {first.pts ? (
            <span className="rt"><b>+{first.pts}</b>{first.rank && from && first.rank < from ? <em>#{from} &rarr; #{first.rank}</em> : null}</span>
          ) : null}
        </a>
        <div className="enx-go">
          <a className={'enx-start' + (auto === 'run' ? ' run' : '')} href={first.href} onClick={onStart} style={{ '--nxp-auto': softGround(categoryColor(first.cat)) }}>
            <span>Start {first.name}</span>
            <i className="bar" aria-hidden="true" style={{ animationDuration: `${AUTO_MS}ms` }} />
          </a>
          {auto === 'run' ? (
            <>
              <span className="enx-note">Starts on its own in 8 seconds{rest.length ? `, then ${rest.map((s) => s.name).join(', ')}` : ''}</span>
              <button type="button" className="enx-stay" onClick={stop}>Stay here</button>
            </>
          ) : rest.length ? <span className="enx-note">Then {rest.map((s) => s.name).join(', ')}</span> : null}
        </div>
      </div>
      {rest.length ? (
        <div className="enx-then">
          <div className="enx-sl enx-th">
            <span>Then{allMins ? ` · about ${allMins} min in all` : ''}</span>
            {last && from && last.rank < from ? <span className="to">#{from} &rarr; <b>#{last.rank}</b></span> : null}
          </div>
          <div className="enx-stops">
            {rest.map((s, i) => (
              <a key={s.key} className="enx-stop" href={s.href} onClick={(e) => { e.preventDefault(); stop(); go(s.href); }} style={{ animationDelay: `${200 + i * 110}ms` }}>
                <span className="dot" aria-hidden="true" />
                <Glyph k={s.key} cat={s.cat} size={20} />
                <span className="tx"><b>{s.name}</b><i>{[s.mins ? `${s.mins} min` : null, s.pts ? `+${s.pts}` : null].filter(Boolean).join(' · ')}</i></span>
                {s.rank ? <em>#{s.rank}</em> : null}
              </a>
            ))}
          </div>
          <button type="button" className={'enx-keep' + (keep ? ' on' : '')} role="switch" aria-checked={keep} onClick={flip}>
            <span className="tx"><b>Keep going after each</b><i>Each ending starts the next stop</i></span>
            <span className="sw" aria-hidden="true" />
          </button>
        </div>
      ) : null}
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
.enx-gl.l{width:76px;height:76px;border-radius:14px;}
.enx.ph .enx-gl.l{width:58px;height:58px;border-radius:12px;}
.enx-up{border:1.5px solid var(--ex-ink);border-radius:14px;padding:18px 20px;background:var(--ex-raise);animation:enxRise .45s ease-out both;}
.enx-main{display:grid;grid-template-columns:auto minmax(0,1fr) auto;gap:18px;align-items:center;color:var(--ex-ink);text-decoration:none;}
.enx-main .tx{display:flex;flex-direction:column;gap:4px;min-width:0;}
.enx-main .tx b{font-size:32px;font-weight:800;letter-spacing:-.02em;line-height:1.1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;padding-bottom:.06em;}
.enx-main .ds{font-size:14px;font-weight:600;opacity:.8;line-height:1.35;}
.enx-main .rt{display:flex;flex-direction:column;align-items:flex-end;gap:4px;}
.enx-main .rt b{font-size:38px;font-weight:800;line-height:1;font-variant-numeric:tabular-nums;}
.enx-main .rt em{font-style:normal;font-size:13px;font-weight:800;white-space:nowrap;}
.enx-go{display:flex;align-items:center;gap:14px;flex-wrap:wrap;margin-top:16px;padding-top:14px;border-top:1px solid var(--ex-line);}
.enx-start{position:relative;overflow:hidden;display:inline-flex;align-items:center;justify-content:center;height:52px;padding:0 28px;border-radius:12px;background:var(--ex-ink);color:var(--ex-raise);font-size:16px;font-weight:800;text-decoration:none;}
.enx-start .bar{position:absolute;left:0;bottom:0;height:5px;width:0;background:var(--nxp-auto,#fdd97c);}
.enx-start.run .bar{animation:enxFill linear forwards;}
.enx-start:focus-visible,.enx-stay:focus-visible,.enx-keep:focus-visible,.enx-pill:focus-visible{outline:2px solid var(--ex-ink);outline-offset:2px;}
.enx-note{font-size:13px;font-weight:600;opacity:.8;}
.enx-stay{margin-left:auto;border:0;background:none;font:inherit;font-size:13.5px;font-weight:800;color:var(--ex-ink);padding:10px 6px;cursor:pointer;}
.enx-then{margin-top:14px;border:1px solid var(--ex-line);border-radius:14px;padding:16px 18px;background:var(--ex-raise);animation:enxRise .45s .15s ease-out both;}
.enx-th{display:flex;justify-content:space-between;gap:10px;}
.enx-th .to{letter-spacing:0;text-transform:none;font-size:13px;opacity:1;}
.enx-stops{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:10px;}
.enx-stop{display:flex;align-items:center;gap:12px;border:1px solid var(--ex-line);border-radius:12px;padding:10px 12px;color:var(--ex-ink);text-decoration:none;animation:enxRise .4s ease-out both;min-width:0;}
.enx-stop:hover{border-color:var(--ex-ink);}
.enx-stop .dot{display:none;}
.enx-stop .tx{display:flex;flex-direction:column;min-width:0;}
.enx-stop b{font-size:15px;font-weight:800;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;}
.enx-stop i{font-style:normal;font-size:12px;font-weight:600;opacity:.8;}
.enx-stop em{font-style:normal;margin-left:auto;font-weight:800;font-size:15px;font-variant-numeric:tabular-nums;}
.enx-keep{display:flex;align-items:center;gap:12px;width:100%;margin-top:12px;padding:10px 0 0;border:0;border-top:1px solid var(--ex-line);background:none;font:inherit;color:var(--ex-ink);text-align:left;cursor:pointer;}
.enx-keep .tx{display:flex;flex-direction:column;}
.enx-keep b{font-size:14px;font-weight:800;}
.enx-keep i{font-style:normal;font-size:12px;font-weight:600;opacity:.75;}
.enx-keep .sw{margin-left:auto;flex:none;width:42px;height:24px;border-radius:999px;background:var(--ex-line);position:relative;transition:background .2s;}
.enx-keep .sw::after{content:"";position:absolute;left:3px;top:3px;width:18px;height:18px;border-radius:50%;background:var(--ex-raise);transition:left .2s;}
.enx-keep.on .sw{background:var(--ex-ink);}
.enx-keep.on .sw::after{left:21px;}
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
.enx.ph .enx-up{padding:16px;}
.enx.ph .enx-main{gap:14px;}
.enx.ph .enx-main .tx b{font-size:24px;}
.enx.ph .enx-main .rt b{font-size:28px;}
.enx.ph .enx-start{width:100%;height:56px;font-size:17px;}
.enx.ph .enx-go{gap:4px 10px;}
.enx.ph .enx-stops{grid-template-columns:minmax(0,1fr);gap:0;position:relative;}
.enx.ph .enx-stops::before{content:"";position:absolute;left:6px;top:18px;bottom:18px;width:3px;border-radius:2px;background:var(--ex-line);}
.enx.ph .enx-stop{border:0;border-radius:0;padding:9px 0 9px 26px;position:relative;}
.enx.ph .enx-stop .dot{display:block;position:absolute;left:0;width:11px;height:11px;border-radius:50%;background:var(--ex-raise);border:2px solid var(--ex-ink);}
@container (max-width:760px){.enx-stops{grid-template-columns:minmax(0,1fr);}}
@keyframes enxRise{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:none}}
@keyframes enxPop{from{opacity:0;transform:scale(.88)}to{opacity:1;transform:none}}
@keyframes enxFill{from{width:0}to{width:100%}}
@keyframes enxRing{to{stroke-dashoffset:var(--off)}}
@media (prefers-reduced-motion:reduce){.enx-up,.enx-then,.enx-day,.enx-stop,.enx-chip{animation:none;}.enx-goal .pr{animation:none;stroke-dashoffset:var(--off);}}
`;
