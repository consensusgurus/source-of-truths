import { permanentRedirect } from 'next/navigation';

// Clubs were renamed Groups (owner, 2026-11-18).
export default function Page() {
  permanentRedirect('/community/groups');
}
