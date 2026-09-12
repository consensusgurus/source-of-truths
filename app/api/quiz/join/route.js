import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-server';
import { resolveQuizIdentity, attributeAnonGames, validEmail, looksLikeEmail } from '@/lib/quiz-identity';

export const dynamic = 'force-dynamic';

// POST /api/quiz/join  { username, email?, anonId } -> find-or-create identity.
// Email is OPTIONAL (a display name alone is enough). The browser's anon_id keys
// the identity when there is no email, and links any games already played from
// this browser so the display name back-fills onto the leaderboard.
export async function POST(request) {
  try {
    const body = (await request.json()) || {};
    const username = typeof body.username === 'string' ? body.username.trim() : '';
    const email = typeof body.email === 'string' ? body.email.trim() : '';
    const anonId = typeof body.anonId === 'string' ? body.anonId.trim() : '';

    if (!username || username.length > 15) {
      return NextResponse.json({ error: 'Display name required (max 15 characters).' }, { status: 400 });
    }
    if (looksLikeEmail(username)) {
      return NextResponse.json({ error: 'Display name cannot be an email address.' }, { status: 400 });
    }
    if (email && !validEmail(email)) {
      return NextResponse.json({ error: 'Enter a valid email or leave it blank.' }, { status: 400 });
    }
    if (!email && !anonId) {
      return NextResponse.json({ error: 'Could not join right now.' }, { status: 400 });
    }

    const user = await resolveQuizIdentity(supabaseAdmin, { username, email: email || undefined, anonId });
    if (user && user.error === 'username_taken') {
      // THREE dead ends, three different exits.
      //
      // holderHasEmail === false means the name belongs to an account created
      // with NO email. Nothing the player can type reaches it, so telling them
      // to "add the email you signed up with" describes an email that does not
      // exist, and telling them to pick another name is what makes the real
      // owner register steinn1 beside steinni1 (see the header of
      // /api/admin/quiz-user-merge). Route them to a human instead.
      //
      // The copy deliberately keeps the words isLockedOut() matches ("already
      // registered"), so SigninHelp goes prominent on all six join surfaces
      // with no client change. recoverable stays FALSE here: it highlights the
      // email field and asks for the one they signed up with, which is advice
      // this player cannot act on.
      const unclaimable = user.holderHasEmail === false;
      return NextResponse.json({
        error: unclaimable
          ? 'That display name is already registered to an account with no email on file, so only we can move it. If it is yours, use the reconnect link below and tell us, and we will relink it to this device.'
          : email
            ? 'That display name belongs to a different account. Pick another name.'
            : 'That display name is already registered. If it is yours, add the email you signed up with to reconnect it on this device.',
        code: unclaimable ? 'username_taken_unclaimable' : 'username_taken',
        recoverable: !email && !unclaimable,
        relink: unclaimable,
      }, { status: 409 });
    }
    if (!user) {
      return NextResponse.json({ error: 'Could not join right now.' }, { status: 500 });
    }
    await attributeAnonGames(supabaseAdmin, anonId, user);
    return NextResponse.json({ username: user.username, email: user.email || null });
  } catch (e) {
    return NextResponse.json({ error: 'Invalid request.' }, { status: 400 });
  }
}
