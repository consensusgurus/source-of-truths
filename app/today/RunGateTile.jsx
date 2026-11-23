// THE RUN TILE: A WHITE CARD WITH THE RUN'S OWN DRAWING (owner, 2026-11-16,
// mockup B2 plus the emblems; it replaces the 2026-11-08 "gate-lite" tile that
// wore the category as its ground). Top to bottom: the name and the bold
// headline with the run's drawing top right, a full-width start button in the
// category colour that reads "Start", then the legs as one striped band in
// their ladder colours, joined to the crowd strip (leader, plays) along the
// foot. The whole tile is the link.
//
// The headline repeats each gate's own words. A NEW RUN ADDS ITS LINE TO
// GATE_TEXT here when its gate gets a headline of its own (without one it
// reads as a quiz gauntlet, "Five Quizzes. One Life in Each."), AND ITS
// DRAWING TO EMBLEM below.

import { useEffect, useState } from 'react';
import { categoryColor, softGround } from '@/lib/category-ramp';
import { getMyDayItems, editionNow } from '@/lib/daily-run';
import { validItem, itemDone, itemName } from '../my-day/dayRuns';
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
  duediligence: ['business puzzles', (n) => `${n} Checks. One Deal.`, 'Fewer clues decide your rank.'],
  eagleeye: ['visual puzzles', (n) => `${n} Looks. One Sharp Eye.`, 'Speed and accuracy decide your rank.'],
  oddjobs: ['chores', (n) => `${n} Jobs. No Second Pass.`, 'Fewest replays decide your rank, then the clock.'],
};

// A leg chip's short form, where the full name will not fit the strip
// (owner, 2026-11-10: the seven-leg Trivia Gauntlet strip overflowed, "can
// maybe shorten History to Hist.").
const LEG_SHORT = { history: 'Hist.' };

