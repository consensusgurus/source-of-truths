// Origin lane: Word Origins. Where ordinary English words come from: the
// source language, the literal meaning of a Greek or Latin root, prefixes and
// suffixes, loanwords (Arabic, Dutch, Hindi, Norse, Nahuatl, Japanese and
// more), and how a word's meaning shifted. Not words named after a person or
// place (the other Origin lane), and not idioms or phrases. Only origins that
// Merriam-Webster or Etymonline state plainly; no folk etymologies.
const c = 'Word Origins';
const LAUNCH_DAYS = [
  // day 1
  [
    { c, t: 1, q: "'Telephone' joins Greek roots meaning 'far' and what?", a: 'Sound', d: ['Wire', 'Signal', 'Line'] },
    { c, t: 2, q: "'Goodbye' is a shortened form of which phrase?", a: 'God be with you', d: ['Good day to you', 'Go well, friend', 'Good luck by you'] },
    { c, t: 3, q: "'Salary' traces to the Latin word for which everyday substance?", a: 'Salt', d: ['Silver', 'Bread', 'Olive oil'] },
    { c, t: 4, q: "The 'algia' in 'nostalgia' means what?", a: 'Pain', d: ['Home', 'Memory', 'Past'] },
    { c, t: 5, q: "'Muscle' comes from a Latin word meaning what?", a: 'Little mouse', d: ['Strong arm', 'Little rope', 'Tight cord'] },
  ],
  // day 2
  [
    { c, t: 1, q: "'Breakfast' is named for breaking what?", a: 'A fast', d: ['Bread', 'The dawn', 'An egg'] },
    { c, t: 2, q: "The 'omni' in 'omnivore' means what?", a: 'All', d: ['Plant', 'Meat', 'Some'] },
    { c, t: 3, q: "'Disaster' literally means a bad what?", a: 'Star', d: ['Day', 'Omen', 'Harvest'] },
    { c, t: 4, q: "Roman office seekers gave us 'candidate,' from a Latin word for someone dressed in what?", a: 'White', d: ['Purple', 'Red', 'Black'] },
    { c, t: 5, q: "In Latin, 'sinister' meant which side?", a: 'Left', d: ['Right', 'Back', 'Front'] },
  ],
  // day 3
  [
    { c, t: 1, q: "The 'bio' in 'biology' means what?", a: 'Life', d: ['Body', 'Nature', 'Growth'] },
    { c, t: 2, q: "'Astronaut' combines Greek words meaning what?", a: 'Star sailor', d: ['Sky walker', 'Space traveler', 'Moon man'] },
    { c, t: 3, q: "A 'spinster' was first a woman who did what for a living?", a: 'Spun thread', d: ['Taught school', 'Kept house', 'Sewed clothes'] },
    { c, t: 4, q: "'Sarcasm' comes from a Greek verb that literally meant what?", a: 'To tear flesh', d: ['To laugh loudly', 'To bark like a dog', 'To spit'] },
    { c, t: 5, q: "'Alcohol' comes from Arabic for what?", a: 'A fine eye powder', d: ['Burning water', 'Strong drink', 'Date wine'] },
  ],
  // day 4
  [
    { c, t: 1, q: "The 'auto' in 'automobile' means what?", a: 'Self', d: ['Car', 'Motor', 'Fast'] },
    { c, t: 2, q: "'Alphabet' is formed from what?", a: 'The first two Greek letters', d: ['A Latin word for writing', "A Phoenician scribe's name", 'The Greek word for list'] },
    { c, t: 3, q: "'Malaria' comes from Italian words meaning what?", a: 'Bad air', d: ['Bad water', 'Swamp fever', 'Biting fly'] },
    { c, t: 4, q: "A 'companion' is literally someone you share what with?", a: 'Bread', d: ['A house', 'A road', 'Wine'] },
    { c, t: 5, q: "'Clue' began as 'clew,' meaning a ball of what?", a: 'Thread', d: ['Wax', 'Clay', 'Dough'] },
  ],
  // day 5
  [
    { c, t: 1, q: "The 'micro' in 'microchip' means what?", a: 'Small', d: ['Fast', 'Electric', 'Thin'] },
    { c, t: 2, q: "The 'ped' in 'pedestrian' comes from the Latin word for what?", a: 'Foot', d: ['Road', 'Walk', 'Person'] },
    { c, t: 3, q: "'Vaccine' comes from the Latin word for which animal?", a: 'Cow', d: ['Horse', 'Pig', 'Sheep'] },
    { c, t: 4, q: "'Atom' comes from a Greek word meaning what?", a: 'Uncuttable', d: ['Invisible', 'Tiny seed', 'Building block'] },
    { c, t: 5, q: "When 'nice' entered English around 1300, it meant what?", a: 'Foolish', d: ['Kind', 'Pleasant', 'Polite'] },
  ],
  // day 6
  [
    { c, t: 1, q: "'Phobia' comes from the Greek word for what?", a: 'Fear', d: ['Illness', 'Nerves', 'Darkness'] },
    { c, t: 2, q: "The 'mani' in 'manicure' comes from the Latin word for what?", a: 'Hand', d: ['Nail', 'Care', 'Finger'] },
    { c, t: 3, q: "'Galaxy' comes from the Greek word for what?", a: 'Milk', d: ['Star', 'Spiral', 'Cloud'] },
    { c, t: 4, q: "In Old English, 'meat' meant what?", a: 'Food of any kind', d: ['Flesh of any kind', 'A feast', 'Salted pork'] },
    { c, t: 5, q: "In Middle English, what did 'silly' mean?", a: 'Happy or blessed', d: ['Clumsy or loud', 'Proud or vain', 'Angry or harsh'] },
  ],
  // day 7
  [
    { c, t: 1, q: "The 'geo' in 'geography' and 'geology' means what?", a: 'Earth', d: ['Rock', 'Map', 'Place'] },
    { c, t: 2, q: "The 'demo' in 'democracy' comes from the Greek word for what?", a: 'People', d: ['Vote', 'Power', 'City'] },
    { c, t: 3, q: "'Planet' comes from a Greek word meaning what?", a: 'Wanderer', d: ['Sphere', 'Giant', 'Shining one'] },
    { c, t: 4, q: "In ancient Greek, a 'hypocrite' was what?", a: 'A stage actor', d: ['A false priest', 'A lawyer', 'A tax collector'] },
    { c, t: 5, q: "The Old English ancestor of 'bead' meant what?", a: 'A prayer', d: ['A seed', 'A drop', 'A jewel'] },
  ],
  // day 8
  [
    { c, t: 1, q: "'Submarine' literally means what?", a: 'Under the sea', d: ['Beside the sea', 'Across the sea', 'Beyond the sea'] },
    { c, t: 2, q: "'Philosophy' literally means love of what?", a: 'Wisdom', d: ['Truth', 'Thought', 'Learning'] },
    { c, t: 3, q: "'Dandelion' comes from French words meaning what?", a: "Lion's tooth", d: ["Lion's mane", 'Yellow flower', 'Golden head'] },
    { c, t: 4, q: "'Daisy' comes from Old English words meaning what?", a: "Day's eye", d: ["Day's star", 'Sun cup', 'White crown'] },
    { c, t: 5, q: "When 'naughty' first appeared, it described someone who had what?", a: 'Nothing', d: ['Bad manners', 'Many debts', 'A temper'] },
  ],
  // day 9
  [
    { c, t: 1, q: "The 'uni' in 'unicycle' and 'unicorn' means what?", a: 'One', d: ['Small', 'Round', 'Horse'] },
    { c, t: 2, q: "'Souvenir' comes from a French verb meaning what?", a: 'To remember', d: ['To travel', 'To keep', 'To buy'] },
    { c, t: 3, q: "'Mosquito' is Spanish for what?", a: 'Little fly', d: ['Little biter', 'Little buzzer', 'Little stinger'] },
    { c, t: 4, q: "'Window' comes from an Old Norse word meaning what?", a: 'Wind eye', d: ['Light hole', 'House eye', 'Glass gap'] },
    { c, t: 5, q: "The Old English ancestor of 'pretty' meant what?", a: 'Crafty', d: ['Fair-haired', 'Small', 'Gentle'] },
  ],
  // day 10
  [
    { c, t: 1, q: "The 'cent' in 'century' and 'percent' means what?", a: 'Hundred', d: ['Thousand', 'Ten', 'Year'] },
    { c, t: 2, q: "The German 'gesundheit,' said after a sneeze, literally means what?", a: 'Health', d: ['Bless you', 'Get well', 'Good luck'] },
    { c, t: 3, q: "'Alligator' comes from Spanish words meaning what?", a: 'The lizard', d: ['The crocodile', 'The swimmer', 'The dragon'] },
    { c, t: 4, q: "Before it meant a married man, 'husband' meant the master of what?", a: 'A household', d: ['A guild', 'A ship', 'A castle'] },
    { c, t: 5, q: "'Egregious' literally means standing out from what?", a: 'The flock', d: ['The law', 'The army', 'The family'] },
  ],
  // day 11
  [
    { c, t: 1, q: "The 'dent' in 'dentist' comes from the Latin word for what?", a: 'Tooth', d: ['Mouth', 'Doctor', 'Gum'] },
    { c, t: 2, q: "The 'chrono' in 'chronology' and 'chronic' means what?", a: 'Time', d: ['Order', 'Long', 'Pain'] },
    { c, t: 3, q: "'Armadillo' is Spanish for what?", a: 'Little armored one', d: ['Little digger', 'Little ball', 'Little turtle'] },
    { c, t: 4, q: "'Comet' comes from a Greek word meaning what?", a: 'Long-haired', d: ['Fire-tailed', 'Fast-moving', 'Bright-eyed'] },
    { c, t: 5, q: "In Latin, 'focus' meant what?", a: 'Hearth', d: ['Lens', 'Point', 'Center'] },
  ],
  // day 12
  [
    { c, t: 1, q: "The 'thermo' in 'thermometer' means what?", a: 'Heat', d: ['Weather', 'Measure', 'Air'] },
    { c, t: 2, q: "The 'biblio' in 'bibliography' means what?", a: 'Book', d: ['Holy', 'Paper', 'Name'] },
    { c, t: 3, q: "'Mesa,' a flat-topped hill, is the Spanish word for what?", a: 'Table', d: ['Roof', 'Plate', 'Plain'] },
    { c, t: 4, q: "The Old English ancestor of 'starve' meant what?", a: 'To die', d: ['To fast', 'To beg', 'To wither'] },
    { c, t: 5, q: "The 'pupil' of the eye comes from a Latin word meaning what?", a: 'Little doll', d: ['Little window', 'Small hole', 'Black dot'] },
  ],
  // day 13
  [
    { c, t: 1, q: "'Kindergarten,' literally 'children's garden,' was borrowed from which language?", a: 'German', d: ['Dutch', 'Swedish', 'Danish'] },
    { c, t: 2, q: "The 'derm' in 'dermatologist' means what?", a: 'Skin', d: ['Hair', 'Face', 'Cell'] },
    { c, t: 3, q: "'Piano' is short for 'pianoforte,' Italian for what?", a: 'Soft-loud', d: ['Fast-slow', 'High-low', 'Hammer-string'] },
    { c, t: 4, q: "Originally, to 'decimate' a Roman legion meant what?", a: 'To kill one in ten', d: ['To kill every man', 'To cut it in half', 'To kill its officers'] },
    { c, t: 5, q: 'Lenses were named for their shape, after which food?', a: 'Lentil', d: ['Pea', 'Bean', 'Grape'] },
  ],
  // day 14
  [
    { c, t: 1, q: "The 'poly' in 'polygon' means what?", a: 'Many', d: ['Side', 'Shape', 'Equal'] },
    { c, t: 2, q: "The 'noct' in 'nocturnal' comes from the Latin word for what?", a: 'Night', d: ['Owl', 'Dark', 'Moon'] },
    { c, t: 3, q: "'Restaurant' comes from a French word meaning what?", a: 'Restoring', d: ['Resting', 'Feasting', 'Serving'] },
    { c, t: 4, q: "'Trivia' traces to a Latin word for a place where how many roads meet?", a: 'Three', d: ['Two', 'Four', 'Seven'] },
    { c, t: 5, q: "'Pencil' traces to a Latin word meaning a little what?", a: 'Tail', d: ['Stick', 'Reed', 'Knife'] },
  ],
  // day 15
  [
    { c, t: 1, q: "The 'hydro' in 'hydroelectric' means what?", a: 'Water', d: ['Power', 'Steam', 'Air'] },
    { c, t: 2, q: "'Insomnia' literally means what?", a: 'Without sleep', d: ['Bad dreams', 'Night fear', 'Restless legs'] },
    { c, t: 3, q: "'Captain' traces to the Latin word for which body part?", a: 'Head', d: ['Hand', 'Heart', 'Arm'] },
    { c, t: 4, q: "'Mortgage' comes from Old French words meaning a what pledge?", a: 'Dead', d: ['Sworn', 'Live', 'Golden'] },
    { c, t: 5, q: "'School' traces to a Greek word that meant what?", a: 'Leisure', d: ['Study', 'Teacher', 'Building'] },
  ],
  // day 16
  [
    { c, t: 1, q: "The 'flor' in 'florist' comes from the Latin word for what?", a: 'Flower', d: ['Garden', 'Leaf', 'Seed'] },
    { c, t: 2, q: "'Video' is a Latin verb form meaning what?", a: 'I see', d: ['I show', 'I record', 'I shine'] },
    { c, t: 3, q: "'Umbrella' traces to the Latin word for what?", a: 'Shade', d: ['Rain', 'Cover', 'Stick'] },
    { c, t: 4, q: "'Curfew' comes from an Old French phrase meaning what?", a: 'Cover fire', d: ['Close doors', 'Ring bells', 'Quiet night'] },
    { c, t: 5, q: "In ancient Greek, an 'idiot' was what?", a: 'A private citizen', d: ['A madman', 'A slave', 'A child'] },
  ],
  // day 17
  [
    { c, t: 1, q: "The 'mega' in 'megaphone' means what?", a: 'Large', d: ['Loud', 'Voice', 'Many'] },
    { c, t: 2, q: "'Spaghetti' is Italian for little what?", a: 'Strings', d: ['Worms', 'Sticks', 'Tubes'] },
    { c, t: 3, q: "'Igloo' comes from an Inuit word meaning simply what?", a: 'House', d: ['Snow', 'Ice', 'Dome'] },
    { c, t: 4, q: "'Ambulance' comes from a French phrase that literally meant what kind of hospital?", a: 'Walking', d: ['Speeding', 'Night', 'Royal'] },
    { c, t: 5, q: "'Tragedy' comes from Greek words for 'song' and which animal?", a: 'Goat', d: ['Lion', 'Bull', 'Horse'] },
  ],
  // day 18
  [
    { c, t: 1, q: "The 'port' in 'portable' and 'transport' means what?", a: 'Carry', d: ['Ship', 'Door', 'Fold'] },
    { c, t: 2, q: "'Kayak' comes from the language of which Arctic people?", a: 'Inuit', d: ['Sami', 'Norse', 'Finnish'] },
    { c, t: 3, q: "'Jungle' came into English from which language?", a: 'Hindi', d: ['Swahili', 'Portuguese', 'Malay'] },
    { c, t: 4, q: "'Algebra' comes from an Arabic phrase meaning what?", a: 'Reunion of broken parts', d: ['Science of numbers', 'Book of balance', 'Art of counting'] },
    { c, t: 5, q: "'Melancholy' comes from Greek words meaning what?", a: 'Black bile', d: ['Gray mood', 'Heavy heart', 'Dark night'] },
  ],
  // day 19
  [
    { c, t: 1, q: "The 'anti' in 'antifreeze' means what?", a: 'Against', d: ['Before', 'Without', 'Below'] },
    { c, t: 2, q: "'Octopus' literally means what?", a: 'Eight feet', d: ['Eight eyes', 'Sea spider', 'Ink fish'] },
    { c, t: 3, q: "'Karma' is a Sanskrit word whose basic meaning is what?", a: 'Action', d: ['Balance', 'Luck', 'Wheel'] },
    { c, t: 4, q: "'Magazine' comes from an Arabic word meaning what?", a: 'Storehouses', d: ['Pages', 'Merchants', 'Rumors'] },
    { c, t: 5, q: "'Cosmos' comes from a Greek word that first meant what?", a: 'Order', d: ['Sky', 'Void', 'Star'] },
  ],
  // day 20
  [
    { c, t: 1, q: "The 'pre' in 'preview' and 'prehistoric' means what?", a: 'Before', d: ['After', 'Again', 'Inside'] },
    { c, t: 2, q: "The 'trans' in 'transatlantic' means what?", a: 'Across', d: ['Under', 'Around', 'Along'] },
    { c, t: 3, q: "'Boss' comes from a Dutch word meaning what?", a: 'Master', d: ['Captain', 'Owner', 'Elder'] },
    { c, t: 4, q: "'Pajamas' comes from Persian words for 'leg' and what?", a: 'Garment', d: ['Sleep', 'Cotton', 'Silk'] },
    { c, t: 5, q: "'Chameleon' comes from Greek words meaning what?", a: 'Ground lion', d: ['Color changer', 'Tree lizard', 'Slow walker'] },
  ],
  // day 21
  [
    { c, t: 1, q: "The 'post' in 'postwar' means what?", a: 'After', d: ['Before', 'During', 'Against'] },
    { c, t: 2, q: "The 'circum' in 'circumnavigate' means what?", a: 'Around', d: ['Across', 'Through', 'Beyond'] },
    { c, t: 3, q: "'Coffee' traces back through Turkish to which language?", a: 'Arabic', d: ['Persian', 'Greek', 'Hindi'] },
    { c, t: 4, q: "'Thug' comes from a Hindi word meaning what?", a: 'Thief', d: ['Soldier', 'Brute', 'Guard'] },
    { c, t: 5, q: "Which art word comes from the Dutch word for 'donkey'?", a: 'Easel', d: ['Canvas', 'Palette', 'Sketch'] },
  ],
  // day 22
  [
    { c, t: 1, q: "The 'ex' in 'export' means what?", a: 'Out', d: ['Over', 'Into', 'Back'] },
    { c, t: 2, q: "The 'hyper' in 'hyperactive' means what?", a: 'Over', d: ['Under', 'Quick', 'Not'] },
    { c, t: 3, q: "Dutch traders brought 'tea' to English from a dialect of which language?", a: 'Chinese', d: ['Japanese', 'Hindi', 'Thai'] },
    { c, t: 4, q: "'Karaoke' comes from Japanese words meaning what?", a: 'Empty orchestra', d: ['Sing along', 'Song box', 'Voice party'] },
    { c, t: 5, q: 'Which English pronoun was borrowed from Old Norse?', a: 'They', d: ['We', 'You', 'It'] },
  ],
  // day 23
  [
    { c, t: 1, q: "The 'semi' in 'semicircle' means what?", a: 'Half', d: ['Small', 'Full', 'Double'] },
    { c, t: 2, q: "The 'neo' in 'neoclassical' and 'neon' means what?", a: 'New', d: ['Bright', 'Old', 'False'] },
    { c, t: 3, q: "'Yogurt' comes from which language?", a: 'Turkish', d: ['Greek', 'Arabic', 'Persian'] },
    { c, t: 4, q: "The 'e' in 'emoji' is a Japanese word meaning what?", a: 'Picture', d: ['Emotion', 'Electronic', 'Small'] },
    { c, t: 5, q: "'Shirt' is native English. Which garment's name is its Old Norse twin?", a: 'Skirt', d: ['Sock', 'Glove', 'Cloak'] },
  ],
  // day 24
  [
    { c, t: 1, q: "The 'mater' in 'maternal' comes from the Latin word for what?", a: 'Mother', d: ['Wife', 'Family', 'Woman'] },
    { c, t: 2, q: "The 'graph' in 'autograph' and 'biography' means what?", a: 'Writing', d: ['Picture', 'Life', 'Name'] },
    { c, t: 3, q: "'Whiskey' comes from Gaelic words meaning what?", a: 'Water of life', d: ['Barley wine', 'Golden spirit', 'Strong water'] },
    { c, t: 4, q: "'Tycoon' comes from a Japanese title meaning what?", a: 'Great lord', d: ['Rich merchant', 'Iron king', 'Wise elder'] },
    { c, t: 5, q: "'Robot' comes from a Czech word meaning what?", a: 'Forced labor', d: ['Iron man', 'Machine', 'Thinker'] },
  ],
  // day 25
  [
    { c, t: 1, q: "The 'aero' in 'aerospace' and 'aerobics' means what?", a: 'Air', d: ['Fly', 'High', 'Sky'] },
    { c, t: 2, q: "Before it meant 'excellent,' 'terrific' meant what?", a: 'Frightening', d: ['Enormous', 'Noisy', 'Sudden'] },
    { c, t: 3, q: "'Cobra' is the Portuguese word for what?", a: 'Snake', d: ['Hood', 'Poison', 'King'] },
    { c, t: 4, q: "'Coleslaw' comes from Dutch words meaning what?", a: 'Cabbage salad', d: ['Cold salad', 'Chopped greens', 'Sour cabbage'] },
    { c, t: 5, q: "'Klutz' comes from a Yiddish word meaning what?", a: 'Wooden block', d: ['Lost shoe', 'Bad dancer', 'Big foot'] },
  ],
  // day 26
  [
    { c, t: 1, q: "'Pub' is short for what?", a: 'Public house', d: ["Publican's room", 'Public hall', 'Popular bar'] },
    { c, t: 2, q: "'Cookie' came into American English from which language?", a: 'Dutch', d: ['German', 'French', 'Danish'] },
    { c, t: 3, q: "'Tattoo,' meaning a mark inked on the skin, comes from which family of languages?", a: 'Polynesian', d: ['Bantu', 'Celtic', 'Slavic'] },
    { c, t: 4, q: "'Aardvark' comes from Afrikaans words meaning what?", a: 'Earth pig', d: ['Ant eater', 'Long nose', 'Night digger'] },
    { c, t: 5, q: "'Boondocks' comes from a Tagalog word meaning what?", a: 'Mountain', d: ['Swamp', 'Village', 'Jungle'] },
  ],
  // day 27
  [
    { c, t: 1, q: "'Millipede' literally means what?", a: 'Thousand feet', d: ['Hundred feet', 'Tiny worm', 'Many eyes'] },
    { c, t: 2, q: "'Eureka' is a Greek word meaning what?", a: 'I have found it', d: ['I am done', 'Look here', 'At last'] },
    { c, t: 3, q: "'Orangutan' comes from Malay words meaning what?", a: 'Man of the forest', d: ['Red ape', 'Tree climber', 'Long arms'] },
    { c, t: 4, q: "'Poltergeist' comes from German words meaning what?", a: 'Noisy ghost', d: ['Angry spirit', 'House demon', 'Night visitor'] },
    { c, t: 5, q: "'Catamaran' comes from a Tamil word meaning what?", a: 'Tied wood', d: ['Twin hull', 'Sea runner', 'River boat'] },
  ],
  // day 28
  [
    { c, t: 1, q: "'Ballet' came into English from which language?", a: 'French', d: ['Spanish', 'Russian', 'German'] },
    { c, t: 2, q: "'Bus' is short for which longer word?", a: 'Omnibus', d: ['Business', 'Bustle', 'Bushel'] },
    { c, t: 3, q: "Before it meant 'very bad,' 'awful' meant what?", a: 'Inspiring awe', d: ['Full of sorrow', 'Very large', 'Badly made'] },
    { c, t: 4, q: "'Bankrupt' comes from Italian words meaning what?", a: 'Broken bench', d: ['Empty purse', 'Lost bank', 'Closed shop'] },
    { c, t: 5, q: "'Ukulele' comes from Hawaiian words meaning what?", a: 'Jumping flea', d: ['Little guitar', 'Happy strings', 'Dancing fingers'] },
  ],
  // day 29
  [
    { c, t: 1, q: "The 'non' in 'nonsense' and 'nonstop' means what?", a: 'Not', d: ['Bad', 'Again', 'Very'] },
    { c, t: 2, q: "'Sauna' comes from which language?", a: 'Finnish', d: ['Swedish', 'Russian', 'Norwegian'] },
    { c, t: 3, q: "'Villain' originally named which kind of person?", a: 'A farmhand', d: ['A thief', 'A pirate', 'A traitor'] },
    { c, t: 4, q: "The 'mare' in 'nightmare' was originally what?", a: 'An evil spirit', d: ['A female horse', 'A bad dream', 'The dark'] },
    { c, t: 5, q: "Captain Cook brought 'taboo' into English in 1777 from the language of which islands?", a: 'Tonga', d: ['Fiji', 'Samoa', 'Hawaii'] },
  ],
  // day 30
  [
    { c, t: 1, q: "The 'inter' in 'international' means what?", a: 'Between', d: ['Across', 'Beyond', 'Within'] },
    { c, t: 2, q: "'Ski' entered English from which language?", a: 'Norwegian', d: ['German', 'Finnish', 'Dutch'] },
    { c, t: 3, q: "Long before machines, a 'computer' was what?", a: 'A person who calculates', d: ['A counting frame', 'A ledger book', 'A tally stick'] },
    { c, t: 4, q: "Before radio, 'broadcast' meant what?", a: 'Scattering seed by hand', d: ['Shouting the news', 'Printing posters', 'Ringing bells'] },
    { c, t: 5, q: "'Llama,' 'puma' and 'condor' all come from which South American language?", a: 'Quechua', d: ['Guarani', 'Mapuche', 'Tupi'] },
  ],
  // day 31
  [
    { c, t: 1, q: "The 'audi' in 'audio' and 'auditorium' means what?", a: 'Hear', d: ['See', 'Speak', 'Sing'] },
    { c, t: 2, q: "The 'scope' in 'telescope' and 'microscope' comes from a Greek word meaning what?", a: 'To look', d: ['Far', 'Lens', 'Glass'] },
    { c, t: 3, q: "'Peninsula' comes from Latin words meaning what?", a: 'Almost an island', d: ['Long land', 'Finger of the sea', 'Half a coast'] },
    { c, t: 4, q: "In Middle English, 'pineapple' meant what?", a: 'A pine cone', d: ['An apple tree', 'A pear', 'A fir tree'] },
    { c, t: 5, q: "'Corgi' comes from Welsh words meaning what?", a: 'Dwarf dog', d: ['Herding dog', 'Short legs', 'Little fox'] },
  ],
  // day 32
  [
    { c, t: 1, q: "The 'dec' in 'decade' and 'decathlon' means what?", a: 'Ten', d: ['Twelve', 'Hundred', 'Year'] },
    { c, t: 2, q: "'Tsunami' combines Japanese words for 'harbor' and what?", a: 'Wave', d: ['Storm', 'Wall', 'Flood'] },
    { c, t: 3, q: "'Hippopotamus' literally means what?", a: 'River horse', d: ['Water pig', 'Big mouth', 'Mud ox'] },
    { c, t: 4, q: "'Calculate' traces to a Latin word for what?", a: 'Pebble', d: ['Abacus', 'Finger', 'Tally'] },
    { c, t: 5, q: "'Pedigree' comes from an old French phrase, after the shape of family-tree lines, meaning what?", a: "Crane's foot", d: ['Oak branch', "Bird's nest", 'River fork'] },
  ],
  // day 33
  [
    { c, t: 1, q: "The 'carni' in 'carnivore' means what?", a: 'Meat', d: ['Plant', 'Animal', 'Hunt'] },
    { c, t: 2, q: "'Dinosaur' comes from Greek words meaning what?", a: 'Terrible lizard', d: ['Giant beast', 'Ancient reptile', 'Thunder lizard'] },
    { c, t: 3, q: "The 'xeno' in 'xenophobia' means what?", a: 'Stranger', d: ['Crowd', 'Change', 'Enemy'] },
    { c, t: 4, q: "'Alibi' is a Latin word meaning what?", a: 'Elsewhere', d: ['Witness', 'Excuse', 'Innocent'] },
    { c, t: 5, q: "'Jeopardy' comes from an Old French phrase meaning what?", a: 'A divided game', d: ['A great danger', 'A lost wager', 'A trial by fire'] },
  ],
  // day 34
  [
    { c, t: 1, q: "The 'zoo' in 'zoology' comes from the Greek word for what?", a: 'Animal', d: ['Cage', 'Wild', 'Park'] },
    { c, t: 2, q: "The 'bene' in 'benefit' and 'benevolent' means what?", a: 'Well', d: ['Gift', 'Help', 'Kind'] },
    { c, t: 3, q: "The 'klepto' in 'kleptomania' means what?", a: 'To steal', d: ['To hoard', 'To lie', 'To break'] },
    { c, t: 4, q: "'Helicopter' comes from Greek words meaning what?", a: 'Spiral wing', d: ['Flying top', 'Sky rotor', 'Whirling bird'] },
    { c, t: 5, q: "'Dismal' comes from a Latin phrase meaning what?", a: 'Evil days', d: ['Dark skies', 'Bad luck', 'Gray mist'] },
  ],
  // day 35
  [
    { c, t: 1, q: "The 'pyro' in 'pyromaniac' means what?", a: 'Fire', d: ['Smoke', 'Danger', 'Light'] },
    { c, t: 2, q: "The 'mal' in 'malfunction' and 'malnutrition' means what?", a: 'Bad', d: ['Lack', 'Little', 'Over'] },
    { c, t: 3, q: "'Croissant' is the French word for what?", a: 'Crescent', d: ['Butter roll', 'Morning', 'Curl'] },
    { c, t: 4, q: "'Sputnik' is a Russian word meaning what?", a: 'Traveling companion', d: ['First star', 'Little moon', 'Signal'] },
    { c, t: 5, q: "'Rival' comes from a Latin word for people who share what?", a: 'The same stream', d: ['The same field', 'The same road', 'The same house'] },
  ],
  // day 36
  [
    { c, t: 1, q: "The 'kilo' in 'kilometer' means what?", a: 'Thousand', d: ['Hundred', 'Ten', 'Million'] },
    { c, t: 2, q: "A 'secretary' was originally a person trusted with what?", a: 'Secrets', d: ['Letters', 'Money', 'Keys'] },
    { c, t: 3, q: "'Rhinoceros' comes from Greek words meaning what?", a: 'Nose horn', d: ['Armored beast', 'Charging bull', 'Thick skin'] },
    { c, t: 4, q: "'Moose,' 'skunk' and 'raccoon' came into English from which family of Native American languages?", a: 'Algonquian', d: ['Iroquoian', 'Siouan', 'Muskogean'] },
    { c, t: 5, q: "'Siesta' comes from the Latin for which hour of the day?", a: 'The sixth', d: ['The third', 'The ninth', 'The twelfth'] },
  ],
];

