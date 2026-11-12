// scripts/slot-pool.mjs — the vocabulary for Slot, the daily blind ranking.
//
// Every entry is one BOARD SUBJECT: a real thing with a hard numeric axis and
// ten or more items on it, in TRUE order (index 0 is slot 1). The generator
// (scripts/gen-slot.mjs) picks the subject for each day, picks the REVEAL
// ORDER by simulation, and writes app/slot/puzzles.js; the verifier
// (scripts/verify-slot.mjs) re-proves every board against this file.
//
// SHAPE
//   id      stable slug, never reused across the bank
//   axis    the question the board asks, reader-facing ("Countries by population")
//   top     what slot 1 means ("Most people"), bottom what the last slot means
//   unit    how `d` reads ("people", "meters")
//   dir     'desc' when slot 1 is the LARGEST value, 'asc' when it is the
//           smallest (years: earliest first)
//   fam     a family for the variety check (geo, science, history, sport, pop)
//   exact   the values are exact counts (years, ages, a scale), so the only
//           gap rule is no ties; measured subjects need 1.5% between neighbours
//   source  where the figures come from, reader-facing on the reveal
//   items   [name, value, display] in true order. Display is the figure as
//           the reveal prints it; value is what the verifier sorts on.
//
// AUTHORING RULES (all enforced by scripts/verify-slot.mjs):
//   * ten items at least, twelve for a subject that can carry a Sunday;
//   * values strictly monotonic in `dir`, no ties (a tie makes a slot
//     unanswerable), and on a measured subject adjacent items at least 1.5% apart so a rounding
//     difference in a source cannot flip a rank;
//   * every fact FROZEN: a completed measurement, a founding year, a retired
//     player's final total. Nothing that a news story can move. Where a figure
//     is an estimate the source says so and the spread between neighbours is
//     wide enough that the estimate cannot reorder them;
//   * US spellings, no em dashes, no answer word in the axis line.
//
// The craft is the SPREAD. A board plays best when the items span two or
// three orders of magnitude and the middle band is crowded, because the
// middle is where a blind placement breaks.

