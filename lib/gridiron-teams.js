// Canonical team registry + alias normalizer.
//
// Every source names teams differently. Sagarin says "Miami-Florida" and still
// says "Washington Redskins"; DRatings appends mascots; CBS prints nicknames
// only; nfelo uses abbreviations and still calls the Raiders "OAK". Nothing
// downstream works until they all resolve to one canonical name, so this table
// is the join key for the whole framework.
//
// `id` is the ESPN team id (CFB logos key off the id), `abbr` the ESPN
// lowercase abbreviation (NFL logos key off the abbreviation). Every id below
// was read off a live ESPN response — never guess one, a wrong id silently
// renders another team's logo.

export const CFB_TEAMS = {
  'Ohio State':      { id: 194,  aliases: [] },
  'Oregon':          { id: 2483, aliases: [] },
  'Notre Dame':      { id: 87,   aliases: [] },
  'Georgia':         { id: 61,   aliases: [] },
  'Texas':           { id: 251,  aliases: [] },
  'Indiana':         { id: 84,   aliases: [] },
  'Miami':           { id: 2390, aliases: ['Miami-Florida', 'Miami (FL)', 'Miami FL'] },
  'Texas A&M':       { id: 245,  aliases: [] },
  'Oklahoma':        { id: 201,  aliases: [] },
  'LSU':             { id: 99,   aliases: ['Louisiana State'] },
  'Ole Miss':        { id: 145,  aliases: ['Mississippi'] },
  'Texas Tech':      { id: 2641, aliases: [] },
  'Alabama':         { id: 333,  aliases: [] },
  'USC':             { id: 30,   aliases: ['Southern California', 'Southern Cal'] },
  'BYU':             { id: 252,  aliases: ['Brigham Young'] },
  'Michigan':        { id: 130,  aliases: [] },
  'Washington':      { id: 264,  aliases: [] },
  'Penn State':      { id: 213,  aliases: [] },
  'SMU':             { id: 2567, aliases: ['Southern Methodist'] },
  'Tennessee':       { id: 2633, aliases: [] },
  'Utah':            { id: 254,  aliases: [] },
  'Iowa':            { id: 2294, aliases: [] },
  'Houston':         { id: 248,  aliases: [] },
  'Louisville':      { id: 97,   aliases: [] },
  'Missouri':        { id: 142,  aliases: [] },
  'Clemson':         { id: 228,  aliases: [] },
  'Florida':         { id: 57,   aliases: [] },
  'Auburn':          { id: 2,    aliases: [] },
  'South Carolina':  { id: 2579, aliases: [] },
  'Vanderbilt':      { id: 238,  aliases: [] },
  // --- added for the top 50 ---
  'Wisconsin':       { id: 275,  aliases: [] },
  'Illinois':        { id: 356,  aliases: [] },
  'Nebraska':        { id: 158,  aliases: [] },
  'Kentucky':        { id: 96,   aliases: [] },
  'Minnesota':       { id: 135,  aliases: [] },
  'UCLA':            { id: 26,   aliases: [] },
  'Pittsburgh':      { id: 221,  aliases: ['Pitt'] },
  'Mississippi State': { id: 344, aliases: [] },
  'Kansas State':    { id: 2306, aliases: [] },
  'Florida State':   { id: 52,   aliases: [] },
  'Arizona':         { id: 12,   aliases: [] },
  'Virginia Tech':   { id: 259,  aliases: [] },
  'Northwestern':    { id: 77,   aliases: [] },
  'Virginia':        { id: 258,  aliases: [] },
  'Arizona State':   { id: 9,    aliases: [] },
  'TCU':             { id: 2628, aliases: ['Texas Christian'] },
  'Georgia Tech':    { id: 59,   aliases: [] },
  'Arkansas':        { id: 8,    aliases: [] },
  'NC State':        { id: 152,  aliases: ['North Carolina State'] },
  'Baylor':          { id: 239,  aliases: [] },
  'Kansas':          { id: 2305, aliases: [] },
  'Duke':            { id: 150,  aliases: [] },
  'Boise State':     { id: 68,   aliases: [] },
  'Iowa State':      { id: 66,   aliases: [] },
  'Wake Forest':     { id: 154,  aliases: [] },
  'California':      { id: 25,   aliases: ['Cal'] },
  'Tulane':          { id: 2655, aliases: [] },
  'UNLV':            { id: 2439, aliases: ['Nevada-Las Vegas'] },
  'North Carolina':  { id: 153,  aliases: [] },
  'Colorado':        { id: 38,   aliases: [] },
  'Cincinnati':      { id: 2132, aliases: [] },
  'Oklahoma State':  { id: 197,  aliases: [] },
  'UCF':             { id: 2116, aliases: ['Central Florida'] },
  'San Diego State': { id: 21,   aliases: [] },
  'Memphis':         { id: 235,  aliases: [] },
  'James Madison':   { id: 256,  aliases: [] },
  'Navy':            { id: 2426, aliases: [] },
  'New Mexico':      { id: 167,  aliases: [] },
  'Western Michigan':{ id: 2711, aliases: [] },
  'Liberty':         { id: 2335, aliases: [] },
  'Louisiana':       { id: 309,  aliases: ['Louisiana-Lafayette', 'UL Lafayette'] },
  "Hawai'i":         { id: 62,   aliases: ['Hawaii'] },
  'Jacksonville State': { id: 55, aliases: [] },
  // --- every remaining FBS program (ESPN group 80, read live 2026-09-01) ---
  // Added for the results pillar: the schedule-strength solve needs the whole
  // FBS graph, not just the teams that reach a top 50. Ids read off ESPN's
  // core team list; anything not in this table pools into one FCS node.
  'UAB':             { id: 5,    aliases: ['Alabama-Birmingham'] },
  'South Alabama':   { id: 6,    aliases: [] },
  'Sacramento State':{ id: 16,   aliases: ['Sacramento St'] },
  'San José State':  { id: 23,   aliases: ['San Jose State', 'San Jose St'] },
  'Stanford':        { id: 24,   aliases: [] },
  'Colorado State':  { id: 36,   aliases: [] },
  'UConn':           { id: 41,   aliases: ['Connecticut'] },
  'Delaware':        { id: 48,   aliases: [] },
  'South Florida':   { id: 58,   aliases: ['USF'] },
  'Western Kentucky':{ id: 98,   aliases: [] },
  'Boston College':  { id: 103,  aliases: [] },
  'Massachusetts':   { id: 113,  aliases: ['UMass'] },
  'Maryland':        { id: 120,  aliases: [] },
  'Michigan State':  { id: 127,  aliases: [] },
  'East Carolina':   { id: 151,  aliases: ['ECU'] },
  'Rutgers':         { id: 164,  aliases: [] },
  'New Mexico State':{ id: 166,  aliases: [] },
  'Syracuse':        { id: 183,  aliases: [] },
  'Bowling Green':   { id: 189,  aliases: [] },
  'Miami (OH)':      { id: 193,  aliases: ['Miami-Ohio', 'Miami OH', 'Miami Ohio'] },
  'Ohio':            { id: 195,  aliases: [] },
  'Tulsa':           { id: 202,  aliases: [] },
  'Oregon State':    { id: 204,  aliases: [] },
  'Temple':          { id: 218,  aliases: [] },
  'Rice':            { id: 242,  aliases: [] },
  'North Texas':     { id: 249,  aliases: [] },
  'Washington State':{ id: 265,  aliases: [] },
  'Marshall':        { id: 276,  aliases: [] },
  'West Virginia':   { id: 277,  aliases: [] },
  'Fresno State':    { id: 278,  aliases: [] },
  'Georgia Southern':{ id: 290,  aliases: [] },
  'Old Dominion':    { id: 295,  aliases: [] },
  'Coastal Carolina':{ id: 324,  aliases: [] },
  'Texas State':     { id: 326,  aliases: [] },
  'Utah State':      { id: 328,  aliases: [] },
  'Kennesaw State':  { id: 338,  aliases: [] },
  'Army':            { id: 349,  aliases: [] },
  'Air Force':       { id: 2005, aliases: [] },
  'Akron':           { id: 2006, aliases: [] },
  'App State':       { id: 2026, aliases: ['Appalachian State', 'Appalachian St'] },
  'Arkansas State':  { id: 2032, aliases: [] },
  'Ball State':      { id: 2050, aliases: [] },
  'Buffalo':         { id: 2084, aliases: [] },
  'Central Michigan':{ id: 2117, aliases: [] },
  'Eastern Michigan':{ id: 2199, aliases: [] },
  'Florida Atlantic':{ id: 2226, aliases: ['FAU'] },
  'Florida International': { id: 2229, aliases: ['FIU', 'Florida Intl', 'Fla. International'] },
  'Georgia State':   { id: 2247, aliases: [] },
  'Kent State':      { id: 2309, aliases: [] },
  'Louisiana Tech':  { id: 2348, aliases: [] },
  'Middle Tennessee':{ id: 2393, aliases: ['Middle Tennessee State', 'MTSU'] },
  'Charlotte':       { id: 2429, aliases: [] },
  'UL Monroe':       { id: 2433, aliases: ['Louisiana-Monroe', 'Louisiana Monroe', 'ULM', 'LouisianaMonroe(ULM)'] },
  'Nevada':          { id: 2440, aliases: [] },
  'North Dakota State': { id: 2449, aliases: [] },
  'Northern Illinois': { id: 2459, aliases: [] },
  'Purdue':          { id: 2509, aliases: [] },
  'Sam Houston':     { id: 2534, aliases: ['Sam Houston State'] },
  'Southern Miss':   { id: 2572, aliases: ['Southern Mississippi'] },
  'Missouri State':  { id: 2623, aliases: [] },
  'UTSA':            { id: 2636, aliases: ['Texas-San Antonio'] },
  'UTEP':            { id: 2638, aliases: ['Texas-El Paso'] },
  'Toledo':          { id: 2649, aliases: [] },
  'Troy':            { id: 2653, aliases: [] },
  'Wyoming':         { id: 2751, aliases: [] },
};

