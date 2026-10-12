'use client';
// Analytics -> Pulse (2026-10-12), the admin desk's default view.
//
// One table of rolling windows (last 24h / 7 days / 30 days), each against the
// same span just before it, then the rolling active-player chart and rolling
// referrers. Data: /api/admin/data?part=pulse, built by lib/admin-pulse.js,
// which documents every definition used here.
import React, { useMemo, useRef, useState } from 'react';
import { T } from '@/lib/theme';

const C = {
  ink: T.ink,
  faded: T.muted,
  slate: T.slate,
  paper: T.white,
  surface: T.surface,
  line: 'rgba(20,22,28,0.18)',
  grid: 'rgba(20,22,28,0.08)',
  up: '#15803d',
  down: '#b45309',
  accent: T.accent,
};
const MONO = 'Manrope, monospace';
const SANS = 'Manrope, system-ui, -apple-system, sans-serif';
// Nested windows of one measure, so one hue light to dark (MAU, WAU, DAU).
const LINE = { mau: '#93b4f0', wau: '#4d7fe0', dau: '#1e3a8a' };

const WIN = [
  ['day', 'Last 24 hours', 'vs the 24h before'],
  ['week', 'Last 7 days', 'vs the 7 days before'],
  ['month', 'Last 30 days', 'vs the 30 days before'],
];

const nf = (n) => (n == null || !Number.isFinite(n) ? '—' : Math.round(n).toLocaleString());
function fmtTime(sec) {
  if (sec == null || !Number.isFinite(sec)) return '—';
  const h = sec / 3600;
  if (h >= 100) return `${Math.round(h).toLocaleString()} h`;
  if (h >= 1) return `${h.toFixed(1)} h`;
  return `${Math.round(sec / 60)} min`;
}
function fmtShort(sec) {
  if (sec == null || !Number.isFinite(sec)) return '—';
  const m = Math.floor(sec / 60), s = Math.round(sec % 60);
  return m > 0 ? `${m}m ${String(s).padStart(2, '0')}s` : `${s}s`;
}
const fmtPct = (v) => (v == null || !Number.isFinite(v) ? '—' : `${(v * 100).toFixed(1)}%`);
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const dayLabel = (ymd) => { const [, m, d] = ymd.split('-').map(Number); return `${MONTHS[m - 1]} ${d}`; };

// "▲ 12.4%" for counts, "▲ 1.2 pts" for ratios. Up is green, down amber, and
// the arrow carries the direction so colour is never the only signal.
function Delta({ c, ratio }) {
  if (!c) return null;
  let txt, dir;
  if (ratio) {
    if (c.now == null || c.prev == null) return <span style={{ color: C.slate }}>no prior</span>;
    const pts = (c.now - c.prev) * 100;
    dir = Math.abs(pts) < 0.05 ? 0 : Math.sign(pts);
    txt = `${Math.abs(pts).toFixed(1)} pts`;
  } else {
    if (c.pct == null) return <span style={{ color: C.slate }}>{c.now > 0 && !c.prev ? 'new' : 'no prior'}</span>;
    dir = Math.abs(c.pct) < 0.05 ? 0 : Math.sign(c.pct);
    txt = `${Math.abs(c.pct).toFixed(1)}%`;
  }
  const color = dir > 0 ? C.up : dir < 0 ? C.down : C.slate;
  return <span style={{ color, fontWeight: 700 }}>{dir > 0 ? '▲' : dir < 0 ? '▼' : '–'} {txt}</span>;
}

