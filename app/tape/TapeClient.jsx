'use client';

// Tape: name the company from its stock chart. One company a day from the
// Russell 3000; the board is its last five years of weekly closes with no price
// axis, and six clues that open one at a time (sector free, then the year it
// went public, its size (a market value band in the Russell 3000), a dated headline pinned on the chart, what it does
// and the first letter of the ticker). A wrong guess opens the next clue, and a
// wrong guess with all six open ends the day. Fewer clues rank higher, then the
// clock. Runs on the shared stage shell (app/SimpleDaily.jsx).

import React, { useMemo, useState } from 'react';
import SimpleDaily from '../SimpleDaily';
import { UNIVERSE } from './universe';

const MAX = 6;
const LABELS = ['Sector', 'Went public', 'Size', 'Headline at pin 4', 'What it does', 'Ticker starts with'];

function fold(s) { return String(s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/&/g, ' and ').replace(/[^a-z0-9]+/g, ' ').trim(); }
const LIST = UNIVERSE.map(([t, n]) => ({ t, n, ft: t.toLowerCase(), fn: fold(n) }));
const BY_T = new Map(UNIVERSE.map(([t, n]) => [t, n]));

// The type-ahead: names that start with the text come first, then a ticker
// typed exactly, tickers that start with it, names with a word that starts with
// it, and names holding every typed word as a word prefix. Largest first within
// a tier (the list is stored largest first). Typed in CAPITALS, the text is read
// as a ticker first ("NET" is Cloudflare, "Net" is Netflix).
function matches(query, skip, extra) {
  const qf = fold(query);
  if (!qf) return [];
  const qt = String(query).trim().toLowerCase().replace(/\s+/g, '');
  const qw = qf.split(' ');
  const caps = /^[A-Z.]{1,6}$/.test(String(query).trim());
  const tiers = [[], [], [], [], [], []];
  for (const it of LIST) {
    if (skip.has(it.t)) continue;
    const forms = [it.fn, ...(extra.get(it.t) || [])];
    let tier = 9;
    const exact = it.ft === qt.replace(/\./g, '.');
    if (exact && caps) tier = 0;
    else if (forms.some((f) => f.startsWith(qf))) tier = 1;
    else if (exact) tier = 2;
    else if (it.ft.startsWith(qt)) tier = 3;
    else if (forms.some((f) => f.split(' ').some((w) => w.startsWith(qf)))) tier = 4;
    else if (forms.some((f) => { const w = f.split(' '); return qw.every((x) => w.some((y) => y.startsWith(x))); })) tier = 5;
    if (tier < 9) tiers[tier].push(it);
  }
  return tiers.flat().slice(0, 6);
}

// Clue 3 is size, never headquarters (owner, 2026-11-06): a state or city was
// either useless (20 of the first 45 are in California) or a giveaway
// (Arkansas is Walmart). The band comes from the answer's rank by market value
// in the Russell 3000 list the bank was built from.
function sizeBand(rank) {
  if (rank <= 50) return 'One of the 50 biggest US companies';
  if (rank <= 200) return 'Ranked 51 to 200 by market value';
  if (rank <= 500) return 'Ranked 201 to 500 by market value';
  return 'Smaller than the top 500';
}

function clueValue(P, k) {
  if (k === 0) return P.sector;
  if (k === 1) return String(P.ipo);
  if (k === 2) return sizeBand(P.rank);
  if (k === 3) return `${P.pin.label}: ${P.pin.text}`;
  if (k === 4) return P.does;
  return P.ticker[0];
}

const MON = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
function monthYear(iso) { const [y, m] = iso.split('-').map(Number); return `${MON[m - 1]} ${y}`; }

function money(v) {
  if (v >= 100) return `$${Math.round(v).toLocaleString('en-US')}`;
  if (v >= 10) return `$${v.toFixed(0)}`;
  return `$${v.toFixed(2)}`;
}