// `id` is the ESPN team id, read live off the 2026 week 1 scoreboard; games and
// lines arrive keyed by it.
export const NFL_TEAMS = {
  'Arizona Cardinals':     { abbr: 'ari', id: 22, }, 'Atlanta Falcons':      { abbr: 'atl', id: 1, },
  'Baltimore Ravens':      { abbr: 'bal', id: 33, }, 'Buffalo Bills':        { abbr: 'buf', id: 2, },
  'Carolina Panthers':     { abbr: 'car', id: 29, }, 'Chicago Bears':        { abbr: 'chi', id: 3, },
  'Cincinnati Bengals':    { abbr: 'cin', id: 4, }, 'Cleveland Browns':     { abbr: 'cle', id: 5, },
  'Dallas Cowboys':        { abbr: 'dal', id: 6, }, 'Denver Broncos':       { abbr: 'den', id: 7, },
  'Detroit Lions':         { abbr: 'det', id: 8, }, 'Green Bay Packers':    { abbr: 'gb', id: 9,  },
  'Houston Texans':        { abbr: 'hou', id: 34, }, 'Indianapolis Colts':   { abbr: 'ind', id: 11, },
  'Jacksonville Jaguars':  { abbr: 'jax', id: 30, }, 'Kansas City Chiefs':   { abbr: 'kc', id: 12,  },
  // nfelo still emits the pre-2020 OAK for the Raiders.
  'Las Vegas Raiders':     { abbr: 'lv', id: 13,  aliases: ['OAK', 'Oakland Raiders'] },
  'Los Angeles Chargers':  { abbr: 'lac', id: 24, }, 'Los Angeles Rams':     { abbr: 'lar', id: 14, },
  'Miami Dolphins':        { abbr: 'mia', id: 15, }, 'Minnesota Vikings':    { abbr: 'min', id: 16, },
  'New England Patriots':  { abbr: 'ne', id: 17,  }, 'New Orleans Saints':   { abbr: 'no', id: 18,  },
  'New York Giants':       { abbr: 'nyg', id: 19, }, 'New York Jets':        { abbr: 'nyj', id: 20, },
  'Philadelphia Eagles':   { abbr: 'phi', id: 21, }, 'Pittsburgh Steelers':  { abbr: 'pit', id: 23, },
  'San Francisco 49ers':   { abbr: 'sf', id: 25,  }, 'Seattle Seahawks':     { abbr: 'sea', id: 26, },
  'Tampa Bay Buccaneers':  { abbr: 'tb', id: 27,  }, 'Tennessee Titans':     { abbr: 'ten', id: 10, },
  // Sagarin still prints the retired name; nfelo uses WAS, ESPN uses WSH.
  'Washington Commanders': { abbr: 'wsh', id: 28, aliases: ['WAS', 'Washington Redskins', 'Washington Football Team'] },
};

