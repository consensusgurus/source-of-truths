// Origin lane: Word Origins. Where ordinary English words come from: the
// source language, the literal meaning of a Greek or Latin root, prefixes and
// suffixes, loanwords (Arabic, Dutch, Hindi, Norse, Nahuatl, Japanese and
// more), and how a word's meaning shifted. Not words named after a person or
// place (the other Origin lane), and not idioms or phrases. Only origins that
// Merriam-Webster or Etymonline state plainly; no folk etymologies.
const c = 'Word Origins';
export const LANE_DAYS = [
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
