// THE QUESTION DATABASES' SERVER PAGES (owner, 2026-11-21): the hub and topic
// pages of the Trivia, Math and English Databases, with their metadata and
// structured data. The route files (app/trivia-questions, app/math-questions,
// app/english-questions) are thin wrappers around these. The client is
// app/QdbPortal.jsx; config lib/qdb.js; questions lib/qdb-library.js.
//
// SEO, as on the first trivia portal: CollectionPage + BreadcrumbList + FAQPage
// on a hub; Quiz with every sample Question (acceptedAnswer and the wrong
// choices as suggestedAnswer) + BreadcrumbList + FAQPage on a topic. Samples
// move on weekly, so the answers in the page stay fresh for crawlers.
import { notFound } from 'next/navigation';
import QdbPortal from './QdbPortal';
import PageViewBeacon from './PageViewBeacon';
import { SITE_URL } from '@/lib/site';
import { QDBS, qdbTopic, tierBand } from '@/lib/qdb';
import { poolStats, samples, etToday, topicCards } from '@/lib/qdb-library';

const round = (n) => (n >= 1000 ? `${Math.floor(n / 1000).toLocaleString('en-US')},000` : String(n));

const HUB = {
  trivia: {
    title: (n) => `Trivia Database: ${round(n)} Free Trivia Questions and Answers | Mind Loft`,
    description: 'Free trivia questions and answers in 11 topics: general knowledge, geography, sports, history, science, movies, and more. Gentle to tough, no signup.',
    social: 'Thousands of multiple choice trivia questions in 11 topics. Play any topic in Practice, Gauntlet, or Sprint mode, from gentle to tough.',
    about: 'Trivia',
    faq: (n) => [
      { q: 'Are these trivia questions free?', a: 'Yes. Every question is free to play in your browser on a phone or a computer, with no app and no signup. Your record (what you have seen, your best scores, and the questions you missed) stays in this browser.' },
      { q: 'Where do the questions come from?', a: 'Every one has already run as a Mind Loft daily, from the Trivia Gauntlet and Trivia Encore to the Science Gauntlet. A question joins the database the day after it runs, so playing here never spoils a coming daily.' },
      { q: 'How do the three modes work?', a: 'Practice has no clock and no lives, and shows the right answer after a miss. Gauntlet puts a 20 second clock on every question and ends on your first miss; pick Endless to play until then. Sprint is as many as you can answer in 60 seconds.' },
      { q: 'Can I pick how hard the questions are?', a: 'Yes. Set the difficulty to Gentle, Moderate, or Tough, or pick Mixed to start gentle and finish tough. Open a topic to narrow it to the parts you want, like capitals or the Middle Ages.' },
      { q: 'Does playing here count toward my Mind Loft score?', a: 'No. The database is for fun and practice. The ranked games are the daily ones: the Trivia Gauntlet and Trivia Encore open fresh every day at midnight Eastern, and only your first try counts.' },
      { q: 'How many trivia questions are there?', a: `${n.toLocaleString('en-US')} so far, and more join every day as each day's gauntlets run.` },
    ],
  },
  math: {
    title: (n) => `Math Database: ${round(n)} Free Mental Math Problems and Answers | Mind Loft`,
    description: 'Free mental math problems with answers: arithmetic, missing numbers, number sequences, and multi-step problems. Practice by topic, gentle to tough, no signup.',
    social: 'Thousands of multiple choice mental math problems. Practice arithmetic, missing numbers, and sequences in Practice, Gauntlet, or Sprint mode.',
    about: 'Mental calculation',
    faq: (n) => [
      { q: 'Are these math problems free?', a: 'Yes. Every problem is free to play in your browser, with no app and no signup. Your record and the problems you missed stay in this browser.' },
      { q: 'What kind of math is in the database?', a: 'Mental math, the kind you do in your head: arithmetic with all four operations and percentages, multi-step problems with order of operations, missing number equations, number sequences, and finding the equation that makes a given number.' },
      { q: 'Where do the problems come from?', a: 'Every one has already run in a Mind Loft daily: Blitz, Blitzed, Gap, Series, and Back, the five games of the Math Gauntlet. A problem joins the database the day after it runs.' },
      { q: 'How do the three modes work?', a: 'Practice has no clock and shows the answer after a miss. Gauntlet gives you 15 seconds a problem and ends on your first miss; pick Endless to play until then. Sprint is as many as you can solve in 60 seconds.' },
      { q: 'Can I practice easier or harder problems?', a: 'Yes. Set the difficulty to Gentle, Moderate, or Tough, or pick Mixed to start gentle and finish tough. Open a topic to practice one operation, like division or percentages.' },
      { q: 'How many math problems are there?', a: `${n.toLocaleString('en-US')} so far, and about a hundred more join every day.` },
    ],
  },
  english: {
    title: () => 'English Database: Free Grammar, Vocabulary, and Spelling Quiz | Mind Loft',
    description: 'Free English quiz questions with answers: grammar, vocabulary, spelling, word origins, and idioms. Practice by topic, gentle to tough, no signup.',
    social: 'Free multiple choice grammar, vocabulary, spelling, word origin, and idiom questions. Play in Practice, Gauntlet, or Sprint mode.',
    about: 'English language',
    faq: (n) => [
      { q: 'Are these English questions free?', a: 'Yes. Every question is free to play in your browser, with no app and no signup. Your record and the questions you missed stay in this browser.' },
      { q: 'What does the English Database cover?', a: 'Five topics: grammar (word choice, punctuation, and structure), vocabulary (definitions, synonyms, and opposites), spelling, word origins, and idioms.' },
      { q: 'Where do the questions come from?', a: 'Every one has already run in a Mind Loft daily: Gram, Vocab, Spell, Origin, and Idiom, the five games of the English Gauntlet. A question joins the database the day after it runs.' },
      { q: 'How do the three modes work?', a: 'Practice has no clock and shows the right answer after a miss. Gauntlet puts a 20 second clock on every question and ends on your first miss; pick Endless to play until then. Sprint is as many as you can answer in 60 seconds.' },
      { q: 'Is it good practice for tests?', a: 'It is quick, everyday practice with commonly confused words, tricky spellings, and real usage. Set the difficulty to Tough for the hardest questions.' },
      { q: 'How many English questions are there?', a: `${n.toLocaleString('en-US')} so far, and 25 more join every day.` },
    ],
  },
};

