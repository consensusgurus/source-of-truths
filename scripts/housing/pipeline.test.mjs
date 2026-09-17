// Housing Watch: unit tests for the data pipeline (lib/housing). Synthetic inputs only.
// Run: node --test scripts/housing/  (or node scripts/verify-housing.mjs)
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import zlib from 'node:zlib';
import { parseFredCsv } from '../../lib/housing/sources/fred.mjs';
import { parseZillowWide, parseRedfinNational } from '../../lib/housing/sources/listings.mjs';
import { quartersFrom, computeMetrics } from '../../lib/housing/sources/sec.mjs';
import { readTeamKpis, latestKpis, marketShare, calendarQuarter, KPI_COLUMNS } from '../../lib/housing/sources/team.mjs';
import { parseBpsCbsa } from '../../lib/housing/sources/metros.mjs';
import { parseDelimited } from '../../lib/housing/util.mjs';

test('csv parser handles quotes, commas and CRLF', () => {
  const rows = parseDelimited('a,b\r\n"x, y","he said ""hi"""\r\n');
  assert.deepEqual(rows, [['a', 'b'], ['x, y', 'he said "hi"']]);
});

test('FRED csv: both header styles, skips missing values', () => {
  assert.deepEqual(parseFredCsv('observation_date,HOUST\n2026-01-01,1300\n2026-02-01,.\n2026-03-01,1350.5\n'), [
    ['2026-01-01', 1300], ['2026-03-01', 1350.5],
  ]);
  assert.equal(parseFredCsv('DATE,X\n2020-01-01,5\n').length, 1);
  assert.throws(() => parseFredCsv('<html>error</html>'));
});

test('Zillow wide file: picks the United States row', () => {
  const csv = 'RegionID,SizeRank,RegionName,RegionType,StateName,2025-01-31,2025-02-28\n1,0,United States,country,,1900,1910\n2,1,"New York, NY",msa,NY,3000,3010\n';
  const obs = parseZillowWide(csv);
  assert.equal(obs.length, 2);
  assert.deepEqual(obs[1], ['2025-02-28', 1910]);
});

test('Redfin tracker: monthly, not seasonally adjusted, all residential', () => {
  const tsv = [
    'PERIOD_BEGIN\tPERIOD_END\tPERIOD_DURATION\tPROPERTY_TYPE\tIS_SEASONALLY_ADJUSTED\tMEDIAN_SALE_PRICE\tMEDIAN_DOM\tAVG_SALE_TO_LIST',
    '2026-01-01\t2026-01-31\t30\tAll Residential\tfalse\t400000\t50\t0.985',
    '2026-01-01\t2026-01-31\t30\tAll Residential\ttrue\t410000\t48\t0.99',
    '2026-01-01\t2026-01-31\t30\tCondo/Co-op\tfalse\t300000\t60\t0.97',
    '2026-01-01\t2026-03-31\t90\tAll Residential\tfalse\t1\t1\t1',
  ].join('\n');
  const r = parseRedfinNational(tsv);
  assert.deepEqual(r.redfinDom.obs, [['2026-01-01', 50]]);
  assert.equal(r.redfinSaleToList.obs[0][1], 98.5);
});

// --- SEC -------------------------------------------------------------------
const q = (start, end, val, extra = {}) => ({ start, end, val, filed: '2026-01-01', accn: '0000000000-26-000001', form: '10-Q', ...extra });
const inst = (end, val) => ({ end, val, filed: '2026-01-01' });

function synthFacts() {
  // Calendar fiscal year. 3-month values for Q1-Q3, YTD values, and the annual total.
  const rev = [
    q('2024-01-01', '2024-03-31', 100), q('2024-04-01', '2024-06-30', 110), q('2024-07-01', '2024-09-30', 120),
    q('2024-01-01', '2024-06-30', 210), q('2024-01-01', '2024-09-30', 330), q('2024-01-01', '2024-12-31', 460, { form: '10-K' }),
    q('2025-01-01', '2025-03-31', 105), q('2025-04-01', '2025-06-30', 115), q('2025-07-01', '2025-09-30', 132),
    q('2025-01-01', '2025-06-30', 220), q('2025-01-01', '2025-09-30', 352),
  ];
  const cogs = rev.map((f) => ({ ...f, val: f.val * 0.7 }));
  const op = rev.map((f) => ({ ...f, val: f.val * 0.1 }));
  // D&A only as YTD (cash flow statement style)
  const da = [
    q('2024-01-01', '2024-03-31', 5), q('2024-01-01', '2024-06-30', 10), q('2024-01-01', '2024-09-30', 15), q('2024-01-01', '2024-12-31', 20),
    q('2025-01-01', '2025-03-31', 5), q('2025-01-01', '2025-06-30', 10), q('2025-01-01', '2025-09-30', 15),
  ];
  return {
    'us-gaap': {
      Revenues: { units: { USD: rev } },
      CostOfRevenue: { units: { USD: cogs } },
      OperatingIncomeLoss: { units: { USD: op } },
      DepreciationDepletionAndAmortization: { units: { USD: da } },
      LongTermDebt: { units: { USD: [inst('2025-09-30', 100)] } },
      CashAndCashEquivalentsAtCarryingValue: { units: { USD: [inst('2025-09-30', 40)] } },
      StockholdersEquity: { units: { USD: [inst('2025-09-30', 240)] } },
      InventoryNet: { units: { USD: [inst('2025-09-30', 60)] } },
    },
  };
}

