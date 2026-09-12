import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-server';
import { resolveQuizIdentity, attributeAnonGames, validEmail, looksLikeEmail } from '@/lib/quiz-identity';

export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';

function summarize(rows) {
  const plays = rows.length;
  const best = plays ? Math.max(...rows.map((r) => r.score)) : null;
  // Fastest time recorded AT the best score, across ALL completed plays
  // (anonymous included, not just the signed-up leaderboard). Lets the client
  // tell whether a finished run is the outright #1 (top score, fastest time).
  const topTime = best != null
    ? Math.min(...rows.filter((r) => r.score === best).map((r) => (r.time_elapsed ?? Infinity)))
    : null;
  // Signed-up players only, but EVERY qualifying play is listed (a single
  // player can appear more than once). Top 10 by score desc, then fastest time.
  // try_num = that player's chronological attempt number (by row id).
  const signed = rows.filter((r) => r.user_id);
  const tryByUser = {};
  const tryOf = new Map();
  signed
    .slice()
    .sort((a, b) => (a.id || 0) - (b.id || 0))
    .forEach((r) => {
      tryByUser[r.user_id] = (tryByUser[r.user_id] || 0) + 1;
      tryOf.set(r, tryByUser[r.user_id]);
    });
  const leaderboard = signed
    .sort((a, b) => b.score - a.score || a.time_elapsed - b.time_elapsed || (a.username || '').localeCompare(b.username || ''))
    .slice(0, 10)
    .map((r) => ({ username: r.username, score: r.score, timeElapsed: r.time_elapsed, tryNum: tryOf.get(r), playedAt: r.created_at }));
  return { plays, best, topTime: Number.isFinite(topTime) ? topTime : null, leaderboard };
}

// POST /api/quiz/claim  { quizId, resultId, username, email?, anonId }
// Retroactively post a just-finished anonymous game to the leaderboard: find or
// create the identity (email optional), attach THIS result row, then link every
// earlier anonymous game from this browser. Returns the refreshed board.
export async function POST(request) {
  try {
    const body = (await request.json()) || {};
    const quizId = typeof body.quizId === 'string' ? body.quizId.trim() : '';
    const resultId = Number.isInteger(body.resultId) ? body.resultId : null;
    const username = typeof body.username === 'string' ? body.username.trim() : '';
    const email = typeof body.email === 'string' ? body.email.trim() : '';
    const anonId = typeof body.anonId === 'string' ? body.anonId.trim() : '';

    if (!quizId || quizId.length > 100) {
      return NextResponse.json({ error: 'quizId required' }, { status: 400 });
    }
    if (!username || username.length > 15) {
      return NextResponse.json({ error: 'Display name required (max 15 characters).' }, { status: 400 });
    }
    if (looksLikeEmail(username)) {
      return NextResponse.json({ error: 'Display name cannot be an email address.' }, { status: 400 });
    }
    if (email && !validEmail(email)) {
      return NextResponse.json({ error: 'Enter a valid email or leave it blank.' }, { status: 400 });
    }
    if (!resultId) {
      return NextResponse.json({ error: 'No game to post. Finish a round first.' }, { status: 400 });
    }
    if (!email && !anonId) {
      return NextResponse.json({ error: 'Could not post right now.' }, { status: 400 });
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
      return NextResponse.json({ error: 'Could not post right now.' }, { status: 500 });
    }

    // Attach the specific result row, but only if it is still unattributed (so a
    // shared link can't reassign someone else's game).
    const { error: updErr } = await supabaseAdmin
      .from('quiz_results')
      .update({ user_id: user.id, username: user.username })
      .eq('id', resultId)
      .eq('quiz_id', quizId)
      .is('user_id', null);
    if (updErr) {
      console.error('quiz claim attribute error', updErr);
      return NextResponse.json({ error: 'Could not post right now.' }, { status: 500 });
    }

    // Also link every earlier anonymous game from this browser to the user.
    await attributeAnonGames(supabaseAdmin, anonId, user);

    const data = [];
    for (let from = 0; ; from += 1000) {
      const { data: page } = await supabaseAdmin
        .from('quiz_results')
        .select('id, user_id, username, score, time_elapsed, created_at')
        .eq('quiz_id', quizId)
        .order('id', { ascending: true })
        .range(from, from + 999);
      if (!page || page.length === 0) break;
      data.push(...page);
      if (page.length < 1000) break;
    }
    return NextResponse.json({ ...summarize(data), username: user.username, email: user.email || null });
  } catch (e) {
    return NextResponse.json({ error: 'invalid request' }, { status: 400 });
  }
}
