import { renderGauntletCard, renderQuizCard } from '@/lib/og-stage-cards';
import { circuitById, runEngine } from '@/lib/circuits';
import { gauntletBanks, gauntletCardProps, etTodayServer } from '../gauntlet-card';

export const runtime = 'nodejs';
export const alt = 'The Trivia Gauntlet: every daily trivia quiz played back to back, one life in each, from Mind Loft';
export { size, contentType } from '@/lib/og-stage-cards';

// THE RUN'S OWN SHARE CARD. Without it this page inherited the root layout's
// card, so a link to the run shared as the generic site image over the site's
// boilerplate description, which says nothing about the thing being shared.
//
// IT IS THE GATE (owner, 2026-08-31, "it should be dark and match styling of
// our gameplay page"): the cap and its three figures, the ladder in its
// gutter, the two line headline, the roster with its ramp strips, the sky call
// to action. It was a dark card carrying a sideways bar chart before that, a
// composition this page does not have anywhere, so it looked like an advert
// for the run rather than like the run.
//
// THE QUESTION COUNT IS COUNTED, never written down. A roster change, a new
// quiz or a retirement would otherwise leave a number on the card that nothing
// else on the site agrees with, and a share card is the last place anyone would
// think to look for a stale figure. That is not hypothetical: the bank map held
// five banks while the run had seven, so the card advertised 130 questions for
// a 180 question run from the day Script and Quotes launched.
//
// THE MAP ITSELF LIVES in ../gauntlet-card (2026-08-30), because the landing
// page's card needs exactly the same counts and a second private copy is how
// the stale figure above happened in the first place. Adding a bank to the run
// still means adding it there.
async function renderCard({ params }) {
  const id = decodeURIComponent((params && params.id) || '');
  const c = circuitById(id);
  const banks = gauntletBanks(id, etTodayServer());

  // A circuit with no live banks, or one that is not runnable at all, still
  // needs a card; it falls back to the ordinary quiz card rather than drawing
  // an empty ladder.
  if (!banks.length) {
    return renderQuizCard({
      id: 'circuits/' + id,
      // The Valet Gauntlet is a run with no question banks, so it takes its
      // own line and category here rather than the trivia one.
      category: runEngine(id) === 'jam' ? 'Logic' : 'Trivia',
      title: `The ${(c && c.name) || 'Run'} circuit`,
      blurb: runEngine(id) === 'jam' && c && c.blurb ? c.blurb : 'Every quiz in the circuit, played back to back as one long run.',
    });
  }

  return renderGauntletCard({ ...gauntletCardProps(c, banks), id });
}


// A Satori render that throws used to surface as a 500, which is how these
// routes became every one of Search Console's server errors. Fall back to the
// baked card in public/og/ instead: a generic share image beats an error.
export default async function Image(ctx) {
  try {
    return await renderCard(ctx);
  } catch (err) {
    console.error('share card failed, serving /og/daily.png', err);
    return new Response(null, { status: 302, headers: { Location: '/og/daily.png' } });
  }
}
