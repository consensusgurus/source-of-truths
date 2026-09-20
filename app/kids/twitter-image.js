import { renderKidsCard } from '@/lib/og-stage-cards'

export const runtime = 'nodejs'
export const revalidate = 3600
export const alt = 'Mind Loft Kids: little puzzles, big thinking. Six gentle daily puzzles for kids, free.'
export { size, contentType } from '@/lib/og-stage-cards'

// The kids hub share image, shared by every /kids/<game> page (they point
// openGraph.images here), so a kids link never shows the grown-up brand card.
async function renderCard() {
  return renderKidsCard()
}


// A Satori render that throws used to surface as a 500, which is how these
// routes became every one of Search Console's server errors. Fall back to the
// baked card in public/og/ instead: a generic share image beats an error.
export default async function Image(ctx) {
  try {
    return await renderCard(ctx);
  } catch (err) {
    console.error('share card failed, serving /og/brand.png', err);
    return new Response(null, { status: 302, headers: { Location: '/og/brand.png' } });
  }
}
