import { redirect } from 'next/navigation';
import { normCode } from '@/lib/groups';

// The short invite link. /g/K7Q2X lands on the group's own page, which shows
// the board with the join bar on top.
export default function GroupInvite({ params }) {
  const code = normCode(params.code);
  redirect(code ? `/groups/${code}` : '/groups');
}
