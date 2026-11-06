// Gram lane: Punctuation & Structure. 36 days x 5 tiers.
// Scope: apostrophes, clear-cut commas, semicolons, colons, American-style
// quotation placement, capitalization, hyphenated compound modifiers, dangling
// and misplaced modifiers, parallel structure, run-ons, comma splices,
// fragments, that vs which, and grammar terminology at the upper tiers.
// Not here: word confusables, verb forms, pronoun case, subject-verb agreement.
// Never asked: the Oxford comma, or anything where AP and Chicago disagree
// (possessives of names ending in s, colon capitalization, title case of
// prepositions, numbers style, hyphens after "to be").
const L = 'Punctuation & Structure';
// Days 1-36 (2026-10-19 to 2026-11-23), already in the bank. Kept for the record;
// gen-english.mjs reads only LANE_DAYS below, which holds the newest segment.
export const LANE_DAYS_D01_D36 = [
  // day 1
  [
    { c: L, t: 1, q: "In 'Let's eat, Grandma,' what does the comma tell you?", a: 'Grandma is being spoken to', d: ['Grandma is on the menu', 'Two sentences are joined', 'A list is starting'] },
    { c: L, t: 2, q: "Which sentence uses 'its' correctly?", a: 'The bird built its nest in the oak.', d: [`The bird built it's nest in the oak.`, `The dog chased it's own tail.`, 'Its going to rain later today.'] },
    { c: L, t: 3, q: 'Which sentence has a dangling modifier?', a: 'Walking to school, the rain soaked my shoes.', d: ['Walking to school, I got my shoes soaked.', 'The rain soaked my shoes as I walked.', 'I walked to school in the pouring rain.'] },
    { c: L, t: 4, q: "In 'We drove home after dinner,' what part of speech is 'home'?", a: 'adverb', d: ['noun', 'adjective', 'preposition'] },
    { c: L, t: 5, q: "In 'The coach insists that she be on time,' what mood is the verb 'be'?", a: 'subjunctive', d: ['indicative', 'imperative', 'infinitive'] },
  ],
  // day 2
  [
    { c: L, t: 1, q: 'Which word should always begin with a capital letter?', a: 'Tuesday', d: ['autumn', 'breakfast', 'river'] },
    { c: L, t: 2, q: 'Which sentence is punctuated correctly?', a: 'She asked whether the store was open.', d: ['He asked me if I was hungry?', 'Where did you put my keys.', 'Can you hear me in the back.'] },
    { c: L, t: 3, q: "Which sentence correctly uses 'which'?", a: 'Our car, which is ten years old, still runs well.', d: ['My dog which is a beagle, barks a lot.', 'My phone, which I dropped is broken.', 'Books which are overdue, cost a fine.'] },
    { c: L, t: 4, q: 'Which sentence correctly shows a house owned by the Jones family?', a: `We stayed at the Joneses' house.`, d: [`We stayed at the Jones's house.`, `We stayed at the Jone's house.`, `We stayed at the Joneses's house.`] },
    { c: L, t: 5, q: "In 'Her work finished, she went home,' what is 'Her work finished'?", a: 'an absolute phrase', d: ['a dangling participle', 'an appositive phrase', 'a gerund phrase'] },
  ],
  // day 3
  [
    { c: L, t: 1, q: "Which mark belongs at the end of 'Where did you park the car'?", a: 'a question mark', d: ['a period', 'a comma', 'a colon'] },
    { c: L, t: 2, q: 'Which sentence follows American style for a period and a quotation?', a: `He said, "I'll be there soon."`, d: [`She replied, "Not today".`, `Mom called the room "a mess".`, `The sign on the door read "Closed".`] },
    { c: L, t: 3, q: 'Which sentence uses a colon correctly?', a: 'Bring two things: a pen and a ruler.', d: ['My favorite foods are: pizza and tacos.', 'We need: eggs and milk.', 'She plays: piano and violin.'] },
    { c: L, t: 4, q: "In 'Swimming is my favorite sport,' what is 'swimming'?", a: 'gerund', d: ['participle', 'infinitive', 'adverb'] },
    { c: L, t: 5, q: 'What is the term for a modifier that could attach to the words on either side of it?', a: 'a squinting modifier', d: ['a dangling modifier', 'a split modifier', 'a compound modifier'] },
  ],
  // day 4
  [
    { c: L, t: 1, q: 'Which sentence is capitalized correctly?', a: 'We flew to Paris in June.', d: ['My sister lives in boston.', 'the store opens at noon.', 'I met Tom on monday.'] },
    { c: L, t: 2, q: 'Which sentence uses a semicolon correctly?', a: 'It rained all day; the game was canceled.', d: ['We bought; milk and bread.', 'Because it rained; we stayed inside.', 'She smiled; and waved at us.'] },
    { c: L, t: 3, q: 'Which sentence is a comma splice?', a: 'The store was closed, we went home.', d: ['The store was closed, so we went home.', 'Because the store was closed, we went home.', 'We went home when the store closed.'] },
    { c: L, t: 4, q: 'Which phrase is hyphenated correctly?', a: 'a well-known singer', d: ['a highly-rated movie', 'an easily-solved puzzle', 'a brightly-lit room'] },
    { c: L, t: 5, q: "In 'My aunt is a pilot,' what is 'a pilot'?", a: 'a predicate nominative', d: ['a direct object', 'an appositive', 'an indirect object'] },
  ],
  // day 5
  [
    { c: L, t: 1, q: "In 'They laughed at the joke,' what part of speech is 'they'?", a: 'pronoun', d: ['noun', 'verb', 'adjective'] },
    { c: L, t: 2, q: "Which correctly fills the blank in 'We had dinner with the ___ last night'?", a: 'Smiths', d: [`Smith's`, 'Smithes', `Smiths's`] },
    { c: L, t: 3, q: 'Which sentence has a misplaced modifier?', a: 'We bought a puppy for my sister with floppy ears.', d: ['We bought a puppy with floppy ears for my sister.', 'My sister got a puppy with floppy ears.', `The puppy with floppy ears is my sister's.`] },
    { c: L, t: 4, q: "In 'My brother, who lives in Ohio, is visiting,' what do the commas suggest?", a: 'The speaker has only one brother', d: ['The speaker has several brothers', 'The brother is moving to Ohio', 'The visit is a surprise'] },
    { c: L, t: 5, q: "In 'There are three cats in the yard,' what is the word 'there' called?", a: 'an expletive', d: ['a relative pronoun', 'a predicate adjective', 'a demonstrative pronoun'] },
  ],
  // day 6
  [
    { c: L, t: 1, q: 'Which sentence uses an apostrophe correctly?', a: `Don't forget your coat.`, d: [`The cat's are asleep.`, `We bought apple's today.`, `She has two brother's.`] },
    { c: L, t: 2, q: "In 'Honesty matters most,' what part of speech is 'honesty'?", a: 'noun', d: ['adverb', 'adjective', 'verb'] },
    { c: L, t: 3, q: 'Which sentence uses parallel structure?', a: 'She likes hiking and swimming.', d: ['She likes hiking and to swim.', 'He wants to read and writing.', 'They enjoy to cook and baking.'] },
    { c: L, t: 4, q: 'Which sentence places the question mark correctly?', a: `Did she really say "I quit"?`, d: [`He asked, "Where is the exit"?`, `Did you hear him yell "Fire?"`, `Who said "Let them eat cake?"`] },
    { c: L, t: 5, q: "In 'The broken vase lay on the floor,' what is 'broken'?", a: 'participle', d: ['gerund', 'infinitive', 'adverb'] },
  ],
  // day 7
  [
    { c: L, t: 1, q: 'Which of these is a proper noun?', a: 'Chicago', d: ['city', 'street', 'teacher'] },
    { c: L, t: 2, q: "In 'She is a fast runner,' what part of speech is 'fast'?", a: 'adjective', d: ['adverb', 'noun', 'verb'] },
    { c: L, t: 3, q: 'Which sentence uses commas correctly around extra information?', a: 'Mr. Diaz, our coach, drove the bus.', d: ['The Eiffel Tower, in Paris is tall.', 'My neighbor Ann, a nurse works nights.', 'Our dog Rex, who is old sleeps a lot.'] },
    { c: L, t: 4, q: 'Which sentence shows that Sam and Ann each own a different car?', a: `Sam's and Ann's cars are blue.`, d: [`Sam and Ann's car is blue.`, `Sam and Ann's cars are blue.`, 'Sams and Anns cars are blue.'] },
    { c: L, t: 5, q: "What is the term for the error in 'Having eaten lunch, the dishes were washed'?", a: 'a dangling participle', d: ['a comma splice', 'a squinting modifier', 'faulty parallelism'] },
  ],
  // day 8
  [
    { c: L, t: 1, q: "In 'The baby slept,' what part of speech is 'baby'?", a: 'noun', d: ['verb', 'adverb', 'pronoun'] },
    { c: L, t: 2, q: "In 'I was tired, but I stayed up,' what part of speech is 'but'?", a: 'conjunction', d: ['preposition', 'adverb', 'pronoun'] },
    { c: L, t: 3, q: 'Which sentence uses commas correctly with a city and state?', a: 'She moved to Austin, Texas, last spring.', d: ['He lives in Miami Florida, with his wife.', 'We drove to, Reno Nevada.', 'They met in Boise, Idaho in May.'] },
    { c: L, t: 4, q: 'Which sentence is capitalized correctly?', a: 'They grew up in the South.', d: ['Drive North for two more miles.', 'The sun sets in the West.', 'We drove East on the highway.'] },
    { c: L, t: 5, q: "In 'The voters elected her mayor,' what is 'mayor'?", a: 'an object complement', d: ['an indirect object', 'an appositive', 'a predicate nominative'] },
  ],
  // day 9
  [
    { c: L, t: 1, q: "Which mark should end 'Please close the door'?", a: 'a period', d: ['a question mark', 'a colon', 'a semicolon'] },
    { c: L, t: 2, q: "In 'Wow, that was close,' what part of speech is 'wow'?", a: 'interjection', d: ['adverb', 'conjunction', 'pronoun'] },
    { c: L, t: 3, q: 'Which sentence is punctuated correctly?', a: 'I studied hard; however, I failed the test.', d: ['We left early, however, we missed the bus.', 'It was late, therefore, we went home.', 'She was tired however; she kept going.'] },
    { c: L, t: 4, q: "In 'My dog, a beagle, loves to dig,' what is 'a beagle'?", a: 'an appositive', d: ['a predicate nominative', 'a direct object', 'an absolute phrase'] },
    { c: L, t: 5, q: "In 'While driving, keep both hands on the wheel,' what is 'While driving'?", a: 'an elliptical clause', d: ['an absolute phrase', 'an appositive phrase', 'an infinitive phrase'] },
  ],
  // day 10
  [
    { c: L, t: 1, q: 'Which sentence uses quotation marks correctly?', a: `Tom said, "Let's go home."`, d: [`Ben said, I'm "hungry now."`, `"Ann said, I lost my keys."`, `He yelled, "Watch out!".`] },
    { c: L, t: 2, q: 'Which phrase uses hyphens correctly before a noun?', a: 'a two-hour delay', d: ['a three year old car', 'a five-pound-bag', 'a well known-actor'] },
    { c: L, t: 3, q: "What kind of sentence is 'Close the window'?", a: 'imperative', d: ['declarative', 'interrogative', 'exclamatory'] },
    { c: L, t: 4, q: "In 'Wait here until noon,' what part of speech is 'until'?", a: 'preposition', d: ['conjunction', 'adverb', 'adjective'] },
    { c: L, t: 5, q: 'If you have three sisters, which sentence is punctuated correctly?', a: 'My sister Ann teaches math.', d: ['My sister, Jo, plays golf.', 'My sister, Kim plays tennis.', 'My sister Liz, sings opera.'] },
  ],
  // day 11
  [
    { c: L, t: 1, q: 'Which pronoun is always capitalized in English?', a: 'I', d: ['me', 'my', 'we'] },
    { c: L, t: 2, q: 'Which sentence is punctuated correctly?', a: 'While Mom was cooking, the kids set the table.', d: ['If you, finish early you can leave.', 'After, the movie ended we went home.', 'Because it was cold we, wore coats.'] },
    { c: L, t: 3, q: "In 'Everyone cheered for the team,' what part of speech is 'everyone'?", a: 'pronoun', d: ['noun', 'adverb', 'adjective'] },
    { c: L, t: 4, q: 'Which sentence contains a verb in the subjunctive mood?', a: 'If I were rich, I would travel.', d: ['I was rich once.', 'She is rich now.', 'If he was home, he heard us.'] },
    { c: L, t: 5, q: "What kind of sentence is 'I left when it rained, and Ann stayed'?", a: 'compound-complex', d: ['compound', 'complex', 'simple'] },
  ],
  // day 12
  [
    { c: L, t: 1, q: "Which mark goes between the city and state in 'Dallas Texas'?", a: 'a comma', d: ['a period', 'a hyphen', 'a colon'] },
    { c: L, t: 2, q: "Which sentence capitalizes 'mom' correctly?", a: 'I asked Mom for a ride.', d: ['My Mom drove me to school.', 'Her Mom is a nurse.', 'Did your Mom call back?'] },
    { c: L, t: 3, q: 'Which sentence uses a comma between adjectives correctly?', a: 'It was a long, hot summer.', d: ['She wore a, red dress.', 'He owns three, small dogs.', 'I ate a, warm muffin.'] },
    { c: L, t: 4, q: "In 'I know that you tried,' what part of speech is 'that'?", a: 'conjunction', d: ['pronoun', 'adverb', 'adjective'] },
    { c: L, t: 5, q: "In 'What you said surprised me,' what is 'What you said'?", a: 'a noun clause', d: ['an adverb clause', 'an adjective clause', 'an absolute phrase'] },
  ],
  // day 13
  [
    { c: L, t: 1, q: 'Which of these words is a verb?', a: 'jump', d: ['happy', 'slowly', 'tiny'] },
    { c: L, t: 2, q: 'Which sentence shows that the toys belong to more than one child?', a: `The children's toys are everywhere.`, d: [`The child's toys are everywhere.`, `The childrens' toys are everywhere.`, `The childs' toys are everywhere.`] },
    { c: L, t: 3, q: 'Which of these is a compound sentence?', a: 'I called, and she answered right away.', d: ['I called her and texted her too.', 'After I called, she answered.', 'Calling her was easy enough.'] },
    { c: L, t: 4, q: "What is the term for paired words like 'either...or' and 'neither...nor'?", a: 'correlative conjunctions', d: ['coordinating conjunctions', 'subordinating conjunctions', 'conjunctive adverbs'] },
    { c: L, t: 5, q: "In 'She has a lot of work to do,' how is 'to do' used?", a: 'as an adjective', d: ['as a noun', 'as an adverb', 'as the main verb'] },
  ],
  // day 14
  [
    { c: L, t: 1, q: 'Which of these words is an adjective?', a: 'purple', d: ['quickly', 'dance', 'often'] },
    { c: L, t: 2, q: 'Which of these is a complete sentence?', a: 'The bus arrived late.', d: ['Because the bus was late.', 'After the long ride home.', 'Running for the bus again.'] },
    { c: L, t: 3, q: 'Which sentence places the comma correctly?', a: `"I'm tired," she said with a yawn.`, d: [`"Let's go", he said.`, `"Not yet", Mom replied.`, `"Sit down", the coach yelled.`] },
    { c: L, t: 4, q: 'Which phrase is punctuated correctly?', a: 'both 10- and 20-year loans', d: ['both short and long-term loans', 'first and second-grade students', 'three and four-door cars'] },
    { c: L, t: 5, q: "In 'She gave the dog a bath,' what is 'the dog'?", a: 'an indirect object', d: ['a direct object', 'an object complement', 'an appositive'] },
  ],
  // day 15
  [
    { c: L, t: 1, q: 'Which punctuation goes around the exact words a person says?', a: 'quotation marks', d: ['parentheses', 'brackets', 'apostrophes'] },
    { c: L, t: 2, q: "In 'She sang beautifully,' what part of speech is 'beautifully'?", a: 'adverb', d: ['adjective', 'noun', 'verb'] },
    { c: L, t: 3, q: 'Which phrase correctly shows possession by one boss?', a: `the boss's office`, d: ['the bosses office', `the boss' office`, `the bosse's office`] },
    { c: L, t: 4, q: 'What is the term for two independent clauses run together with no punctuation at all?', a: 'a fused sentence', d: ['a comma splice', 'a fragment', 'a compound sentence'] },
    { c: L, t: 5, q: "In 'I enjoy reading mysteries,' what is 'reading mysteries'?", a: 'a gerund phrase', d: ['a participial phrase', 'an infinitive phrase', 'an absolute phrase'] },
  ],
  // day 16
  [
    { c: L, t: 1, q: "In 'Birds sing at dawn,' what part of speech is 'sing'?", a: 'verb', d: ['noun', 'adjective', 'adverb'] },
    { c: L, t: 2, q: 'Which sentence uses a comma correctly for the person being spoken to?', a: 'Sarah, please close the door.', d: ['Please, close the door Sarah.', 'Come here, now Max.', 'Thank you Ben, for the gift.'] },
    { c: L, t: 3, q: 'Which sentence is capitalized correctly?', a: 'My favorite subject is English.', d: ['I love my Science class.', 'She teaches Math at the high school.', 'Our History teacher is strict.'] },
    { c: L, t: 4, q: 'Which sentence has a dangling modifier?', a: 'To win the race, hard training is needed.', d: ['To win the race, you need hard training.', 'Hard training is needed to win the race.', 'She trained hard to win the race.'] },
    { c: L, t: 5, q: "In 'The soup tastes salty,' what kind of verb is 'tastes'?", a: 'a linking verb', d: ['a transitive verb', 'a helping verb', 'an action verb'] },
  ],
  // day 17
  [
    { c: L, t: 1, q: 'Which of these should not be capitalized in the middle of a sentence?', a: 'winter', d: ['Friday', 'Canada', 'January'] },
    { c: L, t: 2, q: 'Which sentence writes the decade correctly?', a: 'Disco was big in the 1970s.', d: [`She grew up in the 1980's.`, `Jazz ruled the 1920's.`, `Grunge was huge in the '90's.`] },
    { c: L, t: 3, q: "Which sentence uses 'that' correctly?", a: 'The book that I lent you is overdue.', d: ['My car, that is red, needs gas.', 'Paris, that I love, is crowded.', 'This old house, that we sold, was drafty.'] },
    { c: L, t: 4, q: "Your spouse's mom owns a car. Which phrase names it correctly?", a: `my mother-in-law's car`, d: [`my mother's-in-law car`, `my mothers-in-law's car`, 'my mother-in-laws car'] },
    { c: L, t: 5, q: "What does 'The students, who studied, passed' say about the students?", a: 'All of them studied and passed', d: ['Only some of them studied', 'Only those who studied passed', 'None of them studied'] },
  ],
  // day 18
  [
    { c: L, t: 1, q: 'Which sentence correctly shows ownership by Sam?', a: `That is Sam's bike.`, d: ['That is Sams bike.', `Thats Sam's bike.`, `That's Sams bike.`] },
    { c: L, t: 2, q: "In 'The book on the shelf is mine,' what part of speech is 'on'?", a: 'preposition', d: ['adverb', 'conjunction', 'adjective'] },
    { c: L, t: 3, q: 'Which of these is a sentence fragment?', a: 'Running through the park with my dog every morning.', d: ['I run through the park with my dog.', 'My dog runs with me every morning.', 'Run through the park with me.'] },
    { c: L, t: 4, q: 'Which sentence places the semicolon correctly?', a: `She called it "a bargain"; I called it a waste.`, d: [`He said "maybe;" she said "no."`, `They named it "Fluffy;" we called it Max.`, `I read "Ozymandias;" it moved me.`] },
    { c: L, t: 5, q: "What is the term for a word like 'because' or 'although' that begins a dependent clause?", a: 'a subordinating conjunction', d: ['a coordinating conjunction', 'a conjunctive adverb', 'a relative pronoun'] },
  ],
  // day 19
  [
    { c: L, t: 1, q: "In 'The red balloon popped,' what part of speech is 'red'?", a: 'adjective', d: ['noun', 'verb', 'adverb'] },
    { c: L, t: 2, q: 'Which sentence is punctuated correctly?', a: 'Kim plays guitar, and her brother plays drums.', d: ['The movie was long, we left early.', 'My cat, sleeps all day.', 'Tom, and I went fishing.'] },
    { c: L, t: 3, q: "What is the term for the error in 'The sun set, we went inside'?", a: 'a comma splice', d: ['a fused sentence', 'a fragment', 'a compound sentence'] },
    { c: L, t: 4, q: "In 'Well, I never expected that,' what part of speech is 'well'?", a: 'interjection', d: ['adverb', 'adjective', 'noun'] },
    { c: L, t: 5, q: "In 'This is my favorite song,' what kind of pronoun is 'this'?", a: 'a demonstrative pronoun', d: ['a relative pronoun', 'an indefinite pronoun', 'a reflexive pronoun'] },
  ],
  // day 20
  [
    { c: L, t: 1, q: 'Which of these words is a noun?', a: 'pencil', d: ['quickly', 'shiny', 'very'] },
    { c: L, t: 2, q: 'Which of these is a collective noun?', a: 'team', d: ['player', 'coach', 'field'] },
    { c: L, t: 3, q: 'Which sentence is capitalized correctly?', a: 'We heard a speech by Senator Ruiz.', d: ['The President of our club is Ann.', 'Senator jones visited the school.', 'The Doctor will see you now.'] },
    { c: L, t: 4, q: 'Which sentence has a misplaced modifier?', a: 'The waiter served soup to the man in a bowl.', d: ['The waiter served soup in a bowl to the man.', 'The man got his soup in a bowl.', 'The waiter brought the man a bowl of soup.'] },
    { c: L, t: 5, q: "In 'The man who called is my uncle,' what is 'who'?", a: 'a relative pronoun', d: ['an interrogative pronoun', 'a subordinating conjunction', 'a demonstrative pronoun'] },
  ],
  // day 21
  [
    { c: L, t: 1, q: "Which mark joins the words in 'jack-in-the-box'?", a: 'a hyphen', d: ['a comma', 'a slash', 'an apostrophe'] },
    { c: L, t: 2, q: 'Which sentence uses an apostrophe correctly?', a: `The girls' locker room is downstairs.`, d: [`The girl's are on the team.`, `Those shoes are her's.`, `The book lost it's cover.`] },
    { c: L, t: 3, q: 'Which sentence uses a colon correctly?', a: 'He had one goal: to finish the race.', d: ['The winners were: Ana and Raj.', 'We packed: snacks and water.', 'Her hobbies include: golf and chess.'] },
    { c: L, t: 4, q: "In 'The ball rolled down the hill,' what part of speech is 'down'?", a: 'preposition', d: ['adverb', 'adjective', 'conjunction'] },
    { c: L, t: 5, q: "In 'I saw a sleeping baby,' what is 'sleeping'?", a: 'participle', d: ['gerund', 'infinitive', 'noun'] },
  ],
  // day 22
  [
    { c: L, t: 1, q: 'Which sentence ends with the correct mark?', a: 'Do you like pizza?', d: ['Where is my phone.', 'I really like pizza?', 'Are we there yet.'] },
    { c: L, t: 2, q: 'Which sentence uses commas correctly with a date?', a: 'On July 4, 1776, the colonies declared independence.', d: ['She was born on June 12 2001.', 'The party is on, July 4.', 'He left in April, 3 2019.'] },
    { c: L, t: 3, q: 'Which sentence uses parallel structure?', a: 'She is not only smart but also kind.', d: ['She is not only smart but also has kindness.', 'He either will call or text you later.', 'They wanted both to win and winning.'] },
    { c: L, t: 4, q: 'Which sentence has a squinting modifier?', a: 'People who exercise often feel better.', d: ['People who often exercise feel better.', 'People who exercise feel better often.', 'Often, people who exercise feel better.'] },
    { c: L, t: 5, q: "In 'Hoping for rain, the farmers watched the sky,' what is 'Hoping for rain'?", a: 'a participial phrase', d: ['a gerund phrase', 'an absolute phrase', 'an infinitive phrase'] },
  ],
  // day 23
  [
    { c: L, t: 1, q: 'Which of these words is a pronoun?', a: 'she', d: ['tree', 'blue', 'fast'] },
    { c: L, t: 2, q: "Which mark belongs after 'However' in 'However I disagree with you'?", a: 'a comma', d: ['a semicolon', 'a colon', 'a period'] },
    { c: L, t: 3, q: 'Which sentence uses hyphens correctly?', a: 'She gave a long-awaited speech.', d: ['It was a long awaited-speech.', 'We ate at a family owned diner.', 'It was a well-earned-break.'] },
    { c: L, t: 4, q: 'Which sentence says that only some of the apples were bruised?', a: 'The apples that were bruised went in the pie.', d: ['The apples, which were bruised, went in the pie.', 'The apples, all of them bruised, went in the pie.', 'Every apple was bruised and went in the pie.'] },
    { c: L, t: 5, q: 'Which test shows that two adjectives before a noun need a comma between them?', a: `They still make sense with 'and' between them`, d: ['They both end in the same letter', 'They describe the same color', 'They come before a proper noun'] },
  ],
  // day 24
  [
    { c: L, t: 1, q: "Which mark follows 'Dear Ann' at the start of a friendly letter?", a: 'a comma', d: ['a period', 'a semicolon', 'a question mark'] },
    { c: L, t: 2, q: 'Which sentence capitalizes a holiday correctly?', a: 'We eat turkey on Thanksgiving.', d: ['We open gifts on christmas morning.', 'Monday is a Holiday for us.', 'Our family loves Halloween Candy.'] },
    { c: L, t: 3, q: "In 'The guests arrived early,' what part of speech is 'early'?", a: 'adverb', d: ['adjective', 'noun', 'preposition'] },
    { c: L, t: 4, q: "In 'To err is human,' what is 'To err'?", a: 'infinitive', d: ['gerund', 'participle', 'prepositional phrase'] },
    { c: L, t: 5, q: "What is the term for a verb that takes a direct object, like 'carry'?", a: 'a transitive verb', d: ['an intransitive verb', 'a linking verb', 'a modal verb'] },
  ],
  // day 25
  [
    { c: L, t: 1, q: "Which is the correct contraction of 'will not'?", a: `won't`, d: [`willn't`, `wo'nt`, 'wont'] },
    { c: L, t: 2, q: 'Which sentence is hyphenated correctly?', a: 'We met my sister-in-law for lunch.', d: ['My brother in-law is very tall.', 'She is a part time cook.', 'The well-dressed-man waved.'] },
    { c: L, t: 3, q: "What kind of sentence is 'Although it rained, we played'?", a: 'complex', d: ['compound', 'simple', 'compound-complex'] },
    { c: L, t: 4, q: 'What is the term for using the same grammatical form for matching ideas?', a: 'parallelism', d: ['agreement', 'apposition', 'ellipsis'] },
    { c: L, t: 5, q: "In 'His singing kept us awake,' what is 'singing'?", a: 'gerund', d: ['participle', 'infinitive', 'adjective'] },
  ],
  // day 26
  [
    { c: L, t: 1, q: 'Which of these words is an adverb?', a: 'slowly', d: ['gentle', 'table', 'sing'] },
    { c: L, t: 2, q: 'What do you call a sentence that asks a question?', a: 'an interrogative sentence', d: ['a declarative sentence', 'an imperative sentence', 'an exclamatory sentence'] },
    { c: L, t: 3, q: 'Which sentence shows a cabin that Ana and Max own together?', a: `We stayed at Ana and Max's cabin.`, d: [`We stayed at Ana's and Max's cabin.`, 'We stayed at Anas and Maxs cabin.', `We stayed at Ana and Maxs' cabin.`] },
    { c: L, t: 4, q: "In 'Nobody answered the phone,' what part of speech is 'nobody'?", a: 'pronoun', d: ['noun', 'adverb', 'adjective'] },
    { c: L, t: 5, q: 'What is the term for a sentence that saves its main clause for the very end?', a: 'a periodic sentence', d: ['a loose sentence', 'a run-on sentence', 'a compound sentence'] },
  ],
  // day 27
  [
    { c: L, t: 1, q: 'Which of these words is a preposition?', a: 'under', d: ['happy', 'quickly', 'jump'] },
    { c: L, t: 2, q: 'Which sentence is punctuated correctly?', a: `"Watch out!" she shouted.`, d: [`"Hurry up"! he called.`, `"Look out", Dad warned.`, `She whispered "Good night".`] },
    { c: L, t: 3, q: 'Which sentence has a dangling modifier?', a: 'After finishing the homework, the TV was turned on.', d: ['After finishing the homework, Lin turned on the TV.', 'Lin turned on the TV after her homework.', 'The TV went on once Lin finished her work.'] },
    { c: L, t: 4, q: 'Which phrase is hyphenated correctly?', a: 'a quickly growing town', d: ['a fast growing-town', 'a newly-built house', 'a highly-paid lawyer'] },
    { c: L, t: 5, q: "What is the grammatical term for 'Sam' in 'Thank you, Sam'?", a: 'a vocative', d: ['an appositive', 'an expletive', 'a predicate nominative'] },
  ],
  // day 28
  [
    { c: L, t: 1, q: "Which mark best ends a sentence shouting excitement, like 'We won the game'?", a: 'an exclamation point', d: ['a comma', 'a colon', 'a hyphen'] },
    { c: L, t: 2, q: 'Which sentence uses an apostrophe to show ownership?', a: `Grandpa's truck is in the barn.`, d: [`We're leaving soon.`, `It's a sunny day.`, `They're at home now.`] },
    { c: L, t: 3, q: 'Which sentence is punctuated correctly?', a: 'The shoes that I wanted were sold out.', d: ['The hat, that she wore, was red.', 'My boots which are brown, need polish.', 'Our house, which we built is blue.'] },
    { c: L, t: 4, q: 'Which sentence has a misplaced modifier?', a: 'The house was sold to a family that had been empty for years.', d: ['The house that had been empty for years was sold.', 'A family bought the house, which had sat empty for years.', 'The family bought a house that had been empty.'] },
    { c: L, t: 5, q: "In 'Running is fun, but swimming is better,' how many gerunds are there?", a: 'two', d: ['one', 'three', 'none'] },
  ],
  // day 29
  [
    { c: L, t: 1, q: "What do you call a word that shows an action, like 'run' or 'throw'?", a: 'a verb', d: ['a noun', 'an adjective', 'a pronoun'] },
    { c: L, t: 2, q: "In 'The cat hid under the bed,' what is 'under the bed'?", a: 'a prepositional phrase', d: ['an independent clause', 'a dependent clause', 'a compound subject'] },
    { c: L, t: 3, q: 'What is the term for a group of words with a subject and verb that can stand alone as a sentence?', a: 'an independent clause', d: ['a dependent clause', 'a prepositional phrase', 'an appositive'] },
    { c: L, t: 4, q: 'Which sentence is punctuated correctly?', a: 'The poet Robert Frost wrote about New England.', d: ['The poet, Robert Frost wrote about birches.', 'The poet Robert Frost, loved stone walls.', 'Robert Frost the poet, lived in Vermont.'] },
    { c: L, t: 5, q: "What is the term for a clause like 'who lives next door' that describes a noun?", a: 'an adjective clause', d: ['a noun clause', 'an adverb clause', 'an independent clause'] },
  ],
  // day 30
  [
    { c: L, t: 1, q: 'Which of these is the name of one particular street?', a: 'Main Street', d: ['a long street', 'the next block', 'our road'] },
    { c: L, t: 2, q: 'Which of these is a sentence fragment?', a: 'Although we tried our very best.', d: ['We tried our very best.', 'Try your very best.', 'Our best was good enough.'] },
    { c: L, t: 3, q: "What do you call words like 'but' or 'yet' that join two equal parts?", a: 'coordinating conjunctions', d: ['subordinating conjunctions', 'correlative conjunctions', 'relative pronouns'] },
    { c: L, t: 4, q: 'Which sentence is capitalized correctly?', a: 'My grandfather fought in World War II.', d: ['We studied the war of 1812 in class.', 'Our class toured the lincoln memorial.', 'The Declaration of independence is old.'] },
    { c: L, t: 5, q: "In 'I like to swim,' how is 'to swim' used?", a: 'as a direct object', d: ['as an adverb', 'as an adjective', 'as the subject'] },
  ],
  // day 31
  [
    { c: L, t: 1, q: "Which mark separates the hour from the minutes in '9:30' on a clock?", a: 'a colon', d: ['a comma', 'a period', 'a semicolon'] },
    { c: L, t: 2, q: 'Which sentence is punctuated correctly?', a: 'Yes, I will be there by noon.', d: [`No I can't make it tonight.`, 'Well I guess so, then.', `Sure I'd love to come.`] },
    { c: L, t: 3, q: 'Which sentence correctly sets off extra details with commas?', a: 'Lake Superior, the largest Great Lake, is cold.', d: ['My friend Jo, a chef cooked dinner.', 'Rome which is in Italy, is old.', 'Our cat Milo, who is shy hides.'] },
    { c: L, t: 4, q: 'Which sentence punctuates a quotation inside a quotation correctly?', a: `Lee said, "Ann told me 'no' twice."`, d: [`Kim said, 'Bo yelled "stop" at me.'`, `Raj said, "Mia called it "fine" earlier."`, `Tess said "Jo told me 'hi'".`] },
    { c: L, t: 5, q: "What is the term for a series with no conjunctions, as in 'I came, I saw, I conquered'?", a: 'asyndeton', d: ['polysyndeton', 'anaphora', 'chiasmus'] },
  ],
  // day 32
  [
    { c: L, t: 1, q: 'Which sentence has all the right capital letters?', a: 'I visited Grandma on Sunday.', d: ['i saw the movie on Friday.', 'We drove to the Beach in July.', 'My brother lives in texas.'] },
    { c: L, t: 2, q: "What do you call a word like 'oops' or 'hooray' that shows strong feeling?", a: 'an interjection', d: ['an adverb', 'a conjunction', 'a preposition'] },
    { c: L, t: 3, q: 'Which sentence places the question mark correctly?', a: `She asked, "Is it raining?"`, d: [`He asked, "Are you ready"?`, `Did Mom say "be home by six?"`, `They asked "When do we eat"?`] },
    { c: L, t: 4, q: 'Which sentence contains a restrictive clause?', a: 'Students who cheat will fail the class.', d: ['My father, who cheats at cards, laughs a lot.', 'Sue, who never cheats, won again.', 'The test, which was hard, ended at noon.'] },
    { c: L, t: 5, q: "In 'The cake was eaten by the kids,' what voice is the verb in?", a: 'passive', d: ['active', 'middle', 'imperative'] },
  ],
  // day 33
  [
    { c: L, t: 1, q: 'Which of these words should be capitalized?', a: 'Mars', d: ['spring', 'green', 'lunch'] },
    { c: L, t: 2, q: 'Which sentence is capitalized correctly?', a: 'She speaks Spanish at home.', d: ['He studies french at night.', 'We are learning japanese now.', 'My Dad speaks Italian.'] },
    { c: L, t: 3, q: 'Which sentence is a run-on?', a: 'I was hungry I ate a sandwich.', d: ['I was hungry, so I ate a sandwich.', 'Because I was hungry, I ate lunch.', 'Hungry, I ate a sandwich.'] },
    { c: L, t: 4, q: 'Which sentence has a dangling modifier?', a: 'As a child, my mother read to me every night.', d: ['As a child, I was read to every night.', 'When I was a child, my mother read to me.', 'My mother read to me every night when I was small.'] },
    { c: L, t: 5, q: "What is the term for 'table' in 'under the table'?", a: 'the object of the preposition', d: ['the predicate', 'the complement', 'the antecedent'] },
  ],
  // day 34
  [
    { c: L, t: 1, q: 'Which sentence is punctuated correctly?', a: 'I like apples, but Ken likes pears.', d: ['We ran, to the store.', 'She bought, milk and eggs.', 'The sun, is hot today.'] },
    { c: L, t: 2, q: "Which is the correct plural possessive of 'woman'?", a: `women's`, d: [`womens'`, `womans'`, `womens's`] },
    { c: L, t: 3, q: 'Which sentence is capitalized correctly?', a: 'We visited Aunt Rosa in May.', d: ['My Aunt lives in Ohio.', 'Our Uncle sells cars.', 'We saw aunt Rosa at church.'] },
    { c: L, t: 4, q: "In 'The soup smells delicious,' what part of speech is 'delicious'?", a: 'adjective', d: ['adverb', 'noun', 'verb'] },
    { c: L, t: 5, q: "In 'The car we rented was tiny,' which word could be added right after 'car'?", a: 'that', d: ['what', 'then', 'whose'] },
  ],
  // day 35
  [
    { c: L, t: 1, q: 'Which sentence uses an apostrophe correctly?', a: `It's cold outside today.`, d: ['Were going to the park.', 'She didnt call me back.', 'They wont be late.'] },
    { c: L, t: 2, q: 'Which sentence uses a semicolon correctly?', a: 'My dog barks at night; my cat sleeps all day.', d: ['I went to; the store.', 'Although it snowed; we drove.', 'He laughed; because it was funny.'] },
    { c: L, t: 3, q: 'Which sentence uses parallel structure?', a: 'I like to read and to write.', d: ['I like reading and to write.', 'Sam likes to swim and biking.', 'We can walk or taking the bus.'] },
    { c: L, t: 4, q: 'What is the term for the noun that a pronoun refers back to?', a: 'an antecedent', d: ['an appositive', 'a complement', 'a predicate'] },
    { c: L, t: 5, q: 'Which of these is a simple sentence?', a: 'The tired dogs and cats slept all afternoon.', d: ['The dogs slept, and the cats played.', 'The dogs slept because they were tired.', 'The dogs slept while the cats played.'] },
  ],
  // day 36
  [
    { c: L, t: 1, q: "Which mark ends a plain statement like 'The store closes at nine'?", a: 'a period', d: ['a comma', 'a colon', 'a hyphen'] },
    { c: L, t: 2, q: 'Which sentence is capitalized correctly?', a: 'Last summer we visited Lake Tahoe.', d: ['We swim every Summer at the lake.', 'Our Family visited lake Tahoe.', 'In july we went to the Lake.'] },
    { c: L, t: 3, q: "In 'The run was long and hard,' what part of speech is 'run'?", a: 'noun', d: ['verb', 'adjective', 'adverb'] },
    { c: L, t: 4, q: "In 'Call me if you need help,' what part of speech is 'if'?", a: 'conjunction', d: ['preposition', 'adverb', 'pronoun'] },
    { c: L, t: 5, q: "In 'She seems tired,' what is 'tired'?", a: 'a predicate adjective', d: ['a direct object', 'an adverb', 'a predicate nominative'] },
  ],
];

