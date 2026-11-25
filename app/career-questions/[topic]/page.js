import { TopicPage, topicMetadata } from '../../QdbPages';

// /career-questions/<topic>: one topic of the Careers Database (owner, 2026-11-25). See app/QdbPages.jsx.
export const dynamic = 'force-dynamic';
export function generateMetadata({ params }) { return topicMetadata('careers', params.topic); }
export default function Page({ params }) { return <TopicPage db="careers" slug={params.topic} />; }
