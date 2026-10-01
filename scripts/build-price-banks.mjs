// scripts/build-price-banks.mjs — writes the banks for Dealer, Realtor, Agent
// and Curator (the Price Check family; lib/price-games.js). Every figure below
// was read live on the date in `gathered` (or, for an auction, is the sale's
// published result with buyer's premium) and is INTEGER CENTS.
//
//   node scripts/build-price-banks.mjs
//
// Checked by scripts/verify-price-banks.mjs.
import fs from 'fs';

const COM = (f) => `https://commons.wikimedia.org/wiki/Special:FilePath/${encodeURIComponent(f)}?width=1000`;
const COMPAGE = (f) => `https://commons.wikimedia.org/wiki/File:${encodeURIComponent(f.replace(/ /g, '_'))}`;
const RF = (p) => `https://ssl.cdn-redfin.com/photo/${p}`;
const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];
const GATHERED = '2026-10-01';

function dated(key, rows, startIso) {
  let d = new Date(`${startIso}T00:00:00Z`);
  return rows.map((r, i) => {
    const iso = d.toISOString().slice(0, 10);
    const [y, m, dd] = iso.split('-').map(Number);
    d = new Date(d.getTime() + 86400000);
    return { num: i + 1, quizId: `${key}-${m}-${dd}-${String(y).slice(2)}`, live: iso, dateLabel: `${MONTHS[m - 1]} ${dd}, ${y}`, gathered: GATHERED, ...r };
  });
}
const credit = (who, lic, file) => ({ credit: `Photo: ${who}, ${lic}, via Wikimedia Commons.`, creditUrl: COMPAGE(file) });
const pd = (file) => ({ credit: 'Image: public domain, via Wikimedia Commons.', creditUrl: COMPAGE(file) });

