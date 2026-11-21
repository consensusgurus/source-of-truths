import { TopicPage, topicMetadata } from '../../QdbPages';

// /trivia-questions/<topic>: one topic of the Trivia Database (owner, 2026-11-21). See app/QdbPages.jsx.
export const dynamic = 'force-dynamic';
export function generateMetadata({ params }) { return topicMetadata('trivia', params.topic); }
export default function Page({ params }) { return <TopicPage db="trivia" slug={params.topic} />; }
