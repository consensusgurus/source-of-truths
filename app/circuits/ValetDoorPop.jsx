"use client";

// ValetDoorPop — the offer, on Parker, Impound or Junkyard, to play all three
// as the Valet Gauntlet instead (owner, 2026-09-05).
//
// IT FIRES FOR EXACTLY ONE KIND OF VISIT, and each condition is a reason:
//
//   ON THE START GATE, before a move. A player who has already started this
//   lot has chosen it; the run is offered before the choice, not after.
//
//   NONE OF THE THREE STARTED TODAY, on this device. The run deals today's
//   three boards, and a lot already begun on its own page would be banked
//   rather than raced, so the offer is only honest while all three are
//   untouched. The test is the day breadcrumb each solo client writes
//   (`sot_<key>_day`, present only once a move has been made or the day is
//   done, removed otherwise), which is the same signal the home slate reads.
//
//   TWICE, EVER (owner, 2026-09-05: "the user gets pushed to valet two times
//   before it not appearing again"). A lifetime count in localStorage, bumped
//   the moment the card opens, so a reload or a second game the same morning
//   spends a showing, and the third visit is silent for good. Taking the run
//   spends both.
//
//   NOT WHILE A RUN IS OPEN TODAY. A player mid-run who opens a lot's own page
//   already knows the run exists.
//
// IT WEARS THE RUN STAGE'S CLOTHES, as GauntletPop and TriviaDoorPop do:
// near-black ground, DM Mono eyebrow, the accent call to action carrying dark
// ink. The picture is the run's own valet and car, so the card looks like the
// thing it is offering.

import { useCallback, useEffect, useRef, useState } from 'react';
import { X } from 'lucide-react';
import { circuitKeysFor, circuitName, runHref } from '@/lib/circuits';
import { T } from '@/lib/theme';
import ValetScene from './ValetScene';

const ID = 'valet';
export const DOOR_COUNT_STORE = 'sot_valet_pop';
const MAX_SHOWINGS = 2;
const WAIT_MS = 900;

const SANS = "'Manrope', system-ui, -apple-system, sans-serif";
const MONO = "'DM Mono', ui-monospace, 'SFMono-Regular', monospace";

function etToday() {
  try { return new Date().toLocaleDateString('en-CA', { timeZone: 'America/New_York' }); }
  catch (e) { return new Date().toISOString().slice(0, 10); }
}

// Has this lot been started (or finished) today on this device?
function startedToday(key, today) {
  try {
    const raw = localStorage.getItem(`sot_${key}_day`);
    if (!raw) return false;
    const v = JSON.parse(raw);
    return !!(v && v.d === today);
  } catch (e) { return false; }
}

// Should the card open on this page load? Decided once, in an effect.
function shouldOffer() {
  const today = etToday();
  let shown = 0;
  try { shown = Number(localStorage.getItem(DOOR_COUNT_STORE)) || 0; } catch (e) { return false; }
  if (shown >= MAX_SHOWINGS) return false;
  try {
    const run = JSON.parse(localStorage.getItem(`sot_run_${ID}_${today}`) || 'null');
    if (run && run.phase && run.phase !== 'idle') return false;
  } catch (e) {}
  const keys = circuitKeysFor(ID, today);
  if (keys.length < 2) return false;
  return keys.every((k) => !startedToday(k, today));
}

export function spendValetOffer(all = false) {
  try {
    const shown = Number(localStorage.getItem(DOOR_COUNT_STORE)) || 0;
    localStorage.setItem(DOOR_COUNT_STORE, String(all ? MAX_SHOWINGS : shown + 1));
  } catch (e) {}
}

