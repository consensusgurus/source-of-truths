import { redirect } from 'next/navigation';

// Judged was called Lawyering for its first morning (2026-10-08). Old links,
// shared results included, land on the run's real address with their query.
export default function LawyeringRedirect({ searchParams }) {
  const q = new URLSearchParams(searchParams || {}).toString();
  redirect(`/judged${q ? `?${q}` : ''}`);
}
