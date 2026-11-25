import { HubPage, hubMetadata } from '../QdbPages';

// /career-questions: the Careers Database hub (owner, 2026-11-25). See app/QdbPages.jsx and lib/qdb.js.
export const dynamic = 'force-dynamic';
export function generateMetadata() { return hubMetadata('careers'); }
export default function Page() { return <HubPage db="careers" />; }
