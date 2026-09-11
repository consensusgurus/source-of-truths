// THE SEARCH FACTS EVERY DAILY GAME PAGE STATES ABOUT ITSELF, derived from the
// registry so they are true for the whole roster at once.
//
// WHY (Search Console, 2026-09-11). After the domain move, 136 daily-game and
// quiz urls sat in "Duplicate without user-selected canonical" and a further
// batch (/carve, /chain, /circa, the circuit pages) in "Discovered, currently
// not indexed". Every game page already carried a title, a Game schema, an
// About section and the roster footer. What none of them had was the plain
// text a searcher actually types ("is it free", "when does the new puzzle come
// out", "how do you play") or a link to more than ONE sibling game, and every
// breadcrumb on the site said Home > Quizzes > Game, pointing a signal at a
// page that has nothing to do with the game.
//
// Three things live here, each computed off lib/daily-games.js and
// lib/puzzle-categories.js so a new daily gets them by existing:
//
//   gameFaq(key)       the questions and answers app/StageTail.jsx prints
//                      under the game and emits as FAQPage schema. Every
//                      answer is something the registry KNOWS: the `how` line,
//                      the category, the Sunday Edition roster, the archive.
//                      Nothing here promises a feature the game may not have.
//   relatedGames(key)  up to four live siblings from the same category, in
//                      roster order starting after the game itself, so the
//                      link cluster rotates around the category instead of
//                      every page pointing at the same three favorites.
//   categoryCrumb(key) the middle breadcrumb item: the category landing page
//                      (lib/puzzle-categories.js), which is the page meant to
//                      rank for the generic term.
//
// Copy rules the rest of the site holds to: US spelling, no em dashes.

import { DAILY_GAME_MAP, DAILY_KEYS, liveDailyKeys } from './daily-games.js';
import { CAT_TO_SLUG, PUZZLE_CATEGORY_MAP, categoryHrefForGame, genericFor } from './puzzle-categories.js';
import { hasSundayEdition } from './sunday-editions.js';
import { SITE_URL } from './site.js';

// The category page a game belongs to, as { href, label }, or null for a key
// the registry does not know. The chess titles resolve to /chess-puzzles, as
// StageChrome's cap already does, so the two links on one page agree.
export function gameCategory(key) {
  const g = DAILY_GAME_MAP[key];
  if (!g) return null;
  const href = categoryHrefForGame(key);
  if (!href) return null;
  const page = PUZZLE_CATEGORY_MAP[href.slice(1)];
  const label = page ? page.label : g.cat;
  return { href, label, cat: g.cat };
}

// A sentence-shaped lower-case category name: "word game", "sudoku",
// "logic puzzle". The registry's labels are display case and plural.
function kind(cat) {
  switch (cat) {
    case 'Sudoku': return 'sudoku';
    case 'Word': return 'word game';
    case 'Logic': return 'logic puzzle';
    case 'Numbers': return 'number puzzle';
    case 'Trivia': return 'trivia game';
    case 'Geography': return 'geography game';
    case 'End Game': return 'endgame puzzle';
    case 'Cards': return 'card game';
    case 'Crowd Psychology': return 'crowd psychology game';
    case 'Arcade': return 'arcade game';
    default: return 'puzzle';
  }
}

// Up to `n` live siblings from the same category, roster order, starting after
// the game itself and wrapping, so the cluster rotates around the category.
export function relatedGames(key, n = 4, today) {
  const g = DAILY_GAME_MAP[key];
  if (!g) return [];
  const live = new Set(liveDailyKeys(today));
  const i = DAILY_KEYS.indexOf(key);
  const order = i === -1 ? DAILY_KEYS : [...DAILY_KEYS.slice(i + 1), ...DAILY_KEYS.slice(0, i)];
  return order
    .filter((k) => k !== key && live.has(k) && DAILY_GAME_MAP[k].cat === g.cat)
    .slice(0, n)
    .map((k) => {
      const s = DAILY_GAME_MAP[k];
      return { key: k, name: s.name, href: s.href, tag: s.tag };
    });
}

