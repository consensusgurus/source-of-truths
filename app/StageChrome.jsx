'use client';

// THE STAGE, generalised off the Gauntlet run (/circuits/gauntlet/run).
//
// A daily is a SITTING, not a page you browse to, and the run proved what that
// means in practice: no site cap above, no footer below, one line of chrome,
// and the board on the ground rather than on a white card floating over a navy
// page. This component is that one line, plus the two things that hang off it.
//
// WHAT IT RENDERS, top to bottom:
//   1. THE CAP, which reads left to right as where you are: the MIND LOFT
//      brand, then the category and date, then the game. The brand is also the
//      way out, and the only one. A Home glyph used to sit at the far right and
//      it is gone: it and a wordmark are two controls doing one job, and the
//      glyph was the weaker, since it said "home" without saying whose. The
//      right of the line keeps the Rankings chip, which takes a PODIUM mark
//      rather than a second house, and the light switch.
//   2. THE PROGRESS HAIRLINE, in the game's own category colour.
//   3. THE STRIP. One line carrying the two facts a player wants without
//      asking, what the best run today is and where they sit, and it is itself
//      the button for the panel.
//   4. THE PANEL, which EXPANDS IN FLOW. An overlay needs a scrim, a z-index, a
//      clipping parent and a focus trap to be honest, and all a reader asked
//      for was to see the board. Nothing is ever hidden behind it.
//
// TWO RULES THE CALLER OWNS:
//
//   * THE STRIP COMES DOWN while the player is working. A live figure about
//     other people is the one thing that should not sit over a clock, or over
//     a keyboard on a phone. Pass stripOn={false} then. It also draws nothing
//     at all without a leader, which is the honest rendering of a quiet day
//     rather than a gap to apologise for.
//   * ONE COLOUR. The stage is near-black plus this game's category step and
//     nothing else. That includes the primary button: see ctaFor in
//     lib/category-ramp.js for why the brand blue does not belong here.
import React, { useEffect, useRef, useState } from 'react';
import MindLoftMark from './MindLoftMark';
import { useStageTheme, useThemeQs, useThemeHint, useThemeIntro } from '@/lib/stage-theme';
import ThemePop from './ThemePop';
// The stage swaps LoftCap out, and LoftCap was carrying the whole .loft-*
// sheet that LoftFinish depends on, so the end card rendered unstyled.
import { LoftSheet } from './LoftCap';
import DailyBoardPanel from './quiz/[id]/DailyBoardPanel';
import { dailyMeIdentity } from './dailyMeClient';
import { gameColor, gameCategory, RAMP_INK, STAGE_GROUND } from '@/lib/category-ramp';
import { gameStatsShort } from '@/lib/daily-row-stats';
import { categoryHrefForGame } from '@/lib/puzzle-categories';
import { glyphFor, GLYPH_BOX } from '@/lib/game-glyphs';
import RollNum from './RollNum';

