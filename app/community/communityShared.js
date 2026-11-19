// Plain constants shared by the community pages and the endings. No imports, so
// a client file can take it without pulling in the server data layer.
export const FEEL_NAMES = { 1: 'Gentle', 2: 'Moderate', 3: 'Tough' };
export const IDEA_KINDS = { puzzle: 'New Puzzle', variation: 'Variation', fix: 'Site Fix' };
export const IDEA_STAGES = { open: 'Open For Votes', review: 'Under Review', workshop: 'In The Workshop', built: 'Built' };
// The site pastels (light) and their dark-register washes, for avatars and chips.
export const PASTELS = ['#bfe6fb', '#a6f4e7', '#a2efc5', '#c4f09e', '#fdc394', '#fbaee7', '#d9c6f9', '#c5cdfd'];
export function pastelOf(key) {
  let h = 0;
  const k = String(key || '');
  for (let i = 0; i < k.length; i++) h = (h * 31 + k.charCodeAt(i)) >>> 0;
  return PASTELS[h % PASTELS.length];
}
