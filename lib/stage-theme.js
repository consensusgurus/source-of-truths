'use client';
// THE STAGE'S LIGHT SWITCH.
//
// The stage draws its own one-line cap and nothing else, so there is no site
// header on a game page to hang a theme control from. The control has to live
// in the cap, and the cap has exactly one line, so it is a GLYPH beside Home
// rather than a labelled button. That is also why the preference is stored
// rather than passed: the cap and the page root are two different components,
// and threading a prop between them would mean editing every client's call
// site for a control that has nothing to do with the game.
//
// TWO READERS, ONE VALUE. The page root writes data-stage-theme on the root
// element; the cap draws the switch. Both read this store, so they cannot
// disagree, and a toggle repaints both without a round trip.
//
// LIGHT IS THE DEFAULT (owner, 2026-09-01). The site shipped dark-first and
// spent a month having light pointed at, and the owner's call is that light is
// simply what the site looks like now. Two consequences, and the second is the
// one that costs something:
//
//   - FIRST PAINT IS LIGHT, on the server and on the client alike. The server
//     cannot know what is in localStorage, so resolving the real value during
//     render makes the client's first paint disagree with the server's and
//     React throws (the rule isSundayET follows). So the SSR value is the
//     DEFAULT, and the default moved. A reader who has explicitly chosen dark
//     still gets one light frame before the effect resolves, which is the same
//     trade a light-preference reader paid in the other direction until today.
//   - THE STORED KEY IS VERSIONED, and that is the reset. The owner asked for
//     every reader to land on light, not just the ones with nothing stored, and
//     a stored 'dark' from the dark-first era is mostly an artefact of the
//     register the site used to open in. Reading a NEW key starts every browser
//     on the new default without a migration script and without a moment where
//     the site has to guess whether an old value was a choice or an accident.
//     The old key is left where it is, unread. Any future change to what the
//     default IS takes another new key, never an edit to the fallback: a
//     browser that stamped the old key would otherwise be shut out of the
//     change by its own stamp, which is the rule every once-per-browser gate on
//     this site already follows.
import { useEffect, useState } from 'react';
import { flushSync } from 'react-dom';

const KEY = 'sot_theme2';
const subs = new Set();
// The register the first-load demonstration is FORCING, or null. It is read by
// readStageTheme rather than only pushed to subscribers, because a client root
// mounts AFTER the cap inside it and would otherwise resolve its own stored
// value a beat later and overwrite the demonstration mid-step. See
// useThemeIntro.
let introShow = null;

export function readStageTheme() {
  // While the demonstration is playing it IS the answer, for every reader of
  // the store. Nothing is written, so the moment it ends this falls straight
  // back through to the reader's own stored value.
  if (introShow) return introShow;
  try {
    // ?theme= is a REVIEW override and deliberately does not persist: a link
    // shared to look at one register should not silently change the reader's
    // own setting for every other game.
    const q = new URLSearchParams(window.location.search).get('theme');
    if (q === 'light' || q === 'dark') return q;
    const s = window.localStorage.getItem(KEY);
    if (s === 'light' || s === 'dark') return s;
  } catch (e) {}
  return 'light';
}

// A ?theme= override is a REVIEW STATE, not a preference, and it has to TRAVEL
// or it is worse than useless: the page you are looking at honours it, the
// first link you follow does not, and the register flips underneath you
// (owner, 2026-08-31: "when i click from dark background home page to
// individual game page, it swaps to light background" — a dark ?theme=dark
// home handing off to a game that read the stored 'light'). Appending it to
// in-app stage links keeps a review session in one register while still never
// touching what is stored, which is the whole point of the override.
//
// Returns '' during SSR and on first paint, then the real value, because a
// link whose href differs between the server and the client is a hydration
// mismatch. Use the hook, not this, inside a component.
export function themeQs() {
  try {
    const q = new URLSearchParams(window.location.search).get('theme');
    if (q === 'light' || q === 'dark') return '&theme=' + q;
  } catch (e) {}
  return '';
}

export function useThemeQs() {
  const [qs, set] = useState('');
  useEffect(() => { set(themeQs()); }, []);
  return qs;
}

