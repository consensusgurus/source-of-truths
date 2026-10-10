// Quiz "challenges": curated leaderboards over a fixed set of quizzes since a
// start time, plus the rotating DAILY CHALLENGE. Each challenge powers the
// Stat Hub Challenges tab and the read API at /api/quiz/challenge-leaderboard.
//
// Two kinds of challenge:
//   1. Static events (the CHALLENGES array) — e.g. the Continents Challenge.
//      To launch one: add an entry with `since` (and optional `until` to close
//      it). Everything reads from here.
//   2. The DAILY CHALLENGE — a set of three quizzes from one category that
//      rotates every 24 hours. It needs NO daily process: the day's quizzes are
//      a deterministic function of the calendar date (DAILY_SCHEDULE indexed by
//      whole days since EPOCH_YMD). Any past or future day resolves the same for
//      everyone, and `quiz_results` already timestamps every play, so each day's
//      standings are just a windowed read. Past days freeze automatically the
//      moment the Eastern day rolls over — nothing is written nightly.
//
// To refresh / extend the daily rotation: APPEND new { d, q } entries to the END
// of DAILY_SCHEDULE (and/or edit entries at indices that have NOT occurred yet).
// NEVER edit an index whose date has already passed — that day's results are
// frozen against its quizzes, so changing it would rewrite history.

// Static-challenge shape:
//   id, title, accent, kicker, blurb, since, until?, sinceLabel, groups[]
//   groups = sections shown side by side, each { key,label,emoji,color,columns[] }
//            a column = one quiz { quizId, label, icon }.

