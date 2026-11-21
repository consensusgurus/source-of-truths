import { notFound } from 'next/navigation';
import TriviaPortal from '../TriviaPortal';
import PageViewBeacon from '../../PageViewBeacon';
import { SITE_URL } from '@/lib/site';
import { topicBySlug } from '@/lib/trivia-topics';
import { poolStats, samples, etToday, topicCards } from '@/lib/trivia-library';

// /trivia-questions/<topic>: one trivia topic (owner, 2026-11-21). Pick lanes,
// pick a mode and play; under it, a dozen sample questions WITH their answers
// in the page (and as Quiz data), which is what a search for "history trivia
// questions and answers" wants to find. The samples move on once a week.

export const dynamic = 'force-dynamic';

const TIER = ['', 'Gimme', 'Easy', 'Medium', 'Hard', 'Expert'];

export function generateMetadata({ params }) {
  const t = topicBySlug(params.topic);
  if (!t) return {};
  const url = `/trivia-questions/${t.slug}`;
  return {
    title: t.title,
    description: t.blurb,
    alternates: { canonical: url },
    openGraph: { title: `${t.h1}, Free`, description: t.blurb, url, type: 'website', siteName: 'Mind Loft', images: [{ url: '/og/trivia-questions.png', width: 1200, height: 630 }] },
    twitter: { card: 'summary_large_image', title: `${t.h1}, Free`, description: t.blurb, images: ['/og/trivia-questions.png'] },
  };
}

function faqFor(t, n) {
  const lbl = t.label.toLowerCase();
  return [
    { q: `How many ${lbl} trivia questions are there?`, a: `${n.toLocaleString('en-US')} so far, every one from a past Mind Loft daily, and more join every day. Play them in Gauntlet, Practice, Sprint, or Streak mode, at any level from gimme to expert.` },
    { q: `Can I practice ${lbl} trivia without a clock?`, a: 'Yes. Practice mode has no clock and no lives: after a miss it shows the right answer and moves on, and every miss comes back later in Retry my misses on the trivia questions page.' },
    { q: 'Is it free?', a: 'Yes, free in your browser with no signup. Your record stays in this browser; the ranked daily trivia is the Trivia Gauntlet and Trivia Encore, new every day.' },
  ];
}

export default function TriviaTopicPage({ params }) {
  const t = topicBySlug(params.topic);
  if (!t) notFound();
  const today = etToday();
  const stats = poolStats(today);
  const topics = topicCards(stats);
  const me = topics.find((x) => x.slug === t.slug);
  const sample = samples(t.slug, 12, today);
  const faq = faqFor(t, me.n);
  const crumbs = [{ label: 'Home', href: '/' }, { label: 'Trivia Questions', href: '/trivia-questions' }, { label: t.label, href: `/trivia-questions/${t.slug}` }];
  const quizLd = {
    '@context': 'https://schema.org',
    '@type': 'Quiz',
    name: t.h1,
    description: t.blurb,
    url: `${SITE_URL}/trivia-questions/${t.slug}`,
    about: { '@type': 'Thing', name: t.label },
    educationalLevel: 'Beginner to expert',
    isAccessibleForFree: true,
    numberOfQuestions: me.n,
    isPartOf: { '@type': 'CollectionPage', name: 'Trivia Questions and Answers', url: `${SITE_URL}/trivia-questions` },
    hasPart: sample.map((q) => ({
      '@type': 'Question',
      eduQuestionType: 'Multiple choice',
      name: q.q,
      text: q.q,
      educationalLevel: TIER[q.tier] || 'Medium',
      acceptedAnswer: { '@type': 'Answer', text: q.c[q.a] },
      suggestedAnswer: q.c.filter((_, i) => i !== q.a).map((c) => ({ '@type': 'Answer', text: c })),
    })),
  };
  const crumbLd = { '@context': 'https://schema.org', '@type': 'BreadcrumbList', itemListElement: crumbs.map((c, i) => ({ '@type': 'ListItem', position: i + 1, name: c.label, ...(i < crumbs.length - 1 ? { item: `${SITE_URL}${c.href === '/' ? '' : c.href}` } : {}) })) };
  const faqLd = { '@context': 'https://schema.org', '@type': 'FAQPage', mainEntity: faq.map((f) => ({ '@type': 'Question', name: f.q, acceptedAnswer: { '@type': 'Answer', text: f.a } })) };
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(quizLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(crumbLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqLd) }} />
      <PageViewBeacon id={`trivia-questions-${t.slug}`} />
      <TriviaPortal topics={topics} topic={{ ...me, h1: t.h1, blurb: t.blurb }} samples={sample} faq={faq} crumbs={crumbs} />
    </>
  );
}
