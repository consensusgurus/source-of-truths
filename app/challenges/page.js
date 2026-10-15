import ChallengesClient from './ChallengesClient';

// YOUR CHALLENGES (owner, 2026-10-15): every challenge link this player sent,
// who opened it, who finished, how it went, and their $100 drawing tickets.
// One viewer's own data, so it is not for search.
export const metadata = {
  title: 'Your challenges | Mind Loft',
  description: 'Every challenge you sent, who took it, and how it went.',
  robots: { index: false, follow: true },
};

export default function ChallengesPage() {
  return <ChallengesClient />;
}
