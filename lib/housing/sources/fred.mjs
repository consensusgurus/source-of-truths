import { fetchText, parseDelimited, num, monthsAgoISO, sleep } from '../util.mjs';
import { FRED_SERIES, HISTORY_MONTHS } from '../config.mjs';

const url = (id) => `https://fred.stlouisfed.org/graph/fredgraph.csv?id=${encodeURIComponent(id)}`;

// FRED CSV: header "observation_date,<ID>" (older files used "DATE"). Missing values are "." or blank.
export function parseFredCsv(text) {
  const rows = parseDelimited(text);
  if (!rows.length || rows[0].length < 2) throw new Error('unexpected FRED CSV');
  const head = rows[0].map((h) => h.trim().toLowerCase());
  if (!/date/.test(head[0])) throw new Error('FRED CSV has no date column');
  const out = [];
  for (const r of rows.slice(1)) {
    const d = (r[0] || '').trim();
    const v = num(r[1]);
    if (/^\d{4}-\d{2}-\d{2}$/.test(d) && v !== null) out.push([d, v]);
  }
  if (!out.length) throw new Error('FRED CSV had no observations');
  return out;
}

// Weekly series (mortgage rate) are kept weekly but trimmed to the same window.
export async function fetchFred(log) {
  const since = monthsAgoISO(HISTORY_MONTHS);
  const series = {};
  const failed = [];
  for (const [key, meta] of Object.entries(FRED_SERIES)) {
    try {
      const text = await fetchText(url(meta.id), { fixture: `fred-${meta.id}.csv` });
      const obs = parseFredCsv(text).filter(([d]) => d >= since);
      series[key] = { ...meta, obs };
      log(`  fred ${meta.id}: ${obs.length} obs, last ${obs.at(-1)?.[0]}`);
    } catch (e) {
      failed.push(key);
      log(`  fred ${meta.id}: FAILED (${e.message})`);
    }
    if (!process.env.HOUSING_FIXTURE_DIR) await sleep(250);
  }
  return { series, failed };
}
