// The four colours a sudoku wears on Colossus and Mammoth (owner, 2026-11-22:
// "alternate pastels to match what you're working on", then "colors with tints
// too"). Shared by the board (app/MegaClient.jsx) and the closing screen
// (app/MegaWall.jsx). Which of the four a sudoku gets is lib/mega.js `hues`.
import { REGION_RAMP, sitePastelHex } from '@/lib/category-ramp';

// The four sudoku colours, from the site's own ramp (docs/claude/home-and-ui.md,
// "The site pastel is the 60/40 step"). soft: a sudoku you are not in; full:
// the one you are in; deep: the row, column and box of the picked square;
// edge: outlines, the picked square, the progress bar.
export const mixHex = (hex, onto, p) => '#' + [1, 3, 5].map((i) => Math.round(parseInt(hex.slice(i, i + 2), 16) * p + parseInt(onto.slice(i, i + 2), 16) * (1 - p)).toString(16).padStart(2, '0')).join('');
const HUE_ORDER = ['rose', 'sky', 'mint', 'gold'].map((n) => REGION_RAMP.find((r) => r.name === n));
export const MEGA_HUES = {
  light: HUE_ORDER.map((h) => ({ soft: mixHex(h.dk, '#ffffff', 0.24), full: sitePastelHex(h.dk), deep: mixHex(h.dk, '#ffffff', 0.84), edge: h.lt })),
  dark: HUE_ORDER.map((h) => ({ soft: mixHex(h.dk, '#1a1d28', 0.13), full: mixHex(h.dk, '#1a1d28', 0.3), deep: mixHex(h.dk, '#1a1d28', 0.5), edge: h.dk })),
};