export const CHALLENGES = [
  {
    id: 'erase-the-map',
    title: 'The Erase the Map Challenge',
    accent: 'Erase',
    kicker: 'Quiz Event',
    prize: 'The top of the standings wins $60 in Earnings-Edge credit.',
    blurb: 'All seven Erase the Map games — the USA plus every populated continent, no outlines, no skips. Names are called in random order and every correct click wipes that region into the sea; one wrong click ends the run. Registered players ranked by total erased, ties broken by least total time.',
    since: '2026-07-06T15:10:00Z',
    sinceLabel: 'Mon Jul 6, 2026 · 11:10 AM ET',
    until: '2026-07-13T15:40:00Z',
    closesLabel: 'Closes Mon Jul 13, 2026 · 11:40 AM ET',
    closedLabel: 'Closed Mon Jul 13, 2026 · 11:40 AM ET — results frozen',
    groups: [
      { key: 'americas', label: 'The Americas', emoji: '🗽', color: '#c0392b',
        columns: [
          { quizId: 'erase-the-usa-no-outline', label: 'USA', icon: '🇺🇸' },
          { quizId: 'erase-north-america-no-outline', label: 'N. America', icon: '🗺️' },
          { quizId: 'erase-south-america-no-outline', label: 'S. America', icon: '🗿' },
        ] },
      { key: 'oldworld', label: 'Europe, Africa, Asia & Oceania', emoji: '🌍', color: '#2f6f9f',
        columns: [
          { quizId: 'erase-europe-no-outline', label: 'Europe', icon: '🏰' },
          { quizId: 'erase-africa-no-outline', label: 'Africa', icon: '🦁' },
          { quizId: 'erase-asia-no-outline', label: 'Asia', icon: '🏯' },
          { quizId: 'erase-oceania-no-outline', label: 'Oceania', icon: '🦘' },
        ] },
    ],
  },
  {
    id: 'outline-strike',
    title: 'The Outline Challenge',
    accent: 'Outlines',
    kicker: 'Quiz Event',
    blurb: 'Eight sudden-death geography quizzes: name every US state, every Canadian province and territory, and the countries of all six populated continents from a bare outline. One wrong answer ends each run. Registered players are ranked by total correct, ties broken by least total time.',
    since: '2026-06-20T19:16:51Z',
    sinceLabel: 'Sat Jun 20, 2026 · 12:00 PM ET',
    until: '2026-06-23T00:00:00Z',
    closesLabel: 'Closes Mon Jun 22, 2026 · 8:00 PM ET',
    closedLabel: 'Closed Mon Jun 22, 2026 · 8:00 PM ET — results frozen',
    prize: 'The top of the standings wins a $40 Earnings-Edge subscription.',
    groups: [
      { key: 'americas', label: 'The Americas', emoji: '🗽', color: '#c0392b',
        columns: [
          { quizId: 'us-states-by-outline-1-strike', label: 'US States', icon: '🇺🇸' },
          { quizId: 'canadian-provinces-by-outline-1-strike', label: 'Canada', icon: '🍁' },
          { quizId: 'north-american-countries-by-outline-1-strike', label: 'N. America', icon: '🗺️' },
          { quizId: 'south-american-countries-by-outline-1-strike', label: 'S. America', icon: '🗺️' },
        ] },
      { key: 'oldworld', label: 'Africa, Europe, Asia & Oceania', emoji: '🌍', color: '#2f6f9f',
        columns: [
          { quizId: 'african-countries-by-outline-1-strike', label: 'Africa', icon: '🦁' },
          { quizId: 'european-countries-by-outline-1-strike', label: 'Europe', icon: '🏰' },
          { quizId: 'asian-countries-by-outline-1-strike', label: 'Asia', icon: '🏯' },
          { quizId: 'oceanian-countries-by-outline-1-strike', label: 'Oceania', icon: '🦘' },
        ] },
    ],
  },
  {
    id: 'continents',
    title: 'The Continents Challenge',
    accent: 'Continents',
    kicker: 'Quiz Event',
    prize: 'A prize is up for grabs for the player who tops the standings.',
    blurb: 'Twelve geography quizzes — name the flags and click the country with no outline, two for every continent. Registered players ranked by total correct, then by least time spent.',
    since: '2026-06-15T15:40:00.000Z',
    until: '2026-06-19T20:47:31.000Z',
    sinceLabel: 'Mon Jun 15, 2026 · 11:40 AM ET',
    closedLabel: 'Closed Fri Jun 19, 2026 — results frozen',
    groups: [
      { key: 'north-america', label: 'North America', emoji: '🗽', color: '#c0392b',
        columns: [
          { quizId: 'flags-of-north-america', label: 'Flags', icon: '🚩' },
          { quizId: 'north-america-no-outline', label: 'Map', icon: '🗺️' },
        ] },
      { key: 'south-america', label: 'South America', emoji: '🗿', color: '#2e7d4f',
        columns: [
          { quizId: 'flags-of-south-america', label: 'Flags', icon: '🚩' },
          { quizId: 'south-america-no-outline', label: 'Map', icon: '🗺️' },
        ] },
      { key: 'europe', label: 'Europe', emoji: '🏰', color: '#2f6f9f',
        columns: [
          { quizId: 'flags-of-europe', label: 'Flags', icon: '🚩' },
          { quizId: 'europe-no-outline', label: 'Map', icon: '🗺️' },
        ] },
      { key: 'africa', label: 'Africa', emoji: '🦁', color: '#d98a2b',
        columns: [
          { quizId: 'flags-of-africa', label: 'Flags', icon: '🚩' },
          { quizId: 'africa-no-outline', label: 'Map', icon: '🗺️' },
        ] },
      { key: 'asia', label: 'Asia', emoji: '🏯', color: '#a23b72',
        columns: [
          { quizId: 'flags-of-asia', label: 'Flags', icon: '🚩' },
          { quizId: 'asia-no-outline', label: 'Map', icon: '🗺️' },
        ] },
      { key: 'oceania', label: 'Oceania', emoji: '🦘', color: '#1f9b8e',
        columns: [
          { quizId: 'flags-of-oceania', label: 'Flags', icon: '🚩' },
          { quizId: 'oceania-no-outline', label: 'Map', icon: '🗺️' },
        ] },
    ],
  },
];

// Fallback id for the read API when no ?id= is supplied (callers pass explicit
// ids; this just keeps the route's import stable).
export const DEFAULT_CHALLENGE_ID = 'erase-the-map';

// ─── Daily challenge ─────────────────────────────────────────────────────────
// Day 0 of the rotation. Whole-days-since-EPOCH indexes DAILY_SCHEDULE.
export const EPOCH_YMD = '2026-06-19';
// How many past daily challenges to surface in the challenge selector.
export const DAILY_MENU_DAYS = 30;
// Master switch for the rotating Daily Challenge. Off for now: keeps historical
// daily leaderboards resolvable but stops surfacing the daily in the button,
// dropdown, Stat Hub menu, and board rotation.
export const DAILY_CHALLENGE_ON = false;   // unplugged 2026-10-09 (owner); Potluck is the daily quiz now

