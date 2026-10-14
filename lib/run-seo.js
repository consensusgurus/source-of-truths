// THE SEARCH FACTS EVERY RUN PAGE STATES ABOUT ITSELF (2026-10-13).
//
// The daily games have lib/game-seo.js: a short Q&A, FAQPage schema, a
// breadcrumb and a cluster of sibling links, printed by app/StageTail.jsx
// under every game. The runs that own an address (Judged, Enter the Dojo,
// Read the Room, Price Check, Passport) had none of it. Their pages ended at
// the run itself: no footer, no questions, no links into the very games they
// are made of, so each one was an island Google could reach only through the
// sitemap. This is the run half of the same idea, and StageTail prints it
// when it is handed `run`.
//
// RUN_PAGES is the list of runs whose page is meant to be FOUND. A run's copy
// lives here because it is the one thing the circuit registry does not know:
// how it is scored, in a sentence a searcher can read. Everything else (name,
// blurb, roster, address) is read off lib/circuits.js so it cannot drift.
//
// The Trivia and Math Gauntlets are deliberately NOT here: their run pages
// (/trivia, /math) are noindex by design and their landing pages under
// /circuits are what ranks. RUN_LANDINGS names them so the "other runs" links
// point at the page meant to be found.
//
// scripts/verify-page-seo.mjs is the gate: every circuit with its own `path`
// must be in RUN_PAGES or RUN_LANDINGS, every run page must mount the tail,
// and the sitemap derives its run urls from RUN_PAGES.
//
// Copy rules the rest of the site holds to: US spelling, no em dashes.

import { DAILY_GAME_MAP } from './daily-games.js';
import { circuitById, circuitKeysFor, circuitPageHref } from './circuits.js';
import { SITE_URL } from './site.js';

export const RUN_PAGES = {
  deduction: {
    path: '/judged',
    accent: 'ergo',
    kind: 'logic puzzle run',
    score: 'Each of the five cases is worth 20 points, half for getting it right and half for speed, for a run out of 100. Your total decides which law school lets you in, from Charleston up to Yale.',
  },
  dojo: {
    path: '/dojo',
    accent: 'suds',
    kind: 'sudoku run',
    score: 'The run is out of 100: Sixes is worth 25, Suds 35 and the variant 40, each half for solving it and half for speed. Your total ties on a belt, from white up to black.',
    pool: true,
  },
  room: {
    path: '/room',
    accent: 'outwit',
    kind: 'crowd psychology run',
    score: 'There is no answer key. Each of the three games is worth a third of 100, paid by the share of the other players in that room you read better than. The ladder runs from Wrong Party up to Mind Reader, and your reading moves until midnight as more players arrive.',
  },
  pricecheck: {
    path: '/pricecheck',
    accent: 'pricer',
    kind: 'price guessing run',
    score: 'Each of the five items is worth 10, and you get three guesses at each, worth up to 10, 6 and 3, so the first guess counts most. The run is out of 50, and the total decides your card, from Prepaid up to Black.',
  },
  passport: {
    path: '/passport',
    accent: 'passport',
    kind: 'geography run',
    score: 'Five rounds of 10 points each: a landmark, the flag, the neighbors, the capital and the size. The run is out of 50, and the total decides which real passport you earn, from Sierra Leone up to Japan.',
    noMembers: true,
  },
};

// Runs whose run page is noindex; link to their landing page instead.
export const RUN_LANDINGS = ['gauntlet', 'math', 'triviaencore'];

const RUN_ORDER = ['gauntlet', 'triviaencore', 'math', 'pricecheck', 'passport', 'deduction', 'dojo', 'room'];

export function runPageOf(id) {
  const r = RUN_PAGES[id];
  const c = circuitById(id);
  if (!r || !c) return null;
  return { ...r, id, name: c.name, blurb: c.blurb, unit: c.unit };
}

export function runPagePaths() {
  return Object.values(RUN_PAGES).map((r) => r.path);
}

