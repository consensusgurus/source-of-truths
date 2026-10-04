// Animal data for Clade, the daily family-tree guessing game.
//
// ANIMALS is every animal a player can guess (and every possible answer).
// Each entry: { name, path, tier, alt? }
//   name  the common name shown on the board and in the type-ahead
//   path  branch names from the root 'Animals' down to the most specific
//         branch that holds this animal (the animal itself is NOT on it),
//         4 to 9 rungs, in plain words, the scientific name added only
//         where it helps
//   tier  1 everyone knows it, 2 familiar, 3 less common, 4 rare (the
//         Sunday Edition draws its answers from tier 4 only)
//   alt   other names the type-ahead accepts for the same animal
//
// THE TREE IS A TREE. A branch name always sits under the same parent path
// wherever it appears, which is why every path below is built from the
// shared constants rather than typed out: scripts/verify-clade.mjs re-proves
// it from the exported data.
//
// TAXONOMY NOTES, so nobody "fixes" these:
//  * In strict cladistics birds sit INSIDE reptiles (crocodilians are closer
//    to birds than to lizards). This game uses the familiar classes instead:
//    Mammals, Birds, Reptiles and Amphibians are siblings under
//    'Four-limbed vertebrates'. Likewise the four fish groups are siblings
//    under 'Vertebrates', and insects are siblings of crustaceans under
//    'Arthropods', the way a field guide files them.
//  * A path may skip real intermediate groups (it is coarser than the full
//    tree, never contradictory to it). Depth is capped at 9 rungs.
//  * Whales sit with hippos inside 'Whales and even-toed hoofed mammals'.
//    The red panda is not a bear, hyenas are cat-like carnivores, seals are
//    dog-like carnivores, king crabs and hermit crabs are decapods, the
//    roadrunner is a cuckoo, the kookaburra is a kingfisher.
//  * One name per species: there is no separate Dog (Gray wolf), Dingo,
//    Wild boar (Pig), Koi (Common carp), Ferret or Grizzly bear (Brown bear).
//    Where a second name is common it is an alt.
//  * US spellings throughout (Gray wolf, Harbor seal).

const VERT = ['Animals', 'Vertebrates'];
const TETRA = [...VERT, 'Four-limbed vertebrates'];

// ---- Mammals ----
const MAMMALS = [...TETRA, 'Mammals'];
const MONOTREMES = [...MAMMALS, 'Egg-laying mammals'];
const MARSUPIALS = [...MAMMALS, 'Marsupials'];
const DIPROTO = [...MARSUPIALS, 'Kangaroos, koalas and wombats'];
const MACROPODS = [...DIPROTO, 'Kangaroo family'];
const VOMBAT = [...DIPROTO, 'Koalas and wombats'];
const DASYURO = [...MARSUPIALS, 'Carnivorous marsupials'];
const OPOSSUMS = [...MARSUPIALS, 'American opossums'];
const PLACENTAL = [...MAMMALS, 'Placental mammals'];
const CARNIVORES = [...PLACENTAL, 'Carnivores'];
const CANIFORM = [...CARNIVORES, 'Dog-like carnivores'];
const DOGS = [...CANIFORM, 'Dog family'];
const FOXES = [...DOGS, 'True foxes'];
const CANIS = [...DOGS, 'Wolves and jackals'];
const BEARS = [...CANIFORM, 'Bears'];
const PINNIPEDS = [...CANIFORM, 'Seals, sea lions and walrus'];
const EARLESS = [...PINNIPEDS, 'Earless seals'];
const EARED = [...PINNIPEDS, 'Eared seals'];
const WEASELS = [...CANIFORM, 'Weasel family'];
const RACCOONS = [...CANIFORM, 'Raccoon family'];
const SKUNKS = [...CANIFORM, 'Skunk family'];
const FELIFORM = [...CARNIVORES, 'Cat-like carnivores'];
const CATS = [...FELIFORM, 'Cat family'];
const BIGCATS = [...CATS, 'Big cats (Panthera)'];
const PURRCATS = [...CATS, 'Purring cats'];
const HYENAS = [...FELIFORM, 'Hyena family'];
const MONGOOSES = [...FELIFORM, 'Mongoose family'];
const CIVETS = [...FELIFORM, 'Civets and genets'];
const PRIMATES = [...PLACENTAL, 'Primates'];
const SIMIANS = [...PRIMATES, 'Monkeys and apes'];
const APES = [...SIMIANS, 'Apes'];
const GREATAPES = [...APES, 'Great apes'];
const GIBBONS = [...APES, 'Gibbons'];
const OWMONKEYS = [...SIMIANS, 'Old World monkeys'];
const NWMONKEYS = [...SIMIANS, 'New World monkeys'];
const LEMURS = [...PRIMATES, 'Lemurs and lorises'];
const ARTIO = [...PLACENTAL, 'Whales and even-toed hoofed mammals'];
const WHIPPO = [...ARTIO, 'Whales, dolphins and hippos'];
const CETACEANS = [...WHIPPO, 'Whales and dolphins'];
const TOOTHED = [...CETACEANS, 'Toothed whales'];
const BALEEN = [...CETACEANS, 'Baleen whales'];
const HIPPOS = [...WHIPPO, 'Hippos'];
const RUMINANTS = [...ARTIO, 'Cud-chewers (ruminants)'];
const BOVIDS = [...RUMINANTS, 'Cattle, antelopes, sheep and goats'];
const DEER = [...RUMINANTS, 'Deer family'];
const GIRAFFIDS = [...RUMINANTS, 'Giraffe family'];
const CAMELS = [...ARTIO, 'Camel family'];
const PIGS = [...ARTIO, 'Pig family'];
const PERISSO = [...PLACENTAL, 'Odd-toed hoofed mammals'];
const HORSES = [...PERISSO, 'Horse family'];
const RHINOS = [...PERISSO, 'Rhinoceroses'];
const TAPIRS = [...PERISSO, 'Tapirs'];
const RODENTS = [...PLACENTAL, 'Rodents'];
const MYO = [...RODENTS, 'Mouse-like rodents'];
const SCIURO = [...RODENTS, 'Squirrel-like rodents'];
const HYSTRICO = [...RODENTS, 'Porcupine-like rodents'];
const CASTORI = [...RODENTS, 'Beavers and gophers'];
const LAGOMORPHS = [...PLACENTAL, 'Rabbits, hares and pikas'];
const BATS = [...PLACENTAL, 'Bats'];
const EULIPO = [...PLACENTAL, 'Hedgehogs, shrews and moles'];
const PANGOLINS = [...PLACENTAL, 'Pangolins'];
const AFRO = [...PLACENTAL, 'Elephants, sea cows and kin (Afrotheria)'];
const ELEPHANTS = [...AFRO, 'Elephants'];
const SEACOWS = [...AFRO, 'Sea cows'];
const XENARTHRA = [...PLACENTAL, 'Sloths, anteaters and armadillos'];
const PILOSA = [...XENARTHRA, 'Sloths and anteaters'];
const ARMADILLOS = [...XENARTHRA, 'Armadillos'];

