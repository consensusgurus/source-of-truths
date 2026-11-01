'use client';

// Fill: the daily fill-in (criss-cross). An empty crossword-shaped grid and a
// list of words from one theme; every word goes in exactly once, and the only
// clues are the lengths and the crossings. One word is printed to start.
//
// The fill is UNIQUE (scripts/verify-fill.mjs proves it), so a finished grid is
// checked from the list alone: every slot spells a list word, each word used
// once. No answer key reaches the browser, and the slots are not paired with
// the words in the data.

import React, { useEffect, useMemo, useRef, useState } from 'react';
import SimpleDaily from '../SimpleDaily';

const L = (w) => w.replace(/ /g, '');
const cellsOf = ([r, c, d, n]) => Array.from({ length: n }, (_, i) => (d === 'a' ? [r, c + i] : [r + i, c]));
const k = (r, c) => `${r},${c}`;

function givenMap(P) { const m = {}; for (const [r, c, ch] of P.given) m[k(r, c)] = ch; return m; }
function slotWord(P, s, slot) { let w = ''; for (const [r, c] of cellsOf(slot)) { const ch = s.cells[k(r, c)]; if (!ch) return null; w += ch; } return w; }
// Which list words the grid currently spells, as a count per word.
function placedCounts(P, s) {
  const out = {};
  for (const sl of P.slots) { const w = slotWord(P, s, sl); if (w) out[w] = (out[w] || 0) + 1; }
  return out;
}
function isSolved(P, s) {
  const want = {}; for (const w of P.words) want[L(w)] = (want[L(w)] || 0) + 1;
  const have = {};
  for (const sl of P.slots) { const w = slotWord(P, s, sl); if (!w || !want[w]) return false; have[w] = (have[w] || 0) + 1; }
  return Object.keys(want).every((w) => have[w] === want[w]);
}

