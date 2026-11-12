// Redact bank extension 2026-12-01 .. 2026-12-31, Place and Event lane.
// Capsule articles for scripts/gen-redact.mjs; identity fields are set there.
// Authored 2026-11-12 against the rules in app/redact/puzzles.js, US
// spellings, and gated by scripts/verify-redact.mjs. Facts are kept at the
// textbook level and were checked against Britannica, UNESCO World Heritage
// listings and the managing bodies' own histories; contested points are hedged.
export const ARTICLES = [
  {
    cat: 'Place', diff: 2, answer: 'Venice',
    aka: { venise: 'venice', venica: 'venice' },
    // avoid: Venice/Venetian printed by art, atlas, script, biz, history, bacon, foodie, deep, feud, origin, streak, and Listed 12-13 (Rialto Bridge, Venice)
    avoid: ['2026-12-01', '2026-12-02', '2026-12-03', '2026-12-04', '2026-12-05', '2026-12-06', '2026-12-07', '2026-12-08', '2026-12-09', '2026-12-10', '2026-12-13', '2026-12-15', '2026-12-17', '2026-12-18', '2026-12-19', '2026-12-20', '2026-12-21', '2026-12-22', '2026-12-23', '2026-12-25', '2026-12-27', '2026-12-28', '2026-12-30', '2026-12-31'],
    text: `The city stands on more than a hundred small islands in a shallow lagoon at the head of the Adriatic Sea, its buildings resting on foundations of wooden piles driven deep into the mud, many of them larch and oak brought from the forests of the mainland. People first settled the marshes in numbers, the story goes, while fleeing invaders after the collapse of Roman power on the mainland. In place of streets there are about 150 canals, crossed by roughly 400 bridges, and the main thoroughfare is the winding Grand Canal.

For centuries Venice was one of the richest powers in Europe, a republic headed by an elected doge and governed by councils of noble families. Its merchant fleets dominated trade between Europe and the eastern Mediterranean, carrying spices, silk and glass, and its state shipyard, the Arsenal, was said to be able to turn out a fully equipped war galley in a single day. The basilica of San Marco, covered in gold mosaics, holds relics brought from Alexandria, and the glassmakers of the island of Murano guarded their methods as state secrets.

The republic lasted more than a thousand years until Napoleon ended it in 1797. Today the historic center has fewer than fifty thousand residents, while tens of thousands of tourists arrive on busy days, and in 2024 the city began charging day trippers an entry fee on peak dates. High tides known as acqua alta regularly flood the lowest squares, and a system of mobile barriers at the lagoon's inlets, called MOSE, began operating in 2020 to hold back the sea. The annual Carnival, with its elaborate masks, draws crowds every winter.`,
  },
  {
    cat: 'Place', diff: 2, answer: 'Niagara Falls',
    aka: { niagra: 'niagara', nigara: 'niagara', niagera: 'niagara' },
    // avoid: Niagara printed by outwit, feud; streak 12-14 keys Ontario, script keys Canada
    avoid: ['2026-12-03', '2026-12-27', '2026-12-14'],
    text: `About twelve thousand years ago, as the last ice sheets melted back, water from the upper Great Lakes began pouring over the edge of an escarpment near what is now Lewiston, New York. A hard cap of rock rested on softer shale, which the falling water undercut, so the brink kept collapsing and retreating upstream. Over the millennia it carved a canyon about seven miles long. The edge once moved back by roughly three feet a year, though engineering has slowed the erosion sharply.

Niagara Falls is really three waterfalls on the Niagara River, which runs north from Lake Erie to Lake Ontario along the border between the United States and Canada. The largest, the Horseshoe Falls, lies mostly on the Canadian side; the American Falls and the smaller Bridal Veil Falls are in New York. Its flow is among the greatest of any waterfall in North America, though much of the river is diverted at night and in the off season to feed hydroelectric plants on both banks. In 1969 engineers dammed the American Falls for several months to study its rock.

The falls drew daredevils almost as soon as they drew honeymooners. In 1859 the French acrobat Charles Blondin crossed the river below the falls on a tightrope, later repeating the feat blindfolded and pushing a wheelbarrow. In 1901 a schoolteacher, Annie Edson Taylor, became the first person to go over the Horseshoe Falls in a barrel and survive, on her sixty third birthday. Tour boats called the Maid of the Mist have carried visitors into the spray at the foot of the falls since the 1840s.`,
  },
  {
    cat: 'Event', diff: 2, answer: 'The Boston Tea Party',
    aka: { bostan: 'boston' },
    // avoid: Boston printed most days by sport, streak, biz, atlas, art, foodie, history and others
    avoid: ['2026-12-01', '2026-12-02', '2026-12-03', '2026-12-04', '2026-12-06', '2026-12-07', '2026-12-08', '2026-12-09', '2026-12-10', '2026-12-11', '2026-12-12', '2026-12-13', '2026-12-14', '2026-12-15', '2026-12-16', '2026-12-18', '2026-12-19', '2026-12-20', '2026-12-21', '2026-12-23', '2026-12-24', '2026-12-25', '2026-12-26', '2026-12-27', '2026-12-28', '2026-12-30', '2026-12-31'],
    text: `On the night of December 16, 1773, a group of colonists, some of them thinly disguised as Mohawk warriors with blankets and soot on their faces, boarded three ships moored at Griffin's Wharf. Working for about three hours, they hauled 342 chests of tea onto the decks, split them open with hatchets, and dumped the contents into the harbor. The cargo belonged to the British East India Company. Crowds watched from the shore, and the men took care to damage nothing else, by one account even replacing a broken padlock.

The protest grew out of a long quarrel over taxes. Parliament had repealed most of the Townshend duties but kept the tax on tea, and the Tea Act of 1773 allowed the struggling company to sell its tea directly to the colonies, cheaper than smuggled Dutch tea but still carrying the duty. Colonists who objected to taxation without representation saw the scheme as a trick to make them accept Parliament's right to tax them. In several ports the tea was turned away or left to rot, but the royal governor of Massachusetts, Thomas Hutchinson, refused to let the ships leave Boston without unloading.

The British government answered with the Coercive Acts, which colonists called the Intolerable Acts. The port of Boston was closed until the tea was paid for, town meetings were restricted and the colony's charter was curtailed. Rather than isolating Massachusetts, the measures pushed the other colonies to its side, and the First Continental Congress met in Philadelphia the following year. Fighting broke out at Lexington and Concord in April 1775. The name Boston Tea Party itself seems to have come into wide use only decades later.`,
  },
  {
    cat: 'Place', diff: 3, answer: 'The Acropolis',
    aka: { acroplis: 'acropolis', akropolis: 'acropolis', accropolis: 'acropolis' },
    // avoid: art 12-09 keys the Parthenon (Elgin marbles); history 12-16 keys Pericles
    avoid: ['2026-12-09', '2026-12-16'],
    text: `In 1687 a Venetian army besieging Athens fired a mortar shell at a hilltop where the Ottoman garrison had stored its gunpowder inside an ancient temple. The explosion blew out the center of the building, collapsing much of its colonnade and many of its carved panels, and left it as the shell visitors see today. More than two thousand years earlier, the same temple had been built as the showpiece of Athens at the height of its power, and it had survived the centuries in between as a church and then as a mosque.

The rocky outcrop that rises above the city had been a fortress and a sacred site since the Bronze Age. After Persian invaders burned its temples in 480 BC, the Athenian statesman Pericles launched a rebuilding program in the middle of the fifth century BC, paid for in part with funds from an alliance of Greek city states. The Parthenon, dedicated to Athena, was finished in 432 BC, followed by the monumental gateway called the Propylaea, the small temple of Athena Nike and the Erechtheion, whose porch is held up by six sculpted maidens known as caryatids.

The Acropolis remains the defining symbol of classical Greece and was inscribed as a World Heritage Site in 1987. Its buildings have been under careful restoration for decades, and air pollution forced the removal of the original caryatids to a museum. Many of the Parthenon's sculptures were taken away in the early nineteenth century by agents of Lord Elgin and sold to the British Museum, where they remain. Greece has long demanded their return, and the new Acropolis Museum, opened in 2009, keeps gallery space ready for them.`,
  },
  {
    cat: 'Place', diff: 3, answer: 'Alcatraz',
    aka: { alcatrez: 'alcatraz', alcatras: 'alcatraz', alkatraz: 'alcatraz' },
    // avoid: Alcatraz printed by carmen
    avoid: ['2026-12-10'],
    text: `On the night of June 11, 1962, three prisoners slipped out of their cells through holes they had spent months chiseling around the air vents with sharpened spoons and a drill improvised from a small electric motor. They left dummy heads in their beds, made of soap, toilet paper and real hair from the prison barbershop, climbed to the roof and launched a raft stitched from more than fifty raincoats into the cold currents of San Francisco Bay. Frank Morris and the brothers John and Clarence Anglin were never seen again.

The island had been a fortress and then a military prison before the federal Bureau of Prisons took it over in 1934 as a maximum security penitentiary for inmates who caused trouble elsewhere. Its reputation rested on isolation: the water was cold, the currents strong, and the shore more than a mile away. Inmates had one prisoner to a cell, few privileges and, in the early years, a rule of strict silence. Al Capone served time there, as did George Machine Gun Kelly and Robert Stroud, known as the Birdman of Alcatraz, though he kept no birds on the island.

The prison closed in 1963, largely because the crumbling buildings had become too costly to maintain. From 1969 to 1971 a group of Native American activists occupied the island, claiming it under an old treaty and drawing national attention to their cause. It became part of the Golden Gate National Recreation Area in 1972, and more than a million visitors a year have taken the ferry across. Officially, the escapers of 1962 are presumed drowned, but the case files stayed open for decades.`,
  },
  {
    cat: 'Event', diff: 3, answer: 'The Battle of Hastings',
    aka: { hastins: 'hastings', hastngs: 'hastings' },
    // avoid: Hastings printed by art, streak, history, quotes
    avoid: ['2026-12-04', '2026-12-12', '2026-12-20', '2026-12-21', '2026-12-26'],
    text: `Early in January 1066 the English king Edward the Confessor died without a son, and the council of leading men chose Harold Godwinson, the most powerful earl in the kingdom, as his successor. Two other men believed the crown was theirs. Harald Hardrada, king of Norway, invaded the north in September and was killed with most of his army at Stamford Bridge near York. Three days later, William, Duke of Normandy, landed his army on the south coast, claiming that Edward had promised him the throne and that Harold had sworn to support him.

Harold marched south at speed and on October 14 drew up his army on a ridge about seven miles from Hastings, at the place now called Battle. His housecarls and the local levies formed a shield wall, and for most of the day the Norman cavalry, archers and infantry could not break it. At one point a rumor spread that William had been killed, and he is said to have lifted his helmet to show his face to his men. The English line began to break when parts of it chased Normans who were retreating, or pretending to retreat, down the slope.

By evening Harold was dead, according to one tradition struck in the eye by an arrow, a scene famously shown, though its reading is disputed, in the Bayeux Tapestry. Two of his brothers died with him. William was crowned in Westminster Abbey on Christmas Day 1066, and over the next two decades the Normans replaced nearly the whole English aristocracy. The conquest reshaped the language, adding thousands of French words, and William later ordered the great survey recorded in the Domesday Book.`,
  },
  {
    cat: 'Event', diff: 3, answer: 'The Dust Bowl',
    aka: {},
    // avoid: Dust Bowl printed by biz, deep; garble 12-30 scrambles BLACK, hearsay prints black
    avoid: ['2026-12-12', '2026-12-15', '2026-12-30'],
    text: `On Sunday, April 14, 1935, the afternoon sky over the southern Great Plains turned black. A wall of blowing soil hundreds of miles wide rolled south across Kansas, Oklahoma and the Texas Panhandle, turning day into night so suddenly that people caught outdoors could not see their own hands. Birds fled ahead of it. The storm became known as Black Sunday, and a reporter's dispatch about it gave a lasting name to the whole stricken region.

The Dust Bowl had been years in the making. During the wheat boom of the 1910s and 1920s, encouraged by high prices and new tractors, farmers plowed up millions of acres of native prairie grass whose deep roots had held the soil in place. When severe drought arrived in the early 1930s and wheat prices collapsed in the Depression, the bare fields simply blew away. Storms of fine grit buried fences and machinery, killed livestock, and caused a lung ailment that doctors called dust pneumonia.

Thousands of families gave up. Many of the migrants who headed west to California were from Oklahoma and were lumped together as Okies, whatever their home state, and their hardships were captured in John Steinbeck's novel The Grapes of Wrath, in Dorothea Lange's photographs and in the songs of Woody Guthrie. The federal government responded by buying up exhausted land, paying farmers to adopt contour plowing and crop rotation, and planting a shelterbelt of more than two hundred million trees from North Dakota to Texas. The Soil Conservation Service was created in 1935. Rain finally returned in the fall of 1939.`,
  },
  {
    cat: 'Place', diff: 4, answer: 'Lalibela',
    aka: { lalibella: 'lalibela', lalibala: 'lalibela', lallibela: 'lalibela' },
    // avoid: its text names Ethiopia, an answer or choice those days in gene, carmen, streak, atlas, biz, foodie
    avoid: ['2026-12-03', '2026-12-04', '2026-12-05', '2026-12-07', '2026-12-08', '2026-12-12', '2026-12-15', '2026-12-16', '2026-12-19', '2026-12-31'],
    text: `In the highlands of northern Ethiopia, at an altitude of about 2,500 meters, stand eleven medieval churches that were not built but carved. Workers cut down into the soft volcanic rock from above, isolating great blocks inside deep trenches and then hollowing them out into naves, columns, windows and vaulted roofs, each from a single piece of stone. Some rise more than ten meters from the floor of their trench. The most famous, the Church of Saint George, was cut in the shape of a cross and is reached through a passage in the rock.

Tradition credits the work to a king of the Zagwe dynasty who reigned around the late twelfth and early thirteenth centuries and gave the town its present name, Lalibela. According to legend he set out to build a new Jerusalem after the original fell to Saladin in 1187 and pilgrimage became difficult, and local names echo the Holy Land: a channel through the site is called the Jordan. Pious stories say angels worked on the churches at night. Historians think the complex may have been shaped over a longer period, and some of the structures may first have served other purposes.

The churches are still in use by the Ethiopian Orthodox Church, with priests guarding illuminated manuscripts and processional crosses in their dim interiors. At the Christmas feast of Genna, celebrated in early January, tens of thousands of white-robed pilgrims crowd the trenches and rock ledges for all-night services. The site was among the first places inscribed as World Heritage Sites, in 1978, and protective shelters now cover several of the churches against the rain.`,
  },
  {
    cat: 'Place', diff: 4, answer: 'Carcassonne',
    aka: { carcasonne: 'carcassonne', carcassone: 'carcassonne', carcasonn: 'carcassonne' },
    text: `In the middle of the nineteenth century the architect Eugene Viollet-le-Duc was sent to a ruined hilltop fortress above the Aude River in southern France. Its walls were crumbling and its towers roofless, the government had considered pulling it down, and locals had been carrying off its stones for building material. Viollet-le-Duc, already restoring Notre-Dame in Paris, spent much of the rest of his career rebuilding it. His most criticized choice was to cap the towers with steep slate cones, which he believed authentic but which suited northern France better than the sunny south.

The site had been fortified since Roman times, when a hill town there guarded the route between the Mediterranean and the Atlantic. In the Middle Ages the walled city of Carcassonne was a stronghold of the Trencavel family, and in 1209 it fell to the crusading army sent by the pope against the Cathars, a Christian sect condemned as heretics. The defenders surrendered after about two weeks, when their wells ran dry in the summer heat. Afterward the kings of France strengthened the place into one of the most formidable fortresses of its age, with a double ring of walls and more than fifty towers.

Its military role faded after 1659, when a treaty moved the border with Spain south to the Pyrenees, and the lower town across the river grew instead. Today the restored citadel is among the most visited monuments in France and was named a World Heritage Site in 1997. Visitors enter through the Narbonne Gate, and every July the ramparts are lit by fireworks for Bastille Day. A popular board game named after the town has sold millions of copies.`,
  },
  {
    cat: 'Event', diff: 4, answer: 'The Defenestration of Prague',
    aka: { defenstration: 'defenestration', defenistration: 'defenestration', prage: 'prague' },
    // avoid: Prague printed by streak, atlas, eureka, script, history, orbit, and Listed 12-13 (Charles Bridge, Prague)
    avoid: ['2026-12-03', '2026-12-04', '2026-12-06', '2026-12-09', '2026-12-13', '2026-12-14', '2026-12-16', '2026-12-20', '2026-12-23', '2026-12-25', '2026-12-29'],
    text: `On May 23, 1618, a crowd of Protestant nobles climbed the stairs of the royal castle in the Bohemian capital, confronted two Catholic governors appointed by the Habsburg ruler, and after a heated argument threw them out of a high window of the chancellery, along with their secretary. The fall was around twenty meters. All three survived. Catholic writers said angels or the Virgin Mary had caught them; Protestant pamphleteers said they had landed in a heap of rubbish or manure in the moat below.

The quarrel behind the incident was about religion and rights. Bohemia had a large Protestant population and guarantees of religious freedom confirmed by an imperial charter in 1609. The new king, Ferdinand of Styria, was a devout Catholic, and the nobles accused his officials of breaking those guarantees by closing Protestant churches. The Defenestration of Prague, as it came to be called, launched an open revolt. The rebels deposed Ferdinand and offered the crown to Frederick V, the Protestant Elector Palatine, who would be mocked as the Winter King because his reign lasted barely a year.

In November 1620 the imperial army crushed the Bohemian rebels at the Battle of White Mountain outside the city. Twenty seven leaders were executed in the Old Town Square, Protestant worship was suppressed and much of the nobility went into exile. But the revolt had already drawn other powers in, and it widened into the Thirty Years War, which drew in Denmark, Sweden and France and devastated much of central Europe before the Peace of Westphalia in 1648. Nor was it the city's first such episode: in 1419 a crowd had thrown town councilors from the windows of the New Town Hall.`,
  },
  {
    cat: 'Place', diff: 5, answer: 'Skara Brae',
    aka: { scara: 'skara', skarra: 'skara' },
    // avoid: Skara Brae or Orkney printed by deep, streak, atlas
    avoid: ['2026-12-10', '2026-12-12', '2026-12-21', '2026-12-30'],
    text: `In the winter of 1850 a great storm stripped the grass and sand from a high dune on the Bay of Skaill, on the west coast of Mainland, the largest island of Orkney, off the north of Scotland. Underneath, the local laird, William Watt, found the walls of ancient stone buildings, and he began to dig. Later excavations, including one in the late 1920s led by the archaeologist Gordon Childe, revealed a cluster of eight houses linked by low, roofed passages, a village sunk into heaps of its own midden, the packed refuse of shells, bones and ash that sheltered it from the wind.

Radiocarbon dating shows the village was lived in from roughly 3200 BC to about 2500 BC, which makes it older than the Great Pyramid of Giza. What makes it extraordinary is the furniture. Orkney has few trees, so the inhabitants built with the flat local flagstone, and their beds, cupboards and dressers survive in place. Each house has a central hearth, a stone dresser facing the doorway, box beds on either side, and small tanks set into the floor, perhaps used to keep shellfish fresh as bait. There were even drains, and one small cell may have served as a toilet.

The farmers who lived at Skara Brae kept cattle and sheep, grew barley and wheat, and gathered shellfish and fish. They made grooved pottery and carved mysterious stone balls. Nobody knows exactly why the village was abandoned; sand gradually covered it until the storm uncovered it again. It is now part of the World Heritage Site called the Heart of Neolithic Orkney, along with the nearby stone circles and chambered tombs, and coastal erosion is a growing threat to its survival.`,
  },
  {
    cat: 'Event', diff: 5, answer: 'The Carrington Event',
    aka: { carington: 'carrington', carringten: 'carrington' },
    // avoid: Carrington printed by orbit, quotes, art
    avoid: ['2026-12-17', '2026-12-18', '2026-12-26'],
    text: `On the morning of September 1, 1859, an English amateur astronomer was sketching sunspots projected from his telescope onto a screen at his private observatory in Surrey when two brilliant beads of white light appeared within a large spot group. They brightened, moved and faded in about five minutes. Another observer, Richard Hodgson, saw the same thing independently. It was the first time anyone had recorded a solar flare, and the consequences reached the Earth the next day.

About seventeen hours later a huge cloud of magnetized gas thrown out by the Sun struck the planet's magnetic field, setting off what remains the most intense geomagnetic storm in recorded history. Auroras usually confined to polar latitudes were seen as far south as the Caribbean. In the Rocky Mountains the light was so bright that gold miners woke and began preparing breakfast, thinking it was dawn, and people in the northeastern United States said they could read a newspaper by it. Telegraph systems across Europe and North America failed; operators received shocks, sparks jumped from equipment, and some lines kept working with their batteries disconnected, powered by the currents induced in the wires.

Richard Carrington, the brewer's son who had seen the flare, suspected a link between the two but was careful not to claim one, and the connection between solar activity and magnetic storms was only firmly established in the following century. Today the Carrington Event is the benchmark for space weather planners. A storm of similar strength could damage satellites, disrupt navigation and radio, and overload power grids, causing long blackouts. A smaller storm in March 1989 knocked out the Quebec power grid for nine hours, and in July 2012 a comparable eruption from the Sun missed the Earth by about a week.`,
  },
];
