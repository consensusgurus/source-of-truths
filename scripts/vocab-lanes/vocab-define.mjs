// Vocab lane: Definitions. 36 days x 5 tiers. Scope: "What does 'X' mean?" and
// close variants; the answer is a short meaning matching Merriam-Webster's primary
// sense. Split: every target word starts with A through L (the other Vocab lane
// takes M through Z). No target word is asked twice.
const L = 'Definitions';
export const LANE_DAYS_1_36 = [
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

// Days 37 to 74 (2026-11-24 to 2026-12-31). gen-english.mjs appends every day in
// LANE_DAYS after the bank's last day, so the segment already shipped (days 1 to
// 36, above) is kept under its own name and only this segment is exported as LANE_DAYS.
// Every target word is new to the lane, and the A-L / M-Z split still holds.
export const LANE_DAYS = [
  // day 37
  [
    { c: L, t: 1, q: "To 'borrow' something is to...?", a: "take it to use and give back", d: ["keep it forever", "buy it outright", "throw it away"] },
    { c: L, t: 2, q: "Someone described as 'arrogant' is...?", a: "overly proud of oneself", d: ["shy and modest", "angry and loud", "rich and famous"] },
    { c: L, t: 3, q: "To 'abhor' something is to...?", a: "hate it deeply", d: ["adore it", "ignore it", "fear it slightly"] },
    { c: L, t: 4, q: "An 'anodyne' remark is...?", a: "bland and inoffensive", d: ["sharply cutting", "anonymous", "oddly specific"] },
    { c: L, t: 5, q: "What is an 'amanuensis'?", a: "a scribe or secretary", d: ["a church officer", "a handwritten amendment", "a love letter"] },
  ],
  // day 38
  [
    { c: L, t: 1, q: "If the weather is 'chilly', it is...?", a: "rather cold", d: ["very hot", "very windy", "rather damp"] },
    { c: L, t: 2, q: "What does 'conceal' mean?", a: "to keep out of sight", d: ["to reveal", "to agree", "to seal shut"] },
    { c: L, t: 3, q: "A 'banal' remark is...?", a: "dull and unoriginal", d: ["shocking and rude", "clever and witty", "forbidden by law"] },
    { c: L, t: 4, q: "What is 'acrimony'?", a: "bitterness of feeling", d: ["a dispute over land", "a sharp taste", "a formal agreement"] },
    { c: L, t: 5, q: "An 'anfractuous' path is...?", a: "full of twists and turns", d: ["broken into pieces", "perfectly straight", "steep and rocky"] },
  ],
  // day 39
  [
    { c: L, t: 1, q: "What is a 'harvest'?", a: "the gathering of crops", d: ["the planting of seeds", "a heavy rainstorm", "a farm animal"] },
    { c: L, t: 2, q: "To 'cherish' something is to...?", a: "hold it dear", d: ["sell it quickly", "share it freely", "forget it"] },
    { c: L, t: 3, q: "Someone described as 'altruistic' is...?", a: "selflessly concerned for others", d: ["fond of heights", "stubbornly old-fashioned", "driven by self-interest"] },
    { c: L, t: 4, q: "What is 'largesse'?", a: "generous giving", d: ["great size", "a lazy manner", "a sum owed"] },
    { c: L, t: 5, q: "What does 'gustatory' mean?", a: "relating to taste", d: ["relating to wind", "relating to smell", "relating to hearing"] },
  ],
  // day 40
  [
    { c: L, t: 1, q: "Someone described as 'clever' is...?", a: "quick to learn and understand", d: ["slow and clumsy", "loud and bossy", "kind and gentle"] },
    { c: L, t: 2, q: "A 'blunt' reply is...?", a: "direct and plain-spoken", d: ["vague and evasive", "long and flowery", "late and lazy"] },
    { c: L, t: 3, q: "What does 'castigate' mean?", a: "to scold severely", d: ["to cast aside", "to praise lavishly", "to build a castle"] },
    { c: L, t: 4, q: "Someone described as 'bellicose' is...?", a: "eager to fight", d: ["beautifully shaped", "loud as a bell", "peace-loving"] },
    { c: L, t: 5, q: "What is 'apophasis'?", a: "raising a point by claiming not to mention it", d: ["a sudden loss of speech", "a speech of farewell", "the omission of a final sound"] },
  ],
  // day 41
  [
    { c: L, t: 1, q: "To 'damage' something is to...?", a: "harm it", d: ["clean it", "build it", "name it"] },
    { c: L, t: 2, q: "An 'avid' reader is...?", a: "keen and enthusiastic", d: ["slow and careful", "bored and restless", "young and new"] },
    { c: L, t: 3, q: "What is a 'cacophony'?", a: "a harsh mix of sounds", d: ["a pleasing melody", "a choir of voices", "a coughing fit"] },
    { c: L, t: 4, q: "Someone described as 'craven' is...?", a: "contemptibly cowardly", d: ["deeply longing", "carved from stone", "boldly heroic"] },
    { c: L, t: 5, q: "What does 'desuetude' mean?", a: "a state of disuse", d: ["sweetness", "a formal lawsuit", "a sudden revival"] },
  ],
  // day 42
  [
    { c: L, t: 1, q: "What is an 'ancestor'?", a: "a relative from long ago", d: ["a distant neighbor", "a newborn child", "a family friend"] },
    { c: L, t: 2, q: "Someone described as 'courteous' is...?", a: "polite and respectful", d: ["brave and bold", "rude and careless", "shy and quiet"] },
    { c: L, t: 3, q: "To 'censure' someone is to...?", a: "criticize them formally", d: ["count them in a survey", "silence them by force", "praise them publicly"] },
    { c: L, t: 4, q: "What is 'calumny'?", a: "a false and damaging statement", d: ["a period of calm", "a support column", "a sincere apology"] },
    { c: L, t: 5, q: "Text written 'boustrophedon' runs...?", a: "in alternate directions line by line", d: ["from bottom to top", "in a spiral from the center", "in a single column"] },
  ],
  // day 43
  [
    { c: L, t: 1, q: "Someone who is 'gentle' is...?", a: "kind and mild", d: ["loud and rough", "tall and strong", "fast and clever"] },
    { c: L, t: 2, q: "Something 'flimsy' is...?", a: "thin and easily damaged", d: ["heavy and solid", "shiny and smooth", "old and valuable"] },
    { c: L, t: 3, q: "Someone described as 'cantankerous' is...?", a: "bad-tempered and quarrelsome", d: ["fond of singing", "easily tired", "cheerfully agreeable"] },
    { c: L, t: 4, q: "To 'excoriate' a plan is to...?", a: "criticize it harshly", d: ["remove it from the record", "carry it out fully", "explain it in detail"] },
    { c: L, t: 5, q: "What is a 'cynosure'?", a: "a center of attention", d: ["a cynical remark", "a sure cure", "a dog kennel"] },
  ],
  // day 44
  [
    { c: L, t: 1, q: "Something 'invisible' is...?", a: "unable to be seen", d: ["unable to be heard", "unable to be moved", "unable to be broken"] },
    { c: L, t: 2, q: "What does 'genuine' mean?", a: "real and authentic", d: ["fake and copied", "old and worn", "rare and costly"] },
    { c: L, t: 3, q: "What does 'deride' mean?", a: "to mock with contempt", d: ["to ride away", "to agree warmly", "to remove from office"] },
    { c: L, t: 4, q: "Something that is 'anathema' to you is...?", a: "something you vehemently dislike", d: ["something you cannot explain", "something you deeply admire", "something you were born with"] },
    { c: L, t: 5, q: "What is a 'farrago'?", a: "a confused mixture", d: ["a long journey", "a fierce argument", "a Spanish dance"] },
  ],
  // day 45
  [
    { c: L, t: 1, q: "Someone who is 'healthy' is...?", a: "in good physical condition", d: ["very tired", "very busy", "badly hurt"] },
    { c: L, t: 2, q: "A 'hostile' crowd is...?", a: "unfriendly and aggressive", d: ["warm and welcoming", "quiet and shy", "hosting guests"] },
    { c: L, t: 3, q: "An 'eclectic' collection is...?", a: "drawn from many sources", d: ["electric and lively", "strictly traditional", "rigidly uniform"] },
    { c: L, t: 4, q: "To 'dissemble' is to...?", a: "conceal one's true motives", d: ["take apart a machine", "gather in a crowd", "speak at great length"] },
    { c: L, t: 5, q: "What is a 'logomachy'?", a: "a dispute over words", d: ["a machine for logging", "a study of logic", "a written record"] },
  ],
  // day 46
  [
    { c: L, t: 1, q: "To 'leap' is to...?", a: "jump", d: ["crawl", "sleep", "lean"] },
    { c: L, t: 2, q: "What does 'deceive' mean?", a: "to mislead deliberately", d: ["to receive politely", "to decide quickly", "to cease completely"] },
    { c: L, t: 3, q: "A 'fortuitous' meeting is...?", a: "happening by chance", d: ["strongly fortified", "carefully planned", "forty years old"] },
    { c: L, t: 4, q: "What does 'evanescent' mean?", a: "quickly fading away", d: ["evenly balanced", "bright and glowing", "long-lasting"] },
    { c: L, t: 5, q: "To 'immolate' something is to...?", a: "sacrifice it, often by fire", d: ["make it immortal", "copy it exactly", "seal it in stone"] },
  ],
  // day 47
  [
    { c: L, t: 1, q: "What is an 'exit'?", a: "a way out", d: ["a way in", "a dead end", "a long hall"] },
    { c: L, t: 2, q: "To 'endure' hardship is to...?", a: "put up with it", d: ["bring it to an end", "give in to it", "look forward to it"] },
    { c: L, t: 3, q: "What does 'elicit' mean?", a: "to draw out a response", d: ["to make illegal", "to choose by vote", "to remove"] },
    { c: L, t: 4, q: "To 'importune' someone is to...?", a: "beg them persistently", d: ["bring them luck", "bring them in from abroad", "interrupt them rudely"] },
    { c: L, t: 5, q: "What does 'hypnagogic' mean?", a: "relating to the drowsy state before sleep", d: ["relating to hypnosis", "relating to waking up", "relating to deep sleep"] },
  ],
  // day 48
  [
    { c: L, t: 1, q: "What is a 'chuckle'?", a: "a quiet laugh", d: ["a loud cry", "a deep sigh", "a sharp cough"] },
    { c: L, t: 2, q: "What does 'jeopardy' mean?", a: "danger of loss or harm", d: ["great joy", "a court verdict", "jealousy"] },
    { c: L, t: 3, q: "A 'furtive' glance is...?", a: "sly and secretive", d: ["fast and furious", "open and frank", "bitterly angry"] },
    { c: L, t: 4, q: "An 'egregious' error is...?", a: "conspicuously bad", d: ["unusually sociable", "easily overlooked", "faintly amusing"] },
    { c: L, t: 5, q: "What is 'legerdemain'?", a: "sleight of hand", d: ["a knight's estate", "light housekeeping", "a legal ruling"] },
  ],
  // day 49
  [
    { c: L, t: 1, q: "What is a 'feast'?", a: "a large, festive meal", d: ["a small snack", "a long fast", "a quiet nap"] },
    { c: L, t: 2, q: "Someone described as 'frantic' is...?", a: "wildly hurried and worried", d: ["calm and slow", "happy and relaxed", "sad and sleepy"] },
    { c: L, t: 3, q: "What is a 'harbinger'?", a: "a sign of what is coming", d: ["a harbor master", "a bitter enemy", "a trusted servant"] },
    { c: L, t: 4, q: "What does 'insidious' mean?", a: "harmful in a subtle, gradual way", d: ["openly hostile", "deeply unwise", "sudden and violent"] },
    { c: L, t: 5, q: "What does 'divagate' mean?", a: "to wander or stray from a course", d: ["to split in two", "to predict the future", "to reveal a secret"] },
  ],
  // day 50
  [
    { c: L, t: 1, q: "What does 'gather' mean?", a: "to bring together", d: ["to throw away", "to break apart", "to hide away"] },
    { c: L, t: 2, q: "What does 'imitate' mean?", a: "to copy", d: ["to invite", "to irritate", "to begin"] },
    { c: L, t: 3, q: "What is 'guile'?", a: "sly cunning", d: ["a guilty feeling", "a guided tour", "open honesty"] },
    { c: L, t: 4, q: "What does 'inimical' mean?", a: "harmful or hostile", d: ["impossible to copy", "friendly and helpful", "very small"] },
    { c: L, t: 5, q: "What is an 'agelast'?", a: "a person who never laughs", d: ["a person who never ages", "a person who hates crowds", "a person who never sleeps"] },
  ],
  // day 51
  [
    { c: L, t: 1, q: "What does 'injure' mean?", a: "to hurt", d: ["to heal", "to judge", "to enjoy"] },
    { c: L, t: 2, q: "What does 'exaggerate' mean?", a: "to overstate", d: ["to understate", "to explain clearly", "to leave out"] },
    { c: L, t: 3, q: "An 'implacable' enemy is...?", a: "impossible to appease", d: ["easy to place", "calm and peaceful", "impossible to locate"] },
    { c: L, t: 4, q: "What is a 'harangue'?", a: "a long, ranting speech", d: ["a hanging tapestry", "a short prayer", "a polite request"] },
    { c: L, t: 5, q: "What is 'hendiadys'?", a: "one idea expressed by two nouns joined by 'and'", d: ["a line of eleven syllables", "a pair of rhyming lines", "a word read the same backward"] },
  ],
  // day 52
  [
    { c: L, t: 1, q: "What is a 'grin'?", a: "a broad smile", d: ["a loud groan", "a sad frown", "a quick wink"] },
    { c: L, t: 2, q: "If the air is 'humid', it is...?", a: "moist and muggy", d: ["dry and crisp", "cold and windy", "clear and sunny"] },
    { c: L, t: 3, q: "What does 'incessant' mean?", a: "never stopping", d: ["very innocent", "rarely heard", "growing quieter"] },
    { c: L, t: 4, q: "To 'ingratiate' oneself is to...?", a: "work to win someone's favor", d: ["show a lack of gratitude", "pay a debt in full", "move to another country"] },
    { c: L, t: 5, q: "A 'lapidary' writing style is...?", a: "elegantly precise", d: ["rambling and loose", "rocky and uneven", "hurried and careless"] },
  ],
  // day 53
  [
    { c: L, t: 1, q: "A 'fancy' dress is...?", a: "elaborate and decorative", d: ["plain and simple", "old and torn", "short and tight"] },
    { c: L, t: 2, q: "What does 'illuminate' mean?", a: "to light up", d: ["to cover up", "to dry out", "to make illegal"] },
    { c: L, t: 3, q: "Someone described as 'irascible' is...?", a: "easily angered", d: ["easily amused", "easily persuaded", "easily erased"] },
    { c: L, t: 4, q: "Someone living an 'ascetic' life practices...?", a: "strict self-denial", d: ["refined artistic taste", "constant travel", "lavish entertaining"] },
    { c: L, t: 5, q: "What does 'adumbrate' mean?", a: "to outline or foreshadow", d: ["to add up figures", "to praise highly", "to grow larger"] },
  ],
  // day 54
  [
    { c: L, t: 1, q: "What does 'locate' mean?", a: "to find", d: ["to lose", "to lock", "to sell"] },
    { c: L, t: 2, q: "What does 'dubious' mean?", a: "doubtful", d: ["delightful", "double", "certain"] },
    { c: L, t: 3, q: "A 'garish' sign is...?", a: "crudely bright", d: ["pale and faded", "tasteful and subtle", "rough and hairy"] },
    { c: L, t: 4, q: "What does 'expiate' mean?", a: "to atone for", d: ["to breathe out", "to die", "to explain"] },
    { c: L, t: 5, q: "What is the 'empyrean'?", a: "the highest heaven", d: ["a vast empire", "a funeral pyre", "an emperor's crown"] },
  ],
  // day 55
  [
    { c: L, t: 1, q: "What is an 'enemy'?", a: "a person who opposes you", d: ["a person who helps you", "a person you live with", "a person you hire"] },
    { c: L, t: 2, q: "An 'intrepid' explorer is...?", a: "fearless", d: ["nervous", "intelligent", "clumsy"] },
    { c: L, t: 3, q: "What does 'esoteric' mean?", a: "understood by only a few", d: ["widely popular", "easy to grasp", "related to the east"] },
    { c: L, t: 4, q: "To 'impute' a fault to someone is to...?", a: "attribute it to them", d: ["forgive them for it", "conceal it from them", "fine them for it"] },
    { c: L, t: 5, q: "What is an 'imprecation'?", a: "a curse", d: ["a blessing", "an inaccuracy", "a prayer of thanks"] },
  ],
  // day 56
  [
    { c: L, t: 1, q: "What is a 'glance'?", a: "a quick look", d: ["a long stare", "a soft touch", "a loud call"] },
    { c: L, t: 2, q: "Someone 'fluent' in French is...?", a: "able to speak it smoothly and easily", d: ["unable to read it", "fond of its food", "slow to answer in it"] },
    { c: L, t: 3, q: "What is 'jargon'?", a: "the specialized language of a group", d: ["a large clay jar", "a formal greeting", "a regional accent"] },
    { c: L, t: 4, q: "What is 'lassitude'?", a: "weariness", d: ["generosity", "great width", "eagerness"] },
    { c: L, t: 5, q: "What is a 'kenning'?", a: "a poetic compound like 'whale-road' for the sea", d: ["a Scottish song", "a hunting dog", "a family name"] },
  ],
  // day 57
  [
    { c: L, t: 1, q: "A 'brilliant' light is...?", a: "very bright", d: ["very dull", "very cold", "very small"] },
    { c: L, t: 2, q: "Someone described as 'irate' is...?", a: "very angry", d: ["very late", "very rich", "very calm"] },
    { c: L, t: 3, q: "What is an 'idiosyncrasy'?", a: "a peculiar personal habit", d: ["a foolish idea", "a set of beliefs", "a speech defect"] },
    { c: L, t: 4, q: "A 'glib' answer is...?", a: "fluent but insincere", d: ["shy and halting", "glowing with health", "bitter and sour"] },
    { c: L, t: 5, q: "What does 'irenic' mean?", a: "aiming at peace", d: ["angry and hostile", "ironic in tone", "relating to Ireland"] },
  ],
  // day 58
  [
    { c: L, t: 1, q: "What does 'blend' mean?", a: "to mix together", d: ["to pull apart", "to lend", "to blink"] },
    { c: L, t: 2, q: "What does 'linger' mean?", a: "to stay longer than needed", d: ["to leave early", "to sing softly", "to grow longer"] },
    { c: L, t: 3, q: "An 'insular' community is...?", a: "narrowly isolated in outlook", d: ["well insulated", "widely traveled", "friendly to outsiders"] },
    { c: L, t: 4, q: "What does 'fecund' mean?", a: "highly fertile", d: ["foul-smelling", "barren", "fearful"] },
    { c: L, t: 5, q: "What is 'concinnity'?", a: "elegant harmony of parts", d: ["a council of churches", "a state of confusion", "a stubborn quarrel"] },
  ],
  // day 59
  [
    { c: L, t: 1, q: "What does 'frighten' mean?", a: "to scare", d: ["to calm", "to fight", "to amuse"] },
    { c: L, t: 2, q: "A 'fragrant' rose is...?", a: "sweet-smelling", d: ["sweet-tasting", "easily broken", "brightly colored"] },
    { c: L, t: 3, q: "What is 'heresy'?", a: "a belief against accepted doctrine", d: ["a family inheritance", "a public announcement", "a hurried decision"] },
    { c: L, t: 4, q: "What does 'filch' mean?", a: "to steal something small", d: ["to fill up", "to scrub clean", "to file away"] },
    { c: L, t: 5, q: "What is a 'demiurge'?", a: "a creator of the material world", d: ["a sudden craving", "a demagogue's speech", "a minor religious feast"] },
  ],
  // day 60
  [
    { c: L, t: 1, q: "What is a 'cottage'?", a: "a small house", d: ["a large castle", "a tall tower", "a city office"] },
    { c: L, t: 2, q: "A 'hazardous' road is...?", a: "full of risk", d: ["full of fog", "full of cars", "full of curves"] },
    { c: L, t: 3, q: "What does 'alleviate' mean?", a: "to ease or lessen", d: ["to raise up", "to make worse", "to leave behind"] },
    { c: L, t: 4, q: "What is 'circumlocution'?", a: "roundabout speech", d: ["a voyage around the world", "a precise statement", "a local custom"] },
    { c: L, t: 5, q: "What is 'eudaemonia'?", a: "happiness or flourishing", d: ["a demonic possession", "a form of insomnia", "a deep melancholy"] },
  ],
  // day 61
  [
    { c: L, t: 1, q: "What is a 'dwelling'?", a: "a home", d: ["a well", "a shop", "a road"] },
    { c: L, t: 2, q: "Two 'distinct' ideas are...?", a: "clearly different", d: ["far away", "nearly gone", "closely related"] },
    { c: L, t: 3, q: "What does 'admonish' mean?", a: "to warn or scold gently", d: ["to admire", "to appoint", "to forgive"] },
    { c: L, t: 4, q: "An 'ignoble' act is...?", a: "base and dishonorable", d: ["unaware", "newly titled", "noble by birth"] },
    { c: L, t: 5, q: "What does 'exiguous' mean?", a: "scanty", d: ["urgent", "outward-facing", "abundant"] },
  ],
  // day 62
  [
    { c: L, t: 1, q: "A 'bitter' taste is...?", a: "sharp and unpleasant", d: ["sweet and sugary", "salty and dry", "soft and creamy"] },
    { c: L, t: 2, q: "Someone described as 'dejected' is...?", a: "low in spirits", d: ["thrown out", "eager and hopeful", "tired and sleepy"] },
    { c: L, t: 3, q: "An 'ardent' supporter is...?", a: "passionately eager", d: ["hard and stiff", "coldly indifferent", "deeply confused"] },
    { c: L, t: 4, q: "A 'draconian' law is...?", a: "excessively harsh", d: ["dragon-shaped", "mild and lenient", "old-fashioned"] },
    { c: L, t: 5, q: "What is a 'lagniappe'?", a: "a small bonus gift", d: ["a lazy afternoon", "a shallow lagoon", "a Cajun stew"] },
  ],
  // day 63
  [
    { c: L, t: 1, q: "If a sound is 'faint', it is...?", a: "barely heard", d: ["very loud", "very sharp", "very sweet"] },
    { c: L, t: 2, q: "What does 'boast' mean?", a: "to brag", d: ["to toast", "to apologize", "to whisper"] },
    { c: L, t: 3, q: "What does 'condone' mean?", a: "to overlook or accept wrongdoing", d: ["to condemn strongly", "to apologize", "to sympathize"] },
    { c: L, t: 4, q: "Someone described as 'contrite' is...?", a: "feeling sincere remorse", d: ["trite and overused", "proud and defiant", "bound by contract"] },
    { c: L, t: 5, q: "What does 'fuliginous' mean?", a: "sooty or dusky", d: ["full of rage", "shining brightly", "short-lived"] },
  ],
  // day 64
  [
    { c: L, t: 1, q: "Someone who is 'kind' is...?", a: "caring and helpful", d: ["selfish and cruel", "clever and quick", "tall and strong"] },
    { c: L, t: 2, q: "What does 'devour' mean?", a: "to eat hungrily", d: ["to pray devoutly", "to refuse food", "to cook slowly"] },
    { c: L, t: 3, q: "What does 'debilitate' mean?", a: "to weaken", d: ["to argue", "to pay off a debt", "to strengthen"] },
    { c: L, t: 4, q: "What is 'hegemony'?", a: "dominance over others", d: ["a type of hedge", "equal partnership", "a holy relic"] },
    { c: L, t: 5, q: "A 'labile' mood is...?", a: "readily changing", d: ["fixed and stable", "deeply sorrowful", "tied to work"] },
  ],
  // day 65
  [
    { c: L, t: 1, q: "What is a 'giant'?", a: "a person or thing of great size", d: ["a tiny creature", "a magic spell", "a castle guard"] },
    { c: L, t: 2, q: "What is 'compassion'?", a: "sympathy for others' suffering", d: ["a sense of direction", "harsh criticism", "a deep passion"] },
    { c: L, t: 3, q: "What does 'expedite' mean?", a: "to speed up", d: ["to send on an expedition", "to slow down", "to expel"] },
    { c: L, t: 4, q: "What does 'indefatigable' mean?", a: "tireless", d: ["unable to be defeated", "undefined", "exhausted"] },
    { c: L, t: 5, q: "What does 'ineffable' mean?", a: "too great to be expressed in words", d: ["unable to be erased", "not effective", "unable to be eaten"] },
  ],
  // day 66
  [
    { c: L, t: 1, q: "What does 'arrive' mean?", a: "to reach a place", d: ["to leave a place", "to drive a car", "to stay home"] },
    { c: L, t: 2, q: "A 'credible' story is...?", a: "believable", d: ["foolishly trusting", "edible", "wealthy"] },
    { c: L, t: 3, q: "What does 'emulate' mean?", a: "to imitate in order to equal", d: ["to rescue", "to dissolve in water", "to spread rumors"] },
    { c: L, t: 4, q: "A 'diaphanous' veil is...?", a: "light and see-through", d: ["having two layers", "widely spread", "painted on glass"] },
    { c: L, t: 5, q: "What does 'apotropaic' mean?", a: "intended to ward off evil", d: ["turning toward the sun", "relating to the tropics", "speaking in riddles"] },
  ],
  // day 67
  [
    { c: L, t: 1, q: "What does 'combine' mean?", a: "to join together", d: ["to split up", "to brush hair", "to compare"] },
    { c: L, t: 2, q: "A 'boisterous' party is...?", a: "noisy and lively", d: ["calm and quiet", "proud and boastful", "sad and tearful"] },
    { c: L, t: 3, q: "A 'fervent' prayer is...?", a: "intensely passionate", d: ["coldly polite", "feverish and ill", "slightly amused"] },
    { c: L, t: 4, q: "What is 'kismet'?", a: "fate or destiny", d: ["a kiss of greeting", "a curse", "a small gift"] },
    { c: L, t: 5, q: "What is a 'cenotaph'?", a: "a monument to someone buried elsewhere", d: ["a written epitaph", "a central chapel", "a list of the dead"] },
  ],
  // day 68
  [
    { c: L, t: 1, q: "A 'festive' mood is...?", a: "cheerful and celebratory", d: ["dull and gloomy", "busy and tired", "cold and snowy"] },
    { c: L, t: 2, q: "Someone described as 'gleeful' is...?", a: "full of delight", d: ["full of worry", "full of food", "full of doubt"] },
    { c: L, t: 3, q: "What does 'benign' mean?", a: "gentle and harmless", d: ["dangerously harmful", "oddly bent", "widely known"] },
    { c: L, t: 4, q: "A 'beatific' smile is...?", a: "blissfully happy", d: ["beaten down", "beautifully dressed", "sternly serious"] },
    { c: L, t: 5, q: "What is an 'inglenook'?", a: "a corner by a fireplace", d: ["a hidden garden", "a small inn", "a forest hollow"] },
  ],
  // day 69
  [
    { c: L, t: 1, q: "What is an 'edge'?", a: "the outer border of something", d: ["the very center", "a deep hole", "a small piece"] },
    { c: L, t: 2, q: "A 'lofty' tower is...?", a: "very high", d: ["very lonely", "very heavy", "very soft"] },
    { c: L, t: 3, q: "What is a 'debacle'?", a: "a sudden, humiliating failure", d: ["a public debate", "a wild party", "a narrow escape"] },
    { c: L, t: 4, q: "A 'baleful' look is...?", a: "threatening harm", d: ["full of hay", "softly pleading", "pale and sickly"] },
    { c: L, t: 5, q: "What is a 'gerontocracy'?", a: "rule by elders", d: ["rule by the wealthy", "rule by priests", "rule by one family"] },
  ],
  // day 70
  [
    { c: L, t: 1, q: "Something 'cheap' is...?", a: "low in price", d: ["high in price", "well made", "hard to find"] },
    { c: L, t: 2, q: "What does 'flourish' mean?", a: "to grow well and thrive", d: ["to wilt", "to bake", "to complain"] },
    { c: L, t: 3, q: "What does 'acquiesce' mean?", a: "to accept without protest", d: ["to acquire", "to object loudly", "to become quiet"] },
    { c: L, t: 4, q: "A plan held in 'abeyance' is in...?", a: "temporary suspension", d: ["obedience", "a monastery", "a permanent end"] },
    { c: L, t: 5, q: "What is a 'cognomen'?", a: "a surname or nickname", d: ["an educated guess", "a known fact", "a code word"] },
  ],
  // day 71
  [
    { c: L, t: 1, q: "What does 'drench' mean?", a: "to soak completely", d: ["to dry", "to dig", "to drink"] },
    { c: L, t: 2, q: "Someone 'adept' at chess is...?", a: "highly skilled", d: ["adopted", "clumsy", "willing"] },
    { c: L, t: 3, q: "A 'flippant' remark is...?", a: "not showing proper seriousness", d: ["easily flipped", "overly formal", "deeply heartfelt"] },
    { c: L, t: 4, q: "What does 'ersatz' mean?", a: "artificial and inferior", d: ["upright and stiff", "eager and keen", "genuine"] },
    { c: L, t: 5, q: "What does 'hortatory' mean?", a: "urging or encouraging", d: ["relating to gardens", "relating to time", "warning of disaster"] },
  ],
  // day 72
  [
    { c: L, t: 1, q: "What is 'autumn'?", a: "the season after summer", d: ["the season after winter", "the season before summer", "the rainy season"] },
    { c: L, t: 2, q: "What does 'hesitate' mean?", a: "to pause before acting", d: ["to rush ahead", "to hate", "to heal"] },
    { c: L, t: 3, q: "What is an 'enigma'?", a: "a puzzling mystery", d: ["an energetic person", "an enemy", "a mild illness"] },
    { c: L, t: 4, q: "A 'lithe' dancer is...?", a: "flexible and graceful", d: ["stiff and clumsy", "bright and lit", "quiet and still"] },
    { c: L, t: 5, q: "What is a 'hierophant'?", a: "an interpreter of sacred mysteries", d: ["a carver of hieroglyphs", "a ruler of a holy city", "a writer of hymns"] },
  ],
  // day 73
  [
    { c: L, t: 1, q: "A 'crowded' room is...?", a: "full of people", d: ["empty of people", "full of crows", "quiet and dark"] },
    { c: L, t: 2, q: "An 'arid' land is...?", a: "very dry", d: ["very windy", "very cold", "very green"] },
    { c: L, t: 3, q: "What is 'hubris'?", a: "excessive pride", d: ["a central point", "great humility", "a sense of humor"] },
    { c: L, t: 4, q: "What is 'invective'?", a: "insulting, abusive language", d: ["an invention", "a formal invitation", "a sincere prayer"] },
    { c: L, t: 5, q: "What is a 'deipnosophist'?", a: "a master of dinner conversation", d: ["an expert on sleep", "a student of deep-sea life", "a writer of dictionaries"] },
  ],
  // day 74
  [
    { c: L, t: 1, q: "What does 'celebrate' mean?", a: "to mark a happy occasion", d: ["to mourn a loss", "to forget a date", "to cancel a plan"] },
    { c: L, t: 2, q: "An 'annual' event is...?", a: "happening once a year", d: ["happening every day", "happening twice a year", "happening by chance"] },
    { c: L, t: 3, q: "An 'auspicious' start is...?", a: "showing signs of future success", d: ["suspicious and wary", "ancient and sacred", "loud and showy"] },
    { c: L, t: 4, q: "What does 'burgeon' mean?", a: "to grow rapidly", d: ["to burglarize", "to bury", "to fade"] },
    { c: L, t: 5, q: "What is a 'chiliad'?", a: "a group of one thousand", d: ["a cold spell", "a group of a hundred", "a children's rhyme"] },
  ],
];
