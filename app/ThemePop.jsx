'use client';
// THE EXPLICIT POINTER AT THE LIGHT SWITCH (owner, 2026-09-01).
//
// Two quieter pointers already existed and neither one ever says the words. The
// ring (useThemeHint) says only "there is a control here"; the first-load flip
// (useThemeIntro) shows what it DOES without naming it, and both are over in a
// few seconds. A reader who is not watching the cap at second one gets nothing
// from either. So a first-time reader now also gets this: a bubble under the
// glyph that names the register, points at the switch with an arrow, and
// carries the switch itself so they never have to find the icon at all.
//
// IT OFFERS THE REGISTER THE READER IS NOT IN, and that flipped with the
// default on 2026-09-01. The site opens light now, so the button writes 'dark';
// when it opened dark the same button wrote 'light'. The bubble's JOB is the
// sentence in the middle, which is register-neutral and says what the control
// is and where it lives, so the button is the demonstration rather than the
// point, exactly as the retired first-load flip was.
//
// IT IS A SIBLING OF THE SWITCH INSIDE THE CAP, not a portal to <body> and not
// position:fixed. Three reasons, in the order they cost something to learn:
//
//   1. THE PALETTE IS SCOPED TO .stage-page. Every --stg-* token is declared on
//      that element, and each client publishes its category accent as an inline
//      --stg-acc-dk / --stg-acc-lt on it, so a node portalled to <body> would
//      inherit none of them and would have to re-read them with
//      getComputedStyle and republish them as inline vars. A child of the cap
//      simply has them, in whichever register the reader is in.
//   2. NO CAP IS STICKY, so a fixed bubble would come away from the glyph on
//      the first scroll and need a scroll listener to chase it. An absolutely
//      positioned child of the cap scrolls with it for free.
//   3. It cannot live INSIDE the switch the way the flip's name chip does
//      (.stg-tlab, which gets away with it by being pointer-events:none): this
//      one holds buttons, and a button inside a button is invalid markup and
//      would fire the toggle on its way through.
//
// THE POSITION IS MEASURED, never written per cap. The three caps carry
// different paddings (20 / 22 / 22px) and the home's cap becomes a grid under
// 700px, so a constant would be wrong on two surfaces and wrong again on a
// phone. Measure the cap and the glyph, subtract, done.
//
// Mount it as the LAST CHILD of the cap. It reads its own parent to find the
// switch, so no ref is threaded through any cap and it takes no props.
import { useEffect, useRef, useState } from 'react';
import { useThemePop, writeStageTheme, useStageTheme, LIGHT_OFFER_KEY } from '@/lib/stage-theme';
import { gameActive } from '@/lib/game-active';

// The four caps that draw a switch: StageChrome (every daily), StageToday (the
// home), CircuitFrame (the circuit pages), StatHubClient (the Stat Hub). A
// fifth cap adds its class here.
const SWITCH = '.stg-theme, .sty-tg, .cfr-tg, .hub-tg';

// Measures the cap and the switch so the bubble sits under the glyph.
function usePlace(open, ref) {
  const [at, setAt] = useState(null);
  useEffect(() => {
    if (!open) { setAt(null); return undefined; }
    let raf = 0;
    const place = () => {
      const el = ref.current;
      const cap = el && el.parentElement;
      const btn = cap && cap.querySelector(SWITCH);
      if (!btn) { setAt(null); return; }
      const c = cap.getBoundingClientRect();
      const b = btn.getBoundingClientRect();
      if (!b.width) { setAt(null); return; }
      setAt({
        top: Math.round(b.bottom - c.top + 9),
        right: Math.round(Math.max(0, c.right - b.right)),
        // The arrow sits under the MIDDLE of the glyph. The bubble's right edge
        // is the glyph's right edge, so half the glyph's own width is the whole
        // offset, whatever the cap's padding happens to be.
        arrow: Math.round(Math.max(8, b.width / 2 - 6)),
      });
    };
    place();
    const on = () => { cancelAnimationFrame(raf); raf = requestAnimationFrame(place); };
    window.addEventListener('resize', on);
    return () => { window.removeEventListener('resize', on); cancelAnimationFrame(raf); };
  }, [open, ref]);
  return at;
}

const XIcon = () => (
  <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor"
    strokeWidth="2.4" strokeLinecap="round" aria-hidden="true">
    <path d="M6 6l12 12M18 6L6 18" />
  </svg>
);

// RETIRED (owner, 2026-10-19). The switch opens the page look menu now, and a
// new reader is introduced to it by the menu itself (app/LookSheet.jsx, the
// intro), so this bubble and the light offer below stand down. Both stay
// mounted and render nothing, so the caps need no edit; delete them together
// with their mounts when convenient.
export default function ThemePop() {
  return null;
}

