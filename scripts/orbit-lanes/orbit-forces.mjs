// Orbit lane: Forces & Energy. 36 days, five tiers a day.
// Motion, forces, gravity as physics, energy, heat and temperature, light and
// optics, sound and waves, electricity and magnetism, units and measurement,
// simple machines and everyday physics. No astronomy or space (the Space lane),
// no chemistry, biology, human body or who-invented-what.
const C = "Forces & Energy";
const E = (t, q, a, ...d) => ({ c: C, t, q, a, d });

export const LANE_DAYS = [
  // day 1
  [
    E(1, "What is the swinging weight that keeps time in a grandfather clock called?", "A pendulum", "A flywheel", "A metronome", "A balance spring"),
    E(2, "Why do many metal pots have wooden or plastic handles?", "Those materials conduct heat poorly", "Those materials are magnetic", "They make the pot heat faster", "They keep the pot from rusting"),
    E(3, "When you sip through a straw, what actually pushes the drink up into your mouth?", "Outside air pressure", "The pull of your tongue", "Surface tension", "Capillary action"),
    E(4, "Car hydraulic brakes rely on which principle, that pressure in a confined fluid spreads equally throughout?", "Pascal's principle", "Bernoulli's principle", "Archimedes' principle", "Hooke's law"),
    E(5, "A tightrope walker's long pole mainly helps by increasing what?", "Moment of inertia", "Walking speed", "Air resistance", "Friction on the rope"),
  ],
  // day 2
  [
    E(1, "What do we call a material, such as copper wire, that lets electricity flow through it easily?", "A conductor", "An insulator", "A resistor", "A magnet"),
    E(2, "What happens to the thin wire inside a fuse when too much current flows?", "It melts", "It glows brighter", "It becomes magnetic", "It stretches"),
    E(3, "A hot day of 100 degrees Fahrenheit is closest to how many degrees Celsius?", "38", "32", "45", "56"),
    E(4, "What is the shortest flat wall mirror in which you can see your whole body, head to toe?", "Half your height", "Your full height", "A quarter of your height", "Two-thirds of your height"),
    E(5, "A primary rainbow forms a circle of about what angular radius around the point directly opposite the Sun?", "42 degrees", "23 degrees", "60 degrees", "90 degrees"),
  ],
  // day 3
  [
    E(1, "The threaded lid of a jar works as which simple machine?", "A screw", "A wedge", "A lever", "A pulley"),
    E(2, "In which kind of circuit does one burned-out bulb make every other bulb go dark?", "A series circuit", "A parallel circuit", "A short circuit", "A grounded circuit"),
    E(3, "A 1,200-watt hair dryer on a 120-volt outlet draws how many amps?", "10", "1", "20", "100"),
    E(4, "One mechanical horsepower is roughly how many watts?", "746", "100", "250", "1,000"),
    E(5, "If you double both the length and the cross-sectional area of a wire, what happens to its resistance?", "It stays the same", "It doubles", "It halves", "It quadruples"),
  ],
  // day 4
  [
    E(1, "In a desk fan, which part turns electrical energy into spinning motion?", "The electric motor", "The power cord", "The switch", "The blades"),
    E(2, "What is the highest point of a wave called?", "The crest", "The trough", "The node", "The amplitude"),
    E(3, "The image you see in a flat mirror, which cannot be caught on a screen, is called what?", "A virtual image", "A real image", "An inverted image", "A projected image"),
    E(4, "If a car's speed doubles, its braking distance becomes roughly how many times longer?", "Four", "Two", "Three", "Eight"),
    E(5, "What is the angle between magnetic north and true north at a given place called?", "Declination", "Inclination", "Deviation", "Azimuth"),
  ],
  // day 5
  [
    E(1, "At a power plant, which machine turns spinning motion into electricity?", "A generator", "A transformer", "A battery", "A capacitor"),
    E(2, "Which type of electromagnetic radiation has the shortest wavelength?", "Gamma rays", "X-rays", "Ultraviolet", "Microwaves"),
    E(3, "If the distance between two objects doubles, what happens to the gravitational pull between them?", "It falls to one quarter", "It halves", "It stays the same", "It grows fourfold"),
    E(4, "Car airbags reduce injury mainly by doing what?", "Making the stop take longer", "Pushing the body backward", "Absorbing sound from the crash", "Cooling the passenger"),
    E(5, "Rolling from rest without slipping down the same ramp, which of these reaches the bottom first?", "A solid ball", "A solid cylinder", "A hollow pipe", "A hollow ball"),
  ],
  // day 6
  [
    E(1, "How many seconds are there in one hour?", "3,600", "360", "1,000", "6,000"),
    E(2, "Standard wall outlets in the United States supply about how many volts?", "120", "12", "60", "400"),
    E(3, "What is water creeping up a narrow glass tube or into a paper towel called?", "Capillary action", "Osmosis", "Diffusion", "Condensation"),
    E(4, "Ignoring air resistance, about how far does a dropped stone fall in its first second, in meters?", "About 5", "About 1", "About 10", "About 20"),
    E(5, "The ratio of a ball's speed just after a bounce to its speed just before is called the coefficient of what?", "Restitution", "Friction", "Elasticity", "Rebound"),
  ],
  // day 7
  [
    E(1, "Which of these will a magnet pick up?", "An iron nail", "A copper penny", "An aluminum can", "A glass marble"),
    E(2, "In FM radio, what does the F stand for?", "Frequency", "Field", "Fidelity", "Fixed"),
    E(3, "Why does a pressure cooker cook food faster than an open pot?", "It raises water's boiling point", "It lowers water's boiling point", "It traps microwaves inside", "It removes the air from food"),
    E(4, "A wheelbarrow, with the load between the wheel and your hands, is which class of lever?", "Second-class", "First-class", "Third-class", "Fourth-class"),
    E(5, "Pure water has a refractive index of about what?", "1.33", "1.00", "1.50", "2.42"),
  ],
  // day 8
  [
    E(1, "When you pluck a guitar string harder, what happens to its sound?", "It gets louder", "It gets higher", "It gets lower", "It gets quieter"),
    E(2, "Tightening a guitar string does what to the note it plays?", "Raises its pitch", "Lowers its pitch", "Makes it quieter", "Leaves it unchanged"),
    E(3, "Why can a bird perch safely on a single bare power line?", "Both its feet are at the same voltage", "Its feathers insulate it", "The wire carries no current", "Birds are immune to shocks"),
    E(4, "Standard induction cooktops work with pans made of which kind of material?", "Magnetic metal such as iron", "Any metal at all", "Copper or aluminum only", "Glass or ceramic"),
    E(5, "A pipe closed at one end can sound only which of its harmonics?", "The odd ones", "The even ones", "Only the first", "All of them"),
  ],
  // day 9
  [
    E(1, "When a bus brakes suddenly, which way do standing passengers lurch?", "Forward", "Backward", "Straight up", "Straight down"),
    E(2, "On a cold night, how does the heat of a campfire reach your face across the open air?", "Radiation", "Conduction", "Convection", "Evaporation"),
    E(3, "Light waves are which type of wave?", "Transverse", "Longitudinal", "Compressional", "Seismic"),
    E(4, "A ball is thrown level off a cliff as a second ball is dropped from the same spot. Ignoring air, which lands first?", "They land at the same time", "The thrown ball", "The dropped ball", "Whichever is heavier"),
    E(5, "If the current through a resistor doubles, the heat it gives off each second is multiplied by how much?", "Four", "Two", "Eight", "Sixteen"),
  ],
  // day 10
  [
    E(1, "Which gauge on a car's dashboard shows how fast you are going?", "The speedometer", "The odometer", "The tachometer", "The fuel gauge"),
    E(2, "A sound wave with a higher frequency is heard as a higher what?", "Pitch", "Volume", "Echo", "Tempo"),
    E(3, "How much work does it take to lift a 10-newton weight up 2 meters, in joules?", "20", "5", "12", "200"),
    E(4, "As a copper wire heats up, what happens to its electrical resistance?", "It rises", "It falls", "It stays the same", "It drops to zero"),
    E(5, "An ideal black body absorbs what share of the light that falls on it?", "All of it", "Half of it", "About 90 percent", "Only the visible part"),
  ],
  // day 11
  [
    E(1, "On the decibel scale, a higher number means a sound is what?", "Louder", "Quieter", "Higher pitched", "Farther away"),
    E(2, "Outside a bar magnet, its magnetic field lines run in which direction?", "From north pole to south pole", "From south pole to north pole", "In circles around the middle", "Straight out from the center"),
    E(3, "By Archimedes' principle, a floating boat pushes aside how much water?", "As much as the boat weighs", "Half of what it weighs", "Twice what it weighs", "Exactly its own volume"),
    E(4, "On circuit diagrams, conventional current flows in which direction compared with the electrons?", "The opposite direction", "The same direction", "At right angles", "It depends on the voltage"),
    E(5, "The siemens is the SI unit of what?", "Electrical conductance", "Electrical resistance", "Magnetic flux", "Capacitance"),
  ],
  // day 12
  [
    E(1, "How many inches are in one foot?", "12", "10", "16", "36"),
    E(2, "TV remote controls usually send their signals using which kind of light?", "Infrared", "Ultraviolet", "X-rays", "Visible blue light"),
    E(3, "Why does the sea warm up more slowly than the land on a summer day?", "Water has a high specific heat", "Salt blocks the sunlight", "Water reflects all sunlight", "Waves cool the surface"),
    E(4, "A bulb labeled 2,700 K gives light that looks how, compared with one labeled 5,000 K?", "Warmer and more yellow", "Cooler and bluer", "Brighter", "Dimmer"),
    E(5, "In equal temperament, each semitone multiplies the frequency by what factor?", "The twelfth root of 2", "The square root of 2", "The cube root of 2", "Three halves"),
  ],
  // day 13
  [
    E(1, "A kilogram of feathers and a kilogram of iron: how do their masses compare?", "They are equal", "The iron's is greater", "The feathers' is greater", "It depends on gravity"),
    E(2, "In LED, the name of a common kind of light bulb, what does the D stand for?", "Diode", "Display", "Device", "Discharge"),
    E(3, "A 10-tooth gear drives a 40-tooth gear. How many turns does the small gear make for each turn of the big one?", "4", "2", "10", "40"),
    E(4, "Why does a scald from steam at 100 degrees Celsius usually do more harm than one from water at the same temperature?", "Steam gives off extra heat as it condenses", "Steam is really much hotter", "Steam moves faster than water", "Steam carries more oxygen"),
    E(5, "An ideal heat engine runs between 600 kelvins and 300 kelvins. What is its maximum possible efficiency?", "50 percent", "25 percent", "67 percent", "100 percent"),
  ],
  // day 14
  [
    E(1, "Which invisible part of sunlight causes sunburn?", "Ultraviolet light", "Infrared light", "Radio waves", "Microwaves"),
    E(2, "Which property of an object stays the same no matter where in the universe it goes?", "Its mass", "Its weight", "Its acceleration when dropped", "Its reading on a bathroom scale"),
    E(3, "A wave's speed equals its frequency multiplied by its what?", "Wavelength", "Amplitude", "Period", "Energy"),
    E(4, "Ordinary window glass blocks most of which kind of ultraviolet light?", "UVB", "UVA", "Visible violet", "Near infrared"),
    E(5, "At the same driving pressure, doubling the radius of a pipe multiplies its smooth, laminar flow by about how much?", "16", "2", "4", "8"),
  ],
  // day 15
  [
    E(1, "Which safety switch in a home's electrical panel shuts off power when too much current flows?", "A circuit breaker", "A transformer", "A thermostat", "A dimmer switch"),
    E(2, "Which SI unit measures energy and work?", "The joule", "The newton", "The watt", "The volt"),
    E(3, "A 100-watt bulb left on for 10 hours uses how many kilowatt-hours?", "1", "10", "100", "1,000"),
    E(4, "In a hydraulic jack, a 2-square-inch piston pushes on a 100-square-inch one. The force is multiplied by how much?", "50", "5", "25", "200"),
    E(5, "One tesla equals how many gauss?", "10,000", "10", "100", "1,000"),
  ],
  // day 16
  [
    E(1, "Filling a box with books makes it harder to slide across the floor. Why?", "It presses down harder, adding friction", "Books are pulled toward the floor by magnetism", "The air inside gets heavier", "Paper soaks up the push"),
    E(2, "Near Earth's surface, a falling object speeds up by about how many meters per second every second?", "9.8", "4.9", "1.6", "98"),
    E(3, "A tall, loaded truck tips over in a sharp turn more easily than a low sports car because its what is higher?", "Center of gravity", "Momentum", "Top speed", "Tire friction"),
    E(4, "One kilowatt-hour equals how many joules?", "3.6 million", "1,000", "60,000", "1 billion"),
    E(5, "A pendulum that takes one second for each swing, so two seconds for a full back-and-forth, is about how long?", "1 meter", "25 centimeters", "2 meters", "10 meters"),
  ],
  // day 17
  [
    E(1, "What is the shimmering 'pool of water' you seem to see on a hot road in summer?", "A mirage", "An oil slick", "Heat lightning", "A puddle of tar"),
    E(2, "A loaded truck and a bicycle move at the same speed. Why is the truck harder to stop?", "It has more momentum", "It has less friction", "It has more inertia per pound", "Its engine keeps pushing"),
    E(3, "Room temperature, about 20 degrees Celsius, is about how many kelvins?", "293", "20", "253", "373"),
    E(4, "Why is it harder to start a heavy box moving across the floor than to keep it going?", "Static friction exceeds kinetic friction", "Gravity is stronger on still objects", "Air resistance drops once moving", "Inertia vanishes once moving"),
    E(5, "Which dimensionless number predicts whether a fluid's flow will be smooth or turbulent?", "The Reynolds number", "The Mach number", "The Prandtl number", "The Froude number"),
  ],
  // day 18
  [
    E(1, "How many ounces are in a pound?", "16", "8", "12", "20"),
    E(2, "The head of an ax, which splits wood apart, is which simple machine?", "A wedge", "A lever", "A screw", "A pulley"),
    E(3, "A single fixed pulley, like one at the top of a well, gives no gain in force. What does it change?", "The direction of the pull", "The weight of the load", "The height of the lift", "The mass of the rope"),
    E(4, "Breathing helium makes your voice sound higher mainly because sound does what in helium?", "Travels faster", "Travels slower", "Gets louder", "Loses its echo"),
    E(5, "An FM station broadcasting at 100 megahertz sends out waves about how long?", "3 meters", "3 centimeters", "30 meters", "300 meters"),
  ],
  // day 19
  [
    E(1, "Why does a spinning top eventually slow down and fall over?", "Friction with the floor and air", "Gravity switches off its spin", "It runs out of magnetism", "The air pushes it sideways"),
    E(2, "A moving object's kinetic energy depends on its mass and what else?", "Its speed", "Its height", "Its color", "Its temperature"),
    E(3, "As you fill a bottle from a tap, why does the sound rise in pitch?", "The air space above the water shrinks", "The water gets warmer", "The flow speeds up", "The water pressure falls"),
    E(4, "Which law says an induced current always flows so as to oppose the change that produced it?", "Lenz's law", "Ohm's law", "Coulomb's law", "Hooke's law"),
    E(5, "One international nautical mile is defined as exactly how many meters?", "1,852", "1,609", "1,000", "2,000"),
  ],
  // day 20
  [
    E(1, "In an old-fashioned incandescent bulb, which part glows?", "The filament", "The glass globe", "The metal base", "The gas inside"),
    E(2, "The metric prefix giga- means how many?", "One billion", "One million", "One thousand", "One trillion"),
    E(3, "Besides black, which three ink colors does a typical color printer use?", "Cyan, magenta and yellow", "Red, green and blue", "Red, yellow and blue", "Orange, green and violet"),
    E(4, "An acre is defined as how many square feet?", "43,560", "10,000", "5,280", "100,000"),
    E(5, "Magnetic brakes on roller coasters slow the cars by inducing what in metal fins?", "Eddy currents", "Static charges", "Superconductivity", "Thermal currents"),
  ],
  // day 21
  [
    E(1, "Through the wall from a neighbor's party, which part of the music do you mostly hear?", "The bass", "The vocals", "The cymbals", "The high notes"),
    E(2, "A toaster mainly turns electrical energy into what?", "Heat", "Light", "Sound", "Motion"),
    E(3, "Ignoring air resistance, at what launch angle does a ball thrown over level ground travel farthest?", "45 degrees", "30 degrees", "60 degrees", "90 degrees"),
    E(4, "Since opposite poles attract, the magnetic pole near Earth's geographic North Pole is physically what kind of pole?", "A magnetic south pole", "A magnetic north pole", "A neutral pole", "No pole at all"),
    E(5, "In a vacuum, how does the speed of red light compare with violet light?", "Exactly the same", "Red is faster", "Violet is faster", "It depends on brightness"),
  ],
  // day 22
  [
    E(1, "How many minutes are there in one day?", "1,440", "1,200", "2,400", "3,600"),
    E(2, "What does an ammeter measure?", "Electric current", "Voltage", "Resistance", "Power"),
    E(3, "While ice is melting in a well-stirred glass of ice water, what does the mixture's temperature do?", "Stays at 0 degrees Celsius", "Rises steadily", "Falls steadily", "Swings up and down"),
    E(4, "What is the upward push of a table on a book resting on it called?", "The normal force", "Friction", "Tension", "Buoyancy"),
    E(5, "Home microwave ovens typically run at about what frequency?", "2.45 gigahertz", "60 hertz", "100 megahertz", "24 gigahertz"),
  ],
  // day 23
  [
    E(1, "Two identical sheets of paper are dropped together, one flat and one squeezed into a ball. Which lands first?", "The balled-up one", "The flat one", "They land together", "It varies at random"),
    E(2, "Which kind of lens, thicker in the middle than at the edges, brings light to a focus?", "A convex lens", "A concave lens", "A flat lens", "A diverging lens"),
    E(3, "Which of these is not one of the six classical simple machines?", "The spring", "The wedge", "The screw", "The pulley"),
    E(4, "A heat pump warms a house in winter mainly by doing what?", "Moving heat in from outdoors", "Burning fuel indoors", "Running electric heating coils", "Storing summer heat underground"),
    E(5, "In standard tuning, middle C has a frequency of about how many hertz?", "262", "131", "330", "440"),
  ],
  // day 24
  [
    E(1, "How many quarts are in a gallon?", "4", "2", "8", "16"),
    E(2, "As air warms up, what happens to the speed of sound through it?", "It increases", "It decreases", "It stays the same", "It drops to zero"),
    E(3, "What quality of sound lets you tell a violin from a flute playing the same note?", "Timbre", "Pitch", "Amplitude", "Tempo"),
    E(4, "Diving in the sea, the water pressure rises by about one atmosphere for every how many meters of depth?", "10", "1", "50", "100"),
    E(5, "Which law of thermodynamics implies that absolute zero can never actually be reached?", "The third law", "The first law", "The second law", "The zeroth law"),
  ],
  // day 25
  [
    E(1, "On a seesaw, where should a heavier adult sit to balance a light child?", "Closer to the middle", "Farther from the middle", "Right at the very end", "Directly on the pivot"),
    E(2, "An object travels 100 meters in 20 seconds. What is its average speed in meters per second?", "5", "2", "20", "120"),
    E(3, "Glasses that correct nearsightedness use which kind of lens?", "Concave (diverging)", "Convex (converging)", "Cylindrical", "Prismatic"),
    E(4, "Per photon, how does blue light's energy compare with red light's?", "Blue carries more", "Red carries more", "They are equal", "It depends on brightness"),
    E(5, "Rayleigh scattering, which colors the sky, grows with which power of the light's frequency?", "The fourth power", "The first power", "The second power", "The third power"),
  ],
  // day 26
  [
    E(1, "What are the two ends of a bar magnet called?", "Its poles", "Its terminals", "Its nodes", "Its anodes"),
    E(2, "Counting five seconds between a lightning flash and its thunder means the strike was roughly how far away?", "About 1 mile", "About 100 feet", "About 5 miles", "About 50 miles"),
    E(3, "Which change makes a pendulum swing back and forth more slowly?", "Lengthening its string", "Shortening its string", "Using a heavier bob", "Using a lighter bob"),
    E(4, "In the physics sense, how much work do you do on a bag you carry at a steady height across a level room?", "None", "Its weight times the distance", "Half its weight times the distance", "Its mass times the distance"),
    E(5, "Melting one gram of ice at 0 degrees Celsius takes about how many joules?", "334", "4", "100", "2,260"),
  ],
  // day 27
  [
    E(1, "When you hang a weight on a spring, what happens to the spring?", "It stretches", "It shrinks", "It melts", "It spins"),
    E(2, "One mile is about how many kilometers?", "1.6", "0.6", "2.2", "3.1"),
    E(3, "Why does a metal bench feel colder than a wooden one at the same temperature?", "Metal conducts heat away faster", "Metal is actually colder", "Wood makes its own heat", "Metal reflects body heat"),
    E(4, "If an elevator's cable snapped and it fell freely, what would a bathroom scale inside read for you?", "Zero", "Your normal weight", "Double your weight", "Half your weight"),
    E(5, "An eyeglass lens of plus 2 diopters has a focal length of how many centimeters?", "50", "2", "20", "200"),
  ],
  // day 28
  [
    E(1, "How many meters are in a kilometer?", "1,000", "100", "500", "10,000"),
    E(2, "If you snap a bar magnet in half, what do you get?", "Two magnets, each with two poles", "One north piece and one south piece", "Two pieces with no magnetism", "One magnet and one plain piece"),
    E(3, "What is the total resistance of two 6-ohm resistors connected in series?", "12 ohms", "3 ohms", "6 ohms", "36 ohms"),
    E(4, "Tuning forks of 440 and 442 hertz sounded together make a pulsing beat how many times per second?", "2", "1", "4", "441"),
    E(5, "In glass with a refractive index of 1.5, light travels at about how many kilometers per second?", "200,000", "150,000", "300,000", "450,000"),
  ],
  // day 29
  [
    E(1, "When a car turns sharply, you feel pushed toward which side?", "The outside of the turn", "The inside of the turn", "Straight forward", "Straight down"),
    E(2, "A fresh standard AA alkaline battery supplies about how many volts?", "1.5", "3", "9", "12"),
    E(3, "Which change makes an electromagnet stronger?", "Adding more turns of wire", "Using a plastic core", "Lowering the current", "Reversing the current"),
    E(4, "One calorie, the heat that warms a gram of water by 1 degree Celsius, equals about how many joules?", "4.2", "1", "9.8", "42"),
    E(5, "Kirchhoff's current law, that currents into a junction equal currents out, rests on the conservation of what?", "Electric charge", "Energy", "Momentum", "Mass"),
  ],
  // day 30
  [
    E(1, "Which kind of household light bulb uses the least electricity for the same light?", "LED", "Incandescent", "Halogen", "Heat lamp"),
    E(2, "Radio waves, visible light and X-rays are all forms of what?", "Electromagnetic radiation", "Sound waves", "Nuclear radiation", "Static electricity"),
    E(3, "In an ordinary single rainbow, which color runs along the outer edge of the arc?", "Red", "Violet", "Blue", "Green"),
    E(4, "In which class of lever, such as a pair of tweezers, is the effort applied between the pivot and the load?", "Third-class", "First-class", "Second-class", "Compound"),
    E(5, "Since 2019, the kilogram has been defined by fixing the exact value of which constant?", "The Planck constant", "The Boltzmann constant", "Avogadro's number", "The gravitational constant"),
  ],
  // day 31
  [
    E(1, "On an acoustic guitar, what vibrates to make the sound?", "The strings", "The tuning pegs", "The frets", "The neck"),
    E(2, "A metal spoon left in hot soup gets hot all the way to the handle by which process?", "Conduction", "Convection", "Radiation", "Reflection"),
    E(3, "Why does a bicycle pump's barrel grow warm when you pump hard?", "Squeezing the air heats it", "Air rubbing the tire heats it", "The rubber hose holds heat", "Your hand warms the metal"),
    E(4, "A phone battery's capacity in milliamp-hours (mAh) measures the stored amount of what?", "Electric charge", "Voltage", "Power", "Resistance"),
    E(5, "What is the sideways voltage across a current-carrying strip in a magnetic field, used in many sensors, called?", "The Hall effect", "The Seebeck effect", "The Peltier effect", "The Zeeman effect"),
  ],
  // day 32
  [
    E(1, "A car traveling at a steady 60 miles per hour covers how many miles in half an hour?", "30", "15", "60", "120"),
    E(2, "What kind of current does an ordinary flashlight battery supply?", "Direct current", "Alternating current", "Static current", "Induced current"),
    E(3, "A wave repeats every 0.01 seconds. What is its frequency in hertz?", "100", "1", "10", "1,000"),
    E(4, "A metal enclosure that blocks outside electric fields from its interior is called what?", "A Faraday cage", "A Leyden jar", "A Tesla coil", "A Wheatstone bridge"),
    E(5, "Light polarized by one filter meets a second filter turned 90 degrees to the first. How much gets through?", "None", "Half", "A quarter", "All of it"),
  ],
  // day 33
  [
    E(1, "Why is the word AMBULANCE often printed backward on the front of an ambulance?", "So it reads right in a rearview mirror", "To save space on the hood", "Because of an old printing error", "So it can be read from above"),
    E(2, "At room temperature, sound travels through air at roughly how many meters per second?", "340", "34", "3,400", "34,000"),
    E(3, "A rise of 10 degrees Celsius equals a rise of how many degrees Fahrenheit?", "18", "10", "32", "50"),
    E(4, "Golf balls are dimpled mainly to do what?", "Reduce air drag", "Add weight to the ball", "Help club faces grip", "Make the ball bounce higher"),
    E(5, "In open air, about how many decibels does a sound's level drop each time you double your distance from a small source?", "6", "3", "10", "20"),
  ],
  // day 34
  [
    E(1, "In which unit is the power of a household light bulb usually rated?", "Watts", "Volts", "Amps", "Ohms"),
    E(2, "What do physicists call any change in an object's velocity, including slowing down?", "Acceleration", "Momentum", "Inertia", "Displacement"),
    E(3, "In a parallel circuit, how do the voltages across the separate branches compare?", "They are all equal", "They add up to zero", "The first branch gets the most", "They halve at each branch"),
    E(4, "A step-up transformer has more turns of wire on which coil?", "The output coil", "The input coil", "Both coils equally", "The iron core"),
    E(5, "US outlets are rated at 120 volts RMS. What is the approximate peak voltage?", "170", "120", "208", "240"),
  ],
  // day 35
  [
    E(1, "On a playground swing, at which point are you moving fastest?", "At the bottom of the arc", "At the highest point", "Halfway up the backswing", "At the very start"),
    E(2, "What is the round third prong on a US three-prong plug for?", "Grounding", "Extra voltage", "Holding the plug in", "Carrying data"),
    E(3, "In the word laser, what does the S stand for?", "Stimulated", "Spectral", "Spontaneous", "Sustained"),
    E(4, "Glow-in-the-dark stickers that keep shining after the lights go out show which effect?", "Phosphorescence", "Fluorescence", "Incandescence", "Bioluminescence"),
    E(5, "The ratio of stress to strain in a wire being stretched is called what?", "Young's modulus", "Bulk modulus", "Shear modulus", "Poisson's ratio"),
  ],
  // day 36
  [
    E(1, "Why do snowshoes keep you from sinking into deep snow?", "They spread your weight over more area", "They make you lighter", "They melt the snow beneath them", "They grip the ice underneath"),
    E(2, "A doorknob is an example of which simple machine?", "A wheel and axle", "A wedge", "A screw", "A pulley"),
    E(3, "If the string of a ball being whirled in a circle snaps, which way does the ball fly off?", "Straight, along the tangent", "Straight out from the center", "In a widening spiral", "In a curve toward the center"),
    E(4, "Why does a transformer not work on steady direct current?", "It needs a changing magnetic field", "Direct current is too weak", "Its coils would melt at once", "Direct current has no voltage"),
    E(5, "Fleming's left-hand rule gives the direction of the force on what?", "A current in a magnetic field", "A charge in an electric field", "A mass in a gravity field", "A magnet near iron"),
  ],
];
