// THE JIG RENUMBER, carried to players' saves (owner, 2026-10-16).
//
// Jig launched 2026-10-15 as board No. 1. The next day twenty-five boards were
// dealt BEFORE launch (2026-09-20 to 2026-10-14, as if the game had always
// run), so launch day became No. 26 and every board moved up by JIG_SHIFT. The
// server never cared: every row is keyed by quizId (jig-10-15-26), and the
// quizIds did not change. Only this device's own records are keyed by number:
//
//   sot_jig_<num>      the per-puzzle save (board state, status, clock)
//   sot_jig_rec_<num>  the abandon-flush dedupe stamp
//   sot_jig_stats      { v, rec: { <num>: {...} } }, the streak record
//
// This moves each of them up by JIG_SHIFT, once per browser, and stamps
// MIGRATED_KEY so it never runs twice. It moves from the highest number down,
// so a key never lands on one still waiting to move. It is safe to call from
// every surface that reads those keys (the Jig page, the shelf, the archive):
// the first caller does the work and the rest return at the stamp.
//
// Only numbers that existed under the old numbering are moved: the old bank
// went live 2026-10-15, so on the day this shipped a save could only exist for
// No. 1 or No. 2. Anything above OLD_MAX is already a new number (a stale tab
// cannot have written one) and is left where it is.
export const JIG_SHIFT = 25;
const OLD_MAX = 10;
const MIGRATED_KEY = 'sot_jig_renum';

export function migrateJigSaves() {
  if (typeof window === 'undefined') return;
  try {
    const ls = window.localStorage;
    if (ls.getItem(MIGRATED_KEY)) return;
    const saves = [];
    const recs = [];
    for (let i = 0; i < ls.length; i++) {
      const k = ls.key(i);
      let m = /^sot_jig_(\d+)$/.exec(k || '');
      if (m) { const n = Number(m[1]); if (n >= 1 && n <= OLD_MAX) saves.push(n); continue; }
      m = /^sot_jig_rec_(\d+)$/.exec(k || '');
      if (m) { const n = Number(m[1]); if (n >= 1 && n <= OLD_MAX) recs.push(n); }
    }
    saves.sort((a, b) => b - a);
    recs.sort((a, b) => b - a);
    for (const n of saves) {
      const v = ls.getItem(`sot_jig_${n}`);
      if (v != null && ls.getItem(`sot_jig_${n + JIG_SHIFT}`) == null) ls.setItem(`sot_jig_${n + JIG_SHIFT}`, v);
      ls.removeItem(`sot_jig_${n}`);
    }
    for (const n of recs) {
      const v = ls.getItem(`sot_jig_rec_${n}`);
      if (v != null) ls.setItem(`sot_jig_rec_${n + JIG_SHIFT}`, v);
      ls.removeItem(`sot_jig_rec_${n}`);
    }
    const raw = ls.getItem('sot_jig_stats');
    if (raw) {
      const s = JSON.parse(raw);
      if (s && s.rec && typeof s.rec === 'object') {
        const rec = {};
        for (const [k, v] of Object.entries(s.rec)) {
          const n = Number(k);
          rec[n >= 1 && n <= OLD_MAX ? n + JIG_SHIFT : n] = v;
        }
        ls.setItem('sot_jig_stats', JSON.stringify({ ...s, rec }));
      }
    }
    ls.setItem(MIGRATED_KEY, '1');
  } catch (e) {
    // Storage blocked or full: nothing was readable to lose, and a later visit
    // will try again because the stamp was never written.
  }
}
