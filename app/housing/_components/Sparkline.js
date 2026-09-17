export default function Sparkline({ obs, color = 'var(--ink)', height = 40 }) {
  if (!obs || obs.length < 2) return <div style={{ height }} />;
  const vals = obs.map(([, v]) => v);
  const min = Math.min(...vals);
  const max = Math.max(...vals);
  const pts = vals
    .map((v, i) => `${((i / (vals.length - 1)) * 200).toFixed(1)},${(height - 3 - ((v - min) / (max - min || 1)) * (height - 6)).toFixed(1)}`)
    .join(' ');
  return (
    <svg width="100%" height={height} viewBox={`0 0 200 ${height}`} preserveAspectRatio="none" aria-hidden="true">
      <polyline points={pts} fill="none" stroke={color} strokeWidth="2" vectorEffect="non-scaling-stroke" />
    </svg>
  );
}
