import { Suspense } from 'react';
import { redirect } from 'next/navigation';
import RunClient from './RunClient';
import ValetRunClient from '../../ValetRunClient';
import { circuitById, circuitGamesFor, circuitKeysFor, circuitSlotFor, isMarquee, isRunnableCircuit, runEngine, RUN_GAMES, JAM_RUN_GAMES } from '@/lib/circuits';
import { DAILY_GAME_MAP } from '@/lib/daily-games';
import { SITE_URL } from '@/lib/site';
import { T } from '@/lib/theme';

import { PUZZLES as deepPuzzles } from '../../../deep/puzzles';
import { QUESTION_MAP as deepQuestions } from '../../../deep/questions';
import { PUZZLES as atlasPuzzles } from '../../../atlas/puzzles';
import { QUESTION_MAP as atlasQuestions } from '../../../atlas/questions';
import { PUZZLES as sportPuzzles } from '../../../sport/puzzles';
import { QUESTION_MAP as sportQuestions } from '../../../sport/questions';
import { PUZZLES as bizPuzzles } from '../../../biz/puzzles';
import { QUESTION_MAP as bizQuestions } from '../../../biz/questions';
import { PUZZLES as scriptPuzzles } from '../../../script/puzzles';
import { QUESTION_MAP as scriptQuestions } from '../../../script/questions';
import { PUZZLES as quotesPuzzles } from '../../../quotes/puzzles';
import { QUESTION_MAP as quotesQuestions } from '../../../quotes/questions';
import { PUZZLES as streakPuzzles } from '../../../streak/puzzles';
import { QUESTION_MAP as streakQuestions } from '../../../streak/questions';

import { PUZZLES as parkPuzzles } from '../../../parker/puzzles';
import { N as PARK_N, EXIT_ROW as PARK_EXIT } from '../../../parker/solver';
import { PUZZLES as impoundPuzzles } from '../../../impound/puzzles';
import { N as IMPOUND_N, EXIT_ROW as IMPOUND_EXIT } from '../../../impound/solver';
import { PUZZLES as junkyardPuzzles } from '../../../junkyard/puzzles';
import { N as JUNKYARD_N, EXIT_ROW as JUNKYARD_EXIT } from '../../../junkyard/solver';

// THE RUN PAGE — a circuit served as one continuous quiz.
//
// Every bank is resolved HERE, on the server, and only the picked day's
// questions for the run's own games reach the browser, exactly as each game's
// own page does it. The rest of five banks never ships.
//
// BANKS is the whole of what makes a circuit runnable: a game is playable in
// one continuous board only if its day is a list of four-choice questions in
// play order. lib/circuits' RUN_GAMES names the same five keys as plain data,
// so scripts/verify-circuits.mjs can assert a circuit flagged `run` holds only
// games this page can actually serve, without importing a page component.
//
// The tier names mirror each client's own TIER_NAMES constant. They are display
// only, they name the rung a player is on and nothing branches on them, so a
// drift here costs a label rather than a wrong question. Everything that could
// be derived is derived: the name, the tag and the colour come out of the daily
// registry, the tier size out of the day's own length (every one of these games
// ramps five tiers), so there is one copy of each of those.
const BANKS = {
  deep: { puzzles: deepPuzzles, questions: deepQuestions, tiers: ['Surface', 'Shallows', 'Midwater', 'Deep water', 'The bottom'] },
  atlas: { puzzles: atlasPuzzles, questions: atlasQuestions, tiers: ['Home ground', 'Farther out', 'Off the main roads', 'The far corners', 'Expert'] },
  sport: { puzzles: sportPuzzles, questions: sportQuestions, tiers: ['Warm-up', 'First half', 'Second half', 'Crunch time', 'Overtime'] },
  script: { puzzles: scriptPuzzles, questions: scriptQuestions, tiers: ['Opening credits', 'First act', 'Second act', 'Third act', 'The credits roll'] },
  quotes: { puzzles: quotesPuzzles, questions: quotesQuestions, tiers: ['Household words', 'Well known', 'Worth knowing', 'For the reader', 'Chapter and verse'] },
  biz: { puzzles: bizPuzzles, questions: bizQuestions, tiers: ['Warm-up', 'First half', 'Second half', 'Crunch time', 'Overtime'] },
  streak: { puzzles: streakPuzzles, questions: streakQuestions, tiers: ['Warm-up', 'Easy', 'Medium', 'Hard', 'Brutal'] },
};

