// scripts/gen-pack-spec.mjs: the week's ramp for Pack, read by the generator (gen-pack.mjs) and the
// checker (verify-pack.mjs). Keyed by weekday (0 is Sunday); the two intro boards use Monday's and Tuesday's.
//               band        vehicle          W  D  H  boxes spare shaped kind  biggest box
export const SPEC = {
  1: ['gentle', 'Hatchback', 3, 3, 2, 6, 1, 0, 'car', 6],
  2: ['gentle', 'Sedan', 3, 4, 2, 7, 1, 1, 'car', 6],
  3: ['moderate', 'Station Wagon', 3, 4, 3, 8, 1, 1, 'car', 8],
  4: ['moderate', 'Minivan', 4, 4, 3, 9, 1, 1, 'car', 10],
  5: ['tough', 'Pickup', 4, 5, 3, 9, 0, 2, 'car', 12],
  6: ['tough', 'Cargo Van', 4, 6, 3, 11, 0, 2, 'van', 12],
  0: ['sunday', 'Moving Van', 4, 7, 4, 13, 1, 4, 'van', 18],
};
