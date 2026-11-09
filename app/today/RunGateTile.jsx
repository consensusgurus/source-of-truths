// THE RUN TILE IS ITS OWN START SCREEN, SMALL (owner, 2026-11-08: "create large
// tiles for the runs that mimic their entry screens", option B "gate-lite").
// In the Details view a run is drawn the way its gate draws it
// (GauntletGate in app/GauntletScreens.jsx): the run's category as the ground,
// the "Daily Run" eyebrow, the name large, the bold headline and the one-line
// rule, the legs as one striped bar in their ladder colours, and a full-width
// start button in the category colour. The crowd strip (leader, plays) sits
// along the foot as on every puzzle card. The whole tile is the link.
//
// The headline and rule repeat each gate's own words. A NEW RUN ADDS ITS LINE
// TO GATE_TEXT here when its gate gets a headline of its own; without one it
// reads as a quiz gauntlet ("Five Quizzes. One Life in Each.").

import { categoryColor, softGround } from '@/lib/category-ramp';
import { rampFor, daySpectrumSlots } from '@/lib/circuits';

const WORD = ['Zero', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten', 'Eleven', 'Twelve'];
// One line each (owner, 2026-11-08: "make the long description one row by
// making it more concise"); the gates keep their full sentences.
const QUIZ_RULE = 'One wrong answer ends each quiz.';
// [eyebrow unit, headline(n), rule]
export const GATE_TEXT = {
  math: ['games', (n) => `${n} Games. One Life in Each.`, 'One wrong answer ends each game.'],
  pricecheck: ['prices', (n) => `${n} Prices. Three Guesses Each.`, 'The first guess counts most.'],
  // Passport is one registry game played as four legs; its tile shows the legs.
  passport: ['legs', () => 'One Trip. One Passport.', 'Each leg sets up the next.', ['Ping', 'Span', 'Flank', 'Stamps']],
  deduction: ['cases', (n) => `${n} Cases. One Letter.`, 'Half for right, half for fast.'],
  dojo: ['sudokus', (n) => `${n} Forms. One Belt.`, 'Half for solving, half for speed.'],
  dojocolor: ['color sudokus', (n) => `${n} Forms. One Belt.`, 'Half for solving, half for speed.'],
  crossed: ['crosswords', (n) => `${n} Grids. One Week.`, 'Speed counts most.'],
  room: ['crowd games', (n) => `${n} Rooms. No Answer Key.`, 'Tonight’s crowd is the key.'],
  spacecadet: ['spatial puzzles', (n) => `${n} Legs. One Launch.`, 'One clock decides your rank.'],
};

export default function RunGateTile({ c, href, cat, lead, plays, fin, rank, done, plain = false, className = '' }) {
  const [unit, head, rule, legNames] = GATE_TEXT[c.id] || ['quizzes', (x) => `${x} Quizzes. One Life in Each.`, QUIZ_RULE];
  const legs = legNames ? legNames.map((name, i) => ({ key: 'leg' + i, name })) : c.games;
  const n = legs.length;
  const W = WORD[n] || String(n);
  const hue = cat ? categoryColor(cat) : '#c7cdd6';
  const first = legs[0];
  // The quiz runs colour their lineup by today's spectrum (lib/circuits
  // daySpectrumSlots, set in the run page); every other run by plain order.
  const SPECTRUM_RUNS = ['gauntlet', 'triviaencore', 'english', 'science', 'math'];
  const slots = SPECTRUM_RUNS.includes(c.id) ? daySpectrumSlots(n, hue) : legs.map((_, i) => i);
  const go = fin ? 'See your results' : c.n ? 'Continue the run' : `Start with ${first ? first.name : 'the run'}`;
  return (
    <a className={'rgt' + (fin ? ' fin' : '') + (plain ? ' rgt-w' : '') + (className ? ' ' + className : '')} href={href}
      style={{ '--rgc': hue, '--rgg': softGround(hue) }} aria-label={`${c.name}: ${go}`}>
      <span className="rgt-body">
        <span className="rgt-eye">Daily Run · {W} {unit}</span>
        <b className="rgt-name">{c.name}</b>
        <span className="rgt-hl">{head(W)}</span>
        <span className="rgt-rule">{rule}</span>
        {/* ONE ROW ALWAYS (owner, 2026-11-08: "go back to single line with text
            smaller"): past five legs the names drop a size. */}
        <span className={'rgt-legs' + (legs.length > 5 ? ' many' : '')} aria-hidden="true">
          {legs.map((g, i) => (
            <span key={g.key} className={'rgt-leg' + (done && done.has(g.key) ? ' on' : '')} style={{ '--lc': softGround(rampFor(slots[i]), 0.45) }}>{g.name}</span>
          ))}
        </span>
        <span className="rgt-go">{go}</span>
      </span>
      <span className="rgt-cs">
        <span className="ld">{fin && rank ? <>You: <b>#{rank}</b></> : lead ? <>#1 <b>{lead}</b></> : plays ? 'No finish yet' : 'Open. Be first.'}</span>
        <span className="ct">{Number(plays || 0).toLocaleString('en-US')} playing</span>
      </span>
    </a>
  );
}

// THE MORE RUNS TILE IN DETAILS (owner, 2026-11-08: "we need a similarly
// pretty 'more runs' detail tile"). The same build as a run tile, in ink: an
// eyebrow, the name large, a line saying how many more there are, the next
// three as a lineup of bands in their own colours with today's players, and
// a full-width button that unfolds the rest as run tiles. Build a Run sits in
// the foot strip. A div, so the Build a Run link inside it is a real link.
export function MoreRunsTile({ rest, open, onToggle, players, colorOf }) {
  const n = rest.length;
  const W = WORD[n] || String(n);
  return (
    <div className={'rgt rgt-more' + (open ? ' on' : '')} onClick={onToggle} role="group" aria-label="More runs">
      <span className="rgt-body">
        <span className="rgt-eye">Daily Runs · {W} more</span>
        <b className="rgt-name">More Runs</b>
        <span className="rgt-bands">
          {rest.slice(0, 3).map((c) => (
            <span key={c.id} className="rgt-band" style={{ '--lc': softGround(colorOf(c), 0.45) }}>
              <b>{c.name}</b><i title="Players today"><svg viewBox="0 0 24 24" width="11" height="11" fill="currentColor" aria-hidden="true"><circle cx="12" cy="7.5" r="4" /><path d="M4 21a8 7 0 0 1 16 0z" /></svg>{Number(players(c) || 0).toLocaleString('en-US')}</i>
            </span>
          ))}
        </span>
        <button type="button" className="rgt-go" aria-expanded={open} aria-controls="sty-runsu"
          onClick={(e) => { e.stopPropagation(); onToggle(); }}>{open ? 'Fold the runs' : `Show all ${n} runs`}</button>
      </span>
      <a className="rgt-cs rgt-build" href="/build-a-run" onClick={(e) => e.stopPropagation()}>
        <span className="ld"><b>+ Build a Run</b></span><span className="ct">One link to share &rarr;</span>
      </a>
    </div>
  );
}

// BUILD A RUN, closing the unfolded runs in the same shape.
export function BuildRunTile() {
  return (
    <a className="rgt rgt-more" href="/build-a-run">
      <span className="rgt-body">
        <span className="rgt-eye">Your Run · Any puzzles</span>
        <b className="rgt-name">Build a Run</b>
        <span className="rgt-hl">Your Puzzles. One Link.</span>
        <span className="rgt-rule">Pick dailies, share one link.</span>
        <span className="rgt-legs rgt-blank" aria-hidden="true" />
        <span className="rgt-go">Build a Run</span>
      </span>
      <span className="rgt-cs"><span className="ld">Shared with friends</span><span className="ct">One board</span></span>
    </a>
  );
}

export const RGT_CSS = `
.rgt{display:flex;flex-direction:column;text-decoration:none;color:#0b1b2b;background:var(--rgg);border:1px solid #0b1b2b;border-radius:12px;overflow:hidden;min-width:0;box-sizing:border-box;
  transition:transform .12s cubic-bezier(.2,.7,.3,1);}
/* The lift is for a mouse only: on a phone a tap left the tile raised a pixel,
   and inside the sideways row that pixel was clipped off its top edge. */
@media (hover:hover){ .rgt:hover{transform:translateY(-1px);} }
.rgt-body{display:flex;flex-direction:column;flex:1;padding:14px 14px 12px 16px;min-width:0;}
.rgt-body > *{flex-shrink:0;}
.rgt-eye{font-size:10.5px;font-weight:800;letter-spacing:.08em;text-transform:uppercase;opacity:.72;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}
/* One line for every block above the legs, so tiles in a row stack the same
   heights and their legs and buttons land level (owner, 2026-11-08). */
/* The clip box is grown by .2em and the margin hands it back, so the g in
   Gauntlet and Judged keeps its tail and every line below stays level. */
.rgt-name{font-size:26px;font-weight:900;line-height:1.1;letter-spacing:-.02em;margin:4px 0 calc(4px - .2em);padding-bottom:.2em;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}
.rgt-hl{font-size:14px;font-weight:800;line-height:1.25;padding-bottom:.2em;margin-bottom:-.2em;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}
.rgt-rule{font-size:12.5px;font-weight:600;line-height:1.35;margin-top:2px;margin-bottom:12px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}
.rgt-legs{display:flex;height:28px;border:1px solid #0b1b2b;border-radius:8px;overflow:hidden;}
.rgt-blank{border-color:transparent;}
.rgt-legs.many .rgt-leg{font-size:9.5px;padding:0 1px;letter-spacing:-.01em;}
.rgt-leg{flex:1 1 0;min-width:0;display:flex;align-items:center;justify-content:center;padding:0 3px;background:var(--lc);border-left:1px solid #0b1b2b;
  font-size:11px;font-weight:800;white-space:nowrap;overflow:hidden;text-overflow:clip;}
.rgt-leg:first-child{border-left:0;}
.rgt-leg.on{background:#0b1b2b;color:#fff;}
.rgt-go{display:block;margin-top:10px;padding:10px 8px;border:1px solid #0b1b2b;border-radius:10px;background:var(--rgc);text-align:center;font-weight:900;font-size:15px;
  white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}
.rgt.fin .rgt-go{background:transparent;}
.rgt-cs{display:flex;justify-content:space-between;gap:8px;padding:7px 14px 7px 16px;border-top:1px solid #0b1b2b;background:color-mix(in srgb, var(--rgc) 60%, #fff);font-size:12.5px;font-weight:600;white-space:nowrap;}
.rgt-cs .ld{min-width:0;overflow:hidden;text-overflow:ellipsis;}
.rgt-cs b,.rgt-cs .ct{font-weight:800;}
.stage-page:not([data-stage-theme=light]) .rgt{background:color-mix(in srgb, var(--rgc) 18%, #1a2130);color:#e9edf4;border-color:color-mix(in srgb, var(--rgc) 60%, #fff);}
.stage-page:not([data-stage-theme=light]) .rgt :is(.rgt-legs,.rgt-leg,.rgt-go,.rgt-cs){border-color:color-mix(in srgb, var(--rgc) 60%, #fff);}
.stage-page:not([data-stage-theme=light]) .rgt-leg{background:color-mix(in srgb, var(--lc) 30%, #1a2130);}
.stage-page:not([data-stage-theme=light]) .rgt-leg.on{background:var(--rgc);color:#0b1b2b;}
.stage-page:not([data-stage-theme=light]) .rgt-go{color:#0b1b2b;}
.stage-page:not([data-stage-theme=light]) .rgt.fin .rgt-go{color:#e9edf4;}
.stage-page:not([data-stage-theme=light]) .rgt-cs{background:color-mix(in srgb, var(--rgc) 30%, #1a2130);}
html[data-stage-color=mono] .stage-page[data-stage-theme=light] .rgt{background:#fff;}
html[data-stage-color=mono] .stage-page[data-stage-theme=light] .rgt :is(.rgt-leg,.rgt-cs){background:#fff;}
html[data-stage-color=mono] .stage-page[data-stage-theme=light] .rgt-go{background:#111;color:#fff;}
/* ON ITS OWN CATEGORY'S GROUND (owner, 2026-11-08: "the matching color
   background should go"): a run whose colour is the page's own goes white,
   like the puzzle cards, and keeps its button and legs in colour. */
.rgt.rgt-w{background:#fff;}
.rgt.rgt-w .rgt-cs{background:color-mix(in srgb, var(--rgc) 30%, #fff);}
.stage-page:not([data-stage-theme=light]) .rgt.rgt-w{background:#1a2130;}
.rgt.rgt-more{--rgc:#0b1b2b;background:#fff;cursor:pointer;}
.rgt-more .rgt-go{background:#0b1b2b;color:#fff;font:inherit;font-weight:900;font-size:15px;cursor:pointer;width:100%;}
.rgt-more .rgt-cs{background:#eef1f6;text-decoration:none;color:inherit;}
/* The list takes the room the headline and rule take on a run tile and sits
   on the foot, so the More Runs button lands level with the start buttons. */
.rgt-more .rgt-bands{margin-top:auto;}
.rgt-bands{display:flex;flex-direction:column;border:1px solid #0b1b2b;border-radius:8px;overflow:hidden;}
.rgt-band{display:flex;align-items:center;justify-content:space-between;gap:8px;height:22px;box-sizing:border-box;padding:0 10px;background:var(--lc);border-top:1px solid #0b1b2b;font-size:12px;}
.rgt-band:first-child{border-top:0;}
.rgt-band b{font-weight:800;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}
.rgt-band i{font-style:normal;font-weight:800;display:inline-flex;align-items:center;gap:4px;flex:none;}
.rgt-band i svg{opacity:.7;}
.stage-page:not([data-stage-theme=light]) .rgt.rgt-more{background:#1a2130;--rgc:#e9edf4;border-color:#5a6475;}
.stage-page:not([data-stage-theme=light]) .rgt-more .rgt-go{background:#e9edf4;color:#0b1b2b;}
.stage-page:not([data-stage-theme=light]) .rgt-more .rgt-cs{background:#11161f;}
.stage-page:not([data-stage-theme=light]) .rgt-band{background:color-mix(in srgb, var(--lc) 30%, #1a2130);border-color:#5a6475;}
.stage-page:not([data-stage-theme=light]) .rgt-bands{border-color:#5a6475;}
/* THE PHONE: a sideways row of gate tiles in a pane, full cards in Runs. */
.mph-rgts{display:flex;gap:10px;overflow-x:auto;scroll-snap-type:x mandatory;scroll-padding-left:12px;margin:-2px -12px 0;padding:2px 12px 4px;scrollbar-width:none;}
.mph-rgts::-webkit-scrollbar{display:none;}
.mph-rgts > .rgt{flex:0 0 min(84%, 320px);scroll-snap-align:start;}
.mph-rgtcol{display:flex;flex-direction:column;gap:10px;}
`;
