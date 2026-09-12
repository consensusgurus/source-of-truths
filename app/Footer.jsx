'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';
import { T } from '@/lib/theme';
import DailyRoster from './DailyRoster';

// Shared, site-wide footer. Deliberately font/brand-neutral (it inherits the
// surrounding page's body font and uses neutral grays) so it reads correctly on
// BOTH the cream list/home pages and the blue quiz pages. No heavy accent color.
const NEUTRAL = {
  ink: T.ink,
  muted: T.muted,
  soft: T.muted,
  line: 'rgba(20,22,28,0.12)',
};

// THE COLUMNS ARE EXPORTED, and this is the one copy of them. The stage home
// (app/today/StageToday.jsx) draws its own footer, because this one is
// near-black ink on a light hairline and disappears on the stage's dark
// register, but there is no version of the site where the home should offer
// DIFFERENT links from every other page. So the drawing is duplicated and the
// map is not: add a link here and both footers get it.
export const FOOTER_COLS = [
  {
    head: 'Puzzles & Quizzes',
    links: [
      { label: 'Browse Puzzles & Quizzes', href: '/' },
      // The full index. This link is the crawl path to the whole quiz catalogue, so it
      // must stay on a server-rendered surface: see lib/quiz-catalog.js.
      { label: 'All Quizzes A-Z', href: '/quizzes/all' },
      // Same job for the circuits: /circuits is the only crawlable path to the
      // fifteen /circuits/<id> pages, and through them a second path into every
      // daily game. It is also where a reader who arrived on one shared circuit
      // finds the other fourteen.
      { label: 'Circuits', href: '/circuits' },
      { label: 'Stat Hub', href: '/quizzes/hub' },
      { label: 'Community Leaderboard', href: '/quizzes/community' },
      { label: 'Request a Quiz', href: '/request' },
      // The kids track. Nothing inside /kids links back out except its own
      // footer line, so this is the one path a grown-up uses to find it.
      { label: 'Mind Loft Kids', href: '/kids' },
    ],
  },
  {
    head: 'Lists',
    links: [
      { label: 'Browse Lists', href: '/lists' },
      { label: 'Activity Log', href: '/feed' },
      { label: 'Experts and Aggregators', href: '/experts-and-aggregators' },
      { label: 'Request a List', href: '/request' },
    ],
  },
  {
    head: 'Sports Rankings',
    links: [
      { label: 'College Football Consensus Rankings', href: '/collegefootballrankings' },
      { label: 'NFL Consensus Rankings', href: '/nflrankings' },
      { label: 'MLB Consensus Rankings', href: '/mlbrankings' },
    ],
  },
  {
    head: 'Follow',
    links: [
      { label: 'Instagram', href: 'https://www.instagram.com/mindloftdaily/', external: true },
      { label: 'X', href: 'https://x.com/mindloftdaily', external: true },
    ],
  },
  {
    head: 'Legal',
    links: [
      { label: 'Privacy', href: '/privacy' },
      { label: 'Terms', href: '/terms' },
      { label: 'Disclosure', href: '/disclosure' },
    ],
  },
];

export default function Footer() {
  const year = new Date().getFullYear();
  const [vis, setVis] = useState(null);
  useEffect(() => {
    let on = true;
    fetch('/api/visitors').then((r) => r.json()).then((d) => { if (on && d && typeof d.visitors === 'number') setVis(d.visitors); }).catch(() => {});
    return () => { on = false; };
  }, []);
  return (
    <footer
      style={{
        borderTop: `1px solid ${NEUTRAL.line}`,
        marginTop: 30,
        padding: '26px 24px 20px',
        position: 'relative',
        zIndex: 2,
        background: 'transparent',
        color: NEUTRAL.ink,
      }}
    >
      <div
        style={{
          maxWidth: 1040,
          margin: '0 auto',
          display: 'flex',
          flexWrap: 'wrap',
          gap: 28,
          justifyContent: 'space-between',
        }}
      >
        <div style={{ maxWidth: 250 }}>
          <div style={{ fontSize: 15, fontWeight: 800 }}>Mind Loft</div>
          <div style={{ fontSize: 12, color: NEUTRAL.muted, marginTop: 5, lineHeight: 1.5 }}>
            Sharpen your mind: daily puzzles, quizzes, and consensus Top 10 Lists for everything worth knowing.
          </div>
          {/* The crawl path to /about. It sits under the brand blurb rather than in
              the Legal column because it is not a legal page: it is the page that
              tells a reader, and a search engine, what Mind Loft is. */}
          <Link href="/about" style={{ display: 'inline-block', marginTop: 8, fontSize: 12.5, fontWeight: 700, color: NEUTRAL.ink, textDecoration: 'none' }}>
            About Mind Loft
          </Link>
          {vis != null && (<div style={{ fontSize: 11.5, color: NEUTRAL.soft, marginTop: 10 }}>{vis.toLocaleString()} visitors</div>)}
        </div>
        {FOOTER_COLS.map((col) => (
          <div key={col.head}>
            <div
              style={{
                fontSize: 10,
                fontWeight: 700,
                letterSpacing: '.06em',
                textTransform: 'uppercase',
                color: NEUTRAL.soft,
                marginBottom: 9,
              }}
            >
              {col.head}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {col.links.map((l) => (
                l.external ? (
                  <a
                    key={l.label}
                    href={l.href}
                    target="_blank"
                    rel="noopener"
                    style={{ fontSize: 12.5, color: NEUTRAL.muted, textDecoration: 'none' }}
                  >
                    {l.label}
                  </a>
                ) : (
                  <Link
                    key={l.label}
                    href={l.href}
                    style={{ fontSize: 12.5, color: NEUTRAL.muted, textDecoration: 'none' }}
                  >
                    {l.label}
                  </Link>
                )
              ))}
            </div>
          </div>
        ))}
      </div>
      <div style={{ maxWidth: 1040, margin: '0 auto' }}><DailyRoster variant="light" /></div>
      <div
        style={{
          maxWidth: 1040,
          margin: '16px auto 0',
          paddingTop: 14,
          borderTop: `1px solid ${NEUTRAL.line}`,
          display: 'flex',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 8,
          fontSize: 11,
          color: NEUTRAL.soft,
        }}
      >
        <span>© {year} Mind Loft</span>
        <span>As an Amazon Associate, Mind Loft earns from qualifying purchases.</span>
      </div>
    </footer>
  );
}
