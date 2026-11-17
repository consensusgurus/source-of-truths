import AboutMe from './AboutMe';
import PageViewBeacon from '../PageViewBeacon';

const DESC = 'A note from Marshall Mentz, who built and runs Mind Loft from Boston, on why the site exists.';

export const metadata = {
  title: 'About Me | Mind Loft',
  description: DESC,
  alternates: { canonical: '/about-me' },
  openGraph: { title: 'About Me · Mind Loft', description: DESC, url: '/about-me', type: 'website', siteName: 'Mind Loft' },
};

export default function Page() {
  return (
    <>
      <PageViewBeacon id="about-me" />
      <AboutMe />
    </>
  );
}
