'use client';

// THE SUNDAY LEDGER (owner, 2026-09-07). On a Sunday the home opens with the
// week: one row per set (lib/daily-groups) the reader touched, one column per
// day, each cell the number of that set's games they finished that day and
// solid when the set was completed. Three figures over it (points this week,
// days played, best finish) and the sets never touched under it, one tap each,
// because the empty rows are the retention lever. Sunday's own column is
// dashed until it is played.
//
// ONE LINE (owner, 2026-10-11): the grid, chip and expand are gone. The week
// is a single full-width strip: seven day bars (games finished that day, today
// in gold), points, games, days played, best finish, a Start button and an X.
// It sheds pieces by its OWN width (container queries) so it stays one line
// from a wide desktop down to a small phone. The X hides it until next Sunday
// (`sot_ledger_hidden_<weekEndYmd>`), with a six-second Undo. Data is /api/quiz/daily-combined
// for each day of the week through the shared board client, `me.perGame`
// only, cached on the device under `sot_ledger_<sundayYmd>` so a reopen or a
// second visit costs nothing. Today's read is the same query the home already
// makes, so it joins that request. Sundays only, or ?ledger=1 to review it on
// any day (the week then ends today).

import { useEffect, useMemo, useRef, useState } from 'react';
import { DAILY_GAME_MAP, liveDailyKeys } from '@/lib/daily-games';
import { GROUPS } from '@/lib/daily-groups';
import { fetchDailyBoard, dailyBoardQuery, dailyBoardIdentity } from './dailyBoardClient';
import { etToday } from './useDayStats';

const DAYS = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

// The week ending on `ymd` (YYYY-MM-DD, ET), as seven YYYY-MM-DD strings.
function weekEnding(ymd) {
  const [Y, M, D] = ymd.split('-').map(Number);
  const end = Date.UTC(Y, M - 1, D);
  const out = [];
  for (let i = 6; i >= 0; i -= 1) {
    const d = new Date(end - i * 86400000);
    out.push(`${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}-${String(d.getUTCDate()).padStart(2, '0')}`);
  }
  return out;
}
// YYYY-MM-DD -> the route's M-D-YY.
const mdy = (ymd) => { const [Y, M, D] = ymd.split('-').map(Number); return `${M}-${D}-${String(Y).slice(2)}`; };
const label = (ymd) => {
  const [Y, M, D] = ymd.split('-').map(Number);
  return new Date(Date.UTC(Y, M - 1, D)).toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: 'UTC' });
};
const isSunday = (ymd) => { const [Y, M, D] = ymd.split('-').map(Number); return new Date(Date.UTC(Y, M - 1, D)).getUTCDay() === 0; };

