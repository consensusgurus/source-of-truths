#!/usr/bin/env node
// Build the Stet extension (2026-09-30 .. 2026-11-30) and print it in the exact
// textual shape app/stet/puzzles.js already uses.
//
//   node scripts/gen-stet.mjs            # print the boards
//   node scripts/gen-stet.mjs --audit    # print the variety ledger only
//
// WHY A SCRIPT FOR AUTHORED CONTENT. Stet is written, not searched: every
// sentence below was composed by hand and no machine can invent a good one. But
// three things around the prose ARE mechanical, and each of them has been got
// wrong in this bank before, so they live here rather than in a human's head:
//
//   1. num / quizId / dateLabel / sunday are DERIVED from `live`, never typed.
//      The calendar walks one day at a time from START, so a gap or a mistyped
//      Sunday flag is impossible by construction.
//   2. The variety ledger below is computed and enforced, not asserted. See
//      CEILINGS.
//   3. The day shape (how many clean sentences, how many errors, how many
//      grammar errors, how many two-error Sunday sentences) comes from the
//      SHAPE table, which was written to VARY. That matters: boards 26–75 of
//      the frozen bank sit at exactly 2 clean / 3 errors / 1 grammar every
//      single weekday and 2 clean / 5 errors on every Sunday, which is a floor
//      being used as a target. This segment runs 0–2 clean on weekdays and
//      6–10 errors on Sundays.
//   4. WHERE those clean sentences and that grammar slip SIT in the day, which
//      is a different property from how many of them there are and was the one
//      this script missed. Varying the counts (3) still let every Sunday put
//      its clean copy last and its grammar slip first, and the frozen segment
//      before it ran the same five-slot template for fifty days straight until
//      a reader wrote in (2026-09-09): "#2 and #4 are clean every single time."
//      Sentences within a day are independent, so the order is free, and free
//      means it has to be spent: the POSITION table below is computed and
//      enforced against the same ceilings verify-stet.mjs applies bank-wide.
//
// WHAT THE AUTHORING HAD TO RESPECT (all of it enforced by scripts/verify-stet.mjs):
//   · `wrong` appears exactly once in the sentence as a whitespace token, and
//     the client finds it with findIndex on the stripped token — so a `wrong`
//     carrying punctuation, or appearing twice, is a dead board.
//   · `fix` is ONE token and must not already appear in the sentence.
//   · The wrong→fix pair must be NEW: 287 pairs are already banked, and the
//     verifier fails a repeat. That is the binding constraint on runway; see
//     the note at the foot of this file.
//   · The pair must be RELATED (verify-stet.mjs `relation`): homophone,
//     inflection, closed-class form, near-miss spelling or a listed confusable.
//     This is why there are NO wrong-preposition items in this segment: "in"
//     for "on" is two unrelated closed-class words, the relation derivation
//     rejects it, and rightly — nothing in the sentence tells the player which
//     preposition the author had in mind.
//   · Grammar (kind:'grammar') every day, and a MINORITY of the day's errors:
//     never more than half, never zero.
//   · The copy is British (owner rulings 2026-08-15 and 2026-08-28, both from
//     reader complaints), while the answer the player TYPES may be in either
//     dialect. DO NOT "fix" this segment into American spelling: US_ONLY in
//     verify-stet.mjs fails a US form outright from 2026-08-15 on, and flipping
//     the voice mid-bank would leave 75 British boards followed by 62 American
//     ones. The repo-wide US-spelling standard (CLAUDE.md rule 8) is served in
//     this game by the DIALECT_AXIS_FROM check now wired into verify-stet.mjs
//     from the shared scripts/us-spellings.mjs table: no ERROR may turn on the
//     dialect axis, because the grader folds those spellings together and a
//     player typing the flagged word back would score. The long comment above
//     that check explains why the screen cannot be run in either of its two
//     obvious directions here.
//
// THE CEILINGS, counted across this whole segment and asserted before printing.
// A breach throws; it does not warn.
//   · error TYPE      ≤ 15% of the segment's errors, EXCEPT homophone, which is
//                     capped at 60%. Homophone is the game's core move and
//                     capping it at a "fair share" would be a lie about the
//                     form: the frozen bank ran 66% homophone over the boards
//                     the relation check covers. This segment runs 55%.
//   · subject DOMAIN  ≤ 12% of the segment's sentences, across 14 domains, and
//                     heritage — which the frozen bank ran at 26% over its last
//                     25 boards, church roofs and mill gearing every day — is
//                     held to 5%. This segment uses it not at all.
//   · per day: a domain at most twice, an error type at most twice (three on a
//     Sunday), homophone at most three (four on a Sunday).
//   · clean sentences 20–26% of the segment, and NOT a fixed per-day rate: the
//     weekday clean count must take at least three distinct values.
//   · grammar: at least one every day, and a strict minority of that day's
//     errors.
//
// WHAT THE LEDGER ACTUALLY SAYS for the segment as shipped:
//   279 errors (89 grammar, 31.9%), 77 clean sentences (23.5%), 28 two-error
//   Sunday sentences. Types: homophone 154, confusable 36, verb-form 33,
//   agreement 24, adverb-form 16, number-form 10, pronoun-case 6. Largest
//   domain gov at 11.0%.
//
// RUNWAY. The wall is the never-reuse-a-pair rule, not the calendar. 287 pairs
// were banked before this run and 279 more are spent here, which is most of the
// standard confusable inventory a mainstream copy desk actually teaches. A
// further two months is possible but the next author should expect to work
// harder for clean-cut pairs, and should NOT reach for wrong-preposition,
// synonym-swap or dialect items to fill the gap — all three are already banned
// above, and all three are what a tired author reaches for.

const START = '2026-09-30';
const END = '2026-11-30';

