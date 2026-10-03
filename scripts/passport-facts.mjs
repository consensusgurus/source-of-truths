// The hand-authored half of the Passport bank (owner, 2026-10-03). Everything
// a script can read off a dataset comes from one: borders from Flank's
// dataset (app/flank/borders.js), areas and capital coordinates from the CIA
// World Factbook (scripts/passport-factbook.mjs), flags from the flag-icons
// set (MIT), photos from Wikimedia Commons. What is written by hand lives
// HERE: the calendar, each day's landmark photo, the flag build spec, and the
// two island days' nearest-by-sea answers.
//
// RULES (checked by scripts/verify-passport.mjs):
//   - one country a day; no country twice in the bank;
//   - never the same country as Flank within three days;
//   - never a Flank noSubject entity (its border set is contested);
//   - Sundays are the Sunday Edition: a country with eight or more land
//     neighbours; weekdays ramp from one or two neighbours on Monday upward;
//   - an island (no land border) plays "Across the Water" in round 3: its two
//     nearest sovereign countries by sea, measured coast to main coast,
//     overseas territories not counted;
//   - a landmark must sit wholly inside the country (no shared waterfalls).

// [ET date, entity code]
export const SCHEDULE = [
  ['2026-10-03', 'LK'], ['2026-10-04', 'DE'], ['2026-10-05', 'US'], ['2026-10-06', 'MX'], ['2026-10-07', 'GR'],
  ['2026-10-08', 'EG'], ['2026-10-09', 'JO'], ['2026-10-10', 'IT'], ['2026-10-11', 'TR'],
  ['2026-10-12', 'GB'], ['2026-10-13', 'NO'], ['2026-10-14', 'TH'], ['2026-10-15', 'PE'],
  ['2026-10-16', 'HR'], ['2026-10-17', 'HU'], ['2026-10-18', 'CN'], ['2026-10-19', 'NL'],
  ['2026-10-20', 'AE'], ['2026-10-21', 'CL'], ['2026-10-22', 'CZ'], ['2026-10-23', 'AR'],
  ['2026-10-24', 'PL'], ['2026-10-25', 'TZ'], ['2026-10-26', 'CA'], ['2026-10-27', 'VN'],
  ['2026-10-28', 'JM'], ['2026-10-29', 'KH'], ['2026-10-30', 'IN'], ['2026-10-31', 'ET'],
  ['2026-11-01', 'AT'], ['2026-11-02', 'DK'],
];

// Island days: the two nearest sovereign countries across the water.
export const ACROSS = {
  JM: ['CU', 'HT'],   // Cuba ~145 km north, Haiti ~190 km east
  LK: ['IN', 'MV'],   // India across the Palk Strait, the Maldives ~700 km south-west
};

// Capitals that are not simply the Factbook's one point. A pin is scored to
// the NEAREST listed seat, so a player is never marked down for picking the
// other one. Names are what the reveal prints.
export const CAPITALS = {
  // Dodoma has been the official capital since 1996; the Factbook's point is
  // Dar es Salaam, which is NOT accepted.
  TZ: [{ name: 'Dodoma', at: [35.74, -6.17] }],
  LK: [{ name: 'Sri Jayawardenepura Kotte', at: [79.9, 6.9] }, { name: 'Colombo', at: [79.85, 6.93] }],
};

// The capital's name as the reveal prints it (the Factbook's own strings
// carry notes and alternate spellings). Coordinates come from the Factbook.
export const CAPITAL_NAME = {
  DE: 'Berlin', US: 'Washington, D.C.', MX: 'Mexico City', GR: 'Athens', EG: 'Cairo', JO: 'Amman',
  IT: 'Rome', TR: 'Ankara', GB: 'London', NO: 'Oslo', TH: 'Bangkok', PE: 'Lima', HR: 'Zagreb',
  HU: 'Budapest', CN: 'Beijing', NL: 'Amsterdam', AE: 'Abu Dhabi', CL: 'Santiago', CZ: 'Prague',
  AR: 'Buenos Aires', PL: 'Warsaw', TZ: 'Dodoma', CA: 'Ottawa', VN: 'Hanoi', JM: 'Kingston',
  KH: 'Phnom Penh', IN: 'New Delhi', ET: 'Addis Ababa', AT: 'Vienna', DK: 'Copenhagen', LK: 'Sri Jayawardenepura Kotte',
};

