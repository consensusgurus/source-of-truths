import { CONTEST } from '@/lib/contest'
import { renderContestCard } from '@/lib/og-stage-cards'

export const runtime = 'nodejs'
// Days-left is derived at request time, so the card cannot go stale mid-contest.
export const revalidate = 3600

export const alt = `Win ${CONTEST.prizeLabel}: the Mind Loft referral contest`
export { size, contentType } from '@/lib/og-stage-cards'

// This route used to carry its own copy of the Loft chrome, its own mark, and its
// own jsdelivr font fetch, which is why it was one of the four image routes that
// 500 whenever that CDN is unreachable. The shared renderer reads its fonts from
// node_modules, so the card cannot fail on a network hiccup.
async function renderCard() {
  const left = Math.max(0, Math.ceil((Date.parse(CONTEST.endsAt) - Date.now()) / 86400000))
  return renderContestCard({
    prizeLabel: CONTEST.prizeLabel,
    prizes: CONTEST.prizes,
    deadlineLabel: CONTEST.deadlineLabel,
    daysLeft: left,
  })
}


// A Satori render that throws used to surface as a 500, which is how these
// routes became every one of Search Console's server errors. Fall back to the
// baked card in public/og/ instead: a generic share image beats an error.
export default async function Image(ctx) {
  try {
    return await renderCard(ctx);
  } catch (err) {
    console.error('share card failed, serving /og/quizzes.png', err);
    return new Response(null, { status: 302, headers: { Location: '/og/quizzes.png' } });
  }
}
