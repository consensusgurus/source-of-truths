// scripts/spell-lanes/spell-error.mjs - Spell, lane "Spot the Error".
//
// Each question shows four words: three correctly spelled in standard US
// English and one misspelled. The answer (a) is the misspelled form exactly as
// shown; the three wrong answers (d) are correctly spelled words of similar
// difficulty. The comment on each entry names the word the misspelling is of.
//
// Lane split (scripts/english-lanes-brief.md): the misspelled TARGET word
// starts with a letter M through Z; the other Spell lane takes A through L.
// Correct filler words may start with any letter and appear at most twice in
// this lane, and no filler is ever a target here.
//
// Authoring rules, checked against the dictionaries in public/ (the Collins
// Scrabble lists tuck-dict*.txt and crux-words.txt) and /usr/share/hunspell
// en_US.dic when this file was built:
//   * no misspelling is a real word, an accepted variant or a British form
//     (each was refused if it appears in any of those lists: perswade,
//     millionnaire, publically, supercede, miniscule and mocassin were all
//     dropped for exactly that reason);
//   * no filler has an alternative spelling (one-edit variants such as
//     -ize/-ise, -or/-our, -er/-re, doubled consonants, a dropped or added e,
//     ae/oe, ph/f were looked up and any real variant removed the word: so no
//     liquefy, rarefy, supersede, minuscule, judgment, gray, theater, wagon,
//     caffeine, broccoli, coolly, aficionado).
// Ramp: tier 1 everyday words with a common slip (neccessary); tier 5 words
// like mischievous and onomatopoeia among look-wrong-but-right fillers such as
// sacrilegious, desiccate and idiosyncrasy.