// The landmark photo for each day: [name shown at the reveal, Commons file
// title, licence, author, focal x, focal y]. Every title was checked against
// the Commons API on 2026-10-03 and looked at by eye.
export const LANDMARKS = {
  DE: ['Brandenburg Gate', 'Brandenburger Tor abends.jpg', 'CC BY-SA 3.0', 'Thomas Wolf, www.foto-tw.de', 0.5, 0.45],
  US: ['Statue of Liberty', 'Front view of Statue of Liberty (cropped).jpg', 'CC0', 'AskALotl', 0.55, 0.3],
  MX: ['Chichén Itzá', 'Chichen Itza 3.jpg', 'CC BY-SA 4.0', 'Daniel Schwen', 0.5, 0.4],
  GR: ['The Parthenon', 'The Parthenon in Athens.jpg', 'CC BY 2.0', 'Steve Swayne', 0.5, 0.4],
  EG: ['Great Pyramid of Giza', 'Great Pyramid of Giza - Pyramid of Khufu.jpg', 'CC BY-SA 4.0', 'Douwe C. van der Zee', 0.5, 0.45],
  JO: ['Al-Khazneh, Petra', 'Al khazneh.jpg', 'CC BY-SA 3.0', 'Susanahajer', 0.6, 0.4],
  IT: ['The Colosseum', 'Colosseo 2020.jpg', 'CC BY-SA 4.0', 'FeaturedPics', 0.45, 0.45],
  TR: ['Hagia Sophia', 'Hagia Sophia (228968325).jpeg', 'CC BY-SA 3.0', 'Adli Wahid', 0.5, 0.5],
  GB: ['Tower Bridge', 'Tower Bridge at Dawn.jpg', 'CC BY-SA 3.0', 'Fuzzypiggy', 0.45, 0.4],
  NO: ['Geirangerfjord', 'Geirangerfjord .jpg', 'CC BY-SA 2.5', 'Andreas Trepte', 0.55, 0.55],
  TH: ['Wat Arun', 'เจดีย์ประธานทรงปรางค์วัดอรุณ2.jpg', 'CC BY-SA 4.0', 'Mastertongapollo', 0.5, 0.4],
  PE: ['Machu Picchu', 'Machu Picchu, 2023 (012).jpg', 'CC BY-SA 4.0', 'Draceane', 0.55, 0.5],
  HR: ['Dubrovnik', 'The walls of the fortress and View of the old city. panorama.jpg', 'CC BY-SA 4.0', 'Zysko serhii', 0.5, 0.55],
  HU: ['Hungarian Parliament Building', 'Hungarian Parliament Building from across the Danube, 2025-01-11.jpg', 'CC BY 4.0', 'Kilyann Le Hen', 0.5, 0.55],
  CN: ['The Great Wall at Jinshanling', 'The Great Wall of China at Jinshanling-edit.jpg', 'CC BY-SA 3.0', 'Severin.stalder', 0.55, 0.55],
  NL: ['Windmills at Kinderdijk', 'KinderdijkMolens02.jpg', 'CC BY-SA 3.0', 'Lucas Hirschegger', 0.35, 0.45],
  AE: ['Burj Khalifa', 'Front view from Burj Khalifa Metro Station.jpg', 'CC0', 'Aspere', 0.5, 0.5],
  CL: ['Cuernos del Paine, Torres del Paine', 'Cuernos del Paine, Parque Nacional Torres del Paine, Chile6.jpg', 'CC BY-SA 3.0', 'Diego Delso', 0.6, 0.45],
  CZ: ['Charles Bridge, Prague', 'Prague 07-2016 view from Lesser Town Tower of Charles Bridge img3.jpg', 'FAL', 'A.Savin', 0.55, 0.6],
  AR: ['Perito Moreno Glacier', 'Perito Moreno Glacier 2023.jpg', 'CC BY-SA 4.0', 'Fernando', 0.5, 0.6],
  PL: ['Wawel Castle, Kraków', 'Wawel (4).jpg', 'CC BY-SA 4.0', 'Monika Towiańska', 0.45, 0.5],
  TZ: ['Mount Kilimanjaro', 'Kilimanjaro from Amboseli.jpg', 'CC BY-SA 4.0', 'Sergey Pesterev', 0.5, 0.4],
  CA: ['Moraine Lake', 'Moraine Lake 17092005.jpg', 'Public domain', 'Gorgo', 0.5, 0.4],
  VN: ['Ha Long Bay', 'Ha Long Bay in 2019.jpg', 'CC BY-SA 4.0', 'Taewangkorea', 0.45, 0.6],
  JM: ["Dunn's River Falls", 'Dunns River Falls climb.JPG', 'CC BY-SA 3.0', 'Breakyunit at English Wikipedia', 0.5, 0.5],
  KH: ['Angkor Wat', 'Angkor Wat.jpg', 'CC BY-SA 4.0', 'Bjørn Christian Tørrissen', 0.5, 0.35],
  IN: ['The Taj Mahal', 'Taj Mahal (Edited).jpeg', 'CC BY-SA 4.0', 'Yann; edited by Jim Carter', 0.5, 0.4],
  ET: ['Church of Saint George, Lalibela', 'Lalibela, san giorgio, esterno 24.jpg', 'CC BY 3.0', 'Sailko', 0.45, 0.5],
  AT: ['Hallstatt', 'Hallstatt - Zentrum .JPG', 'CC BY-SA 4.0', 'C.Stadler/Bwag', 0.5, 0.6],
  DK: ['Nyhavn, Copenhagen', 'The Nyhavn Canal 3.jpg', 'CC BY 4.0', 'European Commission', 0.5, 0.5],
  LK: ['Sigiriya', 'Sigiriya (141688197).jpeg', 'CC BY-SA 3.0', 'Wrobell', 0.45, 0.35],
};

