import { TopicPage, topicMetadata } from '../../QdbPages';

// /english-questions/<topic>: one topic of the English Database (owner, 2026-11-21). See app/QdbPages.jsx.
export const dynamic = 'force-dynamic';
export function generateMetadata({ params }) { return topicMetadata('english', params.topic); }
export default function Page({ params }) { return <TopicPage db="english" slug={params.topic} />; }
