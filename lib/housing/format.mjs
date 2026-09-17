const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export const isNum = (v) => typeof v === 'number' && Number.isFinite(v);

export function fmtMonth(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  return `${MONTHS[d.getUTCMonth()]} ${d.getUTCFullYear()}`;
}

export function fmtDate(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  return `${MONTHS[d.getUTCMonth()]} ${d.getUTCDate()}, ${d.getUTCFullYear()}`;
}

export function fmtPct(v, digits = 1, signed = true) {
  if (!isNum(v)) return 'n/a';
  const s = v.toFixed(digits);
  return `${signed && v > 0 ? '+' : ''}${s}%`;
}

export function fmtNum(v, digits = 0) {
  if (!isNum(v)) return 'n/a';
  return v.toLocaleString('en-US', { minimumFractionDigits: digits, maximumFractionDigits: digits });
}

// Thousands of units (FRED housing series) -> "1.36M" or "676K"
export function fmtThousands(v) {
  if (!isNum(v)) return 'n/a';
  return v >= 1000 ? `${(v / 1000).toFixed(2)}M` : `${Math.round(v)}K`;
}

// Raw counts -> "4.06M", "1.1M", "845K"
export function fmtCount(v) {
  if (!isNum(v)) return 'n/a';
  if (Math.abs(v) >= 1e6) return `${(v / 1e6).toFixed(2)}M`;
  if (Math.abs(v) >= 1e4) return `${Math.round(v / 1e3)}K`;
  return fmtNum(v);
}

export function fmtDollars(v) {
  if (!isNum(v)) return 'n/a';
  if (Math.abs(v) >= 1e6) return `$${(v / 1e6).toFixed(2)}M`;
  if (Math.abs(v) >= 1e4) return `$${Math.round(v / 1e3)}K`;
  return `$${fmtNum(v)}`;
}

export function fmtMetric(v, unit) {
  if (!isNum(v)) return 'n/a';
  if (unit === '%') return `${v.toFixed(1)}%`;
  if (unit === 'pp') return `${v > 0 ? '+' : ''}${v.toFixed(1)}pp`;
  if (unit === 'x') return `${v.toFixed(1)}x`;
  if (unit === 'd') return `${Math.round(v)}`;
  return fmtNum(v, 1);
}

export function score(value, check) {
  if (!isNum(value)) return 'none';
  const { good, pass, fail } = check;
  if (good === 'high') return value >= pass ? 'pass' : value <= fail ? 'fail' : 'watch';
  return value <= pass ? 'pass' : value >= fail ? 'fail' : 'watch';
}

export function describeCheck(c) {
  const u = c.unit === '%' ? '%' : c.unit === 'pp' ? 'pp' : c.unit === 'x' ? 'x' : c.unit === 'd' ? ' days' : '';
  return c.good === 'high'
    ? `Pass at ${c.pass}${u} or better, fail at ${c.fail}${u} or worse`
    : `Pass at ${c.pass}${u} or lower, fail at ${c.fail}${u} or higher`;
}
