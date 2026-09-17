import { Suspense } from 'react';
import { redirect } from 'next/navigation';
import QuizClient from './QuizClient';
import QuizStageShell from './QuizStageShell';
import { quizIntro, OWN_BOARD_FORMATS } from '@/lib/quiz-intro';
import { quizDept, DEPT_LABEL } from '@/lib/quiz-departments';
import CruxRedirect from './CruxRedirect';
import { QuizSeoSection } from '@/app/SeoSection';
import { getQuiz } from '@/lib/quizzes';
import { SITE_URL } from '@/lib/site';

// 24h, not 1h (2026-08-08, Vercel cost fix). ~1,200 quiz pages expiring hourly
// was the bulk of 81.9K ISR writes per 4 days, and because each page is served
// only a handful of times an hour, WRITES EXCEEDED READS. Nothing on this page
// goes stale in between: the content is static from lib/quizzes.js, everything
// live (board, player, standings) is client-fetched, and a deploy invalidates
// the whole cache anyway.
export const revalidate = 86400;

// On-demand ISR: do NOT prerender all ~1,200 quiz pages at build (each imports
// the 2.6MB quizzes.js; together they dominated build time). [] renders each
// page on first request and CDN-caches it via `revalidate`; dynamicParams=true
// allows any quiz id to render on demand.
export const dynamicParams = true;

export function generateStaticParams() {
  return [];
}

export async function generateMetadata({ params }) {
  const id = decodeURIComponent(params.id);
  const quiz = getQuiz(id);
  if (!quiz) return { title: 'Quiz not found | Mind Loft' };

  const url = `/quiz/${encodeURIComponent(id)}`;
  // Format-agnostic share copy: just the topic and its description, so the card
  // reads correctly for name-them-all, map, and matching quizzes alike.
  const description = quiz.blurb;
  const ogTitle = quiz.title;

  // Daily-game catalog stubs render only a client-side hop to the game page.
  // Canonicalize them to the evergreen game URLs so the dated stubs don't
  // compete with /crux, /garble, /links, /span in search (they're also out
  // of the sitemap).
  const GAME_URLS = { crux: '/crux', emcee: '/emcee', garble: '/garble', links: '/links', span: '/span', dating: '/dating', tally: '/tally', suds: '/suds', circa: '/circa', extra: '/extra', carve: '/carve', stet: '/stet', outwit: '/outwit', tuck: '/tuck', alibi: '/alibi', cipher: '/cipher', ping: '/ping', warmer: '/warmer', jester: '/jesters', sworn: '/sworn', outrank: '/outrank' };
  const gameCanonical = GAME_URLS[quiz.format] || null;

  return {
    title: `${quiz.title} | Mind Loft`,
    description,
    alternates: { canonical: gameCanonical || url },
    openGraph: {
      title: ogTitle,
      description,
      url,
      type: 'website',
      siteName: 'Mind Loft',
    },
    twitter: {
      card: 'summary_large_image',
      title: ogTitle,
      description,
    },
  };
}

// ISO 8601 duration for the Quiz JSON-LD's timeRequired.
function isoDuration(seconds) {
  if (!seconds || seconds <= 0) return null;
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  const mm = m ? String(m) + 'M' : '';
  const ss = s ? String(s) + 'S' : '';
  return 'PT' + mm + ss;
}

