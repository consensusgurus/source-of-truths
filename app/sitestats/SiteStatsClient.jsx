'use client';

import { useEffect, useState, useCallback } from 'react';
import { T } from '@/lib/theme';

// ---- Brand tokens (site navy/gold) ----
const NAVY = T.accent;
const NAVY_MID = '#1b2f5c';
const NAVY_TRACK = '#dbe1ee';   // light navy: the "all viewers" outer bar / meter track
const GOLD = T.gold;
const INK = T.ink;
const MUTED = '#8a92a1';
const FAINT = '#b6bcc7';
const SURFACE = '#f4f6fa';
const CARD = T.white;
const UP = T.successDeep;
const DOWN = T.danger;
const LINE = 'rgba(20,22,28,0.30)';

// Compact number formatting: 1,284 / 12.9K / 3.4M.
function fmt(n) {
  if (n == null || !Number.isFinite(Number(n))) return '—';
  n = Number(n);
  if (Math.abs(n) >= 1_000_000) return (n / 1_000_000).toFixed(n % 1_000_000 === 0 ? 0 : 1).replace(/\.0$/, '') + 'M';
  if (Math.abs(n) >= 10_000) return (n / 1000).toFixed(n % 1000 === 0 ? 0 : 1).replace(/\.0$/, '') + 'K';
  return n.toLocaleString('en-US');
}

// Duration in seconds -> compact human string (44s / 12m / 3.2h / 27h).
function fmtDur(s) {
  if (s == null || !Number.isFinite(Number(s))) return '—';
  s = Number(s);
  if (s < 60) return `${Math.round(s)}s`;
  const m = s / 60;
  if (m < 60) return `${Math.round(m)}m`;
  const h = m / 60;
  if (h < 10) return `${h.toFixed(1)}h`;
  return `${Math.round(h)}h`;
}

