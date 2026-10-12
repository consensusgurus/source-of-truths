// Item pools for scripts/gen-bracket.mjs. Used ONLY by the Bracket generator.
//
// Every value here is a FROZEN measurement: geography, completed census counts,
// structures, finished box office runs, and the FINAL career totals of RETIRED
// players. Nothing on a live career, a current ranking, a live capacity or a
// population estimate that moves year to year. If a figure was doubtful the item
// was left out rather than guessed. Values reused from the live bank keep the
// bank's own figure so the same thing never reads two ways on two days.
//
// RECOGNIZABLE NAMES ONLY (owner ruling 2026-10-12). Bracket is a guessing game
// about things the player has heard of. A board of Kongur Tagh, Gangkhar Puensum
// and Gyachung Kang is not hard, it is unplayable: nobody can reason about a name
// they have never seen. So every pool holds only names a general US player would
// recognize, and a topic that cannot fill sixteen slots with famous things is
// retired rather than padded (towers, volcanoes, state high points and bridge
// spans went 2026-10-12; their best-known members moved into TALLER_BANK).
// Curated with English Wikipedia pageviews as a floor and judgment on top.
// scripts/verify-bracket.mjs fails any board from 2026-10-14 on that carries a
// name that is not in one of these pools, so this file IS the allowlist.
//
// A pool entry is [name, value]. Values within one pool never tie, because a tie
// would make a matchup unanswerable (the generator re-checks per board anyway).

// ---- area, km2 --------------------------------------------------------------
export const COUNTRY_AREA = [
  ['Russia', 17098246], ['Canada', 9984670], ['China', 9596961], ['Brazil', 8515767],
  ['India', 3287263], ['Argentina', 2780400], ['Kazakhstan', 2724900], ['Algeria', 2381741],
  ['Democratic Republic of the Congo', 2344858], ['Saudi Arabia', 2149690], ['Indonesia', 1904570],
  ['Sudan', 1886068], ['Libya', 1759540], ['Iran', 1648195], ['Mongolia', 1564116],
  ['Peru', 1285216], ['Chad', 1284000], ['Niger', 1267000], ['Angola', 1246700], ['Mali', 1240192],
  ['South Africa', 1221037], ['Colombia', 1141748], ['Ethiopia', 1104300], ['Bolivia', 1098581],
  ['Mauritania', 1030700], ['Tanzania', 947303], ['Nigeria', 923768], ['Namibia', 825615],
  ['Mozambique', 801590], ['Turkey', 783562], ['Chile', 756102], ['Zambia', 752612],
  ['Myanmar', 676578], ['Afghanistan', 652230], ['Somalia', 637657], ['Central African Republic', 622984],
  ['Ukraine', 603550], ['Madagascar', 587041], ['Botswana', 581730], ['Kenya', 580367],
  ['Yemen', 527968], ['Thailand', 513120], ['Spain', 505990], ['Turkmenistan', 488100],
  ['Cameroon', 475442], ['Papua New Guinea', 462840], ['Sweden', 450295], ['Uzbekistan', 448978],
  ['Iraq', 438317], ['Paraguay', 406752], ['Zimbabwe', 390757], ['Japan', 377975],
  ['Germany', 357588], ['Finland', 338455], ['Vietnam', 331212], ['Malaysia', 330803],
  ['Poland', 312696], ['Oman', 309500], ['Italy', 301340], ['Burkina Faso', 274200],
  ['Gabon', 267668], ['Guinea', 245857], ['United Kingdom', 242495], ['Uganda', 241038],
  ['Ghana', 238533], ['Romania', 238397], ['Laos', 236800], ['Guyana', 214969],
  ['Belarus', 207600], ['Kyrgyzstan', 199951], ['Senegal', 196722], ['Syria', 185180],
  ['Cambodia', 181035], ['Uruguay', 176215], ['Tunisia', 163610], ['Bangladesh', 147570],
  ['Tajikistan', 143100], ['Greece', 131957], ['Nicaragua', 130373], ['North Korea', 120538],
  ['Malawi', 118484], ['Benin', 114763], ['Honduras', 112492], ['Liberia', 111369],
  ['Cuba', 109884], ['Guatemala', 108889], ['Iceland', 103000], ['South Korea', 100210],
  ['Hungary', 93028], ['Portugal', 92212], ['Jordan', 89342], ['Austria', 83871],
  ['Czech Republic', 78871], ['Panama', 75417], ['Ireland', 70273], ['Sri Lanka', 65610],
  ['Lithuania', 65300], ['Latvia', 64589], ['Croatia', 56594], ['Costa Rica', 51100],
  ['Slovakia', 49035], ['Estonia', 45339], ['Denmark', 43094], ['Switzerland', 41285],
  ['Bhutan', 38394], ['Belgium', 30528], ['Armenia', 29743],
];

