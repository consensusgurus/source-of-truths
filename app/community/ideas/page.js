import IdeasClient from '../IdeasClient';

export const metadata = {
  title: 'Idea Board | Mind Loft',
  description: 'Pitch a new puzzle, a variation on one you play, or a fix for Mind Loft, and vote for the ideas you want built.',
  alternates: { canonical: '/community/ideas' },
  openGraph: { title: 'Idea Board · Mind Loft', description: 'Pitch and vote on ideas for new Mind Loft puzzles.', url: '/community/ideas', type: 'website', siteName: 'Mind Loft' },
};

export default function Page({ searchParams }) {
  const pitch = typeof searchParams?.pitch === 'string' ? searchParams.pitch : null;
  const game = typeof searchParams?.game === 'string' ? searchParams.game.slice(0, 40) : null;
  return <IdeasClient pitch={pitch} game={game} />;
}
