"use client";

// ShopPop: the one-time "The Loft Shop is open" card (owner, 2026-11-19: "make
// the pop-up for RETURNING players directing them to the new Mind Loft Merch
// Shop").
//
// Shown ONCE per browser, to RETURNING players only, on the home page only.
// Forked from app/EagleEyePop.jsx. Its one action opens /community/shop;
// Close, the X, a tap outside or Escape dismiss it.
//
// RULES
//   RETURNING ONLY. seenBeforeToday() (lib/visitor.js), the same test the
//   new-game card uses. A first-day visitor is left alone, unstamped, so the
//   card is still owed on a later day.
//   ONCE. sot_pop_shop is stamped the moment it renders.
//   NEVER WHILE A PUZZLE IS BEING PLAYED. It asks gameActive() like every
//   pop-up, and it only lives on the home.
//   IT WAITS ITS TURN. While the entry door or any other card is up it holds;
//   if the way is not clear within 30 seconds it gives up for this visit
//   without stamping, so it comes back on the next one.
//   ONE POP-UP A VISIT. It asks claimPop('shop') before it opens.
//
// ?shop=0 suppresses, ?shop=1 previews without stamping.

import { useEffect, useState } from 'react';
import { X } from 'lucide-react';
import { RAMP_INK } from '@/lib/category-ramp';
import { gameActive } from '@/lib/game-active';
import { scrimClose } from './PremierePop';
import { claimPop } from '@/lib/pop-budget';
import { seenBeforeToday } from '@/lib/visitor';

const STAMP = 'sot_pop_shop';
const BUSY = '.scp-scrim, .eep-scrim, .ent-door, .sty-vnote, .gpp-scrim, .stg-tpop, .prm-scrim, .etp-scrim, .cnp-scrim, .stf, .loft-back, .dec-backdrop';

export default function ShopPop() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    let force = false;
    try {
      const q = new URLSearchParams(window.location.search).get('shop');
      if (q === '0') return undefined;
      force = q === '1';
    } catch (e) {}
    if (!force) {
      try {
        if (localStorage.getItem(STAMP)) return undefined;
        if (!seenBeforeToday()) return undefined;   // returning players only; unstamped, so it is still owed
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
      if (!force && !claimPop('shop')) return;   // one pop-up a visit
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
    <div className="shp-scrim" {...scrimClose(close)}>
      <style>{CSS}</style>
      <div className="shp" role="dialog" aria-modal="true" aria-labelledby="shp-t" onClick={(e) => e.stopPropagation()}>
        <div className="shp-top">
          <span className="shp-eye">New</span>
          <button type="button" className="shp-x" aria-label="Close" onClick={close}><X size={16} strokeWidth={2.8} /></button>
        </div>
        <h2 id="shp-t">The Loft Shop Is Open</h2>
        <p className="shp-sub">Mind Loft merch is here.</p>
        <p className="shp-lede">Tees, hoodies, hats and mugs with the house mark, or a line like Smart-ish or Never skip brain day. Each one is made to order and shipped to&nbsp;you.</p>
        <a className="shp-go" href="/community/shop" onClick={close}>Visit the Shop</a>
        <button type="button" className="shp-close" onClick={close}>Close</button>
      </div>
    </div>
  );
}

const CSS = `
.shp-scrim{position:fixed;inset:0;z-index:8000;display:flex;align-items:center;justify-content:center;padding:16px;
  background:rgba(6,10,18,.58);-webkit-backdrop-filter:blur(2px);backdrop-filter:blur(2px);}
.shp{width:min(460px,100%);max-height:88vh;overflow-y:auto;box-sizing:border-box;position:relative;
  background:var(--stg-surf,#ffffff);color:var(--stg-ink,#08222e);border:1px solid var(--stg-ink,#08222e);border-radius:16px;
  padding:20px 22px 12px;box-shadow:0 18px 50px rgba(0,0,0,.28);animation:shp-in .28s ease-out;
  font-family:'Manrope',system-ui,-apple-system,sans-serif;}
@keyframes shp-in{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:none}}
@media (prefers-reduced-motion:reduce){.shp{animation:none}}
.shp-top{display:flex;align-items:center;justify-content:space-between;gap:10px;}
.shp-eye{display:inline-flex;align-items:center;font-size:12px;font-weight:800;padding:6px 12px;border-radius:999px;background:#7dd3fc;color:${RAMP_INK};}
.shp-x{flex:none;display:inline-flex;align-items:center;justify-content:center;width:36px;height:36px;border-radius:50%;
  border:1px solid currentColor;background:transparent;color:inherit;cursor:pointer;padding:0;}
.shp h2{font-size:28px;font-weight:800;letter-spacing:-.015em;margin:14px 0 4px;line-height:1.12;text-wrap:balance;}
.shp-sub{margin:0 0 8px;font-size:16px;font-weight:800;}
.shp-lede{margin:0;font-size:14px;line-height:1.5;font-weight:600;opacity:.85;}
.shp-go{display:flex;align-items:center;justify-content:center;width:100%;min-height:50px;margin-top:18px;box-sizing:border-box;
  border-radius:999px;border:1px solid var(--stg-ink,#08222e);background:#7dd3fc;color:${RAMP_INK};
  font-size:16px;font-weight:800;text-decoration:none;}
.shp-go:hover{filter:brightness(1.04);}
.shp-close{display:block;width:100%;min-height:44px;margin-top:4px;border:0;background:transparent;color:inherit;opacity:.7;
  font:inherit;font-size:14px;font-weight:700;cursor:pointer;}
.shp-go:focus-visible,.shp-x:focus-visible,.shp-close:focus-visible{outline:3px solid var(--stg-acc-ink,var(--stg-acc,#2563eb));outline-offset:2px;}
@media (max-width:420px){ .shp{padding:18px 16px 10px;} .shp h2{font-size:25px;} }
`;
