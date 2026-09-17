// Single source of truth for what the site tracks.
// Edit this file to add a company, a series or change a health-check threshold.

// ---------------------------------------------------------------------------
// Macro series. Every entry is pulled from FRED's public CSV endpoint
// (no API key needed). `source` is the original publisher, shown on the site.
// ---------------------------------------------------------------------------
export const FRED_SERIES = {
  // Census, New Residential Construction (thousands of units, SAAR)
  permits: { id: 'PERMIT', label: 'Building permits', unit: 'SAAR, thousands', source: 'Census NRC' },
  starts: { id: 'HOUST', label: 'Housing starts', unit: 'SAAR, thousands', source: 'Census NRC' },
  underConstruction: { id: 'UNDCONTSA', label: 'Under construction', unit: 'SA, thousands', source: 'Census NRC' },
  completions: { id: 'COMPUTSA', label: 'Completions', unit: 'SAAR, thousands', source: 'Census NRC' },
  permits1: { id: 'PERMIT1', label: 'Permits, 1-unit', unit: 'SAAR, thousands', source: 'Census NRC' },
  starts1: { id: 'HOUST1F', label: 'Starts, 1-unit', unit: 'SAAR, thousands', source: 'Census NRC' },
  completions1: { id: 'COMPU1USA', label: 'Completions, 1-unit', unit: 'SAAR, thousands', source: 'Census NRC' },

  // Census, New Residential Sales
  newSales: { id: 'HSN1F', label: 'New home sales', unit: 'SAAR, thousands', source: 'Census NRS' },
  newSalesNSA: { id: 'HSN1FNSA', label: 'New home sales, NSA', unit: 'thousands per month', source: 'Census NRS' },
  monthsSupply: { id: 'MSACSR', label: "Months' supply, new", unit: 'months', source: 'Census NRS' },
  medianNewPrice: { id: 'MSPNHSUS', label: 'Median new home price', unit: 'dollars', source: 'Census NRS' },

  // Regions
  permitsNE: { id: 'PERMITNE', label: 'Permits, Northeast', unit: 'SAAR, thousands', source: 'Census NRC' },
  permitsMW: { id: 'PERMITMW', label: 'Permits, Midwest', unit: 'SAAR, thousands', source: 'Census NRC' },
  permitsS: { id: 'PERMITS', label: 'Permits, South', unit: 'SAAR, thousands', source: 'Census NRC' },
  permitsW: { id: 'PERMITW', label: 'Permits, West', unit: 'SAAR, thousands', source: 'Census NRC' },
  startsNE: { id: 'HOUSTNE', label: 'Starts, Northeast', unit: 'SAAR, thousands', source: 'Census NRC' },
  startsMW: { id: 'HOUSTMW', label: 'Starts, Midwest', unit: 'SAAR, thousands', source: 'Census NRC' },
  startsS: { id: 'HOUSTS', label: 'Starts, South', unit: 'SAAR, thousands', source: 'Census NRC' },
  startsW: { id: 'HOUSTW', label: 'Starts, West', unit: 'SAAR, thousands', source: 'Census NRC' },
  newSalesNE: { id: 'HSN1FNE', label: 'New sales, Northeast', unit: 'SAAR, thousands', source: 'Census NRS' },
  newSalesMW: { id: 'HSN1FMW', label: 'New sales, Midwest', unit: 'SAAR, thousands', source: 'Census NRS' },
  newSalesS: { id: 'HSN1FS', label: 'New sales, South', unit: 'SAAR, thousands', source: 'Census NRS' },
  newSalesW: { id: 'HSN1FW', label: 'New sales, West', unit: 'SAAR, thousands', source: 'Census NRS' },

  // NAR existing home sales (FRED only carries about the last 13 months)
  existingSales: { id: 'EXHOSLUSM495S', label: 'Existing home sales', unit: 'SAAR, units', source: 'NAR' },
  existingInventory: { id: 'HOSINVUSM495N', label: 'Existing inventory', unit: 'units', source: 'NAR' },

  // Market pulse
  mortgage30: { id: 'MORTGAGE30US', label: '30-year fixed rate', unit: 'percent', source: 'Freddie Mac PMMS' },
  caseShiller: { id: 'CSUSHPISA', label: 'National home prices', unit: 'index, SA', source: 'S&P Cotality Case-Shiller' },
  activeListings: { id: 'ACTLISCOUUS', label: 'Active listings', unit: 'listings', source: 'Realtor.com' },
  priceReduced: { id: 'PRIREDCOUUS', label: 'Listings with price cuts', unit: 'listings', source: 'Realtor.com' },
  medianDaysRealtor: { id: 'MEDDAYONMARUS', label: 'Median days on market', unit: 'days', source: 'Realtor.com' },
  zhvi: { id: 'USAUCSFRCONDOSMSAMID', label: 'Home values', unit: 'dollars', source: 'Zillow ZHVI' },
};

