"use client";

// DojoPop — the card on the end card of any sudoku played on its own page
// (owner, 2026-10-12). Two parts, either of which can show on its own:
//
//   THE DOJO OFFER, for every player: "if a user plays a sudoku, give them a
//   pop-up pointing them to 'enter the dojo'". Skipped once the Dojo is
//   finished today on this device.
//
//   MORE SUDOKUS, for NEWER players only (visitor id minted in the last 14
//   days, lib/visitor isNewerVisitor): "the pop-up card that suggests other
//   sudokus for finishers". Up to four sudokus not yet played today, shortest
//   first, each a link. This is what SudokuCircuitPop did for the retired
//   Sudoku circuit, kept for the players who are still finding their way round.
//
// WHEN IT FIRES: two seconds onto the end card of any game whose registry
// category is Sudoku, once a day per device (`sot_dojo_pop`, stamped when it
// opens), never when the page was opened from inside a run (?circuit= /
// ?five=1). LoftFinish mounts it on EVERY ending branch, the stage curtain
// included (it was missing there, which is why most players never saw it).
//
// It wears RunDoorPop's clothes (RUN_DOOR_CSS), so every run offer on the site
// looks like one object.

import { useCallback, useEffect, useRef, useState } from 'react';
import { X } from 'lucide-react';
import { DAILY_GAME_MAP } from '@/lib/daily-games';
import { circuitKeysFor, SUDOKU_POOL } from '@/lib/circuits';
import { isNewerVisitor } from '@/lib/visitor';
import { RUN_DOOR_CSS, runDoneToday } from './RunDoorPop';

export const DOJO_POP_STORE = 'sot_dojo_pop';
const WAIT_MS = 2000;
const ACCENT = '#e9cf7f';
const MORE_MAX = 4;

function etToday() {
  try { return new Date().toLocaleDateString('en-CA', { timeZone: 'America/New_York' }); }
  catch (e) { return new Date().toISOString().slice(0, 10); }
}
function playedToday(key, today) {
  try {
    const b = JSON.parse(localStorage.getItem(`sot_${key}_day`) || 'null');
    return !!(b && b.d === today);
  } catch (e) { return false; }
}