// Small countries, for the "which is SMALLER" board (dir min).
export const SMALL_COUNTRY_AREA = [
  ['Nauru', 21], ['Tuvalu', 26], ['San Marino', 61], ['Liechtenstein', 160],
  ['Marshall Islands', 181], ['Saint Kitts and Nevis', 261], ['Maldives', 298], ['Malta', 316],
  ['Grenada', 344], ['Saint Vincent and the Grenadines', 389], ['Barbados', 430],
  ['Antigua and Barbuda', 442], ['Andorra', 468], ['Saint Lucia', 617], ['Micronesia', 702],
  ['Tonga', 747], ['Dominica', 751], ['Kiribati', 811], ['Sao Tome and Principe', 964],
  ['Mauritius', 2040], ['Luxembourg', 2586], ['Samoa', 2842], ['Cape Verde', 4033],
  ['Trinidad and Tobago', 5128], ['Brunei', 5765], ['Cyprus', 9251], ['Lebanon', 10452],
  ['Jamaica', 10991], ['Qatar', 11586], ['Montenegro', 13812], ['Bahamas', 13943],
  ['Eswatini', 17364], ['Kuwait', 17818], ['Fiji', 18274], ['Slovenia', 20273],
  ['El Salvador', 21041], ['Belize', 22966], ['Djibouti', 23200], ['North Macedonia', 25713],
  ['Rwanda', 26338], ['Haiti', 27750], ['Albania', 28748],
];

// Islands everyone has heard of. New figures (New Guinea, Borneo, Madagascar,
// Honshu, Sicily, Sardinia, Crete, Corsica, Long Island, Maui, Isle of Man,
// Martha's Vineyard) from Wikidata, 2026-10-12. Islands that are also a country
// with outlying territory (Cuba, Iceland, Sri Lanka, Puerto Rico) are left out,
// since island and country areas differ.
export const ISLAND_AREA = [
  ['Greenland', 2166086], ['New Guinea', 785753], ['Borneo', 748168], ['Madagascar', 587295],
  ['Baffin Island', 507451], ['Sumatra', 473481], ['Honshu', 227940], ['Great Britain', 209331],
  ['South Island', 150437], ['Java', 128297], ['North Island', 113729], ['Luzon', 109965],
  ['Newfoundland', 108860], ['Ireland', 84421], ['Hokkaido', 77984], ['Hispaniola', 77900],
  ['Tasmania', 68401], ['Taiwan Island', 35883], ['Vancouver Island', 32134], ['Sicily', 25711],
  ['Sardinia', 23949], ['Jamaica', 10991], ['Kodiak Island', 9311], ['Cyprus', 9234],
  ['Corsica', 8680], ['Crete', 8336], ['Bali', 5633], ['Long Island', 3566], ['Maui', 1883],
  ['Isle of Man', 572], ['Martha\'s Vineyard', 227],
];

// Lakes everyone has heard of. Seasonal, shrinking and reservoir lakes (Eyre,
// Great Salt Lake, Dead Sea, Mead, Powell) are left out. Okeechobee and
// Winnipesaukee from Wikidata, 2026-10-12.
export const LAKE_AREA = [
  ['Lake Superior', 82350], ['Lake Victoria', 68100], ['Lake Huron', 59600],
  ['Lake Michigan', 57750], ['Lake Tanganyika', 32900], ['Lake Baikal', 31722],
  ['Great Bear Lake', 31153], ['Lake Malawi', 29600], ['Great Slave Lake', 27200],
  ['Lake Erie', 25744], ['Lake Winnipeg', 24400], ['Lake Ontario', 18960],
  ['Lake Titicaca', 8562], ['Lake Nicaragua', 8264], ['Lake Okeechobee', 1890],
  ['Lake Champlain', 1269], ['Lake Geneva', 580], ['Lake Constance', 536], ['Lake Tahoe', 497],
  ['Lake Garda', 370], ['Lake Maggiore', 212], ['Lake Winnipesaukee', 185], ['Lake Como', 146],
  ['Lake Lucerne', 114], ['Loch Ness', 56], ['Crater Lake', 53],
];

