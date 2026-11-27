// /api/photo-puzzles/img?id=<code>[&w=330|500|960|1280|1920|3840]   (GET)
//
// A player's own photo for YOUR PHOTO JIGSAWS (owner, 2026-11-27; lib/photo-puzzles.js). Same
// origin on purpose, like /api/jig/img: the board reads the pixels on a canvas. Widths up to 960
// get the small copy, anything bigger the full picture (long side up to 3840).
//
// The code is the private link, so it is the only key. A link turned off or turned down 404s, and
// the edge keeps a copy for an hour at most, so turning a link off takes hold within the hour.

import { getMeta, linkLive, readImage } from '@/lib/photo-puzzles';

export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';

export async function GET(req) {
  const sp = new URL(req.url).searchParams;
  const m = await getMeta(sp.get('id'));
  if (!linkLive(m)) return new Response('Not found', { status: 404 });
  const w = Number(sp.get('w')) || 1280;
  const buf = await readImage(m.code, w <= 960);
  if (!buf) return new Response('Not found', { status: 404 });
  return new Response(buf, {
    status: 200,
    headers: {
      'Content-Type': 'image/jpeg',
      'Cache-Control': 'public, max-age=3600, s-maxage=3600',
      'X-Robots-Tag': m.status === 'approved' ? 'all' : 'noindex',
    },
  });
}