// THE CHART. A fixed 600x300 drawing scaled to the column. No price axis until
// the day is over; the pin's spot shows from the start and its headline opens
// as clue 4.
function Chart({ P, done, open }) {
  const W = 600, H = 300, L = done ? 74 : 0, R = 8, T = 14, B = 34;
  const n = P.w.length;
  const x = (i) => L + (i / Math.max(1, n - 1)) * (W - L - R);
  const y = (v) => T + (1 - v / 1000) * (H - T - B);
  const line = P.w.map((v, i) => `${i ? 'L' : 'M'}${x(i).toFixed(1)},${y(v).toFixed(1)}`).join(' ');
  const area = `${line} L${x(n - 1).toFixed(1)},${H - B} L${x(0).toFixed(1)},${H - B} Z`;
  const pinOpen = done || open >= 4;
  const px = x(P.pin.i), pv = P.w[P.pin.i];
  // The pin floats above or below the line, whichever side has room.
  const py = pv > 780 ? y(pv) + 22 : y(pv) - 22;
  const val = (f) => P.lo + f * (P.hi - P.lo);
  const fromY = P.from.slice(0, 4), toY = P.to.slice(0, 4);
  const grid = [0.25, 0.5, 0.75, 1];
  // Year ticks: January 1 of each year between the first and last week.
  const t0 = Date.parse(P.from + 'T12:00:00Z'), t1 = Date.parse(P.to + 'T12:00:00Z');
  const years = [];
  for (let yr = Number(fromY) + 1; yr <= Number(toY); yr++) {
    const f = (Date.parse(`${yr}-01-01T12:00:00Z`) - t0) / (t1 - t0);
    if (f > 0.02 && f < 0.97) years.push({ yr, xi: L + f * (W - L - R) });
  }
  return (
    <svg className="tp-chart" viewBox={`0 0 ${W} ${H}`} role="img"
      aria-label={done
        ? `${P.name} weekly closes from ${fromY} to ${toY}, between ${money(P.lo)} and ${money(P.hi)}`
        : 'An unlabeled five-year weekly stock chart'}>
      {grid.map((f) => <line key={f} x1={L} x2={W - R} y1={y(f * 1000)} y2={y(f * 1000)} className="tp-grid" />)}
      <line x1={L} x2={W - R} y1={H - B} y2={H - B} className="tp-base" />
      <path d={area} className="tp-area" />
      <path d={line} className="tp-line" />
      <line x1={px} x2={px} y1={y(pv)} y2={py + (py > y(pv) ? -11 : 11)} className="tp-stem" />
      <circle cx={px} cy={y(pv)} r="4" className="tp-dot" />
      <circle cx={px} cy={py} r="12" className={'tp-pin' + (pinOpen ? ' on' : '')} />
      <text x={px} y={py + 4.5} textAnchor="middle" className={'tp-pint' + (pinOpen ? ' on' : '')}>4</text>
      {done && grid.map((f) => (
        <text key={'v' + f} x={L - 8} y={y(f * 1000) + 4} textAnchor="end" className="tp-ax">{money(val(f))}</text>
      ))}
      {done && <text x={L - 8} y={H - B + 4} textAnchor="end" className="tp-ax">{money(P.lo)}</text>}
      {/* Date axis, always shown: a tick and the year at each January 1 inside the chart. */}
      {years.map(({ yr, xi }) => (
        <g key={yr}>
          <line x1={xi} x2={xi} y1={H - B} y2={H - B + 6} className="tp-base" />
          <text x={Math.min(Math.max(xi, 24), W - 24)} y={H - 6} textAnchor="middle" className="tp-ax">{yr}</text>
        </g>
      ))}
    </svg>
  );
}

