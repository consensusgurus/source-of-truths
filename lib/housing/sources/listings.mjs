// Direct downloads that are not on FRED: Zillow rents (ZORI) and Redfin's national tracker.
import { fetchText, parseDelimited, parseTable, num, monthsAgoISO } from '../util.mjs';
import { ZILLOW_ZORI_URL, REDFIN_NATIONAL_URL, HISTORY_MONTHS } from '../config.mjs';

// Zillow research CSVs are wide: one row per region, one column per month.
export function parseZillowWide(text, regionName = 'United States') {
  const rows = parseDelimited(text);
  const head = rows[0].map((h) => h.trim());
  const nameIdx = head.findIndex((h) => h === 'RegionName');
  if (nameIdx < 0) throw new Error('Zillow CSV has no RegionName column');
  const row = rows.find((r) => (r[nameIdx] || '').trim() === regionName);
  if (!row) throw new Error(`Zillow CSV has no "${regionName}" row`);
  const since = monthsAgoISO(HISTORY_MONTHS);
  const obs = [];
  head.forEach((h, i) => {
    if (/^\d{4}-\d{2}-\d{2}$/.test(h) && h >= since) {
      const v = num(row[i]);
      if (v !== null) obs.push([h, v]);
    }
  });
  if (!obs.length) throw new Error('Zillow row had no values');
  return obs;
}

// Redfin market tracker (TSV). Column names have changed case over time, so match loosely.
export function parseRedfinNational(text) {
  const table = parseTable(text, '\t');
  if (!table.length) throw new Error('Redfin file empty');
  const keys = Object.keys(table[0]);
  const col = (name) => {
    const k = keys.find((x) => x.toLowerCase() === name);
    if (!k) throw new Error(`Redfin file missing ${name}`);
    return k;
  };
  const c = {
    begin: col('period_begin'), end: col('period_end'), dur: col('period_duration'),
    ptype: col('property_type'), sa: col('is_seasonally_adjusted'),
    dom: col('median_dom'), stl: col('avg_sale_to_list'), price: col('median_sale_price'),
  };
  const since = monthsAgoISO(HISTORY_MONTHS);
  const rows = table
    .filter((r) => /all residential/i.test(r[c.ptype]) && /^f/i.test(r[c.sa]) && Number(r[c.dur]) >= 28 && Number(r[c.dur]) <= 31)
    .map((r) => ({ d: r[c.begin].slice(0, 10), dom: num(r[c.dom]), stl: num(r[c.stl]), price: num(r[c.price]) }))
    .filter((r) => r.d >= since)
    .sort((a, b) => a.d.localeCompare(b.d));
  if (!rows.length) throw new Error('Redfin file had no monthly all-residential rows');
  // Sale-to-list is stored as a ratio (1.01) in the file; show it as a percent.
  return {
    redfinDom: { label: 'Median days on market', unit: 'days', source: 'Redfin', obs: rows.filter((r) => r.dom !== null).map((r) => [r.d, r.dom]) },
    redfinSaleToList: { label: 'Sale-to-list ratio', unit: 'percent', source: 'Redfin', obs: rows.filter((r) => r.stl !== null).map((r) => [r.d, r.stl < 5 ? r.stl * 100 : r.stl]) },
    redfinMedianPrice: { label: 'Median sale price', unit: 'dollars', source: 'Redfin', obs: rows.filter((r) => r.price !== null).map((r) => [r.d, r.price]) },
  };
}

export async function fetchListings(log) {
  const series = {};
  const failed = [];
  try {
    const obs = parseZillowWide(await fetchText(ZILLOW_ZORI_URL, { fixture: 'zillow-zori.csv' }));
    series.zori = { label: 'Observed rent index', unit: 'dollars per month', source: 'Zillow ZORI', obs };
    log(`  zillow zori: ${obs.length} obs, last ${obs.at(-1)[0]}`);
  } catch (e) {
    failed.push('zori');
    log(`  zillow zori: FAILED (${e.message})`);
  }
  try {
    const r = parseRedfinNational(await fetchText(REDFIN_NATIONAL_URL, { fixture: 'redfin-national.tsv' }));
    Object.assign(series, r);
    log(`  redfin: ${r.redfinDom.obs.length} obs, last ${r.redfinDom.obs.at(-1)?.[0]}`);
  } catch (e) {
    failed.push('redfinDom', 'redfinSaleToList', 'redfinMedianPrice');
    log(`  redfin: FAILED (${e.message})`);
  }
  return { series, failed };
}
