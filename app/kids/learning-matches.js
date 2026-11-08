// The learning match sets for Kids Corner (launched 2026-11-07). Each set is
// a list of { a, b, name } pairs for the shared MatchGame engine: the two
// cards of a pair show DIFFERENT faces (a shape and its name, a clock and its
// time, a mama and her baby). Every face is an inline SVG string so it scales
// with the card. The hub (KidsHubClient.jsx) reads `preview` from here so a
// tile always shows real cards from its own game.
//
// Rule for every set: each card has exactly ONE match on the board. A rhyme,
// opposite, home or answer that could pair with two cards does not go in.

const FONT = "'Manrope', system-ui, sans-serif";
const INK = '#0b0c0e';
const BLUE = '#1e3a8a';
const MUTED = '#6b7280';

// A text card that fits its words to the square. Long two-word labels break
// onto two lines; a small caption (Mama, Baby) can sit underneath.
export function textFace(t, { color = INK, max = 30, caption } = {}) {
  const words = String(t).split(' ');
  let lines = [t];
  if (t.length > 9 && words.length > 1) {
    let best = null;
    for (let i = 1; i < words.length; i++) {
      const l1 = words.slice(0, i).join(' ');
      const l2 = words.slice(i).join(' ');
      const w = Math.max(l1.length, l2.length);
      if (!best || w < best.w) best = { w, l: [l1, l2] };
    }
    lines = best.l;
  }
  const longest = Math.max(...lines.map((l) => l.length));
  // Long single words keep a readable size and are squeezed to the card
  // width (textLength) rather than shrunk until they are tiny.
  const natural = Math.min(max, Math.floor(86 / (0.62 * longest)));
  const size = longest >= 9 ? Math.max(16, natural) : natural;
  const fit = (l) => (l.length >= 9 && 0.62 * size * l.length > 86 ? ' textLength="86" lengthAdjust="spacingAndGlyphs"' : '');
  const lh = size * 1.1;
  const top = 50 - (caption ? 7 : 0) - ((lines.length - 1) * lh) / 2;
  const body = lines
    .map((l, i) => `<text x="50" y="${(top + i * lh).toFixed(1)}" font-size="${size}" font-family="${FONT}" font-weight="800" text-anchor="middle" dominant-baseline="central" fill="${color}"${fit(l)}>${l}</text>`)
    .join('');
  const cap = caption
    ? `<text x="50" y="${(top + (lines.length - 1) * lh + size * 0.55 + 12).toFixed(1)}" font-size="11" font-family="${FONT}" font-weight="700" letter-spacing="1" text-anchor="middle" dominant-baseline="central" fill="${MUTED}">${caption.toUpperCase()}</text>`
    : '';
  return `<svg viewBox="0 0 100 100">${body}${cap}</svg>`;
}

const svg = (inner) => `<svg viewBox="0 0 100 100">${inner}</svg>`;
const pts = (arr) => arr.map(([x, y]) => `${x.toFixed(1)},${y.toFixed(1)}`).join(' ');
function regular(n, r, cx = 50, cy = 50, rot = -90) {
  const out = [];
  for (let i = 0; i < n; i++) {
    const a = ((rot + (360 / n) * i) * Math.PI) / 180;
    out.push([cx + r * Math.cos(a), cy + r * Math.sin(a)]);
  }
  return out;
}
function starPts(r, cx = 50, cy = 50, inner = 0.42) {
  const out = [];
  for (let i = 0; i < 10; i++) {
    const a = ((-90 + 36 * i) * Math.PI) / 180;
    const rr = i % 2 ? r * inner : r;
    out.push([cx + rr * Math.cos(a), cy + rr * Math.sin(a)]);
  }
  return out;
}