// THE JAM ENGINE'S BANKS (2026-09-05). The Valet Gauntlet deals the three
// sliding-block lots on one clock, and a lot is a starting layout plus a
// banked perfect line rather than a question list, so it has its own map. The
// size and the exit row come off each game's own solver binding, which is the
// one place those are frozen. JAM_RUN_GAMES in lib/circuits names the same
// three keys, and the verifier asserts a jam-engine circuit holds nothing else.
const LOTS = {
  park: { puzzles: parkPuzzles, n: PARK_N, exitRow: PARK_EXIT },
  impound: { puzzles: impoundPuzzles, n: IMPOUND_N, exitRow: IMPOUND_EXIT },
  junkyard: { puzzles: junkyardPuzzles, n: JUNKYARD_N, exitRow: JUNKYARD_EXIT },
};

export const dynamic = 'force-dynamic';

// THE BROWSER CHROME TAKES THE RUN'S GROUND. theme-color is what tints
// Safari's dome and its bottom address bar, and the root layout sets it to
// brand navy for the whole site. On this page that put a navy strip above and
// below a near-black stage, which is the same seam the cap change removed from
// inside the page. A route-level viewport export REPLACES the root's rather
// than merging with it, so every other field is restated here verbatim: drop
// viewportFit and the installed app loses its edge-to-edge layout.
export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  viewportFit: 'cover',
  themeColor: T.ground,
};

// The house voice SPELLS a small count ("Twenty-five questions, one life"), and
// this is the most visible string on the page, so "Five trivia quizzes" rather
// than "5". Falls back to the numeral above seven, where spelling stops helping.
const WORDS = ['zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven'];
const spell = (n, cap = false) => {
  const w = WORDS[n] || String(n);
  return cap ? w.charAt(0).toUpperCase() + w.slice(1) : w;
};

function etTodayServer() {
  try { return new Date().toLocaleDateString('en-CA', { timeZone: 'America/New_York' }); }
  catch (e) { return new Date().toISOString().slice(0, 10); }
}

// Today's live day for one game, or null when its bank has not reached today.
// A game with no puzzle today simply drops out of the run, the same way
// circuitKeysFor drops a retired one: never assume the run is five long.
function dayFor(bank, today) {
  const open = bank.puzzles.filter((p) => p.live <= today);
  return open.length ? open[open.length - 1] : null;
}

// THE SHARE COPY. This link is meant to be sent to somebody who has never
// played, so every string here is written for a cold reader rather than for
// somebody already on the site.
//
// STAKES FIRST, and the twitter block is stated in full. A page that names no
// twitter card inherits the ROOT layout's, which is the site boilerplate about
// 1,000+ quizzes and 669 experts: true of the site, and nothing at all to do
// with the thing being shared. That is what this page was doing.
//
// NO COMPETITOR MARK. The obvious line here is the name of a certain television
// quiz show, and it is deliberately not used: the house rule is that a rival
// game's trademark never appears in user-facing copy or metadata (the same
// reason nothing on the site names Wordle, Connections or Jumble), and a quiz
// product is exactly where such a mark gets enforced. "Quiz show practice"
// carries the same meaning and belongs to us. Do not swap it back.
//
// NOTHING HERE CLAIMS A NUMBER WE HAVE NOT MEASURED. No "most players are out
// by question ten": it reads well and we have not counted it. The stakes are
// carried by what the game actually does, which is enough.
export async function generateMetadata({ params }) {
  const c = circuitById(decodeURIComponent(params.id));
  if (!c) return {};
  if (runEngine(c.id) === 'jam') {
    const url = `${SITE_URL}/circuits/${c.id}/run`;
    const hook = 'Three jammed lots. One clock.';
    return {
      title: `${c.name} — Parker, Impound and Junkyard on One Clock | Mind Loft`,
      description:
        'The three daily sliding-block puzzles played back to back as one run: a six by six, a seven by seven and an eight by eight, each with a red car to slide out of the one gap in the wall. One clock across all three, and the fastest valet takes the day. Free, no signup, new lots every day.',
      alternates: { canonical: `/circuits/${c.id}/run` },
      robots: { index: false, follow: true },
      openGraph: {
        title: hook,
        description: 'Park the red car out of three lots in a row. The board ranks on your combined time, and moves do not count.',
        url, type: 'website', siteName: 'Mind Loft',
      },
      twitter: {
        card: 'summary_large_image',
        title: hook,
        description: 'Three sliding-block lots, one clock. How fast can you park all three?',
      },
    };
  }
  const games = circuitGamesFor(c.id, etTodayServer()).filter((g) => RUN_GAMES.includes(g.key));
  const n = games.length || 5;
  const url = `${SITE_URL}/circuits/${c.id}/run`;
  const hook = `${spell(n, true)} trivia quizzes. One life each.`;
  return {
    title: `${c.name} — ${spell(n, true)} Trivia Quizzes, One Long Run | Mind Loft`,
    description:
      `Quiz show practice, ${spell(n)} rounds deep. Every daily trivia quiz played back to back as one run: a topic in depth, the whole map, every sport, the business of everything, and forty questions of anything at all. Twenty seconds a question, one life in each quiz, and one wrong answer ends it. Free, no signup, new questions every day.`,
    alternates: { canonical: `/circuits/${c.id}/run` },
    robots: { index: false, follow: true },
    openGraph: {
      title: hook,
      description:
        'Quiz show practice with the stakes left in. One wrong answer ends that quiz, the next one starts on its own, and you get one scorecard at the end.',
      url, type: 'website', siteName: 'Mind Loft',
    },
    twitter: {
      card: 'summary_large_image',
      title: hook,
      description: 'One wrong answer ends the quiz. Then the next one starts. How far do you get?',
    },
  };
}

