// Decodes a Pairs deal (see scripts/gen-pairs.mjs for the encoding). Shared by
// the client and scripts/verify-pairs.mjs, which also decodes it its own way.
const RANKS = ['A', '2', '3', '4', '5', '6', '7', '8', '9', 'T', 'J', 'Q', 'K'];
export const DECK = RANKS.flatMap((r) => ['S', 'H', 'D', 'C'].map((s) => r + s));
export function decodeDeal(deal, salt) {
  const out = [];
  for (let i = 0; i < deal.length / 2; i++) out.push(DECK[(((parseInt(deal.slice(2 * i, 2 * i + 2), 36) - 7 * i - salt) % 52) + 52) % 52]);
  return out;
}
// Two cards pair when they share a rank and a colour.
export const isRed = (c) => c[1] === 'H' || c[1] === 'D';
export const pairOf = (a, b) => a !== b && a[0] === b[0] && isRed(a) === isRed(b);
