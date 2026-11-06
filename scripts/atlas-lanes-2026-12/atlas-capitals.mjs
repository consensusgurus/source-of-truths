// Capitals lane for Atlas days 99..129 (2026-12-01 to 2026-12-31), appended with
//   node scripts/gen-atlas.mjs scripts/atlas-lanes-2026-12 --through 2026-12-31
// An entry with `from` recycles a never-answered question (owner rule 2026-10-09).
export const LANE_DAYS = [
  // 2026-12-01
  [
    { c: 'Capitals', t: 1, q: 'Which capital city has an old town called Gamla Stan?', a: 'Stockholm', d: ['Oslo', 'Copenhagen', 'Helsinki'] },
    { c: 'Capitals', t: 2, q: 'Which city is the capital of the Spanish region of Andalusia?', a: 'Seville', d: ['Granada', 'Malaga', 'Cordoba'] },
    { c: 'Capitals', t: 3, q: 'Which city is the capital of the Brazilian state of Minas Gerais?', a: 'Belo Horizonte', d: ['Uberlandia', 'Juiz de Fora', 'Ouro Preto'] },
    { c: 'Capitals', t: 4, q: 'Which pair of national capitals face each other across the Congo River?', a: 'Kinshasa and Brazzaville', d: ['Bangui and Yaounde', 'Lome and Cotonou', 'Libreville and Malabo'], from: 'atlas:d48q16' },
    { c: 'Capitals', t: 5, q: 'Malé is the capital of which island country?', a: 'Maldives', d: ['Sri Lanka', 'Seychelles', 'Mauritius'], from: 'atlas:d09q21' },
  ],
  // 2026-12-02
  [
    { c: 'Capitals', t: 1, q: 'Which capital city is home to the Hallgrimskirkja church?', a: 'Reykjavik', d: ['Oslo', 'Helsinki', 'Copenhagen'] },
    { c: 'Capitals', t: 2, q: 'Which capital city is home to the Bob Marley Museum?', a: 'Kingston', d: ['Nassau', 'Port of Spain', 'Havana'] },
    { c: 'Capitals', t: 3, q: 'Which city is the capital of the Canadian territory of Yukon?', a: 'Whitehorse', d: ['Dawson City', 'Watson Lake', 'Yellowknife'] },
    { c: 'Capitals', t: 4, q: 'Which city is the capital of Zimbabwe?', a: 'Harare', d: ['Bulawayo', 'Mutare', 'Gweru'], from: 'atlas:d22q16' },
    { c: 'Capitals', t: 5, q: 'Which city was the first capital of independent Greece, from 1829 to 1834?', a: 'Nafplio', d: ['Thessaloniki', 'Patras', 'Corinth'], from: 'atlas:d43q21' },
  ],
  // 2026-12-03
  [
    { c: 'Capitals', t: 1, q: 'Which capital city is home to Parliament Hill and the Rideau Canal?', a: 'Ottawa', d: ['Toronto', 'Montreal', 'Vancouver'] },
    { c: 'Capitals', t: 2, q: 'Which capital city is home to the vast Palace of the Parliament built under Nicolae Ceausescu?', a: 'Bucharest', d: ['Sofia', 'Budapest', 'Belgrade'] },
    { c: 'Capitals', t: 3, q: 'Which capital city hosted the 1952 Summer Olympics?', a: 'Helsinki', d: ['Oslo', 'Stockholm', 'Copenhagen'] },
    { c: 'Capitals', t: 4, q: 'Which city is the capital of the German state of Schleswig-Holstein?', a: 'Kiel', d: ['Lubeck', 'Flensburg', 'Neumunster'] },
    { c: 'Capitals', t: 5, q: 'Which city is Bolivia\'s constitutional capital and the seat of its judiciary?', a: 'Sucre', d: ['La Paz', 'Santa Cruz de la Sierra', 'Cochabamba'], from: 'atlas:d26q21' },
  ],
  // 2026-12-04
  [
    { c: 'Capitals', t: 1, q: 'Which capital city is home to the Reichstag building with its glass dome?', a: 'Berlin', d: ['Vienna', 'Bern', 'Prague'] },
    { c: 'Capitals', t: 2, q: 'Which city is the capital of the Japanese island of Hokkaido?', a: 'Sapporo', d: ['Hakodate', 'Sendai', 'Asahikawa'] },
    { c: 'Capitals', t: 3, q: 'Which capital city did Francisco Pizarro found in 1535 as the City of Kings?', a: 'Lima', d: ['Quito', 'Bogota', 'Santiago'] },
    { c: 'Capitals', t: 4, q: 'Which city is the capital of Wisconsin?', a: 'Madison', d: ['Milwaukee', 'Green Bay', 'Kenosha'], from: 'atlas:d06q16' },
    { c: 'Capitals', t: 5, q: 'Freetown is the capital of which country?', a: 'Sierra Leone', d: ['Liberia', 'Guinea', 'Gambia'], from: 'atlas:d41q21' },
  ],
  // 2026-12-05
  [
    { c: 'Capitals', t: 1, q: 'Which capital city is home to Wat Pho and its giant reclining Buddha?', a: 'Bangkok', d: ['Hanoi', 'Vientiane', 'Phnom Penh'] },
    { c: 'Capitals', t: 2, q: 'Which city is the capital of the Australian state of Tasmania?', a: 'Hobart', d: ['Launceston', 'Devonport', 'Burnie'] },
    { c: 'Capitals', t: 3, q: 'Which city is the capital of the Italian region of Liguria?', a: 'Genoa', d: ['La Spezia', 'Savona', 'Sanremo'] },
    { c: 'Capitals', t: 4, q: 'Which city is the capital of the German state of Rhineland-Palatinate?', a: 'Mainz', d: ['Koblenz', 'Trier', 'Kaiserslautern'] },
    { c: 'Capitals', t: 5, q: 'Which city was the seat of the Portuguese court and empire from 1808 to 1821?', a: 'Rio de Janeiro', d: ['Recife', 'Belem', 'Salvador'], from: 'atlas:d57q21' },
  ],
  // 2026-12-06
  [
    { c: 'Capitals', t: 1, q: 'Which capital city is home to the Casa Rosada, the pink presidential palace?', a: 'Buenos Aires', d: ['Santiago', 'Lima', 'Montevideo'] },
    { c: 'Capitals', t: 2, q: 'Which capital city hosted the 1968 Summer Olympics?', a: 'Mexico City', d: ['Buenos Aires', 'Madrid', 'Lima'] },
    { c: 'Capitals', t: 3, q: 'Which city is the capital of the Indian state of Uttar Pradesh?', a: 'Lucknow', d: ['Kanpur', 'Varanasi', 'Agra'] },
    { c: 'Capitals', t: 4, q: 'Which city is the capital of Missouri?', a: 'Jefferson City', d: ['St. Louis', 'Kansas City', 'Springfield'], from: 'atlas:d28q16' },
    { c: 'Capitals', t: 5, q: 'Ashgabat is the capital of which country?', a: 'Turkmenistan', d: ['Uzbekistan', 'Azerbaijan', 'Kazakhstan'], from: 'atlas:d30q21' },
  ],
  // 2026-12-07
  [
    { c: 'Capitals', t: 1, q: 'The Royal Mile runs through the old town of which capital city?', a: 'Edinburgh', d: ['Dublin', 'Cardiff', 'London'] },
    { c: 'Capitals', t: 2, q: 'Which city is the capital of the Spanish region of Catalonia?', a: 'Barcelona', d: ['Girona', 'Tarragona', 'Valencia'] },
    { c: 'Capitals', t: 3, q: 'Which city is the capital of the Chinese province of Sichuan?', a: 'Chengdu', d: ['Chongqing', 'Mianyang', 'Leshan'] },
    { c: 'Capitals', t: 4, q: 'Which city is the capital of the Brazilian state of Para, at the mouth of the Amazon?', a: 'Belem', d: ['Manaus', 'Macapa', 'Sao Luis'] },
    { c: 'Capitals', t: 5, q: 'Which city is the capital of Brunei?', a: 'Bandar Seri Begawan', d: ['Kuching', 'Kota Kinabalu', 'Miri'], from: 'atlas:d28q21' },
  ],
  // 2026-12-08
  [
    { c: 'Capitals', t: 1, q: 'Which capital city hosts the award of the Nobel Peace Prize each year?', a: 'Oslo', d: ['Stockholm', 'Copenhagen', 'Helsinki'] },
    { c: 'Capitals', t: 2, q: 'Which city is the capital of the Indian state of Maharashtra?', a: 'Mumbai', d: ['Pune', 'Nagpur', 'Nashik'] },
    { c: 'Capitals', t: 3, q: 'Which capital city has a famous Dragon Bridge over the Ljubljanica River?', a: 'Ljubljana', d: ['Zagreb', 'Bratislava', 'Sarajevo'] },
    { c: 'Capitals', t: 4, q: 'Which capital city was known in Roman times as Philadelphia?', a: 'Amman', d: ['Damascus', 'Beirut', 'Jerusalem'] },
    { c: 'Capitals', t: 5, q: 'Which city was the capital of the Nguyen dynasty of Vietnam?', a: 'Hue', d: ['Hanoi', 'Hoi An', 'Da Nang'], from: 'atlas:d59q21' },
  ],
  // 2026-12-09
  [
    { c: 'Capitals', t: 1, q: 'Which capital city hosted the 1980 Summer Olympics, boycotted by the United States?', a: 'Moscow', d: ['Berlin', 'Warsaw', 'Prague'] },
    { c: 'Capitals', t: 2, q: 'Which city is the capital of the Canadian province of Nova Scotia?', a: 'Halifax', d: ['Sydney', 'Truro', 'Dartmouth'] },
    { c: 'Capitals', t: 3, q: 'Which city is the capital of the Canadian province of New Brunswick?', a: 'Fredericton', d: ['Moncton', 'Saint John', 'Halifax'] },
    { c: 'Capitals', t: 4, q: 'Which purpose-built city became Malaysia\'s federal administrative center in the 1990s?', a: 'Putrajaya', d: ['Johor Bahru', 'Ipoh', 'Shah Alam'], from: 'atlas:d57q16' },
    { c: 'Capitals', t: 5, q: 'Port Vila is the capital of which country?', a: 'Vanuatu', d: ['Fiji', 'Solomon Islands', 'Palau'], from: 'atlas:d20q21' },
  ],
  // 2026-12-10
  [
    { c: 'Capitals', t: 1, q: 'The Titanic was built in the shipyards of which capital city?', a: 'Belfast', d: ['Dublin', 'Cardiff', 'Edinburgh'] },
    { c: 'Capitals', t: 2, q: 'Which city is the capital of the Italian region of Veneto?', a: 'Venice', d: ['Verona', 'Padua', 'Vicenza'] },
    { c: 'Capitals', t: 3, q: 'Which capital city is home to the National Monument, a tall obelisk known as Monas?', a: 'Jakarta', d: ['Manila', 'Kuala Lumpur', 'Bangkok'] },
    { c: 'Capitals', t: 4, q: 'Which city is the capital of the German state of Thuringia?', a: 'Erfurt', d: ['Jena', 'Weimar', 'Gera'] },
    { c: 'Capitals', t: 5, q: 'Vientiane is the capital of which country?', a: 'Laos', d: ['Cambodia', 'Vietnam', 'Thailand'], from: 'atlas:d27q21' },
  ],
  // 2026-12-11
  [
    { c: 'Capitals', t: 1, q: 'Which capital city hosted the 2020 Summer Olympics, held a year late in 2021?', a: 'Tokyo', d: ['Beijing', 'Seoul', 'Paris'] },
    { c: 'Capitals', t: 2, q: 'Which city is the capital of the Australian Northern Territory?', a: 'Darwin', d: ['Alice Springs', 'Katherine', 'Perth'] },
    { c: 'Capitals', t: 3, q: 'Which city is the capital of the Italian island region of Sardinia?', a: 'Cagliari', d: ['Sassari', 'Olbia', 'Alghero'] },
    { c: 'Capitals', t: 4, q: 'Valletta is the capital of which country?', a: 'Malta', d: ['Cyprus', 'Monaco', 'San Marino'], from: 'atlas:d26q16' },
    { c: 'Capitals', t: 5, q: 'Which fortified hill town was the capital of Malta before the Knights arrived in 1530?', a: 'Mdina', d: ['Mosta', 'Zejtun', 'Birgu'], from: 'atlas:d53q21' },
  ],
  // 2026-12-12
  [
    { c: 'Capitals', t: 1, q: 'Which capital city is home to the Egyptian Museum on Tahrir Square?', a: 'Cairo', d: ['Amman', 'Tunis', 'Beirut'] },
    { c: 'Capitals', t: 2, q: 'Which city is the capital of the Italian region of Piedmont?', a: 'Turin', d: ['Milan', 'Genoa', 'Asti'] },
    { c: 'Capitals', t: 3, q: 'Which capital city has a historic center known for its Art Nouveau buildings and a Gothic House of the Blackheads?', a: 'Riga', d: ['Vilnius', 'Warsaw', 'Helsinki'] },
    { c: 'Capitals', t: 4, q: 'Which city is the capital of Canada\'s Northwest Territories?', a: 'Yellowknife', d: ['Inuvik', 'Hay River', 'Whitehorse'] },
    { c: 'Capitals', t: 5, q: 'Dushanbe is the capital of which country?', a: 'Tajikistan', d: ['Uzbekistan', 'Kyrgyzstan', 'Turkmenistan'], from: 'atlas:d03q21' },
  ],
  // 2026-12-13
  [
    { c: 'Capitals', t: 1, q: 'Which capital city is home to the Van Gogh Museum?', a: 'Amsterdam', d: ['Brussels', 'Paris', 'Copenhagen'] },
    { c: 'Capitals', t: 2, q: 'Which city is the capital of the Indian state of Tamil Nadu?', a: 'Chennai', d: ['Madurai', 'Coimbatore', 'Bengaluru'] },
    { c: 'Capitals', t: 3, q: 'Which city is the capital of the Chinese province of Zhejiang?', a: 'Hangzhou', d: ['Ningbo', 'Wenzhou', 'Suzhou'] },
    { c: 'Capitals', t: 4, q: 'Which city is the capital of Mississippi?', a: 'Jackson', d: ['Biloxi', 'Gulfport', 'Hattiesburg'], from: 'atlas:d33q16' },
    { c: 'Capitals', t: 5, q: 'Which city was Malawi\'s capital until 1975?', a: 'Zomba', d: ['Salima', 'Mzuzu', 'Blantyre'], from: 'atlas:d47q21' },
  ],
  // 2026-12-14
  [
    { c: 'Capitals', t: 1, q: 'Which capital city is home to the Szechenyi thermal baths?', a: 'Budapest', d: ['Vienna', 'Prague', 'Bratislava'] },
    { c: 'Capitals', t: 2, q: 'Which city is the capital of the Mexican state of Jalisco?', a: 'Guadalajara', d: ['Monterrey', 'Puebla', 'Tijuana'] },
    { c: 'Capitals', t: 3, q: 'Which capital city is home to the Alexander Nevsky Cathedral?', a: 'Sofia', d: ['Bucharest', 'Belgrade', 'Athens'] },
    { c: 'Capitals', t: 4, q: 'Which city is the capital of the German state of Brandenburg?', a: 'Potsdam', d: ['Cottbus', 'Frankfurt an der Oder', 'Brandenburg an der Havel'] },
    { c: 'Capitals', t: 5, q: 'Which city served as the capital of the Philippines from 1948 to 1976?', a: 'Quezon City', d: ['Cebu City', 'Iloilo City', 'Baguio'], from: 'atlas:d42q21' },
  ],
  // 2026-12-15
  [
    { c: 'Capitals', t: 1, q: 'Which capital city sits in a valley at the foot of the Andes in central Chile?', a: 'Santiago', d: ['Lima', 'Mendoza', 'La Paz'] },
    { c: 'Capitals', t: 2, q: 'Which capital city is home to the Gold Museum, with its huge collection of pre-Columbian gold?', a: 'Bogota', d: ['Lima', 'Quito', 'Caracas'] },
    { c: 'Capitals', t: 3, q: 'Which capital city\'s old Ottoman citadel quarter, the Casbah, is a World Heritage Site?', a: 'Algiers', d: ['Rabat', 'Tunis', 'Tripoli'] },
    { c: 'Capitals', t: 4, q: 'Which city is the capital of the Japanese prefecture of Okinawa?', a: 'Naha', d: ['Okinawa City', 'Nago', 'Urasoe'] },
    { c: 'Capitals', t: 5, q: 'Paramaribo is the capital of which country?', a: 'Suriname', d: ['Guyana', 'Trinidad and Tobago', 'Barbados'], from: 'atlas:d23q21' },
  ],
  // 2026-12-16
  [
    { c: 'Capitals', t: 1, q: 'In 2022, which capital city became the first to have hosted both the Summer and Winter Olympics?', a: 'Beijing', d: ['Tokyo', 'Seoul', 'Moscow'] },
    { c: 'Capitals', t: 2, q: 'Which city is the capital of the Chinese province of Guangdong?', a: 'Guangzhou', d: ['Shenzhen', 'Dongguan', 'Foshan'] },
    { c: 'Capitals', t: 3, q: 'Vaduz is the capital of which country?', a: 'Liechtenstein', d: ['Andorra', 'Monaco', 'San Marino'] },
    { c: 'Capitals', t: 4, q: 'Which city is the capital of Alabama?', a: 'Montgomery', d: ['Birmingham', 'Mobile', 'Huntsville'], from: 'atlas:d36q16' },
    { c: 'Capitals', t: 5, q: 'Which town holds the title of Old Royal Capital of Montenegro?', a: 'Cetinje', d: ['Niksic', 'Budva', 'Kotor'], from: 'atlas:d52q21' },
  ],
  // 2026-12-17
  [
    { c: 'Capitals', t: 1, q: 'Which capital city is home to the Manneken Pis statue?', a: 'Brussels', d: ['Amsterdam', 'Luxembourg', 'Paris'] },
    { c: 'Capitals', t: 2, q: 'Which city is the capital of the Italian island region of Sicily?', a: 'Palermo', d: ['Catania', 'Messina', 'Syracuse'] },
    { c: 'Capitals', t: 3, q: 'Which city is the capital of the Indian state of Bihar?', a: 'Patna', d: ['Gaya', 'Ranchi', 'Varanasi'] },
    { c: 'Capitals', t: 4, q: 'Which national capital is usually cited as the coldest by average annual temperature?', a: 'Ulaanbaatar', d: ['Reykjavik', 'Helsinki', 'Moscow'], from: 'atlas:d43q16' },
    { c: 'Capitals', t: 5, q: 'N\'Djamena is the capital of which country?', a: 'Chad', d: ['Niger', 'Central African Republic', 'Sudan'], from: 'atlas:d14q21' },
  ],
  // 2026-12-18
  [
    { c: 'Capitals', t: 1, q: 'Which capital city stands on the Dnipro River?', a: 'Kyiv', d: ['Minsk', 'Moscow', 'Warsaw'] },
    { c: 'Capitals', t: 2, q: 'Which city is the capital of Spain\'s Balearic Islands?', a: 'Palma', d: ['Ibiza Town', 'Mahon', 'Alcudia'] },
    { c: 'Capitals', t: 3, q: 'Which capital city is home to the unfinished Hassan Tower and the Mausoleum of Mohammed V?', a: 'Rabat', d: ['Algiers', 'Tunis', 'Tripoli'] },
    { c: 'Capitals', t: 4, q: 'Which city is the capital of the Indian state of Gujarat?', a: 'Gandhinagar', d: ['Ahmedabad', 'Surat', 'Vadodara'] },
    { c: 'Capitals', t: 5, q: 'Gaborone is the capital of which country?', a: 'Botswana', d: ['Namibia', 'Zambia', 'Zimbabwe'], from: 'atlas:d13q21' },
  ],
  // 2026-12-19
  [
    { c: 'Capitals', t: 1, q: 'Which capital city is home to India Gate, a war memorial arch?', a: 'New Delhi', d: ['Mumbai', 'Kolkata', 'Dhaka'] },
    { c: 'Capitals', t: 2, q: 'Which city is the capital of the German state of Saxony?', a: 'Dresden', d: ['Leipzig', 'Chemnitz', 'Zwickau'] },
    { c: 'Capitals', t: 3, q: 'Which city is the capital of the Spanish region of Galicia?', a: 'Santiago de Compostela', d: ['A Coruna', 'Vigo', 'Lugo'] },
    { c: 'Capitals', t: 4, q: 'Which city is the capital of North Carolina?', a: 'Raleigh', d: ['Charlotte', 'Greensboro', 'Durham'], from: 'atlas:d08q16' },
    { c: 'Capitals', t: 5, q: 'Which city is Sri Lanka\'s legislative capital and the seat of its parliament?', a: 'Sri Jayawardenepura Kotte', d: ['Kandy', 'Galle', 'Colombo'], from: 'atlas:d54q21' },
  ],
  // 2026-12-20
  [
    { c: 'Capitals', t: 1, q: 'Which capital city is home to Te Papa, New Zealand\'s national museum?', a: 'Wellington', d: ['Auckland', 'Christchurch', 'Dunedin'] },
    { c: 'Capitals', t: 2, q: 'Which city is the capital of the Indian state of West Bengal?', a: 'Kolkata', d: ['Darjeeling', 'Siliguri', 'Howrah'] },
    { c: 'Capitals', t: 3, q: 'Which capital city is home to the Azadi Tower, built in 1971?', a: 'Tehran', d: ['Baghdad', 'Kabul', 'Ankara'] },
    { c: 'Capitals', t: 4, q: 'Which city is the capital of Oregon?', a: 'Salem', d: ['Portland', 'Eugene', 'Bend'], from: 'atlas:d17q16' },
    { c: 'Capitals', t: 5, q: 'Ngerulmud is the capital of which country?', a: 'Palau', d: ['Nauru', 'Marshall Islands', 'Micronesia'], from: 'atlas:d18q21' },
  ],
  // 2026-12-21
  [
    { c: 'Capitals', t: 1, q: 'Which capital city was built on the ruins of the Aztec capital Tenochtitlan?', a: 'Mexico City', d: ['Lima', 'Bogota', 'Guatemala City'] },
    { c: 'Capitals', t: 2, q: 'Which city is the capital of the Italian region of Campania?', a: 'Naples', d: ['Salerno', 'Bari', 'Palermo'] },
    { c: 'Capitals', t: 3, q: 'Which capital city contains Intramuros, its old walled Spanish quarter?', a: 'Manila', d: ['Jakarta', 'Hanoi', 'Bangkok'] },
    { c: 'Capitals', t: 4, q: 'Which capital city lies at the highest elevation of any in Europe?', a: 'Andorra la Vella', d: ['Madrid', 'Bern', 'Sofia'], from: 'atlas:d42q16' },
    { c: 'Capitals', t: 5, q: 'Which city was the capital of Northern Rhodesia until 1935?', a: 'Livingstone', d: ['Ndola', 'Kabwe', 'Kitwe'], from: 'atlas:d46q21' },
  ],
  // 2026-12-22
  [
    { c: 'Capitals', t: 1, q: 'Which capital city is nicknamed the Eternal City?', a: 'Rome', d: ['Athens', 'Paris', 'Vienna'] },
    { c: 'Capitals', t: 2, q: 'Which city is the capital of the Italian region of Lombardy?', a: 'Milan', d: ['Turin', 'Bergamo', 'Brescia'] },
    { c: 'Capitals', t: 3, q: 'Which city is the capital of the Mexican state of Nuevo Leon?', a: 'Monterrey', d: ['Saltillo', 'Torreon', 'Chihuahua'] },
    { c: 'Capitals', t: 4, q: 'Which city is the capital of the Basque Country in Spain?', a: 'Vitoria-Gasteiz', d: ['Bilbao', 'San Sebastian', 'Pamplona'] },
    { c: 'Capitals', t: 5, q: 'Maseru is the capital of which country?', a: 'Lesotho', d: ['Eswatini', 'Namibia', 'Malawi'], from: 'atlas:d08q21' },
  ],
  // 2026-12-23
  [
    { c: 'Capitals', t: 1, q: 'The colorful old waterfront of Nyhavn lies in which capital city?', a: 'Copenhagen', d: ['Oslo', 'Stockholm', 'Amsterdam'] },
    { c: 'Capitals', t: 2, q: 'Which city is the capital of the Indian state of Telangana?', a: 'Hyderabad', d: ['Warangal', 'Vijayawada', 'Bengaluru'] },
    { c: 'Capitals', t: 3, q: 'Which city is the capital of the Brazilian state of Bahia?', a: 'Salvador', d: ['Recife', 'Fortaleza', 'Natal'] },
    { c: 'Capitals', t: 4, q: 'Yerevan is the capital of which country?', a: 'Armenia', d: ['Azerbaijan', 'Moldova', 'Belarus'], from: 'atlas:d09q16' },
    { c: 'Capitals', t: 5, q: 'Belmopan is the capital of which country?', a: 'Belize', d: ['Guatemala', 'Honduras', 'Nicaragua'], from: 'atlas:d02q21' },
  ],
  // 2026-12-24
  [
    { c: 'Capitals', t: 1, q: 'Which capital city hosted the first modern Olympic Games in 1896?', a: 'Athens', d: ['Paris', 'London', 'Rome'] },
    { c: 'Capitals', t: 2, q: 'Which is the only South American national capital on the Pacific coast?', a: 'Lima', d: ['Santiago', 'Quito', 'Bogota'] },
    { c: 'Capitals', t: 3, q: 'Which city serves as the capital of Haiti?', a: 'Port-au-Prince', d: ['Cap-Haitien', 'Gonaives', 'Jacmel'], from: 'atlas:d41q11' },
    { c: 'Capitals', t: 4, q: 'Which city is the capital of South Dakota?', a: 'Pierre', d: ['Sioux Falls', 'Rapid City', 'Aberdeen'], from: 'atlas:d29q16' },
    { c: 'Capitals', t: 5, q: 'Which city was Italy\'s capital from 1865 to 1871?', a: 'Florence', d: ['Naples', 'Turin', 'Milan'], from: 'atlas:d50q21' },
  ],
  // 2026-12-25
  [
    { c: 'Capitals', t: 1, q: 'Which capital city rebuilt its old town brick by brick after it was destroyed in the Second World War?', a: 'Warsaw', d: ['Prague', 'Budapest', 'Vienna'] },
    { c: 'Capitals', t: 2, q: 'Which city is the capital of the Brazilian state of Amazonas?', a: 'Manaus', d: ['Belem', 'Porto Velho', 'Santarem'] },
    { c: 'Capitals', t: 3, q: 'Which city is the capital of the Mexican state of Yucatan?', a: 'Merida', d: ['Cancun', 'Campeche', 'Valladolid'] },
    { c: 'Capitals', t: 4, q: 'Which is the northernmost capital city of a sovereign state?', a: 'Reykjavik', d: ['Nuuk', 'Helsinki', 'Oslo'], from: 'atlas:d47q16' },
    { c: 'Capitals', t: 5, q: 'Which city was chosen in 1852 as a compromise capital to settle the rivalry between Leon and Granada?', a: 'Managua', d: ['Masaya', 'Chinandega', 'Matagalpa'], from: 'atlas:d48q21' },
  ],
  // 2026-12-26
  [
    { c: 'Capitals', t: 1, q: 'Which capital city hosted the 1988 Summer Olympics?', a: 'Seoul', d: ['Tokyo', 'Beijing', 'Bangkok'] },
    { c: 'Capitals', t: 2, q: 'Which capital city hosted the 1964 Summer Olympics, the first held in Asia?', a: 'Tokyo', d: ['Seoul', 'Beijing', 'Manila'] },
    { c: 'Capitals', t: 3, q: 'Which city is the capital of the German state of North Rhine-Westphalia?', a: 'Dusseldorf', d: ['Cologne', 'Dortmund', 'Essen'] },
    { c: 'Capitals', t: 4, q: 'Which city is Benin\'s official capital, although the government sits elsewhere?', a: 'Porto-Novo', d: ['Abomey', 'Parakou', 'Cotonou'], from: 'atlas:d54q16' },
    { c: 'Capitals', t: 5, q: 'Bishkek is the capital of which country?', a: 'Kyrgyzstan', d: ['Tajikistan', 'Turkmenistan', 'Uzbekistan'], from: 'atlas:d16q21' },
  ],
  // 2026-12-27
  [
    { c: 'Capitals', t: 1, q: 'Which capital city is home to the Puerta del Sol and the Royal Palace?', a: 'Madrid', d: ['Lisbon', 'Rome', 'Paris'] },
    { c: 'Capitals', t: 2, q: 'Which city is the capital of the Australian state of South Australia?', a: 'Adelaide', d: ['Perth', 'Darwin', 'Hobart'] },
    { c: 'Capitals', t: 3, q: 'Which capital city is home to the Umayyad Mosque, one of the oldest great mosques?', a: 'Damascus', d: ['Amman', 'Baghdad', 'Riyadh'] },
    { c: 'Capitals', t: 4, q: 'Which city is the capital of Maryland?', a: 'Annapolis', d: ['Baltimore', 'Rockville', 'Frederick'], from: 'atlas:d13q16' },
    { c: 'Capitals', t: 5, q: 'Moroni is the capital of which island country?', a: 'Comoros', d: ['Seychelles', 'Mauritius', 'Djibouti'], from: 'atlas:d24q21' },
  ],
  // 2026-12-28
  [
    { c: 'Capitals', t: 1, q: 'Which capital city is home to the Ho Chi Minh Mausoleum?', a: 'Hanoi', d: ['Vientiane', 'Phnom Penh', 'Bangkok'] },
    { c: 'Capitals', t: 2, q: 'Which capital city is home to Christ Church Cathedral and the Temple Bar district?', a: 'Dublin', d: ['Belfast', 'Cardiff', 'Edinburgh'] },
    { c: 'Capitals', t: 3, q: 'Which city is the capital of the German state of Lower Saxony?', a: 'Hanover', d: ['Brunswick', 'Osnabruck', 'Bremen'] },
    { c: 'Capitals', t: 4, q: 'Which city is the capital of the German state of Hesse?', a: 'Wiesbaden', d: ['Frankfurt', 'Kassel', 'Darmstadt'] },
    { c: 'Capitals', t: 5, q: 'Which town was Bhutan\'s capital before Thimphu became the year-round seat of government in 1955?', a: 'Punakha', d: ['Trongsa', 'Phuentsholing', 'Paro'], from: 'atlas:d44q21' },
  ],
  // 2026-12-29
  [
    { c: 'Capitals', t: 1, q: 'Which capital city is famous for its seafront Malecon and its vintage American cars?', a: 'Havana', d: ['San Juan', 'Nassau', 'Kingston'] },
    { c: 'Capitals', t: 2, q: 'Which city is the capital of the Australian state of Western Australia?', a: 'Perth', d: ['Adelaide', 'Darwin', 'Hobart'] },
    { c: 'Capitals', t: 3, q: 'Which city is the capital of the Spanish region of Aragon?', a: 'Zaragoza', d: ['Huesca', 'Teruel', 'Pamplona'] },
    { c: 'Capitals', t: 4, q: 'Bamako is the capital of which country?', a: 'Mali', d: ['Niger', 'Senegal', 'Guinea'], from: 'atlas:d41q16' },
    { c: 'Capitals', t: 5, q: 'Which city is the seat of South Africa\'s executive branch and its administrative capital?', a: 'Pretoria', d: ['Cape Town', 'Johannesburg', 'Bloemfontein'], from: 'atlas:d17q21' },
  ],
  // 2026-12-30
  [
    { c: 'Capitals', t: 1, q: 'Which capital city is home to the United States Capitol and the Supreme Court?', a: 'Washington, D.C.', d: ['New York City', 'Philadelphia', 'Boston'] },
    { c: 'Capitals', t: 2, q: 'Which city is the capital of the German state of Bavaria?', a: 'Munich', d: ['Nuremberg', 'Augsburg', 'Stuttgart'] },
    { c: 'Capitals', t: 3, q: 'Which city is the capital of the German state of Baden-Wurttemberg?', a: 'Stuttgart', d: ['Karlsruhe', 'Mannheim', 'Freiburg'] },
    { c: 'Capitals', t: 4, q: 'Kigali is the capital of which country?', a: 'Rwanda', d: ['Burundi', 'Uganda', 'Tanzania'], from: 'atlas:d40q16' },
    { c: 'Capitals', t: 5, q: 'Apia is the capital of which country?', a: 'Samoa', d: ['Fiji', 'Tuvalu', 'Solomon Islands'], from: 'atlas:d05q21' },
  ],
  // 2026-12-31
  [
    { c: 'Capitals', t: 1, q: 'Which capital city has a national park with lions and giraffes inside its city limits?', a: 'Nairobi', d: ['Kampala', 'Addis Ababa', 'Dodoma'] },
    { c: 'Capitals', t: 2, q: 'Which capital city is home to the Principality Stadium, once called the Millennium Stadium?', a: 'Cardiff', d: ['Edinburgh', 'Belfast', 'Dublin'] },
    { c: 'Capitals', t: 3, q: 'Which city is the capital of the Italian region of Emilia-Romagna?', a: 'Bologna', d: ['Modena', 'Parma', 'Ravenna'] },
    { c: 'Capitals', t: 4, q: 'Which city is the capital of the Chinese province of Yunnan?', a: 'Kunming', d: ['Dali', 'Lijiang', 'Guiyang'] },
    { c: 'Capitals', t: 5, q: 'Port Louis is the capital of which island country?', a: 'Mauritius', d: ['Seychelles', 'Comoros', 'Maldives'], from: 'atlas:d40q21' },
  ],
];
