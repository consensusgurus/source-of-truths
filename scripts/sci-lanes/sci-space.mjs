// Sci lane: Space. 48 days x 5 tiers. Scope: planets and moons, the Sun, stars,
// galaxies, nebulae, comets and asteroids, constellations, astronomical terms,
// history of astronomy, telescopes, and completed missions and astronauts up to 2024.
const L = 'Space';
export const LANE_DAYS = [
  // day 1
  [
    { c: L, t: 1, q: 'Which constellation is known as the Hunter?', a: 'Orion', d: ['Leo', 'Draco', 'Lyra'] },
    { c: L, t: 2, q: 'What was the name of the Apollo 11 lunar module that set down on the Moon?', a: 'Eagle', d: ['Columbia', 'Intrepid', 'Falcon'] },
    { c: L, t: 3, q: 'What is the largest moon in the solar system?', a: 'Ganymede', d: ['Titan', 'Callisto', 'Io'] },
    { c: L, t: 4, q: 'Which NASA mission deliberately crashed into the asteroid moonlet Dimorphos in 2022?', a: 'DART', d: ['OSIRIS-REx', 'Lucy', 'Psyche'] },
    { c: L, t: 5, q: 'In 1054, Chinese astronomers recorded a "guest star" whose remnant is now known as which nebula?', a: 'Crab Nebula', d: ['Orion Nebula', 'Ring Nebula', 'Eagle Nebula'] },
  ],
  // day 2
  [
    { c: L, t: 1, q: 'Which famous comet returns to the inner solar system about every 76 years?', a: 'Halley\'s Comet', d: ['Hale-Bopp', 'Encke\'s Comet', 'Swift-Tuttle'] },
    { c: L, t: 2, q: 'Who became the first American in space, on a suborbital flight in May 1961?', a: 'Alan Shepard', d: ['John Glenn', 'Gus Grissom', 'Gordon Cooper'] },
    { c: L, t: 3, q: 'Which very bright comet stayed visible to the naked eye for about 18 months across 1996 and 1997?', a: 'Hale-Bopp', d: ['Hyakutake', 'Comet West', 'Kohoutek'] },
    { c: L, t: 4, q: 'Which Dutch scientist discovered Titan in 1655 and explained that Saturn is circled by a thin, flat ring?', a: 'Christiaan Huygens', d: ['Giovanni Cassini', 'Ole Romer', 'Galileo Galilei'] },
    { c: L, t: 5, q: 'Which astronomer proposed in 1950 that long-period comets come from a vast, distant shell surrounding the solar system?', a: 'Jan Oort', d: ['Gerard Kuiper', 'Fred Whipple', 'Kenneth Edgeworth'] },
  ],
  // day 3
  [
    { c: L, t: 1, q: 'Who was the second person to step onto the Moon, in July 1969?', a: 'Buzz Aldrin', d: ['Michael Collins', 'Pete Conrad', 'Alan Bean'] },
    { c: L, t: 2, q: 'Which giant rocket launched the Apollo crews on their way to the Moon?', a: 'Saturn V', d: ['Atlas V', 'Titan II', 'Delta IV'] },
    { c: L, t: 3, q: 'Which star, the brightest in Carina, is the second brightest in the whole night sky?', a: 'Canopus', d: ['Arcturus', 'Vega', 'Rigel'] },
    { c: L, t: 4, q: 'Which ESA lander became the first spacecraft to touch down on a comet, in November 2014?', a: 'Philae', d: ['Huygens', 'Beagle 2', 'Schiaparelli'] },
    { c: L, t: 5, q: 'Which French astronomer compiled a catalog of fuzzy objects, such as M31, so that comet hunters would not mistake them for comets?', a: 'Charles Messier', d: ['Pierre Mechain', 'Nicolas-Louis de Lacaille', 'Joseph-Nicolas Delisle'] },
  ],
  // day 4
  [
    { c: L, t: 1, q: 'What is a named pattern of stars in the night sky, such as Leo or Scorpius, called?', a: 'A constellation', d: ['A galaxy', 'A nebula', 'A meteor shower'] },
    { c: L, t: 2, q: 'Which country became the third to launch a person into space on its own rocket, in 2003?', a: 'China', d: ['India', 'Japan', 'France'] },
    { c: L, t: 3, q: 'What is the name of the giant shield volcano on Mars that towers far higher than Mount Everest?', a: 'Olympus Mons', d: ['Arsia Mons', 'Tharsis Tholus', 'Elysium Mons'] },
    { c: L, t: 4, q: 'Which young astronomer discovered Pluto at Lowell Observatory in 1930?', a: 'Clyde Tombaugh', d: ['Percival Lowell', 'Gerard Kuiper', 'Edwin Hubble'] },
    { c: L, t: 5, q: 'Whose mathematical prediction led Johann Galle to find Neptune in 1846?', a: 'Urbain Le Verrier', d: ['Pierre-Simon Laplace', 'Joseph-Louis Lagrange', 'Jean-Baptiste Delambre'] },
  ],
  // day 5
  [
    { c: L, t: 1, q: 'What is the Moon called when its whole sunlit face can be seen from Earth?', a: 'Full moon', d: ['New moon', 'Half moon', 'Crescent moon'] },
    { c: L, t: 2, q: 'The seven bright stars of the Big Dipper belong to which larger star pattern?', a: 'Ursa Major', d: ['Ursa Minor', 'Draco', 'Cassiopeia'] },
    { c: L, t: 3, q: 'Which world has a strange six-sided jet stream circling its north pole?', a: 'Saturn', d: ['Jupiter', 'Uranus', 'Neptune'] },
    { c: L, t: 4, q: 'Which 1965 flyby returned the first close-up photographs of Mars?', a: 'Mariner 4', d: ['Mariner 2', 'Mariner 9', 'Viking 1'] },
    { c: L, t: 5, q: 'Which large asteroid did NASA\'s Dawn spacecraft orbit before moving on to Ceres?', a: 'Vesta', d: ['Pallas', 'Juno', 'Eros'] },
  ],
  // day 6
  [
    { c: L, t: 1, q: 'A light-year is a measure of what?', a: 'Distance', d: ['Time', 'Brightness', 'Speed'] },
    { c: L, t: 2, q: 'Which space shuttle broke apart 73 seconds after launch in January 1986?', a: 'Challenger', d: ['Columbia', 'Discovery', 'Atlantis'] },
    { c: L, t: 3, q: 'What is the name of the larger of the two moons of Mars?', a: 'Phobos', d: ['Deimos', 'Io', 'Triton'] },
    { c: L, t: 4, q: 'What was the first American space station, launched in 1973?', a: 'Skylab', d: ['Salyut 1', 'Mir', 'Freedom'] },
    { c: L, t: 5, q: 'Which spacecraft made the first successful flyby of another planet, passing Venus in December 1962?', a: 'Mariner 2', d: ['Venera 1', 'Mariner 1', 'Mars 1'] },
  ],
  // day 7
  [
    { c: L, t: 1, q: 'Which bright world is often called the Morning Star or the Evening Star?', a: 'Venus', d: ['Mars', 'Jupiter', 'Mercury'] },
    { c: L, t: 2, q: 'What is a planet that orbits a star other than the Sun called?', a: 'An exoplanet', d: ['A protoplanet', 'A planetesimal', 'A dwarf planet'] },
    { c: L, t: 3, q: 'Which star cluster in Taurus is also known as the Seven Sisters?', a: 'Pleiades', d: ['Hyades', 'Beehive Cluster', 'Double Cluster'] },
    { c: L, t: 4, q: 'Which Apollo 11 astronaut stayed in lunar orbit aboard the command module while his crewmates walked on the Moon?', a: 'Michael Collins', d: ['Jim Lovell', 'Dave Scott', 'Dick Gordon'] },
    { c: L, t: 5, q: 'What is the name of the enormous impact basin that covers much of the far side of the Moon?', a: 'South Pole-Aitken basin', d: ['Mare Imbrium', 'Hellas Planitia', 'Caloris Basin'] },
  ],
  // day 8
  [
    { c: L, t: 1, q: 'What is the lunar phase called when the sunlit side faces away from Earth, leaving our satellite almost invisible?', a: 'New moon', d: ['Full moon', 'First quarter', 'Gibbous moon'] },
    { c: L, t: 2, q: 'Who became the first American woman in space, in 1983?', a: 'Sally Ride', d: ['Judith Resnik', 'Eileen Collins', 'Mae Jemison'] },
    { c: L, t: 3, q: 'Which world in the solar system spins fastest, completing a day in under ten hours?', a: 'Jupiter', d: ['Saturn', 'Mars', 'Neptune'] },
    { c: L, t: 4, q: 'Which NASA program of the 1960s sent probes crashing into the Moon while they radioed back close-up pictures?', a: 'Ranger', d: ['Surveyor', 'Lunar Orbiter', 'Pioneer'] },
    { c: L, t: 5, q: 'Which Harvard astronomer devised the O, B, A, F, G, K, M scheme for classifying stars?', a: 'Annie Jump Cannon', d: ['Williamina Fleming', 'Antonia Maury', 'Henrietta Swan Leavitt'] },
  ],
  // day 9
  [
    { c: L, t: 1, q: 'What name is given to the event from which the universe is thought to have begun?', a: 'The Big Bang', d: ['The Big Crunch', 'The Big Rip', 'The Great Attractor'] },
    { c: L, t: 2, q: 'In which Texas city is NASA\'s Mission Control for crewed flights?', a: 'Houston', d: ['Dallas', 'Austin', 'San Antonio'] },
    { c: L, t: 3, q: 'What is the term for the point in an orbit around the Sun that lies farthest from it?', a: 'Aphelion', d: ['Perihelion', 'Perigee', 'Zenith'] },
    { c: L, t: 4, q: 'Which moon of Jupiter has an ancient surface so packed with craters that it is among the most heavily cratered bodies known?', a: 'Callisto', d: ['Europa', 'Io', 'Amalthea'] },
    { c: L, t: 5, q: 'Which NASA spacecraft flew past Mercury three times in 1974 and 1975?', a: 'Mariner 10', d: ['Mariner 5', 'Pioneer 11', 'Pioneer Venus'] },
  ],
  // day 10
  [
    { c: L, t: 1, q: 'The traditional zodiac is made up of how many constellations?', a: 'Twelve', d: ['Ten', 'Eleven', 'Fourteen'] },
    { c: L, t: 2, q: 'Which large spiral galaxy, about 2.5 million light-years away, is the nearest big neighbor of the Milky Way?', a: 'Andromeda Galaxy', d: ['Triangulum Galaxy', 'Whirlpool Galaxy', 'Sombrero Galaxy'] },
    { c: L, t: 3, q: 'What term describes a moon that always keeps the same face toward its planet, as our Moon does?', a: 'Tidally locked', d: ['Geosynchronous', 'Retrograde', 'Eccentric'] },
    { c: L, t: 4, q: 'Which space shuttle broke apart during reentry in February 2003?', a: 'Columbia', d: ['Challenger', 'Discovery', 'Endeavour'] },
    { c: L, t: 5, q: 'What name is given to the 1920 clash between Harlow Shapley and Heber Curtis over the size of the universe?', a: 'The Great Debate', d: ['The Island Debate', 'The Mount Wilson Debate', 'The Spiral Nebula Debate'] },
  ],
  // day 11
  [
    { c: L, t: 1, q: 'What is it called when the Moon passes directly in front of the Sun and hides it from view?', a: 'A solar eclipse', d: ['A lunar eclipse', 'A transit', 'An occultation'] },
    { c: L, t: 2, q: 'Which giant world is so low in density that it would float in water, given a big enough tub?', a: 'Saturn', d: ['Jupiter', 'Neptune', 'Uranus'] },
    { c: L, t: 3, q: 'What is the name of the vast canyon system that stretches along the equator of Mars?', a: 'Valles Marineris', d: ['Hellas Planitia', 'Tharsis Montes', 'Utopia Planitia'] },
    { c: L, t: 4, q: 'On which asteroid did NASA\'s NEAR Shoemaker spacecraft set down in 2001?', a: 'Eros', d: ['Ida', 'Gaspra', 'Mathilde'] },
    { c: L, t: 5, q: 'Supernova 1987A exploded in which satellite galaxy of the Milky Way?', a: 'Large Magellanic Cloud', d: ['Small Magellanic Cloud', 'Sagittarius Dwarf Galaxy', 'Triangulum Galaxy'] },
  ],
  // day 12
  [
    { c: L, t: 1, q: 'What is the thin, curved sliver of the Moon seen just before or after its darkest phase called?', a: 'Crescent', d: ['Gibbous', 'Quarter', 'Full'] },
    { c: L, t: 2, q: 'What does a star like the Sun swell into late in its life, before shedding its outer layers?', a: 'A red giant', d: ['A white dwarf', 'A neutron star', 'A blue giant'] },
    { c: L, t: 3, q: 'Which Soviet program flew the first crewed spaceflights, from 1961 to 1963?', a: 'Vostok', d: ['Voskhod', 'Soyuz', 'Salyut'] },
    { c: L, t: 4, q: 'Which NASA space telescope, launched in 2003 and retired in 2020, observed the universe in infrared light?', a: 'Spitzer Space Telescope', d: ['Chandra X-ray Observatory', 'Kepler Space Telescope', 'Compton Gamma Ray Observatory'] },
    { c: L, t: 5, q: 'Which Danish astronomer carefully recorded a brilliant "new star" in Cassiopeia in 1572?', a: 'Tycho Brahe', d: ['Ole Romer', 'Johannes Kepler', 'David Fabricius'] },
  ],
  // day 13
  [
    { c: L, t: 1, q: 'Apart from the Sun, what is the brightest natural object in our sky?', a: 'The Moon', d: ['Venus', 'Sirius', 'Jupiter'] },
    { c: L, t: 2, q: 'Which planet is named after the Roman god of the sea?', a: 'Neptune', d: ['Uranus', 'Saturn', 'Mercury'] },
    { c: L, t: 3, q: 'Most meteor showers happen when Earth passes through what?', a: 'Debris shed by a comet', d: ['The asteroid belt', 'The solar wind', 'A ring around the Moon'] },
    { c: L, t: 4, q: 'Which NASA spacecraft became the first to orbit Jupiter, arriving in 1995?', a: 'Galileo', d: ['Pioneer 10', 'Voyager 2', 'Ulysses'] },
    { c: L, t: 5, q: 'Which comet did NASA\'s Deep Impact mission strike with a copper impactor in July 2005?', a: 'Tempel 1', d: ['Wild 2', 'Borrelly', 'Hartley 2'] },
  ],
  // day 14
  [
    { c: L, t: 1, q: 'What are the dark, cooler patches that appear on the face of the Sun called?', a: 'Sunspots', d: ['Solar flares', 'Prominences', 'Granules'] },
    { c: L, t: 2, q: 'What is the name of the nearest known star to the Sun?', a: 'Proxima Centauri', d: ['Barnard\'s Star', 'Sirius', 'Wolf 359'] },
    { c: L, t: 3, q: 'Who became the first woman to command a space shuttle mission, in 1999?', a: 'Eileen Collins', d: ['Sally Ride', 'Kathryn Sullivan', 'Shannon Lucid'] },
    { c: L, t: 4, q: 'Which Apollo 15 commander drove the first Lunar Roving Vehicle across the Moon in 1971?', a: 'Dave Scott', d: ['John Young', 'Gene Cernan', 'Pete Conrad'] },
    { c: L, t: 5, q: 'Which bright star in Lyra long served as the zero point of the stellar magnitude scale?', a: 'Vega', d: ['Arcturus', 'Deneb', 'Altair'] },
  ],
  // day 15
  [
    { c: L, t: 1, q: 'Which zodiac constellation is pictured as a scorpion?', a: 'Scorpius', d: ['Leo', 'Cancer', 'Libra'] },
    { c: L, t: 2, q: 'What word describes a model of the solar system with the Sun at its center?', a: 'Heliocentric', d: ['Geocentric', 'Tychonic', 'Ptolemaic'] },
    { c: L, t: 3, q: 'What is the name of the long diagonal band where most stars, including the Sun, spend most of their lives on a star chart of color against brightness?', a: 'Main sequence', d: ['Giant branch', 'Instability strip', 'Horizontal branch'] },
    { c: L, t: 4, q: 'Which lander became the first American spacecraft to operate on the surface of Mars, in July 1976?', a: 'Viking 1', d: ['Viking 2', 'Mariner 9', 'Mars 3'] },
    { c: L, t: 5, q: 'Which ancient Greek astronomer is credited with discovering the precession of the equinoxes?', a: 'Hipparchus', d: ['Eratosthenes', 'Aristarchus of Samos', 'Eudoxus'] },
  ],
  // day 16
  [
    { c: L, t: 1, q: 'Which planet is named after the Roman god of war?', a: 'Mars', d: ['Jupiter', 'Saturn', 'Mercury'] },
    { c: L, t: 2, q: 'In which direction does a comet\'s tail always point?', a: 'Away from the Sun', d: ['Toward the Sun', 'Toward Earth', 'Back along its path'] },
    { c: L, t: 3, q: 'What is the name of the largest moon of Pluto?', a: 'Charon', d: ['Nix', 'Hydra', 'Styx'] },
    { c: L, t: 4, q: 'Which NASA mission collected dust from comet Wild 2 and returned it to Earth in 2006?', a: 'Stardust', d: ['Genesis', 'Deep Impact', 'Hayabusa'] },
    { c: L, t: 5, q: 'Which red supergiant marks the heart of Scorpius, its name meaning "rival of Mars"?', a: 'Antares', d: ['Aldebaran', 'Arcturus', 'Shaula'] },
  ],
  // day 17
  [
    { c: L, t: 1, q: 'What are the bowl-shaped hollows left on the Moon by impacts called?', a: 'Craters', d: ['Maria', 'Rilles', 'Domes'] },
    { c: L, t: 2, q: 'Which Apollo 17 commander was the last person to walk on the Moon, in December 1972?', a: 'Gene Cernan', d: ['Charlie Duke', 'John Young', 'Ron Evans'] },
    { c: L, t: 3, q: 'Which giant takes about 165 Earth years to circle the Sun once?', a: 'Neptune', d: ['Uranus', 'Saturn', 'Jupiter'] },
    { c: L, t: 4, q: 'Which NASA lander touched down near the north pole of Mars in 2008 and dug up water ice?', a: 'Phoenix', d: ['InSight', 'Viking 2', 'Beagle 2'] },
    { c: L, t: 5, q: 'Which spacecraft became the first to fly past Jupiter, in December 1973?', a: 'Pioneer 10', d: ['Pioneer 11', 'Voyager 1', 'Mariner 10'] },
  ],
  // day 18
  [
    { c: L, t: 1, q: 'In which US state is NASA\'s Kennedy Space Center?', a: 'Florida', d: ['Texas', 'California', 'Alabama'] },
    { c: L, t: 2, q: 'What is the Moon\'s phase called when more than half, but not all, of its face is lit?', a: 'Gibbous', d: ['Crescent', 'Quarter', 'New'] },
    { c: L, t: 3, q: 'Which meteor shower reaches its peak every August?', a: 'Perseids', d: ['Leonids', 'Geminids', 'Orionids'] },
    { c: L, t: 4, q: 'Which NASA observatory, launched in 2009, found thousands of exoplanets by watching for stars to dim slightly?', a: 'Kepler Space Telescope', d: ['Spitzer Space Telescope', 'Herschel Space Observatory', 'CoRoT'] },
    { c: L, t: 5, q: 'Who, with Didier Queloz, announced in 1995 the first planet found orbiting a Sun-like star, 51 Pegasi b?', a: 'Michel Mayor', d: ['Geoffrey Marcy', 'Aleksander Wolszczan', 'Paul Butler'] },
  ],
  // day 19
  [
    { c: L, t: 1, q: 'Which reusable NASA spacecraft carried crews to orbit from 1981 to 2011?', a: 'The Space Shuttle', d: ['Apollo', 'Gemini', 'Skylab'] },
    { c: L, t: 2, q: 'What color are the hottest stars?', a: 'Blue', d: ['Red', 'Yellow', 'Orange'] },
    { c: L, t: 3, q: 'Alnitak, Alnilam and Mintaka form which famous row of three stars?', a: 'Orion\'s Belt', d: ['The Summer Triangle', 'The Southern Cross', 'The Teapot'] },
    { c: L, t: 4, q: 'Which Soviet probe sent back the first photographs of the far side of the Moon, in 1959?', a: 'Luna 3', d: ['Luna 2', 'Luna 9', 'Zond 3'] },
    { c: L, t: 5, q: 'What term describes the fraction of sunlight that a planet or moon reflects?', a: 'Albedo', d: ['Magnitude', 'Parallax', 'Luminosity'] },
  ],
  // day 20
  [
    { c: L, t: 1, q: 'What kind of building projects the stars and planets onto a domed ceiling for an audience?', a: 'A planetarium', d: ['An observatory', 'An orrery', 'An arboretum'] },
    { c: L, t: 2, q: 'Which astronaut famously hit golf balls on the Moon during Apollo 14?', a: 'Alan Shepard', d: ['Edgar Mitchell', 'Stuart Roosa', 'Pete Conrad'] },
    { c: L, t: 3, q: 'What do astronomers call a pair of stars that orbit each other?', a: 'A binary star', d: ['A star cluster', 'A double galaxy', 'A nova'] },
    { c: L, t: 4, q: 'Which world did NASA\'s Magellan spacecraft map with radar in the early 1990s?', a: 'Venus', d: ['Mars', 'Mercury', 'Titan'] },
    { c: L, t: 5, q: 'Which star in Perseus, nicknamed the Demon Star, dims regularly as a companion passes in front of it?', a: 'Algol', d: ['Mira', 'Delta Cephei', 'Mirfak'] },
  ],
  // day 21
  [
    { c: L, t: 1, q: 'The European Space Agency is run by countries from which continent?', a: 'Europe', d: ['Asia', 'Africa', 'South America'] },
    { c: L, t: 2, q: 'Which comet broke into pieces and slammed into Jupiter in July 1994?', a: 'Shoemaker-Levy 9', d: ['Hale-Bopp', 'Hyakutake', 'Kohoutek'] },
    { c: L, t: 3, q: 'Which constellation, the Little Dipper, has the North Star at the end of its handle?', a: 'Ursa Minor', d: ['Draco', 'Cepheus', 'Camelopardalis'] },
    { c: L, t: 4, q: 'Which Japanese probe brought back the first samples from an asteroid, Itokawa, in 2010?', a: 'Hayabusa', d: ['Akatsuki', 'Kaguya', 'Nozomi'] },
    { c: L, t: 5, q: 'Which cosmonaut spent 437 consecutive days aboard Mir, returning to Earth in 1995?', a: 'Valeri Polyakov', d: ['Sergei Krikalev', 'Gennady Padalka', 'Musa Manarov'] },
  ],
  // day 22
  [
    { c: L, t: 1, q: 'What are big worlds like Jupiter and Saturn, made mostly of hydrogen and helium, called?', a: 'Gas giants', d: ['Ice dwarfs', 'Rocky planets', 'Brown dwarfs'] },
    { c: L, t: 2, q: 'What kind of animal was Ham, launched on a Mercury flight in January 1961?', a: 'A chimpanzee', d: ['A gorilla', 'An orangutan', 'A dog'] },
    { c: L, t: 3, q: 'Which world takes about 687 Earth days to circle the Sun once?', a: 'Mars', d: ['Venus', 'Mercury', 'Jupiter'] },
    { c: L, t: 4, q: 'Which Soviet probe made the first soft landing on Venus and radioed data from its surface, in 1970?', a: 'Venera 7', d: ['Venera 4', 'Venera 13', 'Mariner 5'] },
    { c: L, t: 5, q: 'What name is given to the faint glow along the ecliptic caused by sunlight scattering off interplanetary dust?', a: 'Zodiacal light', d: ['Aurora', 'Airglow', 'Earthshine'] },
  ],
  // day 23
  [
    { c: L, t: 1, q: 'Counting outward from the Sun, which world comes right after Saturn?', a: 'Uranus', d: ['Neptune', 'Jupiter', 'Mercury'] },
    { c: L, t: 2, q: 'Which constellation is known as the Swan?', a: 'Cygnus', d: ['Aquila', 'Lyra', 'Columba'] },
    { c: L, t: 3, q: 'What is the apparent shift of a nearby star against distant ones, caused by Earth moving along its orbit, called?', a: 'Parallax', d: ['Aberration', 'Redshift', 'Precession'] },
    { c: L, t: 4, q: 'Which 1969 mission first tested a crewed lunar module in space, in Earth orbit?', a: 'Apollo 9', d: ['Apollo 7', 'Apollo 8', 'Apollo 10'] },
    { c: L, t: 5, q: 'Which astronomer, working beside her famous brother in Bath and later Slough, discovered eight comets?', a: 'Caroline Herschel', d: ['Maria Mitchell', 'Mary Somerville', 'Maria Kirch'] },
  ],
  // day 24
  [
    { c: L, t: 1, q: 'Which zodiac constellation is pictured as a lion?', a: 'Leo', d: ['Taurus', 'Aries', 'Lupus'] },
    { c: L, t: 2, q: 'What are the large dark plains on the Moon, once mistaken for seas, called?', a: 'Maria', d: ['Craters', 'Rilles', 'Highlands'] },
    { c: L, t: 3, q: 'Vega, Deneb and Altair form which bright asterism?', a: 'The Summer Triangle', d: ['The Winter Hexagon', 'The Great Square', 'The Southern Cross'] },
    { c: L, t: 4, q: 'What flaw blurred the first images from the Hubble Space Telescope after its 1990 launch?', a: 'Its main mirror was ground to the wrong shape', d: ['Its main mirror cracked in orbit', 'Its solar panels blocked the view', 'Its camera shutter jammed half open'] },
    { c: L, t: 5, q: 'Which asteroid became the first known to have its own moon, after the Galileo spacecraft spotted Dactyl in 1993?', a: 'Ida', d: ['Gaspra', 'Mathilde', 'Eros'] },
  ],
  // day 25
  [
    { c: L, t: 1, q: 'Which zodiac constellation is pictured as a bull?', a: 'Taurus', d: ['Aries', 'Capricornus', 'Leo'] },
    { c: L, t: 2, q: 'Which former Mercury astronaut flew again aboard the space shuttle in 1998, at the age of 77?', a: 'John Glenn', d: ['Scott Carpenter', 'Wally Schirra', 'Gordon Cooper'] },
    { c: L, t: 3, q: 'What is the point in the Moon\'s orbit where it comes closest to Earth called?', a: 'Perigee', d: ['Apogee', 'Perihelion', 'Aphelion'] },
    { c: L, t: 4, q: 'Which European probe flew within about 600 kilometers of the nucleus of Halley\'s Comet in March 1986?', a: 'Giotto', d: ['Suisei', 'Sakigake', 'Ulysses'] },
    { c: L, t: 5, q: 'Which Irish nobleman built the giant "Leviathan" telescope in 1845 and saw the spiral form of the Whirlpool Galaxy?', a: 'The Earl of Rosse', d: ['William Herschel', 'John Herschel', 'James Nasmyth'] },
  ],
  // day 26
  [
    { c: L, t: 1, q: 'What kind of object is the Sun?', a: 'A star', d: ['A planet', 'A comet', 'A nebula'] },
    { c: L, t: 2, q: 'Which constellation is easy to spot as a large "W" or "M" of five bright stars in northern skies?', a: 'Cassiopeia', d: ['Cygnus', 'Perseus', 'Andromeda'] },
    { c: L, t: 3, q: 'Which orange giant star marks the eye of the Bull?', a: 'Aldebaran', d: ['Betelgeuse', 'Antares', 'Capella'] },
    { c: L, t: 4, q: 'The dark gap between the two brightest rings of Saturn is named after which astronomer?', a: 'Giovanni Cassini', d: ['Johann Encke', 'William Herschel', 'Edward Barnard'] },
    { c: L, t: 5, q: 'Which NASA satellite, flying from 2001 to 2010, mapped the cosmic microwave background in fine detail?', a: 'WMAP', d: ['COBE', 'Planck', 'IRAS'] },
  ],
  // day 27
  [
    { c: L, t: 1, q: 'What type of galaxy has arms that wind out from its center like a pinwheel?', a: 'A spiral galaxy', d: ['An elliptical galaxy', 'An irregular galaxy', 'A lenticular galaxy'] },
    { c: L, t: 2, q: 'Who became the first African American woman in space, in 1992?', a: 'Mae Jemison', d: ['Stephanie Wilson', 'Joan Higginbotham', 'Yvonne Cagle'] },
    { c: L, t: 3, q: 'Which shuttle flew the final mission of the program, landing in July 2011?', a: 'Atlantis', d: ['Discovery', 'Endeavour', 'Columbia'] },
    { c: L, t: 4, q: 'Which moon of Saturn is famous for having one hemisphere far darker than the other?', a: 'Iapetus', d: ['Rhea', 'Dione', 'Tethys'] },
    { c: L, t: 5, q: 'Which Bell Labs engineer first detected radio waves coming from the Milky Way, in the early 1930s?', a: 'Karl Jansky', d: ['Grote Reber', 'Arno Penzias', 'Bernard Lovell'] },
  ],
  // day 28
  [
    { c: L, t: 1, q: 'Which is the smallest of the eight planets?', a: 'Mercury', d: ['Mars', 'Venus', 'Earth'] },
    { c: L, t: 2, q: 'What is a small rocky body traveling through space, before it ever reaches our atmosphere, called?', a: 'A meteoroid', d: ['A meteor', 'A meteorite', 'A comet'] },
    { c: L, t: 3, q: 'Which dwarf planet, found in 2005, set off the debate that led to the new definition of a planet?', a: 'Eris', d: ['Makemake', 'Haumea', 'Sedna'] },
    { c: L, t: 4, q: 'What was the first robotic rover to drive on the Moon, delivered by the Soviet Union in 1970?', a: 'Lunokhod 1', d: ['Lunokhod 2', 'Yutu', 'Sojourner'] },
    { c: L, t: 5, q: 'Which Italian astronomer discovered Ceres on the first night of 1801?', a: 'Giuseppe Piazzi', d: ['Heinrich Olbers', 'Karl Harding', 'Johann Bode'] },
  ],
  // day 29
  [
    { c: L, t: 1, q: 'What are the Moon\'s changing shapes over the course of a month called?', a: 'Its phases', d: ['Its orbits', 'Its eclipses', 'Its seasons'] },
    { c: L, t: 2, q: 'What are the rings of Saturn mostly made of?', a: 'Chunks of water ice', d: ['Hot gas', 'Liquid water', 'Volcanic ash'] },
    { c: L, t: 3, q: 'Who became the first African American in space, aboard Challenger in 1983?', a: 'Guion Bluford', d: ['Ron McNair', 'Fred Gregory', 'Charles Bolden'] },
    { c: L, t: 4, q: 'Which lunar mission was struck by lightning twice during its launch in November 1969?', a: 'Apollo 12', d: ['Apollo 11', 'Apollo 13', 'Apollo 14'] },
    { c: L, t: 5, q: 'What name did Galileo give to the four moons of Jupiter he discovered, in honor of his patrons?', a: 'The Medicean Stars', d: ['The Galilean Lamps', 'The Jovian Lights', 'The Florentine Planets'] },
  ],
  // day 30
  [
    { c: L, t: 1, q: 'The word "solar" refers to which object?', a: 'The Sun', d: ['The Moon', 'Earth', 'The stars'] },
    { c: L, t: 2, q: 'Which country landed its Chandrayaan-3 mission near the south pole of the Moon in 2023?', a: 'India', d: ['China', 'Japan', 'Israel'] },
    { c: L, t: 3, q: 'What is left when the core of a massive star collapses but is not heavy enough to become a black hole?', a: 'A neutron star', d: ['A white dwarf', 'A red giant', 'A brown dwarf'] },
    { c: L, t: 4, q: 'Which star is the brightest in the constellation Leo?', a: 'Regulus', d: ['Denebola', 'Algieba', 'Spica'] },
    { c: L, t: 5, q: 'Which 15th-century ruler built a great observatory at Samarkand and compiled a famous star catalog?', a: 'Ulugh Beg', d: ['Al-Battani', 'Nasir al-Din al-Tusi', 'Al-Biruni'] },
  ],
  // day 31
  [
    { c: L, t: 1, q: 'What do we call a planet\'s spinning on its own axis?', a: 'Rotation', d: ['Revolution', 'Precession', 'Libration'] },
    { c: L, t: 2, q: 'What is a full moon that happens when the Moon is near its closest point to Earth popularly called?', a: 'A supermoon', d: ['A blue moon', 'A harvest moon', 'A blood moon'] },
    { c: L, t: 3, q: 'Which small helicopter made 72 flights on Mars before its mission ended in January 2024?', a: 'Ingenuity', d: ['Perseverance', 'Sojourner', 'Dragonfly'] },
    { c: L, t: 4, q: 'Which is the largest of the 88 constellations by area of sky?', a: 'Hydra', d: ['Virgo', 'Ursa Major', 'Cetus'] },
    { c: L, t: 5, q: 'Which 10th-century Persian astronomer recorded the Andromeda Galaxy as a "little cloud"?', a: 'Abd al-Rahman al-Sufi', d: ['Al-Battani', 'Ibn Yunus', 'Al-Zarqali'] },
  ],
  // day 32
  [
    { c: L, t: 1, q: 'What is the usual American word for a person trained to travel into space?', a: 'An astronaut', d: ['A cosmonaut', 'A taikonaut', 'An aviator'] },
    { c: L, t: 2, q: 'What type of galaxy looks like a smooth, featureless oval of stars with no arms?', a: 'An elliptical galaxy', d: ['A spiral galaxy', 'A barred spiral galaxy', 'An irregular galaxy'] },
    { c: L, t: 3, q: 'Which Apollo 17 geologist became the only professional scientist to walk on the Moon?', a: 'Harrison Schmitt', d: ['Edgar Mitchell', 'Charlie Duke', 'James Irwin'] },
    { c: L, t: 4, q: 'What is a neutron star with an extraordinarily powerful magnetic field called?', a: 'A magnetar', d: ['A blazar', 'A quasar', 'A hypernova'] },
    { c: L, t: 5, q: 'Which Soviet probe became the first robot to bring lunar soil back to Earth, in 1970?', a: 'Luna 16', d: ['Luna 9', 'Luna 24', 'Zond 5'] },
  ],
  // day 33
  [
    { c: L, t: 1, q: 'Which planet lies between Earth and Jupiter?', a: 'Mars', d: ['Venus', 'Saturn', 'Mercury'] },
    { c: L, t: 2, q: 'What does the abbreviation NASA stand for?', a: 'National Aeronautics and Space Administration', d: ['National Air and Space Agency', 'National Astronautics and Science Authority', 'North American Space Administration'] },
    { c: L, t: 3, q: 'Where did the giant Arecibo radio telescope collapse in 2020?', a: 'Puerto Rico', d: ['Hawaii', 'Guam', 'The US Virgin Islands'] },
    { c: L, t: 4, q: 'Who became the first Indian citizen in space, aboard a Soviet Soyuz in 1984?', a: 'Rakesh Sharma', d: ['Kalpana Chawla', 'Ravish Malhotra', 'Sunita Williams'] },
    { c: L, t: 5, q: 'Which comet sheds the debris that produces the Perseid meteor shower?', a: 'Swift-Tuttle', d: ['Tempel-Tuttle', 'Halley\'s Comet', 'Encke\'s Comet'] },
  ],
  // day 34
  [
    { c: L, t: 1, q: 'Which zodiac constellation is pictured as an archer?', a: 'Sagittarius', d: ['Centaurus', 'Orion', 'Libra'] },
    { c: L, t: 2, q: 'What type of star is the Sun, judged by its color and size?', a: 'A yellow dwarf', d: ['A red giant', 'A white dwarf', 'A blue giant'] },
    { c: L, t: 3, q: 'What is the region around a star where a planet could hold liquid water on its surface called?', a: 'The habitable zone', d: ['The frost line', 'The Roche limit', 'The Hill sphere'] },
    { c: L, t: 4, q: 'Which 1969 dress rehearsal for the landing carried a lunar module nicknamed Snoopy?', a: 'Apollo 10', d: ['Apollo 9', 'Apollo 11', 'Apollo 12'] },
    { c: L, t: 5, q: 'Which Danish astronomer first estimated the speed of light, in 1676, from timing the eclipses of Io?', a: 'Ole Romer', d: ['Christiaan Huygens', 'Giovanni Cassini', 'James Bradley'] },
  ],
  // day 35
  [
    { c: L, t: 1, q: 'Roughly how long does the Moon take to orbit Earth once?', a: 'About 27 days', d: ['About 7 days', 'About 365 days', 'About 24 hours'] },
    { c: L, t: 2, q: 'How many astronauts walked on the Moon during the Apollo program?', a: 'Twelve', d: ['Six', 'Nine', 'Eighteen'] },
    { c: L, t: 3, q: 'What are the huge arcs of glowing gas that loop out from the edge of the Sun called?', a: 'Prominences', d: ['Sunspots', 'Faculae', 'Spicules'] },
    { c: L, t: 4, q: 'What is the distance inside which a moon would be torn apart by its planet\'s tidal forces called?', a: 'The Roche limit', d: ['The Hill sphere', 'The Karman line', 'The frost line'] },
    { c: L, t: 5, q: 'Which English astronomer suggested in 1750 that the Milky Way is a flattened layer of stars seen edge-on?', a: 'Thomas Wright', d: ['John Michell', 'William Herschel', 'Edmond Halley'] },
  ],
  // day 36
  [
    { c: L, t: 1, q: 'The word "lunar" refers to which object?', a: 'The Moon', d: ['The Sun', 'The stars', 'Earth'] },
    { c: L, t: 2, q: 'Which zodiac constellation is pictured as a pair of twins?', a: 'Gemini', d: ['Pisces', 'Libra', 'Aquarius'] },
    { c: L, t: 3, q: 'Which Canadian astronaut recorded a version of "Space Oddity" aboard the space station in 2013?', a: 'Chris Hadfield', d: ['Marc Garneau', 'Roberta Bondar', 'Julie Payette'] },
    { c: L, t: 4, q: 'The 200-inch telescope at Palomar Observatory is named after which astronomer?', a: 'George Ellery Hale', d: ['Edwin Hubble', 'Harlow Shapley', 'Milton Humason'] },
    { c: L, t: 5, q: 'What did two teams studying distant Type Ia supernovae announce in 1998?', a: 'The expansion of the universe is speeding up', d: ['The universe is slowly shrinking', 'Distant galaxies have stopped receding', 'The universe is only 6 billion years old'] },
  ],
  // day 37
  [
    { c: L, t: 1, q: 'Which zodiac constellation is pictured as a crab?', a: 'Cancer', d: ['Scorpius', 'Capricornus', 'Pisces'] },
    { c: L, t: 2, q: 'What are the four rocky inner planets, including Earth, called as a group?', a: 'Terrestrial planets', d: ['Jovian planets', 'Dwarf planets', 'Ice giants'] },
    { c: L, t: 3, q: 'Hubble\'s famous 1995 "Pillars of Creation" image shows part of which nebula?', a: 'Eagle Nebula', d: ['Orion Nebula', 'Carina Nebula', 'Lagoon Nebula'] },
    { c: L, t: 4, q: 'The Trojan asteroids gather at which kind of gravitationally stable spots along the orbit of Jupiter?', a: 'Lagrange points', d: ['Roche limits', 'Hill spheres', 'Apsides'] },
    { c: L, t: 5, q: 'Which egg-shaped dwarf planet, spinning once about every four hours, is named after a Hawaiian goddess?', a: 'Haumea', d: ['Makemake', 'Sedna', 'Quaoar'] },
  ],
  // day 38
  [
    { c: L, t: 1, q: 'What is the scientific study of stars, planets and space called?', a: 'Astronomy', d: ['Astrology', 'Geology', 'Meteorology'] },
    { c: L, t: 2, q: 'Betelgeuse and Rigel are the two brightest stars of which constellation?', a: 'Orion', d: ['Taurus', 'Gemini', 'Canis Major'] },
    { c: L, t: 3, q: 'What is the extremely bright, distant core of a galaxy, powered by a feeding black hole, called?', a: 'A quasar', d: ['A pulsar', 'A magnetar', 'A nova'] },
    { c: L, t: 4, q: 'Which Apollo 8 astronaut is credited with the famous "Earthrise" photograph in December 1968?', a: 'Bill Anders', d: ['Frank Borman', 'Jim Lovell', 'Michael Collins'] },
    { c: L, t: 5, q: 'Which comet sheds the debris responsible for the Leonid meteor shower?', a: 'Tempel-Tuttle', d: ['Swift-Tuttle', 'Encke\'s Comet', 'Giacobini-Zinner'] },
  ],
  // day 39
  [
    { c: L, t: 1, q: 'What do astronomers call stars, planets, moons and other natural objects in the sky, taken together?', a: 'Celestial bodies', d: ['Terrestrial bodies', 'Atmospheric bodies', 'Orbital debris'] },
    { c: L, t: 2, q: 'What kind of telescope uses lenses, rather than mirrors, to gather light?', a: 'Refracting telescope', d: ['Reflecting telescope', 'Radio telescope', 'Infrared telescope'] },
    { c: L, t: 3, q: 'What is a tightly packed ball of hundreds of thousands of old stars orbiting a galaxy called?', a: 'A globular cluster', d: ['An open cluster', 'A dwarf galaxy', 'A planetary nebula'] },
    { c: L, t: 4, q: 'Which bright orange star leads Bootes, the Herdsman?', a: 'Arcturus', d: ['Spica', 'Regulus', 'Vega'] },
    { c: L, t: 5, q: 'Which NASA mission collected particles of the solar wind, then crash-landed in Utah in 2004 when its parachutes failed?', a: 'Genesis', d: ['Stardust', 'Hayabusa', 'Ulysses'] },
  ],
  // day 40
  [
    { c: L, t: 1, q: 'What is it called when an astronaut goes outside a spacecraft in a spacesuit?', a: 'A spacewalk', d: ['A splashdown', 'A docking', 'A reentry'] },
    { c: L, t: 2, q: 'Roughly how old is the Sun?', a: 'About 4.6 billion years', d: ['About 500 million years', 'About 1 billion years', 'About 30 billion years'] },
    { c: L, t: 3, q: 'What is the stretching of light toward longer wavelengths, seen in galaxies moving away from us, called?', a: 'Redshift', d: ['Blueshift', 'Parallax', 'Refraction'] },
    { c: L, t: 4, q: 'Which is the smallest of the 88 constellations?', a: 'Crux', d: ['Equuleus', 'Sagitta', 'Triangulum'] },
    { c: L, t: 5, q: 'Which ESA observatory mapped the cosmic microwave background from 2009 to 2013?', a: 'Planck', d: ['Herschel', 'Hipparcos', 'Integral'] },
  ],
  // day 41
  [
    { c: L, t: 1, q: 'Which planet is second from the Sun?', a: 'Venus', d: ['Mercury', 'Earth', 'Mars'] },
    { c: L, t: 2, q: 'JAXA is the space agency of which country?', a: 'Japan', d: ['South Korea', 'China', 'India'] },
    { c: L, t: 3, q: 'How many constellations does the International Astronomical Union officially recognize?', a: '88', d: ['48', '64', '112'] },
    { c: L, t: 4, q: 'Who became the first paying space tourist, visiting orbit aboard a Soyuz in 2001?', a: 'Dennis Tito', d: ['Mark Shuttleworth', 'Richard Garriott', 'Guy Laliberte'] },
    { c: L, t: 5, q: 'Which spongy-looking moon of Saturn tumbles chaotically instead of spinning steadily?', a: 'Hyperion', d: ['Phoebe', 'Mimas', 'Janus'] },
  ],
  // day 42
  [
    { c: L, t: 1, q: 'What lies at the very center of the Milky Way?', a: 'A supermassive black hole', d: ['A giant star', 'A white dwarf', 'An empty void'] },
    { c: L, t: 2, q: 'Roughly how old is the universe?', a: 'About 13.8 billion years', d: ['About 4.6 billion years', 'About 1 billion years', 'About 100 billion years'] },
    { c: L, t: 3, q: 'Which Mercury veteran died with two crewmates in the Apollo 1 launch pad fire of January 1967?', a: 'Gus Grissom', d: ['Deke Slayton', 'Wally Schirra', 'Gordon Cooper'] },
    { c: L, t: 4, q: 'Which cosmonaut died in 1967 when the parachute of Soyuz 1 failed?', a: 'Vladimir Komarov', d: ['Georgi Dobrovolski', 'Vladislav Volkov', 'Viktor Patsayev'] },
    { c: L, t: 5, q: 'Which faint star serves as the southern sky\'s rough counterpart to Polaris?', a: 'Sigma Octantis', d: ['Acrux', 'Achernar', 'Hadar'] },
  ],
  // day 43
  [
    { c: L, t: 1, q: 'What shape are the orbits of the planets around the Sun?', a: 'Ellipses', d: ['Perfect circles', 'Spirals', 'Figure eights'] },
    { c: L, t: 2, q: 'What is the half of the Moon that never faces Earth properly called?', a: 'The far side', d: ['The dark side', 'The night side', 'The near side'] },
    { c: L, t: 3, q: 'Sunspot activity rises and falls in a cycle lasting roughly how long?', a: 'About 11 years', d: ['About 1 year', 'About 3 years', 'About 76 years'] },
    { c: L, t: 4, q: 'What is the outer boundary where the Sun\'s wind of particles gives way to the gas of interstellar space called?', a: 'The heliopause', d: ['The bow shock', 'The Oort cloud', 'The magnetopause'] },
    { c: L, t: 5, q: 'Which Caltech astronomer led the team that found Eris and later wrote How I Killed Pluto?', a: 'Mike Brown', d: ['David Jewitt', 'Jane Luu', 'Alan Stern'] },
  ],
  // day 44
  [
    { c: L, t: 1, q: 'What is one complete trip of a planet around the Sun called?', a: 'A revolution', d: ['A rotation', 'A precession', 'A libration'] },
    { c: L, t: 2, q: 'Titania and Oberon, named after Shakespeare characters, are moons of which world?', a: 'Uranus', d: ['Neptune', 'Saturn', 'Jupiter'] },
    { c: L, t: 3, q: 'What is the loose layer of dust and broken rock covering the surface of the Moon called?', a: 'Regolith', d: ['Magma', 'Bedrock', 'Mantle'] },
    { c: L, t: 4, q: 'What is a huge burst of magnetized plasma hurled out from the Sun\'s corona called?', a: 'A coronal mass ejection', d: ['A solar prominence', 'A sunspot', 'A solar granule'] },
    { c: L, t: 5, q: 'Which bright star in Virgo is named for the ear of grain held by the maiden?', a: 'Spica', d: ['Vindemiatrix', 'Porrima', 'Zavijava'] },
  ],
  // day 45
  [
    { c: L, t: 1, q: 'Which zodiac constellation is pictured as a water bearer?', a: 'Aquarius', d: ['Pisces', 'Capricornus', 'Aries'] },
    { c: L, t: 2, q: 'Which star is nicknamed the Dog Star?', a: 'Sirius', d: ['Procyon', 'Vega', 'Rigel'] },
    { c: L, t: 3, q: 'Which small moon of Saturn has a giant crater that makes it look like the Death Star from Star Wars?', a: 'Mimas', d: ['Enceladus', 'Tethys', 'Dione'] },
    { c: L, t: 4, q: 'Which civilization\'s Dresden Codex contains detailed tables tracking the cycles of Venus?', a: 'The Maya', d: ['The Aztecs', 'The Incas', 'The Olmecs'] },
    { c: L, t: 5, q: 'Which Illinois radio engineer built the first dish-shaped radio telescope in his backyard, in 1937?', a: 'Grote Reber', d: ['Karl Jansky', 'Bernard Lovell', 'Martin Ryle'] },
  ],
  // day 46
  [
    { c: L, t: 1, q: 'Moonlight is really reflected light from which source?', a: 'The Sun', d: ['Earth', 'Venus', 'The stars'] },
    { c: L, t: 2, q: 'What is the Sun\'s apparent yearly path across the background stars called?', a: 'The ecliptic', d: ['The celestial equator', 'The meridian', 'The horizon'] },
    { c: L, t: 3, q: 'Who became the first Briton in space, aboard a Soviet mission to Mir in 1991?', a: 'Helen Sharman', d: ['Tim Peake', 'Michael Foale', 'Piers Sellers'] },
    { c: L, t: 4, q: 'Which shuttle was built to replace Challenger, first flying in 1992?', a: 'Endeavour', d: ['Atlantis', 'Discovery', 'Enterprise'] },
    { c: L, t: 5, q: 'What are the empty bands in the asteroid belt, cleared out by the pull of Jupiter, called?', a: 'Kirkwood gaps', d: ['Encke gaps', 'Roche gaps', 'Lagrange gaps'] },
  ],
  // day 47
  [
    { c: L, t: 1, q: 'What is it called when a returning space capsule comes down in the ocean?', a: 'A splashdown', d: ['A docking', 'A spacewalk', 'A rollout'] },
    { c: L, t: 2, q: 'What was the first American human spaceflight program, flying one-person capsules from 1961 to 1963?', a: 'Project Mercury', d: ['Project Gemini', 'Project Apollo', 'Project Vanguard'] },
    { c: L, t: 3, q: 'Which space shuttle carried the Hubble Space Telescope into orbit in April 1990?', a: 'Discovery', d: ['Atlantis', 'Columbia', 'Endeavour'] },
    { c: L, t: 4, q: 'Which bright star marks the tail of Cygnus, the Swan?', a: 'Deneb', d: ['Albireo', 'Sadr', 'Altair'] },
    { c: L, t: 5, q: 'Which US Naval Observatory astronomer discovered Charon in 1978?', a: 'James Christy', d: ['Robert Harrington', 'Clyde Tombaugh', 'Marc Buie'] },
  ],
  // day 48
  [
    { c: L, t: 1, q: 'What do we call the imaginary line a planet spins around?', a: 'Its axis', d: ['Its orbit', 'Its equator', 'Its meridian'] },
    { c: L, t: 2, q: 'What is a star that suddenly flares much brighter for a while, then fades without destroying itself, called?', a: 'A nova', d: ['A supernova', 'A pulsar', 'A quasar'] },
    { c: L, t: 3, q: 'What is it called when an outer planet sits directly opposite the Sun in our sky, the best time to view it?', a: 'Opposition', d: ['Conjunction', 'Elongation', 'Quadrature'] },
    { c: L, t: 4, q: 'Which bright star leads Canis Minor, the Little Dog?', a: 'Procyon', d: ['Gomeisa', 'Pollux', 'Castor'] },
    { c: L, t: 5, q: 'Which English astronomer discovered Triton just 17 days after Neptune itself was found in 1846?', a: 'William Lassell', d: ['John Herschel', 'William Bond', 'Asaph Hall'] },
  ],
];
