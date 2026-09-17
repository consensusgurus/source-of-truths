'use client';

// The back of the board: what to do now that the game is over.
//
// It carries what the old DailyEndCard carried, in the new styling (owner,
// 2026-08-14): the verdict, the IQ you gained and how the DAY is going, today's
// board, and the things you might do next. Those used to live either in a
// separate modal or in a strip BELOW the stage; the end card is where a player
// looks for them, so they moved onto it.
//
// NOTHING HERE NAVIGATES AWAY THAT DOES NOT HAVE TO (owner, 2026-08-14). The
// archive used to be a link to /daily, which threw the player off the page they
// had just finished; it opens IN the card now. The leaderboard shows three and
// expands in place to the full board with its columns. Only actually playing
// another puzzle is worth a page load.
//
// EVERY LAGGING FIGURE SHOWS "CALCULATING", never a blank or a dash (owner,
// 2026-08-14). All three reads race the player's own result write and retry for
// several seconds, so the honest state while waiting is that the number is
// being worked out, not that it is missing or zero.
//
// Driven entirely by the `options` a game passes, because the sensible set
// genuinely differs per game. NOT EVERY GAME HAS A REVEAL: a game that hides a
// solution offers one, a game whose board was never hidden offers "See the
// board" or nothing at all. The component states none of that itself.
//
// THE REVEAL RULE (owner, 2026-08-14). A finish that was not a win must not
// give its answer away on its own: the board holds what the player left until
// they press Reveal here. A WIN has nothing hidden, so its option reads 'See
// the board' instead.
//
// Props beyond title/detail/options:
//   iq         from useIqStanding  — gained, xp, rank, total, todayGained
//   board      from useDailyBoard  — { plays, rows, mine, settled, myRank,
//              field, myRow }. Drives the leaderboard AND the first rank tile,
//              so the two read one order. `rows` is only the top ten; `myRank`
//              and `myRow` are the server's answer for a player below them.
//   day        from useDayStats    — the SHARED hook: { todayXp, dayRank,
//              dayField, done, total, ready }. BOTH day figures ride the blue
//              bar: the points banked today and the rank they bought.
//              Its `total` already excludes
//              retired games, and its fetch is memoized for the page load, so
//              the end card costs no extra request.
//   streak     the game's own current streak, or null
//   missLabel  what this game counts against you, from the daily registry's
//              `miss` field: Guesses, Errors, Moves, Tries... shown as a
//              leaderboard column, because it means something different in
//              every game and a shared header would be wrong. On the six End
//              Game titles the label is 'Tries' and the FIGURE comes from the
//              row's `tries`, not `guessesUsed` (see the cell below).
//   archive    [{ num, dateLabel, href, done, score, sunday }] newest first
//   gameRank   { value, label } this game's own standing, which replaced the
//              day's puzzle count on the tiles (owner, 2026-08-14): how you
//              rank AT THIS GAME is the more interesting figure on its own
//              end card, and the day count already sits on the home slate.
//
// An option is { label, sub, kind, href } plus either href or onClick:
//   kind 'pri'  the one thing most players want next (filled blue)
//   kind 'gold' share, because gold already means share-and-win on this site
// and an optional `tone` (another | similar | replay | archive) which tints the
// button and gives it a coloured left rule. The four secondary options were
// four identical outlined boxes and read as one undifferentiated block (owner,
// 2026-08-14); the tone is what tells them apart at a glance.
import StageFinish from './StageFinish';
import React, { useEffect, useState } from 'react';
import useDailyRoster from './useDailyRoster';
import { Brain } from 'lucide-react';
import { circuitKeysFor, circuitHref, circuitName, readRunParam, runSummaryHref, isMarquee } from '@/lib/circuits';
import { DAILY_GAMES, DAILY_GAME_MAP, attemptsMode, isArcade, wantsFastRetry, dailyAttemptRule } from '@/lib/daily-games';
import { fetchDailyMe, dailyMeQuery, dailyMeIdentity } from './dailyMeClient';
import JoinLeaderboardForm from './quiz/[id]/JoinLeaderboardForm';
import { savedIdentity } from '@/lib/saved-identity';
import GameGlyph from './GameGlyph';
import SudokuCircuitPop from './circuits/SudokuCircuitPop';

function fmtTime(s) {
  if (s == null) return null;
  const n = Number(s);
  if (!Number.isFinite(n)) return null;
  return `${Math.floor(n / 60)}:${String(Math.floor(n % 60)).padStart(2, '0')}`;
}

// One shared placeholder, so a figure that is still being fetched reads the
// same wherever it appears.
function Calculating({ wide = false }) {
  return <span className={wide ? 'loft-calc wide' : 'loft-calc'}>Calculating<i>.</i><i>.</i><i>.</i></span>;
}


// THE NEW GLYPHS, not the old multicolour PNGs (owner, 2026-08-31). One stroke
// drawing in currentColor, so it takes the surface's own colour instead of
// importing a second palette. See lib/game-glyphs.js.

