"use client";

// TriviaDoorPop — the one thing a visitor who came in through /trivia is told
// about the rest of the site (owner, 2026-09-03).
//
// /trivia is printed and said out loud: it is the Gauntlet's front door for
// people who have never seen Mind Loft. They land straight on the run, play
// seven quizzes, and reach a scorecard that, in its own words, "does not
// navigate away". So a first-timer can finish the whole thing without ever
// learning there is a site behind it. This card says so, once, after the run
// is over, and points at the home.
//
// IT FIRES FOR EXACTLY ONE KIND OF PERSON, and each condition is a reason:
//
//   THROUGH THE DOOR. /trivia forwards to the run with `?via=trivia` on the
//   address (lib/trivia-door). Somebody who typed /circuits/gauntlet/run, or
//   followed a link from inside the site, already knows the site is there.
//
//   NEW TO THE SITE. No visitor id yet, or one minted on this very page load
//   (lib/visitor stamps `sot_vid_born` when it mints, for exactly this kind of
//   question), and no saved identity. A returning player who used the short
//   address is not told what they already play.
//
//   AFTER THE RUN, on the scorecard, and two seconds into looking at it. Not
//   during the curtain, which is the run's own ending and has its own timing,
//   and not the instant the card lands: the score is the thing they came for
//   and it gets read first.
//
//   ONCE, EVER. The arrival is stamped 'armed' in localStorage the moment it
//   is read, and flipped to 'shown' the moment the card opens, so a reload, a
//   second run tomorrow, or the door used twice is silent.
//
// The arrival is stamped at MOUNT and the card decides at the FINISH, and
// they are separate on purpose: the run page is left, resumed and reloaded,
// and by the finish the address has long since been cleaned. The stamp is
// what survives.
//
// IT WEARS THE RUN STAGE'S CLOTHES, exactly as app/today/GauntletPop.jsx does
// and for the same reason: near-black ground, DM Mono eyebrow, sky call to
// action carrying dark ink. Read the note at the top of that file before
// changing anything visual here; the two should stay one family.
//
// THE FIGURE IS THE LIVE ROSTER, liveDailyKeys() off the registry, so a launch
// or a retirement changes the sentence with no edit here. It is computed at
// open, not at import, because the roster is a function of today's date.

import { useCallback, useEffect, useRef, useState } from 'react';
import { X } from 'lucide-react';
import { liveDailyKeys } from '@/lib/daily-games';
import { DOOR_PARAM, DOOR_VALUE, DOOR_STORE } from '@/lib/trivia-door';
import { T } from '@/lib/theme';

const WAIT_MS = 2000;
const PREVIEW_PARAM = 'door';
const PREVIEW_VALUE = 'preview';
// A visitor id minted within this window is one minted on THIS page load.
const FRESH_MS = 60 * 1000;

const SANS = "'Manrope', system-ui, -apple-system, sans-serif";
const MONO = "'DM Mono', ui-monospace, 'SFMono-Regular', monospace";

// Did this page load arrive through the door as somebody new? Reads the
// address once, stamps the answer, and cleans the address either way so a
// copied link or a share never carries the door with it.
function readArrival() {
  if (typeof window === 'undefined') return;
  let through = false;
  let preview = false;
  try {
    const u = new URL(window.location.href);
    through = u.searchParams.get(DOOR_PARAM) === DOOR_VALUE;
    preview = u.searchParams.get(PREVIEW_PARAM) === PREVIEW_VALUE;
    if (u.searchParams.has(DOOR_PARAM) || u.searchParams.has(PREVIEW_PARAM)) {
      u.searchParams.delete(DOOR_PARAM);
      u.searchParams.delete(PREVIEW_PARAM);
      window.history.replaceState(window.history.state, '', u.pathname + u.search + u.hash);
    }
  } catch (e) { return; }
  // THE PREVIEW SWITCH (owner, 2026-09-03: "i didnt see the popup"). The real
  // gates mean the owner, who has an identity on every device, can never see
  // this card by playing. ?door=preview on the run address arms it for this
  // browser regardless of who they are or whether it has shown before, same
  // idea as ?premiere=1. On a run already finished today it opens two seconds
  // after the card; otherwise it waits for the finish like any arrival.
  if (preview) {
    try { localStorage.setItem(DOOR_STORE, 'armed'); } catch (e) {}
    return;
  }
  if (!through) return;
  try {
    if (localStorage.getItem(DOOR_STORE)) return;
    if (localStorage.getItem('sot_quiz_identity')) return;
    const anon = localStorage.getItem('sot_quiz_anon');
    const born = Number(localStorage.getItem('sot_vid_born')) || 0;
    const isNew = !anon || (born && Date.now() - born < FRESH_MS);
    if (!isNew) return;
    localStorage.setItem(DOOR_STORE, 'armed');
  } catch (e) { /* storage refused: nothing to arm, nothing to show */ }
}