export default function DojoPop({ ready = false, self = '' }) {
  const [view, setView] = useState(null);
  const fired = useRef(false);
  const close = useCallback(() => setView(null), []);

  useEffect(() => {
    if (!ready || !self || fired.current) return undefined;
    const g = DAILY_GAME_MAP[self];
    if (!g || g.cat !== 'Sudoku') return undefined;
    let alive = true;
    const timers = [];
    // THE CURTAIN FIRST: on the stage the finish floods the screen (z 9000)
    // before it collapses onto the card. Wait for it to clear (up to 20s), then
    // a short beat, so the card never opens underneath the verdict.
    const started = Date.now();
    const whenClear = (fn) => {
      if (!alive) return;
      if (document.querySelector('.stf-flood') && Date.now() - started < 20000) { timers.push(setTimeout(() => whenClear(fn), 400)); return; }
      fn();
    };
    const t = setTimeout(() => whenClear(() => {
      if (!alive || fired.current) return;
      try {
        const q = new URLSearchParams(window.location.search);
        if (q.get('circuit') || q.get('five') === '1') return;
      } catch (e) {}
      const today = etToday();
      try { if (localStorage.getItem(DOJO_POP_STORE) === today) return; } catch (e) { return; }
      const dojo = !runDoneToday('dojo');
      let more = [];
      if (isNewerVisitor()) {
        const order = [...SUDOKU_POOL, ...Object.keys(DAILY_GAME_MAP).filter((k) => DAILY_GAME_MAP[k].cat === 'Sudoku' && !SUDOKU_POOL.includes(k))];
        more = order.filter((k) => k !== self && DAILY_GAME_MAP[k] && !playedToday(k, today)).slice(0, MORE_MAX)
          .map((k) => { const x = DAILY_GAME_MAP[k]; return { key: k, name: x.name, tag: x.tag || '', color: x.colorNavy || '#93c5fd', href: x.href || `/${k}` }; });
      }
      if (!dojo && !more.length) return;
      try { localStorage.setItem(DOJO_POP_STORE, today); } catch (e) {}
      fired.current = true;
      const keys = circuitKeysFor('dojo', today);
      const tags = keys.map((k) => { const x = DAILY_GAME_MAP[k] || {}; return [x.name || k, x.colorNavy || '#93c5fd']; });
      setView({
        dojo, more, tags, mine: keys.includes(self), name: g.name,
        variant: tags.length > 2 ? tags[tags.length - 1][0] : 'a variant',
      });
    }), WAIT_MS);
    return () => { alive = false; clearTimeout(t); timers.forEach(clearTimeout); };
  }, [ready, self]);

  // While the card is open the stage's 15-second hand-off to the next game
  // stands down (StageFinish reads this flag, as it does for ThanksPop).
  useEffect(() => {
    if (!view) return undefined;
    try { document.documentElement.dataset.sotModal = 'dojo'; } catch (e) {}
    return () => { try { if (document.documentElement.dataset.sotModal === 'dojo') delete document.documentElement.dataset.sotModal; } catch (e) {} };
  }, [view]);

  useEffect(() => {
    if (!view) return undefined;
    const onKey = (e) => { if (e.key === 'Escape') close(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [view, close]);

  if (!view) return null;
  return (
    <div className="rdp-bd" role="dialog" aria-modal="true" aria-labelledby="djp-h" onClick={close}>
      <style dangerouslySetInnerHTML={{ __html: RUN_DOOR_CSS(ACCENT) + MORE_CSS }} />
      <div className="rdp" onClick={(e) => e.stopPropagation()}>
        <button type="button" className="rdp-x" onClick={close} aria-label="Close"><X size={14} strokeWidth={2.4} /></button>
        {view.dojo ? (
          <>
            <i className="rdp-e">Daily run · Three sudokus</i>
            <h2 className="rdp-h" id="djp-h">Enter the Dojo</h2>
            <div className="rdp-tags">{view.tags.map(([t, c], i) => <span key={t} style={{ background: c, animationDelay: `${i * 70}ms` }}>{t}</span>)}</div>
            <p className="rdp-p">
              Sixes, Suds and today&rsquo;s {view.variant} back to back on one page. Solve all three and the clock decides your belt, from white to black.
              {view.mine ? ` Your ${view.name} result already counts.` : ''}
            </p>
            <a className="rdp-go" href="/dojo">Enter the Dojo</a>
          </>
        ) : (
          <>
            <i className="rdp-e">Nice solve</i>
            <h2 className="rdp-h" id="djp-h">Another sudoku?</h2>
          </>
        )}
        {view.more.length ? (
          <div className="djm">
            {view.dojo ? <div className="djm-cap">Or try another sudoku</div> : null}
            {view.more.map((m) => (
              <a key={m.key} className="djm-row" href={m.href} style={{ '--c': m.color }}>
                <span className="djm-tx"><b>{m.name}</b><small>{m.tag}</small></span>
                <span className="djm-go">Play <span aria-hidden="true">&rsaquo;</span></span>
              </a>
            ))}
          </div>
        ) : null}
        <button type="button" className="rdp-no" onClick={close}>Not now</button>
      </div>
    </div>
  );
}

const MORE_CSS = `
.djm{margin-top:14px;display:flex;flex-direction:column;gap:6px}
.djm-cap{font-size:9.5px;font-weight:800;letter-spacing:.15em;text-transform:uppercase;color:#66748f;margin-bottom:2px}
.djm-row{display:flex;align-items:center;gap:10px;padding:9px 11px;border-radius:9px;background:rgba(255,255,255,.045);border:1px solid rgba(255,255,255,.1);border-left:4px solid var(--c);text-decoration:none;color:#eef2fa}
.djm-row:hover{background:rgba(255,255,255,.08)}
.djm-tx{flex:1;min-width:0;display:flex;flex-direction:column}
.djm-tx b{font-size:14px;font-weight:800}
.djm-tx small{font-size:11.5px;font-weight:600;color:#9aa8c4;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.djm-go{font-size:12px;font-weight:800;color:#e9cf7f;white-space:nowrap}
`;
