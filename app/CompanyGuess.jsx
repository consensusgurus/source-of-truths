'use client';

// CompanyGuess: the guess box shared by Tape and Filing. A suggestion list of
// company names with their tickers right-aligned sits above the field (owner,
// 2026-11-11), drawn from the whole Russell 3000 universe; tapping a row
// guesses it, and Enter or Guess takes the top row. With no row showing,
// Guess falls back to reading the text as one company, typos included
// (lib/company-guess.js readGuess). A miss with every clue open ends the day.
// The list is square, never a rounded pill (owner, 2026-11-06).

import React, { useMemo, useState } from 'react';
import { readGuess, suggestCompanies } from '@/lib/company-guess';

const CSS = `
.cg{display:flex;flex-direction:column;gap:8px;}
.cg .pst-sug{border-radius:0;}
.pst .cg .pst-sug button{display:flex;justify-content:space-between;align-items:center;gap:12px;width:100%;}
.cg .pst-sug button span{flex:1;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;text-align:left;}
.cg .pst-sug button small{flex:none;margin-left:auto;text-align:right;font-size:13px;font-weight:800;opacity:.8;font-variant-numeric:tabular-nums;}
.cg .pst-sug button.on small{opacity:1;}
`;

export default function CompanyGuess({ P, s, setS, max, list, children = null }) {
  const [q, setQ] = useState('');
  const [note, setNote] = useState(null);
  const extra = useMemo(() => new Map([[P.ticker, (P.alt || [])]]), [P]);
  const skip = useMemo(() => new Set(s.misses || []), [s.misses]);
  const opts = useMemo(() => suggestCompanies(q, list, extra, skip), [q, list, extra, skip]);

  const guess = (it, how) => {
    const t = it.t;
    setQ('');
    setNote(how === 'close' ? { t: `Read “${q.trim()}” as ${it.n} (${t}).` } : null);
    setS((st) => {
      if ((st.misses || []).includes(t)) return st;
      if ((P.accept || [P.ticker]).includes(t)) return { ...st, hit: t };
      const misses = [...(st.misses || []), t];
      if (st.open >= max) return { ...st, misses, out: true };
      return { ...st, misses, open: st.open + 1 };
    });
  };
  const submit = () => {
    const raw = q.trim();
    if (!raw) return;
    if (opts.length) { guess(opts[0], 'exact'); return; }
    const r = readGuess(raw, list, extra, null);
    if (!r) { setNote({ t: 'No Russell 3000 company matches that. It has cost you nothing.' }); return; }
    if (skip.has(r.it.t)) { setNote({ t: `You already tried ${r.it.n} (${r.it.t}). It has cost you nothing.` }); return; }
    guess(r.it, r.how);
  };

  return (
    <div className="cg">
      <style dangerouslySetInnerHTML={{ __html: CSS }} />
      {opts.length ? (
        <div className="pst-sug" role="listbox" aria-label="Matching companies">
          {opts.map((o, i) => (
            <button key={o.t} type="button" role="option" aria-selected={i === 0} className={i === 0 ? 'on' : undefined} onClick={() => guess(o, 'exact')}>
              <span>{o.n}</span><small>{o.t}</small>
            </button>
          ))}
        </div>
      ) : note ? (
        <div className="pst-sug" aria-live="polite"><div className="none">{note.t}</div></div>
      ) : null}
      <div className="pst-in">
        <input type="text" value={q} onChange={(e) => { setQ(e.target.value); if (note) setNote(null); }}
          onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); submit(); } }}
          placeholder="Company name or ticker" aria-label="Guess a company by name or ticker" autoComplete="off" autoCorrect="off" autoCapitalize="off" spellCheck={false} />
        <button type="button" className="pst-go" disabled={!q.trim()} onClick={submit}>Guess</button>
      </div>
      {children}
    </div>
  );
}