/*
  MLB. `id` is the ESPN team id (games, lines and the futures boards all arrive
  keyed by it); `abbr` is the ESPN lowercase abbreviation, which is what the
  logo URL keys off, exactly like the NFL. Every id and every logo below was
  read off a live ESPN response on 2026-09-04.

  Aliases matter more here than in either football league, because the three
  model sources name teams three different ways and two of them are ambiguous:

  - FanGraphs prints its own abbreviations, which differ from ESPN's on six
    clubs (TBR, SDP, KCR, WSN, SFG for TB, SD, KC, WSH, SF).
  - DRatings still says "Oakland Athletics"; the club has no city in its ESPN
    name at all and Baseball Prospectus files it under "Sacramento".
  - Baseball Prospectus prints BARE CITY NAMES, so "New York", "Chicago" and
    "Los Angeles" each name two different teams. Those three are NOT aliases
    of anything and must never be added as one: BP is read with its division
    block, which is what disambiguates it, and the ingest stores the resolved
    canonical name. A bare-city alias here would silently hand one club the
    other's rating.

  For the same reason MLB does NOT get the NFL's trailing-nickname rule: "Sox"
  belongs to two clubs, and Red Sox / White Sox / Blue Jays are two words.
  Nicknames are listed explicitly instead.
*/
export const MLB_TEAMS = {
  'Baltimore Orioles':     { abbr: 'bal', id: 1,  aliases: ['Orioles'] },
  'Boston Red Sox':        { abbr: 'bos', id: 2,  aliases: ['Red Sox'] },
  'Los Angeles Angels':    { abbr: 'laa', id: 3,  aliases: ['LAA', 'ANA', 'Angels', 'Anaheim Angels', 'Los Angeles Angels of Anaheim'] },
  'Chicago White Sox':     { abbr: 'chw', id: 4,  aliases: ['CWS', 'White Sox'] },
  'Cleveland Guardians':   { abbr: 'cle', id: 5,  aliases: ['Guardians', 'Cleveland Indians'] },
  'Detroit Tigers':        { abbr: 'det', id: 6,  aliases: ['Tigers'] },
  'Kansas City Royals':    { abbr: 'kc',  id: 7,  aliases: ['KCR', 'Royals'] },
  'Milwaukee Brewers':     { abbr: 'mil', id: 8,  aliases: ['Brewers'] },
  'Minnesota Twins':       { abbr: 'min', id: 9,  aliases: ['Twins'] },
  'New York Yankees':      { abbr: 'nyy', id: 10, aliases: ['NYY', 'Yankees'] },
  // No city in the club's name since the Oakland move. DRatings still prints
  // the old one and Baseball Prospectus files it under the current ballpark.
  'Athletics':             { abbr: 'ath', id: 11, aliases: ['OAK', 'ATH', "A's", 'Oakland Athletics', 'Sacramento Athletics', 'Sacramento'] },
  'Seattle Mariners':      { abbr: 'sea', id: 12, aliases: ['Mariners'] },
  'Texas Rangers':         { abbr: 'tex', id: 13, aliases: ['Rangers'] },
  'Toronto Blue Jays':     { abbr: 'tor', id: 14, aliases: ['Blue Jays'] },
  'Atlanta Braves':        { abbr: 'atl', id: 15, aliases: ['Braves'] },
  'Chicago Cubs':          { abbr: 'chc', id: 16, aliases: ['CHC', 'Cubs'] },
  'Cincinnati Reds':       { abbr: 'cin', id: 17, aliases: ['Reds'] },
  'Houston Astros':        { abbr: 'hou', id: 18, aliases: ['Astros'] },
  'Los Angeles Dodgers':   { abbr: 'lad', id: 19, aliases: ['LAD', 'Dodgers'] },
  'Washington Nationals':  { abbr: 'wsh', id: 20, aliases: ['WSN', 'WAS', 'Nationals'] },
  'New York Mets':         { abbr: 'nym', id: 21, aliases: ['NYM', 'Mets'] },
  'Philadelphia Phillies': { abbr: 'phi', id: 22, aliases: ['Phillies'] },
  'Pittsburgh Pirates':    { abbr: 'pit', id: 23, aliases: ['Pirates'] },
  'St. Louis Cardinals':   { abbr: 'stl', id: 24, aliases: ['STL', 'Cardinals', 'Saint Louis Cardinals'] },
  'San Diego Padres':      { abbr: 'sd',  id: 25, aliases: ['SDP', 'Padres'] },
  'San Francisco Giants':  { abbr: 'sf',  id: 26, aliases: ['SFG', 'Giants'] },
  'Colorado Rockies':      { abbr: 'col', id: 27, aliases: ['Rockies'] },
  'Miami Marlins':         { abbr: 'mia', id: 28, aliases: ['Marlins', 'Florida Marlins'] },
  'Arizona Diamondbacks':  { abbr: 'ari', id: 29, aliases: ['ARI', 'Diamondbacks', 'D-backs', 'Dbacks'] },
  'Tampa Bay Rays':        { abbr: 'tb',  id: 30, aliases: ['TBR', 'Rays', 'Tampa Bay Devil Rays'] },
};

