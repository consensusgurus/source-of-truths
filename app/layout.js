// app/layout.js - ROOT LAYOUT WITH UPDATED METADATA

import './globals.css';
import { Analytics } from '@vercel/analytics/next';
import VisitorBeacon from './VisitorBeacon';
import ResultQueue from './ResultQueue';
import DailyStartPing from './DailyStartPing';
import DailySaveSync from './DailySaveSync';
import TrophyPop from './TrophyPop';
import ThanksPop from './ThanksPop';
import EmailTicketPop from './EmailTicketPop';
import { PriceCheckItemsGlobal } from './pricecheck/ItemsPop';
import ChunkReload from './ChunkReload';
import HydrationMark from './HydrationMark';
import { getAllSources } from '@/lib/sources';
import { T } from '@/lib/theme';
import { SITE_URL } from '@/lib/site';
import { DAILY_GAMES } from '@/lib/daily-games';
import { SUDOKU_POOL } from '@/lib/circuits';
import { softGround, gameColor } from '@/lib/category-ramp';

// Every daily's route, for the Layout C reserve script below.
const LC_ROUTES = JSON.stringify(Array.from(new Set(DAILY_GAMES.map((g) => g.href || '/' + g.key))));
// THE PHONE STAGE REGISTER, STAMPED BEFORE FIRST PAINT (owner, 2026-10-24:
// "make the loading screen consistent with the new styling, greatly
// simplified"). The sudokus and End Game titles play on the soft category
// ground on a phone, but the register used to arrive in an effect, so every
// THE DESKTOP TOO (owner, 2026-10-26): the desktop's tone register (data-stage-tone)
// used to arrive after hydration, so a puzzle opened from the home painted its old
// colours and board for a beat and then jumped. The script sets it before paint now.
// load first painted the old full cap and page. The route map below lets the
// boot script set data-stage-pastel, the look and the ground before the body
// exists; app/SudokuPastel.jsx then takes it over unchanged.
const PASTEL_SKIP = ['pricer', 'dealer', 'realtor', 'agent', 'curator', 'passport'];   // no StageChrome
const PASTEL_ROUTES = JSON.stringify(Object.fromEntries(DAILY_GAMES
  .filter((g) => !PASTEL_SKIP.includes(g.key))
  .map((g) => [g.href || '/' + g.key, softGround(SUDOKU_POOL.includes(g.key) ? '#a5b4fc' : gameColor(g.key))])));

const SOURCE_COUNT = getAllSources().length;