HUB.science = {
  title: (n) => `Science Database: ${round(n)} Free Science Trivia Questions and Answers | Mind Loft`,
  description: 'Free science quiz questions with answers: space and physics, chemistry, biology, the human body, and inventions. Practice by topic, gentle to tough.',
  social: 'Thousands of multiple choice science questions in six topics. Play in Practice, Gauntlet, or Sprint mode, from gentle to tough.',
  about: 'Science',
  faq: (n) => [
    { q: 'Are these science questions free?', a: 'Yes. Every question is free to play in your browser, with no app and no signup. Your record and the questions you missed stay in this browser.' },
    { q: 'What does the Science Database cover?', a: 'Six topics: general science, space and physics, chemistry, life science, the human body, and inventions and discoveries.' },
    { q: 'Where do the questions come from?', a: 'Every one has already run in a Mind Loft daily: Sci from the Trivia Gauntlet, and Orbit, Bond, Gene, Pulse, and Eureka from the Science Gauntlet. A question joins the database the day after it runs.' },
    { q: 'How do the three modes work?', a: 'Practice has no clock and shows the right answer after a miss. Gauntlet puts a 20 second clock on every question and ends on your first miss; pick Endless to play until then. Sprint is as many as you can answer in 60 seconds.' },
    { q: 'Can I mix topics?', a: 'Yes. Pick two or more topics and press Start for a mix of them, or open a topic and pick several of its parts.' },
    { q: 'How many science questions are there?', a: `${n.toLocaleString('en-US')} so far, and more join every day.` },
  ],
};

const crumbLdOf = (crumbs) => ({ '@context': 'https://schema.org', '@type': 'BreadcrumbList', itemListElement: crumbs.map((c, i) => ({ '@type': 'ListItem', position: i + 1, name: c.label, ...(i < crumbs.length - 1 ? { item: `${SITE_URL}${c.href === '/' ? '' : c.href}` } : {}) })) });
const faqLdOf = (faq) => ({ '@context': 'https://schema.org', '@type': 'FAQPage', mainEntity: faq.map((f) => ({ '@type': 'Question', name: f.q, acceptedAnswer: { '@type': 'Answer', text: f.a } })) });
const Ld = ({ data }) => <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }} />;
const catCrumb = { trivia: { label: 'Trivia', href: '/trivia-games' }, math: { label: 'Number Puzzles', href: '/number-puzzles' }, english: { label: 'Word Games', href: '/word-games' }, science: { label: 'Trivia', href: '/trivia-games' } };

function totalOf(db) {
  const stats = poolStats(db, etToday());
  return Object.values(stats).reduce((a, s) => a + s.n, 0);
}

export function hubMetadata(db) {
  const cfg = QDBS[db];
  const h = HUB[db];
  const title = h.title(totalOf(db));
  return {
    title, description: h.description,
    alternates: { canonical: cfg.base },
    openGraph: { images: [{ url: cfg.og, width: 1200, height: 630, alt: `Mind Loft ${cfg.name}` }], title: `${cfg.name}: free ${cfg.noun} by topic`, description: h.social, url: cfg.base, type: 'website', siteName: 'Mind Loft' },
    twitter: { images: [cfg.og], card: 'summary_large_image', title: `${cfg.name}: free ${cfg.noun} by topic`, description: h.social },
  };
}

