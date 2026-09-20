import { renderGauntletCard, renderQuizCard } from '@/lib/og-stage-cards';
import { circuitById, isMarquee } from '@/lib/circuits';
import { gauntletBanks, gauntletCardProps, etTodayServer } from './gauntlet-card';

export const runtime = 'nodejs';
// Static per route, so it covers every circuit rather than naming one.
export const alt = 'A Mind Loft circuit: several daily puzzles played back to back as one run';
export { size, contentType } from '@/lib/og-stage-cards';

// THE LANDING'S SHARE CARD (owner, 2026-08-30, "it currently defaults to main
// page view").
//
// /circuits/<id> is the URL every share button on the site hands out:
// circuitShareUrl points here, the band shares it, the landing shares it, and
// the run's own scorecard shares it. It carried an openGraph title and
// description and NO image, so every one of those shares previewed as the
// root layout's default card, which is the home page. The thing being shared
// looked like the site rather than like itself.
//
// A runnable circuit draws THE GATE, the screen the link opens onto, so a
// reader who follows it meets the same thing again (owner, 2026-08-31: the
// card "should be dark and match styling of our gameplay page"). Every other
// circuit gets the ordinary quiz card with its own name and its own line,
// which is still its own card rather than the site's.
async function renderCard({ params }) {
  const id = decodeURIComponent((params && params.id) || '');
  const c = circuitById(id);
  const banks = gauntletBanks(id, etTodayServer());

  if (!banks.length) {
    return renderQuizCard({
      category: isMarquee(id) ? 'Daily' : 'Circuit',
      title: c ? (isMarquee(id) ? c.name : `The ${c.name} circuit`) : 'A Mind Loft circuit',
      blurb: (c && c.share && c.share.invite) || 'Several daily puzzles, played as one run.',
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
