// Knowledge domains for Venn — the closed universes behind the `fact` rule.
//
// WHY THIS SHAPE. The original Venn rules were all orthographic (letters,
// vowels, hidden words), so an item's membership was computable from the
// string itself and could never be wrong. A knowledge rule is different: it
// asserts something about the WORLD, and the game's one unforgivable bug is a
// board where a solver's correct reasoning disagrees with the answer key.
//
// The `hides` rule already taught us how that happens. HIDDEN was a list of
// members, so FEELING (which hides an EEL) and CARPET (which hides a CARP)
// scored as non-animals purely because EEL and CARP were missing from the
// list. A member list can only ever be incomplete.
//
// So a domain here is NOT a member list. It is a TABLE: every row is an
// entity, and the row carries EVERY property that is true of it. A property
// absent from a row is false, deliberately, and the verifier refuses any board
// whose item is not a row. That makes a decoy structurally impossible: there
// is no way to put an entity on a board without also declaring the full truth
// about it.
//
// AUTHORING RULES for adding rows or properties:
//   1. Only unarguable facts. If a reasonable, informed solver could answer
//      either way, it does not belong. This is why the table has no
//      transcontinental countries (Turkey, Russia, Egypt), no equator
//      straddlers under `southern` (Ecuador, Kenya, Brazil), no metalloids
//      under `metal` (boron, arsenic, antimony), and no duplicated
//      presidential surnames (Adams, Harrison, Johnson, Roosevelt, Bush).
//   2. Only facts that do not rot. Populations, rankings, and "currently has
//      an NFL team" all go stale between authoring and the live date.
//   3. Names cap at 9 characters, which is what a filed item can still be read
//      at in the 76px region tray. A two-word name (NEW YORK, VAN BUREN) is
//      allowed inside that cap, but it may not share a board with a length
//      rule: a player cannot know whether the space counts, and on a board
//      asking for eight letters or more, NEW YORK is seven or eight depending
//      on the answer. The verifier rejects that combination.
//   4. Every property named in a row must be declared in `props`, and every
//      declared property must be true somewhere. The verifier enforces both,
//      which is what catches a typo'd tag silently reading as false.

