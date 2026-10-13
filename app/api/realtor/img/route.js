import { PUZZLES } from '@/app/realtor/puzzles';

// /api/realtor/img?n=<puzzle number>&i=<0|1|2>   (GET)
//
// The one place a Realtor photo comes from (lib/price-ship.js realtorImg).
// Realtor shows a real listing's own photos, and listing photos do NOT stay
// put. On 2026-10-13 the Raleigh board went blank because the listing agent
// re-uploaded the photos: Redfin keeps the photo number but bumps the version
// suffix on the filename (10195588_4_0.jpg became 10195588_4_1.jpg) and
// deletes the old file. Hotlinking the banked URL broke the moment that
// happened. So this route:
//
//   1. fetches the banked URL;
//   2. if it has gone, walks the trailing _<version> up (v+1 .. v+MAX_WALK),
//      which is exactly what a re-upload does, and serves the first that loads;
//   3. caches whatever it found at the edge for a year AND in the data cache,
//      so a photo seen once survives the listing selling or being pulled;
//   4. if Redfin itself is unreachable from the server (anything other than
//      "every candidate is gone"), it 302s to the banked URL, so the page is
//      never worse off than hotlinking was.
//
// A miss is logged as [realtor-img] so it shows in the Vercel function logs.
//
// Gates, as with /api/focus/img: a day not yet live in Eastern time is a 404,
// and n/i must name a bank row, so this is not an open proxy.

export const dynamic = 'force-dynamic';

const MAX_WALK = 8;
const UA = 'Mozilla/5.0 (compatible; MindLoft/1.0; +https://mindloftdaily.com)';

function etToday() {
  try { return new Date().toLocaleDateString('en-CA', { timeZone: 'America/New_York' }); }
  catch (e) { return new Date().toISOString().slice(0, 10); }
}

function candidates(url) {
  const m = url.match(/^(.*_)(\d+)\.jpg$/);
  if (!m) return [url];
  const v = Number(m[2]);
  const out = [url];
  for (let k = 1; k <= MAX_WALK; k++) out.push(`${m[1]}${v + k}.jpg`);
  return out;
}

async function tryFetch(u) {
  try {
    const r = await fetch(u, { headers: { 'User-Agent': UA, Accept: 'image/jpeg,image/png,image/*' }, next: { revalidate: 31536000 } });
    const type = r.headers.get('content-type') || '';
    if (r.ok && /^image\//.test(type)) return { ok: true, r, type };
    return { ok: false, status: r.status };
  } catch (e) {
    return { ok: false, status: 0 };
  }
}

export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const n = Number(searchParams.get('n'));
  const i = Number(searchParams.get('i'));
  const p = Number.isInteger(n) && n > 0 ? PUZZLES.find((x) => x.num === n) : null;
  const banked = p && Array.isArray(p.imgs) && Number.isInteger(i) ? p.imgs[i] : null;
  if (!p || !banked || p.live > etToday()) return new Response('Not found', { status: 404 });

  const statuses = [];
  for (const u of candidates(banked)) {
    const got = await tryFetch(u);
    if (got.ok) {
      if (u !== banked) console.log('[realtor-img]', JSON.stringify({ n, i, healed: u.split('/').pop(), from: banked.split('/').pop() }));
      const buf = await got.r.arrayBuffer();
      return new Response(buf, {
        status: 200,
        headers: {
          'Content-Type': got.type,
          'Cache-Control': 'public, max-age=86400, s-maxage=31536000, immutable',
          'X-Realtor-Photo': u.split('/').pop(),
        },
      });
    }
    statuses.push(got.status);
    // Server could not reach Redfin at all, or was refused for a reason that is
    // not "file gone": stop walking and let the browser try the banked URL.
    if (got.status === 0 || got.status === 429 || got.status >= 500) break;
  }
  console.log('[realtor-img]', JSON.stringify({ n, i, dead: banked.split('/').pop(), statuses }));
  return new Response(null, { status: 302, headers: { Location: banked, 'Cache-Control': 'public, max-age=300' } });
}
