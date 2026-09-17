'use client';
import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ChevronUp,
  ChevronDown,
  ArrowLeft,
  Eye,
  Plus,
  X,
  Search,
  Globe,
  Trophy,
  Plane,
  FerrisWheel,
  Trees,
  Car,
  BookOpen,
  Youtube,
  Instagram,
  GraduationCap,
  Drama,
  Gamepad2,
  Music,
  Clapperboard,
  Sparkles,
  LayoutGrid,
  Utensils,
  Wine,
  ShoppingBag,
  Tv,
  ArrowRight,
  ArrowDownUp,
} from 'lucide-react';
import { LISTS, TYPES } from '@/lib/data';
import { voteKey, dedupeByName, getSources, stripItemScore } from '@/lib/helpers';
import { useSampledBg } from '@/lib/useSampledBg';
import { fetchBootstrap, postView } from '@/lib/api';
import Grain from './Grain';
import Footer from './Footer';
import Count from './Count';
import SourcesPopover from './SourcesPopover';
import { HERO_IMAGES } from '@/lib/hero-images';
import { getAllSources } from '@/lib/sources';
import SiteHeader from './SiteHeader';
import { QUIZZES } from '@/lib/quizzes';
import { quizDept as quizDeptOf, quizIcon as quizIconOf, DEPT_COLOR as QUIZ_DEPT_COLOR } from '@/lib/quiz-departments';
import { T } from '@/lib/theme';

// ── HOMEPAGE V2 (June 2026 redesign) ────────────────────────────────────────
// Flip this single flag to false to restore the previous homepage exactly —
// no other change needed (SourcesPopover's `emphasis` prop is also driven by
// it). V2 adds: photo headers on tiles whose consensus top 3 has a hero image
// (from lib/hero-images.js), a sticky ink department-nav bar that replaces the
// Category dropdown (with By City / By Topic panels), and a bold ember
// emphasis on the sources count in the header blurb.
const HOME_V2 = true;

// ── Homepage quiz tiles ──────────────────────────────────────────────────────
// A quiz tile is woven into the list grid at most once every ~5 rows (see the
// interleave logic in Home). Only "factual" quizzes (no paired list, i.e. no
// `listId`) are eligible, since list-backed quizzes already surface through
// their own list tile. quizDeptOf / quizIconOf / QUIZ_DEPT_COLOR MIRROR
// app/quizzes/QuizHomeClient.jsx (deptOf / iconOf / DEPT_COLOR) so the homepage
// tile matches the quizzes-page tile -- keep the two in sync.
const FACTUAL_QUIZZES = (Array.isArray(QUIZZES) ? QUIZZES : []).filter((q) => !q.listId);
// Homepage quiz tiles only surface quizzes that have been completed at least
// this many times (repeats across slots are allowed, since the render loop
// cycles the pool). Once no quiz clears the bar the gate falls back to the
// full factual pool so the tiles never vanish.
const QUIZ_TILE_MIN_PLAYS = 5;

// Human-readable labels for each list type, shown in the top-right of tiles.
const TYPE_LABELS = {
  travel: 'Travel',
  food: 'Food & Drink',
  entertainment: 'Entertainment',
  product: 'Products',
  stores: 'Places',
  other: 'Lists',
};

// Tag-derived sub-labels used when list.category would duplicate the type label.
const TAG_SUBLABELS = {
  bars: 'Bars',
  nightlife: 'Nightlife',
  luxury: 'Luxury',
  tech: 'Tech',
  food: 'Food',
  'food-drink': 'Food & Drink',
  entertainment: 'Entertainment',
  product: 'Products',
};

// Returns { leftLabel, rightLabel } for the tile header row.
// rightLabel = human-readable type.
// leftLabel  = list.category, unless that would duplicate rightLabel,
//              in which case we derive something from tags or the title.
function getTileLabels(list) {
  const rightLabel = TYPE_LABELS[list.type] || 'Lists';
  const cat = list.category || '';
  if (cat.toLowerCase() !== rightLabel.toLowerCase()) {
    return { leftLabel: cat, rightLabel };
  }
  // Conflict: category repeats the type label — find a more specific left label.
  const tags = getListTags(list);
  for (const t of tags) {
    if (TAG_SUBLABELS[t] && TAG_SUBLABELS[t].toLowerCase() !== rightLabel.toLowerCase()) {
      return { leftLabel: TAG_SUBLABELS[t], rightLabel };
    }
  }
  // Last resort: pull the "in X" destination out of the title.
  const m = list.title && list.title.match(/\bin\s+(.+)$/i);
  if (m) return { leftLabel: m[1].replace(/^the\s+/i, ''), rightLabel };
  return { leftLabel: cat, rightLabel };
}

// Medal accents for the top-3 consensus rows on homepage tiles only (gold/silver/bronze).
const RANK_MEDALS = [
  { fill: '#c9a227', num: '#8a6d12', numHover: '#e7cf73' },
  { fill: '#9ca3a8', num: '#6b7278', numHover: '#cfd4d8' },
  { fill: '#a9743f', num: '#7a4f2b', numHover: '#d49a66' },
];

// Get the effective tag set for a list. If `tags` is provided, use it.
// Otherwise fall back to [type] for backward compatibility.
function getListTags(list) {
  if (Array.isArray(list.tags) && list.tags.length > 0) return list.tags;
  if (list.type) return [list.type];
  return [];
}

function listHasTag(list, tagId) {
  return getListTags(list).includes(tagId);
}

// Pick the most similar list to `list` (same city/category + shared tags, with a
// nudge toward same-kind menu-item lists). Used to fill the extra vertical space
// in double-height featured tiles. Returns null when nothing is clearly related.
function findRelatedLists(list, lists, n) {
  const tags = new Set(getListTags(list));
  const scored = [];
  for (const other of lists) {
    if (other.id === list.id) continue;
    let score = 0;
    if (list.category && other.category === list.category) score += 5;
    for (const t of getListTags(other)) if (tags.has(t)) score += 1;
    if (list.picsTerm && other.picsTerm) score += 1;
    scored.push({ other, score });
  }
  // Closest-first, and always return up to n so any leftover space can be
  // filled, even when nothing shares the exact topic.
  scored.sort((a, b) => b.score - a.score);
  return scored.slice(0, n).map((x) => x.other);
}

// Browse categories. Each maps to a set of underlying tags so lists never need
// re-tagging and overlapping tags collapse into one clean filter. 'stores',
// 'nightlife', 'food' etc. remain on lists as internal tags but are no longer
// their own browse buckets.
const CATEGORIES = [
  { id: 'all', label: 'All' },
  // 'any' = belongs if it has any of these tags; 'not' = excluded if it has any of these.
  // Bars carry food-drink/entertainment tags, so Restaurants and Entertainment exclude
  // bars/nightlife to keep a cocktail bar from leaking out of Bars & Nightlife.
  { id: 'restaurants', label: 'Eating', any: ['food', 'food-drink'], not: ['bars', 'nightlife'] },
  { id: 'bars-nightlife', label: 'Drinking', any: ['bars', 'nightlife', 'drinks'] },
  { id: 'travel', label: 'Travel', any: ['travel', 'luxury'] },
  { id: 'shops', label: 'Products', any: ['product', 'tech'] },
  { id: 'entertainment', label: 'Entertainment', any: ['entertainment'] },
  { id: 'misc', label: 'Miscellaneous', any: ['other'] },
];
const CAT_BY_ID = Object.fromEntries(CATEGORIES.map((c) => [c.id, c]));

// Filter-chip color coding — each broad category and each By Topic chip is
// tinted with a parent color so the connection between the top row and the
// topic row is visible at a glance. Cities and regions stay uncolored (they
// cut across categories). Inactive chips get a soft tinted background + a
// colored border; the active chip flips to the solid parent color with cream
// text. The five new tones extend the existing palette (ember, rust, forest,
// faded) with slate (Products) and plum (Entertainment).
const PARENT_COLORS = {
  restaurants: T.danger,      // ember — Eating
  'bars-nightlife': '#a44a26', // rust — Drinking
  travel: '#3d4f2b',           // forest — Hotels & Travel
  shops: '#3a5670',            // slate — Products
  entertainment: '#6b3a5a',    // plum — Entertainment
  misc: '#7a6f5e',             // faded — Miscellaneous
};
// Precomputed 12% parent tint over cream (#f4ede0). Inlined as hex so we
// don't depend on color-mix browser support.
const PARENT_TINTS = {
  restaurants: '#eed7ca',
  'bars-nightlife': '#ead9ca',
  travel: '#dedaca',
  shops: '#dddbd2',
  entertainment: '#e3d7d0',
  misc: '#e5ded0',
};
// Topic chip → parent category. Chains & Groceries lives under Eating since
// the bulk of its hits (TJ's, Spindrift, snacks, seltzer, grocery) are food.
const TOPIC_PARENT = {
  'topic-pizza': 'restaurants',
  'topic-burgers': 'restaurants',
  'topic-tacos': 'restaurants',
  'topic-bbq': 'restaurants',
  'topic-sushi': 'restaurants',
  'topic-breakfast': 'restaurants',
  'topic-dive-bars': 'bars-nightlife',
  'topic-cocktails': 'bars-nightlife',
  'topic-beer': 'bars-nightlife',
  'topic-spirits': 'bars-nightlife',
  'topic-hotels': 'travel',
  'topic-beaches': 'travel',
  'topic-movies': 'entertainment',
  'topic-tv': 'entertainment',
  'topic-books': 'entertainment',
  'topic-music': 'entertainment',
  'topic-sports': 'entertainment',
  'topic-tech': 'shops',
  'topic-kitchen-home': 'shops',
  'topic-chains': 'restaurants',
};
function parentIdFor(filterId) {
  if (TOPIC_PARENT[filterId]) return TOPIC_PARENT[filterId];
  if (PARENT_COLORS[filterId]) return filterId;
  return null;
}

function listInCategory(list, catId) {
  const cat = CAT_BY_ID[catId];
  if (!cat || cat.id === 'all' || !cat.any) return true;
  // Broad-bucket overrides (owner rule, 2026-06-19) win over the raw tag set so a
  // list lands in exactly one browse bucket. See overrideBucket below.
  const ob = overrideBucket(list);
  if (ob) return ob === catId;
  const tags = getListTags(list);
  if (cat.not && cat.not.some((t) => tags.includes(t))) return false;
  return cat.any.some((t) => tags.includes(t));
}

