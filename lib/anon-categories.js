// The closed-category lexicon behind Anon.
//
// A category earns its place by being SMALL, not by being closed. "Animal" is closed
// in principle and useless in practice: animal-6 admits forty words, so it tells the
// solver nothing. What works is a set you can recite in full, where category plus
// length lands on four candidates or fewer, which is the cap scripts/verify-anon.mjs
// enforces. So this is deliberately a long list of tiny sets rather than a short list
// of big ones. US spellings only, per authoring rule 8.
export const CLOSED = {
  "planet": "mercury venus earth mars jupiter saturn uranus neptune",
  "ocean": "atlantic pacific arctic indian southern",
  "continent": "africa asia europe antarctica australia",
  "chess piece": "pawn rook knight bishop queen king",
  "card suit": "hearts spades clubs diamonds",
  "compass point": "north south east west northeast northwest southeast southwest",
  "season": "spring summer autumn winter",
  "month": "january february march april may june july august september october november december",
  "weekday": "monday tuesday wednesday thursday friday saturday sunday",
  "zodiac sign": "aries taurus gemini cancer leo virgo libra scorpio sagittarius capricorn aquarius pisces",
  "great lake": "superior michigan huron erie ontario",
  "us coin": "penny nickel dime quarter dollar",
  "primary color": "red yellow blue",
  "rainbow color": "red orange yellow green blue indigo violet",
  "state of matter": "solid liquid gas plasma",
  "blood type": "positive negative",
  "musical note": "treble tonic octave chord scale",
  "chess outcome": "checkmate stalemate draw",
  "color": "scarlet crimson maroon navy teal olive amber ivory beige coral silver bronze lilac lavender turquoise magenta",
  "metal": "iron steel copper bronze silver gold lead tin zinc nickel cobalt platinum brass pewter",
  "gem": "diamond ruby emerald sapphire opal pearl topaz amber jade garnet amethyst",
  "shape": "circle square triangle oval sphere cube cone spiral hexagon diamond",
  "element": "hydrogen helium lithium boron carbon nitrogen oxygen neon sodium silicon sulfur argon calcium titanium chromium cobalt arsenic selenium iodine xenon barium radium uranium",
  "body part": "head neck chest elbow wrist ankle shoulder throat skull thumb finger thigh knee shin heel liver heart lung kidney tongue cheek chin tooth waist nostril tendon artery stomach",
  "relative": "mother father sister brother uncle aunt cousin nephew niece daughter",
  "sense": "sight hearing smell taste touch",
  "limb": "arm leg hand foot",
  "tree": "oak elm ash cedar birch willow maple pine spruce alder beech aspen walnut chestnut hazel holly larch sycamore",
  "flower": "rose tulip daisy lily orchid violet iris lilac aster peony dahlia poppy carnation lotus jasmine",
  "bird": "robin raven eagle heron finch swallow sparrow crow hawk falcon stork crane wren thrush vulture osprey condor pigeon parrot",
  "fish": "salmon trout tuna cod bass herring haddock sardine anchovy carp perch shark eel halibut",
  "insect": "beetle wasp hornet moth locust weevil termite aphid cicada mantis",
  "weather": "rain snow sleet hail frost thunder lightning drizzle blizzard breeze gale storm fog mist cloud shower",
  "landform": "valley canyon plateau ridge summit glacier delta dune marsh fjord isthmus",
  "instrument": "violin cello flute oboe clarinet trumpet trombone tuba harp piano organ banjo fiddle viola lute guitar",
  "tool": "hammer chisel wrench pliers drill anvil shovel rake trowel ladder clamp",
  "garment": "trousers jacket coat blouse dress skirt scarf glove sweater vest apron cloak shawl",
  "furniture": "chair table stool bench couch dresser cabinet wardrobe bureau",
  "vehicle": "wagon carriage bicycle tractor trolley scooter chariot sledge",
  "boat": "canoe yacht ferry barge trawler schooner tanker raft dinghy",
  "building": "castle cottage cathedral tavern barn mill chapel palace stable",
  "room": "kitchen cellar attic study library lounge pantry hallway bedroom",
  "occupation": "doctor nurse lawyer teacher farmer sailor tailor butcher baker barber welder dentist chemist author editor waiter janitor cashier architect historian librarian",
  "military rank": "soldier sergeant colonel admiral captain corporal general private cadet marine",
  "sport": "tennis soccer cricket rugby hockey golf boxing rowing sailing archery fencing curling",
  "dance": "waltz tango salsa rumba ballet polka",
  "crime": "theft arson fraud burglary robbery forgery treason bribery assault perjury larceny murder",
  "fruit": "apple orange banana cherry lemon lime peach pear plum grape melon apricot avocado fig berry",
  "vegetable": "carrot potato onion celery turnip parsnip cabbage spinach lettuce radish pumpkin",
  "drink": "water coffee juice cider wine beer brandy lemonade cocoa ale",
  "spice": "pepper cinnamon nutmeg clove ginger saffron paprika vanilla",
  "meal": "breakfast lunch dinner supper brunch",
  // --- added 2026-08-24: the warm-bank tier. Anon's top-10 finishers were
  // ending on 48% of the board while Crux, Emcee and Garble's were ending on
  // 100%, and the cause was the closed pool, not the passages: only 221 words
  // in this file were both common enough for the generator to place and sharp
  // at their length, so a board could seat about 9 categories out of 21
  // answers. These add 238 more. Every one was hand-checked against the
  // LANGUAGE, not against its own line: nine proposals whose real set runs
  // past four at some length (emotion, illness, weapon, musical genre,
  // cooking method, dessert, bread, body of water, space object) were cut,
  // because the cap is only worth enforcing if it is true outside this file.
  "greek letter": "alpha beta gamma delta epsilon zeta theta iota kappa lambda sigma omega omicron upsilon",
  "grammar term": "noun verb adjective adverb pronoun clause phrase suffix prefix tense plural syntax",
  "punctuation mark": "comma period colon semicolon dash hyphen apostrophe bracket quotation",
  "poem form": "sonnet haiku ballad ode elegy limerick epic lyric verse",
  "subatomic particle": "proton neutron electron photon quark neutrino positron",
  "planet moon": "europa titan triton phobos deimos callisto ganymede charon",
  "rock type": "granite marble slate basalt limestone sandstone shale quartz obsidian",
  "map feature": "border coast island peninsula cape archipelago mainland",
  "time unit": "second minute hour week decade century millennium fortnight",
  "tooth type": "incisor canine molar premolar",
  "finger": "thumb index middle ring pinky",
  "farm animal": "cow pig sheep goat horse hen duck goose donkey",
  "baby animal": "calf lamb foal kitten puppy chick cub piglet gosling",
  "animal group": "herd flock swarm pack pride gaggle colony",
  "horse gait": "walk trot canter gallop",
  "rodent": "mouse rat squirrel beaver hamster gerbil marmot",
  "reptile": "snake lizard turtle crocodile alligator tortoise iguana",
  "shellfish": "crab lobster shrimp oyster clam mussel scallop",
  "nut": "almond walnut pecan cashew hazelnut peanut acorn",
  "herb": "basil thyme sage mint parsley oregano rosemary dill",
  "grain": "wheat barley oats rye corn rice millet sorghum",
  "dairy": "milk cheese butter cream yogurt curd whey",
  "liquor": "whiskey rum vodka gin bourbon scotch tequila",
  "footwear": "boot shoe sandal slipper sneaker clog moccasin loafer",
  "headwear": "hat cap helmet bonnet turban beret hood crown veil",
  "jewelry": "ring necklace bracelet brooch earring pendant locket bangle",
  "cutlery": "fork knife spoon ladle spatula tongs whisk",
  "tableware": "plate bowl cup saucer mug platter tureen",
  "kitchen appliance": "oven stove kettle toaster blender freezer microwave",
  "bedding": "pillow blanket quilt sheet mattress bolster",
  "writing implement": "pen pencil quill crayon marker chalk stylus",
  "armor": "helmet shield gauntlet visor breastplate",
  "currency": "dollar pound euro yen franc peso ruble rupee lira",
  "ship part": "mast deck hull sail anchor rudder keel bow stern",
  "castle part": "tower moat gate keep turret drawbridge dungeon rampart",
  "church part": "altar pew nave aisle steeple pulpit crypt belfry",
  "house part": "roof wall floor door window ceiling stair chimney porch",
  "car part": "engine wheel brake clutch bumper hood trunk axle",
  "road type": "street avenue lane road boulevard alley highway path trail",
  "royal title": "king queen prince princess duke duchess earl baron count",
  "religious title": "imam rabbi bishop priest pastor monk abbot deacon cardinal friar",
  "legal role": "judge jury witness plaintiff defendant bailiff",
  "army unit": "squad platoon company battalion regiment brigade division",
  "government body": "senate congress parliament cabinet court",
  "school subject": "math science history geography arithmetic grammar",
  "voice type": "soprano alto tenor bass baritone",
  "circus performer": "clown acrobat juggler magician",
  "playing card": "ace king queen jack joker",
  "baseball position": "pitcher catcher shortstop outfield infield",
  "martial art": "judo karate sumo aikido kendo",
  // --- added 2026-11-02 after a content review of the Nov 7-30 restock: the
  // correct homes for words that older boards print under a looser label (see
  // LEGACY below). Each still admits at most four words at any length.
  "noble title": "duke duchess earl baron count marquis viscount countess",
  "baseball term": "infield outfield bunt inning strike homer dugout bullpen",
  "music term": "chord tempo rhythm melody harmony octave scale",
  "kitchen utensil": "spatula ladle whisk tongs grater peeler colander sieve",
  "poetry term": "verse stanza rhyme meter couplet",
  "monastic role": "monk nun friar abbot abbess prior novice",
  "digit": "thumb finger toe",
};

// Category memberships that are WRONG and are kept only because boards already
// banked print them, so scripts/verify-anon.mjs still finds the word in the
// category and those frozen boards stay byte-identical. scripts/gen-anon.mjs
// never seats a word under a category listed here; it uses the correct home
// above (or leaves the word open). Found by the 2026-11-02 content review:
// a peer is not royalty, the infield is not a position, a chord is not a note,
// a spatula is not cutlery, a path or trail is not a road (and ROAD under
// "road type" names its own answer), verse is not a poem form, a monk holds no
// title, and a thumb is a digit before it is a finger.
export const LEGACY = {
  "royal title": "duke duchess earl baron count",
  "baseball position": "infield outfield",
  "musical note": "chord scale",
  "cutlery": "spatula ladle whisk tongs",
  "road type": "road path trail",
  "poem form": "verse",
  "religious title": "monk friar",
  "finger": "thumb",
};

export function catCandidates(cat, n) {
  return (CLOSED[cat] || '').split(' ').filter((w) => w.length === n);
}