// EACH RUN HAS ITS OWN DRAWING (owner, 2026-11-16: "i also like the emblems in
// top right"). A 48-unit line drawing in the tile's top right corner, inked
// in the text colour, filled with the run's category colour (.f1) and the
// card's own white (.f2). A NEW RUN ADDS ITS DRAWING HERE; without one it gets
// the flag, which is also what a custom (Build a Run) run wears.
const EMBLEM = {
  gauntlet: <><rect className="f1" x="8" y="31" width="32" height="8" rx="1.5" /><rect className="f2" x="11" y="22" width="27" height="8" rx="1.5" /><rect className="f1" x="7" y="13" width="30" height="8" rx="1.5" /><path d="M13 35h8M16 26h6M12 17h7" /></>,
  triviafinale: <><path className="f2" d="M10 38h28v4H10z" /><path className="f1" d="M24 6l5 10 11 1.6-8 7.8 1.9 11L24 31.2 14.1 36.4 16 25.4l-8-7.8 11-1.6z" /></>,
  triviaencore: <><path className="f2" d="M24 14C19 10 11 10 6 12v24c5-2 13-2 18 2 5-4 13-4 18-2V12c-5-2-13-2-18 2z" /><path className="f1" d="M24 14c5-4 13-4 18-2v24c-5-2-13-2-18 2z" /><path d="M24 14v24M11 18c3-.6 6-.3 9 1M11 24c3-.6 6-.3 9 1" /></>,
  oddjobs: <><path className="f2" d="M8 22L24 9l16 13v17H8z" /><rect className="f1" x="20" y="28" width="8" height="11" /><path d="M33 6l-7 14" /><path className="f1" d="M23 20h6l1 4h-8z" /></>,
  science: <><path className="f2" d="M20 7v12L10 37.5a3 3 0 0 0 2.6 4.5h22.8a3 3 0 0 0 2.6-4.5L28 19V7z" /><path className="f1" d="M15.4 28h17.2l5.4 9.5a3 3 0 0 1-2.6 4.5H12.6a3 3 0 0 1-2.6-4.5z" /><path d="M17.5 7h13" /><circle className="f2" cx="21" cy="35" r="1.8" /><circle className="f2" cx="27.5" cy="32.5" r="1.2" /></>,
  math: <><rect className="f2" x="12" y="6" width="24" height="36" rx="3" /><rect className="f1" x="16" y="10" width="16" height="8" rx="1.5" /><circle className="f1" cx="18" cy="25" r="1.7" /><circle className="f1" cx="24" cy="25" r="1.7" /><circle className="f1" cx="30" cy="25" r="1.7" /><circle className="f1" cx="18" cy="31" r="1.7" /><circle className="f1" cx="24" cy="31" r="1.7" /><circle className="f1" cx="30" cy="31" r="1.7" /><circle className="f1" cx="18" cy="37" r="1.7" /><circle className="f1" cx="24" cy="37" r="1.7" /><circle className="f1" cx="30" cy="37" r="1.7" /></>,
  english: <><rect className="f1" x="10" y="7" width="28" height="34" rx="3" /><path d="M16 7v34" /><path d="M21 31l5-13 5 13M23 27h6" /></>,
  dojo: <><path className="f1" d="M21 28l-5 11 6 2 3-13zM27 28l5 11-6 2-3-13z" /><rect className="f1" x="5" y="19" width="38" height="8" rx="2" /><rect className="f2" x="20" y="17" width="8" height="12" rx="2" /></>,
  dojocolor: <><path className="f1" d="M21 28l-5 11 6 2 3-13zM27 28l5 11-6 2-3-13z" /><rect className="f1" x="5" y="19" width="38" height="8" rx="2" /><path className="f2" d="M10 19h4v8h-4zM34 19h4v8h-4z" /><rect className="f2" x="20" y="17" width="8" height="12" rx="2" /></>,
  deduction: <><path d="M24 11v28M15 39h18M10 14h28M10 14L5 26M10 14l5 12M38 14l-5 12M38 14l5 12" /><path className="f1" d="M5 26a5 5 0 0 0 10 0zM33 26a5 5 0 0 0 10 0z" /><circle className="f2" cx="24" cy="9" r="2.2" /></>,
  crossed: <><rect className="f2" x="9" y="9" width="30" height="30" rx="2" /><path className="f1" d="M9 11a2 2 0 0 1 2-2h8v10H9zM29 19h10v10H29zM19 29h10v10H19z" /><path d="M19 9v30M29 9v30M9 19h30M9 29h30" /></>,
  room: <><circle className="f1" cx="12" cy="21" r="4" /><circle className="f1" cx="36" cy="21" r="4" /><path className="f1" d="M4 37c0-5 3.5-8 8-8s8 3 8 8zM28 37c0-5 3.5-8 8-8s8 3 8 8z" /><circle className="f2" cx="24" cy="16" r="5" /><path className="f2" d="M13 40c0-7 4.5-11 11-11s11 4 11 11z" /></>,
  spacecadet: <><path className="f1" d="M16 25l-6 8v4l6-3zM32 25l6 8v4l-6-3zM20 33h8l-4 9z" /><path className="f2" d="M24 5c6 5 8 12 8 20v8H16v-8c0-8 2-15 8-20z" /><circle className="f1" cx="24" cy="18" r="3.5" /></>,
  duediligence: <><rect className="f2" x="8" y="6" width="24" height="32" rx="2" /><path d="M13 13h14M13 19h9" /><circle className="f1" cx="29" cy="29" r="8" /><path d="M35 35l7 7" /></>,
  eagleeye: <><path className="f2" d="M4 24c5-8 12-12 20-12s15 4 20 12c-5 8-12 12-20 12S9 32 4 24z" /><circle className="f1" cx="24" cy="24" r="7" /><circle className="f2" cx="24" cy="24" r="2.5" /></>,
  pricecheck: <><path className="f1" d="M8 10a2 2 0 0 1 2-2h14l18 18-16 16L8 24z" /><circle className="f2" cx="16" cy="16" r="3" /><path d="M23 29l6-6" /></>,
  passport: <><rect className="f1" x="11" y="6" width="26" height="36" rx="3" /><circle className="f2" cx="24" cy="21" r="7" /><path d="M17 21h14M24 14c-3 4-3 10 0 14M24 14c3 4 3 10 0 14M18 35h12" /></>,
  more: <><rect className="f2" x="15" y="8" width="24" height="30" rx="3" /><rect className="f1" x="11" y="12" width="24" height="30" rx="3" /><rect className="f2" x="7" y="16" width="24" height="26" rx="3" /><path d="M19 25v8M15 29h8" /></>,
  build: <><rect className="f1" x="7" y="25" width="15" height="15" rx="2" /><rect className="f2" x="26" y="25" width="15" height="15" rx="2" /><rect className="f2" x="16.5" y="6" width="15" height="15" rx="2" /><path d="M24 10v7M20.5 13.5h7" /></>,
  daily: <><rect className="f2" x="6" y="9" width="32" height="30" rx="2" /><path className="f1" d="M38 15h4v21a3 3 0 0 1-3 3h-1z" /><rect className="f1" x="11" y="14" width="22" height="6" /><path d="M11 25h9M11 30h9M11 35h9M24 25h9M24 30h9M24 35h6" /></>,
  flag: <><path className="f1" d="M12 8h24l-6 7 6 7H12z" /><path d="M12 42V7" /></>,
};
function RunEmblem({ id }) {
  return (
    <span className="rgt-em" aria-hidden="true">
      <svg width="34" height="34" viewBox="0 0 48 48">{EMBLEM[id] || EMBLEM.flag}</svg>
    </span>
  );
}
// A name past this many characters drops a size so it still fits beside the
// drawing ("Enter the Dojo: In Color").
const LONG_NAME = 17;
// A name just past the full size steps down a little instead (owner,
// 2026-11-19: "Science Gauntlet" read "Science Gauntl..." on the run shelf).
// Trivia Gauntlet, at 15, is the longest that fits at full size.
const MID_NAME = 15;