// US states by TOTAL area, water included (Census); the question says so, since
// by land area some neighbors (Missouri, Oklahoma) swap order. Alaska, Texas, California and Montana keep the
// live bank's own figures.
export const STATE_AREA = [
  ['Alaska', 1717856], ['Texas', 696241], ['California', 423970], ['Montana', 381154],
  ['New Mexico', 314917], ['Arizona', 295234], ['Nevada', 286380], ['Colorado', 269601],
  ['Oregon', 254799], ['Wyoming', 253335], ['Michigan', 250487], ['Minnesota', 225163],
  ['Utah', 219882], ['Idaho', 216443], ['Kansas', 213100], ['Nebraska', 200330],
  ['South Dakota', 199729], ['Washington', 184661], ['North Dakota', 183108], ['Oklahoma', 181037],
  ['Missouri', 180540], ['Florida', 170312], ['Wisconsin', 169635], ['Georgia', 153910],
  ['Illinois', 149995], ['Iowa', 145746], ['New York', 141297], ['North Carolina', 139391],
  ['Arkansas', 137732], ['Alabama', 135767], ['Louisiana', 135659], ['Mississippi', 125438],
  ['Pennsylvania', 119280], ['Ohio', 116098], ['Virginia', 110787], ['Tennessee', 109153],
  ['Kentucky', 104656], ['Indiana', 94326], ['Maine', 91633], ['South Carolina', 82933],
  ['West Virginia', 62756], ['Maryland', 32131], ['Hawaii', 28313], ['Massachusetts', 27336],
  ['Vermont', 24906], ['New Hampshire', 24214], ['New Jersey', 22591], ['Connecticut', 14357],
  ['Delaware', 6446], ['Rhode Island', 4001],
];

// ---- height, m ----------------------------------------------------------------
// "Which is TALLER?": famous mountains (summit elevation) and famous structures
// (structural height). The Himalayan 8,000ers past K2 and the Caucasus and Pamir
// peaks were cut 2026-10-12. New figures (Matterhorn, Pikes Peak, Grand Teton,
// Olympus, Half Dome, Kosciuszko, Ben Nevis, Table Mountain, Tokyo Skytree,
// Woolworth, Trump Tower, St. Peter's, Taj Mahal, Tower Bridge, Arc de Triomphe,
// Brandenburg Gate) from Wikidata, 2026-10-12. Statue of Liberty and the Great
// Pyramid are left out: both have two common heights.
export const TALLER_BANK = [
  ['Mount Everest', 8850], ['K2', 8611], ['Aconcagua', 6962], ['Denali', 6190],
  ['Kilimanjaro', 5895], ['Mount Elbrus', 5642], ['Mount Kenya', 5199], ['Mount Ararat', 5137],
  ['Mont Blanc', 4810], ['Matterhorn', 4478], ['Mount Whitney', 4421], ['Mount Rainier', 4392],
  ['Pikes Peak', 4302], ['Mauna Kea', 4207], ['Grand Teton', 4199], ['Mount Fuji', 3776],
  ['Mount Hood', 3429], ['Mount Olympus', 2918], ['Half Dome', 2693], ['Mount St. Helens', 2549],
  ['Mount Kosciuszko', 2228], ['Mount Mitchell', 2037], ['Mount Washington', 1917],
  ['Ben Nevis', 1345], ['Mount Vesuvius', 1281], ['Table Mountain', 1085],
  ['Burj Khalifa', 830], ['Tokyo Skytree', 634], ['CN Tower', 553], ['One World Trade Center', 546],
  ['Taipei 101', 508], ['Petronas Towers', 452], ['Empire State Building', 443],
  ['John Hancock Center', 344], ['Eiffel Tower', 324], ['Chrysler Building', 319],
  ['Transamerica Pyramid', 260], ['Woolworth Building', 241], ['Golden Gate Bridge', 227],
  ['Trump Tower', 202], ['Gateway Arch', 192], ['Space Needle', 184], ['Sagrada Familia', 173],
  ['Washington Monument', 169], ['St. Peter\'s Basilica', 137], ['London Eye', 135],
  ['Saturn V', 111], ['Atomium', 102], ['Big Ben', 96], ['Flatiron Building', 94],
  ['Taj Mahal', 73], ['Notre-Dame de Paris', 69], ['Tower Bridge', 65],
  ['Leaning Tower of Pisa', 58], ['Arc de Triomphe', 50], ['Colosseum', 48],
  ['Christ the Redeemer', 30], ['Brandenburg Gate', 26],
];