// Per-category display meta for the daily challenge group header (kept local so
// this file stays dependency-free for the API bundle).
const DEPT_META = {
  movies:        { label: 'Movies',          emoji: '🎬', color: '#c0392b' },
  music:         { label: 'Music',           emoji: '🎵', color: '#c98a1b' },
  gaming:        { label: 'Gaming',          emoji: '🎮', color: '#7a4fb0' },
  travel:        { label: 'Travel',          emoji: '✈️', color: '#2e7d6b' },
  sports:        { label: 'Sports',          emoji: '🏆', color: '#2f6f9f' },
  geography:     { label: 'Geography',       emoji: '🌍', color: '#1f7a8c' },
  food:          { label: 'Food & Drink',    emoji: '🍽️', color: '#c2691c' },
  business:      { label: 'Business',        emoji: '💼', color: '#4d6b8a' },
  science:       { label: 'Science & Nature',emoji: '🧪', color: '#3f8c5a' },
  entertainment: { label: 'Entertainment',   emoji: '📺', color: '#b0466e' },
  literature:    { label: 'Literature',      emoji: '📚', color: '#8a6d3b' },
  history:       { label: 'History',         emoji: '🏛️', color: '#9a5b3f' },
  misc:          { label: 'Mixed Bag',       emoji: '✨', color: '#4f7d5a' },
};