export default function SundayLedger({ light = false, withTq = (h) => h }) {
  const [on, setOn] = useState(false);       // Sunday, or forced: decided in an effect
  const [today, setToday] = useState('');
  const [week, setWeek] = useState(null);     // [{ ymd, played: {key: {rank, score, total}}, total }] or null
  const [hidden, setHidden] = useState(false);
  const [undo, setUndo] = useState(false);
  const undoT = useRef(null);

  useEffect(() => {
    let forced = false;
    try { forced = /[?&]ledger=1(&|$)/.test(window.location.search); } catch (e) {}
    const t = etToday();
    if (!forced && !isSunday(t)) return;
    try { if (!forced && localStorage.getItem(`sot_ledger_hidden_${t}`)) return; } catch (e) {}
    setToday(t);
    setOn(true);
  }, []);
  useEffect(() => () => { if (undoT.current) clearTimeout(undoT.current); }, []);

  // THE WEEK, read once it is on. Cached per Sunday, since six of the seven
  // days are frozen boards.
  useEffect(() => {
    if (!on || !today) return undefined;
    const cacheKey = `sot_ledger_${today}`;
    try {
      const c = JSON.parse(localStorage.getItem(cacheKey) || 'null');
      if (c && Array.isArray(c.days) && c.days.length === 7 && c.at && Date.now() - c.at < 20 * 60 * 1000) { setWeek(c.days); return undefined; }
    } catch (e) {}
    let alive = true;
    const days = weekEnding(today);
    const ident = dailyBoardIdentity();
    Promise.all(days.map((ymd) => {
      const qs = dailyBoardQuery({ date: ymd === today ? null : mdy(ymd), ...ident });
      return fetchDailyBoard(qs).then((j) => {
        const me = j && j.me;
        const played = {};
        if (me && me.perGame) {
          for (const key of Object.keys(me.perGame)) {
            const g = me.perGame[key];
            if (!g || g.abandoned) continue;
            played[key] = { rank: g.rank ?? null, score: g.score ?? null, total: g.total ?? null };
          }
        }
        return { ymd, played, total: me && Number.isFinite(Number(me.total)) ? Number(me.total) : 0 };
      }).catch(() => ({ ymd, played: {}, total: 0 }));
    })).then((out) => {
      if (!alive) return;
      setWeek(out);
      try { localStorage.setItem(cacheKey, JSON.stringify({ at: Date.now(), days: out })); } catch (e) {}
    });
    return () => { alive = false; };
  }, [on, today]);

  const model = useMemo(() => {
    if (!week) return null;
    const live = new Set(liveDailyKeys());
    const rows = [];
    const untouched = [];
    for (const g of GROUPS) {
      const keys = g.keys.filter((k) => live.has(k) && DAILY_GAME_MAP[k]);
      if (keys.length < 2) continue;
      const n = week.reduce((s, d) => s + keys.filter((k) => d.played[k]).length, 0);
      if (n) rows.push({ name: g.name, keys, n });
      else untouched.push({ name: g.name, first: DAILY_GAME_MAP[keys[0]] });
    }
    rows.sort((a, b) => b.n - a.n);
    const perDay = week.map((d) => ({ ymd: d.ymd, g: Object.keys(d.played).length, p: Math.round(d.total) }));
    const games = perDay.reduce((s, d) => s + d.g, 0);
    const points = Math.round(week.reduce((s, d) => s + d.total, 0));
    const daysPlayed = perDay.filter((d) => d.g).length;
    let best = null;
    for (const d of week) {
      for (const key of Object.keys(d.played)) {
        const r = d.played[key].rank;
        if (r != null && (!best || r < best.rank)) best = { rank: r, key };
      }
    }
    const todayPlayed = week[6] ? week[6].played : {};
    let go = null;
    for (const r of rows) { const k = r.keys.find((x) => !todayPlayed[x]); if (k) { go = DAILY_GAME_MAP[k]; break; } }
    if (!go && untouched.length) go = untouched[0].first;
    return { perDay, max: Math.max(1, ...perDay.map((d) => d.g)), games, points, daysPlayed, best, go };
  }, [week]);

  if (!on || !today || hidden) return null;
  const days = weekEnding(today);
  const range = `${label(days[0])} to ${label(days[6])}`;
  const todayWord = isSunday(today) ? 'Sunday' : 'today';

  const hide = () => {
    try { localStorage.setItem(`sot_ledger_hidden_${today}`, '1'); } catch (e) {}
    setUndo(true);
    undoT.current = setTimeout(() => { setUndo(false); setHidden(true); }, 6000);
  };
  const unhide = () => {
    if (undoT.current) clearTimeout(undoT.current);
    try { localStorage.removeItem(`sot_ledger_hidden_${today}`); } catch (e) {}
    setUndo(false);
  };

  if (undo) {
    return (
      <div className="sld-host">
        <style dangerouslySetInnerHTML={{ __html: CSS }} />
        <div className="sld-undo" role="status">Your week is hidden until next Sunday<button type="button" onClick={unhide}>Undo</button></div>
      </div>
    );
  }

  const m = model;
  return (
    <div className="sld-host">
      <style dangerouslySetInnerHTML={{ __html: CSS }} />
      <div className="sld" role="region" aria-label="Your week">
        <span className="sld-id"><span className="sld-eb">Your week</span><span className="sld-rng">{range}</span></span>
        <span className="sld-sep" />
        <span className="sld-days">
          {(m ? m.perDay : days.map((ymd) => ({ ymd, g: 0, p: 0 }))).map((d, i) => {
            const isToday = i === 6;
            const h = d.g ? Math.max(4, Math.round(19 * d.g / (m ? m.max : 1))) : 3;
            const tip = !m ? `${label(d.ymd)}` : d.g
              ? `${DOW[i]} ${label(d.ymd)} · ${d.g} game${d.g === 1 ? '' : 's'} · ${d.p} pts${isToday ? ' so far' : ''}`
              : `${DOW[i]} ${label(d.ymd)} · no games`;
            return (
              <span key={d.ymd} tabIndex={0} aria-label={tip}
                className={'sld-d' + (d.g ? '' : ' zero') + (isToday ? ' today' : '') + (m ? '' : ' wait')}>
                <span className="sld-tip">{tip}</span>
                <i style={{ height: h }} /><b>{DAYS[i]}</b>
              </span>
            );
          })}
        </span>
        <span className="sld-sep" />
        {m ? (
          <span className="sld-figs">
            <span className="sld-pts"><strong>{m.points.toLocaleString()}</strong> pts</span>
            <span className="sld-gms"><strong>{m.games}</strong> games</span>
            <span><strong>{m.daysPlayed}</strong><span className="sld-dl"> of 7 days</span><span className="sld-ds">/7</span></span>
          </span>
        ) : <span className="sld-figs">Reading the week&hellip;</span>}
        {m && m.best ? <span className="sld-best">Best #{m.best.rank} &middot; {DAILY_GAME_MAP[m.best.key] ? DAILY_GAME_MAP[m.best.key].name : m.best.key}</span> : null}
        {m && m.go ? (
          <a className="sld-go" href={withTq(m.go.href || `/${m.go.key}`)}>{m.daysPlayed ? `Start ${todayWord}` : 'Start'} &middot; {m.go.name}</a>
        ) : null}
        <button type="button" className="sld-x" onClick={hide} aria-label="Hide your week until next Sunday">&times;</button>
      </div>
    </div>
  );
}

const DOW = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

const CSS = `
.sld-host{container-type:inline-size;width:100%;min-width:0;}
.sld{display:flex;align-items:center;gap:clamp(10px,1.6cqi,22px);height:48px;padding:0 6px 0 16px;width:100%;
  background:var(--stg-raise);border:1px solid var(--stg-line);border-radius:999px;white-space:nowrap;
  color:var(--stg-ink);font-variant-numeric:tabular-nums;}
.sld-eb{font-size:10.5px;font-weight:800;letter-spacing:.14em;text-transform:uppercase;color:var(--stg-mute);}
.sld-id{display:flex;align-items:baseline;gap:8px;flex:none;}
.sld-rng{font-size:13.5px;font-weight:800;}
.sld-sep{width:1px;height:22px;background:var(--stg-line);flex:none;}
.sld-days{flex:1 1 0;min-width:84px;display:flex;align-items:flex-end;justify-content:space-between;gap:4px;height:30px;}
.sld-d{flex:1 1 0;max-width:64px;position:relative;display:flex;flex-direction:column;align-items:center;gap:3px;outline:none;}
.sld-d i{display:block;width:100%;min-width:8px;border-radius:3px 3px 1px 1px;background:var(--cta,#2f6fe4);}
.sld-d.zero i{background:var(--stg-chip);}
.sld-d.today i{background:var(--gold,#e8b43a);}
.sld-d.wait i{background:var(--stg-chip);}
.sld-d b{font-size:9px;font-weight:800;color:var(--stg-mute);line-height:1;}
.sld-d.today b{color:var(--gold,#e8b43a);}
.sld-d:focus-visible i{outline:2px solid var(--stg-ink);outline-offset:2px;}
.sld-tip{position:absolute;bottom:calc(100% + 8px);left:50%;transform:translateX(-50%);background:var(--stg-ink);color:var(--stg-raise);
  font-size:11.5px;font-weight:700;padding:6px 9px;border-radius:7px;white-space:nowrap;pointer-events:none;opacity:0;transition:opacity .12s;z-index:20;}
.sld-d:hover .sld-tip,.sld-d:focus-visible .sld-tip{opacity:1;}
.sld-d:first-child .sld-tip{left:0;transform:none;}
.sld-d:last-child .sld-tip{left:auto;right:0;transform:none;}
.sld-figs{display:flex;align-items:baseline;gap:14px;font-size:13px;color:var(--stg-mute);font-weight:600;flex:none;}
.sld-figs strong{color:var(--stg-ink);font-weight:800;font-size:14px;}
.sld-ds{display:none;}
.sld-best{flex:none;background:var(--stg-chip);border-radius:999px;padding:3px 9px;font-size:12px;font-weight:700;}
.sld-go{flex:none;display:inline-flex;align-items:center;height:34px;padding:0 14px;border-radius:999px;
  background:var(--cta,#2f6fe4);color:#fff;font-weight:800;font-size:13px;text-decoration:none;}
.sld-go:hover{filter:brightness(1.08);}
.sld-x{flex:none;width:34px;height:34px;border-radius:50%;border:0;background:transparent;color:var(--stg-mute);
  font:inherit;font-size:20px;line-height:1;cursor:pointer;display:grid;place-items:center;padding:0;}
.sld-x:hover{background:var(--stg-chip);color:var(--stg-ink);}
.sld-x:focus-visible{outline:2px solid var(--stg-ink);}
.sld-undo{display:flex;align-items:center;gap:12px;height:48px;padding:0 6px 0 16px;border-radius:999px;
  background:var(--stg-surf);border:1px solid var(--stg-line);font-size:13px;font-weight:600;color:var(--stg-mute);white-space:nowrap;}
.sld-undo button{margin-left:auto;border:0;background:transparent;color:var(--stg-ink);font:inherit;font-weight:800;
  cursor:pointer;padding:6px 12px;border-radius:999px;}
.sld-undo button:hover{background:var(--stg-chip);}
@container (max-width:980px){ .sld-best{display:none;} }
@container (max-width:800px){ .sld-rng,.sld-gms{display:none;} }
@container (max-width:640px){ .sld-go,.sld-dl{display:none;} .sld-ds{display:inline;} }
@container (max-width:470px){
  .sld,.sld-undo{height:44px;}
  .sld{padding-left:14px;gap:10px;}
  .sld-sep{display:none;}
  .sld-x{width:30px;height:30px;}
}
@container (max-width:340px){ .sld-pts{display:none;} .sld-eb{letter-spacing:.08em;} }
@media (prefers-reduced-motion:reduce){ .sld-tip{transition:none;} }
`;
