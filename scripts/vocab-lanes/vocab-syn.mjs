// Vocab lane: Synonyms & Opposites. 36 days x 5 tiers. Scope: closest-in-meaning
// and opposite-of questions on single words, plus occasional fill-the-blank.
// Every target word starts with a letter M through Z (the other lane takes A to L).
const L = 'Synonyms & Opposites';
export const LANE_DAYS_1_36 = [
  // day 1
  [
    { c: L, t: 1, q: "Which word is closest in meaning to 'whole'?", a: "entire", d: ["half", "large", "solid"] },
    { c: L, t: 2, q: "Which word is closest in meaning to 'vast'?", a: "huge", d: ["deep", "narrow", "crowded"] },
    { c: L, t: 3, q: "Which word is the opposite of 'zealous'?", a: "apathetic", d: ["enthusiastic", "jealous", "cautious"] },
    { c: L, t: 4, q: "Which word is closest in meaning to 'obsequious'?", a: "fawning", d: ["arrogant", "obscure", "devoted"] },
    { c: L, t: 5, q: "Which word is closest in meaning to 'tergiversate'?", a: "equivocate", d: ["reiterate", "commiserate", "exonerate"] },
  ],
  // day 2
  [
    { c: L, t: 1, q: "Which word is the opposite of 'strong'?", a: "weak", d: ["tough", "slow", "short"] },
    { c: L, t: 2, q: "Which word is the opposite of 'vanish'?", a: "appear", d: ["disappear", "escape", "fade"] },
    { c: L, t: 3, q: "Which word fits: 'A ___ worker always arrives exactly on time'?", a: "punctual", d: ["careful", "tardy", "friendly"] },
    { c: L, t: 4, q: "Which word is the opposite of 'ostentatious'?", a: "understated", d: ["showy", "obvious", "wealthy"] },
    { c: L, t: 5, q: "Which word is closest in meaning to 'panegyric'?", a: "eulogy", d: ["diatribe", "panacea", "elegy"] },
  ],
  // day 3
  [
    { c: L, t: 1, q: "Which word fits: 'Keep your room ___ by putting everything away'?", a: "neat", d: ["messy", "bright", "warm"] },
    { c: L, t: 2, q: "Which word is closest in meaning to 'mighty'?", a: "powerful", d: ["noisy", "proud", "angry"] },
    { c: L, t: 3, q: "Which word is closest in meaning to 'resolute'?", a: "determined", d: ["hesitant", "resentful", "absolute"] },
    { c: L, t: 4, q: "Which word is the opposite of 'recalcitrant'?", a: "compliant", d: ["defiant", "reluctant", "weary"] },
    { c: L, t: 5, q: "Which word is closest in meaning to 'nugatory'?", a: "trivial", d: ["crucial", "sugary", "notorious"] },
  ],
  // day 4
  [
    { c: L, t: 1, q: "Which word is closest in meaning to 'shout'?", a: "yell", d: ["whisper", "sing", "run"] },
    { c: L, t: 2, q: "Which word is the opposite of 'swell'?", a: "shrink", d: ["grow", "burst", "float"] },
    { c: L, t: 3, q: "Which word is closest in meaning to 'meticulous'?", a: "thorough", d: ["careless", "anxious", "generous"] },
    { c: L, t: 4, q: "Which word is closest in meaning to 'ribald'?", a: "bawdy", d: ["prim", "rebellious", "cheerful"] },
    { c: L, t: 5, q: "Which word is the opposite of 'mendacious'?", a: "truthful", d: ["dishonest", "beggarly", "generous"] },
  ],
  // day 5
  [
    { c: L, t: 1, q: "Which word is the opposite of 'near'?", a: "far", d: ["close", "low", "soon"] },
    { c: L, t: 2, q: "Which word is the opposite of 'modern'?", a: "ancient", d: ["recent", "famous", "foreign"] },
    { c: L, t: 3, q: "Which word is the opposite of 'robust'?", a: "feeble", d: ["sturdy", "bold", "plump"] },
    { c: L, t: 4, q: "Which word is the opposite of 'munificent'?", a: "stingy", d: ["generous", "magnificent", "wealthy"] },
    { c: L, t: 5, q: "Which word is the opposite of 'opprobrium'?", a: "acclaim", d: ["disgrace", "opportunity", "probity"] },
  ],
  // day 6
  [
    { c: L, t: 1, q: "Which word is closest in meaning to 'mend'?", a: "fix", d: ["break", "build", "sell"] },
    { c: L, t: 2, q: "Which word fits: 'A ___ shopper hunts for bargains and wastes nothing'?", a: "thrifty", d: ["wasteful", "wealthy", "picky"] },
    { c: L, t: 3, q: "Which word is the opposite of 'placid'?", a: "agitated", d: ["calm", "polite", "lazy"] },
    { c: L, t: 4, q: "Which word is closest in meaning to 'pellucid'?", a: "transparent", d: ["murky", "hollow", "brittle"] },
    { c: L, t: 5, q: "Which word is closest in meaning to 'quotidian'?", a: "everyday", d: ["extraordinary", "quarterly", "quaint"] },
  ],
  // day 7
  [
    { c: L, t: 1, q: "Which word is closest in meaning to 'sick'?", a: "ill", d: ["sad", "weak", "old"] },
    { c: L, t: 2, q: "Which word fits: 'The house sat ___ for years with no one living in it'?", a: "vacant", d: ["crowded", "cheerful", "costly"] },
    { c: L, t: 3, q: "Which word is closest in meaning to 'squander'?", a: "waste", d: ["save", "wander", "borrow"] },
    { c: L, t: 4, q: "Which word is closest in meaning to 'temerity'?", a: "audacity", d: ["timidity", "temper", "patience"] },
    { c: L, t: 5, q: "Which word is the opposite of 'mellifluous'?", a: "strident", d: ["dulcet", "melodramatic", "plentiful"] },
  ],
  // day 8
  [
    { c: L, t: 1, q: "Which word is the opposite of 'open'?", a: "shut", d: ["wide", "empty", "bright"] },
    { c: L, t: 2, q: "Which word is closest in meaning to 'wicked'?", a: "evil", d: ["angry", "clever", "sad"] },
    { c: L, t: 3, q: "Which word is closest in meaning to 'obstinate'?", a: "stubborn", d: ["flexible", "obedient", "furious"] },
    { c: L, t: 4, q: "Which word is the opposite of 'pernicious'?", a: "beneficial", d: ["harmful", "suspicious", "sudden"] },
    { c: L, t: 5, q: "Which word is closest in meaning to 'obstreperous'?", a: "unruly", d: ["docile", "obsequious", "solemn"] },
  ],
  // day 9
  [
    { c: L, t: 1, q: "Which word is closest in meaning to 'start'?", a: "begin", d: ["finish", "try", "wait"] },
    { c: L, t: 2, q: "Which word is closest in meaning to 'pleasant'?", a: "agreeable", d: ["rude", "calm", "lucky"] },
    { c: L, t: 3, q: "Which word is the opposite of 'ubiquitous'?", a: "rare", d: ["widespread", "ancient", "valuable"] },
    { c: L, t: 4, q: "Which word is the opposite of 'phlegmatic'?", a: "excitable", d: ["unflappable", "sickly", "stubborn"] },
    { c: L, t: 5, q: "Which word is closest in meaning to 'vituperative'?", a: "abusive", d: ["laudatory", "conciliatory", "virtuous"] },
  ],
  // day 10
  [
    { c: L, t: 1, q: "Which word is closest in meaning to 'silent'?", a: "quiet", d: ["loud", "empty", "dark"] },
    { c: L, t: 2, q: "Which word is closest in meaning to 'unite'?", a: "join", d: ["divide", "fight", "meet"] },
    { c: L, t: 3, q: "Which word is closest in meaning to 'versatile'?", a: "adaptable", d: ["limited", "talkative", "valuable"] },
    { c: L, t: 4, q: "Which word is the opposite of 'obfuscate'?", a: "clarify", d: ["confuse", "observe", "hasten"] },
    { c: L, t: 5, q: "Which word fits: 'A ___ speaker never uses one syllable where five will do'?", a: "sesquipedalian", d: ["laconic", "garrulous", "candid"] },
  ],
  // day 11
  [
    { c: L, t: 1, q: "Which word is the opposite of 'wet'?", a: "dry", d: ["damp", "cold", "clean"] },
    { c: L, t: 2, q: "Which word is closest in meaning to 'rigid'?", a: "stiff", d: ["cold", "rough", "loose"] },
    { c: L, t: 3, q: "Which word is the opposite of 'mobile'?", a: "stationary", d: ["portable", "local", "silent"] },
    { c: L, t: 4, q: "Which word is the opposite of 'pugnacious'?", a: "peaceable", d: ["combative", "pungent", "stubborn"] },
    { c: L, t: 5, q: "Which word is the opposite of 'sedulous'?", a: "indolent", d: ["diligent", "seductive", "cautious"] },
  ],
  // day 12
  [
    { c: L, t: 1, q: "Which word is the opposite of 'many'?", a: "few", d: ["several", "most", "some"] },
    { c: L, t: 2, q: "Which word is the opposite of 'rough'?", a: "smooth", d: ["coarse", "sharp", "flat"] },
    { c: L, t: 3, q: "Which word is the opposite of 'verbose'?", a: "concise", d: ["wordy", "loud", "clever"] },
    { c: L, t: 4, q: "Which word is closest in meaning to 'ruminate'?", a: "ponder", d: ["hurry", "ruin", "gossip"] },
    { c: L, t: 5, q: "Which word is closest in meaning to 'solecism'?", a: "blunder", d: ["soliloquy", "propriety", "solace"] },
  ],
  // day 13
  [
    { c: L, t: 1, q: "Which word is the opposite of 'rich'?", a: "poor", d: ["wealthy", "famous", "hungry"] },
    { c: L, t: 2, q: "Which word is closest in meaning to 'modest'?", a: "humble", d: ["proud", "grateful", "lazy"] },
    { c: L, t: 3, q: "Which word is closest in meaning to 'vindictive'?", a: "vengeful", d: ["forgiving", "victorious", "jealous"] },
    { c: L, t: 4, q: "Which word is the opposite of 'sanguine'?", a: "pessimistic", d: ["optimistic", "jealous", "sincere"] },
    { c: L, t: 5, q: "Which word is the opposite of 'saturnine'?", a: "jovial", d: ["gloomy", "saturated", "celestial"] },
  ],
  // day 14
  [
    { c: L, t: 1, q: "Which word is the opposite of 'true'?", a: "false", d: ["real", "fair", "sure"] },
    { c: L, t: 2, q: "Which word is the opposite of 'permanent'?", a: "temporary", d: ["lasting", "recent", "partial"] },
    { c: L, t: 3, q: "Which word is closest in meaning to 'wary'?", a: "cautious", d: ["weary", "reckless", "angry"] },
    { c: L, t: 4, q: "Which word is closest in meaning to 'vacillate'?", a: "waver", d: ["decide", "vaccinate", "wander"] },
    { c: L, t: 5, q: "Which word is closest in meaning to 'pleonasm'?", a: "redundancy", d: ["brevity", "pleasure", "metaphor"] },
  ],
  // day 15
  [
    { c: L, t: 1, q: "Which word is the opposite of 'sad'?", a: "happy", d: ["unhappy", "angry", "sleepy"] },
    { c: L, t: 2, q: "Which word is the opposite of 'timid'?", a: "brave", d: ["shy", "nervous", "polite"] },
    { c: L, t: 3, q: "Which word is the opposite of 'superfluous'?", a: "essential", d: ["unnecessary", "excellent", "enormous"] },
    { c: L, t: 4, q: "Which word fits: 'A ___ person avoids spending money'?", a: "parsimonious", d: ["gregarious", "pretentious", "ambitious"] },
    { c: L, t: 5, q: "Which word is the opposite of 'pulchritude'?", a: "ugliness", d: ["beauty", "wisdom", "plumpness"] },
  ],
  // day 16
  [
    { c: L, t: 1, q: "Which word is closest in meaning to 'throw'?", a: "toss", d: ["catch", "push", "kick"] },
    { c: L, t: 2, q: "Which word is the opposite of 'sincere'?", a: "hypocritical", d: ["honest", "kind", "serious"] },
    { c: L, t: 3, q: "Which word is the opposite of 'prudent'?", a: "reckless", d: ["wise", "proud", "shy"] },
    { c: L, t: 4, q: "Which word is the opposite of 'taciturn'?", a: "talkative", d: ["silent", "moody", "polite"] },
    { c: L, t: 5, q: "Which word is the opposite of 'torpor'?", a: "vigor", d: ["lethargy", "torment", "rage"] },
  ],
  // day 17
  [
    { c: L, t: 1, q: "Which word is closest in meaning to 'noisy'?", a: "loud", d: ["crowded", "sleepy", "smooth"] },
    { c: L, t: 2, q: "Which word is closest in meaning to 'witty'?", a: "funny", d: ["dull", "loud", "shy"] },
    { c: L, t: 3, q: "Which word is closest in meaning to 'scrutinize'?", a: "examine", d: ["ignore", "criticize", "imagine"] },
    { c: L, t: 4, q: "Which word is closest in meaning to 'persnickety'?", a: "fussy", d: ["relaxed", "nosy", "persistent"] },
    { c: L, t: 5, q: "Which word is closest in meaning to 'risible'?", a: "laughable", d: ["solemn", "visible", "irritable"] },
  ],
  // day 18
  [
    { c: L, t: 1, q: "Which word is closest in meaning to 'quick'?", a: "fast", d: ["early", "heavy", "loud"] },
    { c: L, t: 2, q: "Which word is the opposite of 'public'?", a: "private", d: ["open", "local", "famous"] },
    { c: L, t: 3, q: "Which word is the opposite of 'naive'?", a: "sophisticated", d: ["innocent", "foolish", "cheerful"] },
    { c: L, t: 4, q: "Which word is closest in meaning to 'tacit'?", a: "implied", d: ["explicit", "tactful", "careful"] },
    { c: L, t: 5, q: "Which word is closest in meaning to 'mordant'?", a: "caustic", d: ["gentle", "morbid", "hesitant"] },
  ],
  // day 19
  [
    { c: L, t: 1, q: "Which word is the opposite of 'smart'?", a: "foolish", d: ["clever", "quick", "rude"] },
    { c: L, t: 2, q: "Which word is closest in meaning to 'reluctant'?", a: "unwilling", d: ["eager", "lazy", "tired"] },
    { c: L, t: 3, q: "Which word is the opposite of 'sporadic'?", a: "constant", d: ["occasional", "sudden", "violent"] },
    { c: L, t: 4, q: "Which word is closest in meaning to 'vociferous'?", a: "clamorous", d: ["quiet", "voracious", "hesitant"] },
    { c: L, t: 5, q: "Which word is the opposite of 'turpitude'?", a: "virtue", d: ["depravity", "laziness", "gratitude"] },
  ],
  // day 20
  [
    { c: L, t: 1, q: "Which word is the opposite of 'polite'?", a: "rude", d: ["kind", "quiet", "late"] },
    { c: L, t: 2, q: "Which word is closest in meaning to 'rescue'?", a: "save", d: ["capture", "warn", "chase"] },
    { c: L, t: 3, q: "Which word is closest in meaning to 'tedious'?", a: "boring", d: ["exciting", "difficult", "sudden"] },
    { c: L, t: 4, q: "Which word is closest in meaning to 'nefarious'?", a: "villainous", d: ["virtuous", "mysterious", "nervous"] },
    { c: L, t: 5, q: "Which word is closest in meaning to 'tendentious'?", a: "biased", d: ["impartial", "tentative", "tenuous"] },
  ],
  // day 21
  [
    { c: L, t: 1, q: "Which word is closest in meaning to 'tired'?", a: "sleepy", d: ["bored", "hungry", "sick"] },
    { c: L, t: 2, q: "Which word is the opposite of 'praise'?", a: "criticize", d: ["admire", "thank", "describe"] },
    { c: L, t: 3, q: "Which word is closest in meaning to 'tenacious'?", a: "persistent", d: ["tender", "lazy", "fierce"] },
    { c: L, t: 4, q: "Which word is closest in meaning to 'platitude'?", a: "cliché", d: ["plateau", "compliment", "insight"] },
    { c: L, t: 5, q: "Which word is closest in meaning to 'minatory'?", a: "menacing", d: ["soothing", "minor", "mandatory"] },
  ],
  // day 22
  [
    { c: L, t: 1, q: "Which word is the opposite of 'pull'?", a: "push", d: ["drag", "lift", "hold"] },
    { c: L, t: 2, q: "Which word is the opposite of 'shallow'?", a: "deep", d: ["narrow", "empty", "wide"] },
    { c: L, t: 3, q: "Which word is the opposite of 'resilient'?", a: "fragile", d: ["elastic", "patient", "silent"] },
    { c: L, t: 4, q: "Which word is the opposite of 'surreptitious'?", a: "overt", d: ["stealthy", "superstitious", "sudden"] },
    { c: L, t: 5, q: "Which word is closest in meaning to 'pertinacious'?", a: "dogged", d: ["irresolute", "pertinent", "cheerful"] },
  ],
  // day 23
  [
    { c: L, t: 1, q: "Which word is closest in meaning to 'tiny'?", a: "small", d: ["thin", "round", "soft"] },
    { c: L, t: 2, q: "Which word is the opposite of 'vague'?", a: "precise", d: ["unclear", "empty", "strange"] },
    { c: L, t: 3, q: "Which word is closest in meaning to 'mundane'?", a: "ordinary", d: ["thrilling", "sacred", "foreign"] },
    { c: L, t: 4, q: "Which word is closest in meaning to 'rancor'?", a: "bitterness", d: ["goodwill", "regret", "clamor"] },
    { c: L, t: 5, q: "Which word is closest in meaning to 'vainglorious'?", a: "boastful", d: ["humble", "glorious", "futile"] },
  ],
  // day 24
  [
    { c: L, t: 1, q: "Which word is the opposite of 'safe'?", a: "dangerous", d: ["secure", "lucky", "quiet"] },
    { c: L, t: 2, q: "Which word is closest in meaning to 'rapid'?", a: "swift", d: ["sudden", "slow", "smooth"] },
    { c: L, t: 3, q: "Which word is closest in meaning to 'pragmatic'?", a: "practical", d: ["idealistic", "dramatic", "cautious"] },
    { c: L, t: 4, q: "Which word is closest in meaning to 'mollify'?", a: "soothe", d: ["provoke", "modify", "delay"] },
    { c: L, t: 5, q: "Which word is closest in meaning to 'peripatetic'?", a: "itinerant", d: ["sedentary", "peripheral", "energetic"] },
  ],
  // day 25
  [
    { c: L, t: 1, q: "Which word is the opposite of 'thin'?", a: "thick", d: ["slim", "long", "soft"] },
    { c: L, t: 2, q: "Which word is closest in meaning to 'nervous'?", a: "anxious", d: ["calm", "angry", "lazy"] },
    { c: L, t: 3, q: "Which word fits: 'The ___ old judge was honored by the whole town'?", a: "venerable", d: ["vulnerable", "notorious", "timid"] },
    { c: L, t: 4, q: "Which word is closest in meaning to 'propitious'?", a: "favorable", d: ["ominous", "precious", "ambitious"] },
    { c: L, t: 5, q: "Which word is the opposite of 'prolix'?", a: "terse", d: ["verbose", "proper", "prolific"] },
  ],
  // day 26
  [
    { c: L, t: 1, q: "Which word is closest in meaning to 'scared'?", a: "afraid", d: ["brave", "angry", "shy"] },
    { c: L, t: 2, q: "Which word is closest in meaning to 'tranquil'?", a: "calm", d: ["lonely", "noisy", "slow"] },
    { c: L, t: 3, q: "Which word is closest in meaning to 'prosperous'?", a: "thriving", d: ["struggling", "proud", "generous"] },
    { c: L, t: 4, q: "Which word is closest in meaning to 'perfunctory'?", a: "cursory", d: ["thorough", "lengthy", "cheerful"] },
    { c: L, t: 5, q: "Which word is closest in meaning to 'vitiate'?", a: "impair", d: ["enliven", "restore", "initiate"] },
  ],
  // day 27
  [
    { c: L, t: 1, q: "Which word is closest in meaning to 'wide'?", a: "broad", d: ["long", "deep", "flat"] },
    { c: L, t: 2, q: "Which word is the opposite of 'raw'?", a: "cooked", d: ["fresh", "frozen", "sour"] },
    { c: L, t: 3, q: "Which word is closest in meaning to 'obsolete'?", a: "outdated", d: ["broken", "valuable", "foreign"] },
    { c: L, t: 4, q: "Which word is closest in meaning to 'trepidation'?", a: "fear", d: ["courage", "excitement", "sorrow"] },
    { c: L, t: 5, q: "Which word is closest in meaning to 'recondite'?", a: "obscure", d: ["obvious", "renovated", "solemn"] },
  ],
  // day 28
  [
    { c: L, t: 1, q: "Which word is closest in meaning to 'simple'?", a: "easy", d: ["light", "rough", "late"] },
    { c: L, t: 2, q: "Which word is the opposite of 'obey'?", a: "defy", d: ["follow", "serve", "listen"] },
    { c: L, t: 3, q: "Which word is the opposite of 'sullen'?", a: "cheerful", d: ["gloomy", "silent", "tired"] },
    { c: L, t: 4, q: "Which word is closest in meaning to 'venal'?", a: "corrupt", d: ["honest", "venial", "violent"] },
    { c: L, t: 5, q: "Which word is closest in meaning to 'truckle'?", a: "submit", d: ["resist", "chuckle", "haul"] },
  ],
  // day 29
  [
    { c: L, t: 1, q: "Which word is closest in meaning to 'weep'?", a: "cry", d: ["laugh", "sigh", "sleep"] },
    { c: L, t: 2, q: "Which word is closest in meaning to 'purchase'?", a: "buy", d: ["sell", "borrow", "lend"] },
    { c: L, t: 3, q: "Which word is closest in meaning to 'novice'?", a: "beginner", d: ["expert", "neighbor", "stranger"] },
    { c: L, t: 4, q: "Which word is closest in meaning to 'truculent'?", a: "aggressive", d: ["truthful", "timid", "sluggish"] },
    { c: L, t: 5, q: "Which word is closest in meaning to 'proclivity'?", a: "tendency", d: ["aversion", "proximity", "ability"] },
  ],
  // day 30
  [
    { c: L, t: 1, q: "Which word is the opposite of 'young'?", a: "old", d: ["fresh", "tall", "happy"] },
    { c: L, t: 2, q: "Which word is the opposite of 'scarce'?", a: "plentiful", d: ["rare", "small", "cheap"] },
    { c: L, t: 3, q: "Which word is closest in meaning to 'ominous'?", a: "threatening", d: ["obvious", "cheerful", "ancient"] },
    { c: L, t: 4, q: "Which word is closest in meaning to 'sycophant'?", a: "flatterer", d: ["critic", "stranger", "skeptic"] },
    { c: L, t: 5, q: "Which word is closest in meaning to 'recrudescence'?", a: "recurrence", d: ["decline", "crudeness", "recovery"] },
  ],
  // day 31
  [
    { c: L, t: 1, q: "Which word is closest in meaning to 'odd'?", a: "strange", d: ["normal", "angry", "lucky"] },
    { c: L, t: 2, q: "Which word is closest in meaning to 'noble'?", a: "honorable", d: ["cruel", "clumsy", "wealthy"] },
    { c: L, t: 3, q: "Which word is the opposite of 'tangible'?", a: "abstract", d: ["solid", "visible", "cheap"] },
    { c: L, t: 4, q: "Which word is closest in meaning to 'obdurate'?", a: "unyielding", d: ["obedient", "gentle", "durable"] },
    { c: L, t: 5, q: "Which word is closest in meaning to 'sybaritic'?", a: "self-indulgent", d: ["ascetic", "symbolic", "sympathetic"] },
  ],
  // day 32
  [
    { c: L, t: 1, q: "Which word is closest in meaning to 'talk'?", a: "speak", d: ["listen", "write", "walk"] },
    { c: L, t: 2, q: "Which word is closest in meaning to 'sturdy'?", a: "hardy", d: ["heavy", "fragile", "tall"] },
    { c: L, t: 3, q: "Which word is the opposite of 'mediocre'?", a: "excellent", d: ["average", "terrible", "modest"] },
    { c: L, t: 4, q: "Which word is closest in meaning to 'querulous'?", a: "complaining", d: ["content", "curious", "violent"] },
    { c: L, t: 5, q: "Which word is the opposite of 'perspicacious'?", a: "obtuse", d: ["perceptive", "transparent", "persistent"] },
  ],
  // day 33
  [
    { c: L, t: 1, q: "Which word is the opposite of 'ugly'?", a: "beautiful", d: ["plain", "messy", "tall"] },
    { c: L, t: 2, q: "Which word is closest in meaning to 'pardon'?", a: "forgive", d: ["punish", "forget", "accuse"] },
    { c: L, t: 3, q: "Which word is the opposite of 'relinquish'?", a: "retain", d: ["surrender", "refuse", "relish"] },
    { c: L, t: 4, q: "Which word is the opposite of 'magnanimous'?", a: "petty", d: ["noble", "gigantic", "shy"] },
    { c: L, t: 5, q: "Which word is closest in meaning to 'vertiginous'?", a: "dizzying", d: ["verdant", "vertical", "soothing"] },
  ],
  // day 34
  [
    { c: L, t: 1, q: "Which word is closest in meaning to 'victory'?", a: "win", d: ["loss", "game", "race"] },
    { c: L, t: 2, q: "Which word is the opposite of 'reveal'?", a: "hide", d: ["show", "tell", "find"] },
    { c: L, t: 3, q: "Which word is closest in meaning to 'vivid'?", a: "bright", d: ["dull", "sudden", "hollow"] },
    { c: L, t: 4, q: "Which word is closest in meaning to 'salubrious'?", a: "healthful", d: ["unhealthy", "sorrowful", "luxurious"] },
    { c: L, t: 5, q: "Which word is closest in meaning to 'otiose'?", a: "futile", d: ["essential", "odious", "ornate"] },
  ],
  // day 35
  [
    { c: L, t: 1, q: "Which word fits: 'A ___ child often hides behind a parent when meeting strangers'?", a: "shy", d: ["loud", "angry", "curious"] },
    { c: L, t: 2, q: "Which word is closest in meaning to 'weary'?", a: "fatigued", d: ["bored", "sad", "sick"] },
    { c: L, t: 3, q: "Which word is closest in meaning to 'pensive'?", a: "thoughtful", d: ["expensive", "cheerful", "nervous"] },
    { c: L, t: 4, q: "Which word is closest in meaning to 'supercilious'?", a: "haughty", d: ["humble", "superficial", "silly"] },
    { c: L, t: 5, q: "Which word is closest in meaning to 'rebarbative'?", a: "repellent", d: ["attractive", "bearded", "rebellious"] },
  ],
  // day 36
  [
    { c: L, t: 1, q: "Which word is closest in meaning to 'raise'?", a: "lift", d: ["lower", "carry", "open"] },
    { c: L, t: 2, q: "Which word is closest in meaning to 'obvious'?", a: "clear", d: ["hidden", "simple", "famous"] },
    { c: L, t: 3, q: "Which word is closest in meaning to 'paramount'?", a: "foremost", d: ["trivial", "ancient", "popular"] },
    { c: L, t: 4, q: "Which word is closest in meaning to 'quixotic'?", a: "idealistic", d: ["practical", "quick", "cautious"] },
    { c: L, t: 5, q: "Which word is closest in meaning to 'pusillanimous'?", a: "cowardly", d: ["valiant", "petty", "cunning"] },
  ],
];

