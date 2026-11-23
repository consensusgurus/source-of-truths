const C = "Birds & Sea Life";
const D = (...qs) => qs.map(([t, q, a, d]) => ({ c: C, t, q, a, d }));

export const LANE_DAYS = [
  // day 1
  D([1, "Which seabird has a large throat pouch under its long bill for scooping up fish?", "Pelican", ["Albatross", "Puffin", "Tern"]],
    [2, "How many arms does an octopus have?", "Eight", ["Six", "Ten", "Twelve"]],
    [3, "Clownfish shelter among the stinging tentacles of which animals?", "Sea anemones", ["Sea urchins", "Sponges", "Sea cucumbers"]],
    [4, "Coral colonies build reefs by secreting which mineral?", "Calcium carbonate", ["Silica", "Calcium phosphate", "Chitin"]],
    [5, "Sharks, rays and skates belong to which class of fishes?", "Chondrichthyes", ["Osteichthyes", "Agnatha", "Actinopterygii"]]),
  // day 2
  D([1, "Which flightless bird of Antarctica waddles on ice and dives for fish?", "Penguin", ["Ostrich", "Kiwi", "Emu"]],
    [2, "Which bird, long a symbol of wisdom, hunts mostly at night?", "Owl", ["Hawk", "Falcon", "Heron"]],
    [3, "Which of these sea animals has no brain, no heart and no bones?", "Jellyfish", ["Octopus", "Seahorse", "Lobster"]],
    [4, "Crows, ravens, jays and magpies belong to which bird family?", "Corvidae", ["Turdidae", "Fringillidae", "Paridae"]],
    [5, "A bony fish fine-tunes its buoyancy with which gas-filled organ?", "Swim bladder", ["Gill raker", "Operculum", "Lateral line"]]),
  // day 3
  D([1, "What is a male peafowl called?", "Peacock", ["Peahen", "Cob", "Drake"]],
    [2, "Which fish is born in rivers, matures at sea, then returns to fresh water to spawn?", "Salmon", ["Tuna", "Cod", "Mackerel"]],
    [3, "Lobsters, crabs and shrimp belong to which group of animals?", "Crustaceans", ["Mollusks", "Echinoderms", "Arachnids"]],
    [4, "What gives flamingos their pink color?", "Carotenoid pigments from their food", ["Melanin in their feathers", "Iron in their blood", "Sunlight on their skin"]],
    [5, "The blue blood of an octopus owes its color to a copper-based protein called what?", "Hemocyanin", ["Hemoglobin", "Chlorophyll", "Myoglobin"]]),
  // day 4
  D([1, "Which bird, often shown carrying an olive branch, is a symbol of peace?", "Dove", ["Swan", "Sparrow", "Crow"]],
    [2, "Among seahorses, which sex is pregnant?", "The male", ["The female", "Both parents in turn", "Neither; the eggs drift free"]],
    [3, "What is the main job of a bird's crop?", "Storing food before digestion", ["Producing the voice", "Forming eggshell", "Excreting salt"]],
    [4, "Lampreys and hagfish are the living representatives of which jawless group of fishes?", "Agnatha", ["Chondrichthyes", "Teleostei", "Cephalopoda"]],
    [5, "Puffins, guillemots and razorbills belong to which family of seabirds?", "Auks", ["Gannets", "Skuas", "Petrels"]]),
  // day 5
  D([1, "Which colorful birds are famous for mimicking human speech?", "Parrots", ["Herons", "Pelicans", "Gulls"]],
    [2, "A group of fish swimming together is commonly called a what?", "School", ["Herd", "Pack", "Flock"]],
    [3, "Hermit crabs protect their soft abdomens by living in what?", "Empty shells made by other animals", ["Burrows lined with sand", "Hardened molts of their own skin", "Hollow coral heads"]],
    [4, "In mollusks, the mantle is the tissue that secretes what?", "The shell", ["The eyes", "The heart", "The foot"]],
    [5, "Wandering albatrosses and storm petrels share which bird order, named for tube-shaped nostrils?", "Procellariiformes", ["Pelecaniformes", "Charadriiformes", "Sphenisciformes"]]),
  // day 6
  D([1, "Which common pond bird is known for saying \"quack\"?", "Duck", ["Swan", "Crow", "Owl"]],
    [2, "Which bird has a strong, chisel-like bill for drilling into tree bark?", "Woodpecker", ["Kingfisher", "Hummingbird", "Wren"]],
    [3, "Which fish can swallow water and inflate its body into a ball when threatened?", "Pufferfish", ["Flounder", "Barracuda", "Eel"]],
    [4, "Octopuses and squid belong to which class of mollusks?", "Cephalopods", ["Gastropods", "Bivalves", "Chitons"]],
    [5, "On a feather, what is the name of the central shaft from which the barbs branch?", "Rachis", ["Barbule", "Vane", "Calamus"]]),
  // day 7
  D([1, "Which seabird with a bright striped bill nests in burrows and is nicknamed the \"sea parrot\"?", "Puffin", ["Gannet", "Skua", "Tern"]],
    [2, "Which tiny birds can hover and even fly backward by beating their wings in a figure-eight pattern?", "Hummingbirds", ["Swallows", "Wrens", "Finches"]],
    [3, "Both European and American eels travel to which sea to spawn?", "Sargasso Sea", ["Coral Sea", "Baltic Sea", "Caribbean Sea"]],
    [4, "A remora's suction disc is a modified version of which fin?", "Dorsal fin", ["Pectoral fin", "Pelvic fin", "Anal fin"]],
    [5, "A bird's wishbone, the furcula, is formed by the fusion of which paired bones?", "Clavicles", ["Coracoids", "Scapulae", "Ribs"]]),
  // day 8
  D([1, "Which crustacean is famous for walking sideways?", "Crab", ["Shrimp", "Lobster", "Barnacle"]],
    [2, "In folklore, which long-legged wading bird delivers babies?", "Stork", ["Crane", "Heron", "Ibis"]],
    [3, "Which bivalve can swim by clapping its two shells together?", "Scallop", ["Oyster", "Mussel", "Clam"]],
    [4, "The ampullae of Lorenzini in sharks sense what?", "Weak electric fields", ["Water temperature", "Low-frequency sound", "Chemical scents"]],
    [5, "Emperor and king penguins together make up which genus?", "Aptenodytes", ["Spheniscus", "Pygoscelis", "Eudyptes"]]),
  // day 9
  D([1, "New Zealand's flightless, nocturnal national bird with a long slender bill is the what?", "Kiwi", ["Emu", "Cassowary", "Rhea"]],
    [2, "Coral reefs are built by tiny animals called what?", "Polyps", ["Sponges", "Barnacles", "Krill"]],
    [3, "Which dark waterbird dives for fish and has been trained by fishermen in China and Japan?", "Cormorant", ["Pelican", "Heron", "Kingfisher"]],
    [4, "A young salmon that is ready to migrate from its river to the sea is called a what?", "Smolt", ["Alevin", "Fry", "Grilse"]],
    [5, "Mussels anchor themselves to rocks with strong protein threads called what?", "Byssus", ["Radula", "Mantle", "Siphon"]]),
  // day 10
  D([1, "Which bird has been used for centuries to carry messages home over long distances?", "Pigeon", ["Swallow", "Gull", "Crow"]],
    [2, "Which shark has a head shaped like a mallet?", "Hammerhead", ["Tiger shark", "Nurse shark", "Mako"]],
    [3, "Which Australian bird is known for a call that sounds like laughter?", "Kookaburra", ["Lyrebird", "Cassowary", "Galah"]],
    [4, "Which fish can survive a dry season by burrowing into mud and breathing air?", "Lungfish", ["Herring", "Sturgeon", "Pike"]],
    [5, "The pygostyle at the base of a bird's tail is a fusion of which bones?", "Tail vertebrae", ["Hip bones", "Rib cartilages", "Finger bones"]]),
  // day 11
  D([1, "Which flightless African bird is the subject of the myth that it buries its head in the sand?", "Ostrich", ["Emu", "Rhea", "Kiwi"]],
    [2, "Which fish has an upper jaw extended into a flat blade used to slash at prey?", "Swordfish", ["Marlin", "Wahoo", "Barracuda"]],
    [3, "Which seabird plunges into the sea from a height, wings folded, to catch fish off North Atlantic coasts?", "Gannet", ["Fulmar", "Skua", "Shearwater"]],
    [4, "The oil a bird uses to preen its feathers comes from which gland at the base of its tail?", "Uropygial gland", ["Salt gland", "Thymus", "Pineal gland"]],
    [5, "A cuttlefish's internal cuttlebone is made mostly of which mineral?", "Aragonite", ["Calcite", "Gypsum", "Apatite"]]),
  // day 12
  D([1, "Which fish is commonly canned and mixed with mayonnaise for sandwiches?", "Tuna", ["Cod", "Trout", "Halibut"]],
    [2, "Which raptor clutches arrows and an olive branch on the Great Seal of the United States?", "Bald eagle", ["Golden eagle", "Osprey", "Red-tailed hawk"]],
    [3, "In addition to its arms, how many long feeding tentacles does a typical squid have?", "Two", ["One", "Four", "Six"]],
    [4, "Which Antarctic bird's males balance a single egg on their feet through the winter?", "Emperor penguin", ["Adelie penguin", "Chinstrap penguin", "Gentoo penguin"]],
    [5, "Which ridge on the breastbone anchors a bird's flight muscles but is missing in ratites?", "Keel", ["Furcula", "Pygostyle", "Crop"]]),
  // day 13
  D([1, "Which birds famously fly in a V formation on long migrations?", "Geese", ["Robins", "Sparrows", "Owls"]],
    [2, "Which sea animal pushes its own stomach out through its mouth to digest a mussel inside its shell?", "Starfish", ["Sand dollar", "Sea cucumber", "Jellyfish"]],
    [3, "Small feathers that overlie the bases of a bird's flight feathers are called what?", "Coverts", ["Rectrices", "Remiges", "Down"]],
    [4, "The electric eel is biologically closer to which group of fishes than to true eels?", "Knifefishes", ["Morays", "Congers", "Pikes"]],
    [5, "What term describes birds, such as songbirds, that hatch naked and helpless and depend on their parents?", "Altricial", ["Precocial", "Nidifugous", "Oviparous"]]),
  // day 14
  D([1, "The 1975 film Jaws centers on which species of predator?", "Great white shark", ["Tiger shark", "Hammerhead shark", "Bull shark"]],
    [2, "Clams, oysters and mussels are classed as which kind of mollusk, named for their paired shells?", "Bivalves", ["Gastropods", "Cephalopods", "Chitons"]],
    [3, "Pearls are made of layers of which iridescent material, also called mother-of-pearl?", "Nacre", ["Chitin", "Keratin", "Dentine"]],
    [4, "Male satin bowerbirds decorate their display structures with objects of which favorite color?", "Blue", ["Red", "Yellow", "Green"]],
    [5, "The crustacean order Decapoda, home of crabs, lobsters and shrimp, is named for how many legs?", "Ten", ["Eight", "Twelve", "Six"]]),
  // day 15
  D([1, "A group of birds traveling or feeding together is commonly called a what?", "Flock", ["Herd", "Pack", "Swarm"]],
    [2, "Which spiny, round sea-floor animal grazes algae with a ring of five teeth?", "Sea urchin", ["Sea cucumber", "Sea sponge", "Sea squirt"]],
    [3, "True caviar comes from the roe of which fish?", "Sturgeon", ["Cod", "Tuna", "Haddock"]],
    [4, "Which of these birds feeds its chicks a nutrient-rich secretion called crop milk?", "Pigeon", ["Swallow", "Heron", "Falcon"]],
    [5, "In many fishes, the swim bladder is linked to the gut by which tube?", "Pneumatic duct", ["Ductus arteriosus", "Lateral duct", "Bile duct"]]),
  // day 16
  D([1, "Which tropical bird has an oversized, colorful bill and appears on a famous cereal box?", "Toucan", ["Macaw", "Cockatoo", "Kingfisher"]],
    [2, "How does the archerfish bring down insects perched on plants above it?", "By spitting jets of water", ["By leaping and snapping", "By stunning them with electricity", "By slapping them with its tail"]],
    [3, "Algae called zooxanthellae live inside the tissues of which animals?", "Reef-building corals", ["Oysters", "Barnacles", "Sea urchins"]],
    [4, "Which pigment-containing skin cells let cephalopods change color?", "Chromatophores", ["Nematocysts", "Photophores", "Melanosomes"]],
    [5, "The fleshy patch at the base of a hawk's upper bill, where the nostrils sit, is called the what?", "Cere", ["Crest", "Lore", "Nape"]]),
  // day 17
  D([1, "Which common seabird is known for swooping on beachgoers' snacks?", "Gull", ["Pelican", "Tern", "Cormorant"]],
    [2, "Calamari is made from which sea animal?", "Squid", ["Octopus", "Eel", "Skate"]],
    [3, "Goldfish were first domesticated in which country?", "China", ["Japan", "Korea", "India"]],
    [4, "The oilbird of South America finds its way through dark caves using what?", "Echolocation", ["Infrared vision", "Electric sense", "Magnetic fields"]],
    [5, "The tooth-like scales covering a shark's skin are called what?", "Dermal denticles", ["Scutes", "Cycloid scales", "Ganoid scales"]]),
  // day 18
  D([1, "A rooster is the male of which bird?", "Chicken", ["Turkey", "Duck", "Goose"]],
    [2, "Sea sponges are classified as what kind of living thing?", "Animals", ["Plants", "Fungi", "Algae"]],
    [3, "Which cephalopod has a coiled, chambered shell?", "Nautilus", ["Cuttlefish", "Squid", "Octopus"]],
    [4, "Parrots and woodpeckers have two toes forward and two back, an arrangement called what?", "Zygodactyly", ["Anisodactyly", "Syndactyly", "Heterodactyly"]],
    [5, "The coelacanth belongs to which group of fishes, the group that also gave rise to four-legged land animals?", "Lobe-finned fishes", ["Ray-finned fishes", "Jawless fishes", "Cartilaginous fishes"]]),
  // day 19
  D([1, "What color does a lobster turn when it is cooked?", "Red", ["Blue", "Green", "Yellow"]],
    [2, "Which large wading bird filter-feeds with a downturned bill and is often pictured standing on one leg?", "Flamingo", ["Heron", "Crane", "Egret"]],
    [3, "Which bird is known for forming huge swirling flocks called murmurations?", "Starling", ["Swift", "Sandpiper", "Swallow"]],
    [4, "Which ornamental fish, bred in Japan, is a colorful variety of carp?", "Koi", ["Guppy", "Tetra", "Betta"]],
    [5, "The tube feet of sea stars are part of which body system?", "Water vascular system", ["Lateral line system", "Gill system", "Swim bladder system"]]),
  // day 20
  D([1, "Fish take oxygen from the water using which organs?", "Gills", ["Lungs", "Fins", "Scales"]],
    [2, "New England chowder is traditionally made with which shellfish?", "Clams", ["Mussels", "Oysters", "Scallops"]],
    [3, "Which reef fish, named for its beaklike teeth, sleeps in a cocoon of mucus?", "Parrotfish", ["Angelfish", "Butterflyfish", "Wrasse"]],
    [4, "Unusually for a bird, the common swift can eat, mate and even sleep while doing what?", "Flying", ["Swimming", "Perching", "Diving"]],
    [5, "The feather-shaped internal support of a squid is called what?", "Gladius", ["Cuttlebone", "Radula", "Statolith"]]),
  // day 21
  D([1, "In the song The Twelve Days of Christmas, which bird is given on the first day?", "Partridge", ["Turtle dove", "French hen", "Goose"]],
    [2, "Which large flightless bird appears beside the kangaroo on Australia's coat of arms?", "Emu", ["Cassowary", "Ostrich", "Kiwi"]],
    [3, "Which deep-sea fish dangles a glowing lure from its head?", "Anglerfish", ["Oarfish", "Hagfish", "Remora"]],
    [4, "Jellyfish, corals and sea anemones belong to which phylum?", "Cnidaria", ["Porifera", "Mollusca", "Echinodermata"]],
    [5, "What term describes a bird's habit of returning to breed at or near where it hatched?", "Philopatry", ["Imprinting", "Fledging", "Lekking"]]),
  // day 22
  D([1, "What do ducks have between their toes that helps them paddle?", "Webbing", ["Spurs", "Talons", "Scales"]],
    [2, "Barnacles, which cling to rocks and boat hulls, are actually which kind of animal?", "Crustaceans", ["Mollusks", "Sponges", "Corals"]],
    [3, "Which diving bird of northern lakes is known for its eerie, wailing call?", "Loon", ["Grebe", "Coot", "Merganser"]],
    [4, "Horseshoe crabs are more closely related to which animals than to true crabs?", "Spiders", ["Shrimp", "Barnacles", "Lobsters"]],
    [5, "The small tuft of feathers on a bird's wing \"thumb\" that helps prevent stalling at low speed is called the what?", "Alula", ["Tertial", "Scapular", "Remex"]]),
];