function Spark({ values, color = C.accent }) {
  if (!values || values.length < 2) return <span style={{ color: C.slate, fontSize: 10 }}>&mdash;</span>;
  const w = 140, h = 34, pad = 3;
  const max = Math.max(...values, 1);
  const min = Math.min(...values, 0);
  const x = (i) => pad + (i / (values.length - 1)) * (w - 2 * pad);
  const y = (v) => h - pad - ((v - min) / (max - min || 1)) * (h - 2 * pad);
  const d = values.map((v, i) => `${i ? 'L' : 'M'}${x(i).toFixed(1)},${y(v).toFixed(1)}`).join('');
  const last = values[values.length - 1];
  return (
    <svg width={w} height={h} role="img" aria-label={`90-day trend, latest ${nf(last)}, peak ${nf(max)}`}>
      <title>{`Through yesterday. Latest ${nf(last)}, peak ${nf(max)}`}</title>
      <path d={d} fill="none" stroke={color} strokeWidth={1.5} strokeLinejoin="round" strokeLinecap="round" />
      <circle cx={x(values.length - 1)} cy={y(last)} r={2.5} fill={color} />
    </svg>
  );
}

function MetricRow({ label, sub, data, fmt, ratio, spark, sparkColor, single }) {
  return (
    <div className="pl-row">
      <div>
        <div style={{ fontFamily: SANS, fontWeight: 700, fontSize: 13, color: C.ink }}>{label}</div>
        {sub ? <div style={{ fontFamily: SANS, fontSize: 11, color: C.faded, marginTop: 2 }}>{sub}</div> : null}
      </div>
      {WIN.map(([k]) => {
        const c = single ? (k === 'day' ? data : null) : data && data[k];
        if (!c) return <div key={k} />;
        return (
          <div key={k}>
            <div style={{ fontFamily: SANS, fontWeight: 800, fontSize: 19, color: C.ink, lineHeight: 1.1, fontVariantNumeric: 'tabular-nums' }}>{fmt(c.now)}</div>
            <div style={{ fontFamily: MONO, fontSize: 10.5, marginTop: 3, display: 'flex', gap: 6, flexWrap: 'wrap', fontVariantNumeric: 'tabular-nums' }}>
              <Delta c={c} ratio={ratio} />
              <span style={{ color: C.slate }}>vs {fmt(c.prev)}</span>
            </div>
          </div>
        );
      })}
      <div className="pl-spark">{spark ? <Spark values={spark} color={sparkColor} /> : null}</div>
    </div>
  );
}

function Section({ title, children }) {
  return (
    <>
      <div className="pl-sec">{title}</div>
      {children}
    </>
  );
}

