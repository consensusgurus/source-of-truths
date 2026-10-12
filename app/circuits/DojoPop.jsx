"use client";

// DojoPop — the nudge, on the end card of any sudoku played on its own page, to
// go and play Enter the Dojo (owner, 2026-10-12: "if a user plays a sudoku,
// give them a pop-up pointing them to 'enter the dojo'"). It replaced
// SudokuCircuitPop the same evening, when the rotating Sudoku circuit it pushed
// toward was retired.
//
// WHEN IT FIRES: two seconds onto the end card of any game whose registry
// category is Sudoku (the verdict lands first), once a day per device
// (`sot_dojo_pop`, stamped when it opens), and never when the Dojo is already
// finished today on this device, or when the page was opened from inside
// another run (?circuit= / ?five=1). The Dojo run itself never shows an end
// card, so it never offers itself.
//
// It wears RunDoorPop's clothes (RUN_DOOR_CSS), so every run offer on the site
// looks like one object.

import { useCallback, useEffect, useRef, useState } from 'react';
import { X } from 'lucide-react';
import { DAILY_GAME_MAP } from '@/lib/daily-games';
import { circuitKeysFor } from '@/lib/circuits';
import { RUN_DOOR_CSS, runDoneToday } from './RunDoorPop';

export const DOJO_POP_STORE = 'sot_dojo_pop';
const WAIT_MS = 2000;
const ACCENT = '#e9cf7f';

function etToday() {
  try { return new Date().toLocaleDateString('en-CA', { timeZone: 'America/New_York' }); }
  catch (e) { return new Date().toISOString().slice(0, 10); }
}

export default function DojoPop({ ready = false, self = '' }) {
  const [view, setView] = useState(null);
  const fired = useRef(false);
  const close = useCallback(() => setView(null), []);

  useEffect(() => {
    if (!ready || !self || fired.current) return undefined;
    const g = DAILY_GAME_MAP[self];
    if (!g || g.cat !== 'Sudoku') return undefined;
    const t = setTimeout(() => {
      if (fired.current) return;
      try {
        const q = new URLSearchParams(window.location.search);
        if (q.get('circuit') || q.get('five') === '1') return;
      } catch (e) {}
      const today = etToday();
      if (runDoneToday('dojo')) return;
      try { if (localStorage.getItem(DOJO_POP_STORE) === today) return; } catch (e) { return; }
      try { localStorage.setItem(DOJO_POP_STORE, today); } catch (e) {}
      fired.current = true;
      const keys = circuitKeysFor('dojo', today);
      const tags = keys.map((k) => { const x = DAILY_GAME_MAP[k] || {}; return [x.name || k, x.colorNavy || '#93c5fd']; });
      const mine = keys.includes(self);
      setView({ tags, mine, name: g.name, variant: tags.length > 2 ? tags[tags.length - 1][0] : 'a variant' });
    }, WAIT_MS);
    return () => clearTimeout(t);
  }, [ready, self]);

  useEffect(() => {
    if (!view) return undefined;
    const onKey = (e) => { if (e.key === 'Escape') close(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [view, close]);

  if (!view) return null;
  return (
    <div className="rdp-bd" role="dialog" aria-modal="true" aria-labelledby="djp-h" onClick={close}>
      <style dangerouslySetInnerHTML={{ __html: RUN_DOOR_CSS(ACCENT) }} />
      <div className="rdp" onClick={(e) => e.stopPropagation()}>
        <button type="button" className="rdp-x" onClick={close} aria-label="Close"><X size={14} strokeWidth={2.4} /></button>
        <i className="rdp-e">Daily run · Three sudokus</i>
        <h2 className="rdp-h" id="djp-h">Enter the Dojo</h2>
        <div className="rdp-tags">{view.tags.map(([t, c], i) => <span key={t} style={{ background: c, animationDelay: `${i * 70}ms` }}>{t}</span>)}</div>
        <p className="rdp-p">
          Sixes, Suds and today&rsquo;s {view.variant} back to back on one page. Solve all three and the clock decides your belt, from white to black.
          {view.mine ? ` Your ${view.name} result already counts.` : ''}
        </p>
        <a className="rdp-go" href="/dojo">Enter the Dojo</a>
        <button type="button" className="rdp-no" onClick={close}>Not now</button>
      </div>
    </div>
  );
}
