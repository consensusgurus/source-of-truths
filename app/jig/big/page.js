import { redirect } from 'next/navigation';
import BigClient from './BigClient';
import { PUZZLES as JIG } from '../puzzles';
import { PUZZLES as SAW } from '../../saw/puzzles';
import { JIGSAW_SIZES, cutFor, ownSize, freeId } from '@/lib/jigsaw-sizes';
import { etToday } from '@/lib/jigsaw-library';

// /jig/big?g=jig|saw&n=<number>&pieces=<size>: FREE-PLAY JIGSAW (owner,
// 2026-11-21). Any past Jig or Saw photo at any size from lib/jigsaw-sizes.js,
// built alone on the Mural board. Not scored, not a daily, not its own search
// result: it is noindex and canonical to the photo's own page (/jig?p=N), which
// is the page that ranks for the picture. Today's and future photos, an unknown
// number or size, and the daily's own size all go back to the right page.

export const dynamic = 'force-dynamic';

function pick(sp) {
  const g = sp && sp.g === 'saw' ? 'saw' : 'jig';
  const n = Number(sp && sp.n);
  const size = Number(sp && sp.pieces);
  const bank = g === 'saw' ? SAW : JIG;
  const p = Number.isInteger(n) ? bank.find((x) => x.num === n) : null;
  return { g, n, size, p };
}

export function generateMetadata({ searchParams }) {
  const { g, size, p } = pick(searchParams);
  if (!p) return { robots: { index: false, follow: true } };
  const s = JIGSAW_SIZES.includes(size) ? size.toLocaleString('en-US') : '';
  return {
    title: `${p.name}: ${s} Piece Jigsaw Puzzle | Mind Loft`,
    description: `Play ${p.name} as a free ${s} piece online jigsaw puzzle. No download, no signup, and your progress is saved in your browser.`,
    alternates: { canonical: `/${g}?p=${p.num}` },
    robots: { index: false, follow: true },
  };
}

export default function BigJigsawPage({ searchParams }) {
  const { g, size, p } = pick(searchParams);
  if (!p || !(p.live < etToday())) redirect('/jig/shelf');
  if (!JIGSAW_SIZES.includes(size) || size === ownSize(p.cols, p.rows)) redirect(`/${g}?p=${p.num}`);
  const cut = cutFor(size, p.cols, p.rows);
  const photo = { g, n: p.num, key: `${g}-${p.num}-${size}`, id: freeId(g, p.num, size), size, cols: cut.cols, rows: cut.rows, name: p.name, by: p.by, lic: p.lic };
  return <BigClient photo={photo} />;
}
