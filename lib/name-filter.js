// Display-name screen (owner, 2026-10-29). A player reported a slur on the
// leaderboard; nothing checked names before this. Used by every route that
// sets a display name (/api/quiz/join, /api/quiz/claim) and by the admin
// audit (/api/admin/name-audit) that finds names registered before it.
//
// Two lists, because a short word inside a longer name is usually innocent:
//   ANYWHERE  matched inside the whole name with every non-letter removed and
//             common look-alike characters folded (c*nt, cvnt, c.u.n.t, kunt).
//   WORD      matched only as a whole token or a token's start, so "Hancock",
//             "Dickens", "Assam" and "Scunthorpe" pass.
// ALLOW strips a known-innocent word before the ANYWHERE pass.
//
// Never print the lists in reader-facing copy; the error just says the name
// is not allowed.

const ANYWHERE = [
  'cunt', 'kunt', 'cvnt', 'fuck', 'fuk', 'fck', 'phuck', 'motherf', 'nigger', 'nigga', 'nigr',
  'faggot', 'fagot', 'kike', 'wetback', 'tranny', 'retard', 'whore', 'cocksuck', 'jizz',
  'twat', 'wanker', 'bitch', 'biatch', 'pussy', 'dickhead', 'shithead', 'asshole', 'arsehole',
  'bastard', 'slut', 'rapist', 'molest', 'pedo', 'paedo', 'hitler', 'nazi', 'kkk', 'heilh',
  'sieghe', 'spick', 'chink', 'gook', 'raghead', 'towelhead', 'beaner',
  'penis', 'vagina', 'cumshot', 'blowjob', 'handjob', 'dildo', 'porn',
];

// The fully collapsed pass (fuuck -> fuck, cunnt -> cunt) runs on these only:
// collapsing doubles also turns Annalise into "analise", so it is kept to
// words no innocent name collapses into.
const COLLAPSED = ['cunt', 'kunt', 'cvnt', 'fuck', 'nigger', 'nigga', 'faggot', 'fagot', 'whore', 'bitch'];

const WORD = [
  'fag', 'fags', 'spic', 'spics', 'cock', 'cocks', 'dick', 'dicks', 'shit', 'shits', 'shitty',
  'ass', 'arse', 'cum', 'tit', 'tits', 'piss', 'crap', 'rape', 'raped', 'sex', 'sexy', 'nig',
  'wog', 'paki', 'knob', 'prick', 'coon', 'coons', 'homo', 'dyke',
];

// Innocent words that contain an ANYWHERE entry. Removed before that pass.
const ALLOW = [
  'scunthorpe', 'cockburn', 'hancock', 'peacock', 'cocktail', 'shuttlecock', 'woodcock',
  'therapist', 'grapist',
  'spicket', 'spicy', 'pedometer', 'pedometr', 'pedal', 'pedro', 'pedon', 'pedest', 'torpedo',
  'encyclopedi', 'orthopedi', 'stampede', 'impede', 'expedi', 'centipede', 'millipede',
  'bitchin', 'penistone',
];

// Look-alike characters folded before matching.
const FOLD = { '0': 'o', '1': 'i', '!': 'i', '|': 'i', '3': 'e', '4': 'a', '@': 'a', '5': 's', '$': 's', '7': 't', '+': 't', '8': 'b', '9': 'g', '6': 'g' };

function fold(s) {
  let out = '';
  for (const ch of String(s || '').toLowerCase()) out += FOLD[ch] || ch;
  return out;
}

function squash(s) {
  // letters only, and a run of one letter collapses to two (fuuuck -> fuuck)
  return fold(s).replace(/[^a-z]/g, '').replace(/(.)\1{2,}/g, '$1$1');
}

function tokens(raw) {
  // split on non-letters and on camelCase humps, before folding
  const parts = String(raw || '').replace(/([a-z])([A-Z])/g, '$1 $2').split(/[^A-Za-z0-9@$!|+]+/);
  return parts.map((p) => fold(p).replace(/[^a-z]/g, '')).filter(Boolean);
}

export function nameBlocked(raw) {
  const name = String(raw || '');
  if (!name.trim()) return false;
  let flat = squash(name);
  const flatOnce = flat.replace(/(.)\1+/g, '$1'); // fully collapsed (fuuck -> fuck)
  for (const a of ALLOW) { flat = flat.split(a).join(''); }
  let once = flatOnce;
  for (const a of ALLOW) { once = once.split(a).join(''); }
  for (const w of ANYWHERE) if (flat.includes(w)) return true;
  for (const w of COLLAPSED) if (once.includes(w)) return true;
  const toks = tokens(name);
  for (const t of toks) if (WORD.includes(t)) return true;
  const digitsTail = String(name).toLowerCase().split(/[^a-z0-9]+/).filter(Boolean);
  for (const t of digitsTail) {
    const m = t.match(/^([a-z]+)\d+$/);
    if (m && WORD.includes(fold(m[1]))) return true;
  }
  return false;
}

export const NAME_BLOCKED_MSG = 'That display name is not allowed. Please choose another.';