// ---------------------------------------------------------------- Shapes
const SHAPES = [
  ['Circle', '<circle cx="50" cy="50" r="31" fill="#e23b3b"/>'],
  ['Square', '<rect x="21" y="21" width="58" height="58" rx="3" fill="#2f7be0"/>'],
  ['Triangle', '<polygon points="50,17 84,79 16,79" fill="#34a23a"/>'],
  ['Rectangle', '<rect x="12" y="31" width="76" height="38" rx="3" fill="#ef8a2b"/>'],
  ['Oval', '<ellipse cx="50" cy="50" rx="36" ry="22" fill="#8a4fd0"/>'],
  ['Star', `<polygon points="${pts(starPts(36, 50, 52))}" fill="#f4c81e"/>`],
  ['Heart', '<path d="M50 82 C22 63 12 46 21 32 C30 19 45 22 50 35 C55 22 70 19 79 32 C88 46 78 63 50 82 Z" fill="#ee6fae"/>'],
  ['Diamond', '<polygon points="50,13 79,50 50,87 21,50" fill="#14a3a3"/>'],
  ['Pentagon', `<polygon points="${pts(regular(5, 34, 50, 53))}" fill="#c0392b"/>`],
  ['Hexagon', `<polygon points="${pts(regular(6, 34, 50, 50, 0))}" fill="#1f5aa8"/>`],
  ['Octagon', `<polygon points="${pts(regular(8, 34, 50, 50, 22.5))}" fill="#7a4a22"/>`],
  ['Crescent', '<path d="M62 18 A32 32 0 1 0 62 82 A40 40 0 0 1 62 18 Z" fill="#e0a800"/>'],
];

// --------------------------------------------------------- Mama and baby
const MAMA_BABY = [
  ['Cow', 'Calf'], ['Dog', 'Puppy'], ['Cat', 'Kitten'], ['Sheep', 'Lamb'],
  ['Horse', 'Foal'], ['Duck', 'Duckling'], ['Frog', 'Tadpole'], ['Hen', 'Chick'],
  ['Pig', 'Piglet'], ['Goat', 'Kid'], ['Bear', 'Cub'], ['Kangaroo', 'Joey'],
];

// ---------------------------------------------------------- Animal sounds
const SOUNDS = [
  ['Cow', 'Moo!'], ['Dog', 'Woof!'], ['Cat', 'Meow!'], ['Duck', 'Quack!'],
  ['Sheep', 'Baa!'], ['Pig', 'Oink!'], ['Lion', 'Roar!'], ['Owl', 'Hoot!'],
  ['Snake', 'Hiss!'], ['Bee', 'Buzz!'], ['Horse', 'Neigh!'], ['Frog', 'Ribbit!'],
];

// --------------------------------------------------------------- Counting
const DOT_COLORS = ['#e23b3b', '#ef8a2b', '#34a23a', '#2f7be0', '#8a4fd0', '#ee6fae'];
function dots(n) {
  const cols = n <= 3 ? n : n === 4 ? 2 : n <= 9 ? 3 : 4;
  const rows = Math.ceil(n / cols);
  const step = Math.min(70 / cols, 70 / rows);
  const r = Math.min(10, step * 0.36);
  const fill = DOT_COLORS[(n - 1) % DOT_COLORS.length];
  let out = '';
  let k = 0;
  for (let row = 0; row < rows; row++) {
    const inRow = Math.min(cols, n - k);
    const y = 50 + (row - (rows - 1) / 2) * step;
    for (let c = 0; c < inRow; c++) {
      const x = 50 + (c - (inRow - 1) / 2) * step;
      out += `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${r.toFixed(1)}" fill="${fill}"/>`;
      k++;
    }
  }
  return svg(out);
}

// ------------------------------------------------------------ Subtraction
const SUBTRACT = [
  ['1 - 1', 0], ['3 - 2', 1], ['5 - 3', 2], ['7 - 4', 3], ['6 - 2', 4],
  ['9 - 4', 5], ['8 - 2', 6], ['10 - 3', 7], ['12 - 4', 8], ['11 - 2', 9],
  ['15 - 5', 10], ['14 - 3', 11], ['16 - 4', 12], ['18 - 5', 13],
];

// ------------------------------------------------------------ Times table
const TIMES = [
  ['2 × 1', 2], ['2 × 2', 4], ['2 × 3', 6], ['2 × 4', 8], ['3 × 3', 9],
  ['2 × 5', 10], ['3 × 4', 12], ['2 × 7', 14], ['3 × 5', 15], ['4 × 4', 16],
  ['3 × 6', 18], ['4 × 5', 20], ['3 × 7', 21], ['5 × 5', 25],
];

const eqFace = (t) => svg(`<text x="50" y="51" font-size="24" font-family="${FONT}" font-weight="700" text-anchor="middle" dominant-baseline="central" fill="${INK}">${t}</text>`);
const ansFace = (t) => svg(`<text x="50" y="51" font-size="46" font-family="${FONT}" font-weight="800" text-anchor="middle" dominant-baseline="central" fill="${BLUE}">${t}</text>`);