// ── DEALER: maker's starting MSRP, read on the maker's site ───────────────
const V = (name, cat, dollars, maker, href, file, who, lic) => ({ name, cat, price: dollars * 100, maker, href, img: COM(file), ...credit(who, lic, file) });
const DEALER = [
  V('2027 Toyota Land Cruiser', 'SUV', 58180, 'toyota.com', 'https://www.toyota.com/landcruiser/', '2024 Toyota Land Cruiser 250 VX in Platinum White Pearl Mica, front left.jpg', 'Mr.choppers', 'CC BY-SA 4.0'),
  V('2026 Ford Bronco', 'SUV', 40795, 'ford.com', 'https://www.ford.com/suvs/bronco/', 'Ford Bronco (6th generation) Outer Banks 1X7A0384.jpg', 'Alexander Migl', 'CC BY-SA 4.0'),
  V('2026 Porsche 911 Carrera', 'Sports car', 135500, 'porsche.com', 'https://www.porsche.com/usa/models/911/', 'Porsche 992 Carrera S coupe IMG 5832.jpg', 'Alexander Migl', 'CC BY-SA 4.0'),
  V('2026 Lexus RX', 'Luxury SUV', 52775, 'lexus.com', 'https://www.lexus.com/models/RX', 'Lexus RX 500h F SPORT+ (V) – f 14072024.jpg', '© M 93', 'CC BY-SA 3.0 de'),
  V('2026 Ford Mustang', 'Sports car', 32995, 'ford.com', 'https://www.ford.com/cars/mustang/', 'Seventh generation 2024 Ford Mustang (cropped).jpg', 'WMrapids', 'CC0'),
  V('2027 Ford Transit Cargo Van', 'Work van', 48400, 'ford.com', 'https://www.ford.com/commercial-trucks/transit-cargo-van/', '2016 Ford Transit 350 2.2.jpg', 'Vauxford', 'CC BY-SA 4.0'),
  V('2027 Chevrolet Tahoe', 'SUV', 61200, 'chevrolet.com', 'https://www.chevrolet.com/suvs/tahoe', '2021 Chevrolet Tahoe High Country, front 12.24.20.jpg', 'Kevauto', 'CC BY-SA 4.0'),
  V('2026 Honda Civic Sedan', 'Sedan', 24695, 'honda.com', 'https://automobiles.honda.com/civic-sedan', 'Honda Civic Sedan (FE1) Washington DC Metro Area, USA.jpg', 'OWS Photography', 'CC BY 4.0'),
  V('2027 Hyundai Palisade', 'SUV', 39735, 'hyundaiusa.com', 'https://www.hyundaiusa.com/us/en/vehicles/palisade', 'Hyundai Palisade 2.5T Calligraphy LX3 Creamy White Pearl (65).jpg', 'Damian B Oh', 'CC BY-SA 4.0'),
  V('2026 Mercedes-AMG G 63', 'Luxury SUV', 198750, 'mbusa.com', 'https://www.mbusa.com/en/vehicles/class/g-class/suv', 'Mercedes-AMG G 63 (2024–) DSC 0681.jpg', 'Alexander-93', 'CC BY-SA 4.0'),
  V('2026 Toyota RAV4', 'SUV', 31900, 'toyota.com', 'https://www.toyota.com/rav4/', 'Toyota RAV4 Core Plug-in Hybrid IMG 7744.jpg', 'Alexander Migl', 'CC BY-SA 4.0'),
  V('2026 Jeep Wrangler', 'SUV', 36035, 'jeep.com', 'https://www.jeep.com/wrangler.html', 'Jeep Wrangler Unlimited (JL) PHEV IMG 5808.jpg', 'Alexander Migl', 'CC BY-SA 4.0'),
  V('2026 Ram ProMaster Cargo Van', 'Work van', 44105, 'ramtrucks.com', 'https://www.ramtrucks.com/ram-promaster.html', '2023 Ram ProMaster 2500 cargo van high roof 159-inch wheelbase, front right, 09-24-2023.jpg', 'MercurySable99', 'CC BY-SA 4.0'),
  V('2026 Chevrolet Corvette Stingray', 'Sports car', 71000, 'chevrolet.com', 'https://www.chevrolet.com/performance/corvette', 'Chevrolet Corvette C8 IAA 2021 1X7A0156.jpg', 'Alexander Migl', 'CC BY-SA 4.0'),
  V('2026 Ram 1500', 'Pickup', 42025, 'ramtrucks.com', 'https://www.ramtrucks.com/ram-1500.html', '2025 Ram 1500 front view.jpg', 'Deathpallie325', 'CC BY-SA 4.0'),
  V('2026 Ford Maverick', 'Pickup', 28145, 'ford.com', 'https://www.ford.com/trucks/maverick/', '2025 Ford Maverick XLT, front 4.15.25.jpg', 'Kevauto', 'CC BY-SA 4.0'),
  V('2026 Chevrolet Corvette ZR1', 'Supercar', 197700, 'chevrolet.com', 'https://www.chevrolet.com/performance/corvette', '2025 Chevrolet C8 Corvette ZR1.jpg', 'Oleg Yunakov', 'CC BY-SA 4.0'),
  V('2026 Toyota Camry', 'Sedan', 29600, 'toyota.com', 'https://www.toyota.com/camry/', '2025 Toyota Camry LE, front left, 05-24-2025.jpg', 'MercurySable99', 'CC BY-SA 4.0'),
  V('2027 Kia Telluride', 'SUV', 39190, 'kia.com', 'https://www.kia.com/us/en/telluride', '2027 Kia Telluride S, front right, 06-21-2026.jpg', 'MercurySable99', 'CC BY-SA 4.0'),
  V('2027 Ford Super Duty F-250', 'Work truck', 45975, 'ford.com', 'https://www.ford.com/trucks/super-duty/', 'Ford F-250 Super Duty P708 Mtl.JPG', 'Bull-Doser', 'public domain'),
  V('2026 Subaru Outback', 'Wagon', 34995, 'subaru.com', 'https://www.subaru.com/vehicles/outback.html', '2026 Subaru Outback Wilderness, front left, 05-24-2026.jpg', 'MercurySable99', 'CC BY-SA 4.0'),
  V('2026 Harley-Davidson Street Glide', 'Motorcycle', 24999, 'harley-davidson.com', 'https://www.harley-davidson.com/us/en/motorcycles/street-glide.html', 'Harley-Davidson Street Glide, Petrolia, Ontario, 2026-05-17 02.jpg', 'Chris Woodrich', 'CC BY-SA 4.0'),
  V('2026 Mazda MX-5 Miata', 'Sports car', 30730, 'mazdausa.com', 'https://www.mazdausa.com/vehicles/mx-5-miata', 'Mazda MX-5 (ND) 1X7A7471.jpg', 'Alexander-93', 'CC BY-SA 4.0'),
  V('2026 Chevrolet Corvette Z06', 'Supercar', 121500, 'chevrolet.com', 'https://www.chevrolet.com/performance/corvette', '2025 Chevrolet Corvette C8 Z06.jpg', 'Calreyn88', 'CC BY-SA 4.0'),
  V('2026 BMW 330i', 'Sedan', 48000, 'bmwusa.com', 'https://www.bmwusa.com/vehicles/3-series/sedan/overview.html', '2020 BMW 330i xDrive in Mineral White, Front Right, 07-19-2022.jpg', 'Elise240SX', 'CC BY-SA 4.0'),
  V('2026 Toyota Tacoma', 'Pickup', 32545, 'toyota.com', 'https://www.toyota.com/tacoma/', 'Toyota Tacoma TRD Off Road (N400) IMG 9727 (cropped).jpg', 'Alexander-93', 'CC BY-SA 4.0'),
  V('2026 Mercedes-Benz Sprinter Cargo Van', 'Work van', 48990, 'mbvans.com', 'https://www.mbvans.com/en/sprinter/cargo-van', '2024 Mercedes-Benz Sprinter 311 CDI (Argentina).jpg', 'Just a Man', 'CC BY 4.0'),
  V('2026 Toyota 4Runner', 'SUV', 42270, 'toyota.com', 'https://www.toyota.com/4runner/', '2025 Toyota 4Runner TRD Sport in Wind Chill Pearl, front right, 2025-05-18.jpg', 'Elise240SX', 'CC BY-SA 4.0'),
  V('2027 Honda CR-V', 'SUV', 31520, 'honda.com', 'https://automobiles.honda.com/cr-v', 'Honda CR-V e-HEV Elegance AWD (VI) – h 14072024.jpg', '© M 93', 'CC BY-SA 3.0 de'),
  V('2026 Ford F-150', 'Pickup', 39585, 'ford.com', 'https://www.ford.com/trucks/f150/', '2024 Ford F-150 Lariat front view.jpg', 'Deathpallie325', 'CC BY 4.0'),
];

