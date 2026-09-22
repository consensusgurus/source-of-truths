import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-server';
import { PUZZLES } from '@/app/niche/puzzles';
import { UNIVERSE_MAP, attrById } from '@/app/niche/facts';

// /api/niche  { quizId, picks: [name|null per cell], anonId, email? }  (POST)
//
// Stores one Niche ballot per (quiz_id, anon_id) and answers with the RARITY
// of the caller's own picks: for every cell the caller has filled, the share
// of today's stored ballots that picked the same answer there. That number is
// the game's whole crowd layer — display and share flair, never scoring — so
// this route is deliberately much simpler than the three Crowd Psychology
// games' routes: no leave-one-out grading, no house pool, no account-level
// dedupe (a player on two devices counts twice in the tally until the day
// rolls, which for a percentage readout is noise nobody can see).
//
// The response only carries percentages for cells the CALLER filled, so a
// player can never read the field's popular answers out of this route before
// finding their own.
//
// Ballots live in `niche_picks` (migration 58). If the table doesn't exist
// yet the game plays exactly the same and simply shows no percentages.
//
// Every stored pick is re-validated against app/niche/facts.js (the same
// judge the client uses), so junk in a hand-rolled POST can't pollute the
// tallies.

export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';

const ID_RE = /^niche-\d{1,2}-\d{1,2}-\d{2}$/;

function cleanPicks(puzzle, picks) {
  const u = UNIVERSE_MAP[puzzle.universe];
  const size = puzzle.rows.length;
  const cells = size * size;
  if (!u || !Array.isArray(picks)) return null;
  const byName = new Map(u.members.map((m) => [m.t, m]));
  const out = Array(cells).fill(null);
  const seen = new Set();
  for (let i = 0; i < cells; i++) {
    const v = picks[i];
    if (typeof v !== 'string' || v.length > 80) continue;
    const m = byName.get(v);
    if (!m || seen.has(v)) continue;
    const ra = attrById(u, puzzle.rows[Math.floor(i / size)]);
    const ca = attrById(u, puzzle.cols[i % size]);
    if (!ra || !ca || !ra.test(m) || !ca.test(m)) continue;
    out[i] = v;
    seen.add(v);
  }
  return out;
}

export async function POST(req) {
  let body;
  try { body = await req.json(); } catch (e) { return NextResponse.json({ error: 'bad json' }, { status: 400 }); }
  const quizId = String(body.quizId || '');
  const anonId = String(body.anonId || '').slice(0, 80);
  if (!ID_RE.test(quizId) || !anonId) return NextResponse.json({ error: 'bad request' }, { status: 400 });
  const puzzle = PUZZLES.find((p) => p.quizId === quizId);
  if (!puzzle) return NextResponse.json({ error: 'unknown puzzle' }, { status: 400 });
  const picks = cleanPicks(puzzle, body.picks);
  if (!picks) return NextResponse.json({ error: 'bad picks' }, { status: 400 });

  // Resolve the account for attribution parity with the other picks tables.
  let userId = null;
  try {
    const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : '';
    if (email) {
      const { data } = await supabaseAdmin.from('quiz_users').select('id').eq('email', email).limit(1);
      if (data && data[0]) userId = data[0].id;
    }
    if (!userId) {
      const { data } = await supabaseAdmin.from('quiz_users').select('id').eq('anon_id', anonId).limit(1);
      if (data && data[0]) userId = data[0].id;
    }
  } catch (e) { /* nameless is fine */ }

  let rows = [];
  try {
    await supabaseAdmin
      .from('niche_picks')
      .upsert({ quiz_id: quizId, anon_id: anonId, user_id: userId, answers: picks }, { onConflict: 'quiz_id,anon_id' });
    const { data, error } = await supabaseAdmin
      .from('niche_picks')
      .select('anon_id, answers')
      .eq('quiz_id', quizId)
      .limit(20000);
    if (!error && Array.isArray(data)) rows = data;
  } catch (e) { /* table missing — no percentages, game unaffected */ }

  const pct = {};
  if (rows.length) {
    for (let i = 0; i < picks.length; i++) {
      if (!picks[i]) continue;
      let filled = 0;
      let same = 0;
      for (const r of rows) {
        const v = Array.isArray(r.answers) ? r.answers[i] : null;
        if (typeof v !== 'string' || !v) continue;
        filled++;
        if (v === picks[i]) same++;
      }
      if (filled > 0) pct[i] = Math.max(1, Math.round((same / filled) * 100));
    }
  }
  return NextResponse.json({ ok: true, field: rows.length, pct });
}