// THE LIGHT SWITCH IS EASY TO MISS, so a first-time visitor gets ONE pointer at
// it: a ring that pulses out of the glyph a few times and then never again
// (owner, 2026-08-31). Rules that keep it from becoming a nag:
//
//   - It fires once per BROWSER, not once per surface, so whichever page loads
//     first claims it. The flag is written the moment it fires, not when the
//     animation ends, so a reload mid-pulse cannot replay it.
//   - EVERY reader gets it, including one who already has a stored preference
//     (owner, 2026-08-31). Having toggled the switch once months ago is not the
//     same as knowing it is there, and the ring costs a reader who does know it
//     three pulses.
//   - prefers-reduced-motion is honoured by skipping it entirely rather than
//     showing a still frame of it.
// The KEY IS VERSIONED. Widening who sees this is worthless if the browsers
// that already stamped the old key are excluded by their own stamp, so a change
// to who qualifies takes a new key rather than an edit to the gate.
const HINT_KEY = 'sot_theme_hinted2';

export function useThemeHint() {
  const [hint, setHint] = useState(false);
  useEffect(() => {
    let t;
    try {
      if (window.localStorage.getItem(HINT_KEY)) return undefined;
      const still = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      window.localStorage.setItem(HINT_KEY, '1');
      if (still) return undefined;
      setHint(true);
      t = setTimeout(() => setHint(false), 6000);
    } catch (e) {}
    return () => { if (t) clearTimeout(t); };
  }, []);
  return hint;
}

// THE FIRST LOAD PLAYS THE SWITCH ONCE (owner, 2026-08-31). The ring above says
// "there is a control here"; it cannot say what the control DOES. So the very
// first page a reader opens demonstrates it: the site comes up dark, goes
// light, and comes back to dark, with the register's name beside the glyph
// while it happens. Three rules keep it from being a stunt:
//
//   - IT NEVER WRITES A PREFERENCE. The flip is pushed to the store's
//     subscribers directly and nothing reaches localStorage, and it HANDS THE
//     READER BACK THEIR OWN REGISTER at the end, whatever it is. A reader with
//     no setting still has none and ends dark, which is what they would have
//     had anyway; a reader who chose light months ago is shown dark, then
//     light, and is left in light.
//   - EVERYONE GETS IT, ONCE (owner, 2026-08-31). Having a stored preference no
//     longer disqualifies a reader: most people who have one set it by accident
//     or long ago, and the point is that the control exists. The gate is the
//     flag alone, and the flag is VERSIONED, because widening who qualifies is
//     worthless if the browsers that already stamped the old key are shut out
//     by their own stamp. Bump INTRO_KEY, never loosen the check in place.
//   - The flag is written when it FIRES rather than when it ends, so a reload
//     mid-flip cannot replay it.
//   - TOUCHING THE SWITCH ENDS IT. A demonstration that flips the page back
//     under the reader's own hand a second after they clicked is worse than no
//     demonstration, so writeStageTheme cancels the remaining steps.
//
// Two skips remain. prefers-reduced-motion skips it entirely rather than
// showing a still frame, and a ?theme= review link skips it WITHOUT burning the
// flag, since flipping the page under that link defeats the one thing it is
// for and the reviewer still deserves their turn on an ordinary load.
const INTRO_KEY = 'sot_theme_intro2';
const INTRO_RETIRED = true;
// The cross-fade lives on the root for the few seconds this plays and comes
// straight back off: a permanent transition on every element of a stage page
// would make every board animate its own state changes.
const FLIP_CLASS = 'stg-flip';
let introLive = false;

// Notify without persisting. This is the whole difference between the
// demonstration and a real toggle.
function pushStageTheme(next) {
  for (const f of subs) f(next);
}

// RETIRED (owner, 2026-09-01, same push as Focus): the flip no longer plays.
// The explicit pop-up (useThemePop below) is the pointer that stays. The hook
// is kept as a no-op so the three caps' call sites and their `.stg-tlab` chip
// markup need no edit, and `introLive` stays false so the pop-up's wait poll
// is never held by it. The body below is the demonstration as it shipped,
// left in place behind the early return in case it is ever wanted again.
export function useThemeIntro() {
  const [showing, setShowing] = useState(null);
  useEffect(() => {
    if (INTRO_RETIRED) return undefined;
    const ts = [];
    let root = null;
    const end = () => {
      introLive = false;
      introShow = null;
      setShowing(null);
      if (root) root.classList.remove(FLIP_CLASS);
    };
    // One step of the demonstration: force the register for every reader of the
    // store, push it to the ones already mounted, and name it on the chip.
    const show = (t) => { introShow = t; pushStageTheme(t); setShowing(t); };
    try {
      if (window.localStorage.getItem(INTRO_KEY)) return undefined;
      const q = new URLSearchParams(window.location.search).get('theme');
      if (q === 'light' || q === 'dark') return undefined;   // review link: no flag burned
      const still = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      window.localStorage.setItem(INTRO_KEY, '1');
      if (still) return undefined;
      // Read the reader's own register BEFORE the first step forces one, since
      // that is where the demonstration has to leave them.
      const mine = readStageTheme();
      root = document.documentElement;
      root.classList.add(FLIP_CLASS);
      introLive = true;
      show('dark');
      const at = (ms, fn) => ts.push(setTimeout(() => { if (!introLive) { end(); return; } fn(); }, ms));
      at(900, () => show('light'));
      at(2400, () => { introShow = null; pushStageTheme(mine); setShowing(mine); });
      at(3800, end);
    } catch (e) {}
    return () => {
      for (const t of ts) clearTimeout(t);
      // A cap that unmounts mid-flip must not leave the reader stranded in a
      // register they never chose, so the cleanup drops the forced value FIRST
      // and then puts the stored one back. Dropping it first is the whole
      // point: readStageTheme answers with the forced register while it is set.
      if (introLive) { introLive = false; introShow = null; pushStageTheme(readStageTheme()); }
      if (root) root.classList.remove(FLIP_CLASS);
    };
  }, []);
  return showing;
}