export const POOL = [
  {
    id: 'countries-population', axis: 'Countries by population', top: 'Most people', bottom: 'Fewest', unit: 'people', dir: 'desc', fam: 'geo',
    source: 'UN World Population Prospects, 2024 estimates',
    items: [
      ['India', 1451, '1.45 billion'], ['China', 1419, '1.42 billion'], ['United States', 345, '345 million'], ['Indonesia', 283, '283 million'],
      ['Pakistan', 251, '251 million'], ['Nigeria', 233, '233 million'], ['Brazil', 212, '212 million'], ['Bangladesh', 174, '174 million'],
      ['Russia', 144, '144 million'], ['Mexico', 131, '131 million'], ['Japan', 124, '124 million'], ['Philippines', 116, '116 million'],
    ],
  },
  {
    id: 'countries-area', axis: 'Countries by area', top: 'Largest', bottom: 'Smallest', unit: 'km²', dir: 'desc', fam: 'geo',
    source: 'Total area including inland water, UN Statistics Division',
    items: [
      ['Russia', 17098, '17.1 million km²'], ['Canada', 9985, '9.98 million km²'], ['Brazil', 8516, '8.52 million km²'], ['Australia', 7692, '7.69 million km²'],
      ['India', 3287, '3.29 million km²'], ['Argentina', 2780, '2.78 million km²'], ['Algeria', 2382, '2.38 million km²'], ['Mexico', 1964, '1.96 million km²'],
      ['Peru', 1285, '1.29 million km²'], ['Egypt', 1002, '1.00 million km²'],
    ],
  },
  {
    id: 'tallest-buildings', axis: 'Buildings by height', top: 'Tallest', bottom: 'Shortest', unit: 'meters', dir: 'desc', fam: 'geo',
    source: 'Architectural height, Council on Tall Buildings and Urban Habitat',
    items: [
      ['Burj Khalifa, Dubai', 828, '828 m'], ['Merdeka 118, Kuala Lumpur', 679, '679 m'], ['Shanghai Tower', 632, '632 m'], ['Makkah Royal Clock Tower', 601, '601 m'],
      ['Lotte World Tower, Seoul', 555, '555 m'], ['One World Trade Center, New York', 541, '541 m'], ['Taipei 101', 508, '508 m'], ['Petronas Tower 1, Kuala Lumpur', 452, '452 m'],
      ['Willis Tower, Chicago', 442, '442 m'], ['Empire State Building, New York', 381, '381 m'], ['Chrysler Building, New York', 319, '319 m'], ['Big Ben clock tower, London', 96, '96 m'],
    ],
  },
  {
    id: 'planets-diameter', axis: 'Bodies of the solar system by diameter', top: 'Widest', bottom: 'Narrowest', unit: 'km', dir: 'desc', fam: 'science',
    source: 'NASA planetary fact sheets, equatorial diameter',
    items: [
      ['Jupiter', 139820, '139,820 km'], ['Saturn', 116460, '116,460 km'], ['Uranus', 50724, '50,724 km'], ['Neptune', 49244, '49,244 km'],
      ['Earth', 12742, '12,742 km'], ['Venus', 12104, '12,104 km'], ['Mars', 6779, '6,779 km'], ['Mercury', 4879, '4,879 km'],
      ['The Moon', 3474, '3,474 km'], ['Pluto', 2377, '2,377 km'],
    ],
  },
  {
    id: 'rivers-length', axis: 'Rivers by length', top: 'Longest', bottom: 'Shortest', unit: 'km', dir: 'desc', fam: 'geo',
    source: 'Commonly cited lengths, main stem, Encyclopaedia Britannica',
    items: [
      ['Nile', 6650, '6,650 km'], ['Yangtze', 6300, '6,300 km'], ['Yellow River', 5464, '5,464 km'], ['Congo', 4700, '4,700 km'],
      ['Mekong', 4350, '4,350 km'], ['Niger', 4180, '4,180 km'], ['Volga', 3530, '3,530 km'], ['Danube', 2850, '2,850 km'],
      ['Ganges', 2525, '2,525 km'], ['Rhine', 1230, '1,230 km'],
    ],
  },
  {
    id: 'mountains-height', axis: 'Mountains by height', top: 'Highest', bottom: 'Lowest', unit: 'meters', dir: 'desc', fam: 'geo',
    source: 'Summit elevation above sea level',
    items: [
      ['Everest', 8849, '8,849 m'], ['K2', 8611, '8,611 m'], ['Aconcagua', 6961, '6,961 m'], ['Denali', 6190, '6,190 m'],
      ['Kilimanjaro', 5895, '5,895 m'], ['Elbrus', 5642, '5,642 m'], ['Mont Blanc', 4808, '4,808 m'], ['Mount Fuji', 3776, '3,776 m'],
      ['Mount Olympus', 2918, '2,918 m'], ['Ben Nevis', 1345, '1,345 m'],
    ],
  },
  {
    id: 'us-states-area', axis: 'US states by area', top: 'Largest', bottom: 'Smallest', unit: 'sq mi', dir: 'desc', fam: 'geo',
    source: 'Total area, US Census Bureau',
    items: [
      ['Alaska', 665384, '665,384 sq mi'], ['Texas', 268596, '268,596 sq mi'], ['California', 163695, '163,695 sq mi'], ['Montana', 147040, '147,040 sq mi'],
      ['New Mexico', 121590, '121,590 sq mi'], ['Arizona', 113990, '113,990 sq mi'], ['Colorado', 104094, '104,094 sq mi'], ['Minnesota', 86936, '86,936 sq mi'],
      ['Florida', 65758, '65,758 sq mi'], ['Pennsylvania', 46054, '46,054 sq mi'],
    ],
  },
  {
    id: 'us-states-population', axis: 'US states by population', top: 'Most people', bottom: 'Fewest', unit: 'people', dir: 'desc', fam: 'geo',
    source: 'US Census Bureau, July 2024 estimates',
    items: [
      ['California', 39.4, '39.4 million'], ['Texas', 31.3, '31.3 million'], ['Florida', 23.4, '23.4 million'], ['New York', 19.9, '19.9 million'],
      ['Pennsylvania', 13.1, '13.1 million'], ['Ohio', 11.9, '11.9 million'], ['Michigan', 10.1, '10.1 million'], ['Virginia', 8.8, '8.8 million'],
      ['Massachusetts', 7.1, '7.1 million'], ['Minnesota', 5.8, '5.8 million'],
    ],
  },
  {
    id: 'oceans-seas-area', axis: 'Oceans and seas by area', top: 'Largest', bottom: 'Smallest', unit: 'km²', dir: 'desc', fam: 'geo',
    source: 'Surface area, International Hydrographic Organization figures',
    items: [
      ['Pacific Ocean', 165.2, '165 million km²'], ['Atlantic Ocean', 106.5, '106 million km²'], ['Indian Ocean', 70.6, '70.6 million km²'], ['Southern Ocean', 20.3, '20.3 million km²'],
      ['Arctic Ocean', 14.1, '14.1 million km²'], ['South China Sea', 3.5, '3.5 million km²'], ['Caribbean Sea', 2.75, '2.75 million km²'], ['Mediterranean Sea', 2.5, '2.5 million km²'],
      ['Gulf of Mexico', 1.55, '1.55 million km²'], ['Black Sea', 0.436, '436,000 km²'],
    ],
  },
  {
    id: 'animals-speed', axis: 'Animals by top speed', top: 'Fastest', bottom: 'Slowest', unit: 'km/h', dir: 'desc', fam: 'science',
    source: 'Commonly cited top speeds on land',
    items: [
      ['Cheetah', 120, '120 km/h'], ['Pronghorn', 88, '88 km/h'], ['Lion', 80, '80 km/h'], ['Greyhound', 72, '72 km/h'],
      ['House cat', 48, '48 km/h'], ['African elephant', 40, '40 km/h'], ['Black mamba', 20, '20 km/h'], ['Chicken', 14, '14 km/h'],
      ['Three-toed sloth', 0.27, '0.27 km/h'], ['Garden snail', 0.05, '0.05 km/h'],
    ],
  },
  {
    id: 'animals-weight', axis: 'Animals by weight', top: 'Heaviest', bottom: 'Lightest', unit: 'kg', dir: 'desc', fam: 'science',
    source: 'Typical adult weight',
    items: [
      ['Blue whale', 150000, '150,000 kg'], ['African elephant', 6000, '6,000 kg'], ['White rhinoceros', 2300, '2,300 kg'], ['Hippopotamus', 1500, '1,500 kg'],
      ['Polar bear', 450, '450 kg'], ['Gorilla', 160, '160 kg'], ['Ostrich', 100, '100 kg'], ['Gray wolf', 40, '40 kg'],
      ['House cat', 4.5, '4.5 kg'], ['Hamster', 0.1, '100 g'],
    ],
  },
  {
    id: 'films-box-office', axis: 'Films by worldwide box office', top: 'Highest grossing', bottom: 'Lowest', unit: 'US dollars', dir: 'desc', fam: 'pop',
    source: 'Lifetime worldwide gross, Box Office Mojo, not adjusted for inflation',
    items: [
      ['Avatar (2009)', 2.92, '$2.92 billion'], ['Titanic (1997)', 2.26, '$2.26 billion'], ['Spider-Man: No Way Home (2021)', 1.92, '$1.92 billion'], ['Inside Out 2 (2024)', 1.70, '$1.70 billion'],
      ['Frozen II (2019)', 1.45, '$1.45 billion'], ['Minions (2015)', 1.16, '$1.16 billion'], ['Joker (2019)', 1.08, '$1.08 billion'], ['Finding Nemo (2003)', 0.94, '$940 million'],
      ['Shrek (2001)', 0.49, '$490 million'], ['Toy Story (1995)', 0.39, '$390 million'],
    ],
  },
  {
    id: 'us-cities-population', axis: 'US cities by population', top: 'Most people', bottom: 'Fewest', unit: 'people', dir: 'desc', fam: 'geo',
    source: 'City proper, US Census Bureau 2023 estimates',
    items: [
      ['New York', 8.26, '8.26 million'], ['Los Angeles', 3.82, '3.82 million'], ['Chicago', 2.66, '2.66 million'], ['Houston', 2.31, '2.31 million'],
      ['Phoenix', 1.65, '1.65 million'], ['San Diego', 1.39, '1.39 million'], ['Dallas', 1.30, '1.30 million'], ['Jacksonville', 0.99, '985,000'],
      ['Seattle', 0.76, '755,000'], ['Boston', 0.65, '653,000'],
    ],
  },
  {
    id: 'countries-gdp', axis: 'Economies by size', top: 'Largest', bottom: 'Smallest', unit: 'US dollars', dir: 'desc', fam: 'geo',
    source: 'Nominal GDP, IMF World Economic Outlook, 2024',
    items: [
      ['United States', 29.2, '$29.2 trillion'], ['China', 18.7, '$18.7 trillion'], ['Germany', 4.66, '$4.66 trillion'], ['United Kingdom', 3.64, '$3.64 trillion'],
      ['France', 3.16, '$3.16 trillion'], ['Italy', 2.37, '$2.37 trillion'], ['Australia', 1.80, '$1.80 trillion'], ['Netherlands', 1.22, '$1.22 trillion'],
      ['Switzerland', 0.94, '$940 billion'], ['Sweden', 0.61, '$610 billion'],
    ],
  },
  {
    id: 'elements-atomic-number', exact: true, axis: 'Elements by atomic number', top: 'Lowest number', bottom: 'Highest', unit: 'protons', dir: 'asc', fam: 'science',
    source: 'The periodic table',
    items: [
      ['Hydrogen', 1, '1'], ['Helium', 2, '2'], ['Carbon', 6, '6'], ['Oxygen', 8, '8'], ['Sodium', 11, '11'], ['Calcium', 20, '20'],
      ['Iron', 26, '26'], ['Copper', 29, '29'], ['Silver', 47, '47'], ['Gold', 79, '79'], ['Lead', 82, '82'], ['Uranium', 92, '92'],
    ],
  },
  {
    id: 'elements-density', axis: 'Metals by density', top: 'Densest', bottom: 'Lightest', unit: 'g/cm³', dir: 'desc', fam: 'science',
    source: 'Density at room temperature',
    items: [
      ['Osmium', 22.59, '22.59 g/cm³'], ['Platinum', 21.45, '21.45 g/cm³'], ['Gold', 19.32, '19.32 g/cm³'], ['Mercury', 13.53, '13.53 g/cm³'],
      ['Lead', 11.34, '11.34 g/cm³'], ['Silver', 10.49, '10.49 g/cm³'], ['Copper', 8.96, '8.96 g/cm³'], ['Iron', 7.87, '7.87 g/cm³'],
      ['Titanium', 4.51, '4.51 g/cm³'], ['Aluminum', 2.70, '2.70 g/cm³'], ['Magnesium', 1.74, '1.74 g/cm³'], ['Lithium', 0.53, '0.53 g/cm³'],
    ],
  },
  {
    id: 'metals-melting', axis: 'Metals by melting point', top: 'Highest', bottom: 'Lowest', unit: '°C', dir: 'desc', fam: 'science',
    source: 'Melting point at standard pressure',
    items: [
      ['Tungsten', 3422, '3,422 °C'], ['Iron', 1538, '1,538 °C'], ['Gold', 1064, '1,064 °C'], ['Silver', 962, '962 °C'],
      ['Aluminum', 660, '660 °C'], ['Lead', 327, '327 °C'], ['Tin', 232, '232 °C'], ['Sodium', 98, '98 °C'],
      ['Gallium', 30, '30 °C'], ['Mercury', -39, '-39 °C'],
    ],
  },
  {
    id: 'solar-system-distance', axis: 'Bodies of the solar system by distance from the Sun', top: 'Closest', bottom: 'Farthest', unit: 'AU', dir: 'asc', fam: 'science',
    source: 'Average distance, NASA',
    items: [
      ['Mercury', 0.39, '0.39 AU'], ['Venus', 0.72, '0.72 AU'], ['Earth', 1.0, '1.00 AU'], ['Mars', 1.52, '1.52 AU'], ['Ceres', 2.77, '2.77 AU'],
      ['Jupiter', 5.2, '5.2 AU'], ['Saturn', 9.5, '9.5 AU'], ['Uranus', 19.2, '19.2 AU'], ['Neptune', 30.1, '30.1 AU'], ['Pluto', 39.5, '39.5 AU'],
    ],
  },
  {
    id: 'inventions-year', exact: true, axis: 'Inventions by year', top: 'Earliest', bottom: 'Latest', unit: 'year', dir: 'asc', fam: 'history',
    source: 'Year of the first working demonstration or patent',
    items: [
      ['Printing press', 1440, '1440'], ['Steam engine', 1712, '1712'], ['Telephone', 1876, '1876'], ['Light bulb', 1879, '1879'], ['Radio', 1895, '1895'],
      ['Airplane', 1903, '1903'], ['Television', 1927, '1927'], ['Transistor', 1947, '1947'], ['Laser', 1960, '1960'], ['Internet (ARPANET)', 1969, '1969'],
      ['World Wide Web', 1989, '1989'], ['iPhone', 2007, '2007'],
    ],
  },
  {
    id: 'presidents-age', exact: true, axis: 'US presidents by age when first sworn in', top: 'Oldest', bottom: 'Youngest', unit: 'years', dir: 'desc', fam: 'history',
    source: 'Age on the day of the first inauguration',
    items: [
      ['Joe Biden', 78, '78'], ['Ronald Reagan', 69, '69'], ['William Henry Harrison', 68, '68'], ['Dwight Eisenhower', 62, '62'],
      ['Richard Nixon', 56, '56'], ['Abraham Lincoln', 52, '52'], ['Barack Obama', 47, '47'], ['Bill Clinton', 46, '46'],
      ['John F. Kennedy', 43, '43'], ['Theodore Roosevelt', 42, '42'],
    ],
  },
  {
    id: 'languages-speakers', axis: 'Languages by native speakers', top: 'Most speakers', bottom: 'Fewest', unit: 'people', dir: 'desc', fam: 'geo',
    source: 'First-language speakers, Ethnologue 2024',
    items: [
      ['Mandarin Chinese', 940, '940 million'], ['Spanish', 485, '485 million'], ['English', 380, '380 million'], ['Hindi', 345, '345 million'],
      ['Bengali', 237, '237 million'], ['Russian', 148, '148 million'], ['Japanese', 123, '123 million'], ['German', 76, '76 million'],
      ['Italian', 65, '65 million'], ['Dutch', 24, '24 million'],
    ],
  },
  {
    id: 'countries-coastline', axis: 'Countries by coastline', top: 'Longest', bottom: 'Shortest', unit: 'km', dir: 'desc', fam: 'geo',
    source: 'CIA World Factbook',
    items: [
      ['Canada', 202080, '202,080 km'], ['Indonesia', 54716, '54,716 km'], ['Russia', 37653, '37,653 km'], ['Philippines', 36289, '36,289 km'],
      ['Japan', 29751, '29,751 km'], ['Australia', 25760, '25,760 km'], ['United States', 19924, '19,924 km'], ['New Zealand', 15134, '15,134 km'],
      ['China', 14500, '14,500 km'], ['United Kingdom', 12429, '12,429 km'],
    ],
  },
  {
    id: 'deserts-area', axis: 'Deserts by area', top: 'Largest', bottom: 'Smallest', unit: 'km²', dir: 'desc', fam: 'geo',
    source: 'Commonly cited extents',
    items: [
      ['Antarctic', 14.2, '14.2 million km²'], ['Sahara', 9.2, '9.2 million km²'], ['Arabian', 2.33, '2.33 million km²'], ['Gobi', 1.3, '1.3 million km²'],
      ['Kalahari', 0.9, '900,000 km²'], ['Patagonian', 0.67, '670,000 km²'], ['Great Basin', 0.49, '490,000 km²'], ['Chihuahuan', 0.36, '360,000 km²'],
      ['Thar', 0.2, '200,000 km²'], ['Mojave', 0.12, '120,000 km²'],
    ],
  },
  {
    id: 'lakes-area', axis: 'Lakes by surface area', top: 'Largest', bottom: 'Smallest', unit: 'km²', dir: 'desc', fam: 'geo',
    source: 'Surface area, Encyclopaedia Britannica',
    items: [
      ['Caspian Sea', 371000, '371,000 km²'], ['Lake Superior', 82100, '82,100 km²'], ['Lake Victoria', 68870, '68,870 km²'], ['Lake Huron', 59600, '59,600 km²'],
      ['Lake Tanganyika', 32900, '32,900 km²'], ['Lake Malawi', 29600, '29,600 km²'], ['Lake Erie', 25700, '25,700 km²'], ['Lake Ontario', 18960, '18,960 km²'],
      ['Lake Titicaca', 8372, '8,372 km²'], ['Lake Tahoe', 496, '496 km²'],
    ],
  },
  {
    id: 'islands-area', axis: 'Islands by area', top: 'Largest', bottom: 'Smallest', unit: 'km²', dir: 'desc', fam: 'geo',
    source: 'Land area',
    items: [
      ['Greenland', 2130800, '2.13 million km²'], ['New Guinea', 785753, '786,000 km²'], ['Borneo', 748168, '748,000 km²'], ['Madagascar', 587041, '587,000 km²'],
      ['Baffin Island', 507451, '507,000 km²'], ['Sumatra', 443066, '443,000 km²'], ['Honshu', 225800, '226,000 km²'], ['Great Britain', 209331, '209,000 km²'],
      ['Cuba', 105806, '106,000 km²'], ['Ireland', 84421, '84,400 km²'],
    ],
  },
  {
    id: 'stadiums-capacity', axis: 'Stadiums by capacity', top: 'Biggest crowd', bottom: 'Smallest', unit: 'seats', dir: 'desc', fam: 'sport',
    source: 'Official seated capacity',
    items: [
      ['Narendra Modi Stadium, Ahmedabad', 132000, '132,000'], ['Rungrado 1st of May Stadium, Pyongyang', 114000, '114,000'], ['Michigan Stadium, Ann Arbor', 107601, '107,601'], ['Melbourne Cricket Ground', 100024, '100,024'],
      ['Wembley Stadium, London', 90000, '90,000'], ['Maracanã, Rio de Janeiro', 78838, '78,838'], ['Old Trafford, Manchester', 74310, '74,310'], ['Yankee Stadium, New York', 46537, '46,537'],
      ['Fenway Park, Boston', 37755, '37,755'], ["Lord's, London", 31100, '31,100'],
    ],
  },
  {
    id: 'nba-career-points', axis: 'Retired NBA players by career points', top: 'Most points', bottom: 'Fewest', unit: 'points', dir: 'desc', fam: 'sport',
    source: 'Regular season career totals, retired players only',
    items: [
      ['Kareem Abdul-Jabbar', 38387, '38,387'], ['Karl Malone', 36928, '36,928'], ['Kobe Bryant', 33643, '33,643'], ['Michael Jordan', 32292, '32,292'],
      ['Dirk Nowitzki', 31560, '31,560'], ["Shaquille O'Neal", 28596, '28,596'], ['Moses Malone', 27409, '27,409'], ['Tim Duncan', 26496, '26,496'],
      ['Larry Bird', 21791, '21,791'], ['Magic Johnson', 17707, '17,707'],
    ],
  },
  {
    id: 'mlb-home-runs', axis: 'Retired MLB players by career home runs', top: 'Most homers', bottom: 'Fewest', unit: 'home runs', dir: 'desc', fam: 'sport',
    source: 'Career regular season totals, retired players only',
    items: [
      ['Barry Bonds', 762, '762'], ['Babe Ruth', 714, '714'], ['Alex Rodriguez', 696, '696'], ['Willie Mays', 660, '660'],
      ['Ken Griffey Jr.', 630, '630'], ['Jim Thome', 612, '612'], ['Frank Robinson', 586, '586'], ['Mickey Mantle', 536, '536'],
      ['Ted Williams', 521, '521'], ['Jackie Robinson', 137, '137'],
    ],
  },
  {
    id: 'nfl-passing-yards', axis: 'Retired NFL quarterbacks by career passing yards', top: 'Most yards', bottom: 'Fewest', unit: 'yards', dir: 'desc', fam: 'sport',
    source: 'Regular season career totals, retired players only',
    items: [
      ['Tom Brady', 89214, '89,214'], ['Drew Brees', 80358, '80,358'], ['Peyton Manning', 71940, '71,940'], ['Philip Rivers', 63440, '63,440'],
      ['Dan Marino', 61361, '61,361'], ['Eli Manning', 57023, '57,023'], ['John Elway', 51475, '51,475'], ['Warren Moon', 49325, '49,325'],
      ['Joe Montana', 40551, '40,551'], ['Joe Namath', 27663, '27,663'],
    ],
  },
  {
    id: 'ph-scale', exact: true, axis: 'Everyday substances by acidity', top: 'Most acidic', bottom: 'Most alkaline', unit: 'pH', dir: 'asc', fam: 'science',
    source: 'Typical pH values',
    items: [
      ['Battery acid', 0.5, 'pH 0.5'], ['Lemon juice', 2.0, 'pH 2'], ['Vinegar', 2.5, 'pH 2.5'], ['Black coffee', 5.0, 'pH 5'], ['Milk', 6.5, 'pH 6.5'],
      ['Pure water', 7.0, 'pH 7'], ['Seawater', 8.0, 'pH 8'], ['Baking soda solution', 9.0, 'pH 9'], ['Household ammonia', 11.0, 'pH 11'], ['Bleach', 12.5, 'pH 12.5'],
    ],
  },
  {
    id: 'things-speed', axis: 'Things by speed', top: 'Fastest', bottom: 'Slowest', unit: 'm/s', dir: 'desc', fam: 'science',
    source: 'Typical speeds',
    items: [
      ['Light', 299792458, '300,000 km/s'], ['International Space Station', 7660, '7.66 km/s'], ['Rifle bullet', 900, '900 m/s'], ['Sound in air', 343, '343 m/s'],
      ['Airliner at cruise', 250, '250 m/s'], ['Formula 1 car, top speed', 100, '100 m/s'], ['Cheetah', 33, '33 m/s'], ['Usain Bolt, top speed', 12.4, '12.4 m/s'],
      ['Person walking', 1.4, '1.4 m/s'], ['Garden snail', 0.013, '1.3 cm/s'],
    ],
  },
  {
    id: 'temperatures', axis: 'Things by temperature', top: 'Hottest', bottom: 'Coldest', unit: '°C', dir: 'desc', fam: 'science',
    source: 'Typical figures',
    items: [
      ['Surface of the Sun', 5500, '5,500 °C'], ['Lava', 1200, '1,200 °C'], ['Kitchen oven, full', 260, '260 °C'], ['Boiling water', 100, '100 °C'], ['Hot coffee', 65, '65 °C'],
      ['Human body', 37, '37 °C'], ['Room temperature', 20, '20 °C'], ['Home freezer', -18, '-18 °C'], ['Dry ice', -78, '-78 °C'], ['Liquid nitrogen', -196, '-196 °C'],
      ['Liquid helium', -269, '-269 °C'], ['Absolute zero', -273.15, '-273.15 °C'],
    ],
  },
  {
    id: 'animals-lifespan', axis: 'Animals by lifespan', top: 'Longest lived', bottom: 'Shortest', unit: 'years', dir: 'desc', fam: 'science',
    source: 'Typical lifespan',
    items: [
      ['Greenland shark', 400, '400 years'], ['Bowhead whale', 200, '200 years'], ['Galápagos tortoise', 150, '150 years'], ['Human', 80, '80 years'],
      ['African elephant', 65, '65 years'], ['Horse', 30, '30 years'], ['Dog', 13, '13 years'], ['House mouse', 2, '2 years'],
      ['Worker honeybee', 0.12, '6 weeks'], ['Mayfly', 0.003, '1 day'],
    ],
  },
  {
    id: 'gestation', axis: 'Animals by length of pregnancy', top: 'Longest', bottom: 'Shortest', unit: 'days', dir: 'desc', fam: 'science',
    source: 'Typical gestation',
    items: [
      ['African elephant', 660, '22 months'], ['Rhinoceros', 480, '16 months'], ['Giraffe', 450, '15 months'], ['Blue whale', 345, '11.5 months'],
      ['Horse', 335, '11 months'], ['Human', 270, '9 months'], ['Dog', 63, '63 days'], ['Rabbit', 31, '31 days'],
      ['House mouse', 20, '20 days'], ['Opossum', 12, '12 days'],
    ],
  },
  {
    id: 'companies-founded', exact: true, axis: 'Companies by founding year', top: 'Oldest', bottom: 'Newest', unit: 'year', dir: 'asc', fam: 'history',
    source: 'Year founded',
    items: [
      ['Coca-Cola', 1886, '1886'], ['Ford', 1903, '1903'], ['Disney', 1923, '1923'], ["McDonald's", 1955, '1955'], ['Walmart', 1962, '1962'],
      ['Microsoft', 1975, '1975'], ['Apple', 1976, '1976'], ['Amazon', 1994, '1994'], ['Google', 1998, '1998'], ['Facebook', 2004, '2004'],
    ],
  },
  {
    id: 'novels-published', exact: true, axis: 'Novels by year published', top: 'Earliest', bottom: 'Latest', unit: 'year', dir: 'asc', fam: 'pop',
    source: 'First publication',
    items: [
      ['Don Quixote', 1605, '1605'], ['Robinson Crusoe', 1719, '1719'], ['Pride and Prejudice', 1813, '1813'], ['Oliver Twist', 1838, '1838'], ['Moby-Dick', 1851, '1851'],
      ['War and Peace', 1869, '1869'], ['Dracula', 1897, '1897'], ['The Great Gatsby', 1925, '1925'], ['The Hobbit', 1937, '1937'], ['Nineteen Eighty-Four', 1949, '1949'],
      ['To Kill a Mockingbird', 1960, '1960'], ["Harry Potter and the Philosopher's Stone", 1997, '1997'],
    ],
  },
  {
    id: 'landmarks-completed', exact: true, axis: 'Landmarks by year completed', top: 'Oldest', bottom: 'Newest', unit: 'year', dir: 'asc', fam: 'history',
    source: 'Year of completion',
    items: [
      ['Great Pyramid of Giza', -2560, '2560 BC'], ['Parthenon', -432, '432 BC'], ['Colosseum', 80, 'AD 80'], ['Hagia Sophia', 537, '537'], ['Notre-Dame de Paris', 1345, '1345'],
      ['Taj Mahal', 1653, '1653'], ['Statue of Liberty', 1886, '1886'], ['Empire State Building', 1931, '1931'], ['Sydney Opera House', 1973, '1973'], ['Burj Khalifa', 2010, '2010'],
    ],
  },
  {
    id: 'video-games-released', exact: true, axis: 'Video games by release year', top: 'Earliest', bottom: 'Latest', unit: 'year', dir: 'asc', fam: 'pop',
    source: 'First release',
    items: [
      ['Pong', 1972, '1972'], ['Pac-Man', 1980, '1980'], ['Tetris', 1984, '1984'], ['Super Mario Bros.', 1985, '1985'], ['Doom', 1993, '1993'],
      ['GoldenEye 007', 1997, '1997'], ['The Sims', 2000, '2000'], ['Wii Sports', 2006, '2006'], ['Angry Birds', 2009, '2009'], ['Fortnite', 2017, '2017'],
    ],
  },
  {
    id: 'capitals-elevation', axis: 'Capital cities by elevation', top: 'Highest', bottom: 'Lowest', unit: 'meters', dir: 'desc', fam: 'geo',
    source: 'Elevation above sea level',
    items: [
      ['La Paz', 3640, '3,640 m'], ['Quito', 2850, '2,850 m'], ['Bogotá', 2640, '2,640 m'], ['Addis Ababa', 2355, '2,355 m'],
      ['Mexico City', 2240, '2,240 m'], ['Nairobi', 1795, '1,795 m'], ['Kathmandu', 1400, '1,400 m'], ['Madrid', 667, '667 m'],
      ['Paris', 35, '35 m'], ['Amsterdam', -2, '-2 m'],
    ],
  },
  {
    id: 'us-states-admitted', exact: true, axis: 'US states by year of statehood', top: 'Earliest', bottom: 'Latest', unit: 'year', dir: 'asc', fam: 'history',
    source: 'Year admitted to the Union',
    items: [
      ['Delaware', 1787, '1787'], ['New York', 1788, '1788'], ['Vermont', 1791, '1791'], ['Ohio', 1803, '1803'], ['Louisiana', 1812, '1812'], ['Illinois', 1818, '1818'],
      ['Texas', 1845, '1845'], ['California', 1850, '1850'], ['Colorado', 1876, '1876'], ['Utah', 1896, '1896'], ['Arizona', 1912, '1912'], ['Hawaii', 1959, '1959'],
    ],
  },
  {
    id: 'deepest-points', axis: 'Bodies of water by depth', top: 'Deepest', bottom: 'Shallowest', unit: 'meters', dir: 'desc', fam: 'geo',
    source: 'Maximum depth',
    items: [
      ['Pacific Ocean (Mariana Trench)', 10935, '10,935 m'], ['Atlantic Ocean (Puerto Rico Trench)', 8376, '8,376 m'], ['Mediterranean Sea', 5267, '5,267 m'], ['Black Sea', 2212, '2,212 m'],
      ['Lake Baikal', 1642, '1,642 m'], ['Caspian Sea', 1025, '1,025 m'], ['Lake Superior', 406, '406 m'], ['Dead Sea', 304, '304 m'],
      ['Loch Ness', 230, '230 m'], ['English Channel', 174, '174 m'],
    ],
  },
  {
    id: 'population-density', axis: 'Countries by population density', top: 'Most crowded', bottom: 'Emptiest', unit: 'people per km²', dir: 'desc', fam: 'geo',
    source: 'People per square kilometer, UN 2024',
    items: [
      ['Monaco', 19000, '19,000 /km²'], ['Singapore', 8400, '8,400 /km²'], ['Bangladesh', 1330, '1,330 /km²'], ['India', 481, '481 /km²'],
      ['Japan', 330, '330 /km²'], ['United Kingdom', 280, '280 /km²'], ['China', 150, '150 /km²'], ['United States', 37, '37 /km²'],
      ['Russia', 9, '9 /km²'], ['Canada', 4, '4 /km²'],
    ],
  },
  {
    id: 'foods-calories', axis: 'Foods by calories', top: 'Most calories', bottom: 'Fewest', unit: 'kcal per 100 g', dir: 'desc', fam: 'science',
    source: 'Per 100 g, USDA FoodData Central',
    items: [
      ['Butter', 717, '717 kcal'], ['Peanuts', 567, '567 kcal'], ['Cheddar cheese', 403, '403 kcal'], ['White bread', 265, '265 kcal'],
      ['Chicken breast, cooked', 165, '165 kcal'], ['Egg', 155, '155 kcal'], ['Banana', 89, '89 kcal'], ['Apple', 52, '52 kcal'],
      ['Broccoli', 34, '34 kcal'], ['Cucumber', 15, '15 kcal'],
    ],
  },
  {
    id: 'aircraft-wingspan', axis: 'Aircraft by wingspan', top: 'Widest', bottom: 'Narrowest', unit: 'meters', dir: 'desc', fam: 'science',
    source: 'Manufacturer specifications',
    items: [
      ['Stratolaunch Roc', 117, '117 m'], ['Antonov An-225', 88, '88 m'], ['Airbus A380', 80, '80 m'], ['Boeing 747-8', 68, '68 m'],
      ['Boeing 787', 60, '60 m'], ['Douglas DC-3', 29, '29 m'], ['Concorde', 25.6, '25.6 m'], ['MQ-9 Reaper drone', 20, '20 m'],
      ['Wright Flyer', 12.3, '12.3 m'], ['F-16 Fighting Falcon', 9.96, '9.96 m'],
    ],
  },
  {
    id: 'ships-length', axis: 'Ships by length', top: 'Longest', bottom: 'Shortest', unit: 'meters', dir: 'desc', fam: 'history',
    source: 'Overall length',
    items: [
      ['Seawise Giant (supertanker)', 458, '458 m'], ['Icon of the Seas (cruise ship)', 365, '365 m'], ['USS Gerald R. Ford (carrier)', 337, '337 m'], ['RMS Titanic', 269, '269 m'],
      ['Bismarck', 251, '251 m'], ['Cutty Sark', 85, '85 m'], ['HMS Victory', 69, '69 m'], ['USS Constitution', 62, '62 m'],
      ['Mayflower', 30, '30 m'], ['Santa María', 19, '19 m'],
    ],
  },
  {
    id: 'light-travel', axis: 'How long light takes to reach Earth', top: 'Quickest', bottom: 'Longest', unit: 'time', dir: 'asc', fam: 'science',
    source: 'Light travel time, average distance',
    items: [
      ['The Moon', 1.3, '1.3 seconds'], ['The Sun', 500, '8.3 minutes'], ['Mars', 760, '12.7 minutes'], ['Jupiter', 2580, '43 minutes'], ['Saturn', 4800, '80 minutes'],
      ['Neptune', 14760, '4.1 hours'], ['Voyager 1', 82800, '23 hours'], ['Proxima Centauri', 132500000, '4.2 years'], ['Sirius', 271000000, '8.6 years'], ['Vega', 788000000, '25 years'],
      ['Polaris', 13660000000, '433 years'], ['Andromeda Galaxy', 78900000000000, '2.5 million years'],
    ],
  },
  {
    id: 'dinosaurs-length', axis: 'Dinosaurs by length', top: 'Longest', bottom: 'Shortest', unit: 'meters', dir: 'desc', fam: 'science',
    source: 'Estimated adult length, nose to tail',
    items: [
      ['Argentinosaurus', 35, '35 m'], ['Diplodocus', 26, '26 m'], ['Spinosaurus', 15, '15 m'], ['Tyrannosaurus rex', 12.5, '12.5 m'],
      ['Triceratops', 9, '9 m'], ['Ankylosaurus', 6.5, '6.5 m'], ['Pachycephalosaurus', 4.5, '4.5 m'], ['Deinonychus', 3.4, '3.4 m'],
      ['Velociraptor', 2, '2 m'], ['Compsognathus', 1, '1 m'],
    ],
  },
  {
    id: 'birds-wingspan', axis: 'Birds by wingspan', top: 'Widest', bottom: 'Narrowest', unit: 'meters', dir: 'desc', fam: 'science',
    source: 'Typical adult wingspan',
    items: [
      ['Wandering albatross', 3.5, '3.5 m'], ['Andean condor', 3.2, '3.2 m'], ['Bald eagle', 2.3, '2.3 m'], ['Snowy owl', 1.5, '1.5 m'],
      ['Red-tailed hawk', 1.3, '1.3 m'], ['Peregrine falcon', 1.0, '1.0 m'], ['Pigeon', 0.7, '70 cm'], ['American robin', 0.4, '40 cm'],
      ['House sparrow', 0.24, '24 cm'], ['Ruby-throated hummingbird', 0.1, '10 cm'],
    ],
  },
  {
    id: 'womens-suffrage', exact: true, axis: 'Countries by the year women won the vote', top: 'Earliest', bottom: 'Latest', unit: 'year', dir: 'asc', fam: 'history',
    source: 'Year of full national voting rights for women',
    items: [
      ['New Zealand', 1893, '1893'], ['Finland', 1906, '1906'], ['Norway', 1913, '1913'], ['United States', 1920, '1920'], ['United Kingdom', 1928, '1928'],
      ['Brazil', 1932, '1932'], ['France', 1944, '1944'], ['Mexico', 1953, '1953'], ['Switzerland', 1971, '1971'], ['Saudi Arabia', 2015, '2015'],
    ],
  },
  {
    id: 'empires-area', axis: 'Empires by land area at their peak', top: 'Largest', bottom: 'Smallest', unit: 'km²', dir: 'desc', fam: 'history',
    source: 'Peak territorial extent, commonly cited estimates',
    items: [
      ['British Empire', 35.5, '35.5 million km²'], ['Mongol Empire', 24.0, '24 million km²'], ['Russian Empire', 22.8, '22.8 million km²'], ['Qing dynasty', 14.7, '14.7 million km²'],
      ['Spanish Empire', 13.7, '13.7 million km²'], ['Umayyad Caliphate', 11.1, '11.1 million km²'], ['Roman Empire', 5.0, '5 million km²'], ['Byzantine Empire', 2.8, '2.8 million km²'],
      ['Inca Empire', 2.0, '2 million km²'], ['Aztec Empire', 0.22, '220,000 km²'],
    ],
  },
  {
    id: 'volcanoes-height', axis: 'Volcanoes by height', top: 'Tallest', bottom: 'Shortest', unit: 'meters', dir: 'desc', fam: 'geo',
    source: 'Summit elevation above sea level',
    items: [
      ['Ojos del Salado', 6893, '6,893 m'], ['Kilimanjaro', 5895, '5,895 m'], ['Popocatépetl', 5426, '5,426 m'], ['Mauna Loa', 4169, '4,169 m'],
      ['Mount Fuji', 3776, '3,776 m'], ['Mount Etna', 3357, '3,357 m'], ['Mount St. Helens', 2549, '2,549 m'], ['Vesuvius', 1281, '1,281 m'],
      ['Stromboli', 926, '926 m'], ['Krakatoa', 813, '813 m'],
    ],
  },
  {
    id: 'novels-length', axis: 'Novels by length', top: 'Longest', bottom: 'Shortest', unit: 'words', dir: 'desc', fam: 'pop',
    source: 'Approximate word count of the standard English text',
    items: [
      ['Les Misérables', 655000, '655,000 words'], ['War and Peace', 587000, '587,000 words'], ['Gone with the Wind', 418000, '418,000 words'], ['Middlemarch', 316000, '316,000 words'],
      ['Ulysses', 265000, '265,000 words'], ['Moby-Dick', 206000, '206,000 words'], ['Pride and Prejudice', 122000, '122,000 words'], ["Harry Potter and the Philosopher's Stone", 77000, '77,000 words'],
      ['The Great Gatsby', 47000, '47,000 words'], ['Of Mice and Men', 30000, '30,000 words'],
    ],
  },
  {
    id: 'films-runtime', axis: 'Films by running time', top: 'Longest', bottom: 'Shortest', unit: 'minutes', dir: 'desc', fam: 'pop',
    source: 'Theatrical running time',
    items: [
      ['Gone with the Wind', 238, '238 min'], ['Lawrence of Arabia', 227, '227 min'], ['The Lord of the Rings: The Return of the King', 201, '201 min'], ['Titanic', 194, '194 min'],
      ['Avengers: Endgame', 181, '181 min'], ['The Godfather', 175, '175 min'], ['Inception', 148, '148 min'], ['Jaws', 124, '124 min'],
      ['Toy Story', 81, '81 min'], ['Dumbo', 64, '64 min'],
    ],
  },
  {
    id: 'bridges-span', axis: 'Bridges by longest span', top: 'Longest span', bottom: 'Shortest', unit: 'meters', dir: 'desc', fam: 'geo',
    source: 'Main span between supports',
    items: [
      ['1915 Çanakkale Bridge, Turkey', 2023, '2,023 m'], ['Great Belt Bridge, Denmark', 1624, '1,624 m'], ['Humber Bridge, England', 1410, '1,410 m'], ['Golden Gate Bridge, San Francisco', 1280, '1,280 m'],
      ['Forth Road Bridge, Scotland', 1006, '1,006 m'], ['Brooklyn Bridge, New York', 486, '486 m'], ['Millau Viaduct, France', 342, '342 m'], ['Tower Bridge, London', 61, '61 m'],
      ['Ponte Vecchio, Florence', 30, '30 m'], ['Pont du Gard, France', 24.5, '24.5 m'],
    ],
  },
  {
    id: 'things-weight', axis: 'Things by weight', top: 'Heaviest', bottom: 'Lightest', unit: 'kg', dir: 'desc', fam: 'science',
    source: 'Typical or official figures',
    items: [
      ['Great Pyramid of Giza', 6e9, '6 million tonnes'], ['Titanic', 5.2e7, '52,000 tonnes'], ['Eiffel Tower', 1.01e7, '10,100 tonnes'], ['Boeing 747 at takeoff', 4e5, '400 tonnes'],
      ['Statue of Liberty', 2.04e5, '204 tonnes'], ['Blue whale', 1.5e5, '150 tonnes'], ['African elephant', 6000, '6 tonnes'], ['Family car', 1500, '1,500 kg'],
      ['Grand piano', 500, '500 kg'], ['Bowling ball', 7, '7 kg'], ['Basketball', 0.62, '620 g'], ['Smartphone', 0.2, '200 g'],
    ],
  },
  {
    id: 'mohs-hardness', exact: true, axis: 'Materials by hardness', top: 'Hardest', bottom: 'Softest', unit: 'Mohs', dir: 'desc', fam: 'science',
    source: 'Mohs scale of mineral hardness',
    items: [
      ['Diamond', 10, '10'], ['Sapphire', 9, '9'], ['Topaz', 8, '8'], ['Quartz', 7, '7'], ['Window glass', 5.5, '5.5'],
      ['Apatite', 5, '5'], ['Copper penny', 3.5, '3.5'], ['Fingernail', 2.5, '2.5'], ['Gypsum', 2, '2'], ['Talc', 1, '1'],
    ],
  },
  {
    id: 'statues-height', axis: 'Statues by height', top: 'Tallest', bottom: 'Shortest', unit: 'meters', dir: 'desc', fam: 'history',
    source: 'Height of the figure, without its pedestal',
    items: [
      ['Statue of Unity, India', 182, '182 m'], ['Spring Temple Buddha, China', 128, '128 m'], ['The Motherland Calls, Russia', 85, '85 m'], ['Statue of Liberty, New York', 46, '46 m'],
      ['Christ the Redeemer, Rio de Janeiro', 30, '30 m'], ['Great Sphinx of Giza', 20, '20 m'], ['Lincoln Memorial statue, Washington', 5.8, '5.8 m'], ["Michelangelo's David, Florence", 5.2, '5.2 m'],
      ['Venus de Milo, Paris', 2.0, '2.0 m'], ['Manneken Pis, Brussels', 0.61, '61 cm'],
    ],
  },
  {
    id: 'cars-introduced', exact: true, axis: 'Cars by the year they went on sale', top: 'Earliest', bottom: 'Latest', unit: 'year', dir: 'asc', fam: 'pop',
    source: 'Year of first production',
    items: [
      ['Ford Model T', 1908, '1908'], ['Volkswagen Beetle', 1938, '1938'], ['Chevrolet Corvette', 1953, '1953'], ['Mini', 1959, '1959'], ['Ford Mustang', 1964, '1964'],
      ['Honda Civic', 1972, '1972'], ['Toyota Prius', 1997, '1997'], ['Tesla Roadster', 2008, '2008'], ['Nissan Leaf', 2010, '2010'], ['Tesla Cybertruck', 2023, '2023'],
    ],
  },
  {
    id: 'paintings-year', exact: true, axis: 'Paintings by the year they were finished', top: 'Earliest', bottom: 'Latest', unit: 'year', dir: 'asc', fam: 'pop',
    source: 'Commonly cited completion date',
    items: [
      ['The Birth of Venus', 1485, '1485'], ['The Last Supper', 1498, '1498'], ['Mona Lisa', 1503, '1503'], ['The Night Watch', 1642, '1642'], ['Girl with a Pearl Earring', 1665, '1665'],
      ["Whistler's Mother", 1871, '1871'], ['The Starry Night', 1889, '1889'], ['The Scream', 1893, '1893'], ['The Kiss (Klimt)', 1908, '1908'], ['American Gothic', 1930, '1930'],
      ['Guernica', 1937, '1937'], ["Campbell's Soup Cans", 1962, '1962'],
    ],
  },
  {
    id: 'sports-leagues-founded', exact: true, axis: 'Sports leagues by founding year', top: 'Oldest', bottom: 'Newest', unit: 'year', dir: 'asc', fam: 'sport',
    source: 'Year of the first season',
    items: [
      ['Major League Baseball (National League)', 1876, '1876'], ['NCAA', 1906, '1906'], ['NHL', 1917, '1917'], ['NFL', 1920, '1920'], ['NBA', 1946, '1946'],
      ['NASCAR', 1948, '1948'], ['Bundesliga', 1963, '1963'], ['Premier League', 1992, '1992'], ['MLS', 1996, '1996'], ['Indian Premier League', 2008, '2008'],
    ],
  },
  {
    id: 'boiling-points', axis: 'Substances by boiling point', top: 'Highest', bottom: 'Lowest', unit: '°C', dir: 'desc', fam: 'science',
    source: 'Boiling point at standard pressure',
    items: [
      ['Gold', 2970, '2,970 °C'], ['Sulfur', 445, '445 °C'], ['Mercury', 357, '357 °C'], ['Water', 100, '100 °C'], ['Ethanol', 78, '78 °C'], ['Acetone', 56, '56 °C'],
      ['Ammonia', -33, '-33 °C'], ['Propane', -42, '-42 °C'], ['Oxygen', -183, '-183 °C'], ['Nitrogen', -196, '-196 °C'], ['Hydrogen', -253, '-253 °C'], ['Helium', -269, '-269 °C'],
    ],
  },
  // Added 2026-11-02 for the November restock; each subject fact-checked by a
  // reviewer that did not author it.

  {
    id: 'waterfalls-height', axis: 'Waterfalls by height', top: 'Tallest', bottom: 'Shortest', unit: 'meters', dir: 'desc', fam: 'geo',
    source: 'Total height of the falls (Kaieteur: main drop), Wikipedia',
    items: [
      ['Angel Falls, Venezuela', 979, '979 m'], ['Yosemite Falls, California', 739, '739 m'], ['Sutherland Falls, New Zealand', 580, '580 m'], ['Kaieteur Falls, Guyana', 226, '226 m'],
      ['Multnomah Falls, Oregon', 189, '189 m'], ['Victoria Falls, Zambia and Zimbabwe', 108, '108 m'], ['Iguazu Falls, Argentina and Brazil', 82, '82 m'], ['Horseshoe Falls, Niagara', 57, '57 m'],
      ['Gullfoss, Iceland', 32, '32 m'], ['Rhine Falls, Switzerland', 23, '23 m'],
    ],
  },
  {
    id: 'us-national-parks-area', axis: 'US national parks by area', top: 'Largest', bottom: 'Smallest', unit: 'acres', dir: 'desc', fam: 'geo',
    source: 'National Park Service acreage, 2023',
    items: [
      ['Wrangell-St. Elias', 8323146, '8.32 million acres'], ['Denali', 4740911, '4.74 million acres'], ['Death Valley', 3408396, '3.41 million acres'], ['Yellowstone', 2219791, '2.22 million acres'],
      ['Everglades', 1508939, '1.51 million acres'], ['Grand Canyon', 1201647, '1.20 million acres'], ['Glacier', 1013126, '1.01 million acres'], ['Yosemite', 761748, '761,748 acres'],
      ['Great Smoky Mountains', 522427, '522,427 acres'], ['Zion', 147243, '147,243 acres'], ['Acadia', 49071, '49,071 acres'], ['Gateway Arch', 193, '193 acres'],
    ],
  },
  {
    id: 'us-state-high-points', axis: 'US states by highest point', top: 'Highest summit', bottom: 'Lowest summit', unit: 'feet', dir: 'desc', fam: 'geo',
    source: 'Elevation of each state high point, USGS figures',
    items: [
      ['Alaska', 20310, '20,310 ft (Denali)'], ['California', 14505, '14,505 ft (Mount Whitney)'], ['Hawaii', 13796, '13,796 ft (Mauna Kea)'], ['Utah', 13528, '13,528 ft (Kings Peak)'],
      ['New Mexico', 13161, '13,161 ft (Wheeler Peak)'], ['Montana', 12799, '12,799 ft (Granite Peak)'], ['Oregon', 11249, '11,249 ft (Mount Hood)'], ['Texas', 8751, '8,751 ft (Guadalupe Peak)'],
      ['North Carolina', 6684, '6,684 ft (Mount Mitchell)'], ['New Hampshire', 6288, '6,288 ft (Mount Washington)'], ['New York', 5344, '5,344 ft (Mount Marcy)'], ['Florida', 345, '345 ft (Britton Hill)'],
    ],
  },
  {
    id: 'cities-latitude', axis: 'World cities by latitude', top: 'Farthest north', bottom: 'Farthest south', unit: 'degrees', dir: 'desc', fam: 'geo',
    source: 'City-center coordinates, Wikipedia',
    items: [
      ['Reykjavik', 64.14, '64.1° N'], ['Oslo', 59.91, '59.9° N'], ['London', 51.51, '51.5° N'], ['Paris', 48.86, '48.9° N'],
      ['Seattle', 47.60, '47.6° N'], ['New York', 40.71, '40.7° N'], ['Tokyo', 35.69, '35.7° N'], ['Cairo', 30.04, '30.0° N'],
      ['Miami', 25.77, '25.8° N'], ['Honolulu', 21.30, '21.3° N'], ['Singapore', 1.28, '1.3° N'], ['Sydney', -33.87, '33.9° S'],
    ],
  },
  {
    id: 'canals-length', axis: 'Canals by length', top: 'Longest', bottom: 'Shortest', unit: 'km', dir: 'desc', fam: 'geo',
    source: 'Canal length (Erie: original 1825 route), Wikipedia',
    items: [
      ['Grand Canal, China', 1776, '1,776 km'], ['Erie Canal, New York', 584, '584 km'], ['Rideau Canal, Canada', 202, '202 km'], ['Suez Canal, Egypt', 193.3, '193 km'],
      ['Kiel Canal, Germany', 98.3, '98 km'], ['Panama Canal', 82, '82 km'], ['Welland Canal, Canada', 43, '43 km'],
      ['Chesapeake and Delaware Canal', 22.5, '22.5 km'], ['Cape Cod Canal, Massachusetts', 11.9, '11.9 km'], ['Corinth Canal, Greece', 6.34, '6.3 km'],
    ],
  },
  {
    id: 'us-universities-founded', exact: true, axis: 'US universities by year founded', top: 'Oldest', bottom: 'Newest', unit: 'year', dir: 'asc', fam: 'history',
    source: 'Year of founding or charter, per each institution',
    items: [
      ['Harvard', 1636, '1636'], ['Yale', 1701, '1701'], ['Princeton', 1746, '1746'], ['Columbia', 1754, '1754'],
      ['Dartmouth', 1769, '1769'], ['Georgetown', 1789, '1789'], ['West Point', 1802, '1802'], ['University of Virginia', 1819, '1819'],
      ['MIT', 1861, '1861'], ['Cornell', 1865, '1865'], ['Johns Hopkins', 1876, '1876'], ['Stanford', 1885, '1885'],
    ],
  },
  {
    id: 'countries-independence', exact: true, axis: 'Countries by year of independence', top: 'Earliest', bottom: 'Latest', unit: 'year', dir: 'asc', fam: 'history',
    source: 'Year independence was declared or took effect',
    items: [
      ['United States', 1776, '1776'], ['Haiti', 1804, '1804'], ['Brazil', 1822, '1822'], ['Belgium', 1830, '1830'],
      ['Norway', 1905, '1905'], ['Finland', 1917, '1917'], ['Iraq', 1932, '1932'], ['India', 1947, '1947'],
      ['Israel', 1948, '1948'], ['Ghana', 1957, '1957'], ['Jamaica', 1962, '1962'], ['South Sudan', 2011, '2011'],
    ],
  },
  {
    id: 'documents-signed', exact: true, axis: 'Landmark documents by year', top: 'Earliest', bottom: 'Latest', unit: 'year', dir: 'asc', fam: 'history',
    source: 'Year signed, issued or adopted',
    items: [
      ['Magna Carta', 1215, '1215'], ['Mayflower Compact', 1620, '1620'], ['Peace of Westphalia', 1648, '1648'], ['Declaration of Independence', 1776, '1776'],
      ['US Constitution', 1787, '1787'], ['Louisiana Purchase treaty', 1803, '1803'], ['Emancipation Proclamation', 1863, '1863'], ['Treaty of Versailles', 1919, '1919'],
      ['United Nations Charter', 1945, '1945'], ['Universal Declaration of Human Rights', 1948, '1948'], ['Helsinki Accords', 1975, '1975'], ['Maastricht Treaty', 1992, '1992'],
    ],
  },
  {
    id: 'first-ascents', exact: true, axis: 'Mountains by year first climbed', top: 'Earliest', bottom: 'Latest', unit: 'year', dir: 'asc', fam: 'history',
    source: 'Year of the first recorded ascent, Encyclopaedia Britannica',
    items: [
      ['Mont Blanc', 1786, '1786'], ['Matterhorn', 1865, '1865'], ['Mount Rainier', 1870, '1870'], ['Mount Whitney', 1873, '1873'],
      ['Kilimanjaro', 1889, '1889'], ['Aconcagua', 1897, '1897'], ['Denali', 1913, '1913'], ['Annapurna', 1950, '1950'],
      ['Everest', 1953, '1953'], ['K2', 1954, '1954'], ['Kangchenjunga', 1955, '1955'], ['Vinson Massif, Antarctica', 1966, '1966'],
    ],
  },
  {
    id: 'subways-opened', exact: true, axis: 'Subway systems by year the first line opened', top: 'Earliest', bottom: 'Latest', unit: 'year', dir: 'asc', fam: 'history',
    source: 'Year the first underground line opened',
    items: [
      ['London', 1863, '1863'], ['Budapest', 1896, '1896'], ['Boston', 1897, '1897'], ['Paris', 1900, '1900'],
      ['Berlin', 1902, '1902'], ['New York', 1904, '1904'], ['Buenos Aires', 1913, '1913'], ['Tokyo', 1927, '1927'],
      ['Moscow', 1935, '1935'], ['Toronto', 1954, '1954'], ['Montreal', 1966, '1966'], ['Washington, DC', 1976, '1976'],
    ],
  },

  {
    id: 'moons-diameter', axis: 'Natural satellites by diameter', top: 'Widest', bottom: 'Narrowest', unit: 'km', dir: 'desc', fam: 'science',
    source: 'NASA JPL Solar System Dynamics, mean radius doubled',
    items: [
      ['Ganymede (Jupiter)', 5262.4, '5,262 km'], ['Titan (Saturn)', 5149.5, '5,150 km'], ['Callisto (Jupiter)', 4820.6, '4,821 km'], ['Io (Jupiter)', 3643.0, '3,643 km'],
      ["Earth's Moon", 3474.8, '3,475 km'], ['Europa (Jupiter)', 3121.6, '3,122 km'], ['Triton (Neptune)', 2705.2, '2,705 km'], ['Rhea (Saturn)', 1527.0, '1,527 km'],
      ['Charon (Pluto)', 1212.0, '1,212 km'], ['Enceladus (Saturn)', 504.2, '504 km'], ['Mimas (Saturn)', 396.4, '396 km'], ['Phobos (Mars)', 22.16, '22 km'],
    ],
  },
  {
    id: 'isotopes-half-life', axis: 'Radioactive isotopes by half-life', top: 'Longest-lived', bottom: 'Shortest-lived', unit: 'years', dir: 'desc', fam: 'science',
    source: 'Evaluated nuclear half-lives (NUBASE2020 / NNDC)',
    items: [
      ['Uranium-238', 4468000000, '4.47 billion years'], ['Uranium-235', 703800000, '704 million years'], ['Plutonium-239', 24110, '24,110 years'], ['Carbon-14', 5700, '5,700 years'],
      ['Radium-226', 1600, '1,600 years'], ['Americium-241', 432.6, '433 years'], ['Cesium-137', 30.08, '30.1 years'], ['Tritium (hydrogen-3)', 12.32, '12.3 years'],
      ['Cobalt-60', 5.2714, '5.27 years'], ['Polonium-210', 0.37886, '138 days'], ['Iodine-131', 0.021958, '8.02 days'], ['Radon-222', 0.010468, '3.82 days'],
    ],
  },
  {
    id: 'earthquakes-magnitude', exact: true, axis: 'Earthquakes by moment magnitude', top: 'Strongest', bottom: 'Weakest', unit: 'magnitude', dir: 'desc', fam: 'science',
    source: 'US Geological Survey earthquake catalog',
    items: [
      ['Chile, 1960', 9.5, 'M9.5'], ['Southern Alaska, 1964', 9.2, 'M9.2'], ['Japan (Tohoku), 2011', 9.1, 'M9.1'], ['Chile, 2010', 8.8, 'M8.8'],
      ['Mexico City (Michoacan), 1985', 8.0, 'M8.0'], ['San Francisco, 1906', 7.9, 'M7.9'], ['Nepal, 2015', 7.8, 'M7.8'], ['Ridgecrest, California, 2019', 7.1, 'M7.1'],
      ['Haiti, 2010', 7.0, 'M7.0'], ['Loma Prieta, California, 1989', 6.9, 'M6.9'], ['Northridge, California, 1994', 6.7, 'M6.7'], ['South Napa, California, 2014', 6.0, 'M6.0'],
    ],
  },
  {
    id: 'chromosome-count', exact: true, axis: 'Living things by number of chromosomes', top: 'Most', bottom: 'Fewest', unit: 'chromosomes', dir: 'desc', fam: 'science',
    source: 'Diploid chromosome number of the standard karyotype',
    items: [
      ['Dog', 78, '78'], ['Horse', 64, '64'], ['Cow', 60, '60'], ['Sheep', 54, '54'],
      ['Chimpanzee', 48, '48'], ['Human', 46, '46'], ['Rabbit', 44, '44'], ['House mouse', 40, '40'],
      ['Cat', 38, '38'], ['Corn', 20, '20'], ['Garden pea', 14, '14'], ['Fruit fly', 8, '8'],
    ],
  },
  {
    id: 'solar-day-length', axis: 'Worlds by the length of one solar day', top: 'Longest day', bottom: 'Shortest day', unit: 'hours', dir: 'desc', fam: 'science',
    source: 'NASA Planetary Fact Sheet, length of day (sunrise to sunrise)',
    items: [
      ['Mercury', 4222.6, '176 Earth days'], ['Venus', 2802.0, '117 Earth days'], ["Earth's Moon", 708.7, '29.5 Earth days'], ['Pluto', 153.3, '6.4 Earth days'],
      ['Mars', 24.7, '24.7 hours'], ['Earth', 24.0, '24.0 hours'], ['Uranus', 17.2, '17.2 hours'], ['Neptune', 16.1, '16.1 hours'],
      ['Saturn', 10.7, '10.7 hours'], ['Jupiter', 9.9, '9.9 hours'],
    ],
  },
  {
    id: 'solar-system-discovered', exact: true, axis: 'Solar system worlds by year discovered', top: 'Earliest', bottom: 'Latest', unit: 'year', dir: 'asc', fam: 'science',
    source: 'Year of discovery, NASA and IAU discovery records',
    items: [
      ['Io, moon of Jupiter', 1610, '1610'], ['Titan, moon of Saturn', 1655, '1655'], ['Uranus', 1781, '1781'], ['Enceladus, moon of Saturn', 1789, '1789'],
      ['Ceres, dwarf planet', 1801, '1801'], ['Neptune', 1846, '1846'], ['Phobos, moon of Mars', 1877, '1877'], ['Pluto', 1930, '1930'],
      ['Charon, moon of Pluto', 1978, '1978'], ['Eris, dwarf planet', 2005, '2005'],
    ],
  },
  {
    id: 'nhl-goalie-wins', axis: 'Retired NHL goaltenders by career wins', top: 'Most wins', bottom: 'Fewest', unit: 'wins', dir: 'desc', fam: 'sport',
    source: 'Regular season career totals, Hockey-Reference, retired players only',
    items: [
      ['Martin Brodeur', 691, '691'], ['Patrick Roy', 551, '551'], ['Roberto Luongo', 489, '489'], ['Henrik Lundqvist', 459, '459'],
      ['Terry Sawchuk', 445, '445'], ['Jacques Plante', 437, '437'], ['Tony Esposito', 423, '423'], ['Glenn Hall', 407, '407'],
      ['Dominik Hasek', 389, '389'], ['Pekka Rinne', 369, '369'], ['Tuukka Rask', 308, '308'], ['Ken Dryden', 258, '258'],
    ],
  },
  {
    id: 'nba-career-assists', axis: 'Retired NBA players by career assists', top: 'Most assists', bottom: 'Fewest', unit: 'assists', dir: 'desc', fam: 'sport',
    source: 'Regular season career totals, Basketball-Reference, retired players only',
    items: [
      ['John Stockton', 15806, '15,806'], ['Jason Kidd', 12091, '12,091'], ['Steve Nash', 10335, '10,335'], ['Magic Johnson', 10141, '10,141'],
      ['Oscar Robertson', 9887, '9,887'], ['Isiah Thomas', 9061, '9,061'], ['Bob Cousy', 6955, '6,955'], ['Kobe Bryant', 6306, '6,306'],
      ['Michael Jordan', 5633, '5,633'], ['Wilt Chamberlain', 4643, '4,643'], ['Tim Duncan', 4225, '4,225'], ["Shaquille O'Neal", 3026, '3,026'],
    ],
  },
  {
    id: 'mlb-career-strikeouts', axis: 'Retired MLB pitchers by career strikeouts', top: 'Most strikeouts', bottom: 'Fewest', unit: 'strikeouts', dir: 'desc', fam: 'sport',
    source: 'Regular season career totals, Baseball-Reference, retired players only',
    items: [
      ['Nolan Ryan', 5714, '5,714'], ['Randy Johnson', 4875, '4,875'], ['Roger Clemens', 4672, '4,672'], ['Steve Carlton', 4136, '4,136'],
      ['Bert Blyleven', 3701, '3,701'], ['Tom Seaver', 3640, '3,640'], ['Walter Johnson', 3509, '3,509'], ['Greg Maddux', 3371, '3,371'],
      ['Pedro Martinez', 3154, '3,154'], ['John Smoltz', 3084, '3,084'], ['Cy Young', 2803, '2,803'], ['Sandy Koufax', 2396, '2,396'],
    ],
  },
  {
    id: 'nfl-rushing-yards', axis: 'Retired NFL running backs by career rushing yards', top: 'Most yards', bottom: 'Fewest', unit: 'yards', dir: 'desc', fam: 'sport',
    source: 'Regular season career totals, Pro-Football-Reference, retired players only',
    items: [
      ['Emmitt Smith', 18355, '18,355'], ['Walter Payton', 16726, '16,726'], ['Frank Gore', 16000, '16,000'], ['Barry Sanders', 15269, '15,269'],
      ['Curtis Martin', 14101, '14,101'], ['LaDainian Tomlinson', 13684, '13,684'], ['Eric Dickerson', 13259, '13,259'], ['Tony Dorsett', 12739, '12,739'],
      ['Jim Brown', 12312, '12,312'], ['Earl Campbell', 9407, '9,407'], ['Gale Sayers', 4956, '4,956'], ['Bo Jackson', 2782, '2,782'],
    ],
  },

  {
    id: 'candy-introduced', exact: true, axis: 'Candies by year introduced', top: 'Earliest', bottom: 'Latest', unit: 'year', dir: 'asc', fam: 'pop',
    source: 'Year first sold, Wikipedia brand articles',
    items: [
      ["Hershey's Milk Chocolate Bar", 1900, '1900'], ['Life Savers', 1912, '1912'], ['Milky Way', 1923, '1923'], ["Reese's Peanut Butter Cups", 1928, '1928'],
      ['Snickers', 1930, '1930'], ['3 Musketeers', 1932, '1932'], ['Kit Kat', 1935, '1935'], ["M&M's", 1941, '1941'],
      ['Almond Joy', 1946, '1946'], ['Jolly Rancher', 1949, '1949'], ["Reese's Pieces", 1978, '1978'], ['Nerds', 1982, '1982'],
    ],
  },
  {
    id: 'toys-introduced', exact: true, axis: 'Toys by year introduced', top: 'Earliest', bottom: 'Latest', unit: 'year', dir: 'asc', fam: 'pop',
    source: 'Year first on sale, Wikipedia toy articles',
    items: [
      ['Crayola crayons', 1903, '1903'], ['View-Master', 1939, '1939'], ['Slinky', 1945, '1945'], ['Mr. Potato Head', 1952, '1952'],
      ['Hula Hoop (Wham-O)', 1958, '1958'], ['Barbie', 1959, '1959'], ['Etch A Sketch', 1960, '1960'], ['Easy-Bake Oven', 1963, '1963'],
      ['G.I. Joe', 1964, '1964'], ['Hot Wheels', 1968, '1968'], ['Teddy Ruxpin', 1985, '1985'], ['Tickle Me Elmo', 1996, '1996'],
    ],
  },
  {
    id: 'sitcoms-episodes', exact: true, axis: 'Finished sitcoms by total episodes', top: 'Most episodes', bottom: 'Fewest', unit: 'episodes', dir: 'desc', fam: 'pop',
    source: 'Episodes aired over the full original run, Wikipedia episode lists',
    items: [
      ['The Big Bang Theory', 279, '279 episodes'], ['Cheers', 275, '275 episodes'], ['Married... with Children', 259, '259 episodes'], ['M*A*S*H', 256, '256 episodes'],
      ['Modern Family', 250, '250 episodes'], ['Friends', 236, '236 episodes'], ['Everybody Loves Raymond', 210, '210 episodes'], ['The Office (US)', 201, '201 episodes'],
      ["That '70s Show", 200, '200 episodes'], ['The Fresh Prince of Bel-Air', 148, '148 episodes'], ['The Brady Bunch', 117, '117 episodes'], ["Gilligan's Island", 98, '98 episodes'],
    ],
  },
  {
    id: 'disney-animated-released', exact: true, axis: 'Disney animated features by release year', top: 'Earliest', bottom: 'Latest', unit: 'year', dir: 'asc', fam: 'pop',
    source: 'Original US release, Walt Disney Animation Studios filmography',
    items: [
      ['Snow White and the Seven Dwarfs', 1937, '1937'], ['Pinocchio', 1940, '1940'], ['Bambi', 1942, '1942'], ['Cinderella', 1950, '1950'],
      ['Peter Pan', 1953, '1953'], ['Sleeping Beauty', 1959, '1959'], ['The Jungle Book', 1967, '1967'], ['The Little Mermaid', 1989, '1989'],
      ['Aladdin', 1992, '1992'], ['The Lion King', 1994, '1994'], ['Mulan', 1998, '1998'], ['Frozen', 2013, '2013'],
    ],
  },
  {
    id: 'broadway-performances', axis: 'Closed Broadway musicals by total performances', top: 'Most performances', bottom: 'Fewest', unit: 'performances', dir: 'desc', fam: 'pop',
    source: 'Original Broadway run, The Broadway League long-run list',
    items: [
      ['The Phantom of the Opera', 13981, '13,981 performances'], ['Cats', 7485, '7,485 performances'], ['Les Misérables', 6680, '6,680 performances'], ['A Chorus Line', 6137, '6,137 performances'],
      ['Beauty and the Beast', 5461, '5,461 performances'], ['Rent', 5123, '5,123 performances'], ['Jersey Boys', 4642, '4,642 performances'], ['Miss Saigon', 4092, '4,092 performances'],
      ['Grease', 3388, '3,388 performances'], ['Fiddler on the Roof', 3242, '3,242 performances'], ['Hello, Dolly!', 2844, '2,844 performances'], ['Annie', 2377, '2,377 performances'],
    ],
  },
  {
    id: 'cereals-introduced', exact: true, axis: 'Breakfast cereals by year introduced', top: 'Earliest', bottom: 'Latest', unit: 'year', dir: 'asc', fam: 'pop',
    source: 'Year introduced, Wikipedia brand articles',
    items: [
      ['Grape-Nuts', 1897, '1897'], ['Wheaties', 1924, '1924'], ['Rice Krispies', 1928, '1928'], ['Cheerios', 1941, '1941'],
      ['Frosted Flakes', 1951, '1951'], ['Trix', 1954, '1954'], ["Cap'n Crunch", 1963, '1963'], ['Lucky Charms', 1964, '1964'],
      ['Count Chocula', 1971, '1971'], ['Cinnamon Toast Crunch', 1984, '1984'],
    ],
  },
  {
    id: 'board-games-published', exact: true, axis: 'Board games by year first published', top: 'Earliest', bottom: 'Latest', unit: 'year', dir: 'asc', fam: 'pop',
    source: 'First publication under the current name, Wikipedia game articles',
    items: [
      ['Monopoly', 1935, '1935'], ['Scrabble', 1948, '1948'], ['Candy Land', 1949, '1949'], ['Yahtzee', 1956, '1956'],
      ['Mouse Trap', 1963, '1963'], ['Operation', 1965, '1965'], ['Twister', 1966, '1966'], ['Connect Four', 1974, '1974'],
      ['Hungry Hungry Hippos', 1978, '1978'], ['Trivial Pursuit', 1981, '1981'], ['Pictionary', 1985, '1985'], ['Catan', 1995, '1995'],
    ],
  },
  {
    id: 'comic-characters-debut', exact: true, axis: 'Comic characters by year of first appearance', top: 'Earliest', bottom: 'Latest', unit: 'year', dir: 'asc', fam: 'pop',
    source: 'First appearance in print, Wikipedia character articles',
    items: [
      ['Popeye', 1929, '1929'], ['Superman', 1938, '1938'], ['Batman', 1939, '1939'], ['Wonder Woman', 1941, '1941'],
      ['Charlie Brown', 1950, '1950'], ['Fantastic Four', 1961, '1961'], ['Spider-Man', 1962, '1962'], ['X-Men', 1963, '1963'],
      ['Black Panther', 1966, '1966'], ['Wolverine', 1974, '1974'], ['Teenage Mutant Ninja Turtles', 1984, '1984'], ['Venom (Eddie Brock)', 1988, '1988'],
    ],
  },
  {
    id: 'fast-food-founded', exact: true, axis: 'Fast food chains by founding year', top: 'Oldest', bottom: 'Newest', unit: 'year', dir: 'asc', fam: 'pop',
    source: 'Year the first location opened, Wikipedia company articles',
    items: [
      ['A&W', 1919, '1919'], ['White Castle', 1921, '1921'], ['Dairy Queen', 1940, '1940'], ['In-N-Out Burger', 1948, '1948'],
      ["Dunkin'", 1950, '1950'], ['Jack in the Box', 1951, '1951'], ['Pizza Hut', 1958, '1958'], ['Taco Bell', 1962, '1962'],
      ['Subway', 1965, '1965'], ["Wendy's", 1969, '1969'], ['Popeyes', 1972, '1972'], ['Chipotle', 1993, '1993'],
    ],
  },
  {
    id: 'tv-series-premiered', exact: true, axis: 'TV series by premiere year', top: 'Earliest', bottom: 'Latest', unit: 'year', dir: 'asc', fam: 'pop',
    source: 'Original US premiere date, Wikipedia series articles',
    items: [
      ['I Love Lucy', 1951, '1951'], ['The Twilight Zone', 1959, '1959'], ['Star Trek', 1966, '1966'], ['Happy Days', 1974, '1974'],
      ['Dallas', 1978, '1978'], ['The Golden Girls', 1985, '1985'], ['Seinfeld', 1989, '1989'], ['The X-Files', 1993, '1993'],
      ['The Sopranos', 1999, '1999'], ['Lost', 2004, '2004'], ['Breaking Bad', 2008, '2008'], ['Game of Thrones', 2011, '2011'],
    ],
  },
  // ── December 2026 restock (authored 2026-11-12). Every figure is frozen: a
  //    year something happened, a definition, a regulation size, a retired
  //    measurement, or a distance computed from lib/ping-cities.js. ────────
  {
    id: 'olympic-host-cities', exact: true, axis: 'Summer Olympic host cities by the year they first hosted', top: 'Earliest', bottom: 'Latest', unit: 'year', dir: 'asc', fam: 'sport',
    source: 'Year of each city\'s first Summer Games, International Olympic Committee',
    items: [
      ['Athens', 1896, '1896'], ['Paris', 1900, '1900'], ['St. Louis', 1904, '1904'], ['London', 1908, '1908'],
      ['Stockholm', 1912, '1912'], ['Antwerp', 1920, '1920'], ['Amsterdam', 1928, '1928'], ['Los Angeles', 1932, '1932'],
      ['Berlin', 1936, '1936'], ['Helsinki', 1952, '1952'], ['Melbourne', 1956, '1956'], ['Rome', 1960, '1960'],
    ],
  },
  {
    id: 'world-cup-hosts', exact: true, axis: "Men's World Cup hosts by the year they first hosted", top: 'Earliest', bottom: 'Latest', unit: 'year', dir: 'asc', fam: 'sport',
    source: 'FIFA World Cup tournament records',
    items: [
      ['Uruguay', 1930, '1930'], ['Italy', 1934, '1934'], ['France', 1938, '1938'], ['Brazil', 1950, '1950'],
      ['Switzerland', 1954, '1954'], ['Sweden', 1958, '1958'], ['Chile', 1962, '1962'], ['England', 1966, '1966'],
      ['Mexico', 1970, '1970'], ['West Germany', 1974, '1974'], ['Argentina', 1978, '1978'], ['Spain', 1982, '1982'],
    ],
  },
  {
    id: 'ballparks-opened', exact: true, axis: 'MLB ballparks by the year they opened', top: 'Oldest', bottom: 'Newest', unit: 'year', dir: 'asc', fam: 'sport',
    source: 'Opening season of each park, MLB club histories',
    items: [
      ['Fenway Park', 1912, '1912'], ['Wrigley Field', 1914, '1914'], ['Dodger Stadium', 1962, '1962'], ['Angel Stadium', 1966, '1966'],
      ['Kauffman Stadium', 1973, '1973'], ['Oriole Park at Camden Yards', 1992, '1992'], ['Coors Field', 1995, '1995'], ['Oracle Park', 2000, '2000'],
      ['PNC Park', 2001, '2001'], ['Nationals Park', 2008, '2008'], ['Citi Field', 2009, '2009'], ['Globe Life Field', 2020, '2020'],
    ],
  },
  {
    id: 'sports-balls-diameter', axis: 'Sports balls by diameter', top: 'Biggest', bottom: 'Smallest', unit: 'cm', dir: 'desc', fam: 'sport',
    source: 'Regulation sizes from each sport\'s governing body, diameter worked out from circumference where that is the rule',
    items: [
      ['Basketball (men\'s size 7)', 24.3, '24.3 cm'], ['Soccer ball (size 5)', 22.0, '22.0 cm'], ['Volleyball', 21.0, '21.0 cm'], ['Softball (12-inch)', 9.7, '9.7 cm'],
      ['Croquet ball', 9.2, '9.2 cm'], ['Baseball', 7.4, '7.4 cm'], ['Tennis ball', 6.7, '6.7 cm'], ['Lacrosse ball', 6.3, '6.3 cm'],
      ['Pool ball', 5.7, '5.7 cm'], ['Golf ball', 4.27, '4.27 cm'], ['Table tennis ball', 4.0, '4.0 cm'],
    ],
  },
  {
    id: 'triple-crown-winners', exact: true, axis: 'Triple Crown winners by year', top: 'Earliest', bottom: 'Latest', unit: 'year', dir: 'asc', fam: 'sport',
    source: 'Year each horse won the Kentucky Derby, Preakness and Belmont Stakes',
    items: [
      ['Sir Barton', 1919, '1919'], ['Gallant Fox', 1930, '1930'], ['War Admiral', 1937, '1937'], ['Whirlaway', 1941, '1941'],
      ['Count Fleet', 1943, '1943'], ['Assault', 1946, '1946'], ['Citation', 1948, '1948'], ['Secretariat', 1973, '1973'],
      ['Seattle Slew', 1977, '1977'], ['Affirmed', 1978, '1978'], ['American Pharoah', 2015, '2015'], ['Justify', 2018, '2018'],
    ],
  },
  {
    id: 'canada-provinces-area', axis: 'Canadian provinces and territories by area', top: 'Largest', bottom: 'Smallest', unit: 'km²', dir: 'desc', fam: 'geo',
    source: 'Total area including fresh water, Statistics Canada',
    items: [
      ['Nunavut', 2093190, '2.09 million km²'], ['Quebec', 1542056, '1.54 million km²'], ['Northwest Territories', 1346106, '1.35 million km²'], ['Ontario', 1076395, '1.08 million km²'],
      ['British Columbia', 944735, '944,735 km²'], ['Alberta', 661848, '661,848 km²'], ['Saskatchewan', 651036, '651,036 km²'], ['Yukon', 482443, '482,443 km²'],
      ['Newfoundland and Labrador', 405212, '405,212 km²'], ['New Brunswick', 72908, '72,908 km²'], ['Nova Scotia', 55284, '55,284 km²'], ['Prince Edward Island', 5660, '5,660 km²'],
    ],
  },
  {
    id: 'tunnels-length', axis: 'Tunnels by length', top: 'Longest', bottom: 'Shortest', unit: 'km', dir: 'desc', fam: 'geo',
    source: 'Length of the main tunnel bore, operators\' figures',
    items: [
      ['Gotthard Base Tunnel, Switzerland', 57.1, '57.1 km'], ['Seikan Tunnel, Japan', 53.9, '53.9 km'], ['Channel Tunnel, England and France', 50.5, '50.5 km'], ['Lötschberg Base Tunnel, Switzerland', 34.6, '34.6 km'],
      ['Guadarrama Tunnel, Spain', 28.4, '28.4 km'], ['Lærdal Tunnel, Norway', 24.5, '24.5 km'], ['Simplon Tunnel, Switzerland and Italy', 19.8, '19.8 km'], ['Gotthard Road Tunnel, Switzerland', 16.9, '16.9 km'],
      ['Arlberg Road Tunnel, Austria', 14.0, '14.0 km'], ['Mont Blanc Tunnel, France and Italy', 11.6, '11.6 km'], ['Holland Tunnel, New York and New Jersey', 2.6, '2.6 km'],
    ],
  },
  {
    id: 'us-states-counties', exact: true, axis: 'US states by number of counties', top: 'Most counties', bottom: 'Fewest', unit: 'counties', dir: 'desc', fam: 'geo',
    source: 'County counts, US Census Bureau (independent cities not counted)',
    items: [
      ['Texas', 254, '254'], ['Georgia', 159, '159'], ['Kentucky', 120, '120'], ['Missouri', 114, '114'],
      ['Kansas', 105, '105'], ['Illinois', 102, '102'], ['North Carolina', 100, '100'], ['Iowa', 99, '99'],
      ['Tennessee', 95, '95'], ['Nebraska', 93, '93'], ['Indiana', 92, '92'], ['Ohio', 88, '88'],
    ],
  },
  {
    id: 'distance-from-new-york', axis: 'World cities by distance from New York', top: 'Farthest', bottom: 'Nearest', unit: 'km', dir: 'desc', fam: 'geo',
    source: 'Great-circle distance between city centers, from the coordinates in lib/ping-cities.js',
    items: [
      ['Sydney', 15989, '15,989 km'], ['Singapore', 15333, '15,333 km'], ['Johannesburg', 12840, '12,840 km'], ['Mumbai', 12538, '12,538 km'],
      ['Tokyo', 10852, '10,852 km'], ['Cairo', 9022, '9,022 km'], ['Honolulu', 7982, '7,982 km'], ['Rome', 6890, '6,890 km'],
      ['London', 5570, '5,570 km'], ['Reykjavik', 4203, '4,203 km'], ['Los Angeles', 3936, '3,936 km'], ['Chicago', 1144, '1,144 km'],
    ],
  },
  {
    id: 'us-states-coastline', axis: 'US states by length of coastline', top: 'Longest', bottom: 'Shortest', unit: 'miles', dir: 'desc', fam: 'geo',
    source: 'General coastline, NOAA, The Coastline of the United States (1975)',
    items: [
      ['Alaska', 6640, '6,640 mi'], ['Florida', 1350, '1,350 mi'], ['California', 840, '840 mi'], ['Hawaii', 750, '750 mi'],
      ['Louisiana', 397, '397 mi'], ['Texas', 367, '367 mi'], ['North Carolina', 301, '301 mi'], ['Oregon', 296, '296 mi'],
      ['Maine', 228, '228 mi'], ['Massachusetts', 192, '192 mi'], ['South Carolina', 187, '187 mi'], ['Washington', 157, '157 mi'],
    ],
  },
  {
    id: 'si-prefixes', exact: true, axis: 'Metric prefixes by size', top: 'Biggest', bottom: 'Smallest', unit: 'power of ten', dir: 'desc', fam: 'science',
    source: 'The International System of Units (SI)',
    items: [
      ['tera-', 12, '10¹²'], ['giga-', 9, '10⁹'], ['mega-', 6, '10⁶'], ['kilo-', 3, '10³'],
      ['hecto-', 2, '10²'], ['deca-', 1, '10¹'], ['deci-', -1, '10⁻¹'], ['centi-', -2, '10⁻²'],
      ['milli-', -3, '10⁻³'], ['micro-', -6, '10⁻⁶'], ['nano-', -9, '10⁻⁹'], ['pico-', -12, '10⁻¹²'],
    ],
  },
  {
    id: 'units-length', exact: true, axis: 'Units of length by size', top: 'Longest', bottom: 'Shortest', unit: 'meters', dir: 'desc', fam: 'science',
    source: 'Definitions in meters, NIST Handbook 44 (league taken as three statute miles)',
    items: [
      ['League', 4828.032, '4,828 m'], ['Nautical mile', 1852, '1,852 m'], ['Mile', 1609.344, '1,609 m'], ['Kilometer', 1000, '1,000 m'],
      ['Furlong', 201.168, '201 m'], ['Chain', 20.1168, '20.1 m'], ['Rod', 5.0292, '5.03 m'], ['Fathom', 1.8288, '1.83 m'],
      ['Meter', 1, '1 m'], ['Yard', 0.9144, '0.914 m'], ['Foot', 0.3048, '0.305 m'], ['Inch', 0.0254, '2.54 cm'],
    ],
  },
  {
    id: 'units-volume', exact: true, axis: 'US units of volume by size', top: 'Biggest', bottom: 'Smallest', unit: 'liters', dir: 'desc', fam: 'science',
    source: 'US customary definitions, NIST Handbook 44 (oil barrel of 42 gallons)',
    items: [
      ['Oil barrel', 158.987, '159 L'], ['Bushel', 35.239, '35.2 L'], ['Peck', 8.81, '8.81 L'], ['Gallon', 3.785, '3.79 L'],
      ['Quart', 0.9464, '0.946 L'], ['Pint', 0.4732, '473 mL'], ['Cup', 0.2366, '237 mL'],
      ['Fluid ounce', 0.02957, '29.6 mL'], ['Tablespoon', 0.01479, '14.8 mL'], ['Teaspoon', 0.00493, '4.93 mL'], ['Fluid dram', 0.003697, '3.70 mL'],
    ],
  },
  {
    id: 'number-names', exact: true, axis: 'Big numbers by how many zeros they have', top: 'Most zeros', bottom: 'Fewest', unit: 'zeros', dir: 'desc', fam: 'science',
    source: 'US short-scale names',
    items: [
      ['Googol', 100, '100 zeros'], ['Vigintillion', 63, '63 zeros'], ['Decillion', 33, '33 zeros'], ['Nonillion', 30, '30 zeros'],
      ['Octillion', 27, '27 zeros'], ['Septillion', 24, '24 zeros'], ['Sextillion', 21, '21 zeros'], ['Quintillion', 18, '18 zeros'],
      ['Quadrillion', 15, '15 zeros'], ['Trillion', 12, '12 zeros'], ['Billion', 9, '9 zeros'], ['Million', 6, '6 zeros'],
    ],
  },
  {
    id: 'peppers-heat', axis: 'Peppers by heat', top: 'Hottest', bottom: 'Mildest', unit: 'Scoville units', dir: 'desc', fam: 'science',
    source: 'Top of each pepper\'s published Scoville range',
    items: [
      ['Pure capsaicin', 16000000, '16,000,000 SHU'], ['Carolina Reaper', 2200000, '2,200,000 SHU'], ['Ghost pepper', 1041427, '1,041,427 SHU'], ['Habanero', 350000, '350,000 SHU'],
      ["Thai bird's eye chili", 100000, '100,000 SHU'], ['Cayenne', 50000, '50,000 SHU'], ['Serrano', 23000, '23,000 SHU'], ['Jalapeño', 8000, '8,000 SHU'],
      ['Poblano', 1500, '1,500 SHU'], ['Banana pepper', 500, '500 SHU'], ['Bell pepper', 0, '0 SHU'],
    ],
  },
  {
    id: 'liquids-density', axis: 'Liquids by density', top: 'Densest', bottom: 'Lightest', unit: 'g/cm³', dir: 'desc', fam: 'science',
    source: 'Density near room temperature (liquid hydrogen at its boiling point)',
    items: [
      ['Mercury', 13.53, '13.53 g/cm³'], ['Bromine', 3.10, '3.10 g/cm³'], ['Sulfuric acid', 1.83, '1.83 g/cm³'], ['Honey', 1.42, 'about 1.42 g/cm³'],
      ['Glycerol', 1.26, '1.26 g/cm³'], ['Seawater', 1.025, '1.025 g/cm³'], ['Water', 1.000, '1.000 g/cm³'], ['Olive oil', 0.91, '0.91 g/cm³'],
      ['Ethanol', 0.789, '0.789 g/cm³'], ['Liquid hydrogen', 0.071, '0.071 g/cm³'],
    ],
  },
  {
    id: 'monarchs-reign', exact: true, axis: 'Monarchs by length of reign', top: 'Longest', bottom: 'Shortest', unit: 'years', dir: 'desc', fam: 'history',
    source: 'Whole years on the throne, rounded down',
    items: [
      ['Louis XIV of France', 72, '72 years'], ['Elizabeth II', 70, '70 years'], ['Franz Joseph I of Austria', 67, '67 years'], ['Queen Victoria', 63, '63 years'],
      ['Hirohito of Japan', 62, '62 years'], ['The Kangxi Emperor of China', 61, '61 years'], ['George III', 59, '59 years'], ['Henry III of England', 56, '56 years'],
      ['Edward III of England', 50, '50 years'], ['Elizabeth I', 44, '44 years'], ['Augustus of Rome', 40, '40 years'], ['Henry VIII', 37, '37 years'],
    ],
  },
  {
    id: 'space-firsts', exact: true, axis: 'Space milestones by year', top: 'Earliest', bottom: 'Latest', unit: 'year', dir: 'asc', fam: 'history',
    source: 'Launch or landing year, NASA and Roscosmos histories',
    items: [
      ['Sputnik 1 reaches orbit', 1957, '1957'], ['Yuri Gagarin flies to space', 1961, '1961'], ['John Glenn orbits Earth', 1962, '1962'], ['First spacewalk', 1965, '1965'],
      ['Apollo 11 lands on the Moon', 1969, '1969'], ['Skylab launches', 1973, '1973'], ['Voyager 1 launches', 1977, '1977'], ['Mir space station launches', 1986, '1986'],
      ['Hubble Space Telescope launches', 1990, '1990'], ['First International Space Station module', 1998, '1998'], ['Curiosity rover lands on Mars', 2012, '2012'], ['James Webb Space Telescope launches', 2021, '2021'],
    ],
  },
  {
    id: 'aircraft-first-flight', exact: true, axis: 'Aircraft by year of first flight', top: 'Earliest', bottom: 'Latest', unit: 'year', dir: 'asc', fam: 'history',
    source: 'Year of the first flight of the type',
    items: [
      ['Wright Flyer', 1903, '1903'], ['Spirit of St. Louis', 1927, '1927'], ['Douglas DC-3', 1935, '1935'], ['Supermarine Spitfire', 1936, '1936'],
      ['Boeing B-29 Superfortress', 1942, '1942'], ['Boeing 707', 1957, '1957'], ['Lockheed SR-71 Blackbird', 1964, '1964'], ['Boeing 747', 1969, '1969'],
      ['Airbus A320', 1987, '1987'], ['Boeing 777', 1994, '1994'], ['Airbus A380', 2005, '2005'], ['Boeing 787 Dreamliner', 2009, '2009'],
    ],
  },
  {
    id: 'presidents-born', exact: true, axis: 'US presidents by year of birth', top: 'Earliest', bottom: 'Latest', unit: 'year', dir: 'asc', fam: 'history',
    source: 'Year of birth, National Archives',
    items: [
      ['George Washington', 1732, '1732'], ['Thomas Jefferson', 1743, '1743'], ['Abraham Lincoln', 1809, '1809'], ['Ulysses S. Grant', 1822, '1822'],
      ['Theodore Roosevelt', 1858, '1858'], ['Franklin D. Roosevelt', 1882, '1882'], ['Dwight Eisenhower', 1890, '1890'], ['Ronald Reagan', 1911, '1911'],
      ['John F. Kennedy', 1917, '1917'], ['Jimmy Carter', 1924, '1924'], ['Bill Clinton', 1946, '1946'], ['Barack Obama', 1961, '1961'],
    ],
  },
  {
    id: 'discoveries-year', exact: true, axis: 'Scientific discoveries by year', top: 'Earliest', bottom: 'Latest', unit: 'year', dir: 'asc', fam: 'history',
    source: 'Year of the discovery or its first publication',
    items: [
      ["Newton's laws of motion", 1687, '1687'], ['Oxygen', 1774, '1774'], ['Smallpox vaccine', 1796, '1796'], ['Evolution by natural selection', 1859, '1859'],
      ['The periodic table', 1869, '1869'], ['X-rays', 1895, '1895'], ['The electron', 1897, '1897'], ['Special relativity', 1905, '1905'],
      ['Penicillin', 1928, '1928'], ['The structure of DNA', 1953, '1953'], ['A planet around a sun-like star', 1995, '1995'], ['The Higgs boson', 2012, '2012'],
    ],
  },
  {
    id: 'speeches-year', exact: true, axis: 'Famous speeches by year', top: 'Earliest', bottom: 'Latest', unit: 'year', dir: 'asc', fam: 'history',
    source: 'Year each speech was delivered or published',
    items: [
      ['"Give me liberty, or give me death!" (Patrick Henry)', 1775, '1775'], ["Washington's Farewell Address", 1796, '1796'], ['"Ain\'t I a Woman?" (Sojourner Truth)', 1851, '1851'], ['The Gettysburg Address', 1863, '1863'],
      ["Lincoln's second inaugural", 1865, '1865'], ['"We shall fight on the beaches" (Churchill)', 1940, '1940'], ['"A date which will live in infamy" (FDR)', 1941, '1941'], ['"Ask not what your country can do for you" (JFK)', 1961, '1961'],
      ['"I Have a Dream" (Martin Luther King Jr.)', 1963, '1963'], ['"I am prepared to die" (Nelson Mandela)', 1964, '1964'], ['"Tear down this wall!" (Reagan)', 1987, '1987'],
    ],
  },
  {
    id: 'pixar-released', exact: true, axis: 'Pixar films by release year', top: 'Earliest', bottom: 'Latest', unit: 'year', dir: 'asc', fam: 'pop',
    source: 'US theatrical release year',
    items: [
      ['Toy Story', 1995, '1995'], ["A Bug's Life", 1998, '1998'], ['Toy Story 2', 1999, '1999'], ['Monsters, Inc.', 2001, '2001'],
      ['Finding Nemo', 2003, '2003'], ['The Incredibles', 2004, '2004'], ['Cars', 2006, '2006'], ['Ratatouille', 2007, '2007'],
      ['WALL-E', 2008, '2008'], ['Up', 2009, '2009'], ['Toy Story 3', 2010, '2010'], ['Brave', 2012, '2012'],
    ],
  },
  {
    id: 'star-wars-released', exact: true, axis: 'Star Wars films by release year', top: 'Earliest', bottom: 'Latest', unit: 'year', dir: 'asc', fam: 'pop',
    source: 'US theatrical release year',
    items: [
      ['A New Hope', 1977, '1977'], ['The Empire Strikes Back', 1980, '1980'], ['Return of the Jedi', 1983, '1983'], ['The Phantom Menace', 1999, '1999'],
      ['Attack of the Clones', 2002, '2002'], ['Revenge of the Sith', 2005, '2005'], ['The Force Awakens', 2015, '2015'], ['Rogue One', 2016, '2016'],
      ['The Last Jedi', 2017, '2017'], ['Solo', 2018, '2018'], ['The Rise of Skywalker', 2019, '2019'],
    ],
  },
  {
    id: 'musicals-opened', exact: true, axis: 'Broadway musicals by the year they opened', top: 'Earliest', bottom: 'Latest', unit: 'year', dir: 'asc', fam: 'pop',
    source: 'Year of the original Broadway opening, Internet Broadway Database',
    items: [
      ['Oklahoma!', 1943, '1943'], ['South Pacific', 1949, '1949'], ['West Side Story', 1957, '1957'], ['The Sound of Music', 1959, '1959'],
      ['Fiddler on the Roof', 1964, '1964'], ['A Chorus Line', 1975, '1975'], ['Cats', 1982, '1982'], ['Les Misérables', 1987, '1987'],
      ['The Phantom of the Opera', 1988, '1988'], ['Rent', 1996, '1996'], ['Wicked', 2003, '2003'], ['Hamilton', 2015, '2015'],
    ],
  },
  {
    id: 'consoles-released', exact: true, axis: 'Game consoles by North American release year', top: 'Earliest', bottom: 'Latest', unit: 'year', dir: 'asc', fam: 'pop',
    source: 'Year of the North American launch',
    items: [
      ['Atari 2600', 1977, '1977'], ['Nintendo Entertainment System', 1985, '1985'], ['Game Boy', 1989, '1989'], ['Super Nintendo', 1991, '1991'],
      ['PlayStation', 1995, '1995'], ['Nintendo 64', 1996, '1996'], ['Dreamcast', 1999, '1999'], ['PlayStation 2', 2000, '2000'],
      ['Xbox', 2001, '2001'], ['Xbox 360', 2005, '2005'], ['Wii', 2006, '2006'], ['Nintendo Switch', 2017, '2017'],
    ],
  },
  {
    id: 'songs-released', exact: true, axis: 'Hit songs by year released', top: 'Earliest', bottom: 'Latest', unit: 'year', dir: 'asc', fam: 'pop',
    source: 'Year the single was first released',
    items: [
      ['"Hound Dog" (Elvis Presley)', 1956, '1956'], ['"I Want to Hold Your Hand" (The Beatles)', 1963, '1963'], ['"Like a Rolling Stone" (Bob Dylan)', 1965, '1965'], ['"Respect" (Aretha Franklin)', 1967, '1967'],
      ['"Bohemian Rhapsody" (Queen)', 1975, '1975'], ['"Stayin\' Alive" (Bee Gees)', 1977, '1977'], ['"Like a Prayer" (Madonna)', 1989, '1989'], ['"Smells Like Teen Spirit" (Nirvana)', 1991, '1991'],
      ['"Wannabe" (Spice Girls)', 1996, '1996'], ['"Crazy in Love" (Beyoncé)', 2003, '2003'], ['"Rolling in the Deep" (Adele)', 2010, '2010'], ['"Uptown Funk" (Mark Ronson and Bruno Mars)', 2014, '2014'],
    ],
  },
  {
    id: 'magazines-founded', exact: true, axis: 'Magazines by year of first issue', top: 'Oldest', bottom: 'Newest', unit: 'year', dir: 'asc', fam: 'pop',
    source: 'Year of the first issue',
    items: [
      ["Harper's", 1850, '1850'], ['The Atlantic', 1857, '1857'], ['National Geographic', 1888, '1888'], ['Vogue', 1892, '1892'],
      ["Reader's Digest", 1922, '1922'], ['Time', 1923, '1923'], ['The New Yorker', 1925, '1925'], ['Newsweek', 1933, '1933'],
      ['Sports Illustrated', 1954, '1954'], ['Rolling Stone', 1967, '1967'], ['People', 1974, '1974'], ['Wired', 1993, '1993'],
    ],
  },
];