// Days 1-36 (2026-10-19 to 2026-11-23), already in the bank. Kept for the record;
// gen-english.mjs reads only LANE_DAYS below, which holds the newest segment.
export const LANE_DAYS_D01_D36 = [
  // day 1
  [
    { c: "Spot the Error", t: 1, q: "Which spelling would a copy editor flag?", a: "strenth", d: ["guitar", "chicken", "whale"] }, // strength
    { c: "Spot the Error", t: 2, q: "Three of these are spelled correctly. Which one is not?", a: "sincerly", d: ["business", "genius", "category"] }, // sincerely
    { c: "Spot the Error", t: 3, q: "Which one has a spelling mistake?", a: "miniture", d: ["leisure", "disastrous", "irritable"] }, // miniature
    { c: "Spot the Error", t: 4, q: "Which of these is NOT spelled correctly?", a: "wholy", d: ["isthmus", "forfeit", "haphazard"] }, // wholly
    { c: "Spot the Error", t: 5, q: "Which of these words is misspelled?", a: "scintilating", d: ["lugubrious", "effervescent", "appellation"] }, // scintillating
  ],
  // day 2
  [
    { c: "Spot the Error", t: 1, q: "Which word contains a spelling error?", a: "pritty", d: ["zipper", "spider", "finger"] }, // pretty
    { c: "Spot the Error", t: 2, q: "Spot the error: which word is spelled incorrectly?", a: "seperate", d: ["library", "forehead", "benefit"] }, // separate
    { c: "Spot the Error", t: 3, q: "Which word is misspelled?", a: "unanimus", d: ["exceed", "jeopardy", "dissatisfied"] }, // unanimous
    { c: "Spot the Error", t: 4, q: "Only one of these is misspelled. Which is it?", a: "miscellanious", d: ["accessible", "catastrophe", "irresistible"] }, // miscellaneous
    { c: "Spot the Error", t: 5, q: "Which of these words is spelled wrong?", a: "mischievious", d: ["emollient", "oscillate", "laryngitis"] }, // mischievous
  ],
  // day 3
  [
    { c: "Spot the Error", t: 1, q: "Which word is misspelled?", a: "scool", d: ["napkin", "letter", "dragon"] }, // school
    { c: "Spot the Error", t: 2, q: "Which of these words is spelled wrong?", a: "tradgedy", d: ["condemn", "listen", "honest"] }, // tragedy
    { c: "Spot the Error", t: 3, q: "Which of these is NOT spelled correctly?", a: "sherrif", d: ["disappoint", "allegiance", "laboratory"] }, // sheriff
    { c: "Spot the Error", t: 4, q: "Three of these are spelled correctly. Which one is not?", a: "mayonaise", d: ["innuendo", "flamboyant", "dumbbell"] }, // mayonnaise
    { c: "Spot the Error", t: 5, q: "Which spelling would a copy editor flag?", a: "recalcitrent", d: ["kaleidoscope", "sacrilegious", "glockenspiel"] }, // recalcitrant
  ],
  // day 4
  [
    { c: "Spot the Error", t: 1, q: "Spot the error: which word is spelled incorrectly?", a: "peice", d: ["cotton", "basket", "desert"] }, // piece
    { c: "Spot the Error", t: 2, q: "Which of these words is misspelled?", a: "similiar", d: ["knuckle", "anxious", "efficient"] }, // similar
    { c: "Spot the Error", t: 3, q: "Only one of these is misspelled. Which is it?", a: "priviledge", d: ["curiosity", "desperate", "aggressive"] }, // privilege
    { c: "Spot the Error", t: 4, q: "Which word contains a spelling error?", a: "parlament", d: ["deferred", "genealogy", "acquiesce"] }, // parliament
    { c: "Spot the Error", t: 5, q: "Which one has a spelling mistake?", a: "surreptitous", d: ["leprechaun", "wherewithal", "concomitant"] }, // surreptitious
  ],
  // day 5
  [
    { c: "Spot the Error", t: 1, q: "Only one of these is misspelled. Which is it?", a: "sanwich", d: ["hammer", "pocket", "circle"] }, // sandwich
    { c: "Spot the Error", t: 2, q: "Which word contains a spelling error?", a: "secratary", d: ["journey", "language", "knowledge"] }, // secretary
    { c: "Spot the Error", t: 3, q: "Which word is misspelled?", a: "psycology", d: ["intelligence", "bizarre", "committee"] }, // psychology
    { c: "Spot the Error", t: 4, q: "Which of these words is misspelled?", a: "monastary", d: ["exhilarate", "heinous", "larynx"] }, // monastery
    { c: "Spot the Error", t: 5, q: "Which of these words is spelled wrong?", a: "perogative", d: ["ecclesiastical", "braggadocio", "hydrangea"] }, // prerogative
  ],
  // day 6
  [
    { c: "Spot the Error", t: 1, q: "Which spelling would a copy editor flag?", a: "vegtable", d: ["jungle", "kitten", "family"] }, // vegetable
    { c: "Spot the Error", t: 2, q: "Which one has a spelling mistake?", a: "restarant", d: ["biscuit", "lightning", "government"] }, // restaurant
    { c: "Spot the Error", t: 3, q: "Three of these are spelled correctly. Which one is not?", a: "temperment", d: ["acquaintance", "criticism", "extraordinary"] }, // temperament
    { c: "Spot the Error", t: 4, q: "Spot the error: which word is spelled incorrectly?", a: "psuedonym", d: ["fluorescent", "auxiliary", "guillotine"] }, // pseudonym
    { c: "Spot the Error", t: 5, q: "Which of these is NOT spelled correctly?", a: "vichysoise", d: ["inveigle", "exorbitant", "diphtheria"] }, // vichyssoise
  ],
  // day 7
  [
    { c: "Spot the Error", t: 1, q: "Spot the error: which word is spelled incorrectly?", a: "possable", d: ["jelly", "raisin", "turtle"] }, // possible
    { c: "Spot the Error", t: 2, q: "Which of these is NOT spelled correctly?", a: "oppurtunity", d: ["equipment", "delicious", "beginning"] }, // opportunity
    { c: "Spot the Error", t: 3, q: "Which of these words is spelled wrong?", a: "threshhold", d: ["dilemma", "changeable", "exaggerate"] }, // threshold
    { c: "Spot the Error", t: 4, q: "Which one has a spelling mistake?", a: "permissable", d: ["inadvertent", "apocalypse", "entrepreneur"] }, // permissible
    { c: "Spot the Error", t: 5, q: "Which of these words is misspelled?", a: "melifluous", d: ["daiquiri", "iridescent", "evanescent"] }, // mellifluous
  ],
  // day 8
  [
    { c: "Spot the Error", t: 1, q: "Which spelling would a copy editor flag?", a: "yelow", d: ["noodle", "rocket", "button"] }, // yellow
    { c: "Spot the Error", t: 2, q: "Which word is misspelled?", a: "succesful", d: ["frighten", "challenge", "grateful"] }, // successful
    { c: "Spot the Error", t: 3, q: "Which word contains a spelling error?", a: "maintainance", d: ["illegible", "cinnamon", "discipline"] }, // maintenance
    { c: "Spot the Error", t: 4, q: "Three of these are spelled correctly. Which one is not?", a: "picnicing", d: ["conscientious", "fascism", "bureaucracy"] }, // picnicking
    { c: "Spot the Error", t: 5, q: "Only one of these is misspelled. Which is it?", a: "synechdoche", d: ["maelstrom", "annihilate", "obeisance"] }, // synecdoche
  ],
  // day 9
  [
    { c: "Spot the Error", t: 1, q: "Only one of these is misspelled. Which is it?", a: "sentance", d: ["island", "walnut", "pencil"] }, // sentence
    { c: "Spot the Error", t: 2, q: "Which of these words is spelled wrong?", a: "sattelite", d: ["enough", "achieve", "innocent"] }, // satellite
    { c: "Spot the Error", t: 3, q: "Which word contains a spelling error?", a: "vengance", d: ["amateur", "guidance", "irrelevant"] }, // vengeance
    { c: "Spot the Error", t: 4, q: "Which of these is NOT spelled correctly?", a: "playwrite", d: ["connoisseur", "liaison", "accommodate"] }, // playwright
    { c: "Spot the Error", t: 5, q: "Which spelling would a copy editor flag?", a: "somelier", d: ["innocuous", "bourgeois", "cacophony"] }, // sommelier
  ],
  // day 10
  [
    { c: "Spot the Error", t: 1, q: "Which one has a spelling mistake?", a: "probaly", d: ["cabin", "rabbit", "garden"] }, // probably
    { c: "Spot the Error", t: 2, q: "Which word is misspelled?", a: "yatch", d: ["doubt", "argument", "finally"] }, // yacht
    { c: "Spot the Error", t: 3, q: "Three of these are spelled correctly. Which one is not?", a: "viscious", d: ["cylinder", "bureau", "inevitable"] }, // vicious
    { c: "Spot the Error", t: 4, q: "Spot the error: which word is spelled incorrectly?", a: "mispell", d: ["embarrass", "gazebo", "chauffeur"] }, // misspell
    { c: "Spot the Error", t: 5, q: "Which of these words is misspelled?", a: "ostentacious", d: ["charlatan", "desiccate", "sacrosanct"] }, // ostentatious
  ],
  // day 11
  [
    { c: "Spot the Error", t: 1, q: "Which one has a spelling mistake?", a: "remeber", d: ["beach", "fabric", "hockey"] }, // remember
    { c: "Spot the Error", t: 2, q: "Which spelling would a copy editor flag?", a: "offical", d: ["laugh", "experience", "guarantee"] }, // official
    { c: "Spot the Error", t: 3, q: "Which of these words is misspelled?", a: "rythm", d: ["acquire", "boundary", "colleague"] }, // rhythm
    { c: "Spot the Error", t: 4, q: "Spot the error: which word is spelled incorrectly?", a: "melancoly", d: ["hypocrisy", "dichotomy", "impeccable"] }, // melancholy
    { c: "Spot the Error", t: 5, q: "Only one of these is misspelled. Which is it?", a: "peurile", d: ["coalesce", "flaccid", "dilettante"] }, // puerile
  ],
  // day 12
  [
    { c: "Spot the Error", t: 1, q: "Which word contains a spelling error?", a: "untill", d: ["eagle", "paper", "market"] }, // until
    { c: "Spot the Error", t: 2, q: "Which of these is NOT spelled correctly?", a: "vehical", d: ["foreign", "excellent", "chocolate"] }, // vehicle
    { c: "Spot the Error", t: 3, q: "Which word is misspelled?", a: "vunerable", d: ["fascinate", "conscience", "eccentric"] }, // vulnerable
    { c: "Spot the Error", t: 4, q: "Which of these words is spelled wrong?", a: "perseverence", d: ["dissipate", "labyrinth", "hierarchy"] }, // perseverance
    { c: "Spot the Error", t: 5, q: "Three of these are spelled correctly. Which one is not?", a: "penitentary", d: ["insouciant", "ephemeral", "sarcophagus"] }, // penitentiary
  ],
  // day 13
  [
    { c: "Spot the Error", t: 1, q: "Which of these is NOT spelled correctly?", a: "squirel", d: ["forest", "jacket", "uncle"] }, // squirrel
    { c: "Spot the Error", t: 2, q: "Which spelling would a copy editor flag?", a: "wierd", d: ["daughter", "column", "address"] }, // weird
    { c: "Spot the Error", t: 3, q: "Three of these are spelled correctly. Which one is not?", a: "morgage", d: ["humorous", "consensus", "deceive"] }, // mortgage
    { c: "Spot the Error", t: 4, q: "Spot the error: which word is spelled incorrectly?", a: "soverign", d: ["asthma", "commemorate", "lieutenant"] }, // sovereign
    { c: "Spot the Error", t: 5, q: "Which word is misspelled?", a: "prophalactic", d: ["solipsism", "memorabilia", "apartheid"] }, // prophylactic
  ],
  // day 14
  [
    { c: "Spot the Error", t: 1, q: "Which of these words is spelled wrong?", a: "wellcome", d: ["lunch", "honey", "river"] }, // welcome
    { c: "Spot the Error", t: 2, q: "Which of these words is misspelled?", a: "rediculous", d: ["dessert", "gorgeous", "immediately"] }, // ridiculous
    { c: "Spot the Error", t: 3, q: "Only one of these is misspelled. Which is it?", a: "paralell", d: ["kernel", "forty", "conceive"] }, // parallel
    { c: "Spot the Error", t: 4, q: "Which word contains a spelling error?", a: "saurkraut", d: ["chrysanthemum", "gnarled", "inoculate"] }, // sauerkraut
    { c: "Spot the Error", t: 5, q: "Which one has a spelling mistake?", a: "rhododendrum", d: ["gubernatorial", "exacerbate", "lackadaisical"] }, // rhododendron
  ],
  // day 15
  [
    { c: "Spot the Error", t: 1, q: "Which one has a spelling mistake?", a: "recieve", d: ["tunnel", "muffin", "flower"] }, // receive
    { c: "Spot the Error", t: 2, q: "Spot the error: which word is spelled incorrectly?", a: "vaccum", d: ["emphasis", "awkward", "campaign"] }, // vacuum
    { c: "Spot the Error", t: 3, q: "Only one of these is misspelled. Which is it?", a: "marshmellow", d: ["commitment", "apparently", "interfere"] }, // marshmallow
    { c: "Spot the Error", t: 4, q: "Which of these words is misspelled?", a: "rhinocerous", d: ["buoyant", "lacquer", "camouflage"] }, // rhinoceros
    { c: "Spot the Error", t: 5, q: "Which of these is NOT spelled correctly?", a: "perjorative", d: ["ecstasy", "rapprochement", "minutiae"] }, // pejorative
  ],
  // day 16
  [
    { c: "Spot the Error", t: 1, q: "Which word is misspelled?", a: "specail", d: ["engine", "mother", "feather"] }, // special
    { c: "Spot the Error", t: 2, q: "Three of these are spelled correctly. Which one is not?", a: "sissors", d: ["exercise", "disappear", "grammar"] }, // scissors
    { c: "Spot the Error", t: 3, q: "Which of these words is spelled wrong?", a: "suseptible", d: ["caterpillar", "ignorance", "definitely"] }, // susceptible
    { c: "Spot the Error", t: 4, q: "Which word contains a spelling error?", a: "questionaire", d: ["handkerchief", "indispensable", "cappuccino"] }, // questionnaire
    { c: "Spot the Error", t: 5, q: "Which spelling would a copy editor flag?", a: "opthalmologist", d: ["indefatigable", "misogyny", "zephyr"] }, // ophthalmologist
  ],
  // day 17
  [
    { c: "Spot the Error", t: 1, q: "Which of these words is spelled wrong?", a: "realy", d: ["ocean", "butter", "mirror"] }, // really
    { c: "Spot the Error", t: 2, q: "Spot the error: which word is spelled incorrectly?", a: "noticable", d: ["believe", "kindergarten", "curious"] }, // noticeable
    { c: "Spot the Error", t: 3, q: "Three of these are spelled correctly. Which one is not?", a: "zelous", d: ["conscious", "bouquet", "hygiene"] }, // zealous
    { c: "Spot the Error", t: 4, q: "Which of these is NOT spelled correctly?", a: "surveilance", d: ["camaraderie", "diaphragm", "facsimile"] }, // surveillance
    { c: "Spot the Error", t: 5, q: "Which of these words is misspelled?", a: "obsequeous", d: ["chiaroscuro", "jodhpurs", "idiosyncrasy"] }, // obsequious
  ],
  // day 18
  [
    { c: "Spot the Error", t: 1, q: "Which one has a spelling mistake?", a: "ninty", d: ["office", "thunder", "castle"] }, // ninety
    { c: "Spot the Error", t: 2, q: "Which word contains a spelling error?", a: "mathmatics", d: ["interrupt", "familiar", "beautiful"] }, // mathematics
    { c: "Spot the Error", t: 3, q: "Which spelling would a copy editor flag?", a: "millenium", d: ["convenient", "assassination", "incidentally"] }, // millennium
    { c: "Spot the Error", t: 4, q: "Only one of these is misspelled. Which is it?", a: "pharoah", d: ["bellwether", "colonel", "khaki"] }, // pharaoh
    { c: "Spot the Error", t: 5, q: "Which word is misspelled?", a: "vicisitude", d: ["belligerent", "paradigm", "ebullient"] }, // vicissitude
  ],
  // day 19
  [
    { c: "Spot the Error", t: 1, q: "Which of these words is spelled wrong?", a: "pumkin", d: ["ticket", "oyster", "giant"] }, // pumpkin
    { c: "Spot the Error", t: 2, q: "Only one of these is misspelled. Which is it?", a: "persaude", d: ["especially", "courage", "height"] }, // persuade
    { c: "Spot the Error", t: 3, q: "Three of these are spelled correctly. Which one is not?", a: "preceed", d: ["eighth", "cemetery", "fiery"] }, // precede
    { c: "Spot the Error", t: 4, q: "Spot the error: which word is spelled incorrectly?", a: "stubborness", d: ["asphalt", "eczema", "harass"] }, // stubbornness
    { c: "Spot the Error", t: 5, q: "Which word contains a spelling error?", a: "pusilanimous", d: ["vacuous", "irascible", "raconteur"] }, // pusillanimous
  ],
  // day 20
  [
    { c: "Spot the Error", t: 1, q: "Which of these words is misspelled?", a: "umbrela", d: ["monkey", "pillow", "summer"] }, // umbrella
    { c: "Spot the Error", t: 2, q: "Which word is misspelled?", a: "mussle", d: ["ancient", "ceiling", "jealous"] }, // muscle
    { c: "Spot the Error", t: 3, q: "Which one has a spelling mistake?", a: "withold", d: ["accidentally", "bouquet", "deceive"] }, // withhold
    { c: "Spot the Error", t: 4, q: "Which of these is NOT spelled correctly?", a: "saphire", d: ["indict", "bureaucracy", "heinous"] }, // sapphire
    { c: "Spot the Error", t: 5, q: "Which spelling would a copy editor flag?", a: "paraphenalia", d: ["fuchsia", "assuage", "schism"] }, // paraphernalia
  ],
  // day 21
  [
    { c: "Spot the Error", t: 1, q: "Which word contains a spelling error?", a: "questoin", d: ["sister", "picture", "radish"] }, // question
    { c: "Spot the Error", t: 2, q: "Three of these are spelled correctly. Which one is not?", a: "temprature", d: ["apparent", "existence", "describe"] }, // temperature
    { c: "Spot the Error", t: 3, q: "Which of these is NOT spelled correctly?", a: "quarentine", d: ["guidance", "caterpillar", "laboratory"] }, // quarantine
    { c: "Spot the Error", t: 4, q: "Only one of these is misspelled. Which is it?", a: "veternarian", d: ["embarrass", "dissipate", "chauffeur"] }, // veterinarian
    { c: "Spot the Error", t: 5, q: "Which of these words is spelled wrong?", a: "onomatopeia", d: ["maelstrom", "dilettante", "exacerbate"] }, // onomatopoeia
  ],
  // day 22
  [
    { c: "Spot the Error", t: 1, q: "Which spelling would a copy editor flag?", a: "sience", d: ["magnet", "blanket", "dinner"] }, // science
    { c: "Spot the Error", t: 2, q: "Which word is misspelled?", a: "reccomend", d: ["cousin", "environment", "forehead"] }, // recommend
    { c: "Spot the Error", t: 3, q: "Which one has a spelling mistake?", a: "tatoo", d: ["cemetery", "jeopardy", "fiery"] }, // tattoo
    { c: "Spot the Error", t: 4, q: "Spot the error: which word is spelled incorrectly?", a: "rememberance", d: ["diaphragm", "innuendo", "fluorescent"] }, // remembrance
    { c: "Spot the Error", t: 5, q: "Which of these words is misspelled?", a: "reconnaisance", d: ["idiosyncrasy", "chiaroscuro", "effervescent"] }, // reconnaissance
  ],
  // day 23
  [
    { c: "Spot the Error", t: 1, q: "Which word contains a spelling error?", a: "yesturday", d: ["camera", "ladder", "kettle"] }, // yesterday
    { c: "Spot the Error", t: 2, q: "Which spelling would a copy editor flag?", a: "neice", d: ["gorgeous", "journey", "category"] }, // niece
    { c: "Spot the Error", t: 3, q: "Which of these is NOT spelled correctly?", a: "reknowned", d: ["definitely", "exaggerate", "interfere"] }, // renowned
    { c: "Spot the Error", t: 4, q: "Only one of these is misspelled. Which is it?", a: "zuchinni", d: ["auxiliary", "facsimile", "labyrinth"] }, // zucchini
    { c: "Spot the Error", t: 5, q: "Which one has a spelling mistake?", a: "perspicatious", d: ["sacrosanct", "exorbitant", "kaleidoscope"] }, // perspicacious
  ],
  // day 24
  [
    { c: "Spot the Error", t: 1, q: "Which word is misspelled?", a: "suger", d: ["elbow", "hotel", "planet"] }, // sugar
    { c: "Spot the Error", t: 2, q: "Three of these are spelled correctly. Which one is not?", a: "posession", d: ["believe", "challenge", "foreign"] }, // possession
    { c: "Spot the Error", t: 3, q: "Which of these words is misspelled?", a: "nineth", d: ["bizarre", "exceed", "amateur"] }, // ninth
    { c: "Spot the Error", t: 4, q: "Which of these words is spelled wrong?", a: "millionare", d: ["lieutenant", "camouflage", "hypocrisy"] }, // millionaire
    { c: "Spot the Error", t: 5, q: "Spot the error: which word is spelled incorrectly?", a: "sesquipedelian", d: ["ecclesiastical", "glockenspiel", "belligerent"] }, // sesquipedalian
  ],
  // day 25
  [
    { c: "Spot the Error", t: 1, q: "Only one of these is misspelled. Which is it?", a: "pengiun", d: ["carpet", "valley", "winter"] }, // penguin
    { c: "Spot the Error", t: 2, q: "Which word is misspelled?", a: "rehersal", d: ["guarantee", "library", "ceiling"] }, // rehearsal
    { c: "Spot the Error", t: 3, q: "Three of these are spelled correctly. Which one is not?", a: "withdrawl", d: ["convenient", "ignorance", "eccentric"] }, // withdrawal
    { c: "Spot the Error", t: 4, q: "Which word contains a spelling error?", a: "pnuemonia", d: ["camaraderie", "dichotomy", "haphazard"] }, // pneumonia
    { c: "Spot the Error", t: 5, q: "Which of these words is misspelled?", a: "syzigy", d: ["daiquiri", "misogyny", "bourgeois"] }, // syzygy
  ],
  // day 26
  [
    { c: "Spot the Error", t: 1, q: "Which of these words is spelled wrong?", a: "tommorow", d: ["violin", "parent", "juice"] }, // tomorrow
    { c: "Spot the Error", t: 2, q: "Which of these is NOT spelled correctly?", a: "souvenier", d: ["exercise", "interrupt", "delicious"] }, // souvenir
    { c: "Spot the Error", t: 3, q: "Which one has a spelling mistake?", a: "predjudice", d: ["commitment", "intelligence", "dissatisfied"] }, // prejudice
    { c: "Spot the Error", t: 4, q: "Which spelling would a copy editor flag?", a: "mneumonic", d: ["buoyant", "apocalypse", "catastrophe"] }, // mnemonic
    { c: "Spot the Error", t: 5, q: "Spot the error: which word is spelled incorrectly?", a: "quintessencial", d: ["wherewithal", "appellation", "sacrilegious"] }, // quintessential
  ],
  // day 27
  [
    { c: "Spot the Error", t: 1, q: "Which of these is NOT spelled correctly?", a: "peopel", d: ["bubble", "tiger", "candle"] }, // people
    { c: "Spot the Error", t: 2, q: "Which of these words is spelled wrong?", a: "seige", d: ["curious", "listen", "apparent"] }, // siege
    { c: "Spot the Error", t: 3, q: "Only one of these is misspelled. Which is it?", a: "repitition", d: ["extraordinary", "fascinate", "curiosity"] }, // repetition
    { c: "Spot the Error", t: 4, q: "Which of these words is misspelled?", a: "pavillion", d: ["colonel", "inoculate", "gnarled"] }, // pavilion
    { c: "Spot the Error", t: 5, q: "Which word is misspelled?", a: "presumptious", d: ["sarcophagus", "indefatigable", "braggadocio"] }, // presumptuous
  ],
  // day 28
  [
    { c: "Spot the Error", t: 1, q: "Which one has a spelling mistake?", a: "orenge", d: ["lemon", "sailor", "number"] }, // orange
    { c: "Spot the Error", t: 2, q: "Which spelling would a copy editor flag?", a: "relevent", d: ["frighten", "chocolate", "emphasis"] }, // relevant
    { c: "Spot the Error", t: 3, q: "Which word contains a spelling error?", a: "sophmore", d: ["conscious", "humorous", "aggressive"] }, // sophomore
    { c: "Spot the Error", t: 4, q: "Three of these are spelled correctly. Which one is not?", a: "odyssy", d: ["eczema", "bellwether", "khaki"] }, // odyssey
    { c: "Spot the Error", t: 5, q: "Spot the error: which word is spelled incorrectly?", a: "spontaniety", d: ["cacophony", "irascible", "ephemeral"] }, // spontaneity
  ],
  // day 29
  [
    { c: "Spot the Error", t: 1, q: "Three of these are spelled correctly. Which one is not?", a: "neccessary", d: ["parrot", "lizard", "friend"] }, // necessary
    { c: "Spot the Error", t: 2, q: "Which spelling would a copy editor flag?", a: "ocassion", d: ["immediately", "lightning", "beginning"] }, // occasion
    { c: "Spot the Error", t: 3, q: "Spot the error: which word is spelled incorrectly?", a: "pasttime", d: ["committee", "boundary", "discipline"] }, // pastime
    { c: "Spot the Error", t: 4, q: "Which of these words is spelled wrong?", a: "pomegranite", d: ["acquiesce", "hierarchy", "commemorate"] }, // pomegranate
    { c: "Spot the Error", t: 5, q: "Which of these is NOT spelled correctly?", a: "superflous", d: ["minutiae", "raconteur", "coalesce"] }, // superfluous
  ],
  // day 30
  [
    { c: "Spot the Error", t: 1, q: "Which word is misspelled?", a: "zeebra", d: ["doctor", "silver", "bridge"] }, // zebra
    { c: "Spot the Error", t: 2, q: "Which one has a spelling mistake?", a: "schedual", d: ["grammar", "anxious", "jealous"] }, // schedule
    { c: "Spot the Error", t: 3, q: "Which of these words is misspelled?", a: "transfered", d: ["cinnamon", "irrelevant", "accidentally"] }, // transferred
    { c: "Spot the Error", t: 4, q: "Which word contains a spelling error?", a: "negligable", d: ["handkerchief", "asphalt", "liaison"] }, // negligible
    { c: "Spot the Error", t: 5, q: "Only one of these is misspelled. Which is it?", a: "resusitate", d: ["diphtheria", "jodhpurs", "innocuous"] }, // resuscitate
  ],
  // day 31
  [
    { c: "Spot the Error", t: 1, q: "Which word is misspelled?", a: "truely", d: ["window", "salad", "bottle"] }, // truly
    { c: "Spot the Error", t: 2, q: "Which spelling would a copy editor flag?", a: "stomache", d: ["ancient", "describe", "equipment"] }, // stomach
    { c: "Spot the Error", t: 3, q: "Three of these are spelled correctly. Which one is not?", a: "occurence", d: ["incidentally", "allegiance", "desperate"] }, // occurrence
    { c: "Spot the Error", t: 4, q: "Which word contains a spelling error?", a: "silouette", d: ["accessible", "flamboyant", "dumbbell"] }, // silhouette
    { c: "Spot the Error", t: 5, q: "Which of these words is spelled wrong?", a: "poinsetta", d: ["hydrangea", "iridescent", "fuchsia"] }, // poinsettia
  ],
  // day 32
  [
    { c: "Spot the Error", t: 1, q: "Only one of these is misspelled. Which is it?", a: "togather", d: ["puzzle", "insect", "lantern"] }, // together
    { c: "Spot the Error", t: 2, q: "Spot the error: which word is spelled incorrectly?", a: "reciept", d: ["language", "especially", "argument"] }, // receipt
    { c: "Spot the Error", t: 3, q: "Which one has a spelling mistake?", a: "tyrrany", d: ["changeable", "disastrous", "eighth"] }, // tyranny
    { c: "Spot the Error", t: 4, q: "Which of these is NOT spelled correctly?", a: "succint", d: ["deferred", "harass", "cappuccino"] }, // succinct
    { c: "Spot the Error", t: 5, q: "Which of these words is misspelled?", a: "unctious", d: ["oscillate", "zephyr", "charlatan"] }, // unctuous
  ],
  // day 33
  [
    { c: "Spot the Error", t: 1, q: "Which of these words is spelled wrong?", a: "usualy", d: ["kitchen", "velvet", "apple"] }, // usually
    { c: "Spot the Error", t: 2, q: "Three of these are spelled correctly. Which one is not?", a: "medecine", d: ["height", "grateful", "address"] }, // medicine
    { c: "Spot the Error", t: 3, q: "Spot the error: which word is spelled incorrectly?", a: "roomate", d: ["disappoint", "colleague", "leisure"] }, // roommate
    { c: "Spot the Error", t: 4, q: "Which word is misspelled?", a: "superintendant", d: ["entrepreneur", "connoisseur", "accommodate"] }, // superintendent
    { c: "Spot the Error", t: 5, q: "Which one has a spelling mistake?", a: "subpeona", d: ["insouciant", "memorabilia", "flaccid"] }, // subpoena
  ],
  // day 34
  [
    { c: "Spot the Error", t: 1, q: "Only one of these is misspelled. Which is it?", a: "quater", d: ["market", "sister", "friend"] }, // quarter
    { c: "Spot the Error", t: 2, q: "Which of these words is misspelled?", a: "thurough", d: ["existence", "government", "laugh"] }, // thorough
    { c: "Spot the Error", t: 3, q: "Which spelling would a copy editor flag?", a: "pronounciation", d: ["inevitable", "assassination", "conscience"] }, // pronunciation
    { c: "Spot the Error", t: 4, q: "Which of these is NOT spelled correctly?", a: "perrenial", d: ["forfeit", "larynx", "impeccable"] }, // perennial
    { c: "Spot the Error", t: 5, q: "Which word contains a spelling error?", a: "vaccilate", d: ["ecstasy", "assuage", "concomitant"] }, // vacillate
  ],
  // day 35
  [
    { c: "Spot the Error", t: 1, q: "Three of these are spelled correctly. Which one is not?", a: "suprise", d: ["lizard", "kitten", "engine"] }, // surprise
    { c: "Spot the Error", t: 2, q: "Which one has a spelling mistake?", a: "villian", d: ["doubt", "campaign", "beautiful"] }, // villain
    { c: "Spot the Error", t: 3, q: "Spot the error: which word is spelled incorrectly?", a: "proceedure", d: ["consensus", "kernel", "illegible"] }, // procedure
    { c: "Spot the Error", t: 4, q: "Which of these words is spelled wrong?", a: "resevoir", d: ["asthma", "guillotine", "lacquer"] }, // reservoir
    { c: "Spot the Error", t: 5, q: "Which of these words is misspelled?", a: "peccadilo", d: ["leprechaun", "emollient", "obeisance"] }, // peccadillo
  ],
  // day 36
  [
    { c: "Spot the Error", t: 1, q: "Which word contains a spelling error?", a: "villige", d: ["pocket", "thunder", "salad"] }, // village
    { c: "Spot the Error", t: 2, q: "Which of these is NOT spelled correctly?", a: "spagetti", d: ["experience", "finally", "business"] }, // spaghetti
    { c: "Spot the Error", t: 3, q: "Only one of these is misspelled. Which is it?", a: "nusiance", d: ["criticism", "forty", "irritable"] }, // nuisance
    { c: "Spot the Error", t: 4, q: "Which word is misspelled?", a: "potpouri", d: ["indict", "exhilarate", "gazebo"] }, // potpourri
    { c: "Spot the Error", t: 5, q: "Which spelling would a copy editor flag?", a: "tarmigan", d: ["apartheid", "inveigle", "lugubrious"] }, // ptarmigan
  ],
];

