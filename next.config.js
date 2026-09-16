/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  // Build-time only, no effect on the emitted app (2026-09-01, build-time pass).
  // ESLint used to run over the whole tree inside `next build` on every
  // deploy; the no-undef sweep and verify-all are the pre-push gate instead.
  eslint: { ignoreDuringBuilds: true },
  experimental: {
    // Run the server, client and edge webpack compilations in separate
    // workers instead of serially. Output is identical; only wall time moves.
    webpackBuildWorker: true,
    // Share cards (lib/og-stage-card.js) read their fonts off disk with a
    // computed path, which the file tracer cannot follow. Prerendered cards
    // never noticed; every card drawn on request (quizzes, circuits, players)
    // 500'd because the woff files were not in the function bundle.
    outputFileTracingIncludes: {
      '/**': [
        './node_modules/@fontsource/manrope/files/manrope-latin-600-normal.woff',
        './node_modules/@fontsource/manrope/files/manrope-latin-700-normal.woff',
        './node_modules/@fontsource/manrope/files/manrope-latin-800-normal.woff',
        './node_modules/@fontsource/dm-mono/files/dm-mono-latin-400-normal.woff',
        './node_modules/@fontsource/dm-mono/files/dm-mono-latin-500-normal.woff',
      ],
    },
  },
  images: {
    // Hero photos are referenced by remote URL (lib/hero-images.js) and
    // optimized/cached by the built-in image optimizer at request time.
    remotePatterns: [{ protocol: 'https', hostname: '**' }],
    // Hero URLs are immutable in practice: a hero is swapped by editing
    // lib/hero-images.js (a new URL, hence a new cache key), never by the
    // remote host changing the bytes behind an existing URL. The 60s default
    // therefore bought nothing and re-optimized the same photo all day. One
    // year. (2026-08-08, Vercel cost fix.)
    minimumCacheTTL: 31536000,
  },
  // mindloftdaily.com serves the same app as sourceoftruths.com during the soft launch, and
  // the share URLs and screenshot watermark now point at it so people learn the new address.
  //
  // It is NOT noindexed. Every page already declares alternates.canonical, and metadataBase
  // is still the old domain, so a page served from the new host emits a canonical pointing
  // back at sourceoftruths.com. Google therefore consolidates all ranking on the old domain
  // by itself. A blanket noindex would have been the blunter tool: it would also have stopped
  // shared links counting for anything at all.
  //
  // AT CUTOVER: flip metadataBase to the new domain (which flips every canonical with it) in
  // the same change that sets MOVE_ACTIVE, so the canonical and the redirect agree.
  async redirects() {
    return [
      // 2026-07-18: the Quizzes hub is now the site root (sourceoftruths.com).
      // The legacy /quizzes index 308s to it. Sub-pages (/quizzes/hub, etc.)
      // are matched exactly here, so they are unaffected.
      // Renamed 2026-07-06: the Crosslock word game relaunched as Crux (same
      // game, same puzzle #1). Old links 308 to the new home.
      {
        source: '/crosslock',
        destination: '/crux',
        permanent: true,
      },
      // Renamed 2026-08-03: the game is called Jesters, so /jester moved to
      // /jesters. Same game, same board numbering, same 'jester-M-D-YY' quiz
      // ids and leaderboards, and the PWA manifest id is deliberately left as
      // '/jester' so already-installed apps are not orphaned. Archive deep
      // links like /jester?p=23 308 across with the query string intact.
      {
        source: '/jester',
        destination: '/jesters',
        permanent: true,
      },
      // Renamed 2026-07-31: Park relaunched as Parker (same game, same board
      // numbering, same 'park-M-D-YY' quiz ids and leaderboards). Old links,
      // including archive deep links like /park?p=2, 308 to the new home. Next
      // carries the query string through, so ?p=N survives the hop.
      {
        source: '/park',
        destination: '/parker',
        permanent: true,
      },
      // /unpark was the name for about an hour on 2026-07-31 before it settled
      // on Parker. It was live and IndexNow-pinged, so it gets its own 308.
      {
        source: '/unpark',
        destination: '/parker',
        permanent: true,
      },
      // Renamed 2026-06-19: 'Inputs' rebranded to 'Experts and Aggregators'.
      // Old /sources and /inputs both 308 to the new path.
      {
        source: '/sources',
        destination: '/experts-and-aggregators',
        permanent: true,
      },
      {
        source: '/inputs',
        destination: '/experts-and-aggregators',
        permanent: true,
      },
      // Canonicalize host: 308 all www traffic to the apex domain. Fixes the
      // GSC "Duplicate without user-selected canonical" flag, where
      // www.sourceoftruths.com was serving duplicate 200 content. 2026-06-16.
      {
        source: '/:path*',
        has: [{ type: 'host', value: 'www.sourceoftruths.com' }],
        destination: 'https://sourceoftruths.com/:path*',
        permanent: true,
      },
      // Renamed 2026-06-10: legacy slug 'dive-bars-istanbul' (pre-rework dive-bar build) -> meyhanes
      {
        source: '/list/dive-bars-istanbul',
        destination: '/list/best-meyhanes-istanbul',
        permanent: true,
      },
      // Renamed 2026-06-09: "Best No-Budget Dinners in NYC" -> "Best Fine Dining Restaurants in NYC"
      {
        source: '/list/no-budget-dinners-nyc',
        destination: '/list/best-fine-dining-nyc',
        permanent: true,
      },
      // Renamed 2026-06-10: "Best No-Budget Dinners in London" -> "Best Fine Dining Restaurants in London"
      {
        source: '/list/no-budget-dinners-london',
        destination: '/list/best-fine-dining-london',
        permanent: true,
      },
      // Renamed 2026-06-10: "Best No-Budget Dinners in Paris" -> "Best Fine Dining Restaurants in Paris"
      {
        source: '/list/no-budget-dinners-paris',
        destination: '/list/best-fine-dining-paris',
        permanent: true,
      },
      // Renamed 2026-06-10: "Best No-Budget Dinners in Miami" -> "Best Fine Dining Restaurants in Miami"
      {
        source: '/list/no-budget-dinners-miami',
        destination: '/list/best-fine-dining-miami',
        permanent: true,
      },
      // Renamed 2026-06-10: "Best No-Budget Dinners in Tokyo" -> "Best Fine Dining Restaurants in Tokyo"
      {
        source: '/list/no-budget-dinners-tokyo',
        destination: '/list/best-fine-dining-tokyo',
        permanent: true,
      },
      // Renamed 2026-06-10: "Best No-Budget Dinners in Shanghai" -> "Best Fine Dining Restaurants in Shanghai"
      {
        source: '/list/no-budget-dinners-shanghai',
        destination: '/list/best-fine-dining-shanghai',
        permanent: true,
      },
      // Renamed 2026-06-10: "Best No-Budget Dinners in Toronto" -> "Best Fine Dining Restaurants in Toronto"
      {
        source: '/list/no-budget-dinners-toronto',
        destination: '/list/best-fine-dining-toronto',
        permanent: true,
      },
    ];
  },
};

module.exports = nextConfig;