// ---- Birds ----
const BIRDS = [...TETRA, 'Birds'];
const RATITES = [...BIRDS, 'Ostriches, emus and kin'];
const FOWL = [...BIRDS, 'Fowl'];
const LANDFOWL = [...FOWL, 'Landfowl'];
const WATERFOWL = [...FOWL, 'Waterfowl'];
const NEOAVES = [...BIRDS, 'Modern birds (Neoaves)'];
const LANDBIRDS = [...NEOAVES, 'Core land birds'];
const AUSTRAL = [...LANDBIRDS, 'Falcons, parrots and perching birds'];
const PASSERINES = [...AUSTRAL, 'Perching birds'];
const CORVIDS = [...PASSERINES, 'Crow family'];
const PARROTS = [...AUSTRAL, 'Parrots'];
const FALCONS = [...AUSTRAL, 'Falcons'];
const AFROAVES = [...LANDBIRDS, 'Hawks, owls and woodpeckers'];
const RAPTORS = [...AFROAVES, 'Hawks, eagles and vultures'];
const OWLS = [...AFROAVES, 'Owls'];
const PICI = [...AFROAVES, 'Woodpeckers and toucans'];
const CORACII = [...AFROAVES, 'Kingfishers and kin'];
const HORNBILLS = [...AFROAVES, 'Hornbills and hoopoes'];
const STRISORES = [...NEOAVES, 'Hummingbirds, swifts and nightjars'];
const PIGEONS = [...NEOAVES, 'Pigeons and doves'];
const CUCKOOS = [...NEOAVES, 'Cuckoos'];
const WATERBIRDS = [...NEOAVES, 'Core waterbirds'];
const PENGUINS = [...WATERBIRDS, 'Penguins'];
const TUBENOSES = [...WATERBIRDS, 'Albatrosses and petrels'];
const PELECANI = [...WATERBIRDS, 'Pelicans, herons and ibises'];
const STORKS = [...WATERBIRDS, 'Storks'];
const SULI = [...WATERBIRDS, 'Cormorants, gannets and boobies'];
const LOONS = [...WATERBIRDS, 'Loons'];
const SHOREBIRDS = [...NEOAVES, 'Shorebirds, gulls and auks'];
const GRUI = [...NEOAVES, 'Cranes and rails'];
const MIRAND = [...NEOAVES, 'Flamingos and grebes'];

// ---- Reptiles (birds are a sibling class here, see the note above) ----
const REPTILES = [...TETRA, 'Reptiles'];
const LEPIDO = [...REPTILES, 'Lizards, snakes and tuatara'];
const SQUAMATES = [...LEPIDO, 'Lizards and snakes'];
const SNAKES = [...SQUAMATES, 'Snakes'];
const PYTHONS = [...SNAKES, 'Pythons'];
const BOAS = [...SNAKES, 'Boas'];
const VIPERS = [...SNAKES, 'Vipers'];
const ELAPIDS = [...SNAKES, 'Cobras, mambas and coral snakes'];
const COLUBRIDS = [...SNAKES, 'Colubrid snakes'];
const IGUANIA = [...SQUAMATES, 'Iguanas, chameleons and dragon lizards'];
const GECKOS = [...SQUAMATES, 'Geckos'];
const ANGUI = [...SQUAMATES, 'Monitors and kin'];
const SKINKS = [...SQUAMATES, 'Skinks'];
const TURTLES = [...REPTILES, 'Turtles'];
const SEATURTLES = [...TURTLES, 'Sea turtles'];
const TORTOISES = [...TURTLES, 'Tortoises'];
const EMYDIDS = [...TURTLES, 'Pond and box turtles'];
const SNAPPERS = [...TURTLES, 'Snapping turtles'];
const CROCS = [...REPTILES, 'Crocodilians'];
const GATORS = [...CROCS, 'Alligators and caimans'];
const TRUECROCS = [...CROCS, 'Crocodiles'];

// ---- Amphibians ----
const AMPHIBIANS = [...TETRA, 'Amphibians'];
const FROGS = [...AMPHIBIANS, 'Frogs and toads'];
const TRUEFROGS = [...FROGS, 'True frogs'];
const TOADS = [...FROGS, 'True toads'];
const TREEFROGS = [...FROGS, 'Tree frogs'];
const DARTFROGS = [...FROGS, 'Poison dart frogs'];
const SALAMANDERS = [...AMPHIBIANS, 'Salamanders and newts'];
const MOLESAL = [...SALAMANDERS, 'Mole salamanders'];
const GIANTSAL = [...SALAMANDERS, 'Giant salamanders'];
const NEWTS = [...SALAMANDERS, 'Newts and true salamanders'];
const PROTEIDS = [...SALAMANDERS, 'Mudpuppies and olm'];

// ---- Fish (four sibling groups under Vertebrates) ----
const RAYFIN = [...VERT, 'Ray-finned fish'];
const CARTILAGE = [...VERT, 'Sharks and rays'];
const LOBEFIN = [...VERT, 'Lobe-finned fish'];
const JAWLESS = [...VERT, 'Jawless fish'];
const f = (branch) => [...RAYFIN, branch];
const SALMON = f('Salmon and trout');
const CARPS = f('Carp and minnows');
const CATFISH = f('Catfishes');
const CHARACINS = f('Piranhas and tetras');
const KNIFEFISH = f('Knifefish');
const EELS = f('Eels');
const TUNAS = f('Tunas and mackerels');
const BILLFISH = f('Billfish');
const CICHLIDS = f('Cichlids');
const SEAHORSES = f('Seahorses and pipefish');
const FLATFISH = f('Flatfish');
const CODS = f('Cod family');
const HERRINGS = f('Herrings and anchovies');
const PUFFERS = f('Pufferfish and ocean sunfish');
const ANGLERS = f('Anglerfish');
const DAMSELS = f('Clownfish and damselfish');
const STURGEONS = f('Sturgeons and paddlefish');
const PIKES = f('Pikes');
const PERCHES = f('Perch family');
const SUNFISH = f('Freshwater sunfish and bass');
const GOURAMIS = f('Gouramis and bettas');
const LIVEBEARERS = f('Guppies and mollies');
const SHARKS = [...CARTILAGE, 'Sharks'];
const RAYS = [...CARTILAGE, 'Rays and skates'];

