// Orbit lane: Forces & Energy. SEGMENT 2: days 37 to 63 (2026-12-05 to
// 2026-12-31), 27 days, five tiers a day. Written 2026-11-06.
// gen-science.mjs appends every day in this file after the bank's last day, so
// this file holds ONLY the newest segment; days 1 to 36 (the launch segment)
// are in git history at commit 1260977a and frozen in app/orbit/questions.js.
// Motion, forces, gravity as physics, energy, heat and temperature, light and
// optics, sound and waves, electricity and magnetism, units and measurement,
// simple machines and everyday physics. No astronomy or space (the Space lane),
// no chemistry, biology, human body or who-invented-what.
const C = "Forces & Energy";
const E = (t, q, a, ...d) => ({ c: C, t, q, a, d });

export const LANE_DAYS = [
  // day 37 (Dec 5)
  [
    E(1, "A hot-air balloon rises because the air inside its envelope is what?", "Warmer and less dense than outside air", "Filled with helium", "Pushed up by the burner flame", "Full of steam"),
    E(2, "Lift, weight, thrust and what else make up the four forces on an airplane in flight?", "Drag", "Spin", "Torque", "Momentum"),
    E(3, "Why does a ship float a little higher in seawater than in fresh water?", "Seawater is denser", "Seawater is warmer", "Salt pushes on the hull", "Waves lift the hull"),
    E(4, "Each blade-and-handle half of a pair of scissors works as which type of lever?", "First-class", "Second-class", "Third-class", "It is not a lever"),
    E(5, "Heated past a certain temperature, a permanent magnet loses its magnetism. What is that temperature called?", "The Curie point", "The flash point", "The Debye point", "The dew point"),
  ],
  // day 38 (Dec 6)
  [
    E(1, "When you rub your hands together quickly, what makes them warm?", "Friction", "Static electricity", "Magnetism", "Evaporation"),
    E(2, "A pinhole camera projects an image of the scene that is what?", "Upside down", "Right side up", "Always blurry", "In black and white only"),
    E(3, "Why do clouds look white?", "Their droplets scatter all colors about equally", "They contain white dust", "They give off their own light", "They absorb every color but white"),
    E(4, "At a steady temperature, squeezing a gas into half its volume does what to its pressure?", "It doubles", "It halves", "It stays the same", "It quadruples"),
    E(5, "What is the blue glow in the water around an operating nuclear reactor's core called?", "Cherenkov radiation", "Bremsstrahlung", "Fluorescence", "Synchrotron radiation"),
  ],
  // day 39 (Dec 7)
  [
    E(1, "Which of these is the best electrical insulator?", "Rubber", "Copper", "Aluminum", "Silver"),
    E(2, "About how many volts does a standard car battery supply?", "12", "1.5", "120", "240"),
    E(3, "A 12-volt battery drives current through a 3-ohm resistor. How many amps flow?", "4", "36", "9", "15"),
    E(4, "What is a coil of wire that acts as a magnet when current flows, often pulling in a metal plunger, called?", "A solenoid", "A resistor", "A capacitor", "A transistor"),
    E(5, "What is the lag of a material's magnetization behind the changing field that drives it called?", "Hysteresis", "Remanence", "Coercivity", "Reluctance"),
  ],
  // day 40 (Dec 8)
  [
    E(1, "Sound is made when objects do what?", "Vibrate", "Glow", "Shrink", "Cool down"),
    E(2, "Which of these energy sources is renewable?", "Wind", "Coal", "Oil", "Natural gas"),
    E(3, "One newton is roughly the weight, here on Earth, of which of these?", "A small apple", "A paper clip", "A gallon of milk", "A bowling ball"),
    E(4, "Quartz watch crystals vibrate at a steady rate when a voltage is applied. Which effect is this?", "The piezoelectric effect", "The photoelectric effect", "The thermoelectric effect", "The Hall effect"),
    E(5, "A thermocouple, two different metals joined together, measures temperature using which effect?", "The Seebeck effect", "The Peltier effect", "The Thomson effect", "The Hall effect"),
  ],
  // day 41 (Dec 9)
  [
    E(1, "A parachute slows a falling skydiver by increasing what?", "Air resistance", "Gravity", "Weight", "Speed"),
    E(2, "Two 1.5-volt batteries placed end to end in series supply how many volts?", "3", "1.5", "0.75", "6"),
    E(3, "On a roll of home insulation, what does a higher R-value mean?", "It resists heat flow better", "It conducts heat better", "It is more fireproof", "It is heavier"),
    E(4, "In an inelastic collision, such as two cars crumpling together, which quantity is still conserved?", "Total momentum", "Total kinetic energy", "Each car's speed", "Each car's shape"),
    E(5, "What is the expulsion of a magnetic field from a superconductor, which lets a magnet hover above it, called?", "The Meissner effect", "The Zeeman effect", "The Seebeck effect", "The Josephson effect"),
  ],
  // day 42 (Dec 10)
  [
    E(1, "A crowbar prying up a floorboard is which simple machine?", "A lever", "A pulley", "A wedge", "A screw"),
    E(2, "Wi-Fi and Bluetooth send data using which kind of waves?", "Radio waves", "Sound waves", "X-rays", "Ultraviolet light"),
    E(3, "Sound travels fastest through which of these?", "Steel", "Air", "Water", "Helium"),
    E(4, "Air pressure at sea level is about how many pounds per square inch?", "14.7", "1.5", "32", "100"),
    E(5, "What is the darker band of sky between a primary rainbow and a secondary rainbow called?", "Alexander's band", "Snell's band", "Newton's band", "Brewster's band"),
  ],
  // day 43 (Dec 11)
  [
    E(1, "In which temperature unit do US weather forecasts usually give the day's high?", "Degrees Fahrenheit", "Degrees Celsius", "Kelvins", "Degrees Rankine"),
    E(2, "Why do your ears pop when a plane climbs or descends?", "The outside air pressure changes", "The engines vibrate", "The air gets colder", "The plane speeds up"),
    E(3, "One food Calorie, as printed on a US nutrition label, equals how many small calories?", "1,000", "100", "10", "10,000"),
    E(4, "At about what temperature is fresh water at its densest?", "4 degrees Celsius", "0 degrees Celsius", "10 degrees Celsius", "100 degrees Celsius"),
    E(5, "The common ring seen around the Sun or Moon, made by ice crystals high in the sky, has a radius of about how many degrees?", "22", "42", "10", "90"),
  ],
  // day 44 (Dec 12)
  [
    E(1, "Which toy uses mirrors inside a tube to make repeating, colorful patterns?", "A kaleidoscope", "A periscope", "A yo-yo", "A spinning top"),
    E(2, "Why do ice cubes float in a drink?", "Ice is less dense than liquid water", "Ice is more dense than liquid water", "Cold things always rise", "The drink's sugar holds them up"),
    E(3, "A figure skater pulls her arms in tight during a spin. What happens?", "She spins faster", "She spins slower", "She stops spinning", "She tips over"),
    E(4, "Which floating instrument measures a liquid's density, as when checking antifreeze or brewing beer?", "A hydrometer", "A hygrometer", "A barometer", "A manometer"),
    E(5, "In electronics, what does the Q in a circuit's Q factor stand for?", "Quality", "Quantity", "Quotient", "Quartz"),
  ],
  // day 45 (Dec 13)
  [
    E(1, "What does a car's odometer measure?", "Distance traveled", "Speed", "Fuel level", "Engine heat"),
    E(2, "What do we call a material, like frosted glass, that lets light through but scatters it so you cannot see clearly?", "Translucent", "Transparent", "Opaque", "Reflective"),
    E(3, "In Ohm's law, written V = IR, what does the I stand for?", "Current", "Inductance", "Intensity", "Impedance"),
    E(4, "Road signs and bike reflectors that send light straight back toward its source are called what?", "Retroreflectors", "Diffusers", "Polarizers", "Prisms"),
    E(5, "Blowing across the mouth of an empty bottle makes a tone. What kind of resonator is the bottle acting as?", "A Helmholtz resonator", "A Fabry-Perot resonator", "A Kundt's tube", "A cavity magnetron"),
  ],
  // day 46 (Dec 14)
  [
    E(1, "What does turning the knob on a lamp's dimmer switch change?", "How bright the bulb shines", "The color of the shade", "How long the bulb lasts", "The shape of the beam"),
    E(2, "What is the rate at which work is done called?", "Power", "Energy", "Force", "Momentum"),
    E(3, "In a double rainbow, how does the color order of the fainter outer bow compare with the main bow?", "It is reversed", "It is the same", "It is all one color", "It has no red"),
    E(4, "On a camera lens, a higher f-number means the opening is what?", "Smaller", "Larger", "The same size", "Tinted"),
    E(5, "Which absolute temperature scale uses degrees the same size as Fahrenheit's?", "The Rankine scale", "The Kelvin scale", "The Reaumur scale", "The Celsius scale"),
  ],
  // day 47 (Dec 15)
  [
    E(1, "A hydroelectric dam makes electricity from what?", "Moving water", "Burning coal", "Sunlight", "Wind"),
    E(2, "Why does a black T-shirt feel hotter in the sun than a white one?", "It absorbs more sunlight", "It reflects more sunlight", "It blocks the breeze", "It holds more water"),
    E(3, "One watt equals one joule per what?", "Second", "Minute", "Hour", "Meter"),
    E(4, "Race cars use wings and shaped bodies to press themselves onto the track. What is this force called?", "Downforce", "Lift", "Thrust", "Inertia"),
    E(5, "Which lens flaw makes colored fringes because different colors focus at slightly different points?", "Chromatic aberration", "Spherical aberration", "Astigmatism", "Coma"),
  ],
  // day 48 (Dec 16)
  [
    E(1, "An ordinary incandescent light bulb turns electricity into what?", "Light and heat", "Sound and heat", "Light and sound", "Only light"),
    E(2, "Which of these metals is NOT attracted to a magnet?", "Aluminum", "Iron", "Nickel", "Cobalt"),
    E(3, "The height of a wave from its rest position, which sets how loud a sound is, is called what?", "Amplitude", "Wavelength", "Frequency", "Period"),
    E(4, "Which law says a spring stretches in proportion to the force pulling on it?", "Hooke's law", "Boyle's law", "Ohm's law", "Snell's law"),
    E(5, "At what angle of incidence, named after a Scottish physicist, is light reflected off glass fully polarized?", "Brewster's angle", "The critical angle", "Bragg's angle", "The Rayleigh angle"),
  ],
  // day 49 (Dec 17)
  [
    E(1, "Which of these is a solid at room temperature?", "Butter", "Milk", "Steam", "Air"),
    E(2, "Which way does heat naturally flow between two objects that touch?", "From hotter to colder", "From colder to hotter", "From bigger to smaller", "It never flows on its own"),
    E(3, "Wireless phone chargers pass energy to the phone using what?", "A changing magnetic field", "Infrared light", "Sound waves", "Static electricity"),
    E(4, "Noise-canceling headphones silence outside noise mainly through which effect?", "Destructive interference", "Resonance", "Diffraction", "Refraction"),
    E(5, "At its triple point, where ice, liquid water and water vapor coexist, water's temperature is what?", "0.01 degrees Celsius", "0 degrees Celsius", "Minus 0.5 degrees Celsius", "1 degree Celsius"),
  ],
  // day 50 (Dec 18)
  [
    E(1, "Which of these will float in a bucket of water?", "A pine block", "An iron nail", "A glass marble", "A stone"),
    E(2, "What does maglev, as in maglev trains, stand for?", "Magnetic levitation", "Magnetic leverage", "Maximum gravity level", "Magnetized levers"),
    E(3, "How does the size of one kelvin compare with one degree Celsius?", "They are the same size", "A kelvin is larger", "A kelvin is smaller", "It depends on the temperature"),
    E(4, "A fathom, used to measure water depth, equals how many feet?", "6", "3", "10", "12"),
    E(5, "In what SI units is a spring's stiffness, its spring constant, given?", "Newtons per meter", "Joules per second", "Newton-seconds", "Meters per newton"),
  ],
  // day 51 (Dec 19)
  [
    E(1, "How many inches are in a yard?", "36", "12", "24", "100"),
    E(2, "Why are static shocks from doorknobs more common in winter?", "The air is drier", "Metal conducts better in the cold", "The days are shorter", "Snow carries electric charge"),
    E(3, "At sea level, the speed of sound in air is about how many miles per hour?", "About 760", "About 76", "About 7,600", "About 186,000"),
    E(4, "Power companies send electricity over long lines at very high voltage mainly to do what?", "Cut the energy lost as heat", "Make the current flow faster", "Keep birds off the wires", "Make the lines safer to touch"),
    E(5, "Which switch is flipped by an electromagnet, letting a small current control a much larger one?", "A relay", "A rheostat", "A fuse", "A diode"),
  ],
  // day 52 (Dec 20)
  [
    E(1, "What kind of mirror is an ordinary bathroom mirror?", "A flat mirror", "A curved mirror", "A magnifying mirror", "A two-way mirror"),
    E(2, "Why does wet skin feel cold in a breeze?", "Evaporating water draws off heat", "Wind is always colder than skin", "Water lets cold soak in", "Wet skin shrinks"),
    E(3, "Absolute zero is about how many degrees Celsius?", "Minus 273", "Minus 100", "Minus 460", "Minus 40"),
    E(4, "A mix of cornstarch and water that turns firm when you strike it is an example of what?", "A non-Newtonian fluid", "A superfluid", "An ideal gas", "A plasma"),
    E(5, "A British thermal unit is the heat needed to warm one pound of water by how much?", "1 degree Fahrenheit", "1 degree Celsius", "10 degrees Fahrenheit", "1 kelvin"),
  ],
  // day 53 (Dec 21)
  [
    E(1, "Which of these is NOT a form of energy?", "Weight", "Heat", "Light", "Sound"),
    E(2, "In a tug-of-war where the rope does not move, how do the two teams' pulls compare?", "They are equal", "The left team pulls harder", "The heavier team pulls harder", "Neither team is pulling"),
    E(3, "A car travels 150 miles in 3 hours. What is its average speed in miles per hour?", "50", "45", "60", "450"),
    E(4, "A sound that rises by 20 decibels has grown how many times in intensity?", "100", "2", "40", "1,000"),
    E(5, "Which flat, ridged lens design, first used in lighthouses, focuses light like a far thicker lens?", "A Fresnel lens", "A Barlow lens", "A meniscus lens", "A Fraunhofer lens"),
  ],
  // day 54 (Dec 22)
  [
    E(1, "Which household tool uses a lever to pull nails out of wood?", "A claw hammer", "A screwdriver", "A wrench", "A drill"),
    E(2, "Ball bearings in a skateboard wheel help it roll freely by reducing what?", "Friction", "Weight", "Momentum", "Air pressure"),
    E(3, "What are the bright, colored spots sometimes seen on either side of a low Sun, made by ice crystals, called?", "Sundogs", "Moonbows", "Fogbows", "Glories"),
    E(4, "A pulley system with four supporting rope sections lifts a 600-newton load. Ignoring friction, about how hard must you pull, in newtons?", "150", "600", "300", "2,400"),
    E(5, "The lux is the SI unit of what?", "Illuminance", "Luminous intensity", "Luminous flux", "Radiant power"),
  ],
  // day 55 (Dec 23)
  [
    E(1, "How many pints are in a quart?", "2", "4", "8", "16"),
    E(2, "Which of these makes the best heat insulator for a picnic cooler?", "Plastic foam", "Copper", "Steel", "Aluminum"),
    E(3, "Polarized sunglasses cut glare mainly from light reflected off which kind of surfaces?", "Flat, shiny ones like water", "Rough, dark ones like asphalt", "Glowing ones like bulbs", "Curved ones like mirrors"),
    E(4, "What is a liquid laced with tiny magnetic particles, which forms spikes near a magnet, called?", "A ferrofluid", "A superfluid", "An electrolyte", "A plasma"),
    E(5, "By the Stefan-Boltzmann law, a black body's radiated power is proportional to what?", "Its absolute temperature to the fourth power", "Its absolute temperature squared", "Its absolute temperature", "Its absolute temperature cubed"),
  ],
  // day 56 (Dec 24)
  [
    E(1, "Which of these gives off its own light?", "A candle flame", "The Moon", "A mirror", "A window"),
    E(2, "An astronaut floating in space throws a wrench forward. What happens to the astronaut?", "They drift backward", "They stay perfectly still", "They drift forward", "They start to spin"),
    E(3, "Why is a door easier to open if you push near the handle, far from the hinges?", "It gives more torque", "The door is lighter there", "There is less friction there", "The air pushes back less"),
    E(4, "In relativity, what is the slowing of a fast-moving clock, as measured by an observer at rest, called?", "Time dilation", "Length contraction", "Redshift", "Time reversal"),
    E(5, "What is the SI unit of inductance?", "The henry", "The weber", "The farad", "The siemens"),
  ],
  // day 57 (Dec 25)
  [
    E(1, "Sleds speed up on a snowy hill because of which force?", "Gravity", "Magnetism", "Static electricity", "Lift"),
    E(2, "A shiny round glass ornament on a tree reflects the room like which kind of mirror?", "A convex mirror", "A concave mirror", "A flat mirror", "A two-way mirror"),
    E(3, "What is a single particle of light called?", "A photon", "A proton", "A neutron", "An electron"),
    E(4, "Electric cars recover energy while braking by running their motor as what?", "A generator", "A transformer", "A battery", "A capacitor"),
    E(5, "Which effect makes a compressed gas cool as it expands through a valve, the effect used to liquefy air?", "The Joule-Thomson effect", "The Seebeck effect", "The Leidenfrost effect", "The Meissner effect"),
  ],
  // day 58 (Dec 26)
  [
    E(1, "How does an electric fan cool you on a hot day?", "It moves air across your skin", "It makes the room's air colder", "It removes heat from the room", "It adds moisture to the air"),
    E(2, "How many yards are in a mile?", "1,760", "5,280", "1,000", "2,000"),
    E(3, "A singer holds a note that makes a wine glass vibrate wildly. What is this matching of a natural frequency called?", "Resonance", "Refraction", "Dispersion", "Convection"),
    E(4, "How many base units does the International System of Units (SI) define?", "Seven", "Five", "Ten", "Twelve"),
    E(5, "On a polarized US plug, which of the two flat blades is wider?", "The neutral", "The hot", "Neither; both match", "It varies by maker"),
  ],
  // day 59 (Dec 27)
  [
    E(1, "At sea level, what does pure water do at 212 degrees Fahrenheit?", "It boils", "It freezes", "It glows", "It turns to ice"),
    E(2, "In Einstein's E = mc squared, what does the c stand for?", "The speed of light", "The speed of sound", "The charge of an electron", "The heat capacity"),
    E(3, "One pound is about how many kilograms?", "0.45", "2.2", "0.1", "1.5"),
    E(4, "A ramp 12 meters long rises 3 meters. Ignoring friction, what is its mechanical advantage?", "4", "3", "9", "36"),
    E(5, "The electronvolt, a tiny unit used in particle physics, measures what?", "Energy", "Voltage", "Charge", "Current"),
  ],
  // day 60 (Dec 28)
  [
    E(1, "Which of these makes its sound by vibrating a stretched skin?", "A drum", "A flute", "A trumpet", "A whistle"),
    E(2, "What is the SI unit of pressure?", "The pascal", "The newton", "The joule", "The bar"),
    E(3, "In a four-stroke engine, which stroke comes right after the intake stroke?", "Compression", "Power", "Exhaust", "Ignition"),
    E(4, "Which machine, with a moving belt and a hollow metal dome, builds up enough static charge to make hair stand on end?", "A Van de Graaff generator", "A Tesla coil", "A Leyden jar", "A dynamo"),
    E(5, "The swirling colors on a soap bubble come from which effect?", "Thin-film interference", "Chromatic aberration", "Rayleigh scattering", "Fluorescence"),
  ],
  // day 61 (Dec 29)
  [
    E(1, "Why can you see your breath on a cold morning?", "Water vapor in it condenses", "Your breath freezes into snow", "Cold air is visible", "It carries dust from your lungs"),
    E(2, "Which of these needs a medium, such as air or water, to travel through?", "Sound", "Light", "Radio waves", "X-rays"),
    E(3, "In a Newton's cradle, a single end ball is pulled back and released. How many balls swing out from the far end?", "One", "Two", "None", "All of them"),
    E(4, "Visible light spans wavelengths of roughly 400 to 700 of which unit?", "Nanometers", "Micrometers", "Millimeters", "Picometers"),
    E(5, "In an AC circuit, what is the combined opposition to current from resistance and reactance called?", "Impedance", "Inductance", "Conductance", "Admittance"),
  ],
  // day 62 (Dec 30)
  [
    E(1, "Which of these is the best conductor of electricity?", "Copper", "Glass", "Rubber", "Wood"),
    E(2, "Which part of a guitar amplifier turns the electrical signal into sound?", "The speaker", "The cable", "The pickup", "The volume knob"),
    E(3, "Which kind of mirror is used for makeup or shaving because it magnifies a face held close?", "A concave mirror", "A convex mirror", "A flat mirror", "A two-way mirror"),
    E(4, "A 60-kilogram person climbs 5 meters of stairs. About how much gravitational potential energy do they gain, in joules?", "About 3,000", "About 300", "About 30,000", "About 65"),
    E(5, "Which law says the magnetic field around a closed loop is proportional to the electric current passing through it?", "Ampere's law", "Gauss's law", "Faraday's law", "Coulomb's law"),
  ],
  // day 63 (Dec 31)
  [
    E(1, "What does flipping a wall switch to off do to a lamp's circuit?", "Opens a gap in it", "Fills it with charge", "Reverses its current", "Cools its wires"),
    E(2, "What is the forward push produced by a rocket or jet engine called?", "Thrust", "Lift", "Drag", "Torque"),
    E(3, "The upper limit of hearing for a young person is about how many hertz?", "20,000", "2,000", "200,000", "200"),
    E(4, "What is a room built to soak up all sound, so that there are no echoes, called?", "An anechoic chamber", "An echo chamber", "A reverb room", "A sound stage"),
    E(5, "Which tube on an aircraft measures airspeed from the pressure of the oncoming air?", "A pitot tube", "A Geissler tube", "A Bourdon tube", "A Crookes tube"),
  ],
];
