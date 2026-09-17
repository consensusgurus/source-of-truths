"use client";

// GauntletPop — the once-a-day nudge to play the Trivia Gauntlet (owner,
// 2026-08-29; simplified and RE-SKINNED 2026-08-30).
//
// IT IS THE ONLY POP-UP LEFT ON THE SITE. The contest interstitial, its QR
// poster follow-on, the share sheet and the homepage install card all came off
// on 2026-08-30, so this is the one thing that appears without being asked
// for. That is why it says so little: the name of the run, what is in it, and
// a way to start it. Nothing else.
//
// IT WEARS THE RUN STAGE'S CLOTHES, NOT THE LANDING PAGE'S. This is the
// correction the owner made on 2026-08-30 ("looks nothing like our circuit
// aesthetic, not even the same fonts"). The first version copied
// /circuits/gauntlet, the LANDING page, which is white cards on navy in Manrope
// throughout. The Gauntlet a player actually sits inside is
// /circuits/gauntlet/run, and that surface has its own vocabulary, none of
// which the landing page uses:
//
//   * Near-black ground (T.ground), edge to edge, no white cards anywhere.
//     Panels are a faint white LIFT over it with a hairline border.
//   * DM MONO for every label, eyebrow and figure; Manrope only for a name.
//     This is the tell the owner spotted: a card with no mono on it cannot
//     read as part of this stage.
//   * SKY as the call to action, #7dd3fc on #08222e ink, never the brand CTA
//     blue. RunNextUp's own comment is the rule: "this stage's colour family is
//     the ladder ramp, and every hue in it is a light pastel carrying dark ink."
//   * A game is identified by its LADDER colour, rampFor(circuitSlotFor(...)),
//     which is deliberately NOT its registry colour (see LADDER_RAMP in
//     lib/circuits). Each row carries it as a rung down its left edge, which is
//     a slice of the ladder the run is drawn on.
//
// Anything changed here should be changed against that page, not against the
// landing card and not against the site's light surfaces.
//
// THE HEADING IS THE STAGE'S OWN TWO-LINE IDENTITY BLOCK, a mono eyebrow over
// a sans name, exactly as the run cap sets "RUN COMPLETE / Trivia Gauntlet". It
// reads "Daily Trivia Gauntlet" without spending a fourth line to say so.
//
// DEEP NAMES ITS DAY'S TOPIC; THE OTHER SIX NAME THEIR SUBJECT (owner,
// 2026-08-30). Every row is a registry `subject` except Deep's, whose subject
// is the word "Trivia" — which on a list of seven trivia quizzes says nothing
// at all. Deep is the one member with a DIFFERENT subject every day, so its row
// reads "Deep: Rivers". This is the same call the run stage already makes:
// `lineFor` in RunClient is `s.topic || s.subject || s.cat || s.tag`, so the
// topic wins wherever there is one.
//
// It is NOT a spoiler. Deep's own page prints "TODAY'S TOPIC" above the fold
// before a question is asked, and its share line names it too: the topic is the
// premise, not an answer.
//
// THE BANK IS LOADED LAZILY, and that is the whole reason this is affordable.
// app/deep/puzzles.js is ~6KB gzipped and grows by a day every day; importing
// it at the top of a component that renders on the homepage would put it in
// every visitor's bundle for one word in a pop-up that fires once a day. The
// dynamic import inside the fire timer gives it its own chunk, fetched only
// when the pop-up has already decided to open, and awaited BEFORE `open` flips
// so the list never appears and then re-renders under the reader. A failed
// import is not a failure: the row falls back to a bare "Deep".
//
// THREE CONDITIONS, all of them required, and the reason for each:
//
//   READY. The prompt waits for the day's combined board, which is the
//   SERVER's word on what this player has already played. Acting on this
//   device's breadcrumbs alone would nudge somebody who ran the Gauntlet on
//   their phone an hour ago. A short delay on top of that lets the three play
//   passes in TodayClient settle before anything is decided.
//
//   UNPLAYED. Not a single game of the circuit finished today. Somebody who
//   is three games in does not need to be told to start.
//
//   FIRST VISIT OF THE DAY. Stamped in localStorage under the ET date the
//   moment it is shown, so a reload, a second tab, or coming back after
//   dinner is silent. It is per device and per browser by nature, which is the
//   right grain for something whose whole job is to not become wallpaper.

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { X } from 'lucide-react';
import { circuitGamesFor, circuitName, circuitSlotFor, rampFor, runHref } from '@/lib/circuits';
import { T } from '@/lib/theme';