// ─── HARD RULE: Daily Challenge quizzes must be OBJECTIVE/FACTUAL only ─────────
// Every quiz in DAILY_SCHEDULE must have a single, defensible correct order that
// is a matter of FACT, never of editorial taste. The challenge ranks players on
// a "name them all / in order" basis, so a subjective ranking has no honest
// answer key.
//
// ALLOWED: facts-mode lists and standalone factual quizzes whose order is data —
//   best-selling, top-grossing, biggest/largest/most, capitals, champions, stat
//   leaders, awards by year, box-office filmographies, matched/bank/map/photo
//   quizzes with a cited objective source.
// BANNED: any quiz derived from a subjective "Best X" CONSENSUS list — i.e. a
//   quiz paired to a Borda/vote list (anything that is NOT mode:'facts'), or
//   whose source reads "Based on the consensus of <publications>". Examples that
//   were removed 2026-06-25: best-chain-pizza-restaurants, best-classic-chips,
//   best-sandwich-types, best-beaches-us, best-*-teams, college-towns-america,
//   girl-scout-cookies, best-sub-chains, hitchcock/kubrick/john-hughes/bigelow-
//   movies (critic-consensus director rankings; box-office filmographies like
//   tarantino-films are FINE because they are ranked by gross).
// Quick check before adding an entry: open lib/quizzes.js, find the quiz, and if
// it has a listId whose lib/data.js list is not mode:'facts', or its source says
// "consensus of", do NOT use it.
export const DAILY_SCHEDULE = [
  { d: 'movies', q: ['actors-most-oscar-nominations', 'best-animated-feature-oscar-by-year', 'best-picture-by-year'] },
  { d: 'music', q: ['best-selling-albums-21st-century', 'best-selling-albums-all-time', 'best-selling-christmas-songs'] },
  { d: 'gaming', q: ['best-selling-game-boy-games', 'best-selling-game-consoles', 'best-selling-game-franchises'] },
  { d: 'travel', q: ['airport-code-to-city', 'best-airlines-north-america', 'best-airlines-world'] },
  { d: 'sports', q: ['athlete-jersey-numbers', 'athlete-nicknames-bank', 'athlete-sponsor-brand'] },
  { d: 'geography', q: ['capital-to-river', 'capitals-of-africa', 'capitals-of-asia'] },
  { d: 'food', q: ['most-popular-fast-food-items-america', 'most-consumed-beverages-world', 'most-popular-ice-cream-flavors'] },
  { d: 'business', q: ['best-selling-cars-all-time', 'biggest-ipos-all-time', 'biggest-us-companies-by-year'] },
  { d: 'science', q: ['animal-to-classification-bank', 'brightest-stars', 'constellation-to-brightest-star-bank'] },
  { d: 'entertainment', q: ['cartoon-character-to-voice-actor', 'emmy-drama-series-by-year', 'highest-grossing-standup-comedy-tours'] },
  { d: 'literature', q: ['bbc-top-100-books', 'best-selling-book-series', 'best-selling-books'] },
  { d: 'history', q: ['match-battle-to-war', 'match-civilization-to-region', 'match-cold-war-event-to-decade'] },
  { d: 'misc', q: ['ap-style-standalone-cities', 'college-mascots', 'countries-most-mcdonalds'] },
  { d: 'movies', q: ['tarantino-films', 'coen-brothers-films', 'directors-most-best-picture-nominations'] },
  { d: 'music', q: ['best-selling-music-artists', 'best-selling-singles', 'best-selling-soundtracks-all-time'] },
  { d: 'gaming', q: ['best-selling-gamecube-games', 'best-selling-games-all-time', 'best-selling-handheld-consoles'] },
  { d: 'travel', q: ['most-visited-us-national-parks', 'busiest-airports-outside-us', 'busiest-airports-us'] },
  { d: 'sports', q: ['atp-career-singles-titles-open-era', 'ballon-dor-by-year', 'nba-championships-by-franchise'] },
  { d: 'geography', q: ['capitals-of-europe', 'capitals-of-north-america', 'capitals-of-oceania'] },
  { d: 'food', q: ['best-selling-beers-america', 'best-selling-bottled-water-brands', 'best-selling-candy-bars-america'] },
  { d: 'business', q: ['brand-parent-company-1', 'brand-parent-company-2', 'brand-parent-company-3'] },
  { d: 'science', q: ['deadliest-diseases-history', 'deepest-ocean-trenches', 'fastest-animals-earth'] },
  { d: 'entertainment', q: ['highest-paid-late-night-hosts', 'highest-paid-tv-actors-per-episode', 'host-to-game-show'] },
  { d: 'literature', q: ['best-selling-fiction-authors', 'best-selling-nonfiction-books-all-time', 'best-selling-novels-all-time'] },
  { d: 'history', q: ['match-document-to-year', 'match-dynasty-to-country', 'match-empire-to-capital'] },
  { d: 'misc', q: ['guess-the-country-from-its-national-dish', 'largest-cities-world-population', 'name-every-element-periodic-table'] },
  { d: 'movies', q: ['films-big-five-oscars', 'films-most-oscar-wins', 'highest-grossing-comedies-all-time'] },
  { d: 'music', q: ['eurovision-winner-by-year', 'grammy-album-of-year-by-year', 'highest-grossing-concert-residencies'] },
  { d: 'gaming', q: ['best-selling-n64-games', 'best-selling-nes-games', 'best-selling-pc-games'] },
  { d: 'travel', q: ['busiest-airports-world', 'busiest-cruise-ports', 'busiest-international-air-routes'] },
  { d: 'sports', q: ['super-bowl-champions', 'world-series-champions', 'nba-champions'] },
  { d: 'geography', q: ['capitals-of-south-america', 'click-caribbean', 'click-central-america'] },
  { d: 'food', q: ['best-selling-cereal-brands-america', 'best-selling-cookie-brands', 'best-selling-liquor-brands-world'] },
  { d: 'business', q: ['brand-parent-company-4', 'brand-parent-company-5', 'business-brands-lightning-round'] },
  { d: 'science', q: ['fastest-land-animals', 'heaviest-animals-earth', 'heaviest-land-animals'] },
  { d: 'entertainment', q: ['longest-running-animated-tv-series', 'longest-running-daytime-soap-operas', 'longest-running-game-shows'] },
  { d: 'literature', q: ['book-characters', 'book-characters-2', 'book-characters-3'] },
  { d: 'history', q: ['match-explorer-to-discovery', 'match-invention-to-century', 'match-monarch-to-country'] },
  { d: 'misc', q: ['name-the-candy-bar-from-the-cross-section', 'name-the-cheese', 'name-the-dish-from-the-photo'] },
  { d: 'movies', q: ['highest-grossing-directors', 'highest-grossing-films-all-time', 'highest-grossing-horror-films'] },
  { d: 'music', q: ['longest-number-1-albums-1990s', 'longest-reigning-hot-100-number-1-singles', 'match-album-release-year'] },
  { d: 'gaming', q: ['best-selling-pc-strategy-games', 'best-selling-pokemon-games', 'best-selling-ps1-games'] },
  { d: 'travel', q: ['cities-most-bridges', 'most-visited-theme-parks', 'dominant-airline-by-airport'] },
  { d: 'sports', q: ['nfl-super-bowl-wins-by-franchise', 'boxer-nicknames', 'college-football-champions'] },
  { d: 'geography', q: ['click-southeast-asia', 'countries-by-gdp', 'countries-by-population'] },
  { d: 'food', q: ['best-selling-sodas-america', 'most-popular-cocktails-worldwide', 'food-origins-lightning-round'] },
  { d: 'business', q: ['companies-to-headquarters', 'companies-to-headquarters-pt10', 'companies-to-headquarters-pt11'] },
  { d: 'science', q: ['largest-animals-ever-lived', 'largest-known-stars-by-radius', 'largest-lakes-by-volume'] },
  { d: 'entertainment', q: ['longest-running-scripted-tv-series', 'match-actor-tv-role', 'match-cartoon-network-tv'] },
  { d: 'literature', q: ['book-characters-4', 'book-characters-5', 'book-to-famous-last-line'] },
  { d: 'history', q: ['match-pandemic-to-era', 'match-pharaoh-to-legacy', 'match-president-to-number'] },
  { d: 'misc', q: ['name-the-dog-breed', 'name-the-gemstone', 'name-the-manhattan-pizzeria-from-the-pie'] },
  { d: 'movies', q: ['highest-grossing-non-english-films', 'highest-grossing-r-rated-films', 'highest-grossing-superhero-films'] },
  { d: 'music', q: ['match-album-to-band', 'match-artist-record-label', 'match-band-country-of-origin'] },
  { d: 'gaming', q: ['best-selling-ps2-games', 'best-selling-racing-video-games', 'best-selling-sega-genesis-games'] },
  { d: 'travel', q: ['famous-hotel-to-city', 'landmark-to-country', 'largest-airports-terminal-size'] },
  { d: 'sports', q: ['country-national-sport', 'f1-champion-by-year', 'f1-driver-team-2026'] },
  { d: 'geography', q: ['countries-longest-coastlines', 'countries-most-neighbors', 'countries-most-unesco-sites'] },
  { d: 'food', q: ['most-pizza-chain-locations', 'largest-chocolate-consuming-countries', 'largest-coffee-producing-countries'] },
  { d: 'business', q: ['companies-to-headquarters-pt12', 'companies-to-headquarters-pt13', 'companies-to-headquarters-pt14'] },
  { d: 'science', q: ['largest-moons-solar-system', 'largest-rainforests-world', 'largest-solar-system-objects'] },
  { d: 'entertainment', q: ['match-comedian-sitcom', 'match-drama-lead-actor', 'match-game-show-catchphrase'] },
  { d: 'literature', q: ['character-to-author', 'classic-literature-lightning-round', 'fictional-country-to-book'] },
  { d: 'history', q: ['match-revolution-to-country', 'match-speech-to-speaker', 'match-treaty-to-war'] },
  { d: 'misc', q: ['name-the-nyc-burger-spot-from-the-burger', 'name-the-painting', 'name-the-pasta-from-the-shape'] },
  { d: 'movies', q: ['wes-anderson-films', 'pixar-films-box-office', 'top-grossing-directors'] },
  { d: 'music', q: ['match-band-genre', 'match-band-member-to-band', 'match-band-to-lead-singer'] },
  { d: 'gaming', q: ['best-selling-snes-games', 'best-selling-sports-video-games', 'best-selling-xbox-games'] },
  { d: 'travel', q: ['largest-ski-areas-europe', 'largest-ski-areas-north-america', 'longest-nonstop-flights'] },
  { d: 'sports', q: ['f1-most-championships', 'f1-most-race-wins', 'fifa-world-cup-wins-by-country'] },
  { d: 'geography', q: ['countries-of-africa', 'countries-of-asia', 'countries-of-europe'] },
  { d: 'food', q: ['largest-restaurant-chains-store-count', 'largest-tea-producing-countries', 'largest-wine-producing-countries'] },
  { d: 'business', q: ['companies-to-headquarters-pt15', 'companies-to-headquarters-pt16', 'companies-to-headquarters-pt17'] },
  { d: 'science', q: ['longest-living-animals', 'match-animal-baby-name', 'match-animal-class'] },
  { d: 'entertainment', q: ['match-reality-show-network', 'match-sitcom-decade', 'match-soap-opera-country'] },
  { d: 'literature', q: ['fill-in-the-blank-book-titles-pt-1', 'fill-in-the-blank-book-titles-pt-2', 'fill-in-the-blank-book-titles-pt-3'] },
  { d: 'history', q: ['match-wonder-to-civilization', 'name-the-president-from-the-portrait', 'name-the-president-from-the-portrait-2'] },
  { d: 'misc', q: ['name-the-symbols-for-every-element', 'name-the-tree-from-its-leaf', 'phobia-to-fear'] },
  { d: 'movies', q: ['match-actor-breakout-film', 'match-actor-to-director', 'match-actor-to-oscar-role'] },
  { d: 'music', q: ['match-boy-band-era', 'match-classical-composer-era', 'match-cover-song-original-artist'] },
  { d: 'gaming', q: ['gaming-console-to-launch-game', 'gaming-fighter-to-game', 'gaming-game-to-decade'] },
  { d: 'travel', q: ['match-airline-alliance-to-member', 'match-airline-to-home-country', 'match-beach-to-country'] },
  { d: 'sports', q: ['golf-major-championships-leaders', 'golf-major-course', 'gymnast-country'] },
  { d: 'geography', q: ['countries-of-north-america', 'countries-of-south-america', 'countries-on-the-equator'] },
  { d: 'food', q: ['match-beer-brand-to-country', 'match-beer-style-to-origin', 'match-candy-bar-to-maker'] },
  { d: 'business', q: ['companies-to-headquarters-pt18', 'companies-to-headquarters-pt19', 'companies-to-headquarters-pt2'] },
  { d: 'science', q: ['match-animal-collective-noun', 'match-bone-location', 'match-cloud-altitude'] },
  { d: 'entertainment', q: ['match-streaming-hit-platform', 'match-tv-character-catchphrase', 'match-tv-detective-show'] },
  { d: 'literature', q: ['longest-novels', 'match-author-to-genre', 'match-author-to-nationality'] },
  { d: 'history', q: ['match-battle-to-war', 'match-civilization-to-region', 'match-cold-war-event-to-decade'] },
  { d: 'misc', q: ['seven-wonders-ancient-world', 'ap-style-standalone-cities', 'college-mascots'] },
  { d: 'movies', q: ['match-actor-to-oscar-year', 'match-animated-film-to-studio', 'match-biopic-to-subject'] },
  { d: 'music', q: ['match-dj-genre', 'match-festival-to-country', 'match-instrument-family'] },
  { d: 'gaming', q: ['gaming-game-to-genre', 'gaming-game-to-iconic-weapon', 'gaming-game-to-protagonist'] },
  { d: 'travel', q: ['match-bridge-to-city', 'match-castle-to-country', 'match-desert-landmark-to-country'] },
  { d: 'sports', q: ['indianapolis-500-wins', 'olympic-gold-medals-by-country', 'international-soccer-goals-leaders'] },
  { d: 'geography', q: ['countries-spanning-two-continents', 'countries-that-changed-their-name', 'countries-with-no-rivers'] },
  { d: 'food', q: ['match-cheese-to-country', 'match-chef-to-restaurant', 'match-cocktail-to-garnish'] },
  { d: 'business', q: ['companies-to-headquarters-pt20', 'companies-to-headquarters-pt3', 'companies-to-headquarters-pt4'] },
  { d: 'science', q: ['match-compound-to-formula', 'match-dinosaur-era', 'match-discovery-to-scientist'] },
  { d: 'entertainment', q: ['match-tv-family-show', 'match-tv-show-country', 'match-tv-show-spinoff'] },
  { d: 'literature', q: ['match-author-to-pen-name', 'match-banned-book-to-author', 'match-book-series-to-author'] },
  { d: 'history', q: ['match-document-to-year', 'match-dynasty-to-country', 'match-empire-to-capital'] },
  { d: 'misc', q: ['countries-most-mcdonalds', 'guess-the-country-from-its-national-dish', 'largest-cities-world-population'] },
  { d: 'movies', q: ['match-bond-film-to-actor', 'match-cartoon-sidekick-to-hero', 'match-catchphrase-to-film'] },
  { d: 'music', q: ['match-instrument-to-famous-player', 'match-musical-to-composer', 'match-national-anthem-country'] },
  { d: 'gaming', q: ['gaming-game-to-setting', 'gaming-indie-to-developer', 'gaming-mmo-to-studio'] },
  { d: 'travel', q: ['match-famous-street-to-city', 'match-famous-train-to-route', 'match-monument-to-country'] },
  { d: 'sports', q: ['match-athlete-to-sport', 'match-nfl-team-to-stadium', 'mens-college-basketball-champions'] },
  { d: 'geography', q: ['countries-with-one-bordering-neighbor', 'country-to-bordering-neighbor', 'country-to-continent'] },
  { d: 'food', q: ['match-cocktail-to-spirit', 'match-coffee-drink-to-recipe', 'match-condiment-to-origin'] },
  { d: 'business', q: ['companies-to-headquarters-pt5', 'companies-to-headquarters-pt6', 'companies-to-headquarters-pt7'] },
  { d: 'science', q: ['match-disease-pathogen', 'match-element-atomic-number', 'match-element-to-symbol'] },
  { d: 'entertainment', q: ['most-emmy-awards-performer', 'most-emmy-wins-single-show', 'most-followed-instagram-accounts'] },
  { d: 'literature', q: ['match-childrens-book-to-author', 'match-detective-to-author', 'match-detective-to-sidekick'] },
  { d: 'history', q: ['match-explorer-to-discovery', 'match-invention-to-century', 'match-monarch-to-country'] },
  { d: 'misc', q: ['name-every-element-periodic-table', 'name-the-candy-bar-from-the-cross-section', 'name-the-cheese'] },
  { d: 'movies', q: ['match-composer-to-film', 'match-director-to-debut-film', 'match-director-to-film'] },
  { d: 'music', q: ['match-one-hit-wonder-song', 'match-opera-composer', 'match-producer-to-album'] },
  { d: 'gaming', q: ['gaming-nintendo-character-to-debut', 'gaming-pokemon-to-type', 'gaming-series-to-publisher'] },
  { d: 'travel', q: ['match-national-park-to-country', 'match-observation-deck-to-tower', 'match-ski-resort-to-country'] },
  { d: 'sports', q: ['mens-tennis-grand-slam-leaders', 'mlb-career-pitching-wins', 'mlb-hits-leaders'] },
  { d: 'geography', q: ['country-to-highest-mountain', 'country-to-highest-point', 'country-to-largest-city'] },
  { d: 'food', q: ['match-dessert-to-country', 'match-dish-to-country', 'match-hot-sauce-to-heat'] },
  { d: 'business', q: ['companies-to-headquarters-pt8', 'companies-to-headquarters-pt9', 'company-founder-2'] },
  { d: 'science', q: ['match-invention-to-inventor', 'match-mineral-hardness', 'match-organ-body-system'] },
  { d: 'entertainment', q: ['most-followed-social-media', 'most-streamed-tv-shows-netflix', 'most-subscribed-youtube-channels'] },
  { d: 'literature', q: ['match-dystopia-to-ruling-power', 'match-dystopian-novel-to-author', 'match-fairy-tale-to-origin'] },
  { d: 'history', q: ['match-pandemic-to-era', 'match-pharaoh-to-legacy', 'match-president-to-number'] },
  { d: 'misc', q: ['name-the-dish-from-the-photo', 'name-the-dog-breed', 'name-the-gemstone'] },
  { d: 'movies', q: ['match-disney-film-to-villain', 'match-film-to-filming-location', 'match-film-to-source-novel'] },
  { d: 'music', q: ['match-rapper-hometown', 'match-singer-backing-band', 'match-song-decade'] },
  { d: 'gaming', q: ['gaming-villain-to-game', 'highest-grossing-arcade-games', 'highest-grossing-console-video-games'] },
  { d: 'travel', q: ['match-skyscraper-to-city', 'match-theme-park-to-country', 'most-visited-beaches'] },
  { d: 'sports', q: ['mlb-home-run-leaders', 'mlb-rbi-leaders', 'mlb-runs-scored-leaders'] },
  { d: 'geography', q: ['country-to-official-language', 'deepest-lakes-world', 'desert-to-continent'] },
  { d: 'food', q: ['match-pasta-shape-to-name', 'match-sandwich-to-city', 'match-soda-to-maker'] },
  { d: 'business', q: ['company-founder-3', 'company-founder-4', 'company-founder-5'] },
  { d: 'science', q: ['match-planet-largest-moon', 'match-planet-position', 'match-scientist-nobel-field'] },
  { d: 'entertainment', q: ['most-tony-awards-musical', 'most-watched-single-tv-broadcasts', 'most-watched-tv-series-finales'] },
];

