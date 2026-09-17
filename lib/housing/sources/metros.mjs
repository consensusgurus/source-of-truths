// Census Building Permits Survey, metro (CBSA) year-to-date files.
// Layout (comma separated, two header lines):
//   Survey Date, CSA, CBSA, HHEADER (2 = metropolitan, 5 = micropolitan), CBSA Name,
//   1-unit (Bldgs, Units, Value), 2-units (...), 3-4 units (...), 5+ units (...), then "rep" repeats.
// Best effort: if the layout does not validate, the metro table is left out.
import { fetchText, parseDelimited, num } from '../util.mjs';
import { CENSUS_BPS_CBSA_URL, METRO_LIMIT } from '../config.mjs';

// Census writes names as 'Dallas-Fort Worth-Arlington  TX ' (two spaces before the state).
export function cleanName(raw) {
  const s = String(raw || '').trim();
  const m = s.match(/^(.*?)\s{2,}([A-Z]{2}(?:-[A-Z]{2})*)$/);
  return m ? `${m[1].trim()}, ${m[2]}` : s.replace(/\s+/g, ' ');
}

export function parseBpsCbsa(text) {
  const rows = parseDelimited(text);
  const data = rows.filter((r) => /^\d{6}$/.test((r[0] || '').trim()) && /^\d{5}$/.test((r[2] || '').trim()) && (r[3] || '').trim() === '2');
  if (data.length < 50) throw new Error(`BPS file layout not recognized (${data.length} metro rows)`);
  return data.map((r) => {
    const units1 = num(r[6]);
    const units2 = num(r[9]) ?? 0;
    const units34 = num(r[12]) ?? 0;
    const units5 = num(r[15]) ?? 0;
    if (units1 === null) throw new Error('BPS row missing 1-unit units');
    return {
      cbsa: r[2].trim(),
      name: cleanName(r[4]),
      sf: units1,
      total: units1 + units2 + units34 + units5,
    };
  });
}

const yymm = (d) => `${String(d.getUTCFullYear()).slice(2)}${String(d.getUTCMonth() + 1).padStart(2, '0')}`;

export async function fetchMetros(log, now = new Date()) {
  // Find the newest year-to-date file (Census posts about 4 to 7 weeks after month end).
  for (let back = 1; back <= 4; back++) {
    const d = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - back, 1));
    const key = yymm(d);
    let cur;
    try {
      cur = parseBpsCbsa(await fetchText(CENSUS_BPS_CBSA_URL.replace('{yymm}', key), { fixture: `bps-${key}.txt`, retries: 1 }));
    } catch (e) {
      log(`  census bps ${key}: ${e.message}`);
      continue;
    }
    const prevD = new Date(Date.UTC(d.getUTCFullYear() - 1, d.getUTCMonth(), 1));
    let prev = [];
    try {
      prev = parseBpsCbsa(await fetchText(CENSUS_BPS_CBSA_URL.replace('{yymm}', yymm(prevD)), { fixture: `bps-${yymm(prevD)}.txt`, retries: 1 }));
    } catch (e) {
      log(`  census bps ${yymm(prevD)} (prior year): ${e.message}`);
    }
    const prevMap = new Map(prev.map((p) => [p.cbsa, p]));
    const metros = cur
      .sort((a, b) => b.sf - a.sf)
      .slice(0, METRO_LIMIT)
      .map((m) => {
        const p = prevMap.get(m.cbsa);
        return { ...m, sfYoY: p && p.sf ? Math.round((m.sf / p.sf - 1) * 1000) / 10 : null };
      });
    const through = d.toISOString().slice(0, 7);
    log(`  census bps: ${metros.length} metros, YTD through ${through}`);
    return { through, metros };
  }
  throw new Error('no Census BPS metro file found in the last 4 months');
}
