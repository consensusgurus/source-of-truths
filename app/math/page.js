import { circuitById, runHref } from '@/lib/circuits';
import MathDoor from './MathDoor';

// /math — the Math Gauntlet's own front door AND its share URL (owner,
// 2026-10-09). It used to be a bare server redirect, which hands a link
// preview nothing of its own; it now carries the run's metadata and share card
// (the same image /circuits/math draws) and forwards a person to the run on
// arrival. Out of the index, like the run.
const c = circuitById('math');
const title = 'Math Gauntlet · Mind Loft';
const description = (c && c.share && c.share.invite) || 'Five mental math games, one life in each.';
const image = '/circuits/math/opengraph-image';

export const metadata = {
  title,
  description,
  robots: { index: false, follow: true },
  alternates: { canonical: '/math' },
  openGraph: { title, description, url: '/math', type: 'website', siteName: 'Mind Loft', images: [{ url: image, width: 1200, height: 630, alt: 'The Math Gauntlet: five math games, one life each' }] },
  twitter: { card: 'summary_large_image', title, description, images: [image] },
};

export default function MathFrontDoor() {
  return <MathDoor to={runHref('math')} />;
}