// ── REALTOR: current asking price on the listing (Redfin) ─────────────────
const H = (city, state, zip, address, dollars, beds, baths, sqft, year, broker, url, photos) => ({
  city, state, zip, address, price: dollars * 100, beds, baths, sqft, year, broker,
  href: `https://www.redfin.com${url}`, imgs: photos.map(RF),
});
const REALTOR = [
  H('Cleveland', 'OH', '44135', '4044 W 157th St', 260000, 3, 1, 1335, 1942, 'Keller Williams Living', '/OH/Cleveland/4044-W-157th-St-44135/home/66156709', ['159/bigphoto/572/5249572_0.jpg', '159/bigphoto/572/5249572_11_0.jpg', '159/bigphoto/572/5249572_4_0.jpg']),
  H('Scottsdale', 'AZ', '85262', '37200 N Cave Creek Rd #1102', 2585000, 4, 4.5, 2683, 2024, 'Russ Lyon Sotheby\'s International Realty', '/AZ/Scottsdale/37200-N-Cave-Creek-Rd-85262/unit-1102/home/205911143', ['86/bigphoto/344/7086344_46_0.jpg', '86/bigphoto/344/7086344_4_0.jpg', '86/bigphoto/344/7086344_0.jpg']),
  H('Kansas City', 'MO', '64111', '1211 W 40th St', 360000, 3, 2, 1598, 1907, 'Compass Realty Group', '/MO/Kansas-City/1211-W-40th-St-64111/home/93154222', ['157/bigphoto/383/2644383_0.jpg', '157/bigphoto/383/2644383_6_0.jpg', '157/bigphoto/383/2644383_4_0.jpg']),
  H('Seattle', 'WA', '98117', '9508 Mary Ave NW', 949900, 2, 1, 2010, 1941, 'Coldwell Banker Bain', '/WA/Seattle/9508-Mary-Ave-NW-98117/home/95342', ['1/bigphoto/618/2588618_0.jpg', '1/bigphoto/618/2588618_12_0.jpg', '1/bigphoto/618/2588618_5_0.jpg']),
  H('Detroit', 'MI', '48227', '14577 Whitcomb St', 190000, 3, 2, 1760, 1937, 'EXP Realty Main', '/MI/Detroit/14577-Whitcomb-St-48227/home/98526716', ['143/bigphoto/954/61033954_2.jpg', '143/bigphoto/954/61033954_4_2.jpg', '143/bigphoto/954/61033954_9_2.jpg']),
  H('Miami', 'FL', '33127', '280 NW 47th St', 3249000, 6, 6, 3567, 2026, 'Compass Florida, LLC', '/FL/Miami/280-NW-47th-St-33127/home/42688960', ['105/bigphoto/131/A12098131_4_0.jpg', '105/bigphoto/131/A12098131_11_0.jpg', '105/bigphoto/131/A12098131_8_0.jpg']),
  H('Phoenix', 'AZ', '85032', '14631 N 37th Pl', 529000, 4, 2, 1740, 1972, 'West USA Realty', '/AZ/Phoenix/14631-N-37th-Pl-85032/home/28088532', ['86/bigphoto/928/7084928_3.jpg', '86/bigphoto/928/7084928_7_2.jpg', '86/bigphoto/928/7084928_3_2.jpg']),
  H('Charleston', 'SC', '29414', '378 Mutual Dr', 1790000, 4, 3, 2565, 2026, 'The Boulevard Company', '/SC/Charleston/378-Mutual-Dr-29414/home/87091742', ['151/bigphoto/673/26026673_1_2.jpg', '151/bigphoto/673/26026673_11_2.jpg', '151/bigphoto/673/26026673_9_2.jpg']),
  H('Boise', 'ID', '83704', '3335 N Manchester St', 480000, 4, 2, 2692, 1971, 'Hunter of Homes, LLC', '/ID/Boise/3335-N-Manchester-St-83704/home/106740739', ['228/bigphoto/594/99000594_2.jpg', '228/bigphoto/594/99000594_12_2.jpg', '228/bigphoto/594/99000594_3_2.jpg']),
  H('San Diego', 'CA', '92117', '4789 Andalusia Ave', 1450000, 3, 2, 2215, 1961, 'Keller Williams La Jolla', '/CA/San-Diego/4789-Andalusia-Ave-92117/home/4963347', ['45/bigphoto/393/PTP2607393_0.jpg', '45/bigphoto/393/PTP2607393_11_0.jpg', '45/bigphoto/393/PTP2607393_15_0.jpg']),
  H('Nashville', 'TN', '37209', '541 Eastboro Dr', 625000, 3, 3, 1725, 2015, 'Compass', '/TN/Nashville/541-Eastboro-Dr-37209/home/60710325', ['641/bigphoto/505/2199320751951348505_0.jpg', '641/bigphoto/505/2199320751951348505_8_0.jpg', '641/bigphoto/505/2199320751951348505_16_0.jpg']),
  H('Denver', 'CO', '80220', '1210 Ivy St', 1100000, 3, 2, 1663, 1951, 'Compass', '/CO/Denver/1210-Ivy-St-80220/home/34171006', ['641/bigphoto/121/2204550812115091121_33_0.jpg', '641/bigphoto/121/2204550812115091121_4_0.jpg', '641/bigphoto/121/2204550812115091121_3_0.jpg']),
  H('Raleigh', 'NC', '27601', '610 Rocky Knob Ct', 559000, 4, 4, 2300, 2025, 'Compass, Raleigh', '/NC/Raleigh/610-Rocky-Knob-Ct-27601/home/189999234', ['102/bigphoto/588/10195588_1_0.jpg', '102/bigphoto/588/10195588_4_0.jpg', '102/bigphoto/588/10195588_9_0.jpg']),
  H('Austin', 'TX', '78751', '4502 Avenue H', 799000, 3, 2, 1560, null, 'Kuper Sotheby\'s International Realty', '/TX/Austin/4502-Avenue-H-78751/home/31431268', ['641/bigphoto/065/2185691984059466065_0.jpg', '641/bigphoto/065/2185691984059466065_10_0.jpg', '641/bigphoto/065/2185691984059466065_1_0.jpg']),
];

