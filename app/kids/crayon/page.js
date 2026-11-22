import CrayonClient from './CrayonClient';
import { kidsMetadata } from '@/lib/kids-seo';
import KidsSeo from '../KidsSeo';

// Crayon (owner, 2026-11-22): color a simple outline picture with 96 colors,
// then play it as a jigsaw on the kids Puzzle Shelf (My Pictures). Not a
// daily and not scored: no registry row, only a view count (kids-crayon).

const DESC = 'A free coloring game for kids: pick a simple picture, color it by hand with 96 colors and a crayon that stays inside the lines, then play it as your own jigsaw puzzle. No sign-up, no ads.';

export const metadata = kidsMetadata('crayon');

// The browser chrome takes the kids butter ground; see html:has(.kd).
export const viewport = { width: 'device-width', initialScale: 1, maximumScale: 5, userScalable: true, viewportFit: 'cover', themeColor: '#fff6e0' };

export default function CrayonPage() {
  return <><KidsSeo id="crayon" /><CrayonClient /></>;
}
