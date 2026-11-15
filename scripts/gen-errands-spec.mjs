// scripts/gen-errands-spec.mjs: the week's ramp and the town's places for Errands, read by the generator
// (gen-errands.mjs) and the checker (verify-errands.mjs). Keyed by weekday (0 is Sunday); the intro board
// uses Monday's.
//               band        the day            town   stops rules roadworks  how many orders may work
export const SPEC = {
  1: ['gentle', 'A Few Errands', [5, 5], 4, 2, 0, [3, 9]],
  2: ['gentle', 'The Usual Round', [5, 5], 5, 3, 0, [6, 26]],
  3: ['moderate', 'A Busy Morning', [5, 5], 5, 4, 0, [3, 14]],
  4: ['moderate', 'The Long List', [5, 5], 6, 4, 0, [8, 48]],
  5: ['tough', 'Roadworks', [5, 5], 6, 5, 2, [3, 22]],
  6: ['tough', 'Saturday Rush', [6, 5], 7, 5, 2, [6, 70]],
  0: ['sunday', 'The Big Day', [6, 6], 8, 6, 3, [8, 180]],
};
export const TYPES = ['closes', 'opens', 'fresh', 'before'];
// name (ten letters at most: it is printed under the stop), picture, what you do there, and what spoils (if anything)
const p = (n, k, task, what) => ({ n, k, task, ...(what ? { what } : {}) });
export const PLACES = [
  p('Bank', 'bank', 'Deposit a check'), p('Bakery', 'bread', 'Collect the birthday cake', 'The cake'), p('Post Office', 'mail', 'Send a parcel'),
  p('Cleaners', 'shirt', 'Pick up the suit'), p('Market', 'basket', 'Buy vegetables'), p('Pharmacy', 'cross', 'Collect a prescription'),
  p('Library', 'book', 'Return the books'), p('Florist', 'flower', 'Buy flowers', 'The flowers'), p('Butcher', 'knife', 'Buy the roast', 'The roast'),
  p('Hardware', 'hammer', 'Buy a tin of paint'), p('Vet', 'paw', 'Collect the cat'), p('Cafe', 'cup', 'Pick up the coffees', 'The coffee'),
  p('Creamery', 'cone', 'Buy ice cream', 'The ice cream'), p('Fish Stall', 'fish', 'Buy the salmon', 'The fish'), p('Tailor', 'needle', 'Drop off trousers'),
  p('Barber', 'scissors', 'Get a haircut'), p('Bookshop', 'book', 'Collect an order'), p('Toy Shop', 'kite', 'Buy a present'),
  p('Garage', 'wrench', 'Collect the spare key'), p('Pizzeria', 'pizza', 'Pick up the pizza', 'The pizza'),
];
export const KINDS = [...new Set(PLACES.map((x) => x.k))];
