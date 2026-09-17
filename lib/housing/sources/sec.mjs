// Standard financials from SEC XBRL "company facts". Free, no key, but the SEC
// requires a User-Agent that names you and gives a contact (SEC_USER_AGENT).
// Company fact files are large (several MB each), so the cron runs one segment per call.
import { fetchJSON, daysBetween, round, sleep } from '../util.mjs';
import { SEC_TICKERS_URL, SEC_FACTS_URL, SEGMENTS } from '../config.mjs';

const TAGS = {
  revenue: ['Revenues', 'RevenueFromContractWithCustomerExcludingAssessedTax', 'RevenueFromContractWithCustomerIncludingAssessedTax', 'SalesRevenueNet', 'HomeBuildingRevenue'],
  cogs: ['CostOfRevenue', 'CostOfGoodsAndServicesSold', 'CostOfGoodsSold', 'CostOfGoodsAndServiceExcludingDepreciationDepletionAndAmortization', 'HomeBuildingCosts'],
  grossProfit: ['GrossProfit'],
  opIncome: ['OperatingIncomeLoss'],
  pretax: ['IncomeLossFromContinuingOperationsBeforeIncomeTaxesExtraordinaryItemsNoncontrollingInterest', 'IncomeLossFromContinuingOperationsBeforeIncomeTaxesMinorityInterestAndIncomeLossFromEquityMethodInvestments'],
  interest: ['InterestExpense', 'InterestExpenseNonoperating', 'InterestExpenseDebt'],
  da: ['DepreciationDepletionAndAmortization', 'DepreciationAmortizationAndAccretionNet', 'DepreciationAndAmortization', 'Depreciation'],
  netIncome: ['NetIncomeLoss', 'ProfitLoss'],
  debt: ['LongTermDebt', 'DebtLongtermAndShorttermCombinedAmount', 'LongTermDebtAndCapitalLeaseObligationsIncludingCurrentMaturities', 'NotesPayable', 'SeniorNotes', 'DebtInstrumentCarryingAmount', 'LongTermDebtNoncurrent'],
  cash: ['CashAndCashEquivalentsAtCarryingValue', 'CashCashEquivalentsRestrictedCashAndRestrictedCashEquivalents', 'Cash'],
  equity: ['StockholdersEquity', 'StockholdersEquityIncludingPortionAttributableToNoncontrollingInterest'],
  inventory: ['InventoryNet', 'InventoryRealEstate', 'RealEstateInventory', 'InventoryFinishedGoodsNetOfReserves', 'InventoryGross'],
};

const unitFacts = (facts, tag) => {
  const f = facts?.['us-gaap']?.[tag]?.units?.USD;
  return Array.isArray(f) ? f : [];
};

// Latest-filed value for each distinct period.
function dedupe(list, keyFn) {
  const m = new Map();
  for (const f of list) {
    const k = keyFn(f);
    const prev = m.get(k);
    if (!prev || (f.filed || '') > (prev.filed || '')) m.set(k, f);
  }
  return [...m.values()];
}

// Turn a tag's duration facts into discrete quarters: reported 3-month values
// first, then quarters derived from year-to-date differences (this is how Q4
// and cash-flow items like D&A are recovered).
export function quartersFrom(list) {
  const dur = dedupe(list.filter((f) => f.start && f.end), (f) => `${f.start}|${f.end}`);
  const q = new Map();
  for (const f of dur) {
    const d = daysBetween(f.start, f.end);
    if (d >= 80 && d <= 100) q.set(f.end, { end: f.end, val: f.val, accn: f.accn, form: f.form });
  }
  const byStart = new Map();
  for (const f of dur) {
    if (!byStart.has(f.start)) byStart.set(f.start, []);
    byStart.get(f.start).push(f);
  }
  for (const group of byStart.values()) {
    group.sort((a, b) => a.end.localeCompare(b.end));
    for (let i = 1; i < group.length; i++) {
      const a = group[i - 1];
      const b = group[i];
      const d = daysBetween(a.end, b.end);
      if (d >= 80 && d <= 100 && !q.has(b.end)) q.set(b.end, { end: b.end, val: b.val - a.val, accn: b.accn, form: b.form, derived: true });
    }
  }
  return [...q.values()].sort((a, b) => a.end.localeCompare(b.end));
}

function instantsFrom(list) {
  return dedupe(list.filter((f) => !f.start && f.end), (f) => f.end).sort((a, b) => a.end.localeCompare(b.end));
}

// Choose the candidate tag with the most recent data (companies switch tags over time).
function pick(facts, tags, kind) {
  let best = null;
  for (const t of tags) {
    const rows = kind === 'q' ? quartersFrom(unitFacts(facts, t)) : instantsFrom(unitFacts(facts, t));
    if (!rows.length) continue;
    if (!best || rows.at(-1).end > best.rows.at(-1).end) best = { tag: t, rows };
  }
  return best;
}

const at = (rows, end, tol = 20) => rows?.find((r) => Math.abs(daysBetween(r.end, end)) <= tol) ?? null;

// Sum of the four quarters ending at `end`, only if all four exist.
function ttm(rows, end) {
  if (!rows) return null;
  let total = 0;
  let cursor = end;
  for (let i = 0; i < 4; i++) {
    const r = at(rows, cursor);
    if (!r) return null;
    total += r.val;
    const d = new Date(r.end);
    d.setUTCMonth(d.getUTCMonth() - 3);
    cursor = d.toISOString().slice(0, 10);
  }
  return total;
}