const CSS = `
.tp{display:flex;flex-direction:column;gap:12px;width:100%;}
.tp-q{margin:0;text-align:center;font-size:clamp(20px,5.8vw,24px);font-weight:800;letter-spacing:-.02em;}
.tp-box{border:1px solid var(--pst-ink,#0b0f1a);border-radius:16px;background:var(--pst-cell,#f1f4f8);padding:10px 10px 6px;}
.tp-chart{display:block;width:100%;height:auto;}
.tp-grid{stroke:var(--pst-cell-line,#c9d2dc);stroke-width:1;}
.tp-base{stroke:var(--pst-ink,#0b0f1a);stroke-width:1;}
.tp-area{fill:var(--pst-acc,#7dd3fc);fill-opacity:.55;}
.tp-line{fill:none;stroke:var(--pst-ink,#0b0f1a);stroke-width:2.4;stroke-linejoin:round;stroke-linecap:round;}
.tp-stem{stroke:var(--pst-ink,#0b0f1a);stroke-width:1;}
.tp-dot{fill:var(--pst-ink,#0b0f1a);}
.tp-pin{fill:var(--pst-bg,#fff);stroke:var(--pst-ink,#0b0f1a);stroke-width:1;}
.tp-pin.on{fill:var(--pst-ink,#0b0f1a);}
.tp-pint{font-family:'Manrope',system-ui,sans-serif;font-size:13px;font-weight:800;fill:var(--pst-ink,#0b0f1a);}
.tp-pint.on{fill:var(--pst-bg,#fff);}
.tp-ax{font-family:'Manrope',system-ui,sans-serif;font-size:19px;font-weight:700;fill:var(--pst-mute,#3b4656);}
.tp-cap{display:flex;justify-content:space-between;gap:8px;padding:4px 2px 0;font-size:12px;font-weight:700;color:var(--pst-mute,#3b4656);}
.tp-ans{display:flex;justify-content:space-between;align-items:baseline;gap:10px;padding:2px 4px 6px;}
.tp-ans b{font-size:20px;font-weight:800;}
.tp-ans span{font-size:14px;font-weight:800;}
.tp-cl{list-style:none;margin:0;padding:0;border:1px solid var(--pst-ink,#0b0f1a);border-radius:14px;overflow:hidden;}
.tp-cl li{display:grid;grid-template-columns:24px 1fr;gap:10px;align-items:center;min-height:42px;padding:7px 12px;border-top:1px solid var(--pst-ink,#0b0f1a);}
.tp-cl li:first-child{border-top:0;}
.tp-cl li.off{background:var(--pst-cell,#f1f4f8);}
.tp-n{width:24px;height:24px;border-radius:12px;display:flex;align-items:center;justify-content:center;font-size:12px;font-weight:800;box-sizing:border-box;}
.tp-cl li.op .tp-n{background:var(--pst-acc,#7dd3fc);color:var(--pst-on-acc,#0b0f1a);}
.tp-cl li.off .tp-n{border:1px solid var(--pst-mute,#3b4656);color:var(--pst-mute,#3b4656);}
.tp-t{font-size:14px;line-height:1.35;}
.tp-t i{font-style:normal;font-weight:600;color:var(--pst-mute,#3b4656);margin-right:6px;}
.tp-t b{font-weight:800;}
.tp-cl li.off .tp-t{font-weight:700;color:var(--pst-mute,#3b4656);}
.tp-miss{display:flex;flex-wrap:wrap;align-items:center;gap:6px;font-size:13px;font-weight:800;}
.tp-miss s{border:1px solid var(--pst-ink,#0b0f1a);border-radius:999px;padding:4px 10px;font-weight:700;}
.tp-tools{display:flex;flex-direction:column;gap:8px;}
.tp .pst-sug,.tp-tools .pst-sug{border-radius:0;}
.tp-tools .pst-sug button{display:flex;justify-content:space-between;align-items:center;gap:10px;}
.tp-tools .pst-sug button small{font-size:13px;font-weight:800;opacity:.8;flex:none;}
`;