function Board({ P, s, setS, active, done }) {
  const G = useMemo(() => givenMap(P), [P]);
  const owner = useMemo(() => {
    const m = {};
    P.slots.forEach((sl, i) => cellsOf(sl).forEach(([r, c]) => { (m[k(r, c)] = m[k(r, c)] || []).push(i); }));
    return m;
  }, [P]);
  const [cur, setCur] = useState(null); // { r, c, d }
  const inRef = useRef(null);
  const slotAt = (r, c, d) => (owner[k(r, c)] || []).find((i) => P.slots[i][2] === d);
  const activeSlot = cur ? slotAt(cur.r, cur.c, cur.d) : undefined;
  const hl = new Set(activeSlot != null ? cellsOf(P.slots[activeSlot]).map(([r, c]) => k(r, c)) : []);
  const pick = (r, c) => {
    if (!active || done) return;
    const own = owner[k(r, c)] || [];
    if (!own.length) return;
    let d = own.length === 1 ? P.slots[own[0]][2] : (cur && cur.r === r && cur.c === c ? (cur.d === 'a' ? 'd' : 'a') : (cur ? cur.d : 'a'));
    if (slotAt(r, c, d) == null) d = d === 'a' ? 'd' : 'a';
    setCur({ r, c, d });
    try { inRef.current && inRef.current.focus({ preventScroll: true }); } catch (e) {}
  };
  const step = (dir) => {
    if (!cur) return;
    const sl = P.slots[slotAt(cur.r, cur.c, cur.d)];
    const cs = cellsOf(sl);
    const at = cs.findIndex(([r, c]) => r === cur.r && c === cur.c);
    const nx = cs[at + dir];
    if (nx) setCur({ r: nx[0], c: nx[1], d: cur.d });
  };
  const type = (ch) => {
    if (!cur || !active || done) return;
    const key = k(cur.r, cur.c);
    if (!G[key]) setS((st) => ({ ...st, cells: { ...st.cells, [key]: ch }, typed: (st.typed || 0) + 1 }));
    step(1);
  };
  const erase = () => {
    if (!cur || !active || done) return;
    const key = k(cur.r, cur.c);
    if (!G[key] && s.cells[key]) setS((st) => { const c2 = { ...st.cells }; delete c2[key]; return { ...st, cells: c2 }; });
    else { step(-1); }
  };
  const onKey = (e) => {
    if (e.key === 'Backspace' || e.key === 'Delete') { e.preventDefault(); erase(); return; }
    const mv = { ArrowRight: [0, 1, 'a'], ArrowLeft: [0, -1, 'a'], ArrowDown: [1, 0, 'd'], ArrowUp: [-1, 0, 'd'] }[e.key];
    if (mv && cur) {
      e.preventDefault();
      const r = cur.r + mv[0], c = cur.c + mv[1];
      if (owner[k(r, c)]) { const d = slotAt(r, c, mv[2]) != null ? mv[2] : cur.d; setCur({ r, c, d: slotAt(r, c, d) != null ? d : (d === 'a' ? 'd' : 'a') }); }
      return;
    }
    if (/^[a-zA-Z]$/.test(e.key) && !e.metaKey && !e.ctrlKey) { e.preventDefault(); type(e.key.toUpperCase()); }
  };
  useEffect(() => { if (done) setCur(null); }, [done]);
  const placed = placedCounts(P, s);
  const left = { ...placed };
  const byLen = {};
  for (const w of P.words) (byLen[L(w).length] = byLen[L(w).length] || []).push(w);
  const solved = done && isSolved(P, s);
  return (
    <div className="fil">
      <style dangerouslySetInnerHTML={{ __html: `
.fil{display:grid;grid-template-columns:1fr;gap:14px;width:100%;align-self:center;}
@media (min-width:900px){.fil{grid-template-columns:minmax(0,1fr) 250px;align-items:start;}}
.fil-g{display:grid;gap:2px;width:100%;max-width:min(560px, calc(100dvh - 330px));margin:0 auto;container-type:inline-size;}
@media (min-width:900px){.fil-g{max-width:min(620px, calc(100dvh - 250px));}}
.fil-c{aspect-ratio:1/1;border-radius:3px;display:flex;align-items:center;justify-content:center;font-weight:800;line-height:1;user-select:none;-webkit-user-select:none;}
.fil-c.x{background:transparent;}
.fil-c.o{background:var(--pst-bg,#fff);box-shadow:inset 0 0 0 1.5px var(--pst-cell-line,#c9d2dc);cursor:pointer;color:var(--pst-ink);}
.fil-c.o.h{background:var(--pst-pale,#e0f4fe);}
.fil-c.o.cur{background:var(--pst-acc,#7dd3fc);color:var(--pst-on-acc,#0b0f1a);box-shadow:inset 0 0 0 2px var(--pst-ink);}
.fil-c.o.gv{color:var(--pst-mute,#3b4656);}
.fil-g.ok .fil-c.o{background:var(--pst-pale,#e0f4fe);box-shadow:inset 0 0 0 1.5px var(--pst-acc,#7dd3fc);}
.fil-in{position:fixed;left:0;bottom:0;width:1px;height:1px;opacity:0;font-size:16px;border:0;padding:0;}
.fil-w{display:flex;flex-direction:column;gap:8px;}
.fil-th{font-size:11px;font-weight:800;letter-spacing:.12em;text-transform:uppercase;opacity:.75;}
.fil-tt{font-size:20px;font-weight:800;letter-spacing:-.01em;margin-top:-4px;}
.fil-grp{display:flex;flex-wrap:wrap;gap:5px;align-items:baseline;}
.fil-grp>b{font-size:11px;font-weight:800;opacity:.7;min-width:24px;}
.fil-grp span{font-size:12.5px;font-weight:800;padding:3px 8px;border-radius:999px;border:2px solid var(--pst-ink);background:var(--pst-tint);}
.fil-grp span.on{text-decoration:line-through;text-decoration-thickness:2px;opacity:.5;background:transparent;}
` }} />
      <div>
        <div className={'fil-g' + (solved ? ' ok' : '')} style={{ gridTemplateColumns: `repeat(${P.cols}, 1fr)` }} role="grid" aria-label={`Fill grid, ${P.words.length} words`}>
          {Array.from({ length: P.rows }, (_, r) => Array.from({ length: P.cols }, (_, c) => {
            const key = k(r, c);
            if (!owner[key]) return <div key={key} className="fil-c x" aria-hidden="true" />;
            const ch = s.cells[key] || G[key] || '';
            const cls = 'fil-c o' + (G[key] ? ' gv' : '') + (cur && cur.r === r && cur.c === c ? ' cur' : (hl.has(key) ? ' h' : ''));
            return <div key={key} className={cls} role="gridcell" aria-label={ch || 'empty'} onClick={() => pick(r, c)} style={{ fontSize: `calc(min(560px, 100cqw) / ${P.cols} * 0.58)` }}>{ch}</div>;
          }))}
        </div>
        <input ref={inRef} className="fil-in" aria-label="Type a letter" autoCapitalize="characters" autoComplete="off" autoCorrect="off" spellCheck={false}
          onKeyDown={onKey}
          onInput={(e) => { const v = (e.currentTarget.value || '').replace(/[^a-z]/gi, ''); e.currentTarget.value = ''; if (v) type(v.slice(-1).toUpperCase()); }} />
      </div>
      <div className="fil-w" aria-label="The words">
        <div className="fil-th">Today&rsquo;s theme</div>
        <div className="fil-tt">{P.theme}</div>
        {Object.keys(byLen).sort((a, b) => a - b).map((n) => (
          <div className="fil-grp" key={n}>
            <b>{n}</b>
            {byLen[n].map((w) => {
              const on = (left[L(w)] || 0) > 0;
              if (on) left[L(w)]--;
              return <span key={w} className={on ? 'on' : undefined}>{w}</span>;
            })}
          </div>
        ))}
      </div>
    </div>
  );
}

