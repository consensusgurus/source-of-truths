// RUN TITLES (owner, 2026-10-17): the name a run's total earns on the Trivia
// Gauntlet and the Math Gauntlet. The ending's title reveal climbs these and
// lands on one; the end card names it.
//
// The ladders are owner-named. Each rung is { min, name, line, colour }, read
// bottom to top: `min` is the questions right the title needs, `line` is the
// one sentence under it, and `colour` is the stage flash when the climb
// crosses it (the mockups' colours, which are the site's ramp).
//
// THE CUTOFFS ARE PROVISIONAL. They were set by hand before any run totals
// were measured, and are to be recut once real totals exist (where a run's
// median and top tenth actually land). Change the numbers here and nowhere
// else: the finale and the end card both read titleFor.

export const RUN_TITLES = {
  gauntlet: [
    { min: 0, name: 'Time to Open a Book', line: 'Every expert started on page one.', colour: '#e9edf4' },
    { min: 20, name: 'Average Joe', line: 'Right about as often as the next person.', colour: '#7dd3fc' },
    { min: 35, name: 'Pub Quiz Regular', line: 'Knows the questions and the bartender.', colour: '#6ee7b7' },
    { min: 50, name: 'Trivia Night Ringer', line: 'The team everyone wants at the bar.', colour: '#e8b43a' },
    { min: 70, name: 'Know-It-All', line: 'Has an answer for everything, and it is usually right.', colour: '#fb923c' },
    { min: 95, name: 'Walking Encyclopedia', line: 'Seven subjects, no reference shelf needed.', colour: '#e879f9' },
  ],
  math: [
    { min: 0, name: 'Count on Your Fingers', line: 'Ten fingers, and every one of them in use.', colour: '#e9edf4' },
    { min: 15, name: 'Calculator Required', line: 'Gets there, with a little help from the phone.', colour: '#7dd3fc' },
    { min: 30, name: 'Average Joe', line: 'Can total a receipt without looking it up.', colour: '#6ee7b7' },
    { min: 45, name: 'Quick with Numbers', line: 'You split the check before the waiter comes back.', colour: '#bef264' },
    { min: 60, name: 'Mathlete', line: 'Does the tip in your head and the tax too.', colour: '#e8b43a' },
    { min: 80, name: 'Walking Computer', line: 'The answer is out before the question finishes.', colour: '#fb923c' },
  ],
};

export function titleLadder(circuitId) {
  return RUN_TITLES[circuitId] || null;
}

// The index of the highest rung `right` reaches, or -1 for a circuit with no
// ladder.
export function titleIndex(circuitId, right) {
  const ladder = titleLadder(circuitId);
  if (!ladder) return -1;
  const n = Math.max(0, Math.floor(Number(right) || 0));
  let at = 0;
  ladder.forEach((t, i) => { if (n >= t.min) at = i; });
  return at;
}

// The title `right` earns on this circuit, with the next one up: { ...rung,
// index, next, toNext } where `next` is the next rung (null at the top) and
// `toNext` how many more right it needs. null for a circuit with no ladder.
export function titleFor(circuitId, right) {
  const ladder = titleLadder(circuitId);
  if (!ladder) return null;
  const i = titleIndex(circuitId, right);
  const n = Math.max(0, Math.floor(Number(right) || 0));
  const next = ladder[i + 1] || null;
  return { ...ladder[i], index: i, next, toNext: next ? next.min - n : 0 };
}
