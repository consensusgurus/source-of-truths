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
export const LANE_DAYS = [
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