// THE WHITE CARD (owner, 2026-11-16, mockup B2 "with the emblems"): the tile is
// white like a puzzle card, the name and headline sit beside the run's drawing,
// the button reads just "Start" ("get rid of 'start with xxx'"), and the legs
// are a full-width band joined to the top of the leader bar ("the list
// attached to the bottom on top of the player leader bar"). The "Daily Run"
// eyebrow is gone. The category colour is the button, the foot and the drawing.
export default function RunGateTile({ c, href, cat, lead, plays, fin, rank, done, plain = false, className = '' }) {
  const [, head, , legNames] = GATE_TEXT[c.id] || ['quizzes', (x) => `${x} Quizzes. One Life in Each.`, QUIZ_RULE];
  const legs = legNames ? legNames.map((name, i) => ({ key: 'leg' + i, name })) : c.games;
  const n = legs.length;
  const W = WORD[n] || String(n);
  const hue = cat ? categoryColor(cat) : '#c7cdd6';
  // The quiz runs colour their lineup by today's spectrum (lib/circuits
  // daySpectrumSlots, set in the run page); every other run by plain order.
  const SPECTRUM_RUNS = ['gauntlet', 'triviaencore', 'triviafinale', 'english', 'science', 'math'];
  const slots = SPECTRUM_RUNS.includes(c.id) ? daySpectrumSlots(n, hue) : legs.map((_, i) => i);
  const go = fin ? 'See your results' : c.n ? 'Continue the run' : 'Start';
  return (
    <a className={'rgt' + (fin ? ' fin' : '') + (plain ? ' rgt-w' : '') + (className ? ' ' + className : '')} href={href}
      style={{ '--rgc': hue, '--rgg': softGround(hue) }} aria-label={`${c.name}: ${go}`}>
      <span className="rgt-body">
        <span className="rgt-hd">
          <span className="rgt-tx">
            <b className={'rgt-name' + (String(c.name).length > LONG_NAME ? ' long' : String(c.name).length > MID_NAME ? ' mid' : '')}>{c.name}</b>
            <span className="rgt-hl">{head(W)}</span>
          </span>
          <RunEmblem id={c.id} />
        </span>
        <span className="rgt-go">{go}</span>
      </span>
      {/* ONE ROW ALWAYS (owner, 2026-11-08): past five legs the names drop a size. */}
      <span className={'rgt-legs' + (legs.length > 5 ? ' many' : '')} aria-hidden="true">
        {legs.map((g, i) => (
          <span key={g.key} className={'rgt-leg' + (done && done.has(g.key) ? ' on' : '')} style={{ '--lc': softGround(rampFor(slots[i]), 0.45) }}>{LEG_SHORT[g.key] || g.name}</span>
        ))}
      </span>
      <span className="rgt-cs">
        <span className="ld">{fin && rank ? <>You: <b>#{rank}</b></> : lead ? <>#1 <b>{lead}</b></> : plays ? 'No finish yet' : 'Top spot open'}</span>
        <span className="ct pc">{Number(plays) > 0 ? Number(plays).toLocaleString('en-US') : '\u2013'}</span>
      </span>
    </a>
  );
}

// THE MORE RUNS TILE (owner, 2026-11-08: "we need a similarly pretty 'more
// runs' detail tile"). The same build as a run tile, in ink: the name, a line
// saying how many more there are, a full-width button that unfolds the rest as
// run tiles, and the three most played of the rest as the band, each with
// today's players. Build a Run sits in the foot strip. A div, so the Build a
// Run link inside it is a real link.
export function MoreRunsTile({ rest, open, onToggle, players, colorOf }) {
  const n = rest.length;
  const W = WORD[n] || String(n);
  return (
    <div className={'rgt rgt-more' + (open ? ' on' : '')} onClick={onToggle} role="group" aria-label="More runs">
      <span className="rgt-body">
        <span className="rgt-hd">
          <span className="rgt-tx">
            <b className="rgt-name">More Runs</b>
            <span className="rgt-hl">{W} More. Most Played Today:</span>
          </span>
          <RunEmblem id="more" />
        </span>
        <button type="button" className="rgt-go" aria-expanded={open} aria-controls="sty-runsu"
          onClick={(e) => { e.stopPropagation(); onToggle(); }}>{open ? 'Fold the runs' : `Show all ${n} runs`}</button>
      </span>
      <span className="rgt-legs rgt-legn">
        {rest.slice(0, 3).map((c) => (
          <span key={c.id} className="rgt-leg" style={{ '--lc': softGround(colorOf(c), 0.45) }}
            title={`${c.name}: ${Number(players(c) || 0).toLocaleString('en-US')} playing today`}>
            {String(c.name).replace(/ Gauntlet$/, '').replace(/^Enter the /, '')}
          </span>
        ))}
      </span>
      <a className="rgt-cs rgt-build" href="/build-a-run" onClick={(e) => e.stopPropagation()}>
        <span className="ld"><b>+ Build Your Day</b></span><span className="ct">Your puzzles, every day &rarr;</span>
      </a>
    </div>
  );
}

// MIND LOFT DAILY ON THE RUNS ROW (owner, 2026-11-21: "Instead of Build Your
// Run, the site replaces that with Build Your Day. Even up in 'runs' line").
// A run tile in shape, coloured by the reader's edition (Morning, Afternoon,
// Evening, Night). With a day saved it opens the paper and its band is the
// day's puzzles, ticked as they are read; without one it is the invite to
// Build Your Day. Read from this browser after mount, so the first paint is
// the invite in the default edition colour.
const DAY_LEGS = 6;
export function DailyTile({ className = '' }) {
  const [st, setSt] = useState(null);
  useEffect(() => {
    const read = () => {
      // The whole paper, run pages included (owner, 2026-11-23).
      const keys = getMyDayItems().filter(validItem);
      setSt({ keys, played: new Set(keys.filter((k) => itemDone(k))), ed: editionNow() });
    };
    read();
    const vis = () => { if (document.visibilityState === 'visible') read(); };
    document.addEventListener('visibilitychange', vis);
    return () => document.removeEventListener('visibilitychange', vis);
  }, []);
  const keys = st && st.keys.length >= 2 ? st.keys : null;
  const hue = st ? st.ed.colour : '#7dd3fc';
  const n = keys ? keys.length : 0;
  const doneN = keys ? keys.filter((k) => st.played.has(k)).length : 0;
  const go = !keys ? 'Build Your Day' : doneN === n ? 'See Your Results' : doneN ? 'Keep Going' : 'Start Your Day';
  const shown = keys ? keys.slice(0, n > DAY_LEGS ? DAY_LEGS - 1 : DAY_LEGS) : [];
  return (
    <a className={'rgt rgt-day' + (className ? ' ' + className : '')} href={keys ? '/my-day' : '/build-a-run'}
      style={{ '--rgc': hue, '--rgg': softGround(hue) }} aria-label={`Mind Loft Daily: ${go}`}>
      <span className="rgt-body">
        <span className="rgt-hd">
          <span className="rgt-tx">
            <b className="rgt-name">Mind Loft Daily</b>
            <span className="rgt-hl">{keys ? `${st.ed.name} \u00b7 ${doneN} of ${n} Done` : 'Your Puzzles. Every Day.'}</span>
          </span>
          <RunEmblem id="daily" />
        </span>
        <span className="rgt-go">{go}</span>
      </span>
      {keys ? (
        <span className={'rgt-legs' + (shown.length > 5 ? ' many' : '')} aria-hidden="true">
          {shown.map((k) => (
            <span key={k} className={'rgt-leg' + (st.played.has(k) ? ' on' : '')} style={{ '--lc': softGround(hue, 0.45) }}>{LEG_SHORT[k] || itemName(k)}</span>
          ))}
          {n > shown.length ? <span className="rgt-leg" style={{ '--lc': softGround(hue, 0.45) }}>+{n - shown.length}</span> : null}
        </span>
      ) : null}
      <span className="rgt-cs">
        <span className="ld">{keys ? <b>{n} Pages</b> : 'Pick your puzzles once'}</span>
        <span className="ct">{keys ? 'Edit any time' : 'Every day'}</span>
      </span>
    </a>
  );
}
// The old Build a Run tile's name, kept for the run end shelves: it is the
// Mind Loft Daily tile now.
export const BuildRunTile = DailyTile;

export const RGT_CSS = `
.rgt{display:flex;flex-direction:column;text-decoration:none;color:#0b1b2b;background:#fff;border:1px solid #0b1b2b;border-radius:12px;overflow:hidden;min-width:0;box-sizing:border-box;
  transition:transform .12s cubic-bezier(.2,.7,.3,1);}
/* The lift is for a mouse only: on a phone a tap left the tile raised a pixel,
   and inside the sideways row that pixel was clipped off its top edge. */
@media (hover:hover){ .rgt:hover{transform:translateY(-1px);} }
.rgt-body{display:flex;flex-direction:column;flex:1;padding:14px 14px 12px 16px;min-width:0;}
.rgt-body > *{flex-shrink:0;}
/* THE HEAD: name and headline on the left, the run's drawing top right
   (owner, 2026-11-16). Both text lines are one line each, so every tile in a
   row stacks the same heights and the buttons land level. */
.rgt-hd{display:flex;align-items:flex-start;gap:10px;min-width:0;}
.rgt-tx{flex:1 1 0;min-width:0;display:flex;flex-direction:column;}
.rgt-em{flex:none;width:46px;height:46px;box-sizing:border-box;display:flex;align-items:center;justify-content:center;border:1px solid #0b1b2b;border-radius:10px;background:var(--rgg);color:#0b1b2b;--e1:var(--rgc);--e2:#fff;}
.rgt-em svg{display:block;fill:none;stroke:currentColor;stroke-width:1.6;stroke-linejoin:round;stroke-linecap:round;}
.rgt-em .f1{fill:var(--e1);}
.rgt-em .f2{fill:var(--e2);}
.rgt-eye{font-size:10.5px;font-weight:800;letter-spacing:.08em;text-transform:uppercase;opacity:.72;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}
/* One line for every block above the legs, so tiles in a row stack the same
   heights and their legs and buttons land level (owner, 2026-11-08). */
/* The clip box is grown by .2em and the margin hands it back, so the g in
   Gauntlet and Judged keeps its tail and every line below stays level. */
.rgt-name{font-size:23px;font-weight:900;line-height:28px;letter-spacing:-.02em;margin:0 0 calc(1px - .2em);padding-bottom:.2em;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}
.rgt-name.mid{font-size:19.5px;}
.rgt-name.long{font-size:17.5px;}
.rgt-hl{font-size:13px;font-weight:600;color:#3b4757;line-height:1.3;padding-bottom:.2em;margin-bottom:calc(12px - .2em);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}
/* MORE RUNS' LINEUP CARRIES A NAME AND A COUNT PER BAND, so a band is as wide
   as its text (equal thirds cut "Due Diligence 124" short), and a tile too
   narrow for three shows the top two. The body is the container. */
.rgt-more{container-type:inline-size;}
.rgt-legn .rgt-leg{flex:1 1 auto;gap:3px;padding:0 5px;font-size:10.5px;}
.rgt-legn .rgt-leg i{flex:none;font-style:normal;font-weight:700;opacity:.75;}
@container (max-width:300px){ .rgt-legn .rgt-leg:nth-child(n+3){display:none;} }
.rgt-rule{font-size:12.5px;font-weight:600;line-height:1.35;margin-top:2px;margin-bottom:12px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}
/* THE BAND SITS ON THE LEADER BAR (owner, 2026-11-16): full width, joined
   to the foot, no box of its own. */
.rgt-legs{display:flex;flex:none;height:30px;border-top:1px solid #0b1b2b;overflow:hidden;}
.rgt-blank{border-color:transparent;}
.rgt-legs.many .rgt-leg{font-size:10px;padding:0 1px;letter-spacing:-.01em;}
.rgt-leg{flex:1 1 0;min-width:0;display:flex;align-items:center;justify-content:center;padding:0 3px;background:var(--lc);border-left:1px solid #0b1b2b;
  font-size:11.5px;font-weight:800;white-space:nowrap;overflow:hidden;text-overflow:clip;}
.rgt-leg:first-child{border-left:0;}
.rgt-leg.on{background:#0b1b2b;color:#fff;}
.rgt-go{display:block;box-sizing:border-box;margin:auto 0;padding:10px 8px;border:1px solid #0b1b2b;border-radius:10px;background:var(--rgc);text-align:center;font-weight:900;font-size:15px;
  white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}
.rgt.fin .rgt-go{background:transparent;}
/* The button centres in the space between the header and the legs (owner, 2026-11-16:
   "center these start buttons to fill the space"): margin:auto 0 inside the flex column. */
/* ONE STRENGTH FOR EVERY FOOT STRIP (owner, 2026-11-20, the home cleanup mockup):
   the run tile's foot is the same 60% mix a puzzle card's crowd strip uses, so the
   Start button is the only full-strength colour on the tile. Supersedes the
   2026-11-12 "matches the button color (darker)" foot. Dark keeps the full step. */
.rgt-cs{display:flex;justify-content:space-between;gap:8px;padding:7px 14px 7px 16px;border-top:1px solid #0b1b2b;background:color-mix(in srgb, var(--rgc) 60%, #fff);font-size:12.5px;font-weight:600;white-space:nowrap;}
.rgt-cs .ld{min-width:0;overflow:hidden;text-overflow:ellipsis;}
.rgt-cs b,.rgt-cs .ct{font-weight:800;}
/* PERSON ICON BY THE PLAY COUNT (owner, 2026-11-10): any tile count span
   carrying .pc. Global because RGT_CSS is part of the home stylesheet. */
.pc{display:inline-flex;align-items:center;gap:4px;}
.pc::before{content:'';width:11px;height:11px;flex:none;background:currentColor;-webkit-mask:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 16 16'%3E%3Ccircle cx='8' cy='4.6' r='3.1'/%3E%3Cpath d='M1.8 15.2c0-3.6 2.8-6 6.2-6s6.2 2.4 6.2 6z'/%3E%3C/svg%3E") center/contain no-repeat;mask:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 16 16'%3E%3Ccircle cx='8' cy='4.6' r='3.1'/%3E%3Cpath d='M1.8 15.2c0-3.6 2.8-6 6.2-6s6.2 2.4 6.2 6z'/%3E%3C/svg%3E") center/contain no-repeat;}
.stage-page:not([data-stage-theme=light]) .rgt{background:#1a2130;color:#e9edf4;border-color:color-mix(in srgb, var(--rgc) 60%, #fff);}
.stage-page:not([data-stage-theme=light]) .rgt :is(.rgt-legs,.rgt-leg,.rgt-go,.rgt-cs,.rgt-em){border-color:color-mix(in srgb, var(--rgc) 60%, #fff);}
/* On the dark card the band keeps its pastels with ink names (a pastel on
   near-black is what the dark register wants); a played leg goes hollow. */
.stage-page:not([data-stage-theme=light]) .rgt-leg{background:var(--lc);color:#0b1b2b;}
.stage-page:not([data-stage-theme=light]) .rgt-hl{color:#aab4c3;}
.stage-page:not([data-stage-theme=light]) .rgt-em{background:color-mix(in srgb, var(--rgc) 18%, #1a2130);color:#e9edf4;--e2:#1a2130;}
.stage-page:not([data-stage-theme=light]) .rgt-leg.on{background:#11161f;color:#e9edf4;}
.stage-page:not([data-stage-theme=light]) .rgt-go{color:#0b1b2b;}
.stage-page:not([data-stage-theme=light]) .rgt.fin .rgt-go{color:#e9edf4;}
.stage-page:not([data-stage-theme=light]) .rgt-cs{background:var(--rgc);color:#0b1b2b;}
html[data-stage-color=mono] .stage-page[data-stage-theme=light] .rgt{background:#fff;}
html[data-stage-color=mono] .stage-page[data-stage-theme=light] .rgt :is(.rgt-leg,.rgt-cs,.rgt-em){background:#fff;}
html[data-stage-color=mono] .stage-page[data-stage-theme=light] .rgt-em{--e1:#d5d9e0;}
html[data-stage-color=mono] .stage-page[data-stage-theme=light] .rgt-leg.on{background:#111;color:#fff;}
html[data-stage-color=mono] .stage-page[data-stage-theme=light] .rgt-go{background:#111;color:#fff;}
/* ON ITS OWN CATEGORY'S GROUND (owner, 2026-11-08: "the matching color
   background should go"): a run whose colour is the page's own goes white,
   like the puzzle cards, and keeps its button and legs in colour. */
.rgt.rgt-w{background:#fff;}
.stage-page:not([data-stage-theme=light]) .rgt.rgt-w{background:#1a2130;}
.rgt.rgt-more{--rgc:#0b1b2b;background:#fff;cursor:pointer;}
/* A QUIET SIBLING (owner, 2026-11-20): the same button shape as a run's Start,
   white with the ink outline, so the row keeps one skeleton. */
.rgt-more .rgt-go{background:#fff;color:#0b1b2b;font:inherit;font-weight:900;font-size:15px;cursor:pointer;width:100%;}
.rgt-more .rgt-cs{background:#eef1f6;text-decoration:none;color:inherit;}
.rgt-more .rgt-em{background:#eef1f6;--e1:#cfd7e3;}
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
.stage-page:not([data-stage-theme=light]) .rgt-more .rgt-go{background:transparent;color:#e9edf4;border-color:#5a6475;}
.stage-page:not([data-stage-theme=light]) .rgt-more .rgt-cs{background:#11161f;}
.stage-page:not([data-stage-theme=light]) .rgt-more .rgt-em{background:#11161f;--e1:#3a4558;}
.stage-page:not([data-stage-theme=light]) .rgt-more :is(.rgt-legs,.rgt-leg,.rgt-em){border-color:#5a6475;}
.stage-page:not([data-stage-theme=light]) .rgt-band{background:color-mix(in srgb, var(--lc) 30%, #1a2130);border-color:#5a6475;}
.stage-page:not([data-stage-theme=light]) .rgt-bands{border-color:#5a6475;}
/* THE PHONE: a sideways row of gate tiles in a pane, full cards in Runs. */
.mph-rgts{display:flex;gap:10px;overflow-x:auto;scroll-snap-type:x mandatory;scroll-padding-left:12px;margin:-2px -12px 0;padding:2px 12px 4px;scrollbar-width:none;}
.mph-rgts::-webkit-scrollbar{display:none;}
.mph-rgts > .rgt{flex:0 0 min(84%, 320px);scroll-snap-align:start;}
.mph-rgtcol{display:flex;flex-direction:column;gap:10px;}
`;
