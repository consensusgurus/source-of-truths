// The photo pool for Saw, the tall daily jigsaw (owner, 2026-11-06). Every row
// is a Wikimedia Commons FEATURED picture under a free licence (public domain,
// CC0, CC BY or CC BY-SA; never GFDL-only), a JPEG at least 2,000px wide and
// PORTRAIT, 1.30 to 1.60 times as tall as it is wide; `w` and `h` are its pixel
// size, which picks the cut (scripts/gen-saw.mjs). None is one of Jig's photos.
// Pulled 2026-11-06 through the Commons search API. `t` is the Commons file
// title the image route fetches; `name` is what the finish card calls the
// picture; `lic` and `by` are printed with it. The order is the deal order.
//
// THE ORDER ROTATES SUBJECTS, as Jig's does: no subject two days running
// (scenery about every other day; animals, buildings and plants or people
// between). Extend the bank by adding rows at the END; never move a row that
// has gone live. 2026-11-06 (contact-sheet review at launch): six too-flat
// picks (Achensee, ginkgo leaf, wind turbines, macaw, elk, purple roller) were
// dropped and the unplayed days re-sequenced. Swap, Slide and Spin borrow these photos later
// (scripts/gen-photo-trio.mjs).
export const PHOTOS = [
  { t: "McWay Falls Big Sur May 2011 001.jpg",  name: "McWay Falls, Big Sur",  lic: "CC BY-SA 3.0",  by: "King of Hearts",  w: 2912,  h: 4368 },
  { t: "A 95 year old woman with her pet rooster, Havana, Cuba.jpg",  name: "A woman and her pet rooster, Havana",  lic: "CC BY-SA 3.0",  by: "Jorge Royan",  w: 2912,  h: 4368 },
  { t: "Prismas Basálticos, Huasca de Ocampo, Hidalgo, México, 2013-10-10, DD 42.JPG",  name: "The basalt prisms of Huasca de Ocampo, Mexico",  lic: "CC BY-SA 3.0",  by: "Diego Delso",  w: 2909,  h: 4520 },
  { t: "Sant Vasily cathedral in Moscow.JPG",  name: "St Basil's Cathedral, Moscow",  lic: "CC BY-SA 4.0",  by: "Petar Milošević",  w: 2576,  h: 3648 },
  { t: "Chamarel Falls Mauritius 2.JPG",  name: "Chamarel Falls, Mauritius",  lic: "CC BY-SA 4.0",  by: "Martin Falbisoner",  w: 2421,  h: 3228 },
  { t: "Felis silvestris silvestris Luc Viatour.jpg",  name: "A European wildcat",  lic: "CC BY-SA 3.0",  by: "Lviatour",  w: 2723,  h: 4085 },
  { t: "Haltern am See, Westruper Heide, Solitärbaum -- 2025 -- 8748.jpg",  name: "A lone tree on the Westruper Heide, Germany",  lic: "CC BY-SA 4.0",  by: "Dietmar Rabich",  w: 4323,  h: 6485 },
  { t: "CampanileGiotto-01.jpg",  name: "Giotto's bell tower, Florence",  lic: "CC BY-SA 2.5",  by: "Thermos",  w: 2218,  h: 3327 },
  { t: "Andoin - Cascadas de la Tobería -BT- 01.jpg",  name: "The Tobería waterfalls, Andoin, Spain",  lic: "CC BY-SA 4.0",  by: "Basotxerri",  w: 3341,  h: 4449 },
  { t: "Hydrangea petiolaris (klimhortensia), 05-03-2024. (actm.) 01.jpg",  name: "A climbing hydrangea bud",  lic: "CC BY-SA 4.0",  by: "Agnes Monkelbaan",  w: 3456,  h: 5184 },
  { t: "Berdorf (LU), Werschrummschloeff -- 2015 -- 6230-4.jpg",  name: "The Werschrumschluff gorge, Luxembourg",  lic: "CC BY-SA 4.0",  by: "Dietmar Rabich",  w: 3662,  h: 5488 },
  { t: "Male northern cardinal in Central Park (52612).jpg",  name: "A northern cardinal in Central Park",  lic: "CC BY-SA 4.0",  by: "Rhododendrites",  w: 2996,  h: 3934 },
  { t: "Rain Vortex Night Jewel Changi Feb23 R16 06856.jpg",  name: "The Rain Vortex at night, Singapore",  lic: "CC BY-SA 4.0",  by: "Timothy A. Gonsalves",  w: 3346,  h: 5019 },
  { t: "Niagarablue.jpg",  name: "Niagara Falls",  lic: "CC BY-SA 3.0",  by: "Evilarry",  w: 3168,  h: 4752 },
  { t: "Black drongo in a pink carpet.jpg",  name: "A black drongo among pink flowers",  lic: "CC BY-SA 4.0",  by: "Ehsan Ali Biswas",  w: 2203,  h: 3306 },
  { t: "Französischer Dom, Gendarmenmarkt, Berlin (Blaue Stunde).jpg",  name: "The Französischer Dom at blue hour, Berlin",  lic: "CC BY 3.0 de",  by: "Ansgar Koreng",  w: 3049,  h: 4574 },
  { t: "Dülmen, Umland, Sonnenaufgang -- 2012 -- 8084.jpg",  name: "Sunrise near Dülmen, Germany",  lic: "CC BY-SA 4.0",  by: "Dietmar Rabich",  w: 3456,  h: 5184 },
  { t: "Athene cunicularia -near Goiania, Goias, Brazil-8 edit.jpg",  name: "A burrowing owl, Brazil",  lic: "CC BY 2.0",  by: "Wagner Machado Carlos Lemes",  w: 2160,  h: 3060 },
  { t: "San Marco cathedral in Venice.JPG",  name: "St Mark's Basilica, Venice",  lic: "CC BY-SA 4.0",  by: "Petar Milosevic",  w: 2361,  h: 3132 },
  { t: "RhB ABe 8-12 3510 Bärentritt.jpg",  name: "A Rhaetian Railway train at the Bärentritt, Switzerland",  lic: "CC BY-SA 4.0",  by: "Kabelleger / David Gubler",  w: 3333,  h: 4996 },
  { t: "Carraca lila (Coracias caudata), parque nacional de Chobe, Botsuana, 2018-07-28, DD 30.jpg",  name: "A lilac-breasted roller, Chobe, Botswana",  lic: "CC BY-SA 4.0",  by: "Diego Delso",  w: 3133,  h: 4563 },
  { t: "At Tenerife 2026 566 - Musaceae flower.jpg",  name: "A banana flower, Tenerife",  lic: "CC BY-SA 4.0",  by: "Mike Peel",  w: 4640,  h: 6960 },
  { t: "Chang Chun Shrine amk.jpg",  name: "The Changchun Shrine, Taroko Gorge, Taiwan",  lic: "CC BY-SA 3.0",  by: "AngMoKio",  w: 2029,  h: 3044 },
  { t: "Blue jay in PP (30960).jpg",  name: "A blue jay in Prospect Park",  lic: "CC BY-SA 4.0",  by: "Rhododendrites",  w: 3319,  h: 4526 },
  { t: "Oakmoss at Myrstigen 3.jpg",  name: "Oakmoss on a branch",  lic: "CC0",  by: "W.carter",  w: 3283,  h: 4925 },
  { t: "Blue-tailed bee-eater (Merops philippinus) Yala 2.jpg",  name: "A blue-tailed bee-eater, Sri Lanka",  lic: "CC BY-SA 4.0",  by: "Charles J. Sharp",  w: 2304,  h: 3456 },
  { t: "Catedral da Sé em São Paulo.jpg",  name: "São Paulo Cathedral",  lic: "CC0",  by: "Wilfredor",  w: 2674,  h: 3614 },
  { t: "Pholiota squarrosoides (Peck) Sacc 664568.jpg",  name: "Shaggy scalycap mushrooms",  lic: "CC BY-SA 3.0",  by: "Sava Krstic",  w: 3185,  h: 4203 },
  // Added 2026-11-12 (the December restock, 2026-12-04 to 12-31), pulled through the Commons
  // API from the Featured pictures subject categories and checked on a contact sheet; the
  // order keeps the subject rotation (no subject two days running) and saves a Christmas
  // picture for 2026-12-25. One pick was refused for custom licence terms on top of CC BY-SA.
  // Content review (2026-11-12): four people photos (12-09, 12-20, 12-24, 12-31) were replaced
  // with no-person featured pictures, Dynjandi and Victoria Falls swapped days (an Atlas
  // Iceland answer on 12-10), and two captions and one credit corrected.
  { t: "Multnomah Falls October 2019 stack.jpg",  name: "Multnomah Falls, Oregon",  lic: "CC BY-SA 4.0",  by: "King of Hearts",  w: 4016,  h: 6016 },
  { t: "Lince ibérico (Lynx pardinus), Almuradiel, Ciudad Real, España, 2021-12-19, DD 02.jpg",  name: "An Iberian lynx, Spain",  lic: "CC BY-SA 4.0",  by: "Diego Delso",  w: 2573,  h: 3859 },
  { t: "Látrabjarg Vestfirðir Iceland.jpg",  name: "The cliffs of Látrabjarg, Iceland",  lic: "CC BY-SA 3.0",  by: "Richard Bartz",  w: 3744,  h: 5616 },
  { t: "Harlech Castle Gatehouse Tower, Merionethshire, Wales - 25-07-2017.jpg",  name: "The gatehouse tower of Harlech Castle, Wales",  lic: "CC BY-SA 4.0",  by: "Cmao20",  w: 3632,  h: 5456 },
  { t: "Serra da Mantiqueira - Acauã Cabral (08).jpg",  name: "The Serra da Mantiqueira above the clouds, Brazil",  lic: "CC BY-SA 4.0",  by: "Acauã Heuruel Cabral",  w: 4000,  h: 6000 },
  { t: "Cooper's hawk in Prospect Park (22513).jpg",  name: "A juvenile Cooper's hawk",  lic: "CC BY-SA 4.0",  by: "Rhododendrites",  w: 3179,  h: 4396 },
  { t: "Cataratas Victoria, Zambia-Zimbabue, 2018-07-27, DD 04.jpg",  name: "Victoria Falls, Zambia and Zimbabwe",  lic: "CC BY-SA 4.0",  by: "Diego Delso",  w: 4203,  h: 6530 },
  { t: "Inca jay (Cyanocorax yncas galeatus) Las Tangaras.jpg",  name: "An Inca jay, Colombia",  lic: "CC BY-SA 4.0",  by: "Charles J. Sharp",  w: 2578,  h: 3867 },
  { t: "New snow on young oaks in Tuntorp.jpg",  name: "New snow on young oaks, Sweden",  lic: "CC BY-SA 4.0",  by: "W.carter",  w: 3456,  h: 5088 },
  { t: "Abtei Seckau Basilika Innenraum 06.jpg",  name: "Inside the basilica of Seckau Abbey, Austria",  lic: "CC BY-SA 4.0",  by: "Uoaei1",  w: 7229,  h: 10844 },
  { t: "Puente colgante sobre el cañón Lynn, Vancouver, Canadá, 2017-08-14, DD 10.jpg",  name: "The Lynn Canyon suspension bridge, British Columbia",  lic: "CC BY-SA 4.0",  by: "Diego Delso",  w: 5726,  h: 8589 },
  { t: "Lilium martagon Tauerntal 01.jpg",  name: "A martagon lily, Austria",  lic: "CC BY-SA 4.0",  by: "Uoaei1",  w: 4000,  h: 6000 },
  { t: "Cascada Dynjandi, Vestfirðir, Islandia, 2014-08-14, DD 136-138 HDR.JPG",  name: "Dynjandi waterfall, Iceland",  lic: "CC BY-SA 4.0",  by: "Diego Delso",  w: 3448,  h: 5306 },
  { t: "Altenfelden Rothirsch Cervus elaphus-2100 (cropped).jpg",  name: "A red deer stag, Austria",  lic: "CC BY-SA 4.0",  by: "Isiwal",  w: 2203,  h: 3378 },
  { t: "Old Tower night winter 2011 G1.jpg",  name: "The old water tower on a winter night, Vinnytsia, Ukraine",  lic: "CC BY-SA 4.0",  by: "George Chernilevsky",  w: 3200,  h: 4450 },
  { t: "Ribeiro Frio (Madeira, Portugal), Levada zur Forellenzucht -- 2025 -- 1510.jpg",  name: "A levada at Ribeiro Frio, Madeira",  lic: "CC BY-SA 4.0",  by: "Dietmar Rabich",  w: 4480,  h: 6720 },
  { t: "Geranium pratense Obervellach 01.jpg",  name: "A meadow cranesbill near Obervellach, Austria",  lic: "CC BY-SA 4.0",  by: "Uoaei1",  w: 4556,  h: 6082 },
  { t: "Göltzschtalbrücke Bogen 0640-PSD.jpg",  name: "An arch of the Göltzsch Viaduct, Germany",  lic: "CC BY-SA 4.0",  by: "Ermell",  w: 3888,  h: 5184 },
  { t: "Steinbock 14962940265 (cropped).jpg",  name: "An Alpine ibex",  lic: "CC BY-SA 3.0 at",  by: "Bernd Thaller",  w: 2760,  h: 3590 },
  { t: "Graz - Uhrenturm6.jpg",  name: "The Clock Tower of Graz, Austria",  lic: "CC BY 3.0",  by: "Wladyslaw",  w: 3761,  h: 4995 },
  { t: "Moon in clouds over snowy trees in Tuntorp.jpg",  name: "A waning moon over snowy trees at dawn, Sweden",  lic: "CC BY-SA 4.0",  by: "W.carter",  w: 3321,  h: 4909 },
  { t: "Julemotiv tegnet av Jenny Nystrøm (24207693358).jpg",  name: "A Christmas scene by Jenny Nyström",  lic: "Public domain",  by: "Jenny Nyström / Adam Cuerden",  w: 5712,  h: 8350 },
  { t: "Gütenbach, Teichschlucht -- 2025 -- 7668.jpg",  name: "The Teichschlucht gorge at Gütenbach, Germany",  lic: "CC BY-SA 4.0",  by: "Dietmar Rabich",  w: 4480,  h: 6720 },
  { t: "Fallow Deer in the German wood.jpg",  name: "A fallow deer in a German wood",  lic: "CC BY 3.0",  by: "Michael Gäbler",  w: 2441,  h: 3728 },
  { t: "Torre del Oro flag Seville Spain.jpg",  name: "The Torre del Oro, Seville",  lic: "CC0",  by: "Jebulon",  w: 2059,  h: 3094 },
  { t: "Wahkeena Falls October 2019.jpg",  name: "Wahkeena Falls, Oregon",  lic: "CC BY-SA 4.0",  by: "King of Hearts",  w: 4016,  h: 6016 },
  { t: "Magnolia liliiflora 2015 G1.jpg",  name: "A lily magnolia in bloom",  lic: "Public domain",  by: "George Chernilevsky",  w: 3330,  h: 5000 },
  { t: "Petronas Towers at Night - from the base upwards.jpg",  name: "The Petronas Towers at night, Kuala Lumpur",  lic: "CC BY-SA 3.0",  by: "Dcubillas",  w: 2848,  h: 4288 },
];
