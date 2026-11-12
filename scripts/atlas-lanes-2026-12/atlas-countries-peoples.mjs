// Countries & Peoples lane for Atlas days 99..129 (2026-12-01 to 2026-12-31), appended with
//   node scripts/gen-atlas.mjs scripts/atlas-lanes-2026-12 --through 2026-12-31
// An entry with `from` recycles a never-answered question (owner rule 2026-10-09).
export const LANE_DAYS = [
  // 2026-12-01
  [
    { c: 'Countries & Peoples', t: 1, q: 'What is the currency of Russia?', a: 'The ruble', d: ['The hryvnia', 'The lev', 'The forint'] },
    { c: 'Countries & Peoples', t: 2, q: 'Which Argentine tradition is a long social barbecue of beef cooked over wood or coals?', a: 'The asado', d: ['The braai', 'The luau', 'The hangi'] },
    { c: 'Countries & Peoples', t: 3, q: 'Which country on Africa\'s southeast coast has Portuguese as its official language?', a: 'Mozambique', d: ['Angola', 'Kenya', 'Tanzania'], from: 'atlas:d08q15' },
    { c: 'Countries & Peoples', t: 4, q: 'Which dish of meat stewed in vinegar, soy sauce and garlic is often called the national dish of the Philippines?', a: 'Adobo', d: ['Sinigang', 'Lechon', 'Kare-kare'] },
    { c: 'Countries & Peoples', t: 5, q: 'The loti is the currency of which country?', a: 'Lesotho', d: ['Eswatini', 'Botswana', 'Namibia'], from: 'atlas:d34q25' },
  ],
  // 2026-12-02
  [
    { c: 'Countries & Peoples', t: 1, q: 'Which fried balls of ground chickpeas or fava beans are a street food across the Middle East?', a: 'Falafel', d: ['Kibbeh', 'Samosas', 'Croquettes'] },
    { c: 'Countries & Peoples', t: 2, q: 'Which West African rice dish is cooked in a spicy tomato sauce?', a: 'Jollof rice', d: ['Fried rice', 'Paella', 'Pilaf'] },
    { c: 'Countries & Peoples', t: 3, q: 'Which Norwegian dish is dried cod soaked in lye until it turns to jelly?', a: 'Lutefisk', d: ['Gravlax', 'Rakfisk', 'Surstromming'] },
    { c: 'Countries & Peoples', t: 4, q: 'Which people, often called the largest ethnic group without a state of their own, speak an Indo-European language of western Asia?', a: 'The Kurds', d: ['The Chechens', 'The Assyrians', 'The Turkmen'], from: 'atlas:d48q20' },
    { c: 'Countries & Peoples', t: 5, q: 'What is the name of the Andean sun festival revived at Cusco and held every June?', a: 'Inti Raymi', d: ['Yawar Fiesta', 'Alasitas', 'Qoyllur Riti'], from: 'atlas:d58q25' },
  ],
  // 2026-12-03
  [
    { c: 'Countries & Peoples', t: 1, q: 'What are the Russian wooden dolls that nest one inside another called?', a: 'Matryoshka dolls', d: ['Kokeshi dolls', 'Kachina dolls', 'Daruma dolls'] },
    { c: 'Countries & Peoples', t: 2, q: 'Which Danish word describes a feeling of cozy, candlelit contentment?', a: 'Hygge', d: ['Lagom', 'Fika', 'Sisu'] },
    { c: 'Countries & Peoples', t: 3, q: 'Which Native American people gained a written syllabary devised by Sequoyah in the 1820s?', a: 'The Cherokee', d: ['The Navajo', 'The Sioux', 'The Iroquois'] },
    { c: 'Countries & Peoples', t: 4, q: 'North Yemen and South Yemen merged into a single state in which year?', a: '1990', d: ['1994', '1967', '1978'], from: 'atlas:d47q20' },
    { c: 'Countries & Peoples', t: 5, q: 'Which is the smallest island country in the world by area?', a: 'Nauru', d: ['Tuvalu', 'Palau', 'The Maldives'], from: 'atlas:d24q25' },
  ],
  // 2026-12-04
  [
    { c: 'Countries & Peoples', t: 1, q: 'Which Canadian dish of fries, cheese curds and gravy comes from Quebec?', a: 'Poutine', d: ['Tourtiere', 'Bannock', 'Nanaimo bars'] },
    { c: 'Countries & Peoples', t: 2, q: 'Which Dutch cheese is named after the town in South Holland where it was traded?', a: 'Gouda', d: ['Edam', 'Leerdammer', 'Maasdam'] },
    { c: 'Countries & Peoples', t: 3, q: 'Which Viennese chocolate cake with apricot jam is named after the family who created it?', a: 'Sachertorte', d: ['Linzer torte', 'Black Forest cake', 'Dobos torte'] },
    { c: 'Countries & Peoples', t: 4, q: 'Which country separated from the Federation of Malaysia in 1965 to become independent?', a: 'Singapore', d: ['Sarawak', 'Brunei', 'Sabah'], from: 'atlas:d54q20' },
    { c: 'Countries & Peoples', t: 5, q: 'The ouguiya is the currency of which country?', a: 'Mauritania', d: ['Mali', 'Niger', 'Senegal'], from: 'atlas:d04q25' },
  ],
  // 2026-12-05
  [
    { c: 'Countries & Peoples', t: 1, q: 'Which North African staple is made of tiny steamed grains of semolina?', a: 'Couscous', d: ['Bulgur', 'Polenta', 'Quinoa'] },
    { c: 'Countries & Peoples', t: 2, q: 'Which cake of ground corn, split and stuffed, is an everyday food in Venezuela and Colombia?', a: 'The arepa', d: ['The tamale', 'The pupusa', 'The empanada'] },
    { c: 'Countries & Peoples', t: 3, q: 'What is the official language of Bangladesh?', a: 'Bengali', d: ['Urdu', 'Hindi', 'Punjabi'] },
    { c: 'Countries & Peoples', t: 4, q: 'Which South African stew is slow-cooked in a three-legged cast iron pot?', a: 'Potjiekos', d: ['Bobotie', 'Bunny chow', 'Boerewors'] },
    { c: 'Countries & Peoples', t: 5, q: 'The Galapagos Islands are a province of which country?', a: 'Ecuador', d: ['Peru', 'Colombia', 'Panama'], from: 'atlas:d21q25' },
  ],
  // 2026-12-06
  [
    { c: 'Countries & Peoples', t: 1, q: 'Which crisp batter cake with a deep grid pattern is a famous street treat in Belgium?', a: 'The waffle', d: ['The crepe', 'The pancake', 'The donut'] },
    { c: 'Countries & Peoples', t: 2, q: 'Which triangular fried pastry stuffed with spiced potatoes and peas is a popular snack in India?', a: 'The samosa', d: ['The pakora', 'The bhaji', 'The dosa'] },
    { c: 'Countries & Peoples', t: 3, q: 'Which green sauce of parsley, garlic, oil and vinegar is served with grilled meat in Argentina?', a: 'Chimichurri', d: ['Pesto', 'Salsa verde', 'Mojo'] },
    { c: 'Countries & Peoples', t: 4, q: 'Which country was formerly known as the Trucial States?', a: 'United Arab Emirates', d: ['Qatar', 'Oman', 'Bahrain'], from: 'atlas:d41q20' },
    { c: 'Countries & Peoples', t: 5, q: 'The dobra is the currency of which island nation?', a: 'Sao Tome and Principe', d: ['Cape Verde', 'Comoros', 'Seychelles'], from: 'atlas:d28q25' },
  ],
  // 2026-12-07
  [
    { c: 'Countries & Peoples', t: 1, q: 'Which wooden shoes are a traditional symbol of the Netherlands?', a: 'Clogs', d: ['Moccasins', 'Sandals', 'Espadrilles'] },
    { c: 'Countries & Peoples', t: 2, q: 'Which stew of black beans and pork is the national dish of Brazil?', a: 'Feijoada', d: ['Moqueca', 'Churrasco', 'Vatapa'] },
    { c: 'Countries & Peoples', t: 3, q: 'Which long-necked Indian stringed instrument was made famous in the West by Ravi Shankar?', a: 'The sitar', d: ['The sarod', 'The tabla', 'The veena'] },
    { c: 'Countries & Peoples', t: 4, q: 'Which country was formerly known as Nyasaland?', a: 'Malawi', d: ['Zambia', 'Mozambique', 'Tanzania'], from: 'atlas:d22q20' },
    { c: 'Countries & Peoples', t: 5, q: 'The Kingdom of Eswatini was known by which name until 2018?', a: 'Swaziland', d: ['Basutoland', 'Bechuanaland', 'Rhodesia'], from: 'atlas:d11q25' },
  ],
  // 2026-12-08
  [
    { c: 'Countries & Peoples', t: 1, q: 'Which twisted knot of baked bread is a staple of Bavarian beer halls?', a: 'The pretzel', d: ['The bagel', 'The croissant', 'The baguette'] },
    { c: 'Countries & Peoples', t: 2, q: 'Which spicy style of seasoning and grilling chicken or pork comes from Jamaica?', a: 'Jerk', d: ['Barbecue', 'Tandoori', 'Cajun'] },
    { c: 'Countries & Peoples', t: 3, q: 'What is the currency of South Korea?', a: 'The won', d: ['The yen', 'The baht', 'The dong'], from: 'atlas:d29q15' },
    { c: 'Countries & Peoples', t: 4, q: 'Along with Ethiopia, which African country is usually described as never having been colonized by a European power?', a: 'Liberia', d: ['Senegal', 'Sierra Leone', 'Sudan'], from: 'atlas:d09q20' },
    { c: 'Countries & Peoples', t: 5, q: 'Which language, written in a rounded script of its own, is spoken by most people of Sri Lanka?', a: 'Sinhala', d: ['Kannada', 'Telugu', 'Malayalam'], from: 'atlas:d48q25' },
  ],
  // 2026-12-09
  [
    { c: 'Countries & Peoples', t: 1, q: 'Which Middle Eastern dip is made from mashed chickpeas and sesame paste?', a: 'Hummus', d: ['Tzatziki', 'Guacamole', 'Baba ghanoush'] },
    { c: 'Countries & Peoples', t: 2, q: 'Which sharp green paste is served with sushi in Japan?', a: 'Wasabi', d: ['Miso', 'Pickled ginger', 'Mustard'] },
    { c: 'Countries & Peoples', t: 3, q: 'Which spicy coconut noodle soup is a favorite in Malaysia and Singapore?', a: 'Laksa', d: ['Pho', 'Ramen', 'Tom yum'] },
    { c: 'Countries & Peoples', t: 4, q: 'Which is the only country in mainland Africa with Spanish as an official language?', a: 'Equatorial Guinea', d: ['Cape Verde', 'Guinea-Bissau', 'Gabon'], from: 'atlas:d26q20' },
    { c: 'Countries & Peoples', t: 5, q: 'Along with Amharic, which national language of the Horn of Africa is written in the Ethiopic script?', a: 'Tigrinya', d: ['Oromo', 'Somali', 'Afar'], from: 'atlas:d46q25' },
  ],
  // 2026-12-10
  [
    { c: 'Countries & Peoples', t: 1, q: 'Which pastry of thin dough rolled around spiced apples is a classic of Austria?', a: 'Strudel', d: ['Baklava', 'Cannoli', 'Eclair'] },
    { c: 'Countries & Peoples', t: 2, q: 'Which thin, crisp crepe of fermented rice and lentil batter is a staple of South India?', a: 'The dosa', d: ['The naan', 'The paratha', 'The puri'] },
    { c: 'Countries & Peoples', t: 3, q: 'What is the name for the open-faced rye bread sandwiches of Denmark?', a: 'Smorrebrod', d: ['Smorgasbord', 'Lefse', 'Knackebrod'] },
    { c: 'Countries & Peoples', t: 4, q: 'The Althing, founded in 930, is the national assembly of which country?', a: 'Iceland', d: ['Sweden', 'Ireland', 'Norway'], from: 'atlas:d43q20' },
    { c: 'Countries & Peoples', t: 5, q: 'The dalasi is the currency of which country?', a: 'The Gambia', d: ['Senegal', 'Guinea', 'Sierra Leone'], from: 'atlas:d23q25' },
  ],
  // 2026-12-11
  [
    { c: 'Countries & Peoples', t: 1, q: 'Which fermented cabbage is a traditional side dish in Germany?', a: 'Sauerkraut', d: ['Kimchi', 'Coleslaw', 'Pickles'] },
    { c: 'Countries & Peoples', t: 2, q: 'Which roast bird dish, served with thin pancakes and hoisin sauce, is named after the old spelling of China\'s capital?', a: 'Peking duck', d: ['Kung pao chicken', 'Char siu', 'General Tso\'s chicken'] },
    { c: 'Countries & Peoples', t: 3, q: 'People from Sweden are known by which name?', a: 'The Swedes', d: ['The Finns', 'The Norwegians', 'The Icelanders'], from: 'atlas:d26q15' },
    { c: 'Countries & Peoples', t: 4, q: 'Which Asian country has Portuguese as one of its official languages?', a: 'Timor-Leste', d: ['Brunei', 'The Philippines', 'Cambodia'], from: 'atlas:d29q20' },
    { c: 'Countries & Peoples', t: 5, q: 'Which country is the smallest in Africa by total land area?', a: 'Seychelles', d: ['The Gambia', 'Comoros', 'Cape Verde'], from: 'atlas:d06q25' },
  ],
  // 2026-12-12
  [
    { c: 'Countries & Peoples', t: 1, q: 'Which knee-length tartan garment is traditional dress for men in Scotland?', a: 'The kilt', d: ['The sarong', 'The toga', 'The dhoti'] },
    { c: 'Countries & Peoples', t: 2, q: 'Which Native American language was used by US Marine code talkers in the Second World War?', a: 'Navajo', d: ['Cherokee', 'Lakota', 'Apache'] },
    { c: 'Countries & Peoples', t: 3, q: 'Which powdered green tea is whisked in the Japanese tea ceremony?', a: 'Matcha', d: ['Sencha', 'Oolong', 'Genmaicha'] },
    { c: 'Countries & Peoples', t: 4, q: 'Costa Rica, Honduras, Nicaragua and El Salvador all mark independence from Spain in 1821. Which other Central American republic declared it on the same day?', a: 'Guatemala', d: ['Belize', 'Panama', 'Cuba'], from: 'atlas:d44q20' },
    { c: 'Countries & Peoples', t: 5, q: 'The Garifuna were deported in 1797 from which Caribbean island to the coast of Central America?', a: 'Saint Vincent', d: ['Martinique', 'Barbados', 'Grenada'], from: 'atlas:d50q25' },
  ],
  // 2026-12-13
  [
    { c: 'Countries & Peoples', t: 1, q: 'Which rice dish, cooked with saffron in a wide shallow pan, comes from Valencia in Spain?', a: 'Paella', d: ['Risotto', 'Biryani', 'Jambalaya'] },
    { c: 'Countries & Peoples', t: 2, q: 'Which beet soup is a traditional dish of Ukraine and its neighbors?', a: 'Borscht', d: ['Goulash', 'Shchi', 'Solyanka'] },
    { c: 'Countries & Peoples', t: 3, q: 'Which Swedish custom is a daily coffee break with something sweet?', a: 'Fika', d: ['Hygge', 'Lagom', 'Smorgasbord'] },
    { c: 'Countries & Peoples', t: 4, q: 'Which is the largest landlocked country in the world by area?', a: 'Kazakhstan', d: ['Mongolia', 'Chad', 'Niger'], from: 'atlas:d17q20' },
    { c: 'Countries & Peoples', t: 5, q: 'Which people of a small Andaman island have kept almost complete isolation from the outside world?', a: 'The Sentinelese', d: ['The Onge', 'The Jarawa', 'The Nicobarese'], from: 'atlas:d60q25' },
  ],
  // 2026-12-14
  [
    { c: 'Countries & Peoples', t: 1, q: 'Which small four-stringed guitar is closely linked with Hawaiian music?', a: 'The ukulele', d: ['The mandolin', 'The banjo', 'The lute'] },
    { c: 'Countries & Peoples', t: 2, q: 'Which Swedish word for a buffet of many cold and hot dishes has passed into English?', a: 'Smorgasbord', d: ['Fika', 'Lagom', 'Hygge'] },
    { c: 'Countries & Peoples', t: 3, q: 'Finnish, Estonian and Hungarian all belong to which language family?', a: 'Uralic', d: ['Semitic', 'Turkic', 'Indo-European'], from: 'atlas:d42q15' },
    { c: 'Countries & Peoples', t: 4, q: 'Which country was formerly known as Zaire?', a: 'The Democratic Republic of the Congo', d: ['Angola', 'Zambia', 'The Central African Republic'], from: 'atlas:d06q20' },
    { c: 'Countries & Peoples', t: 5, q: 'The extinct dodo appears on the coat of arms of which island country?', a: 'Mauritius', d: ['Seychelles', 'Comoros', 'The Maldives'], from: 'atlas:d02q25' },
  ],
  // 2026-12-15
  [
    { c: 'Countries & Peoples', t: 1, q: 'Which leather shorts with suspenders are traditional dress in Bavaria and Austria?', a: 'Lederhosen', d: ['Breeches', 'Jodhpurs', 'Culottes'] },
    { c: 'Countries & Peoples', t: 2, q: 'Which spongy sour flatbread is the base of most meals in Ethiopia and Eritrea?', a: 'Injera', d: ['Naan', 'Chapati', 'Pita'] },
    { c: 'Countries & Peoples', t: 3, q: 'Which style of Caribbean song, known for witty lyrics, grew up in Trinidad and Tobago?', a: 'Calypso', d: ['Reggae', 'Merengue', 'Salsa'] },
    { c: 'Countries & Peoples', t: 4, q: 'Which rice dish cooked with carrots, onions and lamb in a huge cauldron is the national dish of Uzbekistan?', a: 'Plov', d: ['Biryani', 'Paella', 'Couscous'] },
    { c: 'Countries & Peoples', t: 5, q: 'The tala is the currency of which country?', a: 'Samoa', d: ['Tonga', 'Fiji', 'Kiribati'], from: 'atlas:d35q25' },
  ],
  // 2026-12-16
  [
    { c: 'Countries & Peoples', t: 1, q: 'Which dish of battered fried fish and thick fried potatoes is a British classic?', a: 'Fish and chips', d: ['Bangers and mash', 'Shepherd\'s pie', 'Toad in the hole'] },
    { c: 'Countries & Peoples', t: 2, q: 'Which North African stew is named after the conical clay pot it is cooked in?', a: 'Tagine', d: ['Couscous', 'Shakshuka', 'Harira'] },
    { c: 'Countries & Peoples', t: 3, q: 'People from Finland are known by which name?', a: 'The Finns', d: ['The Danes', 'The Swedes', 'The Estonians'], from: 'atlas:d17q15' },
    { c: 'Countries & Peoples', t: 4, q: 'Which people of the western Pyrenees speak a tongue unrelated to any neighboring language?', a: 'The Basques', d: ['The Catalans', 'The Bretons', 'The Occitans'], from: 'atlas:d42q20' },
    { c: 'Countries & Peoples', t: 5, q: 'Which language of the high Andes, once the tongue of the Inca state, still has millions of speakers?', a: 'Quechua', d: ['Aymara', 'Guarani', 'Mapudungun'], from: 'atlas:d53q25' },
  ],
  // 2026-12-17
  [
    { c: 'Countries & Peoples', t: 1, q: 'Which Japanese wrestling sport is fought by two heavyweights inside a ring of rice straw?', a: 'Sumo', d: ['Judo', 'Kendo', 'Karate'] },
    { c: 'Countries & Peoples', t: 2, q: 'Which three-stringed instrument with a triangular body is a symbol of Russian folk music?', a: 'The balalaika', d: ['The bouzouki', 'The sitar', 'The banjo'] },
    { c: 'Countries & Peoples', t: 3, q: 'The ringgit is the currency of which country?', a: 'Malaysia', d: ['Singapore', 'Brunei', 'Thailand'], from: 'atlas:d09q15' },
    { c: 'Countries & Peoples', t: 4, q: 'Kirundi is an official language of which country?', a: 'Burundi', d: ['Rwanda', 'Tanzania', 'Uganda'], from: 'atlas:d27q20' },
    { c: 'Countries & Peoples', t: 5, q: 'The rufiyaa is the currency of which country?', a: 'The Maldives', d: ['Sri Lanka', 'Seychelles', 'Mauritius'], from: 'atlas:d12q25' },
  ],
  // 2026-12-18
  [
    { c: 'Countries & Peoples', t: 1, q: 'Which afternoon rest is a traditional part of the day in Spain?', a: 'The siesta', d: ['The fiesta', 'The paseo', 'The tapeo'] },
    { c: 'Countries & Peoples', t: 2, q: 'Which Japanese martial art, founded by Jigoro Kano in 1882, became an Olympic sport?', a: 'Judo', d: ['Karate', 'Aikido', 'Kendo'] },
    { c: 'Countries & Peoples', t: 3, q: 'What is the currency of Saudi Arabia?', a: 'The riyal', d: ['The dinar', 'The dirham', 'The pound'] },
    { c: 'Countries & Peoples', t: 4, q: 'In which country is Catalan the sole official language?', a: 'Andorra', d: ['Monaco', 'San Marino', 'Malta'], from: 'atlas:d28q20' },
    { c: 'Countries & Peoples', t: 5, q: 'Mkhedruli is the everyday alphabet used to write which language of the Caucasus?', a: 'Georgian', d: ['Ossetian', 'Chechen', 'Armenian'], from: 'atlas:d54q25' },
  ],
  // 2026-12-19
  [
    { c: 'Countries & Peoples', t: 1, q: 'Which long wooden wind instrument was developed by Aboriginal peoples of northern Australia?', a: 'The didgeridoo', d: ['The bagpipes', 'The panpipes', 'The alphorn'] },
    { c: 'Countries & Peoples', t: 2, q: 'Which small Russian pancakes are often served with sour cream and caviar?', a: 'Blini', d: ['Pierogi', 'Pelmeni', 'Syrniki'] },
    { c: 'Countries & Peoples', t: 3, q: 'What is the currency of Sweden?', a: 'The krona', d: ['The krone', 'The euro', 'The mark'] },
    { c: 'Countries & Peoples', t: 4, q: 'Which country recognizes Malay, Mandarin, Tamil and English as its four official languages?', a: 'Singapore', d: ['Malaysia', 'Brunei', 'Philippines'], from: 'atlas:d36q20' },
    { c: 'Countries & Peoples', t: 5, q: 'Which country was formerly known as Ubangi-Shari?', a: 'Central African Republic', d: ['Chad', 'Cameroon', 'Gabon'], from: 'atlas:d40q25' },
  ],
  // 2026-12-20
  [
    { c: 'Countries & Peoples', t: 1, q: 'Which woolen cloak with a slit for the head is traditional in the Andes?', a: 'The poncho', d: ['The serape', 'The cape', 'The shawl'] },
    { c: 'Countries & Peoples', t: 2, q: 'Which fast field sport played with a wooden stick and a small ball is an ancient Irish game?', a: 'Hurling', d: ['Lacrosse', 'Shinty', 'Field hockey'] },
    { c: 'Countries & Peoples', t: 3, q: 'Which slow-cooked dry beef curry comes from the Minangkabau people of Sumatra?', a: 'Rendang', d: ['Vindaloo', 'Massaman', 'Korma'] },
    { c: 'Countries & Peoples', t: 4, q: 'In which year did Algeria become independent from France?', a: '1962', d: ['1965', '1954', '1958'], from: 'atlas:d52q20' },
    { c: 'Countries & Peoples', t: 5, q: 'Which right to left script was devised solely to write Dhivehi, the language of the Maldives?', a: 'Thaana', d: ['Baybayin', 'Tifinagh', 'Ge\'ez'], from: 'atlas:d42q25' },
  ],
  // 2026-12-21
  [
    { c: 'Countries & Peoples', t: 1, q: 'Which Italian frozen dessert is churned slowly to be denser than ice cream?', a: 'Gelato', d: ['Sorbet', 'Granita', 'Semifreddo'] },
    { c: 'Countries & Peoples', t: 2, q: 'Which curved throwing stick is associated with Aboriginal Australians?', a: 'The boomerang', d: ['The spear', 'The woomera', 'The nulla nulla'] },
    { c: 'Countries & Peoples', t: 3, q: 'Besides Greece, which country has Greek as an official language?', a: 'Cyprus', d: ['Malta', 'Bulgaria', 'Albania'], from: 'atlas:d06q15' },
    { c: 'Countries & Peoples', t: 4, q: 'Which people, whose ancestors came from northern India, are spread widely across Europe and speak an Indo-Aryan language?', a: 'The Roma', d: ['The Sorbs', 'The Sami', 'The Basques'], from: 'atlas:d57q20' },
    { c: 'Countries & Peoples', t: 5, q: 'The pa\'anga is the currency of which Pacific kingdom?', a: 'Tonga', d: ['Samoa', 'Fiji', 'Solomon Islands'], from: 'atlas:d01q25' },
  ],
  // 2026-12-22
  [
    { c: 'Countries & Peoples', t: 1, q: 'Which creamy Italian rice dish is cooked slowly by stirring in hot stock a ladle at a time?', a: 'Risotto', d: ['Paella', 'Pilaf', 'Congee'] },
    { c: 'Countries & Peoples', t: 2, q: 'Which smoked sausage is a traditional food of Poland?', a: 'Kielbasa', d: ['Chorizo', 'Bratwurst', 'Salami'] },
    { c: 'Countries & Peoples', t: 3, q: 'Which French-speaking people of the Louisiana bayous descend from settlers expelled from Acadia?', a: 'The Cajuns', d: ['The Creoles', 'The Metis', 'The Huguenots'] },
    { c: 'Countries & Peoples', t: 4, q: 'Which country was formerly known as Dahomey?', a: 'Benin', d: ['Togo', 'Ghana', 'Ivory Coast'], from: 'atlas:d18q20' },
    { c: 'Countries & Peoples', t: 5, q: 'Krio, an English based creole, is the most widely spoken language of which West African country?', a: 'Sierra Leone', d: ['Liberia', 'Guinea', 'Togo'], from: 'atlas:d10q25' },
  ],
  // 2026-12-23
  [
    { c: 'Countries & Peoples', t: 1, q: 'Which sparkling wine may only carry its name if it is made in a region of northeastern France?', a: 'Champagne', d: ['Prosecco', 'Cava', 'Asti'] },
    { c: 'Countries & Peoples', t: 2, q: 'Which form of classical Japanese theater is known for bold makeup and all-male casts?', a: 'Kabuki', d: ['Noh', 'Bunraku', 'Butoh'] },
    { c: 'Countries & Peoples', t: 3, q: 'Which steamed dumplings are a favorite food of Nepal and Tibet?', a: 'Momo', d: ['Gyoza', 'Baozi', 'Pierogi'] },
    { c: 'Countries & Peoples', t: 4, q: 'Which language, grown out of Dutch among settlers in the far south of Africa, has a written standard of its own?', a: 'Afrikaans', d: ['Flemish', 'Frisian', 'Yiddish'], from: 'atlas:d50q20' },
    { c: 'Countries & Peoples', t: 5, q: 'The cooking of the Peranakan communities of Malaysia and Singapore is usually called what?', a: 'Nyonya cuisine', d: ['Hakka cuisine', 'Kristang cuisine', 'Betawi cuisine'], from: 'atlas:d52q25' },
  ],
  // 2026-12-24
  [
    { c: 'Countries & Peoples', t: 1, q: 'Which clear spirit is most closely associated with Russia and Poland?', a: 'Vodka', d: ['Gin', 'Rum', 'Brandy'] },
    { c: 'Countries & Peoples', t: 2, q: 'Which skewers of grilled meat served with peanut sauce are popular in Indonesia and Malaysia?', a: 'Satay', d: ['Shawarma', 'Yakitori', 'Souvlaki'] },
    { c: 'Countries & Peoples', t: 3, q: 'Which horsemen of the steppes of Ukraine and southern Russia formed self-governing military communities?', a: 'The Cossacks', d: ['The Tatars', 'The Magyars', 'The Mongols'] },
    { c: 'Countries & Peoples', t: 4, q: 'Which boat-shaped bread filled with cheese and egg is a national dish of Georgia in the Caucasus?', a: 'Khachapuri', d: ['Lavash', 'Pide', 'Khinkali'] },
    { c: 'Countries & Peoples', t: 5, q: 'Which people, native to the island of Hokkaido, speak a language isolate that is unrelated to Japanese?', a: 'The Ainu', d: ['The Nivkh', 'The Ryukyuans', 'The Evenks'], from: 'atlas:d44q25' },
  ],
  // 2026-12-25
  [
    { c: 'Countries & Peoples', t: 1, q: 'Which small dishes are served alongside drinks in bars all over Spain?', a: 'Tapas', d: ['Mezze', 'Dim sum', 'Antipasti'] },
    { c: 'Countries & Peoples', t: 2, q: 'Which Japanese dish is seafood and vegetables coated in a light batter and deep-fried?', a: 'Tempura', d: ['Teriyaki', 'Sukiyaki', 'Yakitori'] },
    { c: 'Countries & Peoples', t: 3, q: 'Which musical instrument, made from oil drums, was invented in Trinidad and Tobago?', a: 'The steelpan', d: ['The marimba', 'The conga', 'The bongo'] },
    { c: 'Countries & Peoples', t: 4, q: 'The dirham is the money of Morocco and of which Gulf federation?', a: 'United Arab Emirates', d: ['Qatar', 'Kuwait', 'Bahrain'], from: 'atlas:d40q20' },
    { c: 'Countries & Peoples', t: 5, q: 'Which Pacific country was called the New Hebrides before independence in 1980?', a: 'Vanuatu', d: ['Fiji', 'Solomon Islands', 'Kiribati'], from: 'atlas:d30q25' },
  ],
  // 2026-12-26
  [
    { c: 'Countries & Peoples', t: 1, q: 'Which thin flatbread of corn or wheat is wrapped around the filling of a Mexican taco?', a: 'A tortilla', d: ['A pita', 'A naan', 'A crepe'] },
    { c: 'Countries & Peoples', t: 2, q: 'What is the traditional dress of Korea called?', a: 'The hanbok', d: ['The kimono', 'The ao dai', 'The cheongsam'] },
    { c: 'Countries & Peoples', t: 3, q: 'Which alphabet is used to write the Russian language?', a: 'Cyrillic', d: ['Glagolitic', 'Latin', 'Greek'], from: 'atlas:d47q15' },
    { c: 'Countries & Peoples', t: 4, q: 'The tugrik is the currency of which country?', a: 'Mongolia', d: ['Nepal', 'Kazakhstan', 'Laos'], from: 'atlas:d08q20' },
    { c: 'Countries & Peoples', t: 5, q: 'The N\'Ko alphabet, devised in 1949, was created to write which group of West African languages?', a: 'The Manding languages', d: ['The Akan languages', 'The Yoruba languages', 'The Songhay languages'], from: 'atlas:d43q25' },
  ],
  // 2026-12-27
  [
    { c: 'Countries & Peoples', t: 1, q: 'Which strong, short Italian coffee is made by forcing hot water through ground beans?', a: 'Espresso', d: ['Latte', 'Americano', 'Mocha'] },
    { c: 'Countries & Peoples', t: 2, q: 'Which hard cheese takes its name from the area around Parma in Italy?', a: 'Parmesan', d: ['Mozzarella', 'Gorgonzola', 'Ricotta'] },
    { c: 'Countries & Peoples', t: 3, q: 'Which long-necked stringed instrument is the sound of Greek folk music?', a: 'The bouzouki', d: ['The balalaika', 'The oud', 'The mandolin'] },
    { c: 'Countries & Peoples', t: 4, q: 'The quetzal is the currency of which country?', a: 'Guatemala', d: ['Honduras', 'Belize', 'Panama'], from: 'atlas:d16q20' },
    { c: 'Countries & Peoples', t: 5, q: 'Which is the only country whose territory lies in all four hemispheres?', a: 'Kiribati', d: ['Indonesia', 'Ecuador', 'The Maldives'], from: 'atlas:d17q25' },
  ],
  // 2026-12-28
  [
    { c: 'Countries & Peoples', t: 1, q: 'Which round, flat woolen cap is a classic symbol of France?', a: 'The beret', d: ['The fez', 'The bowler', 'The fedora'] },
    { c: 'Countries & Peoples', t: 2, q: 'Which Italian dessert layers coffee-soaked ladyfingers with mascarpone cream?', a: 'Tiramisu', d: ['Panna cotta', 'Cannoli', 'Zabaglione'] },
    { c: 'Countries & Peoples', t: 3, q: 'The euro replaced which unit of money in Greece?', a: 'The drachma', d: ['The lira', 'The escudo', 'The peseta'], from: 'atlas:d41q15' },
    { c: 'Countries & Peoples', t: 4, q: 'Which country was formerly known as Portuguese Guinea?', a: 'Guinea-Bissau', d: ['Guinea', 'Equatorial Guinea', 'Cape Verde'], from: 'atlas:d20q20' },
    { c: 'Countries & Peoples', t: 5, q: 'Which is the smallest sovereign state in the Americas by area?', a: 'Saint Kitts and Nevis', d: ['Grenada', 'Dominica', 'Antigua and Barbuda'], from: 'atlas:d16q25' },
  ],
  // 2026-12-29
  [
    { c: 'Countries & Peoples', t: 1, q: 'Which Hindi film industry based in Mumbai has a nickname modeled on Hollywood?', a: 'Bollywood', d: ['Nollywood', 'Tollywood', 'Lollywood'] },
    { c: 'Countries & Peoples', t: 2, q: 'Which Indian rice dish is layered with spiced meat or vegetables and saffron?', a: 'Biryani', d: ['Pilau', 'Dal', 'Korma'] },
    { c: 'Countries & Peoples', t: 3, q: 'Which fruit, paired with saltfish, makes up the national dish of Jamaica?', a: 'Ackee', d: ['Plantain', 'Breadfruit', 'Mango'] },
    { c: 'Countries & Peoples', t: 4, q: 'Which Icelandic delicacy is shark meat fermented and hung to dry for months?', a: 'Hakarl', d: ['Lutefisk', 'Gravlax', 'Skyr'] },
    { c: 'Countries & Peoples', t: 5, q: 'The gourde is the currency of which country?', a: 'Haiti', d: ['Cuba', 'Jamaica', 'The Dominican Republic'], from: 'atlas:d05q25' },
  ],
  // 2026-12-30
  [
    { c: 'Countries & Peoples', t: 1, q: 'Which Spanish punch is made of red wine with chopped fruit?', a: 'Sangria', d: ['Horchata', 'Mulled wine', 'Sherry'] },
    { c: 'Countries & Peoples', t: 2, q: 'Which Korean dish is a bowl of rice topped with vegetables, egg and chili paste?', a: 'Bibimbap', d: ['Bulgogi', 'Japchae', 'Tteokbokki'] },
    { c: 'Countries & Peoples', t: 3, q: 'The shekel is the currency of which country?', a: 'Israel', d: ['Lebanon', 'Jordan', 'Cyprus'], from: 'atlas:d13q15' },
    { c: 'Countries & Peoples', t: 4, q: 'How many national languages does Switzerland recognize?', a: 'Four', d: ['Two', 'Three', 'Five'], from: 'atlas:d23q20' },
    { c: 'Countries & Peoples', t: 5, q: 'Papiamento, spoken on Aruba and Curacao, is a creole built mainly on which two European languages?', a: 'Spanish and Portuguese', d: ['Dutch and English', 'Dutch and Portuguese', 'French and Spanish'], from: 'atlas:d59q25' },
  ],
  // 2026-12-31
  [
    { c: 'Countries & Peoples', t: 1, q: 'Which rice wine is a traditional drink of Japan?', a: 'Sake', d: ['Soju', 'Mead', 'Ouzo'] },
    { c: 'Countries & Peoples', t: 2, q: 'Which brimless red felt hat with a tassel shares its name with a Moroccan city?', a: 'The fez', d: ['The beret', 'The turban', 'The kufi'] },
    { c: 'Countries & Peoples', t: 3, q: 'Which currency, named after the Roman denarius, is used in Jordan, Kuwait and Bahrain?', a: 'The dinar', d: ['The riyal', 'The dirham', 'The pound'] },
    { c: 'Countries & Peoples', t: 4, q: 'In which year did Bangladesh become independent from Pakistan?', a: '1971', d: ['1974', '1965', '1947'], from: 'atlas:d59q20' },
    { c: 'Countries & Peoples', t: 5, q: 'The somoni is the currency of which country?', a: 'Tajikistan', d: ['Turkmenistan', 'Kyrgyzstan', 'Uzbekistan'], from: 'atlas:d20q25' },
  ],
];