// ── AGENT: a named flight or a hotel night, quoted on Google that day ────────
const gf = (from, to, date, cabin) => `https://www.google.com/travel/flights?q=${encodeURIComponent(`Flights from ${from} to ${to} on ${date} one way ${cabin}`)}&hl=en&curr=USD`;
const gh = (q) => `https://www.google.com/travel/search?q=${encodeURIComponent(q)}&hl=en&curr=USD`;
const F = (airline, from, fromCity, to, toCity, date, dep, cabin, cabinQ, dollars, file, who, lic) => ({
  kind: 'flight', airline, from, fromCity, to, toCity, date, dep, cabin, price: dollars * 100,
  href: gf(from, to, date, cabinQ), img: COM(file), ...credit(who, lic, file),
});
const HT = (hotel, city, date, nights, room, dollars, q, file, who, lic) => ({
  kind: 'hotel', hotel, city, date, nights, room, price: dollars * 100,
  href: gh(q), img: COM(file), ...credit(who, lic, file),
});
const AGENT = [
  F('Frontier', 'FLL', 'Fort Lauderdale', 'ATL', 'Atlanta', '2026-11-06', '4:19 PM', 'Economy', 'economy', 40, 'Frontier Airbus A320neo N354FR BWI MD2.jpg', 'Acroterion', 'CC BY-SA 4.0'),
  HT('Ritz Paris', 'Paris, France', '2026-12-17', 1, 'Superior Room', 2677, 'Ritz Paris', 'Place Vendôme - Hôtel Ritz (Paris).jpg', 'Gzen92', 'CC BY-SA 4.0'),
  F('Delta', 'JFK', 'New York', 'LAX', 'Los Angeles', '2026-11-14', '4:25 PM', 'Delta One (business)', 'business class', 1599, 'Delta Boeing 757-200 N699DL BWI MD1.jpg', 'Acroterion', 'CC BY-SA 4.0'),
  F('Alaska', 'SEA', 'Seattle', 'ANC', 'Anchorage', '2026-11-12', '9:35 AM', 'Economy', 'economy', 171, 'Alaska Airlines Boeing 737-9 MAX N928AK departing Boston June 2025 2.jpg', '4300streetcar', 'CC BY 4.0'),
  F('Emirates', 'JFK', 'New York', 'DXB', 'Dubai', '2026-12-15', '10:40 AM', 'First class', 'first class', 18803, 'Emirates Airbus A380-861 A6-EER MUC 2015 04.jpg', 'Julian Herzog', 'CC BY 4.0'),
  HT('Bellagio', 'Las Vegas, NV', '2026-12-17', 1, 'Premier King', 199, 'Bellagio Las Vegas', 'Bellagio Fountains at night, Las Vegas, Nevada - 29174293017.jpg', 'Matt Kieffer', 'CC BY-SA 2.0'),
  F('Alaska', 'SFO', 'San Francisco', 'HNL', 'Honolulu', '2026-11-21', '7:10 PM', 'Economy', 'economy', 454, 'Alaska Airlines Boeing 737-9 MAX N928AK departing Boston June 2025 2.jpg', '4300streetcar', 'CC BY 4.0'),
  F('American', 'LAX', 'Los Angeles', 'HND', 'Tokyo Haneda', '2026-12-10', '10:05 AM', 'Business', 'business class', 3113, 'American Airlines Boeing 777-300ER (cropped).jpg', 'Venkat Mangudi', 'CC BY 2.0'),
  F('JetBlue', 'BOS', 'Boston', 'DCA', 'Washington National', '2026-12-05', '9:20 AM', 'Economy', 'economy', 59, 'JetBlue A321LR (N4058J) at Boston.jpg', 'Tim', 'CC0'),
  HT('The Plaza', 'New York, NY', '2026-12-16', 1, 'Lowest available room', 2725, 'The Plaza New York', 'The Plaza Hotel Manhattan NYC.jpg', 'Daniel Dimitrov', 'CC BY-SA 4.0'),
  F('Southwest', 'DEN', 'Denver', 'CUN', 'Cancún', '2027-01-09', '11:10 AM', 'Economy', 'economy', 328, 'Southwest Boeing 737-8 MAX N8847Q BWI MD2.jpg', 'Acroterion', 'CC BY-SA 4.0'),
  F('JetBlue', 'JFK', 'New York', 'LHR', 'London Heathrow', '2026-12-03', '9:26 AM', 'Mint (business)', 'business class', 2559, 'JetBlue A321LR (N4058J) at Boston.jpg', 'Tim', 'CC0'),
  HT('Hotel del Coronado', 'Coronado, CA', '2026-12-17', 1, 'Victorian King', 533, 'Hotel del Coronado', 'Hotel del Coronado 10 2019-04-16.jpg', 'FASTILY', 'CC BY-SA 4.0'),
  F('Qantas', 'SFO', 'San Francisco', 'SYD', 'Sydney', '2027-01-20', '8:45 PM', 'Business', 'business class', 5650, 'Qantas - VH-ZNF - Boeing 787-9 Dreamliner - QF6027 - VGHS.jpg', 'Md Shaifuzzaman Ayon', 'CC BY-SA 4.0'),
];