// ---------------------------------------------------------------------------
// SEGMENT 2: days 37-74, live 2026-11-24 to 2026-12-31 (restock of 2026-11-06).
// gen-english appends whatever LANE_DAYS holds after the bank's last day, and
// its --check rewinds by LANE_DAYS.length, so LANE_DAYS is always the LATEST
// segment only. The launch segment above stays in the file for reference and
// for duplicate checks when authoring, but is no longer exported as LANE_DAYS.
// Every origin here was checked against Merriam-Webster or Etymonline; any
// whose source hedges ("probably", "perhaps", "uncertain") was left out, and
// so was any fact another trivia bank on the site already asks.
export const LANE_DAYS = [
  // day 37 (2026-11-24)
  [
    { c, t: 1, q: "The 'cycle' in 'motorcycle' and 'bicycle' comes from a Greek word for what?", a: "Wheel", d: ["Pedal", "Road", "Speed"] },
    { c, t: 2, q: "The 'fid' in 'fidelity' comes from the Latin word for what?", a: "Faith", d: ["Sound", "Dog", "Love"] },
    { c, t: 3, q: "'Cab' is short for which word, the name of a light horse-drawn carriage?", a: "Cabriolet", d: ["Caboose", "Cabinet", "Caravan"] },
    { c, t: 4, q: "In Middle English, 'girl' meant what?", a: "A child of either sex", d: ["A married woman", "A young nun", "A female cousin"] },
    { c, t: 5, q: "'Nickname' began as 'ekename.' What did 'eke' mean?", a: "Increase", d: ["Little", "Funny", "Secret"] },
  ],
  // day 38 (2026-11-25)
  [
    { c, t: 1, q: "The 're' in 'rewrite' and 'replay' means what?", a: "Again", d: ["Before", "Not", "Fast"] },
    { c, t: 2, q: "The 'osteo' in 'osteoporosis' comes from the Greek word for what?", a: "Bone", d: ["Joint", "Muscle", "Age"] },
    { c, t: 3, q: "'Neighbor' comes from Old English words meaning what?", a: "Near dweller", d: ["Fence sharer", "Gate keeper", "Close friend"] },
    { c, t: 4, q: "'Porcupine' comes from Old French words meaning what?", a: "Spiny pig", d: ["Thorny rat", "Prickly cat", "Needle fox"] },
    { c, t: 5, q: "In the American Civil War, a 'deadline' was what?", a: "A prison camp boundary", d: ["A firing squad's order", "A final supply run", "A hangman's rope"] },
  ],
  // day 39 (2026-11-26)
  [
    { c, t: 1, q: "The 'cardio' in 'cardiology' comes from the Greek word for what?", a: "Heart", d: ["Blood", "Lung", "Muscle"] },
    { c, t: 2, q: "The 'spect' in 'spectator' and 'inspect' comes from the Latin for what?", a: "To watch", d: ["To cheer", "To judge", "To pay"] },
    { c, t: 3, q: "'Pilgrim' traces back to a Latin word meaning what?", a: "Foreigner", d: ["Believer", "Settler", "Farmer"] },
    { c, t: 4, q: "'Bonfire' comes from what?", a: "A fire of bones", d: ["A good fire", "A fire for a feast", "A border fire"] },
    { c, t: 5, q: "'Hearse' traces back to an old French word for which farm tool?", a: "A harrow", d: ["A plow", "A scythe", "A pitchfork"] },
  ],
  // day 40 (2026-11-27)
  [
    { c, t: 1, q: "The 'mono' in 'monorail' and 'monologue' means what?", a: "One", d: ["Two", "Many", "High"] },
    { c, t: 2, q: "The 'bell' in 'belligerent' and 'rebel' comes from the Latin word for what?", a: "War", d: ["Noise", "Beauty", "Anger"] },
    { c, t: 3, q: "Which author coined 'chortle' by blending 'chuckle' and 'snort'?", a: "Lewis Carroll", d: ["Edward Lear", "Dr. Seuss", "Roald Dahl"] },
    { c, t: 4, q: "'Utopia,' coined by Thomas More, literally means what?", a: "No place", d: ["Perfect city", "New world", "Far island"] },
    { c, t: 5, q: "'Treacle' first named what?", a: "An antidote to poison", d: ["A honey wine", "A sugar loaf", "A baking spice"] },
  ],
  // day 41 (2026-11-28)
  [
    { c, t: 1, q: "'Ego' is the Latin word for what?", a: "I", d: ["Pride", "Soul", "Mind"] },
    { c, t: 2, q: "The 'chrom' in 'chromatic' and 'monochrome' comes from the Greek word for what?", a: "Color", d: ["Light", "Tone", "Shine"] },
    { c, t: 3, q: "'Flamingo' traces back to an old word for what, after the bird's color?", a: "Flame", d: ["Rose", "Sunset", "Coral"] },
    { c, t: 4, q: "'Zero' traces back to an Arabic word meaning what?", a: "Empty", d: ["Circle", "Number", "Egg"] },
    { c, t: 5, q: "'Encyclopedia' comes from Greek words meaning what?", a: "General education", d: ["Book of all", "Circle of books", "Great library"] },
  ],
  // day 42 (2026-11-29)
  [
    { c, t: 1, q: "The 'aqua' in 'aquarium' comes from the Latin word for what?", a: "Water", d: ["Fish", "Glass", "Blue"] },
    { c, t: 2, q: "The 'viv' in 'vivid' and 'revive' comes from the Latin for what?", a: "To live", d: ["To see", "To shine", "To wake"] },
    { c, t: 3, q: "'Agenda' is Latin for what?", a: "Things to be done", d: ["Items to discuss", "Notes for a meeting", "Rules of order"] },
    { c, t: 4, q: "'Influenza' is the Italian word for what?", a: "Influence", d: ["Infection", "Fever", "Cold wind"] },
    { c, t: 5, q: "'Gymnasium' comes from a Greek word meaning what?", a: "Naked", d: ["Strong", "Running", "Young"] },
  ],
  // day 43 (2026-11-30)
  [
    { c, t: 1, q: "'Holiday' comes from which two words?", a: "Holy day", d: ["Hollow day", "Whole day", "Holly day"] },
    { c, t: 2, q: "The 'mit' in 'transmit' and 'submit' comes from the Latin for what?", a: "To send", d: ["To give", "To hold", "To join"] },
    { c, t: 3, q: "'Landscape' was borrowed by English painters from which language?", a: "Dutch", d: ["French", "Italian", "German"] },
    { c, t: 4, q: "'Avatar' comes from a Sanskrit word meaning what?", a: "Descent", d: ["Spirit", "Image", "Rebirth"] },
    { c, t: 5, q: "'Apron' was once 'napron.' How did it lose its 'n'?", a: "A napron was heard as an apron", d: ["A printer dropped it", "French spelling rules", "A royal decree"] },
  ],
  // day 44 (2026-12-01)
  [
    { c, t: 1, q: "The 'oct' in 'octagon' and 'octet' means what?", a: "Eight", d: ["Six", "Seven", "Ten"] },
    { c, t: 2, q: "The 'cide' in 'pesticide' and 'homicide' comes from the Latin for what?", a: "To kill", d: ["To spray", "To harm", "To stop"] },
    { c, t: 3, q: "'Lunatic' comes from the Latin word for what?", a: "Moon", d: ["Madness", "Night", "Wolf"] },
    { c, t: 4, q: "'Canyon' comes from a Spanish word whose basic meaning is what?", a: "Tube", d: ["Valley", "Cliff", "Stone wall"] },
    { c, t: 5, q: "'Quorum' is a Latin word meaning what?", a: "Of whom", d: ["Enough", "The many", "Seated"] },
  ],
  // day 45 (2026-12-02)
  [
    { c, t: 1, q: "'Bonus' is a Latin word meaning what?", a: "Good", d: ["Extra", "Gift", "More"] },
    { c, t: 2, q: "The 'pseudo' in 'pseudonym' means what?", a: "False", d: ["Pen", "Secret", "Short"] },
    { c, t: 3, q: "'Calligraphy' comes from Greek words meaning what?", a: "Beautiful writing", d: ["Careful writing", "Ink drawing", "Pen art"] },
    { c, t: 4, q: "In the old phrase 'the quick and the dead,' 'quick' means what?", a: "Alive", d: ["Fast", "Brave", "Young"] },
    { c, t: 5, q: "'Gung ho' comes from a Chinese phrase meaning what?", a: "Work together", d: ["Charge ahead", "Never retreat", "Fight hard"] },
  ],
  // day 46 (2026-12-03)
  [
    { c, t: 1, q: "'Infomercial' blends 'information' with which word?", a: "Commercial", d: ["Merchant", "Media", "Marketing"] },
    { c, t: 2, q: "The 'ami' in 'amicable' comes from the Latin word for what?", a: "Friend", d: ["Peace", "Calm", "Neighbor"] },
    { c, t: 3, q: "'Graffiti' comes from an Italian word meaning what?", a: "Scratched", d: ["Painted", "Sprayed", "Signed"] },
    { c, t: 4, q: "The 'eco' in 'economy' and 'ecology' comes from the Greek word for what?", a: "House", d: ["Nature", "Money", "Earth"] },
    { c, t: 5, q: "'Lord' comes from Old English words meaning what?", a: "Loaf keeper", d: ["Land holder", "Great man", "Sword bearer"] },
  ],
  // day 47 (2026-12-04)
  [
    { c, t: 1, q: "The 'bi' in 'bicycle' and 'bilingual' means what?", a: "Two", d: ["One", "Three", "Half"] },
    { c, t: 2, q: "The 'cred' in 'credible' and 'credit' comes from the Latin for what?", a: "To believe", d: ["To lend", "To pay", "To earn"] },
    { c, t: 3, q: "'Nostril' comes from Old English words meaning what?", a: "Nose hole", d: ["Nose hair", "Breath gate", "Smell pipe"] },
    { c, t: 4, q: "'Kowtow' comes from a Chinese phrase meaning what?", a: "Knock the head", d: ["Honor the king", "Kneel and pray", "Lower the eyes"] },
    { c, t: 5, q: "'Mandarin,' for an official, traces back to a Sanskrit word for what?", a: "Counselor", d: ["Priest", "Merchant", "Soldier"] },
  ],
  // day 48 (2026-12-05)
  [
    { c, t: 1, q: "'December' comes from the Latin word for which number?", a: "Ten", d: ["Twelve", "Nine", "Seven"] },
    { c, t: 2, q: "'Origami' combines Japanese words for 'fold' and what?", a: "Paper", d: ["Art", "Hand", "Crane"] },
    { c, t: 3, q: "'Manufacture' comes from Latin words meaning what?", a: "Made by hand", d: ["Made in bulk", "Built by machine", "Many factories"] },
    { c, t: 4, q: "'Placebo' is Latin for what?", a: "I shall please", d: ["I shall heal", "I shall pretend", "I shall cure"] },
    { c, t: 5, q: "In Latin, the source of 'explode' meant what?", a: "To drive off the stage by clapping", d: ["To blow out a candle", "To break a seal", "To burst into flames"] },
  ],
  // day 49 (2026-12-06)
  [
    { c, t: 1, q: "The 'scrib' in 'scribble' and 'describe' comes from the Latin for what?", a: "To write", d: ["To draw", "To read", "To speak"] },
    { c, t: 2, q: "The 'gastro' in 'gastric' and 'gastronomy' comes from the Greek word for what?", a: "Stomach", d: ["Food", "Gas", "Fire"] },
    { c, t: 3, q: "The word 'amok,' as in running amok, comes from which language?", a: "Malay", d: ["Hindi", "Zulu", "Maori"] },
    { c, t: 4, q: "'Grenade' comes from the French word for which fruit?", a: "Pomegranate", d: ["Pineapple", "Lemon", "Melon"] },
    { c, t: 5, q: "'Paradise' comes from an Old Persian word for what?", a: "An enclosed park", d: ["A heavenly city", "A golden throne", "A desert spring"] },
  ],
  // day 50 (2026-12-07)
  [
    { c, t: 1, q: "The 'terr' in 'terrain' and 'territory' comes from the Latin word for what?", a: "Land", d: ["Fear", "Rock", "Field"] },
    { c, t: 2, q: "The 'rupt' in 'erupt' and 'rupture' comes from the Latin for what?", a: "To break", d: ["To burn", "To shake", "To pour"] },
    { c, t: 3, q: "'Guerrilla' is Spanish for what?", a: "Little war", d: ["Hidden army", "Forest fighter", "Ambush"] },
    { c, t: 4, q: "'Shampoo' comes from a Hindi word meaning what?", a: "To massage", d: ["To wash", "To rinse", "To comb"] },
    { c, t: 5, q: "'Tinsel' comes from an Old French word meaning what?", a: "Spark", d: ["Silver thread", "Star", "Ribbon"] },
  ],
  // day 51 (2026-12-08)
  [
    { c, t: 1, q: "The 'tri' in 'tricycle' and 'triangle' means what?", a: "Three", d: ["Two", "Four", "Six"] },
    { c, t: 2, q: "The 'ject' in 'eject' and 'project' comes from the Latin for what?", a: "To throw", d: ["To push", "To shine", "To show"] },
    { c, t: 3, q: "'Pterodactyl' comes from Greek words meaning what?", a: "Wing finger", d: ["Flying lizard", "Feathered claw", "Sky hunter"] },
    { c, t: 4, q: "'Gossip' comes from an Old English word for what?", a: "Godparent", d: ["Midwife", "Village crier", "Neighbor"] },
    { c, t: 5, q: "'Geranium' comes from the Greek word for which bird?", a: "Crane", d: ["Stork", "Heron", "Swan"] },
  ],
  // day 52 (2026-12-09)
  [
    { c, t: 1, q: "The 'homo' in 'homophone' and 'homonym' means what?", a: "Same", d: ["Human", "Home", "Sound"] },
    { c, t: 2, q: "The 'mort' in 'mortal' and 'mortuary' comes from the Latin word for what?", a: "Death", d: ["Earth", "Flesh", "Fate"] },
    { c, t: 3, q: "'Giraffe' came into English, by way of Italian, from which language?", a: "Arabic", d: ["Swahili", "Latin", "Greek"] },
    { c, t: 4, q: "'Honcho,' as in head honcho, comes from a Japanese word meaning what?", a: "Squad leader", d: ["Strong man", "Senior monk", "Shop owner"] },
    { c, t: 5, q: "'Mustang' comes from a Spanish word for what?", a: "A stray animal", d: ["A war horse", "A painted pony", "A fast runner"] },
  ],
  // day 53 (2026-12-10)
  [
    { c, t: 1, q: "The 'penta' in 'pentagon' and 'pentathlon' means what?", a: "Five", d: ["Four", "Six", "Seven"] },
    { c, t: 2, q: "'Veto' is a Latin word meaning what?", a: "I forbid", d: ["I decide", "I choose", "I approve"] },
    { c, t: 3, q: "'Gospel' comes from Old English words meaning what?", a: "Good news", d: ["Holy book", "True story", "Church song"] },
    { c, t: 4, q: "A 'carol' was originally what?", a: "A ring dance", d: ["A shepherd's pipe", "A winter feast", "A bell ringing"] },
    { c, t: 5, q: "When 'bully' entered English in the 1500s, it meant what?", a: "Sweetheart", d: ["Coward", "Bull keeper", "Soldier"] },
  ],
  // day 54 (2026-12-11)
  [
    { c, t: 1, q: "The 'quad' in 'quadruple' and 'quadrant' means what?", a: "Four", d: ["Three", "Double", "Eight"] },
    { c, t: 2, q: "The 'tract' in 'tractor' and 'traction' comes from the Latin for what?", a: "To pull", d: ["To plow", "To grip", "To turn"] },
    { c, t: 3, q: "In 'ZIP code,' what does ZIP stand for?", a: "Zone Improvement Plan", d: ["Zonal Index Program", "Zone Identification Post", "Zip Identification Plan"] },
    { c, t: 4, q: "'Calendar' comes from the Latin name for which day of the month?", a: "The first", d: ["The last", "The ninth", "The fifteenth"] },
    { c, t: 5, q: "'Porpoise' comes from Latin words meaning what?", a: "Pig fish", d: ["Sea dog", "Round nose", "Little whale"] },
  ],
  // day 55 (2026-12-12)
  [
    { c, t: 1, q: "The 'equi' in 'equilateral' and 'equinox' means what?", a: "Equal", d: ["Night", "Side", "Horse"] },
    { c, t: 2, q: "The 'ver' in 'verify' and 'verdict' comes from the Latin word for what?", a: "True", d: ["Speech", "Judge", "Green"] },
    { c, t: 3, q: "'Pundit' comes from a Sanskrit word for what?", a: "Learned man", d: ["Royal adviser", "Village elder", "Storyteller"] },
    { c, t: 4, q: "'Myriad' comes from the Greek word for which number?", a: "Ten thousand", d: ["One thousand", "One hundred", "One million"] },
    { c, t: 5, q: "The Old English 'bridd,' ancestor of 'bird,' meant what?", a: "A young bird", d: ["A songbird", "A hen", "A feather"] },
  ],
  // day 56 (2026-12-13)
  [
    { c, t: 1, q: "'Smog' blends 'smoke' with what?", a: "Fog", d: ["Mist", "Grime", "Haze"] },
    { c, t: 2, q: "The 'voc' in 'vocal' comes from the Latin word for what?", a: "Voice", d: ["Song", "Breath", "Throat"] },
    { c, t: 3, q: "'Ballot' comes from an Italian word meaning what?", a: "Little ball", d: ["Secret choice", "Paper slip", "Wooden box"] },
    { c, t: 4, q: "In Old English, 'deer' meant what?", a: "Any animal", d: ["Any bird", "A young horse", "Wild meat"] },
    { c, t: 5, q: "'Ignoramus' is a Latin word meaning what?", a: "We do not know", d: ["He is a fool", "We ignore it", "I am unaware"] },
  ],
  // day 57 (2026-12-14)
  [
    { c, t: 1, q: "The 'dorm' in 'dormitory' comes from the Latin for what?", a: "To sleep", d: ["To eat", "To study", "To live"] },
    { c, t: 2, q: "'Casino' is the Italian word for what?", a: "Little house", d: ["Gaming hall", "Lucky place", "Little bank"] },
    { c, t: 3, q: "The 'ortho' in 'orthodontist' comes from the Greek word for what?", a: "Straight", d: ["Tooth", "Bright", "Strong"] },
    { c, t: 4, q: "'Tulip' traces back to a Turkish word for which headwear?", a: "Turban", d: ["Fez", "Veil", "Crown"] },
    { c, t: 5, q: "'Sky' comes from an Old Norse word meaning what?", a: "Cloud", d: ["Heaven", "Blue", "Air"] },
  ],
  // day 58 (2026-12-15)
  [
    { c, t: 1, q: "'Circus' is the Latin word for what?", a: "Circle", d: ["Tent", "Show", "Crowd"] },
    { c, t: 2, q: "The 'ann' in 'annual' and 'anniversary' comes from the Latin word for what?", a: "Year", d: ["Day", "Feast", "Ring"] },
    { c, t: 3, q: "'Sleigh' came into American English from which language?", a: "Dutch", d: ["German", "Norwegian", "Russian"] },
    { c, t: 4, q: "'Bonsai' comes from Japanese words meaning what?", a: "Tray planting", d: ["Patient garden", "Dwarf forest", "Bent branch"] },
    { c, t: 5, q: "'Khaki' comes from an Urdu word meaning what?", a: "Dusty", d: ["Muddy", "Faded", "Soldierly"] },
  ],
  // day 59 (2026-12-16)
  [
    { c, t: 1, q: "The 'hemi' in 'hemisphere' means what?", a: "Half", d: ["Round", "Upper", "Whole"] },
    { c, t: 2, q: "The 'pac' in 'pacify' and 'Pacific' comes from the Latin word for what?", a: "Peace", d: ["Ocean", "Treaty", "Rest"] },
    { c, t: 3, q: "'Zucchini' is Italian for what?", a: "Little squashes", d: ["Green fingers", "Summer gourds", "Garden cucumbers"] },
    { c, t: 4, q: "'Symposium' comes from a Greek word meaning what?", a: "Drinking together", d: ["Speaking together", "Thinking together", "Sitting together"] },
    { c, t: 5, q: "'Enthusiasm' first meant what?", a: "Possession by a god", d: ["Great joy", "Love of country", "Youthful energy"] },
  ],
  // day 60 (2026-12-17)
  [
    { c, t: 1, q: "The 'vita' in 'vitamin' comes from the Latin word for what?", a: "Life", d: ["Health", "Food", "Energy"] },
    { c, t: 2, q: "The 'hemo' in 'hemoglobin' comes from the Greek word for what?", a: "Blood", d: ["Iron", "Heart", "Red"] },
    { c, t: 3, q: "The 'stetho' in 'stethoscope' comes from the Greek word for what?", a: "Chest", d: ["Heart", "Sound", "Breath"] },
    { c, t: 4, q: "The Old English ancestor of 'knight' meant what?", a: "Boy", d: ["Horseman", "Warrior", "Noble"] },
    { c, t: 5, q: "In Old English, 'sad' meant what?", a: "Full", d: ["Alone", "Cold", "Lost"] },
  ],
  // day 61 (2026-12-18)
  [
    { c, t: 1, q: "The 'sub' in 'subway' and 'submerge' means what?", a: "Under", d: ["Through", "Inside", "Across"] },
    { c, t: 2, q: "The 'liber' in 'liberty' and 'liberate' comes from the Latin word for what?", a: "Free", d: ["Book", "Brave", "Law"] },
    { c, t: 3, q: "The 'morph' in 'metamorphosis' comes from the Greek word for what?", a: "Shape", d: ["Change", "Sleep", "Insect"] },
    { c, t: 4, q: "'Ransack' comes from an Old Norse word meaning what?", a: "To search a house", d: ["To burn a village", "To steal cattle", "To sack a city"] },
    { c, t: 5, q: "Who coined 'googol,' the number written as 1 followed by 100 zeros?", a: "A mathematician's young nephew", d: ["A Google engineer", "An ancient Greek", "A Victorian astronomer"] },
  ],
  // day 62 (2026-12-19)
  [
    { c, t: 1, q: "The 'dict' in 'dictate' and 'predict' comes from the Latin for what?", a: "To say", d: ["To write", "To hear", "To rule"] },
    { c, t: 2, q: "The 'duct' in 'conduct' and 'aqueduct' comes from the Latin for what?", a: "To lead", d: ["To flow", "To join", "To carry"] },
    { c, t: 3, q: "The 'loqu' in 'eloquent' and 'loquacious' comes from the Latin for what?", a: "To speak", d: ["To charm", "To argue", "To sing"] },
    { c, t: 4, q: "Which poet coined 'pandemonium' as the name of the capital of Hell?", a: "John Milton", d: ["Dante Alighieri", "William Blake", "Edmund Spenser"] },
    { c, t: 5, q: "'Ugly' comes from an Old Norse word meaning what?", a: "Dreadful", d: ["Crooked", "Dirty", "Old"] },
  ],
  // day 63 (2026-12-20)
  [
    { c, t: 1, q: "'Glamping' blends 'camping' with which word?", a: "Glamorous", d: ["Glossy", "Glittering", "Global"] },
    { c, t: 2, q: "'Safari' is a Swahili word meaning what?", a: "Journey", d: ["Hunt", "Wild animal", "Grassland"] },
    { c, t: 3, q: "The 'urb' in 'urban' and 'suburb' comes from the Latin word for what?", a: "City", d: ["Street", "Crowd", "Wall"] },
    { c, t: 4, q: "'Fiasco' comes from an Italian word whose literal meaning is what?", a: "Bottle", d: ["Mask", "Song", "Stage"] },
    { c, t: 5, q: "Before it meant to mix up a story, 'garble' meant what?", a: "To sift", d: ["To shout", "To swallow", "To stir"] },
  ],
  // day 64 (2026-12-21)
  [
    { c, t: 1, q: "The 'super' in 'superhuman' and 'superstar' means what?", a: "Above", d: ["Strong", "Great", "Very"] },
    { c, t: 2, q: "The 'corp' in 'corpse' and 'corporation' comes from the Latin word for what?", a: "Body", d: ["Group", "Army", "Spirit"] },
    { c, t: 3, q: "The 'pedi' in 'pediatrician' comes from the Greek word for what?", a: "Child", d: ["Foot", "Doctor", "Care"] },
    { c, t: 4, q: "'Vanilla' comes from a Spanish word meaning what?", a: "Little pod", d: ["Sweet bean", "Pale flower", "Little seed"] },
    { c, t: 5, q: "Which humorist coined the word 'blurb' in 1907?", a: "Gelett Burgess", d: ["Mark Twain", "Ambrose Bierce", "O. Henry"] },
  ],
  // day 65 (2026-12-22)
  [
    { c, t: 1, q: "The 'multi' in 'multicolored' and 'multiply' means what?", a: "Many", d: ["Bright", "Mixed", "Double"] },
    { c, t: 2, q: "The 'neuro' in 'neurology' comes from the Greek word for what?", a: "Nerve", d: ["Brain", "Mind", "Spine"] },
    { c, t: 3, q: "The 'anthrop' in 'anthropology' comes from the Greek word for what?", a: "Human", d: ["Ancient", "Culture", "Society"] },
    { c, t: 4, q: "'Recipe' was originally a Latin command meaning what?", a: "Take", d: ["Mix", "Stir", "Measure"] },
    { c, t: 5, q: "The word 'gas' was coined by a Flemish chemist from which Greek word?", a: "Chaos", d: ["Pneuma", "Aether", "Kosmos"] },
  ],
  // day 66 (2026-12-23)
  [
    { c, t: 1, q: "The 'nav' in 'navy' and 'navigate' comes from the Latin word for what?", a: "Ship", d: ["Sea", "Sailor", "Star"] },
    { c, t: 2, q: "The 'theo' in 'theology' comes from the Greek word for what?", a: "God", d: ["Truth", "Faith", "Thought"] },
    { c, t: 3, q: "'Quarantine' comes from Italian words for how long a period?", a: "Forty days", d: ["Ten days", "Thirty days", "Seven days"] },
    { c, t: 4, q: "'Etiquette' comes from a French word that first meant what?", a: "A label", d: ["A court dance", "A bow", "A dinner party"] },
    { c, t: 5, q: "'Ciao' comes from a Venetian phrase meaning what?", a: "I am your servant", d: ["Go with God", "Good health", "Until later"] },
  ],
  // day 67 (2026-12-24)
  [
    { c, t: 1, q: "'Moped' blends 'motor' with what?", a: "Pedal", d: ["Speed", "Moving", "Road"] },
    { c, t: 2, q: "The 'fort' in 'fortify' and 'fortitude' comes from the Latin word for what?", a: "Strong", d: ["Wall", "Castle", "Lucky"] },
    { c, t: 3, q: "'Virus' comes from the Latin word for what?", a: "Poison", d: ["Fever", "Germ", "Plague"] },
    { c, t: 4, q: "'Kiosk' comes from a Turkish word for what?", a: "Pavilion", d: ["Market", "Window", "Fountain"] },
    { c, t: 5, q: "'Dashboard' first named a board on a carriage that blocked what?", a: "Mud", d: ["Wind", "Rain", "Sunlight"] },
  ],
  // day 68 (2026-12-25)
  [
    { c, t: 1, q: "The 'mas' in 'Christmas' is short for what?", a: "Mass", d: ["Master", "Mark", "Message"] },
    { c, t: 2, q: "The 'frater' behind 'fraternity' is the Latin word for what?", a: "Brother", d: ["Friend", "Father", "Club"] },
    { c, t: 3, q: "'Rodeo' comes from a Spanish word meaning what?", a: "Roundup", d: ["Bullfight", "Horse race", "Lasso"] },
    { c, t: 4, q: "A 'chauffeur' was originally what?", a: "A stoker", d: ["A footman", "A mechanic", "A messenger"] },
    { c, t: 5, q: "'Mob' is short for a Latin phrase meaning what?", a: "The fickle crowd", d: ["The angry crowd", "The armed band", "The loud mass"] },
  ],
  // day 69 (2026-12-26)
  [
    { c, t: 1, q: "'Motel' blends 'hotel' with which word?", a: "Motor", d: ["Mobile", "Model", "Modern"] },
    { c, t: 2, q: "The 'sci' in 'science' comes from the Latin for what?", a: "To know", d: ["To test", "To prove", "To see"] },
    { c, t: 3, q: "'Hors d'oeuvre' is French for what?", a: "Outside the work", d: ["Before the meal", "Small bite", "Chef's gift"] },
    { c, t: 4, q: "'Hurricane' came into English through Spanish from the language of which Caribbean people?", a: "Taino", d: ["Maya", "Aztec", "Inca"] },
    { c, t: 5, q: "'Stimulus' was the Latin word for what?", a: "A cattle prod", d: ["A shout", "A spark", "A drumbeat"] },
  ],
  // day 70 (2026-12-27)
  [
    { c, t: 1, q: "The 'ambi' in 'ambidextrous' means what?", a: "Both", d: ["Neither", "Left", "Quick"] },
    { c, t: 2, q: "The 'S' in 'scuba' stands for what?", a: "Self-contained", d: ["Surface", "Submarine", "Safety"] },
    { c, t: 3, q: "'Triceratops' comes from Greek words meaning what?", a: "Three-horned face", d: ["Three-toed lizard", "Horned giant", "Armored head"] },
    { c, t: 4, q: "In Old English, 'wife' meant simply what?", a: "Woman", d: ["Mother", "Servant", "Bride"] },
    { c, t: 5, q: "'Anger' comes from an Old Norse word meaning what?", a: "Grief", d: ["Fire", "Hunger", "Pride"] },
  ],
  // day 71 (2026-12-28)
  [
    { c, t: 1, q: "'Spork' blends 'spoon' with what?", a: "Fork", d: ["Knife", "Sporting", "Scoop"] },
    { c, t: 2, q: "The 'peri' in 'perimeter' and 'periscope' means what?", a: "Around", d: ["Above", "Beyond", "Near"] },
    { c, t: 3, q: "'Mammoth' came into English from which language?", a: "Russian", d: ["Latin", "Greek", "Norwegian"] },
    { c, t: 4, q: "'Slogan' comes from a Gaelic word for what?", a: "Battle cry", d: ["Family motto", "Clan banner", "Drinking song"] },
    { c, t: 5, q: "'Leopard' comes from Greek words meaning what?", a: "Lion-panther", d: ["Spotted cat", "Swift hunter", "Tree cat"] },
  ],
  // day 72 (2026-12-29)
  [
    { c, t: 1, q: "'Brunch' blends 'breakfast' with which other meal?", a: "Lunch", d: ["Dinner", "Supper", "Snack"] },
    { c, t: 2, q: "The 'pan' in 'pandemic' and 'panorama' means what?", a: "All", d: ["Wide", "Sick", "Great"] },
    { c, t: 3, q: "'Cul-de-sac' is French for what?", a: "Bottom of the sack", d: ["Dead end", "Closed circle", "Quiet street"] },
    { c, t: 4, q: "The 'check' in 'checkmate' traces back to a Persian word for what?", a: "King", d: ["Danger", "Attack", "Board"] },
    { c, t: 5, q: "'Sarcophagus' comes from Greek words meaning what?", a: "Flesh eating", d: ["Stone box", "Royal bed", "Eternal home"] },
  ],
  // day 73 (2026-12-30)
  [
    { c, t: 1, q: "'Podcast' blends 'iPod' with which word?", a: "Broadcast", d: ["Forecast", "Telecast", "Typecast"] },
    { c, t: 2, q: "The 'arch' in 'monarch' and 'patriarch' comes from a Greek word meaning what?", a: "Ruler", d: ["Father", "Old", "Single"] },
    { c, t: 3, q: "'Asteroid' comes from a Greek word meaning what?", a: "Star-like", d: ["Space rock", "Small planet", "Falling stone"] },
    { c, t: 4, q: "Which novelist coined the word 'cyberspace'?", a: "William Gibson", d: ["Isaac Asimov", "Philip K. Dick", "Neal Stephenson"] },
    { c, t: 5, q: "In Middle English, 'buxom' meant what?", a: "Obedient", d: ["Strong", "Wealthy", "Tall"] },
  ],
  // day 74 (2026-12-31)
  [
    { c, t: 1, q: "The 'eve' in 'New Year's Eve' is short for what?", a: "Evening", d: ["Event", "Eleventh hour", "Everlasting"] },
    { c, t: 2, q: "The 'lith' in 'monolith' and 'lithograph' comes from the Greek word for what?", a: "Stone", d: ["Print", "Pillar", "Ancient"] },
    { c, t: 3, q: "'Opera' is the Latin word for what?", a: "Work", d: ["Song", "Stage", "Voice"] },
    { c, t: 4, q: "'Admiral' traces back to an Arabic title meaning what?", a: "Commander", d: ["Sailor", "Merchant", "Navigator"] },
    { c, t: 5, q: "In Old English, 'lewd' meant what?", a: "Not of the clergy", d: ["Drunk", "Wealthy", "Foreign"] },
  ],
];
// Every authored day, launch first; nothing reads this today.
export const ALL_DAYS = [...LAUNCH_DAYS, ...LANE_DAYS];