// THE EXPLICIT POINTER (owner, 2026-09-01). The ring above says "a control is
// here" and the flip below shows what it does, and neither one ever says the
// WORDS. A reader who is not watching the cap at second one gets nothing from
// either, so a first-time reader now also gets a pop-up anchored to the glyph
// (app/ThemePop.jsx): it names the register, points at the switch, and carries
// the switch itself so the icon never has to be found.
//
// IT MIRRORED WHEN THE DEFAULT DID (owner, 2026-09-01, same push). The bubble
// used to offer light, because a reader arrived in dark. They now arrive in
// light, so it offers DARK, and the group it skips flips with it: a reader with
// 'dark' already STORED chose the register, so they have found the control and
// pointing at it is a nag. It is the STORED value that is tested and never the
// rendered one, because ?theme=dark is a review state rather than a choice, and
// that link is skipped on its own account anyway.
//
//   - ONCE PER BROWSER, on a KEY OF ITS OWN. "Starting now" means a new key,
//     never a loosened check on an old one: every gate on this site that fires
//     once is versioned, because widening who qualifies is worthless if the
//     browsers that stamped the old key are shut out by their own stamp.
//   - IT WAITS FOR WHATEVER ELSE OWNS THE ARRIVAL. The flip runs ~3.8s and the
//     home's doorway ~4.5s, and a bubble explaining a control while the page
//     changes colour underneath it, or behind a full-screen flood, is worse
//     than no bubble. The wait is a POLL rather than a fixed delay, so it
//     cannot depend on which hook's effect happened to run first, and it reads
//     the doorway off the DOM because that component is a stranger to this one.
//   - THE FLAG IS BURNED WHEN IT OPENS, not when it is dismissed, so a reload
//     while it is up cannot replay it.
//   - TOUCHING THE SWITCH CLOSES IT, its own button included: writeStageTheme
//     notifies the pop-up exactly as it cancels the flip.
// VERSIONED AGAIN, because "everyone's first visit from here forward" (owner,
// 2026-09-01) is a wider audience than the key already holds: the browsers that
// were shown the old bubble are exactly the ones that stamped the old key, and
// the bubble they were shown offered the register they are now already in. A
// new key is the only thing that reaches them. As everywhere else on this site,
// widen by bumping, never by loosening the check in place.
const POP_KEY = 'sot_theme_pop2';
const POP_WAIT = 1100;   // let the page settle before anything is asked of it
const POP_POLL = 400;
const popSubs = new Set();

export function useThemePop() {
  const [open, setOpen] = useState(false);
  useEffect(() => {
    let t = 0;
    let alive = true;
    const close = () => setOpen(false);
    try {
      if (window.localStorage.getItem(POP_KEY)) return undefined;
      const q = new URLSearchParams(window.location.search).get('theme');
      if (q === 'light' || q === 'dark') return undefined;   // review link: no flag burned
      if (window.localStorage.getItem(KEY) === 'dark') {
        // Already chose dark, so they know the control. The flag IS burned
        // here, so switching back to light later cannot summon a pointer at a
        // switch they have demonstrably already used.
        window.localStorage.setItem(POP_KEY, '1');
        return undefined;
      }
    } catch (e) { return undefined; }
    const busy = () => introLive || !!document.querySelector('.stw');
    const tick = () => {
      if (!alive) return;
      if (busy()) { t = setTimeout(tick, POP_POLL); return; }
      try { window.localStorage.setItem(POP_KEY, '1'); } catch (e) {}
      setOpen(true);
    };
    t = setTimeout(tick, POP_WAIT);
    popSubs.add(close);
    return () => { alive = false; clearTimeout(t); popSubs.delete(close); };
  }, []);
  return [open, () => setOpen(false)];
}