export default function QuizPage({ params }) {
  const id = decodeURIComponent(params.id);
  const quiz = getQuiz(id);

  // Crux lives on its own page; the catalog entry exists so the hub and
  // search can surface it (the sitemap carries /crux + /garble instead, and
  // these stubs canonicalize there). Send players to the real board via a
  // client-side hop that preserves ?duel=/?ch= params (see CruxRedirect).
  // (Legacy id from the few hours it launched as Crosslock, 2026-07-06.)
  if (id === 'crosslock-7-6-26') redirect('/crux?p=1');
  if (quiz && quiz.format === 'crux') return <CruxRedirect num={quiz.cruxNum || null} />;
  if (quiz && quiz.format === 'emcee') return <CruxRedirect num={quiz.gameNum || null} base="/emcee" />;
  if (quiz && quiz.format === 'garble') return <CruxRedirect num={quiz.gameNum || null} base="/garble" />;
  if (quiz && quiz.format === 'links') return <CruxRedirect num={quiz.gameNum || null} base="/links" />;
  if (quiz && quiz.format === 'span') return <CruxRedirect num={quiz.gameNum || null} base="/span" />;
  if (quiz && quiz.format === 'dating') return <CruxRedirect num={quiz.gameNum || null} base="/dating" />;
  if (quiz && quiz.format === 'tally') return <CruxRedirect num={quiz.gameNum || null} base="/tally" />;
  if (quiz && quiz.format === 'suds') return <CruxRedirect num={quiz.gameNum || null} base="/suds" />;
  if (quiz && quiz.format === 'carve') return <CruxRedirect num={quiz.gameNum || null} base="/carve" />;
  if (quiz && quiz.format === 'circa') return <CruxRedirect num={quiz.gameNum || null} base="/circa" />;
  if (quiz && quiz.format === 'extra') return <CruxRedirect num={quiz.gameNum || null} base="/extra" />;
  if (quiz && quiz.format === 'stet') return <CruxRedirect num={quiz.gameNum || null} base="/stet" />;
  if (quiz && quiz.format === 'outwit') return <CruxRedirect num={quiz.gameNum || null} base="/outwit" />;
  if (quiz && quiz.format === 'outrank') return <CruxRedirect num={quiz.gameNum || null} base="/outrank" />;
  if (quiz && quiz.format === 'tuck') return <CruxRedirect num={quiz.gameNum || null} base="/tuck" />;
  if (quiz && quiz.format === 'alibi') return <CruxRedirect num={quiz.gameNum || null} base="/alibi" />;
  if (quiz && quiz.format === 'cipher') return <CruxRedirect num={quiz.gameNum || null} base="/cipher" />;
  if (quiz && quiz.format === 'ping') return <CruxRedirect num={quiz.gameNum || null} base="/ping" />;
  if (quiz && quiz.format === 'warmer') return <CruxRedirect num={quiz.gameNum || null} base="/warmer" />;
  if (quiz && quiz.format === 'jester') return <CruxRedirect num={quiz.gameNum || null} base="/jesters" />;
  if (quiz && quiz.format === 'sworn') return <CruxRedirect num={quiz.gameNum || null} base="/sworn" />;

  // numberOfQuestions / timeRequired added 2026-08-17 alongside the SEO
  // section: they are the two facts a Quiz result can actually display, and
  // they cost nothing because both already sit on the quiz object.
  const questionCount =
    quiz &&
    ((Array.isArray(quiz.answers) && quiz.answers.length) ||
      (Array.isArray(quiz.questions) && quiz.questions.length) ||
      (Array.isArray(quiz.pairs) && quiz.pairs.length) ||
      0);
  const duration = quiz ? isoDuration(quiz.timeLimit) : null;

  const jsonLd = quiz
    ? {
        '@context': 'https://schema.org',
        '@type': 'Quiz',
        name: quiz.title,
        about: quiz.blurb,
        url: `${SITE_URL}/quiz/${quiz.id}`,
        inLanguage: 'en',
        isAccessibleForFree: true,
        learningResourceType: 'Quiz',
        ...(questionCount ? { numberOfQuestions: questionCount } : {}),
        ...(duration ? { timeRequired: duration } : {}),
      }
    : null;

  const intro = quiz ? quizIntro(quiz) : null;
  const shell = quiz ? (
    <QuizStageShell
      quizId={quiz.id}
      title={quiz.title}
      cat={DEPT_LABEL[quizDept(quiz)] || quiz.category || 'Quiz'}
      total={intro.total}
      clockMax={intro.clockMax}
      headline={intro.headline}
      body={intro.body}
      blurb={quiz.blurb}
      ownBoard={OWN_BOARD_FORMATS.has(quiz.format)}
    />
  ) : null;

  return (
    <>
      {jsonLd && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      )}
      {/* THE FALLBACK IS THE FIRST PAINT. QuizClient bails out of this ISR
          render (useSearchParams), so whatever sits here is all the server
          sends of the quiz. See QuizStageShell. */}
      <Suspense fallback={shell}>
        <QuizClient quizId={id} />
      </Suspense>
      {/* Sits OUTSIDE the Suspense boundary on purpose. QuizClient calls
          useSearchParams, which bails the whole boundary to its null fallback
          during static rendering, so anything inside it (children and props
          included) is dropped from the server HTML. Outside the boundary is
          the only place a server-rendered node survives on this route, and
          that is the entire point of this section. See app/SeoSection.jsx. */}
      <QuizSeoSection quiz={quiz} />
    </>
  );
}
