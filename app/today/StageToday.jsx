'use client';

// THE HOME, ON THE STAGE.
//
// The first attempt at this was a token remap over the existing home, and it
// produced exactly the failure the stage rollout spent a day removing: the
// text moved and the artwork did not, so band headings went dark on dark and
// tile names went near-white on light plates. The home is not convertible by
// swapping variables, because the parts that make it the home — every tile's
// artwork, every band's hue — are not variables. It needs its own design.
//
// So this is a separate surface, and it applies the stage's seven rules to a
// HOME rather than to a board:
//
//   1. THE PAGE IS THE THING. One cap line. No masthead, no stat bar, no rails.
//   2. ONE GROUND, ONE COLOUR FAMILY. The ground is --stg-ground; the family is
//      the nine category steps, and nothing else on the page spends a colour.
//   3. ONE GRAPHIC IN THREE LAYERS. On a board that is the ladder of the game's
//      own units. A home's units are the eighty dailies, so THE DAY is one
//      ladder of eighty rungs in nine blocks — lit for played, half for in
//      progress, dark for untouched. It is the page's hero, and the block
//      widths are honest: the categories genuinely differ in size.
//   4. FIGURES, NEVER PROSE. Played, rank, category counts. No sentences.
//   5. DRAW THE FIELD ONLY WHEN REAL. A crowd count renders only above zero.
//   6. EXPAND IN FLOW. Nothing here overlays anything.
//
// The registry's nine categories map exactly onto the nine ramp steps and add
// up to eighty games, so the ladder is the whole roster with nothing left over.
//
// Data comes from fetchDayStatus, the same call the existing home makes, so
// this surface adds no new endpoint and cannot disagree with the other one
// about what has been played.
import { useEffect, useMemo, useRef, useState } from 'react';
import { DAILY_GAMES as ALL_DAILY_GAMES, DAILY_GAME_MAP, liveDailyKeys } from '@/lib/daily-games';

// THE LIVE ROSTER, not the whole registry. A retired game stays in DAILY_GAMES
// so its archived days keep scoring, so listing from that array put Circa
// (retired 2026-07-20) back in the Trivia row and in the lead/up-next picks
// (owner, 2026-09-01). Reading through liveDailyKeys covers Extra on
// 2026-09-29 too, with no deploy needed on the day. Same fix as StageFinish.
const LIVE_KEYS = new Set(liveDailyKeys());
const DAILY_GAMES = ALL_DAILY_GAMES.filter((g) => LIVE_KEYS.has(g.key));
import { DISPLAY_CIRCUITS, RUN_GAMES, circuitKeysFor, circuitEntryHref } from '@/lib/circuits';
import { GROUPS } from '@/lib/daily-groups';
import GameGlyph from '../GameGlyph';
import { RAMP_ORDER, categoryColor, categoryColorLight, categoryAccentInkLight, categoryOnrampLight, RAMP_INK } from '@/lib/category-ramp';
// ONE READING OF A RESULT ROW, the same one the ending curtain and the tile
// panel use. It prints the run in the GAME'S own units — 7/16 · 3 busts · 2:11
// — which is the whole reason Your standing can be one column instead of six.
import { gameStats } from '@/lib/daily-row-stats';
import useDayStats, { fetchDayStatus, etToday } from '../useDayStats';
import { fetchDailyBoard } from '../dailyBoardClient';
import useMyGames from '../useMyGames';
import { savedIdentity } from '@/lib/saved-identity';
import { useStageTheme, useThemeQs, useThemeHint, useThemeIntro } from '@/lib/stage-theme';
import ThemePop from '../ThemePop';
import StageLadder from '../StageLadder';
import StageWelcome from '../StageWelcome';
import SundayLedger from '../SundayLedger';
import PremierePop from '../PremierePop';
import MindLoftMark from '../MindLoftMark';
import StagePatch, { PATCH_CSS } from '../StagePatch';
// THE FOOTER IS SHARED (2026-08-31). It used to be drawn here, because this
// was the only stage surface that needed one; the circuit pages needed the
// same object, and two drawings of one footer is exactly the drift this file
// warns about elsewhere. app/StageFooter.jsx owns the drawing and imports
// FOOTER_COLS from app/Footer.jsx, so the site's link map is still the only
// copy of the links.
import StageFooter from '../StageFooter';

const MONO = "'JetBrains Mono', ui-monospace, SFMono-Regular, Menlo, monospace";
const SANS = "Manrope, ui-sans-serif, system-ui, -apple-system, sans-serif";

const routeOf = (g) => g.href || `/${g.key}`;

// PLAYED GOES TO THE END OF ITS SECTION (owner, 2026-09-01). A row is a list of
// what to play, and the ones already played are a record: they were sitting in
// the middle of every category, so the reader had to skip past this morning to
// find this afternoon. A stable two-way partition, so the order inside each
// half is whatever the section already chose.
function playedLast(list, done) {
  if (!list || !done || !done.size) return list;
  const open = [], shut = [];
  for (const g of list) (done.has(g.key) ? shut : open).push(g);
  return open.concat(shut);
}

// A daily's quizId is '<key>-M-D-YY', so the key is everything before the first
// numeric part. Quiz plays that are not dailies resolve to nothing and are left
// out: this is the daily home, and its feed is the dailies.
function gameOfQuizId(id) {
  const m = /^([a-z]+)-\d+-\d+-\d+$/.exec(String(id || ''));
  return m ? DAILY_GAME_MAP[m[1]] || null : null;
}

function ago(iso) {
  const t = Date.parse(iso);
  if (!Number.isFinite(t)) return '';
  const s = Math.max(0, Math.round((Date.now() - t) / 1000));
  if (s < 60) return 'just now';
  const m = Math.round(s / 60);
  if (m < 60) return m + 'm ago';
  const h = Math.round(m / 60);
  if (h < 24) return h + 'h ago';
  return Math.round(h / 24) + 'd ago';
}

function hhmm(sec) {
  const x = Math.max(0, Math.round(Number(sec) || 0));
  const h = Math.floor(x / 3600);
  const m = Math.round((x % 3600) / 60);
  return h ? h + 'h ' + m + 'm' : m + 'm';
}

// The same identity the rest of the site sends: this surface must not disagree
// with the old home about whose board it is showing.
function identityQs() {
  const p = new URLSearchParams();
  try { const a = localStorage.getItem('sot_quiz_anon'); if (a) p.set('anonId', a); } catch (e) {}
  try {
    const id = JSON.parse(localStorage.getItem('sot_quiz_identity') || 'null');
    if (id && id.email) p.set('email', id.email);
  } catch (e) {}
  return p.toString();
}

function fmtDate(ymd) {
  if (!ymd) return '';
  const [y, m, d] = ymd.split('-').map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d));
  return dt.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', timeZone: 'UTC' });
}

// A phone shows three circuits at most; a wider screen shows however many fit
// on one row, which is measured rather than guessed (owner, 2026-08-31).
const CIRC_PEEK_NARROW = 3;
const AZ_KEY = 'sot_stage_az';

// The three the shelf leads with, by id: the Trivia Gauntlet, the Daily Five,
// then Sudoku (owner, 2026-09-01). lib/circuits.js orders DISPLAY_CIRCUITS the
// same way; this repeats it because the home's sort has to interleave that
// lead with the reader's own progress, which that module knows nothing about.
// On a phone the shelf's peek is exactly these three (CIRC_PEEK_NARROW).
const CIRC_LEAD = ['gauntlet', 'five', 'sudoku'];

// THE NEWCOMER'S ROW (owner, 2026-09-04). A reader with NO footprint at all gets
// one row above everything else: two circuits sharing a line, then the busiest
// daily in each of the ten categories. EVERY object in it is FILLED with its
// category step and carries that step's own ink, which is the treatment the
// circuit CTA already had and which nothing else on this page wears. That is the
// whole point of the row: a first-time reader meets ten colours that mean the
// ten categories, and meets them before the page asks them to read anything.
//
// WHY THESE TWO CIRCUITS. The Gauntlet is already the site's lead (CIRC_LEAD
// pins it first on the shelf below and /trivia pops its door for exactly this
// visitor) and the Five is the marquee. They are the two runs the rest of the
// page leads with, said one screen earlier.
const NEWCOMER_CIRCS = ['gauntlet', 'five'];

// NO TILE MAY NAME A GAME THE GAUNTLET ALREADY HOLDS (owner, 2026-09-04).
// RUN_GAMES is the site's own name for the seven one-life, twenty-second,
// four-choice quizzes, and it is exactly the Gauntlet's roster, so reading it
// rather than hand-listing keys keeps this correct when that roster next moves.
// Two reasons the row skips them. The Gauntlet is already the first card on it,
// so a tile naming one of its members says the same thing twice. And they are
// structurally ONE game over seven banks, which is why they dominate their two
// categories on plays alone (measured 2026-09-04: the six run-shaped Trivia
// games took 26 to 41 plays and every other Trivia game 12 or fewer, and Atlas
// took 35 against 12 to 15 for the rest of Geography). Ranking on the raw count
// would therefore hand Trivia and Geography to the quiz shape every day and the
// row would never show what else those two categories contain.
//
// Only Trivia and Geography are affected, since those are the only categories
// RUN_GAMES draws from. A category left with nothing keeps its whole roster.
const NEWCOMER_SKIP = new Set(RUN_GAMES);

// THE EDITORIAL FLOOR (owner ruling, 2026-09-04). Today's plays are the real
// ordering and they cost nothing, since board.games carries them already. But at
// 6am ET every category is on single digits, so the ten picks would be noise. A
// category therefore keeps its hand-picked default until its busiest game clears
// NEWCOMER_FLOOR. The COUNT itself is never printed (owner, same day): the floor
// decides which game the tile names and nothing else.
//
// ONE KEY PER RAMP_ORDER CATEGORY. A key that has retired, or that has been
// moved to another category, falls through to that category's first game rather
// than blanking the tile.
const NEWCOMER_PICKS = {
  Word: 'encore',
  Numbers: 'crunch',
  Logic: 'alibi',
  'End Game': 'mate',
  // Trivia and Geography name their busiest NON-run game, measured 2026-09-04.
  Trivia: 'dating',
  Geography: 'span',
  Cards: 'taire',
  'Crowd Psychology': 'feud',
  Arcade: 'sweep',
  Sudoku: 'suds',
};
const NEWCOMER_FLOOR = 25;

// HOW MANY QUIZZES A TOPIC SHOWS BEFORE "show all". The catalogue is over
// eighteen hundred quizzes and Geography alone is four hundred and thirty
// eight, so an expanded topic that simply listed everything would be a
// thousand rows of the home page.
const QUIZ_PEEK = 15;

// A PEEK IS A SPREAD, NOT A BATCH, and newest-first alone does not give one.
// Quizzes ship in families of a dozen at a time, so the newest fifteen in a
// topic are routinely the same quiz fifteen times: Geography's peek opened as
// four "Click the Countries of X No Outline" followed by eight "Erase X by
// Capital (No Skips)", which tells a reader nothing about what is in the topic
// and reads like a bug.
//
// So the peek takes at most two per family off the newest-first list. A family
// is recognised by TWO keys, because one does not catch them all and the two
// failure modes are different:
//
//   - the PREFIX key, everything before a colon or else the first three words,
//     catches "Which Is Closer: X" and "LSAT Logic Games: X", whose titles vary
//     only at the end;
//   - the ENDS key, first word plus last word, catches "Erase X by Capital (No
//     Skips)", whose titles vary in the MIDDLE and so share no prefix.
//
// Digits are stripped before keying, so "Name All 64 Crayola Colors" and "Name
// All 48 Crayola Colors" are one family rather than two. A quiz is held back
// when EITHER of its keys is already at the cap.
//
// It is a heuristic and it is asked to do one job: thin a shipped batch. It
// will occasionally hold back two quizzes that merely rhyme, which costs
// nothing, because the topic still has hundreds behind "show all" in true
// newest-first order. The ORDER is the route's; this only chooses which fifteen
// are shown first.
const FAMILY_CAP = 2;
function words(text) {
  return String(text || '').toLowerCase().replace(/[^a-z ]+/g, ' ').split(/\s+/).filter(Boolean);
}
function keysOf(title) {
  const head = String(title || '').split(':')[0];
  const hw = words(head);
  const w = words(title);
  const prefix = (hw.length < w.length ? hw : w.slice(0, 3)).join(' ');
  const ends = w.length ? w[0] + ' ' + w[w.length - 1] : '';
  return [prefix, ends].filter(Boolean);
}
function peekOf(list, n) {
  const seen = new Map();
  const picked = [];
  const held = [];
  for (const q of list) {
    if (picked.length >= n) break;
    const ks = keysOf(q.title);
    if (ks.some((k) => (seen.get(k) || 0) >= FAMILY_CAP)) { held.push(q); continue; }
    for (const k of ks) seen.set(k, (seen.get(k) || 0) + 1);
    picked.push(q);
  }
  // A topic with fewer families than n still shows n: the cap thins a batch, it
  // never shortens the peek.
  for (const q of held) { if (picked.length >= n) break; picked.push(q); }
  return picked;
}

// THE PRE-LOAD SKELETON, and it is a skeleton rather than the answer.
// /api/quiz/topics is the authority on which topics exist, what they are
// called and what is in them; this list exists only so the section has its
// real height and its real labels before the fetch lands, instead of growing
// fifteen rows under the reader's scroll. It is DEPT_NAV's order, which is
// also the order /quizzes/all renders, so the loaded list drops straight into
// the same rows and nothing moves.
//
// It is written out rather than imported from lib/quiz-departments.js on
// purpose: that module carries the two-thousand-line id map and the icon set,
// and this surface needs fifteen labels. If the two ever disagree the ROUTE
// wins, because the section replaces this list wholesale the moment data
// arrives.
const TOPIC_SKELETON = [
  { id: 'movies', label: 'Movies' },
  { id: 'music', label: 'Music' },
  { id: 'gaming', label: 'Gaming' },
  { id: 'travel', label: 'Travel' },
  { id: 'sports', label: 'Sports' },
  { id: 'geography', label: 'Geography' },
  { id: 'food', label: 'Food & Drink' },
  { id: 'business', label: 'Business' },
  { id: 'science', label: 'Science & Nature' },
  { id: 'entertainment', label: 'Entertainment' },
  { id: 'word', label: 'Word Puzzles' },
  { id: 'literature', label: 'Literature' },
  { id: 'history', label: 'History' },
  { id: 'arts', label: 'Arts & Culture' },
  { id: 'school', label: 'Standardized Tests' },
];
const leadRankOf = (id) => {
  const i = CIRC_LEAD.indexOf(id);
  return i < 0 ? CIRC_LEAD.length : i;
};

// WHICH SECTIONS ARE OPEN, and a first load opens NONE of them (owner,
// 2026-09-01). Eighty games in nine grids is a lot of page to hand a reader who
// has not asked for any of it, so the slate opens as a run of TITLES: every
// section paints its own ruled head with its count, and the head is the control
// that opens it.
//
// THE CARDS STAY IN THE HTML, hidden with display:none rather than dropped from
// the render. That is not about animation: this page is the crawl path to every
// daily, and a collapse that removed the cards would take ~80 internal links
// with it.
//
// OPENING A SECTION STICKS, per browser, beside sot_cat_order and the A to Z
// view flag and for the same reason all three gave: a view preference belongs
// to the screen, not to the account. The stored value is an explicit OVERRIDE
// map, never a list of open sections: a section the reader has never touched
// keeps following the default (which changes the day they star something), and
// one they shut by hand stays shut where the default would open it.
const SHELF_OPEN_KEY = 'sot_shelf_open';
const MINE_ID = 'sty-mine';
const UNF_MAX = 4;   // unfinished sets shown on the band before 'and N more'
const CIRC_ID = 'sty-circs';
// The Word category's section id, the same shape the render derives for every
// category (`cat-${cat}` with spaces dashed), named here so the open-by-default
// rule can point at it.
const WORD_ID = 'cat-Word';

// THE CIRCUITS SHELF OPENS FOR EVERYONE, first visit included, on ONE ROW led
// by the Gauntlet, the Daily Five and Sudoku in that order (owner, 2026-09-01,
// second ruling that day; it had been gauntlet-led and stars-only). Show all
// still opens the rest, and that is also where the other circuits' stars are.
const LEAD_CIRCUITS = CIRC_LEAD;

// A starred CIRCUIT is stored as `c:<id>` in the same favorites column the
// game stars write to (owner, 2026-09-01). My games is one shelf of the things
// a reader wants in front of them and a circuit is one of those things; the
// prefix is what stops a circuit id colliding with a game key, and it is why
// every consumer that reads that column for GAMES needed no change at all.
const CIRC_PIN = 'c:';
const circPinKey = (id) => CIRC_PIN + id;
const isCircPin = (k) => typeof k === 'string' && k.slice(0, 2) === CIRC_PIN;
const circPinId = (k) => (isCircPin(k) ? k.slice(2) : null);

