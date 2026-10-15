// scripts/scram-pools.mjs — the vocabulary Scram's bank is dealt from.
//
// One BROAD theme a day (owner, 2026-10-14: "make them more broad categories
// so that it's not easy"). A theme is only as good as its pool is deep, so a
// narrow list (Fruits, Birds) is folded into a broad one (Food, Animals).
//
//   label     what the board prints as "Today's theme"
//   sunday    whether the theme is deep enough in 8+ letter answers to carry a
//             Sunday Edition
//   words     candidate answers, whitespace separated. A multi-word answer is
//             written with underscores (Cape_Town) and printed with spaces.
//             Plain letters only, US spellings, no accents, no punctuation, no
//             abbreviations. Case does not matter.
//   alsoValid real members of the theme that are NEVER dealt as answers. They
//             exist only for the collision check: a word whose letters also
//             spell another member of its theme (LEMON / MELON, DIANA / NADIA)
//             has two right answers on a board that accepts one, so the
//             generator drops BOTH sides of every such pair. Listing the other
//             side here is how a pair the pool does not otherwise carry gets
//             caught. scripts/verify-scram.mjs re-checks every board against
//             the full union.
//
// FAMILIARITY (owner, 2026-10-15): every answer must be one an ordinary
// American player has heard of. Breadth comes from the theme, never from an
// obscure member of it (Kinshasa, Djibouti, zither and canasta were all cut).
//
// Add words freely; the generator never reuses an answer inside a bank, so a
// deeper pool simply means a longer runway.

