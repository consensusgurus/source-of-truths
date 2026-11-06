// Spell lane: Spelled Right. "Which is the correct spelling?" with four
// versions of one word, exactly one correct in edited American English.
// Split: every target word starts with a letter A through L (the other Spell
// lane takes M through Z). The three wrong versions are genuine misspellings:
// none is a real word, an accepted variant or a British spelling (each was
// screened against the Collins Scrabble lists, public/crux-words.txt and an
// expanded en_US hunspell list). Words with two accepted US spellings are left
// out. A short meaning is given where the word could be confused with another.
// Ramp: tier 1 everyday words, tier 3 the classic traps, tier 5 spelling-bee
// words a specialist knows.
// Days 1-36 (2026-10-19 to 2026-11-23), already in the bank. Kept for the record;
// gen-english.mjs reads only LANE_DAYS below, which holds the newest segment.
export const LANE_DAYS_D01_D36 = [
  // day 1
  [
    { c: 'Spelled Right', t: 1, q: "Which is spelled correctly?", a: "breakfast", d: ["brekfast", "breakfest", "brakefast"] },
    { c: 'Spelled Right', t: 2, q: "Which of these is spelled correctly?", a: "disappoint", d: ["dissapoint", "disapoint", "dissappoint"] },
    { c: 'Spelled Right', t: 3, q: "Which spelling is correct in American English?", a: "acquaintance", d: ["aquaintance", "acquaintence", "acquaintanse"] },
    { c: 'Spelled Right', t: 4, q: "Which spelling would a careful copy editor approve?", a: "leprechaun", d: ["leprachaun", "leprechan", "lepracaun"] },
    { c: 'Spelled Right', t: 5, q: "Which of these words is spelled right?", a: "Albuquerque", d: ["Albequerque", "Albuquerqe", "Albuqurque"] },
  ],
  // day 2
  [
    { c: 'Spelled Right', t: 1, q: "Which spelling would a careful copy editor approve?", a: "island", d: ["iland", "islend", "iseland"] },
    { c: 'Spelled Right', t: 2, q: "Which of these words is spelled right?", a: "humorous", d: ["humerous", "humorus", "humorouse"] },
    { c: 'Spelled Right', t: 3, q: "Which one is the right spelling?", a: "accommodate", d: ["accomodate", "acommodate", "accommadate"] },
    { c: 'Spelled Right', t: 4, q: "Which spelling would win a spelling bee?", a: "chauffeur", d: ["chauffuer", "chaufeur", "shauffeur"] },
    { c: 'Spelled Right', t: 5, q: "Which spelling of the word meaning 'a small bonus gift given with a purchase' is right?", a: "lagniappe", d: ["lagniape", "lanyappe", "lagnaippe"] },
  ],
  // day 3
  [
    { c: 'Spelled Right', t: 1, q: "Which spelling would win a spelling bee?", a: "children", d: ["childern", "chilldren", "childrin"] },
    { c: 'Spelled Right', t: 2, q: "Which is the correct spelling?", a: "laboratory", d: ["labratory", "laboratroy", "laboritory"] },
    { c: 'Spelled Right', t: 3, q: "Which is the correct spelling of the word meaning 'an introduction at the front of a book'?", a: "foreword", d: ["forword", "forewerd", "foreworde"] },
    { c: 'Spelled Right', t: 4, q: "Which spelling is correct for the word meaning 'a dull yellowish-brown cloth'?", a: "khaki", d: ["kahki", "khakhi", "kakhi"] },
    { c: 'Spelled Right', t: 5, q: "Which spelling of the word meaning 'having two equal sides, as a triangle' is right?", a: "isosceles", d: ["isoceles", "isosseles", "isocelese"] },
  ],
  // day 4
  [
    { c: 'Spelled Right', t: 1, q: "Which of these is spelled correctly?", a: "answer", d: ["anser", "awnser", "answar"] },
    { c: 'Spelled Right', t: 2, q: "Which spelling is correct in American English?", a: "ceiling", d: ["cealing", "ceilling", "celing"] },
    { c: 'Spelled Right', t: 3, q: "Which spelling would a careful copy editor approve?", a: "hygiene", d: ["hygeine", "hygene", "hyjiene"] },
    { c: 'Spelled Right', t: 4, q: "Which of these words is spelled right?", a: "lieutenant", d: ["lieutenent", "lieutanant", "leutenant"] },
    { c: 'Spelled Right', t: 5, q: "Which one is the right spelling?", a: "eleemosynary", d: ["eleemosinary", "eleemossynary", "elemmosynary"] },
  ],
  // day 5
  [
    { c: 'Spelled Right', t: 1, q: "Which is the correct spelling of the word meaning 'the leafy green in most salads'?", a: "lettuce", d: ["lettice", "letuce", "lettus"] },
    { c: 'Spelled Right', t: 2, q: "Which one is the right spelling?", a: "disappear", d: ["dissapear", "disapear", "dissappear"] },
    { c: 'Spelled Right', t: 3, q: "Which spelling would win a spelling bee?", a: "bureaucracy", d: ["beaurocracy", "bureacracy", "burocracy"] },
    { c: 'Spelled Right', t: 4, q: "Which spelling is correct for the word meaning 'a leader or indicator of trends'?", a: "bellwether", d: ["bellweather", "belwether", "bellwhether"] },
    { c: 'Spelled Right', t: 5, q: "Which is spelled correctly?", a: "gubernatorial", d: ["gubanatorial", "gubernitorial", "gubernatoreal"] },
  ],
  // day 6
  [
    { c: 'Spelled Right', t: 1, q: "Which is the correct spelling?", a: "dinosaur", d: ["dinasaur", "dinosour", "dinosore"] },
    { c: 'Spelled Right', t: 2, q: "Which is spelled correctly?", a: "especially", d: ["especialy", "expecially", "espescially"] },
    { c: 'Spelled Right', t: 3, q: "Which of these is spelled correctly?", a: "cappuccino", d: ["cappucino", "capuccino", "cappuchino"] },
    { c: 'Spelled Right', t: 4, q: "Which spelling of the word meaning 'a long, ranting speech' is right?", a: "harangue", d: ["harrangue", "harang", "harrange"] },
    { c: 'Spelled Right', t: 5, q: "Which spelling would a careful copy editor approve?", a: "ichthyology", d: ["icthyology", "ichthiology", "ichthyollogy"] },
  ],
  // day 7
  [
    { c: 'Spelled Right', t: 1, q: "Which spelling is correct in American English?", a: "kangaroo", d: ["kangeroo", "kangaru", "kangarroo"] },
    { c: 'Spelled Right', t: 2, q: "Which spelling would a careful copy editor approve?", a: "jealous", d: ["jelous", "jealus", "jellous"] },
    { c: 'Spelled Right', t: 3, q: "Which of these words is spelled right?", a: "guarantee", d: ["garantee", "guarentee", "gaurantee"] },
    { c: 'Spelled Right', t: 4, q: "Which one is the right spelling?", a: "kaleidoscope", d: ["kaliedoscope", "kalaidoscope", "kaleidascope"] },
    { c: 'Spelled Right', t: 5, q: "Which spelling would win a spelling bee?", a: "baccalaureate", d: ["bacalaureate", "baccalareate", "baccalauriate"] },
  ],
  // day 8
  [
    { c: 'Spelled Right', t: 1, q: "Which one is the right spelling?", a: "guitar", d: ["gitar", "guiter", "guittar"] },
    { c: 'Spelled Right', t: 2, q: "Which spelling would win a spelling bee?", a: "grammar", d: ["grammer", "gramar", "grammor"] },
    { c: 'Spelled Right', t: 3, q: "Which is the correct spelling?", a: "existence", d: ["existance", "existense", "exsistence"] },
    { c: 'Spelled Right', t: 4, q: "Which is the correct spelling of the word meaning 'an army officer ranked just below a brigadier general'?", a: "colonel", d: ["colonol", "colonell", "colnel"] },
    { c: 'Spelled Right', t: 5, q: "Which of these is spelled correctly?", a: "logorrhea", d: ["logorhea", "logorrea", "loggorrhea"] },
  ],
  // day 9
  [
    { c: 'Spelled Right', t: 1, q: "Which is spelled correctly?", a: "bicycle", d: ["bycicle", "bicicle", "bicycel"] },
    { c: 'Spelled Right', t: 2, q: "Which of these is spelled correctly?", a: "column", d: ["colume", "collumn", "colomn"] },
    { c: 'Spelled Right', t: 3, q: "Which spelling is correct in American English?", a: "caffeine", d: ["caffiene", "cafeine", "caffeene"] },
    { c: 'Spelled Right', t: 4, q: "Which spelling would a careful copy editor approve?", a: "camaraderie", d: ["comraderie", "camaradery", "camarederie"] },
    { c: 'Spelled Right', t: 5, q: "Which of these words is spelled right?", a: "effervescence", d: ["effervesence", "effervescense", "efervescence"] },
  ],
  // day 10
  [
    { c: 'Spelled Right', t: 1, q: "Which spelling would a careful copy editor approve?", a: "friend", d: ["freind", "frend", "freend"] },
    { c: 'Spelled Right', t: 2, q: "Which of these words is spelled right?", a: "leopard", d: ["leapord", "leperd", "lepard"] },
    { c: 'Spelled Right', t: 3, q: "Which one is the right spelling?", a: "harass", d: ["harrass", "harras", "haross"] },
    { c: 'Spelled Right', t: 4, q: "Which spelling is correct for the word meaning 'a vivid purplish pink'?", a: "fuchsia", d: ["fuschia", "fushia", "fuchia"] },
    { c: 'Spelled Right', t: 5, q: "Which is the correct spelling?", a: "diphtheria", d: ["diptheria", "diphthiria", "diphteria"] },
  ],
  // day 11
  [
    { c: 'Spelled Right', t: 1, q: "Which spelling would win a spelling bee?", a: "ghost", d: ["gost", "ghoast", "goast"] },
    { c: 'Spelled Right', t: 2, q: "Which is the correct spelling?", a: "basically", d: ["basicly", "basicaly", "basiclly"] },
    { c: 'Spelled Right', t: 3, q: "Which is spelled correctly?", a: "leisure", d: ["liesure", "leisuer", "leisur"] },
    { c: 'Spelled Right', t: 4, q: "Which spelling of the word meaning 'a swollen, infected pocket of pus' is right?", a: "abscess", d: ["absess", "abcess", "abscees"] },
    { c: 'Spelled Right', t: 5, q: "Which spelling is correct in American English?", a: "daguerreotype", d: ["daguerretype", "daguereotype", "dagguerreotype"] },
  ],
  // day 12
  [
    { c: 'Spelled Right', t: 1, q: "Which of these is spelled correctly?", a: "beautiful", d: ["beautifull", "beutiful", "beatiful"] },
    { c: 'Spelled Right', t: 2, q: "Which is the correct spelling of the word meaning 'rough-voiced, as from a cold'?", a: "hoarse", d: ["hoarce", "hourse", "hoarsse"] },
    { c: 'Spelled Right', t: 3, q: "Which spelling is correct for the word meaning 'a place where the dead are buried'?", a: "cemetery", d: ["cemetary", "cemitery", "cematery"] },
    { c: 'Spelled Right', t: 4, q: "Which of these words is spelled right?", a: "connoisseur", d: ["connoiseur", "conoisseur", "connaisseur"] },
    { c: 'Spelled Right', t: 5, q: "Which one is the right spelling?", a: "avoirdupois", d: ["avoirdupoise", "avoirdepois", "avoirdupoit"] },
  ],
  // day 13
  [
    { c: 'Spelled Right', t: 1, q: "Which of these words is spelled right?", a: "animal", d: ["animel", "aminal", "anamal"] },
    { c: 'Spelled Right', t: 2, q: "Which one is the right spelling?", a: "length", d: ["lenght", "lengh", "lenth"] },
    { c: 'Spelled Right', t: 3, q: "Which spelling would win a spelling bee?", a: "handkerchief", d: ["hankerchief", "handkercheif", "handkerchef"] },
    { c: 'Spelled Right', t: 4, q: "Which is the correct spelling?", a: "aficionado", d: ["aficcionado", "aficianado", "aficionato"] },
    { c: 'Spelled Right', t: 5, q: "Which spelling of the word meaning 'a fish stew from Marseille' is right?", a: "bouillabaisse", d: ["bouillabase", "bouilliabaisse", "boullabaisse"] },
  ],
  // day 14
  [
    { c: 'Spelled Right', t: 1, q: "Which is the correct spelling?", a: "dangerous", d: ["dangerus", "dangerouse", "dangeros"] },
    { c: 'Spelled Right', t: 2, q: "Which is spelled correctly?", a: "business", d: ["buisness", "busness", "bussiness"] },
    { c: 'Spelled Right', t: 3, q: "Which of these is spelled correctly?", a: "irresistible", d: ["irresistable", "irrisistible", "iresistible"] },
    { c: 'Spelled Right', t: 4, q: "Which spelling is correct in American English?", a: "irascible", d: ["irrascible", "irascable", "iracible"] },
    { c: 'Spelled Right', t: 5, q: "Which spelling would a careful copy editor approve?", a: "Cincinnati", d: ["Cincinatti", "Cincinnatti", "Cinncinati"] },
  ],
  // day 15
  [
    { c: 'Spelled Right', t: 1, q: "Which spelling is correct in American English?", a: "always", d: ["allways", "alwais", "alwayes"] },
    { c: 'Spelled Right', t: 2, q: "Which spelling would a careful copy editor approve?", a: "height", d: ["hieght", "heigth", "heihgt"] },
    { c: 'Spelled Right', t: 3, q: "Which of these words is spelled right?", a: "exhilarate", d: ["exhilerate", "exilarate", "exhillarate"] },
    { c: 'Spelled Right', t: 4, q: "Which one is the right spelling?", a: "daiquiri", d: ["daiquirri", "daiquery", "daiquiry"] },
    { c: 'Spelled Right', t: 5, q: "Which spelling would win a spelling bee?", a: "flibbertigibbet", d: ["flibertigibbet", "flibbertijibbet", "flibbertigibbit"] },
  ],
  // day 16
  [
    { c: 'Spelled Right', t: 1, q: "Which one is the right spelling?", a: "balloon", d: ["baloon", "balloone", "ballune"] },
    { c: 'Spelled Right', t: 2, q: "Which is the correct spelling of the word meaning 'a breakfast food made from grain'?", a: "cereal", d: ["cereel", "cerial", "sereal"] },
    { c: 'Spelled Right', t: 3, q: "Which is the correct spelling?", a: "apparent", d: ["apparant", "aparent", "apparrent"] },
    { c: 'Spelled Right', t: 4, q: "Which is spelled correctly?", a: "acquiesce", d: ["aquiesce", "acquiese", "acquiess"] },
    { c: 'Spelled Right', t: 5, q: "Which spelling is correct for the word meaning 'trousers worn for horseback riding'?", a: "jodhpurs", d: ["jodphurs", "jodpurs", "jodhpers"] },
  ],
  // day 17
  [
    { c: 'Spelled Right', t: 1, q: "Which is spelled correctly?", a: "because", d: ["becuase", "becaus", "becouse"] },
    { c: 'Spelled Right', t: 2, q: "Which of these is spelled correctly?", a: "forty", d: ["fourty", "fortey", "fortty"] },
    { c: 'Spelled Right', t: 3, q: "Which spelling is correct in American English?", a: "hierarchy", d: ["heirarchy", "hierachy", "hiearchy"] },
    { c: 'Spelled Right', t: 4, q: "Which spelling would a careful copy editor approve?", a: "curmudgeon", d: ["curmudgen", "curmudgion", "cermudgeon"] },
    { c: 'Spelled Right', t: 5, q: "Which spelling of the word meaning 'to melt away by absorbing moisture from the air' is right?", a: "deliquesce", d: ["deliquese", "deliquesse", "delliquesce"] },
  ],
  // day 18
  [
    { c: 'Spelled Right', t: 1, q: "Which spelling would a careful copy editor approve?", a: "chocolate", d: ["choclate", "chocolote", "chocalate"] },
    { c: 'Spelled Right', t: 2, q: "Which of these words is spelled right?", a: "February", d: ["Febuary", "Februrary", "Febraury"] },
    { c: 'Spelled Right', t: 3, q: "Which one is the right spelling?", a: "exaggerate", d: ["exagerate", "exaggarate", "exxagerate"] },
    { c: 'Spelled Right', t: 4, q: "Which spelling would win a spelling bee?", a: "facetious", d: ["facetous", "fascetious", "facecious"] },
    { c: 'Spelled Right', t: 5, q: "Which is the correct spelling?", a: "chrysanthemum", d: ["chrysanthamum", "crysanthemum", "chrysanthemun"] },
  ],
  // day 19
  [
    { c: 'Spelled Right', t: 1, q: "Which spelling would win a spelling bee?", a: "kitchen", d: ["kichen", "kitchin", "kittchen"] },
    { c: 'Spelled Right', t: 2, q: "Which is the correct spelling?", a: "language", d: ["langauge", "languege", "langwage"] },
    { c: 'Spelled Right', t: 3, q: "Which is the correct spelling of the word meaning 'careful not to attract notice'?", a: "discreet", d: ["discreat", "descreet", "discreit"] },
    { c: 'Spelled Right', t: 4, q: "Which of these is spelled correctly?", a: "guttural", d: ["gutteral", "gutural", "guttaral"] },
    { c: 'Spelled Right', t: 5, q: "Which spelling is correct in American English?", a: "Liechtenstein", d: ["Liechtenstien", "Leichtenstein", "Liechtenstine"] },
  ],
  // day 20
  [
    { c: 'Spelled Right', t: 1, q: "Which of these is spelled correctly?", a: "daughter", d: ["dauhgter", "daughtor", "dauter"] },
    { c: 'Spelled Right', t: 2, q: "Which spelling is correct for the word meaning 'a walkway between rows of seats'?", a: "aisle", d: ["aysle", "aisel", "aille"] },
    { c: 'Spelled Right', t: 3, q: "Which spelling would a careful copy editor approve?", a: "embarrass", d: ["embarass", "embaras", "embarrase"] },
    { c: 'Spelled Right', t: 4, q: "Which of these words is spelled right?", a: "dilettante", d: ["dilletante", "dillettante", "dilettente"] },
    { c: 'Spelled Right', t: 5, q: "Which spelling of the word meaning 'a long-bodied German dog breed' is right?", a: "dachshund", d: ["dachsund", "daschund", "dachshound"] },
  ],
  // day 21
  [
    { c: 'Spelled Right', t: 1, q: "Which of these words is spelled right?", a: "interesting", d: ["intresting", "interisting", "intersting"] },
    { c: 'Spelled Right', t: 2, q: "Which one is the right spelling?", a: "interrupt", d: ["interupt", "intterupt", "interrup"] },
    { c: 'Spelled Right', t: 3, q: "Which spelling would win a spelling bee?", a: "Caribbean", d: ["Carribean", "Caribean", "Carribbean"] },
    { c: 'Spelled Right', t: 4, q: "Which is the correct spelling?", a: "entrepreneur", d: ["entreprenuer", "enterpreneur", "entrepeneur"] },
    { c: 'Spelled Right', t: 5, q: "Which is the correct spelling of the word meaning 'a temporary camp with little or no shelter'?", a: "bivouac", d: ["bivuoac", "bivouack", "bivwac"] },
  ],
  // day 22
  [
    { c: 'Spelled Right', t: 1, q: "Which is the correct spelling?", a: "knife", d: ["kniffe", "knyfe", "knif"] },
    { c: 'Spelled Right', t: 2, q: "Which is spelled correctly?", a: "familiar", d: ["familar", "famillar", "familier"] },
    { c: 'Spelled Right', t: 3, q: "Which of these is spelled correctly?", a: "acquire", d: ["aquire", "accquire", "acquier"] },
    { c: 'Spelled Right', t: 4, q: "Which spelling is correct in American English?", a: "liaison", d: ["liason", "liasion", "laison"] },
    { c: 'Spelled Right', t: 5, q: "Which spelling is correct for the word meaning 'a cabbage grown for its swollen, turnip-like stem'?", a: "kohlrabi", d: ["kolrabi", "kohlrabbi", "kohlrahbi"] },
  ],
  // day 23
  [
    { c: 'Spelled Right', t: 1, q: "Which spelling is correct in American English?", a: "library", d: ["libary", "librery", "liberry"] },
    { c: 'Spelled Right', t: 2, q: "Which spelling would a careful copy editor approve?", a: "immediately", d: ["immediatly", "imediately", "immedietly"] },
    { c: 'Spelled Right', t: 3, q: "Which of these words is spelled right?", a: "jeopardy", d: ["jepordy", "jeapordy", "jeopordy"] },
    { c: 'Spelled Right', t: 4, q: "Which one is the right spelling?", a: "desiccate", d: ["dessicate", "desicate", "dessiccate"] },
    { c: 'Spelled Right', t: 5, q: "Which spelling would win a spelling bee?", a: "autochthonous", d: ["autocthonous", "autochthanous", "autochtonous"] },
  ],
  // day 24
  [
    { c: 'Spelled Right', t: 1, q: "Which one is the right spelling?", a: "banana", d: ["bananna", "bannana", "banena"] },
    { c: 'Spelled Right', t: 2, q: "Which spelling would win a spelling bee?", a: "biscuit", d: ["biscut", "buiscuit", "bisquit"] },
    { c: 'Spelled Right', t: 3, q: "Which is the correct spelling?", a: "definitely", d: ["definately", "definitly", "defenitely"] },
    { c: 'Spelled Right', t: 4, q: "Which is spelled correctly?", a: "idiosyncrasy", d: ["idiosyncracy", "idiosincrasy", "ideosyncrasy"] },
    { c: 'Spelled Right', t: 5, q: "Which of these is spelled correctly?", a: "consanguinity", d: ["consanguinety", "consanguinnity", "consaguinity"] },
  ],
  // day 25
  [
    { c: 'Spelled Right', t: 1, q: "Which is spelled correctly?", a: "important", d: ["importent", "importint", "imporant"] },
    { c: 'Spelled Right', t: 2, q: "Which of these is spelled correctly?", a: "foreign", d: ["foriegn", "forein", "foreighn"] },
    { c: 'Spelled Right', t: 3, q: "Which spelling of the word meaning 'the one after seventh' is right?", a: "eighth", d: ["eigth", "eightth", "eighthe"] },
    { c: 'Spelled Right', t: 4, q: "Which spelling would a careful copy editor approve?", a: "innuendo", d: ["inuendo", "innuendoe", "inneundo"] },
    { c: 'Spelled Right', t: 5, q: "Which is the correct spelling of the word meaning 'eyeglasses held up on a handle'?", a: "lorgnette", d: ["lornyette", "lorgnet", "lorgnete"] },
  ],
  // day 26
  [
    { c: 'Spelled Right', t: 1, q: "Which spelling would a careful copy editor approve?", a: "healthy", d: ["helthy", "healty", "healthey"] },
    { c: 'Spelled Right', t: 2, q: "Which of these words is spelled right?", a: "environment", d: ["enviroment", "envirnoment", "environmint"] },
    { c: 'Spelled Right', t: 3, q: "Which one is the right spelling?", a: "independent", d: ["independant", "indepandent", "independint"] },
    { c: 'Spelled Right', t: 4, q: "Which spelling would win a spelling bee?", a: "inoculate", d: ["innoculate", "inocculate", "inoculite"] },
    { c: 'Spelled Right', t: 5, q: "Which is the correct spelling?", a: "chiaroscuro", d: ["chiarascuro", "chiaroscurro", "chiarroscuro"] },
  ],
  // day 27
  [
    { c: 'Spelled Right', t: 1, q: "Which spelling would win a spelling bee?", a: "different", d: ["diffrent", "differant", "diferent"] },
    { c: 'Spelled Right', t: 2, q: "Which is the correct spelling?", a: "address", d: ["adress", "addres", "addresse"] },
    { c: 'Spelled Right', t: 3, q: "Which is spelled correctly?", a: "ecstasy", d: ["ecstacy", "ecsstasy", "ecstesy"] },
    { c: 'Spelled Right', t: 4, q: "Which of these is spelled correctly?", a: "hemorrhage", d: ["hemorrage", "hemmorhage", "hemorhage"] },
    { c: 'Spelled Right', t: 5, q: "Which spelling is correct in American English?", a: "braggadocio", d: ["braggadoccio", "bragadocio", "braggadocchio"] },
  ],
  // day 28
  [
    { c: 'Spelled Right', t: 1, q: "Which of these is spelled correctly?", a: "cousin", d: ["cousen", "cusin", "cuzzin"] },
    { c: 'Spelled Right', t: 2, q: "Which spelling is correct for the word meaning 'to work dough with the hands'?", a: "knead", d: ["knede", "kneade", "neade"] },
    { c: 'Spelled Right', t: 3, q: "Which spelling would a careful copy editor approve?", a: "colleague", d: ["collegue", "colleage", "coleague"] },
    { c: 'Spelled Right', t: 4, q: "Which spelling of the word meaning 'a glossy finish for wood' is right?", a: "lacquer", d: ["laquer", "lacqer", "lacquor"] },
    { c: 'Spelled Right', t: 5, q: "Which one is the right spelling?", a: "legerdemain", d: ["legerdemaine", "ledgerdemain", "legerdemane"] },
  ],
  // day 29
  [
    { c: 'Spelled Right', t: 1, q: "Which of these words is spelled right?", a: "believe", d: ["beleive", "beleve", "beleave"] },
    { c: 'Spelled Right', t: 2, q: "Which one is the right spelling?", a: "argument", d: ["arguement", "argumant", "arguemint"] },
    { c: 'Spelled Right', t: 3, q: "Which spelling would win a spelling bee?", a: "camouflage", d: ["camoflage", "camouflague", "camaflage"] },
    { c: 'Spelled Right', t: 4, q: "Which is the correct spelling?", a: "iridescent", d: ["irridescent", "iridesent", "iridiscent"] },
    { c: 'Spelled Right', t: 5, q: "Which is spelled correctly?", a: "Fahrenheit", d: ["Farenheit", "Fahrenhiet", "Fahrenheight"] },
  ],
  // day 30
  [
    { c: 'Spelled Right', t: 1, q: "Which is the correct spelling?", a: "hospital", d: ["hospitle", "hosptial", "hospitel"] },
    { c: 'Spelled Right', t: 2, q: "Which is the correct spelling of the word meaning 'the flash of light in a thunderstorm'?", a: "lightning", d: ["lightining", "litening", "lightneing"] },
    { c: 'Spelled Right', t: 3, q: "Which of these is spelled correctly?", a: "fascinate", d: ["facinate", "fasinate", "fascinnate"] },
    { c: 'Spelled Right', t: 4, q: "Which spelling is correct in American English?", a: "auxiliary", d: ["auxillary", "auxilary", "auxilliary"] },
    { c: 'Spelled Right', t: 5, q: "Which spelling would a careful copy editor approve?", a: "hydrangea", d: ["hydranjea", "hidrangea", "hydrangia"] },
  ],
  // day 31
  [
    { c: 'Spelled Right', t: 1, q: "Which spelling is correct in American English?", a: "family", d: ["familly", "famly", "fammily"] },
    { c: 'Spelled Right', t: 2, q: "Which spelling would a careful copy editor approve?", a: "guilty", d: ["gilty", "guility", "guiltey"] },
    { c: 'Spelled Right', t: 3, q: "Which spelling is correct for the word meaning 'something that completes or goes well with another'?", a: "complement", d: ["complemant", "complament", "complimant"] },
    { c: 'Spelled Right', t: 4, q: "Which one is the right spelling?", a: "archipelago", d: ["archipelego", "archipellago", "arcipelago"] },
    { c: 'Spelled Right', t: 5, q: "Which spelling would win a spelling bee?", a: "cirrhosis", d: ["cirhosis", "cirrosis", "cirrhossis"] },
  ],
  // day 32
  [
    { c: 'Spelled Right', t: 1, q: "Which one is the right spelling?", a: "doctor", d: ["docter", "doctur", "dockter"] },
    { c: 'Spelled Right', t: 2, q: "Which spelling would win a spelling bee?", a: "beginning", d: ["begining", "beggining", "beginnig"] },
    { c: 'Spelled Right', t: 3, q: "Which is the correct spelling?", a: "conscientious", d: ["conscientous", "consciencious", "concientious"] },
    { c: 'Spelled Right', t: 4, q: "Which is spelled correctly?", a: "fluorescent", d: ["flourescent", "fluorescant", "flouresent"] },
    { c: 'Spelled Right', t: 5, q: "Which spelling of the word meaning 'a climbing shrub with papery, brightly colored bracts' is right?", a: "bougainvillea", d: ["bougainvilla", "bouganvillea", "bougainvillia"] },
  ],
  // day 33
  [
    { c: 'Spelled Right', t: 1, q: "Which is spelled correctly?", a: "coffee", d: ["coffie", "cofee", "coffe"] },
    { c: 'Spelled Right', t: 2, q: "Which is the correct spelling of the word meaning 'coming next after third'?", a: "fourth", d: ["fourthe", "foruth", "fourht"] },
    { c: 'Spelled Right', t: 3, q: "Which spelling is correct in American English?", a: "broccoli", d: ["brocolli", "brockoli", "broccolli"] },
    { c: 'Spelled Right', t: 4, q: "Which spelling would a careful copy editor approve?", a: "drunkenness", d: ["drunkeness", "drunkenes", "drunkkenness"] },
    { c: 'Spelled Right', t: 5, q: "Which spelling is correct for the word meaning 'a banded metamorphic rock'?", a: "gneiss", d: ["gniess", "gneisse", "neiss"] },
  ],
  // day 34
  [
    { c: 'Spelled Right', t: 1, q: "Which spelling would a careful copy editor approve?", a: "laugh", d: ["lauph", "laghe", "laffe"] },
    { c: 'Spelled Right', t: 2, q: "Which of these words is spelled right?", a: "calendar", d: ["calindar", "calandar", "calander"] },
    { c: 'Spelled Right', t: 3, q: "Which one is the right spelling?", a: "committee", d: ["commitee", "comittee", "committe"] },
    { c: 'Spelled Right', t: 4, q: "Which spelling would win a spelling bee?", a: "Connecticut", d: ["Conneticut", "Connecticutt", "Connectecut"] },
    { c: 'Spelled Right', t: 5, q: "Which is the correct spelling?", a: "ecclesiastical", d: ["eclesiastical", "ecclesiastickal", "ecclessiastical"] },
  ],
  // day 35
  [
    { c: 'Spelled Right', t: 1, q: "Which spelling would win a spelling bee?", a: "enough", d: ["enouf", "enugh", "enogh"] },
    { c: 'Spelled Right', t: 2, q: "Which spelling of the word meaning 'a sweet course at the end of a meal' is right?", a: "dessert", d: ["desserte", "dessart", "dezzert"] },
    { c: 'Spelled Right', t: 3, q: "Which is spelled correctly?", a: "indispensable", d: ["indispensible", "indespensable", "indispensibal"] },
    { c: 'Spelled Right', t: 4, q: "Which of these is spelled correctly?", a: "bourgeois", d: ["bourgois", "burgeois", "bourjeois"] },
    { c: 'Spelled Right', t: 5, q: "Which is the correct spelling of the word meaning 'a grace note in music'?", a: "appoggiatura", d: ["apoggiatura", "appoggiattura", "appogiattura"] },
  ],
  // day 36
  [
    { c: 'Spelled Right', t: 1, q: "Which of these is spelled correctly?", a: "elephant", d: ["elefant", "elephent", "eliphant"] },
    { c: 'Spelled Right', t: 2, q: "Which spelling is correct in American English?", a: "government", d: ["goverment", "govermment", "governmint"] },
    { c: 'Spelled Right', t: 3, q: "Which spelling would a careful copy editor approve?", a: "dilemma", d: ["dilemna", "delemma", "dillema"] },
    { c: 'Spelled Right', t: 4, q: "Which of these words is spelled right?", a: "lackadaisical", d: ["lackadasical", "lackidaisical", "lacadaisical"] },
    { c: 'Spelled Right', t: 5, q: "Which spelling is correct for the word meaning 'the part of a newspaper given to light fiction and reviews'?", a: "feuilleton", d: ["fueilleton", "feuilliton", "feuileton"] },
  ],
];

