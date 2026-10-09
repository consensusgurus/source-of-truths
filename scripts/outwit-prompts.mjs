// The Outwit prompt pool: the hand-authored half of the bank.
//
// Read this with scripts/gen-outwit.mjs, which turns these entries into dated
// boards. Nothing here is measured. EVERY number this file implies about the
// crowd is an AUTHORING ESTIMATE — a judgement about how a broad, mixed,
// family audience would answer — and the generator's `house` arrays are that
// estimate rendered as 48 votes. No Outwit board has ever been seeded from
// observed play, and none of these are either. See the "WHERE THE NUMBERS COME
// FROM" section of gen-outwit.mjs before you touch a weight.
//
// WHAT AN ENTRY CARRIES
//   k   a stable slug, used for dedupe and for the variety report
//   c   category, from CATS below. The generator caps how often a category can
//       run in one prompt slot and forbids two prompts on the same board from
//       sharing one.
//   q   the prompt copy exactly as the player reads it. US spellings only
//       (CLAUDE.md "Daily puzzle authoring standard" rule 8), and no prompt may
//       repeat one already in app/outwit/puzzles.js.
//   o   THE OPTIONS, WRITTEN MOST-POPULAR FIRST. This ordering is the whole
//       authored claim: o[0] is the answer to a Meeting Point, o[last] is the
//       answer to a Road Less Traveled / Rare Bird. The generator shuffles the
//       display order deterministically, so the answer is never in a fixed slot.
//   s   optional shape hint: 'steep' (one answer runs away with it), 'flat' (a
//       close field), or omitted for the middle. It selects which percentage
//       ladder the generator lays over the ranking; it never changes the order.
//
// HERD entries are different: they carry a true answer (`t`), the crowd's
// CENTRAL GUESS (`c0`, which is deliberately not always the true answer — the
// gap between them is the whole point of the reveal), a spread, and a skew.
//
// THE DESIGN RULE THESE ENTRIES ARE WRITTEN AGAINST. A prompt with no right
// answer still needs a FINDABLE crowd answer. An option set where the crowd
// genuinely splits four ways evenly is a bad board: the player cannot beat
// chance and the game stops paying for insight. An option set with one
// overwhelming answer is a gimme. So every ranking below is written to have a
// strong but beatable favorite and a real second and third — and the generator
// refuses to emit a board whose measured house distribution does not show that.

export const CATS = [
  'food', 'drink', 'animals', 'plants', 'weather', 'space', 'water', 'travel',
  'transport', 'home', 'clothing', 'sport', 'games', 'music', 'art', 'books',
  'film', 'science', 'time', 'work', 'school', 'money', 'body', 'tools',
  'city', 'geography', 'party', 'tech', 'language', 'history',
];

