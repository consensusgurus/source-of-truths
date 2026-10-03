import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-server';
import { resolveQuizIdentity, takenResponse, attributeAnonGames, validEmail, looksLikeEmail } from '@/lib/quiz-identity';

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
      // The copy, flags and the four dead ends live in takenResponse() in
      // lib/quiz-identity.js, shared with the other join route.
      return NextResponse.json(takenResponse(user, email), { status: 409 });
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
