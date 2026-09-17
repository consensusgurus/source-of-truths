// THE IDLE CARD'S WORDS, derived from the quiz object alone.
//
// Moved out of QuizClient (2026-09-17) so the page's Suspense fallback,
// app/quiz/[id]/QuizStageShell.jsx, can paint the same card on the server.
// /quiz/[id] is ISR, and QuizClient calls useSearchParams, so the whole client
// bails out of the static render: before the shell existed the server sent
// nothing for the quiz at all, and a reader saw the "About this quiz" section
// alone on a navy page until the bundle ran. Keep this pure: no window, no
// hooks, nothing that can differ between the server and the browser.

const fmtClock = (sec) => {
  const s = Math.max(0, Math.round(sec || 0));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
};

// The formats QuizClient hands to a board of its own before it reaches the
// idle card. The shell draws only the stage ground for these.
export const OWN_BOARD_FORMATS = new Set([
  'timed-mcq', 'logic-grid', 'grid-fill', 'place-map', 'geo-aerial', 'globe',
  'survive-state', 'logic-game', 'higher-lower', 'closer', 'connections',
]);

export function quizIntro(quiz) {
  const f = quiz.format;
  const matched = f === 'matched';
  const ordered = matched && quiz.ordered === true;
  const mapMode = f === 'map';
  const mapImgPrompt = mapMode && !!quiz.mapImgPrompt;
  const mapCapitalPrompt = mapMode && !!quiz.mapCapitalPrompt;
  const streetMapMode = f === 'street-map';
  const pairsMode = f === 'pairs';
  const bankMode = f === 'bank';
  const orderBankMode = f === 'order-bank';
  const typeMode = f === 'type-it' || f === 'careers';
  const scrambleMode = f === 'word-scramble';
  const photoMode = f === 'photo';
  const photoMatchMode = f === 'photo-match';
  const tileMode = pairsMode || bankMode || typeMode || scrambleMode || photoMode || photoMatchMode || orderBankMode;
  const answers = Array.isArray(quiz.answers) ? quiz.answers : [];
  const total = tileMode && Array.isArray(quiz.pairs) ? quiz.pairs.length : answers.length;
  const clockMax = fmtClock(quiz.timeLimit);

  const headline = mapMode || streetMapMode ? 'Find them all.'
    : (bankMode || pairsMode || photoMatchMode || orderBankMode) ? 'Match them all.'
    : scrambleMode ? 'Unscramble them all.'
    : 'Name them all.';
  const mech = mapMode ? (mapImgPrompt ? 'A flag appears; click its country on the map.' : mapCapitalPrompt ? 'A capital appears; click its country on the map.' : 'A name appears; click it on the map.')
    : streetMapMode ? 'A name appears; find and click it on the map.'
    : bankMode ? 'One clue at a time; tap the matching tile in the bank below.'
    : pairsMode ? 'Match the two columns, one pick at a time.'
    : photoMatchMode ? 'Tap the photo that matches each prompt.'
    : orderBankMode ? 'Tap the tiles into the right order.'
    : scrambleMode ? 'Unscramble each one; it locks in the moment the letters match.'
    : photoMode ? `Type the ${quiz.noun || 'answer'} for each photo; correct answers lock in the moment they match, no Enter needed.`
    : (matched && !ordered) ? `Type each ${quiz.noun || 'answer'} into its slot; correct answers lock in the moment they match, no Enter needed.`
    : ordered ? 'The answers must come in order; the highlighted slot shows what is next, and a correct answer locks in the moment it matches.'
    : typeMode ? `One clue at a time; type the ${quiz.noun || 'answer'}. Correct answers lock in the moment they match, no Enter needed.`
    : `Type ${/^[aeiou]/.test(quiz.noun || '') ? 'an' : 'a'} ${quiz.noun || 'answer'} and it locks in the moment it matches, no Enter needed.`;
  const body = `${total} ${total === 1 ? 'answer' : 'answers'}, ${clockMax} on the clock. ${mech} Solve as many as you can; time is the tiebreak.`;
  return { headline, body, total, clockMax };
}