// ---- length, km ---------------------------------------------------------------
// The live bank's river pool, minus every river whose length depends on which
// system it is measured as (Mississippi and Missouri, Ob and Irtysh, Yenisey,
// Amur-Argun, Brahmaputra) or whose figure varies widely by source (Purus,
// Jurua, Japura, Sao Francisco). The Amazon is out too: whether it or the
// Nile is longer is the best-known dispute in the field. Blue Nile corrected
// to the common reference figure (fact-check 2026-09-24). Cut 2026-10-12 as
// unrecognizable: Lena, Parana, Salween, Fraser, Vilyuy, Paraguay, Pearl, Rio
// Negro, Tarim, Vitim, Pechora, Kama, Uruguay, Angara, Nizhnyaya Tunguska, Blue
// Nile, Limpopo, Po. Added from Wikidata: Euphrates, Snake, Tennessee, Delaware,
// Tiber, Jordan.
export const RIVER = [
  ['Nile', 6650], ['Yangtze River', 6300], ['Yellow River', 5464], ['River Congo', 4700],
  ['Mekong River', 4350], ['Niger River', 4180], ['Volga', 3530], ['Yukon River', 3190],
  ['Indus River', 3180], ['St. Lawrence River', 3058], ['Rio Grande', 3051], ['Danube', 2850],
  ['Euphrates', 2800], ['Zambezi', 2574], ['Ganges', 2525], ['Murray River', 2508],
  ['Arkansas River', 2364], ['Colorado River', 2330], ['Dnieper', 2285], ['Orinoco', 2140],
  ['Columbia River', 2000], ['Tigris', 1850], ['Snake River', 1735], ['Ohio River', 1579],
  ['Rhine', 1233], ['Elbe', 1094], ['Tennessee River', 1049], ['Loire', 1006], ['Rhone', 813],
  ['Seine', 777], ['Delaware River', 579], ['Hudson River', 507], ['Tiber', 405],
  ['Thames', 346], ['Jordan River', 252],
];

// ---- latitude, degrees (south negative) ----------------------------------------
export const CITY_LAT = [
  ['Murmansk', 68.97], ['Nuuk', 64.18], ['Reykjavik', 64.15], ['Anchorage', 61.22],
  ['Helsinki', 60.17], ['Oslo', 59.91], ['Stockholm', 59.33], ['Edinburgh', 55.95], ['Moscow', 55.75],
  ['Copenhagen', 55.68], ['Dublin', 53.35], ['Amsterdam', 52.37], ['Berlin', 52.52], ['Warsaw', 52.23],
  ['London', 51.51], ['Kyiv', 50.45], ['Prague', 50.08], ['Vancouver', 49.26], ['Paris', 48.86],
  ['Vienna', 48.21], ['Munich', 48.14], ['Seattle', 47.61], ['Budapest', 47.5], ['Montreal', 45.5],
  ['Minneapolis', 44.98], ['Toronto', 43.67], ['Vladivostok', 43.12], ['Boston', 42.36], ['Rome', 41.89],
  ['Chicago', 41.88], ['Barcelona', 41.39], ['Istanbul', 41.01], ['New York City', 40.71], ['Madrid', 40.42],
  ['Beijing', 39.9], ['Denver', 39.74], ['Lisbon', 38.71], ['Athens', 37.98], ['San Francisco', 37.78],
  ['Seoul', 37.56], ['Tunis', 36.8], ['Tehran', 35.69], ['Tokyo', 35.68], ['Osaka', 34.69],
  ['Los Angeles', 34.05], ['Atlanta', 33.75], ['Casablanca', 33.6], ['Phoenix', 33.45], ['Baghdad', 33.31],
  ['Dallas', 32.78], ['Tel Aviv', 32.08], ['Shanghai', 31.23], ['Cairo', 30.04], ['New Orleans', 29.95],
  ['Houston', 29.76], ['Delhi', 28.67], ['Kathmandu', 27.72], ['Miami', 25.78], ['Dubai', 25.27],
  ['Taipei', 25.03], ['Karachi', 24.86], ['Riyadh', 24.65], ['Havana', 23.11], ['Kolkata', 22.57],
  ['Hong Kong', 22.28], ['Honolulu', 21.31], ['Hanoi', 21.03], ['Mexico City', 19.35], ['Mumbai', 19.08],
  ['Dakar', 14.69], ['Manila', 14.6], ['Bangkok', 13.76], ['Chennai', 13.08], ['Caracas', 10.49],
  ['Addis Ababa', 9.03], ['Panama City', 8.98], ['Colombo', 6.93], ['Lagos', 6.52], ['Accra', 5.56],
  ['Bogota', 4.61], ['Kuala Lumpur', 3.15], ['Singapore', 1.3], ['Quito', -0.22], ['Nairobi', -1.29],
  ['Kinshasa', -4.32], ['Jakarta', -6.18], ['Dar es Salaam', -6.79], ['Lima', -12.06],
  ['Brasilia', -15.79], ['La Paz', -16.5], ['Harare', -17.83],   ['Rio de Janeiro', -22.91], ['Sao Paulo', -23.55],   ['Johannesburg', -26.2], ['Brisbane', -27.47], ['Durban', -29.86], ['Perth', -31.96],
  ['Santiago', -33.44], ['Sydney', -33.87], ['Cape Town', -33.93], ['Buenos Aires', -34.6],
  ['Montevideo', -34.9], ['Adelaide', -34.93], ['Auckland', -36.85], ['Melbourne', -37.81],
  ['Wellington', -41.29], ['Hobart', -42.88], ['Ushuaia', -54.8],
];

