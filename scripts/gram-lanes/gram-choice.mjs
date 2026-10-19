// Gram lane: Word Choice. 36 days x 5 tiers.
// Scope: choosing the right word in a sentence. Confusables (affect/effect,
// who/whom, lie/lay, fewer/less, their/there, than/then, between/among, I/me,
// complement/compliment, principal/principle and many more), subject-verb
// agreement, pronoun case, irregular verb forms, tense and mood (the
// subjunctive), comparatives and superlatives, adjective vs adverb.
// Not here: punctuation, capitalization, sentence structure, grammar terms.
// Never asked: anything Merriam-Webster, AP and Chicago treat as acceptable
// both ways (than I/me, who for whom in speech, feel badly, farther/further,
// dove/dived, proved/proven, sunk/sank, singular they, data, and so on).
const c = 'Word Choice';
export const LANE_DAYS = [
  // day 1
  [
    { c, t: 1, q: "Which sentence is correct?", a: "The kids left their bikes in the yard.", d: ["The kids left there bikes in the yard.", "The kids left they're bikes in the yard.", "The kids left thier bikes in the yard."] },
    { c, t: 2, q: "Which sentence is correct?", a: "He and I walked to the park after lunch.", d: ["Him and me walked to the park after lunch.", "Him and I walked to the park after lunch.", "He and me walked to the park after lunch."] },
    { c, t: 3, q: "Which sentence uses 'infer' correctly?", a: "From her silence, I inferred that she was upset.", d: ["Are you inferring that I lied?", "His frown inferred that he disagreed.", "The note inferred a threat without stating it."] },
    { c, t: 4, q: "Which word completes the sentence: 'New employees are expected to ___ the line'?", a: "toe", d: ["tow", "towed", "toes"] },
    { c, t: 5, q: "Which sentence is grammatically correct?", a: "Many a sailor has been lost on that reef.", d: ["Many a sailor have been lost on that reef.", "Many a sailor are lost on that reef.", "Many a sailor were lost on that reef."] },
  ],
  // day 2
  [
    { c, t: 1, q: "Which word completes the sentence: '___ going to love this movie'?", a: "You're", d: ["Your", "Yore", "You"] },
    { c, t: 2, q: "Which word completes the sentence: 'Last year she ___ the team to a championship'?", a: "led", d: ["lead", "leaded", "lade"] },
    { c, t: 3, q: "Which sentence is correct?", a: "I walk my dog around the block every day.", d: ["I walk my dog around the block everyday.", "I walk my dog around the block every days.", "I walk my dog around the block everyday's."] },
    { c, t: 4, q: "Which sentence uses 'peddle' correctly?", a: "Street vendors peddle souvenirs near the museum.", d: ["Peddle harder to get up the hill.", "My bike's left peddle is loose.", "She peddled her tricycle down the driveway."] },
    { c, t: 5, q: "What belongs in the blank: 'The guests, most of ___ arrived late, loved the food'?", a: "whom", d: ["who", "them", "which"] },
  ],
  // day 3
  [
    { c, t: 1, q: "Which word completes the sentence: 'Add two cups of ___ to the mixing bowl'?", a: "flour", d: ["flower", "floor", "flair"] },
    { c, t: 2, q: "Which sentence uses 'accept' correctly?", a: "She was happy to accept the job offer.", d: ["Everyone accept Sam finished early.", "All the stores are open accept the bakery.", "I like every fruit accept bananas."] },
    { c, t: 3, q: "Which sentence uses 'stationery' correctly?", a: "She wrote the thank-you note on fancy stationery.", d: ["The car remained stationery at the red light.", "Keep the ladder stationery while I climb.", "The exercise bike is stationery, so it never moves."] },
    { c, t: 4, q: "Which word completes the sentence: 'She bowed ___ to the judge'?", a: "respectfully", d: ["respectively", "respectably", "respectable"] },
    { c, t: 5, q: "Which word completes the sentence: 'The wildfire ___ thousands of acres of forest'?", a: "ravaged", d: ["ravished", "raveled", "rivaled"] },
  ],
  // day 4
  [
    { c, t: 1, q: "Which word completes the sentence: 'I ate ___ much cake at the party'?", a: "too", d: ["to", "two", "tow"] },
    { c, t: 2, q: "Which word completes the sentence: 'First we ate dinner, and ___ we watched a movie'?", a: "then", d: ["than", "them", "thin"] },
    { c, t: 3, q: "Which word completes the sentence: 'We saw ___ flash across the night sky'?", a: "lightning", d: ["lightening", "lightened", "lighten"] },
    { c, t: 4, q: "Which word completes the sentence: 'Pull the rope ___ before you tie the knot'?", a: "taut", d: ["taught", "taunt", "tout"] },
    { c, t: 5, q: "Which word completes the sentence: 'The ___ smell from the swamp made us gag'?", a: "noisome", d: ["noisy", "nosy", "noiseful"] },
  ],
  // day 5
  [
    { c, t: 1, q: "Which sentence is written correctly?", a: "This box is heavier than that one.", d: ["This box is heavier then that one.", "This box is heavier that that one.", "This box is heavier thin that one."] },
    { c, t: 2, q: "Which sentence is grammatically correct?", a: "Each of the boys has his own locker.", d: ["Each of the boys have his own locker.", "Each of the boys having his own locker.", "Each of the boys haves his own locker."] },
    { c, t: 3, q: "Which sentence uses 'may be' correctly?", a: "The answer may be printed in the back of the book.", d: ["May be we can go to the lake tomorrow.", "She is may be the best singer in the choir.", "I may be will come to the game later."] },
    { c, t: 4, q: "Which word completes the sentence: 'The weather ___ on the barn spun in the wind'?", a: "vane", d: ["vain", "vein", "vine"] },
    { c, t: 5, q: "Which word completes the sentence: 'The brutal heat ___ the hikers until they could barely walk'?", a: "enervated", d: ["energized", "innervated", "enumerated"] },
  ],
  // day 6
  [
    { c, t: 1, q: "Which word completes the sentence: 'Be careful not to ___ your keys'?", a: "lose", d: ["loose", "loss", "lows"] },
    { c, t: 2, q: "Which sentence uses 'advice' correctly?", a: "My uncle gave me good advice about saving money.", d: ["I advice you to leave early.", "Can you advice me on which phone to buy?", "She advices everyone to read more."] },
    { c, t: 3, q: "Which sentence uses 'capitol' correctly?", a: "Tourists toured the dome of the state capitol.", d: ["Paris is the capitol of France.", "She raised capitol for her new company.", "Write your name in capitol letters."] },
    { c, t: 4, q: "Which sentence uses 'descent' correctly?", a: "The hikers began a slow descent into the canyon.", d: ["He wore a descent suit to the interview.", "That was a descent thing to do.", "We had a descent meal at the diner."] },
    { c, t: 5, q: "Which sentence is correct?", a: "Down the steep hill come the three runners.", d: ["Down the steep hill comes the three runners.", "Down the steep hill coming the three runners.", "Down the steep hill has come the three runners."] },
  ],
  // day 7
  [
    { c, t: 1, q: "Which word completes the question: '___ jacket is this on the chair'?", a: "Whose", d: ["Who's", "Whos", "Who"] },
    { c, t: 2, q: "Which word completes the sentence: 'Please be ___ in the library'?", a: "quiet", d: ["quite", "quit", "quilt"] },
    { c, t: 3, q: "Which sentence uses 'conscious' correctly?", a: "The patient was conscious and talking after surgery.", d: ["My conscious would not let me keep the money.", "He has a guilty conscious about the lie.", "Let your conscious be your guide."] },
    { c, t: 4, q: "Which word completes the sentence: 'The oracle claimed to ___ the fall of the city'?", a: "prophesy", d: ["prophecy", "prophet", "profess"] },
    { c, t: 5, q: "Which of these sentences is correct?", a: "The captain, as well as her two mates, is on deck.", d: ["The captain, as well as her two mates, are on deck.", "The captain, as well as her two mates, were on deck.", "The captain, as well as her two mates, be on deck."] },
  ],
  // day 8
  [
    { c, t: 1, q: "Which sentence is correct?", a: "We could have won if we had practiced more.", d: ["We could of won if we had practiced more.", "We could off won if we had practiced more.", "We could has won if we had practiced more."] },
    { c, t: 2, q: "Which word completes the sentence: 'Take a deep ___ before you dive in'?", a: "breath", d: ["breathe", "breadth", "breathed"] },
    { c, t: 3, q: "Which sentence uses 'complement' correctly?", a: "The red scarf will complement your gray coat.", d: ["She paid me a nice complement on my haircut.", "He blushed at the complement from his boss.", "Thank you for the kind complement."] },
    { c, t: 4, q: "Which sentence uses 'queue' correctly?", a: "Shoppers waited in a long queue outside the store.", d: ["The pianist waited for her queue to start.", "Take your queue from the conductor.", "She missed the queue and came in late."] },
    { c, t: 5, q: "Which word completes the sentence: 'He had ___ his old friends in pursuit of fame'?", a: "forsaken", d: ["forsook", "forsaked", "forsooken"] },
  ],
  // day 9
  [
    { c, t: 1, q: "Which sentence is written correctly?", a: "We had a lot of fun at the fair.", d: ["We had alot of fun at the fair.", "We had allot of fun at the fair.", "We had a lots of fun at the fair."] },
    { c, t: 2, q: "Which word completes the sentence: 'Last night she ___ the red dress for the dance'?", a: "chose", d: ["choose", "chooses", "choosed"] },
    { c, t: 3, q: "Which word completes the sentence: 'By the time we arrived, the movie had already ___'?", a: "begun", d: ["began", "beginned", "begin"] },
    { c, t: 4, q: "Which word completes the sentence: 'The hackers caused a serious ___ of security'?", a: "breach", d: ["breech", "broach", "brooch"] },
    { c, t: 5, q: "Which word completes the sentence: 'She had ___ the burden alone for years'?", a: "borne", d: ["born", "bore", "beared"] },
  ],
  // day 10
  [
    { c, t: 1, q: "Which word completes the sentence: '___ going to the beach tomorrow'?", a: "We're", d: ["Were", "Where", "Wear"] },
    { c, t: 2, q: "Which word completes the sentence: 'Please ___ the vase gently on the table'?", a: "set", d: ["sit", "sat", "sitted"] },
    { c, t: 3, q: "Which sentence is correct?", a: "The thief had stolen three bikes before he was caught.", d: ["The thief had stole three bikes before he was caught.", "The thief had stealed three bikes before he was caught.", "The thief had steal three bikes before he was caught."] },
    { c, t: 4, q: "Which word completes the sentence: 'Yesterday afternoon, I ___ on the couch for an hour'?", a: "lay", d: ["laid", "lain", "lied"] },
    { c, t: 5, q: "Which word completes the sentence: 'Several problems had ___ before the deal closed'?", a: "arisen", d: ["arose", "arised", "arosen"] },
  ],
  // day 11
  [
    { c, t: 1, q: "Which sentence is correct?", a: "I saw a deer in the woods last night.", d: ["I seen a deer in the woods last night.", "I seed a deer in the woods last night.", "I sees a deer in the woods last night."] },
    { c, t: 2, q: "Which sentence is correct?", a: "He drives very carefully in the snow.", d: ["He drives very careful in the snow.", "He drives very carefulness in the snow.", "He drives very carefuller in the snow."] },
    { c, t: 3, q: "What belongs in the blank: 'I met the woman ___ wrote that novel'?", a: "who", d: ["whom", "which", "whose"] },
    { c, t: 4, q: "What belongs in the blank: 'Neither the coach nor the players ___ ready for the storm'?", a: "were", d: ["was", "is", "has been"] },
    { c, t: 5, q: "Which word completes the sentence: 'The grieving king lay ___ on the cold floor'?", a: "prostrate", d: ["prostate", "prosthetic", "prostated"] },
  ],
  // day 12
  [
    { c, t: 1, q: "Which sentence is grammatically correct?", a: "She has gone to the store for milk.", d: ["She has went to the store for milk.", "She has goed to the store for milk.", "She has go to the store for milk."] },
    { c, t: 2, q: "In formal writing, which sentence is correct?", a: "The soup was really good last night.", d: ["The soup was real good last night.", "The soup was reality good last night.", "The soup was realest good last night."] },
    { c, t: 3, q: "Which word completes the sentence: 'The sun ___ in the east every morning'?", a: "rises", d: ["raises", "raise", "rised"] },
    { c, t: 4, q: "Which sentence is correct?", a: "A number of students were absent on Friday.", d: ["A number of students was absent on Friday.", "A number of students is absent on Friday.", "A number of students has been absent on Friday."] },
    { c, t: 5, q: "Which word completes the sentence: 'Police used tear gas to ___ the crowd'?", a: "disperse", d: ["disburse", "dispense", "disparage"] },
  ],
  // day 13
  [
    { c, t: 1, q: "Which sentence is correct?", a: "She doesn't like peas at all.", d: ["She don't like peas at all.", "She do not like peas at all.", "She not like peas at all."] },
    { c, t: 2, q: "Which word completes the question: 'To ___ should I address this letter'?", a: "whom", d: ["who", "whose", "who's"] },
    { c, t: 3, q: "Which word completes the sentence: 'This is the ___ expensive phone in the entire store'?", a: "least", d: ["lowest", "lesser", "littlest"] },
    { c, t: 4, q: "Which word completes the sentence: 'She has ___ across that lake three times'?", a: "swum", d: ["swam", "swimmed", "swammed"] },
    { c, t: 5, q: "Which sentence is correct?", a: "If Dana was at the meeting yesterday, she heard the news.", d: ["If Dana were at the meeting yesterday, she heard the news.", "If Dana be at the meeting yesterday, she heard the news.", "If Dana is at the meeting yesterday, she heard the news."] },
  ],
  // day 14
  [
    { c, t: 1, q: "Which of these sentences is correct?", a: "We were late because of the traffic.", d: ["We was late because of the traffic.", "We is late because of the traffic.", "We be late because of the traffic."] },
    { c, t: 2, q: "Which of these sentences is correct?", a: "The coach thanked Ana and me after the game.", d: ["The coach thanked Ana and I after the game.", "The coach thanked Ana and mine after the game.", "The coach thanked Ana and my after the game."] },
    { c, t: 3, q: "Which sentence uses 'cite' correctly?", a: "Be sure to cite your sources at the end of the essay.", d: ["The construction cite is closed on Sundays.", "The canyon was a beautiful cite at dawn.", "She lost her cite in one eye after the accident."] },
    { c, t: 4, q: "Which word completes the sentence: 'Overnight, the pond had ___ solid'?", a: "frozen", d: ["froze", "freezed", "frozed"] },
    { c, t: 5, q: "Which word completes the sentence: 'When asked about the money, the witness decided to ___'?", a: "demur", d: ["demure", "demerit", "demean"] },
  ],
  // day 15
  [
    { c, t: 1, q: "Which sentence uses 'hear' correctly?", a: "Did you hear the thunder last night?", d: ["Put the box over hear by the door.", "Hear is the book you wanted.", "I live hear with my aunt."] },
    { c, t: 2, q: "Which word completes the sentence: 'There were ___ people at the game than last year'?", a: "fewer", d: ["less", "lesser", "littler"] },
    { c, t: 3, q: "Which word completes the sentence: 'All ___ must show ID badges in the lab'?", a: "personnel", d: ["personal", "personals", "personality"] },
    { c, t: 4, q: "Which word completes the sentence: 'Dark clouds warned us that a storm was ___'?", a: "imminent", d: ["eminent", "emanate", "immanent"] },
    { c, t: 5, q: "Which word completes the sentence: 'She rose at dawn, as was her ___'?", a: "wont", d: ["want", "won't", "wan"] },
  ],
  // day 16
  [
    { c, t: 1, q: "Which sentence is correct?", a: "I know the answer to that riddle.", d: ["I no the answer to that riddle.", "I now the answer to that riddle.", "I knows the answer to that riddle."] },
    { c, t: 2, q: "Which sentence uses 'principal' correctly?", a: "The principal greeted students at the front door.", d: ["Honesty is an important principal to live by.", "She refused on principal to cheat.", "The principals of physics are hard to learn."] },
    { c, t: 3, q: "Which sentence is grammatically correct?", a: "The news is better than we expected.", d: ["The news are better than we expected.", "The news were better than we expected.", "The news be better than we expected."] },
    { c, t: 4, q: "Which word completes the sentence: 'The hurricane will ___ havoc on the coast'?", a: "wreak", d: ["wreck", "reek", "wreaked"] },
    { c, t: 5, q: "Which word completes the sentence: 'The northern lights are a stunning natural ___'?", a: "phenomenon", d: ["phenomena", "phenomenons", "phenomenal"] },
  ],
  // day 17
  [
    { c, t: 1, q: "Which word completes the sentence: 'Would you like a ___ of pie'?", a: "piece", d: ["peace", "peas", "pace"] },
    { c, t: 2, q: "Which sentence is correct?", a: "By noon, she had written three pages.", d: ["By noon, she had wrote three pages.", "By noon, she had writed three pages.", "By noon, she had write three pages."] },
    { c, t: 3, q: "Which word completes the sentence: 'Please ___ to the nearest exit in an orderly line'?", a: "proceed", d: ["precede", "recede", "concede"] },
    { c, t: 4, q: "Which word completes the sentence: 'Thick fog began to ___ the harbor'?", a: "envelop", d: ["envelope", "develop", "elope"] },
    { c, t: 5, q: "What belongs in the blank: 'No sooner had we sat down ___ the phone rang'?", a: "than", d: ["then", "when", "that"] },
  ],
  // day 18
  [
    { c, t: 1, q: "Which word completes the sentence: 'We drove ___ the old school on the way home'?", a: "by", d: ["buy", "bye", "be"] },
    { c, t: 2, q: "Which word completes the sentence: 'The baby bird has ___ away from the nest'?", a: "flown", d: ["flew", "flied", "flowed"] },
    { c, t: 3, q: "Which word completes the sentence: 'The teacher handed the papers to Raj and ___'?", a: "me", d: ["I", "my", "mine"] },
    { c, t: 4, q: "Which sentence uses 'allusion' correctly?", a: "The poem makes an allusion to a Greek myth.", d: ["The mirror created the allusion of a bigger room.", "The magician's best allusion was a vanishing car.", "He had no allusions about how hard the job would be."] },
    { c, t: 5, q: "Which sentence is grammatically correct?", a: "These three criteria are used to judge every entry.", d: ["These three criteria is used to judge every entry.", "These three criteria was used to judge every entry.", "These three criteria has been used to judge every entry."] },
  ],
  // day 19
  [
    { c, t: 1, q: "Which sentence uses 'weather' correctly?", a: "The weather was too stormy for a picnic.", d: ["I can't decide weather to go or stay.", "Ask her weather she wants tea.", "We will see weather the bus is late."] },
    { c, t: 2, q: "What belongs in the blank: 'I drink ___ coffee than I used to'?", a: "less", d: ["fewer", "lesser", "least"] },
    { c, t: 3, q: "Which sentence uses 'altogether' correctly?", a: "I am not altogether sure he is right.", d: ["The kids sang altogether in the gym.", "Put the papers altogether in one pile.", "We were altogether at the party last night."] },
    { c, t: 4, q: "Which sentence uses 'elicit' correctly?", a: "The joke failed to elicit a single laugh.", d: ["Police seized elicit drugs at the border.", "He ran an elicit gambling ring.", "They were fined for elicit trading."] },
    { c, t: 5, q: "Which sentence is correct?", a: "Between you and me, the plan will never work.", d: ["Between you and I, the plan will never work.", "Between yourself and I, the plan will never work.", "Between you and we, the plan will never work."] },
  ],
  // day 20
  [
    { c, t: 1, q: "Which word completes the sentence: 'Please ___ your name at the top of the page'?", a: "write", d: ["right", "rite", "wright"] },
    { c, t: 2, q: "Which word completes the sentence: 'My cold is even ___ today than it was yesterday'?", a: "worse", d: ["worst", "badder", "more bad"] },
    { c, t: 3, q: "Which word completes the sentence: 'This homemade soup tastes ___'?", a: "good", d: ["well", "goodly", "weller"] },
    { c, t: 4, q: "Which sentence uses 'counsel' correctly?", a: "She sought legal counsel before signing the lease.", d: ["The city counsel voted to repave the road.", "He was elected to the student counsel.", "Three counsel members missed the vote."] },
    { c, t: 5, q: "Which word completes the sentence: 'The old dog had ___ in the sun all afternoon'?", a: "lain", d: ["laid", "lay", "layed"] },
  ],
  // day 21
  [
    { c, t: 1, q: "Which of these sentences is correct?", a: "Our house is the blue one on the corner.", d: ["Are house is the blue one on the corner.", "Hour house is the blue one on the corner.", "Or house is the blue one on the corner."] },
    { c, t: 2, q: "Which sentence is correct?", a: "By the time we got there, the bus had already left.", d: ["By the time we got there, the bus had all ready left.", "By the time we got there, the bus had allready left.", "By the time we got there, the bus had all readied left."] },
    { c, t: 3, q: "Which sentence is correct?", a: "We were supposed to leave at noon, but we ran late.", d: ["We were suppose to leave at noon, but we ran late.", "We were supposing to leave at noon, but we ran late.", "We were supposedly to leave at noon, but we ran late."] },
    { c, t: 4, q: "Which sentence uses 'discreet' correctly?", a: "Please be discreet about the surprise party.", d: ["The test has three discreet sections scored separately.", "Each atom is a discreet particle.", "The song breaks into four discreet movements."] },
    { c, t: 5, q: "Which word completes the sentence: 'She had ___ the keys on the counter before she left'?", a: "laid", d: ["lain", "lay", "layed"] },
  ],
  // day 22
  [
    { c, t: 1, q: "Which word completes the sentence: 'She ate the ___ pizza by herself'?", a: "whole", d: ["hole", "hall", "haul"] },
    { c, t: 2, q: "Which word completes the sentence: 'Yesterday my dad ___ home early from work'?", a: "came", d: ["come", "comed", "comes"] },
    { c, t: 3, q: "In formal writing, which word completes the sentence: 'If I ___ you, I would apologize right away'?", a: "were", d: ["was", "am", "be"] },
    { c, t: 4, q: "Which word completes the sentence: 'She ___ over the contract for hours before signing'?", a: "pored", d: ["poured", "pared", "powered"] },
    { c, t: 5, q: "Which choice fits: 'Hire the candidate ___ you believe is best qualified'?", a: "who", d: ["whom", "whomever", "whose"] },
  ],
  // day 23
  [
    { c, t: 1, q: "Which word completes the question: 'What should I ___ to the wedding'?", a: "wear", d: ["where", "were", "ware"] },
    { c, t: 2, q: "Which word completes the sentence: 'Our team played ___ in the first half but rallied'?", a: "badly", d: ["bad", "badder", "worst"] },
    { c, t: 3, q: "Which word completes the sentence: 'Of all my teachers, Ms. Lee is the ___ patient'?", a: "most", d: ["more", "mostest", "much"] },
    { c, t: 4, q: "Which sentence uses 'palate' correctly?", a: "The spicy curry was too much for his palate.", d: ["The painter mixed colors on her palate.", "The forklift lifted a wooden palate of bricks.", "Choose a palate of three colors for the logo."] },
    { c, t: 5, q: "Which word completes the sentence: 'Give the prize to ___ crosses the finish line first'?", a: "whoever", d: ["whomever", "whom", "whose"] },
  ],
  // day 24
  [
    { c, t: 1, q: "Which sentence uses 'dessert' correctly?", a: "We shared a slice of cake for dessert.", d: ["Camels can cross the dessert for days.", "The soldier tried to dessert his post.", "The dessert sun beat down on the hikers."] },
    { c, t: 2, q: "Which word completes the sentence: '___ students voted for a longer lunch break'?", a: "We", d: ["Us", "Ours", "Them"] },
    { c, t: 3, q: "Which of these sentences is correct?", a: "Please hand me those books on the top shelf.", d: ["Please hand me them books on the top shelf.", "Please hand me they books on the top shelf.", "Please hand me theirs books on the top shelf."] },
    { c, t: 4, q: "Which word completes the sentence: 'The movie trailer ___ my interest'?", a: "piqued", d: ["peaked", "peeked", "picked"] },
    { c, t: 5, q: "In edited prose, which word completes the sentence: 'The repair cost ___ than fifty dollars'?", a: "less", d: ["fewer", "lesser", "littler"] },
  ],
  // day 25
  [
    { c, t: 1, q: "Which word completes the sentence: 'He did ___ on his math test and got an A'?", a: "well", d: ["good", "gooder", "goodly"] },
    { c, t: 2, q: "Which word completes the question: '___ left the back door open last night'?", a: "Who", d: ["Whom", "Whose", "Whomever"] },
    { c, t: 3, q: "Which word completes the sentence: 'She landed the lead ___ in the school play'?", a: "role", d: ["roll", "rule", "roe"] },
    { c, t: 4, q: "Which word completes the sentence: 'Nothing seems to ___ her, not even a crowd of reporters'?", a: "faze", d: ["fazes", "phrase", "fade"] },
    { c, t: 5, q: "In formal American English, which word completes the sentence: 'The board demanded that he ___ every meeting'?", a: "attend", d: ["attends", "attended", "will attend"] },
  ],
  // day 26
  [
    { c, t: 1, q: "Which sentence is correct?", a: "This pizza is better than the one we had last week.", d: ["This pizza is more better than the one we had last week.", "This pizza is gooder than the one we had last week.", "This pizza is betterer than the one we had last week."] },
    { c, t: 2, q: "Which word completes the sentence: 'Please ___ your hand if you know the answer'?", a: "raise", d: ["rise", "rose", "rays"] },
    { c, t: 3, q: "Which word completes the sentence: 'The doctor gave me a ___ checkup'?", a: "thorough", d: ["through", "throughout", "thoroughly"] },
    { c, t: 4, q: "Which word completes the sentence: 'The coach's speech lifted team ___ before the final'?", a: "morale", d: ["moral", "morals", "mortal"] },
    { c, t: 5, q: "Which word completes the sentence: 'The students each ___ a locker of their own'?", a: "have", d: ["has", "having", "has had"] },
  ],
  // day 27
  [
    { c, t: 1, q: "Which choice fits: 'There ___ three apples left in the bowl'?", a: "are", d: ["is", "was", "be"] },
    { c, t: 2, q: "Which sentence is correct?", a: "That was the most beautiful sunset I have ever seen.", d: ["That was the beautifulest sunset I have ever seen.", "That was the more beautiful sunset I have ever seen.", "That was the most beautifulest sunset I have ever seen."] },
    { c, t: 3, q: "Which word completes the sentence: 'Use this handy ___ to open the jar'?", a: "device", d: ["devise", "devised", "devising"] },
    { c, t: 4, q: "Which sentence uses 'hoard' correctly?", a: "Squirrels hoard acorns for the winter.", d: ["A hoard of tourists filled the plaza.", "The hoard rode in from the steppe.", "We were stuck in a hoard of shoppers."] },
    { c, t: 5, q: "Which word completes the sentence: 'The new mayor promised to ___ sweeping reforms'?", a: "effect", d: ["affect", "affix", "defect"] },
  ],
  // day 28
  [
    { c, t: 1, q: "Which word completes the sentence: 'She ___ the ball across the yard to her dog'?", a: "threw", d: ["through", "thru", "throw"] },
    { c, t: 2, q: "Which of these sentences is grammatically correct?", a: "My two best friends live on my street.", d: ["My two best friends lives on my street.", "My two best friends living on my street.", "My two best friends is living on my street."] },
    { c, t: 3, q: "Which word completes the sentence: 'Queen Victoria's ___ lasted more than sixty years'?", a: "reign", d: ["rein", "rain", "reins"] },
    { c, t: 4, q: "Which sentence is correct?", a: "Every one of the plates was chipped.", d: ["Everyone of the plates was chipped.", "Everyones of the plates was chipped.", "Every ones of the plates was chipped."] },
    { c, t: 5, q: "Which word completes the sentence: 'The film's ___ battle lasted twenty minutes'?", a: "climactic", d: ["climatic", "climatized", "climatical"] },
  ],
  // day 29
  [
    { c, t: 1, q: "Which word completes the sentence: 'Everyone came to the party ___ Tom, who was sick'?", a: "except", d: ["accept", "expect", "exempt"] },
    { c, t: 2, q: "Which sentence is correct?", a: "She has brought snacks for everyone on the bus.", d: ["She has brung snacks for everyone on the bus.", "She has bringed snacks for everyone on the bus.", "She has braught snacks for everyone on the bus."] },
    { c, t: 3, q: "Which word completes the sentence: 'She sat ___ me on the bus ride home'?", a: "beside", d: ["besides", "aside", "inside"] },
    { c, t: 4, q: "Which of these sentences is correct?", a: "Ten dollars is too much to pay for a sandwich.", d: ["Ten dollars are too much to pay for a sandwich.", "Ten dollars were too much to pay for a sandwich.", "Ten dollars have been too much to pay for a sandwich."] },
    { c, t: 5, q: "Which word completes the sentence: 'Nonviolence is a central ___ of her philosophy'?", a: "tenet", d: ["tenant", "tenure", "tenement"] },
  ],
  // day 30
  [
    { c, t: 1, q: "Which sentence uses 'brake' correctly?", a: "Press the brake gently when the light turns red.", d: ["Be careful not to brake the vase.", "We took a short brake after lunch.", "Can you brake a twenty for me?"] },
    { c, t: 2, q: "Which word completes the sentence: 'My aunt ___ me how to knit last winter'?", a: "taught", d: ["teached", "thought", "tought"] },
    { c, t: 3, q: "What belongs in the blank: 'My brother and sister ___ coming to visit next week'?", a: "are", d: ["is", "was", "be"] },
    { c, t: 4, q: "In formal edited English, what goes in 'The pilot, ___ the airline had fired, filed a lawsuit'?", a: "whom", d: ["who", "whose", "which"] },
    { c, t: 5, q: "Which sentence uses 'proscribe' correctly?", a: "The school proscribed phones during final exams.", d: ["The doctor proscribed an antibiotic for my cough.", "Take the pills as proscribed on the label.", "The coach proscribed extra stretching to help my knee."] },
  ],
  // day 31
  [
    { c, t: 1, q: "Which word completes the sentence: 'Yesterday I ___ a letter to my grandmother'?", a: "wrote", d: ["writed", "written", "wroted"] },
    { c, t: 2, q: "Which word completes the sentence: 'Everyone in the class ___ finished the test'?", a: "has", d: ["have", "having", "haves"] },
    { c, t: 3, q: "Which word completes the sentence: 'I can't ___ to watch scary movies alone'?", a: "bear", d: ["bare", "beer", "bore"] },
    { c, t: 4, q: "Which sentence uses 'elude' correctly?", a: "The suspect eluded the police for a week.", d: ["In her speech she eluded to her childhood.", "He kept eluding to a secret plan.", "The author eludes to the war in chapter two."] },
    { c, t: 5, q: "Which word completes the sentence: 'After years of easy wins, the team grew ___ and lazy'?", a: "complacent", d: ["complaisant", "complimentary", "complicit"] },
  ],
  // day 32
  [
    { c, t: 1, q: "Which sentence is written correctly?", a: "In the past, the town had only one school.", d: ["In the passed, the town had only one school.", "In the pass, the town had only one school.", "In the paste, the town had only one school."] },
    { c, t: 2, q: "Which sentence uses 'aloud' correctly?", a: "She read the poem aloud to the class.", d: ["Pets are not aloud in the hotel.", "Are we aloud to leave early?", "Smoking is not aloud on the train."] },
    { c, t: 3, q: "Which word completes the sentence: 'The couple hopes to ___ a child next year'?", a: "adopt", d: ["adapt", "adept", "adjust"] },
    { c, t: 4, q: "In formal writing, which sentence is correct?", a: "I wish I were on vacation right now.", d: ["I wish I am on vacation right now.", "I wish I be on vacation right now.", "I wish I been on vacation right now."] },
    { c, t: 5, q: "Which sentence uses 'ingenuous' correctly?", a: "Her ingenuous smile suggested she had never told a lie.", d: ["The ingenuous design cut costs in half.", "He found an ingenuous way to fix the leak.", "That ingenuous app saves me an hour a day."] },
  ],
  // day 33
  [
    { c, t: 1, q: "Which word completes the question: 'Could I have ___ more soup, please'?", a: "some", d: ["sum", "sun", "son"] },
    { c, t: 2, q: "Which word completes the sentence: 'That plan makes no ___ at all'?", a: "sense", d: ["cents", "since", "scents"] },
    { c, t: 3, q: "Which word completes the sentence: 'His handwriting is so messy that it is ___'?", a: "illegible", d: ["eligible", "ineligible", "legible"] },
    { c, t: 4, q: "Which sentence is correct?", a: "If I had known you were coming, I would have baked a cake.", d: ["If I would have known you were coming, I would have baked a cake.", "If I had of known you were coming, I would have baked a cake.", "If I would of known you were coming, I would have baked a cake."] },
    { c, t: 5, q: "Which sentence uses 'perpetuate' correctly?", a: "Old stereotypes perpetuated unfair hiring for decades.", d: ["The man who perpetuated the fraud was jailed.", "Police arrested the gang that perpetuated the robbery.", "She perpetuated a hoax on her classmates."] },
  ],
  // day 34
  [
    { c, t: 1, q: "Which word completes the sentence: 'This morning I ___ a big breakfast before school'?", a: "ate", d: ["eight", "eated", "eaten"] },
    { c, t: 2, q: "Which word completes the question: 'Could you ___ me a pencil for the test'?", a: "lend", d: ["borrow", "lent", "lending"] },
    { c, t: 3, q: "Which word completes the sentence: 'I feel dizzy, so I am going to ___ down'?", a: "lie", d: ["lay", "laid", "lain"] },
    { c, t: 4, q: "Which choice fits: 'Every boy and girl ___ a ticket for the field trip'?", a: "has", d: ["have", "having", "are having"] },
    { c, t: 5, q: "Which word completes the sentence: 'The Senate voted to ___ the senator for misconduct'?", a: "censure", d: ["censor", "sensor", "censer"] },
  ],
  // day 35
  [
    { c, t: 1, q: "Which word completes the sentence: 'Grandpa told us a ___ about a pirate ship'?", a: "tale", d: ["tail", "tall", "tile"] },
    { c, t: 2, q: "Which word completes the question: 'How ___ apples did you pick today'?", a: "many", d: ["much", "more", "lot"] },
    { c, t: 3, q: "Which word completes the sentence: 'The box of crayons ___ on the top shelf'?", a: "is", d: ["are", "were", "be"] },
    { c, t: 4, q: "Which word completes the sentence: 'Please ___ me of any changes to the schedule'?", a: "apprise", d: ["appraise", "comprise", "surprise"] },
    { c, t: 5, q: "Which word completes the sentence: 'Her fear of the ocean was ___'?", a: "deep-seated", d: ["deep-seeded", "deep-sated", "deep-sat"] },
  ],
  // day 36
  [
    { c, t: 1, q: "Which word completes the sentence: 'Our team ___ the game by two points'?", a: "won", d: ["one", "wan", "win"] },
    { c, t: 2, q: "Which sentence uses 'affect' correctly?", a: "Lack of sleep can affect your mood.", d: ["The new rule had no affect on us.", "The movie's special affects were amazing.", "Her speech had a big affect on the crowd."] },
    { c, t: 3, q: "Which word completes the sentence: 'The prize money was split ___ the two sisters'?", a: "between", d: ["among", "amid", "within"] },
    { c, t: 4, q: "Which word completes the sentence: 'She ___ out the wet towel and hung it up'?", a: "wrung", d: ["rung", "wrang", "rang"] },
    { c, t: 5, q: "Which word completes the sentence: 'She has ___ in the church choir for ten years'?", a: "sung", d: ["sang", "singed", "sunged"] },
  ],
];
