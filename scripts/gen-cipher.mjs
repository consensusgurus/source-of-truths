// scripts/gen-cipher.mjs — Cipher bank generator (added 2026-09-23 for the Nov
// 2026 restock). Deterministic: each board is seeded off its own num, so a re-run
// reproduces the same output and never replays a frozen board.
//
//   node scripts/gen-cipher.mjs --from 2026-11-01 --days 30 --startnum 107
//
// Prints board lines ready to splice before the closing `];` of
// app/cipher/puzzles.js. The rules are the header of that file (and CLAUDE.md,
// "Cipher is ADDITION ONLY"):
//   * addition only; addends by weekday: Mon/Tue/Wed 2, Thu/Fri/Sat 3, Sun 4;
//   * EXACTLY ONE solution (distinct digits, no leading zero), <= 10 letters;
//   * every word from ONE theme; no theme two days running (including across the
//     join with the frozen bank); no theme past 7 slots in this batch;
//   * no word more than 3 times across the WHOLE bank, no two boards anywhere in
//     the bank sharing 2+ words, no board holding two words sharing a 4-letter
//     stem, no equation repeated;
//   * difficulty is MEASURED with a column-wise solver (right-to-left, the way a
//     person works one, counting search nodes) and ramps inside each week:
//     Monday the easiest two-addend board of the week, Wednesday the hardest;
//     Thursday the easiest three-addend board, Saturday the hardest. Each day
//     draws a pool of valid candidates and takes the one nearest its weekday's
//     node target (Mon ~450 ... Sun ~36k, the header's ladder), so the week climbs.
import { scanUS } from './us-spellings.mjs';
import { PUZZLES } from '../app/cipher/puzzles.js';

const arg = (k, d) => { const i = process.argv.indexOf(k); return i > 0 ? process.argv[i + 1] : d; };
const FROM = arg('--from', '2026-11-01');
const DAYS = +arg('--days', 30);
const STARTNUM = +arg('--startnum', 107);
const POOL = +arg('--pool', 40);