test('SEC quarters: Q4 derived from annual minus nine months', () => {
  const qs = quartersFrom(synthFacts()['us-gaap'].Revenues.units.USD);
  const q4 = qs.find((x) => x.end === '2024-12-31');
  assert.equal(q4.val, 130);
  assert.equal(q4.derived, true);
  assert.equal(qs.at(-1).end, '2025-09-30');
});

test('SEC metrics: y/y, margins, leverage, inventory days', () => {
  const m = computeMetrics(synthFacts());
  assert.equal(m.periodEnd, '2025-09-30');
  assert.equal(m.revenueYoY, 10); // 132 vs 120
  assert.equal(m.grossMargin, 30);
  assert.equal(m.grossMarginChg, 0);
  // TTM revenue = 130 + 105 + 115 + 132 = 482; op = 48.2; D&A TTM = 5 + 5 + 5 + 5 = 20
  assert.equal(m.revenueTTM, 482);
  assert.equal(m.opMargin, 10);
  assert.equal(m.netDebt, 60);
  assert.equal(m.netDebtToEbitda, Number((60 / 68.2).toFixed(2)));
  assert.equal(m.netDebtToCap, 20); // 60 / (60 + 240)
  assert.equal(m.inventoryDays, Math.round((60 / (482 * 0.7)) * 365));
});

test('SEC metrics: missing revenue is reported, not thrown', () => {
  assert.equal(computeMetrics({ 'us-gaap': {} }).error, 'no revenue facts');
});

// --- Team KPIs and market share ----------------------------------------------
function writeKpis(rows) {
  const lines = [KPI_COLUMNS.join(',')];
  for (const r of rows) lines.push(KPI_COLUMNS.map((c) => r[c] ?? '').join(','));
  return `\n${lines.join('\n')}\n`;
}

const QEND = ['2024-12-31', '2025-03-31', '2025-06-30', '2025-09-30', '2025-12-31'];

function builderRows() {
  const rows = [];
  // Seven builders, calendar quarters, closings 1000 * (rank) per quarter
  for (let b = 1; b <= 7; b++) {
    QEND.forEach((end, i) => rows.push({ ticker: `B${b}`, fiscal_period: `Q${i}`, period_end: end, net_orders: 100 * b + i * 10, closings: 1000 * b, cancellation_rate_pct: 12 }));
  }
  // One builder with a November fiscal year end, only three quarters (should not be shared)
  ['2025-05-31', '2025-08-31', '2025-11-30'].forEach((end) => rows.push({ ticker: 'NOV', period_end: end, closings: 999 }));
  return rows;
}

test('team KPI file: columns validated and y/y computed', () => {
  const rows = readTeamKpis(writeKpis(builderRows()));
  const latest = latestKpis(rows);
  assert.equal(latest.B1.periodEnd, '2025-12-31');
  assert.equal(latest.B1.ordersYoY, Number((((140 / 100) - 1) * 100).toFixed(1)));
  assert.throws(() => readTeamKpis('ticker,period_end\nX,2025-01-01\n'), /missing columns/);
  assert.deepEqual(readTeamKpis('\n' + KPI_COLUMNS.join(',') + '\n'), []);
});

test('calendar quarter mapping for off-calendar fiscal years', () => {
  assert.equal(calendarQuarter('2025-11-30'), '2025-Q4');
  assert.equal(calendarQuarter('2025-10-31'), '2025-Q3');
  assert.equal(calendarQuarter('2025-09-30'), '2025-Q3');
  assert.equal(calendarQuarter('2025-12-31'), '2025-Q4');
});

