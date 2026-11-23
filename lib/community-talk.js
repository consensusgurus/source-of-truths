// The two Post-Game Talk helpers that need the slate index and the results
// cache. Split out of lib/community.js (2026-11-23) so the Idea Board, notices
// and summary routes stay light. puzzleOf reads the slim index, not the puzzle
// banks: Talk needs only the drop's quizId and number.
import { loadDailyResultsCached } from '@/lib/daily-results-cache';
import { scoreGame } from '@/lib/daily-combined';
import { etTodayServer, dropForSuffix } from '@/lib/daily-index';
import { gameOf } from '@/lib/community';

// The puzzle that ran for `key` on `day`, or null (no such day, or the future).
export function puzzleOf(key, day) {
  const g = gameOf(key);
  if (!g) return null;
  return dropForSuffix(g.key, day, etTodayServer());
}


// Did this viewer play this puzzle, and how did they place? Reads the same
// cached day rows every board reads, scores them with the board's own
// scoreGame, and returns { played, rank, field, label }.
export async function resultOf(admin, quizId, keys) {
  if (!quizId || !keys || !keys.size) return { played: false };
  const res = await loadDailyResultsCached(admin, [quizId], {});
  const rows = (res && Array.isArray(res.data) ? res.data : []).filter((r) => r && r.quiz_id === quizId);
  const mine = rows.some((r) => (r.user_id && keys.has(`u:${r.user_id}`)) || (r.anon_id && keys.has(`a:${r.anon_id}`)));
  if (!mine) return { played: false, field: rows.length };
  let rank = null, field = null;
  try {
    const gr = scoreGame(rows);
    field = gr.field || null;
    for (const k of keys) {
      const p = gr.players && gr.players.get(k);
      if (p && typeof p.rank === 'number') { rank = p.rank; break; }
    }
  } catch (e) { /* the result line is a nicety; the gate is the row */ }
  return { played: true, rank, field, label: rank ? (field ? `#${rank} of ${field}` : `#${rank}`) : 'Played' };
}

