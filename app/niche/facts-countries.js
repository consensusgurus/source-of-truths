// Niche facts: COUNTRIES (the Sunday universe). One row per sovereign state,
// aligned byte-for-byte with app/span/borders.js names so border attributes can
// be DERIVED from that verified graph rather than authored twice. Kosovo and
// Vatican City are in (matching Span); Palestine sits out (matching Span);
// Taiwan is included as an answer players will reach for.
//
// FIELD RULES (the generous-match principle: where a fact is arguable, the
// data says yes to BOTH readings, because a false accept costs a shrug and a
// false reject costs a player their guess):
//   c    continent codes, ARRAY: eu af as na sa oc. Transcontinental countries
//        carry both (Russia/Turkey/Kazakhstan/Azerbaijan/Georgia/Cyprus eu+as,
//        Egypt af+as, Indonesia/Timor-Leste as+oc, Trinidad na+sa).
//   ll   landlocked (Caspian-only counts as landlocked, the standard reading).
//   isl  territory entirely on islands (Ireland and the UK both qualify;
//        Malaysia and Denmark, with mainland-peninsula territory, do not).
//   pop  100 = clearly over 100 million; -1 = clearly under 1 million; absent
//        otherwise. Only the two clean-edged bands exist on purpose: no
//        borderline country sits within ~8% of either threshold.
//   cap  capital name(s). Every OFFICIAL or seat-of-government capital is
//        listed, so a capital-letter attribute accepts any of them.
//   sh   capital in the Southern Hemisphere.
//   eu   European Union member (the 27).
//   oly  has hosted a Summer Olympics (through the awarded 2032 games).
//   wc   has won the men's soccer World Cup (England's titles count for the
//        United Kingdom, the generous reading).
//   nato NATO member (the 32).
//   cw   Commonwealth of Nations member (the 56; a member suspended from the
//        councils is still a member, the generous reading).
//   a    typed aliases, lowercase (canonical names also match automatically).
export const COUNTRIES = [
  // ── Europe ──
  { t: 'Albania', c: ['eu'], nato: 1, cap: 'Tirana' },
  { t: 'Andorra', c: ['eu'], ll: 1, pop: -1, cap: 'Andorra la Vella' },
  { t: 'Austria', c: ['eu'], ll: 1, eu: 1, cap: 'Vienna' },
  { t: 'Belarus', c: ['eu'], ll: 1, cap: 'Minsk' },
  { t: 'Belgium', c: ['eu'], eu: 1, oly: 1, nato: 1, cap: 'Brussels' },
  { t: 'Bosnia and Herzegovina', a: ['bosnia', 'bosnia herzegovina'], c: ['eu'], cap: 'Sarajevo' },
  { t: 'Bulgaria', c: ['eu'], eu: 1, nato: 1, cap: 'Sofia' },
  { t: 'Croatia', c: ['eu'], eu: 1, nato: 1, cap: 'Zagreb' },
  { t: 'Czechia', a: ['czech republic'], c: ['eu'], ll: 1, eu: 1, nato: 1, cap: 'Prague' },
  { t: 'Denmark', c: ['eu'], eu: 1, nato: 1, cap: 'Copenhagen' },
  { t: 'Estonia', c: ['eu'], eu: 1, nato: 1, cap: 'Tallinn' },
  { t: 'Finland', c: ['eu'], eu: 1, oly: 1, nato: 1, cap: 'Helsinki' },
  { t: 'France', c: ['eu'], eu: 1, oly: 1, wc: 1, nato: 1, cap: 'Paris' },
  { t: 'Germany', c: ['eu'], eu: 1, oly: 1, wc: 1, nato: 1, cap: 'Berlin' },
  { t: 'Greece', c: ['eu'], eu: 1, oly: 1, nato: 1, cap: 'Athens' },
  { t: 'Hungary', c: ['eu'], ll: 1, eu: 1, nato: 1, cap: 'Budapest' },
  { t: 'Iceland', c: ['eu'], isl: 1, pop: -1, nato: 1, cap: 'Reykjavik' },
  { t: 'Ireland', c: ['eu'], isl: 1, eu: 1, cap: 'Dublin' },
  { t: 'Italy', c: ['eu'], eu: 1, oly: 1, wc: 1, nato: 1, cap: 'Rome' },
  { t: 'Kosovo', c: ['eu'], ll: 1, cap: 'Pristina' },
  { t: 'Latvia', c: ['eu'], eu: 1, nato: 1, cap: 'Riga' },
  { t: 'Liechtenstein', c: ['eu'], ll: 1, pop: -1, cap: 'Vaduz' },
  { t: 'Lithuania', c: ['eu'], eu: 1, nato: 1, cap: 'Vilnius' },
  { t: 'Luxembourg', c: ['eu'], ll: 1, pop: -1, eu: 1, nato: 1, cap: 'Luxembourg City' },
  { t: 'Malta', c: ['eu'], isl: 1, pop: -1, eu: 1, cw: 1, cap: 'Valletta' },
  { t: 'Moldova', c: ['eu'], ll: 1, cap: 'Chisinau' },
  { t: 'Monaco', c: ['eu'], pop: -1, cap: 'Monaco' },
  { t: 'Montenegro', c: ['eu'], pop: -1, nato: 1, cap: ['Podgorica', 'Cetinje'] },
  { t: 'Netherlands', a: ['holland', 'the netherlands'], c: ['eu'], eu: 1, oly: 1, nato: 1, cap: ['Amsterdam', 'The Hague'] },
  { t: 'North Macedonia', a: ['macedonia'], c: ['eu'], ll: 1, nato: 1, cap: 'Skopje' },
  { t: 'Norway', c: ['eu'], nato: 1, cap: 'Oslo' },
  { t: 'Poland', c: ['eu'], eu: 1, nato: 1, cap: 'Warsaw' },
  { t: 'Portugal', c: ['eu'], eu: 1, nato: 1, cap: 'Lisbon' },
  { t: 'Romania', c: ['eu'], eu: 1, nato: 1, cap: 'Bucharest' },
  { t: 'San Marino', c: ['eu'], ll: 1, pop: -1, cap: 'San Marino' },
  { t: 'Serbia', c: ['eu'], ll: 1, cap: 'Belgrade' },
  { t: 'Slovakia', c: ['eu'], ll: 1, eu: 1, nato: 1, cap: 'Bratislava' },
  { t: 'Slovenia', c: ['eu'], eu: 1, nato: 1, cap: 'Ljubljana' },
  { t: 'Spain', c: ['eu'], eu: 1, oly: 1, wc: 1, nato: 1, cap: 'Madrid' },
  { t: 'Sweden', c: ['eu'], eu: 1, oly: 1, nato: 1, cap: 'Stockholm' },
  { t: 'Switzerland', c: ['eu'], ll: 1, cap: 'Bern' },
  { t: 'Ukraine', c: ['eu'], cap: 'Kyiv' },
  { t: 'United Kingdom', a: ['uk', 'britain', 'great britain', 'england'], c: ['eu'], isl: 1, oly: 1, wc: 1, nato: 1, cw: 1, cap: 'London' },
  { t: 'Vatican City', a: ['vatican', 'holy see'], c: ['eu'], ll: 1, pop: -1, cap: 'Vatican City' },
  // ── transcontinental Europe/Asia ──
  { t: 'Russia', c: ['eu', 'as'], pop: 100, oly: 1, cap: 'Moscow' },
  { t: 'Turkey', a: ['turkiye'], c: ['eu', 'as'], nato: 1, cap: 'Ankara' },
  { t: 'Kazakhstan', c: ['eu', 'as'], ll: 1, cap: 'Astana' },
  { t: 'Azerbaijan', c: ['eu', 'as'], ll: 1, cap: 'Baku' },
  { t: 'Georgia', c: ['eu', 'as'], cap: 'Tbilisi' },
  { t: 'Armenia', c: ['eu', 'as'], ll: 1, cap: 'Yerevan' },
  { t: 'Cyprus', c: ['eu', 'as'], isl: 1, eu: 1, cw: 1, cap: 'Nicosia' },
  // ── Asia ──
  { t: 'Afghanistan', c: ['as'], ll: 1, cap: 'Kabul' },
  { t: 'Bahrain', c: ['as'], isl: 1, cap: 'Manama' },
  { t: 'Bangladesh', c: ['as'], pop: 100, cw: 1, cap: 'Dhaka' },
  { t: 'Bhutan', c: ['as'], ll: 1, pop: -1, cap: 'Thimphu' },
  { t: 'Brunei', c: ['as'], isl: 1, pop: -1, cw: 1, cap: 'Bandar Seri Begawan' },
  { t: 'Cambodia', c: ['as'], cap: 'Phnom Penh' },
  { t: 'China', c: ['as'], pop: 100, oly: 1, cap: 'Beijing' },
  { t: 'India', c: ['as'], pop: 100, cw: 1, cap: 'New Delhi' },
  { t: 'Indonesia', c: ['as', 'oc'], isl: 1, pop: 100, cap: 'Jakarta', sh: 1 },
  { t: 'Iran', c: ['as'], cap: 'Tehran' },
  { t: 'Iraq', c: ['as'], cap: 'Baghdad' },
  { t: 'Israel', c: ['as'], cap: ['Jerusalem', 'Tel Aviv'] },
  { t: 'Japan', c: ['as'], isl: 1, pop: 100, oly: 1, cap: 'Tokyo' },
  { t: 'Jordan', c: ['as'], cap: 'Amman' },
  { t: 'Kuwait', c: ['as'], cap: 'Kuwait City' },
  { t: 'Kyrgyzstan', a: ['kirghizia', 'kyrgyz republic'], c: ['as'], ll: 1, cap: 'Bishkek' },
  { t: 'Laos', c: ['as'], ll: 1, cap: 'Vientiane' },
  { t: 'Lebanon', c: ['as'], cap: 'Beirut' },
  { t: 'Malaysia', c: ['as'], cw: 1, cap: ['Kuala Lumpur', 'Putrajaya'] },
  { t: 'Maldives', c: ['as'], isl: 1, pop: -1, cw: 1, cap: 'Male' },
  { t: 'Mongolia', c: ['as'], ll: 1, cap: 'Ulaanbaatar' },
  { t: 'Myanmar', a: ['burma'], c: ['as'], cap: ['Naypyidaw', 'Yangon'] },
  { t: 'Nepal', c: ['as'], ll: 1, cap: 'Kathmandu' },
  { t: 'North Korea', a: ['dprk'], c: ['as'], cap: 'Pyongyang' },
  { t: 'Oman', c: ['as'], cap: 'Muscat' },
  { t: 'Pakistan', c: ['as'], pop: 100, cw: 1, cap: 'Islamabad' },
  { t: 'Philippines', c: ['as'], isl: 1, pop: 100, cap: 'Manila' },
  { t: 'Qatar', c: ['as'], cap: 'Doha' },
  { t: 'Saudi Arabia', a: ['ksa'], c: ['as'], cap: 'Riyadh' },
  { t: 'Singapore', c: ['as'], isl: 1, cw: 1, cap: 'Singapore' },
  { t: 'South Korea', a: ['republic of korea', 'korea'], c: ['as'], oly: 1, cap: 'Seoul' },
  { t: 'Sri Lanka', c: ['as'], isl: 1, cw: 1, cap: ['Sri Jayawardenepura Kotte', 'Colombo'] },
  { t: 'Syria', c: ['as'], cap: 'Damascus' },
  { t: 'Taiwan', c: ['as'], isl: 1, cap: 'Taipei' },
  { t: 'Tajikistan', c: ['as'], ll: 1, cap: 'Dushanbe' },
  { t: 'Thailand', c: ['as'], cap: 'Bangkok' },
  { t: 'Timor-Leste', a: ['east timor', 'timor leste'], c: ['as', 'oc'], isl: 1, cap: 'Dili', sh: 1 },
  { t: 'Turkmenistan', c: ['as'], ll: 1, cap: 'Ashgabat' },
  { t: 'United Arab Emirates', a: ['uae', 'emirates'], c: ['as'], cap: 'Abu Dhabi' },
  { t: 'Uzbekistan', c: ['as'], ll: 1, cap: 'Tashkent' },
  { t: 'Vietnam', c: ['as'], pop: 100, cap: 'Hanoi' },
  { t: 'Yemen', c: ['as'], cap: 'Sanaa' },
  // ── Africa ──
  { t: 'Algeria', c: ['af'], cap: 'Algiers' },
  { t: 'Angola', c: ['af'], cap: 'Luanda', sh: 1 },
  { t: 'Benin', c: ['af'], cap: ['Porto-Novo', 'Cotonou'] },
  { t: 'Botswana', c: ['af'], ll: 1, cw: 1, cap: 'Gaborone', sh: 1 },
  { t: 'Burkina Faso', c: ['af'], ll: 1, cap: 'Ouagadougou' },
  { t: 'Burundi', c: ['af'], ll: 1, cap: ['Gitega', 'Bujumbura'], sh: 1 },
  { t: 'Cameroon', c: ['af'], cw: 1, cap: 'Yaounde' },
  { t: 'Cape Verde', a: ['cabo verde'], c: ['af'], isl: 1, pop: -1, cap: 'Praia' },
  { t: 'Central African Republic', a: ['central african rep', 'car'], c: ['af'], ll: 1, cap: 'Bangui' },
  { t: 'Chad', c: ['af'], ll: 1, cap: "N'Djamena" },
  { t: 'Comoros', c: ['af'], isl: 1, pop: -1, cap: 'Moroni', sh: 1 },
  { t: 'Democratic Republic of the Congo', a: ['drc', 'dr congo', 'congo kinshasa', 'democratic republic of congo'], c: ['af'], pop: 100, cap: 'Kinshasa', sh: 1 },
  { t: 'Djibouti', c: ['af'], cap: 'Djibouti' },
  { t: 'Egypt', c: ['af', 'as'], pop: 100, cap: 'Cairo' },
  { t: 'Equatorial Guinea', c: ['af'], cap: 'Malabo' },
  { t: 'Eritrea', c: ['af'], cap: 'Asmara' },
  { t: 'Eswatini', a: ['swaziland'], c: ['af'], ll: 1, cw: 1, cap: ['Mbabane', 'Lobamba'], sh: 1 },
  { t: 'Ethiopia', c: ['af'], ll: 1, pop: 100, cap: 'Addis Ababa' },
  { t: 'Gabon', c: ['af'], cw: 1, cap: 'Libreville' },
  { t: 'Ghana', c: ['af'], cw: 1, cap: 'Accra' },
  { t: 'Guinea', c: ['af'], cap: 'Conakry' },
  { t: 'Guinea-Bissau', c: ['af'], cap: 'Bissau' },
  { t: 'Ivory Coast', a: ["cote d'ivoire", 'cote divoire'], c: ['af'], cap: ['Yamoussoukro', 'Abidjan'] },
  { t: 'Kenya', c: ['af'], cw: 1, cap: 'Nairobi', sh: 1 },
  { t: 'Lesotho', c: ['af'], ll: 1, cw: 1, cap: 'Maseru', sh: 1 },
  { t: 'Liberia', c: ['af'], cap: 'Monrovia' },
  { t: 'Libya', c: ['af'], cap: 'Tripoli' },
  { t: 'Madagascar', c: ['af'], isl: 1, cap: 'Antananarivo', sh: 1 },
  { t: 'Malawi', c: ['af'], ll: 1, cw: 1, cap: 'Lilongwe', sh: 1 },
  { t: 'Mali', c: ['af'], ll: 1, cap: 'Bamako' },
  { t: 'Mauritania', c: ['af'], cap: 'Nouakchott' },
  { t: 'Mauritius', c: ['af'], isl: 1, cw: 1, cap: 'Port Louis', sh: 1 },
  { t: 'Morocco', c: ['af'], cap: 'Rabat' },
  { t: 'Mozambique', c: ['af'], cw: 1, cap: 'Maputo', sh: 1 },
  { t: 'Namibia', c: ['af'], cw: 1, cap: 'Windhoek', sh: 1 },
  { t: 'Niger', c: ['af'], ll: 1, cap: 'Niamey' },
  { t: 'Nigeria', c: ['af'], pop: 100, cw: 1, cap: 'Abuja' },
  { t: 'Republic of the Congo', a: ['congo brazzaville', 'congo republic', 'republic of congo', 'congo'], c: ['af'], cap: 'Brazzaville', sh: 1 },
  { t: 'Rwanda', c: ['af'], ll: 1, cw: 1, cap: 'Kigali', sh: 1 },
  { t: 'Sao Tome and Principe', a: ['sao tome'], c: ['af'], isl: 1, pop: -1, cap: 'Sao Tome' },
  { t: 'Senegal', c: ['af'], cap: 'Dakar' },
  { t: 'Seychelles', c: ['af'], isl: 1, pop: -1, cw: 1, cap: 'Victoria', sh: 1 },
  { t: 'Sierra Leone', c: ['af'], cw: 1, cap: 'Freetown' },
  { t: 'Somalia', c: ['af'], cap: 'Mogadishu' },
  { t: 'South Africa', c: ['af'], cw: 1, cap: ['Pretoria', 'Cape Town', 'Bloemfontein'], sh: 1 },
  { t: 'South Sudan', c: ['af'], ll: 1, cap: 'Juba' },
  { t: 'Sudan', c: ['af'], cap: 'Khartoum' },
  { t: 'Tanzania', c: ['af'], cw: 1, cap: ['Dodoma', 'Dar es Salaam'], sh: 1 },
  { t: 'The Gambia', a: ['gambia'], c: ['af'], cw: 1, cap: 'Banjul' },
  { t: 'Togo', c: ['af'], cw: 1, cap: 'Lome' },
  { t: 'Tunisia', c: ['af'], cap: 'Tunis' },
  { t: 'Uganda', c: ['af'], ll: 1, cw: 1, cap: 'Kampala' },
  { t: 'Zambia', c: ['af'], ll: 1, cw: 1, cap: 'Lusaka', sh: 1 },
  { t: 'Zimbabwe', c: ['af'], ll: 1, cap: 'Harare', sh: 1 },
  // ── North & Central America, Caribbean ──
  { t: 'Antigua and Barbuda', a: ['antigua'], c: ['na'], isl: 1, pop: -1, cw: 1, cap: "Saint John's" },
  { t: 'Bahamas', a: ['the bahamas'], c: ['na'], isl: 1, pop: -1, cw: 1, cap: 'Nassau' },
  { t: 'Barbados', c: ['na'], isl: 1, pop: -1, cw: 1, cap: 'Bridgetown' },
  { t: 'Belize', c: ['na'], pop: -1, cw: 1, cap: 'Belmopan' },
  { t: 'Canada', c: ['na'], oly: 1, nato: 1, cw: 1, cap: 'Ottawa' },
  { t: 'Costa Rica', c: ['na'], cap: 'San Jose' },
  { t: 'Cuba', c: ['na'], isl: 1, cap: 'Havana' },
  { t: 'Dominica', c: ['na'], isl: 1, pop: -1, cw: 1, cap: 'Roseau' },
  { t: 'Dominican Republic', c: ['na'], isl: 1, cap: 'Santo Domingo' },
  { t: 'El Salvador', c: ['na'], cap: 'San Salvador' },
  { t: 'Grenada', c: ['na'], isl: 1, pop: -1, cw: 1, cap: "Saint George's" },
  { t: 'Guatemala', c: ['na'], cap: 'Guatemala City' },
  { t: 'Haiti', c: ['na'], isl: 1, cap: 'Port-au-Prince' },
  { t: 'Honduras', c: ['na'], cap: 'Tegucigalpa' },
  { t: 'Jamaica', c: ['na'], isl: 1, cw: 1, cap: 'Kingston' },
  { t: 'Mexico', c: ['na'], pop: 100, oly: 1, cap: 'Mexico City' },
  { t: 'Nicaragua', c: ['na'], cap: 'Managua' },
  { t: 'Panama', c: ['na'], cap: 'Panama City' },
  { t: 'Saint Kitts and Nevis', a: ['st kitts', 'saint kitts'], c: ['na'], isl: 1, pop: -1, cw: 1, cap: 'Basseterre' },
  { t: 'Saint Lucia', a: ['st lucia'], c: ['na'], isl: 1, pop: -1, cw: 1, cap: 'Castries' },
  { t: 'Saint Vincent and the Grenadines', a: ['st vincent', 'saint vincent'], c: ['na'], isl: 1, pop: -1, cw: 1, cap: 'Kingstown' },
  { t: 'Trinidad and Tobago', a: ['trinidad'], c: ['na', 'sa'], isl: 1, cw: 1, cap: 'Port of Spain' },
  { t: 'United States', a: ['usa', 'us', 'america', 'united states of america'], c: ['na'], pop: 100, oly: 1, nato: 1, cap: 'Washington' },
  // ── South America ──
  { t: 'Argentina', c: ['sa'], wc: 1, cap: 'Buenos Aires', sh: 1 },
  { t: 'Bolivia', c: ['sa'], ll: 1, cap: ['Sucre', 'La Paz'], sh: 1 },
  { t: 'Brazil', c: ['sa'], pop: 100, oly: 1, wc: 1, cap: 'Brasilia', sh: 1 },
  { t: 'Chile', c: ['sa'], cap: ['Santiago', 'Valparaiso'], sh: 1 },
  { t: 'Colombia', c: ['sa'], cap: 'Bogota' },
  { t: 'Ecuador', c: ['sa'], cap: 'Quito', sh: 1 },
  { t: 'Guyana', c: ['sa'], pop: -1, cw: 1, cap: 'Georgetown' },
  { t: 'Paraguay', c: ['sa'], ll: 1, cap: 'Asuncion', sh: 1 },
  { t: 'Peru', c: ['sa'], cap: 'Lima', sh: 1 },
  { t: 'Suriname', c: ['sa'], pop: -1, cap: 'Paramaribo' },
  { t: 'Uruguay', c: ['sa'], wc: 1, cap: 'Montevideo', sh: 1 },
  { t: 'Venezuela', c: ['sa'], cap: 'Caracas' },
  // ── Oceania ──
  { t: 'Australia', c: ['oc'], isl: 1, oly: 1, cw: 1, cap: 'Canberra', sh: 1 },
  { t: 'Fiji', c: ['oc'], isl: 1, pop: -1, cw: 1, cap: 'Suva', sh: 1 },
  { t: 'Kiribati', c: ['oc'], isl: 1, pop: -1, cw: 1, cap: 'Tarawa' },
  { t: 'Marshall Islands', c: ['oc'], isl: 1, pop: -1, cap: 'Majuro' },
  { t: 'Micronesia', a: ['federated states of micronesia'], c: ['oc'], isl: 1, pop: -1, cap: 'Palikir' },
  { t: 'Nauru', c: ['oc'], isl: 1, pop: -1, cw: 1, cap: 'Yaren', sh: 1 },
  { t: 'New Zealand', c: ['oc'], isl: 1, cw: 1, cap: 'Wellington', sh: 1 },
  { t: 'Palau', c: ['oc'], isl: 1, pop: -1, cap: ['Ngerulmud', 'Koror'] },
  { t: 'Papua New Guinea', a: ['png'], c: ['oc'], isl: 1, cw: 1, cap: 'Port Moresby', sh: 1 },
  { t: 'Samoa', c: ['oc'], isl: 1, pop: -1, cw: 1, cap: 'Apia', sh: 1 },
  { t: 'Solomon Islands', c: ['oc'], isl: 1, pop: -1, cw: 1, cap: 'Honiara', sh: 1 },
  { t: 'Tonga', c: ['oc'], isl: 1, pop: -1, cw: 1, cap: 'Nukualofa', sh: 1 },
  { t: 'Tuvalu', c: ['oc'], isl: 1, pop: -1, cw: 1, cap: 'Funafuti', sh: 1 },
  { t: 'Vanuatu', c: ['oc'], isl: 1, pop: -1, cw: 1, cap: 'Port Vila', sh: 1 },
];