// ── CURATOR: an auction result (with premium) or a luxury list price ───────
const AU = (title, maker, year, house, place, sale, cents, src, file, creditFn) => ({
  kind: 'auction', name: title, maker, year, house, place, sale, price: cents, href: src, img: COM(file), ...creditFn(file),
});
const RT = (name, brand, site, dollars, href, file, who, lic) => ({
  kind: 'retail', name, brand, site, price: dollars * 100, href, img: COM(file), ...credit(who, lic, file),
});
const CURATOR = [
  RT('Montblanc Meisterstück 149 Fountain Pen', 'Montblanc', 'montblanc.com', 1380, 'https://www.montblanc.com/en-us/search?q=meisterstuck%20149', 'MB Meister149.jpg', 'Stefan Wallrafen', 'CC BY-SA 3.0 de'),
  AU('Portrait of Elisabeth Lederer', 'Gustav Klimt', '1914–16', "Sotheby's", 'New York', '2025-11-18', 23640000000, 'https://en.wikipedia.org/wiki/Portrait_of_Elisabeth_Lederer', 'Gustav Klimt - Bildnis der Elisabeth Lederer (1914-1916).jpg', pd),
  RT('Cartier LOVE Bracelet, Classic, 18K Gold', 'Cartier', 'cartier.com', 7950, 'https://www.cartier.com/en-us/jewelry/bracelets/love-bracelet-CRB6067417.html', 'Cartier love collection re launched.jpg', 'Reresse', 'CC BY-SA 3.0'),
  AU('Meules (Haystacks)', 'Claude Monet', '1890', "Sotheby's", 'New York', '2019-05-14', 11074700000, 'https://en.wikipedia.org/wiki/Haystacks_(Monet_series)', 'Meules (1890-91) Claude Monet (W1273).jpg', pd),
  AU('The Inverted Jenny, a single stamp', 'U.S. Post Office', '1918', 'Siegel Auction Galleries', 'New York', '2023-11-08', 200600000, 'https://en.wikipedia.org/wiki/Inverted_Jenny', 'Inverted Jenny.jpg', pd),
  AU('Apex, a Stegosaurus skeleton', 'Fossil, about 150 million years old', 'Jurassic', "Sotheby's", 'New York', '2024-07-17', 4460000000, 'https://en.wikipedia.org/wiki/Apex_(dinosaur)', 'Apex (dinosaur).jpg', (f) => credit('DraconicDark', 'CC BY-SA 4.0', f)),
  RT('Omega Speedmaster Moonwatch Professional, 42 mm', 'Omega', 'omegawatches.com', 7800, 'https://www.omegawatches.com/en-us/watch-omega-speedmaster-moonwatch-professional-co-axial-master-chronometer-chronograph-42-mm-31030425001001', 'Moonwatch (24023224706).jpg', 'Daniel Zimmermann', 'CC BY 2.0'),
  AU('The Scream (pastel)', 'Edvard Munch', '1895', "Sotheby's", 'New York', '2012-05-02', 11992250000, 'https://en.wikipedia.org/wiki/The_Scream', 'The Scream Pastel.jpg', pd),
  AU('Vétheuil, effet du matin', 'Claude Monet', '1901', "Sotheby's", 'Paris', '2026-04-16', 1210000000, 'https://robbreport.com/shelter/art-collectibles/claude-monet-vetheuil-du-matin-auction-record-1238007921/', 'Claude Monet - Vétheuil, effet du matin - 1901 (W1636).jpg', pd),
  AU('Codex Leicester', 'Leonardo da Vinci', 'about 1510', "Christie's", 'New York', '1994-11-11', 3080250000, 'https://en.wikipedia.org/wiki/Codex_Leicester', 'CodexLeicester.jpg', pd),
  AU('The 1933 Double Eagle, a $20 gold coin', 'U.S. Mint', '1933', "Sotheby's", 'New York', '2021-06-08', 1887225000, 'https://en.wikipedia.org/wiki/1933_double_eagle', '1933 double eagle.JPG', pd),
  AU('Salvator Mundi', 'Leonardo da Vinci', 'about 1500', "Christie's", 'New York', '2017-11-15', 45031250000, 'https://en.wikipedia.org/wiki/Salvator_Mundi_(Leonardo)', 'Leonardo da Vinci, Salvator Mundi, c.1500, oil on walnut, 45.4 × 65.6 cm.jpg', pd),
];