const STORE = 'sot_gauntlet_nudge';
const ID = 'gauntlet';
const WAIT_MS = 1500;

const SANS = "'Manrope', system-ui, -apple-system, sans-serif";
const MONO = "'DM Mono', ui-monospace, 'SFMono-Regular', monospace";

export default function GauntletPop({ ready = false, unplayed = false, day = '' }) {
  const [open, setOpen] = useState(false);
  // Deep's topic for `day`, resolved from the lazily imported bank. Null until
  // it lands, and null forever if the import fails.
  const [deepTopic, setDeepTopic] = useState(null);
  const fired = useRef(false);
  // The timer fires later than it was set, so it must read the CURRENT props
  // rather than the ones it closed over: `unplayed` flips as the passes land.
  const live = useRef({ unplayed, day });
  live.current = { unplayed, day };

  const close = useCallback(() => setOpen(false), []);

  useEffect(() => {
    if (!ready || !day || fired.current) return undefined;
    let alive = true;
    const t = setTimeout(async () => {
      const now = live.current;
      if (fired.current || !now.unplayed || !now.day) return;
      // A browser that refuses storage (private mode, blocked cookies) gets
      // the prompt once per page load rather than never: the read failing is
      // not evidence it has been seen.
      try { if (localStorage.getItem(STORE) === now.day) return; } catch (e) {}
      try { localStorage.setItem(STORE, now.day); } catch (e) {}
      fired.current = true;
      // Deep's day topic, in its own chunk, awaited before the pop-up appears
      // so the row is complete on first paint. `dayFor`'s rule, not an exact
      // date match: the latest puzzle already live, so a gap in the bank falls
      // back to the last one rather than blanking the row.
      try {
        const mod = await import('../deep/puzzles');
        const started = (mod.PUZZLES || []).filter((p) => p.live <= now.day);
        const today = started.length ? started[started.length - 1] : null;
        if (alive && today && today.topic) setDeepTopic(today.topic);
      } catch (e) { /* no topic: the row reads a bare "Deep" */ }
      if (alive) setOpen(true);
    }, WAIT_MS);
    return () => { alive = false; clearTimeout(t); };
  }, [ready, day]);

  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e) => { if (e.key === 'Escape') close(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, close]);

  // Today's roster, in today's run order, through the same accessor the run
  // and the landing page use, so a roster change or the daily shuffle reaches
  // this pop-up with no edit. The COLOUR comes off the canonical slot rather
  // than the shuffled position, exactly as the ladder does it, so a category
  // keeps its hue from one morning to the next.
  const games = useMemo(() => {
    if (!day) return [];
    try {
      return circuitGamesFor(ID, day).map((g) => ({
        key: g.key,
        // Deep is the only member whose subject changes daily, so it names its
        // game and its topic; the other six name the subject that IS their
        // identity. See the note at the top.
        label: g.key === 'deep'
          ? (deepTopic ? `${g.name}: ${deepTopic}` : g.name)
          : (g.subject || g.cat),
        color: rampFor(circuitSlotFor(ID, g.key)),
      }));
    } catch (e) { return []; }
  }, [day, deepTopic]);

  if (!open) return null;

  return (
    <div className="gnp-bd" role="dialog" aria-modal="true" aria-labelledby="gnp-h" onClick={close}>
      <style dangerouslySetInnerHTML={{ __html: CSS }} />
      <div className="gnp" onClick={(e) => e.stopPropagation()}>
        <button type="button" className="gnp-x" onClick={close} aria-label="Close">
          <X size={14} strokeWidth={2.4} />
        </button>

        <i className="gnp-e">Daily</i>
        <h2 className="gnp-h" id="gnp-h">{circuitName(ID)}</h2>

        <ul className="gnp-list">
          {games.map((g) => (
            <li key={g.key} className="gnp-row" style={{ '--rung': g.color }}>
              <s className="gnp-rung" aria-hidden="true" />
              {g.label}
            </li>
          ))}
        </ul>

        <a className="gnp-go" href={runHref(ID)}>Play</a>
      </div>
    </div>
  );
}

