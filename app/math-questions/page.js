import { HubPage, hubMetadata } from '../QdbPages';

// /math-questions: the Math Database hub (owner, 2026-11-21). See app/QdbPages.jsx and lib/qdb.js.
export const dynamic = 'force-dynamic';
export function generateMetadata() { return hubMetadata('math'); }
export default function Page() { return <HubPage db="math" />; }