const START = '2026-10-02';
const banks = { dealer: DEALER, realtor: REALTOR, agent: AGENT, curator: CURATOR };
const HEAD = {
  dealer: 'Dealer: one vehicle a day at its maker\'s starting MSRP, read on the maker\'s own site on `gathered`.',
  realtor: 'Realtor: one home for sale a day at its asking price on the listing, read on `gathered`. Photos are the listing\'s own, credited to the brokerage and linked back (owner, 2026-10-01). The address is hidden until the reveal.',
  agent: 'Agent: one trip a day, a named flight (airline, day, date, departure, cabin) or a hotel night, at the fare Google quoted on `gathered`, taxes and fees in.',
  curator: 'Curator: one luxury piece a day, an auction result with buyer\'s premium (dated by `sale`) or a luxury list price read on `gathered`.',
};
for (const [key, rows] of Object.entries(banks)) {
  const out = dated(key, rows, START);
  fs.mkdirSync(`app/${key}`, { recursive: true });
  fs.writeFileSync(`app/${key}/puzzles.js`,
    `// ${HEAD[key]}\n// Generated by scripts/build-price-banks.mjs; checked by scripts/verify-price-banks.mjs.\n// price is INTEGER CENTS.\n\nexport const PUZZLES = ${JSON.stringify(out, null, 2)};\n`);
  console.log(key, out.length, out[0].live, out.at(-1).live);
}
