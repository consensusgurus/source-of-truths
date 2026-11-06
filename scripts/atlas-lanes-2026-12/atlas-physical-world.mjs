// Physical World lane for Atlas days 99..129 (2026-12-01 to 2026-12-31), appended with
//   node scripts/gen-atlas.mjs scripts/atlas-lanes-2026-12 --through 2026-12-31
// An entry with `from` recycles a never-answered question (owner rule 2026-10-09).
export const LANE_DAYS = [
  // 2026-12-01
  [
    { c: 'Physical World', t: 1, q: 'The mitten-shaped Lower Peninsula belongs to which US state?', a: 'Michigan', d: ['Wisconsin', 'Minnesota', 'Ohio'] },
    { c: 'Physical World', t: 2, q: 'At Pittsburgh, the Allegheny and Monongahela rivers join to form which river?', a: 'The Ohio', d: ['The Susquehanna', 'The Delaware', 'The Potomac'] },
    { c: 'Physical World', t: 3, q: 'Which lake in the heart of Cambodia swells to several times its size in the monsoon season?', a: 'Tonle Sap', d: ['Inle Lake', 'Lake Toba', 'Songkhla Lake'] },
    { c: 'Physical World', t: 4, q: 'Which is the largest island of Norway\'s Svalbard archipelago?', a: 'Spitsbergen', d: ['Nordaustlandet', 'Edgeoya', 'Bear Island'] },
    { c: 'Physical World', t: 5, q: 'Which is generally considered the largest glacier in the world?', a: 'The Lambert Glacier', d: ['Vatnajokull', 'The Siachen Glacier', 'The Aletsch Glacier'], from: 'atlas:d30q22' },
  ],
  // 2026-12-02
  [
    { c: 'Physical World', t: 1, q: 'Chicago stands on the shore of which of the Great Lakes?', a: 'Lake Michigan', d: ['Lake Superior', 'Lake Huron', 'Lake Erie'] },
    { c: 'Physical World', t: 2, q: 'Which is the longest river in Great Britain?', a: 'The Severn', d: ['The Thames', 'The Trent', 'The Tyne'] },
    { c: 'Physical World', t: 3, q: 'Which mountain range runs along the French-Swiss border north of Lake Geneva?', a: 'The Jura Mountains', d: ['The Vosges', 'The Dolomites', 'The Black Forest'] },
    { c: 'Physical World', t: 4, q: 'Which is the largest island in the Philippine archipelago?', a: 'Luzon', d: ['Mindanao', 'Palawan', 'Samar'], from: 'atlas:d36q17' },
    { c: 'Physical World', t: 5, q: 'What is the name for an isolated peak of bedrock projecting above the surface of an ice sheet?', a: 'A nunatak', d: ['An arete', 'A drumlin', 'A horn'], from: 'atlas:d47q22' },
  ],
  // 2026-12-03
  [
    { c: 'Physical World', t: 1, q: 'Which sea do the dikes of the Netherlands hold back?', a: 'The North Sea', d: ['The Baltic Sea', 'The Irish Sea', 'The Black Sea'] },
    { c: 'Physical World', t: 2, q: 'Which is the highest mountain in England?', a: 'Scafell Pike', d: ['Helvellyn', 'Snowdon', 'Skiddaw'] },
    { c: 'Physical World', t: 3, q: 'Which narrow waterway links Lake Michigan with Lake Huron?', a: 'The Straits of Mackinac', d: ['The St. Clair River', 'The Detroit River', 'The Welland Canal'] },
    { c: 'Physical World', t: 4, q: 'Which is the largest freshwater lake in China?', a: 'Poyang Lake', d: ['Dongting Lake', 'Taihu Lake', 'Qinghai Lake'] },
    { c: 'Physical World', t: 5, q: 'What is the highest mountain on the Australian mainland?', a: 'Mount Kosciuszko', d: ['Mount Bogong', 'Mount Ossa', 'Mount Zeil'], from: 'atlas:d19q22' },
  ],
  // 2026-12-04
  [
    { c: 'Physical World', t: 1, q: 'Which long lake lies along the border of Vermont and New York?', a: 'Lake Champlain', d: ['Lake George', 'Lake Placid', 'Lake Ontario'] },
    { c: 'Physical World', t: 2, q: 'Which body of water separates Florida from Cuba?', a: 'The Straits of Florida', d: ['The Yucatan Channel', 'The Windward Passage', 'The Mona Passage'] },
    { c: 'Physical World', t: 3, q: 'Which volcano on Tenerife is the highest mountain in Spain?', a: 'Mount Teide', d: ['Mulhacen', 'Pico Aneto', 'Roque de los Muchachos'] },
    { c: 'Physical World', t: 4, q: 'Which mountain range runs along the border of Vietnam and Laos?', a: 'The Annamite Range', d: ['The Cardamom Mountains', 'The Arakan Mountains', 'The Dawna Range'] },
    { c: 'Physical World', t: 5, q: 'Which is the largest lake lying entirely within Canada?', a: 'Great Bear Lake', d: ['Great Slave Lake', 'Lake Winnipeg', 'Lake Athabasca'], from: 'atlas:d22q22' },
  ],
  // 2026-12-05
  [
    { c: 'Physical World', t: 1, q: 'The Bermuda Triangle lies in which ocean?', a: 'The Atlantic Ocean', d: ['The Pacific Ocean', 'The Indian Ocean', 'The Arctic Ocean'] },
    { c: 'Physical World', t: 2, q: 'Which chain of thin barrier islands lines the coast of North Carolina?', a: 'The Outer Banks', d: ['The Florida Keys', 'The Sea Islands', 'The Thousand Islands'] },
    { c: 'Physical World', t: 3, q: 'Which Alpine pass between Switzerland and Italy gave its name to a hospice and a breed of rescue dog?', a: 'The Great St Bernard Pass', d: ['The Simplon Pass', 'The Brenner Pass', 'The Gotthard Pass'] },
    { c: 'Physical World', t: 4, q: 'Which mountain range runs along India\'s western coast, separating the Deccan Plateau from the Arabian Sea?', a: 'The Western Ghats', d: ['The Eastern Ghats', 'The Aravalli Range', 'The Vindhya Range'], from: 'atlas:d13q17' },
    { c: 'Physical World', t: 5, q: 'What is the highest peak on the Iberian mainland?', a: 'Mulhacen', d: ['Aneto', 'Teide', 'Veleta'], from: 'atlas:d40q22' },
  ],
  // 2026-12-06
  [
    { c: 'Physical World', t: 1, q: 'Into which body of water does the Mississippi River empty?', a: 'The Gulf of Mexico', d: ['The Atlantic Ocean', 'The Caribbean Sea', 'The Pacific Ocean'] },
    { c: 'Physical World', t: 2, q: 'Which is the largest lake in the British Isles by surface area?', a: 'Lough Neagh', d: ['Loch Ness', 'Loch Lomond', 'Lough Corrib'] },
    { c: 'Physical World', t: 3, q: 'Which mountain range rises along the eastern edge of South Africa and Lesotho?', a: 'The Drakensberg', d: ['The Cederberg', 'The Atlas Mountains', 'The Ruwenzori'] },
    { c: 'Physical World', t: 4, q: 'Which warm current flows southward along the eastern coast of Australia?', a: 'The East Australian Current', d: ['The Leeuwin Current', 'The Agulhas Current', 'The Peru Current'], from: 'atlas:d06q17' },
    { c: 'Physical World', t: 5, q: 'What is the name of the world\'s largest salt flat, in Bolivia?', a: 'Salar de Uyuni', d: ['Salar de Atacama', 'Salinas Grandes', 'The Bonneville Salt Flats'], from: 'atlas:d16q22' },
  ],
  // 2026-12-07
  [
    { c: 'Physical World', t: 1, q: 'Into which ocean does the Columbia River flow?', a: 'The Pacific Ocean', d: ['The Atlantic Ocean', 'The Arctic Ocean', 'The Indian Ocean'] },
    { c: 'Physical World', t: 2, q: 'Which is the largest of the Hawaiian Islands?', a: 'Hawaii Island', d: ['Maui', 'Oahu', 'Kauai'] },
    { c: 'Physical World', t: 3, q: 'Which Kentucky national park protects the longest known cave system in the world?', a: 'Mammoth Cave', d: ['Carlsbad Caverns', 'Wind Cave', 'Jewel Cave'] },
    { c: 'Physical World', t: 4, q: 'Which is the highest mountain in Norway?', a: 'Galdhopiggen', d: ['Glittertind', 'Snohetta', 'Store Skagastolstind'] },
    { c: 'Physical World', t: 5, q: 'Which Central Asian lake shared by Kazakhstan and Uzbekistan has shrunk dramatically since the 1960s?', a: 'The Aral Sea', d: ['The Caspian Sea', 'The Dead Sea', 'Lake Balkhash'], from: 'atlas:d33q22' },
  ],
  // 2026-12-08
  [
    { c: 'Physical World', t: 1, q: 'Manaus, the largest city of the Brazilian rainforest, lies in the basin of which river?', a: 'The Amazon', d: ['The Orinoco', 'The Parana', 'The Congo'] },
    { c: 'Physical World', t: 2, q: 'Which range of volcanic peaks, including Mount Hood and Mount Shasta, runs through the Pacific Northwest?', a: 'The Cascade Range', d: ['The Coast Mountains', 'The Sierra Nevada', 'The Bitterroot Range'] },
    { c: 'Physical World', t: 3, q: 'Which is the highest mountain in Africa?', a: 'Mount Kilimanjaro', d: ['Mount Kenya', 'Mount Stanley', 'Ras Dashen'], from: 'atlas:d41q12' },
    { c: 'Physical World', t: 4, q: 'Which is the highest mountain in Ireland?', a: 'Carrauntoohil', d: ['Slieve Donard', 'Lugnaquilla', 'Croagh Patrick'] },
    { c: 'Physical World', t: 5, q: 'Which strait connects the Persian Gulf to the Gulf of Oman?', a: 'The Strait of Hormuz', d: ['The Strait of Malacca', 'The Bab el-Mandeb', 'The Strait of Tiran'], from: 'atlas:d36q22' },
  ],
  // 2026-12-09
  [
    { c: 'Physical World', t: 1, q: 'Which US state contains Mount Rainier, a volcano that towers over Seattle?', a: 'Washington', d: ['Oregon', 'Idaho', 'Montana'] },
    { c: 'Physical World', t: 2, q: 'Which great river flows out of Tibet and through Assam before joining the Ganges in Bangladesh?', a: 'The Brahmaputra', d: ['The Indus', 'The Irrawaddy', 'The Salween'] },
    { c: 'Physical World', t: 3, q: 'Which is the highest mountain in Austria?', a: 'The Grossglockner', d: ['The Wildspitze', 'The Zugspitze', 'The Dachstein'] },
    { c: 'Physical World', t: 4, q: 'Which vast salt pan lies at the heart of a national park in northern Namibia?', a: 'The Etosha Pan', d: ['The Makgadikgadi Pan', 'The Sua Pan', 'Sossusvlei'] },
    { c: 'Physical World', t: 5, q: 'Which is the highest volcano in the world?', a: 'Ojos del Salado', d: ['Llullaillaco', 'Cotopaxi', 'Popocatepetl'], from: 'atlas:d23q22' },
  ],
  // 2026-12-10
  [
    { c: 'Physical World', t: 1, q: 'Which ocean lies directly south of India?', a: 'The Indian Ocean', d: ['The Pacific Ocean', 'The Atlantic Ocean', 'The Arctic Ocean'] },
    { c: 'Physical World', t: 2, q: 'Which channel separates Madagascar from the African mainland?', a: 'The Mozambique Channel', d: ['The Strait of Hormuz', 'The Gulf of Aden', 'The Palk Strait'] },
    { c: 'Physical World', t: 3, q: 'Which reservoir on the Colorado River was formed by the Hoover Dam?', a: 'Lake Mead', d: ['Lake Powell', 'Lake Havasu', 'Lake Tahoe'] },
    { c: 'Physical World', t: 4, q: 'What is the highest peak in the Caucasus range?', a: 'Mount Elbrus', d: ['Mount Kazbek', 'Shkhara', 'Mount Ushba'], from: 'atlas:d28q17' },
    { c: 'Physical World', t: 5, q: 'Which African lake is the second-deepest lake in the world?', a: 'Lake Tanganyika', d: ['Lake Malawi', 'Lake Kivu', 'Lake Turkana'], from: 'atlas:d29q22' },
  ],
  // 2026-12-11
  [
    { c: 'Physical World', t: 1, q: 'The Great Smoky Mountains straddle Tennessee and which other state?', a: 'North Carolina', d: ['Kentucky', 'Virginia', 'Georgia'] },
    { c: 'Physical World', t: 2, q: 'Which river flows through Saint Petersburg into the Gulf of Finland?', a: 'The Neva', d: ['The Volga', 'The Dnieper', 'The Don'] },
    { c: 'Physical World', t: 3, q: 'Which inlet of the Pacific, dotted with islands, does the city of Seattle face?', a: 'Puget Sound', d: ['Hood Canal', 'San Francisco Bay', 'Monterey Bay'] },
    { c: 'Physical World', t: 4, q: 'Which is the highest peak in the Andes?', a: 'Aconcagua', d: ['Huascaran', 'Illimani', 'Nevado Sajama'], from: 'atlas:d29q17' },
    { c: 'Physical World', t: 5, q: 'Which lake holds the largest volume of fresh water on Earth?', a: 'Lake Baikal', d: ['Lake Superior', 'Lake Tanganyika', 'Lake Michigan'], from: 'atlas:d28q22' },
  ],
  // 2026-12-12
  [
    { c: 'Physical World', t: 1, q: 'Lake Okeechobee, the largest natural freshwater lake in the Southeast, lies in which state?', a: 'Florida', d: ['Georgia', 'Louisiana', 'Alabama'] },
    { c: 'Physical World', t: 2, q: 'Which mountain range runs along the eastern shore of the Adriatic through Croatia, Bosnia and Montenegro?', a: 'The Dinaric Alps', d: ['The Carpathians', 'The Balkan Mountains', 'The Apennines'] },
    { c: 'Physical World', t: 3, q: 'What is the name of the high plateau that covers most of central Spain?', a: 'The Meseta', d: ['The Massif Central', 'The Deccan', 'The Altiplano'] },
    { c: 'Physical World', t: 4, q: 'Which mountain range separates the Iranian plateau from the lowlands of Mesopotamia?', a: 'The Zagros Mountains', d: ['The Hindu Kush', 'The Taurus Mountains', 'The Alborz Mountains'], from: 'atlas:d42q17' },
    { c: 'Physical World', t: 5, q: 'What is the highest peak in the Apennines?', a: 'Corno Grande', d: ['Monte Cimone', 'Monte Amaro', 'Monte Vettore'], from: 'atlas:d41q22' },
  ],
  // 2026-12-13
  [
    { c: 'Physical World', t: 1, q: 'Which sea, lying at the lowest point on land, is so salty that swimmers float with ease?', a: 'The Dead Sea', d: ['The Red Sea', 'The Caspian Sea', 'The Black Sea'] },
    { c: 'Physical World', t: 2, q: 'Which river flows through the Australian city of Melbourne?', a: 'The Yarra', d: ['The Murray', 'The Swan', 'The Torrens'] },
    { c: 'Physical World', t: 3, q: 'Which canal links the Mediterranean Sea with the Red Sea?', a: 'The Suez Canal', d: ['The Corinth Canal', 'The Kiel Canal', 'The Panama Canal'], from: 'atlas:d42q12' },
    { c: 'Physical World', t: 4, q: 'Kangchenjunga rises on the border of Nepal and which Indian state?', a: 'Sikkim', d: ['Arunachal Pradesh', 'Himachal Pradesh', 'Assam'], from: 'atlas:d57q17' },
    { c: 'Physical World', t: 5, q: 'What is the name for the dry, dust-laden wind that blows off the Sahara across West Africa in winter?', a: 'The Harmattan', d: ['The Sirocco', 'The Khamsin', 'The Levanter'], from: 'atlas:d46q22' },
  ],
  // 2026-12-14
  [
    { c: 'Physical World', t: 1, q: 'Which large lake lies on the border of California and Nevada high in the Sierra Nevada?', a: 'Lake Tahoe', d: ['Lake Mead', 'Mono Lake', 'The Great Salt Lake'] },
    { c: 'Physical World', t: 2, q: 'Which island off the coast of Tanzania is famous for its spice plantations?', a: 'Zanzibar', d: ['Socotra', 'Mafia', 'Lamu'] },
    { c: 'Physical World', t: 3, q: 'Which bay, fed by the Susquehanna, is the largest estuary in the United States?', a: 'Chesapeake Bay', d: ['Delaware Bay', 'Tampa Bay', 'Mobile Bay'] },
    { c: 'Physical World', t: 4, q: 'What is the highest peak in the Rocky Mountains?', a: 'Mount Elbert', d: ['Mount Robson', 'Longs Peak', 'Pikes Peak'], from: 'atlas:d22q17' },
    { c: 'Physical World', t: 5, q: 'Which cape is the southernmost point of the African continent?', a: 'Cape Agulhas', d: ['The Cape of Good Hope', 'Cape Point', 'Cape Recife'], from: 'atlas:d13q22' },
  ],
  // 2026-12-15
  [
    { c: 'Physical World', t: 1, q: 'Which large island off Canada\'s Pacific coast holds the city of Victoria?', a: 'Vancouver Island', d: ['Prince Edward Island', 'Baffin Island', 'Newfoundland'] },
    { c: 'Physical World', t: 2, q: 'Which river marks much of the border between Washington and Oregon?', a: 'The Columbia', d: ['The Snake', 'The Willamette', 'The Sacramento'] },
    { c: 'Physical World', t: 3, q: 'Which river forms much of the border between Texas and Oklahoma?', a: 'The Red River', d: ['The Arkansas', 'The Brazos', 'The Pecos'] },
    { c: 'Physical World', t: 4, q: 'Which lake, New Zealand\'s largest, fills a volcanic caldera in the middle of the North Island?', a: 'Lake Taupo', d: ['Lake Wakatipu', 'Lake Rotorua', 'Lake Te Anau'] },
    { c: 'Physical World', t: 5, q: 'What is the highest mountain in Turkey?', a: 'Mount Ararat', d: ['Mount Erciyes', 'Mount Suphan', 'Kackar Mountain'], from: 'atlas:d08q22' },
  ],
  // 2026-12-16
  [
    { c: 'Physical World', t: 1, q: 'Which mountain range forms most of the border between Chile and Argentina?', a: 'The Andes', d: ['The Rockies', 'The Alps', 'The Atlas Mountains'] },
    { c: 'Physical World', t: 2, q: 'Which long river flows past Omaha and Kansas City before joining the Mississippi?', a: 'The Missouri', d: ['The Platte', 'The Arkansas', 'The Ohio'] },
    { c: 'Physical World', t: 3, q: 'Which narrow strait separates the island of Anglesey from mainland Wales?', a: 'The Menai Strait', d: ['The Solent', 'The Pentland Firth', 'The North Channel'] },
    { c: 'Physical World', t: 4, q: 'Which mountain range walls off the Iranian plateau from the Caspian Sea?', a: 'The Alborz', d: ['The Zagros', 'The Taurus', 'The Hindu Kush'], from: 'atlas:d41q17' },
    { c: 'Physical World', t: 5, q: 'What is the highest mountain in southern Africa?', a: 'Thabana Ntlenyana', d: ['Mafadi', 'Champagne Castle', 'Mont-aux-Sources'], from: 'atlas:d27q22' },
  ],
  // 2026-12-17
  [
    { c: 'Physical World', t: 1, q: 'Which hook-shaped peninsula juts into the Atlantic from southeastern Massachusetts?', a: 'Cape Cod', d: ['Cape May', 'Long Island', 'Cape Ann'] },
    { c: 'Physical World', t: 2, q: 'Which is the highest mountain in Canada?', a: 'Mount Logan', d: ['Mount Robson', 'Mount Saint Elias', 'Mount Waddington'] },
    { c: 'Physical World', t: 3, q: 'Which mountain pass links Pakistan with Afghanistan near Peshawar?', a: 'The Khyber Pass', d: ['The Bolan Pass', 'The Karakoram Pass', 'The Wakhan Corridor'] },
    { c: 'Physical World', t: 4, q: 'Which peninsula in Russia\'s far east holds more than a hundred volcanoes?', a: 'The Kamchatka Peninsula', d: ['The Kola Peninsula', 'The Taimyr Peninsula', 'The Chukchi Peninsula'], from: 'atlas:d09q17' },
    { c: 'Physical World', t: 5, q: 'What is the highest mountain in Antarctica?', a: 'Vinson Massif', d: ['Mount Erebus', 'Mount Sidley', 'Mount Kirkpatrick'], from: 'atlas:d02q22' },
  ],
  // 2026-12-18
  [
    { c: 'Physical World', t: 1, q: 'Into which sea does the Nile empty?', a: 'The Mediterranean Sea', d: ['The Red Sea', 'The Black Sea', 'The Arabian Sea'] },
    { c: 'Physical World', t: 2, q: 'Which mountain range stretches across northern Spain along the Bay of Biscay?', a: 'The Cantabrian Mountains', d: ['The Sierra Nevada', 'The Pyrenees', 'The Sierra Morena'] },
    { c: 'Physical World', t: 3, q: 'Which desert covers most of southern Israel?', a: 'The Negev', d: ['The Sinai', 'The Syrian Desert', 'The Rub\' al Khali'] },
    { c: 'Physical World', t: 4, q: 'Which highland massif rises in the middle of the Sahara in southern Algeria?', a: 'The Ahaggar Mountains', d: ['The Tibesti Mountains', 'The Air Mountains', 'The Rif'] },
    { c: 'Physical World', t: 5, q: 'Which is the largest island in the Canadian Arctic Archipelago?', a: 'Baffin Island', d: ['Victoria Island', 'Ellesmere Island', 'Devon Island'], from: 'atlas:d09q22' },
  ],
  // 2026-12-19
  [
    { c: 'Physical World', t: 1, q: 'Which huge bay cuts deep into the middle of northern Canada?', a: 'Hudson Bay', d: ['Baffin Bay', 'The Bay of Fundy', 'James Bay'] },
    { c: 'Physical World', t: 2, q: 'Which arm of the Atlantic separates Long Island from Connecticut?', a: 'Long Island Sound', d: ['Block Island Sound', 'Cape Cod Bay', 'Delaware Bay'] },
    { c: 'Physical World', t: 3, q: 'Which river flows through Portland, Oregon, before joining the Columbia?', a: 'The Willamette', d: ['The Snake', 'The Deschutes', 'The Rogue'] },
    { c: 'Physical World', t: 4, q: 'Which strait separates Sri Lanka from the Indian mainland?', a: 'The Palk Strait', d: ['The Malacca Strait', 'The Sunda Strait', 'The Bass Strait'], from: 'atlas:d40q17' },
    { c: 'Physical World', t: 5, q: 'Which ocean trench holds the Horizon Deep, the second-deepest known point on the seafloor?', a: 'The Tonga Trench', d: ['The Kuril-Kamchatka Trench', 'The Kermadec Trench', 'The Philippine Trench'], from: 'atlas:d48q22' },
  ],
  // 2026-12-20
  [
    { c: 'Physical World', t: 1, q: 'Which vast Florida wetland, called the river of grass, is a national park at the state\'s southern tip?', a: 'The Everglades', d: ['The Okefenokee', 'The Great Dismal Swamp', 'The Atchafalaya'] },
    { c: 'Physical World', t: 2, q: 'Which hill range runs down northern England and is often called the backbone of England?', a: 'The Pennines', d: ['The Cheviots', 'The Cotswolds', 'The Grampians'] },
    { c: 'Physical World', t: 3, q: 'Which mountain range in northeastern Italy is famous for its pale, jagged limestone peaks?', a: 'The Dolomites', d: ['The Apennines', 'The Julian Alps', 'The Maritime Alps'] },
    { c: 'Physical World', t: 4, q: 'Which is the longest river lying entirely within France?', a: 'The Loire', d: ['The Garonne', 'The Dordogne', 'The Charente'], from: 'atlas:d17q17' },
    { c: 'Physical World', t: 5, q: 'What is the highest mountain in Iran?', a: 'Mount Damavand', d: ['Zard-Kuh', 'Mount Sabalan', 'Alam-Kuh'], from: 'atlas:d21q22' },
  ],
  // 2026-12-21
  [
    { c: 'Physical World', t: 1, q: 'Which stretch of water separates England from France?', a: 'The English Channel', d: ['The North Sea', 'The Irish Sea', 'The Bay of Biscay'] },
    { c: 'Physical World', t: 2, q: 'Which is the largest of the Channel Islands?', a: 'Jersey', d: ['Guernsey', 'Alderney', 'Sark'] },
    { c: 'Physical World', t: 3, q: 'Which upland region of old volcanoes and plateaus covers much of south-central France?', a: 'The Massif Central', d: ['The Vosges', 'The Jura', 'The Meseta'] },
    { c: 'Physical World', t: 4, q: 'Which vast plateau, the highest and largest of its kind, rises just north of the Himalayas?', a: 'The Tibetan Plateau', d: ['The Deccan Plateau', 'The Iranian Plateau', 'The Anatolian Plateau'], from: 'atlas:d33q17' },
    { c: 'Physical World', t: 5, q: 'What is the highest peak in the contiguous United States?', a: 'Mount Whitney', d: ['Mount Rainier', 'Mount Elbert', 'Mount Shasta'], from: 'atlas:d26q22' },
  ],
  // 2026-12-22
  [
    { c: 'Physical World', t: 1, q: 'The Alps are a mountain range on which continent?', a: 'Europe', d: ['Asia', 'South America', 'Africa'] },
    { c: 'Physical World', t: 2, q: 'Which large island sits off the southeastern coast of China, across a strait about 100 miles wide?', a: 'Taiwan', d: ['Hainan', 'Okinawa', 'Luzon'] },
    { c: 'Physical World', t: 3, q: 'Which lake straddles the border of Switzerland and Italy, with Locarno at its northern end?', a: 'Lake Maggiore', d: ['Lake Como', 'Lake Garda', 'Lake Lugano'] },
    { c: 'Physical World', t: 4, q: 'Which strait separates the Japanese islands of Honshu and Hokkaido?', a: 'The Tsugaru Strait', d: ['The Kanmon Strait', 'The Korea Strait', 'The La Perouse Strait'], from: 'atlas:d54q17' },
    { c: 'Physical World', t: 5, q: 'Which is the longest glacier in the Karakoram range?', a: 'The Siachen Glacier', d: ['The Baltoro Glacier', 'The Biafo Glacier', 'The Hispar Glacier'], from: 'atlas:d05q22' },
  ],
  // 2026-12-23
  [
    { c: 'Physical World', t: 1, q: 'Which ocean lies between Europe and North America?', a: 'The Atlantic Ocean', d: ['The Pacific Ocean', 'The Indian Ocean', 'The Arctic Ocean'] },
    { c: 'Physical World', t: 2, q: 'Which river flows through the Scottish city of Glasgow?', a: 'The Clyde', d: ['The Tay', 'The Forth', 'The Dee'] },
    { c: 'Physical World', t: 3, q: 'Which is the largest island lying wholly within Indonesia?', a: 'Sumatra', d: ['Java', 'Sulawesi', 'Bali'] },
    { c: 'Physical World', t: 4, q: 'Which river carved Hells Canyon along the Idaho-Oregon border?', a: 'The Snake', d: ['The Columbia', 'The Salmon', 'The Clearwater'] },
    { c: 'Physical World', t: 5, q: 'What is the highest mountain in New Zealand?', a: 'Aoraki', d: ['Mount Tasman', 'Mount Aspiring', 'Mount Ruapehu'], from: 'atlas:d17q22' },
  ],
  // 2026-12-24
  [
    { c: 'Physical World', t: 1, q: 'Which US state is a chain of volcanic islands in the middle of the Pacific?', a: 'Hawaii', d: ['Alaska', 'California', 'Florida'] },
    { c: 'Physical World', t: 2, q: 'Which river joins the Rhone at the French city of Lyon?', a: 'The Saone', d: ['The Loire', 'The Garonne', 'The Isere'] },
    { c: 'Physical World', t: 3, q: 'The Danube rises in which wooded upland of southwestern Germany?', a: 'The Black Forest', d: ['The Bavarian Forest', 'The Harz', 'The Thuringian Forest'] },
    { c: 'Physical World', t: 4, q: 'Which is the largest island of the Lesser Antilles?', a: 'Trinidad', d: ['Martinique', 'Barbados', 'Guadeloupe'], from: 'atlas:d59q17' },
    { c: 'Physical World', t: 5, q: 'Which Central Asian desert covers most of Turkmenistan?', a: 'The Karakum Desert', d: ['The Kyzylkum Desert', 'The Registan Desert', 'The Betpak-Dala'], from: 'atlas:d25q22' },
  ],
  // 2026-12-25
  [
    { c: 'Physical World', t: 1, q: 'Which body of water lies off the west coast of India?', a: 'The Arabian Sea', d: ['The Bay of Bengal', 'The Red Sea', 'The Andaman Sea'] },
    { c: 'Physical World', t: 2, q: 'Which is the highest mountain in Greece?', a: 'Mount Olympus', d: ['Mount Parnassus', 'Mount Athos', 'Mount Ida'] },
    { c: 'Physical World', t: 3, q: 'Which is the largest lake in Scotland by surface area?', a: 'Loch Lomond', d: ['Loch Ness', 'Loch Awe', 'Loch Tay'] },
    { c: 'Physical World', t: 4, q: 'Which strait separates Vancouver Island from Washington state\'s Olympic Peninsula?', a: 'The Strait of Juan de Fuca', d: ['The Strait of Georgia', 'Puget Sound', 'Johnstone Strait'] },
    { c: 'Physical World', t: 5, q: 'Which is the highest peak of the Bernese Alps?', a: 'The Finsteraarhorn', d: ['The Eiger', 'The Jungfrau', 'The Aletschhorn'], from: 'atlas:d44q22' },
  ],
  // 2026-12-26
  [
    { c: 'Physical World', t: 1, q: 'In which ocean does the island of Madagascar lie?', a: 'The Indian Ocean', d: ['The Atlantic Ocean', 'The Pacific Ocean', 'The Southern Ocean'] },
    { c: 'Physical World', t: 2, q: 'Which bay of the Atlantic lies between western France and northern Spain?', a: 'The Bay of Biscay', d: ['The Bay of Cadiz', 'The Celtic Sea', 'The Gulf of Lion'] },
    { c: 'Physical World', t: 3, q: 'Which is the largest island of the Inner Hebrides?', a: 'Skye', d: ['Mull', 'Islay', 'Jura'] },
    { c: 'Physical World', t: 4, q: 'Which shallow sea is joined to the Black Sea by the Kerch Strait?', a: 'The Sea of Azov', d: ['The White Sea', 'The Sea of Marmara', 'The Aral Sea'], from: 'atlas:d43q17' },
    { c: 'Physical World', t: 5, q: 'What is the highest peak on the island of New Guinea?', a: 'Puncak Jaya', d: ['Mount Wilhelm', 'Mount Giluwe', 'Puncak Trikora'], from: 'atlas:d20q22' },
  ],
  // 2026-12-27
  [
    { c: 'Physical World', t: 1, q: 'Which chain of islands stretches west from Alaska toward Russia?', a: 'The Aleutian Islands', d: ['The Kuril Islands', 'The Hawaiian Islands', 'The Channel Islands'] },
    { c: 'Physical World', t: 2, q: 'Which is the highest mountain in Wales?', a: 'Snowdon', d: ['Scafell Pike', 'Ben Nevis', 'Slieve Donard'] },
    { c: 'Physical World', t: 3, q: 'Which river flows through Shanghai and meets the Yangtze near its mouth?', a: 'The Huangpu', d: ['The Pearl', 'The Yellow River', 'The Huai'] },
    { c: 'Physical World', t: 4, q: 'Which headland is the westernmost point of mainland Europe?', a: 'Cabo da Roca', d: ['Cape Wrath', 'Cape St. Vincent', 'Cape Finisterre'], from: 'atlas:d48q17' },
    { c: 'Physical World', t: 5, q: 'What is the highest peak in the Pyrenees?', a: 'Pico Aneto', d: ['Monte Perdido', 'Pic du Midi d\'Ossau', 'Mulhacen'], from: 'atlas:d24q22' },
  ],
  // 2026-12-28
  [
    { c: 'Physical World', t: 1, q: 'Which river flows past St. Louis, Memphis and New Orleans?', a: 'The Mississippi', d: ['The Missouri', 'The Ohio', 'The Rio Grande'] },
    { c: 'Physical World', t: 2, q: 'Mount Rushmore is carved into a granite peak in which range of hills?', a: 'The Black Hills', d: ['The Ozarks', 'The Badlands', 'The Bighorn Mountains'] },
    { c: 'Physical World', t: 3, q: 'Which bay between New Brunswick and Nova Scotia is famous for the highest tides in the world?', a: 'The Bay of Fundy', d: ['Hudson Bay', 'Cape Cod Bay', 'Chaleur Bay'] },
    { c: 'Physical World', t: 4, q: 'Which Alpine pass on the Austria-Italy border is the lowest of the major routes across the Alps?', a: 'The Brenner Pass', d: ['The Simplon Pass', 'The Stelvio Pass', 'The Great St Bernard Pass'] },
    { c: 'Physical World', t: 5, q: 'What is the tallest waterfall in Africa?', a: 'Tugela Falls', d: ['Kalambo Falls', 'Maletsunyane Falls', 'Ruacana Falls'], from: 'atlas:d06q22' },
  ],
  // 2026-12-29
  [
    { c: 'Physical World', t: 1, q: 'Which ocean lies off the west coast of South America?', a: 'The Pacific Ocean', d: ['The Atlantic Ocean', 'The Indian Ocean', 'The Southern Ocean'] },
    { c: 'Physical World', t: 2, q: 'Which river flows through Hanoi?', a: 'The Red River', d: ['The Mekong', 'The Perfume River', 'The Saigon River'] },
    { c: 'Physical World', t: 3, q: 'Which river flows through Moscow?', a: 'The Moskva', d: ['The Volga', 'The Neva', 'The Don'] },
    { c: 'Physical World', t: 4, q: 'Which mountain range runs between the Deccan Plateau and the Bay of Bengal?', a: 'The Eastern Ghats', d: ['The Aravalli Range', 'The Western Ghats', 'The Satpura Range'], from: 'atlas:d47q17' },
    { c: 'Physical World', t: 5, q: 'What is the highest peak in the Atlas Mountains?', a: 'Toubkal', d: ['Jbel Ouanoukrim', 'Mount Ayachi', 'Jbel Mgoun'], from: 'atlas:d18q22' },
  ],
  // 2026-12-30
  [
    { c: 'Physical World', t: 1, q: 'The Rocky Mountains run through the western part of which continent?', a: 'North America', d: ['South America', 'Europe', 'Asia'] },
    { c: 'Physical World', t: 2, q: 'Which is the longest river in Italy?', a: 'The Po', d: ['The Tiber', 'The Arno', 'The Adige'] },
    { c: 'Physical World', t: 3, q: 'Which Scottish island group off the northern tip of the mainland includes Mainland and Hoy?', a: 'Orkney', d: ['Shetland', 'The Hebrides', 'The Faroe Islands'] },
    { c: 'Physical World', t: 4, q: 'Which of the Great Lakes lies entirely within the United States?', a: 'Lake Michigan', d: ['Lake Huron', 'Lake Erie', 'Lake Ontario'], from: 'atlas:d08q17' },
    { c: 'Physical World', t: 5, q: 'Which strait separates the two main islands of New Zealand?', a: 'Cook Strait', d: ['Bass Strait', 'Foveaux Strait', 'Torres Strait'], from: 'atlas:d14q22' },
  ],
  // 2026-12-31
  [
    { c: 'Physical World', t: 1, q: 'Which river flows through Montreal and Quebec City to the Atlantic?', a: 'The St. Lawrence', d: ['The Hudson', 'The Ottawa', 'The Fraser'] },
    { c: 'Physical World', t: 2, q: 'Mount Washington, famous for its fierce winds, is the highest peak in which New England state?', a: 'New Hampshire', d: ['Vermont', 'Maine', 'Massachusetts'] },
    { c: 'Physical World', t: 3, q: 'Which high mountain range forms part of the border between Poland and Slovakia?', a: 'The Tatras', d: ['The Sudetes', 'The Vosges', 'The Dinaric Alps'] },
    { c: 'Physical World', t: 4, q: 'Which cold ocean current flows northward along the western coast of South America?', a: 'The Humboldt Current', d: ['The Agulhas Current', 'The Brazil Current', 'The Leeuwin Current'], from: 'atlas:d26q17' },
    { c: 'Physical World', t: 5, q: 'Which waterfall plunges from a sandstone plateau on the Potaro River in Guyana?', a: 'Kaieteur Falls', d: ['Angel Falls', 'Tugela Falls', 'Yosemite Falls'], from: 'atlas:d42q22' },
  ],
];
