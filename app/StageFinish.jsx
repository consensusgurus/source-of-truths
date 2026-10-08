'use client';

// THE ENDING IS A CURTAIN — the stage pattern's last rule, and the last piece
// of it to get built. Until now every stage game borrowed the Loft's finish
// card: a white panel tuned for a navy page, opening at the end of a near-black
// one. It worked, but it was the one moment on the stage that belonged to a
// different design.
//
// A curtain is not a card. The whole point of the ending is that the page
// CHANGES STATE, and the stage has spent the entire game refusing to spend its
// colour on anything but meaning — so the ending is where the accent finally
// floods. One band, edge to edge, carrying the verdict. That is the moment;
// everything after it is quiet again.
//
// SAME DATA, SAME CONTRACT. It takes LoftFinish's own props, so no game client
// changes and the two endings cannot disagree about a result. It also keeps
// LoftFinish's ordering rules rather than inventing new ones: the tone ranking
// below is that component's, and it encodes real decisions (a reveal leads,
// because showing a player what they missed is the one thing they want first;
// 'similar' comes OUT of the grid because a finisher was passing two exits
// before reaching the one that hands them forward).
import { useEffect, useMemo, useRef, useState } from 'react';
import { DAILY_GAMES, liveDailyKeys } from '@/lib/daily-games';
import { RAMP_ORDER, RAMP_INK, categoryColor, categoryColorLight, categoryOnrampLight } from '@/lib/category-ramp';
import { finishPick } from '@/lib/finish-sets';
// THE REGISTER PICKS THE HUE, and this file is why that rule needs saying a
// second time. Every other stage surface publishes BOTH twins of its category
// step (--stg-acc-dk / --stg-acc-lt) and lets globals.css choose one; this one
// wrote the DARK ramp straight into an inline --tc, so on the light register a
// whole card of tiles and chips wore the near-black register's pastels on
// white. Two things went wrong at once, and only the first was reported: Logic
// came out LIME on a page painted GREEN (the ramp's one deliberate hue
// exception, categoryColorLight's own note), and all ten steps sat at 1.4-2:1
// against the white surface they were drawn on, so the left rule that says
// which category a tile belongs to could barely be seen at all.
//
// It cannot be fixed the usual way HERE: this component ships its CSS as a
// <style> TEXT CHILD, and React escapes an apostrophe inside one, so a
// [data-stage-theme='light'] selector would arrive at the CSS parser as
// &#x27; and the whole light block would be dropped on the floor (see
// scripts/verify-inline-style-quotes.mjs). So the choice is made in JS, which
// is what StageToday and PremierePop already do, and useStageTheme is what
// makes it repaint when the reader flips the switch with the card open.
import { useStageTheme } from '@/lib/stage-theme';
// ONE READING OF A BOARD ROW, shared with the tile panel and the stage's leader
// strip. See the file's own header: a row carries both the 0-15 placement points
// and what the player actually did, and only the second means anything next to
// the game they just played.
import { gameStats, mmss, missWord, scoreFig as runFig } from '@/lib/daily-row-stats';
import { isSolveOnly } from '@/lib/daily-games';
import { typicalLabel } from '@/lib/game-medians';
import GameGlyph from './GameGlyph';
import { savedIdentity } from '@/lib/saved-identity';
import { etTodayISO } from '@/lib/daily-games';
import { readChallenge, encodeChallenge, challengeFig, challengeResult, ymdCompact, isBlankMiss } from '@/lib/challenge';
import { metricDef } from '@/lib/challenge-metric';
import AddToHome from './AddToHome';
import JoinLeaderboardForm from './quiz/[id]/JoinLeaderboardForm';
// Where this finish puts the player in each of their groups (2026-09-17).
import FinishGroupLine from './groups/FinishGroupLine';

// ── THE FLOOD ──────────────────────────────────────────────────────────────
// THE CURTAIN ARRIVES AT FULL SIZE (owner, 2026-08-31). The band was already
// the moment the page changes state; what it was missing is the CHANGE. It
// simply existed, at its final height, the instant the card mounted.
//
// So the accent takes the whole screen first — the verdict at display size, the
// IQ counting up under it — and then collapses onto the band's own rectangle
// and hands over. This is the Broadcast's move (app/circuits/GauntletFinale.jsx)
// at a daily's scale: under two seconds rather than ten, one colour rather than
// eight, and it ends on the card the player came for.
//
// IT IS A REVEAL, NOT A SCREEN. It renders nothing the band does not already
// carry, it posts nothing, it fetches nothing, and the real ending is mounted
// and laid out underneath it the whole time — which is what makes the hand-over
// free: the flood ends the same colour and the same shape as the band, so
// fading it out simply lets the band's own words appear.
//
// THE PAINT GOES ON THE FIXED ROOT, never a full-bleed child (the Broadcast
// learned this twice). It is a child of .stf so it inherits --stg-acc and
// --stg-onramp from .stage-page; no stage ancestor sets transform or filter, so
// position:fixed still resolves against the viewport. A game that ever wraps its
// body in a transform would break that, and the fix is a portal, not a wash.
//
// FOUR RULES, the Broadcast's own:
//   1. Any tap, any key, skips. It is on the way to the card, never in front.
//   2. prefers-reduced-motion gets no flood at all.
//   3. A page that OPENED on a finished board — an archive replay, a refresh —
//      gets the card directly. Only a game that just ended floods.
//   4. It never congratulates. It says what the band says.
//   5. IT IS WHERE THE FIGURES LAND. See the hold, directly below.
// THE HOLD IS THE CARD'S OWN LOADING STATE, AND THE CURTAIN IS WHERE THE
// FIGURES LAND (owner, 2026-08-31, in two passes).
//
// Pass one made the hold wait for LoftFinish's `figuresShow` so the colour
// could not collapse onto a card still reading "Calculating". That was right
// about WHEN to leave and wrong about what to do while waiting: the IQ arrived
// mid-hold, started counting, and the screen collapsed out from under it
// part-way through the count (owner). A number that is cut off mid-climb is
// worse than one that was never shown.
//
// So the wait is not dead time being endured, it is the SEQUENCE. Every figure
// the card is about to show lands here first, one at a time, each stamped in
// and each given long enough to be read: the IQ counts up to its total, then
// today's position, then the all-time standing, then the streak. The screen
// leaves only once the last one has landed and been held for a beat. The stats
// eat the wait, which means a slow read costs nothing and a fast one still
// reads as an ending rather than a flash.
//
// THE ORDER IS FIXED and the queue is walked one step at a time:
//   * a figure with a value is REVEALED, and the queue waits out its dwell
//     (the IQ's dwell is its own count, so the count can never be cut off);
//   * a figure with no value yet HOLDS the queue while the card is still
//     reading, and is SKIPPED the moment `ready` says every read has answered
//     — because then a blank is a settled answer, not a pending one, exactly
//     as LoftFinish's own tiles treat it;
//   * when the queue runs out, one settle beat, then the collapse.
//
// READINESS IS NOT REDEFINED HERE. LoftFinish computes it once as
// `figuresShow` — the flag its own Calculating block is keyed on — and passes
// it in as `ready`. One definition, so the curtain and the card underneath it
// can never disagree about whether the card is finished. `ready` null (a caller
// that does not report it) means every present figure still plays and nothing
// is waited for.
const FLOOD_MIN = 600;      // the floor: the verdict alone, before any figure
const FLOOD_COUNT = 820;    // the IQ's climb, which is also its dwell
// EACH FIGURE GETS LONG ENOUGH TO BE READ, and the finished set gets a real
// pause before the screen goes (owner, 2026-08-31: "they come on fast and the
// screen leaves very quickly"). 380 and 420 were tuned as ANIMATION beats, which
// is the wrong unit: a figure is a sentence to be read, not a transition to be
// felt, and the settle was under half a second on a set of four numbers a player
// is seeing for the first time. These are the two knobs for the pace of the
// whole sequence; nothing else needs touching to make it faster or slower.
const FLOOD_STAMP = 520;    // every other figure lands this far after the last
// THE RACK'S DWELL (owner, 2026-09-07): the pip lands, then a ripple runs out
// from it along the rest of the category, so its dwell is the ripple's reach.
const FLOOD_RACK = 1100;
const RACK_HIT = 260;       // the new pip stamps this far after the rack appears
// THE SET COMPLETING (owner, 2026-09-07): the last pip of a group lands, the
// rack swells once with a Set complete tag, then the group's pips shrink to
// category size while the rest of the category expands in around them and the
// count restamps as the category figure. The dwell is that whole transform.
const RACK_SWELL = 1000;    // after the rack appears: the swell and the tag
const RACK_WIDEN = 2200;    // after the rack appears: the widen begins
const FLOOD_RACK_WIDE = 3100;
const FLOOD_VS = 900;       // the struck-through last run and today's, read as a pair
// ONE SCREEN (owner, 2026-09-26). The sequence used to flip through its
// figures one at a time and the screen ran nine seconds; now every figure
// lands INTO the same screen and stays, so the settle is a read of the whole
// set rather than a wait, and it is shorter for it.
const FLOOD_SETTLE = 2200;
const FLOOD_RIVAL = 800;    // the pair, read as two clocks
const FLOOD_FIELD = 900;    // the bars draw in
const FLOOD_STREAK = 900;   // the strip stamps across, tomorrow last
// ONE CADENCE (owner, 2026-09-28: "too jittery"). The dwells had drifted to
// seven different values (520 to 1100) and a figure still waiting on its read
// stalled the queue mid-screen, so the arrivals came in lurches. Now the three
// numbers in the top row land as one gesture (FLOOD_ROW apart), every block
// after them lands one FLOOD_BEAT after the last, strictly in order, so the
// screen fills top to bottom and nothing on it moves once it has landed.
const FLOOD_ROW = 420;
const FLOOD_BEAT = 760;
const FLOOD_ROWKEYS = ['iq', 'pos', 'all'];
// THE HAND-OFF COUNTS DOWN (owner, 2026-09-26): fifteen seconds after the
// curtain lands, Up next opens itself. Any tap elsewhere on the card stops it.
const HANDOFF_S = 15;
// HOW LONG THE QUEUE WILL BLOCK ON A FIGURE THAT HAS NOT ARRIVED (owner,
// 2026-08-31, and this is the third pass on this screen). It was anchored to
// LoftFinish's OWN ceiling, 11 seconds, on the reasoning that the curtain
// should not leave before the card is finished. In practice the IQ read polls
// for several seconds on a real finish, so the curtain sat on a coloured screen
// with nothing landing on it and READ AS STUCK — players tapped it away, which
// is the one thing an ending must never make them do.
//
// The card is perfectly able to say "Calculating" for a straggler; that block
// is what it is for. So the curtain waits a beat and then goes, and a figure
// that misses this window simply lands on the card instead of here.
//
// IT DOES NOT CUT ANYTHING OFF. This bounds the WAITING only: a figure already
// revealed still gets its full dwell, so the IQ's climb always completes even if
// the number arrived at the last possible moment. That was the whole point of
// the previous pass and it is preserved exactly.
const FLOOD_WAIT = 2200;
// The hint, because a screen you can leave should say so. The Broadcast carries
// the same line for the same reason.
const FLOOD_HINT = 1500;
// The absolute stop, pathological only: nothing in the queue should be able to
// outlast this, and if something does the player leaves anyway.
// SIZED TO THE LONGEST HONEST RUN (2026-09-07): a slow board read holds the
// queue for FLOOD_WAIT, then the IQ climb, two stamps, the set's swell-and-
// widen (FLOOD_RACK_WIDE) and the settle add up to about 12s, and at 9000 the
// backstop was cutting the widen off on a slow read (seen on an archive
// replay, where the rack mounted 7s in). Any tap still skips it.
const FLOOD_HARD = 14000;
const FLOOD_SHRINK = 640;   // it collapses onto the band's rectangle
const FLOOD_FADE = 200;     // colour onto colour, so the band's words appear
// A finish card mounts seconds after the last move: every client holds the
// finished board for its own HOLD_LONG first. A card on screen this soon after
// the document loaded is therefore a board that was ALREADY over — an archive
// replay or a refresh — and those get no flood. (A client-side navigation into
// a finished board reads as fresh and will flood; harmless, and the alternative
// is a signal that would have to be threaded through 80 clients.)
const FLOOD_FRESH = 2000;

const floodEase = (t) => 1 - Math.pow(1 - t, 3);

