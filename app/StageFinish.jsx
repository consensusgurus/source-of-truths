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
import { groupOf, groupsIn } from '@/lib/daily-groups';
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
import { gameStats } from '@/lib/daily-row-stats';
import GameGlyph from './GameGlyph';
import JoinLeaderboardForm from './quiz/[id]/JoinLeaderboardForm';

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
const FLOOD_SETTLE = 4500;  // a beat on the finished set, to read it whole
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
const FLOOD_HARD = 9000;
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
function CurtainFlood({ title, detail, iq, board, gameRank, streak, ready = null, bandRef, onDone, quick = false, boardWhen = null, catRun = null }) {
  const [phase, setPhase] = useState('');     // '' -> up -> shrink -> out
  const [clip, setClip] = useState(null);
  const [held, setHeld] = useState(false);    // the floor has passed
  const [expired, setExpired] = useState(false);   // done waiting for stragglers
  const [hint, setHint] = useState(false);         // 'tap to skip' is showing
  const [shown, setShown] = useState(0);      // how far the queue has been walked
  const doneRef = useRef(false);
  const goneRef = useRef(false);              // the collapse has been started
  const stepRef = useRef(-1);                 // the queue step already being timed
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
    {
      k: 'streak',
      has: !!streak,
      value: streak,
      label: 'day streak',
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
    {
      k: 'cat', rack: true,
      has: !!(catRun && catRun.games.length),
      wide: !!(catRun && catRun.complete),
      value: catRun ? catRun.n : null,
      label: catRun ? `of ${catRun.games.length} ${catRun.cat} today` : '',
    },
  ]), [iq, board, gameRank, streak, quick, boardWhen, catRun]);

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

  // WALKING THE QUEUE. One step per effect run, so a figure's dwell is a real
  // wait rather than a schedule laid out in advance against data that had not
  // arrived yet.
  useEffect(() => {
    if (!held || goneRef.current || shown >= figs.length) return;
    const next = figs[shown];
    if (next.has) {
      // ONE DWELL PER STEP, guarded by a ref. This effect re-runs every time any
      // of the four props arrives, and `figs` is a fresh array each time; a
      // dwell scheduled with a cleanup would be cancelled and RESTARTED by the
      // next arrival, so a figure that landed while another read was in flight
      // could sit there for two or three dwells.
      if (stepRef.current === shown) return;
      stepRef.current = shown;
      // ITS DWELL IS ITS COUNT. This is the whole point of the second pass: the
      // queue cannot move on, and the screen cannot leave, until the number has
      // finished climbing.
      at(next.count ? FLOOD_COUNT + 180 : next.rack ? (next.wide ? FLOOD_RACK_WIDE : FLOOD_RACK) : FLOOD_STAMP, () => setShown((s) => s + 1));
      return;
    }
    // No value. Settled means skip; still reading means hold the queue here,
    // which is the wait the whole sequence exists to fill.
    if (ready !== false || expired) setShown((s) => s + 1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [held, shown, figs, ready, expired]);

  // THE COLLAPSE, once the queue has run out (or the backstop has fired).
  useEffect(() => {
    if (!held || goneRef.current) return;
    if (shown < figs.length) return;
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
  }, [held, shown, figs]);

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
      className={'stf-flood' + (phase ? ' ' + phase : '')}
      aria-hidden="true"
      onClick={finish}
      style={clip ? { clipPath: clip, WebkitClipPath: clip } : undefined}
    >
      <div className="stf-fl-in">
        <div className="stf-fl-v">{title}</div>
        {detail ? <div className="stf-fl-d">{detail}</div> : null}
        {/* Each figure mounts when the queue reaches it, so the stamp is a CSS
            animation on mount rather than a class anyone has to toggle. */}
        <div className="stf-fl-figs">
          {figs.map((f, i) => ((i < shown && f.has) ? (
            <div className={'stf-fl-fig' + (f.lead ? ' lead' : '') + (f.rack ? ' stf-fl-rack' : '')} key={f.k}>
              {f.rack ? <CategoryRack run={catRun} /> : (
                <>
                  <b>{f.count ? <>+<FloodCount to={f.value} ms={FLOOD_COUNT} /></> : f.value}</b>
                  <i>{f.label}</i>
                </>
              )}
            </div>
          ) : null))}
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
function CategoryRack({ run, band = false }) {
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
            className={(x.key === run.me ? 'new' : x.done ? 'on' : '') + ((!grouped || inSet.has(x.key)) ? ' g' : ' x')}
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

// The line under the verdict on the band, and the rack at rest beside it.
// One component for both curtains so they cannot disagree.
function BandCat({ run }) {
  if (!run || !run.games.length) return null;
  const g = run.group;
  const total = run.games.length;
  return (
    <div className="stf-bcat">
      {g ? (run.complete
        ? <span>{g.name} done &middot; {run.cat} &middot; {run.n} of {total} today</span>
        : <span>{g.name} &middot; {g.n} of {g.games.length} today</span>)
        : <span>{run.cat} &middot; {run.n} of {total} today</span>}
      <CategoryRack run={run} band />
      {g && !run.complete ? <span className="stf-bcat-x">&middot; {run.cat} {run.n} of {total}</span> : null}
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

const MONO = "'JetBrains Mono', ui-monospace, SFMono-Regular, Menlo, monospace";
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
    const grp = groupOf(me.key);
    const inCat = LIVE().filter((g) => g.cat === me.cat);
    const done = (g) => played.has(g.key) || g.key === me.key || (forceDone && !!grp && grp.keys.includes(g.key));
    const games = inCat.map((g) => ({ key: g.key, done: done(g) }));
    const group = grp ? (() => {
      const gg = grp.keys.map((k) => inCat.find((g) => g.key === k)).filter(Boolean)
        .map((g) => ({ key: g.key, done: done(g) }));
      return { name: grp.name, games: gg, n: gg.filter((x) => x.done).length };
    })() : null;
    const complete = !!(group && group.games.length && group.n === group.games.length);
    const nextGroup = complete ? (groupsIn(me.cat)
      .filter((x) => x.name !== group.name)
      .map((x) => ({ name: x.name, open: x.keys.filter((k) => inCat.some((g) => g.key === k) && !played.has(k) && k !== me.key), total: x.keys.filter((k) => inCat.some((g) => g.key === k)).length }))
      .find((x) => x.open.length) || null) : null;
    return { cat: me.cat, me: me.key, games, n: games.filter((g) => g.done).length, group, complete, nextGroup };
  }, [me, played, forceDone]);

  // THE SET TO PUSH: this game's own set while it is open, the next set once
  // it is done, nothing in an ungrouped category.
  const pushSet = useMemo(() => {
    if (!catRun || !catRun.group) return null;
    if (!catRun.complete) {
      const open = catRun.group.games.filter((x) => !x.done).map((x) => x.key);
      return { name: catRun.group.name, keys: catRun.group.games.map((x) => x.key), open, total: catRun.group.games.length, handoff: false };
    }
    if (!catRun.nextGroup) return null;
    const grp = groupsIn(catRun.cat).find((x) => x.name === catRun.nextGroup.name);
    return { name: catRun.nextGroup.name, keys: grp ? grp.keys : [], open: catRun.nextGroup.open, total: catRun.nextGroup.total, handoff: true };
  }, [catRun]);

  // MORE OF WHAT THEY JUST PLAYED. The set to push first, its open games
  // ahead of its finished ones, then the rest of the category, unplayed first,
  // so the row leads with somewhere to actually go.
  const sameCat = useMemo(() => {
    if (!me) return [];
    const hi = new Set(pushSet ? pushSet.keys : []);
    const order = (a, b) => (played.has(a.key) - played.has(b.key)) || a.name.localeCompare(b.name);
    const inCat = LIVE().filter((g) => g.cat === me.cat && g.key !== me.key);
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
  useEffect(() => {
    const el = catsRef.current;
    if (!el) return undefined;
    const read = () => setOver(el.scrollWidth > el.clientWidth + 4);
    read();
    const ro = new ResizeObserver(read);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
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
      <div className={'stf stf-rtwrap' + (outcome ? ' stf-' + outcome : '')}>
        <style>{CSS}</style>

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

  return (
    <div className={'stf' + (outcome ? ' stf-' + outcome : '')}>
      <style>{CSS}</style>

      {flood ? (
        <CurtainFlood title={title} detail={detail} iq={iq} board={board}
          gameRank={gameRank} streak={streak} ready={ready} bandRef={bandRef}
          boardWhen={boardWhen} catRun={catRun}
          onDone={() => setFlood(false)} />
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
        <div className="stf-cin">
          <div className="stf-ctop">
            <div className="stf-cl">
              <div className="stf-verdict">{title}</div>
              {(detail || loose.length) ? (
                <div className="stf-detail">
                  {detail}
                  {loose.length ? (
                    <span className="stf-dx">{detail ? ' \u00b7 ' : ''}{loose.join(' \u00b7 ')}</span>
                  ) : null}
                </div>
              ) : null}
              <BandCat run={catRun} />
            </div>
            {iq && iq.gained != null ? (
              <div className="stf-ciq">
                <b>+{Number(iq.gained).toLocaleString()}</b>
                <i>IQ earned</i>
              </div>
            ) : null}
          </div>
        </div>
      </div>

      <div className="stf-wrap">
        {/* THE BOARD LEADS NOW. It used to sit under a row of four figures whose
            first line said #22 of 137; the table is what that number means, and
            the figure that announced it has moved onto the band. */}
        {rows.length ? (
          <section>
            <div className="stf-eb">{boardLabel || <>Today&rsquo;s board</>}{myRank != null ? <em> &middot; you are #{myRank}{field ? ` of ${field}` : ''}</em> : null}{standings.length ? <em className="stf-dx"> &middot; {standings.join(' \u00b7 ')}</em> : null}</div>
            <table className="stf-tbl">
              <tbody>
                {rows.map((r, i) => (
                  <tr key={r.username || i} className={isMine(r) ? 'me' : undefined}>
                    <td className="stf-pos">{r.rank != null ? `#${r.rank}` : `#${i + 1}`}</td>
                    <td className="stf-who">{r.username || 'Guest'}</td>
                    {/* WHAT THEY DID, NOT WHAT IT WAS WORTH (owner, 2026-08-31).
                        This printed `score` beside `points`, and on a board where
                        everyone solved it that is a column of identical tens: the
                        reader is told nothing, and the ordering of the rows looks
                        arbitrary because the thing that actually separates them
                        (the tries, the clock) was not on screen. gameStats prints
                        the run — 10/10 · 1 try · 0:13 — which is the same fix the
                        leader strip got, from the same helper. */}
                    <td className="stf-st">{gameStats(r, missLabel) || '\u2014'}</td>
                  </tr>
                ))}
                {/* Outside the five, they get their line back under a gap, so
                    the eyebrow's "you are #7 of 13" has something to point at. */}
                {!rows.some(isMine) && board && board.myRow ? (
                  <>
                    {myRank != null && myRank > rows.length + 1 ? (
                      <tr className="gap"><td colSpan={3}>&middot;&middot;&middot;</td></tr>
                    ) : null}
                    <tr className="me">
                      <td className="stf-pos">{myRank != null ? `#${myRank}` : ''}</td>
                      <td className="stf-who">{board.myRow.username || 'You'}</td>
                      <td className="stf-st">{gameStats(board.myRow, missLabel) || '\u2014'}</td>
                    </tr>
                  </>
                ) : null}
              </tbody>
            </table>
          </section>
        ) : null}

        {/* CLAIM YOUR RANK: full width, above the hand-forward, guests only.
            The figure is the guest's would-be placement on the registered
            board; without one (the row has not landed yet) the tile still
            makes the offer, just without a number. */}
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

        {/* THE HAND-FORWARD, for LoftFinish's own reason: it used to sit
            below the verdict, the IQ bar, four tiles and the whole board, so a
            finisher passed two exits before reaching the one that carries on. */}
        {setNext ? (
          <a className="stf-fwd stf-fwdset" href={setNext.g.href || `/${setNext.g.key}`}>
            <div>
              <div className="stf-eb">{setNext.set.handoff ? <>Up next &middot; {catRun.group.name} done, next set</> : <>Up next &middot; finish the set</>}</div>
              <div className="stf-fwdn">{setNext.g.name}</div>
              <div className="stf-fwdt">{setNext.set.name} &middot; {setNext.set.handoff ? `${setNext.set.open.length} of ${setNext.set.total} open` : `${setNext.set.open.length} left`}</div>
            </div>
            <span className="stf-go">Play</span>
          </a>
        ) : forward ? (
          <a className="stf-fwd" href={forward.href} onClick={forward.onClick}>
            <div>
              <div className="stf-eb">Up next</div>
              <div className="stf-fwdn">{fwdName}</div>
              {fwdTag ? <div className="stf-fwdt">{fwdTag}</div> : null}
            </div>
            <span className="stf-go">Play</span>
          </a>
        ) : null}

        {/* MORE OF THE SAME, directly under the one recommendation. Up next is
            a single pick; a reader who does not want it should not have to go
            back to the home to find its neighbours. */}
        {sameCat.length ? (
          <section>
            <div className="stf-eb stf-ebset">
              <span>{me ? `More ${me.cat} puzzles` : 'More puzzles'}</span>
              {pushSet ? (
                <em className={'stf-setchip' + (pushSet.open.length ? '' : ' ok')}>
                  {pushSet.name} &middot; {pushSet.open.length ? `${pushSet.open.length} left` : 'done'}
                </em>
              ) : null}
            </div>
            <div className="stf-tiles">
              {sameCat.map(({ g, set }) => <Tile key={g.key} g={g} played={played.has(g.key)} light={light} set={set} />)}
            </div>
          </section>
        ) : null}

        {/* EVERY CATEGORY, under the one they just played (owner, 2026-08-31).
            It sat above the verdict, which put a browse control ahead of the
            result. Here it reads as the next widening step: this game, then its
            category, then all of them. Same eyebrow as the section above it, so
            the two are plainly the same kind of thing. Pressing a category
            lists it A to Z; pressing it again puts it away. */}
        <section>
          <div className="stf-eb">All categories</div>
          <div className="stf-catrow">
            {/* ONE LINE, ALWAYS. Nine chips wrapped to a second row and left
                Arcade stranded (owner, 2026-08-31), so the row scrolls: a flick
                on a phone, arrows on a desktop where there is no obvious way to
                swipe. The arrows appear only when something is out of view. */}
            <button type="button" className="stf-catnav" aria-label="Scroll categories left"
              onClick={() => nudge(-1)} hidden={!over}>&#8249;</button>
            <div className="stf-cats" ref={catsRef}>
              {RAMP_ORDER.map((c) => (
                <button key={c} type="button"
                  className={'stf-cat' + (cat === c ? ' on' : '')}
                  style={{
                    '--tc': light ? categoryColorLight(c) : categoryColor(c),
                    // The ink that carries ON that step when the chip is the
                    // selected one and fills. One per step on the light
                    // register, because the three warm ones stay pastel and
                    // take the near-black instead of white; one for all ten on
                    // the dark register, where every step is a pastel.
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

        <div className="stf-opts">
          {flow.map((f, i) => {
            const w = wideOpt.has(i) ? ' wide' : '';
            if (f.t === 'arch') return archiveBtn(w);
            // THE OLD BROWSE BUTTON, back in the slot the grid left empty. It
            // opens the same A-to-Z panel the category row above does, rather
            // than navigating away.
            if (f.t === 'browse') {
              return (
                <button key="browse" type="button" className={'stf-o' + (cat === 'all' ? ' on' : '') + w}
                  onClick={() => setCat((v) => (v === 'all' ? null : 'all'))}>
                  <b>All daily puzzles</b><i>{cat === 'all' ? 'Hide the list' : `Every one of the ${LIVE().length}`}</i>
                </button>
              );
            }
            const o = f.o;
            const node = o.href
              ? <a key={i} className={'stf-o' + w} href={o.href} onClick={o.onClick}>
                  <b>{o.label}</b>{o.sub ? <i>{o.sub}</i> : null}
                </a>
              : <button key={i} type="button" className={'stf-o' + w} onClick={o.onClick}>
                  <b>{o.label}</b>{o.sub ? <i>{o.sub}</i> : null}
                </button>;
            // THE ARCHIVE SITS BESIDE 'Play another' (owner, 2026-08-31),
            // because they are the same question at two sizes: one more day of
            // this game, or every day of it. All 80 clients already pass
            // `archive` to LoftFinish; the stage ending simply never took it.
            return f.t === 'pair'
              ? <div key={`pair${i}`} className="stf-pair">{node}{archiveBtn()}</div>
              : node;
          })}
          {/* Last, and a whole row of its own at every width. */}
          {goldOpt ? (goldOpt.href
            ? <a className="stf-o gold" href={goldOpt.href} onClick={goldOpt.onClick}>
                <b>{goldOpt.label}</b>{goldOpt.sub ? <i>{goldOpt.sub}</i> : null}
              </a>
            : <button type="button" className="stf-o gold" onClick={goldOpt.onClick}>
                <b>{goldOpt.label}</b>{goldOpt.sub ? <i>{goldOpt.sub}</i> : null}
              </button>) : null}
        </div>

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
.stf-cat{font-family:${MONO};font-size:9.5px;letter-spacing:.12em;text-transform:uppercase;
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
.stf-ebset{display:flex;align-items:center;justify-content:space-between;gap:8px;}
.stf-ebset .stf-setchip{font-style:normal;font-family:${MONO};font-size:9px;letter-spacing:.12em;text-transform:uppercase;
  color:var(--stg-onramp,#08222e);background:var(--stg-acc);padding:2px 6px;border-radius:4px;}
.stf-ebset .stf-setchip.ok{background:none;color:var(--stg-mute);border:1px solid var(--stg-line);}
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
  font-family:${MONO};font-size:9.5px;letter-spacing:.14em;text-transform:uppercase;
  font-weight:700;opacity:.86;}
.stf-bcat-x{opacity:.7;}
.stf-rack{display:block;}
.stf-rk-pips{display:flex;justify-content:center;flex-wrap:wrap;gap:5px;max-width:340px;margin:0 auto 14px;}
.stf-rack s{text-decoration:none;display:block;width:12px;height:18px;border-radius:3px;
  border:1.5px solid currentColor;opacity:.32;
  transition:width 380ms cubic-bezier(.2,.8,.25,1),height 380ms cubic-bezier(.2,.8,.25,1),
    margin 380ms cubic-bezier(.2,.8,.25,1),border-radius 380ms ease,opacity 300ms ease;}
.stf-rack s.on{background:currentColor;opacity:1;animation:stf-rip 420ms ease both;}
.stf-rack s.new{background:currentColor;opacity:0;transform:scale(.4);
  animation:stf-rackhit 320ms cubic-bezier(.2,.9,.3,1.35) ${RACK_HIT}ms both;}
/* NARROW: the set's own pips at full size, the rest of the category collapsed
   to nothing. WIDE: the set shrinks to category size and the rest expands in. */
.stf-rack.grouped s.g{width:18px;height:28px;border-radius:4px;}
.stf-rack.grouped:not(.wide) s.x{width:0;opacity:0!important;margin-left:-5px;border-width:0;animation:none;}
.stf-rack.grouped.wide s.g{width:12px;height:18px;border-radius:3px;}
/* THE COMPLETION: the whole rack swells once, then the widen starts. */
.stf-rack.complete .stf-rk-pips{animation:stf-swell 520ms cubic-bezier(.2,.9,.3,1.4) both;}
.stf-rack b small{font-size:.42em;letter-spacing:-.01em;opacity:.7;margin-left:4px;}
.stf-rack b,.stf-rack i{animation:stf-stamp 300ms cubic-bezier(.2,.9,.3,1.3) both;}
.stf-rk-done{display:inline-block;margin-top:12px;font-style:normal;font-family:${MONO};font-size:9px;
  letter-spacing:.16em;text-transform:uppercase;font-weight:700;padding:4px 9px;
  border:1.5px solid currentColor;border-radius:4px;animation:stf-stamp 300ms cubic-bezier(.2,.9,.3,1.3) both;}
/* At rest on the band: the set while it is open, the category once it is done. */
.stf-rack.band .stf-rk-pips{margin:0;gap:2px;max-width:none;justify-content:flex-start;}
.stf-rack.band s{width:5px;height:9px;border-radius:1.5px;border:none;background:currentColor;
  opacity:.28;animation:none;transform:none;transition:none;}
.stf-rack.band.grouped:not(.wide) s.g{width:8px;height:12px;border-radius:2px;}
.stf-rack.band.grouped:not(.wide) s.x{display:none;}
.stf-rack.band s.on,.stf-rack.band s.new{opacity:1;}
@keyframes stf-rip{ 0%{transform:none} 35%{transform:translateY(-5px)} 100%{transform:none} }
@keyframes stf-rackhit{ from{opacity:0;transform:scale(.4)} to{opacity:1;transform:none} }
@keyframes stf-swell{ 0%{transform:scale(1)} 45%{transform:scale(1.14)} 100%{transform:scale(1)} }
/* Bigger than the 22px the stats row used, smaller than the verdict: it is the
   second thing on the band, not the first. It takes the band's own ink rather
   than the green the figures row gave it, because green on the accent is the
   one colour pairing the stage does not have. */
.stf-ciq{flex:none;text-align:right;}
.stf-ciq b{display:block;font-size:34px;font-weight:800;line-height:1;
  letter-spacing:-0.02em;font-variant-numeric:tabular-nums;}
.stf-ciq i{display:block;font-style:normal;font-size:13px;font-weight:700;
  opacity:.78;margin-top:8px;}

.stf-wrap{max-width:720px;margin:0 auto;padding:22px 4px 8px;
  display:flex;flex-direction:column;gap:20px;}
.stf-eb{font-family:${MONO};font-size:9.5px;letter-spacing:.15em;text-transform:uppercase;
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
.stf-pos{width:44px;font-family:${MONO};font-size:12px;color:var(--stg-mute);}
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
.stf-archr .d i{font-style:normal;font-family:${MONO};font-size:8.5px;letter-spacing:.1em;
  text-transform:uppercase;color:var(--stg-acc-ink);margin-left:7px;}
.stf-archr .n{font-family:${MONO};font-size:11px;color:var(--stg-mute);}
.stf-archr .v{margin-left:auto;flex:none;display:flex;align-items:center;gap:7px;
  font-size:12.5px;font-weight:800;color:var(--stg-acc-ink);}
.stf-archr .v em{font-style:normal;font-family:${MONO};font-size:8.5px;letter-spacing:.1em;
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
.stf-flood{position:fixed;inset:0;z-index:9000;cursor:pointer;
  background:var(--stg-acc);color:var(--stg-onramp,#08222e);
  display:flex;align-items:flex-start;justify-content:center;overflow:hidden;
  padding:clamp(80px,18vh,200px) 24px 28px;
  opacity:0;-webkit-clip-path:inset(0 0 0 0);clip-path:inset(0 0 0 0);
  transition:opacity 180ms ease,clip-path 640ms cubic-bezier(.2,.8,.25,1),
    -webkit-clip-path 640ms cubic-bezier(.2,.8,.25,1);}
.stf-flood.up,.stf-flood.shrink{opacity:1;}
/* The clip has landed by now, so the colour is exactly the band: fading it out
   is colour onto colour, and what appears through it is the band's own words. */
.stf-flood.out{opacity:0;transition:opacity 200ms ease;}

.stf-fl-in{max-width:900px;text-align:center;opacity:0;
  transform:translateY(12px) scale(.985);
  transition:opacity 320ms ease,transform 420ms cubic-bezier(.2,.8,.25,1);}
.stf-flood.up .stf-fl-in,.stf-flood.shrink .stf-fl-in{opacity:1;transform:none;}
/* Out before the shape moves, so the words are never caught in the collapse. */
.stf-flood.shrink .stf-fl-in{opacity:0;transform:translateY(-16px);
  transition:opacity 240ms ease,transform 420ms ease;}

.stf-fl-v{font-size:clamp(38px,8.4vw,104px);font-weight:800;letter-spacing:-.045em;
  line-height:.98;text-wrap:balance;}
.stf-fl-d{margin-top:14px;font-size:clamp(13px,2vw,19px);font-weight:700;opacity:.78;}
.stf-fl-figs{margin-top:26px;display:flex;flex-wrap:wrap;justify-content:center;
  align-items:flex-end;gap:16px 42px;}
/* THE STAMP. An overshoot on the way down, so a figure lands rather than
   fades: it is the one motion on this screen that says a number just arrived.
   The fill holds the end state, since each figure mounts once and never leaves. */
.stf-fl-fig{flex:none;animation:stf-stamp 300ms cubic-bezier(.2,.9,.3,1.3) both;}
.stf-fl-fig b{display:block;font-size:clamp(24px,4.2vw,44px);font-weight:800;
  line-height:.92;letter-spacing:-.03em;font-variant-numeric:tabular-nums;}
.stf-fl-fig i{display:block;font-style:normal;font-family:${MONO};
  font-size:clamp(9px,1.15vw,11px);letter-spacing:.16em;text-transform:uppercase;
  opacity:.72;margin-top:9px;}
/* The IQ is the number they came for, so it takes a line of its own at display
   size and the standings land in a row underneath it. */
.stf-fl-fig.lead{flex-basis:100%;}
/* The rack takes a line of its own under the standings, pips over the count. */
.stf-fl-rack{flex-basis:100%;margin-top:6px;}
.stf-fl-fig.lead b{font-size:clamp(46px,10vw,118px);line-height:.9;letter-spacing:-.05em;}
.stf-fl-fig.lead i{font-size:clamp(10px,1.4vw,13px);letter-spacing:.18em;
  opacity:.78;margin-top:12px;}
.stf-fl-skip{position:absolute;left:0;right:0;bottom:26px;text-align:center;
  font-family:${MONO};font-size:10px;letter-spacing:.18em;text-transform:uppercase;
  font-weight:700;opacity:0;animation:stf-hint 400ms ease 0s both;}
@keyframes stf-hint{ from{opacity:0} to{opacity:.42} }
@keyframes stf-stamp{
  from{opacity:0;transform:translateY(10px) scale(1.26);}
  to{opacity:1;transform:none;}
}

@media (max-width:640px){
  .stf-flood{padding:clamp(64px,14vh,140px) 18px 22px;}
  .stf-fl-d{margin-top:11px;}
  .stf-fl-figs{margin-top:20px;gap:12px 26px;}
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
`;
