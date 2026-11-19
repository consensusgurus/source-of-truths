import PrivateMuralClient from './PrivateMuralClient';

// PRIVATE MURALS (owner, 2026-11-19): the page the Mural menu's "Private Mural"
// button and the Puzzle Shelf's Murals tab lead to. Start one for a group or for
// anyone with the link, get the link to share, and find the ones you are in.

export const metadata = {
  title: 'Private Mural: A Jigsaw To Build With Your Group | Mind Loft',
  description: 'Start a private jigsaw mural on Mind Loft and build it with your group or anyone you send the link to. Pick the picture and the size, from 640 to 4,000 pieces.',
  alternates: { canonical: '/mural/private' },
};

export default function Page() {
  return (
    <main>
      <PrivateMuralClient />
    </main>
  );
}
