import { renderKidsCard } from '@/lib/og-stage-cards'

export const runtime = 'nodejs'
export const revalidate = 3600
export const alt = 'Mind Loft Kids: little puzzles, big thinking. Seven gentle daily puzzles for kids, free.'
export { size, contentType } from '@/lib/og-stage-cards'

// The kids hub share image, shared by every /kids/<game> page (they point
// openGraph.images here), so a kids link never shows the grown-up brand card.
export default async function Image() {
  return renderKidsCard()
}
