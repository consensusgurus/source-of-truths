// The authored slate pool for Outrank (scripts/gen-outrank.mjs reads this).
//
// One entry = one day's themed slate. `ranked` is THE AUTHOR'S ESTIMATE of the
// order a broad, international crowd would put the slate in by favorite votes,
// MOST POPULAR FIRST. It is a belief about people, not a measurement of them;
// gen-outrank turns it into the 40-vote `house` crowd, and the puzzle file's
// header says in as many words that the house crowd is an estimate. Nothing in
// this pipeline has ever seen a real ballot.
//
// `ranked` is NEVER the order the player sees. gen-outrank hand-mixes a display
// order per board and emits `items` in that order (see the DISPLAY MIX section
// of the generator), so nothing about the answer leaks out of the file the
// browser receives.
//
// FIELDS
//   theme   the slate's title, shown to the player. Never reused, in this pool
//           or anywhere in the frozen bank.
//   flavor  one line of table-setting copy under the title.
//   cat     the variety bucket (food, animals, places, ...). The generator caps
//           how many boards one bucket may fill and forbids two in a row.
//   shape   how lopsided the author believes the crowd is:
//             'steep' one clear favorite, 'mid' a favorite with a real chase,
//             'flat'  six things people genuinely split over.
//           It selects the family of vote ladders, nothing else.
//   ranked  6 items (weekday) or 7 (Sunday Edition), most popular first.
//
// WHAT MAKES A SLATE GOOD, and why this pool looks the way it does.
// The game only works if the crowd's order is GUESSABLE BUT NOT OBVIOUS. Two
// ways to fail: a slate where one item obviously wins and the other five are
// interchangeable pays nothing for reading the room, and a slate of five things
// nobody has a feeling about is a coin flip five times over. So every slate here
// is (a) a set where a reasonable person can say "most people would pick that
// one" and (b) a set where the ORDER BELOW the favorite is still an argument.
// Concretely, that means slates of universally-known members with real internal
// spread — herbs, weather, farm animals, world landmarks — and not slates of
// near-equivalent specialist picks.
//
// CULTURE-BROAD, FAMILY-READABLE. The frozen bank leans hard on one country's
// grocery aisle: 32 of its 71 boards are food or drink and many of those are US
// supermarket brands. New slates are written to be recognizable from anywhere —
// world breads, world rivers, farm animals, weather, fairy tales — and carry no
// alcohol, no gambling and nothing a child could not read over a shoulder.
// US spellings throughout (authoring standard #8), checked in the verifier.
export const SLATES = [
  // ── food ───────────────────────────────────────────────────────────────────
  { theme: 'Noodle dishes of the world', cat: 'food', shape: 'mid',
    flavor: 'Six bowls, and everyone is sure about theirs.',
    ranked: ['Ramen', 'Spaghetti bolognese', 'Pad thai', 'Pho', 'Chow mein', 'Udon'] },
  { theme: 'Street food stalls', cat: 'food', shape: 'flat',
    flavor: 'The line forms wherever the smell is.',
    ranked: ['Churros', 'Crepes', 'Satay skewers', 'Falafel wrap', 'Samosa', 'Bao buns'] },
  { theme: 'Dumplings of the world', cat: 'food', shape: 'mid',
    flavor: 'Dough, a filling, and a very old argument.',
    ranked: ['Gyoza', 'Ravioli', 'Pierogi', 'Wonton', 'Gnocchi', 'Momo'] },
  { theme: 'Rice dishes', cat: 'food', shape: 'mid',
    flavor: 'One grain, six countries, no agreement.',
    ranked: ['Fried rice', 'Paella', 'Biryani', 'Risotto', 'Bibimbap', 'Jollof rice'] },
  { theme: 'Breads of the world', cat: 'food', shape: 'mid',
    flavor: 'Warm, torn in half, and defended loudly.',
    ranked: ['Sourdough', 'Baguette', 'Naan', 'Tortilla', 'Pita', 'Focaccia'] },
  { theme: 'Cakes for the table', cat: 'food', shape: 'steep',
    flavor: 'Somebody has to cut it. Somebody has to choose it first.',
    ranked: ['Chocolate cake', 'Cheesecake', 'Carrot cake', 'Tiramisu', 'Red velvet', 'Black forest'] },
  { theme: 'Herbs and spices', cat: 'food', shape: 'flat',
    flavor: 'The small jars that decide the whole dish.',
    ranked: ['Garlic', 'Cinnamon', 'Basil', 'Ginger', 'Chili', 'Mint'] },
  { theme: 'Things on toast', cat: 'food', shape: 'steep',
    flavor: 'Breakfast, settled by a show of hands.',
    ranked: ['Butter', 'Jam', 'Peanut butter', 'Mashed avocado', 'Honey', 'Marmalade'] },
  { theme: 'Hot drinks on a cold day', cat: 'drink', shape: 'steep',
    flavor: 'Both hands around the cup. Which cup?',
    ranked: ['Hot chocolate', 'Green tea', 'Chai', 'Turkish coffee', 'Mulled cider', 'Herbal tea'] },

  // ── animals ────────────────────────────────────────────────────────────────
  { theme: 'Birds everyone knows', cat: 'animals', shape: 'mid',
    flavor: 'Six birds a five-year-old could name.',
    ranked: ['Owl', 'Parrot', 'Eagle', 'Peacock', 'Flamingo', 'Pelican'] },
  { theme: 'Farm animals', cat: 'animals', shape: 'steep',
    flavor: 'The oldest cast in the world, ranked.',
    ranked: ['Horse', 'Cow', 'Sheep', 'Goat', 'Pig', 'Chicken'] },
  { theme: 'Creatures of the rainforest', cat: 'animals', shape: 'flat',
    flavor: 'Loud, bright, and hard to choose between.',
    ranked: ['Toucan', 'Macaw', 'Howler monkey', 'Orangutan', 'Poison dart frog', 'Anaconda'] },
  { theme: 'Insects and bugs', cat: 'animals', shape: 'mid',
    flavor: 'Small, everywhere, and surprisingly divisive.',
    ranked: ['Butterfly', 'Ladybug', 'Bee', 'Dragonfly', 'Grasshopper', 'Ant'] },
  { theme: 'Desert animals', cat: 'animals', shape: 'flat',
    flavor: 'Everything here can wait longer than you can.',
    ranked: ['Camel', 'Meerkat', 'Fennec fox', 'Roadrunner', 'Rattlesnake', 'Scorpion'] },
  { theme: 'Animals of the far north', cat: 'animals', shape: 'mid',
    flavor: 'Six coats built for the same weather.',
    ranked: ['Polar bear', 'Arctic fox', 'Reindeer', 'Snowy owl', 'Husky', 'Walrus'] },

  // ── places ─────────────────────────────────────────────────────────────────
  { theme: 'Islands to escape to', cat: 'places', shape: 'flat',
    flavor: 'One week, no work, six departure boards.',
    ranked: ['Bali', 'Santorini', 'Maui', 'Tahiti', 'Sicily', 'Zanzibar'] },
  { theme: 'Cities to see once', cat: 'places', shape: 'mid',
    flavor: 'The one you would spend the whole trip on.',
    ranked: ['Rome', 'Kyoto', 'Cape Town', 'Istanbul', 'Rio de Janeiro', 'Buenos Aires'] },
  { theme: 'Famous landmarks', cat: 'places', shape: 'steep',
    flavor: 'Six postcards the whole world already owns.',
    ranked: ['The Eiffel Tower', 'The Pyramids of Giza', 'The Statue of Liberty', 'The Sydney Opera House', 'Big Ben', 'The Golden Gate Bridge'] },
  { theme: 'European countries to visit', cat: 'places', shape: 'mid',
    flavor: 'Two weeks, one passport, six arguments.',
    ranked: ['Italy', 'Greece', 'Spain', 'Portugal', 'Norway', 'Croatia'] },
  { theme: 'Great museums', cat: 'places', shape: 'flat',
    flavor: 'A whole rainy day, and only one ticket.',
    ranked: ['The Louvre', 'The British Museum', 'The Met', 'The Uffizi', 'The Prado', 'The Rijksmuseum'] },

  // ── nature ─────────────────────────────────────────────────────────────────
  { theme: 'Kinds of weather', cat: 'nature', shape: 'steep',
    flavor: 'Open the curtains. What do you want to see?',
    ranked: ['Sunshine', 'Snow', 'A thunderstorm', 'Light rain', 'Fog', 'Wind'] },
  { theme: 'Trees', cat: 'nature', shape: 'mid',
    flavor: 'Six of them, and one you would plant.',
    ranked: ['Cherry tree', 'Oak', 'Willow', 'Maple', 'Pine', 'Baobab'] },
  { theme: 'Flowers', cat: 'nature', shape: 'steep',
    flavor: 'The bunch you would actually carry home.',
    ranked: ['Rose', 'Sunflower', 'Tulip', 'Orchid', 'Lavender', 'Daisy'] },
  { theme: 'Sounds of nature', cat: 'nature', shape: 'flat',
    flavor: 'Close your eyes. Which one do you hear?',
    ranked: ['Ocean waves', 'Rain on leaves', 'Birdsong', 'A crackling fire', 'Wind in the trees', 'A running stream'] },
  { theme: 'Landscapes to wake up in', cat: 'nature', shape: 'mid',
    flavor: 'Same bed, six different windows.',
    ranked: ['Mountains', 'The beach', 'A forest', 'A lakeside', 'Rolling hills', 'The desert'] },
  { theme: 'Things growing in the garden', cat: 'nature', shape: 'flat',
    flavor: 'One raised bed, and only so much room.',
    ranked: ['Tomatoes', 'Sunflowers', 'Pumpkins', 'Carrots', 'Chili peppers', 'Lettuce'] },

  // ── screen ─────────────────────────────────────────────────────────────────
  { theme: 'Studio Ghibli films', cat: 'screen', shape: 'mid',
    flavor: 'Hand-drawn, and hard to put in order.',
    ranked: ['Spirited Away', 'My Neighbor Totoro', "Howl's Moving Castle", 'Princess Mononoke', "Kiki's Delivery Service", 'Ponyo'] },
  { theme: 'The actors who played Bond', cat: 'screen', shape: 'mid',
    flavor: 'Same name, six very different deliveries.',
    ranked: ['Sean Connery', 'Daniel Craig', 'Pierce Brosnan', 'Roger Moore', 'Timothy Dalton', 'George Lazenby'] },
  { theme: 'Disney princesses', cat: 'screen', shape: 'flat',
    flavor: 'Six crowns, and the room never agrees.',
    ranked: ['Belle', 'Elsa', 'Mulan', 'Ariel', 'Moana', 'Cinderella'] },
  { theme: 'Film genres', cat: 'screen', shape: 'mid',
    flavor: 'Friday night, one shelf, six directions.',
    ranked: ['Comedy', 'Action', 'Science fiction', 'Romance', 'Horror', 'Documentary'] },
  { theme: 'Cartoon dogs', cat: 'screen', shape: 'mid',
    flavor: 'Drawn, adored, and now ranked.',
    ranked: ['Snoopy', 'Scooby-Doo', 'Bluey', 'Pluto', 'Odie', 'Clifford'] },

  // ── music ──────────────────────────────────────────────────────────────────
  { theme: 'Ways to listen to music', cat: 'music', shape: 'mid',
    flavor: 'Same song, six completely different rooms.',
    ranked: ['Headphones', 'A live concert', 'The car radio', 'A vinyl record', 'A shared playlist', 'A phone speaker'] },
  { theme: 'Songs everyone knows the words to', cat: 'music', shape: 'steep',
    flavor: 'You already know all six. Which one do you sing?',
    ranked: ['Happy Birthday', 'Twinkle, Twinkle, Little Star', 'Jingle Bells', 'We Will Rock You', 'Auld Lang Syne', 'Head, Shoulders, Knees and Toes'] },
  { theme: 'Dances people actually try', cat: 'music', shape: 'flat',
    flavor: 'The floor is open and nobody is watching.',
    ranked: ['Salsa', 'The waltz', 'The tango', 'Line dancing', 'Breakdancing', 'The twist'] },

  // ── words and books ────────────────────────────────────────────────────────
  { theme: "Books everyone says they've read", cat: 'words', shape: 'flat',
    flavor: 'No judgment. Just pick your favorite.',
    ranked: ['Pride and Prejudice', '1984', 'To Kill a Mockingbird', 'The Hobbit', 'The Great Gatsby', 'Don Quixote'] },
  { theme: 'Punctuation marks', cat: 'words', shape: 'mid',
    flavor: 'Tiny marks, enormous opinions.',
    ranked: ['The question mark', 'The exclamation point', 'The comma', 'The em dash', 'The ellipsis', 'The semicolon'] },
  { theme: 'Words that are fun to say', cat: 'words', shape: 'mid',
    flavor: 'Say them out loud before you vote.',
    ranked: ['Kerfuffle', 'Bamboozle', 'Serendipity', 'Onomatopoeia', 'Discombobulate', 'Flabbergasted'] },

  // ── sport ──────────────────────────────────────────────────────────────────
  { theme: 'Olympic events to watch', cat: 'sport', shape: 'mid',
    flavor: 'Two weeks, one screen, six choices.',
    ranked: ['Gymnastics', 'Swimming', 'The 100 meters', 'Diving', 'Archery', 'Weightlifting'] },
  { theme: 'Winter sports', cat: 'sport', shape: 'mid',
    flavor: 'Cold, fast, and settled by vote.',
    ranked: ['Skiing', 'Ice skating', 'Snowboarding', 'Sledding', 'Ice hockey', 'Curling'] },
  { theme: 'Ways to keep fit', cat: 'sport', shape: 'flat',
    flavor: 'The one you would actually keep doing.',
    ranked: ['Running', 'Cycling', 'Yoga', 'Dancing', 'Hiking', 'Weight training'] },

  // ── science ────────────────────────────────────────────────────────────────
  { theme: 'Dinosaurs', cat: 'science', shape: 'steep',
    flavor: 'Sixty-six million years later, still a debate.',
    ranked: ['Tyrannosaurus rex', 'Triceratops', 'Velociraptor', 'Stegosaurus', 'Brachiosaurus', 'Ankylosaurus'] },
  { theme: 'Inventions that changed everything', cat: 'science', shape: 'mid',
    flavor: 'Take one away and the world stops.',
    ranked: ['The light bulb', 'The wheel', 'The internet', 'The printing press', 'Antibiotics', 'The compass'] },
  { theme: 'Elements of the periodic table', cat: 'science', shape: 'mid',
    flavor: 'One hundred and eighteen boxes. These six.',
    ranked: ['Gold', 'Oxygen', 'Carbon', 'Helium', 'Iron', 'Silver'] },

  // ── home ───────────────────────────────────────────────────────────────────
  { theme: 'Rooms in a house', cat: 'home', shape: 'mid',
    flavor: 'Where do you actually spend the evening?',
    ranked: ['The kitchen', 'The bedroom', 'The living room', 'The dining room', 'The bathroom', 'The attic'] },
  { theme: 'What lives in the junk drawer', cat: 'home', shape: 'flat',
    flavor: 'Every house has one. Every house has these.',
    ranked: ['Batteries', 'Rubber bands', 'Scissors', 'Tape', 'Old keys', 'Spare buttons'] },
  { theme: 'Ways to make a room cozy', cat: 'home', shape: 'mid',
    flavor: 'One small change, and the room turns warm.',
    ranked: ['Blankets', 'Candles', 'String lights', 'Houseplants', 'Cushions', 'A soft rug'] },

  // ── everyday life ──────────────────────────────────────────────────────────
  { theme: 'Places to walk to in your neighborhood', cat: 'life', shape: 'mid',
    flavor: 'Ten minutes on foot. Where are you going?',
    ranked: ['A bakery', 'The park', 'A coffee shop', 'The library', 'A bookstore', 'The farmers market'] },
  { theme: 'Things everyone loses', cat: 'life', shape: 'steep',
    flavor: 'You are looking for one of these right now.',
    ranked: ['Keys', 'Socks', 'Sunglasses', 'An umbrella', 'Chargers', 'Lip balm'] },
  { theme: 'Ways to start the morning', cat: 'life', shape: 'mid',
    flavor: 'The first ten minutes decide the day.',
    ranked: ['A hot drink', 'A shower', 'Checking your phone', 'A walk', 'Stretching', 'Reading the news'] },
  { theme: 'Ways to spend a long flight', cat: 'life', shape: 'mid',
    flavor: 'Eleven hours and a very small screen.',
    ranked: ['Sleeping', 'Watching movies', 'Reading', 'Listening to music', 'Staring out the window', 'Getting work done'] },
  { theme: 'Excuses for being late', cat: 'life', shape: 'steep',
    flavor: 'Everybody has used at least one.',
    ranked: ['Traffic', "The alarm didn't go off", 'The train was delayed', 'Lost track of time', "Couldn't find parking", 'The dog'] },
  { theme: 'Jobs kids say they want', cat: 'life', shape: 'mid',
    flavor: 'Ask a class of six-year-olds. Then guess the room.',
    ranked: ['Astronaut', 'Veterinarian', 'Doctor', 'Firefighter', 'Teacher', 'Chef'] },

  // ── time ───────────────────────────────────────────────────────────────────
  { theme: 'Times of day', cat: 'time', shape: 'mid',
    flavor: 'Twenty-four hours, and one you would keep.',
    ranked: ['Sunset', 'Sunrise', 'Late afternoon', 'Mid-morning', 'Midnight', 'Noon'] },
  { theme: 'Ways to tell the time', cat: 'time', shape: 'mid',
    flavor: 'Six answers to the same simple question.',
    ranked: ['A wristwatch', 'A phone screen', 'A wall clock', 'An hourglass', 'A sundial', 'Church bells'] },
  { theme: 'The first signs of winter', cat: 'time', shape: 'mid',
    flavor: 'The moment you admit the season turned.',
    ranked: ['The first snowfall', 'Holiday lights', 'Early sunsets', 'Warm hats', 'Hot drinks by the window', 'The first frost'] },

  // ── games, craft, myth ─────────────────────────────────────────────────────
  { theme: 'Rainy-day puzzles', cat: 'games', shape: 'mid',
    flavor: 'The table is clear and the afternoon is long.',
    ranked: ['A jigsaw puzzle', 'A crossword', 'Sudoku', 'A word search', "A Rubik's Cube", 'A maze'] },
  { theme: 'What lives in the toolbox', cat: 'craft', shape: 'mid',
    flavor: 'One shelf, one lid, six ways to fix a thing.',
    ranked: ['A hammer', 'A screwdriver', 'A tape measure', 'Pliers', 'A wrench', 'A bubble level'] },
  { theme: 'Hobbies worth picking up', cat: 'craft', shape: 'flat',
    flavor: 'A free Saturday and no excuses left.',
    ranked: ['Photography', 'Baking', 'Gardening', 'Painting', 'Knitting', 'Pottery'] },
  { theme: 'Gods of the old myths', cat: 'myth', shape: 'mid',
    flavor: 'Six names that outlasted the temples built for them.',
    ranked: ['Zeus', 'Thor', 'Poseidon', 'Athena', 'Ra', 'Anubis'] },
  { theme: 'Legendary heroes', cat: 'myth', shape: 'flat',
    flavor: 'Every one of them was somebody else first.',
    ranked: ['Robin Hood', 'King Arthur', 'Hercules', 'Sinbad', 'Beowulf', 'Gilgamesh'] },

  // ══ SUNDAY EDITION — seven items ═══════════════════════════════════════════
  { theme: 'Wonders of the natural world', cat: 'places', shape: 'steep', sunday: true,
    flavor: 'Sunday Edition. Seven sights the planet made by itself.',
    ranked: ['The Northern Lights', 'The Great Barrier Reef', 'Mount Everest', 'Victoria Falls', 'The Amazon rainforest', 'Ha Long Bay', 'The Sahara Desert'] },
  { theme: 'Ways to greet someone', cat: 'life', shape: 'flat', sunday: true,
    flavor: 'Sunday Edition. Seven hellos, and every country ranks them differently.',
    ranked: ['A hug', 'A handshake', 'A wave', 'A high five', 'A nod', 'A fist bump', 'A bow'] },
  { theme: 'Playground games', cat: 'games', shape: 'mid', sunday: true,
    flavor: 'Sunday Edition. Seven games nobody had to be taught twice.',
    ranked: ['Hide and seek', 'Tag', 'Jump rope', 'Hopscotch', 'Red light, green light', 'Marbles', 'Duck, duck, goose'] },
  { theme: 'Monsters of the movies', cat: 'screen', shape: 'mid', sunday: true,
    flavor: 'Sunday Edition. Seven old monsters, still working.',
    ranked: ['Dracula', 'King Kong', 'Godzilla', "Frankenstein's monster", 'The Mummy', 'The Wolf Man', 'The Invisible Man'] },
  { theme: 'Great rivers of the world', cat: 'places', shape: 'mid', sunday: true,
    flavor: 'Sunday Edition. Seven rivers that drew the map.',
    ranked: ['The Amazon', 'The Nile', 'The Ganges', 'The Danube', 'The Mississippi', 'The Yangtze', 'The Congo'] },
  { theme: 'Things people collect', cat: 'life', shape: 'flat', sunday: true,
    flavor: 'Sunday Edition. Seven shelves, seven quiet obsessions.',
    ranked: ['Photographs', 'Vinyl records', 'Coins', 'Seashells', 'Stamps', 'Postcards', 'Fridge magnets'] },
  { theme: 'Big cats', cat: 'animals', shape: 'steep', sunday: true,
    flavor: 'Sunday Edition. Seven of them, and only one favorite.',
    ranked: ['Tiger', 'Snow leopard', 'Cheetah', 'Lion', 'Jaguar', 'Leopard', 'Puma'] },
  { theme: 'The night sky', cat: 'science', shape: 'flat', sunday: true,
    flavor: 'Sunday Edition. Seven things worth going outside for.',
    ranked: ['A shooting star', 'The Moon', 'The Milky Way', 'A lunar eclipse', "Orion's Belt", 'The Space Station', 'The evening star'] },
  { theme: 'Fairy tales', cat: 'words', shape: 'mid', sunday: true,
    flavor: 'Sunday Edition. Seven stories older than anyone telling them.',
    ranked: ['Cinderella', 'Little Red Riding Hood', 'Snow White', 'The Three Little Pigs', 'Hansel and Gretel', 'Jack and the Beanstalk', 'Rapunzel'] },
  { theme: 'Ways to see a country', cat: 'life', shape: 'mid', sunday: true,
    flavor: 'Sunday Edition. Seven ways across, and one you would book.',
    ranked: ['By train', 'On foot', 'By car', 'By boat', 'By bicycle', 'From the air', 'By bus'] },
  { theme: 'What goes in the picnic basket', cat: 'food', shape: 'flat', sunday: true,
    flavor: 'Sunday Edition. Seven things, one blanket, no table.',
    ranked: ['Sandwiches', 'Fresh fruit', 'Cookies', 'Lemonade', 'Cold chicken', 'Potato chips', 'Olives'] },
];