// ---- box office, $M worldwide --------------------------------------------------
// The live bank's box office pool, updated to current lifetime worldwide grosses
// (re-releases included) where the bank's figure was out of date (fact-check 2026-09-24).
export const BOX_OFFICE = [
  ['Avatar', 2923], ['Avengers: Endgame', 2798], ['Avatar: The Way of Water', 2320],
  ['Star Wars: The Force Awakens', 2068], ['Avengers: Infinity War', 2048], ['Spider-Man: No Way Home', 1922],
  ['Titanic', 2264], ['Jurassic World', 1670], ['The Lion King (2019)', 1655], ['The Avengers', 1519],
  ['Furious 7', 1515], ['Top Gun: Maverick', 1496], ['Avengers: Age of Ultron', 1403], ['Black Panther', 1348],
  ['Barbie', 1446], ['Harry Potter and the Deathly Hallows - Part 2', 1342],
  ['Jurassic World: Fallen Kingdom', 1310], ['Frozen', 1282], ['The Fate of the Furious', 1236],
  ['Aquaman', 1149], ['Skyfall', 1109], ['The Dark Knight Rises', 1081], ['Joker', 1074],
  ['Zootopia', 1024], ['The Dark Knight', 1006], ["Harry Potter and the Philosopher's Stone", 1009],
  ['Shrek 2', 923], ['Inception', 837], ['Mission: Impossible - Fallout', 792], ['Deadpool', 783],
  ['Interstellar', 702], ['The Hunger Games', 695], ['Moana', 691], ['Forrest Gump', 678],
  ['The Sixth Sense', 673], ['The Incredibles', 632], ['Casino Royale', 609], ['Home Alone', 477],
  ['The Matrix', 467], ['Gladiator', 461], ['Beauty and the Beast (1991)', 425], ['Dune (2021)', 402],
  ['Twilight', 395], ['Toy Story', 394], ['Back to the Future', 383], ['Top Gun', 357],
  ['The Godfather', 270],
];

