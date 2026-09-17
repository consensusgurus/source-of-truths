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
import { useStageTheme, useThemeQs, useThemeHint, useThemeIntro } from '@/lib/stage-theme';
import ThemePop from '../ThemePop';
import { categoryColor, categoryColorLight, categoryOnrampLight, categoryAccentInkLight } from '@/lib/category-ramp';
import MindLoftMark from '../MindLoftMark';
import StageFooter from '../StageFooter';

const MONO = "'JetBrains Mono', ui-monospace, SFMono-Regular, Menlo, monospace";
const SANS = 'Manrope, ui-sans-serif, system-ui, -apple-system, sans-serif';

export default function CircuitFrame({ cat = null, label = 'Circuits', progress = null, children }) {
  const [theme, setTheme] = useStageTheme();
  const tq = useThemeQs();
  const hint = useThemeHint();
  const intro = useThemeIntro();
  const withTq = (href) => (tq ? href + (href.includes('?') ? tq : `?${tq.slice(1)}`) : href);

  // No category means no accent override, so the page falls through to the
  // stage's own default sky. That is the right answer for the index, which
  // belongs to all fifteen circuits and therefore to all nine categories.
  const acc = cat ? {
    '--stg-acc-dk': categoryColor(cat),
    '--stg-acc-lt': categoryColorLight(cat),
    '--stg-onramp-lt': categoryOnrampLight(cat),
    '--stg-acc-ink-lt': categoryAccentInkLight(cat),
  } : null;

  return (
    <div className="cfr stage-page" data-stage-theme={theme} style={acc || undefined}>
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

      {/* THE CAP. One line: the mark and the words, what this page is, and the
          ways out at the right edge. No masthead and no stat bar, which is the
          stage's first rule and the specific thing that was wrong here. */}
      <div className="cfr-cap">
        <div className="cfr-id">
          <a className="cfr-brand" href={withTq('/')}>
            <MindLoftMark size={20} ink="var(--stg-ink)" accent="var(--stg-brand,#7dd3fc)" />
            <b>Mind <em>Loft</em></b>
          </a>
          <span className="cfr-lab">{label}</span>
        </div>
        <a className="cfr-cx cfr-t" href={withTq('/')}>Today</a>
        <a className="cfr-cx cfr-q" href={withTq('/quizzes')}>Quizzes</a>
        <button
          type="button"
          className={`cfr-cx cfr-tg${hint ? ' hint' : ''}`}
          onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}
          aria-label={theme === 'light' ? 'Switch to dark' : 'Switch to light'}
          title={theme === 'light' ? 'Switch to dark' : 'Switch to light'}
        >
          {theme === 'light' ? (
            <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor"
              strokeWidth="2.2" strokeLinecap="round" aria-hidden="true">
              <path d="M20 14.5A8 8 0 1 1 9.5 4a6.5 6.5 0 0 0 10.5 10.5Z" />
            </svg>
          ) : (
            <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor"
              strokeWidth="2.2" strokeLinecap="round" aria-hidden="true">
              <circle cx="12" cy="12" r="4" />
              <path d="M12 3v2M12 19v2M3 12h2M19 12h2M5.6 5.6l1.4 1.4M17 17l1.4 1.4M18.4 5.6L17 7M7 17l-1.4 1.4" />
            </svg>
          )}
          {intro ? <span className="stg-tlab">{intro === 'light' ? 'Light mode' : 'Dark mode'}</span> : null}
        </button>
        {/* THE EXPLICIT POINTER at the switch above, first visit only. It is
            the cap's LAST CHILD on purpose: it reads its own parent to find
            the glyph and measure itself against it. */}
        <ThemePop />
      </div>

      {/* The hairline reads the same as it does on the home: how much of this
          page's run is behind you. Drawn at zero as an empty track rather than
          hidden, so the cap does not change height when the fetch lands. */}
      <div className="cfr-prog">
        <span style={{ width: `${Math.max(0, Math.min(1, progress || 0)) * 100}%` }} />
      </div>

      <div className="cfr-wrap">{children}</div>

      <StageFooter />
    </div>
  );
}

// NOTE: this block is a JS template literal, so no backticks in the comments.
const CSS = `
.cfr{min-height:100vh;background:var(--stg-ground);color:var(--stg-ink);
  font-family:${SANS};-webkit-font-smoothing:antialiased;}
.cfr *{box-sizing:border-box;}

.cfr-cap{display:flex;align-items:center;gap:18px;padding:11px 22px;position:relative;
  border-bottom:1px solid var(--stg-line);}
.cfr-id{display:flex;align-items:baseline;gap:11px;min-width:0;margin-right:auto;}
/* The mark and the words are ONE object so they centre on each other; the
   label still hangs off the NAME's baseline, which is what .cfr-id keeps its
   baseline alignment for. */
.cfr-brand{display:flex;align-items:center;gap:8px;min-width:0;text-decoration:none;
  color:var(--stg-ink);}
.cfr-id b{font-size:16px;font-weight:800;letter-spacing:-0.01em;white-space:nowrap;}
.cfr-id b em{font-style:normal;color:var(--stg-brand,#7dd3fc);}
.cfr-lab{font-family:${MONO};font-size:10.5px;letter-spacing:.11em;text-transform:uppercase;
  color:var(--stg-mute);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}
.cfr-cx{flex:none;font-family:${MONO};font-size:10px;letter-spacing:.11em;text-transform:uppercase;
  color:var(--stg-ink2);text-decoration:none;border:1px solid var(--stg-line);
  border-radius:7px;padding:6px 10px;}
.cfr-cx:hover{border-color:var(--stg-line2);color:var(--stg-ink);}
.cfr-cx:focus-visible{outline:2px solid var(--stg-acc);outline-offset:2px;}
/* RELATIVE, because globals.css hangs .stg-tlab (the register's name during the
   flip) off the switch absolutely and names only the two caps that existed when
   it was written. Declared here rather than added to that selector list so this
   frame carries everything it needs. */
.cfr-tg{position:relative;display:inline-flex;align-items:center;justify-content:center;
  padding:6px 9px;background:none;cursor:pointer;font:inherit;}
.cfr-tg.hint{border-color:var(--stg-acc);color:var(--stg-acc-ink);animation:stg-hintring 1.9s ease-out 3;}
/* THE FIRST-VISIT POINTER at the light switch, the same ring both caps draw.
   The keyframes are per stylesheet because each cap ships its own sheet; the
   name is shared, so a browser that has already seen it on another surface
   simply never gets the class. */
@keyframes stg-hintring{
  0%{box-shadow:0 0 0 0 var(--stg-acc);}
  70%{box-shadow:0 0 0 10px transparent;}
  100%{box-shadow:0 0 0 0 transparent;}
}
@media (prefers-reduced-motion:reduce){.cfr-tg.hint{animation:none !important;}}
.cfr-prog{height:2px;background:var(--stg-surf2);}
.cfr-prog span{display:block;height:100%;background:var(--stg-ink2);transition:width .4s ease;}

/* The circuit pages are a COLUMN of prose and cards, not a board of tiles, so
   unlike the home they keep a reading measure rather than filling the window. */
.cfr-wrap{max-width:1000px;margin:0 auto;padding:26px 22px 72px;}

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