// ---- Arthropods ----
const ARTHRO = ['Animals', 'Arthropods'];
const INSECTS = [...ARTHRO, 'Insects'];
const BEETLES = [...INSECTS, 'Beetles'];
const LEPS = [...INSECTS, 'Butterflies and moths'];
const HYMENO = [...INSECTS, 'Ants, bees and wasps'];
const FLIES = [...INSECTS, 'Flies and mosquitoes'];
const ORTHO = [...INSECTS, 'Grasshoppers and crickets'];
const BUGS = [...INSECTS, 'True bugs'];
const ODONATA = [...INSECTS, 'Dragonflies and damselflies'];
const BLATTO = [...INSECTS, 'Cockroaches and termites'];
const MANTISES = [...INSECTS, 'Mantises'];
const PHASMIDS = [...INSECTS, 'Stick insects'];
const FLEAS = [...INSECTS, 'Fleas'];
const CHELI = [...ARTHRO, 'Arachnids and horseshoe crabs'];
const ARACHNIDS = [...CHELI, 'Arachnids'];
const SPIDERS = [...ARACHNIDS, 'Spiders'];
const SCORPIONS = [...ARACHNIDS, 'Scorpions'];
const TICKS = [...ARACHNIDS, 'Ticks and mites'];
const HARVEST = [...ARACHNIDS, 'Harvestmen'];
const HORSESHOE = [...CHELI, 'Horseshoe crabs'];
const CRUSTACEANS = [...ARTHRO, 'Crustaceans'];
const DECAPODS = [...CRUSTACEANS, 'Crabs, lobsters and shrimp'];
const KRILL = [...CRUSTACEANS, 'Krill'];
const BARNACLES = [...CRUSTACEANS, 'Barnacles'];
const ISOPODS = [...CRUSTACEANS, 'Woodlice and isopods'];
const STOMATOPODS = [...CRUSTACEANS, 'Mantis shrimps'];
const MYRIAPODS = [...ARTHRO, 'Centipedes and millipedes'];
const CENTIPEDES = [...MYRIAPODS, 'Centipedes'];
const MILLIPEDES = [...MYRIAPODS, 'Millipedes'];

// ---- Mollusks ----
const MOLLUSKS = ['Animals', 'Mollusks'];
const CEPHALOPODS = [...MOLLUSKS, 'Octopuses, squid and kin (cephalopods)'];
const OCTOPUSES = [...CEPHALOPODS, 'Octopuses'];
const SQUID = [...CEPHALOPODS, 'Squid'];
const CUTTLEFISH = [...CEPHALOPODS, 'Cuttlefish'];
const NAUTILUSES = [...CEPHALOPODS, 'Nautiluses'];
const GASTROPODS = [...MOLLUSKS, 'Snails and slugs'];
const LANDSNAILS = [...GASTROPODS, 'Land snails and slugs'];
const CONCHS = [...GASTROPODS, 'Conchs'];
const BIVALVES = [...MOLLUSKS, 'Clams, oysters and mussels'];
const OYSTERS = [...BIVALVES, 'Oysters'];
const MUSSELS = [...BIVALVES, 'Sea mussels'];
const SCALLOPS = [...BIVALVES, 'Scallops'];
const COCKLES = [...BIVALVES, 'Cockles and giant clams'];

// ---- Others ----
const ECHINO = ['Animals', 'Echinoderms'];
const ASTEROZOA = [...ECHINO, 'Sea stars and brittle stars'];
const SEASTARS = [...ASTEROZOA, 'Sea stars'];
const BRITTLE = [...ASTEROZOA, 'Brittle stars'];
const ECHINOZOA = [...ECHINO, 'Sea urchins and sea cucumbers'];
const URCHINS = [...ECHINOZOA, 'Sea urchins and sand dollars'];
const CUCUMBERS = [...ECHINOZOA, 'Sea cucumbers'];
const CNIDARIA = ['Animals', 'Jellyfish, corals and anemones'];
const MEDUSOZOA = [...CNIDARIA, 'Jellyfish and kin'];
const TRUEJELLIES = [...MEDUSOZOA, 'True jellyfish'];
const BOXJELLIES = [...MEDUSOZOA, 'Box jellies'];
const HYDROZOA = [...MEDUSOZOA, 'Hydras and siphonophores'];
const ANTHOZOA = [...CNIDARIA, 'Corals and anemones'];
const ANEMONES = [...ANTHOZOA, 'Sea anemones'];
const STONYCORALS = [...ANTHOZOA, 'Stony corals'];
const ANNELIDS = ['Animals', 'Segmented worms'];
const CLITELLATES = [...ANNELIDS, 'Earthworms and leeches'];
const EARTHWORMS = [...CLITELLATES, 'Earthworms'];
const LEECHES = [...CLITELLATES, 'Leeches'];

const A = (name, path, tier, alt) => (alt ? { name, path, tier, alt } : { name, path, tier });

