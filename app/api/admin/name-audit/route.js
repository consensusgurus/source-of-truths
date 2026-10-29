import { NextResponse } from 'next/server';
import { isAdmin } from '@/lib/admin-auth';
import { supabaseAdmin } from '@/lib/supabase-server';
import { nameBlocked } from '@/lib/name-filter';

export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';

function tokenOk(request) {
  const expected = process.env.ADMIN_TASK_TOKEN;
  return !!expected && request.headers.get('x-admin-token') === expected;
}

// GET /api/admin/name-audit -> every registered display name that fails the
// name screen (lib/name-filter.js), with a suggested replacement. Read only:
// rename with POST /api/admin/quiz-user-rename { oldName, newName }, which
// updates every place the name is copied.
export async function GET(request) {
  if (!isAdmin() && !tokenOk(request)) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  const names = [];
  for (let from = 0; ; from += 1000) {
    const { data, error } = await supabaseAdmin.from('quiz_users').select('id, username, created_at').order('id').range(from, from + 999);
    if (error) return NextResponse.json({ error: 'db error' }, { status: 500 });
    names.push(...(data || []));
    if (!data || data.length < 1000) break;
  }
  const taken = new Set(names.map((r) => (r.username || '').toLowerCase()));
  const flagged = names.filter((r) => nameBlocked(r.username)).map((r) => {
    let suggest;
    do { suggest = 'Player' + Math.floor(1000 + Math.random() * 9000); } while (taken.has(suggest.toLowerCase()));
    taken.add(suggest.toLowerCase());
    return { id: r.id, username: r.username, created: r.created_at, suggest };
  });
  return NextResponse.json({ checked: names.length, flagged });
}