// ─────────────────────────── the authored boards ─────────────────────────────
// One entry per day, in calendar order from START. `d` is the subject domain,
// `t` the sentence, `e` the errors as [wrong, fix, kind, note] with kind 'g'
// for grammar and 'w' for word choice/spelling, `c` the cleanNote when there
// are no errors. Nothing here is generated: every sentence is written, and the
// pair on the end of it was checked against the 287 already in the bank.
export const DAYS = [
  // ── #76 Wed 30 Sep ──────────────────────────────────────────────────────
  [
    { d: 'sci', t: "The survey found fewer than a dozen nests left on the whole cliff face.", c: 'Clean copy: fewer is right for things you can count, and nests can be counted.' },
    { d: 'rail', t: "Neither of the two proposed routes were costed before the committee voted.", e: [['were', 'was', 'g', 'Neither is singular: neither of the routes was costed.']] },
    { d: 'food', t: "A supplier told the inquiry that the flower in the loaves had been milled in Kent.", e: [['flower', 'flour', 'w', 'Flour is milled from grain; a flower grows on a plant.']] },
    { d: 'gov', t: "The council leader said the borough would not waiver from the timetable it published in June.", e: [['waiver', 'waver', 'w', 'To waver is to hesitate; a waiver is the giving up of a right.']] },
    { d: 'arts', t: "The drawings hang in one row, so that the sitters appear to be starring at each other.", e: [['starring', 'staring', 'w', 'To stare is to look fixedly; to star is to take a leading role.']] },
  ],
  // ── #77 Thu 1 Oct ───────────────────────────────────────────────────────
  [
    { d: 'law', t: "The judge said the charge had been withdrew before the second hearing opened.", e: [['withdrew', 'withdrawn', 'g', 'After had the verb takes its participle: had withdrawn.']] },
    { d: 'health', t: "The trust said waiting times had fallen for the forth quarter running.", e: [['forth', 'fourth', 'w', 'Fourth is the ordinal number; forth means onward.']] },
    { d: 'biz', t: "The auditors said the dispute was a matter of principle rather than of sums.", c: 'Clean copy: principle is the rule at stake, which is exactly the word wanted.' },
    { d: 'weather', t: "Forecasters said the squall had blown itself out well before dawn.", c: 'Clean copy: had blown is the right participle, and a squall is a sudden storm.' },
    { d: 'edu', t: "Inspectors said the timetable was to complex for the youngest pupils.", e: [['to', 'too', 'w', 'Too means excessively; to is the preposition.']] },
  ],
  // ── #78 Fri 2 Oct ───────────────────────────────────────────────────────
  [
    { d: 'gov', t: "The authority said the overspend would be cleared over for years of instalments.", e: [['for', 'four', 'w', 'Four is the number; for is the preposition.']] },
    { d: 'coast', t: "The harbour master said the trawler had been tied up along the key since Tuesday.", e: [['key', 'quay', 'w', 'A quay is a landing place for boats; a key opens a lock.']] },
    { d: 'sport', t: "The winger run half the length of the pitch before the whistle went.", e: [['run', 'ran', 'g', 'The simple past is ran; run is the participle, as in has run.']] },
    { d: 'arts', t: "The conservator found a whole in the panel where a knot had dropped out.", e: [['whole', 'hole', 'w', 'A hole is a gap; whole means entire.']] },
    { d: 'sci', t: "The water table sunk by two metres in the decade after the pumps went in.", e: [['sunk', 'sank', 'g', 'The simple past is sank; sunk is the participle, as in has sunk.']] },
  ],
  // ── #79 Sat 3 Oct ───────────────────────────────────────────────────────
  [
    { d: 'farm', t: "The farmer said the ewes had been moved to higher ground before the river rose.", c: 'Clean copy: ewes are female sheep, and that is the spelling.' },
    { d: 'biz', t: "Directors were warned that the bonus scheme could mitigate against long-term investment.", e: [['mitigate', 'militate', 'w', 'To militate against is to weigh against it; to mitigate is to soften.']] },
    { d: 'law', t: "The solicitor said her client had been advised of his write to silence.", e: [['write', 'right', 'w', 'A right is an entitlement; to write is to put words on paper.']] },
    { d: 'health', t: "The trust said the figures was published in error and would be reissued.", e: [['was', 'were', 'g', 'Figures is plural, so the verb is were.']] },
    { d: 'rail', t: "The operator blamed the cancellations on a shortage of drivers do to sickness.", e: [['do', 'due', 'w', 'Due to means caused by; do is the verb.']] },
  ],
  // ── #80 SUN 4 Oct ───────────────────────────────────────────────────────
  [
    { d: 'sport', t: "The club said the aloud limit was four tickets a person, and the queue took an hour.", e: [['aloud', 'allowed', 'w', 'Allowed means permitted; aloud means out loud.']] },
    { d: 'arts', t: "The gallery hung the drawing besides a portrait by an artist who's name is lost.", e: [['besides', 'beside', 'w', 'Beside means next to; besides means in addition.'], ["who's", 'whose', 'w', "Whose is the possessive; who's is short for who is."]] },
    { d: 'edu', t: "Governors said the school had complied with every recommendation in the inspectors' report.", c: "Clean copy: complied with is right, and the plural possessive inspectors' sits correctly." },
    { d: 'food', t: "The chef leaves the sauce to reduce until it just coats the back of a spoon.", c: 'Clean copy: reduce is the kitchen sense, boiling down to concentrate.' },
    { d: 'gov', t: "The chair said the motion had been tabled in hast, and that there is still two amendments to hear.", e: [['hast', 'haste', 'w', 'Haste is hurry; hast is an archaic form of have.'], ['is', 'are', 'g', 'Two amendments is plural, so the verb is are.']] },
    { d: 'coast', t: "The skipper said the boat had lay at anchor since Friday, and that the chain had chaffed the mooring buoy.", e: [['lay', 'lain', 'g', 'Had takes the participle lain; lay is the simple past.'], ['chaffed', 'chafed', 'w', 'To chafe is to rub; to chaff is to tease.']] },
    { d: 'sci', t: "Ecologists said the tern colony had grew to more than two hundred pairs.", e: [['grew', 'grown', 'g', 'Had takes the participle grown; grew is the simple past.']] },
  ],
  // ── #81 Mon 5 Oct ───────────────────────────────────────────────────────
  [
    { d: 'gov', t: "The scheme cannot go ahead without the ascent of the two landowners.", e: [['ascent', 'assent', 'w', 'Assent is agreement; an ascent is a climb.']] },
    { d: 'law', t: "The magistrate said the driver had shown a callous disregard for other road users.", c: 'Clean copy: callous means unfeeling, and it is spelled with two ls and no u.' },
    { d: 'sci', t: "The two gauges on the estuary gives readings a metre apart.", e: [['gives', 'give', 'g', 'Two gauges is plural, so the verb is give.']] },
    { d: 'arts', t: "The critic wrote that the revue had lost none of its bite in forty years.", c: 'Clean copy: a revue is a stage show of sketches and songs, not a notice of one.' },
    { d: 'health', t: "The ward said patience would be seen in order of clinical need.", e: [['patience', 'patients', 'w', 'Patients are the people treated; patience is the virtue.']] },
  ],
  // ── #82 Tue 6 Oct ───────────────────────────────────────────────────────
  [
    { d: 'weather', t: "Forecasters said the front would bring rein and hill snow by the evening.", e: [['rein', 'rain', 'w', 'Rain falls from the sky; a rein controls a horse.']] },
    { d: 'coast', t: "The lifeboat crew said the yacht had drifted for hours before anyone rung the alarm.", e: [['rung', 'rang', 'g', 'The simple past is rang; rung is the participle, as in has rung.']] },
    { d: 'biz', t: "The chain blamed a flat summer on the whether rather than on its prices.", e: [['whether', 'weather', 'w', 'Weather is what the sky does; whether introduces an alternative.']] },
    { d: 'edu', t: "Pupils sat the paper in the sports hall, where the invigilator was hard to here.", e: [['here', 'hear', 'w', 'Hear is what ears do; here is this place.']] },
    { d: 'farm', t: "The tenant said the herd had been housed early because the grass had stopped growing.", c: 'Clean copy: herd is the collective for cattle, and housed is the farming sense.' },
  ],
  // ── #83 Wed 7 Oct ───────────────────────────────────────────────────────
  [
    { d: 'gov', t: "Residents said the new bollards had made the lane impassible to delivery vans.", e: [['impassible', 'impassable', 'w', 'Impassable means it cannot be got through; impassible means unfeeling.']] },
    { d: 'arts', t: "The bequest included a set of Delft tiles, non of which had been catalogued.", e: [['non', 'none', 'w', 'None means not one; non is a prefix, not a word on its own.']] },
    { d: 'sport', t: "The umpire said the ball had struck the batsman outside the line, so the appeal failed.", c: 'Clean copy: struck is the right past tense, and outside the line is the cricket sense.' },
    { d: 'nature', t: "The warden said he seen the otter twice on the mill leat last week.", e: [['seen', 'saw', 'g', 'Seen needs an auxiliary: he saw it, or he has seen it.']] },
    { d: 'food', t: "The baker said the flour had been sifted twice and the batter left to stand for an our.", e: [['our', 'hour', 'w', 'An hour is sixty minutes; our is the possessive.']] },
  ],
  // ── #84 Thu 8 Oct ───────────────────────────────────────────────────────
  [
    { d: 'nature', t: "The peat was dug for fuel until the 1930s, and the scars are still plane to see.", e: [['plane', 'plain', 'w', 'Plain means clear or obvious; a plane is a flat surface or a tool.']] },
    { d: 'law', t: "The injunction had forbade the company from selling the land before the appeal.", e: [['forbade', 'forbidden', 'g', 'Had takes the participle forbidden; forbade is the simple past.']] },
    { d: 'health', t: "The trust said the ward had been closed to knew admissions until Monday.", e: [['knew', 'new', 'w', 'New means recent; knew is the past of know.']] },
    { d: 'rail', t: "The inquiry found the driver had been given a rout that avoided the closed section.", e: [['rout', 'route', 'w', 'A route is a way through; a rout is a crushing defeat.']] },
    { d: 'biz', t: "The firm said its order book had shrunk for a third quarter running.", e: [['shrunk', 'shrank', 'g', 'The simple past is shrank; shrunk is the participle, as in has shrunk.']] },
  ],
  // ── #85 Fri 9 Oct ───────────────────────────────────────────────────────
  [
    { d: 'gov', t: "The council said the two schemes complement each other and would be funded together.", c: 'Clean copy: complement means to complete, which is the sense here.' },
    { d: 'coast', t: "The pilot said the channel had shoaled and the buoys would move before the spring tides.", c: 'Clean copy: shoaled means the water has grown shallower, which is the sense wanted.' },
    { d: 'sport', t: "The club said its eight had beat the course record set in 1998 by four seconds.", e: [['beat', 'beaten', 'g', 'Had takes the participle beaten; beat is the simple past.']] },
    { d: 'edu', t: "The bursar said the currant year's fees would stand until the summer term.", e: [['currant', 'current', 'w', 'Current means present; a currant is a dried fruit.']] },
    { d: 'arts', t: "One critic called the early quartets torturous rather than merely difficult.", e: [['torturous', 'tortuous', 'w', 'Tortuous means winding and involved; torturous means causing torture.']] },
  ],
  // ── #86 Sat 10 Oct ──────────────────────────────────────────────────────
  [
    { d: 'farm', t: "The farmer said the cattle has been housed since the end of September.", e: [['has', 'have', 'g', 'Cattle is plural, so the verb is have.']] },
    { d: 'biz', t: "The retailer said the refit had overrun and the store would open a month latter.", e: [['latter', 'later', 'w', 'Later means afterwards; the latter is the second of two things.']] },
    { d: 'arts', t: "The gallery said the canvas had been relined and a tare in the corner filled.", e: [['tare', 'tear', 'w', 'A tear is a rip; tare is a weed, or an allowance for weight.']] },
    { d: 'weather', t: "Hale the size of marbles fell on the valley for a quarter of an hour.", e: [['hale', 'hail', 'w', 'Hail is frozen rain; hale means sound in health.']] },
    { d: 'law', t: "The tribunal found the dismissal had been unfair and ordered the firm to reinstate her.", c: 'Clean copy: reinstate is right, and unfair dismissal is the phrase the tribunal uses.' },
  ],
  // ── #87 SUN 11 Oct ──────────────────────────────────────────────────────
  [
    { d: 'gov', t: "The inspector said the figures had been drew from a survey the council later disowned, and called the omission a serious laps.", e: [['drew', 'drawn', 'g', 'Had takes the participle drawn; drew is the simple past.'], ['laps', 'lapse', 'w', 'A lapse is a slip; laps are circuits of a track.']] },
    { d: 'arts', t: "The choir sung the mass unaccompanied for the first time in thirty years.", e: [['sung', 'sang', 'g', 'The simple past is sang; sung is the participle, as in has sung.']] },
    { d: 'sport', t: "The club said it would assure that season-ticket holders were served first.", e: [['assure', 'ensure', 'w', 'To ensure is to make certain of something; to assure is to tell someone confidently.']] },
    { d: 'coast', t: "The skipper said the trawler had been holed below the water line, and that the pumps were coping poor with the leek.", e: [['poor', 'poorly', 'g', 'Coping is a verb, so it takes the adverb poorly.'], ['leek', 'leak', 'w', 'A leak lets water in; a leek is a vegetable.']] },
    { d: 'health', t: "The trust said the vaccine would go first to patients whose immunity is waning.", c: 'Clean copy: waning is right for something in decline, and immunity is the word wanted.' },
    { d: 'sci', t: "The survey recorded a pare of ravens on the crag, and said the precipitate face above the ledge keeps walkers off.", e: [['pare', 'pair', 'w', 'A pair is two; to pare is to trim.'], ['precipitate', 'precipitous', 'w', 'Precipitous means steep; precipitate means hasty.']] },
    { d: 'law', t: "The court heard the bank held a lean over the property, and that the deeds were in the names of the tenant and she.", e: [['lean', 'lien', 'w', 'A lien is a claim on property; lean is to slope or to be thin.'], ['she', 'her', 'g', 'After of the pronoun takes the object case: the tenant and her.']] },
  ],
  // ── #88 Mon 12 Oct ──────────────────────────────────────────────────────
  [
    { d: 'gov', t: "The parish said the precept was a levee on every household in the village.", e: [['levee', 'levy', 'w', 'A levy is a charge; a levee is an embankment against floods.']] },
    { d: 'nature', t: "The reserve said the bittern had boomed from the reed bed for a third spring.", c: 'Clean copy: bitterns boom, and boomed is the word for the call they make.' },
    { d: 'biz', t: "The firm said the order had been cancelled and that it would right off the cost.", e: [['right', 'write', 'w', 'To write off a cost is the accounting sense; right means correct.']] },
    { d: 'edu', t: "The tutor marked the essay down for its course language and its wandering argument.", e: [['course', 'coarse', 'w', 'Coarse means rough or crude; a course is a path or a set of lessons.']] },
    { d: 'coast', t: "The harbour master said them on the pontoon had seen nothing unusual that night.", e: [['them', 'they', 'g', 'The subject of the clause takes they, not them.']] },
  ],
  // ── #89 Tue 13 Oct ──────────────────────────────────────────────────────
  [
    { d: 'law', t: "The will was signed in the presents of two witnesses at the solicitor's office.", e: [['presents', 'presence', 'w', 'Presence means being there; presents are gifts.']] },
    { d: 'health', t: "The surgeon said the graft had taken and the patient would be discharged on Friday.", c: 'Clean copy: taken is the surgical sense, and discharged is the word for leaving hospital.' },
    { d: 'arts', t: "The portrait hangs above the mantle at the far end of the long gallery.", e: [['mantle', 'mantel', 'w', 'A mantel is the shelf over a fireplace; a mantle is a cloak or a layer.']] },
    { d: 'sport', t: "The club said the ground had passed an inspection at noon and the match would go ahead.", c: 'Clean copy: passed is the right past tense here, and the sense is came through.' },
    { d: 'weather', t: "The forecasters said each of the three warnings cover a different county.", e: [['cover', 'covers', 'g', 'Each is singular, so the verb is covers.']] },
  ],
  // ── #90 Wed 14 Oct ──────────────────────────────────────────────────────
  [
    { d: 'rail', t: "Engineers said the bridge could not take the wait of a fully loaded lorry.", e: [['wait', 'weight', 'w', 'Weight is heaviness; to wait is to stay for something.']] },
    { d: 'biz', t: "The shop said the sail would run for a fortnight and then stock would go back up.", e: [['sail', 'sale', 'w', 'A sale is a selling; a sail catches the wind.']] },
    { d: 'food', t: "The baker said the doe had been left to prove overnight in the cold room.", e: [['doe', 'dough', 'w', 'Dough is flour and water mixed; a doe is a female deer or rabbit.']] },
    { d: 'gov', t: "The council said the licensing committee meet on the first Tuesday of the month.", e: [['meet', 'meets', 'g', 'The committee is one body, so the verb is meets.']] },
    { d: 'sci', t: "The team said the isotope decays too quickly to be of any practical use.", c: 'Clean copy: decays is right for what an isotope does, and practical is the word wanted.' },
  ],
  // ── #91 Thu 15 Oct ──────────────────────────────────────────────────────
  [
    { d: 'law', t: "The lease contains a claws about subletting that the tenant says he never saw.", e: [['claws', 'clause', 'w', 'A clause is a passage in a contract; claws are on an animal.']] },
    { d: 'health', t: "The trust said the rise in referrals appear to have levelled off since June.", e: [['appear', 'appears', 'g', 'The subject is the rise, which is singular, so the verb is appears.']] },
    { d: 'edu', t: "The head paid the staff a warm complement at the end of a hard term.", e: [['complement', 'compliment', 'w', 'A compliment is praise; a complement completes something.']] },
    { d: 'arts', t: "The frame was guilt in the 1820s and has been regilded only once since.", e: [['guilt', 'gilt', 'w', 'Gilt means covered in gold leaf; guilt is having done wrong.']] },
    { d: 'farm', t: "The herd has been bread on the same hill farm for more than a century.", e: [['bread', 'bred', 'w', 'Bred is the past of breed; bread is the loaf.']] },
  ],
  // ── #92 Fri 16 Oct ──────────────────────────────────────────────────────
  [
    { d: 'coast', t: "The pilot boat put out at first light and the tug stood by until the tide turned.", c: 'Clean copy: stood by is the right phrase, and tug and tide are both used correctly.' },
    { d: 'sport', t: "The captain said the manager and me were the last to leave the pitch.", e: [['me', 'I', 'g', 'The pronoun is a subject here: the manager and I were the last.']] },
    { d: 'gov', t: "The council said the byelaw had been in force since 1974 and would not be reviewed.", c: 'Clean copy: a byelaw is a local rule made by the council, and in force is the phrase.' },
    { d: 'biz', t: "The chairman admitted a degree of discomfit at the half-year figures.", e: [['discomfit', 'discomfort', 'w', 'Discomfort is unease; to discomfit is to thwart or disconcert.']] },
    { d: 'nature', t: "Volunteers planted a roe of alders along the bank to shade the water.", e: [['roe', 'row', 'w', 'A row is a line; a roe is a small deer, or fish eggs.']] },
  ],
  // ── #93 Sat 17 Oct ──────────────────────────────────────────────────────
  [
    { d: 'edu', t: "Governors said the two policies seems to conflict on the question of exclusions.", e: [['seems', 'seem', 'g', 'Two policies is plural, so the verb is seem.']] },
    { d: 'weather', t: "Forecasters said their would be a hard frost inland by the early hours.", e: [['their', 'there', 'w', 'There is the place word; their is the possessive.']] },
    { d: 'health', t: "The trust said the drug had been withdrawn after a review of its side effects.", c: 'Clean copy: withdrawn is the right participle and side effects is the phrase wanted.' },
    { d: 'arts', t: "The archive said the letters had been pored over by three generations of scholars.", c: 'Clean copy: pored over is right for close reading; poured would tip a liquid.' },
    { d: 'rail', t: "The report said the driver had applied the break far too late on the descent.", e: [['break', 'brake', 'w', 'A brake stops a vehicle; a break is a pause or a fracture.']] },
  ],
  // ── #94 SUN 18 Oct ──────────────────────────────────────────────────────
  [
    { d: 'coast', t: "The crew lost an ore in the swell and rowed the last mile short-handed.", e: [['ore', 'oar', 'w', 'An oar drives a boat; ore is rock bearing metal.']] },
    { d: 'sport', t: "The club said the fixture had been rearranged for the following Tuesday evening.", c: 'Clean copy: rearranged is right, and fixture is the word for a scheduled match.' },
    { d: 'gov', t: "The council said the depot would move to a sight on the bypass, and admitted the vote had shook the ruling group.", e: [['sight', 'site', 'w', 'A site is a place; sight is what the eye does.'], ['shook', 'shaken', 'g', 'Had takes the participle shaken; shook is the simple past.']] },
    { d: 'food', t: "The brewery said the barrel had been tapped at noon and drunk dry by six.", c: 'Clean copy: drunk dry is the right participle, and tapped is what you do to a barrel.' },
    { d: 'sci', t: "The team said the phenomena is well documented in colder seas.", e: [['phenomena', 'phenomenon', 'g', 'Phenomena is the plural; a single one is a phenomenon.']] },
    { d: 'law', t: "The court heard the seller had knowingly mislead the buyer, and that the boundary was described wrong in the deeds.", e: [['mislead', 'misled', 'w', 'The past of mislead is misled, with one e.'], ['wrong', 'wrongly', 'g', 'Described is a verb, so it takes the adverb wrongly.']] },
    { d: 'arts', t: "The tapestry was cut and rehung, and the seem now falls behind the door frame.", e: [['seem', 'seam', 'w', 'A seam is a join; seem is the verb.']] },
  ],
  // ── #95 Mon 19 Oct ──────────────────────────────────────────────────────
  [
    { d: 'gov', t: "The committee took legal council before publishing the report in full.", e: [['council', 'counsel', 'w', 'Counsel is advice, or the barrister giving it; a council is the body.']] },
    { d: 'health', t: "The trust said a single criteria must be met before a referral is accepted.", e: [['criteria', 'criterion', 'g', 'Criteria is plural; a single one is a criterion.']] },
    { d: 'biz', t: "The bank agreed to wave the arrangement fee for the first two years.", e: [['wave', 'waive', 'w', 'To waive is to give up a right; to wave is to move the hand.']] },
    { d: 'rail', t: "The operator said each of the four units need a new coupling before the winter.", e: [['need', 'needs', 'g', 'Each is singular, so the verb is needs.']] },
    { d: 'nature', t: "The keeper found a faun lying in the bracken above the top gate.", e: [['faun', 'fawn', 'w', 'A fawn is a young deer; a faun is a creature of myth.']] },
  ],
  // ── #96 Tue 20 Oct ──────────────────────────────────────────────────────
  [
    { d: 'arts', t: "The gallery said the sculpture had been lent by a private collector for the summer.", c: 'Clean copy: lent is the past of lend, which is what a collector does with a work.' },
    { d: 'edu', t: "The head said there was know question of closing the sixth form in the spring.", e: [['know', 'no', 'w', 'No is the negative; know is what the mind does.']] },
    { d: 'coast', t: "The wreck lie in twelve metres of water half a mile off the point.", e: [['lie', 'lies', 'g', 'The wreck is singular, so the verb is lies.']] },
    { d: 'law', t: "Officers called at his residents in the early hours and found the house empty.", e: [['residents', 'residence', 'w', 'A residence is where someone lives; residents are the people in it.']] },
    { d: 'weather', t: "The gauge showed the river's floe had trebled in the space of a night.", e: [['floe', 'flow', 'w', 'Flow is the movement of water; a floe is a sheet of floating ice.']] },
  ],
  // ── #97 Wed 21 Oct ──────────────────────────────────────────────────────
  [
    { d: 'biz', t: "The firm said a lone from the bank had covered the shortfall until March.", e: [['lone', 'loan', 'w', 'A loan is money lent; lone means solitary.']] },
    { d: 'sport', t: "The club said the pitch had drained well and the game would go ahead at three.", c: 'Clean copy: drained is right for what a pitch does, and go ahead is the phrase.' },
    { d: 'gov', t: "The council said these decision had been taken in private and would stand.", e: [['these', 'this', 'g', 'Decision is singular, so the demonstrative is this.']] },
    { d: 'health', t: "The trust said the ward had been closed to visitors as a precaution.", c: 'Clean copy: precaution is the word wanted, and closed to visitors is plainly put.' },
    { d: 'food', t: "The inspector scored the kitchen two out of five, citing the pealing paint above the sink.", e: [['pealing', 'peeling', 'w', 'Peeling is coming away in strips; a peal is the sound of bells.']] },
  ],
  // ── #98 Thu 22 Oct ──────────────────────────────────────────────────────
  [
    { d: 'sci', t: "The geologist said a single strata of clay runs under the whole field.", e: [['strata', 'stratum', 'g', 'Strata is the plural; a single layer is a stratum.']] },
    { d: 'edu', t: "The tutor said the argument was week in the middle and strong at either end.", e: [['week', 'weak', 'w', 'Weak means feeble; a week is seven days.']] },
    { d: 'arts', t: "The trustees were warned not to medal in the curator's choice of hang.", e: [['medal', 'meddle', 'w', 'To meddle is to interfere; a medal is an award.']] },
    { d: 'rail', t: "The lorry had been stationery at the crossing for a minute before the barriers lifted.", e: [['stationery', 'stationary', 'w', 'Stationary means not moving; stationery is paper and envelopes.']] },
    { d: 'law', t: "The court heard the fence had been moved two metres onto the neighbour's land.", c: "Clean copy: the possessive neighbour's is correctly placed and nothing else is amiss." },
  ],
  // ── #99 Fri 23 Oct ──────────────────────────────────────────────────────
  [
    { d: 'sport', t: "The manager called the comeback a remarkable feet in the circumstances.", e: [['feet', 'feat', 'w', 'A feat is an achievement; feet are what you stand on.']] },
    { d: 'health', t: "The nurse said each vile held ten doses and had to be used within a day.", e: [['vile', 'vial', 'w', 'A vial is a small bottle; vile means loathsome.']] },
    { d: 'coast', t: "The harbour said the pontoon had been renewed and the fenders replaced.", c: "Clean copy: fenders are what hang over a boat's side, and renewed is the right word." },
    { d: 'gov', t: "The ward is the most populace in the borough and the least well served.", e: [['populace', 'populous', 'w', 'Populous means having many people; the populace is the people themselves.']] },
    { d: 'biz', t: "The agent said the offer include a share of the freehold and the yard behind.", e: [['include', 'includes', 'g', 'The offer is singular, so the verb is includes.']] },
  ],
  // ── #100 Sat 24 Oct ─────────────────────────────────────────────────────
  [
    { d: 'arts', t: "The organist held the final cord for a full bar and then let the hall go quiet.", e: [['cord', 'chord', 'w', 'A chord is notes sounded together; a cord is a string or a flex.']] },
    { d: 'weather', t: "The river peaked at three metres just after midnight and fell back by dawn.", c: 'Clean copy: peaked is right for a river reaching its highest point.' },
    { d: 'farm', t: "The tenant said the cattle had trod the gateway to mud by the middle of October.", e: [['trod', 'trodden', 'g', 'Had takes the participle trodden; trod is the simple past.']] },
    { d: 'law', t: "The magistrates said the fine would be paid in instalments over six months.", c: 'Clean copy: instalments is right, and the sentence makes no other claim.' },
    { d: 'food', t: "The menu offered a chocolate moose and a plate of cheese from the next valley.", e: [['moose', 'mousse', 'w', 'A mousse is the whipped pudding; a moose is a large deer.']] },
  ],
  // ── #101 SUN 25 Oct ─────────────────────────────────────────────────────
  [
    { d: 'sport', t: "The club said the record had stood for twenty-eight years before it was broken.", c: 'Clean copy: stood is right for a record that lasts, and broken is the participle.' },
    { d: 'sci', t: "The geologist said the seam had been mind since 1820, and that the survey had showed no subsidence.", e: [['mind', 'mined', 'w', 'To mine is to dig out; mind is the faculty of thought.'], ['showed', 'shown', 'g', 'Had takes the participle shown; showed is the simple past.']] },
    { d: 'law', t: "The court heard the notice had been sent by male, and that the landlord had swore an affidavit about it.", e: [['male', 'mail', 'w', 'Mail is post; male is the sex.'], ['swore', 'sworn', 'g', 'Had takes the participle sworn; swore is the simple past.']] },
    { d: 'health', t: "Managers said much of the delays were caused by a shortage of theatre staff.", e: [['much', 'many', 'g', 'Delays can be counted, so the word is many.']] },
    { d: 'gov', t: "The chair said the ruling set no precedence, and that the committee had undertook no survey of the site.", e: [['precedence', 'precedent', 'w', 'A precedent is a case to follow; precedence is priority.'], ['undertook', 'undertaken', 'g', 'Had takes the participle undertaken; undertook is the simple past.']] },
    { d: 'coast', t: "The warden picked out a single turn among the gulls on the shingle bank.", e: [['turn', 'tern', 'w', 'A tern is a seabird; turn is to change direction.']] },
    { d: 'arts', t: "The conservator stretched a fresh canvass over the frame before relining the picture.", e: [['canvass', 'canvas', 'w', 'Canvas is the cloth; to canvass is to solicit votes or opinions.']] },
  ],
  // ── #102 Mon 26 Oct ─────────────────────────────────────────────────────
  [
    { d: 'farm', t: "The vet said the flock had been dipped against flee and scab before housing.", e: [['flee', 'flea', 'w', 'A flea is the insect; to flee is to run away.']] },
    { d: 'food', t: "The butcher said the meet had been hung for a month in the cold store.", e: [['meet', 'meat', 'w', 'Meat is flesh for eating; to meet is to come together.']] },
    { d: 'sci', t: "The laboratory said a single bacteria had been isolated from the tank.", e: [['bacteria', 'bacterium', 'g', 'Bacteria is the plural; a single one is a bacterium.']] },
    { d: 'gov', t: "The council said the bus fair on the market route would rise in April.", e: [['fair', 'fare', 'w', 'A fare is what you pay to travel; fair means just.']] },
    { d: 'sport', t: "The runner said she had paced the first half deliberately and had plenty left.", c: 'Clean copy: paced is right for controlling speed, and plenty left is plainly put.' },
  ],
  // ── #103 Tue 27 Oct ─────────────────────────────────────────────────────
  [
    { d: 'law', t: "The magistrate said the driver would be find two hundred pounds and given points.", e: [['find', 'fined', 'w', 'Fined means made to pay a penalty; find is to locate.']] },
    { d: 'health', t: "The trust said the waiting list remain the longest in the region.", e: [['remain', 'remains', 'g', 'The list is singular, so the verb is remains.']] },
    { d: 'coast', t: "The ferry crosses the straight in forty minutes in anything short of a gale.", e: [['straight', 'strait', 'w', 'A strait is a narrow channel of water; straight means not bent.']] },
    { d: 'arts', t: "The plasterwork freeze runs the whole length of the upper hall.", e: [['freeze', 'frieze', 'w', 'A frieze is a band of decoration; to freeze is to turn to ice.']] },
    { d: 'rail', t: "The report said the express had overtook the stopping service on the fast line.", e: [['overtook', 'overtaken', 'g', 'Had takes the participle overtaken; overtook is the simple past.']] },
  ],
  // ── #104 Wed 28 Oct ─────────────────────────────────────────────────────
  [
    { d: 'nature', t: "The trust said the hedgerow had been laid by hand and would thicken from the base.", c: 'Clean copy: laid is right for a hedge worked by hand, and thicken is the word wanted.' },
    { d: 'gov', t: "Residents were told the new tacks on second homes would pay for the depot.", e: [['tacks', 'tax', 'w', 'Tax is the charge; tacks are small nails, or changes of course.']] },
    { d: 'biz', t: "The landlord said the tenet had left without notice and owed two quarters.", e: [['tenet', 'tenant', 'w', 'A tenant rents a property; a tenet is a principle held to be true.']] },
    { d: 'weather', t: "The forecaster said the risk to the coast depend on where the front stalls.", e: [['depend', 'depends', 'g', 'The subject is the risk, which is singular, so the verb is depends.']] },
    { d: 'edu', t: "The examiners said the paper had been marked to the published criteria.", c: 'Clean copy: criteria is the right plural here, since there is more than one.' },
  ],
  // ── #105 Thu 29 Oct ─────────────────────────────────────────────────────
  [
    { d: 'sport', t: "The manager said the equaliser come far too late to change the table.", e: [['come', 'came', 'g', 'The simple past is came; come is the participle, as in has come.']] },
    { d: 'health', t: "The clinic reported an elicit supply of the drug on the ward.", e: [['elicit', 'illicit', 'w', 'Illicit means unlawful; to elicit is to draw out.']] },
    { d: 'arts', t: "The gallery said the frame was not original but had been made to match.", c: 'Clean copy: made to match is plainly put, and original is used correctly.' },
    { d: 'sci', t: "The mill was fined for pumping affluent into the beck below the weir.", e: [['affluent', 'effluent', 'w', 'Effluent is waste liquid; affluent means wealthy.']] },
    { d: 'coast', t: "The bough of the trawler had been stove in by the swell off the point.", e: [['bough', 'bow', 'w', 'The bow is the front of a boat; a bough is a branch of a tree.']] },
  ],
  // ── #106 Fri 30 Oct ─────────────────────────────────────────────────────
  [
    { d: 'gov', t: "The chair said the pole had been well attended for a wet Thursday in October.", e: [['pole', 'poll', 'w', 'A poll is a vote or a survey; a pole is a long rod.']] },
    { d: 'food', t: "The chef said the stock had been skimmed and left to clear overnight.", c: 'Clean copy: skimmed and clear are both kitchen senses, and nothing here is amiss.' },
    { d: 'farm', t: "The farmer said the two flocks makes about six hundred head between them.", e: [['makes', 'make', 'g', 'Two flocks is plural, so the verb is make.']] },
    { d: 'rail', t: "The operator said the last train had been retimed to connect with the ferry.", c: 'Clean copy: retimed is right for a changed departure, and connect is the word wanted.' },
    { d: 'law', t: "The judge called the offence venal rather than serious and imposed no penalty.", e: [['venal', 'venial', 'w', 'A venial fault is a pardonable one; venal means open to bribery.']] },
  ],
  // ── #107 Sat 31 Oct ─────────────────────────────────────────────────────
  [
    { d: 'edu', t: "The head said the trip had been postponed rather than cancelled outright.", c: 'Clean copy: postponed and cancelled are both used correctly, and the difference is real.' },
    { d: 'biz', t: "The board called the takeover a gambol that had not come off.", e: [['gambol', 'gamble', 'w', 'A gamble is a risk taken; to gambol is to frolic.']] },
    { d: 'sci', t: "The section had been stained with a blue die before it went under the lens.", e: [['die', 'dye', 'w', 'A dye colours things; a die is a stamp, or a cube for games.']] },
    { d: 'weather', t: "The forecaster said the risk of flooding rise sharply after two wet days.", e: [['rise', 'rises', 'g', 'The risk is singular, so the verb is rises.']] },
    { d: 'arts', t: "The percussionist struck the symbol on the last bar and the hall went quiet.", e: [['symbol', 'cymbal', 'w', 'A cymbal is the percussion instrument; a symbol stands for something.']] },
  ],
  // ── #108 SUN 1 Nov ──────────────────────────────────────────────────────
  [
    { d: 'coast', t: "The skipper said the chart showed a shear drop beyond the reef, and that none of the crew worn a lifejacket.", e: [['shear', 'sheer', 'w', 'Sheer means steep or utter; to shear is to cut.'], ['worn', 'wore', 'g', 'The simple past is wore; worn is the participle, as in had worn.']] },
    { d: 'gov', t: "The chief executive said staff moral had never been lower, and that the changes had not been explained clear to anyone.", e: [['moral', 'morale', 'w', 'Morale is spirit within a group; a moral is the lesson of a story.'], ['clear', 'clearly', 'g', 'Explained is a verb, so it takes the adverb clearly.']] },
    { d: 'arts', t: "The conservation laboratory said the rig stimulates a century of handling in a week.", e: [['stimulates', 'simulates', 'w', 'To simulate is to imitate; to stimulate is to encourage.']] },
    { d: 'law', t: "The court heard the defendant drunk four pints at lunchtime before taking the weal.", e: [['drunk', 'drank', 'g', 'The simple past is drank; drunk is the participle, as in has drunk.'], ['weal', 'wheel', 'w', 'A wheel steers the car; a weal is a raised mark on the skin.']] },
    { d: 'sci', t: "The rare gull was cited on the estuary in March, and the warden said the losses at the tern colony looked systematic rather than local.", e: [['cited', 'sighted', 'w', 'Sighted means seen; cited means quoted or summoned.'], ['systematic', 'systemic', 'w', 'Systemic means affecting the whole system; systematic means methodical.']] },
    { d: 'health', t: "The trust said the new clinic would be nurse-led and open on Saturdays.", c: 'Clean copy: nurse-led is correctly hyphenated and open on Saturdays is plainly put.' },
    { d: 'farm', t: "The estate said the ewes had been tupped in November and would lamb in April.", c: 'Clean copy: tupped is the farming word for putting rams to ewes, and lamb is a verb.' },
  ],
  // ── #109 Mon 2 Nov ──────────────────────────────────────────────────────
  [
    { d: 'food', t: "The pub said the pies were made on the premises and sold out by eight.", c: 'Clean copy: premises is the word for the building, and it carries its plural s.' },
    { d: 'rail', t: "The inspector said the gait at the crossing had been left open all night.", e: [['gait', 'gate', 'w', 'A gate swings on hinges; gait is a way of walking.']] },
    { d: 'gov', t: "The council said the consultation had run for eight weeks and drawn ninety replies.", c: 'Clean copy: drawn is the right participle after had, and run is used correctly.' },
    { d: 'nature', t: "The moor turns a deep hew of purple for a fortnight in August.", e: [['hew', 'hue', 'w', 'A hue is a colour; to hew is to cut or chop.']] },
    { d: 'sport', t: "The jockey ridden a patient race and came through in the last two furlongs.", e: [['ridden', 'rode', 'g', 'The simple past is rode; ridden is the participle, as in has ridden.']] },
  ],
  // ── #110 Tue 3 Nov ──────────────────────────────────────────────────────
  [
    { d: 'law', t: "The inquest heard the pilot had been the soul survivor of the crash.", e: [['soul', 'sole', 'w', 'Sole means only; a soul is the spirit.']] },
    { d: 'health', t: "The guidance proscribes the drug for children under twelve, and tells doctors to offer it first.", e: [['proscribes', 'prescribes', 'w', 'To prescribe is to order or recommend; to proscribe is to forbid.']] },
    { d: 'biz', t: "The firm said its chairman want a decision from the board by Friday.", e: [['want', 'wants', 'g', 'The chairman is singular, so the verb is wants.']] },
    { d: 'arts', t: "The museum said the mask had been worn in a right of passage on the island.", e: [['right', 'rite', 'w', 'A rite is a ceremony; right is correct, or an entitlement.']] },
    { d: 'coast', t: "The coastguard said the flare had been seen from the cliff path at midnight.", c: 'Clean copy: a flare is what was fired, and seen from the cliff path is plainly put.' },
  ],
  // ── #111 Wed 4 Nov ──────────────────────────────────────────────────────
  [
    { d: 'gov', t: "The council said the site had been left baron for a decade behind hoardings.", e: [['baron', 'barren', 'w', 'Barren means unproductive; a baron is a nobleman.']] },
    { d: 'sci', t: "The leak had sprang from a cracked main under the car park.", e: [['sprang', 'sprung', 'g', 'Had takes the participle sprung; sprang is the simple past.']] },
    { d: 'edu', t: "The teacher said the play had been caste from the whole of the second year.", e: [['caste', 'cast', 'w', 'To cast a play is to choose its actors; a caste is a social class.']] },
    { d: 'weather', t: "Forecasters said the storm could reek havoc on exposed western coasts.", e: [['reek', 'wreak', 'w', 'To wreak havoc is to cause it; to reek is to stink.']] },
    { d: 'sport', t: "The team swum the relay in a time that would have won last year's final.", e: [['swum', 'swam', 'g', 'The simple past is swam; swum is the participle, as in has swum.']] },
  ],
  // ── #112 Thu 5 Nov ──────────────────────────────────────────────────────
  [
    { d: 'law', t: "The court heard he stolen the tools from a van parked outside the depot.", e: [['stolen', 'stole', 'g', 'The simple past is stole; stolen is the participle, as in had stolen.']] },
    { d: 'biz', t: "The firm said it had joined the gild of master builders in 1974.", e: [['gild', 'guild', 'w', 'A guild is an association of tradespeople; to gild is to cover in gold.']] },
    { d: 'nature', t: "The trust said the pond had been dug out and would refill with the winter rain.", c: 'Clean copy: dug out is right for clearing a pond, and refill is the word wanted.' },
    { d: 'rail', t: "Engineers said the ballast had washed out and left the sleepers to flout in the water.", e: [['flout', 'float', 'w', 'To float is to rest on water; to flout is to defy a rule.']] },
    { d: 'food', t: "The baker said the dough should be need for ten minutes and no longer.", e: [['need', 'knead', 'w', 'To knead dough is to work it with the hands; need is to require.']] },
  ],
  // ── #113 Fri 6 Nov ──────────────────────────────────────────────────────
  [
    { d: 'arts', t: "The programme opened with the composer's early sweet for strings.", e: [['sweet', 'suite', 'w', 'A suite is a set of pieces, or of rooms; sweet is the taste.']] },
    { d: 'health', t: "The trust said the trial had been halted early because the benefit was clear.", c: 'Clean copy: halted early is plainly put, and benefit is the word wanted.' },
    { d: 'gov', t: "The council said the contract would go to whomever bids the lowest.", e: [['whomever', 'whoever', 'g', 'The pronoun is the subject of bids, so it is whoever.']] },
    { d: 'coast', t: "The harbour said the slipway had been resurfaced and would reopen at the weekend.", c: 'Clean copy: slipway is the right word for the ramp, and resurfaced is plainly put.' },
    { d: 'sport', t: "The club said the pitch showed the ware of a long and wet season.", e: [['ware', 'wear', 'w', 'Wear is damage from use; ware is goods offered for sale.']] },
  ],
  // ── #114 Sat 7 Nov ──────────────────────────────────────────────────────
  [
    { d: 'edu', t: "The head said each pupil attend one residential trip in the course of a year.", e: [['attend', 'attends', 'g', 'Each pupil is singular, so the verb is attends.']] },
    { d: 'farm', t: "The contractor will sew the top field with a grass ley in the spring.", e: [['sew', 'sow', 'w', 'To sow is to plant seed; to sew is to stitch cloth.']] },
    { d: 'weather', t: "The forecaster said the fog would lift once the due had burned off the fields.", e: [['due', 'dew', 'w', 'Dew is moisture that settles overnight; due means owing or expected.']] },
    { d: 'biz', t: "The firm said the fraud had been perpetuated by a single employee in accounts.", e: [['perpetuated', 'perpetrated', 'w', 'To perpetrate is to commit; to perpetuate is to make something continue.']] },
    { d: 'sci', t: "The team said the sample had been sealed at the site and opened in the laboratory.", c: 'Clean copy: sealed and opened are plainly put, and laboratory is spelled correctly.' },
  ],
  // ── #115 SUN 8 Nov ──────────────────────────────────────────────────────
  [
    { d: 'arts', t: "The catalogue essay was criticised for its turbid prose and its thin research.", e: [['turbid', 'turgid', 'w', 'Turgid prose is swollen and pompous; turbid means cloudy with sediment.']] },
    { d: 'food', t: "The sourdough is proved for eighteen hours before it goes into the oven.", c: "Clean copy: proved is the baker's word for letting dough rise, and it is right here." },
    { d: 'sci', t: "The caterpillar is a veracious feeder and can strip a young tree in days.", e: [['veracious', 'voracious', 'w', 'Voracious means greedy; veracious means truthful.']] },
    { d: 'gov', t: "The council said two of its lorries had stood idol since May, and that the yard had not been secured proper since then.", e: [['idol', 'idle', 'w', 'Idle means unused; an idol is an image or a person who is worshipped.'], ['proper', 'properly', 'g', 'Secured is a verb, so it takes the adverb properly.']] },
    { d: 'health', t: "The trust said there had been fewer disruption this winter than last.", e: [['fewer', 'less', 'w', 'Disruption is a mass noun, so it takes less.']] },
    { d: 'coast', t: "The station said the boat leaves by the shoot, and that a launch on a spring tide take under two minutes.", e: [['shoot', 'chute', 'w', 'A chute is a sloping channel; to shoot is to fire.'], ['take', 'takes', 'g', 'A launch is singular, so the verb is takes.']] },
    { d: 'law', t: "The judge said the punishment meat out by the magistrates was too light, and that the new fine reflect the scale of the profit.", e: [['meat', 'mete', 'w', 'To mete out a punishment is to deal it out; meat is flesh for eating.'], ['reflect', 'reflects', 'g', 'The fine is singular, so the verb is reflects.']] },
  ],
  // ── #116 Mon 9 Nov ──────────────────────────────────────────────────────
  [
    { d: 'sport', t: "The club said the appeal against the red card had been dismissed and the ban stands.", c: 'Clean copy: dismissed is right for an appeal that fails, and the ban stands is plain.' },
    { d: 'arts', t: "The paper's revue of the exhibition ran to a full page on Saturday.", e: [['revue', 'review', 'w', 'A review is a critical notice; a revue is a stage show of sketches.']] },
    { d: 'law', t: "The board voted to censure the letters before they went into the file.", e: [['censure', 'censor', 'w', 'To censor is to cut material out; to censure is to condemn.']] },
    { d: 'sci', t: "The dyke had stank for a week before anyone traced the discharge.", e: [['stank', 'stunk', 'g', 'Had takes the participle stunk; stank is the simple past.']] },
    { d: 'gov', t: "The beach was closed for a week after unexploded ordinance was found in the dunes.", e: [['ordinance', 'ordnance', 'w', 'Ordnance is munitions; an ordinance is a decree.']] },
  ],
  // ── #117 Tue 10 Nov ─────────────────────────────────────────────────────
  [
    { d: 'health', t: "The porter found the patient prostate on the floor of the day room.", e: [['prostate', 'prostrate', 'w', 'Prostrate means lying face down; the prostate is a gland.']] },
    { d: 'biz', t: "The company said the write-down reflected a drop in the value of its yards.", c: 'Clean copy: write-down is the accounting term and reflected is used correctly.' },
    { d: 'edu', t: "The head said this changes had been agreed with staff before half term.", e: [['this', 'these', 'g', 'Changes is plural, so the demonstrative is these.']] },
    { d: 'coast', t: "The pilot said the vessel had swung to the ebb and cleared the bar at first light.", c: 'Clean copy: swung to the ebb is the right phrase, and cleared the bar is plainly put.' },
    { d: 'weather', t: "The tide backed up the creak and put a foot of water across the lane.", e: [['creak', 'creek', 'w', 'A creek is a narrow inlet or a small stream; a creak is a noise.']] },
  ],
  // ── #118 Wed 11 Nov ─────────────────────────────────────────────────────
  [
    { d: 'rail', t: "The work begun in March and the platform is still behind hoardings.", e: [['begun', 'began', 'g', 'The simple past is began; begun is the participle, as in has begun.']] },
    { d: 'arts', t: "The statute in the market square was cleaned and rewaxed over the summer.", e: [['statute', 'statue', 'w', 'A statue is the carved figure; a statute is an act of parliament.']] },
    { d: 'gov', t: "The council appointed an imminent planner to chair the review of the local plan.", e: [['imminent', 'eminent', 'w', 'Eminent means distinguished; imminent means about to happen.']] },
    { d: 'farm', t: "The barn held a horde of old machinery that had not moved in thirty years.", e: [['horde', 'hoard', 'w', 'A hoard is a store laid by; a horde is a crowd.']] },
    { d: 'law', t: "The court said the tenant had been given proper notice and dismissed the claim.", c: 'Clean copy: proper notice is the phrase, and dismissed the claim is plainly put.' },
  ],
  // ── #119 Thu 12 Nov ─────────────────────────────────────────────────────
  [
    { d: 'sci', t: "The team said the survey had been systemic rather than opportunistic.", e: [['systemic', 'systematic', 'w', 'Systematic means methodical; systemic means affecting a whole system.']] },
    { d: 'health', t: "The cost of the agency cover has been born by the trust for two years.", e: [['born', 'borne', 'g', 'Borne is the participle of bear in this sense; born is about birth.']] },
    { d: 'biz', t: "The firm said the machinery had been deprecated over ten years in the accounts.", e: [['deprecated', 'depreciated', 'w', 'To depreciate is to lose value over time; to deprecate is to disapprove.']] },
    { d: 'food', t: "The wine was described as having a palette of red fruit and a long finish.", e: [['palette', 'palate', 'w', 'The palate is the sense of taste; a palette holds an artist’s colours.']] },
    { d: 'sport', t: "The manager said the side done enough in the second half to take a point.", e: [['done', 'did', 'g', 'The simple past is did; done needs an auxiliary, as in has done.']] },
  ],
  // ── #120 Fri 13 Nov ─────────────────────────────────────────────────────
  [
    { d: 'coast', t: "The skipper said the hall had been the best of a poor season for the fleet.", e: [['hall', 'haul', 'w', 'A haul is a catch or a load; a hall is a room.']] },
    { d: 'gov', t: "The council said its a matter for the planning inspector and not for members.", e: [['its', "it's", 'g', "It's is short for it is; its is the possessive."]] },
    { d: 'edu', t: "The head said the change would lesson the burden on the pastoral team.", e: [['lesson', 'lessen', 'w', 'To lessen is to reduce; a lesson is what is taught.']] },
    { d: 'nature', t: "A pine martin was caught on camera above the beck for the first time.", e: [['martin', 'marten', 'w', 'A marten is the animal; a martin is a bird.']] },
    { d: 'arts', t: "The gallery said the drawing had been mounted on acid-free board and reframed.", c: 'Clean copy: acid-free board is right and reframed is the word wanted.' },
  ],
  // ── #121 Sat 14 Nov ─────────────────────────────────────────────────────
  [
    { d: 'law', t: "The judge said the reasoning of the tribunal alludes him entirely.", e: [['alludes', 'eludes', 'w', 'To elude someone is to escape them; to allude is to refer indirectly.']] },
    { d: 'sport', t: "The rower said the crew had come through the field in the last five hundred metres.", c: 'Clean copy: come through the field is the right phrase and the tense is correct.' },
    { d: 'health', t: "The trust said the ward would take its first patients on Monday morning.", c: 'Clean copy: its is the possessive here and rightly carries no apostrophe.' },
    { d: 'weather', t: "The temperature fell sharp overnight and the roads froze before dawn.", e: [['sharp', 'sharply', 'g', 'Fell is a verb, so it takes the adverb sharply.']] },
    { d: 'food', t: "The chef said good fish had grown so deer that he had changed the menu.", e: [['deer', 'dear', 'w', 'Dear means costly; a deer is the animal.']] },
  ],
  // ── #122 SUN 15 Nov ─────────────────────────────────────────────────────
  [
    { d: 'arts', t: "The tenner sang the part from memory after the score went missing.", e: [['tenner', 'tenor', 'w', 'A tenor is the singer; a tenner is a ten-pound note.']] },
    { d: 'coast', t: "The tug took the barge under toe as far as the lock and cast off there.", e: [['toe', 'tow', 'w', 'To tow is to pull; a toe is on the foot.']] },
    { d: 'gov', t: "The report counted a rising incidents of fly-tipping, and the council said its crews had responded prompt in every case.", e: [['incidents', 'incidence', 'w', 'Incidence is the rate at which something occurs; incidents are single events.'], ['prompt', 'promptly', 'g', 'Responded is a verb, so it takes the adverb promptly.']] },
    { d: 'sci', t: "The valley floor is luxurious with fern from the beck to the tree line.", e: [['luxurious', 'luxuriant', 'w', 'Luxuriant means growing thickly; luxurious means costly and comfortable.']] },
    { d: 'law', t: "The court heard a long legal wangle over the estate, and that the solicitor written to the family only in June.", e: [['wangle', 'wrangle', 'w', 'A wrangle is a dispute; to wangle is to get by contrivance.'], ['written', 'wrote', 'g', 'The simple past is wrote; written is the participle, as in had written.']] },
    { d: 'rail', t: "The operator said the diversion would add twenty minutes to the evening journey.", c: 'Clean copy: diversion is the right word and add twenty minutes is plainly put.' },
    { d: 'farm', t: "The auctioneer said the store cattle had made more than last year in spite of the drought.", c: 'Clean copy: store cattle are beasts sold on to be fattened, and made is the sale sense.' },
  ],
  // ── #123 Mon 16 Nov ─────────────────────────────────────────────────────
  [
    { d: 'health', t: "The trust said the outbreak had been contained and the ward would reopen.", c: 'Clean copy: contained is the right word for an outbreak held in check.' },
    { d: 'sport', t: "The upper tear of the stand was closed for the whole of the second half.", e: [['tear', 'tier', 'w', 'A tier is a level or row; a tear is a rip, or a drop from the eye.']] },
    { d: 'gov', t: "The council said the grant had been ring-fenced for flood works and could not be moved.", c: 'Clean copy: ring-fenced is the right term for money set aside, and it is hyphenated.' },
    { d: 'biz', t: "The firm said the cargo had not been ensured and the loss fell on the yard.", e: [['ensured', 'insured', 'w', 'To insure is to cover against loss; to ensure is to make certain.']] },
    { d: 'sci', t: "The gauge had not been reading accurate since the flood in February.", e: [['accurate', 'accurately', 'g', 'Reading is a verb here, so it takes the adverb accurately.']] },
  ],
  // ── #124 Tue 17 Nov ─────────────────────────────────────────────────────
  [
    { d: 'law', t: "The defendant was seen to exalt on the steps outside the court.", e: [['exalt', 'exult', 'w', 'To exult is to rejoice openly; to exalt is to raise up or praise.']] },
    { d: 'rail', t: "The stopping service gone into the loop before the express came through.", e: [['gone', 'went', 'g', 'The simple past is went; gone is the participle, as in had gone.']] },
    { d: 'arts', t: "The curator said the broach had been found by a detectorist in a ploughed field.", e: [['broach', 'brooch', 'w', 'A brooch is the pin worn on clothing; to broach is to raise a subject.']] },
    { d: 'farm', t: "The milk was carried up from the parlour in a pale as it always had been.", e: [['pale', 'pail', 'w', 'A pail is a bucket; pale means light in colour.']] },
    { d: 'edu', t: "The head said the fire alarm is tested regular and the log is kept in the office.", e: [['regular', 'regularly', 'g', 'Tested is a verb, so it takes the adverb regularly.']] },
  ],
  // ── #125 Wed 18 Nov ─────────────────────────────────────────────────────
  [
    { d: 'gov', t: "The figures shows a fall in fly-tipping for the third quarter running.", e: [['shows', 'show', 'g', 'Figures is plural, so the verb is show.']] },
    { d: 'coast', t: "The serf broke clean over the bar and the crew turned back to the harbour.", e: [['serf', 'surf', 'w', 'Surf is breaking waves; a serf was a feudal labourer.']] },
    { d: 'sci', t: "The grant is meant to simulate research into flood defences in upland catchments.", e: [['simulate', 'stimulate', 'w', 'To stimulate is to encourage; to simulate is to imitate.']] },
    { d: 'weather', t: "The forecaster said the wind would back south-westerly and the rain would ease.", c: 'Clean copy: back is the right term for a wind shifting anticlockwise.' },
    { d: 'food', t: "The kitchen said the truffle's cent filled the room the moment the tin opened.", e: [['cent', 'scent', 'w', 'A scent is a smell; a cent is a coin.']] },
  ],
  // ── #126 Thu 19 Nov ─────────────────────────────────────────────────────
  [
    { d: 'sport', t: "The single skull capsized above the weir and the crew swam to the bank.", e: [['skull', 'scull', 'w', 'A scull is a light racing boat, or its oar; a skull is bone.']] },
    { d: 'law', t: "Counsel made an illusion to an earlier case that the judge said was not on point.", e: [['illusion', 'allusion', 'w', 'An allusion is an indirect reference; an illusion is a false impression.']] },
    { d: 'biz', t: "The firm said this had been the worse year for orders since 2009.", e: [['worse', 'worst', 'g', 'Comparing with every other year takes the superlative worst.']] },
    { d: 'nature', t: "The pidgin loft at the end of the allotments has been there since the war.", e: [['pidgin', 'pigeon', 'w', 'A pigeon is the bird; a pidgin is a simplified language.']] },
    { d: 'health', t: "The trust said the drug had been licensed for adults and would not be given to children.", c: 'Clean copy: licensed is the right spelling for the verb, and the sentence is plain.' },
  ],
  // ── #127 Fri 20 Nov ─────────────────────────────────────────────────────
  [
    { d: 'gov', t: "The council said the depot lease had been renewed for a further five years.", c: 'Clean copy: lease and renewed are both used correctly and nothing hides here.' },
    { d: 'coast', t: "The lifeboat was launched twice in the night and both crews were back by dawn.", c: 'Clean copy: launched and back by dawn are plainly put, with nothing to tap.' },
    { d: 'arts', t: "The company staged a mask in the great hall for the first time since 1911.", e: [['mask', 'masque', 'w', 'A masque is a courtly entertainment; a mask covers the face.']] },
    { d: 'edu', t: "The head said her and the deputy had visited every class before half term.", e: [['her', 'she', 'g', 'The pronoun is a subject here: she and the deputy visited.']] },
    { d: 'farm', t: "The fence steak had rotted at the base and the wire had gone slack.", e: [['steak', 'stake', 'w', 'A stake is a post driven into the ground; a steak is a cut of meat.']] },
  ],
  // ── #128 Sat 21 Nov ─────────────────────────────────────────────────────
  [
    { d: 'health', t: "The study found no casual link between the two conditions in adults.", e: [['casual', 'causal', 'w', 'A causal link is one of cause and effect; casual means informal.']] },
    { d: 'biz', t: "The firm said its personal costs had risen by a fifth since the new depot opened.", e: [['personal', 'personnel', 'w', 'Personnel are the staff; personal means private or individual.']] },
    { d: 'food', t: "The restaurant said the tasting menu had been pared back from nine courses to five.", c: 'Clean copy: pared back is right for trimming something down.' },
    { d: 'sci', t: "The two instruments requires calibration at the start of every season.", e: [['requires', 'require', 'g', 'Two instruments is plural, so the verb is require.']] },
    { d: 'rail', t: "The line's clime out of the valley is the steepest on the network.", e: [['clime', 'climb', 'w', 'A climb is an ascent; a clime is a region or its climate.']] },
  ],
  // ── #129 SUN 22 Nov ─────────────────────────────────────────────────────
  [
    { d: 'law', t: "The court heard the entrance had not been adopted for wheelchair users, and that the dispute now lies between the landlord and we.", e: [['adopted', 'adapted', 'w', 'To adapt is to alter for a purpose; to adopt is to take up or take on.'], ['we', 'us', 'g', 'After between the pronoun takes the object case: the landlord and us.']] },
    { d: 'health', t: "The trust gave an officious reply to a complaint about the discharge letter.", e: [['officious', 'official', 'w', 'Official means from the authority; officious means meddlesome.']] },
    { d: 'arts', t: "The organ builder said the read pipes had been revoiced and the case rewired.", e: [['read', 'reed', 'w', 'A reed vibrates to make the sound; read is what you do to a book.']] },
    { d: 'sport', t: "The club said the manager had signed a contract to the end of the season.", c: 'Clean copy: signed a contract to the end of the season is plainly put and hides nothing.' },
    { d: 'sci', t: "The gauge gives a continual record of the level, and the team said the ceiling of the borehole had failed in August.", e: [['continual', 'continuous', 'w', 'Continuous means without a break; continual means repeated with gaps.'], ['ceiling', 'sealing', 'w', 'Sealing is closing something tight; a ceiling is overhead.']] },
    { d: 'gov', t: "The council said no alternate site had been considered, and that officers had acted immediate once the objection arrived.", e: [['alternate', 'alternative', 'w', 'An alternative is another option; alternate means every other one.'], ['immediate', 'immediately', 'g', 'Acted is a verb, so it takes the adverb immediately.']] },
    { d: 'coast', t: "The boat tied up at the peer, and the crew said the pumps had been rigged quick enough to save her.", e: [['peer', 'pier', 'w', 'A pier runs out into the water; a peer is an equal, or a lord.'], ['quick', 'quickly', 'g', 'Rigged is a verb, so it takes the adverb quickly.']] },
  ],
  // ── #130 Mon 23 Nov ─────────────────────────────────────────────────────
  [
    { d: 'gov', t: "The leader accused the group of fermenting unrest at the back of the meeting.", e: [['fermenting', 'fomenting', 'w', 'To foment trouble is to stir it up; to ferment is what yeast does.']] },
    { d: 'biz', t: "The board was told the two schemes costs about the same over ten years.", e: [['costs', 'cost', 'g', 'Two schemes is plural, so the verb is cost.']] },
    { d: 'edu', t: "The college said the hostile above the workshops had been refurbished.", e: [['hostile', 'hostel', 'w', 'A hostel provides beds; hostile means unfriendly.']] },
    { d: 'coast', t: "The boat made twelve not against the ebb and still came in late.", e: [['not', 'knot', 'w', 'A knot is a nautical mile an hour; not is the negative.']] },
    { d: 'nature', t: "The warden said the swans had been ringed and would be tracked through the winter.", c: 'Clean copy: ringed is the right word for marking a bird, and tracked is plainly put.' },
  ],
  // ── #131 Tue 24 Nov ─────────────────────────────────────────────────────
  [
    { d: 'law', t: "The judge asked counsel for the rational behind the decision to prosecute.", e: [['rational', 'rationale', 'w', 'A rationale is the reasoning behind something; rational means sensible.']] },
    { d: 'health', t: "The trust said the nurse had acted on the guidance in force at the time.", c: 'Clean copy: in force at the time is the right phrase and acted on is plainly put.' },
    { d: 'arts', t: "The tapestry was wove in Flanders and hung here for three hundred years.", e: [['wove', 'woven', 'g', 'The passive takes the participle woven; wove is the simple past.']] },
    { d: 'sport', t: "The club said the tie would be replayed at the smaller ground on Tuesday.", c: 'Clean copy: a tie is the cup match itself, and replayed is the right word.' },
    { d: 'weather', t: "The son broke through by noon and the ice was off the road by two.", e: [['son', 'sun', 'w', 'The sun is in the sky; a son is a child.']] },
  ],
  // ── #132 Wed 25 Nov ─────────────────────────────────────────────────────
  [
    { d: 'gov', t: "The grant will be dispersed in two payments, the second once the works are signed off.", e: [['dispersed', 'disbursed', 'w', 'To disburse is to pay out money; to disperse is to scatter.']] },
    { d: 'rail', t: "The line has bore the traffic of two routes since the coastal branch closed.", e: [['bore', 'borne', 'g', 'Has takes the participle borne; bore is the simple past.']] },
    { d: 'food', t: "The list runs to forty whines, half of them from within fifty miles.", e: [['whines', 'wines', 'w', 'Wine is the drink; a whine is a complaining noise.']] },
    { d: 'sci', t: "The moss was found to harbour a might no bigger than a pinhead.", e: [['might', 'mite', 'w', 'A mite is a tiny creature; might is power, or the past of may.']] },
    { d: 'biz', t: "The yard was hit severe by the strike and lost two months of work.", e: [['severe', 'severely', 'g', 'Hit is a verb, so it takes the adverb severely.']] },
  ],
  // ── #133 Thu 26 Nov ─────────────────────────────────────────────────────
  [
    { d: 'health', t: "The rota left the ward short when two nurses went sic on the same night.", e: [['sic', 'sick', 'w', 'Sick means unwell; sic marks an error quoted from another text.']] },
    { d: 'law', t: "The judge praised that who had come forward to give evidence at the trial.", e: [['that', 'those', 'g', 'The relative clause takes the demonstrative those: those who came forward.']] },
    { d: 'edu', t: "The head said the cue for lunch stretched into the yard by half past twelve.", e: [['cue', 'queue', 'w', 'A queue is a line of people; a cue is a signal, or a billiard stick.']] },
    { d: 'arts', t: "The critic called the staging stayed and said the singing deserved better.", e: [['stayed', 'staid', 'w', 'Staid means sober and unadventurous; stayed is the past of stay.']] },
    { d: 'farm', t: "The farmer said the maize had been cut for silage and the clamp sheeted by Friday.", c: 'Clean copy: clamp and sheeted are the right words for how silage is stored.' },
  ],
  // ── #134 Fri 27 Nov ─────────────────────────────────────────────────────
  [
    { d: 'sport', t: "The runner said she had trained through the winter and felt the benefit in the last mile.", c: 'Clean copy: felt the benefit is plainly put and trained through the winter is right.' },
    { d: 'food', t: "The recipe calls for a single egg yoke and no cream at all.", e: [['yoke', 'yolk', 'w', 'The yolk is the yellow of an egg; a yoke joins two animals.']] },
    { d: 'gov', t: "The council said the order would take effect in January and signs would go up.", c: 'Clean copy: take effect is the right phrase, and effect is the noun wanted here.' },
    { d: 'sci', t: "The instrument had not been set exact and the whole run had to be repeated.", e: [['exact', 'exactly', 'g', 'Set is a verb, so it takes the adverb exactly.']] },
    { d: 'coast', t: "The rope was warn through where it had run over the gunwale for a season.", e: [['warn', 'worn', 'w', 'Worn is the participle of wear; to warn is to give notice.']] },
  ],
  // ── #135 Sat 28 Nov ─────────────────────────────────────────────────────
  [
    { d: 'nature', t: "The otter is seen frequent on the lower river now that the weir has gone.", e: [['frequent', 'frequently', 'g', 'Seen is a verb, so it takes the adverb frequently.']] },
    { d: 'law', t: "The pamphlet says a poacher was hung outside the county prison in 1856.", e: [['hung', 'hanged', 'w', 'People are hanged; pictures and curtains are hung.']] },
    { d: 'arts', t: "The opera tells the tail of a fisherman who never comes home.", e: [['tail', 'tale', 'w', 'A tale is a story; a tail is on an animal.']] },
    { d: 'rail', t: "The operator said the timetable had been rewritten to build in more recovery time.", c: "Clean copy: recovery time is the industry's own phrase for slack built into a timetable." },
    { d: 'biz', t: "The firm said the smaller van was more economic to run on short rounds.", e: [['economic', 'economical', 'w', 'Economical means thrifty in use; economic relates to the economy.']] },
  ],
  // ── #136 SUN 29 Nov ─────────────────────────────────────────────────────
  [
    { d: 'coast', t: "The bell was told for the lost crew at noon on the anniversary.", e: [['told', 'tolled', 'w', 'A bell is tolled; told is the past of tell.']] },
    { d: 'sci', t: "The team said the water below the weir was turgid with silt, and that the level had been rising constant since October.", e: [['turgid', 'turbid', 'w', 'Turbid water is cloudy with sediment; turgid means swollen or pompous.'], ['constant', 'constantly', 'g', 'Rising is a verb, so it takes the adverb constantly.']] },
    { d: 'food', t: "The brewery said the hops had been picked late and dried in the oast.", c: 'Clean copy: an oast is the kiln where hops are dried, and picked late is plainly put.' },
    { d: 'law', t: "The witness said she had come to loath the whole process, and that two earlier claims had been settled private.", e: [['loath', 'loathe', 'w', 'To loathe is to detest; loath means reluctant.'], ['private', 'privately', 'g', 'Settled is a verb, so it takes the adverb privately.']] },
    { d: 'health', t: "The trust said the audit had found no evidence of harm to any patient.", c: 'Clean copy: no evidence of harm is plainly put, and audit is the right word.' },
    { d: 'gov', t: "The chair called the vote a momentary one for the town, and said those decision would not be revisited.", e: [['momentary', 'momentous', 'w', 'Momentous means of great importance; momentary means lasting a moment.'], ['those', 'that', 'g', 'Decision is singular, so the demonstrative is that.']] },
    { d: 'arts', t: "The archive said the film had been wound onto a new real and copied.", e: [['real', 'reel', 'w', 'A reel holds the film; real means genuine.']] },
  ],
  // ── #137 Mon 30 Nov ─────────────────────────────────────────────────────
  [
    { d: 'gov', t: "The council band the use of the field for car boot sales after complaints.", e: [['band', 'banned', 'w', 'Banned means forbidden; a band is a group, or a strip.']] },
    { d: 'arts', t: "The gallery said the exhibition would close on Sunday and tour in the new year.", c: 'Clean copy: close on Sunday and tour in the new year are both plainly put.' },
    { d: 'sci', t: "The crack was obvious missed at the inspection two summers ago.", e: [['obvious', 'obviously', 'g', 'Missed is a verb, so it takes the adverb obviously.']] },
    { d: 'sport', t: "The club said tickets would go on sale on Thursday and be limited to four a person.", c: 'Clean copy: go on sale and limited to four a person are both plainly put.' },
    { d: 'edu', t: "The head said a permanent physics teacher had proved illusive for two years.", e: [['illusive', 'elusive', 'w', 'Elusive means hard to find or catch; illusive means deceptive.']] },
  ],
];

