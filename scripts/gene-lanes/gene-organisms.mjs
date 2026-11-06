// Gene (Life Science), lane 'Animals & Plants': animals, plants and fungi, ecosystems, habitats, migration.
// APPEND SEGMENT: 27 days x 5 tiers, live 2026-12-05 to 2026-12-31 (bank days 37..63).
// gen-science.mjs appends whatever days these lanes carry, so the lane files hold
// only the newest segment; days 1..36 (2026-10-30 to 2026-12-04) are frozen in
// app/gene/questions.js and in git history (commit 1260977a). Written 2026-11-06.
export const LANE_DAYS = [
  // day 1 (2026-12-05)
  [
    { c: "Animals & Plants", t: 1, q: "Which shaggy, humped animal, named the US national mammal in 2016, once roamed the Great Plains in huge herds?", a: "Bison", d: ["Moose", "Elk", "Musk ox"] },
    { c: "Animals & Plants", t: 2, q: "Which burrowing rodents of the Great Plains live in huge colonies called towns?", a: "Prairie dogs", d: ["Gophers", "Chipmunks", "Meerkats"] },
    { c: "Animals & Plants", t: 3, q: "Which big cat cannot fully pull in its claws, giving it extra grip when it sprints?", a: "Cheetah", d: ["Leopard", "Jaguar", "Lynx"] },
    { c: "Animals & Plants", t: 4, q: "What is the see-through third eyelid that sweeps across the eyes of birds and some sharks called?", a: "Nictitating membrane", d: ["Tapetum lucidum", "Conjunctiva", "Sclera"] },
    { c: "Animals & Plants", t: 5, q: "What waxy band in the walls of a root's endodermis forces water to pass through the cells themselves?", a: "Casparian strip", d: ["Hartig net", "Middle lamella", "Pericycle"] },
  ],
  // day 2 (2026-12-06)
  [
    { c: "Animals & Plants", t: 1, q: "What is the nut of an oak tree called?", a: "Acorn", d: ["Chestnut", "Walnut", "Hazelnut"] },
    { c: "Animals & Plants", t: 2, q: "What is another common name for the woodchuck?", a: "Groundhog", d: ["Gopher", "Muskrat", "Chipmunk"] },
    { c: "Animals & Plants", t: 3, q: "Which forest animal of Congo, with zebra-striped legs, is the giraffe's closest living relative?", a: "Okapi", d: ["Bongo", "Tapir", "Kudu"] },
    { c: "Animals & Plants", t: 4, q: "What are the organs at the tip of a spider's abdomen that produce silk?", a: "Spinnerets", d: ["Pedipalps", "Chelicerae", "Book lungs"] },
    { c: "Animals & Plants", t: 5, q: "What are the small knobbed organs, evolved from hind wings, that help true flies balance in flight?", a: "Halteres", d: ["Elytra", "Cerci", "Tegmina"] },
  ],
  // day 3 (2026-12-07)
  [
    { c: "Animals & Plants", t: 1, q: "Maple syrup is made by boiling down what?", a: "Tree sap", d: ["Flower nectar", "Tree bark", "Fallen leaves"] },
    { c: "Animals & Plants", t: 2, q: "Unlike most monkeys, what do apes such as gorillas and chimpanzees lack?", a: "A tail", d: ["Thumbs", "Fingernails", "Color vision"] },
    { c: "Animals & Plants", t: 3, q: "Which Australian bird is famous for mimicking sounds like camera shutters and chainsaws?", a: "Lyrebird", d: ["Kookaburra", "Emu", "Galah"] },
    { c: "Animals & Plants", t: 4, q: "Which marine mammal is a classic keystone species because it eats the sea urchins that would otherwise destroy kelp forests?", a: "Sea otter", d: ["Harbor seal", "Sea lion", "Manatee"] },
    { c: "Animals & Plants", t: 5, q: "What are the many tiny units that make up an insect's compound eye called?", a: "Ommatidia", d: ["Ocelli", "Statocysts", "Sensilla"] },
  ],
  // day 4 (2026-12-08)
  [
    { c: "Animals & Plants", t: 1, q: "Which white bird, often shown with an olive branch in its beak, is a symbol of peace?", a: "Dove", d: ["Swan", "Gull", "Stork"] },
    { c: "Animals & Plants", t: 2, q: "What is a mature male gorilla, named for the gray hair on its back, called?", a: "Silverback", d: ["Graybeard", "Alpha", "Blackback"] },
    { c: "Animals & Plants", t: 3, q: "Which Central American lizard is nicknamed the 'Jesus Christ lizard' for sprinting across water?", a: "Basilisk", d: ["Frilled lizard", "Anole", "Skink"] },
    { c: "Animals & Plants", t: 4, q: "What is the large ridge on a flying bird's breastbone, where its flight muscles attach, called?", a: "Keel", d: ["Pygostyle", "Coracoid", "Synsacrum"] },
    { c: "Animals & Plants", t: 5, q: "What are a spider's fang-bearing mouthparts called?", a: "Chelicerae", d: ["Pedipalps", "Mandibles", "Maxillae"] },
  ],
  // day 5 (2026-12-09)
  [
    { c: "Animals & Plants", t: 1, q: "What is a baby pig called?", a: "Piglet", d: ["Calf", "Cub", "Kid"] },
    { c: "Animals & Plants", t: 2, q: "Lemurs are native to which island?", a: "Madagascar", d: ["Borneo", "Sri Lanka", "New Guinea"] },
    { c: "Animals & Plants", t: 3, q: "Despite its great length, how many vertebrae are in a giraffe's neck?", a: "Seven", d: ["Twelve", "Nineteen", "Twenty-six"] },
    { c: "Animals & Plants", t: 4, q: "What is the dark, dead, hard wood at the center of a tree trunk called?", a: "Heartwood", d: ["Sapwood", "Bark", "Phloem"] },
    { c: "Animals & Plants", t: 5, q: "What is a plant's growth response to touch, as when a climbing stem coils around a stake, called?", a: "Thigmotropism", d: ["Phototropism", "Hydrotropism", "Geotropism"] },
  ],
  // day 6 (2026-12-10)
  [
    { c: "Animals & Plants", t: 1, q: "What is a large, buzzing group of flying insects, such as bees, called?", a: "Swarm", d: ["Herd", "Pod", "Pride"] },
    { c: "Animals & Plants", t: 2, q: "What are the sharp, hooked claws of an eagle or an owl called?", a: "Talons", d: ["Hackles", "Spurs", "Pinions"] },
    { c: "Animals & Plants", t: 3, q: "In what unit is a horse's height traditionally measured?", a: "Hands", d: ["Spans", "Cubits", "Rods"] },
    { c: "Animals & Plants", t: 4, q: "Which whale produces ambergris, a waxy substance once prized in perfume?", a: "Sperm whale", d: ["Humpback whale", "Blue whale", "Minke whale"] },
    { c: "Animals & Plants", t: 5, q: "What are the small raised pores in the bark of trees like birch and cherry that let gases pass in and out?", a: "Lenticels", d: ["Stomata", "Hydathodes", "Nectaries"] },
  ],
  // day 7 (2026-12-11)
  [
    { c: "Animals & Plants", t: 1, q: "Which cup-shaped spring flower, grown from a bulb, is a famous symbol of the Netherlands?", a: "Tulip", d: ["Rose", "Orchid", "Sunflower"] },
    { c: "Animals & Plants", t: 2, q: "What is a baby goose called?", a: "Gosling", d: ["Cygnet", "Duckling", "Poult"] },
    { c: "Animals & Plants", t: 3, q: "Which fast-growing Asian vine, nicknamed 'the vine that ate the South', smothers trees across the southeastern US?", a: "Kudzu", d: ["English ivy", "Wisteria", "Bindweed"] },
    { c: "Animals & Plants", t: 4, q: "Which fleet-footed animal of the American West is often called an antelope but is the last survivor of its own family?", a: "Pronghorn", d: ["Mule deer", "Bighorn sheep", "Mountain goat"] },
    { c: "Animals & Plants", t: 5, q: "What is the shedding of leaves at a special weak layer at the base of each leaf stalk called?", a: "Abscission", d: ["Dehiscence", "Exfoliation", "Etiolation"] },
  ],
  // day 8 (2026-12-12)
  [
    { c: "Animals & Plants", t: 1, q: "Which all-black bird, known for its harsh 'caw', is famous for its cleverness?", a: "Crow", d: ["Robin", "Sparrow", "Blue jay"] },
    { c: "Animals & Plants", t: 2, q: "Which orange pet fish was bred in ancient China from a kind of carp?", a: "Goldfish", d: ["Guppy", "Betta", "Tetra"] },
    { c: "Animals & Plants", t: 3, q: "In which penguin species does the father balance the egg on his feet through the dark Antarctic winter?", a: "Emperor penguin", d: ["Adelie penguin", "Chinstrap penguin", "Gentoo penguin"] },
    { c: "Animals & Plants", t: 4, q: "Which great ape, found only south of the Congo River, is as close a relative of humans as the chimpanzee is?", a: "Bonobo", d: ["Orangutan", "Gorilla", "Gibbon"] },
    { c: "Animals & Plants", t: 5, q: "What is the winter dormancy of reptiles, such as snakes and turtles, called?", a: "Brumation", d: ["Diapause", "Estivation", "Ecdysis"] },
  ],
  // day 9 (2026-12-13)
  [
    { c: "Animals & Plants", t: 1, q: "What sticky, silky trap do many spiders spin to catch insects?", a: "Web", d: ["Hive", "Nest", "Burrow"] },
    { c: "Animals & Plants", t: 2, q: "What thick layer of fat under the skin keeps whales and seals warm?", a: "Blubber", d: ["Ambergris", "Lanolin", "Tallow"] },
    { c: "Animals & Plants", t: 3, q: "Eastern North America's migrating monarch butterflies spend the winter in the mountain forests of which country?", a: "Mexico", d: ["Guatemala", "Brazil", "Cuba"] },
    { c: "Animals & Plants", t: 4, q: "Which North American mammal has a ring of 22 fleshy, pink tentacles around the tip of its snout?", a: "Star-nosed mole", d: ["Desman", "Solenodon", "Elephant shrew"] },
    { c: "Animals & Plants", t: 5, q: "What are the harpoon-like stinging capsules fired by jellyfish called?", a: "Nematocysts", d: ["Statocysts", "Spicules", "Ocelli"] },
  ],
  // day 10 (2026-12-14)
  [
    { c: "Animals & Plants", t: 1, q: "Which orange-and-white striped fish lives safely among the stinging tentacles of sea anemones?", a: "Clownfish", d: ["Goldfish", "Angelfish", "Pufferfish"] },
    { c: "Animals & Plants", t: 2, q: "Which giant brown seaweed forms underwater forests along cool coasts?", a: "Kelp", d: ["Sea grass", "Coral", "Plankton"] },
    { c: "Animals & Plants", t: 3, q: "Which large flightless bird of New Guinea and northern Australia wears a tall, helmet-like casque on its head?", a: "Cassowary", d: ["Emu", "Rhea", "Ostrich"] },
    { c: "Animals & Plants", t: 4, q: "What is the oldest female who leads an elephant family group called?", a: "Matriarch", d: ["Dowager", "Doyenne", "Duchess"] },
    { c: "Animals & Plants", t: 5, q: "What is the sieve plate on a sea star's upper side that lets seawater into its water vascular system?", a: "Madreporite", d: ["Aristotle's lantern", "Pedicellaria", "Ambulacrum"] },
  ],
  // day 11 (2026-12-15)
  [
    { c: "Animals & Plants", t: 1, q: "Which yellow lawn flower turns into a fluffy white ball of seeds?", a: "Dandelion", d: ["Buttercup", "Daisy", "Marigold"] },
    { c: "Animals & Plants", t: 2, q: "What are the tiny plants and animals that drift in huge numbers near the ocean surface called?", a: "Plankton", d: ["Coral", "Barnacles", "Sponges"] },
    { c: "Animals & Plants", t: 3, q: "Which big cat of the Americas has rosettes with small spots inside them, unlike a leopard's?", a: "Jaguar", d: ["Cougar", "Lynx", "Bobcat"] },
    { c: "Animals & Plants", t: 4, q: "Despite their doglike looks, hyenas are more closely related to which animals?", a: "Cats", d: ["Bears", "Weasels", "Seals"] },
    { c: "Animals & Plants", t: 5, q: "What term describes fish, like salmon, that hatch in fresh water, live at sea and return to rivers to spawn?", a: "Anadromous", d: ["Catadromous", "Potamodromous", "Oceanodromous"] },
  ],
  // day 12 (2026-12-16)
  [
    { c: "Animals & Plants", t: 1, q: "Which warty, dry-skinned amphibian is often found in gardens eating slugs and insects?", a: "Toad", d: ["Newt", "Salamander", "Gecko"] },
    { c: "Animals & Plants", t: 2, q: "Which small African mongoose stands up on its hind legs to keep watch for danger?", a: "Meerkat", d: ["Lemur", "Dik-dik", "Hyrax"] },
    { c: "Animals & Plants", t: 3, q: "Which African burrowing mammal, which feeds on ants and termites, has a name meaning 'earth pig'?", a: "Aardvark", d: ["Anteater", "Pangolin", "Warthog"] },
    { c: "Animals & Plants", t: 4, q: "Which fish knocks insects off overhanging leaves by spitting jets of water at them?", a: "Archerfish", d: ["Mudskipper", "Pufferfish", "Butterflyfish"] },
    { c: "Animals & Plants", t: 5, q: "What term describes animals, like moles and wombats, that are adapted for digging and living underground?", a: "Fossorial", d: ["Arboreal", "Cursorial", "Volant"] },
  ],
  // day 13 (2026-12-17)
  [
    { c: "Animals & Plants", t: 1, q: "Which small plant is said to bring good luck when found with four leaves instead of three?", a: "Clover", d: ["Ivy", "Mint", "Fern"] },
    { c: "Animals & Plants", t: 2, q: "Which bearded antelope makes a huge yearly migration across the Serengeti and the Masai Mara?", a: "Wildebeest", d: ["Impala", "Kudu", "Eland"] },
    { c: "Animals & Plants", t: 3, q: "Which large African monkey is famous for the bright red and blue on the male's face?", a: "Mandrill", d: ["Gibbon", "Macaque", "Colobus"] },
    { c: "Animals & Plants", t: 4, q: "Which kind of light, invisible to us, shows bees the 'nectar guides' that lead them into many flowers?", a: "Ultraviolet", d: ["Infrared", "Microwave", "X-ray"] },
    { c: "Animals & Plants", t: 5, q: "What is it called when a plant, like the black walnut, releases chemicals that stunt the plants around it?", a: "Allelopathy", d: ["Commensalism", "Apomixis", "Mutualism"] },
  ],
  // day 14 (2026-12-18)
  [
    { c: "Animals & Plants", t: 1, q: "Which fish is named for the long, whisker-like barbels around its mouth?", a: "Catfish", d: ["Swordfish", "Dogfish", "Parrotfish"] },
    { c: "Animals & Plants", t: 2, q: "Which Australian bird is famous for a call that sounds like loud laughter?", a: "Kookaburra", d: ["Cockatoo", "Emu", "Galah"] },
    { c: "Animals & Plants", t: 3, q: "Which Central and South American monkey's loud calls can be heard miles away through the forest?", a: "Howler monkey", d: ["Spider monkey", "Capuchin", "Squirrel monkey"] },
    { c: "Animals & Plants", t: 4, q: "In many turtles, what decides whether an egg hatches as a male or a female?", a: "Nest temperature", d: ["The moon's phase", "The egg's size", "The mother's age"] },
    { c: "Animals & Plants", t: 5, q: "Which pigments give red maple and sumac leaves their red and purple fall colors?", a: "Anthocyanins", d: ["Carotenoids", "Xanthophylls", "Chlorophylls"] },
  ],
  // day 15 (2026-12-19)
  [
    { c: "Animals & Plants", t: 1, q: "Which flightless seabirds of the Southern Hemisphere use their wings as flippers to 'fly' underwater?", a: "Penguins", d: ["Puffins", "Gannets", "Pelicans"] },
    { c: "Animals & Plants", t: 2, q: "Which snarling, black, dog-sized marsupial is known for its powerful bite and eerie screeches?", a: "Tasmanian devil", d: ["Wombat", "Quoll", "Numbat"] },
    { c: "Animals & Plants", t: 3, q: "Which small, smiling-faced marsupial is famous on Western Australia's Rottnest Island?", a: "Quokka", d: ["Bilby", "Numbat", "Potoroo"] },
    { c: "Animals & Plants", t: 4, q: "Which shellfish has dozens of tiny blue eyes lining the edge of its shell?", a: "Scallop", d: ["Oyster", "Clam", "Mussel"] },
    { c: "Animals & Plants", t: 5, q: "What is the dark-above, pale-below coloring of sharks and penguins that hides them from both above and below called?", a: "Countershading", d: ["Disruptive coloration", "Aposematism", "Melanism"] },
  ],
  // day 16 (2026-12-20)
  [
    { c: "Animals & Plants", t: 1, q: "Which night-flying cousin of the butterfly is famously drawn to bright lights?", a: "Moth", d: ["Wasp", "Beetle", "Dragonfly"] },
    { c: "Animals & Plants", t: 2, q: "Which insect holds its spiny front legs folded as if in prayer?", a: "Praying mantis", d: ["Stick insect", "Katydid", "Cicada"] },
    { c: "Animals & Plants", t: 3, q: "Which huge vulture of the American West was saved from extinction when its last wild birds were taken into captivity in 1987?", a: "California condor", d: ["Andean condor", "Turkey vulture", "Bald eagle"] },
    { c: "Animals & Plants", t: 4, q: "Peaches, cherries and olives, with a hard stone around the seed, are what kind of fruit?", a: "Drupes", d: ["Pomes", "Berries", "Legumes"] },
    { c: "Animals & Plants", t: 5, q: "What term describes species, like honeybees and termites, with a breeding queen and many sterile workers?", a: "Eusocial", d: ["Gregarious", "Solitary", "Territorial"] },
  ],
  // day 17 (2026-12-21)
  [
    { c: "Animals & Plants", t: 1, q: "Which evergreen shrub with prickly leaves and red berries is a classic Christmas decoration?", a: "Holly", d: ["Ivy", "Laurel", "Boxwood"] },
    { c: "Animals & Plants", t: 2, q: "Which tiny, wingless insect lives on cats and dogs, drinks blood and can jump huge distances?", a: "Flea", d: ["Tick", "Louse", "Mite"] },
    { c: "Animals & Plants", t: 3, q: "Which fast-running bird of the US Southwest is actually a member of the cuckoo family?", a: "Roadrunner", d: ["Quail", "Killdeer", "Prairie chicken"] },
    { c: "Animals & Plants", t: 4, q: "Which cat-like predator of Madagascar, a relative of the mongoose, hunts lemurs?", a: "Fossa", d: ["Ocelot", "Caracal", "Margay"] },
    { c: "Animals & Plants", t: 5, q: "What is the making of sound by rubbing body parts together, as crickets do with their wings, called?", a: "Stridulation", d: ["Phonation", "Echolocation", "Ululation"] },
  ],
  // day 18 (2026-12-22)
  [
    { c: "Animals & Plants", t: 1, q: "Which shelled sea creature with big pincers is famous for walking sideways?", a: "Crab", d: ["Shrimp", "Lobster", "Starfish"] },
    { c: "Animals & Plants", t: 2, q: "Which insect rolls balls of animal waste to eat and to lay its eggs in?", a: "Dung beetle", d: ["Ladybug", "Firefly", "Weevil"] },
    { c: "Animals & Plants", t: 3, q: "Which large reptile lives in the wild only in the southeastern United States and eastern China?", a: "Alligator", d: ["Crocodile", "Caiman", "Gharial"] },
    { c: "Animals & Plants", t: 4, q: "Black, green and white tea all come from the leaves of one species in which plant genus?", a: "Camellia", d: ["Ilex", "Coffea", "Mentha"] },
    { c: "Animals & Plants", t: 5, q: "Which group of legless, burrowing amphibians looks much like earthworms or snakes?", a: "Caecilians", d: ["Amphisbaenians", "Blind snakes", "Hagfish"] },
  ],
  // day 19 (2026-12-23)
  [
    { c: "Animals & Plants", t: 1, q: "Which small, nearly blind mammal digs tunnels underground with its big front paws?", a: "Mole", d: ["Rabbit", "Hamster", "Squirrel"] },
    { c: "Animals & Plants", t: 2, q: "Which sacred water flower, a symbol in Hinduism and Buddhism, rises clean from muddy ponds?", a: "Lotus", d: ["Orchid", "Jasmine", "Marigold"] },
    { c: "Animals & Plants", t: 3, q: "Which insect spends months or years underwater as a nymph, then lives only a day or so as a winged adult?", a: "Mayfly", d: ["Dragonfly", "Caddisfly", "Damselfly"] },
    { c: "Animals & Plants", t: 4, q: "What is a plant's growth in response to gravity, such as roots growing downward, called?", a: "Gravitropism", d: ["Phototropism", "Hydrotropism", "Thigmotropism"] },
    { c: "Animals & Plants", t: 5, q: "What are the pigment-filled skin cells that let octopuses change color in an instant?", a: "Chromatophores", d: ["Melanosomes", "Photophores", "Statocysts"] },
  ],
  // day 20 (2026-12-24)
  [
    { c: "Animals & Plants", t: 1, q: "Which big waterbirds are famous for honking as they fly south in a V-shaped formation?", a: "Geese", d: ["Owls", "Parrots", "Pigeons"] },
    { c: "Animals & Plants", t: 2, q: "Which weedy plant is covered in tiny hairs that inject an itchy, burning sting?", a: "Stinging nettle", d: ["Poison ivy", "Thistle", "Dock"] },
    { c: "Animals & Plants", t: 3, q: "What are the curly, threadlike shoots that climbing plants like peas wrap around supports?", a: "Tendrils", d: ["Runners", "Rhizomes", "Suckers"] },
    { c: "Animals & Plants", t: 4, q: "What is the young of an insect like a grasshopper, which looks like a small wingless adult, called?", a: "Nymph", d: ["Larva", "Pupa", "Imago"] },
    { c: "Animals & Plants", t: 5, q: "What term describes animals, like the king cobra, that feed mainly on other snakes?", a: "Ophiophagous", d: ["Myrmecophagous", "Piscivorous", "Insectivorous"] },
  ],
  // day 21 (2026-12-25)
  [
    { c: "Animals & Plants", t: 1, q: "Which plant with white berries do people traditionally kiss under at Christmas?", a: "Mistletoe", d: ["Holly", "Ivy", "Poinsettia"] },
    { c: "Animals & Plants", t: 2, q: "Which plant's fluffy seed fibers are spun into thread for T-shirts and jeans?", a: "Cotton", d: ["Flax", "Hemp", "Jute"] },
    { c: "Animals & Plants", t: 3, q: "What name is given to the group of mammals that lay eggs?", a: "Monotremes", d: ["Marsupials", "Placentals", "Ungulates"] },
    { c: "Animals & Plants", t: 4, q: "What is the term for clear differences in size or looks between the males and females of a species?", a: "Sexual dimorphism", d: ["Mimicry", "Neoteny", "Hybridization"] },
    { c: "Animals & Plants", t: 5, q: "Which insect is the only pollinator of the Joshua tree, laying its eggs inside the flowers?", a: "Yucca moth", d: ["Hawk moth", "Fig wasp", "Bumblebee"] },
  ],
  // day 22 (2026-12-26)
  [
    { c: "Animals & Plants", t: 1, q: "Which wild dog with a bushy tail and a reddish-orange coat is famous in fables for being sly?", a: "Red fox", d: ["Coyote", "Gray wolf", "Jackal"] },
    { c: "Animals & Plants", t: 2, q: "What is the wormlike young stage of an insect, like a grub or a caterpillar, called?", a: "Larva", d: ["Nymph", "Pupa", "Imago"] },
    { c: "Animals & Plants", t: 3, q: "Which sharp-toothed South American river fish is famous for feeding in frenzied groups?", a: "Piranha", d: ["Barracuda", "Pike", "Arowana"] },
    { c: "Animals & Plants", t: 4, q: "What are the chemical signals that animals like ants and moths release to communicate with their own species?", a: "Pheromones", d: ["Hormones", "Enzymes", "Toxins"] },
    { c: "Animals & Plants", t: 5, q: "The nine-banded armadillo usually gives birth to what?", a: "Identical quadruplets", d: ["A single pup", "Fraternal twins", "A litter of eight"] },
  ],
  // day 23 (2026-12-27)
  [
    { c: "Animals & Plants", t: 1, q: "Which slimy garden creature tunnels through the soil and comes up to the surface when it rains?", a: "Earthworm", d: ["Snail", "Slug", "Centipede"] },
    { c: "Animals & Plants", t: 2, q: "What are the two feelers on an insect's head called?", a: "Antennae", d: ["Mandibles", "Palps", "Tentacles"] },
    { c: "Animals & Plants", t: 3, q: "What is a camel with one hump called?", a: "Dromedary", d: ["Bactrian", "Guanaco", "Vicuna"] },
    { c: "Animals & Plants", t: 4, q: "How does a sea star eat a clam once it has pried the shell open a crack?", a: "It pushes its stomach inside", d: ["It crushes it with its teeth", "It injects it with venom", "It sucks it out through a tube"] },
    { c: "Animals & Plants", t: 5, q: "What is it called when bumblebees vibrate flowers like tomatoes and blueberries to shake loose their pollen?", a: "Buzz pollination", d: ["Wind pollination", "Hand pollination", "Water pollination"] },
  ],
  // day 24 (2026-12-28)
  [
    { c: "Animals & Plants", t: 1, q: "Which playful, web-footed mammal of rivers and coasts eats fish and loves to slide down muddy banks?", a: "Otter", d: ["Beaver", "Muskrat", "Mink"] },
    { c: "Animals & Plants", t: 2, q: "What is an animal that hunts and kills other animals for food called?", a: "Predator", d: ["Scavenger", "Parasite", "Herbivore"] },
    { c: "Animals & Plants", t: 3, q: "Which tropical bird has a huge curved bill topped by a hollow casque, with the nesting female sealed inside a tree hole?", a: "Hornbill", d: ["Toucan", "Kingfisher", "Hoopoe"] },
    { c: "Animals & Plants", t: 4, q: "What is the rapid early learning by which newly hatched ducklings bond with the first moving thing they see?", a: "Imprinting", d: ["Conditioning", "Habituation", "Instinct"] },
    { c: "Animals & Plants", t: 5, q: "Apples and pears, whose flesh grows from the flower's base around a papery core, are what kind of fruit?", a: "Pomes", d: ["Drupes", "Berries", "Achenes"] },
  ],
  // day 25 (2026-12-29)
  [
    { c: "Animals & Plants", t: 1, q: "Which songbird with a red-orange breast is a classic sign of spring in North America?", a: "Robin", d: ["Cardinal", "Blue jay", "Goldfinch"] },
    { c: "Animals & Plants", t: 2, q: "Which shaggy, long-haired ox is herded high in the Himalayas and Tibet?", a: "Yak", d: ["Bison", "Musk ox", "Water buffalo"] },
    { c: "Animals & Plants", t: 3, q: "Which smaller cousin of the llama is raised in the Andes mainly for its soft fleece?", a: "Alpaca", d: ["Guanaco", "Angora goat", "Merino sheep"] },
    { c: "Animals & Plants", t: 4, q: "What is the largest chamber of a cow's stomach, where microbes ferment grass, called?", a: "Rumen", d: ["Abomasum", "Omasum", "Reticulum"] },
    { c: "Animals & Plants", t: 5, q: "What gives a beaver's front teeth their orange color?", a: "Iron in the enamel", d: ["Tannins from bark", "Copper in the dentin", "Stains from mud"] },
  ],
  // day 26 (2026-12-30)
  [
    { c: "Animals & Plants", t: 1, q: "Which woolly South American animal, a relative of the camel, is used as a pack animal in the Andes?", a: "Llama", d: ["Yak", "Ibex", "Goat"] },
    { c: "Animals & Plants", t: 2, q: "What do we call a series of who-eats-whom links, such as grass to rabbit to fox?", a: "Food chain", d: ["Life cycle", "Water cycle", "Gene pool"] },
    { c: "Animals & Plants", t: 3, q: "What special food, fed by worker bees, makes a honeybee larva grow into a queen?", a: "Royal jelly", d: ["Nectar", "Beeswax", "Propolis"] },
    { c: "Animals & Plants", t: 4, q: "Which carnivorous bog plant traps insects with sticky, glistening droplets on hair-tipped leaves?", a: "Sundew", d: ["Pitcher plant", "Bladderwort", "Venus flytrap"] },
    { c: "Animals & Plants", t: 5, q: "What is seed dispersal by ants, which carry off seeds for their fatty attachments, called?", a: "Myrmecochory", d: ["Anemochory", "Hydrochory", "Ornithochory"] },
  ],
  // day 27 (2026-12-31)
  [
    { c: "Animals & Plants", t: 1, q: "Which reptile crawls up sandy beaches at night to bury its eggs, then returns to the ocean?", a: "Sea turtle", d: ["Crocodile", "Komodo dragon", "Tortoise"] },
    { c: "Animals & Plants", t: 2, q: "Which large green lizard, with a row of spines down its back, basks in the trees of Central and South America?", a: "Iguana", d: ["Gecko", "Chameleon", "Gila monster"] },
    { c: "Animals & Plants", t: 3, q: "Which large amphibian, brought to Australia in 1935 to eat beetles in sugar fields, became a notorious invasive pest?", a: "Cane toad", d: ["Bullfrog", "Tree frog", "Mudpuppy"] },
    { c: "Animals & Plants", t: 4, q: "Where does a male platypus carry its venom?", a: "Spurs on its hind legs", d: ["Glands in its bill", "Fangs in its mouth", "Spines on its tail"] },
    { c: "Animals & Plants", t: 5, q: "What is the fleshy red cup around a yew seed called?", a: "Aril", d: ["Calyx", "Bract", "Pericarp"] },
  ],
];
