'use client';
// LEADERBOARDS + STATS (owner, 2026-10-13). The home's leaderboard pane, rebuilt
// from the approved mockup: the day's figures against the last seven days, the
// most played games with four ways to sort them, the day by category and by
// hour, a few superlatives, every game as a heat grid, and ONE leaderboard that
// steps between Everyone and each of the reader's groups (it used to be two
// separate sections).
//
// TWO RULES FROM THE OWNER. A seven-day comparison is shown ONLY WHEN THE FIGURE
// IS GROWING; a figure that is flat or down shows no comparison at all. And the
// pane's figures come from their own request, /api/quiz/pulse, fetched only
// once the pane is open, so the home's first load pays nothing for them. The
// parent renders this component only while the pane is open, which also keeps
// it out of the stored home snapshot.
//
// The leaderboard rows cost no request: Everyone is the daily-combined board the
// home already holds, and each group is its rows on the group-standing read.
import { useEffect, useMemo, useState } from 'react';
import GameGlyph from '../GameGlyph';
import { gameStats } from '@/lib/daily-row-stats';

const routeOf = (g) => g.href || `/${g.key}`;
const catLabel = (c) => (c === 'Word' ? 'Words' : c);

function hhmm(sec) {
  const x = Math.max(0, Math.round(Number(sec) || 0));
  const h = Math.floor(x / 3600);
  const m = Math.round((x % 3600) / 60);
  return h ? h + 'h ' + m + 'm' : m + 'm';
}
function mmss(sec) {
  const x = Math.max(0, Math.round(Number(sec) || 0));
  const m = Math.floor(x / 60);
  const s = x % 60;
  return m >= 60 ? hhmm(x) : `${m}:${String(s).padStart(2, '0')}`;
}
const avg7 = (arr) => {
  if (!Array.isArray(arr) || arr.length < 8) return 0;
  let s = 0;
  for (let i = 1; i <= 7; i++) s += Number(arr[i]) || 0;
  return s / 7;
};
// The growth line, or null. Null whenever the figure is flat or down: the owner
// wants the comparison only when it says something is up.
function growth(now, base) {
  if (!(base > 0) || !(now > base * 1.02)) return null;
  const pct = Math.round(((now - base) / base) * 100);
  return pct >= 1 ? `▲ ${pct}% vs 7-day avg` : null;
}

function Spark({ values }) {
  const v = values.map((x) => Number(x) || 0);
  const max = Math.max(1, ...v);
  const w = 120, h = 30;
  const step = v.length > 1 ? w / (v.length - 1) : w;
  const pts = v.map((x, i) => `${(i * step).toFixed(1)},${(h - 2 - (x / max) * (h - 6)).toFixed(1)}`).join(' ');
  const last = pts.split(' ').pop().split(',');
  return (
    <svg className="lbs-spark" viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none" aria-hidden="true">
      <polyline points={pts} fill="none" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" vectorEffect="non-scaling-stroke" />
      <circle cx={last[0]} cy={last[1]} r="2.6" fill="currentColor" />
    </svg>
  );
}

const SORTS = [
  { id: 'plays', label: 'Plays' },
  { id: 'players', label: 'Players' },
  { id: 'avg', label: 'Avg score' },
  { id: 'rising', label: 'Rising' },
];