// ─────────────────────────── ROAD LESS TRAVELED (least) ──────────────────────
// Four options, written most-picked first. The player is hunting o[3]: the one
// that is plainly the least appealing of a set where the other three are all
// real choices. If o[3] is absurd the board is a gimme; if it is merely the
// fourth-nicest of four nice things the board is a coin flip.
export const LEAST = [
  { k: 'suitcase-corner', c: 'travel', q: 'One corner of the suitcase is still empty. Which will the FEWEST players fill it with?', o: ['A jacket', 'A spare pair of shoes', 'A travel pillow', 'A board game'], s: 'steep' },
  { k: 'airport-early', c: 'travel', q: 'Flying today. How early will the FEWEST players get to the airport?', o: ['Two hours', 'Three hours', 'One hour', 'Five hours'], s: 'steep' },
  { k: 'plane-seat', c: 'transport', q: 'Picking a seat on a long flight. Which will the FEWEST players choose?', o: ['Window', 'Aisle', 'Exit row', 'Middle'], s: 'steep' },
  { k: 'laundry-job', c: 'home', q: 'Laundry day at home. Which job will the FEWEST players volunteer for?', o: ['Loading the machine', 'Hanging it out to dry', 'Folding it all', 'Ironing it all'], s: 'flat' },
  { k: 'museum-hour', c: 'art', q: 'One hour in a big museum. Which room will the FEWEST players walk into?', o: ['Dinosaurs', 'Famous paintings', 'Ancient Egypt', 'Antique ceramics'], s: 'flat' },
  { k: 'noodle-bowl', c: 'food', q: 'A bowl of noodles arrives. Which topping will the FEWEST players add?', o: ['Egg', 'Chili oil', 'Spring onion', 'Pickled seaweed'], s: 'flat' },
  { k: 'library-shelf', c: 'books', q: 'Ten minutes in a library. Which shelf will the FEWEST players browse?', o: ['New releases', 'Crime and mystery', 'Cookbooks', 'Local history'] },
  { k: 'pool-lane', c: 'sport', q: 'A morning at the pool. Which stroke will the FEWEST players swim?', o: ['Front crawl', 'Breaststroke', 'Backstroke', 'Butterfly'], s: 'steep' },
  { k: 'phone-lock', c: 'tech', q: 'Setting a new phone wallpaper. Which will the FEWEST players use?', o: ['A photo of someone', 'A holiday photo', 'A plain color', 'A screenshot of a receipt'], s: 'steep' },
  { k: 'birthday-cake', c: 'party', q: 'Choosing a birthday cake. Which will the FEWEST players order?', o: ['Chocolate', 'Vanilla with sprinkles', 'Carrot cake', 'Fruitcake'], s: 'steep' },
  { k: 'market-haggle', c: 'money', q: 'A found banknote in an old coat. Which will the FEWEST players do with it?', o: ['Spend it on lunch', 'Put it in savings', 'Buy someone a gift', 'Frame it'] },
  { k: 'desk-plant', c: 'plants', q: 'One plant for a desk. Which will the FEWEST players keep there?', o: ['A small succulent', 'A leafy pot plant', 'A herb in a jar', 'A cactus with long spines'] },
  { k: 'first-language', c: 'language', q: 'Learning one new language this year. Which will the FEWEST players start?', o: ['Spanish', 'Japanese', 'Italian', 'Finnish'], s: 'steep' },
  { k: 'gift-wrap', c: 'party', q: 'Wrapping a present tonight. Which will the FEWEST players reach for?', o: ['Patterned paper', 'A gift bag', 'Plain brown paper', 'Newspaper'] },
  { k: 'sandwich-bread', c: 'food', q: 'Building a sandwich. Which bread will the FEWEST players ask for?', o: ['White', 'Whole wheat', 'Sourdough', 'Rye with caraway'], s: 'flat' },
  { k: 'weekend-alarm', c: 'time', q: 'One alarm for a free Saturday. Which time will the FEWEST players set?', o: ['8:00', '7:00', '9:30', '4:45'], s: 'steep' },
  { k: 'rain-walk', c: 'weather', q: 'Caught in heavy rain with no umbrella. Which will the FEWEST players do?', o: ['Run for it', 'Wait it out under cover', 'Walk on and get soaked', 'Buy a newspaper to hold overhead'] },
  { k: 'cinema-snack', c: 'film', q: 'At the movie theater counter. Which will the FEWEST players buy?', o: ['Popcorn', 'A soft drink', 'Chocolate', 'A hot dog'], s: 'steep' },
  { k: 'video-call-bg', c: 'work', q: 'Turning the camera on for a call. Which background will the FEWEST players sit in front of?', o: ['A plain wall', 'A bookshelf', 'A window', 'A kitchen sink'] },
  { k: 'hotel-floor', c: 'travel', q: 'Checking into a hotel. Which room will the FEWEST players ask for?', o: ['A high floor with a view', 'A quiet middle floor', 'The ground floor', 'The one next to the elevator'] },
  { k: 'ice-rink', c: 'sport', q: 'A first hour on the ice. Which will the FEWEST players try?', o: ['Skate forward slowly', 'Hold the rail all the way around', 'Skate backward', 'A spin'], s: 'flat' },
  { k: 'soup-order', c: 'food', q: 'Soup of the day, four pots. Which will the FEWEST players order?', o: ['Tomato', 'Chicken noodle', 'Lentil', 'Cold cucumber'] },
  { k: 'pen-color', c: 'work', q: 'Signing a form. Which pen will the FEWEST players use?', o: ['Black', 'Blue', 'A pencil', 'Green'], s: 'steep' },
  { k: 'garden-corner', c: 'plants', q: 'One empty corner of a garden. Which will the FEWEST players put there?', o: ['A tree', 'A bench', 'A vegetable bed', 'A pond'], s: 'flat' },
  { k: 'night-sky-app', c: 'space', q: 'A clear night and one telescope. Which will the FEWEST players point it at?', o: ['The Moon', 'Saturn', 'Jupiter', 'A distant galaxy'], s: 'steep' },
  { k: 'street-food', c: 'food', q: 'A street food row, four stalls. Which will the FEWEST players line up at?', o: ['Grilled skewers', 'Dumplings', 'Fried potatoes', 'Pickled vegetables'], s: 'flat' },
  { k: 'bus-upstairs', c: 'transport', q: 'A long bus ride ahead. Which will the FEWEST players do?', o: ['Look out the window', 'Listen to music', 'Read', 'Talk to a stranger'], s: 'steep' },
  { k: 'kitchen-drawer', c: 'home', q: 'Tidying one kitchen drawer. Which will the FEWEST players throw out?', o: ['Old receipts', 'Dead batteries', 'Takeout menus', 'Spare keys'] },
  { k: 'sports-position', c: 'sport', q: 'Picking a position for a pickup game. Which will the FEWEST players take?', o: ['Up front scoring', 'Midfield', 'Defense', 'Goalkeeper'], s: 'flat' },
  { k: 'museum-gift', c: 'art', q: 'Leaving the gift shop with one thing. Which will the FEWEST players buy?', o: ['A postcard', 'A fridge magnet', 'A poster', 'A paperweight'] },
  { k: 'coffee-time', c: 'drink', q: 'The last coffee of the day. When will the FEWEST players have it?', o: ['Mid-morning', 'Just after lunch', 'Mid-afternoon', 'After dinner'], s: 'flat' },
  { k: 'zoo-feed', c: 'animals', q: 'A behind-the-scenes pass at a wildlife park. Which animal will the FEWEST players ask to feed?', o: ['Penguins', 'Giraffes', 'Elephants', 'Snakes'], s: 'flat' },
  { k: 'song-stuck', c: 'music', q: 'Singing in the shower. Which will the FEWEST players pick?', o: ['A song from their teens', 'Whatever is on the radio', 'A song from a movie', 'The national anthem'], s: 'flat' },
  { k: 'board-a-boat', c: 'water', q: 'A day on a small boat. Which job will the FEWEST players take?', o: ['Steering', 'Watching for wildlife', 'Handling the ropes', 'Cooking below deck'] },
  { k: 'ticket-line', c: 'city', q: 'A long line for tickets. Which will the FEWEST players do while waiting?', o: ['Look at their phone', 'Chat with whoever they came with', 'People-watch', 'Practice a language'], s: 'steep' },
  { k: 'winter-warm', c: 'clothing', q: 'First truly cold morning. Which will the FEWEST players put on?', o: ['A coat', 'A scarf', 'Gloves', 'Long underwear'], s: 'steep' },
  { k: 'toolbox-first', c: 'tools', q: 'A picture to hang and one toolbox. Which will the FEWEST players pick up first?', o: ['A hammer', 'A tape measure', 'A drill', 'A spirit level'] },
  { k: 'quiz-round', c: 'games', q: 'A quiz night with four rounds. Which will the FEWEST players want to play?', o: ['Music', 'General knowledge', 'Picture round', 'Math puzzles'], s: 'flat' },
  { k: 'egg-cook', c: 'food', q: 'Eggs for one. Which way will the FEWEST players cook them?', o: ['Scrambled', 'Fried', 'Boiled', 'Poached'], s: 'flat' },
  { k: 'holiday-photo', c: 'travel', q: 'One photo from a trip to print. Which will the FEWEST players choose?', o: ['A view', 'People they were with', 'A meal', 'A street sign'] },
  { k: 'radio-drive', c: 'music', q: 'A long drive alone. Which will the FEWEST players listen to?', o: ['Music', 'A podcast', 'Nothing at all', 'An audiobook in another language'], s: 'steep' },
  { k: 'science-fair', c: 'science', q: 'A science fair table to run. Which will the FEWEST players choose?', o: ['A volcano', 'Growing crystals', 'A simple circuit', 'A weather log'] },
  { k: 'sea-swim', c: 'water', q: 'A cold sea and a warm day. Which will the FEWEST players do?', o: ['Paddle at the edge', 'Swim properly', 'Stay on the sand', 'Dive straight in from a rock'], s: 'flat' },
  { k: 'new-shoes', c: 'clothing', q: 'One new pair of shoes. Which will the FEWEST players buy?', o: ['Sneakers', 'Boots', 'Sandals', 'Something with a heel'], s: 'steep' },
  { k: 'map-route', c: 'geography', q: 'A road trip across a continent. Which route will the FEWEST players plan?', o: ['Along the coast', 'Through the mountains', 'City to city', 'Straight across the flat middle'] },
  { k: 'clock-repair', c: 'time', q: 'A clock that runs five minutes fast. Which will the FEWEST players do?', o: ['Leave it', 'Fix it right away', 'Use it as a head start', 'Take it apart'] },
  { k: 'chess-first', c: 'games', q: 'Teaching someone a game tonight. Which will the FEWEST players teach?', o: ['Cards', 'Checkers', 'Chess', 'Backgammon'] },
  { k: 'orchestra-row', c: 'music', q: 'A free ticket to a concert. Where will the FEWEST players sit?', o: ['Middle of the hall', 'Front row', 'Balcony', 'Behind the orchestra'] },
  { k: 'lunch-desk', c: 'work', q: 'Lunch on a working day. Which will the FEWEST players do?', o: ['Eat at the desk', 'Go out for something', 'Eat with colleagues', 'Skip it'], s: 'flat' },
  { k: 'attic-find', c: 'home', q: 'A box of old things in the attic. Which will the FEWEST players open first?', o: ['Photos', 'Letters', 'Toys', 'Tax papers'], s: 'steep' },
  { k: 'fruit-picking', c: 'plants', q: 'An afternoon picking fruit. Which will the FEWEST players fill a basket with?', o: ['Strawberries', 'Apples', 'Cherries', 'Gooseberries'], s: 'steep' },
  { k: 'desert-heat', c: 'weather', q: 'The hottest day of the year so far. Which will the FEWEST players do?', o: ['Stay inside', 'Find shade and water', 'Swim somewhere', 'Go for a run'], s: 'steep' },
  { k: 'first-job', c: 'work', q: 'A summer job for one month. Which will the FEWEST players take?', o: ['Cafe work', 'Shop work', 'Gardening', 'Night shifts'], s: 'flat' },
  { k: 'stamp-letter', c: 'history', q: 'Writing one letter by hand. Which will the FEWEST players write to?', o: ['A friend far away', 'A grandparent', 'Their future self', 'A newspaper'] },
  { k: 'balloon-ride', c: 'travel', q: 'One ride over a valley. Which will the FEWEST players choose?', o: ['A hot air balloon', 'A cable car', 'A small plane', 'A zip line'], s: 'steep' },
  { k: 'cheese-board', c: 'food', q: 'A cheese board with four wedges. Which will the FEWEST players finish?', o: ['Cheddar', 'Brie', 'Smoked cheese', 'Blue cheese'], s: 'flat' },
  { k: 'rescue-dog', c: 'animals', q: 'A shelter visit, four dogs waiting. Which will the FEWEST players take home?', o: ['A puppy', 'A gentle old dog', 'A big energetic one', 'A very loud one'], s: 'flat' },
  { k: 'flat-tire', c: 'transport', q: 'A flat bicycle tire far from home. Which will the FEWEST players do?', o: ['Patch it there', 'Push the bike home', 'Call someone', 'Leave the bike and come back'], s: 'flat' },
  { k: 'spice-heat', c: 'food', q: 'Ordering a curry. Which heat will the FEWEST players ask for?', o: ['Medium', 'Mild', 'Hot', 'The hottest on the menu'] },
  { k: 'school-trip', c: 'school', q: 'One school trip to run again. Which will the FEWEST players pick?', o: ['A museum', 'A farm', 'A theater', 'A water treatment plant'], s: 'steep' },
  { k: 'coin-toss', c: 'games', q: 'A coin decides who goes first. Which will the FEWEST players do?', o: ['Call heads', 'Call tails', 'Let the other person call', 'Ask to play best of three'] },
  { k: 'window-view', c: 'home', q: 'Moving into a new place. Which view will the FEWEST players want from the window?', o: ['Trees', 'A river', 'A quiet street', 'A busy square'], s: 'flat' },
  { k: 'lost-glove', c: 'clothing', q: 'One glove lost in January. Which will the FEWEST players do?', o: ['Buy a new pair', 'Keep wearing one', 'Retrace their steps', 'Knit a replacement'], s: 'steep' },
  { k: 'star-name', c: 'space', q: 'Naming a newly found moon. Which will the FEWEST players choose?', o: ['A myth', 'A place on Earth', 'A scientist', 'A pet'] },
  { k: 'bread-bake', c: 'food', q: 'A first attempt at baking bread. Which will the FEWEST players make?', o: ['A plain loaf', 'Flatbread', 'Rolls', 'A braided loaf'], s: 'steep' },
  { k: 'river-crossing', c: 'water', q: 'A wide river and four ways over. Which will the FEWEST players take?', o: ['The bridge', 'The ferry', 'The stepping stones', 'Swim it'], s: 'steep' },
];