export default function LoftFinish({
  title, detail, iq = null, board = null, day = null, streak = null,
  missLabel: missLabelProp = null, archive = null, gameRank = null, outcome = null, options = [],
  name = null, catRank = null,
  // ── the three quiz overrides (2026-08-20) ────────────────────────────────
  // A QUIZ finishes on this same card, and three things on it are written for a
  // DAILY and are wrong on a quiz: the board is that quiz's all-time board and
  // not "today's", a replay does not put a daily streak at stake, and the four
  // day tiles ask daily-shaped questions (this game all time, category today,
  // day streak) that a quiz cannot answer. Rather than fork the card, each is an
  // optional override that DEFAULTS TO NULL, so every daily renders byte for
  // byte what it rendered before. See app/quiz/[id]/QuizLoftFinish.jsx.
  boardLabel = null,   // heading over the leaderboard
  // The SHORT form of the same fact, for a figure's label rather than a
  // heading ('all time'). Only the stage ending reads it; the Loft card's own
  // figures were replaced wholesale by `dayTiles` long before this existed.
  boardWhen = null,
  replaySub = null,    // overrides the registry's attempt-rule sentence
  dayTiles = null,     // [{ value, label }] replacing the four day tiles
  // ON THE STAGE, SAID RATHER THAN GUESSED (2026-08-31, for the quiz stage).
  //
  // The read below infers the register from the URL, which is exactly right
  // for a daily: the stage is sitewide there, so "on unless ?stage=0" is the
  // truth. It is NOT the truth on a quiz, where the stage is still a review
  // path and the same URL test would answer "yes" on a page that is painting
  // cream. So a caller that KNOWS may say, and the URL is the fallback for the
  // eighty that do not. null means "read the URL", exactly as before.
  onStage: onStageProp = null,
}) {
  // THE MISS LABEL FALLS BACK TO THE REGISTRY (owner, 2026-09-01). All 80
  // clients hardcode this prop, which is 80 hand-kept copies of one field in
  // lib/daily-games.js, and Calc proved what that costs: it passes nothing, so
  // its board silently dropped the Tries column it is entitled to. The prop
  // still wins where it is given (every one of the 63 that pass it matches the
  // registry exactly, verified by scripts/verify-miss-labels.mjs), so this
  // changes no existing game; it only fills the gap when a client forgets.
  //
  // Resolved by DISPLAY NAME because that is what this card is handed — see the
  // registry-key-is-not-route-name rule in CLAUDE.md for why guessing a key
  // here would be worse. The 80 names are unique and every client's `name`
  // resolves to the right row; the verifier asserts both.
  const missLabel = missLabelProp
    || (name ? ((DAILY_GAMES.find((g) => g.name === name) || {}).miss || null) : null);
  // THE ENDING IS A CURTAIN on the stage. Declared FIRST so hook order never
  // changes, and RETURNED further down, after every other hook has run: an
  // early return above them would break the rules of hooks the moment a game
  // finishes. Read from the URL for the same reason every other stage flag is:
  // the server cannot know it.
  // THE ENDING FOLLOWS THE PAGE. This was '?stage=1' while the stage was a
  // review path; once the stage went sitewide it left every finished game
  // showing the LOFT ending on a stage page — a cream card at the foot of a
  // near-black one. It matches lib/stage.js now: on unless '?stage=0'.
  const [urlStage, setUrlStage] = useState(false);
  useEffect(() => {
    try { setUrlStage(new URLSearchParams(window.location.search).get('stage') !== '0'); } catch (e) { setUrlStage(true); }
  }, []);
  const onStage = onStageProp == null ? urlStage : !!onStageProp;
  const [showAll, setShowAll] = useState(false);
  // THE FAST RETRY GATE (owner, 2026-08-19). False until the player asks for
  // the full card, and only ever consulted on the games that are meant to be
  // replayed (see `fastRetry` below). It resets on its own: a replay unmounts
  // this card with the board it came from.
  const [showCard, setShowCard] = useState(false);
  // CLAIM YOUR NAME (owner build, 2026-08-20). The ladder pays REGISTERED
  // positions only, and the finish is where the attention is, so a guest's
  // full card carries the canonical JoinLeaderboardForm inline (see the band
  // below the leaderboard). Identity is read in an effect: localStorage does
  // not exist on the server.
  const [guest, setGuest] = useState(false);
  const [claimOpen, setClaimOpen] = useState(false);
  const [claimed, setClaimed] = useState(false);
  useEffect(() => {
    if (!savedIdentity().username) setGuest(true);
  }, []);
  // THE PAGE UNDER THE CARD NEEDS TO KNOW THE CARD IS UP (owner, 2026-08-26).
  // GamePanel's "See stats, archive, leaderboard, and more" sits at the foot of
  // every game page and offers exactly what this card already carries, so it
  // hides while this is mounted. An event rather than a prop drilled through 70
  // game clients, and fired from here rather than measured from there because
  // this component is the one that knows. Every branch of this card renders
  // .loft-back, including the fast-retry panel and the circuit run card, so
  // mount is the right moment for all of them.
  useEffect(() => {
    const fire = (open) => {
      try { window.dispatchEvent(new CustomEvent('sot:loft-finish', { detail: { open } })); }
      catch (e) {}
    };
    fire(true);
    return () => fire(false);
  }, []);
  // WHICH RUN is this finish part of — the marquee, one of the thirteen skill
  // circuits, or none? A circuit ID, not a boolean: it read the ?five=1 flag
  // alone until 2026-08-18, so finishing a game inside a skill circuit fell
  // through to the ordinary end card and the run silently ended there.
  //
  // Read in an effect, never during render: the server has no window and no
  // idea what today is in Eastern, so deriving either during render makes the
  // first client paint disagree with the server's. Null for the first paint,
  // which is the correct answer for every ordinary finish.
  const [inRun, setInRun] = useState(null);
  const [runDay, setRunDay] = useState(null);
  const [runPer, setRunPer] = useState(null);
  const [runSecs, setRunSecs] = useState(6);
  const [runStay, setRunStay] = useState(false);
  useEffect(() => {
    setInRun(readRunParam());
    try { setRunDay(new Date().toLocaleDateString('en-CA', { timeZone: 'America/New_York' })); }
    catch (e) { setRunDay(new Date().toISOString().slice(0, 10)); }
  }, []);
  useEffect(() => {
    if (!inRun || !runDay) return undefined;
    const { anonId, email } = dailyMeIdentity();
    if (!anonId && !email) return undefined;
    let alive = true;
    // The shared client, so this joins the request the page is already making
    // rather than adding one. { fresh: true } because the row this finish just
    // wrote is the whole point of asking.
    const load = () => {
      fetchDailyMe(dailyMeQuery({ anonId, email }), { fresh: true })
        .then((d) => { if (alive && d && d.perGame) setRunPer(d.perGame); })
        .catch(() => {});
    };
    load();
    window.addEventListener('sot:daily-updated', load);
    return () => { alive = false; window.removeEventListener('sot:daily-updated', load); };
  }, [inRun, runDay]);
  const [openArchive, setOpenArchive] = useState(false);
  // BROWSE EVERY GAME BY CATEGORY (owner). The next-up tiles offer a handful;
  // this opens the whole roster, starting on the category just played, because
  // that is the one the reader is already in the mood for.
  const [browse, setBrowse] = useState(false);
  // ONE loading state for the whole IQ bar, with a ceiling (owner, 2026-08-17).
  // The bar itself carries the why. Ready means the gain AND the day figures
  // are in, because the bar prints all three on one nowrap row.
  const iqReady = !!(iq && iq.gained != null) && !!(day && day.ready);
  // THE CEILING IS ANCHORED TO THE MOUNT, not to iqReady (2026-08-25). It used
  // to start only while the IQ read was outstanding and to clear the moment that
  // one landed, which was right while the IQ bar was the only thing waiting. The
  // block below waits on the RANK TILES too, and those come off three other
  // reads: if the IQ lands at three seconds and a tile read never does, a ceiling
  // that has already been cleared can never fire and the card says Calculating
  // for good. One timer from the finish covers every figure on the card.
  //
  // useIqStanding is five attempts over ~10s and then stops for good, which is
  // what sets the length.
  const [iqStalled, setIqStalled] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setIqStalled(true), 11000);
    return () => clearTimeout(t);
  }, []);
  const iqShow = iqReady || iqStalled;
  // ALWAYS ON since 2026-08-23, where it used to wait for the browse toggle:
  // the category row under the handoff needs the same roster, and it renders
  // without being asked for. It is one /api/quiz/daily-me read, and a fresh
  // caller now joins one already in flight (see fetchDailyMe), so on a card
  // whose client is asking the same question in the same tick this costs no
  // extra request at all.
  const roster = useDailyRoster({ active: true });
  const [pickCat, setPickCat] = useState(null);
  const myCat = (catRank && catRank.cat)
    || (roster.cats.find((c) => c.games.some((g) => g.name === name)) || {}).cat
    || (roster.cats[0] || {}).cat
    || null;
  const shownCat = pickCat || myCat;
  const shownGames = (roster.cats.find((c) => c.cat === shownCat) || {}).games || [];

  // THE GAME'S OWN KEY. LoftFinish is handed a display `name`, not a key, so
  // it is matched on that; names are unique across the registry. Declared up
  // here because the replay copy directly below needs it.
  const selfKey = (DAILY_GAMES.find((g) => g.name === name) || {}).key || null;
  const attemptRule = dailyAttemptRule(selfKey);

  // THE REPLAY SUB-LABEL COMES FROM THE REGISTRY, never from the client
  // (fixed 2026-08-18). All 65 clients pass the literal 'This puzzle again,
  // unscored', which stopped being true for the six End Game titles on
  // 2026-08-12 when their boards moved to ranking on attempts-to-solve, and
  // was never true for the two Arcade games, which take your best run of the
  // day. So the card was telling players a retry was pointless on exactly the
  // games where retrying is the whole design. dailyAttemptRule already owns
  // that sentence per category, so rewriting it here corrects every game from
  // one place instead of eight files that drift on the next rule change.
  const optsRaw = options.filter(Boolean)
    .map((o) => (o.tone === 'replay' ? { ...o, sub: replaySub || attemptRule.replay } : o));
  // THE ROW ORDER IS DECIDED HERE, not by the order a client lists its options
  // (owner): a real Reveal, or Return to board, leads the card BESIDE Replay,
  // then Share, then Play another beside the Archive, and the browse toggle
  // beside Back to main at the foot. Ordering by tone means a client only
  // declares what it offers and never has to know the layout.
  //
  // 'reveal' AND 'board' ARE TWO DIFFERENT TILES (owner, 2026-08-19). One tone
  // used to do both jobs: the same tile rendered "Reveal answer" to a player who
  // MISSED it, and "Return to board" to one who solved it, and "Return to board"
  // on the thirteen games that never hand the answer over at all (the six End
  // Game titles, Babel, the two Arcade games, chomp, parker, rung and taire,
  // which is the KEEPS_ANSWER set). Only the first of those is a reveal, and
  // only the first earns the lead slot: showing a player what they missed is
  // the one thing they want before anything else, while going back to a board
  // they have already solved is an ordinary option and stays where it was,
  // beside Replay. Because the two shared a tone, this component could not tell
  // them apart and could not promote one without promoting the other.
  //
  // So a client that can do both branches its TONE on the same condition its
  // label already branches on (tone: won ? board : reveal), and a
  // client that never reveals passes 'board' outright. All 65 do one or the
  // other; a tone this table does not know still falls to 5 as before.
  // THE LEAD TILE PAIRS WITH REPLAY, ABOVE THE GOLD SHARE (owner report,
  // 2026-08-30: "replay and reveal answer should split a line"). Reveal ranked
  // above the gold and Replay below it, so the leading run was Reveal ALONE.
  // A wide tile does not merely take a row, it CUTS the half tiles into
  // separate runs (see the per-run parity note below), so a run of one is odd
  // and the parity rule widened Reveal to fill it. That left the card spending
  // a full row on Reveal, another on Share, and a third wide row on Back to
  // main, because the five tiles below the gold were odd too: five rows for
  // seven options, three of them a single tile.
  //
  // Ranking reveal, board and replay ALL above the gold makes the leading run a
  // clean pair, which in turn leaves Play another, the Archive, the browse
  // toggle and Back to main as a run of four. Four rows, and the only wide tile
  // is the gold Share itself. Reveal still leads the card, and Return to board
  // still sits beside Replay, so the 2026-08-19 split above is unchanged.
  //
  // Seven clients (calc, mercury, polka, towers, knight, sixes, niche) declared
  // that tile kind:'pri', which made it wide by declaration and so unable to
  // pair with anything. The kind came off all seven in the same push. It cost
  // them no styling: .loft-opt.t-reveal is declared AFTER .loft-opt.pri at
  // equal specificity, so the purple tint was already winning and 'pri' was
  // doing nothing but forcing the full width.
  const RANK = { reveal: -3, board: -2, replay: -1, another: 3, similar: 4, main: 9 };
  // A declared tone always wins over 'kind', so the gold Share keeps rank 0
  // because it declares no tone, which now puts it directly under the lead pair
  // and above Play another. No gold tile declares a tone, and none should:
  // giving one a tone would silently move it out of that slot.
  const rankOf = (o) => (RANK[o.tone] != null ? RANK[o.tone] : (o.kind === 'gold' ? 0 : 5));
  const sorted = [...optsRaw].sort((a, b) => rankOf(a) - rankOf(b));
  // 'main' is held back so the Archive button, which this component renders
  // itself, can sit to its LEFT.
  const mains = sorted.filter((o) => o.tone === 'main');
  // UP NEXT LEADS THE CARD (owner, 2026-08-17). The 'similar' option comes OUT
  // of the options grid and renders as a band directly under the verdict, above
  // the IQ bar: it was a half tile in the third row, below the verdict, the IQ
  // bar, four day tiles and the whole board, so a finisher passed two exits
  // before reaching the one thing that hands them forward.
  //
  // No game client changes, because all 65 already pass the identical shape:
  //   { tone: 'similar', label: 'Play similar', sub: `${name} · ${tag}`, href }
  // so the game's name and tag are read back off `sub`. A client that passes a
  // `sub` with no middot still renders, using the label as the heading.
  //
  // Parity needs no help: dropping one item from `narrow` leaves the existing
  // tail-parity rule to widen the new last half tile. `RANK.similar` stays so
  // a client that somehow keeps it in the grid still sorts where it used to.
  const simOpt = sorted.find((o) => o.tone === 'similar') || null;
  const simBits = simOpt && simOpt.sub ? String(simOpt.sub).split('\u00b7') : [];
  const simName = simBits.length > 1 ? simBits[0].trim() : null;
  const simTag = simBits.length > 1 ? simBits.slice(1).join('\u00b7').trim() : null;

  // MORE OF WHAT YOU JUST PLAYED (owner, 2026-08-23: "it took seven clicks to
  // get to the next logic game", and "users should have an easier time
  // continuing with their game type"). The card named ONE same-category game in
  // the Up next band and put the rest of the category at the FOOT of the card
  // behind a toggle, so a reader who did not want that one guess had to scroll
  // past the IQ bar, today's board and the whole options grid before another
  // Logic title was even visible. This is the rest of the category, unplayed,
  // one tap each, directly under the handoff it widens.
  //
  // Up next's own game is dropped rather than repeated: it is the row directly
  // above this one, matched on NAME, which is unique across the registry and is
  // the only identity the option carries (its sub line is "Name \u00b7 tag").
  // Games already finished today are dropped rather than greyed, because this
  // is a shortcut; the browse panel at the foot of the card still lists the
  // whole category with its Played marks for anyone who wants that.
  const catNext = ((roster.cats.find((c) => c.cat === myCat) || {}).games || [])
    .filter((g) => g.key !== selfKey && g.name !== name && !g.played
      && g.name !== simName && !(simOpt && g.name === simOpt.label))
    .slice(0, 6);
  const opts = sorted.filter((o) => o.tone !== 'main' && o.tone !== 'similar');
  // Which options span the full width: every primary, plus the last of any run
  // of half tiles that would otherwise be odd.
  const wide = new Set();
  opts.forEach((o, i) => { if (o.kind === 'pri' || o.kind === 'gold') wide.add(i); });
  // The Archive, the browse toggle and the held-back 'main' options are half
  // tiles too, so they take part in the same pairing; otherwise the bottom row
  // breaks apart.
  const archiveIsNarrow = !!(archive && archive.length);
  const browseIsNarrow = !!(roster.cats && roster.cats.length);
  // PARITY IS PER RUN, NOT OVER THE WHOLE SET (owner report, 2026-08-19: the
  // Sixes card came out with a lone Replay and a lone Back to main, each with a
  // dead slot beside it). .loft-opts is a plain two-column grid with no
  // grid-auto-flow:dense, so a wide tile does not just take a row, it CUTS the
  // half tiles into separate runs and each run pairs on its own. Counting every
  // half tile once, globally, therefore proves nothing: the old rule read
  // narrow 2 + tail 3 = 5, widened one tile to make 4, and reported itself
  // satisfied while leaving runs of 1 and 3.
  //
  // Worse, the tile it widened was the LAST of the leading run, which is the
  // one place a widen can do harm: on Sixes that was 'Play another', so a run
  // of [Replay, Play another] that already paired cleanly was split, turning
  // one hole into two. Sixes hits it because it declares its Reveal option as
  // kind:'pri' with no tone, so that tile is both wide (out of the half-tile
  // pool) and rank 5 (sorted to the foot of the grid), which is what puts a
  // wide tile in the middle of the run in the first place. Crux is the same
  // shape and had the same two holes.
  //
  // So walk the tiles in RENDER order, group the contiguous half tiles, and
  // widen the last tile of any group with an odd count. Widening the tail of a
  // run can only shorten that run, never split one, so this is provably
  // hole-free at every option set (verified across all 65 clients).
  const flow = [
    ...opts.map((_, i) => ({ id: i, narrow: !wide.has(i) })),
    ...(archiveIsNarrow ? [{ id: 'archive', narrow: true }] : []),
    ...(browseIsNarrow ? [{ id: 'browse', narrow: true }] : []),
    ...mains.map((_, i) => ({ id: `m${i}`, narrow: true })),
  ];
  // The three tail tiles are rendered by this component rather than by a client,
  // so their widening cannot live in `wide` (which is indexed into `opts`).
  const wideTail = new Set();
  let runStart = -1;
  for (let i = 0; i <= flow.length; i += 1) {
    if (i < flow.length && flow[i].narrow) { if (runStart < 0) runStart = i; continue; }
    if (runStart >= 0) {
      if ((i - runStart) % 2 === 1) {
        const id = flow[i - 1].id;
        if (typeof id === 'number') wide.add(id); else wideTail.add(id);
      }
      runStart = -1;
    }
  }

  // REPLAY PUTS THE READER BACK AT THE TOP OF THE PAGE (owner report,
  // 2026-08-18: "you can't actually replay Paths despite the button for
  // replay existing"). Both legacy replay surfaces already did this and said
  // why in the same words: goReplay in DailyEndCard and goReplay in
  // DailyGamesGrid each call the caller's resetGame and then scrollTo(0), "so
  // they land on the fresh board rather than halfway down the leaderboard".
  // This card was written fresh and dropped it, so when the whole roster moved
  // to the Loft format all 63 games with a Replay button lost the scroll. That
  // is the fifth-mirror trap this component has hit before: the behaviour is
  // documented against DailyEndCard, and this is the component on screen.
  //
  // It is not cosmetic, because a replay UNMOUNTS this card and, on any game
  // that gates a fresh board behind a start tile, unmounts the board with it.
  // Paths renders its entire board inside {!preStart && ...}, so the page
  // collapses from ~2300px to ~840px and a reader parked where the card used
  // to be is left on the page tail with no board and no Start button in sight.
  // Nothing appears to have happened. Paths is the worst case because its own
  // "Show a cheapest network" scrolls the reader DOWN to the board first, but
  // every game with a start gate has the same hole.
  //
  // Scoped to tone 'replay', so no other option's behaviour changes.
  const fire = (o) => (e) => {
    if (o.onClick) o.onClick(e);
    if (o.tone !== 'replay' || typeof window === 'undefined') return;
    try { window.scrollTo({ top: 0, behavior: 'smooth' }); }
    catch (err) { window.scrollTo(0, 0); }
  };

  const rows = board && Array.isArray(board.rows) ? board.rows : [];
  const mine = board ? board.mine : null;
  const isMe = (r) => mine && String(r.username || '').toLowerCase() === mine;
  const shown = showAll ? rows : rows.slice(0, 3);
  const myIdx = rows.findIndex(isMe);
  // THE FIRST TILE RANKS YOU ON THE BOARD PRINTED BELOW IT, not on the day's
  // combined board (owner, 2026-08-15). It used to show `day.dayRank`: your
  // place among everyone who banked ANY IQ today across all the dailies, which
  // is a real figure but reads as nonsense two inches above a header that says
  // "Today's board" and lists eight players. An owner report asked how a field
  // of 8 could put them 21st; it could not, and the tile was answering a
  // different question. The day-wide standing is still on the card as
  // "+N IQ today". Taken off the RENDERED rows so the tile and the row numbers
  // below can never disagree.
  //
  // BUT THE RENDERED ROWS ARE ONLY THE TOP TEN (owner, 2026-08-16), so an index
  // into them answers nothing for the player who came 25th: it returned -1 and
  // the tile printed a dash, which reads as "you did not place" rather than the
  // truth, which is that they placed outside the ten shown. The API now returns
  // the placement on the FULL board of that same axis, so `myRank` prefers it
  // and keeps the index only as the fallback for a stale payload. The two still
  // cannot disagree, because the server ranks the very board printed below.
  const myRank = board && board.myRank != null
    ? board.myRank
    : (myIdx >= 0 ? myIdx + 1 : null);
  const field = board && board.field != null ? board.field : null;
  // ONE CALCULATING BLOCK OVER BOTH FIGURES (owner, 2026-08-25). The IQ bar
  // carried its own single loading line and each of the four tiles below carried
  // its own placeholder, so a finish opened on a bar reading Calculating above a
  // row of four tiles each reading Calculating, five copies of one sentence,
  // resolving one at a time as four separate reads came back. They are one
  // statement of one fact, so while ANY of them is outstanding the card says it
  // once, in a block the size of the two it stands in for, and swaps to every
  // figure together.
  //
  // A TILE IS READY WHEN ITS READ HAS ANSWERED, which is not the same as its
  // having a number. A player placed outside the board, a game with no all-time
  // standing yet and a category read that resolves to null are all settled
  // answers, and each prints a dash. Waiting for a VALUE would hold the block
  // open for the whole ceiling on a legitimate blank.
  //
  // A QUIZ passes dayTiles, whose values are computed by its own caller and
  // carry no readiness, so that card waits on the IQ bar alone exactly as before.
  const tilesReady = dayTiles
    ? true
    : (!!(board && (myRank != null || board.settled))
      && !!(gameRank && gameRank.value != null)
      && !!(catRank && catRank.ready));
  const figuresShow = (iqReady && tilesReady) || iqStalled;
  // Pin the player's own row under the top three when it is not already up
  // there, whether it came out of the ten or off the server.
  const inShown = myIdx >= 0 && (showAll || myIdx < 3);
  const myRow = !inShown && myRank != null
    ? (myIdx >= 0 ? rows[myIdx] : (board && board.myRow) || null)
    : null;

  const lbRow = (r, i) => (
    <div key={i} className={`loft-lbr${i === 0 ? ' first' : ''}${isMe(r) ? ' me' : ''} cols`}>
      <span className="r">{i + 1}</span>
      <span className="n">{r.username || 'Anonymous'}</span>
      <span className="s">{r.score}</span>
      {/* END GAME prints TRIES here (owner, 2026-08-12): its registry label is
          'Tries' and its board ranks on how many runs the solve took, not on
          the per-run error count, which is 0 on every clean solve and printed
          a column of zeroes. Every other game has no `tries` and falls through
          to guessesUsed, so their column is unchanged. Same expression as
          DailyEndCard and DailyBoardPanel: keep the three in step. */}
      {missLabel ? <span className="c">{r.tries != null ? r.tries : (r.egTier != null ? '—' : (r.guessesUsed == null ? '—' : r.guessesUsed))}</span> : null}
      <span className="c">{fmtTime(r.timeElapsed) || '—'}</span>
    </div>
  );

  // THE ARCHIVE TAKES OVER THE WHOLE CARD (owner, 2026-08-14). It used to render
  // as a panel BELOW the options, which broke the layout outright: .loft-opts is
  // a flex child with flex:1, so it stretches to fill the card and the archive
  // was laid over the top of it, date rows sitting on the option buttons. A list
  // of fourteen dates also wants the whole face rather than a squeezed strip
  // under six buttons. So it replaces the content instead of joining it, and
  // Back returns.
  // ── the run ───────────────────────────────────────────────────────────────
  const runSelf = selfKey;
  const runMembers = inRun && runDay ? circuitKeysFor(inRun, runDay) : [];
  const runName = circuitName(inRun);
  const runMarq = isMarquee(inRun);
  // Where this run ends. Declared up here because the auto-advance effect
  // below names it in its dependency array, and a dep array is evaluated
  // during RENDER — a const declared under the hook that names it is a
  // temporal dead zone crash that esbuild accepts.
  const runSummary = runSummaryHref(inRun);
  // A stale or hand-typed flag must not put a game inside a run that does
  // not contain it.
  const runActive = runMembers.length >= 2 && !!runSelf && runMembers.includes(runSelf);
  // PLAYED, not SOLVED, and the game just finished always counts: its row may
  // not be readable yet, but the player is looking at its result.
  const runDone = new Set(runActive ? [runSelf] : []);
  if (runActive && runPer) {
    for (const [k, v] of Object.entries(runPer)) if (!(v && v.abandoned)) runDone.add(k);
  }
  const runN = runMembers.filter((k) => runDone.has(k)).length;
  // Only call a run complete once the day's completions have actually landed,
  // or the first finish of the run reports 1 of 1 and sends the player to the
  // summary after one game.
  const runComplete = runActive && !!runPer && runN === runMembers.length;
  const runNextKey = runActive ? (runMembers.find((k) => k !== runSelf && !runDone.has(k)) || null) : null;
  const runNext = runNextKey ? DAILY_GAME_MAP[runNextKey] : null;

  // The board is the thing the run was FOR, so completing the fifth goes there
  // rather than offering a button and waiting. Six seconds with a visible count
  // and an escape hatch, the same shape as the card's own 30s auto-advance. The
  // THIS WHOLE BLOCK MUST STAY ABOVE THE ARCHIVE EARLY RETURN (fixed
  // 2026-08-17). It used to sit below it, with a comment arguing the effect
  // is unconditional. It is, and that is not the test: an early return ABOVE
  // a hook makes the hook conditional, so opening the archive rendered one
  // fewer hook than the render before it and React threw "Rendered fewer
  // hooks than expected". The computations move with the effect because the
  // dependency array is evaluated during RENDER, so a hook placed above the
  // consts it names is a temporal dead zone crash that esbuild accepts.
  // ── REPLAY UNTIL VICTORY (owner, 2026-08-18) ──────────────────────────────
  // The six End Game titles never hand the answer over and their boards rank
  // on how many runs the solve took, so a retry is not a practice run, it is
  // the next attempt and it is scored. The card offered no way to take one
  // inside a run, which is why a lost position ended the game for good.
  //
  // THE GATE: an unsolved End Game does not hand you forward. The next game
  // waits until the position falls. That is the owner's call over merely
  // offering both, and the honest cost is that a player who cannot crack a
  // mate-in-3 cannot finish the circuit — so LEAVING THE RUN stays on the
  // card as the way past, and it must never be removed from the alt row.
  //
  // Arcade games get the replay control but NOT the gate: they take the best
  // run of the day, so another go can only help, but there is nothing to
  // solve. Every other category keeps the first attempt, so offering a replay
  // there would promise something the board does not honour.
  const replayOpt = optsRaw.find((o) => o.tone === 'replay' && typeof o.onClick === 'function') || null;
  // THE RUN CARD MUST STILL TURN THE BOARD OVER (owner report, 2026-08-21).
  // The run card replaces the option tiles wholesale, which also removed the
  // one control that flips the stage back to the board: a player who pressed
  // Reveal inside a circuit (/jesters?circuit=pencil) ended the day, the
  // board filled with the answer BEHIND this card, and nothing on the card
  // could show it. So the client's own reveal/board option is carried onto
  // the run card as a secondary control. Same tone contract as the full card
  // ('reveal' shows what was missed, 'board' returns to the player's own
  // board); the KEEPS_ANSWER games never pass 'reveal', so nothing renders
  // here that the full card would not offer.
  const boardOpt = optsRaw.find((o) => (o.tone === 'reveal' || o.tone === 'board') && typeof o.onClick === 'function') || null;
  const runSolved = outcome === 'won';
  const runRetry = runActive && !!replayOpt && !runSolved && (!!attemptsMode(runSelf) || isArcade(runSelf));
  const runUnsolvedEG = runActive && !!attemptsMode(runSelf) && !runSolved;
  const runGate = runUnsolvedEG && !!replayOpt && !!runNextKey;
  // THE FULL CARD IS THE WRONG ANSWER TO AN UNSOLVED POSITION (owner,
  // 2026-08-19). On the eight games where a replay genuinely counts -- the six
  // End Game titles, which rank you on how many runs the solve took, and the
  // two Arcade games, which take your best run of the day -- the thing the
  // player wants next is another go at it, now. What they got was a page of
  // furniture: the verdict, an IQ bar, four day tiles, the whole leaderboard,
  // the archive and eight tiles of somewhere else to be, with Replay sitting
  // as one half tile part way down it. Every other daily keeps your first
  // attempt, so there the card IS the right answer and nothing changes.
  //
  // So an unsolved finish on those eight turns the board over to two controls
  // and nothing else. The card is not gone, it is one press away, and it is
  // the same card: pressing 'Show End Game Card' swaps this panel for the
  // ordinary return below, in the same slot, with every figure it always had.
  //
  // Scoped to UNSOLVED (outcome !== 'won', which is `runSolved`): a solve has
  // nothing left to come back for, so it flips straight to the card as before.
  // Four's draw counts as unsolved here, deliberately -- the win is still
  // sitting in the position, which is exactly the argument for another run.
  // An Arcade run can never be failed, so its 'part' verdict reaches this too,
  // which is right: runs there are unlimited and another one can only help.
  //
  // The test is the registry's own, never a hardcoded list: the two categories
  // qualify by default and any other game opts in with `fastRetry: true` on its
  // row (see wantsFastRetry in lib/daily-games, and Chomp, which keeps only its
  // first attempt but whose free re-deal is the whole design). It also needs a
  // real replay handler: a client that passes no replay option has nothing to
  // gate. The panel's own copy comes from dailyAttemptRule either way, so an
  // opted-in game states what its replay is worth and cannot oversell it.
  const fastRetry = !!replayOpt && !runSolved && wantsFastRetry(selfKey);
  // THE VERDICT IS THE PLAYER'S RESULT, not the game's status line (owner,
  // 2026-08-31). The clients pass "Not solved", which renders as "Four not
  // solved": accurate, and a description of the puzzle rather than of what just
  // happened to the person reading it. On a curtain, where it is the only
  // sentence on screen, it says the outcome outright.
  //
  // It reads the OUTCOME rather than a list of games, so nothing here can claim
  // a loss that did not happen. An Arcade run cannot be failed at all (blocks
  // and sweep pass 'part' whatever the run did), and Four's draw is the only
  // other 'part' that reaches this.
  //
  // IT IS COMPUTED HERE, ABOVE BOTH RETURNS, because the retry curtain and the
  // full card are the same finish and must say the same word: scoped to the
  // panel alone, pressing 'Show end game card' changed the verdict from 'You
  // lost' to 'Not solved' on the way through. It is keyed on wantsFastRetry
  // rather than on `fastRetry`, so a game with no replay handler still reads
  // right -- the wording is about the result, not about the control.
  const retryVerdict = (!runSolved && wantsFastRetry(selfKey))
    ? (isArcade(selfKey) ? 'Game over' : (outcome === 'part' ? 'You tied' : 'You lost'))
    : null;
  // A run whose LAST game is an unsolved End Game does not auto-advance to the
  // summary: bouncing the player off the board six seconds after telling them
  // to play it again is the card arguing with itself. The summary control is
  // still there, it just waits to be pressed.
  const runAuto = runComplete && !runStay && !runUnsolvedEG;
  useEffect(() => {
    if (!runAuto) return undefined;
    if (runSecs <= 0) {
      if (typeof window !== 'undefined') window.location.href = runSummary;
      return undefined;
    }
    const t = setTimeout(() => setRunSecs((s) => s - 1), 1000);
    return () => clearTimeout(t);
  }, [runAuto, runSecs, runSummary]);

  // One nudge only: the FIRST guest finish opens the claim form outright,
  // every later one gets the collapsed band. The key is consumed only when the
  // band is actually on screen; the run card and the fast-retry panel never
  // render it, so a finish inside a circuit must not burn the nudge. The
  // render-scope const sits ABOVE the effect that names it, per the TDZ rule
  // further up.
  const claimBandShown = guest && !claimed && !openArchive && !runActive && !(fastRetry && !showCard);
  useEffect(() => {
    if (!claimBandShown) return;
    try {
      if (!localStorage.getItem('sot_claim_nudged')) {
        localStorage.setItem('sot_claim_nudged', '1');
        setClaimOpen(true);
      }
    } catch (e) {}
  }, [claimBandShown]);

  if (openArchive && archive && archive.length) {
    return (
      <div className="loft-back">
        <div className="loft-backin">
          <div className="loft-res">
            <b>{name ? `${name} Archive` : 'Archive'}</b>
            {/* A scrolled list does not show its own length, so the header
                states it (owner, 2026-08-17). */}
            <s>{archive.length} puzzle{archive.length === 1 ? '' : 's'}</s>
            <button type="button" className="loft-back-btn" onClick={() => setOpenArchive(false)}>&#8592; Back</button>
          </div>
          <div className="loft-arch">
            {archive.map((a) => (
              <a key={a.num} className={`loft-archr${a.done ? ' done' : ''}${a.sunday ? ' sun' : ''}`} href={a.href}>
                <span className="d">
                  {a.dateLabel}
                  {a.sunday ? <i className="sunchip">Sunday</i> : null}
                </span>
                <span className="no">No. {a.num}</span>
                {/* Played is stated, not implied. A score alone reads as noise
                    next to a row that just says Play. */}
                <span className="v">{a.done
                  ? <>{a.score != null ? <b>{a.score}</b> : null}<em>Played</em></>
                  : 'Play'}</span>
              </a>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // IN A RUN, THIS IS THE WHOLE CARD. No IQ bar, no day tiles, no leaderboard,
  // no options grid, no browse-every-puzzle: the verdict, where you are in the
  // five, and one control. Five ordinary finishes in a row is the same page of
  // furniture five times, and every block on it points away from the run the
  // player is in the middle of. The summary arrives once, at /daily-five.
  if (runActive) {
    return (
      <div className="loft-back">
        <SudokuCircuitPop ready self={selfKey} />
        <div className="loft-backin">
          <style dangerouslySetInnerHTML={{ __html: `
            .d5f-run{display:flex;align-items:center;gap:10px;margin:12px 0 2px;}
            .d5f-eye{font-size:9.5px;font-weight:800;letter-spacing:.13em;text-transform:uppercase;color:#a98a2e;white-space:nowrap;}
            /* Gold for the marquee, blue for a skill circuit, green once the
               run is done — the console band's own three-state rule. */
            .d5f-run.circ .d5f-eye{color:#2563eb;}
            .d5f-run.done .d5f-eye,.d5f-run.circ.done .d5f-eye{color:#15803d;}
            .d5f-pips{display:flex;gap:4px;flex:1;min-width:0;}
            .d5f-pips span{flex:1;height:6px;border-radius:3px;background:#dbe2ee;}
            .d5f-pips span.on{background:#10b981;}
            .d5f-pips span.now{background:#2563eb;}
            .d5f-alt{display:flex;align-items:center;justify-content:center;gap:18px;margin-top:14px;}
            .d5f-alt a{font-size:11.5px;font-weight:800;letter-spacing:.03em;color:#646c7a;text-decoration:none;}
            .d5f-alt a:hover{color:#0b0d12;}
            /* The retry control borrows loft-next's shape so it reads as the
               card's one primary action, and takes the blue so it is never
               mistaken for the green hand-off it is standing in for. */
            .loft-next.d5f-retry{background:rgba(37,99,235,.10);width:100%;text-align:left;
              border:0;font-family:inherit;cursor:pointer;}
            .loft-next.d5f-retry:hover{background:rgba(37,99,235,.16);}
            .loft-next.d5f-retry .go{background:#2563eb;}
            .d5f-gate{margin-top:8px;font-size:11.5px;font-weight:700;line-height:1.35;color:#646c7a;text-align:center;}
            .d5f-again{display:block;width:100%;margin-top:9px;padding:9px;border-radius:9px;
              border:2px solid #dbe2ee;background:#f7f8fa;color:#3f4756;font-family:inherit;
              font-weight:800;font-size:12px;cursor:pointer;}
            .d5f-again:hover{background:#eef1f6;}
            .d5f-again i{font-style:normal;font-weight:700;color:#8a92a6;}
          ` }} />
          <div className={outcome ? `loft-res loft-res-${outcome}` : 'loft-res'}><b>{name ? `${name} ${title.charAt(0).toLowerCase()}${title.slice(1)}` : title}</b><s>{detail}</s></div>

          <div className={`d5f-run${runMarq ? '' : ' circ'}${runComplete ? ' done' : ''}`}>
            <span className="d5f-eye">{runName} {'\u00b7'} {runN} of {runMembers.length}</span>
            <span className="d5f-pips">
              {runMembers.map((k) => (
                <span key={k} className={runDone.has(k) ? 'on' : (k === runNextKey ? 'now' : '')} />
              ))}
            </span>
          </div>

          {/* THE BOARD FOR THE GAME JUST FINISHED (owner, 2026-08-18). Crossing
              five games, a player used to see no result but their own. This is
              the top three plus their own row and nothing else: the card is
              short on purpose. The RUN's combined standings are deliberately
              not here — they are provisional until everyone finishes, and
              /daily-five exists to show them once. Rendered by the SAME lbRow
              the full card uses, so the two can never disagree about a column
              (End Game prints Tries there, everything else its own miss). */}
          <div className="loft-lb">
            <div className="h">
              <b>{name ? `${name} \u00b7 today` : 'Today\u2019s board'}</b>
              {board && board.plays ? <s>{Number(board.plays).toLocaleString()} played</s> : null}
            </div>
            {!board ? <Calculating wide /> : null}
            {board && !rows.length ? <span className="loft-empty">Nobody has finished this one yet.</span> : null}
            {rows.length ? (
              <div className="loft-lbr head cols">
                <span className="r" />
                <span className="n">Player</span>
                <span className="s">Score</span>
                {missLabel ? <span className="c">{missLabel}</span> : null}
                <span className="c">Time</span>
              </div>
            ) : null}
            {rows.slice(0, 3).map(lbRow)}
            {myRow ? lbRow(myRow, myRank - 1) : null}
          </div>

          {runGate ? (
            /* GATED. Replay IS the hand-off here: there is no Next control to
               press until the position falls. */
            <>
              <button type="button" className="loft-next d5f-retry" onClick={fire(replayOpt)}>
                <span className="t">
                  <span className="eb">Not solved {'\u00b7'} the run waits</span>
                  <span className="nm">Play it again</span>
                  <span className="tg">{attemptRule.replay}</span>
                </span>
                <span className="go">Replay</span>
              </button>
              <div className="d5f-gate">
                Solve it to move on to {runNext ? runNext.name : 'the next game'}.
              </div>
            </>
          ) : runComplete ? (
            <a className="loft-next" href={runSummary}>
              <span className="t">
                <span className="eb">Run complete</span>
                <span className="nm">See how the run went</span>
                <span className="tg">The board for all {runMembers.length}, and every result</span>
              </span>
              <span className="go">{runAuto ? (runSecs > 0 ? `Opening in ${runSecs}s` : 'Opening\u2026') : 'Open'}</span>
            </a>
          ) : runNext ? (
            <a className="loft-next" href={circuitHref(runNextKey, inRun)}>
              <span className="t">
                <span className="eb">Next in the run {'\u00b7'} {runN + 1} of {runMembers.length}</span>
                <span className="nm">{runNext.name}</span>
                {runNext.tag ? <span className="tg">{runNext.tag}</span> : null}
              </span>
              <span className="go">Play</span>
            </a>
          ) : null}

          {/* Not gated, but another go would still change the board: an End
              Game on its last slot, or an Arcade game, which takes the best
              run of the day. */}
          {!runGate && runRetry ? (
            <button type="button" className="d5f-again" onClick={fire(replayOpt)}>
              Play it again <i>{'\u00b7'} {attemptRule.chip}</i>
            </button>
          ) : null}

          {boardOpt ? (
            <button type="button" className="d5f-again" onClick={fire(boardOpt)}>
              {boardOpt.label} {boardOpt.sub ? <i>{'\u00b7'} {boardOpt.sub}</i> : null}
            </button>
          ) : null}

          <div className="d5f-alt">
            {!runComplete ? <a href={runSummary}>Run summary</a> : null}
            {runAuto ? <a href="#" onClick={(e) => { e.preventDefault(); setRunStay(true); }}>Stay here</a> : null}
            <a href={(DAILY_GAME_MAP[runSelf] || {}).href || `/${runSelf}`}>Leave the run</a>
          </div>
        </div>
      </div>
    );
  }

  // THE FAST RETRY PANEL. Deliberately below the `runActive` return above it:
  // a finish inside a circuit already has its own gate, which says more (where
  // you are in the run, what it is waiting for), and two gates would argue.
  //
  // THE BOARD IS ALREADY HELD BEFORE ANY OF THIS RENDERS. Every client gates
  // its flip on `endHold.held`, so the finished board -- the mate, the fourth
  // disc, the well that topped out -- stays on screen for HOLD_LONG first and
  // this panel arrives after it, never over it. See app/useEndHold.js; the two
  // Arcade clients were wired to it in the same pass as this panel, because
  // they were the only two of the eight with no hold at all.
  if (fastRetry && !showCard) {
    // ON THE STAGE, THE RETRY ENDING IS A CURTAIN TOO. This branch was the last
    // place on the site still opening the white Loft card on a near-black page
    // once the stage went sitewide. StageFinish renders the band and the one
    // control; pressing 'Show end game card' sets showCard and falls through to
    // the ordinary stage ending below, in the same slot, with every figure it
    // always had.
    if (onStage) {
      return (
        <StageFinish
          title={retryVerdict} detail={detail} outcome={outcome} name={name}
          retry={{
            eyebrow: attemptRule.chip,
            sub: attemptRule.replay,
            onReplay: fire(replayOpt),
            onCard: () => setShowCard(true),
          }}
        />
      );
    }
    return (
      <div className="loft-back">
        <div className="loft-backin">
          <style dangerouslySetInnerHTML={{ __html: `
            /* SELF-CONTAINED, on purpose (owner report, 2026-08-19). This used
               to carry .loft-next as well, borrowing the Up next band's shape,
               and inherited three bugs from it: a square left edge, near-black
               ink inside the blue chip, and a sub line clipped to an ellipsis
               on a phone. The first two come from a DEAD SECOND .loft-next
               block in app/LoftCap.jsx (~line 914, children .n1/.n2, which
               nothing in the app renders): being the later declaration it wins
               on border-radius:0 9px 9px 0 and on .loft-next .go{color:#3a2a05}.
               The third is the live block, where .nm/.tg are nowrap + overflow
               hidden, which is right for a game name and a one-line tag and
               wrong for a whole sentence. So this names every property it needs
               and shares no class with anything else. The dead block is still
               there: deleting it also turns the Up next band on all 65 games
               from gold back to the green it was written as, which is a call to
               make deliberately rather than as a side effect of this. */
            .lfr-go{display:flex;align-items:center;gap:11px;width:100%;padding:12px 13px;
              border-radius:11px;background:rgba(37,99,235,.10);
              border:2px solid rgba(37,99,235,.32);color:var(--ink);
              font-family:inherit;text-align:left;cursor:pointer;}
            .lfr-go:hover{background:rgba(37,99,235,.17);}
            .lfr-t{flex:1;min-width:0;}
            .lfr-eb{display:block;font-weight:800;font-size:9.5px;line-height:1;
              letter-spacing:.11em;text-transform:uppercase;color:#1d4ed8;margin-bottom:5px;}
            .lfr-nm{display:block;font-weight:800;font-size:19px;line-height:1.1;
              letter-spacing:-.022em;color:var(--ink);}
            /* THE SUB LINE WRAPS. It is a whole sentence from the registry, not
               a one-line tag, and on a 390px phone the nowrap it used to
               inherit cut it at "ranks you on...". */
            .lfr-tg{display:block;font-weight:700;font-size:11.5px;line-height:1.4;
              color:var(--muted);margin-top:5px;white-space:normal;overflow:visible;}
            /* White ink stated outright: the chip is a solid blue box, and the
               only reason it ever read black was an inherited colour. */
            .lfr-chip{flex:none;background:#2563eb;color:#fff;border-radius:10px;
              padding:11px 15px;font-weight:800;font-size:13.5px;line-height:1;
              white-space:nowrap;}
            .lfr-card{display:block;width:100%;margin-top:10px;padding:12px 13px;border-radius:11px;
              border:2px solid var(--border);background:var(--surface-alt);color:var(--muted);
              font-family:inherit;font-weight:800;font-size:13.5px;cursor:pointer;text-align:center;}
            .lfr-card:hover{background:#eef1f6;color:var(--ink);}
            .lfr-card i{display:block;font-style:normal;font-weight:700;font-size:11px;
              line-height:1.35;color:var(--slate);margin-top:4px;}
            @media(max-width:560px){
              .lfr-go{gap:9px;padding:11px;}
              .lfr-nm{font-size:17px;}
              .lfr-chip{padding:10px 12px;font-size:12.5px;}
            }
          ` }} />
          <div className={outcome ? `loft-res loft-res-${outcome}` : 'loft-res'}><b>{name ? `${name} ${title.charAt(0).toLowerCase()}${title.slice(1)}` : title}</b><s>{detail}</s></div>

          <button type="button" className="lfr-go" onClick={fire(replayOpt)}>
            <span className="lfr-t">
              {/* Both lines come from dailyAttemptRule, so what a replay is
                  worth is stated by the registry that decides it and can never
                  drift from the same sentence on the full card. */}
              <span className="lfr-eb">{attemptRule.chip}</span>
              <span className="lfr-nm">Replay Instantly</span>
              <span className="lfr-tg">{attemptRule.replay}</span>
            </span>
            <span className="lfr-chip">Replay</span>
          </button>

          <button type="button" className="lfr-card" onClick={() => setShowCard(true)}>
            Show End Game Card
            <i>Your IQ, {boardLabel ? <>the {String(boardLabel).toLowerCase()}</> : <>today&rsquo;s board</>}, the archive and what to play next</i>
          </button>
        </div>
      </div>
    );
  }

  // Everything above has run, so this is safe: same hooks, same order, every
  // render. See app/StageFinish.jsx for why the ending is a band and not a card.
  if (onStage) {
    return (
      <StageFinish
        title={retryVerdict || title} detail={detail} iq={iq} board={board} day={day} streak={streak}
        missLabel={missLabel} gameRank={gameRank} outcome={outcome} options={options} name={name}
        archive={archive}
        /* WHAT THE BOARD IS. These two were the quiz overrides that stopped
           here: the Loft card honoured `boardLabel` and the stage ending, which
           became the ending for every quiz on 2026-09-04, had never been told
           about it. Null on all eighty dailies, so nothing there moves. */
        boardLabel={boardLabel}
        boardWhen={boardWhen}
        /* THE CLAIM TILE (owner, 2026-09-01). The Loft card's claim band below
           never rendered once the stage went sitewide, so a guest finished
           with no offer at all. StageFinish renders its own tile, above Up
           next, from the same `guest` flag. */
        guest={claimBandShown}
        onClaimed={() => { setClaimed(true); try { window.dispatchEvent(new Event('sot:daily-updated')); } catch (e) {} }}
        /* THE CURTAIN HOLDS ON THE VERDICT UNTIL THIS IS TRUE (owner,
           2026-08-31). It is the SAME flag the Calculating block below is keyed
           on, deliberately: one definition of "the card is finished", so the
           full-screen ending cannot collapse onto a row of placeholders. The
           fast-retry branch above passes nothing, because it neither floods nor
           shows a figure. */
        ready={figuresShow}
      />
    );
  }

  return (
    <div className="loft-back">
      {/* THE SUDOKU CIRCUIT NUDGE (owner, 2026-09-05): two seconds onto this
          card, on any of today's five Sudoku circuit grids, once a day. It
          decides everything else for itself; see the file. Mounted on the two
          branches a finish is actually read on: this one and the run card. */}
      <SudokuCircuitPop ready self={selfKey} />
      <div className="loft-backin">
      {/* THE VERDICT LIVES HERE NOW, not on the page cap (owner, 2026-08-14).
          Colouring both said it twice, and this is where the result is.
          The BAND wears the category hue and the outcome is the PILL the title
          sits in (owner, 2026-08-26): green solved, amber partial, red not.
          THE MARKUP IS UNCONDITIONAL and that is the point of doing it this
          way. There is nothing here to render only on a finish, so the archive
          header, which reuses .loft-res with no outcome, stays the plain
          hairline row it always was without needing a guard. Every style,
          including the pill, lives in LoftCap.jsx beside the rest of
          .loft-res. */}
      <div className={outcome ? `loft-res loft-res-${outcome}` : 'loft-res'}><b>{name ? `${name} ${title.charAt(0).toLowerCase()}${title.slice(1)}` : title}</b><s>{detail}</s></div>

      {/* Up next. Sits between the verdict and the IQ bar so the result is
          still read first and the handoff is the second thing on the card. */}
      {simOpt ? (
        <a className="loft-next" href={simOpt.href || undefined} onClick={simOpt.onClick || undefined}>
          <span className="t">
            <span className="eb">Up next</span>
            <span className="nm">{simName || simOpt.label}</span>
            {simTag ? <span className="tg">{simTag}</span> : null}
          </span>
          <span className="go">Play</span>
        </a>
      ) : null}

      {/* The rest of the category. SELF-CONTAINED styles, for the reason the
          fast-retry panel states at length above: .loft-next has a dead second
          declaration in LoftCap.jsx that wins on the properties it names, so a
          new block here shares no class with anything and names what it needs.
          It scrolls sideways rather than wrapping, so a ten-game category costs
          the card one line whatever the viewport. */}
      {catNext.length ? (
        <div className="lfc-more">
          <style dangerouslySetInnerHTML={{ __html: `
            .lfc-more{margin-top:8px;}
            .lfc-more>b{display:block;font-weight:800;font-size:9.5px;line-height:1;
              letter-spacing:.11em;text-transform:uppercase;color:var(--slate);margin:0 0 6px 2px;}
            .lfc-row{display:flex;gap:7px;overflow-x:auto;scrollbar-width:none;
              padding-bottom:2px;-webkit-overflow-scrolling:touch;}
            .lfc-row::-webkit-scrollbar{display:none;}
            .lfc-row>a{flex:none;display:flex;align-items:center;gap:8px;
              padding:7px 11px 7px 8px;border-radius:10px;border:2px solid var(--border);
              background:var(--surface-alt);color:var(--ink);text-decoration:none;
              font-weight:800;font-size:13px;line-height:1;white-space:nowrap;}
            .lfc-row>a:hover{border-color:rgba(37,99,235,.4);background:rgba(37,99,235,.07);}
            .lfc-row>a img{flex:none;border-radius:6px;}
          ` }} />
          <b>More {myCat}</b>
          <div className="lfc-row">
            {catNext.map((g) => (
              <a key={g.key} href={g.href}><GameGlyph gameKey={g.key} size={20} />{g.name}</a>
            ))}
          </div>
        </div>
      ) : null}

      {/* ONE loading state for the WHOLE bar (owner, 2026-08-17). Each of the
          three figures used to carry its own <Calculating />, and this row is
          nowrap with only `.t` able to shrink (min-width:0), so three nowrap
          18px placeholders came to ~276px where the settled figures come to
          ~122px. `.t` collapsed to zero, the auto margin gave up its free
          space, the flex:none figures overflowed and the text collided, clipped
          by .loft-back's overflow:hidden.

          It showed on a phone and not on desktop because the max-width:560px
          block shrinks every real figure (.n to 23px, .today b to 15px, and it
          hides the em) and never touches `.loft-fiq .loft-calc`, which stays
          18px at every width. So the phone tightened the settled state and left
          the loading state at full size.

          The bar now says it once, on one line, and swaps to the figures when
          they are ALL in. Past the ceiling it lays out normally and prints a
          dash for whatever is missing, which is why no <Calculating /> is left
          inside it. */}
      {!figuresShow ? (
        <div className="loft-calcall">
          <Brain className="bi" size={30} strokeWidth={2.2} aria-hidden="true" />
          <span className="t">
            <span className="h">Calculating your IQ<i>.</i><i>.</i><i>.</i></span>
            <span className="s">and measuring it against our other users</span>
          </span>
        </div>
      ) : (
      <>
      {!iqShow ? (
        <div className="loft-fiq calc1">
          <Brain className="bi" size={26} strokeWidth={2.2} aria-hidden="true" />
          <span className="cc">Calculating IQ<i>.</i><i>.</i><i>.</i></span>
        </div>
      ) : (
      <div className="loft-fiq">
        <Brain className="bi" size={26} strokeWidth={2.2} aria-hidden="true" />
        <span className="n">{iq && iq.gained != null ? `+${iq.gained}` : '\u2014'}</span>
        <span className="t">
          <span className="l">IQ points earned</span>
          {/* RANK ONLY, no lifetime total (owner, 2026-08-17). This line
              led with a running total and the row is nowrap with only `.t`
              able to shrink, so the lifetime figure was spending width the
              rank needs. It is still on the player's profile and in the Stat
              Hub; what belongs beside a gain that was just earned is where
              that gain puts you, not a running sum. */}
          <span className="m">
            {iq && iq.rank != null
              ? `rank #${Number(iq.rank).toLocaleString()}${iq.total != null ? ` of ${Number(iq.total).toLocaleString()}` : ''}`
              : '\u2014'}
          </span>
        </span>
        <span className="today"><b>{day && day.ready
          ? (day.todayXp != null ? `+${Number(day.todayXp).toLocaleString()}` : '\u2014')
          : '\u2014'}</b><i>IQ today</i></span>
        {/* THE DAY'S IQ RANK SITS BESIDE THE DAY'S IQ (owner, 2026-08-17). This
            bar is the card's DAY-WIDE axis and it was carrying only a points
            figure: the tiles below rank the player on this game's board and in
            their category, and neither answers "where did today put me across
            all the dailies". The figure was on the card once, on the first tile,
            and was pulled on 2026-08-15 because it sat two inches above a header
            reading "Today's board" and a field of eight, so it read as a wrong
            answer to a different question. Beside "+N IQ today", off the SAME
            useDayStats payload, it is unambiguous and the two can never
            disagree. */}
        <span className="today rank"><b>{day && day.ready
          ? (day.dayRank != null
            ? <>#{Number(day.dayRank).toLocaleString()}{day.dayField != null ? <em>of {Number(day.dayField).toLocaleString()}</em> : null}</>
            : '\u2014')
          : '\u2014'}</b><i>IQ rank today</i></span>
      </div>
      )}
      {/* Each figure gets its OWN colour (owner, 2026-08-14): four identical grey
          tiles read as one block and nothing stands out. */}
      {dayTiles ? (
      <div className="loft-day">
        {dayTiles.map((t, i) => (
          <span key={i} className={`d${(i % 4) + 1}`}><b>{t.value}</b>{t.label}</span>
        ))}
      </div>
      ) : (
      <div className="loft-day">
        {/* The field size goes in the LABEL, matching the tile beside it
            ("of 991 Crux all time"): a rank means little without the size of
            the thing it is a rank in, and it is what tells a player that 25th
            of 108 is a good day. */}
        <span className="d1"><b>{board && (myRank != null || board.settled)
          ? (myRank != null ? `#${myRank.toLocaleString()}` : '\u2014')
          : <Calculating />}</b>{myRank != null && field
            ? `of ${Number(field).toLocaleString()} on today\u2019s board`
            : <>on today&rsquo;s board</>}</span>
        <span className="d2"><b>{gameRank && gameRank.value != null
          ? gameRank.value
          : <Calculating />}</b>{gameRank ? gameRank.label : 'this game'}</span>
        <span className="d3"><b>{catRank && catRank.ready
          ? (catRank.rank != null ? `#${Number(catRank.rank).toLocaleString()}` : '\u2014')
          : <Calculating />}</b>{catRank && catRank.cat
            ? `${String(catRank.cat).toLowerCase()} today`
            : 'category today'}</span>
        <span className="d4"><b>{streak != null && streak >= 1 ? streak : '\u2014'}</b>day streak</span>
      </div>
      )}
      </>
      )}

      {/* `wait` reserves the block's height only until the rows land, so a
          settled board sizes to what it actually holds instead of leaving a run
          of white above the options (owner, 2026-08-15). */}
      <div className={rows.length ? 'loft-lb' : 'loft-lb wait'}>
        <div className="h">
          <b>{boardLabel || <>Today&rsquo;s board</>}</b>
          {board && board.plays ? <s>{Number(board.plays).toLocaleString()} played</s> : null}
        </div>
        {!board ? <Calculating wide /> : null}
        {board && !rows.length ? <span className="loft-empty">Nobody has finished this one yet.</span> : null}
        {rows.length ? (
          <div className="loft-lbr head cols">
            <span className="r" />
            <span className="n">Player</span>
            <span className="s">Score</span>
            {missLabel ? <span className="c">{missLabel}</span> : null}
            <span className="c">Time</span>
          </div>
        ) : null}
        {shown.map(lbRow)}
        {myRow ? lbRow(myRow, myRank - 1) : null}
        {rows.length > 3 ? (
          <button type="button" className="loft-more" onClick={() => setShowAll((v) => !v)}>
            {showAll ? 'Show less' : `Show all ${rows.length}`}
          </button>
        ) : null}
      </div>

      {/* CLAIM YOUR NAME. The one join surface on a daily page sat far below
          the fold; a guest's finish is where a name is worth offering, because
          rank and points pay registered names only. LoftFinish is the surface
          players actually see (the fifth-mirror note); DailyEndCard is
          deliberately left alone, and the run card and fast-retry panel stay
          minimal by design, so this renders on the FULL card only.

          The form's inline ink reads the --join-* custom properties, which
          .loft-page sets to NAVY-ground values; this card is WHITE, so the
          wrapper resets them to the light-page values or the heading ships
          white on white. */}
      {claimBandShown ? (
        <div className="loft-claim">
          <style dangerouslySetInnerHTML={{ __html: `
            .loft-claim{margin:2px 0 10px;border:2px solid rgba(37,99,235,.32);border-radius:11px;
              background:rgba(37,99,235,.07);padding:11px 13px;}
            .loft-claim .eb{display:block;font-weight:800;font-size:9.5px;line-height:1;
              letter-spacing:.11em;text-transform:uppercase;color:#1d4ed8;margin-bottom:5px;}
            .loft-claim .hd{display:flex;align-items:center;gap:10px;}
            .loft-claim .nm{flex:1;min-width:0;font-weight:800;font-size:15.5px;line-height:1.15;
              letter-spacing:-.01em;color:var(--ink);}
            .loft-claim .go{flex:none;border:0;background:#2563eb;color:#fff;border-radius:9px;
              padding:9px 13px;font-family:inherit;font-weight:800;font-size:12.5px;cursor:pointer;}
            .loft-claim .go:hover{background:#1d4ed8;}
            .loft-claim .tg{font-weight:700;font-size:11.5px;line-height:1.4;color:var(--muted);
              margin-top:5px;}
            .loft-claim .formwrap{margin-top:12px;}
          ` }} />
          <span className="eb">Playing as a guest</span>
          <div className="hd">
            <span className="nm">Claim a free name to hold your rank</span>
            {!claimOpen ? (
              <button type="button" className="go" onClick={() => setClaimOpen(true)}>Claim my name</button>
            ) : null}
          </div>
          <div className="tg">Ranks and points count for registered names only. A display name is enough, no password, and the games you already finished come with you.</div>
          {claimOpen ? (
            <div className="formwrap" style={{ '--join-head': 'var(--ink)', '--join-body': '#4a4339', '--join-soft': 'var(--muted)', '--join-ok': 'var(--success)', '--join-err': 'var(--accent)' }}>
              <JoinLeaderboardForm heading="Claim your name" hideIcon
                onJoined={() => {
                  setClaimed(true);
                  try { window.dispatchEvent(new Event('sot:daily-updated')); } catch (e) {}
                }} />
            </div>
          ) : null}
        </div>
      ) : null}
      {claimed ? (
        <div style={{ margin: '2px 0 10px', border: '2px solid rgba(16,185,129,.4)', borderRadius: 11, background: 'rgba(16,185,129,.08)', padding: '10px 13px', fontWeight: 800, fontSize: 13, color: 'var(--success-deep)' }}>
          You&rsquo;re on the board. Every finish counts under your name now.
        </div>
      ) : null}
      <div className="loft-opts">
        {opts.map((o, i) => {
          const cls = `loft-opt${o.kind ? ` ${o.kind}` : ''}${o.tone ? ` t-${o.tone}` : ''}${wide.has(i) ? ' wide' : ''}`;
          const inner = <>{o.label}{o.sub ? <span className="sub">{o.sub}</span> : null}</>;
          return o.href
            ? <a key={i} className={cls} href={o.href}>{inner}</a>
            : <button key={i} type="button" className={cls} onClick={fire(o)}>{inner}</button>;
        })}
        {archive && archive.length ? (
          <button type="button" className={wideTail.has('archive') ? 'loft-opt t-archive wide' : 'loft-opt t-archive'} onClick={() => setOpenArchive(true)}>
            {name ? `${name} Archive` : 'Archive'}
            <span className="sub">Every daily puzzle, by date</span>
          </button>
        ) : null}
        {/* Half width and BEFORE the held-back 'main' options, so it pairs with
            Back to main on the last row (owner, 2026-08-17). The expanded panel
            below still renders last: it spans the grid, so between the two it
            would split the pair it belongs under. */}
        {roster.cats.length ? (
          <button type="button" className={wideTail.has('browse') ? 'loft-opt t-browse wide' : 'loft-opt t-browse'} onClick={() => setBrowse((v) => !v)}>
            {browse ? 'Hide the other puzzles' : 'Show all puzzles by category'}
            <span className="sub">{browse ? 'Back to your options' : (shownCat ? `Starting with ${shownCat}` : 'Every daily')}</span>
          </button>
        ) : null}
        {mains.map((o, i) => {
          const cls = `loft-opt${o.kind ? ` ${o.kind}` : ''}${o.tone ? ` t-${o.tone}` : ''}`
            + (wideTail.has(`m${i}`) ? ' wide' : '');
          const inner = <>{o.label}{o.sub ? <span className="sub">{o.sub}</span> : null}</>;
          return o.href
            ? <a key={`m${i}`} className={cls} href={o.href}>{inner}</a>
            : <button key={`m${i}`} type="button" className={cls} onClick={fire(o)}>{inner}</button>;
        })}
        {browse && roster.cats.length ? (
          <div className="loft-browse">
            <div className="loft-cats">
              {roster.cats.map((c) => (
                <button key={c.cat} type="button"
                  className={c.cat === shownCat ? 'on' : undefined}
                  onClick={() => setPickCat(c.cat)}>{c.cat}<i>{c.games.length}</i></button>
              ))}
            </div>
            <div className="loft-gtiles">
              {shownGames.map((g) => (
                <a key={g.key} href={g.href} className={g.played ? 'played' : undefined}>
                  <GameGlyph gameKey={g.key} size={26} />
                  <span><b>{g.name}</b><i>{g.tag}</i></span>
                  {g.played ? <em>Played</em> : null}
                </a>
              ))}
            </div>
          </div>
        ) : null}
      </div>
      </div>
    </div>
  );
}
