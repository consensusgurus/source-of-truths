// Puzzle data for Stet, the daily copy-desk game. Imported ONLY by the server
// page (app/stet/page.js), which filters live<=today before passing puzzles to
// the client — so future briefs, and their answers, never ship to the browser.
//
// One news brief per day: five sentences (seven on Sundays). Each sentence
// carries an `errors` array with 0, 1, or (Sundays only) 2 errors — always a
// real word, so a spellchecker sails past it: eggcorns, swapped homophones,
// malaprops, AND grammar slips (should of, had ran, subject-verb). A sentence
// with an EMPTY errors array is clean copy — the player earns its points by
// stamping it "stet" (let it stand). Not every day carries a clean sentence.
//
// AUTHORING RULES (validate with scripts/verify-stet.mjs after ANY edit):
//  - errors: 0–1 per sentence on weekdays, 0–2 on Sundays (owner ruling
//    2026-07-17: Sundays are tougher, and only Sundays may double up).
//  - each error's `wrong` is the offending token exactly as it appears
//    (punctuation aside) and must appear EXACTLY ONCE in the sentence.
//  - `fix` is a single replacement token (hyphens allowed); `alts` lists other
//    accepted spellings. fix !== wrong, and the fix must not already appear in
//    the sentence.
//  - clean sentences (errors: []) carry a `cleanNote` — ideally BAIT: correct
//    usage of a word that looks wrong (bated, counsel, taut, morale, flair…).
//  - every error must be clean-cut for a mainstream copy desk — no contested
//    usage calls unless it's a Sunday item WITH a note that owns the ruling.
//  - `note` per error is the one-line payoff (15–140 chars).
//  - GRAMMAR EVERY DAY (owner ruling 2026-07-28): from 2026-08-11 forward
//    every day MUST carry at least one true GRAMMAR (syntax) error IN ADDITION
//    to the spelling/word-choice errors, tagged `kind: 'grammar'` on that error
//    object. Grammar = syntax: subject-verb agreement (Neither ... is; turnout
//    was, not were; the data are), verb form after have/had (had run/gone/drunk,
//    should have — never had ran, had went, should of), pronoun case (between
//    you and me; who vs whom), tense and participle slips. USAGE/word-choice
//    pairs (then/than, fewer/less, farther/further, affect/effect, homophones)
//    do NOT satisfy the grammar quota — they are the spelling/word-choice axis.
//    Keep grammar a minority of each day's errors, not the whole slate.
//  - `kind` is optional and defaults to word-choice/spelling; set `kind:
//    'grammar'` on the syntax errors. verify-stet.mjs enforces the daily quota
//    for every day on/after GRAMMAR_FROM.
//  - THE ERROR MUST BE SELF-CONTAINED (owner ruling 2026-08-14, after a reader
//    caught stet-8-14-26 #5: "The cyclist was fined for riding on the pavement",
//    marked fined→cautioned). The sentence itself must make the fix the only
//    reasonable reading. If the flagged word is correct standard English and
//    nothing in the sentence rules it out, there is NO error and the item is
//    unanswerable — the player is guessing which synonym the author had in mind.
//    Concretely, NEVER flag:
//      · a US/British variant, in either direction (meter/metre, grade/gradient,
//        leash/lead, nought/naught). No error may turn on the dialect axis, and
//        both forms are accepted. Acceptance is now automatic: the grader runs
//        every typed answer through lib/dialect-variants.js, so colour/color,
//        practise/practice and recognise/recognize all score without per-item
//        `alts`. Keep `alts` for genuinely DIFFERENT words (rein/curb/check).
//        Where a fix has only a British spelling and the US form is a different
//        word rather than a variant (draught/draft), list it in `alts` by hand.
//      · a synonym or a house-style preference (vellum→parchment, slate→tab,
//        creels→pots, juncture→time). "The other word is more usual" is not an error.
//      · a one-word-vs-two-word compound call (fire proof→fireproof, quay
//        side→quayside). These also RENDER BROKEN: the reveal strikes the tapped
//        word and inserts the fix after it, so "fire proof safe" reads back as
//        "fire fireproof safe". verify-stet.mjs now fails these outright.
//      · a listed variant spelling (wistaria for wisteria, gaol for jail). A
//        dictionary variant is not an error, any more than a dialect one is.
//      · a collective noun that is already correct. A pod of dolphins and a raft
//        of eider are the right terms; the bank once flagged both AND taught the
//        opposite on another day (#45.7 pod→school vs #74.3 school→pod).
//    The test before banking an item: read the sentence cold, with no answer key.
//    Could a careful copy editor land anywhere else? Then re-cut it.
//  - `alts` carries every other correct fix (only `fix` + `alts` score the second
//    point, so a player who writes an equally right word must not be marked down).
//  - THE COPY IS BRITISH, SO KEEP IT BRITISH (owner ruling 2026-08-15, after an
//    English player wrote in about stet-8-15-26: "Playing the games in England,
//    it's unfortunate when you use American terms. Never heard of a pry bar - we
//    use crowbar or jemmy"). She was flagging item 2, which was CLEAN copy: an
//    unfamiliar Americanism sitting in a clean sentence is an accidental decoy,
//    and a British player who taps it loses the item for reading it correctly.
//    So the bank prints British vocabulary and British spelling throughout, and
//    verify-stet.mjs fails a US-only term outright from BRITISH_VOICE_FROM
//    (2026-08-15) on. Note the two halves pull opposite ways and BOTH hold: the
//    copy the reader sees is British, while the answer the reader TYPES may be
//    in either dialect. Prefer a neutral word over either flag when one exists,
//    which is why "pry bar" became "crowbar" rather than "jemmy".
//    WATCH THE FALSE FRIENDS (2026-08-28, an English player on stet-8-28-26:
//    "here in England a draft is a first copy of something: draught is a rush of
//    air"). Item 4 was CLEAN copy reading "a persistent draft under the door",
//    and the US_ONLY list sailed past it because "draft" is also ordinary
//    British English in another sense — a first version. A one-way blocklist
//    cannot catch a word that is only American in ONE of its meanings, so
//    verify-stet.mjs carries a second list, FALSE_FRIENDS, that fires on the
//    word plus a context word from the US sense (draft/draught, check/cheque,
//    fall/autumn, curb/kerb). The cleanNote is the other tell, and it is the
//    cheaper one: this item's note read "draft is acceptable US style for a
//    current of air", which is the bank admitting in writing that a British
//    reader would flag it. A clean item that has to defend itself on dialect
//    grounds IS the bug, and the checker now fails it.
//  - AND THE FIX MUST BE FINDABLE (owner ruling 2026-08-15, after a second
//    complaint of the same shape as the cyclist one: "for #5 there are no
//    context clues to indicate the cyclist was cautioned rather than fined,
//    either would have been equally acceptable"). The rule above says the
//    flagged word must be WRONG; this one says it must POINT AT THE FIX. A
//    reader can only produce the right word if the wrong one sounds like it
//    (kerb/curb, allowed/aloud), is a form of it (had ran/run, thanked
//    they/those), is a near-miss spelling of it (trellice/trellis,
//    ampliation/amplification), or the two are a confusable pair a copy desk is
//    taught to watch for (fewer/less, flaunt/flout). Two unrelated words are a
//    synonym swap, and a reader who SPOTS the error still cannot know which
//    word the author meant, so the item is a coin toss however wrong the
//    flagged word is. verify-stet.mjs derives the relation itself and fails an
//    unrelated pair from FORCED_FIX_FROM (2026-08-16). A real confusable the
//    derivation misses goes in FORCED_PAIRS there WITH ITS REASON, and writing
//    the reason is the gate: if it will not write, re-cut the item. This ruling
//    turned reign→curb into kerb→curb, precise→specify into precise→precis
//    (with every other sensible fix in alts), vestures→vestments into
//    isle→aisle, wistaria→wisteria into trellice→trellis, and school→pod into
//    tied→tide.
//  - VARY WHICH SENTENCE IS CLEAN, AND WHICH CARRIES THE GRAMMAR SLIP (owner
//    rule 2026-09-09, after a reader wrote in: "I'm pretty sure #2 and #4 are
//    clean every single time on this. Is there a randomizer that could get
//    turned on"). He was right. From 2026-08-11 to 2026-09-29 every weekday was
//    banked to one shape — errors on sentences 1, 3 and 5, clean copy on 2 and
//    4, the grammar slip always on #1 — and every Sunday to another, so the
//    board could be solved without reading it. There is NO randomizer: items
//    render in bank order, so this is an authoring property, and it is the one
//    property no per-item rule above can see. Every rule in this header passed
//    on all 50 of those days. So: the clean positions must move day to day, no
//    position may be clean (or carry the grammar error) on four straight days
//    of its kind, no day may repeat the previous day's clean/error shape, and
//    over the bank no position may sit past 60% on either axis or be shut out
//    of one entirely. verify-stet.mjs enforces all of it from VARIETY_FROM
//    (2026-09-10); earlier days are played history and are left alone.
//  - never reuse a wrong→fix pair already banked here.
export const PUZZLES = [
  {
    num: 1,
    quizId: 'stet-7-17-26',
    live: '2026-07-17',
    dateLabel: 'July 17, 2026',
    sunday: false,
    items: [
      {
        text: "The mayor's veto exasperated tensions with the city council, aides conceded late Thursday.",
        errors: [{ wrong: 'exasperated', fix: 'exacerbated', note: 'To exacerbate is to make worse; to exasperate is to annoy someone.' }],
      },
      {
        text: 'Under the new deal, the young striker will have free reign over where he plays his final season.',
        errors: [{ wrong: 'reign', fix: 'rein', note: 'Free rein comes from horseback riding — slack reins — not royalty.' }],
      },
      {
        text: "The museum's new wing has peaked the interest of donors on both coasts.",
        errors: [{ wrong: 'peaked', fix: 'piqued', note: 'Piqued means stimulated. A peak is a summit.' }],
      },
      {
        text: "Critics called the committee's report a mute point, since the law it studies expired in June.",
        errors: [{ wrong: 'mute', fix: 'moot', note: 'Moot means debatable or academic; mute means silent.' }],
      },
      {
        text: 'Campaign volunteers waited with baited breath as the final precincts reported.',
        errors: [{ wrong: 'baited', fix: 'bated', note: '"Bated" is a clipped "abated" — breath held. Bait is for hooks.' }],
      },
    ],
  },
  {
    num: 2,
    quizId: 'stet-7-18-26',
    live: '2026-07-18',
    dateLabel: 'July 18, 2026',
    sunday: false,
    items: [
      {
        text: 'Prosecutors say the firm openly flaunted safety rules for the better part of a decade.',
        errors: [{ wrong: 'flaunted', fix: 'flouted', note: 'To flout is to defy a rule; to flaunt is to show something off.' }],
      },
      {
        text: "The senator's ten minutes of questioning failed to illicit a single straight answer.",
        errors: [{ wrong: 'illicit', fix: 'elicit', note: 'Elicit means draw out. Illicit means illegal.' }],
      },
      {
        text: 'The shop survives on wedding invitations and high-end stationary.',
        errors: [{ wrong: 'stationary', fix: 'stationery', note: 'Stationery with an e is paper — remember e for envelope. Stationary means not moving.' }],
      },
      {
        text: 'Both coaches met at midfield to diffuse the situation before the restart.',
        errors: [{ wrong: 'diffuse', fix: 'defuse', note: 'Defuse: take the fuse out of. Diffuse: spread thin.' }],
      },
      {
        text: "The gallery waited with bated breath as the auction's final lot crossed the block.",
        errors: [],
        cleanNote: 'Clean copy — and yes, "bated" is right. Yesterday’s lesson pays off.',
      },
    ],
  },
  {
    num: 3,
    quizId: 'stet-7-19-26',
    live: '2026-07-19',
    dateLabel: 'July 19, 2026',
    sunday: true,
    items: [
      {
        text: 'The chief executive kept the board appraised of the merger talks throughout the weekend.',
        errors: [{ wrong: 'appraised', fix: 'apprised', note: 'Apprise: inform. Appraise: put a value on.' }],
      },
      {
        text: 'Her new book challenges the central tenants of modern portfolio theory.',
        errors: [{ wrong: 'tenants', fix: 'tenets', note: 'Tenets are principles; tenants pay rent.' }],
      },
      {
        text: "Analysts describe the fund's incoming manager as deeply adverse to leverage.",
        errors: [{ wrong: 'adverse', fix: 'averse', note: 'People are averse (opposed); conditions are adverse (unfavorable).' }],
      },
      {
        text: 'For decades the label traded on the cache of its Paris address.',
        errors: [{ wrong: 'cache', fix: 'cachet', note: 'Cachet: prestige. A cache is a hidden store.' }],
      },
      {
        text: 'Forecasters warned that landfall was immanent by Sunday evening.',
        errors: [{ wrong: 'immanent', fix: 'imminent', note: 'Imminent: about to happen. Immanent: inherent — a theology word.' }],
      },
      {
        text: 'The study sorts undecided voters into five discreet categories by age and income.',
        errors: [{ wrong: 'discreet', fix: 'discrete', note: 'Discrete: separate and distinct. Discreet: tactful.' }],
      },
      {
        text: 'The chairman excepted the resignation with regret, adding that the timing could hardly have been worst.',
        errors: [
          { wrong: 'excepted', fix: 'accepted', note: 'Accept: receive. Except: leave out.' },
          { wrong: 'worst', fix: 'worse', note: 'Worse is the comparative — nothing is being ranked dead last here.' },
        ],
      },
    ],
  },
  {
    num: 4,
    quizId: 'stet-7-20-26',
    live: '2026-07-20',
    dateLabel: 'July 20, 2026',
    sunday: false,
    items: [
      {
        text: 'The sommelier insisted the dry riesling compliments the pork course.',
        errors: [{ wrong: 'compliments', fix: 'complements', note: 'Complement: complete or pair well with. Compliment: praise.' }],
      },
      {
        text: 'Patients in the trial reported only mild side affects within the first week.',
        errors: [{ wrong: 'affects', fix: 'effects', note: 'Effect is the noun — side effects. Affect is (almost always) the verb.' }],
      },
      {
        text: 'He refused on principal to accept the settlement, however generous.',
        errors: [{ wrong: 'principal', fix: 'principle', note: 'A principle is a rule you live by; principal means main — or runs a school.' }],
      },
      {
        text: 'Auditors poured over the ledgers through the night before the filing.',
        errors: [{ wrong: 'poured', fix: 'pored', note: 'To pore over is to study closely; pouring is for liquids.' }],
      },
      {
        text: 'The number of asylum applications have doubled since June, the ministry said.',
        errors: [{ wrong: 'have', fix: 'has', note: 'The subject is "the number" — singular. The number has doubled.' }],
      },
    ],
  },
  {
    num: 5,
    quizId: 'stet-7-21-26',
    live: '2026-07-21',
    dateLabel: 'July 21, 2026',
    sunday: false,
    items: [
      {
        text: 'The designer chose a muted palate of grays and sage for the lobby.',
        errors: [{ wrong: 'palate', fix: 'palette', note: 'A palette holds colors; the palate tastes; a pallet carries freight.' }],
      },
      {
        text: 'The ruling sited three landmark cases from the 1970s.',
        errors: [{ wrong: 'sited', fix: 'cited', note: 'Cite: refer to. Site: a place (a building is sited).' }],
      },
      {
        text: 'Nervous investors moved their capitol offshore ahead of the vote.',
        errors: [{ wrong: 'capitol', fix: 'capital', note: 'Capital is the money (and the city); a capitol is the statehouse building.' }],
      },
      {
        text: 'The two-minute trailer is built to wet your appetite for the sequel.',
        errors: [{ wrong: 'wet', fix: 'whet', note: 'Whet: sharpen — as on a whetstone.' }],
      },
      {
        text: 'Counsel for the estate declined to comment as the hearing adjourned.',
        errors: [],
        cleanNote: 'Clean copy — "counsel," the lawyer, is exactly right. A council is a committee.',
      },
    ],
  },
  {
    num: 6,
    quizId: 'stet-7-22-26',
    live: '2026-07-22',
    dateLabel: 'July 22, 2026',
    sunday: false,
    items: [
      {
        text: "The keeper insists the missed penalty didn't phase him one bit.",
        errors: [{ wrong: 'phase', fix: 'faze', note: 'Faze: rattle. A phase is a stage.' }],
      },
      {
        text: 'The regional carrier has been in dire straights since the fuel spike.',
        errors: [{ wrong: 'straights', fix: 'straits', note: 'Straits are narrow, dangerous waters — hence tight spots.' }],
      },
      {
        text: "The witness's totals simply don't jive with the bank records.",
        errors: [{ wrong: 'jive', fix: 'jibe', note: 'Jibe: agree. Jive: swing-era slang (or the dance).' }],
      },
      {
        text: 'In the end every backbencher towed the party line on the final vote.',
        errors: [{ wrong: 'towed', fix: 'toed', note: 'Toe the line: stand with your toes at the mark.' }],
      },
      {
        text: 'Bookmakers rate the incumbent a shoe-in for a third term.',
        errors: [{ wrong: 'shoe-in', fix: 'shoo-in', alts: ['shooin'], note: 'A shoo-in was a horse shooed toward the finish.' }],
      },
    ],
  },
  {
    num: 7,
    quizId: 'stet-7-23-26',
    live: '2026-07-23',
    dateLabel: 'July 23, 2026',
    sunday: false,
    items: [
      {
        text: 'The veteran guard lead the league in assists for a third straight season.',
        errors: [{ wrong: 'lead', fix: 'led', note: 'Led is the past tense. Lead that rhymes with led is the metal.' }],
      },
      {
        text: 'The retiring chairman was loathe to name a successor.',
        errors: [{ wrong: 'loathe', fix: 'loath', note: 'Loath: reluctant (adjective). Loathe: to despise (verb).' }],
      },
      {
        text: "The film's premier drew half of Hollywood to the Bowl.",
        errors: [{ wrong: 'premier', fix: 'premiere', note: 'A premiere is a debut; a premier runs a government.' }],
      },
      {
        text: 'Reactions to the verdict ran the gambit from delight to fury.',
        errors: [{ wrong: 'gambit', fix: 'gamut', note: 'A gamut is the full range; a gambit is an opening move.' }],
      },
      {
        text: "Reviewers praised the thriller's taut, ninety-minute final cut.",
        errors: [],
        cleanNote: 'Clean copy — taut, stretched tight, is the right word. Taught is for teachers.',
      },
    ],
  },
  {
    num: 8,
    quizId: 'stet-7-24-26',
    live: '2026-07-24',
    dateLabel: 'July 24, 2026',
    sunday: false,
    items: [
      {
        text: 'Her resolve never waivered during the eleven-day strike.',
        errors: [{ wrong: 'waivered', fix: 'wavered', note: 'To waver is to hesitate; a waiver signs away a right.' }],
      },
      {
        text: "Lenders remain weary of the sector after last year's defaults.",
        errors: [{ wrong: 'weary', fix: 'wary', note: 'Wary: cautious. Weary: tired.' }],
      },
      {
        text: 'The clerk read a two-page summery of the findings into the record.',
        errors: [{ wrong: 'summery', fix: 'summary', note: 'Summery describes the weather.' }],
      },
      {
        text: 'The ace reliever holds duel citizenship and may pitch for either country.',
        errors: [{ wrong: 'duel', fix: 'dual', note: 'Dual: double. A duel needs pistols at dawn.' }],
      },
      {
        text: 'Pundits agree the referee should of waved play on before the collision.',
        errors: [{ wrong: 'of', fix: 'have', note: '"Should have" — the spoken "should’ve" is where "of" sneaks in.' }],
      },
    ],
  },
  {
    num: 9,
    quizId: 'stet-7-25-26',
    live: '2026-07-25',
    dateLabel: 'July 25, 2026',
    sunday: false,
    items: [
      {
        text: 'The family grove ships naval oranges across the Midwest all winter.',
        errors: [{ wrong: 'naval', fix: 'navel', note: 'Navel oranges have the little belly button; naval means navy.' }],
      },
      {
        text: 'Regulators accused the site of pedaling miracle cures to seniors.',
        errors: [{ wrong: 'pedaling', fix: 'peddling', note: 'Peddle: hawk goods. Pedal: what you do on a bike.' }],
      },
      {
        text: 'The report accuses a foreign service of medaling in the election.',
        errors: [{ wrong: 'medaling', fix: 'meddling', note: 'Meddle: interfere. Medal: what you win for it, presumably.' }],
      },
      {
        text: "The intern spent a whole summer at the director's beck and call.",
        errors: [],
        cleanNote: "Clean copy: 'beck and call' is the idiom, from beck, an old word for a summoning nod. 'Beckon call' is the eggcorn.",
      },
      {
        text: 'Morale in the clubhouse has soared since the deadline trade.',
        errors: [],
        cleanNote: 'Clean copy — morale, the team’s spirit, is spot on. A story has a moral.',
      },
    ],
  },
  {
    num: 10,
    quizId: 'stet-7-26-26',
    live: '2026-07-26',
    dateLabel: 'July 26, 2026',
    sunday: true,
    items: [
      {
        text: 'The appeal hinges on whether the seated jurors were truly uninterested parties.',
        errors: [{ wrong: 'uninterested', fix: 'disinterested', note: 'Disinterested: impartial, no stake. Uninterested: bored.' }],
      },
      {
        text: 'The archipelago is comprised of eleven inhabited islands.',
        errors: [{ wrong: 'comprised', fix: 'composed', note: 'The whole comprises its parts — "comprised of" flips it. Composed of is the fix.' }],
      },
      {
        text: "The symphony's climatic third movement lost the audience entirely.",
        errors: [{ wrong: 'climatic', fix: 'climactic', note: 'Climactic: of a climax. Climatic: of climate.' }],
      },
      {
        text: 'By nine, a line of perspective buyers wrapped around the showroom.',
        errors: [{ wrong: 'perspective', fix: 'prospective', note: 'Prospective: would-be. Perspective: point of view.' }],
      },
      {
        text: 'The derecho wrecked havoc across three counties overnight.',
        errors: [{ wrong: 'wrecked', fix: 'wreaked', note: 'One wreaks havoc. Wrecked means destroyed — which, fair.' }],
      },
      {
        text: 'Judges called the bridge design ingenious in its simplicity.',
        errors: [],
        cleanNote: 'Clean copy — ingenious (clever) is correct. Ingenuous — artless — would be the error.',
      },
      {
        text: 'Her advise — settle quietly before the appeal — fell on death ears.',
        errors: [
          { wrong: 'advise', fix: 'advice', note: 'Advice is the noun you give; advise is the verb you do.' },
          { wrong: 'death', fix: 'deaf', note: 'Deaf ears — ears that cannot hear. Grimmer than intended otherwise.' },
        ],
      },
    ],
  },
  {
    num: 11,
    quizId: 'stet-7-27-26',
    live: '2026-07-27',
    dateLabel: 'July 27, 2026',
    sunday: false,
    items: [
      {
        text: 'The suit alleges a clear breech of fiduciary duty by the trustees.',
        errors: [{ wrong: 'breech', fix: 'breach', note: 'Breach: a break or violation. Breech: the rear of a gun barrel.' }],
      },
      {
        text: 'The grounded jet sat in a leased hanger through the audit.',
        errors: [{ wrong: 'hanger', fix: 'hangar', note: 'Aircraft live in hangars; shirts live on hangers.' }],
      },
      {
        text: "The filing claims undo influence by the founder's family.",
        errors: [{ wrong: 'undo', fix: 'undue', note: 'Undue: excessive. Undo: reverse.' }],
      },
      {
        text: 'Debris was laying across both lanes of the parkway at dawn.',
        errors: [{ wrong: 'laying', fix: 'lying', note: 'Things lie where they are; you lay something down. The debris was lying there.' }],
      },
      {
        text: 'The documentary follows the air to a Greek shipping fortune.',
        errors: [{ wrong: 'air', fix: 'heir', note: 'An heir inherits. The h is silent, the money is not.' }],
      },
    ],
  },
  {
    num: 12,
    quizId: 'stet-7-28-26',
    live: '2026-07-28',
    dateLabel: 'July 28, 2026',
    sunday: false,
    items: [
      {
        text: 'The amendment protects the right to bare arms, the militia clause notwithstanding.',
        errors: [{ wrong: 'bare', fix: 'bear', note: 'To bear arms is to carry them; bare arms are just sleeveless.' }],
      },
      {
        text: 'Detectives described a grizzly scene inside the warehouse.',
        errors: [{ wrong: 'grizzly', fix: 'grisly', note: 'Grisly: gruesome. Grizzly: the bear.' }],
      },
      {
        text: 'The surgery repaired both of the tenor’s vocal chords.',
        errors: [{ wrong: 'chords', fix: 'cords', note: 'Vocal cords are folds of tissue; chords are for guitars.' }],
      },
      {
        text: 'Doctors urged fans to curve their enthusiasm about the experimental drug.',
        errors: [{ wrong: 'curve', fix: 'curb', note: 'Curb: restrain — as a curb bit restrains a horse.' }],
      },
      {
        text: "Scouts rave about the rookie's flair for the dramatic finish.",
        errors: [],
        cleanNote: 'Clean copy — flair, the knack, is right. A flare burns.',
      },
    ],
  },
  {
    num: 13,
    quizId: 'stet-7-29-26',
    live: '2026-07-29',
    dateLabel: 'July 29, 2026',
    sunday: false,
    items: [
      {
        text: 'The battery lab keeps pushing the envelop on energy density.',
        errors: [{ wrong: 'envelop', fix: 'envelope', note: '"Push the envelope" is test-pilot jargon — the flight limits. Envelop is a verb.' }],
      },
      {
        text: 'Jurors heard an incredulous tale of offshore accounts and burner phones.',
        errors: [{ wrong: 'incredulous', fix: 'incredible', note: 'Stories are incredible; the people hearing them are incredulous.' }],
      },
      {
        text: 'A traveling troop of acrobats opens the county fair on Friday.',
        errors: [{ wrong: 'troop', fix: 'troupe', note: 'A troupe performs; a troop marches.' }],
      },
      {
        text: 'The bill cleared the chamber with less than a dozen votes to spare.',
        errors: [{ wrong: 'less', fix: 'fewer', note: 'Fewer for things you count, less for things you measure.' }],
      },
      {
        text: 'The village well had ran dry by the middle of August.',
        errors: [{ wrong: 'ran', fix: 'run', kind: 'grammar', note: 'Had run — "ran" never follows "had."' }],
      },
    ],
  },
  {
    num: 14,
    quizId: 'stet-7-30-26',
    live: '2026-07-30',
    dateLabel: 'July 30, 2026',
    sunday: false,
    items: [
      {
        text: 'Officials said the ceremony would precede as planned despite the forecast.',
        errors: [{ wrong: 'precede', fix: 'proceed', note: 'Proceed: go ahead. Precede: come before.' }],
      },
      {
        text: 'A record amount of complaints reached the ombudsman in June.',
        errors: [{ wrong: 'amount', fix: 'number', note: 'Complaints are countable — a number of them. Amount is for bulk.' }],
      },
      {
        text: 'The two rivals signed a historical ceasefire at dawn on Thursday.',
        errors: [{ wrong: 'historical', fix: 'historic', note: 'Historic: momentous. Historical: merely from the past.' }],
      },
      {
        text: 'Campaign volunteers will canvas the district on Saturday morning.',
        errors: [{ wrong: 'canvas', fix: 'canvass', note: 'Canvass, two s’s: solicit votes. Canvas: the cloth.' }],
      },
      {
        text: 'Turnout ran far higher then expected in the northern districts.',
        errors: [{ wrong: 'then', fix: 'than', note: 'Than compares; then sequences.' }],
      },
    ],
  },
  {
    num: 15,
    quizId: 'stet-7-31-26',
    live: '2026-07-31',
    dateLabel: 'July 31, 2026',
    sunday: false,
    items: [
      {
        text: 'The transit authority raised fares this week to insure the network stays solvent through 2030.',
        errors: [{ wrong: 'insure', fix: 'ensure', note: 'Ensure: make certain. Insure: buy an insurance policy against loss.' }],
      },
      {
        text: 'Officials warned the aging signal system could cause the agency to loose federal funding.',
        errors: [{ wrong: 'loose', fix: 'lose', note: 'Lose is the verb (to lose funding); loose is the adjective, not tight.' }],
      },
      {
        text: 'A hoard of commuters packed the downtown platform during the morning rush.',
        errors: [{ wrong: 'hoard', fix: 'horde', note: 'A horde is a crowd; a hoard is a hidden stash of treasure.' }],
      },
      {
        text: 'The new express line complements the existing bus network rather than replacing it.',
        errors: [],
        cleanNote: 'Clean copy — complements (completes, pairs with) is right; a compliment is praise.',
      },
      {
        text: 'The chair promised farther study before any station is closed for good.',
        errors: [{ wrong: 'farther', fix: 'further', note: 'Further for figurative or additional; farther is for physical distance.' }],
      },
    ],
  },
  {
    num: 16,
    quizId: 'stet-8-1-26',
    live: '2026-08-01',
    dateLabel: 'August 1, 2026',
    sunday: false,
    items: [
      {
        text: 'Engineers said the overnight fuel leak effected only the backup booster.',
        errors: [{ wrong: 'effected', fix: 'affected', note: 'Affected: influenced. Effected would mean brought about, a different verb.' }],
      },
      {
        text: 'Early attempts to restart the main engine proved all in vein.',
        errors: [{ wrong: 'vein', fix: 'vain', note: 'In vain means to no avail; a vein carries blood.' }],
      },
      {
        text: 'The recovery crew gave the returning capsule a hardy round of applause.',
        errors: [{ wrong: 'hardy', fix: 'hearty', note: 'Hearty: warm and full. Hardy: tough, able to endure hardship.' }],
      },
      {
        text: "The mission's principal investigator briefed reporters within the hour.",
        errors: [],
        cleanNote: 'Clean copy — the principal investigator is the lead; a principle is a rule.',
      },
      {
        text: 'By Friday the launch window had went, and the flight slipped to autumn.',
        errors: [{ wrong: 'went', fix: 'gone', kind: 'grammar', note: 'Had gone: the participle after had is gone, never went.' }],
      },
    ],
  },
  {
    num: 17,
    quizId: 'stet-8-2-26',
    live: '2026-08-02',
    dateLabel: 'August 2, 2026',
    sunday: true,
    items: [
      {
        text: 'The negotiator tried a softer tact after the first round of talks collapsed.',
        errors: [{ wrong: 'tact', fix: 'tack', note: 'The idiom is "change tack" (a sailing turn); tact is diplomacy.' }],
      },
      {
        text: 'The chef plated each course with theatrical flare and a wink at the diners.',
        errors: [{ wrong: 'flare', fix: 'flair', note: 'Flair is a knack or style; a flare is a burst of light or flame.' }],
      },
      {
        text: "The thriller's plot stayed taut right up to the final page.",
        errors: [],
        cleanNote: 'Clean copy: taut (pulled tight) is correct; taught is the past tense of teach.',
      },
      {
        text: 'The zoning counsel meets Tuesday to weigh the disputed permit.',
        errors: [{ wrong: 'counsel', fix: 'council', note: 'A council is the governing body; counsel is advice or a lawyer.' }],
      },
      {
        text: 'The couple refused to altar their vows, leaving guests to wander what went wrong.',
        errors: [
          { wrong: 'altar', fix: 'alter', note: 'To alter is to change; an altar is the ceremonial table.' },
          { wrong: 'wander', fix: 'wonder', note: 'To wonder is to muse; to wander is to roam on foot.' },
        ],
      },
      {
        text: 'Auditors pour over the records at every construction cite before signing off.',
        errors: [
          { wrong: 'pour', fix: 'pore', note: 'You pore over documents (study them closely); you pour a drink.' },
          { wrong: 'cite', fix: 'site', note: 'A site is a location; to cite is to quote a source.' },
        ],
      },
      {
        text: 'She answered the reporters with a rye smile and said nothing more.',
        errors: [{ wrong: 'rye', fix: 'wry', note: 'A wry smile is dryly ironic; rye is a grain or a whiskey.' }],
      },
    ],
  },
  {
    num: 18,
    quizId: 'stet-8-3-26',
    live: '2026-08-03',
    dateLabel: 'August 3, 2026',
    sunday: false,
    items: [
      {
        text: 'Analysts named the young startup the dominate player in regional logistics.',
        errors: [{ wrong: 'dominate', fix: 'dominant', note: 'Dominant is the adjective; dominate is the verb you do to rivals.' }],
      },
      {
        text: "Investigators described the shell company's paperwork as bazaar and contradictory.",
        errors: [{ wrong: 'bazaar', fix: 'bizarre', note: 'Bizarre means weird; a bazaar is a marketplace.' }],
      },
      {
        text: 'The gallery offered longtime patrons an early peak at the restored mural.',
        errors: [{ wrong: 'peak', fix: 'peek', note: 'A peek is a quick look; a peak is a mountain summit.' }],
      },
      {
        text: 'Forecasters warned that lightening could ground flights through the evening.',
        errors: [{ wrong: 'lightening', fix: 'lightning', note: 'Lightning is the bolt; lightening means making lighter.' }],
      },
      {
        text: "The council praised the auditor's discreet handling of the quiet settlement.",
        errors: [],
        cleanNote: 'Clean copy: discreet (tactful) is right here; discrete would mean separate.',
      },
    ],
  },
  {
    num: 19,
    quizId: 'stet-8-4-26',
    live: '2026-08-04',
    dateLabel: 'August 4, 2026',
    sunday: false,
    items: [
      {
        text: 'The board voted to except the new bylaws at its meeting on Friday.',
        errors: [{ wrong: 'except', fix: 'accept', note: 'To accept is to receive or approve; except means to leave out.' }],
      },
      {
        text: 'By the third hour of testimony, several jurors looked visibly board.',
        errors: [{ wrong: 'board', fix: 'bored', note: 'Bored means weary; a board is a plank or a governing body.' }],
      },
      {
        text: 'Of coarse the deadline can move if the client agrees.',
        errors: [{ wrong: 'coarse', fix: 'course', note: 'Of course uses course; coarse means rough in texture.' }],
      },
      {
        text: 'The negotiators reached an amicable accord after weeks of quiet talks.',
        errors: [],
        cleanNote: 'Clean copy: accord and amicable are used correctly; no error here.',
      },
      {
        text: 'Every peace of evidence pointed to the same conclusion.',
        errors: [{ wrong: 'peace', fix: 'piece', note: 'A piece is a portion; peace is calm or the absence of war.' }],
      },
    ],
  },
  {
    num: 20,
    quizId: 'stet-8-5-26',
    live: '2026-08-05',
    dateLabel: 'August 5, 2026',
    sunday: false,
    items: [
      {
        text: 'The caterer forgot the desert, so the banquet ended without cake.',
        errors: [{ wrong: 'desert', fix: 'dessert', note: 'Dessert is the sweet course; a desert is an arid land.' }],
      },
      {
        text: 'The report called it a miner setback that would not delay the launch.',
        errors: [{ wrong: 'miner', fix: 'minor', note: 'Minor means small; a miner digs for coal or ore.' }],
      },
      {
        text: 'In years passed the festival drew crowds from across the county.',
        errors: [{ wrong: 'passed', fix: 'past', note: 'Past refers to earlier time; passed is the verb, as in time passed.' }],
      },
      {
        text: 'The understudy stepped into the leading roll on opening night.',
        errors: [{ wrong: 'roll', fix: 'role', note: 'A role is a part played; a roll is a list or a small loaf.' }],
      },
      {
        text: "The auditor's thorough review reassured the nervous shareholders.",
        errors: [],
        cleanNote: 'Clean copy: thorough and reassured are spelled and used correctly.',
      },
    ],
  },
  {
    num: 21,
    quizId: 'stet-8-6-26',
    live: '2026-08-06',
    dateLabel: 'August 6, 2026',
    sunday: false,
    items: [
      {
        text: 'They took a short brake before the second session began.',
        errors: [{ wrong: 'brake', fix: 'break', note: 'A break is a pause; a brake stops a vehicle.' }],
      },
      {
        text: 'The pilot guided the plain smoothly onto the rain-slicked runway.',
        errors: [{ wrong: 'plain', fix: 'plane', note: 'A plane is an aircraft; plain means simple or a flat expanse.' }],
      },
      {
        text: 'Critics hailed the novelist as a profit of the digital age.',
        errors: [{ wrong: 'profit', fix: 'prophet', note: 'A prophet foretells the future; profit is financial gain.' }],
      },
      {
        text: 'She gave the intruder a long, cold stair.',
        errors: [{ wrong: 'stair', fix: 'stare', note: 'To stare is to gaze; a stair is a step in a staircase.' }],
      },
      {
        text: 'The panel debated weather to publish the findings early.',
        errors: [{ wrong: 'weather', fix: 'whether', note: 'Whether introduces a choice; weather is the state of the atmosphere.' }],
      },
    ],
  },
  {
    num: 22,
    quizId: 'stet-8-7-26',
    live: '2026-08-07',
    dateLabel: 'August 7, 2026',
    sunday: false,
    items: [
      {
        text: 'The tenants left there keys at the front desk overnight.',
        errors: [{ wrong: 'there', fix: 'their', note: 'Their shows possession; there refers to a place.' }],
      },
      {
        text: 'The board voted to censor the official for missing three hearings.',
        errors: [{ wrong: 'censor', fix: 'censure', note: 'To censure is to formally rebuke; to censor is to suppress content.' }],
      },
      {
        text: 'The author thanked her editor in the forward to the new edition.',
        errors: [{ wrong: 'forward', fix: 'foreword', note: 'A foreword opens a book; forward means ahead or to send on.' }],
      },
      {
        text: "The committee's recommendation was unanimous and remarkably concise.",
        errors: [],
        cleanNote: 'Clean copy: unanimous and concise are correct; nothing to change here.',
      },
      {
        text: "The magician's final allusion left the audience gasping.",
        errors: [{ wrong: 'allusion', fix: 'illusion', note: 'An illusion is a false impression; an allusion is an indirect reference.' }],
      },
    ],
  },
  {
    num: 23,
    quizId: 'stet-8-8-26',
    live: '2026-08-08',
    dateLabel: 'August 8, 2026',
    sunday: false,
    items: [
      {
        text: 'Forecasters warned that a storm was eminent along the coast.',
        errors: [{ wrong: 'eminent', fix: 'imminent', note: 'Imminent means about to happen; eminent means distinguished.' }],
      },
      {
        text: 'The critic argued the novel belongs in the literary cannon.',
        errors: [{ wrong: 'cannon', fix: 'canon', note: 'A canon is an accepted body of works; a cannon is a heavy gun.' }],
      },
      {
        text: 'Fans treated the aging quarterback as a national idle.',
        errors: [{ wrong: 'idle', fix: 'idol', note: 'An idol is an object of devotion; idle means inactive.' }],
      },
      {
        text: 'Officials accused the vendor of trying to pedal counterfeit tickets.',
        errors: [{ wrong: 'pedal', fix: 'peddle', note: 'To peddle is to sell wares; a pedal is a foot lever.' }],
      },
      {
        text: 'Villagers longed to throw off the yolk of foreign rule.',
        errors: [{ wrong: 'yolk', fix: 'yoke', note: 'A yoke is a harness or burden; a yolk is the yellow of an egg.' }],
      },
    ],
  },
  {
    num: 24,
    quizId: 'stet-8-9-26',
    live: '2026-08-09',
    dateLabel: 'August 9, 2026',
    sunday: true,
    items: [
      {
        text: 'He poured his sole into the performance, moving the hole audience to tears.',
        errors: [
          { wrong: 'sole', fix: 'soul', note: 'The soul is the spirit; a sole is a fish or the bottom of a foot.' },
          { wrong: 'hole', fix: 'whole', note: 'Whole means entire; a hole is an opening.' },
        ],
      },
      {
        text: 'The exhibit was vary popular with younger visitors.',
        errors: [{ wrong: 'vary', fix: 'very', note: 'Very is an intensifier; to vary is to differ or change.' }],
      },
      {
        text: 'She new the shortcut and led us threw the alley to the stage door.',
        errors: [
          { wrong: 'new', fix: 'knew', note: 'Knew is the past tense of know; new means recent.' },
          { wrong: 'threw', fix: 'through', note: 'Through means in one side and out the other; threw is the past tense of throw.' },
        ],
      },
      {
        text: 'The heirs gathered at the family manner for the reading of the will.',
        errors: [{ wrong: 'manner', fix: 'manor', note: 'A manor is a large country house; manner means a way of doing something.' }],
      },
      {
        text: "The editor praised the reporter's diligent, well-sourced coverage.",
        errors: [],
        cleanNote: 'Clean copy: diligent and well-sourced are correct; nothing needs fixing.',
      },
      {
        text: 'The hawk began to pray on the field mice, and farmers hated to waist a single trap.',
        errors: [
          { wrong: 'pray', fix: 'prey', note: 'Prey is a hunted animal; to pray is to worship or plead.' },
          { wrong: 'waist', fix: 'waste', note: 'To waste is to squander; the waist is the midsection of the body.' },
        ],
      },
      {
        text: 'The tutor turned each mistake into a lasting lessen.',
        errors: [{ wrong: 'lessen', fix: 'lesson', note: 'A lesson is something learned; to lessen is to reduce.' }],
      },
    ],
  },
  {
    num: 25,
    quizId: 'stet-8-10-26',
    live: '2026-08-10',
    dateLabel: 'August 10, 2026',
    sunday: false,
    items: [
      {
        text: 'She pressed a dried flour between the pages of the atlas.',
        errors: [{ wrong: 'flour', fix: 'flower', note: 'A flower blossoms; flour is ground grain for baking.' }],
      },
      {
        text: 'After the rally his voice was horse and barely audible.',
        errors: [{ wrong: 'horse', fix: 'hoarse', note: 'Hoarse means rough or raspy of voice; a horse is the animal.' }],
      },
      {
        text: 'Her essay offered real incite into the crisis.',
        errors: [{ wrong: 'incite', fix: 'insight', note: 'Insight is deep understanding; to incite is to stir up.' }],
      },
      {
        text: 'The startup revenue grew steadily despite the crowded market.',
        errors: [],
        cleanNote: 'Clean copy: steadily and crowded are used correctly; no change needed.',
      },
      {
        text: "The school's principle addressed the assembly about the new schedule.",
        errors: [{ wrong: 'principle', fix: 'principal', note: 'A principal leads a school; a principle is a rule or belief.' }],
      },
    ],
  },
  {
    num: 26,
    quizId: 'stet-8-11-26',
    live: '2026-08-11',
    dateLabel: 'August 11, 2026',
    sunday: false,
    items: [
      {
        text: "The engineer said the beam had began to sag under the load.",
        errors: [{ wrong: "began", fix: "begun", kind: 'grammar', note: "After had the verb takes begun, not began." }],
      },
      {
        text: "The council voted to rescind the by-law after a long hearing.",
        errors: [],
        cleanNote: "Clean copy: rescind and by-law are both correct here.",
      },
      {
        text: "The developer applied to raise the old mill and build flats.",
        errors: [{ wrong: "raise", fix: "raze", kind: 'wordchoice', note: "To raze is to demolish; to raise is to lift up." }],
      },
      {
        text: "The mayor promised to allay fears about the new levee.",
        errors: [],
        cleanNote: "Clean copy: allay and levee are the right words, odd as levee looks.",
      },
      {
        text: "The farmer sells his produce at the weekly bizarre.",
        errors: [{ wrong: "bizarre", fix: "bazaar", kind: 'wordchoice', note: "A bazaar is a market; bizarre means strange." }],
      },
    ],
  },
  {
    num: 27,
    quizId: 'stet-8-12-26',
    live: '2026-08-12',
    dateLabel: 'August 12, 2026',
    sunday: false,
    items: [
      {
        text: "The porter admitted he had drank nothing since the early shift.",
        errors: [{ wrong: "drank", fix: "drunk", kind: 'grammar', note: "After had the verb takes drunk, not drank." }],
      },
      {
        text: "Residents complained about the sheer volume of freight passing through.",
        errors: [],
        cleanNote: "Clean copy: sheer means utter here, and it is spelled correctly.",
      },
      {
        text: "A stray dog was found wandering the mote at the castle.",
        errors: [{ wrong: "mote", fix: "moat", kind: 'wordchoice', note: "A moat is a defensive ditch; a mote is a speck of dust." }],
      },
      {
        text: "The inspector said the wiring posed a serious fire hazard.",
        errors: [],
        cleanNote: "Clean copy: posed and hazard are used correctly throughout.",
      },
      {
        text: "The tenor sang the aria with remarkable pour.",
        errors: [{ wrong: "pour", fix: "poise", kind: 'wordchoice', note: "Poise is composure; to pour is to tip a liquid out." }],
      },
    ],
  },
  {
    num: 28,
    quizId: 'stet-8-13-26',
    live: '2026-08-13',
    dateLabel: 'August 13, 2026',
    sunday: false,
    items: [
      {
        text: "The captain reported the hull had took on water overnight.",
        errors: [{ wrong: "took", fix: "taken", kind: 'grammar', note: "After had the verb takes taken, not took." }],
      },
      {
        text: "She was granted a reprieve on the eve of the deadline.",
        errors: [],
        cleanNote: "Clean copy: reprieve is the right word and correctly spelled.",
      },
      {
        text: "The estate agent described the flat as a real steel.",
        errors: [{ wrong: "steel", fix: "steal", kind: 'wordchoice', note: "A steal is a bargain; steel is the metal." }],
      },
      {
        text: "The county surveyor measured the site before the works began.",
        errors: [],
        cleanNote: "Clean copy: surveyor and works are both correct as written.",
      },
      {
        text: "The band played a taught, disciplined set.",
        errors: [{ wrong: "taught", fix: "taut", kind: 'wordchoice', note: "Taut means tight and controlled; taught is the past of teach." }],
      },
    ],
  },
  {
    num: 29,
    quizId: 'stet-8-14-26',
    live: '2026-08-14',
    dateLabel: 'August 14, 2026',
    sunday: false,
    items: [
      {
        text: "The tenant complained the boiler had blew a fuse again.",
        errors: [{ wrong: "blew", fix: "blown", kind: 'grammar', note: "After had the verb takes blown, not blew." }],
      },
      {
        text: "He accepted the award with genuine humility.",
        errors: [],
        cleanNote: "Clean copy: accepted is right here, and humility is spelled correctly.",
      },
      {
        text: "The old barn was sold with its timbre roof intact.",
        errors: [{ wrong: "timbre", fix: "timber", kind: 'wordchoice', note: "Timber is wood; timbre is the character of a sound." }],
      },
      {
        text: "The gallery will exhibit the bequest in the autumn.",
        errors: [],
        cleanNote: "Clean copy: exhibit and bequest are both used correctly.",
      },
      {
        text: "The cyclist was fined for riding on the pavement.",
        errors: [],
        cleanNote: "Clean copy: fined is the right word, and the rest of the sentence stands as written.",
      },
    ],
  },
  {
    num: 30,
    quizId: 'stet-8-15-26',
    live: '2026-08-15',
    dateLabel: 'August 15, 2026',
    sunday: false,
    items: [
      {
        text: "The gardener said the frost had did real damage to the espaliers.",
        errors: [{ wrong: "did", fix: "done", kind: 'grammar', note: "After had the verb takes done, not did." }],
      },
      {
        text: "Officers found the vault door had been forced with a crowbar overnight.",
        errors: [],
        cleanNote: "Clean copy: forced is the right verb for a broken lock.",
      },
      {
        text: "The captain gave the order to way anchor at first light.",
        errors: [{ wrong: "way", fix: "weigh", kind: 'wordchoice', note: "To weigh anchor is to raise it; way is a route." }],
      },
      {
        text: "Ministers agreed to waive the fee for small charities.",
        errors: [],
        cleanNote: "Clean copy: waive means to give up a right, exactly as used.",
      },
      {
        text: "The tenant was asked to vacate the premise by Friday.",
        errors: [{ wrong: "premise", fix: "premises", kind: 'wordchoice', note: "Premises means the building; a premise is a proposition." }],
      },
    ],
  },
  {
    num: 31,
    quizId: 'stet-8-16-26',
    live: '2026-08-16',
    dateLabel: 'August 16, 2026',
    sunday: true,
    items: [
      {
        text: "The pipes had froze solid by the second morning of the cold snap.",
        errors: [{ wrong: "froze", fix: "frozen", kind: 'grammar', note: "After had the verb takes frozen, not froze." }],
      },
      {
        text: "The parade passed the stand in marshal order.",
        errors: [{ wrong: "marshal", fix: "martial", kind: 'wordchoice', note: "Martial means military; a marshal is an officer." }],
      },
      {
        text: "Heavy rain delayed the harvest across the eastern counties.",
        errors: [],
        cleanNote: "Clean copy: delayed and harvest are correct as written.",
      },
      {
        text: "The hikers were warned to keep of the loose scree.",
        errors: [{ wrong: "of", fix: "off", kind: 'wordchoice', note: "Off means away from; of is a possessive preposition." }],
      },
      {
        text: "The developer promised to kerb the costs on the second phase.",
        errors: [{ wrong: "kerb", fix: "curb", alts: ["check"], kind: 'wordchoice', note: "To curb is to hold back; a kerb is the stone edge of a pavement." }],
      },
      {
        text: "The bridge was closed after engineers found a hairline fracture.",
        errors: [],
        cleanNote: "Clean copy: hairline fracture is the right term for the crack.",
      },
      {
        text: "The bidder withdrew after the reserve was reveiled.",
        errors: [{ wrong: "reveiled", fix: "revealed", kind: 'spelling', note: "Revealed is the correct spelling; reveiled is not a word." }],
      },
    ],
  },
  {
    num: 32,
    quizId: 'stet-8-17-26',
    live: '2026-08-17',
    dateLabel: 'August 17, 2026',
    sunday: false,
    items: [
      {
        text: "The lay brothers had ate in silence since the founding.",
        errors: [{ wrong: "ate", fix: "eaten", kind: 'grammar', note: "After had the verb takes eaten, not ate." }],
      },
      {
        text: "The lifeboat crew launched within four minutes of the call.",
        errors: [],
        cleanNote: "Clean copy: launched and crew are used correctly here.",
      },
      {
        text: "The auctioneer noted a sliver of vernier missing from the case.",
        errors: [{ wrong: "vernier", fix: "veneer", kind: 'wordchoice', note: "Veneer is a thin surface layer; a vernier is a measuring scale." }],
      },
      {
        text: "Snow fell steadily through the night on the high fells.",
        errors: [],
        cleanNote: "Clean copy: fells is the correct northern word for the hills.",
      },
      {
        text: "The judge called the delay completely unexcusable.",
        errors: [{ wrong: "unexcusable", fix: "inexcusable", kind: 'wordchoice', note: "Inexcusable is the word; unexcusable is not English." }],
      },
    ],
  },
  {
    num: 33,
    quizId: 'stet-8-18-26',
    live: '2026-08-18',
    dateLabel: 'August 18, 2026',
    sunday: false,
    items: [
      {
        text: "The choir had sang the same anthem at every installation.",
        errors: [{ wrong: "sang", fix: "sung", kind: 'grammar', note: "After had the verb takes sung, not sang." }],
      },
      {
        text: "The chef reduced the sauce until it began to thicken.",
        errors: [],
        cleanNote: "Clean copy: reduced is the correct culinary term here.",
      },
      {
        text: "The applicant was asked to precise his claim in writing.",
        errors: [{ wrong: "precise", fix: "precis", alts: ["précis", "specify", "clarify", "state", "detail", "summarise", "summarize"], kind: 'wordchoice', note: "Precis, to summarise, is the verb; precise is an adjective." }],
      },
      {
        text: "The archive holds letters from every decade of the last century.",
        errors: [],
        cleanNote: "Clean copy: archive and decade are correct as written.",
      },
      {
        text: "The tenor's voice carried to the nave without ampliation.",
        errors: [{ wrong: "ampliation", fix: "amplification", kind: 'wordchoice', note: "Amplification is sound reinforcement; ampliation means enlargement in law." }],
      },
    ],
  },
  {
    num: 34,
    quizId: 'stet-8-19-26',
    live: '2026-08-19',
    dateLabel: 'August 19, 2026',
    sunday: false,
    items: [
      {
        text: "The swimmer had swam the channel twice before that summer.",
        errors: [{ wrong: "swam", fix: "swum", kind: 'grammar', note: "After had the verb takes swum, not swam." }],
      },
      {
        text: "The minister refused to be drawn on the leaked memo.",
        errors: [],
        cleanNote: "Clean copy: drawn is idiomatic and correct in this sense.",
      },
      {
        text: "The porter found the seal on the parcel was brocken.",
        errors: [{ wrong: "brocken", fix: "broken", kind: 'spelling', note: "Broken is the correct spelling; Brocken is a German peak." }],
      },
      {
        text: "The scheme was designed to complement the existing service.",
        errors: [],
        cleanNote: "Clean copy: complement means to complete, which is what is meant.",
      },
      {
        text: "The choir processed down the isle in full vestments.",
        errors: [{ wrong: "isle", fix: "aisle", kind: 'wordchoice', note: "An aisle is the passage between the pews; an isle is an island." }],
      },
    ],
  },
  {
    num: 35,
    quizId: 'stet-8-20-26',
    live: '2026-08-20',
    dateLabel: 'August 20, 2026',
    sunday: false,
    items: [
      {
        text: "The ringers had rang a full peal on the coronation morning.",
        errors: [{ wrong: "rang", fix: "rung", kind: 'grammar', note: "After had the verb takes rung, not rang." }],
      },
      {
        text: "The auditors examined every invoice from the last quarter.",
        errors: [],
        cleanNote: "Clean copy: auditors and invoice are used correctly.",
      },
      {
        text: "The porter carried the trunk up four flights without pause for breathe.",
        errors: [{ wrong: "breathe", fix: "breath", kind: 'wordchoice', note: "Breath is the noun; breathe is the verb." }],
      },
      {
        text: "The letter was addressed to the executor of the estate.",
        errors: [],
        cleanNote: "Clean copy: executor is the correct legal term here.",
      },
      {
        text: "The lecturer said the argument was entirely fatuitous.",
        errors: [{ wrong: "fatuitous", fix: "fatuous", kind: 'spelling', note: "Fatuous means silly; fatuitous is not a word." }],
      },
    ],
  },
  {
    num: 36,
    quizId: 'stet-8-21-26',
    live: '2026-08-21',
    dateLabel: 'August 21, 2026',
    sunday: false,
    items: [
      {
        text: "The river had rose four feet by the time the sirens went.",
        errors: [{ wrong: "rose", fix: "risen", kind: 'grammar', note: "After had the verb takes risen, not rose." }],
      },
      {
        text: "The society was founded to preserve the old drove roads.",
        errors: [],
        cleanNote: "Clean copy: drove roads is the correct historical term.",
      },
      {
        text: "The surveyor found the wall was badly out of plum.",
        errors: [{ wrong: "plum", fix: "plumb", kind: 'wordchoice', note: "Plumb means vertical; a plum is a fruit." }],
      },
      {
        text: "Inspectors praised the school's pastoral care.",
        errors: [],
        cleanNote: "Clean copy: pastoral care is standard usage in schools.",
      },
      {
        text: "The clerk read the notice allowed to the meeting.",
        errors: [{ wrong: "allowed", fix: "aloud", kind: 'wordchoice', note: "Aloud means out loud; allowed means permitted." }],
      },
    ],
  },
  {
    num: 37,
    quizId: 'stet-8-22-26',
    live: '2026-08-22',
    dateLabel: 'August 22, 2026',
    sunday: false,
    items: [
      {
        text: "The timbers had shrank in the long dry spell.",
        errors: [{ wrong: "shrank", fix: "shrunk", kind: 'grammar', note: "After had the verb takes shrunk, not shrank." }],
      },
      {
        text: "He was hoping to home in on the source of the leak.",
        errors: [],
        cleanNote: "Clean copy: home in is correct; hone in is the common error.",
      },
      {
        text: "The lense floated on mercury, reducing friction to almost nothing.",
        errors: [{ wrong: "lense", fix: "lens", kind: 'spelling', note: "Lens is the correct spelling; lense is a common misspelling of it." }],
      },
      {
        text: "The trust appealed for volunteers to man the phone lines.",
        errors: [],
        cleanNote: "Clean copy: man the lines is idiomatic and correctly used.",
      },
      {
        text: "The precinct wall was breeched during the dissolution.",
        errors: [{ wrong: "breeched", fix: "breached", kind: 'wordchoice', note: "To breach is to break through; breeches are trousers." }],
      },
    ],
  },
  {
    num: 38,
    quizId: 'stet-8-23-26',
    live: '2026-08-23',
    dateLabel: 'August 23, 2026',
    sunday: true,
    items: [
      {
        text: "The barge had sank in shallow water off the staithe.",
        errors: [{ wrong: "sank", fix: "sunk", kind: 'grammar', note: "After had the verb takes sunk, not sank." }],
      },
      {
        text: "The clerk complained of a cramped and illegable script.",
        errors: [{ wrong: "illegable", fix: "illegible", kind: 'spelling', note: "Illegible is the correct spelling for unreadable writing." }],
      },
      {
        text: "The trawler returned to port with a full hold.",
        errors: [],
        cleanNote: "Clean copy: hold is the right word for a ship's cargo space.",
      },
      {
        text: "The inquest censured the deputy for a lax inspection regiment.",
        errors: [{ wrong: "regiment", fix: "regime", kind: 'wordchoice', note: "A regime is a system; a regiment is a military unit." }],
      },
      {
        text: "The basin silted up, unnoticed accept by the herons.",
        errors: [{ wrong: "accept", fix: "except", kind: 'wordchoice', note: "Except means apart from; to accept is to receive." }],
      },
      {
        text: "The lecture drew a capacity crowd to the old hall.",
        errors: [],
        cleanNote: "Clean copy: capacity crowd is standard and correct.",
      },
      {
        text: "The company blamed an act of God rather than the affect of pumping.",
        errors: [{ wrong: "affect", fix: "effect", kind: 'wordchoice', note: "The effect is the result; to affect is to influence." }],
      },
    ],
  },
  {
    num: 39,
    quizId: 'stet-8-24-26',
    live: '2026-08-24',
    dateLabel: 'August 24, 2026',
    sunday: false,
    items: [
      {
        text: "The curate had wrote to the bishop twice that winter.",
        errors: [{ wrong: "wrote", fix: "written", kind: 'grammar', note: "After had the verb takes written, not wrote." }],
      },
      {
        text: "The report was full of vague allusions to a second site.",
        errors: [],
        cleanNote: "Clean copy: allusions means indirect references, which fits.",
      },
      {
        text: "The apprentice was always maid to clear the wheel pit.",
        errors: [{ wrong: "maid", fix: "made", kind: 'wordchoice', note: "Made is the past of make; a maid is a servant." }],
      },
      {
        text: "The vet said the mare had made a full recovery.",
        errors: [],
        cleanNote: "Clean copy: mare and recovery are both correct here.",
      },
      {
        text: "The warden described the cliff path as quite treacherous in wet weather, and advised walkers to where boots.",
        errors: [{ wrong: "where", fix: "wear", kind: 'wordchoice', note: "To wear is to have on; where asks about place." }],
      },
    ],
  },
  {
    num: 40,
    quizId: 'stet-8-25-26',
    live: '2026-08-25',
    dateLabel: 'August 25, 2026',
    sunday: false,
    items: [
      {
        text: "The witness had spoke to officers before the inquest opened.",
        errors: [{ wrong: "spoke", fix: "spoken", kind: 'grammar', note: "After had the verb takes spoken, not spoke." }],
      },
      {
        text: "The exhibition traces the rise of the cotton trade.",
        errors: [],
        cleanNote: "Clean copy: traces is the right verb for a historical survey.",
      },
      {
        text: "The clerk noted the meeting was adjourned sign die.",
        errors: [{ wrong: "sign", fix: "sine", kind: 'wordchoice', note: "The Latin is sine die, meaning without a day fixed." }],
      },
      {
        text: "The candidate made a passionate plea for calm.",
        errors: [],
        cleanNote: "Clean copy: plea is correct; the homophone please is not needed.",
      },
      {
        text: "The society bought the plot to prevent it being built upon by a spectator developer.",
        errors: [{ wrong: "spectator", fix: "speculative", kind: 'wordchoice', note: "Speculative means done on a gamble; a spectator watches." }],
      },
    ],
  },
  {
    num: 41,
    quizId: 'stet-8-26-26',
    live: '2026-08-26',
    dateLabel: 'August 26, 2026',
    sunday: false,
    items: [
      {
        text: "The warden had saw the vessel drifting an hour earlier.",
        errors: [{ wrong: "saw", fix: "seen", kind: 'grammar', note: "After had the verb takes seen, not saw." }],
      },
      {
        text: "Divers surveyed the wreck at a depth of forty metres.",
        errors: [],
        cleanNote: "Clean copy: surveyed and depth are used correctly.",
      },
      {
        text: "The vicar read the lesson from the leggern at the crossing.",
        errors: [{ wrong: "leggern", fix: "lectern", kind: 'spelling', note: "A lectern is a reading stand; leggern is not a word." }],
      },
      {
        text: "The village pump has not drawn water since 1974.",
        errors: [],
        cleanNote: "Clean copy: drawn is the correct participle after has.",
      },
      {
        text: "The mason repaired the quoins with a lime morter.",
        errors: [{ wrong: "morter", fix: "mortar", kind: 'spelling', note: "Mortar is the correct spelling for the binding mix." }],
      },
    ],
  },
  {
    num: 42,
    quizId: 'stet-8-27-26',
    live: '2026-08-27',
    dateLabel: 'August 27, 2026',
    sunday: false,
    items: [
      {
        text: "The relief crew had came ashore before the gale.",
        errors: [{ wrong: "came", fix: "come", kind: 'grammar', note: "After had the verb takes come, not came." }],
      },
      {
        text: "The choir sang unaccompanied in the north aisle.",
        errors: [],
        cleanNote: "Clean copy: aisle is correctly spelled, and unaccompanied fits.",
      },
      {
        text: "The gardener said the yew hedge needed a hard prune to reinvigerate it.",
        errors: [{ wrong: "reinvigerate", fix: "reinvigorate", kind: 'spelling', note: "Reinvigorate is the correct spelling." }],
      },
      {
        text: "The bakery has traded on the same corner since 1908.",
        errors: [],
        cleanNote: "Clean copy: traded and corner are used correctly.",
      },
      {
        text: "The barn owl quartered the meadow at dusk, silent as a wraith, hunting voles among the tussuck grass.",
        errors: [{ wrong: "tussuck", fix: "tussock", kind: 'spelling', note: "Tussock is the correct spelling for a clump of grass." }],
      },
    ],
  },
  {
    num: 43,
    quizId: 'stet-8-28-26',
    live: '2026-08-28',
    dateLabel: 'August 28, 2026',
    sunday: false,
    items: [
      {
        text: "The trustees had gave notice of the sale in March.",
        errors: [{ wrong: "gave", fix: "given", kind: 'grammar', note: "After had the verb takes given, not gave." }],
      },
      {
        text: "Rescuers worked through the night to shore up the wall.",
        errors: [],
        cleanNote: "Clean copy: shore up is the correct idiom for propping something.",
      },
      {
        text: "The archivist wore cotton gloves to handle the vellum manuscripts, which were kept in a seller beneath the library.",
        errors: [{ wrong: "seller", fix: "cellar", kind: 'wordchoice', note: "A cellar is an underground room; a seller is someone who sells." }],
      },
      {
        text: "The tenant complained of a persistent draught under the door.",
        errors: [],
        cleanNote: "Clean copy: a draught is the current of air; a draft is a first version.",
      },
      {
        text: "The society restored the sundial and its knomon.",
        errors: [{ wrong: "knomon", fix: "gnomon", kind: 'spelling', note: "A gnomon is the pointer on a sundial; knomon is not a word." }],
      },
    ],
  },
  {
    num: 44,
    quizId: 'stet-8-29-26',
    live: '2026-08-29',
    dateLabel: 'August 29, 2026',
    sunday: false,
    items: [
      {
        text: "The foreman had knew about the fault for a fortnight.",
        errors: [{ wrong: "knew", fix: "known", kind: 'grammar', note: "After had the verb takes known, not knew." }],
      },
      {
        text: "The museum acquired the diary at a country sale.",
        errors: [],
        cleanNote: "Clean copy: acquired is exact and correctly spelled.",
      },
      {
        text: "The engineer measured the fall of the drain and said the surface water would never reach the mane.",
        errors: [{ wrong: "mane", fix: "main", kind: 'wordchoice', note: "The main is the sewer pipe the drain feeds; a mane is the hair on a horse's neck." }],
      },
      {
        text: "The magistrate imposed a suspended sentence.",
        errors: [],
        cleanNote: "Clean copy: suspended sentence is the correct legal phrase.",
      },
      {
        text: "The auctioneer described the chest as a fine example of marquetary.",
        errors: [{ wrong: "marquetary", fix: "marquetry", kind: 'spelling', note: "Marquetry is the correct spelling for inlaid woodwork." }],
      },
    ],
  },
  {
    num: 45,
    quizId: 'stet-8-30-26',
    live: '2026-08-30',
    dateLabel: 'August 30, 2026',
    sunday: true,
    items: [
      {
        text: "The storm had threw slates across the whole terrace.",
        errors: [{ wrong: "threw", fix: "thrown", kind: 'grammar', note: "After had the verb takes thrown, not threw." }],
      },
      {
        text: "The abbot's tomb bears a brass effigee worn smooth by pilgrims.",
        errors: [{ wrong: "effigee", fix: "effigy", kind: 'spelling', note: "Effigy is the correct spelling for a carved likeness." }],
      },
      {
        text: "The tide had turned before the boat cleared the bar.",
        errors: [],
        cleanNote: "Clean copy: bar is the correct word for a sandbank at a harbour mouth.",
      },
      {
        text: "The trust replaced the rotten bargeboards on the gable end and renewed the led flashing beneath.",
        errors: [{ wrong: "led", fix: "lead", kind: 'wordchoice', note: "Lead is the metal on the roof; led is the past tense of lead." }],
      },
      {
        text: "The parish paid a mason to repair the lychgate roof, where the beer once rested before a funeral.",
        errors: [{ wrong: "beer", fix: "bier", kind: 'wordchoice', note: "A bier is the stand a coffin rests on, which is what a lychgate shelters; beer is the drink." }],
      },
      {
        text: "The station master rang the bell twice before departure.",
        errors: [],
        cleanNote: "Clean copy: station master and departure are correct.",
      },
      {
        text: "The keeper locked a pod of dolphins passing the head at dusk.",
        errors: [{ wrong: "locked", fix: "logged", kind: 'wordchoice', note: "To log is to record; to lock is to fasten." }],
      },
    ],
  },
  {
    num: 46,
    quizId: 'stet-8-31-26',
    live: '2026-08-31',
    dateLabel: 'August 31, 2026',
    sunday: false,
    items: [
      {
        text: "The pilot had flew the route in worse weather than this.",
        errors: [{ wrong: "flew", fix: "flown", kind: 'grammar', note: "After had the verb takes flown, not flew." }],
      },
      {
        text: "Surveyors marked the boundary with cast-iron posts.",
        errors: [],
        cleanNote: "Clean copy: boundary and cast-iron are correctly used.",
      },
      {
        text: "The tenant left the cottage in a filthy state, and the agent found the flue completely choaked with soot.",
        errors: [{ wrong: "choaked", fix: "choked", kind: 'spelling', note: "Choked is the correct spelling; choaked is not a word." }],
      },
      {
        text: "The scheme will benefit those who are most vulnerable.",
        errors: [],
        cleanNote: "Clean copy: benefit and vulnerable are the right words here.",
      },
      {
        text: "The society published a memoire of the founder's early years.",
        errors: [{ wrong: "memoire", fix: "memoir", kind: 'spelling', note: "Memoir is the English spelling; memoire is French." }],
      },
    ],
  },
  {
    num: 47,
    quizId: 'stet-9-1-26',
    live: '2026-09-01',
    dateLabel: 'September 1, 2026',
    sunday: false,
    items: [
      {
        text: "The committee had chose the site before the survey arrived.",
        errors: [{ wrong: "chose", fix: "chosen", kind: 'grammar', note: "After had the verb takes chosen, not chose." }],
      },
      {
        text: "The orchard has produced fruit for over a century.",
        errors: [],
        cleanNote: "Clean copy: orchard and produced are used correctly.",
      },
      {
        text: "The stonemason worked the granite with a pitching tool and a bolstor.",
        errors: [{ wrong: "bolstor", fix: "bolster", kind: 'spelling', note: "A bolster is a broad chisel; bolstor is a misspelling." }],
      },
      {
        text: "The inquiry found no evidence of deliberate concealment.",
        errors: [],
        cleanNote: "Clean copy: concealment is the right noun and correctly spelled.",
      },
      {
        text: "The trustees asked whether the covenant was still enforcable.",
        errors: [{ wrong: "enforcable", fix: "enforceable", kind: 'wordchoice', note: "Enforceable keeps the e before able." }],
      },
    ],
  },
  {
    num: 48,
    quizId: 'stet-9-2-26',
    live: '2026-09-02',
    dateLabel: 'September 2, 2026',
    sunday: false,
    items: [
      {
        text: "The frost had broke the top course of brickwork.",
        errors: [{ wrong: "broke", fix: "broken", kind: 'grammar', note: "After had the verb takes broken, not broke." }],
      },
      {
        text: "The gallery mounted the canvas in a plain oak frame.",
        errors: [],
        cleanNote: "Clean copy: canvas is right here, since it means the cloth.",
      },
      {
        text: "The curator catalogued the coins as a hord of the late fourth century.",
        errors: [{ wrong: "hord", fix: "hoard", kind: 'spelling', note: "A hoard is a buried store; hord is not a word." }],
      },
      {
        text: "The union warned that morale had reached a new nadir.",
        errors: [],
        cleanNote: "Clean copy: morale and nadir are both correct as written.",
      },
      {
        text: "The engineer proposed a sluice to releive the pressure on the culvert.",
        errors: [{ wrong: "releive", fix: "relieve", kind: 'wordchoice', note: "Relieve follows the i before e rule after the l." }],
      },
    ],
  },
  {
    num: 49,
    quizId: 'stet-9-3-26',
    live: '2026-09-03',
    dateLabel: 'September 3, 2026',
    sunday: false,
    items: [
      {
        text: "The thieves had stole the lead from the chancel roof.",
        errors: [{ wrong: "stole", fix: "stolen", kind: 'grammar', note: "After had the verb takes stolen, not stole." }],
      },
      {
        text: "The lighthouse was automated in the early nineties.",
        errors: [],
        cleanNote: "Clean copy: automated is exact and correctly spelled.",
      },
      {
        text: "The vicar thanked the ringers for a quarter peal rung in memorium.",
        errors: [{ wrong: "memorium", fix: "memoriam", kind: 'wordchoice', note: "The Latin phrase is in memoriam." }],
      },
      {
        text: "The auctioneer withdrew the lot before bidding closed.",
        errors: [],
        cleanNote: "Clean copy: withdrew is the correct past tense of withdraw.",
      },
      {
        text: "The wall plate had rotted where the gutter had overflowed, and the damage had past unnoticed for years.",
        errors: [{ wrong: "past", fix: "passed", kind: 'wordchoice', note: "Passed is the verb; past means an earlier time or beyond." }],
      },
    ],
  },
  {
    num: 50,
    quizId: 'stet-9-4-26',
    live: '2026-09-04',
    dateLabel: 'September 4, 2026',
    sunday: false,
    items: [
      {
        text: "The ferryman had wore the same oilskin for thirty years.",
        errors: [{ wrong: "wore", fix: "worn", kind: 'grammar', note: "After had the verb takes worn, not wore." }],
      },
      {
        text: "The path skirts the reservoir for about a mile.",
        errors: [],
        cleanNote: "Clean copy: skirts and reservoir are used correctly.",
      },
      {
        text: "The society bought a set of chairs said to be Chippendale, though the provenence was thin.",
        errors: [{ wrong: "provenence", fix: "provenance", kind: 'spelling', note: "Provenance is the correct spelling for an object's history." }],
      },
      {
        text: "The forge has stood beside the ford since Tudor times.",
        errors: [],
        cleanNote: "Clean copy: forge and ford are the right words here.",
      },
      {
        text: "The farmer drained the low meadow with a herringbone of clay tiles, and the field was dry within a weak.",
        errors: [{ wrong: "weak", fix: "week", kind: 'wordchoice', note: "A week is seven days; weak means lacking strength." }],
      },
    ],
  },
  {
    num: 51,
    quizId: 'stet-9-5-26',
    live: '2026-09-05',
    dateLabel: 'September 5, 2026',
    sunday: false,
    items: [
      {
        text: "The gale had tore the sail clean from the yard.",
        errors: [{ wrong: "tore", fix: "torn", kind: 'grammar', note: "After had the verb takes torn, not tore." }],
      },
      {
        text: "The bursar reconciled the accounts on the last day of term.",
        errors: [],
        cleanNote: "Clean copy: bursar and reconciled are correct as written.",
      },
      {
        text: "The organist complained the bellows leaked and the wind pressure was iregular.",
        errors: [{ wrong: "iregular", fix: "irregular", kind: 'wordchoice', note: "Irregular doubles the r after the prefix." }],
      },
      {
        text: "Officials denied that the decision had been made in advance.",
        errors: [],
        cleanNote: "Clean copy: denied and in advance are used correctly.",
      },
      {
        text: "The society keeps the founder's papers in a fireproof safe, and only the archivist has excess to it.",
        errors: [{ wrong: "excess", fix: "access", kind: 'wordchoice', note: "Access is the right of entry; excess means too much of something." }],
      },
    ],
  },
  {
    num: 52,
    quizId: 'stet-9-6-26',
    live: '2026-09-06',
    dateLabel: 'September 6, 2026',
    sunday: true,
    items: [
      {
        text: "The carrier had drove the same lane since the war.",
        errors: [{ wrong: "drove", fix: "driven", kind: 'grammar', note: "After had the verb takes driven, not drove." }],
      },
      {
        text: "The warden reported a heard of deer on the golf links at dawn.",
        errors: [{ wrong: "heard", fix: "herd", kind: 'wordchoice', note: "A herd is a group of animals; heard is the past of hear." }],
      },
      {
        text: "The abbey ruins are managed by a small charitable trust.",
        errors: [],
        cleanNote: "Clean copy: ruins and charitable are correct as written.",
      },
      {
        text: "The chandler sold rope, tar and canvas to the whole quayside, and knew the drought of every vessel that called there.",
        errors: [{ wrong: "drought", fix: "draught", alts: ["draft"], kind: 'wordchoice', note: "The draught is how deep a vessel sits in the water; a drought is a long dry spell." }],
      },
      {
        text: "The bell ringers practised a method called Grandsire Triples every Tuesday, and the tower captain kept a peel book.",
        errors: [{ wrong: "peel", fix: "peal", kind: 'wordchoice', note: "A peal is a run of bell changes; to peel is to strip." }],
      },
      {
        text: "Wardens counted seals hauled out on the sandbank.",
        errors: [],
        cleanNote: "Clean copy: hauled out is the correct term for seals on shore.",
      },
      {
        text: "The gamekeeper found a snair set in the plantation.",
        errors: [{ wrong: "snair", fix: "snare", kind: 'spelling', note: "A snare is a wire trap; snair is not a word." }],
      },
    ],
  },
  {
    num: 53,
    quizId: 'stet-9-7-26',
    live: '2026-09-07',
    dateLabel: 'September 7, 2026',
    sunday: false,
    items: [
      {
        text: "The postmistress had rode to the outlying farms by pony.",
        errors: [{ wrong: "rode", fix: "ridden", kind: 'grammar', note: "After had the verb takes ridden, not rode." }],
      },
      {
        text: "The paper printed a full retraction the following week.",
        errors: [],
        cleanNote: "Clean copy: retraction is the right word for a printed correction.",
      },
      {
        text: "The trust asked walkers to keep dogs on a lead near the ewes and to stay on the bridal path.",
        errors: [{ wrong: "bridal", fix: "bridle", kind: 'wordchoice', note: "A bridle path is the one horses and walkers share; bridal belongs to a wedding." }],
      },
      {
        text: "The estate has kept the same tenant farmers for decades.",
        errors: [],
        cleanNote: "Clean copy: tenant is correct here, since it means a renter.",
      },
      {
        text: "The auctioneer knocked the lot down to a telephone bider.",
        errors: [{ wrong: "bider", fix: "bidder", kind: 'spelling', note: "A bidder makes an offer; bider is not a word." }],
      },
    ],
  },
  {
    num: 54,
    quizId: 'stet-9-8-26',
    live: '2026-09-08',
    dateLabel: 'September 8, 2026',
    sunday: false,
    items: [
      {
        text: "The smugglers had hid the casks beneath the stable floor.",
        errors: [{ wrong: "hid", fix: "hidden", kind: 'grammar', note: "After had the verb takes hidden, not hid." }],
      },
      {
        text: "The society restored the organ pipe by pipe.",
        errors: [],
        cleanNote: "Clean copy: restored and pipe by pipe are used correctly.",
      },
      {
        text: "The keeper set a line of lobster creels along the reef and marked each string with a boy.",
        errors: [{ wrong: "boy", fix: "buoy", kind: 'wordchoice', note: "A buoy is the float that marks the gear; a boy is a child." }],
      },
      {
        text: "He gave a candid account of the night's events.",
        errors: [],
        cleanNote: "Clean copy: candid is the right word and correctly spelled.",
      },
      {
        text: "The blacksmith drew the bar down on the anvil's beek.",
        errors: [{ wrong: "beek", fix: "beak", kind: 'wordchoice', note: "The beak is the pointed horn of an anvil." }],
      },
    ],
  },
  {
    num: 55,
    quizId: 'stet-9-9-26',
    live: '2026-09-09',
    dateLabel: 'September 9, 2026',
    sunday: false,
    items: [
      {
        text: "The sheepdog had bit the auctioneer during the sale.",
        errors: [{ wrong: "bit", fix: "bitten", kind: 'grammar', note: "After had the verb takes bitten, not bit." }],
      },
      {
        text: "The ferry runs hourly from the slipway in summer.",
        errors: [],
        cleanNote: "Clean copy: slipway is the right word and correctly spelled.",
      },
      {
        text: "The society traced the family through the parish regesters.",
        errors: [{ wrong: "regesters", fix: "registers", kind: 'spelling', note: "Registers is the correct spelling for parish record books." }],
      },
      {
        text: "The flock of geese was grazing on the winter wheat.",
        errors: [],
        cleanNote: "Clean copy: a flock takes a singular verb, so was is right.",
      },
      {
        text: "The tenant said the chimney had not been swept in living memory, and the flu was blocked with jackdaw nests.",
        errors: [{ wrong: "flu", fix: "flue", kind: 'wordchoice', note: "A flue is a chimney passage; flu is the illness." }],
      },
    ],
  },
  {
    num: 56,
    quizId: 'stet-9-10-26',
    live: '2026-09-10',
    dateLabel: 'September 10, 2026',
    sunday: false,
    items: [
      {
        text: "The bishop consecrated the new chapel in June.",
        errors: [],
        cleanNote: "Clean copy: consecrated is exact and correctly spelled.",
      },
      {
        text: "The bursar found the accounts did not tally, being out by a considerable some.",
        errors: [{ wrong: "some", fix: "sum", kind: 'wordchoice', note: "A sum is an amount of money; some means a few." }],
      },
      {
        text: "The mason cut a drip mould to through water clear of the wall face.",
        errors: [{ wrong: "through", fix: "throw", kind: 'wordchoice', note: "To throw water clear is the sense here; through means passing inside." }],
      },
      {
        text: "The scaffolding had fell before the inspector arrived.",
        errors: [{ wrong: "fell", fix: "fallen", kind: 'grammar', note: "After had the verb takes fallen, not fell." }],
      },
      {
        text: "The tenant claimed the landlord had reneged on the deal.",
        errors: [],
        cleanNote: "Clean copy: reneged is the right verb and correctly spelled.",
      },
    ],
  },
  {
    num: 57,
    quizId: 'stet-9-11-26',
    live: '2026-09-11',
    dateLabel: 'September 11, 2026',
    sunday: false,
    items: [
      {
        text: "The verger had forgot to wind the tower clock.",
        errors: [{ wrong: "forgot", fix: "forgotten", kind: 'grammar', note: "After had the verb takes forgotten, not forgot." }],
      },
      {
        text: "The quarry closed in 1962 and has since flooded.",
        errors: [],
        cleanNote: "Clean copy: quarry and flooded are used correctly.",
      },
      {
        text: "The society photographed every headstone before the clearance, though the ewe shading the oldest plot had to be cut back.",
        errors: [{ wrong: "ewe", fix: "yew", kind: 'wordchoice', note: "A yew is the churchyard tree that can be cut back; a ewe is a female sheep." }],
      },
      {
        text: "The tribunal ordered the firm to reinstate the worker.",
        errors: [],
        cleanNote: "Clean copy: reinstate is the correct legal term here.",
      },
      {
        text: "The ferry was held at the quay by a strong ebb and a foul birth.",
        errors: [{ wrong: "birth", fix: "berth", kind: 'wordchoice', note: "A berth is a mooring; birth is being born." }],
      },
    ],
  },
  {
    num: 58,
    quizId: 'stet-9-12-26',
    live: '2026-09-12',
    dateLabel: 'September 12, 2026',
    sunday: false,
    items: [
      {
        text: "The library keeps the parish registers on microfilm.",
        errors: [],
        cleanNote: "Clean copy: registers and microfilm are correct as written.",
      },
      {
        text: "The clerk filed the deeds under a docket numbered in serial order, and noted the seel was intact.",
        errors: [{ wrong: "seel", fix: "seal", kind: 'wordchoice', note: "A seal is a wax impression; seel is a falconry term." }],
      },
      {
        text: "The choir master rehearsed the descant until dusk.",
        errors: [],
        cleanNote: "Clean copy: descant is the right musical term, oddly as it reads.",
      },
      {
        text: "The forester marked the diseased elms with a paint blaise.",
        errors: [{ wrong: "blaise", fix: "blaze", kind: 'wordchoice', note: "A blaze is a mark cut or painted on a tree." }],
      },
      {
        text: "The keeper had awoke to find the lamp still burning.",
        errors: [{ wrong: "awoke", fix: "awoken", kind: 'grammar', note: "After had the verb takes awoken, not awoke." }],
      },
    ],
  },
  {
    num: 59,
    quizId: 'stet-9-13-26',
    live: '2026-09-13',
    dateLabel: 'September 13, 2026',
    sunday: true,
    items: [
      {
        text: "Her testimony was consistent throughout the hearing.",
        errors: [],
        cleanNote: "Clean copy: testimony and consistent are used correctly.",
      },
      {
        text: "A dispute had arose over the boundary hedge.",
        errors: [{ wrong: "arose", fix: "arisen", kind: 'grammar', note: "After had the verb takes arisen, not arose." }],
      },
      {
        text: "The publican kept a slate for the regulars, a custom that finally seized in 1974.",
        errors: [{ wrong: "seized", fix: "ceased", kind: 'wordchoice', note: "To cease is to stop; to seize is to grab or to jam." }],
      },
      {
        text: "The trust rebuilt the sea wall with rock armour brought by barge, and graded the aprin behind it.",
        errors: [{ wrong: "aprin", fix: "apron", kind: 'wordchoice', note: "An apron is the sloping surface at the base of a wall." }],
      },
      {
        text: "The society published a facsimile of the 1745 map.",
        errors: [],
        cleanNote: "Clean copy: facsimile is the right word and correctly spelled.",
      },
      {
        text: "The archivist unfolded a plan drawn on linen and backed with pased paper.",
        errors: [{ wrong: "pased", fix: "pasted", kind: 'wordchoice', note: "Pasted is the correct past participle of paste." }],
      },
      {
        text: "The keeper counted forty grey seal pups on the skerry at low water, though he had to pier through the haze to be sure.",
        errors: [{ wrong: "pier", fix: "peer", kind: 'wordchoice', note: "To peer is to look closely; a pier is a jetty." }],
      },
    ],
  },
  {
    num: 60,
    quizId: 'stet-9-14-26',
    live: '2026-09-14',
    dateLabel: 'September 14, 2026',
    sunday: false,
    items: [
      {
        text: "The society recorded the ring of six bells, and the board of ringers fixed to the wall of the knave.",
        errors: [{ wrong: "knave", fix: "nave", kind: 'wordchoice', note: "The nave is the body of the church; a knave is a scoundrel." }],
      },
      {
        text: "The surveyor had mistook the datum for the old benchmark.",
        errors: [{ wrong: "mistook", fix: "mistaken", kind: 'grammar', note: "After had the verb takes mistaken, not mistook." }],
      },
      {
        text: "The bell tower leans a little to the south.",
        errors: [],
        cleanNote: "Clean copy: leans is the right verb and correctly spelled.",
      },
      {
        text: "The tunnel was bored through solid chalk.",
        errors: [],
        cleanNote: "Clean copy: bored is correct here, meaning drilled.",
      },
      {
        text: "The gardener staked the espalier against the south wall, where a vain of chalk ran close under the border.",
        errors: [{ wrong: "vain", fix: "vein", kind: 'wordchoice', note: "A vein is a seam running through the ground; vain means conceited." }],
      },
    ],
  },
  {
    num: 61,
    quizId: 'stet-9-15-26',
    live: '2026-09-15',
    dateLabel: 'September 15, 2026',
    sunday: false,
    items: [
      {
        text: "The engineer said the culvert had silted and would need jetting to clear the invart.",
        errors: [{ wrong: "invart", fix: "invert", kind: 'wordchoice', note: "The invert is the lowest inside surface of a pipe." }],
      },
      {
        text: "The lock keeper opened the gates at six.",
        errors: [],
        cleanNote: "Clean copy: lock keeper is the correct canal term.",
      },
      {
        text: "Him and the foreman signed the completion notice together.",
        errors: [{ wrong: "Him", fix: "He", kind: 'grammar', note: "A subject takes the nominative, so it reads he and the foreman." }],
      },
      {
        text: "The trustees agreed to insure the collection for its full replacment value.",
        errors: [{ wrong: "replacment", fix: "replacement", kind: 'wordchoice', note: "Replacement keeps the e before ment." }],
      },
      {
        text: "The harbour wall was rebuilt after the winter storms.",
        errors: [],
        cleanNote: "Clean copy: rebuilt and harbour are used correctly.",
      },
    ],
  },
  {
    num: 62,
    quizId: 'stet-9-16-26',
    live: '2026-09-16',
    dateLabel: 'September 16, 2026',
    sunday: false,
    items: [
      {
        text: "Us surveyors were asked to file a single joint report.",
        errors: [{ wrong: "Us", fix: "We", kind: 'grammar', note: "The subject takes we, so it reads we surveyors were asked." }],
      },
      {
        text: "The rector read the banns for the third time.",
        errors: [],
        cleanNote: "Clean copy: banns is the correct church spelling.",
      },
      {
        text: "The porter said the lift had been out of order for a fortnight, which was a serious inconvenence.",
        errors: [{ wrong: "inconvenence", fix: "inconvenience", kind: 'spelling', note: "Inconvenience is the correct spelling." }],
      },
      {
        text: "The farm has diversified into cheese and cider.",
        errors: [],
        cleanNote: "Clean copy: diversified is exact and correctly spelled.",
      },
      {
        text: "The society published a guide to the church, its glass and its monuments, with a foreward by the archdeacon.",
        errors: [{ wrong: "foreward", fix: "foreword", kind: 'wordchoice', note: "A foreword is an introduction; forward means ahead." }],
      },
    ],
  },
  {
    num: 63,
    quizId: 'stet-9-17-26',
    live: '2026-09-17',
    dateLabel: 'September 17, 2026',
    sunday: false,
    items: [
      {
        text: "The kiln was fired for the last time in 1978.",
        errors: [],
        cleanNote: "Clean copy: kiln and fired are used correctly.",
      },
      {
        text: "The keeper described the otter's tracks in the silt as unmistakeable.",
        errors: [{ wrong: "unmistakeable", fix: "unmistakable", kind: 'wordchoice', note: "Unmistakable drops the e before able." }],
      },
      {
        text: "The report recommended a phased withdrawal of funding.",
        errors: [],
        cleanNote: "Clean copy: phased and withdrawal are correct as written.",
      },
      {
        text: "Between you and I, the tender was never going to succeed.",
        errors: [{ wrong: "I", fix: "me", kind: 'grammar', note: "After between the pronoun takes the object form, me." }],
      },
      {
        text: "The society dated the roof by dendochronology of the tie beams.",
        errors: [{ wrong: "dendochronology", fix: "dendrochronology", kind: 'spelling', note: "Dendrochronology is the correct spelling for tree-ring dating." }],
      },
    ],
  },
  {
    num: 64,
    quizId: 'stet-9-18-26',
    live: '2026-09-18',
    dateLabel: 'September 18, 2026',
    sunday: false,
    items: [
      {
        text: "The signal box was decommissioned last autumn.",
        errors: [],
        cleanNote: "Clean copy: decommissioned is exact and correctly spelled.",
      },
      {
        text: "The trust cleared the pond of blanket weed and restored the sluce.",
        errors: [{ wrong: "sluce", fix: "sluice", kind: 'spelling', note: "Sluice is the correct spelling for the water gate." }],
      },
      {
        text: "The archivist thanked they who had catalogued the plates.",
        errors: [{ wrong: "they", fix: "those", kind: 'grammar', note: "The object form is needed, so it reads thanked those who." }],
      },
      {
        text: "The vicar said the parish had been served by the same family of clerks for four generations, a remarkable continuum.",
        errors: [{ wrong: "continuum", fix: "continuity", kind: 'wordchoice', note: "Continuity is unbroken succession; a continuum is a range." }],
      },
      {
        text: "The chapel retains its original box pews.",
        errors: [],
        cleanNote: "Clean copy: box pews is the correct architectural term.",
      },
    ],
  },
  {
    num: 65,
    quizId: 'stet-9-19-26',
    live: '2026-09-19',
    dateLabel: 'September 19, 2026',
    sunday: false,
    items: [
      {
        text: "The trust rehung the gate on new pintels driven into the pier.",
        errors: [{ wrong: "pintels", fix: "pintles", kind: 'spelling', note: "A pintle is the pin a gate hangs on; pintels is a misspelling." }],
      },
      {
        text: "The archivist found a letter signed by the steward, dated Michelmas 1788.",
        errors: [{ wrong: "Michelmas", fix: "Michaelmas", kind: 'spelling', note: "Michaelmas is the correct spelling of the September feast." }],
      },
      {
        text: "The cellar was dry despite the high water table.",
        errors: [],
        cleanNote: "Clean copy: water table is the correct hydrological term.",
      },
      {
        text: "The society holds an annual lecture in the guildhall.",
        errors: [],
        cleanNote: "Clean copy: guildhall is the right word and correctly spelled.",
      },
      {
        text: "The society honoured the man whom donated the collection.",
        errors: [{ wrong: "whom", fix: "who", kind: 'grammar', note: "Who is the subject of donated, so whom is wrong." }],
      },
    ],
  },
  {
    num: 66,
    quizId: 'stet-9-20-26',
    live: '2026-09-20',
    dateLabel: 'September 20, 2026',
    sunday: true,
    items: [
      {
        text: "The trustees argued about who to appoint as chair.",
        errors: [{ wrong: "who", fix: "whom", kind: 'grammar', note: "Who is the object of appoint here, so it takes whom." }],
      },
      {
        text: "The society recorded a fine hammerbeem roof over the nave.",
        errors: [{ wrong: "hammerbeem", fix: "hammerbeam", kind: 'wordchoice', note: "Hammerbeam is the correct name for the roof truss." }],
      },
      {
        text: "The weir was rebuilt to allow salmon to pass.",
        errors: [],
        cleanNote: "Clean copy: weir is spelled correctly and used properly.",
      },
      {
        text: "The keeper reported a raft of eider off the point, feeding over the muscle beds at slack water.",
        errors: [{ wrong: "muscle", fix: "mussel", kind: 'wordchoice', note: "A mussel is the shellfish eider feed on; a muscle moves the body." }],
      },
      {
        text: "The farmer said the ewes were due to lamb within the fortnite.",
        errors: [{ wrong: "fortnite", fix: "fortnight", kind: 'wordchoice', note: "A fortnight is two weeks; Fortnite is a video game." }],
      },
      {
        text: "The parish council agreed to fund the repair.",
        errors: [],
        cleanNote: "Clean copy: parish council and repair are correct.",
      },
      {
        text: "The mason repaired the parapit above the porch.",
        errors: [{ wrong: "parapit", fix: "parapet", kind: 'spelling', note: "Parapet is the correct spelling for a low wall." }],
      },
    ],
  },
  {
    num: 67,
    quizId: 'stet-9-21-26',
    live: '2026-09-21',
    dateLabel: 'September 21, 2026',
    sunday: false,
    items: [
      {
        text: "The observatory recorded the transit in fine weather.",
        errors: [],
        cleanNote: "Clean copy: transit is the right astronomical term.",
      },
      {
        text: "The dome was turned by hand, which cut the effort considerable.",
        errors: [{ wrong: "considerable", fix: "considerably", kind: 'grammar', note: "An adverb is needed to modify cut, so considerably." }],
      },
      {
        text: "The engineer found the retaining wall was bulging and would need buttrressing.",
        errors: [{ wrong: "buttrressing", fix: "buttressing", kind: 'wordchoice', note: "Buttressing has a single r after the double t." }],
      },
      {
        text: "The archivist described the binding as limp velum over boards.",
        errors: [{ wrong: "velum", fix: "vellum", kind: 'wordchoice', note: "Vellum is fine calfskin; velum is an anatomical membrane." }],
      },
      {
        text: "The bridge carries a single track over the gorge.",
        errors: [],
        cleanNote: "Clean copy: carries and gorge are used correctly.",
      },
    ],
  },
  {
    num: 68,
    quizId: 'stet-9-22-26',
    live: '2026-09-22',
    dateLabel: 'September 22, 2026',
    sunday: false,
    items: [
      {
        text: "The lifeboat answered the call remarkable quickly that night.",
        errors: [{ wrong: "remarkable", fix: "remarkably", kind: 'grammar', note: "An adverb modifies quickly, so it reads remarkably quickly." }],
      },
      {
        text: "The trust replanted the avenue with limes.",
        errors: [],
        cleanNote: "Clean copy: limes is correct here, meaning lime trees.",
      },
      {
        text: "The gardener pruned the wisteria back to two buds and tied the growth to the trellice.",
        errors: [{ wrong: "trellice", fix: "trellis", kind: 'spelling', note: "Trellis is the spelling for the frame; trellice is not a word." }],
      },
      {
        text: "The scheme drew objections from three parishes.",
        errors: [],
        cleanNote: "Clean copy: objections and parishes are used correctly.",
      },
      {
        text: "The vicar said the organ needed a new tremulent stop.",
        errors: [{ wrong: "tremulent", fix: "tremulant", kind: 'wordchoice', note: "A tremulant is the organ stop that wavers the tone." }],
      },
    ],
  },
  {
    num: 69,
    quizId: 'stet-9-23-26',
    live: '2026-09-23',
    dateLabel: 'September 23, 2026',
    sunday: false,
    items: [
      {
        text: "The engineer said the beam would need to be jacked and the padstone renewed before the wall began to sheer.",
        errors: [{ wrong: "sheer", fix: "shear", kind: 'wordchoice', note: "Shear is the engineering term for a sliding failure; sheer means utter or steep." }],
      },
      {
        text: "The board deferred the decision until October.",
        errors: [],
        cleanNote: "Clean copy: deferred is exact and correctly spelled.",
      },
      {
        text: "The mason worked slow and steady through the frost.",
        errors: [{ wrong: "slow", fix: "slowly", kind: 'grammar', note: "The verb needs an adverb, so it reads worked slowly." }],
      },
      {
        text: "The keeper found the barn owl roosting on a purloin above the byre.",
        errors: [{ wrong: "purloin", fix: "purlin", kind: 'wordchoice', note: "A purlin is a roof timber; to purloin is to steal." }],
      },
      {
        text: "The mill race still runs beneath the old floor.",
        errors: [],
        cleanNote: "Clean copy: mill race is the correct term for the channel.",
      },
    ],
  },
  {
    num: 70,
    quizId: 'stet-9-24-26',
    live: '2026-09-24',
    dateLabel: 'September 24, 2026',
    sunday: false,
    items: [
      {
        text: "The path is impassable after heavy rain.",
        errors: [],
        cleanNote: "Clean copy: impassable is the right adjective, correctly spelled.",
      },
      {
        text: "The society noted the font cover was suspended from a counterweight and raised by a single chord.",
        errors: [{ wrong: "chord", fix: "cord", kind: 'wordchoice', note: "A cord is a length of rope; a chord is a group of musical notes." }],
      },
      {
        text: "The dairy bottles its milk on the farm.",
        errors: [],
        cleanNote: "Clean copy: dairy and bottles are used correctly.",
      },
      {
        text: "The trust rebuilt the dry stone wall using the original throughstones, and re-set the style at the field corner.",
        errors: [{ wrong: "style", fix: "stile", kind: 'wordchoice', note: "A stile is the step set into a wall for walkers; style is a manner of doing something." }],
      },
      {
        text: "The choir sang particular well at the Christmas service.",
        errors: [{ wrong: "particular", fix: "particularly", kind: 'grammar', note: "An adverb is needed before well, so particularly." }],
      },
    ],
  },
  {
    num: 71,
    quizId: 'stet-9-25-26',
    live: '2026-09-25',
    dateLabel: 'September 25, 2026',
    sunday: false,
    items: [
      {
        text: "The mason set the sill on a bed of mortar and checked it with a spirit levl.",
        errors: [{ wrong: "levl", fix: "level", kind: 'spelling', note: "Level is the correct spelling of the tool." }],
      },
      {
        text: "The scheme was received bad by the parish meeting.",
        errors: [{ wrong: "bad", fix: "badly", kind: 'grammar', note: "The verb needs an adverb, so it reads received badly." }],
      },
      {
        text: "The vicar thanked the flower guild for the harvest displays around the chancel arch and the pulput.",
        errors: [{ wrong: "pulput", fix: "pulpit", kind: 'spelling', note: "Pulpit is the correct spelling for the preacher's stand." }],
      },
      {
        text: "The cottage is thatched in Norfolk reed.",
        errors: [],
        cleanNote: "Clean copy: thatched and reed are correct as written.",
      },
      {
        text: "The council refused to comment on the settlement.",
        errors: [],
        cleanNote: "Clean copy: settlement is the right word in this legal sense.",
      },
    ],
  },
  {
    num: 72,
    quizId: 'stet-9-26-26',
    live: '2026-09-26',
    dateLabel: 'September 26, 2026',
    sunday: false,
    items: [
      {
        text: "The farmer said the crop had been flattened by a summer squal.",
        errors: [{ wrong: "squal", fix: "squall", kind: 'spelling', note: "A squall is a sudden storm; squal is a misspelling." }],
      },
      {
        text: "The forge bell still hangs above the door.",
        errors: [],
        cleanNote: "Clean copy: forge and hangs are used correctly here.",
      },
      {
        text: "The riverbank was reinforced with willow spiling.",
        errors: [],
        cleanNote: "Clean copy: spiling is the correct riverbank engineering term.",
      },
      {
        text: "The engine ran different after the rebuild.",
        errors: [{ wrong: "different", fix: "differently", kind: 'grammar', note: "The verb needs an adverb, so it reads ran differently." }],
      },
      {
        text: "The trust surveyed the leadwork and found the bay was badly corrogated.",
        errors: [{ wrong: "corrogated", fix: "corrugated", kind: 'spelling', note: "Corrugated is the correct spelling." }],
      },
    ],
  },
  {
    num: 73,
    quizId: 'stet-9-27-26',
    live: '2026-09-27',
    dateLabel: 'September 27, 2026',
    sunday: true,
    items: [
      {
        text: "The gardener said the box hedge was suffering from blite and would be replaced with yew.",
        errors: [{ wrong: "blite", fix: "blight", kind: 'wordchoice', note: "Blight is the plant disease; blite is an obscure plant name." }],
      },
      {
        text: "The lease runs for a further eleven years.",
        errors: [],
        cleanNote: "Clean copy: lease and further are used correctly.",
      },
      {
        text: "The tide came in sudden and cut off the causeway.",
        errors: [{ wrong: "sudden", fix: "suddenly", kind: 'grammar', note: "The verb needs an adverb, so it reads came in suddenly." }],
      },
      {
        text: "The keeper counted nine curlew probing the tideline at first light, a site he never tired of.",
        errors: [{ wrong: "site", fix: "sight", kind: 'wordchoice', note: "A sight is something seen; a site is a place or location." }],
      },
      {
        text: "The society published a transcript of the court rolls, with a glossery of the Latin terms.",
        errors: [{ wrong: "glossery", fix: "glossary", kind: 'spelling', note: "Glossary is the correct spelling for a word list." }],
      },
      {
        text: "The archivist noted the seal matrix was chipped but the legand was legible.",
        errors: [{ wrong: "legand", fix: "legend", kind: 'wordchoice', note: "The legend is the inscription round a seal." }],
      },
      {
        text: "The colliery band still rehearses on Thursdays.",
        errors: [],
        cleanNote: "Clean copy: colliery and rehearses are correct as written.",
      },
    ],
  },
  {
    num: 74,
    quizId: 'stet-9-28-26',
    live: '2026-09-28',
    dateLabel: 'September 28, 2026',
    sunday: false,
    items: [
      {
        text: "The wall was pointed careful in lime mortar.",
        errors: [{ wrong: "careful", fix: "carefully", kind: 'grammar', note: "The verb needs an adverb, so it reads pointed carefully." }],
      },
      {
        text: "The chapel roof was releaded in the spring.",
        errors: [],
        cleanNote: "Clean copy: releaded is the correct term for renewing lead work.",
      },
      {
        text: "The keeper logged a pod of porpoise working the tied race off the head.",
        errors: [{ wrong: "tied", fix: "tide", kind: 'wordchoice', note: "A tide race is the fast water off a headland; tied is the past of tie." }],
      },
      {
        text: "The tenant gave notice at the end of the quarter.",
        errors: [],
        cleanNote: "Clean copy: quarter is correct here, meaning a rent period.",
      },
      {
        text: "The mason described the arch as a segmentle rather than a true semicircle.",
        errors: [{ wrong: "segmentle", fix: "segmental", kind: 'wordchoice', note: "Segmental is the correct architectural term." }],
      },
    ],
  },
  {
    num: 75,
    quizId: 'stet-9-29-26',
    live: '2026-09-29',
    dateLabel: 'September 29, 2026',
    sunday: false,
    items: [
      {
        text: "The society noted the pews were installed in 1843, a change the vicar recorded at grate length.",
        errors: [{ wrong: "grate", fix: "great", kind: 'wordchoice', note: "Great means large; a grate is a fireplace fitting." }],
      },
      {
        text: "The engineer said the sluice paddle was seized and the gearing would need to be striped and greased.",
        errors: [{ wrong: "striped", fix: "stripped", kind: 'wordchoice', note: "Stripped means taken apart; striped means marked with lines." }],
      },
      {
        text: "The harbour master logged every arrival by hand.",
        errors: [],
        cleanNote: "Clean copy: logged and arrival are used correctly.",
      },
      {
        text: "The trust said the mill had lost it's cap in the storm.",
        errors: [{ wrong: "it's", fix: "its", kind: 'grammar', note: "Its is the possessive; it's is short for it is." }],
      },
      {
        text: "The bakery still uses a peel to load the oven.",
        errors: [],
        cleanNote: "Clean copy: peel is the correct name for a baker's shovel.",
      },
    ],
  },
  {
    num: 76,
    quizId: 'stet-9-30-26',
    live: '2026-09-30',
    dateLabel: 'September 30, 2026',
    sunday: false,
    items: [
      {
        text: "The survey found fewer than a dozen nests left on the whole cliff face.",
        errors: [],
        cleanNote: "Clean copy: fewer is right for things you can count, and nests can be counted.",
      },
      {
        text: "Neither of the two proposed routes were costed before the committee voted.",
        errors: [{ wrong: "were", fix: "was", kind: 'grammar', note: "Neither is singular: neither of the routes was costed." }],
      },
      {
        text: "A supplier told the inquiry that the flower in the loaves had been milled in Kent.",
        errors: [{ wrong: "flower", fix: "flour", kind: 'wordchoice', note: "Flour is milled from grain; a flower grows on a plant." }],
      },
      {
        text: "The council leader said the borough would not waiver from the timetable it published in June.",
        errors: [{ wrong: "waiver", fix: "waver", kind: 'wordchoice', note: "To waver is to hesitate; a waiver is the giving up of a right." }],
      },
      {
        text: "The drawings hang in one row, so that the sitters appear to be starring at each other.",
        errors: [{ wrong: "starring", fix: "staring", kind: 'wordchoice', note: "To stare is to look fixedly; to star is to take a leading role." }],
      },
    ],
  },
  {
    num: 77,
    quizId: 'stet-10-1-26',
    live: '2026-10-01',
    dateLabel: 'October 1, 2026',
    sunday: false,
    items: [
      {
        text: "The judge said the charge had been withdrew before the second hearing opened.",
        errors: [{ wrong: "withdrew", fix: "withdrawn", kind: 'grammar', note: "After had the verb takes its participle: had withdrawn." }],
      },
      {
        text: "The trust said waiting times had fallen for the forth quarter running.",
        errors: [{ wrong: "forth", fix: "fourth", kind: 'wordchoice', note: "Fourth is the ordinal number; forth means onward." }],
      },
      {
        text: "The auditors said the dispute was a matter of principle rather than of sums.",
        errors: [],
        cleanNote: "Clean copy: principle is the rule at stake, which is exactly the word wanted.",
      },
      {
        text: "Forecasters said the squall had blown itself out well before dawn.",
        errors: [],
        cleanNote: "Clean copy: had blown is the right participle, and a squall is a sudden storm.",
      },
      {
        text: "Inspectors said the timetable was to complex for the youngest pupils.",
        errors: [{ wrong: "to", fix: "too", kind: 'wordchoice', note: "Too means excessively; to is the preposition." }],
      },
    ],
  },
  {
    num: 78,
    quizId: 'stet-10-2-26',
    live: '2026-10-02',
    dateLabel: 'October 2, 2026',
    sunday: false,
    items: [
      {
        text: "The authority said the overspend would be cleared over for years of instalments.",
        errors: [{ wrong: "for", fix: "four", kind: 'wordchoice', note: "Four is the number; for is the preposition." }],
      },
      {
        text: "The harbour master said the trawler had been tied up along the key since Tuesday.",
        errors: [{ wrong: "key", fix: "quay", kind: 'wordchoice', note: "A quay is a landing place for boats; a key opens a lock." }],
      },
      {
        text: "The winger run half the length of the pitch before the whistle went.",
        errors: [{ wrong: "run", fix: "ran", kind: 'grammar', note: "The simple past is ran; run is the participle, as in has run." }],
      },
      {
        text: "The conservator found a whole in the panel where a knot had dropped out.",
        errors: [{ wrong: "whole", fix: "hole", kind: 'wordchoice', note: "A hole is a gap; whole means entire." }],
      },
      {
        text: "The water table sunk by two metres in the decade after the pumps went in.",
        errors: [{ wrong: "sunk", fix: "sank", kind: 'grammar', note: "The simple past is sank; sunk is the participle, as in has sunk." }],
      },
    ],
  },
  {
    num: 79,
    quizId: 'stet-10-3-26',
    live: '2026-10-03',
    dateLabel: 'October 3, 2026',
    sunday: false,
    items: [
      {
        text: "The farmer said the ewes had been moved to higher ground before the river rose.",
        errors: [],
        cleanNote: "Clean copy: ewes are female sheep, and that is the spelling.",
      },
      {
        text: "Directors were warned that the bonus scheme could mitigate against long-term investment.",
        errors: [{ wrong: "mitigate", fix: "militate", kind: 'wordchoice', note: "To militate against is to weigh against it; to mitigate is to soften." }],
      },
      {
        text: "The solicitor said her client had been advised of his write to silence.",
        errors: [{ wrong: "write", fix: "right", kind: 'wordchoice', note: "A right is an entitlement; to write is to put words on paper." }],
      },
      {
        text: "The trust said the figures was published in error and would be reissued.",
        errors: [{ wrong: "was", fix: "were", kind: 'grammar', note: "Figures is plural, so the verb is were." }],
      },
      {
        text: "The operator blamed the cancellations on a shortage of drivers do to sickness.",
        errors: [{ wrong: "do", fix: "due", kind: 'wordchoice', note: "Due to means caused by; do is the verb." }],
      },
    ],
  },
  {
    num: 80,
    quizId: 'stet-10-4-26',
    live: '2026-10-04',
    dateLabel: 'October 4, 2026',
    sunday: true,
    items: [
      {
        text: "The club said the aloud limit was four tickets a person, and the queue took an hour.",
        errors: [{ wrong: "aloud", fix: "allowed", kind: 'wordchoice', note: "Allowed means permitted; aloud means out loud." }],
      },
      {
        text: "The gallery hung the drawing besides a portrait by an artist who's name is lost.",
        errors: [{ wrong: "besides", fix: "beside", kind: 'wordchoice', note: "Beside means next to; besides means in addition." }, { wrong: "who's", fix: "whose", kind: 'wordchoice', note: "Whose is the possessive; who's is short for who is." }],
      },
      {
        text: "Governors said the school had complied with every recommendation in the inspectors' report.",
        errors: [],
        cleanNote: "Clean copy: complied with is right, and the plural possessive inspectors' sits correctly.",
      },
      {
        text: "The chef leaves the sauce to reduce until it just coats the back of a spoon.",
        errors: [],
        cleanNote: "Clean copy: reduce is the kitchen sense, boiling down to concentrate.",
      },
      {
        text: "The chair said the motion had been tabled in hast, and that there is still two amendments to hear.",
        errors: [{ wrong: "hast", fix: "haste", kind: 'wordchoice', note: "Haste is hurry; hast is an archaic form of have." }, { wrong: "is", fix: "are", kind: 'grammar', note: "Two amendments is plural, so the verb is are." }],
      },
      {
        text: "The skipper said the boat had lay at anchor since Friday, and that the chain had chaffed the mooring buoy.",
        errors: [{ wrong: "lay", fix: "lain", kind: 'grammar', note: "Had takes the participle lain; lay is the simple past." }, { wrong: "chaffed", fix: "chafed", kind: 'wordchoice', note: "To chafe is to rub; to chaff is to tease." }],
      },
      {
        text: "Ecologists said the tern colony had grew to more than two hundred pairs.",
        errors: [{ wrong: "grew", fix: "grown", kind: 'grammar', note: "Had takes the participle grown; grew is the simple past." }],
      },
    ],
  },
  {
    num: 81,
    quizId: 'stet-10-5-26',
    live: '2026-10-05',
    dateLabel: 'October 5, 2026',
    sunday: false,
    items: [
      {
        text: "The scheme cannot go ahead without the ascent of the two landowners.",
        errors: [{ wrong: "ascent", fix: "assent", kind: 'wordchoice', note: "Assent is agreement; an ascent is a climb." }],
      },
      {
        text: "The magistrate said the driver had shown a callous disregard for other road users.",
        errors: [],
        cleanNote: "Clean copy: callous means unfeeling, and it is spelled with two ls and no u.",
      },
      {
        text: "The two gauges on the estuary gives readings a metre apart.",
        errors: [{ wrong: "gives", fix: "give", kind: 'grammar', note: "Two gauges is plural, so the verb is give." }],
      },
      {
        text: "The critic wrote that the revue had lost none of its bite in forty years.",
        errors: [],
        cleanNote: "Clean copy: a revue is a stage show of sketches and songs, not a notice of one.",
      },
      {
        text: "The ward said patience would be seen in order of clinical need.",
        errors: [{ wrong: "patience", fix: "patients", kind: 'wordchoice', note: "Patients are the people treated; patience is the virtue." }],
      },
    ],
  },
  {
    num: 82,
    quizId: 'stet-10-6-26',
    live: '2026-10-06',
    dateLabel: 'October 6, 2026',
    sunday: false,
    items: [
      {
        text: "Forecasters said the front would bring rein and hill snow by the evening.",
        errors: [{ wrong: "rein", fix: "rain", kind: 'wordchoice', note: "Rain falls from the sky; a rein controls a horse." }],
      },
      {
        text: "The lifeboat crew said the yacht had drifted for hours before anyone rung the alarm.",
        errors: [{ wrong: "rung", fix: "rang", kind: 'grammar', note: "The simple past is rang; rung is the participle, as in has rung." }],
      },
      {
        text: "The chain blamed a flat summer on the whether rather than on its prices.",
        errors: [{ wrong: "whether", fix: "weather", kind: 'wordchoice', note: "Weather is what the sky does; whether introduces an alternative." }],
      },
      {
        text: "Pupils sat the paper in the sports hall, where the invigilator was hard to here.",
        errors: [{ wrong: "here", fix: "hear", kind: 'wordchoice', note: "Hear is what ears do; here is this place." }],
      },
      {
        text: "The tenant said the herd had been housed early because the grass had stopped growing.",
        errors: [],
        cleanNote: "Clean copy: herd is the collective for cattle, and housed is the farming sense.",
      },
    ],
  },
  {
    num: 83,
    quizId: 'stet-10-7-26',
    live: '2026-10-07',
    dateLabel: 'October 7, 2026',
    sunday: false,
    items: [
      {
        text: "Residents said the new bollards had made the lane impassible to delivery vans.",
        errors: [{ wrong: "impassible", fix: "impassable", kind: 'wordchoice', note: "Impassable means it cannot be got through; impassible means unfeeling." }],
      },
      {
        text: "The bequest included a set of Delft tiles, non of which had been catalogued.",
        errors: [{ wrong: "non", fix: "none", kind: 'wordchoice', note: "None means not one; non is a prefix, not a word on its own." }],
      },
      {
        text: "The umpire said the ball had struck the batsman outside the line, so the appeal failed.",
        errors: [],
        cleanNote: "Clean copy: struck is the right past tense, and outside the line is the cricket sense.",
      },
      {
        text: "The warden said he seen the otter twice on the mill leat last week.",
        errors: [{ wrong: "seen", fix: "saw", kind: 'grammar', note: "Seen needs an auxiliary: he saw it, or he has seen it." }],
      },
      {
        text: "The baker said the flour had been sifted twice and the batter left to stand for an our.",
        errors: [{ wrong: "our", fix: "hour", kind: 'wordchoice', note: "An hour is sixty minutes; our is the possessive." }],
      },
    ],
  },
  {
    num: 84,
    quizId: 'stet-10-8-26',
    live: '2026-10-08',
    dateLabel: 'October 8, 2026',
    sunday: false,
    items: [
      {
        text: "The peat was dug for fuel until the 1930s, and the scars are still plane to see.",
        errors: [{ wrong: "plane", fix: "plain", kind: 'wordchoice', note: "Plain means clear or obvious; a plane is a flat surface or a tool." }],
      },
      {
        text: "The injunction had forbade the company from selling the land before the appeal.",
        errors: [{ wrong: "forbade", fix: "forbidden", kind: 'grammar', note: "Had takes the participle forbidden; forbade is the simple past." }],
      },
      {
        text: "The trust said the ward had been closed to knew admissions until Monday.",
        errors: [{ wrong: "knew", fix: "new", kind: 'wordchoice', note: "New means recent; knew is the past of know." }],
      },
      {
        text: "The inquiry found the driver had been given a rout that avoided the closed section.",
        errors: [{ wrong: "rout", fix: "route", kind: 'wordchoice', note: "A route is a way through; a rout is a crushing defeat." }],
      },
      {
        text: "The firm said its order book had shrunk for a third quarter running.",
        errors: [{ wrong: "shrunk", fix: "shrank", kind: 'grammar', note: "The simple past is shrank; shrunk is the participle, as in has shrunk." }],
      },
    ],
  },
  {
    num: 85,
    quizId: 'stet-10-9-26',
    live: '2026-10-09',
    dateLabel: 'October 9, 2026',
    sunday: false,
    items: [
      {
        text: "The council said the two schemes complement each other and would be funded together.",
        errors: [],
        cleanNote: "Clean copy: complement means to complete, which is the sense here.",
      },
      {
        text: "The pilot said the channel had shoaled and the buoys would move before the spring tides.",
        errors: [],
        cleanNote: "Clean copy: shoaled means the water has grown shallower, which is the sense wanted.",
      },
      {
        text: "The club said its eight had beat the course record set in 1998 by four seconds.",
        errors: [{ wrong: "beat", fix: "beaten", kind: 'grammar', note: "Had takes the participle beaten; beat is the simple past." }],
      },
      {
        text: "The bursar said the currant year's fees would stand until the summer term.",
        errors: [{ wrong: "currant", fix: "current", kind: 'wordchoice', note: "Current means present; a currant is a dried fruit." }],
      },
      {
        text: "One critic called the early quartets torturous rather than merely difficult.",
        errors: [{ wrong: "torturous", fix: "tortuous", kind: 'wordchoice', note: "Tortuous means winding and involved; torturous means causing torture." }],
      },
    ],
  },
  {
    num: 86,
    quizId: 'stet-10-10-26',
    live: '2026-10-10',
    dateLabel: 'October 10, 2026',
    sunday: false,
    items: [
      {
        text: "The farmer said the cattle has been housed since the end of September.",
        errors: [{ wrong: "has", fix: "have", kind: 'grammar', note: "Cattle is plural, so the verb is have." }],
      },
      {
        text: "The retailer said the refit had overrun and the store would open a month latter.",
        errors: [{ wrong: "latter", fix: "later", kind: 'wordchoice', note: "Later means afterwards; the latter is the second of two things." }],
      },
      {
        text: "The gallery said the canvas had been relined and a tare in the corner filled.",
        errors: [{ wrong: "tare", fix: "tear", kind: 'wordchoice', note: "A tear is a rip; tare is a weed, or an allowance for weight." }],
      },
      {
        text: "Hale the size of marbles fell on the valley for a quarter of an hour.",
        errors: [{ wrong: "hale", fix: "hail", kind: 'wordchoice', note: "Hail is frozen rain; hale means sound in health." }],
      },
      {
        text: "The tribunal found the dismissal had been unfair and ordered the firm to reinstate her.",
        errors: [],
        cleanNote: "Clean copy: reinstate is right, and unfair dismissal is the phrase the tribunal uses.",
      },
    ],
  },
  {
    num: 87,
    quizId: 'stet-10-11-26',
    live: '2026-10-11',
    dateLabel: 'October 11, 2026',
    sunday: true,
    items: [
      {
        text: "The inspector said the figures had been drew from a survey the council later disowned, and called the omission a serious laps.",
        errors: [{ wrong: "drew", fix: "drawn", kind: 'grammar', note: "Had takes the participle drawn; drew is the simple past." }, { wrong: "laps", fix: "lapse", kind: 'wordchoice', note: "A lapse is a slip; laps are circuits of a track." }],
      },
      {
        text: "The choir sung the mass unaccompanied for the first time in thirty years.",
        errors: [{ wrong: "sung", fix: "sang", kind: 'grammar', note: "The simple past is sang; sung is the participle, as in has sung." }],
      },
      {
        text: "The club said it would assure that season-ticket holders were served first.",
        errors: [{ wrong: "assure", fix: "ensure", kind: 'wordchoice', note: "To ensure is to make certain of something; to assure is to tell someone confidently." }],
      },
      {
        text: "The skipper said the trawler had been holed below the water line, and that the pumps were coping poor with the leek.",
        errors: [{ wrong: "poor", fix: "poorly", kind: 'grammar', note: "Coping is a verb, so it takes the adverb poorly." }, { wrong: "leek", fix: "leak", kind: 'wordchoice', note: "A leak lets water in; a leek is a vegetable." }],
      },
      {
        text: "The trust said the vaccine would go first to patients whose immunity is waning.",
        errors: [],
        cleanNote: "Clean copy: waning is right for something in decline, and immunity is the word wanted.",
      },
      {
        text: "The survey recorded a pare of ravens on the crag, and said the precipitate face above the ledge keeps walkers off.",
        errors: [{ wrong: "pare", fix: "pair", kind: 'wordchoice', note: "A pair is two; to pare is to trim." }, { wrong: "precipitate", fix: "precipitous", kind: 'wordchoice', note: "Precipitous means steep; precipitate means hasty." }],
      },
      {
        text: "The court heard the bank held a lean over the property, and that the deeds were in the names of the tenant and she.",
        errors: [{ wrong: "lean", fix: "lien", kind: 'wordchoice', note: "A lien is a claim on property; lean is to slope or to be thin." }, { wrong: "she", fix: "her", kind: 'grammar', note: "After of the pronoun takes the object case: the tenant and her." }],
      },
    ],
  },
  {
    num: 88,
    quizId: 'stet-10-12-26',
    live: '2026-10-12',
    dateLabel: 'October 12, 2026',
    sunday: false,
    items: [
      {
        text: "The parish said the precept was a levee on every household in the village.",
        errors: [{ wrong: "levee", fix: "levy", kind: 'wordchoice', note: "A levy is a charge; a levee is an embankment against floods." }],
      },
      {
        text: "The reserve said the bittern had boomed from the reed bed for a third spring.",
        errors: [],
        cleanNote: "Clean copy: bitterns boom, and boomed is the word for the call they make.",
      },
      {
        text: "The firm said the order had been cancelled and that it would right off the cost.",
        errors: [{ wrong: "right", fix: "write", kind: 'wordchoice', note: "To write off a cost is the accounting sense; right means correct." }],
      },
      {
        text: "The tutor marked the essay down for its course language and its wandering argument.",
        errors: [{ wrong: "course", fix: "coarse", kind: 'wordchoice', note: "Coarse means rough or crude; a course is a path or a set of lessons." }],
      },
      {
        text: "The harbour master said them on the pontoon had seen nothing unusual that night.",
        errors: [{ wrong: "them", fix: "they", kind: 'grammar', note: "The subject of the clause takes they, not them." }],
      },
    ],
  },
  {
    num: 89,
    quizId: 'stet-10-13-26',
    live: '2026-10-13',
    dateLabel: 'October 13, 2026',
    sunday: false,
    items: [
      {
        text: "The will was signed in the presents of two witnesses at the solicitor's office.",
        errors: [{ wrong: "presents", fix: "presence", kind: 'wordchoice', note: "Presence means being there; presents are gifts." }],
      },
      {
        text: "The surgeon said the graft had taken and the patient would be discharged on Friday.",
        errors: [],
        cleanNote: "Clean copy: taken is the surgical sense, and discharged is the word for leaving hospital.",
      },
      {
        text: "The portrait hangs above the mantle at the far end of the long gallery.",
        errors: [{ wrong: "mantle", fix: "mantel", kind: 'wordchoice', note: "A mantel is the shelf over a fireplace; a mantle is a cloak or a layer." }],
      },
      {
        text: "The club said the ground had passed an inspection at noon and the match would go ahead.",
        errors: [],
        cleanNote: "Clean copy: passed is the right past tense here, and the sense is came through.",
      },
      {
        text: "The forecasters said each of the three warnings cover a different county.",
        errors: [{ wrong: "cover", fix: "covers", kind: 'grammar', note: "Each is singular, so the verb is covers." }],
      },
    ],
  },
  {
    num: 90,
    quizId: 'stet-10-14-26',
    live: '2026-10-14',
    dateLabel: 'October 14, 2026',
    sunday: false,
    items: [
      {
        text: "Engineers said the bridge could not take the wait of a fully loaded lorry.",
        errors: [{ wrong: "wait", fix: "weight", kind: 'wordchoice', note: "Weight is heaviness; to wait is to stay for something." }],
      },
      {
        text: "The shop said the sail would run for a fortnight and then stock would go back up.",
        errors: [{ wrong: "sail", fix: "sale", kind: 'wordchoice', note: "A sale is a selling; a sail catches the wind." }],
      },
      {
        text: "The baker said the doe had been left to prove overnight in the cold room.",
        errors: [{ wrong: "doe", fix: "dough", kind: 'wordchoice', note: "Dough is flour and water mixed; a doe is a female deer or rabbit." }],
      },
      {
        text: "The council said the licensing committee meet on the first Tuesday of the month.",
        errors: [{ wrong: "meet", fix: "meets", kind: 'grammar', note: "The committee is one body, so the verb is meets." }],
      },
      {
        text: "The team said the isotope decays too quickly to be of any practical use.",
        errors: [],
        cleanNote: "Clean copy: decays is right for what an isotope does, and practical is the word wanted.",
      },
    ],
  },
  {
    num: 91,
    quizId: 'stet-10-15-26',
    live: '2026-10-15',
    dateLabel: 'October 15, 2026',
    sunday: false,
    items: [
      {
        text: "The lease contains a claws about subletting that the tenant says he never saw.",
        errors: [{ wrong: "claws", fix: "clause", kind: 'wordchoice', note: "A clause is a passage in a contract; claws are on an animal." }],
      },
      {
        text: "The trust said the rise in referrals appear to have levelled off since June.",
        errors: [{ wrong: "appear", fix: "appears", kind: 'grammar', note: "The subject is the rise, which is singular, so the verb is appears." }],
      },
      {
        text: "The head paid the staff a warm complement at the end of a hard term.",
        errors: [{ wrong: "complement", fix: "compliment", kind: 'wordchoice', note: "A compliment is praise; a complement completes something." }],
      },
      {
        text: "The frame was guilt in the 1820s and has been regilded only once since.",
        errors: [{ wrong: "guilt", fix: "gilt", kind: 'wordchoice', note: "Gilt means covered in gold leaf; guilt is having done wrong." }],
      },
      {
        text: "The herd has been bread on the same hill farm for more than a century.",
        errors: [{ wrong: "bread", fix: "bred", kind: 'wordchoice', note: "Bred is the past of breed; bread is the loaf." }],
      },
    ],
  },
  {
    num: 92,
    quizId: 'stet-10-16-26',
    live: '2026-10-16',
    dateLabel: 'October 16, 2026',
    sunday: false,
    items: [
      {
        text: "The pilot boat put out at first light and the tug stood by until the tide turned.",
        errors: [],
        cleanNote: "Clean copy: stood by is the right phrase, and tug and tide are both used correctly.",
      },
      {
        text: "The captain said the manager and me were the last to leave the pitch.",
        errors: [{ wrong: "me", fix: "I", kind: 'grammar', note: "The pronoun is a subject here: the manager and I were the last." }],
      },
      {
        text: "The council said the byelaw had been in force since 1974 and would not be reviewed.",
        errors: [],
        cleanNote: "Clean copy: a byelaw is a local rule made by the council, and in force is the phrase.",
      },
      {
        text: "The chairman admitted a degree of discomfit at the half-year figures.",
        errors: [{ wrong: "discomfit", fix: "discomfort", kind: 'wordchoice', note: "Discomfort is unease; to discomfit is to thwart or disconcert." }],
      },
      {
        text: "Volunteers planted a roe of alders along the bank to shade the water.",
        errors: [{ wrong: "roe", fix: "row", kind: 'wordchoice', note: "A row is a line; a roe is a small deer, or fish eggs." }],
      },
    ],
  },
  {
    num: 93,
    quizId: 'stet-10-17-26',
    live: '2026-10-17',
    dateLabel: 'October 17, 2026',
    sunday: false,
    items: [
      {
        text: "Governors said the two policies seems to conflict on the question of exclusions.",
        errors: [{ wrong: "seems", fix: "seem", kind: 'grammar', note: "Two policies is plural, so the verb is seem." }],
      },
      {
        text: "Forecasters said their would be a hard frost inland by the early hours.",
        errors: [{ wrong: "their", fix: "there", kind: 'wordchoice', note: "There is the place word; their is the possessive." }],
      },
      {
        text: "The trust said the drug had been withdrawn after a review of its side effects.",
        errors: [],
        cleanNote: "Clean copy: withdrawn is the right participle and side effects is the phrase wanted.",
      },
      {
        text: "The archive said the letters had been pored over by three generations of scholars.",
        errors: [],
        cleanNote: "Clean copy: pored over is right for close reading; poured would tip a liquid.",
      },
      {
        text: "The report said the driver had applied the break far too late on the descent.",
        errors: [{ wrong: "break", fix: "brake", kind: 'wordchoice', note: "A brake stops a vehicle; a break is a pause or a fracture." }],
      },
    ],
  },
  {
    num: 94,
    quizId: 'stet-10-18-26',
    live: '2026-10-18',
    dateLabel: 'October 18, 2026',
    sunday: true,
    items: [
      {
        text: "The crew lost an ore in the swell and rowed the last mile short-handed.",
        errors: [{ wrong: "ore", fix: "oar", kind: 'wordchoice', note: "An oar drives a boat; ore is rock bearing metal." }],
      },
      {
        text: "The club said the fixture had been rearranged for the following Tuesday evening.",
        errors: [],
        cleanNote: "Clean copy: rearranged is right, and fixture is the word for a scheduled match.",
      },
      {
        text: "The council said the depot would move to a sight on the bypass, and admitted the vote had shook the ruling group.",
        errors: [{ wrong: "sight", fix: "site", kind: 'wordchoice', note: "A site is a place; sight is what the eye does." }, { wrong: "shook", fix: "shaken", kind: 'grammar', note: "Had takes the participle shaken; shook is the simple past." }],
      },
      {
        text: "The brewery said the barrel had been tapped at noon and drunk dry by six.",
        errors: [],
        cleanNote: "Clean copy: drunk dry is the right participle, and tapped is what you do to a barrel.",
      },
      {
        text: "The team said the phenomena is well documented in colder seas.",
        errors: [{ wrong: "phenomena", fix: "phenomenon", kind: 'grammar', note: "Phenomena is the plural; a single one is a phenomenon." }],
      },
      {
        text: "The court heard the seller had knowingly mislead the buyer, and that the boundary was described wrong in the deeds.",
        errors: [{ wrong: "mislead", fix: "misled", kind: 'wordchoice', note: "The past of mislead is misled, with one e." }, { wrong: "wrong", fix: "wrongly", kind: 'grammar', note: "Described is a verb, so it takes the adverb wrongly." }],
      },
      {
        text: "The tapestry was cut and rehung, and the seem now falls behind the door frame.",
        errors: [{ wrong: "seem", fix: "seam", kind: 'wordchoice', note: "A seam is a join; seem is the verb." }],
      },
    ],
  },
  {
    num: 95,
    quizId: 'stet-10-19-26',
    live: '2026-10-19',
    dateLabel: 'October 19, 2026',
    sunday: false,
    items: [
      {
        text: "The committee took legal council before publishing the report in full.",
        errors: [{ wrong: "council", fix: "counsel", kind: 'wordchoice', note: "Counsel is advice, or the barrister giving it; a council is the body." }],
      },
      {
        text: "The trust said a single criteria must be met before a referral is accepted.",
        errors: [{ wrong: "criteria", fix: "criterion", kind: 'grammar', note: "Criteria is plural; a single one is a criterion." }],
      },
      {
        text: "The bank agreed to wave the arrangement fee for the first two years.",
        errors: [{ wrong: "wave", fix: "waive", kind: 'wordchoice', note: "To waive is to give up a right; to wave is to move the hand." }],
      },
      {
        text: "The operator said each of the four units need a new coupling before the winter.",
        errors: [{ wrong: "need", fix: "needs", kind: 'grammar', note: "Each is singular, so the verb is needs." }],
      },
      {
        text: "The keeper found a faun lying in the bracken above the top gate.",
        errors: [{ wrong: "faun", fix: "fawn", kind: 'wordchoice', note: "A fawn is a young deer; a faun is a creature of myth." }],
      },
    ],
  },
  {
    num: 96,
    quizId: 'stet-10-20-26',
    live: '2026-10-20',
    dateLabel: 'October 20, 2026',
    sunday: false,
    items: [
      {
        text: "The gallery said the sculpture had been lent by a private collector for the summer.",
        errors: [],
        cleanNote: "Clean copy: lent is the past of lend, which is what a collector does with a work.",
      },
      {
        text: "The head said there was know question of closing the sixth form in the spring.",
        errors: [{ wrong: "know", fix: "no", kind: 'wordchoice', note: "No is the negative; know is what the mind does." }],
      },
      {
        text: "The wreck lie in twelve metres of water half a mile off the point.",
        errors: [{ wrong: "lie", fix: "lies", kind: 'grammar', note: "The wreck is singular, so the verb is lies." }],
      },
      {
        text: "Officers called at his residents in the early hours and found the house empty.",
        errors: [{ wrong: "residents", fix: "residence", kind: 'wordchoice', note: "A residence is where someone lives; residents are the people in it." }],
      },
      {
        text: "The gauge showed the river's floe had trebled in the space of a night.",
        errors: [{ wrong: "floe", fix: "flow", kind: 'wordchoice', note: "Flow is the movement of water; a floe is a sheet of floating ice." }],
      },
    ],
  },
  {
    num: 97,
    quizId: 'stet-10-21-26',
    live: '2026-10-21',
    dateLabel: 'October 21, 2026',
    sunday: false,
    items: [
      {
        text: "The firm said a lone from the bank had covered the shortfall until March.",
        errors: [{ wrong: "lone", fix: "loan", kind: 'wordchoice', note: "A loan is money lent; lone means solitary." }],
      },
      {
        text: "The club said the pitch had drained well and the game would go ahead at three.",
        errors: [],
        cleanNote: "Clean copy: drained is right for what a pitch does, and go ahead is the phrase.",
      },
      {
        text: "The council said these decision had been taken in private and would stand.",
        errors: [{ wrong: "these", fix: "this", kind: 'grammar', note: "Decision is singular, so the demonstrative is this." }],
      },
      {
        text: "The trust said the ward had been closed to visitors as a precaution.",
        errors: [],
        cleanNote: "Clean copy: precaution is the word wanted, and closed to visitors is plainly put.",
      },
      {
        text: "The inspector scored the kitchen two out of five, citing the pealing paint above the sink.",
        errors: [{ wrong: "pealing", fix: "peeling", kind: 'wordchoice', note: "Peeling is coming away in strips; a peal is the sound of bells." }],
      },
    ],
  },
  {
    num: 98,
    quizId: 'stet-10-22-26',
    live: '2026-10-22',
    dateLabel: 'October 22, 2026',
    sunday: false,
    items: [
      {
        text: "The geologist said a single strata of clay runs under the whole field.",
        errors: [{ wrong: "strata", fix: "stratum", kind: 'grammar', note: "Strata is the plural; a single layer is a stratum." }],
      },
      {
        text: "The tutor said the argument was week in the middle and strong at either end.",
        errors: [{ wrong: "week", fix: "weak", kind: 'wordchoice', note: "Weak means feeble; a week is seven days." }],
      },
      {
        text: "The trustees were warned not to medal in the curator's choice of hang.",
        errors: [{ wrong: "medal", fix: "meddle", kind: 'wordchoice', note: "To meddle is to interfere; a medal is an award." }],
      },
      {
        text: "The lorry had been stationery at the crossing for a minute before the barriers lifted.",
        errors: [{ wrong: "stationery", fix: "stationary", kind: 'wordchoice', note: "Stationary means not moving; stationery is paper and envelopes." }],
      },
      {
        text: "The court heard the fence had been moved two metres onto the neighbour's land.",
        errors: [],
        cleanNote: "Clean copy: the possessive neighbour's is correctly placed and nothing else is amiss.",
      },
    ],
  },
  {
    num: 99,
    quizId: 'stet-10-23-26',
    live: '2026-10-23',
    dateLabel: 'October 23, 2026',
    sunday: false,
    items: [
      {
        text: "The manager called the comeback a remarkable feet in the circumstances.",
        errors: [{ wrong: "feet", fix: "feat", kind: 'wordchoice', note: "A feat is an achievement; feet are what you stand on." }],
      },
      {
        text: "The nurse said each vile held ten doses and had to be used within a day.",
        errors: [{ wrong: "vile", fix: "vial", kind: 'wordchoice', note: "A vial is a small bottle; vile means loathsome." }],
      },
      {
        text: "The harbour said the pontoon had been renewed and the fenders replaced.",
        errors: [],
        cleanNote: "Clean copy: fenders are what hang over a boat's side, and renewed is the right word.",
      },
      {
        text: "The ward is the most populace in the borough and the least well served.",
        errors: [{ wrong: "populace", fix: "populous", kind: 'wordchoice', note: "Populous means having many people; the populace is the people themselves." }],
      },
      {
        text: "The agent said the offer include a share of the freehold and the yard behind.",
        errors: [{ wrong: "include", fix: "includes", kind: 'grammar', note: "The offer is singular, so the verb is includes." }],
      },
    ],
  },
  {
    num: 100,
    quizId: 'stet-10-24-26',
    live: '2026-10-24',
    dateLabel: 'October 24, 2026',
    sunday: false,
    items: [
      {
        text: "The organist held the final cord for a full bar and then let the hall go quiet.",
        errors: [{ wrong: "cord", fix: "chord", kind: 'wordchoice', note: "A chord is notes sounded together; a cord is a string or a flex." }],
      },
      {
        text: "The river peaked at three metres just after midnight and fell back by dawn.",
        errors: [],
        cleanNote: "Clean copy: peaked is right for a river reaching its highest point.",
      },
      {
        text: "The tenant said the cattle had trod the gateway to mud by the middle of October.",
        errors: [{ wrong: "trod", fix: "trodden", kind: 'grammar', note: "Had takes the participle trodden; trod is the simple past." }],
      },
      {
        text: "The magistrates said the fine would be paid in instalments over six months.",
        errors: [],
        cleanNote: "Clean copy: instalments is right, and the sentence makes no other claim.",
      },
      {
        text: "The menu offered a chocolate moose and a plate of cheese from the next valley.",
        errors: [{ wrong: "moose", fix: "mousse", kind: 'wordchoice', note: "A mousse is the whipped pudding; a moose is a large deer." }],
      },
    ],
  },
  {
    num: 101,
    quizId: 'stet-10-25-26',
    live: '2026-10-25',
    dateLabel: 'October 25, 2026',
    sunday: true,
    items: [
      {
        text: "The club said the record had stood for twenty-eight years before it was broken.",
        errors: [],
        cleanNote: "Clean copy: stood is right for a record that lasts, and broken is the participle.",
      },
      {
        text: "The geologist said the seam had been mind since 1820, and that the survey had showed no subsidence.",
        errors: [{ wrong: "mind", fix: "mined", kind: 'wordchoice', note: "To mine is to dig out; mind is the faculty of thought." }, { wrong: "showed", fix: "shown", kind: 'grammar', note: "Had takes the participle shown; showed is the simple past." }],
      },
      {
        text: "The court heard the notice had been sent by male, and that the landlord had swore an affidavit about it.",
        errors: [{ wrong: "male", fix: "mail", kind: 'wordchoice', note: "Mail is post; male is the sex." }, { wrong: "swore", fix: "sworn", kind: 'grammar', note: "Had takes the participle sworn; swore is the simple past." }],
      },
      {
        text: "Managers said much of the delays were caused by a shortage of theatre staff.",
        errors: [{ wrong: "much", fix: "many", kind: 'grammar', note: "Delays can be counted, so the word is many." }],
      },
      {
        text: "The chair said the ruling set no precedence, and that the committee had undertook no survey of the site.",
        errors: [{ wrong: "precedence", fix: "precedent", kind: 'wordchoice', note: "A precedent is a case to follow; precedence is priority." }, { wrong: "undertook", fix: "undertaken", kind: 'grammar', note: "Had takes the participle undertaken; undertook is the simple past." }],
      },
      {
        text: "The warden picked out a single turn among the gulls on the shingle bank.",
        errors: [{ wrong: "turn", fix: "tern", kind: 'wordchoice', note: "A tern is a seabird; turn is to change direction." }],
      },
      {
        text: "The conservator stretched a fresh canvass over the frame before relining the picture.",
        errors: [{ wrong: "canvass", fix: "canvas", kind: 'wordchoice', note: "Canvas is the cloth; to canvass is to solicit votes or opinions." }],
      },
    ],
  },
  {
    num: 102,
    quizId: 'stet-10-26-26',
    live: '2026-10-26',
    dateLabel: 'October 26, 2026',
    sunday: false,
    items: [
      {
        text: "The vet said the flock had been dipped against flee and scab before housing.",
        errors: [{ wrong: "flee", fix: "flea", kind: 'wordchoice', note: "A flea is the insect; to flee is to run away." }],
      },
      {
        text: "The butcher said the meet had been hung for a month in the cold store.",
        errors: [{ wrong: "meet", fix: "meat", kind: 'wordchoice', note: "Meat is flesh for eating; to meet is to come together." }],
      },
      {
        text: "The laboratory said a single bacteria had been isolated from the tank.",
        errors: [{ wrong: "bacteria", fix: "bacterium", kind: 'grammar', note: "Bacteria is the plural; a single one is a bacterium." }],
      },
      {
        text: "The council said the bus fair on the market route would rise in April.",
        errors: [{ wrong: "fair", fix: "fare", kind: 'wordchoice', note: "A fare is what you pay to travel; fair means just." }],
      },
      {
        text: "The runner said she had paced the first half deliberately and had plenty left.",
        errors: [],
        cleanNote: "Clean copy: paced is right for controlling speed, and plenty left is plainly put.",
      },
    ],
  },
  {
    num: 103,
    quizId: 'stet-10-27-26',
    live: '2026-10-27',
    dateLabel: 'October 27, 2026',
    sunday: false,
    items: [
      {
        text: "The magistrate said the driver would be find two hundred pounds and given points.",
        errors: [{ wrong: "find", fix: "fined", kind: 'wordchoice', note: "Fined means made to pay a penalty; find is to locate." }],
      },
      {
        text: "The trust said the waiting list remain the longest in the region.",
        errors: [{ wrong: "remain", fix: "remains", kind: 'grammar', note: "The list is singular, so the verb is remains." }],
      },
      {
        text: "The ferry crosses the straight in forty minutes in anything short of a gale.",
        errors: [{ wrong: "straight", fix: "strait", kind: 'wordchoice', note: "A strait is a narrow channel of water; straight means not bent." }],
      },
      {
        text: "The plasterwork freeze runs the whole length of the upper hall.",
        errors: [{ wrong: "freeze", fix: "frieze", kind: 'wordchoice', note: "A frieze is a band of decoration; to freeze is to turn to ice." }],
      },
      {
        text: "The report said the express had overtook the stopping service on the fast line.",
        errors: [{ wrong: "overtook", fix: "overtaken", kind: 'grammar', note: "Had takes the participle overtaken; overtook is the simple past." }],
      },
    ],
  },
  {
    num: 104,
    quizId: 'stet-10-28-26',
    live: '2026-10-28',
    dateLabel: 'October 28, 2026',
    sunday: false,
    items: [
      {
        text: "The trust said the hedgerow had been laid by hand and would thicken from the base.",
        errors: [],
        cleanNote: "Clean copy: laid is right for a hedge worked by hand, and thicken is the word wanted.",
      },
      {
        text: "Residents were told the new tacks on second homes would pay for the depot.",
        errors: [{ wrong: "tacks", fix: "tax", kind: 'wordchoice', note: "Tax is the charge; tacks are small nails, or changes of course." }],
      },
      {
        text: "The landlord said the tenet had left without notice and owed two quarters.",
        errors: [{ wrong: "tenet", fix: "tenant", kind: 'wordchoice', note: "A tenant rents a property; a tenet is a principle held to be true." }],
      },
      {
        text: "The forecaster said the risk to the coast depend on where the front stalls.",
        errors: [{ wrong: "depend", fix: "depends", kind: 'grammar', note: "The subject is the risk, which is singular, so the verb is depends." }],
      },
      {
        text: "The examiners said the paper had been marked to the published criteria.",
        errors: [],
        cleanNote: "Clean copy: criteria is the right plural here, since there is more than one.",
      },
    ],
  },
  {
    num: 105,
    quizId: 'stet-10-29-26',
    live: '2026-10-29',
    dateLabel: 'October 29, 2026',
    sunday: false,
    items: [
      {
        text: "The manager said the equaliser come far too late to change the table.",
        errors: [{ wrong: "come", fix: "came", kind: 'grammar', note: "The simple past is came; come is the participle, as in has come." }],
      },
      {
        text: "The clinic reported an elicit supply of the drug on the ward.",
        errors: [{ wrong: "elicit", fix: "illicit", kind: 'wordchoice', note: "Illicit means unlawful; to elicit is to draw out." }],
      },
      {
        text: "The gallery said the frame was not original but had been made to match.",
        errors: [],
        cleanNote: "Clean copy: made to match is plainly put, and original is used correctly.",
      },
      {
        text: "The mill was fined for pumping affluent into the beck below the weir.",
        errors: [{ wrong: "affluent", fix: "effluent", kind: 'wordchoice', note: "Effluent is waste liquid; affluent means wealthy." }],
      },
      {
        text: "The bough of the trawler had been stove in by the swell off the point.",
        errors: [{ wrong: "bough", fix: "bow", kind: 'wordchoice', note: "The bow is the front of a boat; a bough is a branch of a tree." }],
      },
    ],
  },
  {
    num: 106,
    quizId: 'stet-10-30-26',
    live: '2026-10-30',
    dateLabel: 'October 30, 2026',
    sunday: false,
    items: [
      {
        text: "The chair said the pole had been well attended for a wet Thursday in October.",
        errors: [{ wrong: "pole", fix: "poll", kind: 'wordchoice', note: "A poll is a vote or a survey; a pole is a long rod." }],
      },
      {
        text: "The chef said the stock had been skimmed and left to clear overnight.",
        errors: [],
        cleanNote: "Clean copy: skimmed and clear are both kitchen senses, and nothing here is amiss.",
      },
      {
        text: "The farmer said the two flocks makes about six hundred head between them.",
        errors: [{ wrong: "makes", fix: "make", kind: 'grammar', note: "Two flocks is plural, so the verb is make." }],
      },
      {
        text: "The operator said the last train had been retimed to connect with the ferry.",
        errors: [],
        cleanNote: "Clean copy: retimed is right for a changed departure, and connect is the word wanted.",
      },
      {
        text: "The judge called the offence venal rather than serious and imposed no penalty.",
        errors: [{ wrong: "venal", fix: "venial", kind: 'wordchoice', note: "A venial fault is a pardonable one; venal means open to bribery." }],
      },
    ],
  },
  {
    num: 107,
    quizId: 'stet-10-31-26',
    live: '2026-10-31',
    dateLabel: 'October 31, 2026',
    sunday: false,
    items: [
      {
        text: "The head said the trip had been postponed rather than cancelled outright.",
        errors: [],
        cleanNote: "Clean copy: postponed and cancelled are both used correctly, and the difference is real.",
      },
      {
        text: "The board called the takeover a gambol that had not come off.",
        errors: [{ wrong: "gambol", fix: "gamble", kind: 'wordchoice', note: "A gamble is a risk taken; to gambol is to frolic." }],
      },
      {
        text: "The section had been stained with a blue die before it went under the lens.",
        errors: [{ wrong: "die", fix: "dye", kind: 'wordchoice', note: "A dye colours things; a die is a stamp, or a cube for games." }],
      },
      {
        text: "The forecaster said the risk of flooding rise sharply after two wet days.",
        errors: [{ wrong: "rise", fix: "rises", kind: 'grammar', note: "The risk is singular, so the verb is rises." }],
      },
      {
        text: "The percussionist struck the symbol on the last bar and the hall went quiet.",
        errors: [{ wrong: "symbol", fix: "cymbal", kind: 'wordchoice', note: "A cymbal is the percussion instrument; a symbol stands for something." }],
      },
    ],
  },
  {
    num: 108,
    quizId: 'stet-11-1-26',
    live: '2026-11-01',
    dateLabel: 'November 1, 2026',
    sunday: true,
    items: [
      {
        text: "The skipper said the chart showed a shear drop beyond the reef, and that none of the crew worn a lifejacket.",
        errors: [{ wrong: "shear", fix: "sheer", kind: 'wordchoice', note: "Sheer means steep or utter; to shear is to cut." }, { wrong: "worn", fix: "wore", kind: 'grammar', note: "The simple past is wore; worn is the participle, as in had worn." }],
      },
      {
        text: "The chief executive said staff moral had never been lower, and that the changes had not been explained clear to anyone.",
        errors: [{ wrong: "moral", fix: "morale", kind: 'wordchoice', note: "Morale is spirit within a group; a moral is the lesson of a story." }, { wrong: "clear", fix: "clearly", kind: 'grammar', note: "Explained is a verb, so it takes the adverb clearly." }],
      },
      {
        text: "The conservation laboratory said the rig stimulates a century of handling in a week.",
        errors: [{ wrong: "stimulates", fix: "simulates", kind: 'wordchoice', note: "To simulate is to imitate; to stimulate is to encourage." }],
      },
      {
        text: "The court heard the defendant drunk four pints at lunchtime before taking the weal.",
        errors: [{ wrong: "drunk", fix: "drank", kind: 'grammar', note: "The simple past is drank; drunk is the participle, as in has drunk." }, { wrong: "weal", fix: "wheel", kind: 'wordchoice', note: "A wheel steers the car; a weal is a raised mark on the skin." }],
      },
      {
        text: "The rare gull was cited on the estuary in March, and the warden said the losses at the tern colony looked systematic rather than local.",
        errors: [{ wrong: "cited", fix: "sighted", kind: 'wordchoice', note: "Sighted means seen; cited means quoted or summoned." }, { wrong: "systematic", fix: "systemic", kind: 'wordchoice', note: "Systemic means affecting the whole system; systematic means methodical." }],
      },
      {
        text: "The trust said the new clinic would be nurse-led and open on Saturdays.",
        errors: [],
        cleanNote: "Clean copy: nurse-led is correctly hyphenated and open on Saturdays is plainly put.",
      },
      {
        text: "The estate said the ewes had been tupped in November and would lamb in April.",
        errors: [],
        cleanNote: "Clean copy: tupped is the farming word for putting rams to ewes, and lamb is a verb.",
      },
    ],
  },
  {
    num: 109,
    quizId: 'stet-11-2-26',
    live: '2026-11-02',
    dateLabel: 'November 2, 2026',
    sunday: false,
    items: [
      {
        text: "The pub said the pies were made on the premises and sold out by eight.",
        errors: [],
        cleanNote: "Clean copy: premises is the word for the building, and it carries its plural s.",
      },
      {
        text: "The inspector said the gait at the crossing had been left open all night.",
        errors: [{ wrong: "gait", fix: "gate", kind: 'wordchoice', note: "A gate swings on hinges; gait is a way of walking." }],
      },
      {
        text: "The council said the consultation had run for eight weeks and drawn ninety replies.",
        errors: [],
        cleanNote: "Clean copy: drawn is the right participle after had, and run is used correctly.",
      },
      {
        text: "The moor turns a deep hew of purple for a fortnight in August.",
        errors: [{ wrong: "hew", fix: "hue", kind: 'wordchoice', note: "A hue is a colour; to hew is to cut or chop." }],
      },
      {
        text: "The jockey ridden a patient race and came through in the last two furlongs.",
        errors: [{ wrong: "ridden", fix: "rode", kind: 'grammar', note: "The simple past is rode; ridden is the participle, as in has ridden." }],
      },
    ],
  },
  {
    num: 110,
    quizId: 'stet-11-3-26',
    live: '2026-11-03',
    dateLabel: 'November 3, 2026',
    sunday: false,
    items: [
      {
        text: "The inquest heard the pilot had been the soul survivor of the crash.",
        errors: [{ wrong: "soul", fix: "sole", kind: 'wordchoice', note: "Sole means only; a soul is the spirit." }],
      },
      {
        text: "The guidance proscribes the drug for children under twelve, and tells doctors to offer it first.",
        errors: [{ wrong: "proscribes", fix: "prescribes", kind: 'wordchoice', note: "To prescribe is to order or recommend; to proscribe is to forbid." }],
      },
      {
        text: "The firm said its chairman want a decision from the board by Friday.",
        errors: [{ wrong: "want", fix: "wants", kind: 'grammar', note: "The chairman is singular, so the verb is wants." }],
      },
      {
        text: "The museum said the mask had been worn in a right of passage on the island.",
        errors: [{ wrong: "right", fix: "rite", kind: 'wordchoice', note: "A rite is a ceremony; right is correct, or an entitlement." }],
      },
      {
        text: "The coastguard said the flare had been seen from the cliff path at midnight.",
        errors: [],
        cleanNote: "Clean copy: a flare is what was fired, and seen from the cliff path is plainly put.",
      },
    ],
  },
  {
    num: 111,
    quizId: 'stet-11-4-26',
    live: '2026-11-04',
    dateLabel: 'November 4, 2026',
    sunday: false,
    items: [
      {
        text: "The council said the site had been left baron for a decade behind hoardings.",
        errors: [{ wrong: "baron", fix: "barren", kind: 'wordchoice', note: "Barren means unproductive; a baron is a nobleman." }],
      },
      {
        text: "The leak had sprang from a cracked main under the car park.",
        errors: [{ wrong: "sprang", fix: "sprung", kind: 'grammar', note: "Had takes the participle sprung; sprang is the simple past." }],
      },
      {
        text: "The teacher said the play had been caste from the whole of the second year.",
        errors: [{ wrong: "caste", fix: "cast", kind: 'wordchoice', note: "To cast a play is to choose its actors; a caste is a social class." }],
      },
      {
        text: "Forecasters said the storm could reek havoc on exposed western coasts.",
        errors: [{ wrong: "reek", fix: "wreak", kind: 'wordchoice', note: "To wreak havoc is to cause it; to reek is to stink." }],
      },
      {
        text: "The team swum the relay in a time that would have won last year's final.",
        errors: [{ wrong: "swum", fix: "swam", kind: 'grammar', note: "The simple past is swam; swum is the participle, as in has swum." }],
      },
    ],
  },
  {
    num: 112,
    quizId: 'stet-11-5-26',
    live: '2026-11-05',
    dateLabel: 'November 5, 2026',
    sunday: false,
    items: [
      {
        text: "The court heard he stolen the tools from a van parked outside the depot.",
        errors: [{ wrong: "stolen", fix: "stole", kind: 'grammar', note: "The simple past is stole; stolen is the participle, as in had stolen." }],
      },
      {
        text: "The firm said it had joined the gild of master builders in 1974.",
        errors: [{ wrong: "gild", fix: "guild", kind: 'wordchoice', note: "A guild is an association of tradespeople; to gild is to cover in gold." }],
      },
      {
        text: "The trust said the pond had been dug out and would refill with the winter rain.",
        errors: [],
        cleanNote: "Clean copy: dug out is right for clearing a pond, and refill is the word wanted.",
      },
      {
        text: "Engineers said the ballast had washed out and left the sleepers to flout in the water.",
        errors: [{ wrong: "flout", fix: "float", kind: 'wordchoice', note: "To float is to rest on water; to flout is to defy a rule." }],
      },
      {
        text: "The baker said the dough should be need for ten minutes and no longer.",
        errors: [{ wrong: "need", fix: "knead", kind: 'wordchoice', note: "To knead dough is to work it with the hands; need is to require." }],
      },
    ],
  },
  {
    num: 113,
    quizId: 'stet-11-6-26',
    live: '2026-11-06',
    dateLabel: 'November 6, 2026',
    sunday: false,
    items: [
      {
        text: "The programme opened with the composer's early sweet for strings.",
        errors: [{ wrong: "sweet", fix: "suite", kind: 'wordchoice', note: "A suite is a set of pieces, or of rooms; sweet is the taste." }],
      },
      {
        text: "The trust said the trial had been halted early because the benefit was clear.",
        errors: [],
        cleanNote: "Clean copy: halted early is plainly put, and benefit is the word wanted.",
      },
      {
        text: "The council said the contract would go to whomever bids the lowest.",
        errors: [{ wrong: "whomever", fix: "whoever", kind: 'grammar', note: "The pronoun is the subject of bids, so it is whoever." }],
      },
      {
        text: "The harbour said the slipway had been resurfaced and would reopen at the weekend.",
        errors: [],
        cleanNote: "Clean copy: slipway is the right word for the ramp, and resurfaced is plainly put.",
      },
      {
        text: "The club said the pitch showed the ware of a long and wet season.",
        errors: [{ wrong: "ware", fix: "wear", kind: 'wordchoice', note: "Wear is damage from use; ware is goods offered for sale." }],
      },
    ],
  },
  {
    num: 114,
    quizId: 'stet-11-7-26',
    live: '2026-11-07',
    dateLabel: 'November 7, 2026',
    sunday: false,
    items: [
      {
        text: "The head said each pupil attend one residential trip in the course of a year.",
        errors: [{ wrong: "attend", fix: "attends", kind: 'grammar', note: "Each pupil is singular, so the verb is attends." }],
      },
      {
        text: "The contractor will sew the top field with a grass ley in the spring.",
        errors: [{ wrong: "sew", fix: "sow", kind: 'wordchoice', note: "To sow is to plant seed; to sew is to stitch cloth." }],
      },
      {
        text: "The forecaster said the fog would lift once the due had burned off the fields.",
        errors: [{ wrong: "due", fix: "dew", kind: 'wordchoice', note: "Dew is moisture that settles overnight; due means owing or expected." }],
      },
      {
        text: "The firm said the fraud had been perpetuated by a single employee in accounts.",
        errors: [{ wrong: "perpetuated", fix: "perpetrated", kind: 'wordchoice', note: "To perpetrate is to commit; to perpetuate is to make something continue." }],
      },
      {
        text: "The team said the sample had been sealed at the site and opened in the laboratory.",
        errors: [],
        cleanNote: "Clean copy: sealed and opened are plainly put, and laboratory is spelled correctly.",
      },
    ],
  },
  {
    num: 115,
    quizId: 'stet-11-8-26',
    live: '2026-11-08',
    dateLabel: 'November 8, 2026',
    sunday: true,
    items: [
      {
        text: "The catalogue essay was criticised for its turbid prose and its thin research.",
        errors: [{ wrong: "turbid", fix: "turgid", kind: 'wordchoice', note: "Turgid prose is swollen and pompous; turbid means cloudy with sediment." }],
      },
      {
        text: "The sourdough is proved for eighteen hours before it goes into the oven.",
        errors: [],
        cleanNote: "Clean copy: proved is the baker's word for letting dough rise, and it is right here.",
      },
      {
        text: "The caterpillar is a veracious feeder and can strip a young tree in days.",
        errors: [{ wrong: "veracious", fix: "voracious", kind: 'wordchoice', note: "Voracious means greedy; veracious means truthful." }],
      },
      {
        text: "The council said two of its lorries had stood idol since May, and that the yard had not been secured proper since then.",
        errors: [{ wrong: "idol", fix: "idle", kind: 'wordchoice', note: "Idle means unused; an idol is an image or a person who is worshipped." }, { wrong: "proper", fix: "properly", kind: 'grammar', note: "Secured is a verb, so it takes the adverb properly." }],
      },
      {
        text: "The trust said there had been fewer disruption this winter than last.",
        errors: [{ wrong: "fewer", fix: "less", kind: 'wordchoice', note: "Disruption is a mass noun, so it takes less." }],
      },
      {
        text: "The station said the boat leaves by the shoot, and that a launch on a spring tide take under two minutes.",
        errors: [{ wrong: "shoot", fix: "chute", kind: 'wordchoice', note: "A chute is a sloping channel; to shoot is to fire." }, { wrong: "take", fix: "takes", kind: 'grammar', note: "A launch is singular, so the verb is takes." }],
      },
      {
        text: "The judge said the punishment meat out by the magistrates was too light, and that the new fine reflect the scale of the profit.",
        errors: [{ wrong: "meat", fix: "mete", kind: 'wordchoice', note: "To mete out a punishment is to deal it out; meat is flesh for eating." }, { wrong: "reflect", fix: "reflects", kind: 'grammar', note: "The fine is singular, so the verb is reflects." }],
      },
    ],
  },
  {
    num: 116,
    quizId: 'stet-11-9-26',
    live: '2026-11-09',
    dateLabel: 'November 9, 2026',
    sunday: false,
    items: [
      {
        text: "The club said the appeal against the red card had been dismissed and the ban stands.",
        errors: [],
        cleanNote: "Clean copy: dismissed is right for an appeal that fails, and the ban stands is plain.",
      },
      {
        text: "The paper's revue of the exhibition ran to a full page on Saturday.",
        errors: [{ wrong: "revue", fix: "review", kind: 'wordchoice', note: "A review is a critical notice; a revue is a stage show of sketches." }],
      },
      {
        text: "The board voted to censure the letters before they went into the file.",
        errors: [{ wrong: "censure", fix: "censor", kind: 'wordchoice', note: "To censor is to cut material out; to censure is to condemn." }],
      },
      {
        text: "The dyke had stank for a week before anyone traced the discharge.",
        errors: [{ wrong: "stank", fix: "stunk", kind: 'grammar', note: "Had takes the participle stunk; stank is the simple past." }],
      },
      {
        text: "The beach was closed for a week after unexploded ordinance was found in the dunes.",
        errors: [{ wrong: "ordinance", fix: "ordnance", kind: 'wordchoice', note: "Ordnance is munitions; an ordinance is a decree." }],
      },
    ],
  },
  {
    num: 117,
    quizId: 'stet-11-10-26',
    live: '2026-11-10',
    dateLabel: 'November 10, 2026',
    sunday: false,
    items: [
      {
        text: "The porter found the patient prostate on the floor of the day room.",
        errors: [{ wrong: "prostate", fix: "prostrate", kind: 'wordchoice', note: "Prostrate means lying face down; the prostate is a gland." }],
      },
      {
        text: "The company said the write-down reflected a drop in the value of its yards.",
        errors: [],
        cleanNote: "Clean copy: write-down is the accounting term and reflected is used correctly.",
      },
      {
        text: "The head said this changes had been agreed with staff before half term.",
        errors: [{ wrong: "this", fix: "these", kind: 'grammar', note: "Changes is plural, so the demonstrative is these." }],
      },
      {
        text: "The pilot said the vessel had swung to the ebb and cleared the bar at first light.",
        errors: [],
        cleanNote: "Clean copy: swung to the ebb is the right phrase, and cleared the bar is plainly put.",
      },
      {
        text: "The tide backed up the creak and put a foot of water across the lane.",
        errors: [{ wrong: "creak", fix: "creek", kind: 'wordchoice', note: "A creek is a narrow inlet or a small stream; a creak is a noise." }],
      },
    ],
  },
  {
    num: 118,
    quizId: 'stet-11-11-26',
    live: '2026-11-11',
    dateLabel: 'November 11, 2026',
    sunday: false,
    items: [
      {
        text: "The work begun in March and the platform is still behind hoardings.",
        errors: [{ wrong: "begun", fix: "began", kind: 'grammar', note: "The simple past is began; begun is the participle, as in has begun." }],
      },
      {
        text: "The statute in the market square was cleaned and rewaxed over the summer.",
        errors: [{ wrong: "statute", fix: "statue", kind: 'wordchoice', note: "A statue is the carved figure; a statute is an act of parliament." }],
      },
      {
        text: "The council appointed an imminent planner to chair the review of the local plan.",
        errors: [{ wrong: "imminent", fix: "eminent", kind: 'wordchoice', note: "Eminent means distinguished; imminent means about to happen." }],
      },
      {
        text: "The barn held a horde of old machinery that had not moved in thirty years.",
        errors: [{ wrong: "horde", fix: "hoard", kind: 'wordchoice', note: "A hoard is a store laid by; a horde is a crowd." }],
      },
      {
        text: "The court said the tenant had been given proper notice and dismissed the claim.",
        errors: [],
        cleanNote: "Clean copy: proper notice is the phrase, and dismissed the claim is plainly put.",
      },
    ],
  },
  {
    num: 119,
    quizId: 'stet-11-12-26',
    live: '2026-11-12',
    dateLabel: 'November 12, 2026',
    sunday: false,
    items: [
      {
        text: "The team said the survey had been systemic rather than opportunistic.",
        errors: [{ wrong: "systemic", fix: "systematic", kind: 'wordchoice', note: "Systematic means methodical; systemic means affecting a whole system." }],
      },
      {
        text: "The cost of the agency cover has been born by the trust for two years.",
        errors: [{ wrong: "born", fix: "borne", kind: 'grammar', note: "Borne is the participle of bear in this sense; born is about birth." }],
      },
      {
        text: "The firm said the machinery had been deprecated over ten years in the accounts.",
        errors: [{ wrong: "deprecated", fix: "depreciated", kind: 'wordchoice', note: "To depreciate is to lose value over time; to deprecate is to disapprove." }],
      },
      {
        text: "The wine was described as having a palette of red fruit and a long finish.",
        errors: [{ wrong: "palette", fix: "palate", kind: 'wordchoice', note: "The palate is the sense of taste; a palette holds an artist’s colours." }],
      },
      {
        text: "The manager said the side done enough in the second half to take a point.",
        errors: [{ wrong: "done", fix: "did", kind: 'grammar', note: "The simple past is did; done needs an auxiliary, as in has done." }],
      },
    ],
  },
  {
    num: 120,
    quizId: 'stet-11-13-26',
    live: '2026-11-13',
    dateLabel: 'November 13, 2026',
    sunday: false,
    items: [
      {
        text: "The skipper said the hall had been the best of a poor season for the fleet.",
        errors: [{ wrong: "hall", fix: "haul", kind: 'wordchoice', note: "A haul is a catch or a load; a hall is a room." }],
      },
      {
        text: "The council said its a matter for the planning inspector and not for members.",
        errors: [{ wrong: "its", fix: "it's", kind: 'grammar', note: "It's is short for it is; its is the possessive." }],
      },
      {
        text: "The head said the change would lesson the burden on the pastoral team.",
        errors: [{ wrong: "lesson", fix: "lessen", kind: 'wordchoice', note: "To lessen is to reduce; a lesson is what is taught." }],
      },
      {
        text: "A pine martin was caught on camera above the beck for the first time.",
        errors: [{ wrong: "martin", fix: "marten", kind: 'wordchoice', note: "A marten is the animal; a martin is a bird." }],
      },
      {
        text: "The gallery said the drawing had been mounted on acid-free board and reframed.",
        errors: [],
        cleanNote: "Clean copy: acid-free board is right and reframed is the word wanted.",
      },
    ],
  },
  {
    num: 121,
    quizId: 'stet-11-14-26',
    live: '2026-11-14',
    dateLabel: 'November 14, 2026',
    sunday: false,
    items: [
      {
        text: "The judge said the reasoning of the tribunal alludes him entirely.",
        errors: [{ wrong: "alludes", fix: "eludes", kind: 'wordchoice', note: "To elude someone is to escape them; to allude is to refer indirectly." }],
      },
      {
        text: "The rower said the crew had come through the field in the last five hundred metres.",
        errors: [],
        cleanNote: "Clean copy: come through the field is the right phrase and the tense is correct.",
      },
      {
        text: "The trust said the ward would take its first patients on Monday morning.",
        errors: [],
        cleanNote: "Clean copy: its is the possessive here and rightly carries no apostrophe.",
      },
      {
        text: "The temperature fell sharp overnight and the roads froze before dawn.",
        errors: [{ wrong: "sharp", fix: "sharply", kind: 'grammar', note: "Fell is a verb, so it takes the adverb sharply." }],
      },
      {
        text: "The chef said good fish had grown so deer that he had changed the menu.",
        errors: [{ wrong: "deer", fix: "dear", kind: 'wordchoice', note: "Dear means costly; a deer is the animal." }],
      },
    ],
  },
  {
    num: 122,
    quizId: 'stet-11-15-26',
    live: '2026-11-15',
    dateLabel: 'November 15, 2026',
    sunday: true,
    items: [
      {
        text: "The tenner sang the part from memory after the score went missing.",
        errors: [{ wrong: "tenner", fix: "tenor", kind: 'wordchoice', note: "A tenor is the singer; a tenner is a ten-pound note." }],
      },
      {
        text: "The tug took the barge under toe as far as the lock and cast off there.",
        errors: [{ wrong: "toe", fix: "tow", kind: 'wordchoice', note: "To tow is to pull; a toe is on the foot." }],
      },
      {
        text: "The report counted a rising incidents of fly-tipping, and the council said its crews had responded prompt in every case.",
        errors: [{ wrong: "incidents", fix: "incidence", kind: 'wordchoice', note: "Incidence is the rate at which something occurs; incidents are single events." }, { wrong: "prompt", fix: "promptly", kind: 'grammar', note: "Responded is a verb, so it takes the adverb promptly." }],
      },
      {
        text: "The valley floor is luxurious with fern from the beck to the tree line.",
        errors: [{ wrong: "luxurious", fix: "luxuriant", kind: 'wordchoice', note: "Luxuriant means growing thickly; luxurious means costly and comfortable." }],
      },
      {
        text: "The court heard a long legal wangle over the estate, and that the solicitor written to the family only in June.",
        errors: [{ wrong: "wangle", fix: "wrangle", kind: 'wordchoice', note: "A wrangle is a dispute; to wangle is to get by contrivance." }, { wrong: "written", fix: "wrote", kind: 'grammar', note: "The simple past is wrote; written is the participle, as in had written." }],
      },
      {
        text: "The operator said the diversion would add twenty minutes to the evening journey.",
        errors: [],
        cleanNote: "Clean copy: diversion is the right word and add twenty minutes is plainly put.",
      },
      {
        text: "The auctioneer said the store cattle had made more than last year in spite of the drought.",
        errors: [],
        cleanNote: "Clean copy: store cattle are beasts sold on to be fattened, and made is the sale sense.",
      },
    ],
  },
  {
    num: 123,
    quizId: 'stet-11-16-26',
    live: '2026-11-16',
    dateLabel: 'November 16, 2026',
    sunday: false,
    items: [
      {
        text: "The trust said the outbreak had been contained and the ward would reopen.",
        errors: [],
        cleanNote: "Clean copy: contained is the right word for an outbreak held in check.",
      },
      {
        text: "The upper tear of the stand was closed for the whole of the second half.",
        errors: [{ wrong: "tear", fix: "tier", kind: 'wordchoice', note: "A tier is a level or row; a tear is a rip, or a drop from the eye." }],
      },
      {
        text: "The council said the grant had been ring-fenced for flood works and could not be moved.",
        errors: [],
        cleanNote: "Clean copy: ring-fenced is the right term for money set aside, and it is hyphenated.",
      },
      {
        text: "The firm said the cargo had not been ensured and the loss fell on the yard.",
        errors: [{ wrong: "ensured", fix: "insured", kind: 'wordchoice', note: "To insure is to cover against loss; to ensure is to make certain." }],
      },
      {
        text: "The gauge had not been reading accurate since the flood in February.",
        errors: [{ wrong: "accurate", fix: "accurately", kind: 'grammar', note: "Reading is a verb here, so it takes the adverb accurately." }],
      },
    ],
  },
  {
    num: 124,
    quizId: 'stet-11-17-26',
    live: '2026-11-17',
    dateLabel: 'November 17, 2026',
    sunday: false,
    items: [
      {
        text: "The defendant was seen to exalt on the steps outside the court.",
        errors: [{ wrong: "exalt", fix: "exult", kind: 'wordchoice', note: "To exult is to rejoice openly; to exalt is to raise up or praise." }],
      },
      {
        text: "The stopping service gone into the loop before the express came through.",
        errors: [{ wrong: "gone", fix: "went", kind: 'grammar', note: "The simple past is went; gone is the participle, as in had gone." }],
      },
      {
        text: "The curator said the broach had been found by a detectorist in a ploughed field.",
        errors: [{ wrong: "broach", fix: "brooch", kind: 'wordchoice', note: "A brooch is the pin worn on clothing; to broach is to raise a subject." }],
      },
      {
        text: "The milk was carried up from the parlour in a pale as it always had been.",
        errors: [{ wrong: "pale", fix: "pail", kind: 'wordchoice', note: "A pail is a bucket; pale means light in colour." }],
      },
      {
        text: "The head said the fire alarm is tested regular and the log is kept in the office.",
        errors: [{ wrong: "regular", fix: "regularly", kind: 'grammar', note: "Tested is a verb, so it takes the adverb regularly." }],
      },
    ],
  },
  {
    num: 125,
    quizId: 'stet-11-18-26',
    live: '2026-11-18',
    dateLabel: 'November 18, 2026',
    sunday: false,
    items: [
      {
        text: "The figures shows a fall in fly-tipping for the third quarter running.",
        errors: [{ wrong: "shows", fix: "show", kind: 'grammar', note: "Figures is plural, so the verb is show." }],
      },
      {
        text: "The serf broke clean over the bar and the crew turned back to the harbour.",
        errors: [{ wrong: "serf", fix: "surf", kind: 'wordchoice', note: "Surf is breaking waves; a serf was a feudal labourer." }],
      },
      {
        text: "The grant is meant to simulate research into flood defences in upland catchments.",
        errors: [{ wrong: "simulate", fix: "stimulate", kind: 'wordchoice', note: "To stimulate is to encourage; to simulate is to imitate." }],
      },
      {
        text: "The forecaster said the wind would back south-westerly and the rain would ease.",
        errors: [],
        cleanNote: "Clean copy: back is the right term for a wind shifting anticlockwise.",
      },
      {
        text: "The kitchen said the truffle's cent filled the room the moment the tin opened.",
        errors: [{ wrong: "cent", fix: "scent", kind: 'wordchoice', note: "A scent is a smell; a cent is a coin." }],
      },
    ],
  },
  {
    num: 126,
    quizId: 'stet-11-19-26',
    live: '2026-11-19',
    dateLabel: 'November 19, 2026',
    sunday: false,
    items: [
      {
        text: "The single skull capsized above the weir and the crew swam to the bank.",
        errors: [{ wrong: "skull", fix: "scull", kind: 'wordchoice', note: "A scull is a light racing boat, or its oar; a skull is bone." }],
      },
      {
        text: "Counsel made an illusion to an earlier case that the judge said was not on point.",
        errors: [{ wrong: "illusion", fix: "allusion", kind: 'wordchoice', note: "An allusion is an indirect reference; an illusion is a false impression." }],
      },
      {
        text: "The firm said this had been the worse year for orders since 2009.",
        errors: [{ wrong: "worse", fix: "worst", kind: 'grammar', note: "Comparing with every other year takes the superlative worst." }],
      },
      {
        text: "The pidgin loft at the end of the allotments has been there since the war.",
        errors: [{ wrong: "pidgin", fix: "pigeon", kind: 'wordchoice', note: "A pigeon is the bird; a pidgin is a simplified language." }],
      },
      {
        text: "The trust said the drug had been licensed for adults and would not be given to children.",
        errors: [],
        cleanNote: "Clean copy: licensed is the right spelling for the verb, and the sentence is plain.",
      },
    ],
  },
  {
    num: 127,
    quizId: 'stet-11-20-26',
    live: '2026-11-20',
    dateLabel: 'November 20, 2026',
    sunday: false,
    items: [
      {
        text: "The council said the depot lease had been renewed for a further five years.",
        errors: [],
        cleanNote: "Clean copy: lease and renewed are both used correctly and nothing hides here.",
      },
      {
        text: "The lifeboat was launched twice in the night and both crews were back by dawn.",
        errors: [],
        cleanNote: "Clean copy: launched and back by dawn are plainly put, with nothing to tap.",
      },
      {
        text: "The company staged a mask in the great hall for the first time since 1911.",
        errors: [{ wrong: "mask", fix: "masque", kind: 'wordchoice', note: "A masque is a courtly entertainment; a mask covers the face." }],
      },
      {
        text: "The head said her and the deputy had visited every class before half term.",
        errors: [{ wrong: "her", fix: "she", kind: 'grammar', note: "The pronoun is a subject here: she and the deputy visited." }],
      },
      {
        text: "The fence steak had rotted at the base and the wire had gone slack.",
        errors: [{ wrong: "steak", fix: "stake", kind: 'wordchoice', note: "A stake is a post driven into the ground; a steak is a cut of meat." }],
      },
    ],
  },
  {
    num: 128,
    quizId: 'stet-11-21-26',
    live: '2026-11-21',
    dateLabel: 'November 21, 2026',
    sunday: false,
    items: [
      {
        text: "The study found no casual link between the two conditions in adults.",
        errors: [{ wrong: "casual", fix: "causal", kind: 'wordchoice', note: "A causal link is one of cause and effect; casual means informal." }],
      },
      {
        text: "The firm said its personal costs had risen by a fifth since the new depot opened.",
        errors: [{ wrong: "personal", fix: "personnel", kind: 'wordchoice', note: "Personnel are the staff; personal means private or individual." }],
      },
      {
        text: "The restaurant said the tasting menu had been pared back from nine courses to five.",
        errors: [],
        cleanNote: "Clean copy: pared back is right for trimming something down.",
      },
      {
        text: "The two instruments requires calibration at the start of every season.",
        errors: [{ wrong: "requires", fix: "require", kind: 'grammar', note: "Two instruments is plural, so the verb is require." }],
      },
      {
        text: "The line's clime out of the valley is the steepest on the network.",
        errors: [{ wrong: "clime", fix: "climb", kind: 'wordchoice', note: "A climb is an ascent; a clime is a region or its climate." }],
      },
    ],
  },
  {
    num: 129,
    quizId: 'stet-11-22-26',
    live: '2026-11-22',
    dateLabel: 'November 22, 2026',
    sunday: true,
    items: [
      {
        text: "The court heard the entrance had not been adopted for wheelchair users, and that the dispute now lies between the landlord and we.",
        errors: [{ wrong: "adopted", fix: "adapted", kind: 'wordchoice', note: "To adapt is to alter for a purpose; to adopt is to take up or take on." }, { wrong: "we", fix: "us", kind: 'grammar', note: "After between the pronoun takes the object case: the landlord and us." }],
      },
      {
        text: "The trust gave an officious reply to a complaint about the discharge letter.",
        errors: [{ wrong: "officious", fix: "official", kind: 'wordchoice', note: "Official means from the authority; officious means meddlesome." }],
      },
      {
        text: "The organ builder said the read pipes had been revoiced and the case rewired.",
        errors: [{ wrong: "read", fix: "reed", kind: 'wordchoice', note: "A reed vibrates to make the sound; read is what you do to a book." }],
      },
      {
        text: "The club said the manager had signed a contract to the end of the season.",
        errors: [],
        cleanNote: "Clean copy: signed a contract to the end of the season is plainly put and hides nothing.",
      },
      {
        text: "The gauge gives a continual record of the level, and the team said the ceiling of the borehole had failed in August.",
        errors: [{ wrong: "continual", fix: "continuous", kind: 'wordchoice', note: "Continuous means without a break; continual means repeated with gaps." }, { wrong: "ceiling", fix: "sealing", kind: 'wordchoice', note: "Sealing is closing something tight; a ceiling is overhead." }],
      },
      {
        text: "The council said no alternate site had been considered, and that officers had acted immediate once the objection arrived.",
        errors: [{ wrong: "alternate", fix: "alternative", kind: 'wordchoice', note: "An alternative is another option; alternate means every other one." }, { wrong: "immediate", fix: "immediately", kind: 'grammar', note: "Acted is a verb, so it takes the adverb immediately." }],
      },
      {
        text: "The boat tied up at the peer, and the crew said the pumps had been rigged quick enough to save her.",
        errors: [{ wrong: "peer", fix: "pier", kind: 'wordchoice', note: "A pier runs out into the water; a peer is an equal, or a lord." }, { wrong: "quick", fix: "quickly", kind: 'grammar', note: "Rigged is a verb, so it takes the adverb quickly." }],
      },
    ],
  },
  {
    num: 130,
    quizId: 'stet-11-23-26',
    live: '2026-11-23',
    dateLabel: 'November 23, 2026',
    sunday: false,
    items: [
      {
        text: "The leader accused the group of fermenting unrest at the back of the meeting.",
        errors: [{ wrong: "fermenting", fix: "fomenting", kind: 'wordchoice', note: "To foment trouble is to stir it up; to ferment is what yeast does." }],
      },
      {
        text: "The board was told the two schemes costs about the same over ten years.",
        errors: [{ wrong: "costs", fix: "cost", kind: 'grammar', note: "Two schemes is plural, so the verb is cost." }],
      },
      {
        text: "The college said the hostile above the workshops had been refurbished.",
        errors: [{ wrong: "hostile", fix: "hostel", kind: 'wordchoice', note: "A hostel provides beds; hostile means unfriendly." }],
      },
      {
        text: "The boat made twelve not against the ebb and still came in late.",
        errors: [{ wrong: "not", fix: "knot", kind: 'wordchoice', note: "A knot is a nautical mile an hour; not is the negative." }],
      },
      {
        text: "The warden said the swans had been ringed and would be tracked through the winter.",
        errors: [],
        cleanNote: "Clean copy: ringed is the right word for marking a bird, and tracked is plainly put.",
      },
    ],
  },
  {
    num: 131,
    quizId: 'stet-11-24-26',
    live: '2026-11-24',
    dateLabel: 'November 24, 2026',
    sunday: false,
    items: [
      {
        text: "The judge asked counsel for the rational behind the decision to prosecute.",
        errors: [{ wrong: "rational", fix: "rationale", kind: 'wordchoice', note: "A rationale is the reasoning behind something; rational means sensible." }],
      },
      {
        text: "The trust said the nurse had acted on the guidance in force at the time.",
        errors: [],
        cleanNote: "Clean copy: in force at the time is the right phrase and acted on is plainly put.",
      },
      {
        text: "The tapestry was wove in Flanders and hung here for three hundred years.",
        errors: [{ wrong: "wove", fix: "woven", kind: 'grammar', note: "The passive takes the participle woven; wove is the simple past." }],
      },
      {
        text: "The club said the tie would be replayed at the smaller ground on Tuesday.",
        errors: [],
        cleanNote: "Clean copy: a tie is the cup match itself, and replayed is the right word.",
      },
      {
        text: "The son broke through by noon and the ice was off the road by two.",
        errors: [{ wrong: "son", fix: "sun", kind: 'wordchoice', note: "The sun is in the sky; a son is a child." }],
      },
    ],
  },
  {
    num: 132,
    quizId: 'stet-11-25-26',
    live: '2026-11-25',
    dateLabel: 'November 25, 2026',
    sunday: false,
    items: [
      {
        text: "The grant will be dispersed in two payments, the second once the works are signed off.",
        errors: [{ wrong: "dispersed", fix: "disbursed", kind: 'wordchoice', note: "To disburse is to pay out money; to disperse is to scatter." }],
      },
      {
        text: "The line has bore the traffic of two routes since the coastal branch closed.",
        errors: [{ wrong: "bore", fix: "borne", kind: 'grammar', note: "Has takes the participle borne; bore is the simple past." }],
      },
      {
        text: "The list runs to forty whines, half of them from within fifty miles.",
        errors: [{ wrong: "whines", fix: "wines", kind: 'wordchoice', note: "Wine is the drink; a whine is a complaining noise." }],
      },
      {
        text: "The moss was found to harbour a might no bigger than a pinhead.",
        errors: [{ wrong: "might", fix: "mite", kind: 'wordchoice', note: "A mite is a tiny creature; might is power, or the past of may." }],
      },
      {
        text: "The yard was hit severe by the strike and lost two months of work.",
        errors: [{ wrong: "severe", fix: "severely", kind: 'grammar', note: "Hit is a verb, so it takes the adverb severely." }],
      },
    ],
  },
  {
    num: 133,
    quizId: 'stet-11-26-26',
    live: '2026-11-26',
    dateLabel: 'November 26, 2026',
    sunday: false,
    items: [
      {
        text: "The rota left the ward short when two nurses went sic on the same night.",
        errors: [{ wrong: "sic", fix: "sick", kind: 'wordchoice', note: "Sick means unwell; sic marks an error quoted from another text." }],
      },
      {
        text: "The judge praised that who had come forward to give evidence at the trial.",
        errors: [{ wrong: "that", fix: "those", kind: 'grammar', note: "The relative clause takes the demonstrative those: those who came forward." }],
      },
      {
        text: "The head said the cue for lunch stretched into the yard by half past twelve.",
        errors: [{ wrong: "cue", fix: "queue", kind: 'wordchoice', note: "A queue is a line of people; a cue is a signal, or a billiard stick." }],
      },
      {
        text: "The critic called the staging stayed and said the singing deserved better.",
        errors: [{ wrong: "stayed", fix: "staid", kind: 'wordchoice', note: "Staid means sober and unadventurous; stayed is the past of stay." }],
      },
      {
        text: "The farmer said the maize had been cut for silage and the clamp sheeted by Friday.",
        errors: [],
        cleanNote: "Clean copy: clamp and sheeted are the right words for how silage is stored.",
      },
    ],
  },
  {
    num: 134,
    quizId: 'stet-11-27-26',
    live: '2026-11-27',
    dateLabel: 'November 27, 2026',
    sunday: false,
    items: [
      {
        text: "The runner said she had trained through the winter and felt the benefit in the last mile.",
        errors: [],
        cleanNote: "Clean copy: felt the benefit is plainly put and trained through the winter is right.",
      },
      {
        text: "The recipe calls for a single egg yoke and no cream at all.",
        errors: [{ wrong: "yoke", fix: "yolk", kind: 'wordchoice', note: "The yolk is the yellow of an egg; a yoke joins two animals." }],
      },
      {
        text: "The council said the order would take effect in January and signs would go up.",
        errors: [],
        cleanNote: "Clean copy: take effect is the right phrase, and effect is the noun wanted here.",
      },
      {
        text: "The instrument had not been set exact and the whole run had to be repeated.",
        errors: [{ wrong: "exact", fix: "exactly", kind: 'grammar', note: "Set is a verb, so it takes the adverb exactly." }],
      },
      {
        text: "The rope was warn through where it had run over the gunwale for a season.",
        errors: [{ wrong: "warn", fix: "worn", kind: 'wordchoice', note: "Worn is the participle of wear; to warn is to give notice." }],
      },
    ],
  },
  {
    num: 135,
    quizId: 'stet-11-28-26',
    live: '2026-11-28',
    dateLabel: 'November 28, 2026',
    sunday: false,
    items: [
      {
        text: "The otter is seen frequent on the lower river now that the weir has gone.",
        errors: [{ wrong: "frequent", fix: "frequently", kind: 'grammar', note: "Seen is a verb, so it takes the adverb frequently." }],
      },
      {
        text: "The pamphlet says a poacher was hung outside the county prison in 1856.",
        errors: [{ wrong: "hung", fix: "hanged", kind: 'wordchoice', note: "People are hanged; pictures and curtains are hung." }],
      },
      {
        text: "The opera tells the tail of a fisherman who never comes home.",
        errors: [{ wrong: "tail", fix: "tale", kind: 'wordchoice', note: "A tale is a story; a tail is on an animal." }],
      },
      {
        text: "The operator said the timetable had been rewritten to build in more recovery time.",
        errors: [],
        cleanNote: "Clean copy: recovery time is the industry's own phrase for slack built into a timetable.",
      },
      {
        text: "The firm said the smaller van was more economic to run on short rounds.",
        errors: [{ wrong: "economic", fix: "economical", kind: 'wordchoice', note: "Economical means thrifty in use; economic relates to the economy." }],
      },
    ],
  },
  {
    num: 136,
    quizId: 'stet-11-29-26',
    live: '2026-11-29',
    dateLabel: 'November 29, 2026',
    sunday: true,
    items: [
      {
        text: "The bell was told for the lost crew at noon on the anniversary.",
        errors: [{ wrong: "told", fix: "tolled", kind: 'wordchoice', note: "A bell is tolled; told is the past of tell." }],
      },
      {
        text: "The team said the water below the weir was turgid with silt, and that the level had been rising constant since October.",
        errors: [{ wrong: "turgid", fix: "turbid", kind: 'wordchoice', note: "Turbid water is cloudy with sediment; turgid means swollen or pompous." }, { wrong: "constant", fix: "constantly", kind: 'grammar', note: "Rising is a verb, so it takes the adverb constantly." }],
      },
      {
        text: "The brewery said the hops had been picked late and dried in the oast.",
        errors: [],
        cleanNote: "Clean copy: an oast is the kiln where hops are dried, and picked late is plainly put.",
      },
      {
        text: "The witness said she had come to loath the whole process, and that two earlier claims had been settled private.",
        errors: [{ wrong: "loath", fix: "loathe", kind: 'wordchoice', note: "To loathe is to detest; loath means reluctant." }, { wrong: "private", fix: "privately", kind: 'grammar', note: "Settled is a verb, so it takes the adverb privately." }],
      },
      {
        text: "The trust said the audit had found no evidence of harm to any patient.",
        errors: [],
        cleanNote: "Clean copy: no evidence of harm is plainly put, and audit is the right word.",
      },
      {
        text: "The chair called the vote a momentary one for the town, and said those decision would not be revisited.",
        errors: [{ wrong: "momentary", fix: "momentous", kind: 'wordchoice', note: "Momentous means of great importance; momentary means lasting a moment." }, { wrong: "those", fix: "that", kind: 'grammar', note: "Decision is singular, so the demonstrative is that." }],
      },
      {
        text: "The archive said the film had been wound onto a new real and copied.",
        errors: [{ wrong: "real", fix: "reel", kind: 'wordchoice', note: "A reel holds the film; real means genuine." }],
      },
    ],
  },
  {
    num: 137,
    quizId: 'stet-11-30-26',
    live: '2026-11-30',
    dateLabel: 'November 30, 2026',
    sunday: false,
    items: [
      {
        text: "The council band the use of the field for car boot sales after complaints.",
        errors: [{ wrong: "band", fix: "banned", kind: 'wordchoice', note: "Banned means forbidden; a band is a group, or a strip." }],
      },
      {
        text: "The gallery said the exhibition would close on Sunday and tour in the new year.",
        errors: [],
        cleanNote: "Clean copy: close on Sunday and tour in the new year are both plainly put.",
      },
      {
        text: "The crack was obvious missed at the inspection two summers ago.",
        errors: [{ wrong: "obvious", fix: "obviously", kind: 'grammar', note: "Missed is a verb, so it takes the adverb obviously." }],
      },
      {
        text: "The club said tickets would go on sale on Thursday and be limited to four a person.",
        errors: [],
        cleanNote: "Clean copy: go on sale and limited to four a person are both plainly put.",
      },
      {
        text: "The head said a permanent physics teacher had proved illusive for two years.",
        errors: [{ wrong: "illusive", fix: "elusive", kind: 'wordchoice', note: "Elusive means hard to find or catch; illusive means deceptive." }],
      },
    ],
  },
];