// THE FLAG ROUND builds the flag in three picks: its colours, its layout,
// then the real flag out of four lookalikes. `pal` is the palette in the
// order the layout paints it (see FLAG_LAYOUTS in app/passport/flagkit.js),
// `lay` the layout, `also` three countries whose flags sit close to it and
// are offered beside it at the last step. Hex values follow flag-icons.
export const FLAGS = {
  DE: { pal: ['#000000', '#DD0000', '#FFCE00'], lay: 'h3', also: ['BE', 'LT', 'AM'] },
  US: { pal: ['#B22234', '#FFFFFF', '#3C3B6E'], lay: 'canton', also: ['LR', 'MY', 'CL'] },
  MX: { pal: ['#006847', '#FFFFFF', '#CE1126'], lay: 'v3', also: ['IT', 'IE', 'CI'] },
  GR: { pal: ['#0D5EAF', '#FFFFFF', '#0D5EAF'], lay: 'canton', also: ['UY', 'IL', 'HN'] },
  EG: { pal: ['#CE1126', '#FFFFFF', '#000000'], lay: 'h3', also: ['SY', 'IQ', 'YE'] },
  JO: { pal: ['#000000', '#FFFFFF', '#007A3D', '#CE1126'], lay: 'triangle', also: ['PS', 'SD', 'KW'] },
  IT: { pal: ['#009246', '#FFFFFF', '#CE2B37'], lay: 'v3', also: ['MX', 'IE', 'HU'] },
  TR: { pal: ['#E30A17', '#FFFFFF'], lay: 'field', also: ['TN', 'PK', 'DZ'] },
  GB: { pal: ['#012169', '#FFFFFF', '#C8102E'], lay: 'union', also: ['AU', 'NZ', 'FJ'] },
  NO: { pal: ['#BA0C2F', '#FFFFFF', '#00205B'], lay: 'nordic', also: ['IS', 'DK', 'FI'] },
  TH: { pal: ['#A51931', '#F4F5F8', '#2D2A4A'], lay: 'h5', also: ['CR', 'KP', 'RU'] },
  PE: { pal: ['#D91023', '#FFFFFF', '#D91023'], lay: 'v3', also: ['CA', 'AT', 'LV'] },
  HR: { pal: ['#FF0000', '#FFFFFF', '#171796'], lay: 'h3', also: ['RS', 'SI', 'SK'] },
  HU: { pal: ['#CE2939', '#FFFFFF', '#477050'], lay: 'h3', also: ['IT', 'BG', 'IR'] },
  CN: { pal: ['#EE1C25', '#FFFF00'], lay: 'field', also: ['VN', 'KG', 'MA'] },
  NL: { pal: ['#AE1C28', '#FFFFFF', '#21468B'], lay: 'h3', also: ['LU', 'RU', 'FR'] },
  AE: { pal: ['#FF0000', '#00732F', '#FFFFFF', '#000000'], lay: 'hoist', also: ['KW', 'JO', 'SD'] },
  CL: { pal: ['#FFFFFF', '#D52B1E', '#0039A6'], lay: 'canton2', also: ['PL', 'CZ', 'US'] },
  CZ: { pal: ['#FFFFFF', '#D7141A', '#11457E'], lay: 'triangle', also: ['PH', 'PL', 'SD'] },
  AR: { pal: ['#74ACDF', '#FFFFFF', '#74ACDF'], lay: 'h3', also: ['UY', 'SV', 'NI'] },
  PL: { pal: ['#FFFFFF', '#DC143C'], lay: 'h2', also: ['ID', 'MC', 'SG'] },
  TZ: { pal: ['#1EB53A', '#FCD116', '#000000', '#00A3DD'], lay: 'diagonal', also: ['CG', 'NA', 'SB'] },
  CA: { pal: ['#D52B1E', '#FFFFFF', '#D52B1E'], lay: 'v3', also: ['PE', 'LB', 'AT'] },
  VN: { pal: ['#DA251D', '#FFFF00'], lay: 'field', also: ['CN', 'MA', 'TR'] },
  JM: { pal: ['#000000', '#FED100', '#009B3A'], lay: 'saltire', also: ['BI', 'GE', 'BR'] },
  KH: { pal: ['#032EA1', '#E00025', '#032EA1'], lay: 'h3', also: ['TH', 'CR', 'LA'] },
  IN: { pal: ['#FF9933', '#FFFFFF', '#138808'], lay: 'h3', also: ['NE', 'IE', 'TJ'] },
  ET: { pal: ['#078930', '#FCDD09', '#DA121A'], lay: 'h3', also: ['BO', 'GH', 'LT'] },
  AT: { pal: ['#ED2939', '#FFFFFF', '#ED2939'], lay: 'h3', also: ['LV', 'LB', 'PE'] },
  DK: { pal: ['#C8102E', '#FFFFFF'], lay: 'nordic', also: ['CH', 'NO', 'SE'] },
  LK: { pal: ['#FFBE29', '#00534E', '#EB7400', '#8D153A'], lay: 'banner', also: ['BT', 'AL', 'KG'] },
};