function Board({ P, s, done }) {
  const open = done ? MAX : s.open;
  const misses = s.misses || [];
  return (
    <div className="tp">
      <style dangerouslySetInnerHTML={{ __html: CSS }} />
      {!done ? <h2 className="tp-q">Name the company</h2> : null}
      <div className="tp-box">
        {done ? (
          <div className="tp-ans"><b>{P.name}</b><span>{P.ticker}</span></div>
        ) : null}
        <Chart P={P} done={done} open={open} />
        <div className="tp-cap">
          <span>{`${monthYear(P.from)} to ${monthYear(P.to)}, weekly`}</span>
          <span>{done ? `Low ${money(P.lo)} · high ${money(P.hi)}` : 'Prices hidden'}</span>
        </div>
      </div>
      <ol className="tp-cl" aria-label={`Clues, ${open} of ${MAX} open`}>
        {LABELS.map((lab, k) => {
          const isOpen = k < open;
          return (
            <li key={k} className={isOpen ? 'op' : 'off'}>
              <span className="tp-n">{k + 1}</span>
              <span className="tp-t">
                {isOpen ? <><i>{k === 3 ? 'Pin 4' : lab}</i><b>{clueValue(P, k)}</b></> : lab}
              </span>
            </li>
          );
        })}
      </ol>
      {misses.length ? (
        <div className="tp-miss"><span>Misses</span>{misses.map((t) => <s key={t}>{BY_T.get(t) || t} ({t})</s>)}</div>
      ) : null}
    </div>
  );
}

function Tools({ P, s, setS, active }) {
  const [q, setQ] = useState('');
  const extra = useMemo(() => new Map([[P.ticker, (P.alt || []).map(fold)]]), [P]);
  const skip = useMemo(() => new Set(s.misses || []), [s.misses]);
  const opts = useMemo(() => (active ? matches(q, skip, extra) : []), [q, skip, extra, active]);
  if (!active) return null;
  const guess = (t) => {
    if (!t) return;
    setQ('');
    setS((st) => {
      if ((st.misses || []).includes(t)) return st;
      if ((P.accept || [P.ticker]).includes(t)) return { ...st, hit: t };
      const misses = [...(st.misses || []), t];
      if (st.open >= MAX) return { ...st, misses, out: true };
      return { ...st, misses, open: st.open + 1 };
    });
  };
  const noMatch = fold(q).length >= 2 && !opts.length;
  return (
    <div className="tp-tools">
      {opts.length ? (
        <div className="pst-sug" role="listbox" aria-label="Matching companies">
          {opts.map((o, i) => (
            <button key={o.t} type="button" role="option" aria-selected={i === 0} className={i === 0 ? 'on' : undefined} onClick={() => guess(o.t)}>
              <span>{o.n}</span><small>{o.t}</small>
            </button>
          ))}
        </div>
      ) : noMatch ? (
        <div className="pst-sug" aria-live="polite"><div className="none">No Russell 3000 company matches that. It has cost you nothing.</div></div>
      ) : null}
      <div className="pst-in">
        <input type="text" value={q} onChange={(e) => setQ(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); if (opts.length) guess(opts[0].t); } }}
          placeholder="Company or ticker" aria-label="Guess a company or ticker" autoComplete="off" autoCorrect="off" autoCapitalize="off" spellCheck={false} />
        <button type="button" className="pst-go" disabled={!opts.length} onClick={() => { if (opts.length) guess(opts[0].t); }}>Guess</button>
      </div>
      {s.open < MAX ? (
        <button type="button" className="pst-tb wide" onClick={() => setS((st) => ({ ...st, open: Math.min(MAX, st.open + 1) }))}>Open clue {s.open + 1}</button>
      ) : (
        <div className="pst-note">Every clue is open. One more miss ends the day.</div>
      )}
    </div>
  );
}

const plural = (n) => `${n} clue${n === 1 ? '' : 's'}`;

