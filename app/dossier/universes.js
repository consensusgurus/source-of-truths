// Universe data for Dossier, the daily attribute-feedback guessing game.
//
// A universe is a closed list. Every row carries the same five attributes;
// 'num' attributes answer higher / lower, 'cat' attributes answer match / no.
// EVERY VALUE IS A FROZEN FACT: nothing here can change after it is written
// (no populations, no current rankings, no present-tense superlatives).
//
// presidents: one row per PERSON. Cleveland is filed under his first number
//   (22) and Trump under 45. `party` is the party the person belonged to on
//   first taking office: Washington had none, Tyler was elected on the Whig
//   ticket, Andrew Johnson was a Democrat elected on the National Union
//   ticket and is filed Democratic. `born` is the state of birth by today's
//   borders (Jackson: South Carolina, the conventional answer for the
//   Waxhaws). `age` is whole years on first taking office.
// elements: all 118. `block` and `period` follow the standard table. `family`
//   follows the common ten-family convention (alkali metal, alkaline earth
//   metal, lanthanide, actinide, transition metal, post-transition metal,
//   metalloid, reactive nonmetal, halogen, noble gas), with astatine a
//   halogen and polonium a post-transition metal. `state` is at room
//   temperature; elements 104 and up have no measured state, read 'unknown',
//   and are never answers. Only `easy` elements are answers.
// states: `year` admitted to the Union (ratification for the first
//   thirteen); `region` is the Census Bureau region; `borders` counts states
//   sharing a land or river border, a corner touch included (Four Corners),
//   a border that runs only through a lake or a sound excluded; `area` is
//   the rank by total area; `coast` is the ocean or gulf a state fronts,
//   else Great Lakes, else none (Florida fronts both and reads
//   'Atlantic and Gulf'; New York is filed Atlantic).
//
// scripts/verify-dossier.mjs checks shape, types and that no two rows of a
// universe agree on all five attributes.

