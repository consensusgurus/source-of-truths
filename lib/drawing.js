// The $100 ticket drawing (owner, 2026-10-09): the referral promotion run back
// in the same format as the August contest, except that every new player you
// bring in is one TICKET and one ticket is drawn at random for the prize.
//
// The single source of truth for the window, the prize and the reader-facing
// terms. The pop-up (app/DrawingPop.jsx), the community board panel
// (app/quizzes/community/DrawingBoard.jsx) and /api/quiz/drawing all read from
// HERE, so changing a date or the prize is a one-file edit.
//
// Wording rule (owner): it is a DRAWING, never a raffle. A raffle that sells
// entries is legally a lottery; this one is free to enter, so the copy says
// drawing, ticket, and "No purchase necessary" everywhere it states terms.
//
// What earns a ticket: a quiz_referrals row credited inside the window (one per
// referred person ever, written when they FINISH a game through your link),
// where that person had no finished game before the credit. The newness test
// lives in lib/drawing-server.js because it needs the database.

export const DRAWING = {
  id: 'ticket-drawing-oct-2026',

  // --- window ---------------------------------------------------------------
  // 60 days (owner, 2026-10-09): October 9 through December 7 inclusive, drawn
  // December 8. The window CROSSES the November 1 clock change, so the two
  // instants carry different offsets: the start is midnight EDT (UTC-4) and the
  // end is 11:59:59pm EST (UTC-5). Re-derive both if the dates ever move.
  startsAt: '2026-10-09T04:00:00Z',
  endsAt: '2026-12-08T04:59:59Z',
  startLabel: 'October 9',
  endLabel: 'December 7',
  deadlineLabel: '11:59pm ET on December 7',
  drawLabel: 'December 8',
  days: 60,

  // --- prize ----------------------------------------------------------------
  prize: 100,
  prizeLabel: '$100',
  minAge: 18,
  // A ticket counts only if the person it came from had never finished a game
  // before the credit (they are genuinely NEW to the site). The credit is
  // written moments after their finishing result, so their first play sits a
  // few seconds before it; an hour of slack absorbs a delayed ResultQueue retry.
  NEW_PLAYER_SLACK_MS: 60 * 60 * 1000,
};

export function drawingIsLive(now = Date.now()) {
  const t = typeof now === 'number' ? now : new Date(now).getTime();
  return t >= Date.parse(DRAWING.startsAt) && t <= Date.parse(DRAWING.endsAt);
}

export function drawingHasEnded(now = Date.now()) {
  const t = typeof now === 'number' ? now : new Date(now).getTime();
  return t > Date.parse(DRAWING.endsAt);
}

// Whole days left, rounded up. 0 once the window has closed.
export function drawingDaysLeft(now = Date.now()) {
  const t = typeof now === 'number' ? now : new Date(now).getTime();
  const ms = Date.parse(DRAWING.endsAt) - t;
  return ms <= 0 ? 0 : Math.ceil(ms / 86400000);
}

// "7.3%" for a share of the drum. One decimal under 10%, whole numbers above,
// "<0.1%" rather than a misleading 0.
export function formatOdds(mine, total) {
  const m = Number(mine) || 0;
  const t = Number(total) || 0;
  if (!m || !t) return '0%';
  const p = (m / t) * 100;
  if (p >= 99.95) return '100%';
  if (p < 0.1) return '<0.1%';
  return p < 10 ? `${p.toFixed(1)}%` : `${Math.round(p)}%`;
}

// "#0007"
export function ticketLabel(n) {
  return `#${String(Math.max(0, Number(n) || 0)).padStart(4, '0')}`;
}

export const DRAWING_COPY = {
  headline: `Bring a friend, win ${DRAWING.prizeLabel}.`,
  eyebrow: `The ${DRAWING.prizeLabel} drawing`,
  pitch:
    `Every new player who finishes a game from your link drops a ticket in the drum. One ticket is drawn on ${DRAWING.drawLabel} for ${DRAWING.prizeLabel}.`,
  pitchShort: `Each new player who finishes a game from your link is one ticket. Drawn ${DRAWING.drawLabel}.`,
  window: `${DRAWING.startLabel} to ${DRAWING.endLabel}`,
  legalShort: `No purchase necessary. Free to enter, ${DRAWING.minAge}+, email on your account required. Fake accounts are disqualified.`,
  legal:
    `No purchase necessary. Free to enter and play. Open worldwide to entrants ${DRAWING.minAge}+. ` +
    'An email on your account is required to win and get paid. Fake or spoofed accounts mean ' +
    'disqualification, and tickets are reviewed before the drawing. Payment options depend on your country.',
};
