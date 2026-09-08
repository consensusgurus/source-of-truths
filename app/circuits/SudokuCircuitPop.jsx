"use client";

// SudokuCircuitPop — the nudge, on the end card of any of today's five Sudoku
// circuit games, to go on and finish the circuit (owner, 2026-09-05: "when a
// user completes a sudoku within the daily circuit for sudokus, they should
// get a pop-up pushing them to complete that circuit after being on the end
// game screen for 2 seconds").
//
// WHEN IT FIRES, and the reason for each condition:
//
//   TWO SECONDS ONTO THE END CARD. The verdict lands first and is read; the
//   nudge arrives after it, never over it. The timer starts when the card
//   mounts (`ready`), which is the moment the player is looking at a result.
//
//   THE GAME IS ONE OF TODAY'S FIVE. The Sudoku circuit is a rotating window
//   over a pool of ten (lib/circuits.js), so a sudoku that is in the pool but
//   not on today's card gets no nudge: the circuit could not be completed
//   through it. circuitKeysFor is the one accessor that knows the day's five.
//
//   THE CIRCUIT IS NOT ALREADY COMPLETE. The game just finished always counts
//   as done, whether or not its row is readable yet; the other four come off
//   the day's daily-me read (played, not solved, an abandoned row does not
//   count), which is the SERVER's word rather than this device's breadcrumbs.
//   If the read has not landed by the time the timer fires, the card assumes
//   only this game is done, which is the honest floor.
//
//   ONCE A DAY, PER DEVICE. Stamped under the ET date the moment it opens, so
//   the second, third and fourth finishes of the same circuit are silent: the
//   push is to complete the circuit, not to be reminded on every grid. A
//   browser that refuses storage gets it once per page load rather than never.
//
//   IN A RUN OR OUT OF ONE. A finish inside the run (?circuit=sudoku) already
//   carries "Next in the run" on the card itself; the pop-up still fires there
//   because the owner asked for it on every circuit finish, and the once-a-day
//   stamp keeps it to one showing either way.
//
// IT WEARS THE RUN STAGE'S CLOTHES, as GauntletPop and ValetDoorPop do: the
// near-black ground, a DM Mono eyebrow, rows as faint lifts with a rung down
// the left edge in each grid's own dark-ground colour (`colorNavy`, the value
// the registry keeps for exactly this ground), and a light pastel call to
// action carrying dark ink. Done rows are ticked and dimmed; the button names
// the next unplayed grid and links into it WITH the circuit flag, so the run's
// own strip and hand-off take over from there.

import { useCallback, useEffect, useRef, useState } from 'react';
import { Check, X } from 'lucide-react';
import { circuitKeysFor, circuitHref, circuitName } from '@/lib/circuits';
import { DAILY_GAME_MAP } from '@/lib/daily-games';
import { fetchDailyMe, dailyMeQuery, dailyMeIdentity } from '../dailyMeClient';
import { T } from '@/lib/theme';

const ID = 'sudoku';
export const SUDOKU_POP_STORE = 'sot_sudoku_pop';
const WAIT_MS = 2000;

const SANS = "'Manrope', system-ui, -apple-system, sans-serif";
const MONO = "'DM Mono', ui-monospace, 'SFMono-Regular', monospace";

function etToday() {
  try { return new Date().toLocaleDateString('en-CA', { timeZone: 'America/New_York' }); }
  catch (e) { return new Date().toISOString().slice(0, 10); }
}

export default function SudokuCircuitPop({ ready = false, self = '' }) {
  const [open, setOpen] = useState(false);
  // What the card shows, decided once at fire time: today's five in run order,
  // which are done, and the next unplayed one.
  const [view, setView] = useState(null);
  const fired = useRef(false);
  // The day's played rows, from daily-me. A ref, not state: the timer reads
  // whatever has landed by the time it fires, and a late arrival must not
  // re-open or re-order a card the reader is already looking at.
  const per = useRef(null);
  const close = useCallback(() => setOpen(false), []);

  // Is this finish one of today's five at all? Read in an effect: the server
  // has no idea what today is in Eastern.
  const [member, setMember] = useState(false);
  useEffect(() => {
    if (!self) return;
    try { setMember(circuitKeysFor(ID, etToday()).includes(self)); } catch (e) { setMember(false); }
  }, [self]);

  // The day's rows, fresh, because the row this finish just wrote is part of
  // the answer. Same shared client as the card, so this joins the request the
  // page is already making rather than adding one.
  useEffect(() => {
    if (!member) return undefined;
    const { anonId, email } = dailyMeIdentity();
    if (!anonId && !email) return undefined;
    let alive = true;
    fetchDailyMe(dailyMeQuery({ anonId, email }), { fresh: true })
      .then((d) => { if (alive && d && d.perGame) per.current = d.perGame; })
      .catch(() => {});
    return () => { alive = false; };
  }, [member]);

  useEffect(() => {
    if (!ready || !member || !self || fired.current) return undefined;
    const t = setTimeout(() => {
      if (fired.current) return;
      const today = etToday();
      const keys = circuitKeysFor(ID, today);
      if (keys.length < 2 || !keys.includes(self)) return;
      const done = new Set([self]);
      const p = per.current;
      if (p) for (const [k, v] of Object.entries(p)) if (!(v && v.abandoned)) done.add(k);
      const next = keys.find((k) => !done.has(k)) || null;
      if (!next) return; // the circuit is complete: nothing to push toward
      try { if (localStorage.getItem(SUDOKU_POP_STORE) === today) return; } catch (e) {}
      try { localStorage.setItem(SUDOKU_POP_STORE, today); } catch (e) {}
      fired.current = true;
      const rows = keys.map((k) => {
        const g = DAILY_GAME_MAP[k] || {};
        return { key: k, name: g.name || k, tag: g.tag || '', color: g.colorNavy || g.color || '#7dd3fc', done: done.has(k) };
      });
      const nextG = DAILY_GAME_MAP[next] || {};
      setView({ rows, n: rows.filter((r) => r.done).length, next, nextName: nextG.name || next, href: circuitHref(next, ID) });
      setOpen(true);
    }, WAIT_MS);
    return () => clearTimeout(t);
  }, [ready, member, self]);

  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e) => { if (e.key === 'Escape') close(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, close]);

  if (!open || !view) return null;

  return (
    <div className="skp-bd" role="dialog" aria-modal="true" aria-labelledby="skp-h" onClick={close}>
      <style>{CSS}</style>
      <div className="skp" onClick={(e) => e.stopPropagation()}>
        <button type="button" className="skp-x" onClick={close} aria-label="Close">
          <X size={14} strokeWidth={2.4} />
        </button>

        <i className="skp-e">Daily circuit &middot; {view.n} of {view.rows.length} done</i>
        <h2 className="skp-h" id="skp-h">Finish the {circuitName(ID)} circuit</h2>
        <p className="skp-p">
          {view.rows.length - view.n === 1
            ? 'One grid left. Solve it and the circuit is yours for the day.'
            : `${view.rows.length - view.n} grids left, easiest first. Solve them all for the day's circuit rank.`}
        </p>

        <ul className="skp-list">
          {view.rows.map((r) => (
            <li key={r.key} className={`skp-row${r.done ? ' done' : ''}${r.key === view.next ? ' next' : ''}`} style={{ '--rung': r.color }}>
              <s className="skp-rung" aria-hidden="true" />
              <span className="skp-name">{r.name}</span>
              <span className="skp-tag">{r.tag}</span>
              {r.done ? <Check className="skp-tick" size={14} strokeWidth={3} aria-label="Done" /> : null}
            </li>
          ))}
        </ul>

        <a className="skp-go" href={view.href}>Continue &middot; {view.nextName}</a>
        <button type="button" className="skp-later" onClick={close}>Not now</button>
      </div>
    </div>
  );
}