// The IQ counts, because a number that lands is the one thing a reader watches.
// It owns its own frame loop so a tick re-renders this and nothing else.
function FloodCount({ to, ms }) {
  const [v, setV] = useState(0);
  useEffect(() => {
    const t0 = (typeof performance !== 'undefined' ? performance.now() : Date.now());
    let raf = 0;
    const tick = (t) => {
      const p = Math.min(1, (t - t0) / Math.max(1, ms));
      setV(to * floodEase(p));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [to, ms]);
  return <>{Math.round(v).toLocaleString()}</>;
}

// THE QUICK FLOOD (owner, 2026-09-01: "i still want the full screen animation
// for 'you lost' but very quick - no stats need time to load. full color screen
// with words and auto move back to the single color bar"). A loss on the
// retry games has no figures to wait for, so `quick` empties the queue and
// shortens the settle: the verdict floods the screen, holds a beat, and
// collapses onto the band on its own. Same curtain, same collapse, no queue.
const FLOOD_QUICK_SETTLE = 700;

// `boardWhen` names what the board's position figure is a position IN ('today'
// on a daily, 'all time' on a quiz). It belongs here as well as on StageFinish
// because the FLOOD prints that figure first, full screen, before the card
// under it is ever seen: a quiz that only corrected the card would still open
// its ending by announcing "#3 of 41 today".
function CurtainFlood({ title, detail, iq, board, gameRank, streak, ready = null, bandRef, onDone, quick = false, boardWhen = null, catRun = null, vs = null, rival = null, dist = null, gameName = null, tone = '' }) {
  const [phase, setPhase] = useState('');     // '' -> up -> shrink -> out
  const [clip, setClip] = useState(null);
  const [held, setHeld] = useState(false);    // the floor has passed
  const [expired, setExpired] = useState(false);   // done waiting for stragglers
  const [hint, setHint] = useState(false);         // 'tap to skip' is showing
  const [revealed, setRevealed] = useState(() => new Set());   // figures landed so far
  const [tick, setTick] = useState(0);        // re-walks the queue when a dwell ends
  const doneRef = useRef(false);
  const goneRef = useRef(false);              // the collapse has been started
  const busyRef = useRef(false);              // a landed figure is still dwelling
  // ONE list for every timer this component ever schedules, cleared once on
  // unmount. NOT a cleanup per effect: the effects below re-run as the queue
  // advances, and a cleanup in one of them would clear the collapse it had
  // already scheduled and then decline to reschedule it (goneRef), stranding
  // the player on a coloured screen.
  const timersRef = useRef([]);
  const at = (ms, fn) => { timersRef.current.push(setTimeout(fn, ms)); };
  const finish = () => {
    if (doneRef.current) return;
    doneRef.current = true;
    if (typeof onDone === 'function') onDone();
  };

  // THE QUEUE. Every figure the card is about to print, in the order they land.
  // The IQ leads because it is the number the player came for; the two rankings
  // and the streak follow it as a row. `has` is what decides revealed vs held,
  // and it is a VALUE test rather than a read-completed one, so a figure that
  // genuinely has no answer (no all-time standing yet, no streak) is skipped by
  // the ready branch rather than printed as a blank.
  const figs = useMemo(() => (quick ? [] : [
    {
      k: 'iq', lead: true, count: true,
      has: !!(iq && iq.gained != null),
      value: iq && iq.gained != null ? Number(iq.gained) : null,
      label: 'IQ earned',
    },
    {
      k: 'pos',
      has: !!(board && board.myRank != null),
      value: board && board.myRank != null ? `#${board.myRank}` : null,
      label: board && board.field ? `of ${board.field} ${boardWhen || 'today'}` : (boardWhen || 'today'),
    },
    {
      k: 'all',
      has: !!(gameRank && gameRank.value != null),
      value: gameRank ? gameRank.value : null,
      label: (gameRank && gameRank.label) || 'all time',
    },
    // THE RIVAL (2026-09-26): the player one place above on the board, or the
    // group member above when a member has played this game. Two clocks.
    {
      k: 'rival', rival: true,
      has: !!rival,
      value: null,
      label: '',
    },
    // THE FIELD (2026-09-26): the day's distribution with this run's bar lit.
    {
      k: 'field', field: true,
      has: !!(dist && dist.bins && dist.bins.length),
      value: null,
      label: '',
    },
    // THE CATEGORY RACK (owner, 2026-09-07): one pip per live game in the
    // category they just played, the finished ones lit, this one landing. It
    // is the last figure so the standings have settled before the screen says
    // what the day adds up to in this category. Every finish shows it, a first
    // one included (owner's call: 1 of 17 is still where the rack starts).
    // THE RACK IS THE SET'S (owner, 2026-09-07): the three to five games this
    // one belongs to (lib/daily-groups), with the category behind it. A category
    // too small to have sets shows itself. `wide` marks a set just completed,
    // whose rack transforms into the category's and needs the longer dwell.
    // BEAT YESTERDAY'S YOU (owner, 2026-09-07): the last run of this game
    // struck through, and today's. Printed only when today is the better run;
    // a slower one is stated quietly under the band instead, never here.
    {
      k: 'cat', rack: true,
      has: !!(catRun && catRun.games.length),
      wide: !!(catRun && catRun.complete),
      value: catRun ? catRun.n : null,
      label: catRun ? `of ${catRun.games.length} ${catRun.cat} today` : '',
    },
    // THE STREAK AS A STRIP (2026-09-26): seven pips and a hollow eighth for
    // tomorrow. It was a bare number; the hollow shape is the argument.
    {
      k: 'streak', strip: true,
      has: !!streak,
      value: streak,
      label: 'day streak',
    },
  ]), [iq, board, gameRank, streak, quick, boardWhen, catRun, rival, dist]);

  // Fade in, and the two edges of the hold. Both timers are anchored to the
  // MOUNT rather than to `ready`, for the reason LoftFinish's own ceiling is:
  // a timer that starts only while something is outstanding can be cleared by
  // the one read that lands and then never fire for the one that does not.
  useEffect(() => {
    at(20, () => setPhase('up'));
    at(FLOOD_MIN, () => setHeld(true));
    at(FLOOD_HINT, () => setHint(true));
    at(FLOOD_WAIT, () => setExpired(true));
    at(FLOOD_HARD, finish);
    return () => { timersRef.current.forEach(clearTimeout); timersRef.current = []; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // WALKING THE QUEUE, strictly in order, so the screen fills top to bottom
  // and left to right and nothing already on it ever moves. The next figure
  // lands once the last one's dwell is over; a figure still reading holds the
  // queue (the verdict is on screen meanwhile), and one that is settled with
  // no value is stepped over.
  const settled = ready !== false || expired;
  const pending = useMemo(() => {
    for (const f of figs) {
      if (revealed.has(f.k)) continue;
      if (f.has) return { f };
      if (settled) continue;
      return { hold: true };
    }
    return null;
  }, [figs, revealed, settled]);
  useEffect(() => {
    if (!held || goneRef.current || busyRef.current || !pending || !pending.f) return;
    const f = pending.f;
    const rowNext = FLOOD_ROWKEYS.includes(f.k)
      && figs.some((x) => x.k !== f.k && FLOOD_ROWKEYS.includes(x.k) && !revealed.has(x.k) && x.has);
    // ITS DWELL IS ITS ANIMATION: the IQ's climb, the rack's ripple (or the
    // set's swell and widen). Everything else is one beat, or a row step.
    const dwell = f.count ? FLOOD_COUNT + 180
      : f.rack ? (f.wide ? FLOOD_RACK_WIDE : FLOOD_RACK)
      : rowNext ? FLOOD_ROW
      : FLOOD_BEAT;
    busyRef.current = true;
    setRevealed((prev) => { const n = new Set(prev); n.add(f.k); return n; });
    at(dwell, () => { busyRef.current = false; setTick((t) => t + 1); });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [held, pending, tick]);
  const walked = !pending && !busyRef.current;

  // THE COLLAPSE, once the queue has run out (or the backstop has fired).
  useEffect(() => {
    if (!held || goneRef.current) return;
    if (!walked) return;
    goneRef.current = true;
    const settle = quick ? FLOOD_QUICK_SETTLE : FLOOD_SETTLE;
    at(settle, () => {
      const el = bandRef && bandRef.current;
      if (!el) { setPhase('shrink'); return; }
      // MEASURED LATE, on purpose: by now the card has settled, so the rectangle
      // the colour is about to land on is the one it will still be sitting on.
      const vh = window.innerHeight;
      const r0 = el.getBoundingClientRect();
      // And the band has to BE in view, or the colour slides off the screen
      // instead of collapsing into it. An instant scroll under an opaque screen
      // is invisible, which is the one thing this moment can spend freely.
      if (r0.top < 8 || r0.bottom > vh - 8) {
        window.scrollTo(0, Math.max(0, window.scrollY + r0.top - Math.round(vh * 0.14)));
      }
      requestAnimationFrame(() => {
        const r = el.getBoundingClientRect();
        const w = window.innerWidth;
        const h = window.innerHeight;
        const px = (n) => Math.max(0, Math.round(n)) + 'px';
        setClip(`inset(${px(r.top)} ${px(w - r.right)} ${px(h - r.bottom)} ${px(r.left)})`);
        setPhase('shrink');
      });
    });
    at(settle + FLOOD_SHRINK + 60, () => setPhase('out'));
    at(settle + FLOOD_SHRINK + 60 + FLOOD_FADE, finish);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [held, walked, tick]);

  // Any key. (Any tap is the element's own onClick.)
  useEffect(() => {
    const go = () => finish();
    window.addEventListener('keydown', go);
    return () => window.removeEventListener('keydown', go);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    // aria-hidden because every word on it is read again, in place, on the card
    // underneath — and there is nothing focusable inside it to strand.
    <div
      className={'stf-flood' + (phase ? ' ' + phase : '') + (tone ? ' t-' + tone : '')}
      aria-hidden="true"
      onClick={finish}
      style={clip ? { clipPath: clip, WebkitClipPath: clip } : undefined}
    >
      <div className="stf-fl-in">
        <div className="stf-fl-v">{title}</div>
        {(detail || (vs && (vs.better || vs.pb))) ? (
          <div className="stf-fl-d">{detail}{vs && (vs.better || vs.pb) ? `${detail ? ' \u00b7 ' : ''}${vsLine(vs)}` : ''}</div>
        ) : null}
        {/* ONE SCREEN, FIXED SLOTS. Each figure mounts when the queue reaches
            it and stays; the stamp is a CSS animation on mount. The three
            numbers share a row, the rival and the field take a line each, and
            the set rack and the streak strip sit side by side at the foot. */}
        <div className="stf-fl-figs">
          {(() => {
            const idx = new Map(figs.map((f, i) => [f.k, i]));
            const vis = (k) => idx.has(k) && revealed.has(k) && figs[idx.get(k)].has;
            const num = (k) => {
              if (!vis(k)) return null;
              const f = figs[idx.get(k)];
              return (
                <div className={'stf-fl-fig' + (f.lead ? ' lead' : '')} key={f.k}>
                  <b>{f.count ? <>+<FloodCount to={f.value} ms={FLOOD_COUNT} /></> : f.value}</b>
                  <i>{f.label}</i>
                </div>
              );
            };
            const row = ['iq', 'pos', 'all'].map(num).filter(Boolean);
            return (
              <>
                {row.length ? <div className="stf-fl-row">{row}</div> : null}
                {vis('rival') ? <div className="stf-fl-fig stf-fl-block stf-fl-rival"><RivalFlood r={rival} /></div> : null}
                {vis('field') ? <div className="stf-fl-fig stf-fl-block stf-fl-field"><FieldBars dist={dist} /></div> : null}
                {(vis('cat') || vis('streak')) ? (
                  <div className="stf-fl-pair">
                    {vis('cat') ? <div className="stf-fl-fig stf-fl-rack"><CategoryRack run={catRun} ring={!!(vs && vs.pb)} /></div> : null}
                    {vis('streak') ? <div className="stf-fl-fig stf-fl-strip"><StreakStrip n={streak} game={gameName} /></div> : null}
                  </div>
                ) : null}
              </>
            );
          })()}
        </div>
      </div>
      {/* It goes on its own; this is only so a player who does not want to wait
          knows they do not have to. It leaves the moment the collapse starts. */}
      {hint && phase === 'up' ? <div className="stf-fl-skip">tap to skip</div> : null}
    </div>
  );
}

// Which dailies are finished TODAY, from the breadcrumb every client writes on
// finishing. Read once on mount: a finish page is a snapshot, not live data.
// THE LIVE ROSTER, not DAILY_GAMES. A retired game stays in that array so its
// archived days keep scoring, so listing from it put Circa (retired 2026-07-20)
// back on screen (owner, 2026-08-31). Reading through liveDailyKeys fixes Extra
// on 2026-09-29 too, without anyone remembering to come back.
const LIVE = () => {
  const live = new Set(liveDailyKeys());
  return DAILY_GAMES.filter((g) => live.has(g.key));
};

function doneToday() {
  const out = new Set();
  let today = '';
  try { today = new Date().toLocaleDateString('en-CA', { timeZone: 'America/New_York' }); } catch (e) { return out; }
  for (const g of LIVE()) {
    try {
      const c = JSON.parse(localStorage.getItem(`sot_${g.key}_day`) || 'null');
      if (c && c.d === today && c.done) out.add(g.key);
    } catch (e) {}
  }
  return out;
}

// THE RACK. One pip per live game, in registry order. When the game belongs
// to a SET (lib/daily-groups) the set's pips render at full size and the rest
// of the category collapses to nothing: the figure a finisher reads is
// "2 of 3 Crosswords", not "2 of 17 Word". On the flood the finished pips are
// lit when it appears, the new one stamps in after RACK_HIT, and a ripple runs
// out from it through the lit ones, timed by their distance among the VISIBLE
// pips. If that pip completed the set, the rack swells once with a Set
// complete tag at RACK_SWELL and at RACK_WIDEN turns wide: the set's pips
// shrink to category size while the others expand in around them, and the
// count restamps as the category figure. On the band it is the same rack at
// rest: the set while it is open, the whole category once it is done.
function CategoryRack({ run, band = false, ring = false }) {
  const g = run ? run.group : null;
  const grouped = !!g;
  // On the flood, `wide` is a STATE the widen flips. On the band it is derived
  // every render, because the finished set arrives after mount (`played` is
  // read in an effect, and ?rackdone=1 lands the same way), and a band rack
  // that read it once at mount stayed narrow after the set was done.
  const [wideState, setWide] = useState(!grouped);
  const [swell, setSwell] = useState(false);
  const complete = !!(grouped && run && run.complete);
  const wide = band ? (!grouped || complete) : wideState;
  useEffect(() => {
    if (band || !complete) return undefined;
    const a = setTimeout(() => setSwell(true), RACK_SWELL);
    const b = setTimeout(() => { setSwell(false); setWide(true); }, RACK_WIDEN);
    return () => { clearTimeout(a); clearTimeout(b); };
  }, [band, complete]);
  if (!run || !run.games.length) return null;
  const inSet = new Set(grouped ? g.games.map((x) => x.key) : []);
  const visible = grouped ? run.games.filter((x) => inSet.has(x.key)) : run.games;
  const k = visible.findIndex((x) => x.key === run.me);
  const vi = new Map(visible.map((x, i) => [x.key, i]));
  const shown = (wide || !grouped)
    ? { n: run.n, total: run.games.length, label: `${run.cat} today` }
    : { n: g.n, total: g.games.length, label: `${g.name} today` };
  return (
    <span
      className={'stf-rack' + (band ? ' band' : '') + (grouped ? ' grouped' : '') + (wide ? ' wide' : '') + (swell ? ' complete' : '')}
      aria-hidden="true"
    >
      <span className="stf-rk-pips">
        {run.games.map((x) => (
          <s key={x.key}
            className={(x.key === run.me ? 'new' + (ring ? ' ring' : '') : x.done ? 'on' : '') + ((!grouped || inSet.has(x.key)) ? ' g' : ' x')}
            style={(!band && x.done && x.key !== run.me && vi.has(x.key)) ? { animationDelay: `${RACK_HIT + Math.abs(vi.get(x.key) - k) * 55}ms` } : undefined} />
        ))}
      </span>
      {!band ? (
        <>
          {/* Keyed on the state so the widen REMOUNTS them and the stamp runs again. */}
          <b key={wide ? 'w' : 'n'}>{shown.n}<small>of {shown.total}</small></b>
          <i key={wide ? 'w' : 'n'}>{shown.label}</i>
          {swell ? <em className="stf-rk-done">Set complete</em> : null}
        </>
      ) : null}
    </span>
  );
}

// BEAT YESTERDAY'S YOU. The most recent earlier finish of this game against
// today's, from the per-puzzle saves (t0/tEnd give the clock on the clients
// that keep one) and the stats record (score, total, won), which every daily
// writes on finishing. Time when both runs were solved and both carry a clock,
// score otherwise. `pb` is against every earlier finish, `better` against the
// last one only.
function readLS(k) {
  try { return JSON.parse(localStorage.getItem(k) || 'null'); } catch (e) { return null; }
}
function runOf(key, num) {
  const stats = readLS(`sot_${key}_stats`);
  const rec = stats && stats.rec && stats.rec[num];
  if (!rec) return null;
  const sv = readLS(`sot_${key}_${num}`);
  const time = sv && sv.t0 && sv.tEnd && sv.tEnd > sv.t0 ? Math.round((sv.tEnd - sv.t0) / 1000) : null;
  return { num, score: Number(rec.s), total: Number(rec.t) || 0, won: !!rec.won, time };
}
// THE PUZZLE ON SCREEN, by number, worked out from the archive rows exactly as
// compareRuns does below (same rule, one copy would be better; this one is read
// by the band figure and the challenge link, which need the run even when
// there is no earlier run to compare it with).
function currentNum(rows) {
  const nums = rows.map((r) => Number(r.num)).filter(Number.isFinite);
  if (!nums.length) return null;
  const set = new Set(nums);
  const max = Math.max(...nums), lo = Math.min(...nums);
  for (let n = max; n >= lo; n -= 1) { if (!set.has(n)) return n; }
  return max + 1;
}
// THE FINISH ON SCREEN, NOT THE FIRST ATTEMPT (owner, 2026-10-07). The stats
// record is WRITE-ONCE: it keeps a puzzle's first finish and never changes. On
// a game where a replay counts (End Game, Barter, Chomp, Parker, Rung, Taire)
// a player who busted and then solved it still had a loss in that record, so
// the ending lost its Challenge door and printed "0/10 today" under a band
// reading Solved. The ending's own `outcome` is the run that just happened, and
// the save file's clock is that run's clock, so a win on screen is a win here.
// The SCORE cannot be read back off the save, so it stays the record's; the
// challenge door takes the board row's score when that is better (below).
function liveRun(r, outcome) {
  if (!r) return r;
  if (outcome === 'won' && !r.won) return { ...r, won: true, live: true };
  return r;
}
function compareRuns(key, rows, scoreOnly = false, outcome = null) {
  const nums = rows.map((r) => Number(r.num)).filter(Number.isFinite);
  if (!nums.length) return null;
  // The current puzzle is the one number the archive leaves out: a gap
  // inside the range on a replay (the highest gap, should the bank ever skip
  // a number), and max + 1 on a live day, when there is no gap. Counting down
  // from max + 1 first was wrong on a replay: the day after the replayed one
  // is a live row, so max + 1 is always missing and 29 read as 32.
  const set = new Set(nums);
  const max = Math.max(...nums), lo = Math.min(...nums);
  let cur = null;
  for (let n = max; n >= lo; n -= 1) { if (!set.has(n)) { cur = n; break; } }
  if (cur == null) cur = max + 1;
  const today = liveRun(runOf(key, cur), outcome);
  if (!today) return null;
  const prior = rows.filter((r) => r.done && Number(r.num) < cur)
    .sort((a, b) => Number(b.num) - Number(a.num))
    .map((r) => ({ ...runOf(key, Number(r.num)), dateLabel: r.dateLabel || null }))
    .filter((r) => r && r.num != null);
  if (!prior.length) return null;
  const last = prior[0];
  // ARCADE COMPARES ON SCORE ONLY: on Blocks and Sweep the longer run is the
  // better one, so a faster clock is not a better result there.
  const timed = !scoreOnly && today.won && today.time != null && last.won && last.time != null;
  if (timed) {
    const clocked = prior.filter((r) => r.won && r.time != null);
    const bestT = Math.min(...clocked.map((r) => r.time));
    const bestRow = clocked.find((r) => r.time === bestT);
    return { mode: 'time', today: today.time, last: last.time, best: bestT, bestDate: bestRow.dateLabel,
      better: today.time < last.time, pb: today.time < bestT, tie: today.time === last.time };
  }
  // SOLVE OR NOT: a score comparison would read "10 more than your last" or
  // print 0/10. Only two clocks are worth comparing on these.
  if (isSolveOnly(key)) return null;
  // A win the record does not know about has no score of its own to compare.
  if (today.live) return null;
  const frac = (r) => (r.total ? r.score / r.total : 0);
  const bestF = Math.max(...prior.map(frac));
  const bestRow = prior.find((r) => frac(r) === bestF);
  return { mode: 'score', today, last, best: bestRow, bestDate: bestRow.dateLabel,
    better: frac(today) > frac(last), pb: frac(today) > bestF, tie: frac(today) === frac(last) };
}
const fmtRun = (vs, r) => (vs.mode === 'time' ? mmss(r) : `${r.score}/${r.total}`);
function vsLine(vs) {
  const lead = vs.pb ? 'Personal best \u00b7 ' : '';
  if (vs.mode === 'time') {
    const d = vs.last - vs.today;
    return `${lead}${d}s faster than your last`;
  }
  const d = vs.today.score - vs.last.score;
  return `${lead}${d} more than your last`;
}
function RivalFlood({ r }) {
  if (!r) return null;
  return (
    <>
      <span className="stf-fl-lab">{r.eyebrow}</span>
      <span className="stf-rvf" aria-hidden="true">
        <span className="them"><small>{r.them.name} &middot; {r.them.sub}</small><b>{r.them.run}</b></span>
        <span className="x">vs</span>
        <span className={`you${r.won ? ' won' : ''}`}><small>{r.won ? '\u2713 ' : ''}You &middot; {r.you.sub}</small><b>{r.you.run}</b></span>
      </span>
      <i>{r.line}</i>
    </>
  );
}
function FieldBars({ dist }) {
  if (!dist || !dist.bins) return null;
  const max = Math.max(1, ...dist.bins);
  return (
    <>
      <span className="stf-fl-lab">{dist.eyebrow}</span>
      <span className="stf-bars" aria-hidden="true">
        {dist.bins.map((n, i) => (
          <s key={i} className={i === dist.mine ? 'me' : undefined} style={{ height: `${Math.max(4, Math.round((n / max) * 100))}%`, animationDelay: `${i * 28}ms` }} />
        ))}
      </span>
      <i>{dist.line}</i>
    </>
  );
}
const STRIP_PIPS = 7;
function StreakStrip({ n, game = null }) {
  const lit = Math.min(STRIP_PIPS, Math.max(0, Number(n) || 0));
  return (
    <>
      <span className="stf-fl-lab">{game ? `${game} streak` : 'Streak'} &middot; {n} {Number(n) === 1 ? 'day' : 'days'}</span>
      <span className="stf-dstrip" aria-hidden="true">
        {Array.from({ length: STRIP_PIPS }, (_, i) => (
          <s key={i} className={i < STRIP_PIPS - lit ? 'off' : 'on'} style={{ animationDelay: `${i * 70}ms` }} />
        ))}
        <s className="next" style={{ animationDelay: `${STRIP_PIPS * 70 + 160}ms` }} />
      </span>
      <i>Tomorrow makes {Number(n) + 1}</i>
    </>
  );
}
function VsBox({ vs }) {
  if (!vs) return null;
  return (
    <>
      <span className="stf-vsx" aria-hidden="true">
        <span className="was">{fmtRun(vs, vs.last)}</span>
        <span className="arr">&rarr;</span>
        <span className="now">{fmtRun(vs, vs.today)}</span>
      </span>
      <i>{vsLine(vs)}</i>
    </>
  );
}

// The line under the verdict on the band, and the rack at rest beside it.
// One component for both curtains so they cannot disagree.
function BandCat({ run, vs = null }) {
  if (!run || !run.games.length) return null;
  const g = run.group;
  const total = run.games.length;
  return (
    <div className="stf-bcat">
      {g ? (run.complete
        ? <span>{g.name} done &middot; {run.cat} &middot; {run.n} of {total} today</span>
        : <span>{g.name} &middot; {g.n} of {g.games.length} today</span>)
        : <span>{run.cat} &middot; {run.n} of {total} today</span>}
      <CategoryRack run={run} band ring={!!(vs && vs.pb)} />
      {g && !run.complete ? <span className="stf-bcat-x">&middot; {run.cat} {run.n} of {total}</span> : null}
      {vs && (vs.better || vs.pb) ? <span className="stf-bcat-x">&middot; {vsLine(vs)}</span> : null}
    </div>
  );
}

// `set` is the highlight: a game still open in the finisher's own set (or in
// the next set, once theirs is done) is FILLED in the accent so it is the
// obvious next tap; the rest of the category stays the quiet outline.
function Tile({ g, played, light, set = false }) {
  return (
    <a className={'stf-tile' + (played ? ' done' : '') + (set ? ' set' : '')} href={g.href || `/${g.key}`}
      style={{ '--tc': light ? categoryColorLight(g.cat) : categoryColor(g.cat) }}>
      <GameGlyph gameKey={g.key} size={14} />
      <span>{g.name}</span>
    </a>
  );
}

// THE FIVE DOORS' ICONS (owner, 2026-10-01). One stroke glyph each, drawn in
// currentColor so a door takes whatever ink its own ground calls for.
const DI = (d) => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor"
    strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{d}</svg>
);
const DOOR_ICON = {
  flag: DI(<><path d="M5 21V4" /><path d="M5 4h11l-2 4 2 4H5" /></>),
  similar: DI(<path d="M5 12h12M13 6l6 6-6 6" />),
  another: DI(<><rect x="3" y="4" width="18" height="17" rx="2" /><path d="M3 9h18M8 2v4M16 2v4" /></>),
  replay: DI(<><path d="M3 12a9 9 0 1 0 3-6.7L3 8" /><path d="M3 3v5h5" /></>),
  stats: DI(<path d="M5 20V11M12 20V4M19 20v-6" />),
  share: DI(<><circle cx="18" cy="5" r="2.5" /><circle cx="6" cy="12" r="2.5" /><circle cx="18" cy="19" r="2.5" /><path d="M8.2 10.8l7.6-4.4M8.2 13.2l7.6 4.4" /></>),
  more: DI(<path d="M5 12h.01M12 12h.01M19 12h.01" />),
  reveal: DI(<><path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12z" /><circle cx="12" cy="12" r="3" /></>),
  all: DI(<><rect x="3" y="3" width="7" height="7" rx="1.5" /><rect x="14" y="3" width="7" height="7" rx="1.5" /><rect x="3" y="14" width="7" height="7" rx="1.5" /><rect x="14" y="14" width="7" height="7" rx="1.5" /></>),
};

const SANS = "Manrope, ui-sans-serif, system-ui, -apple-system, sans-serif";

// LoftFinish's ranking, not a new one. A tone this table does not know falls to
// 5, and the gold Share declares no tone so it keeps rank 0, directly under the
// lead pair.
const RANK = { reveal: -3, board: -2, replay: -1, another: 3, similar: 4, main: 9 };
const rankOf = (o) => (RANK[o.tone] != null ? RANK[o.tone] : (o.kind === 'gold' ? 0 : 5));

export default function StageFinish({
  // `day` is gone with the today's-board FIGURE it was the only reader of. The
  // callers still pass it, harmlessly, so putting that figure back is a one-line
  // change here rather than a sweep through 80 clients.
  title, detail, iq = null, board = null, streak = null,
  // Whether every figure on this card has arrived. LoftFinish's own
  // `figuresShow`, passed through so the flood can hold on the verdict until
  // there is a finished card under it. See FLOOD_MIN above.
  ready = null,
  missLabel = null, gameRank = null, outcome = null, options = [], name = null,
  archive = null,
  // ⚠️ WHAT THE BOARD IS, said rather than assumed (owner, 2026-09-04).
  //
  // Every figure and every heading below was written for a DAILY, where the
  // board is today's and saying so is the most useful thing on the card. The
  // QUIZ half of the site went sitewide on the stage on 2026-09-04 and a quiz's
  // board is its ALL-TIME board: there is one board per quiz, it never rolls at
  // midnight, and a player finishing one was being told they came #3 "of 41
  // today" on a table that has been accumulating since the quiz was published.
  //
  // LoftFinish already had `boardLabel` for exactly this and had had it since
  // the quiz Loft rollout. The prop stopped at LoftFinish: the stage ending is
  // a different component, it never took it, and the moment the stage became
  // the ending for every quiz the override silently stopped applying. That is
  // the fifth-mirror trap this codebase keeps recording, one hop further along
  // than the last time.
  //
  // Both default to null, so all eighty dailies render byte for byte what they
  // rendered before. `boardWhen` is the SHORT form for a figure's label ('all
  // time'), `boardLabel` the heading over the table ('All-time board').
  boardLabel = null,
  boardWhen = null,
  retry = null,
  // CLAIM YOUR RANK (owner, 2026-09-01). `guest` is LoftFinish's own
  // claimBandShown: a finish with no display name saved, on the full card.
  // `board.guest` carries where that finish WOULD rank among the registered
  // players (the board route deals the guest's rows in), which is the one
  // figure that makes the offer concrete. onClaimed is LoftFinish's, so the
  // rest of the page learns about the new name the same way it always did.
  guest = false,
  onClaimed = null,
  // THE HAND-OFF IS OPT-OUT PER GAME (owner, 2026-10-01). Pricer finishes on a
  // product pop-up, and a countdown that walks the reader to another game while
  // they are looking at it fights the one thing that page is for. Default true,
  // so every other game is unchanged.
  handoff = true,
  // THE GAME'S OWN FIGURE FOR A CHALLENGE (owner, 2026-10-07): 47 points on
  // Hands, 3 trades on Barter, null where the clock or the score is the right
  // figure. lib/challenge-metric.js says what each game counts.
  challengeMetric = null,
}) {
  // THE RETRY ENDING. On the nine games where a replay genuinely counts, an
  // unsolved finish is not a page of furniture, it is one control (see the
  // fast-retry panel in app/LoftFinish.jsx, which owns the decision of WHEN
  // this shows). What it was NOT, until now, was a stage ending: it opened the
  // old white Loft card at the foot of a near-black page, the last thing on the
  // site still doing that once the stage went sitewide (owner, 2026-08-31).
  //
  // So it renders here instead, and takes the curtain -- the same full-bleed
  // accent band every other ending gets -- with the replay control under it and
  // nothing else. It shares this component rather than restating the curtain
  // somewhere else precisely so the two endings cannot drift into two different
  // bands, and so that the retry ending collapses the gameplay area on exactly
  // the same terms every other ending does (see the effect below).
  const isRetry = !!retry;
  // THE COLLAPSE IS THE CARD'S TO RELEASE. A finished page hides the board, the
  // leader strip and the play figures (app/globals.css), and it is keyed on a
  // class this component owns rather than on :has(.stf) — because 'Return to
  // board' flips CLIENT state to show that body again, and a rule keyed on the
  // card's mere presence overrode it, so the button did nothing (owner,
  // 2026-08-31). Anything that asks for the board back takes the class off
  // first; everything else leaves it on.
  // THE RETRY ENDING COLLAPSES TOO, and the reason is the ANIMATION rather
  // than the card (owner, 2026-08-31). It shipped earlier today leaving the
  // board up, on the argument that the position you just lost is the argument
  // for playing it again. What that missed is that the board does not go quiet
  // when the game ends: the engine's winning move animates in, and the client
  // prints its own line under it. The player watches that land -- every client
  // holds the finished board for HOLD_LONG before any of this renders, which is
  // exactly the window the animation plays in -- and THEN the curtain arrives,
  // into a page that was still carrying the gameplay area. Two things about the
  // same result, colliding.
  //
  // So the losing move plays out, and then the board goes. The hold shows the
  // ending; the curtain replaces it.
  useEffect(() => {
    const root = document.querySelector('.stage-page');
    if (!root) return undefined;
    root.classList.add('stf-collapse');
    // AND THE WAY BACK IN. 'Hide game board' is the client's own button and it
    // only flips client state, which under the collapse model nothing acts on:
    // pressing it made the button vanish and left the board (owner,
    // 2026-08-31). It is the exact inverse of Return to board, so it re-adds
    // the class. Delegated because the button belongs to 80 different clients
    // and mounts and unmounts with their own state.
    const back = (e) => {
      const t = e.target && e.target.closest && e.target.closest('.stf-hideboard');
      if (t) root.classList.add('stf-collapse');
    };
    document.addEventListener('click', back);
    return () => {
      document.removeEventListener('click', back);
      root.classList.remove('stf-collapse');
    };
  }, []);
  // THE REST OF THE SITE, from the one page a reader reliably reaches (owner,
  // 2026-08-31). Three doors, and none of them can appear before the game is
  // over because this component only exists then.
  // THE FLOOD, and the band it collapses onto. Started in an effect rather
  // than in the initial state so the server and the first client render agree:
  // there is no flood in the markup, it arrives after hydration.
  const bandRef = useRef(null);
  const [flood, setFlood] = useState(false);
  useEffect(() => {
    // The fast-retry ending floods too, QUICKLY (owner, 2026-09-01; it used to
    // stay quiet on the reasoning that a player takes it several times in a
    // row). It has no figures, so the quick flood is the verdict, a beat, and
    // the collapse: about a second and a half, and any tap skips it.
    if (typeof window === 'undefined') return;
    if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    // ?flood=1 plays it on an already-finished board, which is the ONLY way to
    // see this without burning a real attempt: a finish card renders on a game
    // that is over, and playing one posts a result. Verify on /<game>?p=N&flood=1.
    const forced = /[?&]flood=1(&|$)/.test(window.location.search);
    const since = (typeof performance !== 'undefined' && performance.now) ? performance.now() : 1e9;
    if (!forced && since < FLOOD_FRESH) return;   // the page opened on a finished board
    setFlood(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  // The curtain has landed (or never ran). The hand-off counts from here.
  const [floodDone, setFloodDone] = useState(false);
  const [freshFinish, setFreshFinish] = useState(false);
  useEffect(() => {
    const since = (typeof performance !== 'undefined' && performance.now) ? performance.now() : 1e9;
    const reduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const forced = /[?&]flood=1(&|$)/.test(window.location.search);
    // Fresh means a game that JUST ended, the same test the flood makes. A
    // reduced-motion reader gets no flood, so the countdown starts at once.
    setFreshFinish(forced || since >= FLOOD_FRESH);
    if (reduced || (!forced && since < FLOOD_FRESH)) setFloodDone(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Which register the page is in. The store rather than the DOM attribute,
  // because it SUBSCRIBES: a reader who flips the light switch while the card
  // is open repaints the hues with everything else instead of leaving one
  // card's worth of tiles in the register they came from. It resolves to the
  // same default the page root does ('light'), so the first paint agrees.
  const [stageTheme] = useStageTheme();
  const light = stageTheme === 'light';

  const [cat, setCat] = useState(null);        // null | a category | 'all'
  const [arch, setArch] = useState(false);     // this game's own back catalogue
  const [played, setPlayed] = useState(() => new Set());
  useEffect(() => { setPlayed(doneToday()); }, []);

  const me = useMemo(() => LIVE().find((g) => g.name === name) || null, [name]);
  // ?rackdone=1 pretends the set just completed, so the swell-and-widen can
  // be seen on an archive replay (with ?flood=1) without finishing a real set.
  // Review path only, like ?flood=1 itself.
  const [forceDone, setForceDone] = useState(false);
  useEffect(() => { setForceDone(/[?&]rackdone=1(&|$)/.test(window.location.search)); }, []);

  // WHAT THE DAY ADDS UP TO, in this game's SET and in its category. Every
  // live game in the category, registry order, with the ones finished today
  // (this one included, whether or not its breadcrumb has landed yet) marked
  // done; the set (lib/daily-groups) as the subset the rack leads with; and,
  // once the set is done, the next set in the category with something open,
  // which is what Up next and the tiles hand over to. Read by the flood's
  // rack, the band's line, Up next and the tiles, so none can disagree.
  const catRun = useMemo(() => {
    if (!me) return null;
    // THE SET IS A FINISH SET (owner, 2026-09-28): lib/finish-sets, small and
    // overlapping, picked as the one closest to done that this game is in. The
    // home's partition (lib/daily-groups) is not read here any more.
    const inCat = LIVE().filter((g) => g.cat === me.cat);
    const base = (k) => played.has(k) || k === me.key;
    const pick = finishPick(me.key, base, LIVE().map((g) => g.key));
    const forced = !!(forceDone && pick);
    const done = (g) => base(g.key) || (forced && pick.set.keys.includes(g.key));
    const games = inCat.map((g) => ({ key: g.key, done: done(g) }));
    const group = pick ? (() => {
      const gg = pick.set.keys.map((k) => inCat.find((g) => g.key === k)).filter(Boolean)
        .map((g) => ({ key: g.key, done: done(g) }));
      return { name: pick.set.name, games: gg, n: gg.filter((x) => x.done).length, open: forced ? [] : pick.open };
    })() : null;
    const complete = !!(group && group.games.length && group.n === group.games.length);
    const nx = pick && pick.complete ? pick.next : null;
    const nextGroup = complete && nx ? { name: nx.set.name, keys: nx.set.keys, open: nx.open, total: nx.set.keys.length, cat: nx.set.cat } : null;
    return { cat: me.cat, me: me.key, games, n: games.filter((g) => g.done).length, group, complete, nextGroup };
  }, [me, played, forceDone]);

  // YOUR LAST RUN OF THIS GAME, read once on mount: localStorage, so an
  // effect rather than a memo, and the server renders nothing for it.
  const [vs, setVs] = useState(null);
  useEffect(() => {
    if (!me) return;
    try { setVs(compareRuns(me.key, Array.isArray(archive) ? archive : [], me.cat === 'Arcade', outcome)); } catch (e) { setVs(null); }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [me]);

  // THIS RUN, AND A CHALLENGE IF THE TAB CAME IN ON ONE (owner, 2026-10-07).
  // Both are localStorage / URL reads, so an effect, and the server renders
  // neither. `run` is the finished run of the board on screen; `chal` is the
  // other player's result off a challenge link (lib/challenge.js), kept only
  // when it is for THIS board number.
  const [run, setRun] = useState(null);
  const [chal, setChal] = useState(null);
  const [chalMsg, setChalMsg] = useState('');
  useEffect(() => {
    if (!me) return;
    try {
      const n = currentNum(Array.isArray(archive) ? archive : []);
      const r = n != null ? liveRun(runOf(me.key, n), outcome) : null;
      setRun(r);
      const c = readChallenge(me.key);
      setChal(c && r && c.n === r.num ? c : null);
    } catch (e) { setRun(null); setChal(null); }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [me]);

  // AN ARCHIVE REPLAY IS NOT A FINISH. It gets no rival stamp and no
  // countdown; the flood has the same rule under FLOOD_FRESH.
  const [archived, setArchived] = useState(true);
  useEffect(() => { setArchived(/[?&]p=/.test(window.location.search)); }, []);

  // THE GROUP'S BOARD ON THIS GAME (2026-09-26), handed up by FinishGroupLine.
  // When another member has played it, the group is the story: the rival is
  // the member above, and the group board takes the board slot.
  const [grpData, setGrpData] = useState(null);
  const grpGame = useMemo(() => {
    if (!grpData || !me || !Array.isArray(grpData.groups)) return null;
    const groups = grpData.groups.filter((g) => g && !g.failed && g.rank);
    const lead = groups[0];
    if (!lead) return null;
    const all = (lead.boards && lead.boards[me.key]) || [];
    const mine = all.find((r) => r.userKey === grpData.userKey) || null;
    if (!mine || all.length < 2) return null;
    return { lead, all, mine };
  }, [grpData, me]);

  // THE RIVAL. One clock against one clock; a board of forty names is a crowd
  // and one name is a target. Public: the player one place above on the board
  // the card prints (or, for #1, the player they are holding off). Group: the
  // member above on this game's group board. Registered players only: a guest
  // has no place on the board to be one above.
  const keyFig = (r) => (r && r.score != null && r.total != null && Number(r.score) >= Number(r.total) && r.timeElapsed != null
    ? mmss(r.timeElapsed) : (runFig(r, me && me.key) || '\u2014'));
  // BOTH SIDES READ IN ONE UNIT (owner, 2026-09-27). Picking the unit per row
  // printed a clock on one square and a score on the other whenever one run
  // solved and the other did not. The pair shares a unit: the clock when both
  // solved (or tied on score) and both have one, else the score for both.
  const scoreFig = (r) => runFig(r, me && me.key) || '\u2014';
  const pairFigs = (x, y) => {
    const solved = (r) => r && r.score != null && r.total != null && Number(r.score) >= Number(r.total);
    const hasT = (r) => r && r.timeElapsed != null;
    const level = x && y && x.score != null && y.score != null && Number(x.score) === Number(y.score);
    if (hasT(x) && hasT(y) && ((solved(x) && solved(y)) || level)) return [mmss(x.timeElapsed), mmss(y.timeElapsed)];
    return [scoreFig(x), scoreFig(y)];
  };
  const gapLine = (a, b) => {
    // a is the better row, b the worse. Same score and the board separated
    // them on misses: say the misses (the clock would read backwards, since a
    // slower clean run outranks a faster one with a miss). Else the clock,
    // else points.
    if (a.score != null && b.score != null && Number(a.score) === Number(b.score)
      && a.guessesUsed != null && b.guessesUsed != null && Number(a.guessesUsed) !== Number(b.guessesUsed) && missLabel) {
      const d = Math.abs(Number(b.guessesUsed) - Number(a.guessesUsed));
      return `${d} ${missWord(missLabel, d)}`;
    }
    if (a.score != null && b.score != null && Number(a.score) === Number(b.score) && a.timeElapsed != null && b.timeElapsed != null) {
      const d = Math.abs(Math.round(Number(b.timeElapsed) - Number(a.timeElapsed)));
      return d ? `${d}s` : 'level on the clock';
    }
    if (a.score != null && b.score != null) {
      const d = Math.abs(Number(a.score) - Number(b.score));
      return `${d} ${d === 1 ? 'point' : 'points'}`;
    }
    return null;
  };
  const ord = (n) => { const j = n % 10, k = n % 100; return n + (j === 1 && k !== 11 ? 'st' : j === 2 && k !== 12 ? 'nd' : j === 3 && k !== 13 ? 'rd' : 'th'); };
  const [rivalCount, setRivalCount] = useState(0);
  const rival = useMemo(() => {
    // GROUP ONLY (owner, 2026-09-27): the head-to-head shows only when the
    // reader is in a group and another member has played this game. The
    // public one-place-up rival below is kept but no longer reached.
    if (!me || !grpGame) return null;
    if (grpGame) {
      const { lead, all, mine } = grpGame;
      const above = mine.rank > 1 ? all.find((r) => r.rank === mine.rank - 1) : null;
      const below = mine.rank === 1 ? all.find((r) => r.rank === 2) : null;
      const other = above || below;
      if (!other) return null;
      const gap = above ? gapLine(above, mine) : gapLine(mine, below);
      const unplayed = Math.max(0, (lead.members || 0) - all.length);
      const line = above
        ? `${gap ? `${gap} behind ${above.username} today` : `Behind ${above.username} today`}${unplayed ? `. ${unplayed} ${unplayed === 1 ? 'member has' : 'members have'} not played it yet.` : '.'}`
        : `${gap ? `Holding off ${below.username} by ${gap}` : `Ahead of ${below.username}`}${unplayed ? `. ${unplayed} ${unplayed === 1 ? 'member has' : 'members have'} not played it yet.` : '.'}`;
      const [themRun, youRun] = pairFigs(other, mine);
      return {
        group: true,
        won: !above,
        eyebrow: `Your group \u00b7 ${lead.name}`,
        sub: mine.rank === 1 ? `You lead on ${me.name}` : `You\u2019re ${ord(mine.rank)} of ${all.length} on ${me.name}`,
        them: { name: other.username, run: themRun, sub: `${ord(other.rank)} in group` },
        you: { run: youRun, sub: `${ord(mine.rank)} in group` },
        line,
      };
    }
    const rows = board && Array.isArray(board.rows) ? board.rows : [];
    const myRank = board && board.myRank != null ? board.myRank : null;
    const mine = board && board.myRow ? board.myRow : null;
    if (myRank == null || !mine || !rows.length) return null;
    const rankOfRow = (r, i) => (r.rank != null ? r.rank : i + 1);
    const above = myRank > 1 ? rows.find((r, i) => rankOfRow(r, i) === myRank - 1) : null;
    const below = myRank === 1 ? rows.find((r, i) => rankOfRow(r, i) === 2) : null;
    const other = above || below;
    if (!other || !other.username) return null;
    const gap = above ? gapLine(above, mine) : gapLine(mine, below);
    let line = above ? (gap ? `${gap} back today.` : 'One place back today.') : (gap ? `Holding off ${below.username} by ${gap}.` : `Ahead of ${below.username}.`);
    // What your own best would have placed, when today was not it.
    if (above && vs && vs.mode === 'time' && !vs.pb && vs.best != null && mine.score != null) {
      const n = 1 + rows.filter((r) => r.score != null && Number(r.score) >= Number(mine.score) && r.timeElapsed != null && Number(r.timeElapsed) < vs.best).length;
      if (n < myRank && n <= rows.length) line += ` Your fastest ${me.name} is ${mmss(vs.best)}, which would have taken #${n}.`;
    }
    const times = rivalCount >= 2 ? `, ${ord(rivalCount)} time in two weeks` : '';
    const [themRun, youRun] = pairFigs(other, mine);
    return {
      group: false,
      won: !above,
      eyebrow: above ? 'Your rival today' : 'Holding them off',
      sub: `${other.username}${above ? times : ''}`,
      them: { name: other.username, run: themRun, sub: `#${rankOfRow(other, rows.indexOf(other))} of ${board.field || rows.length}` },
      you: { run: youRun, sub: `#${myRank} of ${board.field || rows.length}` },
      line,
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [me, grpGame, board, vs, rivalCount]);

  // A STANDING RIVAL is the same name above you again and again. Stamped per
  // game per day in localStorage; counted over the last fourteen days. Never
  // stamped on an archive replay, which is not a finish.
  useEffect(() => {
    if (!me || archived || !rival || rival.group || !rival.them || !rival.them.name || rival.eyebrow !== 'Your rival today') return;
    try {
      const key = `sot_rival_${me.key}`;
      const today = new Date().toLocaleDateString('en-CA', { timeZone: 'America/New_York' });
      const cut = new Date(Date.now() - 14 * 86400000).toLocaleDateString('en-CA', { timeZone: 'America/New_York' });
      const map = readLS(key) || {};
      const name = rival.them.name;
      const days = new Set((map[name] || []).filter((d) => d >= cut));
      days.add(today);
      map[name] = [...days].sort();
      for (const k of Object.keys(map)) { map[k] = (map[k] || []).filter((d) => d >= cut); if (!map[k].length) delete map[k]; }
      localStorage.setItem(key, JSON.stringify(map));
      setRivalCount(days.size);
    } catch (e) {}
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [me, archived, rival && rival.them && rival.them.name]);

  // THE FIELD. Twelve bars, worst on the left and best on the right, this run's
  // bar lit. The clock when the day is a race (most runs solved it and this one
  // did), the score otherwise. Drawn only when the field is real: five runs.
  const dist = useMemo(() => {
    if (!board || board.myRank == null || !board.field || board.field < 5 || !board.myRow) return null;
    const pct = Math.max(0, Math.round(((board.field - board.myRank) / board.field) * 100));
    const mine = board.myRow;
    const td = board.timeDist;
    const solvedShare = td && board.plays ? td.n / board.plays : 0;
    if (td && td.n >= 5 && solvedShare >= 0.6 && board.best != null && Number(mine.score) === Number(board.best) && mine.timeElapsed != null) {
      const bins = td.bins.slice().reverse();   // slowest left, fastest right
      const raw = Math.min(td.bins.length - 1, Math.max(0, Math.floor(((Number(mine.timeElapsed) - td.lo) / Math.max(1, td.hi - td.lo)) * td.bins.length)));
      return { kind: 'time', bins, mine: td.bins.length - 1 - raw, eyebrow: `Today\u2019s field \u00b7 ${td.n} solved runs`, line: `Faster than ${pct}% of the board` };
    }
    const sd = board.scoreDist;
    if (!sd || mine.score == null) return null;
    if (me && isSolveOnly(me.key)) return null;
    const keys = Object.keys(sd).map(Number).filter(Number.isFinite).sort((a, b) => a - b);
    if (keys.length < 2) return null;
    const bins = keys.map((k) => sd[k]);
    const mi = keys.indexOf(Number(mine.score));
    if (mi < 0) return null;
    return { kind: 'score', bins, mine: mi, eyebrow: `Today\u2019s field \u00b7 ${board.plays || board.field} runs`, line: `Better than ${pct}% of the board` };
  }, [board, me]);

  // THE SET TO PUSH: this game's own set while it is open, the next set once
  // it is done, nothing in an ungrouped category.
  const pushSet = useMemo(() => {
    if (!catRun || !catRun.group) return null;
    if (!catRun.complete) {
      return { name: catRun.group.name, keys: catRun.group.games.map((x) => x.key), open: catRun.group.open, total: catRun.group.games.length, handoff: false };
    }
    if (!catRun.nextGroup) return null;
    return { name: catRun.nextGroup.name, keys: catRun.nextGroup.keys, open: catRun.nextGroup.open, total: catRun.nextGroup.total, handoff: true };
  }, [catRun]);

  // MORE OF WHAT THEY JUST PLAYED. The set to push first, its open games
  // ahead of its finished ones, then the rest of the category, unplayed first,
  // so the row leads with somewhere to actually go.
  const sameCat = useMemo(() => {
    if (!me) return [];
    const hi = new Set(pushSet ? pushSet.keys : []);
    // The set's first open game is the Up next card directly above, full
    // width; a tile for it underneath was the same control twice (owner,
    // 2026-09-07).
    const lead = pushSet && pushSet.open.length ? pushSet.open[0] : null;
    const order = (a, b) => (played.has(a.key) - played.has(b.key)) || a.name.localeCompare(b.name);
    const inCat = LIVE().filter((g) => g.cat === me.cat && g.key !== me.key && g.key !== lead);
    const set = inCat.filter((g) => hi.has(g.key)).sort(order).map((g) => ({ g, set: true }));
    const rest = inCat.filter((g) => !hi.has(g.key)).sort(order).map((g) => ({ g, set: false }));
    return [...set, ...rest].slice(0, 8);
  }, [me, played, pushSet]);

  // UP NEXT IS THE SET'S NEXT OPEN GAME (owner, 2026-09-07), ahead of the
  // similar-game pick the options carry: a finisher one game from a full set
  // is handed that game, and one who just completed a set is handed the next
  // set's first. Null falls through to the ordinary hand-forward.
  const setNext = useMemo(() => {
    if (!pushSet || !pushSet.open.length) return null;
    const g = LIVE().find((x) => x.key === pushSet.open[0]);
    return g ? { g, set: pushSet } : null;
  }, [pushSet]);
  // The arrows are only worth showing when the row actually overflows, which
  // only the rendered row can say.
  const catsRef = useRef(null);
  const [over, setOver] = useState(false);
  const [claimOpen, setClaimOpen] = useState(false);
  const [claimed, setClaimed] = useState(false);
  const [pubOpen, setPubOpen] = useState(false);
  // THE STATS ARE ALWAYS OPEN, RIGHT UNDER THE DOORS (owner, 2026-10-03).
  // No Stats + leaderboard door: the rival, the board(s) and the archive render
  // directly below the doors, then Add to Home Screen, then the page's own
  // How to play / Report an issue row. toStats only scrolls there now.
  const toStats = () => {
    try {
      const el = document.getElementById('stf-drawer');
      if (el) el.scrollIntoView({ behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth', block: 'start' });
    } catch (e) {}
  };
  const [dailyOpen, setDailyOpen] = useState(false);   // the All daily puzzles section   // the folded public board, when the group leads
  useEffect(() => {
    const el = catsRef.current;
    if (!el) return undefined;
    const read = () => setOver(el.scrollWidth > el.clientWidth + 4);
    read();
    const ro = new ResizeObserver(read);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  useEffect(() => {
    const el = catsRef.current;
    if (el && dailyOpen) setOver(el.scrollWidth > el.clientWidth + 4);
  }, [dailyOpen]);
  const nudge = (dir) => {
    const el = catsRef.current;
    if (el) el.scrollBy({ left: dir * Math.max(160, el.clientWidth * 0.7), behavior: 'smooth' });
  };

  const catList = useMemo(() => (cat
    ? LIVE().filter((g) => cat === 'all' || g.cat === cat).slice().sort((a, b) => a.name.localeCompare(b.name))
    : []), [cat]);

  const uncollapse = () => {
    const root = document.querySelector('.stage-page');
    if (root) root.classList.remove('stf-collapse');
  };
  // 'board' and 'reveal' are the two that put the board back on screen.
  const wrap = (o) => (o.tone === 'board' || o.tone === 'reveal'
    ? { ...o, onClick: (e) => { uncollapse(); if (o.onClick) o.onClick(e); } }
    : o);

  const opts = useMemo(
    () => [...options.filter(Boolean)].map(wrap).sort((a, b) => rankOf(a) - rankOf(b)),
    [options],   // eslint-disable-line react-hooks/exhaustive-deps
  );
  const forward = opts.find((o) => o.tone === 'similar') || null;

  // THE HAND-OFF COUNTDOWN (owner, 2026-09-26). Up next opens itself HANDOFF_S
  // seconds after the curtain lands, on a game that just ended. `left` is
  // seconds remaining, null when there is no countdown (archive replay, retry
  // card, nothing to hand to, or the reader stopped it). Any click on the card
  // that is not the hand-off itself stops it, as does Escape or hiding the tab:
  // a reader who is doing something else has answered the question.
  const [left, setLeft] = useState(null);
  const [handoffOff, setHandoffOff] = useState(false);
  const handoffTarget = setNext ? { href: setNext.g.href || `/${setNext.g.key}`, onClick: null } : (forward || null);
  // THE COUNTDOWN RIDES THE PLAY SIMILAR DOOR (owner, 2026-10-01): fifteen
  // seconds, a ring in place of the door's icon, and a No thanks beside it.
  const handoffOn = !!(handoff && freshFinish && !archived && !isRetry && !handoffOff && handoffTarget && (handoffTarget.href || handoffTarget.onClick));
  useEffect(() => {
    if (!handoffOn || !floodDone) { setLeft(null); return undefined; }
    // WALL CLOCK, not ticks: a throttled tab fires this every second, and a
    // countdown that subtracts a tenth per tick would run ten times slow.
    const t0 = Date.now();
    let l = HANDOFF_S;
    setLeft(l);
    const t = setInterval(() => {
      // A pop-up is open over the card (ThanksPop sets this): the reader is
      // looking at something else, which answers the question.
      if (document.documentElement.dataset.sotModal) { clearInterval(t); setHandoffOff(true); return; }
      l = HANDOFF_S - (Date.now() - t0) / 1000;
      if (l <= 0) {
        clearInterval(t);
        setLeft(0);
        const tgt = handoffTarget;
        if (tgt && tgt.href) window.location.assign(tgt.href);
        else if (tgt && typeof tgt.onClick === 'function') tgt.onClick({ preventDefault() {} });
        return;
      }
      setLeft(l);
    }, 100);
    const stop = () => setHandoffOff(true);
    const onKey = (e) => { if (e.key === 'Escape') stop(); };
    const onVis = () => { if (document.visibilityState === 'hidden') stop(); };
    // A real scroll is a reader reading the board, which answers the question.
    const y0 = window.scrollY;
    const onScroll = () => { if (Math.abs(window.scrollY - y0) > 160) stop(); };
    window.addEventListener('keydown', onKey);
    window.addEventListener('scroll', onScroll, { passive: true });
    document.addEventListener('visibilitychange', onVis);
    return () => { clearInterval(t); window.removeEventListener('keydown', onKey); window.removeEventListener('scroll', onScroll); document.removeEventListener('visibilitychange', onVis); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [handoffOn, floodDone]);
  const stopHandoff = (e) => {
    if (left == null) return;
    if (e && e.target && e.target.closest && e.target.closest('.stf-door.pri')) return;
    setHandoffOff(true);
  };
  // SHARE IS THE FOOT OF THE GRID (owner, 2026-08-31). It ranked 0, which put
  // it directly under the lead pair and above Play another: a card whose most
  // emphatic tile sat in the middle of the run. It is pulled out here and
  // rendered after everything else, full width on a phone.
  const goldOpt = opts.find((o) => o.kind === 'gold') || null;
  const rest = opts.filter((o) => o !== forward && o !== goldOpt);

  const archiveRows = Array.isArray(archive) ? archive : [];
  // A FUNCTION rather than a stored element, because the parity walk below has
  // to be able to widen this tile when it lands as the tail of an odd run, and
  // an element built once cannot take a class decided later.
  const archiveBtn = (extra = '') => (
    <button key="arch" type="button" className={'stf-o' + (arch ? ' on' : '') + extra}
      onClick={() => setArch((v) => !v)}>
      <b>{name ? `Full ${name} archive` : 'Full archive'}</b>
      <i>{arch ? 'Hide the list' : `Every one of the ${archiveRows.length}`}</i>
    </button>
  );

  // EVERY TILE IS THE SAME WIDTH (owner, 2026-08-31: "fix the rendering of the
  // bottom tiles to be even, make share a full width on the bottom"). The grid
  // was repeat(auto-fit,minmax(190px,1fr)), which laid THREE tracks at the
  // card's width while the 'Play another' + archive pair spans the whole row.
  // So a Four card read as two tiles and a dead slot, then a full-width pair of
  // visibly wider tiles, then three across including the gold Share: three
  // different tile widths in one grid. Two fixed columns make every tile one
  // half-width, the pair's own 1fr 1fr matches them exactly, and Share takes
  // the last row on its own.
  //
  // PARITY IS DECIDED HERE, NOT IN CSS, because the option set varies by game.
  // The pair spans a full row, so it CUTS the half tiles into runs that each
  // pair on their own; counting every half tile once, globally, proves nothing.
  // This is the same walk LoftFinish does for its own grid, for the same reason
  // and with the same guarantee: widening the LAST tile of an odd run can only
  // shorten that run, never split one, so no option set can leave a hole.
  const flow = [];
  rest.forEach((o) => flow.push({
    t: (o.tone === 'another' && archiveRows.length) ? 'pair' : 'tile', o,
  }));
  // No 'Play another'? The archive still belongs on the card, on its own.
  if (archiveRows.length && !rest.some((o) => o.tone === 'another')) flow.push({ t: 'arch' });
  flow.push({ t: 'browse' });
  const wideOpt = new Set();
  let runAt = -1;
  for (let i = 0; i <= flow.length; i += 1) {
    if (i < flow.length && flow[i].t !== 'pair') { if (runAt < 0) runAt = i; continue; }
    if (runAt >= 0 && (i - runAt) % 2 === 1) wideOpt.add(i - 1);
    runAt = -1;
  }

  const top5 = board && Array.isArray(board.rows) ? board.rows.slice(0, 5) : [];
  // Identity, by key first and by name second, because a guest board carries
  // no key and the name is all useDailyBoard could resolve.
  const myKey = board && board.myRow ? board.myRow.userKey : null;
  const myName = board && board.mine ? String(board.mine) : null;
  const isMine = (r) => (!!myKey && r && r.userKey === myKey)
    || (!!myName && String((r && r.username) || '').toLowerCase() === myName);
  const rows = top5;
  const myRank = board && board.myRank != null ? board.myRank : null;
  const field = board && board.field != null ? board.field : null;

  // 'similar' arrives as `${name} · ${tag}`, which is the shape all 65 clients
  // already pass, so the heading and the line under it come off one prop.
  const fwdName = forward && forward.sub && forward.sub.includes('·')
    ? forward.sub.split('·')[0].trim() : (forward ? forward.label : '');
  const fwdTag = forward && forward.sub && forward.sub.includes('·')
    ? forward.sub.split('·').slice(1).join('·').trim() : '';

  // The two standings that used to be figures. Strings, not elements, so the
  // line under the verdict reads as one sentence of figures rather than as a
  // row of blocks that happens to be inline. gameRank arrives split into a
  // value and its own label ('#5' + 'of 348 Four all time'), which is why this
  // rejoins them rather than composing the label here.
  // WHERE THEY RENDER depends on whether the board section is there to carry
  // them. The eyebrow over the leaderboard is already a line of standings
  // ('Today's board · you are #7 of 11'), so these belong on the end of it. A
  // game with no board rows has no such line, and the verdict's own detail is
  // the fallback rather than dropping two real figures off the card.
  const standings = [];
  if (gameRank && gameRank.value != null) {
    standings.push(`${gameRank.value} ${gameRank.label || 'all time'}`);
  }
  if (streak) standings.push(`${streak} day streak`);
  const rowsPresent = board && Array.isArray(board.rows) && board.rows.length > 0;
  const loose = rowsPresent ? [] : standings;

  // Placed AFTER every hook above, so the two endings run the same hooks in
  // the same order on every render.
  if (isRetry) {
    return (
      <div className={'stf stf-rtwrap stf-miss' + (outcome ? ' stf-' + outcome : '')}>
        <style dangerouslySetInnerHTML={{ __html: CSS }} />

        {flood ? (
          <CurtainFlood title={title} detail={detail} bandRef={bandRef} quick
            onDone={() => setFlood(false)} />
        ) : null}

        <div className="stf-curtain" ref={bandRef}>
          <div className="stf-cin">
            <div className="stf-verdict">{title}</div>
            {detail ? <div className="stf-detail">{detail}</div> : null}
            <BandCat run={catRun} />
          </div>
        </div>

        <div className="stf-wrap">
          {/* The one control, in the hand-forward's own shape: this IS the
              hand-forward on these games, it just points back at the board
              instead of on to the next game. */}
          <button type="button" className="stf-fwd stf-rt" onClick={retry.onReplay}>
            <div>
              {/* Both lines come from dailyAttemptRule, so what a replay is
                  worth is stated by the registry that decides it and can never
                  drift from the same sentence on the full card. */}
              {retry.eyebrow ? <div className="stf-eb">{retry.eyebrow}</div> : null}
              <div className="stf-fwdn">Replay instantly</div>
              {retry.sub ? <div className="stf-fwdt">{retry.sub}</div> : null}
            </div>
            <span className="stf-go">Replay</span>
          </button>

          <div className="stf-opts">
            <button type="button" className="stf-o" onClick={retry.onCard}>
              <b>Show end game card</b>
              <i>Your IQ, {boardLabel ? <>the {String(boardLabel).toLowerCase()}</> : <>today&rsquo;s board</>}{archiveRows.length ? ', the archive' : ''} and what to play next</i>
            </button>
          </div>
        </div>
      </div>
    );
  }

  // THE FIVE DOORS' DATA. Every door is read off what this card already
  // computed, so no client changes: Up next's own pick, the client's
  // 'another', 'replay' and 'main' options, and the board for the drawer.
  const anotherOpt = opts.find((o) => o.tone === 'another') || null;
  const replayOpt = opts.find((o) => o.tone === 'replay') || null;
  const mainOpt = opts.find((o) => o.tone === 'main') || null;
  const backOpt = opts.find((o) => o.tone === 'board' || o.tone === 'reveal') || null;
  // A LOSS OFFERS RETRY ON THE BAND, NOT THE ANSWER (owner, 2026-10-04). The
  // band's one control used to read Reveal answer on a loss, which put the
  // answer one tap from the verdict. It reads Retry now, and Reveal answer is a
  // door in the card below, where the player has to go looking for it. A solved
  // board keeps Back to board on the band exactly as before.
  const revealOpt = backOpt && backOpt.tone === 'reveal' ? backOpt : null;
  const bandOpt = revealOpt
    ? (replayOpt ? { ...replayOpt, bandLabel: 'Retry' } : null)
    : (backOpt ? { ...backOpt, bandLabel: 'Back to board' } : null);
  const secOpts = [
    ...opts.filter((o) => o !== forward && o !== anotherOpt && o !== replayOpt && o !== mainOpt && o !== goldOpt && o !== backOpt),
    ...(goldOpt ? [goldOpt] : []),
  ];
  const primaryDoor = setNext
    ? {
      name: setNext.g.name, key: setNext.g.key,
      sub: [`${setNext.set.name} \u00b7 ${setNext.set.handoff ? `${setNext.set.open.length} of ${setNext.set.total} open` : `${setNext.set.open.length} left`}`, typicalLabel(setNext.g.key)].filter(Boolean).join(' \u00b7 '),
      href: setNext.g.href || `/${setNext.g.key}`, onClick: null,
    }
    : (forward ? { name: fwdName, sub: fwdTag, href: forward.href, onClick: forward.onClick } : null);
  // THE REST OF THE SET (owner, 2026-10-03): every other unplayed game in the
  // set the verdict band names, each its own door directly under Play similar.
  // Never the game Play similar already offers, never the game just finished.
  const setDoors = (() => {
    if (!pushSet || !pushSet.open.length) return [];
    const priKey = setNext ? setNext.g.key : null;
    const priHref = primaryDoor ? primaryDoor.href : null;
    const left = pushSet.open.length;
    return pushSet.open
      .filter((k) => k !== priKey && (!me || k !== me.key))
      .map((k) => LIVE().find((g) => g.key === k))
      .filter((g) => g && (g.href || `/${g.key}`) !== priHref)
      .map((g) => ({
        k: `set-${g.key}`, glyph: g.key, cls: 'set wide',
        nm: <><span className="stf-dchip">Set</span>{g.name}</>,
        sb: [`${pushSet.name} \u00b7 ${pushSet.handoff ? `${left} of ${pushSet.total} open` : `${left} left`}`, typicalLabel(g.key)].filter(Boolean).join(' \u00b7 '),
        href: g.href || `/${g.key}`,
      }));
  })();
  const isQuiz = !!boardLabel;
  // THE BAND IS GRADED BY THE RESULT (owner, 2026-10-07). Gold for a personal
  // best, the category step for a solve, a quiet dark band with a rose rule for
  // a miss. See `missed` just below for what counts as one.
  // A MISS is a plain loss, or a part score on a board that still has an answer
  // to reveal (Garble's "Partly solved"). A part score with nothing to reveal
  // is the ordinary finish on a game that scores, and keeps the colour.
  const missed = outcome === 'lost' || (outcome === 'part' && !!revealOpt);
  const tone = missed ? 'lost' : (!isQuiz && vs && vs.pb ? 'pb' : '');
  // THE ONE BIG FIGURE, right edge, under Back to board: the clock when the run
  // was solved on one, the score on a miss. A solve-only game has no score to
  // print, so a miss there prints nothing.
  const myT = run && run.won && run.time != null ? run.time
    : (outcome === 'won' && board && board.myRow && board.myRow.timeElapsed != null && !run ? Number(board.myRow.timeElapsed) : null);
  const meSolveOnly = !!(me && isSolveOnly(me.key));
  const bandFig = isQuiz || !me ? null
    : myT != null ? { v: mmss(myT), l: tone === 'pb' && vs.mode === 'time' ? `New best \u00b7 was ${mmss(vs.best)}` : (tone === 'pb' ? 'New best' : (board && board.myRank != null && board.field ? `#${board.myRank} of ${board.field}` : '')) }
    : (tone === 'lost' && run && run.total && !meSolveOnly ? { v: `${run.score}/${run.total}`, l: '' } : null);
  // CHALLENGE A FRIEND. Mine is this run in the link's own shape; the door
  // shows on any daily finish that has a figure worth beating.
  // The score is the better of the record's and the board row's: the record is
  // the FIRST attempt, and on a game where a replay counts the board row is the
  // run that ranks. The clock falls back to the board row's when the save kept
  // none, so a solve-only win still has a figure to send.
  const myRowB = board && board.myRow;
  const rowFrac = myRowB && Number(myRowB.total) > 0 ? Number(myRowB.score) / Number(myRowB.total) : -1;
  const useRow = !!(run && rowFrac > (run.total ? run.score / run.total : 0));
  const mineT = run && run.won ? (run.time != null ? run.time
    : (myRowB && myRowB.timeElapsed != null && Number(myRowB.timeElapsed) > 0 ? Math.round(Number(myRowB.timeElapsed)) : null)) : null;
  const mine = run && me ? { name: '', t: mineT, s: useRow ? Number(myRowB.score) : run.score, o: useRow ? Number(myRowB.total) : run.total, n: run.num, won: run.won,
    m: challengeMetric != null && Number.isFinite(Number(challengeMetric)) && metricDef(me.key) ? Number(challengeMetric) : null } : null;
  // EVERY DAILY FINISH OFFERS IT, A LOSS INCLUDED (owner, 2026-10-07). A miss
  // with a score sends the score; a miss with nothing to beat dares them to
  // crack it (isBlankMiss), and the link's card says so.
  const canChallenge = !!(mine && !isQuiz && !isRetry);
  const duel = chal && mine ? { them: chal, res: challengeResult(mine, chal, me && me.key) } : null;
  const sendChallenge = () => {
    if (!mine) return;
    let onArchive = false;
    try { onArchive = /[?&]p=\d+/.test(window.location.search); } catch (e) { /* treat as today's */ }
    const who = savedIdentity().username || 'A friend';
    const raw = encodeChallenge({ ...mine, name: who, d: onArchive ? 0 : ymdCompact(etTodayISO()) });
    const url = `${window.location.origin}/vs?g=${encodeURIComponent(me.key)}&vs=${encodeURIComponent(raw)}&v=3`; // v: bump when the card changes, a phone caches a link's preview by its URL
    // THE LINK GOES ALONE (owner, 2026-10-07). Its card says the whole
    // sentence, so any text sent beside it would say it twice.
    const copied = () => { setChalMsg('Link copied. Paste it to a friend.'); };
    const copy = () => {
      try { navigator.clipboard.writeText(url).then(copied, () => setChalMsg(url)); } catch (e) { setChalMsg(url); }
    };
    // A phone gets its own share sheet; a desktop gets the link on the
    // clipboard, because the desktop sheet is a detour nobody asked for.
    let touch = false;
    try { touch = !!(window.matchMedia && window.matchMedia('(pointer: coarse)').matches); } catch (e) { touch = false; }
    if (touch && navigator.share) { navigator.share({ url }).catch(() => {}); } else copy();
  };
  const chalDoor = canChallenge ? {
    k: 'challenge', cls: 'chal', btn: true, onClick: sendChallenge, go: chalMsg ? 'Sent' : 'Send',
    ic: 'flag',
    nm: duel ? `Challenge ${chal.name} back` : 'Challenge a friend',
    sb: chalMsg || (isBlankMiss(mine) ? 'Dare them to crack it. No spoilers.' : `Send them ${challengeFig(mine, me && me.key)} to beat. No spoilers.`),
  } : null;
  const playedN = new Set([...played, ...(me ? [me.key] : [])]).size;
  const smallDoors = [];
  if (anotherOpt) {
    smallDoors.push({ k: 'another', glyph: me ? me.key : null, nm: anotherOpt.label, sb: anotherOpt.sub, href: anotherOpt.href, onClick: anotherOpt.onClick });
  } else if (archiveRows.length) {
    smallDoors.push({ k: 'another', glyph: me ? me.key : null, nm: name ? `Play another ${name}` : 'Play another', sb: `Every one of the ${archiveRows.length}`, btn: true,
      onClick: () => { setArch(true); setTimeout(toStats, 60); } });
  }
  if (revealOpt) {
    // The replay door would repeat the band's Retry, so a loss spends that
    // slot on the answer instead and the door count is unchanged.
    smallDoors.push({ k: 'reveal', nm: revealOpt.label || 'Reveal answer', sb: revealOpt.sub || 'Show what you missed', onClick: revealOpt.onClick, btn: true });
  } else if (replayOpt) {
    smallDoors.push({ k: 'replay', nm: isQuiz ? (replayOpt.label || 'Replay') : 'Replay today\u2019s', sb: replayOpt.sub, href: replayOpt.href, onClick: replayOpt.onClick });
  }
  smallDoors.push(isQuiz && mainOpt
    ? { k: 'all', nm: mainOpt.label, sb: mainOpt.sub, href: mainOpt.href, onClick: mainOpt.onClick }
    : { k: 'all', nm: 'All daily puzzles', sb: `${playedN} of ${LIVE().length} played today`, btn: true,
      onClick: () => setDailyOpen((v) => !v), expanded: dailyOpen, controls: 'stf-daily' });
  // Share, and anything this card does not know, as doors too: every tile the same shape.
  secOpts.forEach((o, i) => smallDoors.push({
    k: o.kind === 'gold' ? 'share' : `more${i}`, ic: o.kind === 'gold' ? 'share' : 'more',
    nm: o.label, sb: o.sub, href: o.href, onClick: o.onClick, btn: !o.href,
  }));
  // A plain function, not a component, so React never sees a new type per render.
  const door = ({ k, ic = null, glyph = null, nm, sb, href, onClick, cls = '', go = null, btn = false, expanded, controls, ring = null }) => {
    const inner = (
      <>
        {ring != null
          ? <span className="stf-ring" style={{ '--p': `${((HANDOFF_S - ring) / HANDOFF_S) * 100}%` }}><b>{Math.ceil(ring)}</b></span>
          : <span className={'stf-dic' + (glyph ? ' art' : '')}>{glyph ? <GameGlyph gameKey={glyph} size={cls.indexOf('pri') >= 0 ? 34 : 28} /> : DOOR_ICON[ic || k]}</span>}
        <span className="stf-dtx"><span className="stf-dnm">{nm}</span>{sb ? <span className="stf-dsb">{sb}</span> : null}</span>
        {go ? <span className="stf-dgo">{go}</span> : <span className="stf-dar" aria-hidden="true">&rsaquo;</span>}
      </>
    );
    const c = 'stf-door' + (cls ? ' ' + cls : '');
    return (href && !btn)
      ? <a key={k} className={c} href={href} onClick={onClick}>{inner}</a>
      : <button key={k} type="button" className={c} onClick={onClick}
          aria-expanded={controls ? !!expanded : undefined} aria-controls={controls || undefined}>{inner}</button>;
  };

  return (
    <div className={'stf' + (outcome ? ' stf-' + outcome : '') + (tone === 'pb' ? ' stf-pb' : '') + (tone === 'lost' ? ' stf-miss' : '')}>
      <style dangerouslySetInnerHTML={{ __html: CSS }} />

      {flood ? (
        <CurtainFlood title={title} detail={detail} iq={iq} board={board}
          gameRank={gameRank} streak={streak} ready={ready} bandRef={bandRef}
          boardWhen={boardWhen} catRun={catRun} vs={vs} rival={rival} dist={dist}
          gameName={me ? me.name : null} tone={tone}
          onDone={() => { setFlood(false); setFloodDone(true); }} />
      ) : null}

      {/* THE CURTAIN. The one place on the stage where the accent covers
          something rather than marking it. Edge to edge, because a band with a
          margin reads as another card. */}
      {/* THE IQ IS THE ONE FIGURE THAT BELONGS ON THE BAND (owner, 2026-08-31).
          It was the first of four stats in a row underneath, all at the same
          weight, which asked the reader to find the number they came for among
          three they did not. It is what the run was WORTH, so it goes on the
          verdict's own band, opposite the verdict, and it is set larger than the
          stats ever were.

          IT IS PINNED TO THE CONTENT COLUMN, not the viewport. The band is
          full-bleed, so a right-aligned figure inside it would sit against the
          screen edge with nothing under it; .stf-cin is the same 720px .stf-wrap
          uses, so the number lands over the blocks it belongs to.

          The other three stats: today's board is gone (the table directly below
          says it, in full), and the all-time rank and the streak go onto the end
          of that table's own eyebrow, which is already a line of standings. They
          spent one deploy on the verdict's line and crowded the one sentence
          that describes the run itself. On a phone they do not render at all
          -- see .stf-dx in the media query. */}
      <div className="stf-curtain" ref={bandRef}>
        <div className={'stf-cin' + ((bandOpt || bandFig || duel) ? ' stf-hasback' : '')}>
          {/* BACK TO BOARD LIVES ON THE BAND (owner, 2026-10-01), right of the
              verdict, so every tile under the band can be the same size. The
              run's one big figure sits under it (2026-10-07), or the two
              figures of a challenge when the tab came in on one. */}
          {(bandOpt || bandFig || duel) ? (
            <div className="stf-rc">
              {bandOpt ? (
                <button type="button" className="stf-back" onClick={bandOpt.onClick || (bandOpt.href ? () => { window.location.href = bandOpt.href; } : undefined)}>
                  <span aria-hidden="true">&#8617;</span>{bandOpt.bandLabel}
                </button>
              ) : null}
              {duel ? (
                <div className="stf-duel">
                  <div><small>You</small><b>{challengeFig(mine, me && me.key)}</b></div>
                  <i>vs</i>
                  <div className={'them' + (duel.res && duel.res.res === 'win' ? ' beat' : '')}><small>{duel.them.name}</small><b>{challengeFig(duel.them, me && me.key)}</b></div>
                </div>
              ) : bandFig ? (
                <div className="stf-bfig"><b>{bandFig.v}</b>{bandFig.l ? <small>{bandFig.l}</small> : null}</div>
              ) : null}
            </div>
          ) : null}
          <div className="stf-ctop">
            <div className="stf-cl">
              {/* IQ EARNED SITS NEXT TO THE VERDICT (owner, 2026-10-03). On the
                  right edge it collided with Back to board on the band. */}
              <div className="stf-vrow">
                <div className="stf-verdict">{title}</div>
                {iq && iq.gained != null ? (
                  <div className="stf-ciq">
                    <b>+{Number(iq.gained).toLocaleString()}</b>
                    <i>IQ earned</i>
                  </div>
                ) : null}
              </div>
              {(detail || loose.length) ? (
                <div className="stf-detail">
                  {detail}
                  {loose.length ? (
                    <span className="stf-dx">{detail ? ' \u00b7 ' : ''}{loose.join(' \u00b7 ')}</span>
                  ) : null}
                </div>
              ) : null}
              {duel && duel.res ? (
                <div className="stf-chline">
                  {duel.res.res === 'win' ? `You beat ${duel.them.name}${duel.res.by ? ' ' + duel.res.by : ''}`
                    : duel.res.res === 'loss' ? `${duel.them.name} holds it${duel.res.by ? ' ' + duel.res.by : ''}`
                    : `Dead level with ${duel.them.name}`}
                </div>
              ) : null}
              <BandCat run={catRun} vs={vs} />
            </div>
          </div>
        </div>
      </div>

      <div className="stf-wrap" onClickCapture={stopHandoff}>
        {/* THE FIVE DOORS (owner, 2026-10-01). Everything that used to follow
            the band (the rival, the set block, Up next, the board, the tiles,
            the category scroller and the option grid) folds into five doors:
            Play similar, Play another <game>, Replay, Stats + leaderboard, and
            All daily puzzles. The flood and the band above are untouched. The
            board, the rival and the archive live in the Stats drawer, which is
            mounted from the start and only hidden, so FinishGroupLine still
            makes its one read and the flood still gets its group rival. */}
        <div className="stf-doors">
          {/* CHALLENGE A FRIEND sits directly under the result, above Play
              similar (owner, 2026-10-07). */}
          {chalDoor ? door(chalDoor) : null}
          {primaryDoor ? (
            <div className={'stf-pwrap' + (left != null ? ' counting' : '')}>
              {door({
                k: 'similar', cls: 'pri', go: left != null ? null : 'Play', ring: left, glyph: primaryDoor.key || null,
                nm: `Play similar: ${primaryDoor.name}`,
                sb: left != null
                  ? (left > 0 ? `Opens in ${Math.ceil(left)}s` : 'Opening') + (primaryDoor.sub ? ` \u00b7 ${primaryDoor.sub}` : '')
                  : primaryDoor.sub,
                href: primaryDoor.href, onClick: primaryDoor.onClick,
              })}
              {left != null ? (
                <button type="button" className="stf-decl" onClick={() => setHandoffOff(true)}>No thanks</button>
              ) : null}
            </div>
          ) : null}
          {setDoors.map((d) => door(d))}
          {smallDoors.map((d, i) => door({ ...d, cls: (smallDoors.length % 2 === 1 && i === smallDoors.length - 1) ? 'wide' : '' }))}
          <div className="stf-drawer" id="stf-daily" hidden={!dailyOpen}>
            {/* THE GAMES, ORGANIZED AS THE OLD CARD HAD THEM (owner,
                2026-10-01): more of this category first, then every category,
                A to Z under the chip you press. */}
            {sameCat.length ? (
              <section>
                <div className="stf-eb">{me ? `More ${me.cat} puzzles` : 'More puzzles'}</div>
                <div className="stf-tiles">
                  {sameCat.map(({ g, set }) => <Tile key={g.key} g={g} played={played.has(g.key)} light={light} set={set} />)}
                </div>
              </section>
            ) : null}
            <section>
              <div className="stf-eb">All categories</div>
              <div className="stf-catrow">
                <button type="button" className="stf-catnav" aria-label="Scroll categories left"
                  onClick={() => nudge(-1)} hidden={!over}>&#8249;</button>
                <div className="stf-cats" ref={catsRef}>
                  <button type="button" className={'stf-cat' + (cat === 'all' ? ' on' : '')}
                    style={{ '--tc': 'var(--stg-acc)', '--tci': 'var(--stg-onramp,#08222e)' }}
                    onClick={() => setCat((v) => (v === 'all' ? null : 'all'))}>All A to Z</button>
                  {RAMP_ORDER.map((c) => (
                    <button key={c} type="button"
                      className={'stf-cat' + (cat === c ? ' on' : '')}
                      style={{
                        '--tc': light ? categoryColorLight(c) : categoryColor(c),
                        '--tci': light ? categoryOnrampLight(c) : RAMP_INK,
                      }}
                      onClick={() => setCat((v) => (v === c ? null : c))}>{c}</button>
                  ))}
                </div>
                <button type="button" className="stf-catnav" aria-label="Scroll categories right"
                  onClick={() => nudge(1)} hidden={!over}>&#8250;</button>
              </div>
              {cat ? (
                <div className="stf-catlist">
                  <div className="stf-eb">
                    {cat === 'all' ? 'All daily puzzles' : cat} <em>&middot; {catList.length}</em>
                  </div>
                  <div className="stf-tiles">
                    {catList.map((g) => <Tile key={g.key} g={g} played={played.has(g.key)} light={light} />)}
                  </div>
                </div>
              ) : null}
            </section>
            <a className="stf-seeall stf-homeln" href={(mainOpt && mainOpt.href) || '/'}>Open today&rsquo;s full slate &rsaquo;</a>
          </div>
        </div>


          <div className="stf-drawer stf-statcards" id="stf-drawer">
        {/* THE SLOWER CASE (owner, 2026-09-07): stated plainly, in the card's
            own ink, with the figure to beat. Never a colour: red on a finished
            game reads as failure. */}
        {vs && !vs.better && !vs.pb && !vs.tie ? (
          <div className="stf-vslow">
            <b>{fmtRun(vs, vs.today)}</b> today &middot; your best on {name || 'this one'} is <b>{vs.mode === 'time' ? mmss(vs.best) : `${vs.best.score}/${vs.best.total}`}</b>{vs.bestDate ? `, set ${vs.bestDate}` : ''}. Beat it tomorrow.
          </div>
        ) : null}
        {/* THE RIVAL LEADS (owner, 2026-09-26). One name, two clocks, the gap.
            The group member above when a member has played this game, else
            the public player one place up. See `rival` above. */}
        {rival ? (
          <section className="stf-rival">
            <div className="stf-eb">{rival.eyebrow}<em> &middot; {rival.sub}</em></div>
            <div className="stf-vs">
              <div className="stf-vside"><span className="nm">{rival.them.name}</span><b>{rival.them.run}</b><small>{rival.them.sub}</small></div>
              <div className="stf-vsx2">vs</div>
              <div className={`stf-vside you${rival.won ? ' won' : ''}`}><span className="nm"><span className="nmt">You</span>{rival.won ? <em className="stf-vwin">&#10003; Ahead</em> : null}</span><b>{rival.you.run}</b><small>{rival.you.sub}</small></div>
            </div>
            <div className="stf-rline">{rival.line}</div>
          </section>
        ) : null}
        {/* THE BOARD(S). When a group member has played this game the group's
            board leads (FinishGroupLine draws it) and the public board folds to
            its eyebrow, one tap from opening; otherwise the public board leads
            and the group card follows, as it did. */}
        {(() => {
          // KEYED, so the group card keeps its node (and its one read) when it
          // moves above the board; a remount would refetch, land null, and
          // flip the order straight back.
          const grpLine = (me && !boardLabel)
            ? <FinishGroupLine key="grp" gameKey={me.key} gameName={me.name} missLabel={missLabel} onData={setGrpData} />
            : null;
          const pubBoard = rows.length ? (
            <section key="pub">
              <div className="stf-eb">{boardLabel || <>Today&rsquo;s board</>}{myRank != null ? <em> &middot; you are #{myRank}{field ? ` of ${field}` : ''}</em> : null}{standings.length ? <em className="stf-dx"> &middot; {standings.join(' \u00b7 ')}</em> : null}
                {grpGame && !pubOpen ? <> &middot; <button type="button" className="stf-seeall" onClick={() => setPubOpen(true)}>see all</button></> : null}
              </div>
              {(!grpGame || pubOpen) ? (
              <table className="stf-tbl">
                <tbody>
                  {rows.map((r, i) => (
                    <tr key={r.username || i} className={isMine(r) ? 'me' : undefined}>
                      <td className="stf-pos">{r.rank != null ? `#${r.rank}` : `#${i + 1}`}</td>
                      <td className="stf-who">{r.username || 'Guest'}</td>
                      <td className="stf-st">{gameStats(r, missLabel, me && me.key) || '\u2014'}</td>
                    </tr>
                  ))}
                  {!rows.some(isMine) && board && board.myRow ? (
                    <>
                      {myRank != null && myRank > rows.length + 1 ? (
                        <tr className="gap"><td colSpan={3}>&middot;&middot;&middot;</td></tr>
                      ) : null}
                      <tr className="me">
                        <td className="stf-pos">{myRank != null ? `#${myRank}` : ''}</td>
                        <td className="stf-who">{board.myRow.username || 'You'}</td>
                        <td className="stf-st">{gameStats(board.myRow, missLabel, me && me.key) || '\u2014'}</td>
                      </tr>
                    </>
                  ) : null}
                </tbody>
              </table>
              ) : null}
            </section>
          ) : null;
          return grpGame ? [grpLine, pubBoard] : [pubBoard, grpLine];
        })()}
            {!rowsPresent && standings.length ? <div className="stf-eb">{standings.join(' \u00b7 ')}</div> : null}
            {archiveRows.length ? (
              <button type="button" className={'stf-o' + (arch ? ' on' : '')} onClick={() => setArch((v) => !v)}>
                <b>{name ? `Full ${name} archive` : 'Full archive'}</b>
                <i>{arch ? 'Hide the list' : `Every one of the ${archiveRows.length}`}</i>
              </button>
            ) : null}
        {/* The list opens under the button that asked for it, newest first. */}
        {arch && archiveRows.length ? (
          <section>
            <div className="stf-eb">
              {name ? `${name} archive` : 'Archive'} <em>&middot; {archiveRows.length}</em>
            </div>
            <div className="stf-arch">
              {archiveRows.map((a) => (
                <a key={a.num} className={'stf-archr' + (a.done ? ' done' : '')} href={a.href}>
                  <span className="d">{a.dateLabel}{a.sunday ? <i>Sunday</i> : null}</span>
                  <span className="n">No. {a.num}</span>
                  {/* WHOSE score, said out loud (owner, 2026-08-31). A bare
                      figure ahead of the word Played read as a crowd count. */}
                  <span className="v">{a.done
                    ? (a.score != null
                        ? <><em>You scored</em><b>{a.score}</b></>
                        : <em>Played</em>)
                    : 'Play'}</span>
                </a>
              ))}
            </div>
          </section>
        ) : null}
          </div>

        {/* CLAIM YOUR RANK: full width, guests only. The figure is the guest's
            would-be placement on the registered board; without one (the row
            has not landed yet) the tile still makes the offer, just without
            a number. */}
        {guest && !claimed && !isRetry ? (
          <section className="stf-claim">
            <div className="stf-eb">Claim your rank</div>
            <div className="stf-clhd">
              <div>
                <div className="stf-fwdn">
                  {board && board.guest ? (
                    <>You would be <em>#{board.guest.placement}</em>{board.guest.field ? ` of ${board.guest.field}` : ''} on {boardLabel ? <>the {String(boardLabel).toLowerCase()}</> : <>today&rsquo;s board</>}</>
                  ) : 'Your finish is not on the board yet'}
                </div>
                <div className="stf-fwdt">Ranks and points count for registered names only. A display name is enough, no password, and the games you already finished come with you.</div>
              </div>
              {!claimOpen ? (
                <button type="button" className="stf-go stf-clgo" onClick={() => setClaimOpen(true)}>Claim my rank</button>
              ) : null}
            </div>
            {claimOpen ? (
              <div className="stf-clform">
                <JoinLeaderboardForm heading="Claim your rank" hideIcon
                  onJoined={() => { setClaimed(true); if (onClaimed) onClaimed(); }} />
              </div>
            ) : null}
          </section>
        ) : null}
        {claimed ? (
          <div className="stf-claimed">You&rsquo;re on the board. Every finish counts under your name now.</div>
        ) : null}
        {/* ADD TO HOME SCREEN, below the stats on every end card (owner,
            2026-10-03). The client's own copy, which sits right before its
            #stf-stats-slot, is hidden while this card is up (see .stf-a2hs). */}
        <div className="stf-a2hs"><AddToHome name={name || 'Mind Loft'} /></div>
      </div>
    </div>
  );
}

const CSS = `
.stf{font-family:${SANS};color:var(--stg-ink);}
.stf *{box-sizing:border-box;}

/* ── the curtain ───────────────────────────────────────────────────────── */
/* ── the category row, and the list it opens ───────────────────────────── */
/* The label is now the section's own eyebrow above the row, so the row is
   just the scroller and its two arrows. */
.stf-catrow{display:flex;align-items:center;gap:8px;min-width:0;}
.stf-cats{display:flex;flex-wrap:nowrap;gap:6px;overflow-x:auto;scrollbar-width:none;
  -webkit-overflow-scrolling:touch;scroll-snap-type:x proximity;min-width:0;}
.stf-cats::-webkit-scrollbar{display:none;}
.stf-cat{scroll-snap-align:start;flex:none;}
.stf-catnav{flex:none;background:var(--stg-surf);border:1px solid var(--stg-line);border-radius:7px;
  color:var(--stg-ink2);cursor:pointer;font-size:14px;line-height:1;padding:5px 9px;}
.stf-catnav:hover{border-color:var(--stg-line2);color:var(--stg-ink);}
@media (hover:none){ .stf-catnav{display:none;} }
.stf-cat{font-family:${SANS};font-size:9.5px;letter-spacing:.12em;text-transform:uppercase;
  /* THE CHIPS TAKE THE SURFACE (owner, 2026-08-31). They were the one row on
     the card still transparent, so on the light register they showed the pale
     page ground through them while every tile and option beside them was white.
     --stg-surf is that white, and the near-black raise on the dark one. */
  font-weight:700;background:var(--stg-surf);cursor:pointer;color:var(--stg-ink2);
  border:1px solid var(--stg-line);border-left:3px solid var(--tc);border-radius:7px;
  padding:6px 11px;}
.stf-cat:hover{color:var(--stg-ink);border-color:var(--stg-line2);border-left-color:var(--tc);}
/* THE SELECTED CHIP FILLS, rather than writing its own hue as text. Colour as
   INK is the one use the ramp cannot carry: gold, orange and amber keep their
   value in the light register (they flip their ink instead of darkening, since
   a gold dark enough to hold white text is brown), so End Game, Trivia and
   Arcade as text on white are ~1.9:1 and unreadable. Filled, they are the
   ramp's own object: the step, with the step's ink on it, which is what the
   home's category bands and the curtain already are. It also reads as selected
   from further away than a coloured outline did. */
.stf-cat.on{background:var(--tc);border-color:var(--tc);color:var(--tci,${RAMP_INK});}
.stf-catlist{margin-top:12px;}

/* One tile shape for both lists: the A-to-Z panel and More-of-the-same. */
.stf-tiles{display:grid;gap:6px;grid-template-columns:repeat(auto-fill,minmax(158px,1fr));}
.stf-tile{display:flex;align-items:center;gap:7px;text-decoration:none;color:var(--stg-ink);
  background:var(--stg-surf);border:1px solid var(--stg-line);border-left:3px solid var(--tc);
  border-radius:8px;padding:8px 10px;font-size:12.5px;font-weight:700;min-width:0;}
.stf-tile svg{flex:none;color:var(--tc);}
.stf-tile span{min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;}
.stf-tile:hover{border-color:var(--stg-line2);border-left-color:var(--tc);}
/* Played today reads as done without leaving the list: the tile keeps its
   colour on the rule and gives up only its fill. */
.stf-tile.done{background:none;color:var(--stg-mute);}
/* THE HIGHLIGHT (owner, 2026-09-07): the games still open in the set are the
   one filled thing in the list, in the accent with its own ink, so the next
   tap is obvious. A finished game in the set gives up the fill like any other
   finished tile and keeps only its rule. */
.stf-tile.set{background:var(--stg-acc);color:var(--stg-onramp,#08222e);border-color:var(--stg-acc);}
.stf-tile.set svg{color:currentColor;}
.stf-tile.set:hover{border-color:var(--stg-acc);}
.stf-tile.set.done{background:none;color:var(--stg-mute);border-color:var(--stg-line);border-left-color:var(--tc);}
.stf-tile.set.done svg{color:var(--tc);}
.stf-fwdt .stf-setchip{font-style:normal;display:inline-block;margin-top:3px;font-family:${SANS};font-size:9px;letter-spacing:.12em;text-transform:uppercase;
  color:var(--stg-onramp,#08222e);background:var(--stg-acc);padding:2px 6px;border-radius:4px;}
.stf-fwdt .stf-setchip.ok{background:none;color:var(--stg-mute);border:1px solid var(--stg-line);}
.stf-o.on{border-color:var(--stg-acc);color:var(--stg-acc-ink);}

.stf-curtain{background:var(--stg-acc);color:var(--stg-onramp,#08222e);
  margin:0 calc(50% - 50vw);padding:30px calc(50vw - 50% + 4px) 26px;}
.stf-cin{max-width:720px;margin:0 auto;}
.stf-ctop{display:flex;align-items:flex-end;gap:22px;}
.stf-cl{flex:1;min-width:0;}
.stf-verdict{font-size:36px;font-weight:800;letter-spacing:-0.03em;line-height:1.05;
  text-wrap:balance;}
.stf-detail{margin-top:7px;font-size:14px;font-weight:700;opacity:.78;}
/* THE CATEGORY LINE ON THE BAND: what the flood's rack said, kept. Mono
   eyebrow plus the rack at rest, in the band's own ink at full strength on
   the pips (the contrast was measured at full strength, never dim an ink). */
.stf-bcat{margin-top:9px;display:flex;align-items:center;gap:9px;flex-wrap:wrap;
  font-family:${SANS};font-size:9.5px;letter-spacing:.12em;text-transform:uppercase;
  font-weight:700;opacity:.86;}
.stf-bcat-x{opacity:.7;}
.stf-rack{display:block;}
.stf-rk-pips{display:flex;justify-content:flex-start;flex-wrap:wrap;gap:5px;max-width:340px;margin:0 0 10px;}
.stf-rack s{text-decoration:none;display:block;width:12px;height:18px;border-radius:3px;
  border:1.5px solid currentColor;opacity:.32;
  transition:width 380ms cubic-bezier(.2,.8,.25,1),height 380ms cubic-bezier(.2,.8,.25,1),
    margin 380ms cubic-bezier(.2,.8,.25,1),border-radius 380ms ease,opacity 300ms ease;}
.stf-rack s.on{background:currentColor;opacity:1;animation:stf-rip 420ms ease both;}
.stf-rack s.new{background:currentColor;opacity:0;transform:scale(.4);
  animation:stf-rackhit 360ms cubic-bezier(.22,.8,.26,1) ${RACK_HIT}ms both;}
/* NARROW: the set's own pips at full size, the rest of the category collapsed
   to nothing. WIDE: the set shrinks to category size and the rest expands in. */
.stf-rack.grouped s.g{width:18px;height:28px;border-radius:4px;}
.stf-rack.grouped:not(.wide) s.x{width:0;opacity:0!important;margin-left:-5px;border-width:0;animation:none;}
.stf-rack.grouped.wide s.g{width:12px;height:18px;border-radius:3px;}
/* THE COMPLETION: the whole rack swells once, then the widen starts. */
.stf-rack.complete .stf-rk-pips{animation:stf-swell 600ms ease-in-out both;}
.stf-rack b small{font-size:.42em;letter-spacing:-.01em;opacity:.7;margin-left:4px;}
.stf-rack b,.stf-rack i{animation:stf-stamp 380ms cubic-bezier(.22,.8,.26,1) both;}
.stf-rk-done{display:inline-block;margin-top:12px;font-style:normal;font-family:${SANS};font-size:9px;
  letter-spacing:.12em;text-transform:uppercase;font-weight:700;padding:4px 9px;
  border:1.5px solid currentColor;border-radius:4px;animation:stf-stamp 300ms cubic-bezier(.2,.9,.3,1.3) both;}
/* At rest on the band: the set while it is open, the category once it is done. */
.stf-rack.band .stf-rk-pips{margin:0;gap:2px;max-width:none;justify-content:flex-start;}
.stf-rack.band s{width:5px;height:9px;border-radius:1.5px;border:none;background:currentColor;
  opacity:.28;animation:none;transform:none;transition:none;}
.stf-rack.band.grouped:not(.wide) s.g{width:8px;height:12px;border-radius:2px;}
.stf-rack.band.grouped:not(.wide) s.x{display:none;}
.stf-rack.band s.on,.stf-rack.band s.new{opacity:1;}
/* The personal-best ring on the pip that earned it. */
.stf-rack s.new.ring{box-shadow:0 0 0 3px var(--stg-acc),0 0 0 4.5px currentColor;}
.stf-rack.band s.new.ring{box-shadow:0 0 0 1.5px var(--stg-acc),0 0 0 2.5px currentColor;}
.stf-fl-vs{flex-basis:100%;}
.stf-vsx{display:inline-flex;align-items:baseline;gap:10px;padding:10px 14px;
  border:1.5px solid currentColor;border-radius:8px;}
.stf-vsx .was{font-family:${SANS};font-size:12px;opacity:.7;text-decoration:line-through;}
.stf-vsx .now{font-size:28px;font-weight:800;letter-spacing:-.03em;font-variant-numeric:tabular-nums;}
.stf-vsx .arr{font-size:16px;opacity:.8;}
/* THE RIVAL PAIR on the card (2026-09-26). */
.stf-vs{display:grid;grid-template-columns:1fr auto 1fr;gap:10px;align-items:center;}
.stf-vside{background:var(--stg-surf);border:1px solid var(--stg-line);border-radius:9px;padding:10px 12px;min-width:0;}
.stf-vside .nm{display:block;font-weight:700;font-size:13px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;}
.stf-vside b{display:block;font-family:${SANS};font-size:22px;font-weight:800;line-height:1.1;font-variant-numeric:tabular-nums;color:var(--stg-ink);}
.stf-vside small{display:block;font-family:${SANS};font-size:9.5px;letter-spacing:.1em;text-transform:uppercase;color:var(--stg-mute);margin-top:3px;}
.stf-vside.you{border:2px solid var(--stg-acc);padding:9px 11px;background:color-mix(in srgb,var(--stg-acc) 14%,var(--stg-surf));}
.stf-vside.you.won{border-color:var(--stg-good);background:color-mix(in srgb,var(--stg-good) 18%,var(--stg-surf));}
.stf-vside.you.won .nm{color:var(--stg-ink);}
.stf-vwin{font-style:normal;font-family:${SANS};font-size:9.5px;font-weight:800;letter-spacing:.1em;text-transform:uppercase;padding:2px 6px;border-radius:5px;border:1.5px solid var(--stg-good);color:var(--stg-ink);flex:none;line-height:1.2;white-space:nowrap;}
/* The Ahead chip sits BESIDE the name, not inside its clipping box: .nm hides
   overflow for the ellipsis, and a bordered chip taller than the 13px line had
   its bottom edge shaved off (owner, 2026-09-28, mobile). */
.stf-vside.you .nm{display:flex;align-items:center;gap:6px;overflow:visible;flex-wrap:wrap;row-gap:3px;}
.stf-vside.you .nmt{min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;}
.stf-vside.you .nm{color:var(--stg-acc-ink,var(--stg-acc));}
.stf-vsx2{font-family:${SANS};font-size:11px;color:var(--stg-mute);}
.stf-rline{margin-top:8px;font-size:13px;color:var(--stg-ink2);line-height:1.45;}
/* THE SET, PRICED (2026-09-26). */
.stf-pips{display:flex;gap:5px;}
.stf-pips i{flex:1;height:8px;border-radius:4px;background:var(--stg-surf);border:1px solid var(--stg-line);}
.stf-pips i.on{background:var(--stg-acc);border-color:var(--stg-acc);}
.stf-pips i.now{background:var(--stg-gold,#e8b43a);border-color:var(--stg-gold,#e8b43a);}
.stf-est{display:grid;grid-template-columns:repeat(auto-fit,minmax(96px,1fr));gap:6px;margin-top:10px;}
.stf-estc{display:block;text-decoration:none;color:var(--stg-ink);background:var(--stg-surf);border:1px solid var(--stg-line);border-radius:8px;padding:8px 10px;min-width:0;}
.stf-estc b{display:block;font-weight:800;font-size:13px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}
.stf-estc small{display:block;font-family:${SANS};font-size:9.5px;letter-spacing:.06em;color:var(--stg-mute);margin-top:2px;}
.stf-estc.done{opacity:.5;}
.stf-estc.done b{text-decoration:line-through;}
.stf-estc.next{border-color:var(--stg-gold,#e8b43a);}
/* THE COUNTDOWN RING on the hand-off (2026-09-26). */
.stf-fwd.auto{border-left-color:var(--stg-gold,#e8b43a);}
.stf-ring{flex:none;width:50px;height:50px;border-radius:50%;display:grid;place-items:center;
  background:conic-gradient(var(--stg-gold,#e8b43a) var(--p,0%),var(--stg-line) 0);}
.stf-ring b{width:38px;height:38px;border-radius:50%;background:var(--stg-surf);display:grid;place-items:center;
  font-family:${SANS};font-size:13px;font-weight:700;color:var(--stg-ink);}
.stf-auto{display:block;color:var(--stg-ink2);margin-bottom:3px;}
.stf-seeall{font:inherit;font-family:${SANS};font-size:9.5px;letter-spacing:.12em;text-transform:uppercase;
  background:none;border:0;padding:0;color:var(--stg-acc-ink,var(--stg-acc));cursor:pointer;font-weight:700;}
.stf-vslow{font-size:13.5px;color:var(--stg-ink2);}
.stf-vslow b{font-weight:800;color:var(--stg-ink);}
@keyframes stf-rip{ 0%{transform:none} 40%{transform:translateY(-3px)} 100%{transform:none} }
@keyframes stf-rackhit{ from{opacity:0;transform:scale(.7)} to{opacity:1;transform:none} }
@keyframes stf-swell{ 0%{transform:scale(1)} 45%{transform:scale(1.06)} 100%{transform:scale(1)} }
/* Bigger than the 22px the stats row used, smaller than the verdict: it is the
   second thing on the band, not the first. It takes the band's own ink rather
   than the green the figures row gave it, because green on the accent is the
   one colour pairing the stage does not have. */
.stf-vrow{display:flex;align-items:baseline;flex-wrap:wrap;column-gap:18px;row-gap:4px;}
.stf-ciq{flex:none;display:flex;align-items:baseline;gap:7px;text-align:left;}
.stf-ciq b{display:block;font-size:34px;font-weight:800;line-height:1;
  letter-spacing:-0.02em;font-variant-numeric:tabular-nums;}
.stf-ciq i{display:block;font-style:normal;font-size:13px;font-weight:700;
  opacity:.78;margin-top:8px;}

.stf-wrap{max-width:720px;margin:0 auto;padding:22px 4px 8px;
  display:flex;flex-direction:column;gap:20px;}
.stf-eb{font-family:${SANS};font-size:9.5px;letter-spacing:.12em;text-transform:uppercase;
  color:var(--stg-mute);margin-bottom:8px;}
.stf-eb em{font-style:normal;color:var(--stg-ink2);}

/* ── the hand-forward ──────────────────────────────────────────────────── */
.stf-fwd{display:flex;align-items:center;gap:16px;text-decoration:none;
  background:var(--stg-surf);border:1px solid var(--stg-line);
  border-left:4px solid var(--stg-acc);border-radius:10px;padding:14px 16px;color:var(--stg-ink);}
.stf-fwd:hover{border-color:var(--stg-line2);border-left-color:var(--stg-acc);}
.stf-fwdn{font-size:20px;font-weight:800;letter-spacing:-0.01em;line-height:1.15;}
.stf-fwdt{font-size:12.5px;font-weight:600;color:var(--stg-mute);margin-top:2px;}
.stf-go{margin-left:auto;flex:none;font-size:13px;font-weight:800;
  background:var(--stg-acc);color:var(--stg-onramp,#08222e);
  border-radius:8px;padding:8px 16px;}
/* ── claim your rank ──────────────────────────────────────────────────── */
.stf-claim{background:var(--stg-surf);border:1px solid var(--stg-line);
  border-left:4px solid var(--stg-acc);border-radius:10px;padding:14px 16px;color:var(--stg-ink);}
.stf-claim .stf-eb{margin-bottom:6px;}
.stf-clhd{display:flex;align-items:center;gap:16px;}
.stf-clhd > div:first-child{flex:1 1 auto;min-width:0;}
.stf-claim .stf-fwdn em{font-style:normal;}
.stf-claim .stf-fwdt{margin-top:5px;}
.stf-clgo{font:inherit;font-size:13px;font-weight:800;border:0;cursor:pointer;}
.stf-clform{margin-top:14px;padding-top:14px;border-top:1px solid var(--stg-line);}
.stf-clform h2{font-size:20px!important;}
.stf-claimed{background:var(--stg-surf);border:1px solid var(--stg-line);
  border-left:4px solid var(--stg-good);border-radius:10px;padding:12px 16px;
  font-weight:800;font-size:13.5px;color:var(--stg-ink);}
@media(max-width:560px){.stf-clhd{flex-direction:column;align-items:stretch;}
  .stf-clgo{margin-left:0;text-align:center;}}
/* The retry control is the hand-forward as a BUTTON: same shape, same accent
   rule, same chip. .stf-fwd is written for an <a>, so a button needs the four
   properties a form control does not inherit. */
.stf-rt{width:100%;font:inherit;text-align:left;cursor:pointer;}
.stf-rt .stf-eb{margin-bottom:5px;}
/* Nothing follows the curtain but the control, so the page does not need the
   full ending's breathing room above it. */
.stf-rtwrap .stf-wrap{padding-top:18px;gap:9px;}

/* ── the board ─────────────────────────────────────────────────────────── */
.stf-tbl{width:100%;border-collapse:collapse;font-variant-numeric:tabular-nums;}
.stf-tbl td{padding:7px 6px;border-bottom:1px solid var(--stg-line);font-size:13.5px;}
.stf-tbl tr:last-child td{border-bottom:0;}
.stf-tbl tr.me td{background:var(--stg-acc);color:var(--stg-onramp,#fff);font-weight:800;
  border-bottom-color:transparent;}
/* The three cells that set their own colour need it taken back off them, or
   the mute grey and the ink2 survive on top of the fill. */
.stf-tbl tr.me .stf-pos,.stf-tbl tr.me .stf-st{color:var(--stg-onramp,#fff);}
.stf-tbl tr.me td:first-child{border-radius:7px 0 0 7px;}
.stf-tbl tr.me td:last-child{border-radius:0 7px 7px 0;}
/* The elision between the five and a distant finisher. */
.stf-tbl tr.gap td{text-align:center;letter-spacing:.3em;color:var(--stg-mute);
  padding:2px 6px;border-bottom:0;font-size:11px;}
.stf-pos{width:44px;font-family:${SANS};font-size:12px;color:var(--stg-mute);}
.stf-who{font-weight:700;}
/* One column, right-aligned, and NOT width-capped: it holds a sentence of
   figures whose length varies by game (a sudoku has no tries, an End Game row
   has no guesses), so a fixed width would either truncate it or leave a hole. */
.stf-st{text-align:right;white-space:nowrap;color:var(--stg-ink2);font-size:12.5px;
  font-variant-numeric:tabular-nums;}

/* ── this game's back catalogue ────────────────────────────────────────── */
.stf-arch{display:grid;gap:5px;max-height:420px;overflow-y:auto;}
.stf-archr{display:flex;align-items:center;gap:10px;text-decoration:none;color:var(--stg-ink);
  background:var(--stg-surf);border:1px solid var(--stg-line);border-radius:8px;
  padding:9px 12px;font-size:13px;}
.stf-archr:hover{border-color:var(--stg-line2);}
.stf-archr .d{font-weight:700;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;}
.stf-archr .d i{font-style:normal;font-family:${SANS};font-size:8.5px;letter-spacing:.1em;
  text-transform:uppercase;color:var(--stg-acc-ink);margin-left:7px;}
.stf-archr .n{font-family:${SANS};font-size:11px;color:var(--stg-mute);}
.stf-archr .v{margin-left:auto;flex:none;display:flex;align-items:center;gap:7px;
  font-size:12.5px;font-weight:800;color:var(--stg-acc-ink);}
.stf-archr .v em{font-style:normal;font-family:${SANS};font-size:8.5px;letter-spacing:.1em;
  text-transform:uppercase;font-weight:700;color:var(--stg-mute);}
.stf-archr .v b{font-variant-numeric:tabular-nums;color:var(--stg-ink);}
/* Played gives up its fill, exactly as a played tile does. */
.stf-archr.done{background:none;}
.stf-archr.done .d{color:var(--stg-mute);}

/* ── the options ───────────────────────────────────────────────────────── */
.stf-opts{display:grid;gap:7px;grid-template-columns:1fr 1fr;}
/* A LONE TILE TAKES THE WHOLE ROW. The retry ending puts exactly one option
   here ("Show end game card"), so a two-column track leaves it at half width
   under a full-width "Replay instantly" and the pair reads as a mistake.
   Written as :has() rather than a class on that one call site, so any future
   single-tile row is right without anyone remembering this. */
.stf-opts:has(> :only-child){grid-template-columns:1fr;}
/* Share asks for something rather than offering something, and it is the last
   thing on the card: it takes a row of its own. The wide class is the tail of
   an odd run, widened so a run of half tiles can never end on a dead slot. */
.stf-opts > .stf-o.gold,.stf-opts > .stf-o.wide{grid-column:1/-1;}
.stf-o{display:block;text-align:left;text-decoration:none;cursor:pointer;font:inherit;
  background:var(--stg-surf);border:1px solid var(--stg-line);border-radius:9px;
  padding:11px 13px;color:var(--stg-ink);}
.stf-o:hover{border-color:var(--stg-line2);}
.stf-o b{display:block;font-size:14px;font-weight:800;}
.stf-o i{display:block;font-style:normal;font-size:11.5px;font-weight:600;
  color:var(--stg-mute);margin-top:2px;}
/* The gold Share keeps its own weight: it is the one option that asks for
   something rather than offering something. */
.stf-o.gold{background:var(--stg-acc);color:var(--stg-onramp,#08222e);border-color:transparent;}
/* The pair keeps its own two-up track whatever the parent is doing, so 'Play
   another' and the archive sit beside each other at every width. */
.stf-pair{grid-column:1/-1;display:grid;gap:7px;grid-template-columns:1fr 1fr;}
.stf-o.gold i{color:inherit;opacity:.78;}
.stf-o:focus-visible,.stf-fwd:focus-visible{outline:2px solid var(--stg-acc);outline-offset:2px;}

/* ── the flood ─────────────────────────────────────────────────────────── */
/* Below the safe-area strip (z-index 10000, status-bar chrome) and above
   everything else on a stage page, whose own chrome caps at 5. */
.stf-flood{position:fixed;inset:0;z-index:9000;cursor:pointer;box-sizing:border-box;
  background:var(--stg-acc);color:var(--stg-onramp,#08222e);
  display:flex;align-items:flex-start;justify-content:center;overflow-x:hidden;overflow-y:auto;
  overscroll-behavior:contain;
  padding:clamp(40px,9vh,110px) max(24px,env(safe-area-inset-right)) max(28px,env(safe-area-inset-bottom)) max(24px,env(safe-area-inset-left));
  opacity:0;-webkit-clip-path:inset(0 0 0 0);clip-path:inset(0 0 0 0);
  transition:opacity 180ms ease,clip-path 640ms cubic-bezier(.2,.8,.25,1),
    -webkit-clip-path 640ms cubic-bezier(.2,.8,.25,1);}
.stf-flood.up,.stf-flood.shrink{opacity:1;}
/* The clip has landed by now, so the colour is exactly the band: fading it out
   is colour onto colour, and what appears through it is the band's own words. */
.stf-flood.out{opacity:0;transition:opacity 200ms ease;}

.stf-fl-in{width:100%;max-width:720px;min-width:0;box-sizing:border-box;text-align:left;opacity:0;
  transform:translateY(12px) scale(.985);
  transition:opacity 320ms ease,transform 420ms cubic-bezier(.2,.8,.25,1);}
.stf-flood.up .stf-fl-in,.stf-flood.shrink .stf-fl-in{opacity:1;transform:none;}
/* Out before the shape moves, so the words are never caught in the collapse. */
.stf-flood.shrink .stf-fl-in{opacity:0;transform:translateY(-16px);
  transition:opacity 240ms ease,transform 420ms ease;}

.stf-fl-v{font-size:clamp(34px,6.4vw,72px);font-weight:800;letter-spacing:-.04em;
  line-height:.98;text-wrap:balance;}
.stf-fl-d{margin-top:10px;font-size:clamp(13px,1.8vw,17px);font-weight:700;opacity:.78;}
/* ONE SCREEN (2026-09-26): a column of landings. The three numbers share a
   row; the rival and the field take a line each under a hairline; the set
   rack and the streak strip pair up at the foot. */
.stf-fl-figs{margin-top:18px;display:flex;flex-direction:column;align-items:stretch;gap:0;}
.stf-fl-row{display:grid;grid-template-columns:1.3fr 1fr 1fr;gap:12px;align-items:end;}
.stf-fl-block{margin-top:16px;padding-top:14px;border-top:1px solid rgba(0,0,0,.16);}
[data-stage-theme="light"] .stf-fl-block,[data-stage-theme="light"] .stf-fl-pair{border-top-color:rgba(255,255,255,.32);}
.stf-fl-pair{margin-top:16px;padding-top:14px;border-top:1px solid rgba(0,0,0,.16);
  display:grid;grid-template-columns:minmax(0,1fr) minmax(0,1fr);gap:18px;align-items:start;}
/* Both halves may shrink below their content: a plain 1fr floors at
   min-content, and the streak strip is the right-hand column, so any overflow
   pushed its tomorrow pip off the screen (owner, 2026-09-28, mobile). */
.stf-fl-pair > *,.stf-fl-block,.stf-rvf > *{min-width:0;}
.stf-fl-lab{overflow-wrap:anywhere;}
.stf-dstrip{width:100%;box-sizing:border-box;padding-right:2px;}
.stf-fl-lab{display:block;font-family:${SANS};font-size:clamp(9px,1.1vw,10.5px);letter-spacing:.12em;
  text-transform:uppercase;opacity:.8;margin-bottom:8px;font-weight:700;}
.stf-fl-figs .stf-fl-block i,.stf-fl-figs .stf-fl-pair i{display:block;font-style:normal;font-size:clamp(12px,1.5vw,14px);font-weight:700;
  opacity:.85;margin-top:8px;letter-spacing:0;text-transform:none;font-family:${SANS};}
.stf-rvf{display:grid;grid-template-columns:minmax(0,1fr) auto minmax(0,1fr);gap:12px;align-items:end;}
.stf-fl-figs .stf-rvf small{display:block;font-family:${SANS};font-size:9.5px;letter-spacing:.12em;text-transform:uppercase;opacity:.8;margin-bottom:5px;}
.stf-fl-figs .stf-rvf b{display:block;font-size:clamp(26px,4.4vw,40px);font-weight:800;letter-spacing:-.03em;line-height:1;font-variant-numeric:tabular-nums;}
.stf-rvf .you{text-align:right;border:2px solid currentColor;border-radius:9px;padding:7px 10px;}
.stf-rvf .you.won{border-width:3px;box-shadow:0 0 0 3px color-mix(in srgb,currentColor 22%,transparent);}
.stf-rvf .x{font-family:${SANS};font-size:12px;opacity:.7;padding-bottom:6px;}
.stf-bars{display:flex;align-items:flex-end;gap:3px;height:clamp(40px,7vh,64px);}
.stf-bars s{text-decoration:none;flex:1;display:block;background:rgba(0,0,0,.2);border-radius:2px 2px 0 0;
  transform-origin:bottom;animation:stf-bar 480ms cubic-bezier(.2,.8,.2,1) both;}
[data-stage-theme="light"] .stf-bars s{background:rgba(255,255,255,.4);}
.stf-bars s.me{background:currentColor;}
@keyframes stf-bar{ from{transform:scaleY(0)} to{transform:none} }
.stf-dstrip{display:flex;gap:4px;}
.stf-dstrip s{text-decoration:none;flex:1;display:block;height:12px;border-radius:6px;background:currentColor;opacity:.9;
  animation:stf-rackhit 340ms cubic-bezier(.22,.8,.26,1) both;}
.stf-dstrip s.off{background:none;border:1.5px solid currentColor;opacity:.35;}
.stf-dstrip s.next{background:none;border:1.5px dashed currentColor;opacity:1;}
/* THE STAMP. An overshoot on the way down, so a figure lands rather than
   fades: it is the one motion on this screen that says a number just arrived.
   The fill holds the end state, since each figure mounts once and never leaves. */
.stf-fl-fig{flex:none;animation:stf-stamp 480ms cubic-bezier(.22,.8,.26,1) both;}
.stf-fl-fig b{display:block;font-size:clamp(24px,4.2vw,44px);font-weight:800;
  line-height:.92;letter-spacing:-.03em;font-variant-numeric:tabular-nums;}
.stf-fl-fig i{display:block;font-style:normal;font-family:${SANS};
  font-size:clamp(9px,1.15vw,11px);letter-spacing:.12em;text-transform:uppercase;
  opacity:.72;margin-top:9px;}
/* The IQ is the number they came for, so it takes a line of its own at display
   size and the standings land in a row underneath it. */
.stf-fl-fig.lead{flex-basis:100%;}
/* The rack takes a line of its own under the standings, pips over the count. */
.stf-fl-rack{flex-basis:100%;margin-top:6px;}
.stf-fl-fig.lead b{font-size:clamp(40px,7vw,80px);line-height:.9;letter-spacing:-.05em;}
.stf-fl-fig.lead i{font-size:clamp(10px,1.4vw,13px);letter-spacing:.18em;
  opacity:.78;margin-top:10px;}
.stf-fl-fig.lead{flex-basis:auto;}
.stf-fl-rack{flex-basis:auto;margin-top:0;}
.stf-fl-rack .stf-rack b{display:block;font-size:clamp(22px,3.6vw,34px);font-weight:800;letter-spacing:-.03em;line-height:1;}
.stf-fl-rack .stf-rack i{display:block;font-style:normal;font-family:${SANS};font-size:9.5px;letter-spacing:.12em;text-transform:uppercase;opacity:.75;margin-top:6px;}
/* A SHORT SCREEN (an iPhone SE, a landscape phone) steps everything down so
   all six landings still fit above the tap hint. */
@media (max-height:720px){
  .stf-flood{padding-top:clamp(28px,6vh,60px);}
  .stf-fl-v{font-size:clamp(30px,5.6vw,60px);}
  .stf-fl-figs{margin-top:12px;}
  .stf-fl-fig.lead b{font-size:clamp(34px,6vw,64px);}
  .stf-fl-fig b{font-size:clamp(22px,3.6vw,36px);}
  .stf-fl-block,.stf-fl-pair{margin-top:11px;padding-top:10px;}
  .stf-fl-lab{margin-bottom:5px;}
  .stf-bars{height:clamp(32px,6vh,48px);}
  .stf-fl-block i,.stf-fl-pair i{margin-top:5px;font-size:12px;}
  .stf-fl-figs .stf-rvf b{font-size:clamp(22px,3.8vw,32px);}
  .stf-fl-skip{bottom:10px;}
}
.stf-fl-skip{position:absolute;left:0;right:0;bottom:26px;text-align:center;
  font-family:${SANS};font-size:10px;letter-spacing:.12em;text-transform:uppercase;
  font-weight:700;opacity:0;animation:stf-hint 400ms ease 0s both;}
@keyframes stf-hint{ from{opacity:0} to{opacity:.42} }
@keyframes stf-stamp{
  from{opacity:0;transform:translateY(8px);}
  to{opacity:1;transform:none;}
}


@media (max-width:640px){
  .stf-flood{padding:clamp(34px,7vh,80px) max(18px,env(safe-area-inset-right)) max(34px,env(safe-area-inset-bottom)) max(18px,env(safe-area-inset-left));}
  .stf-fl-d{margin-top:8px;}
  .stf-fl-figs{margin-top:14px;}
  .stf-fl-row{gap:8px;}
  .stf-fl-fig i{margin-top:7px;}
  .stf-fl-fig.lead i{margin-top:10px;}
  .stf-curtain{padding:22px 18px 20px;}
  .stf-verdict{font-size:27px;}
  /* THE STANDINGS COME OFF THE PHONE (owner, 2026-08-31). The line under the
     verdict is the run itself -- the score, the misses, the clock -- and at
     390px appending a rank and a streak to it wraps that sentence onto a third
     and fourth line to say what the card says again further down. The IQ stays,
     smaller: it is the number the reader came for. */
  .stf-dx{display:none;}
  .stf-ctop{gap:14px;}
  .stf-ciq b{font-size:26px;}
  .stf-ciq i{font-size:11.5px;margin-top:6px;}
  .stf-st{font-size:11px;}
  .stf-wrap{padding:18px 2px 8px;gap:17px;}
}

/* ── THE FIVE DOORS (owner, 2026-10-01) ────────────────────────────────── */
.stf-doors{display:grid;gap:8px;grid-template-columns:1fr 1fr;}
.stf-door{display:flex;align-items:center;gap:12px;text-align:left;text-decoration:none;cursor:pointer;
  font:inherit;color:var(--stg-ink);background:var(--stg-surf);border:1px solid var(--stg-line);
  border-radius:10px;padding:14px 15px;min-width:0;}
.stf-door:hover{border-color:var(--stg-line2);}
.stf-door:focus-visible{outline:2px solid var(--stg-acc);outline-offset:2px;}
.stf-dic{flex:none;width:34px;height:34px;border-radius:8px;display:grid;place-items:center;
  color:var(--stg-acc-ink,var(--stg-acc));background:color-mix(in srgb,var(--stg-acc) 16%,transparent);}
.stf-dtx{flex:1;min-width:0;}
.stf-dnm{display:block;font-size:15px;font-weight:800;letter-spacing:-.01em;line-height:1.2;}
.stf-dsb{display:block;margin-top:3px;font-size:12px;font-weight:600;color:var(--stg-mute);
  white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}
.stf-dar{flex:none;font-size:20px;line-height:1;color:var(--stg-mute);transition:transform .2s ease;}
.stf-door[aria-expanded="true"]{border-color:var(--stg-acc);}
.stf-door[aria-expanded="true"] .stf-dar{transform:rotate(90deg);color:var(--stg-acc-ink,var(--stg-acc));}
.stf-door.pri{grid-column:1/-1;background:var(--stg-acc);border-color:var(--stg-acc);
  color:var(--stg-onramp,#08222e);padding:17px;}
.stf-door.pri:hover{border-color:var(--stg-acc);filter:brightness(1.05);}
.stf-door.pri .stf-dic{background:color-mix(in srgb,currentColor 14%,transparent);color:inherit;}
.stf-door.pri .stf-dnm{font-size:18px;}
.stf-door.pri .stf-dsb{color:inherit;opacity:.85;}
.stf-dgo{flex:none;font-family:${SANS};font-size:10.5px;letter-spacing:.12em;text-transform:uppercase;
  font-weight:700;border:1.5px solid currentColor;border-radius:6px;padding:6px 10px;}
.stf-doors > .stf-door.wide{grid-column:1/-1;}
.stf-drawer{grid-column:1/-1;display:flex;flex-direction:column;gap:18px;min-width:0;
  background:var(--stg-raise);border:1px solid var(--stg-line);border-radius:10px;padding:14px 15px;}
.stf-drawer[hidden]{display:none;}
.stf-wrap > .stf-statcards{margin-top:14px;}
.stf-dchip{display:inline-block;font-family:${SANS};font-size:9px;letter-spacing:.12em;text-transform:uppercase;font-weight:700;
  padding:2px 6px;border-radius:4px;background:var(--stg-acc);color:var(--stg-onramp,#08222e);margin-right:7px;vertical-align:2px;}
.stf-door.set{border:1.5px solid var(--stg-acc);background:color-mix(in srgb,var(--stg-acc) 12%,var(--stg-surf));}
.stf-door.set .stf-dic{background:var(--stg-acc);color:var(--stg-onramp,#08222e);}
.stf-a2hs:empty{display:none;}
/* While the full card is up, the client's own Add to Home Screen (the button,
   or the one-button wrapper, sitting right before #stf-stats-slot) steps aside
   for the one above, so it reads once and above How to play. */
body:has(.stf-a2hs) :is(button,div):has(+ #stf-stats-slot):has(.lucide-smartphone){display:none !important;}
.stf-statcards{scroll-margin-top:72px;}
@media (max-width:640px){
  .stf-doors{gap:6px;}
  .stf-door{padding:12px;gap:10px;}
  .stf-dic{width:30px;height:30px;}
  .stf-dnm{font-size:14px;}
  .stf-dar{display:none;}
  .stf-door.pri .stf-dnm{font-size:16px;}
  .stf-drawer{padding:12px;}
}
@media (max-width:420px){ .stf-doors{grid-template-columns:1fr;} }

/* THE STREAK STRIP FITS ITS COLUMN AT ANY WIDTH (owner, 2026-10-01: the
   dashed tomorrow pip was clipped on the right on a phone). Eight equal grid
   tracks that may shrink to nothing, rather than flex items that floor at
   their border width, and a few pixels of room at the end for the dashed
   outline. The flood's own right gutter widens a touch on a phone too. */
.stf-fl-strip{min-width:0;max-width:100%;}
.stf-dstrip{display:grid;grid-template-columns:repeat(8,minmax(0,1fr));gap:3px;width:100%;
  max-width:100%;padding-right:4px;}
.stf-dstrip s{min-width:0;flex:none;}
@media (max-width:640px){
  .stf-flood{padding-right:max(24px,env(safe-area-inset-right));padding-left:max(20px,env(safe-area-inset-left));}
  .stf-fl-pair{gap:14px;}
}

/* Back to board, on the band, right of the verdict (owner, 2026-10-01).
   IN THE FLOW, not floated over the corner (owner report, 2026-10-03: a longer
   verdict ran the IQ into it on a phone). It used to be absolutely positioned
   with the verdict row padded by a GUESS at its width (120px on a phone), and
   the button is wider than that guess and changes with its own label. As a
   flex item that never shrinks it takes exactly the room it needs, and the
   verdict and IQ wrap in whatever is left, whatever the words. */
.stf-cin.stf-hasback{display:flex;align-items:flex-start;gap:12px;}
/* THE RIGHT COLUMN (2026-10-07): Back to board, then the run's one big figure
   or the two figures of a challenge. */
.stf-rc{order:1;flex:none;display:flex;flex-direction:column;align-items:flex-end;gap:12px;max-width:52%;}
.stf-rc .stf-back{order:0;}
.stf-bfig{text-align:right;}
.stf-bfig b{display:block;font-size:42px;font-weight:800;letter-spacing:-.04em;line-height:.95;font-variant-numeric:tabular-nums;}
.stf-bfig small{display:block;margin-top:6px;font-family:${SANS};font-size:9.5px;letter-spacing:.12em;text-transform:uppercase;font-weight:700;}
.stf-duel{display:flex;align-items:flex-end;gap:10px;}
.stf-duel div{text-align:left;min-width:0;}
.stf-duel .them{text-align:right;}
.stf-duel small{display:block;font-family:${SANS};font-size:9.5px;letter-spacing:.12em;text-transform:uppercase;font-weight:700;
  max-width:120px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;}
.stf-duel b{display:block;font-size:36px;font-weight:800;letter-spacing:-.04em;line-height:1;font-variant-numeric:tabular-nums;}
.stf-duel .them.beat b{text-decoration:line-through;text-decoration-thickness:2px;}
.stf-duel i{font-style:normal;font-family:${SANS};font-size:11px;font-weight:800;padding-bottom:6px;}
.stf-chline{margin-top:7px;font-size:16px;font-weight:800;letter-spacing:-.01em;}
/* THE BAND, GRADED (owner, 2026-10-07). Gold is a literal in both registers:
   a gold dark enough to hold white ink is brown, so it keeps its value and
   takes dark ink, the same ruling the ramp makes for its warm steps. */
.stf-pb .stf-curtain,.stf-flood.t-pb{background:#e8b43a;color:#2a1f04;}
.stf-pb .stf-curtain{position:relative;overflow:hidden;}
.stf-pb .stf-curtain::after{content:"";position:absolute;inset:0;pointer-events:none;
  background:linear-gradient(105deg,transparent 42%,rgba(255,255,255,.5) 50%,transparent 58%);
  transform:translateX(-100%);animation:stf-sheen 1000ms ease 500ms 1 both;}
.stf-pb .stf-cin{position:relative;z-index:1;}
@keyframes stf-sheen{ to{transform:translateX(100%)} }
.stf-miss .stf-curtain,.stf-flood.t-lost{background:var(--stg-raise);color:var(--stg-ink);}
.stf-miss .stf-curtain{border-bottom:1px solid var(--stg-line);}
/* THE MISS BAND HAS TO READ AS A BAND IN DARK (owner, 2026-10-07). Raise is
   #0e131f against a #0b0f1a page, so the band vanished and everything dimmed on
   it (detail .78, eyebrow .86, unlit pips .28, the Retry hairline) sank into the
   page. A rose wash off --stg-bad gives it a ground in BOTH registers, and the
   ink on it stops leaning on opacity: secondary lines take --stg-mute instead. */
.stf-miss .stf-curtain,.stf-flood.t-lost{background:color-mix(in srgb,var(--stg-bad) 13%,var(--stg-raise));}
.stf-miss .stf-curtain{border-top:1px solid color-mix(in srgb,var(--stg-bad) 30%,transparent);
  border-bottom:1px solid color-mix(in srgb,var(--stg-bad) 30%,transparent);}
.stf-miss .stf-detail,.stf-miss .stf-bcat,.stf-miss .stf-bcat-x{opacity:1;}
.stf-miss .stf-bcat-x{color:var(--stg-mute);}
.stf-miss .stf-rack.band s{opacity:.5;}
.stf-miss .stf-rack.band s.on,.stf-miss .stf-rack.band s.new{opacity:1;}
.stf-miss .stf-back{border-color:var(--stg-ink);color:var(--stg-ink);}
.stf-miss .stf-cin{border-left:4px solid var(--stg-bad);padding-left:14px;}
@media (prefers-reduced-motion:reduce){ .stf-pb .stf-curtain::after{animation:none;} }
/* THE CHALLENGE DOOR. Solid gold with its own dark ink set on every part of
   it: the mock-up's sub line inherited the mute grey and could not be read. */
.stf-door.chal{grid-column:1/-1;background:#e8b43a;border-color:#e8b43a;color:#2a1f04;}
.stf-door.chal:hover{border-color:#e8b43a;filter:brightness(1.05);}
.stf-door.chal .stf-dic{background:rgba(42,31,4,.14);color:#2a1f04;}
.stf-door.chal .stf-dnm{font-size:17px;color:#2a1f04;}
.stf-door.chal .stf-dsb{color:#2a1f04;font-weight:700;white-space:normal;}
.stf-door.chal .stf-dgo{color:#2a1f04;}
/* A GAME'S DOOR SHOWS THE GAME (owner, 2026-10-07): its own glyph, large, in a
   box of its own, and it draws itself in once. */
.stf-dic.art{width:46px;height:46px;border-radius:10px;}
.stf-door.pri .stf-dic.art{width:56px;height:56px;border-radius:12px;}
.stf-dic.art .gg-p{stroke-dasharray:1;animation:stf-draw 900ms ease 250ms both;}
@keyframes stf-draw{ from{stroke-dashoffset:1} to{stroke-dashoffset:0} }
@media (prefers-reduced-motion:reduce){ .stf-dic.art .gg-p{animation:none;} }
@media (max-width:560px){
  .stf-bfig b{font-size:30px;} .stf-duel b{font-size:25px;} .stf-duel{gap:7px;}
  .stf-dic.art{width:40px;height:40px;} .stf-door.pri .stf-dic.art{width:46px;height:46px;}
  .stf-miss .stf-cin{padding-left:10px;}
}
.stf-hasback > .stf-ctop{flex:1;min-width:0;}
.stf-back{order:1;flex:none;margin-top:4px;display:inline-flex;align-items:center;gap:6px;white-space:nowrap;
  font:inherit;font-family:${SANS};font-size:10.5px;letter-spacing:.12em;text-transform:uppercase;font-weight:700;
  color:inherit;background:transparent;border:1.5px solid currentColor;border-radius:7px;padding:7px 11px;cursor:pointer;}
.stf-back span{font-size:13px;letter-spacing:0;}
.stf-back:hover{background:color-mix(in srgb,currentColor 12%,transparent);}
.stf-back:focus-visible{outline:2px solid currentColor;outline-offset:2px;}
.stf-vrow .stf-ciq i{margin-top:0;}
/* The Play similar door and its countdown. */
.stf-pwrap{grid-column:1/-1;display:flex;gap:8px;min-width:0;}
.stf-pwrap > .stf-door{flex:1;}
.stf-decl{flex:none;font:inherit;font-size:13px;font-weight:800;cursor:pointer;color:var(--stg-ink);
  background:var(--stg-surf);border:1px solid var(--stg-line);border-radius:10px;padding:0 16px;}
.stf-decl:hover{border-color:var(--stg-line2);}
.stf-door.pri .stf-ring{width:38px;height:38px;
  background:conic-gradient(currentColor var(--p,0%),color-mix(in srgb,currentColor 18%,transparent) 0);}
.stf-door.pri .stf-ring b{width:30px;height:30px;background:var(--stg-acc);color:inherit;font-size:12px;}
.stf-homeln{align-self:flex-start;text-decoration:none;}
.stf-drawer .stf-catlist{margin-top:12px;}
@media (max-width:640px){
  .stf-back{margin-top:2px;padding:6px 9px;font-size:9.5px;}
  .stf-cin.stf-hasback{gap:10px;}
  .stf-pwrap{gap:6px;}
  .stf-decl{padding:0 11px;font-size:12px;}
  .stf-door.pri .stf-ring{width:32px;height:32px;}
  .stf-door.pri .stf-ring b{width:25px;height:25px;font-size:11px;}
}
/* ONE FAMILY ON THE CARD (owner, 2026-10-07, option B). The card used to set
   its labels and four kinds of numbers in JetBrains Mono, which no page ever
   loaded, so they drew in the system mono (Consolas / Courier New on Windows,
   SF Mono on an iPhone) beside Manrope. Labels are Manrope 800 caps now, every
   figure Manrope 800 with tabular digits, and "IQ earned" is a label too. */
.stf-cat,
.stf-fwdt .stf-setchip,
.stf-bcat,
.stf-rk-done,
.stf-vsx .was,
.stf-vside b,
.stf-vside small,
.stf-vwin,
.stf-vsx2,
.stf-estc small,
.stf-ring b,
.stf-seeall,
.stf-eb,
.stf-pos,
.stf-archr .d i,
.stf-archr .n,
.stf-archr .v em,
.stf-fl-lab,
.stf-fl-figs .stf-rvf small,
.stf-rvf .x,
.stf-fl-fig i,
.stf-fl-rack .stf-rack i,
.stf-fl-skip,
.stf-dgo,
.stf-dchip,
.stf-bfig small,
.stf-duel small,
.stf-duel i,
.stf-back{font-weight:800;}
.stf-pos,.stf-vside b,.stf-ring b,.stf-archr .n,.stf-vsx .was,.stf-rvf .x{font-weight:800;font-variant-numeric:tabular-nums;}
.stf-vrow .stf-ciq i{font-size:10px;font-weight:800;letter-spacing:.11em;text-transform:uppercase;opacity:.86;}
/* CHALLENGE IS AS TALL AS PLAY SIMILAR (owner, 2026-10-07): same padding and
   floor, so they match with Play similar's glyph or its countdown ring. */
.stf-door.chal,.stf-door.pri{min-height:92px;padding:17px;}
.stf-door.chal .stf-dic{width:56px;height:56px;border-radius:12px;}
.stf-door.chal .stf-dnm{font-size:18px;}
.stf-door.chal .stf-dsb{white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}
@media (max-width:640px){
  .stf-door.chal .stf-dic{width:46px;height:46px;}
  .stf-door.chal .stf-dnm{font-size:16px;}
}

`;