// Days 37-74 (2026-11-24 to 2026-12-31), appended 2026-11-06. Same rules as above:
// every target new to this lane, every wrong version screened as a non-word against
// en_US hunspell and the public/ word lists, fillers at most twice in the segment and never within 15 days of their last use.
export const LANE_DAYS = [
  // day 37
  [
    { c: "Spot the Error", t: 1, q: "Three of these are spelled correctly. Which one is not?", a: "minnit", d: ["banjo", "barrel", "beetle"] }, // minute
    { c: "Spot the Error", t: 2, q: "Which one has a spelling mistake?", a: "machene", d: ["cabinet", "calcium", "canyon"] }, // machine
    { c: "Spot the Error", t: 3, q: "Which of these is NOT spelled correctly?", a: "managable", d: ["approximate", "attendance", "believable"] }, // manageable
    { c: "Spot the Error", t: 4, q: "Which of these words is misspelled?", a: "marashino", d: ["catechism", "cenotaph", "chasm"] }, // maraschino
    { c: "Spot the Error", t: 5, q: "Which word contains a spelling error?", a: "malfeasence", d: ["contretemps", "dalliance", "deleterious"] }, // malfeasance
  ],
  // day 38
  [
    { c: "Spot the Error", t: 1, q: "Which of these words is misspelled?", a: "mountian", d: ["chimney", "cradle", "crayon"] }, // mountain
    { c: "Spot the Error", t: 2, q: "Which word contains a spelling error?", a: "magasine", d: ["crystal", "curtain", "decade"] }, // magazine
    { c: "Spot the Error", t: 3, q: "Spot the error: which word is spelled incorrectly?", a: "mediocer", d: ["ceremony", "circumstance", "colossal"] }, // mediocre
    { c: "Spot the Error", t: 4, q: "Which word is misspelled?", a: "minestroni", d: ["conflagration", "crevasse", "deterrent"] }, // minestrone
    { c: "Spot the Error", t: 5, q: "Only one of these is misspelled. Which is it?", a: "naptha", d: ["esoteric", "etiquette", "euphemism"] }, // naphtha
  ],
  // day 39
  [
    { c: "Spot the Error", t: 1, q: "Which word is misspelled?", a: "pilgram", d: ["garlic", "goblin", "gravel"] }, // pilgrim
    { c: "Spot the Error", t: 2, q: "Only one of these is misspelled. Which is it?", a: "marrage", d: ["errand", "fashion", "festival"] }, // marriage
    { c: "Spot the Error", t: 3, q: "Which of these words is spelled wrong?", a: "negociate", d: ["courteous", "crucial", "dependable"] }, // negotiate
    { c: "Spot the Error", t: 4, q: "Which spelling would a copy editor flag?", a: "nonchalent", d: ["erroneous", "exuberant", "fallacious"] }, // nonchalant
    { c: "Spot the Error", t: 5, q: "Three of these are spelled correctly. Which one is not?", a: "phlegmetic", d: ["hegemony", "hyperbole", "impecunious"] }, // phlegmatic
  ],
  // day 40
  [
    { c: "Spot the Error", t: 1, q: "Which spelling would a copy editor flag?", a: "muzic", d: ["marble", "nugget", "orbit"] }, // music
    { c: "Spot the Error", t: 2, q: "Three of these are spelled correctly. Which one is not?", a: "minumum", d: ["harvest", "holiday", "hollow"] }, // minimum
    { c: "Spot the Error", t: 3, q: "Which one has a spelling mistake?", a: "occasionaly", d: ["further", "hesitate", "hilarious"] }, // occasionally
    { c: "Spot the Error", t: 4, q: "Which of these is NOT spelled correctly?", a: "parishoner", d: ["idyllic", "impasse", "incandescent"] }, // parishioner
    { c: "Spot the Error", t: 5, q: "Which of these words is misspelled?", a: "prestidigatation", d: ["laconic", "magniloquent", "nadir"] }, // prestidigitation
  ],
  // day 41
  [
    { c: "Spot the Error", t: 1, q: "Which of these is NOT spelled correctly?", a: "nefew", d: ["pebble", "pepper", "pillar"] }, // nephew
    { c: "Spot the Error", t: 2, q: "Which of these words is misspelled?", a: "mischeif", d: ["mammal", "narrow", "nectar"] }, // mischief
    { c: "Spot the Error", t: 3, q: "Which word contains a spelling error?", a: "occured", d: ["influential", "jewel", "legitimate"] }, // occurred
    { c: "Spot the Error", t: 4, q: "Spot the error: which word is spelled incorrectly?", a: "picturesk", d: ["liturgy", "luminous", "meticulous"] }, // picturesque
    { c: "Spot the Error", t: 5, q: "Which word is misspelled?", a: "prosenium", d: ["parsimonious", "quotidian", "querulous"] }, // proscenium
  ],
  // day 42
  [
    { c: "Spot the Error", t: 1, q: "Spot the error: which word is spelled incorrectly?", a: "offen", d: ["quilt", "rattle", "robin"] }, // often
    { c: "Spot the Error", t: 2, q: "Which word is misspelled?", a: "mystry", d: ["pattern", "plastic", "portrait"] }, // mystery
    { c: "Spot the Error", t: 3, q: "Only one of these is misspelled. Which is it?", a: "ommission", d: ["operation", "parachute", "peninsula"] }, // omission
    { c: "Spot the Error", t: 4, q: "Which of these words is spelled wrong?", a: "pistacchio", d: ["parable", "reciprocal", "rigorous"] }, // pistachio
    { c: "Spot the Error", t: 5, q: "Which spelling would a copy editor flag?", a: "soriasis", d: ["soporific", "spurious", "taciturn"] }, // psoriasis
  ],
  // day 43
  [
    { c: "Spot the Error", t: 1, q: "Which of these words is spelled wrong?", a: "peenut", d: ["spinach", "statue", "tablet"] }, // peanut
    { c: "Spot the Error", t: 2, q: "Which spelling would a copy editor flag?", a: "naturaly", d: ["salmon", "scholar", "shelter"] }, // naturally
    { c: "Spot the Error", t: 3, q: "Three of these are spelled correctly. Which one is not?", a: "percieve", d: ["recipe", "residential", "sanitary"] }, // perceive
    { c: "Spot the Error", t: 4, q: "Which one has a spelling mistake?", a: "precocius", d: ["scrupulous", "sedentary", "serendipity"] }, // precocious
    { c: "Spot the Error", t: 5, q: "Which of these is NOT spelled correctly?", a: "terodactyl", d: ["recidivism", "vicarious", "abstemious"] }, // pterodactyl
  ],
  // day 44
  [
    { c: "Spot the Error", t: 1, q: "Which one has a spelling mistake?", a: "piza", d: ["wallet", "walrus", "wizard"] }, // pizza
    { c: "Spot the Error", t: 2, q: "Which of these is NOT spelled correctly?", a: "niether", d: ["timid", "tissue", "tropical"] }, // neither
    { c: "Spot the Error", t: 3, q: "Which of these words is misspelled?", a: "personel", d: ["sufficient", "superior", "suspicious"] }, // personnel
    { c: "Spot the Error", t: 4, q: "Which word contains a spelling error?", a: "propriator", d: ["vehement", "whimsical", "accolade"] }, // proprietor
    { c: "Spot the Error", t: 5, q: "Spot the error: which word is spelled incorrectly?", a: "quixottic", d: ["aplomb", "apoplectic", "arpeggio"] }, // quixotic
  ],
  // day 45
  [
    { c: "Spot the Error", t: 1, q: "Which word contains a spelling error?", a: "pleese", d: ["anchor", "apron", "bakery"] }, // please
    { c: "Spot the Error", t: 2, q: "Spot the error: which word is spelled incorrectly?", a: "nervus", d: ["wander", "warrior", "welfare"] }, // nervous
    { c: "Spot the Error", t: 3, q: "Which word is misspelled?", a: "phenomenom", d: ["vigilant", "absorption", "accumulate"] }, // phenomenon
    { c: "Spot the Error", t: 4, q: "Only one of these is misspelled. Which is it?", a: "quandry", d: ["aqueduct", "arraign", "assiduous"] }, // quandary
    { c: "Spot the Error", t: 5, q: "Which of these words is spelled wrong?", a: "shadenfreude", d: ["chicanery", "circumlocution", "clandestine"] }, // schadenfreude
  ],
  // day 46
  [
    { c: "Spot the Error", t: 1, q: "Only one of these is misspelled. Which is it?", a: "purpel", d: ["bucket", "cactus", "cherry"] }, // purple
    { c: "Spot the Error", t: 2, q: "Which of these words is spelled wrong?", a: "obvius", d: ["advice", "attempt", "balcony"] }, // obvious
    { c: "Spot the Error", t: 3, q: "Which spelling would a copy editor flag?", a: "prefered", d: ["alcohol", "apology", "appropriate"] }, // preferred
    { c: "Spot the Error", t: 4, q: "Three of these are spelled correctly. Which one is not?", a: "queu", d: ["cognizant", "colloquial", "complacent"] }, // queue
    { c: "Spot the Error", t: 5, q: "Which one has a spelling mistake?", a: "shilelagh", d: ["diaphanous", "egregious", "epiphany"] }, // shillelagh
  ],
  // day 47
  [
    { c: "Spot the Error", t: 1, q: "Three of these are spelled correctly. Which one is not?", a: "rainbo", d: ["donkey", "falcon", "fiddle"] }, // rainbow
    { c: "Spot the Error", t: 2, q: "Which one has a spelling mistake?", a: "ocur", d: ["cellar", "clumsy", "comfort"] }, // occur
    { c: "Spot the Error", t: 3, q: "Which of these is NOT spelled correctly?", a: "presense", d: ["bulletin", "calculator", "cannibal"] }, // presence
    { c: "Spot the Error", t: 4, q: "Which of these words is misspelled?", a: "rambuncious", d: ["dignitary", "dilapidated", "efficacious"] }, // rambunctious
    { c: "Spot the Error", t: 5, q: "Which word contains a spelling error?", a: "sphygnomanometer", d: ["fastidious", "garrulous", "grandiloquent"] }, // sphygmomanometer
  ],
  // day 48
  [
    { c: "Spot the Error", t: 1, q: "Which of these words is misspelled?", a: "sevin", d: ["jigsaw", "kennel", "ladle"] }, // seven
    { c: "Spot the Error", t: 2, q: "Which word contains a spelling error?", a: "opinon", d: ["diamond", "dolphin", "elegant"] }, // opinion
    { c: "Spot the Error", t: 3, q: "Spot the error: which word is spelled incorrectly?", a: "proffesor", d: ["competent", "controversy", "corroborate"] }, // professor
    { c: "Spot the Error", t: 4, q: "Which word is misspelled?", a: "rendevous", d: ["fluctuate", "gregarious", "hemisphere"] }, // rendezvous
    { c: "Spot the Error", t: 5, q: "Only one of these is misspelled. Which is it?", a: "strychnyne", d: ["inchoate", "intransigent", "juxtapose"] }, // strychnine
  ],
  // day 49
  [
    { c: "Spot the Error", t: 1, q: "Which word is misspelled?", a: "sholder", d: ["paddle", "pirate", "pony"] }, // shoulder
    { c: "Spot the Error", t: 2, q: "Only one of these is misspelled. Which is it?", a: "oposite", d: ["frontier", "gallery", "gesture"] }, // opposite
    { c: "Spot the Error", t: 3, q: "Which of these words is spelled wrong?", a: "refered", d: ["envelope", "fortunate", "fragile"] }, // referred
    { c: "Spot the Error", t: 4, q: "Which spelling would a copy editor flag?", a: "sacrafice", d: ["indigenous", "jubilant", "judicious"] }, // sacrifice
    { c: "Spot the Error", t: 5, q: "Three of these are spelled correctly. Which one is not?", a: "supercillious", d: ["onerous", "palimpsest", "panacea"] }, // supercilious
  ],
  // day 50
  [
    { c: "Spot the Error", t: 1, q: "Which spelling would a copy editor flag?", a: "swetter", d: ["pretzel", "puddle", "saucer"] }, // sweater
    { c: "Spot the Error", t: 2, q: "Three of these are spelled correctly. Which one is not?", a: "ordinery", d: ["journal", "leather", "liberty"] }, // ordinary
    { c: "Spot the Error", t: 3, q: "Which one has a spelling mistake?", a: "reminise", d: ["illusion", "immense", "incredible"] }, // reminisce
    { c: "Spot the Error", t: 4, q: "Which of these is NOT spelled correctly?", a: "salmonela", d: ["nefarious", "oblivious", "omniscient"] }, // salmonella
    { c: "Spot the Error", t: 5, q: "Which of these words is misspelled?", a: "sycophent", d: ["sanguine", "truculent", "vociferous"] }, // sycophant
  ],
  // day 51
  [
    { c: "Spot the Error", t: 1, q: "Which of these is NOT spelled correctly?", a: "teecher", d: ["shovel", "skunk", "sparrow"] }, // teacher
    { c: "Spot the Error", t: 2, q: "Which of these words is misspelled?", a: "origional", d: ["message", "monarch", "pottery"] }, // original
    { c: "Spot the Error", t: 3, q: "Which word contains a spelling error?", a: "ryhme", d: ["nostalgia", "obstacle", "occupation"] }, // rhyme
    { c: "Spot the Error", t: 4, q: "Spot the error: which word is spelled incorrectly?", a: "seive", d: ["perimeter", "plethora", "precipice"] }, // sieve
    { c: "Spot the Error", t: 5, q: "Which word is misspelled?", a: "terpsicorean", d: ["wunderkind", "zeugma", "acquiescence"] }, // terpsichorean
  ],
  // day 52
  [
    { c: "Spot the Error", t: 1, q: "Spot the error: which word is spelled incorrectly?", a: "thougt", d: ["tennis", "acorn", "bonnet"] }, // thought
    { c: "Spot the Error", t: 2, q: "Which word is misspelled?", a: "particuler", d: ["pyramid", "radius", "rescue"] }, // particular
    { c: "Spot the Error", t: 3, q: "Only one of these is misspelled. Which is it?", a: "sustinance", d: ["pioneer", "quantity", "rebellious"] }, // sustenance
    { c: "Spot the Error", t: 4, q: "Which of these words is spelled wrong?", a: "soliloquey", d: ["sinister", "tenacious", "acquittal"] }, // soliloquy
    { c: "Spot the Error", t: 5, q: "Which spelling would a copy editor flag?", a: "tintinabulation", d: ["allegorical", "anachronism", "anomalous"] }, // tintinnabulation
  ],
  // day 53
  [
    { c: "Spot the Error", t: 1, q: "Which of these words is spelled wrong?", a: "turky", d: ["hamster", "lobster", "banjo"] }, // turkey
    { c: "Spot the Error", t: 2, q: "Which spelling would a copy editor flag?", a: "peculier", d: ["sketch", "spirit", "stadium"] }, // peculiar
    { c: "Spot the Error", t: 3, q: "Three of these are spelled correctly. Which one is not?", a: "sargeant", d: ["significant", "tremendous", "ultimately"] }, // sergeant
    { c: "Spot the Error", t: 4, q: "Which one has a spelling mistake?", a: "tortise", d: ["allotment", "amethyst", "apparatus"] }, // tortoise
    { c: "Spot the Error", t: 5, q: "Which of these is NOT spelled correctly?", a: "triskadekaphobia", d: ["bucolic", "cajole", "cantilever"] }, // triskaidekaphobia
  ],
  // day 54
  [
    { c: "Spot the Error", t: 1, q: "Which one has a spelling mistake?", a: "twelv", d: ["barrel", "beetle", "blossom"] }, // twelve
    { c: "Spot the Error", t: 2, q: "Which of these is NOT spelled correctly?", a: "prehaps", d: ["trumpet", "twilight", "volcano"] }, // perhaps
    { c: "Spot the Error", t: 3, q: "Which of these words is misspelled?", a: "subtel", d: ["vacancy", "abundance", "adequate"] }, // subtle
    { c: "Spot the Error", t: 4, q: "Which word contains a spelling error?", a: "vaudville", d: ["bankruptcy", "beleaguer", "bequeath"] }, // vaudeville
    { c: "Spot the Error", t: 5, q: "Spot the error: which word is spelled incorrectly?", a: "ubiquitious", d: ["dalliance", "deleterious", "desultory"] }, // ubiquitous
  ],
  // day 55
  [
    { c: "Spot the Error", t: 1, q: "Which word contains a spelling error?", a: "wahter", d: ["cradle", "crayon", "dentist"] }, // water
    { c: "Spot the Error", t: 2, q: "Spot the error: which word is spelled incorrectly?", a: "phisical", d: ["whisper", "wrinkle", "accident"] }, // physical
    { c: "Spot the Error", t: 3, q: "Which word is misspelled?", a: "succede", d: ["advantageous", "aggravate", "approximate"] }, // succeed
    { c: "Spot the Error", t: 4, q: "Only one of these is misspelled. Which is it?", a: "vinegrette", d: ["catechism", "cenotaph", "chasm"] }, // vinaigrette
    { c: "Spot the Error", t: 5, q: "Which of these words is spelled wrong?", a: "verisimilatude", d: ["etiquette", "euphemism", "exiguous"] }, // verisimilitude
  ],
  // day 56
  [
    { c: "Spot the Error", t: 1, q: "Only one of these is misspelled. Which is it?", a: "womun", d: ["goblin", "gravel", "helmet"] }, // woman
    { c: "Spot the Error", t: 2, q: "Which of these words is spelled wrong?", a: "plesant", d: ["bargain", "cabinet", "calcium"] }, // pleasant
    { c: "Spot the Error", t: 3, q: "Which spelling would a copy editor flag?", a: "tendancy", d: ["attendance", "believable", "benevolent"] }, // tendency
    { c: "Spot the Error", t: 4, q: "Three of these are spelled correctly. Which one is not?", a: "manequin", d: ["conflagration", "crevasse", "deterrent"] }, // mannequin
    { c: "Spot the Error", t: 5, q: "Which one has a spelling mistake?", a: "vermecelli", d: ["hyperbole", "impecunious", "ineffable"] }, // vermicelli
  ],
  // day 57
  [
    { c: "Spot the Error", t: 1, q: "Three of these are spelled correctly. Which one is not?", a: "wrold", d: ["meadow", "medal", "melon"] }, // world
    { c: "Spot the Error", t: 2, q: "Which one has a spelling mistake?", a: "poisen", d: ["cottage", "crystal", "curtain"] }, // poison
    { c: "Spot the Error", t: 3, q: "Which of these is NOT spelled correctly?", a: "unneccessary", d: ["circumstance", "colossal", "compelling"] }, // unnecessary
    { c: "Spot the Error", t: 4, q: "Which of these words is misspelled?", a: "nuptual", d: ["erroneous", "exuberant", "fallacious"] }, // nuptial
    { c: "Spot the Error", t: 5, q: "Which word contains a spelling error?", a: "zietgeist", d: ["magniloquent", "nadir", "obfuscate"] }, // zeitgeist
  ],
  // day 58
  [
    { c: "Spot the Error", t: 1, q: "Which of these words is misspelled?", a: "yung", d: ["pepper", "pillar", "quilt"] }, // young
    { c: "Spot the Error", t: 2, q: "Which word contains a spelling error?", a: "populer", d: ["entrance", "errand", "fashion"] }, // popular
    { c: "Spot the Error", t: 3, q: "Spot the error: which word is spelled incorrectly?", a: "xylaphone", d: ["crucial", "dependable", "dissolve"] }, // xylophone
    { c: "Spot the Error", t: 4, q: "Which word is misspelled?", a: "perpindicular", d: ["idyllic", "impasse", "incandescent"] }, // perpendicular
    { c: "Spot the Error", t: 5, q: "Only one of these is misspelled. Which is it?", a: "magnanamous", d: ["peripatetic", "perfunctory", "quotidian"] }, // magnanimous
  ],
  // day 59
  [
    { c: "Spot the Error", t: 1, q: "Which word is misspelled?", a: "noyse", d: ["rattle", "robin", "spinach"] }, // noise
    { c: "Spot the Error", t: 2, q: "Only one of these is misspelled. Which is it?", a: "possition", d: ["glimpse", "harvest", "holiday"] }, // position
    { c: "Spot the Error", t: 3, q: "Which of these words is spelled wrong?", a: "nautious", d: ["hesitate", "hilarious", "hospitable"] }, // nauseous
    { c: "Spot the Error", t: 4, q: "Which spelling would a copy editor flag?", a: "pharmacuetical", d: ["liturgy", "luminous", "meticulous"] }, // pharmaceutical
    { c: "Spot the Error", t: 5, q: "Three of these are spelled correctly. Which one is not?", a: "merangue", d: ["spurious", "taciturn", "recidivism"] }, // meringue
  ],
  // day 60
  [
    { c: "Spot the Error", t: 1, q: "Which spelling would a copy editor flag?", a: "pickel", d: ["statue", "tablet", "tadpole"] }, // pickle
    { c: "Spot the Error", t: 2, q: "Three of these are spelled correctly. Which one is not?", a: "promis", d: ["luggage", "mammal", "mansion"] }, // promise
    { c: "Spot the Error", t: 3, q: "Which one has a spelling mistake?", a: "outragous", d: ["jewel", "legitimate", "luxurious"] }, // outrageous
    { c: "Spot the Error", t: 4, q: "Which of these is NOT spelled correctly?", a: "porcelin", d: ["parable", "reciprocal", "rigorous"] }, // porcelain
    { c: "Spot the Error", t: 5, q: "Which of these words is misspelled?", a: "nonparail", d: ["vicarious", "abstemious", "aplomb"] }, // nonpareil
  ],
  // day 61
  [
    { c: "Spot the Error", t: 1, q: "Which of these is NOT spelled correctly?", a: "plenti", d: ["walrus", "wizard", "anchor"] }, // plenty
    { c: "Spot the Error", t: 2, q: "Which of these words is misspelled?", a: "reguler", d: ["nectar", "pattern", "plastic"] }, // regular
    { c: "Spot the Error", t: 3, q: "Which word contains a spelling error?", a: "pamflet", d: ["optimistic", "parachute", "recipe"] }, // pamphlet
    { c: "Spot the Error", t: 4, q: "Spot the error: which word is spelled incorrectly?", a: "prestigous", d: ["scrupulous", "sedentary", "serendipity"] }, // prestigious
    { c: "Spot the Error", t: 5, q: "Which word is misspelled?", a: "obstreporous", d: ["apoplectic", "arpeggio", "asinine"] }, // obstreperous
  ],
  // day 62
  [
    { c: "Spot the Error", t: 1, q: "Spot the error: which word is spelled incorrectly?", a: "potatoe", d: ["apron", "bakery", "bucket"] }, // potato
    { c: "Spot the Error", t: 2, q: "Which word is misspelled?", a: "releif", d: ["salmon", "scholar", "shelter"] }, // relief
    { c: "Spot the Error", t: 3, q: "Only one of these is misspelled. Which is it?", a: "persistant", d: ["residential", "sanitary", "scenery"] }, // persistent
    { c: "Spot the Error", t: 4, q: "Which of these words is spelled wrong?", a: "rethoric", d: ["vehement", "whimsical", "accolade"] }, // rhetoric
    { c: "Spot the Error", t: 5, q: "Which spelling would a copy editor flag?", a: "paparrazi", d: ["circumlocution", "clandestine", "contretemps"] }, // paparazzi
  ],
  // day 63
  [
    { c: "Spot the Error", t: 1, q: "Which of these words is spelled wrong?", a: "pupy", d: ["cactus", "cherry", "chimney"] }, // puppy
    { c: "Spot the Error", t: 2, q: "Which spelling would a copy editor flag?", a: "religous", d: ["surface", "timid", "tissue"] }, // religious
    { c: "Spot the Error", t: 3, q: "Three of these are spelled correctly. Which one is not?", a: "plagerism", d: ["superior", "suspicious", "sympathy"] }, // plagiarism
    { c: "Spot the Error", t: 4, q: "Which one has a spelling mistake?", a: "solem", d: ["aqueduct", "arraign", "assiduous"] }, // solemn
    { c: "Spot the Error", t: 5, q: "Which of these is NOT spelled correctly?", a: "phosphorescense", d: ["egregious", "epiphany", "esoteric"] }, // phosphorescence
  ],
  // day 64
  [
    { c: "Spot the Error", t: 1, q: "Which one has a spelling mistake?", a: "quik", d: ["falcon", "fiddle", "garlic"] }, // quick
    { c: "Spot the Error", t: 2, q: "Which of these is NOT spelled correctly?", a: "sevral", d: ["voyage", "wander", "warrior"] }, // several
    { c: "Spot the Error", t: 3, q: "Which of these words is misspelled?", a: "prevelant", d: ["absorption", "accumulate", "alcohol"] }, // prevalent
    { c: "Spot the Error", t: 4, q: "Which word contains a spelling error?", a: "tarrantula", d: ["cognizant", "colloquial", "complacent"] }, // tarantula
    { c: "Spot the Error", t: 5, q: "Spot the error: which word is spelled incorrectly?", a: "plenipotentary", d: ["garrulous", "grandiloquent", "hegemony"] }, // plenipotentiary
  ],
  // day 65
  [
    { c: "Spot the Error", t: 1, q: "Which word contains a spelling error?", a: "ribon", d: ["kennel", "ladle", "marble"] }, // ribbon
    { c: "Spot the Error", t: 2, q: "Spot the error: which word is spelled incorrectly?", a: "sheild", d: ["admire", "advice", "attempt"] }, // shield
    { c: "Spot the Error", t: 3, q: "Which word is misspelled?", a: "rubarb", d: ["apology", "appropriate", "bulletin"] }, // rhubarb
    { c: "Spot the Error", t: 4, q: "Only one of these is misspelled. Which is it?", a: "tsunammi", d: ["dignitary", "dilapidated", "efficacious"] }, // tsunami
    { c: "Spot the Error", t: 5, q: "Which of these words is spelled wrong?", a: "resind", d: ["intransigent", "juxtapose", "laconic"] }, // rescind
  ],
  // day 66
  [
    { c: "Spot the Error", t: 1, q: "Only one of these is misspelled. Which is it?", a: "sadle", d: ["orbit", "paddle", "pebble"] }, // saddle
    { c: "Spot the Error", t: 2, q: "Which of these words is spelled wrong?", a: "signiture", d: ["canyon", "cellar", "clumsy"] }, // signature
    { c: "Spot the Error", t: 3, q: "Which spelling would a copy editor flag?", a: "renaisance", d: ["calculator", "cannibal", "ceremony"] }, // renaissance
    { c: "Spot the Error", t: 4, q: "Three of these are spelled correctly. Which one is not?", a: "vigilantee", d: ["fluctuate", "gregarious", "hemisphere"] }, // vigilante
    { c: "Spot the Error", t: 5, q: "Which one has a spelling mistake?", a: "septagenarian", d: ["palimpsest", "panacea", "parsimonious"] }, // septuagenarian
  ],
  // day 67
  [
    { c: "Spot the Error", t: 1, q: "Three of these are spelled correctly. Which one is not?", a: "sleve", d: ["pretzel", "puddle", "saucer"] }, // sleeve
    { c: "Spot the Error", t: 2, q: "Which one has a spelling mistake?", a: "surley", d: ["decade", "diamond", "dolphin"] }, // surely
    { c: "Spot the Error", t: 3, q: "Which of these is NOT spelled correctly?", a: "resistence", d: ["controversy", "corroborate", "courteous"] }, // resistance
    { c: "Spot the Error", t: 4, q: "Which of these words is misspelled?", a: "ventriloquest", d: ["indigenous", "jubilant", "judicious"] }, // ventriloquist
    { c: "Spot the Error", t: 5, q: "Which word contains a spelling error?", a: "trousseu", d: ["sanguine", "sesquicentennial", "soporific"] }, // trousseau
  ],
  // day 68
  [
    { c: "Spot the Error", t: 1, q: "Which of these words is misspelled?", a: "spune", d: ["skunk", "tennis", "timber"] }, // spoon
    { c: "Spot the Error", t: 2, q: "Which word contains a spelling error?", a: "swiming", d: ["festival", "frontier", "gallery"] }, // swimming
    { c: "Spot the Error", t: 3, q: "Spot the error: which word is spelled incorrectly?", a: "sensable", d: ["fortunate", "fragile", "further"] }, // sensible
    { c: "Spot the Error", t: 4, q: "Which word is misspelled?", a: "mosqueto", d: ["nefarious", "oblivious", "omniscient"] }, // mosquito
    { c: "Spot the Error", t: 5, q: "Only one of these is misspelled. Which is it?", a: "pharyngytis", d: ["wunderkind", "zeugma", "acquiescence"] }, // pharyngitis
  ],
  // day 69
  [
    { c: "Spot the Error", t: 1, q: "Which word is misspelled?", a: "straigt", d: ["tulip", "wallet", "acorn"] }, // straight
    { c: "Spot the Error", t: 2, q: "Only one of these is misspelled. Which is it?", a: "terible", d: ["hollow", "journal", "leather"] }, // terrible
    { c: "Spot the Error", t: 3, q: "Which of these words is spelled wrong?", a: "symetry", d: ["immense", "incredible", "influential"] }, // symmetry
    { c: "Spot the Error", t: 4, q: "Which spelling would a copy editor flag?", a: "nuematic", d: ["perimeter", "sabbatical", "sinister"] }, // pneumatic
    { c: "Spot the Error", t: 5, q: "Three of these are spelled correctly. Which one is not?", a: "pacyderm", d: ["anachronism", "anomalous", "bucolic"] }, // pachyderm
  ],
  // day 70
  [
    { c: "Spot the Error", t: 1, q: "Which spelling would a copy editor flag?", a: "tickel", d: ["hamster", "lobster", "blossom"] }, // tickle
    { c: "Spot the Error", t: 2, q: "Three of these are spelled correctly. Which one is not?", a: "theif", d: ["marathon", "message", "monarch"] }, // thief
    { c: "Spot the Error", t: 3, q: "Which one has a spelling mistake?", a: "vinager", d: ["obstacle", "occupation", "operation"] }, // vinegar
    { c: "Spot the Error", t: 4, q: "Which of these is NOT spelled correctly?", a: "stacato", d: ["stalactite", "tenacious", "acquittal"] }, // staccato
    { c: "Spot the Error", t: 5, q: "Which of these words is misspelled?", a: "sarsaparila", d: ["cajole", "cantilever", "chicanery"] }, // sarsaparilla
  ],
  // day 71
  [
    { c: "Spot the Error", t: 1, q: "Which of these is NOT spelled correctly?", a: "tomatoe", d: ["dentist", "donkey", "helmet"] }, // tomato
    { c: "Spot the Error", t: 2, q: "Which of these words is misspelled?", a: "tounge", d: ["portrait", "pottery", "pyramid"] }, // tongue
    { c: "Spot the Error", t: 3, q: "Which word contains a spelling error?", a: "warrent", d: ["quantity", "rebellious", "significant"] }, // warrant
    { c: "Spot the Error", t: 4, q: "Spot the error: which word is spelled incorrectly?", a: "pinacle", d: ["allotment", "amethyst", "apparatus"] }, // pinnacle
    { c: "Spot the Error", t: 5, q: "Which word is misspelled?", a: "psychadelic", d: ["desultory", "diaphanous", "exiguous"] }, // psychedelic
  ],
  // day 72
  [
    { c: "Spot the Error", t: 1, q: "Spot the error: which word is spelled incorrectly?", a: "truble", d: ["jigsaw", "meadow", "medal"] }, // trouble
    { c: "Spot the Error", t: 2, q: "Which word is misspelled?", a: "valuble", d: ["sketch", "spirit", "stadium"] }, // valuable
    { c: "Spot the Error", t: 3, q: "Only one of these is misspelled. Which is it?", a: "weild", d: ["simultaneous", "spacious", "sufficient"] }, // wield
    { c: "Spot the Error", t: 4, q: "Which of these words is spelled wrong?", a: "pagent", d: ["bankruptcy", "beleaguer", "bequeath"] }, // pageant
    { c: "Spot the Error", t: 5, q: "Which spelling would a copy editor flag?", a: "pyrhic", d: ["fastidious", "ineffable", "inchoate"] }, // pyrrhic
  ],
  // day 73
  [
    { c: "Spot the Error", t: 1, q: "Which of these words is spelled wrong?", a: "whisle", d: ["melon", "nugget", "pirate"] }, // whistle
    { c: "Spot the Error", t: 2, q: "Which spelling would a copy editor flag?", a: "writting", d: ["tropical", "trumpet", "twilight"] }, // writing
    { c: "Spot the Error", t: 3, q: "Three of these are spelled correctly. Which one is not?", a: "temperary", d: ["ultimately", "vacancy", "vigilant"] }, // temporary
    { c: "Spot the Error", t: 4, q: "Which one has a spelling mistake?", a: "rhuematism", d: ["condescend", "embezzle", "hypotenuse"] }, // rheumatism
    { c: "Spot the Error", t: 5, q: "Which of these is NOT spelled correctly?", a: "mezannine", d: ["obfuscate", "onerous", "peripatetic"] }, // mezzanine
  ],
  // day 74
  [
    { c: "Spot the Error", t: 1, q: "Which one has a spelling mistake?", a: "miten", d: ["pony", "shovel", "sparrow"] }, // mitten
    { c: "Spot the Error", t: 2, q: "Which of these is NOT spelled correctly?", a: "yeild", d: ["welfare", "whisper", "wrinkle"] }, // yield
    { c: "Spot the Error", t: 3, q: "Which of these words is misspelled?", a: "tarrif", d: ["advantageous", "aggravate", "benevolent"] }, // tariff
    { c: "Spot the Error", t: 4, q: "Which word contains a spelling error?", a: "tyranosaurus", d: ["lethargic", "opulent", "plethora"] }, // tyrannosaurus
    { c: "Spot the Error", t: 5, q: "Spot the error: which word is spelled incorrectly?", a: "obsolesence", d: ["perfunctory", "querulous", "truculent"] }, // obsolescence
  ],
];
