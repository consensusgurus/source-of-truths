// THE CROWN CATEGORY: the one a player wears.
//
// Every Stage surface takes exactly one accent, and a game page takes its own
// category step. A PROFILE has no category of its own, so it takes the step of
// the category the player has earned the most IQ Points in. Two profiles then
// look unlike each other, and the colour is earned rather than assigned.
//
// The ten steps in lib/category-ramp.js are the DAILY roster's categories
// (Word, Numbers, Logic, ...), not the quiz departments that profile.byCategory
// is keyed by, so the crown is computed from the player's daily history in
// `recent[]`: each dated id is '<key>-M-D-YY', each key has a `cat`, and that
// cat is a ramp step. A player with no daily play has no crown and falls back
// to the brand step, which is what --stg-brand is for.
//
// Both the profile PAGE and its share CARD call this, so the card and the page
// it links to can never disagree about a player's colour.

import { DAILY_GAME_MAP, DAILY_DATED_RE } from './daily-games.js';
import { categoryColor, categoryColorLight, categoryOnrampLight, categoryAccentInkLight } from './category-ramp.js';

const BRAND_DARK = '#7dd3fc';
const BRAND_LIGHT = '#2563eb';

/**
 * IQ Points per ramp category, from a profile's `recent` array.
 * Returns [{ cat, xp, played }] sorted by xp, highest first.
 */
export function categoryTotals(recent) {
  const by = new Map();
  (recent || []).forEach(function (r) {
    const m = DAILY_DATED_RE.exec((r && r.quizId) || '');
    if (!m) return;
    const g = DAILY_GAME_MAP[m[1]];
    if (!g || !g.cat) return;
    const cur = by.get(g.cat) || { cat: g.cat, xp: 0, played: 0 };
    cur.xp += Number(r.xp) || 0;
    cur.played += 1;
    by.set(g.cat, cur);
  });
  return Array.from(by.values()).sort(function (a, b) { return b.xp - a.xp; });
}

/** The crown itself, or null for a player with no daily play. */
export function crownCategory(recent) {
  const totals = categoryTotals(recent);
  return totals.length ? totals[0].cat : null;
}

/**
 * The full accent set a stage page needs to publish on its root, so both
 * registers resolve without a class and without a repaint. Mirrors the
 * STAGE_ACC block every game client writes.
 */
export function crownAccent(cat) {
  if (!cat) {
    return {
      cat: null,
      dark: BRAND_DARK,
      light: BRAND_LIGHT,
      vars: {
        '--stg-acc-dk': BRAND_DARK,
        '--stg-acc-lt': BRAND_LIGHT,
        '--stg-onramp-lt': '#ffffff',
        '--stg-acc-ink-lt': BRAND_LIGHT,
        '--stg-brand-dk': '#7dd3fc',
        '--stg-brand-lt': '#38bdf8',
      },
    };
  }
  return {
    cat,
    dark: categoryColor(cat),
    light: categoryColorLight(cat),
    vars: {
      '--stg-acc-dk': categoryColor(cat),
      '--stg-acc-lt': categoryColorLight(cat),
      '--stg-onramp-lt': categoryOnrampLight(cat),
      '--stg-acc-ink-lt': categoryAccentInkLight(cat),
    },
  };
}