export default function ValetDoorPop({ ready = false, self = '' }) {
  const [open, setOpen] = useState(false);
  const fired = useRef(false);
  const close = useCallback(() => setOpen(false), []);

  useEffect(() => {
    if (!ready || fired.current) return undefined;
    const t = setTimeout(() => {
      if (fired.current) return;
      if (!shouldOffer()) return;
      fired.current = true;
      spendValetOffer();
      setOpen(true);
    }, WAIT_MS);
    return () => clearTimeout(t);
  }, [ready]);

  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e) => { if (e.key === 'Escape') close(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, close]);

  if (!open) return null;

  return (
    <div className="vdp-bd" role="dialog" aria-modal="true" aria-labelledby="vdp-h" onClick={close}>
      <style dangerouslySetInnerHTML={{ __html: CSS }} />
      <div className="vdp" onClick={(e) => e.stopPropagation()}>
        <button type="button" className="vdp-x" onClick={close} aria-label="Close">
          <X size={14} strokeWidth={2.4} />
        </button>
        <div className="vdp-pic"><ValetScene mode="arrive" compact /></div>
        <i className="vdp-e">Daily &middot; Logic</i>
        <h2 className="vdp-h" id="vdp-h">{circuitName(ID)}</h2>
        <p className="vdp-p">
          Parker, Impound and Junkyard back to back on one clock. Park the red car out of
          all three lots and the fastest run takes the day. Moves do not count.
        </p>
        <a className="vdp-go" href={runHref(ID)} onClick={() => spendValetOffer(true)}>Run all three</a>
        <button type="button" className="vdp-no" onClick={close}>Just {self || 'this one'}</button>
      </div>
    </div>
  );
}

const CSS = `
.vdp-bd{position:fixed;inset:0;z-index:4000;display:flex;align-items:center;justify-content:center;
        padding:20px;background:rgba(3,6,14,.74);backdrop-filter:blur(2px);animation:vdpfade .18s ease-out;}
.vdp{position:relative;width:100%;max-width:360px;max-height:calc(100vh - 40px);overflow-y:auto;
     background:${T.ground};border:1px solid rgba(255,255,255,.14);border-radius:13px;
     padding:16px 20px 18px;font-family:${SANS};color:#eef2fa;--stg-acc:#bef264;--stg-cell:#1a1d28;--stg-raise:#0e131f;
     --stg-line:rgba(255,255,255,.18);--stg-line2:#3a4256;--stg-mute:#8b95a8;
     box-shadow:0 24px 64px rgba(0,0,0,.6);animation:vdprise .2s ease-out;}
.vdp-x{position:absolute;top:10px;right:10px;background:transparent;border:none;color:#66748f;
       cursor:pointer;padding:5px;line-height:0;border-radius:7px;z-index:2;}
.vdp-x:hover{color:#fff;background:rgba(255,255,255,.07);}
.vdp-x:focus-visible{outline:2px solid #bef264;outline-offset:2px;}
.vdp-pic{margin:0 -6px 6px;}
.vdp-e{display:block;font-style:normal;font-family:${MONO};font-size:9.5px;letter-spacing:.15em;
       text-transform:uppercase;color:#66748f;margin-bottom:3px;}
.vdp-h{font-size:24px;font-weight:800;letter-spacing:-.02em;line-height:1.1;color:#fff;margin:0;}
.vdp-p{margin:10px 0 0;font-size:13.5px;line-height:1.5;color:#9aa8c4;font-weight:600;}
.vdp-go{display:block;margin-top:15px;background:#bef264;color:#08222e;border:none;border-radius:9px;
        padding:13px 18px;font-family:${SANS};font-size:14px;font-weight:800;letter-spacing:.02em;
        text-align:center;text-decoration:none;cursor:pointer;}
.vdp-go:hover{filter:brightness(1.06);}
.vdp-go:focus-visible{outline:2px solid #bef264;outline-offset:2px;}
.vdp-no{display:block;width:100%;margin-top:8px;background:transparent;border:1px solid rgba(255,255,255,.14);
        color:#9aa8c4;border-radius:9px;padding:10px 18px;font-family:${SANS};font-size:13px;font-weight:800;cursor:pointer;}
.vdp-no:hover{color:#fff;border-color:rgba(255,255,255,.3);}
@keyframes vdpfade{from{opacity:0}to{opacity:1}}
@keyframes vdprise{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:none}}
@media(max-width:520px){.vdp{padding:14px 16px 16px;}.vdp-h{font-size:22px;}}
@media(prefers-reduced-motion:reduce){.vdp-bd,.vdp{animation:none;}}
`;
