// Flags & Borders lane for Atlas days 99..129 (2026-12-01 to 2026-12-31), appended with
//   node scripts/gen-atlas.mjs scripts/atlas-lanes-2026-12 --through 2026-12-31
// An entry with `from` recycles a never-answered question (owner rule 2026-10-09).
export const LANE_DAYS = [
  // 2026-12-01
  [
    { c: 'Flags & Borders', t: 1, q: 'Which US state lies directly east of Kansas?', a: 'Missouri', d: ['Iowa', 'Nebraska', 'Arkansas'] },
    { c: 'Flags & Borders', t: 2, q: 'Which landlocked country lies between Mali and Chad?', a: 'Niger', d: ['Burkina Faso', 'Sudan', 'Algeria'] },
    { c: 'Flags & Borders', t: 3, q: 'Which US state, home to Duluth, borders Lake Superior and Canada?', a: 'Minnesota', d: ['Michigan', 'Wisconsin', 'North Dakota'] },
    { c: 'Flags & Borders', t: 4, q: 'How many countries share a land border with Afghanistan?', a: 'Six', d: ['Four', 'Five', 'Seven'], from: 'atlas:d27q18' },
    { c: 'Flags & Borders', t: 5, q: 'Which US state\'s flag shows a white palmetto tree and a crescent on an indigo field?', a: 'South Carolina', d: ['Georgia', 'North Carolina', 'Florida'], from: 'atlas:d20q23' },
  ],
  // 2026-12-02
  [
    { c: 'Flags & Borders', t: 1, q: 'Which US state lies directly north of Missouri?', a: 'Iowa', d: ['Illinois', 'Nebraska', 'Minnesota'] },
    { c: 'Flags & Borders', t: 2, q: 'Which Australian region borders Western Australia, South Australia and Queensland?', a: 'The Northern Territory', d: ['New South Wales', 'Victoria', 'The Australian Capital Territory'] },
    { c: 'Flags & Borders', t: 3, q: 'Which US state borders Canada, Idaho, Wyoming and both Dakotas?', a: 'Montana', d: ['Minnesota', 'Washington', 'Nebraska'] },
    { c: 'Flags & Borders', t: 4, q: 'Which two Canadian provinces are separated by the Ottawa River for much of its length?', a: 'Ontario and Quebec', d: ['Quebec and New Brunswick', 'Ontario and Manitoba', 'Quebec and Newfoundland and Labrador'] },
    { c: 'Flags & Borders', t: 5, q: 'Which country\'s flag depicts a nutmeg beside triangles of green and yellow in a red frame?', a: 'Grenada', d: ['Saint Lucia', 'Dominica', 'Barbados'], from: 'atlas:d33q23' },
  ],
  // 2026-12-03
  [
    { c: 'Flags & Borders', t: 1, q: 'How many countries make up the United Kingdom?', a: 'Four', d: ['Two', 'Three', 'Five'] },
    { c: 'Flags & Borders', t: 2, q: 'Which country lies between Ecuador and Venezuela?', a: 'Colombia', d: ['Peru', 'Panama', 'Guyana'] },
    { c: 'Flags & Borders', t: 3, q: 'Which Mexican state borders Arizona and lies along the Gulf of California?', a: 'Sonora', d: ['Chihuahua', 'Sinaloa', 'Baja California Sur'] },
    { c: 'Flags & Borders', t: 4, q: 'The yellow, blue and red flags of Venezuela and Ecuador descend from the banner of which republic, dissolved in 1831?', a: 'Gran Colombia', d: ['The United Provinces of Central America', 'The Viceroyalty of New Granada', 'The Empire of Brazil'], from: 'atlas:d59q18' },
    { c: 'Flags & Borders', t: 5, q: 'Which country has the only national flag to feature purple, in the plumage of a parrot?', a: 'Dominica', d: ['Saint Lucia', 'Grenada', 'Barbados'], from: 'atlas:d22q23' },
  ],
  // 2026-12-04
  [
    { c: 'Flags & Borders', t: 1, q: 'What color is the star on the flag of Vietnam?', a: 'Yellow', d: ['White', 'Red', 'Blue'] },
    { c: 'Flags & Borders', t: 2, q: 'Which island kingdom in the Persian Gulf is linked to Saudi Arabia by a causeway?', a: 'Bahrain', d: ['Qatar', 'Kuwait', 'Oman'] },
    { c: 'Flags & Borders', t: 3, q: 'Which US state shares the Delmarva Peninsula with Maryland and Virginia?', a: 'Delaware', d: ['New Jersey', 'Pennsylvania', 'West Virginia'] },
    { c: 'Flags & Borders', t: 4, q: 'Which US state\'s flag shows a ship, a plow and three sheaves of wheat flanked by two horses?', a: 'Pennsylvania', d: ['Delaware', 'New Jersey', 'Ohio'] },
    { c: 'Flags & Borders', t: 5, q: 'Besides Switzerland, which state flies the only other square national flag?', a: 'Vatican City', d: ['Monaco', 'San Marino', 'Andorra'], from: 'atlas:d32q23' },
  ],
  // 2026-12-05
  [
    { c: 'Flags & Borders', t: 1, q: 'Which US state lies directly south of Indiana, across the Ohio River?', a: 'Kentucky', d: ['Tennessee', 'Illinois', 'West Virginia'] },
    { c: 'Flags & Borders', t: 2, q: 'Along with Texas, Arizona and California, which US state borders Mexico?', a: 'New Mexico', d: ['Nevada', 'Colorado', 'Oklahoma'] },
    { c: 'Flags & Borders', t: 3, q: 'Which Mexican state contains the resort city of Cancun?', a: 'Quintana Roo', d: ['Yucatan', 'Campeche', 'Tabasco'] },
    { c: 'Flags & Borders', t: 4, q: 'Which US state\'s entire northern border is with the Canadian province of Quebec?', a: 'Vermont', d: ['Maine', 'New Hampshire', 'New York'] },
    { c: 'Flags & Borders', t: 5, q: 'Which US state\'s flag shows three white stars inside a blue circle on a crimson field?', a: 'Tennessee', d: ['Kentucky', 'Louisiana', 'Missouri'], from: 'atlas:d02q23' },
  ],
  // 2026-12-06
  [
    { c: 'Flags & Borders', t: 1, q: 'Which part of the United Kingdom shares a land border with the Republic of Ireland?', a: 'Northern Ireland', d: ['Scotland', 'Wales', 'England'] },
    { c: 'Flags & Borders', t: 2, q: 'Which island country lies about ninety miles south of Cuba\'s eastern end?', a: 'Jamaica', d: ['Haiti', 'Puerto Rico', 'The Bahamas'] },
    { c: 'Flags & Borders', t: 3, q: 'Which is the largest Australian state by area?', a: 'Western Australia', d: ['Queensland', 'New South Wales', 'South Australia'] },
    { c: 'Flags & Borders', t: 4, q: 'Which US state\'s flag is a plain white field bearing a crimson cross of Saint Andrew?', a: 'Alabama', d: ['Florida', 'Arkansas', 'Georgia'], from: 'atlas:d20q18' },
    { c: 'Flags & Borders', t: 5, q: 'Which country\'s flag shows a black and white shield lying across bands of blue, yellow and red?', a: 'Eswatini', d: ['Lesotho', 'Botswana', 'Malawi'], from: 'atlas:d17q23' },
  ],
  // 2026-12-07
  [
    { c: 'Flags & Borders', t: 1, q: 'Which US state lies directly north of Utah?', a: 'Idaho', d: ['Wyoming', 'Montana', 'Oregon'] },
    { c: 'Flags & Borders', t: 2, q: 'Which country sits at the head of the Persian Gulf between Iraq and Saudi Arabia?', a: 'Kuwait', d: ['Qatar', 'Bahrain', 'Jordan'] },
    { c: 'Flags & Borders', t: 3, q: 'Which US state\'s flag shows a beehive?', a: 'Utah', d: ['Idaho', 'Kansas', 'Nevada'] },
    { c: 'Flags & Borders', t: 4, q: 'Which US state\'s flag shows a sailor and a miner flanking a shield, with a badger above it?', a: 'Wisconsin', d: ['Minnesota', 'Michigan', 'Iowa'], from: 'atlas:d41q18' },
    { c: 'Flags & Borders', t: 5, q: 'Which two states are doubly landlocked, meaning every one of their neighbors is landlocked too?', a: 'Liechtenstein and Uzbekistan', d: ['Nepal and Bhutan', 'Mongolia and Laos', 'Andorra and San Marino'], from: 'atlas:d58q23' },
  ],
  // 2026-12-08
  [
    { c: 'Flags & Borders', t: 1, q: 'Which two US states border Florida?', a: 'Alabama and Georgia', d: ['Georgia and South Carolina', 'Alabama and Mississippi', 'Georgia and Tennessee'] },
    { c: 'Flags & Borders', t: 2, q: 'Which country lies between Nigeria and the Central African Republic?', a: 'Cameroon', d: ['Chad', 'Gabon', 'Niger'] },
    { c: 'Flags & Borders', t: 3, q: 'Which Mexican state borders Texas along the lower Rio Grande?', a: 'Tamaulipas', d: ['Coahuila', 'Nuevo Leon', 'Veracruz'] },
    { c: 'Flags & Borders', t: 4, q: 'In which year did Canada replace the Red Ensign with the maple leaf flag?', a: '1965', d: ['1972', '1949', '1931'], from: 'atlas:d43q18' },
    { c: 'Flags & Borders', t: 5, q: 'Which is the only mainland Central American country with no Pacific coastline?', a: 'Belize', d: ['Honduras', 'El Salvador', 'Nicaragua'], from: 'atlas:d23q23' },
  ],
  // 2026-12-09
  [
    { c: 'Flags & Borders', t: 1, q: 'Which US state lies directly east of Illinois?', a: 'Indiana', d: ['Ohio', 'Iowa', 'Michigan'] },
    { c: 'Flags & Borders', t: 2, q: 'Which US state broke away from Virginia during the Civil War?', a: 'West Virginia', d: ['Kentucky', 'Maryland', 'Tennessee'] },
    { c: 'Flags & Borders', t: 3, q: 'Which country\'s coastline lies between those of Liberia and Ghana?', a: 'Ivory Coast', d: ['Togo', 'Guinea', 'Burkina Faso'] },
    { c: 'Flags & Borders', t: 4, q: 'Which two countries fly vertical tricolors of blue, yellow and red so nearly identical that one of them raised the matter at the United Nations in 2004?', a: 'Chad and Romania', d: ['Mali and Senegal', 'Ecuador and Colombia', 'Ireland and Ivory Coast'], from: 'atlas:d47q18' },
    { c: 'Flags & Borders', t: 5, q: 'Which line of latitude marks almost the whole boundary between Egypt and the country to its south?', a: 'The 22nd parallel', d: ['The equator', 'The 30th parallel', 'The Tropic of Cancer'], from: 'atlas:d52q23' },
  ],
  // 2026-12-10
  [
    { c: 'Flags & Borders', t: 1, q: 'Which US state lies directly north of Louisiana?', a: 'Arkansas', d: ['Mississippi', 'Oklahoma', 'Missouri'] },
    { c: 'Flags & Borders', t: 2, q: 'Which US state lies between Louisiana and Alabama on the Gulf Coast?', a: 'Mississippi', d: ['Arkansas', 'Georgia', 'Tennessee'] },
    { c: 'Flags & Borders', t: 3, q: 'Which US state\'s flag shows a sunflower above the state seal?', a: 'Kansas', d: ['Nebraska', 'Iowa', 'Oklahoma'] },
    { c: 'Flags & Borders', t: 4, q: 'Which two countries share the small Caribbean island of Saint Martin?', a: 'France and the Netherlands', d: ['Britain and France', 'Spain and the Netherlands', 'France and the United States'] },
    { c: 'Flags & Borders', t: 5, q: 'The Treaty of Zuhab in 1639 fixed a frontier through the Zagros Mountains between which two empires?', a: 'The Ottoman and Safavid empires', d: ['The Mughal and Safavid empires', 'The Ottoman and Russian empires', 'The Ottoman and Habsburg empires'], from: 'atlas:d60q23' },
  ],
  // 2026-12-11
  [
    { c: 'Flags & Borders', t: 1, q: 'How many countries share a land border with the United States?', a: 'Two', d: ['One', 'Three', 'Four'] },
    { c: 'Flags & Borders', t: 2, q: 'Which country lies between Ethiopia and the Red Sea?', a: 'Eritrea', d: ['Djibouti', 'Somalia', 'Sudan'] },
    { c: 'Flags & Borders', t: 3, q: 'Which US state\'s flag shows a buff field with a seal of the goddesses Liberty and Ceres?', a: 'New Jersey', d: ['New York', 'Delaware', 'Connecticut'] },
    { c: 'Flags & Borders', t: 4, q: 'Which narrow West African country lies between Ghana and Benin?', a: 'Togo', d: ['Burkina Faso', 'Ivory Coast', 'Sierra Leone'], from: 'atlas:d05q18' },
    { c: 'Flags & Borders', t: 5, q: 'Which country\'s flag shows a sun of forty rays with the crossed roof-poles of a yurt at its center?', a: 'Kyrgyzstan', d: ['Kazakhstan', 'Uzbekistan', 'Tajikistan'], from: 'atlas:d48q23' },
  ],
  // 2026-12-12
  [
    { c: 'Flags & Borders', t: 1, q: 'Which US state lies directly east of Vermont?', a: 'New Hampshire', d: ['Maine', 'Massachusetts', 'New York'] },
    { c: 'Flags & Borders', t: 2, q: 'Which US state shares the longest border with Canada?', a: 'Alaska', d: ['Montana', 'Michigan', 'Maine'] },
    { c: 'Flags & Borders', t: 3, q: 'Which small country lies on the Atlantic directly south of Senegal\'s Casamance region?', a: 'Guinea-Bissau', d: ['The Gambia', 'Sierra Leone', 'Liberia'] },
    { c: 'Flags & Borders', t: 4, q: 'Which Russian region faces Alaska across the Bering Strait?', a: 'Chukotka', d: ['Kamchatka', 'Sakhalin', 'Yakutia'] },
    { c: 'Flags & Borders', t: 5, q: 'Which country\'s flag shows a frigatebird flying over a rising sun above three white wave bands?', a: 'Kiribati', d: ['Nauru', 'Tuvalu', 'Fiji'], from: 'atlas:d30q23' },
  ],
  // 2026-12-13
  [
    { c: 'Flags & Borders', t: 1, q: 'Which US state lies directly south of Wyoming?', a: 'Colorado', d: ['Utah', 'Nebraska', 'Kansas'] },
    { c: 'Flags & Borders', t: 2, q: 'Which Canadian province borders the US states of Washington, Idaho and Montana?', a: 'British Columbia', d: ['Alberta', 'Saskatchewan', 'Yukon'] },
    { c: 'Flags & Borders', t: 3, q: 'Which roughly triangular country borders only Croatia, Serbia and Montenegro?', a: 'Bosnia and Herzegovina', d: ['Slovenia', 'North Macedonia', 'Kosovo'] },
    { c: 'Flags & Borders', t: 4, q: 'Which Mexican state lies directly south of San Diego?', a: 'Baja California', d: ['Sonora', 'Baja California Sur', 'Sinaloa'] },
    { c: 'Flags & Borders', t: 5, q: 'Which country\'s flag is green with an orange eagle above three vertical stripes in the fly corner?', a: 'Zambia', d: ['Zimbabwe', 'Malawi', 'Botswana'], from: 'atlas:d18q23' },
  ],
  // 2026-12-14
  [
    { c: 'Flags & Borders', t: 1, q: 'Which US state lies directly north of Texas\'s panhandle?', a: 'Oklahoma', d: ['Kansas', 'Colorado', 'Nebraska'] },
    { c: 'Flags & Borders', t: 2, q: 'Which Canadian territory was carved out of the Northwest Territories in 1999?', a: 'Nunavut', d: ['Yukon', 'Labrador', 'Nunavik'] },
    { c: 'Flags & Borders', t: 3, q: 'Which US state\'s flag shows a bald eagle holding a banner reading State Sovereignty, National Union?', a: 'Illinois', d: ['Indiana', 'Iowa', 'Missouri'] },
    { c: 'Flags & Borders', t: 4, q: 'Which Canadian territory borders Yukon, Nunavut, British Columbia, Alberta and Saskatchewan?', a: 'The Northwest Territories', d: ['Manitoba', 'Nunavut', 'Yukon'] },
    { c: 'Flags & Borders', t: 5, q: 'Which country\'s flag shows a golden sun with twenty-four rays over bands of blue, yellow and green?', a: 'Rwanda', d: ['Burundi', 'Gabon', 'Cameroon'], from: 'atlas:d06q23' },
  ],
  // 2026-12-15
  [
    { c: 'Flags & Borders', t: 1, q: 'Which US state lies directly east of New Mexico?', a: 'Texas', d: ['Arizona', 'Kansas', 'Colorado'] },
    { c: 'Flags & Borders', t: 2, q: 'The Mason-Dixon Line was surveyed to settle the border between Pennsylvania and which colony?', a: 'Maryland', d: ['Virginia', 'New Jersey', 'New York'] },
    { c: 'Flags & Borders', t: 3, q: 'Which river forms the border between Indiana and Kentucky?', a: 'The Ohio', d: ['The Wabash', 'The Tennessee', 'The Cumberland'] },
    { c: 'Flags & Borders', t: 4, q: 'Which Canadian province borders Vermont and New Hampshire?', a: 'Quebec', d: ['Ontario', 'New Brunswick', 'Nova Scotia'] },
    { c: 'Flags & Borders', t: 5, q: 'Which country\'s flag has orange and white diagonal stripes with a twenty-four-pointed white star?', a: 'Marshall Islands', d: ['Palau', 'Kiribati', 'Micronesia'], from: 'atlas:d08q23' },
  ],
  // 2026-12-16
  [
    { c: 'Flags & Borders', t: 1, q: 'Which US state lies directly west of Iowa, across the Missouri River?', a: 'Nebraska', d: ['Kansas', 'Colorado', 'Minnesota'] },
    { c: 'Flags & Borders', t: 2, q: 'Which Canadian province borders Maine on its eastern side?', a: 'New Brunswick', d: ['Nova Scotia', 'Quebec', 'Prince Edward Island'] },
    { c: 'Flags & Borders', t: 3, q: 'Which is the only national flag to show an open Bible?', a: 'The Dominican Republic', d: ['Haiti', 'Guatemala', 'Ecuador'] },
    { c: 'Flags & Borders', t: 4, q: 'Which German state completely surrounds the city-state of Berlin?', a: 'Brandenburg', d: ['Saxony', 'Mecklenburg-Vorpommern', 'Saxony-Anhalt'] },
    { c: 'Flags & Borders', t: 5, q: 'The Wakhan Corridor, a thin finger of land drawn to keep two empires apart, belongs to which country?', a: 'Afghanistan', d: ['Pakistan', 'Tajikistan', 'Kyrgyzstan'], from: 'atlas:d39q23' },
  ],
  // 2026-12-17
  [
    { c: 'Flags & Borders', t: 1, q: 'Which US state lies directly north of Pennsylvania?', a: 'New York', d: ['New Jersey', 'Ohio', 'Connecticut'] },
    { c: 'Flags & Borders', t: 2, q: 'Which country lies between Thailand and southern Vietnam on the Gulf of Thailand?', a: 'Cambodia', d: ['Laos', 'Myanmar', 'Malaysia'] },
    { c: 'Flags & Borders', t: 3, q: 'Which Canadian province borders both North Dakota and Minnesota?', a: 'Manitoba', d: ['Saskatchewan', 'Ontario', 'Alberta'] },
    { c: 'Flags & Borders', t: 4, q: 'Which Mexican state borders Guatemala and holds the Maya ruins of Palenque?', a: 'Chiapas', d: ['Yucatan', 'Tabasco', 'Oaxaca'] },
    { c: 'Flags & Borders', t: 5, q: 'Which country\'s flag shows a golden sun with eight broad rays spreading to the edges of a red field?', a: 'North Macedonia', d: ['Albania', 'Montenegro', 'Serbia'], from: 'atlas:d36q23' },
  ],
  // 2026-12-18
  [
    { c: 'Flags & Borders', t: 1, q: 'Which tiny principality on the Mediterranean coast is surrounded on land by France?', a: 'Monaco', d: ['Andorra', 'San Marino', 'Liechtenstein'] },
    { c: 'Flags & Borders', t: 2, q: 'Which US state lies between North Carolina and Georgia on the Atlantic coast?', a: 'South Carolina', d: ['Virginia', 'Tennessee', 'Alabama'] },
    { c: 'Flags & Borders', t: 3, q: 'Which Mexican state lies across the border from Texas\'s Big Bend and also borders New Mexico?', a: 'Chihuahua', d: ['Sonora', 'Coahuila', 'Durango'] },
    { c: 'Flags & Borders', t: 4, q: 'Which national flag and which US state flag both show a single white star on a blue square beside a white band and a red band?', a: 'Chile and Texas', d: ['Liberia and Georgia', 'Cuba and Puerto Rico', 'Panama and Ohio'], from: 'atlas:d54q18' },
    { c: 'Flags & Borders', t: 5, q: 'Which country\'s flag is quartered, with a blue star on the upper hoist white quarter and a red star on the lower fly white quarter?', a: 'Panama', d: ['Cuba', 'Dominican Republic', 'Costa Rica'], from: 'atlas:d28q23' },
  ],
  // 2026-12-19
  [
    { c: 'Flags & Borders', t: 1, q: 'Which country lies between Algeria and Libya on the Mediterranean coast?', a: 'Tunisia', d: ['Morocco', 'Egypt', 'Malta'] },
    { c: 'Flags & Borders', t: 2, q: 'Which US state touches four of the five Great Lakes?', a: 'Michigan', d: ['Ohio', 'Wisconsin', 'New York'] },
    { c: 'Flags & Borders', t: 3, q: 'Which small federal district surrounds Canberra?', a: 'The Australian Capital Territory', d: ['New South Wales', 'The Northern Territory', 'Victoria'] },
    { c: 'Flags & Borders', t: 4, q: 'Which flag, adopted in 2008, shows a gold outline of its own territory beneath an arc of six white stars on blue?', a: 'The flag of Kosovo', d: ['The flag of Bosnia and Herzegovina', 'The flag of Moldova', 'The flag of Slovenia'], from: 'atlas:d58q18' },
    { c: 'Flags & Borders', t: 5, q: 'Which country\'s flag carries one emblem on the front and a different emblem on the back?', a: 'Paraguay', d: ['Serbia', 'Ecuador', 'Moldova'], from: 'atlas:d42q23' },
  ],
  // 2026-12-20
  [
    { c: 'Flags & Borders', t: 1, q: 'Which US state lies directly north of California?', a: 'Oregon', d: ['Nevada', 'Washington', 'Idaho'] },
    { c: 'Flags & Borders', t: 2, q: 'Which island country is a long chain of islands lying southeast of Florida?', a: 'The Bahamas', d: ['Cuba', 'Jamaica', 'Bermuda'] },
    { c: 'Flags & Borders', t: 3, q: 'The Delaware River forms much of the border between which two US states?', a: 'Pennsylvania and New Jersey', d: ['New York and New Jersey', 'Delaware and Maryland', 'Pennsylvania and Ohio'] },
    { c: 'Flags & Borders', t: 4, q: 'Two national flags turned out to be identical at the 1936 Olympics, after which one of them added a crown. Which pair?', a: 'Haiti and Liechtenstein', d: ['Chad and Romania', 'Monaco and Indonesia', 'Ireland and Ivory Coast'], from: 'atlas:d50q18' },
    { c: 'Flags & Borders', t: 5, q: 'Which country lies immediately north of Senegal across the Senegal River?', a: 'Mauritania', d: ['Mali', 'Guinea', 'Morocco'], from: 'atlas:d05q23' },
  ],
  // 2026-12-21
  [
    { c: 'Flags & Borders', t: 1, q: 'Which US state lies directly east of New York?', a: 'Vermont', d: ['Ohio', 'New Jersey', 'Pennsylvania'] },
    { c: 'Flags & Borders', t: 2, q: 'Which Canadian province lies between Alberta and Manitoba?', a: 'Saskatchewan', d: ['Ontario', 'British Columbia', 'Quebec'] },
    { c: 'Flags & Borders', t: 3, q: 'Which state\'s whole land frontier is a wall barely three kilometers long?', a: 'Vatican City', d: ['Monaco', 'Liechtenstein', 'San Marino'], from: 'atlas:d47q13' },
    { c: 'Flags & Borders', t: 4, q: 'Which US state\'s flag shows a red sun symbol of the Zia people on a yellow field?', a: 'New Mexico', d: ['Arizona', 'Nevada', 'Colorado'], from: 'atlas:d26q18' },
    { c: 'Flags & Borders', t: 5, q: 'Which country\'s flag is light blue with the Union Jack and a shield showing a lion, sugar cane and a dove?', a: 'Fiji', d: ['Solomon Islands', 'Samoa', 'Tuvalu'], from: 'atlas:d57q23' },
  ],
  // 2026-12-22
  [
    { c: 'Flags & Borders', t: 1, q: 'Which US state lies directly south of Kentucky?', a: 'Tennessee', d: ['Alabama', 'Georgia', 'Arkansas'] },
    { c: 'Flags & Borders', t: 2, q: 'Which country lies between Venezuela and Suriname?', a: 'Guyana', d: ['French Guiana', 'Colombia', 'Brazil'] },
    { c: 'Flags & Borders', t: 3, q: 'Which country\'s coastline lies between those of Sierra Leone and Ivory Coast?', a: 'Liberia', d: ['Ghana', 'Guinea', 'Togo'] },
    { c: 'Flags & Borders', t: 4, q: 'The Curonian Spit, a long peninsula of sand dunes, is divided between Russia and which other country?', a: 'Lithuania', d: ['Estonia', 'Finland', 'Latvia'], from: 'atlas:d57q18' },
    { c: 'Flags & Borders', t: 5, q: 'Which country\'s flag is green with a vertical carpet stripe of five traditional guls at the hoist?', a: 'Turkmenistan', d: ['Uzbekistan', 'Tajikistan', 'Kyrgyzstan'], from: 'atlas:d13q23' },
  ],
  // 2026-12-23
  [
    { c: 'Flags & Borders', t: 1, q: 'Which US state lies directly west of Georgia?', a: 'Alabama', d: ['Mississippi', 'Tennessee', 'South Carolina'] },
    { c: 'Flags & Borders', t: 2, q: 'Which landlocked country is squeezed between Romania and Ukraine?', a: 'Moldova', d: ['Belarus', 'Slovakia', 'Hungary'] },
    { c: 'Flags & Borders', t: 3, q: 'Which US state\'s flag carries the words Battle Born?', a: 'Nevada', d: ['Texas', 'Arizona', 'Utah'] },
    { c: 'Flags & Borders', t: 4, q: 'Which US state\'s flag shows a buff diamond on colonial blue with the date December 7, 1787?', a: 'Delaware', d: ['Maryland', 'Virginia', 'New Jersey'], from: 'atlas:d40q18' },
    { c: 'Flags & Borders', t: 5, q: 'The tangled enclaves and counter enclaves at Baarle are shared by the Netherlands and which country?', a: 'Belgium', d: ['Luxembourg', 'Germany', 'France'], from: 'atlas:d41q23' },
  ],
  // 2026-12-24
  [
    { c: 'Flags & Borders', t: 1, q: 'The flag of Mexico shows an eagle perched on which kind of plant?', a: 'A cactus', d: ['An agave', 'A palm tree', 'An oak tree'] },
    { c: 'Flags & Borders', t: 2, q: 'Which is the only Central American country with no coastline on the Caribbean?', a: 'El Salvador', d: ['Guatemala', 'Nicaragua', 'Costa Rica'] },
    { c: 'Flags & Borders', t: 3, q: 'Which country\'s flag is three horizontal bands of green, yellow and blue?', a: 'Gabon', d: ['Rwanda', 'Sierra Leone', 'Ghana'] },
    { c: 'Flags & Borders', t: 4, q: 'Which US state has a narrow northern panhandle squeezed between Ohio and Pennsylvania?', a: 'West Virginia', d: ['Maryland', 'Kentucky', 'Virginia'] },
    { c: 'Flags & Borders', t: 5, q: 'Which country\'s flag is blue with a narrow yellow horizontal stripe and a white twelve-pointed star below it?', a: 'Nauru', d: ['Palau', 'Micronesia', 'Tuvalu'], from: 'atlas:d29q23' },
  ],
  // 2026-12-25
  [
    { c: 'Flags & Borders', t: 1, q: 'How many stars are on the flag of the United States?', a: 'Fifty', d: ['Forty-eight', 'Fifty-two', 'Thirteen'] },
    { c: 'Flags & Borders', t: 2, q: 'Which US state lies between Minnesota and Lake Michigan?', a: 'Wisconsin', d: ['Iowa', 'Illinois', 'Michigan'] },
    { c: 'Flags & Borders', t: 3, q: 'Which country is enclosed by South Africa apart from a short border with Mozambique?', a: 'Eswatini', d: ['Lesotho', 'Botswana', 'Namibia'], from: 'atlas:d41q13' },
    { c: 'Flags & Borders', t: 4, q: 'Which US state\'s seal, shown on its flag, is the only state seal designed by a woman?', a: 'Idaho', d: ['Wyoming', 'Nevada', 'Montana'] },
    { c: 'Flags & Borders', t: 5, q: 'Point Roberts, a scrap of the United States reachable by land only through Canada, hangs below which line of latitude?', a: 'The 49th parallel', d: ['The 45th parallel', 'The 50th parallel', 'The Tropic of Cancer'], from: 'atlas:d14q23' },
  ],
  // 2026-12-26
  [
    { c: 'Flags & Borders', t: 1, q: 'What color is the background of the flag of the European Union?', a: 'Blue', d: ['Green', 'White', 'Red'] },
    { c: 'Flags & Borders', t: 2, q: 'Which country lies on the Black Sea between Turkey and Russia?', a: 'Georgia', d: ['Armenia', 'Azerbaijan', 'Bulgaria'] },
    { c: 'Flags & Borders', t: 3, q: 'Which US state\'s flag shows two men shaking hands, with the motto United we stand, divided we fall?', a: 'Kentucky', d: ['Tennessee', 'Virginia', 'Ohio'] },
    { c: 'Flags & Borders', t: 4, q: 'Which landlocked West African country shares a land border with both Ghana and Niger?', a: 'Burkina Faso', d: ['Togo', 'Benin', 'Guinea'], from: 'atlas:d29q18' },
    { c: 'Flags & Borders', t: 5, q: 'The Webster-Ashburton Treaty of 1842 settled a long dispute between Britain and the United States over the northeastern boundary of which state?', a: 'Maine', d: ['New York', 'Vermont', 'New Hampshire'], from: 'atlas:d50q23' },
  ],
  // 2026-12-27
  [
    { c: 'Flags & Borders', t: 1, q: 'Which US state lies directly north of Iowa?', a: 'Minnesota', d: ['Wisconsin', 'South Dakota', 'Michigan'] },
    { c: 'Flags & Borders', t: 2, q: 'Which country lies directly east of Gabon?', a: 'The Republic of the Congo', d: ['Cameroon', 'Angola', 'Equatorial Guinea'] },
    { c: 'Flags & Borders', t: 3, q: 'Which US state is a near-perfect rectangle bounded by the 37th and 41st parallels?', a: 'Colorado', d: ['Wyoming', 'Utah', 'Kansas'] },
    { c: 'Flags & Borders', t: 4, q: 'Which is the only Canadian territory that borders Alaska?', a: 'Yukon', d: ['Northwest Territories', 'Nunavut', 'British Columbia'] },
    { c: 'Flags & Borders', t: 5, q: 'Which US state\'s flag shows a copper star above thirteen rays of red and gold?', a: 'Arizona', d: ['New Mexico', 'Nevada', 'Oklahoma'], from: 'atlas:d16q23' },
  ],
  // 2026-12-28
  [
    { c: 'Flags & Borders', t: 1, q: 'Which US state lies directly south of Oregon?', a: 'California', d: ['Nevada', 'Idaho', 'Washington'] },
    { c: 'Flags & Borders', t: 2, q: 'Which Australian state lies directly north of Victoria?', a: 'New South Wales', d: ['Queensland', 'South Australia', 'Tasmania'] },
    { c: 'Flags & Borders', t: 3, q: 'Which US state\'s flag is green and bears a portrait of the first American president?', a: 'Washington', d: ['Virginia', 'Delaware', 'Pennsylvania'] },
    { c: 'Flags & Borders', t: 4, q: 'The two blue stripes on the flag of Israel were taken from which garment?', a: 'A prayer shawl', d: ['A desert tent', 'A burial shroud', 'A Torah mantle'], from: 'atlas:d52q18' },
    { c: 'Flags & Borders', t: 5, q: 'Which country is made up of a mainland region between Cameroon and Gabon plus the island of Bioko?', a: 'Equatorial Guinea', d: ['Gabon', 'Sao Tome and Principe', 'Republic of the Congo'], from: 'atlas:d24q23' },
  ],
  // 2026-12-29
  [
    { c: 'Flags & Borders', t: 1, q: 'Which body of water forms the southern border of the US state of Texas east of the Rio Grande\'s mouth?', a: 'The Gulf of Mexico', d: ['The Pacific Ocean', 'The Caribbean Sea', 'The Atlantic Ocean'] },
    { c: 'Flags & Borders', t: 2, q: 'Which US state meets Arizona, Colorado and New Mexico at the Four Corners?', a: 'Utah', d: ['Nevada', 'Wyoming', 'Kansas'] },
    { c: 'Flags & Borders', t: 3, q: 'Which US state\'s flag shows an Osage shield on a sky blue field, crossed by a peace pipe and an olive branch?', a: 'Oklahoma', d: ['Kansas', 'Nebraska', 'New Mexico'] },
    { c: 'Flags & Borders', t: 4, q: 'How many countries share a land border with Germany?', a: 'Nine', d: ['Seven', 'Eight', 'Ten'] },
    { c: 'Flags & Borders', t: 5, q: 'Which US state\'s flag shows a white bison with the state seal branded on its flank?', a: 'Wyoming', d: ['Kansas', 'Montana', 'North Dakota'], from: 'atlas:d27q23' },
  ],
  // 2026-12-30
  [
    { c: 'Flags & Borders', t: 1, q: 'Which US state lies directly north of Nebraska?', a: 'South Dakota', d: ['North Dakota', 'Iowa', 'Wyoming'] },
    { c: 'Flags & Borders', t: 2, q: 'Which country\'s coastline lies between those of Croatia and Albania?', a: 'Montenegro', d: ['Serbia', 'North Macedonia', 'Slovenia'] },
    { c: 'Flags & Borders', t: 3, q: 'Which US state\'s flag shows a white diamond bordered in blue with stars on a red field?', a: 'Arkansas', d: ['Texas', 'Alabama', 'Missouri'] },
    { c: 'Flags & Borders', t: 4, q: 'Which country\'s flag shows a golden lion holding a sword, framed by four bo leaves?', a: 'Sri Lanka', d: ['Myanmar', 'Maldives', 'Singapore'], from: 'atlas:d17q18' },
    { c: 'Flags & Borders', t: 5, q: 'Which country lies between Guyana and French Guiana on the northern coast of South America?', a: 'Suriname', d: ['Venezuela', 'Trinidad and Tobago', 'Colombia'], from: 'atlas:d11q23' },
  ],
  // 2026-12-31
  [
    { c: 'Flags & Borders', t: 1, q: 'Which US state lies directly south of Virginia?', a: 'North Carolina', d: ['South Carolina', 'Tennessee', 'Georgia'] },
    { c: 'Flags & Borders', t: 2, q: 'Which small landlocked country lies directly south of Rwanda?', a: 'Burundi', d: ['Malawi', 'Uganda', 'Zambia'] },
    { c: 'Flags & Borders', t: 3, q: 'Which US state\'s flag shows two grizzly bears holding the state seal inside a ring of twenty-four stars?', a: 'Missouri', d: ['California', 'Montana', 'Arkansas'] },
    { c: 'Flags & Borders', t: 4, q: 'Which country\'s flag shows a golden steppe eagle beneath a sun on a sky blue field?', a: 'Kazakhstan', d: ['Uzbekistan', 'Kyrgyzstan', 'Azerbaijan'], from: 'atlas:d13q18' },
    { c: 'Flags & Borders', t: 5, q: 'The Oecusse district is an exclave completely surrounded by Indonesian territory and belongs to which country?', a: 'Timor-Leste', d: ['Papua New Guinea', 'Brunei', 'Malaysia'], from: 'atlas:d19q23' },
  ],
];