const P = (n, name, party, born, year, age, easy, alt) => ({ name, n, party, born, year, age, ...(easy ? { easy: true } : {}), ...(alt ? { alt } : {}) });
const presidents = [
  P(1, 'George Washington', 'None', 'Virginia', 1789, 57, 1),
  P(2, 'John Adams', 'Federalist', 'Massachusetts', 1797, 61, 1),
  P(3, 'Thomas Jefferson', 'Democratic-Republican', 'Virginia', 1801, 57, 1),
  P(4, 'James Madison', 'Democratic-Republican', 'Virginia', 1809, 57, 1),
  P(5, 'James Monroe', 'Democratic-Republican', 'Virginia', 1817, 58),
  P(6, 'John Quincy Adams', 'Democratic-Republican', 'Massachusetts', 1825, 57),
  P(7, 'Andrew Jackson', 'Democratic', 'South Carolina', 1829, 61, 1),
  P(8, 'Martin Van Buren', 'Democratic', 'New York', 1837, 54),
  P(9, 'William Henry Harrison', 'Whig', 'Virginia', 1841, 68),
  P(10, 'John Tyler', 'Whig', 'Virginia', 1841, 51),
  P(11, 'James K. Polk', 'Democratic', 'North Carolina', 1845, 49),
  P(12, 'Zachary Taylor', 'Whig', 'Virginia', 1849, 64),
  P(13, 'Millard Fillmore', 'Whig', 'New York', 1850, 50),
  P(14, 'Franklin Pierce', 'Democratic', 'New Hampshire', 1853, 48),
  P(15, 'James Buchanan', 'Democratic', 'Pennsylvania', 1857, 65),
  P(16, 'Abraham Lincoln', 'Republican', 'Kentucky', 1861, 52, 1),
  P(17, 'Andrew Johnson', 'Democratic', 'North Carolina', 1865, 56),
  P(18, 'Ulysses S. Grant', 'Republican', 'Ohio', 1869, 46, 1),
  P(19, 'Rutherford B. Hayes', 'Republican', 'Ohio', 1877, 54),
  P(20, 'James A. Garfield', 'Republican', 'Ohio', 1881, 49),
  P(21, 'Chester A. Arthur', 'Republican', 'Vermont', 1881, 51),
  P(22, 'Grover Cleveland', 'Democratic', 'New Jersey', 1885, 47),
  P(23, 'Benjamin Harrison', 'Republican', 'Ohio', 1889, 55),
  P(25, 'William McKinley', 'Republican', 'Ohio', 1897, 54),
  P(26, 'Theodore Roosevelt', 'Republican', 'New York', 1901, 42, 1, ['Teddy Roosevelt']),
  P(27, 'William Howard Taft', 'Republican', 'Ohio', 1909, 51),
  P(28, 'Woodrow Wilson', 'Democratic', 'Virginia', 1913, 56, 1),
  P(29, 'Warren G. Harding', 'Republican', 'Ohio', 1921, 55),
  P(30, 'Calvin Coolidge', 'Republican', 'Vermont', 1923, 51),
  P(31, 'Herbert Hoover', 'Republican', 'Iowa', 1929, 54, 1),
  P(32, 'Franklin D. Roosevelt', 'Democratic', 'New York', 1933, 51, 1, ['FDR']),
  P(33, 'Harry S. Truman', 'Democratic', 'Missouri', 1945, 60, 1),
  P(34, 'Dwight D. Eisenhower', 'Republican', 'Texas', 1953, 62, 1, ['Ike Eisenhower']),
  P(35, 'John F. Kennedy', 'Democratic', 'Massachusetts', 1961, 43, 1, ['JFK']),
  P(36, 'Lyndon B. Johnson', 'Democratic', 'Texas', 1963, 55, 1, ['LBJ']),
  P(37, 'Richard Nixon', 'Republican', 'California', 1969, 56, 1),
  P(38, 'Gerald Ford', 'Republican', 'Nebraska', 1974, 61, 1),
  P(39, 'Jimmy Carter', 'Democratic', 'Georgia', 1977, 52, 1),
  P(40, 'Ronald Reagan', 'Republican', 'Illinois', 1981, 69, 1),
  P(41, 'George H. W. Bush', 'Republican', 'Massachusetts', 1989, 64, 1),
  P(42, 'Bill Clinton', 'Democratic', 'Arkansas', 1993, 46, 1),
  P(43, 'George W. Bush', 'Republican', 'Connecticut', 2001, 54, 1),
  P(44, 'Barack Obama', 'Democratic', 'Hawaii', 2009, 47, 1),
  P(45, 'Donald Trump', 'Republican', 'New York', 2017, 70, 1),
  P(46, 'Joe Biden', 'Democratic', 'Pennsylvania', 2021, 78, 1),
];