// ─────────────────────────── derivation + ceilings ───────────────────────────
// Nothing below is authored. num/quizId/dateLabel/sunday are computed from the
// calendar, the ledger is counted, and a ceiling breach throws rather than
// printing a bank nobody would notice was flat.
const FIRST_NUM = 76;                 // the frozen bank ends at #75, 2026-09-29
const CEIL_TYPE = 0.15;               // share of segment errors, any one type but homophone
const CEIL_HOMOPHONE = 0.60;          // homophone is the game's core move; the frozen bank ran 66%
const CEIL_DOMAIN = 0.12;             // share of segment sentences, any one domain
const CEIL_DOMAIN_HERITAGE = 0.05;    // the frozen bank ran heritage at 26%
const CLEAN_BAND = [0.20, 0.26];      // share of segment sentences that are clean      // share of segment sentences that are clean
const PER_DAY_DOMAIN = 2;             // same domain at most twice in one day
const PER_DAY_TYPE = [2, 3];          // any one type other than homophone: weekday, Sunday
const PER_DAY_HOM = [3, 4];           // homophone is the game's core move, so it runs wider

// The verifier's own loose phonetic key, copied so the type ledger sorts
// homophones from near-misses the same way verify-stet.mjs does.
function pkey(s) {
  let w = String(s).toLowerCase().replace(/[^a-z]/g, '');
  if (!w) return '';
  w = w.replace(/^(kn|gn|pn|wr)/, (m) => m[1]);
  if (/^wh[ou]/.test(w)) w = w.slice(1); else if (w.startsWith('wh')) w = 'w' + w.slice(2);
  w = w.replace(/ough/g, 'o').replace(/ph/g, 'f').replace(/gh/g, '').replace(/gn/g, 'n');
  w = w.replace(/x/g, 'ks').replace(/ch(?=[rl])/g, 'k').replace(/sc(?=[lm])/g, 's');
  w = w.replace(/sh|ch|ti(?=[oa])|ci(?=[oa])/g, 'X').replace(/th/g, '0');
  w = w.replace(/ck/g, 'k').replace(/q/g, 'k').replace(/dg(?=[eiy])/g, 'j').replace(/g(?=[eiy])/g, 'j');
  w = w.replace(/c(?=[eiy])/g, 's').replace(/c/g, 'k');
  w = w.replace(/z/g, 's').replace(/v/g, 'f').replace(/h/g, '').replace(/e$/, '');
  const lead = /^[aeiouy]/.test(w) ? 'V' : '';
  const rest = w.slice(lead ? 1 : 0).replace(/w/g, '').replace(/[aeiouy]/g, '');
  return (lead + rest).replace(/(.)\1+/g, '$1');
}
const PRONOUNS = new Set(['i', 'me', 'he', 'him', 'she', 'her', 'we', 'us', 'they', 'them', 'who', 'whom', 'whoever', 'whomever']);
const NUMBERWORDS = new Set(['this', 'these', 'that', 'those', 'much', 'many', 'fewer', 'less', 'criteria', 'criterion', 'phenomena', 'phenomenon', 'strata', 'stratum', 'bacteria', 'bacterium', 'worse', 'worst']);
// Irregular principal parts, trimmed to the verbs this segment actually uses.
// Two forms of one verb in a grammar error is a verb-form slip, not agreement.
const IRREG = `bear bore borne born|beat beat beaten|begin began begun|break broke broken|
come came come|do did done|draw drew drawn|drink drank drunk|forbid forbade forbidden|
go went gone|grow grew grown|hang hung hanged|lie lay lain|overtake overtook overtaken|
ride rode ridden|ring rang rung|run ran run|see saw seen|shake shook shaken|show showed shown|
shrink shrank shrunk|sing sang sung|sink sank sunk|spring sprang sprung|steal stole stolen|
stink stank stunk|swear swore sworn|swim swam swum|take took taken|tear tore torn|
tread trod trodden|undertake undertook undertaken|weave wove woven|wear wore worn|
withdraw withdrew withdrawn|write wrote written`
  .split('|').map((g) => new Set(g.trim().split(/\s+/)));
