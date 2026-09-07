'use client';

// THE SUNDAY LEDGER (owner, 2026-09-07). On a Sunday the home opens with the
// week: one row per set (lib/daily-groups) the reader touched, one column per
// day, each cell the number of that set's games they finished that day and
// solid when the set was completed. Three figures over it (points this week,
// days played, best finish) and the sets never touched under it, one tap each,
// because the empty rows are the retention lever. Sunday's own column is
// dashed until it is played.
//
// It opens ONCE, on the first Sunday arrival, and collapses to a chip for the
// rest of the day (`sot_ledger_seen_<ymd>`). Data is /api/quiz/daily-combined
// for each day of the week through the shared board client, `me.perGame`
// only, cached on the device under `sot_ledger_<sundayYmd>` so a reopen or a
// second visit costs nothing. Today's read is the same query the home already
// makes, so it joins that request. Sundays only, or ?ledger=1 to review it on
// any day (the week then ends today).

import { useEffect, useMemo, useState } from 'react';
import { DAILY_GAME_MAP, liveDailyKeys } from '@/lib/daily-games';
import { GROUPS } from '@/lib/daily-groups';
import { categoryColor, categoryColorLight, categoryOnrampLight, RAMP_INK } from '@/lib/category-ramp';
import { fetchDailyBoard, dailyBoardQuery, dailyBoardIdentity } from './dailyBoardClient';
import { etToday } from './useDayStats';

