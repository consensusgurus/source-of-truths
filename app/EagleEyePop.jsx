"use client";

// EagleEyePop: the one-time "Do you have an Eagle Eye?" card (owner, 2026-11-13:
// "push to new users with a pop-up ... new / returning users i mean").
//
// Shown ONCE per browser, to EVERYONE, new and returning alike, on the home
// page only. Forked from app/SpaceCadetPop.jsx. Its one action starts the run
// at /eagleeye; Close, the X, a tap outside or Escape dismiss it.
//
// RULES
//   ONCE. sot_pop_eagleeye is stamped the moment it renders. A browser that
//   has already played the run (any sot_run_eagleeye_<day> save) is stamped
//   and skipped.
//   NEVER WHILE A PUZZLE IS BEING PLAYED. It asks gameActive() like every
//   pop-up, and it only lives on the home.
//   IT WAITS ITS TURN. While the entry door or any other card is up it holds;
//   if the way is not clear within 30 seconds it gives up for this visit
//   without stamping, so it comes back on the next one.
//   ONE RUN CARD A VISIT. A browser that was shown the Space Cadet card today
//   is left alone until its next visit, unstamped.
//
// ?eagleeye=0 suppresses, ?eagleeye=1 previews without stamping.

import { useEffect, useState } from 'react';
import { X } from 'lucide-react';
import { RAMP_INK } from '@/lib/category-ramp';
import { gameActive } from '@/lib/game-active';
import { scrimClose } from './PremierePop';

const STAMP = 'sot_pop_eagleeye';
const BUSY = '.scp-scrim, .ent-door, .sty-vnote, .gpp-scrim, .stg-tpop, .prm-scrim, .etp-scrim, .cnp-scrim, .stf, .loft-back, .dec-backdrop';

function playedRun() {
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i) || '';
      if (k.startsWith('sot_run_eagleeye_')) return true;
    }
  } catch (e) {}
  return false;
}

export default function EagleEyePop() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    let force = false;
    try {
      const q = new URLSearchParams(window.location.search).get('eagleeye');
      if (q === '0') return undefined;
      force = q === '1';
    } catch (e) {}
    if (!force) {
      try {
        if (localStorage.getItem(STAMP)) return undefined;
        if (playedRun()) { localStorage.setItem(STAMP, 'played'); return undefined; }
        if (localStorage.getItem('sot_pop_spacecadet') === new Date().toISOString().slice(0, 10)) return undefined;
      } catch (e) { return undefined; }
    }
    const started = Date.now();
    let quiet = 0;
    let alive = true;
    const t = setInterval(() => {
      if (!alive) return;
      if (Date.now() - started > 30000) { clearInterval(t); return; }
      if (document.documentElement.hasAttribute('data-sot-snap') || document.querySelector(BUSY) || gameActive()) { quiet = 0; return; }
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
    <div className="eep-scrim" {...scrimClose(close)}>
      <style>{CSS}</style>
      <div className="eep" role="dialog" aria-modal="true" aria-labelledby="eep-t" onClick={(e) => e.stopPropagation()}>
        <div className="eep-top">
          <span className="eep-eye">New Run</span>
          <button type="button" className="eep-x" aria-label="Close" onClick={close}><X size={16} strokeWidth={2.8} /></button>
        </div>
        <h2 id="eep-t">Do you have an Eagle Eye?</h2>
        <p className="eep-sub">Take the new eye test!</p>
        <p className="eep-lede">Five visual puzzles on one page: spot the differences, build two jigsaws, sweep a word search and remember a scene. Sharp and quick enough and you rank as an Eagle&nbsp;Eye.</p>
        <a className="eep-go" href="/eagleeye" onClick={close}>Take the Test</a>
        <button type="button" className="eep-close" onClick={close}>Close</button>
      </div>
    </div>
  );
}

const CSS = `
.eep-scrim{position:fixed;inset:0;z-index:8000;display:flex;align-items:center;justify-content:center;padding:16px;
  background:rgba(6,10,18,.58);-webkit-backdrop-filter:blur(2px);backdrop-filter:blur(2px);}
.eep{width:min(460px,100%);max-height:88vh;overflow-y:auto;box-sizing:border-box;position:relative;
  background:var(--stg-surf,#ffffff);color:var(--stg-ink,#08222e);border:1px solid var(--stg-ink,#08222e);border-radius:16px;
  padding:20px 22px 12px;box-shadow:0 18px 50px rgba(0,0,0,.28);animation:eep-in .28s ease-out;
  font-family:'Manrope',system-ui,-apple-system,sans-serif;}
@keyframes eep-in{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:none}}
@media (prefers-reduced-motion:reduce){.eep{animation:none}}
.eep-top{display:flex;align-items:center;justify-content:space-between;gap:10px;}
.eep-eye{display:inline-flex;align-items:center;font-size:12px;font-weight:800;padding:6px 12px;border-radius:999px;background:#f5c6fc;color:${RAMP_INK};}
.eep-x{flex:none;display:inline-flex;align-items:center;justify-content:center;width:36px;height:36px;border-radius:50%;
  border:1px solid currentColor;background:transparent;color:inherit;cursor:pointer;padding:0;}
.eep h2{font-size:28px;font-weight:800;letter-spacing:-.015em;margin:14px 0 4px;line-height:1.12;text-wrap:balance;}
.eep-sub{margin:0 0 8px;font-size:16px;font-weight:800;}
.eep-lede{margin:0;font-size:14px;line-height:1.5;font-weight:600;opacity:.85;}
.eep-go{display:flex;align-items:center;justify-content:center;width:100%;min-height:50px;margin-top:18px;box-sizing:border-box;
  border-radius:999px;border:1px solid var(--stg-ink,#08222e);background:#f5c6fc;color:${RAMP_INK};
  font-size:16px;font-weight:800;text-decoration:none;}
.eep-go:hover{filter:brightness(1.04);}
.eep-close{display:block;width:100%;min-height:44px;margin-top:4px;border:0;background:transparent;color:inherit;opacity:.7;
  font:inherit;font-size:14px;font-weight:700;cursor:pointer;}
.eep-go:focus-visible,.eep-x:focus-visible,.eep-close:focus-visible{outline:3px solid var(--stg-acc-ink,var(--stg-acc,#2563eb));outline-offset:2px;}
@media (max-width:420px){ .eep{padding:18px 16px 10px;} .eep h2{font-size:25px;} }
`;
