import KidsHubClient from './KidsHubClient';
import { kidsMetadata } from '@/lib/kids-seo';
import KidsSeo from './KidsSeo';

export const metadata = kidsMetadata('kids');

// The browser chrome (address bar, installed-app cap) takes the kids butter
// ground, not the site navy; see html:has(.kd) in app/globals.css.
export const viewport = { width: 'device-width', initialScale: 1, maximumScale: 5, userScalable: true, viewportFit: 'cover', themeColor: '#fff6e0' };

export default function KidsPage() {
  return <><KidsSeo id="kids" /><KidsHubClient /></>;
}
