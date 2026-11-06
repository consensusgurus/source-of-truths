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
// Days 1-36 (2026-10-19 to 2026-11-23), already in the bank. Kept for the record;
// gen-english.mjs reads only LANE_DAYS below, which holds the newest segment.
export const LANE_DAYS_D01_D36 = [
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

// Days 37-74 (2026-11-24 to 2026-12-31), appended 2026-11-06. Same scope and
// bans as above. Every keyed item is new to the bank (no confusable pair,
// irregular verb or agreement pattern asked twice), and each key was checked
// against the rule that makes the other three choices wrong in edited American
// English. Nothing that Merriam-Webster lists as an accepted variant is offered
// as a wrong choice.
export const LANE_DAYS = [
  // day 37
  [
    { c, t: 1, q: "Which word completes the sentence: 'I ___ the answer as soon as I read the question'?", a: "knew", d: ["new", "knowed", "known"] },
    { c, t: 2, q: "Which sentence is correct?", a: "I don't have any money left.", d: ["I don't have no money left.", "I don't got no money left.", "I ain't got no money left."] },
    { c, t: 3, q: "Which word completes the sentence: 'Congress passed a new ___ on drone safety'?", a: "statute", d: ["statue", "stature", "status"] },
    { c, t: 4, q: "Which word completes the sentence: 'By noon the heavy rain had ___, so the game went on'?", a: "abated", d: ["abetted", "abutted", "abased"] },
    { c, t: 5, q: "Which word completes the sentence: 'When the cheater was caught, he got his just ___'?", a: "deserts", d: ["desserts", "deserves", "desert's"] },
  ],
  // day 38
  [
    { c, t: 1, q: "Which word completes the sentence: 'We go to the library once a ___'?", a: "week", d: ["weak", "wick", "wake"] },
    { c, t: 2, q: "Which sentence is correct?", a: "I can hardly hear you over the music.", d: ["I can't hardly hear you over the music.", "I can hard hear you over the music.", "I can't barely hear you over the music."] },
    { c, t: 3, q: "Which sentence is correct?", a: "One of my friends lives in Texas.", d: ["One of my friends live in Texas.", "One of my friends are living in Texas.", "One of my friends have lived in Texas."] },
    { c, t: 4, q: "Which word completes the sentence: 'The rookie proved her ___ in the playoffs'?", a: "mettle", d: ["medal", "meddle", "mantle"] },
    { c, t: 5, q: "Which word completes the sentence: 'Only a ___ reader would fall for such an obvious hoax'?", a: "credulous", d: ["credible", "creditable", "incredible"] },
  ],
  // day 39
  [
    { c, t: 1, q: "Which word completes the sentence: 'The whole family gathered to give ___ for the meal'?", a: "thanks", d: ["thinks", "thanked", "thank's"] },
    { c, t: 2, q: "Which sentence is correct?", a: "We used to live on a farm.", d: ["We use to live on a farm.", "We used too live on a farm.", "We were use to live on a farm."] },
    { c, t: 3, q: "Which word completes the sentence: 'This milk tastes ___, so pour it out'?", a: "sour", d: ["sourly", "sourness", "sours"] },
    { c, t: 4, q: "Which word completes the sentence: 'Honey is a thick, ___ liquid'?", a: "viscous", d: ["vicious", "vacuous", "various"] },
    { c, t: 5, q: "Which word completes the sentence: 'In Catholic teaching, a minor offense is called a ___ sin'?", a: "venial", d: ["venal", "venomous", "vernal"] },
  ],
  // day 40
  [
    { c, t: 1, q: "Which word completes the sentence: 'Let's ___ at the park after school'?", a: "meet", d: ["meat", "mete", "mite"] },
    { c, t: 2, q: "Which word completes the sentence: 'He has ___ that horse in three races'?", a: "ridden", d: ["rode", "rided", "rid"] },
    { c, t: 3, q: "Which sentence is correct?", a: "She has lived here since 2019.", d: ["She lives here since 2019.", "She is living here since 2019.", "She has live here since 2019."] },
    { c, t: 4, q: "Which sentence is correct?", a: "None of the milk was spilled.", d: ["None of the milk were spilled.", "None of the milk are spilled.", "None of the milk have spilled."] },
    { c, t: 5, q: "Which word completes the sentence: 'The company hired experts to ___ the damage from the scandal'?", a: "mitigate", d: ["militate", "migrate", "meditate"] },
  ],
  // day 41
  [
    { c, t: 1, q: "Which word completes the sentence: 'I can ___ the ocean from my window'?", a: "see", d: ["sea", "saw", "seen"] },
    { c, t: 2, q: "Which word completes the sentence: 'The ___ of the novel saves her village from a flood'?", a: "heroine", d: ["heroin", "heroic", "heron"] },
    { c, t: 3, q: "Which sentence is correct?", a: "If it rains tomorrow, we will stay home.", d: ["If it will rain tomorrow, we will stay home.", "If it would rain tomorrow, we will stay home.", "If it rained tomorrow, we will stay home."] },
    { c, t: 4, q: "Which word completes the sentence: 'A ___ city like Tokyo has millions of residents'?", a: "populous", d: ["populace", "population", "popularly"] },
    { c, t: 5, q: "Which word completes the sentence: 'A ___ investor, she saw the crash coming months before anyone else'?", a: "perspicacious", d: ["perspicuous", "pernicious", "precocious"] },
  ],
  // day 42
  [
    { c, t: 1, q: "Which word completes the sentence: 'She brushed her long ___ before bed'?", a: "hair", d: ["hare", "heir", "here"] },
    { c, t: 2, q: "Which word completes the sentence: 'It was ___ honest mistake'?", a: "an", d: ["a", "and", "in"] },
    { c, t: 3, q: "Which word completes the sentence: 'She has a real ___ for telling funny stories'?", a: "flair", d: ["flare", "flier", "flayer"] },
    { c, t: 4, q: "Which word completes the sentence: 'Workers will ___ the old warehouse to make room for a park'?", a: "raze", d: ["raise", "rays", "raves"] },
    { c, t: 5, q: "Which word completes the sentence: 'The rules require that every player ___ a helmet'?", a: "wear", d: ["wears", "wore", "wearing"] },
  ],
  // day 43
  [
    { c, t: 1, q: "Which word completes the sentence: 'He ate a juicy ___ for a snack'?", a: "pear", d: ["pair", "pare", "peer"] },
    { c, t: 2, q: "Which word completes the sentence: 'She has ___ to the principal about the problem'?", a: "spoken", d: ["spoke", "speaked", "spoked"] },
    { c, t: 3, q: "Which word completes the sentence: 'The bomb squad worked fast to ___ the device'?", a: "defuse", d: ["diffuse", "defused", "deface"] },
    { c, t: 4, q: "Which word completes the sentence: 'When the first plan failed, she tried a different ___'?", a: "tack", d: ["tact", "tick", "tacked"] },
    { c, t: 5, q: "Which word completes the sentence: 'The factory was fined for dumping ___ into the river'?", a: "effluent", d: ["affluent", "affluence", "confluent"] },
  ],
  // day 44
  [
    { c, t: 1, q: "Which word completes the sentence: 'The ___ carrier brought three letters today'?", a: "mail", d: ["male", "mall", "meal"] },
    { c, t: 2, q: "Which sentence is correct?", a: "I look forward to seeing you.", d: ["I look forward to see you.", "I look forward to saw you.", "I look forward seeing you."] },
    { c, t: 3, q: "Which word completes the sentence: 'The detective studied photos of the ___ crime scene'?", a: "grisly", d: ["grizzly", "gristly", "grizzled"] },
    { c, t: 4, q: "Which word completes the sentence: 'Drivers who ___ the speed limit should expect a fine'?", a: "flout", d: ["flaunt", "flounder", "float"] },
    { c, t: 5, q: "Which word completes the sentence: 'Strong early sales ___ well for the new store'?", a: "augur", d: ["auger", "augment", "augury"] },
  ],
  // day 45
  [
    { c, t: 1, q: "Which word completes the sentence: 'The shoes were half price during the ___'?", a: "sale", d: ["sail", "sell", "seal"] },
    { c, t: 2, q: "Which word completes the sentence: 'I have ___ this jacket every day this week'?", a: "worn", d: ["wore", "weared", "wearied"] },
    { c, t: 3, q: "Which word completes the sentence: 'The speech was meant to ___ a riot'?", a: "incite", d: ["insight", "indict", "incise"] },
    { c, t: 4, q: "Which word completes the sentence: 'With no real opponent, the mayor was a ___ for a second term'?", a: "shoo-in", d: ["shoe-in", "shoe-on", "show-in"] },
    { c, t: 5, q: "Which word completes the sentence: 'Fans ___ in the streets after the championship win'?", a: "exulted", d: ["exalted", "exhaled", "exiled"] },
  ],
  // day 46
  [
    { c, t: 1, q: "Which word completes the sentence: 'She ___ her bike to school yesterday'?", a: "rode", d: ["road", "rowed", "ridden"] },
    { c, t: 2, q: "Which word completes the sentence: 'Karate and judo are ___ arts'?", a: "martial", d: ["marital", "marshal", "partial"] },
    { c, t: 3, q: "Which sentence is correct?", a: "Mathematics is my favorite subject.", d: ["Mathematics are my favorite subject.", "Mathematics were my favorite subject.", "Mathematics be my favorite subject."] },
    { c, t: 4, q: "Which word completes the sentence: 'We waited with ___ breath for the results'?", a: "bated", d: ["baited", "bathed", "abated"] },
    { c, t: 5, q: "Which word completes the sentence: 'It was ___ of him to write his victory speech before the votes were counted'?", a: "presumptuous", d: ["presumptive", "presumable", "prestigious"] },
  ],
  // day 47
  [
    { c, t: 1, q: "Which word completes the sentence: 'We watched the ___ take off from the runway'?", a: "plane", d: ["plain", "plan", "plank"] },
    { c, t: 2, q: "Which sentence is correct?", a: "My scissors are in the top drawer.", d: ["My scissors is in the top drawer.", "My scissor are in the top drawer.", "My scissors was in the top drawer."] },
    { c, t: 3, q: "Which word completes the sentence: 'The priest was called to ___ the demon'?", a: "exorcise", d: ["exercise", "exorcist", "exercises"] },
    { c, t: 4, q: "Which word completes the sentence: 'The smell of fresh bread ___ my appetite'?", a: "whetted", d: ["wetted", "waited", "whittled"] },
    { c, t: 5, q: "Which word completes the sentence: 'With no objections, the board elected her by ___'?", a: "acclamation", d: ["acclimation", "accumulation", "exclamation"] },
  ],
  // day 48
  [
    { c, t: 1, q: "Which word completes the sentence: 'The teacher wrote the date on the ___'?", a: "board", d: ["bored", "bard", "broad"] },
    { c, t: 2, q: "Which sentence is correct?", a: "Everybody in the class is invited to the party.", d: ["Everybody in the class are invited to the party.", "Everybody in the class were invited to the party.", "Everybody in the class be invited to the party."] },
    { c, t: 3, q: "Which word completes the sentence: 'We found a woven rug at the outdoor ___'?", a: "bazaar", d: ["bizarre", "bizarrely", "bizarro"] },
    { c, t: 4, q: "Which word completes the sentence: 'He is ___ to taking risks with his savings'?", a: "averse", d: ["adverse", "avers", "advert"] },
    { c, t: 5, q: "Which word completes the sentence: 'The faith's ___ gathered at the temple at dawn'?", a: "adherents", d: ["adherence", "adhesive", "adherent's"] },
  ],
  // day 49
  [
    { c, t: 1, q: "Which word completes the sentence: 'Don't ___ water while you brush your teeth'?", a: "waste", d: ["waist", "waits", "wasted"] },
    { c, t: 2, q: "Which word completes the sentence: 'The detective tracked a ___ burglar across three states'?", a: "serial", d: ["cereal", "surreal", "sequel"] },
    { c, t: 3, q: "Which word completes the sentence: 'The ___ charged across the field on horseback'?", a: "cavalry", d: ["Calvary", "chivalry", "calorie"] },
    { c, t: 4, q: "Which word completes the sentence: 'The city passed an ___ banning fireworks'?", a: "ordinance", d: ["ordnance", "ordinal", "ordinary"] },
    { c, t: 5, q: "Which word completes the sentence: 'She gave him a ___ look, sneering at his weak excuse'?", a: "contemptuous", d: ["contemptible", "contemplative", "contented"] },
  ],
  // day 50
  [
    { c, t: 1, q: "Which word completes the sentence: 'The stars came out late at ___'?", a: "night", d: ["knight", "nigh", "knit"] },
    { c, t: 2, q: "Which word completes the sentence: 'Someone has ___ a page out of my notebook'?", a: "torn", d: ["tore", "teared", "toren"] },
    { c, t: 3, q: "Which word completes the sentence: 'Two witnesses ___ the driver's story'?", a: "corroborated", d: ["collaborated", "corrugated", "cooperated"] },
    { c, t: 4, q: "Which word completes the sentence: 'In the old legend, the young knight ___ the dragon'?", a: "slew", d: ["slain", "slewed", "slaying"] },
    { c, t: 5, q: "Which word completes the sentence: 'This is the ___ biography of Lincoln, the one every other is measured against'?", a: "definitive", d: ["definite", "deficient", "defiant"] },
  ],
  // day 51
  [
    { c, t: 1, q: "Which word completes the sentence: 'The wind ___ the leaves across the yard'?", a: "blew", d: ["blue", "blowed", "blown"] },
    { c, t: 2, q: "Which word completes the sentence: 'The ___ academy trains future officers for the fleet'?", a: "naval", d: ["navel", "novel", "nasal"] },
    { c, t: 3, q: "Which word completes the sentence: 'The ___ of people at the fair surprised us'?", a: "number", d: ["amount", "amounts", "numeral"] },
    { c, t: 4, q: "Which completes the sentence: 'She turned her essay ___ the teacher before the bell'?", a: "in to", d: ["into", "onto", "unto"] },
    { c, t: 5, q: "Which word completes the sentence: 'The lost puppy let out a ___ whimper'?", a: "plaintive", d: ["plaintiff", "plentiful", "plaited"] },
  ],
  // day 52
  [
    { c, t: 1, q: "Which word completes the sentence: 'We gathered dry ___ for the campfire'?", a: "wood", d: ["would", "wooed", "wad"] },
    { c, t: 2, q: "Which word completes the sentence: 'The whole town was in ___ after the mayor died'?", a: "mourning", d: ["morning", "mooring", "mounting"] },
    { c, t: 3, q: "Which word completes the sentence: 'Of tea and coffee, I prefer the ___'?", a: "latter", d: ["later", "ladder", "letter"] },
    { c, t: 4, q: "Which word completes the sentence: 'Several ___ stopped to help the stranded driver'?", a: "passersby", d: ["passerbys", "passersbys", "passer-bys"] },
    { c, t: 5, q: "Which word completes the sentence: 'Scientists measured how the rats reacted to different ___'?", a: "stimuli", d: ["stimulus", "stimuluses", "stimulis"] },
  ],
  // day 53
  [
    { c, t: 1, q: "What word completes the question: '___ shirt do you want to wear today'?", a: "Which", d: ["Witch", "Wish", "Watch"] },
    { c, t: 2, q: "Which word completes the sentence: 'The busy doctor saw thirty ___ today'?", a: "patients", d: ["patience", "patient's", "patiences"] },
    { c, t: 3, q: "Which word completes the sentence: 'I ___ you that the bridge is safe'?", a: "assure", d: ["ensure", "insure", "ashore"] },
    { c, t: 4, q: "Which word completes the sentence: 'The board gave its ___ to the merger'?", a: "assent", d: ["ascent", "accent", "absent"] },
    { c, t: 5, q: "Which word completes the sentence: 'At the airport, safety takes ___ over speed'?", a: "precedence", d: ["precedents", "presidents", "prescience"] },
  ],
  // day 54
  [
    { c, t: 1, q: "Which word completes the sentence: 'He ___ his shoelaces in a double knot'?", a: "tied", d: ["tide", "tyed", "tired"] },
    { c, t: 2, q: "Which word completes the sentence: 'The pop singer was her childhood ___'?", a: "idol", d: ["idle", "idyll", "idler"] },
    { c, t: 3, q: "Which completes the sentence: 'Both of my ___ came to the wedding'?", a: "sisters-in-law", d: ["sister-in-laws", "sisters-in-laws", "sister-ins-law"] },
    { c, t: 4, q: "Which abbreviation means 'for example,' as in 'Bring a healthy snack (___ an apple)'?", a: "e.g.,", d: ["i.e.,", "etc.,", "et al.,"] },
    { c, t: 5, q: "Which word completes the sentence: 'Algebra is a ___ for this physics course'?", a: "prerequisite", d: ["perquisite", "prerogative", "premonition"] },
  ],
  // day 55
  [
    { c, t: 1, q: "Which word completes the sentence: 'It took six weeks for my broken arm to ___'?", a: "heal", d: ["heel", "he'll", "hail"] },
    { c, t: 2, q: "Which word completes the sentence: 'The farmer will ___ the sheep in the spring'?", a: "shear", d: ["sheer", "share", "shears"] },
    { c, t: 3, q: "Which word completes the sentence: 'We spotted two ___ wading near the lake'?", a: "moose", d: ["mooses", "meese", "moose's"] },
    { c, t: 4, q: "Which word completes the sentence: 'My new boots ___ my heels on long walks'?", a: "chafe", d: ["chaff", "chef", "chase"] },
    { c, t: 5, q: "Which word completes the sentence: 'Out of ___ to her grandmother, she wore a dress to dinner'?", a: "deference", d: ["difference", "defiance", "deterrence"] },
  ],
  // day 56
  [
    { c, t: 1, q: "Which word completes the sentence: 'She mailed a birthday card to her ___ old friend'?", a: "dear", d: ["deer", "dare", "dew"] },
    { c, t: 2, q: "Which word completes the sentence: 'Eye color is passed down through your ___'?", a: "genes", d: ["jeans", "gens", "gems"] },
    { c, t: 3, q: "Which word completes the sentence: 'Since the game was canceled, the argument over who should start is ___'?", a: "moot", d: ["mute", "mood", "moat"] },
    { c, t: 4, q: "Which word completes the sentence: 'The team tested two competing ___ about the cause'?", a: "hypotheses", d: ["hypothesis", "hypothesises", "hypothesi"] },
    { c, t: 5, q: "Which word completes the sentence: 'The woodworker shaped the table leg on a ___'?", a: "lathe", d: ["lath", "loathe", "lave"] },
  ],
  // day 57
  [
    { c, t: 1, q: "Which word completes the sentence: 'The nurse checked my height and ___'?", a: "weight", d: ["wait", "weighed", "weigh"] },
    { c, t: 2, q: "Which sentence is correct?", a: "There are many reasons to read every day.", d: ["There is many reasons to read every day.", "There's many reasons to read every day.", "There be many reasons to read every day."] },
    { c, t: 3, q: "Which word completes the sentence: 'The old horse moved at a slow, steady ___'?", a: "gait", d: ["gate", "gaiter", "gaited"] },
    { c, t: 4, q: "Which word completes the sentence: 'We can stay late if need ___'?", a: "be", d: ["is", "being", "been"] },
    { c, t: 5, q: "Which word completes the sentence: 'The doctor tried to ___ her fears about the surgery'?", a: "allay", d: ["alley", "ally", "alloy"] },
  ],
  // day 58
  [
    { c, t: 1, q: "Which word completes the sentence: 'He ran up the ___ to his bedroom'?", a: "stairs", d: ["stares", "stars", "stirs"] },
    { c, t: 2, q: "Which word completes the sentence: 'She has ___ a hundred miles to see her grandmother'?", a: "driven", d: ["drove", "drived", "drivered"] },
    { c, t: 3, q: "Which word completes the sentence: 'Painters love the golden ___ of the sky at dusk'?", a: "hue", d: ["hew", "hewn", "whew"] },
    { c, t: 4, q: "Which word completes the sentence: 'My favorite sweater had ___ in the wash'?", a: "shrunk", d: ["shrank", "shrinked", "shrunked"] },
    { c, t: 5, q: "Which word completes the sentence: 'With ___ use of her savings, she bought a house by thirty'?", a: "judicious", d: ["judicial", "judgmental", "juridical"] },
  ],
  // day 59
  [
    { c, t: 1, q: "Which word completes the sentence: 'The animals tried to ___ the forest fire'?", a: "flee", d: ["flea", "fly", "flew"] },
    { c, t: 2, q: "Which word completes the sentence: 'The nurse filled a small ___ with blood'?", a: "vial", d: ["vile", "viol", "veil"] },
    { c, t: 3, q: "Which sentence is correct?", a: "We were all ready to leave by eight.", d: ["We were already to leave by eight.", "We were allready to leave by eight.", "We were al ready to leave by eight."] },
    { c, t: 4, q: "Which word completes the sentence: 'He tried to ___ the remote from his brother's grip'?", a: "wrest", d: ["rest", "rust", "wrist"] },
    { c, t: 5, q: "Which word completes the sentence: 'She felt ___ about the move, both excited and sad'?", a: "ambivalent", d: ["ambiguous", "ambidextrous", "ambitious"] },
  ],
  // day 60
  [
    { c, t: 1, q: "Which word completes the sentence: 'The cowboy moved the ___ of cattle to the river'?", a: "herd", d: ["heard", "hurt", "hard"] },
    { c, t: 2, q: "Which word completes the sentence: 'The baby began to ___ when her toy fell'?", a: "wail", d: ["whale", "wale", "well"] },
    { c, t: 3, q: "Which word completes the sentence: 'Ships sailed through the narrow ___ between the two islands'?", a: "strait", d: ["straight", "stray", "strain"] },
    { c, t: 4, q: "Which sentence is correct?", a: "Ten percent of the students are absent today.", d: ["Ten percent of the students is absent today.", "Ten percent of the students was absent today.", "Ten percent of the students be absent today."] },
    { c, t: 5, q: "Which word completes the sentence: 'A ___ reader, she finished three novels a week'?", a: "voracious", d: ["veracious", "voracity", "vexatious"] },
  ],
  // day 61
  [
    { c, t: 1, q: "Which word completes the sentence: 'My little brother has ___ two inches this year'?", a: "grown", d: ["groan", "grew", "growed"] },
    { c, t: 2, q: "Which word completes the sentence: 'Miners dug iron ___ from the mountain'?", a: "ore", d: ["oar", "or", "oral"] },
    { c, t: 3, q: "Which word completes the sentence: 'Please ___ from talking during the movie'?", a: "refrain", d: ["restrain", "retain", "refrains"] },
    { c, t: 4, q: "Which word completes the sentence: 'His speech was pure ___, with no real ideas in it'?", a: "drivel", d: ["dribble", "drizzle", "dibble"] },
    { c, t: 5, q: "Which word completes the sentence: 'The new rules only ___ the traffic problem'?", a: "exacerbated", d: ["exasperated", "excavated", "exonerated"] },
  ],
  // day 62
  [
    { c, t: 1, q: "Which word completes the sentence: 'Grandma taught me how to ___ a button on my coat'?", a: "sew", d: ["so", "sow", "sue"] },
    { c, t: 2, q: "Which word completes the sentence: 'They booked a hotel ___ with two bedrooms'?", a: "suite", d: ["sweet", "suit", "suits"] },
    { c, t: 3, q: "Which completes the question: 'Is there ___ to fix this broken zipper'?", a: "any way", d: ["anyway", "anyways", "any ways"] },
    { c, t: 4, q: "Which word completes the sentence: 'At ninety, Grandpa is still ___ and hearty'?", a: "hale", d: ["hail", "hall", "hole"] },
    { c, t: 5, q: "Which word completes the sentence: 'He had the ___ to call his boss a liar in front of everyone'?", a: "temerity", d: ["timidity", "temperance", "temperature"] },
  ],
  // day 63
  [
    { c, t: 1, q: "Which word completes the sentence: 'Jack and Jill went up the hill to fetch a ___ of water'?", a: "pail", d: ["pale", "pall", "pole"] },
    { c, t: 2, q: "Which word completes the sentence: 'He shuffled and ___ the cards for the next game'?", a: "dealt", d: ["dealed", "delt", "deald"] },
    { c, t: 3, q: "Which word completes the sentence: 'The doctor gave him an ___ for the snake venom'?", a: "antidote", d: ["anecdote", "antecedent", "antithesis"] },
    { c, t: 4, q: "Which word completes the sentence: 'The country was in the ___ of a civil war'?", a: "throes", d: ["throws", "thrones", "throe's"] },
    { c, t: 5, q: "Which word completes the sentence: 'Owning a vintage watch carries a certain ___ among collectors'?", a: "cachet", d: ["cache", "cashet", "catchet"] },
  ],
  // day 64
  [
    { c, t: 1, q: "Which word completes the sentence: 'We set traps because we heard ___ in the attic'?", a: "mice", d: ["mouses", "mices", "mouse's"] },
    { c, t: 2, q: "Which word completes the sentence: 'The egg ___ was bright orange'?", a: "yolk", d: ["yak", "yuck", "folk"] },
    { c, t: 3, q: "Which word completes the sentence: 'She is used to ___ up early for work'?", a: "getting", d: ["get", "got", "gets"] },
    { c, t: 4, q: "Which word completes the sentence: 'The novel is now part of the American literary ___'?", a: "canon", d: ["cannon", "canyon", "cannons"] },
    { c, t: 5, q: "Which word completes the sentence: 'Write the date down, lest you ___ it'?", a: "forget", d: ["forgot", "forgets", "forgetting"] },
  ],
  // day 65
  [
    { c, t: 1, q: "Which is the plural of 'child'?", a: "children", d: ["childs", "childrens", "childes"] },
    { c, t: 2, q: "Which word completes the sentence: 'Put the forks and ___ in the top drawer'?", a: "knives", d: ["knifes", "knife's", "knifs"] },
    { c, t: 3, q: "Which word completes the sentence: 'The author's friend wrote the ___ to the book'?", a: "foreword", d: ["forward", "forword", "foreward"] },
    { c, t: 4, q: "Which word completes the sentence: 'The builder used a ___ line to check that the wall was straight'?", a: "plumb", d: ["plum", "plume", "plump"] },
    { c, t: 5, q: "Which word completes the sentence: 'The newspaper was sued for ___ after printing false claims'?", a: "libel", d: ["liable", "label", "libelous"] },
  ],
  // day 66
  [
    { c, t: 1, q: "Which word completes the sentence: 'A flock of ___ flew south for the winter'?", a: "geese", d: ["gooses", "geeses", "goose's"] },
    { c, t: 2, q: "Which word completes the sentence: 'My library book is two weeks ___'?", a: "overdue", d: ["overdo", "overdid", "overdone"] },
    { c, t: 3, q: "Which word completes the sentence: 'The test had a written section and an ___ section where you speak'?", a: "oral", d: ["aural", "oracle", "orally"] },
    { c, t: 4, q: "Which word completes the sentence: 'After a long trial, the jury ___ him of all charges'?", a: "acquitted", d: ["acquainted", "acquired", "equipped"] },
    { c, t: 5, q: "Which word completes the sentence: 'The boxer made a ___ with his left before landing a right'?", a: "feint", d: ["faint", "fiend", "feign"] },
  ],
  // day 67
  [
    { c, t: 1, q: "Which word completes the sentence: 'Brush your ___ before bed'?", a: "teeth", d: ["tooths", "teeths", "toothes"] },
    { c, t: 2, q: "Which word completes the sentence: 'The robbers ___ before the police arrived'?", a: "fled", d: ["fleed", "flead", "fleeted"] },
    { c, t: 3, q: "Which word completes the sentence: 'She baked scones with dried ___'?", a: "currants", d: ["currents", "curants", "courants"] },
    { c, t: 4, q: "Which word completes the sentence: 'Pollen lands on the flower's ___'?", a: "pistil", d: ["pistol", "pastel", "pestle"] },
    { c, t: 5, q: "Which sentence is correct?", a: "Never have I seen such a beautiful storm.", d: ["Never I have seen such a beautiful storm.", "Never did I saw such a beautiful storm.", "Never have I saw such a beautiful storm."] },
  ],
  // day 68
  [
    { c, t: 1, q: "Which word completes the sentence: 'We opened our ___ under the tree this morning'?", a: "presents", d: ["presence", "presets", "prescience"] },
    { c, t: 2, q: "Which word completes the sentence: 'The kids built the snow fort all by ___'?", a: "themselves", d: ["theirselves", "themselfs", "theyselves"] },
    { c, t: 3, q: "Which word completes the sentence: 'The wet shirt ___ to his back'?", a: "clung", d: ["clinged", "clang", "clanged"] },
    { c, t: 4, q: "Which word completes the sentence: 'The plan is contingent ___ the city's approval'?", a: "on", d: ["of", "to", "with"] },
    { c, t: 5, q: "Which word completes the sentence: 'The new coach hoped to ___ a sense of pride in the team'?", a: "instill", d: ["distill", "install", "instinct"] },
  ],
  // day 69
  [
    { c, t: 1, q: "Which word completes the sentence: 'He ___ the ball with one hand'?", a: "caught", d: ["catched", "cought", "court"] },
    { c, t: 2, q: "Which word completes the sentence: 'The couple exchanged vows at the ___'?", a: "altar", d: ["alter", "alder", "halter"] },
    { c, t: 3, q: "Which word completes the sentence: 'The district attorney decided to ___ the case'?", a: "prosecute", d: ["persecute", "procure", "protest"] },
    { c, t: 4, q: "Which word completes the sentence: 'She has a real aptitude ___ math'?", a: "for", d: ["of", "on", "with"] },
    { c, t: 5, q: "Which word completes the sentence: 'The candidate's speech was full of ___ that meant little'?", a: "platitudes", d: ["plateaus", "platters", "platoons"] },
  ],
  // day 70
  [
    { c, t: 1, q: "Which word completes the sentence: 'She ___ cookies to the party last night'?", a: "brought", d: ["bringed", "brung", "brang"] },
    { c, t: 2, q: "Which word completes the sentence: 'The farmer hitched two ___ to the plow'?", a: "oxen", d: ["oxes", "oxens", "ox's"] },
    { c, t: 3, q: "Which word completes the sentence: 'The ___ led his regiment into battle'?", a: "colonel", d: ["kernel", "colonial", "colon"] },
    { c, t: 4, q: "Which word completes the sentence: 'Grandpa ___ the guests with stories of his travels'?", a: "regaled", d: ["regulated", "relegated", "regained"] },
    { c, t: 5, q: "Which word completes the sentence: 'The clerk's ___ in the theft cost him his job'?", a: "complicity", d: ["complacency", "complexity", "compliance"] },
  ],
  // day 71
  [
    { c, t: 1, q: "Which word completes the sentence: 'She missed school because she had the ___'?", a: "flu", d: ["flew", "flue", "flow"] },
    { c, t: 2, q: "Which word completes the sentence: 'At the sad ending, half the audience ___'?", a: "wept", d: ["weeped", "wepted", "weept"] },
    { c, t: 3, q: "Which word completes the sentence: 'She strummed a G ___ on her guitar'?", a: "chord", d: ["cord", "cored", "chore"] },
    { c, t: 4, q: "Which word completes the sentence: 'I would rather ___ than drive in this snow'?", a: "walk", d: ["walking", "walked", "to walk"] },
    { c, t: 5, q: "Which word completes the sentence: 'The governor ___ the prisoner's sentence to ten years'?", a: "commuted", d: ["computed", "committed", "commented"] },
  ],
  // day 72
  [
    { c, t: 1, q: "Which word completes the sentence: 'The bride walked slowly down the ___'?", a: "aisle", d: ["isle", "I'll", "ale"] },
    { c, t: 2, q: "Which word completes the sentence: 'Police arrived at the ___ of the crash'?", a: "scene", d: ["seen", "scent", "seine"] },
    { c, t: 3, q: "Which sentence is correct?", a: "Anyone who wants to come is welcome.", d: ["Anyone who want to come is welcome.", "Anyone who wants to come are welcome.", "Anyone who wanting to come is welcome."] },
    { c, t: 4, q: "Which word completes the sentence: 'The bank placed a ___ on the house until the loan was paid'?", a: "lien", d: ["lean", "lion", "line"] },
    { c, t: 5, q: "Which word completes the sentence: 'Troops quickly ___ the uprising'?", a: "quelled", d: ["quailed", "quilled", "queued"] },
  ],
  // day 73
  [
    { c, t: 1, q: "Which word completes the sentence: 'A pack of ___ howled in the night'?", a: "wolves", d: ["wolfs", "wolf's", "wolfes"] },
    { c, t: 2, q: "Which word completes the sentence: 'We steamed a pot of ___ with garlic'?", a: "mussels", d: ["muscles", "muzzles", "missiles"] },
    { c, t: 3, q: "Which word completes the sentence: 'He ___ the coffee beans this morning'?", a: "ground", d: ["grinded", "grounded", "grund"] },
    { c, t: 4, q: "Which word completes the sentence: 'Interest in the fad began to ___ after a month'?", a: "wane", d: ["wain", "wean", "wan"] },
    { c, t: 5, q: "Which word completes the sentence: 'Malaria is ___ in that region, always present at some level'?", a: "endemic", d: ["epidemic", "pandemic", "epidermic"] },
  ],
  // day 74
  [
    { c, t: 1, q: "Which word completes the sentence: 'Our last ___ left the party at one in the morning'?", a: "guest", d: ["guessed", "gust", "guess"] },
    { c, t: 2, q: "Which word completes the sentence: 'He hurt ___ falling off his bike'?", a: "himself", d: ["hisself", "himselves", "his self"] },
    { c, t: 3, q: "Which word completes the sentence: 'This new phone is far superior ___ my old one'?", a: "to", d: ["than", "from", "of"] },
    { c, t: 4, q: "Which word completes the sentence: 'Despite low pay, they managed to ___ out a living'?", a: "eke", d: ["eek", "eck", "leak"] },
    { c, t: 5, q: "Which word completes the sentence: 'The aging king decided to ___ the throne'?", a: "abdicate", d: ["abduct", "abate", "abrade"] },
  ],
];
