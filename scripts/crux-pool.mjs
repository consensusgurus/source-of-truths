// Crux authoring pool: the categories a board may be built from, and the
// cross-readings that make a board a puzzle rather than a vocabulary test.
//
// WHY THIS FILE EXISTS. The Aug 11 to Sep 29 2026 bank was produced by an
// ad-hoc script that was never committed, so nobody could re-run it and nobody
// could see what it was optimizing for. It optimized for the collision floor
// and nothing else, and collapsed onto the handful of categories that collide
// most easily: Colors landed on 25 of those 50 boards, Metals on 23, BRONZE on
// 19, and 30 category+word pairs repeated outright (Metals: BRONZE/SILVER ran
// nine times, twice on consecutive days). Every one of those was mechanically
// checkable and nobody had written the check. See scripts/gen-crux.mjs for the
// generator and the crux section of scripts/verify-daily-banks.mjs for the
// checks that now gate the bank.
//
// SHAPE. Each entry is { name, words }. A word belongs to exactly ONE category
// in this pool (the generator asserts it), because a word that is genuinely a
// member of two categories on the same board has no answer.
//
// READS is the collision map: word -> the OTHER pool categories that word
// plausibly reads as. It is the entire semantic model the generator has, so it
// carries two jobs at once and both matter:
//
//   1. It supplies the traps. A collision only counts when the fake reading is
//      a category ON THE SAME BOARD (an off-board reading can never tempt
//      anybody), so the generator scores each candidate board against READS
//      and rejects one that cannot clear the floor: 2 collisions on a weekday,
//      3 on a Sunday Edition.
//   2. It is what uniqueness is proved against. A word's plausible homes are
//      its true category plus every READS entry that is on the board; the
//      generator counts the filings of the words into the categories under
//      those memberships and requires EXACTLY ONE. That is the same counting
//      proof Links uses, and it is why an under-annotated word is dangerous:
//      a real reading left out of READS is a second solution the check cannot
//      see. Annotate honestly, including readings that make a board harder.
//
// A reading has to be one an ordinary player would actually entertain. BRONZE
// reads as a colour; SOFFIT does not read as anything. Do not pad READS to
// clear the floor, add a better category instead.
export const CATEGORIES = [
  { name: 'Chess pieces', words: ['KING', 'QUEEN', 'BISHOP', 'KNIGHT', 'ROOK', 'PAWN'] },
  { name: 'Corvids', words: ['RAVEN', 'MAGPIE', 'JACKDAW', 'CHOUGH', 'NUTCRACKER'] },
  { name: 'Church roles', words: ['DEACON', 'CURATE', 'VERGER', 'PRIEST', 'PRIMATE', 'ABBOT'] },
  { name: 'Medieval ranks', words: ['SQUIRE', 'BARON', 'VASSAL', 'HERALD', 'REEVE', 'SERF'] },
  { name: 'Cathedral parts', words: ['NAVE', 'APSE', 'TRANSEPT', 'CRYPT', 'SPIRE', 'VESTRY'] },
  { name: 'Castle parts', words: ['KEEP', 'MOAT', 'TURRET', 'BAILEY', 'RAMPART', 'BARBICAN'] },

  { name: 'Birds of prey', words: ['KESTREL', 'OSPREY', 'MERLIN', 'BUZZARD', 'GOSHAWK', 'HARRIER'] },
  { name: 'Wartime aircraft', words: ['SPITFIRE', 'MOSQUITO', 'WELLINGTON', 'HURRICANE', 'TYPHOON', 'SWORDFISH'] },
  { name: 'Insects', words: ['EARWIG', 'WEEVIL', 'APHID', 'LOCUST', 'MAYFLY', 'CRICKET'] },
  { name: 'Cricket terms', words: ['WICKET', 'CREASE', 'GULLY', 'MAIDEN', 'DUCK', 'SLIP'] },
  { name: 'Waterfowl', words: ['TEAL', 'EIDER', 'MALLARD', 'WIGEON', 'GADWALL', 'POCHARD'] },
  { name: 'Golf scores', words: ['BIRDIE', 'EAGLE', 'BOGEY', 'ALBATROSS', 'CONDOR'] },
  { name: 'Seabirds', words: ['FULMAR', 'PETREL', 'GANNET', 'SKUA', 'PUFFIN', 'GUILLEMOT'] },

  { name: 'Pottery steps', words: ['GLAZE', 'KILN', 'THROW', 'WEDGE', 'BISQUE', 'BURNISH'] },
  { name: 'Golf clubs', words: ['PUTTER', 'NIBLICK', 'MASHIE', 'BRASSIE', 'CLEEK'] },
  { name: 'Baking steps', words: ['BATTER', 'PROOF', 'KNEAD', 'CREAM', 'SIFT', 'CRIMP'] },
  { name: 'Cookware', words: ['SKILLET', 'KETTLE', 'LADLE', 'COLANDER', 'RAMEKIN', 'PITCHER'] },
  { name: 'Baseball roles', words: ['CATCHER', 'SLUGGER', 'UMPIRE', 'SHORTSTOP', 'RELIEVER'] },
  { name: 'Hand tools', words: ['MALLET', 'RASP', 'BRADAWL', 'CHISEL', 'HANDSAW', 'SPOKESHAVE'] },
  { name: 'Fasteners', words: ['RIVET', 'GROMMET', 'DOWEL', 'WASHER', 'TOGGLE', 'STAPLE'] },
  { name: 'Sewing kit', words: ['BOBBIN', 'THIMBLE', 'PINKING', 'BODKIN', 'TACKING'] },
  { name: 'Knitting terms', words: ['PURL', 'SKEIN', 'GARTER', 'CASTOFF', 'YARN'] },

  { name: 'Plumbing fittings', words: ['ELBOW', 'UNION', 'COUPLING', 'GASKET', 'STOPCOCK', 'TRAP', 'VALVE'] },
  { name: 'Body joints', words: ['KNUCKLE', 'WRIST', 'ANKLE', 'SHOULDER', 'JAWBONE'] },
  { name: 'Drum kit', words: ['SNARE', 'CYMBAL', 'CRASH', 'TIMBALE', 'RIMSHOT'] },
  { name: 'Trapping gear', words: ['DEADFALL', 'PITFALL', 'SPRINGE', 'NOOSE', 'BIRDLIME'] },
  { name: 'Fishing tackle', words: ['LURE', 'REEL', 'SINKER', 'GAFF', 'SPINNER', 'HOOK'] },
  { name: 'Folk dances', words: ['JIG', 'POLKA', 'HORNPIPE', 'MAZURKA', 'GALLIARD'] },
  { name: 'Brass instruments', words: ['CORNET', 'TUBA', 'TROMBONE', 'BUGLE', 'FLUGELHORN'] },
  { name: 'Music notation', words: ['CLEF', 'CROTCHET', 'MINIM', 'QUAVER', 'STAVE', 'CODA'] },
  { name: 'Snooker terms', words: ['BAULK', 'CANNON', 'SCREW', 'REST', 'POT', 'BREAK'] },
  { name: 'Tennis terms', words: ['DEUCE', 'FAULT', 'VOLLEY', 'TIEBREAK', 'ADVANTAGE'] },
  { name: 'Laundry appliances', words: ['DRYER', 'MANGLE', 'IRON', 'WRINGER', 'AIRER'] },
  { name: 'Glassware', words: ['TUMBLER', 'GOBLET', 'CARAFE', 'DECANTER', 'SNIFTER', 'FLUTE'] },
  { name: 'Lock parts', words: ['HASP', 'LATCH', 'WARD', 'KEYHOLE', 'DEADBOLT', 'BOLT'] },
  { name: 'Woodwind instruments', words: ['OBOE', 'BASSOON', 'PICCOLO', 'CLARINET', 'RECORDER'] },
  { name: 'Court roles', words: ['BAILIFF', 'JUROR', 'USHER', 'ADVOCATE', 'MAGISTRATE'] },
  { name: 'Fabric lengths', words: ['REMNANT', 'SWATCH', 'SELVEDGE', 'YARDAGE', 'OFFCUT'] },

  { name: 'Geology features', words: ['STRATA', 'SCARP', 'MORAINE', 'OUTCROP', 'BATHOLITH'] },
  { name: 'Landforms', words: ['MESA', 'BUTTE', 'FJORD', 'TOMBOLO', 'ESKER', 'DRUMLIN'] },
  { name: 'Cloud types', words: ['CIRRUS', 'STRATUS', 'NIMBUS', 'CUMULUS', 'ANVIL', 'MACKEREL'] },
  { name: 'Sailing gear', words: ['HALYARD', 'KEEL', 'CLEAT', 'TILLER', 'SPINNAKER', 'BOOM'] },
  { name: 'Film crew kit', words: ['CLAPPER', 'GAFFER', 'GRIP', 'DOLLY', 'SLATE'] },
  { name: 'Farm implements', words: ['HARROW', 'SEEDER', 'BALER', 'SCYTHE', 'COULTER'] },
  { name: 'Sheep breeds', words: ['MERINO', 'CHEVIOT', 'KARAKUL', 'RAMBOUILLET', 'DORPER', 'HERDWICK'] },

  { name: 'Ear bones', words: ['STIRRUP', 'MALLEUS', 'INCUS', 'STAPES', 'HAMMER'] },
  { name: 'Horse tack', words: ['BRIDLE', 'GIRTH', 'HALTER', 'CRUPPER', 'SADDLE', 'BIT'] },
  { name: 'Bicycle parts', words: ['SPROCKET', 'PEDAL', 'DERAILLEUR', 'CRANK', 'MUDGUARD', 'FREEWHEEL'] },
  { name: 'Organs', words: ['SPLEEN', 'PANCREAS', 'KIDNEY', 'THYMUS', 'GALLBLADDER', 'TONGUE'] },
  { name: 'Shoe parts', words: ['INSTEP', 'WELT', 'EYELET', 'SHANK', 'VAMP', 'SOLE'] },
  { name: 'Fish', words: ['BREAM', 'PLAICE', 'TENCH', 'GUDGEON', 'BARBEL', 'ROACH'] },
  { name: 'Boxing punches', words: ['JAB', 'UPPERCUT', 'HAYMAKER', 'CROSS', 'OVERHAND'] },
  { name: 'Mushroom parts', words: ['GILL', 'VOLVA', 'MYCELIUM', 'SPORE', 'CAP', 'STIPE'] },
  { name: 'Bank things', words: ['TELLER', 'OVERDRAFT', 'MORTGAGE', 'DEBIT', 'VAULT', 'LEDGER'] },
  { name: 'Gymnastics apparatus', words: ['POMMEL', 'BEAM', 'RINGS', 'TRAMPOLINE', 'PARALLELS'] },
  { name: 'Timber', words: ['JOIST', 'BATTEN', 'VENEER', 'PLANK', 'LINTEL', 'RAFTER'] },
  { name: 'Bar drinks', words: ['SPRITZ', 'HIGHBALL', 'NEGRONI', 'SIDECAR', 'SHANDY'] },
  { name: 'Spy trade', words: ['MOLE', 'HANDLER', 'SLEEPER', 'CUTOUT', 'LEGEND', 'PLANT'] },
  { name: 'Rodents', words: ['VOLE', 'GERBIL', 'CAPYBARA', 'DORMOUSE', 'CHINCHILLA', 'MOUSE'] },
  { name: 'Computer parts', words: ['MOTHERBOARD', 'PROCESSOR', 'KEYBOARD', 'TRACKPAD', 'CHIPSET'] },
  { name: 'Lizards', words: ['SKINK', 'GECKO', 'IGUANA', 'CHAMELEON', 'AGAMA', 'MONITOR'] },

  // Added 2026-08-28 to widen the collision pool. The Sep 30 to Oct 31 batch
  // could not be built without it: 37 of the pool's 83 collision pairs had
  // already been used twice on boards live from 2026-08-20, which is the
  // bank-wide ceiling, and a Sunday needs three fresh ones on four mutually
  // linked categories. Every pair below is a genuine second reading, not
  // padding: a fireplace POKER is a card game, a coal SCUTTLE is a ship's
  // hatch, MACE is a spice and a weapon, a PIKE is a fish and a polearm.
  { name: 'Butterflies', words: ['ADMIRAL', 'PEACOCK', 'COMMA', 'BRIMSTONE', 'FRITILLARY', 'RINGLET'] },
  { name: 'Naval ranks', words: ['COMMODORE', 'ENSIGN', 'MIDSHIPMAN', 'PURSER', 'BOSUN', 'YEOMAN'] },
  { name: 'Punctuation marks', words: ['COLON', 'SEMICOLON', 'CARET', 'PILCROW', 'ELLIPSIS', 'OBELUS'] },
  { name: 'Athletics events', words: ['HURDLES', 'JAVELIN', 'DECATHLON', 'STEEPLECHASE', 'RELAY', 'DISCUS'] },
  { name: 'Electrical parts', words: ['RESISTOR', 'CAPACITOR', 'DIODE', 'TRANSFORMER', 'SOLENOID', 'FUSE'] },
  { name: 'Knots', words: ['BOWLINE', 'CLOVE', 'SHEEPSHANK', 'HITCH', 'PRUSIK', 'SPLICE'] },
  { name: 'Spices', words: ['NUTMEG', 'CUMIN', 'MACE', 'SAFFRON', 'CARDAMOM', 'TURMERIC'] },
  { name: 'Medieval weapons', words: ['HALBERD', 'FLAIL', 'POLEAXE', 'MORNINGSTAR', 'PIKE', 'GLAIVE'] },
  { name: 'Printing terms', words: ['SERIF', 'KERNING', 'GALLEY', 'EMBOSS', 'PLATEN', 'LIGATURE'] },
  { name: 'Ship rooms', words: ['FORECASTLE', 'WARDROOM', 'ORLOP', 'BILGE', 'BRIG', 'SCUTTLE'] },
  { name: 'Fireplace tools', words: ['POKER', 'TONGS', 'BELLOWS', 'TRIVET', 'ANDIRON', 'FENDER'] },
  { name: 'Card games', words: ['WHIST', 'CRIBBAGE', 'CANASTA', 'EUCHRE', 'PIQUET', 'BEZIQUE'] },
  { name: 'Heraldry terms', words: ['CHEVRON', 'BEND', 'SALTIRE', 'ESCUTCHEON', 'RAMPANT', 'GULES'] },
  { name: 'Military insignia', words: ['PIP', 'STRIPE', 'CROWN', 'EPAULETTE', 'BRAID', 'LANYARD'] },
  { name: 'Tooth parts', words: ['ENAMEL', 'DENTINE', 'PULP', 'CUSP', 'MOLAR', 'INCISOR'] },
  { name: 'Window parts', words: ['SASH', 'MULLION', 'TRANSOM', 'SILL', 'CASEMENT', 'LOUVRE'] },
  { name: 'Poker terms', words: ['FLOP', 'RIVER', 'BLIND', 'ANTE', 'KICKER', 'MUCK'] },

  // Added 2026-09-23 to bank Nov 2026. With the Oct batch in, 75 of the
  // pool's 108 collision pairs were at the bank-wide ceiling of two uses, so
  // the generator could not build the Nov 1 Sunday at all. Same test as the
  // last widening: each new pair is a real second reading an ordinary player
  // would entertain (a chess FORK is a bicycle part, a roof VALLEY is a
  // landform, a HURRICANE is a storm, TANGO is a NATO letter), and overlaps
  // between the new categories and the old ones are annotated in READS even
  // where they make a board harder to build (STAPLE is office supplies, a
  // CATCH is a lock part as well as a rowing term). The bone category is
  // LIMB bones on purpose: a plain 'Bones' swallows the ear bones and the
  // pool's JAWBONE outright, which is a subset, not a trap.
  { name: 'Roof parts', words: ['GABLE', 'EAVES', 'RIDGE', 'VALLEY', 'HIP', 'GUTTER', 'DORMER', 'FASCIA', 'SOFFIT'] },
  { name: 'Bowling terms', words: ['STRIKE', 'SPARE', 'SPLIT', 'FRAME', 'TURKEY', 'ALLEY'] },
  { name: 'Chess tactics', words: ['FORK', 'PIN', 'SKEWER', 'GAMBIT', 'FIANCHETTO', 'ZUGZWANG'] },
  { name: 'Hairstyles', words: ['BOB', 'BUN', 'MULLET', 'QUIFF', 'POMPADOUR', 'BEEHIVE', 'MOHAWK'] },
  { name: 'Old coins', words: ['DUCAT', 'DOUBLOON', 'FLORIN', 'GUINEA', 'SOVEREIGN', 'NOBLE', 'FARTHING'] },
  { name: 'Rowing terms', words: ['STROKE', 'SCULL', 'CATCH', 'FEATHER', 'OAR'] },
  { name: 'Sword parts', words: ['HILT', 'BLADE', 'TANG', 'QUILLON', 'FULLER', 'GUARD'] },
  { name: 'Stage parts', words: ['APRON', 'WINGS', 'FLIES', 'PROSCENIUM', 'CATWALK'] },
  { name: 'Book parts', words: ['SPINE', 'JACKET', 'INDEX', 'FOLIO', 'APPENDIX', 'GLOSSARY', 'PREFACE'] },
  { name: 'Guitar parts', words: ['FRET', 'NECK', 'BRIDGE', 'NUT', 'PICKUP', 'TUNER', 'HEADSTOCK'] },
  { name: 'Baseball pitches', words: ['CURVEBALL', 'SLIDER', 'KNUCKLEBALL', 'FASTBALL', 'CHANGEUP', 'SCREWBALL', 'SPLITTER'] },
  { name: 'Beekeeping terms', words: ['DRONE', 'WORKER', 'COMB', 'SWARM', 'SMOKER', 'NECTAR', 'BROOD'] },
  { name: 'Storms', words: ['SQUALL', 'TORNADO', 'CYCLONE', 'BLIZZARD', 'GALE', 'MONSOON', 'TEMPEST'] },
  { name: 'NATO alphabet', words: ['ALPHA', 'BRAVO', 'DELTA', 'ECHO', 'KILO', 'LIMA', 'OSCAR', 'WHISKEY', 'ZULU', 'SIERRA'] },
  { name: 'Latin dances', words: ['TANGO', 'RUMBA', 'SAMBA', 'MAMBO', 'SALSA', 'MERENGUE', 'LAMBADA'] },
  { name: 'Office supplies', words: ['STAPLER', 'BINDER', 'CLIP', 'RULER', 'ERASER', 'FOLDER'] },
  { name: 'Tailoring terms', words: ['HEM', 'LAPEL', 'PLEAT', 'SEAM', 'YOKE', 'GUSSET', 'DART'] },
  { name: 'Climbing gear', words: ['PITON', 'CARABINER', 'CRAMPON', 'HARNESS', 'BELAY'] },
  { name: 'Hats', words: ['BOWLER', 'BOATER', 'FEDORA', 'TRILBY', 'BERET', 'STETSON', 'PANAMA'] },
  { name: 'Limb bones', words: ['FEMUR', 'TIBIA', 'FIBULA', 'RADIUS', 'ULNA', 'HUMERUS', 'PATELLA'] },
  { name: 'Circle parts', words: ['CHORD', 'ARC', 'SECTOR', 'TANGENT', 'DIAMETER', 'SEGMENT'] },
  { name: 'Hockey terms', words: ['PUCK', 'ICING', 'SLAPSHOT', 'GOALIE', 'POWERPLAY'] },
  { name: 'Army ranks', words: ['PRIVATE', 'CORPORAL', 'SERGEANT', 'COLONEL', 'CAPTAIN', 'BRIGADIER'] },
  { name: 'Pastries', words: ['ECLAIR', 'STRUDEL', 'TURNOVER', 'CROISSANT', 'CRULLER', 'PROFITEROLE'] },
  { name: 'Basketball terms', words: ['DUNK', 'LAYUP', 'DRIBBLE', 'TRAVEL', 'SCREEN'] },
  { name: 'Volleyball terms', words: ['SPIKE', 'DIG', 'ACE', 'BLOCK', 'KILL', 'LIBERO'] },
  { name: 'Carpentry joints', words: ['DOVETAIL', 'MORTISE', 'TENON', 'RABBET', 'MITER', 'DADO'] },
  { name: 'Eye parts', words: ['IRIS', 'PUPIL', 'LENS', 'RETINA', 'CORNEA', 'EYELID'] },
  { name: 'Flowers', words: ['TULIP', 'DAISY', 'POPPY', 'PEONY', 'ASTER', 'DAHLIA'] },
  { name: 'Camera parts', words: ['SHUTTER', 'APERTURE', 'FLASH', 'TRIPOD', 'VIEWFINDER'] },
];