// How far back to keep each series (months). Keeps data files small.
export const HISTORY_MONTHS = 180;

// ---------------------------------------------------------------------------
// Direct-download sources (not on FRED)
// ---------------------------------------------------------------------------
export const ZILLOW_ZORI_URL =
  'https://files.zillowstatic.com/research/public_csvs/zori/Metro_zori_uc_sfrcondomfr_sm_month.csv';
export const REDFIN_NATIONAL_URL =
  'https://redfin-public-data.s3.us-west-2.amazonaws.com/redfin_market_tracker/us_national_market_tracker.tsv000.gz';
// Census Building Permits Survey, metro (CBSA) files. {yymm} is filled in.
export const CENSUS_BPS_CBSA_URL = 'https://www2.census.gov/econ/bps/CBSA/cbsa{yymm}y.txt';
export const SEC_TICKERS_URL = 'https://www.sec.gov/files/company_tickers.json';
export const SEC_FACTS_URL = 'https://data.sec.gov/api/xbrl/companyfacts/CIK{cik}.json';

// ---------------------------------------------------------------------------
// Companies
// ---------------------------------------------------------------------------
export const SEGMENTS = {
  builders: {
    label: 'Homebuilders',
    companies: [
      ['DHI', 'D.R. Horton'], ['LEN', 'Lennar'], ['PHM', 'PulteGroup'], ['NVR', 'NVR'],
      ['TOL', 'Toll Brothers'], ['KBH', 'KB Home'], ['MTH', 'Meritage Homes'], ['TMHC', 'Taylor Morrison'],
      ['CCS', 'Century Communities'], ['DFH', 'Dream Finders Homes'], ['TPH', 'Tri Pointe Homes'], ['MHO', 'M/I Homes'],
    ],
  },
  distributors: {
    label: 'Distributors & installers',
    companies: [
      ['BLDR', 'Builders FirstSource'], ['SITE', 'SiteOne Landscape'], ['WSO', 'Watsco'], ['BCC', 'Boise Cascade'],
      ['UFPI', 'UFP Industries'], ['BLD', 'TopBuild'], ['IBP', 'Installed Building Products'], ['POOL', 'Pool Corp'],
    ],
  },
  products: {
    label: 'Building products',
    companies: [
      ['MAS', 'Masco'], ['FBIN', 'Fortune Brands Innovations'], ['OC', 'Owens Corning'], ['TREX', 'Trex'],
      ['JHX', 'James Hardie'], ['MHK', 'Mohawk Industries'], ['CARR', 'Carrier Global'], ['LII', 'Lennox International'],
      ['LPX', 'Louisiana-Pacific'], ['CSL', 'Carlisle Companies'], ['MBC', 'MasterBrand'], ['WY', 'Weyerhaeuser'],
      ['TT', 'Trane Technologies'],
    ],
  },
};

