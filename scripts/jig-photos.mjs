// The photo pool for Jig, the daily jigsaw. Every row is a Wikimedia Commons
// FEATURED picture under a free licence (public domain, CC0, CC BY or CC BY-SA;
// never GFDL-only), a JPEG at least 2,400px wide and landscape (3:2 to 16:9).
// They were pulled 2026-10-15 through the Commons API in Chrome, scored for
// detail and colour on a 9x6 grid (a jigsaw needs texture in every piece: no
// photo may be more than a fifth flat sky or water), eyeballed on a contact
// sheet, and approved by the owner. `t` is the Commons file title the image
// route fetches; `name` is what the finish card calls the picture; `lic` and
// `by` are printed with it. The order is the deal order: gen-jig.mjs hands
// them out one a day from launch.
//
// THE ORDER ROTATES SUBJECTS (owner, 2026-10-16): no subject two days running.
// Five kinds: scenery and nature, cities and buildings, animals, flowers, and
// everything else (food, festivals, people at work). Scenery is about half the
// pool, so it lands every other day and the rest rotate through the gaps. On
// 2026-10-16 every unplayed row (2026-10-17 on) was re-sequenced this way and
// nine animals from the backfill were spread through it; the Christmas market
// was pinned to the first Saturday of December. Keep the rotation when you add
// rows at the end, and never move a row that has gone live.
export const PHOTOS = [
  { t: 'Lake Tekapo 01.jpg', name: 'Lake Tekapo, New Zealand', lic: 'CC BY-SA 4.0', by: 'Krzysztof Golik' },
  { t: 'Haarlem, molen de Adriaan foto2 2015-01-04 09.37.jpg', name: 'The De Adriaan windmill, Haarlem', lic: 'CC BY-SA 4.0', by: 'Michielverbeek' },
  { t: 'Itsukushima-jinja torii at sunset, Miyajima, Japan, 20240816 1812 4144.jpg', name: 'The Itsukushima torii at sunset, Miyajima', lic: 'CC BY 4.0', by: 'Jakub Hałun' },
  { t: 'Seljalandsfoss, Suðurland, Islandia, 2014-08-16, DD 201-203 HDR.JPG', name: 'Seljalandsfoss, Iceland', lic: 'CC BY-SA 4.0', by: 'Diego Delso' },
  { t: 'Raccoon in Central Park (35264).jpg', name: 'A raccoon in Central Park', lic: 'CC BY-SA 4.0', by: 'Rhododendrites' },
  { t: 'Second Beach Olympic June 2018 008.jpg', name: 'Second Beach, Olympic National Park', lic: 'CC BY-SA 4.0', by: 'King of Hearts' },
  { t: 'Dülmen, Fröbelstraße, Mohn am Feldrand -- 2021 -- 9174.jpg', name: 'Poppies at the edge of a field, Dülmen', lic: 'CC BY-SA 4.0', by: 'Dietmar Rabich' },
  { t: 'Vandans Lünersee Vogelperspektive W.jpg', name: 'The Lünersee from above, Austria', lic: 'CC BY-SA 4.0', by: 'Herbert Heim' },
  { t: 'Zrinski Castle in Cakovec (13).jpg', name: 'Zrinski Castle, Čakovec, Croatia', lic: 'CC BY-SA 4.0', by: 'Krzysztof Golik' },
  { t: 'Longsheng Rice Terraces November 2017 014.jpg', name: 'The Longsheng rice terraces, China', lic: 'CC BY-SA 4.0', by: 'King of Hearts' },
  { t: 'Toy Poodle wearing clothes in Tokyo.jpg', name: 'A toy poodle dressed for Tokyo', lic: 'CC BY-SA 4.0', by: 'Basile Morin' },
  { t: 'Lech - Bürstegg - Sitzbank 01.jpg', name: 'A bench above Lech, Austria', lic: 'CC BY-SA 4.0', by: 'Basotxerri' },
  { t: 'Pedestrian road with pavements and paper umbrellas, Higashiyama-ku, Kyoto, Japan, early morning.jpg', name: 'A morning street in Higashiyama, Kyoto', lic: 'CC BY-SA 4.0', by: 'Basile Morin' },
  { t: 'Waterfall in Russian Gulch State Park.jpg', name: 'A waterfall in Russian Gulch State Park, California', lic: 'CC BY-SA 4.0', by: 'Frank Schulenburg' },
  { t: 'Japan tea ceremony 1165.jpg', name: 'A Japanese tea ceremony', lic: 'CC BY-SA 4.0', by: 'Ermell' },
  { t: 'Mountains in snow, Mountain lake, Chola Valley, Nepal, Himalayas.jpg', name: 'A mountain lake in the Chola Valley, Nepal', lic: 'CC BY 4.0', by: 'Vyacheslav Argenberg' },
  { t: 'Sleeping cat on her back.jpg', name: 'A cat asleep on her back', lic: 'CC BY 2.0', by: 'Umberto Salvagnin' },
  { t: 'Colorful sky with orange clouds reflecting in the water of a paddy field, at sunset, Vang Vieng, Laos.jpg', name: 'A paddy field at sunset, Vang Vieng, Laos', lic: 'CC BY-SA 4.0', by: 'Basile Morin' },
  { t: 'Panorama of Frankfurt with Ignatz-Bubis-Brücke at sunset.jpg', name: 'Frankfurt at sunset', lic: 'CC BY 2.0', by: 'Marco Nürnberger' },
  { t: 'Hemerocallis fulva 2018 G1.jpg', name: 'Orange daylilies', lic: 'Public domain', by: 'George Chernilevsky' },
  { t: 'Chimney Rock Trail Point Reyes December 2016 009.jpg', name: 'Chimney Rock, Point Reyes', lic: 'CC BY-SA 4.0', by: 'King of Hearts' },
  { t: 'Crown of Thorns Starfish at Malapascuas Island v. II.jpg', name: 'A crown-of-thorns starfish, Malapascua', lic: 'CC BY-SA 4.0', by: 'Matt Kieffer' },
  { t: 'Opal Pool YNP2 filtered noise.jpg', name: 'Opal Pool, Yellowstone', lic: 'CC BY-SA 3.0', by: 'Acroterion, derivative by Gaendalf' },
  { t: '2019-07-20-Dingle Lighthouse-0673.jpg', name: 'Dingle Lighthouse, Ireland', lic: 'CC BY-SA 4.0', by: 'Superbass' },
  { t: 'Lukmanierpass, Passo del Lucomagno. 20-09-2022. (actm.) 04.jpg', name: 'The Lukmanier Pass, Switzerland', lic: 'CC BY-SA 4.0', by: 'Agnes Monkelbaan' },
  { t: 'De Viron Castle (DSC 2198).jpg', name: 'De Viron Castle, Belgium', lic: 'CC BY 4.0', by: 'Trougnouf (Benoit Brummer)' },
  { t: 'Lonely house on the coast near Eiði - Faroe Islands (50413406426).jpg', name: 'A house on the coast near Eiði, Faroe Islands', lic: 'CC BY 2.0', by: 'Sanshiro Kubota' },
  { t: 'Dalmatian fetching a stick.jpg', name: 'A Dalmatian fetching a stick', lic: 'CC BY-SA 4.0', by: 'Lucasbosch' },
  { t: 'View towards Mount Fuji from Arakurayama Sengen Park in Fujiyoshida, Yamanashi, Japan, 2024 May - 2.jpg', name: 'Mount Fuji from Arakurayama Sengen Park', lic: 'CC BY-SA 4.0', by: 'Ximonic (Simo Räsänen)' },
  { t: 'Clematis \'Parisienne\' 2019-05-29 09-20-43 (C).jpg', name: 'A clematis flower', lic: 'CC BY-SA 4.0', by: 'Ermell' },
  { t: 'Caracol falls (2 April 2008).jpg', name: 'Caracol Falls, Brazil', lic: 'CC BY-SA 3.0', by: 'Tiago Fioreze' },
  { t: 'Šášovský hrad (by Pudelek) 1.JPG', name: 'Šášov Castle, Slovakia', lic: 'CC BY-SA 3.0', by: 'Pudelek' },
  { t: 'Lac de Roy 10.jpg', name: 'Lac de Roy', lic: 'CC BY-SA 4.0', by: 'Krzysztof Golik' },
  { t: 'Baby Goat in Margarita Island, Venezuela.jpg', name: 'A baby goat, Margarita Island', lic: 'CC BY-SA 3.0', by: 'Béria Lima de Rodríguez' },
  { t: 'Cañón Silfra, Parque Nacional de Þingvellir, Suðurland, Islandia, 2014-08-16, DD 055.JPG', name: 'The Silfra fissure, Iceland', lic: 'CC BY-SA 4.0', by: 'Diego Delso' },
  { t: 'Lwów - Widok z wieży ratuszowej 01.jpg', name: 'Lviv from the town hall tower', lic: 'CC BY-SA 3.0', by: 'Lestat (Jan Mehlich)' },
  { t: 'Bussaglia plage Serriera.jpg', name: 'Bussaglia beach, Corsica', lic: 'CC BY-SA 3.0', by: 'Myrabella' },
  { t: 'Fisherman at Muzhappilangad Beach.jpg', name: 'A fisherman at Muzhappilangad Beach, India', lic: 'CC BY-SA 4.0', by: 'Shagil Kannur' },
  { t: 'Golden Gate YNP1.jpg', name: 'Golden Gate canyon, Yellowstone', lic: 'CC BY-SA 4.0', by: 'Acroterion' },
  { t: 'Krabbenspinne Misumena vatia auf Sonnenblume-20190727-RM-075353.jpg', name: 'A crab spider on a sunflower', lic: 'CC BY-SA 4.0', by: 'Ermell' },
  { t: 'Landscape of Luang Prabang with a temporary wooden footbridge.jpg', name: 'A wooden footbridge at Luang Prabang, Laos', lic: 'CC BY-SA 4.0', by: 'Basile Morin' },
  { t: 'Grant Park, Chicago, Illinois, Estados Unidos, 2012-10-20, DD 03.jpg', name: 'Grant Park, Chicago', lic: 'CC BY-SA 3.0', by: 'Diego Delso' },
  { t: 'Heliopsis helianthoides flower.jpg', name: 'An ox-eye sunflower', lic: 'CC BY-SA 4.0', by: 'Lystopad' },
  { t: 'Wle Calafuria 11.jpg', name: 'The Calafuria coast, Tuscany', lic: 'CC BY-SA 4.0', by: 'Anna.Massini' },
  { t: 'Eurasian eagle-owl (44088).jpg', name: 'A Eurasian eagle-owl', lic: 'CC BY-SA 4.0', by: 'Rhododendrites' },
  { t: 'Saslonch da Sacun Gherdëina.jpg', name: 'The Sassolungo, Val Gardena', lic: 'CC BY-SA 3.0', by: 'Wolfgang Moroder' },
  { t: '26-216-0028 Rakovets Castle RB.jpg', name: 'Rakovets Castle, Ukraine', lic: 'CC BY-SA 4.0', by: 'Rbrechko' },
  { t: 'From Tennfjorden towards Raftsundet, Hinnøya, Norway, 2015 September - 2.jpg', name: 'Tennfjorden, Hinnøya, Norway', lic: 'CC BY-SA 3.0', by: 'Ximonic (Simo Räsänen)' },
  { t: '20090719 Crkva Gospa od Zdravlja Kotor Bay Montenegro.jpg', name: 'The Church of Our Lady of Health above Kotor Bay', lic: 'CC BY-SA 3.0', by: 'Ggia' },
  { t: 'Yellowstone National Park (WY, USA), Firehole River, Abflusskanal des Excelsior Geysirs -- 2022 -- 2572-4.jpg', name: 'The Firehole River, Yellowstone', lic: 'CC BY-SA 4.0', by: 'Dietmar Rabich' },
  { t: 'Rhinogobius flumineus(Hamamatsu,Shizuoka,Japan).jpg', name: 'A goby in a Shizuoka stream', lic: 'CC BY-SA 3.0', by: 'Seotaro' },
  { t: 'Breitscheidplatz November 2013.jpg', name: 'The Christmas market at Breitscheidplatz, Berlin', lic: 'CC BY-SA 3.0', by: 'Arild Vågen' },
  { t: 'Obersaxen Mundaun, 28-09-2025. (actm.) 07.jpg', name: 'Obersaxen Mundaun, Switzerland', lic: 'CC BY-SA 4.0', by: 'Agnes Monkelbaan' },
  { t: 'Iris ensata Thunb.jpg', name: 'A Japanese iris', lic: 'CC BY-SA 3.0', by: 'Laitche' },
  { t: 'Baltic Sea view from Schmiedeberg hill in Rerik, 2025-06-23.jpg', name: 'The Baltic Sea from Rerik', lic: 'CC BY-SA 4.0', by: 'Radomianin' },
  { t: 'Le Grau-du-Roi - Sunset over the port\'s canal - 01.jpg', name: 'Sunset over the canal, Le Grau-du-Roi', lic: 'CC BY-SA 4.0', by: 'Benjamin Smith' },
  { t: 'Heilbronn - Böckingen - Ziegeleipark - Ziegeleisee - Ansicht von Osten im Frühling (2.2, mit Schwan).jpg', name: 'A lake in spring, Heilbronn', lic: 'CC BY-SA 4.0', by: 'Roman Eisele' },
  { t: 'Calico cat, - Assisi, Italy.jpg', name: 'A calico cat in Assisi', lic: 'CC BY-SA 4.0', by: 'Terragio67' },
  { t: 'Utah Dunes Landscape - West Desert District.jpg', name: 'Dunes in Utah’s West Desert', lic: 'Public domain', by: 'Bureau of Land Management' },
  { t: 'Jerusalem-2013(2)-Aerial-Temple Mount-(south exposure).jpg', name: 'The Temple Mount from the air, Jerusalem', lic: 'CC BY-SA 4.0', by: 'Godot13' },
  { t: 'New York Botanical Garden October 2016 010.jpg', name: 'A waterfall at the New York Botanical Garden', lic: 'CC BY-SA 4.0', by: 'King of Hearts' },
  { t: 'ScotRail 156 456 and 458 Corrour - Tulloch.jpg', name: 'A train near Corrour, Scotland', lic: 'CC BY-SA 4.0', by: 'Kabelleger' },
  { t: 'Mount Ida chain Messara plain from Phaistos Crete Greece.jpg', name: 'The Messara plain from Phaistos, Crete', lic: 'CC0', by: 'Jebulon' },
  { t: 'Alaska Red Fox (Vulpes vulpes).jpg', name: 'A red fox, Alaska', lic: 'CC BY-SA 2.0', by: 'Gregory "Slobirdr" Smith' },
  { t: 'Nilgiris Sholur Reflection Bokkapuram Sep22 R16 06402.jpg', name: 'Sholur reflection, Nilgiris, India', lic: 'CC BY-SA 4.0', by: 'Timothy A. Gonsalves' },
  { t: 'Fischburg in Gröden Südtirol.jpg', name: 'Fischburg Castle, Val Gardena', lic: 'CC BY-SA 3.0', by: 'Wolfgang Moroder' },
  { t: 'Cleome spinosa 2012.jpg', name: 'A spider flower', lic: 'CC BY-SA 3.0', by: 'JLPC' },
  { t: 'Colorful sky with orange and pink clouds reflecting in the water of a paddy field at dusk in Don Det Laos.jpg', name: 'A paddy field at dusk, Don Det, Laos', lic: 'CC BY-SA 4.0', by: 'Basile Morin' },
  { t: 'Hoary Marmot in Glacier National Park.jpg', name: 'A hoary marmot, Glacier National Park', lic: 'CC BY 4.0', by: 'Trougnouf' },
  { t: 'Rotenfels 2025.jpg', name: 'The Rotenfels cliffs, Germany', lic: 'CC BY-SA 4.0', by: 'Jörg Braukmann' },
  { t: 'Sandhamn August 2016 02.jpg', name: 'Sandhamn, Sweden', lic: 'CC BY-SA 4.0', by: 'ArildV' },
  { t: 'Pajara (Fuerteventura, Spain), Mirador Astronómico de Sicasumbre, Ausblick -- 2025 -- 7140.jpg', name: 'The hills of Fuerteventura from Sicasumbre', lic: 'CC BY-SA 4.0', by: 'Dietmar Rabich' },
];

