// /quizzes/all — the full quiz index, grouped by department.
//
// This page exists for CRAWLERS first and readers second. Before it shipped (2026-08-09),
// 1,748 of the 1,851 catalog quizzes had no internal link anywhere on the site: they were
// in sitemap.xml and nowhere else, which is why Search Console had 2,461 URLs parked under
// "Discovered - currently not indexed". A sitemap tells Google a URL exists; a link tells
// it the URL matters. /lists has always done this job for the 585 lists.
//
// Two rules keep it working:
//   1. The set comes from catalogQuizzes() (lib/quiz-catalog.js), the SAME helper the
//      sitemap uses, so a sitemapped quiz can never lack a link here.
//   2. It is a SERVER component with plain anchors and no client interactivity. Do not
//      convert it to a filtered/paginated client view: links behind JS state are exactly
//      the thing that made the catalogue invisible in the first place.
//
// Every link is rendered at once (~1,851 anchors, ~200KB). That is deliberate and well
// inside what a crawler handles; the old "100 links per page" guidance is long retired.

import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import Footer from '@/app/Footer';
import { T } from '@/lib/theme';
import { SITE_URL } from '@/lib/site';
import { catalogQuizzes } from '@/lib/quiz-catalog';
import { quizDept, DEPT_LABEL, DEPT_NAV } from '@/lib/quiz-departments';

const QUIZ_COUNT = catalogQuizzes().length.toLocaleString('en-US');

export const metadata = {
  title: `All Quizzes: Browse All ${QUIZ_COUNT} Free Trivia Quizzes | Mind Loft`,
  description: `The complete Mind Loft quiz index. All ${QUIZ_COUNT} free timed trivia quizzes, sorted by department: geography, sports, movies, music, history, business, food, literature, and more.`,
  alternates: { canonical: '/quizzes/all' },
  openGraph: {
    title: `All ${QUIZ_COUNT} Mind Loft Quizzes`,
    description: 'The complete quiz index, by department. Geography, sports, movies, music, history, and the deep cuts.',
    url: '/quizzes/all',
    type: 'website',
    siteName: 'Mind Loft',
  },
  twitter: {
    card: 'summary_large_image',
    title: `All ${QUIZ_COUNT} Mind Loft Quizzes`,
    description: 'The complete quiz index, by department.',
  },
};

const F = "'Manrope', system-ui, -apple-system, sans-serif";

// Departments render in DEPT_NAV order, then any department not in the nav (today only
// 'misc'), so a quiz can never be silently dropped by a department the nav forgot.
function groupByDept(quizzes) {
  const buckets = new Map();
  for (const quiz of quizzes) {
    const dept = quizDept(quiz);
    if (!buckets.has(dept)) buckets.set(dept, []);
    buckets.get(dept).push(quiz);
  }
  const ordered = [];
  const seen = new Set();
  for (const { id } of DEPT_NAV) {
    if (buckets.has(id)) { ordered.push([id, buckets.get(id)]); seen.add(id); }
  }
  for (const [id, items] of buckets) {
    if (!seen.has(id)) ordered.push([id, items]);
  }
  for (const [, items] of ordered) {
    items.sort((a, b) => a.title.localeCompare(b.title));
  }
  return ordered;
}

