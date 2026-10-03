import { PUZZLES } from '@/app/passport/puzzles';
import { DAYS } from '@/app/passport/days';

// /api/passport/img?n=<puzzle number>   (GET)
//
// The landmark photo for Passport's first round, on the Focus pattern
// (app/api/focus/img): the bank names a Wikimedia Commons file per day, this
// route fetches the 1000px Commons render and hands it on with a long edge
// cache. Keyed by puzzle NUMBER so the URL never names the place, refused for
// a day not yet live in Eastern time, and refused for any number that is not
// a bank row, so it is not an open proxy.

export const dynamic = 'force-dynamic';

function etToday() {
  try { return new Date().toLocaleDateString('en-CA', { timeZone: 'America/New_York' }); }
  catch (e) { return new Date().toISOString().slice(0, 10); }
}

export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const n = Number(searchParams.get('n'));
  const p = Number.isInteger(n) && n > 0 ? PUZZLES.find((x) => x.num === n) : null;
  const d = p && DAYS[p.num];
  if (!p || !d || p.live > etToday()) return new Response('Not found', { status: 404 });
  const src = `https://commons.wikimedia.org/wiki/Special:FilePath/${encodeURIComponent(d.land.t)}?width=1000`;
  let up;
  try {
    up = await fetch(src, {
      headers: { 'User-Agent': 'MindLoft/1.0 (https://mindloftdaily.com; passport daily) node-fetch' },
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
      'X-Passport-Day': String(p.num),
    },
  });
}
