// Vocab lane: Definitions. 36 days x 5 tiers. Scope: "What does 'X' mean?" and
// close variants; the answer is a short meaning matching Merriam-Webster's primary
// sense. Split: every target word starts with A through L (the other Vocab lane
// takes M through Z). No target word is asked twice.
const L = 'Definitions';
export const LANE_DAYS = [
  // day 1
  [
    { c: L, t: 1, q: "What does 'ancient' mean?", a: "very old", d: ["very large", "very rare", "very distant"] },
    { c: L, t: 2, q: "Someone described as 'candid' is...?", a: "frank and honest", d: ["sweet and sugary", "sly and secretive", "calm and patient"] },
    { c: L, t: 3, q: "Someone described as 'gregarious' is...?", a: "fond of company", d: ["fond of solitude", "grimly serious", "outrageously bad"] },
    { c: L, t: 4, q: "If a speech is 'laconic', it is...?", a: "using very few words", d: ["long and wordy", "lacking in logic", "lightly ironic"] },
    { c: L, t: 5, q: "An 'apocryphal' story is...?", a: "of doubtful authenticity", d: ["about the end of the world", "verified by records", "written in code"] },
  ],
  // day 2
  [
    { c: L, t: 1, q: "Someone described as 'generous' is...?", a: "freely giving", d: ["easily angered", "quietly shy", "genuinely confused"] },
    { c: L, t: 2, q: "What does 'frugal' mean?", a: "careful with money", d: ["full of fruit", "careless with money", "easily frightened"] },
    { c: L, t: 3, q: "What does 'ebullient' mean?", a: "lively and enthusiastic", d: ["calm and reserved", "bored and listless", "hostile and aggressive"] },
    { c: L, t: 4, q: "Someone described as 'impecunious' is...?", a: "having little money", d: ["oddly peculiar", "beyond reproach", "very wealthy"] },
    { c: L, t: 5, q: "Someone described as 'lachrymose' is...?", a: "given to weeping", d: ["lacking energy", "given to laughter", "covered in lacquer"] },
  ],
  // day 3
  [
    { c: L, t: 1, q: "What does 'brave' mean?", a: "showing courage", d: ["showing off", "showing anger", "showing fatigue"] },
    { c: L, t: 2, q: "An 'ambiguous' answer is...?", a: "open to more than one meaning", d: ["able to use either hand", "full of ambition", "clearly stated"] },
    { c: L, t: 3, q: "An 'acerbic' remark is...?", a: "sharply bitter", d: ["warmly flattering", "vague and rambling", "oddly abstract"] },
    { c: L, t: 4, q: "Someone described as 'abstemious' is...?", a: "restrained in eating and drinking", d: ["abstract in thought", "absent-minded", "greedy at the table"] },
    { c: L, t: 5, q: "What does 'hebdomadal' mean?", a: "weekly", d: ["abdominal", "monthly", "nomadic"] },
  ],
  // day 4
  [
    { c: L, t: 1, q: "Something 'fragile' is...?", a: "easily broken", d: ["sweetly scented", "very fast", "oddly shaped"] },
    { c: L, t: 2, q: "What does 'benevolent' mean?", a: "kind and well-meaning", d: ["bent and twisted", "cruel and spiteful", "rich and powerful"] },
    { c: L, t: 3, q: "What does 'ameliorate' mean?", a: "to make better", d: ["to make worse", "to make amends", "to make bitter"] },
    { c: L, t: 4, q: "What does 'abrogate' mean?", a: "to abolish formally", d: ["to claim arrogantly", "to shorten", "to enact formally"] },
    { c: L, t: 5, q: "To 'defenestrate' someone is to...?", a: "throw them out a window", d: ["remove their defenses", "strip them of rank", "fence them in"] },
  ],
  // day 5
  [
    { c: L, t: 1, q: "What does 'eager' mean?", a: "keenly wanting something", d: ["slowly losing interest", "quietly fearing something", "loudly refusing something"] },
    { c: L, t: 2, q: "If a speech is 'concise', it is...?", a: "short and to the point", d: ["long and rambling", "loud and angry", "agreed upon by all"] },
    { c: L, t: 3, q: "Someone described as 'assiduous' is...?", a: "careful and persistent", d: ["sour and acidic", "lazy and careless", "sly and devious"] },
    { c: L, t: 4, q: "An 'apposite' remark is...?", a: "highly relevant", d: ["exactly opposite", "rude and insulting", "beside the point"] },
    { c: L, t: 5, q: "What does 'antediluvian' mean?", a: "from before the biblical Flood", d: ["opposed to irrigation", "from after the biblical Flood", "prone to sudden flooding"] },
  ],
  // day 6
  [
    { c: L, t: 1, q: "Someone described as 'humble' is...?", a: "not proud", d: ["not awake", "not honest", "not patient"] },
    { c: L, t: 2, q: "Someone described as 'diligent' is...?", a: "hardworking and careful", d: ["slow and forgetful", "quick to delegate", "delicate and frail"] },
    { c: L, t: 3, q: "If a speech is 'bombastic', it is...?", a: "pompous and inflated", d: ["explosive and violent", "plain and modest", "dull and droning"] },
    { c: L, t: 4, q: "What does 'bowdlerize' mean?", a: "to remove offensive passages", d: ["to knock down", "to translate loosely", "to bury under stones"] },
    { c: L, t: 5, q: "What does 'autochthonous' mean?", a: "native to a place", d: ["self-governing", "written by oneself", "brought from abroad"] },
  ],
  // day 7
  [
    { c: L, t: 1, q: "What does 'loyal' mean?", a: "faithful to a cause", d: ["royal by birth", "quick to anger", "bound by law"] },
    { c: L, t: 2, q: "If a speech is 'eloquent', it is...?", a: "fluent and persuasive", d: ["dull and halting", "overly long", "harsh and accusing"] },
    { c: L, t: 3, q: "What does 'cajole' mean?", a: "to coax with flattery", d: ["to lock in a cage", "to scold harshly", "to joke cruelly"] },
    { c: L, t: 4, q: "Someone described as 'captious' is...?", a: "quick to find fault", d: ["fond of giving orders", "generously forgiving", "easily captured"] },
    { c: L, t: 5, q: "What is 'borborygmus'?", a: "a rumbling of the stomach", d: ["a ringing in the ears", "a twitch of the eyelid", "a tropical fish"] },
  ],
  // day 8
  [
    { c: L, t: 1, q: "Someone described as 'clumsy' is...?", a: "awkward in movement", d: ["sticky to the touch", "shy with strangers", "quick in thought"] },
    { c: L, t: 2, q: "What does 'futile' mean?", a: "pointless and ineffective", d: ["rich and productive", "yet to happen", "useful but slow"] },
    { c: L, t: 3, q: "Someone described as 'capricious' is...?", a: "unpredictably changeable", d: ["steadily reliable", "very expensive", "roomy and spacious"] },
    { c: L, t: 4, q: "What does 'churlish' mean?", a: "rude and boorish", d: ["devoutly religious", "charmingly polite", "cheerfully childish"] },
    { c: L, t: 5, q: "What does 'crepuscular' mean?", a: "relating to twilight", d: ["relating to muscles", "relating to midday", "wrinkled like crepe"] },
  ],
  // day 9
  [
    { c: L, t: 1, q: "What does 'enormous' mean?", a: "extremely large", d: ["extremely old", "extremely rare", "extremely loud"] },
    { c: L, t: 2, q: "Someone described as 'gullible' is...?", a: "easily fooled", d: ["easily scared", "easily bored", "easily swallowed"] },
    { c: L, t: 3, q: "Someone described as 'circumspect' is...?", a: "wary and prudent", d: ["reckless and rash", "suspected of a crime", "circling and roundabout"] },
    { c: L, t: 4, q: "Someone described as 'contumacious' is...?", a: "stubbornly disobedient", d: ["highly contagious", "meekly obedient", "deeply confused"] },
    { c: L, t: 5, q: "To 'cachinnate' is to...?", a: "laugh loudly", d: ["hide in a cache", "sneeze loudly", "cough harshly"] },
  ],
  // day 10
  [
    { c: L, t: 1, q: "What does 'fierce' mean?", a: "violently aggressive", d: ["deeply proud", "sharply pointed", "oddly pale"] },
    { c: L, t: 2, q: "A judge who is 'impartial' is...?", a: "treating all sides equally", d: ["only partly finished", "favoring one side", "unable to decide"] },
    { c: L, t: 3, q: "A 'clandestine' meeting is...?", a: "secret and hidden", d: ["open and public", "held among a clan", "fated by destiny"] },
    { c: L, t: 4, q: "What does 'dilatory' mean?", a: "tending to cause delay", d: ["tending to widen", "tending to hurry", "tending to deceive"] },
    { c: L, t: 5, q: "To 'coruscate' is to...?", a: "sparkle and flash", d: ["rust and corrode", "sing in a chorus", "scold harshly"] },
  ],
  // day 11
  [
    { c: L, t: 1, q: "A 'gloomy' room is...?", a: "dark and dismal", d: ["shiny and polished", "large and airy", "cold and drafty"] },
    { c: L, t: 2, q: "A 'lenient' teacher is...?", a: "mild and tolerant", d: ["leaning to one side", "strict and demanding", "thin and lanky"] },
    { c: L, t: 3, q: "If an argument is 'cogent', it is...?", a: "clear and convincing", d: ["weak and muddled", "mechanical and rigid", "very lengthy"] },
    { c: L, t: 4, q: "An 'emollient' cream is...?", a: "softening and soothing", d: ["highly profitable", "harsh and drying", "strongly scented"] },
    { c: L, t: 5, q: "To 'deliquesce' is to...?", a: "melt away", d: ["break the law", "harden into stone", "give in quietly"] },
  ],
  // day 12
  [
    { c: L, t: 1, q: "Someone described as 'grateful' is...?", a: "thankful", d: ["graceful", "grumpy", "forgetful"] },
    { c: L, t: 2, q: "Someone described as 'adamant' is...?", a: "firmly unyielding", d: ["easily persuaded", "newly created", "deeply ashamed"] },
    { c: L, t: 3, q: "Someone described as 'convivial' is...?", a: "fond of feasting and good company", d: ["fond of quiet reading alone", "easily convinced of anything", "guilty of a serious crime"] },
    { c: L, t: 4, q: "What does 'enervate' mean?", a: "to drain of energy", d: ["to energize", "to make nervous", "to make angry"] },
    { c: L, t: 5, q: "What does 'eleemosynary' mean?", a: "relating to charity", d: ["relating to elements", "relating to the elderly", "relating to schools"] },
  ],
  // day 13
  [
    { c: L, t: 1, q: "What does 'brief' mean?", a: "short in length or time", d: ["sad from a loss", "wide in scope", "bright in color"] },
    { c: L, t: 2, q: "Someone described as 'aloof' is...?", a: "cool and distant", d: ["warm and welcoming", "high in the air", "loud and boastful"] },
    { c: L, t: 3, q: "What does 'copious' mean?", a: "plentiful", d: ["scarce", "imitative", "cramped"] },
    { c: L, t: 4, q: "To 'equivocate' is to...?", a: "speak evasively", d: ["divide equally", "speak plainly", "raise one's voice"] },
    { c: L, t: 5, q: "What is a 'gallimaufry'?", a: "a hodgepodge", d: ["a long gallery", "a gallows", "a boastful speech"] },
  ],
  // day 14
  [
    { c: L, t: 1, q: "An 'accurate' report is...?", a: "free from error", d: ["free of charge", "full of detail", "sharply worded"] },
    { c: L, t: 2, q: "What does 'apathetic' mean?", a: "showing no interest", d: ["deeply sympathetic", "pathetically weak", "easily excited"] },
    { c: L, t: 3, q: "What does 'deleterious' mean?", a: "harmful", d: ["delightful", "erased", "delayed"] },
    { c: L, t: 4, q: "What does 'execrable' mean?", a: "utterly detestable", d: ["able to be carried out", "truly excellent", "easily excused"] },
    { c: L, t: 5, q: "What does 'ineluctable' mean?", a: "impossible to avoid", d: ["impossible to elect", "reluctant to act", "impossible to explain"] },
  ],
  // day 15
  [
    { c: L, t: 1, q: "Something 'hollow' is...?", a: "empty inside", d: ["sacred and holy", "heavy and solid", "round and smooth"] },
    { c: L, t: 2, q: "Someone described as 'complacent' is...?", a: "smugly self-satisfied", d: ["anxious and unsure", "full of complaints", "fully compliant"] },
    { c: L, t: 3, q: "If a speech is 'didactic', it is...?", a: "meant to teach", d: ["meant to amuse", "meant to command", "meant to flatter"] },
    { c: L, t: 4, q: "A 'fatuous' remark is...?", a: "smugly foolish", d: ["heavy and fattening", "wise and thoughtful", "fateful and grave"] },
    { c: L, t: 5, q: "What is a 'kakistocracy'?", a: "rule by the worst people", d: ["rule by the wealthy", "rule by soldiers", "rule by priests"] },
  ],
  // day 16
  [
    { c: L, t: 1, q: "What does 'jolly' mean?", a: "merry and lively", d: ["sticky and sweet", "jealous and spiteful", "loud and rude"] },
    { c: L, t: 2, q: "A 'dormant' volcano is...?", a: "temporarily inactive", d: ["violently erupting", "permanently extinct", "shaped like a dome"] },
    { c: L, t: 3, q: "Someone described as 'diffident' is...?", a: "shy and unconfident", d: ["boldly confident", "different from others", "firmly defiant"] },
    { c: L, t: 4, q: "Someone described as 'feckless' is...?", a: "weak and irresponsible", d: ["free of freckles", "strong and reliable", "fearless"] },
    { c: L, t: 5, q: "What is 'logorrhea'?", a: "excessive wordiness", d: ["fear of speaking", "the study of logic", "a loss of memory"] },
  ],
  // day 17
  [
    { c: L, t: 1, q: "Someone described as 'lazy' is...?", a: "unwilling to work", d: ["unable to see", "unwilling to share", "unable to rest"] },
    { c: L, t: 2, q: "What does 'elated' mean?", a: "overjoyed", d: ["delayed", "deflated", "outdated"] },
    { c: L, t: 3, q: "What does 'ephemeral' mean?", a: "lasting a very short time", d: ["lasting forever", "relating to fevers", "lasting one year"] },
    { c: L, t: 4, q: "A 'fractious' child is...?", a: "irritable and unruly", d: ["broken into pieces", "calm and obedient", "small and frail"] },
    { c: L, t: 5, q: "What is 'eschatology'?", a: "study of the end times", d: ["study of escape routes", "study of fossils", "study of ancient script"] },
  ],
  // day 18
  [
    { c: L, t: 1, q: "What does 'cautious' mean?", a: "careful about danger", d: ["causing great harm", "bitterly sarcastic", "eager for adventure"] },
    { c: L, t: 2, q: "A 'feasible' plan is...?", a: "able to be done", d: ["fit to be eaten", "bound to fail", "easy to see"] },
    { c: L, t: 3, q: "What does 'equanimity' mean?", a: "calmness under stress", d: ["equal division", "fondness for animals", "sudden panic"] },
    { c: L, t: 4, q: "Someone described as 'hirsute' is...?", a: "hairy", d: ["hired", "bald", "stout"] },
    { c: L, t: 5, q: "To 'bloviate' is to...?", a: "speak pompously at length", d: ["blow up balloons", "swell with water", "speak in a whisper"] },
  ],
  // day 19
  [
    { c: L, t: 1, q: "What does 'delicious' mean?", a: "very pleasing to taste", d: ["very finely made", "very hard to find", "very sour"] },
    { c: L, t: 2, q: "Someone described as 'fickle' is...?", a: "changing loyalties often", d: ["steady and reliable", "picky about food", "easily tickled"] },
    { c: L, t: 3, q: "Someone described as 'erudite' is...?", a: "deeply learned", d: ["rude and crude", "easily erupting", "poorly educated"] },
    { c: L, t: 4, q: "An 'ignominious' defeat is...?", a: "shameful and disgraceful", d: ["unknown and nameless", "glorious and proud", "fiery and fierce"] },
    { c: L, t: 5, q: "What does 'Brobdingnagian' mean?", a: "enormously large", d: ["extremely tiny", "nagging constantly", "ringing like a bell"] },
  ],
  // day 20
  [
    { c: L, t: 1, q: "What does 'famous' mean?", a: "widely known", d: ["widely hated", "rarely seen", "newly made"] },
    { c: L, t: 2, q: "What does 'gaudy' mean?", a: "showy and tasteless", d: ["plain and simple", "godly and devout", "thin and bony"] },
    { c: L, t: 3, q: "What does 'exacerbate' mean?", a: "to make worse", d: ["to make better", "to make exact", "to make sour"] },
    { c: L, t: 4, q: "To 'impugn' someone's motives is to...?", a: "call them into question", d: ["attack them with fists", "praise them openly", "keep them secret"] },
    { c: L, t: 5, q: "What is 'inanition'?", a: "exhaustion from lack of food", d: ["silliness and nonsense", "a formal opening ceremony", "a sudden rush of energy"] },
  ],
  // day 21
  [
    { c: L, t: 1, q: "A 'cozy' cabin is...?", a: "warm and comfortable", d: ["bare and cheerless", "tall and narrow", "old and crumbling"] },
    { c: L, t: 2, q: "What does 'immaculate' mean?", a: "perfectly clean", d: ["not yet mature", "badly stained", "carefully measured"] },
    { c: L, t: 3, q: "Someone described as 'fastidious' is...?", a: "very hard to please", d: ["very quick moving", "very easygoing", "very stubborn"] },
    { c: L, t: 4, q: "An 'inchoate' plan is...?", a: "only partly formed", d: ["highly detailed", "measured in inches", "drawn in charcoal"] },
    { c: L, t: 5, q: "What is an 'eructation'?", a: "a belch", d: ["an eruption", "a yawn", "a stutter"] },
  ],
  // day 22
  [
    { c: L, t: 1, q: "What does 'absent' mean?", a: "not present", d: ["not allowed", "not finished", "not awake"] },
    { c: L, t: 2, q: "Someone described as 'impulsive' is...?", a: "acting without forethought", d: ["acting with great care", "quick to repel others", "full of energy"] },
    { c: L, t: 3, q: "Someone described as 'garrulous' is...?", a: "excessively talkative", d: ["quietly reserved", "fond of gardening", "quick to quarrel"] },
    { c: L, t: 4, q: "Someone described as 'insouciant' is...?", a: "carefree and unconcerned", d: ["anxiously worried", "rudely insolent", "socially awkward"] },
    { c: L, t: 5, q: "What does 'effulgent' mean?", a: "brilliantly radiant", d: ["dull and dim", "bursting at the seams", "foul-smelling"] },
  ],
  // day 23
  [
    { c: L, t: 1, q: "Someone described as 'bold' is...?", a: "fearless and daring", d: ["hairless and smooth", "timid and quiet", "tired and weak"] },
    { c: L, t: 2, q: "What does 'inevitable' mean?", a: "certain to happen", d: ["impossible to see", "unlikely to happen", "not able to be eaten"] },
    { c: L, t: 3, q: "A 'hackneyed' phrase is...?", a: "overused and stale", d: ["fresh and original", "roughly chopped", "spoken in anger"] },
    { c: L, t: 4, q: "What does 'lugubrious' mean?", a: "exaggeratedly mournful", d: ["well oiled and slippery", "cheerfully upbeat", "heavy and clumsy"] },
    { c: L, t: 5, q: "To 'fulminate' is to...?", a: "denounce loudly", d: ["fill completely", "praise warmly", "whisper softly"] },
  ],
  // day 24
  [
    { c: L, t: 1, q: "What does 'damp' mean?", a: "slightly wet", d: ["slightly bent", "slightly cold", "slightly dim"] },
    { c: L, t: 2, q: "Someone described as 'jovial' is...?", a: "hearty and good-humored", d: ["young and childish", "grim and serious", "jealous and petty"] },
    { c: L, t: 3, q: "Someone described as 'impetuous' is...?", a: "acting rashly on emotion", d: ["fond of pets", "slow and deliberate", "rude and disrespectful"] },
    { c: L, t: 4, q: "To 'lionize' someone is to...?", a: "treat them as a celebrity", d: ["attack them fiercely", "tell lies about them", "ignore them"] },
    { c: L, t: 5, q: "Something 'frangible' is...?", a: "easily breakable", d: ["fringed at the edges", "sweet-smelling", "unbreakable"] },
  ],
  // day 25
  [
    { c: L, t: 1, q: "What does 'filthy' mean?", a: "very dirty", d: ["very thin", "very wealthy", "very full"] },
    { c: L, t: 2, q: "A 'lavish' party is...?", a: "extravagant and costly", d: ["poorly attended", "quiet and modest", "noisy and lively"] },
    { c: L, t: 3, q: "Someone described as 'indolent' is...?", a: "habitually lazy", d: ["full of energy", "deeply sorrowful", "rudely insolent"] },
    { c: L, t: 4, q: "What does 'abjure' mean?", a: "to renounce solemnly", d: ["to swear in", "to adjust slightly", "to embrace eagerly"] },
    { c: L, t: 5, q: "A 'gnomic' saying is...?", a: "terse and aphoristic", d: ["told by gnomes", "long and rambling", "crude and vulgar"] },
  ],
  // day 26
  [
    { c: L, t: 1, q: "A 'harsh' voice is...?", a: "rough and unpleasant", d: ["soft and soothing", "high and squeaky", "quiet and hushed"] },
    { c: L, t: 2, q: "Someone described as 'lethargic' is...?", a: "sluggish and listless", d: ["deadly to others", "restless and jittery", "bitterly resentful"] },
    { c: L, t: 3, q: "What does 'inscrutable' mean?", a: "impossible to understand", d: ["carefully examined", "easily read", "written in stone"] },
    { c: L, t: 4, q: "What does 'cavil' mean?", a: "to raise petty objections", d: ["to dig a cave", "to agree readily", "to act politely"] },
    { c: L, t: 5, q: "What is a 'hagiography'?", a: "a biography of a saint", d: ["a study of witches", "a map of a region", "a history of wars"] },
  ],
  // day 27
  [
    { c: L, t: 1, q: "Someone described as 'knowledgeable' is...?", a: "well-informed", d: ["easily offended", "well-dressed", "hard to know"] },
    { c: L, t: 2, q: "Handwriting that is 'legible' is...?", a: "clear enough to read", d: ["allowed by law", "too faint to read", "written in pencil"] },
    { c: L, t: 3, q: "Someone described as 'intransigent' is...?", a: "refusing to compromise", d: ["passing through briefly", "eager to bargain", "easily moved"] },
    { c: L, t: 4, q: "What does 'cupidity' mean?", a: "greed for wealth", d: ["romantic love", "generosity", "stupidity"] },
    { c: L, t: 5, q: "What is 'lucubration'?", a: "laborious study", d: ["a slippery coating", "idle daydreaming", "a lucky guess"] },
  ],
  // day 28
  [
    { c: L, t: 1, q: "What does 'lonely' mean?", a: "alone and without company", d: ["long and narrow", "lowly and poor", "loud and lively"] },
    { c: L, t: 2, q: "What does 'hinder' mean?", a: "to hold back", d: ["to push forward", "to hide away", "to look behind"] },
    { c: L, t: 3, q: "What does 'laudable' mean?", a: "worthy of praise", d: ["able to be heard", "worthy of blame", "easy to wash"] },
    { c: L, t: 4, q: "What does 'gainsay' mean?", a: "to deny or contradict", d: ["to speak in favor", "to profit from", "to repeat"] },
    { c: L, t: 5, q: "What is 'contumely'?", a: "scornful, insulting treatment", d: ["humble apology", "costume jewelry", "polite praise"] },
  ],
  // day 29
  [
    { c: L, t: 1, q: "What does 'cheerful' mean?", a: "noticeably happy", d: ["noticeably cheap", "noticeably cold", "noticeably tired"] },
    { c: L, t: 2, q: "Someone described as 'affable' is...?", a: "friendly and easy to talk to", d: ["able to be bought cheaply", "cold and unfriendly", "easily confused"] },
    { c: L, t: 3, q: "What does 'lackadaisical' mean?", a: "lacking enthusiasm", d: ["full of flowers", "lacking money", "overly eager"] },
    { c: L, t: 4, q: "To 'hector' someone is to...?", a: "bully them with bluster", d: ["measure their land", "comfort them gently", "honor them"] },
    { c: L, t: 5, q: "What is 'bathos'?", a: "a ludicrous drop to triviality", d: ["deep sympathy", "a lavish bath", "grand eloquence"] },
  ],
  // day 30
  [
    { c: L, t: 1, q: "What is a 'beverage'?", a: "a drink", d: ["a lever", "a snack", "a debt"] },
    { c: L, t: 2, q: "A 'docile' animal is...?", a: "easily taught or led", d: ["wild and unruly", "slow and elderly", "small and delicate"] },
    { c: L, t: 3, q: "What does 'alacrity' mean?", a: "cheerful readiness", d: ["sharp clarity", "great reluctance", "alarm and fear"] },
    { c: L, t: 4, q: "What does 'histrionic' mean?", a: "overly dramatic", d: ["historically important", "calm and restrained", "hysterically funny"] },
    { c: L, t: 5, q: "What is 'apotheosis'?", a: "elevation to divine status", d: ["a scientific hypothesis", "a druggist's shop", "a fall from grace"] },
  ],
  // day 31
  [
    { c: L, t: 1, q: "A 'hasty' decision is...?", a: "done in a hurry", d: ["made with hate", "made with care", "done in secret"] },
    { c: L, t: 2, q: "Someone described as 'haughty' is...?", a: "arrogantly superior", d: ["badly behaved", "cheerfully modest", "easily embarrassed"] },
    { c: L, t: 3, q: "Someone described as 'audacious' is...?", a: "recklessly daring", d: ["easily heard", "timid and fearful", "fond of music"] },
    { c: L, t: 4, q: "What is an 'imbroglio'?", a: "a complicated situation", d: ["a grilled dish", "a simple solution", "a pleasant stroll"] },
    { c: L, t: 5, q: "Someone described as 'bibulous' is...?", a: "fond of drinking alcohol", d: ["fond of the Bible", "fond of books", "prone to drooling"] },
  ],
  // day 32
  [
    { c: L, t: 1, q: "What does 'identical' mean?", a: "exactly the same", d: ["perfectly ideal", "slightly different", "completely unknown"] },
    { c: L, t: 2, q: "A child who is 'inquisitive' is...?", a: "eager to ask questions", d: ["eager to please", "reluctant to speak", "quick to anger"] },
    { c: L, t: 3, q: "What does 'brusque' mean?", a: "abrupt and curt", d: ["warm and gentle", "quick and energetic", "dark and dusky"] },
    { c: L, t: 4, q: "To 'inveigle' someone is to...?", a: "entice them with trickery", d: ["cover them with a veil", "warn them firmly", "forgive them"] },
    { c: L, t: 5, q: "What does 'chthonic' mean?", a: "relating to the underworld", d: ["relating to the heavens", "relating to time", "relating to music"] },
  ],
  // day 33
  [
    { c: L, t: 1, q: "What does 'fortunate' mean?", a: "lucky", d: ["wealthy", "strong", "forgetful"] },
    { c: L, t: 2, q: "What does 'jubilant' mean?", a: "full of triumphant joy", d: ["full of quiet regret", "full of nervous energy", "full of bitter envy"] },
    { c: L, t: 3, q: "What does 'chicanery' mean?", a: "trickery", d: ["stylishness", "cowardice", "honesty"] },
    { c: L, t: 4, q: "Someone described as 'jocose' is...?", a: "given to joking", d: ["given to jogging", "given to sulking", "given to boasting"] },
    { c: L, t: 5, q: "What is a 'jeremiad'?", a: "a long mournful complaint", d: ["a joyful hymn", "a series of jokes", "a lengthy journey"] },
  ],
  // day 34
  [
    { c: L, t: 1, q: "Someone described as 'drowsy' is...?", a: "sleepy", d: ["soaked", "shabby", "dizzy"] },
    { c: L, t: 2, q: "A 'lucrative' job is...?", a: "very profitable", d: ["dangerously risky", "oddly comical", "clear and simple"] },
    { c: L, t: 3, q: "Someone described as 'dogmatic' is...?", a: "arrogantly opinionated", d: ["open-minded", "doggedly loyal", "calm and practical"] },
    { c: L, t: 4, q: "To 'kowtow' is to...?", a: "defer slavishly", d: ["herd cattle", "refuse stubbornly", "tow a vehicle"] },
    { c: L, t: 5, q: "To 'inspissate' a liquid is to...?", a: "thicken it", d: ["spit it out", "inspect it", "dilute it"] },
  ],
  // day 35
  [
    { c: L, t: 1, q: "What is a 'journey'?", a: "a trip", d: ["a diary", "a meal", "a trial"] },
    { c: L, t: 2, q: "What does 'abundant' mean?", a: "existing in large amounts", d: ["left behind", "extremely scarce", "tied in a bundle"] },
    { c: L, t: 3, q: "A 'judicious' choice is...?", a: "wise and sensible", d: ["juicy and ripe", "foolish and rash", "legally binding"] },
    { c: L, t: 4, q: "A 'limpid' pool is...?", a: "perfectly clear", d: ["limp and drooping", "muddy and murky", "warm and still"] },
    { c: L, t: 5, q: "What is a 'lacuna'?", a: "a gap or missing part", d: ["a shallow lagoon", "a lunar crater", "a lace collar"] },
  ],
  // day 36
  [
    { c: L, t: 1, q: "What does 'assist' mean?", a: "to help", d: ["to insist", "to resist", "to arrive"] },
    { c: L, t: 2, q: "A 'durable' boot is...?", a: "long-lasting", d: ["easily damaged", "waterproof", "costly"] },
    { c: L, t: 3, q: "What does 'insipid' mean?", a: "lacking flavor", d: ["highly spiced", "stupidly foolish", "deeply inspired"] },
    { c: L, t: 4, q: "What does 'bucolic' mean?", a: "of rural country life", d: ["of the cheeks", "of city life", "of stomach pain"] },
    { c: L, t: 5, q: "What is 'gasconade'?", a: "extravagant boasting", d: ["a fizzy drink", "a modest silence", "a slow procession"] },
  ],
];
