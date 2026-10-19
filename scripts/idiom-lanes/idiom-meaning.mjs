// Idiom (English Gauntlet), lane 'What It Means'. 36 days x 5 tiers (tier 1 gimme .. tier 5 expert).
// What an idiom or set phrase means. From tier 3 up, also foreign phrases used in
// English and older or regional idioms. No proverbs, no similes, no origins (the
// other Idiom lane, 'Finish the Saying', has proverbs and similes). One choice in
// each set is the literal reading of the phrase.
const L = 'What It Means';
const D = (t, q, a, d) => ({ c: L, t, q, a, d });

export const LANE_DAYS = [
  // day 1
  [
    D(1, "What does it mean if a task is 'a piece of cake'?", "It is very easy to do", ["It is a slice of dessert", "It is a small part of a bigger job", "It is a reward for hard work"]),
    D(2, "If a builder 'cuts corners', what does he do?", "Does the job cheaply or carelessly", ["Trims the edges off the boards", "Finishes well ahead of schedule", "Spends more money than needed"]),
    D(3, "If you get 'the lion's share' of something, what do you get?", "The largest part of it", ["The portion fed to a big cat", "A small, fair portion", "The part nobody else wanted"]),
    D(4, "If a new recruit 'can't cut the mustard', what is true?", "He isn't good enough for the job", ["He can't cook a simple meal", "He refuses to follow orders", "He isn't brave enough to fight"]),
    D(5, "If a critic calls a book 'sui generis', what does she mean?", "It is one of a kind", ["It is a copy of another", "It is written for children", "It belongs to a popular genre"]),
  ],
  // day 2
  [
    D(1, "At a party, what does it mean to 'break the ice'?", "Ease the awkwardness between strangers", ["Crack the ice cubes for drinks", "Leave before everyone else", "Start an argument on purpose"]),
    D(2, "What does it mean to 'let off steam'?", "Release pent-up anger or energy", ["Open the valve on a kettle", "Lose your temper at a friend", "Calm down and fall asleep"]),
    D(3, "What is 'a white elephant'?", "A costly possession that is of little use", ["A rare albino animal", "A gift that brings good luck", "A big secret that everyone knows"]),
    D(4, "What is a 'non sequitur'?", "A remark that doesn't follow logically", ["A follow-up question in a debate", "A statement that repeats itself", "An argument with no flaws"]),
    D(5, "If a schemer is 'hoist with his own petard', what has happened?", "His own plot has backfired on him", ["He has been lifted up by a crane", "He has been rewarded for his scheme", "He has escaped without punishment"]),
  ],
  // day 3
  [
    D(1, "If you are feeling 'under the weather', how are you feeling?", "Slightly ill or unwell", ["Soaked from a sudden storm", "Angry about a small problem", "Too tired to get out of bed"]),
    D(2, "If a company 'jumps the gun' on an announcement, what has it done?", "Acted before the right time", ["Leaped over a weapon", "Made it louder than needed", "Delayed it for far too long"]),
    D(3, "At a dinner party, what is a 'faux pas'?", "An embarrassing social blunder", ["A misstep in a dance", "A polite toast to the host", "A small after-dinner gift"]),
    D(4, "What does it mean to 'buy a pig in a poke'?", "Buy something without inspecting it first", ["Buy a farm animal in a sack", "Pay a fair price for food", "Buy something you already own"]),
    D(5, "What does it mean to 'beard the lion in his den'?", "Confront someone formidable on their own turf", ["Shave a big cat at the zoo", "Hide from a powerful enemy", "Flatter a boss in his office"]),
  ],
  // day 4
  [
    D(1, "What does it mean to 'spill the beans'?", "Give away a secret", ["Knock over a pot of food", "Waste money on small things", "Make a mess of a simple job"]),
    D(2, "What is 'the elephant in the room'?", "An obvious problem nobody wants to discuss", ["A large animal kept indoors", "The most important guest present", "A secret that only one person knows"]),
    D(3, "If a parent tells you to 'mind your p's and q's', what should you do?", "Watch your manners and behavior", ["Practice writing your letters", "Keep careful track of your money", "Stop asking so many questions"]),
    D(4, "What does it mean to 'tilt at windmills'?", "Fight enemies that are imaginary", ["Lean against a strong wind", "Work hard on a farm", "Give up before even trying"]),
    D(5, "If something is a 'sine qua non' for success, it is...?", "An absolutely essential condition", ["A nice but optional extra", "A major obstacle to overcome", "A lucky accident"]),
  ],
  // day 5
  [
    D(1, "If a new car 'costs an arm and a leg', it is...?", "Extremely expensive to buy", ["Likely to cause a serious injury", "A real bargain for the price", "Paid off in small monthly amounts"]),
    D(2, "If you are 'barking up the wrong tree', what are you doing?", "Seeking answers in a mistaken place", ["Howling at the base of a tree", "Making too much noise in public", "Climbing higher than is safe"]),
    D(3, "In a mystery novel, what is 'a red herring'?", "A false clue that distracts from the truth", ["A smoked fish served at dinner", "The key piece of evidence", "The detective's lucky guess"]),
    D(4, "If a decision is presented as 'a fait accompli', what is true?", "It is already done and can't be undone", ["It is still open for debate", "It is a mistake that needs fixing", "It is a proposal put to a vote"]),
    D(5, "If you face 'Hobson's choice', what are you offered?", "No real choice, just one option", ["Two equally good options", "A choice made for you by a judge", "A free choice of anything at all"]),
  ],
  // day 6
  [
    D(1, "When someone says they are going to 'hit the sack', what are they going to do?", "Go to bed for the night", ["Punch a heavy bag at the gym", "Quit their job right away", "Pack their bags for a trip"]),
    D(2, "When a bully 'gets a taste of his own medicine', what happens?", "He is treated the way he treats others", ["He is forced to swallow his pills", "He is sent to see a doctor", "He is finally forgiven by everyone"]),
    D(3, "If you experience 'deja vu', what do you feel?", "That you have lived this moment before", ["That you are seeing something brand new", "That you are about to faint", "That you can predict the future"]),
    D(4, "If a household is 'at sixes and sevens', it is...?", "In a state of confusion", ["Divided into two teams", "Counting down to an event", "Running exactly on schedule"]),
    D(5, "What is 'a sword of Damocles' hanging over someone?", "A constant threat of looming disaster", ["A medal for great bravery", "A blade hung above a chair", "A secret that protects them"]),
  ],
  // day 7
  [
    D(1, "Something that happens 'once in a blue moon' happens how often?", "Very rarely, hardly ever", ["Only on nights when the moon is full", "About once every month", "Every single evening"]),
    D(2, "If you 'burn the midnight oil', what are you doing?", "Working or studying late into the night", ["Lighting an old oil lamp", "Wasting money on fuel", "Waking up very early"]),
    D(3, "If winning an award is 'a feather in your cap', it is...?", "An achievement to be proud of", ["A decoration for a hat", "A small, meaningless prize", "A reason to feel embarrassed"]),
    D(4, "What is 'the hair of the dog'?", "A drink taken to cure a hangover", ["A strand of fur on your clothes", "A small sign of trouble ahead", "A bite from an angry animal"]),
    D(5, "What is 'esprit de l'escalier'?", "Thinking of the perfect reply too late", ["A cheerful mood after climbing stairs", "A quick, witty comeback on the spot", "A fear of speaking in public"]),
  ],
  // day 8
  [
    D(1, "Why would an actor be told to 'break a leg' before a show?", "To wish them good luck", ["To hope they get hurt on stage", "To tell them to leave quickly", "To ask them to dance harder"]),
    D(2, "What does it mean to 'turn a blind eye' to a problem?", "Pretend not to notice it", ["Close one eye to see better", "Lose your sight because of it", "Report it to the authorities"]),
    D(3, "Who is 'a wolf in sheep's clothing'?", "A dangerous person who seems harmless", ["A wild animal in disguise", "A leader who follows the crowd", "A loner who dislikes company"]),
    D(4, "If an actor says a line 'sotto voce', how is it said?", "Quietly, under one's breath", ["In a loud, booming shout", "In a strong foreign accent", "In a high singing tone"]),
    D(5, "To 'cut the Gordian knot' is to do what?", "Solve a tangled problem with bold action", ["Slice through a knotted rope", "Untangle a problem slowly, step by step", "Avoid a hard problem entirely"]),
  ],
  // day 9
  [
    D(1, "If a thief is 'caught red-handed', what is true?", "Discovered in the middle of the crime", ["His hands were stained with paint", "He confessed to the police", "He got away without a trace"]),
    D(2, "If you 'bite off more than you can chew', what have you done?", "Taken on more than you can handle", ["Stuffed too much food in your mouth", "Spoken rudely to someone older", "Asked for more pay than you deserve"]),
    D(3, "When people want to keep 'the status quo', what do they want?", "Things to stay as they are", ["Things to change quickly", "A higher social standing", "A vote on the matter"]),
    D(4, "What is 'a busman's holiday'?", "Free time spent doing your usual work", ["A long trip on a bus tour", "A day off with full pay", "A short break between shifts"]),
    D(5, "If coworkers 'send someone to Coventry', what do they do?", "Refuse to speak to them", ["Ship them off to an English city", "Give them all the worst jobs", "Report them to the boss"]),
  ],
  // day 10
  [
    D(1, "If a voter is 'on the fence' about a choice, what are they?", "Unable to make up their mind", ["Sitting on a wooden railing", "Strongly against the idea", "Refusing to vote at all"]),
    D(2, "If a coworker 'steals your thunder', what has happened?", "They took the attention you deserved", ["They made a loud noise during your talk", "They borrowed your idea with permission", "They praised you in front of the boss"]),
    D(3, "What is a person's 'Achilles heel'?", "A weak point that can bring them down", ["An old injury to the foot", "Their greatest hidden talent", "A habit of running away"]),
    D(4, "If one company 'steals a march on' another, what does it do?", "Gains an edge by acting first", ["Takes over its parade route", "Copies its products exactly", "Hires away its best workers"]),
    D(5, "What is 'Weltschmerz'?", "Sadness at the state of the world", ["A thirst for world travel", "Pain in the joints from age", "Joy in the beauty of nature"]),
  ],
  // day 11
  [
    D(1, "If you are 'over the moon' about some news, how do you feel?", "Absolutely thrilled and delighted", ["Floating high above the earth", "Confused about what it means", "Calm and not very surprised"]),
    D(2, "If a few complaints are only 'the tip of the iceberg', what are they?", "A small part of a bigger problem", ["The very top of a block of ice", "The most important part of it", "Nothing to worry about at all"]),
    D(3, "A pop star who is 'a flash in the pan' is...?", "A brief success that quickly fades", ["A spark from a frying pan", "A star with lasting fame", "A sudden overnight scandal"]),
    D(4, "When a politician offers a 'mea culpa', what is she offering?", "An admission that she was wrong", ["A formal word of thanks", "A promise to try harder", "A denial of all blame"]),
    D(5, "What does it mean to 'kick against the pricks'?", "Resist uselessly, hurting only yourself", ["Step barefoot on thorns", "Stand up to bullies and win", "Complain about petty rules"]),
  ],
  // day 12
  [
    D(1, "A groom who 'gets cold feet' before the wedding has done what?", "Lost his nerve about going ahead", ["Felt a chill in his toes", "Argued with the best man", "Shown up late to the church"]),
    D(2, "What does it mean to 'add insult to injury'?", "Make a bad situation even worse", ["Apologize after causing harm", "Treat a wound with ointment", "Blame someone for your own mistake"]),
    D(3, "If an offer is 'bona fide', it is...?", "Genuine and made in good faith", ["Fake and likely a scam", "Good only for a short time", "Made by a famous person"]),
    D(4, "If you are left to 'cool your heels' in a lobby, what are you doing?", "Being kept waiting for some time", ["Soaking your sore feet", "Storming out in a temper", "Hiding from someone important"]),
    D(5, "If a project is left to 'hang fire', what happens to it?", "It is delayed and put on hold", ["It is shut down in anger", "It is set ablaze", "It moves ahead at full speed"]),
  ],
  // day 13
  [
    D(1, "What does it mean to 'bite the bullet'?", "Face something unpleasant with courage", ["Chew on a piece of ammunition", "Refuse to admit a mistake", "Speak before thinking it through"]),
    D(2, "What does it mean to 'cry wolf'?", "Raise a false alarm", ["Howl like a wild animal", "Admit that you are afraid", "Warn of a real danger"]),
    D(3, "In a business deal, what is 'a Trojan horse'?", "Something harmless-looking that undermines from within", ["A large wooden statue", "A generous gift with no strings", "A rival that attacks openly"]),
    D(4, "If fans are 'on tenterhooks' before a verdict, they are...?", "Anxious and in suspense", ["Hanging from sharp hooks", "Bored and losing interest", "Angry and ready to riot"]),
    D(5, "Who is an 'eminence grise'?", "A hidden power behind the throne", ["A respected gray-haired elder", "A retired head of state", "A famous painter's patron"]),
  ],
  // day 14
  [
    D(1, "If skills like yours are 'a dime a dozen', they are...?", "Common and not worth much", ["Sold at ten cents for twelve", "Rare and highly valued", "Useful only in small doses"]),
    D(2, "A search that turns out to be 'a wild goose chase' is...?", "A pointless search that leads nowhere", ["A hunt for birds in the woods", "A fast race against the clock", "A search that ends in a surprise"]),
    D(3, "If you 'see the writing on the wall', what do you notice?", "Clear signs that trouble is coming", ["Graffiti on a city building", "Rules posted for everyone", "A message from an old friend"]),
    D(4, "A diplomat declared 'persona non grata' is...?", "No longer welcome in the country", ["Given a special honor", "Promoted to ambassador", "Granted legal immunity"]),
    D(5, "What is 'a curate's egg'?", "Something that is partly good, partly bad", ["A gift from a clergyman", "Something perfect in every way", "A rare and costly treasure"]),
  ],
  // day 15
  [
    D(1, "When it is 'raining cats and dogs', what is the weather doing?", "Pouring down very heavily", ["Dropping animals from the sky", "Drizzling on and off", "Thundering with no rain at all"]),
    D(2, "If you 'burn your bridges' with an employer, what have you done?", "Ruined the relationship for good", ["Set fire to a crossing", "Asked for a raise too soon", "Left on very friendly terms"]),
    D(3, "What attitude does 'carpe diem' urge?", "Make the most of the present", ["Plan carefully for the future", "Learn from the mistakes of the past", "Wait patiently for good things"]),
    D(4, "If a family is living 'high on the hog', how are they living?", "In luxury, with plenty of money", ["On a farm raising pigs", "On the top floor of a building", "In fear of losing everything"]),
    D(5, "In old American slang, what does it mean to 'put on the dog'?", "Make a flashy show of wealth", ["Dress up a pet in clothes", "Act grumpy and rude", "Work like a tireless laborer"]),
  ],
  // day 16
  [
    D(1, "If someone tells you 'the ball is in your court', what do they mean?", "It is now your turn to act", ["You are holding the tennis ball", "You have lost the argument", "You should stay out of it"]),
    D(2, "A new hire who 'hits the ground running' does what?", "Starts quickly and with energy", ["Falls down on the first day", "Jogs to the office each morning", "Makes a lot of early mistakes"]),
    D(3, "In an election, who is 'a dark horse'?", "A little-known contender who may win", ["A black horse in a race", "The heavy favorite to win", "A candidate with a shady past"]),
    D(4, "If someone is 'three sheets to the wind', what is true of them?", "They are quite drunk", ["They are sailing in a storm", "They are completely exhausted", "They are hopelessly lost"]),
    D(5, "If a writer has an 'idee fixe', what does he have?", "An obsession he cannot shake", ["A fixed weekly routine", "A clever but simple plot", "A firm deadline to meet"]),
  ],
  // day 17
  [
    D(1, "What does it mean to 'throw in the towel'?", "Give up and admit defeat", ["Toss laundry into a hamper", "Clean up after someone else", "Offer to help with chores"]),
    D(2, "If you 'missed the boat' on a deal, what happened?", "You lost your chance at it", ["You arrived too late for a ferry", "You paid too much for it", "You made a lot of money"]),
    D(3, "When managers 'pass the buck', what do they do?", "Shift the blame to someone else", ["Hand over a dollar bill", "Share the profits fairly", "Take full responsibility"]),
    D(4, "What does the warning 'caveat emptor' tell a shopper?", "The buyer takes the risk", ["The seller guarantees quality", "Prices may change without notice", "Pay in cash only"]),
    D(5, "If a guest leaves 'in high dudgeon', how does he leave?", "In a state of angry resentment", ["In a great hurry", "In high spirits", "In fancy formal dress"]),
  ],
  // day 18
  [
    D(1, "If your friend says it is time to 'hit the road', what do they want to do?", "Leave and get going", ["Strike the pavement with a hand", "Repair a pothole outside", "Take a nap before driving"]),
    D(2, "If an employee is 'on thin ice', what is true?", "They are in a risky position", ["They are skating on a frozen pond", "They are about to be promoted", "They are feeling quite nervous"]),
    D(3, "What is 'a quid pro quo'?", "A favor given in exchange for another", ["A gift given with no strings", "A fine paid for a mistake", "A formal written apology"]),
    D(4, "When a Brit finishes explaining a task with 'and Bob's your uncle', what is meant?", "And there you have it, done", ["And a relative will help you", "And then you ask for help", "And you will need to start again"]),
    D(5, "What does it mean to 'nail your colors to the mast'?", "Commit openly to a position", ["Hang a flag on a ship", "Change sides when it suits you", "Keep your views private"]),
  ],
  // day 19
  [
    D(1, "If someone is 'pulling your leg', what are they doing?", "Teasing you with a playful lie", ["Tugging on your limb", "Asking you for a big favor", "Tripping you on purpose"]),
    D(2, "If a donation is 'a drop in the bucket', it is...?", "Too small to make a difference", ["A spill into a pail", "The final amount needed", "A generous and helpful gift"]),
    D(3, "If a bakery gives you 'a baker's dozen', how many do you get?", "Thirteen, one more than twelve", ["Exactly twelve, no more", "Ten, a nice round number", "As many as you can carry"]),
    D(4, "If two council members are 'at loggerheads', what is true?", "They are in fierce disagreement", ["They are cutting logs together", "They are close political allies", "They are tied in a vote"]),
    D(5, "When a government does 'a volte-face', what does it do?", "Completely reverses its position", ["Holds a surprise election", "Doubles down on a policy", "Quietly ignores a problem"]),
  ],
  // day 20
  [
    D(1, "At five o'clock the team decides to 'call it a day'. What do they do?", "Stop working for now", ["Name the date of a meeting", "Plan the next day's tasks", "Start a long overtime shift"]),
    D(2, "If you 'take a rain check' on dinner, what are you saying?", "Not now, but maybe another time", ["You will come only if it rains", "You will pay for the meal", "You never want to go again"]),
    D(3, "If you 'pay through the nose' for tickets, what do you do?", "Pay far more than they are worth", ["Pay while holding your nose", "Pay a fair, reasonable price", "Pay someone else to buy them"]),
    D(4, "If your boss gives you 'carte blanche', what do you get?", "Complete freedom to act as you wish", ["A blank card to sign", "A strict list of rules", "A small cash bonus"]),
    D(5, "In old usage, what did it mean to 'show the white feather'?", "To act like a coward", ["To display a hat decoration", "To wave a flag of truce", "To prove that you were honest"]),
  ],
  // day 21
  [
    D(1, "If you are 'in hot water' with your boss, you are...?", "In serious trouble", ["Taking a long warm bath", "Feeling very embarrassed", "Due for a pay raise"]),
    D(2, "What does it mean to 'pull strings' to get a job?", "Use your influence or connections", ["Tug on a puppet's cords", "Work hard to earn it fairly", "Apply for many jobs at once"]),
    D(3, "What do you feel if you feel 'schadenfreude'?", "Joy at someone else's misfortune", ["Sorrow at someone else's pain", "Guilt over your own success", "Fear of being left out"]),
    D(4, "If you sell 'the whole kit and caboodle', what do you sell?", "Everything, the entire lot", ["Just the tools in the kit", "Only the most valuable part", "A set of camping equipment"]),
    D(5, "What is 'a Parthian shot'?", "A cutting remark made while leaving", ["An arrow fired at full gallop", "A lucky shot from far away", "An opening insult in a debate"]),
  ],
  // day 22
  [
    D(1, "When a small problem is 'the last straw', what is it?", "The final annoyance that ends your patience", ["The final drinking straw in the box", "A last-minute chance to fix things", "The least important part of a plan"]),
    D(2, "If you escape 'by the skin of your teeth', how did you escape?", "Just barely, by a narrow margin", ["With a painful mouth injury", "Easily and without any effort", "By lying your way out"]),
    D(3, "If kids are 'champing at the bit' to go outside, they are...?", "Impatient and eager to start", ["Chewing on a horse's bridle", "Too tired to go anywhere", "Scared of the dark outside"]),
    D(4, "If you'll finish a job 'by hook or by crook', how will you finish it?", "By any means at all", ["By fishing and by stealing", "Only by honest methods", "With help from a partner"]),
    D(5, "A soldier who is 'hors de combat' is...?", "Out of action and unable to fight", ["Riding into battle on horseback", "Leading the charge", "Hiding behind enemy lines"]),
  ],
  // day 23
  [
    D(1, "If two partners 'see eye to eye', what do they do?", "Agree with each other completely", ["Stand at exactly the same height", "Stare each other down", "Meet face to face in person"]),
    D(2, "What does it mean to 'face the music'?", "Accept the consequences of your actions", ["Turn toward the band", "Listen closely to a song", "Avoid blame by running away"]),
    D(3, "If your grandmother calls something 'the bee's knees', what does she think of it?", "That it is excellent", ["That it is part of an insect", "That it is busy and noisy", "That it is sweet but useless"]),
    D(4, "What is someone's 'raison d'etre'?", "Their main reason for existing", ["Their excuse for being late", "Their sense of good taste", "Their place of birth"]),
    D(5, "A trader who 'sails close to the wind' is...?", "Taking risks that border on improper", ["Steering a boat into a gale", "Playing it completely safe", "Sticking to a strict budget"]),
  ],
  // day 24
  [
    D(1, "If a friend is 'feeling blue', how are they feeling?", "Sad and low in spirits", ["Cold enough to change color", "Calm and fully relaxed", "Jealous of someone else"]),
    D(2, "If two rivals 'bury the hatchet', what do they do?", "Make peace and end the feud", ["Hide a weapon in the yard", "Agree to meet in secret", "Start a new argument"]),
    D(3, "If a committee is formed 'ad hoc', it is formed...?", "For one specific purpose only", ["To last for many years", "Without anyone's permission", "By a popular vote"]),
    D(4, "If a merger is 'in the offing', it is...?", "Likely to happen soon", ["Out at sea and far away", "Already completed and signed", "Unlikely ever to happen"]),
    D(5, "What does it mean to 'bell the cat'?", "Take on a risky task for others", ["Put a bell on a pet's collar", "Make a big fuss over nothing", "Blame someone weaker than you"]),
  ],
  // day 25
  [
    D(1, "What kind of person is called a 'couch potato'?", "Someone who lazes around watching TV", ["A vegetable kept on the sofa", "Someone who loves to cook dinner", "Someone who naps every afternoon"]),
    D(2, "If someone says 'cut to the chase', what do they want?", "Get to the main point quickly", ["Skip ahead to the action scene", "Stop running from the problem", "Make the story more exciting"]),
    D(3, "What does it mean to 'throw down the gauntlet'?", "Issue a bold challenge", ["Drop a glove on the floor", "Admit defeat in public", "Refuse to fight back"]),
    D(4, "If a supplier has you 'over a barrel', what is true?", "You are at their mercy", ["You are bent over a cask", "You owe them a small favor", "You have the upper hand"]),
    D(5, "If a hotel is called the 'ne plus ultra' of luxury, it is...?", "The very height of excellence", ["A little too fancy", "A poor imitation", "Newly opened and untested"]),
  ],
  // day 26
  [
    D(1, "If you and your neighbors are 'in the same boat', what is true?", "You share the same difficult situation", ["You all went sailing together", "You are rivals for the same prize", "You live on the same street"]),
    D(2, "If a friend tells you to 'keep your chin up', what do they mean?", "Stay cheerful in a hard time", ["Hold your head at a proud angle", "Stop talking back to people", "Be ready to take a punch"]),
    D(3, "If a champion 'rests on her laurels', what does she do?", "Stops trying after past success", ["Naps on a bed of leaves", "Trains harder than ever", "Retires while at the top"]),
    D(4, "If a critic calls a rival his 'bete noire', what is the rival to him?", "Someone he especially dislikes", ["His closest and oldest friend", "A black animal he keeps", "His secret business partner"]),
    D(5, "Who is 'a cat's paw'?", "Someone used as a tool by another", ["A clever and sneaky thief", "A gentle but firm leader", "A small print left on a car"]),
  ],
  // day 27
  [
    D(1, "What does it mean to 'go the extra mile' for a customer?", "Make more effort than expected", ["Drive farther to make a delivery", "Charge extra for the service", "Take the long way around"]),
    D(2, "If you say you will 'play it by ear', what will you do?", "Decide as things happen, without a plan", ["Hold an instrument up to your ear", "Listen carefully before speaking", "Follow the plan to the letter"]),
    D(3, "If the job is 'not difficult per se', what does 'per se' mean?", "By itself, in itself", ["At first glance", "For now, at least", "According to the boss"]),
    D(4, "What is 'a Pyrrhic victory'?", "A win so costly it feels like defeat", ["A win earned by trickery", "A narrow win in overtime", "A win nobody expected"]),
    D(5, "If someone seems 'to the manner born', what is true?", "They seem naturally suited to it", ["They have very good manners", "They were born into poverty", "They act older than they are"]),
  ],
  // day 28
  [
    D(1, "Why would someone tell you to 'hold your horses'?", "To get you to slow down and wait", ["To have you grip the reins tightly", "To ask you to keep a secret", "To make you stop complaining"]),
    D(2, "If a new employee 'rocks the boat', what does he do?", "Stirs up trouble in a settled situation", ["Tips over a small canoe", "Brings fresh energy to the team", "Keeps everyone calm and steady"]),
    D(3, "To 'eat humble pie' means to do what?", "Admit a mistake and apologize", ["Enjoy a plain, simple dessert", "Refuse to apologize", "Brag about your success"]),
    D(4, "What does it mean to 'cross the Rubicon'?", "Pass a point of no return", ["Ford a river in Italy", "Betray a trusted friend", "Change your mind at the last minute"]),
    D(5, "What is a 'pis aller'?", "A last resort when all else fails", ["A first choice made eagerly", "A quick trip out of town", "A clever shortcut to success"]),
  ],
  // day 29
  [
    D(1, "What is 'a blessing in disguise'?", "A setback that turns out to be good", ["A prayer said while wearing a costume", "A gift given in secret", "A compliment that hides an insult"]),
    D(2, "What does 'sour grapes' mean?", "Pretending not to want what you can't have", ["Fruit that has gone bad", "Refusing to share with others", "Complaining about bad service"]),
    D(3, "What is 'a Catch-22'?", "A no-win trap of contradictory rules", ["A great play in baseball", "A lucky break that pays off", "A choice between two good options"]),
    D(4, "If a singer has 'a certain je ne sais quoi', what does she have?", "An appealing quality hard to describe", ["A strong French accent", "A habit of being unsure", "A well-known stage name"]),
    D(5, "If guards are 'on the qui vive', what are they?", "Alert and watchful", ["Lively and cheerful", "Off duty for the night", "Confused and disorganized"]),
  ],
  // day 30
  [
    D(1, "When a couple 'ties the knot', what do they do?", "Get married to each other", ["Fasten a rope on their boat", "Break up for good", "Sign a lease on a home"]),
    D(2, "Someone with 'a chip on their shoulder' has what?", "A lasting grudge or grievance", ["A small wood splinter on their arm", "A great deal of confidence", "A habit of eating snacks"]),
    D(3, "Someone full of 'joie de vivre' has what?", "A cheerful zest for life", ["A great love of fine wine", "A deep fear of growing old", "A habit of speaking French"]),
    D(4, "If someone's behavior is 'beyond the pale', it is...?", "Far outside what is acceptable", ["Too pale to be healthy", "Hard to see or notice", "Unusual but harmless"]),
    D(5, "What is 'a Potemkin village'?", "An impressive front hiding a poor reality", ["A model town built for tourists", "A remote farming community", "A town named after a general"]),
  ],
  // day 31
  [
    D(1, "If a boss says she will 'sleep on it', what does she plan to do?", "Wait a night before deciding", ["Take a nap on top of the papers", "Forget about it entirely", "Decide on the spot"]),
    D(2, "What does it mean to 'kick the bucket'?", "To die or pass away", ["To knock over a pail", "To quit a bad habit", "To lose your temper"]),
    D(3, "If a promise is 'pie in the sky', it is...?", "An unrealistic hope that won't happen", ["A dessert served on a plane", "A small but certain gain", "A plan that is easy to keep"]),
    D(4, "What does it mean to 'carry coals to Newcastle'?", "Supply something where it's already plentiful", ["Deliver fuel to a distant city", "Do hard work for little pay", "Bring bad news to a friend"]),
    D(5, "What does the term 'Realpolitik' describe?", "Politics driven by practical, not moral, aims", ["Politics based on strict honesty", "Government by the common people", "Politics of a royal court"]),
  ],
  // day 32
  [
    D(1, "If a failed plan sends you 'back to square one', where are you?", "Starting over from the beginning", ["On the first space of a board game", "Almost finished with the job", "Stuck with no way forward"]),
    D(2, "If news arrives 'out of the blue', how does it arrive?", "Suddenly and without any warning", ["Straight from the sky above", "Slowly over several weeks", "Through official channels"]),
    D(3, "What is 'a sacred cow'?", "Something held above criticism", ["A farm animal treated as holy", "An old and outdated custom", "A leader who is widely disliked"]),
    D(4, "In a story, what is 'a deus ex machina'?", "An unlikely event that suddenly solves everything", ["A villain who is secretly a robot", "A hero's long-lost twin", "A twist that ruins the ending"]),
    D(5, "What does it mean to 'kick over the traces'?", "Throw off restraint and rebel", ["Knock over a horse's harness", "Cover up the evidence", "Follow the rules exactly"]),
  ],
  // day 33
  [
    D(1, "If you 'hit the nail on the head', what have you done?", "Described something exactly right", ["Hammered a nail in one blow", "Made a painful mistake", "Finished a job too quickly"]),
    D(2, "If you 'walk on eggshells' around your boss, what do you do?", "Act very carefully to avoid upsetting him", ["Tiptoe across broken shells", "Avoid him as much as possible", "Flatter him to win his favor"]),
    D(3, "What is a 'tete-a-tete'?", "A private talk between two people", ["A head-to-head sports match", "A crowded public meeting", "A heated argument in public"]),
    D(4, "If a negotiator is 'in the catbird seat', what is true?", "She is in a commanding position", ["She is sitting up in a tree", "She is about to be fired", "She is watching from the side"]),
    D(5, "What is 'a nine days' wonder'?", "A sensation quickly forgotten", ["A miracle that took nine days", "A lasting work of genius", "A rare natural event"]),
  ],
  // day 34
  [
    D(1, "What does it mean to 'kill two birds with one stone'?", "Get two things done with one action", ["Hunt two birds with a single throw", "Ruin two plans with one mistake", "Do two jobs badly at once"]),
    D(2, "A trainee who is 'learning the ropes' is doing what?", "Finding out how the job works", ["Practicing knots on a sailboat", "Climbing ropes in gym class", "Getting into trouble at work"]),
    D(3, "If a comment was made 'tongue in cheek', it was...?", "Said as a joke, not seriously", ["Mumbled with a full mouth", "Spoken in anger", "Meant as a strong warning"]),
    D(4, "When a buyer says 'let's talk turkey', what does he want?", "To speak frankly about the deal", ["To plan a holiday dinner", "To make small talk first", "To delay the discussion"]),
    D(5, "What is someone's 'amour propre'?", "Their self-esteem and pride", ["Their proper romantic partner", "Their love of good manners", "Their devotion to their country"]),
  ],
  // day 35
  [
    D(1, "If someone says something will happen 'when pigs fly', what do they mean?", "It will never, ever happen", ["It will happen once farm animals take off", "It will happen by springtime", "It will happen very suddenly"]),
    D(2, "What is 'red tape'?", "Slow, excessive official paperwork", ["Colored tape for sealing boxes", "A warning sign at a crime scene", "A strict deadline for a project"]),
    D(3, "What is 'a fly in the ointment'?", "A small flaw that spoils something", ["An insect stuck in a cream", "A quick and easy cure", "A rival who wants to win"]),
    D(4, "A pilot who shows 'sang-froid' in a crisis shows what?", "Cool calm under pressure", ["Cold sweat and panic", "Hot-headed anger", "Deep sadness and regret"]),
    D(5, "What does it mean to 'gild the lily'?", "Add needless decoration to something fine", ["Paint a flower gold", "Praise someone who doesn't deserve it", "Hide a flaw with a cover-up"]),
  ],
  // day 36
  [
    D(1, "What does it mean to 'beat around the bush'?", "Avoid getting to the main point", ["Strike the shrubs in a garden", "Win an argument quickly", "Talk loudly over others"]),
    D(2, "If a family struggles to 'make ends meet', what is hard for them?", "Having enough money to live on", ["Tying two pieces of rope together", "Finishing a project on time", "Getting along with relatives"]),
    D(3, "If someone says your uncle is 'no spring chicken', what do they mean?", "He is no longer young", ["He was not born in spring", "He is a very brave man", "He is not a good cook"]),
    D(4, "If a much-hyped launch is 'a damp squib', it is...?", "A disappointing letdown", ["A firework that won't light", "A huge, surprising success", "A costly legal mistake"]),
    D(5, "If you are caught 'between Scylla and Charybdis', what is your situation?", "Stuck between two equal dangers", ["Lost at sea in a storm", "Choosing between two good things", "Torn between two lovers"]),
  ],
];
