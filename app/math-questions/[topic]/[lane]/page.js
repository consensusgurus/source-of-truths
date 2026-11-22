import { LanePage, laneMetadata } from '../../../QdbPages';

// /math-questions/<topic>/<subtopic>: one subtopic of the Math Database, its past
// questions printed with choices and answers (2026-11-22). See app/QdbPages.jsx LanePage.
// NEVER BUILT AT DEPLOY: no params are generated, so a page renders on its first
// request and is cached for a day (a build must not grow with these ~200 pages).
export const revalidate = 86400;
export function generateStaticParams() { return []; }
export function generateMetadata({ params }) { return laneMetadata('math', params.topic, params.lane); }
export default function Page({ params }) { return <LanePage db="math" slug={params.topic} lane={params.lane} />; }