// ONE DRAWING PER GAME, PAINTED BY THE SURFACE. The glyph is a single stroke
// path in currentColor, so the card's own --cc (its category step) colours it,
// and it flips with the register for free. See lib/game-glyphs.js for why these
// replaced the two hand-maintained PNG sets.
// ONE GAME CARD, used by the category rows and by My games, so a star behaves
// the same in both and there is one place to change what a card shows.
// A PLAYED CARD SWAPS ITS TAGLINE FOR ITS RESULT (owner, 2026-09-01). The tag
// says what the game IS, which is what a reader needs before they play it and
// nothing they need after; once the day has an answer for that game, the same
// line carries the answer instead. No extra row, no extra height, and the one
// question a home board could not answer — "how did I do at that one" — is now
// on the card itself rather than only in the table below.
function GameCard({ g, done, inprog, tq, canPin, favorites, toggleFavorite, hue, res }) {
  const state = done.has(g.key) ? 'done' : inprog.has(g.key) ? 'open' : '';
  const on = !!(favorites && favorites.includes(g.key));
  // MY GAMES MIXES CATEGORIES, so each card carries its OWN hue rather than
  // inheriting the section's (owner, 2026-08-31). In a category row every card
  // is that category anyway, so passing nothing keeps the row's colour.
  return (
    <a className={`sty-g ${state}${res ? ' res' : ''}`} href={`${routeOf(g)}${tq ? '?' + tq.slice(1) : ''}`}
      style={hue ? { '--cc': hue } : undefined}>
      <span className="sty-gn"><Glyph k={g.key} size={17} />{g.name}</span>
      {res ? (
        <span className="sty-gres sty-rev">
          <span className="sty-grl">You:</span>
          <span className="sty-grk">#{res.rank}</span>
          <span className="sty-grf">of {res.field}</span>
        </span>
      ) : (
        <span className="sty-gt">{g.tag}</span>
      )}
      {canPin ? (
        <button
          type="button"
          className={'sty-star' + (on ? ' on' : '')}
          aria-label={on ? `Unstar ${g.name}` : `Star ${g.name}`}
          title={on ? 'Remove from My games' : 'Add to My games'}
          onClick={(e) => { e.preventDefault(); e.stopPropagation(); toggleFavorite(g.key); }}
        >
          <svg viewBox="0 0 24 24" width="13" height="13" fill={on ? 'currentColor' : 'none'}
            stroke="currentColor" strokeWidth="2" strokeLinejoin="round" aria-hidden="true">
            <path d="M12 4l2.4 5 5.6.8-4 3.9 1 5.5-5-2.7-5 2.7 1-5.5-4-3.9 5.6-.8z" />
          </svg>
        </button>
      ) : null}
    </a>
  );
}

// The same star as GameCard's, on a circuit card. It sits IN the header row
// rather than floating at the corner, because that corner already holds the
// circuit's own N/M count.
function CircStar({ c, canPin, favorites, toggleFavorite }) {
  if (!canPin) return null;
  const key = circPinKey(c.id);
  const on = !!(favorites && favorites.includes(key));
  return (
    <button
      type="button"
      className={'sty-star' + (on ? ' on' : '')}
      aria-label={on ? `Unstar ${c.name}` : `Star ${c.name}`}
      title={on ? 'Remove from My games' : 'Add to My games'}
      onClick={(e) => { e.preventDefault(); e.stopPropagation(); toggleFavorite(key); }}
    >
      <svg viewBox="0 0 24 24" width="13" height="13" fill={on ? 'currentColor' : 'none'}
        stroke="currentColor" strokeWidth="2" strokeLinejoin="round" aria-hidden="true">
        <path d="M12 4l2.4 5 5.6.8-4 3.9 1 5.5-5-2.7-5 2.7 1-5.5-4-3.9 5.6-.8z" />
      </svg>
    </button>
  );
}

// A thin wrapper, not a copy: the only local part is the class the page styles.
function Glyph({ k, size = 20 }) {
  return <GameGlyph gameKey={k} size={size} className="sty-gi" />;
}

