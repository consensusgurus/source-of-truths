import { PUZZLES } from '@/app/jig/puzzles';

// /api/jig/img?n=<puzzle number>[&w=330|500|960|1280]   (GET)
//
// `w` asks for a smaller picture, for the puzzle shelf (/jig/shelf), whose
// boxes are thumbnails. Only Wikimedia's standard thumbnail widths are
// accepted (a non-standard width is rendered on demand and rate limited), and
// anything else falls back to 1280, the size the game itself cuts.
//
// The one place a Jig photo comes from, the same design as /api/focus/img: the
// bank names a Wikimedia Commons file per day, and this route fetches the
// Commons-rendered 1280px thumbnail through Special:FilePath and hands it on
// with a one-year edge cache, so Commons is out of the loop after the first
// request of a day. It is also what makes the photo SAME-ORIGIN, which Jig
// needs: the client reads the pixels on a canvas to sort pieces by colour.
//
// Two gates, both deliberate: a day not yet live in Eastern time is a 404, so
// tomorrow's photo is never fetchable, and the number must name a bank row, so
// this is not an open proxy.

export const dynamic = 'force-dynamic';

function etToday() {
  try { return new Date().toLocaleDateString('en-CA', { timeZone: 'America/New_York' }); }
  catch (e) { return new Date().toISOString().slice(0, 10); }
}

export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const n = Number(searchParams.get('n'));
  const p = Number.isInteger(n) && n > 0 ? PUZZLES.find((x) => x.num === n) : null;
  if (!p || p.live > etToday()) return new Response('Not found', { status: 404 });
  const wq = Number(searchParams.get('w'));
  const width = [330, 500, 960].includes(wq) ? wq : 1280;
  const src = `https://commons.wikimedia.org/wiki/Special:FilePath/${encodeURIComponent(p.t)}?width=${width}`;
  let up;
  try {
    up = await fetch(src, {
      headers: { 'User-Agent': 'MindLoft/1.0 (https://mindloftdaily.com; jig daily) node-fetch' },
      redirect: 'follow',
      next: { revalidate: 86400 },
    });
  } catch (e) {
    return new Response('Upstream unavailable', { status: 502 });
  }
  if (!up.ok) return new Response('Upstream unavailable', { status: 502 });
  const type = up.headers.get('content-type') || 'image/jpeg';
  const buf = await up.arrayBuffer();
  return new Response(buf, {
    status: 200,
    headers: {
      'Content-Type': type,
      'Cache-Control': 'public, max-age=86400, s-maxage=31536000, immutable',
      'X-Jig-Day': String(p.num),
    },
  });
}