const GAME = {
  key: 'tape', name: 'Tape', cat: 'Trivia', miss: 'clues',
  fresh: () => ({ open: 1, misses: [], hit: null, out: false }),
  validSave: (P, s) => typeof s.open === 'number' && Array.isArray(s.misses),
  touched: (s) => s.open > 1 || (s.misses || []).length > 0,
  solved: (P, s) => !!s.hit,
  failed: (P, s) => !!s.out,
  count: (s) => s.open,
  // Solved with c clues scores 11 - c (10 down to 5); unsolved scores 0.
  result: (P, s, won) => ({ score: won ? 11 - s.open : 0, total: 10, correct: won ? 1 : 0, guessesUsed: s.open }),
  Board,
  tools: (props) => <Tools {...props} />,
  eyebrow: (P, s, { sundayLabel }) => `No. ${P.num}${sundayLabel ? ` · ${sundayLabel}` : ''} · Clue ${s.open} of ${MAX}`,
  foot: (P, s) => `${plural(s.open)} open · ${(s.misses || []).length} ${(s.misses || []).length === 1 ? 'miss' : 'misses'} · any of ${UNIVERSE.length.toLocaleString('en-US')} Russell 3000 companies`,
  frac: (P, s) => s.open / MAX,
  sundayLabel: () => 'Sunday Edition',
  gateTitle: (P) => (P.sunday ? 'Sunday Edition: a smaller company' : "Today's chart"),
  gateLine: () => 'Five years of a stock chart with the prices hidden. Name the company from the Russell 3000. The sector is free; every extra clue or wrong guess opens the next one. Fewest clues wins.',
  rules: () => ({
    lead: 'A stock chart with the prices taken off. Name the company.',
    steps: [
      <>The chart is the company&rsquo;s last <b>five years of weekly closes</b>, adjusted for splits. The answer is one of the <b>Russell 3000</b>, and you can guess any of them by name or ticker.</>,
      <>You start with <b>one clue</b>, the sector. Open more whenever you like: the year it went public, its size by market value, the headline behind <b>pin 4</b> on the chart, what it does, and the first letter of its ticker.</>,
      <>A <b>wrong guess opens the next clue</b> for you. With all six open, one more miss ends the day.</>,
    ],
    knack: 'Read the shape before the clues. A crash and a full recovery, a single cliff on one day, a slow fade: most companies have a chart nobody else has.',
    footer: 'A solve ranks on clues used, then on the clock. The Sunday Edition is a smaller company from deeper in the index.',
  }),
  pitch: () => 'Name the company from five years of its stock chart.',
  shareLine: (P, s, won, el) => `Tape #${P.num}${P.sunday ? ' · Sunday' : ''} · ${won ? `${plural(s.open)} · ${el}` : 'not solved'}\n${Array.from({ length: MAX }, (_, k) => (k < s.open ? '\u{1F7E6}' : '⬜')).join('')}`,
  detail: (P, s, won, el) => `${P.name} (${P.ticker}) · ${plural(won ? s.open : MAX)} · ${el}`,
  aboutTitle: 'About Tape',
  about: [
    'Tape is a free daily stock market guessing game from Mind Loft. Every day it shows five years of one company’s weekly stock chart with the prices taken off, and you name the company. Any of the roughly 2,600 stocks in the Russell 3000 index is a fair guess, by name or by ticker.',
    'You start with the sector. Five more clues open one at a time when you ask for them, or when you guess wrong: the year the company went public, its size by market value, a dated headline pinned on the chart, what it does, and the first letter of its ticker. Fewer clues rank higher and the clock breaks a tie. Weekdays are well-known companies; the Sunday Edition is a smaller one.',
    <>More daily guessing: try <a href="/dossier" style={{ color: 'inherit', fontWeight: 800 }}>Dossier</a>, <a href="/pricer" style={{ color: 'inherit', fontWeight: 800 }}>Pricer</a> and <a href="/biz" style={{ color: 'inherit', fontWeight: 800 }}>Biz</a>.</>,
  ],
};

export default function TapeClient(props) {
  return <SimpleDaily {...props} game={GAME} />;
}
