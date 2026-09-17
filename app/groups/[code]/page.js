import GroupClient from './GroupClient';
import { normCode } from '@/lib/groups';
import { notFound } from 'next/navigation';

export const dynamic = 'force-dynamic';

// A group page names its members, so it is never indexed.
export const metadata = {
  title: 'Group | Mind Loft',
  description: 'A private Mind Loft group: a daily board, per-game rankings, member stats and history for the people you play with.',
  robots: { index: false, follow: false },
};

export default function GroupPage({ params }) {
  const code = normCode(params.code);
  if (!code) notFound();
  return <GroupClient code={code} />;
}
