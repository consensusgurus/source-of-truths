// Origin lane: Named After. Words named after people and places (eponyms and
// toponyms): everyday words from real people, clothing and foods from places,
// the months and days of the week, chemical elements named after people,
// places and myths, SI units named after scientists, and words from Greek and
// Roman mythology. Ordinary roots, prefixes and non-name loanwords belong to
// the other Origin lane; no idiom or phrase origins. Only origins
// Merriam-Webster or Etymonline state plainly; no folk etymologies.
const C = 'Named After';
const Q = (t, q, a, d) => ({ c: C, t, q, a, d });

const LAUNCH_DAYS = [
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

// ---------------------------------------------------------------------------
// SEGMENT 2: days 37-74, live 2026-11-24 to 2026-12-31 (restock of 2026-11-06).
// gen-english appends whatever LANE_DAYS holds after the bank's last day, and
// its --check rewinds by LANE_DAYS.length, so LANE_DAYS is always the LATEST
// segment only. The launch segment above stays in the file for reference and
// for duplicate checks when authoring, but is no longer exported as LANE_DAYS.
// Every origin here was checked against Merriam-Webster or Etymonline; any
// whose source hedges ("probably", "perhaps", "uncertain") was left out, and
// so was any fact another trivia bank on the site already asks.
export const LANE_DAYS = [
  // day 37 (2026-11-24)
  [
    Q(1, "Paddington Bear is named after a railway station in which city?", "London", ["Manchester", "Edinburgh", "Liverpool"]),
    Q(2, "Marie Curie named polonium after which country?", "Poland", ["France", "Prussia", "Austria"]),
    Q(3, "Which word for a manipulative mentor comes from a hypnotist in the novel 'Trilby'?", "Svengali", ["Rasputin", "Mesmer", "Machiavelli"]),
    Q(4, "'Dollar' comes from the thaler, a coin named after a valley in what is now which country?", "Czech Republic", ["Austria", "Switzerland", "Hungary"]),
    Q(5, "Worsted yarn is named after a village in which English county?", "Norfolk", ["Yorkshire", "Kent", "Devon"]),
  ],
  // day 38 (2026-11-25)
  [
    Q(1, "Which Texas city is named after the hero of the Battle of San Jacinto?", "Houston", ["Austin", "Dallas", "San Antonio"]),
    Q(2, "Germanium is named after which country?", "Germany", ["Austria", "Denmark", "Switzerland"]),
    Q(3, "Gorgonzola cheese is named after a town near which Italian city?", "Milan", ["Turin", "Venice", "Genoa"]),
    Q(4, "'Bunk,' meaning nonsense, comes from a congressman's speech for a county in which state?", "North Carolina", ["Virginia", "Kentucky", "Tennessee"]),
    Q(5, "Which word for a long, mournful complaint comes from a biblical prophet?", "Jeremiad", ["Philippic", "Harangue", "Tirade"]),
  ],
  // day 39 (2026-11-26)
  [
    Q(1, "Epsom salt is named after a town in which country?", "England", ["Scotland", "Wales", "Ireland"]),
    Q(2, "Which Thanksgiving bird got its English name from a mix-up with guinea fowl imported through Ottoman lands?", "Turkey", ["Goose", "Pheasant", "Duck"]),
    Q(3, "The mackintosh raincoat honors Charles Macintosh, a chemist from which country?", "Scotland", ["Ireland", "England", "Wales"]),
    Q(4, "Which word for wacky comes from a clown servant in Italian commedia dell'arte?", "Zany", ["Goofy", "Loony", "Madcap"]),
    Q(5, "Which word for a sanctimonious hypocrite comes from the title character of a Molière play?", "Tartuffe", ["Harpagon", "Scaramouche", "Pantaloon"]),
  ],
  // day 40 (2026-11-27)
  [
    Q(1, "Which knee-length shorts are named after a British island territory in the Atlantic?", "Bermuda shorts", ["Cargo shorts", "Board shorts", "Gym shorts"]),
    Q(2, "The Molotov cocktail is named after a foreign minister of which country?", "Soviet Union", ["Germany", "Finland", "Poland"]),
    Q(3, "Mocha coffee is named after a port in which country?", "Yemen", ["Ethiopia", "Oman", "Egypt"]),
    Q(4, "The color magenta is named after an 1859 battle in which country?", "Italy", ["France", "Austria", "Spain"]),
    Q(5, "The boysenberry was popularized by which Californian farmer, founder of a theme park?", "Walter Knott", ["Walt Disney", "Luther Burbank", "John Muir"]),
  ],
  // day 41 (2026-11-28)
  [
    Q(1, "Which three-flavor ice cream is named after the people of an Italian city?", "Neapolitan", ["Spumoni", "Tutti-frutti", "Gelato"]),
    Q(2, "Which element is named after the continent that includes France and Italy?", "Europium", ["Americium", "Francium", "Gallium"]),
    Q(3, "The jersey sweater is named after an island in which body of water?", "English Channel", ["Irish Sea", "North Sea", "Bay of Biscay"]),
    Q(4, "Zephyr, whose name became a word for a gentle breeze, was the Greek god of which wind?", "The west wind", ["The north wind", "The east wind", "The south wind"]),
    Q(5, "The Jacquard loom is named after a weaver from which French city?", "Lyon", ["Paris", "Marseille", "Rouen"]),
  ],
  // day 42 (2026-11-29)
  [
    Q(1, "Which word for the theory of evolution by natural selection comes from the author of 'On the Origin of Species'?", "Darwinism", ["Lamarckism", "Mendelism", "Huxleyism"]),
    Q(2, "The Bowie knife is named after a frontiersman who died at which battle?", "The Alamo", ["San Jacinto", "New Orleans", "Little Bighorn"]),
    Q(3, "The Henley shirt is named after an English town famous for what?", "Its rowing regatta", ["Its wool market", "Its horse races", "Its cotton mills"]),
    Q(4, "Which word for a pompous, blustering reactionary comes from a 1930s British cartoon character?", "Colonel Blimp", ["Colonel Bogey", "Captain Bligh", "Major Barbara"]),
    Q(5, "The Bing cherry is named after a Chinese orchard foreman in which state?", "Oregon", ["California", "Washington", "Idaho"]),
  ],
  // day 43 (2026-11-30)
  [
    Q(1, "Which first-aid move for choking is named after an American surgeon?", "Heimlich maneuver", ["CPR", "Recovery position", "Back blows"]),
    Q(2, "Key lime pie is named after islands off which state?", "Florida", ["California", "Louisiana", "Hawaii"]),
    Q(3, "Louisville, Kentucky, is named after which French king?", "Louis XVI", ["Louis XIV", "Louis XV", "Louis XVIII"]),
    Q(4, "Magnesium is named after Magnesia, a district in which country?", "Greece", ["Italy", "Egypt", "Persia"]),
    Q(5, "'Simony' is named after Simon Magus, who offered the apostles money for what?", "The power to confer the Holy Spirit", ["A holy relic", "A seat at the Last Supper", "Their silence"]),
  ],
  // day 44 (2026-12-01)
  [
    Q(1, "Which word for reckless anti-communist accusation comes from a 1950s US senator?", "McCarthyism", ["Nixonism", "Hooverism", "Trumanism"]),
    Q(2, "Which radiation detector is named after a German physicist?", "Geiger counter", ["Cloud chamber", "Dosimeter", "Spectrometer"]),
    Q(3, "Salisbury steak is named after an American who was what by profession?", "Physician", ["Butcher", "Chef", "Rancher"]),
    Q(4, "Lord Raglan, who gave his name to the raglan sleeve, commanded British troops in which war?", "Crimean War", ["Boer War", "Opium War", "Zulu War"]),
    Q(5, "Which word for building immunity to a poison by taking small doses comes from a king of Pontus?", "Mithridatism", ["Hormesis", "Inoculation", "Tolerance"]),
  ],
  // day 45 (2026-12-02)
  [
    Q(1, "Which word for a giant, or a far bigger opponent, comes from the warrior David felled?", "Goliath", ["Samson", "Titan", "Colossus"]),
    Q(2, "Which word for a spoilsport who hates holiday cheer comes from a Dr. Seuss character?", "Grinch", ["Scrooge", "Killjoy", "Wet blanket"]),
    Q(3, "The word 'hygiene' comes from Hygieia, the Greek goddess of what?", "Health", ["Water", "Wisdom", "Childbirth"]),
    Q(4, "Delaware is named after an English lord who governed which colony?", "Virginia", ["Maryland", "Massachusetts", "Carolina"]),
    Q(5, "Cape Horn is named after a town in which country?", "Netherlands", ["Chile", "Spain", "Portugal"]),
  ],
  // day 46 (2026-12-03)
  [
    Q(1, "Which mustard is named after a city in Burgundy?", "Dijon", ["Honey", "Spicy brown", "Yellow"]),
    Q(2, "Which wireless technology is named after a 10th-century king of Denmark?", "Bluetooth", ["Wi-Fi", "Zigbee", "NFC"]),
    Q(3, "The earthy pigment sienna is named after which Tuscan city?", "Siena", ["Florence", "Pisa", "Lucca"]),
    Q(4, "The Stoics were named after a painted porch in which city?", "Athens", ["Sparta", "Rome", "Corinth"]),
    Q(5, "Denver is named after James W. Denver, governor of which territory?", "Kansas Territory", ["Colorado Territory", "Utah Territory", "Nebraska Territory"]),
  ],
  // day 47 (2026-12-04)
  [
    Q(1, "Monday is named after what?", "The Moon", ["The Sun", "The sea", "A Norse king"]),
    Q(2, "Which word for taking pleasure in cruelty comes from a French marquis?", "Sadism", ["Cynicism", "Chauvinism", "Nihilism"]),
    Q(3, "The word 'mausoleum' comes from the tomb of Mausolus, which was counted among what?", "The Seven Wonders of the Ancient World", ["The Pyramids of Giza", "The tombs of the pharaohs", "The temples of Athens"]),
    Q(4, "The Frisbee takes its name from a bakery in which state, whose pie tins students tossed?", "Connecticut", ["Massachusetts", "Ohio", "California"]),
    Q(5, "The attic of a house takes its name, through architecture, from which region of ancient Greece?", "Attica", ["Thessaly", "Boeotia", "Arcadia"]),
  ],
  // day 48 (2026-12-05)
  [
    Q(1, "Which puzzle cube is named after its Hungarian inventor?", "Rubik's Cube", ["Soma cube", "Megaminx", "Tangram"]),
    Q(2, "Which word for grim 19th-century city poverty comes from the author of 'Oliver Twist'?", "Dickensian", ["Victorian", "Orwellian", "Gothic"]),
    Q(3, "The word 'guy' comes from effigies of which conspirator, burned each November in England?", "Guy Fawkes", ["Robert Catesby", "Thomas Percy", "Titus Oates"]),
    Q(4, "Parkinson's disease is named after a London doctor whose 1817 essay called it what?", "The shaking palsy", ["The trembling sickness", "The falling sickness", "The creeping palsy"]),
    Q(5, "Scallions and shallots both take their names from which ancient port?", "Ascalon", ["Gaza", "Sidon", "Joppa"]),
  ],
  // day 49 (2026-12-06)
  [
    Q(1, "Which spicy chicken dish is named after a city in New York State?", "Buffalo wings", ["Nashville hot chicken", "Popcorn chicken", "Chicken tenders"]),
    Q(2, "Titanium is named after which figures of Greek myth?", "The Titans", ["The Cyclopes", "The Muses", "The Fates"]),
    Q(3, "The Saint Bernard dog is named after a hospice in which mountain range?", "The Alps", ["The Pyrenees", "The Apennines", "The Carpathians"]),
    Q(4, "The word 'aegis,' meaning protection, first named the shield of which god?", "Zeus", ["Ares", "Poseidon", "Hermes"]),
    Q(5, "Which word for a sightseeing guide comes from the name of a famous Roman orator?", "Cicerone", ["Docent", "Concierge", "Courier"]),
  ],
  // day 50 (2026-12-07)
  [
    Q(1, "Which word for a male lover comes from a Shakespeare hero?", "Romeo", ["Hamlet", "Macbeth", "Othello"]),
    Q(2, "Which word for sudden wild fear comes from the name of a Greek god of the wild?", "Panic", ["Phobia", "Terror", "Dread"]),
    Q(3, "Scandium is named after which region?", "Scandinavia", ["Iceland", "Siberia", "Greenland"]),
    Q(4, "Sherry takes its name from an old English form of which Spanish town?", "Jerez", ["Seville", "Málaga", "Cádiz"]),
    Q(5, "Ammonia takes its name from salts found near a temple of which Egyptian god?", "Amun", ["Ra", "Osiris", "Horus"]),
  ],
  // day 51 (2026-12-08)
  [
    Q(1, "The Venus flytrap is named after the Roman goddess of what?", "Love", ["Hunting", "The harvest", "The hearth"]),
    Q(2, "Which cropped pants are named after an island in the Bay of Naples?", "Capri pants", ["Culottes", "Gauchos", "Pedal pushers"]),
    Q(3, "Which word for a crude, boorish person comes from brutish creatures in 'Gulliver's Travels'?", "Yahoo", ["Goon", "Lout", "Oaf"]),
    Q(4, "The camellia is named after a Jesuit botanist who worked in which country?", "Philippines", ["Japan", "China", "India"]),
    Q(5, "The Mercator map projection is named after a mapmaker born in what is now which country?", "Belgium", ["Netherlands", "Germany", "Portugal"]),
  ],
  // day 52 (2026-12-09)
  [
    Q(1, "Which flaky pastry shares its name with the people of a Scandinavian country?", "Danish", ["Croissant", "Strudel", "Turnover"]),
    Q(2, "Which word for an unbeatable rival is the name of the Greek goddess of retribution?", "Nemesis", ["Fury", "Hydra", "Medusa"]),
    Q(3, "Listeria bacteria are named after which pioneer of antiseptic surgery?", "Joseph Lister", ["Louis Pasteur", "Robert Koch", "Ignaz Semmelweis"]),
    Q(4, "Suede comes from the French name for which country?", "Sweden", ["Switzerland", "Denmark", "Belgium"]),
    Q(5, "Cincinnati is named after a society of officers that honored which Roman farmer-dictator?", "Cincinnatus", ["Camillus", "Cato", "Fabius"]),
  ],
  // day 53 (2026-12-10)
  [
    Q(1, "Which instrument is named after its Belgian inventor, Adolphe Sax?", "Saxophone", ["Clarinet", "Oboe", "Bassoon"]),
    Q(2, "Which word for tiny comes from an island in 'Gulliver's Travels'?", "Lilliputian", ["Brobdingnagian", "Minuscule", "Elfin"]),
    Q(3, "Which phrase for a win that costs the winner too much comes from a king of Epirus?", "Pyrrhic victory", ["Hollow victory", "Moral victory", "Narrow victory"]),
    Q(4, "Which word for very dark and gloomy comes from a river of the underworld?", "Stygian", ["Tenebrous", "Sepulchral", "Somber"]),
    Q(5, "Selenium is named after the Moon. Its partner element tellurium is named after what?", "The Earth", ["The Sun", "Mars", "The sea"]),
  ],
  // day 54 (2026-12-11)
  [
    Q(1, "Which word for heat-treating milk to kill germs comes from a French scientist?", "Pasteurize", ["Homogenize", "Sterilize", "Galvanize"]),
    Q(2, "Which name for a womanizer comes from a legendary Spanish seducer?", "Don Juan", ["Casanova", "Lothario", "Romeo"]),
    Q(3, "New York was named in honor of the Duke of York, who later became which king?", "James II", ["Charles II", "William III", "George I"]),
    Q(4, "The Bering Strait is named after a Danish-born explorer who sailed for which country?", "Russia", ["Denmark", "Sweden", "Britain"]),
    Q(5, "The henry, the SI unit of inductance, honors the first secretary of which institution?", "Smithsonian Institution", ["Royal Society", "Harvard College", "Library of Congress"]),
  ],
  // day 55 (2026-12-12)
  [
    Q(1, "Which breakfast food takes its name from the Roman goddess of grain?", "Cereal", ["Oatmeal", "Granola", "Porridge"]),
    Q(2, "Linzer torte is named after a city in which country?", "Austria", ["Germany", "Switzerland", "Hungary"]),
    Q(3, "Which word for a brooding, passionate hero comes from an English Romantic poet?", "Byronic", ["Keatsian", "Shelleyan", "Wordsworthian"]),
    Q(4, "Which word for an endless, futile task comes from a king condemned to roll a boulder uphill?", "Sisyphean", ["Herculean", "Tantalizing", "Promethean"]),
    Q(5, "Stilton cheese is named after a village where it was what, rather than made?", "Sold", ["Aged", "Invented", "Banned"]),
  ],
  // day 56 (2026-12-13)
  [
    Q(1, "Which retriever breed is named after a region of eastern Canada?", "Labrador retriever", ["Golden retriever", "Flat-coated retriever", "Curly-coated retriever"]),
    Q(2, "Which Australian state capital is named after a British prime minister?", "Melbourne", ["Sydney", "Brisbane", "Hobart"]),
    Q(3, "The dye indigo takes its name from a Greek word meaning 'from' which country?", "India", ["Persia", "Egypt", "China"]),
    Q(4, "February takes its name from a Roman festival of what?", "Purification", ["Harvest", "Love", "Lights"]),
    Q(5, "The loganberry is named after a California judge who was also what?", "An amateur horticulturist", ["A gold miner", "A railroad baron", "A newspaper editor"]),
  ],
  // day 57 (2026-12-14)
  [
    Q(1, "Which brimless red hat is named after a city in Morocco?", "Fez", ["Beret", "Turban", "Skullcap"]),
    Q(2, "Waldorf salad was first served at a hotel in which city?", "New York City", ["Chicago", "Boston", "Philadelphia"]),
    Q(3, "The jalapeño pepper is named after the capital of which Mexican state?", "Veracruz", ["Oaxaca", "Sonora", "Puebla"]),
    Q(4, "Maryland is named after the wife of which English king?", "Charles I", ["James I", "Charles II", "William III"]),
    Q(5, "Boolean logic is named after a mathematician born in which country?", "England", ["Germany", "France", "Netherlands"]),
  ],
  // day 58 (2026-12-15)
  [
    Q(1, "Which tiny dog breed is named after a Mexican state?", "Chihuahua", ["Pug", "Papillon", "Dachshund"]),
    Q(2, "The aurora borealis takes its name from the Roman goddess of what?", "Dawn", ["Light", "Night", "Sky"]),
    Q(3, "The McIntosh apple is named after a farmer in which country?", "Canada", ["United States", "Scotland", "Australia"]),
    Q(4, "'Hobson's choice,' meaning no real choice, comes from an English stable keeper who rented out what?", "Horses", ["Boats", "Rooms", "Plows"]),
    Q(5, "Alexandrite, a gem that changes color, is named after which Russian tsar?", "Alexander II", ["Alexander I", "Nicholas I", "Peter the Great"]),
  ],
  // day 59 (2026-12-16)
  [
    Q(1, "Which word for a close but nonromantic friendship comes from a Greek philosopher?", "Platonic", ["Socratic", "Stoic", "Epicurean"]),
    Q(2, "Worcestershire sauce is named after an English what?", "County", ["Lord", "Abbey", "Ship"]),
    Q(3, "Which word for a final, crushing defeat comes from a battle in present-day Belgium?", "Waterloo", ["Armageddon", "Dunkirk", "Agincourt"]),
    Q(4, "To 'cut the Gordian knot' recalls a knot tied by a king of which ancient land?", "Phrygia", ["Lydia", "Macedonia", "Persia"]),
    Q(5, "The Gregorian calendar is named after which pope?", "Gregory XIII", ["Gregory VII", "Gregory the Great", "Gregory XVI"]),
  ],
  // day 60 (2026-12-17)
  [
    Q(1, "Which small, cabbage-like vegetable is named after a European capital?", "Brussels sprouts", ["Kale", "Bok choy", "Kohlrabi"]),
    Q(2, "The Neanderthal is named after a valley in which country?", "Germany", ["France", "Belgium", "Austria"]),
    Q(3, "Adelaide, Australia, is named after the wife of which British king?", "William IV", ["George III", "George IV", "Edward VII"]),
    Q(4, "The word 'academy' comes from the grove where which philosopher taught?", "Plato", ["Aristotle", "Socrates", "Pythagoras"]),
    Q(5, "'Grog,' watered-down rum, comes from the nickname of a British admiral, after his cloak of which fabric?", "Grogram", ["Gabardine", "Corduroy", "Tweed"]),
  ],
  // day 61 (2026-12-18)
  [
    Q(1, "Which nut is named after a South American country?", "Brazil nut", ["Cashew", "Pecan", "Macadamia"]),
    Q(2, "The US state of Virginia is named after which English monarch?", "Elizabeth I", ["Mary I", "Anne", "Victoria"]),
    Q(3, "Thousand Island dressing is named after an island region in which river?", "St. Lawrence River", ["Hudson River", "Mississippi River", "Ohio River"]),
    Q(4, "Which word for a smug, conformist businessman comes from a 1922 Sinclair Lewis novel?", "Babbitt", ["Gradgrind", "Pecksniff", "Gatsby"]),
    Q(5, "Pantaloons are named after a character from which form of Italian theater?", "Commedia dell'arte", ["Opera buffa", "Grand opera", "Puppet theater"]),
  ],
  // day 62 (2026-12-19)
  [
    Q(1, "Which South American country is named after Christopher Columbus?", "Colombia", ["Venezuela", "Ecuador", "Bolivia"]),
    Q(2, "Which phrase for a person with two very different sides comes from a Robert Louis Stevenson novella?", "Jekyll and Hyde", ["Two-faced", "Dorian Gray", "Janus-faced"]),
    Q(3, "Siamese cats are named after an old name for which country?", "Thailand", ["Myanmar", "Cambodia", "Vietnam"]),
    Q(4, "Which word for a wise lawmaker comes from an Athenian statesman of the 500s BC?", "Solon", ["Draco", "Pericles", "Cleisthenes"]),
    Q(5, "A jeroboam, a large wine bottle, is named after a king of which ancient kingdom?", "Israel", ["Judah", "Babylon", "Egypt"]),
  ],
  // day 63 (2026-12-20)
  [
    Q(1, "Which sport is named after an English private school?", "Rugby", ["Cricket", "Squash", "Polo"]),
    Q(2, "Which whirlpool bath, now a general word, comes from a family of Italian-American inventors?", "Jacuzzi", ["Hot tub", "Spa", "Steam room"]),
    Q(3, "Vancouver is named after a British naval officer who had sailed with which explorer?", "James Cook", ["Francis Drake", "Henry Hudson", "Walter Raleigh"]),
    Q(4, "The Fallopian tubes are named after an anatomist from which country?", "Italy", ["France", "Netherlands", "Greece"]),
    Q(5, "Which word for a wise old counselor comes from the oldest Greek king at Troy?", "Nestor", ["Priam", "Agamemnon", "Ajax"]),
  ],
  // day 64 (2026-12-21)
  [
    Q(1, "Which lunch meat is named after a city in northern Italy?", "Bologna", ["Salami", "Pastrami", "Prosciutto"]),
    Q(2, "Which library classification system is named after an American librarian?", "Dewey Decimal System", ["Library of Congress system", "Alphabetical shelving", "ISBN system"]),
    Q(3, "Which Canadian province is named after a daughter of Queen Victoria?", "Alberta", ["Ontario", "Manitoba", "Saskatchewan"]),
    Q(4, "Satsuma oranges are named after a former province in which country?", "Japan", ["China", "Korea", "Vietnam"]),
    Q(5, "Nachos are named after a maître d' in which Mexican border town?", "Piedras Negras", ["Tijuana", "Ciudad Juárez", "Nuevo Laredo"]),
  ],
  // day 65 (2026-12-22)
  [
    Q(1, "Which 26.2-mile race is named after the site of an ancient Greek battle?", "Marathon", ["Triathlon", "Decathlon", "Relay"]),
    Q(2, "Which name for a man of great strength comes from a biblical judge whose power lay in his hair?", "Samson", ["Goliath", "Hercules", "Atlas"]),
    Q(3, "The US state of Georgia is named after which British king?", "George II", ["George I", "George III", "George V"]),
    Q(4, "Nicolas Chauvin, who gave us 'chauvinism,' was a soldier famed for his devotion to whom?", "Napoleon", ["Louis XVI", "Joan of Arc", "Charles de Gaulle"]),
    Q(5, "Tulle, a fine netting used in veils, is named after a town in which country?", "France", ["Belgium", "Italy", "Switzerland"]),
  ],
  // day 66 (2026-12-23)
  [
    Q(1, "Which month is named after the Roman god of war?", "March", ["May", "April", "June"]),
    Q(2, "Fig Newtons are named after a town in which state?", "Massachusetts", ["New York", "Connecticut", "Pennsylvania"]),
    Q(3, "Which small pocket pistol takes its name from a Philadelphia gunsmith?", "Derringer", ["Colt", "Luger", "Glock"]),
    Q(4, "Which verb meaning to kidnap a man for a ship's crew comes from a Chinese port city?", "Shanghai", ["Press-gang", "Hoodwink", "Abduct"]),
    Q(5, "Which word for hypocritical moralizing comes from a character in Dickens's 'Martin Chuzzlewit'?", "Pecksniffian", ["Micawberish", "Pickwickian", "Dickensian"]),
  ],
  // day 67 (2026-12-24)
  [
    Q(1, "Which ice-resurfacing machine takes its name from its California inventor?", "Zamboni", ["Snowcat", "Bulldozer", "Skid steer"]),
    Q(2, "Which word for posh and luxurious comes from a Swiss hotelier?", "Ritzy", ["Swanky", "Plush", "Classy"]),
    Q(3, "Which word for extra large was popularized by an elephant exhibited by P. T. Barnum?", "Jumbo", ["Mammoth", "Titanic", "Colossal"]),
    Q(4, "Cobalt is named after what kind of creature in German folklore?", "Goblin", ["Dragon", "Witch", "Giant"]),
    Q(5, "Kir, an aperitif of white wine and cassis, is named after a priest who was mayor of which city?", "Dijon", ["Lyon", "Reims", "Bordeaux"]),
  ],
  // day 68 (2026-12-25)
  [
    Q(1, "Which slang word for coffee comes from an Indonesian island?", "Java", ["Joe", "Brew", "Mud"]),
    Q(2, "'Santa Claus' comes from a Dutch name for which saint?", "Saint Nicholas", ["Saint Christopher", "Saint Patrick", "Saint Stephen"]),
    Q(3, "Beef Stroganoff honors a noble family from which country?", "Russia", ["Austria", "Hungary", "Poland"]),
    Q(4, "Angora wool is named after an old name for which capital city?", "Ankara", ["Athens", "Cairo", "Tehran"]),
    Q(5, "The Rorschach inkblot test is named after a psychiatrist from which country?", "Switzerland", ["Austria", "Germany", "Sweden"]),
  ],
  // day 69 (2026-12-26)
  [
    Q(1, "Which annual journalism prize is named after a newspaper publisher?", "Pulitzer Prize", ["Peabody Award", "Emmy Award", "Nobel Prize"]),
    Q(2, "The continent of Europe shares its name with a princess carried off by which god?", "Zeus", ["Poseidon", "Apollo", "Hades"]),
    Q(3, "The Pomeranian dog is named after a region on the coast of which sea?", "Baltic Sea", ["North Sea", "Black Sea", "Adriatic Sea"]),
    Q(4, "Which nickname for an inflatable life jacket, from World War II airmen, honors a Hollywood actress?", "Mae West", ["Betty Grable", "Rita Hayworth", "Jane Russell"]),
    Q(5, "Which word for an actor comes from the first actor recorded in ancient Greece?", "Thespian", ["Tragedian", "Histrionic", "Mummer"]),
  ],
  // day 70 (2026-12-27)
  [
    Q(1, "Which Egyptian port city is named after a Macedonian conqueror?", "Alexandria", ["Cairo", "Port Said", "Giza"]),
    Q(2, "Which wide-brimmed cowboy hat takes its name from a 19th-century Philadelphia hatmaker?", "Stetson", ["Fedora", "Sombrero", "Bowler"]),
    Q(3, "Four elements, including yttrium and ytterbium, are named after a village in which country?", "Sweden", ["Norway", "Finland", "Denmark"]),
    Q(4, "The python snake takes its name from a serpent slain by which god?", "Apollo", ["Zeus", "Hermes", "Poseidon"]),
    Q(5, "The balaclava is named after a town near which Crimean port city?", "Sevastopol", ["Odesa", "Yalta", "Kerch"]),
  ],
  // day 71 (2026-12-28)
  [
    Q(1, "Which phrase for a revealing slip of the tongue comes from the founder of psychoanalysis?", "Freudian slip", ["Spoonerism", "Malapropism", "Pavlovian response"]),
    Q(2, "Which small terrier is named after a county in northern England?", "Yorkshire terrier", ["Jack Russell terrier", "Scottish terrier", "Cairn terrier"]),
    Q(3, "Oysters Rockefeller were named for the oil tycoon because the sauce was so what?", "Rich", ["Green", "Spicy", "Golden"]),
    Q(4, "The clementine is named after a French missionary who grew it in which country?", "Algeria", ["Morocco", "Tunisia", "Spain"]),
    Q(5, "The mazurka is a dance named after the people of which region of Poland?", "Mazovia", ["Silesia", "Pomerania", "Galicia"]),
  ],
  // day 72 (2026-12-29)
  [
    Q(1, "The country name 'Romania' recalls which ancient empire?", "The Roman Empire", ["The Ottoman Empire", "The Byzantine Empire", "The Persian Empire"]),
    Q(2, "Which name for someone hopelessly out of date comes from a Washington Irving character who slept for 20 years?", "Rip Van Winkle", ["Ichabod Crane", "Sleeping Beauty", "Brom Bones"]),
    Q(3, "Mount Everest is named after a British official who led the survey of which country?", "India", ["Nepal", "Tibet", "China"]),
    Q(4, "Pennsylvania honors William Penn's father, who was what?", "An admiral", ["A bishop", "A judge", "A merchant"]),
    Q(5, "Which word for blindly naive optimism comes from a tutor in Voltaire's 'Candide'?", "Panglossian", ["Pollyannaish", "Quixotic", "Utopian"]),
  ],
  // day 73 (2026-12-30)
  [
    Q(1, "Which phrase for someone who helps a stranger in need comes from a parable of Jesus?", "Good Samaritan", ["Prodigal son", "Good shepherd", "Wise man"]),
    Q(2, "The SI unit of electric current honors which French physicist?", "André-Marie Ampère", ["Charles-Augustin de Coulomb", "Blaise Pascal", "Antoine Lavoisier"]),
    Q(3, "The Gladstone bag is named after a British what?", "Prime minister", ["Explorer", "Admiral", "Novelist"]),
    Q(4, "Abel Tasman, who gave his name to Tasmania, sailed for which country?", "Netherlands", ["Britain", "Portugal", "Spain"]),
    Q(5, "The Taser's name is an acronym built around which fictional boy inventor?", "Tom Swift", ["Danny Dunn", "Tom Sawyer", "Encyclopedia Brown"]),
  ],
  // day 74 (2026-12-31)
  [
    Q(1, "Which month is named after a two-faced Roman god of doorways?", "January", ["February", "March", "December"]),
    Q(2, "Which shallow lab dish is named after a German bacteriologist?", "Petri dish", ["Test tube", "Beaker", "Crucible"]),
    Q(3, "Fettuccine Alfredo is named after a restaurateur in which city?", "Rome", ["Milan", "Naples", "Bologna"]),
    Q(4, "Louisiana is named after which French king?", "Louis XIV", ["Louis XIII", "Louis XV", "Louis XVI"]),
    Q(5, "'Pamphlet' comes from the title of a popular 12th-century Latin poem about what?", "Love", ["War", "Faith", "The sea"]),
  ],
];
// Every authored day, launch first; nothing reads this today.
export const ALL_DAYS = [...LAUNCH_DAYS, ...LANE_DAYS];