// Days 37-74 (2026-11-24 to 2026-12-31), appended 2026-11-06. Same scope and
// bans as above. Each item is new to the bank. Choices that differ only in
// punctuation would collapse to one string under the checker's normalizer, so
// every punctuation question offers four different sentences (or forms whose
// letters differ). No choice or stem carries a three-item series, so no item
// turns on the serial comma.
export const LANE_DAYS = [
  // day 37
  [
    { c: L, t: 1, q: "Which is the correct contraction of 'cannot'?", a: "can't", d: ["cant'", "ca'nt", "cann't"] },
    { c: L, t: 2, q: 'Which sentence is punctuated correctly?', a: `You're coming tonight, aren't you?`, d: [`She's ready isn't she?`, `It's cold, isn't, it?`, `They left, didn't they.`] },
    { c: L, t: 3, q: 'Which sentence has a dangling modifier?', a: 'While brushing my teeth, the phone rang.', d: ['While I was brushing my teeth, the phone rang.', 'The phone rang while I brushed my teeth.', 'While brushing my teeth, I heard the phone ring.'] },
    { c: L, t: 4, q: "In 'You might want a coat,' what kind of verb is 'might'?", a: 'a modal verb', d: ['a linking verb', 'an action verb', 'a phrasal verb'] },
    { c: L, t: 5, q: "In 'I myself fixed the sink,' what kind of pronoun is 'myself'?", a: 'an intensive pronoun', d: ['a reflexive pronoun', 'a relative pronoun', 'a possessive pronoun'] },
  ],
  // day 38
  [
    { c: L, t: 1, q: 'Which sentence is capitalized correctly?', a: `My best friend's name is Maya.`, d: [`my sister's name is Rosa.`, `Our dog's name is buster.`, `His Cat's name is Tiger.`] },
    { c: L, t: 2, q: 'Which sentence is punctuated correctly?', a: 'Oh, I forgot my umbrella.', d: ['Wow that, was close.', 'Hey you forgot, your keys.', 'Ouch, that, hurt.'] },
    { c: L, t: 3, q: "In 'By noon she had eaten lunch,' what tense is 'had eaten'?", a: 'past perfect', d: ['present perfect', 'simple past', 'past progressive'] },
    { c: L, t: 4, q: 'Which sentence has a misplaced modifier?', a: 'She nearly drove her kids to school every day.', d: ['She drove her kids to school nearly every day.', 'Nearly every day, she drove her kids to school.', 'She drove her two kids to school every day.'] },
    { c: L, t: 5, q: "In 'It rained; however, we played,' what is 'however'?", a: 'a conjunctive adverb', d: ['a coordinating conjunction', 'a preposition', 'an interjection'] },
  ],
  // day 39
  [
    { c: L, t: 1, q: 'Which of these should end with a question mark?', a: 'Can you help me carry this box', d: ['I can help you carry this box', 'Please help me carry this box', 'She asked me to carry this box'] },
    { c: L, t: 2, q: 'Which sentence uses an apostrophe correctly?', a: 'The blue towel is yours.', d: [`The red one is her's.`, `That seat is our's.`, `Is this book your's?`] },
    { c: L, t: 3, q: "What kind of sentence is 'What a great game that was!'?", a: 'exclamatory', d: ['interrogative', 'imperative', 'declarative'] },
    { c: L, t: 4, q: 'Which sentence uses an apostrophe correctly?', a: `She gave two weeks' notice at work.`, d: [`He took a days' rest.`, `We paid three month's rent.`, `I need an hours' sleep.`] },
    { c: L, t: 5, q: "What is the term for using 'and' between every item, as in 'red and white and blue'?", a: 'polysyndeton', d: ['asyndeton', 'anaphora', 'alliteration'] },
  ],
  // day 40
  [
    { c: L, t: 1, q: "In 'The baby giggled,' what part of speech is 'giggled'?", a: 'verb', d: ['noun', 'adjective', 'adverb'] },
    { c: L, t: 2, q: "Which sentence uses 'let's' correctly?", a: `Let's go to the beach tomorrow.`, d: [`Lets go to the park later.`, `Mom let's us stay up late.`, `The teacher let's us read.`] },
    { c: L, t: 3, q: "In 'Dad drove us home,' what case is the pronoun 'us'?", a: 'objective', d: ['subjective', 'possessive', 'reflexive'] },
    { c: L, t: 4, q: 'Which sentence is punctuated correctly?', a: 'We visited Austin, Texas; Reno, Nevada; and Salem, Oregon.', d: ['The tour stops in Mesa, Arizona, Provo, Utah, and Eugene, Oregon.', 'She lived in Tulsa; Oklahoma, Boise; Idaho, and Erie; Pennsylvania.', 'The band played in: Dover, Delaware; Akron, Ohio; and Ames, Iowa.'] },
    { c: L, t: 5, q: "In 'She left early to catch the train,' how is 'to catch the train' used?", a: 'as an adverb', d: ['as a noun', 'as an adjective', 'as a subject'] },
  ],
  // day 41
  [
    { c: L, t: 1, q: "Which mark shows that letters are missing in a word like 'don't'?", a: 'an apostrophe', d: ['a comma', 'a hyphen', 'a period'] },
    { c: L, t: 2, q: 'Which sentence uses parentheses correctly?', a: 'The museum (the one downtown) opens at ten.', d: ['The (old) museum, opens at ten.', 'The library opens (at nine.', 'The zoo opens at (eight on Sundays.'] },
    { c: L, t: 3, q: "What is the term for nouns like 'joy' and 'courage' that name ideas or feelings?", a: 'abstract nouns', d: ['concrete nouns', 'collective nouns', 'proper nouns'] },
    { c: L, t: 4, q: 'Which sentence is NOT parallel?', a: 'The coach told us to run hard and that we should stretch.', d: ['The coach told us to run hard and to stretch.', 'The coach told us to run hard and stretch.', 'The coach said that we should run and that we should stretch.'] },
    { c: L, t: 5, q: "What is the term for opening clause after clause with the same words, as in King's repeated 'I have a dream'?", a: 'anaphora', d: ['epistrophe', 'polysyndeton', 'chiasmus'] },
  ],
  // day 42
  [
    { c: L, t: 1, q: 'Which of these words is a verb?', a: 'climb', d: ['mountain', 'tall', 'quickly'] },
    { c: L, t: 2, q: 'Which sentence uses a comma correctly to show contrast?', a: 'I asked for tea, not coffee.', d: ['She wanted, red not blue.', 'He ordered soup not, salad.', 'We, chose the beach not the lake.'] },
    { c: L, t: 3, q: "In 'Max and Lily built a fort,' what is 'Max and Lily'?", a: 'a compound subject', d: ['a compound predicate', 'a direct object', 'an appositive'] },
    { c: L, t: 4, q: 'Which word is hyphenated correctly?', a: 'pre-Columbian', d: ['non-smoker', 'anti-freeze', 'mid-night'] },
    { c: L, t: 5, q: "What is the term for a verb that takes both a direct and an indirect object, like 'give'?", a: 'a ditransitive verb', d: ['an intransitive verb', 'a linking verb', 'a modal verb'] },
  ],
  // day 43
  [
    { c: L, t: 1, q: "What do you call a word that names a place, like 'school'?", a: 'a noun', d: ['a verb', 'an adverb', 'an adjective'] },
    { c: L, t: 2, q: 'Which sentence uses a hyphen correctly?', a: 'Her ex-husband lives in Denver.', d: ['She is a self taught-painter.', 'He wore a bright-red, hat.', 'They live in a well kept-house.'] },
    { c: L, t: 3, q: 'Which sentence follows American style for a comma and a quotation?', a: `We sang "Happy Birthday," and then we ate cake.`, d: [`He yelled "Stop", and the car stopped.`, `She called it "a mess", then she left.`, `The sign said "Exit", so we left.`] },
    { c: L, t: 4, q: "What are words like 'very' and 'extremely' called when they strengthen an adjective?", a: 'intensifiers', d: ['articles', 'conjunctions', 'interjections'] },
    { c: L, t: 5, q: "What is the term for an adjective that follows its noun, as in 'attorney general'?", a: 'postpositive', d: ['predicate', 'appositive', 'attributive'] },
  ],
  // day 44
  [
    { c: L, t: 1, q: 'Which contraction is written correctly?', a: "they're", d: ["theyr'e", "the'yre", "theyre'"] },
    { c: L, t: 2, q: "Without its hyphen, 'a man-eating shark' could be misread as what?", a: 'a man who is eating shark', d: ['a shark that eats people', 'a shark with no teeth', 'a man shaped like a shark'] },
    { c: L, t: 3, q: 'Which sentence is punctuated correctly?', a: 'This is, of course, only a test.', d: ['It is of course, too late.', 'We are, of course too tired.', 'She, of course is right.'] },
    { c: L, t: 4, q: "In 'We left when the bell rang,' what is 'when the bell rang'?", a: 'an adverb clause', d: ['a noun clause', 'an adjective clause', 'an independent clause'] },
    { c: L, t: 5, q: "In 'Had I known, I would have called,' which word does the inverted 'Had I' stand in for?", a: 'if', d: ['then', 'when', 'because'] },
  ],
  // day 45
  [
    { c: L, t: 1, q: 'Which sentence has the right end mark?', a: 'Please feed the cat.', d: ['Is the cat hungry.', 'Who fed the cat.', 'Did you feed the cat.'] },
    { c: L, t: 2, q: 'Which sentence uses quotation marks correctly?', a: `Ana whispered, "The baby is asleep."`, d: [`Leo shouted "Come here"!`, `Mom said, "dinner is ready."`, `"I am hungry, said Max."`] },
    { c: L, t: 3, q: "What is the problem in 'When Jo met Ann, she smiled'?", a: 'It is unclear who smiled', d: ['The verb is in the wrong tense', 'It needs a semicolon', 'It is a sentence fragment'] },
    { c: L, t: 4, q: "In 'I'd already left,' what does 'I'd' stand for?", a: 'I had', d: ['I would', 'I did', 'I should'] },
    { c: L, t: 5, q: "What is the term for one word applied to two others in different senses, as in 'She lost her keys and her temper'?", a: 'zeugma', d: ['chiasmus', 'anaphora', 'litotes'] },
  ],
  // day 46
  [
    { c: L, t: 1, q: 'In the middle of a sentence, which of these always needs a capital letter?', a: 'Florida', d: ['ocean', 'city', 'mountain'] },
    { c: L, t: 2, q: 'Which sentence uses a comma correctly after an introductory word?', a: 'Finally, the bus arrived.', d: ['Suddenly the lights, went out.', 'Later, we, ate dinner.', 'Sadly the, game was canceled.'] },
    { c: L, t: 3, q: "In 'Sam's leaving early,' what does 'Sam's' mean?", a: "a contraction of 'Sam is'", d: ["a possessive of 'Sam'", "a contraction of 'Sam was'", "a plural of 'Sam'"] },
    { c: L, t: 4, q: 'Which mark shows that words were left out of a quotation?', a: 'an ellipsis', d: ['a bracket', 'a slash', 'an asterisk'] },
    { c: L, t: 5, q: "In 'She has been working all day,' what tense is 'has been working'?", a: 'present perfect progressive', d: ['past perfect', 'present progressive', 'simple past'] },
  ],
  // day 47
  [
    { c: L, t: 1, q: 'Which of these words is an adverb?', a: 'loudly', d: ['noise', 'listen', 'noisy'] },
    { c: L, t: 2, q: 'Which sentence correctly ends with a question mark?', a: 'Where is the nearest bus stop?', d: ['I wonder where the bus stop is?', 'Tell me where the bus stop is?', 'She asked where the bus stop was?'] },
    { c: L, t: 3, q: "What are 'a' and 'an' called?", a: 'indefinite articles', d: ['definite articles', 'pronouns', 'prepositions'] },
    { c: L, t: 4, q: 'Which sentence uses an apostrophe correctly?', a: `Everyone else's bags arrived on time.`, d: [`Everyones' bags arrived late.`, `Everyone's else bags were lost.`, `Everyone elses bags were wet.`] },
    { c: L, t: 5, q: "In 'Unfortunately, it rained,' what is 'Unfortunately'?", a: 'a sentence adverb', d: ['a conjunction', 'an interjection', 'a preposition'] },
  ],
  // day 48
  [
    { c: L, t: 1, q: "Which is the correct short form of 'Mister' before a name?", a: 'Mr.', d: ['Mis.', 'Mst.', 'Mtr.'] },
    { c: L, t: 2, q: 'Which sentence is capitalized correctly?', a: 'My cousin is a Buddhist.', d: ['Our neighbors are catholic.', 'She reads the bible every night.', 'He is learning about islam.'] },
    { c: L, t: 3, q: 'Which sentence correctly joins two complete thoughts?', a: 'The bell rang, and the students left.', d: ['The rain stopped, we went out.', 'The dog barked the cat ran.', 'Jo sang, and, Ann danced.'] },
    { c: L, t: 4, q: "In 'Who called you?' what kind of pronoun is 'Who'?", a: 'an interrogative pronoun', d: ['a relative pronoun', 'a demonstrative pronoun', 'a personal pronoun'] },
    { c: L, t: 5, q: "What is the term for words like 'the' and 'my' that come before a noun to specify it?", a: 'determiners', d: ['conjunctions', 'complements', 'auxiliaries'] },
  ],
  // day 49
  [
    { c: L, t: 1, q: 'Which of these is a complete sentence?', a: 'The puppy chased its tail.', d: ['Chasing its tail in circles.', 'The puppy with brown spots.', 'When the puppy ran away.'] },
    { c: L, t: 2, q: 'Which word has its apostrophe in the right place?', a: "o'clock", d: ["oc'lock", "oclock'", "o'cloc'k"] },
    { c: L, t: 3, q: "In the command 'Sing louder!' what is the subject?", a: "an understood 'you'", d: ['Sing', 'louder', 'there is none'] },
    { c: L, t: 4, q: "What is the term for a verb plus a small word that together act as one verb, like 'give up'?", a: 'a phrasal verb', d: ['a modal verb', 'a linking verb', 'an infinitive'] },
    { c: L, t: 5, q: "In 'The coach said that we won,' what mood is 'won'?", a: 'indicative', d: ['subjunctive', 'imperative', 'conditional'] },
  ],
  // day 50
  [
    { c: L, t: 1, q: 'Which of these words is a pronoun?', a: 'they', d: ['window', 'jump', 'green'] },
    { c: L, t: 2, q: 'Which of these sentences gives a command?', a: 'Put your shoes by the door.', d: ['Your shoes are by the door.', 'Are your shoes by the door?', 'Where are your shoes?'] },
    { c: L, t: 3, q: "Which of these nouns cannot be counted, so it takes 'much' rather than 'many'?", a: 'furniture', d: ['chair', 'table', 'lamp'] },
    { c: L, t: 4, q: "In 'The girl with red hair waved,' what is 'with red hair'?", a: 'an adjective phrase', d: ['an adverb phrase', 'a noun phrase', 'a verb phrase'] },
    { c: L, t: 5, q: "What is the term for turning a statement around for emphasis, as in 'Never have I seen such rain'?", a: 'inversion', d: ['ellipsis', 'apposition', 'asyndeton'] },
  ],
  // day 51
  [
    { c: L, t: 1, q: "What do you call a word that describes a noun, like 'tall' or 'shiny'?", a: 'an adjective', d: ['a verb', 'a pronoun', 'a preposition'] },
    { c: L, t: 2, q: 'Which phrase is hyphenated correctly?', a: 'a sugar-free drink', d: ['a fast moving-train', 'a well dressed-man', 'a hard working-crew'] },
    { c: L, t: 3, q: 'Which sentence wrongly puts a comma between a subject and its verb?', a: 'The tall man in the gray coat, waved at us.', d: ['The short woman in the red hat waved at us.', 'Smiling, the tall man waved at us.', 'The man waved, and we waved back.'] },
    { c: L, t: 4, q: "In 'She taught herself to knit,' what kind of pronoun is 'herself'?", a: 'a reflexive pronoun', d: ['an intensive pronoun', 'a relative pronoun', 'a demonstrative pronoun'] },
    { c: L, t: 5, q: "In 'They are swimming,' what is 'swimming'?", a: 'a present participle', d: ['a gerund', 'an infinitive', 'a past participle'] },
  ],
  // day 52
  [
    { c: L, t: 1, q: 'Which sentence is written correctly?', a: 'I have a dog and a cat.', d: ['i have a fish and a bird.', 'We have a Hamster.', 'my brother has a turtle.'] },
    { c: L, t: 2, q: "In 'Grandpa snored all night,' what is 'Grandpa'?", a: 'the subject', d: ['the verb', 'the object', 'the predicate'] },
    { c: L, t: 3, q: "What is the term for the form of a pronoun that shows its job, like 'he' versus 'him'?", a: 'case', d: ['tense', 'mood', 'voice'] },
    { c: L, t: 4, q: 'Which sentence punctuates an interrupted quotation correctly?', a: `"If you hurry," she said, "we can catch the bus."`, d: [`"When it rains" he said, "we stay in."`, `"If you call," she said. "we can talk."`, `"Before you go," Mom said, "Grab a coat."`] },
    { c: L, t: 5, q: "In 'Whom did you invite?' what is 'Whom'?", a: 'the direct object', d: ['the subject', 'the indirect object', 'the predicate nominative'] },
  ],
  // day 53
  [
    { c: L, t: 1, q: 'Which sentence is capitalized correctly?', a: 'Dr. Patel works at the hospital.', d: ['dr. Lee works at the clinic.', 'Dr. Kim works at the Hospital.', 'The Doctor works at the clinic.'] },
    { c: L, t: 2, q: 'Which mark can join two complete sentences into one without a conjunction?', a: 'a semicolon', d: ['a comma', 'an apostrophe', 'a hyphen'] },
    { c: L, t: 3, q: "In 'The kids are playing outside,' what is 'are'?", a: 'a helping verb', d: ['a linking verb', 'an adverb', 'a pronoun'] },
    { c: L, t: 4, q: 'Which word means to put your name on a contract once more?', a: 're-sign', d: ['resign', 'resigned', 'design'] },
    { c: L, t: 5, q: "What is the term for reversing the order of words in two parallel phrases, as in 'Fair is foul, and foul is fair'?", a: 'chiasmus', d: ['anaphora', 'asyndeton', 'zeugma'] },
  ],
  // day 54
  [
    { c: L, t: 1, q: "Which is the correct contraction of 'should not'?", a: "shouldn't", d: ["should'nt", "shoul'dnt", "shouldnt'"] },
    { c: L, t: 2, q: 'What is the term for the form of a verb that shows time, like past or future?', a: 'tense', d: ['mood', 'voice', 'case'] },
    { c: L, t: 3, q: 'Which sentence is capitalized correctly?', a: 'We studied the Middle Ages in history class.', d: ['She loves the Spring and the Fall.', 'He took Biology last year.', 'I read about the renaissance in art class.'] },
    { c: L, t: 4, q: "In 'Her goal is to win,' how is 'to win' used?", a: 'as a noun', d: ['as an adverb', 'as an adjective', 'as a verb'] },
    { c: L, t: 5, q: "What is the term for a pronoun like 'each other'?", a: 'a reciprocal pronoun', d: ['a reflexive pronoun', 'an intensive pronoun', 'a relative pronoun'] },
  ],
  // day 55
  [
    { c: L, t: 1, q: 'What do you call a group of words that expresses a complete thought?', a: 'a sentence', d: ['a phrase', 'a fragment', 'a syllable'] },
    { c: L, t: 2, q: 'Which sentence is capitalized correctly?', a: 'We saw the Statue of Liberty in New York.', d: ['We climbed the eiffel Tower in Paris.', 'Our class visited the white house.', 'We hiked the grand Canyon last May.'] },
    { c: L, t: 3, q: "What is the rule that makes us write 'She runs' but 'They run'?", a: 'subject-verb agreement', d: ['parallel structure', 'pronoun case', 'verb tense'] },
    { c: L, t: 4, q: 'Which greeting is punctuated correctly for a formal business letter?', a: 'Dear Ms. Park:', d: ['Dear Mr. Shaw;', 'Dear: Dr. Reyes', 'Dear Mrs. Diaz.'] },
    { c: L, t: 5, q: "In 'This coat is warm,' what is 'This'?", a: 'a demonstrative adjective', d: ['a demonstrative pronoun', 'a relative pronoun', 'a personal pronoun'] },
  ],
  // day 56
  [
    { c: L, t: 1, q: 'Which of these contractions is spelled correctly?', a: "you'll", d: ["youl'l", "yo'ull", "you'l"] },
    { c: L, t: 2, q: 'What is the term for a group of words that has its own subject and verb?', a: 'a clause', d: ['a phrase', 'an article', 'a modifier'] },
    { c: L, t: 3, q: "In 'Someone left the gate open,' what kind of pronoun is 'Someone'?", a: 'an indefinite pronoun', d: ['a personal pronoun', 'a relative pronoun', 'a reflexive pronoun'] },
    { c: L, t: 4, q: "In 'The dog barked and ran away,' what is 'barked and ran away'?", a: 'a compound predicate', d: ['a compound subject', 'a direct object', 'a dependent clause'] },
    { c: L, t: 5, q: "What is the term for a noun used to modify another noun, as in 'chicken soup'?", a: 'a noun adjunct', d: ['a gerund', 'an appositive', 'a determiner'] },
  ],
  // day 57
  [
    { c: L, t: 1, q: 'Which of these words is a preposition?', a: 'beneath', d: ['happy', 'sing', 'slowly'] },
    { c: L, t: 2, q: "What do you call a word that takes the place of a noun, like 'he' or 'it'?", a: 'a pronoun', d: ['an adverb', 'a conjunction', 'an article'] },
    { c: L, t: 3, q: 'What is the term for a question asked for effect, with no answer expected?', a: 'a rhetorical question', d: ['an indirect question', 'a tag question', 'a leading question'] },
    { c: L, t: 4, q: "What is the term for a clause beginning with 'if,' as in 'if it rains'?", a: 'a conditional clause', d: ['a relative clause', 'a noun clause', 'an independent clause'] },
    { c: L, t: 5, q: "What is the term for using more words than needed, as in 'free gift'?", a: 'pleonasm', d: ['oxymoron', 'euphemism', 'malapropism'] },
  ],
  // day 58
  [
    { c: L, t: 1, q: "Which is the correct contraction of 'we have'?", a: "we've", d: ["wev'e", "w'eve", "we'v"] },
    { c: L, t: 2, q: 'Which sentence is capitalized correctly?', a: 'My uncle is a doctor in Ohio.', d: ['Her Aunt is a Teacher.', 'My cousin is a nurse in texas.', 'Our Grandpa was a Farmer.'] },
    { c: L, t: 3, q: "In 'That bike is mine,' what kind of pronoun is 'mine'?", a: 'a possessive pronoun', d: ['a demonstrative pronoun', 'a reflexive pronoun', 'an indefinite pronoun'] },
    { c: L, t: 4, q: "In 'It's cold, isn't it?' what is 'isn't it'?", a: 'a tag question', d: ['a rhetorical question', 'an indirect question', 'an appositive'] },
    { c: L, t: 5, q: "What mood is the verb in 'Long live the king'?", a: 'subjunctive', d: ['indicative', 'conditional', 'interrogative'] },
  ],
  // day 59
  [
    { c: L, t: 1, q: 'Which of these is a compound word?', a: 'sunflower', d: ['sunny', 'flowers', 'sundae'] },
    { c: L, t: 2, q: "What is 'Dr.' in 'Dr. Lee' an example of?", a: 'an abbreviation', d: ['an acronym', 'an initial', 'a compound word'] },
    { c: L, t: 3, q: 'Which sentence has a dangling or misplaced modifier?', a: 'Covered in mud, Mom made the dog stay outside.', d: ['Covered in mud, the dog had to stay outside.', 'Mom made the muddy dog stay outside.', 'The dog was covered in mud, so Mom kept it outside.'] },
    { c: L, t: 4, q: "In 'Whose coat is this?' what case is 'Whose'?", a: 'possessive', d: ['objective', 'subjective', 'reflexive'] },
    { c: L, t: 5, q: "In 'I have three dogs, all of whom bark,' what is 'all of whom bark'?", a: 'a relative clause', d: ['an absolute phrase', 'an appositive', 'an independent clause'] },
  ],
  // day 60
  [
    { c: L, t: 1, q: `Which sentence uses a capital letter correctly for a pet's name?`, a: 'Our dog Rex loves the park.', d: ['Our cat fluffy sleeps all day.', 'My Fish is named Bubbles.', 'Her bird named pip sings.'] },
    { c: L, t: 2, q: "What is 'NASA' an example of?", a: 'an acronym', d: ['a contraction', 'a compound word', 'a prefix'] },
    { c: L, t: 3, q: 'Which of these is a complex sentence?', a: 'We stayed inside because it was raining.', d: ['We stayed inside, and it rained.', 'It rained all day long.', 'It rained; we stayed inside.'] },
    { c: L, t: 4, q: "How many clauses are in 'When the rain stopped, we went out and played'?", a: 'two', d: ['one', 'three', 'four'] },
    { c: L, t: 5, q: "In 'It is snowing,' what is 'It'?", a: 'a dummy subject', d: ['an antecedent', 'an appositive', 'a gerund'] },
  ],
  // day 61
  [
    { c: L, t: 1, q: 'Which of these words is a conjunction?', a: 'and', d: ['table', 'quickly', 'blue'] },
    { c: L, t: 2, q: "In 'We met on Friday,' what kind of noun is 'Friday'?", a: 'a proper noun', d: ['a common noun', 'a plural noun', 'a collective noun'] },
    { c: L, t: 3, q: "In 'She is reading a book,' what tense is 'is reading'?", a: 'present progressive', d: ['simple present', 'past progressive', 'present perfect'] },
    { c: L, t: 4, q: "Which sentence uses commas correctly around 'however'?", a: 'The plan, however, was never tried.', d: ['The trip however, was fun.', 'Her idea, however was bold.', 'The cost, however was, high.'] },
    { c: L, t: 5, q: "What is the term for a verb like 'know' or 'own' that describes a state, not an action?", a: 'a stative verb', d: ['a dynamic verb', 'a modal verb', 'a phrasal verb'] },
  ],
  // day 62
  [
    { c: L, t: 1, q: "Which is the correct contraction of 'does not'?", a: "doesn't", d: ["does'nt", "doesnt'", "doe'snt"] },
    { c: L, t: 2, q: 'Which sentence uses an exclamation point correctly?', a: 'Look out for that car!', d: ['Is it raining outside!', 'Could you pass the salt!', 'What time does the store open!'] },
    { c: L, t: 3, q: 'Which sentence capitalizes a quotation correctly?', a: `Mom asked, "Where are my keys?"`, d: [`Dad said, "we are late."`, `She yelled, "Watch Out!"`, `Tom asked, "Can I Come?"`] },
    { c: L, t: 4, q: 'Which sentence places the period correctly with parentheses?', a: 'I left early (I was tired).', d: ['She called (twice.)', 'We won (barely.)', 'He laughed. (loudly)'] },
    { c: L, t: 5, q: "What is the term for an adverb with no '-ly' ending, like 'fast' in 'She runs fast'?", a: 'a flat adverb', d: ['a sentence adverb', 'a conjunctive adverb', 'a relative adverb'] },
  ],
  // day 63
  [
    { c: L, t: 1, q: "Which is the abbreviation for 'Street' in an address?", a: 'St.', d: ['Str.', 'Sr.', 'Stt.'] },
    { c: L, t: 2, q: 'Which contraction is written the standard way?', a: "would've", d: ["would of", "wouldv'e", "woul'dve"] },
    { c: L, t: 3, q: "In 'a little-used road,' what does the hyphen tell you?", a: 'The road is rarely used', d: ['The road is small', 'The road is old and worn', 'The road is narrow'] },
    { c: L, t: 4, q: 'Which sentence contains a linking verb?', a: 'Grandpa became a pilot.', d: ['Grandpa flew a plane.', 'Grandpa landed safely.', 'Grandpa waved at us.'] },
    { c: L, t: 5, q: "In 'Having finished the race, she rested,' what is 'Having finished'?", a: 'a perfect participle', d: ['a present participle', 'a past participle', 'a gerund'] },
  ],
  // day 64
  [
    { c: L, t: 1, q: 'Which of these names one specific place, so it needs capital letters?', a: 'Yellowstone National Park', d: ['a national park', 'the big park', 'a park ranger'] },
    { c: L, t: 2, q: 'Which of these is NOT a complete sentence?', a: 'Since the store closed early.', d: ['The store closed early.', 'We left when the store closed.', 'Close the store early.'] },
    { c: L, t: 3, q: "In 'Jo is taller than her brother,' what degree is 'taller'?", a: 'comparative', d: ['superlative', 'positive', 'absolute'] },
    { c: L, t: 4, q: 'Which sentence has a misplaced modifier?', a: 'I saw a deer driving to work this morning.', d: ['Driving to work this morning, I saw a deer.', 'I saw a deer while I was driving to work.', 'This morning on my drive to work, I saw a deer.'] },
    { c: L, t: 5, q: "In 'The letter was written by my uncle,' what is 'by my uncle'?", a: 'the agent', d: ['the patient', 'the complement', 'the antecedent'] },
  ],
  // day 65
  [
    { c: L, t: 1, q: 'Which of these words is a noun?', a: 'friendship', d: ['friendly', 'befriend', 'kindly'] },
    { c: L, t: 2, q: 'What is the term for the part of a sentence that tells what the subject does or is?', a: 'the predicate', d: ['the object', 'the modifier', 'the article'] },
    { c: L, t: 3, q: 'What does a colon usually tell a reader?', a: 'An explanation or list follows', d: ['The sentence is over', 'A question is coming', 'A quotation has ended'] },
    { c: L, t: 4, q: "In 'The baby slept,' what kind of verb is 'slept'?", a: 'an intransitive verb', d: ['a transitive verb', 'a linking verb', 'a helping verb'] },
    { c: L, t: 5, q: "What is the term for a question reported inside a statement, like 'where he went' in 'I wonder where he went'?", a: 'an indirect question', d: ['a rhetorical question', 'a tag question', 'an echo question'] },
  ],
  // day 66
  [
    { c: L, t: 1, q: 'Which of these is best ended with an exclamation point?', a: 'What a huge wave that was', d: ['I wonder how big the wave was', 'The wave was about six feet tall', 'She asked how big the wave was'] },
    { c: L, t: 2, q: "In 'Kim's dog barks,' what does the apostrophe show?", a: 'The dog belongs to Kim', d: ['Kim is a dog', 'There are many Kims', 'A letter is missing'] },
    { c: L, t: 3, q: "What kind of sentence is 'The library opens at nine'?", a: 'declarative', d: ['imperative', 'exclamatory', 'interrogative'] },
    { c: L, t: 4, q: "What do you call a describing word formed from a name, like 'Texan' or 'Victorian'?", a: 'a proper adjective', d: ['a common adjective', 'a collective adjective', 'a compound adjective'] },
    { c: L, t: 5, q: "What is the term for adjectives that each modify a noun equally, like 'cold' and 'rainy' in 'a cold, rainy day'?", a: 'coordinate adjectives', d: ['cumulative adjectives', 'compound adjectives', 'predicate adjectives'] },
  ],
  // day 67
  [
    { c: L, t: 1, q: "What do you call a shortened word like 'isn't' or 'we'll'?", a: 'a contraction', d: ['a compound word', 'an acronym', 'a prefix'] },
    { c: L, t: 2, q: 'Which sentence is capitalized correctly?', a: 'We hung stockings on Christmas Eve.', d: ['We open gifts on christmas morning.', 'Santa comes on Christmas eve.', 'We sang Carols by the tree.'] },
    { c: L, t: 3, q: "In 'Snow fell, and the children cheered,' what joins the two clauses?", a: 'a comma and a conjunction', d: ['a semicolon', 'a colon', 'a comma alone'] },
    { c: L, t: 4, q: 'Which sentence has its subject after the verb?', a: 'Here comes the bus.', d: ['The bus comes here.', 'The bus is here now.', 'We see the bus.'] },
    { c: L, t: 5, q: "In 'Let him go,' what is 'go'?", a: 'a bare infinitive', d: ['a gerund', 'a participle', 'an imperative'] },
  ],
  // day 68
  [
    { c: L, t: 1, q: "Which is the correct contraction of 'is not'?", a: "isn't", d: ["is'nt", "isnt'", "i'snt"] },
    { c: L, t: 2, q: 'Which sentence uses an apostrophe correctly?', a: `We left cookies on Santa's plate.`, d: [`The elf's were busy.`, `We wrapped the gift's.`, `Rudolphs nose was bright red.`] },
    { c: L, t: 3, q: 'Which of these is an interrogative sentence?', a: 'Did you lock the door?', d: ['Lock the door.', 'I locked the door.', 'What a heavy door that is!'] },
    { c: L, t: 4, q: "In 'The gift, which came late, was lovely,' what is 'which came late'?", a: 'a nonrestrictive clause', d: ['a restrictive clause', 'an independent clause', 'a noun clause'] },
    { c: L, t: 5, q: "What is the term for ending clause after clause with the same words, as in 'of the people, by the people, for the people'?", a: 'epistrophe', d: ['anaphora', 'chiasmus', 'zeugma'] },
  ],
  // day 69
  [
    { c: L, t: 1, q: 'Which of these is a plural noun?', a: 'boxes', d: ['box', 'boxing', 'boxy'] },
    { c: L, t: 2, q: 'Which sentence is capitalized correctly?', a: 'We read a poem by Robert Frost.', d: ['She loves books by roald Dahl.', 'My Teacher read us a story.', 'we read a play by Shakespeare.'] },
    { c: L, t: 3, q: 'Which sentence uses commas correctly around the name of the person spoken to?', a: `I think, Ben, that you're right.`, d: ['Please Ben, sit down.', 'Thank you Ben, for coming.', 'Ben, listen, to me.'] },
    { c: L, t: 4, q: "What is the term for nouns like 'water' and 'rice' that cannot be counted?", a: 'mass nouns', d: ['abstract nouns', 'collective nouns', 'proper nouns'] },
    { c: L, t: 5, q: "What is the term for an ending like the '-ed' in 'walked' that marks tense?", a: 'an inflection', d: ['a prefix', 'a root', 'a compound'] },
  ],
  // day 70
  [
    { c: L, t: 1, q: 'Which sentence uses capital letters correctly?', a: 'My teacher is Mrs. Lopez.', d: ['Our coach is mr. Brown.', 'My aunt is named sara.', 'Our neighbor is Mr. reed.'] },
    { c: L, t: 2, q: "Which is the correct contraction of 'I would'?", a: "I'd", d: ["Id'", "I'ld", "I'wd"] },
    { c: L, t: 3, q: 'Which of these is a prepositional phrase?', a: 'across the busy street', d: ['running very fast', 'because it rained', 'the busy old street'] },
    { c: L, t: 4, q: "What is the term for a main verb plus its helpers, like 'will have gone'?", a: 'a verb phrase', d: ['a noun phrase', 'a clause', 'a predicate adjective'] },
    { c: L, t: 5, q: "In 'It rained all night,' what is the term for a verb like 'rained' that has no real doer?", a: 'an impersonal verb', d: ['a reflexive verb', 'a modal verb', 'a phrasal verb'] },
  ],
  // day 71
  [
    { c: L, t: 1, q: 'Which of these words is an adjective?', a: 'noisy', d: ['noise', 'noisily', 'noises'] },
    { c: L, t: 2, q: 'Which sentence uses an apostrophe correctly?', a: `The students' desks were in rows.`, d: [`The student's are in class.`, `Our teachers's desk is tidy.`, `The class'es desks are new.`] },
    { c: L, t: 3, q: 'Which sentence is in the passive voice?', a: 'The window was broken by the storm.', d: ['The storm broke the window.', 'The window broke in the storm.', 'The storm is breaking windows.'] },
    { c: L, t: 4, q: "In 'I want to go,' what is 'to'?", a: 'an infinitive marker', d: ['a preposition', 'an adverb', 'a conjunction'] },
    { c: L, t: 5, q: "What is the term for a sentence like 'It was Jo who called,' which splits a statement to stress one part?", a: 'a cleft sentence', d: ['a periodic sentence', 'a fused sentence', 'a loose sentence'] },
  ],
  // day 72
  [
    { c: L, t: 1, q: 'Which sentence begins and ends correctly?', a: 'The bus is late.', d: ['my bus is late.', 'Our bus is late', 'the train is late'] },
    { c: L, t: 2, q: 'Which of these sentences is in the past tense?', a: 'We walked to school.', d: ['We walk to school.', 'We will walk to school.', 'We are walking to school.'] },
    { c: L, t: 3, q: 'Which of these words is a coordinating conjunction?', a: 'yet', d: ['because', 'although', 'unless'] },
    { c: L, t: 4, q: 'Which sentence correctly sets off a nonessential appositive at the end?', a: 'I met my neighbor, a retired pilot.', d: ['We saw my uncle a, baker.', 'She called, her friend a nurse.', 'He thanked his coach a, former star.'] },
    { c: L, t: 5, q: "In 'We will be traveling all day,' what tense is 'will be traveling'?", a: 'future progressive', d: ['future perfect', 'present progressive', 'simple future'] },
  ],
  // day 73
  [
    { c: L, t: 1, q: "Which is the correct contraction of 'had not'?", a: "hadn't", d: ["had'nt", "hadnt'", "ha'dnt"] },
    { c: L, t: 2, q: 'Which sentence has a plural subject?', a: 'The dogs bark at night.', d: ['The dog barks at night.', 'My cat sleeps all day.', 'A bird sings outside.'] },
    { c: L, t: 3, q: "In 'We left early,' what person is 'We'?", a: 'first person', d: ['second person', 'third person', 'plural person'] },
    { c: L, t: 4, q: 'Which sentence uses apostrophes correctly?', a: `It's time for the dog's walk.`, d: [`Its time for the dog's walk.`, `It's time for the dogs's walk.`, `It's time for the dogs walk.`] },
    { c: L, t: 5, q: "What is the term for a noun like 'scissors' that is used only in the plural?", a: 'plurale tantum', d: ['a collective noun', 'a mass noun', 'a proper noun'] },
  ],
  // day 74
  [
    { c: L, t: 1, q: 'Which of these words always starts with a capital letter?', a: 'Saturday', d: ['weekend', 'sunset', 'midnight'] },
    { c: L, t: 2, q: 'Which sentence is written correctly?', a: `We stayed up late on New Year's Eve.`, d: [`Our party is on new year's eve.`, `We stayed up for New Years' Eve.`, `Fireworks lit up New Years Eve.`] },
    { c: L, t: 3, q: 'Which sentence uses a semicolon correctly?', a: 'The road was icy; we drove slowly.', d: ['The road; was icy.', 'Because it snowed; we stayed in.', 'We drove slowly; and carefully.'] },
    { c: L, t: 4, q: 'Which sentence uses a colon correctly?', a: 'We made two resolutions: read more and sleep more.', d: ['My goals are: run and swim.', 'We need: hats and horns.', 'Bring: snacks and drinks.'] },
    { c: L, t: 5, q: "In 'By midnight the old year will have ended,' what tense is 'will have ended'?", a: 'future perfect', d: ['future progressive', 'present perfect', 'past perfect'] },
  ],
];
