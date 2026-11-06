// Places & Landmarks lane for Atlas days 99..129 (2026-12-01 to 2026-12-31), appended with
//   node scripts/gen-atlas.mjs scripts/atlas-lanes-2026-12 --through 2026-12-31
// An entry with `from` recycles a never-answered question (owner rule 2026-10-09).
export const LANE_DAYS = [
  // 2026-12-01
  [
    { c: 'Places & Landmarks', t: 1, q: 'The Grand Ole Opry, the home of country music radio, is in which city?', a: 'Nashville', d: ['Memphis', 'Austin', 'Atlanta'] },
    { c: 'Places & Landmarks', t: 2, q: 'Which Moroccan city is home to al-Qarawiyyin, often called the oldest university in the world?', a: 'Fez', d: ['Marrakesh', 'Rabat', 'Meknes'] },
    { c: 'Places & Landmarks', t: 3, q: 'In which German city did Johann Sebastian Bach lead the choir of St. Thomas Church?', a: 'Leipzig', d: ['Dresden', 'Weimar', 'Eisenach'] },
    { c: 'Places & Landmarks', t: 4, q: 'Which German city hosts the annual Oktoberfest?', a: 'Munich', d: ['Stuttgart', 'Cologne', 'Frankfurt'], from: 'atlas:d05q19' },
    { c: 'Places & Landmarks', t: 5, q: 'The modern Bibliotheca library that recalls a famous ancient one stands in which Egyptian city?', a: 'Alexandria', d: ['Port Said', 'Suez', 'Asyut'], from: 'atlas:d24q24' },
  ],
  // 2026-12-02
  [
    { c: 'Places & Landmarks', t: 1, q: 'Which California valley north of San Francisco is famous for its wineries?', a: 'Napa Valley', d: ['Death Valley', 'Central Valley', 'Silicon Valley'] },
    { c: 'Places & Landmarks', t: 2, q: 'Which Massachusetts town held infamous witch trials in 1692?', a: 'Salem', d: ['Plymouth', 'Concord', 'Lexington'] },
    { c: 'Places & Landmarks', t: 3, q: 'Which Swiss resort town hosts the annual meeting of the World Economic Forum?', a: 'Davos', d: ['Zermatt', 'St. Moritz', 'Gstaad'] },
    { c: 'Places & Landmarks', t: 4, q: 'The Trans-Siberian Railway ends at which Pacific port city?', a: 'Vladivostok', d: ['Khabarovsk', 'Irkutsk', 'Magadan'], from: 'atlas:d13q19' },
    { c: 'Places & Landmarks', t: 5, q: 'A giant stainless steel equestrian statue of Genghis Khan stands outside which city?', a: 'Ulaanbaatar', d: ['Astana', 'Irkutsk', 'Hohhot'], from: 'atlas:d13q24' },
  ],
  // 2026-12-03
  [
    { c: 'Places & Landmarks', t: 1, q: 'The Beatles first played to big crowds at the Cavern Club in which English city?', a: 'Liverpool', d: ['Manchester', 'London', 'Birmingham'] },
    { c: 'Places & Landmarks', t: 2, q: 'Which Kenyan game reserve adjoins the Serengeti across the Tanzanian border?', a: 'The Maasai Mara', d: ['Amboseli', 'Tsavo', 'Samburu'] },
    { c: 'Places & Landmarks', t: 3, q: 'Which Austrian city in the Alps is known for its Golden Roof?', a: 'Innsbruck', d: ['Salzburg', 'Graz', 'Linz'] },
    { c: 'Places & Landmarks', t: 4, q: 'Which Indian city is called the Pink City for the terracotta wash on its old buildings?', a: 'Jaipur', d: ['Udaipur', 'Jodhpur', 'Agra'], from: 'atlas:d36q19' },
    { c: 'Places & Landmarks', t: 5, q: 'The Naqsh-e Jahan Square, ringed by blue tiled mosques, lies in which Iranian city?', a: 'Isfahan', d: ['Shiraz', 'Tabriz', 'Mashhad'], from: 'atlas:d35q24' },
  ],
  // 2026-12-04
  [
    { c: 'Places & Landmarks', t: 1, q: 'Which Mexican resort city lies on the Caribbean coast of the Yucatan Peninsula?', a: 'Cancun', d: ['Acapulco', 'Puerto Vallarta', 'Cabo San Lucas'] },
    { c: 'Places & Landmarks', t: 2, q: 'Which Italian city displays a balcony said to be Juliet\'s from Romeo and Juliet?', a: 'Verona', d: ['Venice', 'Padua', 'Mantua'] },
    { c: 'Places & Landmarks', t: 3, q: 'The Twelve Apostles, limestone stacks off the Great Ocean Road, lie in which Australian state?', a: 'Victoria', d: ['New South Wales', 'South Australia', 'Tasmania'] },
    { c: 'Places & Landmarks', t: 4, q: 'Which Australian city grew up around the Swan River on the far side of the continent from Sydney?', a: 'Perth', d: ['Adelaide', 'Darwin', 'Hobart'], from: 'atlas:d40q19' },
    { c: 'Places & Landmarks', t: 5, q: 'The Hassan II Mosque, whose minaret rises above the Atlantic shore, stands in which city?', a: 'Casablanca', d: ['Rabat', 'Tangier', 'Agadir'], from: 'atlas:d11q24' },
  ],
  // 2026-12-05
  [
    { c: 'Places & Landmarks', t: 1, q: 'Which small Indian state is famous for its beaches and old Portuguese churches?', a: 'Goa', d: ['Kerala', 'Gujarat', 'Puducherry'] },
    { c: 'Places & Landmarks', t: 2, q: 'Which French town became a great Catholic pilgrimage site after a girl reported visions there in 1858?', a: 'Lourdes', d: ['Chartres', 'Lisieux', 'Rocamadour'] },
    { c: 'Places & Landmarks', t: 3, q: 'In which country would you find the city of Havana?', a: 'Cuba', d: ['Dominican Republic', 'Jamaica', 'Haiti'], from: 'atlas:d29q14' },
    { c: 'Places & Landmarks', t: 4, q: 'The Millau Viaduct in southern France carries a motorway high above the valley of which river?', a: 'The Tarn', d: ['The Dordogne', 'The Rhone', 'The Lot'], from: 'atlas:d42q19' },
    { c: 'Places & Landmarks', t: 5, q: 'The rock cut Buddhist halls of the Ajanta Caves, famous for their wall paintings, lie in which Indian state?', a: 'Maharashtra', d: ['Madhya Pradesh', 'Karnataka', 'Gujarat'], from: 'atlas:d50q24' },
  ],
  // 2026-12-06
  [
    { c: 'Places & Landmarks', t: 1, q: 'The Art Deco hotels of South Beach belong to which Florida city?', a: 'Miami', d: ['Tampa', 'Orlando', 'Jacksonville'] },
    { c: 'Places & Landmarks', t: 2, q: 'The Rock and Roll Hall of Fame stands on the shore of Lake Erie in which city?', a: 'Cleveland', d: ['Detroit', 'Buffalo', 'Toledo'] },
    { c: 'Places & Landmarks', t: 3, q: 'The Valley of the Kings lies across the Nile from which town in Upper Egypt?', a: 'Luxor', d: ['Aswan', 'Giza', 'Abydos'], from: 'atlas:d41q14' },
    { c: 'Places & Landmarks', t: 4, q: 'The Victoria Memorial stands in which Indian city, the seat of the British Raj until 1911?', a: 'Kolkata', d: ['Mumbai', 'Chennai', 'Bengaluru'], from: 'atlas:d33q19' },
    { c: 'Places & Landmarks', t: 5, q: 'The Peace Memorial Park and its skeletal domed ruin stand in which Japanese city?', a: 'Hiroshima', d: ['Nagasaki', 'Kobe', 'Okayama'], from: 'atlas:d20q24' },
  ],
  // 2026-12-07
  [
    { c: 'Places & Landmarks', t: 1, q: 'Which royal castle on the Thames west of London is the oldest occupied castle in the world?', a: 'Windsor Castle', d: ['Hampton Court', 'Balmoral Castle', 'Warwick Castle'] },
    { c: 'Places & Landmarks', t: 2, q: 'Which string of five colorful cliffside villages lies on the coast of Liguria in Italy?', a: 'The Cinque Terre', d: ['The Amalfi Coast', 'The Costa Brava', 'The Algarve'] },
    { c: 'Places & Landmarks', t: 3, q: 'Which German city is famous for its castle ruins above the Neckar and its old university?', a: 'Heidelberg', d: ['Tubingen', 'Freiburg', 'Marburg'] },
    { c: 'Places & Landmarks', t: 4, q: 'Which Chicago office block of 1885, widely called the first skyscraper, took its name from the company that commissioned it?', a: 'The Home Insurance Building', d: ['The Monadnock Block', 'The Reliance Building', 'The Rookery'], from: 'atlas:d48q19' },
    { c: 'Places & Landmarks', t: 5, q: 'The gilded Shwedagon Pagoda dominates the skyline of which city?', a: 'Yangon', d: ['Mandalay', 'Naypyidaw', 'Bago'], from: 'atlas:d25q24' },
  ],
  // 2026-12-08
  [
    { c: 'Places & Landmarks', t: 1, q: 'Which New Jersey seaside city is famous for its boardwalk and casinos?', a: 'Atlantic City', d: ['Cape May', 'Asbury Park', 'Newark'] },
    { c: 'Places & Landmarks', t: 2, q: 'Leonardo da Vinci\'s painting The Last Supper is on a refectory wall in which city?', a: 'Milan', d: ['Florence', 'Rome', 'Venice'] },
    { c: 'Places & Landmarks', t: 3, q: 'Which Japanese city\'s skyline was rebuilt after it was hit by the second atomic bomb in 1945?', a: 'Nagasaki', d: ['Hiroshima', 'Kokura', 'Fukuoka'] },
    { c: 'Places & Landmarks', t: 4, q: 'Which Tunisian island in the Gulf of Gabes is home to the ancient El Ghriba synagogue?', a: 'Djerba', d: ['Kerkennah', 'Sicily', 'Malta'] },
    { c: 'Places & Landmarks', t: 5, q: 'Which city is the principal seaport of Kenya?', a: 'Mombasa', d: ['Kisumu', 'Malindi', 'Lamu'], from: 'atlas:d22q24' },
  ],
  // 2026-12-09
  [
    { c: 'Places & Landmarks', t: 1, q: 'Which London suburb hosts the oldest tennis tournament in the world, played on grass each summer?', a: 'Wimbledon', d: ['Richmond', 'Greenwich', 'Hampstead'] },
    { c: 'Places & Landmarks', t: 2, q: 'Which Chinese city is famous for the karst peaks along the Li River?', a: 'Guilin', d: ['Chengdu', 'Kunming', 'Lhasa'] },
    { c: 'Places & Landmarks', t: 3, q: 'Which salt mine near Krakow has chapels and statues carved from rock salt deep underground?', a: 'Wieliczka', d: ['Bochnia', 'Kutna Hora', 'Hallein'] },
    { c: 'Places & Landmarks', t: 4, q: 'Which Maya ruin in the Peten rainforest is dominated by a steep pyramid called the Temple of the Great Jaguar?', a: 'Tikal', d: ['Palenque', 'Calakmul', 'Copan'], from: 'atlas:d44q19' },
    { c: 'Places & Landmarks', t: 5, q: 'The headquarters of the African Union stands in which city?', a: 'Addis Ababa', d: ['Nairobi', 'Accra', 'Kigali'], from: 'atlas:d09q24' },
  ],
  // 2026-12-10
  [
    { c: 'Places & Landmarks', t: 1, q: 'Which French town hosts a famous 24-hour sports car race every June?', a: 'Le Mans', d: ['Monaco', 'Reims', 'Dijon'] },
    { c: 'Places & Landmarks', t: 2, q: 'The Wright brothers made the first powered airplane flights near which North Carolina town?', a: 'Kitty Hawk', d: ['Wilmington', 'Raleigh', 'Asheville'] },
    { c: 'Places & Landmarks', t: 3, q: 'George Town, a World Heritage port, is the capital of which Malaysian island state?', a: 'Penang', d: ['Langkawi', 'Sabah', 'Melaka'] },
    { c: 'Places & Landmarks', t: 4, q: 'The cathedral dome engineered by Brunelleschi crowns which Italian city?', a: 'Florence', d: ['Bologna', 'Siena', 'Verona'], from: 'atlas:d14q19' },
    { c: 'Places & Landmarks', t: 5, q: 'The Temple of the Tooth stands in which Sri Lankan hill city?', a: 'Kandy', d: ['Galle', 'Jaffna', 'Negombo'], from: 'atlas:d39q24' },
  ],
  // 2026-12-11
  [
    { c: 'Places & Landmarks', t: 1, q: 'Which Canadian national park in the Rockies is home to Lake Louise?', a: 'Banff', d: ['Jasper', 'Yoho', 'Glacier'] },
    { c: 'Places & Landmarks', t: 2, q: 'Which English university city is known for punting on the River Cam?', a: 'Cambridge', d: ['Oxford', 'Durham', 'York'] },
    { c: 'Places & Landmarks', t: 3, q: 'In which French city\'s cathedral were most French kings crowned?', a: 'Reims', d: ['Chartres', 'Rouen', 'Amiens'] },
    { c: 'Places & Landmarks', t: 4, q: 'The Potala Palace, a vast hilltop fortress of the Dalai Lamas, stands in which city?', a: 'Lhasa', d: ['Kathmandu', 'Thimphu', 'Xining'], from: 'atlas:d27q19' },
    { c: 'Places & Landmarks', t: 5, q: 'Which Russian city in the Urals sits on the conventional boundary between Europe and Asia?', a: 'Yekaterinburg', d: ['Novosibirsk', 'Perm', 'Omsk'], from: 'atlas:d28q24' },
  ],
  // 2026-12-12
  [
    { c: 'Places & Landmarks', t: 1, q: 'Napoleon met his final defeat in 1815 near which Belgian town?', a: 'Waterloo', d: ['Liege', 'Mons', 'Ypres'] },
    { c: 'Places & Landmarks', t: 2, q: 'Which New Zealand lakeside town calls itself the adventure capital of the world?', a: 'Queenstown', d: ['Rotorua', 'Wanaka', 'Nelson'] },
    { c: 'Places & Landmarks', t: 3, q: 'The Ponte Vecchio, still lined with jewelers\' shops, crosses which river?', a: 'The Arno', d: ['The Tiber', 'The Po', 'The Adige'], from: 'atlas:d42q14' },
    { c: 'Places & Landmarks', t: 4, q: 'The Great Mosque of Djenne, the largest mud brick building in the world, stands in which country?', a: 'Mali', d: ['Niger', 'Senegal', 'Chad'], from: 'atlas:d17q19' },
    { c: 'Places & Landmarks', t: 5, q: 'The square known as Jemaa el-Fnaa, filled nightly with food stalls and storytellers, lies in which city?', a: 'Marrakesh', d: ['Fez', 'Meknes', 'Oujda'], from: 'atlas:d21q24' },
  ],
  // 2026-12-13
  [
    { c: 'Places & Landmarks', t: 1, q: 'Fenway Park and the Freedom Trail are landmarks of which city?', a: 'Boston', d: ['Philadelphia', 'New York City', 'Baltimore'] },
    { c: 'Places & Landmarks', t: 2, q: 'Canterbury Cathedral is the seat of the archbishop who leads which church?', a: 'The Church of England', d: ['The Church of Scotland', 'The Roman Catholic Church', 'The Church in Wales'] },
    { c: 'Places & Landmarks', t: 3, q: 'Which Argentine city on the Beagle Channel calls itself the southernmost city in the world?', a: 'Ushuaia', d: ['Punta Arenas', 'Rio Gallegos', 'Puerto Williams'] },
    { c: 'Places & Landmarks', t: 4, q: 'Which American city is nicknamed the Steel City?', a: 'Pittsburgh', d: ['Gary', 'Youngstown', 'Bethlehem'], from: 'atlas:d24q19' },
    { c: 'Places & Landmarks', t: 5, q: 'Which Pakistani city on the Arabian Sea served as the country\'s first capital after independence in 1947?', a: 'Karachi', d: ['Lahore', 'Faisalabad', 'Peshawar'], from: 'atlas:d30q24' },
  ],
  // 2026-12-14
  [
    { c: 'Places & Landmarks', t: 1, q: 'Which South African national park is the country\'s largest and best known game reserve?', a: 'Kruger', d: ['Serengeti', 'Etosha', 'Hwange'] },
    { c: 'Places & Landmarks', t: 2, q: 'Fort McHenry, whose defense inspired The Star-Spangled Banner, guards the harbor of which city?', a: 'Baltimore', d: ['Boston', 'Philadelphia', 'Charleston'] },
    { c: 'Places & Landmarks', t: 3, q: 'Which Colombian city, once notorious, became known for its public cable cars and outdoor escalators?', a: 'Medellin', d: ['Cali', 'Bogota', 'Barranquilla'] },
    { c: 'Places & Landmarks', t: 4, q: 'The riverside promenade known as the Bund lines the waterfront of which city?', a: 'Shanghai', d: ['Hong Kong', 'Guangzhou', 'Tianjin'], from: 'atlas:d08q19' },
    { c: 'Places & Landmarks', t: 5, q: 'The Buddhist temple of Borobudur stands on which Indonesian island?', a: 'Java', d: ['Bali', 'Sumatra', 'Lombok'], from: 'atlas:d41q24' },
  ],
  // 2026-12-15
  [
    { c: 'Places & Landmarks', t: 1, q: 'Graceland, the mansion of Elvis Presley, stands in which city?', a: 'Memphis', d: ['Nashville', 'Tupelo', 'New Orleans'] },
    { c: 'Places & Landmarks', t: 2, q: 'Stanley Park, a forested peninsula beside downtown, belongs to which Canadian city?', a: 'Vancouver', d: ['Toronto', 'Calgary', 'Victoria'] },
    { c: 'Places & Landmarks', t: 3, q: 'Which South Korean volcanic island is the country\'s top holiday destination?', a: 'Jeju', d: ['Ulleungdo', 'Geoje', 'Ganghwa'] },
    { c: 'Places & Landmarks', t: 4, q: 'Which Ottoman single arch bridge at Mostar, destroyed in 1993 and rebuilt in 2004, is the landmark of that town?', a: 'The Stari Most', d: ['The Latin Bridge', 'The Goat Bridge', 'The Mehmed Pasa Sokolovic Bridge'], from: 'atlas:d59q19' },
    { c: 'Places & Landmarks', t: 5, q: 'Which city, spread across fourteen islands and often called the Venice of the North, is the largest in Sweden?', a: 'Stockholm', d: ['Gothenburg', 'Malmo', 'Uppsala'], from: 'atlas:d05q24' },
  ],
  // 2026-12-16
  [
    { c: 'Places & Landmarks', t: 1, q: 'Which French city on the Riviera hosts a famous film festival every May?', a: 'Cannes', d: ['Nice', 'Monaco', 'Marseille'] },
    { c: 'Places & Landmarks', t: 2, q: 'Stonehenge stands on the plain near which English cathedral city?', a: 'Salisbury', d: ['Winchester', 'Bath', 'Exeter'] },
    { c: 'Places & Landmarks', t: 3, q: 'Which French cave is famous for prehistoric paintings of horses, bulls and deer?', a: 'Lascaux', d: ['Altamira', 'Chauvet', 'Font-de-Gaume'] },
    { c: 'Places & Landmarks', t: 4, q: 'The Chand Baori, a stepwell descending some thirteen levels in a great inverted pyramid of stairs, lies in which Indian state?', a: 'Rajasthan', d: ['Bihar', 'Gujarat', 'Kerala'], from: 'atlas:d58q19' },
    { c: 'Places & Landmarks', t: 5, q: 'The Registan, a square framed by three tiled madrasas, lies in which Uzbek city?', a: 'Samarkand', d: ['Bukhara', 'Khiva', 'Ashgabat'], from: 'atlas:d02q24' },
  ],
  // 2026-12-17
  [
    { c: 'Places & Landmarks', t: 1, q: 'Which island south of Cape Cod is a summer retreat reached by ferry, with the towns of Edgartown and Oak Bluffs?', a: 'Martha\'s Vineyard', d: ['Nantucket', 'Block Island', 'Long Island'] },
    { c: 'Places & Landmarks', t: 2, q: 'Positano, Amalfi and Ravello are towns on which stretch of Italian coastline?', a: 'The Amalfi Coast', d: ['The Cinque Terre', 'The Italian Riviera', 'The Costa Smeralda'] },
    { c: 'Places & Landmarks', t: 3, q: 'Which Austrian lakeside village of pastel houses is one of the most photographed places in the Alps?', a: 'Hallstatt', d: ['Zell am See', 'St. Wolfgang', 'Kitzbuhel'] },
    { c: 'Places & Landmarks', t: 4, q: 'Which Nigerian city, built around a lagoon, served as the country\'s capital until 1991?', a: 'Lagos', d: ['Kano', 'Ibadan', 'Benin City'], from: 'atlas:d20q19' },
    { c: 'Places & Landmarks', t: 5, q: 'Which Peruvian city was the imperial seat of the Inca?', a: 'Cusco', d: ['Lima', 'Arequipa', 'Trujillo'], from: 'atlas:d32q24' },
  ],
  // 2026-12-18
  [
    { c: 'Places & Landmarks', t: 1, q: 'The Brooklyn Bridge crosses the East River in which city?', a: 'New York City', d: ['Boston', 'Philadelphia', 'Chicago'] },
    { c: 'Places & Landmarks', t: 2, q: 'Which Thai island in the Andaman Sea is the country\'s largest and a famous beach resort?', a: 'Phuket', d: ['Ko Samui', 'Ko Phi Phi', 'Ko Chang'] },
    { c: 'Places & Landmarks', t: 3, q: 'Which walled Bavarian town on the Romantic Road is one of the best preserved medieval towns in Germany?', a: 'Rothenburg ob der Tauber', d: ['Bamberg', 'Regensburg', 'Nuremberg'] },
    { c: 'Places & Landmarks', t: 4, q: 'The running of the bulls during the San Fermin festival takes place in which Spanish city?', a: 'Pamplona', d: ['Salamanca', 'Logrono', 'Burgos'], from: 'atlas:d22q19' },
    { c: 'Places & Landmarks', t: 5, q: 'Which African city was called Salisbury until 1982?', a: 'Harare', d: ['Lusaka', 'Gaborone', 'Maputo'], from: 'atlas:d03q24' },
  ],
  // 2026-12-19
  [
    { c: 'Places & Landmarks', t: 1, q: 'Pike Place Market, with its flying fish sellers, is in which city?', a: 'Seattle', d: ['Portland', 'San Francisco', 'Vancouver'] },
    { c: 'Places & Landmarks', t: 2, q: 'The Chateau Frontenac hotel towers over the old town of which Canadian city?', a: 'Quebec City', d: ['Montreal', 'Ottawa', 'Halifax'] },
    { c: 'Places & Landmarks', t: 3, q: 'Which buried army of life-sized clay soldiers was unearthed by well diggers in 1974?', a: 'The Terracotta Army', d: ['The Ming Tombs', 'The Mogao Caves', 'The Longmen Grottoes'], from: 'atlas:d47q14' },
    { c: 'Places & Landmarks', t: 4, q: 'Which Colombian port on the Caribbean is ringed by colonial walls?', a: 'Cartagena', d: ['Barranquilla', 'Santa Marta', 'Cali'], from: 'atlas:d41q19' },
    { c: 'Places & Landmarks', t: 5, q: 'Which ruined city beside Lake Titicaca is known for a carved monolithic doorway called the Gateway of the Sun?', a: 'Tiwanaku', d: ['Chavin de Huantar', 'Sillustani', 'Pukara'], from: 'atlas:d46q24' },
  ],
  // 2026-12-20
  [
    { c: 'Places & Landmarks', t: 1, q: 'Which landscape of giant sandstone buttes on the Arizona-Utah border appears in many Western films?', a: 'Monument Valley', d: ['Bryce Canyon', 'Arches', 'Painted Desert'] },
    { c: 'Places & Landmarks', t: 2, q: 'Which Italian island off Naples is famous for its Blue Grotto?', a: 'Capri', d: ['Ischia', 'Elba', 'Procida'] },
    { c: 'Places & Landmarks', t: 3, q: 'Which Irish city on the west coast is famous for its oyster festival and the Claddagh ring?', a: 'Galway', d: ['Limerick', 'Sligo', 'Cork'] },
    { c: 'Places & Landmarks', t: 4, q: 'Which bridge and tunnel link, opened in 2000, carries road and rail traffic between Denmark and Sweden?', a: 'The Oresund Link', d: ['The Little Belt Bridge', 'The Great Belt Link', 'The Storstrom Bridge'], from: 'atlas:d47q19' },
    { c: 'Places & Landmarks', t: 5, q: 'The Fasil Ghebbi, a walled compound of stone castles built by seventeenth century emperors, stands in which Ethiopian city?', a: 'Gondar', d: ['Axum', 'Harar', 'Bahir Dar'], from: 'atlas:d52q24' },
  ],
  // 2026-12-21
  [
    { c: 'Places & Landmarks', t: 1, q: 'Bondi Beach is in which Australian city?', a: 'Sydney', d: ['Melbourne', 'Brisbane', 'Perth'] },
    { c: 'Places & Landmarks', t: 2, q: 'Which city in the US state of Georgia is famous for its leafy squares draped in Spanish moss?', a: 'Savannah', d: ['Atlanta', 'Augusta', 'Macon'] },
    { c: 'Places & Landmarks', t: 3, q: 'The Burj Khalifa tower rises above which city?', a: 'Dubai', d: ['Doha', 'Riyadh', 'Kuwait City'], from: 'atlas:d26q14' },
    { c: 'Places & Landmarks', t: 4, q: 'The Menin Gate, a memorial arch inscribed with the names of missing British Empire soldiers of the First World War, stands in which Belgian town?', a: 'Ypres', d: ['Liege', 'Bruges', 'Mons'], from: 'atlas:d43q19' },
    { c: 'Places & Landmarks', t: 5, q: 'Which Central Asian city was called Alma-Ata in Soviet times?', a: 'Almaty', d: ['Astana', 'Tashkent', 'Bishkek'], from: 'atlas:d16q24' },
  ],
  // 2026-12-22
  [
    { c: 'Places & Landmarks', t: 1, q: 'Which Hawaiian island is home to Waikiki Beach and Pearl Harbor?', a: 'Oahu', d: ['Maui', 'Kauai', 'Molokai'] },
    { c: 'Places & Landmarks', t: 2, q: 'Which Romanian castle in Transylvania is promoted as Dracula\'s Castle?', a: 'Bran Castle', d: ['Peles Castle', 'Corvin Castle', 'Rasnov Fortress'] },
    { c: 'Places & Landmarks', t: 3, q: 'Which Welsh town is famous for its great medieval castle and a house said to be the smallest in Britain?', a: 'Conwy', d: ['Caernarfon', 'Harlech', 'Beaumaris'] },
    { c: 'Places & Landmarks', t: 4, q: 'The CN Tower rises above which Canadian city?', a: 'Toronto', d: ['Montreal', 'Vancouver', 'Ottawa'], from: 'atlas:d18q19' },
    { c: 'Places & Landmarks', t: 5, q: 'Which Vietnamese city was renamed after 1975, having previously been called Saigon?', a: 'Ho Chi Minh City', d: ['Hanoi', 'Da Nang', 'Hue'], from: 'atlas:d26q24' },
  ],
  // 2026-12-23
  [
    { c: 'Places & Landmarks', t: 1, q: 'Which Pennsylvania town gave its name to a Civil War battle and a famous address by Lincoln?', a: 'Gettysburg', d: ['Harrisburg', 'Antietam', 'Lancaster'] },
    { c: 'Places & Landmarks', t: 2, q: 'Which Texas city is famous for its River Walk of shops and restaurants?', a: 'San Antonio', d: ['Houston', 'Dallas', 'El Paso'] },
    { c: 'Places & Landmarks', t: 3, q: 'Which Spanish town throws tomatoes at the yearly La Tomatina festival?', a: 'Bunol', d: ['Valencia', 'Pamplona', 'Sitges'] },
    { c: 'Places & Landmarks', t: 4, q: 'Which American city is nicknamed Music City?', a: 'Nashville', d: ['Austin', 'Memphis', 'Branson'], from: 'atlas:d09q19' },
    { c: 'Places & Landmarks', t: 5, q: 'The Sky Tower, the tallest freestanding structure in the Southern Hemisphere when it opened in 1997, rises above which city?', a: 'Auckland', d: ['Wellington', 'Christchurch', 'Hamilton'], from: 'atlas:d29q24' },
  ],
  // 2026-12-24
  [
    { c: 'Places & Landmarks', t: 1, q: 'Which English university city is home to the Bodleian Library?', a: 'Oxford', d: ['Cambridge', 'York', 'Durham'] },
    { c: 'Places & Landmarks', t: 2, q: 'Which English region of lakes and fells inspired the poet William Wordsworth?', a: 'The Lake District', d: ['The Peak District', 'The Cotswolds', 'The Yorkshire Dales'] },
    { c: 'Places & Landmarks', t: 3, q: 'The White Tower on the waterfront is the symbol of which Greek city?', a: 'Thessaloniki', d: ['Athens', 'Patras', 'Heraklion'] },
    { c: 'Places & Landmarks', t: 4, q: 'The temple of Wat Arun stands on the bank of which river?', a: 'Chao Phraya', d: ['Mekong', 'Irrawaddy', 'Red River'], from: 'atlas:d29q19' },
    { c: 'Places & Landmarks', t: 5, q: 'Which Malian town of mud brick mosques and manuscript libraries sat at the end of a Saharan caravan route?', a: 'Timbuktu', d: ['Gao', 'Agadez', 'Kano'], from: 'atlas:d33q24' },
  ],
  // 2026-12-25
  [
    { c: 'Places & Landmarks', t: 1, q: 'Which city hosts the Australian Open tennis tournament every January?', a: 'Melbourne', d: ['Sydney', 'Brisbane', 'Adelaide'] },
    { c: 'Places & Landmarks', t: 2, q: 'Which geothermal spa of milky blue water lies in a lava field near Reykjavik?', a: 'The Blue Lagoon', d: ['The Secret Lagoon', 'Myvatn Nature Baths', 'Geysir'] },
    { c: 'Places & Landmarks', t: 3, q: 'Which Slovenian lake is famous for a church on its tiny island and a castle on a cliff above?', a: 'Lake Bled', d: ['Lake Bohinj', 'Lake Ohrid', 'Lake Balaton'] },
    { c: 'Places & Landmarks', t: 4, q: 'The Iron Bridge of 1779, the first large bridge cast in that metal, spans which English river?', a: 'The Severn', d: ['The Trent', 'The Tyne', 'The Mersey'], from: 'atlas:d50q19' },
    { c: 'Places & Landmarks', t: 5, q: 'Nan Madol, a ruined city of basalt log walls raised on artificial islets, lies off which Micronesian island?', a: 'Pohnpei', d: ['Yap', 'Kosrae', 'Chuuk'], from: 'atlas:d44q24' },
  ],
  // 2026-12-26
  [
    { c: 'Places & Landmarks', t: 1, q: 'Which US city is nicknamed the Mile High City?', a: 'Denver', d: ['Salt Lake City', 'Albuquerque', 'Boise'] },
    { c: 'Places & Landmarks', t: 2, q: 'In 1607 English colonists founded their first permanent settlement in America at which place in Virginia?', a: 'Jamestown', d: ['Plymouth', 'Williamsburg', 'Roanoke'] },
    { c: 'Places & Landmarks', t: 3, q: 'Which Egyptian resort at the southern tip of the Sinai is famous for Red Sea diving?', a: 'Sharm el-Sheikh', d: ['Hurghada', 'Dahab', 'Marsa Alam'] },
    { c: 'Places & Landmarks', t: 4, q: 'The Pena Palace and the Moorish Castle crown the hills above which Portuguese town?', a: 'Sintra', d: ['Cascais', 'Evora', 'Obidos'] },
    { c: 'Places & Landmarks', t: 5, q: 'The Flame Towers rise above the walled old town of which Caspian port city?', a: 'Baku', d: ['Astrakhan', 'Aktau', 'Anzali'], from: 'atlas:d36q24' },
  ],
  // 2026-12-27
  [
    { c: 'Places & Landmarks', t: 1, q: 'Which Austrian city was Mozart\'s birthplace and the setting of The Sound of Music?', a: 'Salzburg', d: ['Vienna', 'Innsbruck', 'Graz'] },
    { c: 'Places & Landmarks', t: 2, q: 'Blarney Castle, with its stone said to grant the gift of eloquence, stands near which Irish city?', a: 'Cork', d: ['Galway', 'Limerick', 'Waterford'] },
    { c: 'Places & Landmarks', t: 3, q: 'Which Vietnamese town is famous for its lantern-lit old trading port and Japanese Covered Bridge?', a: 'Hoi An', d: ['Hue', 'Da Nang', 'Nha Trang'] },
    { c: 'Places & Landmarks', t: 4, q: 'Which Istanbul palace was the main residence of the Ottoman sultans until the 1850s?', a: 'Topkapi Palace', d: ['Dolmabahce Palace', 'Beylerbeyi Palace', 'Yildiz Palace'], from: 'atlas:d52q19' },
    { c: 'Places & Landmarks', t: 5, q: 'Which Baltic port city was known as Konigsberg before 1946?', a: 'Kaliningrad', d: ['Gdansk', 'Klaipeda', 'Riga'], from: 'atlas:d04q24' },
  ],
  // 2026-12-28
  [
    { c: 'Places & Landmarks', t: 1, q: 'Which Vietnamese bay is famous for its thousands of limestone islands rising from the sea?', a: 'Ha Long Bay', d: ['Cam Ranh Bay', 'Nha Trang Bay', 'Lan Ha Bay'] },
    { c: 'Places & Landmarks', t: 2, q: 'Which crater, a huge collapsed volcano full of wildlife, lies in northern Tanzania?', a: 'The Ngorongoro Crater', d: ['The Menengai Crater', 'Crater Lake', 'The Ramon Crater'] },
    { c: 'Places & Landmarks', t: 3, q: 'The Palace of the Popes, seat of the papacy in the 1300s, stands in which French city?', a: 'Avignon', d: ['Arles', 'Nimes', 'Lyon'] },
    { c: 'Places & Landmarks', t: 4, q: 'The locks of the Panama Canal lift ships up to which artificial lake in the middle of the crossing?', a: 'Gatun Lake', d: ['Culebra Lake', 'Lake Chagres', 'Miraflores Lake'], from: 'atlas:d57q19' },
    { c: 'Places & Landmarks', t: 5, q: 'The dry stone enclosures of Great Zimbabwe were raised by ancestors of which people?', a: 'The Shona', d: ['The Swahili', 'The Zulu', 'The Xhosa'], from: 'atlas:d43q24' },
  ],
  // 2026-12-29
  [
    { c: 'Places & Landmarks', t: 1, q: 'Which English town was the birthplace of William Shakespeare?', a: 'Stratford-upon-Avon', d: ['Oxford', 'Warwick', 'Canterbury'] },
    { c: 'Places & Landmarks', t: 2, q: 'Which Belgian city is famous for its canals, lace and medieval belfry?', a: 'Bruges', d: ['Antwerp', 'Ghent', 'Liege'] },
    { c: 'Places & Landmarks', t: 3, q: 'Which Indian state is famous for houseboat cruises on its palm-fringed backwaters?', a: 'Kerala', d: ['Goa', 'Tamil Nadu', 'Odisha'] },
    { c: 'Places & Landmarks', t: 4, q: 'The crown and spire of the Chrysler Building in New York are clad in which material?', a: 'Stainless steel', d: ['Copper sheet', 'Gold leaf', 'Cast bronze'], from: 'atlas:d54q19' },
    { c: 'Places & Landmarks', t: 5, q: 'The Chocolate Hills, hundreds of rounded green mounds, rise on which Philippine island?', a: 'Bohol', d: ['Cebu', 'Palawan', 'Mindoro'], from: 'atlas:d19q24' },
  ],
  // 2026-12-30
  [
    { c: 'Places & Landmarks', t: 1, q: 'Which Scottish seaside town is known as the home of golf?', a: 'St Andrews', d: ['Aberdeen', 'Troon', 'Dundee'] },
    { c: 'Places & Landmarks', t: 2, q: 'NASA\'s Johnson Space Center, home of mission control, is in which city?', a: 'Houston', d: ['Orlando', 'Huntsville', 'Dallas'] },
    { c: 'Places & Landmarks', t: 3, q: 'The vast temple complex of Karnak stands beside which Egyptian city?', a: 'Luxor', d: ['Aswan', 'Alexandria', 'Giza'], from: 'atlas:d13q14' },
    { c: 'Places & Landmarks', t: 4, q: 'The waterfront arch known as the Gateway of India stands in which city?', a: 'Mumbai', d: ['Chennai', 'Kolkata', 'Kochi'], from: 'atlas:d26q19' },
    { c: 'Places & Landmarks', t: 5, q: 'Which Turkish site is famous for its white travertine terraces of mineral pools?', a: 'Pamukkale', d: ['Cappadocia', 'Ephesus', 'Troy'], from: 'atlas:d40q24' },
  ],
  // 2026-12-31
  [
    { c: 'Places & Landmarks', t: 1, q: 'Which island city at the end of the Florida Keys is the southernmost city in the continental United States?', a: 'Key West', d: ['Key Largo', 'Miami Beach', 'Marathon'] },
    { c: 'Places & Landmarks', t: 2, q: 'The Promenade des Anglais curves along the seafront of which French city?', a: 'Nice', d: ['Cannes', 'Marseille', 'Toulon'] },
    { c: 'Places & Landmarks', t: 3, q: 'Masada, Herod\'s mountaintop fortress, overlooks which body of water?', a: 'The Dead Sea', d: ['The Sea of Galilee', 'The Red Sea', 'The Mediterranean Sea'] },
    { c: 'Places & Landmarks', t: 4, q: 'The cube houses and the Erasmus Bridge are landmarks of which Dutch city?', a: 'Rotterdam', d: ['Hamburg', 'Antwerp', 'Marseille'], from: 'atlas:d28q19' },
    { c: 'Places & Landmarks', t: 5, q: 'Which canal links the North Sea to the Baltic Sea across the neck of Jutland?', a: 'Kiel Canal', d: ['Gota Canal', 'Corinth Canal', 'White Sea Canal'], from: 'atlas:d08q24' },
  ],
];