// Days 37-74 (2026-11-24 to 2026-12-31), appended 2026-11-06. Same rules as above:
// every target new to this lane, every wrong version screened as a non-word against
// en_US hunspell and the public/ word lists, no target with a second accepted US spelling.
export const LANE_DAYS = [
  // day 37
  [
    { c: 'Spelled Right', t: 1, q: "Which of these is spelled correctly?", a: "afraid", d: ["afriad", "affraid", "afrade"] },
    { c: 'Spelled Right', t: 2, q: "Which spelling is correct in American English?", a: "absence", d: ["absense", "abscence", "absance"] },
    { c: 'Spelled Right', t: 3, q: "Which spelling would a careful copy editor approve?", a: "accidentally", d: ["accidentaly", "acidentally", "accidentilly"] },
    { c: 'Spelled Right', t: 4, q: "Which of these words is spelled right?", a: "adolescence", d: ["adolesence", "adolescense", "addolescence"] },
    { c: 'Spelled Right', t: 5, q: "Which spelling is correct for the word meaning 'extremely old-fashioned'?", a: "antediluvian", d: ["antedeluvian", "antidiluvian", "antediluvean"] },
  ],
  // day 38
  [
    { c: 'Spelled Right', t: 1, q: "Which of these words is spelled right?", a: "almost", d: ["allmost", "almoast", "almosst"] },
    { c: 'Spelled Right', t: 2, q: "Which one is the right spelling?", a: "across", d: ["accross", "acros", "acrross"] },
    { c: 'Spelled Right', t: 3, q: "Which spelling would win a spelling bee?", a: "achievement", d: ["acheivement", "achievment", "acheivment"] },
    { c: 'Spelled Right', t: 4, q: "Which is the correct spelling?", a: "anonymous", d: ["anonimous", "annonymous", "anonymus"] },
    { c: 'Spelled Right', t: 5, q: "Which spelling of the word meaning 'the highest point or perfect example' is right?", a: "apotheosis", d: ["apotheosys", "apothiosis", "apotheossis"] },
  ],
  // day 39
  [
    { c: 'Spelled Right', t: 1, q: "Which is the correct spelling?", a: "among", d: ["amung", "amoung", "amonge"] },
    { c: 'Spelled Right', t: 2, q: "Which is spelled correctly?", a: "cranberry", d: ["cranbery", "cranberrie", "cramberry"] },
    { c: 'Spelled Right', t: 3, q: "Which of these is spelled correctly?", a: "amateur", d: ["amature", "ammateur", "amatuer"] },
    { c: 'Spelled Right', t: 4, q: "Which spelling is correct in American English?", a: "apocalypse", d: ["apocalipse", "apokalypse", "appocalypse"] },
    { c: 'Spelled Right', t: 5, q: "Which is the correct spelling of the word meaning 'marked by drunken revelry'?", a: "bacchanalian", d: ["bacchanalean", "bachanalian", "bacchannalian"] },
  ],
  // day 40
  [
    { c: 'Spelled Right', t: 1, q: "Which spelling is correct in American English?", a: "bought", d: ["bougt", "baught", "bowght"] },
    { c: 'Spelled Right', t: 2, q: "Which spelling would a careful copy editor approve?", a: "already", d: ["allready", "alredy", "allredy"] },
    { c: 'Spelled Right', t: 3, q: "Which of these words is spelled right?", a: "appearance", d: ["appearence", "apperance", "appearanse"] },
    { c: 'Spelled Right', t: 4, q: "Which one is the right spelling?", a: "asphalt", d: ["ashphalt", "asphault", "assphalt"] },
    { c: 'Spelled Right', t: 5, q: "Which spelling is correct for the word meaning 'a clear seasoned broth'?", a: "bouillon", d: ["bouillion", "boullion", "bouyon"] },
  ],
  // day 41
  [
    { c: 'Spelled Right', t: 1, q: "Which one is the right spelling?", a: "bread", d: ["bredd", "braed", "breadd"] },
    { c: 'Spelled Right', t: 2, q: "Which spelling would win a spelling bee?", a: "athlete", d: ["athelete", "athleet", "athlette"] },
    { c: 'Spelled Right', t: 3, q: "Which is the correct spelling?", a: "boundary", d: ["boundry", "boundery", "boundarey"] },
    { c: 'Spelled Right', t: 4, q: "Which is spelled correctly?", a: "asthma", d: ["asma", "asthmah", "astma"] },
    { c: 'Spelled Right', t: 5, q: "Which spelling of the word meaning 'cooked with tomatoes and herbs, as in a chicken dish' is right?", a: "cacciatore", d: ["cacciatori", "caciatore", "cacciatorre"] },
  ],
  // day 42
  [
    { c: 'Spelled Right', t: 1, q: "Which is spelled correctly?", a: "brother", d: ["bruther", "brothar", "brotherr"] },
    { c: 'Spelled Right', t: 2, q: "Which of these is spelled correctly?", a: "balance", d: ["ballance", "balence", "balanse"] },
    { c: 'Spelled Right', t: 3, q: "Which spelling is correct in American English?", a: "commitment", d: ["committment", "comitment", "commitmint"] },
    { c: 'Spelled Right', t: 4, q: "Which spelling would a careful copy editor approve?", a: "bachelor", d: ["batchelor", "bacheler", "bachelore"] },
    { c: 'Spelled Right', t: 5, q: "Which of these words is spelled right?", a: "catarrh", d: ["catarh", "cattarh", "catarrhe"] },
  ],
  // day 43
  [
    { c: 'Spelled Right', t: 1, q: "Which spelling would a careful copy editor approve?", a: "build", d: ["bild", "biuld", "buld"] },
    { c: 'Spelled Right', t: 2, q: "Which of these words is spelled right?", a: "beneficial", d: ["benificial", "benefitial", "beneficail"] },
    { c: 'Spelled Right', t: 3, q: "Which spelling of the word meaning 'a sense of right and wrong' is right?", a: "conscience", d: ["concience", "conscence", "consciense"] },
    { c: 'Spelled Right', t: 4, q: "Which spelling would win a spelling bee?", a: "belligerent", d: ["beligerent", "belligerant", "bellijerent"] },
    { c: 'Spelled Right', t: 5, q: "Which is the correct spelling?", a: "Chihuahua", d: ["Chihauhau", "Chiuahua", "Chihuahau"] },
  ],
  // day 44
  [
    { c: 'Spelled Right', t: 1, q: "Which spelling would win a spelling bee?", a: "busy", d: ["buzy", "buisy", "bisy"] },
    { c: 'Spelled Right', t: 2, q: "Which is the correct spelling?", a: "career", d: ["carreer", "carear", "creer"] },
    { c: 'Spelled Right', t: 3, q: "Which is the correct spelling of the word meaning 'awake and aware'?", a: "conscious", d: ["concious", "consious", "conscous"] },
    { c: 'Spelled Right', t: 4, q: "Which spelling is correct for the word meaning 'able to float'?", a: "buoyant", d: ["bouyant", "buoyent", "boyant"] },
    { c: 'Spelled Right', t: 5, q: "Which spelling is correct in American English?", a: "concupiscence", d: ["concupisence", "concupiscense", "conkupiscence"] },
  ],
  // day 45
  [
    { c: 'Spelled Right', t: 1, q: "Which of these is spelled correctly?", a: "circle", d: ["cirkle", "sircle", "circel"] },
    { c: 'Spelled Right', t: 2, q: "Which spelling is correct in American English?", a: "certain", d: ["certian", "sertain", "certin"] },
    { c: 'Spelled Right', t: 3, q: "Which spelling would a careful copy editor approve?", a: "deceive", d: ["decieve", "deceeve", "diceive"] },
    { c: 'Spelled Right', t: 4, q: "Which of these words is spelled right?", a: "cacophony", d: ["cacaphony", "cacophany", "kakophony"] },
    { c: 'Spelled Right', t: 5, q: "Which is the correct spelling of the word meaning 'an unpleasant smell or vapor'?", a: "effluvium", d: ["effluvim", "efluvium", "effluviam"] },
  ],
  // day 46
  [
    { c: 'Spelled Right', t: 1, q: "Which of these words is spelled right?", a: "clothes", d: ["clothse", "clothez", "cloathes"] },
    { c: 'Spelled Right', t: 2, q: "Which one is the right spelling?", a: "character", d: ["charachter", "charactor", "caracter"] },
    { c: 'Spelled Right', t: 3, q: "Which spelling would win a spelling bee?", a: "desperate", d: ["desparate", "desperite", "dessperate"] },
    { c: 'Spelled Right', t: 4, q: "Which is the correct spelling?", a: "catastrophe", d: ["catastrophy", "catastrofe", "cattastrophe"] },
    { c: 'Spelled Right', t: 5, q: "Which spelling is correct for the word meaning 'a brass instrument like a small tuba'?", a: "euphonium", d: ["eufonium", "euphoneum", "euphonnium"] },
  ],
  // day 47
  [
    { c: 'Spelled Right', t: 1, q: "Which is the correct spelling?", a: "couple", d: ["cuple", "coupel", "couppel"] },
    { c: 'Spelled Right', t: 2, q: "Which is spelled correctly?", a: "chief", d: ["cheif", "cheef", "chieff"] },
    { c: 'Spelled Right', t: 3, q: "Which of these is spelled correctly?", a: "disastrous", d: ["disasterous", "disastrus", "dissastrous"] },
    { c: 'Spelled Right', t: 4, q: "Which spelling is correct in American English?", a: "cinnamon", d: ["cinamon", "cinnemon", "cinnamin"] },
    { c: 'Spelled Right', t: 5, q: "Which spelling of the word meaning 'meat stewed and served in a white sauce' is right?", a: "fricassee", d: ["fricasee", "frickassee", "fricassie"] },
  ],
  // day 48
  [
    { c: 'Spelled Right', t: 1, q: "Which spelling is correct in American English?", a: "dollar", d: ["doller", "dolar", "dollor"] },
    { c: 'Spelled Right', t: 2, q: "Which spelling would a careful copy editor approve?", a: "cupboard", d: ["cubbord", "cupbord", "cubboard"] },
    { c: 'Spelled Right', t: 3, q: "Which of these words is spelled right?", a: "discipline", d: ["disipline", "dicipline", "discipine"] },
    { c: 'Spelled Right', t: 4, q: "Which one is the right spelling?", a: "consensus", d: ["concensus", "consencus", "consensous"] },
    { c: 'Spelled Right', t: 5, q: "Which spelling would win a spelling bee?", a: "gesundheit", d: ["gesundhite", "gezundheit", "gesundheidt"] },
  ],
  // day 49
  [
    { c: 'Spelled Right', t: 1, q: "Which one is the right spelling?", a: "ankle", d: ["ankel", "ankkle", "anckle"] },
    { c: 'Spelled Right', t: 2, q: "Which spelling would win a spelling bee?", a: "decision", d: ["decission", "desicion", "decisoin"] },
    { c: 'Spelled Right', t: 3, q: "Which is the correct spelling?", a: "equipment", d: ["equiptment", "equipmint", "equippment"] },
    { c: 'Spelled Right', t: 4, q: "Which is spelled correctly?", a: "diaphragm", d: ["diaphram", "diafragm", "diaphragme"] },
    { c: 'Spelled Right', t: 5, q: "Which spelling is correct for the word meaning 'a biography that idealizes its subject'?", a: "hagiography", d: ["hagiografy", "hagography", "haggiography"] },
  ],
  // day 50
  [
    { c: 'Spelled Right', t: 1, q: "Which is spelled correctly?", a: "dozen", d: ["dozzen", "dozan", "duzen"] },
    { c: 'Spelled Right', t: 2, q: "Which of these is spelled correctly?", a: "develop", d: ["devellop", "divelop", "develup"] },
    { c: 'Spelled Right', t: 3, q: "Which spelling is correct in American English?", a: "excellent", d: ["excelent", "exellent", "excellant"] },
    { c: 'Spelled Right', t: 4, q: "Which spelling would a careful copy editor approve?", a: "dichotomy", d: ["dicotomy", "dichotemy", "dychotomy"] },
    { c: 'Spelled Right', t: 5, q: "Which spelling of the word meaning 'a severe, sudden allergic reaction' is right?", a: "anaphylaxis", d: ["anaphalaxis", "anafylaxis", "anaphylaxsis"] },
  ],
  // day 51
  [
    { c: 'Spelled Right', t: 1, q: "Which spelling would a careful copy editor approve?", a: "early", d: ["erly", "earley", "urly"] },
    { c: 'Spelled Right', t: 2, q: "Which of these words is spelled right?", a: "disease", d: ["desease", "diseise", "disese"] },
    { c: 'Spelled Right', t: 3, q: "Which one is the right spelling?", a: "experience", d: ["experiance", "expirience", "experence"] },
    { c: 'Spelled Right', t: 4, q: "Which spelling of the word meaning 'a skin condition that causes itchy patches' is right?", a: "eczema", d: ["exzema", "eczemma", "ekzema"] },
    { c: 'Spelled Right', t: 5, q: "Which is the correct spelling of the word meaning 'a confused mixture'?", a: "farrago", d: ["farago", "farrogo", "farraggo"] },
  ],
  // day 52
  [
    { c: 'Spelled Right', t: 1, q: "Which spelling would win a spelling bee?", a: "easy", d: ["easey", "eazy", "easie"] },
    { c: 'Spelled Right', t: 2, q: "Which is the correct spelling?", a: "forward", d: ["foward", "forwerd", "forrward"] },
    { c: 'Spelled Right', t: 3, q: "Which is spelled correctly?", a: "fiery", d: ["firey", "fierey", "fierry"] },
    { c: 'Spelled Right', t: 4, q: "Which of these is spelled correctly?", a: "exorbitant", d: ["exhorbitant", "exorbitent", "exorbittant"] },
    { c: 'Spelled Right', t: 5, q: "Which spelling is correct in American English?", a: "impresario", d: ["impressario", "impressarrio", "impresarrio"] },
  ],
  // day 53
  [
    { c: 'Spelled Right', t: 1, q: "Which of these is spelled correctly?", a: "eight", d: ["eaght", "eihgt", "eiht"] },
    { c: 'Spelled Right', t: 2, q: "Which spelling is correct in American English?", a: "favorite", d: ["favorit", "favrite", "favoritte"] },
    { c: 'Spelled Right', t: 3, q: "Which spelling would a careful copy editor approve?", a: "gauge", d: ["guage", "gaige", "gaugue"] },
    { c: 'Spelled Right', t: 4, q: "Which spelling is correct for the word meaning 'an exact copy'?", a: "facsimile", d: ["facsimilie", "facsimily", "facksimile"] },
    { c: 'Spelled Right', t: 5, q: "Which spelling of the word meaning 'a casual lack of concern' is right?", a: "insouciance", d: ["insousiance", "insouciense", "insousciance"] },
  ],
  // day 54
  [
    { c: 'Spelled Right', t: 1, q: "Which of these words is spelled right?", a: "eleven", d: ["elevin", "eleaven", "elevan"] },
    { c: 'Spelled Right', t: 2, q: "Which one is the right spelling?", a: "imagine", d: ["immagine", "imagin", "imajine"] },
    { c: 'Spelled Right', t: 3, q: "Which spelling would win a spelling bee?", a: "grateful", d: ["greatful", "gratefull", "graitful"] },
    { c: 'Spelled Right', t: 4, q: "Which is the correct spelling?", a: "flamboyant", d: ["flamboyent", "flambuoyant", "flamboyiant"] },
    { c: 'Spelled Right', t: 5, q: "Which is the correct spelling of the word meaning 'very talkative'?", a: "loquacious", d: ["loquatious", "loquacius", "loquacous"] },
  ],
  // day 55
  [
    { c: 'Spelled Right', t: 1, q: "Which is the correct spelling?", a: "carrot", d: ["carot", "carrit", "karrot"] },
    { c: 'Spelled Right', t: 2, q: "Which is spelled correctly?", a: "lonely", d: ["lonley", "lonly", "lonelly"] },
    { c: 'Spelled Right', t: 3, q: "Which of these is spelled correctly?", a: "ignorance", d: ["ignorence", "ignorrance", "ignorannce"] },
    { c: 'Spelled Right', t: 4, q: "Which spelling is correct in American English?", a: "genealogy", d: ["geneology", "genealagy", "geneaology"] },
    { c: 'Spelled Right', t: 5, q: "Which spelling is correct for the word meaning 'a bright yellow-green color'?", a: "chartreuse", d: ["chartruese", "chartreus", "shartreuse"] },
  ],
  // day 56
  [
    { c: 'Spelled Right', t: 1, q: "Which spelling is correct in American English?", a: "gallon", d: ["galon", "gallin", "gallun"] },
    { c: 'Spelled Right', t: 2, q: "Which spelling would a careful copy editor approve?", a: "actually", d: ["actualy", "acctually", "actully"] },
    { c: 'Spelled Right', t: 3, q: "Which of these words is spelled right?", a: "incidentally", d: ["incidentaly", "insidentally", "incidentilly"] },
    { c: 'Spelled Right', t: 4, q: "Which one is the right spelling?", a: "glockenspiel", d: ["glockenspeil", "glokenspiel", "glockenspeel"] },
    { c: 'Spelled Right', t: 5, q: "Which spelling would win a spelling bee?", a: "ebullience", d: ["ebulience", "ebulliance", "ebullyence"] },
  ],
  // day 57
  [
    { c: 'Spelled Right', t: 1, q: "Which one is the right spelling?", a: "fruit", d: ["froot", "fruite", "frute"] },
    { c: 'Spelled Right', t: 2, q: "Which spelling would win a spelling bee?", a: "beggar", d: ["begger", "beggur", "beggerr"] },
    { c: 'Spelled Right', t: 3, q: "Which is the correct spelling?", a: "eligible", d: ["eligable", "elligible", "eligibel"] },
    { c: 'Spelled Right', t: 4, q: "Which is spelled correctly?", a: "guillotine", d: ["guillotene", "guilotine", "gillotine"] },
    { c: 'Spelled Right', t: 5, q: "Which is the correct spelling of the word meaning 'a Welsh festival of music and poetry'?", a: "eisteddfod", d: ["eistedfod", "eisteddfodd", "eistedfodd"] },
  ],
  // day 58
  [
    { c: 'Spelled Right', t: 1, q: "Which is spelled correctly?", a: "funny", d: ["funy", "funnie", "phunny"] },
    { c: 'Spelled Right', t: 2, q: "Which of these is spelled correctly?", a: "brief", d: ["breif", "brieff", "breef"] },
    { c: 'Spelled Right', t: 3, q: "Which spelling is correct in American English?", a: "intelligence", d: ["inteligence", "intelligance", "intellegence"] },
    { c: 'Spelled Right', t: 4, q: "Which spelling would a careful copy editor approve?", a: "haphazard", d: ["haphasard", "hapazard", "haphazzard"] },
    { c: 'Spelled Right', t: 5, q: "Which of these words is spelled right?", a: "harlequin", d: ["harlaquin", "harlequinn", "harliquin"] },
  ],
  // day 59
  [
    { c: 'Spelled Right', t: 1, q: "Which spelling would a careful copy editor approve?", a: "giraffe", d: ["girafe", "jiraffe", "giraff"] },
    { c: 'Spelled Right', t: 2, q: "Which of these words is spelled right?", a: "bruise", d: ["bruse", "brooise", "bruize"] },
    { c: 'Spelled Right', t: 3, q: "Which one is the right spelling?", a: "irrelevant", d: ["irrelevent", "irelevant", "irrevelant"] },
    { c: 'Spelled Right', t: 4, q: "Which spelling is correct for the word meaning 'shockingly evil'?", a: "heinous", d: ["heinus", "hienous", "heinious"] },
    { c: 'Spelled Right', t: 5, q: "Which spelling of the word meaning 'small Italian dumplings' is right?", a: "gnocchi", d: ["gnochi", "nyocchi", "gnocci"] },
  ],
  // day 60
  [
    { c: 'Spelled Right', t: 1, q: "Which spelling would win a spelling bee?", a: "guess", d: ["gess", "guese", "guss"] },
    { c: 'Spelled Right', t: 2, q: "Which is the correct spelling?", a: "captain", d: ["captian", "capten", "captin"] },
    { c: 'Spelled Right', t: 3, q: "Which is spelled correctly?", a: "knowledge", d: ["knowlege", "knowledg", "knolwedge"] },
    { c: 'Spelled Right', t: 4, q: "Which of these is spelled correctly?", a: "impeccable", d: ["impecable", "impeccible", "impeckable"] },
    { c: 'Spelled Right', t: 5, q: "Which is the correct spelling of the word meaning 'a heavy ribbed fabric used for ribbons'?", a: "grosgrain", d: ["grossgrain", "grograin", "grosgrane"] },
  ],
  // day 61
  [
    { c: 'Spelled Right', t: 1, q: "Which of these is spelled correctly?", a: "half", d: ["halff", "halph", "hallf"] },
    { c: 'Spelled Right', t: 2, q: "Which spelling is correct in American English?", a: "daily", d: ["dayly", "dailey", "dailly"] },
    { c: 'Spelled Right', t: 3, q: "Which spelling would a careful copy editor approve?", a: "accessible", d: ["accessable", "acessible", "accesible"] },
    { c: 'Spelled Right', t: 4, q: "Which of these words is spelled right?", a: "inadvertent", d: ["inadvertant", "inadvertint", "innadvertent"] },
    { c: 'Spelled Right', t: 5, q: "Which one is the right spelling?", a: "hirsute", d: ["hirsuit", "hersute", "hirsoot"] },
  ],
  // day 62
  [
    { c: 'Spelled Right', t: 1, q: "Which of these words is spelled right?", a: "happened", d: ["happend", "hapened", "happenned"] },
    { c: 'Spelled Right', t: 2, q: "Which one is the right spelling?", a: "fierce", d: ["feirce", "fierse", "firce"] },
    { c: 'Spelled Right', t: 3, q: "Which spelling would win a spelling bee?", a: "allegiance", d: ["allegience", "alegiance", "allegance"] },
    { c: 'Spelled Right', t: 4, q: "Which spelling is correct for the word meaning 'a planned route for a trip'?", a: "itinerary", d: ["itinery", "itenerary", "itinerery"] },
    { c: 'Spelled Right', t: 5, q: "Which spelling of the word meaning 'one who attacks cherished beliefs' is right?", a: "iconoclast", d: ["iconaclast", "ikonoclast", "iconoklast"] },
  ],
  // day 63
  [
    { c: 'Spelled Right', t: 1, q: "Which is the correct spelling?", a: "circus", d: ["circis", "sircus", "curcus"] },
    { c: 'Spelled Right', t: 2, q: "Which is spelled correctly?", a: "fourteen", d: ["forteen", "fourtean", "fourtine"] },
    { c: 'Spelled Right', t: 3, q: "Which of these is spelled correctly?", a: "arctic", d: ["arktic", "arctik", "arcttic"] },
    { c: 'Spelled Right', t: 4, q: "Which spelling is correct in American English?", a: "labyrinth", d: ["labrynth", "labyrynth", "labirinth"] },
    { c: 'Spelled Right', t: 5, q: "Which spelling would a careful copy editor approve?", a: "jacquard", d: ["jaquard", "jacquarde", "jacqard"] },
  ],
  // day 64
  [
    { c: 'Spelled Right', t: 1, q: "Which spelling is correct in American English?", a: "hungry", d: ["hungrey", "hungery", "hungrie"] },
    { c: 'Spelled Right', t: 2, q: "Which spelling would a careful copy editor approve?", a: "grief", d: ["greif", "grieff", "greaf"] },
    { c: 'Spelled Right', t: 3, q: "Which spelling of the word meaning 'very strange or unusual' is right?", a: "bizarre", d: ["bizzare", "bizare", "bizzarre"] },
    { c: 'Spelled Right', t: 4, q: "Which one is the right spelling?", a: "larynx", d: ["larnyx", "larynks", "larinx"] },
    { c: 'Spelled Right', t: 5, q: "Which spelling is correct for the word meaning 'a collective community in Israel'?", a: "kibbutz", d: ["kibutz", "kibbuts", "kibbuz"] },
  ],
  // day 65
  [
    { c: 'Spelled Right', t: 1, q: "Which one is the right spelling?", a: "idea", d: ["idia", "ideah", "iddea"] },
    { c: 'Spelled Right', t: 2, q: "Which spelling would win a spelling bee?", a: "handsome", d: ["hansome", "handsom", "handsum"] },
    { c: 'Spelled Right', t: 3, q: "Which is the correct spelling?", a: "category", d: ["catagory", "categorey", "cattegory"] },
    { c: 'Spelled Right', t: 4, q: "Which is spelled correctly?", a: "forfeit", d: ["forfiet", "forefeit", "forfit"] },
    { c: 'Spelled Right', t: 5, q: "Which of these is spelled correctly?", a: "legionnaire", d: ["legionaire", "legionnair", "leggionaire"] },
  ],
  // day 66
  [
    { c: 'Spelled Right', t: 1, q: "Which is spelled correctly?", a: "instead", d: ["insted", "instaed", "insteed"] },
    { c: 'Spelled Right', t: 2, q: "Which of these is spelled correctly?", a: "coming", d: ["comming", "comeing", "comeng"] },
    { c: 'Spelled Right', t: 3, q: "Which spelling is correct in American English?", a: "curiosity", d: ["curiousity", "curiosety", "curiosaty"] },
    { c: 'Spelled Right', t: 4, q: "Which spelling would a careful copy editor approve?", a: "annihilate", d: ["anihilate", "annialate", "annihalate"] },
    { c: 'Spelled Right', t: 5, q: "Which is the correct spelling of the word meaning 'one who is learning the alphabet'?", a: "abecedarian", d: ["abecedarean", "abacedarian", "abecedarrian"] },
  ],
  // day 67
  [
    { c: 'Spelled Right', t: 1, q: "Which spelling is correct in American English?", a: "jacket", d: ["jackit", "jaket", "jackett"] },
    { c: 'Spelled Right', t: 2, q: "Which of these words is spelled right?", a: "careful", d: ["carefull", "carefle", "carefool"] },
    { c: 'Spelled Right', t: 3, q: "Which one is the right spelling?", a: "dumbbell", d: ["dumbell", "dumbel", "dummbell"] },
    { c: 'Spelled Right', t: 4, q: "Which spelling would win a spelling bee?", a: "commemorate", d: ["comemorate", "commemmorate", "comemmorate"] },
    { c: 'Spelled Right', t: 5, q: "Which is the correct spelling?", a: "anemone", d: ["anemonie", "anenome", "annemone"] },
  ],
  // day 68
  [
    { c: 'Spelled Right', t: 1, q: "Which spelling would win a spelling bee?", a: "candy", d: ["candey", "candee", "canndy"] },
    { c: 'Spelled Right', t: 2, q: "Which is the correct spelling?", a: "excitement", d: ["exitement", "excitment", "excitemint"] },
    { c: 'Spelled Right', t: 3, q: "Which is spelled correctly?", a: "gorgeous", d: ["gorgous", "gorjeous", "gorgeus"] },
    { c: 'Spelled Right', t: 4, q: "Which of these is spelled correctly?", a: "eccentric", d: ["eccentrick", "ecentric", "eccentryc"] },
    { c: 'Spelled Right', t: 5, q: "Which spelling of the word meaning 'deep sky blue' is right?", a: "cerulean", d: ["cerulian", "ceruleun", "ceroolean"] },
  ],
  // day 69
  [
    { c: 'Spelled Right', t: 1, q: "Which of these is spelled correctly?", a: "juice", d: ["juise", "jooce", "juce"] },
    { c: 'Spelled Right', t: 2, q: "Which spelling is correct in American English?", a: "January", d: ["Janury", "Januery", "Janurary"] },
    { c: 'Spelled Right', t: 3, q: "Which spelling would a careful copy editor approve?", a: "guidance", d: ["guidence", "guidanse", "gidance"] },
    { c: 'Spelled Right', t: 4, q: "Which spelling of the word meaning 'to make a problem worse' is right?", a: "exacerbate", d: ["exasperbate", "exaserbate", "exacerbait"] },
    { c: 'Spelled Right', t: 5, q: "Which one is the right spelling?", a: "diphthong", d: ["dipthong", "difthong", "diphthonge"] },
  ],
  // day 70
  [
    { c: 'Spelled Right', t: 1, q: "Which of these words is spelled right?", a: "lemon", d: ["lemmon", "lemen", "lemin"] },
    { c: 'Spelled Right', t: 2, q: "Which one is the right spelling?", a: "label", d: ["lable", "labell", "labal"] },
    { c: 'Spelled Right', t: 3, q: "Which spelling would win a spelling bee?", a: "hypocrisy", d: ["hypocracy", "hipocrisy", "hypocrisey"] },
    { c: 'Spelled Right', t: 4, q: "Which is the correct spelling?", a: "isthmus", d: ["ishmus", "isthmas", "ismus"] },
    { c: 'Spelled Right', t: 5, q: "Which spelling is correct for the word meaning 'a full skirt with a tight waistband'?", a: "dirndl", d: ["dirndel", "dirndle", "durndl"] },
  ],
  // day 71
  [
    { c: 'Spelled Right', t: 1, q: "Which is the correct spelling?", a: "aunt", d: ["awnt", "ahnt", "aunte"] },
    { c: 'Spelled Right', t: 2, q: "Which is spelled correctly?", a: "knock", d: ["knoc", "knok", "knnock"] },
    { c: 'Spelled Right', t: 3, q: "Which of these is spelled correctly?", a: "kindergarten", d: ["kindergarden", "kindegarten", "kintergarten"] },
    { c: 'Spelled Right', t: 4, q: "Which spelling is correct in American English?", a: "boulevard", d: ["boulevarde", "bulevard", "boulavard"] },
    { c: 'Spelled Right', t: 5, q: "Which spelling of the word meaning 'a long, mournful complaint' is right?", a: "jeremiad", d: ["jerremiad", "jeramiad", "jeremiade"] },
  ],
  // day 72
  [
    { c: 'Spelled Right', t: 1, q: "Which spelling is correct in American English?", a: "glove", d: ["gluv", "glov", "glovve"] },
    { c: 'Spelled Right', t: 2, q: "Which spelling would a careful copy editor approve?", a: "genuine", d: ["genuin", "jenuine", "genuwine"] },
    { c: 'Spelled Right', t: 3, q: "Which of these words is spelled right?", a: "glamorous", d: ["glamorus", "glammorous", "glamerous"] },
    { c: 'Spelled Right', t: 4, q: "Which one is the right spelling?", a: "crescendo", d: ["cresendo", "crecendo", "crescendoe"] },
    { c: 'Spelled Right', t: 5, q: "Which spelling would win a spelling bee?", a: "dodecahedron", d: ["dodecahedren", "dodecaheadron", "dodekahedron"] },
  ],
  // day 73
  [
    { c: 'Spelled Right', t: 1, q: "Which one is the right spelling?", a: "hour", d: ["houre", "howr", "hourr"] },
    { c: 'Spelled Right', t: 2, q: "Which spelling would win a spelling bee?", a: "awful", d: ["awfull", "awfal", "awfel"] },
    { c: 'Spelled Right', t: 3, q: "Which is the correct spelling?", a: "acceptable", d: ["acceptible", "acceptabel", "aceptable"] },
    { c: 'Spelled Right', t: 4, q: "Which is spelled correctly?", a: "chandelier", d: ["chandeleir", "shandelier", "chandelear"] },
    { c: 'Spelled Right', t: 5, q: "Which of these is spelled correctly?", a: "Kilimanjaro", d: ["Kilimanjero", "Killimanjaro", "Kilamanjaro"] },
  ],
  // day 74
  [
    { c: 'Spelled Right', t: 1, q: "Which is spelled correctly?", a: "cough", d: ["cof", "cowgh", "coughe"] },
    { c: 'Spelled Right', t: 2, q: "Which of these is spelled correctly?", a: "confetti", d: ["confeti", "conffetti", "confettie"] },
    { c: 'Spelled Right', t: 3, q: "Which spelling is correct in American English?", a: "convenient", d: ["conveniant", "convinient", "convenent"] },
    { c: 'Spelled Right', t: 4, q: "Which spelling would a careful copy editor approve?", a: "fuselage", d: ["fusilage", "fuselege", "fusellage"] },
    { c: 'Spelled Right', t: 5, q: "Which spelling of the word meaning 'very small' is right?", a: "Lilliputian", d: ["Liliputian", "Lilliputtian", "Lillipution"] },
  ],
];