// ── named memberships ────────────────────────────────────────────────────────
// Lists rather than per-row flags, because each is a short published roster and
// a list is auditable at a glance. scripts/verify-niche.mjs asserts BOTH the
// size of every list below and that every name in it resolves to a member, so
// a typo cannot silently shrink an attribute.

// The G20's nineteen sovereign members (the EU and the African Union, its two
// bloc members, are not countries).
export const G20 = new Set(['Argentina', 'Australia', 'Brazil', 'Canada', 'China', 'France', 'Germany', 'India', 'Indonesia', 'Italy', 'Japan', 'Mexico', 'Russia', 'Saudi Arabia', 'South Africa', 'South Korea', 'Turkey', 'United Kingdom', 'United States']);

// The Arab League's 22 members less Palestine, which sits out of this table.
// Syria, suspended in 2011, was readmitted in 2023 and is in.
export const ARAB_LEAGUE = new Set(['Algeria', 'Bahrain', 'Comoros', 'Djibouti', 'Egypt', 'Iraq', 'Jordan', 'Kuwait', 'Lebanon', 'Libya', 'Mauritania', 'Morocco', 'Oman', 'Qatar', 'Saudi Arabia', 'Somalia', 'Sudan', 'Syria', 'Tunisia', 'United Arab Emirates', 'Yemen']);