// Days 37 to 74 (2026-11-24 to 2026-12-31). gen-english.mjs appends every day in
// LANE_DAYS after the bank's last day, so the segment already shipped (days 1 to
// 36, above) is kept under its own name and only this segment is exported as LANE_DAYS.
// Every target word is new to the lane, and the A-L / M-Z split still holds.
export const LANE_DAYS = [
  // day 37
  [
    { c: L, t: 1, q: "Which word is the opposite of 'never'?", a: "always", d: ["rarely", "later", "sometimes"] },
    { c: L, t: 2, q: "Which word is closest in meaning to 'perilous'?", a: "risky", d: ["peaceful", "tiresome", "precious"] },
    { c: L, t: 3, q: "Which word is closest in meaning to 'malleable'?", a: "pliable", d: ["brittle", "mellow", "harmful"] },
    { c: L, t: 4, q: "Which word is closest in meaning to 'maudlin'?", a: "mawkish", d: ["moldy", "stoic", "mundane"] },
    { c: L, t: 5, q: "Which word is the opposite of 'maladroit'?", a: "deft", d: ["clumsy", "awkward", "malicious"] },
  ],
  // day 38
  [
    { c: L, t: 1, q: "Which word is the opposite of 'tidy'?", a: "messy", d: ["clean", "small", "quiet"] },
    { c: L, t: 2, q: "Which word is closest in meaning to 'nimble'?", a: "agile", d: ["clumsy", "tiny", "noble"] },
    { c: L, t: 3, q: "Which word is closest in meaning to 'mitigate'?", a: "lessen", d: ["worsen", "migrate", "imitate"] },
    { c: L, t: 4, q: "Which word is closest in meaning to 'mendicant'?", a: "beggar", d: ["liar", "healer", "merchant"] },
    { c: L, t: 5, q: "Which word is closest in meaning to 'manumit'?", a: "emancipate", d: ["handwrite", "manipulate", "imprison"] },
  ],
  // day 39
  [
    { c: L, t: 1, q: "Which word is the opposite of 'smile'?", a: "frown", d: ["grin", "laugh", "wink"] },
    { c: L, t: 2, q: "Which word is closest in meaning to 'savor'?", a: "relish", d: ["waste", "refuse", "gulp"] },
    { c: L, t: 3, q: "Which word is closest in meaning to 'prolific'?", a: "productive", d: ["barren", "professional", "proud"] },
    { c: L, t: 4, q: "Which word is closest in meaning to 'mercurial'?", a: "erratic", d: ["merciful", "metallic", "steadfast"] },
    { c: L, t: 5, q: "Which word is closest in meaning to 'meretricious'?", a: "tawdry", d: ["meritorious", "modest", "venerable"] },
  ],
  // day 40
  [
    { c: L, t: 1, q: "Which word is the opposite of 'sour'?", a: "sweet", d: ["bitter", "tart", "sharp"] },
    { c: L, t: 2, q: "Which word is closest in meaning to 'meager'?", a: "scanty", d: ["generous", "eager", "bitter"] },
    { c: L, t: 3, q: "Which word is closest in meaning to 'morose'?", a: "gloomy", d: ["cheerful", "moral", "lively"] },
    { c: L, t: 4, q: "Which word is the opposite of 'nadir'?", a: "zenith", d: ["bottom", "depth", "trough"] },
    { c: L, t: 5, q: "Which word is closest in meaning to 'mountebank'?", a: "charlatan", d: ["banker", "mountaineer", "philanthropist"] },
  ],
  // day 41
  [
    { c: L, t: 1, q: "Which word is the opposite of 'soft'?", a: "hard", d: ["gentle", "quiet", "smooth"] },
    { c: L, t: 2, q: "Which word is closest in meaning to 'mournful'?", a: "sorrowful", d: ["joyful", "hopeful", "restful"] },
    { c: L, t: 3, q: "Which word is closest in meaning to 'negligent'?", a: "careless", d: ["careful", "negative", "elegant"] },
    { c: L, t: 4, q: "Which word is closest in meaning to 'nascent'?", a: "emerging", d: ["fading", "nasty", "mature"] },
    { c: L, t: 5, q: "Which word is closest in meaning to 'nescience'?", a: "ignorance", d: ["wisdom", "newness", "science"] },
  ],
  // day 42
  [
    { c: L, t: 1, q: "Which word is the opposite of 'tall'?", a: "short", d: ["thin", "wide", "heavy"] },
    { c: L, t: 2, q: "Which word is closest in meaning to 'peculiar'?", a: "odd", d: ["plain", "pleasant", "precise"] },
    { c: L, t: 3, q: "Which word is closest in meaning to 'nonchalant'?", a: "casual", d: ["anxious", "eager", "formal"] },
    { c: L, t: 4, q: "Which word is closest in meaning to 'nebulous'?", a: "vague", d: ["starry", "distinct", "noble"] },
    { c: L, t: 5, q: "Which word is closest in meaning to 'oleaginous'?", a: "oily", d: ["aged", "leafy", "dry"] },
  ],
  // day 43
  [
    { c: L, t: 1, q: "Which word is closest in meaning to 'stop'?", a: "halt", d: ["go", "turn", "hurry"] },
    { c: L, t: 2, q: "Which word is closest in meaning to 'persuade'?", a: "convince", d: ["pursue", "forbid", "confuse"] },
    { c: L, t: 3, q: "Which word is closest in meaning to 'oblivious'?", a: "unaware", d: ["obvious", "alert", "envious"] },
    { c: L, t: 4, q: "Which word is closest in meaning to 'noisome'?", a: "foul", d: ["noisy", "pleasant", "quiet"] },
    { c: L, t: 5, q: "Which word is closest in meaning to 'operose'?", a: "laborious", d: ["operatic", "effortless", "open"] },
  ],
  // day 44
  [
    { c: L, t: 1, q: "Which word is the opposite of 'remember'?", a: "forget", d: ["recall", "repeat", "learn"] },
    { c: L, t: 2, q: "Which word is closest in meaning to 'predict'?", a: "forecast", d: ["prevent", "protect", "pretend"] },
    { c: L, t: 3, q: "Which word is closest in meaning to 'opulent'?", a: "luxurious", d: ["shabby", "opaque", "optimistic"] },
    { c: L, t: 4, q: "Which word is closest in meaning to 'onerous'?", a: "burdensome", d: ["honorable", "effortless", "solitary"] },
    { c: L, t: 5, q: "Which word is closest in meaning to 'plangent'?", a: "resounding", d: ["muffled", "planned", "pleasant"] },
  ],
  // day 45
  [
    { c: L, t: 1, q: "Which word is closest in meaning to 'wealthy'?", a: "rich", d: ["poor", "famous", "kind"] },
    { c: L, t: 2, q: "Which word is the opposite of 'prohibit'?", a: "allow", d: ["forbid", "ban", "block"] },
    { c: L, t: 3, q: "Which word is closest in meaning to 'ostracize'?", a: "exclude", d: ["welcome", "applaud", "examine"] },
    { c: L, t: 4, q: "Which word is closest in meaning to 'paragon'?", a: "model", d: ["paradox", "rival", "failure"] },
    { c: L, t: 5, q: "Which word is closest in meaning to 'objurgate'?", a: "berate", d: ["object", "beseech", "exonerate"] },
  ],
  // day 46
  [
    { c: L, t: 1, q: "Which word is closest in meaning to 'pick'?", a: "choose", d: ["drop", "lose", "refuse"] },
    { c: L, t: 2, q: "Which word is closest in meaning to 'quarrel'?", a: "argument", d: ["agreement", "question", "quarter"] },
    { c: L, t: 3, q: "Which word is closest in meaning to 'outlandish'?", a: "bizarre", d: ["ordinary", "tasteful", "hopeful"] },
    { c: L, t: 4, q: "Which word is closest in meaning to 'penchant'?", a: "fondness", d: ["pendant", "penalty", "aversion"] },
    { c: L, t: 5, q: "Which word is closest in meaning to 'propinquity'?", a: "nearness", d: ["propriety", "distance", "prosperity"] },
  ],
  // day 47
  [
    { c: L, t: 1, q: "Which word is closest in meaning to 'often'?", a: "frequently", d: ["rarely", "never", "slowly"] },
    { c: L, t: 2, q: "Which word is closest in meaning to 'remote'?", a: "distant", d: ["nearby", "crowded", "rapid"] },
    { c: L, t: 3, q: "Which word is closest in meaning to 'partisan'?", a: "biased", d: ["neutral", "temporary", "courteous"] },
    { c: L, t: 4, q: "Which word is closest in meaning to 'penurious'?", a: "impoverished", d: ["wealthy", "penitent", "punctual"] },
    { c: L, t: 5, q: "Which word is closest in meaning to 'puerile'?", a: "childish", d: ["pure", "mature", "sickly"] },
  ],
  // day 48
  [
    { c: L, t: 1, q: "Which word is closest in meaning to 'under'?", a: "below", d: ["above", "beside", "behind"] },
    { c: L, t: 2, q: "Which word is closest in meaning to 'reliable'?", a: "dependable", d: ["fickle", "available", "likable"] },
    { c: L, t: 3, q: "Which word is closest in meaning to 'paucity'?", a: "scarcity", d: ["abundance", "pause", "caution"] },
    { c: L, t: 4, q: "Which word is closest in meaning to 'perfidious'?", a: "treacherous", d: ["perfect", "loyal", "fearful"] },
    { c: L, t: 5, q: "Which word is closest in meaning to 'quiescent'?", a: "dormant", d: ["active", "quizzical", "agitated"] },
  ],
  // day 49
  [
    { c: L, t: 1, q: "Which word is closest in meaning to 'mad'?", a: "angry", d: ["sleepy", "hungry", "proud"] },
    { c: L, t: 2, q: "Which word is closest in meaning to 'rotate'?", a: "spin", d: ["rot", "slide", "stop"] },
    { c: L, t: 3, q: "Which word is closest in meaning to 'perpetual'?", a: "everlasting", d: ["occasional", "perplexing", "brief"] },
    { c: L, t: 4, q: "Which word is closest in meaning to 'petulant'?", a: "peevish", d: ["patient", "perky", "generous"] },
    { c: L, t: 5, q: "Which word is closest in meaning to 'quidnunc'?", a: "busybody", d: ["miser", "coin collector", "hermit"] },
  ],
  // day 50
  [
    { c: L, t: 1, q: "Which word is closest in meaning to 'terrible'?", a: "awful", d: ["great", "strange", "silly"] },
    { c: L, t: 2, q: "Which word is closest in meaning to 'seize'?", a: "grab", d: ["release", "cease", "drop"] },
    { c: L, t: 3, q: "Which word is closest in meaning to 'placate'?", a: "appease", d: ["provoke", "decorate", "replace"] },
    { c: L, t: 4, q: "Which word is the opposite of 'plethora'?", a: "dearth", d: ["glut", "surplus", "plenty"] },
    { c: L, t: 5, q: "Which word is closest in meaning to 'refulgent'?", a: "shining", d: ["refreshing", "dull", "rebellious"] },
  ],
  // day 51
  [
    { c: L, t: 1, q: "Which word is closest in meaning to 'ready'?", a: "prepared", d: ["late", "tired", "busy"] },
    { c: L, t: 2, q: "Which word is closest in meaning to 'serene'?", a: "peaceful", d: ["noisy", "severe", "sincere"] },
    { c: L, t: 3, q: "Which word is closest in meaning to 'pompous'?", a: "self-important", d: ["humble", "generous", "timid"] },
    { c: L, t: 4, q: "Which word is the opposite of 'probity'?", a: "dishonesty", d: ["integrity", "rectitude", "decency"] },
    { c: L, t: 5, q: "Which word is closest in meaning to 'sangfroid'?", a: "composure", d: ["bloodlust", "panic", "sorrow"] },
  ],
  // day 52
  [
    { c: L, t: 1, q: "Which word is the opposite of 'night'?", a: "day", d: ["evening", "dark", "moon"] },
    { c: L, t: 2, q: "Which word is closest in meaning to 'solemn'?", a: "serious", d: ["playful", "solid", "lonely"] },
    { c: L, t: 3, q: "Which word is closest in meaning to 'precarious'?", a: "unstable", d: ["secure", "precious", "cautious"] },
    { c: L, t: 4, q: "Which word is closest in meaning to 'profligate'?", a: "wasteful", d: ["prophetic", "thrifty", "profitable"] },
    { c: L, t: 5, q: "Which word is closest in meaning to 'sapient'?", a: "wise", d: ["juicy", "foolish", "sleepy"] },
  ],
  // day 53
  [
    { c: L, t: 1, q: "Which word is the opposite of 'win'?", a: "lose", d: ["gain", "play", "score"] },
    { c: L, t: 2, q: "Which word is closest in meaning to 'spacious'?", a: "roomy", d: ["cramped", "special", "speedy"] },
    { c: L, t: 3, q: "Which word is the opposite of 'profound'?", a: "shallow", d: ["deep", "thoughtful", "serious"] },
    { c: L, t: 4, q: "Which word is closest in meaning to 'punctilious'?", a: "scrupulous", d: ["slapdash", "prickly", "pugnacious"] },
    { c: L, t: 5, q: "Which word is closest in meaning to 'senescent'?", a: "aging", d: ["sensible", "youthful", "fragrant"] },
  ],
  // day 54
  [
    { c: L, t: 1, q: "Which word is the opposite of 'sharp'?", a: "dull", d: ["pointed", "quick", "keen"] },
    { c: L, t: 2, q: "Which word is the opposite of 'stale'?", a: "fresh", d: ["old", "dry", "moldy"] },
    { c: L, t: 3, q: "Which word is closest in meaning to 'rebuke'?", a: "reprimand", d: ["praise", "rebuild", "rebound"] },
    { c: L, t: 4, q: "Which word is closest in meaning to 'quell'?", a: "suppress", d: ["inflame", "question", "quarrel"] },
    { c: L, t: 5, q: "Which word is closest in meaning to 'sententious'?", a: "moralizing", d: ["sensitive", "sentimental", "sedentary"] },
  ],
  // day 55
  [
    { c: L, t: 1, q: "Which word is closest in meaning to 'pretty'?", a: "lovely", d: ["plain", "silly", "strong"] },
    { c: L, t: 2, q: "Which word is closest in meaning to 'summit'?", a: "peak", d: ["valley", "base", "slope"] },
    { c: L, t: 3, q: "Which word is closest in meaning to 'reclusive'?", a: "solitary", d: ["sociable", "reckless", "exclusive"] },
    { c: L, t: 4, q: "Which word is closest in meaning to 'rapacious'?", a: "greedy", d: ["rapid", "generous", "rapturous"] },
    { c: L, t: 5, q: "Which word is closest in meaning to 'stentorian'?", a: "booming", d: ["whispered", "stern", "stony"] },
  ],
  // day 56
  [
    { c: L, t: 1, q: "Which word is the opposite of 'take'?", a: "give", d: ["grab", "hold", "keep"] },
    { c: L, t: 2, q: "Which word is the opposite of 'tame'?", a: "wild", d: ["gentle", "meek", "trained"] },
    { c: L, t: 3, q: "Which word is closest in meaning to 'remorse'?", a: "regret", d: ["pleasure", "reward", "rumor"] },
    { c: L, t: 4, q: "Which word is closest in meaning to 'recant'?", a: "retract", d: ["recount", "affirm", "decant"] },
    { c: L, t: 5, q: "Which word is closest in meaning to 'susurrus'?", a: "murmur", d: ["shriek", "sunrise", "syrup"] },
  ],
  // day 57
  [
    { c: L, t: 1, q: "Which word is the opposite of 'wrong'?", a: "right", d: ["false", "bad", "late"] },
    { c: L, t: 2, q: "Which word is closest in meaning to 'option'?", a: "choice", d: ["answer", "opinion", "problem"] },
    { c: L, t: 3, q: "Which word is closest in meaning to 'reticent'?", a: "reserved", d: ["outspoken", "resentful", "repetitive"] },
    { c: L, t: 4, q: "Which word is closest in meaning to 'remonstrate'?", a: "protest", d: ["demonstrate", "agree", "remember"] },
    { c: L, t: 5, q: "Which word is closest in meaning to 'tatterdemalion'?", a: "ragamuffin", d: ["tattletale", "daredevil", "dandy"] },
  ],
  // day 58
  [
    { c: L, t: 1, q: "Which word is closest in meaning to 'rest'?", a: "relax", d: ["work", "run", "rush"] },
    { c: L, t: 2, q: "Which word is closest in meaning to 'vow'?", a: "promise", d: ["threat", "question", "whisper"] },
    { c: L, t: 3, q: "Which word is the opposite of 'revere'?", a: "despise", d: ["respect", "honor", "admire"] },
    { c: L, t: 4, q: "Which word is closest in meaning to 'reprobate'?", a: "scoundrel", d: ["saint", "prophet", "reporter"] },
    { c: L, t: 5, q: "Which word is closest in meaning to 'threnody'?", a: "lament", d: ["triumph", "threat", "limerick"] },
  ],
  // day 59
  [
    { c: L, t: 1, q: "Which word is closest in meaning to 'unhappy'?", a: "sad", d: ["glad", "calm", "rich"] },
    { c: L, t: 2, q: "Which word is closest in meaning to 'yield'?", a: "surrender", d: ["resist", "attack", "defend"] },
    { c: L, t: 3, q: "Which word is closest in meaning to 'rudimentary'?", a: "basic", d: ["advanced", "rude", "ornate"] },
    { c: L, t: 4, q: "Which word is closest in meaning to 'repudiate'?", a: "reject", d: ["endorse", "repeat", "restore"] },
    { c: L, t: 5, q: "Which word is closest in meaning to 'peculate'?", a: "embezzle", d: ["speculate", "peel", "donate"] },
  ],
  // day 60
  [
    { c: L, t: 1, q: "Which word is closest in meaning to 'student'?", a: "pupil", d: ["teacher", "coach", "parent"] },
    { c: L, t: 2, q: "Which word is the opposite of 'recede'?", a: "advance", d: ["retreat", "withdraw", "ebb"] },
    { c: L, t: 3, q: "Which word is closest in meaning to 'solace'?", a: "comfort", d: ["sunlight", "sorrow", "isolation"] },
    { c: L, t: 4, q: "Which word is closest in meaning to 'sanctimonious'?", a: "self-righteous", d: ["humble", "sanitary", "generous"] },
    { c: L, t: 5, q: "Which word is closest in meaning to 'venial'?", a: "pardonable", d: ["venal", "mortal", "venomous"] },
  ],
  // day 61
  [
    { c: L, t: 1, q: "Which word is closest in meaning to 'speedy'?", a: "fast", d: ["slow", "late", "loud"] },
    { c: L, t: 2, q: "Which word is closest in meaning to 'novel' in 'a novel idea'?", a: "original", d: ["fictional", "lengthy", "outdated"] },
    { c: L, t: 3, q: "Which word is closest in meaning to 'stoic'?", a: "impassive", d: ["emotional", "excitable", "stocky"] },
    { c: L, t: 4, q: "Which word is closest in meaning to 'sardonic'?", a: "mocking", d: ["sorrowful", "sincere", "sedate"] },
    { c: L, t: 5, q: "Which word is closest in meaning to 'verisimilitude'?", a: "plausibility", d: ["falsehood", "verbosity", "variety"] },
  ],
  // day 62
  [
    { c: L, t: 1, q: "Which word is closest in meaning to 'weird'?", a: "strange", d: ["normal", "boring", "gentle"] },
    { c: L, t: 2, q: "Which word is closest in meaning to 'plump'?", a: "chubby", d: ["skinny", "plain", "tall"] },
    { c: L, t: 3, q: "Which word is the opposite of 'subtle'?", a: "blatant", d: ["delicate", "faint", "understated"] },
    { c: L, t: 4, q: "Which word is closest in meaning to 'scurrilous'?", a: "slanderous", d: ["scurrying", "flattering", "scrupulous"] },
    { c: L, t: 5, q: "Which word is closest in meaning to 'parvenu'?", a: "upstart", d: ["aristocrat", "newborn", "traveler"] },
  ],
  // day 63
  [
    { c: L, t: 1, q: "Which word is the opposite of 'wise'?", a: "foolish", d: ["clever", "old", "kind"] },
    { c: L, t: 2, q: "Which word is closest in meaning to 'radiant'?", a: "glowing", d: ["gloomy", "rapid", "radical"] },
    { c: L, t: 3, q: "Which word is the opposite of 'succinct'?", a: "rambling", d: ["brief", "pithy", "terse"] },
    { c: L, t: 4, q: "Which word is the opposite of 'sedentary'?", a: "active", d: ["seated", "idle", "inert"] },
    { c: L, t: 5, q: "Which word is closest in meaning to 'nostrum'?", a: "panacea", d: ["diagnosis", "nostalgia", "proverb"] },
  ],
  // day 64
  [
    { c: L, t: 1, q: "Which word is the opposite of 'stay'?", a: "leave", d: ["remain", "wait", "sit"] },
    { c: L, t: 2, q: "Which word is closest in meaning to 'tremble'?", a: "quiver", d: ["shout", "stumble", "freeze"] },
    { c: L, t: 3, q: "Which word is the opposite of 'tenuous'?", a: "substantial", d: ["flimsy", "slight", "tenacious"] },
    { c: L, t: 4, q: "Which word is closest in meaning to 'soporific'?", a: "sleep-inducing", d: ["sophisticated", "stimulating", "soapy"] },
    { c: L, t: 5, q: "Which word is closest in meaning to 'refractory'?", a: "unmanageable", d: ["reflective", "obedient", "refreshing"] },
  ],
  // day 65
  [
    { c: L, t: 1, q: "Which word is closest in meaning to 'rock'?", a: "stone", d: ["sand", "wood", "leaf"] },
    { c: L, t: 2, q: "Which word is closest in meaning to 'precious'?", a: "valuable", d: ["worthless", "previous", "common"] },
    { c: L, t: 3, q: "Which word is closest in meaning to 'thwart'?", a: "frustrate", d: ["assist", "throw", "wander"] },
    { c: L, t: 4, q: "Which word is closest in meaning to 'spurious'?", a: "counterfeit", d: ["authentic", "spirited", "hasty"] },
    { c: L, t: 5, q: "Which word is closest in meaning to 'poltroon'?", a: "coward", d: ["hero", "jester", "peasant"] },
  ],
  // day 66
  [
    { c: L, t: 1, q: "Which word is closest in meaning to 'nap'?", a: "doze", d: ["eat", "run", "sing"] },
    { c: L, t: 2, q: "Which word is closest in meaning to 'stern'?", a: "strict", d: ["gentle", "silly", "starry"] },
    { c: L, t: 3, q: "Which word is closest in meaning to 'transient'?", a: "fleeting", d: ["permanent", "transparent", "translated"] },
    { c: L, t: 4, q: "Which word is closest in meaning to 'trenchant'?", a: "incisive", d: ["vague", "trembling", "muddy"] },
    { c: L, t: 5, q: "Which word is closest in meaning to 'oppugn'?", a: "dispute", d: ["support", "oppress", "pursue"] },
  ],
  // day 67
  [
    { c: L, t: 1, q: "Which word is the opposite of 'sell'?", a: "buy", d: ["trade", "pay", "give"] },
    { c: L, t: 2, q: "Which word is closest in meaning to 'shabby'?", a: "worn-out", d: ["brand-new", "stylish", "costly"] },
    { c: L, t: 3, q: "Which word is closest in meaning to 'tumultuous'?", a: "turbulent", d: ["tranquil", "tuneful", "timid"] },
    { c: L, t: 4, q: "Which word is closest in meaning to 'unctuous'?", a: "smarmy", d: ["sincere", "uncouth", "clumsy"] },
    { c: L, t: 5, q: "Which word is closest in meaning to 'quondam'?", a: "former", d: ["future", "quarrelsome", "quiet"] },
  ],
  // day 68
  [
    { c: L, t: 1, q: "Which word is closest in meaning to 'merry'?", a: "joyful", d: ["sleepy", "grumpy", "quiet"] },
    { c: L, t: 2, q: "Which word is closest in meaning to 'twinkle'?", a: "sparkle", d: ["fade", "glare", "dim"] },
    { c: L, t: 3, q: "Which word is closest in meaning to 'whimsical'?", a: "playful", d: ["serious", "wistful", "wheezing"] },
    { c: L, t: 4, q: "Which word is closest in meaning to 'winsome'?", a: "charming", d: ["victorious", "sullen", "lonesome"] },
    { c: L, t: 5, q: "Which word is closest in meaning to 'sempiternal'?", a: "eternal", d: ["seasonal", "semiannual", "fleeting"] },
  ],
  // day 69
  [
    { c: L, t: 1, q: "Which word is closest in meaning to 'pal'?", a: "friend", d: ["rival", "stranger", "boss"] },
    { c: L, t: 2, q: "Which word is the opposite of 'transparent'?", a: "opaque", d: ["clear", "glassy", "see-through"] },
    { c: L, t: 3, q: "Which word is closest in meaning to 'vehement'?", a: "forceful", d: ["mild", "hesitant", "vague"] },
    { c: L, t: 4, q: "Which word is closest in meaning to 'upbraid'?", a: "scold", d: ["praise", "uplift", "entangle"] },
    { c: L, t: 5, q: "Which word is closest in meaning to 'tenebrous'?", a: "shadowy", d: ["tender", "tenacious", "sunny"] },
  ],
  // day 70
  [
    { c: L, t: 1, q: "Which word is the opposite of 'wake'?", a: "sleep", d: ["rise", "yawn", "stand"] },
    { c: L, t: 2, q: "Which word is closest in meaning to 'mumble'?", a: "mutter", d: ["shout", "sing", "giggle"] },
    { c: L, t: 3, q: "Which word is closest in meaning to 'vex'?", a: "annoy", d: ["soothe", "vote", "explain"] },
    { c: L, t: 4, q: "Which word is closest in meaning to 'tirade'?", a: "rant", d: ["parade", "whisper", "tribute"] },
    { c: L, t: 5, q: "Which word is closest in meaning to 'tyro'?", a: "neophyte", d: ["tyrant", "expert", "typist"] },
  ],
  // day 71
  [
    { c: L, t: 1, q: "Which word is the opposite of 'outside'?", a: "inside", d: ["outdoors", "beside", "around"] },
    { c: L, t: 2, q: "Which word is closest in meaning to 'reside'?", a: "inhabit", d: ["visit", "travel", "depart"] },
    { c: L, t: 3, q: "Which word is closest in meaning to 'volatile' in 'a volatile temper'?", a: "explosive", d: ["steady", "voluntary", "valuable"] },
    { c: L, t: 4, q: "Which word is closest in meaning to 'veracity'?", a: "truthfulness", d: ["voracity", "falsehood", "bravery"] },
    { c: L, t: 5, q: "Which word is closest in meaning to 'volte-face'?", a: "reversal", d: ["volley", "salute", "stalemate"] },
  ],
  // day 72
  [
    { c: L, t: 1, q: "Which word is the opposite of 'top'?", a: "bottom", d: ["peak", "side", "front"] },
    { c: L, t: 2, q: "Which word is closest in meaning to 'urgent'?", a: "pressing", d: ["trivial", "urban", "gentle"] },
    { c: L, t: 3, q: "Which word is the opposite of 'wane'?", a: "wax", d: ["fade", "ebb", "dwindle"] },
    { c: L, t: 4, q: "Which word is closest in meaning to 'verdant'?", a: "green", d: ["barren", "truthful", "ancient"] },
    { c: L, t: 5, q: "Which word is closest in meaning to 'mephitic'?", a: "noxious", d: ["fragrant", "mythical", "medicinal"] },
  ],
  // day 73
  [
    { c: L, t: 1, q: "Which word is closest in meaning to 'yummy'?", a: "delicious", d: ["bitter", "stale", "raw"] },
    { c: L, t: 2, q: "Which word is the opposite of 'thrive'?", a: "wither", d: ["flourish", "prosper", "bloom"] },
    { c: L, t: 3, q: "Which word is closest in meaning to 'wily'?", a: "crafty", d: ["naive", "wild", "weary"] },
    { c: L, t: 4, q: "Which word is closest in meaning to 'vilify'?", a: "defame", d: ["glorify", "vitalize", "verify"] },
    { c: L, t: 5, q: "Which word is closest in meaning to 'perspicuous'?", a: "lucid", d: ["perceptive", "perspiring", "murky"] },
  ],
  // day 74
  [
    { c: L, t: 1, q: "Which word is the opposite of 'new'?", a: "old", d: ["fresh", "modern", "recent"] },
    { c: L, t: 2, q: "Which word is closest in meaning to 'sufficient'?", a: "enough", d: ["scarce", "efficient", "lacking"] },
    { c: L, t: 3, q: "Which word is closest in meaning to 'zest'?", a: "gusto", d: ["boredom", "zenith", "lethargy"] },
    { c: L, t: 4, q: "Which word is closest in meaning to 'wan'?", a: "pallid", d: ["rosy", "wanton", "eager"] },
    { c: L, t: 5, q: "Which word is closest in meaning to 'traduce'?", a: "slander", d: ["translate", "introduce", "praise"] },
  ],
];
