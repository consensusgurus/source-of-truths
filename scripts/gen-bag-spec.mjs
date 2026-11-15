// scripts/gen-bag-spec.mjs: the week's ramp and the shelf for Bag, read by the generator (gen-bag.mjs) and
// the checker (verify-bag.mjs). Keyed by weekday (0 is Sunday); the two intro boards use Monday's and Tuesday's.
// A bag is [slots, pounds]. `ease` is the share of careless playouts (any reachable item into any bag that
// takes it) that finish with nothing coming back out: the day's board must fall inside it.
// `ease` is how forgiving the board is: along the stored answer, the average share of the moves on offer
// that still leave the shop baggable with nothing coming back out. The day's board must fall inside it.
//               band        the shop          items bags                                             reach hot cleaning solo  ease
export const SPEC = {
  1: ['gentle', 'Corner Shop', 8, [[4, 9], [4, 9], [4, 9]], 3, 0, 0, 0, [0.68, 1]],
  2: ['gentle', 'Quick Stop', 9, [[4, 9], [4, 9], [4, 9]], 3, 1, 0, 0, [0.6, 1]],
  3: ['moderate', 'Midweek Shop', 11, [[4, 9], [4, 9], [4, 9], [4, 9]], 3, 1, 2, 0, [0.5, 0.66]],
  4: ['moderate', 'Stock Up', 13, [[4, 9], [4, 9], [4, 9], [4, 9]], 3, 1, 2, 0, [0.42, 0.56]],
  5: ['tough', 'Friday Rush', 13, [[4, 9], [4, 9], [4, 9], [4, 9]], 2, 1, 2, 0, [0.3, 0.5]],
  6: ['tough', 'Party Shop', 13, [[4, 9], [4, 9], [4, 9], [3, 6]], 2, 2, 2, 0, [0.3, 0.5]],
  0: ['sunday', 'The Big Shop', 18, [[4, 9], [4, 9], [4, 9], [4, 9], [4, 9], [4, 9]], 3, 2, 3, 1, [0.3, 0.48]],
};
// THE SHELF: name, pounds, takes on top (99 = anything), picture, hue, then cold / hot / chem / solo.
const row = (n, w, c, k, hue, x) => ({ n, w, c, k, hue, ...(x ? { [x]: 1 } : {}) });
export const SHELF = [
  row('Eggs', 1, 0, 'eggs', 45), row('Bread', 1, 0, 'loaf', 32), row('Chips', 1, 0, 'pouch', 50), row('Berries', 1, 0, 'tub', 340),
  row('Tomatoes', 1, 1, 'round', 2), row('Lettuce', 1, 1, 'round', 110), row('Peaches', 1, 1, 'round', 25), row('Bananas', 2, 1, 'bunch', 52),
  row('Cookies', 1, 1, 'pouch', 28), row('Crackers', 1, 1, 'box', 38), row('Cereal', 1, 2, 'box', 265), row('Tea', 1, 2, 'box', 150),
  row('Pasta', 1, 3, 'box', 48), row('Rice', 2, 99, 'sack', 60), row('Flour', 2, 6, 'sack', 220), row('Sugar', 2, 99, 'sack', 300),
  row('Potatoes', 5, 99, 'sack', 28), row('Onions', 3, 99, 'sack', 18), row('Beans', 3, 99, 'can', 10), row('Soup', 3, 99, 'can', 150),
  row('Tuna', 1, 99, 'can', 200), row('Corn', 2, 99, 'can', 55), row('Jam', 2, 6, 'jar', 350), row('Pickles', 3, 6, 'jar', 95),
  row('Honey', 2, 6, 'jar', 42), row('Juice', 4, 5, 'bottle', 30), row('Soda', 4, 6, 'bottle', 5), row('Oil', 3, 5, 'bottle', 65),
  row('Milk', 4, 5, 'carton', 205, 'cold'), row('Ice Cream', 2, 2, 'tub', 330, 'cold'), row('Peas', 1, 2, 'pouch', 120, 'cold'), row('Yogurt', 2, 2, 'tub', 285, 'cold'),
  row('Butter', 1, 3, 'box', 50, 'cold'), row('Cheese', 1, 3, 'box', 40, 'cold'), row('Pizza', 2, 1, 'box', 12, 'cold'), row('Chicken', 3, 4, 'tub', 20, 'cold'),
  row('Bleach', 4, 99, 'bottle', 190, 'chem'), row('Detergent', 5, 99, 'bottle', 250, 'chem'), row('Sponges', 1, 2, 'pouch', 75, 'chem'), row('Dish Soap', 2, 5, 'bottle', 170, 'chem'),
  row('Hot Soup', 2, 3, 'tub', 15, 'hot'), row('Hot Wings', 2, 2, 'box', 8, 'hot'), row('Coffee', 1, 1, 'cup', 24, 'hot'), row('Roast', 3, 4, 'tub', 35, 'hot'),
  row('Melon', 8, 99, 'melon', 130, 'solo'),
];
export const KINDS = ['eggs', 'loaf', 'pouch', 'tub', 'round', 'bunch', 'box', 'sack', 'can', 'jar', 'bottle', 'carton', 'melon', 'cup'];