const CSS = `
.skp-bd{position:fixed;inset:0;z-index:4000;display:flex;align-items:center;justify-content:center;
        padding:20px;background:rgba(3,6,14,.74);backdrop-filter:blur(2px);
        animation:skpfade .18s ease-out;}
.skp{position:relative;width:100%;max-width:360px;max-height:calc(100vh - 40px);overflow-y:auto;
     background:${T.ground};border:1px solid rgba(255,255,255,.14);border-radius:13px;
     padding:20px 20px 18px;font-family:${SANS};color:#eef2fa;
     box-shadow:0 24px 64px rgba(0,0,0,.6);animation:skprise .2s ease-out;}
.skp-x{position:absolute;top:10px;right:10px;background:transparent;border:none;color:#66748f;
       cursor:pointer;padding:5px;line-height:0;border-radius:7px;}
.skp-x:hover{color:#fff;background:rgba(255,255,255,.07);}
.skp-x:focus-visible{outline:2px solid #cba6f7;outline-offset:2px;}
.skp-e{display:block;font-style:normal;font-family:${MONO};font-size:9.5px;letter-spacing:.15em;
       text-transform:uppercase;color:#66748f;margin-bottom:3px;}
.skp-h{font-size:21px;font-weight:800;letter-spacing:-.02em;line-height:1.1;color:#fff;margin:0 26px 0 0;}
.skp-p{margin:8px 0 0;font-size:13px;line-height:1.45;color:#aeb8cc;}
.skp-list{list-style:none;margin:14px 0 0;padding:0;display:flex;flex-direction:column;gap:5px;}
.skp-row{display:flex;align-items:center;gap:10px;background:rgba(255,255,255,.05);
         border:1px solid rgba(255,255,255,.14);border-radius:9px;padding:8px 12px;
         font-size:13px;font-weight:800;letter-spacing:-.01em;color:#eef2fa;min-width:0;}
.skp-row.next{border-color:var(--rung,#cba6f7);}
.skp-row.done{opacity:.55;}
.skp-rung{flex:none;width:3px;height:15px;border-radius:2px;background:var(--rung,#cba6f7);text-decoration:none;}
.skp-name{flex:none;}
.skp-tag{flex:1;min-width:0;font-family:${MONO};font-weight:500;font-size:10.5px;color:#8b97ad;
         white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}
.skp-tick{flex:none;color:#86efac;}
/* A light pastel carrying dark ink, the stage's rule: the next grid's own
   colour would be too dark on this ground as a button, so it is the rung. */
.skp-go{display:block;margin-top:15px;background:#cba6f7;color:#1e0b36;border:none;border-radius:9px;
        padding:13px 18px;font-family:${SANS};font-size:14px;font-weight:800;letter-spacing:.02em;
        text-align:center;text-decoration:none;cursor:pointer;}
.skp-go:hover{filter:brightness(1.06);}
.skp-go:focus-visible{outline:2px solid #cba6f7;outline-offset:2px;}
.skp-later{display:block;width:100%;margin-top:8px;background:transparent;border:none;color:#8b97ad;
           font-family:${SANS};font-size:12.5px;font-weight:700;padding:8px;cursor:pointer;border-radius:7px;}
.skp-later:hover{color:#fff;background:rgba(255,255,255,.05);}
@keyframes skpfade{from{opacity:0}to{opacity:1}}
@keyframes skprise{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:none}}
@media(max-width:520px){
  .skp{padding:18px 16px 16px;}
  .skp-h{font-size:19px;}
}
@media(prefers-reduced-motion:reduce){
  .skp-bd,.skp{animation:none;}
}
`;
