// Sci lane: Inventions. Inventors, history of technology and engineering,
// computing and internet history, communication, transport, power, printing,
// photography, everyday objects, patents and engineering feats.
const C = 'Inventions';
const Q = (t, q, a, d) => ({ c: C, t, q, a, d });

export const LANE_DAYS = [
  // day 1
  [
    Q(1, "Which American statesman invented bifocal eyeglasses?", "Benjamin Franklin", ["Thomas Jefferson", "John Adams", "Alexander Hamilton"]),
    Q(2, "In which US state did the Wright brothers make their first powered airplane flights in 1903?", "North Carolina", ["Ohio", "Virginia", "Kansas"]),
    Q(3, "Who built the steamboat Clermont, which began carrying passengers on the Hudson River in 1807?", "Robert Fulton", ["John Fitch", "Henry Shreve", "Cornelius Vanderbilt"]),
    Q(4, "Which British engineer patented a turbojet engine design in 1930?", "Frank Whittle", ["Geoffrey de Havilland", "R. J. Mitchell", "Barnes Wallis"]),
    Q(5, "Which Elizabethan courtier described an early flushing toilet that he installed for Queen Elizabeth I?", "John Harington", ["Thomas Crapper", "Francis Bacon", "Walter Raleigh"]),
  ],
  // day 2
  [
    Q(1, "What does the \"e\" in \"email\" stand for?", "Electronic", ["Express", "Easy", "External"]),
    Q(2, "Which Belgian instrument maker patented the saxophone in 1846?", "Adolphe Sax", ["Theobald Boehm", "Henri Selmer", "Jean-Baptiste Arban"]),
    Q(3, "Which Han dynasty court official is credited with improving papermaking around 105 AD?", "Cai Lun", ["Zhang Qian", "Sima Qian", "Bi Sheng"]),
    Q(4, "Which engineer designed both the Clifton Suspension Bridge and the steamship SS Great Britain?", "Isambard Kingdom Brunel", ["Thomas Telford", "Robert Stephenson", "John Rennie"]),
    Q(5, "Which designer created a famous early set of 176 emoji for a mobile phone service in Japan in 1999?", "Shigetaka Kurita", ["Satoshi Tajiri", "Masaya Nakamura", "Toru Iwatani"]),
  ],
  // day 3
  [
    Q(1, "Which ancient counting tool works by sliding beads along rods or wires?", "Abacus", ["Slide rule", "Sundial", "Quipu"]),
    Q(2, "Which water-lifting device, a spiral turning inside a tube, is traditionally credited to a mathematician of ancient Syracuse?", "Archimedes screw", ["Shaduf", "Noria", "Saqiya"]),
    Q(3, "What did Mary Anderson patent in 1903 to help drivers see through rain and snow?", "Windshield wiper", ["Rearview mirror", "Headlight", "Turn signal"]),
    Q(4, "Which German-born inventor created the Linotype, which cast whole lines of metal type for newspapers?", "Ottmar Mergenthaler", ["Richard March Hoe", "Tolbert Lanston", "Christopher Sholes"]),
    Q(5, "Which Lancashire inventor's spinning mule of 1779 combined ideas from the spinning jenny and the water frame?", "Samuel Crompton", ["James Hargreaves", "Richard Arkwright", "John Kay"]),
  ],
  // day 4
  [
    Q(1, "What kind of aircraft is a zeppelin?", "Airship", ["Biplane", "Helicopter", "Glider"]),
    Q(2, "What does the screen abbreviation LCD stand for?", "Liquid crystal display", ["Light color diode", "Low current display", "Linear contrast device"]),
    Q(3, "Which Dutch scientist built the first pendulum clock, in 1656?", "Christiaan Huygens", ["Galileo Galilei", "Robert Hooke", "Antonie van Leeuwenhoek"]),
    Q(4, "Which Scottish engineer led the development of radar for Britain's air defense in the 1930s?", "Robert Watson-Watt", ["Alan Blumlein", "John Logie Baird", "Frank Whittle"]),
    Q(5, "Which English engineer patented a steam pump in 1698, nicknamed the Miner's Friend?", "Thomas Savery", ["Thomas Newcomen", "Denis Papin", "John Smeaton"]),
  ],
  // day 5
  [
    Q(1, "Which Japanese word names the small picture symbols, like a smiling face, used in text messages?", "Emoji", ["Kanji", "Manga", "Origami"]),
    Q(2, "What nickname was given to the feared computer date glitch at the turn of the year 2000?", "The Y2K bug", ["The Millennium virus", "The Zero Day", "The Clock Crash"]),
    Q(3, "Which Italian, briefly an assistant to Galileo, invented the mercury barometer in 1643?", "Evangelista Torricelli", ["Blaise Pascal", "Otto von Guericke", "Robert Boyle"]),
    Q(4, "Around 1040, the Chinese printer Bi Sheng made the first known movable type from what material?", "Baked clay", ["Carved wood", "Cast bronze", "Polished jade"]),
    Q(5, "Which two Dartmouth professors created the BASIC programming language in 1964?", "John Kemeny and Thomas Kurtz", ["Dennis Ritchie and Ken Thompson", "John Backus and Peter Naur", "Brian Kernighan and Rob Pike"]),
  ],
  // day 6
  [
    Q(1, "Which three-letter distress call is sent in Morse code as three dots, three dashes, three dots?", "SOS", ["CQD", "MAY", "HLP"]),
    Q(2, "Which digital currency was launched in 2009 by the pseudonymous Satoshi Nakamoto?", "Bitcoin", ["Ethereum", "Litecoin", "Dogecoin"]),
    Q(3, "Which Italian instrument maker built the first piano, around 1700?", "Bartolomeo Cristofori", ["Antonio Stradivari", "Andrea Amati", "Giuseppe Guarneri"]),
    Q(4, "Which Han dynasty scholar built a bronze seismoscope in 132 AD, with dragons dropping balls into the mouths of toads?", "Zhang Heng", ["Cai Lun", "Zhang Qian", "Shen Kuo"]),
    Q(5, "Which Manhattan station, opened by Thomas Edison in 1882, was the first commercial central power plant in the United States?", "Pearl Street Station", ["Menlo Park Station", "Wall Street Station", "Hudson Street Station"]),
  ],
  // day 7
  [
    Q(1, "A penny-farthing, with one huge front wheel and one tiny rear wheel, is an early type of what?", "Bicycle", ["Carriage", "Wheelchair", "Motorcar"]),
    Q(2, "Count Ferdinand von Zeppelin, builder of giant dirigibles, came from which country?", "Germany", ["Austria", "Switzerland", "Netherlands"]),
    Q(3, "In 1844 Samuel Morse telegraphed \"What hath God wrought\" from Washington to which city?", "Baltimore", ["Philadelphia", "Richmond", "New York"]),
    Q(4, "Which Danzig-born scientist made the first reliable mercury thermometer, in 1714?", "Daniel Gabriel Fahrenheit", ["Anders Celsius", "René de Réaumur", "Ole Rømer"]),
    Q(5, "Which American built the Turtle, a one-man submarine that attacked a British warship in 1776?", "David Bushnell", ["Robert Fulton", "John Holland", "Horace Hunley"]),
  ],
  // day 8
  [
    Q(1, "What writing material did ancient Egyptians make from reeds growing along the Nile?", "Papyrus", ["Parchment", "Vellum", "Rice paper"]),
    Q(2, "What is the term for software whose code anyone may freely read, change and share?", "Open source", ["Freeware", "Shareware", "Public beta"]),
    Q(3, "What nickname did the Tacoma Narrows Bridge earn before wind tore it apart in 1940?", "Galloping Gertie", ["Swinging Sally", "Rolling Rosie", "Dancing Daisy"]),
    Q(4, "Which spectacle maker filed the first known patent application for a telescope, in the Netherlands in 1608?", "Hans Lippershey", ["Galileo Galilei", "Christiaan Huygens", "Antonie van Leeuwenhoek"]),
    Q(5, "Which Venetian printer introduced italic type around 1500?", "Aldus Manutius", ["Nicolas Jenson", "William Caxton", "Johann Froben"]),
  ],
  // day 9
  [
    Q(1, "What is a moving staircase in a store or station called?", "Escalator", ["Elevator", "Conveyor", "Funicular"]),
    Q(2, "Which electronic instrument is played by moving the hands near two antennas without touching it?", "Theremin", ["Synthesizer", "Mellotron", "Ondes Martenot"]),
    Q(3, "What kind of movable bridge is Tower Bridge, whose two road decks swing upward like drawbridges?", "Bascule bridge", ["Swing bridge", "Pontoon bridge", "Vertical-lift bridge"]),
    Q(4, "Which Greek engineer of Roman Egypt described the aeolipile, a sphere spun by jets of steam?", "Heron of Alexandria", ["Ctesibius", "Archimedes", "Philo of Byzantium"]),
    Q(5, "Which Japanese suspension bridge, opened in 1998, held the record for longest central span for more than two decades?", "Akashi Kaikyo Bridge", ["Great Belt Bridge", "Humber Bridge", "Tsing Ma Bridge"]),
  ],
  // day 10
  [
    Q(1, "What does the file abbreviation PDF stand for?", "Portable Document Format", ["Printed Data File", "Personal Digital Form", "Public Document Folder"]),
    Q(2, "The Japanese word karaoke roughly translates as \"empty\" what?", "Orchestra", ["Stage", "Microphone", "Theater"]),
    Q(3, "Which Toronto landmark, completed in 1976, was the world's tallest freestanding structure for over 30 years?", "CN Tower", ["Ostankino Tower", "Sears Tower", "Space Needle"]),
    Q(4, "Which cheap box camera, launched in 1900 for one dollar, put photography in the hands of children?", "Brownie", ["Instamatic", "Rolleiflex", "Leica"]),
    Q(5, "Jesse Reno's 1896 inclined elevator, an early escalator, first carried riders at which New York seaside resort?", "Coney Island", ["Rockaway Beach", "Long Beach", "Brighton Beach"]),
  ],
  // day 11
  [
    Q(1, "What does CPU stand for in a computer?", "Central processing unit", ["Computer power unit", "Core program utility", "Central printing unit"]),
    Q(2, "What nickname is often given to the rail tunnel beneath the English Channel?", "Chunnel", ["Tube", "Big Dig", "Underpass"]),
    Q(3, "Which American designer popularized the geodesic dome in the mid-20th century?", "Buckminster Fuller", ["Frank Lloyd Wright", "Eero Saarinen", "Charles Eames"]),
    Q(4, "Which American businessman led the effort that laid the first transatlantic telegraph cable, in 1858?", "Cyrus Field", ["Samuel Morse", "Cornelius Vanderbilt", "J. P. Morgan"]),
    Q(5, "Which Japanese musician built the 8 Juke, an early karaoke machine, in 1971?", "Daisuke Inoue", ["Akio Morita", "Masaru Ibuka", "Ikutaro Kakehashi"]),
  ],
  // day 12
  [
    Q(1, "What are the tiny dots that together make up a digital image called?", "Pixels", ["Bytes", "Cells", "Grains"]),
    Q(2, "What does the abbreviation LED stand for?", "Light-emitting diode", ["Low-energy display", "Laser emission device", "Liquid electric diode"]),
    Q(3, "Who made the first airplane flight across the English Channel, in 1909?", "Louis Blériot", ["Hubert Latham", "Alberto Santos-Dumont", "Glenn Curtiss"]),
    Q(4, "Which two Britons patented an electric telegraph in 1837 whose needles pointed to letters?", "William Cooke and Charles Wheatstone", ["Samuel Morse and Alfred Vail", "Werner von Siemens and Johann Halske", "Francis Ronalds and Edward Davy"]),
    Q(5, "Which French photographer patented the use of balloon photography for mapping and surveying in 1858?", "Nadar", ["Eugène Atget", "Hippolyte Bayard", "Louis Daguerre"]),
  ],
  // day 13
  [
    Q(1, "Which timer measures time by sand trickling from one glass bulb into another?", "Hourglass", ["Sundial", "Water clock", "Metronome"]),
    Q(2, "What does the abbreviation VCR stand for?", "Videocassette recorder", ["Visual content reader", "Video color receiver", "Variable cable relay"]),
    Q(3, "In which country was the QR code invented, in 1994, to track car parts?", "Japan", ["South Korea", "Germany", "United States"]),
    Q(4, "Which Frenchman built a network of semaphore towers, an optical telegraph, in the 1790s?", "Claude Chappe", ["Joseph-Marie Jacquard", "Claude-Louis Navier", "Nicolas Cugnot"]),
    Q(5, "Which two engineers patented the first barcode in 1952, a pattern of concentric circles?", "Norman Woodland and Bernard Silver", ["George Laurer and David Collins", "William Hewlett and David Packard", "Jack Kilby and Robert Noyce"]),
  ],
  // day 14
  [
    Q(1, "Which kind of aircraft lifts straight off the ground with spinning rotor blades instead of fixed wings?", "Helicopter", ["Glider", "Biplane", "Seaplane"]),
    Q(2, "The word \"blog\" is short for what?", "Weblog", ["Web logic", "Big log", "Binary log"]),
    Q(3, "What did the first SMS text message, sent to a phone in Britain in 1992, say?", "Merry Christmas", ["Happy New Year", "Hello World", "Testing testing"]),
    Q(4, "Which programmer chose the @ sign to separate user and host names in network email addresses in 1971?", "Ray Tomlinson", ["Vint Cerf", "Bob Kahn", "Larry Roberts"]),
    Q(5, "Which Frenchman made the first descent with a frameless parachute, dropping from a balloon over Paris in 1797?", "André-Jacques Garnerin", ["Louis-Sébastien Lenormand", "Jean-Pierre Blanchard", "Nadar"]),
  ],
  // day 15
  [
    Q(1, "What do solar panels convert sunlight into?", "Electricity", ["Natural gas", "Steam", "Gasoline"]),
    Q(2, "The word \"emoticon\" blends \"emotion\" with which other word?", "Icon", ["Cartoon", "Comic", "Code"]),
    Q(3, "Which greeting does the classic first test program print, made famous by a 1978 book on the C language?", "Hello, World", ["Testing", "Ready", "Welcome"]),
    Q(4, "Which English reformer's uniform penny post led to the first adhesive postage stamp, in 1840?", "Rowland Hill", ["Anthony Trollope", "Henry Cole", "Edwin Chadwick"]),
    Q(5, "Which statistician coined the word \"bit\" for a unit of information?", "John Tukey", ["Claude Shannon", "Norbert Wiener", "John von Neumann"]),
  ],
  // day 16
  [
    Q(1, "Which household device switches heating or cooling on and off to hold a set temperature?", "Thermostat", ["Thermometer", "Barometer", "Humidifier"]),
    Q(2, "What does CCTV, used for security cameras, stand for?", "Closed-circuit television", ["Central camera television", "Coded cable television", "Close-capture television"]),
    Q(3, "Which IBM computer system beat champions Ken Jennings and Brad Rutter on a TV quiz show in 2011?", "Watson", ["Deep Blue", "Big Blue", "Summit"]),
    Q(4, "Which engineer co-invented Ethernet at Xerox PARC in 1973?", "Bob Metcalfe", ["Vint Cerf", "Alan Kay", "Butler Lampson"]),
    Q(5, "Which computer scientist invented the Domain Name System in 1983?", "Paul Mockapetris", ["Jon Postel", "Vint Cerf", "Radia Perlman"]),
  ],
  // day 17
  [
    Q(1, "Which car instrument records the total distance a vehicle has traveled?", "Odometer", ["Speedometer", "Tachometer", "Altimeter"]),
    Q(2, "What does ROM stand for in computer memory?", "Read-only memory", ["Random object memory", "Rapid output module", "Remote operating memory"]),
    Q(3, "At about what speed did Concorde cruise, measured against the speed of sound?", "Mach 2", ["Mach 1", "Mach 3", "Mach 5"]),
    Q(4, "Which American thinker coined the word \"hypertext\" in the 1960s?", "Ted Nelson", ["Vannevar Bush", "Douglas Engelbart", "Tim Berners-Lee"]),
    Q(5, "What was the name of the 1990 program, written at McGill University, often called the first internet search engine?", "Archie", ["Veronica", "Gopher", "Jughead"]),
  ],
  // day 18
  [
    Q(1, "What is the main circuit board inside a computer called?", "Motherboard", ["Dashboard", "Keyboard", "Switchboard"]),
    Q(2, "In an IP address, what does IP stand for?", "Internet Protocol", ["Internal Port", "Information Path", "Internet Provider"]),
    Q(3, "Which engineer at Stanford Research Institute invented the computer mouse in the 1960s?", "Douglas Engelbart", ["Alan Kay", "Ivan Sutherland", "Ted Nelson"]),
    Q(4, "Which Yorkshire baronet, often called the father of aviation, built a glider that carried a man aloft in 1853?", "George Cayley", ["Otto Lilienthal", "Octave Chanute", "Samuel Langley"]),
    Q(5, "Which Spanish engineer invented the autogyro, a rotor aircraft that first flew in 1923?", "Juan de la Cierva", ["Igor Sikorsky", "Raúl Pateras Pescara", "Louis Breguet"]),
  ],
  // day 19
  [
    Q(1, "What is a portable computer that folds open like a book usually called?", "Laptop", ["Desktop", "Mainframe", "Server"]),
    Q(2, "What does the M in AM and FM radio stand for?", "Modulation", ["Megahertz", "Medium", "Microwave"]),
    Q(3, "What is the name of the 1891 resonant transformer, famous for throwing long electric sparks, named after its Serbian-American inventor?", "Tesla coil", ["Leyden jar", "Van de Graaff generator", "Jacob's ladder"]),
    Q(4, "Which Cornish engineer ran the first steam locomotive on rails, at Penydarren in Wales in 1804?", "Richard Trevithick", ["George Stephenson", "William Hedley", "Matthew Murray"]),
    Q(5, "What was the first submarine to sink an enemy warship, in 1864?", "H. L. Hunley", ["Turtle", "Nautilus", "Holland"]),
  ],
  // day 20
  [
    Q(1, "Which vehicle rides on a cushion of air over land and water?", "Hovercraft", ["Hydrofoil", "Catamaran", "Airboat"]),
    Q(2, "The computing word \"bit\" is short for what?", "Binary digit", ["Basic integer", "Byte item", "Binary instruction"]),
    Q(3, "Which Illinois blacksmith built a self-scouring steel plow in 1837?", "John Deere", ["Cyrus McCormick", "Jethro Tull", "Eli Whitney"]),
    Q(4, "Which city opened a commercial high-speed maglev line from its airport in 2004?", "Shanghai", ["Tokyo", "Berlin", "Seoul"]),
    Q(5, "Which English inventor's Rover of 1885 set the diamond-framed shape of the modern safety bicycle?", "John Kemp Starley", ["Pierre Michaux", "Kirkpatrick Macmillan", "Thomas Humber"]),
  ],
  // day 21
  [
    Q(1, "Benjamin Franklin's pointed rooftop rod was designed to protect buildings from what?", "Lightning", ["Hail", "Wind", "Earthquakes"]),
    Q(2, "Which engineer designed the iron framework that holds up the Statue of Liberty?", "Gustave Eiffel", ["Frédéric Bartholdi", "John Roebling", "Richard Morris Hunt"]),
    Q(3, "Which English farmer invented a horse-drawn seed drill around 1701?", "Jethro Tull", ["Charles Townshend", "Robert Bakewell", "Arthur Young"]),
    Q(4, "Which German baron built the pedal-less \"running machine\" of 1817, an ancestor of the bicycle?", "Karl Drais", ["Pierre Michaux", "Kirkpatrick Macmillan", "Gottlieb Daimler"]),
    Q(5, "Which engineer developed the electric self-starter that Cadillac fitted to its cars in 1912?", "Charles Kettering", ["Henry Leland", "Ransom Olds", "Thomas Midgley"]),
  ],
  // day 22
  [
    Q(1, "What is a small camera that streams live video from a computer over the internet called?", "Webcam", ["Camcorder", "Projector", "Scanner"]),
    Q(2, "Which artificial island off Dubai is shaped like a tree with a trunk and fronds?", "Palm Jumeirah", ["The World Islands", "Saadiyat Island", "Bluewaters Island"]),
    Q(3, "At what speed does a 12-inch long-playing vinyl album spin?", "33 1/3 rpm", ["45 rpm", "78 rpm", "16 rpm"]),
    Q(4, "Gottlieb Daimler and Wilhelm Maybach's Reitwagen of 1885 is often called the first what?", "Motorcycle", ["Bus", "Tractor", "Taxi"]),
    Q(5, "Which French gardener patented reinforced concrete flowerpots in 1867?", "Joseph Monier", ["François Hennebique", "Auguste Perret", "Joseph Aspdin"]),
  ],
  // day 23
  [
    Q(1, "What is the name for a website's address, such as example.com?", "Domain name", ["Search engine", "Hyperlink", "Password"]),
    Q(2, "What does the first S in SMS stand for?", "Short", ["Simple", "Secure", "Standard"]),
    Q(3, "Who set up the first printing press in England, at Westminster in 1476?", "William Caxton", ["Wynkyn de Worde", "Richard Pynson", "Aldus Manutius"]),
    Q(4, "Which German engineer built the first practical four-stroke internal combustion engine, in 1876?", "Nicolaus Otto", ["Gottlieb Daimler", "Karl Benz", "Rudolf Diesel"]),
    Q(5, "Which English bricklayer patented Portland cement in 1824?", "Joseph Aspdin", ["John Smeaton", "Joseph Monier", "Isaac Johnson"]),
  ],
  // day 24
  [
    Q(1, "What is an aircraft with no pilot aboard, flown from the ground, commonly called?", "Drone", ["Glider", "Blimp", "Biplane"]),
    Q(2, "Which element is the main material of most computer chips?", "Silicon", ["Copper", "Germanium", "Carbon"]),
    Q(3, "Which French teenager built a gear-driven adding machine in 1642 to help his tax-collector father?", "Blaise Pascal", ["René Descartes", "Pierre de Fermat", "Gottfried Leibniz"]),
    Q(4, "In which city was the first parking meter installed, in 1935?", "Oklahoma City", ["Chicago", "Detroit", "Los Angeles"]),
    Q(5, "Which Scottish watchmaker patented the S-bend trap for flush toilets in 1775?", "Alexander Cumming", ["Thomas Crapper", "Joseph Bramah", "John Harington"]),
  ],
  // day 25
  [
    Q(1, "Which part of a camera opens briefly to let light reach the film or sensor?", "Shutter", ["Lens cap", "Viewfinder", "Tripod"]),
    Q(2, "Which car safety device inflates in a crash to cushion the people inside?", "Airbag", ["Seat belt", "Crumple zone", "Roll cage"]),
    Q(3, "The word \"pixel\" is short for what?", "Picture element", ["Picture cell", "Print element", "Pigment cell"]),
    Q(4, "Which Scottish engineer gave his name to a road surface of compacted small stones?", "John Loudon McAdam", ["Thomas Telford", "John Metcalf", "Pierre Trésaguet"]),
    Q(5, "The first US patent, signed by George Washington in 1790, covered a process for making what?", "Potash", ["Gunpowder", "Paper", "Soap"]),
  ],
  // day 26
  [
    Q(1, "The 1972 arcade game Pong was a simple version of which sport?", "Table tennis", ["Hockey", "Squash", "Volleyball"]),
    Q(2, "Which crystal keeps time in most battery-powered watches?", "Quartz", ["Diamond", "Ruby", "Sapphire"]),
    Q(3, "The word \"modem\" joins which two words?", "Modulator and demodulator", ["Mode and demand", "Modular and memory", "Mobile and demand"]),
    Q(4, "Which English engineer invented the lawn mower in 1830?", "Edwin Budding", ["James Ransome", "Joseph Bramah", "Henry Maudslay"]),
    Q(5, "Which London newspaper was the first printed on Friedrich Koenig's steam-powered press, in 1814?", "The Times", ["The Guardian", "The Observer", "The Morning Chronicle"]),
  ],
  // day 27
  [
    Q(1, "Early automobiles were often called \"horseless\" what?", "Carriages", ["Wagons", "Chariots", "Sleighs"]),
    Q(2, "What nickname was given to Henry Ford's Model T?", "Tin Lizzie", ["Iron Annie", "Little Deuce", "Steel Sally"]),
    Q(3, "What does the word \"radar\" stand for?", "Radio detection and ranging", ["Rapid detection and response", "Range and distance radio", "Radio aerial direction"]),
    Q(4, "Which French engineer demonstrated the first neon lamps, in Paris in 1910?", "Georges Claude", ["Louis Renault", "Gustave Eiffel", "Édouard Branly"]),
    Q(5, "Which Frenchman developed pencil leads of graphite mixed with clay in 1795?", "Nicolas-Jacques Conté", ["Joseph Bramah", "Lothar von Faber", "Hymen Lipman"]),
  ],
  // day 28
  [
    Q(1, "On a phone, what is the word \"app\" short for?", "Application", ["Appliance", "Apparatus", "Approval"]),
    Q(2, "Which flammable gas gave the Hindenburg airship its lift?", "Hydrogen", ["Helium", "Methane", "Oxygen"]),
    Q(3, "What does the word \"laser\" stand for?", "Light amplification by stimulated emission of radiation", ["Light activated by stored electric radiation", "Linear amplified source of emitted rays", "Low-angle spectral emission ray"]),
    Q(4, "Which English chemist sold the first friction matches, in 1827?", "John Walker", ["Humphry Davy", "Joseph Priestley", "John Dalton"]),
    Q(5, "What did the first famous webcam, set up in Cambridge University's Trojan Room in 1991, show?", "A coffee pot", ["A fish tank", "A parking lot", "A clock tower"]),
  ],
  // day 29
  [
    Q(1, "On a TV, what does HD stand for?", "High definition", ["Hard drive", "Heavy duty", "High density"]),
    Q(2, "Which element fuels most nuclear power stations?", "Uranium", ["Plutonium", "Thorium", "Radium"]),
    Q(3, "What does SIM stand for in a phone's SIM card?", "Subscriber identity module", ["Secure internet memory", "Signal input module", "System identification map"]),
    Q(4, "Which American invented the railway air brake, in 1869?", "George Westinghouse", ["George Pullman", "Eli Janney", "Cornelius Vanderbilt"]),
    Q(5, "Which English clergyman invented the slide rule around 1622?", "William Oughtred", ["John Napier", "Edmund Gunter", "Henry Briggs"]),
  ],
  // day 30
  [
    Q(1, "In \"3D movie,\" what does the D stand for?", "Dimensional", ["Digital", "Display", "Density"]),
    Q(2, "Which programming language of 1995 took its name from a kind of coffee?", "Java", ["Python", "Ruby", "Perl"]),
    Q(3, "What does QR stand for in QR code?", "Quick Response", ["Quality Record", "Quick Reader", "Query Result"]),
    Q(4, "Whose steam turbine drove the speedboat Turbinia through a naval review at full speed in 1897?", "Charles Parsons", ["Gustaf de Laval", "Isambard Kingdom Brunel", "John Thornycroft"]),
    Q(5, "What was the nickname of the Manchester machine that ran the first stored program, in June 1948?", "Baby", ["Colossus", "Pilot ACE", "Whirlwind"]),
  ],
  // day 31
  [
    Q(1, "Which giant fairground ride made its debut at the 1893 World's Columbian Exposition in Chicago?", "Ferris wheel", ["Roller coaster", "Carousel", "Bumper cars"]),
    Q(2, "What does ISP stand for?", "Internet service provider", ["Internal system program", "Instant site publisher", "Internet security protocol"]),
    Q(3, "Harry Brearley is credited with inventing which alloy in Sheffield in 1913?", "Stainless steel", ["Duralumin", "Pewter", "Nickel silver"]),
    Q(4, "Which New Jersey laboratory unveiled the first practical silicon solar cell, in 1954?", "Bell Labs", ["Xerox PARC", "Los Alamos", "Lincoln Laboratory"]),
    Q(5, "Which physicist built Tennis for Two, an early video game shown on an oscilloscope in 1958?", "William Higinbotham", ["Steve Russell", "Ralph Baer", "Nolan Bushnell"]),
  ],
  // day 32
  [
    Q(1, "What is the screen of a desktop computer usually called?", "Monitor", ["Modem", "Router", "Tower"]),
    Q(2, "Which American inventor held more than 1,000 US patents?", "Thomas Edison", ["Nikola Tesla", "George Westinghouse", "Alexander Graham Bell"]),
    Q(3, "Which DuPont chemist led the team that invented nylon?", "Wallace Carothers", ["Roy Plunkett", "Stephanie Kwolek", "Leo Baekeland"]),
    Q(4, "Which German-born inventor patented the gramophone, which played flat discs, in 1887?", "Emile Berliner", ["Charles Tainter", "Eldridge Johnson", "Chichester Bell"]),
    Q(5, "Which American inventor created a waterproof diaper cover, the Boater, in 1946?", "Marion Donovan", ["Josephine Cochrane", "Bette Nesmith Graham", "Margaret Knight"]),
  ],
  // day 33
  [
    Q(1, "Which simple machine is a sloping surface used to raise heavy loads?", "Inclined plane", ["Pulley", "Lever", "Wheel and axle"]),
    Q(2, "What color is an airliner's \"black box\" flight recorder?", "Orange", ["Silver", "Yellow", "Blue"]),
    Q(3, "Which US president is the only one to hold a patent, for a device to lift boats over shoals?", "Abraham Lincoln", ["Thomas Jefferson", "Theodore Roosevelt", "Herbert Hoover"]),
    Q(4, "Which Utah-born inventor transmitted an image with an all-electronic television system in 1927?", "Philo Farnsworth", ["Vladimir Zworykin", "John Logie Baird", "Allen DuMont"]),
    Q(5, "Which French physicist built the \"steam digester,\" a forerunner of the pressure cooker, in 1679?", "Denis Papin", ["Edme Mariotte", "Thomas Savery", "Christiaan Huygens"]),
  ],
  // day 34
  [
    Q(1, "What drives the turbines of a hydroelectric dam?", "Flowing water", ["Wind", "Sunlight", "Natural gas"]),
    Q(2, "Which instrument tells a pilot the aircraft's height above sea level?", "Altimeter", ["Odometer", "Barometer", "Anemometer"]),
    Q(3, "Which river is held back by China's Three Gorges Dam?", "Yangtze", ["Yellow River", "Mekong", "Pearl River"]),
    Q(4, "Louis Essen built the first accurate atomic clock, in 1955, using atoms of which element?", "Cesium", ["Hydrogen", "Rubidium", "Strontium"]),
    Q(5, "Which American engineer built a giant electricity-generating windmill in Cleveland in 1888?", "Charles Brush", ["Poul la Cour", "James Blyth", "Thomas Edison"]),
  ],
  // day 35
  [
    Q(1, "Which flying toy, a light frame covered in silk or paper and flown on a string, was invented in ancient China?", "Kite", ["Boomerang", "Balloon", "Pinwheel"]),
    Q(2, "Which fuel do jet airliners burn?", "Kerosene", ["Diesel", "Propane", "Ethanol"]),
    Q(3, "John Wesley Hyatt developed celluloid while seeking a substitute for ivory in what?", "Billiard balls", ["Piano keys", "Chess pieces", "Combs"]),
    Q(4, "Jikji, printed in 1377, is the oldest surviving book printed with movable metal type. Where was it made?", "Korea", ["China", "Japan", "Vietnam"]),
    Q(5, "When the first message was sent over ARPANET in 1969, the system crashed after two letters. What did they spell?", "LO", ["HI", "OK", "GO"]),
  ],
  // day 36
  [
    Q(1, "What is the hand-held device used to change TV channels from across the room called?", "Remote control", ["Joystick", "Keypad", "Dial"]),
    Q(2, "In the name of 5G mobile networks, what does the G stand for?", "Generation", ["Gigabit", "Global", "Gateway"]),
    Q(3, "Which engine inventor vanished from a steamer crossing the English Channel in 1913?", "Rudolf Diesel", ["Nicolaus Otto", "Gottlieb Daimler", "Felix Wankel"]),
    Q(4, "Which German playwright invented lithography in 1796?", "Alois Senefelder", ["Friedrich Koenig", "Ottmar Mergenthaler", "Godefroy Engelmann"]),
    Q(5, "Which Japanese chemist shared the 2019 Nobel Prize in Chemistry for developing the lithium-ion battery?", "Akira Yoshino", ["Shuji Nakamura", "Hideki Shirakawa", "Ryoji Noyori"]),
  ],
  // day 37
  [
    Q(1, "In an email address, how is the @ sign usually read aloud?", "At", ["And", "About", "Across"]),
    Q(2, "What animal is Tux, the mascot of the Linux operating system?", "Penguin", ["Seal", "Owl", "Fox"]),
    Q(3, "Who patented the pneumatic bicycle tire in 1888 to give his son's tricycle a smoother ride?", "John Boyd Dunlop", ["Charles Goodyear", "Édouard Michelin", "Harvey Firestone"]),
    Q(4, "Which 1975 kit computer, featured on the cover of Popular Electronics, sparked the home computer boom?", "Altair 8800", ["Apple I", "Commodore PET", "TRS-80"]),
    Q(5, "Which engineer built the Menai Suspension Bridge to Anglesey, opened in 1826?", "Thomas Telford", ["John Rennie", "Robert Stephenson", "Marc Isambard Brunel"]),
  ],
  // day 38
  [
    Q(1, "What small power cells usually run a flashlight or a toy car?", "Batteries", ["Solar panels", "Springs", "Magnets"]),
    Q(2, "Which tube with mirrors lets a submarine crew see above the water?", "Periscope", ["Telescope", "Sonar", "Snorkel"]),
    Q(3, "Which German housewife invented the paper coffee filter, in 1908?", "Melitta Bentz", ["Margarete Steiff", "Bertha Benz", "Clara Zetkin"]),
    Q(4, "Which Post Office engineer built Colossus, the codebreaking computer used at Bletchley Park from 1944?", "Tommy Flowers", ["Alan Turing", "Max Newman", "Gordon Welchman"]),
    Q(5, "Which Frenchman's phonautograph of 1857 is the earliest known device to record sound?", "Édouard-Léon Scott de Martinville", ["Charles Cros", "Emile Berliner", "Thomas Edison"]),
  ],
  // day 39
  [
    Q(1, "What is a car powered by both a gasoline engine and an electric motor called?", "Hybrid", ["Diesel", "Turbo", "Convertible"]),
    Q(2, "What is a tower with sails turned by the wind to grind grain or pump water called?", "Windmill", ["Water wheel", "Treadmill", "Lighthouse"]),
    Q(3, "Which American scientist introduced instant photography, with a camera that developed its own prints, in 1948?", "Edwin Land", ["George Eastman", "Steven Sasson", "Edward Steichen"]),
    Q(4, "Which Hollywood actress co-patented a frequency-hopping system for guiding torpedoes in 1942?", "Hedy Lamarr", ["Marlene Dietrich", "Greta Garbo", "Mae West"]),
    Q(5, "Which German engineer patented magnetic recording tape in 1928?", "Fritz Pfleumer", ["Valdemar Poulsen", "Eduard Schüller", "Oberlin Smith"]),
  ],
  // day 40
  [
    Q(1, "What do you call a clickable word or picture that takes you to another web page?", "Hyperlink", ["Bookmark", "Banner", "Pop-up"]),
    Q(2, "Which canal structure, with gates at each end, raises and lowers boats between water levels?", "Lock", ["Dam", "Weir", "Jetty"]),
    Q(3, "Which Scottish scientist invented and named the kaleidoscope in 1816?", "David Brewster", ["James Watt", "Charles Wheatstone", "William Thomson"]),
    Q(4, "Which American inventor built a machine in 1868 that made flat-bottomed paper bags?", "Margaret Knight", ["Josephine Cochrane", "Mary Anderson", "Marion Donovan"]),
    Q(5, "Which Guatemalan computer scientist helped invent CAPTCHA, the test that tells humans from bots?", "Luis von Ahn", ["Ray Kurzweil", "Eric Schmidt", "Larry Page"]),
  ],
  // day 41
  [
    Q(1, "What are the small files that websites store in your browser to remember you called?", "Cookies", ["Crumbs", "Tokens", "Tabs"]),
    Q(2, "What is the name for fake emails that trick people into giving away passwords?", "Phishing", ["Trolling", "Streaming", "Lurking"]),
    Q(3, "Where did the Adams Power Plant begin large-scale alternating current hydroelectric generation in 1895?", "Niagara Falls", ["Hoover Dam", "Grand Coulee", "Muscle Shoals"]),
    Q(4, "Which New York inventor patented the safety pin in 1849?", "Walter Hunt", ["Elias Howe", "Isaac Singer", "Charles Goodyear"]),
    Q(5, "Which Carnegie Mellon computer scientist proposed the typed smiley :-) in 1982?", "Scott Fahlman", ["Ray Tomlinson", "Larry Tesler", "Ward Christensen"]),
  ],
  // day 42
  [
    Q(1, "Which device turns sound into an electrical signal?", "Microphone", ["Speaker", "Amplifier", "Antenna"]),
    Q(2, "On a website, what does FAQ stand for?", "Frequently asked questions", ["Fast access query", "Formal account question", "File and query"]),
    Q(3, "Which 1993 web browser from the University of Illinois made the web popular by showing pictures alongside text?", "Mosaic", ["Netscape Navigator", "Lynx", "Opera"]),
    Q(4, "Which computer scientist coined the term \"artificial intelligence\" for a 1956 workshop at Dartmouth?", "John McCarthy", ["Marvin Minsky", "Claude Shannon", "Herbert Simon"]),
    Q(5, "What kind of storage did IBM's RAMAC computer introduce in 1956?", "Hard disk drive", ["Floppy disk", "Magnetic tape", "Punched card"]),
  ],
  // day 43
  [
    Q(1, "Which kind of camera produces a printed photo moments after the picture is taken?", "Instant camera", ["Pinhole camera", "Box camera", "Video camera"]),
    Q(2, "In an email, what does CC stand for?", "Carbon copy", ["Copy check", "Common contact", "Central copy"]),
    Q(3, "What was the name of Joseph Weizenbaum's 1966 program that imitated a psychotherapist?", "ELIZA", ["PARRY", "SHRDLU", "ALICE"]),
    Q(4, "Which Buddhist text, printed in China in 868, is the oldest dated printed book?", "Diamond Sutra", ["Lotus Sutra", "Heart Sutra", "Tao Te Ching"]),
    Q(5, "Which German research institute developed the MP3 audio format?", "Fraunhofer Society", ["Max Planck Society", "Helmholtz Association", "Leibniz Association"]),
  ],
  // day 44
  [
    Q(1, "What is a harmful computer program that copies itself and spreads called?", "Virus", ["Patch", "Firewall", "Plugin"]),
    Q(2, "Which communication device's name comes from Greek words meaning \"far writing\"?", "Telegraph", ["Telephone", "Television", "Telescope"]),
    Q(3, "Who made the first nonstop transatlantic flight, in 1919?", "John Alcock and Arthur Brown", ["Albert Read and Walter Hinton", "Charles Kingsford Smith and Charles Ulm", "Wilbur and Orville Wright"]),
    Q(4, "Which skyscraper, the world's tallest from 2004 to 2010, hangs a giant steel ball as a tuned mass damper?", "Taipei 101", ["Petronas Towers", "Shanghai World Financial Center", "Burj Khalifa"]),
    Q(5, "Which engineer wrote \"The Book of Knowledge of Ingenious Mechanical Devices\" in 1206?", "Ismail al-Jazari", ["Banu Musa", "Ibn al-Haytham", "Taqi al-Din"]),
  ],
  // day 45
  [
    Q(1, "On most computers, what does the shortcut Ctrl+Z do?", "Undo", ["Save", "Print", "Zoom"]),
    Q(2, "The word \"photography\" comes from Greek words meaning drawing with what?", "Light", ["Ink", "Silver", "Shadow"]),
    Q(3, "Which British engineer invented the hovercraft in the 1950s?", "Christopher Cockerell", ["Frank Whittle", "Barnes Wallis", "Alec Issigonis"]),
    Q(4, "Which cable-stayed bridge in southern France had the tallest bridge piers in the world when it opened in 2004?", "Millau Viaduct", ["Pont de Normandie", "Garabit Viaduct", "Pont du Gard"]),
    Q(5, "For which invention did Isamu Akasaki, Hiroshi Amano and Shuji Nakamura share the 2014 Nobel Prize in Physics?", "Blue LED", ["Optical fiber", "CCD sensor", "Lithium-ion battery"]),
  ],
  // day 46
  [
    Q(1, "What is the on-screen pointer that moves when you move the mouse called?", "Cursor", ["Icon", "Widget", "Toolbar"]),
    Q(2, "What does the abbreviation rpm stand for?", "Revolutions per minute", ["Rotations per meter", "Radio pulse modulation", "Rapid power mode"]),
    Q(3, "Which 1988 self-spreading program, written by a Cornell graduate student, slowed much of the early internet?", "Morris worm", ["ILOVEYOU", "Melissa", "Brain"]),
    Q(4, "Which family of engineers designed and built the Brooklyn Bridge, completed in 1883?", "The Roeblings", ["The Stevensons", "The Brunels", "The Ellets"]),
    Q(5, "Which engineer won a Nobel Prize for showing in 1966 that pure glass fibers could carry light signals over long distances?", "Charles Kao", ["Dennis Gabor", "Willard Boyle", "Theodore Maiman"]),
  ],
  // day 47
  [
    Q(1, "Archaeologists date early Mesopotamian examples of which invention to around 3500 BC, transforming transport?", "Wheel", ["Sail", "Saddle", "Plow"]),
    Q(2, "In a web address beginning HTTPS, what does the S stand for?", "Secure", ["Server", "Standard", "Site"]),
    Q(3, "What was the first spreadsheet program for personal computers, released in 1979?", "VisiCalc", ["Lotus 1-2-3", "Excel", "SuperCalc"]),
    Q(4, "What were the electromechanical machines called that searched for Enigma settings at Bletchley Park?", "Bombes", ["Typex", "Heath Robinsons", "Colossi"]),
    Q(5, "Which Hungarian-born engineer invented holography in 1947?", "Dennis Gabor", ["Leo Szilard", "Theodore von Kármán", "John von Neumann"]),
  ],
  // day 48
  [
    Q(1, "What is the main front page of a website usually called?", "Homepage", ["Landing strip", "Title page", "Masthead"]),
    Q(2, "What energy source does a geothermal power plant tap?", "Heat from inside the Earth", ["Ocean tides", "Sunlight", "Wind"]),
    Q(3, "What did Thomas Edison's first phonograph of 1877 record sound onto?", "Tinfoil", ["Wax", "Shellac", "Vinyl"]),
    Q(4, "What was the name of the first web browser, written by Tim Berners-Lee in 1990?", "WorldWideWeb", ["Mosaic", "Lynx", "Erwise"]),
    Q(5, "Which German engineer designed the engine of the Heinkel He 178, the first jet aircraft to fly, in 1939?", "Hans von Ohain", ["Frank Whittle", "Anselm Franz", "Ernst Heinkel"]),
  ],
];
