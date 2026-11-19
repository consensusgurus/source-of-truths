import TalkIndexClient from '../TalkIndexClient';

export const metadata = {
  title: 'Post-Game Talk | Mind Loft',
  description: 'One discussion for every Mind Loft daily puzzle, every day, open once you finish the puzzle so nothing is spoiled.',
  alternates: { canonical: '/community/talk' },
  openGraph: { title: 'Post-Game Talk · Mind Loft', description: 'One discussion for every Mind Loft daily puzzle, every day, open once you finish the puzzle so nothing is spoiled.', url: '/community/talk', type: 'website', siteName: 'Mind Loft' },
};

export default function Page() {
  return <TalkIndexClient />;
}