// ---- people: the 2020 US Census (a fixed count, it never moves) --------------------
export const STATE_POP_2020 = [
  ['California', 39538223], ['Texas', 29145505], ['Florida', 21538187], ['New York', 20201249],
  ['Pennsylvania', 13002700], ['Illinois', 12812508], ['Ohio', 11799448], ['Georgia', 10711908],
  ['North Carolina', 10439388], ['Michigan', 10077331], ['New Jersey', 9288994], ['Virginia', 8631393],
  ['Washington', 7705281], ['Arizona', 7151502], ['Massachusetts', 7029917], ['Tennessee', 6910840],
  ['Indiana', 6785528], ['Maryland', 6177224], ['Missouri', 6154913], ['Wisconsin', 5893718],
  ['Colorado', 5773714], ['Minnesota', 5706494], ['South Carolina', 5118425], ['Alabama', 5024279],
  ['Louisiana', 4657757], ['Kentucky', 4505836], ['Oregon', 4237256], ['Oklahoma', 3959353],
  ['Connecticut', 3605944], ['Utah', 3271616], ['Iowa', 3190369], ['Nevada', 3104614],
  ['Arkansas', 3011524], ['Mississippi', 2961279], ['Kansas', 2937880], ['New Mexico', 2117522],
  ['Nebraska', 1961504], ['Idaho', 1839106], ['West Virginia', 1793716], ['Hawaii', 1455271],
  ['New Hampshire', 1377529], ['Maine', 1362359], ['Rhode Island', 1097379], ['Montana', 1084225],
  ['Delaware', 989948], ['South Dakota', 886667], ['North Dakota', 779094], ['Alaska', 733391],
  ['Vermont', 643077], ['Wyoming', 576851],
];

// City proper only. Honolulu (a CDP inside a consolidated city-county) and
// Indianapolis (balance vs consolidated) are left out as ambiguous.
export const CITY_POP_2020 = [
  ['New York City', 8804190], ['Los Angeles', 3898747], ['Chicago', 2746388], ['Houston', 2304580],
  ['Phoenix', 1608139], ['Philadelphia', 1603797], ['San Antonio', 1434625], ['San Diego', 1386932],
  ['Dallas', 1304379], ['San Jose', 1013240], ['Austin', 961855], ['Jacksonville', 949611],
  ['Fort Worth', 918915], ['Columbus', 905748], ['Charlotte', 874579],
  ['San Francisco', 873965], ['Seattle', 737015], ['Denver', 715522], ['Oklahoma City', 681054],
  ['Boston', 675647], ['Portland', 652503], ['Las Vegas', 641903], ['Detroit', 639111],
  ['Baltimore', 585708], ['Milwaukee', 577222], ['Albuquerque', 564559], ['Atlanta', 498715],
  ['Omaha', 486051], ['Raleigh', 467665], ['Miami', 442241], ['Minneapolis', 429954],
  ['Tulsa', 413066], ['New Orleans', 383997], ['Cleveland', 372624],
  ['Cincinnati', 309317], ['Pittsburgh', 302971], ['St. Louis', 301578], ['Anchorage', 291247],
  ['Buffalo', 278349], ['Boise', 235684], ['Salt Lake City', 199723],
];

// ---- sport: FINAL career totals of RETIRED players only ----------------------------
// No active player appears, so no board here needs an as-of date.
export const RETIRED_HR = [
  ['Barry Bonds', 762], ['Hank Aaron', 755], ['Babe Ruth', 714], ['Albert Pujols', 703],
  ['Alex Rodriguez', 696], ['Willie Mays', 660], ['Ken Griffey Jr.', 630], ['Jim Thome', 612],
  ['Sammy Sosa', 609], ['Frank Robinson', 586], ['Mark McGwire', 583], ['Harmon Killebrew', 573],
  ['Rafael Palmeiro', 569], ['Reggie Jackson', 563], ['Manny Ramirez', 555], ['Mike Schmidt', 548],
  ['David Ortiz', 541], ['Mickey Mantle', 536], ['Jimmie Foxx', 534], ['Ted Williams', 521],
  ['Ernie Banks', 512], ['Gary Sheffield', 509], ['Eddie Murray', 504], ['Lou Gehrig', 493],
  ['Adrian Beltre', 477], ['Stan Musial', 475], ['Carlos Delgado', 473], ['Chipper Jones', 468],
  ['Dave Winfield', 465], ['Jose Canseco', 462], ['Carl Yastrzemski', 452], ['Jeff Bagwell', 449],
  ['Dave Kingman', 442], ['Jason Giambi', 440], ['Paul Konerko', 439], ['Andre Dawson', 438],
  ['Carlos Beltran', 435], ['Cal Ripken Jr.', 431], ['Mike Piazza', 427], ['Alfonso Soriano', 412],
  ['Mark Teixeira', 409], ['Duke Snider', 407], ['Al Kaline', 399], ['Dale Murphy', 398],
  ['Joe Carter', 396], ['Johnny Bench', 389], ['Jim Rice', 382], ['Tony Perez', 379],
  ['Joe DiMaggio', 361], ['Yogi Berra', 358], ['Tino Martinez', 339], ['George Brett', 317],
  ['Edgar Martinez', 309], ['Rickey Henderson', 297], ['Pat Burrell', 292], ['Craig Biggio', 291],
  ['Bobby Abreu', 288], ['Will Clark', 284], ['Paul O\'Neill', 281], ['Dante Bichette', 274],
  ['Steve Garvey', 272], ['Joe Morgan', 268], ['Roy Campanella', 261], ['Derek Jeter', 260],
  ['Chase Utley', 259], ['Kirk Gibson', 255], ['Robin Yount', 251], ['Justin Morneau', 247],
  ['Hunter Pence', 244], ['Roberto Clemente', 240], ['Johnny Damon', 235], ['Paul Molitor', 234],
  ['Don Mattingly', 222], ['Kirby Puckett', 207], ['Pete Rose', 160], ['Joe Mauer', 143],
  ['Tony Gwynn', 135], ['Wade Boggs', 118], ['Ichiro Suzuki', 117], ['Rod Carew', 92],
  ['Ozzie Smith', 28],
];

