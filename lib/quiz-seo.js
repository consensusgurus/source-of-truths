// WHICH QUIZZES ARE INDEXABLE (Search Console pass, 2026-09-20).
//
// WHY. The quiz segment submitted 1,853 URLs. Over 90 days 206 of them earned a
// single impression between them and the whole segment earned 12 clicks, while
// 136 of the site's 175 "Duplicate without user-selected canonical" pages were
// /quiz/ URLs. Until 2026-09-17 every quiz page server-rendered an empty
// Suspense fallback (see QuizStageShell), so Google saw ~1,850 identical bodies
// and clustered them; the shell fixed the render, but a page whose unique text
// is a title plus a blurb is still thin, and 1,600 of them were spending the
// crawl budget of the pages that do convert.
//
// THE RULE. A quiz stays indexable when it has either DEMAND or INVESTMENT:
//   observed  it earned at least one impression in the 90 days to 2026-09-20
//   heroed    it carries a curated hero (lib/quiz-heroes.js QUIZ_HEROES)
//   qotd      it is in the Quiz of the Day pool or an override
//   company   it is a company earnings quiz (lib/company-quiz-meta.js)
//   business  it is a Business News hub quiz (news recap, earnings, sector)
// Everything else renders robots noindex,follow and is dropped from the
// sitemap. noindex rather than a 404 or a redirect: the page is real and worth
// playing, it just should not compete for crawl budget. follow so the links on
// it still flow.
//
// IT IS NOT A BLOCKLIST AND NOT PERMANENT. Hero a quiz, put it in the QOTD pool
// or give it real content and it comes back. To refresh the observed set, read
// the /quiz/ rows out of the Search Console page report over 90 days, keep the
// slugs (dropping dated daily-game stubs, which canonicalize to their game
// page), and replace OBSERVED below.
//
// Do NOT re-inline this filter at a call site. lib/sitemap-entries.js and
// app/quiz/[id]/page.js both read quizIndexable(), so a sitemapped quiz URL
// cannot exist without an indexable page behind it, which is the same
// invariant lib/quiz-catalog.js exists to keep.

