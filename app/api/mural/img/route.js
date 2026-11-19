import { supabaseAdmin } from '@/lib/supabase-server';
import { commonsUrl } from '@/lib/mural';
import { parseMuralId } from '@/lib/mural-shared';

// GET /api/mural/img?id=<mural id>[&w=960|1920|3840]
//
// The photo of one mural, the same design as /api/jig/img: fetched from
// Wikimedia Commons at one of its standard widths and handed on with a
// one-year edge cache, which also makes it same-origin so the board can cut it
// on a canvas. Only a mural that already has a board row is served, so this is
// not an open proxy and a mural that has not opened has no picture. The body
// is streamed, not buffered: the largest width can pass the function's
// buffered-response limit.

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const id = String(searchParams.get('id') || '');
  if (!parseMuralId(id)) return new Response('Not found', { status: 404 });
  const wq = Number(searchParams.get('w'));
  const width = [960, 1920, 3840].includes(wq) ? wq : 1920;
  let photo = null;
  try {
    const { data } = await supabaseAdmin.from('mural_boards').select('photo').eq('id', id).maybeSingle();
    photo = data && data.photo;
  } catch (e) { photo = null; }
  if (!photo) return new Response('Not found', { status: 404 });
  let up;
  try {
    up = await fetch(commonsUrl(photo, width), {
      headers: { 'User-Agent': 'MindLoft/1.0 (https://mindloftdaily.com; mural daily) node-fetch' },
      redirect: 'follow',
    });
  } catch (e) { return new Response('Upstream unavailable', { status: 502 }); }
  if (!up.ok || !up.body) return new Response('Upstream unavailable', { status: 502 });
  return new Response(up.body, {
    status: 200,
    headers: {
      'Content-Type': up.headers.get('content-type') || 'image/jpeg',
      'Cache-Control': 'public, max-age=86400, s-maxage=31536000, immutable',
    },
  });
}
