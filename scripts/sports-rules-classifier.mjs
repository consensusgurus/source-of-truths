// scripts/sports-rules-classifier.mjs — the screen that decides whether a
// sports question is a RULES-TYPE question, shared by scripts/streak-rules.mjs
// (Streak's Sports lane) and scripts/verify-deep.mjs (Deep's sports-topic days).
//
// THE RULE IT SERVES (owner ruling, 2026-09-23). At most ONE rules-type sports
// question a day, in both gauntlets. The bank had drifted into asking how a
// sport works (how many players, what a play is called, which club you putt
// with) on two, three, five and in Golf's case seven slots of the same day,
// and the owner wants the lane spent on sport's history, people, teams,
// records and events instead.
//
// WHAT "RULES-TYPE" MEANS. A question that asks how a sport ITSELF works
// rather than about its history, people, teams, records or events:
//   * scoring: what a score is worth, what a score is called
//   * counts and dimensions: how many players, periods, minutes, innings,
//     outs, sets, holes, rounds, overs; how long, high or far a court, pool,
//     rim, race or field is
//   * terminology: what a play, term, violation, position, stroke, technique,
//     formation or discipline is called, and what an abbreviation stands for
//   * officials, equipment and apparatus: what a referee counts to, which club
//     lifts a ball from a bunker, what a jumper lands on
//   * naming a sport or event from its mechanics ("which sport slides stones
//     toward a target while sweeping the ice"), which tests exactly the same
//     knowledge from the other end
// A question about a rule's HISTORY is not rules-type: when something was
// introduced, who wrote the first rules, which league merged in and brought
// the long-range line with it. So is anything about a named person, team,
// venue, trophy, race or edition.
//
// HOW THE SCREEN DECIDES, in order:
//   1. HISTORY PINS. A four-digit year, or a proper noun that is not one of the
//      sport-naming words in SPORT_PROPER (Olympic, American, Formula One,
//      NBA...), marks the question as about a person, team, place or event,
//      and it is not rules-type. "Which system introduced in 2009 recovered
//      braking energy" is history; "Which Italian circuit" is a place.
//   2. RULES SIGNALS. Otherwise it is rules-type if the stem counts or measures
//      ("how many", "how long", "what length"), asks what something is CALLED,
//      opens on a sport ("In cricket, what..."), asks which sport, event,
//      stroke, position, apparatus or club fits a description, asks what a
//      player uses, wears, hits or lands on, or names an official, a score, a
//      violation or an abbreviation.
//
// IT IS A SCREEN, NOT AN ORACLE. It was tuned against a hand classification of
// every sports question live from 2026-09-24 (340 Streak Sports-lane and 120
// Deep sports-day questions) and agreed with it on all but two, both on the
// frozen Streak day 2026-09-27 and both missed rather than over-flagged: a count
// question pinned to 'world championship' (read as an event) and a discipline
// named with 'Japan' in the stem (read as a place). Where it is
// wrong about a new question, fix the question's wording or pin it to its
// event, not the screen. Loosen the screen only for a whole class of stems it
// misreads, and re-run both selftests afterwards.

// Capitalized words that name a sport, a governing body or a programme rather
// than a person, team, place or event. Their presence is NOT a history pin.
export const SPORT_PROPER = new Set([
  'Olympic', 'Olympics', 'Paralympic', 'Paralympics', 'Summer', 'Winter', 'Games',
  'American', 'Formula', 'One', 'Grand', 'Prix', 'Slam', 'Alpine', 'Nordic',
  'NBA', 'NFL', 'NHL', 'MLB', 'NCAA', 'FIFA', 'UFC', 'Twenty20', 'Test', 'I',
]);

const YEAR = /\b(1[5-9]\d\d|20\d\d)s?\b/;