export const THEMES = {
  animals: 'ANT APE BAT BEE CAT COW DOG EEL ELK EMU FOX GNU HEN OWL PIG RAM RAT YAK BEAR BOAR BULL CALF CLAM CRAB CROW DEER DOVE DUCK FOAL FROG GOAT HARE HAWK LAMB LARK LION LYNX MOLE MOTH MULE NEWT PUMA SEAL SWAN TOAD WASP WOLF WORM WREN BISON CAMEL CRANE EAGLE GECKO GOOSE HERON HORSE HYENA KOALA LEMUR LLAMA MOOSE MOUSE OTTER PANDA RAVEN ROBIN SHARK SHEEP SKUNK SNAIL SNAKE STORK SWIFT TIGER TROUT WHALE ZEBRA BADGER BEAVER DONKEY FALCON FERRET GOPHER JAGUAR MARTEN MONKEY PARROT PIGEON RABBIT SALMON TURKEY TURTLE WALRUS WEASEL',
  weather: 'DEW FOG ICE SUN WET COLD DAMP GALE GUST HAIL HAZE HEAT MIST RAIN SNOW WARM WIND CLOUD FLOOD FROST HUMID SLEET SQUALL STORM SUNNY SLUSH WINDY CHILL MISTY FOGGY RAINY SHOWER BREEZE THUNDER DRIZZLE MONSOON TORNADO CLOUDY SUMMER WINTER AUTUMN SPRING',
  land: 'BOG BAY DUNE GLEN HILL ISLE LAKE MESA MOOR PEAK POND REEF ROCK SAND VALE CAVE CLIFF COAST CREEK DELTA GORGE GROVE HEATH ISLAND MARSH OASIS PLAIN RIDGE RIVER SHOAL SHORE SLOPE STONE SWAMP BEACH FIELD CANYON DESERT FOREST JUNGLE LAGOON MEADOW PLATEAU SUMMIT TUNDRA VALLEY STREAM',
  plants: 'BUD ELM FIG IVY OAK YEW FERN LEAF LILY MINT MOSS PALM PINE REED ROSE ROOT SEED SAGE VINE ASTER BLOOM BRIAR CEDAR DAISY HAZEL LILAC MAPLE PETAL THORN TULIP BIRCH CLOVER DAHLIA FLOWER LAUREL ORCHID POPPY SPRUCE THYME VIOLET WILLOW ACORN BRANCH CACTUS FUNGUS GARDEN',
  food: 'BUN EGG HAM JAM OAT PIE RICE STEW SOUP CORN BEAN BEEF CAKE FISH KALE LIME MEAT MILK NUTS PEAR PLUM SALT TACO TART BACON BAGEL BREAD CANDY CREAM CURRY DONUT FEAST GRAVY HONEY LEMON MANGO MELON OLIVE ONION PASTA PEACH PIZZA SALAD STEAK SUGAR TOAST WHEAT BUTTER CARROT CEREAL CHEESE COOKIE GARLIC MUFFIN NOODLE PEPPER RAISIN SALMON TOMATO WAFFLE YOGURT',
  house: 'BED MAT RUG TUB DOOR DESK HALL LAMP OVEN ROOF ROOM SINK SOFA STEP WALL YARD ATTIC BENCH CHAIR CLOCK COUCH FENCE FLOOR GLASS HINGE LATCH PORCH SHELF STAIR STOOL TABLE TOWEL CARPET CELLAR CLOSET CURTAIN GARAGE HEARTH KETTLE MANTEL MIRROR PANTRY PILLOW WINDOW',
  town: 'BANK CAFE DOCK FARM INN MALL PARK PIER PORT ROAD SHOP LANE ARENA ALLEY BARN CHURCH DINER HOTEL KIOSK MOTEL PLAZA SQUARE STORE TOWER WHARF BRIDGE CASTLE CINEMA LIBRARY MARKET MUSEUM OFFICE PALACE SCHOOL STREET TAVERN TEMPLE THEATER CORNER HARBOR',
  time: 'AGE DAY DAWN DUSK EVE HOUR NOON TIME WEEK YEAR DATE NIGHT MONTH EPOCH CLOCK TODAY LATER SECOND MINUTE MOMENT SEASON DECADE FUTURE PERIOD SUNSET SUNRISE MORNING EVENING CENTURY FORTNIGHT',
  space: 'SUN ORB STAR MARS MOON VOID COMET LUNAR ORBIT SOLAR SPACE VENUS EARTH PLUTO NOVA ROCKET PLANET COSMOS GALAXY METEOR NEBULA QUASAR SATURN URANUS JUPITER ECLIPSE ASTEROID CRATER PULSAR',
  craft: 'AWL KILN LOOM NAIL SAW TOOL WOOD WIRE YARN GLUE CLAY DYE INK KNOT BEAD LACE WAX BRUSH CHALK FORGE LATHE PAINT PLANE QUILT RULER SCREW SHEAR SPOOL STAIN TWINE ANVIL CHISEL HAMMER MALLET NEEDLE POTTER THREAD RIBBON SEWING PENCIL CANVAS SANDER',
};

// ── the exact-count solver (same algorithm as verify-cipher) ──────────────────
export function countSolutions(words, cap = 2) {
  const letters = [...new Set(words.join(''))];
  if (letters.length > 10) return -1;
  const signs = [...words.slice(0, -1).map(() => 1), -1];
  const coef = Object.fromEntries(letters.map((c) => [c, 0]));
  words.forEach((w, k) => { let m = 1; for (let i = w.length - 1; i >= 0; i--) { coef[w[i]] += signs[k] * m; m *= 10; } });
  const firsts = new Set(words.map((w) => w[0]));
  const order = letters.slice().sort((a, b) => Math.abs(coef[b]) - Math.abs(coef[a]));
  const cs = order.map((c) => coef[c]), fs = order.map((c) => firsts.has(c)), n = order.length;
  const used = new Array(10).fill(false); let count = 0;
  const bounds = (i) => {
    const pos = [], neg = []; for (let k = i; k < n; k++) (cs[k] >= 0 ? pos : neg).push(cs[k]);
    pos.sort((a, b) => b - a); neg.sort((a, b) => a - b);
    const avail = []; for (let d = 0; d < 10; d++) if (!used[d]) avail.push(d);
    const desc = avail.slice().sort((a, b) => b - a); let mx = 0, mn = 0;
    for (let k = 0; k < pos.length; k++) { mx += pos[k] * (desc[k] ?? 0); mn += pos[k] * (avail[k] ?? 0); }
    for (let k = 0; k < neg.length; k++) { mx += neg[k] * (avail[k] ?? 0); mn += neg[k] * (desc[k] ?? 0); }
    return [mn, mx];
  };
  const dfs = (i, acc) => {
    if (count >= cap) return; if (i === n) { if (acc === 0) count++; return; }
    const [mn, mx] = bounds(i); if (acc + mn > 0 || acc + mx < 0) return;
    for (let d = 0; d < 10; d++) { if (used[d] || (d === 0 && fs[i])) continue; used[d] = true; dfs(i + 1, acc + cs[i] * d); used[d] = false; if (count >= cap) return; }
  };
  dfs(0, 0); return count;
}