function RollingChart({ series }) {
  const [hover, setHover] = useState(null);
  const box = useRef(null);
  const W = 900, H = 260, L = 46, R = 50, Tp = 14, B = 26;
  const pts = series || [];
  const max = Math.max(1, ...pts.map((p) => p.mau));
  const step = Math.pow(10, Math.floor(Math.log10(max)));
  const nice = [1, 2, 2.5, 5, 10].map((m) => m * step).find((v) => max / v <= 5) || step * 10;
  const top = Math.ceil(max / nice) * nice;
  const x = (i) => L + (pts.length > 1 ? (i / (pts.length - 1)) * (W - L - R) : 0);
  const y = (v) => Tp + (1 - v / top) * (H - Tp - B);
  const path = (k) => pts.map((p, i) => `${i ? 'L' : 'M'}${x(i).toFixed(1)},${y(p[k]).toFixed(1)}`).join('');
  const ticks = [];
  for (let v = 0; v <= top + 1e-9; v += nice) ticks.push(v);
  const xticks = pts.map((p, i) => [p, i]).filter(([p]) => p.day.endsWith('-01') || p.day.endsWith('-15'));
  const onMove = (e) => {
    const r = box.current.getBoundingClientRect();
    const px = ((e.clientX - r.left) / r.width) * W;
    const i = Math.round(((px - L) / (W - L - R)) * (pts.length - 1));
    setHover(i >= 0 && i < pts.length ? i : null);
  };
  if (pts.length < 2) return null;
  const h = hover != null ? pts[hover] : null;
  const lastP = pts[pts.length - 1];
  return (
    <div style={{ position: 'relative' }}>
      <svg ref={box} viewBox={`0 0 ${W} ${H}`} width="100%" style={{ display: 'block', overflow: 'visible' }} onMouseMove={onMove} onMouseLeave={() => setHover(null)} role="img" aria-label="Rolling active players, last 90 days">
        {ticks.map((v) => (
          <g key={v}>
            <line x1={L} x2={W - R} y1={y(v)} y2={y(v)} stroke={C.grid} />
            <text x={L - 8} y={y(v) + 3.5} textAnchor="end" fontSize="10.5" fill={C.slate} fontFamily={MONO}>{nf(v)}</text>
          </g>
        ))}
        {xticks.map(([p, i]) => (
          <text key={p.day} x={x(i)} y={H - 8} textAnchor="middle" fontSize="10.5" fill={C.slate} fontFamily={MONO}>{dayLabel(p.day)}</text>
        ))}
        {['mau', 'wau', 'dau'].map((k) => (
          <g key={k}>
            <path d={path(k)} fill="none" stroke={LINE[k]} strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" />
            <text x={W - R + 6} y={y(lastP[k]) + 3.5} fontSize="10.5" fontFamily={MONO} fill={C.ink}>{k.toUpperCase()}</text>
          </g>
        ))}
        {h ? (
          <g>
            <line x1={x(hover)} x2={x(hover)} y1={Tp} y2={H - B} stroke={C.slate} strokeDasharray="3 3" />
            {['mau', 'wau', 'dau'].map((k) => <circle key={k} cx={x(hover)} cy={y(h[k])} r={4} fill={LINE[k]} stroke={C.paper} strokeWidth={2} />)}
          </g>
        ) : null}
        <rect x={L} y={Tp} width={W - L - R} height={H - Tp - B} fill="transparent" />
      </svg>
      {h ? (
        <div style={{ position: 'absolute', top: 6, left: `${Math.min(78, Math.max(6, (x(hover) / W) * 100))}%`, transform: 'translateX(-50%)', background: C.paper, border: `1px solid ${C.line}`, borderRadius: 8, padding: '7px 10px', fontFamily: MONO, fontSize: 11, color: C.ink, pointerEvents: 'none', boxShadow: '0 4px 14px rgba(0,0,0,.08)', whiteSpace: 'nowrap' }}>
          <div style={{ fontWeight: 700, marginBottom: 3 }}>{dayLabel(h.day)}</div>
          {['dau', 'wau', 'mau'].map((k) => (
            <div key={k} style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <span style={{ width: 9, height: 9, borderRadius: 2, background: LINE[k], display: 'inline-block' }} />
              <span style={{ color: C.faded, width: 34 }}>{k.toUpperCase()}</span>
              <b>{nf(h[k])}</b>
            </div>
          ))}
          <div style={{ color: C.faded, marginTop: 3 }}>{nf(h.newPlayers)} new · {nf(h.signups)} sign-ups</div>
        </div>
      ) : null}
    </div>
  );
}

