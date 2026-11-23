// lib/player-countries.js: each player's country, for the closing screens that
// show contributions by country (Mural's wall, owner 2026-11-22; Colossus and
// Mammoth's closing screen, the same day). Moved here unchanged from
// app/api/mural/wall/route.js. SERVER-ONLY.
import { supabaseAdmin } from '@/lib/supabase-server';

const CODE = /^[A-Z]{2}$/;

// Each player's country: the one their play rows carry most often. One query
// per small batch of players, newest rows first; a player crowded out of a
// batch by heavier players is asked again on their own. Best effort: any
// failure leaves the country blank and never fails the wall.
export async function countriesOf(players) {
  const out = new Map();
  const want = { user_id: [], anon_id: [] };
  const key = new Map();
  for (const pl of players) {
    if (typeof pl !== 'string') continue;
    if (pl.startsWith('u:')) { want.user_id.push(pl.slice(2)); key.set('user_id:' + pl.slice(2), pl); }
    else if (pl.startsWith('a:')) { want.anon_id.push(pl.slice(2)); key.set('anon_id:' + pl.slice(2), pl); }
  }
  for (const col of ['user_id', 'anon_id']) {
    let left = want[col];
    for (let pass = 0; pass < 3 && left.length; pass++) {
      const size = pass === 0 ? 20 : pass === 1 ? 4 : 1;
      const miss = [];
      for (let i = 0; i < left.length; i += size) {
        const chunk = left.slice(i, i + size);
        const r = await supabaseAdmin.from('quiz_results').select(col + ', country')
          .in(col, chunk).not('country', 'is', null)
          .order('created_at', { ascending: false }).limit(600);
        if (r.error) throw r.error;
        const tally = new Map();
        for (const row of r.data || []) {
          const c = String(row.country || '').toUpperCase();
          if (!CODE.test(c) || c === 'XX') continue;
          const id = row[col];
          let t = tally.get(id); if (!t) { t = new Map(); tally.set(id, t); }
          t.set(c, (t.get(c) || 0) + 1);
        }
        for (const id of chunk) {
          const t = tally.get(id);
          if (!t) { if ((r.data || []).length >= 600) miss.push(id); continue; }
          let best = '', n = 0;
          for (const [c, k] of t) if (k > n) { best = c; n = k; }
          out.set(key.get(col + ':' + id), best);
        }
      }
      // Only a full answer can have crowded someone out; a short one means they have no rows.
      left = miss;
    }
  }
  return out;
}