// Countries whose money is the euro: the 20 eurozone members, plus the four
// microstates that mint it under a monetary agreement (Andorra, Monaco, San
// Marino, Vatican City) and the two that adopted it unilaterally (Kosovo,
// Montenegro) — the generous reading, since all six genuinely use the euro.
export const EURO = new Set(['Austria', 'Belgium', 'Croatia', 'Cyprus', 'Estonia', 'Finland', 'France', 'Germany', 'Greece', 'Ireland', 'Italy', 'Latvia', 'Lithuania', 'Luxembourg', 'Malta', 'Netherlands', 'Portugal', 'Slovakia', 'Slovenia', 'Spain', 'Andorra', 'Monaco', 'San Marino', 'Vatican City', 'Kosovo', 'Montenegro']);

// Spanish as an official or co-official national language.
export const SPANISH = new Set(['Argentina', 'Bolivia', 'Chile', 'Colombia', 'Costa Rica', 'Cuba', 'Dominican Republic', 'Ecuador', 'El Salvador', 'Equatorial Guinea', 'Guatemala', 'Honduras', 'Mexico', 'Nicaragua', 'Panama', 'Paraguay', 'Peru', 'Spain', 'Uruguay', 'Venezuela']);

// French as an official or co-official national language.
export const FRENCH = new Set(['Belgium', 'Benin', 'Burkina Faso', 'Burundi', 'Cameroon', 'Canada', 'Central African Republic', 'Chad', 'Comoros', 'Democratic Republic of the Congo', 'Djibouti', 'Equatorial Guinea', 'France', 'Gabon', 'Guinea', 'Haiti', 'Ivory Coast', 'Luxembourg', 'Madagascar', 'Mali', 'Monaco', 'Niger', 'Republic of the Congo', 'Rwanda', 'Senegal', 'Seychelles', 'Switzerland', 'Togo', 'Vanuatu']);

