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
      // Every past board of every daily, by game and by day (owner, 2026-10-09).
      // Replaced /daily, which 308s here.
      { label: 'Puzzle Archive', href: '/archive' },
      // How-to guides for the genres people search by name (owner, 2026-11-25).
      // This is the hub's crawl path from every page; see lib/guides.js.
      { label: 'Puzzle Guides', href: '/guides' },
      // NYT Games, Sporcle and Puzzmo alternatives (owner, 2026-11-28). The hub's
      // crawl path from every page; see lib/alternatives.js.
      { label: 'Puzzle Site Alternatives', href: '/alternatives' },
      // Every Jig photo so far, a box a day (owner, 2026-10-16).
      { label: 'Jigsaw Puzzles', href: '/jig/shelf' },
      { label: 'Make a Jigsaw From Your Photo', href: '/jigsaw/make-your-own' },
      // Every past gauntlet question and problem, by topic (owner, 2026-11-21).
      { label: 'Trivia Database', href: '/trivia-questions' },
      { label: 'Math Database', href: '/math-questions' },
      { label: 'English Database', href: '/english-questions' },
      { label: 'Science Database', href: '/science-questions' },
      // The full index. This link is the crawl path to the whole quiz catalogue, so it
      // must stay on a server-rendered surface: see lib/quiz-catalog.js.
      // Same job for the circuits: /circuits is the only crawlable path to the
      // fifteen /circuits/<id> pages, and through them a second path into every
      // daily game. It is also where a reader who arrived on one shared circuit
      // finds the other fourteen.
      { label: 'Runs', href: '/circuits' },
      // The trivia IQ tests. /iq is linked from nowhere else, so this is its crawl path.
      { label: 'IQ and School Tests', href: '/tests' },
      { label: 'Stat Hub', href: '/quizzes/hub' },
      { label: 'Request a Quiz', href: '/request' },
      // The kids track. Nothing inside /kids links back out except its own
      // footer line, so this is the one path a grown-up uses to find it.
      { label: 'Mind Loft Kids', href: '/kids' },
    ],
  },
  // THE COMMUNITY COLUMN (owner, 2026-11-18, "Where To Link" spot 6): it
  // replaced the single Community Leaderboard link above.
  {
    head: 'Community',
    links: [
      { label: 'The Commons', href: '/community' },
      { label: 'Post-Game Talk', href: '/community/talk' },
      { label: 'Idea Board', href: '/community/ideas' },
      { label: 'Groups', href: '/community/groups' },
      { label: 'Loft Shop', href: '/community/shop' },
      { label: 'Puzzle Peers', href: '/community/peers' },
      { label: 'Community Leaderboard', href: '/quizzes/community' },
    ],
  },
  // MIND LOFT AND COGNITIVE HEALTH (owner, 2026-11-26): research articles on
  // puzzles, reading, jigsaws, games, and the brain (lib/cognitive-health.js).
  // Written out here, not imported, because this footer ships to every page's
  // client bundle and the articles are long. Labels and order must match
  // FOOTER_ARTICLES; scripts/verify-cognitive-health.mjs checks it.
  {
    head: 'Mind Loft and Cognitive Health',
    links: [
      { label: 'All Articles', href: '/cognitive-health' },
      { label: 'Do Puzzles Keep Your Brain Sharp?', href: '/cognitive-health/do-puzzles-keep-your-brain-sharp' },
      { label: 'Crosswords and Memory', href: '/cognitive-health/crosswords-and-memory' },
      { label: 'Jigsaw Puzzles and the Brain', href: '/cognitive-health/jigsaw-puzzles-and-the-brain' },
      { label: 'Reading and Brain Health', href: '/cognitive-health/reading-and-brain-health' },
      { label: 'Puzzles and Games for Kids', href: '/cognitive-health/puzzles-and-games-for-kids' },
      { label: 'Brain Training and the ACTIVE Trial', href: '/cognitive-health/brain-training-and-the-active-trial' },
      { label: 'The 14 Dementia Risk Factors', href: '/cognitive-health/dementia-risk-factors' },
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
          <Link href="/about-me" style={{ display: 'block', marginTop: 6, fontSize: 12.5, fontWeight: 700, color: NEUTRAL.ink, textDecoration: 'none' }}>
            About Me
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
        <span>© {year} Mind Loft™</span>
        <span>As an Amazon Associate, Mind Loft earns from qualifying purchases.</span>
      </div>
    </footer>
  );
}