// ─────────────────────────── MEETING POINT (match) ───────────────────────────
// The player is hunting o[0]. A Meeting Point works when one answer is the
// obvious one to REACH FOR — not when it is the only sensible answer. Every set
// below leaves at least two other answers a reasonable person would defend,
// which is what keeps the modal share in the 30-50% band rather than at 80%.
export const MATCH = [
  { k: 'vegetable', c: 'food', q: 'Name a vegetable. Match the MOST-picked answer.', o: ['Carrot', 'Potato', 'Broccoli', 'Tomato', 'Onion'] },
  { k: 'mythical', c: 'books', q: 'Name a mythical creature. Match the MOST-picked answer.', o: ['Dragon', 'Unicorn', 'Mermaid', 'Phoenix', 'Griffin'], s: 'steep' },
  { k: 'shape', c: 'science', q: 'Name a shape. Match the MOST-picked answer.', o: ['Circle', 'Square', 'Triangle', 'Rectangle', 'Star'], s: 'steep' },
  { k: 'day-of-week', c: 'time', q: 'Name a day of the week. Match the MOST-picked answer.', o: ['Monday', 'Friday', 'Sunday', 'Saturday', 'Wednesday'], s: 'flat' },
  { k: 'metal', c: 'science', q: 'Name a metal. Match the MOST-picked answer.', o: ['Gold', 'Iron', 'Silver', 'Copper', 'Aluminum'], s: 'steep' },
  { k: 'flower', c: 'plants', q: 'Name a flower. Match the MOST-picked answer.', o: ['Rose', 'Tulip', 'Daisy', 'Sunflower', 'Lily'], s: 'steep' },
  { k: 'insect', c: 'animals', q: 'Name an insect. Match the MOST-picked answer.', o: ['Ant', 'Bee', 'Butterfly', 'Beetle', 'Grasshopper'], s: 'flat' },
  { k: 'continent', c: 'geography', q: 'Name a continent. Match the MOST-picked answer.', o: ['Africa', 'Asia', 'Europe', 'Antarctica', 'Australia'], s: 'flat' },
  { k: 'body-water', c: 'water', q: 'Name a kind of water on a map. Match the MOST-picked answer.', o: ['River', 'Lake', 'Ocean', 'Sea', 'Bay'] },
  { k: 'furniture', c: 'home', q: 'Name a piece of furniture. Match the MOST-picked answer.', o: ['Chair', 'Table', 'Sofa', 'Bed', 'Bookcase'] },
  { k: 'room-house', c: 'home', q: 'Name a room in a house. Match the MOST-picked answer.', o: ['Kitchen', 'Bedroom', 'Bathroom', 'Living room', 'Hallway'], s: 'flat' },
  { k: 'kitchen-tool', c: 'tools', q: 'Name something in a kitchen drawer. Match the MOST-picked answer.', o: ['Spoon', 'Knife', 'Fork', 'Whisk', 'Can opener'], s: 'flat' },
  { k: 'job', c: 'work', q: 'Name a job. Match the MOST-picked answer.', o: ['Teacher', 'Doctor', 'Firefighter', 'Chef', 'Bus driver'], s: 'flat' },
  { k: 'sea-animal-big', c: 'animals', q: 'Name something with fins. Match the MOST-picked answer.', o: ['Shark', 'Dolphin', 'Goldfish', 'Whale', 'Tuna'], s: 'steep' },
  { k: 'bird-fly', c: 'animals', q: 'Name a bird that can fly. Match the MOST-picked answer.', o: ['Eagle', 'Pigeon', 'Sparrow', 'Owl', 'Seagull'], s: 'flat' },
  { k: 'gemstone', c: 'money', q: 'Name a gemstone. Match the MOST-picked answer.', o: ['Diamond', 'Ruby', 'Emerald', 'Sapphire', 'Amethyst'], s: 'steep' },
  { k: 'weather-word', c: 'weather', q: 'Name something the sky does. Match the MOST-picked answer.', o: ['Rain', 'Snow', 'Thunder', 'Wind', 'Hail'], s: 'steep' },
  { k: 'pasta', c: 'food', q: 'Name a pasta shape. Match the MOST-picked answer.', o: ['Spaghetti', 'Penne', 'Fusilli', 'Lasagna sheets', 'Macaroni'], s: 'steep' },
  { k: 'cheese', c: 'food', q: 'Name a cheese. Match the MOST-picked answer.', o: ['Cheddar', 'Mozzarella', 'Parmesan', 'Feta', 'Brie'] },
  { k: 'spice', c: 'food', q: 'Name a spice. Match the MOST-picked answer.', o: ['Cinnamon', 'Pepper', 'Paprika', 'Cumin', 'Ginger'], s: 'flat' },
  { k: 'nut', c: 'food', q: 'Name a nut. Match the MOST-picked answer.', o: ['Peanut', 'Almond', 'Walnut', 'Cashew', 'Hazelnut'], s: 'steep' },
  { k: 'dessert', c: 'food', q: 'Name a dessert. Match the MOST-picked answer.', o: ['Ice cream', 'Chocolate cake', 'Cheesecake', 'Fruit salad', 'Pudding'], s: 'steep' },
  { k: 'sauce', c: 'food', q: 'Name a sauce. Match the MOST-picked answer.', o: ['Tomato sauce', 'Soy sauce', 'Mayonnaise', 'Mustard', 'Gravy'], s: 'flat' },
  { k: 'sandwich-filling', c: 'food', q: 'Name a sandwich filling. Match the MOST-picked answer.', o: ['Cheese', 'Ham', 'Egg', 'Tuna', 'Peanut butter'], s: 'flat' },
  { k: 'hot-drink', c: 'drink', q: 'Name a hot drink. Match the MOST-picked answer.', o: ['Coffee', 'Tea', 'Hot chocolate', 'Herbal tea', 'Hot water and lemon'], s: 'flat' },
  { k: 'sport-ball', c: 'sport', q: 'Name a sport played with a ball. Match the MOST-picked answer.', o: ['Soccer', 'Basketball', 'Tennis', 'Volleyball', 'Baseball'], s: 'flat' },
  { k: 'martial-art', c: 'sport', q: 'Name a martial art. Match the MOST-picked answer.', o: ['Karate', 'Judo', 'Taekwondo', 'Kung fu', 'Boxing'], s: 'steep' },
  { k: 'dance', c: 'music', q: 'Name a dance. Match the MOST-picked answer.', o: ['Salsa', 'Tango', 'Waltz', 'Ballet', 'Breakdance'], s: 'flat' },
  { k: 'greek-god', c: 'history', q: 'Name a Greek god. Match the MOST-picked answer.', o: ['Zeus', 'Poseidon', 'Athena', 'Apollo', 'Hades'], s: 'steep' },
  { k: 'dinosaur', c: 'science', q: 'Name a dinosaur. Match the MOST-picked answer.', o: ['Tyrannosaurus rex', 'Triceratops', 'Stegosaurus', 'Velociraptor', 'Brachiosaurus'], s: 'steep' },
  { k: 'wonder', c: 'history', q: 'Name a famous landmark. Match the MOST-picked answer.', o: ['Eiffel Tower', 'Great Wall of China', 'Pyramids of Giza', 'Taj Mahal', 'Colosseum'] },
  { k: 'invention', c: 'science', q: 'Name an important invention. Match the MOST-picked answer.', o: ['The wheel', 'Electricity', 'The printing press', 'The telephone', 'The airplane'], s: 'flat' },
  { k: 'unit-time', c: 'time', q: 'Name a unit of time. Match the MOST-picked answer.', o: ['Minute', 'Second', 'Hour', 'Day', 'Year'], s: 'flat' },
  { k: 'punctuation', c: 'language', q: 'Name a punctuation mark. Match the MOST-picked answer.', o: ['Comma', 'Period', 'Question mark', 'Exclamation point', 'Semicolon'] },
  { k: 'letter', c: 'language', q: 'Name a letter of the alphabet. Match the MOST-picked answer.', o: ['A', 'Z', 'M', 'S', 'B'], s: 'steep' },
  { k: 'small-number', c: 'science', q: 'Name a number from one to ten. Match the MOST-picked answer.', o: ['Seven', 'Three', 'Five', 'One', 'Ten'] },
  { k: 'vehicle', c: 'transport', q: 'Name a vehicle. Match the MOST-picked answer.', o: ['Car', 'Bus', 'Bicycle', 'Truck', 'Motorcycle'], s: 'steep' },
  { k: 'aircraft', c: 'transport', q: 'Name something that flies with an engine. Match the MOST-picked answer.', o: ['Airplane', 'Helicopter', 'Rocket', 'Drone', 'Glider'], s: 'steep' },
  { k: 'boat', c: 'water', q: 'Name a kind of boat. Match the MOST-picked answer.', o: ['Sailboat', 'Canoe', 'Ferry', 'Rowboat', 'Kayak'], s: 'flat' },
  { k: 'shop', c: 'city', q: 'Name a shop on a busy street. Match the MOST-picked answer.', o: ['Bakery', 'Pharmacy', 'Bookshop', 'Butcher', 'Florist'], s: 'flat' },
  { k: 'desk-thing', c: 'work', q: 'Name something on a desk. Match the MOST-picked answer.', o: ['Laptop', 'Pen', 'Mug', 'Notebook', 'Lamp'] },
  { k: 'bag-thing', c: 'home', q: 'Name something people carry every day. Match the MOST-picked answer.', o: ['Keys', 'Phone', 'Wallet', 'Water bottle', 'Headphones'], s: 'flat' },
  { k: 'fridge-thing', c: 'food', q: 'Name something in almost every fridge. Match the MOST-picked answer.', o: ['Milk', 'Butter', 'Eggs', 'Cheese', 'Ketchup'], s: 'steep' },
  { k: 'party-game', c: 'games', q: 'Name a party game. Match the MOST-picked answer.', o: ['Charades', 'Musical chairs', 'Hide and seek', 'Pin the tail', 'Twenty questions'], s: 'steep' },
  { k: 'playground', c: 'school', q: 'Name something in a playground. Match the MOST-picked answer.', o: ['Swings', 'Slide', 'Seesaw', 'Climbing frame', 'Sandpit'], s: 'steep' },
  { k: 'school-supply', c: 'school', q: 'Name something in a school bag. Match the MOST-picked answer.', o: ['Pencil', 'Notebook', 'Ruler', 'Eraser', 'Lunch box'] },
  { k: 'circus', c: 'party', q: 'Name a circus act. Match the MOST-picked answer.', o: ['Trapeze', 'Clowns', 'Juggling', 'Tightrope', 'Lion tamer'], s: 'flat' },
  { k: 'magic-trick', c: 'games', q: 'Name a magic trick. Match the MOST-picked answer.', o: ['Pulling a rabbit from a hat', 'Sawing someone in half', 'Card tricks', 'Disappearing act', 'Levitation'] },
  { k: 'fairy-tale', c: 'books', q: 'Name a fairy tale character. Match the MOST-picked answer.', o: ['Cinderella', 'Snow White', 'Little Red Riding Hood', 'Rapunzel', 'The Big Bad Wolf'] },
  { k: 'monster', c: 'film', q: 'Name a monster. Match the MOST-picked answer.', o: ['Vampire', 'Zombie', 'Werewolf', 'Ghost', 'Giant'] },
  { k: 'space-thing', c: 'space', q: 'Name something in the night sky. Match the MOST-picked answer.', o: ['Moon', 'Stars', 'Comet', 'Milky Way', 'Satellite'], s: 'steep' },
  { k: 'moon-word', c: 'space', q: 'Name something an astronaut needs. Match the MOST-picked answer.', o: ['A spacesuit', 'Oxygen', 'A helmet', 'Training', 'Freeze-dried food'], s: 'steep' },
  { k: 'tree-fruit', c: 'plants', q: 'Name a fruit that grows on a tree. Match the MOST-picked answer.', o: ['Apple', 'Orange', 'Mango', 'Pear', 'Cherry'], s: 'steep' },
  { k: 'grain', c: 'plants', q: 'Name a crop grown in a field. Match the MOST-picked answer.', o: ['Wheat', 'Corn', 'Rice', 'Potatoes', 'Barley'], s: 'flat' },
  { k: 'farm-machine', c: 'tools', q: 'Name a machine on a farm. Match the MOST-picked answer.', o: ['Tractor', 'Combine harvester', 'Plow', 'Milking machine', 'Baler'], s: 'steep' },
  { k: 'building', c: 'city', q: 'Name a building in a town center. Match the MOST-picked answer.', o: ['Town hall', 'Library', 'Post office', 'Bank', 'Cinema'], s: 'flat' },
  { k: 'bridge-word', c: 'city', q: 'Name something a bridge crosses. Match the MOST-picked answer.', o: ['A river', 'A road', 'A valley', 'A railway', 'A canal'], s: 'steep' },
  { k: 'clothing-cold', c: 'clothing', q: 'Name something knitted. Match the MOST-picked answer.', o: ['A sweater', 'A scarf', 'A hat', 'Socks', 'Mittens'], s: 'steep' },
  { k: 'shoe-type', c: 'clothing', q: 'Name a type of shoe. Match the MOST-picked answer.', o: ['Sneakers', 'Boots', 'Sandals', 'Slippers', 'Flip-flops'], s: 'steep' },
  { k: 'emoji-face', c: 'tech', q: 'Name a face people text a lot. Match the MOST-picked answer.', o: ['Laughing', 'Smiling', 'Winking', 'Crying', 'Thinking'], s: 'steep' },
  { k: 'phone-thing', c: 'tech', q: 'Name something people do on a phone while waiting. Match the MOST-picked answer.', o: ['Scroll', 'Message someone', 'Check the time', 'Play a game', 'Read the news'], s: 'flat' },
  { k: 'tv-genre', c: 'film', q: 'Name a kind of television show. Match the MOST-picked answer.', o: ['Comedy', 'Drama', 'Documentary', 'Cooking show', 'Game show'], s: 'flat' },
  { k: 'instrument-loud', c: 'music', q: 'Name something in a marching band. Match the MOST-picked answer.', o: ['Drum', 'Trumpet', 'Trombone', 'Flute', 'Cymbals'], s: 'steep' },
  { k: 'song-part', c: 'music', q: 'Name a part of a song. Match the MOST-picked answer.', o: ['Chorus', 'Verse', 'Intro', 'Bridge', 'Solo'], s: 'steep' },
  { k: 'sea-weather', c: 'weather', q: 'Name something you grab before going out in a storm. Match the MOST-picked answer.', o: ['Umbrella', 'Raincoat', 'Boots', 'Flashlight', 'A hat'], s: 'steep' },
  { k: 'gift', c: 'party', q: 'Name a present that always works. Match the MOST-picked answer.', o: ['Chocolate', 'Flowers', 'A book', 'A candle', 'A gift card'], s: 'flat' },
];

