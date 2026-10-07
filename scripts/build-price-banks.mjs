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
// Rows added in a restock carry the date THEY were read (the bank's first rows keep GATHERED).
const READ = (date, rows) => rows.map((r) => ({ ...r, gathered: date }));

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
  // Restock, read 2026-10-03 (to 2026-11-30).
  ...READ('2026-10-03', [
  V('2027 Nissan Sentra', 'Sedan', 22990, 'nissanusa.com', 'https://www.nissanusa.com/vehicles/cars/sentra.html', '2026 Nissan Sentra front view.jpg', 'Deathpallie325', 'CC BY 4.0'),
  V('2027 Cadillac Escalade', 'Luxury SUV', 102700, 'cadillac.com', 'https://www.cadillac.com/suvs/escalade', 'Cadillac Escalade Sport Platinum GMTT1XX FL Black Raven (1).jpg', 'Damian B Oh', 'CC BY-SA 4.0'),
  V('2026 Honda Accord', 'Sedan', 28395, 'honda.com', 'https://automobiles.honda.com/accord-sedan', '2023 Honda Accord LX, front left.jpg', 'MercurySable99', 'CC BY-SA 4.0'),
  V('2026 Audi Q5', 'Luxury SUV', 52800, 'audiusa.com', 'https://www.audiusa.com/en/models/q5/q5/2026/overview/', 'Audi Q5 GU DSC 8460.jpg', 'Alexander Migl', 'CC BY-SA 4.0'),
  V('2026 Subaru Crosstrek', 'SUV', 26995, 'subaru.com', 'https://www.subaru.com/vehicles/crosstrek.html', '2024 Subaru Crosstrek Onyx in Sapphire Blue Pearl, Front Left, 07-12-2023.jpg', 'Elise240SX', 'CC BY-SA 4.0'),
  V('2027 Ford E-Series Cutaway', 'Work truck', 41330, 'fordpro.com', 'https://www.fordpro.com/en-us/fleet-vehicles/e-series-cutaway/', '2021 Ford E350 cutaway (Knapheide body), front left.jpg', 'Mr.choppers', 'CC BY-SA 3.0'),
  V('2026 Hyundai Tucson', 'SUV', 29700, 'hyundaiusa.com', 'https://www.hyundaiusa.com/us/en/vehicles/tucson', '2025 Hyundai Tucson XRT (United States) front view.jpg', 'Charles', 'CC BY 2.0'),
  V('2026 Dodge Charger', 'Muscle car', 49995, 'dodge.com', 'https://www.dodge.com/charger.html', '2024 Dodge Charger Daytona Scat Pack in Redeye, front left, 2026-08-30.jpg', 'Elise240SX', 'CC BY-SA 4.0'),
  V('Porsche 911 GT3', 'Supercar', 235800, 'porsche.com', 'https://www.porsche.com/usa/models/911/911-gt3-models/911-gt3/', 'Porsche 911 GT3 Touring (992.2) 001.jpg', 'JustAnotherCarDesigner', 'CC0'),
  V('2027 Volkswagen Jetta', 'Sedan', 23995, 'vw.com', 'https://www.vw.com/en/models/jetta.html', '2025 Volkswagen Jetta in Monterey Blue Pearl, front right, 04-26-2025.jpg', 'Cutlass', 'CC0'),
  V('2027 Honda Odyssey', 'Minivan', 43195, 'honda.com', 'https://automobiles.honda.com/odyssey', '2025 Honda Odyssey front view.jpg', 'Deathpallie325', 'CC BY 4.0'),
  V('2027 Kia Sportage', 'SUV', 28990, 'kia.com', 'https://www.kia.com/us/en/sportage', '2025 Kia Sportage GT-Line facelift front.jpg', 'LuvsMG481', 'CC BY-SA 4.0'),
  V('Honda Gold Wing', 'Motorcycle', 25500, 'powersports.honda.com', 'https://powersports.honda.com/motorcycle/touring/gold-wing', 'Honda Gold Wing GL 1800 (SC79 - 2018).jpg', 'Tarrakaner', 'CC BY-SA 4.0'),
  V('2026 Jeep Grand Cherokee', 'SUV', 38920, 'jeep.com', 'https://www.jeep.com/grand-cherokee.html', '26 Jeep Grand Cherokee Limited.jpg', 'HJUdall', 'CC0'),
  V('2026 Ram Chassis Cab', 'Work truck', 48605, 'ramtrucks.com', 'https://www.ramtrucks.com/ram-chassis-cab.html', '26 Ram 5500 Chassis Cab Tradesman.jpg', 'HJUdall', 'CC0'),
  V('2027 Lucid Air Sapphire', 'Luxury EV', 249000, 'lucidmotors.com', 'https://lucidmotors.com/air', 'Lucid Air Sapphire GIMS 2024 1X7A2362.jpg', 'Alexander-93', 'CC BY-SA 4.0'),
  V('2026 Lexus ES', 'Luxury sedan', 48895, 'lexus.com', 'https://www.lexus.com/models/ES', 'Lexus ES 350e (front three-quarter view) at Grand Front Osaka.jpg', 'Aos.1905', 'CC BY-SA 4.0'),
  V('2026 Acura Integra', 'Sedan', 33400, 'acura.com', 'https://www.acura.com/integra', '2023 Acura Integra A-Spec, front 4.3.23.jpg', 'Kevauto', 'CC BY-SA 4.0'),
  V('Mercedes-Benz C 300 Sedan', 'Luxury sedan', 49650, 'mbusa.com', 'https://www.mbusa.com/en/vehicles/class/c-class/sedan', 'Mercedes-Benz C 300 4MATIC (W206, 2026) (55212140928).jpg', 'Charles from Port Chester, New York', 'CC0'),
  V('2026 Mazda CX-50', 'SUV', 29900, 'mazdausa.com', 'https://www.mazdausa.com/vehicles/cx-50', '2023 Mazda CX-50 GT in Zircon Sand Metallic, Front Left, 05-22-2022.jpg', 'Elise240SX', 'CC BY-SA 4.0'),
  V('2026 Volvo XC90 Plug-in Hybrid', 'Luxury SUV', 77595, 'volvocars.com', 'https://www.volvocars.com/us/cars/xc90-hybrid/', '2025 Volvo XC90 (facelift), front 4.11.25.jpg', 'Kevauto', 'CC BY-SA 4.0'),
  V('2027 Kia K5', 'Sedan', 27690, 'kia.com', 'https://www.kia.com/us/en/k5', 'Kia K5 GT-Line (2022) (53487999790).jpg', 'Charles from Port Chester, New York', 'CC BY 2.0'),
  V('2026 GMC Hummer EV Pickup', 'Electric pickup', 97200, 'gmc.com', 'https://www.gmc.com/electric/hummer-ev/pickup-truck', '2024 GMC Hummer EV Pickup 2X 4WD Sport Package in Meteorite Metallic, front left, 2024-03-31.jpg', 'Elise240SX', 'CC BY-SA 4.0'),
  V('2026 Volkswagen Atlas', 'SUV', 39310, 'vw.com', 'https://www.vw.com/en/models/atlas.html', '2024 Volkswagen Atlas SE, front left, 08-21-2026.jpg', 'BuickRiviera99', 'CC BY-SA 4.0'),
  V('2027 Ford F-650', 'Work truck', 69995, 'fordpro.com', 'https://www.fordpro.com/en-us/fleet-vehicles/f650-f750/', '25 Ford F-650 Super Duty XL.jpg', 'HJUdall', 'CC0'),
  V('2027 Chevrolet Equinox', 'SUV', 29300, 'chevrolet.com', 'https://www.chevrolet.com/suvs/equinox', '2025 Chevrolet Equinox front view.jpg', 'Deathpallie325', 'CC BY 4.0'),
  V('2027 Nissan Z', 'Sports car', 44480, 'nissanusa.com', 'https://www.nissanusa.com/vehicles/sports-cars/nissan-z.html', '2023 Nissan Z RZ34 in Granite Black, front left, 05-05-2024.jpg', 'Ethan Llamas', 'CC BY-SA 4.0'),
  V('2027 MINI Cooper 2 Door', 'Hatchback', 33600, 'miniusa.com', 'https://www.miniusa.com/model/2-door.html', '2024 MINI Cooper Sport C - 1499cc 1.5 (156PS) Petrol - Nanuq White - 06-2024, Front.jpg', 'Harvey Bold', 'CC BY 4.0'),
  V('2026 Acura MDX', 'Luxury SUV', 51800, 'acura.com', 'https://www.acura.com/suvs/mdx', '2022 Acura MDX Technology, front 7.2.22.jpg', 'Kevauto', 'CC BY-SA 4.0'),
  V('Mercedes-AMG SL 43 Roadster', 'Sports car', 114900, 'mbusa.com', 'https://www.mbusa.com/en/vehicles/class/sl/roadster', 'Mercedes-AMG SL 43 (R232) front.jpg', 'Tokumeigakarinoaoshima', 'CC BY-SA 4.0'),
  V('Tesla Model 3', 'Electric sedan', 38630, 'tesla.com', 'https://www.tesla.com/model3', "Tesla Model 3 'Highland' (2024).jpg", 'Mliu92', 'CC BY-SA 4.0'),
  ]),
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
  // Restock, read 2026-10-03 (to 2026-11-30).
  ...READ('2026-10-03', [
  H('Peoria', 'IL', '61603', '2809 N Missouri Ave', 139900, 2, 1, 1188, 1945, 'RE/MAX Traders Unlimited', '/IL/Peoria/2809-N-Missouri-Ave-61603/home/131772114', ['321/bigphoto/597/PA1270597_0.jpg', '321/bigphoto/597/PA1270597_10_0.jpg', '321/bigphoto/597/PA1270597_6_0.jpg']),
  H('Greenwich', 'CT', '06830', '271 Overlook Dr', 4795000, 5, 4.5, 4778, 2011, 'Houlihan Lawrence', '/CT/Greenwich/271-Overlook-Dr-06830/home/107019678', ['238/bigphoto/962/125962_4.jpg', '238/bigphoto/962/125962_8_4.jpg', '238/bigphoto/962/125962_3_4.jpg']),
  H('Portland', 'OR', '97201', '1617 SW Broadway Dr', 525000, 2, 2, 1622, 1907, 'Premiere Property Group, LLC', '/OR/Portland/1617-SW-Broadway-Dr-97201/home/25829513', ['84/bigphoto/793/368736793_1.jpg', '84/bigphoto/793/368736793_16_1.jpg', '84/bigphoto/793/368736793_4_1.jpg']),
  H('Flint', 'MI', '48506', '3185 Delaney St', 100000, 2, 1, 1100, 1925, 'Brookstone, Realtors LLC', '/MI/Flint/3185-Delaney-St-48506/home/102566168', ['143/bigphoto/056/50223056_0.jpg', '143/bigphoto/056/50223056_6_0.jpg', '143/bigphoto/056/50223056_4_0.jpg']),
  H('Bozeman', 'MT', '59715', '810 S 7th Ave', 1200000, 5, 2.5, 3056, 1952, 'Keller Williams Montana Realty', '/MT/Bozeman/810-S-7th-Ave-59715/home/133444262', ['308/bigphoto/173/415173_3_1.jpg', '308/bigphoto/173/415173_6_1.jpg', '308/bigphoto/173/415173_4_1.jpg']),
  H('Omaha', 'NE', '68134', '10267 Nebraska Ave', 339900, 3, 2.5, 2016, 2000, 'RE/MAX Results', '/NE/Omaha/10267-Nebraska-Ave-68134/home/63875950', ['186/bigphoto/885/22626885_0.jpg', '186/bigphoto/885/22626885_9_0.jpg', '186/bigphoto/885/22626885_6_0.jpg']),
  H('Malibu', 'CA', '90265', '24818 Malibu Rd', 17450000, 4, 5, 3182, 1990, 'Compass', '/CA/Malibu/24818-Malibu-Rd-90265/home/6854714', ['40/bigphoto/335/26993335_0.jpg', '40/bigphoto/335/26993335_4_0.jpg', '40/bigphoto/335/26993335_2_0.jpg']),
  H('Baltimore', 'MD', '21212', '4720 Ivanhoe Ave', 220000, 3, 2.5, 1170, 1910, 'Long & Foster Real Estate, Inc.', '/MD/Baltimore/4720-Ivanhoe-Ave-21212/home/11194150', ['235/bigphoto/534/MDBA2228534_2.jpg', '235/bigphoto/534/MDBA2228534_7_1.jpg', '235/bigphoto/534/MDBA2228534_1_1.jpg']),
  H('Savannah', 'GA', '31401', '540 E 32nd St', 642000, 3, 2.5, 1620, 2018, 'Engel & Volkers', '/GA/Savannah/540-E-32nd-St-31401/home/122284783', ['318/bigphoto/537/SA365537_1.jpg', '318/bigphoto/537/SA365537_25_1.jpg', '318/bigphoto/537/SA365537_15_1.jpg']),
  H('Wichita', 'KS', '67216', '2732 S Minnesota Ave', 185000, 4, 2, 1824, 1954, 'Real Broker, LLC', '/KS/Wichita/2732-S-Minnesota-Ave-67216/home/119692322', ['313/bigphoto/866/679866_2_0.jpg', '313/bigphoto/866/679866_8_0.jpg', '313/bigphoto/866/679866_5_0.jpg']),
  H('Newport', 'RI', '02840', '16 Sherman St', 2498888, 6, 3, 3600, 1854, 'William Raveis Inspire', '/RI/Newport/16-Sherman-St-02840/home/51754695', ['116/bigphoto/259/1424259_0.jpg', '116/bigphoto/259/1424259_14_0.jpg', '116/bigphoto/259/1424259_1_0.jpg']),
  H('Richmond', 'VA', '23222', '3228 Hanes Ave', 415000, 4, 1.5, 1894, 1916, 'Providence Hill Real Estate', '/VA/Richmond/3228-Hanes-Ave-23222/home/55421390', ['131/bigphoto/514/2625514_0.jpg', '131/bigphoto/514/2625514_26_0.jpg', '131/bigphoto/514/2625514_15_0.jpg']),
  H('Toledo', 'OH', '43609', '823 Toronto Ave', 105000, 3, 1.5, 1061, 1924, 'LaPlante Real Estate, LLC', '/OH/Toledo/823-Toronto-Ave-43609/home/123035397', ['282/bigphoto/084/10014084_2_0.jpg', '282/bigphoto/084/10014084_6_0.jpg', '282/bigphoto/084/10014084_4_0.jpg']),
  H('Honolulu', 'HI', '96817', '1556 Alewa Dr', 1399000, 2, 2.5, 1628, 1949, 'Real Estate Strategies, LLC', '/HI/Honolulu/1556-Alewa-Dr-96817/home/88484097', ['169/bigphoto/176/202618176_0.jpg', '169/bigphoto/176/202618176_8_1.jpg', '169/bigphoto/176/202618176_2_1.jpg']),
  H('Fargo', 'ND', '58102', '502 21st Ave N', 289900, 3, 2, 1616, 1951, 'RE/MAX Realty 1', '/ND/Fargo/502-21st-Ave-N-58102/home/136489233', ['114/bigphoto/557/7152557_0.jpg', '114/bigphoto/557/7152557_7_0.jpg', '114/bigphoto/557/7152557_6_0.jpg']),
  H('Aspen', 'CO', '81611', '633 W Main St', 9500000, 3, 3, 2969, 1885, 'Mont Haus International Realty', '/CO/Aspen/633-W-Main-St-81611/home/132025697', ['292/bigphoto/709/194709_0.jpg', '292/bigphoto/709/194709_8_0.jpg', '292/bigphoto/709/194709_4_0.jpg']),
  H('Burlington', 'VT', '05408', '129 Lori Ln', 455000, 4, 2, 1488, 1985, 'Coldwell Banker Hickok and Boardman', '/VT/Burlington/129-Lori-Ln-05408/home/91179483', ['154/bigphoto/199/5112199_1_1.jpg', '154/bigphoto/199/5112199_12_1.jpg', '154/bigphoto/199/5112199_4_1.jpg']),
  H('Birmingham', 'AL', '35235', '825 Northcrest Dr', 199900, 4, 3, 2496, 1964, 'Ridgeway Realty LLC', '/AL/Birmingham/825-Northcrest-Dr-35235/home/80871592', ['172/bigphoto/398/21466398_2.jpg', '172/bigphoto/398/21466398_18_0.jpg', '172/bigphoto/398/21466398_15_0.jpg']),
  H('Asheville', 'NC', '28801', '10 Birdhouse Row', 899000, 4, 4.5, 2828, 2017, 'Howard Hanna Beverly-Hanks Asheville-Biltmore Park', '/NC/Asheville/10-Birdhouse-Row-28801/home/102029290', ['103/bigphoto/008/4426008_0.jpg', '103/bigphoto/008/4426008_9_0.jpg', '103/bigphoto/008/4426008_4_0.jpg']),
  H('Huntington', 'WV', '25705', '1137 Norway Ave', 135000, 2, 1, 1200, 1956, 'Old Colony Realtors Huntington', '/WV/Huntington/1137-Norway-Ave-25705/home/115619492', ['637/bigphoto/002/185002_0.jpg', '637/bigphoto/002/185002_9_0.jpg', '637/bigphoto/002/185002_4_0.jpg']),
  H('Santa Barbara', 'CA', '93105', '2210 Saint James Dr', 4049000, 4, 3, 2386, 1969, 'Berkshire Hathaway HomeServices California Properties', '/CA/Santa-Barbara/2210-Saint-James-Dr-93105/home/21592323', ['87/bigphoto/302/26-3302_1.jpg', '87/bigphoto/302/26-3302_6_1.jpg', '87/bigphoto/302/26-3302_2_1.jpg']),
  H('Little Rock', 'AR', '72205', '7000 Marguerite Ln', 289900, 4, 2.5, 2150, 1964, 'IRealty Arkansas - LR', '/AR/Little-Rock/7000-Marguerite-Ln-72205/home/95342225', ['184/bigphoto/037/26039037_0.jpg', '184/bigphoto/037/26039037_7_0.jpg', '184/bigphoto/037/26039037_2_0.jpg']),
  H('Tacoma', 'WA', '98409', '7230 S Wapato St', 498950, 3, 2.5, 1644, 2005, 'Renaissance Real Estate LLC', '/WA/Tacoma/7230-S-Wapato-St-98409/home/3042052', ['1/bigphoto/051/2588051_0.jpg', '1/bigphoto/051/2588051_8_0.jpg', '1/bigphoto/051/2588051_4_0.jpg']),
  H('Milwaukee', 'WI', '53228', '3601 S 85th St', 215000, 2, 1, 909, 1920, 'Shorewest Realtors, Inc.', '/WI/Milwaukee/3601-S-85th-St-53228/home/90247558', ['128/bigphoto/690/1982690_0.jpg', '128/bigphoto/690/1982690_15_2.jpg', '128/bigphoto/690/1982690_7_2.jpg']),
  H('Dallas', 'TX', '75218', '8645 Redondo Dr', 1525000, 4, 3.5, 3600, 2024, 'CLAY STAPP + CO', '/TX/Dallas/8645-Redondo-Dr-75218/home/30859646', ['90/bigphoto/006/21400006_0.jpg', '90/bigphoto/006/21400006_10_0.jpg', '90/bigphoto/006/21400006_8_0.jpg']),
  H('Manchester', 'NH', '03103', '625 Dix St', 400000, 3, 1.5, 1240, 1900, 'EXP Realty', '/NH/Manchester/625-Dix-St-03103/home/96448884', ['154/bigphoto/190/5112190_1.jpg', '154/bigphoto/190/5112190_17_1.jpg', '154/bigphoto/190/5112190_9_1.jpg']),
  H('Youngstown', 'OH', '44507', '144 Brooklyn Ave', 99900, 3, 1, 1412, 1929, 'More Options Realty, LLC', '/OH/Youngstown/144-Brooklyn-Ave-44507/home/71978133', ['159/bigphoto/530/5249530_0.jpg', '159/bigphoto/530/5249530_4_0.jpg', '159/bigphoto/530/5249530_7_0.jpg']),
  H('Naples', 'FL', '34103', '299 Mermaids Bight', 7295000, 4, 3.5, 3744, 2012, 'Coldwell Banker Realty', '/FL/Naples/299-Mermaids-Bight-34103/home/67544648', ['195/bigphoto/037/226035037_0.jpg', '195/bigphoto/037/226035037_9_0.jpg', '195/bigphoto/037/226035037_5_0.jpg']),
  H('Anchorage', 'AK', '99501', '1556 G St', 525000, 2, 1, 832, 1977, 'Jack White Real Estate', '/AK/Anchorage/1556-G-St-99501/home/131866096', ['270/bigphoto/542/26-12542_1_0.jpg', '270/bigphoto/542/26-12542_12_0.jpg', '270/bigphoto/542/26-12542_6_0.jpg']),
  H('Tulsa', 'OK', '74129', '2316 S 101st East Pl', 207000, 3, 2, 1495, 1972, 'Cochran & Co Realtors', '/OK/Tulsa/2316-S-101st-East-Pl-74129/home/74313243', ['164/bigphoto/967/2635967_2_0.jpg', '164/bigphoto/967/2635967_8_0.jpg', '164/bigphoto/967/2635967_10_0.jpg']),
  H('Santa Fe', 'NM', '87507', '4719 Las Plazuelas', 814000, 2, 2.5, 2504, 2016, 'Sotheby\'s Int. RE/Grant', '/NM/Santa-Fe/4719-Las-Plazuelas-87507/home/160432586', ['215/bigphoto/218/202604218_7_0.jpg', '215/bigphoto/218/202604218_8_0.jpg', '215/bigphoto/218/202604218_14_0.jpg']),
  H('New Orleans', 'LA', '70119', '1625 N Galvez St', 335000, 3, 2, 1575, 1932, 'Engel & Völkers New Orleans', '/LA/New-Orleans/1625-N-Galvez-St-70119/home/85422242', ['166/bigphoto/698/2575698_0.jpg', '166/bigphoto/698/2575698_7_0.jpg', '166/bigphoto/698/2575698_2_0.jpg']),
  H('Park City', 'UT', '84098', '9117 Upper Lando Ln', 3400000, 5, 4.5, 4735, 1997, 'Berkshire Hathaway HomeServices Utah Properties (Saddleview)', '/UT/Park-City/9117-Upper-Lando-Ln-84098/home/86380420', ['171/bigphoto/352/2188352_6.jpg', '171/bigphoto/352/2188352_9_6.jpg', '171/bigphoto/352/2188352_19_6.jpg']),
  H('Des Moines', 'IA', '50310', '4227 Northwest Dr', 238000, 3, 1.5, 1206, 1939, 'Realty ONE Group Impact', '/IA/Des-Moines/4227-Northwest-Dr-50310/home/124410380', ['233/bigphoto/182/750182_0.jpg', '233/bigphoto/182/750182_3_0.jpg', '233/bigphoto/182/750182_1_0.jpg']),
  H('Reno', 'NV', '89521', '13815 Kewanna Trl', 695000, 3, 2, 2280, 1973, 'Epique Realty', '/NV/Reno/13815-Kewanna-Trl-89521/home/60206001', ['155/bigphoto/571/260012571_5_0.jpg', '155/bigphoto/571/260012571_6_0.jpg', '155/bigphoto/571/260012571_12_0.jpg']),
  H('Biloxi', 'MS', '39530', '224 Oak St', 220000, 3, 2.5, 1996, 2012, 'Real Broker, LLC.', '/MS/Biloxi/224-Oak-St-39530/home/116054457', ['294/bigphoto/850/4163850_8.jpg', '294/bigphoto/850/4163850_1_8.jpg', '294/bigphoto/850/4163850_9_4.jpg']),
  H('Washington', 'DC', '20010', '1128 Park Rd NW', 1050000, 5, 4.5, 3757, 1913, 'Century 21 Redwood Realty', '/DC/Washington/1128-Park-Rd-NW-20010/home/10028400', ['235/bigphoto/870/DCDC2283870_1_2.jpg', '235/bigphoto/870/DCDC2283870_6_2.jpg', '235/bigphoto/870/DCDC2283870_2.jpg']),
  H('Louisville', 'KY', '40228', '6530 Oak Village Dr', 335000, 3, 2, 1400, null, 'Real Estate Go To', '/KY/Louisville/6530-Oak-Village-Dr-40228/home/174076804', ['185/bigphoto/558/1730558_0.jpg', '185/bigphoto/558/1730558_14_0.jpg', '185/bigphoto/558/1730558_8_0.jpg']),
  H('Jackson', 'WY', '83001', '9055/9105 N Snake River Dr', 10995000, 6, 3, 5552, 1992, 'Jackson Hole Sotheby\'s International Realty', '/WY/Jackson/9055-N-Snake-River-Dr-83001/home/136268232', ['606/bigphoto/443/26-2443_14_0.jpg', '606/bigphoto/443/26-2443_4_0.jpg', '606/bigphoto/443/26-2443_1_0.jpg']),
  H('Pittsburgh', 'PA', '15212', '1107 Brabec St', 235000, 4, 1.5, 1863, 1915, 'COLDWELL BANKER REALTY', '/PA/Pittsburgh/1107-Brabec-St-15212/home/74557005', ['162/bigphoto/088/1777088_0.jpg', '162/bigphoto/088/1777088_12_0.jpg', '162/bigphoto/088/1777088_6_0.jpg']),
  H('Greenville', 'SC', '29607', '40 Lockwood Ave', 600000, 4, 3, 2070, 1967, 'Briganti Properties', '/SC/Greenville/40-Lockwood-Ave-29607/home/60639871', ['178/bigphoto/281/1605281_0.jpg', '178/bigphoto/281/1605281_10_0.jpg', '178/bigphoto/281/1605281_6_0.jpg']),
  H('Sioux Falls', 'SD', '57104', '1501 W 9th St', 295000, 3, 2, 1870, 1900, 'Alpine Residential', '/SD/Sioux-Falls/1501-W-9th-St-57104/home/136661459', ['296/bigphoto/516/22607516_1_0.jpg', '296/bigphoto/516/22607516_12_0.jpg', '296/bigphoto/516/22607516_3_0.jpg']),
  H('Princeton', 'NJ', '08540', '38 Carter Rd', 1499000, 4, 2.5, 3152, 1971, 'RE/MAX First Realty', '/NJ/Princeton/38-Carter-Rd-08540/home/191450046', ['235/bigphoto/038/NJME2084038_3_0.jpg', '235/bigphoto/038/NJME2084038_24_0.jpg', '235/bigphoto/038/NJME2084038_13_0.jpg']),
  H('Wilmington', 'DE', '19808', '2409 Tapley Ln', 389900, 3, 1, 1625, 1953, 'Long & Foster Real Estate, Inc.', '/DE/Wilmington/2409-Tapley-Ln-19808/home/44884018', ['235/bigphoto/156/DENC2112156_1.jpg', '235/bigphoto/156/DENC2112156_4_1.jpg', '235/bigphoto/156/DENC2112156_2_1.jpg']),
  H('Minneapolis', 'MN', '55410', '5309 Xerxes Ave S', 490000, 3, 2, 2140, 1920, 'Kris Lindahl Real Estate', '/MN/Minneapolis/5309-Xerxes-Ave-S-55410/home/50099821', ['114/bigphoto/263/7151263_0.jpg', '114/bigphoto/263/7151263_8_0.jpg', '114/bigphoto/263/7151263_5_0.jpg']),
  H('Knoxville', 'TN', '37918', '4600 E Lincoln Cir', 399900, 3, 2, 1550, 1950, 'Realty Executives Associates', '/TN/Knoxville/4600-E-Lincoln-Cir-37918/home/102944415', ['177/bigphoto/295/1357295_0.jpg', '177/bigphoto/295/1357295_11_0.jpg', '177/bigphoto/295/1357295_3_0.jpg']),
  H('Ann Arbor', 'MI', '48103', '612 Burr Oak Dr', 569900, 3, 2.5, 2491, 1988, 'Howard Hanna Real Estate', '/MI/Ann-Arbor/612-Burr-Oak-Dr-48103/home/99305822', ['173/bigphoto/141/26052141_1.jpg', '173/bigphoto/141/26052141_3_1.jpg', '173/bigphoto/141/26052141_9_1.jpg']),
  ]),
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
  { ...F('JetBlue', 'BOS', 'Boston', 'DCA', 'Washington National', '2026-12-05', '9:20 AM', 'Economy', 'economy', 134, 'JetBlue A321LR (N4058J) at Boston.jpg', 'Tim', 'CC0'), gathered: '2026-10-05' }, // re-read 10/5: was $59
  { ...HT('The Plaza', 'New York, NY', '2026-12-16', 1, 'Lowest available room', 2786, 'The Plaza New York', 'The Plaza Hotel Manhattan NYC.jpg', 'Daniel Dimitrov', 'CC BY-SA 4.0'), gathered: '2026-10-05' }, // re-read 10/5: was $2,725
  F('Southwest', 'DEN', 'Denver', 'CUN', 'Cancún', '2027-01-09', '11:10 AM', 'Economy', 'economy', 328, 'Southwest Boeing 737-8 MAX N8847Q BWI MD2.jpg', 'Acroterion', 'CC BY-SA 4.0'),
  F('JetBlue', 'JFK', 'New York', 'LHR', 'London Heathrow', '2026-12-03', '9:26 AM', 'Mint (business)', 'business class', 2559, 'JetBlue A321LR (N4058J) at Boston.jpg', 'Tim', 'CC0'),
  HT('Hotel del Coronado', 'Coronado, CA', '2026-12-17', 1, 'Victorian King', 533, 'Hotel del Coronado', 'Hotel del Coronado 10 2019-04-16.jpg', 'FASTILY', 'CC BY-SA 4.0'),
  F('Qantas', 'SFO', 'San Francisco', 'SYD', 'Sydney', '2027-01-20', '8:45 PM', 'Business', 'business class', 5650, 'Qantas - VH-ZNF - Boeing 787-9 Dreamliner - QF6027 - VGHS.jpg', 'Md Shaifuzzaman Ayon', 'CC BY-SA 4.0'),
  // Restock, read 2026-10-03 (to 2026-11-30).
  ...READ('2026-10-03', [
  F('Frontier', 'LAS', 'Las Vegas', 'LAX', 'Los Angeles', '2026-12-09', '2:06 PM', 'Economy', 'economy', 19, 'Frontier Airbus A320neo N354FR BWI MD2.jpg', 'Acroterion', 'CC BY-SA 4.0'),
  HT('Waldorf Astoria New York', 'New York, NY', '2026-12-15', 1, 'Lowest available room', 2328, 'Waldorf Astoria New York', 'Waldorf-Astoria Park Avenue Entrance.jpg', 'Hennem08', 'CC BY-SA 3.0'),
  F('Sun Country', 'MSP', 'Minneapolis', 'LAS', 'Las Vegas', '2027-01-13', '7:05 AM', 'Economy', 'economy', 89, 'Sun Country Airlines, Boeing 737-800, N804SY.jpg', 'Eddie Maloney', 'CC BY-SA 2.0'),
  F('Air France', 'JFK', 'New York', 'CDG', 'Paris', '2027-01-19', '4:30 PM', 'La Première (first)', 'first class', 18089, 'Air France Boeing 777-300ER F-GSQM IAD VA2.jpg', 'Acroterion', 'CC BY-SA 4.0'),
  HT('Excalibur Hotel & Casino', 'Las Vegas, NV', '2027-01-12', 1, 'Lowest available room', 61, 'Excalibur Hotel Las Vegas', 'Hotel Excalibur Las Vegas.jpg', 'ArticCynda', 'CC BY-SA 4.0'),
  F('Icelandair', 'BOS', 'Boston', 'KEF', 'Reykjavik', '2027-02-11', '7:50 PM', 'Economy', 'economy', 456, 'Berlin Brandenburg Airport Icelandair Boeing 737-8 MAX TF-ICY (DSC07832).jpg', 'MarcelX42', 'CC BY-SA 4.0'),
  F('Etihad', 'JFK', 'New York', 'AUH', 'Abu Dhabi', '2027-02-10', '3:00 PM', 'Business', 'business class', 4933, 'Etihad Boeing 787-9 A6-BNI IAD VA2.jpg', 'Acroterion', 'CC BY-SA 4.0'),
  F('Jetstar', 'SYD', 'Sydney', 'MEL', 'Melbourne', '2027-02-10', '6:00 AM', 'Economy', 'economy', 71, 'Jetstar Airways (VH-VFV) Airbus A320-232 at Darwin, Oct 2025 01.jpg', 'DaHuzyBru', 'CC BY-SA 4.0'),
  HT('The Savoy', 'London, England', '2027-02-04', 2, 'Lowest available room', 1854, 'The Savoy London', "Entrance to the Savoy Hotel, London - geograph.org.uk - 2281522.jpg", "Anthony O'Neil", 'CC BY-SA 2.0'),
  F('British Airways', 'LHR', 'London Heathrow', 'CDG', 'Paris', '2027-01-12', '1:00 PM', 'Economy', 'economy', 106, 'British Airways Airbus A320-232 G-EUUA at Heathrow T5.jpg', 'Jared Preston', 'CC BY-SA 3.0'),
  F('ANA', 'JFK', 'New York', 'HND', 'Tokyo Haneda', '2027-02-17', '12:55 AM', 'First class', 'first class', 15661, 'All Nippon Airways, Boeing 777-300ER JA780A NRT (37701383722).jpg', 'Masakatsu Ukon', 'CC BY-SA 2.0'),
  HT('El Tovar Hotel', 'Grand Canyon, AZ', '2027-01-26', 1, 'Lowest available room', 157, 'El Tovar Hotel Grand Canyon', 'El Tovar Hotel s-aspect.JPG', 'Wolfgang Moroder', 'CC BY-SA 3.0'),
  F('Aer Lingus', 'BOS', 'Boston', 'DUB', 'Dublin', '2027-03-02', '5:15 PM', 'Economy', 'economy', 295, 'Aer Lingus Airbus A330-300 EI-FNH at Dublin May 2025 2.jpg', '4300streetcar', 'CC BY 4.0'),
  F('Cathay Pacific', 'SFO', 'San Francisco', 'HKG', 'Hong Kong', '2027-01-28', '11:25 AM', 'Business', 'business class', 3715, 'Cathay Pacific Airbus A350-1000 B-LXB.jpg', 'Melv_L - MACASR', 'CC BY-SA 2.0'),
  F('Delta', 'ATL', 'Atlanta', 'MCO', 'Orlando', '2026-12-15', '11:05 AM', 'Economy', 'economy', 69, 'Delta Boeing 757-200 N699DL BWI MD1.jpg', 'Acroterion', 'CC BY-SA 4.0'),
  HT("Disney's Grand Floridian Resort & Spa", 'Walt Disney World, FL', '2027-01-12', 1, 'Lowest available room', 978, "Disney's Grand Floridian Resort", "Disney's Grand Floridian Resort & Spa 1.jpg", 'Sixflashphoto', 'CC BY-SA 4.0'),
  F('WestJet', 'YYZ', 'Toronto', 'YVR', 'Vancouver', '2027-01-18', '10:20 PM', 'Economy', 'economy', 205, 'WestJet Boeing 737-800 C-GJWS departing Boston June 2025.jpg', '4300streetcar', 'CC BY 4.0'),
  F('Qatar Airways', 'JFK', 'New York', 'DOH', 'Doha', '2027-01-14', '10:30 AM', 'Business', 'business class', 9560, 'Qatar Airways Airbus A350-1000.jpg', 'Juke Schweizer', 'CC BY-SA 4.0'),
  HT('Motel 6 Flagstaff Butler', 'Flagstaff, AZ', '2027-01-20', 1, 'Lowest available room', 47, 'Motel 6 Flagstaff', 'Motel 6 Flagstaff (35997189591).jpg', 'trentv11182', 'CC BY 2.0'),
  F('Air New Zealand', 'LAX', 'Los Angeles', 'AKL', 'Auckland', '2027-02-16', '8:00 PM', 'Economy', 'economy', 527, 'Air New Zealand Boeing 787 ZK-NZG, PER September 2025.jpg', 'DaHuzyBru', 'CC BY-SA 4.0'),
  HT('The Beverly Hills Hotel', 'Beverly Hills, CA', '2027-01-21', 2, 'Lowest available room', 3071, 'The Beverly Hills Hotel', 'Beverly Hills Hotel, front driveway and entrance.jpg', 'Los Angeles Times', 'CC BY 4.0'),
  F('JAL', 'HND', 'Tokyo Haneda', 'CTS', 'Sapporo', '2027-02-05', '8:40 PM', 'Economy', 'economy', 87, 'Japan Airlines Airbus A350-900 JA01XJ - 1.jpg', 'Melvin Loi', 'CC BY-SA 2.0'),
  F('United', 'EWR', 'Newark', 'SFO', 'San Francisco', '2027-02-01', '9:00 AM', 'Business', 'business class', 1509, 'United Airlines Boeing 787-9 Dreamliner (33047122154).jpg', 'Bill Abbott', 'CC BY-SA 2.0'),
  F('Aeromexico', 'JFK', 'New York', 'MEX', 'Mexico City', '2027-01-22', '7:04 AM', 'Economy', 'economy', 254, 'Aeromexico Boeing 737-8 MAX N110JS IAD VA3.jpg', 'Acroterion', 'CC BY-SA 4.0'),
  F('Emirates', 'DXB', 'Dubai', 'LHR', 'London Heathrow', '2027-01-27', '3:10 AM', 'First class', 'first class', 8153, 'Emirates Airbus A380-861 A6-EER MUC 2015 04.jpg', 'Julian Herzog', 'CC BY 4.0'),
  HT('The Stanley Hotel', 'Estes Park, CO', '2026-12-09', 1, 'Lowest available room', 187, 'The Stanley Hotel Estes Park', 'Stanley Hotel Estes Park CO.jpg', 'Hustvedt', 'CC BY-SA 3.0'),
  F('Turkish Airlines', 'IAD', 'Washington Dulles', 'IST', 'Istanbul', '2027-02-02', '1:30 PM', 'Economy', 'economy', 691, 'Turkish Airlines Boeing 777-300ER TC-JJJ MD1.jpg', 'Acroterion', 'CC BY-SA 4.0'),
  HT('Taj Lake Palace', 'Udaipur, India', '2027-01-22', 2, 'Lowest available room', 5661, 'Taj Lake Palace Udaipur', 'Taj Lake Palace Udaipur from City Palace.jpg', 'Navneet Sharma', 'CC BY-SA 4.0'),
  F('JetBlue', 'FLL', 'Fort Lauderdale', 'SJU', 'San Juan', '2026-12-10', '8:00 AM', 'Economy', 'economy', 104, 'JetBlue A321LR (N4058J) at Boston.jpg', 'Tim', 'CC0'),
  F('SWISS', 'JFK', 'New York', 'ZRH', 'Zurich', '2027-03-04', '4:25 PM', 'Business', 'business class', 3469, 'Swiss Airbus A330-300 HB-JHM IAD VA1.jpg', 'Acroterion', 'CC BY-SA 4.0'),
  HT('Icehotel', 'Jukkasjärvi, Sweden', '2027-02-03', 1, 'Lowest available room', 403, 'Icehotel Jukkasjarvi Sweden', 'Room Icehotel Jukkasjärvi 2012.JPG', "L'Astorina", 'CC BY-SA 3.0'),
  F('Allegiant', 'LAS', 'Las Vegas', 'BLI', 'Bellingham', '2027-01-08', '4:40 PM', 'Economy', 'economy', 71, 'Allegiant Air Airbus A320-214 N254NV @IND.jpg', 'AVA Navigate', 'CC BY-SA 4.0'),
  HT('Fairmont Chateau Lake Louise', 'Lake Louise, Alberta', '2027-01-15', 2, 'Lowest available room', 1464, 'Fairmont Chateau Lake Louise', 'The Fairmont Chateau Lake Louise. (9633055517).jpg', 'Bernard Spragg', 'CC0'),
  F('Southwest', 'MDW', 'Chicago Midway', 'LAS', 'Las Vegas', '2027-01-25', '10:05 AM', 'Economy', 'economy', 312, 'Southwest Boeing 737-8 MAX N8847Q BWI MD2.jpg', 'Acroterion', 'CC BY-SA 4.0'),
  F('Lufthansa', 'JFK', 'New York', 'MUC', 'Munich', '2027-02-18', '5:30 PM', 'First class', 'first class', 17584, 'Lufthansa Airbus A380-800 D-AIML MD1.jpg', 'Acroterion', 'CC BY-SA 4.0'),
  F('United', 'ORD', "Chicago O'Hare", 'DEN', 'Denver', '2027-02-03', '2:24 PM', 'Economy', 'economy', 148, 'United Airlines Boeing 787-9 Dreamliner (33047122154).jpg', 'Bill Abbott', 'CC BY-SA 2.0'),
  HT('Raffles Singapore', 'Singapore', '2027-03-02', 1, 'Lowest available room', 1018, 'Raffles Hotel Singapore', 'Front facade of Raffles Hotel, Singapore, from southeast.jpg', 'Daniel Case', 'CC BY-SA 4.0'),
  F('Fiji Airways', 'LAX', 'Los Angeles', 'NAN', 'Nadi', '2027-03-03', '10:35 PM', 'Economy', 'economy', 429, 'Fiji Airways (DQ-FAM) Airbus A350-941 landing at Sydney Airport (3).jpg', 'Bidgee', 'CC BY-SA 3.0 au'),
  F('United', 'SFO', 'San Francisco', 'SIN', 'Singapore', '2027-02-23', '10:35 AM', 'Polaris (business)', 'business class', 4398, 'United Airlines Boeing 787-9 Dreamliner (33047122154).jpg', 'Bill Abbott', 'CC BY-SA 2.0'),
  F('Korean Air', 'LAX', 'Los Angeles', 'ICN', 'Seoul Incheon', '2027-03-09', '11:00 AM', 'Economy', 'economy', 709, 'HL7642 Boeing 747-8 of Korean Air at LAX (2026).jpg', 'Alexis Doine', 'CC0'),
  HT('Stein Eriksen Lodge Deer Valley', 'Park City, UT', '2027-01-14', 4, 'Lowest available room', 8785, 'Stein Eriksen Lodge Deer Valley', 'Stein Eriksen Lodge.jpg', 'KylieKennedy', 'CC BY-SA 4.0'),
  F('American', 'LAX', 'Los Angeles', 'HNL', 'Honolulu', '2027-01-11', '3:21 PM', 'First class', 'first class', 746, 'American Airlines Boeing 777-300ER (cropped).jpg', 'Venkat Mangudi', 'CC BY 2.0'),
  HT('Fontainebleau Miami Beach', 'Miami Beach, FL', '2027-02-12', 3, 'Lowest available room', 2122, 'Fontainebleau Miami Beach', 'Miami Beach - Hotel Fontainebleau 01.jpg', 'Tichnor Brothers, Inc.', 'Public domain'),
  HT('Emirates Palace Mandarin Oriental', 'Abu Dhabi, UAE', '2026-12-12', 2, 'Lowest available room', 1220, 'Emirates Palace Mandarin Oriental Abu Dhabi', 'Emirates Palace @ Abu Dhabi (15856763830).jpg', 'Guilhem Vellut', 'CC BY 2.0'),
  F('Virgin Atlantic', 'JFK', 'New York', 'LHR', 'London Heathrow', '2027-02-24', '8:00 AM', 'Upper Class (business)', 'business class', 2409, 'Airbus A350-1000 - Virgin Atlantic Airbus - G-VPRD - 02.jpg', 'Oleg Yunakov', 'CC BY-SA 4.0'),
  F('American', 'MIA', 'Miami', 'SCL', 'Santiago', '2027-01-15', '10:35 PM', 'Business', 'business class', 3789, 'American Airlines Boeing 777-300ER (cropped).jpg', 'Venkat Mangudi', 'CC BY 2.0'),
  HT('Atlantis The Royal', 'Dubai, UAE', '2027-01-08', 2, 'Lowest available room', 3360, 'Atlantis The Royal Dubai', 'Atlantis The Royal, Dubai 1.jpg', 'EditQ', 'CC0'),
  ]),
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
  // Restock, read 2026-10-03 (to 2026-11-30).
  ...READ('2026-10-03', [
  RT('Eames Lounge Chair and Ottoman', 'Herman Miller', 'store.hermanmiller.com', 9395, 'https://store.hermanmiller.com/living-room-furniture-lounge-chairs-ottomans/eames-lounge-chair-and-ottoman/5667.html', 'Eameslounch.jpg', 'Sonett72', 'public domain'),
  AU('Verger avec cyprès (Orchard with Cypresses)', 'Vincent van Gogh', '1888', "Christie's", 'New York', '2022-11-09', 11718000000, 'https://en.wikipedia.org/wiki/Orchard_with_Cypresses', 'Vincent Willem van Gogh 077.jpg', pd),
  AU('Head of a Bear, a silverpoint drawing', 'Leonardo da Vinci', 'about 1480', "Christie's", 'London', '2021-07-08', 1220000000, 'https://artfixdaily.com/artwire/release/1034-tiny-bear-study-sets-record-for-leonardo-da-vinci-drawing-at-122-', 'Da Vinci - Head of a Bear.jpg', pd),
  AU('1794 Flowing Hair silver dollar, the finest known', 'U.S. Mint', '1794', "Stack's Bowers Galleries", 'New York', '2013-01-24', 1001687500, 'https://www.pcgs.com/news/stacks-bowers-world-record-1794-silver-dollar', 'Flowing hair dollar.jpeg', pd),
  RT('Martin D-28 Acoustic Guitar', 'C. F. Martin & Co.', 'martinguitar.com', 3500, 'https://www.martinguitar.com/guitars/standard-series/D-28.html', 'Martin D-28 Acoustic Guitar.jpg', 'Niranjan Arminius', 'CC BY-SA 4.0'),
  AU('Massacre of the Innocents', 'Peter Paul Rubens', 'about 1611', "Sotheby's", 'London', '2002-07-10', 7670000000, 'https://en.wikipedia.org/wiki/Massacre_of_the_Innocents_(Rubens)', 'Rubens - Massacre of the Innocents - Art Gallery of Ontario 2.jpg', pd),
  AU('The Lady Blunt Stradivarius violin', 'Antonio Stradivari', '1721', 'Tarisio', 'online sale, London', '2011-06-20', 1590000000, 'https://en.wikipedia.org/wiki/Lady_Blunt_Stradivarius', 'Lady Blunt top.jpg', (f) => credit('Tarisio Auctions', 'CC BY-SA 3.0', f)),
  AU('Portrait of a Young Man Holding a Roundel', 'Sandro Botticelli', 'about 1480', "Sotheby's", 'New York', '2021-01-28', 9218400000, 'https://en.wikipedia.org/wiki/Portrait_of_a_Young_Man_Holding_a_Roundel', 'Botticelli - Portrait of a Young Man Holding a Roundel.jpg', pd),
  RT('Royal Copenhagen Blue Fluted Plain Plate, 27 cm', 'Royal Copenhagen', 'royalcopenhagen.com', 200, 'https://www.royalcopenhagen.com/en-us/products/blue-fluted-plain-plate-27-cm-1017202', 'Blaa riflet.JPEG', 'Sindre Skrede', 'CC BY 2.5'),
  AU('Sue, a Tyrannosaurus rex skeleton', 'Tyrannosaurus rex fossil, discovered 1990', 'Late Cretaceous', "Sotheby's", 'New York', '1997-10-04', 836250000, 'https://en.wikipedia.org/wiki/Sue_(dinosaur)', 'FMNH SUE Trex.jpg', (f) => credit('Evolutionnumber9', 'CC BY-SA 4.0', f)),
  AU('1955 Mercedes-Benz 300 SLR Uhlenhaut Coupé', 'Mercedes-Benz', '1955', "RM Sotheby's", 'Stuttgart', '2022-05-05', 14300000000, 'https://newsinfo.inquirer.net/1600040/rm-sothebys-1955-mercedes-sells-for-135-million-euros-worlds-most-expensive-car', 'Mercedes-Benz 300 SLR Uhlenhaut Coupe - Petersen Automotive Museum - Los Angeles.jpg', (f) => credit('Guywelch2000', 'CC BY 4.0', f)),
  AU('Portrait of Dr. Gachet', 'Vincent van Gogh', '1890', "Christie's", 'New York', '1990-05-15', 8250000000, 'https://en.wikipedia.org/wiki/Portrait_of_Dr._Gachet', 'Portrait of Dr. Gachet.jpg', pd),
  RT('Manolo Blahnik Hangisi Satin Jewel Buckle Pumps', 'Manolo Blahnik', 'manoloblahnik.com', 1450, 'https://www.manoloblahnik.com/us/hangisi-107740.html', 'Red Manolo Blahnik Hangisi pumps.jpg', 'sunny yoyo', 'CC BY-SA 2.0'),
  AU('Blumenwiese (Blooming Meadow)', 'Gustav Klimt', 'about 1908', "Sotheby's", 'New York', '2025-11-18', 8600000000, 'https://news.artnet.com/market/10-top-lots-auction-2025-2723777', 'Gustav Klimt - Blumenwiese (ca. 1908).jpg', pd),
  AU('T206 Honus Wagner baseball card, graded SGC 3', 'American Tobacco Company', '1909–11', 'Robert Edward Auctions', 'Chester, New Jersey', '2021-08-16', 660629600, 'https://www.antiquesandthearts.com/honus-wagner-achieves-6-6-million-record-baseball-card-price', 'Honus wagner t206 baseball card.jpg', pd),
  AU('Birch Forest', 'Gustav Klimt', '1903', "Christie's", 'New York', '2022-11-09', 10458500000, 'https://galeriemagazine.com/christies-paul-g-allen-results/', 'Gustav Klimt, Birch Forest, 1903 - Paul G. Allen Collection.jpg', pd),
  AU('British Guiana 1c Magenta, a single stamp', 'British Guiana', '1856', "Sotheby's", 'New York', '2021-06-08', 830700000, 'https://en.wikipedia.org/wiki/British_Guiana_1c_magenta', 'British Guiana 1856 1c magenta stamp.jpg', pd),
  RT('Leica Q3 Compact Camera', 'Leica', 'leicacamerausa.com', 7350, 'https://leicacamerausa.com/leica-q3-black.html', 'Leica Q3.jpg', 'Peachyeung316', 'CC BY-SA 4.0'),
  RT('Rimowa Hybrid Cabin Suitcase', 'Rimowa', 'rimowa.com', 1200, 'https://www.rimowa.com/us/en/luggage/colour/black/cabin/88353631.html', 'Rimowa Hybrid Cabin blue, 2019.jpg', 'Stefanhaler.wiki', 'CC BY-SA 4.0'),
  AU('Les Poseuses, Ensemble (petite version)', 'Georges Seurat', '1888', "Christie's", 'New York', '2022-11-09', 14924000000, 'https://galeriemagazine.com/christies-paul-g-allen-results/', 'Georges seurat les poseuses ensemble100119).jpg', pd),
  AU('1962 Ferrari 250 GTO, chassis 3413 GT', 'Ferrari', '1962', "RM Sotheby's", 'Monterey, California', '2018-08-26', 4840500000, 'https://www.supercars.net/blog/ferrari-250-gto-sets-record-in-monterey/', 'Ferrari 250 GTO 3413GT at RM Sothebys Auction Monterey 2018.jpg', (f) => credit('Prova MO', 'CC BY-SA 4.0', f)),
  AU('1964 Ferrari 250 LM, winner of the 1965 24 Hours of Le Mans', 'Ferrari', '1964', "RM Sotheby's", 'Paris', '2025-02-05', 3634496000, 'https://en.wikipedia.org/wiki/List_of_most_expensive_cars_sold_at_auction', 'Ferrari 250 LM 5893 at PB 2022.jpg', (f) => credit('Prova MO', 'CC BY-SA 4.0', f)),
  AU('Young Lion Resting, a chalk drawing', 'Rembrandt van Rijn', 'about 1638–42', "Sotheby's", 'New York', '2026-02-04', 1786000000, 'https://www.theleidencollection.com/news-media/rembrandt-drawing-roars-to-17-9-million-at-auction/', 'Young Lion Resting.jpg', pd),
  RT('Leica M11 Camera Body, Glossy Black', 'Leica', 'leicacamerausa.com', 10400, 'https://leicacamerausa.com/leica-m11-in-glossy-black-finish.html', 'Leica M11 with Summicron-M 50mm F2 lens.jpg', 'Peachyeung316', 'CC BY-SA 4.0'),
  RT('Jaeger-LeCoultre Reverso Tribute Monoface Small Seconds, Steel', 'Jaeger-LeCoultre', 'jaeger-lecoultre.com', 11700, 'https://www.jaeger-lecoultre.com/us-en/watches/reverso/reverso-tribute/reverso-tribute-monoface-small-seconds-stainless-steel-q397848j', 'JLC Reverso Tribute Monoface.jpg', 'Provo rossi', 'CC BY-SA 4.0'),
  AU('Laboureur dans un champ (Ploughman in a Field)', 'Vincent van Gogh', '1889', "Christie's", 'New York', '2017-11-13', 8130000000, 'https://vietnamnews.vn/life-style/417500/81-3-million-van-gogh-kicks-off-ny-art-auction-season.html', "Laboureur dans un champ - van Gogh (1889-1890, Christie's).jpg", pd),
  AU('Magna Carta, the 1297 issue', 'King Edward I', '1297', "Sotheby's", 'New York', '2007-12-18', 2132100000, 'https://www.aljazeera.com/news/2007/12/19/magna-carta-copy-sold-for-21m', 'Magna Carta (1297 version with seal, owned by David M Rubenstein).jpg', pd),
  AU("Shakespeare's First Folio", 'William Shakespeare', '1623', "Christie's", 'New York', '2020-10-14', 997800000, 'https://www.smithsonianmag.com/smart-news/shakespeares-first-folio-sells-ten-million-dollars-180976074/', 'William Shakespeare - First Folio 1623.jpg', pd),
  AU('Nu couché (Reclining Nude)', 'Amedeo Modigliani', '1917–18', "Christie's", 'New York', '2015-11-09', 17040500000, 'https://en.wikipedia.org/wiki/Nu_couch%C3%A9', 'Modigliani - Nu couché.jpg', pd),
  AU("David Gilmour's Black Strat, a 1969 Fender Stratocaster", 'Fender', '1969', "Christie's", 'New York', '2019-06-20', 397500000, 'https://guitar.com/news/gear-news/david-gilmour-black-strat-auction-christies', 'Black Strat.jpg', (f) => credit('TheTankman', 'CC BY-SA 4.0', f)),
  RT('Lalique Bacchantes Vase, Clear Crystal', 'Lalique', 'lalique.com', 6100, 'https://us.lalique.com/products/iconic-bacchantes-vase-clear-1220000', 'Vase bacchantes Lalique 1606387.jpg', 'Gérald Garitan', 'CC BY-SA 4.0'),
  RT('Christian Louboutin Kate 100 mm Pump, Black Patent Leather', 'Christian Louboutin', 'christianlouboutin.com', 945, 'https://us.christianlouboutin.com/us_en/kate-black-3191411bk01.html', 'KATE 100 PATENT.jpg', 'Jean Rouseau', 'CC BY-SA 4.0'),
  AU("Kurt Cobain's MTV Unplugged guitar, a 1959 Martin D-18E", 'C. F. Martin & Co.', '1959', "Julien's Auctions", 'Los Angeles', '2020-06-20', 601000000, 'https://www.rollingstone.com/music/music-news/kurt-cobain-unplugged-guitar-auction-1018229/', "Kurt Cobain's Martin D-18E guitar, RCM Museum.jpg", (f) => credit('The wub', 'CC BY-SA 4.0', f)),
  AU('Dame mit Fächer (Lady with a Fan)', 'Gustav Klimt', '1917–18', "Sotheby's", 'London', '2023-06-27', 10840000000, 'https://en.wikipedia.org/wiki/Lady_with_a_Fan_(Klimt)', 'Gustav Klimt - Dame mit Fächer.jpeg', pd),
  RT('Brompton C Line Folding Bike, starting price', 'Brompton', 'brompton.com', 1650, 'https://us.brompton.com/c/bikes/c-line', 'Brompton bicycle half folded and loaded.jpg', 'Bossphotography', 'CC0'),
  AU('Rome, from Mount Aventine', 'J. M. W. Turner', '1835', "Sotheby's", 'London', '2014-12-03', 4740000000, 'https://www.guinnessworldrecords.com/world-records/381754-most-expensive-painting-by-turner-sold-at-auction', 'Rome, From Mount Aventine.jpg', pd),
  AU('The Rothschild Prayerbook, an illuminated book of hours', 'Flemish illuminators', 'about 1505–10', "Christie's", 'New York', '2014-01-29', 1360000000, 'https://paulfrasercollectibles.com/blogs/books-manuscripts/rothschild-prayerbook-breaks-record-for-illuminated-manuscript', 'Rothschild Prayerbook 2.jpg', pd),
  AU('NWA 16788, the largest piece of Mars on Earth', 'Martian meteorite, 54 pounds', 'from Mars', "Sotheby's", 'New York', '2025-07-16', 530000000, 'https://edition.cnn.com/2025/07/16/science/mars-rock-auction-sold', 'NWA 16788 shergottite.jpg', (f) => credit('Weibao Hsu', 'CC0', f)),
  AU('The Bay Psalm Book, the first book printed in British North America', 'Printed by Stephen Daye', '1640', "Sotheby's", 'New York', '2013-11-26', 1416500000, 'https://www.guinnessworldrecords.com/world-records/most-expensive-book-sold-at-auction', 'Bay Psalm Book title page.jpg', pd),
  AU('1954 Mercedes-Benz W 196 R Streamliner, a Grand Prix car', 'Mercedes-Benz', '1954', "RM Sotheby's", 'Stuttgart', '2025-02-01', 5391737000, 'https://www.magnetomagazine.com/articles/mercedes-benz-w-196-r-streamliner-becomes-most-valuable-grand-prix-race-car-ever-sold/', 'A 1954 Mercedes W196 on display at the Indianapolis Motor Speedway Hall of Fame and Museum.jpg', (f) => credit('Doug4422', 'CC BY-SA 3.0', f)),
  AU('Waldabhang bei Unterach am Attersee (Forest Slope in Unterach on the Attersee)', 'Gustav Klimt', '1916', "Sotheby's", 'New York', '2025-11-18', 6830000000, 'https://news.artnet.com/market/10-top-lots-auction-2025-2723777', 'Gustav Klimt - Waldabhang bei Unterach am Attersee (1916).jpg', pd),
  RT('Tudor Black Bay 54, 37 mm, Steel Bracelet', 'Tudor', 'tudorwatch.com', 4725, 'https://www.tudorwatch.com/en/watches/black-bay-54/m79000n-0001', 'Tudor Black Bay 54 ref. m79000n-0001.jpg', 'EMore98', 'CC BY-SA 4.0'),
  AU('Codex Sassoon, a near-complete Hebrew Bible', 'Scribe unknown', '10th century', "Sotheby's", 'New York', '2023-05-17', 3810000000, 'https://www.jns.org/news/tel-aviv-anu-museum-of-the-jewish-people-buys-codex-sassoon-for-38-1-million', 'Page from Codex Sassoon 1053.png', pd),
  AU('La Montagne Sainte-Victoire', 'Paul Cézanne', '1888–90', "Christie's", 'New York', '2022-11-09', 13779000000, 'https://galeriemagazine.com/christies-paul-g-allen-results/', 'Montagne Sainte-Victoire, par Paul Cézanne 114.jpg', pd),
  AU('Composition with Large Red Plane, Bluish Gray, Yellow, Black and Blue', 'Piet Mondrian', '1922', "Christie's", 'New York', '2025-05-12', 4760000000, 'https://news.artnet.com/market/len-riggios-mondrian-christies-auction-2641657', 'Piet Mondriaan - Composition with large red plane, bluish gray, yellow, black, and blue - B144 - Piet Mondrian, catalogue raisonné.jpg', pd),
  AU('Romans parisiens (Piles of Parisian Novels and Roses in a Glass)', 'Vincent van Gogh', '1887', "Sotheby's", 'New York', '2025-11-20', 6270000000, 'https://finebooksmagazine.com/news/vincent-van-goghs-still-life-romans-parisiens-sold-63m', 'Van Gogh - Stillleben mit französischen Romanen.jpeg', pd),
  AU('The Man of Sorrows', 'Sandro Botticelli', 'about 1500–10', "Sotheby's", 'New York', '2022-01-27', 4540000000, 'https://en.wikipedia.org/wiki/The_Man_of_Sorrows_(Botticelli)', 'Botticelli - Man of Sorrows.jpg', pd),
  AU("The Rising Squall, Hot Wells, from St. Vincent's Rock, Bristol", 'J. M. W. Turner', '1792', "Sotheby's", 'London', '2025-07-02', 260000000, 'https://news.artnet.com/market/turner-rediscovered-masterpiece-auction-2653461', "The Rising Squall, Hot Wells, from St Vincent's Rock, Bristol).jpg", pd),
  AU('Maternité II', 'Paul Gauguin', '1899', "Christie's", 'New York', '2022-11-09', 10573000000, 'https://galeriemagazine.com/christies-paul-g-allen-results/', 'Paul Gauguin - Maternité II (1899).jpg', pd),
  ]),
];