const CSS = `
.gnp-bd{position:fixed;inset:0;z-index:4000;display:flex;align-items:center;justify-content:center;
        padding:20px;background:rgba(3,6,14,.74);backdrop-filter:blur(2px);
        animation:gnpfade .18s ease-out;}
/* The stage's ground, its hairline and its lift. No white card anywhere. */
.gnp{position:relative;width:100%;max-width:340px;max-height:calc(100vh - 40px);overflow-y:auto;
     background:${T.ground};border:1px solid rgba(255,255,255,.14);border-radius:13px;
     padding:20px 20px 18px;font-family:${SANS};color:#eef2fa;
     box-shadow:0 24px 64px rgba(0,0,0,.6);animation:gnprise .2s ease-out;}
.gnp-x{position:absolute;top:10px;right:10px;background:transparent;border:none;color:#66748f;
       cursor:pointer;padding:5px;line-height:0;border-radius:7px;}
.gnp-x:hover{color:#fff;background:rgba(255,255,255,.07);}
.gnp-x:focus-visible{outline:2px solid #7dd3fc;outline-offset:2px;}
/* Eyebrow over name: the run cap's own identity block. */
.gnp-e{display:block;font-style:normal;font-family:${MONO};font-size:9.5px;letter-spacing:.15em;
       text-transform:uppercase;color:#66748f;margin-bottom:3px;}
.gnp-h{font-size:22px;font-weight:800;letter-spacing:-.02em;line-height:1.1;color:#fff;margin:0 26px 0 0;}
.gnp-list{list-style:none;margin:14px 0 0;padding:0;display:flex;flex-direction:column;gap:5px;}
/* A row is a faint lift with a hairline, and the ladder rung down its left is
   what names the game. Not a white card and not a border-left: the rung is a
   short bar with its own radius, the way a rung reads on the ladder. */
.gnp-row{display:flex;align-items:center;gap:11px;background:rgba(255,255,255,.05);
         border:1px solid rgba(255,255,255,.14);border-radius:9px;padding:9px 12px;
         font-size:13px;font-weight:800;letter-spacing:-.01em;color:#eef2fa;}
.gnp-rung{flex:none;width:3px;height:15px;border-radius:2px;background:var(--rung,#7dd3fc);
          text-decoration:none;}
/* SKY, never the brand CTA blue. This stage's colour family is the ladder ramp
   and every hue in it is a light pastel carrying dark ink. */
.gnp-go{display:block;margin-top:15px;background:#7dd3fc;color:#08222e;border:none;border-radius:9px;
        padding:12px 18px;font-family:${SANS};font-size:13.5px;font-weight:800;letter-spacing:.02em;
        text-align:center;text-decoration:none;cursor:pointer;}
.gnp-go:hover{filter:brightness(1.06);}
.gnp-go:focus-visible{outline:2px solid #7dd3fc;outline-offset:2px;}
@keyframes gnpfade{from{opacity:0}to{opacity:1}}
@keyframes gnprise{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:none}}
@media(max-width:520px){
  .gnp{padding:18px 16px 16px;}
  .gnp-h{font-size:20px;}
}
@media(prefers-reduced-motion:reduce){
  .gnp-bd,.gnp{animation:none;}
}
`;