// ── difficulty: a column-wise solver, right to left with carries ──────────────
// Letters are assigned as their column is reached; each column checks its sum
// digit against the result letter. Nodes = every digit assignment tried. This
// is how a person works a cryptarithm, so it measures the search a person faces.
export function columnNodes(lhs, rhs) {
  const W = rhs.length, firsts = new Set([...lhs, rhs].map((w) => w[0]));
  const col = (w, c) => (c < w.length ? w[w.length - 1 - c] : null);
  const asg = new Map(), used = new Array(10).fill(false); let nodes = 0;
  const tryLetters = (letters, k, then) => {
    if (k === letters.length) return then();
    const L = letters[k];
    if (asg.has(L)) return tryLetters(letters, k + 1, then);
    for (let d = 0; d < 10; d++) {
      if (used[d] || (d === 0 && firsts.has(L))) continue;
      nodes++; asg.set(L, d); used[d] = true;
      tryLetters(letters, k + 1, then);
      asg.delete(L); used[d] = false;
    }
  };
  const solveCol = (c, carry) => {
    if (c === W) { if (carry === 0) {} return; }
    const adds = lhs.map((w) => col(w, c)).filter(Boolean);
    tryLetters([...new Set(adds)], 0, () => {
      const s = adds.reduce((a, L) => a + asg.get(L), carry);
      const digit = s % 10, nc = Math.floor(s / 10), R = col(rhs, c);
      if (asg.has(R)) { if (asg.get(R) === digit) solveCol(c + 1, nc); return; }
      if (used[digit] || (digit === 0 && firsts.has(R))) return;
      nodes++; asg.set(R, digit); used[digit] = true;
      solveCol(c + 1, nc);
      asg.delete(R); used[digit] = false;
    });
  };
  solveCol(0, 0);
  return nodes;
}

function rng(seed) { let s = (seed * 2654435761) >>> 0 || 1; return () => { s ^= s << 13; s >>>= 0; s ^= s >>> 17; s ^= s << 5; s >>>= 0; return s / 4294967296; }; }
// two words sharing a four-letter stem, or one word sitting inside another
// (DAY in TODAY, EVE in EVENING) read as the same word twice on one board.
const stemClash = (ws) => { for (let i = 0; i < ws.length; i++) for (let j = i + 1; j < ws.length; j++) { if (ws[i].slice(0, 4) === ws[j].slice(0, 4) && Math.min(ws[i].length, ws[j].length) >= 4) return true; if (ws[i].includes(ws[j]) || ws[j].includes(ws[i])) return true; } return false; };

