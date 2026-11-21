import { HubPage, hubMetadata } from '../QdbPages';

// /english-questions: the English Database hub (owner, 2026-11-21). See app/QdbPages.jsx and lib/qdb.js.
export const dynamic = 'force-dynamic';
export function generateMetadata() { return hubMetadata('english'); }
export default function Page() { return <HubPage db="english" />; }
