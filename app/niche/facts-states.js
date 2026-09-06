// Niche facts: US STATES (the Monday universe). All fifty, with clean-edged
// facts only.
//
// FIELD RULES:
//   cap   the state capital.
//   y     year of admission to the Union (ratification year for the original
//         thirteen).
//   can   borders Canada (the standard thirteen; a Great Lakes water boundary
//         counts, so Ohio and Pennsylvania are in, the generous reading).
//   mex   borders Mexico (the four).
//   oc    has an ocean coastline (the Gulf of Mexico counts, the generous
//         reading; Pennsylvania's estuary does not).
//   gulf  on the Gulf of Mexico (the five).
//   lakes touches a Great Lake (the eight).
//   col   one of the thirteen colonies.
//   pop5  population clearly over five million (2020s censuses; Alabama at
//         ~5.16M is the lowest in, Louisiana at ~4.6M the highest out).
//   riv   borders the Mississippi River (the ten).
//   pop2  population clearly under two million (Nebraska and Idaho, at the
//         line, are excluded).
//   ab    postal abbreviation.
//   reg   Census Bureau region: ne | mw | s | w. The Bureau's own four-region
//         split of all fifty states, so the four are exhaustive and disjoint.
//   atl   has an Atlantic Ocean coastline. The Gulf coast is NOT the Atlantic
//         here, so Alabama, Mississippi, Louisiana and Texas are out and
//         Florida, with both, is in; Pennsylvania's estuary is out, matching
//         the oc rule.
//   pres  birthplace of a US president. South Carolina is in on Andrew
//         Jackson, whose Waxhaws birthplace both Carolinas claim, the
//         generous reading; North Carolina is in on Polk and Andrew Johnson
//         regardless.
//   caplg the capital is the state's largest city by population (2020 census
//         city proper). Borderline exclusions: South Carolina is out, since
//         Charleston outgrew Columbia.
//   park  contains at least part of one of the 63 units the National Park
//         Service designates a National Park. Idaho is in on its sliver of
//         Yellowstone, the generous reading.
//   a10   one of the ten largest states by area; s10 one of the ten smallest.
//         The same ten either way, land area or total area.
//   west  lies west of the Mississippi River (a river-border state whose bulk
//         is on the west bank counts: Iowa, Missouri, Arkansas, Louisiana and
//         Minnesota are in, the generous reading; Hawaii and Alaska count).
export const STATES = [
  { t: 'Alabama', ab: 'AL', cap: 'Montgomery', y: 1819, reg: 's', oc: 1, gulf: 1, pop5: 1 },
  { t: 'Alaska', ab: 'AK', cap: 'Juneau', y: 1959, reg: 'w', can: 1, oc: 1, pop2: 1, west: 1, park: 1, a10: 1 },
  { t: 'Arizona', ab: 'AZ', cap: 'Phoenix', y: 1912, reg: 'w', mex: 1, pop5: 1, west: 1, caplg: 1, park: 1, a10: 1 },
  { t: 'Arkansas', ab: 'AR', cap: 'Little Rock', y: 1836, reg: 's', riv: 1, west: 1, pres: 1, caplg: 1, park: 1 },
  { t: 'California', ab: 'CA', cap: 'Sacramento', y: 1850, reg: 'w', mex: 1, oc: 1, pop5: 1, west: 1, pres: 1, park: 1, a10: 1 },
  { t: 'Colorado', ab: 'CO', cap: 'Denver', y: 1876, reg: 'w', pop5: 1, west: 1, caplg: 1, park: 1, a10: 1 },
  { t: 'Connecticut', ab: 'CT', cap: 'Hartford', y: 1788, reg: 'ne', oc: 1, col: 1, atl: 1, pres: 1, s10: 1 },
  { t: 'Delaware', ab: 'DE', cap: 'Dover', y: 1787, reg: 's', oc: 1, col: 1, pop2: 1, atl: 1, s10: 1 },
  { t: 'Florida', ab: 'FL', cap: 'Tallahassee', y: 1845, reg: 's', oc: 1, gulf: 1, pop5: 1, atl: 1, park: 1 },
  { t: 'Georgia', ab: 'GA', cap: 'Atlanta', y: 1788, reg: 's', oc: 1, col: 1, pop5: 1, atl: 1, pres: 1, caplg: 1 },
  { t: 'Hawaii', ab: 'HI', cap: 'Honolulu', y: 1959, reg: 'w', oc: 1, pop2: 1, west: 1, pres: 1, caplg: 1, park: 1, s10: 1 },
  { t: 'Idaho', ab: 'ID', cap: 'Boise', y: 1890, reg: 'w', can: 1, west: 1, caplg: 1, park: 1 },
  { t: 'Illinois', ab: 'IL', cap: 'Springfield', y: 1818, reg: 'mw', lakes: 1, pop5: 1, riv: 1, pres: 1 },
  { t: 'Indiana', ab: 'IN', cap: 'Indianapolis', y: 1816, reg: 'mw', lakes: 1, pop5: 1, caplg: 1, park: 1 },
  { t: 'Iowa', ab: 'IA', cap: 'Des Moines', y: 1846, reg: 'mw', riv: 1, west: 1, pres: 1, caplg: 1 },
  { t: 'Kansas', ab: 'KS', cap: 'Topeka', y: 1861, reg: 'mw', west: 1 },
  { t: 'Kentucky', ab: 'KY', cap: 'Frankfort', y: 1792, reg: 's', riv: 1, pres: 1, park: 1 },
  { t: 'Louisiana', ab: 'LA', cap: 'Baton Rouge', y: 1812, reg: 's', oc: 1, gulf: 1, riv: 1, west: 1 },
  { t: 'Maine', ab: 'ME', cap: 'Augusta', y: 1820, reg: 'ne', can: 1, oc: 1, pop2: 1, atl: 1, park: 1 },
  { t: 'Maryland', ab: 'MD', cap: 'Annapolis', y: 1788, reg: 's', oc: 1, col: 1, pop5: 1, atl: 1, s10: 1 },
  { t: 'Massachusetts', ab: 'MA', cap: 'Boston', y: 1788, reg: 'ne', oc: 1, col: 1, pop5: 1, atl: 1, pres: 1, caplg: 1, s10: 1 },
  { t: 'Michigan', ab: 'MI', cap: 'Lansing', y: 1837, reg: 'mw', can: 1, lakes: 1, pop5: 1, park: 1 },
  { t: 'Minnesota', ab: 'MN', cap: 'Saint Paul', y: 1858, reg: 'mw', can: 1, lakes: 1, pop5: 1, riv: 1, west: 1, park: 1 },
  { t: 'Mississippi', ab: 'MS', cap: 'Jackson', y: 1817, reg: 's', oc: 1, gulf: 1, riv: 1, caplg: 1 },
  { t: 'Missouri', ab: 'MO', cap: 'Jefferson City', y: 1821, reg: 'mw', pop5: 1, riv: 1, west: 1, pres: 1, park: 1 },
  { t: 'Montana', ab: 'MT', cap: 'Helena', y: 1889, reg: 'w', can: 1, pop2: 1, west: 1, park: 1, a10: 1 },
  { t: 'Nebraska', ab: 'NE', cap: 'Lincoln', y: 1867, reg: 'mw', west: 1, pres: 1 },
  { t: 'Nevada', ab: 'NV', cap: 'Carson City', y: 1864, reg: 'w', west: 1, park: 1, a10: 1 },
  { t: 'New Hampshire', ab: 'NH', cap: 'Concord', y: 1788, reg: 'ne', can: 1, oc: 1, col: 1, pop2: 1, atl: 1, pres: 1, s10: 1 },
  { t: 'New Jersey', ab: 'NJ', cap: 'Trenton', y: 1787, reg: 'ne', oc: 1, col: 1, pop5: 1, atl: 1, pres: 1, s10: 1 },
  { t: 'New Mexico', ab: 'NM', cap: 'Santa Fe', y: 1912, reg: 'w', mex: 1, west: 1, park: 1, a10: 1 },
  { t: 'New York', ab: 'NY', cap: 'Albany', y: 1788, reg: 'ne', can: 1, oc: 1, lakes: 1, col: 1, pop5: 1, atl: 1, pres: 1 },
  { t: 'North Carolina', ab: 'NC', cap: 'Raleigh', y: 1789, reg: 's', oc: 1, col: 1, pop5: 1, atl: 1, pres: 1, park: 1 },
  { t: 'North Dakota', ab: 'ND', cap: 'Bismarck', y: 1889, reg: 'mw', can: 1, pop2: 1, west: 1, park: 1 },
  { t: 'Ohio', ab: 'OH', cap: 'Columbus', y: 1803, reg: 'mw', can: 1, lakes: 1, pop5: 1, pres: 1, caplg: 1, park: 1 },
  { t: 'Oklahoma', ab: 'OK', cap: 'Oklahoma City', y: 1907, reg: 's', west: 1, caplg: 1 },
  { t: 'Oregon', ab: 'OR', cap: 'Salem', y: 1859, reg: 'w', oc: 1, west: 1, park: 1, a10: 1 },
  { t: 'Pennsylvania', ab: 'PA', cap: 'Harrisburg', y: 1787, reg: 'ne', can: 1, lakes: 1, col: 1, pop5: 1, pres: 1 },
  { t: 'Rhode Island', ab: 'RI', cap: 'Providence', y: 1790, reg: 'ne', oc: 1, col: 1, pop2: 1, atl: 1, caplg: 1, s10: 1 },
  { t: 'South Carolina', ab: 'SC', cap: 'Columbia', y: 1788, reg: 's', oc: 1, col: 1, pop5: 1, atl: 1, pres: 1, park: 1 },
  { t: 'South Dakota', ab: 'SD', cap: 'Pierre', y: 1889, reg: 'mw', pop2: 1, west: 1, park: 1 },
  { t: 'Tennessee', ab: 'TN', cap: 'Nashville', y: 1796, reg: 's', pop5: 1, riv: 1, caplg: 1, park: 1 },
  { t: 'Texas', ab: 'TX', cap: 'Austin', y: 1845, reg: 's', mex: 1, oc: 1, gulf: 1, pop5: 1, west: 1, pres: 1, park: 1, a10: 1 },
  { t: 'Utah', ab: 'UT', cap: 'Salt Lake City', y: 1896, reg: 'w', west: 1, caplg: 1, park: 1 },
  { t: 'Vermont', ab: 'VT', cap: 'Montpelier', y: 1791, reg: 'ne', can: 1, pop2: 1, pres: 1, s10: 1 },
  { t: 'Virginia', ab: 'VA', cap: 'Richmond', y: 1788, reg: 's', oc: 1, col: 1, pop5: 1, atl: 1, pres: 1, park: 1 },
  { t: 'Washington', ab: 'WA', cap: 'Olympia', y: 1889, reg: 'w', can: 1, oc: 1, pop5: 1, west: 1, park: 1 },
  { t: 'West Virginia', ab: 'WV', cap: 'Charleston', y: 1863, reg: 's', pop2: 1, caplg: 1, park: 1, s10: 1 },
  { t: 'Wisconsin', ab: 'WI', cap: 'Madison', y: 1848, reg: 'mw', lakes: 1, pop5: 1, riv: 1 },
  { t: 'Wyoming', ab: 'WY', cap: 'Cheyenne', y: 1890, reg: 'w', pop2: 1, west: 1, caplg: 1, park: 1, a10: 1 },
];