// ── date helpers (Eastern day = the day the daily flips) ──
const MS_DAY = 86400000;
function ymdAddDays(ymd, n) {
  const t = Date.parse(`${ymd}T00:00:00.000Z`) + n * MS_DAY;
  return new Date(t).toISOString().slice(0, 10);
}
// Whole calendar days from EPOCH_YMD to ymd (DST-independent: pure date math).
function dayIndexForYmd(ymd) {
  return Math.round((Date.parse(`${ymd}T00:00:00.000Z`) - Date.parse(`${EPOCH_YMD}T00:00:00.000Z`)) / MS_DAY);
}
// Today's date in US Eastern as YYYY-MM-DD.
export function easternYmd(d = new Date()) {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'America/New_York', year: 'numeric', month: '2-digit', day: '2-digit' }).format(d);
}
// UTC instant of Eastern midnight that starts the given Eastern date (handles
// EST/EDT by picking whichever offset actually renders as 00:00 that date).
function easternMidnightISO(ymd) {
  for (const offH of [4, 5]) {
    const guess = Date.parse(`${ymd}T00:00:00.000Z`) + offH * 3600 * 1000;
    const p = new Intl.DateTimeFormat('en-CA', { timeZone: 'America/New_York', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', hour12: false })
      .formatToParts(new Date(guess)).reduce((a, x) => { a[x.type] = x.value; return a; }, {});
    if (`${p.year}-${p.month}-${p.day}` === ymd && p.hour === '00') return new Date(guess).toISOString();
  }
  return new Date(Date.parse(`${ymd}T04:00:00.000Z`)).toISOString();
}
function humanDate(ymd) {
  try { return new Date(`${ymd}T12:00:00.000Z`).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' }); }
  catch (e) { return ymd; }
}
function shortDate(ymd) {
  try { return new Date(`${ymd}T12:00:00.000Z`).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }); }
  catch (e) { return ymd; }
}

// The schedule entry for a given Eastern date (wraps the runway so it never
// runs dry; append to DAILY_SCHEDULE to keep selections fresh going forward).
function scheduleEntryForYmd(ymd) {
  const len = DAILY_SCHEDULE.length;
  if (!len) return null;
  const idx = dayIndexForYmd(ymd);
  const i = ((idx % len) + len) % len;
  return DAILY_SCHEDULE[i];
}

export function dailyChallengeId(ymd = easternYmd()) { return `daily-${ymd}`; }

// Build the full challenge object for the daily on a given Eastern date. Same
// shape as a static challenge, so the read API and the Stat Hub render it with
// no special-casing.
export function getDailyChallenge(ymd = easternYmd()) {
  const entry = scheduleEntryForYmd(ymd);
  if (!entry) return null;
  const meta = DEPT_META[entry.d] || DEPT_META.misc;
  const next = ymdAddDays(ymd, 1);
  return {
    id: `daily-${ymd}`,
    daily: true,
    firstAttemptOnly: true,
    date: ymd,
    kicker: 'Daily Challenge',
    accent: meta.label,
    title: `Daily Challenge: ${meta.label}`,
    blurb: `Three ${meta.label} quizzes, refreshed every 24 hours. Registered players are ranked by total correct, ties broken by least total time.`,
    since: easternMidnightISO(ymd),
    until: easternMidnightISO(next),
    sinceLabel: `${humanDate(ymd)} · 12:00 AM ET`,
    groups: [
      {
        key: entry.d,
        label: meta.label,
        emoji: meta.emoji,
        color: meta.color,
        columns: entry.q.map((quizId) => ({ quizId, label: '', icon: meta.emoji })),
      },
    ],
  };
}

// Resolve any challenge id: a `daily-YYYY-MM-DD` id synthesises the daily for
// that date; otherwise look it up in the static CHALLENGES array.
export function getChallenge(id) {
  if (!id) return CHALLENGES.find((c) => c.id === DEFAULT_CHALLENGE_ID) || null;
  const m = /^daily-(\d{4}-\d{2}-\d{2})$/.exec(id);
  if (m) return getDailyChallenge(m[1]);
  return CHALLENGES.find((c) => c.id === id) || null;
}

// Ordered selector menu for the Challenges tab: today's daily first, then the
// previous DAILY_MENU_DAYS dailies (newest -> oldest, never before EPOCH), then
// the static events (e.g. the closed Continents Challenge) last.
export function challengeMenu(today = easternYmd()) {
  const out = [];
  const todayIdx = dayIndexForYmd(today);
  if (DAILY_CHALLENGE_ON) for (let back = 0; back <= DAILY_MENU_DAYS; back++) {
    const idx = todayIdx - back;
    if (idx < 0) break;
    const ymd = ymdAddDays(EPOCH_YMD, idx);
    const entry = scheduleEntryForYmd(ymd);
    const meta = (entry && DEPT_META[entry.d]) || DEPT_META.misc;
    out.push({
      id: `daily-${ymd}`,
      daily: true,
      date: ymd,
      isToday: back === 0,
      label: back === 0 ? `Today · ${meta.label}` : `${shortDate(ymd)} · ${meta.label}`,
      title: `Daily Challenge: ${meta.label}`,
    });
  }
  for (const c of CHALLENGES) {
    const closed = !!(c.until && Date.parse(c.until) <= Date.now());
    out.push({ id: c.id, daily: false, date: c.since ? c.since.slice(0, 10) : '', closed, label: c.title.replace(/^The\s+/, ''), title: c.title });
  }
  return out;
}

// Challenges that are OPEN right now (currently inside their window and counting
// results): today's daily challenge plus any static event whose since/until
// window includes `now`. Powers the home-page challenge slideshow. Ordered
// daily first, then open events.
export function openChallenges(now = new Date()) {
  const t = now.getTime();
  const out = [];
  const d = getDailyChallenge(easternYmd(now));
  if (DAILY_CHALLENGE_ON && d) out.push({ id: d.id, daily: true, title: 'Daily Challenge', sub: `Today · ${d.accent}` });
  for (const c of CHALLENGES) {
    const sinceMs = c.since ? Date.parse(c.since) : -Infinity;
    const untilMs = c.until ? Date.parse(c.until) : Infinity;
    if (Number.isFinite(sinceMs) && t >= sinceMs && t < untilMs) {
      out.push({ id: c.id, daily: false, title: c.title.replace(/^The\s+/, ''), sub: c.kicker || 'Quiz Event' });
    }
  }
  return out;
}

export function challengeColumns(ch) {
  return (ch.groups || []).flatMap((g) => g.columns.map((col) => ({ ...col, group: g })));
}

export function challengeQuizIds(ch) {
  return (ch.groups || []).flatMap((g) => g.columns.map((col) => col.quizId));
}
