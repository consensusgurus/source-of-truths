const C = "Plants";
const Q = (t, q, a, d) => ({ c: C, t, q, a, d });

export const LANE_DAYS = [
  // day 1
  [
    Q(1, "Which gas do plants take in from the air to make sugars using sunlight?", "Carbon dioxide", ["Oxygen", "Nitrogen", "Hydrogen"]),
    Q(2, "Which part of a plant mainly absorbs water and minerals from the soil?", "Roots", ["Stems", "Leaves", "Flowers"]),
    Q(3, "Peas, beans and lentils all belong to which plant family?", "Fabaceae", ["Solanaceae", "Rosaceae", "Brassicaceae"]),
    Q(4, "Which Swedish naturalist devised the two-part Latin naming system still used for plants?", "Carl Linnaeus", ["Charles Darwin", "Gregor Mendel", "Joseph Banks"]),
    Q(5, "Which tissue in vascular plants carries sugars made in the leaves to the rest of the plant?", "Phloem", ["Xylem", "Cambium", "Pith"]),
  ],
  // day 2
  [
    Q(1, "What sweet liquid do bees collect from flowers to turn into honey?", "Nectar", ["Sap", "Resin", "Dew"]),
    Q(2, "What is the name of the green pigment in leaves that captures sunlight?", "Chlorophyll", ["Carotene", "Melanin", "Anthocyanin"]),
    Q(3, "The fiber used to weave linen comes from the stems of which plant?", "Flax", ["Hemp", "Jute", "Cotton"]),
    Q(4, "What is the term for a plant that completes its life cycle over two years, usually flowering in the second?", "Biennial", ["Annual", "Perennial", "Ephemeral"]),
    Q(5, "In ferns, what is the small, heart-shaped, free-living gametophyte stage called?", "Prothallus", ["Sporangium", "Frond", "Rhizome"]),
  ],
  // day 3
  [
    Q(1, "Which tree produces acorns?", "Oak", ["Maple", "Birch", "Elm"]),
    Q(2, "Which flower's name comes from the Old English for day's eye?", "Daisy", ["Daffodil", "Dandelion", "Marigold"]),
    Q(3, "Pines, firs and other cone-bearing trees belong to which group of seed plants?", "Gymnosperms", ["Angiosperms", "Bryophytes", "Pteridophytes"]),
    Q(4, "Which carnivorous plant snaps its hinged leaf lobes shut on prey?", "Venus flytrap", ["Pitcher plant", "Sundew", "Bladderwort"]),
    Q(5, "Which metal ion sits at the center of a chlorophyll molecule?", "Magnesium", ["Iron", "Calcium", "Zinc"]),
  ],
  // day 4
  [
    Q(1, "What name is given to the process by which plants use sunlight to make their own food?", "Photosynthesis", ["Respiration", "Germination", "Pollination"]),
    Q(2, "In a flower, which structure at the base of the pistil holds the ovules?", "Ovary", ["Petal", "Sepal", "Stamen"]),
    Q(3, "Which layer of cells adds girth to a tree trunk by producing new wood each year?", "Vascular cambium", ["Pith", "Epidermis", "Cortex"]),
    Q(4, "Which botanist sailed on Captain Cook's Endeavour voyage and collected thousands of plant specimens?", "Joseph Banks", ["Joseph Hooker", "Alexander von Humboldt", "David Douglas"]),
    Q(5, "What is the term for a plant that grows on another plant for support without taking nutrients from it?", "Epiphyte", ["Halophyte", "Saprophyte", "Xerophyte"]),
  ],
  // day 5
  [
    Q(1, "Which of these trees bears cones?", "Pine", ["Birch", "Elm", "Poplar"]),
    Q(2, "What fine powder released by flowers causes hay fever in many people?", "Pollen", ["Spores", "Nectar", "Resin"]),
    Q(3, "In a germinating seed, which part develops into the first root?", "Radicle", ["Cotyledon", "Plumule", "Hilum"]),
    Q(4, "The cotton plant belongs to which genus?", "Gossypium", ["Linum", "Cannabis", "Corchorus"]),
    Q(5, "Which Russian botanist and geneticist gathered seeds from around the world to build a major seed collection in Leningrad?", "Nikolai Vavilov", ["Trofim Lysenko", "Ivan Michurin", "Dmitri Mendeleev"]),
  ],
  // day 6
  [
    Q(1, "Which evergreen climbing plant clings to old stone walls with tiny rootlets?", "Ivy", ["Fern", "Moss", "Thistle"]),
    Q(2, "Which seedless plants reproduce by spores and are known for their feathery fronds?", "Ferns", ["Cacti", "Grasses", "Palms"]),
    Q(3, "Apples, strawberries and almonds all belong to which plant family?", "Rosaceae", ["Solanaceae", "Brassicaceae", "Lamiaceae"]),
    Q(4, "Which complex polymer stiffens plant cell walls and makes wood hard?", "Lignin", ["Chitin", "Keratin", "Amylose"]),
    Q(5, "In double fertilization in flowering plants, one sperm produces the zygote and the other helps form which nutritive tissue?", "Endosperm", ["Pericarp", "Testa", "Cotyledon"]),
  ],
  // day 7
  [
    Q(1, "Besides light and a gas from the air, what raw material do plants need to make their food?", "Water", ["Sulfur", "Methane", "Ammonia"]),
    Q(2, "Which Mediterranean evergreen oak has thick bark that is harvested roughly every nine years without killing the tree?", "Cork oak", ["Holm oak", "Kermes oak", "Valonia oak"]),
    Q(3, "Mosses and liverworts belong to which plant group?", "Bryophytes", ["Pteridophytes", "Gymnosperms", "Angiosperms"]),
    Q(4, "A ripe banana in a paper bag speeds up nearby fruit by releasing which gaseous plant hormone?", "Ethylene", ["Auxin", "Gibberellin", "Cytokinin"]),
    Q(5, "CAM photosynthesis takes its name from which plant family?", "Crassulaceae", ["Cactaceae", "Bromeliaceae", "Poaceae"]),
  ],
  // day 8
  [
    Q(1, "Which thorny flower is the traditional emblem of Valentine's Day?", "Rose", ["Daisy", "Lily", "Poppy"]),
    Q(2, "What are the tiny pores on leaves that let gases pass in and out?", "Stomata", ["Tendrils", "Veins", "Spines"]),
    Q(3, "A lichen is a partnership between which two kinds of organisms?", "A fungus and an alga", ["A moss and a fern", "A fern and a fungus", "Two kinds of algae"]),
    Q(4, "Peat moss forms deep deposits mainly in which kind of habitat?", "Bogs", ["Deserts", "Alpine meadows", "Salt marshes"]),
    Q(5, "Agar, the gel used in laboratory culture dishes, is extracted from which group of seaweeds?", "Red algae", ["Brown algae", "Green algae", "Diatoms"]),
  ],
  // day 9
  [
    Q(1, "Which of these is a freshly germinated young plant with its first leaves?", "Seedling", ["Tuber", "Bulb", "Rhizome"]),
    Q(2, "The leaf on the Canadian flag comes from which tree?", "Maple", ["Oak", "Birch", "Poplar"]),
    Q(3, "What is a plant called that is adapted to live in salty soil?", "Halophyte", ["Epiphyte", "Xerophyte", "Hydrophyte"]),
    Q(4, "Quaking aspen belongs to which tree genus?", "Populus", ["Salix", "Betula", "Quercus"]),
    Q(5, "Which Scottish plant collector sent seeds of a famous Pacific Northwest fir to Britain in 1827?", "David Douglas", ["Robert Fortune", "George Forrest", "Ernest Wilson"]),
  ],
  // day 10
  [
    Q(1, "Under which plant is it traditional to share a kiss at Christmas?", "Mistletoe", ["Holly", "Ivy", "Fir"]),
    Q(2, "What is a plant called that lives for many years and regrows each season?", "Perennial", ["Annual", "Biennial", "Deciduous"]),
    Q(3, "Which African tree is nicknamed the upside-down tree because its bare branches look like roots?", "Baobab", ["Banyan", "Kapok", "Acacia"]),
    Q(4, "Which spring flower grows from a corm rather than a true bulb?", "Crocus", ["Tulip", "Daffodil", "Hyacinth"]),
    Q(5, "The strange two-leaved plant Welwitschia mirabilis is native to which desert?", "Namib", ["Sahara", "Atacama", "Gobi"]),
  ],
  // day 11
  [
    Q(1, "What are the thin green blades that cover a lawn?", "Grass", ["Moss", "Clover", "Fern"]),
    Q(2, "What is the male reproductive part of a flower called?", "Stamen", ["Pistil", "Sepal", "Carpel"]),
    Q(3, "Sunflower seedlings and windowsill herbs lean toward a window because of which growth response?", "Phototropism", ["Gravitropism", "Thigmotropism", "Hydrotropism"]),
    Q(4, "Tomatoes, potatoes and nightshades belong to which plant family?", "Solanaceae", ["Brassicaceae", "Cucurbitaceae", "Lamiaceae"]),
    Q(5, "Which botanist and close friend of Darwin collected rhododendrons in Sikkim in 1848 and 1849?", "Joseph Dalton Hooker", ["Asa Gray", "Alfred Russel Wallace", "William Bartram"]),
  ],
  // day 12
  [
    Q(1, "What are the colorful outer parts of most flowers called?", "Petals", ["Roots", "Thorns", "Seeds"]),
    Q(2, "Which shy plant folds its leaflets when touched?", "Mimosa pudica", ["Aloe vera", "Ficus elastica", "Mentha spicata"]),
    Q(3, "What is the gardening technique of joining a shoot of one plant onto the rootstock of another?", "Grafting", ["Pruning", "Mulching", "Coppicing"]),
    Q(4, "Which part of a tree trunk is the dense inner wood that no longer carries water?", "Heartwood", ["Sapwood", "Cambium", "Phloem"]),
    Q(5, "The titan arum and the peace lily both belong to which plant family?", "Araceae", ["Rafflesiaceae", "Orchidaceae", "Aristolochiaceae"]),
  ],
  // day 13
  [
    Q(1, "Which tree is known for its long, drooping branches and often grows beside water?", "Willow", ["Pine", "Oak", "Cedar"]),
    Q(2, "What are the small green leaf-like parts that enclose a flower bud called?", "Sepals", ["Stigmas", "Anthers", "Styles"]),
    Q(3, "Which 18th-century English landscape gardener was nicknamed Capability?", "Lancelot Brown", ["Humphry Repton", "William Kent", "Joseph Paxton"]),
    Q(4, "Which English scientist used the word cell in 1665 after examining thin slices of bark under a microscope?", "Robert Hooke", ["Antonie van Leeuwenhoek", "Matthias Schleiden", "Robert Brown"]),
    Q(5, "Which term describes the way a tree drops its leaves, fruit or petals along a weak layer of cells?", "Abscission", ["Transpiration", "Germination", "Dehiscence"]),
  ],
  // day 14
  [
    Q(1, "Which spiky succulent has a soothing gel inside its leaves that people rub on sunburn?", "Aloe vera", ["Jade plant", "Yucca", "Agave"]),
    Q(2, "What is the method of growing plants in nutrient solution instead of soil called?", "Hydroponics", ["Aquaculture", "Permaculture", "Monoculture"]),
    Q(3, "In botany, which term names the stalk of a leaf, as opposed to the flat blade?", "Petiole", ["Pedicel", "Peduncle", "Stipule"]),
    Q(4, "Which ancient Greek author wrote Enquiry into Plants and Causes of Plants?", "Theophrastus", ["Dioscorides", "Pliny the Elder", "Galen"]),
    Q(5, "Which term describes roots that grow upward out of waterlogged mud to take in air, as in mangroves and bald cypress?", "Pneumatophores", ["Haustoria", "Rhizoids", "Stolons"]),
  ],
  // day 15
  [
    Q(1, "What are the sharp pointed structures on a cactus, which are modified leaves?", "Spines", ["Petals", "Roots", "Fronds"]),
    Q(2, "Sakura, celebrated every spring in Japan, are the blossoms of which tree?", "Cherry", ["Plum", "Magnolia", "Peach"]),
    Q(3, "Bamboo, wheat and rice all belong to which plant family?", "Poaceae", ["Cyperaceae", "Juncaceae", "Typhaceae"]),
    Q(4, "Which head gardener at Chatsworth went on to design the Crystal Palace?", "Joseph Paxton", ["Decimus Burton", "Humphry Repton", "William Robinson"]),
    Q(5, "Fossils from the Rhynie chert in Scotland preserve which genus of early land plants?", "Rhynia", ["Lepidodendron", "Archaeopteris", "Calamites"]),
  ],
  // day 16
  [
    Q(1, "Which yellow-flowered weed turns into a white puffball of seeds?", "Dandelion", ["Buttercup", "Clover", "Thistle"]),
    Q(2, "What is the layer of material spread over garden soil to hold in moisture and block weeds?", "Mulch", ["Trellis", "Topsoil", "Fertilizer"]),
    Q(3, "Betula is the Latin genus name of which tree?", "Birch", ["Beech", "Alder", "Hazel"]),
    Q(4, "Andrew Ellicott Douglass founded which field of study, based on matching patterns in tree rings?", "Dendrochronology", ["Palynology", "Phenology", "Dendrology"]),
    Q(5, "The Old World tropical pitcher plants belong to which genus?", "Nepenthes", ["Sarracenia", "Drosera", "Utricularia"]),
  ],
  // day 17
  [
    Q(1, "Which of these is a fungus rather than a plant?", "Mushroom", ["Fern", "Moss", "Cactus"]),
    Q(2, "Narcissus is the genus of which common spring bulb?", "Daffodil", ["Tulip", "Hyacinth", "Snowdrop"]),
    Q(3, "Which London botanic garden in Richmond was named a UNESCO World Heritage Site in 2003?", "Kew Gardens", ["Chelsea Physic Garden", "Wisley", "Hampton Court"]),
    Q(4, "Truffles and many forest fungi trade soil nutrients for sugars through which kind of root partnership?", "Mycorrhiza", ["Lichen", "Nodule", "Rhizome"]),
    Q(5, "Which genus of bacteria forms nitrogen-fixing nodules on the roots of legumes?", "Rhizobium", ["Bacillus", "Nitrosomonas", "Clostridium"]),
  ],
  // day 18
  [
    Q(1, "What can be counted in a cut tree trunk to estimate how old the tree was?", "Growth rings", ["Branches", "Leaves", "Thorns"]),
    Q(2, "What word describes a plant growing where a gardener does not want it?", "Weed", ["Shrub", "Herb", "Vine"]),
    Q(3, "The spice saffron is harvested from which part of the crocus flower?", "Stigmas", ["Anthers", "Petals", "Sepals"]),
    Q(4, "Which plant hormone, first isolated from a fungus that caused rice seedlings to grow abnormally tall, promotes stem elongation?", "Gibberellin", ["Auxin", "Abscisic acid", "Cytokinin"]),
    Q(5, "In which year did Linnaeus publish Species Plantarum, the starting point of modern botanical naming?", "1753", ["1735", "1759", "1768"]),
  ],
  // day 19
  [
    Q(1, "Which tall garden plant has a huge yellow flower head full of seeds that are roasted as a snack?", "Sunflower", ["Daisy", "Dahlia", "Marigold"]),
    Q(2, "What are the thin coiling organs that a pea plant uses to climb called?", "Tendrils", ["Thorns", "Stolons", "Bracts"]),
    Q(3, "The upward pull of water through a plant is driven mainly by which process at the leaf surface?", "Transpiration", ["Respiration", "Guttation", "Translocation"]),
    Q(4, "Which tree genus, native to the Amazon, is the main source of natural rubber latex?", "Hevea", ["Theobroma", "Ficus", "Eucalyptus"]),
    Q(5, "Which of these crops uses C4 photosynthesis?", "Maize", ["Wheat", "Rice", "Soybean"]),
  ],
  // day 20
  [
    Q(1, "Which part of a plant does most of the photosynthesis?", "Leaves", ["Roots", "Seeds", "Bark"]),
    Q(2, "What word describes a tree that sheds all its leaves every year?", "Deciduous", ["Evergreen", "Coniferous", "Succulent"]),
    Q(3, "The bark of which tree was the original source of quinine?", "Cinchona", ["Hevea", "Salix", "Eucalyptus"]),
    Q(4, "Mint, sage and lavender belong to which plant family?", "Lamiaceae", ["Apiaceae", "Asteraceae", "Boraginaceae"]),
    Q(5, "Which botanist, who led the Leiden botanic garden in the 1590s, helped establish tulip growing in the Netherlands?", "Carolus Clusius", ["Rembert Dodoens", "Matthias de l'Obel", "Leonhart Fuchs"]),
  ],
  // day 21
  [
    Q(1, "Which spiky-leaved evergreen with red berries is a classic Christmas decoration?", "Holly", ["Ivy", "Fir", "Yew"]),
    Q(2, "Bonsai is the Japanese art of growing miniature versions of what?", "Trees", ["Vegetables", "Orchids", "Grasses"]),
    Q(3, "Fraxinus is the Latin genus name of which tree?", "Ash", ["Elm", "Alder", "Linden"]),
    Q(4, "Which pigment gives autumn leaves and many berries their red and purple colors?", "Anthocyanin", ["Carotene", "Xanthophyll", "Chlorophyll"]),
    Q(5, "Which court painter to Empress Josephine, nicknamed the Raphael of flowers, illustrated Les Roses?", "Pierre-Joseph Redouté", ["Georg Ehret", "Maria Sibylla Merian", "Basilius Besler"]),
  ],
  // day 22
  [
    Q(1, "Which red flower is worn in Britain each November to remember war dead?", "Poppy", ["Rose", "Tulip", "Carnation"]),
    Q(2, "Which plant did Gregor Mendel use for his famous heredity experiments?", "Garden pea", ["Maize", "Snapdragon", "Primrose"]),
    Q(3, "Ulmus is the Latin genus name of which tree?", "Elm", ["Alder", "Linden", "Hornbeam"]),
    Q(4, "What is the botanical term for a fleshy fruit, like a cherry or peach, with a hard stony pit around its seed?", "Drupe", ["Berry", "Pome", "Achene"]),
    Q(5, "Fern spore cases are grouped in dots or lines beneath the frond, and each such group is known by what term?", "Sori", ["Strobili", "Gemmae", "Antheridia"]),
  ],
];