export function logoFor(sport, canonical) {
  if (sport === 'nfl') {
    const t = NFL_TEAMS[canonical];
    return t ? `https://a.espncdn.com/i/teamlogos/nfl/500/${t.abbr}.png` : null;
  }
  if (sport === 'mlb') {
    const t = MLB_TEAMS[canonical];
    return t ? `https://a.espncdn.com/i/teamlogos/mlb/500/${t.abbr}.png` : null;
  }
  const t = CFB_TEAMS[canonical];
  return t && t.id ? `https://a.espncdn.com/i/teamlogos/ncaa/500/${t.id}.png` : null;
}

// What stands in when the logo cannot load (a 404, or a host that blocks
// external images). NFL uses the real ESPN abbreviation; CFB falls back to
// initials, since ESPN's CFB abbreviations are not in this table.
export function monoFor(sport, canonical) {
  if (sport === 'nfl') {
    const t = NFL_TEAMS[canonical];
    if (t) return t.abbr.toUpperCase();
  }
  if (sport === 'mlb') {
    const t = MLB_TEAMS[canonical];
    if (t) return t.abbr.toUpperCase();
  }
  const words = canonical.split(' ').filter((w) => w !== '&');
  return (words.length === 1 ? words[0].slice(0, 3) : words.map((w) => w[0]).join(''))
    .slice(0, 4).toUpperCase();
}

