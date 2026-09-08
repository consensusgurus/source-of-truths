'use client';

// The "keep playing / share" group shown on each daily-game page, directly under
// the puzzle and above the leaderboard. Four parts, in this order (owner
// consistency pass, 2026-08-01: the page block below the board now mirrors the
// end-of-game card, so a player reads the same controls in the same styling
// whether they are looking at the card or the page):
//   0. the "Report an issue" link, FIRST, tucked directly under the finished
//      board where a player who has just spotted a bad clue looks for it. It
//      used to sit between the replay and share buttons, which buried it;
//   1. a "Play Today's Puzzle Again" button, i.e. at
//      the bottom of the play space, shown only once the board is finished
//      (owner, 2026-07-31). Before this the ONLY replay control was the "Try
//      again" button inside the DailyEndCard modal, so a player who dismissed
//      that card, or returned to a finished board from a hub "Play again" link,
//      had no way to replay the day's puzzle. The caller passes its own
//      resetGame as `replay`, already gated on its finished state, so an absent
//      or null prop simply drops the button. A replay is practice: the first
//      completed attempt is what the daily leaderboard and the local streak
//      keep (write-once recordStat in each client), so it never overwrites the
//      recorded run;
//   2. a full-width Share-for-credit button, which copies the player's own
//      referral link and carries its own one-line explanation of WHY sharing
//      matters (owner, 2026-07-31). The old 2-up row paired it with a
//      "Challenge a Friend" duel link; that button was removed and the share
//      button took the whole width, so the `challengeHref` prop is now ignored
//      (kept on the signature only so the ~43 game pages that still pass it do
//      not need touching). Its styling is the end card's black `.dec-sharebar`
//      (ink bar, icon chip, title + sub-line, chevron) rather than the old
//      cream/amber tile, so the same action looks the same in both places
//      (owner, 2026-08-01). While the referral CONTEST is live it also carries
//      the end card's teaser copy verbatim (the prize figure picked out in gold,
//      "Top N referrers win" underneath, the deadline footnote below), so the
//      $20 offer reads the same on the page as it does on the card (owner,
//      2026-08-07); and
//   3. the games grid — the OTHER dailies (plus one evergreen popular quiz to
//      keep the count even), 2-wide on phones and 3-wide on desktop.
// Games the viewer has already finished today get a faint green wash + a check
// badge (from /api/quiz/daily-me, same source as the end card).
//
// Same tile look as the /quizzes hub games row, but self-contained (its own
// styles) since the game pages don't load the hub CSS. Adding a game to the
// registry here adds it to every other game's page.

import React, { useState, useEffect } from 'react';
import { Share2, Check, RotateCcw, ChevronRight } from 'lucide-react';
import useDailyOrder, { sortByDailyOrder } from './useDailyOrder';
import ReportIssue from './ReportIssue';
import { fetchDailyMe, dailyMeQuery } from './dailyMeClient';
import { T } from '@/lib/theme';
import { CONTEST, COPY, contestIsLive } from '@/lib/contest';
import { isRetiredDaily, dailyAttemptRule } from '@/lib/daily-games';