// The error TYPE for the variety ledger. Six buckets, chosen so that the two
// axes the header cares about stay visible: what the reader must notice
// (sound-alike vs look-alike vs meaning-alike) and, within grammar, which slip.
function typeOf(e, text) {
  const [w, f, kind] = e;
  const lw = w.toLowerCase(), lf = f.toLowerCase();
  if (kind === 'g') {
    if (lf === lw + 'ly' || (lf.endsWith('ly') && lf.startsWith(lw.replace(/y$/, 'i')))) return 'adverb-form';
    if (PRONOUNS.has(lw) && PRONOUNS.has(lf)) return 'pronoun-case';
    if (NUMBERWORDS.has(lw) || NUMBERWORDS.has(lf)) return 'number-form';
    if (IRREG.some((g) => g.has(lw) && g.has(lf))) return 'verb-form';
    return 'agreement';
  }
  if (pkey(lw) === pkey(lf)) return 'homophone';
  return 'confusable';
}

const pad = (n) => String(n).padStart(2, '0');
const iso = (d) => `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())}`;
const dates = [];
for (let d = new Date(`${START}T00:00:00Z`); iso(d) <= END; d.setUTCDate(d.getUTCDate() + 1)) dates.push(new Date(d));
if (dates.length !== DAYS.length) throw new Error(`calendar has ${dates.length} days but DAYS has ${DAYS.length}`);