// THE BACKFILL (owner, 2026-10-16): twenty-five boards dealt BEFORE launch, one
// a day from 2026-09-20 to 2026-10-14, as if Jig had run all along, so the
// archive and the puzzle shelf open with a month of pictures on them. The
// owner asked for funnier and more topical photos here than the launch pool
// (a puppy or three, Oktoberfest on its opening weekend, the first day of
// fall on Sep 22, World Animal Day on Oct 4, a barn owl for Halloween month),
// then for a mix: animals fall on alternate days, with cities, food, scenery
// and festivals rotating between them, so no subject runs two days. Same rules as PHOTOS
// (Commons featured pictures, free licence, never GFDL-only) except that a few
// are nearly square: the client cuts with a centred slice, and every subject
// here sits in the middle of its frame. The zebras were first a GFDL-only
// picture and were swapped for Diego Delso's Tarangire pair before shipping.
// gen-jig.mjs deals these in order from 2026-09-20; never reorder them.
export const BACKFILL = [
  { t: 'Oktoberfest 2015 - Impression 5.JPG', name: 'A thrill ride at Oktoberfest, Munich', lic: 'CC BY-SA 4.0', by: 'Martin Falbisoner' },
  { t: 'Two French bulldogs swimming in life jackets.jpg', name: 'Two French bulldogs in life jackets', lic: 'CC0', by: 'W.carter' },
  { t: 'Bamberg Bruderwald Herbst-20151102-RM-110637.jpg', name: 'An autumn forest near Bamberg', lic: 'CC BY-SA 4.0', by: 'Ermell' },
  { t: 'Chipmunk with stuffed cheeks in Prospect Park (05980).jpg', name: 'A chipmunk with stuffed cheeks', lic: 'CC BY-SA 4.0', by: 'Rhododendrites' },
  { t: '2018 - Nyhavn on sunset.jpg', name: 'Nyhavn at sunset, Copenhagen', lic: 'CC BY-SA 4.0', by: 'Moahim' },
  { t: 'Penguin in Antarctica jumping out of the water.jpg', name: 'A penguin leaping out of the water', lic: 'CC BY 2.0', by: 'Christopher Michel' },
  { t: 'Cardamom buns.jpg', name: 'Cardamom buns', lic: 'CC0', by: 'W.carter' },
  { t: 'Kissing Prairie dog edit 3.jpg', name: 'Kissing prairie dogs', lic: 'CC BY-SA 3.0', by: 'Brocken Inaglory' },
  { t: 'Atrani (Costiera Amalfitana, 23-8-2011).jpg', name: 'Atrani on the Amalfi Coast', lic: 'CC BY 3.0', by: 'Paolo Costa Baldi' },
  { t: 'Fennec Fox Peek.jpg', name: 'Fennec foxes, peeking', lic: 'CC BY-SA 4.0', by: 'Anass Errihani' },
  { t: 'Münster, Park Sentmaring -- 2015 -- 9923.jpg', name: 'Autumn beech leaves, Münster', lic: 'CC BY-SA 4.0', by: 'Dietmar Rabich' },
  { t: 'Two Red Panda Cubs in the Tree 01.jpg', name: 'Two red panda cubs', lic: 'CC BY-SA 4.0', by: 'Ganga Raj Sunuwar' },
  { t: 'Edible mushrooms in baskets 2022 G1.jpg', name: 'Two baskets of wild mushrooms', lic: 'CC BY-SA 4.0', by: 'George Chernilevsky' },
  { t: 'Ponte di Rialto Venice 1.jpg', name: 'The Rialto Bridge, Venice', lic: 'CC BY-SA 4.0', by: 'Kallerna' },
  { t: 'White dog sleeping on the floor with puppies after nursing in Don Det Laos.jpg', name: 'A mother dog and her puppies', lic: 'CC BY-SA 4.0', by: 'Basile Morin' },
  { t: 'Green karst peaks seen from the top of Mount Nam Xay a sunny morning with fog Vang Vieng Laos.jpg', name: 'Karst peaks in the morning fog, Vang Vieng, Laos', lic: 'CC BY-SA 4.0', by: 'Basile Morin' },
  { t: 'Sea-otter-morro-bay 13.jpg', name: 'A sea otter, Morro Bay', lic: 'CC BY 2.0', by: 'Mike Baird' },
  { t: 'AvMalecon-LaHabanaCuba-04735.jpg', name: 'A vintage car on the Malecón, Havana', lic: 'CC BY-SA 4.0', by: 'Ezarate' },
  { t: 'West European Hedgehog (Erinaceus europaeus)1.jpg', name: 'A hedgehog in the leaves', lic: 'CC BY-SA 3.0', by: 'Hrald' },
  { t: 'Apple cake with vanilla ice cream 2.jpg', name: 'Apple cake with vanilla ice cream', lic: 'CC0', by: 'W.carter' },
  { t: 'Cebras comunes (Equus quagga), parque nacional de Tarangire, Tanzania, 2024-05-25, DD 90.jpg', name: 'Two zebras, Tarangire, Tanzania', lic: 'CC BY-SA 4.0', by: 'Diego Delso' },
  { t: 'S-charl, Clemgia zijrivier van de Inn. 12-10-2024. (d.j.b) 03.jpg', name: 'An autumn river, S-charl, Switzerland', lic: 'CC BY-SA 4.0', by: 'Dominicus Johannes Bergsma' },
  { t: 'Two puppies playing together one standing over the other at golden hour in Don Det Laos.jpg', name: 'Two puppies at play, Don Det', lic: 'CC BY-SA 4.0', by: 'Basile Morin' },
  { t: 'Venice Carnival - Masked Lovers (2010).jpg', name: 'Masks at the Venice Carnival', lic: 'CC BY 2.0', by: 'Frank Kovalchek' },
  { t: 'Tyto alba 1 Luc Viatour.jpg', name: 'A barn owl in flight', lic: 'CC BY-SA 3.0', by: 'Luc Viatour' },
];
