// scripts/gen-tape.mjs: builds Tape's bank (app/tape/puzzles.js) and its guess
// universe (app/tape/universe.js) from three inputs:
//
//   1. scripts/tape-boards.mjs   the hand-authored clues, one row per day
//   2. a Russell 3000 list       the iShares IWV holdings file, compacted to
//                                ticker|NAME|sectorCode|marketValue|exchange,
//                                largest first (tape-russell3000.txt)
//   3. a price file              Yahoo Finance weekly bars, split- and
//                                dividend-adjusted closes, five years to the
//                                day it was pulled (tape-prices.json):
//                                { TICKER: { ts: [unix], c: [close], name } }
//
//   node scripts/gen-tape.mjs <russell.txt> <prices.json>
//
// APPEND-ONLY: a board already in app/tape/puzzles.js whose live date is today
// or earlier is copied through untouched (the past is frozen). Only boards that
// have not gone live are (re)built.
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { BOARDS, TAPE_START } from './tape-boards.mjs';

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const [russellPath, pricesPath] = process.argv.slice(2);
if (!russellPath || !pricesPath) { console.error('usage: node scripts/gen-tape.mjs <russell.txt> <prices.json>'); process.exit(1); }

// iShares sector codes, in the order the compactor first met them.
export const SECTORS = ['Information Technology', 'Consumer Discretionary', 'Communication Services', 'Health Care', 'Financials', 'Energy', 'Consumer Staples', 'Industrials', 'Materials', 'Utilities', 'Real Estate', 'Other'];

// Display names for the answers (the iShares file shouts and abbreviates).
const NAMES = {
  NFLX: 'Netflix', NKE: 'Nike', CROX: 'Crocs', AAPL: 'Apple', CRWD: 'CrowdStrike', TGT: 'Target', AMD: 'AMD',
  SBUX: 'Starbucks', META: 'Meta Platforms', PTON: 'Peloton', COST: 'Costco', SMCI: 'Super Micro Computer', TSLA: 'Tesla',
  MCD: "McDonald's", GME: 'GameStop', ADBE: 'Adobe', CAVA: 'Cava', AMZN: 'Amazon', INTC: 'Intel', DPZ: "Domino's Pizza",
  HOOD: 'Robinhood', WMT: 'Walmart', SNOW: 'Snowflake', NVDA: 'Nvidia', LULU: 'Lululemon',
  F: 'Ford', PLTR: 'Palantir', DECK: 'Deckers Brands', GOOGL: 'Alphabet', BMBL: 'Bumble', HD: 'Home Depot', UBER: 'Uber',
  CVNA: 'Carvana', MSFT: 'Microsoft', CMG: 'Chipotle', DASH: 'DoorDash', ELF: 'e.l.f. Beauty', RDDT: 'Reddit', AVGO: 'Broadcom', RIVN: 'Rivian',
  ABNB: 'Airbnb', ORCL: 'Oracle', CRM: 'Salesforce', MSTR: 'Strategy', KSS: "Kohl's",
};