const GAMES = [
  { key: 'crux', href: '/crux', name: 'Crux', tag: 'A clueless crossword', img: '/games/btn-crux.png' },
  { key: 'emcee', href: '/emcee', name: 'Emcee', tag: 'The daily mini crossword', img: '/games/btn-emcee.png' },
  { key: 'shards', href: '/shards', name: 'Shards', tag: 'Reassemble the crossword', img: '/games/btn-shards.png' },
  { key: 'garble', href: '/garble', name: 'Garble', tag: 'Untangle five words', img: '/games/btn-garble.png' },
  { key: 'links', href: '/links', name: 'Links', tag: 'Four hidden groups', img: '/games/btn-links.png' },
  { key: 'span', href: '/span', name: 'Span', tag: 'Cross the map', img: '/games/btn-span.png' },
  { key: 'dating', href: '/dating', name: 'Dating', tag: 'Put history in order', img: '/games/btn-dating.png' },
  { key: 'tally', href: '/tally', name: 'Tally', tag: 'Balance the books', img: '/games/btn-tally.png' },
  { key: 'suds', href: '/suds', name: 'Suds', tag: 'The daily sudoku', img: '/games/btn-suds.png' },
  { key: 'quilt', href: '/quilt', name: 'Quilt', tag: 'The daily jigsaw sudoku', img: '/games/btn-quilt.png' },
  { key: 'cages', href: '/cages', name: 'Cages', tag: 'The daily killer sudoku', img: '/games/btn-cages.png' },
  { key: 'sando', href: '/sando', name: 'Sando', tag: 'The daily sandwich sudoku', img: '/games/btn-sando.png' },
  { key: 'sixes', href: '/sixes', name: 'Sixes', tag: 'The daily mini sudoku', img: '/games/btn-sixes.png' },
  { key: 'atlas', href: '/atlas', name: 'Atlas', tag: 'Twenty-five questions, one life', img: '/games/btn-atlas.png' },
  { key: 'sport', href: '/sport', name: 'Sport', tag: 'Every sport, one life', img: '/games/btn-sport.png' },
  { key: 'calc', href: '/calc', name: 'Calc', tag: 'Walk the calculator', img: '/games/btn-calc.png' },
  { key: 'encore', href: '/encore', name: 'Encore', tag: 'The daily crossword', img: '/games/btn-encore.png' },
  { key: 'biz', href: '/biz', name: 'Biz', tag: 'Business, one life', img: '/games/btn-biz.png' },
  { key: 'flank', href: '/flank', name: 'Flank', tag: 'Name every neighbor', img: '/games/btn-flank.png' },
  { key: 'script', href: '/script', name: 'Script', tag: 'Movies and TV, one life', img: '/games/btn-script.png' },
  { key: 'quotes', href: '/quotes', name: 'Quotes', tag: 'Who said it, one life', img: '/games/btn-quotes.png' },
  { key: 'focus', href: '/focus', name: 'Focus', tag: 'Name the zoomed-in photo', img: '/games/btn-focus.png' },
  { key: 'thread', href: '/thread', name: 'Thread', tag: 'Nine films described badly, one thread', img: '/games/btn-thread.png' },
  { key: 'slot', href: '/slot', name: 'Slot', tag: 'Ten things, one at a time', img: '/games/btn-slot.png' },
  { key: 'niche', href: '/niche', name: 'Niche', tag: 'One answer, two categories', img: '/games/btn-niche.png' },
  { key: 'shoe', href: '/shoe', name: 'Shoe', tag: 'The daily blackjack shoe', img: '/games/btn-shoe.png' },
  { key: 'queen', href: '/queen', name: 'Queen', tag: 'White to play and promote', img: '/games/btn-queen.png' },
  { key: 'towers', href: '/towers', name: 'Towers', tag: 'Count the towers in view', img: '/games/btn-towers.png' },
  { key: 'mercury', href: '/mercury', name: 'Mercury', tag: 'The daily thermo sudoku', img: '/games/btn-mercury.png' },
  { key: 'polka', href: '/polka', name: 'Polka', tag: 'No numbers, only dots', img: '/games/btn-polka.png' },
  { key: 'diag', href: '/diag', name: 'Diag', tag: 'The daily diagonal sudoku', img: '/games/btn-diag.png' },
  { key: 'whittle', href: '/whittle', name: 'Whittle', tag: 'The sudoku, backwards', img: '/games/btn-whittle.png' },
  { key: 'knight', href: '/knight', name: 'Knight', tag: 'The daily anti-knight sudoku', img: '/games/btn-knight.png' },
  { key: 'carve', href: '/carve', name: 'Carve', tag: 'Equal-sum blocks', img: '/games/btn-carve.png' },
  { key: 'extra', href: '/extra', name: 'Extra', tag: 'Name the story', img: '/games/btn-extra.png' },
  { key: 'stet', href: '/stet', name: 'Stet', tag: 'Spot the error, fix the copy', img: '/games/btn-stet.png' },
  { key: 'outwit', href: '/outwit', name: 'Outwit', tag: 'Beat the crowd', img: '/games/btn-outwit.png' },
  { key: 'outrank', href: '/outrank', name: 'Outrank', tag: "Call the crowd's order", img: '/games/btn-outrank.png' },
  { key: 'tuck', href: '/tuck', name: 'Tuck', tag: 'Same letters, highest score wins', img: '/games/btn-tuck.png' },
  { key: 'alibi', href: '/alibi', name: 'Alibi', tag: 'Solve the nightly whodunit', img: '/games/btn-alibi.png' },
  { key: 'cipher', href: '/cipher', name: 'Cipher', tag: 'Crack the letter math', img: '/games/btn-cipher.png' },
  { key: 'ping', href: '/ping', name: 'Ping', tag: 'Find the secret city', img: '/games/btn-ping.png' },
  { key: 'warmer', href: '/warmer', name: 'Warmer', tag: 'Hotter or colder', img: '/games/btn-warmer.png' },
  { key: 'jester', href: '/jesters', name: 'Jesters', tag: 'Seat the court', img: '/games/btn-jester.png' },
  { key: 'sworn', href: '/sworn', name: 'Sworn', tag: 'Spot the liars', img: '/games/btn-sworn.png' },
  { key: 'axiom', href: '/axiom', name: 'Axiom', tag: 'Find the hidden rule', img: '/games/btn-axiom.png' },
  { key: 'hearsay', href: '/hearsay', name: 'Hearsay', tag: "Deduce what they don't know", img: '/games/btn-hearsay.png' },
  { key: 'venn', href: '/venn', name: 'Venn', tag: 'Sort the overlaps', img: '/games/btn-venn.png' },
  { key: 'stands', href: '/stands', name: 'Stands', tag: 'Rebuild the results', img: '/games/btn-stands.png' },
  { key: 'bracket', href: '/bracket', name: 'Bracket', tag: 'Name every winner', img: '/games/btn-bracket.png' },
  // PRICER PULLED 2026-08-09 (see CLAUDE.md). Restore: grep -rn 'PRICER PULLED' games grid tile
  // { key: 'pricer', href: '/pricer', name: 'Pricer', tag: 'Some days more, some days less', img: '/games/btn-pricer.png' },
  { key: 'lode', href: '/lode', name: 'Lode', tag: 'Seven letters, rare words pay', img: '/games/btn-lode.png' },
  { key: 'etch', href: '/etch', name: 'Etch', tag: 'A picture in the numbers', img: '/games/btn-etch.png' },
  { key: 'glyph', href: '/glyph', name: 'Glyph', tag: 'A crossword with no clues', img: '/games/btn-glyph.png' },
  { key: 'hedge', href: '/hedge', name: 'Hedge', tag: 'Draw one closed loop', img: '/games/btn-hedge.png' },
  { key: 'listed', href: '/listed', name: 'Listed', tag: 'Rank the list, top to bottom', img: '/games/btn-listed.png' },
  { key: 'mate', href: '/mate', name: 'Mate', tag: 'White to play and mate', img: '/games/btn-mate.png' },
  { key: 'four', href: '/four', name: 'Four', tag: 'One column wins', img: '/games/btn-four.png' },
  { key: 'park', href: '/parker', name: 'Parker', tag: 'Get the red one out', img: '/games/btn-park.png' },
  { key: 'impound', href: '/impound', name: 'Impound', tag: 'Parker on a bigger lot', img: '/games/btn-impound.png' },
  { key: 'junkyard', href: '/junkyard', name: 'Junkyard', tag: 'Parker on the biggest lot', img: '/games/btn-junkyard.png' },
  { key: 'check', href: '/check', name: 'Check', tag: 'Red to play and sweep', img: '/games/btn-check.png' },
  { key: 'rung', href: '/rung', name: 'Rung', tag: 'One letter at a time', img: '/games/btn-rung.png' },
  { key: 'hinge', href: '/hinge', name: 'Hinge', tag: 'Chain the compounds', img: '/games/btn-hinge.png' },
  { key: 'crunch', href: '/crunch', name: 'Crunch', tag: 'Six numbers, one target', img: '/games/btn-crunch.png' },
  { key: 'taire', href: '/taire', name: 'Taire', tag: 'The daily solitaire', img: '/games/btn-taire.png' },
  { key: 'hands', href: '/hands', name: 'Hands', tag: 'The daily poker solitaire', img: '/games/btn-hands.png' },
  { key: 'finesse', href: '/finesse', name: 'Finesse', tag: 'The daily double dummy', img: '/games/btn-finesse.png' },
  { key: 'fib', href: '/fib', name: 'Fib', tag: 'One clue is lying', img: '/games/btn-fib.png' },
  { key: 'streak', href: '/streak', name: 'Streak', tag: 'Forty questions, one life', img: '/games/btn-streak.png' },
  { key: 'feud', href: '/feud', name: 'Feud', tag: 'Match the crowd', img: '/games/btn-feud.png' },
  { key: 'babel', href: '/babel', name: 'Babel', tag: 'The bag is empty', img: '/games/btn-babel.png' },
  { key: 'chain', href: '/chain', name: 'Chain', tag: 'Take them, or leave them', img: '/games/btn-chain.png' },
  { key: 'turn', href: '/turn', name: 'Turn', tag: 'Ten squares left', img: '/games/btn-turn.png' },
  { key: 'suffice', href: '/suffice', name: 'Suffice', tag: 'Decide what is enough', img: '/games/btn-suffice.png' },
  { key: 'strata', href: '/strata', name: 'Strata', tag: 'Dig the words out', img: '/games/btn-strata.png' },
  { key: 'blocks', href: '/blocks', name: 'Blocks', tag: 'Same shapes, same order', img: '/games/btn-blocks.png' },
  { key: 'docket', href: '/docket', name: 'Docket', tag: 'One setup, five deductions', img: '/games/btn-docket.png' },
  { key: 'plot', href: '/plot', name: 'Plot', tag: 'Divide the whole board', img: '/games/btn-plot.png' },
  { key: 'barter', href: '/barter', name: 'Barter', tag: 'Trade the letters home', img: '/games/btn-barter.png' },
  { key: 'defend', href: '/defend', name: 'Defend', tag: 'Black to play and survive', img: '/games/btn-defend.png' },
  { key: 'blitz', href: '/blitz', name: 'Blitz', tag: 'Twenty problems, one life', img: '/games/btn-blitz.png' },
  { key: 'blitzed', href: '/blitzed', name: 'Blitzed', tag: 'Twenty problems, three numbers each', img: '/games/btn-blitzed.png' },
  { key: 'sums', href: '/sums', name: 'Sums', tag: 'The daily kakuro', img: '/games/btn-sums.png' },
  { key: 'sweep', href: '/sweep', name: 'Sweep', tag: 'No bottom edge', img: '/games/btn-sweep.png' },
  { key: 'chomp', href: '/chomp', name: 'Chomp', tag: 'Eat them in order', img: '/games/btn-chomp.png' },
  { key: 'redact', href: '/redact', name: 'Redact', tag: 'Uncover the story', img: '/games/btn-redact.png' },
  { key: 'paths', href: '/paths', name: 'Paths', tag: 'Link every town', img: '/games/btn-paths.png' },
  { key: 'deep', href: '/deep', name: 'Deep', tag: 'One topic, fifteen questions', img: '/games/btn-deep.png' },
  { key: 'anon', href: '/anon', name: 'Anon', tag: 'A clueless acrostic', img: '/games/btn-anon.png' },
// A retired game drops out on its own the morning after its bank's last drop
// (RETIRED_DAILY in lib/daily-games); it stays playable, just not on today's
// board. The CATEGORIES key lists below can keep naming it: they resolve through
// GAMES_BY_KEY and drop whatever no longer resolves.
].filter((g) => !isRetiredDaily(g.key));
const GAMES_BY_KEY = Object.fromEntries(GAMES.map((g) => [g.key, g]));