// ─────────────────────────── RARE BIRD (unique) ──────────────────────────────
// Eight options, written most-picked first. The player is hunting the tail:
// scoring pays 2 for the two rarest picks, so o[6] and o[7] are the target and
// o[5] must be a clear step above them. The craft is a set where seven options
// are all things a person might really choose and the tail is the one that only
// a contrarian or a specialist reaches for — obscure, not silly.
export const UNIQUE = [
  { k: 'pencil-case', c: 'school', q: 'Everyone empties a pencil case and keeps one thing. The RAREST pick wins.', o: ['Pen', 'Pencil', 'Eraser', 'Ruler', 'Sharpener', 'Highlighter', 'Compass', 'Protractor'], s: 'flat' },
  { k: 'jam-flavor', c: 'food', q: 'Everyone opens one jar of jam. The RAREST pick wins.', o: ['Strawberry', 'Raspberry', 'Apricot', 'Blackcurrant', 'Orange marmalade', 'Fig', 'Quince', 'Rhubarb and ginger'], s: 'steep' },
  { k: 'tea-type', c: 'drink', q: 'Everyone is handed one cup of tea. The RAREST pick wins.', o: ['Black tea', 'Green tea', 'Mint', 'Chamomile', 'Oolong', 'Jasmine', 'Rooibos', 'Pu-erh'], s: 'steep' },
  { k: 'taco-filling', c: 'food', q: 'Everyone builds one taco. The RAREST filling wins.', o: ['Chicken', 'Beef', 'Beans', 'Fish', 'Pork', 'Mushroom', 'Cactus', 'Tongue'], s: 'flat' },
  { k: 'dumpling', c: 'food', q: 'Everyone folds one dumpling. The RAREST filling wins.', o: ['Pork', 'Vegetable', 'Chicken', 'Shrimp', 'Beef', 'Tofu', 'Pumpkin', 'Nettle'], s: 'steep' },
  { k: 'potato-way', c: 'food', q: 'Everyone cooks one potato. The RAREST method wins.', o: ['Roasted', 'Mashed', 'Fried', 'Baked', 'Boiled', 'In a soup', 'Grated into cakes', 'Raw in a salad'], s: 'flat' },
  { k: 'salad-leaf', c: 'plants', q: 'Everyone throws one leaf in the salad. The RAREST pick wins.', o: ['Lettuce', 'Spinach', 'Rocket', 'Kale', 'Watercress', 'Chard', 'Sorrel', 'Dandelion'], s: 'steep' },
  { k: 'berry', c: 'plants', q: 'Everyone picks one berry. The RAREST pick wins.', o: ['Strawberry', 'Blueberry', 'Raspberry', 'Blackberry', 'Cranberry', 'Redcurrant', 'Elderberry', 'Cloudberry'], s: 'steep' },
  { k: 'citrus', c: 'plants', q: 'Everyone squeezes one citrus fruit. The RAREST pick wins.', o: ['Orange', 'Lemon', 'Lime', 'Grapefruit', 'Mandarin', 'Blood orange', 'Pomelo', 'Yuzu'], s: 'steep' },
  { k: 'cookie', c: 'food', q: 'Everyone takes one cookie from the tin. The RAREST pick wins.', o: ['Chocolate chip', 'Oatmeal', 'Shortbread', 'Ginger', 'Peanut butter', 'Almond', 'Fig roll', 'Anise'], s: 'steep' },
  { k: 'pancake-top', c: 'food', q: 'Everyone tops one pancake. The RAREST topping wins.', o: ['Syrup', 'Sugar and lemon', 'Berries', 'Chocolate spread', 'Honey', 'Yogurt', 'Savory cheese', 'Caviar'], s: 'steep' },
  { k: 'picnic-item', c: 'food', q: 'Everyone brings one thing to the picnic. The RAREST pick wins.', o: ['Sandwiches', 'Fruit', 'Chips', 'A cake', 'A blanket', 'A thermos', 'A kite', 'A folding chair'], s: 'steep' },
  { k: 'fries-dip', c: 'food', q: 'Everyone dips fries in one thing. The RAREST pick wins.', o: ['Ketchup', 'Mayonnaise', 'Nothing', 'Cheese sauce', 'Mustard', 'Vinegar', 'Curry sauce', 'Honey'], s: 'steep' },
  { k: 'noodle-type', c: 'food', q: 'Everyone orders one kind of noodle. The RAREST pick wins.', o: ['Ramen', 'Spaghetti', 'Rice noodles', 'Udon', 'Egg noodles', 'Soba', 'Glass noodles', 'Hand-pulled'], s: 'flat' },
  { k: 'yoga-pose', c: 'sport', q: 'Everyone holds one pose. The RAREST pick wins.', o: ['Child\'s pose', 'Downward dog', 'Tree', 'Warrior', 'Cobra', 'Bridge', 'Crow', 'Headstand'], s: 'flat' },
  { k: 'gym-machine', c: 'sport', q: 'Everyone gets one machine at the gym. The RAREST pick wins.', o: ['Treadmill', 'Exercise bike', 'Rowing machine', 'Cross trainer', 'Cable machine', 'Leg press', 'Stair climber', 'Ski machine'], s: 'steep' },
  { k: 'race-distance', c: 'sport', q: 'Everyone signs up for one race. The RAREST distance wins.', o: ['5K', '10K', 'Half marathon', 'A one-mile fun run', 'Marathon', 'A relay leg', 'A 400m sprint', 'A 24-hour race'], s: 'steep' },
  { k: 'tent-spot', c: 'travel', q: 'Everyone pitches one tent. The RAREST spot wins.', o: ['Near the washrooms', 'Under a tree', 'By the lake', 'Middle of the field', 'On the edge', 'On a slope with a view', 'Next to the road', 'Behind the trash bins'] },
  { k: 'rocket-part', c: 'space', q: 'Everyone is handed one job on a rocket team. The RAREST pick wins.', o: ['Pilot', 'Engineer', 'Doctor', 'Scientist', 'Navigator', 'Cook', 'Photographer', 'Gardener'], s: 'flat' },
  { k: 'lab-kit', c: 'science', q: 'Everyone takes one thing from the lab bench. The RAREST pick wins.', o: ['Microscope', 'Test tube', 'Magnet', 'Scales', 'Bunsen burner', 'Pipette', 'Tuning fork', 'Barometer'], s: 'steep' },
  { k: 'rock-type', c: 'science', q: 'Everyone picks one rock off the beach. The RAREST pick wins.', o: ['A smooth gray one', 'A white one', 'A striped one', 'A flat skimmer', 'One with a hole', 'A piece of quartz', 'A fossil', 'A lump of coal'], s: 'flat' },
  { k: 'desert-animal', c: 'animals', q: 'Everyone spots one desert animal. The RAREST pick wins.', o: ['Camel', 'Snake', 'Lizard', 'Scorpion', 'Fox', 'Meerkat', 'Roadrunner', 'Jerboa'], s: 'steep' },
  { k: 'arctic-animal', c: 'animals', q: 'Everyone spots one animal on the ice. The RAREST pick wins.', o: ['Polar bear', 'Penguin', 'Seal', 'Walrus', 'Arctic fox', 'Reindeer', 'Snowy owl', 'Narwhal'], s: 'steep' },
  { k: 'rainforest', c: 'animals', q: 'Everyone spots one animal in the rainforest. The RAREST pick wins.', o: ['Monkey', 'Parrot', 'Snake', 'Frog', 'Jaguar', 'Sloth', 'Toucan', 'Tapir'], s: 'steep' },
  { k: 'horse-color', c: 'animals', q: 'Everyone is given one horse. The RAREST color wins.', o: ['Brown', 'Black', 'White', 'Gray', 'Palomino', 'Dappled', 'Roan', 'Piebald'], s: 'steep' },
  { k: 'cat-breed', c: 'animals', q: 'Everyone chooses one cat. The RAREST pick wins.', o: ['Tabby', 'Black cat', 'Ginger', 'Siamese', 'Persian', 'Maine Coon', 'Bengal', 'Sphynx'], s: 'flat' },
  { k: 'tank-fish', c: 'water', q: 'Everyone adds one fish to the tank. The RAREST pick wins.', o: ['Goldfish', 'Guppy', 'Angelfish', 'Molly', 'Catfish', 'Betta', 'Loach', 'Pufferfish'], s: 'steep' },
  { k: 'butterfly', c: 'animals', q: 'Everyone follows one butterfly. The RAREST pick wins.', o: ['Monarch', 'Cabbage white', 'Swallowtail', 'Red admiral', 'Blue morpho', 'Peacock', 'Fritillary', 'Hairstreak'], s: 'steep' },
  { k: 'garden-tool', c: 'tools', q: 'Everyone grabs one garden tool. The RAREST pick wins.', o: ['Trowel', 'Spade', 'Rake', 'Watering can', 'Shears', 'Fork', 'Hoe', 'Dibber'], s: 'flat' },
  { k: 'houseplant', c: 'plants', q: 'Everyone takes home one houseplant. The RAREST pick wins.', o: ['Spider plant', 'Cactus', 'Fern', 'Orchid', 'Rubber plant', 'Bonsai', 'Venus flytrap', 'Air plant'], s: 'flat' },
  { k: 'paint-finish', c: 'home', q: 'Everyone paints one wall. The RAREST finish wins.', o: ['Matte white', 'Soft gray', 'Warm cream', 'Pale blue', 'Sage green', 'Deep navy', 'Metallic', 'Blackboard paint'], s: 'flat' },
  { k: 'doorbell', c: 'home', q: 'Everyone chooses one doorbell sound. The RAREST pick wins.', o: ['A simple ding-dong', 'A single chime', 'A buzzer', 'A tune', 'A knocker instead', 'A bird call', 'A gong', 'A dog bark'], s: 'steep' },
  { k: 'keyring', c: 'home', q: 'Everyone hangs one thing on a key ring. The RAREST pick wins.', o: ['A souvenir tag', 'A photo fob', 'A bottle opener', 'A small flashlight', 'A soft toy', 'A whistle', 'A compass', 'A tiny bell'], s: 'flat' },
  { k: 'coin-pocket', c: 'money', q: 'Everyone keeps one coin for luck. The RAREST pick wins.', o: ['The smallest one', 'The biggest one', 'A foreign coin', 'An old coin', 'A shiny new one', 'A holed coin', 'A bent one', 'A coin from a birth year'], s: 'flat' },
  { k: 'souvenir', c: 'travel', q: 'Everyone brings back one souvenir. The RAREST pick wins.', o: ['A magnet', 'A postcard', 'A keyring', 'Local sweets', 'A T-shirt', 'A guidebook', 'A pressed coin', 'A handful of sand'], s: 'steep' },
  { k: 'postcard-scene', c: 'travel', q: 'Everyone sends one postcard. The RAREST picture wins.', o: ['A beach', 'A famous building', 'Mountains', 'A market', 'A sunset', 'A funny animal', 'A map', 'A local bus'], s: 'flat' },
  { k: 'airport-wait', c: 'travel', q: 'Everyone has one hour at the gate. The RAREST way to spend it wins.', o: ['Read', 'Scroll', 'Eat something', 'Walk around', 'Nap', 'Watch planes', 'Write postcards', 'Learn ten words of the language'], s: 'flat' },
  { k: 'train-seat-pick', c: 'transport', q: 'Everyone books one train seat. The RAREST pick wins.', o: ['Window, facing forward', 'Window, facing back', 'Aisle', 'A table of four', 'Near the doors', 'Quiet car', 'By the luggage rack', 'The fold-down by the toilet'], s: 'steep' },
  { k: 'bike-color', c: 'transport', q: 'Everyone is given one bicycle. The RAREST color wins.', o: ['Black', 'Blue', 'Red', 'White', 'Green', 'Yellow', 'Orange', 'Pink'], s: 'flat' },
  { k: 'weather-day', c: 'weather', q: 'Everyone orders one kind of day. The RAREST pick wins.', o: ['Sunny and warm', 'Bright and cool', 'A light breeze', 'Fresh after rain', 'Crisp and frosty', 'Misty', 'A big thunderstorm', 'Heavy snow'], s: 'steep' },
  { k: 'umbrella', c: 'weather', q: 'Everyone opens one umbrella. The RAREST pick wins.', o: ['Plain black', 'A bright color', 'A folding one', 'A clear dome', 'Striped', 'Polka dots', 'A golf umbrella', 'A parasol'], s: 'steep' },
  { k: 'ice-cream-cone', c: 'food', q: 'Everyone takes one cone. The RAREST pick wins.', o: ['A plain wafer cone', 'A sugar cone', 'A waffle cone', 'A tub instead', 'A cone with sprinkles', 'A cone dipped in chocolate', 'A brioche bun', 'Two cones stacked'], s: 'flat' },
  { k: 'milkshake', c: 'drink', q: 'Everyone orders one milkshake. The RAREST flavor wins.', o: ['Chocolate', 'Vanilla', 'Strawberry', 'Banana', 'Caramel', 'Coffee', 'Pistachio', 'Salted licorice'], s: 'steep' },
  { k: 'juice', c: 'drink', q: 'Everyone pours one juice. The RAREST pick wins.', o: ['Orange', 'Apple', 'Pineapple', 'Cranberry', 'Grape', 'Tomato', 'Beet', 'Celery'], s: 'steep' },
  { k: 'water-bottle', c: 'water', q: 'Everyone fills one bottle. The RAREST pick wins.', o: ['Tap water', 'Sparkling water', 'Water with ice', 'Water with lemon', 'Cold from the fridge', 'Warm water', 'Water with mint', 'Water with cucumber'], s: 'steep' },
  { k: 'board-piece', c: 'games', q: 'Everyone takes one game piece. The RAREST pick wins.', o: ['The red one', 'The blue one', 'The green one', 'The yellow one', 'The black one', 'The white one', 'The purple one', 'Whichever is left'], s: 'flat' },
  { k: 'puzzle-start', c: 'games', q: 'Everyone starts one jigsaw. The RAREST way to start wins.', o: ['The edges', 'The corners', 'The picture on the box', 'Sort by color', 'The biggest shape', 'The sky', 'The middle', 'Straight in, no sorting'], s: 'steep' },
  { k: 'dice-number', c: 'games', q: 'Everyone calls one result before rolling two dice. The RAREST call wins.', o: ['Seven', 'Double six', 'Snake eyes', 'Doubles of any kind', 'Eleven', 'Six', 'Eight', 'Four'], s: 'steep' },
  { k: 'card-trick-pick', c: 'games', q: 'Everyone picks one card from the fan. The RAREST pick wins.', o: ['The middle one', 'The one on top', 'The bottom one', 'The one closest', 'The one furthest', 'The second from the left', 'The one just pushed forward', 'Two at once'] },
  { k: 'stage-role', c: 'art', q: 'Everyone takes one job in the school play. The RAREST pick wins.', o: ['The lead', 'A speaking part', 'Backstage crew', 'Lighting', 'Costumes', 'Prompt', 'Sound', 'Front of house'], s: 'flat' },
  { k: 'museum-guide', c: 'art', q: 'Everyone takes one guided tour. The RAREST pick wins.', o: ['Highlights in an hour', 'Ancient world', 'Modern art', 'Behind the scenes', 'Rooftop and views', 'Conservation lab', 'Storerooms', 'Night tour'] },
  { k: 'craft-hobby', c: 'art', q: 'Everyone learns one craft this winter. The RAREST pick wins.', o: ['Knitting', 'Drawing', 'Pottery', 'Photography', 'Baking', 'Woodwork', 'Bookbinding', 'Glassblowing'], s: 'flat' },
  { k: 'photo-mode', c: 'tech', q: 'Everyone takes one photo. The RAREST way wins.', o: ['Phone, straight on', 'Phone, portrait mode', 'A selfie', 'Black and white', 'A panorama', 'A close-up', 'A long exposure', 'A film camera'], s: 'flat' },
  { k: 'password-style', c: 'tech', q: 'Everyone invents one strong password. The RAREST style wins.', o: ['A word and numbers', 'Three random words', 'A phrase', 'A pet name and a year', 'Random letters', 'A line from a song', 'Keyboard pattern', 'A password manager makes it'] },
  { k: 'ringtone', c: 'tech', q: 'Everyone sets one ringtone. The RAREST pick wins.', o: ['The default', 'Silent', 'Vibrate only', 'A classic ring', 'A song', 'A marimba tune', 'A bird sound', 'A recorded voice'], s: 'flat' },
  { k: 'book-place', c: 'books', q: 'Everyone reads one book somewhere. The RAREST place wins.', o: ['In bed', 'On the sofa', 'On a train', 'In a cafe', 'In a park', 'In the bath', 'On a balcony', 'In a library reading room'], s: 'steep' },
  { k: 'bookmark', c: 'books', q: 'Everyone marks one page. The RAREST way wins.', o: ['A real bookmark', 'A receipt', 'Fold the corner', 'A ribbon', 'Remember the number', 'A photo of the page', 'A leaf', 'Leave it face down open'], s: 'flat' },
  { k: 'poem-line', c: 'language', q: 'Everyone learns one thing by heart. The RAREST pick wins.', o: ['A poem', 'Song lyrics', 'A speech', 'A phone number', 'A recipe', 'A map route', 'A card order', 'Pi to twenty places'], s: 'flat' },
  { k: 'new-word', c: 'language', q: 'Everyone teaches one word to a visitor. The RAREST pick wins.', o: ['Hello', 'Thank you', 'Please', 'Goodbye', 'Sorry', 'Water', 'Friend', 'Tomorrow'], s: 'steep' },
  { k: 'handwriting', c: 'language', q: 'Everyone writes one note by hand. The RAREST style wins.', o: ['Normal handwriting', 'Neat print', 'Cursive', 'Capitals', 'Tiny writing', 'Big loopy writing', 'Left-slanted', 'Calligraphy'], s: 'steep' },
  { k: 'clock-hour', c: 'time', q: 'Everyone stops one clock at one time. The RAREST pick wins.', o: ['Noon', 'Quarter to two', 'Nine', 'Six', 'Three', 'Eleven', 'Half past four', 'Twenty past eight'], s: 'flat' },
  { k: 'month-birthday', c: 'time', q: 'Everyone moves their birthday to one month. The RAREST pick wins.', o: ['June', 'July', 'December', 'May', 'September', 'October', 'February', 'January'], s: 'flat' },
  { k: 'work-break', c: 'work', q: 'Everyone takes one ten-minute break. The RAREST pick wins.', o: ['Make a drink', 'Step outside', 'Scroll', 'Chat to someone', 'Stretch', 'Stare out the window', 'Tidy the desk', 'Do a crossword'], s: 'flat' },
  { k: 'meeting-seat', c: 'work', q: 'Everyone takes one seat in a meeting room. The RAREST pick wins.', o: ['Middle of the table', 'Near the door', 'Facing the window', 'Head of the table', 'Corner', 'Next to the screen', 'Standing at the back', 'The spare chair by the wall'], s: 'flat' },
  { k: 'city-view', c: 'city', q: 'Everyone gets one view over a city. The RAREST pick wins.', o: ['From a tower', 'From a hill', 'From a rooftop bar', 'From a big wheel', 'From a bridge', 'From a plane window', 'From a cathedral roof', 'From a parking garage'], s: 'flat' },
  { k: 'street-corner', c: 'city', q: 'Everyone waits on one street corner. The RAREST pick wins.', o: ['Outside the station', 'By the fountain', 'Under the clock', 'Outside the bakery', 'By the newsstand', 'At the bus shelter', 'By the statue', 'At the taxi rank'], s: 'flat' },
  { k: 'mountain-job', c: 'geography', q: 'Everyone takes one job at a mountain hut. The RAREST pick wins.', o: ['Cooking', 'Guiding walks', 'Cleaning', 'The radio', 'Chopping wood', 'Carrying supplies up', 'Weather readings', 'Mending boots'], s: 'flat' },
  { k: 'island-day', c: 'geography', q: 'Everyone spends one day on a small island. The RAREST pick wins.', o: ['Walk the coast', 'Swim', 'Visit the lighthouse', 'Sit and read', 'Fish', 'Watch birds', 'Draw the view', 'Count the sheep'], s: 'flat' },
  { k: 'volcano-look', c: 'science', q: 'Everyone studies one thing about a volcano. The RAREST pick wins.', o: ['The lava', 'The last eruption', 'The crater', 'The ash', 'The people nearby', 'The gases', 'The rocks it made', 'The sound it makes'], s: 'steep' },
  { k: 'weather-tool', c: 'weather', q: 'Everyone reads one instrument at a weather station. The RAREST pick wins.', o: ['Thermometer', 'Rain gauge', 'Wind vane', 'Barometer', 'Anemometer', 'Hygrometer', 'Sunshine recorder', 'Snow board'], s: 'steep' },
  { k: 'flag-color', c: 'history', q: 'Everyone designs one flag with one main color. The RAREST pick wins.', o: ['Blue', 'Red', 'Green', 'White', 'Yellow', 'Black', 'Orange', 'Purple'], s: 'flat' },
  { k: 'time-machine', c: 'history', q: 'Everyone visits one era for a day. The RAREST pick wins.', o: ['The 1960s', 'Ancient Rome', 'The 1920s', 'Ancient Egypt', 'The Middle Ages', 'The 1800s', 'The Stone Age', 'The year 3000'], s: 'flat' },
  { k: 'museum-object', c: 'history', q: 'Everyone puts one object in a time capsule. The RAREST pick wins.', o: ['A photo', 'A letter', 'A coin', 'A newspaper', 'A phone', 'A recipe', 'A ticket stub', 'A seed'], s: 'steep' },
  { k: 'party-job', c: 'party', q: 'Everyone takes one job at the party. The RAREST pick wins.', o: ['Music', 'Food', 'Drinks', 'Decorations', 'Greeting people', 'Photos', 'Cleaning up', 'Keeping the cat calm'], s: 'flat' },
  { k: 'candle-number', c: 'party', q: 'Everyone lights one candle somewhere. The RAREST spot wins.', o: ['On the cake', 'On the table', 'By the window', 'In the bathroom', 'On a shelf', 'In a lantern outside', 'On the stairs', 'In the fireplace'], s: 'steep' },
  { k: 'sock-drawer', c: 'clothing', q: 'Everyone pulls one pair of socks. The RAREST pick wins.', o: ['Plain black', 'White sports socks', 'Gray', 'Striped', 'Patterned', 'Woolly', 'Bright yellow', 'Odd ones on purpose'], s: 'steep' },
  { k: 'hat-weather', c: 'clothing', q: 'Everyone covers their head one way for a cold walk. The RAREST pick wins.', o: ['A beanie', 'A hood', 'A bobble hat', 'Earmuffs', 'A scarf over the head', 'A fur-lined hat', 'A beret', 'Nothing at all'], s: 'steep' },
  { k: 'sleep-position', c: 'body', q: 'Everyone falls asleep in one position. The RAREST pick wins.', o: ['On one side', 'On the back', 'Curled up', 'On the front', 'One arm out', 'Half sitting up', 'Diagonally', 'Starfish'], s: 'steep' },
  { k: 'first-aid', c: 'body', q: 'Everyone packs one thing in a first aid kit. The RAREST pick wins.', o: ['Bandages', 'Antiseptic', 'Painkillers', 'Scissors', 'Tape', 'Tweezers', 'A cold pack', 'A foil blanket'], s: 'steep' },
];

