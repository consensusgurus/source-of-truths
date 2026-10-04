import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-server';
import { findQuizIdentity } from '@/lib/quiz-identity';
import { ensureRefCode, topReferrers } from '@/lib/referrals-server';
import { refShareUrl } from '@/lib/referrals';

export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';

// Resolve the viewer to a quiz_users row across DEVICES, not just this browser.
//
// quiz_users.anon_id holds the ONE browser that first created the account and is
// never rewritten, so keying the viewer off it alone stranded every other device:
// signing in on a phone with the same name and email still produced a fresh anon,
// matched no row, and dropped this tile into its "register to get your link"
// state with the share link gone. Resolution order mirrors resolveAnonSet:
//   email -> the account that owns this browser's attributed games -> anon_id.
async function findViewer(admin, { anonId, email }) {
  // email first, then anon_id. This is the same helper /api/quiz/me uses, which
  // is why stats survived a device switch while this tile did not.
  const ident = await findQuizIdentity(admin, { email, anonId });
  let userId = ident && ident.id ? ident.id : null;

  // A browser with no stored email still resolves once any of its games have
  // been attributed to the account (attributeAnonGames runs on join and claim).
  if (!userId && anonId) {
    try {
      const { data } = await admin
        .from('quiz_results')
        .select('user_id')
        .eq('anon_id', anonId)
        .not('user_id', 'is', null)
        .limit(1);
      if (Array.isArray(data) && data[0] && data[0].user_id) userId = data[0].user_id;
    } catch { /* pre-migration: user_id/anon_id may be absent */ }
  }
  if (!userId) return null;

  const { data: user } = await admin
    .from('quiz_users')
    .select('id, username, ref_code')
    .eq('id', userId)
    .maybeSingle();
  return user || null;
}

// GET /api/quiz/referrals?anonId=...&email=...&days=90
//
// Powers the Top Community Member tile on /quizzes:
//   top : rolling-window referral board (username + credits)
//   me  : the viewer's own share code + link + credit count, when they have
//         joined the leaderboard. null for a visitor with no identity, which is
//         what makes the tile show the "register to get your link" state.
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    // ?latest=1: just the most recent credited share (ThanksPop). A credit is
    // the only share the site can see: a link with a ref code that brought a
    // new player through a finished game. Seeded rows are not real shares.
    if (searchParams.get('latest') === '1') {
      try {
        const { data } = await supabaseAdmin
          .from('quiz_referrals')
          .select('referrer_user_id, created_at')
          .eq('seeded', false)
          .order('created_at', { ascending: false })
          .limit(1);
        const r = Array.isArray(data) && data[0];
        let username = null;
        if (r && r.referrer_user_id) {
          const { data: u } = await supabaseAdmin
            .from('quiz_users').select('username').eq('id', r.referrer_user_id).maybeSingle();
          username = (u && u.username) || null;
        }
        return NextResponse.json({ latest: username ? { username, at: r.created_at } : null }, {
          headers: { 'Cache-Control': 'public, s-maxage=120, stale-while-revalidate=600' },
        });
      } catch {
        return NextResponse.json({ latest: null });
      }
    }
    // days: 90 by default; a very large value (36500) is how the public board asks
    // for the all-time view. limit: 10 for the tile, up to 100 for that board.
    const days = Math.min(36500, Math.max(1, parseInt(searchParams.get('days'), 10) || 90));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit'), 10) || 10));
    const anonId =
      (searchParams.get('anonId') || '').trim().slice(0, 64) ||
      request.cookies.get('sot_vid')?.value ||
      '';
    const email = (searchParams.get('email') || '').trim().slice(0, 120) || null;

    const top = await topReferrers(supabaseAdmin, { days, limit });

    let me = null;
    if (anonId || email) {
      const user = await findViewer(supabaseAdmin, { anonId: anonId || null, email });
      if (user) {
        const code = await ensureRefCode(supabaseAdmin, user);
        let credits = 0;
        if (code) {
          const since = new Date(Date.now() - days * 86400000).toISOString();
          const { count } = await supabaseAdmin
            .from('quiz_referrals')
            .select('id', { count: 'exact', head: true })
            .eq('referrer_user_id', user.id)
            .gte('created_at', since);
          credits = count || 0;
        }
        me = { username: user.username, code, shareUrl: refShareUrl(code), credits };
      }
    }

    return NextResponse.json({ top, me, days });
  } catch {
    // Never let the tile take the page down; it renders its empty state.
    return NextResponse.json({ top: [], me: null, days: 90 });
  }
}