const EL = 'Hydrogen H,Helium He,Lithium Li,Beryllium Be,Boron B,Carbon C,Nitrogen N,Oxygen O,Fluorine F,Neon Ne,Sodium Na,Magnesium Mg,Aluminum Al,Silicon Si,Phosphorus P,Sulfur S,Chlorine Cl,Argon Ar,Potassium K,Calcium Ca,Scandium Sc,Titanium Ti,Vanadium V,Chromium Cr,Manganese Mn,Iron Fe,Cobalt Co,Nickel Ni,Copper Cu,Zinc Zn,Gallium Ga,Germanium Ge,Arsenic As,Selenium Se,Bromine Br,Krypton Kr,Rubidium Rb,Strontium Sr,Yttrium Y,Zirconium Zr,Niobium Nb,Molybdenum Mo,Technetium Tc,Ruthenium Ru,Rhodium Rh,Palladium Pd,Silver Ag,Cadmium Cd,Indium In,Tin Sn,Antimony Sb,Tellurium Te,Iodine I,Xenon Xe,Cesium Cs,Barium Ba,Lanthanum La,Cerium Ce,Praseodymium Pr,Neodymium Nd,Promethium Pm,Samarium Sm,Europium Eu,Gadolinium Gd,Terbium Tb,Dysprosium Dy,Holmium Ho,Erbium Er,Thulium Tm,Ytterbium Yb,Lutetium Lu,Hafnium Hf,Tantalum Ta,Tungsten W,Rhenium Re,Osmium Os,Iridium Ir,Platinum Pt,Gold Au,Mercury Hg,Thallium Tl,Lead Pb,Bismuth Bi,Polonium Po,Astatine At,Radon Rn,Francium Fr,Radium Ra,Actinium Ac,Thorium Th,Protactinium Pa,Uranium U,Neptunium Np,Plutonium Pu,Americium Am,Curium Cm,Berkelium Bk,Californium Cf,Einsteinium Es,Fermium Fm,Mendelevium Md,Nobelium No,Lawrencium Lr,Rutherfordium Rf,Dubnium Db,Seaborgium Sg,Bohrium Bh,Hassium Hs,Meitnerium Mt,Darmstadtium Ds,Roentgenium Rg,Copernicium Cn,Nihonium Nh,Flerovium Fl,Moscovium Mc,Livermorium Lv,Tennessine Ts,Oganesson Og'.split(',');
const EASY_Z = new Set([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 22, 24, 25, 26, 27, 28, 29, 30, 33, 35, 36, 38, 47, 50, 53, 54, 55, 56, 74, 78, 79, 80, 82, 83, 86, 88, 92, 94]);
function periodOf(z) { return z <= 2 ? 1 : z <= 10 ? 2 : z <= 18 ? 3 : z <= 36 ? 4 : z <= 54 ? 5 : z <= 86 ? 6 : 7; }
function blockOf(z) {
  if (z === 1 || z === 2) return 's';
  if ((z >= 57 && z <= 70) || (z >= 89 && z <= 102)) return 'f';
  if ([3, 4, 11, 12, 19, 20, 37, 38, 55, 56, 87, 88].includes(z)) return 's';
  if ((z >= 21 && z <= 30) || (z >= 39 && z <= 48) || (z >= 71 && z <= 80) || (z >= 103 && z <= 112)) return 'd';
  return 'p';
}
function familyOf(z) {
  if ([3, 11, 19, 37, 55, 87].includes(z)) return 'alkali metal';
  if ([4, 12, 20, 38, 56, 88].includes(z)) return 'alkaline earth metal';
  if (z >= 57 && z <= 71) return 'lanthanide';
  if (z >= 89 && z <= 103) return 'actinide';
  if ((z >= 21 && z <= 30) || (z >= 39 && z <= 48) || (z >= 72 && z <= 80) || (z >= 104 && z <= 112)) return 'transition metal';
  if ([5, 14, 32, 33, 51, 52].includes(z)) return 'metalloid';
  if ([9, 17, 35, 53, 85, 117].includes(z)) return 'halogen';
  if ([2, 10, 18, 36, 54, 86, 118].includes(z)) return 'noble gas';
  if ([1, 6, 7, 8, 15, 16, 34].includes(z)) return 'reactive nonmetal';
  return 'post-transition metal';
}
function stateOf(z) {
  if (z >= 104) return 'unknown';
  if ([1, 2, 7, 8, 9, 10, 17, 18, 36, 54, 86].includes(z)) return 'gas';
  if (z === 35 || z === 80) return 'liquid';
  return 'solid';
}
const elements = EL.map((s, i) => {
  const [name, sym] = s.split(' ');
  const z = i + 1;
  return { name, alt: [`${sym} ${name}`], z, period: periodOf(z), block: blockOf(z), state: stateOf(z), family: familyOf(z), ...(EASY_Z.has(z) ? { easy: true } : {}) };
});

