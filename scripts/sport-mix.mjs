// scripts/sport-mix.mjs: the shared rules for WHAT a Sport day is made of.
// Imported by scripts/verify-sport.mjs and scripts/sport-global-mix.mjs so the
// planner and the gate cannot disagree.
//
// THE GLOBAL MIX (owner, 2026-10-30): "make our sports trivia category less US
// centric. It should still use US centric questions, but the mix should shift
// more globally. Do not delete questions, just push them out to future
// inventory." From SPORT_GLOBAL_FROM every tier block of five runs
//
//     World, US, World, US, World
//
// so a day is 15 world questions and 10 US ones (it had been NFL, NBA, MLB,
// Soccer, Everything Else: 60% US leagues before counting the US questions in
// the last two lanes, about two thirds US in all). A question is US when its
// lane is NFL, NBA or MLB, or when a Soccer / Everything Else question is about
// an American team, player, event or league (isUSQuestion, below: MLS, the NHL,
// US college sport, an American skater or sprinter, the US Open, the Masters).
// Each tier's world slots hold at least one Soccer question (the rest lean to
// Olympics, tennis, cricket, rugby, motorsport and the like while they last),
// its two US slots are two different kinds (NFL, NBA, MLB, or other US sport),
// and a day carries each of the NFL, NBA and MLB at least twice. The US questions this leaves over are not deleted:
// they wait in scripts/sport-lanes/sport-inventory.mjs for later days.

export const SPORT_GLOBAL_FROM = '2026-10-31';
export const MIX_PATTERN = ['world', 'us', 'world', 'us', 'world'];
export const US_LEAGUES = new Set(['NFL', 'NBA', 'MLB']);

export const US_RE = /\b(American|Americans|United States|U\.S\.|USA|US Open|NHL|NCAA|college|Heisman|Super Bowl|Kentucky Derby|Indianapolis|Indy|NASCAR|Daytona|Masters|Augusta|Stanley Cup|MLS|Major League Soccer|USMNT|USWNT|WNBA|Rose Bowl|Final Four|Boston|New York|Chicago|Los Angeles|Atlanta|Pebble Beach|Belmont|Preakness|Triple Crown|Harlem|PGA|North American)\b/;

/** Is this question US-centric? Its lane, or its stem and answer. */
export function isUSQuestion(q) {
  if (US_LEAGUES.has(q.cat)) return true;
  const ans = Array.isArray(q.choices) ? q.choices[q.correct] : (q.a || '');
  return US_RE.test(`${q.q} ${ans}`);
}

/** The US kind a question fills: its league, or 'US other'. */
export function usKind(q) { return US_LEAGUES.has(q.cat) ? q.cat : 'US other'; }

// AT MOST ONE RULES QUESTION A DAY: the classifier, moved here verbatim from
// scripts/verify-sport.mjs (2026-10-30) so the planner can respect the cap.

const RULES_PAST = /\b(did|was|were|had|became)\b|\b1[89]\d\d\b|\b20\d\d\b/i;
const RULES_NOT = /\b(which body|annual|fans?|supporters?|crowd|nickname|nicknamed|division|league|trophy|cup|award|tournament|championship|shirts?|uniform|jersey|kit|helmet|stadium|ballpark|arena|song|chant|tour de france|grand slam)\b/i;
const RULES_PATTERNS = [
  [/\b(term|word|phrase) (for|given to)\b/i, 'term for'],
  [/^(what|which)\b[^?]*\b(is|are)\b[^?]*\bcalled\b/i, 'is called'],
  [/\bknown as\?$/i, 'is called'],
  [/\bwhat is the name (of|for|given to) the\b/i, 'name of the'],
  [/\bwhat is the title of\b/i, 'title of'],
  [/\b(stand for|stands for|abbreviat)\b|\bwhat do the (letters|initials)\b/i, 'abbreviation'],
  [/^how (many|long|far|deep|wide|tall|high|much)\b/i, 'how many'],
  [/\bhow many (points|players|minutes|periods|innings|outs|strikes|balls|sets|holes|downs|yards|seconds|quarters|timeouts|events|pins|bases|rounds|pieces|squares|feet|inches|meters|red balls|clubs|deliveries|stitches|barriers|pullers|umpires|officials|corner arcs)\b[^?]*\b(is|are|does|do|must|may|make|makes|take|gets?)\b/i, 'how many'],
  [/^how (is|are|does|do)\b/i, 'how does'],
  [/^in (a |an |the )?[a-z -]+,\s*(what|how|which|who)\b/i, 'in sport,'],
  [/^what (do|does|must|happens|has|should)\b/i, 'what does'],
  [/^what colou?r (is|are)\b/i, 'what color'],
  [/\b(violation|foul|fouls|penalty|penalties)\b[^?]*\b(is|are|called|whistled|assessed|gives?)\b/i, 'violation'],
  [/\b(under the rules|laws of the game|legal|illegal|against the rules)\b/i, 'legality'],
  [/\bworth\b/i, 'worth'],
  [/^(on|in) (a|the) (scorecard|scoreboard|box score|line score)\b/i, 'scorecard'],
  [/^which (offensive |defensive |special teams )?(position|base|pitch|breaking pitch|infielder|outfielder|lineman|linemen|reliever|device|statistic|piece|apparatus|member of a team|side|two offensive|defensive back|specialist|player)\b[^?]*\b(is|are|lines up|stands|plays|takes|sends|receives|stationed|normally|traditionally|usually|must|may)\b/i, 'which position'],
  [/^(in )?which (olympic |winter |indoor |endurance |team |south asian |equestrian |athletics |women's gymnastics )?(sport|event|discipline|apparatus|martial art|throwing event|road race|winter sport|sliding sport)\b[^?]*\b(uses?|features?|combines?|contest|contests|contested|performs?|shoot|ride|rides|consists|involves|raced|run|has|do|does|must|would)\b/i, 'which sport'],
  [/\b(piece of (protective )?(equipment|gear)|protective (gear|equipment|item)|wear on|wear over|wear under|worn under|strap to)\b/i, 'equipment'],
  [/\bwhich (material|implement|stick|device)\b/i, 'equipment'],
];
export function rulesHit(stem) {
  const s = String(stem);
  if (RULES_PAST.test(s) || RULES_NOT.test(s)) return null;
  for (const [re, tag] of RULES_PATTERNS) if (re.test(s)) return tag;
  return null;
}
