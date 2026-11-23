// /which-is-closer: the hub for the Which Is Closer quizzes (Search Console
// pass, 2026-11-23).
//
// WHY. Over the twelve months to 2026-11-22 "which is closer" and its
// variants earned about 580 impressions at an average position near 6 and no
// clicks: Google was answering the phrase with one quiz at a time
// (/quiz/closer-seven-wonders took most of it) because no page collected the
// format. This page owns the phrase and lists every closer quiz.
//
// The roster is every visible quiz with format 'closer', read at render time,
// so a new closer quiz appears here the day it publishes, with no edit.
// force-dynamic for the same reason: a banked quiz must not show before its
// publishedAt, and a static page would freeze the day it was built.
//
// COPY RULES: no em dash, no answers (the blurbs quote no round), nothing that
// goes stale with a new quiz (counts come from the roster, never hand-typed).

import CloserHub from './CloserHub';
import { visibleQuizzes } from '@/lib/quiz-catalog';
import { SITE_URL } from '@/lib/site';

export const dynamic = 'force-dynamic';

const TITLE = 'Which Is Closer? Free Distance Quizzes: Cities, Stadiums, Landmarks | Mind Loft';
const H1 = 'Which Is Closer? Free Distance Quizzes';
const DESCRIPTION = 'Free Which Is Closer quizzes: one place, two others, and you pick whichever is closer as the crow flies. Cities, capitals, ballparks, stadiums, landmarks, volcanoes and more, fifteen rounds each with the real mileage revealed. No signup.';

const FAQ = [
  ['How does Which Is Closer work?', 'Each round names one place and two others. Tap whichever of the two is closer to the first, measured as the crow flies. The real distances show after every answer, and a quiz runs fifteen rounds.'],
  ['How are the distances measured?', 'In a straight line over the surface of the Earth, from coordinates for each place, not by road or by flight path. That is why a map can fool you: the projection stretches distances near the poles.'],
  ['Are the quizzes free?', 'Yes, every one. An account only keeps your scores and puts you on each quiz leaderboard.'],
  ['Which one should I start with?', 'Major US Cities or World Capitals if you want a feel for it, then any set on a subject you know well.'],
];

function clean(s) {
  // Blurbs are quiz copy written before the em dash rule; this page prints them,
  // so it holds them to it.
  return String(s || '').replace(/\s*—\s*/g, ', ').replace(/\s*–\s*/g, ' to ');
}

function shortTitle(t) {
  return String(t || '').replace(/^Which Is Closer:\s*/i, '');
}

export const metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: '/which-is-closer' },
  openGraph: { title: H1, description: DESCRIPTION, url: '/which-is-closer', type: 'website', siteName: 'Mind Loft' },
  twitter: { card: 'summary_large_image', title: H1, description: DESCRIPTION },
};

function jsonLd(obj) {
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(obj) }} />;
}

export default function WhichIsCloserPage() {
  const quizzes = visibleQuizzes()
    .filter((q) => q.format === 'closer')
    .map((q) => ({
      id: q.id,
      name: shortTitle(q.title),
      rounds: Array.isArray(q.rounds) ? q.rounds.length : 0,
      kind: /^sports/i.test(q.category || '') || q.type === 'sports' || /stadium|arena|ballpark|ground|circuit/i.test(q.id) ? 'Sports' : /^closer-us-|american/.test(q.id) ? 'United States' : 'World',
      blurb: clean(q.blurb),
    }));
  return (
    <>
      {jsonLd({
        '@context': 'https://schema.org',
        '@type': 'ItemList',
        name: H1,
        numberOfItems: quizzes.length,
        itemListElement: quizzes.map((q, i) => ({ '@type': 'ListItem', position: i + 1, name: `Which Is Closer: ${q.name}`, url: `${SITE_URL}/quiz/${q.id}` })),
      })}
      {jsonLd({
        '@context': 'https://schema.org',
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Mind Loft', item: SITE_URL },
          { '@type': 'ListItem', position: 2, name: 'Geography Games', item: `${SITE_URL}/geography-games` },
          { '@type': 'ListItem', position: 3, name: 'Which Is Closer', item: `${SITE_URL}/which-is-closer` },
        ],
      })}
      {jsonLd({
        '@context': 'https://schema.org',
        '@type': 'FAQPage',
        mainEntity: FAQ.map(([q, a]) => ({ '@type': 'Question', name: q, acceptedAnswer: { '@type': 'Answer', text: a } })),
      })}
      <CloserHub h1={H1} quizzes={quizzes} faq={FAQ} />
    </>
  );
}
