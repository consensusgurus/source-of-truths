import { redirect } from 'next/navigation';

// /quizzes — RETIRED AS A PAGE (owner, 2026-10-16).
//
// Everything this page carried (the photo banners, search, the catalogue by
// topic, every topic's full list, "Your best topics") now lives in the home's
// Quizzes pane, app/today/StageToday.jsx (#sty-quizzes). This route survives
// only so the many old links and shared URLs still land somewhere useful: it
// sends the reader to the home with that pane open, keeping any query string
// (a referral ?ref=, a ?theme= review override) so nothing is lost on the way.
//
// It is a TEMPORARY redirect on purpose, so browsers do not cache it, and it is
// out of the sitemap (lib/sitemap-entries.js): a redirecting URL there is
// flagged "Page with redirect" in Search Console. /quizzes/all is NOT retired:
// it stays live for crawlers, linked from nowhere on the site.
export const dynamic = 'force-dynamic';

export default function QuizzesPage({ searchParams }) {
  const qs = new URLSearchParams();
  for (const [k, v] of Object.entries(searchParams || {})) {
    if (Array.isArray(v)) v.forEach((x) => qs.append(k, x));
    else if (v != null) qs.set(k, v);
  }
  const s = qs.toString();
  redirect(`/${s ? `?${s}` : ''}#sty-quizzes`);
}
