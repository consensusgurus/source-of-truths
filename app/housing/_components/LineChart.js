'use client';
import { useMemo, useRef, useState } from 'react';

const W = 640;
const PAD = { t: 12, r: 12, b: 26, l: 48 };

function niceTicks(min, max, count = 4) {
  if (min === max) { min -= 1; max += 1; }
  const raw = (max - min) / count;
  const mag = 10 ** Math.floor(Math.log10(raw));
  const step = [1, 2, 2.5, 5, 10].map((m) => m * mag).find((s) => s >= raw);
  const lo = Math.floor(min / step) * step;
  const hi = Math.ceil(max / step) * step;
  const ticks = [];
  for (let v = lo; v <= hi + step / 2; v += step) ticks.push(Number(v.toFixed(10)));
  return ticks;
}

const t = (d) => new Date(d).getTime();

// Named formats (functions cannot be passed from server to client components).
const FORMATS = {
  thousands: (v) => `${Math.round(v).toLocaleString('en-US')}K`,
  dollarsK: (v) => `$${Math.round(v / 1000)}K`,
  pct1: (v) => `${v.toFixed(1)}%`,
  pct0: (v) => `${Math.round(v)}%`,
  number: (v) => v.toLocaleString('en-US'),
};

/**
 * series: [{ name, color, obs: [[isoDate, value]], dash? }]
 * format: one of the FORMATS keys
 */
export default function LineChart({ series, height = 260, format = 'number', area = false, label }) {
  const H = height;
  const fmt = FORMATS[format] ?? FORMATS.number;
  const ref = useRef(null);
  const [hover, setHover] = useState(null);

  const g = useMemo(() => {
    const all = series.flatMap((s) => s.obs);
    if (!all.length) return null;
    const x0 = Math.min(...all.map(([d]) => t(d)));
    const x1 = Math.max(...all.map(([d]) => t(d)));
    const vals = all.map(([, v]) => v);
    const ticks = niceTicks(Math.min(...vals), Math.max(...vals));
    const y0 = ticks[0];
    const y1 = ticks.at(-1);
    const sx = (d) => PAD.l + ((t(d) - x0) / (x1 - x0 || 1)) * (W - PAD.l - PAD.r);
    const sy = (v) => PAD.t + (1 - (v - y0) / (y1 - y0 || 1)) * (H - PAD.t - PAD.b);
    const years = [];
    const ya = new Date(x0).getUTCFullYear();
    const yb = new Date(x1).getUTCFullYear();
    const every = Math.max(1, Math.ceil((yb - ya + 1) / 6));
    for (let y = ya + 1; y <= yb; y += every) years.push(y);
    return { x0, x1, ticks, sx, sy, years };
  }, [series, H]);

  if (!g) return <div className="empty">No data yet.</div>;

  const onMove = (e) => {
    const box = ref.current.getBoundingClientRect();
    const px = ((e.clientX - box.left) / box.width) * W;
    const target = g.x0 + ((px - PAD.l) / (W - PAD.l - PAD.r)) * (g.x1 - g.x0);
    const base = series[0].obs;
    let best = null;
    for (const o of base) if (!best || Math.abs(t(o[0]) - target) < Math.abs(t(best[0]) - target)) best = o;
    setHover(best?.[0] ?? null);
  };

  const valueAt = (s, d) => {
    let best = null;
    for (const o of s.obs) if (!best || Math.abs(t(o[0]) - t(d)) < Math.abs(t(best[0]) - t(d))) best = o;
    return best && Math.abs(t(best[0]) - t(d)) < 20 * 86_400_000 ? best[1] : null;
  };

  return (
    <div className="chart" style={{ position: 'relative' }}>
      <svg
        ref={ref}
        viewBox={`0 0 ${W} ${H}`}
        role="img"
        aria-label={label}
        onMouseMove={onMove}
        onMouseLeave={() => setHover(null)}
      >
        {g.ticks.map((v) => (
          <g key={v}>
            <line x1={PAD.l} x2={W - PAD.r} y1={g.sy(v)} y2={g.sy(v)} stroke="var(--line-soft)" />
            <text x={PAD.l - 8} y={g.sy(v) + 4} textAnchor="end">{fmt(v)}</text>
          </g>
        ))}
        {g.years.map((y) => {
          const d = `${y}-01-01`;
          if (t(d) < g.x0 || t(d) > g.x1) return null;
          return <text key={y} x={g.sx(d)} y={H - 6} textAnchor="middle">{y}</text>;
        })}
        {area && series[0] && (
          <path
            d={`M${g.sx(series[0].obs[0][0])},${g.sy(g.ticks[0])} ${series[0].obs.map(([d, v]) => `L${g.sx(d)},${g.sy(v)}`).join(' ')} L${g.sx(series[0].obs.at(-1)[0])},${g.sy(g.ticks[0])}Z`}
            fill="var(--accent-wash)"
          />
        )}
        {series.map((s) => (
          <polyline
            key={s.name}
            points={s.obs.map(([d, v]) => `${g.sx(d).toFixed(1)},${g.sy(v).toFixed(1)}`).join(' ')}
            fill="none"
            stroke={s.color}
            strokeWidth="2.2"
            strokeDasharray={s.dash ? '5 4' : undefined}
            strokeLinejoin="round"
          />
        ))}
        {hover && <line x1={g.sx(hover)} x2={g.sx(hover)} y1={PAD.t} y2={H - PAD.b} stroke="var(--ink)" strokeOpacity="0.25" />}
      </svg>
      {hover && (
        <div
          style={{
            position: 'absolute', top: 0, left: `${(g.sx(hover) / W) * 100}%`, transform: g.sx(hover) > W / 2 ? 'translateX(calc(-100% - 10px))' : 'translateX(10px)',
            background: 'var(--ink)', color: '#fff', borderRadius: 8, padding: '8px 10px', fontSize: 12, pointerEvents: 'none', whiteSpace: 'nowrap',
          }}
        >
          <div className="mono" style={{ opacity: 0.7, marginBottom: 4 }}>{hover.slice(0, 7)}</div>
          {series.map((s) => {
            const v = valueAt(s, hover);
            return (
              <div key={s.name} style={{ display: 'flex', gap: 10, justifyContent: 'space-between' }}>
                <span><i style={{ display: 'inline-block', width: 8, height: 8, borderRadius: 2, background: s.color, marginRight: 6 }} />{s.name}</span>
                <b className="mono" style={{ fontWeight: 500 }}>{v === null ? 'n/a' : fmt(v)}</b>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export function Legend({ items }) {
  return (
    <div className="legend">
      {items.map((s) => (
        <span key={s.name}>
          <i style={{ background: s.color }} />
          {s.name}
        </span>
      ))}
    </div>
  );
}