// Games grouped by category, matching the five families in the end-of-game
// card (DailyEndCard CAT_META / DAILY_GAMES.cat) so the two surfaces agree.
// Within each group the order is popularity (yesterday's plays), same as
// everywhere else.
const CATEGORIES = [
  { key: 'word', label: 'Word', keys: ['crux', 'strata', 'lode', 'encore', 'emcee', 'shards', 'garble', 'links', 'stet', 'tuck', 'warmer', 'glyph', 'anon', 'rung', 'hinge', 'babel', 'barter'] },
  { key: 'geography', label: 'Geography', keys: ['atlas', 'flank', 'span', 'ping'] },
  { key: 'numbers', label: 'Numbers', keys: ['tally', 'calc', 'carve', 'cipher', 'crunch', 'blitz', 'blitzed', 'sums'] },
  // Sudoku split out of Numbers on 2026-09-01. The nine keys are exactly the
  // Sudoku circuit's pool, so the shelf, the circuit and the category are one
  // list and cannot drift apart.
  { key: 'sudoku', label: 'Sudoku', keys: ['suds', 'sixes', 'towers', 'quilt', 'cages', 'sando', 'mercury', 'polka', 'knight', 'diag', 'whittle'] },
  { key: 'crowd', label: 'Crowd Psychology', keys: ['outwit', 'outrank', 'feud'] },
  { key: 'trivia', label: 'Trivia', keys: ['deep', 'streak', 'atlas', 'sport', 'biz', 'script', 'quotes', 'focus', 'thread', 'slot', 'bracket', 'listed', 'niche', 'redact', 'dating', 'extra'] },
  { key: 'logic', label: 'Logic', keys: ['alibi', 'jester', 'sworn', 'axiom', 'hearsay', 'venn', 'stands', 'etch', 'hedge', 'park', 'impound', 'junkyard', 'fib', 'suffice', 'paths', 'chomp', 'docket', 'plot'] },
  { key: 'endgame', label: 'End Game', keys: ['mate', 'defend', 'queen', 'four', 'check', 'chain', 'turn'] },
  { key: 'cards', label: 'Cards', keys: ['taire', 'hands', 'shoe', 'finesse'] },
  { key: 'arcade', label: 'Arcade', keys: ['blocks', 'sweep'] },
];