export const ANIMALS = [
  // Mammals: monotremes and marsupials
  A('Platypus', MONOTREMES, 2, ['Duck-billed platypus']),
  A('Short-beaked echidna', MONOTREMES, 3, ['Echidna', 'Spiny anteater']),
  A('Red kangaroo', MACROPODS, 1, ['Kangaroo']),
  A('Red-necked wallaby', MACROPODS, 3, ['Wallaby']),
  A('Quokka', MACROPODS, 3),
  A('Koala', VOMBAT, 1),
  A('Common wombat', VOMBAT, 2, ['Wombat']),
  A('Sugar glider', DIPROTO, 3),
  A('Tasmanian devil', DASYURO, 2),
  A('Eastern quoll', DASYURO, 4, ['Quoll']),
  A('Numbat', DASYURO, 4),
  A('Virginia opossum', OPOSSUMS, 2, ['Opossum', 'Possum']),
  // Carnivores: dog-like
  A('Red fox', FOXES, 1, ['Fox']),
  A('Arctic fox', FOXES, 2),
  A('Fennec fox', FOXES, 3),
  A('Gray wolf', CANIS, 1, ['Wolf', 'Grey wolf', 'Timber wolf']),
  A('Coyote', CANIS, 2),
  A('Golden jackal', CANIS, 3, ['Jackal']),
  A('African wild dog', DOGS, 3, ['Painted dog']),
  A('Maned wolf', DOGS, 4),
  A('Brown bear', BEARS, 1, ['Grizzly bear', 'Kodiak bear']),
  A('Polar bear', BEARS, 1),
  A('American black bear', BEARS, 2, ['Black bear']),
  A('Giant panda', BEARS, 1, ['Panda']),
  A('Sun bear', BEARS, 3),
  A('Harbor seal', EARLESS, 2, ['Common seal', 'Seal']),
  A('Southern elephant seal', EARLESS, 3, ['Elephant seal']),
  A('California sea lion', EARED, 2, ['Sea lion']),
  A('Northern fur seal', EARED, 3, ['Fur seal']),
  A('Walrus', PINNIPEDS, 1),
  A('Sea otter', WEASELS, 2),
  A('North American river otter', WEASELS, 2, ['River otter', 'Otter']),
  A('Honey badger', WEASELS, 3, ['Ratel']),
  A('European badger', WEASELS, 2, ['Badger']),
  A('Wolverine', WEASELS, 3),
  A('Stoat', WEASELS, 3, ['Ermine', 'Short-tailed weasel']),
  A('Raccoon', RACCOONS, 1),
  A('White-nosed coati', RACCOONS, 4, ['Coati', 'Coatimundi']),
  A('Kinkajou', RACCOONS, 4),
  A('Striped skunk', SKUNKS, 1, ['Skunk']),
  A('Red panda', CANIFORM, 2),
  // Carnivores: cat-like
  A('Lion', BIGCATS, 1),
  A('Tiger', BIGCATS, 1),
  A('Leopard', BIGCATS, 2),
  A('Jaguar', BIGCATS, 2),
  A('Snow leopard', BIGCATS, 3),
  A('House cat', PURRCATS, 1, ['Cat', 'Domestic cat']),
  A('Cheetah', PURRCATS, 1),
  A('Cougar', PURRCATS, 2, ['Puma', 'Mountain lion']),
  A('Bobcat', PURRCATS, 2),
  A('Canada lynx', PURRCATS, 3, ['Lynx']),
  A('Ocelot', PURRCATS, 3),
  A('Serval', PURRCATS, 3),
  A('Caracal', PURRCATS, 4),
  A('Spotted hyena', HYENAS, 2, ['Hyena', 'Laughing hyena']),
  A('Striped hyena', HYENAS, 3),
  A('Aardwolf', HYENAS, 4),
  A('Meerkat', MONGOOSES, 2),
  A('Indian gray mongoose', MONGOOSES, 3, ['Mongoose']),
  A('Binturong', CIVETS, 4, ['Bearcat']),
  A('Common genet', CIVETS, 4, ['Genet']),
  A('Fossa', FELIFORM, 4),
  // Primates
  A('Human', GREATAPES, 1, ['Person']),
  A('Chimpanzee', GREATAPES, 1, ['Chimp']),
  A('Bonobo', GREATAPES, 3),
  A('Western gorilla', GREATAPES, 1, ['Gorilla']),
  A('Bornean orangutan', GREATAPES, 2, ['Orangutan']),
  A('Lar gibbon', GIBBONS, 3, ['Gibbon', 'White-handed gibbon']),
  A('Siamang', GIBBONS, 4),
  A('Mandrill', OWMONKEYS, 3),
  A('Olive baboon', OWMONKEYS, 2, ['Baboon']),
  A('Rhesus macaque', OWMONKEYS, 3, ['Rhesus monkey']),
  A('Japanese macaque', OWMONKEYS, 3, ['Snow monkey']),
  A('Proboscis monkey', OWMONKEYS, 3),
  A('White-faced capuchin', NWMONKEYS, 2, ['Capuchin monkey', 'Capuchin']),
  A('Mantled howler monkey', NWMONKEYS, 3, ['Howler monkey']),
  A('Black-handed spider monkey', NWMONKEYS, 3, ['Spider monkey']),
  A('Common marmoset', NWMONKEYS, 3, ['Marmoset']),
  A('Golden lion tamarin', NWMONKEYS, 3, ['Tamarin']),
  A('Common squirrel monkey', NWMONKEYS, 3, ['Squirrel monkey']),
  A('Ring-tailed lemur', LEMURS, 2, ['Lemur']),
  A('Aye-aye', LEMURS, 4),
  A('Indri', LEMURS, 4),
  A('Sunda slow loris', LEMURS, 3, ['Slow loris']),
  A('Philippine tarsier', PRIMATES, 3, ['Tarsier']),
  // Whales and even-toed hoofed mammals
  A('Orca', TOOTHED, 1, ['Killer whale']),
  A('Bottlenose dolphin', TOOTHED, 1, ['Dolphin']),
  A('Sperm whale', TOOTHED, 2),
  A('Beluga whale', TOOTHED, 2, ['White whale']),
  A('Narwhal', TOOTHED, 3),
  A('Harbor porpoise', TOOTHED, 3, ['Porpoise']),
  A('Blue whale', BALEEN, 1),
  A('Humpback whale', BALEEN, 2),
  A('Gray whale', BALEEN, 3),
  A('Bowhead whale', BALEEN, 4),
  A('Hippopotamus', HIPPOS, 1, ['Hippo']),
  A('Pygmy hippopotamus', HIPPOS, 3, ['Pygmy hippo']),
  A('Cow', BOVIDS, 1, ['Cattle', 'Bull', 'Ox']),
  A('American bison', BOVIDS, 2, ['Bison', 'Buffalo']),
  A('Water buffalo', BOVIDS, 2),
  A('Cape buffalo', BOVIDS, 3, ['African buffalo']),
  A('Yak', BOVIDS, 3),
  A('Sheep', BOVIDS, 1, ['Lamb']),
  A('Goat', BOVIDS, 1),
  A('Bighorn sheep', BOVIDS, 3),
  A('Mountain goat', BOVIDS, 3),
  A('Musk ox', BOVIDS, 3),
  A('Blue wildebeest', BOVIDS, 2, ['Wildebeest', 'Gnu']),
  A('Impala', BOVIDS, 3),
  A("Thomson's gazelle", BOVIDS, 3, ['Gazelle']),
  A('Saiga antelope', BOVIDS, 4, ['Saiga']),
  A('Moose', DEER, 1),
  A('Reindeer', DEER, 1, ['Caribou']),
  A('White-tailed deer', DEER, 1, ['Deer', 'Whitetail']),
  A('Elk', DEER, 2, ['Wapiti']),
  A('Giraffe', GIRAFFIDS, 1),
  A('Okapi', GIRAFFIDS, 4),
  A('Pronghorn', RUMINANTS, 3),
  A('Dromedary camel', CAMELS, 1, ['Camel', 'Arabian camel']),
  A('Bactrian camel', CAMELS, 3),
  A('Llama', CAMELS, 2),
  A('Alpaca', CAMELS, 2),
  A('Pig', PIGS, 1, ['Wild boar', 'Hog', 'Domestic pig']),
  A('Common warthog', PIGS, 2, ['Warthog']),
  // Odd-toed hoofed mammals
  A('Horse', HORSES, 1, ['Pony']),
  A('Donkey', HORSES, 1, ['Burro', 'Ass']),
  A('Plains zebra', HORSES, 1, ['Zebra']),
  A('White rhinoceros', RHINOS, 1, ['Rhinoceros', 'Rhino', 'White rhino']),
  A('Black rhinoceros', RHINOS, 3, ['Black rhino']),
  A('Indian rhinoceros', RHINOS, 3, ['Indian rhino']),
  A('Malayan tapir', TAPIRS, 3, ['Tapir']),
  A('South American tapir', TAPIRS, 4, ['Brazilian tapir']),
  // Rodents and rabbits
  A('House mouse', MYO, 1, ['Mouse']),
  A('Brown rat', MYO, 1, ['Rat', 'Norway rat']),
  A('Golden hamster', MYO, 1, ['Hamster', 'Syrian hamster']),
  A('Mongolian gerbil', MYO, 3, ['Gerbil']),
  A('Norway lemming', MYO, 3, ['Lemming']),
  A('Muskrat', MYO, 3),
  A('Eastern gray squirrel', SCIURO, 1, ['Squirrel', 'Gray squirrel']),
  A('Eastern chipmunk', SCIURO, 2, ['Chipmunk']),
  A('Groundhog', SCIURO, 2, ['Woodchuck']),
  A('Black-tailed prairie dog', SCIURO, 2, ['Prairie dog']),
  A('Alpine marmot', SCIURO, 3, ['Marmot']),
  A('Capybara', HYSTRICO, 2),
  A('Guinea pig', HYSTRICO, 1, ['Cavy']),
  A('Chinchilla', HYSTRICO, 3),
  A('North American porcupine', HYSTRICO, 2, ['Porcupine']),
  A('Naked mole-rat', HYSTRICO, 3),
  A('American beaver', CASTORI, 1, ['Beaver']),
  A("Botta's pocket gopher", CASTORI, 4, ['Pocket gopher', 'Gopher']),
  A("Merriam's kangaroo rat", CASTORI, 4, ['Kangaroo rat']),
  A('European rabbit', LAGOMORPHS, 1, ['Rabbit', 'Bunny']),
  A('Snowshoe hare', LAGOMORPHS, 3, ['Hare']),
  A('Black-tailed jackrabbit', LAGOMORPHS, 3, ['Jackrabbit']),
  A('American pika', LAGOMORPHS, 3, ['Pika']),
  // Other placentals
  A('Common vampire bat', BATS, 2, ['Vampire bat']),
  A('Little brown bat', BATS, 2, ['Bat']),
  A('Large flying fox', BATS, 3, ['Flying fox', 'Fruit bat']),
  A('Mexican free-tailed bat', BATS, 4),
  A('European hedgehog', EULIPO, 1, ['Hedgehog']),
  A('European mole', EULIPO, 2, ['Mole']),
  A('Star-nosed mole', EULIPO, 3),
  A('Common shrew', EULIPO, 3, ['Shrew']),
  A('Ground pangolin', PANGOLINS, 3, ['Pangolin']),
  A('African bush elephant', ELEPHANTS, 1, ['African elephant', 'Elephant']),
  A('Asian elephant', ELEPHANTS, 2),
  A('West Indian manatee', SEACOWS, 2, ['Manatee']),
  A('Dugong', SEACOWS, 3),
  A('Aardvark', AFRO, 3),
  A('Rock hyrax', AFRO, 4, ['Hyrax']),
  A('Brown-throated sloth', PILOSA, 2, ['Three-toed sloth', 'Sloth']),
  A("Hoffmann's two-toed sloth", PILOSA, 3, ['Two-toed sloth']),
  A('Giant anteater', PILOSA, 2, ['Anteater']),
  A('Nine-banded armadillo', ARMADILLOS, 2, ['Armadillo']),

  // Birds
  A('Ostrich', RATITES, 1),
  A('Emu', RATITES, 2),
  A('Southern cassowary', RATITES, 3, ['Cassowary']),
  A('North Island brown kiwi', RATITES, 3, ['Kiwi']),
  A('Greater rhea', RATITES, 4, ['Rhea']),
  A('Chicken', LANDFOWL, 1, ['Rooster', 'Hen']),
  A('Wild turkey', LANDFOWL, 1, ['Turkey']),
  A('Indian peafowl', LANDFOWL, 1, ['Peacock', 'Peafowl']),
  A('Common pheasant', LANDFOWL, 3, ['Pheasant', 'Ring-necked pheasant']),
  A('Common quail', LANDFOWL, 3, ['Quail']),
  A('Mallard', WATERFOWL, 1, ['Duck', 'Mallard duck']),
  A('Mute swan', WATERFOWL, 1, ['Swan']),
  A('Canada goose', WATERFOWL, 1, ['Goose']),
  A('Black swan', WATERFOWL, 3),
  A('American crow', CORVIDS, 1, ['Crow']),
  A('Common raven', CORVIDS, 2, ['Raven']),
  A('Blue jay', CORVIDS, 2),
  A('Eurasian magpie', CORVIDS, 3, ['Magpie']),
  A('American robin', PASSERINES, 1, ['Robin']),
  A('House sparrow', PASSERINES, 1, ['Sparrow']),
  A('Northern cardinal', PASSERINES, 2, ['Cardinal']),
  A('European starling', PASSERINES, 3, ['Starling']),
  A('Barn swallow', PASSERINES, 3, ['Swallow']),
  A('Northern mockingbird', PASSERINES, 3, ['Mockingbird']),
  A('Black-capped chickadee', PASSERINES, 3, ['Chickadee']),
  A('Atlantic canary', PASSERINES, 2, ['Canary']),
  A('Zebra finch', PASSERINES, 3, ['Finch']),
  A('Common nightingale', PASSERINES, 3, ['Nightingale']),
  A('Superb lyrebird', PASSERINES, 4, ['Lyrebird']),
  A('Budgerigar', PARROTS, 2, ['Budgie', 'Parakeet']),
  A('Scarlet macaw', PARROTS, 2, ['Macaw']),
  A('African grey parrot', PARROTS, 2, ['Grey parrot', 'Gray parrot', 'Parrot']),
  A('Sulphur-crested cockatoo', PARROTS, 3, ['Cockatoo']),
  A('Kea', PARROTS, 4),
  A('Kakapo', PARROTS, 4),
  A('Peregrine falcon', FALCONS, 2, ['Falcon']),
  A('American kestrel', FALCONS, 3, ['Kestrel']),
  A('Bald eagle', RAPTORS, 1, ['Eagle']),
  A('Golden eagle', RAPTORS, 2),
  A('Harpy eagle', RAPTORS, 4),
  A('Red-tailed hawk', RAPTORS, 2, ['Hawk']),
  A('Osprey', RAPTORS, 3),
  A('Turkey vulture', RAPTORS, 2, ['Vulture', 'Buzzard']),
  A('California condor', RAPTORS, 3, ['Condor']),
  A('Andean condor', RAPTORS, 3),
  A('Secretarybird', RAPTORS, 4, ['Secretary bird']),
  A('Barn owl', OWLS, 1, ['Owl']),
  A('Snowy owl', OWLS, 2),
  A('Great horned owl', OWLS, 2),
  A('Toco toucan', PICI, 2, ['Toucan']),
  A('Downy woodpecker', PICI, 2, ['Woodpecker']),
  A('Pileated woodpecker', PICI, 3),
  A('Common kingfisher', CORACII, 3, ['Kingfisher']),
  A('Laughing kookaburra', CORACII, 3, ['Kookaburra']),
  A('Great hornbill', HORNBILLS, 4, ['Hornbill']),
  A('Eurasian hoopoe', HORNBILLS, 4, ['Hoopoe']),
  A('Ruby-throated hummingbird', STRISORES, 1, ['Hummingbird']),
  A('Common swift', STRISORES, 3, ['Swift']),
  A('Eastern whip-poor-will', STRISORES, 4, ['Whip-poor-will', 'Whippoorwill']),
  A('Rock pigeon', PIGEONS, 1, ['Pigeon', 'Rock dove']),
  A('Mourning dove', PIGEONS, 2, ['Dove']),
  A('Common cuckoo', CUCKOOS, 2, ['Cuckoo']),
  A('Greater roadrunner', CUCKOOS, 2, ['Roadrunner']),
  A('Emperor penguin', PENGUINS, 1, ['Penguin']),
  A('King penguin', PENGUINS, 3),
  A('Adelie penguin', PENGUINS, 3),
  A('Little penguin', PENGUINS, 3, ['Fairy penguin', 'Little blue penguin']),
  A('Wandering albatross', TUBENOSES, 2, ['Albatross']),
  A('Northern fulmar', TUBENOSES, 4, ['Fulmar']),
  A('Brown pelican', PELECANI, 1, ['Pelican']),
  A('Great blue heron', PELECANI, 2, ['Heron']),
  A('Scarlet ibis', PELECANI, 3, ['Ibis']),
  A('Shoebill', PELECANI, 4, ['Shoebill stork']),
  A('White stork', STORKS, 2, ['Stork']),
  A('Marabou stork', STORKS, 4),
  A('Blue-footed booby', SULI, 3, ['Booby']),
  A('Great cormorant', SULI, 3, ['Cormorant']),
  A('Common loon', LOONS, 3, ['Loon']),
  A('Atlantic puffin', SHOREBIRDS, 2, ['Puffin']),
  A('Herring gull', SHOREBIRDS, 1, ['Seagull', 'Gull']),
  A('Arctic tern', SHOREBIRDS, 3, ['Tern']),
  A('Killdeer', SHOREBIRDS, 4),
  A('Whooping crane', GRUI, 3),
  A('Sandhill crane', GRUI, 3, ['Crane']),
  A('American coot', GRUI, 4, ['Coot']),
  A('American flamingo', MIRAND, 1, ['Flamingo']),
  A('Great crested grebe', MIRAND, 4, ['Grebe']),

  // Reptiles
  A('Burmese python', PYTHONS, 2, ['Python']),
  A('Ball python', PYTHONS, 2, ['Royal python']),
  A('Reticulated python', PYTHONS, 3),
  A('Boa constrictor', BOAS, 1, ['Boa']),
  A('Green anaconda', BOAS, 2, ['Anaconda']),
  A('Western diamondback rattlesnake', VIPERS, 1, ['Rattlesnake', 'Diamondback']),
  A('Copperhead', VIPERS, 3),
  A('Gaboon viper', VIPERS, 4),
  A('King cobra', ELAPIDS, 1, ['Cobra']),
  A('Black mamba', ELAPIDS, 2, ['Mamba']),
  A('Eastern coral snake', ELAPIDS, 3, ['Coral snake']),
  A('Inland taipan', ELAPIDS, 4, ['Taipan']),
  A('Corn snake', COLUBRIDS, 2),
  A('California kingsnake', COLUBRIDS, 3, ['Kingsnake']),
  A('Common garter snake', COLUBRIDS, 2, ['Garter snake']),
  A('Green iguana', IGUANIA, 1, ['Iguana']),
  A('Marine iguana', IGUANIA, 3),
  A('Veiled chameleon', IGUANIA, 1, ['Chameleon']),
  A('Central bearded dragon', IGUANIA, 2, ['Bearded dragon']),
  A('Frilled lizard', IGUANIA, 3, ['Frill-necked lizard']),
  A('Thorny devil', IGUANIA, 4),
  A('Leopard gecko', GECKOS, 2, ['Gecko']),
  A('Tokay gecko', GECKOS, 4),
  A('Komodo dragon', ANGUI, 1),
  A('Nile monitor', ANGUI, 3, ['Monitor lizard']),
  A('Gila monster', ANGUI, 3),
  A('Slow worm', ANGUI, 4, ['Slowworm']),
  A('Blue-tongued skink', SKINKS, 3, ['Skink']),
  A('Tuatara', LEPIDO, 4),
  A('Green sea turtle', SEATURTLES, 1, ['Sea turtle', 'Turtle']),
  A('Leatherback sea turtle', SEATURTLES, 3, ['Leatherback']),
  A('Loggerhead sea turtle', SEATURTLES, 3, ['Loggerhead']),
  A('Galapagos tortoise', TORTOISES, 1, ['Tortoise', 'Giant tortoise']),
  A('Aldabra giant tortoise', TORTOISES, 4),
  A('Desert tortoise', TORTOISES, 3),
  A('Red-eared slider', EMYDIDS, 2, ['Slider turtle']),
  A('Eastern box turtle', EMYDIDS, 2, ['Box turtle']),
  A('Painted turtle', EMYDIDS, 3),
  A('Common snapping turtle', SNAPPERS, 2, ['Snapping turtle']),
  A('Alligator snapping turtle', SNAPPERS, 3),
  A('American alligator', GATORS, 1, ['Alligator', 'Gator']),
  A('Spectacled caiman', GATORS, 3, ['Caiman']),
  A('Chinese alligator', GATORS, 4),
  A('Nile crocodile', TRUECROCS, 1, ['Crocodile']),
  A('Saltwater crocodile', TRUECROCS, 2, ['Saltie']),
  A('Gharial', CROCS, 4, ['Gavial']),

  // Amphibians
  A('American bullfrog', TRUEFROGS, 1, ['Bullfrog', 'Frog']),
  A('Common frog', TRUEFROGS, 2),
  A('Wood frog', TRUEFROGS, 4),
  A('Cane toad', TOADS, 2),
  A('American toad', TOADS, 1, ['Toad']),
  A('Common toad', TOADS, 3),
  A('Red-eyed tree frog', TREEFROGS, 2),
  A('Spring peeper', TREEFROGS, 3),
  A('American green tree frog', TREEFROGS, 3, ['Tree frog', 'Green tree frog']),
  A('Golden poison frog', DARTFROGS, 3, ['Poison dart frog', 'Golden poison dart frog']),
  A('Strawberry poison-dart frog', DARTFROGS, 4, ['Strawberry poison frog']),
  A('African clawed frog', FROGS, 3),
  A('Goliath frog', FROGS, 4),
  A('Axolotl', MOLESAL, 2),
  A('Tiger salamander', MOLESAL, 3),
  A('Hellbender', GIANTSAL, 4),
  A('Chinese giant salamander', GIANTSAL, 4, ['Giant salamander']),
  A('Fire salamander', NEWTS, 3, ['Salamander']),
  A('Eastern newt', NEWTS, 3, ['Newt', 'Red-spotted newt']),
  A('Olm', PROTEIDS, 4),
  A('Mudpuppy', PROTEIDS, 4),

  // Fish
  A('Atlantic salmon', SALMON, 1, ['Salmon']),
  A('Rainbow trout', SALMON, 1, ['Trout']),
  A('Sockeye salmon', SALMON, 3),
  A('Goldfish', CARPS, 1),
  A('Common carp', CARPS, 2, ['Carp', 'Koi']),
  A('Zebrafish', CARPS, 3, ['Zebra danio']),
  A('Channel catfish', CATFISH, 1, ['Catfish']),
  A('Wels catfish', CATFISH, 4),
  A('Red-bellied piranha', CHARACINS, 1, ['Piranha']),
  A('Neon tetra', CHARACINS, 3, ['Tetra']),
  A('Electric eel', KNIFEFISH, 2),
  A('European eel', EELS, 2, ['Eel']),
  A('Green moray', EELS, 2, ['Moray eel', 'Moray']),
  A('Atlantic bluefin tuna', TUNAS, 1, ['Tuna', 'Bluefin tuna']),
  A('Atlantic mackerel', TUNAS, 3, ['Mackerel']),
  A('Swordfish', BILLFISH, 1),
  A('Atlantic sailfish', BILLFISH, 3, ['Sailfish']),
  A('Blue marlin', BILLFISH, 2, ['Marlin']),
  A('Nile tilapia', CICHLIDS, 2, ['Tilapia']),
  A('Freshwater angelfish', CICHLIDS, 3, ['Angelfish']),
  A('Oscar', CICHLIDS, 4, ['Oscar fish']),
  A('Lined seahorse', SEAHORSES, 1, ['Seahorse']),
  A('Leafy seadragon', SEAHORSES, 3, ['Sea dragon']),
  A('Atlantic halibut', FLATFISH, 2, ['Halibut']),
  A('Summer flounder', FLATFISH, 2, ['Flounder', 'Fluke']),
  A('Atlantic cod', CODS, 1, ['Cod']),
  A('Haddock', CODS, 3),
  A('Atlantic herring', HERRINGS, 2, ['Herring']),
  A('European anchovy', HERRINGS, 2, ['Anchovy']),
  A('European pilchard', HERRINGS, 3, ['Sardine', 'Pilchard']),
  A('Ocean sunfish', PUFFERS, 3, ['Mola', 'Mola mola']),
  A('Tiger puffer', PUFFERS, 2, ['Pufferfish', 'Fugu', 'Blowfish']),
  A('Humpback anglerfish', ANGLERS, 3, ['Deep-sea anglerfish']),
  A('Monkfish', ANGLERS, 3, ['Goosefish']),
  A('Ocellaris clownfish', DAMSELS, 1, ['Clownfish', 'Anemonefish']),
  A('Sergeant major', DAMSELS, 4, ['Sergeant major damselfish']),
  A('Beluga sturgeon', STURGEONS, 3, ['Sturgeon']),
  A('American paddlefish', STURGEONS, 4, ['Paddlefish']),
  A('Northern pike', PIKES, 2, ['Pike']),
  A('Muskellunge', PIKES, 3, ['Muskie']),
  A('Yellow perch', PERCHES, 2, ['Perch']),
  A('Walleye', PERCHES, 3),
  A('Largemouth bass', SUNFISH, 1, ['Bass']),
  A('Bluegill', SUNFISH, 3),
  A('Siamese fighting fish', GOURAMIS, 2, ['Betta', 'Betta fish']),
  A('Dwarf gourami', GOURAMIS, 4, ['Gourami']),
  A('Guppy', LIVEBEARERS, 2),
  A('Sailfin molly', LIVEBEARERS, 4, ['Molly']),
  A('Great white shark', SHARKS, 1, ['Shark', 'White shark']),
  A('Whale shark', SHARKS, 2),
  A('Tiger shark', SHARKS, 2),
  A('Great hammerhead', SHARKS, 2, ['Hammerhead shark', 'Hammerhead']),
  A('Bull shark', SHARKS, 3),
  A('Nurse shark', SHARKS, 3),
  A('Greenland shark', SHARKS, 4),
  A('Giant manta ray', RAYS, 2, ['Manta ray', 'Manta']),
  A('Southern stingray', RAYS, 1, ['Stingray']),
  A('Largetooth sawfish', RAYS, 3, ['Sawfish']),
  A('Coelacanth', [...LOBEFIN, 'Coelacanths'], 3),
  A('Australian lungfish', [...LOBEFIN, 'Lungfish'], 4),
  A('Sea lamprey', [...JAWLESS, 'Lampreys'], 3, ['Lamprey']),
  A('Pacific hagfish', [...JAWLESS, 'Hagfish'], 4),

  // Insects
  A('Seven-spot ladybug', BEETLES, 1, ['Ladybug', 'Ladybird']),
  A('Common eastern firefly', BEETLES, 1, ['Firefly', 'Lightning bug']),
  A('European stag beetle', BEETLES, 3, ['Stag beetle']),
  A('Sacred scarab', BEETLES, 3, ['Dung beetle', 'Scarab']),
  A('Hercules beetle', BEETLES, 4),
  A('Monarch butterfly', LEPS, 1, ['Monarch', 'Butterfly']),
  A('Painted lady', LEPS, 3),
  A('Blue morpho', LEPS, 3, ['Morpho butterfly']),
  A('Luna moth', LEPS, 2, ['Moth']),
  A('Domestic silk moth', LEPS, 2, ['Silkworm', 'Silk moth']),
  A('Atlas moth', LEPS, 4),
  A('Western honey bee', HYMENO, 1, ['Honeybee', 'Honey bee', 'Bee']),
  A('Buff-tailed bumblebee', HYMENO, 1, ['Bumblebee', 'Bumble bee']),
  A('Leafcutter ant', HYMENO, 2, ['Ant']),
  A('Red imported fire ant', HYMENO, 2, ['Fire ant']),
  A('Eastern yellowjacket', HYMENO, 2, ['Yellowjacket', 'Wasp']),
  A('Asian giant hornet', HYMENO, 3, ['Hornet', 'Murder hornet']),
  A('Housefly', FLIES, 1, ['Fly', 'House fly']),
  A('Common fruit fly', FLIES, 2, ['Fruit fly']),
  A('Yellow fever mosquito', FLIES, 1, ['Mosquito']),
  A('Desert locust', ORTHO, 2, ['Locust', 'Grasshopper']),
  A('House cricket', ORTHO, 1, ['Cricket']),
  A('Common true katydid', ORTHO, 3, ['Katydid']),
  A('Periodical cicada', BUGS, 2, ['Cicada']),
  A('Bed bug', BUGS, 2, ['Bedbug']),
  A('Pea aphid', BUGS, 3, ['Aphid']),
  A('Brown marmorated stink bug', BUGS, 3, ['Stink bug']),
  A('Common water strider', BUGS, 3, ['Water strider', 'Pond skater']),
  A('Common green darner', ODONATA, 1, ['Dragonfly', 'Green darner']),
  A('Emperor dragonfly', ODONATA, 4),
  A('American cockroach', BLATTO, 1, ['Cockroach', 'Roach']),
  A('German cockroach', BLATTO, 3),
  A('Eastern subterranean termite', BLATTO, 2, ['Termite']),
  A('European mantis', MANTISES, 1, ['Praying mantis', 'Mantis']),
  A('Chinese mantis', MANTISES, 4),
  A('Northern walkingstick', PHASMIDS, 2, ['Stick insect', 'Walking stick']),
  A('Cat flea', FLEAS, 2, ['Flea']),

  // Arachnids and horseshoe crabs
  A('Southern black widow', SPIDERS, 1, ['Black widow', 'Black widow spider']),
  A('Mexican redknee tarantula', SPIDERS, 1, ['Tarantula']),
  A('Goliath birdeater', SPIDERS, 4),
  A('Brown recluse', SPIDERS, 2, ['Brown recluse spider']),
  A('European garden spider', SPIDERS, 2, ['Garden spider', 'Spider']),
  A('Bold jumping spider', SPIDERS, 3, ['Jumping spider']),
  A('Emperor scorpion', SCORPIONS, 1, ['Scorpion']),
  A('Deathstalker', SCORPIONS, 4, ['Deathstalker scorpion']),
  A('Deer tick', TICKS, 2, ['Tick', 'Black-legged tick']),
  A('House dust mite', TICKS, 3, ['Dust mite', 'Mite']),
  A('Common harvestman', HARVEST, 3, ['Harvestman', 'Daddy longlegs']),
  A('Atlantic horseshoe crab', HORSESHOE, 2, ['Horseshoe crab']),

  // Crustaceans and myriapods
  A('American lobster', DECAPODS, 1, ['Lobster']),
  A('Blue crab', DECAPODS, 1, ['Crab']),
  A('Dungeness crab', DECAPODS, 3),
  A('Red king crab', DECAPODS, 2, ['King crab']),
  A('Caribbean hermit crab', DECAPODS, 2, ['Hermit crab']),
  A('Coconut crab', DECAPODS, 3),
  A('Atlantic sand fiddler crab', DECAPODS, 4, ['Fiddler crab']),
  A('Red swamp crayfish', DECAPODS, 2, ['Crayfish', 'Crawfish']),
  A('Whiteleg shrimp', DECAPODS, 1, ['Shrimp', 'Prawn']),
  A('Antarctic krill', KRILL, 2),
  A('Acorn barnacle', BARNACLES, 2, ['Barnacle']),
  A('Common pill bug', ISOPODS, 2, ['Pill bug', 'Roly-poly', 'Woodlouse']),
  A('Giant isopod', ISOPODS, 4),
  A('Peacock mantis shrimp', STOMATOPODS, 3, ['Mantis shrimp']),
  A('House centipede', CENTIPEDES, 2, ['Centipede']),
  A('Amazonian giant centipede', CENTIPEDES, 4, ['Giant centipede']),
  A('Giant African millipede', MILLIPEDES, 2, ['Millipede']),

  // Mollusks
  A('Giant Pacific octopus', OCTOPUSES, 2),
  A('Common octopus', OCTOPUSES, 1, ['Octopus']),
  A('Greater blue-ringed octopus', OCTOPUSES, 3, ['Blue-ringed octopus']),
  A('Giant squid', SQUID, 1),
  A('Humboldt squid', SQUID, 4, ['Jumbo squid']),
  A('Common cuttlefish', CUTTLEFISH, 3),
  A('Chambered nautilus', NAUTILUSES, 3, ['Nautilus']),
  A('Garden snail', LANDSNAILS, 1, ['Snail']),
  A('Giant African land snail', LANDSNAILS, 3),
  A('Banana slug', LANDSNAILS, 3),
  A('Leopard slug', LANDSNAILS, 3, ['Slug']),
  A('Queen conch', CONCHS, 3, ['Conch']),
  A('Eastern oyster', OYSTERS, 1, ['Oyster']),
  A('Pacific oyster', OYSTERS, 4),
  A('Blue mussel', MUSSELS, 2, ['Mussel']),
  A('Bay scallop', SCALLOPS, 2, ['Scallop']),
  A('Giant clam', COCKLES, 2),
  A('Common cockle', COCKLES, 4, ['Cockle']),

  // Echinoderms, jellyfish and worms
  A('Common starfish', SEASTARS, 1, ['Starfish', 'Sea star']),
  A('Crown-of-thorns starfish', SEASTARS, 3),
  A('Sunflower sea star', SEASTARS, 4),
  A('Common brittle star', BRITTLE, 4, ['Brittle star']),
  A('Purple sea urchin', URCHINS, 2, ['Sea urchin', 'Urchin']),
  A('Eccentric sand dollar', URCHINS, 3, ['Sand dollar']),
  A('California sea cucumber', CUCUMBERS, 3, ['Sea cucumber']),
  A('Moon jellyfish', TRUEJELLIES, 1, ['Jellyfish', 'Moon jelly']),
  A("Lion's mane jellyfish", TRUEJELLIES, 3),
  A('Sea wasp', BOXJELLIES, 3, ['Box jellyfish', 'Australian box jellyfish']),
  A("Portuguese man o' war", HYDROZOA, 2, ['Man-of-war', 'Portuguese man-of-war']),
  A('Green hydra', HYDROZOA, 4, ['Hydra']),
  A('Giant green anemone', ANEMONES, 2, ['Sea anemone', 'Anemone']),
  A('Staghorn coral', STONYCORALS, 2, ['Coral']),
  A('Grooved brain coral', STONYCORALS, 3, ['Brain coral']),
  A('Common earthworm', EARTHWORMS, 1, ['Earthworm', 'Nightcrawler', 'Worm']),
  A('Medicinal leech', LEECHES, 2, ['Leech']),
];
