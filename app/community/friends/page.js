import { permanentRedirect } from 'next/navigation';

// Puzzle Friends was renamed Puzzle Peers (owner, 2026-11-18).
export default function Page() {
  permanentRedirect('/community/peers');
}
