// Server-only readers for the /housing pages.
import { housingStore } from './store';
import { BUILDER_KPIS_CSV } from './builder-kpis.mjs';
import { readTeamKpis, latestKpis, marketShare } from './sources/team.mjs';
import { SEGMENTS } from './config.mjs';

async function safeGet(name, fallback) {
  try {
    return (await housingStore.get(name)) ?? fallback;
  } catch {
    return fallback;
  }
}

export const getSeries = () => safeGet('series.json', { updatedAt: null, series: {} });
export const getCompanies = () => safeGet('companies.json', { updatedAt: null, companies: {} });
export const getMetros = () => safeGet('metros.json', { updatedAt: null, through: null, metros: [] });

const NAMES = Object.fromEntries(Object.values(SEGMENTS).flatMap((s) => s.companies));

// Team KPIs are read from the repo; market share also needs Census sales from storage.
export async function getTeam(series) {
  let rows = [];
  let error = null;
  try {
    rows = readTeamKpis(BUILDER_KPIS_CSV);
  } catch (e) {
    error = e.message;
  }
  const s = series ?? (await getSeries()).series;
  return {
    rowCount: rows.length,
    error,
    latest: latestKpis(rows),
    share: marketShare(rows, s?.newSalesNSA?.obs, NAMES),
  };
}

// Latest observation plus changes. y/y uses the observation closest to one year earlier.
export function summarize(s) {
  if (!s?.obs?.length) return null;
  const obs = s.obs;
  const [date, value] = obs.at(-1);
  const prev = obs.at(-2)?.[1] ?? null;
  const target = new Date(date);
  target.setUTCFullYear(target.getUTCFullYear() - 1);
  let yearAgo = null;
  let best = Infinity;
  for (const [d, v] of obs) {
    const gap = Math.abs(new Date(d) - target);
    if (gap < best) { best = gap; yearAgo = v; }
  }
  if (best > 20 * 86_400_000) yearAgo = null;
  const ch = (a, b) => (a === null || b === null || b === 0 ? null : (a / b - 1) * 100);
  return { date, value, mom: ch(value, prev), yoy: ch(value, yearAgo), obs, label: s.label, unit: s.unit, source: s.source, id: s.id };
}

export const tail = (obs, months) => {
  if (!obs?.length) return [];
  const cut = new Date(obs.at(-1)[0]);
  cut.setUTCMonth(cut.getUTCMonth() - months);
  const c = cut.toISOString().slice(0, 10);
  return obs.filter(([d]) => d >= c);
};