// The questions a game page answers, as [question, answerText, answerHtml?]
// triples. `answerHtml` is only present where the answer carries links (the
// siblings); the plain text is what the FAQPage schema receives.
export function gameFaq(key, today) {
  const g = DAILY_GAME_MAP[key];
  if (!g) return [];
  const cat = gameCategory(key);
  const name = g.name;
  const generic = genericFor(key);
  const tagLine = g.tag[0].toLowerCase() + g.tag.slice(1);
  // The category page's generic name ("Killer sudoku" for Cages) names the KIND
  // of puzzle in the searcher's own words. It is a label, not a noun phrase
  // ("Predict the ranking", "Chess: mate in two"), so it is quoted as one
  // rather than forced into a sentence, and dropped where it only repeats
  // the tag line.
  const gen = generic && !generic.toLowerCase().includes(tagLine) && !tagLine.includes(generic.toLowerCase()) ? generic : null;
  const what = `${name} is a daily ${kind(g.cat)} from Mind Loft: ${tagLine}.${gen ? ` Puzzle type: ${gen[0].toLowerCase() + gen.slice(1)}.` : ''}`;
  const faq = [
    [`How do you play ${name}?`, g.how],
    [
      `Is ${name} free to play?`,
      `Yes. ${name} is free to play in your browser on Mind Loft, with no app to install and no account required.`,
    ],
    [
      `When does a new ${name} puzzle come out?`,
      hasSundayEdition(key)
        ? `A new ${name} arrives every day at midnight Eastern time, and Sundays bring the Sunday Edition, the biggest or hardest board of the week.`
        : `A new ${name} arrives every day at midnight Eastern time.`,
    ],
    [
      `What kind of puzzle is ${name}?`,
      cat ? `${what} It is part of the daily ${cat.label.toLowerCase()} lineup.` : what,
    ],
    [
      `Can I play past ${name} puzzles?`,
      `Yes. Every past ${name} board is in the daily puzzle archive, along with the day's standings.`,
      `Yes. Every past ${name} board is in the <a href="/daily">daily puzzle archive</a>, along with the day's standings.`,
    ],
  ];
  const rel = relatedGames(key, 4, today);
  if (rel.length && cat) {
    const names = rel.map((r) => r.name);
    const list = names.length > 1 ? `${names.slice(0, -1).join(', ')} and ${names[names.length - 1]}` : names[0];
    const links = rel.map((r) => `<a href="${r.href}">${r.name}</a>`);
    const listHtml = links.length > 1 ? `${links.slice(0, -1).join(', ')} and ${links[links.length - 1]}` : links[0];
    faq.push([
      `What other daily ${cat.label.toLowerCase()} does Mind Loft have?`,
      `${list}, among others. The ${cat.label} page lists every one, with a new board for each every day.`,
      `${listHtml}, among others. The <a href="${cat.href}">${cat.label}</a> page lists every one, with a new board for each every day.`,
    ]);
  }
  return faq;
}

// FAQPage schema for the questions above. Plain text only: schema.org allows
// HTML in acceptedAnswer.text, but the rich result renders it as text anyway.
export function gameFaqJsonLd(key, today) {
  const faq = gameFaq(key, today);
  if (!faq.length) return null;
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faq.map(([q, a]) => ({
      '@type': 'Question',
      name: q,
      acceptedAnswer: { '@type': 'Answer', text: a },
    })),
  };
}

// The middle item of a game page's BreadcrumbList: the category landing page.
// Falls back to the daily hub for a key outside the category map, so the crumb
// never points at a page that does not exist.
export function categoryCrumb(key) {
  const cat = gameCategory(key);
  return cat
    ? { '@type': 'ListItem', position: 2, name: cat.label, item: `${SITE_URL}${cat.href}` }
    : { '@type': 'ListItem', position: 2, name: 'Daily Puzzles', item: `${SITE_URL}/daily` };
}

// Every category slug the crumb can name, for the verifier.
export const CATEGORY_SLUGS = Object.values(CAT_TO_SLUG);