// ── the universe ─────────────────────────────────────────────────────────────
// Casing the title-caser cannot guess, for the names players type most.
const FIX = { 'Jpmorgan Chase': 'JPMorgan Chase', 'Exxonmobil Holdings': 'ExxonMobil', 'Abbvie': 'AbbVie', 'Unitedhealth Group': 'UnitedHealth Group', 'Paypal Holdings': 'PayPal', 'Mcdonalds': "McDonald's", 'Ebay': 'eBay', 'Doordash': 'DoorDash', 'Servicenow': 'ServiceNow', 'Blackrock': 'BlackRock', 'Fedex': 'FedEx', 'Hubspot': 'HubSpot', 'Paycom Software': 'Paycom', 'Draftkings': 'DraftKings', 'Gamestop': 'GameStop', 'Crowdstrike Holdings': 'CrowdStrike', 'Applied Material': 'Applied Materials', 'Berkshire Hathaway': 'Berkshire Hathaway' };
const KEEP_UP = new Set(['AT&T', 'IBM', 'AMD', 'UPS', 'HP', 'AES', 'AIG', 'ADT', 'EOG', 'PNC', 'US', 'USA', 'AI', 'MSCI', 'CME', 'ICE', 'UWM', 'KLA', 'DTE', 'HCA', 'IQVIA', 'CSX', 'CVS', 'NRG', 'PPG', 'PPL', 'RTX', 'TJX', 'WEC', 'GE', 'GM', 'MGM', 'NXP', 'ON', 'SBA', 'AMC', 'BJS', 'RH', 'EPAM', 'MKS', 'TKO', 'EQT', 'CF', 'NI', 'LKQ', 'CBRE', 'EMCOR', 'II', 'III', 'IV', 'BXP', 'DR', 'SPX', 'TPG', 'KKR', 'FMC', 'HF', 'NOV', 'DXC', 'AGCO', 'ESAB', 'SEI', 'MDU', 'ODP', 'NCR', 'NVR', 'UFP', 'WD', 'CRH', 'APA', 'CNX', 'BRT', 'LXP', 'NNN', 'CTO', 'PJT', 'TTM', 'SM', 'PBF', 'HNI', 'MSA', 'EVI', 'ACM', 'TD', 'ESCO', 'LL', 'ACV']);
const SMALL = new Set(['OF', 'AND', 'THE', 'FOR', 'IN', 'ON', 'AT', 'TO', 'BY', 'DE']);
const DROP = /\s+(INC|CORP|CORPORATION|CO|COMPANY|LTD|LIMITED|PLC|LLC|LP|L P|SA|NV|N V|AG|SE|REIT|CLASS [A-Z]|CL [A-Z]|ORD|ADR|SHS|COMMON|STOCK|COM|THE|REIT INC|HLDGS|GROUP INC)\.?$/;
function cleanName(raw) {
  let n = String(raw || '').replace(/\s+/g, ' ').trim();
  for (let i = 0; i < 4; i++) { const m = n.replace(DROP, '').replace(/\s*&$/, ''); if (m === n) break; n = m; }
  return n.split(' ').map((w, i) => {
    if (KEEP_UP.has(w)) return w;
    if (i > 0 && SMALL.has(w)) return w.toLowerCase();
    if (/^[A-Z]{2,3}$/.test(w) && !/[AEIOUY]/.test(w)) return w;
    return w.toLowerCase().replace(/(^|[-./&'(])([a-z])/g, (m, a, b) => a + b.toUpperCase());
  }).join(' ');
}

const ruRows = fs.readFileSync(russellPath, 'utf8').split('\n').map((l) => l.trim()).filter(Boolean).map((l) => l.split('|'));
const UNIV = [];
const seen = new Set();
for (const [raw, nm, sec, mv] of ruRows) {
  // A share class prints with a space in the iShares file (BRK B): show it as BRK.B.
  const t = String(raw || '').trim().replace(/ ([A-Z])$/, '.$1');
  if (!t || !/^[A-Z][A-Z0-9.]{0,6}$/.test(t) || seen.has(t)) continue;
  seen.add(t);
  const cn = cleanName(nm);
  UNIV.push({ t, n: NAMES[t] || FIX[cn] || cn, sec: Number(sec), mv: Number(mv) || 0 });
}
UNIV.sort((a, b) => b.mv - a.mv);
const RANK = new Map(UNIV.map((u, i) => [u.t, i + 1]));
const BY_T = new Map(UNIV.map((u) => [u.t, u]));

// ── the bank ─────────────────────────────────────────────────────────────────
const PRICES = JSON.parse(fs.readFileSync(pricesPath, 'utf8'));
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const FULL = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const iso = (sec) => new Date(sec * 1000).toISOString().slice(0, 10);
function addDays(d, n) { const x = new Date(d + 'T12:00:00Z'); x.setUTCDate(x.getUTCDate() + n); return x.toISOString().slice(0, 10); }

const bankPath = path.join(ROOT, 'app/tape/puzzles.js');
let frozen = [];
const today = new Date().toLocaleDateString('en-CA', { timeZone: 'America/New_York' });
if (fs.existsSync(bankPath)) {
  const { PUZZLES } = await import(bankPath + '?t=' + Date.now());
  frozen = PUZZLES.filter((p) => p.live <= today);
}
const frozenNums = new Set(frozen.map((p) => p.num));

const out = [];
BOARDS.forEach((b, i) => {
  const num = i + 1;
  if (frozenNums.has(num)) { out.push(frozen.find((p) => p.num === num)); return; }
  const live = addDays(TAPE_START, i);
  const [y, m, d] = live.split('-').map(Number);
  const sunday = new Date(live + 'T12:00:00Z').getUTCDay() === 0;
  const u = BY_T.get(b.t);
  if (!u) throw new Error(`${b.t}: not in the Russell 3000 list`);
  const px = PRICES[b.t];
  if (!px) throw new Error(`${b.t}: no prices`);
  const pairs = px.ts.map((s, k) => [s, px.c[k]]).filter(([, c]) => c != null && c > 0);
  const closes = pairs.map(([, c]) => c);
  const lo = Math.min(...closes), hi = Math.max(...closes);
  const w = closes.map((c) => Math.round(((c - lo) / (hi - lo)) * 1000));
  const dates = pairs.map(([s]) => iso(s));
  // The pin sits on the trading week nearest the event.
  const pt = new Date(b.pin[0] + 'T12:00:00Z').getTime();
  let pi = 0, best = Infinity;
  dates.forEach((dt, k) => { const dd = Math.abs(new Date(dt + 'T12:00:00Z').getTime() - pt); if (dd < best) { best = dd; pi = k; } });
  const [py, pm] = b.pin[0].split('-').map(Number);
  out.push({
    num, quizId: `tape-${m}-${d}-${String(y).slice(2)}`, live, dateLabel: `${FULL[m - 1]} ${d}, ${y}`, sunday,
    ticker: b.t, name: NAMES[b.t] || u.n, accept: [b.t, ...(b.also || [])], alt: b.alt || [],
    sector: SECTORS[u.sec], ipo: b.ipo, hq: b.hq, does: b.does,
    pin: { i: pi, date: b.pin[0], label: `${MONTHS[pm - 1]} ${py}`, text: b.pin[1] },
    from: dates[0], to: dates[dates.length - 1], lo: Math.round(lo * 100) / 100, hi: Math.round(hi * 100) / 100,
    rank: RANK.get(b.t), w,
  });
});

const head = `// Puzzle data for Tape, the daily name-the-company-from-its-chart game.
// Imported ONLY by the server page (app/tape/page.js), which filters
// live<=today before handing puzzles to the client, so future answers never
// reach a browser.
//
// One company a day from the Russell 3000. The board is its last five years of
// weekly closes (split- and dividend-adjusted, Yahoo Finance), drawn with no
// price axis, and six clues that open one at a time:
//   1 sector (free)  2 year it went public  3 headquarters
//   4 a dated headline, pinned on the chart  5 what it does  6 first letter of the ticker
// A wrong guess opens the next clue; a wrong guess with all six open ends the
// day. Fewer clues rank higher, then the clock.
//
// Fields: w is the weekly series scaled 0 to 1000 between lo and hi (dollars,
// adjusted); from/to are the first and last weekly dates; pin.i is the index
// into w nearest pin.date; rank is the answer's place by market value in the
// Russell 3000 list the bank was built from. accept lists every ticker that is
// the answer (a second share class), alt the other names a player may type.
// Weekday answers are large, well-known companies (rank 1 to 700); the Sunday
// Edition is a smaller company from deeper in the index (rank 300 or below).
//
// Do NOT hand-edit. Regenerate with scripts/gen-tape.mjs (append-only) and
// re-run scripts/verify-tape.mjs.
export const PUZZLES = [
${out.map((p) => '  ' + JSON.stringify(p)).join(',\n')},
];
`;
fs.mkdirSync(path.dirname(bankPath), { recursive: true });
fs.writeFileSync(bankPath, head);

const uHead = `// Tape's guess universe: every common stock in the Russell 3000 (the iShares
// IWV holdings file), largest first, as [ticker, name]. A player may guess any
// of them. Built by scripts/gen-tape.mjs; do not hand-edit.
export const UNIVERSE = [
${UNIV.map((u) => '  ' + JSON.stringify([u.t, u.n])).join(',\n')},
];
`;
fs.writeFileSync(path.join(ROOT, 'app/tape/universe.js'), uHead);
console.log(`gen-tape: ${out.length} boards (${frozen.length} frozen), universe ${UNIV.length}`);
for (const p of out) console.log(`  #${p.num} ${p.live}${p.sunday ? ' SUN' : '    '} ${p.ticker.padEnd(5)} rank ${String(p.rank).padStart(4)} pts ${p.w.length} pin ${p.pin.i} ${p.pin.label}`);