const MONO = "'JetBrains Mono', ui-monospace, SFMono-Regular, Menlo, monospace";
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
  const [open, setOpen] = useState(false);
  const [today, setToday] = useState('');
  const [week, setWeek] = useState(null);     // [{ ymd, played: {key: {finished, rank, score, total}}, total }] or null
  const [name, setName] = useState('');

  useEffect(() => {
    let forced = false;
    try { forced = /[?&]ledger=1(&|$)/.test(window.location.search); } catch (e) {}
    const t = etToday();
    if (!forced && !isSunday(t)) return;
    setToday(t);
    setOn(true);
    try {
      const id = JSON.parse(localStorage.getItem('sot_quiz_identity') || 'null');
      if (id && id.username) setName(id.username);
    } catch (e) {}
    // Open once, on the first arrival of the day.
    try {
      const k = `sot_ledger_seen_${t}`;
      if (!localStorage.getItem(k) || forced) { setOpen(true); localStorage.setItem(k, '1'); }
    } catch (e) { setOpen(true); }
  }, []);

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
      const counts = week.map((d) => keys.filter((k) => d.played[k]).length);
      if (counts.some((n) => n)) rows.push({ name: g.name, cat: g.cat, keys, counts, size: keys.length });
      else untouched.push({ name: g.name, cat: g.cat, first: DAILY_GAME_MAP[keys[0]] });
    }
    rows.sort((a, b) => b.counts.reduce((x, y) => x + y, 0) - a.counts.reduce((x, y) => x + y, 0));
    const points = Math.round(week.reduce((s, d) => s + d.total, 0));
    const daysPlayed = week.filter((d) => Object.keys(d.played).length).length;
    let best = null;
    for (const d of week) {
      for (const key of Object.keys(d.played)) {
        const r = d.played[key].rank;
        if (r != null && (!best || r < best.rank)) best = { rank: r, key };
      }
    }
    // Sunday's own move: the first open game in the most-played set, else the
    // first open game in the first untouched set.
    const todayPlayed = week[6] ? week[6].played : {};
    let go = null;
    for (const r of rows) { const k = r.keys.find((x) => !todayPlayed[x]); if (k) { go = { set: r.name, g: DAILY_GAME_MAP[k] }; break; } }
    if (!go && untouched.length) go = { set: untouched[0].name, g: untouched[0].first };
    return { rows, untouched: untouched.slice(0, 8), points, daysPlayed, best, go, anyPlay: daysPlayed > 0 };
  }, [week]);

  if (!on || !today) return null;
  const days = weekEnding(today);
  const hue = (cat) => (light ? categoryColorLight(cat) : categoryColor(cat));
  const onHue = (cat) => (light ? categoryOnrampLight(cat) : RAMP_INK);
  const range = `${label(days[0])} to ${label(days[6])}`;

  if (!open) {
    return (
      <>
        <style>{CSS}</style>
        <button type="button" className="sld-chip" onClick={() => setOpen(true)}>
          <span className="sld-eb">Your week</span><b>{range}</b><span aria-hidden="true">&#9662;</span>
        </button>
      </>
    );
  }

  return (
    <section className="sld sty-rev">
      <style>{CSS}</style>
      <div className="sld-hd">
        <div><div className="sld-eb">Your week</div><b>{range}</b></div>
        <div className="sld-hr">
          {name ? <span className="sld-eb">{name}</span> : null}
          <button type="button" className="sld-x" onClick={() => setOpen(false)} aria-label="Collapse">&#9652;</button>
        </div>
      </div>
      {!model ? <div className="sld-wait">Reading the week&hellip;</div> : !model.anyPlay ? (
        <div className="sld-wait">Nothing played this week yet. Sunday is a fine day to start.</div>
      ) : (
        <>
          <div className="sld-figs">
            <div className="sld-fig"><b>{model.points.toLocaleString()}</b><i>points this week</i></div>
            <div className="sld-fig"><b>{model.daysPlayed}<small> of 7</small></b><i>days played</i></div>
            {model.best ? <div className="sld-fig"><b>#{model.best.rank}</b><i>best finish &middot; {DAILY_GAME_MAP[model.best.key] ? DAILY_GAME_MAP[model.best.key].name : model.best.key}</i></div> : null}
          </div>
          <div className="sld-card">
            <div className="sld-wk">
              <div />
              {DAYS.map((d, i) => <div key={i} className="sld-dh">{d}</div>)}
              {model.rows.map((r) => (
                <RowCells key={r.name} r={r} hue={hue(r.cat)} on={onHue(r.cat)} />
              ))}
            </div>
            <div className="sld-eb sld-note">solid = set completed that day &middot; {isSunday(today) ? 'Sunday is still open' : 'today is still open'}</div>
          </div>
        </>
      )}
      {model && model.untouched.length ? (
        <div>
          <div className="sld-eb" style={{ marginBottom: 6 }}>Sets you never touched</div>
          <div className="sld-un">
            {model.untouched.map((u) => (
              <a key={u.name} href={withTq(u.first.href || `/${u.first.key}`)} style={{ '--rc': hue(u.cat) }}>{u.name}</a>
            ))}
          </div>
        </div>
      ) : null}
      {model && model.go && model.go.g ? (
        <a className="sld-go" href={withTq(model.go.g.href || `/${model.go.g.key}`)}
          style={{ '--rc': hue(DAILY_GAME_MAP[model.go.g.key].cat), '--ron': onHue(DAILY_GAME_MAP[model.go.g.key].cat) }}>
          {isSunday(today) ? 'Start Sunday' : 'Start today'} &middot; {model.go.g.name}<span>{model.go.set}</span>
        </a>
      ) : null}
    </section>
  );
}

function RowCells({ r, hue, on }) {
  return (
    <>
      <div className="sld-rl" style={{ '--rc': hue }}><s /><span>{r.name}</span></div>
      {r.counts.map((n, i) => (
        <div key={i} className={'sld-c' + (n ? (n === r.size ? ' full' : ' on') : '') + (i === 6 ? ' sun' : '')}
          style={{ '--rc': hue, '--ron': on }}>{n || ''}</div>
      ))}
    </>
  );
}