// A monarchy: the head of state is a monarch. Elective monarchies count
// (Malaysia, Vatican City) and so do the Commonwealth realms, whose head of
// state is the British monarch. Barbados, a republic since 2021, is out.
export const MONARCHY = new Set(['Andorra', 'Belgium', 'Denmark', 'Liechtenstein', 'Luxembourg', 'Monaco', 'Netherlands', 'Norway', 'Spain', 'Sweden', 'United Kingdom', 'Vatican City', 'Bahrain', 'Bhutan', 'Brunei', 'Cambodia', 'Japan', 'Jordan', 'Kuwait', 'Malaysia', 'Oman', 'Qatar', 'Saudi Arabia', 'Thailand', 'United Arab Emirates', 'Eswatini', 'Lesotho', 'Morocco', 'Tonga', 'Antigua and Barbuda', 'Australia', 'Bahamas', 'Belize', 'Canada', 'Grenada', 'Jamaica', 'New Zealand', 'Papua New Guinea', 'Saint Kitts and Nevis', 'Saint Lucia', 'Saint Vincent and the Grenadines', 'Solomon Islands', 'Tuvalu']);

// The OECD's 38 members.
export const OECD = new Set(['Australia', 'Austria', 'Belgium', 'Canada', 'Chile', 'Colombia', 'Costa Rica', 'Czechia', 'Denmark', 'Estonia', 'Finland', 'France', 'Germany', 'Greece', 'Hungary', 'Iceland', 'Ireland', 'Israel', 'Italy', 'Japan', 'South Korea', 'Latvia', 'Lithuania', 'Luxembourg', 'Mexico', 'Netherlands', 'New Zealand', 'Norway', 'Poland', 'Portugal', 'Slovakia', 'Slovenia', 'Spain', 'Sweden', 'Switzerland', 'Turkey', 'United Kingdom', 'United States']);

// OPEC's twelve members (Angola left in 2024, Qatar in 2019, Ecuador in 2020).
export const OPEC = new Set(['Algeria', 'Republic of the Congo', 'Equatorial Guinea', 'Gabon', 'Iran', 'Iraq', 'Kuwait', 'Libya', 'Nigeria', 'Saudi Arabia', 'United Arab Emirates', 'Venezuela']);

// The thirteen countries the Equator runs through.
export const EQUATOR = new Set(['Ecuador', 'Colombia', 'Brazil', 'Sao Tome and Principe', 'Gabon', 'Republic of the Congo', 'Democratic Republic of the Congo', 'Uganda', 'Kenya', 'Somalia', 'Maldives', 'Indonesia', 'Kiribati']);

// The ten largest countries by total area.
export const BIGGEST = new Set(['Russia', 'Canada', 'China', 'United States', 'Brazil', 'Australia', 'India', 'Argentina', 'Kazakhstan', 'Algeria']);

// Portuguese as an official or co-official national language.
export const PORTUGUESE = new Set(['Angola', 'Brazil', 'Cape Verde', 'Equatorial Guinea', 'Guinea-Bissau', 'Mozambique', 'Portugal', 'Sao Tome and Principe', 'Timor-Leste']);
