import { permanentRedirect } from 'next/navigation';

// Retired 2026-11-13: the kids Jigsaw and Tall Jigsaw tiles became one Puzzle
// Shelf (/kids/jigsaw), which holds every Jig and Saw photo on one screen. A
// shelf pick link (?pic=saw-12&n=20) carries over unchanged.
export default function KidsTallJigsawPage({ searchParams }) {
  const q = new URLSearchParams();
  for (const k of ['pic', 'n', 'p']) {
    const v = searchParams && searchParams[k];
    if (typeof v === 'string' && v) q.set(k, v);
  }
  const s = q.toString();
  permanentRedirect(`/kids/jigsaw${s ? `?${s}` : ''}`);
}