export default function CircuitRunPage({ params }) {
  const id = decodeURIComponent(params.id || '');
  const circuit = circuitById(id);
  // Not a circuit, the marquee (whose roster is a daily read across every
  // category, so it is not one shape), or a circuit whose games are not all
  // question banks: there is nothing to serve as one quiz, so the landing page
  // with its ordinary hand-off is the honest destination.
  if (!circuit || isMarquee(id) || !isRunnableCircuit(id)) redirect(`/circuits/${encodeURIComponent(id || '')}`);
  // Price Check is served at its own address (lib/circuits `path`).
  if (runEngine(id) === 'price') redirect('/pricecheck');
  // Judged too (2026-10-08).
  if (runEngine(id) === 'law') redirect('/judged');

  const today = etTodayServer();
  const label = (() => {
    try {
      return new Date(today + 'T12:00:00Z').toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric', timeZone: 'UTC' });
    } catch (e) { return today; }
  })();

  // THE JAM RUN. Each lot ships only its own live board: the layout, the
  // banked perfect line, the size and the exit row, exactly what the game's
  // own page sends its client. Tomorrow's boards never reach the browser.
  if (runEngine(id) === 'jam') {
    const lots = [];
    for (const key of circuitKeysFor(id, today)) {
      if (!JAM_RUN_GAMES.includes(key) || !LOTS[key]) continue;
      const lot = LOTS[key];
      const open = lot.puzzles.filter((p) => p.live <= today);
      const day = open.length ? open[open.length - 1] : null;
      if (!day) continue;
      const g = DAILY_GAME_MAP[key] || {};
      lots.push({
        key,
        name: g.name || key,
        tag: g.tag || '',
        n: lot.n,
        exitRow: lot.exitRow,
        quizId: day.quizId,
        num: day.num,
        perfect: day.par,
        pieces: day.pieces,
        sunday: !!day.sunday,
        dateLabel: day.dateLabel,
        accent: g.color || '#233a63',
        slot: circuitSlotFor(circuit.id, key),
      });
    }
    if (lots.length < 2) redirect(`/circuits/${encodeURIComponent(id)}`);
    return (
      <Suspense fallback={null}>
        <ValetRunClient circuitId={circuit.id} circuitName={circuit.name} dateLabel={label} sections={lots} />
      </Suspense>
    );
  }

  const keys = circuitKeysFor(id, today).filter((k) => RUN_GAMES.includes(k) && BANKS[k]);

  const sections = [];
  for (const key of keys) {
    const bank = BANKS[key];
    const day = dayFor(bank, today);
    if (!day) continue;
    const questions = day.qids
      .map((qid) => bank.questions[qid])
      .filter(Boolean)
      .map(({ q, choices, correct, cat, tier }) => ({ q, choices, correct, cat, tier }));
    if (!questions.length) continue;
    const g = DAILY_GAME_MAP[key] || {};
    sections.push({
      key,
      name: g.name || key,
      tag: g.tag || '',
      // The one line under the name, on the start list AND the scorecard: the
      // game's SUBJECT, never its day topic and never its question count. See
      // the note on `subject` in lib/daily-games.js.
      subject: g.subject || g.cat || '',
      accent: g.color || '#233a63',
      // The game's slot in the circuit's CANONICAL key list, not in today's
      // shuffled run. The ladder colours by this so a game keeps its colour
      // from one day to the next even though its position moves.
      slot: circuitSlotFor(circuit.id, key),
      quizId: day.quizId,
      num: day.num,
      topic: day.topic || '',
      perTier: Math.max(1, Math.round(questions.length / bank.tiers.length)),
      tierNames: bank.tiers,
      questions,
    });
  }

  if (sections.length < 2) redirect(`/circuits/${encodeURIComponent(id)}`);

  return (
    <Suspense fallback={null}>
      <RunClient circuitId={circuit.id} circuitName={circuit.name} dateLabel={label} sections={sections} />
    </Suspense>
  );
}