export default function TriviaDoorPop({ ready = false }) {
  const [open, setOpen] = useState(false);
  const [count, setCount] = useState(0);
  const fired = useRef(false);

  const close = useCallback(() => setOpen(false), []);

  // The arrival, read once at mount. Whether the layout's beacon has minted a
  // visitor id yet does not matter: an id born inside the last minute is one
  // born on this page load, and readArrival treats it as none.
  useEffect(() => { readArrival(); }, []);

  useEffect(() => {
    if (!ready || fired.current) return undefined;
    let armed = false;
    try { armed = localStorage.getItem(DOOR_STORE) === 'armed'; } catch (e) {}
    if (!armed) return undefined;
    const t = setTimeout(() => {
      if (fired.current) return;
      fired.current = true;
      try { localStorage.setItem(DOOR_STORE, 'shown'); } catch (e) {}
      setCount(liveDailyKeys().length);
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
    <div className="tdp-bd" role="dialog" aria-modal="true" aria-labelledby="tdp-h" onClick={close}>
      <style dangerouslySetInnerHTML={{ __html: CSS }} />
      <div className="tdp" onClick={(e) => e.stopPropagation()}>
        <button type="button" className="tdp-x" onClick={close} aria-label="Close">
          <X size={14} strokeWidth={2.4} />
        </button>

        <i className="tdp-e">Mind Loft</i>
        <h2 className="tdp-h" id="tdp-h">{count} daily puzzles to sharpen your mind</h2>
        <p className="tdp-p">
          The Trivia Gauntlet is one of them. Word games, logic, numbers, sudoku,
          geography and more, a fresh board of each every day, all free.
        </p>

        <a className="tdp-go" href="/">See all the puzzles</a>
      </div>
    </div>
  );
}

const CSS = `
.tdp-bd{position:fixed;inset:0;z-index:4000;display:flex;align-items:center;justify-content:center;
        padding:20px;background:rgba(3,6,14,.74);backdrop-filter:blur(2px);
        animation:tdpfade .18s ease-out;}
/* The stage's ground, its hairline and its lift. No white card anywhere. */
.tdp{position:relative;width:100%;max-width:340px;max-height:calc(100vh - 40px);overflow-y:auto;
     background:${T.ground};border:1px solid rgba(255,255,255,.14);border-radius:13px;
     padding:20px 20px 18px;font-family:${SANS};color:#eef2fa;
     box-shadow:0 24px 64px rgba(0,0,0,.6);animation:tdprise .2s ease-out;}
.tdp-x{position:absolute;top:10px;right:10px;background:transparent;border:none;color:#66748f;
       cursor:pointer;padding:5px;line-height:0;border-radius:7px;}
.tdp-x:hover{color:#fff;background:rgba(255,255,255,.07);}
.tdp-x:focus-visible{outline:2px solid #7dd3fc;outline-offset:2px;}
/* Eyebrow over name: the run cap's own identity block. */
.tdp-e{display:block;font-style:normal;font-family:${MONO};font-size:9.5px;letter-spacing:.15em;
       text-transform:uppercase;color:#66748f;margin-bottom:3px;}
.tdp-h{font-size:22px;font-weight:800;letter-spacing:-.02em;line-height:1.1;color:#fff;margin:0 26px 0 0;}
.tdp-p{margin:12px 0 0;font-size:13.5px;line-height:1.5;color:#9aa8c4;}
/* SKY, never the brand CTA blue: this stage's colour family is the ladder ramp
   and every hue in it is a light pastel carrying dark ink. */
.tdp-go{display:block;margin-top:15px;background:#7dd3fc;color:#08222e;border:none;border-radius:9px;
        padding:12px 18px;font-family:${SANS};font-size:13.5px;font-weight:800;letter-spacing:.02em;
        text-align:center;text-decoration:none;cursor:pointer;}
.tdp-go:hover{filter:brightness(1.06);}
.tdp-go:focus-visible{outline:2px solid #7dd3fc;outline-offset:2px;}
@keyframes tdpfade{from{opacity:0}to{opacity:1}}
@keyframes tdprise{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:none}}
@media(max-width:520px){
  .tdp{padding:18px 16px 16px;}
  .tdp-h{font-size:20px;}
}
@media(prefers-reduced-motion:reduce){
  .tdp-bd,.tdp{animation:none;}
}
`;