const boards = [];
const typeCount = {}, domainCount = {}, pairs = new Set();
let sentences = 0, errors = 0, cleans = 0, grammar = 0, doubles = 0;
const cleanPerWeekday = new Set();
DAYS.forEach((items, i) => {
  const dt = dates[i];
  const [y, m, d] = [dt.getUTCFullYear(), dt.getUTCMonth() + 1, dt.getUTCDate()];
  const sunday = dt.getUTCDay() === 0;
  const board = {
    num: FIRST_NUM + i,
    quizId: `stet-${m}-${d}-${y % 100}`,
    live: iso(dt),
    dateLabel: dt.toLocaleDateString('en-US', { timeZone: 'UTC', month: 'long', day: 'numeric', year: 'numeric' }),
    sunday,
    items,
  };
  const want = sunday ? 7 : 5;
  if (items.length !== want) throw new Error(`#${board.num} ${board.live}: ${items.length} items, want ${want}`);
  const dayDomain = {}, dayType = {};
  let dayClean = 0, dayErr = 0, dayGram = 0;
  for (const it of items) {
    sentences++;
    dayDomain[it.d] = (dayDomain[it.d] || 0) + 1;
    domainCount[it.d] = (domainCount[it.d] || 0) + 1;
    const es = it.e || [];
    if (!es.length) {
      cleans++; dayClean++;
      if (!it.c) throw new Error(`#${board.num}: clean item without a cleanNote: ${it.t}`);
      continue;
    }
    if (es.length > (sunday ? 2 : 1)) throw new Error(`#${board.num}: ${es.length} errors on a ${sunday ? 'Sunday' : 'weekday'} sentence`);
    if (es.length === 2) doubles++;
    const toks = it.t.split(/\s+/).map((t) => t.toLowerCase().replace(/^[^a-z0-9'’-]+|[^a-z0-9'’-]+$/g, '')).filter(Boolean);
    for (const e of es) {
      errors++; dayErr++;
      if (e[2] === 'g') { grammar++; dayGram++; }
      const lw = e[0].toLowerCase();
      if (toks.filter((t) => t === lw).length !== 1) throw new Error(`#${board.num}: "${e[0]}" appears ${toks.filter((t) => t === lw).length}x in: ${it.t}`);
      if (toks.includes(e[1].toLowerCase())) throw new Error(`#${board.num}: fix "${e[1]}" already in: ${it.t}`);
      if (e[3].length < 15 || e[3].length > 140) throw new Error(`#${board.num}: note length ${e[3].length}: ${e[3]}`);
      const key = `${lw}>${e[1].toLowerCase()}`;
      if (pairs.has(key)) throw new Error(`#${board.num}: pair ${key} used twice in this segment`);
      pairs.add(key);
      const t = typeOf(e, it.t);
      typeCount[t] = (typeCount[t] || 0) + 1;
      dayType[t] = (dayType[t] || 0) + 1;
    }
  }
  if (!dayGram) throw new Error(`#${board.num} ${board.live}: no grammar error`);
  if (dayGram * 2 >= dayErr + 1 && dayGram * 2 > dayErr) throw new Error(`#${board.num}: grammar ${dayGram} of ${dayErr} is not a minority`);
  for (const [k, v] of Object.entries(dayDomain)) if (v > PER_DAY_DOMAIN) throw new Error(`#${board.num}: domain ${k} ${v}x in one day`);
  for (const [k, v] of Object.entries(dayType)) { const cap = (k === 'homophone' ? PER_DAY_HOM : PER_DAY_TYPE)[sunday ? 1 : 0]; if (v > cap) throw new Error(`#${board.num} ${board.live}: error type ${k} ${v}x in one day, over ${cap}`); }
  if (!sunday) cleanPerWeekday.add(dayClean);
  boards.push(board);
});
for (const [k, v] of Object.entries(typeCount)) {
  const ceil = k === 'homophone' ? CEIL_HOMOPHONE : CEIL_TYPE;
  if (v / errors > ceil) throw new Error(`type ${k} is ${(100 * v / errors).toFixed(1)}% of errors, over the ${(100 * ceil).toFixed(0)}% ceiling`);
}
for (const [k, v] of Object.entries(domainCount)) {
  const ceil = k === 'heritage' ? CEIL_DOMAIN_HERITAGE : CEIL_DOMAIN;
  if (v / sentences > ceil) throw new Error(`domain ${k} is ${(100 * v / sentences).toFixed(1)}% of sentences, over the ${100 * ceil}% ceiling`);
}
const cleanShare = cleans / sentences;
if (cleanShare < CLEAN_BAND[0] || cleanShare > CLEAN_BAND[1]) throw new Error(`clean share ${(100 * cleanShare).toFixed(1)}% outside ${CLEAN_BAND.map((x) => 100 * x).join('-')}%`);
if (cleanPerWeekday.size < 3) throw new Error('weekday clean counts do not vary (a floor used as a target)');