// The games a run is made of, today and in its dealt pool, as links.
export function runMembers(id, today) {
  const r = RUN_PAGES[id];
  const c = circuitById(id);
  if (!r || !c || r.noMembers) return [];
  const keys = [...circuitKeysFor(id, today)];
  if (r.pool && c.slot && Array.isArray(c.slot.pool)) for (const k of c.slot.pool) if (!keys.includes(k)) keys.push(k);
  return keys
    .map((k) => DAILY_GAME_MAP[k])
    .filter(Boolean)
    .map((g) => ({ key: g.key, name: g.name, href: g.href, tag: g.tag }));
}

// The other runs, as links to the page meant to rank for each.
export function otherRuns(id) {
  return RUN_ORDER.filter((x) => x !== id).map((x) => {
    const c = circuitById(x);
    if (!c) return null;
    const href = RUN_PAGES[x] ? RUN_PAGES[x].path : circuitPageHref(x);
    return { key: x, name: c.name, href, tag: c.blurb };
  }).filter(Boolean);
}

function listOf(names) {
  if (names.length < 2) return names[0] || '';
  return `${names.slice(0, -1).join(', ')} and ${names[names.length - 1]}`;
}

// [question, answerText, answerHtml?], the same shape gameFaq returns.
export function runFaq(id, today) {
  const r = runPageOf(id);
  if (!r) return [];
  const name = r.name;
  const faq = [
    [`What is ${name}?`, `${name} is a free daily ${r.kind} from Mind Loft. ${r.blurb}`],
    [`How is ${name} scored?`, r.score],
    [`Is ${name} free to play?`, `Yes. ${name} is free in your browser on Mind Loft, with no app to install and no account required. Add a name to see where you rank on the daily leaderboard.`],
    [`When does a new ${name} come out?`, `A new ${name} starts every day at midnight Eastern time, and the leaderboard resets with it.`],
  ];
  const mem = runMembers(id, today);
  if (mem.length) {
    const fixed = mem.slice(0, circuitKeysFor(id, today).length);
    const pool = mem.slice(fixed.length);
    const a = (arr) => listOf(arr.map((m) => m.name));
    const h = (arr) => listOf(arr.map((m) => `<a href="${m.href}">${m.name}</a>`));
    const tail = pool.length ? ` The last grid is dealt each day from ${a(pool)}.` : '';
    const tailH = pool.length ? ` The last grid is dealt each day from ${h(pool)}.` : '';
    faq.push([
      `Can I play the games in ${name} on their own?`,
      `Yes. Today's run is ${a(fixed)}, and each is also a daily of its own with its own leaderboard.${tail} A game you have already played today counts toward the run.`,
      `Yes. Today's run is ${h(fixed)}, and each is also a daily of its own with its own leaderboard.${tailH} A game you have already played today counts toward the run.`,
    ]);
  }
  const other = otherRuns(id);
  if (other.length) {
    faq.push([
      'What other daily runs does Mind Loft have?',
      `${listOf(other.map((o) => o.name))}. Every circuit is listed on the Circuits page.`,
      `${listOf(other.map((o) => `<a href="${o.href}">${o.name}</a>`))}. Every circuit is listed on the <a href="/circuits">Circuits</a> page.`,
    ]);
  }
  return faq;
}

export function runFaqJsonLd(id, today) {
  const faq = runFaq(id, today);
  if (!faq.length) return null;
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faq.map(([q, a]) => ({ '@type': 'Question', name: q, acceptedAnswer: { '@type': 'Answer', text: a } })),
  };
}

export function runBreadcrumbJsonLd(id) {
  const r = runPageOf(id);
  if (!r) return null;
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: `${SITE_URL}` },
      { '@type': 'ListItem', position: 2, name: 'Circuits', item: `${SITE_URL}/circuits` },
      { '@type': 'ListItem', position: 3, name: r.name },
    ],
  };
}
