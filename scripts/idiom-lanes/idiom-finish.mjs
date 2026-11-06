// Idiom gauntlet, lane 'Finish the Saying': proverbs, sayings and similes.
// THIS FILE HOLDS THE LATEST SEGMENT ONLY: bank days 37..74 (2026-11-24 to
// 2026-12-31), five tiers a day (tier 1 gimme .. tier 5 expert). Days 1..36 were
// built from the launch version of this file (commit 25faa9aa) and live frozen in
// app/idiom/questions.js. Each saying is used once, in one form; idioms and
// foreign phrases belong to the other Idiom lane.
const L = 'Finish the Saying';
const D = (t, q, a, d) => ({ c: L, t, q, a, d });

export const LANE_DAYS = [
  // day 37 (2026-11-24)
  [
    D(1, "Which word completes the saying: 'No pain, no ___'?", 'gain', ['loss', 'win', 'glory']),
    D(2, "How does the proverb end: 'Waste not...'?", 'want not', ['need not', 'lose not', 'fear not']),
    D(3, "Which word completes the saying: 'Barking dogs seldom ___'?", 'bite', ['sleep', 'growl', 'run']),
    D(4, "In the magpie rhyme, which word completes: 'One for sorrow, two for ___'?", 'joy', ['gold', 'luck', 'love']),
    D(5, "How does the proverb end: 'He who excuses himself...'?", 'accuses himself', ['forgives himself', 'fools himself', 'shames himself']),
  ],
  // day 38 (2026-11-25)
  [
    D(1, "Which word completes the saying: 'The more, the ___'?", 'merrier', ['better', 'happier', 'louder']),
    D(2, "How does the proverb end: 'Out of the frying pan...'?", 'into the fire', ['onto the plate', 'into the pot', 'off the stove']),
    D(3, "Which word completes the saying: 'Laugh, and the world laughs with you; weep, and you weep ___'?", 'alone', ['together', 'twice', 'forever']),
    D(4, "Which word completes the saying: 'Constant dripping wears away the ___'?", 'stone', ['roof', 'paint', 'wood']),
    D(5, "Which word completes the saying: 'A golden key opens every ___'?", 'door', ['heart', 'chest', 'gate']),
  ],
  // day 39 (2026-11-26)
  [
    D(1, "Complete the simile: 'As American as apple...'?", 'pie', ['cider', 'butter', 'sauce']),
    D(2, "How does the proverb end: 'The way to a man's heart...'?", 'is through his stomach', ['is through his wallet', 'is through his ego', 'is a mystery']),
    D(3, "Which word completes the saying: 'You can't fight city ___'?", 'hall', ['police', 'traffic', 'taxes']),
    D(4, "Which word completes the saying: 'Ill-gotten gains never ___'?", 'prosper', ['shrink', 'satisfy', 'grow']),
    D(5, "Complete the American simile: 'As poor as Job's...'?", 'turkey', ['goat', 'mule', 'hen']),
  ],
  // day 40 (2026-11-27)
  [
    D(1, "Which word completes the saying: 'Seeing is ___'?", 'believing', ['knowing', 'trusting', 'learning']),
    D(2, "Which word completes the saying: 'A leopard can't change its ___'?", 'spots', ['stripes', 'claws', 'roar']),
    D(3, "How does the saying end: 'Old soldiers never die...'?", 'they just fade away', ['they just march on', 'they just retire', 'they just tell stories']),
    D(4, "Which word completes the saying: 'Even a worm will ___'?", 'turn', ['bite', 'fight', 'hide']),
    D(5, "Which word completes the saying: 'Needs must when the devil ___'?", 'drives', ['calls', 'laughs', 'pays']),
  ],
  // day 41 (2026-11-28)
  [
    D(1, "Which word completes the saying: 'Knowledge is ___'?", 'power', ['wealth', 'freedom', 'beauty']),
    D(2, "Which word completes the saying: 'You reap what you ___'?", 'sow', ['earn', 'take', 'give']),
    D(3, "Which word completes the saying: 'Spare the rod and spoil the ___'?", 'child', ['horse', 'harvest', 'servant']),
    D(4, "Which word completes the saying: 'Empty vessels make the most ___'?", 'noise', ['trouble', 'room', 'water']),
    D(5, "Which word completes the saying: 'Every why has a ___'?", 'wherefore', ['because', 'whence', 'therefore']),
  ],
  // day 42 (2026-11-29)
  [
    D(1, "Which word completes the saying: 'Money doesn't grow on ___'?", 'trees', ['bushes', 'vines', 'farms']),
    D(2, "Which word completes the saying: 'You can't make an omelet without breaking ___'?", 'eggs', ['bowls', 'rules', 'pans']),
    D(3, "Which word completes the saying: 'A chain is only as strong as its weakest ___'?", 'link', ['lock', 'hook', 'part']),
    D(4, "Which word completes the saying: 'Cut your coat according to your ___'?", 'cloth', ['size', 'needs', 'purse']),
    D(5, "Which word completes the saying: 'All cats are gray in the ___'?", 'dark', ['rain', 'barn', 'alley']),
  ],
  // day 43 (2026-11-30)
  [
    D(1, "Which word completes the saying: 'Two's company, three's a ___'?", 'crowd', ['party', 'team', 'problem']),
    D(2, "Which word completes the saying: 'Like father, like ___'?", 'son', ['brother', 'uncle', 'friend']),
    D(3, "Which word completes the saying: 'Desperate times call for desperate ___'?", 'measures', ['leaders', 'prayers', 'friends']),
    D(4, "Which word completes the saying: 'Many are called, but few are ___'?", 'chosen', ['saved', 'ready', 'worthy']),
    D(5, "Which word completes the saying: 'Don't keep a dog and bark ___'?", 'yourself', ['at night', 'in vain', 'too loudly']),
  ],
  // day 44 (2026-12-01)
  [
    D(1, "Which word completes the saying: 'When it rains, it ___'?", 'pours', ['floods', 'storms', 'drips']),
    D(2, "Which word completes the saying: 'The best things in life are ___'?", 'free', ['rare', 'earned', 'shared']),
    D(3, "Which word completes the saying: 'Brevity is the soul of ___'?", 'wit', ['poetry', 'wisdom', 'kindness']),
    D(4, "Which word completes the saying: 'In the land of the blind, the one-eyed man is ___'?", 'king', ['lost', 'feared', 'wise']),
    D(5, "Which word completes the saying: 'A creaking door hangs ___'?", 'longest', ['crooked', 'loose', 'heavy']),
  ],
  // day 45 (2026-12-02)
  [
    D(1, "Which word completes the saying: 'Rules are made to be ___'?", 'broken', ['followed', 'changed', 'written']),
    D(2, "Which word completes the saying: 'Don't throw the baby out with the ___'?", 'bathwater', ['laundry', 'blanket', 'crib']),
    D(3, "Which word completes the saying: 'The best-laid plans of mice and men often go ___'?", 'awry', ['unfinished', 'unnoticed', 'unpaid']),
    D(4, 'According to Ben Franklin, fish and visitors stink after three what?', 'Days', ['Weeks', 'Hours', 'Meals']),
    D(5, "Which word completes the saying: 'Hunger drives the wolf out of the ___'?", 'wood', ['den', 'hills', 'cave']),
  ],
  // day 46 (2026-12-03)
  [
    D(1, "Which word completes the saying: 'Great minds think ___'?", 'alike', ['deeply', 'quickly', 'freely']),
    D(2, "Which word completes the saying: 'Talk is ___'?", 'cheap', ['easy', 'harmless', 'useless']),
    D(3, "Which word completes the saying: 'Imitation is the sincerest form of ___'?", 'flattery', ['respect', 'praise', 'friendship']),
    D(4, "Which word completes the saying: 'Little things please little ___'?", 'minds', ['children', 'people', 'hearts']),
    D(5, "Which word completes the saying: 'Let the cobbler stick to his ___'?", 'last', ['trade', 'bench', 'awl']),
  ],
  // day 47 (2026-12-04)
  [
    D(1, "Which word completes the saying: 'Patience is a ___'?", 'virtue', ['gift', 'skill', 'choice']),
    D(2, "Which word completes the saying: 'Every rose has its ___'?", 'thorn', ['petal', 'season', 'scent']),
    D(3, "Which word completes the saying: 'A rising tide lifts all ___'?", 'boats', ['spirits', 'docks', 'nets']),
    D(4, "Which word completes the saying: 'There is honor among ___'?", 'thieves', ['soldiers', 'sailors', 'rivals']),
    D(5, "Which word completes the saying: 'Tell the truth and shame the ___'?", 'devil', ['liar', 'crowd', 'family']),
  ],
  // day 48 (2026-12-05)
  [
    D(1, "Which word completes the saying: 'First come, first ___'?", 'served', ['paid', 'chosen', 'seated']),
    D(2, "Which word completes the saying: 'Never put off till tomorrow what you can do ___'?", 'today', ['later', 'alone', 'well']),
    D(3, "Complete the simile: 'As pale as a...'?", 'ghost', ['candle', 'cloud', 'pearl']),
    D(4, "Which word completes the saying: 'Never trouble trouble till trouble troubles ___'?", 'you', ['twice', 'all', 'others']),
    D(5, "Which word completes the saying: 'Short reckonings make long ___'?", 'friends', ['debts', 'lives', 'memories']),
  ],
  // day 49 (2026-12-06)
  [
    D(1, "Which word completes the saying: 'Finders keepers, losers ___'?", 'weepers', ['sleepers', 'seekers', 'creepers']),
    D(2, "Complete the simile: 'As sick as a...'?", 'dog', ['cat', 'goat', 'mule']),
    D(3, "Complete the simile: 'As steady as a...'?", 'rock', ['tree', 'wall', 'ship']),
    D(4, "Which word completes the saying: 'The cobbler's children go ___'?", 'barefoot', ['hungry', 'unschooled', 'ragged']),
    D(5, "Which word completes Francis Bacon's line: 'Hope is a good breakfast, but it is a bad ___'?", 'supper', ['habit', 'master', 'lunch']),
  ],
  // day 50 (2026-12-07)
  [
    D(1, "Which word completes the saying: 'Opposites ___'?", 'attract', ['repel', 'argue', 'collide']),
    D(2, "Complete the simile: 'As cute as a...'?", 'button', ['penny', 'ribbon', 'peach']),
    D(3, "Complete the simile: 'As warm as...'?", 'toast', ['soup', 'bread', 'wool']),
    D(4, "How does the proverb end: 'None so blind...'?", 'as those who will not see', ['as a mole in the sun', 'as love at first sight', 'as a judge with a bribe']),
    D(5, "Which word completes the saying: 'Better to wear out than to ___ out'?", 'rust', ['burn', 'sell', 'die']),
  ],
  // day 51 (2026-12-08)
  [
    D(1, "Which word completes the saying: 'Home is where the ___ is'?", 'heart', ['family', 'money', 'dog']),
    D(2, "Complete the simile: 'As fresh as a...'?", 'daisy', ['tulip', 'lily', 'pansy']),
    D(3, 'According to the proverb, what do you catch more flies with than vinegar?', 'Honey', ['Jam', 'Bread', 'Wine']),
    D(4, "Which word completes the saying: 'Silence gives ___'?", 'consent', ['offense', 'comfort', 'away']),
    D(5, "Which word completes the saying: 'Second thoughts are ___'?", 'best', ['wasted', 'safer', 'slower']),
  ],
  // day 52 (2026-12-09)
  [
    D(1, "Which word completes the saying: 'Old habits die ___'?", 'hard', ['slowly', 'young', 'quietly']),
    D(2, "Complete the simile: 'As high as a...'?", 'kite', ['hawk', 'ladder', 'tree']),
    D(3, 'According to the proverb, a jack of all trades is also what?', 'Master of none', ['Friend to all', 'King of the market', 'Servant of many']),
    D(4, "How does the proverb end: 'There's many a good tune...'?", 'played on an old fiddle', ['sung by a tired voice', 'lost to the wind', 'whistled in the dark']),
    D(5, "Which word completes the saying: 'Even Homer ___'?", 'nods', ['errs', 'sings', 'weeps']),
  ],
  // day 53 (2026-12-10)
  [
    D(1, "Which word completes the saying: 'Monkey see, monkey ___'?", 'do', ['say', 'try', 'play']),
    D(2, "Complete the simile: 'As plain as the nose on your...'?", 'face', ['head', 'hand', 'chin']),
    D(3, 'According to the proverb, if speech is silver, what is golden?', 'Silence', ['Wisdom', 'Kindness', 'Patience']),
    D(4, "How does the proverb end: 'Ask no questions...'?", 'and hear no lies', ['and make no friends', 'and learn nothing', 'and keep the peace']),
    D(5, "Which word completes the saying, from the Latin 'festina lente': 'Make haste ___'?", 'slowly', ['carefully', 'wisely', 'quietly']),
  ],
  // day 54 (2026-12-11)
  [
    D(1, "Which word completes the saying: 'There's no such thing as a free ___'?", 'lunch', ['pass', 'prize', 'gift']),
    D(2, "Which word completes the saying: 'When life gives you lemons, make ___'?", 'lemonade', ['pie', 'juice', 'tea']),
    D(3, "Which proverb means you shouldn't worry about a problem before it arrives?", 'Cross that bridge when you come to it', ['Look before you leap', 'A watched pot never boils', 'Every cloud has a silver lining']),
    D(4, "How does Shakespeare's line end: 'Uneasy lies the head...'?", 'that wears a crown', ['that sleeps alone', 'that thinks too much', 'that bows to none']),
    D(5, "Which word completes the saying: 'Distance lends ___ to the view'?", 'enchantment', ['clarity', 'color', 'depth']),
  ],
  // day 55 (2026-12-12)
  [
    D(1, "Complete the simile: 'As brave as a...'?", 'lion', ['tiger', 'bear', 'knight']),
    D(2, "How does the proverb end: 'Early to bed and early to rise...'?", 'makes a man healthy, wealthy, and wise', ['keeps a man fit, rich, and happy', 'makes the day long and bright', 'gives a man more time to work']),
    D(3, 'Which proverb means people value something only once it is gone?', 'You never miss the water till the well runs dry', ['Still waters run deep', 'Good fences make good neighbors', 'Time heals all wounds']),
    D(4, "How does Alexander Pope's saying end: 'A little learning...'?", 'is a dangerous thing', ['goes a long way', 'is better than none', 'makes a proud fool']),
    D(5, "Which word completes the saying: 'Every man for himself, and the devil take the ___'?", 'hindmost', ['weakest', 'stragglers', 'rest']),
  ],
  // day 56 (2026-12-13)
  [
    D(1, "Which word completes the saying: 'Every dog has its ___'?", 'day', ['bone', 'home', 'master']),
    D(2, "How does the saying end: 'You win some...'?", 'you lose some', ['you learn some', 'you share some', 'you miss some']),
    D(3, "How does the saying end: 'Let the punishment...'?", 'fit the crime', ['come swiftly', 'be public', 'end the matter']),
    D(4, "How does the proverb end: 'Set a thief...'?", 'to catch a thief', ['to guard the gold', 'free and he will steal', 'on the right path']),
    D(5, "Which word completes the saying: 'A burnt child dreads the ___'?", 'fire', ['stove', 'dark', 'rod']),
  ],
  // day 57 (2026-12-14)
  [
    D(1, "Which word completes the saying: 'Don't bite the hand that ___ you'?", 'feeds', ['helps', 'leads', 'warns']),
    D(2, "How does the saying end: 'If you can't beat them...'?", 'join them', ['leave them', 'outlast them', 'ignore them']),
    D(3, "How does the proverb end: 'Seek, and ye...'?", 'shall find', ['shall be rewarded', 'shall be lost', 'shall wait']),
    D(4, "Complete the simile: 'As welcome as the flowers in...'?", 'May', ['June', 'winter', 'a vase']),
    D(5, "Which word completes the saying: 'Every tub must stand on its own ___'?", 'bottom', ['feet', 'base', 'legs']),
  ],
  // day 58 (2026-12-15)
  [
    D(1, "Which word completes the saying: 'A cat has nine ___'?", 'lives', ['tails', 'toes', 'friends']),
    D(2, "Which word completes the saying: 'All roads lead to ___'?", 'Rome', ['home', 'glory', 'Paris']),
    D(3, "How does the proverb end: 'A house divided against itself...'?", 'cannot stand', ['will be sold', 'has no roof', 'needs a master']),
    D(4, "Complete the simile: 'As brown as a...'?", 'berry', ['bear', 'leaf', 'loaf']),
    D(5, "Which word completes Robert Browning's line: 'A man's reach should exceed his ___'?", 'grasp', ['height', 'means', 'dreams']),
  ],
  // day 59 (2026-12-16)
  [
    D(1, "Which word completes the saying: 'Third time's the ___'?", 'charm', ['winner', 'lucky one', 'try']),
    D(2, "Which word completes the saying: 'That's the pot calling the ___ black'?", 'kettle', ['pan', 'stove', 'skillet']),
    D(3, "How does the saying end: 'Even a stopped clock...'?", 'is right twice a day', ['can be fixed', 'still keeps its hands', 'has its uses']),
    D(4, "Complete the simile: 'As bald as a...'?", 'coot', ['crow', 'duck', 'loon']),
    D(5, "How does Thomas Gray's line end: 'Where ignorance is bliss...'?", "'tis folly to be wise", ["'tis wise to stay silent", "'tis kind to say nothing", "'tis cruel to teach"]),
  ],
  // day 60 (2026-12-17)
  [
    D(1, "Which word completes the saying: 'April showers bring May ___'?", 'flowers', ['rainbows', 'gardens', 'harvests']),
    D(2, "Which word completes the saying: 'Good things come to those who ___'?", 'wait', ['ask', 'give', 'dream']),
    D(3, "Complete the simile: 'As nutty as a...'?", 'fruitcake', ['pecan pie', 'walnut', 'cookie jar']),
    D(4, "Complete the simile: 'Like ships that pass in the...'?", 'night', ['harbor', 'fog', 'channel']),
    D(5, "How does Shakespeare's line end: 'Cowards die many times...'?", 'before their deaths', ['in their dreams', 'and never live', 'for want of nerve']),
  ],
  // day 61 (2026-12-18)
  [
    D(1, "Which word completes the saying: 'You are what you ___'?", 'eat', ['wear', 'own', 'say']),
    D(2, "Complete the simile: 'Like a moth to a...'?", 'flame', ['star', 'moon', 'flower']),
    D(3, "How does the saying end: 'Speak softly...'?", 'and carry a big stick', ['and be heard by all', 'and wear a kind smile', 'and walk a long road']),
    D(4, "Which word completes the saying: 'An army marches on its ___'?", 'stomach', ['boots', 'pride', 'orders']),
    D(5, "How does the Bible verse end: 'A prophet is not without honor...'?", 'save in his own country', ['until his words come true', 'in the eyes of God', 'until he is gone']),
  ],
  // day 62 (2026-12-19)
  [
    D(1, "Which word completes the saying: 'Look on the bright ___'?", 'side', ['path', 'light', 'spot']),
    D(2, "Complete the simile: 'Like water off a duck's...'?", 'back', ['wing', 'beak', 'tail']),
    D(3, "Which word completes the saying: 'Red sky at night, sailor's ___'?", 'delight', ['luck', 'prize', 'dream']),
    D(4, "Which word completes Ben Franklin's saying: 'A small leak will sink a great ___'?", 'ship', ['nation', 'fortune', 'dam']),
    D(5, "How does the proverb end: 'It's an ill bird...'?", 'that fouls its own nest', ['that sings at night', 'that flies alone', 'that steals its food']),
  ],
  // day 63 (2026-12-20)
  [
    D(1, "Which word completes the saying: 'Don't make a mountain out of a ___'?", 'molehill', ['hill', 'pebble', 'anthill']),
    D(2, "Complete the simile: 'Like shooting fish in a...'?", 'barrel', ['pond', 'net', 'tank']),
    D(3, "Which word completes the saying: 'There's no accounting for ___'?", 'taste', ['luck', 'fools', 'weather']),
    D(4, "How does the proverb end: 'Marry in haste...'?", 'repent at leisure', ['divorce in a hurry', 'and live in love', 'and pay the price']),
    D(5, "How does the proverb end: 'Every man is the architect...'?", 'of his own fortune', ['of his own house', 'of his own grief', 'of his own name']),
  ],
  // day 64 (2026-12-21)
  [
    D(1, "Which word completes the saying: 'Good things come in small ___'?", 'packages', ['doses', 'numbers', 'ways']),
    D(2, "Complete the simile: 'Like a dog with a...'?", 'bone', ['ball', 'stick', 'bowl']),
    D(3, "Which word completes the saying: 'You can't unring a ___'?", 'bell', ['phone', 'alarm', 'chime']),
    D(4, "Which word completes the Bible verse: 'Ye cannot serve God and ___'?", 'mammon', ['Caesar', 'kings', 'Baal']),
    D(5, "How does the proverb end: 'Who chatters to you...'?", 'will chatter of you', ['will tire of you', 'will never listen', 'is a true friend']),
  ],
  // day 65 (2026-12-22)
  [
    D(1, "Complete the simile: 'Like looking for a needle in a...'?", 'haystack', ['barn', 'garden', 'desert']),
    D(2, "Complete the simile: 'Like a hot knife through...'?", 'butter', ['cheese', 'cake', 'bread']),
    D(3, "Which word completes the saying: 'More haste, less ___'?", 'speed', ['time', 'care', 'waste']),
    D(4, "Which word completes the proverb: 'Love me, love my ___'?", 'dog', ['cat', 'home', 'horse']),
    D(5, "Complete the American simile: 'Like Grant took...'?", 'Richmond', ['Atlanta', 'Vicksburg', 'Gettysburg']),
  ],
  // day 66 (2026-12-23)
  [
    D(1, "Complete the simile: 'Like a deer caught in the...'?", 'headlights', ['woods', 'rain', 'net']),
    D(2, "Complete the simile: 'As honest as the day is...'?", 'long', ['bright', 'clear', 'warm']),
    D(3, "How does the saying end: 'The cure is worse...'?", 'than the disease', ['than the doctor', 'than the pain', 'than the bill']),
    D(4, "How does the proverb end: 'Whom the gods love...'?", 'die young', ['live long', 'grow wise', 'never weep']),
    D(5, "Which word completes the Bible verse: 'The wicked flee when no man ___'?", 'pursueth', ['watcheth', 'calleth', 'judgeth']),
  ],
  // day 67 (2026-12-24)
  [
    D(1, "Complete the simile: 'Like a broken...'?", 'record', ['radio', 'bell', 'toy']),
    D(2, "Which word completes the saying: 'A bad workman blames his ___'?", 'tools', ['boss', 'luck', 'helpers']),
    D(3, "Which word completes the saying: 'There's always room at the ___'?", 'top', ['table', 'inn', 'back']),
    D(4, "Which word completes the saying: 'Out of the mouths of ___'?", 'babes', ['fools', 'kings', 'prophets']),
    D(5, "How does the proverb end: 'Early ripe...'?", 'early rotten', ['early picked', 'late eaten', 'soon sweet']),
  ],
  // day 68 (2026-12-25)
  [
    D(1, "Complete the simile: 'Stick out like a sore...'?", 'thumb', ['toe', 'finger', 'nose']),
    D(2, 'Which proverb means that a thoughtful gift matters more than its price?', "It's the thought that counts", ['Charity begins at home', 'Money talks', 'Easy come, easy go']),
    D(3, "Complete the simile: 'Running around like a chicken with its head cut...'?", 'off', ['short', 'loose', 'open']),
    D(4, "Which word completes the saying: 'He that lies down with dogs shall rise up with ___'?", 'fleas', ['fur', 'bones', 'mud']),
    D(5, "How does the proverb end: 'The wish is father...'?", 'to the thought', ['to the deed', 'to the dream', 'to the plan']),
  ],
  // day 69 (2026-12-26)
  [
    D(1, "How does the proverb end: 'If at first you don't succeed...'?", 'try, try again', ['give up for good', 'ask for help', 'blame someone else']),
    D(2, "Which word completes the saying: 'Dead men tell no ___'?", 'tales', ['lies', 'jokes', 'secrets']),
    D(3, "Complete the simile: 'Like a cat on a hot tin...'?", 'roof', ['plate', 'stove', 'can']),
    D(4, "How does the proverb end: 'Of two evils...'?", 'choose the lesser', ['choose neither', 'expect the worse', 'blame the first']),
    D(5, "How does the ancient saying end: 'Call no man happy...'?", 'until he is dead', ['who is rich', 'who has no friends', 'before breakfast']),
  ],
  // day 70 (2026-12-27)
  [
    D(1, "How does the proverb end: 'What goes around...'?", 'comes around', ['goes away', 'must come down', 'stays around']),
    D(2, "Which word completes the saying: 'A man's home is his ___'?", 'castle', ['kingdom', 'treasure', 'temple']),
    D(3, "Complete the simile: 'Like a lamb to the...'?", 'slaughter', ['shepherd', 'meadow', 'fold']),
    D(4, "Which word completes the saying: 'Better to light a candle than to curse the ___'?", 'darkness', ['wind', 'night', 'cold']),
    D(5, "Which word completes the saying: 'Fine feathers make fine ___'?", 'birds', ['hats', 'beds', 'pillows']),
  ],
  // day 71 (2026-12-28)
  [
    D(1, "How does the proverb end: 'No news...'?", 'is good news', ['is old news', 'is a mystery', 'travels slowly']),
    D(2, "Which word completes the saying: 'Time and tide wait for no ___'?", 'man', ['ship', 'king', 'clock']),
    D(3, "Complete the simile: 'Getting along like a house on...'?", 'fire', ['a hill', 'stilts', 'the market']),
    D(4, "Complete the simile: 'Like a red rag to a...'?", 'bull', ['horse', 'goat', 'boar']),
    D(5, "Which word completes the saying: 'Old sins cast long ___'?", 'shadows', ['nets', 'roots', 'chains']),
  ],
  // day 72 (2026-12-29)
  [
    D(1, "Which word completes the saying: 'One man's trash is another man's ___'?", 'treasure', ['problem', 'dinner', 'burden']),
    D(2, "Which word completes the saying: 'Nothing is certain but death and ___'?", 'taxes', ['debt', 'rain', 'love']),
    D(3, "Complete the simile: 'Grinning like the cat that ate the...'?", 'canary', ['mouse', 'goldfish', 'cheese']),
    D(4, "Complete the simile: 'As mad as a March...'?", 'hare', ['wind', 'storm', 'rabbit']),
    D(5, "Which word completes the Bible verse: 'Stolen waters are ___'?", 'sweet', ['bitter', 'cold', 'deep']),
  ],
  // day 73 (2026-12-30)
  [
    D(1, "Which word completes the saying: 'Keep your friends close and your enemies ___'?", 'closer', ['farther', 'guessing', 'watched']),
    D(2, "Which word completes the saying: 'Children should be seen and not ___'?", 'heard', ['scolded', 'spoiled', 'touched']),
    D(3, "Complete the simile: 'As wise as...'?", 'Solomon', ['Moses', 'Merlin', 'Socrates']),
    D(4, "How does the proverb end: 'Give a dog a bad name...'?", 'and hang him', ['and he will bite', 'and he will run', 'and feed him less']),
    D(5, "Which word completes the saying: 'He that would eat the kernel must crack the ___'?", 'nut', ['stone', 'seed', 'pod']),
  ],
  // day 74 (2026-12-31)
  [
    D(1, "Which word completes the saying: 'Out with the old, in with the ___'?", 'new', ['young', 'best', 'next']),
    D(2, 'Which proverb tells someone to accept the results of their own choices?', "You've made your bed, now lie in it", ['Let sleeping dogs lie', 'Every dog has its day', 'Rome was not built in a day']),
    D(3, "How does the proverb end: 'Better to be a big fish...'?", 'in a small pond', ['than a small fry', 'in the deep sea', 'than none at all']),
    D(4, "Which word completes the saying: 'Idle hands are the devil's ___'?", 'workshop', ['garden', 'kitchen', 'choir']),
    D(5, "Which word completes Ben Franklin's saying: 'The used key is always ___'?", 'bright', ['worn', 'lost', 'cold']),
  ],
];