export default function BoardsPane({
  games, hueFor, withTq, total, top, myOut, meKey, boardCount, grp, scope, setScope,
  standing, myRow, who,
}) {
  const [pulse, setPulse] = useState(null);
  const [failed, setFailed] = useState(false);
  const [sort, setSort] = useState('plays');
  useEffect(() => {
    let alive = true;
    fetch('/api/quiz/pulse')
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => { if (!alive) return; if (d && Array.isArray(d.plays)) setPulse(d); else setFailed(true); })
      .catch(() => { if (alive) setFailed(true); });
    return () => { alive = false; };
  }, []);

  const byKey = useMemo(() => {
    const m = new Map();
    for (const g of games) m.set(g.key, g);
    return m;
  }, [games]);

  // One row per live game that has been played today, with its rise against the
  // same stretch of the last seven days.
  const rows = useMemo(() => {
    if (!pulse) return [];
    const out = [];
    for (const [key, s] of Object.entries(pulse.gameToday || {})) {
      const g = byKey.get(key);
      if (!g || !s || !s.plays) continue;
      const base = (Number((pulse.gameWeek || {})[key]) || 0) / 7;
      const ratio = base >= 1 ? s.plays / base : (s.plays >= 3 ? Infinity : 0);
      out.push({ key, g, ...s, base, ratio });
    }
    return out;
  }, [pulse, byKey]);

  const sorted = useMemo(() => {
    const r = rows.slice();
    const tie = (a, b) => b.plays - a.plays || a.g.name.localeCompare(b.g.name);
    if (sort === 'players') r.sort((a, b) => b.players - a.players || tie(a, b));
    else if (sort === 'avg') return r.filter((x) => x.graded >= 3 && x.avg != null).sort((a, b) => b.avg - a.avg || tie(a, b)).slice(0, 10);
    else if (sort === 'rising') return r.filter((x) => x.ratio > 1.1 && x.plays >= 3).sort((a, b) => b.ratio - a.ratio || tie(a, b)).slice(0, 10);
    else r.sort(tie);
    return r.slice(0, 10);
  }, [rows, sort]);
  const sortMax = sorted.reduce((m, x) => Math.max(m, sort === 'players' ? x.players : sort === 'avg' ? (x.avg || 0) : x.plays), 0);

  // The day by category, in the ramp's own order (the order games arrive in).
  const catSplit = useMemo(() => {
    const m = new Map();
    for (const x of rows) m.set(x.g.cat, (m.get(x.g.cat) || 0) + x.plays);
    const order = [];
    for (const g of games) if (!order.includes(g.cat)) order.push(g.cat);
    return order.filter((c) => m.get(c)).map((c) => ({ cat: c, n: m.get(c) }));
  }, [rows, games]);
  const catSum = catSplit.reduce((n, c) => n + c.n, 0);

  const sup = useMemo(() => {
    if (!rows.length) return [];
    const solid = rows.filter((x) => x.graded >= 5);
    const pick = (list, better) => list.reduce((a, b) => (a && !better(b, a) ? a : b), null);
    const out = [];
    const mp = pick(rows, (b, a) => b.plays > a.plays);
    if (mp) out.push({ label: 'Most played', x: mp, fig: `${mp.plays.toLocaleString()} plays` });
    const crowd = pick(rows, (b, a) => b.players > a.players);
    if (crowd && crowd !== mp) out.push({ label: 'Biggest crowd', x: crowd, fig: `${crowd.players.toLocaleString()} players` });
    const tough = pick(solid.filter((x) => x.avg != null), (b, a) => b.avg < a.avg);
    if (tough) out.push({ label: 'Toughest', x: tough, fig: `${Math.round(tough.avg * 100)}% average` });
    const perf = pick(solid.filter((x) => x.perfect > 0), (b, a) => b.perfect / b.graded > a.perfect / a.graded);
    if (perf) out.push({ label: 'Most perfect runs', x: perf, fig: `${Math.round((perf.perfect / perf.graded) * 100)}% perfect` });
    const quick = pick(solid.filter((x) => x.med), (b, a) => b.med < a.med);
    if (quick) out.push({ label: 'Quickest', x: quick, fig: `${mmss(quick.med)} median` });
    const riser = pick(rows.filter((x) => x.base >= 1 && x.ratio > 1.15), (b, a) => b.ratio > a.ratio);
    if (riser) out.push({ label: 'Biggest riser', x: riser, fig: `▲ ${Math.round((riser.ratio - 1) * 100)}%` });
    return out;
  }, [rows]);

  const heatMax = rows.reduce((m, x) => Math.max(m, x.plays), 0);
  const playsOf = useMemo(() => {
    const m = new Map();
    for (const x of rows) m.set(x.key, x.plays);
    return m;
  }, [rows]);

  // THE KPI ROW. Index 0 is today; 1..7 are the same stretch of earlier days.
  const kpis = useMemo(() => {
    if (!pulse) return null;
    const plays = pulse.plays || [];
    const players = pulse.players || [];
    const time = pulse.time || [];
    const perPlayer = time.map((t, i) => (players[i] ? t / players[i] : 0));
    const seq = (a) => [7, 6, 5, 4, 3, 2, 1, 0].map((i) => Number(a[i]) || 0);
    return [
      { label: 'Plays today', value: (plays[0] || 0).toLocaleString(), delta: growth(plays[0] || 0, avg7(plays)), spark: seq(plays) },
      { label: 'Players today', value: (players[0] || 0).toLocaleString(), delta: growth(players[0] || 0, avg7(players)), spark: seq(players) },
      { label: 'Time played', value: hhmm(time[0] || 0), delta: growth(time[0] || 0, avg7(time)), spark: seq(time) },
      { label: 'Time per player', value: perPlayer[0] ? hhmm(perPlayer[0]) : '–', delta: growth(perPlayer[0] || 0, avg7(perPlayer)), spark: seq(perPlayer) },
    ];
  }, [pulse]);

  const hours = useMemo(() => {
    if (!pulse) return null;
    const t = pulse.hourToday || [];
    const y = pulse.hourYest || [];
    const now = Math.min(23, Math.floor((Number(pulse.elapsed) || 0) / 3600000));
    const max = Math.max(1, ...t.slice(0, now + 1), ...y);
    return { t, y, now, max };
  }, [pulse]);

  // THE ONE LEADERBOARD. Everyone first, then each group the reader is in; the
  // arrows step through them and the chips jump straight to one.
  const groups = (grp && Array.isArray(grp.groups) ? grp.groups : []).filter((g) => !g.failed);
  const scopes = ['all', ...groups.map((g) => g.code)];
  const cur = scopes.includes(scope) ? scope : 'all';
  const curIdx = scopes.indexOf(cur);
  const step = (d) => setScope(scopes[(curIdx + d + scopes.length) % scopes.length]);
  const g = cur === 'all' ? null : groups.find((x) => x.code === cur);
  const lbRows = useMemo(() => {
    if (!g) return [...top, ...(myOut ? [myOut] : [])].map((r) => ({ ...r, gp: typeof r.gamesPlayed === 'number' ? `${r.gamesPlayed}/${total}` : '' }));
    const list = Array.isArray(g.rows) ? g.rows : [];
    const t10 = list.slice(0, 10);
    const me = meKey ? list.find((r) => r.userKey === meKey) : null;
    const out = me && !t10.some((r) => r.userKey === meKey) ? [...t10, me] : t10;
    return out.map((r) => ({ ...r, gp: r.siteRank ? `#${r.siteRank} site` : '' }));
  }, [g, top, myOut, meKey, total]);
  const scopeName = g ? g.name : 'Everyone';
  const scopeNote = g
    ? `${g.played || 0} of ${g.members || (g.roster ? g.roster.length : 0)} members played`
    : boardCount;

  const sortVal = (x) => (sort === 'players' ? x.players.toLocaleString()
    : sort === 'avg' ? `${Math.round((x.avg || 0) * 100)}%`
      : x.plays.toLocaleString());
  const rowGrowth = (x) => {
    if (x.base >= 1 && x.ratio > 1.15) return `▲ ${Math.round((x.ratio - 1) * 100)}%`;
    if (x.base < 1 && x.ratio === Infinity) return 'New';
    return null;
  };

  return (
    <div className="lbs">
      <style dangerouslySetInnerHTML={{ __html: CSS }} />

      <div className="lbs-kpis">
        {(kpis || [0, 1, 2, 3].map((i) => ({ label: ['Plays today', 'Players today', 'Time played', 'Time per player'][i], value: '–', delta: null, spark: null }))).map((k) => (
          <div className="lbs-kpi" key={k.label}>
            <i>{k.label}</i>
            <b>{k.value}</b>
            {k.delta ? <span className="lbs-up">{k.delta}</span> : <span className="lbs-flat">Since midnight ET</span>}
            {k.spark ? <Spark values={k.spark} /> : null}
          </div>
        ))}
      </div>
      {failed ? <p className="sty-ixe">The day&rsquo;s figures did not load. The leaderboard below is still current.</p> : null}

      <div className="lbs-two">
        <div className="lbs-card lbs-lb" id="sty-lb">
          <div className="lbs-hd">
            <span className="lbs-eb">Leaderboard</span>
            {scopes.length > 1 ? (
              <span className="lbs-step">
                <button type="button" aria-label="Previous board" onClick={() => step(-1)}>&lsaquo;</button>
                <b>{scopeName}</b>
                <button type="button" aria-label="Next board" onClick={() => step(1)}>&rsaquo;</button>
              </span>
            ) : <b className="lbs-scope">{scopeName}</b>}
          </div>
          {scopes.length > 1 ? (
            <div className="lbs-chips" role="group" aria-label="Which board">
              {scopes.map((s) => {
                const gg = s === 'all' ? null : groups.find((x) => x.code === s);
                return (
                  <button key={s} type="button" aria-pressed={s === cur} onClick={() => setScope(s)}>
                    {gg ? gg.name : 'Everyone'}
                  </button>
                );
              })}
            </div>
          ) : null}
          <div className="lbs-note">{scopeNote}</div>
          <table className="lbs-tbl">
            <tbody>
              {lbRows.map((r, i) => (
                <tr key={r.userKey || i} className={meKey && r.userKey === meKey ? 'me' : ''}>
                  <td className="lbs-pos">{r.rank || i + 1}</td>
                  <td className="lbs-who">{r.username || 'Player'}</td>
                  <td className="lbs-gp">{r.gp}</td>
                  <td className="lbs-pts">{r.total != null ? Math.round(r.total) : ''}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {!lbRows.length ? (
            <p className="sty-ixe">{g ? `Nobody in ${g.name} has a score yet today.` : 'No scores on the board yet today.'}</p>
          ) : null}
          <div className="lbs-foot">
            {g ? <a href={withTq(`/groups/${g.code}`)}>Open {g.name}</a> : null}
            {!groups.length && who ? <span>Play with friends? <a href={withTq('/groups')}>Start or join a group</a></span> : null}
            {!groups.length && !who ? <span>A group is a private daily board. <a href={withTq('/groups')}>See groups</a></span> : null}
          </div>
        </div>

        <div className="lbs-card">
          <div className="lbs-hd">
            <span className="lbs-eb">Most played today</span>
          </div>
          <div className="lbs-chips" role="group" aria-label="Sort by">
            {SORTS.map((s) => (
              <button key={s.id} type="button" aria-pressed={sort === s.id} onClick={() => setSort(s.id)}>{s.label}</button>
            ))}
          </div>
          {sorted.length ? (
            <ol className="lbs-mp">
              {sorted.map((x, i) => {
                const v = sort === 'players' ? x.players : sort === 'avg' ? (x.avg || 0) : x.plays;
                const up = rowGrowth(x);
                return (
                  <li key={x.key} style={{ '--cc': hueFor(x.g.cat) }}>
                    <span className="lbs-n">{i + 1}</span>
                    <a className="lbs-gn" href={withTq(routeOf(x.g))}>
                      <GameGlyph gameKey={x.key} size={15} className="sty-gi" />{x.g.name}
                    </a>
                    <span className="lbs-bar"><i style={{ width: `${sortMax ? Math.max(4, (v / sortMax) * 100) : 0}%` }} /></span>
                    <span className="lbs-v">{sortVal(x)}</span>
                    <span className="lbs-g">{up || ''}</span>
                  </li>
                );
              })}
            </ol>
          ) : (
            <p className="sty-ixe">{!pulse && !failed ? 'Reading today’s plays…'
              : sort === 'rising' ? 'Nothing is running ahead of its usual pace yet.'
                : 'No plays yet today.'}</p>
          )}
        </div>
      </div>

      {pulse ? (
        <div className="lbs-two">
          <div className="lbs-card">
            <div className="lbs-hd"><span className="lbs-eb">The day by category</span></div>
            {catSum ? (
              <>
                <div className="lbs-stack" aria-hidden="true">
                  {catSplit.map((c) => (
                    <i key={c.cat} style={{ width: `${(c.n / catSum) * 100}%`, background: hueFor(c.cat) }} />
                  ))}
                </div>
                <ul className="lbs-leg">
                  {catSplit.map((c) => (
                    <li key={c.cat} style={{ '--cc': hueFor(c.cat) }}>
                      <span className="lbs-sw" />{catLabel(c.cat)}
                      <b>{Math.round((c.n / catSum) * 100)}%</b>
                    </li>
                  ))}
                </ul>
              </>
            ) : <p className="sty-ixe">No plays yet today.</p>}
          </div>

          <div className="lbs-card">
            <div className="lbs-hd">
              <span className="lbs-eb">By the hour</span>
              <span className="lbs-key"><i className="t" />Today <i className="y" />Yesterday</span>
            </div>
            {hours ? (
              <>
                <div className="lbs-hrs" aria-label="Plays by hour, today against yesterday">
                  {hours.y.map((yv, h) => {
                    const tv = h <= hours.now ? (hours.t[h] || 0) : null;
                    return (
                      <div key={h} className="lbs-hr" title={`${h}:00 ET · today ${tv == null ? '–' : tv} · yesterday ${yv}`}>
                        <i className="y" style={{ height: `${(yv / hours.max) * 100}%` }} />
                        {tv != null ? <i className={'t' + (h === hours.now ? ' now' : '')} style={{ height: `${(tv / hours.max) * 100}%` }} /> : null}
                      </div>
                    );
                  })}
                </div>
                <div className="lbs-hx"><span>12a</span><span>6a</span><span>12p</span><span>6p</span><span>12a</span></div>
              </>
            ) : null}
          </div>
        </div>
      ) : null}

      {sup.length ? (
        <div className="lbs-sup">
          {sup.map((s) => (
            <a key={s.label} className="lbs-supc" href={withTq(routeOf(s.x.g))} style={{ '--cc': hueFor(s.x.g.cat) }}>
              <i>{s.label}</i>
              <b><GameGlyph gameKey={s.x.key} size={15} className="sty-gi" />{s.x.g.name}</b>
              <span>{s.fig}</span>
            </a>
          ))}
        </div>
      ) : null}

      {pulse ? (
        <div className="lbs-card">
          <div className="lbs-hd">
            <span className="lbs-eb">Every game today</span>
            <span className="lbs-key">Brighter means more plays</span>
          </div>
          <div className="lbs-heat">
            {games.map((gm) => {
              const n = playsOf.get(gm.key) || 0;
              const pct = heatMax ? Math.round((n / heatMax) * 34) : 0;
              return (
                <a key={gm.key} href={withTq(routeOf(gm))} className={'lbs-hc' + (n ? '' : ' zero')}
                  style={{ '--cc': hueFor(gm.cat), '--hp': `${pct}%` }} title={`${gm.name} · ${n} plays today`}>
                  <span>{gm.name}</span>
                  <b>{n || '–'}</b>
                </a>
              );
            })}
          </div>
        </div>
      ) : null}

      <div className="lbs-card">
        <div className="lbs-hd">
          <span className="lbs-eb">Your standing</span>
          <span className="lbs-key">
            {standing.length} played{myRow && myRow.rank ? ` · #${myRow.rank} overall` : ''}
          </span>
        </div>
        {standing.length ? (
          <table className="lbs-tbl lbs-st">
            <tbody>
              {standing.map((r) => (
                <tr key={r.key} style={{ '--cc': hueFor(r.g.cat) }}>
                  <td className="lbs-sg">
                    <a href={withTq(routeOf(r.g))}><GameGlyph gameKey={r.key} size={15} className="sty-gi" />{r.g.name}</a>
                  </td>
                  <td className="lbs-srun">{gameStats(r, r.g.miss, r.key) || '—'}</td>
                  <td className="lbs-srk">#{r.rank}<i>{' of '}{r.field}</i></td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : <p className="sty-ixe">Finish a game today and your rank in it shows up here.</p>}
      </div>
    </div>
  );
}

const CSS = `
.lbs{display:flex;flex-direction:column;gap:14px;min-width:0;font-family:Manrope,system-ui,sans-serif;}
.lbs-kpis{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:10px;}
.lbs-kpi{position:relative;border:1px solid var(--stg-line);border-radius:12px;background:var(--stg-surf);
  padding:12px 14px 10px;display:flex;flex-direction:column;gap:2px;min-width:0;overflow:hidden;}
.lbs-kpi > i{font-style:normal;font-size:11px;font-weight:800;letter-spacing:.1em;text-transform:uppercase;color:var(--stg-mute);}
.lbs-kpi > b{font-size:26px;font-weight:800;color:var(--stg-ink);line-height:1.15;font-variant-numeric:tabular-nums;}
.lbs-up{font-size:12px;font-weight:800;color:var(--stg-good);}
.lbs-flat{font-size:12px;font-weight:600;color:var(--stg-mute);}
.lbs-spark{display:block;width:100%;height:28px;margin-top:6px;color:var(--stg-acc-ink, var(--stg-brand));}
.lbs-two{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:14px;align-items:start;}
.lbs-card{border:1px solid var(--stg-line);border-radius:12px;background:var(--stg-surf);padding:12px 14px 14px;min-width:0;}
.lbs-hd{display:flex;align-items:center;justify-content:space-between;gap:10px;margin-bottom:8px;flex-wrap:wrap;}
.lbs-eb{font-size:11.5px;font-weight:800;letter-spacing:.13em;text-transform:uppercase;color:var(--stg-ink2);}
.lbs-scope{font-size:15px;font-weight:800;color:var(--stg-ink);}
.lbs-step{display:inline-flex;align-items:center;gap:6px;min-width:0;}
.lbs-step b{font-size:15px;font-weight:800;color:var(--stg-ink);max-width:180px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;}
.lbs-step button{width:28px;height:28px;border-radius:999px;border:1px solid var(--stg-line2);background:none;
  color:var(--stg-ink);font:800 17px/1 Manrope,system-ui,sans-serif;cursor:pointer;display:grid;place-items:center;padding:0;}
.lbs-step button:hover{background:var(--stg-surf2);}
.lbs-chips{display:flex;flex-wrap:wrap;gap:5px;margin:0 0 8px;}
.lbs-chips button{border:1px solid var(--stg-line2);background:none;color:var(--stg-ink2);border-radius:999px;padding:4px 11px;
  font:700 12px/1.3 Manrope,system-ui,sans-serif;cursor:pointer;max-width:170px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;}
.lbs-chips button:hover{color:var(--stg-ink);}
.lbs-chips button[aria-pressed=true]{background:var(--stg-ink);border-color:var(--stg-ink);color:var(--stg-ground);}
.lbs-chips button:focus-visible,.lbs-step button:focus-visible{outline:2px solid var(--stg-brand);outline-offset:2px;}
.lbs-note{font-size:12px;font-weight:600;color:var(--stg-mute);margin:0 0 6px;}
.lbs-tbl{width:100%;border-collapse:collapse;font-size:13.5px;color:var(--stg-ink);}
.lbs-tbl td{padding:6px 6px;border-top:1px solid var(--stg-line);vertical-align:middle;}
.lbs-tbl tr:first-child td{border-top:none;}
.lbs-tbl tr.me td{background:var(--stg-surf2);font-weight:800;}
.lbs-pos{width:30px;font-weight:800;color:var(--stg-ink2);font-variant-numeric:tabular-nums;}
.lbs-who{font-weight:700;max-width:0;width:100%;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;}
.lbs-gp{color:var(--stg-mute);font-size:12px;white-space:nowrap;text-align:right;}
.lbs-pts{font-weight:800;text-align:right;font-variant-numeric:tabular-nums;white-space:nowrap;}
.lbs-foot{margin-top:8px;font-size:12.5px;color:var(--stg-mute);}
.lbs-foot a,.lbs .sty-ixe a{color:var(--stg-acc-ink);font-weight:700;}
.lbs-mp{list-style:none;margin:0;padding:0;}
.lbs-mp li{display:grid;grid-template-columns:22px minmax(0,1.35fr) minmax(40px,1fr) auto 46px;align-items:center;gap:8px;
  padding:5px 0;border-top:1px solid var(--stg-line);font-size:13.5px;}
.lbs-mp li:first-child{border-top:none;}
.lbs-n{font-weight:800;color:var(--stg-ink2);font-variant-numeric:tabular-nums;}
.lbs-gn{display:flex;align-items:center;gap:6px;min-width:0;color:var(--stg-ink);font-weight:700;text-decoration:none;overflow:hidden;white-space:nowrap;text-overflow:ellipsis;}
.lbs-gn:hover{text-decoration:underline;}
.lbs-bar{height:8px;border-radius:99px;background:var(--stg-surf2);overflow:hidden;}
.lbs-bar i{display:block;height:100%;border-radius:99px;background:var(--cc);}
.lbs-v{font-weight:800;text-align:right;font-variant-numeric:tabular-nums;color:var(--stg-ink);}
.lbs-g{font-size:11.5px;font-weight:800;color:var(--stg-good);text-align:right;white-space:nowrap;}
.lbs-stack{display:flex;height:16px;border-radius:99px;overflow:hidden;gap:2px;margin:4px 0 10px;}
.lbs-stack i{display:block;height:100%;min-width:3px;}
.lbs-leg{list-style:none;margin:0;padding:0;display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:4px 14px;}
.lbs-leg li{display:flex;align-items:center;gap:7px;font-size:13px;color:var(--stg-ink);}
.lbs-leg b{margin-left:auto;font-variant-numeric:tabular-nums;}
.lbs-sw{width:10px;height:10px;border-radius:3px;background:var(--cc);flex:none;}
.lbs-key{font-size:12px;font-weight:600;color:var(--stg-mute);display:inline-flex;align-items:center;gap:5px;}
.lbs-key i{display:inline-block;width:10px;height:10px;border-radius:3px;margin-left:6px;}
.lbs-key i.t{background:var(--stg-acc-ink, var(--stg-brand));margin-left:0;}
.lbs-key i.y{background:var(--stg-line2);}
.lbs-hrs{display:grid;grid-template-columns:repeat(24,minmax(0,1fr));gap:2px;height:120px;align-items:end;}
.lbs-hr{position:relative;height:100%;}
.lbs-hr i{position:absolute;left:0;right:0;bottom:0;border-radius:3px 3px 0 0;}
.lbs-hr i.y{background:var(--stg-line2);}
.lbs-hr i.t{left:20%;right:20%;background:var(--stg-acc-ink, var(--stg-brand));}
.lbs-hr i.t.now{background:var(--stg-good);}
.lbs-hx{display:flex;justify-content:space-between;font-size:11px;font-weight:700;color:var(--stg-mute);margin-top:4px;}
.lbs-sup{display:grid;grid-template-columns:repeat(auto-fill,minmax(170px,1fr));gap:10px;}
.lbs-supc{display:flex;flex-direction:column;gap:3px;border:1px solid var(--stg-line);border-left:4px solid var(--cc);
  border-radius:10px;background:var(--stg-surf);padding:10px 12px;text-decoration:none;min-width:0;}
.lbs-supc:hover{background:var(--stg-surf2);}
.lbs-supc i{font-style:normal;font-size:11px;font-weight:800;letter-spacing:.1em;text-transform:uppercase;color:var(--stg-mute);}
.lbs-supc b{display:flex;align-items:center;gap:6px;font-size:15px;font-weight:800;color:var(--stg-ink);overflow:hidden;white-space:nowrap;text-overflow:ellipsis;}
.lbs-supc span{font-size:12.5px;font-weight:700;color:var(--stg-ink2);}
.lbs-heat{display:grid;grid-template-columns:repeat(auto-fill,minmax(112px,1fr));gap:5px;}
.lbs-hc{display:flex;align-items:center;justify-content:space-between;gap:6px;padding:6px 8px;border-radius:7px;
  border-left:4px solid var(--cc);background:color-mix(in srgb, var(--cc) var(--hp), var(--stg-surf2));
  color:var(--stg-ink);text-decoration:none;font-size:12px;font-weight:700;min-width:0;}
.lbs-hc span{overflow:hidden;white-space:nowrap;text-overflow:ellipsis;}
.lbs-hc b{font-variant-numeric:tabular-nums;font-weight:800;}
.lbs-hc.zero{background:var(--stg-surf2);color:var(--stg-ink2);}
.lbs-hc:hover{outline:1px solid var(--cc);}
.lbs-st .lbs-sg a{display:flex;align-items:center;gap:6px;color:var(--stg-ink);font-weight:700;text-decoration:none;}
.lbs-srun{color:var(--stg-ink2);font-size:12.5px;}
.lbs-srk{text-align:right;font-weight:800;white-space:nowrap;}
.lbs-srk i{font-style:normal;font-weight:600;color:var(--stg-mute);}
@media (max-width:1100px){ .lbs-kpis{grid-template-columns:repeat(2,minmax(0,1fr));} }
@media (max-width:900px){
  .lbs-two{grid-template-columns:minmax(0,1fr);}
  .lbs-kpi > b{font-size:22px;}
}
@media (max-width:480px){
  .lbs-mp li{grid-template-columns:20px minmax(0,1fr) auto 40px;}
  .lbs-mp .lbs-bar{display:none;}
  .lbs-leg{grid-template-columns:minmax(0,1fr);}
}
`;
