import { TopicPage, topicMetadata } from '../../QdbPages';

// /science-questions/<topic>: one topic of the Science Database (owner, 2026-11-21). See app/QdbPages.jsx.
export const dynamic = 'force-dynamic';
export function generateMetadata({ params }) { return topicMetadata('science', params.topic); }
export default function Page({ params }) { return <TopicPage db="science" slug={params.topic} />; }