// THE BOOT STAMP FOLLOWS THE STORE. app/layout.js writes data-stage-boot on
// <html> before first paint and globals.css suppresses the light register while
// it reads 'dark'. That is only correct while it keeps up: a reader who
// switches to light would otherwise be held in dark by a stamp taken at load.
function stampBoot(t) {
  try { document.documentElement.setAttribute('data-stage-boot', t); } catch (e) {}
}

// THE REGISTER WIPES FROM THE SWITCH (owner, 2026-09-16, motion pass). A
// toggle used to repaint the whole page in one frame. Where the browser has
// document.startViewTransition, the write now runs inside one, and
// app/globals.css grows the new register out of the point the reader pressed
// as a circle (html.stg-wipe, --stg-wipe-x/y). Three rules:
//   - THE ORIGIN IS THE LAST POINTER PRESS, captured by one document listener
//     the store installs on first use, so none of the eight caps that call
//     this had to learn to pass an event. A press older than a second (a
//     keyboard toggle, the pop-up's own button reached by tab) wipes from the
//     top right, where every cap keeps its switch.
//   - THE WRITE IS THE SAME WRITE. The store, the stamp and the subscribers
//     are all updated inside the transition callback exactly as they were
//     outside it, so a browser without the API, or a reader with
//     prefers-reduced-motion, gets the old instant switch byte for byte.
//   - The class comes off when the transition finishes, so no other view
//     transition on the site inherits the circle.
let lastPress = null;
let pressHooked = false;
function hookPress() {
  if (pressHooked) return;
  pressHooked = true;
  try {
    document.addEventListener('pointerdown', (e) => {
      lastPress = { x: e.clientX, y: e.clientY, t: Date.now() };
    }, { capture: true, passive: true });
  } catch (e) {}
}

function commitStageTheme(next) {
  stampBoot(next);
  // A reader who has touched the switch has learned it. The demonstration stops
  // where it is rather than flipping the page back under their hand, and drops
  // its forced register so this write is what the store reads from here on.
  introLive = false;
  introShow = null;
  // A reader with their hand on the switch does not need it pointed at, and
  // the pop-up's own button lands here too, so this is what closes it.
  for (const f of popSubs) f();
  try { window.localStorage.setItem(KEY, next); } catch (e) {}
  for (const f of subs) f(next);
}

export function writeStageTheme(next) {
  let wipe = null;
  try {
    const still = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (!still && typeof document.startViewTransition === 'function') wipe = document.documentElement;
  } catch (e) {}
  if (!wipe) { commitStageTheme(next); return; }
  const fresh = lastPress && Date.now() - lastPress.t < 1000 ? lastPress : null;
  const x = fresh ? fresh.x : window.innerWidth - 24;
  const y = fresh ? fresh.y : 24;
  wipe.style.setProperty('--stg-wipe-x', x + 'px');
  wipe.style.setProperty('--stg-wipe-y', y + 'px');
  wipe.classList.add('stg-wipe');
  let vt = null;
  try {
    // flushSync so the new register is IN THE DOM when the callback returns:
    // the browser takes its second snapshot at the next rendering opportunity
    // and a state update left to the microtask queue can miss it.
    vt = document.startViewTransition(() => { flushSync(() => commitStageTheme(next)); });
  } catch (e) {
    wipe.classList.remove('stg-wipe');
    commitStageTheme(next);
    return;
  }
  const off = () => wipe.classList.remove('stg-wipe');
  if (vt && vt.finished && vt.finished.then) vt.finished.then(off, off);
  else setTimeout(off, 700);
}

export function useStageTheme() {
  // The DEFAULT, not a literal: this is what the server renders and what the
  // client hydrates against, so it has to be whatever readStageTheme falls back
  // to or the first paint disagrees with itself.
  const [theme, set] = useState('light');
  useEffect(() => {
    hookPress();
    const now = readStageTheme();
    set(now);
    // A ?theme= review link never reaches localStorage, so the boot script's
    // read and this one can differ on the first stage page of a review
    // session. Resolving it here keeps the CSS guard honest either way.
    stampBoot(now);
    const f = (t) => set(t);
    subs.add(f);
    return () => { subs.delete(f); };
  }, []);
  return [theme, writeStageTheme];
}