test('national market share over trailing twelve months', () => {
  const rows = readTeamKpis(writeKpis(builderRows()));
  // 60K new home sales per month -> 720,000 per year
  const sales = [];
  for (let m = 0; m < 36; m++) sales.push([new Date(Date.UTC(2023, m, 1)).toISOString().slice(0, 10), 60]);
  const s = marketShare(rows, sales, { B7: 'Builder Seven' });
  assert.equal(s.asOf, '2025-Q4');
  assert.equal(s.denominator, 720000);
  assert.equal(s.builders.length, 7);
  assert.equal(s.builders[0].ticker, 'B7');
  assert.equal(s.builders[0].name, 'Builder Seven');
  assert.equal(s.builders[0].closingsTTM, 28000);
  assert.equal(s.builders[0].share, Number(((28000 / 720000) * 100).toFixed(1)));
  const top5 = (4 * 1000 * (7 + 6 + 5 + 4 + 3)) / 720000 * 100;
  assert.equal(s.trend.at(-1).top5, Number(top5.toFixed(1)));
  assert.equal(s.trend.at(-1).top10, null);
});

test('market share returns null without inputs', () => {
  assert.equal(marketShare([], [], {}), null);
});

// --- Census BPS ---------------------------------------------------------------
test('Census BPS metro file parses and validates layout', () => {
  const lines = [
    'Survey,CSA,CBSA,HHEADER,CBSA,1-unit,,,2-units,,,3-4 units,,,5 units or more,,,1-unit rep,,,',
    'Date,,,,Name,Bldgs,Units,Value,Bldgs,Units,Value,Bldgs,Units,Value,Bldgs,Units,Value,Bldgs,Units,Value',
    '',
  ];
  for (let i = 0; i < 60; i++) {
    lines.push(`202607,999,${10000 + i},2,"Metro ${i}, ST",${i},${i * 10},1,2,4,1,1,3,1,5,${i},1,${i},${i * 10},1`);
  }
  const rows = parseBpsCbsa(lines.join('\n'));
  assert.equal(rows.length, 60);
  assert.deepEqual(rows[5], { cbsa: '10005', name: 'Metro 5, ST', sf: 50, total: 50 + 4 + 3 + 5 * 1 });
  assert.throws(() => parseBpsCbsa('nothing,here\n'), /layout not recognized/);
});

test('gzip fixture is transparently decompressed', async () => {
  const { fetchText } = await import('../../lib/housing/util.mjs');
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'hw-'));
  fs.writeFileSync(path.join(dir, 'x.gz'), zlib.gzipSync('hello'));
  process.env.HOUSING_FIXTURE_DIR = dir;
  try {
    assert.equal(await fetchText('http://unused', { fixture: 'x.gz' }), 'hello');
  } finally {
    delete process.env.HOUSING_FIXTURE_DIR;
  }
});

// --- Pipeline parts ----------------------------------------------------------
test('runPart keeps previous values when a source fails, and records status', async () => {
  const { runPart } = await import('../../lib/housing/pipeline.mjs');
  const { FRED_SERIES } = await import('../../lib/housing/config.mjs');
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'hw-'));
  // Only the starts series has a fixture; everything else "fails".
  fs.writeFileSync(path.join(dir, 'fred-HOUST.csv'), 'observation_date,HOUST\n2026-07-01,1300\n2026-08-01,1310\n');
  const files = new Map([['series.json', { updatedAt: 'old', series: { permits: { id: 'PERMIT', obs: [['2026-08-01', 1400]] } } }]]);
  const store = { get: async (n) => files.get(n) ?? null, put: async (n, o) => { files.set(n, o); } };
  process.env.HOUSING_FIXTURE_DIR = dir;
  try {
    const r = await runPart('macro', store, { now: new Date('2026-09-17T13:30:00Z') });
    assert.equal(r.ok, true);
    assert.equal(r.refreshed, 1);
    assert.ok(r.failed.includes('permits'));
    const doc = files.get('series.json');
    assert.deepEqual(doc.series.permits.obs, [['2026-08-01', 1400]]); // kept
    assert.deepEqual(doc.series.starts.obs.at(-1), ['2026-08-01', 1310]); // refreshed
    assert.equal(doc.series.starts.id, FRED_SERIES.starts.id);
    assert.equal(files.get('status.json').macro.refreshed, 1);

    const m = await runPart('metros', store, { now: new Date('2026-09-17T13:30:00Z') });
    assert.equal(m.ok, false);
    assert.equal(files.has('metros.json'), false);
    assert.ok(files.get('status.json').metros.failed.length);
    await assert.rejects(() => runPart('nope', store), /unknown part/);
  } finally {
    delete process.env.HOUSING_FIXTURE_DIR;
  }
});