function timeAgo(iso) {
  if (!iso) return '';
  const s = Math.max(0, Math.floor((Date.now() - new Date(iso).getTime()) / 1000));
  if (s < 60) return `${s}s ago`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

function clockET(iso) {
  if (!iso) return '';
  try {
    return new Date(iso).toLocaleTimeString('en-US', { timeZone: 'America/New_York', hour: 'numeric', minute: '2-digit' });
  } catch (e) { return ''; }
}

// One D/D · W/W · M/M delta chip.
function Delta({ label, cell }) {
  const p = cell ? cell.pct : undefined;
  let color = MUTED, arrow = '', text = '—';
  if (p === null) { color = UP; arrow = '▲'; text = 'NEW'; }
  else if (typeof p === 'number') {
    if (p > 0) { color = UP; arrow = '▲'; }
    else if (p < 0) { color = DOWN; arrow = '▼'; }
    else { color = MUTED; arrow = '±'; }
    text = `${Math.abs(p)}%`;
  }
  return (
    <div className="ss-chip">
      <span className="ss-chip-k">{label}</span>
      <span className="ss-chip-v" style={{ color }}>{arrow ? `${arrow} ` : ''}{text}</span>
    </div>
  );
}

function MetricRow({ label, accent, value, cells }) {
  return (
    <div className="ss-mrow">
      <div className="ss-mtop">
        <span className="ss-dot" style={{ background: accent }} />
        <span className="ss-mlabel">{label}</span>
        <span className="ss-mval">{value}</span>
      </div>
      <div className="ss-mdeltas">
        <Delta label="D / D" cell={cells && cells.d} />
        <Delta label="W / W" cell={cells && cells.w} />
        <Delta label="M / M" cell={cells && cells.m} />
      </div>
    </div>
  );
}

// The metric list: players, plays, time played, viewers, views — each row
// with its own trailing-period comparisons.
function MetricList({ data, hasViewers }) {
  const p = data.players || {};
  const v = data.viewers || {};
  const val = (m) => fmt(m && m.d ? m.d.now : null);
  const rows = [
    { label: 'Quiz players', accent: GOLD, value: val(p.unique), cells: p.unique },
    { label: 'Quiz plays', accent: GOLD, value: val(p.plays), cells: p.plays },
    { label: 'Time played', accent: GOLD, value: fmtDur(p.time && p.time.d ? p.time.d.now : null), cells: p.time },
    { label: 'Site viewers', accent: NAVY, value: hasViewers ? val(v.unique) : '—', cells: hasViewers ? v.unique : null },
    { label: 'Site views', accent: NAVY, value: hasViewers ? val(v.views) : '—', cells: hasViewers ? v.views : null },
  ];
  return (
    <div className="ss-card">
      <div className="ss-h">Traffic <span className="ss-h-sub">last 24h · vs trailing periods</span></div>
      {rows.map((r, i) => <MetricRow key={i} {...r} />)}
    </div>
  );
}

function TopToday({ rows }) {
  const max = rows && rows.length ? Math.max(...rows.map((r) => r.plays)) : 0;
  return (
    <div className="ss-card">
      <div className="ss-h">Top quizzes today</div>
      {(!rows || rows.length === 0) && <div className="ss-empty">No plays yet today.</div>}
      {rows && rows.map((r, i) => (
        <div className="ss-toprow" key={r.quizId}>
          <span className="ss-rank">{i + 1}</span>
          <div className="ss-topmid">
            <div className="ss-topname" title={r.title}>{r.title}</div>
            <div className="ss-topbar"><span style={{ width: `${max ? Math.round((r.plays / max) * 100) : 0}%` }} /></div>
          </div>
          <span className="ss-topcount">{fmt(r.plays)}</span>
        </div>
      ))}
    </div>
  );
}

function LastPlayed({ rows }) {
  return (
    <div className="ss-card">
      <div className="ss-h">Last played</div>
      {(!rows || rows.length === 0) && <div className="ss-empty">Nothing played yet.</div>}
      {rows && rows.map((r, i) => (
        <div className="ss-lprow" key={i}>
          <div className="ss-lpmid">
            <div className="ss-topname" title={r.title}>{r.title}</div>
            <div className="ss-lpsub">{r.name}{r.total ? ` · ${r.score}/${r.total}` : ''}</div>
          </div>
          <div className="ss-lptime">
            <div className="ss-lpago">{timeAgo(r.playedAt)}</div>
            <div className="ss-lpclock">{clockET(r.playedAt)}</div>
          </div>
        </div>
      ))}
    </div>
  );
}

// Nested time-of-day chart: outer bar = all site viewers that hour, inner bar =
// the subset who played a quiz. Both scaled to the same max so the inner bar
// literally reads as a slice of the outer one.
function HourChart({ hourly, hasViewers }) {
  const [focus, setFocus] = useState(null); // hour index or null
  const data = hourly || [];
  const nowHour = (() => {
    try {
      const h = new Intl.DateTimeFormat('en-US', { timeZone: 'America/New_York', hour: 'numeric', hour12: false, hourCycle: 'h23' }).format(new Date());
      return Number(h) % 24;
    } catch (e) { return null; }
  })();

  const maxVal = Math.max(1, ...data.map((d) => Math.max(hasViewers ? d.viewers : 0, d.players)));

  const W = 340, H = 150, padB = 18, padT = 6;
  const plotH = H - padB - padT;
  const slot = W / 24;
  const outerW = slot * 0.62;
  const innerW = slot * 0.30;

  const barH = (v) => Math.max(v > 0 ? 2 : 0, Math.round((v / maxVal) * plotH));
  const foc = focus == null ? nowHour : focus;
  const fd = foc != null ? data[foc] : null;
  const hourLabel = (h) => {
    const ap = h < 12 ? 'a' : 'p';
    const hr = h % 12 === 0 ? 12 : h % 12;
    return `${hr}${ap}`;
  };

  return (
    <div className="ss-card">
      <div className="ss-h">Traffic by time of day <span className="ss-h-sub">today, ET</span></div>

      <div className="ss-legend">
        <span className="ss-lg"><span className="ss-sw" style={{ background: NAVY_TRACK }} />Site viewers</span>
        <span className="ss-lg"><span className="ss-sw" style={{ background: NAVY }} />Quiz players</span>
      </div>

      <div className="ss-readout">
        {fd ? (
          <>
            <span className="ss-ro-h">{hourLabel(foc)}–{hourLabel((foc + 1) % 24)}</span>
            {hasViewers && <span className="ss-ro-i"><b>{fmt(fd.viewers)}</b> viewers</span>}
            <span className="ss-ro-i"><b>{fmt(fd.players)}</b> players</span>
            {hasViewers && fd.viewers > 0 && (
              <span className="ss-ro-i ss-ro-rate">{Math.round((Math.min(fd.players, fd.viewers) / fd.viewers) * 100)}% played</span>
            )}
          </>
        ) : <span className="ss-ro-h">Tap a bar for detail</span>}
      </div>

      <svg viewBox={`0 0 ${W} ${H}`} width="100%" preserveAspectRatio="xMidYMid meet" role="img" aria-label="Site viewers and quiz players by hour of day">
        {/* baseline */}
        <line x1="0" y1={H - padB} x2={W} y2={H - padB} stroke={LINE} strokeWidth="1" />
        {data.map((d, h) => {
          const cx = h * slot + slot / 2;
          const isFoc = h === foc;
          const vH = hasViewers ? barH(d.viewers) : 0;
          const pH = barH(Math.min(d.players, hasViewers ? d.viewers : d.players));
          return (
            <g key={h}>
              {hasViewers && vH > 0 && (
                <rect x={cx - outerW / 2} y={H - padB - vH} width={outerW} height={vH} rx="2.5" fill={NAVY_TRACK} />
              )}
              {pH > 0 && (
                <rect x={cx - innerW / 2} y={H - padB - pH} width={innerW} height={pH} rx="2" fill={isFoc ? GOLD : NAVY} />
              )}
              {/* full-height hit target */}
              <rect x={h * slot} y={padT} width={slot} height={H - padB - padT}
                fill="transparent"
                onPointerEnter={() => setFocus(h)}
                onPointerDown={() => setFocus(h)}
                style={{ cursor: 'pointer' }} />
              {[0, 6, 12, 18, 23].includes(h) && (
                <text x={cx} y={H - 5} textAnchor="middle" className="ss-xlab">{hourLabel(h)}</text>
              )}
            </g>
          );
        })}
      </svg>

      {!hasViewers && (
        <div className="ss-note">Showing quiz players. Apply migration 36 to add the site-viewer bars.</div>
      )}
    </div>
  );
}

export default function SiteStatsClient() {
  const [data, setData] = useState(null);
  const [err, setErr] = useState(false);
  const [loading, setLoading] = useState(true);

  // The route answers at once with the last built figures and marks them
  // `stale` when they are over five minutes old. A stale answer is shown
  // straight away, then ?refresh=1 rebuilds and the new figures swap in.
  const load = useCallback(async () => {
    setLoading(true);
    setErr(false);
    try {
      const r = await fetch('/api/sitestats', { cache: 'no-store' });
      if (!r.ok) throw new Error('bad');
      const d = await r.json();
      setData(d);
      if (d && d.stale) {
        const r2 = await fetch('/api/sitestats?refresh=1', { cache: 'no-store' });
        if (r2.ok) {
          const d2 = await r2.json();
          if (d2 && !d2.error) setData(d2);
        }
      }
    } catch (e) {
      setErr(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);
  // Refresh in the background every 60s while the tab is open.
  useEffect(() => {
    const id = setInterval(() => { if (!document.hidden) load(); }, 60000);
    return () => clearInterval(id);
  }, [load]);

  const hasViewers = !!(data && data.viewers);

  return (
    <div className="ss-wrap">
      <style dangerouslySetInnerHTML={{ __html: CSS }} />

      <header className="ss-top">
        <div>
          <div className="ss-title">Site Stats</div>
          <div className="ss-sub">
            {data ? `Updated ${clockET(data.generatedAt)} ET${data.stale && loading ? ', refreshing…' : ''}` : 'Loading…'}
            {data && data.viewerSource === 'fallback' && <span className="ss-flag"> · viewers: fallback</span>}
          </div>
        </div>
        <button className="ss-refresh" onClick={load} disabled={loading} aria-label="Refresh">
          <span className={loading ? 'ss-spin' : ''}>↻</span>
        </button>
      </header>

      {err && !data && (
        <div className="ss-card ss-empty">Couldn’t load stats. <button className="ss-link" onClick={load}>Retry</button></div>
      )}

      {loading && !data && (
        <>
          <div className="ss-card ss-skel" style={{ height: 132 }} />
          <div className="ss-card ss-skel" style={{ height: 132 }} />
        </>
      )}

      {data && (
        <>
          <MetricList data={data} hasViewers={hasViewers} />
          {!hasViewers && (
            <div className="ss-note ss-note-solo">Site-viewer numbers turn on once migration 36 is applied in Supabase.</div>
          )}
          <HourChart hourly={data.hourly} hasViewers={hasViewers} />
          <TopToday rows={data.topToday} />
          <LastPlayed rows={data.lastPlayed} />
          <div className="ss-foot">Unique people are the headline; raw counts sit beneath. Comparisons are trailing periods (last 24h vs the 24h before, and so on).</div>
        </>
      )}
    </div>
  );
}

const CSS = `
.ss-wrap{max-width:480px;margin:0 auto;padding:14px 12px 40px;font-family:'Manrope',system-ui,-apple-system,sans-serif;color:${INK};background:${SURFACE};min-height:100vh;}
.ss-top{display:flex;align-items:center;justify-content:space-between;padding:4px 4px 12px;}
.ss-title{font-size:22px;font-weight:800;letter-spacing:-0.02em;color:${NAVY};}
.ss-sub{font-size:12px;color:${MUTED};margin-top:2px;}
.ss-flag{color:${GOLD};font-weight:700;}
.ss-refresh{width:40px;height:40px;border-radius:50%;border:1px solid ${LINE};background:${CARD};color:${NAVY};font-size:18px;line-height:1;cursor:pointer;display:flex;align-items:center;justify-content:center;}
.ss-refresh:disabled{opacity:.6;}
.ss-spin{display:inline-block;animation:ss-rot .8s linear infinite;}
@keyframes ss-rot{to{transform:rotate(360deg);}}

.ss-card{background:${CARD};border:1px solid ${LINE};border-radius:14px;padding:14px 15px;margin-bottom:12px;box-shadow:0 1px 2px rgba(20,22,28,0.03);}
.ss-h{font-size:13px;font-weight:800;letter-spacing:.01em;color:${NAVY};margin-bottom:10px;text-transform:uppercase;}
.ss-h-sub{font-size:10.5px;font-weight:700;color:${FAINT};text-transform:none;letter-spacing:0;margin-left:4px;}

.ss-dot{width:9px;height:9px;border-radius:50%;flex:none;}
.ss-mrow{padding:11px 0;border-bottom:1px dashed ${LINE};}
.ss-mrow:last-child{border-bottom:none;}
.ss-mrow:first-of-type{padding-top:2px;}
.ss-mtop{display:flex;align-items:center;gap:8px;}
.ss-mlabel{font-size:14px;font-weight:800;color:${INK};letter-spacing:-0.01em;}
.ss-mval{margin-left:auto;font-size:22px;font-weight:800;color:${NAVY};letter-spacing:-0.02em;line-height:1;}
.ss-mdeltas{display:flex;gap:8px;margin-top:9px;padding-left:17px;}
.ss-chip{flex:1 1 0;background:${SURFACE};border:1px solid ${LINE};border-radius:9px;padding:6px 6px;text-align:center;}
.ss-chip-k{display:block;font-size:9.5px;font-weight:800;color:${FAINT};letter-spacing:.06em;}
.ss-chip-v{display:block;font-size:13.5px;font-weight:800;margin-top:3px;font-variant-numeric:tabular-nums;}

.ss-toprow{display:flex;align-items:center;gap:10px;padding:7px 0;border-bottom:1px dashed ${LINE};}
.ss-toprow:last-child{border-bottom:none;}
.ss-rank{flex:none;width:20px;height:20px;border-radius:50%;background:${NAVY};color:var(--white);font-size:11px;font-weight:800;display:flex;align-items:center;justify-content:center;}
.ss-topmid{flex:1 1 auto;min-width:0;}
.ss-topname{font-size:13.5px;font-weight:700;line-height:1.2;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;}
.ss-topbar{height:5px;background:${SURFACE};border-radius:3px;margin-top:5px;overflow:hidden;}
.ss-topbar span{display:block;height:100%;background:${GOLD};border-radius:3px;}
.ss-topcount{flex:none;font-size:14px;font-weight:800;color:${NAVY};font-variant-numeric:tabular-nums;}

.ss-lprow{display:flex;align-items:center;gap:10px;padding:7px 0;border-bottom:1px dashed ${LINE};}
.ss-lprow:last-child{border-bottom:none;}
.ss-lpmid{flex:1 1 auto;min-width:0;}
.ss-lpsub{font-size:11.5px;color:${MUTED};margin-top:2px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;}
.ss-lptime{flex:none;text-align:right;}
.ss-lpago{font-size:12px;font-weight:700;color:${INK};}
.ss-lpclock{font-size:10.5px;color:${FAINT};margin-top:1px;}

.ss-legend{display:flex;gap:14px;margin-bottom:8px;}
.ss-lg{display:flex;align-items:center;gap:6px;font-size:11px;font-weight:700;color:${MUTED};}
.ss-sw{width:11px;height:11px;border-radius:3px;}
.ss-readout{min-height:20px;display:flex;flex-wrap:wrap;align-items:baseline;gap:10px;margin-bottom:6px;font-size:12px;color:${MUTED};}
.ss-ro-h{font-weight:800;color:${NAVY};font-size:12.5px;}
.ss-ro-i b{color:${INK};font-weight:800;}
.ss-ro-rate{color:${GOLD};font-weight:800;}
.ss-xlab{fill:${FAINT};font-size:9px;font-weight:700;font-family:'Manrope',system-ui,sans-serif;}

.ss-note{font-size:11px;color:${MUTED};margin-top:8px;background:${SURFACE};border-radius:8px;padding:7px 9px;}
.ss-note-solo{margin:-4px 0 12px;}
.ss-empty{font-size:13px;color:${MUTED};padding:6px 0;}
.ss-link{background:none;border:none;color:${NAVY};font-weight:800;cursor:pointer;text-decoration:underline;padding:0;}
.ss-skel{background:linear-gradient(90deg,#eef1f6,#f6f8fb,#eef1f6);background-size:200% 100%;animation:ss-sh 1.2s ease-in-out infinite;}
@keyframes ss-sh{0%{background-position:200% 0;}100%{background-position:-200% 0;}}
.ss-foot{font-size:11px;color:${FAINT};line-height:1.5;padding:2px 4px 0;}
`;
