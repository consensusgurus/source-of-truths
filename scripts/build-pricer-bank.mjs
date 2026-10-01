import fs from 'fs';
const AMZ = (id) => `https://m.media-amazon.com/images/I/${encodeURIComponent(id)}._AC_SL800_.jpg`;
const COM = (f) => `https://commons.wikimedia.org/wiki/Special:FilePath/${encodeURIComponent(f)}?width=900`;
const A = {
  A: ['Tabasco Original Red Pepper Sauce, 5 oz', 'Pantry', 392, 'B0014D2AFU', '81OY0nkhF+L'],
  B: ['Sharpie Fine Point Permanent Markers, Black, 12 Count', 'Office', 719, 'B00006IFHD', '816YnicG2KL'],
  C: ["Rubik's Cube, the Original 3x3", 'Toys', 949, 'B092W7D64G', '81HO-y+FIdL'],
  D: ['Play-Doh Jewel Colors, 12 Cans', 'Toys', 1349, 'B07BC44JFC', '81MBGJ5W+pL'],
  E: ['Monopoly, the Classic Board Game', 'Games', 2199, 'B0B5HLZ8T4', '816dE7TY9xL'],
  F: ["Burt's Bees Original Beeswax Lip Balm, 12 Tubes", 'Beauty', 2597, 'B0D325WRFD', '81r4nVdrnNL'],
  G: ['Hot Wheels 20-Pack of Die-Cast Cars', 'Toys', 2699, 'B01BMW645O', '81nJShD5KaL'],
  H: ['Cards Against Humanity', 'Games', 2900, 'B004S8F7QM', '61p0INj26yL'],
  I: ['Lodge 12-Inch Cast Iron Skillet', 'Kitchen', 3490, 'B00G2XGC88', '71uh7OjLpFL'],
  J: ['YETI Rambler 20 oz Tumbler', 'Kitchen', 3500, 'B0GP99ZYSH', '51VPOyn0o5L'],
  K: ['LEGO Botanicals Bonsai Tree', 'Toys', 3998, 'B08HVXZW8X', '71pVP0qS4wL'],
  L: ['Hydro Flask 32 oz Wide Mouth Water Bottle', 'Outdoors', 4495, 'B0G9B9TLTX', '61PGJ36vNKL'],
  M: ['Stanley Quencher H2.0 Tumbler, 40 oz', 'Kitchen', 5000, 'B0HF32Z195', '61X0pME7uiL'],
  N: ['Instant Pot Duo 7-in-1 Pressure Cooker, 6 Quart', 'Kitchen', 7900, 'B00FLYWNYQ', '71MLaYtMFOL'],
  O: ['Amazon Kindle Paperwhite, 16GB (2024)', 'Electronics', 19999, 'B0CFPJYX7P', '71YwNBmu+aL'],
  P: ['Weber Original Kettle Premium 22-Inch Charcoal Grill', 'Outdoors', 21900, 'B00MKB5TXA', '71uQnSUmBFL'],
  Q: ['Theragun Mini Massage Gun (3rd Gen)', 'Health', 21999, 'B0DV7JN7ZD', '71TcycbAqDL'],
  R: ['Apple Watch Series 11, GPS, 42mm', 'Electronics', 34999, 'B0FQF9ZX7P', '61T8W7-25IL'],
  S: ['Samsung 65-Inch Crystal UHD 4K Smart TV (2026)', 'Electronics', 37799, 'B0H3L589W7', '61GSarr1eSL'],
  T: ['KitchenAid Artisan 5-Quart Tilt-Head Stand Mixer', 'Kitchen', 37995, 'B004GUVD6K', '711fcF6OfnL'],
  U: ['Apple iPad 11-Inch (A16, 128GB, Wi-Fi)', 'Electronics', 42700, 'B0DZ75TN5F', '61aPY8odPSL'],
  V: ['Sony WH-1000XM6 Noise Cancelling Headphones', 'Electronics', 45800, 'B0F3PQHWTZ', '61ddahpESML'],
  W: ['Nintendo Switch 2', 'Games', 49900, 'B0F3GWXLTS', '714-Fh3ngmL'],
  X: ['Breville Barista Express Espresso Machine', 'Kitchen', 49995, 'B00CH9QWOU', '71BvCt6eAFL'],
  Y: ['Dyson V15 Detect Origin Cordless Vacuum', 'Home', 58999, 'B0GTC14BFW', '61k9OPHOj-L'],
  Z: ['Apple MacBook Air 13-Inch (M5, 16GB, 512GB)', 'Electronics', 123400, 'B0GR1JTFP8', '71pkfQGcMKL'],
};
const S = {
  bronco: { name: '2026 Ford Bronco', cat: 'Cars', price: 4079500, href: 'https://www.ford.com/suvs/bronco/', note: 'Starting MSRP on ford.com', img: COM('Ford_Bronco_(6th_generation)_Outer_Banks_1X7A0384.jpg'), credit: 'Photo: Alexander Migl, CC BY-SA 4.0, via Wikimedia Commons. An Outer Banks trim is shown.', creditUrl: 'https://commons.wikimedia.org/wiki/File:Ford_Bronco_(6th_generation)_Outer_Banks_1X7A0384.jpg' },
  rolex: { name: 'Rolex Submariner, Ref. 124060 (41mm, Oystersteel)', cat: 'Watches', price: 1005000, href: 'https://www.rolex.com/en-us/watches/submariner/m124060-0001', note: 'List price on rolex.com', img: COM('Rolex-Submariner.jpg'), credit: 'Photo: FrankWilliams, public domain, via Wikimedia Commons. It may show an earlier reference.', creditUrl: 'https://commons.wikimedia.org/wiki/File:Rolex-Submariner.jpg' },
  porsche: { name: 'Porsche 911 Carrera', cat: 'Cars', price: 13550000, href: 'https://www.porsche.com/usa/models/911/', note: 'Starting MSRP on porsche.com', img: COM('2025_Porsche_992_Carrera_convertible_DSC_7026.jpg'), credit: 'Photo: Alexander Migl, CC BY-SA 4.0, via Wikimedia Commons. A Carrera Cabriolet is shown.', creditUrl: 'https://commons.wikimedia.org/wiki/File:2025_Porsche_992_Carrera_convertible_DSC_7026.jpg' },
  harley: { name: '2026 Harley-Davidson Street Glide', cat: 'Motorcycles', price: 2499900, href: 'https://www.harley-davidson.com/us/en/motorcycles/street-glide.html', note: 'Starting price on harley-davidson.com', img: COM('Harley-Davidson Street Glide, Petrolia, Ontario, 2026-05-17 02.jpg'), credit: 'Photo: Chris Woodrich, CC BY-SA 4.0, via Wikimedia Commons.', creditUrl: 'https://commons.wikimedia.org/wiki/File:Harley-Davidson_Street_Glide,_Petrolia,_Ontario,_2026-05-17_02.jpg' },
};
// One slot per day from Friday 2026-10-02 to Saturday 2026-10-31. Weekdays
// alternate cheap and dear so no stretch of the week reads as a pattern.
const ORDER = ['M','O','bronco','E','A','T','H','W','C','rolex','L','S','F','Y','I','R','porsche','D','X','K','Z','B','P','harley','J','V','G','U','N','Q'];
const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];
const out = [];
let d = new Date(Date.UTC(2026, 9, 2));
ORDER.forEach((k, i) => {
  const iso = d.toISOString().slice(0, 10);
  const [y, m, dd] = iso.split('-').map(Number);
  const sunday = d.getUTCDay() === 0;
  const base = { num: 1 + i, quizId: `pricer-${m}-${dd}-${String(y).slice(2)}`, live: iso, dateLabel: `${MONTHS[m - 1]} ${dd}, ${y}`, sunday, gathered: '2026-10-01' };
  if (A[k]) {
    const [name, cat, price, asin, img] = A[k];
    if (sunday) throw new Error('amazon item on a sunday: ' + iso);
    out.push({ ...base, name, cat, price, shop: 'amazon', asin, href: `https://www.amazon.com/dp/${asin}?tag=cgurus-20`, img: AMZ(img), note: 'Price on Amazon' });
  } else {
    if (!sunday) throw new Error('big-ticket item on a weekday: ' + iso);
    out.push({ ...base, ...S[k], shop: 'brand' });
  }
  d = new Date(d.getTime() + 86400000);
});
const head = `// Pricer (relaunched 2026-10-02): one real product a day, five guesses at
// its price. The bracket version that once lived here was pulled on 2026-08-09,
// the day before it would have launched, and never ran, so numbering starts
// again at 1. The client only resumes a save carrying v: 2, so a stray
// bracket-era preview save can never be read as a new day.
//
// AUTHORING RULES (checked by scripts/verify-pricer.mjs):
//  * price is INTEGER CENTS. A weekday is an Amazon product (shop 'amazon',
//    asin, href to /dp/<asin>?tag=cgurus-20) read live off its product page,
//    current price, ideally sold by Amazon. A Sunday Edition is a big-ticket
//    item (shop 'brand') priced at the maker's own published starting price,
//    with href to that page.
//  * gathered is the date the price was READ, and it prints on the reveal.
//    A board must go live within 60 days of gathering; re-read anything older.
//  * No product twice in a bank; no two adjacent days in the same price decade.
//  * img must be a stable https JPEG/PNG (Amazon's m.media-amazon.com, or
//    Wikimedia Commons with credit + creditUrl). Never a googleusercontent or
//    Meta CDN url.
//  * Sundays are sunday: true and nothing else is.
`;
fs.writeFileSync('app/pricer/puzzles.js', head + '\nexport const PUZZLES = ' + JSON.stringify(out, null, 2) + ';\n');
console.log(out.length, out[0].quizId, out.at(-1).quizId, out.filter(p=>p.sunday).map(p=>p.live+' '+p.name).join(' | '));
