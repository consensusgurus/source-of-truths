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

// v2 (owner, 2026-10-25): full colour stopped being the default. The old key
// held 'color' for everyone who never changed it, so a stored 'color' under v1
// is dropped (they land on the new default); any other v1 choice carries over.
export const LOOK_KEY = 'sot_gstage_look2';
export const LOOK_KEY_V1 = 'sot_gstage_look1';
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
    const o = localStorage.getItem(LOOK_KEY_V1);
    if (LOOKS.includes(o) && o !== 'color') { try { localStorage.setItem(LOOK_KEY, o); } catch (e) {} return o; }
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

// THE GAUNTLETS KEEP THEIR OWN LOOK (owner, 2026-10-25): "default for our
// gauntlets should still be color background, irrespective of choice for main
// pages." Every gauntlet and run stage (entry, questions, between, ending)
// reads this key instead, which starts on 'color' and never follows the site's
// choice. Flipping it on a stage changes only the stages.
export const GAUNTLET_LOOK_KEY = 'sot_gauntlet_look1';
const gauntletSubs = new Set();
export function readGauntletLook() {
  try {
    const v = localStorage.getItem(GAUNTLET_LOOK_KEY);
    return LOOKS.includes(v) ? v : 'color';
  } catch (e) { return 'color'; }
}
export function writeGauntletLook(v) {
  if (!LOOKS.includes(v)) return;
  try { localStorage.setItem(GAUNTLET_LOOK_KEY, v); } catch (e) {}
  for (const f of gauntletSubs) f(v);
}
export function useGauntletLook() {
  const [look, setLook] = useState('color');
  useEffect(() => {
    setLook(readGauntletLook());
    const f = (v) => setLook(v);
    gauntletSubs.add(f);
    return () => { gauntletSubs.delete(f); };
  }, []);
  return [look, writeGauntletLook];
}