const placedTotal = (P, s) => Object.values(placedCounts(P, s)).reduce((a, b) => a + b, 0);
const GAME = {
  key: 'fill', name: 'Fill', cat: 'Word', miss: null, wide: true,
  fresh: (P) => ({ cells: givenMap(P), typed: 0 }),
  validSave: (P, s) => !!s.cells && typeof s.cells === 'object',
  touched: (s) => (s.typed || 0) > 0,
  solved: isSolved,
  count: () => 0,
  result: (P, s, won) => ({ score: won ? 10 : 0, total: 10, correct: won ? 1 : 0, guessesUsed: 0 }),
  Board,
  eyebrow: (P, s, { sundayLabel }) => `${P.words.length} words${sundayLabel ? ` · ${sundayLabel}` : ''} · No. ${P.num}`,
  foot: (P, s) => `${Math.min(placedTotal(P, s), P.words.length)} of ${P.words.length} words in`,
  frac: (P, s) => Math.min(1, placedTotal(P, s) / P.words.length),
  giveUpLabel: 'Tap again to give up',
  sundayLabel: () => 'Sunday Edition',
  gateTitle: (P) => `Today: ${P.words.length} words to fit`,
  gateLine: (P) => `An empty grid and ${P.words.length} words from one theme. Fit every word in. The lengths and the crossings are the only clues, and one word is printed to start you off.`,
  rules: (P) => ({
    lead: 'A crossword with no clues: you have the answers, and the job is to fit them.',
    steps: [
      <>Every word on the list goes in the grid <b>exactly once</b>, across or down. The list is grouped by <b>length</b>.</>,
      <><b>Tap</b> a square and type. Tap the same square again to switch between <b>across and down</b>. Backspace clears a letter.</>,
      <>One word is <b>printed to start</b>. Each word you place gives you letters in the words that cross it.</>,
      <>There is <b>one way</b> to fill every grid. A word struck off the list is spelled somewhere in the grid, right or not; the grid finishes itself when every word is in its place.</>,
    ],
    knack: 'Start where a length has only one word on the list: that word can only go in a slot of its length.',
    footer: 'A filled grid ranks on the clock.',
  }),
  pitch: (P) => `${P.words.length} ${P.theme.toLowerCase()} words, one empty grid. Fit them all.`,
  shareLine: (P, s, won, el) => `Fill #${P.num} · ${P.theme} · ${won ? `filled in ${el}` : 'unfinished'}`,
  detail: (P, s, won, el) => `${P.theme} · ${P.words.length} words · ${el}`,
  aboutTitle: 'About Fill',
  about: [
    'Fill is a free daily fill-in puzzle from Mind Loft, also called a criss-cross or a word fit. You get an empty crossword grid and the list of words that go in it, all from one theme, and the job is to fit every word into its place.',
    'There are no clues: the lengths and the crossing letters are all you have, and every grid has exactly one way to fill it. Weekdays carry sixteen to eighteen words; the Sunday Edition carries twenty-two on a bigger grid. The clock decides the daily leaderboard.',
    <>The themes come from the same lists as the daily word search, <a href="/scour" style={{ color: 'inherit', fontWeight: 800 }}>Scour</a>, and the daily scramble, <a href="/scram" style={{ color: 'inherit', fontWeight: 800 }}>Scram</a>.</>,
  ],
};

export default function FillClient(props) {
  return <SimpleDaily {...props} game={GAME} />;
}
