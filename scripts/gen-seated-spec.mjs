// scripts/gen-seated-spec.mjs: the week's ramp for Seated, read by the generator (gen-seated.mjs) and the
// checker (verify-seated.mjs). Keyed by weekday (0 is Sunday); the two intro boards use Monday's and Tuesday's.
//               band        event                tables (chairs)   crowd      most requests
export const SPEC = {
  1: ['gentle', 'Dinner Party', [6], 'family', 6],
  2: ['gentle', 'Birthday Dinner', [4, 4], 'family', 7],
  3: ['moderate', 'Rehearsal Dinner', [5, 5], 'family', 9],
  4: ['moderate', 'Office Party', [4, 4, 4], 'work', 11],
  5: ['tough', 'Class Reunion', [5, 5, 5], 'school', 13],
  6: ['tough', 'Charity Gala', [6, 6, 6], 'society', 15],
  0: ['sunday', 'Wedding Reception', [5, 5, 5, 5], 'family', 20],
};
export const TYPES = ['next', 'notnext', 'across', 'same', 'apart', 'table', 'nottable'];
export const NOTES = ['by the door', 'by the band', 'by the window', 'by the bar'];
