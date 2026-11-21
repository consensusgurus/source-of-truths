import { TopicPage, topicMetadata } from '../../QdbPages';

// /math-questions/<topic>: one topic of the Math Database (owner, 2026-11-21). See app/QdbPages.jsx.
export const dynamic = 'force-dynamic';
export function generateMetadata({ params }) { return topicMetadata('math', params.topic); }
export default function Page({ params }) { return <TopicPage db="math" slug={params.topic} />; }
