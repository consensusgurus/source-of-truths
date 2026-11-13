import { NextResponse } from 'next/server';
import { catalogQuizzes } from '@/lib/quiz-catalog';
import { quizDept, DEPT_LABEL, DEPT_NAV } from '@/lib/quiz-departments';

// GET /api/quiz/topics -> { topics: [{ id, label, count,
//   quizzes: [{ id, title, n, t, mcq, d }] }] }
//
// `n` is how many things the quiz asks for and `t` its clock in seconds, both
// omitted when they are zero so the payload only grows by what is real. They
// exist for /quizzes, which prints a tagline under every tile in the SITE OWN
// words -- the quiz cap says "24 answers" and an mcq client says "questions",
// and `mcq` is which of those two this quiz will say. Without them a tile can
// only repeat the title in smaller type.
//
// The quiz catalogue grouped by department, for the home's expandable Quizzes
// section (app/today/StageToday.jsx).
//
// IT IS THE SAME SET AND THE SAME GROUPING AS /quizzes/all, deliberately.
// catalogQuizzes() (lib/quiz-catalog.js) is the helper the sitemap and the full
// index both derive from, and quizDept is the one department map, so the home
// and the index cannot disagree about what is in Geography or quietly drop a
// quiz between them. Never re-inline either filter here.
//
// IT IS A ROUTE RATHER THAN A PROP because lib/quizzes.js is 4.4MB of source
// and both surfaces that render the section are client components: importing
// QUIZZES into StageToday would put the whole catalogue in the /today bundle
// for a section most readers never open. Nothing in the payload depends on the
// request or on the database, so it is generated at build time and served from
// the edge, and the client fetches it once, only when the section comes into
// view.
//
// NEWEST FIRST INSIDE A TOPIC, not alphabetical. The home shows a peek of a
// dozen or so before "show all", and an alphabetical peek is the same handful
// of titles beginning with A every single day. /quizzes/all stays alphabetical,
// which is the right order for an index you are scanning for a known title.
// BUILT AT BUILD TIME, exactly as /quizzes/all is. That page is a server
// component with no dynamic export, so it is statically generated too, which
// means both surfaces show the catalogue as of the last deploy and a quiz
// banked for a future date appears on both at the same moment: the next push.
// Keep the two the same. A dynamic route here would show a banked quiz on the
// home before the index it links to had it.
export const dynamic = 'force-static';

const CACHE_HEADERS = {
  'Cache-Control': 'public, s-maxage=86400, stale-while-revalidate=604800',
};

function stamp(quiz) {
  const t = Date.parse(quiz.publishedAt || quiz.publishedDate || '');
  return Number.isFinite(t) ? t : 0;
}

// DEPT_NAV order first, then any department the nav does not carry (today only
// 'misc'), so a quiz can never be silently dropped by a forgotten department.
// This mirrors groupByDept in app/quizzes/all/page.js on purpose: the two pages
// are the same catalogue and must be in the same order.
function group(quizzes) {
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
  return ordered;
}

export function GET() {
  try {
    const topics = group(catalogQuizzes()).map(([id, items]) => {
      const sorted = items
        .slice()
        .sort((a, b) => stamp(b) - stamp(a) || String(a.title).localeCompare(String(b.title)));
      return {
        id,
        label: DEPT_LABEL[id] || id,
        count: sorted.length,
        quizzes: sorted.map((q) => {
          const mcq = Array.isArray(q.questions) && q.questions.length > 0;
          const n = mcq
            ? q.questions.length
            : (Array.isArray(q.answers) ? q.answers.length : 0);
          const t = Number(q.timeLimit) || 0;
          const row = { id: q.id, title: q.title };
          if (n) row.n = n;
          if (t) row.t = t;
          if (mcq) row.mcq = true;
          // d: the publish date, for the home's Newest sort.
          const d = String(q.publishedAt || q.publishedDate || '').slice(0, 10);
          if (d) row.d = d;
          return row;
        }),
      };
    });
    return NextResponse.json({ topics }, { headers: CACHE_HEADERS });
  } catch (e) {
    // A home section is not worth a 500: an empty list renders as no section.
    return NextResponse.json({ topics: [] }, { headers: CACHE_HEADERS });
  }
}
