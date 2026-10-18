// The Arcos finale check: every word that genuinely goes with all three of a
// day's hidden words. Used by scripts/gen-arcos.mjs to write each board's
// `also` list; scripts/verify-arcos.mjs recomputes it with its own code.
//
// A word W fits a hidden word H on the 'post' side when H+W is a dictionary
// word (CHECKUP, STANDOUT) or "H W" is a known phrase (STAND BY, CHECK IN), and
// on the 'pre' side the same with W first (STARLIGHT, STAR LIGHT). W counts
// when it fits all three hidden words on the same side. Sources:
//   closed words   public/tuck-dict.txt + public/tuck-dict-long.txt
//   phrases        scripts/hinge-pairs.txt + scripts/arcos-phrases.txt (WordNet)
// Rules in scripts/arcos-accept-rules.json: W is 2 to 12 letters, a word in its
// own right, not an affix (ER, LESS, RE) and not a hidden word; a candidate that
// is another candidate plus an inflection (TOPS beside TOP) is dropped.
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(HERE, '..');

let DATA = null;
function load() {
  if (DATA) return DATA;
  const rules = JSON.parse(readFileSync(path.join(HERE, 'arcos-accept-rules.json'), 'utf8'));
  const dict = new Set();
  for (const f of ['public/tuck-dict.txt', 'public/tuck-dict-long.txt']) {
    for (const w of readFileSync(path.join(ROOT, f), 'utf8').split('\n')) {
      const t = w.trim().toUpperCase();
      if (/^[A-Z]+$/.test(t)) dict.add(t);
    }
  }
  const phrases = new Set();
  const words = new Set(dict);
  for (const f of ['hinge-pairs.txt', 'arcos-phrases.txt']) {
    for (const raw of readFileSync(path.join(HERE, f), 'utf8').split('\n')) {
      const t = raw.trim();
      if (!t || t[0] === '#') continue;
      const [a, b] = t.split(/\s+/);
      if (!a || !b) continue;
      phrases.add(a.toUpperCase() + ' ' + b.toUpperCase());
      words.add(a.toUpperCase()); words.add(b.toUpperCase());
    }
  }
  const byFirst = new Map(); const bySecond = new Map();
  for (const p of phrases) {
    const [a, b] = p.split(' ');
    if (!byFirst.has(a)) byFirst.set(a, new Set()); byFirst.get(a).add(b);
    if (!bySecond.has(b)) bySecond.set(b, new Set()); bySecond.get(b).add(a);
  }
  DATA = { rules, dict, words, byFirst, bySecond, affix: new Set(rules.affixes), infl: rules.inflections };
  return DATA;
}

// every W that fits H on a side
function fitsOf(h, side) {
  const { dict, byFirst, bySecond } = load();
  const out = new Set();
  for (const w of dict) {
    if (w.length <= h.length) continue;
    if (side === 'post' && w.startsWith(h)) out.add(w.slice(h.length));
    if (side === 'pre' && w.endsWith(h)) out.add(w.slice(0, w.length - h.length));
  }
  const ph = side === 'post' ? byFirst.get(h) : bySecond.get(h);
  if (ph) for (const w of ph) out.add(w);
  return out;
}

export function acceptedFinales(hidden) {
  const { rules, words, affix, infl } = load();
  const hs = hidden.map((h) => h.toUpperCase());
  const found = new Set();
  for (const side of ['post', 'pre']) {
    const sets = hs.map((h) => fitsOf(h, side));
    for (const w of sets[0]) {
      if (!sets[1].has(w) || !sets[2].has(w)) continue;
      if (w.length < rules.minLength || w.length > rules.maxLength) continue;
      if (!words.has(w) || affix.has(w) || hs.includes(w)) continue;
      found.add(w);
    }
  }
  const keep = [...found].filter((w) => !infl.some((s) => w.length > s.length && w.endsWith(s) && found.has(w.slice(0, -s.length))));
  return keep.sort();
}

// the board's `also`: every accepted word but the setter's finale
export function alsoFor(p) {
  return acceptedFinales(p.rounds.map((r) => r.word)).filter((w) => w !== p.finale);
}