// -------------------------------------------------------------- Opposites
const OPPOSITES = [
  ['Hot', 'Cold'], ['Big', 'Small'], ['Up', 'Down'], ['Happy', 'Sad'],
  ['Day', 'Night'], ['Fast', 'Slow'], ['Open', 'Closed'], ['Wet', 'Dry'],
  ['Full', 'Empty'], ['Loud', 'Quiet'], ['In', 'Out'], ['Tall', 'Short'],
];

// ----------------------------------------------------------------- Rhymes
const RHYMES = [
  ['Cat', 'Hat'], ['Moon', 'Spoon'], ['Frog', 'Log'], ['Bee', 'Tree'],
  ['Cake', 'Snake'], ['Bear', 'Chair'], ['Star', 'Car'], ['Fish', 'Dish'],
  ['Goat', 'Boat'], ['Mouse', 'House'], ['Bug', 'Rug'], ['Sock', 'Clock'],
];

// ----------------------------------------------------------------- Clocks
function clockFace(h, m) {
  let ticks = '';
  for (let i = 0; i < 12; i++) {
    const a = (i * 30 * Math.PI) / 180;
    const r1 = i % 3 === 0 ? 29 : 32;
    ticks += `<line x1="${(50 + r1 * Math.sin(a)).toFixed(1)}" y1="${(50 - r1 * Math.cos(a)).toFixed(1)}" x2="${(50 + 36 * Math.sin(a)).toFixed(1)}" y2="${(50 - 36 * Math.cos(a)).toFixed(1)}" stroke="${INK}" stroke-width="${i % 3 === 0 ? 3 : 1.6}" stroke-linecap="round"/>`;
  }
  const ha = (((h % 12) * 30 + m * 0.5) * Math.PI) / 180;
  const ma = (m * 6 * Math.PI) / 180;
  const hand = (a, len, w, col) => `<line x1="50" y1="50" x2="${(50 + len * Math.sin(a)).toFixed(1)}" y2="${(50 - len * Math.cos(a)).toFixed(1)}" stroke="${col}" stroke-width="${w}" stroke-linecap="round"/>`;
  return svg(`<circle cx="50" cy="50" r="41" fill="#ffffff" stroke="${INK}" stroke-width="3"/>${ticks}${hand(ma, 30, 3, '#2f7be0')}${hand(ha, 19, 5, INK)}<circle cx="50" cy="50" r="3.5" fill="${INK}"/>`);
}
const CLOCKS = [[1, 0], [2, 30], [3, 0], [4, 30], [5, 0], [6, 30], [7, 0], [8, 30], [9, 0], [10, 30], [11, 0], [12, 30]];
const timeLabel = (h, m) => `${h}:${m === 0 ? '00' : String(m)}`;