const S = (name, year, region, borders, area, coast) => ({ name, year, region, borders, area, coast, easy: true });
const NE = 'Northeast', MW = 'Midwest', SO = 'South', WE = 'West';
const AT = 'Atlantic', PA = 'Pacific', GU = 'Gulf', GL = 'Great Lakes', NO = 'None';
const states = [
  S('Alabama', 1819, SO, 4, 30, GU), S('Alaska', 1959, WE, 0, 1, PA), S('Arizona', 1912, WE, 5, 6, NO), S('Arkansas', 1836, SO, 6, 29, NO),
  S('California', 1850, WE, 3, 3, PA), S('Colorado', 1876, WE, 7, 8, NO), S('Connecticut', 1788, NE, 3, 48, AT), S('Delaware', 1787, SO, 3, 49, AT),
  S('Florida', 1845, SO, 2, 22, 'Atlantic and Gulf'), S('Georgia', 1788, SO, 5, 24, AT), S('Hawaii', 1959, WE, 0, 43, PA), S('Idaho', 1890, WE, 6, 14, NO),
  S('Illinois', 1818, MW, 5, 25, GL), S('Indiana', 1816, MW, 4, 38, GL), S('Iowa', 1846, MW, 6, 26, NO), S('Kansas', 1861, MW, 4, 15, NO),
  S('Kentucky', 1792, SO, 7, 37, NO), S('Louisiana', 1812, SO, 3, 31, GU), S('Maine', 1820, NE, 1, 39, AT), S('Maryland', 1788, SO, 4, 42, AT),
  S('Massachusetts', 1788, NE, 5, 44, AT), S('Michigan', 1837, MW, 3, 11, GL), S('Minnesota', 1858, MW, 4, 12, GL), S('Mississippi', 1817, SO, 4, 32, GU),
  S('Missouri', 1821, MW, 8, 21, NO), S('Montana', 1889, WE, 4, 4, NO), S('Nebraska', 1867, MW, 6, 16, NO), S('Nevada', 1864, WE, 5, 7, NO),
  S('New Hampshire', 1788, NE, 3, 46, AT), S('New Jersey', 1787, NE, 3, 47, AT), S('New Mexico', 1912, WE, 5, 5, NO), S('New York', 1788, NE, 5, 27, AT),
  S('North Carolina', 1789, SO, 4, 28, AT), S('North Dakota', 1889, MW, 3, 19, NO), S('Ohio', 1803, MW, 5, 34, GL), S('Oklahoma', 1907, SO, 6, 20, NO),
  S('Oregon', 1859, WE, 4, 9, PA), S('Pennsylvania', 1787, NE, 6, 33, GL), S('Rhode Island', 1790, NE, 2, 50, AT), S('South Carolina', 1788, SO, 2, 40, AT),
  S('South Dakota', 1889, MW, 6, 17, NO), S('Tennessee', 1796, SO, 8, 36, NO), S('Texas', 1845, SO, 4, 2, GU), S('Utah', 1896, WE, 6, 13, NO),
  S('Vermont', 1791, NE, 3, 45, NO), S('Virginia', 1788, SO, 5, 35, AT), S('Washington', 1889, WE, 2, 18, PA), S('West Virginia', 1863, SO, 5, 41, NO),
  S('Wisconsin', 1848, MW, 4, 23, GL), S('Wyoming', 1890, WE, 6, 10, NO),
];

export const UNIVERSES = {
  presidents: {
    id: 'presidents', name: 'US presidents', noun: 'president', every: true,
    attrs: [
      { key: 'n', label: 'No.', long: 'number', type: 'num' },
      { key: 'party', label: 'Party', long: 'party', type: 'cat' },
      { key: 'born', label: 'Born', long: 'born in', type: 'cat' },
      { key: 'year', label: 'Year', long: 'took office', type: 'num' },
      { key: 'age', label: 'Age', long: 'age on taking office', type: 'num' },
    ],
    rows: presidents,
  },
  elements: {
    id: 'elements', name: 'Chemical elements', noun: 'element',
    attrs: [
      { key: 'z', label: 'No.', long: 'atomic number', type: 'num' },
      { key: 'period', label: 'Period', long: 'period', type: 'num' },
      { key: 'block', label: 'Block', long: 'block', type: 'cat' },
      { key: 'state', label: 'State', long: 'state at room temperature', type: 'cat' },
      { key: 'family', label: 'Family', long: 'family', type: 'cat' },
    ],
    rows: elements,
  },
  states: {
    id: 'states', name: 'US states', noun: 'state',
    attrs: [
      { key: 'year', label: 'Joined', long: 'year admitted', type: 'num' },
      { key: 'region', label: 'Region', long: 'region', type: 'cat' },
      { key: 'borders', label: 'Borders', long: 'bordering states', type: 'num' },
      { key: 'area', label: 'Area #', long: 'area rank', type: 'num' },
      { key: 'coast', label: 'Coast', long: 'coast', type: 'cat' },
    ],
    rows: states,
  },
};
