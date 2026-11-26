'use client';

// THE STAGE, APPLIED TO THE CIRCUIT PAGES.
//
// Until this component /circuits and /circuits/<id> were the last surfaces in
// the daily family still wearing the Loft: QuizNavHeader's navy masthead and
// two-row stat bar on top, NavyFrame's re-inked site footer underneath, and
// white cards on the body navy in between. Every daily and the home moved to
// the stage on 2026-08-31; these did not, so a reader who pressed a circuit
// card on the home landed on a page from the previous design and pressed
// through to a game on the current one (owner report, 2026-08-31).
//
// WHY A FRAME RATHER THAN StageChrome. StageChrome is a GAME cap: it carries a
// quizId, a leader strip, a rankings panel and the game's own progress. A
// circuit page has no board and no field of its own, so it takes the shape the
// stage HOME takes instead — one cap line, the page, the stage footer — which
// is also what makes the two pages read as the same surface.
//
// THE ACCENT IS THE CIRCUIT'S LEAD GAME'S CATEGORY STEP, never a colour of its
// own. A circuit spans categories and the stage's whole palette is the nine
// ramp steps, so inventing a sixteenth hue for the circuit family would put a
// colour on the page that means nothing. The lead game is the one the run
// starts with, so its step is the colour the reader is about to be handed.
//
// Both registers are published as --stg-acc-dk / --stg-acc-lt and globals.css
// picks one, exactly as every daily client does: an inline style beats a
// stylesheet, so a root setting --stg-acc directly could never be re-themed.
import { cycleSiteLook, useStageLook } from '@/lib/stage-look';
import StageTopBar from '../StageTopBar';
import { useStageTheme, useThemeQs } from '@/lib/stage-theme';
import { categoryColor, sitePastelHex } from '@/lib/category-ramp';
import StageFooter from '../StageFooter';

const MONO = "'Manrope', ui-monospace, SFMono-Regular, Menlo, monospace";
const SANS = 'Manrope, ui-sans-serif, system-ui, -apple-system, sans-serif';

// THE HEADER IS ALWAYS THE ONE-LINE StageTopBar (owner, 2026-11-26, on the
// cognitive health hub: "This header format does not match our other pages ...
// Logo should be a back button with arrow, all of this should fit in one row.
// No need to link to quizzes. Just logo/name - page title - light dark
// toggle"). Until then only pages passing `bar` got it (2026-11-07: Build a
// Run, /run, About Me); every other frame page drew the old two-row cap with
// Today and Quizzes. Now `bar` ({ title, sub, dot }) only overrides the title,
// which otherwise is `label`. No Share on these pages, per the same ruling.
//
// THE ACCENT IS THE SITE PASTEL ON THE LIGHT PAGE (owner, same day: "These
// pages also use old colors"). With no category the light register fell
// through to the deep sky #0369a1, the retired dark blue, and with one it took
// the deep light-ramp step. Both are replaced: the fill is the step mixed with
// white (sitePastelHex, what the home tiles wear), text on it is dark ink, and
// accent-as-text is the page ink, since a pastel cannot be read as type on
// white. The dark register keeps the raw step, as before.
export default function CircuitFrame({ cat = null, label = 'Runs', progress = null, wide = false, bar = null, children }) {
  const [theme, setTheme] = useStageTheme();
  const [look] = useStageLook();
  const tq = useThemeQs();
  const withTq = (href) => (tq ? href + (href.includes('?') ? tq : `?${tq.slice(1)}`) : href);

  // No category means no accent override, so the page falls through to the
  // stage's own default sky. That is the right answer for the index, which
  // belongs to all fifteen circuits and therefore to all nine categories.
  const raw = cat ? categoryColor(cat) : '#7dd3fc';
  const acc = {
    '--stg-acc-dk': raw,
    '--stg-acc-lt': sitePastelHex(raw),
    '--stg-onramp-lt': '#0b1220',
    '--stg-acc-ink-lt': 'var(--stg-ink)',
  };
  // Titles are Title Case like every other header (owner, 2026-10-19); some
  // callers pass a sentence-case label ("Logic puzzles").
  const titleCase = (t) => String(t || '').replace(/(^|[\s/·-])([a-z])/g, (m, a, c) => a + c.toUpperCase()).replace(/\b(And|Or|The|Of|In|A|To|By|For|On|At)\b(?!$)/g, (w, x, i) => (i === 0 ? w : w.toLowerCase()));
  const top = { title: titleCase(label), sub: null, dot: raw, ...(bar || {}) };

  return (
    <div className="cfr stage-page" data-stage-theme={theme} style={acc}>
      {/* ⚠️ dangerouslySetInnerHTML, NOT <style dangerouslySetInnerHTML={{ __html: CSS }} />. React ESCAPES a
          text child on the server, so every apostrophe in the stylesheet ships
          as &#x27; — and <style> is an HTML raw-text element, so nothing decodes
          it and the CSS parser sees the entity. Any declaration carrying a quote
          is then dropped: content:'' (every left rule on this page), a
          [data-stage-theme='light'] selector, and grid-template-areas, which
          cannot be written without quotes at all. It is repaired only if React
          re-renders that subtree on the client, which happens when a CLIENT
          parent renders the frame and not when a SERVER page does, so the phone
          cap was correct on /circuits/<id> and collapsed to one row on
          /circuits. Measured on the live page: 35 escaped quotes, and
          getComputedStyle reported grid-template-areas: none. */}
      <style dangerouslySetInnerHTML={{ __html: CSS }} />

      {/* THE CAP: the one-line bar every puzzle and run page wears. */}
      <div className={wide ? 'cfr-stb cfr-stb-wide' : 'cfr-stb'}>
        <StageTopBar look={look} onFlip={() => cycleSiteLook()} ink="var(--stg-ink)" href={withTq('/')} title={top.title || null} sub={top.sub || null} dot={top.dot} share={false} flow />
      </div>

      {/* How much of this page's run is behind you, on the pages that pass it
          without their own bar (circuits, IQ tests). */}
      {progress != null && !bar ? (
        <div className="cfr-prog"><span style={{ width: `${Math.max(0, Math.min(1, progress || 0)) * 100}%` }} /></div>
      ) : null}

      <div className={wide ? 'cfr-wrap cfr-wide' : 'cfr-wrap'}>{children}</div>

      <StageFooter />
    </div>
  );
}