export const RETIRED_K = [
  ['Nolan Ryan', 5714], ['Randy Johnson', 4875], ['Roger Clemens', 4672], ['Steve Carlton', 4136],
  ['Bert Blyleven', 3701], ['Tom Seaver', 3640], ['Don Sutton', 3574], ['Gaylord Perry', 3534],
  ['Walter Johnson', 3509], ['Greg Maddux', 3371], ['Phil Niekro', 3342], ['Ferguson Jenkins', 3192],
  ['Pedro Martinez', 3154], ['Bob Gibson', 3117], ['Curt Schilling', 3116], ['John Smoltz', 3084],
  ['Mickey Lolich', 2832], ['Mike Mussina', 2813], ['Cy Young', 2803], ['Frank Tanana', 2773],
  ['Tom Glavine', 2607], ['Warren Spahn', 2583], ['Bob Feller', 2581], ['Cole Hamels', 2560],
  ['Bartolo Colon', 2535], ['Christy Mathewson', 2502], ['Jack Morris', 2478], ['Andy Pettitte', 2448],
  ['Dennis Eckersley', 2401], ['Sandy Koufax', 2396], ['Juan Marichal', 2303], ['Dwight Gooden', 2293],
  ['Jim Palmer', 2212], ['Jake Peavy', 2207], ['David Wells', 2201], ['Grover Cleveland Alexander', 2198],
  ['Roy Halladay', 2117], ['Fernando Valenzuela', 2074], ['Orel Hershiser', 2014], ['Catfish Hunter', 2012],
  ['Johan Santana', 1988], ['Whitey Ford', 1956], ['Mariano Rivera', 1173], ['Dizzy Dean', 1163],
];

export const RETIRED_YARDS = [
  ['Tom Brady', 89214], ['Drew Brees', 80358], ['Peyton Manning', 71940], ['Brett Favre', 71838],
  ['Ben Roethlisberger', 64088], ['Matt Ryan', 62792], ['Dan Marino', 61361], ['Eli Manning', 57023],
  ['John Elway', 51475], ['Warren Moon', 49325], ['Fran Tarkenton', 47003], ['Carson Palmer', 46247],
  ['Vinny Testaverde', 46233], ['Drew Bledsoe', 44611], ['Dan Fouts', 43040], ['Kerry Collins', 40922],
  ['Joe Montana', 40551], ['Johnny Unitas', 40239], ['Boomer Esiason', 37920], ['Donovan McNabb', 37276],
  ['Matt Hasselbeck', 36638], ['Alex Smith', 35650], ['Jim Kelly', 35467], ['Jay Cutler', 35133],
  ['Ryan Fitzpatrick', 34990], ['Jim Everett', 34837], ['Tony Romo', 34183], ['Phil Simms', 33462],
  ['Steve Young', 33124], ['Troy Aikman', 32942], ['Kurt Warner', 32344], ['Steve McNair', 31304],
  ['Randall Cunningham', 29979], ['Terry Bradshaw', 27989], ['Joe Namath', 27663], ['Bart Starr', 24718],
  ['Roger Staubach', 22700],
];
