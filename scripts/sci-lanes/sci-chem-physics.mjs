// Sci lane: Chemistry & Physics. 48 days, five tiers a day.
// Elements, the periodic table, compounds, states of matter, reactions, acids
// and bases, motion, gravity, energy, heat, light, sound, electricity,
// magnetism, units, atoms and particles, popular relativity and quantum ideas,
// and the chemists and physicists behind them. No space, no biology, no
// gadget inventions.
const C = "Chemistry & Physics";
const E = (t, q, a, ...d) => ({ c: C, t, q, a, d });

export const LANE_DAYS = [
  // day 1
  [
    E(1, "When sugar stirred into hot tea seems to vanish, what has the sugar done?", "Dissolved", "Evaporated", "Melted", "Burned"),
    E(2, "Which element is the basis of most computer chips?", "Silicon", "Copper", "Carbon", "Germanium"),
    E(3, "Which element gives fireworks a bright red color?", "Strontium", "Barium", "Sodium", "Copper"),
    E(4, "Which British physicist discovered the neutron in 1932?", "James Chadwick", "Ernest Rutherford", "J. J. Thomson", "Enrico Fermi"),
    E(5, "In Anders Celsius's original 1742 scale, what number marked the freezing point of water?", "100", "0", "1", "32"),
  ],
  // day 2
  [
    E(1, "Ice cubes left in a warm drink change from a solid into what?", "A liquid", "A gas", "Plasma", "A crystal"),
    E(2, "Bronze is made mostly of copper mixed with which metal?", "Tin", "Zinc", "Iron", "Nickel"),
    E(3, "Which metal makes stainless steel resist rust?", "Chromium", "Copper", "Manganese", "Cobalt"),
    E(4, "Until 2019, the kilogram was defined by a metal cylinder kept near which city?", "Paris", "London", "Geneva", "Brussels"),
    E(5, "Particles called bosons are named after which Indian physicist?", "Satyendra Nath Bose", "C. V. Raman", "Meghnad Saha", "Homi Bhabha"),
  ],
  // day 3
  [
    E(1, "What happens when you push the north poles of two magnets toward each other?", "They repel", "They attract", "They cancel out", "They stick together"),
    E(2, "Brass is made of copper mixed with which metal?", "Zinc", "Tin", "Lead", "Nickel"),
    E(3, "Which nonmetal element is a liquid at room temperature?", "Bromine", "Iodine", "Chlorine", "Phosphorus"),
    E(4, "How many base units does the International System of Units define?", "7", "5", "9", "12"),
    E(5, "The physicist Murray Gell-Mann took the word quark from which novel?", "Finnegans Wake", "Ulysses", "Gulliver's Travels", "Alice's Adventures in Wonderland"),
  ],
  // day 4
  [
    E(1, "Zero degrees Celsius is equal to how many degrees Fahrenheit?", "32", "0", "100", "212"),
    E(2, "What is the chemical formula for carbon dioxide?", "CO2", "CO", "C2O", "O2C"),
    E(3, "Which element, number 99, is named after the scientist behind E = mc²?", "Einsteinium", "Curium", "Fermium", "Nobelium"),
    E(4, "Lord Kelvin, honored by the absolute temperature unit, was born with what name?", "William Thomson", "James Joule", "J. J. Thomson", "William Herschel"),
    E(5, "When superconductivity was first observed in 1911, it was in which metal?", "Mercury", "Lead", "Tin", "Niobium"),
  ],
  // day 5
  [
    E(1, "Which of these is a chemical change?", "Burning paper", "Melting ice", "Boiling water", "Breaking glass"),
    E(2, "Household bleach is mostly a solution of which compound?", "Sodium hypochlorite", "Sodium chloride", "Ammonia", "Hydrogen peroxide"),
    E(3, "Which element, number 101, honors the chemist who built the periodic table?", "Mendelevium", "Nobelium", "Fermium", "Lawrencium"),
    E(4, "Which American chemist won unshared Nobel Prizes in both chemistry and peace?", "Linus Pauling", "Glenn Seaborg", "Harold Urey", "Irving Langmuir"),
    E(5, "Which Danish physicist found in 1820 that an electric current can deflect a compass needle?", "Hans Christian Ørsted", "Ole Rømer", "Tycho Brahe", "Ludvig Lorenz"),
  ],
  // day 6
  [
    E(1, "Salt dissolves in water but sand does not. Which word describes sand in water?", "Insoluble", "Soluble", "Acidic", "Magnetic"),
    E(2, "Ar is the chemical symbol for which element?", "Argon", "Arsenic", "Gold", "Silver"),
    E(3, "Which element is named after the Norse god of thunder?", "Thorium", "Vanadium", "Titanium", "Promethium"),
    E(4, "The C60 molecule nicknamed the buckyball is named after which architect?", "Buckminster Fuller", "Frank Lloyd Wright", "Le Corbusier", "I. M. Pei"),
    E(5, "Aqua regia, which can dissolve gold, mixes hydrochloric acid with which other acid?", "Nitric acid", "Sulfuric acid", "Acetic acid", "Phosphoric acid"),
  ],
  // day 7
  [
    E(1, "What do scientists call anything that has mass and takes up space?", "Matter", "Energy", "Force", "Light"),
    E(2, "Pb is the chemical symbol for which element?", "Lead", "Platinum", "Palladium", "Phosphorus"),
    E(3, "What is the chemical formula of ammonia?", "NH3", "NH4", "N2H", "NO3"),
    E(4, "Which English scientist identified hydrogen as a distinct gas in 1766?", "Henry Cavendish", "Joseph Priestley", "Antoine Lavoisier", "Carl Wilhelm Scheele"),
    E(5, "Which Danish chemist introduced the pH scale in 1909?", "Søren Sørensen", "Johannes Brønsted", "Svante Arrhenius", "Jacobus van 't Hoff"),
  ],
  // day 8
  [
    E(1, "Which word describes something you can see straight through, like clear window glass?", "Transparent", "Opaque", "Translucent", "Reflective"),
    E(2, "What is the upward push of water on a floating boat called?", "Buoyancy", "Friction", "Inertia", "Tension"),
    E(3, "Lye, used in soap making and drain cleaners, is which compound?", "Sodium hydroxide", "Sodium chloride", "Calcium carbonate", "Sodium bicarbonate"),
    E(4, "A solution with a pH of 3 is how many times more acidic than one with a pH of 5?", "100", "2", "10", "20"),
    E(5, "Which law of thermodynamics was named last but numbered so that it comes first?", "The zeroth law", "The first law", "The third law", "The fourth law"),
  ],
  // day 9
  [
    E(1, "An old-style incandescent light bulb wastes most of its electricity as what?", "Heat", "Sound", "Magnetism", "Radioactivity"),
    E(2, "Which word describes a metal that can be hammered into thin sheets without breaking?", "Malleable", "Ductile", "Brittle", "Volatile"),
    E(3, "Fool's gold, the mineral pyrite, is iron combined with which element?", "Sulfur", "Silver", "Copper", "Silicon"),
    E(4, "What is the atomic number of gold?", "79", "47", "82", "92"),
    E(5, "Which Scottish chemist introduced the idea of latent heat in the 1760s?", "Joseph Black", "James Watt", "Joseph Priestley", "Henry Cavendish"),
  ],
  // day 10
  [
    E(1, "Why do we see a flash of lightning before we hear its thunder?", "Light travels faster than sound", "Sound travels faster than light", "Thunder is made later", "Ears react slower than eyes"),
    E(2, "Which type of chemical bond forms when one atom hands electrons over to another?", "An ionic bond", "A covalent bond", "A metallic bond", "A hydrogen bond"),
    E(3, "Galvanized steel is coated with which metal to slow rusting?", "Zinc", "Tin", "Chromium", "Copper"),
    E(4, "Which element is named for the Greek goddess of the rainbow, because its salts are so colorful?", "Iridium", "Rhodium", "Indium", "Chromium"),
    E(5, "At the triple point of water, ice, liquid and vapor coexist. At about what temperature in degrees Celsius?", "0.01", "0", "4", "0.1"),
  ],
  // day 11
  [
    E(1, "When an ice cube melts, what happens to its mass?", "It stays the same", "It doubles", "It drops to zero", "It halves"),
    E(2, "What is the fixed point that a lever turns on called?", "The fulcrum", "The load", "The effort", "The axle"),
    E(3, "What is the chemical formula of ozone?", "O3", "O2", "O4", "CO2"),
    E(4, "Which Scottish chemist won the 1904 Nobel Prize for discovering the noble gases?", "William Ramsay", "Henri Moissan", "Fritz Haber", "Svante Arrhenius"),
    E(5, "Which American chemist coined the word photon in 1926?", "Gilbert N. Lewis", "Arthur Compton", "Max Planck", "Robert Millikan"),
  ],
  // day 12
  [
    E(1, "How many centimeters make up one meter?", "100", "10", "1,000", "12"),
    E(2, "Which unit of energy appears on American food labels?", "The calorie", "The joule", "The watt", "The newton"),
    E(3, "In chemistry, oxidation is defined as the loss of what?", "Electrons", "Protons", "Neutrons", "Oxygen atoms"),
    E(4, "Léon Foucault's famous 1851 pendulum in Paris demonstrated what?", "That Earth rotates", "That light has a speed", "That gravity weakens with height", "That air has weight"),
    E(5, "Which two scientists carried out the 1909 gold foil experiment for Ernest Rutherford?", "Hans Geiger and Ernest Marsden", "Niels Bohr and James Chadwick", "John Cockcroft and Ernest Walton", "Otto Hahn and Fritz Strassmann"),
  ],
  // day 13
  [
    E(1, "The big bubbles that rise in a pot at a full boil are made of what?", "Water vapor", "Air", "Oxygen", "Hydrogen"),
    E(2, "When an acid neutralizes a base, what two things are formed?", "A salt and water", "Hydrogen and oxygen", "Carbon dioxide and ash", "A metal and a gas"),
    E(3, "The octet rule says atoms tend to gain, lose or share electrons until their outer shell holds how many?", "8", "2", "6", "10"),
    E(4, "Which French physicist proposed in 1924 that electrons and other particles also behave as waves?", "Louis de Broglie", "Pierre Curie", "Henri Poincaré", "André-Marie Ampère"),
    E(5, "Which physicist named the neutrino, Italian for little neutral one?", "Enrico Fermi", "Wolfgang Pauli", "Ettore Majorana", "Paul Dirac"),
  ],
  // day 14
  [
    E(1, "In a flat mirror, your raised left hand appears to be which hand?", "Your right hand", "Your left hand", "Your right foot", "Your left foot"),
    E(2, "Which gas fizzes up when baking soda is mixed with vinegar?", "Carbon dioxide", "Oxygen", "Hydrogen", "Nitrogen"),
    E(3, "What is a chemical bond called in which two atoms share a pair of electrons?", "A covalent bond", "An ionic bond", "A metallic bond", "A hydrogen bond"),
    E(4, "What state of matter forms when certain atoms are cooled to within a hair of absolute zero, first made in a laboratory in 1995?", "Bose-Einstein condensate", "Plasma", "Quark-gluon plasma", "Supercritical fluid"),
    E(5, "Which English physician argued in his 1600 book De Magnete that Earth itself is a giant magnet?", "William Gilbert", "Robert Hooke", "William Harvey", "Francis Bacon"),
  ],
  // day 15
  [
    E(1, "Which kind of energy does a car have because it is moving?", "Kinetic energy", "Potential energy", "Nuclear energy", "Magnetic energy"),
    E(2, "Which poisonous gas forms when fuel burns without enough air?", "Carbon monoxide", "Carbon dioxide", "Ozone", "Methane"),
    E(3, "Which indicator stays colorless in an acid but turns pink in a basic solution?", "Phenolphthalein", "Litmus", "Methyl orange", "Bromothymol blue"),
    E(4, "Which English chemist first isolated sodium and potassium by electrolysis in 1807?", "Humphry Davy", "Michael Faraday", "John Dalton", "Joseph Priestley"),
    E(5, "In 1849, which French physicist measured the speed of light using a spinning toothed wheel?", "Hippolyte Fizeau", "Léon Foucault", "André-Marie Ampère", "Augustin Fresnel"),
  ],
  // day 16
  [
    E(1, "Which of these is the best electrical insulator?", "Wood", "Copper", "Silver", "Iron"),
    E(2, "Atoms of the same element with different numbers of neutrons are called what?", "Isotopes", "Isomers", "Ions", "Allotropes"),
    E(3, "Which gas law says a gas's volume rises with its absolute temperature when pressure stays constant?", "Charles's law", "Boyle's law", "Dalton's law", "Henry's law"),
    E(4, "What are molecules with the same chemical formula but different structures called?", "Isomers", "Isotopes", "Allotropes", "Polymers"),
    E(5, "One standard atmosphere is defined as exactly how many pascals?", "101,325", "100,000", "101,300", "98,066"),
  ],
  // day 17
  [
    E(1, "Which word describes a material that catches fire easily?", "Flammable", "Soluble", "Magnetic", "Transparent"),
    E(2, "What do chemists call a liquid that dissolves another substance, as water dissolves salt?", "A solvent", "A solute", "A catalyst", "A precipitate"),
    E(3, "At what temperature do the Celsius and Fahrenheit scales show the same number?", "Minus 40", "Minus 32", "Zero", "32"),
    E(4, "What is the three-dimensional shape of a methane molecule?", "Tetrahedral", "Linear", "Square planar", "Trigonal planar"),
    E(5, "Which SI prefix, adopted in 2022, stands for ten to the thirtieth power?", "Quetta", "Ronna", "Yotta", "Zetta"),
  ],
  // day 18
  [
    E(1, "Which temperature scale do weather forecasts in the United States usually use?", "Fahrenheit", "Celsius", "Kelvin", "Rankine"),
    E(2, "Which kind of radiation is used to take pictures of broken bones?", "X-rays", "Microwaves", "Radio waves", "Infrared"),
    E(3, "Since 1959, one inch has been defined as exactly how many centimeters?", "2.54", "2.45", "2.5", "3"),
    E(4, "Formic acid takes its name from the Latin word for which insect?", "Ant", "Bee", "Wasp", "Termite"),
    E(5, "Which element did Hennig Brand discover in 1669 by boiling down urine?", "Phosphorus", "Arsenic", "Sulfur", "Antimony"),
  ],
  // day 19
  [
    E(1, "What builds up when you rub a balloon on your hair so that it clings?", "Static electricity", "Magnetism", "Radiation", "Gravity"),
    E(2, "Which kind of mirror curves inward, like the bowl of a spoon?", "Concave", "Convex", "Flat", "Two-way"),
    E(3, "Which of these is a scalar quantity, with size but no direction?", "Speed", "Velocity", "Acceleration", "Force"),
    E(4, "In the Brønsted-Lowry theory, an acid is a donor of what?", "A proton", "An electron", "A neutron", "An electron pair"),
    E(5, "Mendeleev predicted an element he called eka-aluminum. What is it called today?", "Gallium", "Scandium", "Germanium", "Indium"),
  ],
  // day 20
  [
    E(1, "What do we call a sound that bounces back off a cliff or wall?", "An echo", "A tone", "A chord", "A pitch"),
    E(2, "What is the SI base unit of temperature?", "The kelvin", "The degree Celsius", "The degree Fahrenheit", "The calorie"),
    E(3, "What is the inward force that keeps an object moving in a circle called?", "Centripetal force", "Centrifugal force", "Torque", "Inertia"),
    E(4, "Which American chemist had element 106 named in his honor while he was still alive?", "Glenn Seaborg", "Ernest Lawrence", "Edwin McMillan", "Albert Ghiorso"),
    E(5, "Which English physicist showed in 1913 that the periodic table should be ordered by atomic number?", "Henry Moseley", "Frederick Soddy", "Niels Bohr", "Ernest Rutherford"),
  ],
  // day 21
  [
    E(1, "If you put a blown-up balloon in the freezer, what happens to its size?", "It shrinks", "It grows", "It stays the same", "It pops"),
    E(2, "Which process joins light atomic nuclei together, releasing huge amounts of energy?", "Nuclear fusion", "Nuclear fission", "Radioactive decay", "Combustion"),
    E(3, "Which Greek letter is the symbol for the ohm, the unit of resistance?", "Omega", "Alpha", "Delta", "Lambda"),
    E(4, "What is the effect called when a drop of water skitters across a very hot pan on a layer of its own vapor?", "The Leidenfrost effect", "The Mpemba effect", "The Coanda effect", "The Marangoni effect"),
    E(5, "Which British chemist won the 1964 Nobel Prize for using X-rays to map molecules such as vitamin B12?", "Dorothy Hodgkin", "Rosalind Franklin", "Kathleen Lonsdale", "Ada Yonath"),
  ],
  // day 22
  [
    E(1, "What happens to the particles in a substance when you heat it?", "They move faster", "They move slower", "They stop moving", "They disappear"),
    E(2, "When you push against a solid wall, the wall pushes back on you with how much force?", "An equal force", "A smaller force", "A larger force", "No force"),
    E(3, "Which English scientist's law says a spring stretches in proportion to the force pulling on it?", "Robert Hooke", "Robert Boyle", "Isaac Newton", "Christiaan Huygens"),
    E(4, "The candela is the SI base unit for what?", "Luminous intensity", "Luminous flux", "Illuminance", "Radiant energy"),
    E(5, "Which Swedish chemist introduced the modern one- and two-letter element symbols, such as Fe and Cu, around 1813?", "Jöns Jacob Berzelius", "Carl Wilhelm Scheele", "Svante Arrhenius", "Anders Celsius"),
  ],
  // day 23
  [
    E(1, "What kind of energy is stored in a battery before it is used?", "Chemical energy", "Kinetic energy", "Sound energy", "Nuclear energy"),
    E(2, "Which element gives old streetlights and many fireworks a yellow-orange glow?", "Sodium", "Potassium", "Copper", "Strontium"),
    E(3, "What is sound pitched too high for human ears to hear called?", "Ultrasound", "Infrasound", "Subsonic sound", "White noise"),
    E(4, "Which principle says a system at equilibrium shifts to counteract any change imposed on it?", "Le Chatelier's principle", "Pascal's principle", "Archimedes' principle", "The uncertainty principle"),
    E(5, "In 1884, a small pyramid of which then-precious metal was set atop the Washington Monument?", "Aluminum", "Platinum", "Silver", "Titanium"),
  ],
  // day 24
  [
    E(1, "What happens to water as it freezes into ice?", "It expands", "It shrinks", "It gets heavier", "It turns to gas"),
    E(2, "What are the horizontal rows of the periodic table called?", "Periods", "Groups", "Families", "Series"),
    E(3, "What is an atom called after it has gained or lost electrons?", "An ion", "An isotope", "An isomer", "A molecule"),
    E(4, "Which German chemist, with Fritz Strassmann, discovered nuclear fission in uranium in 1938?", "Otto Hahn", "Enrico Fermi", "Niels Bohr", "Ernest Rutherford"),
    E(5, "In 1936, Carl Anderson and Seth Neddermeyer discovered which heavier cousin of the electron?", "The muon", "The tau", "The pion", "The positron"),
  ],
  // day 25
  [
    E(1, "What forms on the ground when an object blocks a beam of light?", "A shadow", "A reflection", "A rainbow", "An echo"),
    E(2, "On an electric bill, what does a kilowatt-hour measure?", "Energy", "Power", "Current", "Voltage"),
    E(3, "When white light passes through a glass prism, which color bends the most?", "Violet", "Red", "Green", "Yellow"),
    E(4, "Which American physicist measured the charge of the electron with his oil drop experiment?", "Robert Millikan", "Arthur Compton", "Ernest Lawrence", "Albert Michelson"),
    E(5, "Robert Bunsen and Gustav Kirchhoff discovered cesium and which other element using spectroscopy?", "Rubidium", "Strontium", "Thallium", "Indium"),
  ],
  // day 26
  [
    E(1, "What reddish-brown coating forms on iron left out in the rain?", "Rust", "Soot", "Tarnish", "Chalk"),
    E(2, "In the traditional order of rainbow colors, which one comes between yellow and blue?", "Green", "Orange", "Indigo", "Violet"),
    E(3, "Car side mirrors that warn objects are closer than they appear have which shape?", "Convex", "Concave", "Flat", "Cylindrical"),
    E(4, "Copper's symbol Cu comes from the Latin name of which island, an ancient source of the metal?", "Cyprus", "Crete", "Sicily", "Sardinia"),
    E(5, "Which Swedish chemist first produced chlorine gas, in 1774?", "Carl Wilhelm Scheele", "Humphry Davy", "Jöns Jacob Berzelius", "Antoine Lavoisier"),
  ],
  // day 27
  [
    E(1, "In which direction does heat flow on its own?", "From hot to cold", "From cold to hot", "Upward only", "From metal to wood"),
    E(2, "Which metric prefix means one million?", "Mega", "Kilo", "Giga", "Micro"),
    E(3, "Sound waves traveling through air are which type of wave?", "Longitudinal", "Transverse", "Electromagnetic", "Standing"),
    E(4, "The temperature above which a magnet loses its magnetism is named after which scientist?", "Pierre Curie", "Michael Faraday", "André-Marie Ampère", "Hans Christian Ørsted"),
    E(5, "Which physicist proposed that the square of a particle's wave function gives a probability, earning a share of the 1954 Nobel Prize?", "Max Born", "Erwin Schrödinger", "Werner Heisenberg", "Paul Dirac"),
  ],
  // day 28
  [
    E(1, "Which base metric unit of length is a little longer than a yard?", "The meter", "The liter", "The gram", "The kilometer"),
    E(2, "The metric system was first introduced in which country, in the 1790s?", "France", "Britain", "Germany", "Italy"),
    E(3, "Household electricity in the United States alternates at how many cycles per second?", "60", "50", "100", "120"),
    E(4, "Which law gives how sharply a ray of light bends as it passes from one material into another?", "Snell's law", "Hooke's law", "Ohm's law", "Boyle's law"),
    E(5, "In 1923, which American physicist showed that X-rays lose energy when they scatter off electrons, as colliding particles would?", "Arthur Compton", "Robert Millikan", "Ernest Lawrence", "Albert Michelson"),
  ],
  // day 29
  [
    E(1, "When water vapor cools on the outside of a cold glass, the droplets that form come from which process?", "Condensation", "Evaporation", "Melting", "Freezing"),
    E(2, "What is a complete loop that electricity can flow around called?", "A circuit", "A fuse", "A battery", "A switch"),
    E(3, "Lodestone, a naturally magnetic rock, is made of which iron mineral?", "Magnetite", "Hematite", "Pyrite", "Galena"),
    E(4, "Below about 2.17 kelvin, liquid helium-4 turns into what kind of fluid that flows with no viscosity?", "A superfluid", "A plasma", "A supercritical fluid", "A colloid"),
    E(5, "The 1922 Stern-Gerlach experiment sent a beam of which element's atoms through a magnetic field?", "Silver", "Gold", "Sodium", "Hydrogen"),
  ],
  // day 30
  [
    E(1, "Which state of matter keeps a fixed shape of its own?", "Solid", "Liquid", "Gas", "Steam"),
    E(2, "According to legend, Galileo dropped balls of different weights from which landmark?", "The Leaning Tower of Pisa", "Giotto's Campanile", "St. Mark's Campanile", "The Colosseum"),
    E(3, "Besides iron and nickel, which metal is strongly magnetic at room temperature?", "Cobalt", "Copper", "Aluminum", "Zinc"),
    E(4, "Christian Doppler, who explained why a passing siren changes pitch, came from which country?", "Austria", "Germany", "Switzerland", "Netherlands"),
    E(5, "In 1932, John Cockcroft and Ernest Walton split the nuclei of which element with accelerated protons?", "Lithium", "Uranium", "Beryllium", "Nitrogen"),
  ],
  // day 31
  [
    E(1, "On a sunny day, which color of shirt absorbs the most sunlight and gets the hottest?", "Black", "White", "Yellow", "Silver"),
    E(2, "Ignoring air resistance, a heavy ball and a light ball are dropped from the same height. How do they land?", "At the same moment", "The heavy one first", "The light one first", "Whichever is bigger first"),
    E(3, "Optical fibers keep light trapped inside the glass by which effect?", "Total internal reflection", "Refraction", "Diffraction", "Polarization"),
    E(4, "Standard concert pitch tunes the A above middle C to how many hertz?", "440", "400", "432", "512"),
    E(5, "Pierre Curie and his brother Jacques discovered which effect in 1880, in which squeezed crystals produce a voltage?", "Piezoelectricity", "Pyroelectricity", "Thermoelectricity", "Ferroelectricity"),
  ],
  // day 32
  [
    E(1, "Which terminal of a battery is marked with a plus sign?", "The positive terminal", "The negative terminal", "The ground", "The neutral"),
    E(2, "Car tire pressure in the United States is usually given in which unit?", "Pounds per square inch", "Kilograms", "Newtons", "Joules"),
    E(3, "Which American physicist gave his name to diagrams that picture how particles interact?", "Richard Feynman", "Murray Gell-Mann", "Julian Schwinger", "Paul Dirac"),
    E(4, "Raising a musical note by one octave does what to its frequency?", "It doubles", "It halves", "It triples", "It rises by a tenth"),
    E(5, "The series of visible lines in hydrogen's spectrum is named after which Swiss schoolteacher?", "Johann Balmer", "Johannes Rydberg", "Theodore Lyman", "Friedrich Paschen"),
  ],
  // day 33
  [
    E(1, "What is the term for how much space an object takes up?", "Volume", "Mass", "Weight", "Density"),
    E(2, "What is the main ingredient of natural gas?", "Methane", "Propane", "Butane", "Hydrogen"),
    E(3, "Ernest Rutherford, often called the father of nuclear physics, was born in which country?", "New Zealand", "Australia", "Canada", "Scotland"),
    E(4, "Sterling silver must be at least what percent pure silver?", "92.5", "75", "90", "99.9"),
    E(5, "Since 2019, the kelvin has been defined by fixing the exact value of which constant?", "The Boltzmann constant", "The Planck constant", "The Avogadro constant", "The gas constant"),
  ],
  // day 34
  [
    E(1, "Gold, silver and copper are all examples of what?", "Metals", "Gases", "Nonmetals", "Plastics"),
    E(2, "What is an object's mass divided by its volume called?", "Density", "Weight", "Pressure", "Momentum"),
    E(3, "The SI unit of pressure honors which French mathematician and physicist?", "Blaise Pascal", "René Descartes", "Pierre de Fermat", "Joseph Fourier"),
    E(4, "Epsom salt is which chemical compound?", "Magnesium sulfate", "Sodium chloride", "Calcium sulfate", "Potassium nitrate"),
    E(5, "The SI unit of inductance is named after which American scientist?", "Joseph Henry", "Benjamin Franklin", "Josiah Willard Gibbs", "Robert Millikan"),
  ],
  // day 35
  [
    E(1, "Why does a straight spoon standing in a glass of water look bent at the surface?", "Light bends as it passes from water to air", "The spoon really bends", "Water absorbs the light", "Shadows fall on the spoon"),
    E(2, "What do chemists call a solid that forms and settles out of a liquid during a reaction?", "A precipitate", "A solvent", "A catalyst", "A vapor"),
    E(3, "Which of the four fundamental forces of nature is by far the weakest?", "Gravity", "Electromagnetism", "The strong force", "The weak force"),
    E(4, "What is the reaction that turns fats and a strong base into soap called?", "Saponification", "Esterification", "Fermentation", "Hydrogenation"),
    E(5, "The equations that convert space and time between moving observers in special relativity are named after which Dutch physicist?", "Hendrik Lorentz", "Pieter Zeeman", "Heike Kamerlingh Onnes", "Christiaan Huygens"),
  ],
  // day 36
  [
    E(1, "C is the chemical symbol for which element?", "Carbon", "Calcium", "Chlorine", "Copper"),
    E(2, "Which flammable gas filled the airship Hindenburg?", "Hydrogen", "Helium", "Methane", "Neon"),
    E(3, "Which quantum effect did Einstein dismiss as spooky action at a distance?", "Quantum entanglement", "Superposition", "Quantum tunneling", "Wave-particle duality"),
    E(4, "The Copenhagen interpretation of quantum mechanics is most linked with Niels Bohr and which German physicist?", "Werner Heisenberg", "Erwin Schrödinger", "Albert Einstein", "Max Planck"),
    E(5, "Which Swedish chemist won the 1903 Nobel Prize for his theory that salts split into ions in water?", "Svante Arrhenius", "Alfred Nobel", "Jöns Jacob Berzelius", "Carl Wilhelm Scheele"),
  ],
  // day 37
  [
    E(1, "Sound cannot travel through which of these?", "A vacuum", "Water", "Steel", "Air"),
    E(2, "Which state of matter, a gas of electrically charged particles, glows in lightning and neon signs?", "Plasma", "Liquid", "Solid", "Steam"),
    E(3, "Water boils below 100 degrees Celsius on a high mountain because of lower what?", "Air pressure", "Gravity", "Humidity", "Oxygen content"),
    E(4, "Which element, number 117, is named after a US state?", "Tennessine", "Californium", "Americium", "Livermorium"),
    E(5, "In 1919, Ernest Rutherford turned nitrogen into which element by bombarding it with alpha particles?", "Oxygen", "Carbon", "Neon", "Fluorine"),
  ],
  // day 38
  [
    E(1, "What do a positive charge and a negative charge do when brought close together?", "They attract", "They repel", "They ignore each other", "They both vanish"),
    E(2, "Which property describes how thick and slow-flowing a liquid is, like honey compared with water?", "Viscosity", "Density", "Buoyancy", "Surface tension"),
    E(3, "Which element is the most electronegative of all?", "Fluorine", "Oxygen", "Chlorine", "Nitrogen"),
    E(4, "Pure liquid water is densest at close to what temperature in degrees Celsius?", "4", "0", "10", "100"),
    E(5, "In 1908, Heike Kamerlingh Onnes became the first person to liquefy which element?", "Helium", "Hydrogen", "Nitrogen", "Neon"),
  ],
  // day 39
  [
    E(1, "Dry ice is the frozen form of which gas?", "Carbon dioxide", "Nitrogen", "Oxygen", "Helium"),
    E(2, "Which form of energy makes the particles of a substance jiggle faster as it warms up?", "Thermal energy", "Sound energy", "Nuclear energy", "Elastic energy"),
    E(3, "Splitting water with an electric current gives off oxygen and twice as much of which gas?", "Hydrogen", "Nitrogen", "Helium", "Chlorine"),
    E(4, "Which acid is used to etch glass?", "Hydrofluoric acid", "Hydrochloric acid", "Sulfuric acid", "Nitric acid"),
    E(5, "Which Dutch physicist's 1873 equation corrected the ideal gas law for the size of molecules and the pull between them?", "Johannes van der Waals", "Hendrik Lorentz", "Pieter Zeeman", "Heike Kamerlingh Onnes"),
  ],
  // day 40
  [
    E(1, "A magnet picks up steel paper clips because steel is mostly which metal?", "Iron", "Aluminum", "Copper", "Tin"),
    E(2, "What is the amount of force pressing on each unit of area called?", "Pressure", "Density", "Weight", "Tension"),
    E(3, "Which element's name comes from the Greek word for violet, the color of its vapor?", "Iodine", "Indium", "Bromine", "Chlorine"),
    E(4, "Which French physicist showed in 1820 that two parallel wires carrying current pull on or push away from each other?", "André-Marie Ampère", "Charles-Augustin de Coulomb", "Hippolyte Fizeau", "Sadi Carnot"),
    E(5, "The scattering of a light beam by tiny particles in a colloid, which makes the beam visible, is named after which Irish physicist?", "John Tyndall", "Lord Rayleigh", "George Stokes", "William Rowan Hamilton"),
  ],
  // day 41
  [
    E(1, "What do we call the temperature at which a solid turns into a liquid?", "The melting point", "The boiling point", "The dew point", "The flash point"),
    E(2, "What is speed in a stated direction called?", "Velocity", "Momentum", "Acceleration", "Inertia"),
    E(3, "What is the SI unit of electric charge?", "The coulomb", "The ampere", "The volt", "The farad"),
    E(4, "Since 1961, the atomic mass unit has been defined as one twelfth of the mass of an atom of which isotope?", "Carbon-12", "Oxygen-16", "Hydrogen-1", "Carbon-14"),
    E(5, "Which Scottish physicist gave his name to the angle at which light reflected from glass is completely polarized?", "David Brewster", "James Clerk Maxwell", "John Kerr", "Lord Kelvin"),
  ],
  // day 42
  [
    E(1, "A magnifying glass uses what kind of curved glass to make things look bigger?", "A lens", "A mirror", "A prism", "A filter"),
    E(2, "Ca is the chemical symbol for which element?", "Calcium", "Carbon", "Cadmium", "Californium"),
    E(3, "What is the minimum energy needed to get a chemical reaction started called?", "Activation energy", "Kinetic energy", "Bond energy", "Latent heat"),
    E(4, "Months after polonium, which element did Marie and Pierre Curie announce in December 1898?", "Radium", "Uranium", "Radon", "Actinium"),
    E(5, "Which Austrian physicist made the first good estimate of the size of air molecules, in 1865?", "Josef Loschmidt", "Ludwig Boltzmann", "Josef Stefan", "Ernst Mach"),
  ],
  // day 43
  [
    E(1, "Which of these is a gas at room temperature?", "Oxygen", "Iron", "Salt", "Sugar"),
    E(2, "Dissolving sugar in water is what kind of change, since the sugar can be recovered by drying?", "A physical change", "A chemical change", "A nuclear change", "A biological change"),
    E(3, "Mixing which two colors of light makes yellow?", "Red and green", "Red and blue", "Blue and green", "Orange and white"),
    E(4, "In which year did Einstein publish his special theory of relativity?", "1905", "1895", "1915", "1921"),
    E(5, "Which Scottish engineer gave his name to an absolute temperature scale that uses Fahrenheit-sized degrees?", "William Rankine", "Lord Kelvin", "James Watt", "Joseph Black"),
  ],
  // day 44
  [
    E(1, "Which of these is not made of matter?", "Light", "Air", "Water", "Rock"),
    E(2, "Which word describes an element, such as uranium, whose atoms break down and give off radiation?", "Radioactive", "Magnetic", "Inert", "Volatile"),
    E(3, "What is the steady top speed a falling skydiver reaches when air resistance balances their weight?", "Terminal velocity", "Escape velocity", "Critical speed", "Mach speed"),
    E(4, "Which law says the total pressure of a gas mixture equals the sum of each gas's partial pressure?", "Dalton's law", "Boyle's law", "Charles's law", "Henry's law"),
    E(5, "Which Irish physicist coined the word electron, in 1891?", "George Johnstone Stoney", "J. J. Thomson", "George FitzGerald", "John Tyndall"),
  ],
  // day 45
  [
    E(1, "Which word describes something light cannot pass through at all, like a brick wall?", "Opaque", "Transparent", "Translucent", "Reflective"),
    E(2, "He is the chemical symbol for which element?", "Helium", "Hydrogen", "Hafnium", "Holmium"),
    E(3, "Which radioactive noble gas can seep up from the ground and collect in basements?", "Radon", "Xenon", "Krypton", "Argon"),
    E(4, "Beyond which point on a phase diagram can liquid and gas no longer be told apart?", "The critical point", "The triple point", "The boiling point", "The dew point"),
    E(5, "Which German physicist discovered ultraviolet light in 1801, the year after infrared was found?", "Johann Wilhelm Ritter", "William Herschel", "Joseph von Fraunhofer", "Thomas Young"),
  ],
  // day 46
  [
    E(1, "A water molecule is built from three of what?", "Atoms", "Cells", "Crystals", "Grains"),
    E(2, "Newton's second law says force equals mass times what?", "Acceleration", "Velocity", "Distance", "Time"),
    E(3, "Which French chemist, executed in 1794, is often called the father of modern chemistry?", "Antoine Lavoisier", "Robert Boyle", "John Dalton", "Joseph Priestley"),
    E(4, "Which noble gas takes its name from the Greek word for new?", "Neon", "Argon", "Xenon", "Krypton"),
    E(5, "Mercury's symbol Hg comes from its Latinized Greek name. What is that name?", "Hydrargyrum", "Hermes", "Mercurius", "Hydrogenium"),
  ],
  // day 47
  [
    E(1, "On the pH scale, what is the opposite of an acid?", "A base", "A salt", "A metal", "A gas"),
    E(2, "Which unit of length is one thousandth of a meter?", "The millimeter", "The centimeter", "The micrometer", "The decimeter"),
    E(3, "Which isotope of hydrogen has one proton and one neutron?", "Deuterium", "Tritium", "Protium", "Helium-3"),
    E(4, "As of 2024, which element had the highest atomic number on the periodic table?", "Oganesson", "Tennessine", "Livermorium", "Moscovium"),
    E(5, "Which Swiss-born Russian chemist found that the total heat of a reaction is the same whatever route it takes?", "Germain Hess", "Dmitri Mendeleev", "Alexander Butlerov", "Svante Arrhenius"),
  ],
  // day 48
  [
    E(1, "Rubbing two sticks together quickly turns their motion into what?", "Heat", "Light", "Sound", "Electricity"),
    E(2, "Which word describes a liquid that turns to vapor easily, like gasoline or perfume?", "Volatile", "Viscous", "Inert", "Malleable"),
    E(3, "Which type of electromagnetic wave has the longest wavelength?", "Radio waves", "Microwaves", "X-rays", "Gamma rays"),
    E(4, "What is the SI unit of magnetic flux?", "The weber", "The tesla", "The henry", "The gauss"),
    E(5, "In 1828, Friedrich Wöhler made which organic compound from inorganic starting materials, undercutting the idea of a vital force?", "Urea", "Ethanol", "Glucose", "Acetic acid"),
  ],
];
