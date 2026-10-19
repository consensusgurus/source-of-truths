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

export const LANE_DAYS = [
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