const CSS = `
.qa-wrap{max-width:1100px;margin:0 auto;padding:28px 20px 64px;position:relative;z-index:2}
.qa-back{font-family:${F};font-size:12px;letter-spacing:.12em;text-transform:uppercase;font-weight:700;color:${T.ink};text-decoration:none;display:inline-flex;align-items:center;gap:6px;padding:8px 0}
.qa-head{border-bottom:1px solid ${T.ink};padding-bottom:22px;margin:16px 0 28px}
.qa-eyebrow{font-family:${F};font-size:12px;letter-spacing:.2em;text-transform:uppercase;color:${T.accent};font-weight:700;margin-bottom:12px}
.qa-h1{font-family:${F};font-weight:800;font-size:clamp(34px,6vw,58px);line-height:1.02;letter-spacing:-.02em;margin:0;color:${T.ink}}
.qa-sub{font-family:${F};font-size:17px;line-height:1.6;color:${T.muted};max-width:660px;margin:18px 0 0}
.qa-jump{display:flex;flex-wrap:wrap;gap:8px;margin:22px 0 8px}
.qa-chip{font-family:${F};font-size:13px;font-weight:700;text-decoration:none;color:${T.accent};background:${T.accentSoft};border:1px solid ${T.accentBorder};border-radius:999px;padding:7px 13px}
.qa-chip span{color:${T.slate};font-weight:600}
.qa-sec{margin-top:38px;scroll-margin-top:16px}
.qa-h2{font-family:${F};font-weight:800;font-size:25px;letter-spacing:-.01em;color:${T.ink};margin:0 0 4px;padding-bottom:9px;border-bottom:1px solid ${T.border}}
.qa-count{font-family:${F};font-size:13px;font-weight:600;color:${T.slate};margin-left:9px}
.qa-grid{list-style:none;margin:14px 0 0;padding:0;display:grid;grid-template-columns:repeat(auto-fill,minmax(320px,1fr));gap:2px 26px}
.qa-grid li{margin:0}
.qa-link{font-family:${F};font-size:14.5px;line-height:1.5;color:${T.muted};text-decoration:none;display:block;padding:5px 0;border-bottom:1px solid transparent}
.qa-link:hover{color:${T.blue};border-bottom-color:${T.accentBorder}}
@media (max-width:640px){.qa-grid{grid-template-columns:1fr}}
`;

export default function AllQuizzesPage() {
  const quizzes = catalogQuizzes();
  const groups = groupByDept(quizzes);

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: 'Mind Loft — All Quizzes',
    url: `${SITE_URL}/quizzes/all`,
    description: `The complete index of all ${QUIZ_COUNT} free Mind Loft trivia quizzes, grouped by department.`,
    isPartOf: { '@type': 'WebSite', name: 'Mind Loft', url: SITE_URL },
  };

  return (
    <div style={{ minHeight: '100vh', background: T.white, color: T.ink, position: 'relative' }}>
      <style dangerouslySetInnerHTML={{ __html: CSS }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: 6, background: 'linear-gradient(90deg,#0b0d12,#233a63 55%,#2563eb)' }} />

      <div className="qa-wrap">
        <Link href="/" className="qa-back">
          <ArrowLeft size={14} strokeWidth={2.5} /> Back to Mind Loft
        </Link>

        <div className="qa-head">
          <div className="qa-eyebrow">The Full Index</div>
          <h1 className="qa-h1">All {QUIZ_COUNT} quizzes.</h1>
          <p className="qa-sub">
            Every quiz on Mind Loft, grouped by department and listed alphabetically. Free,
            timed, and no ads. Looking for the ranked lists instead? Those live on{' '}
            <Link href="/lists" style={{ color: T.blue, fontWeight: 700 }}>the lists index</Link>.
          </p>

          <nav className="qa-jump" aria-label="Jump to a department">
            {groups.map(([dept, items]) => (
              <a key={dept} href={`#${dept}`} className="qa-chip">
                {DEPT_LABEL[dept] || dept} <span>{items.length}</span>
              </a>
            ))}
          </nav>
        </div>

        {groups.map(([dept, items]) => (
          <section key={dept} id={dept} className="qa-sec">
            <h2 className="qa-h2">
              {DEPT_LABEL[dept] || dept}
              <span className="qa-count">{items.length} quizzes</span>
            </h2>
            <ul className="qa-grid">
              {items.map((quiz) => (
                <li key={quiz.id}>
                  <Link href={`/quiz/${quiz.id}`} className="qa-link">{quiz.title}</Link>
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>

      <Footer />
    </div>
  );
}