// Broad browse-bucket overrides (owner rule, 2026-06-19) win over the raw tag
// set so each list lands in exactly one broad bucket:
//   - Products: anything with an Amazon ASIN product link OR a product/tech tag,
//     EXCEPT movies, music, and books (those stay Entertainment).
//   - Miscellaneous: fast-food/casual chain menu-item lists and residential
//     "suburbs" exclusivity lists (e.g. Most Exclusive Boston Suburbs).
//   - Media (movies/music/books) carrying a stray product/tech tag is forced
//     back to Entertainment so it never sits under Products.
// A null return falls through to the default tag logic so nothing else changes.
function isAmazonProductList(list) {
  if (list.linkType === 'amazon') return true;
  const links = list.links || {};
  for (const k in links) {
    if (/amazon\.[a-z.]+\/(dp|gp\/product)\//i.test(links[k] || '')) return true;
  }
  return false;
}
// Movies / music / books. Cookbooks are intentionally NOT treated as media
// (owner ruling 2026-06-19: cookbook lists stay under Products).
function isMediaList(list) {
  const t = ttext(list);
  const c = list.category || '';
  if (list.linkType === 'imdb') return true;
  if (/\bfilms?\b|\bmovies?\b|cinema|directed by|\bdirector\b|\btv\b|television|\bhbo\b|sitcom|docuseries|miniseries/.test(t)) return true;
  if (['Film', 'Cinema', 'TV', 'Television', 'True Crime'].includes(c) || /^Movies/.test(c)) return true;
  if (/\bsongs?\b|\balbums?\b|soundtracks?\b|\bmusic\b/.test(t)) return true;
  if (/\bbooks?\b|\bnovels?\b|memoirs?|biograph|\bfiction\b|nonfiction|non-fiction|poetry/.test(t)) return true;
  if (c === 'Books') return true;
  return false;
}
// Residential exclusivity lists (e.g. "Most Exclusive Boston Suburbs"). Scoped
// to the word "suburb" so resort/college/beach TOWN lists stay under Travel.
function isResidentialSuburbList(list) {
  return /\bsuburbs?\b/.test(ttext(list));
}
// Store-brand packaged grocery lists (Trader Joe's snacks/frozen meals, etc.)
// are products you buy, not restaurants (owner rule, 2026-06-19).
function isPackagedGroceryList(list) {
  return /\btrader joe'?s\b/.test(ttext(list));
}
function overrideBucket(list) {
  if (isChainRestaurantList(list) || isResidentialSuburbList(list)) return 'misc';
  if (isMediaList(list)) {
    if (listHasTag(list, 'product') || listHasTag(list, 'tech')) return 'entertainment';
    return null;
  }
  if (listHasTag(list, 'product') || listHasTag(list, 'tech') || isAmazonProductList(list) || isPackagedGroceryList(list)) return 'shops';
  return null;
}

// ── Narrow browse filters (mega-menu) ───────────────────────────────────────────
// The category dropdown shows the broad CATEGORIES above as its top row, then
// narrower cuts below: By City, By Region, By Topic. Cities are derived from
// list.category via this normalization map (neighborhoods and naming variants
// roll up into their city). A city only appears in the menu once it has 2+
// lists, so this map can stay generous.
const CITY_CANON = {
  'New York': 'New York',
  'Williamsburg, Brooklyn': 'New York',
  'Greenpoint, Brooklyn': 'New York',
  'East Village': 'New York',
  'West Village': 'New York',
  'Greenwich Village': 'New York',
  'SoHo': 'New York',
  'Boston': 'Boston',
  'Miami': 'Miami',
  'Miami Beach': 'Miami',
  'Chicago': 'Chicago',
  'Atlanta': 'Atlanta',
  'Austin': 'Austin',
  'London': 'London',
  'Tokyo': 'Tokyo',
  'The Hamptons': 'The Hamptons',
  'Hamptons': 'The Hamptons',
  'Los Angeles': 'Los Angeles',
  'Savannah': 'Savannah',
  'New Orleans': 'New Orleans',
  'Tampa': 'Tampa Bay',
  'Tampa Bay': 'Tampa Bay',
  'San Diego': 'San Diego',
  'Buffalo': 'Buffalo',
  'Monaco': 'Monaco',
  'Las Vegas': 'Las Vegas',
  'San Francisco': 'San Francisco',
  'Dallas': 'Dallas',
  'Denver': 'Denver',
  'Charlotte': 'Charlotte',
  'Orlando': 'Orlando',
  'Washington DC': 'Washington DC',
  'Asheville': 'Asheville',
  'Jacksonville': 'Jacksonville',
  'Nashville': 'Nashville',
  'New Haven': 'New Haven',
  'Philadelphia': 'Philadelphia',
  'Cape Cod': 'Cape Cod',
  'Montreal': 'Montreal',
  'Toronto': 'Toronto',
  'Paris': 'Paris',
  'Barcelona': 'Barcelona',
  'Amsterdam': 'Amsterdam',
  'Copenhagen': 'Copenhagen',
  'Prague': 'Prague',
  'Oslo': 'Oslo',
  'Helsinki': 'Helsinki',
  'Athens': 'Athens',
  'Istanbul': 'Istanbul',
  'Kyiv': 'Kyiv',
  'St. Petersburg': 'St. Petersburg',
  'Shanghai': 'Shanghai',
  'Hong Kong': 'Hong Kong',
  'Tel Aviv': 'Tel Aviv',
  'Abu Dhabi': 'Abu Dhabi',
  'Bali': 'Bali',
  'Sydney': 'Sydney',
  'Tulum': 'Tulum',
  'Cabo San Lucas': 'Cabo San Lucas',
  'Buenos Aires': 'Buenos Aires',
  'Marrakesh': 'Marrakesh',
  'Casablanca': 'Casablanca',
  'Cape Town': 'Cape Town',
  'Rio de Janeiro': 'Rio de Janeiro',
  'Sao Paulo': 'Sao Paulo',
  'Santiago': 'Santiago',
  'Cartagena': 'Cartagena',
};
const cityFilterId = (city) => 'city-' + city.toLowerCase().replace(/[^a-z0-9]+/g, '-');

// Region cuts match on raw list.category OR the canonical city, so both
// country-level categories ('Greece', 'Italy') and city lists land in them.
const REGION_FILTERS = [
  { id: 'region-us-regional', label: 'US Regional', cats: ['USA', 'Florida', 'Texas', 'Ohio', 'Kentucky', 'New England', 'Cape Cod', 'The Hamptons'] },
  { id: 'region-europe', label: 'Europe', cats: ['London', 'Paris', 'Barcelona', 'Amsterdam', 'Copenhagen', 'Prague', 'Oslo', 'Helsinki', 'Athens', 'Istanbul', 'Kyiv', 'St. Petersburg', 'Monaco', 'Greece', 'Greek Islands', 'Italy', 'France', 'Spain', 'Croatia', 'Alps', 'Mediterranean', 'Turkey'] },
  { id: 'region-asia-pacific', label: 'Asia & Pacific', cats: ['Tokyo', 'Shanghai', 'Hong Kong', 'Bali', 'Sydney', 'South Pacific'] },
  { id: 'region-mideast-africa', label: 'Middle East & Africa', cats: ['Tel Aviv', 'Abu Dhabi', 'Marrakesh', 'Casablanca', 'Cape Town'] },
  { id: 'region-latam', label: 'Latin America & Caribbean', cats: ['Tulum', 'Cabo San Lucas', 'Buenos Aires', 'Rio de Janeiro', 'Sao Paulo', 'Santiago', 'Cartagena'] },
].map((r) => ({
  ...r,
  match: (l) => r.cats.includes(l.category) || r.cats.includes(CITY_CANON[l.category]),
}));

// Topic cuts match on title + id keywords (and category where cleaner).
const ttext = (l) => `${l.title || ''} ${l.id || ''}`.toLowerCase();
const TOPIC_FILTERS = [
  { id: 'topic-pizza', label: 'Pizza', match: (l) => /pizza/.test(ttext(l)) },
  { id: 'topic-burgers', label: 'Burgers', match: (l) => /burger/.test(ttext(l)) },
  { id: 'topic-tacos', label: 'Tacos & Mexican', match: (l) => /taco|mexican|burrito/.test(ttext(l)) },
  { id: 'topic-bbq', label: 'BBQ & Steak', match: (l) => /bbq|barbecue|steak/.test(ttext(l)) },
  { id: 'topic-sushi', label: 'Sushi & Ramen', match: (l) => /sushi|ramen|omakase/.test(ttext(l)) },
  { id: 'topic-breakfast', label: 'Breakfast & Coffee', match: (l) => /brunch|breakfast|bagel|coffee|cafe/.test(ttext(l)) },
  { id: 'topic-dive-bars', label: 'Dive Bars', match: (l) => /dive.bar/.test(ttext(l)) },
  { id: 'topic-cocktails', label: 'Cocktail Bars', match: (l) => /cocktail/.test(ttext(l)) },
  { id: 'topic-beer', label: 'Breweries & Beer', match: (l) => /brewer|beer/.test(ttext(l)) },
  { id: 'topic-spirits', label: 'Wine & Spirits', match: (l) => /wine|whiskey|whisky|\bgins?\b|vodka|tequila|scotch|distiller|bourbon/.test(ttext(l)) },
  { id: 'topic-hotels', label: 'Hotels & Resorts', match: (l) => /hotel|resort|lodge|villa/.test(ttext(l)) },
  { id: 'topic-beaches', label: 'Beaches & Beach Clubs', match: (l) => /beach/.test(ttext(l)) },
  { id: 'topic-movies', label: 'Movies', match: (l) => /\bfilms?\b|movies?|director/.test(ttext(l)) || ['Film', 'Cinema'].includes(l.category) || /^Movies/.test(l.category || '') },
  { id: 'topic-tv', label: 'TV Shows', match: (l) => /\btv\b|television|hbo|docuseries|sitcom/.test(ttext(l)) || ['TV', 'Television', 'True Crime'].includes(l.category) },
  { id: 'topic-books', label: 'Books', match: (l) => ['Books', 'Cookbooks'].includes(l.category) || /\bbooks?\b|novels?|memoirs?/.test(ttext(l)) },
  { id: 'topic-music', label: 'Music', match: (l) => /\bsongs?\b|albums?|music/.test(ttext(l)) },
  { id: 'topic-sports', label: 'Sports & Outdoors', match: (l) => ['Sports', 'Outdoors', 'Golf', 'College Football', 'Formula 1', 'Fitness'].includes(l.category) || /golf|stadium|football|basketball|whitewater|campground|national park|running shoe|fight song/.test(ttext(l)) },
  { id: 'topic-tech', label: 'Tech & Audio', match: (l) => ['Tech', 'Audio'].includes(l.category) },
  { id: 'topic-kitchen-home', label: 'Kitchen & Home', match: (l) => ['Kitchen', 'Home', 'Sleep'].includes(l.category) },
  { id: 'topic-chains', label: 'Chains & Groceries', match: (l) => ['Fast Food', 'Casual Dining', 'Costco', 'Grocery', 'Frozen Food', 'Snacks', 'Seltzer', 'Beverages'].includes(l.category) || /fast.food|menu items|trader joe/.test(ttext(l)) },
];
const NARROW_BY_ID = Object.fromEntries(
  [...REGION_FILTERS, ...TOPIC_FILTERS].map((f) => [f.id, f])
);

// One filter test for every kind of browse filter (broad category, city,
// region, topic). Unknown ids fail open so a stale id can never blank the page.
function matchesBrowseFilter(list, id) {
  if (!id || id === 'all') return true;
  if (CAT_BY_ID[id]) return listInCategory(list, id);
  if (id.startsWith('city-')) {
    const city = CITY_CANON[list.category];
    return !!city && cityFilterId(city) === id;
  }
  const f = NARROW_BY_ID[id];
  return f ? f.match(list) : true;
}

// A "product list" for homepage placement = anything in the Products browse
// bucket (physical products or tech). Used to keep a product list from ever
// being the first or second tile on the default Discover view, so a fresh
// visitor never lands on a product list first.
function isProductList(list) {
  return listInCategory(list, 'shops');
}

// A "chain restaurant list" for homepage placement = a list whose subject is a
// fast-food or casual-dining chain (e.g. "Best Wendy's Menu Items", "Best-Run
// McDonald's in Manhattan"). These read as too low-brow to headline the page, so
// they are held out of the first two rows of the default Discover view (owner
// rule, 2026-06-19). Detection is by brand name in the title, since such lists
// can also arrive as reader submissions that carry no special tag.
const CHAIN_BRANDS = [
  'mcdonald', 'wendy', 'burger king', 'taco bell', 'panda express', 'chipotle',
  'chick-fil-a', 'chick fil a', 'popeyes', 'kfc', 'kentucky fried chicken',
  'starbucks', 'dunkin', 'domino', 'pizza hut', 'little caesar', 'papa john',
  'arby', 'sonic drive', 'five guys', 'in-n-out', 'in n out', 'shake shack',
  'whataburger', 'raising cane', 'jack in the box', "carl's jr", 'carls jr',
  'hardee', 'dairy queen', 'jersey mike', 'jimmy john', 'firehouse subs',
  'panera', 'tim hortons', "chili's", 'chilis', 'olive garden', 'outback',
  'applebee', 'ihop', 'denny', 'cracker barrel', 'cheesecake factory',
  'buffalo wild wings', 'wingstop', 'red lobster', 'red robin', 'texas roadhouse',
  "chang's", 'waffle house', 'white castle', 'del taco', 'el pollo loco', 'qdoba',
  "moe's southwest", 'culver', 'bojangles', 'zaxby', 'checkers', 'krispy kreme',
  'auntie anne', 'cinnabon', 'baskin', 'cold stone', 'jamba juice', 'smoothie king',
  'wawa', 'sheetz', 'dutch bros', 'caribou coffee', "peet's coffee", 'krystal',
];
function isChainRestaurantList(list) {
  const t = (list.title || '').toLowerCase();
  // Subway the sandwich chain, but never the transit system (e.g. "Best
  // Breweries on the NYC Subway System").
  if (
    /\bsubway\b/.test(t) &&
    !/subway\s*(system|station|line|stop|train|car|map|series|tile)/.test(t) &&
    /(sandwich|sub|menu|order|footlong)/.test(t)
  ) {
    return true;
  }
  return CHAIN_BRANDS.some((b) => t.includes(b));
}

// First two rows of the default Discover view show ONLY restaurants / specialty
// food (the Eating bucket) or lodging (the Travel bucket). Bars and dive bars,
// products/tech, movies and other entertainment, and miscellaneous are held back
// to later rows. Exclusions win over overlap: a list also tagged as a product or
// a bar is treated as such and excluded even if it carries a food/travel tag.
function leadEligible(list) {
  if (isChainRestaurantList(list)) return false;
  if (isProductList(list)) return false;
  if (listInCategory(list, 'bars-nightlife')) return false;
  return listInCategory(list, 'restaurants') || listInCategory(list, 'travel');
}

// Resolve a comparable timestamp for a list, in priority order:
//   1. publishedAt   (full ISO string on built-in lists)
//   2. submittedAt   (Supabase timestamptz on reader submissions)
//   3. publishedDate (legacy date-only field, parsed as noon UTC so it
//      sorts predictably against full timestamps)
// Returns a millisecond epoch number. Lists with no timestamp at all
// get 0 so they end up last in recency sort.
function getListTimestamp(list) {
  if (list.publishedAt) {
    const t = new Date(list.publishedAt).getTime();
    if (!Number.isNaN(t)) return t;
  }
  if (list.submittedAt) {
    const t = new Date(list.submittedAt).getTime();
    if (!Number.isNaN(t)) return t;
  }
  if (list.publishedDate) {
    const t = new Date(list.publishedDate + 'T12:00:00Z').getTime();
    if (!Number.isNaN(t)) return t;
  }
  return 0;
}

// Seeded Fisher-Yates so Discover stays put across re-renders within a
// single page view (typing in the search bar, hovering a tile) but
// reshuffles on every fresh page load since the seed comes from
// Date.now() captured once on mount.
function seededShuffle(arr, seed) {
  const out = arr.slice();
  let s = seed >>> 0 || 1;
  for (let i = out.length - 1; i > 0; i--) {
    // xorshift32
    s ^= s << 13;
    s ^= s >>> 17;
    s ^= s << 5;
    const j = (s >>> 0) % (i + 1);
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

function Home({ lists, viewCounts, voteData, extras, trending = {}, openList, onSubmit }) {
  // One-shot restore payload, written when the user opens a list (see saveScroll).
  // Lets Back return to the same Discover order, filters, search, and scroll spot.
  const restoreRef = useRef(null);
  if (restoreRef.current === null) {
    restoreRef.current = (() => {
      try {
        const raw = typeof window !== 'undefined' && sessionStorage.getItem('sot-home-restore');
        return raw ? JSON.parse(raw) : false;
      } catch (e) { return false; }
    })();
  }
  const restore = restoreRef.current || null;

  const [query, setQuery] = useState(restore?.query || '');
  const [typeFilter, setTypeFilter] = useState(restore?.typeFilter || 'all');
  const [catOpen, setCatOpen] = useState(false);
  const [sortOpen, setSortOpen] = useState(false);
  // V2 department-nav dropdown panel: null | 'city' | 'topic'
  const [navMenu, setNavMenu] = useState(null);
  const [filtersOpen, setFiltersOpen] = useState(false);
  // Horizontal-scroll affordance for the department nav ribbon: tracks whether
  // there is more content to scroll to the left / right, so we can show a small
  // arrow indicator (mobile users otherwise can't tell the ribbon scrolls).
  const deptNavRef = useRef(null);
  const [navScroll, setNavScroll] = useState({ left: false, right: false });
  useEffect(() => {
    const el = deptNavRef.current;
    if (!el) return undefined;
    const update = () => {
      const more = el.scrollWidth - el.clientWidth;
      setNavScroll({
        left: el.scrollLeft > 2,
        right: more > 2 && el.scrollLeft < more - 2,
      });
    };
    update();
    el.addEventListener('scroll', update, { passive: true });
    window.addEventListener('resize', update);
    return () => {
      el.removeEventListener('scroll', update);
      window.removeEventListener('resize', update);
    };
    // typeFilter changes the set of nav buttons, so re-measure when it does.
  }, [typeFilter, navMenu]);
  // Default sort is the shuffled "Discover" view.
  const [sortBy, setSortBy] = useState(restore?.sortBy || 'discover');

  // Fresh seed per page load — captured once on mount. Stays stable while
  // the user interacts with the page (so the order doesn't reshuffle
  // when typing in search), but a reload picks a new seed and a new
  // order.
  const [discoverSeed] = useState(
    () => (restore && typeof restore.seed === 'number')
      ? (restore.seed >>> 0)
      : (Date.now() ^ Math.floor(Math.random() * 0xffffffff)) >>> 0
  );

  // Featured quiz (V2): a single quiz spotlighted at the end of the stats row,
  // linking to /quiz/<id>. A fresh one is picked at random on every page load
  // (client-side, in an effect, so it never causes a hydration mismatch).
  const [featuredQuiz, setFeaturedQuiz] = useState(null);
  useEffect(() => {
    if (!HOME_V2 || !Array.isArray(QUIZZES) || QUIZZES.length === 0) return;
    setFeaturedQuiz(QUIZZES[Math.floor(Math.random() * QUIZZES.length)]);
  }, []);

  // Per-quiz completed-game counts (from /api/quiz/totals). Used to gate the
  // interleaved homepage quiz tiles to quizzes that have been played at least
  // QUIZ_TILE_MIN_PLAYS times (see shuffledQuizzes). Empty until the fetch
  // resolves, which simply means the gate is inactive on first paint.
  const [quizPlays, setQuizPlays] = useState({});
  const [quizLeaders, setQuizLeaders] = useState({});
  useEffect(() => {
    let alive = true;
    fetch('/api/quiz/totals')
      .then((r) => r.json())
      .then((d) => { if (alive && d && !d.error) { setQuizPlays(d.byQuiz || {}); setQuizLeaders(d.topLeaders || {}); } })
      .catch(() => {});
    return () => { alive = false; };
  }, []);

  // Recompute shuffle order when the lists collection or seed changes.
  const discoverOrder = useMemo(() => {
    return seededShuffle(lists, discoverSeed);
  }, [lists, discoverSeed]);

  // Save the current view + scroll position before navigating to a list, so
  // Back can restore the exact spot (Home otherwise remounts with a new seed).
  const saveScroll = useCallback(() => {
    try {
      sessionStorage.setItem('sot-home-restore', JSON.stringify({
        seed: discoverSeed, sortBy, typeFilter, query,
        scrollY: window.scrollY || window.pageYOffset || 0,
      }));
    } catch (e) {}
  }, [discoverSeed, sortBy, typeFilter, query]);

  // If we mounted with a restore payload (a Back navigation), pin the viewport to
  // the saved offset until the layout settles. A single jump drifts because the
  // page keeps reflowing after first paint (web-font swap, related-list sub-boxes
  // filling in), so we re-apply on every animation frame until the document height
  // has been stable for a moment, then stop. We bail the instant the user scrolls
  // or keys so we never fight them, and cap the whole thing with a hard budget.
  useEffect(() => {
    try { if ('scrollRestoration' in history) history.scrollRestoration = 'manual'; } catch (e) {}
    try { sessionStorage.removeItem('sot-home-restore'); } catch (e) {}
    if (!restore || typeof restore.scrollY !== 'number' || restore.scrollY <= 0) { try { window.scrollTo(0, 0); } catch (e) {} return undefined; }
    if (typeof window === 'undefined' || typeof requestAnimationFrame === 'undefined') return undefined;
    const targetY = restore.scrollY;
    const HARD_BUDGET = 4000; // ms — give up if the page never settles
    const STABLE_MS = 350;    // height unchanged this long === settled
    let cancelled = false;
    let raf = 0;
    let lastH = -1;
    let stableSince = 0;
    const start = performance.now();
    const onUser = () => stop();
    function detach() {
      window.removeEventListener('wheel', onUser);
      window.removeEventListener('touchmove', onUser);
      window.removeEventListener('keydown', onUser);
    }
    function stop() {
      if (cancelled) return;
      cancelled = true;
      if (raf) cancelAnimationFrame(raf);
      detach();
    }
    const tick = (now) => {
      if (cancelled) return;
      const h = document.documentElement.scrollHeight;
      if (h !== lastH) { lastH = h; stableSince = now; }
      if (Math.abs(window.scrollY - targetY) > 1) window.scrollTo(0, targetY);
      const settled = (now - stableSince) >= STABLE_MS && Math.abs(window.scrollY - targetY) <= 1;
      if (settled || (now - start) >= HARD_BUDGET) { stop(); return; }
      raf = requestAnimationFrame(tick);
    };
    window.addEventListener('wheel', onUser, { passive: true });
    window.addEventListener('touchmove', onUser, { passive: true });
    window.addEventListener('keydown', onUser);
    // Re-baseline the stability window once web fonts finish (they reflow text).
    if (document.fonts && document.fonts.ready && typeof document.fonts.ready.then === 'function') {
      document.fonts.ready.then(() => { if (!cancelled) { lastH = -1; } });
    }
    raf = requestAnimationFrame(tick);
    return () => stop();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Close the category / sort dropdowns when clicking anywhere outside.
  useEffect(() => {
    if (!catOpen && !sortOpen && !navMenu && !filtersOpen) return undefined;
    const close = () => {
      setCatOpen(false);
      setSortOpen(false);
      setNavMenu(null);
      setFiltersOpen(false);
    };
    document.addEventListener('click', close);
    return () => document.removeEventListener('click', close);
  }, [catOpen, sortOpen, navMenu, filtersOpen]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return lists.filter((list) => {
      if (typeFilter !== 'all' && !matchesBrowseFilter(list, typeFilter)) return false;
      if (!q) return true;
      const hay = [
        list.title,
        list.category,
        list.blurb,
        ...Object.values(list.sources || {}).flatMap((s) => s.items),
        ...(list.vote?.items || []),
      ]
        .join(' ')
        .toLowerCase();
      // Match every word in the query, in any order (so "boston burger"
      // and "burger boston" both match "Best Burger in Boston").
      const tokens = q.split(/\s+/).filter(Boolean);
      return tokens.every((t) => hay.includes(t));
    });
  }, [lists, query, typeFilter]);

  // gridCols (measured below) is read by the Discover lead rule, so the state
  // is declared here, before `sorted`, to stay out of the temporal dead zone.
  // The ResizeObserver that updates it lives further down.
  const [gridCols, setGridCols] = useState(0);
  const sorted = useMemo(() => {
    if (sortBy === 'discover') {
      // Preserve the precomputed shuffle order; just keep entries that
      // survived the current filter.
      const allowed = new Set(filtered);
      const order = discoverOrder.filter((l) => allowed.has(l));
      // Rule: the first two rows of the Discover landing show ONLY eating or
      // lodging lists (no products, no bars/dive bars, no movies/entertainment,
      // no misc). For each slot in those opening two rows, if an ineligible list
      // sits there, pull up the nearest later eligible list to take its place;
      // the rest of the shuffle is otherwise preserved. The findIndex guard (-1)
      // leaves the order untouched when there aren't enough eligible lists (e.g.
      // a Products or Movies filter is active), so the rule degrades gracefully.
      // gridCols is 0 before the grid is measured (server + first paint); assume
      // a 4-wide desktop grid until then so SSR and first client render match.
      const cols = gridCols > 0 ? gridCols : 4;
      // Reserve the opening two desktop rows (2 * cols) for eating/lodging leads.
      // On a single-column mobile layout that would be only 2 tiles, so floor the
      // reservation at 7 so the first ~7 mobile slides follow the same lead rule
      // (owner rule, 2026-06-19). Wider grids already exceed 7, so unchanged.
      const leadCount = Math.min(Math.max(2 * cols, 7), order.length);
      for (let i = 0; i < leadCount; i++) {
        if (leadEligible(order[i])) continue;
        const j = order.findIndex((l, k) => k > i && leadEligible(l));
        if (j === -1) break;
        const [moved] = order.splice(j, 1);
        order.splice(i, 0, moved);
      }
      return order;
    }
    return [...filtered].sort((a, b) => {
      if (sortBy === 'trending') {
        const ta = trending[a.id] || 0;
        const tb = trending[b.id] || 0;
        if (tb !== ta) return tb - ta;
        return lists.indexOf(a) - lists.indexOf(b);
      }
      if (sortBy === 'recent') {
        const ta = getListTimestamp(a);
        const tb = getListTimestamp(b);
        if (tb !== ta) return tb - ta;
        // Same timestamp: fall back to original array order
        return lists.indexOf(a) - lists.indexOf(b);
      }
      // 'popularity' (viewCount)
      const va = viewCounts[a.id] || 0;
      const vb = viewCounts[b.id] || 0;
      if (vb !== va) return vb - va;
      return lists.indexOf(a) - lists.indexOf(b);
    });
  }, [filtered, viewCounts, trending, lists, sortBy, discoverOrder, gridCols]);

  // Mark some lists as "featured": double-height tiles that preview the full
  // top 10 instead of the top 3. A cooldown of 5 guarantees at least 5 lists
  // between featured tiles, which keeps at most one featured tile per row for any
  // layout up to 5 columns. The selection is SEEDED from discoverSeed (xorshift32,
  // same family as seededShuffle) — never Math.random() — so the double/single
  // tile pattern is identical on a Back navigation (the seed is restored). With
  // raw Math.random() the featured set re-rolled on every remount, so tiles
  // flipped between double and single height, the page reflowed, and the restored
  // scrollY landed on different content. Re-derives whenever the seed or sorted
  // set changes.
  const featuredIds = useMemo(() => {
    const set = new Set();
    let s = ((discoverSeed >>> 0) ^ 0x9e3779b9) >>> 0 || 1;
    const rand = () => {
      s ^= s << 13; s ^= s >>> 17; s ^= s << 5;
      return (s >>> 0) / 0x100000000;
    };
    let cooldown = 0;
    for (let i = 0; i < sorted.length; i++) {
      if (cooldown > 0) { cooldown--; continue; }
      if (rand() < 0.5) { set.add(sorted[i].id); cooldown = 5; }
    }
    return set;
  }, [sorted, discoverSeed]);

  // ── Interleaved quiz tiles ────────────────────────────────────────────────
  // Weave a factual (list-less) quiz tile into the grid at most once every ~5
  // rows. "Rows" depend on the live column count of the responsive auto-fill
  // grid, so measure it (ResizeObserver) rather than guessing. gridCols starts
  // at 0 (server + first client render), so no quiz tile is emitted until after
  // mount, keeping SSR and hydration identical. Each slot shows a DIFFERENT
  // factual quiz; the pool is shuffled with a seed derived from discoverSeed, so
  // picks are random per fresh load but stable across a Back navigation.
  const gridRef = useRef(null);
  useEffect(() => {
    const el = gridRef.current;
    if (!el) { setGridCols(0); return; }
    const measure = () => {
      const tracks = getComputedStyle(el).gridTemplateColumns.split(' ').filter(Boolean).length;
      setGridCols(tracks || 1);
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, [sorted.length]);

  const shuffledQuizzes = useMemo(() => {
    // Gate to quizzes with >= QUIZ_TILE_MIN_PLAYS completed games; fall back to
    // the full factual pool only when none qualify yet (including before the
    // play-count fetch resolves).
    const eligible = FACTUAL_QUIZZES.filter((q) => q.id === 'nyc-restaurant-geo-guesser' || q.id === 'nyc-restaurant-geo-guesser-pt-2' || q.id === 'nyc-restaurant-geo-guesser-pt-3' || q.id === 'nyc-pizza-geo-finder' || q.id === 'nyc-burger-geo-finder' || q.id === 'nyc-parks-geo-finder' || q.id === 'boston-restaurant-geo-guesser' || q.id === 'nyc-landmarks-geo-guesser' || q.id === 'boston-landmarks-geo-guesser' || q.id === 'hamptons-geo-guesser-pt-1' || q.id === 'hamptons-geo-guesser-pt-2' || q.id === 'paris-landmarks-geo-guesser-pt-1' || q.id === 'paris-landmarks-geo-guesser-pt-2' || q.id === 'london-landmarks-geo-guesser-pt-1' || q.id === 'london-landmarks-geo-guesser-pt-2' || q.id === 'atlanta-restaurant-geo-guesser' || q.id === 'miami-restaurant-geo-guesser' || q.id === 'orlando-amusement-park-ride-geo-guesser' || q.id === 'san-francisco-landmarks-geo-guesser-pt-1' || q.id === 'san-francisco-landmarks-geo-guesser-pt-2' || q.id === 'key-west-geo-guesser' || q.id === 'las-vegas-casino-geo-guesser' || (quizPlays[q.id] || 0) >= QUIZ_TILE_MIN_PLAYS);
    const arr = (eligible.length ? eligible : FACTUAL_QUIZZES).slice();
    let s = ((discoverSeed >>> 0) ^ 0x85ebca6b) >>> 0 || 1;
    const rand = () => { s ^= s << 13; s ^= s >>> 17; s ^= s << 5; return (s >>> 0) / 0x100000000; };
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(rand() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  }, [discoverSeed, quizPlays]);

  const totalViews = Object.values(viewCounts).reduce((a, b) => a + b, 0);

  // Total sources shown in the header: every named (non-'ai') source across
  // every list. Native voting removed (2026-06-18), so the crowd signal now
  // comes through aggregator sources (Yelp/Google) counted here.
  // Canonical sources count = distinct PUBLICATIONS behind the consensus
  // (deduped by domain, synthetic sources excluded), the same roster the
  // SourcesPopover / /sources page use. Not the raw per-list source-entry sum.
  const totalSources = useMemo(() => getAllSources().length, []);

  // Count lists per tag (a list can contribute to multiple tag counts)
  const counts = useMemo(() => {
    const out = { all: lists.length };
    CATEGORIES.forEach((c) => {
      if (c.id === 'all') return;
      out[c.id] = lists.filter((l) => listInCategory(l, c.id)).length;
    });
    [...REGION_FILTERS, ...TOPIC_FILTERS].forEach((f) => {
      out[f.id] = lists.filter(f.match).length;
    });
    return out;
  }, [lists]);

  // Only show tag chips that have at least one matching list (skip empty buckets)
  const visibleTypes = useMemo(() => {
    return CATEGORIES.filter((t) => t.id === 'all' || (counts[t.id] || 0) > 0);
  }, [counts]);

  // Cities for the mega-menu, derived from list.category via CITY_CANON.
  // A city needs 2+ lists to earn a chip; ordered by count, then A-Z.
  const cityFilters = useMemo(() => {
    const byCity = new Map();
    lists.forEach((l) => {
      const city = CITY_CANON[l.category];
      if (!city) return;
      byCity.set(city, (byCity.get(city) || 0) + 1);
    });
    return [...byCity.entries()]
      .filter(([, n]) => n >= 2)
      .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
      .map(([city, n]) => ({ id: cityFilterId(city), label: city, count: n }));
  }, [lists]);

  // Regions / topics need 2+ matching lists to show.
  const visibleRegions = useMemo(
    () => REGION_FILTERS.filter((f) => (counts[f.id] || 0) >= 2),
    [counts]
  );
  const visibleTopics = useMemo(
    () => TOPIC_FILTERS.filter((f) => (counts[f.id] || 0) >= 2),
    [counts]
  );

  // Resolve the active filter's label for the Category button, across every
  // group (broad, city, region, topic).
  const activeFilterLabel = useMemo(() => {
    const all = [...visibleTypes, ...cityFilters, ...visibleRegions, ...visibleTopics];
    const f = all.find((x) => x.id === typeFilter);
    return (f && f.label) || 'All';
  }, [visibleTypes, cityFilters, visibleRegions, visibleTopics, typeFilter]);

  const sortButtons = [
    { id: 'discover', label: 'Discover', short: 'Discover' },
    { id: 'trending', label: 'Trending', short: 'Trending' },
    { id: 'popularity', label: 'Most Popular', short: 'Popular' },
    { id: 'recent', label: 'Most Recently Added', short: 'Recent' },
  ];

  const cityActive = typeFilter.startsWith('city-') || typeFilter.startsWith('region-');
  const topicActive = typeFilter.startsWith('topic-');

  // A single category pill (broad categories: All, Eating, Drinking, …).
  const catPill = (c) => {
    const meta = CAT_META[c.id] || CAT_META.misc;
    const Icon = meta.Icon;
    const active = typeFilter === c.id;
    return (
      <button
        key={c.id}
        className={'nt-pill' + (active ? ' on' : '')}
        style={active ? { background: meta.color, borderColor: meta.color } : null}
        onClick={() => { setTypeFilter(c.id); setNavMenu(null); }}
      >
        <Icon size={13} strokeWidth={2.25} style={{ color: active ? T.white : meta.color }} /> {c.label}
      </button>
    );
  };

  // A narrow chip inside the By City / By Topic dropdown panel.
  const narrowChip = (f) => {
    const active = typeFilter === f.id;
    const count = f.count != null ? f.count : (counts[f.id] || 0);
    return (
      <button
        key={f.id}
        className={'nt-chip' + (active ? ' on' : '')}
        onClick={() => { setTypeFilter(f.id); setNavMenu(null); }}
      >
        {f.label} <span style={{ opacity: 0.55 }}>{count}</span>
      </button>
    );
  };

  return (
    <div style={{ position: 'relative', zIndex: 2, fontFamily: NFONT, color: NT.ink }}>
      <style dangerouslySetInnerHTML={{ __html: `
        @import url('https://fonts.googleapis.com/css2?family=Manrope:wght@400;500;600;700;800&display=swap');
        .nt-wrap{max-width:1300px;margin:0 auto;padding:8px 24px 70px;}
        .nt-stickytop{position:sticky;top:0;z-index:50;background:var(--surface);}
        .nt-pillsbar{max-width:1300px;margin:0 auto;padding:10px 24px 10px;}
        .nt-toolwrap{max-width:1300px;margin:0 auto;padding:0 24px;display:none;}
        .nt-bodywrap{padding-top:0;}
        @media(max-width:560px){.nt-pillsbar{padding:8px 14px 0;}.nt-toolwrap{display:block;padding:0 14px;}}
        .nt-lbl{font-size:9.5px;font-weight:700;letter-spacing:.07em;text-transform:uppercase;color:${NT.soft};}
        .nt-crumb1{font-size:18px;font-weight:800;letter-spacing:-0.02em;color:${NT.ink};text-decoration:none;}
        .nt-crumb2{font-size:18px;font-weight:600;color:${NT.accent};}
        .nt-navlink{font-size:13px;color:${NT.muted};text-decoration:none;}
        .nt-navlink:hover{color:${NT.ink};}
        .nt-stat{font-size:11px;font-weight:700;letter-spacing:.05em;text-transform:uppercase;color:${NT.soft};margin-top:9px;}
        .nt-stat b{color:${NT.ink};}
        .nt-tagline{font-size:12px;color:${NT.muted};line-height:1.5;max-width:430px;}
        .nt-tagline b{color:${NT.ink};}
        .nt-pills{display:flex;gap:7px;flex-wrap:wrap;margin:4px 0;position:relative;}
        .nt-pill{font-size:12px;font-weight:700;letter-spacing:.03em;text-transform:uppercase;padding:7px 10px;border-radius:9px;border:1px solid ${NT.line};background:var(--white);color:${NT.muted};cursor:pointer;display:flex;flex:1 1 auto;align-items:center;justify-content:center;gap:5px;font-family:inherit;white-space:nowrap;}
        .nt-pill.on{color:var(--white);}
        .nt-pill.ghost.on{background:${NT.ink};border-color:${NT.ink};color:var(--white);}
        .nt-panel{position:absolute;top:calc(100% + 6px);left:0;right:0;z-index:30;background:var(--white);border:1px solid ${NT.line};border-radius:12px;box-shadow:0 12px 30px rgba(20,22,28,0.12);padding:14px 16px 18px;max-height:62vh;overflow:auto;}
        .nt-chip{font-size:11px;font-weight:700;letter-spacing:.02em;padding:6px 10px;border-radius:8px;border:1px solid ${NT.line};background:${NT.bg};color:${NT.ink};cursor:pointer;font-family:inherit;white-space:nowrap;}
        .nt-chip.on{background:${NT.accent};border-color:${NT.accent};color:var(--white);}
        .nt-phead{font-size:9.5px;font-weight:800;letter-spacing:.16em;text-transform:uppercase;color:${NT.soft};margin:14px 0 8px;}
        .nt-phead:first-child{margin-top:0;}
        .nt-toolbar{display:flex;gap:10px;align-items:center;flex-wrap:wrap;margin-bottom:18px;position:relative;}
        .nt-field{position:relative;flex:1 1 280px;min-width:0;}
        .nt-field svg{position:absolute;left:12px;top:50%;transform:translateY(-50%);color:${NT.soft};}
        .nt-field input{width:100%;padding:10px 34px 10px 36px;border:1px solid ${NT.line};border-radius:10px;font-family:inherit;font-size:13.5px;background:var(--white);outline:none;color:${NT.ink};}
        .nt-field .nt-clear{position:absolute;right:8px;top:50%;transform:translateY(-50%);background:none;border:none;color:${NT.soft};cursor:pointer;display:flex;padding:4px;}
        .nt-tbtn{display:flex;align-items:center;gap:7px;border:1px solid ${NT.line};background:var(--white);border-radius:10px;padding:10px 13px;font-family:inherit;font-size:13px;font-weight:600;color:${NT.ink};cursor:pointer;white-space:nowrap;}
        .nt-tbtn.primary{background:${NT.accent};border-color:${NT.accent};color:var(--white);font-weight:700;text-decoration:none;}
        .nt-mfilter{display:none;}
        .nt-msheet{display:none;box-sizing:border-box;background:var(--white);border:1px solid ${NT.line};border-radius:12px;padding:4px 14px calc(14px + env(safe-area-inset-bottom) + 76px);max-height:calc(100dvh - 120px);overflow-y:auto;-webkit-overflow-scrolling:touch;overscroll-behavior:contain;}
        .nt-sortpill{position:relative;flex:none;display:flex;}
        .nt-sortmenu{position:absolute;top:calc(100% + 6px);z-index:30;min-width:190px;background:var(--white);border:1px solid ${NT.line};border-radius:10px;box-shadow:0 12px 30px rgba(20,22,28,0.12);overflow:hidden;}
        .nt-sortitem{width:100%;display:block;text-align:left;border:none;background:var(--white);padding:10px 14px;font-family:inherit;font-size:13px;font-weight:600;color:${NT.ink};cursor:pointer;}
        .nt-sortitem.on,.nt-sortitem:hover{background:${NT.accsoft};color:${NT.accent};}
        .nt-grid{display:grid;grid-template-columns:repeat(5,1fr);grid-auto-flow:dense;gap:16px;}
        @media(max-width:1240px){.nt-grid{grid-template-columns:repeat(4,1fr);}}
        @media(max-width:1040px){.nt-grid{grid-template-columns:repeat(3,1fr);}}
        @media(max-width:720px){.nt-grid{grid-template-columns:repeat(2,1fr);}}
        @media(max-width:480px){.nt-grid{grid-template-columns:1fr;}}
        .nt-tile{height:100%;background:var(--white);border:1px solid ${NT.line};border-radius:12px;overflow:hidden;display:flex;flex-direction:column;text-decoration:none;color:${NT.ink};transition:box-shadow .15s,transform .15s;}
        .nt-tile:hover{box-shadow:0 8px 24px rgba(20,22,28,0.10);transform:translateY(-2px);}
        .nt-timg{position:relative;height:180px;display:flex;align-items:center;justify-content:center;}
        .nt-tcat{position:absolute;top:8px;left:8px;font-size:9px;font-weight:800;letter-spacing:.05em;text-transform:uppercase;color:var(--white);padding:3px 7px 3px 6px;border-radius:6px;display:inline-flex;align-items:center;gap:4px;box-shadow:0 1px 3px rgba(0,0,0,0.18);}
        .nt-tbadge{position:absolute;bottom:8px;left:8px;background:rgba(28,30,36,0.85);color:var(--white);font-size:11px;font-weight:800;padding:2px 8px;border-radius:6px;}
        .nt-tbody{padding:12px 14px 13px;display:flex;flex-direction:column;flex:1 1 auto;}
        .nt-ttitle{font-size:16px;font-weight:800;line-height:1.18;letter-spacing:-0.01em;margin:0 0 9px;}
        .nt-crow{display:flex;align-items:flex-start;gap:9px;padding:5px 0;border-bottom:1px dashed rgba(20,22,28,0.12);font-size:12.5px;}
        .nt-crow:last-of-type{border-bottom:none;}
        .nt-cnum{flex:none;width:18px;height:18px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:10px;font-weight:800;margin-top:1px;}
        .nt-cname{flex:1 1 auto;min-width:0;line-height:1.3;}
        .nt-tfoot{display:flex;align-items:center;justify-content:space-between;margin-top:auto;padding-top:9px;border-top:1px solid ${NT.line};}
        .nt-tfoot span{font-size:9.5px;font-weight:700;letter-spacing:.05em;text-transform:uppercase;color:${NT.soft};display:flex;align-items:center;gap:4px;}
        .nt-relwrap{flex:1 1 0;min-height:0;position:relative;overflow:hidden;margin-top:10px;}
        .nt-rel{display:flex;align-items:center;justify-content:space-between;gap:8px;background:${NT.bg};border:1px solid ${NT.line};border-radius:8px;padding:8px 11px;cursor:pointer;color:${NT.ink};transition:background .12s,border-color .12s;}
        .nt-rel:hover{background:var(--white);border-color:${NT.accent};}
        .nt-rel-t{flex:1 1 auto;min-width:0;font-size:12.5px;font-weight:700;line-height:1.2;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;}
        .nt-rel-a{flex:none;color:${NT.accent};font-weight:800;}
        @media(max-width:560px){.nt-wrap{padding:16px 14px 60px;}.nt-tagline{display:none;}.nt-pillsbar{display:none !important;}.nt-mfilter{display:inline-flex !important;flex:1 1 auto;justify-content:space-between;}.nt-msheet{display:block;flex:1 1 100%;width:100%;}.nt-toolbar{margin-bottom:10px;}.nt-toolwrap{display:block !important;padding:10px 14px 0 !important;}.nt-bodywrap{padding-top:0 !important;}}
      ` }} />

      <SiteHeader
        active="lists"
        visitors={totalViews}
        command
        search={query}
        onSearch={setQuery}
        listCount={LISTS.length}
      />
      <div className="nt-stickytop">
      <div className="nt-pillsbar">
        {/* category pills + By City / By Topic */}
        <div className="nt-pills" onClick={(e) => e.stopPropagation()}>
          {visibleTypes.map(catPill)}
          {cityFilters.length > 0 && (
            <button className={'nt-pill ghost' + (cityActive ? ' on' : '')} onClick={() => setNavMenu((m) => (m === 'city' ? null : 'city'))}>
              By City <ChevronDown size={13} strokeWidth={2.5} style={{ transform: navMenu === 'city' ? 'rotate(180deg)' : 'none' }} />
            </button>
          )}
          {visibleTopics.length > 0 && (
            <button className={'nt-pill ghost' + (topicActive ? ' on' : '')} onClick={() => setNavMenu((m) => (m === 'topic' ? null : 'topic'))}>
              By Topic <ChevronDown size={13} strokeWidth={2.5} style={{ transform: navMenu === 'topic' ? 'rotate(180deg)' : 'none' }} />
            </button>
          )}
          {/* Sort control: moved out of the command header into the tiles row. */}
          <div className="nt-sortpill" onClick={(e) => e.stopPropagation()}>
            <button className={'nt-pill ghost' + (sortOpen ? ' on' : '')} onClick={() => { setSortOpen((o) => !o); setNavMenu(null); }}>
              <ArrowDownUp size={13} strokeWidth={2.25} /> Sort: {(sortButtons.find((o) => o.id === sortBy) || sortButtons[0]).short} <ChevronDown size={13} strokeWidth={2.5} style={{ transform: sortOpen ? 'rotate(180deg)' : 'none' }} />
            </button>
            {sortOpen && (
              <div className="nt-sortmenu" style={{ right: 0 }}>
                {sortButtons.map((opt) => (
                  <button key={opt.id} className={'nt-sortitem' + (sortBy === opt.id ? ' on' : '')} onClick={() => { setSortBy(opt.id); setSortOpen(false); }}>{opt.label}</button>
                ))}
              </div>
            )}
          </div>
          {navMenu === 'city' && (
            <div className="nt-panel">
              <div className="nt-phead">By City</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7 }}>{cityFilters.map(narrowChip)}</div>
              {visibleRegions.length > 0 && (<><div className="nt-phead">By Region</div><div style={{ display: 'flex', flexWrap: 'wrap', gap: 7 }}>{visibleRegions.map(narrowChip)}</div></>)}
            </div>
          )}
          {navMenu === 'topic' && (
            <div className="nt-panel">
              <div className="nt-phead">By Topic</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7 }}>{visibleTopics.map(narrowChip)}</div>
            </div>
          )}
        </div>
      </div>
      <div className="nt-wrap nt-toolwrap">
        {/* mobile-only toolbar: Filters button opens the category + sort sheet.
            Search and Sort now live in the command header; Request a list removed. */}
        <div className="nt-toolbar" onClick={(e) => e.stopPropagation()}>
          <button className="nt-mfilter nt-tbtn" onClick={() => { setFiltersOpen((o) => !o); setNavMenu(null); setSortOpen(false); }}>Filters <ChevronDown size={14} strokeWidth={2.5} style={{ color: NT.soft, transform: filtersOpen ? 'rotate(180deg)' : 'none' }} /></button>
          {filtersOpen && (
            <div className="nt-msheet">
              <div className="nt-phead" style={{ marginTop: 2 }}>Categories</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7 }}>{visibleTypes.map(catPill)}</div>
              {cityFilters.length > 0 && (<><div className="nt-phead">By City</div><div style={{ display: 'flex', flexWrap: 'wrap', gap: 7 }}>{cityFilters.map(narrowChip)}</div></>)}
              {visibleRegions.length > 0 && (<><div className="nt-phead">By Region</div><div style={{ display: 'flex', flexWrap: 'wrap', gap: 7 }}>{visibleRegions.map(narrowChip)}</div></>)}
              {visibleTopics.length > 0 && (<><div className="nt-phead">By Topic</div><div style={{ display: 'flex', flexWrap: 'wrap', gap: 7 }}>{visibleTopics.map(narrowChip)}</div></>)}
              <div className="nt-phead">Sort by</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7 }}>{sortButtons.map((opt) => (<button key={opt.id} className={'nt-chip' + (sortBy === opt.id ? ' on' : '')} onClick={() => setSortBy(opt.id)}>{opt.label}</button>))}</div>
            </div>
          )}
        </div>
      </div>
      </div>

      <div className="nt-wrap nt-bodywrap">
        {/* masonry grid */}
        {sorted.length > 0 ? (
          <div className="nt-grid" ref={gridRef}>
            {(() => {
              const gap = gridCols > 0 ? (gridCols > 1 ? Math.round(gridCols * 3.5) : 7) : 0;
              const cells = [];
              let quizIdx = 0;
              sorted.forEach((list, idx) => {
                cells.push(
                  <BrowseTile
                    key={list.id}
                    list={list}
                    featured={featuredIds.has(list.id)}
                    views={viewCounts[list.id] || 0}
                    voteData={voteData}
                    extras={extras[list.id] || []}
                    relatedLists={findRelatedLists(list, lists, 6)}
                    onOpenRelated={(id) => { saveScroll(); openList(id); }}
                    onClick={() => { saveScroll(); openList(list.id); }}
                  />
                );
                if (gap > 0 && shuffledQuizzes.length > 0 && (idx + 1) % gap === 0 && idx + 1 < sorted.length) {
                  const quiz = shuffledQuizzes[quizIdx % shuffledQuizzes.length];
                  quizIdx += 1;
                  cells.push(<NTQuizTile key={`quiz-${quiz.id}-${idx}`} quiz={quiz} leaders={quizLeaders[quiz.id]} />);
                }
              });
              return cells;
            })()}
          </div>
        ) : (
          <div style={{ color: NT.soft, fontSize: 14, padding: '24px 2px' }}>No lists match your filters.</div>
        )}
      </div>

      <Footer />
    </div>
  );
}