export const THEMES = [
  {
    id: 'cities', label: 'Cities', sunday: true,
    words: `Lisbon Madrid Barcelona Seville Valencia Paris Marseille Bordeaux London Manchester Liverpool
      Edinburgh Glasgow Dublin Belfast Cardiff Amsterdam Rotterdam Brussels  Berlin Munich Hamburg
      Frankfurt Cologne Dresden Vienna Salzburg Zurich Geneva Prague Warsaw Krakow Budapest Bucharest
        Athens Istanbul  Milan Naples Venice Florence   Bologna Verona
      Copenhagen Stockholm Helsinki Reykjavik Moscow    Cairo Alexandria Casablanca
      Marrakesh   Lagos Nairobi      Johannesburg Cape_Town 
      Tokyo Osaka Kyoto Yokohama  Seoul  Beijing Shanghai  Hong_Kong Taipei Manila Bangkok
      Hanoi Jakarta Singapore Mumbai Delhi   Bangalore    Kabul Tehran
      Baghdad Riyadh  Dubai Abu_Dhabi Doha  Jerusalem Tel_Aviv Beirut Damascus  Sydney
      Melbourne Brisbane Perth Adelaide Auckland Wellington Toronto Montreal Vancouver Calgary Ottawa
      Winnipeg Quebec Edmonton Halifax Mexico_City Cancun Tijuana Guadalajara Havana Kingston Bogota
         Santiago Buenos_Aires  Sao_Paulo Rio_de_Janeiro  
       New_York Boston Chicago Houston Phoenix Dallas Austin Denver Seattle Portland Atlanta Miami
      Orlando Tampa Detroit Cleveland Columbus Cincinnati Pittsburgh Philadelphia Baltimore Nashville
      Memphis Louisville Charlotte Raleigh Richmond Savannah Charleston New_Orleans San_Antonio El_Paso 
      Albuquerque Tucson Las_Vegas Los_Angeles San_Diego San_Francisco San_Jose Sacramento Oakland Honolulu
      Anchorage Minneapolis Milwaukee Omaha Kansas_City Saint_Louis Indianapolis Tulsa Buffalo Hartford
      Providence Newark Jacksonville Birmingham Boise  Salt_Lake_City   Des_Moines 
      Little_Rock Baton_Rouge Lexington Knoxville Chattanooga   Lucerne Bruges 
       Porto Seville Krakow  Oxford Cambridge Bristol    Brighton`,
    // Kampala and Kinshasa ran on 2026-10-15 (played, frozen) and were cut for
    // familiarity the same day; they stay here so that board still verifies.
    alsoValid: 'Lima Oslo Riga Kyiv Rome Lyon Nice Bern Baku Doha Reno Waco Lodz Kampala Kinshasa',
  },
  {
    id: 'countries', label: 'Countries', sunday: true,
    words: `Afghanistan Albania Algeria Andorra Angola Argentina Armenia Australia Austria Azerbaijan Bahamas
      Bahrain Bangladesh Barbados Belarus Belgium Belize  Bhutan Bolivia Botswana Brazil Bulgaria
       Cambodia Cameroon Canada Chile China Colombia  Congo Costa_Rica Croatia Cyprus Denmark
        Ecuador Egypt El_Salvador  Estonia  Ethiopia Finland France 
      Gambia Georgia Germany Ghana Greece Grenada Guatemala Guinea Guyana Haiti Honduras Hungary Iceland
      India Indonesia Ireland Israel Italy Jamaica Japan Jordan Kazakhstan Kenya  Kosovo Kuwait
       Latvia Lebanon  Liberia Libya Lithuania Luxembourg Madagascar  Malaysia
      Maldives Malta  Mauritius Mexico  Monaco Mongolia Montenegro Morocco Mozambique
      Myanmar Namibia Nepal Netherlands New_Zealand Nicaragua Niger Nigeria North_Korea Norway Pakistan
      Panama Paraguay Philippines Poland Portugal Qatar Romania Russia Rwanda  Saudi_Arabia Senegal
      Serbia Seychelles Singapore Slovakia Slovenia Somalia South_Africa South_Korea Spain Sri_Lanka Sudan
       Sweden Switzerland Syria Taiwan Tanzania Thailand Tunisia Turkey Uganda Ukraine Uruguay
      Uzbekistan  Venezuela Vietnam Yemen Zambia Zimbabwe   Liechtenstein`,
    alsoValid: 'Iran Iraq Peru Chad Cuba Fiji Laos Mali Oman Togo Tonga',
  },
  {
    id: 'states', label: 'U.S. States', sunday: true,
    words: `Alabama Alaska Arizona Arkansas California Colorado Connecticut Delaware Florida Georgia Hawaii
      Idaho Illinois Indiana Kansas Kentucky Louisiana Maine Maryland Massachusetts Michigan Minnesota
      Mississippi Missouri Montana Nebraska Nevada New_Hampshire New_Jersey New_Mexico New_York 
      North_Carolina North_Dakota Oklahoma Oregon Pennsylvania Rhode_Island South_Carolina South_Dakota 
      Tennessee Texas Vermont Virginia Washington West_Virginia Wisconsin Wyoming`,
    alsoValid: 'Iowa Ohio Utah',
  },
  {
    id: 'food', label: 'Food', sunday: true,
    words: `pizza pasta burger burrito lasagna ravioli risotto gnocchi spaghetti linguine lobster shrimp salmon
      sardine oyster scallop mussels sushi ramen tempura dumpling noodles curry  falafel hummus kebab
      paella quiche croissant baguette bagel pretzel muffin pancake waffle omelet bacon sausage steak
      brisket meatloaf meatball nachos quesadilla enchilada tamale guacamole salsa popcorn cracker biscuit
      cookie brownie cupcake cheesecake pudding custard sorbet gelato fudge caramel toffee licorice
      marshmallow doughnut cereal oatmeal granola yogurt cheese butter mozzarella cheddar parmesan gouda
      apple banana orange grape cherry peach mango papaya pineapple coconut apricot raspberry strawberry
      blueberry blackberry cranberry grapefruit tangerine watermelon cantaloupe pomegranate avocado guava
      nectarine   carrot potato tomato onion garlic celery lettuce spinach cabbage broccoli
      cauliflower cucumber zucchini eggplant pumpkin squash radish turnip  asparagus artichoke
      mushroom pepper jalapeno  ginger pickle olive almond cashew peanut walnut pecan pistachio
      hazelnut casserole gumbo jambalaya chowder   goulash  sandwich ketchup mustard
      mayonnaise vinegar honey syrup jelly cinnamon nutmeg oregano basil parsley paprika saffron vanilla
      meringue tortilla pastrami salami pepperoni prosciutto anchovy halibut  calamari macaroni
      couscous quinoa lentil chickpea porridge stuffing gravy cornbread dumplings strudel cannoli tiramisu
      baklava churro cobbler biscotti scone  fondue souffle ratatouille french_toast 
      meatballs coleslaw pesto mac_and_cheese teriyaki tofu edamame kimchi dumpling apple_pie cheesesteak`,
    alsoValid: 'lemon melon lime date fig kiwi pear plum leek kale corn peas beet rice tuna crab ham taco gyro chili feta brie jam',
  },
  {
    id: 'animals', label: 'Animals', sunday: true,
    words: `elephant giraffe zebra tiger leopard cheetah jaguar panther cougar bobcat hyena jackal coyote badger
      beaver otter weasel ferret skunk raccoon opossum squirrel chipmunk rabbit hamster gerbil hedgehog
      porcupine armadillo kangaroo koala wombat platypus wallaby gorilla chimpanzee orangutan baboon monkey
      lemur sloth anteater camel llama alpaca bison buffalo moose reindeer caribou antelope gazelle impala
      hippopotamus rhinoceros walrus dolphin whale narwhal octopus squid jellyfish starfish shark stingray
      penguin pelican flamingo ostrich eagle falcon parrot toucan peacock pigeon sparrow robin cardinal
      raven swan goose turkey chicken rooster pheasant heron stork crane vulture condor hummingbird
      woodpecker seagull alligator crocodile iguana chameleon gecko lizard tortoise turtle python cobra
      rattlesnake salamander butterfly dragonfly grasshopper cricket beetle ladybug mosquito scorpion spider
      tarantula termite hornet donkey horse goat sheep piglet mongoose meerkat warthog wildebeest manatee
      seahorse barracuda swordfish  lobster panda grizzly polar_bear black_bear cockatoo
      albatross  nightingale chinchilla bullfrog tadpole caterpillar centipede earthworm`,
    alsoValid: 'lion lynx wolf seal hawk owl crow duck frog toad mule pony bear deer hare mole mouse moth wasp ants',
  },
  {
    id: 'mens', label: "Men's Names", sunday: false,
    words: `James Robert Michael William David Richard Joseph Thomas Charles Christopher Daniel Matthew Anthony
      Donald Steven Andrew Joshua Kenneth Kevin Brian George Timothy Ronald Jason Edward Jeffrey Jacob
      Nicholas Jonathan Stephen Larry Justin Scott Brandon Benjamin Samuel Gregory Alexander Patrick Frank
      Raymond Dennis Jerry Tyler Aaron Henry Douglas Peter Nathan Zachary Walter Harold Jeremy Keith Roger
      Gerald Ethan Arthur Terry Christian Lawrence Austin Jesse Albert Bryan Billy Bruce Willie Jordan
      Dylan Ralph Gabriel Wayne Eugene Logan Randy Louis Russell Vincent Philip Bobby Johnny Bradley
      Oliver Elijah Lucas Mason Caleb Isaac Wyatt Hunter Connor Landon Carter Julian Miles Dominic
      Theodore Sebastian Maxwell Marcus Victor Martin Leonard Howard Clarence Stanley Franklin Spencer
      Trevor Colin Dustin Travis Derek Simon Felix Oscar Calvin Gordon Warren Harvey Desmond Nathaniel
      Malcolm Barry Curtis Wesley Tristan Preston Elliot Jasper Silas Everett Graham Fletcher Archer
       Corey Leon Noel`,
    alsoValid: 'Lyle Neil Dean Dane Ramon Niles Glen Eric Owen Liam Hugo Kyle Seth Ivan Evan Luke Paul Mark Adam',
  },
  {
    id: 'womens', label: "Women's Names", sunday: false,
    words: `Patricia Jennifer Linda Elizabeth Barbara Susan Jessica Sarah Karen Nancy Betty Margaret Sandra
      Ashley Kimberly Emily Donna Michelle Carol Amanda Dorothy Melissa Deborah Stephanie Rebecca Sharon
      Laura Cynthia Kathleen Angela Shirley Brenda Pamela Nicole Helen Samantha Katherine Christine Debra
      Rachel Carolyn Janet Catherine Maria Heather Diane Julie Olivia Joyce Virginia Victoria Kelly Lauren
      Christina Evelyn Judith Megan Andrea Cheryl Hannah Jacqueline Martha Gloria Teresa Madison Frances
      Kathryn Janice Abigail Alice Julia Sophia Grace Denise Amber Doris Marilyn Danielle Beverly Isabella
      Theresa Diana Natalie Brittany Charlotte Marie Kayla Alexis Harper Scarlett Penelope Chloe Hazel
      Violet Aurora Savannah Audrey Claire Stella Naomi Eleanor Caroline Genevieve Josephine Beatrice
      Florence Vivian  Priscilla  Juliet Fiona Molly Daisy Paige Brooke Veronica Monica
      Tiffany Vanessa Melanie Valerie Wendy Yvonne Bridget Colleen Maureen Gabrielle Jasmine Miranda `,
    alsoValid: 'Nadia Coral Celia Marina Myra Mary Isla Lisa Lena Elena Nora Rona Lori Edna Dena Norma Elise Leah Ella Mia Ava Amy May Anna',
  },
  {
    id: 'jobs', label: 'Jobs', sunday: true,
    words: `doctor nurse teacher lawyer dentist surgeon pharmacist plumber electrician carpenter mechanic
      engineer architect accountant banker cashier waiter waitress baker butcher farmer fisherman pilot
      sailor soldier firefighter detective sheriff judge journalist reporter editor author writer painter
      sculptor musician singer actor actress dancer director producer designer tailor barber janitor
      librarian scientist chemist biologist physicist astronaut astronomer economist therapist
      psychologist veterinarian paramedic courier trucker driver chauffeur welder roofer gardener
      landscaper florist jeweler optician surveyor translator interpreter professor principal referee
      umpire athlete programmer developer analyst manager secretary receptionist bartender barista
      lifeguard locksmith blacksmith cobbler potter weaver miner logger rancher broker realtor auctioneer
      magician comedian photographer illustrator cartoonist animator curator historian geologist butler
      housekeeper chaplain senator governor diplomat ambassador consultant auditor  zookeeper
        stockbroker paralegal dietitian nutritionist midwife pediatrician cardiologist`,
    alsoValid: 'chef cook poet coach nanny maid mayor mason clown priest rabbi tutor guard medic',
  },
  {
    id: 'house', label: 'Around the House', sunday: true,
    words: `couch armchair recliner ottoman table chair stool bench bookcase bookshelf dresser wardrobe closet
      cabinet cupboard drawer mattress pillow blanket quilt comforter curtain blinds carpet doormat
      chandelier mirror clock candle fireplace chimney mantel staircase banister hallway kitchen bathroom
      bedroom basement attic garage pantry laundry porch balcony patio doorbell mailbox faucet bathtub
      shower toilet towel toaster blender microwave stove kettle teapot refrigerator freezer dishwasher
      dryer washer vacuum broom dustpan bucket sponge ladder hammer screwdriver wrench pliers drill toolbox
      flashlight thermostat radiator heater television remote speaker coaster napkin spatula ladle
      colander saucepan skillet cutlery spoon knife plate teacup pitcher platter cushion hammock highchair
      nightstand headboard footstool wallpaper skylight windowsill shutter doorknob lampshade bedspread
       cookbook dishrag doghouse treehouse sunroom`,
    alsoValid: 'sofa desk lamp vase oven sink fork bowl mug mop rug fan bed tub',
  },
  {
    id: 'sports', label: 'Sports and Games', sunday: true,
    words: `soccer football baseball basketball hockey tennis rugby cricket lacrosse volleyball softball
      badminton squash bowling boxing wrestling fencing archery rowing sailing surfing skiing snowboarding
      skating swimming diving cycling running marathon triathlon gymnastics karate taekwondo croquet
      curling handball racquetball pickleball dodgeball kickball billiards darts chess checkers backgammon
      dominoes poker bridge solitaire bingo charades hopscotch marbles kickboxing motocross rodeo bobsled
       decathlon javelin discus  mahjong    roulette blackjack
       horseshoes foosball paintball skateboarding water_polo table_tennis  sumo_wrestling tug_of_war hide_and_seek musical_chairs leapfrog sledding hurdles weightlifting climbing`,
    alsoValid: 'golf polo pool judo luge tag go jacks',
  },
  {
    id: 'clothing', label: 'Clothing', sunday: true,
    words: `shirt blouse sweater cardigan hoodie jacket blazer overcoat raincoat parka poncho tuxedo trousers
      pants jeans shorts skirt dress kimono pajamas slippers sneakers sandals loafers boots heels
      moccasins socks stockings tights leggings overalls jumpsuit romper turtleneck sweatshirt windbreaker
      scarf gloves mittens beanie beret bonnet fedora sombrero turban helmet visor bandana necktie bowtie
      suspenders apron bathrobe bikini swimsuit wetsuit uniform corset  tunic sarong leotard
      earmuffs cufflinks necklace bracelet earrings brooch pendant anklet handbag purse wallet backpack
      sunglasses bodysuit flannel camisole   waistcoat trench tank_top cowboy_boots 
      ball_gown top_hat baseball_cap flip_flops`,
    alsoValid: 'coat suit gown vest robe cape sari toga kilt tutu belt cap hat',
  },
  {
    id: 'nature', label: 'Nature', sunday: true,
    words: `mountain valley canyon river stream creek waterfall glacier volcano desert forest jungle meadow
      prairie tundra swamp marsh lagoon island peninsula beach ocean cliff boulder pebble oasis geyser
      rainbow thunder lightning tornado hurricane blizzard drizzle hailstorm sunrise sunset breeze cloud
      frost snowflake avalanche earthquake tsunami maple willow birch cedar redwood sequoia cypress bamboo
      cactus daisy tulip orchid violet daffodil sunflower lavender poppy magnolia dandelion clover thistle
      jasmine hibiscus marigold buttercup acorn pinecone seaweed coastline horizon plateau gorge ravine
       delta  savanna rainforest moonlight starlight wildflower honeysuckle evergreen
      sycamore chestnut eucalyptus  juniper `,
    alsoValid: 'cave sand dune fog oak pine palm fern moss ivy rose lily iris reef mesa hill lake pond rain snow wind',
  },
  {
    id: 'music', label: 'Music', sunday: true,
    words: `guitar piano violin viola cello banjo ukulele mandolin harmonica accordion trumpet trombone
      saxophone clarinet flute piccolo bassoon bagpipes drums cymbals xylophone  tambourine triangle
      bongos maracas synthesizer keyboard organ  sitar kazoo castanets glockenspiel 
      cowbell didgeridoo  recorder bugle  french_horn  blues country reggae opera
      polka tango waltz disco techno gospel bluegrass symphony orchestra concerto sonata ballad anthem
      lullaby melody harmony rhythm tempo chorus chord octave soprano tenor baritone conductor hip_hop 
      jazz_band rock_and_roll`,
    alsoValid: 'harp tuba oboe lute lyre jazz rock punk funk soul folk bass',
  },
  {
    id: 'body', label: 'The Human Body', sunday: false,
    words: `elbow shoulder ankle wrist finger thumb forehead eyebrow eyelash eyelid cheek nostril tongue tooth
      throat chest stomach belly thigh spine skull brain heart lungs liver kidney pancreas bladder
      intestine muscle tendon ligament knuckle fingernail earlobe eardrum collarbone kneecap ribcage
      backbone artery skeleton armpit torso abdomen pelvis femur biceps triceps forearm temple scalp
      eyeball pupil retina cornea`,
    alsoValid: 'bowel penis knee heel toe chin jaw gums neck hip calf shin rib vein palm',
  },
];
