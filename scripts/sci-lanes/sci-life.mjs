// Sci lane: Life Science. Animals, plants, fungi and microbes, behavior,
// ecosystems, classification, evolution, genetics, and the naturalists and
// biologists behind them. Not the human body or medicine, not chemistry.
const c = 'Life Science';
export const LANE_DAYS = [
  // day 1
  [
    { c, t: 1, q: 'What substance do honeybees build their honeycomb from?', a: 'Beeswax', d: ['Pollen', 'Royal jelly', 'Clay'] },
    { c, t: 2, q: 'What is a scientist who studies plants called?', a: 'Botanist', d: ['Zoologist', 'Geologist', 'Ornithologist'] },
    { c, t: 3, q: 'Which spore-bearing plants unroll their new fronds from coiled fiddleheads?', a: 'Ferns', d: ['Mosses', 'Cycads', 'Conifers'] },
    { c, t: 4, q: 'The endosymbiotic theory holds that mitochondria descended from what kind of organism?', a: 'Bacteria', d: ['Viruses', 'Fungi', 'Protozoa'] },
    { c, t: 5, q: 'Which Danish botanist coined the word "gene" in 1909?', a: 'Wilhelm Johannsen', d: ['William Bateson', 'Hugo de Vries', 'Carl Correns'] },
  ],
  // day 2
  [
    { c, t: 1, q: 'What is a baby cow called?', a: 'Calf', d: ['Foal', 'Kid', 'Lamb'] },
    { c, t: 2, q: 'What do we call animals that have a backbone?', a: 'Vertebrates', d: ['Invertebrates', 'Arthropods', 'Mollusks'] },
    { c, t: 3, q: 'Which part of a flower receives pollen during pollination?', a: 'Stigma', d: ['Anther', 'Sepal', 'Filament'] },
    { c, t: 4, q: 'What are the tiny pores on a leaf that let carbon dioxide in and water vapor out?', a: 'Stomata', d: ['Lenticels', 'Trichomes', 'Hydathodes'] },
    { c, t: 5, q: 'Which Austrian zoologist decoded the waggle dance of honeybees and shared a 1973 Nobel Prize?', a: 'Karl von Frisch', d: ['Konrad Lorenz', 'Nikolaas Tinbergen', 'Jean-Henri Fabre'] },
  ],
  // day 3
  [
    { c, t: 1, q: 'What animal does a tadpole grow into?', a: 'Frog', d: ['Lizard', 'Snake', 'Turtle'] },
    { c, t: 2, q: 'Spiders, scorpions and ticks all belong to which group of animals?', a: 'Arachnids', d: ['Insects', 'Crustaceans', 'Myriapods'] },
    { c, t: 3, q: 'What kind of relationship benefits one species while leaving the other unaffected?', a: 'Commensalism', d: ['Mutualism', 'Parasitism', 'Predation'] },
    { c, t: 4, q: 'Which molecule carries amino acids to the ribosome during protein synthesis?', a: 'Transfer RNA', d: ['Messenger RNA', 'Ribosomal RNA', 'DNA polymerase'] },
    { c, t: 5, q: 'What name is given to the boundary between the animals of Asia and Australasia that runs between Bali and Lombok?', a: 'Wallace Line', d: ['Weber Line', 'Lydekker Line', 'Sunda Line'] },
  ],
  // day 4
  [
    { c, t: 1, q: 'What plant makes up almost all of a giant panda\'s diet?', a: 'Bamboo', d: ['Eucalyptus', 'Grass', 'Pine needles'] },
    { c, t: 2, q: 'Which gas do green plants give off into the air as they make their food?', a: 'Oxygen', d: ['Carbon dioxide', 'Nitrogen', 'Methane'] },
    { c, t: 3, q: 'Which Austrian scientist showed that newly hatched goslings imprint on the first moving thing they see?', a: 'Konrad Lorenz', d: ['Nikolaas Tinbergen', 'Karl von Frisch', 'B. F. Skinner'] },
    { c, t: 4, q: 'During which stage of meiosis does crossing over between chromosomes take place?', a: 'Prophase I', d: ['Metaphase I', 'Anaphase II', 'Telophase I'] },
    { c, t: 5, q: 'Which Soviet agronomist\'s rejection of Mendelian genetics crippled Soviet biology for decades?', a: 'Trofim Lysenko', d: ['Nikolai Vavilov', 'Ivan Michurin', 'Ivan Pavlov'] },
  ],
  // day 5
  [
    { c, t: 1, q: 'Which animal builds dams across streams out of sticks and mud?', a: 'Beaver', d: ['Otter', 'Muskrat', 'Raccoon'] },
    { c, t: 2, q: 'What is a group of wolves called?', a: 'Pack', d: ['Pride', 'Herd', 'Flock'] },
    { c, t: 3, q: 'What is the term for a group of organisms that can interbreed and produce fertile offspring?', a: 'Species', d: ['Genus', 'Family', 'Order'] },
    { c, t: 4, q: 'Which 1952 experiment with radioactively labeled viruses confirmed that DNA is the genetic material?', a: 'Hershey-Chase experiment', d: ['Meselson-Stahl experiment', 'Griffith experiment', 'Luria-Delbruck experiment'] },
    { c, t: 5, q: 'Which genus of giant single-celled green algae, a cell several centimeters long with one nucleus, is a classic subject of cell biology?', a: 'Acetabularia', d: ['Volvox', 'Chlamydomonas', 'Spirogyra'] },
  ],
  // day 6
  [
    { c, t: 1, q: 'What is a baby kangaroo called?', a: 'Joey', d: ['Cub', 'Kit', 'Calf'] },
    { c, t: 2, q: 'What material does a spider spin its web from?', a: 'Silk', d: ['Wax', 'Hair', 'Resin'] },
    { c, t: 3, q: 'Which are the only mammals capable of true powered flight?', a: 'Bats', d: ['Flying squirrels', 'Sugar gliders', 'Colugos'] },
    { c, t: 4, q: 'What is the protein shell that encloses a virus\'s genetic material called?', a: 'Capsid', d: ['Envelope', 'Cilium', 'Plasmid'] },
    { c, t: 5, q: 'Which zoologist confirmed in an 1884 telegram that the platypus lays eggs, wiring "Monotremes oviparous, ovum meroblastic"?', a: 'William Caldwell', d: ['Richard Owen', 'Thomas Henry Huxley', 'John Gould'] },
  ],
  // day 7
  [
    { c, t: 1, q: 'Which nocturnal bird hoots and can swivel its head about three-quarters of the way around?', a: 'Owl', d: ['Crow', 'Pigeon', 'Woodpecker'] },
    { c, t: 2, q: 'What is a young plant that has just sprouted from a seed called?', a: 'Seedling', d: ['Spore', 'Bulb', 'Cutting'] },
    { c, t: 3, q: 'What is the scientific study of insects called?', a: 'Entomology', d: ['Herpetology', 'Ichthyology', 'Ornithology'] },
    { c, t: 4, q: 'What term describes a single gene that influences several seemingly unrelated traits?', a: 'Pleiotropy', d: ['Epistasis', 'Polygeny', 'Codominance'] },
    { c, t: 5, q: 'What is the tough outer layer of a pollen grain, made of sporopollenin, called?', a: 'Exine', d: ['Intine', 'Testa', 'Tapetum'] },
  ],
  // day 8
  [
    { c, t: 1, q: 'What sticky body part does a frog flick out to catch insects?', a: 'Tongue', d: ['Tail', 'Claw', 'Fin'] },
    { c, t: 2, q: 'What do we call an animal that is hunted and eaten by another animal?', a: 'Prey', d: ['Predator', 'Host', 'Parasite'] },
    { c, t: 3, q: 'Which researcher began studying wild chimpanzees at Gombe in Tanzania in 1960?', a: 'Jane Goodall', d: ['Dian Fossey', 'Birute Galdikas', 'Cynthia Moss'] },
    { c, t: 4, q: 'Which gaseous plant hormone triggers the ripening of fruit?', a: 'Ethylene', d: ['Auxin', 'Gibberellin', 'Cytokinin'] },
    { c, t: 5, q: 'In 1998, which animal became the first multicellular organism to have its whole genome sequenced?', a: 'Caenorhabditis elegans', d: ['Drosophila melanogaster', 'Danio rerio', 'Mus musculus'] },
  ],
  // day 9
  [
    { c, t: 1, q: 'Which sea animal has eight arms lined with suckers?', a: 'Octopus', d: ['Jellyfish', 'Starfish', 'Crab'] },
    { c, t: 2, q: 'What is the natural home of an animal or plant called?', a: 'Habitat', d: ['Niche', 'Territory', 'Burrow'] },
    { c, t: 3, q: 'Which microscopic animal is nicknamed the water bear?', a: 'Tardigrade', d: ['Rotifer', 'Copepod', 'Nematode'] },
    { c, t: 4, q: 'The spread of dark peppered moths in sooty nineteenth-century English cities is a textbook example of what?', a: 'Industrial melanism', d: ['Batesian mimicry', 'Sexual selection', 'Genetic drift'] },
    { c, t: 5, q: 'Which bacterium did Frederick Griffith use in his 1928 experiment demonstrating "transformation"?', a: 'Streptococcus pneumoniae', d: ['Escherichia coli', 'Bacillus subtilis', 'Staphylococcus aureus'] },
  ],
  // day 10
  [
    { c, t: 1, q: 'Which insect lives in a hive ruled by a queen?', a: 'Honeybee', d: ['Housefly', 'Ladybug', 'Dragonfly'] },
    { c, t: 2, q: 'What is the protective outer covering of a tree trunk called?', a: 'Bark', d: ['Sap', 'Pith', 'Husk'] },
    { c, t: 3, q: 'Which plant catches insects by snapping its hinged leaves shut?', a: 'Venus flytrap', d: ['Pitcher plant', 'Sundew', 'Bladderwort'] },
    { c, t: 4, q: 'What is speciation called when a population is split in two by a geographic barrier?', a: 'Allopatric speciation', d: ['Sympatric speciation', 'Parapatric speciation', 'Polyploid speciation'] },
    { c, t: 5, q: 'Which evolutionary biologist proposed the "Red Queen" hypothesis in 1973?', a: 'Leigh Van Valen', d: ['W. D. Hamilton', 'John Maynard Smith', 'Richard Dawkins'] },
  ],
  // day 11
  [
    { c, t: 1, q: 'What do we call the deep, sleeplike state some animals enter to survive winter?', a: 'Hibernation', d: ['Migration', 'Molting', 'Grooming'] },
    { c, t: 2, q: 'Which is the tallest animal living today?', a: 'Giraffe', d: ['African elephant', 'Ostrich', 'Camel'] },
    { c, t: 3, q: 'Salamanders, newts and caecilians belong to which class of animals?', a: 'Amphibians', d: ['Reptiles', 'Fish', 'Mammals'] },
    { c, t: 4, q: 'What is it called when a harmless species evolves to look like a dangerous one?', a: 'Batesian mimicry', d: ['Mullerian mimicry', 'Aposematism', 'Crypsis'] },
    { c, t: 5, q: 'What is the free-swimming, ciliated larva of a jellyfish or coral called?', a: 'Planula', d: ['Nauplius', 'Trochophore', 'Veliger'] },
  ],
  // day 12
  [
    { c, t: 1, q: 'Which slow garden creature carries a coiled shell on its back?', a: 'Snail', d: ['Slug', 'Earthworm', 'Centipede'] },
    { c, t: 2, q: 'What animals do polar bears mainly hunt?', a: 'Seals', d: ['Penguins', 'Caribou', 'Arctic foxes'] },
    { c, t: 3, q: 'In which organelles does photosynthesis take place?', a: 'Chloroplasts', d: ['Mitochondria', 'Ribosomes', 'Vacuoles'] },
    { c, t: 4, q: 'Whose work in the Columbia "Fly Room" showed that genes are carried on chromosomes?', a: 'Thomas Hunt Morgan', d: ['William Bateson', 'Hugo de Vries', 'Carl Correns'] },
    { c, t: 5, q: 'Which British biologist coined the word "genetics" in 1905?', a: 'William Bateson', d: ['Francis Galton', 'Reginald Punnett', 'Ronald Fisher'] },
  ],
  // day 13
  [
    { c, t: 1, q: 'Which black-and-white animal defends itself by spraying a foul-smelling liquid?', a: 'Skunk', d: ['Badger', 'Raccoon', 'Opossum'] },
    { c, t: 2, q: 'Which South American animal is the largest rodent alive today?', a: 'Capybara', d: ['Beaver', 'Porcupine', 'Agouti'] },
    { c, t: 3, q: 'What are body parts called that have lost their original use through evolution, like a whale\'s tiny hip bones?', a: 'Vestigial structures', d: ['Analogous structures', 'Homeotic structures', 'Accessory structures'] },
    { c, t: 4, q: 'Starfish, sea urchins and sand dollars belong to which phylum?', a: 'Echinoderms', d: ['Cnidarians', 'Mollusks', 'Annelids'] },
    { c, t: 5, q: 'Which Italian physician\'s 1668 experiment with covered and uncovered meat challenged the idea that maggots arise spontaneously?', a: 'Francesco Redi', d: ['Lazzaro Spallanzani', 'Marcello Malpighi', 'John Needham'] },
  ],
  // day 14
  [
    { c, t: 1, q: 'What kind of leaves make up nearly all of a koala\'s diet?', a: 'Eucalyptus', d: ['Bamboo', 'Acacia', 'Banana'] },
    { c, t: 2, q: 'What is a group of lions called?', a: 'Pride', d: ['Pack', 'Troop', 'Herd'] },
    { c, t: 3, q: 'What is the protective outer layer around a plant seed called?', a: 'Seed coat', d: ['Endosperm', 'Cotyledon', 'Radicle'] },
    { c, t: 4, q: 'What are the small, separate rings of DNA found in many bacteria called?', a: 'Plasmids', d: ['Ribosomes', 'Nucleoids', 'Mesosomes'] },
    { c, t: 5, q: 'Which German botanist declared in 1838 that all plants are made of cells, laying the groundwork for cell theory?', a: 'Matthias Schleiden', d: ['Theodor Schwann', 'Rudolf Virchow', 'Robert Brown'] },
  ],
  // day 15
  [
    { c, t: 1, q: 'Which large, thick-skinned animal has one or two horns on its nose?', a: 'Rhinoceros', d: ['Hippopotamus', 'Buffalo', 'Tapir'] },
    { c, t: 2, q: 'Kangaroos, koalas and wombats are all what kind of mammal?', a: 'Marsupials', d: ['Monotremes', 'Rodents', 'Primates'] },
    { c, t: 3, q: 'Which French naturalist argued that traits acquired during life, like a stretched neck, could be passed to offspring?', a: 'Jean-Baptiste Lamarck', d: ['Georges Cuvier', 'Comte de Buffon', 'Etienne Geoffroy Saint-Hilaire'] },
    { c, t: 4, q: 'On the roots of peas and beans, nitrogen-fixing bacteria live inside small swellings called what?', a: 'Root nodules', d: ['Root hairs', 'Rhizomes', 'Tubers'] },
    { c, t: 5, q: 'Which English botanist coined the word "ecosystem" in 1935?', a: 'Arthur Tansley', d: ['Charles Elton', 'Eugene Odum', 'Frederic Clements'] },
  ],
  // day 16
  [
    { c, t: 1, q: 'Which small, round beetle is usually red with black spots?', a: 'Ladybug', d: ['Firefly', 'Weevil', 'Stag beetle'] },
    { c, t: 2, q: 'What do we call an animal that feeds on dead animals it did not kill?', a: 'Scavenger', d: ['Predator', 'Parasite', 'Herbivore'] },
    { c, t: 3, q: 'Which American primatologist studied mountain gorillas in Rwanda and wrote "Gorillas in the Mist"?', a: 'Dian Fossey', d: ['Jane Goodall', 'Birute Galdikas', 'Sarah Blaffer Hrdy'] },
    { c, t: 4, q: 'Jellyfish, corals and sea anemones belong to which phylum of stinging animals?', a: 'Cnidarians', d: ['Echinoderms', 'Sponges', 'Ctenophores'] },
    { c, t: 5, q: 'Which Dutch botanist, one of the three who rediscovered Mendel\'s work in 1900, coined the term "mutation"?', a: 'Hugo de Vries', d: ['Carl Correns', 'Erich von Tschermak', 'Wilhelm Johannsen'] },
  ],
  // day 17
  [
    { c, t: 1, q: 'Which rodent is covered in sharp quills?', a: 'Porcupine', d: ['Hedgehog', 'Squirrel', 'Chipmunk'] },
    { c, t: 2, q: 'Which great ape is the largest primate alive today?', a: 'Gorilla', d: ['Chimpanzee', 'Orangutan', 'Bonobo'] },
    { c, t: 3, q: 'Which birds gather in huge, swirling flocks called murmurations?', a: 'Starlings', d: ['Sparrows', 'Swallows', 'Pigeons'] },
    { c, t: 4, q: 'Which group of seed plants, including conifers and cycads, bears "naked" seeds not enclosed in fruit?', a: 'Gymnosperms', d: ['Angiosperms', 'Bryophytes', 'Pteridophytes'] },
    { c, t: 5, q: 'Which plant hormone was discovered through a rice disease that makes seedlings grow absurdly tall?', a: 'Gibberellin', d: ['Auxin', 'Cytokinin', 'Abscisic acid'] },
  ],
  // day 18
  [
    { c, t: 1, q: 'Which African animal is famous for a call that sounds like laughter?', a: 'Hyena', d: ['Jackal', 'Baboon', 'Warthog'] },
    { c, t: 2, q: 'What is a permanent change in an organism\'s DNA sequence called?', a: 'Mutation', d: ['Mitosis', 'Adaptation', 'Replication'] },
    { c, t: 3, q: 'What term describes the particular role a species plays in its ecosystem?', a: 'Ecological niche', d: ['Habitat range', 'Trophic cascade', 'Carrying capacity'] },
    { c, t: 4, q: 'Which microbes first filled Earth\'s atmosphere with oxygen through photosynthesis?', a: 'Cyanobacteria', d: ['Archaea', 'Diatoms', 'Methanogens'] },
    { c, t: 5, q: 'Which 375-million-year-old "fishapod" fossil, found in the Canadian Arctic in 2004, links fish to four-legged animals?', a: 'Tiktaalik', d: ['Ichthyostega', 'Acanthostega', 'Eusthenopteron'] },
  ],
  // day 19
  [
    { c, t: 1, q: 'What is a baby bear called?', a: 'Cub', d: ['Pup', 'Kit', 'Joey'] },
    { c, t: 2, q: 'Which fish swims from the ocean back up the river where it hatched in order to spawn?', a: 'Salmon', d: ['Tuna', 'Cod', 'Herring'] },
    { c, t: 3, q: 'In 1996, Dolly became the first mammal cloned from an adult cell. What animal was she?', a: 'Sheep', d: ['Goat', 'Cow', 'Pig'] },
    { c, t: 4, q: 'Which "living fossil" fish, long thought extinct, was found off South Africa in 1938?', a: 'Coelacanth', d: ['Lungfish', 'Sturgeon', 'Bichir'] },
    { c, t: 5, q: 'Which American paleontologist\'s bitter rivalry with Edward Drinker Cope became known as the Bone Wars?', a: 'Othniel Charles Marsh', d: ['Joseph Leidy', 'Henry Fairfield Osborn', 'Barnum Brown'] },
  ],
  // day 20
  [
    { c, t: 1, q: 'What do most caterpillars spend their days eating?', a: 'Leaves', d: ['Seeds', 'Insects', 'Bark'] },
    { c, t: 2, q: 'What do we call an animal\'s regular long-distance journey between regions with the seasons?', a: 'Migration', d: ['Hibernation', 'Dispersal', 'Estivation'] },
    { c, t: 3, q: 'Which Prussian naturalist explored South America from 1799 to 1804 and pioneered the study of how plants vary with altitude and climate?', a: 'Alexander von Humboldt', d: ['Aime Bonpland', 'Carl Linnaeus', 'Joseph Banks'] },
    { c, t: 4, q: 'What are the bacterial "molecular scissors" that cut DNA at specific short sequences called?', a: 'Restriction enzymes', d: ['Ligases', 'Polymerases', 'Transposases'] },
    { c, t: 5, q: 'In 2000, the small mustard weed thale cress became the first plant to have its genome sequenced. What is its genus?', a: 'Arabidopsis', d: ['Brassica', 'Nicotiana', 'Oryza'] },
  ],
  // day 21
  [
    { c, t: 1, q: 'Which sea creature usually has five arms and can grow back one it loses?', a: 'Starfish', d: ['Octopus', 'Jellyfish', 'Crab'] },
    { c, t: 2, q: 'What is the offspring of a male donkey and a female horse called?', a: 'Mule', d: ['Hinny', 'Pony', 'Burro'] },
    { c, t: 3, q: 'Snails and slugs belong to which class of mollusks?', a: 'Gastropods', d: ['Bivalves', 'Cephalopods', 'Chitons'] },
    { c, t: 4, q: 'What is the gradual change in the species of a community after a disturbance such as a fire?', a: 'Ecological succession', d: ['Adaptive radiation', 'Trophic cascade', 'Eutrophication'] },
    { c, t: 5, q: 'Which genus of soil bacteria forms nitrogen-fixing partnerships with peas, beans and clover?', a: 'Rhizobium', d: ['Azotobacter', 'Nitrosomonas', 'Streptomyces'] },
  ],
  // day 22
  [
    { c, t: 1, q: 'Which small, spiny mammal rolls into a ball when it is frightened?', a: 'Hedgehog', d: ['Porcupine', 'Mole', 'Shrew'] },
    { c, t: 2, q: 'What do we call organisms such as fungi and bacteria that break down dead matter?', a: 'Decomposers', d: ['Producers', 'Consumers', 'Pollinators'] },
    { c, t: 3, q: 'What word describes an animal that lives mainly in trees?', a: 'Arboreal', d: ['Fossorial', 'Terrestrial', 'Aquatic'] },
    { c, t: 4, q: 'What are microbes that thrive in very hot places, such as hot springs, called?', a: 'Thermophiles', d: ['Halophiles', 'Psychrophiles', 'Acidophiles'] },
    { c, t: 5, q: 'Which Russian botanist showed in 1892 that tobacco mosaic disease passed through filters that trapped bacteria?', a: 'Dmitri Ivanovsky', d: ['Martinus Beijerinck', 'Sergei Winogradsky', 'Ilya Mechnikov'] },
  ],
  // day 23
  [
    { c, t: 1, q: 'Which bird drills holes in tree trunks with its beak to find insects?', a: 'Woodpecker', d: ['Robin', 'Sparrow', 'Pelican'] },
    { c, t: 2, q: 'What is an animal at the very top of its food chain, with no natural predators, called?', a: 'Apex predator', d: ['Keystone prey', 'Primary consumer', 'Mesopredator'] },
    { c, t: 3, q: 'A peacock\'s showy tail is a classic example of which kind of selection?', a: 'Sexual selection', d: ['Artificial selection', 'Stabilizing selection', 'Kin selection'] },
    { c, t: 4, q: 'Which glowing molecule, first taken from a jellyfish, became a standard marker in genetics labs?', a: 'Green fluorescent protein', d: ['Luciferase', 'Rhodopsin', 'Bacteriorhodopsin'] },
    { c, t: 5, q: 'Which Canadian-American scientist showed in 1944 that DNA alone could transform bacteria?', a: 'Oswald Avery', d: ['Frederick Griffith', 'Alfred Hershey', 'Erwin Chargaff'] },
  ],
  // day 24
  [
    { c, t: 1, q: 'What is an adult male chicken called?', a: 'Rooster', d: ['Hen', 'Chick', 'Drake'] },
    { c, t: 2, q: 'What is a plant that completes its whole life cycle in a single growing season called?', a: 'Annual', d: ['Biennial', 'Perennial', 'Evergreen'] },
    { c, t: 3, q: 'What is a virus that infects bacteria called?', a: 'Bacteriophage', d: ['Prion', 'Viroid', 'Plasmid'] },
    { c, t: 4, q: 'Which living reptiles are the closest relatives of birds?', a: 'Crocodilians', d: ['Turtles', 'Lizards', 'Snakes'] },
    { c, t: 5, q: 'Which American biologist, an expert on ants, published "Sociobiology: The New Synthesis" in 1975?', a: 'E. O. Wilson', d: ['Robert Trivers', 'Stephen Jay Gould', 'Bert Holldobler'] },
  ],
  // day 25
  [
    { c, t: 1, q: 'What is a baby goat called?', a: 'Kid', d: ['Lamb', 'Calf', 'Cub'] },
    { c, t: 2, q: 'Which animal is the largest member of the deer family?', a: 'Moose', d: ['Elk', 'Caribou', 'Red deer'] },
    { c, t: 3, q: 'Which gas-filled organ lets many bony fish control how high they float in the water?', a: 'Swim bladder', d: ['Lateral line', 'Gill raker', 'Operculum'] },
    { c, t: 4, q: 'What word describes animals that are most active at dawn and dusk?', a: 'Crepuscular', d: ['Nocturnal', 'Diurnal', 'Cathemeral'] },
    { c, t: 5, q: 'Which American geneticist showed in 1905, working with mealworms, that sex is set by the X and Y chromosomes?', a: 'Nettie Stevens', d: ['Edmund Beecher Wilson', 'Clarence McClung', 'Lilian Vaughan Morgan'] },
  ],
  // day 26
  [
    { c, t: 1, q: 'Which water bird has a large stretchy pouch under its bill for scooping up fish?', a: 'Pelican', d: ['Heron', 'Flamingo', 'Swan'] },
    { c, t: 2, q: 'What is a flock of geese on the ground called?', a: 'Gaggle', d: ['Murder', 'Parliament', 'Pod'] },
    { c, t: 3, q: 'What is a close partnership between two species in which both benefit called?', a: 'Mutualism', d: ['Commensalism', 'Parasitism', 'Competition'] },
    { c, t: 4, q: 'What is the study of inherited changes in gene activity that do not alter the DNA sequence itself?', a: 'Epigenetics', d: ['Genomics', 'Proteomics', 'Cytogenetics'] },
    { c, t: 5, q: 'Which English biologist named the "modern synthesis" of genetics and evolution in his 1942 book?', a: 'Julian Huxley', d: ['J. B. S. Haldane', 'Ronald Fisher', 'Ernst Mayr'] },
  ],
  // day 27
  [
    { c, t: 1, q: 'Which ringed-tail animal with a black "mask" often raids trash cans at night?', a: 'Raccoon', d: ['Opossum', 'Badger', 'Fox'] },
    { c, t: 2, q: 'What is the dramatic change from tadpole to adult frog called?', a: 'Metamorphosis', d: ['Hibernation', 'Pollination', 'Regeneration'] },
    { c, t: 3, q: 'What kind of cell division produces sex cells with half the usual number of chromosomes?', a: 'Meiosis', d: ['Mitosis', 'Binary fission', 'Budding'] },
    { c, t: 4, q: 'What are the winged "helicopter" seeds of maple trees called?', a: 'Samaras', d: ['Achenes', 'Drupes', 'Capsules'] },
    { c, t: 5, q: 'Which statistician wrote "The Genetical Theory of Natural Selection" in 1930?', a: 'Ronald Fisher', d: ['Sewall Wright', 'Karl Pearson', 'J. B. S. Haldane'] },
  ],
  // day 28
  [
    { c, t: 1, q: 'What do fish use to breathe underwater?', a: 'Gills', d: ['Lungs', 'Fins', 'Scales'] },
    { c, t: 2, q: 'Which is the largest species of penguin?', a: 'Emperor penguin', d: ['King penguin', 'Adelie penguin', 'Gentoo penguin'] },
    { c, t: 3, q: 'What is the light produced by living things, such as glowworms and deep-sea fish, called?', a: 'Bioluminescence', d: ['Phosphorescence', 'Iridescence', 'Incandescence'] },
    { c, t: 4, q: 'Butterflies and moths make up which order of insects?', a: 'Lepidoptera', d: ['Hymenoptera', 'Diptera', 'Hemiptera'] },
    { c, t: 5, q: 'In which city\'s Augustinian abbey did Gregor Mendel carry out his pea experiments?', a: 'Brno', d: ['Prague', 'Vienna', 'Olomouc'] },
  ],
  // day 29
  [
    { c, t: 1, q: 'Which striped, stinging insect builds nests out of chewed wood "paper"?', a: 'Wasp', d: ['Honeybee', 'Housefly', 'Moth'] },
    { c, t: 2, q: 'Which many-legged creature\'s name means "a thousand feet"?', a: 'Millipede', d: ['Centipede', 'Woodlouse', 'Earwig'] },
    { c, t: 3, q: 'What is the scientific study of animal behavior called?', a: 'Ethology', d: ['Etymology', 'Ecology', 'Ethnology'] },
    { c, t: 4, q: 'What is the scientific term for an arthropod shedding its exoskeleton?', a: 'Ecdysis', d: ['Diapause', 'Eclosion', 'Apolysis'] },
    { c, t: 5, q: 'Which English mathematician described the principle of genetic equilibrium in 1908, independently of Wilhelm Weinberg?', a: 'G. H. Hardy', d: ['Karl Pearson', 'Udny Yule', 'Reginald Punnett'] },
  ],
  // day 30
  [
    { c, t: 1, q: 'Which tall plant with a big yellow flower head is grown for its seeds and oil?', a: 'Sunflower', d: ['Daisy', 'Tulip', 'Daffodil'] },
    { c, t: 2, q: 'What is a young deer called?', a: 'Fawn', d: ['Foal', 'Kid', 'Calf'] },
    { c, t: 3, q: 'What rigid layer surrounds plant cells but not animal cells?', a: 'Cell wall', d: ['Cell membrane', 'Cytoplasm', 'Nuclear envelope'] },
    { c, t: 4, q: 'Earthworms and leeches belong to which phylum of segmented worms?', a: 'Annelids', d: ['Nematodes', 'Flatworms', 'Arthropods'] },
    { c, t: 5, q: 'Which German biologist cut the tails off generations of mice to argue against the inheritance of acquired traits?', a: 'August Weismann', d: ['Ernst Haeckel', 'Theodor Boveri', 'Rudolf Virchow'] },
  ],
  // day 31
  [
    { c, t: 1, q: 'Which barking marine mammal with flippers is often trained to balance balls at aquariums?', a: 'Sea lion', d: ['Walrus', 'Manatee', 'Sea otter'] },
    { c, t: 2, q: 'Domestic dogs are descended from ancient populations of which wild animal?', a: 'Wolf', d: ['Coyote', 'Jackal', 'Fox'] },
    { c, t: 3, q: 'Which single-celled organism moves and feeds by pushing out "false feet" called pseudopods?', a: 'Amoeba', d: ['Paramecium', 'Euglena', 'Diatom'] },
    { c, t: 4, q: 'In Mendel\'s crosses, in what ratio did dominant and recessive traits appear in the second generation?', a: '3 to 1', d: ['1 to 1', '2 to 1', '9 to 3'] },
    { c, t: 5, q: 'Which Scottish botanist named the cell nucleus in 1831 after spotting it in orchid cells?', a: 'Robert Brown', d: ['David Don', 'William Hooker', 'Robert Hooke'] },
  ],
  // day 32
  [
    { c, t: 1, q: 'What are the colorful parts of a flower that attract insects called?', a: 'Petals', d: ['Roots', 'Thorns', 'Buds'] },
    { c, t: 2, q: 'What type of cell division produces two identical copies of a cell?', a: 'Mitosis', d: ['Meiosis', 'Fertilization', 'Pollination'] },
    { c, t: 3, q: 'Which plant tissue carries water up from the roots to the leaves?', a: 'Xylem', d: ['Phloem', 'Cambium', 'Cortex'] },
    { c, t: 4, q: 'What are the short, hairlike structures that beat in waves to move a paramecium?', a: 'Cilia', d: ['Flagella', 'Pili', 'Microvilli'] },
    { c, t: 5, q: 'Which American geneticist showed in 1927 that X-rays can cause mutations in fruit flies?', a: 'Hermann Muller', d: ['Alfred Sturtevant', 'Calvin Bridges', 'Lewis Stadler'] },
  ],
  // day 33
  [
    { c, t: 1, q: 'Which animal uses its long, sticky tongue to lap up ants and termites?', a: 'Anteater', d: ['Sloth', 'Badger', 'Otter'] },
    { c, t: 2, q: 'What is a baby swan called?', a: 'Cygnet', d: ['Gosling', 'Duckling', 'Eaglet'] },
    { c, t: 3, q: 'What is an organism that carries two different versions of the same gene called?', a: 'Heterozygous', d: ['Homozygous', 'Hemizygous', 'Polyploid'] },
    { c, t: 4, q: 'Giant kelp belongs to which group of algae?', a: 'Brown algae', d: ['Green algae', 'Red algae', 'Blue-green algae'] },
    { c, t: 5, q: 'Which British biologist set out the theory of inclusive fitness to explain altruism in 1964?', a: 'W. D. Hamilton', d: ['John Maynard Smith', 'George Price', 'Robert Trivers'] },
  ],
  // day 34
  [
    { c, t: 1, q: 'What overlapping plates cover the bodies of most fish?', a: 'Scales', d: ['Feathers', 'Quills', 'Shells'] },
    { c, t: 2, q: 'Which part of a plant holds it upright and carries water to the leaves?', a: 'Stem', d: ['Root', 'Flower', 'Seed'] },
    { c, t: 3, q: 'The giant panda belongs to which family of animals?', a: 'Bears', d: ['Raccoons', 'Weasels', 'Cats'] },
    { c, t: 4, q: 'What is the reflective layer behind the retina that makes a cat\'s eyes glow in the dark?', a: 'Tapetum lucidum', d: ['Macula lutea', 'Choroid plexus', 'Pecten oculi'] },
    { c, t: 5, q: 'Which biochemist found that DNA always holds equal amounts of adenine and thymine?', a: 'Erwin Chargaff', d: ['Linus Pauling', 'Phoebus Levene', 'Maurice Wilkins'] },
  ],
  // day 35
  [
    { c, t: 1, q: 'What do squirrels collect and bury to eat during winter?', a: 'Nuts', d: ['Berries', 'Insects', 'Leaves'] },
    { c, t: 2, q: 'Which slow-moving marine mammal, nicknamed the sea cow, grazes on underwater plants?', a: 'Manatee', d: ['Walrus', 'Elephant seal', 'Beluga'] },
    { c, t: 3, q: 'What is the stalk that joins a leaf to a plant\'s stem called?', a: 'Petiole', d: ['Pedicel', 'Stipule', 'Node'] },
    { c, t: 4, q: 'What is an insect\'s growth stage between two molts called?', a: 'Instar', d: ['Imago', 'Pupa', 'Exuvia'] },
    { c, t: 5, q: 'Which American ecologist proposed the five-kingdom classification of life in 1969?', a: 'Robert Whittaker', d: ['Carl Woese', 'Ernst Haeckel', 'Herbert Copeland'] },
  ],
  // day 36
  [
    { c, t: 1, q: 'What color are flamingos, thanks to pigments in the food they eat?', a: 'Pink', d: ['White', 'Blue', 'Yellow'] },
    { c, t: 2, q: 'What hard material are an elephant\'s tusks made of?', a: 'Ivory', d: ['Horn', 'Keratin', 'Antler'] },
    { c, t: 3, q: 'What term describes a species found naturally in only one place on Earth?', a: 'Endemic', d: ['Invasive', 'Migratory', 'Cosmopolitan'] },
    { c, t: 4, q: 'What are the root-like threads that anchor mosses to the ground called?', a: 'Rhizoids', d: ['Rhizomes', 'Stolons', 'Hyphae'] },
    { c, t: 5, q: 'Which American geneticist\'s work with Edward Tatum on bread mold led to the "one gene, one enzyme" idea?', a: 'George Beadle', d: ['Joshua Lederberg', 'Max Delbruck', 'Salvador Luria'] },
  ],
  // day 37
  [
    { c, t: 1, q: 'Which mammal is protected by a shell of bony plates?', a: 'Armadillo', d: ['Hedgehog', 'Mole', 'Opossum'] },
    { c, t: 2, q: 'Which is the largest species of wild cat alive today?', a: 'Tiger', d: ['Lion', 'Jaguar', 'Leopard'] },
    { c, t: 3, q: 'Which large, water-filled organelle helps keep plant cells firm?', a: 'Vacuole', d: ['Lysosome', 'Golgi apparatus', 'Nucleolus'] },
    { c, t: 4, q: 'What is reproduction from an unfertilized egg, as in some whiptail lizards, called?', a: 'Parthenogenesis', d: ['Budding', 'Fragmentation', 'Sporulation'] },
    { c, t: 5, q: 'Which three-letter codon signals the start of protein-making in nearly all organisms?', a: 'AUG', d: ['UAA', 'UGA', 'GUA'] },
  ],
  // day 38
  [
    { c, t: 1, q: 'Which insect makes its chirping song by rubbing its wings together?', a: 'Cricket', d: ['Ant', 'Moth', 'Ladybug'] },
    { c, t: 2, q: 'What is an adult female sheep called?', a: 'Ewe', d: ['Ram', 'Doe', 'Sow'] },
    { c, t: 3, q: 'What kind of root, like a carrot\'s, grows as one thick main root?', a: 'Taproot', d: ['Fibrous root', 'Aerial root', 'Prop root'] },
    { c, t: 4, q: 'What are the algae that live inside the tissues of reef-building corals called?', a: 'Zooxanthellae', d: ['Diatoms', 'Kelp', 'Desmids'] },
    { c, t: 5, q: 'Which German pathologist popularized the maxim "every cell comes from a cell" in 1855?', a: 'Rudolf Virchow', d: ['Theodor Schwann', 'Robert Remak', 'Albert von Kolliker'] },
  ],
  // day 39
  [
    { c, t: 1, q: 'Which large flightless bird is found in the wild only in Australia?', a: 'Emu', d: ['Ostrich', 'Kiwi', 'Rhea'] },
    { c, t: 2, q: 'What are the jelly-covered clumps of frog eggs found in ponds called?', a: 'Frogspawn', d: ['Roe', 'Caviar', 'Larvae'] },
    { c, t: 3, q: 'What do we call animals, such as shrews and many bats, that feed mainly on insects?', a: 'Insectivores', d: ['Granivores', 'Frugivores', 'Folivores'] },
    { c, t: 4, q: 'What is it called when a cell has more than two complete sets of chromosomes, as in bread wheat?', a: 'Polyploidy', d: ['Aneuploidy', 'Haploidy', 'Mosaicism'] },
    { c, t: 5, q: 'Which Russian botanist mapped the world\'s centers of crop origin and died in a Soviet prison in 1943?', a: 'Nikolai Vavilov', d: ['Trofim Lysenko', 'Ivan Michurin', 'Nikolai Koltsov'] },
  ],
  // day 40
  [
    { c, t: 1, q: 'Which reptile can drop its tail to escape a predator and later grow a new one?', a: 'Lizard', d: ['Turtle', 'Crocodile', 'Snake'] },
    { c, t: 2, q: 'What do we call an animal that eats mainly meat?', a: 'Carnivore', d: ['Herbivore', 'Detritivore', 'Frugivore'] },
    { c, t: 3, q: 'Which genus of fruit fly has been a workhorse of genetics labs for more than a century?', a: 'Drosophila', d: ['Anopheles', 'Musca', 'Aedes'] },
    { c, t: 4, q: 'Which substance makes up most of a plant\'s cell walls?', a: 'Cellulose', d: ['Chitin', 'Starch', 'Keratin'] },
    { c, t: 5, q: 'Which Dutch scientist showed in 1779 that plants purify the air only when exposed to sunlight?', a: 'Jan Ingenhousz', d: ['Joseph Priestley', 'Jean Senebier', 'Stephen Hales'] },
  ],
  // day 41
  [
    { c, t: 1, q: 'In which big cat do adult males grow a thick mane?', a: 'Lion', d: ['Tiger', 'Leopard', 'Cheetah'] },
    { c, t: 2, q: 'What is a baby bird that is still too young to leave the nest called?', a: 'Nestling', d: ['Fledgling', 'Hatchery', 'Brood'] },
    { c, t: 3, q: 'What is the network of all the interlinked feeding relationships in an ecosystem called?', a: 'Food web', d: ['Food pyramid', 'Gene pool', 'Niche map'] },
    { c, t: 4, q: 'What is the largest population of a species that an environment can support over time called?', a: 'Carrying capacity', d: ['Biotic potential', 'Population density', 'Climax community'] },
    { c, t: 5, q: 'Which pair showed in 1958 that DNA copies itself in a semiconservative way?', a: 'Meselson and Stahl', d: ['Hershey and Chase', 'Beadle and Tatum', 'Avery and MacLeod'] },
  ],
  // day 42
  [
    { c, t: 1, q: 'What is a group of sheep called?', a: 'Flock', d: ['Pack', 'Pride', 'School'] },
    { c, t: 2, q: 'What do we call trees that shed all their leaves each autumn?', a: 'Deciduous', d: ['Evergreen', 'Coniferous', 'Perennial'] },
    { c, t: 3, q: 'What is the way a hydra or yeast cell reproduces by growing a small offshoot that breaks away?', a: 'Budding', d: ['Binary fission', 'Spore formation', 'Pollination'] },
    { c, t: 4, q: 'Into which national park were gray wolves reintroduced in 1995?', a: 'Yellowstone', d: ['Yosemite', 'Glacier', 'Grand Teton'] },
    { c, t: 5, q: 'Which ecologist wrote "The Theory of Island Biogeography" with E. O. Wilson in 1967?', a: 'Robert MacArthur', d: ['Daniel Simberloff', 'G. Evelyn Hutchinson', 'Jared Diamond'] },
  ],
  // day 43
  [
    { c, t: 1, q: 'Which insect with huge eyes and four clear wings hunts other insects over ponds?', a: 'Dragonfly', d: ['Mosquito', 'Housefly', 'Moth'] },
    { c, t: 2, q: 'Which part of a bird\'s egg provides food for the growing chick?', a: 'Yolk', d: ['Shell', 'Membrane', 'Air cell'] },
    { c, t: 3, q: 'Insects, spiders and crabs all belong to which phylum of animals with jointed legs?', a: 'Arthropods', d: ['Annelids', 'Mollusks', 'Chordates'] },
    { c, t: 4, q: 'What do biologists call bright warning colors that advertise an animal is toxic or dangerous?', a: 'Aposematism', d: ['Crypsis', 'Countershading', 'Iridescence'] },
    { c, t: 5, q: 'Which Japanese geneticist proposed the neutral theory of molecular evolution in 1968?', a: 'Motoo Kimura', d: ['Susumu Ohno', 'Tomoko Ohta', 'Hitoshi Kihara'] },
  ],
  // day 44
  [
    { c, t: 1, q: 'Which animal grows antlers and sheds them every year?', a: 'Deer', d: ['Goat', 'Cow', 'Rhinoceros'] },
    { c, t: 2, q: 'What is a group of whales called?', a: 'Pod', d: ['Herd', 'Gaggle', 'Swarm'] },
    { c, t: 3, q: 'What is a version of a gene called that shows its trait even when only one copy is inherited?', a: 'Dominant', d: ['Recessive', 'Silent', 'Lethal'] },
    { c, t: 4, q: 'Which drifting, microscopic organisms produce much of the oxygen that comes from the oceans?', a: 'Phytoplankton', d: ['Zooplankton', 'Krill', 'Nekton'] },
    { c, t: 5, q: 'Which American geneticist pictured evolution as populations moving across "adaptive landscapes"?', a: 'Sewall Wright', d: ['Ronald Fisher', 'Theodosius Dobzhansky', 'Hermann Muller'] },
  ],
  // day 45
  [
    { c, t: 1, q: 'Which long-eared animal lives in underground burrows called warrens?', a: 'Rabbit', d: ['Hare', 'Mole', 'Badger'] },
    { c, t: 2, q: 'What does a hermit crab use as its home?', a: 'An empty snail shell', d: ['A burrow in the sand', 'A shell it grows itself', 'A hollow sponge'] },
    { c, t: 3, q: 'Which artist-naturalist painted the life-size plates of "The Birds of America"?', a: 'John James Audubon', d: ['Alexander Wilson', 'Roger Tory Peterson', 'John Gould'] },
    { c, t: 4, q: 'What is the waxy, waterproof layer on the surface of a leaf called?', a: 'Cuticle', d: ['Epidermis', 'Mesophyll', 'Periderm'] },
    { c, t: 5, q: 'Which Swiss scientist first isolated DNA, which he called "nuclein," in 1869?', a: 'Friedrich Miescher', d: ['Albrecht Kossel', 'Phoebus Levene', 'Walther Flemming'] },
  ],
  // day 46
  [
    { c, t: 1, q: 'What is the hard, pointed mouth of a bird called?', a: 'Beak', d: ['Snout', 'Muzzle', 'Fang'] },
    { c, t: 2, q: 'What is a baby owl called?', a: 'Owlet', d: ['Cygnet', 'Gosling', 'Eyas'] },
    { c, t: 3, q: 'Apart from the platypus, which spiny mammal lays eggs?', a: 'Echidna', d: ['Hedgehog', 'Porcupine', 'Tenrec'] },
    { c, t: 4, q: 'How many chambers does a typical fish heart have?', a: 'Two', d: ['Three', 'Four', 'One'] },
    { c, t: 5, q: 'Which German-born American ornithologist formulated the biological species concept?', a: 'Ernst Mayr', d: ['Erwin Stresemann', 'Bernhard Rensch', 'George Gaylord Simpson'] },
  ],
  // day 47
  [
    { c, t: 1, q: 'Which evergreen tree has long needles growing in bundles and bears woody cones?', a: 'Pine', d: ['Oak', 'Maple', 'Willow'] },
    { c, t: 2, q: 'Which seabird with a colorful striped bill is nicknamed the "sea parrot"?', a: 'Puffin', d: ['Toucan', 'Penguin', 'Gannet'] },
    { c, t: 3, q: 'Which part of a flower develops into the fruit?', a: 'Ovary', d: ['Petal', 'Anther', 'Sepal'] },
    { c, t: 4, q: 'What kind of organism caused the Irish potato famine of the 1840s?', a: 'A water mold', d: ['A bacterium', 'A virus', 'A beetle'] },
    { c, t: 5, q: 'What is the transition zone where two ecosystems meet, such as forest and grassland?', a: 'Ecotone', d: ['Biome', 'Riparian zone', 'Watershed'] },
  ],
  // day 48
  [
    { c, t: 1, q: 'What is the poison a snake injects through its fangs called?', a: 'Venom', d: ['Nectar', 'Saliva', 'Sap'] },
    { c, t: 2, q: 'How many legs does a crab have, counting its two claws?', a: 'Ten', d: ['Eight', 'Six', 'Twelve'] },
    { c, t: 3, q: 'What is a group of individuals of the same species living in one area called?', a: 'Population', d: ['Community', 'Ecosystem', 'Biome'] },
    { c, t: 4, q: 'At which stage of mitosis do the chromosomes line up across the middle of the cell?', a: 'Metaphase', d: ['Prophase', 'Anaphase', 'Telophase'] },
    { c, t: 5, q: 'Which British ecologist described food chains and the pyramid of numbers in his 1927 book "Animal Ecology"?', a: 'Charles Elton', d: ['Arthur Tansley', 'Raymond Lindeman', 'Eugene Odum'] },
  ],
];
