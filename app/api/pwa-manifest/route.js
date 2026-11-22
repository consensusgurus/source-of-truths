// Serves the web app manifest with an identity handoff token baked into start_url, so a
// home-screen install carries the player across the iOS storage partition (see
// /api/identity/pwa-token for the why).
//
// VisitorBeacon repoints the page's <link rel="manifest"> here. Browsers fetch the manifest
// lazily at install time, so the swapped href is what an install reads. ?game=<key> patches
// that game's static manifest from public/<key>.webmanifest instead of the root one, keeping
// its id/name/icons; app identity is the manifest id, so an already-installed game updates
// in place rather than duplicating.
import { NextResponse } from 'next/server';
import rootManifest from '@/lib/site-manifest';
import { mintHandoff, PWA_TTL_MS } from '@/lib/identity-handoff';

export const dynamic = 'force-dynamic';

const TOKEN_RE = /^[\w.-]{1,400}$/;
const GAME_RE = /^[a-z][a-z0-9-]{1,23}$/;
const PATH_RE = /^\/[A-Za-z0-9\-_/.]{0,200}$/;

// Which page is being installed. Without this every install made from a page that
// has no manifest of its own (the kids hub, a kids game, a list, a quiz) opened the
// HOMEPAGE, because the root manifest's start_url is /?src=pwa and phones launch the
// manifest's start_url, not the page the player was on (owner, 2026-11-15). Order:
// the Referer the browser sends on the manifest fetch (the exact page), then the
// ?path= a section layout passes as a fallback (app/kids/layout.js), then the root.
function installPath(req, url) {
  const clean = (p) => {
    if (!p || !PATH_RE.test(p)) return '';
    const t = p.length > 1 ? p.replace(/\/+$/, '') : p;
    if (t.startsWith('/api') || t.startsWith('/_next')) return '';
    return t || '/';
  };
  const ref = req.headers.get('referer') || '';
  if (ref) {
    try {
      const r = new URL(ref);
      if (r.host === url.host) {
        const p = clean(r.pathname);
        if (p) return p;
      }
    } catch (e) { /* fall through */ }
  }
  return clean(url.searchParams.get('path') || '') || '/';
}

// The root manifest re-pointed at one page: its own id (so it installs as its own
// app beside the main one), its own start_url, and the kids look under /kids.
function pageManifest(base, path) {
  if (path === '/') return base;
  const mf = { ...base, id: path, start_url: `${path}?src=pwa` };
  if (path === '/kids' || path.startsWith('/kids/')) {
    mf.name = 'Mind Loft Kids';
    mf.short_name = 'Mind Loft Kids';
    mf.description = 'Little puzzles, big thinking. Gentle daily puzzles and matching games for kids. Free, no sign-up.';
    mf.background_color = '#fff6e0';
    mf.theme_color = '#fff6e0';
  }
  // The Jigsaw Puzzles page installs under its own name (owner, 2026-11-22), so
  // the tile on the home screen says what it opens.
  if (path === '/jig/shelf' || path.startsWith('/jig/shelf/')) {
    mf.id = '/jig/shelf';
    mf.start_url = '/jig/shelf?src=pwa';
    mf.name = 'Jigsaw Puzzles by Mind Loft';
    mf.short_name = 'Jigsaw Puzzles';
    mf.description = 'Free online jigsaw puzzles: a new photo every day, every past puzzle, and giant puzzles built together.';
  }
  return mf;
}

export async function GET(req) {
  const url = new URL(req.url);
  const game = url.searchParams.get('game') || '';

  // The token: an _ml query param when the caller supplied one, else minted RIGHT
  // HERE from the sot_vid cookie. Cookie-minting is the primary path: the layout's
  // inline script gives the manifest link use-credentials, so the browser's
  // manifest fetch carries the cookie, and the token is minted at the moment the
  // engine actually reads the manifest (install time on Safari). That removes
  // every dependence on client-side swap timing, which is what stranded the
  // first version of this fix.
  let token = url.searchParams.get('_ml') || '';
  if (token && !TOKEN_RE.test(token)) token = '';
  const anonCookie = req.cookies.get('sot_vid')?.value || '';
  if (!token && anonCookie) {
    try { token = (await mintHandoff(decodeURIComponent(anonCookie), undefined, PWA_TTL_MS)) || ''; } catch (e) { token = ''; }
  }
  // Diagnostics for Vercel logs; never log the token itself.
  console.log('[pwa-manifest]', JSON.stringify({ game: game || 'root', path: game ? '' : installPath(req, url), cookie: !!anonCookie, minted: !!token }));

  let mf = null;
  if (game) {
    if (!GAME_RE.test(game)) return new NextResponse('Not found', { status: 404 });
    try {
      const r = await fetch(new URL(`/${game}.webmanifest`, url.origin), { cache: 'no-store' });
      if (!r.ok) return new NextResponse('Not found', { status: 404 });
      mf = await r.json();
    } catch (e) {
      return new NextResponse('Not found', { status: 404 });
    }
  } else {
    mf = pageManifest(rootManifest(), installPath(req, url));
  }

  if (token) {
    try {
      const su = new URL(mf.start_url || '/', url.origin);
      su.searchParams.set('_ml', token);
      mf.start_url = su.pathname + su.search;
    } catch (e) { /* keep the untouched start_url */ }
  }

  return NextResponse.json(mf, {
    headers: {
      'Content-Type': 'application/manifest+json',
      // The body carries a per-user token: never let a shared cache serve it.
      'Cache-Control': 'no-store',
    },
  });
}
