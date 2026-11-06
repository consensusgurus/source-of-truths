// Orbit lane: Space (solar system, Sun, stars, galaxies, cosmology, comets, the sky,
// telescopes, completed missions). SEGMENT 2: days 37 to 63 (2026-12-05 to
// 2026-12-31), 27 days, tiers 1-5 each day. Written 2026-11-06.
// gen-science.mjs appends every day in this file after the bank's last day, so
// this file holds ONLY the newest segment; days 1 to 36 (the launch segment)
// are in git history at commit 1260977a and frozen in app/orbit/questions.js.
// Frozen facts only: no moon counts, no "current" records, every mission dated.
// Screened against Sci, Streak and Deep so the site does not ask the same fact
// twice (scripts/trivia-lane-check.mjs "already in" warnings).
const C = "Space";
const E = (t, q, a, ...d) => ({ c: C, t, q, a, d });

export const LANE_DAYS = [
  // day 37 (Dec 5)
  [
    E(1, "Which day of the week takes its name from the Moon?", "Monday", "Sunday", "Saturday", "Tuesday"),
    E(2, "ISRO is the space agency of which country?", "India", "Israel", "Iran", "Indonesia"),
    E(3, "What do mission scientists call one day on Mars?", "A sol", "A mar", "A rev", "An ares"),
    E(4, "What is the darkest inner part of a shadow, where an eclipse is total, called?", "The umbra", "The penumbra", "The antumbra", "The corona"),
    E(5, "Which NASA probe went into orbit around the giant asteroid Vesta in 2011?", "Dawn", "Galileo", "NEAR Shoemaker", "Rosetta"),
  ],
  // day 38 (Dec 6)
  [
    E(1, "Standing on the Moon in full daylight, what color would the sky look?", "Black", "Blue", "Orange", "White"),
    E(2, "Which hilltop observatory, a landmark of Los Angeles, looks out toward the Hollywood sign?", "Griffith Observatory", "Lick Observatory", "Palomar Observatory", "Lowell Observatory"),
    E(3, "About how long does light reflected off the Moon take to reach Earth?", "About 1.3 seconds", "About 8 minutes", "About 1 hour", "About 0.01 seconds"),
    E(4, "What are the extremely bright cores of distant galaxies, powered by gas falling into huge black holes, called?", "Quasars", "Pulsars", "Magnetars", "Globular clusters"),
    E(5, "Which pair of probes, launched in 1972 and 1973, carried engraved plaques showing a man and a woman?", "Pioneer 10 and 11", "Mariner 6 and 7", "Viking 1 and 2", "Venera 9 and 10"),
  ],
  // day 39 (Dec 7)
  [
    E(1, "Where does moonlight come from?", "Sunlight reflected off the Moon", "Glowing lunar rock", "Light from Earth's cities", "Gas burning on the Moon"),
    E(2, "What do engineers fit to the bottom of a capsule so it does not burn up on its return through the air?", "A heat shield", "A parachute", "A solar panel", "An antenna"),
    E(3, "The famous Blue Marble photo of the whole sunlit Earth was taken in December 1972 by the crew of which mission?", "Apollo 17", "Apollo 8", "Apollo 11", "Apollo 13"),
    E(4, "In which layer of Earth's atmosphere does the International Space Station orbit?", "The thermosphere", "The stratosphere", "The troposphere", "The mesosphere"),
    E(5, "What is a planet that drifts through space without orbiting any star called?", "A rogue planet", "A dwarf planet", "A hot Jupiter", "A brown dwarf"),
  ],
  // day 40 (Dec 8)
  [
    E(1, "Which planet is closest to the Sun?", "Mercury", "Venus", "Mars", "Earth"),
    E(2, "In which year was NASA founded?", "1958", "1946", "1969", "1975"),
    E(3, "What was the name of John Glenn's Mercury capsule on his 1962 orbital flight?", "Friendship 7", "Liberty Bell 7", "Freedom 7", "Aurora 7"),
    E(4, "Surface air pressure on Venus is roughly how many times Earth's?", "About 90", "About 2", "About 10", "About 900"),
    E(5, "Which nine-level scale rates how dark the night sky is at a given site?", "The Bortle scale", "The Messier scale", "The Hubble scale", "The Kelvin scale"),
  ],
  // day 41 (Dec 9)
  [
    E(1, "What do we call a person who studies stars and planets for a living?", "An astronomer", "An astrologer", "A geologist", "A meteorologist"),
    E(2, "In which South American territory does Europe launch its Ariane rockets?", "French Guiana", "Suriname", "Brazil", "Chile"),
    E(3, "What did SpaceX send up as a test payload on the first Falcon Heavy launch, in 2018?", "A red sports car", "A grand piano", "A wheel of cheese", "A life-size robot"),
    E(4, "What is the fraction of light that a planet or moon reflects called?", "Its albedo", "Its magnitude", "Its parallax", "Its luminosity"),
    E(5, "How long is a sidereal day, one spin of Earth measured against the distant stars?", "About 23 hours 56 minutes", "Exactly 24 hours", "About 24 hours 4 minutes", "About 23 hours 4 minutes"),
  ],
  // day 42 (Dec 10)
  [
    E(1, "What are the twinkling points of light in the night sky, which are really distant suns?", "Stars", "Planets", "Comets", "Satellites"),
    E(2, "On most flights, what color was the space shuttle's huge external fuel tank?", "Orange", "White", "Black", "Silver"),
    E(3, "Orbiting about every 90 minutes, roughly how many sunrises do ISS crews see each day?", "About 16", "About 2", "About 6", "About 48"),
    E(4, "Which space shuttle orbiter was used only for test flights in the atmosphere and never reached space?", "Enterprise", "Endeavour", "Discovery", "Challenger"),
    E(5, "Which NASA lander recorded marsquakes from 2018 to 2022?", "InSight", "Phoenix", "Viking 2", "Spirit"),
  ],
  // day 43 (Dec 11)
  [
    E(1, "What happens during a solar eclipse?", "The Moon passes between Earth and the Sun", "Earth passes between the Sun and the Moon", "The Sun goes dark for a day", "Clouds hide the Sun"),
    E(2, "In US folklore, what name is often given to the full moon of December?", "The Cold Moon", "The Wolf Moon", "The Harvest Moon", "The Pink Moon"),
    E(3, "What is the NASA aircraft that flies steep arcs to give trainees brief weightlessness nicknamed?", "The Vomit Comet", "The Air Bubble", "The Zero Hero", "The Float Boat"),
    E(4, "What are the extra-large tides that come near new moon and full moon called?", "Spring tides", "Neap tides", "Ebb tides", "Slack tides"),
    E(5, "Earth's axis slowly wobbles like a top's, tracing a full circle about once every how many years?", "About 26,000", "About 2,600", "About 260,000", "About 260"),
  ],
  // day 44 (Dec 12)
  [
    E(1, "How many natural moons does Earth have?", "One", "Two", "None", "Three"),
    E(2, "What do we call a robotic spacecraft that circles a planet instead of landing on it?", "An orbiter", "A rover", "A lander", "A probe ship"),
    E(3, "The 'Great American Eclipse' of August 2017 crossed the United States from Oregon to which state?", "South Carolina", "Florida", "Maine", "Texas"),
    E(4, "About how fast does Earth travel along its orbit around the Sun?", "About 30 kilometers per second", "About 3 kilometers per second", "About 300 kilometers per second", "About 30 meters per second"),
    E(5, "What is the fuel-saving elliptical path used to move a spacecraft between two circular orbits called?", "A Hohmann transfer", "A Molniya orbit", "A sun-synchronous orbit", "A halo orbit"),
  ],
  // day 45 (Dec 13)
  [
    E(1, "What do we call the Sun dropping below the horizon each evening?", "Sunset", "Sunrise", "An eclipse", "Dawn"),
    E(2, "What mainly causes Earth's seasons?", "The tilt of its axis", "Its changing distance from the Sun", "Sunspots", "The Moon's phases"),
    E(3, "Blue Origin's New Shepard rocket is named after which astronaut?", "Alan Shepard", "John Glenn", "Gus Grissom", "Neil Armstrong"),
    E(4, "Which constellation, outside the traditional twelve zodiac signs, does the Sun pass through each December?", "Ophiuchus", "Cetus", "Orion", "Auriga"),
    E(5, "Which NASA orbiter ended its mission by plunging into Jupiter in September 2003?", "Galileo", "Juno", "Cassini", "Ulysses"),
  ],
  // day 46 (Dec 14)
  [
    E(1, "What do astronauts ride up through the atmosphere at launch, sitting on top of a tall stack of fuel?", "A rocket", "A glider", "A blimp", "A helicopter"),
    E(2, "In which year did Halley's Comet last swing through the inner solar system?", "1986", "1910", "1997", "1973"),
    E(3, "Which country's Hope probe went into orbit around Mars in February 2021?", "The United Arab Emirates", "Saudi Arabia", "Israel", "Turkey"),
    E(4, "Which US observatory made the first direct detection of gravitational waves, in September 2015?", "LIGO", "Virgo", "Fermi", "Kepler"),
    E(5, "Who made the first untethered spacewalk, flying a jet backpack away from the shuttle in 1984?", "Bruce McCandless", "Story Musgrave", "Ed White", "Michael Collins"),
  ],
  // day 47 (Dec 15)
  [
    E(1, "What is a shooting star actually?", "A meteor", "A comet", "A dying star", "A distant planet"),
    E(2, "In astronaut jargon, what does EVA stand for?", "Extravehicular activity", "Emergency vehicle alarm", "Earth view altitude", "External velocity adjustment"),
    E(3, "In which year was New Horizons launched on its way to Pluto?", "2006", "1997", "2012", "2015"),
    E(4, "Which NASA rover, built for a 90-day mission, kept exploring Mars until 2018?", "Opportunity", "Spirit", "Sojourner", "Curiosity"),
    E(5, "Which country sent a cat named Felicette into space in 1963?", "France", "The Soviet Union", "The United States", "Britain"),
  ],
  // day 48 (Dec 16)
  [
    E(1, "What should you look through to watch the partial phase of an eclipse of the Sun safely?", "Special solar-filter glasses", "Ordinary sunglasses", "A camera's viewfinder", "Binoculars"),
    E(2, "Seen from space, above the air, what color is the Sun's light?", "White", "Yellow", "Orange", "Red"),
    E(3, "Why do we always see the same side of the Moon?", "It spins once for each orbit of Earth", "It does not spin at all", "Earth blocks the far side", "The far side is always dark"),
    E(4, "Which Chinese mission brought rock samples back from the Moon in December 2020?", "Chang'e 5", "Chang'e 4", "Yutu 2", "Tianwen-1"),
    E(5, "Which faint white dwarf orbits the Dog Star?", "Sirius B", "Procyon A", "Proxima Centauri", "Alcor"),
  ],
  // day 49 (Dec 17)
  [
    E(1, "What does a rocket engine shoot out of its back to push the rocket forward?", "Hot exhaust gas", "Cold water", "Electric sparks", "Magnetic waves"),
    E(2, "What is the name of the Russian crew capsule that has flown people to orbit since 1967?", "Soyuz", "Vostok", "Mir", "Salyut"),
    E(3, "What is the robotic arm on the International Space Station, built by Canada, called?", "Canadarm2", "Dextre Arm", "Maple Arm", "Northstar"),
    E(4, "Which small rover, carried by Mars Pathfinder in 1997, was the first to roam Mars?", "Sojourner", "Spirit", "Lunokhod 2", "Zhurong"),
    E(5, "What is the feared cascade of orbital collisions, each creating debris that causes more, called?", "Kessler syndrome", "Roche cascade", "Lagrange effect", "Carrington cascade"),
  ],
  // day 50 (Dec 18)
  [
    E(1, "The two stars at the end of the Big Dipper's bowl point toward which star?", "Polaris", "Sirius", "Vega", "Betelgeuse"),
    E(2, "What is the name of the rover China landed on Mars in May 2021?", "Zhurong", "Yutu", "Tianwen", "Chang'e"),
    E(3, "Which planet takes about 84 Earth years to circle the Sun once?", "Uranus", "Saturn", "Jupiter", "Mars"),
    E(4, "What is the largest gap in Saturn's rings called?", "The Cassini Division", "The Encke Gap", "The Keeler Gap", "The Maxwell Gap"),
    E(5, "The Hoba meteorite, the largest single meteorite known, lies where it fell in which country?", "Namibia", "Australia", "Argentina", "Greenland"),
  ],
  // day 51 (Dec 19)
  [
    E(1, "Why can't sound travel through outer space?", "There is no air to carry it", "It is too cold", "Starlight drowns it out", "Gravity is too weak"),
    E(2, "In NASA's name, what does the first A stand for?", "Aeronautics", "Astronomy", "Aerospace", "America"),
    E(3, "What did Edwin Hubble's observations of distant galaxies, published in 1929, show?", "The universe is expanding", "The universe is shrinking", "The Milky Way is the only galaxy", "Galaxies never move"),
    E(4, "On the astronomical magnitude scale, which of these is the brightest?", "Magnitude minus 1", "Magnitude 0", "Magnitude 1", "Magnitude 6"),
    E(5, "Which red supergiant in Orion faded dramatically in a 'Great Dimming' around the start of 2020?", "Betelgeuse", "Rigel", "Antares", "Aldebaran"),
  ],
  // day 52 (Dec 20)
  [
    E(1, "What are the human-made objects seen as steady moving dots of light crossing the night sky?", "Satellites", "Comets", "Meteors", "Planets"),
    E(2, "What is a bowl-shaped hollow blasted into a moon or planet by an impact called?", "A crater", "A canyon", "A volcano", "A rille"),
    E(3, "About how long does the International Space Station take to circle Earth once?", "About 90 minutes", "About 24 hours", "About 12 hours", "About 10 minutes"),
    E(4, "About how high above the equator do geostationary satellites orbit?", "About 36,000 kilometers", "About 400 kilometers", "About 2,000 kilometers", "About 384,000 kilometers"),
    E(5, "Which Wisconsin observatory houses the largest refracting telescope ever built for research, with a 40-inch lens?", "Yerkes", "Lick", "Mount Wilson", "McDonald"),
  ],
  // day 53 (Dec 21)
  [
    E(1, "Which object travels through space with Earth as its companion, lighting our nights?", "The Moon", "The Sun", "Mars", "Venus"),
    E(2, "On the December solstice, the noon Sun stands directly overhead along which line of latitude?", "The Tropic of Capricorn", "The Tropic of Cancer", "The equator", "The Arctic Circle"),
    E(3, "Which minor meteor shower peaks around the December solstice, radiating from near the Little Dipper?", "The Ursids", "The Lyrids", "The Draconids", "The Taurids"),
    E(4, "About how many Earths would fit side by side across the Sun's diameter?", "About 109", "About 10", "About 1,000", "About 1 million"),
    E(5, "Which NASA infrared space telescope operated from 2003 until 2020?", "Spitzer", "Herschel", "WISE", "IRAS"),
  ],
  // day 54 (Dec 22)
  [
    E(1, "What kind of animal was Laika, the first animal to orbit Earth?", "A dog", "A monkey", "A cat", "A mouse"),
    E(2, "Near the poles in winter, what is the stretch when the Sun stays below the horizon all day called?", "The polar night", "The white night", "The equinox", "The midnight sun"),
    E(3, "The Moon's diameter is about what fraction of Earth's?", "About one-quarter", "About one-half", "About one-tenth", "About one-hundredth"),
    E(4, "Debris from which falling US space station landed in Western Australia in 1979?", "Skylab", "Mir", "Salyut 7", "Tiangong-1"),
    E(5, "Which NASA spacecraft skimmed about 6 million kilometers above the Sun's surface on December 24, 2024?", "Parker Solar Probe", "Solar Orbiter", "SOHO", "Helios 2"),
  ],
  // day 55 (Dec 23)
  [
    E(1, "What do we call the long glowing trail of gas and dust that streams from a comet?", "Its tail", "Its halo", "Its orbit", "Its wake"),
    E(2, "What was the first module of the International Space Station, launched in November 1998?", "Zarya", "Unity", "Zvezda", "Destiny"),
    E(3, "For about 20 of every 248 years, which body comes closer to the Sun than Neptune does?", "Pluto", "Uranus", "Ceres", "Eris"),
    E(4, "Which constellation contains the bright red star Antares?", "Scorpius", "Sagittarius", "Taurus", "Leo"),
    E(5, "In which city did the International Astronomical Union vote in 2006 to reclassify Pluto?", "Prague", "Paris", "Geneva", "Vienna"),
  ],
  // day 56 (Dec 24)
  [
    E(1, "What do we call the moment a rocket leaves the launch pad?", "Liftoff", "Splashdown", "Touchdown", "Docking"),
    E(2, "On Christmas Eve 1968, the Apollo 8 crew read aloud from which book while orbiting the Moon?", "The Book of Genesis", "The Book of Psalms", "The Gospel of Luke", "The Book of Exodus"),
    E(3, "What is the seven-windowed observation module on the International Space Station called?", "The Cupola", "The Lantern", "The Bridge", "The Skylight"),
    E(4, "About how hot is the Sun's visible surface, in degrees Celsius?", "About 5,500", "About 550", "About 55,000", "About 5.5 million"),
    E(5, "What is the stretching of anything falling into a black hole into a long, thin strand popularly called?", "Spaghettification", "Tidal braking", "Redshifting", "Frame dragging"),
  ],
  // day 57 (Dec 25)
  [
    E(1, "Which planet is third from the Sun?", "Earth", "Mars", "Venus", "Jupiter"),
    E(2, "Which giant space telescope was launched on Christmas Day 2021?", "The James Webb Space Telescope", "The Hubble Space Telescope", "The Spitzer Space Telescope", "The Chandra X-ray Observatory"),
    E(3, "What nickname was given to a strong, unexplained radio burst picked up by Ohio State's Big Ear telescope in 1977?", "The Wow! signal", "The Big Ear echo", "The Ohio pulse", "The Green Men beacon"),
    E(4, "Which 1961 equation estimates how many civilizations in our galaxy might be sending out radio signals?", "The Drake equation", "The Fermi equation", "The Sagan equation", "The Friedmann equation"),
    E(5, "Which galaxy, M104, is named after a wide-brimmed Mexican hat?", "The Sombrero Galaxy", "The Whirlpool Galaxy", "The Pinwheel Galaxy", "The Cigar Galaxy"),
  ],
  // day 58 (Dec 26)
  [
    E(1, "Which of these is a planet?", "Jupiter", "Sirius", "Polaris", "Andromeda"),
    E(2, "Which kind of animal life was the first to be sent into space, aboard a V-2 rocket in 1947?", "Fruit flies", "Mice", "Monkeys", "Dogs"),
    E(3, "What was the name of the 2021 SpaceX flight that put the first all-civilian crew into orbit?", "Inspiration4", "Polaris Dawn", "Axiom-1", "Demo-2"),
    E(4, "In which country is the Baikonur Cosmodrome, launch site of Sputnik and of Gagarin's flight?", "Kazakhstan", "Russia", "Ukraine", "Uzbekistan"),
    E(5, "GPS satellite clocks tick slightly fast compared with clocks on the ground, mainly because of what?", "Weaker gravity at their height", "Solar radiation", "The cold of space", "Their radio signals"),
  ],
  // day 59 (Dec 27)
  [
    E(1, "Which half of Earth is having night at any moment?", "The half facing away from the Sun", "The half facing the Sun", "The Southern Hemisphere", "The Western Hemisphere"),
    E(2, "Standing on Mars, you would weigh about what share of your weight on Earth?", "About 38 percent", "About 10 percent", "About 75 percent", "About twice as much"),
    E(3, "By Kepler's first law, what shape is each planet's orbit?", "An ellipse", "A perfect circle", "A spiral", "A parabola"),
    E(4, "One light-year is roughly how many kilometers?", "About 9.5 trillion", "About 9.5 billion", "About 300,000", "About 150 million"),
    E(5, "Which two Bell Labs radio astronomers announced the discovery of the cosmic microwave background in 1965?", "Penzias and Wilson", "Hewish and Ryle", "Jansky and Reber", "Alpher and Herman"),
  ],
  // day 60 (Dec 28)
  [
    E(1, "Which part of a spacecraft unfolds to turn sunlight into electricity?", "Its solar panels", "Its heat shield", "Its antenna", "Its thrusters"),
    E(2, "Which bright yellow star leads Auriga, the Charioteer, high in winter skies?", "Capella", "Vega", "Deneb", "Altair"),
    E(3, "What is the name of Pluto's large, bright heart-shaped region?", "Tombaugh Regio", "Lowell Planitia", "Sputnik Mons", "Charon Basin"),
    E(4, "By Kepler's second law, when does a planet move fastest along its orbit?", "When it is closest to the Sun", "When it is farthest from the Sun", "At the equinoxes", "Never; its speed is constant"),
    E(5, "Which faint red dwarf, about 6 light-years away, moves across our sky faster than any other star?", "Barnard's Star", "Proxima Centauri", "Wolf 359", "Sirius B"),
  ],
  // day 61 (Dec 29)
  [
    E(1, "What do we call the path a planet follows around the Sun?", "Its orbit", "Its axis", "Its rotation", "Its eclipse"),
    E(2, "Which planet is the second largest in our solar system?", "Saturn", "Neptune", "Uranus", "Earth"),
    E(3, "Why does the Moon turn a coppery red during a total lunar eclipse?", "Sunlight bends through Earth's atmosphere onto it", "The Moon's surface heats up", "Dust storms cover the Moon", "Mars reflects red light onto it"),
    E(4, "What is a giant gas planet that orbits very close to its star, like 51 Pegasi b, called?", "A hot Jupiter", "A super-Earth", "A brown dwarf", "A mini-Neptune"),
    E(5, "What is the bubble blown by the solar wind around the solar system, whose edge Voyager 1 crossed in 2012?", "The heliosphere", "The magnetosphere", "The Oort Cloud", "The Kuiper Belt"),
  ],
  // day 62 (Dec 30)
  [
    E(1, "What did the Apollo 11 astronauts plant on the Moon in July 1969?", "An American flag", "A tree", "A time capsule", "A radio tower"),
    E(2, "Seen from above Earth's North Pole, in which direction do all eight planets travel around the Sun?", "Counterclockwise", "Clockwise", "Some each way", "Up and down"),
    E(3, "In which month is Earth closest to the Sun?", "January", "July", "June", "March"),
    E(4, "Ignoring air, about how many kilometers per second must something reach to escape Earth's gravity?", "About 11.2", "About 7.9", "About 3.0", "About 42"),
    E(5, "In the letter scale used to rank solar flares by strength, which class is the most powerful?", "X", "A", "C", "M"),
  ],
  // day 63 (Dec 31)
  [
    E(1, "What do we call one full trip of Earth around the Sun?", "A year", "A day", "A month", "A season"),
    E(2, "Which kind of telescope, like Hubble, works from orbit above Earth's blurring air?", "A space telescope", "A radio telescope", "A solar telescope", "A balloon telescope"),
    E(3, "Which Chilean desert is home to the ALMA radio telescope array?", "The Atacama", "The Sonoran", "The Gobi", "The Namib"),
    E(4, "What was occasionally added to the world's clocks, often at the very end of December 31, to keep atomic time in step with Earth's spin?", "A leap second", "A leap day", "A leap minute", "A sidereal second"),
    E(5, "What is the point in the sky directly beneath an observer, opposite the zenith, called?", "The nadir", "The meridian", "The horizon", "The pole"),
  ],
];
