import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

// The same stable "Guest-XXXX" handle the leaderboards and the quiz header show
// a signed-out visitor (guestHandleFromAnon in lib/quiz-xp.js, copied here so
// this route does not pull that whole module in). Keep the two identical.
function guestHandle(anonId) {
  let h = 0;
  for (let i = 0; i < anonId.length; i++) h = (h * 31 + anonId.charCodeAt(i)) >>> 0;
  return 'Guest-' + h.toString(16).toUpperCase().slice(0, 4).padStart(4, '0');
}

// Public endpoint: a reader files a complaint / requests new research on a list.
// Stored in the `complaints` table and surfaced in the admin "Notices" tab.
export async function POST(request) {
  try {
    const body = await request.json();
    const { listId, listTitle, message, name, email, anonId, signedAs } = body || {};

    if (typeof listId !== 'string' || !listId.trim()) {
      return NextResponse.json({ error: 'listId required' }, { status: 400 });
    }
    if (listId.length > 100 || (listTitle && listTitle.length > 200)) {
      return NextResponse.json({ error: 'too long' }, { status: 400 });
    }
    let cleanMessage = typeof message === 'string' ? message.trim().slice(0, 1000) : '';
    // Who sent it, appended AFTER the 1000-char cut so a long message can never
    // push it off. Rides in the message so it reaches the admin desk and the
    // notification email with no schema change. Only ids we can act on.
    const anon = typeof anonId === 'string' && /^[A-Za-z0-9-]{8,64}$/.test(anonId.trim()) ? anonId.trim() : '';
    const who = typeof signedAs === 'string' ? signedAs.trim().slice(0, 40) : '';
    if (anon || who) {
      cleanMessage += `\n\n---\nSigned in as: ${who || '(not signed in)'}`
        + (anon ? `\nBrowser id: ${anon} (${guestHandle(anon)})` : '');
    }
    // Name and email are optional contact fields.
    const cleanName = typeof name === 'string' ? name.trim().slice(0, 120) : '';
    const cleanEmail = typeof email === 'string' ? email.trim().slice(0, 200) : '';

    const { error } = await supabase.from('complaints').insert({
      list_id: listId.trim(),
      list_title: (listTitle || '').toString().slice(0, 200),
      message: cleanMessage,
      name: cleanName,
      email: cleanEmail,
    });

    if (error) {
      console.error('complaint insert error', error);
      return NextResponse.json({ error: 'db error' }, { status: 500 });
    }
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ error: 'invalid request' }, { status: 400 });
  }
}