// ------------------------------------------------------------------ Flags
// Every flag sits in the same 80 x 54 box (x 10..90, y 23..77), except the
// square Swiss flag. A thin outline keeps the white flags visible on a card.
const FX = 10, FY = 23, FW = 80, FH = 54;
const frame = `<rect x="${FX}" y="${FY}" width="${FW}" height="${FH}" fill="none" stroke="rgba(20,22,28,0.25)" stroke-width="1"/>`;
const vtri = (c1, c2, c3) => `<rect x="${FX}" y="${FY}" width="${FW / 3}" height="${FH}" fill="${c1}"/><rect x="${FX + FW / 3}" y="${FY}" width="${FW / 3}" height="${FH}" fill="${c2}"/><rect x="${FX + (2 * FW) / 3}" y="${FY}" width="${FW / 3}" height="${FH}" fill="${c3}"/>`;
const htri = (c1, c2, c3) => `<rect x="${FX}" y="${FY}" width="${FW}" height="${FH / 3}" fill="${c1}"/><rect x="${FX}" y="${FY + FH / 3}" width="${FW}" height="${FH / 3}" fill="${c2}"/><rect x="${FX}" y="${FY + (2 * FH) / 3}" width="${FW}" height="${FH / 3}" fill="${c3}"/>`;
function usaFlag() {
  const sh = FH / 13;
  let s = `<rect x="${FX}" y="${FY}" width="${FW}" height="${FH}" fill="#ffffff"/>`;
  for (let i = 0; i < 13; i += 2) s += `<rect x="${FX}" y="${(FY + i * sh).toFixed(2)}" width="${FW}" height="${sh.toFixed(2)}" fill="#b22234"/>`;
  const cw = FW * 0.4, ch = sh * 7;
  s += `<rect x="${FX}" y="${FY}" width="${cw}" height="${ch.toFixed(2)}" fill="#3c3b6e"/>`;
  for (let r = 0; r < 4; r++) for (let c = 0; c < 5; c++) s += `<circle cx="${(FX + 3.6 + c * 6.2).toFixed(1)}" cy="${(FY + 3.6 + r * 6.6).toFixed(1)}" r="1.2" fill="#ffffff"/>`;
  return s;
}
function ukFlag() {
  const x2 = FX + FW, y2 = FY + FH, cx = FX + FW / 2, cy = FY + FH / 2;
  return `<defs><clipPath id="kmUk"><rect x="${FX}" y="${FY}" width="${FW}" height="${FH}"/></clipPath></defs><g clip-path="url(#kmUk)"><rect x="${FX}" y="${FY}" width="${FW}" height="${FH}" fill="#012169"/><path d="M${FX} ${FY}L${x2} ${y2}M${x2} ${FY}L${FX} ${y2}" stroke="#ffffff" stroke-width="10"/><path d="M${FX} ${FY}L${x2} ${y2}M${x2} ${FY}L${FX} ${y2}" stroke="#c8102e" stroke-width="3.5"/><path d="M${cx} ${FY}V${y2}M${FX} ${cy}H${x2}" stroke="#ffffff" stroke-width="15"/><path d="M${cx} ${FY}V${y2}M${FX} ${cy}H${x2}" stroke="#c8102e" stroke-width="9"/></g>`;
}
const LEAF = 'M50 33 L53.5 39.5 L57.5 37.5 L56.5 47 L61.5 42.5 L63.5 46 L68 45 L65.5 51.5 L68.5 53.5 L60 59.5 L61.5 62.5 L51.2 60.5 L51.2 68 L48.8 68 L48.8 60.5 L38.5 62.5 L40 59.5 L31.5 53.5 L34.5 51.5 L32 45 L36.5 46 L38.5 42.5 L43.5 47 L42.5 37.5 L46.5 39.5 Z';
const FLAGS = [
  ['Japan', `<rect x="${FX}" y="${FY}" width="${FW}" height="${FH}" fill="#ffffff"/><circle cx="50" cy="50" r="15" fill="#bc002d"/>${frame}`],
  ['France', vtri('#0055a4', '#ffffff', '#ef4135') + frame],
  ['Italy', vtri('#009246', '#ffffff', '#ce2b37') + frame],
  ['Germany', htri('#000000', '#dd0000', '#ffce00')],
  ['United States', usaFlag()],
  ['United Kingdom', ukFlag()],
  ['Canada', `<rect x="${FX}" y="${FY}" width="${FW}" height="${FH}" fill="#ffffff"/><rect x="${FX}" y="${FY}" width="${FW / 4}" height="${FH}" fill="#d52b1e"/><rect x="${FX + (3 * FW) / 4}" y="${FY}" width="${FW / 4}" height="${FH}" fill="#d52b1e"/><path d="${LEAF}" fill="#d52b1e"/>${frame}`],
  ['Brazil', `<rect x="${FX}" y="${FY}" width="${FW}" height="${FH}" fill="#009c3b"/><polygon points="17,50 50,28 83,50 50,72" fill="#ffdf00"/><circle cx="50" cy="50" r="12" fill="#002776"/>`],
  ['Sweden', `<rect x="${FX}" y="${FY}" width="${FW}" height="${FH}" fill="#006aa7"/><rect x="${FX + 24}" y="${FY}" width="10" height="${FH}" fill="#fecc02"/><rect x="${FX}" y="45" width="${FW}" height="10" fill="#fecc02"/>`],
  ['Switzerland', '<rect x="22" y="22" width="56" height="56" fill="#da291c"/><rect x="45" y="32" width="10" height="36" fill="#ffffff"/><rect x="32" y="45" width="36" height="10" fill="#ffffff"/>'],
  ['India', htri('#ff9933', '#ffffff', '#138808') + `<circle cx="50" cy="50" r="6.5" fill="none" stroke="#000080" stroke-width="1.6"/><circle cx="50" cy="50" r="1.4" fill="#000080"/>${frame}`],
  ['China', `<rect x="${FX}" y="${FY}" width="${FW}" height="${FH}" fill="#de2910"/><polygon points="${pts(starPts(8, 24, 36))}" fill="#ffde00"/>${[[35, 28], [39, 33], [39, 40], [35, 45]].map(([x, y]) => `<polygon points="${pts(starPts(2.8, x, y))}" fill="#ffde00"/>`).join('')}`],
];