export default function StageToday() {
  const [stageTheme, setStageTheme] = useStageTheme();
  const tq = useThemeQs();
  const intro = useThemeIntro();  // and, once per browser, the switch played for them
  const hint = useThemeHint();  // one pointer at the light switch, first visit only   // carries a ?theme= review override across links
  // circuitEntryHref may or may not already carry a query, so the override
  // joins with the right separator rather than always an ampersand.
  const withTq = (href) => (tq ? href + (href.includes('?') ? tq : '?' + tq.slice(1)) : href);
  // The day's own numbers, from the hook the site header already uses, so this
  // cap and that one cannot disagree. Name resolves after mount because it
  // reads localStorage.
  const stats = useDayStats();
  const [who, setWho] = useState('');
  useEffect(() => { setWho(savedIdentity().username || ''); }, []);
  // ARM THE ARRIVAL REVEAL, and only for a page someone is actually looking at.
  // A hidden tab does not advance an animation clock, so a section that mounts
  // there holds the FROM state (opacity 0) for as long as the tab stays in the
  // background: harmless for a reader, since the fade plays when they look, but
  // it means every automated read of this page comes back blank. Without the
  // attribute the animation rules do not match at all and the content simply
  // renders. Not re-armed on a later visibilitychange: fading in a section that
  // has been sitting in the DOM for a minute is worse than not fading it.
  useEffect(() => {
    if (typeof document === 'undefined' || document.visibilityState !== 'visible') return undefined;
    const root = document.documentElement;
    root.setAttribute('data-sty-anim', '1');
    return () => root.removeAttribute('data-sty-anim');
  }, []);
  const [done, setDone] = useState(() => new Set());
  const [inprog, setInprog] = useState(() => new Set());
  // Whether daily-status has ANSWERED, which is a different question from
  // whether `done` has anything in it: an empty `done` means "nothing finished"
  // once the answer is in and "we do not know yet" before it. The unfinished
  // filter below has to tell those apart, or a guest would be told they
  // finished nothing for as long as that request is in flight.
  const [statusIn, setStatusIn] = useState(false);
  const [day, setDay] = useState('');
  // Seventeen circuit cards is a wall on a page whose job is today's puzzles,
  // so the shelf opens on its lead three and the rest are one tap away (owner,
  // 2026-08-31). The three are DISPLAY_CIRCUITS' own lead order, which is
  // deliberate and lives in lib/circuits.js.
  const [allCircs, setAllCircs] = useState(false);

  // PINS LIVE ON THE ACCOUNT, via the hook the other home already uses, so a
  // star set on either surface is the same star. Nothing here keeps its own
  // copy of the list.
  const { favorites, canPin, toggleFavorite } = useMyGames();

  // How many of each game's archive this player has done, which is what "your
  // most played" means and what the default category order sorts by. It rides
  // on the fetchDayStatus payload the day state already reads, so it costs no
  // request.
  const [archive, setArchive] = useState(null);

  // THE HAND ORDER lives on this browser, under the SAME key the other home
  // writes (sot_cat_order), so a reader who dragged their categories there
  // finds them in that order here. Null means the default, which is how much
  // this player has played each category.
  const [handOrder, setHandOrder] = useState(null);
  const [reorder, setReorder] = useState(false);

  // A TO Z: one flat list of every daily instead of nine category rows (owner,
  // 2026-08-31). It is a VIEW, not an order, so it does not touch
  // sot_cat_order — a reader who arranges their categories still finds that
  // arrangement waiting when they switch back. Persisted under its own key so
  // the choice survives a reload, the way a view preference should.
  const [az, setAz] = useState(false);
  useEffect(() => {
    try { setAz(localStorage.getItem(AZ_KEY) === '1'); } catch (e) {}
  }, []);

  // NULL until this browser's overrides are read, which is what keeps the
  // server and the first client paint agreeing on the default: everything shut.
  const [shelfOpen, setShelfOpen] = useState(null);
  useEffect(() => {
    try {
      const raw = JSON.parse(localStorage.getItem(SHELF_OPEN_KEY) || 'null');
      if (raw && typeof raw === 'object' && !Array.isArray(raw)) {
        const clean = {};
        for (const k of Object.keys(raw)) if (typeof raw[k] === 'boolean') clean[k] = raw[k];
        setShelfOpen(clean);
      } else setShelfOpen({});
    } catch (e) { setShelfOpen({}); }
  }, []);
  const toggleAz = () => {
    setAz((v) => {
      const next = !v;
      try { localStorage.setItem(AZ_KEY, next ? '1' : '0'); } catch (e) {}
      return next;
    });
  };


  useEffect(() => {
    try {
      const raw = JSON.parse(localStorage.getItem('sot_cat_order') || 'null');
      if (Array.isArray(raw) && raw.length) setHandOrder(raw);
    } catch (e) {}
  }, []);
  const saveOrder = (next) => {
    setHandOrder(next);
    try {
      if (next) localStorage.setItem('sot_cat_order', JSON.stringify(next));
      else localStorage.removeItem('sot_cat_order');
    } catch (e) {}
  };
  // THE LIVE FEED, at the foot of this page rather than a link away to /feed,
  // which is the ACTIVITY LOG and a different thing entirely (owner,
  // 2026-08-31). Same two endpoints the other home's feed reads, so the two
  // cannot disagree about how busy the day is.
  const [feed, setFeed] = useState(null);
  const [totals, setTotals] = useState(null);
  useEffect(() => {
    let alive = true;
    fetch('/api/quiz/recent')
      .then((r) => r.json())
      .then((d) => { if (alive && d && Array.isArray(d.plays)) setFeed(d.plays); })
      .catch(() => {});
    fetch('/api/quiz/totals')
      .then((r) => r.json())
      .then((d) => { if (alive && d && !d.error) setTotals(d); })
      .catch(() => {});
    return () => { alive = false; };
  }, []);

  // THE QUIZ CATALOGUE, BY TOPIC, and the site's visitor count for the footer.
  // Both belong to the bottom of this page, so both are fetched when the bottom
  // of the page is actually reached rather than on arrival: the topics payload
  // is a hundred and sixty kilobytes of titles and most readers never scroll
  // to it. One observer serves both because they light up at the same moment
  // and two would be two of the same thing.
  //
  // The route is generated at build time and cached at the edge for a day, so
  // the cost of the fetch itself is a CDN hit, not a database read.
  const [topics, setTopics] = useState(null);
  const [visitors, setVisitors] = useState(null);
  const footRef = useRef(null);
  // THE ARRIVAL COLLAPSES ONTO THIS. See app/StageWelcome.jsx: the flood
  // measures the cap late and clips down to its rectangle, so the figures it
  // was holding land in the cells they live in.
  const capRef = useRef(null);
  const [nearFoot, setNearFoot] = useState(false);
  useEffect(() => {
    const el = footRef.current;
    // No IntersectionObserver (old browser, jsdom) means fetch it rather than
    // never showing the counts: degrading to the eager behaviour is fine, and
    // silently rendering an empty section is not.
    if (!el || typeof IntersectionObserver === 'undefined') { setNearFoot(true); return undefined; }
    const io = new IntersectionObserver((entries) => {
      if (entries.some((e) => e.isIntersecting)) { setNearFoot(true); io.disconnect(); }
    }, { rootMargin: '600px 0px' });
    io.observe(el);
    return () => io.disconnect();
  }, []);
  // ── ARRIVING ON A SECTION BY HASH ───────────────────────────────────────
  //
  // A quiz end card sends the reader to /#sty-quizzes. The browser's own hash
  // scroll happens at load, and this whole page is a client component whose
  // sections do not exist until React has rendered, so the jump lands at the
  // top of the page every time and looks like a broken link rather than a slow
  // one. The section is then LAZY on top of that: its content waits on an
  // IntersectionObserver, so scrolling to it is also what fills it in.
  //
  // So: on mount, look for the element the hash names, and keep looking for a
  // short while rather than once. Capped at ~4s of animation frames, because a
  // page that scrolls itself a minute after it opened is worse than one that
  // never did. Runs only when a hash is actually present, so a plain visit is
  // untouched, and the id pattern is checked so nothing else can steer it.
  useEffect(() => {
    let hash = '';
    try { hash = String(window.location.hash || '').slice(1); } catch (e) { return undefined; }
    if (!hash || !/^sty-[a-z-]+$/.test(hash)) return undefined;
    let timer = 0;
    let done = false;
    const started = Date.now();
    const tick = () => {
      if (done) return;
      const el = document.getElementById(hash);
      // ⚠️ THE ARRIVAL CURTAIN LOCKS THE BODY WHILE IT PLAYS, so a scroll
      // issued under it does not merely land late, it does nothing at all and
      // the attempt is spent. A reader arriving here on a day they have not
      // seen the welcome would land at the top of the page, which is the exact
      // failure this effect exists to prevent. So wait for the lock to lift.
      let locked = false;
      try { locked = getComputedStyle(document.body).overflow === 'hidden'; } catch (e) {}
      if (el && !locked) {
        const before = window.scrollY;
        try { el.scrollIntoView({ block: 'start' }); } catch (e) { el.scrollIntoView(); }
        // Landing is CONFIRMED rather than assumed: the page either moved or
        // the section is already at the top. Anything else is a scroll that
        // did not take, and the loop is what gets another go at it.
        if (window.scrollY !== before || Math.abs(el.getBoundingClientRect().top) < 4) { done = true; return; }
      }
      if (Date.now() - started > 12000) return;
      timer = setTimeout(tick, 120);
    };
    // ⚠️ setTimeout, NOT requestAnimationFrame. A HIDDEN TAB RUNS NO rAF, so an
    // rAF loop never ticks once for a link opened in a background tab, which is
    // also why every automated check of this page reported it as not scrolling.
    // A timer runs either way, and this loop is cheap enough not to care.
    timer = setTimeout(tick, 0);
    // A reader who starts scrolling has taken over. Yanking them back to a
    // section they just left is worse than never having jumped.
    const stop = () => { done = true; };
    window.addEventListener('wheel', stop, { passive: true, once: true });
    window.addEventListener('touchstart', stop, { passive: true, once: true });
    window.addEventListener('keydown', stop, { once: true });
    return () => {
      done = true;
      clearTimeout(timer);
      window.removeEventListener('wheel', stop);
      window.removeEventListener('touchstart', stop);
      window.removeEventListener('keydown', stop);
    };
  }, []);

  useEffect(() => {
    if (!nearFoot) return undefined;
    let alive = true;
    fetch('/api/quiz/topics')
      .then((r) => r.json())
      .then((d) => { if (alive && d && Array.isArray(d.topics) && d.topics.length) setTopics(d.topics); })
      .catch(() => {});
    fetch('/api/visitors')
      .then((r) => r.json())
      .then((d) => { if (alive && d && typeof d.visitors === 'number') setVisitors(d.visitors); })
      .catch(() => {});
    return () => { alive = false; };
  }, [nearFoot]);

  // Which topics are open, and which have been shown in full. A Set rather than
  // one open topic at a time: the rows are fifteen quizzes each, so several
  // open at once is a shelf rather than a wall, and closing one to read another
  // is a click the reader did not ask to spend.
  const [openTopics, setOpenTopics] = useState(() => new Set());
  const [fullTopics, setFullTopics] = useState(() => new Set());
  const toggleTopic = (id) => setOpenTopics((prev) => {
    const next = new Set(prev);
    if (next.has(id)) next.delete(id); else next.add(id);
    return next;
  });
  const topicList = topics || TOPIC_SKELETON;
  const quizTotal = topics ? topics.reduce((a, t) => a + t.count, 0) : 0;

  const [board, setBoard] = useState(null);
  // THE OVERALL RANK comes from /api/quiz/me, the same place the site header
  // reads it. daily-status computes the identical figure internally (posNow) but
  // does not return it, and adding a second source for one number is how two
  // surfaces end up disagreeing about a player's rank.
  const [mine, setMine] = useState(null);
  // WHETHER EACH READ HAS ANSWERED, success or failure, which is what the
  // patches below key on. `mine === null` cannot tell a pending read from a
  // guest with no account or a failed one, and a cover that waits on a value
  // that is never coming is a cover that never leaves.
  const [mineIn, setMineIn] = useState(false);

  useEffect(() => {
    let alive = true;
    const qs = identityQs();
    if (!qs) { setMineIn(true); return undefined; }
    fetch('/api/quiz/me?light=1&' + qs)
      .then((r) => r.json())
      .then((d) => { if (alive && d && d.found !== false) setMine(d); })
      .catch(() => {})
      .finally(() => { if (alive) setMineIn(true); });
    return () => { alive = false; };
  }, []);
  useEffect(() => {
    let alive = true;
    // THROUGH THE SHARED CLIENT (2026-09-04). The arrival asks for this same
    // board for its Today column, and the two mount together, so without the
    // client one home load made the identical request twice. `identityQs`
    // produces the string `dailyBoardQuery` produces, which is what makes the
    // two the same key rather than two questions that happen to have one answer.
    fetchDailyBoard(identityQs())
      .then((d) => { if (alive && d && Array.isArray(d.overall)) setBoard(d); })
      .catch(() => {});
    return () => { alive = false; };
  }, []);

  // The register decides which end of the ramp a category wears, exactly as it
  // does on a board: the pale step on the dark ground, its dark twin on the pale.
  const light = stageTheme === 'light';
  const hueFor = (cat) => (light ? categoryColorLight(cat) : categoryColor(cat));

  // UNFINISHED SETS FIRST (owner, 2026-09-07). Every set (lib/daily-groups)
  // with at least one game finished today and at least one still open, the
  // one closest to done first, each with its first open game on the control.
  // It reads the same `done` the page already builds, gated on the status
  // answer having landed so a guest is not told they began nothing while the
  // request is in flight. Empty means the band does not render at all.
  const unfinishedSets = useMemo(() => {
    if (!statusIn || !done.size) return [];
    const out = [];
    for (const g of GROUPS) {
      const live = g.keys.filter((k) => LIVE_KEYS.has(k));
      if (live.length < 2) continue;
      const n = live.filter((k) => done.has(k)).length;
      if (!n || n === live.length) continue;
      const open = live.filter((k) => !done.has(k));
      out.push({ name: g.name, cat: g.cat, live, n, open });
    }
    return out.sort((a, b) => (a.open.length - b.open.length) || (b.n - a.n) || a.name.localeCompare(b.name));
  }, [done, statusIn]);

  useEffect(() => {
    let alive = true;
    setDay(etToday());
    fetchDayStatus().then((data) => {
      if (!alive || !data) return;
      const [Y, M, D] = etToday().split('-').map(Number);
      const yy = Y % 100;
      const completed = new Set(data.completed || []);
      const played = new Set(data.played || []);
      const abandoned = new Set(data.abandoned || []);
      const open = new Set(data.inProgress || []);
      const d = new Set();
      const p = new Set();
      for (const g of DAILY_GAMES) {
        const id = `${g.key}-${M}-${D}-${yy}`;
        if (completed.has(id) || played.has(id)) d.add(g.key);
        else if (abandoned.has(id) || open.has(id)) p.add(g.key);
      }
      setDone(d);
      setInprog(p);
      setStatusIn(true);
      if (data.archive) setArchive(data.archive);
    }).catch(() => {});
    return () => { alive = false; };
  }, []);

  // One pass over the registry, grouped into the ramp's order. Categories with
  // no games simply do not render, so the page cannot show an empty block.
  const cats = useMemo(() => RAMP_ORDER
    .map((cat) => ({ cat, games: DAILY_GAMES.filter((g) => g.cat === cat) }))
    .filter((c) => c.games.length), []);

  const total = useMemo(() => cats.reduce((n, c) => n + c.games.length, 0), [cats]);

  // THE ORDER OF THE CATEGORY ROWS. A hand order wins; otherwise they sort by
  // how much of each category this player has actually played, so the page
  // opens on what they use. A category the stored order does not name (a new
  // one, most likely) keeps its ramp position at the end rather than vanishing.
  const orderedCats = useMemo(() => {
    if (handOrder && handOrder.length) {
      const rank = new Map(handOrder.map((c, i) => [c, i]));
      return [...cats].sort((a, b) =>
        (rank.has(a.cat) ? rank.get(a.cat) : 99) - (rank.has(b.cat) ? rank.get(b.cat) : 99));
    }
    if (!archive) return cats;
    const played = (c) => c.games.reduce((n, g) => n + ((archive[g.key] && archive[g.key].played) || 0), 0);
    return [...cats].map((c, i) => [c, i])
      .sort((a, b) => (played(b[0]) - played(a[0])) || (a[1] - b[1]))
      .map(([c]) => c);
  }, [cats, handOrder, archive]);

  // Every live daily, by name. Declared AFTER `cats`: a useMemo body runs during
  // render, so reading `cats` from above its own declaration is a temporal dead
  // zone, and it took the homepage down rather than warning.
  const alpha = useMemo(
    () => cats.flatMap((c) => c.games).slice().sort((a, b) => a.name.localeCompare(b.name)),
    [cats],
  );

  const moveCat = (cat, dir) => {
    const cur = orderedCats.map((c) => c.cat);
    const i = cur.indexOf(cat);
    const j = i + dir;
    if (i < 0 || j < 0 || j >= cur.length) return;
    const next = [...cur];
    next[i] = cur[j]; next[j] = cur[i];
    saveOrder(next);
  };

  // MY GAMES: the starred set, in the order they were starred. Games only, so a
  // pin on something that has since retired simply drops out.
  const pinned = useMemo(() => {
    if (!favorites || !favorites.length) return [];
    return favorites.map((k) => DAILY_GAME_MAP[k]).filter(Boolean);
  }, [favorites]);

  // THE THREE CARDS. Each answers a different question, and each falls back to
  // the best thing it can say with what has loaded (owner, 2026-08-31), because
  // a card that renders empty while a fetch settles is worse than one that
  // starts general and sharpens.
  //
  //   1  YOURS      the game you are mid-way through, else the one you have
  //                 played most and have not played today, else the next unplayed.
  //   2  EVERYONE'S the most played daily on the site today.
  //   3  THE BOARD  who is winning, and a way down to the standings.
  const mostPlayedMine = useMemo(() => {
    if (!archive) return null;
    const pool = DAILY_GAMES.filter((g) => !done.has(g.key));
    let best = null; let bn = 0;
    for (const g of pool) {
      const n = (archive[g.key] && archive[g.key].played) || 0;
      if (n > bn) { bn = n; best = g; }
    }
    return bn > 0 ? best : null;
  }, [archive, done]);

  const lead = useMemo(() => {
    const open = DAILY_GAMES.find((g) => inprog.has(g.key));
    if (open) return { game: open, eyebrow: 'Finish', cta: 'Resume' };
    if (mostPlayedMine) return { game: mostPlayedMine, eyebrow: 'Your most played', cta: 'Play' };
    const fresh = DAILY_GAMES.find((g) => !done.has(g.key));
    return fresh ? { game: fresh, eyebrow: 'Up next', cta: 'Play' } : null;
  }, [inprog, done, mostPlayedMine]);

  const popular = useMemo(() => {
    const bg = board && Array.isArray(board.games) ? board.games : null;
    if (!bg) return null;
    // NEVER THE SAME GAME AS THE LEAD CARD. The busiest daily is very often the
    // one you are mid-way through, and two cards side by side naming the same
    // game is one card's worth of information in two cards' worth of space.
    const skip = lead && lead.game ? lead.game.key : null;
    let best = null; let bn = -1;
    for (const b of bg) {
      const g = b && DAILY_GAME_MAP[b.key];
      if (!g || typeof b.plays !== 'number' || g.key === skip) continue;
      if (b.plays > bn) { bn = b.plays; best = { game: g, plays: b.plays }; }
    }
    return best;
  }, [board, lead]);

  // TODAY'S BOARD. Top eight, plus your own row appended when you are outside
  // it — a leaderboard that cannot show you your own position is a scoreboard
  // for other people.
  const overall = board && Array.isArray(board.overall) ? board.overall : [];
  const meKey = board && board.me ? board.me.userKey : null;
  const top = overall.slice(0, 10);
  const myRow = meKey ? overall.find((r) => r && r.userKey === meKey) : null;
  const myOut = myRow && !top.some((r) => r && r.userKey === meKey) ? myRow : null;
  const topRow = top[0] && top[0].total != null ? top[0] : null;

  // THE DAY'S FIELD SIZE BELONGS ON THE BOARD, NOT THE FEED (owner, 2026-08-31).
  // It used to sit in the live feed's header between plays and time played,
  // where it read as one more traffic figure, while the board above it reported
  // its own ROW COUNT as "10 players", which says ten people played today when
  // ten is just how many rows fit. So the board names what it is a top ten OF.
  // `todayPlayers` counts everyone who played today, guests included, while the
  // board ranks registered players only; that is the same denominator the end
  // card's "#N of M" already uses. Falls back to the row count until totals
  // land, and whenever the field is not actually bigger than the rows shown.
  const fieldToday = (totals && totals.todayPlayers) || 0;
  const boardCount = fieldToday > top.length
    ? `Top ${top.length} of ${fieldToday.toLocaleString()} players`
    : `${overall.length} ${overall.length === 1 ? 'player' : 'players'}`;

  // YOUR STANDING. How the reader finished in each game they have played today,
  // which is the one thing this home could not answer: a card said "done" and
  // the ladder lit a rung, both of them binary, and the board below reports the
  // COMBINED day. Where you came in Crux was nowhere on the page (owner,
  // 2026-09-01).
  //
  // IT COSTS NO REQUEST. daily-combined is already fetched for the board above,
  // and its `me.perGame` is keyed by every game the reader scored today. The
  // rank on it is the registered-only board rank the route already substitutes,
  // so this cannot disagree with the game's own board about where you came.
  //
  // Retired games are filtered out for the same reason the roster is: an
  // archived day still scores, so a retired key can appear here.
  const standing = useMemo(() => {
    const pg = board && board.me && board.me.perGame ? board.me.perGame : null;
    if (!pg) return [];
    const out = [];
    for (const key of Object.keys(pg)) {
      const g = DAILY_GAME_MAP[key];
      const r = pg[key];
      if (!g || !LIVE_KEYS.has(key) || !r || r.rank == null) continue;
      // AN UNFINISHED GAME HAS NO STANDING (owner, 2026-09-01). An abandoned
      // row is a started-and-left run: it is filed, and it does score, so it
      // arrives here carrying a real rank. But "you came 12th" is not true of a
      // game the reader walked out of, and it read as one more finished game on
      // the card and in this table. Dropping it here fixes all three at once,
      // since the card reads standBy off this memo and the eyebrow counts it.
      //
      // THE TEST IS POSITIVE EVIDENCE OF A FINISH, not the absence of a flag,
      // and it takes two signals because neither one covers both readers.
      // `abandoned` travels on the row itself and is exact for a REGISTERED
      // player: a real finish supersedes an earlier abandon in combineDaily, so
      // the flag is true only when they never finished, and an explicit `false`
      // is a finish we can vouch for the moment the board lands. A GUEST's
      // perGame comes from guestProvisional, which carries rank and field and
      // nothing else, so the flag is undefined and the local `done` set is the
      // test instead — daily-status builds it from the same never-finished
      // definition and it crosses devices.
      //
      // Written this way round so no row can appear ranked and then vanish: an
      // undefined flag waits for the status rather than being read as a finish.
      if (!(r.abandoned === false || (statusIn && done.has(key)))) continue;
      out.push({ ...r, key, g });
    }
    // BEST FIRST. The question is "how did I do", so the answer opens with the
    // best answer; rank breaks a tie on points, and the name breaks that.
    out.sort((a, b) => (b.points || 0) - (a.points || 0)
      || (a.rank || 999) - (b.rank || 999)
      || a.g.name.localeCompare(b.g.name));
    return out;
  }, [board, done, statusIn]);
  const standBy = useMemo(() => {
    const m = {};
    for (const s of standing) m[s.key] = s;
    return m;
  }, [standing]);

  // TODAY'S PLAYS BY CATEGORY. totals.todayByQuiz is a play count per quizId and
  // a daily's quizId carries its key, so the day's shape falls out of a payload
  // the page already has. Drawn in the nine ramp steps, which is the only colour
  // family this surface spends.
  const catPlays = useMemo(() => {
    const t = totals && totals.todayByQuiz ? totals.todayByQuiz : null;
    if (!t) return [];
    const m = new Map();
    for (const qid of Object.keys(t)) {
      const g = gameOfQuizId(qid);
      if (!g || !LIVE_KEYS.has(g.key)) continue;
      m.set(g.cat, (m.get(g.cat) || 0) + (Number(t[qid]) || 0));
    }
    return RAMP_ORDER.filter((c) => m.get(c)).map((c) => [c, m.get(c)]);
  }, [totals]);
  const catPlayMax = catPlays.reduce((a, r) => Math.max(a, r[1]), 0);
  const avgPlay = totals && totals.today ? Math.round((totals.todayTime || 0) / totals.today) : 0;

  // Resolvable dailies only, most recent first, capped: a feed is a glance at
  // what is happening, not a log.
  const live = useMemo(() => {
    if (!feed) return [];
    const out = [];
    for (const f of feed) {
      const game = gameOfQuizId(f && f.quizId);
      if (!game || f.total == null) continue;
      out.push({ ...f, game });
      if (out.length >= 10) break;
    }
    return out;
  }, [feed]);

  // CIRCUITS. The set is DISPLAY_CIRCUITS and the membership is
  // circuitKeysFor(id, day), which is the call that owns rotation — reading
  // the raw keys instead would show yesterday's run on a rotating circuit.
  // Today's plays per game, off the board this page already fetches. Defined
  // HERE rather than borrowed: playsOf and bgames belong to the other home, and
  // reaching for them by name compiled cleanly and threw at runtime.
  const playsBy = useMemo(() => {
    const m = new Map();
    const gs = board && Array.isArray(board.games) ? board.games : [];
    for (const g of gs) if (g && g.key) m.set(g.key, g.plays || 0);
    return m;
  }, [board]);

  // THE NEWCOMER'S TEN. One tile per category, in ramp order rather than the
  // reader's own (a reader with no footprint has not ordered anything, and the
  // ramp is the order the categories are numbered in). The busiest daily in the
  // category once its leader has cleared the floor, the editorial default until
  // then. Costs no request: playsBy is already on the page.
  const newcomerPicks = useMemo(() => cats.map(({ cat, games }) => {
    // The run-shaped quizzes come out FIRST, so they can win neither the count
    // nor the fallback. A category they would empty keeps its whole roster.
    const open = games.filter((g) => !NEWCOMER_SKIP.has(g.key));
    const pool = open.length ? open : games;
    let best = null; let bn = -1;
    for (const g of pool) {
      const p = playsBy.get(g.key) || 0;
      if (p > bn) { bn = p; best = g; }
    }
    if (best && bn >= NEWCOMER_FLOOR) return { cat, game: best };
    const pick = DAILY_GAME_MAP[NEWCOMER_PICKS[cat]];
    const ok = pick && pick.cat === cat && LIVE_KEYS.has(pick.key) && !NEWCOMER_SKIP.has(pick.key);
    return { cat, game: ok ? pick : pool[0] };
  }), [cats, playsBy]);

  const circuits = useMemo(() => {
    if (!day) return [];
    return DISPLAY_CIRCUITS.map((c) => {
      let keys = [];
      try { keys = circuitKeysFor(c.id, day) || []; } catch (e) { keys = []; }
      const games = keys.map((k) => DAILY_GAME_MAP[k]).filter(Boolean);
      if (!games.length) return null;
      const n = games.filter((g) => done.has(g.key)).length;
      // A circuit spans categories, so it wears its LEAD game's step rather
      // than inventing a tenth colour.
      // POPULARITY IS THE SUM OF ITS GAMES' PLAYS TODAY (owner, 2026-08-31), so
      // the shelf leads with what the site is actually playing rather than a
      // fixed editorial order. Summed, not averaged: a circuit of five busy
      // games IS a busier circuit than one of two.
      const pop = games.reduce((t, g) => t + (playsBy.get(g.key) || 0), 0);
      // A circuit spans categories, so it wears its LEAD game's step rather
      // than inventing a tenth colour.
      return { id: c.id, name: c.name, blurb: c.blurb || '', games, n, pop, hue: hueFor(games[0].cat) };
    }).filter(Boolean)
      // THE ORDER (owner, 2026-08-31), in four terms:
      //
      //   1  A FINISHED CIRCUIT GOES TO THE END. It is a record, not an
      //      invitation, and that applies to the two pinned ones too — finish
      //      the Gauntlet and it leaves the front.
      //   2  Then the two the site leads with: the Gauntlet, then the Five.
      //   3  Then the ones the reader is furthest INTO. Three sudokus done says
      //      more about what they want next than any editorial order does.
      //   4  Popularity settles the rest, so a reader who has started nothing
      //      still sees the busiest circuits first.
      //
      // Stable on the original index underneath, so equal circuits never swap
      // places between renders.
      .map((c, i) => [c, i])
      .sort((a, b) => {
        const A = a[0], B = b[0];
        const doneA = A.n === A.games.length ? 1 : 0;
        const doneB = B.n === B.games.length ? 1 : 0;
        return (doneA - doneB)
          || (leadRankOf(A.id) - leadRankOf(B.id))
          || (B.n - A.n)
          || (B.pop - A.pop)
          || (a[1] - b[1]);
      })
      .map(([c]) => c);
  }, [day, done, light, playsBy]);   // eslint-disable-line react-hooks/exhaustive-deps

  // THE TWO CIRCUITS ON THE NEWCOMER ROW, read out of the shelf's own memo so
  // the name, the blurb and the hue cannot disagree with the shelf below, and so
  // the Five's hue follows its rotating lead game rather than being guessed. It
  // needs the day, so both cards arrive with the rest of the day's data; the ten
  // tiles under them do not wait on it.
  //
  // TWO CARDS ON ONE LINE MUST NOT WEAR THE SAME STEP. A circuit takes its LEAD
  // GAME's category, and the marquee crosses every category by construction, so
  // on any day its lead happens to be a Trivia game both cards come out the same
  // orange and read as one block rather than two (live, 2026-09-04). The ramp
  // already carries this rule for the shelves, which owe their neighbours 30
  // degrees; a card owes the card beside it at least a different step. So the
  // second circuit walks its OWN games for the first category not already on the
  // row, which keeps the hue category-derived rather than invented, and changes
  // nothing on a day the two leads already differ.
  const newcomerCircs = useMemo(() => {
    const out = []; const used = new Set();
    for (const id of NEWCOMER_CIRCS) {
      const c = circuits.find((x) => x.id === id);
      if (!c || !c.games.length) continue;
      const pick = c.games.find((g) => !used.has(g.cat)) || c.games[0];
      used.add(pick.cat);
      out.push({ ...c, cat: pick.cat, hue: hueFor(pick.cat) });
    }
    return out;
  }, [circuits, light]);   // eslint-disable-line react-hooks/exhaustive-deps

  // A CIRCUIT'S STANDING, and only a FINISHED circuit has one (owner,
  // 2026-09-01). The combined board refuses to rank a player who has not played
  // every game of a skill circuit — see rankRequiresAll in the daily-combined
  // route — so a part-done circuit has no honest figure to show, and a finished
  // one is exactly the case where the card no longer needs its blurb: the
  // reader has read it, played it, and wants the result instead.
  //
  // ONE REQUEST PER FINISHED CIRCUIT, asked once and never re-asked (the ref,
  // not state, so the effect cannot chase its own writes), and capped: a reader
  // finishes one or two circuits in a day, not seventeen.
  //
  // THE ANSWER IS KEPT WHATEVER THE EFFECT DOES NEXT (owner report, 2026-09-01:
  // a finished Gauntlet showed 7/7 and no rank while the API returned #4).
  // `circuits` is rebuilt whenever the live plays tick, so this effect re-ran
  // every few seconds; its cleanup flipped an `alive` flag that made the
  // in-flight response DROP on arrival, and the circuit was already in the
  // asked set, so it was never asked again. The request is keyed by circuit and
  // the write is keyed by circuit, so a late answer is never a stale one: the
  // only thing that may discard it is the component unmounting.
  const circAsked = useRef(null);
  const circLive = useRef(true);
  useEffect(() => () => { circLive.current = false; }, []);
  const [circStand, setCircStand] = useState({});
  useEffect(() => {
    if (!circAsked.current) circAsked.current = new Set();
    const full = circuits
      .filter((c) => c.games.length && c.n === c.games.length && !circAsked.current.has(c.id))
      .slice(0, 4);
    if (!full.length) return undefined;
    const qs = identityQs();
    for (const c of full) {
      circAsked.current.add(c.id);
      fetch(`/api/quiz/daily-combined?circuit=${encodeURIComponent(c.id)}${qs ? '&' + qs : ''}`)
        .then((r) => r.json())
        .then((d) => {
          if (!circLive.current || !d) return;
          const rank = d.me && d.me.rank != null ? d.me.rank : null;
          const field = d.overallField || (Array.isArray(d.overall) ? d.overall.length : 0);
          setCircStand((m) => ({ ...m, [c.id]: rank ? { rank, field } : null }));
        })
        .catch(() => { if (circLive.current) setCircStand((m) => ({ ...m, [c.id]: null })); });
    }
    return undefined;
  }, [circuits]);
  // THE LADDER SHRINKS ON A PHONE and its key comes off entirely (owner,
  // 2026-08-31: "takes up too much space"). The key is nine labelled swatches,
  // which wrap to three lines at 390 and push the first playable thing off the
  // screen — and every one of those counts is repeated on its own category row
  // further down. The graphic itself still says which categories are done,
  // because that is what its colour is for; it just says it in less height.
  // THE STANDING SCROLLS TO THE BOARD'S HEIGHT (owner, 2026-09-01). Paired at
  // full width they are two tables of different lengths, and a sixteen-row
  // standing beside an eleven-row board left the right-hand column short and the
  // section ragged. The board is measured rather than guessed at a row count,
  // because a small field genuinely renders fewer than ten rows. No feedback
  // loop: the standing's height does not affect the board's, since the pair is
  // align-items:start.
  const lbRef = useRef(null);
  const [lbH, setLbH] = useState(null);
  useEffect(() => {
    const el = lbRef.current;
    if (!el || typeof ResizeObserver === 'undefined') return undefined;
    const set = () => setLbH(Math.round(el.getBoundingClientRect().height));
    set();
    const ro = new ResizeObserver(set);
    ro.observe(el);
    return () => ro.disconnect();
    // myOut is an object rebuilt every render, so the dep is its PRESENCE:
    // passing the object itself tore down and rebuilt the observer on every
    // pass, which is a lot of churn for a height that only moves when the
    // board gains or loses its trailing "you" row.
  }, [top.length, standing.length, !!myOut]);

  const [narrow, setNarrow] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia('(max-width: 640px)');
    const on = () => setNarrow(mq.matches);
    on();
    mq.addEventListener('change', on);
    return () => mq.removeEventListener('change', on);
  }, []);
  const ladH = narrow ? 20 : 54;

  // WHERE THE A-TO-Z / REORDER BAR SITS (owner, 2026-09-02). A first-time or
  // unregistered visitor on a phone gets it at the FOOT of the categories, not
  // the top: those two controls rearrange a page the reader has not read yet,
  // and on a 390px screen they took the first line under the cap. A returning
  // or registered reader keeps them at the top, where a habit expects them.
  // "Returning" is the footprint test WelcomeOverlay uses: a saved identity,
  // any sot_<key>_day breadcrumb, or any per-puzzle save. null until the effect
  // runs, so the server and the first client paint agree (bar at the top); a
  // new phone visitor sees it drop once, on that first paint only.
  const [returning, setReturning] = useState(null);
  useEffect(() => {
    let r = false;
    try {
      if (localStorage.getItem('sot_quiz_identity')) r = true;
      for (let i = 0; !r && i < localStorage.length; i += 1) {
        const k = localStorage.key(i) || '';
        if (!k.startsWith('sot_')) continue;
        // Only a GAME's breadcrumb counts. sot_welcome_day (the arrival curtain's
        // once-a-day stamp), sot_hub_* and sot_theme* are written on a first
        // visit and would make every reader look like a returning one, which is
        // exactly what happened on the first deploy of this (2026-09-02).
        if (/^sot_(?!welcome_|hub_|theme|quiz_|vid_)[a-z]+_day$/.test(k)) r = true;
        else if (/^sot_(?!welcome_|hub_|theme|quiz_|vid_)[a-z]+_\d/.test(k)) r = true;
      }
    } catch (e) { r = true; }
    setReturning(r);
  }, []);
  const ordBelow = narrow && returning === false;
  const ordBar = (
    <div className="sty-ord">
      <button type="button" className={'sty-more sty-ordb' + (az ? ' on' : '')} onClick={toggleAz}>
        {az ? 'By category' : 'A to Z'}
      </button>
      {/* Reordering categories is meaningless while the categories are not
          being shown, so the control goes away rather than sitting there
          inert. */}
      {!az ? (
        <button type="button" className="sty-more sty-ordb" onClick={() => setReorder((v) => !v)}>
          {reorder ? 'Done reordering' : 'Reorder categories'}
        </button>
      ) : null}
      {!az && reorder && handOrder ? (
        <button type="button" className="sty-more sty-ordb" onClick={() => saveOrder(null)}>Reset to default</button>
      ) : null}
    </div>
  );

  // HOW MANY CIRCUITS FIT is a question only the rendered grid can answer, so
  // it is read off the element's own computed columns rather than derived from
  // a breakpoint. Re-measured on resize; falls back to three before it mounts.
  const circRef = useRef(null);
  const [circCols, setCircCols] = useState(3);
  useEffect(() => {
    const el = circRef.current;
    if (!el) return undefined;
    const read = () => {
      const cols = window.getComputedStyle(el).gridTemplateColumns.split(' ').filter(Boolean).length;
      if (cols > 0) setCircCols(cols);
    };
    read();
    const ro = new ResizeObserver(read);
    ro.observe(el);
    return () => ro.disconnect();
  }, [circuits.length]);
  // THE SHELF OPENS ON EXACTLY ONE FULL ROW (owner, 2026-09-01). One card in a
  // seven-column grid is a hole rather than a shelf, so the peek is however many
  // circuits FIT across, measured off the grid's own computed columns rather
  // than guessed from a breakpoint.
  //
  // The Gauntlet, the Five and Sudoku lead it whatever their state, in that
  // order. The sort below sends a FINISHED circuit to the end, which is right
  // for the shelf in general and wrong for the three the page is built around:
  // finish the Gauntlet at 7/7 and it would leave the front on the very day it
  // was played. A phone's peek is exactly the three.
  const circPeek = narrow ? CIRC_PEEK_NARROW : Math.max(1, circCols);
  const circLead = useMemo(() => {
    const byId = new Map(circuits.map((c) => [c.id, c]));
    const lead = LEAD_CIRCUITS.map((id) => byId.get(id)).filter(Boolean);
    const rest = circuits.filter((c) => !LEAD_CIRCUITS.includes(c.id));
    return [...lead, ...rest].slice(0, Math.max(1, circPeek));
  }, [circuits, circPeek]);

  // The starred CIRCUITS, resolved against today's cards so a circuit carries
  // the day's real roster. Declared below `circuits` on purpose: this body runs
  // during render, so reading a const declared further down is a TDZ throw.
  const pinnedCircs = useMemo(() => {
    if (!favorites || !favorites.length) return [];
    const byId = new Map(circuits.map((c) => [c.id, c]));
    return favorites.filter(isCircPin).map((k) => byId.get(circPinId(k))).filter(Boolean);
  }, [favorites, circuits]);
  const mineTot = pinned.length + pinnedCircs.length;
  const mineDone = pinned.filter((g) => done.has(g.key)).length
    + pinnedCircs.filter((c) => c.n === c.games.length).length;

  // ── which sections are open ─────────────────────────────────────────
  // The Circuits shelf opens for EVERY reader, first visit included (owner,
  // 2026-09-01): its one row is the Gauntlet, the Five and Sudoku, which is the
  // page's own invitation. My games opens only for a reader with stars, since
  // it is empty for anyone else, and every category stays a title until opened.
  // A stored override (a shelf shut by hand) still wins over either default.
  // The Word category opens too (owner, 2026-09-01, same day): it is the
  // biggest shelf and the one a new reader is most likely to know a game on.
  const hasPins = mineTot > 0;
  const openDefault = (id) => (id === CIRC_ID || id === WORD_ID ? true : (id === MINE_ID ? hasPins : false));
  const isOpen = (id) => (shelfOpen && Object.prototype.hasOwnProperty.call(shelfOpen, id)
    ? !!shelfOpen[id]
    : openDefault(id));
  const setOpen = (id, on) => {
    setShelfOpen((cur) => {
      const next = { ...(cur || {}), [id]: !!on };
      try { localStorage.setItem(SHELF_OPEN_KEY, JSON.stringify(next)); } catch (e) {}
      return next;
    });
  };
  // The head is the toggle, but it also carries the reorder arrows, so a click
  // that landed on a control of its own is not a click on the head.
  const headClick = (id) => (e) => {
    try { if (e.target && e.target.closest && e.target.closest('a,button')) return; } catch (x) {}
    setOpen(id, !isOpen(id));
  };
  const cav = (id) => (
    <button
      type="button"
      className={'sty-cav' + (isOpen(id) ? ' on' : '')}
      aria-expanded={isOpen(id)}
      aria-label={isOpen(id) ? 'Collapse this section' : 'Show this section'}
      onClick={(e) => { e.stopPropagation(); setOpen(id, !isOpen(id)); }}
    >
      <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor"
        strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M6 9l6 6 6-6" />
      </svg>
    </button>
  );

  const playedCount = done.size;
  // light=1 returns the flat `rank`; full mode nests it under ranks.xp. Both are
  // the IQ board's position, so read either.
  const rank = mine ? ((mine.ranks && mine.ranks.xp) || mine.rank || null) : null;
  // The cap's three figures come off two reads (daily-status via useDayStats,
  // /api/quiz/me for the all-time rank); the cells wait until BOTH are in, so
  // the row lands once rather than one figure at a time.
  const capWait = !!who && (!stats.ready || !mineIn);

  // THE DAY, as one ladder. Blocks flex by their game count, so a block's width
  // says how big its category is, which is true and useful rather than decorative.
  const blocks = useMemo(() => cats.map(({ cat, games }) => ({
    n: games.length,
    c: hueFor(cat),
    on: games.map((g) => done.has(g.key)),
    half: games.map((g) => inprog.has(g.key)),
  })), [cats, done, inprog, light]);   // eslint-disable-line react-hooks/exhaustive-deps

  // UP NEXT is the first game of the day nobody has started, in registry order,
  // preferring one already in progress: finishing beats starting.
  const next = useMemo(() => {
    const open = DAILY_GAMES.find((g) => inprog.has(g.key));
    return open || DAILY_GAMES.find((g) => !done.has(g.key)) || null;
  }, [done, inprog]);

  return (
    <div className="sty stage-page" data-stage-theme={stageTheme}>
      <style>{CSS}</style>
      <StageWelcome capRef={capRef} />
      {/* NEW-GAME PREMIERES: once per launch, returning players who have not
          played it, after the arrival has finished. See app/PremierePop.jsx. */}
      <PremierePop />

      {/* 1. THE CAP. One line: the identity, then the day's figures, then the
             controls at the right edge, as on every board. */}
      <div className="sty-cap" ref={capRef}>
        {/* THE SAME BRAND AS EVERY BOARD (owner, 2026-08-31). The stage cap on
            a game page carries the mark beside the words, and the home was
            still setting the words alone, so the two surfaces disagreed about
            what the site's own logo is. MindLoftMark is the one component; the
            accent is --stg-brand (sky on the dark register, the brand blue on
            the pale one), never a category step, on this and every stage cap
            (owner, 2026-09-01). */}
        <div className="sty-id">
          <span className="sty-brand">
            <MindLoftMark size={20} ink="var(--stg-ink)" accent="var(--stg-brand,#7dd3fc)" />
            <b>Mind <em>Loft</em></b>
          </span>
          <span className="sty-date">{fmtDate(day)}</span>
        </div>
        <div className="sty-figs">
          {/* NO NAME, NO FIGURES: a reader without an account has nothing to
              put in this bar, so it offers them the one thing that would fill
              it rather than sitting empty (owner, 2026-08-31). */}
          {!who ? (
            <a className="sty-signup" href="/?signup=1">
              {/* Copy is the owner's, title case (2026-09-02). */}
              <b>Choose a Name</b><i>Keep Your Stats</i>
            </a>
          ) : null}
          {who ? <div className="sty-who"><b>{who}</b><i>player</i></div> : null}
          {/* THREE FIGURES, TODAY FIRST, THEN ALL TIME (owner, 2026-08-31):
              IQ today, rank today, rank. The day is what a player came back to
              see, and the two figures that describe it now sit together instead
              of with the all-time rank wedged between them. The all-time rank
              closes the row, which is also what the arrow beside it opens.

              "rank today" replaces the old "today's board" label for the same
              reason: three cells reading IQ TODAY / RANK TODAY / RANK say how
              they relate at a glance, where a cell named after a different noun
              did not.

              An earlier cap tried to say the first two at once — the day's rank
              MOVEMENT with the IQ in parentheses — and broke on the common case:
              a move of 0 rendered an em dash under a label reading "rank today",
              with a dangling "(+130)" explaining a number that was not there. A
              day's play very often moves nobody, so the resting state of that
              cell was a dash. Rank and the day's gain are two figures and read
              as two.

              Each is drawn only when it is real, and the movement chip appears
              only when there IS movement: no arrow means no change, which is
              the honest way to say it. */}
          {/* THE PATCH (owner, 2026-09-01): while the reads are out, each cell
              is drawn at its size with the ten-rung loop standing where the
              figure will, no box around it, and the loop collapses off the
              figure when its own read lands. These three cells are the ONLY
              place it goes (owner): everything else that waits on a read sits
              below the fold on arrival. Only a reader with a name has cells to cover; a guest
              has the sign-up link above, which waits on nothing. The children
              are KEYED so the StagePatch instance survives the swap from the
              placeholder to the real figure, which is what lets the collapse
              play over the number rather than the cover simply vanishing. A
              cell whose value turns out to be absent (no play yet today) leaves
              with its cover, which is honest: there was nothing to reveal. */}
          {capWait || stats.todayXp ? (
            <div className={'sty-fc' + (capWait ? ' wait' : '')}>
              {capWait ? null : <b key="v" className="sty-up">+{stats.todayXp.toLocaleString()}</b>}
              {capWait ? null : <i key="l">IQ today</i>}
              {who ? <StagePatch key="p" on={capWait} light={light} /> : null}
            </div>
          ) : null}
          {capWait || stats.dayRank ? (
            <div className={'sty-fc' + (capWait ? ' wait' : '')}>
              {capWait ? null : <b key="v">#{stats.dayRank}{stats.dayField ? <i>/{stats.dayField}</i> : null}</b>}
              {capWait ? null : <i key="l">rank today</i>}
              {who ? <StagePatch key="p" on={capWait} light={light} /> : null}
            </div>
          ) : null}
          {capWait || rank ? (
            <div className={'sty-fc' + (capWait ? ' wait' : '')}>
              {capWait ? null : (
                <b key="v">
                  #{rank.toLocaleString()}
                  {stats.rankChange ? (
                    <i className={stats.rankChange > 0 ? 'sty-up' : 'sty-dn'}>
                      {' '}{stats.rankChange > 0 ? '\u25b2' : '\u25bc'}{Math.abs(stats.rankChange)}
                    </i>
                  ) : null}
                </b>
              )}
              {capWait ? null : <i key="l">rank</i>}
              {who ? <StagePatch key="p" on={capWait} light={light} /> : null}
            </div>
          ) : null}
          {/* AND THE WAY THROUGH TO THE REST. Three figures is what fits on a
              cap; everything behind them — the trophy case, the category
              breakdown, the activity log — is the Stat Hub, and until now
              nothing on this page said so. Only drawn for a reader who has a
              name, because a guest has no hub to open. */}
          {who ? (
            <a className="sty-all" href={withTq('/quizzes/hub')}>
              <span>All stats</span>
              <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor"
                strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M5 12h13M13 6l6 6-6 6" />
              </svg>
            </a>
          ) : null}
          {/* NO PLAYED COUNT HERE (owner, 2026-08-31): the ladder directly
              below is that number drawn, and every category row carries its own
              n/N. The cap says what the day has EARNED you. */}
        </div>
        {/* TWO MORE WAYS OUT, beside the light switch: down to today's standings
            and across to the activity feed (owner, 2026-08-31). On a phone
            these are the row-one controls and the figures take row two. */}
        {/* YOUR OWN DAY COMES FIRST of the three ways down, because it is the
            only one of them about the reader. Drawn only when there is a day to
            show, so it never points at a section that is not there. */}
        {standing.length ? (
          <a className="sty-cx sty-st" href="#sty-standing" aria-label="Your standing" title="Your standing">
            <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor"
              strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <circle cx="12" cy="8" r="3.6" />
              <path d="M4.8 20.5c0-3.6 3.2-5.6 7.2-5.6s7.2 2 7.2 5.6" />
            </svg>
          </a>
        ) : null}
        <a className="sty-cx sty-lb" href="#sty-board" aria-label="Today's board" title="Today's board">
          <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor"
            strokeWidth="2.2" strokeLinecap="round" aria-hidden="true">
            <path d="M4 21v-6M12 21V4M20 21v-10" />
          </svg>
        </a>
        <a className="sty-cx sty-lf" href="#sty-live" aria-label="Live feed" title="Live feed">
          <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor"
            strokeWidth="2.2" strokeLinecap="round" aria-hidden="true">
            <path d="M4 12h3l2.5-6 4 13 2.5-7H21" />
          </svg>
        </a>
        <button
          type="button"
          className={'sty-cx sty-tg' + (hint ? ' hint' : '')}
          onClick={() => setStageTheme(stageTheme === 'light' ? 'dark' : 'light')}
          aria-label={stageTheme === 'light' ? 'Switch to dark' : 'Switch to light'}
          title={stageTheme === 'light' ? 'Switch to dark' : 'Switch to light'}
        >
          {stageTheme === 'light' ? (
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
          {intro ? (
            <span className="stg-tlab">{intro === 'light' ? 'Light mode' : 'Dark mode'}</span>
          ) : null}
        </button>
        {/* THE EXPLICIT POINTER at the switch above, first visit only. It is
            the cap's LAST CHILD on purpose: it reads its own parent to find
            the glyph and measure itself against it. */}
        <ThemePop />
      </div>
      <div className="sty-prog"><span style={{ width: `${total ? (playedCount / total) * 100 : 0}%` }} /></div>

      <div className="sty-wrap">
        {/* 2. THE DAY'S PROGRESS. The page's one graphic, and it appears only
            once there is progress to report (owner, 2026-09-01): a first-time
            reader has nothing started, so an all-dark ladder would be a bar
            of nothing at the top of the page. It arrives with the first
            half-colour (started) or full-colour (finished) block, and
            everything above it simply sits higher until then. `done` and
            `inprog` are both empty on the server and on the first client
            paint, so SSR and hydration agree on "absent". */}
        {/* THE SUNDAY LEDGER (owner, 2026-09-07): the week, on a Sunday, above
            everything. Renders nothing on the other six days and nothing on the
            server; see app/SundayLedger.jsx. */}
        <SundayLedger light={light} withTq={withTq} />

        {/* UNFINISHED BUSINESS, before anything else on the page (owner,
            2026-09-07): the sets begun today and not finished. It wears the
            gold rule the Daily Five band used for the same meaning, and it is
            absent on a fresh morning, so the page is exactly what it was until
            there is something to come back to. */}
        {unfinishedSets.length ? (
          <section className="sty-cat sty-unf sty-rev" style={{ '--cc': light ? '#7c5104' : '#e8b43a' }}>
            <div className="sty-cathead">
              <h2>Unfinished business</h2>
              <b>{unfinishedSets.length}<i>&nbsp;{unfinishedSets.length === 1 ? 'set' : 'sets'}</i></b>
            </div>
            <div className="sty-unfl">
              {unfinishedSets.slice(0, UNF_MAX).map((st) => {
                const g = DAILY_GAME_MAP[st.open[0]];
                if (!g) return null;
                return (
                  <a key={st.name} className="sty-unfr" href={withTq(g.href || `/${g.key}`)}
                    style={{ '--sc': hueFor(st.cat), '--son': light ? categoryOnrampLight(st.cat) : RAMP_INK }}>
                    <span className="sty-unfc" aria-hidden="true" />
                    <span className="sty-unfb">
                      <span className="sty-unfn">{st.name}</span>
                      <span className="sty-unfs">{st.n} of {st.live.length} &middot; {st.open.length === 1 ? 'one left' : `${st.open.length} left`}</span>
                      <span className="sty-unfp" aria-hidden="true">{st.live.map((k) => <s key={k} className={done.has(k) ? 'on' : ''} />)}</span>
                    </span>
                    <span className="sty-unfgo">Play {g.name}</span>
                  </a>
                );
              })}
            </div>
            {/* A heavy player can have nine open sets by noon; four is a band,
                nine is a page. The rest are on their shelves below. */}
            {unfinishedSets.length > UNF_MAX ? (
              <div className="sty-unfmore">and {unfinishedSets.length - UNF_MAX} more on the shelves below</div>
            ) : null}
          </section>
        ) : null}

        {(done.size > 0 || inprog.size > 0) ? (
        <section className="sty-day sty-rev">
          <div className="sty-eb">The day&rsquo;s progress <span className="sty-ebn">{playedCount} of {total}</span></div>
          <StageLadder height={ladH} blocks={blocks} light={light} />
        </section>
        ) : null}

        {/* THE SLATE'S HEADING (owner, 2026-09-02). One line under the ladder,
            above the first row of games, saying what the rest of the page is.
            Static, so it needs no fade and shows on the server render. */}
        <h2 className="sty-slate">Today&rsquo;s fresh slate of puzzles</h2>

        {/* THE NEWCOMER'S ROW, and ONLY for a reader with no footprint.
            `returning` is the footprint test the A-to-Z bar's ordBelow already
            uses (a saved identity, any sot_<key>_day breadcrumb, any per-puzzle
            save), and it is null until its effect runs. So the server and the
            first client paint render NOTHING and the row arrives after mount:
            a returning reader, who is the far commoner case, never sees it
            flicker in and back out.

            EVERY CARD HERE IS FILLED, and each one publishes its own
            --stg-onramp, because the ink that carries on a step is a property of
            the STEP and of the register, not of the page. */}
        {returning === false ? (
          <section className="sty-cat sty-new sty-rev" style={{ '--cc': 'var(--stg-ink2)' }}>
            <div className="sty-cathead">
              <h2>Start here</h2>
              <b>{newcomerPicks.length}<i>&nbsp;categories</i></b>
            </div>
            <div className="sty-one">
              {newcomerCircs.length ? (
                <div className="sty-two">
                  {newcomerCircs.map((c) => (
                    <a key={c.id} className="sty-next" href={withTq(circuitEntryHref(c.id))}
                      style={{
                        '--cc': c.hue,
                        '--ccl': categoryAccentInkLight(c.cat),
                        '--stg-onramp': light ? categoryOnrampLight(c.cat) : RAMP_INK,
                      }}>
                      <div className="sty-newl">
                        <div className="sty-eb">Circuit</div>
                        <div className="sty-nm">{c.name}</div>
                        {c.blurb ? <div className="sty-tag">{c.blurb}</div> : null}
                      </div>
                      <span className="sty-go">Play</span>
                    </a>
                  ))}
                </div>
              ) : null}
              <div className="sty-pop">
                {newcomerPicks.map(({ cat, game }) => (
                  <a key={cat} className="sty-g" href={`${routeOf(game)}${tq ? '?' + tq.slice(1) : ''}`}
                    style={{
                      '--cc': hueFor(cat),
                      '--ccl': categoryAccentInkLight(cat),
                      '--stg-onramp': light ? categoryOnrampLight(cat) : RAMP_INK,
                    }}>
                    <span className="sty-pcat">{cat}</span>
                    <span className="sty-gn"><Glyph k={game.key} size={17} />{game.name}</span>
                    <span className="sty-gt">{game.tag}</span>
                  </a>
                ))}
              </div>
            </div>
          </section>
        ) : null}

        {/* NO CARDS ABOVE MY GAMES (owner, 2026-08-31). The three of them —
               what you are mid-way through, what is most played, who is
               leading — each restated something the page already says further
               down, and together they pushed the reader's OWN games below the
               fold. My games is the top section now; the day's ladder above it
               is the only thing that outranks a reader's own choices. */}
        {/* MY GAMES: the starred set, above everything a reader did not choose.
            Only shown when there are stars, so it never sits there empty asking
            to be filled. */}
        {/* The SECTION's rule is neutral because this row is not a category:
            the cards inside it carry their own categories' colours. */}
        {(mineTot || !who) ? (
          <section className="sty-cat sty-mine sty-rev" style={{ '--cc': 'var(--stg-ink2)' }}>
            {/* An empty section has nothing to collapse and no fraction to
                print, so the head keeps its title and drops both. */}
            <div className="sty-cathead" onClick={mineTot ? headClick(MINE_ID) : undefined}>
              <h2>My games</h2>
              {mineTot ? <b>{mineDone}<i>/{mineTot}</i></b> : null}
              {mineTot ? cav(MINE_ID) : null}
            </div>
            {!mineTot ? (
              <a className="sty-join" href="/?signup=1">
                <div className="sty-newl">
                  <div className="sty-eb">Nothing pinned yet</div>
                  <div className="sty-jn">Choose a Name</div>
                  <div className="sty-tag">Keep your stats, take a rank on the daily
                    boards, and star any game to pin it here.</div>
                </div>
                <span className="sty-go">Choose</span>
              </a>
            ) : null}
            {pinned.length ? (
              <div className={'sty-games' + (isOpen(MINE_ID) ? '' : ' shut')}>
                {playedLast(pinned, done).map((g) => (
                  <GameCard key={g.key} g={g} done={done} inprog={inprog} tq={tq}
                    canPin={canPin} favorites={favorites} toggleFavorite={toggleFavorite}
                    hue={hueFor(g.cat)} res={standBy[g.key]} />
                ))}
              </div>
            ) : null}
            {pinnedCircs.length ? (
              <div className={'sty-circs sty-minec' + (isOpen(MINE_ID) ? '' : ' shut')}>
                {pinnedCircs.map((c) => (
                  <a key={c.id} className={'sty-circ' + (c.n === c.games.length ? ' full' : '')}
                    href={withTq(circuitEntryHref(c.id))} style={{ '--cc': c.hue }}>
                    <div className="sty-chead">
                      <div className="sty-cn">{c.name}</div>
                      <div className="sty-cnum">{c.n}<i>/{c.games.length}</i></div>
                      <CircStar c={c} canPin={canPin} favorites={favorites} toggleFavorite={toggleFavorite} />
                    </div>
                    {circStand[c.id] ? (
                      <div className="sty-cres sty-rev">
                        <span className="sty-grl">You:</span>
                        <span className="sty-grk">#{circStand[c.id].rank}</span>
                        <span className="sty-grf">of {circStand[c.id].field}</span>
                      </div>
                    ) : (
                      <div className="sty-cb">{c.blurb}</div>
                    )}
                    <div className="sty-cbar"><span style={{ width: `${(c.n / c.games.length) * 100}%` }} /></div>
                  </a>
                ))}
              </div>
            ) : null}
          </section>
        ) : null}

        {/* THE ORDER IS THE READER'S. Arrows rather than dragging: they work
            with a thumb and with a keyboard, and the order they write is the
            same sot_cat_order the other home reads. It renders ONCE, here or
            under the categories (`ordBelow`, decided above). */}
        {!ordBelow ? ordBar : null}

        {circuits.length ? (
          /* THE SAME OBJECT AS EVERY OTHER SECTION (owner, 2026-08-31): the 4px
             left rule and the head with a count, so Circuits stops being the one
             block on the page wearing a bare eyebrow. Its rule is neutral for
             the reason My games' is: a circuit spans categories, so there is no
             single hue that would be honest here. */
          <section className="sty-cat sty-circsec sty-rev" style={{ '--cc': 'var(--stg-ink2)' }}>
            <div className="sty-cathead" onClick={headClick(CIRC_ID)}>
              <h2>Circuits</h2>
              <b>{circuits.filter((c) => c.n === c.games.length).length}<i>/{circuits.length}</i></b>
              {cav(CIRC_ID)}
            </div>
            <div className={'sty-circs' + (isOpen(CIRC_ID) ? '' : ' shut')} ref={circRef}>
              {(allCircs ? circuits : circLead).map((c) => (
                <a key={c.id} className={'sty-circ' + (c.n === c.games.length ? ' full' : '')}
                  href={withTq(circuitEntryHref(c.id))} style={{ '--cc': c.hue }}>
                  {/* The count sits IN the header row, not absolutely over the
                      card: floating it top-right meant a long name ran
                      underneath it, which "Trivia Gauntlet" did on every
                      width (owner, 2026-08-31). */}
                  <div className="sty-chead">
                    <div className="sty-cn">{c.name}</div>
                    <div className="sty-cnum">{c.n}<i>/{c.games.length}</i></div>
                    <CircStar c={c} canPin={canPin} favorites={favorites} toggleFavorite={toggleFavorite} />
                  </div>
                  {circStand[c.id] ? (
                    <div className="sty-cres sty-rev">
                      <span className="sty-grl">You:</span>
                      <span className="sty-grk">#{circStand[c.id].rank}</span>
                      <span className="sty-grf">of {circStand[c.id].field}</span>
                    </div>
                  ) : (
                    <div className="sty-cb">{c.blurb}</div>
                  )}
                  <div className="sty-cbar"><span style={{ width: `${(c.n / c.games.length) * 100}%` }} /></div>
                </a>
              ))}
            </div>
            {isOpen(CIRC_ID) && circuits.length > circLead.length ? (
              <button type="button" className="sty-more" onClick={() => setAllCircs((v) => !v)}>
                {allCircs ? 'Show fewer' : `Show all ${circuits.length} circuits`}
              </button>
            ) : null}
          </section>
        ) : null}

        {/* 4. THE GAMES, either as nine category rows or as one A-to-Z list. */}
        {az ? (
          <section className="sty-cat sty-az" style={{ '--cc': 'var(--stg-ink2)' }}>
            <div className="sty-cathead">
              <h2>All games</h2>
              <b>{alpha.filter((g) => done.has(g.key)).length}<i>/{alpha.length}</i></b>
            </div>
            <div className="sty-games">
              {playedLast(alpha, done).map((g) => (
                // A TO Z MIXES CATEGORIES exactly as My games does, so each card
                // carries its own hue: the list loses the rows that grouped the
                // games, and the colour is the only thing left saying what a
                // game IS (owner, 2026-08-31).
                <GameCard key={g.key} g={g} done={done} inprog={inprog} tq={tq}
                  canPin={canPin} favorites={favorites} toggleFavorite={toggleFavorite}
                  hue={hueFor(g.cat)} res={standBy[g.key]} />
              ))}
            </div>
          </section>
        ) : orderedCats.map(({ cat, games }, ci) => {
          const n = games.filter((g) => done.has(g.key)).length;
          const secId = `cat-${cat.replace(/\s+/g, '-')}`;
          return (
            <section key={cat} id={secId} className="sty-cat" style={{ '--cc': hueFor(cat) }}>
              <div className="sty-cathead" onClick={headClick(secId)}>
                <h2>{cat}</h2>
                <b>{n}<i>/{games.length}</i></b>
                {cav(secId)}
                {reorder ? (
                  <span className="sty-move">
                    <button type="button" onClick={() => moveCat(cat, -1)} disabled={ci === 0} aria-label={`Move ${cat} up`}>&uarr;</button>
                    <button type="button" onClick={() => moveCat(cat, 1)} disabled={ci === orderedCats.length - 1} aria-label={`Move ${cat} down`}>&darr;</button>
                  </span>
                ) : null}
              </div>
              <div className={'sty-games' + (isOpen(secId) ? '' : ' shut')}>
                {playedLast(games, done).map((g) => (
                  <GameCard key={g.key} g={g} done={done} inprog={inprog} tq={tq}
                    canPin={canPin} favorites={favorites} toggleFavorite={toggleFavorite}
                    res={standBy[g.key]} />
                ))}
              </div>
            </section>
          );
        })}

        {ordBelow ? ordBar : null}

        {/* THE DAY'S THREE RECORDS, and the grid decides which of them share a
            row (owner, 2026-09-01). Your standing and the board are the two
            tables, they answer the same question from opposite ends — how did I
            do, how did everyone do — and a reader looking at one wants the other
            beside it rather than a screen away. So they pair, and the feed,
            which is a list rather than a table, takes the full width underneath
            where its rows can tile instead of running single file down a half.

            Without a standing there is nothing to pair, so the layout falls back
            to what it was: board and feed side by side. One DOM order serves
            both, since the areas are only declared on .sty-trio.

            THE STANDING SCROLLS TO THE BOARD'S MEASURED HEIGHT. Sixteen rows
            beside eleven left the section ragged, and a row-count guess is wrong
            on a small field, which genuinely renders fewer than ten. */}
        <div className={'sty-pair' + (standing.length ? ' sty-trio' : '')}
          style={lbH ? { '--sty-lbh': lbH + 'px' } : undefined}>

        {/* ONE COLUMN FOR THE RUN, not three. The figures a player wants are the
            score, the game's own miss figure and the clock, and the miss figure
            is a DIFFERENT THING in every game: busts in Hands, digs in Sweep,
            unplaced tiles in Tuck, nothing at all in Suds. No shared column
            header is true of all of them, so the word travels in the CELL with
            its own number and the column is headed by neither.

            NO POINTS COLUMN (owner, 2026-09-01). The board beside it is the
            points table, and what this one is for is the RUN: what you scored,
            what it cost you and how long it took. The rank still carries how it
            placed, which is the only part of the ladder this table needs. */}
        {standing.length ? (
          <section id="sty-standing" className="sty-rev">
            <div className="sty-eb">
              Your standing
              <em>
                {' · '}{standing.length} played
                {myRow && myRow.rank ? ` · #${myRow.rank} overall` : ''}
              </em>
            </div>
            <div className="sty-sscroll">
              <table className="sty-tbl sty-stbl">
                <tbody>
                  {standing.map((r, i) => (
                    <tr key={r.key} className="sty-revr" style={{ '--cc': hueFor(r.g.cat), '--i': i }}>
                      <td className="sty-sg">
                        <a href={`${routeOf(r.g)}${tq ? '?' + tq.slice(1) : ''}`}>
                          <Glyph k={r.key} size={15} />{r.g.name}
                        </a>
                      </td>
                      <td className="sty-srun">{gameStats(r, r.g.miss) || '—'}</td>
                      <td className="sty-srk">#{r.rank}<i>{' of '}{r.field}</i></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        ) : null}

        {/* THE STANDINGS COME LAST (owner, 2026-08-31: the leaderboard does not
            need to be at the top of the page). The top of a home is for what you
            can play; where everyone finished is what you read once you have
            played it, so it sits under the games rather than above them. */}
        {top.length ? (
          <section id="sty-board" className="sty-rev" ref={lbRef}>
            <div className="sty-eb">Today&rsquo;s board <em>&middot; {boardCount}</em></div>
            <table className="sty-tbl">
              <tbody>
                {[...top, ...(myOut ? [myOut] : [])].map((r, i) => (
                  <tr key={(r && r.userKey) || i} style={{ '--i': i }}
                    className={'sty-revr' + (meKey && r.userKey === meKey ? ' me' : '')}>
                    <td className="sty-pos">{r.rank || i + 1}</td>
                    <td className="sty-who">{r.username || 'Player'}</td>
                    <td className="sty-gp">{typeof r.gamesPlayed === 'number' ? `${r.gamesPlayed}/${total}` : ''}</td>
                    <td className="sty-pts">{r.total != null ? Math.round(r.total) : ''}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>
        ) : null}

        {/* THE LIVE FEED, and it is game PLAYS — not the activity log at /feed,
            which tracks list and consensus changes. It sits at the foot because
            it is what you read when you are done, not what you arrive for.

            THE FIGURES ARE THE DAY'S, AND THE ROWS CARRY NO NAMES. That is the
            existing feed's rule and it is kept deliberately: promoting one
            person's run into a headline is a different product.

            THE PANEL BESIDE IT IS WIDE-ONLY, and it exists because the feed at
            full width is a wall of ten short rows with half a screen spare. It
            spends that room on the two figures the eyebrow could only state —
            the day's plays and the time played — drawn as the shape of the day
            by category, and on what the reader's own finished games add up to.
            Under 1100px it is not rendered at all and the feed is exactly what
            it was. */}
        <section id="sty-live">
          <div className="sty-eb">
            Live feed
            {totals ? (
              <em>
                {' · '}{(totals.today || 0).toLocaleString()} plays
                {totals.todayTime ? ` · ${hhmm(totals.todayTime)} played` : ''}
              </em>
            ) : null}
          </div>
          <div className="sty-lwide">
            {live.length ? (
              <div className="sty-live" style={{ '--lrows': Math.ceil(live.length / 2) }}>
                {live.map((fp, i) => (
                  <a key={`${fp.quizId}-${i}`} className="sty-lrow sty-revr" href={`${routeOf(fp.game)}${tq ? '?' + tq.slice(1) : ''}`}
                    style={{ '--cc': hueFor(fp.game.cat), '--i': i }}>
                    <Glyph k={fp.game.key} size={15} />
                    <span className="sty-lname">{fp.game.name}</span>
                    <span className="sty-lsc">{fp.score}<i>/{fp.total}</i></span>
                    <span className="sty-lwhen">{ago(fp.playedAt)}</span>
                  </a>
                ))}
              </div>
            ) : (
              <div className="sty-lnone">{feed ? 'No plays yet today.' : 'Loading the feed…'}</div>
            )}
            {standing.length ? (
              <div className="sty-lstats sty-rev">
                {catPlays.length ? (
                  <div className="sty-lviz">
                    <div className="sty-eb">The day by category</div>
                    {catPlays.map((cp) => (
                      <div className="sty-lbar" key={cp[0]} style={{ '--cc': hueFor(cp[0]) }}>
                        <span className="sty-lbn">{cp[0]}</span>
                        <span className="sty-lbt">
                          <i style={{ width: `${catPlayMax ? (cp[1] / catPlayMax) * 100 : 0}%` }} />
                        </span>
                        <span className="sty-lbv">{cp[1].toLocaleString()}</span>
                      </div>
                    ))}
                  </div>
                ) : null}
                {/* NOTHING ABOUT THE READER LIVES HERE (owner, 2026-09-01).
                    This section's own rule, three comments up, is that its
                    figures are the DAY'S and its rows carry no names — and the
                    first thing I did with the room was put the reader's share of
                    the day and four YOU figures in it, which is the same
                    mistake the rule was written against. Your standing is where
                    a reader's own day is reported; this is the site's. */}
                <div className="sty-lfigs">
                  {totals && totals.todayPlayers ? (
                    <div><b>{totals.todayPlayers.toLocaleString()}</b><i>players today</i></div>
                  ) : null}
                  {avgPlay ? <div><b>{hhmm(avgPlay)}</b><i>average play</i></div> : null}
                  {totals && totals.today ? (
                    <div><b>{totals.today.toLocaleString()}</b><i>plays today</i></div>
                  ) : null}
                </div>
              </div>
            ) : null}
          </div>
        </section>

        </div>

        {/* THE QUIZ CATALOGUE, UNDER THE DAY'S TWO RECORDS (owner, 2026-08-31).
            The dailies are what this home is for and they keep the top of it;
            the quizzes are the deep shelf behind them, eighteen hundred of
            them, and a shelf that size only works as a set of drawers. So each
            topic is a row that opens in place, shows fifteen, and offers the
            rest.

            IT SPENDS NO COLOUR. The stage's family is the nine category steps
            of the daily roster, and these fifteen topics are not those nine:
            painting them would put a sixteenth, seventeenth and eighteenth hue
            on a page whose whole rule is one family. So the section's rule is
            neutral, exactly as My games' and Circuits' are, and the topics are
            told apart by their names and their counts. */}
        {/* THE ANCHOR. A quiz end card sends the reader back here rather than
            to the separate quiz hub, so this section needs a name to land on;
            it is the only one of the page's sections that had none. */}
        <section id="sty-quizzes" className="sty-cat sty-qsec" style={{ '--cc': 'var(--stg-ink2)' }} ref={footRef}>
          <div className="sty-cathead">
            {/* THE HEADING IS THE DOOR (owner, 2026-09-04). This section is a
                set of drawers standing in for a surface that now exists, so the
                word Quizzes goes to it. Every other category head on this page
                is a label for what is under it and stays one; this one is the
                only head with somewhere else to be. */}
            <h2><a href={withTq('/quizzes')}>Quizzes</a></h2>
            {/* DRAWN ONLY WHEN REAL: no figure until the catalogue has landed,
                rather than a zero that is not true yet. */}
            {quizTotal ? (
              <b>{quizTotal.toLocaleString()}<i>/{topicList.length} topics</i></b>
            ) : null}
            {/* NOT THE A-Z INDEX ANY MORE. This pointed at /quizzes/all and
                said Full index, because the index WAS the only other quiz
                surface. /quizzes is the quiz home now, and it is what a reader
                who has opened three drawers wants; the A-Z is still one click
                on from it, and every topic row below still links into it
                directly. */}
            <a className="sty-all sty-qall" href={withTq('/quizzes')}>
              <span>All quizzes</span>
              <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor"
                strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M5 12h13M13 6l6 6-6 6" />
              </svg>
            </a>
          </div>
          <div className="sty-topics">
            {topicList.map((t) => {
              const open = openTopics.has(t.id);
              const all = fullTopics.has(t.id);
              const list = t.quizzes || [];
              const shown = all ? list : peekOf(list, QUIZ_PEEK);
              return (
                <div key={t.id} className={'sty-topic' + (open ? ' on' : '')}>
                  <button
                    type="button"
                    className="sty-trow"
                    aria-expanded={open}
                    aria-controls={`sty-t-${t.id}`}
                    onClick={() => toggleTopic(t.id)}
                  >
                    <span className="sty-tn">{t.label}</span>
                    {t.count ? <span className="sty-tc">{t.count}</span> : null}
                    <svg className="sty-tv" viewBox="0 0 24 24" width="13" height="13" fill="none"
                      stroke="currentColor" strokeWidth="2.4" strokeLinecap="round"
                      strokeLinejoin="round" aria-hidden="true">
                      <path d="M6 9l6 6 6-6" />
                    </svg>
                  </button>
                  {open ? (
                    <div className="sty-tbody" id={`sty-t-${t.id}`}>
                      {shown.length ? (
                        <>
                          <div className="sty-qgrid">
                            {shown.map((q) => (
                              <a key={q.id} className="sty-ql" href={`/quiz/${q.id}`}>{q.title}</a>
                            ))}
                          </div>
                          <div className="sty-tfoot">
                            {list.length > QUIZ_PEEK ? (
                              <button
                                type="button"
                                className="sty-more sty-tmore"
                                onClick={() => setFullTopics((prev) => {
                                  const next = new Set(prev);
                                  if (next.has(t.id)) next.delete(t.id); else next.add(t.id);
                                  return next;
                                })}
                              >
                                {all ? 'Show fewer' : `Show all ${t.count}`}
                              </button>
                            ) : null}
                            <a className="sty-more sty-tmore" href={`/quizzes/all#${t.id}`}>
                              {t.label} A to Z
                            </a>
                          </div>
                        </>
                      ) : (
                        <div className="sty-lnone">Loading the catalogue&hellip;</div>
                      )}
                    </div>
                  ) : null}
                </div>
              );
            })}
          </div>
        </section>
      </div>

      {/* The visitor count rides the observer this page already runs for its
          topics, so the footer asks for nothing of its own here. */}
      <StageFooter visitors={visitors} />
    </div>
  );
}

const CSS = `
.sty{min-height:100vh;background:var(--stg-ground);color:var(--stg-ink);
  font-family:${SANS};-webkit-font-smoothing:antialiased;}
.sty *{box-sizing:border-box;}

/* ── the cap: one line ─────────────────────────────────────────────────── */
.sty-cap{display:flex;align-items:center;gap:22px;padding:11px 22px;position:relative;
  border-bottom:1px solid var(--stg-line);}
.sty-id{display:flex;align-items:baseline;gap:11px;min-width:0;}
/* The mark and the words are ONE object, so they centre on each other; the date
   still hangs off the NAME's baseline, which is what .sty-id keeps its baseline
   alignment for.

   A FLEX BOX ONLY HAS A BASELINE IF ONE OF ITS ITEMS IS ALIGNED TO ONE (owner,
   2026-09-04). This box centred BOTH of its items, so it exposed none, and a
   flex item without a baseline is given one synthesised from its bottom margin
   edge: .sty-id was aligning the date to the bottom of the 20px MARK rather
   than to the baseline of the words, and the date sat a few pixels low and off
   the line. So the box is baseline-aligned and the mark alone opts out, which
   keeps the mark centred on the words exactly as before and hands .sty-id the
   name's real baseline to hang the date on. */
.sty-brand{display:flex;align-items:baseline;gap:8px;min-width:0;}
.sty-brand>svg{align-self:center;}
.sty-id b{font-size:16px;font-weight:800;letter-spacing:-0.01em;white-space:nowrap;}
.sty-id b em{font-style:normal;color:var(--stg-brand,#7dd3fc);}
.sty-date{font-family:${MONO};font-size:10.5px;letter-spacing:.11em;
  text-transform:uppercase;color:var(--stg-mute);white-space:nowrap;
  overflow:hidden;text-overflow:ellipsis;}
.sty-figs{display:flex;gap:20px;margin-left:auto;}
.sty-figs>div{text-align:right;}
/* A FIGURE CELL is positioned so its patch can cover it; while waiting it holds
   a figure's footprint so the cap does not reflow when the number lands. */
.sty-fc{position:relative;}
.sty-fc.wait{min-width:54px;min-height:30px;}
${PATCH_CSS}
.sty-figs b{display:block;font-size:15px;font-weight:800;font-variant-numeric:tabular-nums;line-height:1.1;}
.sty-figs b i{font-style:normal;font-weight:600;color:var(--stg-mute);font-size:12px;}
.sty-figs>div>i{font-style:normal;font-family:${MONO};font-size:9px;letter-spacing:.12em;
  text-transform:uppercase;color:var(--stg-mute);}
.sty-who b{font-weight:800;}
/* Not a figure and not a chip: a link at the end of the figures, in the
   accent, so it reads as the continuation of the row rather than a control
   competing with the three at the right edge. */
.sty-all{display:inline-flex;align-items:center;align-self:center;gap:6px;flex:none;
  text-decoration:none;color:var(--stg-acc-ink);font-family:${MONO};font-size:9.5px;
  letter-spacing:.12em;text-transform:uppercase;white-space:nowrap;}
.sty-all:hover{opacity:.78;}
.sty-all:focus-visible{outline:2px solid var(--stg-acc);outline-offset:3px;border-radius:4px;}
/* The only semantic colour on this page: a climb and a slip have to read
   apart at a glance, and they are not the category family. */
.sty-up{color:var(--stg-up);}
.sty-dn{color:var(--stg-dn);}
/* The movement chip is an <i> INSIDE the figure, and .sty-figs b i (0,2,1)
   outranks a bare .sty-up (0,1,0), so the arrow would render mute grey.
   NOTE: this block is a JS template literal, so no backticks in comments. */
.sty-figs b i.sty-up{color:var(--stg-up);}
.sty-figs b i.sty-dn{color:var(--stg-dn);}
.sty-tg{display:inline-flex;align-items:center;justify-content:center;padding:6px 9px;
  background:none;cursor:pointer;font:inherit;}
.sty-tg.hint{border-color:var(--stg-acc);color:var(--stg-acc-ink);animation:stg-hintring 1.9s ease-out 3;}
/* THE FIRST-VISIT POINTER at the light switch: a ring pulsing out of the glyph,
   three times, then gone for good. A ring rather than a colour change, so it
   draws the eye without the control ever looking like it is in a state it is
   not. */
@keyframes stg-hintring{
  0%{box-shadow:0 0 0 0 var(--stg-acc);}
  70%{box-shadow:0 0 0 10px transparent;}
  100%{box-shadow:0 0 0 0 transparent;}
}
@media (prefers-reduced-motion: reduce){ .hint{animation:none !important;} }
.sty-cx{flex:none;font-family:${MONO};font-size:10px;letter-spacing:.11em;text-transform:uppercase;
  color:var(--stg-ink2);text-decoration:none;border:1px solid var(--stg-line);
  border-radius:7px;padding:6px 10px;}
.sty-cx:hover{border-color:var(--stg-line2);color:var(--stg-ink);}
.sty-prog{height:2px;background:var(--stg-surf2);}
.sty-prog span{display:block;height:100%;background:var(--stg-ink2);transition:width .4s ease;}

/* FILLS THE SCREEN (owner, 2026-08-31). The 1100px column left a third of a
   desktop empty, and this page is a board of small tiles rather than a column
   of prose: the grids simply deal more per row as the window grows. The one
   thing that does NOT want the full width is the standings table, which is
   four columns of figures and reads worse the further apart they sit. */
.sty-wrap{max-width:none;margin:0 auto;padding:26px 22px 72px;
  display:flex;flex-direction:column;gap:26px;}
.sty-eb{font-family:${MONO};font-size:9.5px;letter-spacing:.15em;text-transform:uppercase;
  color:var(--stg-mute);margin-bottom:9px;}
.sty-ebn{color:var(--stg-ink);margin-left:6px;}

/* ── the day ───────────────────────────────────────────────────────────── */
/* THE LADDER IS THE WHOLE SECTION now: its legend went with the counters, and
   its 12px top margin went with it, so the graphic ends where it ends and the
   wrap's own 26px is the only gap below it. */

/* ── up next: the one filled control on the page ───────────────────────── */
/* ── the three cards ───────────────────────────────────────────────────── */
.sty-three{display:grid;gap:9px;grid-template-columns:1.4fr 1fr 1fr;align-items:stretch;}
/* The CTA is the LAST FLOW ITEM with margin-top:auto, not an absolutely
   positioned one over a reserved strip of padding. The padding version put the
   button on top of the tagline by a few pixels the moment a tagline ran long,
   and "a few pixels" is a thing that changes with every font and every string.
   In flow the card simply grows, and the row's cards match because the grid
   stretches them. */
.sty-card{display:flex;flex-direction:column;gap:2px;text-decoration:none;
  color:var(--stg-ink);background:var(--stg-surf);border:1px solid var(--stg-line);
  border-left:4px solid var(--cc);border-radius:11px;padding:14px 16px;min-width:0;}
.sty-card:hover{border-color:var(--stg-line2);border-left-color:var(--cc);}
.sty-card:focus-visible{outline:2px solid var(--stg-acc);outline-offset:2px;}
/* The LEAD card is the only filled thing on the page, as Up Next was: one
   control carries the accent, everything else marks with it. */
.sty-card.lead{background:var(--cc);border-color:transparent;color:var(--stg-onramp,#08222e);}
.sty-card.lead .sty-eb,.sty-card.lead .sty-tag{color:inherit;opacity:.78;}
.sty-card.lead .sty-gi{color:currentColor;}
.sty-card .sty-nm{font-size:20px;font-weight:800;letter-spacing:-0.015em;line-height:1.15;}
.sty-card.lead .sty-nm{font-size:24px;}
.sty-card .sty-tag{font-size:12px;font-weight:600;color:var(--stg-mute);margin-top:1px;
  overflow:hidden;text-overflow:ellipsis;white-space:nowrap;}
.sty-card .sty-go{align-self:flex-start;margin-top:12px;}
.sty-card .sty-go.ghost{background:none;color:var(--cc);border:1px solid var(--cc);}
.sty-allin{justify-content:center;}

/* ── a star on every card ──────────────────────────────────────────────── */
.sty-g{position:relative;}
.sty-star{position:absolute;top:6px;right:6px;display:flex;align-items:center;justify-content:center;
  width:24px;height:24px;border:0;border-radius:6px;background:none;cursor:pointer;
  color:var(--stg-mute2);opacity:0;transition:opacity .12s;}
.sty-g:hover .sty-star,.sty-star:focus-visible,.sty-star.on{opacity:1;}
.sty-star.on{color:var(--cc);}
.sty-star:hover{background:var(--stg-chip);color:var(--cc);}
/* A touch screen has no hover, so the star is always there. */
@media (hover:none){ .sty-star{opacity:1;} }
.sty-mine .sty-cathead h2{letter-spacing:-0.01em;}

/* ── reordering ────────────────────────────────────────────────────────── */
.sty-signup{display:flex;flex-direction:column;text-decoration:none;color:var(--stg-onramp,#08222e);
  background:var(--stg-acc);border-radius:8px;padding:5px 12px;}
.sty-signup b{font-size:13px;font-weight:800;line-height:1.2;}
.sty-signup i{font-style:normal;font-size:11px;font-weight:700;line-height:1.2;opacity:.85;}
/* ── the live feed ─────────────────────────────────────────────────────── */
.sty-live{display:grid;gap:5px;grid-template-columns:repeat(auto-fill,minmax(260px,1fr));}
.sty-lrow{display:flex;align-items:center;gap:9px;text-decoration:none;color:var(--stg-ink);
  background:var(--stg-surf);border:1px solid var(--stg-line);border-left:3px solid var(--cc);
  border-radius:8px;padding:8px 11px;min-width:0;}
.sty-lrow:hover{border-color:var(--stg-line2);border-left-color:var(--cc);}
.sty-lrow .sty-gi{color:var(--cc);}
.sty-lname{font-size:13px;font-weight:800;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;}
.sty-lsc{margin-left:auto;flex:none;font-family:${MONO};font-size:12px;font-weight:700;
  font-variant-numeric:tabular-nums;}
.sty-lsc i{font-style:normal;color:var(--stg-mute);}
.sty-lwhen{flex:none;font-family:${MONO};font-size:9.5px;letter-spacing:.08em;
  text-transform:uppercase;color:var(--stg-mute2);width:62px;text-align:right;}
.sty-lnone{color:var(--stg-mute);font-size:13px;font-weight:600;}

/* ── the standings and the feed, paired ───────────────────────────────── */
.sty-pair{display:grid;gap:22px;align-items:start;}
@media (min-width:900px){
  .sty-pair{grid-template-columns:minmax(0,1fr) minmax(0,1fr);}
  /* Paired, the feed is a column rather than a shelf, so its rows go single
     file instead of trying to tile inside half the width. */
  .sty-pair .sty-live{grid-template-columns:minmax(0,1fr);}
}

.sty-ord{display:flex;gap:7px;}
.sty-ordb{width:auto;margin-top:0;padding:7px 13px;}
/* The active view reads as chosen rather than merely available. */
.sty-ordb.on{border-color:var(--stg-acc);color:var(--stg-acc-ink);}
.sty-move{display:inline-flex;gap:4px;margin-left:10px;}
.sty-move button{width:24px;height:24px;border:1px solid var(--stg-line);border-radius:6px;
  background:none;color:var(--stg-ink2);cursor:pointer;font-size:12px;line-height:1;}
.sty-move button:hover:not(:disabled){border-color:var(--cc);color:var(--cc);}
.sty-move button:disabled{opacity:.3;cursor:default;}

.sty-next{display:flex;align-items:center;gap:18px;text-decoration:none;
  background:var(--cc);color:var(--stg-onramp, ${RAMP_INK});
  border-radius:12px;padding:18px 20px;}
.sty-next .sty-eb{color:inherit;opacity:.72;margin-bottom:5px;}
.sty-nm{font-size:26px;font-weight:800;letter-spacing:-0.02em;line-height:1.1;}
.sty-tag{font-size:13.5px;font-weight:600;opacity:.8;margin-top:3px;}
.sty-go{margin-left:auto;flex:none;font-size:14px;font-weight:800;
  border:1.5px solid currentColor;border-radius:9px;padding:9px 18px;}
/* THE INVERSION HAS TO NAME ITS OWN INK. Do NOT write background:currentColor
   beside a color: in one rule: currentColor is the COMPUTED color, which that
   same rule has already changed, so chip and card come out the same colour and
   the control vanishes under the pointer. */
.sty-next:hover .sty-go{background:var(--stg-onramp);color:var(--cc);border-color:var(--stg-onramp);}
.sty-allin{cursor:default;}

/* ── today's board ─────────────────────────────────────────────────────── */
.sty-tbl{width:100%;max-width:900px;border-collapse:collapse;font-variant-numeric:tabular-nums;}
.sty-tbl td{padding:7px 6px;border-bottom:1px solid var(--stg-line);font-size:13.5px;}
.sty-tbl tr:last-child td{border-bottom:0;}
.sty-tbl tr.me td{background:var(--stg-chip);font-weight:800;}
/* The mute token is tuned against the PAGE ground; on the me row's chip it
   lands at 4.34:1, so the supporting figures step up one token there. */
.sty-tbl tr.me .sty-pos,.sty-tbl tr.me .sty-gp{color:var(--stg-ink2);}
.sty-pos{width:40px;font-family:${MONO};font-size:12px;color:var(--stg-mute);}
.sty-who{font-weight:700;}
.sty-gp{width:70px;text-align:right;color:var(--stg-mute);font-size:12px;}
.sty-pts{width:56px;text-align:right;font-weight:800;}

/* ── your standing ─────────────────────────────────────────────────────── */
.sty-stbl{max-width:none;}
.sty-sg a{display:inline-flex;align-items:center;gap:8px;text-decoration:none;
  color:var(--stg-ink);font-weight:700;}
.sty-sg a:hover{color:var(--cc);}
/* The run in the game's own units. Muted because the NAME and the RANK are what
   the eye is scanning down; this is the detail it stops on. */
.sty-srun{color:var(--stg-mute);font-size:12.5px;}
.sty-srk{width:110px;text-align:right;font-family:${MONO};font-size:12px;
  color:var(--stg-ink2);white-space:nowrap;}
.sty-srk i{font-style:normal;color:var(--stg-mute);}
@media (max-width:560px){
  /* The field size is the first thing to go: which of 94 you came is a figure
     the rank already implies, and the row has to fit 390px. */
  .sty-srk{width:auto;}
  .sty-srk i{display:none;}
  .sty-srun{font-size:11.5px;}
}

/* PAIRED WITH THE BOARD, AND SCROLLED TO ITS HEIGHT. The trio only declares its
   areas above 900px; below it the three sections stack in DOM order, standing
   first, and the standing is its natural length with no scroller, because a
   scrolling panel inside a scrolling page is the worst thing a phone can be
   handed. */
.sty-sscroll{min-width:0;}
@media (min-width:900px){
  .sty-trio{grid-template-areas:'st bd' 'lv lv';}
  .sty-trio #sty-standing{grid-area:st;min-width:0;}
  .sty-trio #sty-board{grid-area:bd;min-width:0;}
  .sty-trio #sty-live{grid-area:lv;min-width:0;}
  /* --sty-lbh is the BOARD's measured height, heading included; the scroller
     sits under a heading of its own, so it takes that height less one. The
     fallback is a sane eleven rows for the frame before the measure lands. */
  .sty-trio .sty-sscroll{max-height:calc(var(--sty-lbh, 372px) - 24px);overflow-y:auto;
    overscroll-behavior:contain;}
  .sty-trio .sty-sscroll::-webkit-scrollbar{width:9px;}
  .sty-trio .sty-sscroll::-webkit-scrollbar-thumb{background:var(--stg-line2);border-radius:9px;}
  .sty-trio .sty-sscroll::-webkit-scrollbar-track{background:transparent;}
  /* THE 900px CAP IS FOR A TABLE ALONE ON A PAGE. Paired, each table already
     has half the width and the cap left a ragged strip of ground down the right
     of the board while its own name and figure columns sat too far apart
     (owner, 2026-09-01). In the trio the column IS the measure. */
  .sty-trio .sty-tbl{max-width:none;}
  /* TWO COLUMNS, READ DOWN (owner, 2026-09-01). auto-fill gave four across at
     this width and a feed read four-abreast is four separate short lists; a
     reader follows one column down. grid-auto-flow:column with an explicit row
     count is what fills top-to-bottom before moving right, and --lrows is set
     from the render so the two columns stay even at any feed length. */
  .sty-trio .sty-live{grid-template-columns:repeat(2,minmax(0,1fr));
    grid-template-rows:repeat(var(--lrows,5),auto);grid-auto-flow:column;}
}

/* ── the day, drawn, beside the feed ───────────────────────────────────── */
/* WIDE ONLY. Under 1100px this is not rendered and the feed is exactly what it
   was: a phone has no room to spend and nothing here is worth a scroll. */
.sty-lwide{display:grid;gap:22px;min-width:0;}
.sty-lstats{display:none;}
@media (min-width:1100px){
  /* The feed is two columns now and the chart is the thing worth looking at, so
     the split moved toward the chart rather than away from it. */
  .sty-trio .sty-lwide{grid-template-columns:minmax(0,1fr) minmax(0,1.1fr);align-items:start;}
  .sty-trio .sty-lstats{display:grid;gap:18px;align-content:start;}
}
.sty-lviz{display:grid;gap:8px;}
.sty-lviz .sty-eb{margin-bottom:3px;}
/* WIDER BLOCKS (owner, 2026-09-01). The bars were 7px hairlines with a 74px
   label that ellipsed "Crowd Psychology" to "Crowd Psycho…", which is a chart
   drawn apologetically. With the reader's own figures out of this panel there is
   room to draw it properly: the label reads in full and the bar is a block. */
.sty-lbar{display:grid;grid-template-columns:118px minmax(0,1fr) auto;align-items:center;gap:11px;}
.sty-lbn{font-family:${MONO};font-size:9px;letter-spacing:.09em;text-transform:uppercase;
  color:var(--stg-mute);overflow:hidden;text-overflow:ellipsis;white-space:nowrap;}
/* The track is a component boundary rather than text, so it owes 3:1 and takes
   the raised surface; the fill is the category's own step. */
.sty-lbt{display:block;height:14px;border-radius:5px;background:var(--stg-surf2);overflow:hidden;}
.sty-lbt i{display:block;height:100%;background:var(--cc);border-radius:5px;
  transition:width .35s ease;}
.sty-lbv{font-family:${MONO};font-size:12px;font-weight:700;color:var(--stg-ink2);
  white-space:nowrap;font-variant-numeric:tabular-nums;min-width:34px;text-align:right;}
.sty-lbv i{font-style:normal;font-weight:600;color:var(--stg-mute);}
.sty-lfigs{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:12px;
  border-top:1px solid var(--stg-line);padding-top:14px;}
.sty-lfigs b{display:block;font-size:19px;font-weight:800;line-height:1.1;
  font-variant-numeric:tabular-nums;}
.sty-lfigs i{font-style:normal;font-family:${MONO};font-size:8.5px;letter-spacing:.12em;
  text-transform:uppercase;color:var(--stg-mute);}

/* ── a played card reports its result ──────────────────────────────────── */
.sty-gres{display:flex;align-items:baseline;gap:7px;margin-top:2px;font-size:11.5px;
  overflow:hidden;text-overflow:ellipsis;white-space:nowrap;}
.sty-grk{font-weight:800;color:var(--stg-ink);}
/* "You:" NAMES THE FIGURE (owner, 2026-09-01). A bare #3 of 10 on a card in a
   grid of cards reads as something about the game; the two characters in front
   of it say whose result it is, and the score came off in the same pass because
   the rank already answers the question the card is being asked. */
.sty-grl{font-family:${MONO};font-size:9px;letter-spacing:.1em;text-transform:uppercase;
  color:var(--stg-mute);}
.sty-grf{font-weight:600;color:var(--stg-mute);}
/* The same line on a circuit card, which is a block rather than a flex child. */
.sty-cres{display:flex;align-items:baseline;gap:7px;margin-top:5px;font-size:11.5px;
  overflow:hidden;text-overflow:ellipsis;white-space:nowrap;}
/* PLAYED IS DIM, BUT A RESULT IS NOT. .done wears opacity:.42, and opacity on a
   parent cannot be undone by a child, so a rank printed inside one lands around
   2:1 whatever colour it is given. A card that has something to say therefore
   states "played" in COLOUR instead: the name steps down to the muted token
   (which clears 4.5:1 on both registers) and the figures keep their own. */
.sty-g.done.res{opacity:1;background:none;}
.sty-g.done.res .sty-gn{color:var(--stg-mute);}
.sty-g.done.res .sty-gi{opacity:.75;}

/* ── circuits ──────────────────────────────────────────────────────────── */
.sty-circs{display:grid;gap:7px;grid-template-columns:repeat(auto-fill,minmax(230px,1fr));}
/* Circuits is a .sty-cat now, so its head carries the title and the grid sits
   under it exactly as a category's games do. */
.sty-circsec .sty-circs{margin-top:0;}
.sty-more{display:block;width:100%;margin-top:7px;background:var(--stg-surf);
  border:1px solid var(--stg-line);border-radius:9px;padding:9px;cursor:pointer;
  font-family:${MONO};font-size:9.5px;letter-spacing:.14em;text-transform:uppercase;
  color:var(--stg-ink2);}
.sty-more:hover{border-color:var(--stg-line2);color:var(--stg-ink);}
.sty-more:focus-visible{outline:2px solid var(--stg-acc);outline-offset:2px;}
.sty-circ{position:relative;display:block;text-decoration:none;color:var(--stg-ink);
  background:var(--stg-surf);border:1px solid var(--stg-line);border-radius:10px;
  padding:12px 14px 13px 16px;overflow:hidden;}
.sty-circ::before{content:'';position:absolute;left:0;top:0;bottom:0;width:4px;background:var(--cc);}
.sty-circ:hover{border-color:var(--cc);}
.sty-chead{display:flex;align-items:baseline;gap:10px;}
.sty-cn{font-size:15px;font-weight:800;letter-spacing:-0.01em;min-width:0;}
.sty-cnum{margin-left:auto;flex:none;}
/* THREE lines, not two. Every circuit blurb is a full sentence and the two
   line clamp cut the longest of them off mid-clause; the cards share a grid
   row, so letting them run to three costs one line across the shelf and clips
   nothing. */
.sty-cb{font-size:11.5px;font-weight:600;color:var(--stg-mute);margin-top:3px;line-height:1.4;
  display:-webkit-box;-webkit-line-clamp:3;-webkit-box-orient:vertical;overflow:hidden;}
.sty-cbar{height:4px;border-radius:2px;background:var(--stg-surf2);margin-top:10px;overflow:hidden;}
.sty-cbar span{display:block;height:100%;background:var(--cc);}
.sty-cnum{font-family:${MONO};font-size:11.5px;font-weight:700;color:var(--stg-ink2);}
.sty-cnum i{font-style:normal;color:var(--stg-mute);}
/* A finished circuit is MARKED, not dimmed. The ladder dims a played rung
   because a rung is a graphic; a card carries prose, and half-strength prose on
   this ground reads at 2.4:1. So completion moves into the figure — the count
   takes the category hue and the bar fills — and the words stay legible. */
.sty-circ.full .sty-cnum{color:var(--cc);}
.sty-circ.full .sty-cnum i{color:var(--cc);opacity:.6;}
/* ON A PALE GROUND A CATEGORY HUE IS A RULE, NOT INK. The nine hues are picked
   to carry a 4px bar and a border, which owe 3:1; as TEXT on the white card
   they owe 4.5 and the warm ones are nowhere near it (Trivia's orange is
   2.26:1 on white, measured live on the light home). So the light register
   darkens the hue rather than dropping it, which keeps the category readable
   AS that category. The denominator takes the ordinary muted ink instead of
   the same hue at .6: opacity composites toward the ground, so on a pale one
   it makes the quiet half quieter AND lighter, which is the wrong direction
   twice. Hierarchy comes from size and weight here, as everywhere else. */
[data-stage-theme=light] .sty-circ.full .sty-cnum{color:color-mix(in srgb, var(--cc) 55%, #0b0d12);}
[data-stage-theme=light] .sty-circ.full .sty-cnum i{color:var(--stg-mute);opacity:1;}
.sty-circ.full{border-color:color-mix(in srgb, var(--cc) 40%, transparent);}

/* ── the categories ────────────────────────────────────────────────────── */
.sty-cat{position:relative;padding-left:16px;}
.sty-cat::before{content:'';position:absolute;left:0;top:2px;bottom:2px;width:4px;
  border-radius:2px;background:var(--cc);}
/* A LABEL, NOT A PEER. .sty-wrap is a flex column with a 26px gap (22 on a
   phone), so this heading was spending a whole section gap plus its own margin,
   40px of air under one line of type. The negative bottom margin hands most of
   that back: 14px here and 10px on a phone, the same distance a category head
   already sits above its own grid. */
.sty-slate{margin:4px 0 -12px;font-size:19px;font-weight:800;letter-spacing:-.015em;line-height:1.15;color:var(--stg-ink);}
.sty-cathead{display:flex;align-items:baseline;gap:11px;margin-bottom:10px;}
/* Unfinished business: one row per open set, the set's own hue on its rule,
   its pips and its control; the section rule is gold (see the JSX note). */
.sty-unfl{display:flex;flex-direction:column;gap:8px;}
.sty-unfr{display:flex;align-items:center;gap:12px;text-decoration:none;color:var(--stg-ink);
  background:var(--stg-surf);border:1px solid var(--stg-line);border-radius:10px;padding:10px 12px;}
.sty-unfr:hover{border-color:var(--stg-line2);}
.sty-unfc{flex:none;width:3px;height:30px;border-radius:2px;background:var(--sc);}
.sty-unfb{min-width:0;display:flex;flex-direction:column;gap:2px;}
.sty-unfn{font-size:15px;font-weight:800;}
.sty-unfs{font-size:12px;color:var(--stg-mute);}
.sty-unfp{display:flex;gap:2px;margin-top:2px;}
.sty-unfp s{text-decoration:none;display:block;width:6px;height:10px;border-radius:1.5px;background:var(--sc);opacity:.3;}
.sty-unfp s.on{opacity:1;}
.sty-unfgo{margin-left:auto;flex:none;font-size:12.5px;font-weight:800;padding:7px 12px;border-radius:8px;
  background:var(--sc);color:var(--son);white-space:nowrap;}
.sty-unfmore{margin-top:8px;font-family:${MONO};font-size:9.5px;letter-spacing:.12em;text-transform:uppercase;color:var(--stg-mute);}
.sty-cathead h2{margin:0;font-size:13px;font-weight:800;letter-spacing:.05em;text-transform:uppercase;}
.sty-cathead b{font-family:${MONO};font-size:12px;font-weight:700;font-variant-numeric:tabular-nums;color:var(--stg-ink2);}
.sty-cathead b i{font-style:normal;color:var(--stg-mute);}
.sty-games{display:grid;gap:7px;grid-template-columns:repeat(auto-fill,minmax(184px,1fr));}
/* A grid track's automatic minimum is MIN-CONTENT, and .sty-gt is nowrap, so a
   long tagline widens its own track and pushes the ladder off a phone instead
   of ellipsing inside it. Measured: the ladder ran 426px wide at 390. The floor
   has to be released on the track AND on the item. */
.sty-g,.sty-circ{min-width:0;}
.sty-g>*{min-width:0;max-width:100%;}
.sty-g{display:block;text-decoration:none;background:var(--stg-surf);
  border:1px solid var(--stg-line);border-radius:9px;padding:10px 12px;color:var(--stg-ink);}
.sty-g:hover{border-color:var(--cc);}
.sty-gn{display:flex;align-items:center;gap:7px;font-size:14.5px;font-weight:800;
  letter-spacing:-0.01em;}
/* The glyph wears the row's hue while the name stays ink, so the colour marks
   the category without costing the name any contrast. BUT the Up Next card is
   FILLED with that same hue, so a glyph painted --cc there is invisible: on any
   surface whose ground is the accent, the glyph takes the card's own ink. */
.sty-gi{flex:none;color:var(--cc);}
.sty-next .sty-gi{color:currentColor;opacity:.85;}
.sty-nm{display:flex;align-items:center;gap:11px;}
.sty-gt{display:block;font-size:11.5px;font-weight:600;color:var(--stg-mute);margin-top:2px;
  overflow:hidden;text-overflow:ellipsis;white-space:nowrap;}
/* Played is DIM, not struck through: the day is a record, not a chore list. */
.sty-g.done{opacity:.42;}
.sty-g.open{border-color:var(--cc);}
.sty-g:focus-visible,.sty-next:focus-visible,.sty-cx:focus-visible{
  outline:2px solid var(--cc, var(--stg-ink2));outline-offset:2px;}

@media (max-width:560px){
  .sty-gp{display:none;}
  .sty-circs{grid-template-columns:minmax(0,1fr);}
}
@media (max-width:640px){
  /* The name never wraps, and the DATE does not run on a phone at all: it was
     costing a whole line of the cap to say what day it is, which is the one
     thing a reader opening a daily already knows. The room goes to the mark. */
  /* TWO DELIBERATE ROWS, not three accidental ones (owner, 2026-08-31:
     "quizzes wraps to its own line on mobile"). Left to flex-wrap the cap put
     the name on line 1, five figures on line 2, and stranded the toggle and the
     Quizzes link alone on line 3. Row 1 is the identity and the two controls,
     row 2 is the figures, and nothing is left over. */
  /* TWO BARS OF THE SAME HEIGHT (owner, 2026-08-31). Bar one is what this page
     is and how to move around it: the name, the date, and the three controls.
     Bar two is who you are and how the day is going — or, for a reader with no
     account, the one thing worth offering them. */
  /* FIVE COLUMNS, because there are four controls now (owner, 2026-09-01).
     Your standing was added without an area of its own, so auto-placement put
     it in the figures row with the IQ and the ranks, where a bordered icon
     among four text figures reads as a fifth figure that lost its label. It
     belongs with the other three ways out of the page. */
  .sty-cap{display:grid;grid-template-columns:minmax(0,1fr) auto auto auto auto;
    grid-template-areas:'id st lb lf tg' 'fg fg fg fg fg';
    align-items:center;gap:0 8px;padding:0 14px;}
  .sty-id{grid-area:id;flex:none;min-width:0;padding:9px 0;}
  .sty-brand{gap:7px;}
  .sty-brand svg{width:17px;height:17px;}
  .sty-all{font-size:9px;gap:5px;}
  .sty-tg{grid-area:tg;}
  .sty-st{grid-area:st;}
  .sty-lb{grid-area:lb;}
  .sty-lf{grid-area:lf;}
  .sty-date{display:none;}
  .sty-figs{grid-area:fg;margin-left:0;gap:0;justify-content:space-between;
    border-top:1px solid var(--stg-line);padding:9px 0;min-height:44px;align-items:center;}
  .sty-figs>div{min-width:0;}
  /* THE GUEST CONTROL FILLS THE ROW on a phone (owner, 2026-09-02): the two
     lines become one, "Choose a Name - Keep Your Stats", edge to edge, since
     it is the only thing in the figures row for a guest. */
  .sty-signup{flex:1 1 100%;flex-direction:row;justify-content:center;align-items:baseline;gap:6px;
    padding:10px 12px;min-height:40px;}
  .sty-signup b{font-size:14px;}
  .sty-signup i{font-size:13px;}
  .sty-signup i::before{content:'- ';}
  .sty-three{grid-template-columns:1fr;}
  .sty-ord{flex-wrap:wrap;}
  .sty-wrap{padding:18px 14px 56px;gap:22px;}
  .sty-nm{font-size:21px;}
  .sty-next{padding:15px 16px;gap:12px;}
  .sty-go{padding:8px 13px;font-size:13px;}
  .sty-games{grid-template-columns:minmax(0,1fr) minmax(0,1fr);}
}
@media (max-width:380px){
  .sty-figs{gap:12px;}
}

/* -- the newcomer row ---------------------------------------------------- */
/* The circuits and the tiles are one stack, so the shelf below keeps the wrap
   gap it has rather than the row spending two of them. */
.sty-one{display:flex;flex-direction:column;gap:9px;}
/* TWO CIRCUITS SHARE A LINE, and the line breaks itself: auto-fit against a
   300px floor gives two across on a desktop and one on a phone with no media
   query to keep in step with the others. */
.sty-two{display:grid;gap:9px;grid-template-columns:repeat(auto-fit,minmax(300px,1fr));}
/* Half the width takes the name down a step. The bar was written as the one
   full-width control on the page. */
.sty-two .sty-nm{font-size:21px;}
.sty-newl{min-width:0;}
/* NO OPACITY ON A FILLED CARD. Its two quiet lines inherit the fill ink and then
   dim it, which on this ground composites TOWARD the fill: measured on the
   Trivia step the eyebrow lands at 3.85:1 and the blurb at 4.47, both under the
   4.5 they owe at their sizes. Hierarchy comes from size and weight, which is
   the same ruling the category bands carry. */
.sty-new .sty-next .sty-eb,.sty-new .sty-next .sty-tag{opacity:1;}
/* The same 184px track the category shelves deal on, so the tiles line up with
   the rows underneath instead of forming a second grid. */
.sty-pop{display:grid;gap:7px;grid-template-columns:repeat(auto-fill,minmax(184px,1fr));}
/* THE TILES ARE INVERTED (owner, 2026-09-04): the category step is the FILL
   rather than a hairline and a glyph, and everything on the tile takes that
   ink that step carries. Elsewhere on this page a hue is an edge; here it is
   the subject, because the row exists to say what the ten categories ARE. */
.sty-new .sty-pop .sty-g{background:var(--cc);border-color:transparent;color:var(--stg-onramp);}
.sty-new .sty-pop .sty-gi,.sty-new .sty-pop .sty-pcat,.sty-new .sty-pop .sty-gt{color:currentColor;}
/* A border cannot mark a hover on a card whose border is its own fill, so the
   ring goes inside and is drawn in the ink the tile already carries. */
.sty-new .sty-pop .sty-g:hover{border-color:transparent;box-shadow:inset 0 0 0 2px currentColor;}
/* And the focus ring cannot be --cc here either: that is the fill it would be
   drawn on top of. */
.sty-new .sty-pop .sty-g:focus-visible,.sty-new .sty-two .sty-next:focus-visible{
  outline:2px solid currentColor;outline-offset:2px;}

/* -- and the SAME row, outlined, on the light register (owner, 2026-09-04) --
   TEN FILLED CARDS ARE A DIFFERENT OBJECT ON A PALE GROUND. On the dark
   register a filled step is the brightest thing in view and the row reads as
   ten colours; on the pale one the page is already bright, so the same ten
   fills stop being an accent and become the surface, and the row shouts over
   everything under it. The colour still has to say which category each card
   speaks for, so it moves from the fill to a 2px ring, and the card goes back
   to the ground and the ink every other card on this page uses. The dark rules
   above are untouched: only the register changes.

   THE LINE IS --ccl, NOT --cc. A step drawn to be FILLED is not a colour you
   can draw a hairline in: End Game, Trivia and Arcade keep their light value
   on this register and flip their ink instead of darkening, so as an edge on
   paper they measure 1.5 to 2:1 and those three cards would read as having no
   border at all beside the other seven. --ccl is the ramp value that already
   solves this -- CATEGORY_RAMP_INK_LIGHT, the step deepened until it is
   legible as TEXT, held to 4.5:1 on a white card by the ramp verifier -- so
   all ten edges come out at one strength, and the category name and the glyph
   can carry the colour too instead of going grey. */
[data-stage-theme=light] .sty-new .sty-pop .sty-g{
  background:var(--stg-surf);color:var(--stg-ink);
  border-color:var(--ccl);box-shadow:inset 0 0 0 1px var(--ccl);}
[data-stage-theme=light] .sty-new .sty-pop .sty-gi,
[data-stage-theme=light] .sty-new .sty-pop .sty-pcat{color:var(--ccl);}
[data-stage-theme=light] .sty-new .sty-pop .sty-gt{color:var(--stg-mute);}
/* The hover ring thickens the edge the tile already has rather than being a
   second, different mark. */
[data-stage-theme=light] .sty-new .sty-pop .sty-g:hover{
  border-color:var(--ccl);box-shadow:inset 0 0 0 2px var(--ccl);}
[data-stage-theme=light] .sty-new .sty-pop .sty-g:focus-visible,
[data-stage-theme=light] .sty-new .sty-two .sty-next:focus-visible{
  outline:2px solid var(--ccl);}
/* The two circuit cards are the same object one size up, so they take the same
   treatment: nothing on this row should be filled while its neighbour is not. */
[data-stage-theme=light] .sty-new .sty-two .sty-next{
  background:var(--stg-surf);color:var(--stg-ink);
  box-shadow:inset 0 0 0 2px var(--ccl);}
[data-stage-theme=light] .sty-new .sty-two .sty-next .sty-eb{color:var(--ccl);}
[data-stage-theme=light] .sty-new .sty-two .sty-next .sty-tag{color:var(--stg-mute);}
[data-stage-theme=light] .sty-new .sty-two .sty-next .sty-gi{color:var(--ccl);opacity:1;}
/* THE ONE FILLED MOMENT LEFT is the chip under the pointer. It fills with the
   same deepened value the rest of the card is drawn in, so the card ground is
   the ink: white on all ten by the same 4.5:1 the ramp verifier holds them to,
   which is the one inversion that needs no per-step ink at all. */
[data-stage-theme=light] .sty-new .sty-two .sty-next .sty-go{
  border-color:var(--ccl);color:var(--ccl);}
[data-stage-theme=light] .sty-new .sty-two .sty-next:hover .sty-go{
  background:var(--ccl);color:var(--stg-surf);border-color:var(--ccl);}
/* MY GAMES, TO A READER WHO HAS NONE. The same offer the cap makes, at the size
   of the cards above it, and on the same tokens the cap button already proved in
   both registers: the accent as the fill and the ink published for it. */
.sty-join{display:flex;align-items:center;gap:18px;text-decoration:none;
  background:var(--stg-acc);color:var(--stg-onramp);border-radius:12px;padding:18px 20px;}
.sty-join .sty-eb{color:inherit;margin-bottom:5px;}
.sty-join .sty-jn{font-size:24px;font-weight:800;letter-spacing:-.02em;line-height:1.1;}
.sty-join .sty-tag{font-size:13.5px;font-weight:600;margin-top:4px;}
.sty-join:hover .sty-go{background:var(--stg-onramp);color:var(--stg-acc);border-color:var(--stg-onramp);}
.sty-join:focus-visible{outline:2px solid currentColor;outline-offset:2px;}
/* ONE LINE IS ALL THE ROW ADDS TO A TILE: which category it speaks for. */
.sty-pcat{display:block;font-family:${MONO};font-size:8.5px;font-weight:700;
  letter-spacing:.14em;text-transform:uppercase;margin-bottom:4px;
  overflow:hidden;text-overflow:ellipsis;white-space:nowrap;}
@media (max-width:560px){
  .sty-pop{grid-template-columns:minmax(0,1fr) minmax(0,1fr);}
  /* A name, a blurb and a button do not share a 390px line, so a circuit card
     stacks and the control keeps the left edge the copy above it has. */
  .sty-next,.sty-join{flex-direction:column;align-items:flex-start;}
  .sty-two .sty-nm{font-size:19px;}
  .sty-join .sty-jn{font-size:21px;}
  .sty-next .sty-go,.sty-join .sty-go{margin-left:0;}
}

/* NOTE: this block is a JS template literal, so no backticks in comments. */

/* -- quizzes, by topic --------------------------------------------------- */
/* A ROW OF DRAWERS, not a grid of cards. Every other block on this page deals
   tiles because its items are eighty games a reader picks between; this one is
   fifteen topics over eighteen hundred quizzes, and the thing being chosen is
   which drawer to open. Rows also mean the count sits in a column and reads
   down the list, which is the figure a reader is scanning for. */
.sty-qall{margin-left:auto;}
/* THE ONLY HEADING ON THIS PAGE THAT IS A LINK, so it takes the heads own ink
   and says so only under the pointer: a permanently underlined head would read
   as a different kind of object from the nine above it. */
.sty-qsec h2 a{color:inherit;text-decoration:none;}
.sty-qsec h2 a:hover{text-decoration:underline;text-underline-offset:3px;}
.sty-qsec h2 a:focus-visible{outline:2px solid var(--stg-acc);outline-offset:3px;border-radius:4px;}
.sty-topics{display:flex;flex-direction:column;gap:5px;}
.sty-topic{background:var(--stg-surf);border:1px solid var(--stg-line);border-radius:9px;
  overflow:hidden;}
.sty-topic.on{border-color:var(--stg-line2);}
.sty-trow{display:flex;align-items:center;gap:12px;width:100%;text-align:left;cursor:pointer;
  background:none;border:0;padding:11px 14px;font-family:inherit;color:var(--stg-ink);}
.sty-trow:hover{background:var(--stg-chip);}
.sty-trow:focus-visible{outline:2px solid var(--stg-acc);outline-offset:-2px;}
.sty-tn{font-size:14.5px;font-weight:800;letter-spacing:-0.01em;min-width:0;
  overflow:hidden;text-overflow:ellipsis;white-space:nowrap;}
.sty-tc{margin-left:auto;flex:none;font-family:${MONO};font-size:12px;font-weight:700;
  font-variant-numeric:tabular-nums;color:var(--stg-ink2);}
/* The caret is the only thing on the row that says it opens, so it turns
   rather than swapping to a second glyph. */
.sty-tv{flex:none;color:var(--stg-mute2);transition:transform .16s ease;}
.sty-topic.on .sty-tv{transform:rotate(180deg);color:var(--stg-ink2);}
/* A topic with no count yet has no caret column to balance against, so the
   caret keeps the right edge on its own. */
.sty-trow>.sty-tv:nth-child(2){margin-left:auto;}
.sty-tbody{padding:2px 14px 13px;border-top:1px solid var(--stg-line);}
/* THE TITLES ARE THE POINT, so they are a plain list of links in columns
   rather than fifteen more bordered cards: a card per quiz would make a topic
   look like the game roster above it, which it is not. */
.sty-qgrid{display:grid;gap:1px 26px;grid-template-columns:repeat(auto-fill,minmax(280px,1fr));
  padding-top:10px;}
.sty-ql{display:block;min-width:0;font-size:13.5px;font-weight:600;line-height:1.45;
  color:var(--stg-ink2);text-decoration:none;padding:5px 0;
  overflow:hidden;text-overflow:ellipsis;white-space:nowrap;}
.sty-ql:hover{color:var(--stg-acc-ink);}
.sty-ql:focus-visible{outline:2px solid var(--stg-acc);outline-offset:2px;border-radius:4px;}
.sty-tfoot{display:flex;gap:7px;margin-top:9px;}
.sty-tmore{width:auto;margin-top:0;flex:1 1 auto;text-align:center;text-decoration:none;
  display:flex;align-items:center;justify-content:center;}

@media (max-width:640px){
  .sty-qgrid{grid-template-columns:minmax(0,1fr);}
  .sty-tfoot{flex-direction:column;}
}
@media (prefers-reduced-motion:reduce){.sty-tv{transition:none;}}
@media (prefers-reduced-motion:reduce){.sty-prog span{transition:none;}}

/* ── A SHUT SECTION IS ITS HEAD (owner, 2026-09-01) ──
   display:none rather than an unrendered grid, so the cards stay in the HTML:
   this page is the crawl path to every daily, and dropping them would drop ~80
   internal links with them. The head is unchanged, which is what makes the shut
   page a run of the same ruled titles the open one is built from. */
.sty-games.shut,.sty-circs.shut{display:none;}
.sty-cathead:has(.sty-cav){cursor:pointer;}
.sty-cav{margin-left:auto;flex:none;display:inline-flex;align-items:center;justify-content:center;
  width:26px;height:26px;border:0;border-radius:7px;background:none;cursor:pointer;
  color:var(--stg-mute2);transition:transform .18s,color .12s,background .12s;}
.sty-cathead:hover .sty-cav{color:var(--stg-ink);background:var(--stg-chip);}
.sty-cav.on{transform:rotate(180deg);}
.sty-cav:focus-visible{outline:2px solid var(--stg-acc);outline-offset:2px;}
/* A circuit's star sits IN the header row: the corner a card star would take is
   already the circuit's N/M count. */
.sty-chead .sty-star{position:static;flex:none;width:22px;height:22px;margin-left:2px;}
.sty-circ:hover .sty-star{opacity:1;}
.sty-minec{margin-top:7px;}
@media (prefers-reduced-motion:reduce){.sty-cav{transition:none;}}

/* ── A SECTION FADES IN AS ITS DATA LANDS (owner, 2026-09-01) ──
   The page is fed by four separate requests (day status, the combined board,
   totals, the feed) and every section they fill used to snap into place as its
   payload happened to arrive, which read as the page assembling itself in
   pieces. Each of those sections is rendered only once it has something to
   say, so it MOUNTS at the moment its data lands and this animation plays once
   off the mount: no state, no effect, nothing to keep in step with the fetch.
   Opacity and a 6px rise, never height or scale, so the ResizeObserver on the
   board (which watches box size, not transforms) reads one height throughout.
   ARMED BY [data-sty-anim], which the component sets only when the document is
   VISIBLE at mount. A browser does not advance an animation clock in a hidden
   tab, so without that gate a page loaded in the background holds every one of
   these at opacity 0 indefinitely and reads as blank to anything but a reader
   who focuses the tab. Unarmed, these rules do not match and the content simply
   renders.
   NO APOSTROPHES anywhere in this stylesheet: it is a text child of a style
   element, so React escapes them. */
@keyframes sty-in{from{opacity:0;transform:translateY(6px);}to{opacity:1;transform:none;}}
[data-sty-anim] .sty-rev{animation:sty-in .34s cubic-bezier(.2,.7,.3,1) both;}
/* The rows of a table or a feed come in as a run rather than a block, capped
   so a long standing never keeps the reader waiting on its last row. */
[data-sty-anim] .sty-revr{animation:sty-in .3s cubic-bezier(.2,.7,.3,1) both;
  animation-delay:calc(min(var(--i,0),9) * 26ms);}
@media (prefers-reduced-motion:reduce){
  [data-sty-anim] .sty-rev,[data-sty-anim] .sty-revr{animation:none;}
}
`;
