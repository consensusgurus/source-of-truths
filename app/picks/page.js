import { redirect } from 'next/navigation';

// Picks is played only inside Price Check (owner, 2026-11-06): it is the run's
// middle leg, so its own address sends the visitor to the run.
export const dynamic = 'force-dynamic';
export default function Page() { redirect('/pricecheck'); }
