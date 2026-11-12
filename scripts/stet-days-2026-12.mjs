// The authored Stet boards for 2026-12-01 .. 2026-12-31 (#138 .. #168), read by
// scripts/gen-stet.mjs (`--segment 2026-12-01`). Same shape as the DAYS table in
// gen-stet.mjs: one entry per day in calendar order, `d` the subject domain, `t`
// the sentence, `e` the errors as [wrong, fix, kind, note] with kind 'g' for
// grammar and 'w' for word choice/spelling, `c` the cleanNote when there are no
// errors. Every sentence was written by hand; every pair was checked against the
// 563 already banked (the verifier fails a repeat), every verb-form key was read
// against its auxiliary (VERB_DIRECTION_FROM: after had/been the participle,
// with no auxiliary the simple past), and no pair sits on the dialect axis.
// The printed copy is British, per the two owner rulings in app/stet/puzzles.js.
// No collective noun carries an agreement error: British copy may take either
// number with one (the council are), so every agreement slip below turns on a
// subject that is singular or plural in both dialects (each, neither, cost,
// box, survey, report, both, two of the wards).
export const START = '2026-12-01';
export const END = '2026-12-31';
export const FIRST_NUM = 138;   // the bank ends at #137, 2026-11-30

export const DAYS = [
  // ── #138 Tue 1 Dec ──────────────────────────────────────────────────────
  [
    { d: 'edu', t: "The head said pupils had pored over the old maps before the trip to the coast.", c: 'Clean copy: to pore over is to study closely; pour would tip a liquid.' },
    { d: 'nature', t: "The ranger said a young hair had been seen boxing in the field at dawn.", e: [['hair', 'hare', 'w', 'A hare is the animal that boxes in spring fields; hair grows on the head.']] },
    { d: 'gov', t: "The burrow council said bin collections would move to Thursdays from March.", e: [['burrow', 'borough', 'w', 'A borough is a town or district; a burrow is an animal\'s hole.']] },
    { d: 'sport', t: "The cost of the new floodlights are to be shared between the two clubs.", e: [['are', 'is', 'g', 'The subject is cost, which is singular, so the verb is is.']] },
    { d: 'food', t: "The farm shop sold out of its slow gin a week before Christmas.", e: [['slow', 'sloe', 'w', 'Sloe gin is made from sloes, the fruit of the blackthorn.']] },
  ],
  // ── #139 Wed 2 Dec ──────────────────────────────────────────────────────
  [
    { d: 'rail', t: "A bolder the size of a car blocked the line below the cutting for six hours.", e: [['bolder', 'boulder', 'w', 'A boulder is a large rock; bolder means braver.']] },
    { d: 'law', t: "The court heard that the money was split between his brother and he.", e: [['he', 'him', 'g', 'After the preposition between the pronoun takes the object form: him.']] },
    { d: 'weather', t: "Forecasters said lightning hit the church spire twice in an hour.", c: 'Clean copy: lightning is the flash in a storm; lightening means making lighter.' },
    { d: 'biz', t: "Analysts said the weak orders did not auger well for the spring.", e: [['auger', 'augur', 'w', 'To augur is to foretell; an auger is a tool for boring holes.']] },
    { d: 'health', t: "The ward sister said staff had been run off their feet since the outbreak began.", c: 'Clean copy: had been run is the right participle, and run off their feet is plainly put.' },
  ],
  // ── #140 Thu 3 Dec ──────────────────────────────────────────────────────
  [
    { d: 'arts', t: "The novel's heroin is a lighthouse keeper's daughter who rows out in a gale.", e: [['heroin', 'heroine', 'w', 'A heroine is the leading woman of a story; heroin is a drug.']] },
    { d: 'sci', t: "The two comets appears to have broken away from a single body.", e: [['appears', 'appear', 'g', 'Comets is plural, so the verb is appear.']] },
    { d: 'coast', t: "The first fairy to the island leaves the harbour at seven.", e: [['fairy', 'ferry', 'w', 'A ferry carries passengers across water; a fairy is a creature of folklore.']] },
    { d: 'farm', t: "The maze harvest was poor after a wet September on the clay.", e: [['maze', 'maize', 'w', 'Maize is the cereal crop; a maze is a puzzle of paths.']] },
    { d: 'gov', t: "The town's population increased rapid after the new estate opened.", e: [['rapid', 'rapidly', 'g', 'Increased is a verb, so it takes the adverb rapidly.']] },
  ],
  // ── #141 Fri 4 Dec ──────────────────────────────────────────────────────
  [
    { d: 'law', t: "Police said they would not persecute the driver after viewing the footage.", e: [['persecute', 'prosecute', 'w', 'To prosecute is to bring a criminal charge; to persecute is to harass.']] },
    { d: 'nature', t: "The warden said the colony was holding its own despite a poor breeding season.", c: 'Clean copy: its is the possessive, with no apostrophe, and it is right here.' },
    { d: 'edu', t: "The boarders said the fire alarm had woke the whole house at three.", e: [['woke', 'woken', 'g', 'After had the verb takes its participle: had woken.']] },
    { d: 'rail', t: "The last train was more than an hour overdo when it pulled in.", e: [['overdo', 'overdue', 'w', 'Overdue means late; to overdo is to do too much.']] },
    { d: 'food', t: "The fish counter had fresh place and dabs from the morning catch.", e: [['place', 'plaice', 'w', 'Plaice is a flatfish; a place is a location.']] },
  ],
  // ── #142 Sat 5 Dec ──────────────────────────────────────────────────────
  [
    { d: 'biz', t: "The firm said the principal reason for the loss was the cost of energy.", c: 'Clean copy: principal means main, which is the sense wanted here.' },
    { d: 'sport', t: "Neither of the strikers seem fit enough to start on Saturday.", e: [['seem', 'seems', 'g', 'Neither is singular, so the verb is seems.']] },
    { d: 'health', t: "The patient was sent home after a lumber puncture and a night's rest.", e: [['lumber', 'lumbar', 'w', 'Lumbar refers to the lower back; lumber is timber, or to move clumsily.']] },
    { d: 'arts', t: "The choir sang by candlelight while the bells were rung for midnight.", c: 'Clean copy: the bells were rung takes the participle, which is right after were.' },
    { d: 'weather', t: "By noon the rain was teaming down and the ford was closed.", e: [['teaming', 'teeming', 'w', 'Teeming means pouring heavily; teaming means forming a team.']] },
  ],
  // ── #143 SUN 6 Dec ──────────────────────────────────────────────────────
  [
    { d: 'coast', t: "The coastguard said the yacht had sunk in calm water a mile off the point.", c: 'Clean copy: after had the participle sunk is right; sank would be the error.' },
    { d: 'gov', t: "Each of the three bridges require a full inspection before the road reopens.", e: [['require', 'requires', 'g', 'Each is singular, so the verb is requires.']] },
    { d: 'food', t: "The pub's winter ail is brewed with honey, and its pickled beat comes from the next farm.", e: [['ail', 'ale', 'w', 'Ale is beer; to ail is to be ill.'], ['beat', 'beet', 'w', 'Beet is the root vegetable; to beat is to strike or defeat.', ['beetroot']]] },
    { d: 'sci', t: "Prospectors in the 1850s followed a rich load of tin into the hillside.", e: [['load', 'lode', 'w', 'A lode is a vein of ore; a load is something carried.']] },
    { d: 'law', t: "The defendant admitted he had became careless at the wheel, and detectives deducted from the tyre marks that he was speeding.", e: [['became', 'become', 'g', 'After had the verb takes its participle: had become.'], ['deducted', 'deduced', 'w', 'To deduce is to work something out by reasoning; to deduct is to subtract.']] },
    { d: 'health', t: "The surgeon said the patient had borne the long operation remarkably well.", c: 'Clean copy: borne is the participle of bear, as in had borne the strain.' },
    { d: 'arts', t: "The curator said the frescoes had been cleaned careless in the 1950s, and that the statutory in the courtyard was next.", e: [['careless', 'carelessly', 'g', 'Cleaned is a verb, so it takes the adverb carelessly.'], ['statutory', 'statuary', 'w', 'Statuary means statues taken together; statutory means set by law.']] },
  ],
  // ── #144 Mon 7 Dec ──────────────────────────────────────────────────────
  [
    { d: 'biz', t: "The quality of the fittings make all the difference to the price.", e: [['make', 'makes', 'g', 'The subject is quality, which is singular, so the verb is makes.']] },
    { d: 'coast', t: "A wail was seen breaching off the headland for the first time in a decade.", e: [['wail', 'whale', 'w', 'A whale is the sea mammal; a wail is a long cry.']] },
    { d: 'rail', t: "The replacement bus will follow the old root through the villages.", e: [['root', 'route', 'w', 'A route is a way taken; a root grows underground.']] },
    { d: 'nature', t: "The swans on the mill pond have raised five signets this year.", e: [['signets', 'cygnets', 'w', 'Cygnets are young swans; a signet is a ring or a seal.']] },
    { d: 'edu', t: "The college said fewer students had applied this year, and less money was spent on adverts.", c: 'Clean copy: fewer for students, who can be counted, and less for money.' },
  ],
  // ── #145 Tue 8 Dec ──────────────────────────────────────────────────────
  [
    { d: 'gov', t: "The county agreed to seed control of the harbour to a local trust.", e: [['seed', 'cede', 'w', 'To cede is to hand over; to seed is to sow.']] },
    { d: 'sport', t: "The captain said the side had not been fazed by the noise of the away crowd.", c: 'Clean copy: fazed means unsettled; a phase is a stage.' },
    { d: 'sci', t: "The team said the samples had lain undisturbed in the freezer for thirty years.", c: 'Clean copy: had lain is right; lain is the participle of lie, to rest.' },
    { d: 'health', t: "The box of old records contain the names of every nurse since 1920.", e: [['contain', 'contains', 'g', 'The subject is box, which is singular, so the verb is contains.']] },
    { d: 'law', t: "Solicitors advice clients to keep every receipt until the claim is settled.", e: [['advice', 'advise', 'w', 'Advise is the verb; advice is the noun.']] },
  ],
  // ── #146 Wed 9 Dec ──────────────────────────────────────────────────────
  [
    { d: 'rail', t: "Staff acted swift when the signal box lost power.", e: [['swift', 'swiftly', 'g', 'Acted is a verb, so it takes the adverb swiftly.']] },
    { d: 'food', t: "The menu offers a rib stake cooked over charcoal.", e: [['stake', 'steak', 'w', 'A steak is a cut of meat; a stake is a post or a bet.']] },
    { d: 'edu', t: "The inspectors judged each school against six criterion set out in the guidance.", e: [['criterion', 'criteria', 'g', 'Criteria is the plural; one criterion, six criteria.']] },
    { d: 'weather', t: "Visibility on the coast road was pour until well after ten.", e: [['pour', 'poor', 'w', 'Poor means bad or lacking; to pour is to tip out a liquid.']] },
    { d: 'arts', t: "The concert opened with a solo on the loot, an instrument older than the hall.", e: [['loot', 'lute', 'w', 'A lute is a stringed instrument; loot is stolen goods.']] },
  ],
  // ── #147 Thu 10 Dec ─────────────────────────────────────────────────────
  [
    { d: 'farm', t: "Round bails of hay were stacked three high along the hedge.", e: [['bails', 'bales', 'w', 'A bale is a bound bundle of hay; bail is money paid for a release.']] },
    { d: 'biz', t: "The firm said it had been trading in straightened circumstances for a year.", e: [['straightened', 'straitened', 'w', 'Straitened means restricted, from strait; straightened means made straight.']] },
    { d: 'gov', t: "Two questions remains for the committee before the budget is set.", e: [['remains', 'remain', 'g', 'Questions is plural, so the verb is remain.']] },
    { d: 'coast', t: "The harbour master said the quay would stay shut while the wall was repaired.", c: 'Clean copy: a quay is a landing place for boats, which is the word wanted.' },
    { d: 'sci', t: "Divers found that the choral had begun to bleach after the warm summer.", e: [['choral', 'coral', 'w', 'Coral is the reef-building animal; choral relates to a choir.']] },
  ],
  // ── #148 Fri 11 Dec ─────────────────────────────────────────────────────
  [
    { d: 'law', t: "The judge reminded counsel that the council's minutes were not in evidence.", c: 'Clean copy: counsel is the barrister, and the council keeps the minutes.' },
    { d: 'health', t: "The new drug works gradual, so patients may not notice a change for weeks.", e: [['gradual', 'gradually', 'g', 'Works is a verb, so it takes the adverb gradually.']] },
    { d: 'sport', t: "She drove from the first tea straight into the lake.", e: [['tea', 'tee', 'w', 'A tee is where a golf hole begins; tea is a drink.']] },
    { d: 'nature', t: "The storm brought down a row of fur trees on the edge of the forest.", e: [['fur', 'fir', 'w', 'A fir is a conifer; fur is an animal\'s coat.']] },
    { d: 'gov', t: "The minister said the scheme would affect every household in the borough.", c: 'Clean copy: affect is the verb meaning to have an influence on.' },
  ],
  // ── #149 Sat 12 Dec ─────────────────────────────────────────────────────
  [
    { d: 'arts', t: "The magician's slight of hand drew gasps from the front row.", e: [['slight', 'sleight', 'w', 'Sleight means skill or cunning, as in sleight of hand; slight means small.']] },
    { d: 'sci', t: "The balloon began its dissent over the moor shortly after noon.", e: [['dissent', 'descent', 'w', 'A descent is a downward movement; dissent is disagreement.']] },
    { d: 'food', t: "The chef said the stock had been reduced slowly to concentrate its flavour.", c: 'Clean copy: reduced slowly takes the adverb, and its has no apostrophe.' },
    { d: 'rail', t: "The broken-down engine was toad back to the depot overnight.", e: [['toad', 'towed', 'w', 'Towed means pulled along; a toad is an amphibian.']] },
    { d: 'law', t: "The judge said the duty fell on the directors, and the fine would be paid by they.", e: [['they', 'them', 'g', 'After the preposition by the pronoun takes the object form: them.']] },
  ],
  // ── #150 SUN 13 Dec ─────────────────────────────────────────────────────
  [
    { d: 'gov', t: "The mare said the two draft budgets includes a freeze on parking charges.", e: [['mare', 'mayor', 'w', 'A mayor leads a council; a mare is a female horse.'], ['includes', 'include', 'g', 'Budgets is plural, so the verb is include.']] },
    { d: 'weather', t: "Forecasters warned of hail the size of marbles, though most of the county stayed dry.", c: 'Clean copy: hail is frozen rain; hale means healthy, as in hale and hearty.' },
    { d: 'sport', t: "The climbers began the final assent of the north face before dawn.", e: [['assent', 'ascent', 'w', 'An ascent is a climb; assent is agreement.']] },
    { d: 'biz', t: "There was not many interest in the shares, and the board said it would device a new plan in the spring.", e: [['many', 'much', 'g', 'Interest here cannot be counted, so it takes much, not many.'], ['device', 'devise', 'w', 'To devise is to plan or invent; a device is a gadget or a scheme.']] },
    { d: 'health', t: "Two workers were serious hurt when the scaffold gave way.", e: [['serious', 'seriously', 'g', 'Hurt is a verb here, so it takes the adverb seriously.']] },
    { d: 'edu', t: "The head said pupils would learn their tables by wrote, and that the new textbook was a definite guide to the subject.", e: [['wrote', 'rote', 'w', 'Learning by rote is learning by repetition; wrote is the past of write.'], ['definite', 'definitive', 'w', 'Definitive means authoritative and final; definite means clear or certain.']] },
    { d: 'arts', t: "The orchestra's principal cellist said the new hall was a complement to the old one.", c: 'Clean copy: a complement completes something; a compliment is praise.' },
  ],
  // ── #151 Mon 14 Dec ─────────────────────────────────────────────────────
  [
    { d: 'farm', t: "The hay meadow was moan in July and grazed by sheep in the autumn.", e: [['moan', 'mown', 'w', 'Mown is the participle of mow; a moan is a low sound.']] },
    { d: 'rail', t: "The old rails had laid under the tarmac for half a century.", e: [['laid', 'lain', 'g', 'Lain is the participle of lie, to rest; laid is the past of lay.']] },
    { d: 'law', t: "The prisoner spent the night in a sell at the station.", e: [['sell', 'cell', 'w', 'A cell is a room for a prisoner; to sell is to exchange for money.']] },
    { d: 'health', t: "The virus inflicted hundreds of pupils across the county last winter.", e: [['inflicted', 'afflicted', 'w', 'To afflict is to cause suffering to someone; to inflict is to impose something on them.']] },
    { d: 'nature', t: "The beach woods on the escarpment turn copper in October.", e: [['beach', 'beech', 'w', 'A beech is a tree; a beach is the shore.']] },
  ],
  // ── #152 Tue 15 Dec ─────────────────────────────────────────────────────
  [
    { d: 'sport', t: "Each of the lanes give swimmers a clear view of the clock.", e: [['give', 'gives', 'g', 'Each is singular, so the verb is gives.']] },
    { d: 'coast', t: "A crews ship carrying two thousand holidaymakers docked at the harbour for the first time since 2019.", e: [['crews', 'cruise', 'w', 'A cruise ship carries holidaymakers; crews are the people who work aboard.']] },
    { d: 'gov', t: "Support for the bypass began to wain after the costs were published.", e: [['wain', 'wane', 'w', 'To wane is to decline; a wain is a farm wagon.']] },
    { d: 'food', t: "The bakery said its flour was milled from wheat grown within ten miles.", c: 'Clean copy: flour is milled from grain, and its has no apostrophe.' },
    { d: 'biz', t: "The firm went under with more than a million pounds ode to suppliers.", e: [['ode', 'owed', 'w', 'Owed is the past of owe; an ode is a poem.']] },
  ],
  // ── #153 Wed 16 Dec ─────────────────────────────────────────────────────
  [
    { d: 'arts', t: "A reverend silence fell over the hall as the first notes sounded.", e: [['reverend', 'reverent', 'w', 'Reverent means showing deep respect; a reverend is a member of the clergy.', ['reverential']]] },
    { d: 'weather', t: "The Met Office said December had so far been drier than average across the south.", c: 'Clean copy: drier is the comparative of dry, and than is the right word.' },
    { d: 'health', t: "The air ambulance flu the injured walker to hospital in twenty minutes.", e: [['flu', 'flew', 'w', 'Flew is the past of fly; flu is influenza.']] },
    { d: 'edu', t: "Results at the school have improved steady over five years.", e: [['steady', 'steadily', 'g', 'Improved is a verb, so it takes the adverb steadily.']] },
    { d: 'sci', t: "The probe's instruments had worked faultlessly for longer than its designers expected.", c: 'Clean copy: faultlessly is the adverb the verb needs, and its takes no apostrophe.' },
  ],
  // ── #154 Thu 17 Dec ─────────────────────────────────────────────────────
  [
    { d: 'gov', t: "The minister said firms that flout the rules would face larger fines.", c: 'Clean copy: to flout a rule is to defy it; to flaunt is to show off.' },
    { d: 'coast', t: "The old pier was built to load iron oar onto ships bound for Wales.", e: [['oar', 'ore', 'w', 'Ore is rock containing metal; an oar is used to row.']] },
    { d: 'farm', t: "The orchard's oldest pair tree is thought to be two hundred years old.", e: [['pair', 'pear', 'w', 'A pear is the fruit and its tree; a pair is two of something.']] },
    { d: 'law', t: "The judge said the defendant had been contemptible of the court's orders.", e: [['contemptible', 'contemptuous', 'w', 'Contemptuous means showing contempt; contemptible means deserving it.']] },
    { d: 'sport', t: "The leaders were beaten comprehensive at home, and their lead at the top is down to a single point.", e: [['comprehensive', 'comprehensively', 'g', 'Beaten is a verb here, so it takes the adverb comprehensively.']] },
  ],
  // ── #155 Fri 18 Dec ─────────────────────────────────────────────────────
  [
    { d: 'sci', t: "The two phenomenon were first described by the same astronomer in 1610.", e: [['phenomenon', 'phenomena', 'g', 'Phenomena is the plural; one phenomenon, two phenomena.']] },
    { d: 'gov', t: "Roadworks will close one lain of the bypass until March.", e: [['lain', 'lane', 'w', 'A lane is a strip of road; lain is the participle of lie.']] },
    { d: 'arts', t: "The playwright said she was loath to cut a single scene.", c: 'Clean copy: loath means reluctant, which is the sense here; to loathe is to hate.' },
    { d: 'health', t: "The trust said patients' records had been stored securely throughout the move.", c: "Clean copy: patients' is the plural possessive, and securely is the adverb." },
    { d: 'coast', t: "The harbour's see wall was breached in two places by the storm.", e: [['see', 'sea', 'w', 'The sea is the salt water; to see is to look.']] },
  ],
  // ── #156 Sat 19 Dec ─────────────────────────────────────────────────────
  [
    { d: 'biz', t: "Energy bills are expected to sore again in the spring.", e: [['sore', 'soar', 'w', 'To soar is to rise high; sore means painful.']] },
    { d: 'nature', t: "The badgers had dug a new sett beneath the old oak by the stream.", c: "Clean copy: a sett is a badger's home, and had dug is the right form." },
    { d: 'food', t: "The factory makes the breakfast serial sold in most of the country's shops.", e: [['serial', 'cereal', 'w', 'Cereal is grain, or a breakfast food made from it; a serial is a story in parts.']] },
    { d: 'sport', t: "Each of the scans show that the striker's ankle has healed.", e: [['show', 'shows', 'g', 'Each is singular, so the verb is shows.']] },
    { d: 'law', t: "The will settled the secession to the estate after years of dispute.", e: [['secession', 'succession', 'w', 'Succession is the passing of property or a title; secession is withdrawal from a union.']] },
  ],
  // ── #157 SUN 20 Dec ─────────────────────────────────────────────────────
  [
    { d: 'weather', t: "A chilli north wind blue across the moor all afternoon.", e: [['chilli', 'chilly', 'w', 'Chilly means cold; a chilli is a hot pepper.'], ['blue', 'blew', 'w', 'Blew is the past of blow; blue is a colour.']] },
    { d: 'edu', t: "The guide for new parents explain the rules on uniform.", e: [['explain', 'explains', 'g', 'The subject is guide, which is singular, so the verb is explains.']] },
    { d: 'biz', t: "The board said its decision to sell had been a discreet one, kept from staff until Monday.", c: 'Clean copy: discreet means kept quiet, which is the sense; discrete means separate.' },
    { d: 'nature', t: "The heron stood stationary in the shallows for most of an hour.", c: 'Clean copy: stationary means not moving; stationery is paper and pens.' },
    { d: 'arts', t: "The quartet's base player has retired, and the group will hold auditions in the muse behind the hall.", e: [['base', 'bass', 'w', 'A bass is the low-pitched instrument; a base is a foundation.'], ['muse', 'mews', 'w', 'A mews is a row of former stables; a muse is a source of inspiration.']] },
    { d: 'gov', t: "A poll of residents suggest most want the library kept open.", e: [['suggest', 'suggests', 'g', 'The subject is poll, which is singular, so the verb is suggests.']] },
    { d: 'law', t: "The court heard the driver had been forgave by the family, and both sides called the settlement equable.", e: [['forgave', 'forgiven', 'g', 'After had been the verb takes its participle: forgiven.'], ['equable', 'equitable', 'w', 'Equitable means fair and just; equable means calm and even-tempered.']] },
  ],
  // ── #158 Mon 21 Dec ─────────────────────────────────────────────────────
  [
    { d: 'rail', t: "The operator said trains would run to a reduced timetable on Boxing Day.", c: 'Clean copy: run to a reduced timetable is plainly put, and Boxing Day takes capitals.' },
    { d: 'coast', t: "The ferry's skipper was praised for his metal in the storm.", e: [['metal', 'mettle', 'w', 'Mettle is courage and spirit; metal is a substance such as iron.']] },
    { d: 'health', t: "The runner was treated for a bruised heal after the race.", e: [['heal', 'heel', 'w', 'The heel is the back of the foot; to heal is to get better.']] },
    { d: 'sci', t: "Each of the fossils date from the same layer of rock.", e: [['date', 'dates', 'g', 'Each is singular, so the verb is dates.']] },
    { d: 'farm', t: "The farmer said the flock had been brought down from the fell before the snow.", c: 'Clean copy: brought is the past of bring, and a fell is a hill.' },
  ],
  // ── #159 Tue 22 Dec ─────────────────────────────────────────────────────
  [
    { d: 'biz', t: "The new warehouse runs efficient enough to handle the Christmas rush.", e: [['efficient', 'efficiently', 'g', 'Runs is a verb, so it takes the adverb efficiently.']] },
    { d: 'arts', t: "The actor was made a night in the New Year honours.", e: [['night', 'knight', 'w', 'A knight holds a title from the Crown; night is the dark hours.']] },
    { d: 'law', t: "The court heard the burglar had forced the door jam with a crowbar.", e: [['jam', 'jamb', 'w', 'A jamb is the upright side of a door frame; jam is a preserve or a blockage.']] },
    { d: 'gov', t: "The town hall clock was installed during the rain of Queen Victoria.", e: [['rain', 'reign', 'w', 'A reign is a monarch\'s time on the throne; rain falls from the sky.']] },
    { d: 'nature', t: "The chicks were fully groan and left the nest within a fortnight.", e: [['groan', 'grown', 'w', 'Grown means fully developed; a groan is a low sound.']] },
  ],
  // ── #160 Wed 23 Dec ─────────────────────────────────────────────────────
  [
    { d: 'food', t: "The butcher said demand for turkeys had risen, and he had sold out of foul by Tuesday.", e: [['foul', 'fowl', 'w', 'Fowl are birds kept for meat or eggs; foul means dirty or unfair.']] },
    { d: 'sport', t: "The record for the event, set in 1968, still stand.", e: [['stand', 'stands', 'g', 'The subject is record, which is singular, so the verb is stands.']] },
    { d: 'gov', t: "The council said the parade would proceed as planned despite the weather.", c: 'Clean copy: to proceed is to go ahead; to precede is to come before.' },
    { d: 'edu', t: "The school has hired a councillor to support pupils after the fire.", e: [['councillor', 'counsellor', 'w', 'A counsellor gives advice and support; a councillor is an elected member of a council.']] },
    { d: 'weather', t: "The church's weather vein was blown off in the storm.", e: [['vein', 'vane', 'w', 'A weather vane shows which way the wind blows; a vein carries blood.']] },
  ],
  // ── #161 Thu 24 Dec ─────────────────────────────────────────────────────
  [
    { d: 'law', t: "The defendant spoke brief to confirm his name and address.", e: [['brief', 'briefly', 'g', 'Spoke is a verb, so it takes the adverb briefly.']] },
    { d: 'arts', t: "The carol service will be broadcast live from the cathedral, as it has been for decades.", c: 'Clean copy: broadcast is its own past participle, and as it has been is right.' },
    { d: 'health', t: "The nurse said the callous on the patient's foot had been caused by tight boots.", e: [['callous', 'callus', 'w', 'A callus is hardened skin; callous means unfeeling.']] },
    { d: 'rail', t: "The last trains on Christmas Eve will leave earlier than usual.", c: 'Clean copy: earlier than is the right comparison, and usual is plainly put.' },
    { d: 'sci', t: "The glider came to rest on its knows in a ploughed field.", e: [['knows', 'nose', 'w', 'The nose is the front of an aircraft; knows is the present of know.']] },
  ],
  // ── #162 Fri 25 Dec ─────────────────────────────────────────────────────
  [
    { d: 'gov', t: "The minister said the claim was holy without foundation.", e: [['holy', 'wholly', 'w', 'Wholly means entirely; holy means sacred.']] },
    { d: 'food', t: "The leftovers were rapped in foil and kept for Boxing Day.", e: [['rapped', 'wrapped', 'w', 'Wrapped means covered or folded around; rapped means knocked.']] },
    { d: 'coast', t: "The lighthouse keeper's log records a gale that tore the lantern's pain out.", e: [['pain', 'pane', 'w', 'A pane is a sheet of glass; pain is hurt.']] },
    { d: 'sport', t: "Both of the finalists takes the same train to the venue.", e: [['takes', 'take', 'g', 'Both is plural, so the verb is take.']] },
    { d: 'nature', t: "Robins defend their territory fiercely, even in the depths of winter.", c: 'Clean copy: fiercely is the adverb the verb needs, and their is the possessive.' },
  ],
  // ── #163 Sat 26 Dec ─────────────────────────────────────────────────────
  [
    { d: 'sport', t: "The Boxing Day fixtures drew the biggest crowds of the season so far.", c: 'Clean copy: drew is the right past tense of draw, and so far is plainly put.' },
    { d: 'health', t: "Two of the wards needs extra staff over the holiday.", e: [['needs', 'need', 'g', 'Two of the wards is plural, so the verb is need.']] },
    { d: 'biz', t: "The retailer said its sales had risen for the third year running.", c: 'Clean copy: had risen takes the participle, and its takes no apostrophe.' },
    { d: 'rail', t: "The service across the boarder into Scotland resumes on Monday.", e: [['boarder', 'border', 'w', 'A border is a boundary; a boarder is a lodger, or a pupil who lives in.']] },
    { d: 'arts', t: "The pantomime villain was booed, and sweets were throne into the crowd.", e: [['throne', 'thrown', 'w', 'Thrown is the participle of throw; a throne is a royal seat.']] },
  ],
  // ── #164 SUN 27 Dec ─────────────────────────────────────────────────────
  [
    { d: 'gov', t: "The new form asks each applicant for their martial status and date of birth.", e: [['martial', 'marital', 'w', 'Marital relates to marriage; martial relates to war.']] },
    { d: 'coast', t: "The village crew road across the estuary and came to the for in the final race.", e: [['road', 'rowed', 'w', 'Rowed is the past of row; a road is a way for traffic.'], ['for', 'fore', 'w', 'To come to the fore is to become prominent; for is a preposition.']] },
    { d: 'law', t: "Her client had strove to repay the two victims, who were owed five and ten thousand pounds respectfully.", e: [['strove', 'striven', 'g', 'After had the verb takes its participle: had striven.', ['strived']], ['respectfully', 'respectively', 'w', 'Respectively means in the order given; respectfully means with respect.']] },
    { d: 'sci', t: "The cliff exposes several stratum of chalk and flint.", e: [['stratum', 'strata', 'g', 'Strata is the plural; one stratum, several strata.']] },
    { d: 'farm', t: "The farmer said the ewes were in lamb and would be housed after Christmas.", c: 'Clean copy: in lamb means carrying a lamb, and ewes are female sheep.' },
    { d: 'arts', t: "The east window has been complete restored, and the vale of scaffolding came down on Friday.", e: [['complete', 'completely', 'g', 'Restored is a verb here, so it takes the adverb completely.'], ['vale', 'veil', 'w', 'A veil is a covering; a vale is a valley.']] },
    { d: 'health', t: "The hospital said the outbreak had been contained, and visiting would resume on Tuesday.", c: 'Clean copy: had been contained is the right form, and resume means start again.' },
  ],
  // ── #165 Mon 28 Dec ─────────────────────────────────────────────────────
  [
    { d: 'edu', t: "The head said the inspection had been bought forward by a month.", e: [['bought', 'brought', 'w', 'Brought is the past of bring; bought is the past of buy.']] },
    { d: 'biz', t: "The shop, like the two cafes on the square, belong to the same family.", e: [['belong', 'belongs', 'g', 'The subject is shop, which is singular, so the verb is belongs.']] },
    { d: 'weather', t: "The storm is expected to peek on Tuesday night before easing.", e: [['peek', 'peak', 'w', 'To peak is to reach the highest point; to peek is to glance.']] },
    { d: 'sport', t: "The manager said morale in the squad was high despite the defeat.", c: "Clean copy: morale is a group's spirit; a moral is a lesson." },
    { d: 'nature', t: "The fox left clear prints of its pause in the fresh snow.", e: [['pause', 'paws', 'w', 'Paws are an animal\'s feet; a pause is a short stop.']] },
  ],
  // ── #166 Tue 29 Dec ─────────────────────────────────────────────────────
  [
    { d: 'rail', t: "Services on the coast line were cancelled because of averse weather.", e: [['averse', 'adverse', 'w', 'Adverse means unfavourable; averse means unwilling.']] },
    { d: 'law', t: "The family went to court to rest control of the estate from a cousin.", e: [['rest', 'wrest', 'w', 'To wrest is to take by force or effort; to rest is to lie still.']] },
    { d: 'health', t: "The trust's report, along with its two appendices, form the basis of the review.", e: [['form', 'forms', 'g', 'The subject is report, which is singular; along with does not make it plural.']] },
    { d: 'arts', t: "The orchestra mustard a full string section for the first time since the war.", e: [['mustard', 'mustered', 'w', 'Mustered means gathered together; mustard is a condiment.']] },
    { d: 'sport', t: "The champion won the single skull by four lengths.", e: [['skull', 'scull', 'w', 'A scull is an oar, or a light racing boat; a skull is the bone of the head.', ['sculls']]] },
  ],
  // ── #167 Wed 30 Dec ─────────────────────────────────────────────────────
  [
    { d: 'gov', t: "The council said the proposals would be put to a vote, and residents' views taken into account.", c: "Clean copy: residents' is the plural possessive, and taken into account is plainly put." },
    { d: 'sci', t: "Astronomers said the comet would be visible to the naked eye for a week in January.", c: 'Clean copy: visible to the naked eye is the set phrase, and would be is right.' },
    { d: 'food', t: "The jam is made from wild buries picked on the common.", e: [['buries', 'berries', 'w', 'Berries are small fruits; buries is the present of bury.']] },
    { d: 'biz', t: "The smell from the factory's waste pits hang over the estate every summer, residents told the inquiry.", e: [['hang', 'hangs', 'g', 'The subject is smell, which is singular, so the verb is hangs.']] },
    { d: 'health', t: "The patient was moved to intense care overnight.", e: [['intense', 'intensive', 'w', 'Intensive care is the hospital unit; intense means extreme or strong.']] },
  ],
  // ── #168 Thu 31 Dec ─────────────────────────────────────────────────────
  [
    { d: 'sport', t: "The visitors eventual won on penalties after a goalless draw.", e: [['eventual', 'eventually', 'g', 'Won is a verb, so it takes the adverb eventually.']] },
    { d: 'gov', t: "The council said the fireworks display would last too hours and end at one.", e: [['too', 'two', 'w', 'Two is the number; too means also, or excessively.']] },
    { d: 'weather', t: "Forecasters said the new year would begin dry and cold, with a sharp frost.", c: 'Clean copy: begin dry and cold is plainly put, and a sharp frost is a hard one.' },
    { d: 'nature', t: "A wild bore was seen in the forest for the first time in decades.", e: [['bore', 'boar', 'w', 'A boar is a wild pig; a bore is a dull person, or a surge of tide up a river.']] },
    { d: 'arts', t: "The editor made a judicial selection of the poet's letters.", e: [['judicial', 'judicious', 'w', 'Judicious means showing good judgement; judicial relates to courts and judges.']] },
  ],
];