const KIND = { g: 'grammar', w: 'wordchoice' };
function render(b) {
  const L = [];
  L.push('  {');
  L.push(`    num: ${b.num},`);
  L.push(`    quizId: '${b.quizId}',`);
  L.push(`    live: '${b.live}',`);
  L.push(`    dateLabel: '${b.dateLabel}',`);
  L.push(`    sunday: ${b.sunday},`);
  L.push('    items: [');
  for (const it of b.items) {
    L.push('      {');
    L.push(`        text: ${JSON.stringify(it.t)},`);
    if (!it.e || !it.e.length) {
      L.push('        errors: [],');
      L.push(`        cleanNote: ${JSON.stringify(it.c)},`);
    } else {
      const es = it.e.map((e) => `{ wrong: ${JSON.stringify(e[0])}, fix: ${JSON.stringify(e[1])}, kind: '${KIND[e[2]]}', note: ${JSON.stringify(e[3])} }`);
      L.push(`        errors: [${es.join(', ')}],`);
    }
    L.push('      },');
  }
  L.push('    ],');
  L.push('  },');
  return L.join('\n');
}

// ── positional variety (see note 4 in the header) ────────────────────────────
// Measured over THIS segment only; verify-stet.mjs re-checks it across the
// whole bank from VARIETY_FROM, which is the check that actually gates a push.
const POS = { false: { n: 5, days: 0, clean: [], gram: [] }, true: { n: 7, days: 0, clean: [], gram: [] } };
for (const k of Object.keys(POS)) { POS[k].clean = Array(POS[k].n).fill(0); POS[k].gram = Array(POS[k].n).fill(0); }
const runC = { false: Array(5).fill(0), true: Array(7).fill(0) };
const runG = { false: Array(5).fill(0), true: Array(7).fill(0) };
const lastSig = { false: null, true: null };
for (const b of boards) {
  const s = POS[b.sunday];
  s.days++;
  const cl = b.items.map((it) => !(it.e || []).length);
  const gr = b.items.map((it) => (it.e || []).some((e) => e[2] === 'g'));
  const sig = cl.map((c) => (c ? '.' : 'x')).join('');
  if (sig === lastSig[b.sunday]) throw new Error(`#${b.num} ${b.live}: same clean/error shape "${sig}" as the ${b.sunday ? 'Sunday' : 'weekday'} before it`);
  lastSig[b.sunday] = sig;
  for (let i = 0; i < s.n; i++) {
    runC[b.sunday][i] = cl[i] ? runC[b.sunday][i] + 1 : 0;
    runG[b.sunday][i] = gr[i] ? runG[b.sunday][i] + 1 : 0;
    if (runC[b.sunday][i] > 3) throw new Error(`#${b.num} ${b.live}: sentence #${i + 1} clean on ${runC[b.sunday][i]} straight ${b.sunday ? 'Sundays' : 'weekdays'}`);
    if (runG[b.sunday][i] > 3) throw new Error(`#${b.num} ${b.live}: sentence #${i + 1} carries the grammar slip on ${runG[b.sunday][i]} straight ${b.sunday ? 'Sundays' : 'weekdays'}`);
    if (cl[i]) s.clean[i]++;
    if (gr[i]) s.gram[i]++;
  }
}
const posLines = [];
for (const [k, label] of [['false', 'weekday'], ['true', 'Sunday']]) {
  const s = POS[k];
  if (!s.days) continue;
  for (let i = 0; i < s.n; i++) {
    if (s.clean[i] / s.days > 0.6) throw new Error(`sentence #${i + 1} is clean on ${(100 * s.clean[i] / s.days).toFixed(0)}% of ${label}s (max 60%)`);
    if (s.gram[i] / s.days > 0.6) throw new Error(`sentence #${i + 1} carries the grammar slip on ${(100 * s.gram[i] / s.days).toFixed(0)}% of ${label}s (max 60%)`);
    if (s.days >= 10 && !s.clean[i]) throw new Error(`sentence #${i + 1} is never clean across ${s.days} ${label}s`);
    if (s.days >= 10 && !s.gram[i]) throw new Error(`sentence #${i + 1} never carries the grammar slip across ${s.days} ${label}s`);
  }
  posLines.push(`${label} positions (${s.days} days): clean ${s.clean.map((v) => `${(100 * v / s.days).toFixed(0)}%`).join('/')} · grammar ${s.gram.map((v) => `${(100 * v / s.days).toFixed(0)}%`).join('/')}`);
}

const ledger = [
  `boards ${boards.length} (${boards[0].live} .. ${boards.at(-1).live}), sentences ${sentences}`,
  `errors ${errors} (${grammar} grammar, ${(100 * grammar / errors).toFixed(1)}%), clean ${cleans} (${(100 * cleanShare).toFixed(1)}%), two-error sentences ${doubles}`,
  `types: ${Object.entries(typeCount).sort((a, b) => b[1] - a[1]).map(([k, v]) => `${k} ${v} (${(100 * v / errors).toFixed(1)}%)`).join(', ')}`,
  `domains: ${Object.entries(domainCount).sort((a, b) => b[1] - a[1]).map(([k, v]) => `${k} ${v} (${(100 * v / sentences).toFixed(1)}%)`).join(', ')}`,
  `weekday clean counts in use: ${[...cleanPerWeekday].sort().join(', ')}`,
  ...posLines,
].join('\n');

if (process.argv.includes('--audit')) console.log(ledger);
else { console.log(boards.map(render).join('\n')); console.error(ledger); }