const CSS = `
.sld{display:flex;flex-direction:column;gap:12px;padding:14px;border:1px solid var(--stg-line);
  border-radius:12px;background:var(--stg-raise);}
.sld-eb{font-family:${MONO};font-size:9.5px;letter-spacing:.15em;text-transform:uppercase;color:var(--stg-mute);}
.sld-hd{display:flex;justify-content:space-between;align-items:flex-end;gap:12px;}
.sld-hd b{display:block;font-size:20px;font-weight:800;letter-spacing:-.02em;margin-top:2px;}
.sld-hr{display:flex;align-items:center;gap:10px;}
.sld-x{font:inherit;background:none;border:1px solid var(--stg-line);border-radius:6px;color:var(--stg-ink2);
  width:28px;height:28px;cursor:pointer;}
.sld-wait{font-size:13px;color:var(--stg-ink2);}
.sld-figs{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:10px;}
.sld-fig b{display:block;font-size:24px;font-weight:800;letter-spacing:-.03em;line-height:1;font-variant-numeric:tabular-nums;}
.sld-fig b small{font-size:12px;opacity:.6;font-weight:700;}
.sld-fig i{display:block;font-style:normal;font-family:${MONO};font-size:8.5px;letter-spacing:.14em;
  text-transform:uppercase;color:var(--stg-mute);margin-top:5px;}
.sld-card{border:1px solid var(--stg-line);border-radius:10px;padding:11px 12px;background:var(--stg-surf);}
.sld-wk{display:grid;grid-template-columns:minmax(72px,110px) repeat(7,minmax(0,1fr));gap:3px;align-items:center;}
.sld-dh{font-family:${MONO};font-size:8.5px;letter-spacing:.1em;text-transform:uppercase;color:var(--stg-mute);text-align:center;}
.sld-rl{font-size:12px;font-weight:700;display:flex;align-items:center;gap:6px;min-width:0;}
.sld-rl span{overflow:hidden;text-overflow:ellipsis;white-space:nowrap;}
.sld-rl s{text-decoration:none;width:3px;height:14px;border-radius:2px;background:var(--rc);flex:none;}
.sld-c{height:24px;border-radius:4px;background:var(--stg-chip);display:grid;place-items:center;
  font-family:${MONO};font-size:10px;font-weight:700;color:var(--stg-mute);}
.sld-c.on{background:var(--rc);color:var(--ron);}
.sld-c.full{background:var(--rc);color:var(--ron);outline:2px solid var(--stg-ink);outline-offset:-2px;}
.sld-c.sun:not(.on):not(.full){border:1px dashed var(--stg-line2);}
.sld-note{margin-top:8px;}
.sld-un{display:flex;flex-wrap:wrap;gap:6px;}
.sld-un a{font-size:12px;font-weight:700;padding:5px 9px;border:1px solid var(--stg-line);border-left:3px solid var(--rc);
  border-radius:6px;color:var(--stg-ink);text-decoration:none;}
.sld-un a:hover{border-color:var(--stg-line2);border-left-color:var(--rc);}
.sld-go{display:flex;align-items:center;justify-content:space-between;gap:10px;text-decoration:none;
  font-size:14px;font-weight:800;padding:12px 14px;border-radius:9px;background:var(--rc);color:var(--ron);}
.sld-go span{font-family:${MONO};font-size:9px;letter-spacing:.14em;text-transform:uppercase;opacity:.8;font-weight:700;}
.sld-chip{display:inline-flex;align-items:center;gap:8px;font:inherit;cursor:pointer;align-self:flex-start;
  background:var(--stg-surf);border:1px solid var(--stg-line);border-radius:99px;padding:6px 12px;color:var(--stg-ink);}
.sld-chip b{font-size:12.5px;font-weight:800;}
.sld-chip span:last-child{color:var(--stg-mute);}
@media (max-width:480px){
  .sld-wk{grid-template-columns:minmax(58px,80px) repeat(7,minmax(0,1fr));}
  .sld-rl{font-size:11px;}
  .sld-figs{gap:6px;}
  .sld-fig b{font-size:20px;}
}
`;