/* The prize figure is the hook in the share teaser, so it is picked out of the
   copy string and rendered gold, heavier than the sentence around it, exactly
   as the end card does it. Split on CONTEST.prizeLabel so lib/contest.js stays
   the one source of the number: if the label ever stops appearing in the teaser
   the split yields a single part and the copy renders unchanged. Mirrors
   teaserNodes in DailyEndCard.jsx; keep the two in sync. */
function teaserNodes() {
  const label = CONTEST.prizeLabel;
  const parts = String(COPY.teaser).split(label);
  if (parts.length < 2) return COPY.teaser;
  const out = [];
  parts.forEach((part, i) => {
    if (i > 0) out.push(<span className="pz" key={`p${i}`}>{label}</span>);
    if (part) out.push(<span key={`t${i}`}>{part}</span>);
  });
  return <>{out}</>;
}

// `challengeHref` is DEPRECATED and ignored (see the header note); it stays on
// the signature so existing callers keep working.
export default function DailyGamesGrid({ self, maxWidth = 640, challengeHref = null, share = null, divider = false, boardSlot = null, light = false, replay = null }) {
  // "(for credit)" is appended only for a registered viewer: their share link
  // carries their referral code, so the share genuinely earns them credit. A
  // signed-out visitor sees the plain label rather than a promise we can't keep.
  // Resolved in an effect so server and first client render agree.
  // Display order within each category = yesterday's popularity (canonical
  // until the order loads).
  const dailyOrder = useDailyOrder();
  // The other dailies (everything but the game you're on), grouped by category
  // to match the /daily hub, with each group popularity-sorted.
  const groups = CATEGORIES
    .map((c) => ({
      key: c.key,
      label: c.label,
      games: sortByDailyOrder(
        c.keys.filter((k) => k !== self).map((k) => GAMES_BY_KEY[k]).filter(Boolean),
        dailyOrder
      ),
    }))
    .filter((c) => c.games.length > 0);

  // Which dailies the viewer has already finished today (registered viewers) —
  // those tiles show a faint wash + check. Guests get no marks (empty set).
  const [donePerGame, setDonePerGame] = useState(null);
  useEffect(() => {
    let anonId = null, email = null;
    try { anonId = localStorage.getItem('sot_quiz_anon'); } catch (e) {}
    try { const id = JSON.parse(localStorage.getItem('sot_quiz_identity') || 'null'); email = id && id.email; } catch (e) {}
    let alive = true;
    // daily-me, not daily-combined: this grid only wants the completion set. It
    // was the last caller keeping the combined board on a daily puzzle page.
    //
    // Deliberately NO `game`: without it the endpoint skips the board build and
    // the adaptive re-score and only counts rows, which is the cheapest form of
    // this request and all the grid needs. That does mean it cannot share the
    // card and panel's entry, since their query carries game + quizId. Sharing
    // would make this the expensive variant instead, so a third cheap request
    // beats a third heavy one.
    fetchDailyMe(dailyMeQuery({ anonId, email }))
      .then((d) => { if (alive && d && d.perGame) setDonePerGame(d.perGame); })
      .catch(() => {});
    return () => { alive = false; };
  }, []);
  const completed = donePerGame ? new Set(Object.keys(donePerGame).filter((k) => !(donePerGame[k] && donePerGame[k].abandoned))) : new Set();

  // Replay: hand the board back to the caller's resetGame, then return the
  // reader to the top of the page so they land on the fresh board rather than
  // halfway down the leaderboard. Mirrors goReplay in DailyEndCard.
  const goReplay = () => {
    if (typeof replay === 'function') replay();
    if (typeof window !== 'undefined') {
      try { window.scrollTo({ top: 0, behavior: 'smooth' }); } catch (e) { window.scrollTo(0, 0); }
    }
  };

  // Contest teaser on the share bar, same as the end card. Resolved AFTER
  // mount rather than at render: contestIsLive() reads the clock, so evaluating
  // it during SSR and again on the client can disagree across the window
  // boundary and trip a hydration mismatch. Off for the first paint, which is
  // correct anyway once the contest has ended.
  const [contestLive, setContestLive] = useState(false);
  useEffect(() => { setContestLive(contestIsLive()); }, []);

  const copied = /copied/i.test((share && share.label) || '');

  return (
    <div className={light ? 'dgg-light' : undefined} style={{ maxWidth, margin: '18px auto 0' }}>
      <style>{`
        .dgg-grp{margin-bottom:14px;}
        .dgg-glabel{display:flex;align-items:center;gap:10px;margin:0 2px 8px;}
        .dgg-glabel .k{font-size:11px;font-weight:800;letter-spacing:.08em;text-transform:uppercase;color:var(--accent);white-space:nowrap;}
        .dgg-glabel .line{flex:1;height:1px;background:rgba(28,30,36,0.12);}
        .dgg{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px;}
        @media(min-width:768px){.dgg{grid-template-columns:repeat(3,minmax(0,1fr));}}
        @media(max-width:359px){.dgg{grid-template-columns:1fr;}}
        .dgg-t{position:relative;display:flex;flex-direction:row;align-items:center;gap:10px;min-height:58px;border:1px solid rgba(28,30,36,0.14);border-radius:14px;background:var(--white);padding:10px 13px;text-decoration:none;overflow:hidden;box-sizing:border-box;}
        .dgg-t:hover{border-color:#5b8bff;}
        .dgg-txt{display:flex;flex-direction:column;gap:1px;min-width:0;flex:1 1 auto;}
        .dgg-art{flex:0 0 auto;height:42px;width:auto;}
        .dgg-nm{font-size:15px;font-weight:800;letter-spacing:-.3px;color:var(--ink);line-height:1.1;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}
        .dgg-p{font-size:10.5px;font-weight:700;color:var(--muted);line-height:1.2;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}
        .dgg-done{background:linear-gradient(0deg,rgba(22,163,74,0.14),rgba(22,163,74,0.14)),var(--accent);border-color:rgba(34,197,94,0.5);}
        .dgg-done .dgg-art{opacity:.5;}
        .dgg-done .dgg-nm{color:#dfeee4;}
        .dgg-check{position:absolute;top:7px;right:7px;width:19px;height:19px;border-radius:50%;background:#16a34a;color:var(--ink);display:flex;align-items:center;justify-content:center;border:2px solid var(--accent);box-shadow:0 1px 2px rgba(0,0,0,0.35);}
        .dgg-act{min-height:76px;justify-content:center;gap:10px;cursor:pointer;font-family:inherit;width:100%;}
        .dgg-act .dgg-act-l{font-size:15px;font-weight:800;letter-spacing:.03em;text-transform:uppercase;color:var(--ink);line-height:1.15;text-align:center;}
        .dgg-act svg{flex:0 0 auto;}
        .dgg-replay{margin-bottom:12px;}
        .dgg-act.dgg-again{min-height:64px;background:var(--cta);border-color:var(--cta);box-shadow:0 2px 0 var(--cta-hover),0 4px 14px rgba(37,99,235,.28);transition:background .12s ease,transform .08s ease,box-shadow .12s ease;}
        .dgg-act.dgg-again:hover{background:var(--cta-hover);border-color:var(--cta-hover);}
        .dgg-act.dgg-again:active{transform:translateY(2px);box-shadow:0 0 0 var(--cta-hover),0 2px 8px rgba(37,99,235,.24);}
        .dgg-act.dgg-again .dgg-act-l{color:var(--white);}
        .dgg-act.dgg-again svg{color:var(--white);}
        .dgg-act-s{display:block;margin-top:3px;font-size:10.5px;font-weight:700;letter-spacing:0;text-transform:none;color:rgba(255,255,255,.74);}

        /* Share bar — a byte-for-byte match of the end card's .dec-sharebar
           (owner, 2026-08-01). The page and the card fire the SAME share
           handler and open the same ShareCreditPop, so showing one as a black
           feature bar and the other as a cream tile made a single action look
           like two. The ink treatment is the one that stays. */
        .dgg-sharebar{display:flex;align-items:center;gap:13px;width:100%;box-sizing:border-box;text-align:left;font-family:inherit;color:var(--white);background:var(--ink);border:1px solid var(--ink);border-radius:13px;padding:12px 14px;margin-bottom:12px;cursor:pointer;transition:filter .12s ease;}
        .dgg-sharebar:hover{filter:brightness(1.16);}
        .dgg-sharebar .ic{width:34px;height:34px;border-radius:10px;background:rgba(255,255,255,.13);display:flex;align-items:center;justify-content:center;flex-shrink:0;}
        .dgg-sharebar .ic svg{color:var(--white);}
        .dgg-sharebar .tx{display:flex;flex-direction:column;gap:2px;min-width:0;flex:1;}
        .dgg-sharebar .t{font-size:14px;font-weight:800;letter-spacing:-.01em;}
        /* The prize figure inside the teaser: gold on the ink bar, heavier than
           the sentence around it, underlined so it reads as the offer. Matches
           .dec-sharebar .t .pz on the end card. */
        .dgg-sharebar .t .pz{font-weight:900;color:#ffd76b;text-decoration:underline;text-decoration-thickness:2px;text-underline-offset:2px;}
        .dgg-sharebar .s{font-size:11.5px;font-weight:600;color:rgba(255,255,255,.66);}
        .dgg-sharebar .cv{flex-shrink:0;opacity:.6;}
        /* Contest footnote: carries the asterisk on the share label, and sits
           directly under the bar it annotates. Same copy as the end card's
           .dec-fine. */
        .dgg-fine{font-size:10.5px;line-height:1.45;color:var(--muted);margin:-8px 2px 12px;}
        .dgg-fine a{color:var(--muted);text-decoration:underline;}
        @media(max-width:640px){
          .dgg-sharebar{gap:11px;padding:11px 12px;}
          .dgg-sharebar .t{font-size:13px;}
          .dgg-sharebar .s{font-size:11px;}
          .dgg-fine{font-size:10px;margin:-7px 2px 11px;}
        }

        /* Light theme (owner, 2026-07-23): drop the navy fill so the daily-game
           bottom section matches the end-of-game card. Game icons are kept. */
        .dgg-light .dgg-t{background:var(--white);border-color:rgba(20,22,28,0.12);}
        .dgg-light .dgg-t:hover{border-color:#5b8bff;}
        .dgg-light .dgg-nm{color:var(--ink);}
        .dgg-light .dgg-p{color:var(--muted);}
        /* The letter-tile game icons are drawn for a dark ground and wash out on
           white, so give the icon its own navy chip on the light tiles. */
        .dgg-light .dgg-art{background:#f1f3f6;border-radius:9px;padding:5px;box-sizing:border-box;}
        .dgg-light .dgg-done{background:linear-gradient(0deg,rgba(22,163,74,0.10),rgba(22,163,74,0.10)),var(--white);border-color:rgba(34,197,94,0.5);}
        .dgg-light .dgg-done .dgg-art{opacity:.6;}
        .dgg-light .dgg-done .dgg-nm{color:var(--success-deep);}
        .dgg-light .dgg-check{border-color:var(--ink);}
        /* The .dgg-again tint must be scoped to .dgg-light too: the unscoped
           rule ties on specificity with .dgg-light .dgg-t and loses on order,
           so the button rendered white. Same pattern as share. */
        .dgg-light .dgg-act.dgg-again{background:var(--cta);border-color:var(--cta);}
        .dgg-light .dgg-act.dgg-again:hover{background:var(--cta-hover);border-color:var(--cta-hover);}
        .dgg-light .dgg-act.dgg-again .dgg-act-l{color:var(--white);}
        .dgg-light .dgg-act.dgg-again svg{color:var(--white);}
        .dgg-light .dgg-act.dgg-again .dgg-act-s{color:rgba(255,255,255,.74);}
      `}</style>
      {/* Report an issue leads the block (owner, 2026-08-01): it belongs
          directly under the board a player has just finished, not buried
          between the replay and share buttons. */}
      {self ? (
        <div style={{ marginBottom: 12 }}>
          <ReportIssue self={self} name={GAMES_BY_KEY[self] ? GAMES_BY_KEY[self].name : undefined} accent={T.accent} />
        </div>
      ) : null}
      {replay ? (
        <div className="dgg-replay">
          <button type="button" onClick={goReplay} className="dgg-t dgg-act dgg-again" aria-label="Play today's puzzle again">
            <RotateCcw size={20} strokeWidth={2.5} />
            <span className="dgg-act-l">
              Play Today&apos;s Puzzle Again
              <span className="dgg-act-s">{dailyAttemptRule(self).replay}</span>
            </span>
          </button>
        </div>
      ) : null}
      {/* Same markup and copy as the end card's share bar, so the one action
          reads identically in both surfaces. */}
      {share ? (
        <button type="button" onClick={share.onClick} className="dgg-sharebar" aria-label="Share your result and get credit">
          <span className="ic"><Share2 size={17} strokeWidth={2.3} /></span>
          <span className="tx">
            <span className="t">
              {copied
                ? share.label
                : (contestLive ? teaserNodes() : 'Share result or challenge a friend for site credit')}
            </span>
            <span className="s">
              {contestLive
                ? `Top ${CONTEST.winners} referrers win`
                : 'Send your link. You get the credit when they play.'}
            </span>
          </span>
          <ChevronRight size={17} strokeWidth={2.4} className="cv" />
        </button>
      ) : null}
      {share && contestLive ? (
        <p className="dgg-fine">
          *Contest ends {CONTEST.deadlineLabel}. Email on your account required.{' '}
          <a href="/quizzes/contest">See rules</a>.
        </p>
      ) : null}
      {/* The daily-leaderboard panel sits directly under the Share action,
          above the games grid (owner layout, 2026-07-23). */}
      {boardSlot}
      {groups.map((grp) => (
        <div className="dgg-grp" key={grp.key}>
          <div className="dgg-glabel">
            <span className="k">{grp.label}</span>
            <span className="line" />
          </div>
          <div className="dgg">
            {grp.games.map((g) => {
              const done = completed.has(g.key);
              return (
                <a
                  key={g.href}
                  href={g.href}
                  className={`dgg-t${done ? ' dgg-done' : ''}`}
                  aria-label={`${g.name} — daily puzzle${done ? ', completed today' : ''}`}
                >
                  <span className="dgg-txt">
                    <span className="dgg-nm">{g.name}</span>
                    <span className="dgg-p">{g.tag} →</span>
                  </span>
                  <img className="dgg-art" src={g.img} alt="" aria-hidden="true" />
                  {done ? <span className="dgg-check"><Check size={11} strokeWidth={3.4} /></span> : null}
                </a>
              );
            })}
          </div>
        </div>
      ))}
      {divider ? <div style={{ borderTop: '1px solid rgba(28,30,36,0.14)', marginTop: 22 }} /> : null}
    </div>
  );
}
