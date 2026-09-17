// app/layout.js - ROOT LAYOUT WITH UPDATED METADATA

import './globals.css';
import { Analytics } from '@vercel/analytics/next';
import VisitorBeacon from './VisitorBeacon';
import ResultQueue from './ResultQueue';
import DailyStartPing from './DailyStartPing';
import DailySaveSync from './DailySaveSync';
import TrophyPop from './TrophyPop';
import { getAllSources } from '@/lib/sources';
import { T } from '@/lib/theme';
import { SITE_URL } from '@/lib/site';

const SOURCE_COUNT = getAllSources().length;

export const metadata = {
  metadataBase: new URL(SITE_URL),
  // The manifest link points at the token-minting route (PWA identity handoff;
  // see /api/pwa-manifest). It must be set HERE, in server metadata: Next owns
  // the rendered <link> through React, so any client-side rewrite of its href
  // is reverted at hydration (that killed both earlier attempts, a post-load
  // swap and a parse-time inline script). Next emits crossorigin=use-credentials
  // on manifest links itself, which is what puts the sot_vid cookie on the
  // manifest fetch. Game pages override this with ?game=<key> in their own
  // metadata; a new game page must do the same, never a static .webmanifest.
  manifest: '/api/pwa-manifest',
  appleWebApp: { capable: true, statusBarStyle: 'black-translucent', title: 'Mind Loft' },
  title: `Mind Loft | Sharpen Your Mind`,
  description: `Daily puzzles and quizzes to sharpen your brain. Word, number and logic puzzles, plus 1,000+ timed quizzes across films, music, geography, sports, and brands. Then browse consensus Top 10 Lists where ${SOURCE_COUNT} experts and aggregators agree on the best restaurants, hotels, products, films, and books.`,
  openGraph: {
    title: `Mind Loft | Sharpen Your Mind`,
    description: `Daily puzzles and quizzes to sharpen your brain. Word, number and logic puzzles, plus 1,000+ timed quizzes across films, music, geography, sports, and brands. Then browse consensus Top 10 Lists where ${SOURCE_COUNT} experts and aggregators agree on the best restaurants, hotels, products, films, and books.`,
    url: `${SITE_URL}`,
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: `Mind Loft | Sharpen Your Mind`,
    description: `Daily puzzles and quizzes to sharpen your brain. Word, number and logic puzzles, plus 1,000+ timed quizzes across films, music, geography, sports, and brands. Then browse consensus Top 10 Lists where ${SOURCE_COUNT} experts and aggregators agree on the best restaurants, hotels, products, films, and books.`,
  },
formatDetection: {
    telephone: false,
  },
};

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  viewportFit: 'cover', themeColor: T.accent,
};

const websiteJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'WebSite',
  name: 'Mind Loft',
  alternateName: 'Mind Loft Daily',
  url: `${SITE_URL}`,
  description: `Daily word, number and logic puzzles plus 1,000+ timed quizzes, and consensus Top 10 Lists drawn from ${SOURCE_COUNT} experts and aggregators.`,
};

const organizationJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'Organization',
  name: 'Mind Loft',
  alternateName: 'Mind Loft Daily',
  url: `${SITE_URL}`,
  logo: `${SITE_URL}/icon.png`,
  sameAs: [
    'https://x.com/mindloftdaily',
    'https://www.instagram.com/mindloftdaily/',
  ],
  description: `Daily puzzles and quizzes, plus consensus Top 10 Lists scored from ${SOURCE_COUNT} expert and reader sources using Borda methodology.`,
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* Card attribution. Deliberately NOT in the metadata export: a route that defines
            its own `twitter` block replaces the parent's entirely, and 52 routes do, so
            these would disappear nearly everywhere. */}
        <meta name="twitter:site" content="@mindloftdaily" />
        <meta name="twitter:creator" content="@mindloftdaily" />
        {/* THE REGISTER IS STAMPED BEFORE FIRST PAINT (owner, 2026-09-02: a
            daily "flashes in light mode for a second upon load"). A stage page
            carries data-stage-theme on its own root DIV, and the server cannot
            know what is in localStorage, so that attribute is rendered as the
            DEFAULT and corrected in an effect after hydration. Light is the
            default, so a reader who chose dark paints one light frame on every
            single load. lib/stage-theme.js documented that as the price of the
            default moving; this is what it cost, and it is not worth paying.

            This runs before the body exists, stamps the resolved register on
            <html> as data-stage-boot, and globals.css suppresses the light
            token block while that reads 'dark'. So the flash window renders in
            the register the reader actually chose, and the moment React
            resolves, the div's own attribute takes over exactly as before.
            NOTHING is written back to storage and no preference is changed.
            Blocking and inline on purpose: deferred or hydrated is a frame too
            late, which is the whole bug. It reads the same order readStageTheme
            does, so the two can never disagree about what was asked for, and
            writeStageTheme keeps the attribute in step from here on, or a
            reader who switches TO light would stay suppressed in dark. */}
        <script dangerouslySetInnerHTML={{ __html: "(function(){try{var d=document.documentElement,q=null;try{q=new URLSearchParams(window.location.search).get('theme')}catch(e){}var t=(q==='light'||q==='dark')?q:window.localStorage.getItem('sot_theme2');if(t!=='light'&&t!=='dark')t='light';d.setAttribute('data-stage-boot',t)}catch(e){}})();" }} />
        <script
          async
          src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-6094189268309966"
          crossOrigin="anonymous"
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationJsonLd) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteJsonLd) }}
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Fraunces:ital,wght@0,400;0,700;0,900;1,400;1,700&display=swap"
          rel="stylesheet"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=DM+Mono:wght@300;400;500&family=DM+Sans:wght@400;500;700&display=swap"
          rel="stylesheet"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Manrope:wght@400;500;600;700;800&display=swap"
          rel="stylesheet"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=DM+Serif+Display:ital@0;1&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        {children}
        <VisitorBeacon />
        <ResultQueue />
        <DailyStartPing />
        {/* Mounted AFTER DailyStartPing, which also wraps localStorage.setItem.
            The wrappers chain (each binds whatever setItem it found), so the
            order is not load-bearing, but keeping the marker before the board
            it belongs to reads correctly. */}
        <DailySaveSync />
        {/* NO POP-UPS HERE ANY MORE (owner, 2026-08-30). The contest
            interstitial, its QR poster follow-on and the share sheet were all
            mounted on this line and all came off together: the Trivia Gauntlet
            nudge on /today is the one thing left on the site that appears
            without being asked for. TrophyPop stays because it is a reward for
            something the player just did rather than a pitch, and it fires only
            on an actual unlock. Anything added back here needs the owner's word
            first. */}
        <TrophyPop />
        <Analytics />
      </body>
    </html>
  );
}
