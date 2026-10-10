// The Gauntlet share card's DATA, in one place (2026-08-30).
//
// Two routes draw this card: /circuits/<id> (the landing, which is the URL
// every share button hands out) and /circuits/<id>/run. Until this file the
// run route owned the bank map privately and the landing had no card at all,
// so a shared circuit link previewed as the site's default image over the
// site's boilerplate description, which says nothing about the thing being
// shared.
//
// THE BANK MAP LIVES HERE AND NOWHERE ELSE. The run route's own comment named
// it as the third copy of the roster (RUN_GAMES and the run page's BANKS are
// the other two) and as the one with no user-visible failure when it is
// forgotten: it held five banks while the run had seven, so the card
// advertised 130 questions for a 180 question run. Two routes reading one map
// is the whole point of the file. ADDING A BANK TO THE RUN STILL MEANS ADDING
// IT HERE.
//
// Only the PUZZLES lists are imported, never questions.js: the count is the
// length of today's qids, so the megabytes of question text stay out of both
// image routes.
import { circuitKeysFor, circuitSlotFor, isRunnableCircuit, rampFor, runEngine } from '@/lib/circuits';
import { DAILY_GAME_MAP } from '@/lib/daily-games';

import { PUZZLES as deepPuzzles } from '../../deep/puzzles';
import { PUZZLES as atlasPuzzles } from '../../atlas/puzzles';
import { PUZZLES as sportPuzzles } from '../../sport/puzzles';
import { PUZZLES as bizPuzzles } from '../../biz/puzzles';
import { PUZZLES as scriptPuzzles } from '../../script/puzzles';
import { PUZZLES as quotesPuzzles } from '../../quotes/puzzles';
import { PUZZLES as streakPuzzles } from '../../streak/puzzles';
import { PUZZLES as blitzPuzzles } from '../../blitz/puzzles';
import { PUZZLES as blitzedPuzzles } from '../../blitzed/puzzles';
import { PUZZLES as gapPuzzles } from '../../gap/puzzles';
import { PUZZLES as seriesPuzzles } from '../../series/puzzles';
import { PUZZLES as backPuzzles } from '../../back/puzzles';

const DAYS = {
  deep: deepPuzzles, atlas: atlasPuzzles, sport: sportPuzzles, biz: bizPuzzles,
  script: scriptPuzzles, quotes: quotesPuzzles, streak: streakPuzzles,
  // The Math Gauntlet's five (2026-10-09). Without these the math circuit had
  // no banks, so its share card fell back to the plain quiz card.
  blitz: blitzPuzzles, blitzed: blitzedPuzzles, gap: gapPuzzles,
  series: seriesPuzzles, back: backPuzzles,
};

export function etTodayServer() {
  try { return new Date().toLocaleDateString('en-CA', { timeZone: 'America/New_York' }); }
  catch (e) { return new Date().toISOString().slice(0, 10); }
}

// Today's live day for a bank, or null. The card needs more than the count off
// it (Deep's day TOPIC is the line under its name), so this returns the day
// rather than a number.
function dayOf(key, today) {
  const bank = DAYS[key];
  if (!bank) return null;
  const open = bank.filter((p) => p.live <= today);
  return open[open.length - 1] || null;
}

// Today's banks for a runnable circuit, in run order, each with the colour its
// slot carries on the ladder. The colour comes from the CANONICAL roster
// position rather than today's shuffled one, so a game keeps its colour from
// day to day. A circuit that is not runnable, or whose banks have no day
// today, returns an empty array and the caller falls back to a plain card.
export function gauntletBanks(id, today) {
  const day = today || etTodayServer();
  if (!isRunnableCircuit(id)) return [];
  return circuitKeysFor(id, day).map((k) => {
    const g = DAILY_GAME_MAP[k] || {};
    const p = dayOf(k, day);
    return {
      key: k,
      name: g.name || k,
      // THE LINE UNDER THE NAME, by the gate's own rule (lineFor in
      // RunClient): the game's SUBJECT, except that a game whose day carries a
      // TOPIC prints the topic. That is Deep, whose subject is the word
      // "Trivia" and whose topic is the whole point of it, and it reads as the
      // subject everywhere else with no special casing by key.
      sub: (p && p.topic) || g.subject || g.cat || g.tag || '',
      asked: p && Array.isArray(p.qids) ? p.qids.length : 0,
      color: rampFor(circuitSlotFor(id, k)),
    };
  }).filter((b) => b.asked > 0);
}

export const askedTotal = (banks) => banks.reduce((a, b) => a + (b.asked || 0), 0);

// THE CARD'S PROPS, in one place, because BOTH routes draw the same card.
// They used to differ only in a line of prose under the headline, which is a
// distinction no reader of a link preview can act on: the landing and the run
// are the same sitting, one click apart. Since the card is now the gate itself
// (see renderGauntletCard), its headline is the gate's headline and its
// figures are the gate's figures, so there is nothing left to vary and a
// second copy of the props would only be a second thing to forget.
export function gauntletCardProps(circuit, banks) {
  const isMath = !!(circuit && runEngine(circuit.id) === 'math');
  const name = (circuit && circuit.name) || (isMath ? 'Math Gauntlet' : 'Trivia Gauntlet');
  const asked = askedTotal(banks);
  return {
    name,
    kind: isMath ? 'math' : 'trivia',
    eyebrow: isMath ? 'MIND LOFT · MATH' : 'MIND LOFT · TRIVIA',
    gateEyebrow: (name + ' · one long quiz').toUpperCase(),
    // The gate's own two lines, counted rather than written down, so a roster
    // change can never leave a figure on the card that nothing else agrees
    // with. That is not hypothetical: the bank map held five banks while the
    // run had seven, and the card advertised 130 questions for a 180 question
    // run until it was caught.
    line1: isMath ? `${asked} problems, ${banks.length} games.` : `${asked} questions, ${banks.length} quizzes.`,
    line2: 'One life each.',
    cta: 'Take your run',
    banks,
    asked,
  };
}