function ThemePopRetired() {
  const [open, dismiss] = useThemePop();
  const ref = useRef(null);
  const at = usePlace(open, ref);

  if (!open) return null;

  // Rendered before it is placed, hidden rather than absent: the effect needs
  // the node in the document to measure its parent, so a bubble that waited for
  // its own coordinates could never get them.
  return (
    <div
      ref={ref}
      className="stg-tpop"
      role="dialog"
      aria-label="Light and dark mode"
      style={at ? { top: at.top, right: at.right } : { visibility: 'hidden' }}
    >
      <i className="stg-tpop-arw" style={{ right: at ? at.arrow : 12 }} aria-hidden="true" />
      {/* The X closes it, and there is no "Not now" beside it. That is the
          house pattern for a pop-up on this site: a second dismissal reads as
          a decision being asked for when none is. */}
      <button type="button" className="stg-tpop-x" onClick={dismiss} aria-label="Dismiss"><XIcon /></button>
      <b>This is the page look switch.</b>
      <p>It sets the whole site to light or dark, and how much color it wears. It sits in this bar on every page.</p>
      <button type="button" className="stg-tpop-go" onClick={() => writeStageTheme('dark')}>
        Switch to dark
      </button>
    </div>
  );
}

// THE LIGHT OFFER (owner, 2026-10-18). A new visitor who came in through the
// entry door lands in dark; this asks once whether they would rather have
// light. It shows ONLY on the start gate (no save for today's board carries a
// first move yet), never during play and never on a finished board, and comes
// back on the next gate until it is answered. Switching to light, keeping
// dark, or using the switch itself all answer it; the X only closes it here.
// Mounted by StageChrome, which knows the game and the board, and on the home
// cap (`home`), where a new visitor who proceeds from the door lands in dark.
export function LightOffer() {
  return null;
}

function LightOfferRetired({ gameKey, num, home = false }) {
  const [theme] = useStageTheme();
  const [state, setState] = useState('wait'); // wait | open | gone
  const ref = useRef(null);
  const at = usePlace(state === 'open', ref);

  useEffect(() => {
    if (!gameKey && !home) return undefined;
    // ON THE HOME there is no game to start, so it waits for the entry door
    // (and the other home cards) to clear, and asks only then: the door is
    // what sets the offer pending, as it closes.
    if (home) {
      let t = 0;
      const tick = () => {
        try {
          if (document.querySelector('.ent-door, .prm-scrim, .gpp-scrim')) { t = setTimeout(tick, 500); return; }
          if (window.localStorage.getItem(LIGHT_OFFER_KEY) !== 'pending') { setState('gone'); return; }
        } catch (e) { return; }
        t = setTimeout(() => setState((s) => (s === 'wait' ? 'open' : s)), 700);
      };
      t = setTimeout(tick, 900);
      return () => clearTimeout(t);
    }
    let pending = false;
    try { pending = window.localStorage.getItem(LIGHT_OFFER_KEY) === 'pending'; } catch (e) {}
    if (!pending) { setState('gone'); return undefined; }
    // With the board number known, any first move on that board counts. A
    // caller that does not know it (the desktop cap) asks whether a board of
    // this game was begun today instead.
    const known = num !== null && num !== undefined;
    const re = new RegExp('^sot_' + gameKey + '_' + (known ? num : '[0-9]+') + '(r[0-9]+)?$');
    const dayStart = (() => { const d = new Date(); d.setHours(0, 0, 0, 0); return d.getTime() - 12 * 3600 * 1000; })();
    const begun = () => {
      try {
        for (let i = 0; i < window.localStorage.length; i++) {
          const k = window.localStorage.key(i);
          if (!k || !re.test(k)) continue;
          const sv = JSON.parse(window.localStorage.getItem(k) || 'null');
          if (!sv) continue;
          if (known && (sv.t0 || (sv.status && sv.status !== 'playing'))) return true;
          if (!known && sv.t0 && sv.t0 > dayStart) return true;
        }
      } catch (e) {}
      return false;
    };
    if (begun()) { setState('gone'); return undefined; }
    const show = setTimeout(() => {
      if (begun() || gameActive()) { setState('gone'); return; }
      try { if (document.querySelector('.ent-door, .prm-scrim, .gpp-scrim')) return; } catch (e) {}
      setState((s) => (s === 'wait' ? 'open' : s));
    }, 1200);
    // The first move takes it away for this page.
    const poll = setInterval(() => { if (begun()) setState('gone'); }, 700);
    return () => { clearTimeout(show); clearInterval(poll); };
  }, [gameKey, num, home]);

  const answer = () => {
    try { window.localStorage.setItem(LIGHT_OFFER_KEY, 'done'); } catch (e) {}
    setState('gone');
  };
  // Using the switch is an answer too.
  useEffect(() => {
    if (state === 'open' && theme === 'light') answer();
  }, [theme, state]);

  if (state !== 'open' || theme !== 'dark') return null;
  return (
    <div
      ref={ref}
      className="stg-tpop"
      role="dialog"
      aria-label="Light mode offer"
      style={at ? { top: at.top, right: at.right } : { visibility: 'hidden' }}
    >
      <i className="stg-tpop-arw" style={{ right: at ? at.arrow : 12 }} aria-hidden="true" />
      <button type="button" className="stg-tpop-x" onClick={() => setState('gone')} aria-label="Close for now"><XIcon /></button>
      <b>Prefer light mode?</b>
      <p>You are seeing Mind Loft in dark. This switch changes it, and how much color it wears, on any page, any time.</p>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        <button type="button" className="stg-tpop-go" onClick={() => { answer(); writeStageTheme('light'); }}>
          Switch to light
        </button>
        <button type="button" className="stg-tpop-go stg-tpop-alt" onClick={answer}>
          Keep dark
        </button>
      </div>
    </div>
  );
}
