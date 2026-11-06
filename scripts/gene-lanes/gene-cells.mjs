// scripts/gene-lanes/gene-cells.mjs - Gene (Life Science), lane 'Cells & Evolution'.
// APPEND SEGMENT: 27 days x 5 tiers, live 2026-12-05 to 2026-12-31 (bank days 37..63).
// gen-science.mjs appends whatever days these lanes carry, so the lane files hold
// only the newest segment; days 1..36 are frozen in app/gene/questions.js and in
// git history (commit 1260977a). Written 2026-11-06.
export const LANE_DAYS = [
  // day 1 (2026-12-05)
  [
    { c: "Cells & Evolution", t: 1, q: "Fossil seashells found high up in mountains show that the rock there was once what?", a: "The seafloor", d: ["A desert", "A glacier", "A volcano"] },
    { c: "Cells & Evolution", t: 2, q: "What is walking upright on two legs, a key step in human evolution, called?", a: "Bipedalism", d: ["Quadrupedalism", "Brachiation", "Knuckle-walking"] },
    { c: "Cells & Evolution", t: 3, q: "Which network of folded membranes, described as rough or smooth, makes proteins and lipids in a cell?", a: "Endoplasmic reticulum", d: ["Golgi apparatus", "Nuclear envelope", "Cell wall"] },
    { c: "Cells & Evolution", t: 4, q: "What is the stage of photosynthesis that fixes carbon dioxide into sugar, named after a 1961 Nobel winner, called?", a: "Calvin cycle", d: ["Krebs cycle", "Cori cycle", "Urea cycle"] },
    { c: "Cells & Evolution", t: 5, q: "Which idea, formalized by W. D. Hamilton in 1964, explains why animals help relatives at a cost to themselves?", a: "Kin selection", d: ["Group selection", "Reciprocal altruism", "Sexual selection"] },
  ],
  // day 2 (2026-12-06)
  [
    { c: "Cells & Evolution", t: 1, q: "Which plants did Gregor Mendel grow to work out the basic rules of heredity?", a: "Peas", d: ["Beans", "Corn", "Tomatoes"] },
    { c: "Cells & Evolution", t: 2, q: "What is ancient wood whose tissue has been replaced by minerals and turned to stone called?", a: "Petrified wood", d: ["Driftwood", "Bog oak", "Ironwood"] },
    { c: "Cells & Evolution", t: 3, q: "What network of protein fibers gives a cell its shape and helps it move?", a: "Cytoskeleton", d: ["Cell wall", "Nucleolus", "Cytoplasm"] },
    { c: "Cells & Evolution", t: 4, q: "Which American biologist championed the idea that mitochondria and chloroplasts began as bacteria living inside other cells?", a: "Lynn Margulis", d: ["Rachel Carson", "Barbara McClintock", "Dian Fossey"] },
    { c: "Cells & Evolution", t: 5, q: "What is the cap on how many times a normal human cell can divide in culture called?", a: "Hayflick limit", d: ["Weismann barrier", "Cell cycle arrest", "Apoptotic threshold"] },
  ],
  // day 3 (2026-12-07)
  [
    { c: "Cells & Evolution", t: 1, q: "What is a developing animal in its earliest stages, before birth or hatching, called?", a: "Embryo", d: ["Larva", "Pupa", "Spore"] },
    { c: "Cells & Evolution", t: 2, q: "What is the spreading of molecules from where they are crowded to where they are scarce called?", a: "Diffusion", d: ["Condensation", "Active transport", "Evaporation"] },
    { c: "Cells & Evolution", t: 3, q: "Human AB blood type, where both alleles show fully, is an example of what?", a: "Codominance", d: ["Incomplete dominance", "Epistasis", "Linkage"] },
    { c: "Cells & Evolution", t: 4, q: "What dense region inside the nucleus assembles the subunits of ribosomes?", a: "Nucleolus", d: ["Centrosome", "Nucleosome", "Centriole"] },
    { c: "Cells & Evolution", t: 5, q: "Homo naledi, described in 2015, was found in which South African cave system?", a: "Rising Star", d: ["Sterkfontein", "Blombos", "Border Cave"] },
  ],
  // day 4 (2026-12-08)
  [
    { c: "Cells & Evolution", t: 1, q: "What is a characteristic, like eye color or height, that can be passed from parents to children called?", a: "A trait", d: ["A tissue", "A habitat", "A mineral"] },
    { c: "Cells & Evolution", t: 2, q: "In DNA, guanine always pairs with which base?", a: "Cytosine", d: ["Adenine", "Thymine", "Uracil"] },
    { c: "Cells & Evolution", t: 3, q: "What is a family-tree chart that tracks a genetic trait through generations called?", a: "Pedigree", d: ["Karyotype", "Punnett square", "Cladogram"] },
    { c: "Cells & Evolution", t: 4, q: "What is the final splitting of the cytoplasm that creates two daughter cells called?", a: "Cytokinesis", d: ["Karyokinesis", "Interphase", "Prophase"] },
    { c: "Cells & Evolution", t: 5, q: "Which rotating enzyme in the inner mitochondrial membrane makes most of a cell's ATP?", a: "ATP synthase", d: ["Cytochrome c oxidase", "Hexokinase", "NADH dehydrogenase"] },
  ],
  // day 5 (2026-12-09)
  [
    { c: "Cells & Evolution", t: 1, q: "What is the offspring of two different species, such as a lion and a tiger, called?", a: "A hybrid", d: ["A clone", "A mutant", "A fossil"] },
    { c: "Cells & Evolution", t: 2, q: "What process in cells uses oxygen to release the energy stored in glucose?", a: "Cellular respiration", d: ["Photosynthesis", "Fermentation", "Digestion"] },
    { c: "Cells & Evolution", t: 3, q: "What is it called when a cell uses energy to move substances across its membrane against a concentration gradient?", a: "Active transport", d: ["Diffusion", "Osmosis", "Facilitated diffusion"] },
    { c: "Cells & Evolution", t: 4, q: "What is an ordered picture of all of a cell's chromosomes, used to spot extra or missing ones, called?", a: "Karyotype", d: ["Genotype", "Phenotype", "Pedigree"] },
    { c: "Cells & Evolution", t: 5, q: "Which principle says allele frequencies stay constant in a large, randomly mating population with no evolution at work?", a: "Hardy-Weinberg equilibrium", d: ["Founder principle", "Mendelian ratio", "Wright-Fisher drift"] },
  ],
  // day 6 (2026-12-10)
  [
    { c: "Cells & Evolution", t: 1, q: "Which kind of cell has a rigid cell wall and green chloroplasts?", a: "A plant cell", d: ["An animal cell", "A nerve cell", "A blood cell"] },
    { c: "Cells & Evolution", t: 2, q: "What is a person called who has one copy of a recessive disease allele but no symptoms?", a: "A carrier", d: ["A mutant", "A donor", "A clone"] },
    { c: "Cells & Evolution", t: 3, q: "What is the pocket on an enzyme where its substrate binds called?", a: "Active site", d: ["Allosteric site", "Prosthetic group", "Cofactor"] },
    { c: "Cells & Evolution", t: 4, q: "What three-base sequence on a transfer RNA pairs with a codon on the messenger RNA?", a: "Anticodon", d: ["Promoter", "Exon", "Primer"] },
    { c: "Cells & Evolution", t: 5, q: "What are the channels through plant cell walls that connect the cytoplasm of neighboring cells?", a: "Plasmodesmata", d: ["Desmosomes", "Tight junctions", "Gap junctions"] },
  ],
  // day 7 (2026-12-11)
  [
    { c: "Cells & Evolution", t: 1, q: "What kind of organism is the fuzzy mold that grows on old bread?", a: "A fungus", d: ["A plant", "A bacterium", "An animal"] },
    { c: "Cells & Evolution", t: 2, q: "What is it called when bacteria evolve so that a drug like penicillin no longer kills them?", a: "Antibiotic resistance", d: ["Herd immunity", "Vaccination", "Remission"] },
    { c: "Cells & Evolution", t: 3, q: "In which phase of mitosis are the sister chromatids pulled apart to opposite ends of the cell?", a: "Anaphase", d: ["Prophase", "Metaphase", "Interphase"] },
    { c: "Cells & Evolution", t: 4, q: "Which amino acid does the start codon AUG code for?", a: "Methionine", d: ["Glycine", "Leucine", "Tryptophan"] },
    { c: "Cells & Evolution", t: 5, q: "Which car-sized armored relative of the armadillo roamed Ice Age South America?", a: "Glyptodon", d: ["Ankylosaurus", "Megatherium", "Toxodon"] },
  ],
  // day 8 (2026-12-12)
  [
    { c: "Cells & Evolution", t: 1, q: "What is a group of tissues working together to do a job, such as the heart or the stomach, called?", a: "An organ", d: ["A cell", "An organelle", "A species"] },
    { c: "Cells & Evolution", t: 2, q: "What are all the different species living and interacting in one area called?", a: "Community", d: ["Population", "Habitat", "Genome"] },
    { c: "Cells & Evolution", t: 3, q: "Malaria is caused by what kind of single-celled organism?", a: "A protist", d: ["A bacterium", "A virus", "A fungus"] },
    { c: "Cells & Evolution", t: 4, q: "What is a slimy, organized community of bacteria stuck to a surface, like dental plaque, called?", a: "Biofilm", d: ["Capsule", "Plasmid", "Endospore"] },
    { c: "Cells & Evolution", t: 5, q: "Which family of master regulators, each holding a homeobox, lays out the head-to-tail body plan in animals?", a: "Hox genes", d: ["Oncogenes", "Housekeeping genes", "Pseudogenes"] },
  ],
  // day 9 (2026-12-13)
  [
    { c: "Cells & Evolution", t: 1, q: "What are the four chemical 'letters' of DNA, A, C, G and T, called?", a: "Bases", d: ["Codons", "Amino acids", "Chromosomes"] },
    { c: "Cells & Evolution", t: 2, q: "What is the organism that a parasite or a virus lives on or in called?", a: "The host", d: ["The predator", "The prey", "The scavenger"] },
    { c: "Cells & Evolution", t: 3, q: "Red-green color blindness is more common in men because its gene is carried on which of these?", a: "The X chromosome", d: ["The Y chromosome", "Chromosome 1", "Chromosome 21"] },
    { c: "Cells & Evolution", t: 4, q: "Which giant marine lizards, first found near Maastricht in the Netherlands, ruled the seas of the late Cretaceous?", a: "Mosasaurs", d: ["Ichthyosaurs", "Plesiosaurs", "Pliosaurs"] },
    { c: "Cells & Evolution", t: 5, q: "The first non-bird dinosaur found with traces of feathers, described in 1996, came from which country?", a: "China", d: ["Mongolia", "Canada", "Argentina"] },
  ],
  // day 10 (2026-12-14)
  [
    { c: "Cells & Evolution", t: 1, q: "Tyrannosaurus rex is famous for having very short what?", a: "Arms", d: ["Legs", "Tail", "Teeth"] },
    { c: "Cells & Evolution", t: 2, q: "Which level of organization is made of several organs working together, like the stomach, intestines and liver?", a: "Organ system", d: ["Tissue", "Organelle", "Population"] },
    { c: "Cells & Evolution", t: 3, q: "In evolution, what does an organism's 'fitness' actually measure?", a: "Its reproductive success", d: ["Its strength", "Its speed", "Its lifespan"] },
    { c: "Cells & Evolution", t: 4, q: "Which plant-eating dinosaur, named in 1825, has a spiky thumb that was first mistaken for a nose horn?", a: "Iguanodon", d: ["Megalosaurus", "Hadrosaurus", "Hylaeosaurus"] },
    { c: "Cells & Evolution", t: 5, q: "What large complex of RNA and protein cuts the introns out of a newly made RNA?", a: "Spliceosome", d: ["Proteasome", "Ribosome", "Nucleosome"] },
  ],
  // day 11 (2026-12-15)
  [
    { c: "Cells & Evolution", t: 1, q: "Which geological period, between the Triassic and the Cretaceous, gave its name to a 1993 dinosaur movie?", a: "Jurassic", d: ["Permian", "Devonian", "Silurian"] },
    { c: "Cells & Evolution", t: 2, q: "What is the total collection of all the gene versions in a population called?", a: "Gene pool", d: ["Gene flow", "Genotype", "Gene map"] },
    { c: "Cells & Evolution", t: 3, q: "Which geological period, when fish diversified enormously, is nicknamed the Age of Fishes?", a: "Devonian", d: ["Silurian", "Ordovician", "Permian"] },
    { c: "Cells & Evolution", t: 4, q: "The sail-backed Dimetrodon was not a dinosaur. Which living group is it more closely related to?", a: "Mammals", d: ["Lizards", "Crocodiles", "Turtles"] },
    { c: "Cells & Evolution", t: 5, q: "Which spiny Burgess Shale animal was first reconstructed upside down and back to front?", a: "Hallucigenia", d: ["Opabinia", "Marrella", "Wiwaxia"] },
  ],
  // day 12 (2026-12-16)
  [
    { c: "Cells & Evolution", t: 1, q: "Which plant-eating dinosaur had three horns on its face and a big bony frill?", a: "Triceratops", d: ["Stegosaurus", "Ankylosaurus", "Brachiosaurus"] },
    { c: "Cells & Evolution", t: 2, q: "In undisturbed layers of sedimentary rock, what is generally true of the fossils found deeper down?", a: "They are older", d: ["They are younger", "They are larger", "They are all marine"] },
    { c: "Cells & Evolution", t: 3, q: "What are the large Ice Age animals, such as mammoths and woolly rhinos, collectively called?", a: "Megafauna", d: ["Microfauna", "Macrophytes", "Dinosaurs"] },
    { c: "Cells & Evolution", t: 4, q: "What kind of animal was Megatherium, which roamed South America during the Ice Age?", a: "A giant ground sloth", d: ["A giant armadillo", "A giant beaver", "A cave bear"] },
    { c: "Cells & Evolution", t: 5, q: "A Western blot is a lab test used to detect which kind of molecule?", a: "Proteins", d: ["DNA", "RNA", "Lipids"] },
  ],
  // day 13 (2026-12-17)
  [
    { c: "Cells & Evolution", t: 1, q: "Where do at-home DNA test kits usually collect cells with a cotton swab?", a: "Inside the cheek", d: ["Behind the ear", "Under the nails", "Between the toes"] },
    { c: "Cells & Evolution", t: 2, q: "What is the two-part naming system for species, as in Homo sapiens, called?", a: "Binomial nomenclature", d: ["Cladistics", "Phylogeny", "Trinomial taxonomy"] },
    { c: "Cells & Evolution", t: 3, q: "What are round, ball-shaped bacteria called?", a: "Cocci", d: ["Bacilli", "Spirilla", "Vibrios"] },
    { c: "Cells & Evolution", t: 4, q: "Peking Man, found near Beijing in the 1920s, belongs to which human species?", a: "Homo erectus", d: ["Homo habilis", "Homo neanderthalensis", "Homo floresiensis"] },
    { c: "Cells & Evolution", t: 5, q: "Which proteins, discovered by Tim Hunt in sea urchin eggs, rise and fall to drive the cell cycle?", a: "Cyclins", d: ["Histones", "Kinesins", "Integrins"] },
  ],
  // day 14 (2026-12-18)
  [
    { c: "Cells & Evolution", t: 1, q: "What does the abbreviation GMO stand for?", a: "Genetically modified organism", d: ["Genetically mixed organism", "Growth-modified organism", "Genetically mutated organism"] },
    { c: "Cells & Evolution", t: 2, q: "What are organisms whose cells have a nucleus, such as plants, animals and fungi, called?", a: "Eukaryotes", d: ["Prokaryotes", "Archaea", "Viruses"] },
    { c: "Cells & Evolution", t: 3, q: "What is a single chain of amino acids joined by peptide bonds called?", a: "Polypeptide", d: ["Polysaccharide", "Nucleotide", "Fatty acid"] },
    { c: "Cells & Evolution", t: 4, q: "Humans, chimpanzees, gorillas and orangutans together make up which family?", a: "Hominids", d: ["Hominins", "Hylobatids", "Cercopithecids"] },
    { c: "Cells & Evolution", t: 5, q: "What is the system bacteria use to detect how many of their kind are nearby, through signal molecules?", a: "Quorum sensing", d: ["Chemotaxis", "Conjugation", "Sporulation"] },
  ],
  // day 15 (2026-12-19)
  [
    { c: "Cells & Evolution", t: 1, q: "Fossils show that many small meat-eating dinosaurs closely related to birds had what covering their bodies?", a: "Feathers", d: ["Fur", "Shells", "Smooth scales"] },
    { c: "Cells & Evolution", t: 2, q: "How many sets of chromosomes does a typical human body cell carry?", a: "Two", d: ["One", "Three", "Four"] },
    { c: "Cells & Evolution", t: 3, q: "Which tiny eight-legged animals, nicknamed water bears, can survive drying out, freezing and even open space?", a: "Tardigrades", d: ["Rotifers", "Nematodes", "Copepods"] },
    { c: "Cells & Evolution", t: 4, q: "What are spiral-shaped bacteria with rigid bodies called?", a: "Spirilla", d: ["Cocci", "Bacilli", "Vibrios"] },
    { c: "Cells & Evolution", t: 5, q: "What German term names a fossil site of exceptional preservation, like the Burgess Shale?", a: "Lagerstätte", d: ["Leitfossil", "Grabfeld", "Steinbruch"] },
  ],
  // day 16 (2026-12-20)
  [
    { c: "Cells & Evolution", t: 1, q: "Which male sex cell swims with a whiplike tail to reach an egg?", a: "Sperm", d: ["Ovum", "Zygote", "Neuron"] },
    { c: "Cells & Evolution", t: 2, q: "Who wrote the 1976 book 'The Selfish Gene'?", a: "Richard Dawkins", d: ["Stephen Jay Gould", "E. O. Wilson", "Carl Sagan"] },
    { c: "Cells & Evolution", t: 3, q: "Which single-celled pond organism has a red eyespot and can both photosynthesize and eat food?", a: "Euglena", d: ["Amoeba", "Paramecium", "Volvox"] },
    { c: "Cells & Evolution", t: 4, q: "What is the specific position of a gene on a chromosome called?", a: "Locus", d: ["Allele", "Codon", "Centromere"] },
    { c: "Cells & Evolution", t: 5, q: "What is the study of trace fossils, such as footprints, burrows and bite marks, called?", a: "Ichnology", d: ["Taphonomy", "Palynology", "Stratigraphy"] },
  ],
  // day 17 (2026-12-21)
  [
    { c: "Cells & Evolution", t: 1, q: "Which tangy bread rises thanks to a 'starter' of wild yeast and bacteria?", a: "Sourdough", d: ["Brioche", "Focaccia", "Soda bread"] },
    { c: "Cells & Evolution", t: 2, q: "What is a species that has changed little over many millions of years, like the horseshoe crab, often called?", a: "A living fossil", d: ["A missing link", "A ghost lineage", "A transitional form"] },
    { c: "Cells & Evolution", t: 3, q: "Which armored dinosaur swung a heavy bony club at the end of its tail?", a: "Ankylosaurus", d: ["Stegosaurus", "Triceratops", "Iguanodon"] },
    { c: "Cells & Evolution", t: 4, q: "What DNA region just before a gene is where RNA polymerase binds to start transcription?", a: "Promoter", d: ["Terminator", "Operator", "Intron"] },
    { c: "Cells & Evolution", t: 5, q: "Which American chemist described the alpha helix, a key shape in protein structure, in 1951?", a: "Linus Pauling", d: ["Erwin Chargaff", "Maurice Wilkins", "Phoebus Levene"] },
  ],
  // day 18 (2026-12-22)
  [
    { c: "Cells & Evolution", t: 1, q: "What thin piece of glass holds a specimen under a microscope?", a: "A slide", d: ["A lens", "A dish", "A filter"] },
    { c: "Cells & Evolution", t: 2, q: "What does the Latin name Homo sapiens mean?", a: "Wise man", d: ["Upright man", "Handy man", "Thinking ape"] },
    { c: "Cells & Evolution", t: 3, q: "What is anything, like X-rays or tobacco smoke, that causes changes in DNA called?", a: "Mutagen", d: ["Antigen", "Allergen", "Pathogen"] },
    { c: "Cells & Evolution", t: 4, q: "Broccoli, kale, kohlrabi and cauliflower were all bred from which single wild plant?", a: "Wild cabbage", d: ["Wild lettuce", "Wild radish", "Wild spinach"] },
    { c: "Cells & Evolution", t: 5, q: "Which British biochemist won the 1978 Nobel Prize for explaining how a proton gradient across a membrane drives ATP production?", a: "Peter Mitchell", d: ["Hans Krebs", "Fred Sanger", "John Kendrew"] },
  ],
  // day 19 (2026-12-23)
  [
    { c: "Cells & Evolution", t: 1, q: "Which shallow, lidded dish is used to grow bacteria in labs?", a: "Petri dish", d: ["Test tube", "Beaker", "Flask"] },
    { c: "Cells & Evolution", t: 2, q: "What word describes a species that is still alive today, the opposite of extinct?", a: "Extant", d: ["Endemic", "Dormant", "Native"] },
    { c: "Cells & Evolution", t: 3, q: "Which organelle pumps excess water out of freshwater protists like the paramecium?", a: "Contractile vacuole", d: ["Food vacuole", "Lysosome", "Nucleolus"] },
    { c: "Cells & Evolution", t: 4, q: "What nickname is given to the most recent woman from whom all living humans descend through the mother's line?", a: "Mitochondrial Eve", d: ["Lucy", "Ardi", "Selam"] },
    { c: "Cells & Evolution", t: 5, q: "Which German biologist described cell division in detail and named it mitosis in 1882?", a: "Walther Flemming", d: ["Robert Koch", "Rudolf Virchow", "Theodor Boveri"] },
  ],
  // day 20 (2026-12-24)
  [
    { c: "Cells & Evolution", t: 1, q: "What word means any single living thing, from a bacterium to a blue whale?", a: "Organism", d: ["Molecule", "Element", "Compound"] },
    { c: "Cells & Evolution", t: 2, q: "What is the copying of a cell's DNA before it divides called?", a: "Replication", d: ["Transcription", "Translation", "Mutation"] },
    { c: "Cells & Evolution", t: 3, q: "Which five-carbon sugar is found in RNA?", a: "Ribose", d: ["Glucose", "Fructose", "Sucrose"] },
    { c: "Cells & Evolution", t: 4, q: "Geologists now use which name for the old 'K-T' layer that marks the dinosaurs' extinction?", a: "K-Pg boundary", d: ["P-T boundary", "Moho discontinuity", "Great Unconformity"] },
    { c: "Cells & Evolution", t: 5, q: "Which Soviet biochemist proposed in 1924 that life arose in a 'primordial soup' of simple chemicals?", a: "Alexander Oparin", d: ["J. B. S. Haldane", "Trofim Lysenko", "Nikolai Vavilov"] },
  ],
  // day 21 (2026-12-25)
  [
    { c: "Cells & Evolution", t: 1, q: "Long before birds and bats, which animals were the first to fly?", a: "Insects", d: ["Pterosaurs", "Fish", "Frogs"] },
    { c: "Cells & Evolution", t: 2, q: "What word describes a membrane that lets some substances pass through but not others?", a: "Semipermeable", d: ["Impermeable", "Opaque", "Insoluble"] },
    { c: "Cells & Evolution", t: 3, q: "In which era did the Cambrian explosion, the first land plants and the first reptiles all appear?", a: "Paleozoic", d: ["Mesozoic", "Cenozoic", "Proterozoic"] },
    { c: "Cells & Evolution", t: 4, q: "What are 'jumping genes', the stretches of DNA that can move to new places in a genome, called?", a: "Transposons", d: ["Plasmids", "Exons", "Telomeres"] },
    { c: "Cells & Evolution", t: 5, q: "Which idea says early life used RNA both to store genetic information and to speed up reactions, before DNA and proteins?", a: "RNA world hypothesis", d: ["Iron-sulfur world", "Panspermia", "Clay hypothesis"] },
  ],
  // day 22 (2026-12-26)
  [
    { c: "Cells & Evolution", t: 1, q: "Ichthyosaurs and plesiosaurs, which swam in dinosaur-age seas, were what kind of animal?", a: "Reptiles", d: ["Fish", "Mammals", "Amphibians"] },
    { c: "Cells & Evolution", t: 2, q: "What word describes microbes that can live without oxygen?", a: "Anaerobic", d: ["Aerobic", "Autotrophic", "Thermophilic"] },
    { c: "Cells & Evolution", t: 3, q: "What are matching pairs of chromosomes, one from each parent, called?", a: "Homologous chromosomes", d: ["Sister chromatids", "Sex chromosomes", "Plasmids"] },
    { c: "Cells & Evolution", t: 4, q: "Which mesh-like polymer of sugars and amino acids makes up the cell walls of bacteria?", a: "Peptidoglycan", d: ["Cellulose", "Chitin", "Lignin"] },
    { c: "Cells & Evolution", t: 5, q: "Which flat, ribbed Ediacaran fossil was shown in 2018 to be an animal, from traces of cholesterol?", a: "Dickinsonia", d: ["Charnia", "Spriggina", "Kimberella"] },
  ],
  // day 23 (2026-12-27)
  [
    { c: "Cells & Evolution", t: 1, q: "What does a typical gene carry the instructions to make?", a: "A protein", d: ["A fat", "A sugar", "A vitamin"] },
    { c: "Cells & Evolution", t: 2, q: "What is the variety of different gene versions within one species called?", a: "Genetic diversity", d: ["Gene flow", "Genetic drift", "Speciation"] },
    { c: "Cells & Evolution", t: 3, q: "Which enzyme builds an RNA copy of a gene during transcription?", a: "RNA polymerase", d: ["DNA polymerase", "Helicase", "Ligase"] },
    { c: "Cells & Evolution", t: 4, q: "What is the idea that the seeds of life reached Earth from space called?", a: "Panspermia", d: ["Abiogenesis", "Spontaneous generation", "Endosymbiosis"] },
    { c: "Cells & Evolution", t: 5, q: "What is the forming of a new species within the same area, with no geographic barrier, called?", a: "Sympatric speciation", d: ["Allopatric speciation", "Peripatric speciation", "Anagenesis"] },
  ],
  // day 24 (2026-12-28)
  [
    { c: "Cells & Evolution", t: 1, q: "When a buried bone slowly turns into a fossil, what replaces its material?", a: "Minerals", d: ["Ice", "Oil", "Sand"] },
    { c: "Cells & Evolution", t: 2, q: "Roughly how old is Earth?", a: "4.5 billion years", d: ["450 million years", "45 billion years", "4.5 million years"] },
    { c: "Cells & Evolution", t: 3, q: "Which Ice Age elephant relative had cone-shaped cusps on its teeth, unlike the flat, ridged teeth of a mammoth?", a: "Mastodon", d: ["Woolly rhinoceros", "Irish elk", "Cave bear"] },
    { c: "Cells & Evolution", t: 4, q: "What is the loss of genetic variety after a population is drastically cut down, as happened to cheetahs, called?", a: "Bottleneck effect", d: ["Founder effect", "Hybrid vigor", "Gene flow"] },
    { c: "Cells & Evolution", t: 5, q: "Carriers of the sickle cell allele being protected from malaria is a classic example of what?", a: "Heterozygote advantage", d: ["Genetic drift", "Founder effect", "Epistasis"] },
  ],
  // day 25 (2026-12-29)
  [
    { c: "Cells & Evolution", t: 1, q: "Which hard parts of animals most often survive to become fossils?", a: "Bones and teeth", d: ["Skin and hair", "Eyes and ears", "Muscles and fat"] },
    { c: "Cells & Evolution", t: 2, q: "What is treating a disease by adding or repairing genes in a patient's cells called?", a: "Gene therapy", d: ["Chemotherapy", "Vaccination", "Dialysis"] },
    { c: "Cells & Evolution", t: 3, q: "Early modern humans of Ice Age Europe are often named after which French rock shelter, where their remains were found in 1868?", a: "Cro-Magnon", d: ["Lascaux", "Chauvet", "La Chapelle"] },
    { c: "Cells & Evolution", t: 4, q: "Which of Mendel's laws says the genes for different traits are passed on separately from one another?", a: "Law of independent assortment", d: ["Law of segregation", "Law of dominance", "Law of conservation"] },
    { c: "Cells & Evolution", t: 5, q: "What is the reappearance of a long-lost ancestral trait, like a whale born with small hind legs, called?", a: "Atavism", d: ["Exaptation", "Convergence", "Vestigiality"] },
  ],
  // day 26 (2026-12-30)
  [
    { c: "Cells & Evolution", t: 1, q: "What are disease-causing microbes, such as some bacteria and viruses, called?", a: "Pathogens", d: ["Antibodies", "Probiotics", "Enzymes"] },
    { c: "Cells & Evolution", t: 2, q: "What do scientists add to a sample to make cell parts easier to see under a microscope?", a: "A stain", d: ["A coverslip", "A solvent", "An enzyme"] },
    { c: "Cells & Evolution", t: 3, q: "What is the study of how species are spread across the globe, and why, called?", a: "Biogeography", d: ["Cartography", "Topography", "Demography"] },
    { c: "Cells & Evolution", t: 4, q: "What is the mix of DNA and proteins that makes up chromosomes called?", a: "Chromatin", d: ["Chitin", "Cytosol", "Collagen"] },
    { c: "Cells & Evolution", t: 5, q: "What is the inactivated, tightly packed X chromosome seen in a female mammal's cells called?", a: "Barr body", d: ["Polar body", "Golgi body", "Nissl body"] },
  ],
  // day 27 (2026-12-31)
  [
    { c: "Cells & Evolution", t: 1, q: "Which dinosaur, made famous by a 1993 movie, was in reality only about the size of a turkey?", a: "Velociraptor", d: ["Tyrannosaurus", "Spinosaurus", "Allosaurus"] },
    { c: "Cells & Evolution", t: 2, q: "What are unspecialized cells that can develop into many different types of cell called?", a: "Stem cells", d: ["Germ cells", "Blood cells", "Nerve cells"] },
    { c: "Cells & Evolution", t: 3, q: "Which view of evolution holds that species change slowly and steadily through many tiny steps?", a: "Gradualism", d: ["Punctuated equilibrium", "Catastrophism", "Saltationism"] },
    { c: "Cells & Evolution", t: 4, q: "In which last phase of mitosis do new nuclear envelopes form around the two sets of chromosomes?", a: "Telophase", d: ["Prophase", "Metaphase", "Anaphase"] },
    { c: "Cells & Evolution", t: 5, q: "What protein structure on a chromosome's centromere attaches it to the spindle fibers?", a: "Kinetochore", d: ["Centrosome", "Nucleosome", "Telomere"] },
  ],
];