const norm = (s) => String(s).toLowerCase().replace(/[^a-z0-9&]+/g, ' ').trim();

function buildIndex(table, sport) {
  const ix = new Map();
  const add = (k, v) => { const n = norm(k); if (n && !ix.has(n)) ix.set(n, v); };
  for (const [canon, meta] of Object.entries(table)) {
    add(canon, canon);
    for (const a of meta.aliases || []) add(a, canon);
    if (sport === 'nfl') {
      // Media outlets print nicknames only ("Seahawks") and models print
      // abbreviations ("LAR"). Every NFL nickname is a single trailing token
      // and unique league-wide, so both forms are unambiguous.
      add(canon.split(' ').pop(), canon);
      add(meta.abbr, canon);
    }
    // MLB gets the abbreviation but NOT the trailing-token rule: "Sox" is two
    // clubs, and Red Sox / White Sox / Blue Jays are two words. Nicknames are
    // listed explicitly in the table instead.
    if (sport === 'mlb') add(meta.abbr, canon);
  }
  return ix;
}
const IX = {
  cfb: buildIndex(CFB_TEAMS, 'cfb'),
  nfl: buildIndex(NFL_TEAMS, 'nfl'),
  mlb: buildIndex(MLB_TEAMS, 'mlb'),
};

// Resolve a source's team string to the canonical name.
// Returns null when it cannot be resolved — the caller must treat that as a
// hard parse failure, never silently drop the row, or a source quietly loses
// teams and every rank beneath the missing one shifts up by one.
export function resolveTeam(sport, raw) {
  const ix = IX[sport];
  const n = norm(raw);
  if (ix.has(n)) return ix.get(n);
  // DRatings appends the mascot ("Ohio State Buckeyes"). Try progressively
  // shorter prefixes, longest first, so "Kansas State Wildcats" resolves to
  // Kansas State rather than Kansas.
  // The prefix walk exists for DRatings' "Ohio State Buckeyes". It is SAFE in
  // football, where a prefix is either a real team or nothing. It is NOT safe
  // in MLB, where "New York Yankees" would fall back to a bare "New York" that
  // names two clubs, so a typo in one source could silently take the other's
  // rating. MLB resolves on the full string and its explicit aliases only.
  if (sport === 'mlb') return null;
  const words = n.split(' ');
  for (let take = words.length - 1; take >= 1; take--) {
    const p = words.slice(0, take).join(' ');
    if (ix.has(p)) return ix.get(p);
  }
  return null;
}

export function teamsFor(sport) {
  if (sport === 'nfl') return NFL_TEAMS;
  if (sport === 'mlb') return MLB_TEAMS;
  return CFB_TEAMS;
}

// ESPN id -> canonical name. Games and lines arrive keyed by ESPN id, which is
// the one join that never needs an alias.
const BY_ID = { cfb: new Map(), nfl: new Map(), mlb: new Map() };
for (const [canon, meta] of Object.entries(CFB_TEAMS)) if (meta.id != null) BY_ID.cfb.set(String(meta.id), canon);
for (const [canon, meta] of Object.entries(NFL_TEAMS)) if (meta.id != null) BY_ID.nfl.set(String(meta.id), canon);
for (const [canon, meta] of Object.entries(MLB_TEAMS)) if (meta.id != null) BY_ID.mlb.set(String(meta.id), canon);
export function teamById(sport, id) {
  return id == null ? null : (BY_ID[sport] && BY_ID[sport].get(String(id))) || null;
}