// Search Console, 90 days to 2026-09-20: every /quiz/ URL with >= 1 impression.
const OBSERVED = ["worst-all-time-win-percentage-big-four","abbott-elementary-character-match","name-the-151-pokemon","college-towns-america","name-the-european-city-from-satellite","name-the-gemstone","fill-in-the-blank-book-titles-pt-1","nfl-career-history","match-brand-to-famous-product","countries-that-start-with-u","largest-countries-europe-land-area","nfl-head-coach-career-wins","largest-ski-areas-north-america","scifi-novel-to-author-typed","mlb-stolen-base-leaders","most-populous-cities-virginia","countries-that-start-with-l","name-the-city-from-the-photo-1","higher-or-lower-movie-box-office-2","largest-canadian-cities","intel-2q26-earnings-quiz","largest-cities-world-by-skyline","countries-of-asia-alphabetical","best-selling-christmas-songs","opening-lines-3-typed","most-consumed-beverages-world","airport-code-to-city-typed","lsat-logic-game-gallery-wall","countries-of-africa","match-invention-to-inventor","top-grossing-denzel-washington-movies","heaviest-animals-earth","nfl-coach-team-2026-typed","scientist-to-field-bank","opening-lines","match-actor-to-oscar-role-typed","girl-scout-cookies","top-grossing-tom-hanks-movies","match-element-to-symbol","name-every-serie-a-club","match-brand-to-founder-typed","most-nba-mvp-awards","closest-countries-to-the-north-pole","arrested-development-character-match","largest-countries-africa-land-area","closest-countries-to-bora-bora","character-to-author-typed","name-the-zodiac-signs","match-airline-alliance-to-member-typed","match-logo-to-company-typed","marvel-infinity-stones","best-selling-albums-21st-century","match-bridge-to-city-typed","most-emmy-awards-performer","every-best-picture-winner","match-the-taylor-swift-song-to-its-album","athlete-sponsor-brand-typed","name-the-candy-bar-from-the-cross-section","company-slogans","name-every-nfl-team","nba-rebounds-leaders","nhl-scoring-leaders","airport-code-to-city","nba-starters-2015-warriors","films-most-oscar-wins","gaming-console-to-launch-game-typed","match-civilization-to-region","name-the-city-from-its-metro-map","ballon-dor-by-year","name-the-18-pokemon-types","match-brand-to-mascot-typed","name-the-continent-part-4","match-rapper-hometown","most-profitable-companies","best-selling-cars-all-time","match-cocktail-to-spirit","match-tree-type","match-beer-style-to-origin","most-streamed-tv-shows-netflix","seven-summits","best-picture-by-year","match-planet-position","match-prop-to-movie","nfl-coach-team-2026","best-mlb-teams","name-the-state-from-its-quarter","highest-grossing-console-video-games","smash-bros-64-original-roster","match-empire-to-capital","actors-most-oscar-nominations","match-book-series-to-author-typed","match-band-genre","top-grossing-film-franchises","best-selling-books","24-character-match","paypal-2q26-earnings-quiz","match-the-homeland-character","largest-cities-asia","animal-to-classification-bank-typed","top-grossing-arnold-schwarzenegger-movies","sb-starters-2009-steelers","most-populous-cities-florida","match-soda-to-maker","boston-landmarks-geo-guesser","nfl-stadiums-oldest-to-newest","match-console-to-maker","closest-countries-to-sagrada-familia","companies-to-headquarters-pt5-typed","a24-films","best-selling-liquor-brands-world","highest-grossing-superhero-films","country-to-largest-city","dc-landmarks-geo-guesser","match-poem-to-poet-typed","closest-countries-to-big-ben","name-the-company-from-its-ceo-2","best-beaches-us","top-grossing-russell-crowe-movies","match-invention-to-century-typed","match-mineral-hardness","largest-companies-market-cap","ski-resort-to-state-or-country","match-album-to-band-typed","most-populous-cities-colorado","nolan-every-feature-film","longest-running-scripted-tv-series","scifi-novel-to-author","name-the-3d-zelda-games","match-detective-to-sidekick-typed","nato-phonetic-alphabet","countries-longest-coastlines","most-emmy-wins-single-show","name-the-members-of-bts","flags-of-africa","higher-or-lower-country-population-3","match-the-silicon-valley-character","most-abundant-elements-universe","most-pga-tour-wins","us-states-most-to-least-populous","sb-starters-2010-saints","nfl-super-bowl-wins-by-franchise","most-expensive-movies","country-to-official-language-typed","gaming-console-to-launch-game","match-app-to-parent-company-typed","match-detective-to-author","companies-to-headquarters-pt10-typed","key-west-geo-guesser","loudest-college-football-stadiums","top-grossing-tom-cruise-movies","countries-most-neighbors","match-director-to-debut-film","companies-to-headquarters-pt12-typed","daily-business-quiz-2026-06-18","nba-assists-leaders","best-selling-sports-video-games","companies-to-headquarters-pt14","companies-to-headquarters-pt15-typed","find-the-lower-48-states","largest-coffee-producing-countries","london-landmarks-geo-guesser-pt-1","match-cocktail-to-spirit-typed","match-monument-to-country-typed","name-all-48-crayola-colors","race-distance-typed","caribbean-no-outline","match-spy-film-to-agency-typed","most-populous-cities-arkansas","nyc-restaurant-geo-guesser-pt-3","which-earned-more-movies-adjusted-1","company-founder-5","match-banned-book-to-author","match-treaty-to-war","name-the-dish-from-the-photo","olympic-gold-medals-by-country","uefa-champions-league-by-year","classic-literature-lightning-round","closest-countries-to-petra","companies-to-headquarters-pt18","deadliest-diseases-history","match-revolution-to-country","brand-parent-company-1","highest-grossing-concert-residencies","match-book-series-to-author","match-cheese-to-country","name-every-big-4-team","name-the-snack-from-the-label","coen-brothers-films","every-country-to-play-at-a-world-cup","match-childrens-book-to-author-typed","nba-starters-2026-knicks","match-desert-landmark-to-country-typed","smallest-countries-by-area","name-the-cheese","frasier-character-match","video-game-history-lightning-round","countries-that-start-with-g","closest-countries-to-sydney-opera-house","most-oscar-acting-wins","summer-olympics-host-cities","nba-player-college-typed","how-i-met-your-mother-character-match","most-valuable-brands","parks-and-recreation-character-match","longest-running-daytime-soap-operas","match-fashion-house-to-country-typed"];

import { QUIZ_HEROES, QOTD_POOL, QOTD_OVERRIDES } from '@/lib/quiz-heroes';
import { COMPANY_META } from '@/lib/company-quiz-meta';

// The Business News hub's own patterns (app/quizzes/business-news).
const NEWS_RE = /^(daily-market-news|daily-business|weekly-business|earnings-reporter)/;
const EARN_RE = /-\dq\d\d-earnings-quiz$/i;
const SECTOR_RE = /-sector-update$/;

let cache = null;
function keepSet() {
  if (cache) return cache;
  cache = new Set([
    ...OBSERVED,
    ...Object.keys(QUIZ_HEROES || {}),
    ...(QOTD_POOL || []),
    ...Object.values(QOTD_OVERRIDES || {}),
    ...Object.keys(COMPANY_META || {}),
  ]);
  return cache;
}

export function quizIndexable(id) {
  if (!id) return false;
  if (NEWS_RE.test(id) || EARN_RE.test(id) || SECTOR_RE.test(id)) return true;
  return keepSet().has(id);
}

export function indexableQuizzes(quizzes) {
  return (quizzes || []).filter((q) => quizIndexable(q.id));
}