export default function PulsePanel({ part }) {
  const d = part.data || {};
  const m = d.metrics || {};
  // Today is partial, so trends run through yesterday.
  const full = useMemo(() => (d.series || []).slice(0, -1), [d.series]);
  const col = (k) => full.map((p) => p[k] || 0);
  const built = d.builtAt ? new Date(d.builtAt).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' }) : '';
  const refs = d.referrers || [];
  // Stickiness from the rolling series: yesterday's DAU over its MAU, against
  // the same figure a week earlier.
  const stickAt = (i) => (full[i] && full[i].mau ? full[i].dau / full[i].mau : null);
  const stick = full.length > 8 ? { now: stickAt(full.length - 1), prev: stickAt(full.length - 8) } : null;

  return (
    <div>
      <style>{`
        .pl-grid{border:1px solid ${C.line};border-radius:12px;background:${C.paper};overflow:hidden}
        .pl-row,.pl-head{display:grid;grid-template-columns:minmax(170px,1.5fr) repeat(3,minmax(120px,1fr)) 150px;gap:14px;align-items:center;padding:11px 16px;border-top:1px solid ${C.grid}}
        .pl-head{border-top:none;background:${C.surface};padding:9px 16px}
        .pl-sec{padding:14px 16px 4px;font-family:${MONO};font-size:10px;letter-spacing:.16em;text-transform:uppercase;color:${C.faded};font-weight:700;border-top:1px solid ${C.line}}
        .pl-grid>.pl-sec:nth-child(2){border-top:none}
        @media(max-width:900px){.pl-row,.pl-head{grid-template-columns:minmax(120px,1.2fr) repeat(3,minmax(80px,1fr))}.pl-spark,.pl-head .pl-spark{display:none}}
      `}</style>

      <div style={{ display: 'flex', alignItems: 'baseline', gap: 12, flexWrap: 'wrap', marginBottom: 12 }}>
        <div style={{ fontFamily: MONO, fontSize: 12, letterSpacing: '0.14em', textTransform: 'uppercase', fontWeight: 700, color: C.ink }}>Pulse</div>
        <div style={{ fontFamily: SANS, fontSize: 12, color: C.faded }}>
          Rolling windows, each against the same span just before it. As of {built || 'just now'}
          {part.refreshing ? ' · refreshing…' : ''}
          {d.visitorsError ? ` · visitor figures held (${d.visitorsError})` : ''}
        </div>
        <button
          onClick={() => part.reload('force')}
          disabled={part.refreshing}
          style={{ marginLeft: 'auto', background: 'transparent', border: `1px solid ${C.line}`, color: C.ink, padding: '4px 10px', fontFamily: MONO, fontSize: 10, letterSpacing: '0.08em', textTransform: 'uppercase', cursor: part.refreshing ? 'wait' : 'pointer', opacity: part.refreshing ? 0.6 : 1, borderRadius: 6 }}
        >
          Refresh
        </button>
      </div>

      <div className="pl-grid">
        <div className="pl-head">
          <span />
          {WIN.map(([k, a, b]) => (
            <div key={k}>
              <div style={{ fontFamily: MONO, fontSize: 10, letterSpacing: '0.12em', textTransform: 'uppercase', fontWeight: 700, color: C.ink }}>{a}</div>
              <div style={{ fontFamily: SANS, fontSize: 10.5, color: C.slate }}>{b}</div>
            </div>
          ))}
          <div className="pl-spark" style={{ fontFamily: MONO, fontSize: 10, letterSpacing: '0.12em', textTransform: 'uppercase', fontWeight: 700, color: C.ink }}>90 days, daily</div>
        </div>

        <Section title="Audience">
          <MetricRow label="Active players" sub="DAU · WAU · MAU: finished at least one game" data={m.players} fmt={nf} spark={col('dau')} />
          {m.visitors ? (
            <>
              <MetricRow label="Visitors" sub="Distinct browsers on any page" data={m.visitors} fmt={nf} />
              <MetricRow label="Visitors who played" sub="Active players as a share of visitors" data={m.playerShare} fmt={fmtPct} ratio />
            </>
          ) : (
            <div className="pl-row"><div style={{ fontFamily: SANS, fontSize: 12, color: C.faded, gridColumn: '1 / -1' }}>Visitor figures unavailable right now{d.visitorsError ? ` (${d.visitorsError})` : ''}.</div></div>
          )}
        </Section>

        <Section title="Growth">
          <MetricRow label="New players" sub="First game ever finished in the window" data={m.newPlayers} fmt={nf} spark={col('newPlayers')} sparkColor="#15803d" />
          <MetricRow label="New sign-ups" sub="Accounts created" data={m.signups} fmt={nf} spark={col('signups')} sparkColor="#15803d" />
          <MetricRow label="Sign-up rate" sub="Sign-ups per new player" data={m.signupRate} fmt={fmtPct} ratio />
        </Section>

        <Section title="Engagement">
          <MetricRow label="Time played" sub="Clock time on finished games" data={m.seconds} fmt={fmtTime} spark={col('seconds')} />
          <MetricRow label="Time per active player" data={m.secondsPerPlayer} fmt={fmtShort} />
          <MetricRow label="Games finished" data={m.plays} fmt={nf} spark={col('plays')} />
          {m.pageViews ? <MetricRow label="Page views" sub="Lists, quizzes and games" data={m.pageViews} fmt={nf} /> : null}
        </Section>
      </div>

      {stick ? (
        <div style={{ fontFamily: SANS, fontSize: 12, color: C.faded, margin: '10px 2px 0' }}>
          Stickiness (DAU ÷ MAU) yesterday: <b style={{ color: C.ink }}>{fmtPct(stick.now)}</b>, against {fmtPct(stick.prev)} a week before. <Delta c={stick} ratio /> 
        </div>
      ) : null}

      <div style={{ marginTop: 34 }}>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 14, flexWrap: 'wrap', marginBottom: 8 }}>
          <div style={{ fontFamily: MONO, fontSize: 12, letterSpacing: '0.14em', textTransform: 'uppercase', fontWeight: 700, color: C.ink }}>Rolling active players</div>
          <div style={{ display: 'flex', gap: 14, fontFamily: MONO, fontSize: 11, color: C.ink }}>
            {[['dau', 'Daily'], ['wau', '7-day'], ['mau', '30-day']].map(([k, l]) => (
              <span key={k} style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                <span style={{ width: 14, height: 2, background: LINE[k], display: 'inline-block', borderRadius: 1 }} />{l}
              </span>
            ))}
          </div>
          <div style={{ fontFamily: SANS, fontSize: 11.5, color: C.faded }}>Eastern calendar days, through yesterday</div>
        </div>
        <div style={{ border: `1px solid ${C.line}`, borderRadius: 12, background: C.paper, padding: '14px 10px 8px' }}>
          <RollingChart series={full} />
        </div>
      </div>

      <div style={{ marginTop: 34 }}>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 12, flexWrap: 'wrap', marginBottom: 8 }}>
          <div style={{ fontFamily: MONO, fontSize: 12, letterSpacing: '0.14em', textTransform: 'uppercase', fontWeight: 700, color: C.ink }}>Referrers, last 7 days</div>
          <div style={{ fontFamily: SANS, fontSize: 11.5, color: C.faded }}>Distinct players who reached a game from another site. Our own pages and direct visits are left out.</div>
        </div>
        {refs.length ? (
          <div style={{ border: `1px solid ${C.line}`, borderRadius: 12, background: C.paper, overflow: 'hidden' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 110px 110px 110px', gap: 12, padding: '8px 16px', background: C.surface, fontFamily: MONO, fontSize: 10, letterSpacing: '0.12em', textTransform: 'uppercase', fontWeight: 700, color: C.ink }}>
              <span>Source</span><span style={{ textAlign: 'right' }}>Players</span><span style={{ textAlign: 'right' }}>Week before</span><span style={{ textAlign: 'right' }}>Change</span>
            </div>
            {refs.map((r) => (
              <div key={r.host} style={{ display: 'grid', gridTemplateColumns: '1fr 110px 110px 110px', gap: 12, padding: '7px 16px', borderTop: `1px solid ${C.grid}`, fontFamily: SANS, fontSize: 12.5, color: C.ink, fontVariantNumeric: 'tabular-nums' }}>
                <span>{r.host}</span>
                <span style={{ textAlign: 'right', fontWeight: 700 }}>{nf(r.now)}</span>
                <span style={{ textAlign: 'right', color: C.faded }}>{nf(r.prev)}</span>
                <span style={{ textAlign: 'right', fontFamily: MONO, fontSize: 11 }}><Delta c={r} /></span>
              </div>
            ))}
          </div>
        ) : (
          <div style={{ fontFamily: SANS, fontSize: 12, color: C.faded, fontStyle: 'italic' }}>No outside referrers recorded in the last two weeks.</div>
        )}
      </div>
    </div>
  );
}
