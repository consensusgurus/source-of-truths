import { redirect } from 'next/navigation';
import { runHref } from '@/lib/circuits';

// /math — the Math Gauntlet's own front door (owner, 2026-10-09), the same
// shape as /trivia and /valet: the run lives at /circuits/math/run, and this
// forwards there so there is one copy of the run. Out of the index for the
// same reason the run is.
export const metadata = { robots: { index: false, follow: true } };

export default function MathFrontDoor() {
  redirect(runHref('math'));
}