// ------------------------------------------------------- Who lives where
const HOMES = [
  ['Bird', 'Nest'], ['Bee', 'Hive'], ['Dog', 'Doghouse'], ['Spider', 'Web'],
  ['Rabbit', 'Burrow'], ['Bear', 'Den'], ['Horse', 'Stable'], ['Cow', 'Barn'],
  ['Ant', 'Anthill'], ['Fish', 'Pond'], ['Pig', 'Pen'], ['Chicken', 'Coop'],
];

// ------------------------------------------------------------------- Jobs
const JOBS = [
  ['Doctor', 'Stethoscope'], ['Chef', 'Frying pan'], ['Firefighter', 'Fire hose'],
  ['Teacher', 'Chalkboard'], ['Painter', 'Paintbrush'], ['Farmer', 'Tractor'],
  ['Pilot', 'Airplane'], ['Mail carrier', 'Mailbag'], ['Dentist', 'Toothbrush'],
  ['Builder', 'Hammer'], ['Hairdresser', 'Scissors'], ['Astronaut', 'Rocket'],
];

const wordPairs = (list, capA, capB) => list.map(([x, y]) => ({
  a: textFace(x, { caption: capA }),
  b: textFace(y, { color: BLUE, caption: capB }),
  name: `${x} and ${y}`,
}));