// ─────────────────────────── HERD ────────────────────────────────────────────
// The one prompt with a true answer — which is NOT what the player is chasing.
// The target is the crowd's MEDIAN guess, and the reveal shows the truth beside
// it. Fields:
//   q     the question stem only. gen-outwit.mjs appends the standard tail, so
//         every Herd prompt in the bank reads identically after the question mark.
//   t     the true answer, and `n` the one-line note the reveal prints.
//   c0    THE CROWD'S CENTRAL GUESS — an authoring estimate of where the median
//         lands, which is deliberately NOT always `t`. Most entries here put the
//         crowd somewhere other than the truth, because the gap is the whole
//         reveal: a bank where the crowd is always right is a trivia bank wearing
//         a crowd game's clothes. gen-outwit.mjs prints how many boards in a run
//         land the crowd off the truth rather than asserting a number here that
//         would rot the moment an entry changed.
//   sp    spread: 'tight' | 'mid' | 'wide'. How far the guesses fan out.
//   sk    skew: -1 low tail, 0 symmetric, +1 high tail. Crowds skew high on
//         "how many are there" questions and low on anything that sounds small.
// A question only earns a place here if a reasonable person could be off by a
// lot: "how many strings on a guitar" has no crowd, only an answer.
export const HERD = [
  { k: 'un-countries', c: 'geography', q: 'How many countries are members of the United Nations', min: 20, max: 600, t: 193, n: 'The UN has had 193 member states since 2011.', c0: 195, sp: 'mid', sk: 1 },
  { k: 'muscles-body', c: 'body', q: 'How many muscles are in the human body', min: 10, max: 3000, t: 600, n: 'Roughly 600 named skeletal muscles.', c0: 400, sp: 'wide', sk: 1 },
  { k: 'bones-hand', c: 'body', q: 'How many bones are in one human hand and wrist', min: 1, max: 100, t: 27, n: 'Twenty-seven, wrist bones included.', c0: 20, sp: 'mid', sk: 0 },
  { k: 'bones-foot', c: 'body', q: 'How many bones are in one human foot', min: 1, max: 100, t: 26, n: 'Twenty-six bones in each foot.', c0: 20, sp: 'mid', sk: 0 },
  { k: 'bones-skull', c: 'body', q: 'How many bones are in the human skull', min: 1, max: 100, t: 22, n: 'Twenty-two, counting the jaw and the face.', c0: 8, sp: 'wide', sk: 1 },
  { k: 'blink-minute', c: 'body', q: 'How many times does a person blink in a minute', min: 1, max: 120, t: 17, n: 'Around fifteen to twenty times a minute.', c0: 15, sp: 'mid', sk: 1 },
  { k: 'breaths-minute', c: 'body', q: 'How many breaths does a resting adult take in a minute', min: 1, max: 100, t: 14, n: 'Usually twelve to twenty a minute at rest; fourteen is typical.', c0: 16, sp: 'mid', sk: 0 },
  { k: 'heartbeats-day', c: 'body', q: 'How many times does a heart beat in one day', min: 1000, max: 500000, t: 100000, n: 'About a hundred thousand beats a day.', c0: 90000, sp: 'wide', sk: 0 },
  { k: 'hairs-head', c: 'body', q: 'How many hairs are on a typical human head', min: 1000, max: 1000000, t: 100000, n: 'Around a hundred thousand.', c0: 80000, sp: 'wide', sk: 0 },
  { k: 'taste-buds', c: 'body', q: 'How many taste buds does an adult have', min: 50, max: 200000, t: 10000, n: 'Roughly ten thousand, replaced every couple of weeks.', c0: 3000, sp: 'wide', sk: 1 },
  { k: 'words-day', c: 'language', q: 'How many words does an average person speak in a day', min: 100, max: 200000, t: 16000, n: 'Studies land near sixteen thousand for men and women alike.', c0: 7000, sp: 'wide', sk: 1 },
  { k: 'dreams-night', c: 'science', q: 'How many separate dreams does a person have in one night', min: 1, max: 50, t: 5, n: 'Four to six dream periods a night, most of them forgotten.', c0: 3, sp: 'mid', sk: 1 },
  { k: 'giraffe-neck', c: 'animals', q: 'How many bones are in a giraffe neck', min: 1, max: 100, t: 7, n: 'Seven, the same number as in a human neck. They are just very long.', c0: 20, sp: 'wide', sk: 1 },
  { k: 'bee-eyes', c: 'animals', q: 'How many eyes does a honeybee have', min: 1, max: 30, t: 5, n: 'Two big compound eyes and three simple ones on top.', c0: 2, sp: 'tight', sk: 1 },
  { k: 'bee-wings', c: 'animals', q: 'How many wings does a bee have', min: 1, max: 20, t: 4, n: 'Four: two pairs that hook together in flight.', c0: 2, sp: 'tight', sk: 1 },
  { k: 'lobster-legs', c: 'animals', q: 'How many legs does a lobster have', min: 1, max: 40, t: 10, n: 'Ten, claws included. That is what decapod means.', c0: 8, sp: 'mid', sk: 0 },
  { k: 'earthworm-hearts', c: 'animals', q: 'How many hearts does an earthworm have', min: 1, max: 30, t: 5, n: 'Five pairs of aortic arches do the pumping, usually counted as five hearts.', c0: 2, sp: 'mid', sk: 1 },
  { k: 'cat-toes', c: 'animals', q: 'How many toes does a cat have altogether', min: 4, max: 60, t: 18, n: 'Five on each front paw, four on each back paw.', c0: 16, sp: 'tight', sk: 1 },
  { k: 'cat-ear-muscles', c: 'animals', q: 'How many muscles control each cat ear', min: 1, max: 200, t: 32, n: 'Thirty-two, which is why the ears swivel independently.', c0: 8, sp: 'wide', sk: 1 },
  { k: 'snail-teeth', c: 'animals', q: 'How many teeth does a garden snail have', min: 1, max: 100000, t: 14000, n: 'Thousands of tiny teeth on a ribbon called a radula.', c0: 60, sp: 'wide', sk: 1 },
  { k: 'spider-eyes', c: 'animals', q: 'How many eyes does a common house spider have', min: 1, max: 30, t: 8, n: 'Eight, in two rows of four.', c0: 8, sp: 'mid', sk: 0 },
  { k: 'ladybug-spots', c: 'animals', q: 'How many spots does a common seven-spot ladybug have', min: 1, max: 40, t: 7, n: 'Seven, and the name gives it away.', c0: 7, sp: 'tight', sk: 1 },
  { k: 'horse-bones', c: 'animals', q: 'How many bones are in a horse', min: 20, max: 1000, t: 205, n: 'About 205, close to a human count of 206.', c0: 200, sp: 'wide', sk: 1 },
  { k: 'hen-eggs', c: 'animals', q: 'How many eggs does a laying hen produce in a year', min: 10, max: 1000, t: 290, n: 'A good layer manages close to three hundred.', c0: 200, sp: 'mid', sk: 1 },
  { k: 'cat-sleep', c: 'animals', q: 'How many hours a day does a cat sleep', min: 1, max: 24, t: 15, n: 'Twelve to sixteen hours, spread over the whole day.', c0: 16, sp: 'mid', sk: 0 },
  { k: 'ant-species', c: 'science', q: 'How many species of ant have been described', min: 10, max: 200000, t: 14000, n: 'Around fourteen thousand named species, with more every year.', c0: 3000, sp: 'wide', sk: 1 },
  { k: 'bee-flowers', c: 'science', q: 'How many flowers must bees visit for one jar of honey, in thousands', min: 1, max: 20000, t: 2000, n: 'Roughly two million flowers for a single jar.', c0: 300, sp: 'wide', sk: 1 },
  { k: 'strawberry-seeds', c: 'plants', q: 'How many seeds are on the outside of one strawberry', min: 5, max: 2000, t: 200, n: 'About two hundred, and each one is technically a separate fruit.', c0: 90, sp: 'wide', sk: 1 },
  { k: 'rice-grains', c: 'food', q: 'How many grains of rice are in one kilogram', min: 100, max: 500000, t: 50000, n: 'Around fifty thousand grains to the kilo.', c0: 15000, sp: 'wide', sk: 1 },
  { k: 'apple-calories', c: 'food', q: 'How many calories are in a medium apple', min: 10, max: 800, t: 95, n: 'Around ninety-five.', c0: 90, sp: 'mid', sk: 1 },
  { k: 'languages-world', c: 'language', q: 'How many languages are spoken in the world today', min: 100, max: 50000, t: 7000, n: 'About seven thousand, and a large share have very few speakers left.', c0: 3000, sp: 'wide', sk: 1 },
  { k: 'greek-letters', c: 'language', q: 'How many letters are in the Greek alphabet', min: 1, max: 100, t: 24, n: 'Twenty-four, from alpha to omega.', c0: 25, sp: 'mid', sk: 0 },
  { k: 'russian-letters', c: 'language', q: 'How many letters are in the Russian alphabet', min: 1, max: 100, t: 33, n: 'Thirty-three in the modern Cyrillic alphabet.', c0: 30, sp: 'mid', sk: 0 },
  { k: 'chinese-chars', c: 'language', q: 'How many Chinese characters do you need to read a newspaper', min: 100, max: 50000, t: 3000, n: 'Around three thousand covers most of a daily paper.', c0: 2000, sp: 'wide', sk: 1 },
  { k: 'novel-words', c: 'books', q: 'How many words are in a typical novel', min: 1000, max: 500000, t: 85000, n: 'Most adult novels land between seventy and a hundred thousand words.', c0: 60000, sp: 'wide', sk: 1 },
  { k: 'brazil-borders', c: 'geography', q: 'How many countries share a land border with Brazil', min: 1, max: 40, t: 10, n: 'Ten. Only Chile and Ecuador miss out in South America.', c0: 6, sp: 'mid', sk: 1 },
  { k: 'china-borders', c: 'geography', q: 'How many countries share a land border with China', min: 1, max: 40, t: 14, n: 'Fourteen, tied with Russia for the most of any country.', c0: 8, sp: 'mid', sk: 1 },
  { k: 'south-america', c: 'geography', q: 'How many countries are in South America', min: 1, max: 60, t: 12, n: 'Twelve sovereign countries.', c0: 12, sp: 'mid', sk: 1 },
  { k: 'eu-members', c: 'geography', q: 'How many countries are in the European Union', min: 1, max: 100, t: 27, n: 'Twenty-seven member states.', c0: 27, sp: 'mid', sk: 1 },
  { k: 'drive-left', c: 'geography', q: 'How many countries and territories drive on the left', min: 1, max: 200, t: 75, n: 'About seventy-five countries and territories, roughly a third of the world.', c0: 30, sp: 'wide', sk: 1 },
  { k: 'un-languages', c: 'language', q: 'How many official languages does the United Nations use', min: 1, max: 50, t: 6, n: 'Six: Arabic, Chinese, English, French, Russian and Spanish.', c0: 6, sp: 'mid', sk: 1 },
  { k: 'everest-height', c: 'geography', q: 'How tall is Mount Everest, in meters', min: 500, max: 30000, t: 8849, n: 'Eight thousand eight hundred and forty-nine meters at the summit.', c0: 8500, sp: 'mid', sk: 0 },
  { k: 'ocean-deep', c: 'water', q: 'How deep is the deepest point of the ocean, in meters', min: 100, max: 50000, t: 10900, n: 'About 10,900 meters down, in the Mariana Trench.', c0: 7000, sp: 'wide', sk: 1 },
  { k: 'greece-islands', c: 'geography', q: 'How many Greek islands have people living on them', min: 1, max: 3000, t: 227, n: 'Around 227 inhabited, out of several thousand islands.', c0: 100, sp: 'wide', sk: 1 },
  { k: 'sunlight-minutes', c: 'space', q: 'How many minutes does sunlight take to reach Earth', min: 1, max: 200, t: 8, n: 'About eight minutes and twenty seconds.', c0: 8, sp: 'mid', sk: 1 },
  { k: 'ringed-planets', c: 'space', q: 'How many planets in our solar system have rings', min: 1, max: 12, t: 4, n: 'Four. Jupiter, Saturn, Uranus and Neptune all have ring systems.', c0: 2, sp: 'tight', sk: 1 },
  { k: 'lunar-month', c: 'space', q: 'How many days pass between one new moon and the next', min: 1, max: 200, t: 29, n: 'About twenty-nine and a half days.', c0: 28, sp: 'mid', sk: 1 },
  { k: 'minutes-day', c: 'time', q: 'How many minutes are in one day', min: 100, max: 10000, t: 1440, n: 'One thousand four hundred and forty.', c0: 1440, sp: 'mid', sk: 1 },
  { k: 'world-time-zones', c: 'time', q: 'How many standard time zones does the world use', min: 1, max: 100, t: 24, n: 'Twenty-four, one per hour, though some places run on half-hour or 45-minute offsets.', c0: 24, sp: 'mid', sk: 1 },
  { k: 'keyboard-keys', c: 'tech', q: 'How many keys are on a full-size computer keyboard', min: 10, max: 500, t: 104, n: 'A hundred and four on the common full-size layout.', c0: 90, sp: 'mid', sk: 1 },
  { k: 'scrabble-tiles', c: 'games', q: 'How many tiles are in a Scrabble set', min: 10, max: 500, t: 100, n: 'One hundred tiles, two of them blank.', c0: 100, sp: 'mid', sk: 0 },
  { k: 'scrabble-squares', c: 'games', q: 'How many squares are on a Scrabble board', min: 20, max: 1000, t: 225, n: 'Fifteen by fifteen, so 225.', c0: 200, sp: 'wide', sk: 1 },
  { k: 'rubik-stickers', c: 'games', q: 'How many colored squares are on a solved Rubik\'s Cube', min: 5, max: 500, t: 54, n: 'Nine on each of six faces.', c0: 54, sp: 'mid', sk: 1 },
  { k: 'sudoku-cells', c: 'games', q: 'How many cells are in a finished sudoku grid', min: 10, max: 500, t: 81, n: 'Nine by nine, so eighty-one.', c0: 81, sp: 'mid', sk: 1 },
  { k: 'harp-strings', c: 'music', q: 'How many strings does a concert harp have', min: 1, max: 300, t: 47, n: 'Forty-seven, plus seven pedals to change their pitch.', c0: 30, sp: 'wide', sk: 1 },
  { k: 'orchestra-size', c: 'music', q: 'How many players are in a full symphony orchestra', min: 5, max: 500, t: 90, n: 'Eighty to a hundred for a big romantic program.', c0: 60, sp: 'wide', sk: 1 },
  { k: 'piano-hammers', c: 'music', q: 'How many pedals does a grand piano have', min: 1, max: 20, t: 3, n: 'Three: soft, sostenuto and sustain.', c0: 3, sp: 'tight', sk: 1 },
  { k: 'steps-mile', c: 'sport', q: 'How many steps does an average person take in a mile', min: 100, max: 20000, t: 2000, n: 'Roughly two thousand, depending on stride.', c0: 1800, sp: 'wide', sk: 1 },
  { k: 'hurdles-race', c: 'sport', q: 'How many hurdles does a runner clear in a 110 meter hurdles race', min: 1, max: 100, t: 10, n: 'Ten hurdles, evenly spaced down the track.', c0: 8, sp: 'mid', sk: 1 },
  { k: 'marathon-runners', c: 'sport', q: 'How many runners finished the 2024 New York City Marathon, in thousands', min: 1, max: 200, t: 56, n: 'About 55,600, a world record for marathon finishers at the time.', c0: 20, sp: 'wide', sk: 1 },
  { k: 'chess-openings', c: 'games', q: 'How many legal first moves does White have in chess', min: 1, max: 100, t: 20, n: 'Twenty: sixteen pawn moves and four knight moves.', c0: 16, sp: 'mid', sk: 1 },
  { k: 'colors-eye', c: 'science', q: 'How many colors can the human eye tell apart, in thousands', min: 1, max: 20000, t: 1000, n: 'Around a million shades, so a thousand thousand.', c0: 200, sp: 'wide', sk: 1 },
  { k: 'rainbow-angle', c: 'weather', q: 'How many degrees above the horizon can the top of a rainbow reach', min: 1, max: 90, t: 42, n: 'Forty-two degrees, and only with the sun on the horizon; the higher the sun, the lower the arc.', c0: 30, sp: 'wide', sk: 1 },
  { k: 'lightning-day', c: 'weather', q: 'How many lightning flashes happen around the world each second', min: 1, max: 2000, t: 44, n: 'Around forty-four a second worldwide, most of them inside clouds.', c0: 20, sp: 'wide', sk: 1 },
  { k: 'snowflake-points', c: 'weather', q: 'How many points does a snowflake crystal have', min: 1, max: 50, t: 6, n: 'Six, because water ice freezes in a hexagonal lattice.', c0: 6, sp: 'tight', sk: 1 },
  { k: 'hundred-years-war', c: 'history', q: 'How many years did the Hundred Years War actually last', min: 1, max: 400, t: 116, n: 'A hundred and sixteen years, on and off, from 1337 to 1453.', c0: 100, sp: 'mid', sk: 1 },
  { k: 'berlin-wall', c: 'history', q: 'How many years was the Berlin Wall standing', min: 1, max: 200, t: 28, n: 'Twenty-eight years, from 1961 to 1989.', c0: 35, sp: 'mid', sk: 1 },
  { k: 'empire-state', c: 'city', q: 'How many floors does the Empire State Building have', min: 5, max: 500, t: 102, n: 'A hundred and two floors.', c0: 85, sp: 'mid', sk: 1 },
  { k: 'jumbo-wheels', c: 'transport', q: 'How many wheels does a jumbo jet land on', min: 2, max: 100, t: 18, n: 'Eighteen: sixteen on the main gear and two at the nose.', c0: 10, sp: 'mid', sk: 1 },
  { k: 'office-emails', c: 'work', q: 'How many emails does an office worker receive on a working day', min: 1, max: 2000, t: 120, n: 'Around a hundred and twenty a day, counting everything that lands in the inbox.', c0: 50, sp: 'wide', sk: 1 },
  { k: 'bath-liters', c: 'home', q: 'How many liters of water go into a typical bath', min: 5, max: 1000, t: 80, n: 'About eighty liters for a normal bath.', c0: 100, sp: 'wide', sk: 1 },
  { k: 'house-bricks', c: 'home', q: 'How many bricks are in a typical family house', min: 100, max: 200000, t: 12000, n: 'Somewhere around twelve thousand for a two-story house.', c0: 5000, sp: 'wide', sk: 1 },
  { k: 'world-currencies', c: 'money', q: 'How many currencies are in use around the world', min: 5, max: 1000, t: 180, n: 'About a hundred and eighty official currencies.', c0: 100, sp: 'wide', sk: 1 },
  { k: 'van-gogh', c: 'art', q: 'How many paintings did Van Gogh finish', min: 5, max: 10000, t: 860, n: 'Around 860 paintings, nearly all in his last decade.', c0: 300, sp: 'wide', sk: 1 },
  { k: 'film-fps', c: 'film', q: 'How many frames per second does a film camera shoot', min: 1, max: 500, t: 24, n: 'Twenty-four frames a second is the cinema standard.', c0: 30, sp: 'mid', sk: 1 },
  { k: 'school-days', c: 'school', q: 'How many days does a school year usually run', min: 20, max: 400, t: 190, n: 'Most countries run between 175 and 200 teaching days.', c0: 180, sp: 'mid', sk: 1 },
  { k: 'elements', c: 'science', q: 'How many elements are on the periodic table', min: 10, max: 500, t: 118, n: 'A hundred and eighteen have been confirmed and named.', c0: 110, sp: 'mid', sk: 1 },
  { k: 'sunflower-seeds', c: 'plants', q: 'How many seeds are in one sunflower head', min: 10, max: 20000, t: 1500, n: 'A big head holds well over a thousand.', c0: 500, sp: 'wide', sk: 1 },
  { k: 'pomegranate', c: 'food', q: 'How many seeds are inside one pomegranate', min: 5, max: 5000, t: 600, n: 'Around six hundred, give or take a hundred.', c0: 250, sp: 'wide', sk: 1 },
  { k: 'raindrop-speed', c: 'weather', q: 'How fast does a raindrop fall, in kilometers per hour', min: 1, max: 500, t: 30, n: 'About thirty kilometers an hour for a big drop.', c0: 25, sp: 'wide', sk: 1 },
];
