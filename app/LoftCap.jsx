'use client';

// LoftCap — the blue cap that replaces a daily page's title block.
//
// It carries the game's identity (eyebrow, 800-weight name) and its LIVE
// FIGURES, which previously sat in a monospace strip inside the board card.
// Moving them up here is the point: the game's state and the player's state
// then use one vocabulary, and the board gets that space back.
//
// Renders full-bleed, so mount it OUTSIDE the page's max-width wrapper,
// immediately after <DailyChrome />.
//
// Layout is a wrapping flex row so the desktop arrangement is pure `order`:
// on a phone it is name / figures / (extra), and at 900px it becomes one
// header bar with the name left, the figures and the help control at the
// right edge. `.help` is a direct child rather than nested in the id block,
// which is what lets `order` reach it.
import React, { useEffect, useRef, useState } from 'react';
import { usePathname } from 'next/navigation';
import { DAILY_GAMES, isRetiredDaily } from '@/lib/daily-games';
import { SHARE_HOST } from '@/lib/site';
import useDailyRoster from './useDailyRoster';
import { catBlue } from '@/lib/home-blues';
import { circuitById } from '@/lib/circuits';
import { loftKey } from '@/lib/loft';

// The home page pulls the sudoku grids OUT of Numbers into a Sudoku shelf of
// their own, and that shelf is the sudoku circuit's pool. Mirror it from the
// same source rather than restating the list, or Suds wears orange here and
// violet there.
const SUDOKU = new Set(((circuitById('sudoku') || {}).keys) || []);

// Alphabetical, retired games dropped, computed once at module load: it is the
// same list on every page and never changes within a session.
const ALL_AZ = DAILY_GAMES
  .filter((g) => !isRetiredDaily(g.key))
  .map((g) => ({ key: g.key, name: g.name, tag: g.tag, href: g.href || `/${g.key}` }))
  .sort((a, b) => a.name.localeCompare(b.name));

const SANS = "'Manrope', system-ui, -apple-system, sans-serif";

