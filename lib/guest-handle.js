// Stable "Guest-XXXX" handle from a raw anon_id (same scheme as displayHandle in
// lib/quiz-xp). Lives on its own so the site header can use it without pulling
// lib/quiz-xp, which imports the whole quiz catalog (~3.8MB) into every page.
export function guestHandleFromAnon(anonId) {
  const src = anonId || '';
  let h = 0;
  for (let i = 0; i < src.length; i++) h = (h * 31 + src.charCodeAt(i)) >>> 0;
  return 'Guest-' + h.toString(16).toUpperCase().slice(0, 4).padStart(4, '0');
}
