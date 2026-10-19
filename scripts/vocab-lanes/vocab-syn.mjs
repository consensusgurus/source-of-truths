// Vocab lane: Synonyms & Opposites. 36 days x 5 tiers. Scope: closest-in-meaning
// and opposite-of questions on single words, plus occasional fill-the-blank.
// Every target word starts with a letter M through Z (the other lane takes A to L).
const L = 'Synonyms & Opposites';
export const LANE_DAYS = [
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
