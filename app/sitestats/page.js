import SiteStatsClient from './SiteStatsClient';

// A quick-reference, mobile-first traffic dashboard. Public but kept out of
// search indexes (it is an at-a-glance internal view, not a content page).
export const metadata = {
  title: 'Site Stats: Mind Loft',
  description: 'Live quiz and traffic overview for Mind Loft.',
  robots: { index: false, follow: false },
  alternates: { canonical: '/sitestats' },
};

export const dynamic = 'force-dynamic';

export default function SiteStatsPage() {
  return <SiteStatsClient />;
}
