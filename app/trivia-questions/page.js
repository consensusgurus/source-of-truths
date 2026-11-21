import TriviaPortal from './TriviaPortal';
import PageViewBeacon from '../PageViewBeacon';
import { SITE_URL } from '@/lib/site';
import { poolStats, etToday, topicCards } from '@/lib/trivia-library';

// /trivia-questions: THE TRIVIA PORTAL (owner, 2026-11-21: "make the site the
// top spot for multiple choice trivia ... play old questions by topic in same
// format", built with "same SEO" as the jigsaw portal). Every question that has
// already run on a gauntlet daily, by topic, playable in four modes on the
// gauntlet stage. The client is TriviaPortal.jsx; each topic has its own page
// (./[topic]) with sample questions and answers. The address is new on purpose:
// /trivia stays the Trivia Gauntlet's door and /trivia-games the category page.

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Trivia Questions and Answers: 23,000 Free Multiple Choice Quizzes | Mind Loft',
  description: 'Free trivia questions and answers in 12 topics: general knowledge, geography, sports, history, science, movies and more. Play any topic, from easy to expert, no signup.',
  alternates: { canonical: '/trivia-questions' },
  openGraph: {
    images: [{ url: '/og/trivia-questions.png', width: 1200, height: 630, alt: 'Mind Loft trivia questions: thousands of free multiple choice questions by topic' }],
    title: 'Free Trivia Questions by Topic, Easy to Expert',
    description: 'Thousands of multiple choice trivia questions in 12 topics. Play any one in Gauntlet, Practice, Sprint, or Streak mode.',
    url: '/trivia-questions', type: 'website', siteName: 'Mind Loft',
  },
  twitter: {
    images: ['/og/trivia-questions.png'], card: 'summary_large_image',
    title: 'Free Trivia Questions by Topic, Easy to Expert',
    description: 'Thousands of multiple choice trivia questions in 12 topics. Play any one in Gauntlet, Practice, Sprint, or Streak mode.',
  },
};

const FAQ = [
  { q: 'Are these trivia questions free?', a: 'Yes. Every question is free to play in your browser on a phone or a computer, with no app and no signup. Your record (what you have seen, your best scores, and the questions you missed) is kept in this browser.' },
  { q: 'Where do the questions come from?', a: 'Every one has already run as a Mind Loft daily gauntlet, from the Trivia Gauntlet and Trivia Encore to the English and Science Gauntlets. A question only joins the archive the day after it runs, so playing here never spoils a coming daily.' },
  { q: 'How do the four modes work?', a: 'Gauntlet gives you one life and 20 seconds a question, climbing from gimme to expert. Practice has no lives and no clock, and shows the right answer after a miss. Sprint is as many as you can answer in 60 seconds. Streak has one life and no end until you miss.' },
  { q: 'Can I pick an easy or a hard quiz?', a: 'Yes. Pick Ramp to climb from gimme to expert, or play one level the whole way: Gimme, Easy, Medium, Hard, or Expert. Open a topic to narrow it to the lanes you want, like capitals or the Middle Ages.' },
  { q: 'Does playing here count toward my Mind Loft score?', a: 'No. Archive play is just for fun and practice. The ranked games are the daily ones: the Trivia Gauntlet and Trivia Encore open fresh every day at midnight Eastern, and only your first try counts.' },
  { q: 'How many trivia questions are there?', a: 'Over 23,000 so far, and the archive grows by a few hundred every day as each day’s gauntlets join it.' },
];


export default function TriviaQuestionsPage() {
  const stats = poolStats(etToday());
  const topics = topicCards(stats);
  const total = topics.reduce((a, t) => a + t.n, 0);
  const collection = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: 'Trivia Questions and Answers',
    description: metadata.description,
    url: `${SITE_URL}/trivia-questions`,
    isPartOf: { '@type': 'WebSite', name: 'Mind Loft', url: SITE_URL },
    about: { '@type': 'Thing', name: 'Trivia' },
    hasPart: topics.map((t) => ({ '@type': 'Quiz', name: `${t.label} trivia questions`, url: `${SITE_URL}/trivia-questions/${t.slug}`, educationalLevel: 'Beginner to expert', numberOfQuestions: t.n })),
  };
  const crumbs = [{ label: 'Home', href: '/' }, { label: 'Trivia', href: '/trivia-games' }, { label: 'Trivia Questions', href: '/trivia-questions' }];
  const crumbLd = { '@context': 'https://schema.org', '@type': 'BreadcrumbList', itemListElement: crumbs.map((c, i) => ({ '@type': 'ListItem', position: i + 1, name: c.label, ...(i < crumbs.length - 1 ? { item: `${SITE_URL}${c.href === '/' ? '' : c.href}` } : {}) })) };
  const faqLd = { '@context': 'https://schema.org', '@type': 'FAQPage', mainEntity: FAQ.map((f) => ({ '@type': 'Question', name: f.q, acceptedAnswer: { '@type': 'Answer', text: f.a } })) };
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(collection) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(crumbLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqLd) }} />
      <PageViewBeacon id="trivia-questions" />
      <TriviaPortal topics={topics} total={total} faq={FAQ} crumbs={crumbs} />
    </>
  );
}
