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
export const LANE_DAYS = [
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
