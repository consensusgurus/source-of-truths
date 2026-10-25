'use client';

// THE LOOK SWITCH (owner, 2026-10-23, reworked 2026-10-25). One saved choice
// for every page. The look icon is a plain cycle, never a menu.
//
// Game pages cycle five looks, in this order:
//   'color'    the game's colour fills the page
//   'tint'     white page, the colour on the tiles (the default, owner 2026-10-25)
//   'plain'    white page, black and grey
//   'darktint' near-black page, the colour on the tiles
//   'dark'     near-black page, white and grey
// The home and other site pages cycle four, in this order: light with color,
// dark with color, white and black, black and white (owner, 2026-10-25). A
// page with no single game has no one colour to fill with, so no 'color'. The choice also sets
// the site's light/dark register and its colour level, so the home and the
// games always agree.

import { useEffect, useState } from 'react';
import { writeStageTheme, writeStageColor } from './stage-theme';

export const LOOK_KEY = 'sot_gstage_look1';
export const LOOKS = ['color', 'tint', 'plain', 'darktint', 'dark'];
export const SITE_LOOKS = ['tint', 'darktint', 'plain', 'dark'];
export const LOOK_NAMES = { color: 'Color', tint: 'White with color', plain: 'White', darktint: 'Black with color', dark: 'Black' };
export const isDarkLook = (l) => l === 'dark' || l === 'darktint';
export const isColorLook = (l) => l === 'color' || l === 'tint' || l === 'darktint';
export function nextLook(l) { return LOOKS[(LOOKS.indexOf(l) + 1) % LOOKS.length]; }
export function nextSiteLook(l) {
  const cur = l === 'color' ? 'tint' : l;
  return SITE_LOOKS[(SITE_LOOKS.indexOf(cur) + 1) % SITE_LOOKS.length];
}
const lookSubs = new Set();
export function readLook() {
  try {
    const v = localStorage.getItem(LOOK_KEY);
    if (LOOKS.includes(v)) return v;
    return localStorage.getItem('sot_theme2') === 'dark' ? 'darktint' : 'tint';
  } catch (e) { return 'tint'; }
}
export function writeLook(v) {
  if (!LOOKS.includes(v)) return;
  try { localStorage.setItem(LOOK_KEY, v); } catch (e) {}
  try { document.documentElement.getAttribute('data-stage-pastel') && document.documentElement.setAttribute('data-stage-pastel', v); } catch (e) {}
  for (const f of lookSubs) f(v);
  try { writeStageColor(isColorLook(v) ? 'balanced' : 'mono'); } catch (e) {}
  try { writeStageTheme(isDarkLook(v) ? 'dark' : 'light'); } catch (e) {}
}
// The icon on a game page: all five looks.
export function cycleLook() { writeLook(nextLook(readLook())); }
// The icon on the home and the other site pages: the four without 'color'.
export function cycleSiteLook() { writeLook(nextSiteLook(readLook())); }
export function useStageLook() {
  const [look, setLook] = useState('tint');
  useEffect(() => {
    setLook(readLook());
    const f = (v) => setLook(v);
    lookSubs.add(f);
    return () => { lookSubs.delete(f); };
  }, []);
  return [look, writeLook];
}