// NOTE: this block is a JS template literal, so no backticks in the comments.
const CSS = `
.cfr-stb{max-width:1000px;margin:0 auto;box-sizing:border-box;padding:max(12px, var(--safe-top, 0px)) 22px 6px;}
.cfr-stb-wide{max-width:1240px;}
@media (max-width:640px){.cfr-stb{padding-left:14px;padding-right:14px;}}

.cfr{min-height:100vh;background:var(--stg-ground);color:var(--stg-ink);
  font-family:${SANS};-webkit-font-smoothing:antialiased;}
.cfr *{box-sizing:border-box;}

.cfr-cap{display:flex;align-items:center;gap:18px;padding:11px 22px;position:relative;
  border-bottom:1px solid var(--stg-line);}
.cfr-id{display:flex;align-items:center;gap:11px;min-width:0;margin-right:auto;}
/* The mark and the words are ONE object so they centre on each other, and the
   label centres on that object. It used to align on baseline, but a flex box
   takes its baseline from its FIRST item, which here is the mark's SVG, so the
   label sat on the bottom of the mark and read a few pixels low. */
.cfr-brand{display:flex;align-items:center;gap:8px;min-width:0;text-decoration:none;
  color:var(--stg-ink);}
.cfr-id b{font-size:16px;font-weight:800;letter-spacing:-0.01em;white-space:nowrap;}
.cfr-id b em{font-style:normal;color:inherit;}
.cfr-lab{font-family:${MONO};font-size:10.5px;line-height:1.2;letter-spacing:.11em;text-transform:uppercase;
  color:var(--stg-mute);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}
.cfr-cx{flex:none;font-family:${MONO};font-size:10px;letter-spacing:.11em;text-transform:uppercase;
  color:var(--stg-ink2);text-decoration:none;border:1px solid var(--stg-line);
  border-radius:7px;padding:6px 10px;}
.cfr-cx:hover{border-color:var(--stg-line2);color:var(--stg-ink);}
.cfr-cx:focus-visible{outline:2px solid var(--stg-acc-ink, var(--stg-acc));outline-offset:2px;}
/* RELATIVE, because globals.css hangs .stg-tlab (the register's name during the
   flip) off the switch absolutely and names only the two caps that existed when
   it was written. Declared here rather than added to that selector list so this
   frame carries everything it needs. */
.cfr-tg{position:relative;display:inline-flex;align-items:center;justify-content:center;
  padding:6px 9px;background:none;cursor:pointer;font:inherit;}
.cfr-tg.hint{border-color:var(--stg-acc-ink, var(--stg-acc));color:var(--stg-acc-ink);animation:stg-hintring 1.9s ease-out 3;}
/* THE FIRST-VISIT POINTER at the light switch, the same ring both caps draw.
   The keyframes are per stylesheet because each cap ships its own sheet; the
   name is shared, so a browser that has already seen it on another surface
   simply never gets the class. */
@keyframes stg-hintring{
  0%{box-shadow:0 0 0 0 var(--stg-acc-ink, var(--stg-acc));}
  70%{box-shadow:0 0 0 10px transparent;}
  100%{box-shadow:0 0 0 0 transparent;}
}
@media (prefers-reduced-motion:reduce){.cfr-tg.hint{animation:none !important;}}
.cfr-prog{height:2px;background:var(--stg-surf2);}
.cfr-prog span{display:block;height:100%;background:var(--stg-ink2);transition:width .4s ease;}

/* The circuit pages are a COLUMN of prose and cards, not a board of tiles, so
   unlike the home they keep a reading measure rather than filling the window. */
.cfr-wrap{max-width:1000px;margin:0 auto;padding:26px 22px 72px;}
/* The puzzle category pages (app/puzzle-category) carry a ledger of games
   beside a day board, so they take the wider measure. */
.cfr-wide{max-width:1240px;}

@media (max-width:640px){
  /* TWO DELIBERATE ROWS, not three accidental ones: row one is what this page
     is, row two is the ways out. Left to flex-wrap, the three controls broke
     one at a time as the label grew. */
  .cfr-cap{display:grid;grid-template-columns:minmax(0,1fr) auto auto;
    grid-template-areas:'id id id' 'tt qq tg';align-items:center;gap:0 8px;padding:0 14px;}
  .cfr-id{grid-area:id;padding:9px 0;margin-right:0;}
  .cfr-brand{gap:7px;}
  .cfr-brand svg{width:17px;height:17px;}
  .cfr-t{grid-area:tt;}
  .cfr-q{grid-area:qq;}
  .cfr-tg{grid-area:tg;}
  .cfr-cap>.cfr-cx{margin-bottom:9px;}
  .cfr-t,.cfr-q{justify-self:start;}
  .cfr-wrap{padding:18px 14px 56px;}
}
@media (prefers-reduced-motion:reduce){.cfr-prog span{transition:none;}}
`;
