// Origin lane: Named After. Words named after people and places (eponyms and
// toponyms): everyday words from real people, clothing and foods from places,
// the months and days of the week, chemical elements named after people,
// places and myths, SI units named after scientists, and words from Greek and
// Roman mythology. Ordinary roots, prefixes and non-name loanwords belong to
// the other Origin lane; no idiom or phrase origins. Only origins
// Merriam-Webster or Etymonline state plainly; no folk etymologies.
const C = 'Named After';
const Q = (t, q, a, d) => ({ c: C, t, q, a, d });

export const LANE_DAYS = [
  // day 1
  [
    Q(1, "Which light perfume is named after a German city on the Rhine?", "Cologne", ["Musk", "Attar", "Lavender water"]),
    Q(2, "Bourbon whiskey takes its name from a county in which US state?", "Kentucky", ["Tennessee", "Missouri", "Ohio"]),
    Q(3, "Luigi Galvani, who gave us 'galvanize', made which animal's legs twitch with electricity?", "Frog", ["Mouse", "Rabbit", "Cat"]),
    Q(4, "Gallium takes its name from the Latin name of which country?", "France", ["Portugal", "Wales", "Germany"]),
    Q(5, "'Hermetic', meaning airtight, comes from Hermes Trismegistus, the legendary founder of which practice?", "Alchemy", ["Navigation", "Architecture", "Shipbuilding"]),
  ],
  // day 2
  [
    Q(1, "Which rigid airship is named after the German count who built the first ones?", "Zeppelin", ["Blimp", "Dirigible", "Hot-air balloon"]),
    Q(2, "Which verb for teasing with something just out of reach comes from a king punished in the underworld?", "Tantalize", ["Taunt", "Beguile", "Entice"]),
    Q(3, "Which element is named after the Titan who stole fire from the gods?", "Promethium", ["Plutonium", "Thorium", "Tantalum"]),
    Q(4, "The horse's gait called a 'canter' is short for the easy pace of pilgrims riding to which city?", "Canterbury", ["Walsingham", "York", "Durham"]),
    Q(5, "The cantaloupe is named after a former papal estate near which city?", "Rome", ["Florence", "Naples", "Venice"]),
  ],
  // day 3
  [
    Q(1, "Which word for excessive self-love comes from a youth in Greek myth who fell for his own reflection?", "Narcissism", ["Egotism", "Vanity", "Hubris"]),
    Q(2, "Which word for a relentless optimist comes from the heroine of a 1913 children's novel?", "Pollyanna", ["Cinderella", "Goldilocks", "Rebecca"]),
    Q(3, "Which swept-up hairstyle is named after a mistress of King Louis XV?", "Pompadour", ["Bouffant", "Beehive", "Chignon"]),
    Q(4, "Which word for a bitter verbal attack comes from speeches Demosthenes made against a king of Macedon?", "Philippic", ["Diatribe", "Tirade", "Harangue"]),
    Q(5, "Gadolinium honors Johan Gadolin, a chemist from which country?", "Finland", ["Estonia", "Norway", "Denmark"]),
  ],
  // day 4
  [
    Q(1, "Which high-collared jacket is named after India's first prime minister?", "Nehru jacket", ["Mao jacket", "Safari jacket", "Bomber jacket"]),
    Q(2, "Which element, found in smoke detectors, is named after a pair of continents?", "Americium", ["Californium", "Europium", "Berkelium"]),
    Q(3, "Which word for a traitor who serves an occupying enemy comes from a Norwegian leader of World War II?", "Quisling", ["Turncoat", "Judas", "Benedict Arnold"]),
    Q(4, "The magnolia is named after Pierre Magnol, a botanist from which country?", "France", ["Spain", "Italy", "Belgium"]),
    Q(5, "The guppy is named after Robert Guppy, who sent specimens to London from which island?", "Trinidad", ["Jamaica", "Barbados", "Cuba"]),
  ],
  // day 5
  [
    Q(1, "Which brandy is named after a town in western France?", "Cognac", ["Armagnac", "Calvados", "Grappa"]),
    Q(2, "Which phrase for a needlessly complicated contraption comes from an American cartoonist?", "Rube Goldberg machine", ["Jacob's ladder", "Perpetual motion machine", "Turing machine"]),
    Q(3, "Which dog's name comes from an Old French word meaning 'Spanish'?", "Spaniel", ["Poodle", "Beagle", "Terrier"]),
    Q(4, "Which element is named after an Austrian-born physicist who helped explain nuclear fission?", "Meitnerium", ["Curium", "Rutherfordium", "Copernicium"]),
    Q(5, "The word 'tawdry' comes from cheap lace sold at fairs honoring which English saint?", "Saint Audrey", ["Saint Agnes", "Saint Anne", "Saint Alban"]),
  ],
  // day 6
  [
    Q(1, "Which word for a miser comes from the main character of Dickens's 'A Christmas Carol'?", "Scrooge", ["Fagin", "Gradgrind", "Micawber"]),
    Q(2, "The watt, the unit of power, is named after an engineer from which country?", "Scotland", ["England", "Wales", "Ireland"]),
    Q(3, "The word 'laconic', for using very few words, comes from the region around which Greek city-state?", "Sparta", ["Athens", "Corinth", "Thebes"]),
    Q(4, "The word 'peach' traces back to a Latin phrase meaning an apple from which land?", "Persia", ["Egypt", "India", "China"]),
    Q(5, "Hafnium takes its name from the Latin name of which city?", "Copenhagen", ["Stockholm", "Oslo", "Helsinki"]),
  ],
  // day 7
  [
    Q(1, "Which warning device is named after the singing creatures of Greek myth who lured sailors to their doom?", "Siren", ["Klaxon", "Foghorn", "Alarm bell"]),
    Q(2, "Which crackers are named after a 19th-century American preacher who promoted whole wheat flour?", "Graham crackers", ["Saltines", "Ritz crackers", "Oyster crackers"]),
    Q(3, "The tuxedo gets its name from Tuxedo Park, a wealthy enclave in which US state?", "New York", ["Connecticut", "New Jersey", "Rhode Island"]),
    Q(4, "Which verb for catering to low tastes comes from a go-between in the medieval story of Troilus and Criseyde?", "Pander", ["Flatter", "Grovel", "Wheedle"]),
    Q(5, "Holmium takes its name from the Latin name of which city?", "Stockholm", ["Oslo", "Uppsala", "Amsterdam"]),
  ],
  // day 8
  [
    Q(1, "Which word for a very handsome young man comes from a youth loved by the goddess Aphrodite?", "Adonis", ["Apollo", "Hercules", "Romeo"]),
    Q(2, "The tangerine is named after a port city in which country?", "Morocco", ["Algeria", "Spain", "Tunisia"]),
    Q(3, "The Bunsen burner is named after a chemist from which country?", "Germany", ["Austria", "Sweden", "Netherlands"]),
    Q(4, "The SI unit of electrical resistance is named after which physicist?", "Georg Simon Ohm", ["Alessandro Volta", "Andre-Marie Ampere", "Charles-Augustin de Coulomb"]),
    Q(5, "Thulium is named after Thule, which ancient writers used for what?", "The northernmost land", ["The southernmost land", "The easternmost land", "An undersea land"]),
  ],
  // day 9
  [
    Q(1, "Which day of the week is named after the Norse god of thunder?", "Thursday", ["Tuesday", "Wednesday", "Friday"]),
    Q(2, "Which lace-up leather shoe is named after an English university city?", "Oxford", ["Brogue", "Loafer", "Wingtip"]),
    Q(3, "Which element is named after the Italian physicist who built the first nuclear reactor?", "Fermium", ["Curium", "Bohrium", "Einsteinium"]),
    Q(4, "Franz Mesmer, who gave us 'mesmerize', claimed to heal patients with what?", "Animal magnetism", ["Electric shocks", "Leeches", "Herbal tonics"]),
    Q(5, "The word 'coach', for a carriage, comes from Kocs, a village in which country?", "Hungary", ["Austria", "Poland", "Romania"]),
  ],
  // day 10
  [
    Q(1, "The word 'volcano' comes from the name of which Roman god?", "Vulcan", ["Mars", "Neptune", "Pluto"]),
    Q(2, "Which word for enormous comes from a giant in the comic novels of Rabelais?", "Gargantuan", ["Colossal", "Mammoth", "Titanic"]),
    Q(3, "The limousine is named after Limousin, a region of which country?", "France", ["Italy", "Germany", "Belgium"]),
    Q(4, "Horace Walpole coined 'serendipity' from Serendip, an old name for which island?", "Sri Lanka", ["Madagascar", "Sumatra", "Cyprus"]),
    Q(5, "Strontium is named after a village in which country?", "Scotland", ["Wales", "Ireland", "Norway"]),
  ],
  // day 11
  [
    Q(1, "Which temperature scale is named after a German physicist who made the first mercury thermometer?", "Fahrenheit", ["Celsius", "Kelvin", "Rankine"]),
    Q(2, "Which word for a lover of fine food and pleasure comes from an ancient Greek philosopher?", "Epicurean", ["Stoic", "Cynic", "Platonic"]),
    Q(3, "Which word for the animal life of a region comes from the name of a Roman rustic goddess?", "Fauna", ["Flora", "Biota", "Wildlife"]),
    Q(4, "The currant was named for the raisins of which Greek city?", "Corinth", ["Athens", "Sparta", "Thebes"]),
    Q(5, "Niobium is named after Niobe, daughter of which mythical king, because it is found alongside tantalum?", "Tantalus", ["Midas", "Minos", "Priam"]),
  ],
  // day 12
  [
    Q(1, "Which word for plain, frugal and austere comes from an ancient Greek city-state?", "Spartan", ["Athenian", "Corinthian", "Theban"]),
    Q(2, "Which painkiller is named after the Greek god of dreams?", "Morphine", ["Codeine", "Opium", "Aspirin"]),
    Q(3, "The SI unit of magnetic flux density is named after which Serbian-American inventor?", "Nikola Tesla", ["Thomas Edison", "Michael Pupin", "George Westinghouse"]),
    Q(4, "Which element, number 104, honors the New Zealand-born physicist who discovered the atomic nucleus?", "Rutherfordium", ["Bohrium", "Lawrencium", "Dubnium"]),
    Q(5, "Which fragrant white flower is named after a Scottish-born doctor who lived in colonial Charleston?", "Gardenia", ["Magnolia", "Camellia", "Jasmine"]),
  ],
  // day 13
  [
    Q(1, "Which day of the week is named after Tiw, an ancient Germanic god of war?", "Tuesday", ["Monday", "Thursday", "Saturday"]),
    Q(2, "Which element honors the Swedish inventor of dynamite?", "Nobelium", ["Seaborgium", "Lawrencium", "Scandium"]),
    Q(3, "The word 'jovial' comes from Jove, another name for which Roman god?", "Jupiter", ["Saturn", "Apollo", "Neptune"]),
    Q(4, "The fuchsia, and the color named after it, honors a 16th-century botanist from which country?", "Germany", ["Netherlands", "Sweden", "Italy"]),
    Q(5, "The derrick crane takes its name from a man who held what grim job in 1600s London?", "Hangman", ["Gravedigger", "Jailer", "Rat catcher"]),
  ],
  // day 14
  [
    Q(1, "Which cheese is named after a village in Somerset, England?", "Cheddar", ["Stilton", "Brie", "Gouda"]),
    Q(2, "Which large brass instrument is named after the American bandleader known as the March King?", "Sousaphone", ["Tuba", "Euphonium", "Flugelhorn"]),
    Q(3, "Nihonium, element 113, is named after which country?", "Japan", ["China", "South Korea", "India"]),
    Q(4, "Which verb for censoring a book comes from an English editor who published a family edition of Shakespeare?", "Bowdlerize", ["Expurgate", "Redact", "Sanitize"]),
    Q(5, "The steam calliope is named after the Greek muse of which art?", "Epic poetry", ["Music", "Comedy", "History"]),
  ],
  // day 15
  [
    Q(1, "Which meringue dessert topped with fruit is named after a Russian ballerina?", "Pavlova", ["Peach Melba", "Eton mess", "Lemon meringue pie"]),
    Q(2, "Jodhpurs, close-fitting riding pants, are named after a city in which country?", "India", ["Pakistan", "Afghanistan", "Nepal"]),
    Q(3, "Which element is named after the discoverer of X-rays?", "Roentgenium", ["Curium", "Rutherfordium", "Bohrium"]),
    Q(4, "The word 'meander' comes from a winding river in what is now which country?", "Turkey", ["Greece", "Cyprus", "Italy"]),
    Q(5, "Which word for empty boasting comes from a vain knight in Spenser's 'The Faerie Queene'?", "Braggadocio", ["Bombast", "Bluster", "Rodomontade"]),
  ],
  // day 16
  [
    Q(1, "Parmesan cheese is named after which Italian city?", "Parma", ["Milan", "Turin", "Verona"]),
    Q(2, "Which word for a very old person comes from a biblical figure said to have lived 969 years?", "Methuselah", ["Moses", "Abraham", "Noah"]),
    Q(3, "The tarantula is named after Taranto, a city in which country?", "Italy", ["Spain", "Greece", "Portugal"]),
    Q(4, "The duffel bag is named after a town in which country?", "Belgium", ["Netherlands", "Germany", "Denmark"]),
    Q(5, "Hassium is named after the Latin name of which German state?", "Hesse", ["Bavaria", "Saxony", "Thuringia"]),
  ],
  // day 17
  [
    Q(1, "Which slatted wooden lawn chair is named after a mountain range in New York?", "Adirondack chair", ["Windsor chair", "Morris chair", "Shaker chair"]),
    Q(2, "Which word for shell fragments comes from a British artillery officer who invented an exploding shell?", "Shrapnel", ["Flak", "Grapeshot", "Buckshot"]),
    Q(3, "The word 'jeans' comes from an old name for which Italian city?", "Genoa", ["Venice", "Naples", "Milan"]),
    Q(4, "Livermorium is named after a national laboratory in which US state?", "California", ["New Mexico", "Tennessee", "Illinois"]),
    Q(5, "Béchamel sauce is named after a steward in the court of which French king?", "Louis XIV", ["Louis XVI", "Henry IV", "Louis XV"]),
  ],
  // day 18
  [
    Q(1, "The 'bel' in 'decibel' honors which inventor?", "Alexander Graham Bell", ["Thomas Edison", "Guglielmo Marconi", "Samuel Morse"]),
    Q(2, "The Amazon River was named by a Spanish explorer after which figures from Greek myth?", "Warrior women", ["Sea nymphs", "River gods", "Giant serpents"]),
    Q(3, "Which word for versatile and ever-changing comes from a shape-shifting sea god?", "Protean", ["Mercurial", "Volatile", "Fickle"]),
    Q(4, "Macadam roads are named after John McAdam, an engineer from which country?", "Scotland", ["Ireland", "England", "Wales"]),
    Q(5, "The wisteria vine honors Caspar Wistar, an American who was what by profession?", "Physician", ["Botanist", "Explorer", "Painter"]),
  ],
  // day 19
  [
    Q(1, "Which sausage, often served as a hot dog, is named after a German city?", "Frankfurter", ["Bratwurst", "Kielbasa", "Chorizo"]),
    Q(2, "Which compression-ignition engine, common in trucks and buses, is named after a German engineer?", "Diesel", ["Wankel", "Stirling", "Steam"]),
    Q(3, "Which loose pants, once worn under a short skirt, are named after an American women's rights advocate?", "Bloomers", ["Culottes", "Pantaloons", "Knickerbockers"]),
    Q(4, "Bohrium is named after a physicist from which country?", "Denmark", ["Sweden", "Norway", "Netherlands"]),
    Q(5, "Which word for forcing things to fit a rigid pattern comes from a robber who stretched or cut his guests to fit a bed?", "Procrustean", ["Draconian", "Sisyphean", "Byzantine"]),
  ],
  // day 20
  [
    Q(1, "Which ground-beef sandwich takes its name from a German port city?", "Hamburger", ["Sloppy joe", "Patty melt", "Reuben"]),
    Q(2, "Which word for overly complicated comes from the old name of the city now called Istanbul?", "Byzantine", ["Ottoman", "Labyrinthine", "Gothic"]),
    Q(3, "Calico cloth is named after Calicut, a port in which country?", "India", ["Sri Lanka", "Pakistan", "Indonesia"]),
    Q(4, "Which word comes from the name of the ninth-century mathematician al-Khwarizmi?", "Algorithm", ["Algebra", "Abacus", "Cipher"]),
    Q(5, "Lutetium is named after the Latin name of which city?", "Paris", ["Lyon", "London", "Lisbon"]),
  ],
  // day 21
  [
    Q(1, "Which word for a sweetheart, or a card sent on February 14, comes from the name of a Roman-era saint?", "Valentine", ["Cupid", "Patrick", "Nicholas"]),
    Q(2, "Which Dutch cheese takes its name from a city in the province of South Holland?", "Gouda", ["Edam", "Emmental", "Havarti"]),
    Q(3, "The word 'gerrymander' blends the name of Governor Elbridge Gerry with which animal?", "Salamander", ["Lizard", "Python", "Scorpion"]),
    Q(4, "The cravat is named after soldiers from which country?", "Croatia", ["Hungary", "Serbia", "Poland"]),
    Q(5, "The weber, a unit of magnetic flux, honors a German physicist who built an early electric telegraph with which mathematician?", "Carl Friedrich Gauss", ["Leonhard Euler", "Bernhard Riemann", "David Hilbert"]),
  ],
  // day 22
  [
    Q(1, "Which word for a charming womanizer comes from an 18th-century Venetian adventurer?", "Casanova", ["Don Juan", "Romeo", "Prince Charming"]),
    Q(2, "Which word for a prophet of doom whom nobody believes comes from a Trojan princess?", "Cassandra", ["Pandora", "Medusa", "Helen"]),
    Q(3, "The volt is named after Alessandro Volta, who invented which device?", "Electric battery", ["Light bulb", "Telegraph", "Electric motor"]),
    Q(4, "The gemstone turquoise gets its name from an old French word meaning what?", "Turkish", ["Persian", "Sky blue", "Sea green"]),
    Q(5, "Which word for a seducer of women comes from a character in a 1703 tragedy by Nicholas Rowe?", "Lothario", ["Don Juan", "Romeo", "Svengali"]),
  ],
  // day 23
  [
    Q(1, "Which word for a government of surveillance and propaganda comes from the author of the novel '1984'?", "Orwellian", ["Kafkaesque", "Dickensian", "Machiavellian"]),
    Q(2, "Which word for quickly changing moods comes from the name of the Roman messenger god?", "Mercurial", ["Jovial", "Martial", "Volatile"]),
    Q(3, "The word 'maverick' comes from a Texas rancher who refused to do what?", "Brand his calves", ["Pay his taxes", "Fence his land", "Sell his herd"]),
    Q(4, "The word 'spa', for a health resort, comes from a town in which country?", "Belgium", ["Germany", "Switzerland", "Austria"]),
    Q(5, "The becquerel honors a French physicist who discovered radioactivity using salts of which element?", "Uranium", ["Radium", "Polonium", "Thorium"]),
  ],
  // day 24
  [
    Q(1, "Which soft, fine wool is named after a region in the Himalayas?", "Cashmere", ["Mohair", "Merino", "Alpaca"]),
    Q(2, "The guillotine is named after Joseph-Ignace Guillotin, who had what profession?", "Physician", ["Executioner", "Carpenter", "Judge"]),
    Q(3, "The word 'bedlam', for uproar, comes from a London hospital named for Saint Mary of which town?", "Bethlehem", ["Bedford", "Nazareth", "Jericho"]),
    Q(4, "To 'hector', meaning to bully, comes from a hero who defended which city?", "Troy", ["Sparta", "Athens", "Thebes"]),
    Q(5, "Palladium is named after Pallas, which is what kind of object?", "An asteroid", ["A comet", "A moon", "A star"]),
  ],
  // day 25
  [
    Q(1, "Which word for cunning, ruthless scheming comes from the Florentine author of 'The Prince'?", "Machiavellian", ["Byzantine", "Draconian", "Orwellian"]),
    Q(2, "The Granny Smith apple is named after a grower who first raised it in which country?", "Australia", ["New Zealand", "England", "South Africa"]),
    Q(3, "The hertz is named after a German physicist who first proved the existence of what?", "Radio waves", ["X-rays", "Electrons", "Neutrons"]),
    Q(4, "The fedora hat takes its name from what?", "A French play", ["A Paris hatmaker", "An Italian town", "A Greek island"]),
    Q(5, "Vanadium is named after Vanadis, another name for which Norse goddess?", "Freyja", ["Frigg", "Hel", "Idun"]),
  ],
  // day 26
  [
    Q(1, "Which word for prim and prudish comes from the name of a long-reigning British queen?", "Victorian", ["Edwardian", "Georgian", "Elizabethan"]),
    Q(2, "The word 'martial', as in martial arts, comes from which Roman god?", "Mars", ["Jupiter", "Mercury", "Vulcan"]),
    Q(3, "Peach Melba is named after Nellie Melba, who was famous as what?", "Opera singer", ["Ballerina", "Novelist", "Stage actress"]),
    Q(4, "Muslin cloth is named after Mosul, a city in which modern country?", "Iraq", ["Syria", "Iran", "Turkey"]),
    Q(5, "Ruthenium is named after a Latin name for which country?", "Russia", ["Romania", "Poland", "Hungary"]),
  ],
  // day 27
  [
    Q(1, "Which raised-dot reading system is named after a French teacher who was blind from childhood?", "Braille", ["Moon type", "Morse code", "Shorthand"]),
    Q(2, "Damask, a patterned fabric, is named after which ancient city?", "Damascus", ["Baghdad", "Aleppo", "Babylon"]),
    Q(3, "Which element, number 112, honors the astronomer who placed the Sun at the center of the solar system?", "Copernicium", ["Roentgenium", "Darmstadtium", "Meitnerium"]),
    Q(4, "The Canary Islands, which gave the canary bird its name, were named after which animal?", "Dogs", ["Birds", "Seals", "Goats"]),
    Q(5, "The word 'malapropism' comes from a character in a comedy by which playwright?", "Richard Brinsley Sheridan", ["Oliver Goldsmith", "Oscar Wilde", "William Congreve"]),
  ],
  // day 28
  [
    Q(1, "Which dot-and-dash code is named after an American inventor who was also a portrait painter?", "Morse code", ["Braille", "Semaphore", "Binary code"]),
    Q(2, "Tabasco sauce is named after a state in which country?", "Mexico", ["Peru", "Cuba", "Colombia"]),
    Q(3, "The dahlia is named after a botanist from which country?", "Sweden", ["Mexico", "Spain", "Norway"]),
    Q(4, "Which element, discovered in 1939 by Marguerite Perey, is named after her home country?", "Francium", ["Polonium", "Gallium", "Europium"]),
    Q(5, "Badminton is named after the country estate of which English duke?", "Duke of Beaufort", ["Duke of Wellington", "Duke of Marlborough", "Duke of Devonshire"]),
  ],
  // day 29
  [
    Q(1, "Which day of the week is named after Woden, the god the Norse called Odin?", "Wednesday", ["Tuesday", "Thursday", "Friday"]),
    Q(2, "Which word for something that arouses desire comes from the name of the Greek goddess of love?", "Aphrodisiac", ["Elixir", "Philter", "Tonic"]),
    Q(3, "Which food-poisoning bacteria are named after an American veterinary scientist?", "Salmonella", ["Listeria", "E. coli", "Shigella"]),
    Q(4, "Which word for tearfully sentimental comes from the name of a woman in the Gospels often painted weeping?", "Maudlin", ["Mawkish", "Morose", "Lachrymose"]),
    Q(5, "Rhenium is named after the Latin name of which river?", "Rhine", ["Danube", "Rhone", "Elbe"]),
  ],
  // day 30
  [
    Q(1, "Which spotted dog breed takes its name from a coastal region of Croatia?", "Dalmatian", ["Pointer", "Great Dane", "Beagle"]),
    Q(2, "The word 'museum' first meant a shrine to which group of goddesses?", "The Muses", ["The Graces", "The Fates", "The Furies"]),
    Q(3, "Friday is named after a Norse goddess who was the wife of which god?", "Odin", ["Thor", "Loki", "Tyr"]),
    Q(4, "Which unit of energy is named after an English physicist from a family of brewers?", "Joule", ["Erg", "Calorie", "Watt"]),
    Q(5, "The word 'silhouette' comes from a French official who briefly held which post in 1759?", "Finance minister", ["War minister", "Chief of police", "Royal architect"]),
  ],
  // day 31
  [
    Q(1, "Which word for a traitor comes from the disciple who betrayed Jesus?", "Judas", ["Brutus", "Quisling", "Iago"]),
    Q(2, "Which word for impractically idealistic comes from a Spanish novel's hero who tilts at windmills?", "Quixotic", ["Utopian", "Romantic", "Chimerical"]),
    Q(3, "The Celsius scale is named after an astronomer from which country?", "Sweden", ["Switzerland", "Denmark", "Norway"]),
    Q(4, "Which thick cut of beef tenderloin is named after a French writer and statesman?", "Chateaubriand", ["Filet mignon", "Tournedos", "Entrecote"]),
    Q(5, "The word 'martinet', for a strict disciplinarian, comes from a drillmaster in the army of which French king?", "Louis XIV", ["Louis XIII", "Henry IV", "Louis XV"]),
  ],
  // day 32
  [
    Q(1, "Which dessert of ice cream sealed in browned meringue is named after a US state?", "Baked Alaska", ["Bananas Foster", "Key lime pie", "Boston cream pie"]),
    Q(2, "Which word for a trusted adviser comes from the friend Odysseus left to guide his son?", "Mentor", ["Tutor", "Guru", "Patron"]),
    Q(3, "The farad, the unit of capacitance, is named after which English scientist?", "Michael Faraday", ["Humphry Davy", "James Clerk Maxwell", "John Dalton"]),
    Q(4, "The poinsettia is named after Joel Poinsett, the first US minister to which country?", "Mexico", ["Spain", "Cuba", "Brazil"]),
    Q(5, "The trilby hat is named after the title character of a novel by which author?", "George du Maurier", ["Daphne du Maurier", "Thomas Hardy", "Bram Stoker"]),
  ],
  // day 33
  [
    Q(1, "Which element is named after a planet discovered by William Herschel in 1781?", "Uranium", ["Plutonium", "Neptunium", "Thorium"]),
    Q(2, "Which word for nightmarishly baffling bureaucracy comes from the author of 'The Trial'?", "Kafkaesque", ["Orwellian", "Dickensian", "Byzantine"]),
    Q(3, "Which word for very harsh comes from an Athenian lawmaker of the 600s BC?", "Draconian", ["Spartan", "Stoic", "Laconic"]),
    Q(4, "Jean Nicot, who gave his name to nicotine, sent tobacco to France while serving as ambassador to which country?", "Portugal", ["Spain", "Brazil", "Cuba"]),
    Q(5, "The words 'money' and 'mint' both trace back to a temple of which Roman goddess?", "Juno", ["Minerva", "Venus", "Diana"]),
  ],
  // day 34
  [
    Q(1, "Which word for a task needing enormous strength comes from a Greek hero famous for twelve labors?", "Herculean", ["Spartan", "Olympian", "Promethean"]),
    Q(2, "Which word for swapping the first sounds of two words comes from an Oxford clergyman?", "Spoonerism", ["Malapropism", "Pun", "Mondegreen"]),
    Q(3, "Which element is named after the California city where it was first made in 1949?", "Berkelium", ["Californium", "Lawrencium", "Livermorium"]),
    Q(4, "The bougainvillea is named after a French navigator famous for which feat?", "Sailing around the world", ["Reaching the South Pole", "Charting the Nile", "Climbing Mont Blanc"]),
    Q(5, "Lord Kelvin, honored by the kelvin, took his title from a river that flows past a university in which city?", "Glasgow", ["Edinburgh", "Belfast", "Dublin"]),
  ],
  // day 35
  [
    Q(1, "Which month is named after Julius Caesar?", "July", ["June", "August", "March"]),
    Q(2, "The wiener sausage is named after which city?", "Vienna", ["Berlin", "Munich", "Prague"]),
    Q(3, "Which word for a slow learner comes from the name of a medieval Scottish philosopher?", "Dunce", ["Dullard", "Dolt", "Nitwit"]),
    Q(4, "Which word for a very loud voice comes from a herald in Homer's Iliad?", "Stentorian", ["Strident", "Sonorous", "Booming"]),
    Q(5, "Lawrencium is named after Ernest Lawrence, inventor of which machine?", "Cyclotron", ["Geiger counter", "Cloud chamber", "Mass spectrometer"]),
  ],
  // day 36
  [
    Q(1, "Which haircut, a strip of hair down the middle of a shaved head, is named after a Native American people?", "Mohawk", ["Mullet", "Crew cut", "Buzz cut"]),
    Q(2, "Which close-fitting garment worn by dancers and gymnasts is named after a French trapeze artist?", "Leotard", ["Bodysuit", "Tutu", "Tights"]),
    Q(3, "The word 'sideburns' comes from the name of which Union general?", "Ambrose Burnside", ["George McClellan", "Joseph Hooker", "George Meade"]),
    Q(4, "The pascal, a unit of pressure, honors a French thinker who also wrote which work?", "Pensées", ["Discourse on Method", "Candide", "The Social Contract"]),
    Q(5, "Which word for gloomy comes from a planet that astrologers linked with a cold, sluggish temper?", "Saturnine", ["Jovial", "Mercurial", "Martial"]),
  ],
];