export const DOMAINS = {
  // ── COUNTRIES ────────────────────────────────────────────────────────────
  // `landlocked` (no coastline) and `noborder` (no land border) are opposites,
  // so no board can put both on the same item. Continents are single-continent
  // only. `southern` means the whole country sits below the equator.
  country: {
    note: 'Every item is a country.',
    props: {
      europe: 'is in Europe',
      africa: 'is in Africa',
      asia: 'is in Asia',
      samerica: 'is in South America',
      landlocked: 'has no coastline',
      noborder: 'has no land border',
      eu: 'is in the European Union',
      euro: 'uses the euro',
      southern: 'lies entirely below the equator',
      spanish: 'has Spanish as an official language',
    },
    rows: {
      // Europe
      FRANCE: ['europe', 'eu', 'euro'],
      SPAIN: ['europe', 'eu', 'euro', 'spanish'],
      PORTUGAL: ['europe', 'eu', 'euro'],
      ITALY: ['europe', 'eu', 'euro'],
      GERMANY: ['europe', 'eu', 'euro'],
      AUSTRIA: ['europe', 'eu', 'euro', 'landlocked'],
      HUNGARY: ['europe', 'eu', 'landlocked'],
      SLOVAKIA: ['europe', 'eu', 'euro', 'landlocked'],
      CZECHIA: ['europe', 'eu', 'landlocked'],
      POLAND: ['europe', 'eu'],
      SWEDEN: ['europe', 'eu'],
      NORWAY: ['europe'],
      DENMARK: ['europe', 'eu'],
      FINLAND: ['europe', 'eu', 'euro'],
      IRELAND: ['europe', 'eu', 'euro'],
      ICELAND: ['europe', 'noborder'],
      GREECE: ['europe', 'eu', 'euro'],
      CROATIA: ['europe', 'eu', 'euro'],
      SLOVENIA: ['europe', 'eu', 'euro'],
      ROMANIA: ['europe', 'eu'],
      SERBIA: ['europe', 'landlocked'],
      ALBANIA: ['europe'],
      MOLDOVA: ['europe', 'landlocked'],
      BELARUS: ['europe', 'landlocked'],
      UKRAINE: ['europe'],
      ESTONIA: ['europe', 'eu', 'euro'],
      LATVIA: ['europe', 'eu', 'euro'],
      LITHUANIA: ['europe', 'eu', 'euro'],
      LUXEMBOURG: ['europe', 'eu', 'euro', 'landlocked'],
      MALTA: ['europe', 'eu', 'euro', 'noborder'],
      // Africa
      MOROCCO: ['africa'],
      ALGERIA: ['africa'],
      TUNISIA: ['africa'],
      LIBYA: ['africa'],
      SUDAN: ['africa'],
      CHAD: ['africa', 'landlocked'],
      NIGER: ['africa', 'landlocked'],
      MALI: ['africa', 'landlocked'],
      SENEGAL: ['africa'],
      GHANA: ['africa'],
      NIGERIA: ['africa'],
      CAMEROON: ['africa'],
      ETHIOPIA: ['africa', 'landlocked'],
      RWANDA: ['africa', 'landlocked', 'southern'],
      BURUNDI: ['africa', 'landlocked', 'southern'],
      TANZANIA: ['africa', 'southern'],
      ANGOLA: ['africa', 'southern'],
      NAMIBIA: ['africa', 'southern'],
      BOTSWANA: ['africa', 'southern', 'landlocked'],
      ZAMBIA: ['africa', 'southern', 'landlocked'],
      ZIMBABWE: ['africa', 'southern', 'landlocked'],
      MALAWI: ['africa', 'southern', 'landlocked'],
      LESOTHO: ['africa', 'southern', 'landlocked'],
      ESWATINI: ['africa', 'southern', 'landlocked'],
      MOZAMBIQUE: ['africa', 'southern'],
      MADAGASCAR: ['africa', 'southern', 'noborder'],
      MAURITIUS: ['africa', 'southern', 'noborder'],
      SEYCHELLES: ['africa', 'southern', 'noborder'],
      // Asia
      JAPAN: ['asia', 'noborder'],
      THAILAND: ['asia'],
      VIETNAM: ['asia'],
      CAMBODIA: ['asia'],
      LAOS: ['asia', 'landlocked'],
      MYANMAR: ['asia'],
      MALAYSIA: ['asia'],
      SINGAPORE: ['asia', 'noborder'],
      NEPAL: ['asia', 'landlocked'],
      BHUTAN: ['asia', 'landlocked'],
      MONGOLIA: ['asia', 'landlocked'],
      TAJIKISTAN: ['asia', 'landlocked'],
      UZBEKISTAN: ['asia', 'landlocked'],
      INDIA: ['asia'],
      PAKISTAN: ['asia'],
      BANGLADESH: ['asia'],
      IRAN: ['asia'],
      IRAQ: ['asia'],
      SYRIA: ['asia'],
      LEBANON: ['asia'],
      ISRAEL: ['asia'],
      JORDAN: ['asia'],
      YEMEN: ['asia'],
      OMAN: ['asia'],
      QATAR: ['asia'],
      KUWAIT: ['asia'],
      // South America
      ARGENTINA: ['samerica', 'southern', 'spanish'],
      CHILE: ['samerica', 'southern', 'spanish'],
      URUGUAY: ['samerica', 'southern', 'spanish'],
      PARAGUAY: ['samerica', 'southern', 'spanish', 'landlocked'],
      BOLIVIA: ['samerica', 'southern', 'spanish', 'landlocked'],
      PERU: ['samerica', 'southern', 'spanish'],
      VENEZUELA: ['samerica', 'spanish'],
      GUYANA: ['samerica'],
      SURINAME: ['samerica'],
      // Elsewhere
      MEXICO: ['spanish'],
      GUATEMALA: ['spanish'],
      HONDURAS: ['spanish'],
      NICARAGUA: ['spanish'],
      PANAMA: ['spanish'],
      CUBA: ['spanish', 'noborder'],
      JAMAICA: ['noborder'],
      CANADA: [],
      AUSTRALIA: ['southern', 'noborder'],
      FIJI: ['southern', 'noborder'],
      SAMOA: ['southern', 'noborder'],
      TONGA: ['southern', 'noborder'],
    },
  },

  // ── US STATES ────────────────────────────────────────────────────────────
  // Only the 39 states whose names fit the 10-character cap. `mississippi`
  // means the river forms a border of, or runs through, the state.
  state: {
    note: 'Every item is a US state.',
    props: {
      orig13: 'was one of the original thirteen',
      pacific: 'touches the Pacific',
      atlantic: 'touches the Atlantic',
      gulf: 'touches the Gulf',
      canada: 'borders Canada',
      mexico: 'borders Mexico',
      greatlake: 'touches a Great Lake',
      mississippi: 'the Mississippi runs along it or through it',
      capbig: 'its capital is its largest city',
    },
    rows: {
      ALABAMA: ['gulf'],
      ALASKA: ['pacific', 'canada'],
      ARIZONA: ['mexico', 'capbig'],
      ARKANSAS: ['mississippi', 'capbig'],
      CALIFORNIA: ['pacific', 'mexico'],
      COLORADO: ['capbig'],
      DELAWARE: ['orig13', 'atlantic'],
      FLORIDA: ['atlantic', 'gulf'],
      GEORGIA: ['orig13', 'atlantic', 'capbig'],
      HAWAII: ['pacific', 'capbig'],
      IDAHO: ['canada', 'capbig'],
      ILLINOIS: ['greatlake', 'mississippi'],
      INDIANA: ['greatlake', 'capbig'],
      IOWA: ['mississippi', 'capbig'],
      KANSAS: [],
      KENTUCKY: ['mississippi'],
      LOUISIANA: ['gulf', 'mississippi'],
      MAINE: ['atlantic', 'canada'],
      MARYLAND: ['orig13', 'atlantic'],
      MICHIGAN: ['greatlake', 'canada'],
      MINNESOTA: ['greatlake', 'canada', 'mississippi'],
      MISSOURI: ['mississippi'],
      MONTANA: ['canada'],
      NEBRASKA: [],
      NEVADA: [],
      'NEW JERSEY': ['orig13', 'atlantic'],
      'NEW MEXICO': ['mexico'],
      'NEW YORK': ['orig13', 'atlantic', 'greatlake', 'canada'],
      // Ohio meets Canada only along the Lake Erie water line, which a fair
      // solver could read either way (authoring rule 1), so it carries no
      // `canada`, and CONTESTED below keeps it off any board with that rule.
      OHIO: ['greatlake', 'capbig'],
      OKLAHOMA: ['capbig'],
      OREGON: ['pacific'],
      TENNESSEE: ['mississippi', 'capbig'],
      TEXAS: ['gulf', 'mexico'],
      UTAH: ['capbig'],
      VERMONT: ['canada'],
      VIRGINIA: ['orig13', 'atlantic'],
      WASHINGTON: ['pacific', 'canada'],
      WISCONSIN: ['greatlake', 'mississippi'],
      WYOMING: ['capbig'],
    },
  },

  // ── CHEMICAL ELEMENTS ────────────────────────────────────────────────────
  // Metalloids (boron, silicon, arsenic, antimony, germanium, tellurium) are
  // left out entirely: "is a metal" has no honest answer for them. Astatine
  // and polonium are out for the same reason, less obviously: both get filed
  // as metal by some sources and metalloid or halogen by others, so a solver
  // reasoning correctly can still disagree with the key. `gas` is at room
  // temperature, so bromine and mercury (both liquid) are neither.
  element: {
    note: 'Every item is a chemical element.',
    props: {
      metal: 'is a metal',
      gas: 'is a gas at room temperature',
      lo: 'has an atomic number under twenty',
      radio: 'is radioactive',
      noble: 'is a noble gas',
      oddsym: 'its symbol does not come from its English name',
    },
    rows: {
      HYDROGEN: ['gas', 'lo'],
      HELIUM: ['gas', 'lo', 'noble'],
      LITHIUM: ['metal', 'lo'],
      CARBON: ['lo'],
      NITROGEN: ['gas', 'lo'],
      OXYGEN: ['gas', 'lo'],
      FLUORINE: ['gas', 'lo'],
      NEON: ['gas', 'lo', 'noble'],
      SODIUM: ['metal', 'lo', 'oddsym'],
      MAGNESIUM: ['metal', 'lo'],
      ALUMINUM: ['metal', 'lo'],
      PHOSPHORUS: ['lo'],
      SULFUR: ['lo'],
      CHLORINE: ['gas', 'lo'],
      ARGON: ['gas', 'lo', 'noble'],
      POTASSIUM: ['metal', 'lo', 'oddsym'],
      CALCIUM: ['metal'],
      TITANIUM: ['metal'],
      VANADIUM: ['metal'],
      CHROMIUM: ['metal'],
      MANGANESE: ['metal'],
      IRON: ['metal', 'oddsym'],
      COBALT: ['metal'],
      NICKEL: ['metal'],
      COPPER: ['metal', 'oddsym'],
      ZINC: ['metal'],
      GALLIUM: ['metal'],
      SELENIUM: [],
      BROMINE: [],
      KRYPTON: ['gas', 'noble'],
      RUBIDIUM: ['metal'],
      STRONTIUM: ['metal'],
      ZIRCONIUM: ['metal'],
      NIOBIUM: ['metal'],
      PALLADIUM: ['metal'],
      SILVER: ['metal', 'oddsym'],
      CADMIUM: ['metal'],
      INDIUM: ['metal'],
      TIN: ['metal', 'oddsym'],
      IODINE: [],
      XENON: ['gas', 'noble'],
      CESIUM: ['metal'],
      BARIUM: ['metal'],
      NEODYMIUM: ['metal'],
      TANTALUM: ['metal'],
      TUNGSTEN: ['metal', 'oddsym'],
      OSMIUM: ['metal'],
      IRIDIUM: ['metal'],
      PLATINUM: ['metal'],
      GOLD: ['metal', 'oddsym'],
      MERCURY: ['metal', 'oddsym'],
      LEAD: ['metal', 'oddsym'],
      BISMUTH: ['metal'],
      RADON: ['gas', 'noble', 'radio'],
      FRANCIUM: ['metal', 'radio'],
      RADIUM: ['metal', 'radio'],
      THORIUM: ['metal', 'radio'],
      URANIUM: ['metal', 'radio'],
      NEPTUNIUM: ['metal', 'radio'],
      PLUTONIUM: ['metal', 'radio'],
      AMERICIUM: ['metal', 'radio'],
      CURIUM: ['metal', 'radio'],
    },
  },

  // ── US PRESIDENTS ────────────────────────────────────────────────────────
  // Surnames only, so the five shared ones (Adams, Harrison, Johnson,
  // Roosevelt, Bush) are out. Cleveland is out because "served two full terms"
  // has no clean answer for non-consecutive terms, and Trump for the same
  // reason while a second term is still running. Arthur is out because he was
  // Quartermaster General of the New York militia, so "was an army general"
  // invites an argument he can win. `currency` means a coin or bill in
  // circulation today.
  president: {
    note: 'Every item is a US president, by surname.',
    props: {
      general: 'was an army general',
      twoterms: 'served two full terms',
      died: 'died in office',
      assassinated: 'was assassinated',
      vpfirst: 'was vice president first',
      virginia: 'was born in Virginia',
      currency: 'is on money in circulation today',
      pre1900: 'took office before 1900',
      // Added 2026-11-12 (lane-d restock): the Sunday 12-27 president board
      // could not be filled from eight properties under the item ceiling. Both
      // are closed, non-rotting facts. `house` is service as a member of the US
      // House of Representatives (Jackson sat for Tennessee in 1796-97).
      house: 'served in the US House',
      ohio: 'was born in Ohio',
    },
    rows: {
      WASHINGTON: ['general', 'twoterms', 'virginia', 'currency', 'pre1900'],
      JEFFERSON: ['twoterms', 'vpfirst', 'virginia', 'currency', 'pre1900'],
      MADISON: ['twoterms', 'virginia', 'pre1900', 'house'],
      MONROE: ['twoterms', 'virginia', 'pre1900'],
      JACKSON: ['general', 'twoterms', 'currency', 'pre1900', 'house'],
      'VAN BUREN': ['vpfirst', 'pre1900'],
      TYLER: ['vpfirst', 'virginia', 'pre1900', 'house'],
      POLK: ['pre1900', 'house'],
      TAYLOR: ['general', 'died', 'virginia', 'pre1900'],
      FILLMORE: ['vpfirst', 'pre1900', 'house'],
      PIERCE: ['general', 'pre1900', 'house'],
      BUCHANAN: ['pre1900', 'house'],
      LINCOLN: ['died', 'assassinated', 'currency', 'pre1900', 'house'],
      GRANT: ['general', 'twoterms', 'currency', 'pre1900', 'ohio'],
      HAYES: ['general', 'pre1900', 'house', 'ohio'],
      GARFIELD: ['general', 'died', 'assassinated', 'pre1900', 'house', 'ohio'],
      MCKINLEY: ['died', 'assassinated', 'pre1900', 'house', 'ohio'],
      TAFT: ['ohio'],
      WILSON: ['twoterms', 'virginia'],
      HARDING: ['died', 'ohio'],
      COOLIDGE: ['vpfirst'],
      HOOVER: [],
      TRUMAN: ['vpfirst'],
      EISENHOWER: ['general', 'twoterms'],
      KENNEDY: ['died', 'assassinated', 'currency', 'house'],
      NIXON: ['vpfirst', 'house'],
      FORD: ['vpfirst', 'house'],
      CARTER: [],
      REAGAN: ['twoterms'],
      CLINTON: ['twoterms'],
      OBAMA: ['twoterms'],
      BIDEN: ['vpfirst'],
    },
  },
};

// CONTESTED (2026-11-12, late review): items whose value on a property a fair
// solver could argue. They are false in the table and verify-venn refuses them
// on any board from CONTESTED_FROM that uses that property.
export const CONTESTED_FROM = '2026-12-01';
export const CONTESTED = { state: { OHIO: ['canada'] } };

// True when `item` carries property `p` in `domain`. An item missing from the
// table is false for everything, which the verifier turns into a hard failure
// rather than letting it quietly sit outside all three circles.
export function hasFact(domain, item, p) {
  const d = DOMAINS[domain];
  if (!d) return false;
  const row = d.rows[item];
  return Array.isArray(row) && row.includes(p);
}

export const factLabel = (domain, p) => (DOMAINS[domain] && DOMAINS[domain].props[p]) || 'unknown';
export const domainNote = (domain) => (DOMAINS[domain] && DOMAINS[domain].note) || '';