// id -> everything the page, the hub tile and lib/kids.js need. `cols` caps
// the board's columns (same meaning as in MatchGame).
export const LEARNING_MATCHES = {
  'shape-match': {
    title: 'Shape Match',
    pairs: SHAPES.map(([n, s]) => ({ a: svg(s), b: textFace(n, { color: BLUE, max: 22 }), name: n })),
    cols: 6,
    count: 'twelve',
    intro: 'Match each shape to its name, like the circle with Circle. Find all twelve pairs. Play on your own, or with up to four players.',
    desc: 'Match each shape to its name. Twelve pairs.',
    seo: 'Match each shape to its name: circle, square, triangle, star, hexagon and more.',
    band: '#fdeede',
  },
  'counting-match': {
    title: 'Counting Match',
    pairs: Array.from({ length: 12 }, (_, i) => ({ a: dots(i + 1), b: ansFace(String(i + 1)), name: `${i + 1}` })),
    cols: 6,
    count: 'twelve',
    intro: 'Count the dots and match them to the number, like five dots with 5. Find all twelve pairs, 1 to 12. Up to four players.',
    desc: 'Count the dots and match the number, 1 to 12. Twelve pairs.',
    seo: 'Count the dots on each card and match it to the right number, from 1 to 12.',
    band: '#eaf6ef',
  },
  'subtraction-match': {
    title: 'Subtraction Match',
    pairs: SUBTRACT.map(([q, n]) => ({ a: eqFace(q), b: ansFace(String(n)), name: `${q} = ${n}` })),
    cols: 7,
    count: 'fourteen',
    intro: 'Match each take-away to its answer, like 6 - 2 with 4. Find all fourteen pairs. Play on your own, or with up to four players.',
    desc: 'Match each subtraction to its answer. Fourteen pairs.',
    seo: 'Match each subtraction problem to its answer, from 0 to 13.',
    band: '#fdeaea',
  },
  'times-table-match': {
    title: 'Times Table Match',
    pairs: TIMES.map(([q, n]) => ({ a: eqFace(q), b: ansFace(String(n)), name: `${q.replace('×', 'times')} = ${n}` })),
    cols: 7,
    count: 'fourteen',
    intro: 'Match each times fact to its answer, like 3 × 4 with 12. Find all fourteen pairs. Play on your own, or with up to four players.',
    desc: 'Match each times table fact to its answer. Fourteen pairs.',
    seo: 'Practice the times tables: match each multiplication fact to its answer.',
    band: '#f1ecfb',
  },
  'clock-match': {
    title: 'Clock Match',
    pairs: CLOCKS.map(([h, m]) => ({ a: clockFace(h, m), b: textFace(timeLabel(h, m), { color: BLUE, max: 28 }), name: timeLabel(h, m) })),
    cols: 6,
    count: 'twelve',
    intro: 'Read each clock and match it to its time, like the clock at three with 3:00. Whole and half hours. Find all twelve pairs. Up to four players.',
    desc: 'Match each clock to its time, on the hour and half hour. Twelve pairs.',
    seo: 'Learn to tell time: match each clock face to its time, on the hour and half hour.',
    band: '#eef3fe',
  },
  'mama-baby-match': {
    title: 'Mama and Baby Match',
    pairs: wordPairs(MAMA_BABY, 'Mama', 'Baby'),
    cols: 6,
    count: 'twelve',
    intro: 'Match each mama animal to her baby, like Cow with Calf and Kangaroo with Joey. Find all twelve pairs. Up to four players.',
    desc: 'Match each mama animal to her baby. Twelve pairs.',
    seo: 'Match each animal to the name of its baby: calf, puppy, kitten, joey and more.',
    band: '#fde7f0',
  },
  'animal-sound-match': {
    title: 'Animal Sound Match',
    pairs: wordPairs(SOUNDS),
    cols: 6,
    count: 'twelve',
    intro: 'Match each animal to the sound it makes, like Cow with Moo! Find all twelve pairs. Play on your own, or with up to four players.',
    desc: 'Match each animal to its sound. Twelve pairs.',
    seo: 'Match each animal to the sound it makes: moo, woof, quack, roar and more.',
    band: '#eaf6ef',
  },
  'opposites-match': {
    title: 'Opposites Match',
    pairs: wordPairs(OPPOSITES),
    cols: 6,
    count: 'twelve',
    intro: 'Match each word to its opposite, like Hot with Cold. Find all twelve pairs. Play on your own, or with up to four players.',
    desc: 'Match each word to its opposite. Twelve pairs.',
    seo: 'Match each word to its opposite: hot and cold, big and small, day and night.',
    band: '#fdeede',
  },
  'rhyme-match': {
    title: 'Rhyme Match',
    pairs: wordPairs(RHYMES),
    cols: 6,
    count: 'twelve',
    intro: 'Match the words that rhyme, like Cat with Hat. Find all twelve pairs. Play on your own, or with up to four players.',
    desc: 'Match the words that rhyme. Twelve pairs.',
    seo: 'Match the rhyming words: cat and hat, moon and spoon, frog and log.',
    band: '#fdeaea',
  },
  'flag-match': {
    title: 'Flag Match',
    pairs: FLAGS.map(([n, s]) => ({ a: svg(s), b: textFace(n, { color: BLUE, max: 20 }), name: n })),
    cols: 6,
    count: 'twelve',
    intro: 'Match each flag to its country, like the red circle with Japan. Find all twelve pairs. Play on your own, or with up to four players.',
    desc: 'Match each flag to its country. Twelve pairs.',
    seo: 'Match each flag to its country: Japan, France, Brazil, Canada and more.',
    band: '#eef3fe',
  },
  'animal-home-match': {
    title: 'Animal Home Match',
    pairs: wordPairs(HOMES),
    cols: 6,
    count: 'twelve',
    intro: 'Match each animal to where it lives, like Bird with Nest and Bee with Hive. Find all twelve pairs. Up to four players.',
    desc: 'Match each animal to where it lives. Twelve pairs.',
    seo: 'Match each animal to its home: bird and nest, bee and hive, spider and web.',
    band: '#e7f6ef',
  },
  'job-match': {
    title: 'Job Match',
    pairs: wordPairs(JOBS),
    cols: 6,
    count: 'twelve',
    intro: 'Match each job to the thing that person uses, like Firefighter with Fire hose. Find all twelve pairs. Up to four players.',
    desc: 'Match each job to its tool. Twelve pairs.',
    seo: 'Match each job to its tool: firefighter and fire hose, doctor and stethoscope.',
    band: '#f1ecfb',
  },
};

export const LEARNING_MATCH_IDS = Object.keys(LEARNING_MATCHES);

// Three cards for a hub tile: a pair, then the first card of the next pair.
export function previewFor(id) {
  const p = LEARNING_MATCHES[id].pairs;
  return [p[0].a, p[0].b, p[1].a];
}