// ---------------------------------------------------------------------------
// Health checks. Each check reads one metric and scores it.
//   from: 'sec'    -> computed from SEC XBRL filings by the pipeline
//         'team'   -> read from data/manual/builder-kpis.csv (your team's models)
//   good: 'high' means higher is better, 'low' means lower is better
//   pass / fail: thresholds. Between them is "watch".
// ---------------------------------------------------------------------------
export const HEALTH_CHECKS = {
  builders: [
    { key: 'ordersYoY', label: 'Orders y/y', unit: '%', from: 'team', good: 'high', pass: 0, fail: -10 },
    { key: 'cancelRate', label: 'Can. rate', unit: '%', from: 'team', good: 'low', pass: 12, fail: 18 },
    { key: 'hbGrossMargin', label: 'HB gross margin', unit: '%', from: 'team', good: 'high', pass: 22, fail: 18 },
    { key: 'revenueYoY', label: 'Revenue y/y', unit: '%', from: 'sec', good: 'high', pass: 0, fail: -10 },
    { key: 'netDebtToCap', label: 'Net debt/cap', unit: '%', from: 'sec', good: 'low', pass: 20, fail: 40 },
    { key: 'lotsOwnedPct', label: 'Lots owned', unit: '%', from: 'team', good: 'low', pass: 40, fail: 60 },
  ],
  distributors: [
    { key: 'revenueYoY', label: 'Sales y/y', unit: '%', from: 'sec', good: 'high', pass: 0, fail: -8 },
    { key: 'grossMargin', label: 'Gross margin', unit: '%', from: 'sec', good: 'high', pass: 25, fail: 20 },
    { key: 'grossMarginChg', label: 'GM chg y/y', unit: 'pp', from: 'sec', good: 'high', pass: 0, fail: -1.5 },
    { key: 'opMargin', label: 'Op. margin', unit: '%', from: 'sec', good: 'high', pass: 8, fail: 4 },
    { key: 'netDebtToEbitda', label: 'Net debt/EBITDA', unit: 'x', from: 'sec', good: 'low', pass: 2, fail: 3.5 },
    { key: 'inventoryDays', label: 'Inventory days', unit: 'd', from: 'sec', good: 'low', pass: 60, fail: 90 },
  ],
  products: [
    { key: 'revenueYoY', label: 'Sales y/y', unit: '%', from: 'sec', good: 'high', pass: 0, fail: -8 },
    { key: 'grossMargin', label: 'Gross margin', unit: '%', from: 'sec', good: 'high', pass: 30, fail: 22 },
    { key: 'grossMarginChg', label: 'GM chg y/y', unit: 'pp', from: 'sec', good: 'high', pass: 0, fail: -1.5 },
    { key: 'opMargin', label: 'Op. margin', unit: '%', from: 'sec', good: 'high', pass: 12, fail: 7 },
    { key: 'netDebtToEbitda', label: 'Net debt/EBITDA', unit: 'x', from: 'sec', good: 'low', pass: 2, fail: 3.5 },
    { key: 'inventoryDays', label: 'Inventory days', unit: 'd', from: 'sec', good: 'low', pass: 70, fail: 110 },
  ],
};

// What goes into a new home, and which public names make or move it.
export const PRODUCT_MAP = [
  { cat: 'Framing lumber & trusses', stage: 'Structure', names: ['BLDR', 'UFPI', 'BCC', 'WY', 'LPX'] },
  { cat: 'Roofing', stage: 'Envelope', names: ['OC', 'CSL', 'BLDR'] },
  { cat: 'Insulation', stage: 'Envelope', names: ['OC', 'BLD', 'IBP'] },
  { cat: 'Siding & trim', stage: 'Envelope', names: ['JHX', 'LPX'] },
  { cat: 'HVAC', stage: 'Mechanicals', names: ['CARR', 'LII', 'TT', 'WSO'] },
  { cat: 'Plumbing & faucets', stage: 'Mechanicals', names: ['MAS', 'FBIN'] },
  { cat: 'Cabinets & flooring', stage: 'Interior finish', names: ['MBC', 'MHK'] },
  { cat: 'Decking & outdoor', stage: 'Exterior finish', names: ['TREX', 'JHX', 'SITE', 'POOL'] },
];

export const METRO_LIMIT = 25;