// A question that opens on a sport ("In tennis, ...", "In a boxing match, ...").
const SPORT_PREFIX = /^(in|on|during) (a |an |the )?[a-z][a-z' -]*, /i;

// Event pins: the question is about a named competition, prize or occasion,
// or about how often one is staged, not about how the sport is played.
const EVENT_PIN = /\b(championships?|trophy|cup|tournaments?|ceremony|award|medals?)\b|\b(held|staged|hosted)\b(?! with)|\bmost (famous|glamorous|prestigious)\b|\boldest\b/i;

// A nationality or place adjective in front of a sport noun ("In which
// Japanese sport...") still asks which SPORT fits a description, so it
// outranks the proper-noun history pin.
const SPORT_NOUN_OVERRIDE = /^(?:[Ii]n |[Oo]n )?(?:[Ww]hich|[Ww]hat) [A-Z][a-z]+ (sport|martial art|combat sport|board game|card game)\b/;

const RULES_SIGNALS = [
  /\bhow (many|long|often|high|far|wide|heavy|deep)\b/i,
  /\bwhat (length|height|distance|weight|shape|number|size)\b/i,
  /\bfrom what height\b/i,
  /\bcalled\?$/i,
  /\bcalled (when|if|for)\b|\bwhat is it called\b/i,
  /\bwhat is the (length|height|distance|weight|size|shape|highest|lowest|maximum|minimum)\b/i,
  /\bhighest (possible )?score\b/i,
  /^what is the [a-z' -]+ (filled|made|covered) (with|of|in)\?$/i,
  /^in (which|what) order\b/i,
  /\b(must|may not|is allowed|are allowed|not allowed)\b/i,
  /\b(what|which) (word|term|name)\b/i,
  /\bthe name for\b/i,
  /\bstands? for\b|\babbreviat/i,
  /^(in|on) (which|what) (\w+ ){0,2}(sport|event|game)\b/i,
  /^which (of the (two|three|four|five) )?([\w'-]+ ){0,3}(sports?|events?|disciplines?|strokes?|techniques?|positions?|apparatus|styles?|formations?|jumps?|lifts?|division|weight class|martial art|clubs?|shots?|throws?|races?|flags?|lines?|fielders?|forms?|sessions?|distances?|kicks?)\b/i,
  /^which ([\w'-]+ ){0,2}(game|games)\b.*\b(played|contested|uses?|throw|hit|kick)\b/i,
  /^what (do|does|must|did) (a|an|the|you|competitive|each)\b/i,
  /\b(referee|umpire|linesman|linesmen|foul|violation|infraction|offside|penalty kick)\b/i,
  /\bworth\b|\bpoints? (is|are|does)\b/i,
];

const words = (s) => String(s).replace(/[^A-Za-z0-9' -]+/g, ' ').split(/\s+/).filter(Boolean);

// A proper noun that is not a sport-naming word: any capitalized token after
// the first word of the stem, or after the opening "In" of a sport prefix.
export function historyPin(stem) {
  const s = String(stem);
  if (YEAR.test(s)) return true;
  const w = words(s);
  for (let i = 1; i < w.length; i++) {
    const t = w[i].replace(/'s$/, '');
    if (/^[A-Z]/.test(t) && !SPORT_PROPER.has(t)) return true;
  }
  return false;
}

export function isSportsRules(stem) {
  const s = String(stem).trim();
  if (EVENT_PIN.test(s) || YEAR.test(s)) return false;
  if (SPORT_NOUN_OVERRIDE.test(s)) return true;
  if (historyPin(s)) return false;
  if (SPORT_PREFIX.test(s)) return true;
  return RULES_SIGNALS.some((re) => re.test(s));
}

// Deep days whose topic is a sport, so every question on them is a sports
// question. Matched on the topic name; add a sport here when a new topic ships.
export const SPORT_TOPIC = /\b(sports?|olympics?|paralympics?|world cup|football|soccer|basketball|baseball|softball|tennis|golf|boxing|wrestling|formula one|motor racing|nascar|ice hockey|hockey|cycling|cricket|rugby|athletics|track and field|swimming|diving|skiing|snowboarding|skating|gymnastics|volleyball|lacrosse|rowing|sailing|horse racing|martial arts|judo|karate|fencing|archery|darts|snooker|billiards|bowling|marathon|super bowl|nba|nfl|nhl|mlb)\b/i;
