// Puzzle data for Cipher, the daily cryptarithm. Imported ONLY by the server
// page (app/cipher/page.js), which filters live<=today before passing puzzles
// to the client — future equations never ship early.
//
// ADDITION ONLY, and the ADDEND COUNT is the variety axis (2026-08-08). Every
// puzzle is WORD + WORD ... = WORD. Subtraction was RETIRED: players read a
// borrow column as an error rather than a step, and the minuend/subtrahend
// framing buried the one thing the game is about, which is carrying. The eight
// subtraction drops that already went live (num 8 through 22, op "sub") are
// GRANDFATHERED — they are played, scored, and still replayable from the
// archive, so the client keeps its subtraction renderer. Never author another.
//
// WEEKDAY RAMP. The number of addends carries the week, easiest to hardest:
//   Mon / Tue / Wed  -> 2 addends   (WORD + WORD = WORD)
//   Thu / Fri / Sat  -> 3 addends   (WORD + WORD + WORD = WORD)
//   Sunday Edition   -> 4 addends   (WORD + WORD + WORD + WORD = WORD)
// Inside each band the days still ramp by measured difficulty (see below), so
// Monday is the easiest two-addend board of the week and Saturday the hardest
// three-addend one. Sunday is its own band and always the week's biggest.
//
// THEME RULE. Every word in an equation comes from ONE theme (animals, weather,
// land, plants, food, house, town, time, space, craft), which is what makes a
// board read as a phrase — URANUS + EARTH + SUN = SATURN, never a bag of
// letters. No theme runs two days in a row, no theme takes more than 7 slots in
// a bank, no word appears more than 3 times, no two boards share 2+ words, and
// no board contains two words sharing a four-letter stem (no ROAD + ROADS, no
// LATE + LATER).
//
// Every equation here is MACHINE-VERIFIED to have exactly one solution
// (distinct digits per letter, leading letters nonzero). The solution is not
// stored anywhere — the client checks the arithmetic directly. Validate with
// scripts/verify-cipher.mjs after ANY edit: it brute-forces every equation and
// fails unless each has exactly one solution, <= 10 distinct letters, and (from
// the addition-only launch on) op "add" with the addend count its weekday calls
// for.
//
// DIFFICULTY LADDER. Difficulty is measured by a column-wise solver (the way a
// person actually works one), counting search nodes. Targets: Mon ~450,
// Tue ~1.8k, Wed ~4.5k, Thu ~6k, Fri ~13k, Sat ~25k, Sun ~36k, with a little
// per-week jitter so a weekday is never the same node count twice running.
// Preserve the ladder when adding drops: put easy equations on Mondays.
export const PUZZLES = [
  { num: 1, quizId: "cipher-7-18-26", live: "2026-07-18", dateLabel: "July 18, 2026", sunday: false, op: "add", lhs: ["SEND","MORE"], rhs: "MONEY" },
  { num: 2, quizId: "cipher-7-19-26", live: "2026-07-19", dateLabel: "July 19, 2026", sunday: false, op: "add", lhs: ["FIFTY","STATES"], rhs: "AMERICA" },
  { num: 3, quizId: "cipher-7-20-26", live: "2026-07-20", dateLabel: "July 20, 2026", sunday: false, op: "add", lhs: ["EAT","THAT"], rhs: "APPLE" },
  { num: 4, quizId: "cipher-7-21-26", live: "2026-07-21", dateLabel: "July 21, 2026", sunday: false, op: "add", lhs: ["BASE","BALL"], rhs: "GAMES" },
  { num: 5, quizId: "cipher-7-22-26", live: "2026-07-22", dateLabel: "July 22, 2026", sunday: false, op: "add", lhs: ["SEA","REEF"], rhs: "WHALE" },
  { num: 6, quizId: "cipher-7-23-26", live: "2026-07-23", dateLabel: "July 23, 2026", sunday: false, op: "add", lhs: ["COCA","COLA"], rhs: "OASIS" },
  { num: 7, quizId: "cipher-7-24-26", live: "2026-07-24", dateLabel: "July 24, 2026", sunday: false, op: "add", lhs: ["BEAR","DEER"], rhs: "ZEBRA" },
  { num: 8, quizId: "cipher-7-25-26", live: "2026-07-25", dateLabel: "July 25, 2026", sunday: false, op: "sub", lhs: ["GRAPE","APPLE"], rhs: "PEAR" },
  { num: 9, quizId: "cipher-7-26-26", live: "2026-07-26", dateLabel: "July 26, 2026", sunday: true, op: "add", lhs: ["SNOW","MOON","NOON"], rhs: "STORM" },
  { num: 10, quizId: "cipher-7-27-26", live: "2026-07-27", dateLabel: "July 27, 2026", sunday: false, op: "sub", lhs: ["EAGLE","GRAPE"], rhs: "ZEBRA" },
  { num: 11, quizId: "cipher-7-28-26", live: "2026-07-28", dateLabel: "July 28, 2026", sunday: false, op: "add", lhs: ["CROSS","ROADS"], rhs: "DANGER" },
  { num: 12, quizId: "cipher-7-29-26", live: "2026-07-29", dateLabel: "July 29, 2026", sunday: false, op: "sub", lhs: ["TIGER","GRAPE"], rhs: "EARTH" },
  { num: 13, quizId: "cipher-7-30-26", live: "2026-07-30", dateLabel: "July 30, 2026", sunday: false, op: "add", lhs: ["MIST","FROST"], rhs: "WINTER" },
  { num: 14, quizId: "cipher-7-31-26", live: "2026-07-31", dateLabel: "July 31, 2026", sunday: false, op: "sub", lhs: ["BREAD","APPLE"], rhs: "PLAZA" },
  { num: 15, quizId: "cipher-8-1-26", live: "2026-08-01", dateLabel: "August 1, 2026", sunday: false, op: "add", lhs: ["HONEY","MELON"], rhs: "CREAM" },
  { num: 16, quizId: "cipher-8-2-26", live: "2026-08-02", dateLabel: "August 2, 2026", sunday: true, op: "sub", lhs: ["SLEET","SNOW","NOON"], rhs: "SOON" },
  { num: 17, quizId: "cipher-8-3-26", live: "2026-08-03", dateLabel: "August 3, 2026", sunday: false, op: "add", lhs: ["GREEN","ORANGE"], rhs: "COLORS" },
  { num: 18, quizId: "cipher-8-4-26", live: "2026-08-04", dateLabel: "August 4, 2026", sunday: false, op: "sub", lhs: ["MANGO","LIME"], rhs: "MILE" },
  { num: 19, quizId: "cipher-8-5-26", live: "2026-08-05", dateLabel: "August 5, 2026", sunday: false, op: "add", lhs: ["APPLE","GRAPE"], rhs: "CHERRY" },
  { num: 20, quizId: "cipher-8-6-26", live: "2026-08-06", dateLabel: "August 6, 2026", sunday: false, op: "sub", lhs: ["HEARTH","SPOON"], rhs: "STAIR" },
  { num: 21, quizId: "cipher-8-7-26", live: "2026-08-07", dateLabel: "August 7, 2026", sunday: false, op: "add", lhs: ["OLIVE","ROCK"], rhs: "RIVER" },
  { num: 22, quizId: "cipher-8-8-26", live: "2026-08-08", dateLabel: "August 8, 2026", sunday: false, op: "sub", lhs: ["CREAM","HONEY"], rhs: "MELON" },
  { num: 23, quizId: "cipher-8-9-26", live: "2026-08-09", dateLabel: "August 9, 2026", sunday: true, op: "add", lhs: ["HALL","HOME","LANE","MILL"], rhs: "ROAD" },
  { num: 24, quizId: "cipher-8-10-26", live: "2026-08-10", dateLabel: "August 10, 2026", sunday: false, op: "add", lhs: ["PASTA","STEAK"], rhs: "TOAST" },
  { num: 25, quizId: "cipher-8-11-26", live: "2026-08-11", dateLabel: "August 11, 2026", sunday: false, op: "add", lhs: ["GOOSE","WREN"], rhs: "SHEEP" },
  { num: 26, quizId: "cipher-8-12-26", live: "2026-08-12", dateLabel: "August 12, 2026", sunday: false, op: "add", lhs: ["PEARL","CAP"], rhs: "TORCH" },
  { num: 27, quizId: "cipher-8-13-26", live: "2026-08-13", dateLabel: "August 13, 2026", sunday: false, op: "add", lhs: ["BREAD","PASTA","PEAR"], rhs: "CHEESE" },
  { num: 28, quizId: "cipher-8-14-26", live: "2026-08-14", dateLabel: "August 14, 2026", sunday: false, op: "add", lhs: ["LINEN","QUILT","HALL"], rhs: "HEARTH" },
  { num: 29, quizId: "cipher-8-15-26", live: "2026-08-15", dateLabel: "August 15, 2026", sunday: false, op: "add", lhs: ["HOUSE","STORE","SHOP"], rhs: "CHURCH" },
  { num: 30, quizId: "cipher-8-16-26", live: "2026-08-16", dateLabel: "August 16, 2026", sunday: true, op: "add", lhs: ["GORGE","SHOAL","SHORE","VALE"], rhs: "EARTH" },
  { num: 31, quizId: "cipher-8-17-26", live: "2026-08-17", dateLabel: "August 17, 2026", sunday: false, op: "add", lhs: ["BEEF","EGG"], rhs: "JUICE" },
  { num: 32, quizId: "cipher-8-18-26", live: "2026-08-18", dateLabel: "August 18, 2026", sunday: false, op: "add", lhs: ["MONTH","NIGHT"], rhs: "WINTER" },
  { num: 33, quizId: "cipher-8-19-26", live: "2026-08-19", dateLabel: "August 19, 2026", sunday: false, op: "add", lhs: ["HORSE","SEAL"], rhs: "BADGER" },
  { num: 34, quizId: "cipher-8-20-26", live: "2026-08-20", dateLabel: "August 20, 2026", sunday: false, op: "add", lhs: ["PORCH","DOOR","JAR"], rhs: "CELLAR" },
  { num: 35, quizId: "cipher-8-21-26", live: "2026-08-21", dateLabel: "August 21, 2026", sunday: false, op: "add", lhs: ["COAST","OASIS","SHORE"], rhs: "RIVER" },
  { num: 36, quizId: "cipher-8-22-26", live: "2026-08-22", dateLabel: "August 22, 2026", sunday: false, op: "add", lhs: ["BAGEL","LEMON","MANGO"], rhs: "COCOA" },
  { num: 37, quizId: "cipher-8-23-26", live: "2026-08-23", dateLabel: "August 23, 2026", sunday: true, op: "add", lhs: ["SUMMER","WINTER","MIST","RAIN"], rhs: "AUTUMN" },
  { num: 38, quizId: "cipher-8-24-26", live: "2026-08-24", dateLabel: "August 24, 2026", sunday: false, op: "add", lhs: ["BROOM","ROOM"], rhs: "CANDLE" },
  { num: 39, quizId: "cipher-8-25-26", live: "2026-08-25", dateLabel: "August 25, 2026", sunday: false, op: "add", lhs: ["CAMEL","EAGLE"], rhs: "GECKO" },
  { num: 40, quizId: "cipher-8-26-26", live: "2026-08-26", dateLabel: "August 26, 2026", sunday: false, op: "add", lhs: ["REED","BUD"], rhs: "TULIP" },
  { num: 41, quizId: "cipher-8-27-26", live: "2026-08-27", dateLabel: "August 27, 2026", sunday: false, op: "add", lhs: ["URANUS","EARTH","SUN"], rhs: "SATURN" },
  { num: 42, quizId: "cipher-8-28-26", live: "2026-08-28", dateLabel: "August 28, 2026", sunday: false, op: "add", lhs: ["ATTIC","CLOTH","LATCH"], rhs: "CANDLE" },
  { num: 43, quizId: "cipher-8-29-26", live: "2026-08-29", dateLabel: "August 29, 2026", sunday: false, op: "add", lhs: ["BISON","CRANE","ROBIN"], rhs: "GOOSE" },
  { num: 44, quizId: "cipher-8-30-26", live: "2026-08-30", dateLabel: "August 30, 2026", sunday: true, op: "add", lhs: ["COAST","CREEK","GORGE","GRASS"], rhs: "STONE" },
  { num: 45, quizId: "cipher-8-31-26", live: "2026-08-31", dateLabel: "August 31, 2026", sunday: false, op: "add", lhs: ["GLASS","HALL"], rhs: "LATCH" },
  { num: 46, quizId: "cipher-9-1-26", live: "2026-09-01", dateLabel: "September 1, 2026", sunday: false, op: "add", lhs: ["GEESE","ZEBRA"], rhs: "BADGER" },
  { num: 47, quizId: "cipher-9-2-26", live: "2026-09-02", dateLabel: "September 2, 2026", sunday: false, op: "add", lhs: ["JELLY","OIL"], rhs: "SAUCE" },
  { num: 48, quizId: "cipher-9-3-26", live: "2026-09-03", dateLabel: "September 3, 2026", sunday: false, op: "add", lhs: ["CRATE","TILE","TIN"], rhs: "QUILT" },
  { num: 49, quizId: "cipher-9-4-26", live: "2026-09-04", dateLabel: "September 4, 2026", sunday: false, op: "add", lhs: ["MINUTE","MOON","EVE"], rhs: "AUTUMN" },
  { num: 50, quizId: "cipher-9-5-26", live: "2026-09-05", dateLabel: "September 5, 2026", sunday: false, op: "add", lhs: ["BACON","SAUCE","BUN"], rhs: "COCOA" },
  { num: 51, quizId: "cipher-9-6-26", live: "2026-09-06", dateLabel: "September 6, 2026", sunday: true, op: "add", lhs: ["COMET","SOLAR","STAR","ORB"], rhs: "METEOR" },
  { num: 52, quizId: "cipher-9-7-26", live: "2026-09-07", dateLabel: "September 7, 2026", sunday: false, op: "add", lhs: ["LINEN","PANEL"], rhs: "CANDLE" },
  { num: 53, quizId: "cipher-9-8-26", live: "2026-09-08", dateLabel: "September 8, 2026", sunday: false, op: "add", lhs: ["FRIES","RICE"], rhs: "CHERRY" },
  { num: 54, quizId: "cipher-9-9-26", live: "2026-09-09", dateLabel: "September 9, 2026", sunday: false, op: "add", lhs: ["GOOSE","LARK"], rhs: "BADGER" },
  { num: 55, quizId: "cipher-9-10-26", live: "2026-09-10", dateLabel: "September 10, 2026", sunday: false, op: "add", lhs: ["ARENA","HOTEL","MALL"], rhs: "MARKET" },
  { num: 56, quizId: "cipher-9-11-26", live: "2026-09-11", dateLabel: "September 11, 2026", sunday: false, op: "add", lhs: ["PALM","SEED","BUD"], rhs: "PETAL" },
  { num: 57, quizId: "cipher-9-12-26", live: "2026-09-12", dateLabel: "September 12, 2026", sunday: false, op: "add", lhs: ["SPACE","MARS","MOON"], rhs: "METEOR" },
  { num: 58, quizId: "cipher-9-13-26", live: "2026-09-13", dateLabel: "September 13, 2026", sunday: true, op: "add", lhs: ["DINER","KIOSK","FORT","INN"], rhs: "STREET" },
  { num: 59, quizId: "cipher-9-14-26", live: "2026-09-14", dateLabel: "September 14, 2026", sunday: false, op: "add", lhs: ["SHEEP","PUP"], rhs: "EAGLE" },
  { num: 60, quizId: "cipher-9-15-26", live: "2026-09-15", dateLabel: "September 15, 2026", sunday: false, op: "add", lhs: ["BADGE","GOLD"], rhs: "JEWEL" },
  { num: 61, quizId: "cipher-9-16-26", live: "2026-09-16", dateLabel: "September 16, 2026", sunday: false, op: "add", lhs: ["FROST","NOON"], rhs: "STORM" },
  { num: 62, quizId: "cipher-9-17-26", live: "2026-09-17", dateLabel: "September 17, 2026", sunday: false, op: "add", lhs: ["CREEK","RIVER","COVE"], rhs: "VALLEY" },
  { num: 63, quizId: "cipher-9-18-26", live: "2026-09-18", dateLabel: "September 18, 2026", sunday: false, op: "add", lhs: ["DINER","HOUSE","ROADS"], rhs: "ARENA" },
  { num: 64, quizId: "cipher-9-19-26", live: "2026-09-19", dateLabel: "September 19, 2026", sunday: false, op: "add", lhs: ["MAPLE","PETAL","SHOOT"], rhs: "ROOTS" },
  { num: 65, quizId: "cipher-9-20-26", live: "2026-09-20", dateLabel: "September 20, 2026", sunday: true, op: "add", lhs: ["GRASS","GROVE","LAKE","VALE"], rhs: "VALLEY" },
  { num: 66, quizId: "cipher-9-21-26", live: "2026-09-21", dateLabel: "September 21, 2026", sunday: false, op: "add", lhs: ["HORN","IRON"], rhs: "RING" },
  { num: 67, quizId: "cipher-9-22-26", live: "2026-09-22", dateLabel: "September 22, 2026", sunday: false, op: "add", lhs: ["MALL","WALK"], rhs: "WHARF" },
  { num: 68, quizId: "cipher-9-23-26", live: "2026-09-23", dateLabel: "September 23, 2026", sunday: false, op: "add", lhs: ["CAPE","PEAK"], rhs: "CLIFF" },
  { num: 69, quizId: "cipher-9-24-26", live: "2026-09-24", dateLabel: "September 24, 2026", sunday: false, op: "add", lhs: ["CANOE","CHESS","NOTES"], rhs: "PAPER" },
  { num: 70, quizId: "cipher-9-25-26", live: "2026-09-25", dateLabel: "September 25, 2026", sunday: false, op: "add", lhs: ["ALLEY","HOME","MALL"], rhs: "STREET" },
  { num: 71, quizId: "cipher-9-26-26", live: "2026-09-26", dateLabel: "September 26, 2026", sunday: false, op: "add", lhs: ["MINUTE","NIGHT","TIME"], rhs: "SUMMER" },
  { num: 72, quizId: "cipher-9-27-26", live: "2026-09-27", dateLabel: "September 27, 2026", sunday: true, op: "add", lhs: ["FERN","REED","ROSE","SEED"], rhs: "LEAF" },
  { num: 73, quizId: "cipher-9-28-26", live: "2026-09-28", dateLabel: "September 28, 2026", sunday: false, op: "add", lhs: ["SHOAL","HILL"], rhs: "OASIS" },
  { num: 74, quizId: "cipher-9-29-26", live: "2026-09-29", dateLabel: "September 29, 2026", sunday: false, op: "add", lhs: ["COIN","IRON"], rhs: "CAMEO" },
  { num: 75, quizId: "cipher-9-30-26", live: "2026-09-30", dateLabel: "September 30, 2026", sunday: false, op: "add", lhs: ["SCHOOL","HOTEL"], rhs: "MUSEUM" },
  { num: 76, quizId: "cipher-10-1-26", live: "2026-10-01", dateLabel: "October 1, 2026", sunday: false, op: "add", lhs: ["SLEET","CLOUD","COLD"], rhs: "SQUALL" },
  { num: 77, quizId: "cipher-10-2-26", live: "2026-10-02", dateLabel: "October 2, 2026", sunday: false, op: "add", lhs: ["TOOL","GLUE","FORGE"], rhs: "MALLET" },
  { num: 78, quizId: "cipher-10-3-26", live: "2026-10-03", dateLabel: "October 3, 2026", sunday: false, op: "add", lhs: ["PEAK","SLOPE","CAVE"], rhs: "VALLEY" },
  { num: 79, quizId: "cipher-10-4-26", live: "2026-10-04", dateLabel: "October 4, 2026", sunday: true, op: "add", lhs: ["FLOOR","ATTIC","ROOF","CHAIR"], rhs: "PORCH" },
  { num: 80, quizId: "cipher-10-5-26", live: "2026-10-05", dateLabel: "October 5, 2026", sunday: false, op: "add", lhs: ["HILL","CLIFF"], rhs: "SUMMIT" },
  { num: 81, quizId: "cipher-10-6-26", live: "2026-10-06", dateLabel: "October 6, 2026", sunday: false, op: "add", lhs: ["CHISEL","LOOM"], rhs: "NEEDLE" },
  { num: 82, quizId: "cipher-10-7-26", live: "2026-10-07", dateLabel: "October 7, 2026", sunday: false, op: "add", lhs: ["BEANS","BREAD"], rhs: "RAISIN" },
  { num: 83, quizId: "cipher-10-8-26", live: "2026-10-08", dateLabel: "October 8, 2026", sunday: false, op: "add", lhs: ["MALLET","NEEDLE","NAIL"], rhs: "THREAD" },
  { num: 84, quizId: "cipher-10-9-26", live: "2026-10-09", dateLabel: "October 9, 2026", sunday: false, op: "add", lhs: ["PEAR","ONION","CREAM"], rhs: "PEPPER" },
  { num: 85, quizId: "cipher-10-10-26", live: "2026-10-10", dateLabel: "October 10, 2026", sunday: false, op: "add", lhs: ["STAIR","ROOF","SOFA"], rhs: "PANTRY" },
  { num: 86, quizId: "cipher-10-11-26", live: "2026-10-11", dateLabel: "October 11, 2026", sunday: true, op: "add", lhs: ["MOOSE","SWAN","WASP","SHEEP"], rhs: "WEASEL" },
  { num: 87, quizId: "cipher-10-12-26", live: "2026-10-12", dateLabel: "October 12, 2026", sunday: false, op: "add", lhs: ["QUASAR","SOLAR"], rhs: "NEBULA" },
  { num: 88, quizId: "cipher-10-13-26", live: "2026-10-13", dateLabel: "October 13, 2026", sunday: false, op: "add", lhs: ["HORSE","OTTER"], rhs: "WEASEL" },
  { num: 89, quizId: "cipher-10-14-26", live: "2026-10-14", dateLabel: "October 14, 2026", sunday: false, op: "add", lhs: ["SPACE","LUNAR"], rhs: "NEBULA" },
  { num: 90, quizId: "cipher-10-15-26", live: "2026-10-15", dateLabel: "October 15, 2026", sunday: false, op: "add", lhs: ["PINE","PALM","MAPLE"], rhs: "LAUREL" },
  { num: 91, quizId: "cipher-10-16-26", live: "2026-10-16", dateLabel: "October 16, 2026", sunday: false, op: "add", lhs: ["WOOD","POTTER","TOOL"], rhs: "THREAD" },
  { num: 92, quizId: "cipher-10-17-26", live: "2026-10-17", dateLabel: "October 17, 2026", sunday: false, op: "add", lhs: ["ONION","CORN","SOUP"], rhs: "CARROT" },
  { num: 93, quizId: "cipher-10-18-26", live: "2026-10-18", dateLabel: "October 18, 2026", sunday: true, op: "add", lhs: ["DOVE","OTTER","FOAL","TOAD"], rhs: "BEAVER" },
  { num: 94, quizId: "cipher-10-19-26", live: "2026-10-19", dateLabel: "October 19, 2026", sunday: false, op: "add", lhs: ["DOOR","FLOOR"], rhs: "MANTEL" },
  { num: 95, quizId: "cipher-10-20-26", live: "2026-10-20", dateLabel: "October 20, 2026", sunday: false, op: "add", lhs: ["DEER","HERON"], rhs: "TURTLE" },
  { num: 96, quizId: "cipher-10-21-26", live: "2026-10-21", dateLabel: "October 21, 2026", sunday: false, op: "add", lhs: ["VINE","GRASS"], rhs: "LAUREL" },
  { num: 97, quizId: "cipher-10-22-26", live: "2026-10-22", dateLabel: "October 22, 2026", sunday: false, op: "add", lhs: ["YEAR","SUMMER","AGES"], rhs: "DECADE" },
  { num: 98, quizId: "cipher-10-23-26", live: "2026-10-23", dateLabel: "October 23, 2026", sunday: false, op: "add", lhs: ["TAVERN","SQUARE","STREET"], rhs: "MUSEUM" },
  { num: 99, quizId: "cipher-10-24-26", live: "2026-10-24", dateLabel: "October 24, 2026", sunday: false, op: "add", lhs: ["REED","LAUREL","CEDAR"], rhs: "WILLOW" },
  { num: 100, quizId: "cipher-10-25-26", live: "2026-10-25", dateLabel: "October 25, 2026", sunday: true, op: "add", lhs: ["STEW","ONION","TOAST","MINT"], rhs: "RAISIN" },
  { num: 101, quizId: "cipher-10-26-26", live: "2026-10-26", dateLabel: "October 26, 2026", sunday: false, op: "add", lhs: ["NAIL","KILN"], rhs: "PAINT" },
  { num: 102, quizId: "cipher-10-27-26", live: "2026-10-27", dateLabel: "October 27, 2026", sunday: false, op: "add", lhs: ["SNAKE","WEASEL"], rhs: "TURTLE" },
  { num: 103, quizId: "cipher-10-28-26", live: "2026-10-28", dateLabel: "October 28, 2026", sunday: false, op: "add", lhs: ["MINUTE","MOMENT"], rhs: "SECOND" },
  { num: 104, quizId: "cipher-10-29-26", live: "2026-10-29", dateLabel: "October 29, 2026", sunday: false, op: "add", lhs: ["RAVEN","HARE","HERON"], rhs: "MARTEN" },
  { num: 105, quizId: "cipher-10-30-26", live: "2026-10-30", dateLabel: "October 30, 2026", sunday: false, op: "add", lhs: ["DATE","MONTH","SEASON"], rhs: "MOMENT" },
  { num: 106, quizId: "cipher-10-31-26", live: "2026-10-31", dateLabel: "October 31, 2026", sunday: false, op: "add", lhs: ["SUN","SOLAR","LUNAR"], rhs: "GALAXY" },
  { num: 107, quizId: "cipher-11-1-26", live: "2026-11-01", dateLabel: "November 1, 2026", sunday: true, op: "add", lhs: ["SALT","CARROT","FEAST","STEW"], rhs: "WAFFLE" },
  { num: 108, quizId: "cipher-11-2-26", live: "2026-11-02", dateLabel: "November 2, 2026", sunday: false, op: "add", lhs: ["MANTEL","GLASS"], rhs: "KETTLE" },
  { num: 109, quizId: "cipher-11-3-26", live: "2026-11-03", dateLabel: "November 3, 2026", sunday: false, op: "add", lhs: ["QUASAR","METEOR"], rhs: "COSMOS" },
  { num: 110, quizId: "cipher-11-4-26", live: "2026-11-04", dateLabel: "November 4, 2026", sunday: false, op: "add", lhs: ["GALE","SLEET"], rhs: "AUTUMN" },
  { num: 111, quizId: "cipher-11-5-26", live: "2026-11-05", dateLabel: "November 5, 2026", sunday: false, op: "add", lhs: ["MOSS","SPRUCE","ROSE"], rhs: "CACTUS" },
  { num: 112, quizId: "cipher-11-6-26", live: "2026-11-06", dateLabel: "November 6, 2026", sunday: false, op: "add", lhs: ["MESA","STREAM","SWAMP"], rhs: "DESERT" },
  { num: 113, quizId: "cipher-11-7-26", live: "2026-11-07", dateLabel: "November 7, 2026", sunday: false, op: "add", lhs: ["CORNER","ROAD","CAFE"], rhs: "OFFICE" },
  { num: 114, quizId: "cipher-11-8-26", live: "2026-11-08", dateLabel: "November 8, 2026", sunday: true, op: "add", lhs: ["KILN","LACE","TWINE","INK"], rhs: "MALLET" },
  { num: 115, quizId: "cipher-11-9-26", live: "2026-11-09", dateLabel: "November 9, 2026", sunday: false, op: "add", lhs: ["YEAR","LATER"], rhs: "FUTURE" },
  { num: 116, quizId: "cipher-11-10-26", live: "2026-11-10", dateLabel: "November 10, 2026", sunday: false, op: "add", lhs: ["WHALE","CAMEL"], rhs: "FALCON" },
  { num: 117, quizId: "cipher-11-11-26", live: "2026-11-11", dateLabel: "November 11, 2026", sunday: false, op: "add", lhs: ["BACON","SALMON"], rhs: "CHEESE" },
  { num: 118, quizId: "cipher-11-12-26", live: "2026-11-12", dateLabel: "November 12, 2026", sunday: false, op: "add", lhs: ["HORSE","FROG","MOUSE"], rhs: "GOPHER" },
  { num: 119, quizId: "cipher-11-13-26", live: "2026-11-13", dateLabel: "November 13, 2026", sunday: false, op: "add", lhs: ["LACE","GLUE","PLANE"], rhs: "CANVAS" },
  { num: 120, quizId: "cipher-11-14-26", live: "2026-11-14", dateLabel: "November 14, 2026", sunday: false, op: "add", lhs: ["ISLE","FIELD","DELTA"], rhs: "STREAM" },
  { num: 121, quizId: "cipher-11-15-26", live: "2026-11-15", dateLabel: "November 15, 2026", sunday: true, op: "add", lhs: ["SAGE","FERN","CEDAR","GARDEN"], rhs: "FUNGUS" },
  { num: 122, quizId: "cipher-11-16-26", live: "2026-11-16", dateLabel: "November 16, 2026", sunday: false, op: "add", lhs: ["PORCH","COUCH"], rhs: "MIRROR" },
  { num: 123, quizId: "cipher-11-17-26", live: "2026-11-17", dateLabel: "November 17, 2026", sunday: false, op: "add", lhs: ["WINDY","SUNNY"], rhs: "SQUALL" },
  { num: 124, quizId: "cipher-11-18-26", live: "2026-11-18", dateLabel: "November 18, 2026", sunday: false, op: "add", lhs: ["TEMPLE","HOTEL"], rhs: "CORNER" },
  { num: 125, quizId: "cipher-11-19-26", live: "2026-11-19", dateLabel: "November 19, 2026", sunday: false, op: "add", lhs: ["MARS","STAR","CRATER"], rhs: "SATURN" },
  { num: 126, quizId: "cipher-11-20-26", live: "2026-11-20", dateLabel: "November 20, 2026", sunday: false, op: "add", lhs: ["WEEK","CLOCK","TODAY"], rhs: "DECADE" },
  { num: 127, quizId: "cipher-11-21-26", live: "2026-11-21", dateLabel: "November 21, 2026", sunday: false, op: "add", lhs: ["MEAT","LIME","CARROT"], rhs: "PEPPER" },
  { num: 128, quizId: "cipher-11-22-26", live: "2026-11-22", dateLabel: "November 22, 2026", sunday: true, op: "add", lhs: ["ALLEY","MARKET","PARK","PIER"], rhs: "TEMPLE" },
  { num: 129, quizId: "cipher-11-23-26", live: "2026-11-23", dateLabel: "November 23, 2026", sunday: false, op: "add", lhs: ["FOREST","COAST"], rhs: "DESERT" },
  { num: 130, quizId: "cipher-11-24-26", live: "2026-11-24", dateLabel: "November 24, 2026", sunday: false, op: "add", lhs: ["MISTY","GUST"], rhs: "SPRING" },
  { num: 131, quizId: "cipher-11-25-26", live: "2026-11-25", dateLabel: "November 25, 2026", sunday: false, op: "add", lhs: ["CAMEL","MOOSE"], rhs: "WALRUS" },
  { num: 132, quizId: "cipher-11-26-26", live: "2026-11-26", dateLabel: "November 26, 2026", sunday: false, op: "add", lhs: ["FERN","ROOT","VIOLET"], rhs: "CLOVER" },
  { num: 133, quizId: "cipher-11-27-26", live: "2026-11-27", dateLabel: "November 27, 2026", sunday: false, op: "add", lhs: ["PAINT","STAIN","PENCIL"], rhs: "CANVAS" },
  { num: 134, quizId: "cipher-11-28-26", live: "2026-11-28", dateLabel: "November 28, 2026", sunday: false, op: "add", lhs: ["ATTIC","KETTLE","GARAGE"], rhs: "CELLAR" },
  { num: 135, quizId: "cipher-11-29-26", live: "2026-11-29", dateLabel: "November 29, 2026", sunday: true, op: "add", lhs: ["STAR","URANUS","PLUTO","LUNAR"], rhs: "PLANET" },
  { num: 136, quizId: "cipher-11-30-26", live: "2026-11-30", dateLabel: "November 30, 2026", sunday: false, op: "add", lhs: ["BRIAR","CEDAR"], rhs: "ORCHID" },
];