const START = '2026-10-01'; // opened a day early, same day as Pricer (owner, 2026-10-01)
// Boards are PUBLISHED only through END. Rows past it stay banked here for the next
// top-up, so a perishable price (a listing, a fare) is re-read before it ships rather
// than going live weeks after it was read (owner, 2026-10-07: stock to Oct 31).
const END = '2026-10-31';
const banks = { dealer: DEALER, realtor: REALTOR, agent: AGENT, curator: CURATOR };
const HEAD = {
  dealer: 'Dealer: one vehicle a day at its maker\'s starting MSRP, read on the maker\'s own site on `gathered`.',
  realtor: 'Realtor: one home for sale a day at its asking price on the listing, read on `gathered`. Photos are the listing\'s own, credited to the brokerage and linked back (owner, 2026-10-01). The address is hidden until the reveal.',
  agent: 'Agent: one trip a day, a named flight (airline, day, date, departure, cabin) or a hotel night, at the fare Google quoted on `gathered`, taxes and fees in.',
  curator: 'Curator: one luxury piece a day, an auction result with buyer\'s premium (dated by `sale`) or a luxury list price read on `gathered`.',
};
for (const [key, rows] of Object.entries(banks)) {
  const out = dated(key, rows, START).filter((b) => b.live <= END);
  fs.mkdirSync(`app/${key}`, { recursive: true });
  fs.writeFileSync(`app/${key}/puzzles.js`,
    `// ${HEAD[key]}\n// Generated by scripts/build-price-banks.mjs; checked by scripts/verify-price-banks.mjs.\n// price is INTEGER CENTS.\n\nexport const PUZZLES = ${JSON.stringify(out, null, 2)};\n`);
  console.log(key, out.length, out[0].live, out.at(-1).live);
}
