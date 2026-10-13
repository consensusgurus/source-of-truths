import SnapshotClient from './SnapshotClient';
import { LISTS } from '@/lib/data';

export async function generateMetadata({ params }) {
  const id = decodeURIComponent(params.id);
  const list = LISTS.find((l) => l.id === id);
  if (list) {
    return {
      title: `${list.title}: Snapshot | Mind Loft`,
      description: list.blurb,
      robots: { index: false, follow: false },
    };
  }
  return { title: 'Snapshot | Mind Loft', robots: { index: false, follow: false } };
}

// On-demand ISR (Vercel support, 2026-06-11): snapshot pages (~1.24MB each) are
// also not prerendered at build, for the same deploy-agent memory reason. The
// route stays fully functional; pages render on first request and cache.
export const dynamicParams = true;
export const revalidate = 3600;

export function generateStaticParams() {
  return [];
}

export default function SnapshotPage({ params }) {
  return <SnapshotClient listId={decodeURIComponent(params.id)} />;
}
