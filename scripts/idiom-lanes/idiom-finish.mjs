// Idiom gauntlet, lane 'Finish the Saying': proverbs, sayings and similes.
// 36 days x 5 tiers (tier 1 gimme .. tier 5 expert). Each saying is used once,
// in one form; idioms and foreign phrases belong to the other Idiom lane.
const L = 'Finish the Saying';
const D = (t, q, a, d) => ({ c: L, t, q, a, d });

export const LANE_DAYS = [
  // day 1
  [
    D(1, "How does the proverb end: 'The early bird...'?", 'catches the worm', ['gets the seed', 'sings the loudest', 'flies the farthest']),
    D(2, 'According to the proverb, what does a rolling stone gather none of?', 'Moss', ['Dust', 'Speed', 'Mud']),
    D(3, "Complete the simile: 'As poor as a church...'?", 'mouse', ['cat', 'bell', 'pew']),
    D(4, "Which word completes the saying: 'Possession is nine-tenths of the ___'?", 'law', ['battle', 'game', 'argument']),
    D(5, "How does the proverb end: 'Fine words butter...'?", 'no parsnips', ['no bread', 'no muffins', 'few biscuits']),
  ],
  // day 2
  [
    D(1, "How does the proverb end: 'Practice makes...'?", 'perfect', ['heroes', 'champions', 'masters']),
    D(2, "Which word completes the saying: 'Don't cry over spilled ___'?", 'milk', ['wine', 'tea', 'water']),
    D(3, 'According to the proverb, what goes before a fall?', 'Pride', ['Greed', 'Haste', 'Envy']),
    D(4, "How does the proverb end: 'Many a true word...'?", 'is spoken in jest', ['is spoken in anger', 'is lost in translation', 'is written in stone']),
    D(5, "Complete the simile: 'As pleased as...'?", 'Punch', ['Judy', 'a king', 'a puppy']),
  ],
  // day 3
  [
    D(1, "How does the proverb end: 'If it ain't broke...'?", "don't fix it", ["don't touch it", 'leave it be', "don't sell it"]),
    D(2, "Which word completes the saying: 'You can't teach an old dog new ___'?", 'tricks', ['words', 'games', 'habits']),
    D(3, "How does the proverb end: 'An ounce of prevention...'?", 'is worth a pound of cure', ['is worth a ton of trouble', 'saves a pound of flesh', 'is worth its weight in gold']),
    D(4, 'Which proverb means that narrowly failing is still failing?', 'A miss is as good as a mile', ['Every little bit helps', 'Patience is a virtue', 'Practice what you preach']),
    D(5, "Complete the simile: 'As merry as a...'?", 'cricket', ['sparrow', 'fiddler', 'sailor']),
  ],
  // day 4
  [
    D(1, 'According to the proverb, what wins the race?', 'Slow and steady', ['Fast and furious', 'Quick and clever', 'Strong and bold']),
    D(2, "How does the proverb end: 'People who live in glass houses...'?", "shouldn't throw stones", ["shouldn't light candles", 'should close the curtains', 'should mind the weather']),
    D(3, "Which simile describes two very close friends: 'As thick as...'?", 'thieves', ['brothers', 'twins', 'neighbors']),
    D(4, "Which proverb means that good deeds, not good looks, show a person's worth?", 'Handsome is as handsome does', ['Clothes make the man', 'Love is blind', 'Practice what you preach']),
    D(5, "Which word completes the saying: 'Comparisons are ___'?", 'odious', ['useless', 'unfair', 'tedious']),
  ],
  // day 5
  [
    D(1, "Complete the simile: 'As blind as a...'?", 'bat', ['cat', 'owl', 'fish']),
    D(2, "Complete the simile: 'As good as...'?", 'gold', ['silver', 'honey', 'bread']),
    D(3, "Which word completes the saying: 'Once bitten, twice ___'?", 'shy', ['wise', 'careful', 'sorry']),
    D(4, "How does the proverb end: 'Penny wise...'?", 'and pound foolish', ['and dollar poor', 'and pocket empty', 'and purse proud']),
    D(5, 'Which proverb warns that small children overhear more than adults realize?', 'Little pitchers have big ears', ['Children should be seen and not heard', 'Out of the mouths of babes', 'Spare the rod and spoil the child']),
  ],
  // day 6
  [
    D(1, "Which word completes the saying: 'Better late than ___'?", 'never', ['sorry', 'early', 'absent']),
    D(2, 'Which proverb means you should make the most of good conditions before they pass?', 'Make hay while the sun shines', ['Waste not, want not', 'Every little bit helps', 'Patience is a virtue']),
    D(3, "How does the proverb end: 'It takes two...'?", 'to tango', ['to tangle', 'to waltz', 'to tie a knot']),
    D(4, "Complete the simile: 'As slow as molasses in...'?", 'January', ['July', 'October', 'a jar']),
    D(5, "Which word completes the saying: 'Good wine needs no ___'?", 'bush', ['bottle', 'cork', 'label']),
  ],
  // day 7
  [
    D(1, "Complete the simile: 'As happy as a...'?", 'clam', ['crab', 'cow', 'fish']),
    D(2, "Which word completes the saying: 'Let sleeping ___ lie'?", 'dogs', ['cats', 'bears', 'lions']),
    D(3, "Which word completes the saying: 'Discretion is the better part of ___'?", 'valor', ['wisdom', 'honor', 'glory']),
    D(4, "How does the proverb end: 'A new broom...'?", 'sweeps clean', ['sweeps wide', 'lasts longest', 'sweeps the floor']),
    D(5, "How does the proverb end: 'One might as well be hanged for a sheep...'?", 'as a lamb', ['as a goat', 'as a fleece', 'as a cow']),
  ],
  // day 8
  [
    D(1, "How does the proverb end: 'Beggars can't be...'?", 'choosers', ['bankers', 'givers', 'winners']),
    D(2, "Which word completes the saying: 'Many hands make ___ work'?", 'light', ['quick', 'short', 'good']),
    D(3, 'Which proverb means that a problem is easier to solve with a partner?', 'Two heads are better than one', ['Clothes make the man', 'Opposites attract', 'Seeing is believing']),
    D(4, "How does the proverb end: 'One man's meat...'?", "is another man's poison", ["is another man's bread", "is another man's treasure", "feeds another man's dog"]),
    D(5, "Complete the simile: 'As mad as a wet...'?", 'hen', ['dog', 'duck', 'goose']),
  ],
  // day 9
  [
    D(1, "Which word completes the saying: 'Time ___ all wounds'?", 'heals', ['opens', 'closes', 'hides']),
    D(2, 'According to the proverb, what is next to godliness?', 'Cleanliness', ['Kindness', 'Patience', 'Charity']),
    D(3, "Complete the simile: 'As mad as a...'?", 'hatter', ['tailor', 'baker', 'miller']),
    D(4, "How does the proverb end: 'Forewarned...'?", 'is forearmed', ['is forgiven', 'is fortunate', 'is foretold']),
    D(5, "Which word completes the saying: 'Self-praise is no ___'?", 'recommendation', ['virtue', 'reward', 'compliment']),
  ],
  // day 10
  [
    D(1, "How does the proverb end: 'The pen is mightier...'?", 'than the sword', ['than the tongue', 'than the crown', 'than the spear']),
    D(2, 'According to the proverb, what do birds of a feather do?', 'Flock together', ['Fly south', 'Sing together', 'Nest apart']),
    D(3, "Which word completes the saying: 'Hope springs ___'?", 'eternal', ['anew', 'early', 'upward']),
    D(4, "Complete the simile: 'As naked as a...'?", 'jaybird', ['blackbird', 'bluebird', 'mockingbird']),
    D(5, "Complete the simile: 'As nervous as a long-tailed cat in a room full of...'?", 'rocking chairs', ['mousetraps', 'dogs', 'rocking horses']),
  ],
  // day 11
  [
    D(1, "How does the proverb end: 'A bird in the hand is worth...'?", 'two in the bush', ['three in the tree', 'one in the nest', 'two in the sky']),
    D(2, 'Which proverb means that a careless spender is quickly left broke?', 'A fool and his money are soon parted', ['Time is money', 'Every man has his price', 'Home is where the heart is']),
    D(3, "Complete the simile: 'As sober as a...'?", 'judge', ['priest', 'monk', 'nun']),
    D(4, 'According to the proverb, what is better than none?', 'Half a loaf', ['A crust of bread', 'Half a cake', 'A little luck']),
    D(5, "Which word completes the saying: 'The mills of God grind ___'?", 'slowly', ['loudly', 'quickly', 'silently']),
  ],
  // day 12
  [
    D(1, 'According to the proverb, what is the best policy?', 'Honesty', ['Patience', 'Kindness', 'Silence']),
    D(2, "How does the proverb end: 'You can't have your cake...'?", 'and eat it too', ['and share it too', 'without the frosting', 'and save it too']),
    D(3, "How does the proverb end: 'Lightning never strikes...'?", 'twice in the same place', ['the same tree', 'without thunder', 'a moving target']),
    D(4, "Which word completes the saying: 'One swallow does not make a ___'?", 'summer', ['song', 'nest', 'flock']),
    D(5, "Complete the simile: 'As deaf as a...'?", 'post', ['pillar', 'brick', 'beam']),
  ],
  // day 13
  [
    D(1, "Which word completes the saying: 'The grass is always ___ on the other side of the fence'?", 'greener', ['taller', 'softer', 'thicker']),
    D(2, "Complete the simile: 'As fit as a...'?", 'fiddle', ['drum', 'bell', 'trumpet']),
    D(3, 'According to the proverb, what do still waters do?', 'Run deep', ['Run cold', 'Stand clear', 'Hide stones']),
    D(4, "How does the proverb end: 'Least said...'?", 'soonest mended', ['quickest forgotten', 'safest kept', 'soonest healed']),
    D(5, "How does the proverb end: 'Hope deferred...'?", 'makes the heart sick', ['makes the spirit strong', 'is hope denied', 'breaks the will']),
  ],
  // day 14
  [
    D(1, "Which word completes the saying: 'Two wrongs don't make a ___'?", 'right', ['difference', 'friend', 'promise']),
    D(2, 'According to the proverb, what gets the grease?', 'The squeaky wheel', ['The rusty hinge', 'The loudest engine', 'The oldest cart']),
    D(3, "Complete the simile: 'As clean as a...'?", 'whistle', ['whisker', 'window', 'plate']),
    D(4, 'Which proverb means that even a misfortune usually benefits someone?', "It's an ill wind that blows nobody any good", ['Every man has his price', 'Seeing is believing', 'Patience is a virtue']),
    D(5, "How does the proverb end: 'A soft answer...'?", 'turns away wrath', ['wins the argument', 'cools the soup', 'calms the sea']),
  ],
  // day 15
  [
    D(1, "Which word completes the saying: 'Absence makes the heart grow ___'?", 'fonder', ['stronger', 'colder', 'wiser']),
    D(2, "Which word completes the saying: 'A watched ___ never boils'?", 'pot', ['pan', 'cup', 'stew']),
    D(3, "Complete the simile: 'As neat as a...'?", 'pin', ['nail', 'bow', 'kitten']),
    D(4, 'Which proverb means that whoever pays for something gets to decide how it is done?', 'He who pays the piper calls the tune', ['Every man has his price', 'Time is money', 'Clothes make the man']),
    D(5, "How does the proverb end: 'Necessity knows...'?", 'no law', ['no limit', 'no mercy', 'no master']),
  ],
  // day 16
  [
    D(1, "Complete the simile: 'As quiet as a...'?", 'mouse', ['cat', 'owl', 'rabbit']),
    D(2, "Complete the simile: 'As dead as a...'?", 'doornail', ['doorstop', 'hinge', 'tombstone']),
    D(3, "How does the proverb end: 'A penny saved...'?", 'is a penny earned', ['is a penny spent', 'is a dollar earned', 'is a lesson learned']),
    D(4, "Which word completes the saying: 'There's many a slip twixt the cup and the ___'?", 'lip', ['saucer', 'table', 'spoon']),
    D(5, "Which word completes the saying: 'Set a beggar on horseback and he'll ride to the ___'?", 'devil', ['castle', 'market', 'city']),
  ],
  // day 17
  [
    D(1, "Which word completes the saying: 'Laughter is the best ___'?", 'medicine', ['policy', 'gift', 'teacher']),
    D(2, 'According to the proverb, what is the spice of life?', 'Variety', ['Laughter', 'Adventure', 'Love']),
    D(3, 'Which proverb means that people judge you by those you spend time with?', 'A man is known by the company he keeps', ['Clothes make the man', 'No man is an island', 'Every man has his price']),
    D(4, "Complete the simile: 'As phony as a...'?", 'three-dollar bill', ['paper crown', 'plastic flower', 'cardboard box']),
    D(5, "How does the proverb end: 'If wishes were horses...'?", 'beggars would ride', ['kings would walk', 'fools would gallop', 'we would all be riders']),
  ],
  // day 18
  [
    D(1, "Which word completes the saying: 'Don't count your ___ before they hatch'?", 'chickens', ['ducks', 'geese', 'turkeys']),
    D(2, "Complete the simile: 'As snug as a bug in a...'?", 'rug', ['mug', 'jug', 'hug']),
    D(3, 'According to the proverb, what do great oaks grow from?', 'Little acorns', ['Deep roots', 'Tall saplings', 'Old stumps']),
    D(4, "How does the proverb end: 'In for a penny...'?", 'in for a pound', ['in for a dollar', 'out for a shilling', 'in for a dime']),
    D(5, "How does the proverb end: 'The perfect is the enemy...'?", 'of the good', ['of the bold', 'of the wise', 'of the patient']),
  ],
  // day 19
  [
    D(1, 'Which proverb means that people soon forget what they no longer see?', 'Out of sight, out of mind', ['Ignorance is bliss', 'Silence is golden', 'Seeing is believing']),
    D(2, "Which word completes the saying: 'Don't look a gift ___ in the mouth'?", 'horse', ['dog', 'cow', 'mule']),
    D(3, "Which word completes the saying: 'Fools rush in where ___ fear to tread'?", 'angels', ['kings', 'giants', 'soldiers']),
    D(4, "Complete the simile: 'As regular as...'?", 'clockwork', ['a metronome', 'the mailman', 'a calendar']),
    D(5, "How does the proverb end: 'Don't teach your grandmother...'?", 'to suck eggs', ['to knit', 'to boil water', 'to bake bread']),
  ],
  // day 20
  [
    D(1, "How does the proverb end: 'Don't put all your eggs...'?", 'in one basket', ['in one pan', 'on one plate', 'in the nest']),
    D(2, "Which word completes the saying: 'Where there's a will, there's a ___'?", 'way', ['wish', 'road', 'lawyer']),
    D(3, 'Which proverb means that what is gained without effort is lost just as lightly?', 'Easy come, easy go', ['Time is money', 'Waste not, want not', 'Every little bit helps']),
    D(4, 'According to the proverb, what is the thief of time?', 'Procrastination', ['Idleness', 'Distraction', 'Sleep']),
    D(5, "Complete the simile: 'As ugly as a mud...'?", 'fence', ['puddle', 'pie', 'hut']),
  ],
  // day 21
  [
    D(1, "How does the proverb end: 'Where there's smoke...'?", "there's fire", ["there's ash", "there's heat", "there's a chimney"]),
    D(2, 'Which proverb means that a small fix done early prevents bigger work later?', 'A stitch in time saves nine', ['Every little bit helps', 'Practice what you preach', 'Patience is a virtue']),
    D(3, "Complete the simile: 'As right as...'?", 'rain', ['day', 'time', 'gold']),
    D(4, 'According to the proverb, what will a drowning man clutch at?', 'A straw', ['A rope', 'A branch', 'A plank']),
    D(5, "Which word completes the saying: 'Every ___ has his Jill'?", 'Jack', ['John', 'Tom', 'Will']),
  ],
  // day 22
  [
    D(1, "Complete the simile: 'As busy as a...'?", 'bee', ['bird', 'cat', 'squirrel']),
    D(2, "How does the proverb end: 'A picture is worth...'?", 'a thousand words', ['a hundred stories', 'a million dollars', 'a thousand pictures']),
    D(3, "Which word completes the saying: 'The devil is in the ___'?", 'details', ['corners', 'shadows', 'margins']),
    D(4, "How does the proverb end: 'There's no fool...'?", 'like an old fool', ['like a young fool', 'like a proud fool', 'like a rich fool']),
    D(5, 'According to the proverb, what is the best sauce?', 'Hunger', ['Patience', 'Butter', 'Laughter']),
  ],
  // day 23
  [
    D(1, "Complete the simile: 'As cool as a...'?", 'cucumber', ['breeze', 'penguin', 'pickle']),
    D(2, "Which word completes the saying: 'Misery loves ___'?", 'company', ['silence', 'sympathy', 'rain']),
    D(3, "How does the proverb end: 'Good fences...'?", 'make good neighbors', ['keep good cattle', 'make strong houses', 'last for years']),
    D(4, "Which word completes the saying: 'Feed a cold, starve a ___'?", 'fever', ['flu', 'cough', 'chill']),
    D(5, 'According to the proverb, what lies at the bottom of a well?', 'Truth', ['Gold', 'Wishes', 'Silence']),
  ],
  // day 24
  [
    D(1, "Complete the simile: 'As stubborn as a...'?", 'mule', ['goat', 'sheep', 'cat']),
    D(2, 'Which proverb means that children tend to turn out like their parents?', "The apple doesn't fall far from the tree", ['Home is where the heart is', 'Spare the rod and spoil the child', 'Children should be seen and not heard']),
    D(3, "How does the proverb end: 'Nothing ventured...'?", 'nothing gained', ['nothing lost', 'nothing learned', 'nothing risked']),
    D(4, "Which word completes the saying: 'Little strokes fell great ___'?", 'oaks', ['trees', 'walls', 'men']),
    D(5, "How does the proverb end: 'Man proposes...'?", 'God disposes', ['woman decides', 'fate opposes', 'time reveals']),
  ],
  // day 25
  [
    D(1, 'Which proverb means you should think carefully before you act?', 'Look before you leap', ['He who hesitates is lost', 'Fortune favors the bold', 'Time is money']),
    D(2, "How does the proverb end: 'You can lead a horse to water...'?", "but you can't make it drink", ["but you can't make it swim", 'but it may not be thirsty', 'but it will find its own way']),
    D(3, "How does the proverb end: 'What can't be cured...'?", 'must be endured', ['must be forgotten', 'must be hidden', 'must be ignored']),
    D(4, "Complete the simile: 'As sound as a...'?", 'dollar', ['nickel', 'penny', 'bank']),
    D(5, "Which word completes the saying: 'You can't make a silk purse out of a sow's ___'?", 'ear', ['hide', 'tail', 'snout']),
  ],
  // day 26
  [
    D(1, "How does the proverb end: 'When in Rome...'?", 'do as the Romans do', ['do as you please', 'see the Colosseum', 'speak as the Romans speak']),
    D(2, "Which word completes the saying: 'There's no place like ___'?", 'home', ['heaven', 'school', 'Paris']),
    D(3, "How does the proverb end: 'The road to hell...'?", 'is paved with good intentions', ['is paved with gold', 'is lined with excuses', 'is shorter than you think']),
    D(4, "Which word completes the saying: 'Fair exchange is no ___'?", 'robbery', ['bargain', 'crime', 'favor']),
    D(5, "Complete the simile: 'As crooked as a dog's...'?", 'hind leg', ['ear', 'collar', 'bone']),
  ],
  // day 27
  [
    D(1, "Which word completes the saying: 'You can't judge a book by its ___'?", 'cover', ['title', 'author', 'spine']),
    D(2, 'Which proverb means that true loyalty shows when someone is in trouble?', 'A friend in need is a friend indeed', ['No man is an island', 'Love is blind', 'Every man has his price']),
    D(3, "How does the proverb end: 'The proof of the pudding...'?", 'is in the eating', ['is in the recipe', 'is in the baking', 'is in the bowl']),
    D(4, "Complete the simile: 'As scarce as hen's...'?", 'teeth', ['eggs', 'feathers', 'nests']),
    D(5, "Which word completes the saying: 'Grasp all, ___ all'?", 'lose', ['win', 'risk', 'keep']),
  ],
  // day 28
  [
    D(1, "Complete the simile: 'As light as a...'?", 'feather', ['cloud', 'bubble', 'leaf']),
    D(2, "How does the proverb end: 'Strike while...'?", 'the iron is hot', ['the sun is high', 'the fire is lit', 'the crowd is cheering']),
    D(3, "Which word completes the saying: 'Revenge is a dish best served ___'?", 'cold', ['hot', 'alone', 'slowly']),
    D(4, "How does the proverb end: 'The exception...'?", 'proves the rule', ['breaks the rule', 'bends the rule', 'makes the rule']),
    D(5, 'According to the proverb, what should a liar have?', 'A good memory', ['A straight face', 'A quick tongue', 'A long nose']),
  ],
  // day 29
  [
    D(1, 'According to the proverb, what is the mother of invention?', 'Necessity', ['Curiosity', 'Imagination', 'Laziness']),
    D(2, "How does the proverb end: 'When the cat's away...'?", 'the mice will play', ['the dog will bark', 'the birds will sing', 'the mice will hide']),
    D(3, "Complete the simile: 'As dry as a...'?", 'bone', ['stick', 'brick', 'leaf']),
    D(4, "Complete the simile: 'As bold as...'?", 'brass', ['bronze', 'iron', 'copper']),
    D(5, "Which word completes the saying: 'Whom the gods would destroy, they first make ___'?", 'mad', ['rich', 'blind', 'famous']),
  ],
  // day 30
  [
    D(1, 'Which proverb means that rushing a job leads to careless mistakes?', 'Haste makes waste', ['Time is money', 'Waste not, want not', 'Seeing is believing']),
    D(2, "How does the proverb end: 'Too many cooks...'?", 'spoil the broth', ['burn the bread', 'ruin the feast', 'empty the pantry']),
    D(3, "Which word completes the saying: 'Don't put the ___ before the horse'?", 'cart', ['saddle', 'plow', 'rider']),
    D(4, "Which word completes the saying: 'A cat may look at a ___'?", 'king', ['queen', 'mouse', 'dog']),
    D(5, "Complete the simile: 'As busy as a one-armed...'?", 'paperhanger', ['bricklayer', 'barber', 'fiddler']),
  ],
  // day 31
  [
    D(1, "Complete the simile: 'As sly as a...'?", 'fox', ['cat', 'snake', 'crow']),
    D(2, "How does the proverb end: 'All that glitters...'?", 'is not gold', ['is not silver', 'will soon fade', 'is not real']),
    D(3, "How does the proverb end: 'Hell hath no fury...'?", 'like a woman scorned', ['like a man betrayed', 'like a mother wronged', 'like a king deposed']),
    D(4, "Which word completes the saying: 'Physician, heal ___'?", 'thyself', ['the sick', 'thy neighbor', 'the poor']),
    D(5, "Which saying, from a Wordsworth poem, means that a grown person's character is shaped early in life?", 'The child is father of the man', ['Like father, like son', 'Spare the rod and spoil the child', 'Children should be seen and not heard']),
  ],
  // day 32
  [
    D(1, 'According to the proverb, what keeps the doctor away?', 'An apple a day', ['A walk a day', 'An orange a day', 'A nap a day']),
    D(2, "Complete the simile: 'As strong as an...'?", 'ox', ['owl', 'eel', 'emu']),
    D(3, "Which word completes the saying: 'If the ___ fits, wear it'?", 'shoe', ['coat', 'glove', 'crown']),
    D(4, 'Which proverb means that a familiar risk is safer than an unknown one?', "Better the devil you know than the devil you don't", ['Fortune favors the bold', 'Opposites attract', 'He who hesitates is lost']),
    D(5, "How does the proverb end: 'It is a long lane...'?", 'that has no turning', ['that leads nowhere', 'that has no end', 'that has no inn']),
  ],
  // day 33
  [
    D(1, "How does the proverb end: 'Every cloud has...'?", 'a silver lining', ['a golden edge', 'a rainbow behind it', 'a bright side']),
    D(2, "Complete the simile: 'As flat as a...'?", 'pancake', ['tortilla', 'cracker', 'pizza']),
    D(3, 'Which proverb means that knowing someone too well can cost them your respect?', 'Familiarity breeds contempt', ['Opposites attract', 'Love is blind', 'Like father, like son']),
    D(4, "Which word completes the saying: 'Faint heart never won fair ___'?", 'lady', ['prize', 'battle', 'fortune']),
    D(5, 'According to the proverb, what does a cat in gloves catch?', 'No mice', ['No birds', 'No fish', 'Cold paws']),
  ],
  // day 34
  [
    D(1, "Which word completes the saying: 'Actions speak louder than ___'?", 'words', ['thoughts', 'promises', 'voices']),
    D(2, "Complete the simile: 'As old as the...'?", 'hills', ['mountains', 'oceans', 'stars']),
    D(3, "Which word completes the saying: 'Beauty is in the eye of the ___'?", 'beholder', ['artist', 'lover', 'storm']),
    D(4, 'According to the proverb, what should you never change in midstream?', 'Horses', ['Boats', 'Oars', 'Saddles']),
    D(5, "How does the proverb end: 'He who sups with the devil...'?", 'should have a long spoon', ['should count his teeth', 'will pay the bill', 'should sit by the door']),
  ],
  // day 35
  [
    D(1, "How does the proverb end: 'Curiosity killed...'?", 'the cat', ['the dog', 'the fox', 'the crow']),
    D(2, "Which word completes the saying: 'The bigger they are, the harder they ___'?", 'fall', ['fight', 'work', 'swing']),
    D(3, 'Which proverb means that generosity should start with your own family?', 'Charity begins at home', ['Home is where the heart is', 'No man is an island', 'Love is blind']),
    D(4, "Complete the simile: 'As thin as a...'?", 'rail', ['ribbon', 'spoon', 'ladder']),
    D(5, 'According to the proverb, what does the cowl not make?', 'The monk', ['The priest', 'The saint', 'The bishop']),
  ],
  // day 36
  [
    D(1, "How does the proverb end: 'Rome wasn't built...'?", 'in a day', ['in a week', 'by one man', 'without stone']),
    D(2, "Complete the simile: 'As proud as a...'?", 'peacock', ['lion', 'rooster', 'swan']),
    D(3, "How does the proverb end: 'Give him an inch...'?", "and he'll take a mile", ["and he'll want a foot", "and he'll ask for two", "and he'll take the ruler"]),
    D(4, "Which word completes the saying: 'What's good for the goose is good for the ___'?", 'gander', ['gosling', 'duck', 'swan']),
    D(5, 'According to the proverb, what do ill weeds do?', 'Grow apace', ['Choke the roses', 'Bloom in winter', 'Spread at night']),
  ],
];
