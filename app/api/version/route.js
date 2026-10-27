// WHICH BUILD IS LIVE (2026-10-27). app/VersionGuard.jsx compares the build its
// own JavaScript was compiled from against this answer, and a mismatch means the
// tab is running a superseded deployment. Edge, no-store, never cached anywhere:
// a cached answer here would hide exactly the staleness it exists to report.
export const runtime = 'edge';
export const dynamic = 'force-dynamic';

export function GET() {
  return new Response(JSON.stringify({ v: process.env.NEXT_PUBLIC_SOT_BUILD || '' }), {
    headers: {
      'content-type': 'application/json',
      'cache-control': 'no-store, max-age=0',
      'cdn-cache-control': 'no-store',
      'vercel-cdn-cache-control': 'no-store',
    },
  });
}