export default function LoftCap({
  name,
  outcome = null,     // null while playing, then 'won' | 'part' | 'lost'
  cat = '',
  num = null,
  dateLabel = '',
  figures = [],
  tiles = null,      // once finished, what to play next, in place of the figures
  onHelp = null,
  sunday = null,
  progress = null,   // 0-100, draws the hairline at the foot of the cap
  extra = null,      // an optional third tier (Anon's spine, for instance)
  neutral = false,   // wear the plain band whatever `cat` says (see the hue below)
}) {
  // THE PAGE'S OWN ADDRESS, printed beside the game name (owner, 2026-08-15).
  // DailyMasthead carried "mindloftdaily.com/<slug>" so the address rode along
  // in every screenshot and share; the Loft cap dropped it, and this puts it
  // back.
  //
  // It is read from the ROUTE, not from a passed slug. That is one less prop to
  // thread through 65 clients, and it cannot go stale the way a hand-written one
  // did: the old masthead printed /jester and /park, which are REGISTRY KEYS,
  // not routes (those pages are /jesters and /parker). usePathname is always the
  // address the reader is actually on, so it is right by construction. The host
  // comes from lib/site so a future domain move stays a one-line change.
  const pathname = usePathname();
  const url = pathname && pathname !== '/'
    ? `${SHARE_HOST}${pathname.replace(/\/+$/, '')}`
    : null;

  // THE CATEGORY HUE. Resolved from the route rather than a new prop, for the
  // same reason the URL above is: it cannot go stale, and it costs no edit to
  // any of the 70 game clients.
  const key = loftKey(String(pathname || '').replace(/^\/+/, ''));
  //
  // NEUTRAL: A SURFACE THAT IS NOT ONE GAME WEARS THE PLAIN BAND (owner,
  // 2026-08-28). The hue rule above is written for a daily, where the page IS
  // one game and the category is the true thing to say. A circuit run is five
  // games in a row, so painting it in one of their categories says something
  // false about the other four, and it does not stop at the band: the A-to-Z
  // strip is transparent black over it, --cat-hue washes the stage under it,
  // and the scorecard trim takes the same variable. So the Gauntlet run came
  // out green end to end, off a single hardcoded cat="Trivia".
  // It suppresses the HUE without clearing `cat`, deliberately: the eyebrow
  // still names what the run is, and only the colour falls back to #2b4676.
  const hue = neutral ? null : (SUDOKU.has(key) ? catBlue('sudoku') : (cat ? catBlue(cat) : null));
  // The band takes it inline (so it paints on the first frame, with no flash of
  // the old navy), and the document takes it so the play STAGE can wash itself
  // with the same hue: the stage is a sibling subtree, out of reach of a
  // variable set on the cap. Removed on unmount so a page that carries no cap
  // never inherits the last game's colour.
  useEffect(() => {
    if (!hue || typeof document === 'undefined') return undefined;
    const el = document.documentElement;
    el.style.setProperty('--cat-hue', hue);
    return () => { el.style.removeProperty('--cat-hue'); };
  }, [hue]);

  // Only asks the network once the game is over, which is the only time the
  // strip is shown.
  const { played } = useDailyRoster({ active: !!outcome });
  const strip = outcome ? ALL_AZ.filter((g) => g.name !== name) : null;

  const azRef = useRef(null);
  const wasDone = useRef(false);
  useEffect(() => {
    if (!outcome) { wasDone.current = false; return; }
    if (wasDone.current) return;
    wasDone.current = true;
    try { window.scrollTo({ top: 0, behavior: 'smooth' }); }
    catch (e) { window.scrollTo(0, 0); }
  }, [outcome]);
  const [azPos, setAzPos] = useState('start');
  const azSync = () => {
    const el = azRef.current;
    if (!el) return;
    const max = el.scrollWidth - el.clientWidth;
    setAzPos(max <= 1 ? 'both' : el.scrollLeft <= 1 ? 'start' : el.scrollLeft >= max - 1 ? 'end' : 'mid');
  };
  // A screenful less an overlap, so a reader keeps a landmark across a press.
  const azNudge = (dir) => {
    const el = azRef.current;
    if (!el) return;
    const max = el.scrollWidth - el.clientWidth;
    const from = el.scrollLeft;
    const to = Math.max(0, Math.min(max, from + dir * Math.max(160, el.clientWidth - 80)));
    if (to === from) return;
    const t0 = (typeof performance !== 'undefined' ? performance.now() : Date.now());
    const step = (now) => {
      const p = Math.min(1, ((now || t0) - t0) / 320);
      el.scrollLeft = from + (to - from) * (1 - Math.pow(1 - p, 3));
      azSync();
      if (p < 1) window.requestAnimationFrame(step);
    };
    window.requestAnimationFrame(step);
  };
  useEffect(() => {
    const el = azRef.current;
    if (!el) return undefined;
    const onWheel = (e) => {
      if (e.deltaY === 0) return;
      const max = el.scrollWidth - el.clientWidth;
      if (max <= 0) return;
      const next = el.scrollLeft + e.deltaY;
      if ((e.deltaY < 0 && el.scrollLeft > 0) || (e.deltaY > 0 && el.scrollLeft < max)) {
        e.preventDefault();
        el.scrollLeft = Math.max(0, Math.min(max, next));
      }
    };
    const sync = () => azSync();
    sync();
    el.addEventListener('wheel', onWheel, { passive: false });
    window.addEventListener('resize', sync);
    return () => {
      el.removeEventListener('wheel', onWheel);
      window.removeEventListener('resize', sync);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [outcome, strip && strip.length]);

  useEffect(() => {
    const board = () => document.querySelector('.loft-sheet') || document.querySelector('.loft-card');
    const apply = () => {
      const el = board();
      if (!el) return;
      const w = Math.round(el.getBoundingClientRect().width);
      // guard against measuring a collapsed or hidden card
      if (w > 240) document.documentElement.style.setProperty('--loft-col', `${w}px`);
    };
    apply();
    const el = board();
    const ro = el && typeof ResizeObserver !== 'undefined' ? new ResizeObserver(apply) : null;
    if (ro && el) ro.observe(el);
    window.addEventListener('resize', apply);
    return () => { if (ro) ro.disconnect(); window.removeEventListener('resize', apply); };
  });

  const eyebrow = [cat, num != null ? `No. ${num}` : null, dateLabel]
    .filter(Boolean).join(' · ');
  return (
    <div className={`lcap${outcome ? ` lcap-done lcap-${outcome}` : ''}${strip && strip.length ? ' lcap-az' : ''}`}
      style={hue ? { '--cc': hue } : undefined}>
      <div className="lcap-col">
      <LoftSheet />
      <div className="lcap-id">
        <span className="lcap-eb">{eyebrow}</span>
        <span className="lcap-nm">{strip && strip.length ? null : name}{sunday
          ? (typeof sunday === 'string'
              ? <span className="lcap-sun">{sunday}</span>
              : <span className="lcap-sunnode">{sunday}</span>)
          : null}{url ? <span className="lcap-url">{url}</span> : null}</span>
      </div>
      {onHelp && !outcome ? (
        <button className="lcap-help" onClick={onHelp} aria-label="How to play">?</button>
      ) : null}
      {strip && strip.length ? (
        <div className={`lcap-azwrap${azPos === 'start' || azPos === 'both' ? ' at-start' : ''}${azPos === 'end' || azPos === 'both' ? ' at-end' : ''}`}>
        <button type="button" className="lcap-azbtn prev" aria-label="Scroll back"
          onClick={() => azNudge(-1)}>&#8249;</button>
        <button type="button" className="lcap-azbtn next" aria-label="Scroll on"
          onClick={() => azNudge(1)}>&#8250;</button>
        <div className="lcap-tiles az" ref={azRef} onScroll={azSync}>
          {strip.map((t) => (
            <a key={t.key} href={t.href} className={played[t.key] || undefined}>{t.name}</a>
          ))}
        </div>
        </div>
      ) : null}
      {/* THE RESULT NEVER RIDES IN THE HEADER (owner, 2026-08-28). Once a
          game is over the cap swaps its name for the A-Z strip, which takes
          the whole row, so figures printed alongside it wrap onto a line of
          their own and sit squeezed against the right edge with nothing to
          the left of them. It reads as a glitch, and it is also a second
          copy: every finished game states its result in its own end card,
          which is where a player is looking. Live figures are unaffected,
          and so is the `tiles` swap, which was already exclusive of them. */}
      {!outcome && !(tiles && tiles.length) && figures.length ? (
        <div className="lcap-figs">
          {figures.map((f, i) => (
            <div key={i}>
              <span className="lcap-v">{f.v}</span>
              <span className="lcap-k">{f.k}</span>
            </div>
          ))}
        </div>
      ) : null}
      {extra}
      </div>
      {progress != null ? (
        <div className="lcap-bar"><i style={{ width: `${Math.max(0, Math.min(100, progress))}%` }} /></div>
      ) : null}
    </div>
  );
}


// THE .loft-* STYLESHEET, exported so a page that does NOT render LoftCap can
// still style what depends on it. LoftFinish is the reason: it carries no rules
// of its own for its outer card, its table or its option rows, and on the stage
// (which swaps LoftCap for StageChrome) it was rendering as naked HTML.
//
// MOVED here, never copied. Two caps rendering two copies of an 870-line sheet
// is two sheets that drift.
//
// Every selector below is scoped to a .loft- or .lcap- class, with no bare
// element, :root, body or * rule anywhere in it, which is what makes it safe to
// mount on a page whose own classes are .stage-page and .stg-*.
export function LoftSheet() {
  return (
        <style dangerouslySetInnerHTML={{ __html: `
  .lcap{background:var(--cc,#2b4676);border-top:1px solid rgba(255,255,255,0.16);position:relative;font-family:${SANS};z-index:4}
  /* THE BAND WEARS THE GAME'S CATEGORY (owner, 2026-08-26). --cc is the shelf hue
     from lib/home-blues, set inline below, so tapping Crux under the blue Word
     band on the home page lands on a blue page and the two surfaces name the same
     thing the same way. #2b4676 stays as the fallback for a game with no category.
     THE RULE THAT GOVERNS EVERY INK IN THIS FILE FROM HERE ON: no opacity on
     white. The ten hues clear 4.5:1 against PURE white with no headroom (Word is
     5.17, Numbers 5.18), so white at .78 lands at 4.0 and fails. Hierarchy comes
     from size and weight, exactly as on the home category bands. Where something
     has to RECEDE, darken the ground instead: an inset black wash can only add
     contrast for white ink, so one value is safe on all ten (7.4 to 10.4:1). */
  /* THE CAP IS A FULL-WIDTH BAND WHOSE CONTENT SITS OVER THE BOARD.
     The band runs edge to edge like the chrome above it, but everything in it is
     centred on the game's own column, so the name and the figures line up with
     the board rather than with the site header. --loft-col is measured from the
     column the cap is mounted in (see DailyMasthead); 640 is the fallback and is
     what Crux uses, since its cap is mounted outside that column.
     The gold rule moves onto the column with the content: at 1920 a rule pinned
     to the screen edge sits 640px away from the thing it is marking. */
  .lcap-col{display:flex;flex-wrap:wrap;align-items:center;max-width:var(--loft-col,640px);
    margin:0 auto;border-left:4px solid var(--gold)}
  /* Finished. The cap is already the object tracking your game, so it resolves
     into the verdict rather than a card appearing over the top of everything, and
     the colour carries the outcome: green solved, red not. Anything else would
     make a miss look like a win at a glance, which is the one thing the cap is
     there to say. */
  /* THE CAP NO LONGER CARRIES THE VERDICT (owner, 2026-08-14). It used to turn
     green, amber or red on a finish. The verdict moved to the END CARD's own
     header, which is where the result is: colouring the page furniture as well
     said it twice, and the band is the game's identity rather than its outcome.
     The colour classes are kept as hooks but paint nothing. */
  .lcap-won .lcap-col{border-left-color:var(--success-deep)}
  .lcap-lost .lcap-col{border-left-color:var(--danger)}
  .lcap-part .lcap-col{border-left-color:var(--gold)}
  
  .lcap-won .lcap-eb,.lcap-won .lcap-k{color:#b9f0d0}
  
  .lcap-lost .lcap-eb,.lcap-lost .lcap-k{color:#f6cfc9}
  /* An intermediate result is neither: amber. FLAT GOLD WITH DARK INK, which is
     the pairing the home slate already uses on its paused cards (var(--gold)
     ground, #2a1f04 ink), so a partial result reads the same here as it does
     there (owner, 2026-08-14).
     This was the DEEP gold with white text, on the reasoning that the cap's text
     is white and white on flat gold is unreadable. That reasoning was right about
     the contrast and wrong about the fix: the answer is to re-ink the cap, not to
     darken the ground, because the ground is what carries the meaning. So every
     white-on-blue token inside the cap gets a dark counterpart here, including
     the hairline borders and the help button, which are white-alpha and vanish
     on gold. */
  
  /* .lcap-part re-inking removed 2026-08-14: the band carries a single dark ground,
     so the dark ink only made the game name unreadable. The divider rules above
     still carry the state.
     THE BAND IS #2b4676, NOT var(--blue) AND NOT var(--accent) (2026-08-21). Under Midnight the page
     ground went near-black, which left a saturated blue band as the loudest thing on
     the page, louder than the Start button under it: chrome outshouting the action.
     On accent it matches the header bar above it and the console title band on the
     home page, and the CTA is the only bright blue on a puzzle. Every ink in this
     block roughly doubled in contrast as a result, and not one of the 46 per-game
     accents (the URL colour, passed into DailyMasthead) got worse.
     It is NOT var(--accent) either: that is the header bar directly above, and the two
     bars merged into one field with no seam. This is one step up from accent, plus a
     hairline, so the header and the band read as two rows. */
  .lcap-part .lcap-bar{background:rgba(0,0,0,0.16)}
  .lcap-part .lcap-bar i{background:#2a1f04}
  .lcap-id{flex:1;min-width:0;padding:8px 12px}
  /* Finished: the eyebrow goes and the block shrinks to the game's title, so the
     width it was using goes to the next-up tiles beside it. */
  .lcap-done .lcap-eb{display:none}
  .lcap-done .lcap-id{flex:0 0 auto}
  .lcap-tiles{display:flex;gap:6px;flex:1;min-width:0;padding:6px 12px 8px;overflow-x:auto}
  .lcap-tiles a{display:flex;align-items:center;gap:8px;
    flex:1 1 0;min-width:88px;text-decoration:none;background:rgba(255,255,255,0.95);
    border-radius:9px;padding:6px 9px;color:var(--ink)}
  .lcap-tiles a:hover{background:var(--white)}
  .lcap-tiles b{display:block;font-weight:800;font-size:12.5px;line-height:1;white-space:nowrap;
    overflow:hidden;text-overflow:ellipsis}
  .lcap-tiles i{display:block;font-style:normal;font-weight:600;font-size:9.5px;line-height:1.25;
    margin-top:3px;color:var(--slate);overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
  /* THE ICON SITS ON A WHITE PLATE, square and contained. The art is 76x76 and
     a non-square box renders it narrow, which throws the name out of line: that
     is the bug that shipped on the home rail when one game's art was 88x76. */
  .lcap-tiles img{flex:0 0 auto;width:34px;height:34px;border-radius:7px;
    object-fit:contain;display:block}
  .lcap-tiles a>span{min-width:0}
  @media(min-width:900px){.lcap-tiles{flex:0 0 auto;order:3;margin-left:auto}
    .lcap-tiles a{flex:0 0 168px}
    /* The roster is long, so it takes the width that is going and scrolls inside
       it rather than pushing the band wider. */
    .lcap-azwrap{flex:1 1 100%;max-width:none}
    .lcap-tiles.az a{flex:0 0 auto}}
  /* NAME-ONLY CHIPS, tight, so a lot of the roster is in view at once. */
  .lcap-azwrap{position:relative;min-width:0;display:flex;flex:1 1 100%}
  /* With the label and the rule gone the band is only the roster, so it takes
     the whole width at every size. */
  .lcap-az .lcap-id{display:none}
  .lcap-az .lcap-col{border-left:0;max-width:none;width:100%;min-width:0}
  .lcap-az .lcap-tiles.az{padding-left:14px;padding-right:14px}
  
  .lcap-tiles.az{gap:5px;padding:5px 12px 7px;align-items:center;
    scroll-snap-type:none;scrollbar-width:none;-ms-overflow-style:none}
  .lcap-azbtn{display:none;position:absolute;top:0;bottom:0;z-index:2;width:34px;
    align-items:center;justify-content:center;cursor:pointer;
    border:0;padding:0;font-family:inherit;font-size:21px;font-weight:800;line-height:1;
    color:var(--white)}
  .lcap-azbtn.prev{left:0;background:linear-gradient(90deg,var(--cc,#2b4676) 45%,transparent 100%)}
  .lcap-azbtn.next{right:0;background:linear-gradient(270deg,var(--cc,#2b4676) 45%,transparent 100%)}
  .lcap-azwrap.at-start .lcap-azbtn.prev,.lcap-azwrap.at-end .lcap-azbtn.next{display:none}
  .lcap-tiles.az a{display:block;flex:0 0 auto;min-width:0;white-space:nowrap;
    background:rgba(6,10,20,0.20);color:var(--white);border-radius:7px;
    padding:6px 10px;font-weight:800;font-size:12.5px;line-height:1.1;gap:0}
  .lcap-tiles.az a:hover{background:rgba(6,10,20,0.32)}
  /* TOLD APART BY FILL, NEVER BY A SECOND COLOUR (owner, 2026-08-26). These were
     green finished, amber open, red missed, which was right on one navy ground and
     wrong on ten coloured ones: green on crimson and red on umber fight the band
     they sit on, and the plain white-alpha chip drops white text to 3.76:1 on Word
     and 3.84 on Logic, under the floor. So the states are now depths of the SAME
     ground. Played and missed sink into a black wash, everything unplayed sits one
     step above it, and the single game you have in progress is a solid white pill
     carrying the band's own hue as its ink (5.17:1 at worst, since that is just
     the hue on white). Reads identically on all ten, needs no per-category tuning.
     This is the same ruling that retired gold Resume on the home bands. */
  .lcap-tiles.az a.done{background:rgba(6,10,20,0.34);color:rgba(255,255,255,0.66)}
  .lcap-tiles.az a.done:hover{background:rgba(6,10,20,0.44);color:var(--white)}
  .lcap-tiles.az a.open{background:var(--white);color:var(--cc,#2b4676)}
  .lcap-tiles.az a.open:hover{background:#eef2f8}
  .lcap-tiles.az a.fail{background:rgba(6,10,20,0.34);color:rgba(255,255,255,0.66)}
  .lcap-tiles.az a.fail:hover{background:rgba(6,10,20,0.44);color:var(--white)}
  /* THE ARROWS COULD NEVER SHOW: their display:flex sat in the desktop block
     ABOVE this base rule, and a media query adds no specificity, so the later
     display:none simply won. The override belongs after the thing it overrides. */
  @media(min-width:900px){
    .lcap-azwrap .lcap-azbtn{display:flex}
    .lcap-azwrap > .lcap-tiles.az{flex:1 1 auto;min-width:0;margin-left:0}
  }
  .lcap-tiles.az::-webkit-scrollbar{display:none}
  /* Finished today: still there, still reachable, just not competing with the
     ones you have not played. The DEPTH of its wash carries that now; the old
     opacity:.5 would have dimmed the ink as well, which is the one thing a
     saturated ground has no headroom for. */
  /* PHONE: a snapping slider. Three tiles across a 390px row leaves each about
     118px, which truncates most taglines, so the row scrolls instead and shows
     about two and a half. The scrollbar is hidden because the partial tile at
     the edge is the affordance. */
  @media(max-width:899px) and (orientation:portrait){
    .lcap-done .lcap-nm{font-size:17px;line-height:1.08;white-space:normal;max-width:5.2em}
    .lcap-tiles{scroll-snap-type:x mandatory}
    .lcap-tiles i{display:block}
    .lcap-tiles.az a{flex:0 0 auto!important;scroll-snap-align:none}
    .lcap-tiles a{flex:0 0 78%!important;scroll-snap-align:start;min-width:0;
      gap:8px;padding-left:9px;padding-right:9px}
    .lcap-tiles b{font-size:12.5px}
  }
  @media(max-width:899px){
    .lcap-tiles{scroll-snap-type:x mandatory;-webkit-overflow-scrolling:touch;scrollbar-width:none}
    .lcap-tiles::-webkit-scrollbar{display:none}
    .lcap-tiles a{flex:0 0 44%;scroll-snap-align:start}}
  .lcap-eb{display:block;font-weight:800;font-size:9.5px;line-height:1;letter-spacing:.13em;
    text-transform:uppercase;color:var(--white);margin-bottom:4px}
  .lcap-nm{display:block;font-weight:800;font-size:22px;line-height:1;letter-spacing:-.022em;color:var(--white)}
  .lcap-sun{display:inline-block;margin-left:8px;font-weight:800;font-size:9px;line-height:1;
    letter-spacing:.11em;text-transform:uppercase;color:var(--gold-ink);background:var(--gold);
    border-radius:4px;padding:3px 6px;vertical-align:middle}
  .lcap-sunnode{display:inline-flex;align-items:center;margin-left:8px;vertical-align:middle}
  /* THE URL RIDES THE NAME LINE, never the eyebrow. The eyebrow (category, No.,
     date) is already the widest thing in this block, so the name line has the
     room going spare and the cap gets no wider on any game; on the eyebrow it
     would push the desktop band out past the board column, which the
     min-width:fit-content rule below would then honour on all 65 games.
     On a finish the eyebrow goes and the A-Z roster takes the width, so the URL
     steps aside rather than squeezing it. */
  .lcap-url{display:inline-block;margin-left:10px;font-weight:600;font-size:11.5px;
    line-height:1;letter-spacing:0;color:var(--white);vertical-align:middle;
    white-space:nowrap}
  .lcap-done .lcap-url{display:none}
  /* The shared masthead sits inside the page column, so the cap has to break out
     of it to run edge to edge the way the bands above it do. */
  .lcap-bleed{margin-left:calc(50% - 50vw);margin-right:calc(50% - 50vw);margin-bottom:14px}
  .lcap-help{width:30px;height:30px;border-radius:8px;background:rgba(6,10,20,0.24);
    display:grid;place-items:center;font-weight:800;font-size:15px;color:var(--white);
    border:0;cursor:pointer;margin-right:12px;flex:none;font-family:inherit}
  .lcap-figs{display:flex;border-top:1px solid rgba(255,255,255,0.30);flex:0 0 100%}
  .lcap-figs>div{flex:1;padding:6px 6px 8px;text-align:center;white-space:nowrap;
    border-right:1px solid rgba(255,255,255,0.30)}
  .lcap-figs>div:last-child{border-right:0}
  .lcap-v{display:block;font-weight:800;font-size:15px;line-height:1;color:var(--white)}
  .lcap-k{display:block;font-weight:800;font-size:8.5px;line-height:1;letter-spacing:.1em;
    text-transform:uppercase;color:var(--white);margin-top:4px}
  .lcap-bar{position:absolute;left:0;right:0;bottom:0;height:3px;background:rgba(6,10,20,0.24)}
  .lcap-bar i{display:block;height:100%;background:var(--white);transition:width .2s}
  /* PROGRESS IS WHITE, NOT GOLD, on a category ground. Gold runs 2.71:1 on Word
     and 2.72 on Numbers against these hues, so the one thing on the band that has
     to be read at a glance would be the least visible thing on it. Gold keeps the
     Sunday chip, the leader chips and the Resume pill, where it still works. */
  @media(min-width:900px){
    /* THE HELP BUTTON NEVER WRAPS. The column is the board's width, but the cap
       must fit a name, up to four figures and the control on one line, and on a
       narrow board that needs more room than the board has. min-width:fit-content
       lets the HEADER, and only the header, take exactly the extra it needs: at or
       under the board's width nothing changes, above it the column grows to the
       one-line width and no further, capped at the band. */
    .lcap-col{width:var(--loft-col,640px);min-width:fit-content;max-width:100%}
    .lcap-id{flex:0 1 auto}
    .lcap-figs{flex:0 0 auto;order:3;border-top:0;margin-left:auto;
      border-left:1px solid rgba(255,255,255,0.30)}
    .lcap-figs>div{flex:0 0 124px}
    .lcap-help{order:4}
  }
  
  /* The play stage: the Loft ground, full bleed, with the board card as the one light
     object on it. Sits inside the centered page column, so the negative margin
     pulls it out to the viewport and the padding puts its content back. */
  .loft-stage{background:linear-gradient(180deg,
      color-mix(in srgb,var(--cat-hue,var(--ground)) 15%,var(--ground)) 0,
      color-mix(in srgb,var(--cat-hue,var(--ground)) 6%,var(--ground)) 120px,
      var(--ground) 260px);
    margin-left:calc(50% - 50vw);margin-right:calc(50% - 50vw);
    padding:14px calc(50vw - 50%) 22px;
    /* Fill the first screen. Without this the navy stops at the card and the
       page shows a band of light under it, which reads as an unfinished edge
       rather than as the start of the next region. The offset is the brand bar
       plus the cap; overshooting only pushes the tail below the fold, which is
       where it belongs, so it is deliberately generous. */
    min-height:calc(100vh - 100px);min-height:calc(100dvh - 100px);
    display:flex;flex-direction:column;justify-content:flex-start}
  .loft-card{background:var(--white)!important;border:0!important;border-radius:14px!important;
    box-shadow:0 10px 30px rgba(0,0,0,0.34)!important}
  /* The page column carries its own top and bottom padding, which on the navy
     ground showed as a white band above the stage. Zero it; the stage and the
     sheet below supply their own spacing.
  
     MATCHED BY SHAPE, NOT BY NAME. This was ".loft-page .cx-wrap", which is
     Crux's own wrapper class, so every game converted after it would have had to
     add its own selector here: there are 57 distinct wrapper classes across the
     dailies (cx-wrap, mc-wrap, tl-wrap, sd-wrap ...) and two of them are shared
     by a pair of games. Keying off the "-wrap" SUFFIX covers all of them at once
     and means a newly converted client needs no edit in this file at all.
  
     THE CHILD COMBINATOR IS LOAD-BEARING; measured on the live page, not
     assumed. A descendant selector matches .ri-wrap too, the Report-an-issue
     block sitting deep in the tail, and zeroing its padding is not wanted.
     Restricting to direct children leaves exactly the page column.
  
     The :not(.dch-wrap) is belt and braces rather than strictly required: on a
     loft page DailyChrome's wrapper renders as "dch-wrap dch-loft", and an
     attribute selector tests the WHOLE class string, which then ends in
     "dch-loft" and does not match. It is kept because that is a coincidence of
     the second class, not a guarantee.
  
     TWO WAYS A GAME FALLS OUTSIDE THIS, both silent. Because [class$=] tests the
     whole attribute, a wrapper carrying a SECOND class stops matching: keep the
     page column's className a single class, or add that game explicitly. And a
     game with no wrapper class at all (babel, blocks, chomp, glyph and sweep have
     none) needs one added when it is converted.
  
     NO BACKTICKS IN THIS COMMENT. It lives inside a template literal, so a
     backtick here closes the style block and breaks the build.
  
     THIS RULE ALSO KILLS ANY CLEARANCE A GAME RESERVES FOR A PINNED RAIL, and it
     does so silently. Anon, Cipher and Garble each pin their own keyboard or dock
     to the bottom of the viewport and each reserved its height as padding-bottom on
     the page column; the !important here won, the computed padding came out 0, and
     the rail sat on top of the foot of the board. On Anon that meant the end of the
     passage and the LAST ROW OF THE BANK could not be reached at all (owner,
     2026-08-15). Do not special-case those games here: the zeroing is deliberate,
     the stage supplies the spacing, and a game that pins a rail reserves its height
     with a SPACER ELEMENT instead. app/useRailClearance.js is that mechanism, and it
     measures the rail rather than trusting a hand-totalled constant. */
  .loft-page > [class$="-wrap"]:not(.dch-wrap){padding-top:0!important;padding-bottom:0!important}
  .loft-page{background:var(--ground)!important}
  /* NO GRAIN ON A LOFT PAGE. The grain is a fixed, 12%-opacity multiply layer at
     z-index 1, so it DARKENS whatever sits under it, and the About section and
     the footer carry z-index 2 and sit over it. The result was a page in two
     different navies with a hard seam above the footer, which is exactly the
     difference the owner reported. It is a paper texture for the cream magazine
     theme and has no job on a flat navy ground. */
  .loft-page > svg{display:none}
  .loft-page .loft-stage{min-height:0;padding-bottom:16px}
  .loft-page .loft-stage ~ div{margin-top:14px!important}
  /* THE ABOUT SECTION NEEDS AIR ABOVE IT. This was padding-top:0, which put the
     section flush against whatever the page column ended with: measured on the
     live page, the foot of the join form's "Trouble signing back in?" link and
     the top of the "About <Game>" heading were the SAME y coordinate, and so were
     the Report an issue chip and that heading for a signed-in player. Two
     unrelated regions touching reads as one broken block rather than as a
     boundary (owner, 2026-08-17). 30px is the smallest step that reads as a
     separation here without opening a void on the navy, which is what the
     original 0 was avoiding. The bottom padding is unchanged. */
  .loft-page section{padding-top:30px!important;padding-bottom:20px!important}
  .loft-page footer{margin-top:0!important;padding-top:18px!important}
  .loft-page .loft-stage ~ p{color:#bfd0ee!important}
  .loft-page .loft-stage ~ p a{color:#ffd45e!important}
  .loft-page .loft-stage ~ p b{color:var(--white)!important}
  .loft-page section h2{color:var(--white)!important}
  .loft-page section p{color:#bfd0ee!important}
  .loft-page section a{color:#ffd45e!important}
  .loft-page section em,.loft-page section i{color:#93a9d6!important}
  .loft-page .loft-stage ~ div:not([style*="fixed"]) > p{color:#bfd0ee!important}
  .loft-page .loft-stage ~ div:not([style*="fixed"]):not(:has(.loft-report)):not(:has(.loft-showchrome)),
  .loft-page .loft-stage ~ div:not([style*="fixed"]):not(:has(.loft-report)):not(:has(.loft-showchrome)) *:not([style*="background"]):not([style*="background"] *){
    color:#bfd0ee!important}
  .loft-page .loft-stage ~ div:not([style*="fixed"]):not(:has(.loft-report)):not(:has(.loft-showchrome)) b:not([style*="background"] b),
  .loft-page .loft-stage ~ div:not([style*="fixed"]):not(:has(.loft-report)):not(:has(.loft-showchrome)) strong{
    color:var(--white)!important}
  .loft-page > [class$="-wrap"] > div > p{color:#bfd0ee!important}
  .loft-page .loft-tailnote{color:#bfd0ee!important}
  .loft-page .loft-tailnote b{color:var(--white)!important}
  .loft-page .loft-tailnote a{color:var(--gold)!important}
  /* THE POST-GAME PANEL SITS UNDER THE BOARD, never under the finish card
     (owner, 2026-08-15). It used to render in the light tail BELOW the stage, so
     a player who had just been handed the finish card scrolled past their own end
     card straight into the answer: Ping printed the city and its description
     right there, in full, with the options still on screen. The panel is inside
     the flip FRONT face now, at the foot of the board, so it is hidden along with
     the board while the options are up and appears only once the player presses
     Return to board. The panel itself did not change, only where it hangs.
  
     IT IS STILL ON NAVY, so it still needs the ink the tail was giving it, and
     the tail's own rules are worth understanding before copying them. The broad
     catch-all up there, .loft-stage ~ div *:not([style*="background"] *), matches
     NOTHING: the page root carries an inline background, so every element on the
     page is a descendant of one and the second :not always fires. What actually
     re-inked the tail was the plain p rules plus inheritance from the wrapper.
     So that is what is mirrored here, measured on the live page rather than
     assumed, and the first attempt at this shipped the countdown line in dark
     slate on navy because it trusted the catch-all.
  
     The div rule is the one addition: a panel line carrying its own dark ink and
     no background of its own was unreadable in the tail too, on games like Barter
     and Check. Cards keep their ink, both the card itself and anything inside it,
     which is what the second :not does, scoped to this panel so it can actually
     match. And :empty removes the panel while a game is still being played, when
     the div renders with nothing in it and would push 14px of air under the
     board. */
  .loft-sol{margin-top:14px}
  .loft-sol:empty{display:none;margin-top:0}
  .loft-page .loft-sol{color:#bfd0ee}
  .loft-page .loft-sol p,
  .loft-page .loft-sol div:not([style*="background"]):not(.loft-sol [style*="background"] div){color:#bfd0ee!important}
  .loft-page .loft-sol p b,.loft-page .loft-sol p strong{color:var(--white)!important}
  .loft-page .loft-sol p a{color:#ffd45e!important}
  /* The "Show overview and more" control was styled for a light page: deep blue
     ink, no ground, a faint border. All three disappear on navy (owner: "it
     blends into background now"). It reads as a proper button here. */
  .loft-page .loft-showchrome{color:var(--white)!important;
    background:rgba(255,255,255,0.10)!important;border:1.5px solid rgba(255,255,255,0.45)!important;
    border-radius:9px!important;padding:10px 20px!important}
  .loft-page .loft-showchrome:hover{background:rgba(255,255,255,0.20)!important}
  /* THE JOIN FORM IS BODY COPY ON THE NAVY, and it shipped in the light-page ink
     (owner, 2026-08-17: the "see your stats and join the leaderboard" text
     "blends into the navy background"). It is the block a player is sent to by the
     end card's sign-up action, so an anonymous player who has just finished a game
     lands on it. Measured on the live page before the fix: the heading ran 1.8:1
     against this ground, the two intro paragraphs and the field labels 1.0 to
     1.1:1, and the prominent "I cannot get back in" link was var(--accent), the
     EXACT colour of the ground, so it was not low contrast, it was invisible.
  
     RE-INKED WITH CUSTOM PROPERTIES rather than the !important overrides used
     above, and that is mechanism rather than taste. JoinLeaderboardForm and
     SigninHelp set their colours INLINE, inline beats a stylesheet at any
     specificity, and the broad tail catch-all a few rules up provably matches
     nothing (see its own comment). A var with a light-page fallback declared in
     the component is the only thing that lets ONE rule here move all of them.
     Unset on every other surface that renders those two components (the /quiz
     boards, the claim-your-name modals, ShareCreditPop) the fallbacks apply, so
     nothing off a loft page changes.
  
     The white INPUT FIELDS are deliberately absent: they carry their own ground
     and keep their dark ink. The values are the tail's existing palette, so the
     form reads as the same object as the copy above it. */
  .loft-page{--join-head:var(--white);--join-body:#bfd0ee;--join-soft:#9dc0f5;
    --join-loud:#ffd45e;--join-ok:#6ee7b7;--join-err:#ffb4a8}
  .loft-page footer{color:#bfd0ee!important;border-top-color:rgba(255,255,255,0.18)!important}
  .loft-page footer b,.loft-page footer strong,.loft-page footer h3,.loft-page footer h4{color:var(--white)!important}
  .loft-page footer a{color:#dbe9ff!important}
  .loft-page footer div,.loft-page footer p,.loft-page footer span,.loft-page footer li{color:inherit!important}
  /* UNUSED as of 2026-08-14, kept for a game that wants a figure on the navy
     under its board. Crux was the only caller and its IQ figure moved ONTO the
     end card (.loft-fiq below), because that is where a player looks for it.
     Delete both blocks if nothing has claimed them by the time the format ships. */
  .loft-iq{margin-top:12px;padding:11px 12px;background:rgba(255,255,255,0.09);
    border-left:4px solid var(--gold);border-radius:0 9px 9px 0;color:var(--white)}
  .loft-iq .l{display:block;font-weight:800;font-size:9.5px;line-height:1;letter-spacing:.11em;
    text-transform:uppercase;color:#ffd45e;margin-bottom:7px}
  .loft-iq .v{font-weight:800;font-size:24px;line-height:1}
  .loft-iq .v small{font-weight:700;font-size:12px;color:#9dc0f5;margin-left:8px;letter-spacing:0}
  .loft-acts{display:flex;gap:8px;margin-top:10px}
  .loft-acts button{flex:1;border-radius:10px;padding:13px 8px;text-align:center;font-weight:800;
    font-size:13.5px;font-family:inherit;cursor:pointer;border:1px solid rgba(255,255,255,0.22);
    background:rgba(255,255,255,0.12);color:var(--white)}
  .loft-acts button.gold{background:var(--gold);border-color:var(--gold);color:#3a2a05}
  /* THE FINISH IS THE BOARD TURNING OVER.
     The front face is the board you just played. The back is what to do next.
     The container takes its height from the FRONT, and the back is absolutely
     positioned inside it, so a short options list can never make the card jump
     and a long one scrolls instead. */
  .loft-flip{perspective:1400px}
  .loft-flip-in{position:relative;transition:transform .5s cubic-bezier(.4,.1,.2,1);
    transform-style:preserve-3d}
  .loft-flip.on .loft-flip-in{transform:rotateY(180deg)}
  /* BOTH FACES MUST HIDE THEIR BACK, and the back one was missing it. The front
     had backface-visibility:hidden and the back did not, so pressing Reveal (which
     drops the .on class to turn the card back to the board) left the options panel
     painted on top of the board, MIRRORED, because it was now facing away. It also
     still swallowed the taps: a hit test at the middle of the card landed on
     .loft-opt. That is the whole of the "reveal is broken" bug, measured on the
     live page 2026-08-14, and it is why the panel in the report looked mirrored.
     pointer-events is belt and braces: whichever face is turned away cannot be
     clicked even if an engine mispaints the backface. */
  .loft-face{backface-visibility:hidden;-webkit-backface-visibility:hidden}
  .loft-back{position:absolute;inset:0 0 12px 0;transform:rotateY(180deg);background:var(--white);
    border-radius:14px;box-shadow:0 10px 30px rgba(0,0,0,0.34);
    display:flex;flex-direction:column;color:var(--ink);
    /* THE SCROLL MOVED INSIDE (owner, 2026-08-14: "right corners need to be
       rounded"). With overflow:auto on this element the scrollbar is painted in
       the element's own padding box, which squares off both right-hand corners
       however large the radius is. Clipping here and scrolling on a child keeps
       the corner. */
    overflow:hidden;
    backface-visibility:hidden;-webkit-backface-visibility:hidden}
  .loft-backin{flex:1;min-height:0;overflow:auto;padding:12px;display:flex;flex-direction:column;
    border-radius:14px}
  /* REPORT AN ISSUE, at the foot of every loft daily (owner, 2026-08-14). It used
     to live inside the games grid in the tail, which is gone, and it is the one
     thing down there worth keeping. Navy pill, white letters, on the stage under
     the board. */
  /* THE HOLD NOTE (app/EndHoldNote.jsx), on the stage under the board for the
     beat between the last move and the card flipping in. Translucent white on the
     navy so it reads as part of the stage rather than as a toast that has drifted
     onto it, and it fades in rather than appearing, because it lands while the
     player is still looking at the board. */
  .loft-hold{margin-top:14px;display:flex;justify-content:center;animation:loftHoldIn .22s ease both}
  .loft-hold span{background:rgba(255,255,255,0.14);border:1.5px solid rgba(255,255,255,0.5);
    color:var(--white);border-radius:999px;padding:9px 18px;font-weight:800;font-size:13.5px;
    line-height:1.35;text-align:center;max-width:472px}
  @keyframes loftHoldIn{from{opacity:0;transform:translateY(-4px)}to{opacity:1;transform:none}}
  @media (prefers-reduced-motion:reduce){.loft-hold{animation:none}}
  
  .loft-report{margin-top:14px;margin-bottom:34px;display:flex;justify-content:center}
  .loft-report .ri-wrap{width:auto}
  .loft-report .ri-link{background:rgba(255,255,255,0.12);color:var(--white);border:1.5px solid rgba(255,255,255,0.45);
    border-radius:10px;padding:10px 18px;font-weight:800;font-size:12.5px;text-decoration:none;opacity:1}
  .loft-report .ri-link:hover{background:rgba(255,255,255,0.22)}
  .loft-report .ri-form,.loft-report .ri-sent{background:var(--white);border-radius:12px;padding:12px;margin-top:10px;text-align:left}
  .loft-fiq .bi{flex:none;color:var(--white);margin-right:2px}
  .loft-back-btn{margin-left:auto;border:2px solid var(--border);background:var(--surface-alt);
    color:var(--slate);border-radius:9px;padding:7px 12px;font-family:inherit;font-weight:800;
    font-size:12.5px;cursor:pointer}
  /* NO POINTER-EVENTS GATE ON THE FACES ANY MORE (owner report, 2026-08-16:
     "if you press Reveal answer, it disables every button in the end game card").
     These three rules were the belt-and-braces guard for the 3D turn: whichever
     face was rotated away could not be clicked. The turn was then retired at EVERY
     width (see the "NO SCROLLER, AT ANY WIDTH" block below, which sets
     perspective:none, transform:none, and display:none on the turned-away face),
     so the two faces are no longer stacked and nothing needs guarding. What was
     left was a gate that fired in exactly the wrong state: Reveal drops the .on
     class, and .loft-flip .loft-back{pointer-events:none} then killed every button
     on the finish card while it sat, fully visible, in the flow under the board.
     The face is display:none when .on, so it needs no gate either. Do NOT
     reintroduce either rule without also reinstating the 3D turn. */
  .loft-res{display:flex;align-items:baseline;justify-content:space-between;gap:10px;margin-bottom:10px;
    padding-bottom:9px;border-bottom:1px solid var(--border)}
  .loft-res b{font-weight:800;font-size:17px;line-height:1}
  /* The verdict, moved off the cap. A full-bleed header that wears the GAME'S
     CATEGORY HUE (owner, 2026-08-26), the same --cat-hue the cap band and the
     stage wash already carry, so the card reads as part of the game it belongs to
     rather than as a traffic light bolted onto it. THE OUTCOME IS THE PILL THE
     TITLE SITS IN: green solved, amber partial, red not. (It shipped that morning
     as a DOT beside the title and the owner called it back the same day: a word
     in a coloured pill is the thing being read, where a dot is a second object to
     notice first.)
     THE PILL IS A PALE TINT WITH DARK INK, and that is structural, not taste. A
     SATURATED pill cannot work here. Every CAT_BLUE value is dark enough to clear
     4.5:1 against pure white (see lib/home-blues), so a deep green pill sits at
     roughly the weight of its own band and all but disappears on green Trivia,
     and the red one does the same on crimson End Game. A near-white tint inherits
     that guarantee in reverse and therefore separates from EVERY hue on the
     wheel, while still reading green, yellow or red at a glance. Verified on the
     two worst cases before shipping.
     The detail beside it stays PURE white and is never dimmed with opacity, for
     the same contrast reason. */
  .loft-res-won,.loft-res-part,.loft-res-lost{margin:-12px -12px 10px;padding:12px;
    border-bottom:0;border-radius:14px 14px 0 0;
    background:var(--cat-hue,var(--accent));border-left:6px solid var(--cat-hue,var(--accent))}
  .loft-res.loft-res-won s,.loft-res.loft-res-part s,.loft-res.loft-res-lost s{color:var(--white)}
  .loft-res.loft-res-won b,.loft-res.loft-res-part b,.loft-res.loft-res-lost b{
    padding:7px 13px;border-radius:999px;line-height:1}
  .loft-res.loft-res-won b{background:#bbf7d0;color:#14532d}
  .loft-res.loft-res-part b{background:#fde68a;color:#713f12}
  .loft-res.loft-res-lost b{background:#fecdd3;color:#881337}
  .loft-res s{text-decoration:none;font-weight:700;font-size:11px;color:var(--slate)}
  
  /* UP NEXT, under the verdict (owner, 2026-08-17). The 'similar' option was a
     half tile in the third row of .loft-opts; it is a band of its own now. Green
     because that is already the similar tone, and outlined rather than filled so
     it does not compete with the solid verdict directly above it. No icon: the
     cap tiles above carry the game art, and the option a client passes has no
     image in it. */
  .loft-next{display:flex;align-items:center;gap:10px;padding:11px 13px;border-radius:11px;
    background:rgba(21,128,61,0.09);border:2px solid rgba(21,128,61,0.26);
    color:var(--ink);text-decoration:none;font-family:inherit;text-align:left;cursor:pointer}
  .loft-next:hover{background:rgba(21,128,61,0.14)}
  .loft-next .t{flex:1;min-width:0}
  .loft-next .eb{display:block;font-weight:800;font-size:9.5px;line-height:1;letter-spacing:.11em;
    text-transform:uppercase;color:var(--success-deep);margin-bottom:4px}
  /* Every line clamps: a long game name or tag must not make the band taller
     than the verdict it sits under. */
  /* padding-bottom + an equal negative margin so descenders clear the clip box
     without the line-height, and therefore the band's height, changing. */
  .loft-next .nm{display:block;font-weight:800;font-size:19px;line-height:1.05;letter-spacing:-.022em;
    padding-bottom:4px;margin-bottom:-4px;
    overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
  .loft-next .tg{display:block;font-weight:700;font-size:11.5px;line-height:1.3;color:var(--muted);
    margin-top:3px;padding-bottom:3px;margin-bottom:-3px;
    overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
  .loft-next .go{flex:none;background:var(--success-deep);color:var(--white);border-radius:10px;
    padding:11px 15px;font-weight:800;font-size:13.5px;white-space:nowrap}
  @media(max-width:560px){
    .loft-next{gap:9px;padding:10px 11px}
    .loft-next .nm{font-size:17px}
    .loft-next .go{padding:10px 13px;font-size:13px}
  }
  /* THE OPTIONS ARE A TWO-ACROSS GRID THAT GROWS (owner, 2026-08-14: "these
     buttons all need to be larger, and can split width if needed").
     They were a single stacked column of 11px-padded rows, which on a card sized
     to the BOARD left most of the card empty below them: the back takes its
     height from the front, so on a tall board the options used the top third and
     nothing used the rest. Two across halves the run of them and doubles the
     width each one gets, and flex:1 on the grid lets the rows stretch into the
     space that was empty, so the buttons get larger for free rather than by
     picking a bigger fixed height that would overflow a short card.
     The "wide" class spans both columns; LoftFinish sets it on the primary and
     on a trailing odd one, so the grid never ends on a half-width orphan.
     NO BACKTICKS IN THIS COMMENT: it is inside a template literal, so one closes
     the style block and breaks the build. */
  .loft-opts{display:grid;grid-template-columns:1fr 1fr;gap:9px;margin-top:11px;
    flex:1;min-height:0;align-content:stretch}
  .loft-opt{display:flex;flex-direction:column;justify-content:center;text-align:left;
    min-height:64px;padding:13px 15px;
    border-radius:11px;border:2px solid var(--border);background:var(--white);color:var(--ink);
    font-family:inherit;font-weight:800;font-size:15.5px;line-height:1.15;cursor:pointer;text-decoration:none}
  .loft-opt .sub{display:block;font-weight:600;font-size:11.5px;line-height:1.3;margin-top:5px;opacity:.72}
  /* A LONG GAME NAME MUST NOT BLOW THE BUTTON OUT. "Play another Crux" is short,
     but the roster carries names well past it and these sit two to a row on a
     phone, so the label has to be allowed to wrap and to break inside a word if
     it ever has to. min-height rather than height means the button simply grows
     to whatever the name needs, and its partner in the row grows with it. */
  .loft-opt{overflow-wrap:anywhere;word-break:normal}
  .loft-opt .sub{overflow-wrap:anywhere}
  .loft-opt.wide{grid-column:1 / -1}
  .loft-opt.pri{background:var(--blue);border-color:var(--blue);color:var(--white)}
  .loft-opt.gold{background:var(--gold);border-color:var(--gold);color:#3a2a05}
  @media(max-width:400px){.loft-opts{grid-template-columns:1fr}.loft-opt{min-height:0}}
  
  /* IQ earned, ON the card. It used to sit below the stage in .loft-iq, styled
     white-on-navy; the end card is the place a player looks for it, so it moves
     inside and takes light-card ink. Same gold rule, same figure.
     IT WEARS THE CATEGORY HUE (owner, 2026-08-26), matching the verdict band
     above it, so the card is one colour rather than a game-coloured header over a
     blue block. --blue is only the fallback for a surface that mounts this
     without a cap to set the hue.
     THE SECONDARY INK WENT PURE WHITE IN THE SAME PASS, and it had to. It was
     #cfe0ff, a pale BLUE that was picked to sit on the blue ground and reads as a
     stain on teal, crimson or umber. There is no tint that replaces it either:
     every CAT_BLUE clears 4.5:1 against pure white with no headroom past it, so
     ANY tint drops small text under AA on the darkest hues. Hierarchy here comes
     from size and weight, which is lib/home-blues rule 1. */
  .loft-fiq{min-height:64px;box-sizing:border-box;
    display:flex;align-items:center;gap:13px;margin-top:11px;padding:11px 14px;
    background:var(--cat-hue,var(--blue));border-left:4px solid var(--gold);border-radius:0 10px 10px 0}
  .loft-fiq .n{font-weight:800;font-size:29px;line-height:1;color:var(--white);letter-spacing:-.02em}
  .loft-fiq .t{min-width:0}
  .loft-fiq .l{display:block;font-weight:800;font-size:9.5px;line-height:1;letter-spacing:.11em;
    text-transform:uppercase;color:var(--white);margin-bottom:5px}
  .loft-fiq .m{display:block;font-weight:700;font-size:11.5px;line-height:1.3;color:var(--white)}
  .loft-fiq .today,.loft-fiq .today *{color:var(--white)}
  .loft-fiq .today s,.loft-fiq .today em,.loft-fiq .today i{color:var(--white)}
  .loft-fiq .today{flex:none;margin-left:auto;padding-left:12px;text-align:right}
  .loft-fiq .today b{display:block;font-weight:800;font-size:18px;line-height:1;color:var(--white)}
  .loft-fiq .today i{display:block;font-style:normal;font-weight:700;font-size:9px;line-height:1;
    letter-spacing:.09em;text-transform:uppercase;color:var(--white);margin-top:4px}
  /* The day's IQ RANK, second of the two right-hand figures. .today carries
     margin-left:auto to push itself to the right edge; a SECOND auto margin would
     split the free space between the two and park them apart, so this one takes a
     plain gap and rides along behind the first. */
  .loft-fiq .today.rank{margin-left:0;padding-left:18px}
  .loft-fiq .today b em{font-style:normal;font-weight:700;font-size:11px;margin-left:5px}
  
  /* Today's board, top three plus you when you are outside it. */
  /* THE RESERVE ONLY APPLIES WHILE THE BOARD IS STILL COMING BACK (owner,
     2026-08-15). It used to be unconditional, at the height of three rows plus
     the header AND the Show-all bar, so a settled three-row board that carries no
     Show-all bar left about fifty pixels of white between the last player and the
     Share button. LoftFinish drops the wait class the moment it has rows, and the
     block then sizes to its own content; the reserve still holds the card steady
     while the figure reads Calculating, which is all it was ever for. */
  .loft-lb{margin-top:11px}
  .loft-lb.wait{min-height:191px}
  .loft-lb .h{display:flex;align-items:baseline;justify-content:space-between;margin-bottom:6px}
  .loft-lb .h b{font-weight:800;font-size:9.5px;letter-spacing:.11em;text-transform:uppercase;color:var(--muted)}
  .loft-lb .h s{text-decoration:none;font-weight:700;font-size:11px;color:var(--slate)}
  .loft-lbr{display:flex;align-items:center;gap:9px;padding:7px 9px;border-radius:8px;
    font-weight:700;font-size:13px;color:var(--ink)}
  .loft-lbr+.loft-lbr{margin-top:3px}
  .loft-lbr .r{flex:none;width:18px;font-weight:800;font-size:12px;color:var(--muted);
    font-variant-numeric:tabular-nums}
  .loft-lbr .n{flex:1;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
  .loft-lbr .s{flex:none;font-weight:800;font-variant-numeric:tabular-nums}
  .loft-lbr .s i{font-style:normal;font-weight:700;color:var(--slate);margin-left:7px}
  .loft-lbr.first{background:rgba(232,180,58,0.18)}
  .loft-lbr.first .r{color:#8a6d1a}
  .loft-lbr.me{background:var(--accent-soft)}
  .loft-lbr.me .r{color:var(--blue)}
  /* EXPANDED: the score keeps its own column and the game's own miss column and
     the clock join it. The miss column is labelled per game from the registry's
     "miss" field, because Guesses, Errors, Moves and Tries are not the same thing
     and one shared header would be wrong on most of them. */
  .loft-lbr .c{flex:none;width:52px;text-align:right;font-weight:700;font-size:12px;
    color:var(--slate);font-variant-numeric:tabular-nums}
  .loft-lbr.cols .s{width:44px;text-align:right}
  .loft-lbr.head{font-weight:800;font-size:9.5px;letter-spacing:.08em;text-transform:uppercase;
    color:var(--muted);padding-bottom:2px}
  .loft-lbr.head .s,.loft-lbr.head .c{font-size:9.5px;color:var(--muted)}
  .loft-more{width:100%;margin-top:6px;padding:8px;border-radius:8px;border:2px solid var(--border);
    background:var(--surface-alt);color:var(--slate);font-family:inherit;font-weight:800;
    font-size:12px;cursor:pointer}
  .loft-empty{display:block;padding:8px 2px;font-weight:700;font-size:12.5px;color:var(--slate)}
  
  /* The day, under the IQ tile: what the game paid, then where that leaves you. */
  .loft-day{display:flex;flex-wrap:wrap;gap:8px;margin-top:8px}
  .loft-day span{flex:1 1 22%;min-width:96px}
  .loft-day span{min-height:52px;box-sizing:border-box;display:flex;flex-direction:column;
    align-items:center;justify-content:center;
    flex:1;padding:9px 10px;border-radius:10px;background:var(--surface-alt);
    font-weight:700;font-size:10.5px;line-height:1.2;color:var(--slate);text-align:center;
    overflow-wrap:anywhere}
  /* One colour per figure, drawn from tokens already on this page: blue for the
     IQ the site scores you on, green for progress through the day, gold for a
     ranking (the same gold the leaderboard's first place uses) and ember for the
     streak. Tinted grounds with a matching ink, not four greys. */
  @media(max-width:560px){
    .loft-day{flex-wrap:wrap;gap:6px}
    .loft-day span{flex:1 1 calc(50% - 3px);min-width:0;padding:8px 6px;font-size:9.5px}
    .loft-day span b{font-size:15px}
    .loft-fiq{gap:9px;padding:10px 11px}
    .loft-fiq .n{font-size:23px}
    .loft-fiq .m{font-size:10.5px}
    .loft-fiq .today b{font-size:15px}
    /* Two figures plus the run of text is a lot for a phone: the field size is
       the least of it, so it goes and the two figures stay. */
    .loft-fiq .today.rank{padding-left:12px}
    .loft-fiq .today b em{display:none}
  }
  .loft-day .d1{background:var(--accent-soft)}
  .loft-day .d1 b{color:var(--blue-deep)}
  .loft-day .d2{background:rgba(21,128,61,0.10)}
  .loft-day .d2 b{color:var(--success-deep)}
  .loft-day .d3{background:rgba(232,180,58,0.20)}
  .loft-day .d3 b{color:#8a6d1a}
  .loft-day .d4{background:rgba(217,119,6,0.12)}
  .loft-day .d4 b{color:#b45309}
  .loft-day b{display:block;font-weight:800;font-size:17px;line-height:1;color:var(--ink);margin-bottom:4px}
  
  /* CALCULATING, never a blank or a zero. Every figure on this card comes from a
     read that races the player's own result write and retries for several
     seconds, so while it waits the honest thing to say is that it is being worked
     out. The dots animate so it reads as pending rather than stuck. */
  .loft-calc{display:inline-flex;align-items:baseline;font-weight:800;font-size:13px;color:var(--muted);
    white-space:nowrap;max-width:100%;overflow:hidden}
  /* The placeholder occupies the same line height as the figure it stands in for,
     so swapping one for the other moves nothing. */
  .loft-day .loft-calc{font-size:17px;line-height:1}
  .loft-day span b{display:block;line-height:1;white-space:nowrap}
  /* The tile's own label cannot wrap either, or a two-word category name makes
     the row taller than the tiles beside it. */
  .loft-day span{white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
  .loft-fiq .loft-calc{font-size:18px;line-height:1}
  .loft-calc.wide{display:flex;padding:10px 2px}
  .loft-calc i{font-style:normal;animation:loftdot 1.4s infinite}
  .loft-calc i:nth-child(2){animation-delay:.2s}
  .loft-calc i:nth-child(3){animation-delay:.4s}
  /* The IQ bar's SINGLE loading line, in place of three per-figure placeholders
     (owner, 2026-08-17). See the comment on the bar in LoftFinish for the
     overflow this replaced. One short nowrap string cannot outgrow the row, at
     any width, so this needs no phone variant. The bar keeps its min-height, so
     swapping this for the figures moves nothing below it. */
  .loft-fiq.calc1{gap:11px}
  .loft-fiq .cc{display:inline-flex;align-items:baseline;min-width:0;
    font-weight:800;font-size:15px;letter-spacing:.02em;color:var(--white);white-space:nowrap}
  .loft-fiq .cc i{font-style:normal;animation:loftdot 1.4s infinite}
  .loft-fiq .cc i:nth-child(2){animation-delay:.2s}
  .loft-fiq .cc i:nth-child(3){animation-delay:.4s}
  /* ONE BLOCK OVER THE IQ BAR AND THE RANK TILES (owner, 2026-08-25). It stands
     in for both, so it is sized to both: 64px of bar plus the 8px gap plus 52px
     of tiles is 124, and holding that height means the leaderboard and the
     options below it do not jump when the figures land. Same ground and the same
     gold rule as the bar it opens into, so the swap reads as the block filling in
     rather than as a different object arriving. */
  .loft-calcall{min-height:124px;box-sizing:border-box;display:flex;align-items:center;gap:14px;
    margin-top:11px;padding:14px 16px;
    background:var(--cat-hue,var(--blue));border-left:4px solid var(--gold);border-radius:0 10px 10px 0}
  .loft-calcall .bi{flex:none;color:var(--white)}
  .loft-calcall .t{min-width:0}
  .loft-calcall .h{display:block;font-weight:800;font-size:18px;line-height:1.15;
    letter-spacing:-.01em;color:var(--white)}
  .loft-calcall .s{display:block;font-weight:700;font-size:12.5px;line-height:1.35;
    color:var(--white);margin-top:6px}
  .loft-calcall .h i{font-style:normal;animation:loftdot 1.4s infinite}
  .loft-calcall .h i:nth-child(2){animation-delay:.2s}
  .loft-calcall .h i:nth-child(3){animation-delay:.4s}
  @media(max-width:560px){
    .loft-calcall{min-height:112px;padding:12px;gap:11px}
    .loft-calcall .h{font-size:16px}
    .loft-calcall .s{font-size:11.5px}
  }
  @keyframes loftdot{0%,60%,100%{opacity:.25}30%{opacity:1}}
  
  /* The archive, opened IN the card. */
  /* THE FULL ARCHIVE, IN A SCROLLER (owner, 2026-08-17). The list was capped at
     14 dates in every client; banks run 73 to 86 puzzles, so most of each game's
     history was unreachable. Uncapped it needs a scroller of its own: the finish
     card deliberately has none (the flip is a swap, so .loft-back is
     overflow:visible and the card is as tall as its content), and ~80 rows at
     44px would make it roughly 3,500px tall.
  
     The height is min(58vh, 520px): tall enough to show about eleven rows, short
     enough that the card still fits a phone viewport with the header above it.
     overscroll-behavior:contain stops a flick at the end of the list from
     scrolling the page behind it, which on a touch device reads as the archive
     closing itself. */
  .loft-arch{margin-top:4px;max-height:min(58vh, 520px);overflow-y:auto;overscroll-behavior:contain;
    -webkit-overflow-scrolling:touch;padding-right:3px;
    scrollbar-width:thin;scrollbar-color:#c9cfda transparent}
  .loft-arch::-webkit-scrollbar{width:9px}
  .loft-arch::-webkit-scrollbar-track{background:transparent}
  .loft-arch::-webkit-scrollbar-thumb{background:#c9cfda;border-radius:999px;
    border:2px solid var(--white);background-clip:padding-box}
  .loft-arch::-webkit-scrollbar-thumb:hover{background:#aeb6c5;background-clip:padding-box}
  .loft-archr{display:flex;align-items:center;gap:10px;padding:9px 10px;border-radius:9px;
    text-decoration:none;color:var(--ink);font-weight:700;font-size:13px}
  .loft-archr+.loft-archr{margin-top:3px}
  .loft-archr:hover{background:var(--surface-alt)}
  .loft-archr .d{flex:1;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
  .loft-archr .no{flex:none;font-weight:700;font-size:11px;color:var(--muted);font-variant-numeric:tabular-nums}
  .loft-archr .v{flex:none;min-width:44px;text-align:right;font-weight:800;font-size:12px;color:var(--blue)}
  .loft-archr.done .v{color:var(--success-deep)}
  .loft-opt.on{background:var(--surface-alt)}
  
  /* NO INNER SCROLLER ON A PHONE (owner, 2026-08-14: "it should all fit on the
     card itself"). The back is absolutely positioned inside the flip so it
     inherits the FRONT's height, which is the board's, so its own content can
     never fit by construction: on a 390px screen it overran by a few pixels and
     on a game with a short board it would overrun badly. Below 760px the flip
     stops being a 3D turn and becomes a swap. The front leaves the flow, the back
     goes back into it, and the card is then as tall as whatever is on it. The
     turn animation is no loss here: on a phone the card fills the screen, so
     almost none of it was ever visible. */
  /* NO SCROLLER, AT ANY WIDTH (owner, 2026-08-14, twice: "no scroller! make the
     box longer"). This was gated to phones, and desktop kept its inner scrollbar
     because the back is absolutely positioned inside the flip and so inherits the
     FRONT's height, which is the board's. Its own content can never fit by
     construction, whatever the screen. So the swap is universal now: the front
     leaves the flow, the back rejoins it, and the card is exactly as tall as the
     finish needs. The cost is the 3D turn, which is the right trade for never
     hiding half the card behind a scrollbar. */
  .loft-flip{perspective:none}
  .loft-flip.on .loft-flip-in{transform:none}
  .loft-flip.on .loft-face{display:none}
  .loft-back{position:relative;inset:auto;transform:none;overflow:visible}
  .loft-flip:not(.on) .loft-back{margin-top:14px}
  .loft-backin{overflow:visible}
  @media(max-width:760px){
    .loft-day span{padding:7px 8px;font-size:9.5px}
    .loft-day b{font-size:15px;margin-bottom:3px}
    .loft-opt{min-height:52px;height:auto;padding:10px 11px;font-size:13.5px;line-height:1.2}
    .loft-opt .sub{font-size:10.5px;margin-top:3px}
  }
  
  /* THE FOUR SECONDARY OPTIONS LOOKED ALIKE. Reveal is filled blue and Share is
     filled gold, but Archive, Play another, Play similar and Replay were four
     identical outlined boxes. Each takes a tint and a coloured left rule: blue
     for another round of THIS game, green for a different game, slate for the
     unscored replay, ember for the archive. */
  .loft-opt.t-another{background:var(--accent-soft);border-color:rgba(37,99,235,0.28);
    border-left:5px solid var(--blue)}
  .loft-opt.t-similar{background:rgba(21,128,61,0.08);border-color:rgba(21,128,61,0.26);
    border-left:5px solid var(--success-deep)}
  .loft-opt.t-replay{background:var(--surface-alt);border-color:var(--border);
    border-left:5px solid var(--slate)}
  .loft-opt.t-main{background:var(--surface-alt);border-color:var(--border);
    border-left:5px solid var(--blue-deep)}
  /* 'board' SPLIT OFF FROM 'reveal' (owner, 2026-08-19) so a real Reveal can lead
     the card while Return to board stays beside Replay, see the RANK table in
     LoftFinish. They are the same control in two states, so they keep one look:
     any new tile added here needs its own rule or it falls back to bare
     .loft-opt, which is how a split like this silently unstyles a button. */
  .loft-opt.t-reveal,.loft-opt.t-board{background:rgba(109,40,217,0.08);border-color:rgba(109,40,217,0.26);
    border-left:5px solid #6d28d9}
  /* THE CATEGORY BROWSER. Its own tone, slate, so it does not read as one of the
     coloured actions above it: it opens a panel rather than going anywhere. */
  .loft-opt.t-browse{background:var(--surface-alt);border-color:var(--border);
    border-left:5px solid var(--muted)}
  .loft-browse{grid-column:1 / -1;margin-top:2px}
  .loft-cats{display:flex;flex-wrap:wrap;gap:6px;margin-bottom:10px}
  .loft-cats button{font-family:inherit;font-weight:800;font-size:11.5px;cursor:pointer;
    padding:6px 10px;border-radius:999px;border:1.5px solid var(--border);
    background:var(--white);color:var(--slate);display:inline-flex;align-items:center;gap:6px}
  .loft-cats button i{font-style:normal;font-weight:700;font-size:9.5px;color:var(--slate);
    background:var(--surface-alt);border-radius:999px;padding:1px 5px}
  .loft-cats button.on{background:var(--blue);border-color:var(--blue);color:var(--white)}
  .loft-cats button.on i{background:rgba(255,255,255,0.24);color:var(--white)}
  /* Two across on a desktop card, one on a phone: a tagline needs the width more
     than the grid needs a third column. */
  .loft-gtiles{display:grid;grid-template-columns:1fr 1fr;gap:7px}
  @media(max-width:560px){.loft-gtiles{grid-template-columns:1fr}}
  .loft-gtiles a{display:flex;align-items:center;gap:9px;text-decoration:none;
    border:1.5px solid var(--border);border-radius:10px;padding:8px 10px;background:var(--white);
    color:var(--ink);min-width:0}
  .loft-gtiles a:hover{border-color:var(--blue);background:var(--accent-soft)}
  .loft-gtiles img{flex:0 0 auto;width:30px;height:30px;border-radius:7px;object-fit:contain;display:block}
  .loft-gtiles span{min-width:0;flex:1}
  .loft-gtiles b{display:block;font-weight:800;font-size:13px;line-height:1.1;
    white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
  .loft-gtiles i{display:block;font-style:normal;font-weight:600;font-size:10.5px;line-height:1.25;
    margin-top:2px;color:var(--slate);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
  /* A game you have already finished today stays reachable, just quieter. */
  .loft-gtiles a.played{background:var(--surface-alt);border-color:var(--border)}
  .loft-gtiles a.played b,.loft-gtiles a.played i{color:var(--slate)}
  .loft-gtiles em{flex:0 0 auto;font-style:normal;font-weight:800;font-size:9px;letter-spacing:.08em;
    text-transform:uppercase;color:var(--success-deep)}
  .loft-opt.t-archive{background:rgba(217,119,6,0.09);border-color:rgba(217,119,6,0.26);
    border-left:5px solid #b45309}
  
  /* Played rows read as played, and a Sunday Edition is marked. */
  .loft-archr .d{display:flex;align-items:center;gap:7px}
  .loft-archr .sunchip{font-style:normal;font-weight:800;font-size:8.5px;letter-spacing:.09em;
    text-transform:uppercase;color:var(--gold-ink);background:var(--gold);border-radius:4px;padding:2px 5px}
  .loft-archr.sun{background:rgba(232,180,58,0.10)}
  .loft-archr .v em{font-style:normal;font-weight:800;font-size:10px;letter-spacing:.06em;
    text-transform:uppercase;color:var(--success-deep);margin-left:6px}
  .loft-archr .v b{font-weight:800;font-size:13px;color:var(--ink)}
  .loft-archr.done{background:rgba(21,128,61,0.06)}
  .loft-sheet{background:var(--white);border-radius:14px;padding:14px 16px 16px;
    box-shadow:0 10px 30px rgba(0,0,0,0.34)}
  .loft-sheet .loft-card{box-shadow:none!important;background:transparent!important;
    border-radius:0!important}
  @media(max-width:560px){.loft-sheet{padding:11px 11px 13px;border-radius:12px}}
  .loft-prompt{font-family:inherit;font-weight:700;font-size:12px;line-height:1.3;color:var(--slate);
    text-align:center;padding:0 2px 10px;border-bottom:1px solid rgba(20,22,28,0.10);margin-bottom:12px}
  .loft-showopts{width:100%;margin-top:10px;padding:11px;border-radius:10px;border:2px solid var(--border);
    background:var(--surface-alt);color:var(--muted);font-family:inherit;font-weight:800;font-size:13px;cursor:pointer}
  
  /* Up next sits ABOVE the leaderboard: after a finish the strongest next move is
     the next puzzle, not the standings. */
  .loft-next{display:flex;align-items:center;gap:11px;margin-top:10px;padding:11px 12px;
    background:rgba(232,180,58,0.16);border-left:4px solid var(--gold);border-radius:0 9px 9px 0;
    text-decoration:none}
  .loft-next .t{flex:1;min-width:0}
  .loft-next .n1{display:block;font-weight:800;font-size:15px;line-height:1;color:var(--white)}
  .loft-next .n2{display:block;font-weight:600;font-size:11px;line-height:1.3;color:#e8c884;margin-top:4px}
  .loft-next .go{flex:none;background:var(--gold);color:#3a2a05;border-radius:8px;padding:9px 14px;
    font-weight:800;font-size:12.5px;line-height:1}
  
  /* The navy is the PLAY STAGE only, not the page. A navy page ground looked
     right on a long page and broke on a short one: in focus mode the content
     ends just under the board, so the light region below became a stripe with
     navy under it. The stage carries its own navy and the page stays light, so
     whatever is left at the bottom is simply page. */
        ` }} />
  );
}