// word -> the other pool categories it plausibly reads as
export const READS = {
  ROOK: ['Corvids'],
  BISHOP: ['Church roles'],
  KNIGHT: ['Medieval ranks'],
  PRIMATE: ['Church roles'],
  NUTCRACKER: ['Hand tools'],
  KEEP: ['Castle parts'],
  CRYPT: ['Castle parts'],
  SPIRE: ['Castle parts'],
  TURRET: ['Cathedral parts'],
  HARRIER: ['Wartime aircraft'],
  MOSQUITO: ['Insects'],
  SPITFIRE: ['Birds of prey'],
  SWORDFISH: ['Fish'],
  SLATE: ['Geology features'],
  CRICKET: ['Cricket terms'],
  DUCK: ['Waterfowl'],
  GULLY: ['Landforms'],
  SLIP: ['Pottery steps'],
  MAIDEN: ['Medieval ranks'],
  EAGLE: ['Birds of prey'],
  BIRDIE: ['Seabirds', 'Waterfowl'],
  ALBATROSS: ['Seabirds'],
  CONDOR: ['Birds of prey'],
  WEDGE: ['Golf clubs'],
  GLAZE: ['Baking steps'],
  BISQUE: ['Cookware'],
  THROW: ['Boxing punches'],
  BATTER: ['Baking steps', 'Baseball roles'],
  CREAM: ['Baking steps'],
  PITCHER: ['Baseball roles'],
  KETTLE: ['Landforms'],
  MALLET: ['Ear bones'],
  HAMMER: ['Hand tools'],
  ANVIL: ['Hand tools'],
  STIRRUP: ['Horse tack'],
  SADDLE: ['Bicycle parts', 'Landforms'],
  CRANK: ['Bicycle parts'],
  PEDAL: ['Bicycle parts'],
  WASHER: ['Laundry appliances'],
  TOGGLE: ['Fasteners'],
  ELBOW: ['Body joints', 'Plumbing fittings'],
  SHOULDER: ['Body joints'],
  SNARE: ['Trapping gear', 'Drum kit'],
  NOOSE: ['Trapping gear'],
  LURE: ['Trapping gear'],
  HOOK: ['Boxing punches', 'Fishing tackle'],
  REEL: ['Folk dances'],
  SPINNER: ['Cricket terms'],
  JIG: ['Folk dances'],
  VALVE: ['Brass instruments'],
  CORNET: ['Cookware'],
  QUAVER: ['Music notation'],
  STAVE: ['Timber'],
  CODA: ['Music notation'],
  REST: ['Music notation', 'Snooker terms'],
  BREAK: ['Tennis terms', 'Snooker terms'],
  SCREW: ['Fasteners'],
  POT: ['Cookware'],
  CANNON: ['Snooker terms'],
  FAULT: ['Geology features', 'Tennis terms'],
  VOLLEY: ['Boxing punches'],
  IRON: ['Golf clubs'],
  MANGLE: ['Laundry appliances'],
  TUMBLER: ['Lock parts', 'Glassware'],
  FLUTE: ['Woodwind instruments', 'Glassware'],
  RECORDER: ['Court roles'],
  ADVOCATE: ['Court roles'],
  BOLT: ['Fabric lengths', 'Fasteners', 'Lock parts'],
  WARD: ['Court roles'],
  REMNANT: ['Fabric lengths'],
  STRATA: ['Cloud types'],
  STRATUS: ['Geology features'],
  MESA: ['Landforms'],
  MACKEREL: ['Fish', 'Cloud types'],
  NIMBUS: ['Cloud types'],
  BOOM: ['Film crew kit', 'Sailing gear'],
  TILLER: ['Farm implements', 'Sailing gear'],
  KEEL: ['Sailing gear'],
  DOLLY: ['Sheep breeds', 'Film crew kit'],
  GRIP: ['Film crew kit'],
  CLAPPER: ['Film crew kit'],
  HALTER: ['Horse tack'],
  GIRTH: ['Horse tack'],
  TONGUE: ['Shoe parts', 'Organs'],
  SOLE: ['Fish', 'Shoe parts'],
  VAMP: ['Shoe parts'],
  SHANK: ['Golf scores', 'Shoe parts'],
  ROACH: ['Insects', 'Fish'],
  GILL: ['Fish', 'Mushroom parts'],
  CAP: ['Mushroom parts'],
  SPORE: ['Mushroom parts'],
  BEAM: ['Timber', 'Gymnastics apparatus'],
  RINGS: ['Gymnastics apparatus'],
  LEDGER: ['Timber'],
  PLANK: ['Timber'],
  JOIST: ['Timber'],
  BATTEN: ['Sailing gear'],
  LINTEL: ['Timber'],
  SIDECAR: ['Bicycle parts'],
  MOLE: ['Rodents', 'Spy trade'],
  PLANT: ['Spy trade'],
  LEGEND: ['Spy trade'],
  MOUSE: ['Computer parts', 'Rodents'],
  MONITOR: ['Computer parts', 'Lizards'],
  KEYBOARD: ['Music notation'],

  // the 2026-08-28 widening (see the categories above)
  ADMIRAL: ['Naval ranks'],
  COMMA: ['Punctuation marks'],
  COLON: ['Organs'],
  RELAY: ['Electrical parts'],
  CLOVE: ['Spices'],
  MACE: ['Medieval weapons'],
  PIKE: ['Fish'],
  FLAIL: ['Farm implements'],
  GALLEY: ['Ship rooms'],
  SCUTTLE: ['Fireplace tools'],
  POKER: ['Card games'],
  FENDER: ['Sailing gear'],
  TONGS: ['Cookware'],
  TRIVET: ['Cookware'],
  YEOMAN: ['Medieval ranks'],
  BEND: ['Knots'],
  CHEVRON: ['Military insignia'],
  LANYARD: ['Sailing gear'],
  TRANSOM: ['Sailing gear'],
  RIVER: ['Landforms'],
  // readings the pool already had the words for and had simply not written down
  BIT: ['Hand tools', 'Computer parts'],
  CROSS: ['Heraldry terms'],
  SLEEPER: ['Timber'],
  VAULT: ['Gymnastics apparatus', 'Cathedral parts'],

  // the 2026-09-23 widening (see the categories above)
  RIDGE: ['Landforms'],
  VALLEY: ['Landforms'],
  HIP: ['Body joints'],
  GUTTER: ['Bowling terms'],
  FRAME: ['Bicycle parts'],
  STRIKE: ['Boxing punches'],
  FORK: ['Bicycle parts'],
  PIN: ['Fasteners'],
  SKEWER: ['Cookware'],
  MULLET: ['Fish'],
  BRAID: ['Hairstyles'],
  BEEHIVE: ['Beekeeping terms'],
  NOBLE: ['Medieval ranks'],
  SOVEREIGN: ['Medieval ranks'],
  CROWN: ['Tooth parts', 'Old coins'],
  CATCH: ['Cricket terms', 'Lock parts'],
  BLADE: ['Rowing terms'],
  POMMEL: ['Horse tack', 'Sword parts'],
  TRAP: ['Drum kit', 'Trapping gear', 'Plumbing fittings', 'Stage parts'],
  FLIES: ['Insects'],
  APPENDIX: ['Organs'],
  NUT: ['Fasteners'],
  BRIDGE: ['Card games'],
  SINKER: ['Baseball pitches'],
  QUEEN: ['Medieval ranks', 'Beekeeping terms'],
  HURRICANE: ['Storms'],
  TYPHOON: ['Storms'],
  DELTA: ['Landforms'],
  WHISKEY: ['Bar drinks'],
  TANGO: ['NATO alphabet'],
  BINDER: ['Farm implements'],
  CLIP: ['Fasteners'],
  STAPLE: ['Fasteners', 'Office supplies'],
  RULER: ['Medieval ranks'],
  SEAM: ['Geology features'],
  YOKE: ['Farm implements'],
  TACKING: ['Tailoring terms'],
  HARNESS: ['Horse tack'],
  BOWLER: ['Cricket terms'],
  RADIUS: ['Circle parts'],
  CHORD: ['Music notation'],
  CREASE: ['Hockey terms'],
  ICING: ['Baking steps'],
  CAPTAIN: ['Naval ranks'],
  TURNOVER: ['Basketball terms'],
  SCREEN: ['Computer parts'],
  ACE: ['Tennis terms', 'Golf scores'],
  BLOCK: ['Basketball terms'],
  MITER: ['Hats'],
  IRIS: ['Flowers'],
  LENS: ['Camera parts'],
  SHUTTER: ['Window parts'],
};

// word -> the ONE category that owns it. Asserted unique by the generator.
export const HOME = Object.fromEntries(
  CATEGORIES.flatMap((c) => c.words.map((w) => [w, c.name])),
);

// The readings that count. A word's own home is filtered out rather than
// treated as an error: annotating TUMBLER as reading "Lock parts, Glassware"
// when one of those IS its home is the natural way to write the pair down, and
// a self-reading can never be a trap, so silently dropping it is right.
export function readsOf(word) {
  return (READS[word] || []).filter((r) => r !== HOME[word]);
}
