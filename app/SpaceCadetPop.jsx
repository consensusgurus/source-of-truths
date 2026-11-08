"use client";

// SpaceCadetPop: the one-time "Are you a Space Cadet?" card (owner, 2026-11-07).
//
// Shown ONCE per browser, to EVERYONE (new players included, unlike
// PremierePop), on the home page only. Its one action starts the run at
// /spacecadet; Close, the X, a tap outside or Escape dismiss it. No puzzle
// tiles on the card (owner: "Don't show the tiles for the individual puzzles").
//
// RULES
//   ONCE. sot_pop_spacecadet is stamped the moment it renders. A browser that
//   has already played the run (any sot_run_spacecadet_<day> save) is stamped
//   and skipped.
//   NEVER WHILE A PUZZLE IS BEING PLAYED (owner, same evening). It asks
//   gameActive() like every pop-up, and it only lives on the home.
//   IT WAITS ITS TURN. While the entry door or any other card is up it holds;
//   if the way is not clear within 30 seconds it gives up for this visit
//   without stamping, so it comes back on the next one.
//
// ?spacecadet=0 suppresses, ?spacecadet=1 previews without stamping.

import { useEffect, useState } from 'react';
import { X } from 'lucide-react';
import { RAMP_INK } from '@/lib/category-ramp';
import { gameActive } from '@/lib/game-active';

const STAMP = 'sot_pop_spacecadet';
const BUSY = '.ent-door, .sty-vnote, .gpp-scrim, .stg-tpop, .prm-scrim, .etp-scrim, .cnp-scrim, .stf, .loft-back, .dec-backdrop';

function playedRun() {
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i) || '';
      if (k.startsWith('sot_run_spacecadet_')) return true;
    }
  } catch (e) {}
  return false;
}

export default function SpaceCadetPop() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    let force = false;
    try {
      const q = new URLSearchParams(window.location.search).get('spacecadet');
      if (q === '0') return undefined;
      force = q === '1';
    } catch (e) {}
    if (!force) {
      try {
        if (localStorage.getItem(STAMP)) return undefined;
        if (playedRun()) { localStorage.setItem(STAMP, 'played'); return undefined; }
      } catch (e) { return undefined; }
    }
    const started = Date.now();
    let quiet = 0;
    let alive = true;
    const t = setInterval(() => {
      if (!alive) return;
      if (Date.now() - started > 30000) { clearInterval(t); return; }
      if (document.querySelector(BUSY) || gameActive()) { quiet = 0; return; }
      quiet += 400;
      if (quiet < 1600) return;
      clearInterval(t);
      if (!force) { try { localStorage.setItem(STAMP, new Date().toISOString().slice(0, 10)); } catch (e) {} }
      setOpen(true);
    }, 400);
    return () => { alive = false; clearInterval(t); };
  }, []);

  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e) => { if (e.key === 'Escape') setOpen(false); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open]);

  if (!open) return null;
  const close = () => setOpen(false);
  return (
    <div className="scp-scrim" onClick={close}>
      <style>{CSS}</style>
      <div className="scp" role="dialog" aria-modal="true" aria-labelledby="scp-t" onClick={(e) => e.stopPropagation()}>
        <div className="scp-top">
          <span className="scp-eye">New Run</span>
          <button type="button" className="scp-x" aria-label="Close" onClick={close}><X size={16} strokeWidth={2.8} /></button>
        </div>
        <h2 id="scp-t">Are you a Space Cadet?</h2>
        <p className="scp-sub">Take the new test!</p>
        <p className="scp-lede">Four spatial puzzles on one page and one clock across all four. Finish fast enough and you rank as an Architect&#8209;Engineer.</p>
        <a className="scp-go" href="/spacecadet" onClick={close}>Take the Test</a>
        <button type="button" className="scp-close" onClick={close}>Close</button>
      </div>
    </div>
  );
}

const CSS = `
.scp-scrim{position:fixed;inset:0;z-index:8000;display:flex;align-items:center;justify-content:center;padding:16px;
  background:rgba(6,10,18,.58);-webkit-backdrop-filter:blur(2px);backdrop-filter:blur(2px);}
.scp{width:min(460px,100%);max-height:88vh;overflow-y:auto;box-sizing:border-box;position:relative;
  background:var(--stg-surf,#ffffff);color:var(--stg-ink,#08222e);border:1px solid var(--stg-ink,#08222e);border-radius:16px;
  padding:20px 22px 12px;box-shadow:0 18px 50px rgba(0,0,0,.28);animation:scp-in .28s ease-out;
  font-family:'Manrope',system-ui,-apple-system,sans-serif;}
@keyframes scp-in{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:none}}
@media (prefers-reduced-motion:reduce){.scp{animation:none}}
.scp-top{display:flex;align-items:center;justify-content:space-between;gap:10px;}
.scp-eye{display:inline-flex;align-items:center;font-size:12px;font-weight:800;padding:6px 12px;border-radius:999px;background:#c9d2fd;color:${RAMP_INK};}
.scp-x{flex:none;display:inline-flex;align-items:center;justify-content:center;width:36px;height:36px;border-radius:50%;
  border:1px solid currentColor;background:transparent;color:inherit;cursor:pointer;padding:0;}
.scp h2{font-size:28px;font-weight:800;letter-spacing:-.015em;margin:14px 0 4px;line-height:1.12;text-wrap:balance;}
.scp-sub{margin:0 0 8px;font-size:16px;font-weight:800;}
.scp-lede{margin:0;font-size:14px;line-height:1.5;font-weight:600;opacity:.85;}
.scp-go{display:flex;align-items:center;justify-content:center;width:100%;min-height:50px;margin-top:18px;box-sizing:border-box;
  border-radius:999px;border:1px solid var(--stg-ink,#08222e);background:#c9d2fd;color:${RAMP_INK};
  font-size:16px;font-weight:800;text-decoration:none;}
.scp-go:hover{filter:brightness(1.04);}
.scp-close{display:block;width:100%;min-height:44px;margin-top:4px;border:0;background:transparent;color:inherit;opacity:.7;
  font:inherit;font-size:14px;font-weight:700;cursor:pointer;}
.scp-go:focus-visible,.scp-x:focus-visible,.scp-close:focus-visible{outline:3px solid var(--stg-acc-ink,var(--stg-acc,#2563eb));outline-offset:2px;}
@media (max-width:420px){ .scp{padding:18px 16px 10px;} .scp h2{font-size:25px;} }
`;