export const metadata = {
  metadataBase: new URL(SITE_URL),
  // Listdle creator verification (listdle.com/account/creator). Must be on the base URL.
  verification: { other: { 'listdle-verification': '36f39183-d6f8-4d67-9bd5-e10615a4a459' } },
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
    images: [{ url: '/og/brand.png?v=20261012', width: 1200, height: 630, alt: 'Mind Loft: Sharpen your mind. Gain IQ points. Elevate your thinking.' }],
    title: `Mind Loft | Sharpen Your Mind`,
    description: `Daily puzzles and quizzes to sharpen your brain. Word, number and logic puzzles, plus 1,000+ timed quizzes across films, music, geography, sports, and brands. Then browse consensus Top 10 Lists where ${SOURCE_COUNT} experts and aggregators agree on the best restaurants, hotels, products, films, and books.`,
    url: `${SITE_URL}`,
    type: 'website',
  },
  twitter: {
    images: ['/og/brand.png?v=20261012'],
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
  description: `A free daily puzzle site: word, number and logic puzzles, crosswords, sudoku and chess, plus 1,000+ timed quizzes, and consensus Top 10 Lists drawn from ${SOURCE_COUNT} experts and aggregators.`,
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
        <script dangerouslySetInnerHTML={{ __html: "(function(){try{var d=document.documentElement,q=null;try{q=new URLSearchParams(window.location.search).get('theme')}catch(e){}var t=(q==='light'||q==='dark')?q:window.localStorage.getItem('sot_theme2');if(t!=='light'&&t!=='dark')t='light';d.setAttribute('data-stage-boot',t);var c=null;try{c=new URLSearchParams(window.location.search).get('color')}catch(e){}if(c!=='balanced'&&c!=='full'&&c!=='mono')c=window.localStorage.getItem('sot_color1');if(c!=='full'&&c!=='mono')c='balanced';d.setAttribute('data-stage-color',c)}catch(e){}})();" }} />
        {/* LAYOUT C RESERVES ITS SPACE BEFORE FIRST PAINT (owner, 2026-10-10:
            moving from the home page to a game page jittered). The desktop
            frame (app/LayoutC.jsx) is client-only and loads after the board
            has painted, so the board painted full width and then jumped when
            the frame attached. On a daily's route, at the same widths and with
            the same ?layout= rules LayoutC uses, this stamps lc-pre on <html>,
            and globals.css pads the game root exactly as the frame will. The
            cap height is the reader's last measured one (LayoutCInner keeps
            it), so even that does not move. Blocking and inline for the same
            reason as the register stamp above. */}
        {/* THE LANDING (owner, 2026-10-25): a page reached through a tile flood
            opens under the flood's colour and fades it off, so the header and
            board come up through it. lib/tile-flood.js writes sot_land just
            before it navigates; html[data-sot-land] in globals.css paints it. */}
        <script dangerouslySetInnerHTML={{ __html: "(function(){try{var S=window.sessionStorage,v=S.getItem('sot_land');if(!v)return;S.removeItem('sot_land');var o=JSON.parse(v),p=location.pathname.replace(/\\/+$/,'')||'/';if(!o||o.p!==p||!(Date.now()-o.t<5000)||!/^#[0-9a-f]{3,8}$/i.test(o.c))return;var d=document.documentElement;d.style.setProperty('--sot-land',o.c);d.setAttribute('data-sot-land','');setTimeout(function(){d.removeAttribute('data-sot-land')},900)}catch(e){}})();" }} />
        <script dangerouslySetInnerHTML={{ __html: "(function(){try{var M=" + PASTEL_ROUTES + ",p=location.pathname.replace(/\\/+$/,'')||'/',g=M[p];if(!g)return;var ph=window.matchMedia('(max-width: 899px)').matches;var d=document.documentElement,S=window.localStorage,K=['color','tint','plain','darktint','dark'],l=S.getItem('sot_gstage_look2');if(K.indexOf(l)<0){l=S.getItem('sot_gstage_look1');if(l==='color')l=null}if(K.indexOf(l)<0)l=window.localStorage.getItem('sot_theme2')==='dark'?'darktint':'tint';l=(l==='dark'||l==='darktint')?'darktint':'tint';d.setAttribute(ph?'data-stage-pastel':'data-stage-tone',l);d.setAttribute('data-stage-boot','light');d.style.setProperty('--sp-g',g)}catch(e){}})();" }} />
        <script dangerouslySetInnerHTML={{ __html: "(function(){try{var R=" + LC_ROUTES + ",p=location.pathname.replace(/\\/+$/,'')||'/';if(R.indexOf(p)<0)return;var q=null;try{q=new URLSearchParams(location.search).get('layout')}catch(e){}var w=window.innerWidth;if(q==='off'||!(w>=1280||(q==='c'&&w>=1100)))return;var d=document.documentElement;d.classList.add('lc-pre');d.classList.add('lc-focus');var h=parseInt(window.localStorage.getItem('sot_lc_hh'),10);if(h>30&&h<200)d.style.setProperty('--lc-hh',h+'px')}catch(e){}})();" }} />
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
          href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;700&display=swap"
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
        {/* Holds the gate and board invisible until the page has read its
            own state (app/HydrationMark.jsx, rule in globals.css). */}
        <HydrationMark />
        <noscript><style>{'.stage-page .stg-gate,.stage-page .stg-board,[data-sot-wait] > *{visibility:visible !important}'}</style></noscript>
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
        {/* Owner-approved (2026-10-04): the thank-you + share pop-up. Once on
            return for existing players (with share credit), once after a
            finished game for everyone. Never inside a run. app/ThanksPop.jsx. */}
        <ThanksPop />
        {/* The $100 drawing pop-up (app/DrawingPop.jsx) was retired 2026-10-17
            (owner): it showed up mid-game and stacked on the run pop-ups. */}
        {/* Owner-approved (2026-10-02): the Price Check items pop-up opens ten
            seconds after a run ends on whatever page the player is on. It fires
            only for a run just finished on this device. app/pricecheck/ItemsPop.jsx. */}
        <PriceCheckItemsGlobal />
        {/* Owner-approved (2026-10-21): offers a $500 drawing ticket to players
            with no email on file. Never while a puzzle is being played, never
            over another dialog, hidden 3 days on dismissal. app/EmailTicketPop.jsx. */}
        <EmailTicketPop />
        {/* Reloads once when a hashed chunk from a superseded deployment fails to
            load. See app/ChunkReload.jsx and app/error.js (2026-09-23). */}
        <ChunkReload />
        <Analytics />
      </body>
    </html>
  );
}
