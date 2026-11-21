import { redirect } from 'next/navigation';

// Trawl was renamed Search on its launch night (owner, 2026-11-20). Keep the old
// address working for anyone who saved or shared it.
export default function TrawlMoved({ searchParams }) {
  const q = new URLSearchParams();
  for (const k of ['b', 'p']) if (searchParams && searchParams[k]) q.set(k, String(searchParams[k]));
  redirect(`/search${q.toString() ? `?${q}` : ''}`);
}
