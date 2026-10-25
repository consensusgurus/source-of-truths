'use client';

// THE STAGE'S OWN LOOK SWITCH (owner, 2026-10-23): pastel ('color') or Plain
// (white page, black type). One saved choice shared by every gauntlet stage
// screen and, from 2026-10-24, the phone sudoku register. Separate from the
// site's light/dark setting. Moved here from app/GauntletScreens.jsx so a daily
// page can read it without loading the gauntlet screens.

import { useEffect, useState } from 'react';

export const LOOK_KEY = 'sot_gstage_look1';
// THREE LOOKS, cycled by the one button (owner, 2026-10-24): 'color' (the
// category pastel), 'plain' (white page, black type) and 'dark' (near-black
// page, light type, like the site's dark mode). Tap order is that order.
export const LOOKS = ['color', 'plain', 'dark'];
export function nextLook(l) { return LOOKS[(LOOKS.indexOf(l) + 1) % LOOKS.length]; }
export const LOOK_NAMES = { color: 'Color', plain: 'White and black', dark: 'Black and white' };
const lookSubs = new Set();
export function readLook() {
  try { const v = localStorage.getItem(LOOK_KEY); return LOOKS.includes(v) ? v : 'color'; } catch (e) { return 'color'; }
}
export function useStageLook() {
  const [look, setLook] = useState('color');
  useEffect(() => {
    setLook(readLook());
    const f = (v) => setLook(v);
    lookSubs.add(f);
    return () => { lookSubs.delete(f); };
  }, []);
  const write = (v) => {
    try { localStorage.setItem(LOOK_KEY, v); } catch (e) {}
    for (const f of lookSubs) f(v);
  };
  return [look, write];
}
