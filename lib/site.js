// The canonical origin, in ONE place.
//
// Three things must always agree about which host is canonical: the sitemap, robots.txt,
// and metadataBase (which every page's alternates.canonical resolves against). If they
// disagree even briefly, Google sees a site that points at two different homes and the
// Change of Address filing at cutover is undermined.
//
// Every canonical, sitemap entry, robots directive and JSON-LD id resolves from this one
// value across 61 files, which is what made the cutover a single line.
//
// CUTOVER HAPPENED 2026-08-04: SITE_URL moved here and MOVE_ACTIVE=1 was set on Vercel at
// the same time, so sourceoftruths.com now 308s to this host carrying the identity handoff.
// SITE_URL and SHARE_URL are the same host from here on; SHARE_URL is kept only so its three
// consumers need not change, and can be collapsed into SITE_URL whenever convenient.
export const SITE_URL = 'https://mindloftdaily.com';
// The Sports Ranking pages (/collegefootballrankings, /nflrankings) are a Source of Truths
// property and are CANONICAL ON THE OLD HOST (owner decision, 2026-08-28). middleware.js
// exempts those two paths from the 308, so the old domain serves them instead of redirecting,
// and their canonical + sitemap entries both point here so the two signals agree.
//
// ⚠️ This is a deliberate exception to the rule stated at the top of this file, and it does
// cut against the Change of Address filed at cutover: the old property now tells Google "I
// moved" for every path except two. Watch those two URLs in Search Console. If Google keeps
// folding them into mindloftdaily.com anyway, the fix is to drop this and let them live on
// the new host with Source of Truths branding, which costs nothing but the URL.
export const SOT_URL = 'https://sourceoftruths.com';
// 2026-11-17: the Sports Ranking pages were removed from the site (owner). No path is
// exempt any more, so every old-host request 308s to the new host, where next.config.js
// redirects the three retired paths to the home.
export const SOT_PATHS = [];

export const SITE_HOST = SITE_URL.replace(/^https?:\/\//, '');

// The host readers SHARE and see printed on Mind Loft share cards. The public face of the
// rebrand moved ahead of the SEO cutover: mindloftdaily.com already serves the app and every
// daily game's share text points at it, so referral links, campaign links, and the quiz /
// player card footers use this while SITE_URL above stays canonical until the redirect exists.
// At cutover the two become the same value and this one can be collapsed into SITE_URL.
// NOT for the Source of Truths list posters, which keep the old host with the old brand.
export const SHARE_URL = 'https://mindloftdaily.com';
export const SHARE_HOST = SHARE_URL.replace(/^https?:\/\//, '');