export function HubPage({ db }) {
  const cfg = QDBS[db];
  const h = HUB[db];
  const today = etToday();
  const topics = topicCards(db, poolStats(db, today));
  const total = topics.reduce((a, t) => a + t.n, 0);
  const faq = h.faq(total);
  // Two sample questions for the page's showcase, from two different topics.
  const showcase = topics.slice(0, 6).map((t) => samples(db, t.slug, 3, today)[1]).filter(Boolean).slice(0, 2);
  const crumbs = [{ label: 'Home', href: '/' }, catCrumb[db], { label: cfg.name, href: cfg.base }];
  const collection = {
    '@context': 'https://schema.org', '@type': 'CollectionPage',
    name: `${cfg.name}: ${cfg.noun} and answers`, description: h.description, url: `${SITE_URL}${cfg.base}`,
    isPartOf: { '@type': 'WebSite', name: 'Mind Loft', url: SITE_URL },
    about: { '@type': 'Thing', name: h.about },
    hasPart: topics.map((t) => ({ '@type': 'Quiz', name: `${t.label} ${cfg.noun}`, url: `${SITE_URL}${cfg.base}/${t.slug}`, educationalLevel: 'Beginner to advanced', numberOfQuestions: t.n, isAccessibleForFree: true })),
  };
  return (
    <>
      <Ld data={collection} />
      <Ld data={crumbLdOf(crumbs)} />
      <Ld data={faqLdOf(faq)} />
      <PageViewBeacon id={cfg.base.slice(1)} />
      <QdbPortal db={db} topics={topics} total={total} faq={faq} crumbs={crumbs} showcase={showcase} />
    </>
  );
}

function topicFaq(db, t, n) {
  const cfg = QDBS[db];
  const lbl = t.label.toLowerCase();
  return [
    { q: `How many ${lbl} ${cfg.many} are there?`, a: `${n.toLocaleString('en-US')} so far, every one from a past Mind Loft daily, and more join every day. Play them in Practice, Gauntlet, or Sprint mode, from gentle to tough.` },
    { q: `Can I practice ${lbl} without a clock?`, a: `Yes. Practice mode has no clock and no lives: after a miss it shows the right answer and moves on, and every miss comes back later in Retry My Misses on the ${cfg.name} page.` },
    { q: 'Is it free?', a: `Yes, free in your browser with no signup. Your record stays in this browser.${t.daily ? ` The ranked daily is ${t.daily.name}, with new ${cfg.many} every day.` : ''}` },
  ];
}

export function topicMetadata(db, slug) {
  const cfg = QDBS[db];
  const t = qdbTopic(db, slug);
  if (!t) return {};
  const url = `${cfg.base}/${t.slug}`;
  return {
    title: t.title, description: t.blurb,
    alternates: { canonical: url },
    openGraph: { title: `${t.h1}, Free`, description: t.blurb, url, type: 'website', siteName: 'Mind Loft', images: [{ url: cfg.og, width: 1200, height: 630 }] },
    twitter: { card: 'summary_large_image', title: `${t.h1}, Free`, description: t.blurb, images: [cfg.og] },
  };
}

export function TopicPage({ db, slug }) {
  const cfg = QDBS[db];
  const t = qdbTopic(db, slug);
  if (!t) notFound();
  const today = etToday();
  const topics = topicCards(db, poolStats(db, today));
  const me = topics.find((x) => x.slug === t.slug);
  const sample = samples(db, t.slug, 12, today);
  const faq = topicFaq(db, t, me.n);
  const crumbs = [{ label: 'Home', href: '/' }, { label: cfg.name, href: cfg.base }, { label: t.label, href: `${cfg.base}/${t.slug}` }];
  const quizLd = {
    '@context': 'https://schema.org', '@type': 'Quiz',
    name: t.h1, description: t.blurb, url: `${SITE_URL}${cfg.base}/${t.slug}`,
    about: { '@type': 'Thing', name: t.label },
    educationalLevel: 'Beginner to advanced', isAccessibleForFree: true, numberOfQuestions: me.n,
    isPartOf: { '@type': 'CollectionPage', name: cfg.name, url: `${SITE_URL}${cfg.base}` },
    hasPart: sample.map((q) => ({
      '@type': 'Question', eduQuestionType: 'Multiple choice',
      name: q.p ? `${q.q} (${q.p})` : q.q, text: q.p ? `${q.q} (${q.p})` : q.q,
      educationalLevel: tierBand(q.tier),
      acceptedAnswer: { '@type': 'Answer', text: q.c[q.a] },
      suggestedAnswer: q.c.filter((_, i) => i !== q.a).map((c) => ({ '@type': 'Answer', text: c })),
    })),
  };
  return (
    <>
      <Ld data={quizLd} />
      <Ld data={crumbLdOf(crumbs)} />
      <Ld data={faqLdOf(faq)} />
      <PageViewBeacon id={`${cfg.base.slice(1)}-${t.slug}`} />
      <QdbPortal db={db} topics={topics} topic={{ ...me, h1: t.h1, blurb: t.blurb }} samples={sample} faq={faq} crumbs={crumbs} />
    </>
  );
}