const isMain = import.meta.url === `file://${process.argv[1]}`;
if (isMain) {
  for (const [t, s] of Object.entries(THEMES)) for (const w of s.split(' ')) if (scanUS(w.toLowerCase()).length) throw new Error(`British form ${w} in ${t}`);
  const WORD = Object.fromEntries(Object.entries(THEMES).map(([t, s]) => [t, [...new Set(s.split(' '))]]));
  const themeOfWord = new Map(); for (const [t, ws] of Object.entries(WORD)) for (const w of ws) if (!themeOfWord.has(w)) themeOfWord.set(w, t);

  // bank state
  const useCount = new Map(); const boardSets = []; const seenEq = new Set();
  for (const p of PUZZLES) { const ws = [...p.lhs, p.rhs]; for (const w of ws) useCount.set(w, (useCount.get(w) || 0) + 1); boardSets.push(new Set(ws)); seenEq.add([...p.lhs].sort().join('+') + '=' + p.rhs); }
  // theme of the last frozen board, so the join does not repeat a theme
  const last = PUZZLES.at(-1); const lastVotes = {}; for (const w of [...last.lhs, last.rhs]) { const t = themeOfWord.get(w); if (t) lastVotes[t] = (lastVotes[t] || 0) + 1; }
  let prevTheme = Object.entries(lastVotes).sort((a, b) => b[1] - a[1])[0]?.[0] || null;

  const themeSlots = {}; const out = []; let prevNodes = 0;
  const addDays = (d, n) => { const t = new Date(d + 'T12:00:00Z'); t.setUTCDate(t.getUTCDate() + n); return t.toISOString().slice(0, 10); };
  const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  const ADD = [4, 2, 2, 2, 3, 3, 3];
  // Node targets per weekday, the ladder in the puzzles.js header (Sun..Sat).
  // columnNodes reproduces the header's measure: the live October boards land
  // Mon ~340-1160, Tue ~1.4-1.9k, Wed ~2.8-4.4k, Thu ~4.3-6.8k, Fri ~11-14k,
  // Sat ~20-25k, Sun ~29-43k. Each day takes the pool candidate nearest its
  // target (in log terms), with a little jitter so a weekday never repeats.
  const TARGET = [36000, 450, 1800, 4500, 6000, 13000, 25000];

  const candidate = (theme, k, r) => {
    const ws = WORD[theme].filter((w) => (useCount.get(w) || 0) < 3);
    for (let t = 0; t < 4000; t++) {
      const lhs = []; while (lhs.length < k) { const w = ws[Math.floor(r() * ws.length)]; if (!lhs.includes(w)) lhs.push(w); }
      const maxL = Math.max(...lhs.map((w) => w.length));
      const rs = ws.filter((w) => !lhs.includes(w) && (w.length === maxL || w.length === maxL + 1));
      if (!rs.length) continue;
      const rhs = rs[Math.floor(r() * rs.length)];
      const all = [...lhs, rhs];
      if (new Set(all.join('')).size > 10) continue;
      if (stemClash(all)) continue;
      const key = [...lhs].sort().join('+') + '=' + rhs; if (seenEq.has(key)) continue;
      const S = new Set(all); if (boardSets.some((b) => { let n = 0; for (const w of S) if (b.has(w)) n++; return n >= 2; })) continue;
      if (countSolutions(all) !== 1) continue;
      return { lhs, rhs, nodes: columnNodes(lhs, rhs) };
    }
    return null;
  };

  for (let d = 0; d < DAYS; d++) {
    const live = addDays(FROM, d), num = STARTNUM + d, dow = new Date(live + 'T12:00:00Z').getUTCDay();
    const r = rng(num * 9973 + 11); const k = ADD[dow];
    // theme: least-used so far this batch, never the previous day's, random tie-break
    const themes = Object.keys(WORD).filter((t) => t !== prevTheme && (themeSlots[t] || 0) < 7);
    themes.sort((a, b) => (themeSlots[a] || 0) - (themeSlots[b] || 0) || r() - 0.5);
    // Mondays need a deep pool: the easy tail of the two-addend distribution is thin.
    const want = dow === 1 ? POOL * 4 : POOL;
    // Inside a week (Tue..Sat, and Sunday over Saturday) every day must measure
    // harder than the day before.
    const floor = (dow >= 2 || dow === 0) ? prevNodes * 1.05 : 0;
    // Mondays look across the first three eligible themes, since the easy tail
    // is thin in some themes; every other day takes the first theme that fills.
    const tgt = TARGET[dow] * (0.85 + 0.3 * r());
    const dist = (c) => Math.abs(Math.log(c.nodes / tgt));
    let best = null, tried = 0;
    for (const t of themes) {
      const pool = []; for (let i = 0; i < want * 3 && pool.length < want; i++) { const c = candidate(t, k, r); if (c && c.nodes > floor) pool.push({ ...c, theme: t }); }
      if (pool.length < Math.min(want, 8)) continue;
      pool.sort((a, b) => dist(a) - dist(b));
      if (!best || dist(pool[0]) < dist(best)) best = pool[0];
      if (++tried >= (dow === 1 ? 3 : 1)) break;
    }
    if (!best) throw new Error(`no pool for ${live}`);
    const pick = best, theme = best.theme;
    prevNodes = pick.nodes; prevTheme = theme; themeSlots[theme] = (themeSlots[theme] || 0) + 1;
    const all = [...pick.lhs, pick.rhs]; for (const w of all) useCount.set(w, (useCount.get(w) || 0) + 1);
    boardSets.push(new Set(all)); seenEq.add([...pick.lhs].sort().join('+') + '=' + pick.rhs);
    const [y, m, dd] = live.split('-').map(Number);
    process.stderr.write(`${live} ${['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][dow]} ${theme} ${pick.lhs.join('+')}=${pick.rhs} nodes ${pick.nodes}\n`);
    out.push(`  { num: ${num}, quizId: "cipher-${m}-${dd}-${String(y).slice(2)}", live: "${live}", dateLabel: "${MONTHS[m - 1]} ${dd}, ${y}", sunday: ${dow === 0}, op: "add", lhs: ${JSON.stringify(pick.lhs).replace(/,/g, ',')}, rhs: "${pick.rhs}" },`);
  }
  process.stdout.write(out.join('\n') + '\n');
}