const yearBefore = (end) => {
  const d = new Date(end);
  d.setUTCFullYear(d.getUTCFullYear() - 1);
  return d.toISOString().slice(0, 10);
};

const pct = (a, b) => (a === null || b === null || !b ? null : ((a / b) - 1) * 100);

export function computeMetrics(facts) {
  const rev = pick(facts, TAGS.revenue, 'q');
  if (!rev) return { error: 'no revenue facts' };
  const end = rev.rows.at(-1).end;
  const ago = yearBefore(end);
  const val = (p, e) => at(p?.rows, e)?.val ?? null;

  const cogs = pick(facts, TAGS.cogs, 'q');
  const gpTag = pick(facts, TAGS.grossProfit, 'q');
  const gp = (e) => val(gpTag, e) ?? (val(rev, e) !== null && val(cogs, e) !== null ? val(rev, e) - val(cogs, e) : null);
  const op = pick(facts, TAGS.opIncome, 'q');
  const pretax = pick(facts, TAGS.pretax, 'q');
  const interest = pick(facts, TAGS.interest, 'q');
  const da = pick(facts, TAGS.da, 'q');

  const bal = (tags) => {
    const p = pick(facts, tags, 'i');
    const r = at(p?.rows, end, 45);
    return r ? r.val : null;
  };
  const debt = bal(TAGS.debt) ?? 0;
  const cash = bal(TAGS.cash);
  const equity = bal(TAGS.equity);
  const inventory = bal(TAGS.inventory);

  const revQ = val(rev, end);
  const revTTM = ttm(rev.rows, end);
  const gmNow = gp(end) !== null && revQ ? (gp(end) / revQ) * 100 : null;
  const gmAgo = gp(ago) !== null && val(rev, ago) ? (gp(ago) / val(rev, ago)) * 100 : null;

  // Operating income: use the reported line, else pre-tax income plus interest.
  let opTTM = op ? ttm(op.rows, end) : null;
  if (opTTM === null && pretax) {
    const p = ttm(pretax.rows, end);
    opTTM = p === null ? null : p + ((interest && ttm(interest.rows, end)) || 0);
  }
  const daTTM = da ? ttm(da.rows, end) : null;
  const ebitda = opTTM !== null && daTTM !== null ? opTTM + daTTM : null;
  const cogsTTM = cogs ? ttm(cogs.rows, end) : (revTTM !== null && gpTag ? revTTM - ttm(gpTag.rows, end) : null);
  const netDebt = cash === null ? null : debt - cash;

  return {
    periodEnd: end,
    accn: rev.rows.at(-1).accn,
    form: rev.rows.at(-1).form,
    revenueQ: revQ,
    revenueTTM: revTTM,
    revenueYoY: round(pct(revQ, val(rev, ago))),
    grossMargin: round(gmNow),
    grossMarginChg: gmNow !== null && gmAgo !== null ? round(gmNow - gmAgo) : null,
    opMargin: opTTM !== null && revTTM ? round((opTTM / revTTM) * 100) : null,
    ebitdaTTM: ebitda,
    netDebt,
    netDebtToEbitda: netDebt !== null && ebitda > 0 ? round(netDebt / ebitda, 2) : null,
    netDebtToCap: netDebt !== null && equity ? round((netDebt / (netDebt + equity)) * 100) : null,
    inventoryDays: inventory !== null && cogsTTM > 0 ? round((inventory / cogsTTM) * 365, 0) : null,
    tags: { revenue: rev.tag, cogs: cogs?.tag ?? null, op: op?.tag ?? null, da: da?.tag ?? null },
  };
}

export async function fetchSec(log, segmentKeys = Object.keys(SEGMENTS)) {
  if (!process.env.SEC_USER_AGENT && !process.env.HOUSING_FIXTURE_DIR) {
    log('  sec: SKIPPED (set SEC_USER_AGENT, e.g. "Housing Watch you@example.com")');
    return { companies: {}, failed: ['sec'] };
  }
  const map = await fetchJSON(SEC_TICKERS_URL, { fixture: 'sec-tickers.json' });
  const cikOf = {};
  for (const v of Object.values(map)) cikOf[v.ticker.toUpperCase()] = String(v.cik_str).padStart(10, '0');

  const companies = {};
  const failed = [];
  for (const key of segmentKeys) {
    for (const [ticker] of SEGMENTS[key].companies) {
      const cik = cikOf[ticker];
      if (!cik) { failed.push(ticker); log(`  sec ${ticker}: no CIK`); continue; }
      try {
        const facts = await fetchJSON(SEC_FACTS_URL.replace('{cik}', cik), { fixture: `sec-CIK${cik}.json` });
        const m = computeMetrics(facts.facts);
        if (m.error) throw new Error(m.error);
        companies[ticker] = { cik, ...m };
        log(`  sec ${ticker}: ${m.periodEnd} rev y/y ${m.revenueYoY}%`);
      } catch (e) {
        failed.push(ticker);
        log(`  sec ${ticker}: FAILED (${e.message})`);
      }
      if (!process.env.HOUSING_FIXTURE_DIR) await sleep(200);
    }
  }
  return { companies, failed };
}