// A FIGURE THAT IS A PLAIN COUNT ROLLS; anything else swaps (motion pass,
// 2026-09-16). "3", "+62", "#37" and "3/5" roll digit by digit through
// RollNum; a clock ("1:24") changes every second and rolling it would read as
// a slot machine, and a verdict ("Solved") is a word. The test is the string.
const ROLLS = /^[+#-]?\d{1,5}(\/\d{1,5})?$/;
function figure(v) {
  const s = v === null || v === undefined ? '' : String(v);
  return ROLLS.test(s) ? <RollNum value={s} /> : v;
}

// THE DATE COMES DOWN TO SIZE ON A PHONE (owner, 2026-08-31). "August 31, 2026"
// is 130px of a 390px line, and the year is the least of what it says: the
// board is today's unless the player went to the archive, in which case the
// month and day carry that on their own.
//
// It shortens ONLY a real date. dateLabel is not always one: several clients
// pass a verdict through it once the game is over ("Solved", "Partly solved",
// "Not solved"), and a verdict must never be truncated. Anything that does not
// match Month D, YYYY comes back null and renders whole at every width.
const MON = /^([A-Z][a-z]{2})[a-z]*\s+(\d{1,2}),\s*\d{4}$/;
function shortDate(s) {
  const m = MON.exec(String(s || '').trim());
  return m ? m[1] + ' ' + m[2] : null;
}

const ORD = ['th', 'st', 'nd', 'rd'];
function ord(n) {
  const v = Number(n) || 0;
  const s = v % 100;
  return v + (ORD[(s - 20) % 10] || ORD[s] || ORD[0]);
}

// ONE REQUEST, no retry ladder. useDailyBoard exists for the END CARD, where
// the read races the player's own result write and has to keep asking until
// their row lands. Nothing races here: the strip is up before a player has
// finished anything, so a second attempt could only return the same board.
function useStripBoard(quizId, on) {
  const [b, setB] = useState(null);
  const asked = useRef(null);
  useEffect(() => {
    if (!on || !quizId || asked.current === quizId) return undefined;
    asked.current = quizId;
    let alive = true;
    const { anonId, email } = dailyMeIdentity();
    const q = new URLSearchParams({ quizId });
    if (anonId) q.set('anonId', anonId);
    if (email) q.set('email', email);
    if (anonId || email) q.set('placeOn', 'registered:first');
    fetch('/api/quiz/board?' + q.toString())
      .then((r) => r.json())
      .then((d) => {
        if (!alive || !d) return;
        const lb = d.leaderboards || {};
        const rows = [lb['registered:first'], d.leaderboard].find((a) => Array.isArray(a)) || [];
        setB({
          rows,
          leader: rows[0] || null,
          field: (d.me && d.me.field) || d.plays || rows.length,
          myRank: d.me && d.me.placement != null ? d.me.placement : null,
        });
      })
      .catch(() => {});
    return () => { alive = false; };
  }, [quizId, on]);
  return b;
}

// HAVE THEY STARTED THIS ONE? Read off the client's own save rather than a
// prop, so no game has to be edited to gain the state.
//
// The key is sot_<gameKey>_<num>, optionally carrying a revision suffix (Crux,
// Emcee and Encore bump one when a live puzzle is corrected), so it is matched
// with a bounded pattern rather than a prefix: a bare startsWith would let
// puzzle 1 read puzzle 10's save and call a fresh board in progress.
//
// FIRST PAINT SAYS NO. The server cannot read localStorage, so resolving this
// during render makes the client's first paint disagree with the server's and
// React throws. It arrives in an effect, as the theme and every other storage
// read on this site does.
//
// Polled rather than pushed: the write happens inside the game and the chip is
// a different component, so the alternative is an event contract in all 80. Two
// seconds is well under the time it takes to notice, and it costs one
// localStorage read on a page that is already re-rendering a clock.
function useStarted(gameKey, num) {
  const [on, setOn] = useState(false);
  useEffect(() => {
    if (!gameKey || num === null || num === undefined) return undefined;
    const re = new RegExp('^sot_' + gameKey + '_' + num + '(r[0-9]+)?$');
    const read = () => {
      try {
        for (let i = 0; i < window.localStorage.length; i++) {
          const k = window.localStorage.key(i);
          if (!k || !re.test(k)) continue;
          const sv = JSON.parse(window.localStorage.getItem(k) || 'null');
          // t0 says they began; a terminal status says they have finished, and
          // a finished board is a result rather than something in progress.
          if (sv && sv.t0 && (!sv.status || sv.status === 'playing')) return true;
        }
      } catch (e) {}
      return false;
    };
    setOn(read());
    const id = setInterval(() => setOn(read()), 2000);
    return () => clearInterval(id);
  }, [gameKey, num]);
  return on;
}

export default function StageChrome({
  gameKey,
  num = null,
  name,
  cat = null,
  dateLabel = null,
  sunday = null,
  figures = [],
  progress = 0,
  quizId = null,
  scoreWord = 'points',
  stripOn = true,
  boardOn = true,
  homeHref = '/',
  // WHAT THE RANKINGS CHIP OPENS, when it is not a daily's board.
  //
  // The panel's whole job is "show me the standings without taking the board
  // away", and on a daily the standings are DailyBoardPanel. A QUIZ has no
  // registry row, no archive and no day: handed a null gameKey that component
  // renders "null Archive" and asks the daily API a question about a game that
  // does not exist. It also already has standings of its own, on the page the
  // reader came from, and rebuilding those here would be two leaderboards that
  // can disagree about the same quiz.
  //
  // So the caller may hand in the body. Null keeps the daily behaviour exactly,
  // which is why none of the eighty call sites moved.
  panelBody = null,
}) {
  const [panel, setPanel] = useState(false);
  const started = useStarted(gameKey, num);
  // The switch reads the SAME store the page root reads, so the glyph and the
  // ground can never disagree about which register is showing.
  const [theme, setTheme] = useStageTheme();
  // A ?theme= review override travels back to the home too, or the trip out
  // and the trip back disagree about the register.
  const tq = useThemeQs();
  const hint = useThemeHint();  // one pointer at the light switch, first visit only
  const intro = useThemeIntro();  // and, once per browser, the switch played for them
  // Kept for callers that need the literal; the CAP reads var(--stg-acc),
  // which the client's root publishes in both registers.
  // A caller with no registry row (a quiz) has no category step to look up, and
  // does not need one: the ACCENT IS PUBLISHED BY THE ROOT as --stg-acc-dk /
  // --stg-acc-lt and read here as var(--stg-acc), which is the whole reason
  // this component stopped declaring it. Two publishers that can disagree is
  // how the --stg-ink name collision took the cap out.
  const colour = gameKey ? gameColor(gameKey) : null;
  // THE REGISTRY WINS, and the `cat` prop is only a fallback for a surface the
  // roster does not know (2026-09-01). It was the other way round, and a prop
  // that outranks the source of truth is a copy of the truth in eighty files:
  // when Sudoku split out of Numbers, all nine grids kept announcing "Numbers"
  // in their own eyebrow while the stage around them was already painted with
  // the Sudoku step, because gameColor(gameKey) had always read the registry
  // and only this line did not. The same drift was ALREADY live and unnoticed
  // on Carve, which passed cat="Logic" against a registry that has it under
  // Numbers. Both are fixed by this line rather than by editing the props, and
  // scripts/verify-category-ramp.mjs now fails any prop that disagrees.
  const category = gameCategory(gameKey) || cat || '';
  const board = useStripBoard(quizId, boardOn);
  const dateShort = shortDate(dateLabel);

  // TWO THINGS PUBLISHED ON <html> FOR THE PAGE BELOW (motion pass, 2026-09-16):
  //   - data-sty-anim, the same visibility gate the home arms, so a stage
  //     page's entrance animations (the gate glyph, a client's deal-in) run
  //     only when the document was visible at mount and a background tab never
  //     holds one at its FROM state. Not re-armed on visibilitychange, for the
  //     reason the home gives.
  //   - --stg-glyph, this game's stroke glyph as an SVG mask, which
  //     app/globals.css paints large and faint on the start gate in the
  //     category accent. Published from here rather than by each of the eighty
  //     clients because this component already knows the game key. Removed on
  //     unmount so the next page starts clean.
  useEffect(() => {
    if (typeof document === 'undefined') return undefined;
    const root = document.documentElement;
    const armed = document.visibilityState === 'visible';
    if (armed) root.setAttribute('data-sty-anim', '1');
    const d = gameKey ? glyphFor(gameKey) : null;
    if (d) {
      const svg = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="' + GLYPH_BOX + '">'
        + '<path d="' + d + '" fill="none" stroke="#000" stroke-width="1.35" stroke-linecap="round" stroke-linejoin="round"/></svg>';
      try { root.style.setProperty('--stg-glyph', 'url("data:image/svg+xml,' + encodeURIComponent(svg) + '")'); } catch (e) {}
    }
    return () => {
      if (armed) root.removeAttribute('data-sty-anim');
      try { root.style.removeProperty('--stg-glyph'); } catch (e) {}
    };
  }, [gameKey]);
  const homeTo = tq ? homeHref + (homeHref.includes('?') ? tq : '?' + tq.slice(1)) : homeHref;

  // A leader is the one thing the strip cannot be drawn without. No leader, no
  // strip: see the suppression rule at the top.
  const leader = board && board.leader;
  const catHref = gameKey ? categoryHrefForGame(gameKey) : null;
  const showStrip = !!(stripOn && leader);
  const pct = Math.max(0, Math.min(100, Math.round((Number(progress) || 0) * 100)));

  return (
    <div className="stg-top">
      <style>{CSS}</style>

      <div className="stg-cap">
        {/* THE BRAND IS THE WAY OUT, and it is the only one (owner, 2026-08-31).
            The Home glyph and a wordmark would be two controls doing one job,
            and the glyph was the weaker of the two: it said "home" without ever
            saying WHOSE. So the words are back, they sit to the LEFT of the
            identity, and the whole cap now reads left to right as where you
            are: the site, then the category and date, then the game. */}
        {/* THE LOGO WEARS THE CATEGORY, mark AND word (owner, 2026-09-01: "our
            recolor is supposed to hit the logo top left", then "'Loft' is still
            blue, not the category color"). Both take the category step on a game
            page, the same hue the cap band and the board take. Known cost, the
            owner's call: the three warm steps (gold, orange, amber) run under
            4.5:1 as 13px text on paper; the word is a brand mark beside a filled
            glyph and the same word in ink sits in front of it, so it is never
            the only thing carrying "Mind Loft". */}
        <a className="stg-brand" href={homeTo} aria-label="Mind Loft home" title="Mind Loft">
          <MindLoftMark size={19} ink="var(--stg-ink,#e9edf4)" accent="var(--stg-acc, var(--stg-brand,#7dd3fc))" />
          <b>Mind <em>Loft</em></b>
        </a>

        <div className="stg-id">
          <i>
            {category ? (catHref ? <a className="stg-cat" href={catHref}>{category}</a> : <span>{category}</span>) : null}
            {category && dateLabel ? <span>{' · '}</span> : null}
            {dateLabel && dateShort ? (
              <>
                <span className="stg-dl">{dateLabel}</span>
                <span className="stg-ds">{dateShort}</span>
              </>
            ) : null}
            {dateLabel && !dateShort ? <span>{dateLabel}</span> : null}
          </i>
          <h1>
            {name}
            {sunday ? <u>{sunday}</u> : null}
          </h1>
        </div>

        <button
          type="button"
          className={'stg-cx stg-rank' + (panel ? ' on' : '')}
          onClick={() => setPanel((v) => !v)}
          aria-expanded={panel}
          aria-controls="stg-rankings"
        >
          <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor"
            strokeWidth="2.2" strokeLinecap="round" aria-hidden="true">
            <path d="M4 21v-7" /><path d="M12 21V4" /><path d="M20 21v-10" />
          </svg>
          <span>Rankings</span>
        </button>
        <button
          type="button"
          className={'stg-cx stg-theme' + (hint ? ' hint' : '')}
          onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}
          aria-label={theme === 'light' ? 'Switch to dark' : 'Switch to light'}
          title={theme === 'light' ? 'Switch to dark' : 'Switch to light'}
        >
          {theme === 'light' ? (
            <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor"
              strokeWidth="2.2" strokeLinecap="round" aria-hidden="true">
              <path d="M20 14.5A8 8 0 1 1 9.5 4a6.5 6.5 0 0 0 10.5 10.5Z" />
            </svg>
          ) : (
            <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor"
              strokeWidth="2.2" strokeLinecap="round" aria-hidden="true">
              <circle cx="12" cy="12" r="4" />
              <path d="M12 3v2M12 19v2M3 12h2M19 12h2M5.6 5.6l1.4 1.4M17 17l1.4 1.4M18.4 5.6L17 7M7 17l-1.4 1.4" />
            </svg>
          )}
          {intro ? (
            <span className="stg-tlab">{intro === 'light' ? 'Light mode' : 'Dark mode'}</span>
          ) : null}
        </button>
        {/* THE EXPLICIT POINTER at the switch above, first visit only. It is
            the cap's LAST CHILD on purpose: it reads its own parent to find
            the glyph and measure itself against it. */}
        <ThemePop />
      </div>

      <LoftSheet />
      <div className="stg-prog"><span style={{ width: pct + '%' }} /></div>

      {showStrip ? (
        <button
          type="button"
          className={'stg-strip' + (panel ? ' on' : '')}
          onClick={() => setPanel((v) => !v)}
          aria-expanded={panel}
          aria-controls="stg-rankings"
        >
          {/* IT SAYS WHAT THE ROW IS, NOT WHEN IT IS (owner, 2026-08-31). The
              eyebrow read "Today", which dated a row whose date the cap above
              it already carries, and left the one thing the row is actually
              for — that this is the person to beat — to be inferred from a
              name and a score. Every figure on the strip is today's; none of
              them is the leader unless the label says so. */}
          <span className="stg-se">Leader</span>
          <b className="stg-sn">{leader.username || 'Guest'}</b>
          {/* THE LEADER'S OWN RESULT, in the game's units. This used to render
              the row's score with the word "points" after it, which on Suds
              came out as "10 points" — a figure a player cannot translate back
              into the grid they just filled (owner, 2026-08-31). gameStatsShort
              reads the row the way the tile panel's board already does: score
              out of the board's total, then the clock. `scoreWord` stays as the
              fallback for a row too thin to say anything better. */}
          <span className="stg-sf">
            {gameStatsShort(leader) || `${Math.round(Number(leader.score) || 0)} ${scoreWord}`}
          </span>
          <span className="stg-sd">
            {'· '}{board.field} {board.field === 1 ? 'player' : 'players'}
          </span>
          <span className="stg-sy">
            {board.myRank ? 'You ' + ord(board.myRank) : (started ? 'In progress' : 'Not played yet')}
            <i>{panel ? '‹' : '›'}</i>
          </span>
        </button>
      ) : null}

      {/* YOUR OWN NUMBERS, UNDER THE FIELD'S (owner, 2026-08-31). They used to
          ride on the cap's title line, which put your score above the name of
          the person beating you and made the cap carry two unrelated jobs at
          once. The order now reads down: what this page is, who is winning it,
          how you are doing. It also frees the cap to be one line at every
          width, so the phone no longer needs the two-row split this row was
          invented to survive. */}
      {figures.length ? (
        <div className="stg-fg">
          {figures.map((f, i) => (
            <div key={f.k || i}><b>{figure(f.v)}</b><i>{f.k}</i></div>
          ))}
        </div>
      ) : null}

      {/* NO LADDER HERE (owner, 2026-09-01). The rung strip was generalised
          off the Gauntlet run onto five game surfaces, where it reported a
          count the board already prints and read as a second, broken progress
          bar an inch under the cap's own. It lives on where it earns its keep:
          the run's own GauntletLadder, and the home, where a rung is a whole
          game rather than one square of one. */}
      {panel ? (
        <div className="stg-panel" id="stg-rankings" role="region" aria-label="Rankings">
          <div className="stg-pin">
            {/* The panel's dark styling has to follow the REGISTER, not the stage. It
                    was hardcoded, so on the light stage it drew the dark register's
                    near-white ink and pale sky tabs onto a near-white panel. */}
            {panelBody || (
              <DailyBoardPanel self={gameKey} quizId={quizId} maxWidth={720} stage dark={theme !== 'light'}
                onClose={() => setPanel(false)} />
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
}

const SANS = "'Manrope',system-ui,-apple-system,sans-serif";
const MONO = "'DM Mono',ui-monospace,'SFMono-Regular',monospace";

// No backtick may appear anywhere in this string, comments included: one closes
// the template literal and the build fails with an error pointing somewhere
// else entirely. It has happened on this codebase before.
const CSS = `
.stg-top{background:var(--stg-ground,#0b0f1a);font-family:${SANS};color:var(--stg-ink,#e9edf4);}

.stg-cap{display:flex;align-items:center;gap:16px;padding:12px 20px;position:relative;}
.stg-id{display:flex;flex-direction:column;gap:1px;min-width:0;}
.stg-id i{font-family:${MONO};font-style:normal;font-size:9.5px;letter-spacing:.15em;
  text-transform:uppercase;color:var(--stg-mute2,#66748f);display:block;overflow:hidden;
  text-overflow:ellipsis;white-space:nowrap;}
.stg-cat{color:inherit;text-decoration:none;}
.stg-cat:hover{text-decoration:underline;text-underline-offset:2px;}
.stg-id h1{margin:0;font:inherit;font-size:16px;font-weight:800;letter-spacing:-.01em;display:flex;align-items:center;gap:9px;}
.stg-id h1 u{text-decoration:none;font-family:${MONO};font-size:9px;letter-spacing:.11em;
  text-transform:uppercase;font-weight:500;color:var(--stg-onramp,#08222e);background:var(--stg-acc);
  border-radius:99px;padding:3px 8px;}
.stg-fg{display:flex;gap:26px;padding:9px 20px;
  border-bottom:1px solid var(--stg-line);}
.stg-fg>div{display:flex;flex-direction:column;}
.stg-fg b{font-family:${MONO};font-size:14px;font-weight:500;line-height:1.15;
  font-variant-numeric:tabular-nums;}
.stg-fg i{font-family:${MONO};font-style:normal;font-size:9px;letter-spacing:.12em;
  text-transform:uppercase;color:var(--stg-mute2,#66748f);}

.stg-cx{display:inline-flex;align-items:center;gap:6px;font-family:${MONO};font-size:10px;
  letter-spacing:.11em;text-transform:uppercase;color:var(--stg-ink2,#aab5c7);border:1px solid var(--stg-line);
  border-radius:99px;padding:5px 11px;background:none;cursor:pointer;text-decoration:none;}
.stg-rank{margin-left:auto;}
/* The brand is a LINK, not a chip: no pill, no border, because it is the one
   control on this line that is not part of the game. The rule to its right is
   what separates the site from the sitting. */
.stg-brand{display:flex;align-items:center;gap:8px;flex:none;text-decoration:none;
  color:var(--stg-ink,#e9edf4);padding-right:15px;border-right:1px solid var(--stg-line);}
.stg-brand b{font-size:13px;font-weight:800;letter-spacing:-.01em;white-space:nowrap;}
.stg-brand b em{font-style:normal;color:var(--stg-acc-ink,var(--stg-brand,#7dd3fc));}
.stg-brand:hover{opacity:.82;}
.stg-brand:focus-visible{outline:2px solid var(--stg-acc);outline-offset:3px;border-radius:4px;}
.stg-ds{display:none;}
.stg-theme{padding:5px 8px;}
.stg-theme.hint{border-color:var(--stg-acc);color:var(--stg-acc-ink);animation:stg-hintring 1.9s ease-out 3;}
/* THE FIRST-VISIT POINTER at the light switch: a ring pulsing out of the glyph,
   three times, then gone for good. Deliberately a ring rather than a colour
   change, so it draws the eye without the control ever looking like it is in a
   state it is not. */
@keyframes stg-hintring{
  0%{box-shadow:0 0 0 0 var(--stg-acc);}
  70%{box-shadow:0 0 0 10px transparent;}
  100%{box-shadow:0 0 0 0 transparent;}
}
@media (prefers-reduced-motion: reduce){ .hint{animation:none !important;} }

.stg-cx:hover{border-color:var(--stg-line2,rgba(255,255,255,0.17));color:var(--stg-ink,#e9edf4);}
.stg-rank.on{color:var(--stg-onramp,#08222e);background:var(--stg-acc);border-color:var(--stg-acc);}
.stg-cx:focus-visible{outline:2px solid var(--stg-acc);outline-offset:2px;}

.stg-prog{height:2px;background:var(--stg-surf2,rgba(255,255,255,0.08));}
.stg-prog span{display:block;height:100%;background:var(--stg-acc);transition:width .3s ease;}

.stg-strip{display:flex;align-items:center;gap:11px;width:100%;text-align:left;cursor:pointer;
  background:var(--stg-surf,rgba(255,255,255,0.045));border:0;border-bottom:1px solid var(--stg-line);
  padding:9px 20px;font-family:${SANS};font-size:12.5px;color:var(--stg-ink,#e9edf4);}
.stg-strip:hover{background:var(--stg-surf,rgba(255,255,255,0.045));}
.stg-strip.on{background:var(--stg-surf2,rgba(255,255,255,0.08));}
.stg-strip:focus-visible{outline:2px solid var(--stg-acc);outline-offset:-2px;}
.stg-se{font-family:${MONO};font-size:9.5px;letter-spacing:.14em;text-transform:uppercase;color:var(--stg-mute2,#66748f);}
.stg-sn{font-weight:800;}
.stg-sf{font-family:${MONO};font-size:11.5px;color:var(--stg-ink2,#aab5c7);}
.stg-sd{color:var(--stg-mute2,#66748f);font-size:11.5px;}
.stg-sy{margin-left:auto;flex:none;color:var(--stg-acc-ink);font-family:${MONO};font-size:10px;
  letter-spacing:.1em;text-transform:uppercase;display:flex;align-items:center;gap:7px;}

.stg-panel{border-bottom:1px solid var(--stg-line);background:var(--stg-panel,#0d1220);}
.stg-pin{max-width:1180px;margin:0 auto;padding:16px 20px 20px;}
.stg-px{display:block;margin:14px auto 0;background:none;border:1px solid var(--stg-line);
  border-radius:99px;color:var(--stg-mute2,#66748f);font-family:${MONO};font-size:9.5px;letter-spacing:.13em;
  text-transform:uppercase;padding:6px 16px;cursor:pointer;}

@media(max-width:900px){
  /* TWO ROWS ON A PHONE (owner, 2026-08-31: "too much stuff mashed together").
     The cap was one flex line carrying the identity, up to four figures and
     three icon buttons; at 390 it wrapped into a 100px block against 59 on the
     desktop, and the wrap fell wherever it landed rather than where it means
     something. It is a grid now, split the way the site masthead splits: row 1
     is what the page IS and how to leave it, row 2 is how you are doing. The
     figures get the full width to themselves and space out evenly, so four fit
     without shrinking the title. */
  .stg-cap{gap:10px;padding:10px 13px;}
  .stg-id h1{font-size:15px;}
  .stg-brand{gap:6px;padding-right:9px;}
  .stg-brand b{font-size:11.5px;}
  .stg-dl{display:none;}
  .stg-ds{display:inline;}
  /* The cap is ONE line again at every width. The two-row split that used to
     live here existed only to hold the figures, and the figures now have a row
     of their own below the leader strip. */
  .stg-fg{gap:0;justify-content:space-between;padding:8px 13px;}
  .stg-fg>div{min-width:0;}
  .stg-strip{padding:8px 13px;gap:8px;font-size:11.5px;}
  /* The player count is the first thing to go: the strip's job on a phone is
     the leader's result and your own place. */
  .stg-sd{display:none;}
  /* A long name yields to the figure beside it rather than pushing it out. */
  .stg-sn{overflow:hidden;text-overflow:ellipsis;white-space:nowrap;min-width:0;}
  .stg-sf{flex:none;}
  .stg-pin{padding:14px 13px 18px;}
}
@media(max-width:640px){
  .stg-rank{padding:5px 8px;}
  .stg-rank span{display:none;}
}
`;