// A single quiz tile woven into the homepage grid. A category-tinted top band
// fills the hero-image area (QUIZ badge + medallion icon + the dynamic answer
// count), so the title below lines up with neighbouring list-tile titles and is
// sized to match them; the play affordance sits at the foot. Links to /quiz/<id>.
function QuizTile({ quiz, leader }) {
  const [hover, setHover] = useState(false);
  const Icon = quizIconOf(quiz);
  const accent = QUIZ_DEPT_COLOR[quizDeptOf(quiz)] || QUIZ_DEPT_COLOR.misc;
  const heading = (quiz.title || '').replace(/^Name (the )?/, '');
  return (
    <Link
      href={`/quiz/${quiz.id}`}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{ cursor: 'pointer', textDecoration: 'none', display: 'flex', flexDirection: 'column', background: hover ? '#e4dbc8' : T.surfaceAlt, color: T.ink, border: `1.5px solid ${T.ink}`, overflow: 'hidden', transition: 'all 0.2s ease', transform: hover ? 'translate(-2px, -2px)' : 'none', boxShadow: hover ? `3px 3px 0 ${accent.c}` : 'none' }}
    >
      <div style={{ flex: '0 0 auto', height: 150, display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 16, padding: '0 18px', background: accent.t, borderBottom: `1.5px solid ${T.ink}` }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <span style={{ flex: 'none', fontFamily: 'DM Mono, monospace', fontSize: 11, fontWeight: 700, letterSpacing: '0.2em', textTransform: 'uppercase', color: T.surface, background: accent.c, padding: '5px 10px' }}>Quiz</span>
          <span style={{ flex: 'none', width: 46, height: 46, borderRadius: '50%', background: T.surface, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Icon size={23} strokeWidth={2} aria-hidden="true" style={{ color: accent.c }} /></span>
        </div>
      </div>
      <div style={{ padding: '16px 18px 18px', flex: '1 1 auto', display: 'flex', flexDirection: 'column' }}>
        <h3 style={{ fontFamily: 'Manrope, system-ui, -apple-system, sans-serif', fontWeight: 700, fontSize: 26, lineHeight: 1.05, letterSpacing: '-0.02em', margin: '0 0 12px', fontVariationSettings: '"SOFT" 100', color: T.ink }}>{heading}</h3>
        {quiz.blurb && (<p style={{ fontFamily: 'Manrope, system-ui, -apple-system, sans-serif', fontStyle: 'italic', fontSize: 14.5, lineHeight: 1.5, color: T.slate, margin: 0 }}>{quiz.blurb}</p>)}
        <span style={{ marginTop: 'auto', paddingTop: 16, display: 'flex', alignItems: 'baseline', gap: 6, minWidth: 0, fontFamily: 'DM Mono, monospace', fontSize: 11, letterSpacing: '0.14em', textTransform: 'uppercase', fontWeight: 600, color: accent.c }}>
          <span style={{ flex: 'none' }}>Current Leader:</span>
          <span style={{ flex: '1 1 auto', minWidth: 0, fontWeight: 700, color: leader ? T.ink : T.slate, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{leader || 'Empty'}</span>
        </span>
        <div style={{ paddingTop: 10, fontFamily: 'DM Mono, monospace', fontSize: 12, letterSpacing: '0.18em', textTransform: 'uppercase', fontWeight: 700, color: accent.c }}>▶ Play</div>
      </div>
    </Link>
  );
}
export function Tile({ list, rank, views, voteData, extras, onClick, href, showConsensus, featured, relatedLists, onOpenRelated }) {
  const [hover, setHover] = useState(false);
  const mode = list.mode || 'both';
  // Total contributing sources for this list: every entry in list.sources
  // except the legacy `ai` seed (the real publications/rating sources), plus
  // the Mind Loft user vote on lists that have voting. Floored at 1 so
  // objective `facts` lists (no editorial sources, no vote) still read "Sources: 1".
  const sourceCount = (() => {
    const pubs = Object.keys(list.sources || {}).filter((id) => id !== 'ai').length;
    return Math.max(1, pubs);
  })();

  const preview = useMemo(() => {
    const limit = featured ? 10 : 3;
    // For facts-only lists: always show from sources.ai
    if (mode === 'facts' || mode === 'scores' || mode === 'unranked') {
      const items = list.sources?.ai?.items || [];
      return {
        label: 'Top of the list',
        rows: items.slice(0, limit).map((item) => ({ item, score: null })),
      };
    }

    // For votes-only lists: always show from vote.items ranked by votes
    if (mode === 'votes') {
      const base = list.vote?.items || [];
      const allItems = dedupeByName([...base, ...extras]);
      const scored = allItems.map((item, idx) => ({
        item,
        score: voteData[voteKey(list.id, item)] || 0,
        origIdx: idx,
      }));
      scored.sort((a, b) => b.score - a.score || a.origIdx - b.origIdx);
      return {
        label: 'Current ranking by votes',
        rows: scored.slice(0, limit),
      };
    }

    // For 'both' mode lists: show Consensus if requested, else show votes
    if (showConsensus) {
      const sources = getSources(list, voteData, extras);
      const consensusSource = sources.find((s) => s.id === 'consensus');
      if (consensusSource && consensusSource.items.length > 0) {
        return {
          label: 'Current Consensus',
          rows: consensusSource.items.slice(0, limit).map((item) => ({ item, score: null })),
        };
      }
    }

    // Default for 'both' mode or consensus fallback: show votes
    const base = list.vote?.items || [];
    const allItems = dedupeByName([...base, ...extras]);
    const scored = allItems.map((item, idx) => ({
      item,
      score: voteData[voteKey(list.id, item)] || 0,
      origIdx: idx,
    }));
    scored.sort((a, b) => b.score - a.score || a.origIdx - b.origIdx);
    return {
      label: 'Currently topping the votes',
      rows: scored.slice(0, limit),
    };
  }, [list, voteData, extras, mode, showConsensus, featured]);

  // V2 photo header: first consensus top-3 item with a hero image in
  // lib/hero-images.js gets a cover-cropped photo band atop the tile, with a
  // gold "#N name" caption. Product lists stay text-only (white-background
  // product shots crop badly), as do legacy non-https local-path entries.
  // Lists with heroFit:'contain' render uncropped on a paper background.
  const heroPhoto = useMemo(() => {
    if (!HOME_V2) return null;
    const map = HERO_IMAGES[list.id];
    if (!map) return null;
    // Products and heroFit:'contain' lists render uncropped on paper.
    const contain = isProductList(list) || list.heroFit === 'contain';
    const urlOf = (entry) => {
      const src = entry && (typeof entry === 'string' ? entry : entry.src);
      return src && /^https?:/.test(src) ? src : null;
    };
    const rows = preview.rows.slice(0, 3);
    for (let i = 0; i < rows.length; i++) {
      const src = urlOf(map[rows[i].item]);
      if (src) return { src, rank: i + 1, name: stripItemScore(rows[i].item), contain };
    }
    // Fallback so more tiles carry a photo: any hero stored for this list
    // (covers consensus drift and renamed items). No rank in the caption.
    for (const name of Object.keys(map)) {
      const src = urlOf(map[name]);
      if (src) return { src, rank: null, name: stripItemScore(name), contain };
    }
    return null;
  }, [list, preview]);

  // Auto-match the contain-fit hero pad to the photo's own background
  // (white product shot -> white, tinted shot -> that tint).
  const heroBg = useSampledBg(
    heroPhoto && heroPhoto.contain ? heroPhoto.src : null,
    !!(heroPhoto && heroPhoto.contain),
  );

  // Tiles fill their leftover vertical space with up to 3 related-list sub-boxes,
  // showing as many as actually fit. The boxes live in an absolutely-positioned
  // inner layer so they never feed back into the container height (loop-free).
  // A callback ref binds the ResizeObserver to the REAL mounted node, so the fit
  // recomputes whenever the grid stretches the tile (the prior useRef+useEffect
  // pattern grabbed a stale/null node and never recomputed past the first paint).
  const [relatedFit, setRelatedFit] = useState(0);
  const fitRef = useRef(0);
  const relNodeRef = useRef(null);
  const relRoRef = useRef(null);
  const relCount = relatedLists ? relatedLists.length : 0;
  const computeRelFit = useCallback(() => {
    const node = relNodeRef.current;
    if (!node) return;
    const avail = node.clientHeight;
    const inner = node.firstElementChild;
    const kids = inner ? inner.children : [];
    let used = 16;
    let fit = 0;
    for (let i = 0; i < kids.length; i++) {
      const h = kids[i].offsetHeight || 50;
      const next = used + (fit === 0 ? h : 12 + h);
      if (next <= avail + 1) { used = next; fit += 1; } else break;
    }
    const want = Math.min(fit, relCount, 6);
    if (want !== fitRef.current) { fitRef.current = want; setRelatedFit(want); }
  }, [relCount]);
  // Drive the fit calc on BOTH requestAnimationFrame AND setTimeout. rAF is
  // frozen while a tab is backgrounded (so a tile rendered in a hidden tab would
  // never get its boxes), whereas setTimeout still fires (throttled) and also
  // gives layout a beat to settle. We also recompute when the tab becomes
  // visible again, so a tab loaded in the background fills in on focus.
  const kickRelFit = useCallback(() => {
    if (typeof requestAnimationFrame !== 'undefined') requestAnimationFrame(computeRelFit);
    setTimeout(computeRelFit, 60);
    setTimeout(computeRelFit, 300);
  }, [computeRelFit]);
  const setRelNode = useCallback((node) => {
    if (relRoRef.current) { relRoRef.current.disconnect(); relRoRef.current = null; }
    relNodeRef.current = node;
    if (node && typeof ResizeObserver !== 'undefined') {
      const ro = new ResizeObserver(() => kickRelFit());
      ro.observe(node);
      relRoRef.current = ro;
    }
    if (node) kickRelFit();
  }, [kickRelFit]);
  useEffect(() => {
    kickRelFit();
    const onVis = () => { if (!document.hidden) kickRelFit(); };
    document.addEventListener('visibilitychange', onVis);
    return () => document.removeEventListener('visibilitychange', onVis);
  }, [kickRelFit, preview]);

  // Renders as an <a> when `href` is provided (crawlable internal link, used
  // by the list pages' More-like-this grid); otherwise the original button.
  const RootEl = href ? 'a' : 'button';
  return (
    <RootEl
      href={href}
      onClick={href ? (e) => { e.preventDefault(); if (onClick) onClick(); } : onClick}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        cursor: 'pointer',
        textDecoration: 'none',
        gridRow: featured ? 'span 2' : 'auto',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'flex-start',
        background: hover ? '#e4dbc8' : T.surfaceAlt,
        color: T.ink,
        border: `1.5px solid ${T.ink}`,
        padding: HOME_V2 ? 0 : 20,
        overflow: HOME_V2 ? 'hidden' : 'visible',
        textAlign: 'left',
        transition: 'all 0.2s ease',
        position: 'relative',
        fontFamily: 'inherit',
        transform: hover ? 'translate(-2px, -2px)' : 'none',
        boxShadow: hover ? `3px 3px 0 ${T.accent}` : 'none',
      }}
    >
      {HOME_V2 && heroPhoto && (
        <div
          style={{
            position: 'relative',
            height: 150,
            flex: '0 0 auto',
            alignSelf: 'stretch',
            borderBottom: `1.5px solid ${T.ink}`,
            backgroundImage: `url("${heroPhoto.src}")`,
            backgroundSize: heroPhoto.contain ? 'contain' : 'cover',
            backgroundRepeat: 'no-repeat',
            backgroundPosition: 'center',
            backgroundColor: heroPhoto.contain ? (heroBg || T.white) : T.surfaceAlt,
            transition: 'background-color 0.2s ease',
          }}
        >
          {!heroPhoto.contain && (
            <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(18,14,10,0.55), rgba(18,14,10,0) 55%)' }} />
          )}
          <span style={{ position: 'absolute', left: heroPhoto.contain ? 8 : 12, bottom: 8, maxWidth: 'calc(100% - 16px)', color: T.white, fontSize: 12, fontFamily: 'DM Mono, monospace', letterSpacing: '0.06em', textShadow: '0 1px 5px rgba(0,0,0,0.9)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', background: heroPhoto.contain ? 'rgba(26,22,17,0.78)' : 'transparent', padding: heroPhoto.contain ? '3px 8px' : 0 }}>
            {heroPhoto.rank != null ? (
              <span style={{ color: '#e7cf73', fontFamily: 'Manrope, system-ui, -apple-system, sans-serif', fontWeight: 700, fontSize: 14 }}>#{heroPhoto.rank}</span>
            ) : (
              heroPhoto.name
            )}
          </span>
        </div>
      )}
      <div style={HOME_V2 ? { padding: '16px 18px 14px', display: 'flex', flexDirection: 'column', flex: '1 1 auto', minHeight: 0, alignSelf: 'stretch' } : { display: 'contents' }}>
      {(() => {
        // V2: drop the category/type corner labels; keep only the READER badge.
        if (HOME_V2 && !list.isUserSubmitted) return null;
        const { leftLabel, rightLabel } = getTileLabels(list);
        const monoStyle = {
          fontFamily: 'DM Mono, monospace',
          fontSize: 10,
          letterSpacing: '0.2em',
          textTransform: 'uppercase',
          opacity: 0.75,
          whiteSpace: 'nowrap',
          lineHeight: 1,
        };
        return (
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'flex-start',
              marginBottom: 14,
              gap: 8,
              width: '100%',
            }}
          >
            <span
              style={{
                ...monoStyle,
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                flexWrap: 'nowrap',
                overflow: 'hidden',
                minWidth: 0,
              }}
            >
              {list.isUserSubmitted && (
                <span
                  style={{
                    background: T.ink,
                    color: T.surface,
                    padding: '2px 6px',
                    fontSize: 8,
                    letterSpacing: '0.15em',
                    fontWeight: 700,
                  }}
                >
                  READER
                </span>
              )}
              {!HOME_V2 && leftLabel}
            </span>
            {!HOME_V2 && (
            <span style={{ ...monoStyle, flexShrink: 0 }}>
              {rightLabel}
            </span>
            )}
          </div>
        );
      })()}

      <h3
        style={{
          fontFamily: 'Manrope, system-ui, -apple-system, sans-serif',
          fontWeight: 700,
          fontSize: 26,
          lineHeight: 1.05,
          letterSpacing: '-0.02em',
          margin: '0 0 14px',
          fontVariationSettings: '"SOFT" 100',
        }}
      >
        {list.title}
      </h3>

      {preview.rows.length > 0 && (
        <>
          <div
            style={{
              fontFamily: 'DM Mono, monospace',
              fontSize: 10,
              letterSpacing: '0.15em',
              textTransform: 'uppercase',
              opacity: 0.6,
              marginBottom: 8,
            }}
          >
            {preview.label}
          </div>
          <ol
            style={{
              margin: 0,
              padding: 0,
              listStyle: 'none',
              fontFamily: 'Manrope, sans-serif',
              fontSize: 14,
            }}
          >
            {preview.rows.map((t, i) => (
              <li
                key={i}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  padding: '4px 0',
                  borderBottom: i < preview.rows.length - 1 ? `1px dashed ${T.slate}` : 'none',
                  opacity: 1,
                }}
              >
                {i < 3 ? (
                  <span
                    style={{
                      position: 'relative',
                      width: 22,
                      height: 22,
                      flex: '0 0 auto',
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <span
                      style={{
                        position: 'absolute',
                        inset: 0,
                        borderRadius: '50%',
                        background: RANK_MEDALS[i].fill,
                        opacity: hover ? 0.34 : 0.3,
                      }}
                    />
                    <span
                      style={{
                        position: 'relative',
                        fontFamily: 'Manrope, system-ui, -apple-system, sans-serif',
                        fontWeight: 600,
                        fontSize: 13,
                        color: RANK_MEDALS[i].num,
                      }}
                    >
                      {i + 1}
                    </span>
                  </span>
                ) : (
                  <span
                    style={{
                      width: 22,
                      height: 22,
                      flex: '0 0 auto',
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontFamily: 'Manrope, system-ui, -apple-system, sans-serif',
                      fontWeight: 600,
                      fontSize: 13,
                      color: T.slate,
                    }}
                  >
                    {i + 1}
                  </span>
                )}
                <span style={{ flex: 1 }}>{stripItemScore(t.item)}</span>
              </li>
            ))}
          </ol>
        </>
      )}

      {relatedLists && relatedLists.length > 0 && (
        <div ref={setRelNode} style={{ flex: '1 1 0', minHeight: 0, position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', top: 16, left: 0, right: 0, display: 'flex', flexDirection: 'column', gap: 12 }}>
            {relatedLists.slice(0, 6).map((rl, idx) => {
              const shown = idx < relatedFit;
              return (
                <div
                  key={rl.id}
                  role="link"
                  tabIndex={shown ? 0 : -1}
                  aria-hidden={shown ? undefined : true}
                  onClick={(e) => { e.stopPropagation(); if (shown && onOpenRelated) onOpenRelated(rl.id); }}
                  onKeyDown={(e) => { if (e.key === 'Enter') { e.stopPropagation(); if (shown && onOpenRelated) onOpenRelated(rl.id); } }}
                  style={{
                    flex: '0 0 auto',
                    visibility: shown ? 'visible' : 'hidden',
                    pointerEvents: shown ? 'auto' : 'none',
                    background: hover ? '#d9ccb0' : T.surfaceAlt,
                    border: `1.5px solid ${T.ink}`,
                    padding: '8px 12px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: 8,
                    cursor: 'pointer',
                  }}
                >
                  <span style={{ flex: '1 1 auto', minWidth: 0, fontFamily: 'Manrope, system-ui, -apple-system, sans-serif', fontWeight: 700, fontSize: 14, lineHeight: 1.15, fontVariationSettings: '"SOFT" 100' }}>{rl.title}</span>
                  <span style={{ flex: '0 0 auto', fontFamily: 'Manrope, system-ui, -apple-system, sans-serif', fontWeight: 700, fontSize: 14 }}>&#8594;</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <div
        style={{
          marginTop: 16,
          paddingTop: 12,
          borderTop: `1px solid ${T.ink}`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 8,
          fontFamily: 'DM Mono, monospace',
          fontSize: 10,
          letterSpacing: '0.1em',
          textTransform: 'uppercase',
          opacity: 0.85,
        }}
      >
        {sourceCount > 0 && (
          <span style={{ flexShrink: 0, whiteSpace: 'nowrap' }}>
            Sources: {sourceCount}
          </span>
        )}
        <span style={{ display: 'flex', alignItems: 'center', gap: 6, minWidth: 0 }}>
          <Eye size={12} strokeWidth={2} />
          <span><Count value={views} /> visitors</span>
        </span>
      </div>
      </div>
    </RootEl>
  );
}

// ── New-theme (June 2026 site revamp) tokens, shared with the live Quizzes UI ──
// Modern light theme: Manrope, soft gray bg, white cards, blue accent, lucide
// icons. Mirrors app/quizzes/QuizHomeClient.jsx so Lists and Quizzes match.
const NT = {
  bg: T.white, surface: T.white, ink: T.ink, muted: T.muted,
  soft: T.muted, line: 'rgba(20,22,28,0.30)', accent: T.accent,
  accsoft: '#e8effb', live: T.success,
};
const NFONT = "'Manrope', system-ui, -apple-system, sans-serif";

// Broad category → lucide icon + accent color (used by pills + tile badges).
const CAT_META = {
  all: { Icon: LayoutGrid, color: NT.ink },
  restaurants: { Icon: Utensils, color: T.danger },
  'bars-nightlife': { Icon: Wine, color: '#b0466e' },
  travel: { Icon: Plane, color: '#2e7d6b' },
  shops: { Icon: ShoppingBag, color: '#7a4fb0' },
  entertainment: { Icon: Tv, color: '#c98a1b' },
  misc: { Icon: Sparkles, color: '#4f7d5a' },
};
function broadCatOf(list) {
  for (const c of CATEGORIES) {
    if (c.id === 'all') continue;
    if (listInCategory(list, c.id)) return { id: c.id, label: c.label, ...(CAT_META[c.id] || CAT_META.misc) };
  }
  return { id: 'misc', label: 'Miscellaneous', ...CAT_META.misc };
}
function ntHash(s) { let h = 0; for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0; return h; }
function ntGrad(s) { const h = ntHash(s) % 360; return `linear-gradient(135deg,hsl(${h},40%,46%),hsl(${(h + 34) % 360},44%,30%))`; }
function ntTint(hex) { return hex + '22'; }
const NT_MEDAL = ['#c9a227', '#9ca3a8', '#a9743f']; // gold / silver / bronze

// Top-N consensus preview rows for a tile (mirrors the list page logic).
function ntPreview(list, voteData, extras, limit) {
  const mode = list.mode || 'both';
  if (mode === 'facts' || mode === 'scores' || mode === 'unranked') {
    return { label: 'Top of the list', items: (list.sources?.ai?.items || []).slice(0, limit) };
  }
  if (mode === 'votes') {
    const base = dedupeByName([...(list.vote?.items || []), ...(extras || [])]);
    return { label: 'Current ranking', items: base.slice(0, limit) };
  }
  const sources = getSources(list, voteData, extras);
  const consensus = sources.find((s) => s.id === 'consensus');
  if (consensus && consensus.items.length > 0) {
    return { label: 'Current Consensus', items: consensus.items.slice(0, limit) };
  }
  return { label: 'Current Consensus', items: (list.sources?.ai?.items || []).slice(0, limit) };
}


// New-theme browse tile (matches lists-browse mockup, adapted to real data).
export function BrowseTile({ list, views, voteData, extras, onClick, featured, relatedLists, onOpenRelated }) {
  const cat = broadCatOf(list);
  const containHero = list.heroFit === 'contain' || list.type === 'product' || (list.tags || []).includes('product') || (list.tags || []).includes('tech');
  const preview = ntPreview(list, voteData, extras, featured ? 10 : 3);
  const sourceCount = Math.max(1, Object.keys(list.sources || {}).filter((id) => id !== 'ai').length);
  const Icon = cat.Icon;
  // Real hero photo: first top-3 pick with an https image in lib/hero-images.js.
  const hero = (() => {
    const map = HERO_IMAGES[list.id];
    if (!map) return null;
    const urlOf = (e) => { const src = e && (typeof e === 'string' ? e : e.src); return src && /^https?:/.test(src) ? src : null; };
    for (let i = 0; i < preview.items.length && i < 3; i++) {
      const src = urlOf(map[preview.items[i]]);
      if (src) return { src, rank: i + 1 };
    }
    for (const name of Object.keys(map)) { const src = urlOf(map[name]); if (src) return { src, rank: null }; }
    return null;
  })();

  // Fill leftover vertical space with links to similar lists (prior formatting):
  // measure available height in the fill area and show as many as actually fit.
  const [relatedFit, setRelatedFit] = useState(0);
  const fitRef = useRef(0);
  const relNodeRef = useRef(null);
  const relRoRef = useRef(null);
  const relCount = relatedLists ? relatedLists.length : 0;
  const computeRelFit = useCallback(() => {
    const node = relNodeRef.current;
    if (!node) return;
    const avail = node.clientHeight;
    const inner = node.firstElementChild;
    const kids = inner ? inner.children : [];
    // Reserve the inner top offset (12) plus a small bottom buffer so the last
    // box always fully fits inside the clipped fill area (no half-cut row).
    let used = 14;
    let fit = 0;
    for (let i = 0; i < kids.length; i++) {
      const h = kids[i].offsetHeight || 40;
      const next = used + (fit === 0 ? h : 10 + h);
      if (next <= avail - 6) { used = next; fit += 1; } else break;
    }
    const want = Math.min(fit, relCount, 6);
    if (want !== fitRef.current) { fitRef.current = want; setRelatedFit(want); }
  }, [relCount]);
  const kickRelFit = useCallback(() => {
    if (typeof requestAnimationFrame !== 'undefined') requestAnimationFrame(computeRelFit);
    setTimeout(computeRelFit, 60);
    setTimeout(computeRelFit, 300);
  }, [computeRelFit]);
  const setRelNode = useCallback((node) => {
    if (relRoRef.current) { relRoRef.current.disconnect(); relRoRef.current = null; }
    relNodeRef.current = node;
    if (node && typeof ResizeObserver !== 'undefined') {
      const ro = new ResizeObserver(() => kickRelFit());
      ro.observe(node);
      relRoRef.current = ro;
    }
    if (node) kickRelFit();
  }, [kickRelFit]);
  useEffect(() => {
    kickRelFit();
    const onVis = () => { if (!document.hidden) kickRelFit(); };
    document.addEventListener('visibilitychange', onVis);
    return () => document.removeEventListener('visibilitychange', onVis);
  }, [kickRelFit, preview]);

  return (
    <a className="nt-tile" style={featured ? { gridRow: 'span 2' } : null} href={`/list/${encodeURIComponent(list.id)}`} onClick={(e) => { if (onClick) { e.preventDefault(); onClick(); } }}>
      <div className="nt-timg" style={hero ? { backgroundImage: `url("${hero.src}")`, backgroundSize: containHero ? 'contain' : 'cover', backgroundRepeat: 'no-repeat', backgroundPosition: 'center', backgroundColor: containHero ? T.white : undefined } : { background: ntGrad(list.title || list.id) }}>
        {!hero && <Icon size={34} strokeWidth={1.75} style={{ color: 'rgba(255,255,255,0.6)' }} />}
        <span className="nt-tcat" style={{ background: cat.color }}><Icon size={11} strokeWidth={2.25} /> {cat.label}</span>
        {hero && hero.rank && <span className="nt-tbadge">#{hero.rank}</span>}
      </div>
      <div className="nt-tbody">
        <h3 className="nt-ttitle">{list.title}</h3>
        <div className="nt-lbl" style={{ marginBottom: 5 }}>{preview.label}</div>
        {preview.items.map((name, i) => (
          <div className="nt-crow" key={i}>
            <span className="nt-cnum" style={i < 3 ? { background: T.white, color: NT_MEDAL[i], border: `1.5px solid ${NT_MEDAL[i]}` } : { background: ntTint(cat.color), color: cat.color }}>{i + 1}</span>
            <span className="nt-cname">{stripItemScore(name)}</span>
          </div>
        ))}
        {relatedLists && relatedLists.length > 0 && (
          <div ref={setRelNode} className="nt-relwrap">
            <div style={{ position: 'absolute', top: 12, left: 0, right: 0, display: 'flex', flexDirection: 'column', gap: 10 }}>
              {relatedLists.slice(0, 6).map((rl, idx) => {
                const shown = idx < relatedFit;
                return (
                  <div
                    key={rl.id}
                    role="link"
                    tabIndex={shown ? 0 : -1}
                    aria-hidden={shown ? undefined : true}
                    className="nt-rel"
                    style={{ visibility: shown ? 'visible' : 'hidden', pointerEvents: shown ? 'auto' : 'none' }}
                    onClick={(e) => { e.preventDefault(); e.stopPropagation(); if (shown && onOpenRelated) onOpenRelated(rl.id); }}
                    onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); e.stopPropagation(); if (shown && onOpenRelated) onOpenRelated(rl.id); } }}
                  >
                    <span className="nt-rel-t">{rl.title}</span>
                    <span aria-hidden="true" className="nt-rel-a">&#8594;</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}
        <div className="nt-tfoot">
          <span>Sources: {sourceCount}</span>
          <span><Eye size={12} strokeWidth={2.25} /> {(views || 0).toLocaleString()}</span>
        </div>
      </div>
    </a>
  );
}

// New-theme quiz tile woven into the browse grid (matches BrowseTile). Shows
// the full quiz title and the top 3 distinct players (gold/silver/bronze) in
// the same ranked-row format the list tiles use for their consensus rows.
function NTQuizTile({ quiz, leaders }) {
  const Icon = quizIconOf(quiz);
  const accent = QUIZ_DEPT_COLOR[quizDeptOf(quiz)] || QUIZ_DEPT_COLOR.misc;
  const top = Array.isArray(leaders) ? leaders.slice(0, 3) : (leaders ? [leaders] : []);
  return (
    <a className="nt-tile" href={`/quiz/${quiz.id}`}>
      <div className="nt-timg" style={{ background: accent.t }}>
        <Icon size={36} strokeWidth={1.75} style={{ color: accent.c, opacity: 0.9 }} />
        <span className="nt-tcat" style={{ background: accent.c }}>Quiz</span>
      </div>
      <div className="nt-tbody">
        <h3 className="nt-ttitle">{quiz.title}</h3>
        <div className="nt-lbl" style={{ marginBottom: 5 }}>Top Players</div>
        {top.length > 0 ? top.map((name, i) => (
          <div className="nt-crow" key={i}>
            <span className="nt-cnum" style={{ background: T.white, color: NT_MEDAL[i], border: `1.5px solid ${NT_MEDAL[i]}` }}>{i + 1}</span>
            <span className="nt-cname">{name}</span>
          </div>
        )) : (
          <div style={{ fontSize: 12.5, fontWeight: 700, color: NT.soft, padding: '5px 0' }}>Be the first to play</div>
        )}
        <div className="nt-tfoot"><span style={{ color: accent.c }}>{'\u25B6'} Play quiz</span><span>Quiz</span></div>
      </div>
    </a>
  );
}

export default function HomeClient() {
  const router = useRouter();
  const [voteData, setVoteData] = useState({});
  const [viewCounts, setViewCounts] = useState({});
  const [trending, setTrending] = useState({});
  const [extras, setExtras] = useState({});
  const [userLists, setUserLists] = useState([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    fetchBootstrap().then((data) => {
      if (data) {
        setVoteData(data.votes || {});
        setViewCounts(data.views || {});
        setTrending(data.trending || {});
        setExtras(data.extras || {});
        setUserLists(Array.isArray(data.userLists) ? data.userLists : []);
      }
      setLoaded(true);
    });
  }, []);

  // Count homepage landings in the visitors total, so visitors who bounce
  // without opening a list page are included. Logged under the pseudo
  // list id 'home' in the views table (totalViews sums every row), deduped
  // to once per browser session via sessionStorage.
  useEffect(() => {
    let seen = false;
    try {
      seen = sessionStorage.getItem('sot-home-viewed') === '1';
      if (!seen) sessionStorage.setItem('sot-home-viewed', '1');
    } catch (e) {
      // sessionStorage unavailable: fall through and count this load.
    }
    if (!seen) postView('home');
  }, []);

  const allLists = useMemo(() => [...userLists, ...LISTS], [userLists]);

  function openList(id) {
    router.push(`/list/${encodeURIComponent(id)}`);
  }

  function goToSubmit() {
    router.push('/submit');
  }

  return (
    <div
      style={{
        minHeight: '100vh',
        background: NT.bg,
        color: NT.ink,
        position: 'relative',
        // 'clip' still clips the grain overlay but, unlike 'hidden', does not
        // create a scroll container, so the V2 sticky department nav works.
        overflow: HOME_V2 ? 'clip' : 'hidden',
      }}
    >
      {!loaded ? (
        <div style={{ position: 'relative', zIndex: 2, minHeight: '100vh', background: NT.bg, color: NT.ink, fontFamily: NFONT }}>
          {/* Server-rendered preload + crawlable list index (what Google reads
              before the client app boots). Themed to match the live site. */}
          <SiteHeader active="lists" command />
          <div style={{ maxWidth: 1180, margin: '0 auto', padding: '36px 24px 80px' }}>
            <div style={{ textAlign: 'center', padding: '34px 0 26px' }}>
              <h1 style={{ fontSize: 'clamp(30px, 6vw, 52px)', fontWeight: 800, letterSpacing: '-0.03em', margin: '0 0 10px' }}>Source <span style={{ color: '#000' }}>of</span> Truths</h1>
              <p style={{ fontSize: 12.5, fontWeight: 800, letterSpacing: 'normal', textTransform: 'uppercase', color: NT.muted, margin: '0 0 18px' }}>Where Experts and Aggregators Agree</p>
              <p style={{ maxWidth: 660, margin: '0 auto', fontSize: 16, lineHeight: 1.6, color: NT.muted }}>Curated rankings built from expert critics and everyday reviewers, weighed across hundreds of sources using Borda consensus scoring, so you can see what we all actually agree on, from the best restaurants and hotels to films, books, and products.</p>
              <p style={{ fontSize: 13, color: NT.soft, marginTop: 22 }}>seeking truths…</p>
            </div>
            {[
              { type: 'food', label: 'Food & Drink' },
              { type: 'travel', label: 'Travel & Hotels' },
              { type: 'entertainment', label: 'Entertainment' },
              { type: 'product', label: 'Products & Tech' },
              { type: 'stores', label: 'Places & Shops' },
              { type: 'other', label: 'More Lists' },
            ].map(({ type, label }) => {
              const seoLists = LISTS.filter((l) => l.type === type).sort((a, b) => (a.title || '').localeCompare(b.title || ''));
              if (seoLists.length === 0) return null;
              return (
                <section key={type} style={{ margin: '0 0 30px' }}>
                  <h2 style={{ fontSize: 18, fontWeight: 800, margin: '0 0 12px', paddingBottom: 8, borderBottom: `2px solid ${NT.accent}` }}>{label}</h2>
                  <ul style={{ listStyle: 'none', margin: 0, padding: 0, columns: '2 260px', columnGap: 28 }}>
                    {seoLists.map((l) => (
                      <li key={l.id} style={{ breakInside: 'avoid', margin: '0 0 7px', fontSize: 14.5, lineHeight: 1.4 }}>
                        <a href={`/list/${l.id}`} style={{ color: NT.ink, textDecoration: 'none' }}>{l.title}</a>
                      </li>
                    ))}
                  </ul>
                </section>
              );
            })}
          </div>
        </div>
      ) : (
        <Home
          lists={allLists}
          viewCounts={viewCounts}
          voteData={voteData}
          extras={extras}
          trending={trending}
          openList={openList}
          onSubmit={goToSubmit}
        />
      )}
    </div>
  );
}
