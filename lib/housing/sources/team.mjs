// Builder KPIs maintained by the Housing Watch team (from their own models).
// The rows live in lib/housing/builder-kpis.mjs, one per company per fiscal quarter.
import { parseTable, num, daysBetween, round } from '../util.mjs';

export const KPI_COLUMNS = [
  'ticker', 'fiscal_period', 'period_end', 'net_orders', 'cancellation_rate_pct', 'closings',
  'avg_price_k', 'backlog_units', 'backlog_value_musd', 'homebuilding_gm_pct', 'lots_owned_pct', 'active_communities',
];

export function readTeamKpis(csvText) {
  if (!csvText || !csvText.trim()) return [];
  const rows = parseTable(csvText.trim());
  const missing = KPI_COLUMNS.filter((c) => rows.length && !(c in rows[0]));
  if (missing.length) throw new Error(`builder KPI table is missing columns: ${missing.join(', ')}`);
  return rows
    .filter((r) => r.ticker && /^\d{4}-\d{2}-\d{2}$/.test(r.period_end))
    .map((r) => ({
      ticker: r.ticker.toUpperCase(),
      fiscalPeriod: r.fiscal_period,
      periodEnd: r.period_end,
      netOrders: num(r.net_orders),
      cancelRate: num(r.cancellation_rate_pct),
      closings: num(r.closings),
      avgPriceK: num(r.avg_price_k),
      backlogUnits: num(r.backlog_units),
      backlogValue: num(r.backlog_value_musd),
      hbGrossMargin: num(r.homebuilding_gm_pct),
      lotsOwnedPct: num(r.lots_owned_pct),
      communities: num(r.active_communities),
    }))
    .sort((a, b) => a.periodEnd.localeCompare(b.periodEnd));
}

// Latest quarter per builder, with y/y changes against the quarter a year earlier.
export function latestKpis(rows) {
  const out = {};
  const byTicker = groupBy(rows, (r) => r.ticker);
  for (const [t, list] of Object.entries(byTicker)) {
    const cur = list.at(-1);
    const prior = list.find((r) => Math.abs(daysBetween(r.periodEnd, cur.periodEnd) - 365) <= 20);
    const yoy = (k) => (prior && cur[k] !== null && prior[k] ? round((cur[k] / prior[k] - 1) * 100) : null);
    out[t] = { ...cur, ordersYoY: yoy('netOrders'), closingsYoY: yoy('closings'), priceYoY: yoy('avgPriceK') };
  }
  return out;
}

export function groupBy(list, fn) {
  const m = {};
  for (const x of list) (m[fn(x)] ||= []).push(x);
  return m;
}

// Calendar quarter a fiscal quarter mostly falls in (fiscal ends in Oct/Nov map to Q4).
export function calendarQuarter(dateStr) {
  const d = new Date(dateStr);
  d.setUTCDate(d.getUTCDate() - 45); // midpoint of the fiscal quarter
  return `${d.getUTCFullYear()}-Q${Math.floor(d.getUTCMonth() / 3) + 1}`;
}

const quarterEndMonth = (cq) => {
  const [y, q] = cq.split('-Q').map(Number);
  return `${y}-${String(q * 3).padStart(2, '0')}`;
};

const prevQuarters = (cq, n) => {
  let [y, q] = cq.split('-Q').map(Number);
  const out = [];
  for (let i = 0; i < n; i++) {
    out.push(`${y}-Q${q}`);
    q -= 1;
    if (q === 0) { q = 4; y -= 1; }
  }
  return out;
};

// National share: trailing-four-quarter closings over trailing-twelve-month
// Census new home sales (not seasonally adjusted, thousands per month).
export function marketShare(rows, newSalesNSA, names) {
  if (!rows.length || !newSalesNSA?.length) return null;
  const monthly = new Map(newSalesNSA.map(([d, v]) => [d.slice(0, 7), v * 1000]));
  const denomFor = (cq) => {
    const [y, m] = quarterEndMonth(cq).split('-').map(Number);
    let total = 0;
    for (let i = 0; i < 12; i++) {
      const d = new Date(Date.UTC(y, m - 1 - i, 1)).toISOString().slice(0, 7);
      if (!monthly.has(d)) return null;
      total += monthly.get(d);
    }
    return total;
  };
  const byT = groupBy(rows.filter((r) => r.closings !== null), (r) => r.ticker);
  const cqMap = {};
  for (const [t, list] of Object.entries(byT)) {
    cqMap[t] = new Map(list.map((r) => [calendarQuarter(r.periodEnd), r.closings]));
  }
  const allQ = [...new Set(Object.values(cqMap).flatMap((m) => [...m.keys()]))].sort();
  const ttmFor = (t, cq) => {
    const qs = prevQuarters(cq, 4);
    if (!qs.every((q) => cqMap[t].has(q))) return null;
    return qs.reduce((s, q) => s + cqMap[t].get(q), 0);
  };

  const trend = [];
  for (const cq of allQ) {
    const denom = denomFor(cq);
    if (!denom) continue;
    const vals = Object.keys(cqMap).map((t) => ttmFor(t, cq)).filter((v) => v !== null).sort((a, b) => b - a);
    if (vals.length < 5) continue;
    const s = (n) => round((vals.slice(0, n).reduce((a, b) => a + b, 0) / denom) * 100);
    trend.push({ quarter: cq, top5: s(5), top10: vals.length >= 10 ? s(10) : null, builders: vals.length, publicTotal: s(vals.length) });
  }

  // Latest quarter where the denominator exists and most builders have reported.
  let latest = null;
  for (const cq of [...allQ].reverse()) {
    const denom = denomFor(cq);
    if (!denom) continue;
    const reported = Object.keys(cqMap).filter((t) => ttmFor(t, cq) !== null);
    if (reported.length >= Math.min(5, Object.keys(cqMap).length)) { latest = { cq, denom, reported }; break; }
  }
  if (!latest) return { asOf: null, denominator: null, builders: [], trend };
  const builders = latest.reported
    .map((t) => {
      const c = ttmFor(t, latest.cq);
      return { ticker: t, name: names[t] || t, closingsTTM: c, share: round((c / latest.denom) * 100) };
    })
    .sort((a, b) => b.closingsTTM - a.closingsTTM);
  return { asOf: latest.cq, denominator: latest.denom, builders, trend };
}
