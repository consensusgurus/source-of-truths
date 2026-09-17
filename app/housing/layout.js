// Housing Watch: public US housing data and homebuilder health checks,
// served at mindloftdaily.com/housing. Data: lib/housing; refresh: /api/cron/housing.
import './housing.css';
import Nav from './_components/Nav';

export const metadata = {
  title: { default: 'Housing Watch', template: '%s | Housing Watch' },
  description: 'US housing data from permit to sale, plus health checks for public homebuilders, distributors and building products.',
  alternates: { canonical: '/housing' },
  openGraph: {
    title: 'Housing Watch',
    description: 'US housing data from permit to sale, plus health checks for public homebuilders, distributors and building products.',
    url: '/housing',
    type: 'website',
  },
  twitter: {
    card: 'summary',
    title: 'Housing Watch',
    description: 'US housing data from permit to sale, plus health checks for public homebuilders, distributors and building products.',
  },
};

export default function HousingLayout({ children }) {
  return (
    <div className="hw">
      <header className="site-header">
        <div className="wrap">
          <a className="brand" href="/housing">
            <span className="brand-mark" aria-hidden="true">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#111" strokeWidth="2.4">
                <path d="M2 12 L12 3 L22 12" /><path d="M5 10 V21 H19 V10" /><path d="M9 16 H15" />
              </svg>
            </span>
            <span className="brand-name">Housing Watch</span>
          </a>
          <Nav />
        </div>
      </header>
      <main className="wrap">{children}</main>
      <footer className="site-footer">
        <div className="wrap">
          <span>
            Sources: U.S. Census Bureau, National Association of Realtors, Zillow, Realtor.com, Redfin, Freddie Mac,
            S&amp;P Cotality Case-Shiller, and SEC filings, via FRED where available. Not investment advice.
          </span>
          <span className="mono">Housing Watch</span>
        </div>
      </footer>
    </div>
  );
}
