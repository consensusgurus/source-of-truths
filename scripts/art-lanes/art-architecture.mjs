// Art gauntlet, lane: Architecture & Design. 48 days, five tiers a day.
// Buildings and their architects, styles and terms, bridges and towers as design,
// interiors and furniture, graphic design and typefaces, product design, fashion.
const L = 'Architecture & Design';
export const LANE_DAYS = [
  // day 1
  [
    { c: L, t: 1, q: 'What kind of very thin, very high heel takes its name from an Italian dagger?', a: 'A stiletto', d: ['A kitten heel', 'A wedge', 'A platform'] },
    { c: L, t: 2, q: 'In typography, what is the adjustment of the space between one particular pair of letters called?', a: 'Kerning', d: ['Leading', 'Tracking', 'Justification'] },
    { c: L, t: 3, q: 'Which designer put women in a tuxedo with his Le Smoking suit of 1966?', a: 'Yves Saint Laurent', d: ['Pierre Cardin', 'Hubert de Givenchy', 'Andre Courreges'] },
    { c: L, t: 4, q: 'Which bronze-clad Park Avenue office tower of 1958 did Ludwig Mies van der Rohe design?', a: 'The Seagram Building', d: ['Lever House', 'The Pan Am Building', 'The Woolworth Building'] },
    { c: L, t: 5, q: 'Which architect designed Chicago\'s Home Insurance Building of 1885, often called the first skyscraper?', a: 'William Le Baron Jenney', d: ['Louis Sullivan', 'Daniel Burnham', 'John Wellborn Root'] },
  ],
  // day 2
  [
    { c: L, t: 1, q: 'Which Italian fashion house uses two interlocking letter Gs as its logo?', a: 'Gucci', d: ['Prada', 'Fendi', 'Armani'] },
    { c: L, t: 2, q: 'What arched external support carries the outward push of a Gothic vault across to a separate pier?', a: 'A flying buttress', d: ['A pilaster', 'A corbel', 'A pendentive'] },
    { c: L, t: 3, q: 'Which husband-and-wife team designed a molded plywood lounge chair and ottoman in 1956?', a: 'Charles and Ray Eames', d: ['Alvar and Aino Aalto', 'Robin and Lucienne Day', 'Russel and Mary Wright'] },
    { c: L, t: 4, q: 'Which geometric typeface by Paul Renner appears on the plaque Apollo 11 left on the Moon?', a: 'Futura', d: ['Helvetica', 'Univers', 'Gill Sans'] },
    { c: L, t: 5, q: 'Which Viennese architect attacked decoration in his essay Ornament and Crime?', a: 'Adolf Loos', d: ['Otto Wagner', 'Josef Hoffmann', 'Joseph Maria Olbrich'] },
  ],
  // day 3
  [
    { c: L, t: 1, q: 'What dome-shaped shelter is built from blocks of packed snow?', a: 'An igloo', d: ['A yurt', 'A tepee', 'A wigwam'] },
    { c: L, t: 2, q: 'What nickname is given to Norman Foster\'s bullet-shaped London tower at 30 St Mary Axe, opened in 2004?', a: 'The Gherkin', d: ['The Walkie-Talkie', 'The Cheesegrater', 'The Scalpel'] },
    { c: L, t: 3, q: 'Which architect, born in Baghdad, designed the wave-roofed swimming venue for the 2012 London Olympics?', a: 'Zaha Hadid', d: ['Kazuyo Sejima', 'Amanda Levete', 'Jeanne Gang'] },
    { c: L, t: 4, q: 'Which Danish designer created the S-shaped cantilever chair molded from a single piece of plastic, put into production in 1967?', a: 'Verner Panton', d: ['Arne Jacobsen', 'Hans Wegner', 'Poul Kjaerholm'] },
    { c: L, t: 5, q: 'Which structural engineer devised the bundled tube system used for Chicago\'s Sears Tower?', a: 'Fazlur Rahman Khan', d: ['Leslie Robertson', 'William LeMessurier', 'Ove Arup'] },
  ],
  // day 4
  [
    { c: L, t: 1, q: 'The Taj Mahal is clad mainly in which white stone?', a: 'Marble', d: ['Limestone', 'Granite', 'Sandstone'] },
    { c: L, t: 2, q: 'Which German designer was creative director of Chanel from 1983 until his death in 2019?', a: 'Karl Lagerfeld', d: ['Tom Ford', 'Marc Jacobs', 'John Galliano'] },
    { c: L, t: 3, q: 'In digital typesetting, how many points make up one inch?', a: '72', d: ['12', '36', '100'] },
    { c: L, t: 4, q: 'Which Japanese architect, a former professional boxer, designed the concrete Church of the Light near Osaka?', a: 'Tadao Ando', d: ['Kenzo Tange', 'Toyo Ito', 'Kengo Kuma'] },
    { c: L, t: 5, q: 'Which architect built the small domed Tempietto in Rome, on the traditional site of Saint Peter\'s martyrdom?', a: 'Donato Bramante', d: ['Leon Battista Alberti', 'Giuliano da Sangallo', 'Baldassare Peruzzi'] },
  ],
  // day 5
  [
    { c: L, t: 1, q: 'What is the paved outdoor area beside a house, used for sitting and eating outside?', a: 'A patio', d: ['A gable', 'An awning', 'A gutter'] },
    { c: L, t: 2, q: 'Which annual award, first given in 1979, is often called the Nobel of architecture?', a: 'The Pritzker Prize', d: ['The Stirling Prize', 'The RIBA Gold Medal', 'The AIA Gold Medal'] },
    { c: L, t: 3, q: 'Which British architect partnered with engineer Michel Virlogeux on the Millau Viaduct in France, the tallest bridge in the world when it opened in 2004?', a: 'Norman Foster', d: ['Richard Rogers', 'Nicholas Grimshaw', 'Santiago Calatrava'] },
    { c: L, t: 4, q: 'Which Scottish architect designed the Glasgow School of Art, gutted by fires in 2014 and 2018?', a: 'Charles Rennie Mackintosh', d: ['Alexander Thomson', 'Robert Adam', 'Basil Spence'] },
    { c: L, t: 5, q: 'Which pair of designers created the Transport typeface used on British road signs from the 1960s?', a: 'Jock Kinneir and Margaret Calvert', d: ['Edward Johnston and Eric Gill', 'Stanley Morison and Victor Lardent', 'Robin Nicholas and Patricia Saunders'] },
  ],
  // day 6
  [
    { c: L, t: 1, q: 'Which stuffed toy takes its name from US President Theodore Roosevelt?', a: 'The teddy bear', d: ['The rag doll', 'The sock monkey', 'The jack-in-the-box'] },
    { c: L, t: 2, q: 'Which is the plainest of the three classical Greek orders of column?', a: 'Doric', d: ['Ionic', 'Corinthian', 'Tuscan'] },
    { c: L, t: 3, q: 'Which London designer is most credited with popularizing the miniskirt in the 1960s?', a: 'Mary Quant', d: ['Barbara Hulanicki', 'Ossie Clark', 'Zandra Rhodes'] },
    { c: L, t: 4, q: 'Which Dutch architect\'s firm designed the looping CCTV headquarters in Beijing, completed in 2012?', a: 'Rem Koolhaas', d: ['Herman Hertzberger', 'Winy Maas', 'Aldo van Eyck'] },
    { c: L, t: 5, q: 'What is the name of the paragraph mark shaped like a reversed letter P?', a: 'The pilcrow', d: ['The section sign', 'The dagger', 'The interrobang'] },
  ],
  // day 7
  [
    { c: L, t: 1, q: 'Which French fashion house\'s logo is a pair of interlocking letter Cs?', a: 'Chanel', d: ['Dior', 'Hermes', 'Givenchy'] },
    { c: L, t: 2, q: 'Which much-mocked Microsoft typeface, designed in 1994, imitates the hand lettering in speech balloons?', a: 'Comic Sans', d: ['Papyrus', 'Impact', 'Chalkboard'] },
    { c: L, t: 3, q: 'Which Renaissance artist designed the great dome of St. Peter\'s Basilica in Rome?', a: 'Michelangelo', d: ['Raphael', 'Leonardo da Vinci', 'Gian Lorenzo Bernini'] },
    { c: L, t: 4, q: 'Which American designer made the pillbox hat Jacqueline Kennedy wore to the 1961 inauguration?', a: 'Halston', d: ['Oleg Cassini', 'Bill Blass', 'Norman Norell'] },
    { c: L, t: 5, q: 'Which architect designed the titanium-clad Guggenheim Museum Bilbao, opened in 1997?', a: 'Frank Gehry', d: ['Renzo Piano', 'Rem Koolhaas', 'Santiago Calatrava'] },
  ],
  // day 8
  [
    { c: L, t: 1, q: 'Which Apple tablet computer did Steve Jobs unveil in 2010?', a: 'The iPad', d: ['The iPod Touch', 'The MacBook Air', 'The Newton'] },
    { c: L, t: 2, q: 'What is the wedge-shaped central stone at the top of an arch, which locks the others in place, called?', a: 'The keystone', d: ['The cornerstone', 'The capstone', 'The lintel'] },
    { c: L, t: 3, q: 'Which architect designed the undulating Barcelona apartment block Casa Mila, nicknamed La Pedrera?', a: 'Antoni Gaudi', d: ['Lluis Domenech i Montaner', 'Josep Puig i Cadafalch', 'Josep Lluis Sert'] },
    { c: L, t: 4, q: 'Which French designer created the spider-legged Juicy Salif lemon squeezer for Alessi in 1990?', a: 'Philippe Starck', d: ['Ettore Sottsass', 'Michael Graves', 'Marc Newson'] },
    { c: L, t: 5, q: 'Which architect designed the Vienna Secession Building, topped by a dome of gilded laurel leaves?', a: 'Joseph Maria Olbrich', d: ['Otto Wagner', 'Adolf Loos', 'Josef Hoffmann'] },
  ],
  // day 9
  [
    { c: L, t: 1, q: 'What kind of bridge is built to carry water across a valley?', a: 'An aqueduct', d: ['A viaduct', 'A causeway', 'A culvert'] },
    { c: L, t: 2, q: 'Which style of around 1900, full of flowing plant forms, shaped the original Paris Metro entrances?', a: 'Art Nouveau', d: ['Art Deco', 'Rococo', 'Beaux-Arts'] },
    { c: L, t: 3, q: 'Which Swiss typeface of 1957 was first sold under the name Neue Haas Grotesk?', a: 'Helvetica', d: ['Univers', 'Akzidenz-Grotesk', 'Futura'] },
    { c: L, t: 4, q: 'Which Italian-born couturier made shocking pink her signature and worked with Salvador Dali on a lobster dress?', a: 'Elsa Schiaparelli', d: ['Madeleine Vionnet', 'Jeanne Lanvin', 'Nina Ricci'] },
    { c: L, t: 5, q: 'What is the name for the honeycomb vaulting of small stacked niches found in Islamic buildings such as the mosques of Isfahan?', a: 'Muqarnas', d: ['Mashrabiya', 'Iwan', 'Mihrab'] },
  ],
  // day 10
  [
    { c: L, t: 1, q: 'Which garment did Levi Strauss and Jacob Davis patent in 1873, with copper rivets at the pockets?', a: 'Blue jeans', d: ['Cowboy boots', 'Work shirts', 'Leather belts'] },
    { c: L, t: 2, q: 'Which Art Deco New York tower, crowned in stainless steel, was briefly the world\'s tallest building in 1930?', a: 'The Chrysler Building', d: ['The Empire State Building', 'The Woolworth Building', 'The Flatiron Building'] },
    { c: L, t: 3, q: 'Which Spanish architect and engineer designed the City of Arts and Sciences in Valencia?', a: 'Santiago Calatrava', d: ['Rafael Moneo', 'Ricardo Bofill', 'Antoni Gaudi'] },
    { c: L, t: 4, q: 'Which Dutch designer of the De Stijl movement made the angular Red and Blue Chair?', a: 'Gerrit Rietveld', d: ['Theo van Doesburg', 'J.J.P. Oud', 'Mart Stam'] },
    { c: L, t: 5, q: 'Which architect designed the Washington Monument, though his colonnaded base was never built?', a: 'Robert Mills', d: ['Benjamin Latrobe', 'Thomas U. Walter', 'Henry Bacon'] },
  ],
  // day 11
  [
    { c: L, t: 1, q: 'What kind of wooden shoe is traditional footwear in the Netherlands?', a: 'Clogs', d: ['Sandals', 'Moccasins', 'Espadrilles'] },
    { c: L, t: 2, q: 'Which American designer\'s label uses a polo player on horseback as its emblem?', a: 'Ralph Lauren', d: ['Tommy Hilfiger', 'Calvin Klein', 'Perry Ellis'] },
    { c: L, t: 3, q: 'Which typography term for the space between lines of text comes from metal strips once placed between rows of type?', a: 'Leading', d: ['Kerning', 'Tracking', 'Gutter'] },
    { c: L, t: 4, q: 'Which architect designed Habitat 67, the stacked concrete housing built for the Montreal world\'s fair?', a: 'Moshe Safdie', d: ['Arthur Erickson', 'Raymond Moriyama', 'Douglas Cardinal'] },
    { c: L, t: 5, q: 'Which Japanese architect designed the Nakagin Capsule Tower in Tokyo, an icon of the Metabolist movement?', a: 'Kisho Kurokawa', d: ['Kiyonori Kikutake', 'Fumihiko Maki', 'Arata Isozaki'] },
  ],
  // day 12
  [
    { c: L, t: 1, q: 'What is the tall slender tower of a mosque, from which the call to prayer is traditionally made?', a: 'A minaret', d: ['A pagoda', 'A spire', 'A belfry'] },
    { c: L, t: 2, q: 'Which Dubai hotel, opened in 1999 on its own island, is shaped like a billowing sail?', a: 'The Burj al Arab', d: ['The Atlantis', 'The Jumeirah Beach Hotel', 'The Emirates Palace'] },
    { c: L, t: 3, q: 'Which English designer, maker of the Strawberry Thief textile, led the Arts and Crafts movement?', a: 'William Morris', d: ['John Ruskin', 'Augustus Pugin', 'Christopher Dresser'] },
    { c: L, t: 4, q: 'Which industrial designer created the blue and white livery of Air Force One for John F. Kennedy?', a: 'Raymond Loewy', d: ['Henry Dreyfuss', 'Norman Bel Geddes', 'Walter Dorwin Teague'] },
    { c: L, t: 5, q: 'What kind of stone ceiling, with ribs spreading like opened cones, roofs King\'s College Chapel in Cambridge?', a: 'Fan vaulting', d: ['Barrel vaulting', 'Groin vaulting', 'Sexpartite vaulting'] },
  ],
  // day 13
  [
    { c: L, t: 1, q: 'Which red-handled folding multi-tool knife is named after a European country\'s military?', a: 'The Swiss Army knife', d: ['The Bowie knife', 'The Stanley knife', 'The Opinel knife'] },
    { c: L, t: 2, q: 'What is a carved grotesque figure that spouts rainwater off a cathedral roof called?', a: 'A gargoyle', d: ['A caryatid', 'A finial', 'A corbel'] },
    { c: L, t: 3, q: 'Which Danish designer created the Egg chair for a Copenhagen hotel in 1958?', a: 'Arne Jacobsen', d: ['Hans Wegner', 'Finn Juhl', 'Borge Mogensen'] },
    { c: L, t: 4, q: 'Which 19th-century architect added the spire of Notre-Dame de Paris that collapsed in the 2019 fire?', a: 'Eugene Viollet-le-Duc', d: ['Charles Garnier', 'Henri Labrouste', 'Jacques-Germain Soufflot'] },
    { c: L, t: 5, q: 'Which student designed the three-arrow recycling symbol for a contest tied to the first Earth Day in 1970?', a: 'Gary Anderson', d: ['Gerald Holtom', 'Paul Rand', 'Lance Wyman'] },
  ],
  // day 14
  [
    { c: L, t: 1, q: 'What kind of roof is made from dried straw, reeds or rushes?', a: 'A thatched roof', d: ['A slate roof', 'A shingle roof', 'A tiled roof'] },
    { c: L, t: 2, q: 'Which padded footstool or low seat is named after a Turkish empire?', a: 'An ottoman', d: ['A chaise', 'A settee', 'A pouf'] },
    { c: L, t: 3, q: 'Which roof with two slopes on every side, the lower one much steeper, is named after a French architect?', a: 'The mansard roof', d: ['The gambrel roof', 'The hip roof', 'The gable roof'] },
    { c: L, t: 4, q: 'Which typeface by a British sculptor and letter cutter was adopted by the London and North Eastern Railway in 1929?', a: 'Gill Sans', d: ['Johnston', 'Baskerville', 'Caslon'] },
    { c: L, t: 5, q: 'Which architect designed the Queen\'s House at Greenwich, often called the first fully classical building in England?', a: 'Inigo Jones', d: ['Christopher Wren', 'Nicholas Hawksmoor', 'John Vanbrugh'] },
  ],
  // day 15
  [
    { c: L, t: 1, q: 'What is the tiered tower with many overhanging roofs found at Buddhist temples in East Asia?', a: 'A pagoda', d: ['A ziggurat', 'A minaret', 'An obelisk'] },
    { c: L, t: 2, q: 'Which French shoe designer is known for high heels with glossy red soles?', a: 'Christian Louboutin', d: ['Manolo Blahnik', 'Jimmy Choo', 'Roger Vivier'] },
    { c: L, t: 3, q: 'Which Brussels structure, built for Expo 58, models an iron crystal magnified 165 billion times?', a: 'The Atomium', d: ['The Space Needle', 'The Unisphere', 'The Biosphere'] },
    { c: L, t: 4, q: 'Which architect designed the Lloyd\'s building in London, with its elevators and ducts on the outside?', a: 'Richard Rogers', d: ['Norman Foster', 'James Stirling', 'Michael Hopkins'] },
    { c: L, t: 5, q: 'Which typeface, a staple of movie posters, is based on the letters carved at the base of an ancient Roman column?', a: 'Trajan', d: ['Optima', 'Copperplate', 'Bodoni'] },
  ],
  // day 16
  [
    { c: L, t: 1, q: 'What tall, flat-crowned hat, often called a stovepipe when Abraham Lincoln wore it, goes with formal dress?', a: 'A top hat', d: ['A bowler', 'A fedora', 'A boater'] },
    { c: L, t: 2, q: 'What stepped, flat-topped temple tower was built by the ancient Mesopotamians?', a: 'A ziggurat', d: ['A mastaba', 'A stupa', 'An obelisk'] },
    { c: L, t: 3, q: 'Which British brand invented gabardine cloth and supplied trench coats to officers in World War I?', a: 'Burberry', d: ['Aquascutum', 'Barbour', 'Mackintosh'] },
    { c: L, t: 4, q: 'Which German-Austrian furniture maker\'s bentwood No. 14 chair of 1859 became the classic cafe chair?', a: 'Michael Thonet', d: ['Josef Hoffmann', 'Koloman Moser', 'Otto Wagner'] },
    { c: L, t: 5, q: 'Which architect designed the cast-iron dome of the US Capitol, completed in 1866?', a: 'Thomas U. Walter', d: ['Benjamin Latrobe', 'Charles Bulfinch', 'William Thornton'] },
  ],
  // day 17
  [
    { c: L, t: 1, q: 'Which waterproof rubber boot is named after the duke who won at Waterloo?', a: 'The Wellington boot', d: ['The Chelsea boot', 'The cowboy boot', 'The desert boot'] },
    { c: L, t: 2, q: 'Which Bavarian castle, built for King Ludwig II, inspired the castle at Disneyland?', a: 'Neuschwanstein', d: ['Hohenzollern', 'Linderhof', 'Hohenschwangau'] },
    { c: L, t: 3, q: 'What is the Japanese sliding door or screen of translucent paper on a wooden lattice called?', a: 'Shoji', d: ['Tatami', 'Tokonoma', 'Engawa'] },
    { c: L, t: 4, q: 'Which designer opened the London boutique SEX with Malcolm McLaren in 1974 and dressed the punk scene?', a: 'Vivienne Westwood', d: ['Zandra Rhodes', 'Katharine Hamnett', 'Jean Muir'] },
    { c: L, t: 5, q: 'What is the name of the punctuation mark combining a question mark and an exclamation point, proposed in 1962?', a: 'The interrobang', d: ['The pilcrow', 'The octothorpe', 'The guillemet'] },
  ],
  // day 18
  [
    { c: L, t: 1, q: 'What is the name for an architect\'s drawing that shows a building\'s rooms as seen from directly above?', a: 'A floor plan', d: ['An elevation', 'A cross section', 'A perspective'] },
    { c: L, t: 2, q: 'Which British designer, daughter of a Beatle, launched her own label in 2001 without using leather or fur?', a: 'Stella McCartney', d: ['Phoebe Philo', 'Victoria Beckham', 'Clare Waight Keller'] },
    { c: L, t: 3, q: 'Which two-piece swimsuit, launched in Paris in 1946, was named after a Pacific atoll?', a: 'The bikini', d: ['The tankini', 'The monokini', 'The maillot'] },
    { c: L, t: 4, q: 'Which calligrapher drew the sans-serif lettering adopted by the London Underground in 1916?', a: 'Edward Johnston', d: ['Eric Gill', 'Harry Beck', 'Frank Pick'] },
    { c: L, t: 5, q: 'Which French designer worked with Le Corbusier and Pierre Jeanneret on the LC4 chaise longue of 1928?', a: 'Charlotte Perriand', d: ['Eileen Gray', 'Lilly Reich', 'Jean Prouve'] },
  ],
  // day 19
  [
    { c: L, t: 1, q: 'What is the entrance hall of a hotel, where guests check in, usually called?', a: 'The lobby', d: ['The cellar', 'The attic', 'The pantry'] },
    { c: L, t: 2, q: 'Which Paris arts complex, opened in 1977, displays its pipes and escalators on the outside?', a: 'The Pompidou Center', d: ['The Musee d\'Orsay', 'The Palais de Tokyo', 'The Fondation Cartier'] },
    { c: L, t: 3, q: 'Which Baroque sculptor and architect designed the curving colonnades that embrace St. Peter\'s Square?', a: 'Gian Lorenzo Bernini', d: ['Francesco Borromini', 'Carlo Maderno', 'Donato Bramante'] },
    { c: L, t: 4, q: 'Which British designer showed towering Armadillo shoes in his Spring 2010 collection, the last he completed?', a: 'Alexander McQueen', d: ['John Galliano', 'Gareth Pugh', 'Hussein Chalayan'] },
    { c: L, t: 5, q: 'What are the openings in a castle\'s projecting parapet, through which defenders dropped stones on attackers, called?', a: 'Machicolations', d: ['Embrasures', 'Merlons', 'Crenels'] },
  ],
  // day 20
  [
    { c: L, t: 1, q: 'Which short-sleeved collarless top was first issued by the US Navy as an undershirt?', a: 'The T-shirt', d: ['The polo shirt', 'The tank top', 'The henley'] },
    { c: L, t: 2, q: 'What Chinese practice arranges buildings and furniture to harmonize with the flow of energy?', a: 'Feng shui', d: ['Tai chi', 'Qigong', 'Ikebana'] },
    { c: L, t: 3, q: 'Which American designer\'s studio made leaded glass lamps with dragonfly and wisteria shades?', a: 'Louis Comfort Tiffany', d: ['John La Farge', 'Gustav Stickley', 'Frank Lloyd Wright'] },
    { c: L, t: 4, q: 'Which Italian car designer styled both the first Volkswagen Golf and the stainless steel DeLorean?', a: 'Giorgetto Giugiaro', d: ['Marcello Gandini', 'Battista Pininfarina', 'Ercole Spada'] },
    { c: L, t: 5, q: 'Which Renaissance architect wrote the treatise On the Art of Building, completed around 1452?', a: 'Leon Battista Alberti', d: ['Filippo Brunelleschi', 'Donato Bramante', 'Sebastiano Serlio'] },
  ],
  // day 21
  [
    { c: L, t: 1, q: 'What is the rounded roof shaped like half a sphere that crowns buildings such as the US Capitol?', a: 'A dome', d: ['A spire', 'A gable', 'A turret'] },
    { c: L, t: 2, q: 'Which English building style, from the reigns of Henry VII and Henry VIII, is known for exposed half-timbering and tall chimneys?', a: 'Tudor', d: ['Georgian', 'Victorian', 'Edwardian'] },
    { c: L, t: 3, q: 'Which monospaced typeface was designed for IBM electric typewriters in 1955?', a: 'Courier', d: ['Garamond', 'Rockwell', 'Futura'] },
    { c: L, t: 4, q: 'Which Japanese architect designed the swooping Yoyogi National Gymnasium for the 1964 Tokyo Olympics?', a: 'Kenzo Tange', d: ['Kisho Kurokawa', 'Arata Isozaki', 'Kiyonori Kikutake'] },
    { c: L, t: 5, q: 'Which Irish designer built the modernist villa E-1027 on the French Riviera in the 1920s?', a: 'Eileen Gray', d: ['Charlotte Perriand', 'Lilly Reich', 'Sonia Delaunay'] },
  ],
  // day 22
  [
    { c: L, t: 1, q: 'Which style of sunglasses did Ray-Ban introduce in 1937 for American military pilots?', a: 'Aviators', d: ['Wayfarers', 'Clubmasters', 'Cat-eyes'] },
    { c: L, t: 2, q: 'What kind of window slides up and down in vertical grooves, as in most Georgian houses?', a: 'A sash window', d: ['A casement window', 'A bay window', 'A dormer window'] },
    { c: L, t: 3, q: 'Which architect built himself a see-through Glass House in New Canaan, Connecticut, in 1949?', a: 'Philip Johnson', d: ['Ludwig Mies van der Rohe', 'Richard Neutra', 'Marcel Breuer'] },
    { c: L, t: 4, q: 'Which German designer collaborated with Mies van der Rohe on the Barcelona chair of 1929?', a: 'Lilly Reich', d: ['Charlotte Perriand', 'Eileen Gray', 'Marianne Brandt'] },
    { c: L, t: 5, q: 'Which designer at the Bertone studio styled the wedge-shaped Lamborghini Countach?', a: 'Marcello Gandini', d: ['Giorgetto Giugiaro', 'Leonardo Fioravanti', 'Paolo Martin'] },
  ],
  // day 23
  [
    { c: L, t: 1, q: 'What shape is the base of each of the three great pyramids at Giza?', a: 'A square', d: ['A triangle', 'A rectangle', 'A pentagon'] },
    { c: L, t: 2, q: 'What do you call a glazed projection that juts out from an outside wall and forms a recess inside the room?', a: 'A bay window', d: ['A skylight', 'A casement window', 'A transom window'] },
    { c: L, t: 3, q: 'What is the name of the Michelin Man, the tire company\'s mascot since 1898?', a: 'Bibendum', d: ['Pneumo', 'Gommeux', 'Monsieur Pneu'] },
    { c: L, t: 4, q: 'Which Rolex model of 1926 was promoted as the first waterproof wristwatch?', a: 'The Oyster', d: ['The Submariner', 'The Datejust', 'The Daytona'] },
    { c: L, t: 5, q: 'Which American, often called the first professional interior decorator, wrote The House in Good Taste?', a: 'Elsie de Wolfe', d: ['Dorothy Draper', 'Sister Parish', 'Edith Wharton'] },
  ],
  // day 24
  [
    { c: L, t: 1, q: 'What thin Japanese mattress, laid on the floor at night, became a fold-out sofa bed in the West?', a: 'The futon', d: ['The tatami', 'The hammock', 'The divan'] },
    { c: L, t: 2, q: 'What is a window set flush into the slope of a roof to light the room below called?', a: 'A skylight', d: ['A dormer', 'A transom', 'A casement'] },
    { c: L, t: 3, q: 'Which engineer designed the Brooklyn Bridge but died before construction began?', a: 'John A. Roebling', d: ['Washington Roebling', 'Othmar Ammann', 'James Eads'] },
    { c: L, t: 4, q: 'Which Italian fashion house, founded by Ottavio and Rosita, is known for colorful zigzag knitwear?', a: 'Missoni', d: ['Pucci', 'Etro', 'Marni'] },
    { c: L, t: 5, q: 'Which Italian printer at Parma gave his name to a high-contrast typeface of the late 18th century?', a: 'Giambattista Bodoni', d: ['Aldus Manutius', 'Nicolas Jenson', 'Claude Garamond'] },
  ],
  // day 25
  [
    { c: L, t: 1, q: 'Which British government poster slogan of 1939, under a crown, was rediscovered in a bookshop in 2000 and copied everywhere?', a: 'Keep Calm and Carry On', d: ['Dig for Victory', 'Your Country Needs You', 'Loose Lips Sink Ships'] },
    { c: L, t: 2, q: 'Which French term, legally protected in France, names made-to-measure high fashion sewn by hand for private clients?', a: 'Haute couture', d: ['Pret-a-porter', 'Avant-garde', 'Bespoke'] },
    { c: L, t: 3, q: 'What is a sculpted female figure that serves as a column, as on the porch of the Erechtheion in Athens?', a: 'A caryatid', d: ['A telamon', 'A herm', 'A gargoyle'] },
    { c: L, t: 4, q: 'Which Portland State student designed the Nike swoosh in 1971 for a fee of 35 dollars?', a: 'Carolyn Davidson', d: ['Paula Scher', 'Susan Kare', 'Lindon Leader'] },
    { c: L, t: 5, q: 'Which engineer was Louis Sullivan\'s partner in the firm that designed Chicago\'s Auditorium Building?', a: 'Dankmar Adler', d: ['William Holabird', 'John Wellborn Root', 'Martin Roche'] },
  ],
  // day 26
  [
    { c: L, t: 1, q: 'What is a luxury apartment on the top floor of a tall building called?', a: 'A penthouse', d: ['A loft', 'A duplex', 'A studio'] },
    { c: L, t: 2, q: 'Which tower, topped with a disk like a flying saucer, was built for the 1962 Seattle World\'s Fair?', a: 'The Space Needle', d: ['The CN Tower', 'The Stratosphere Tower', 'The Tower of the Americas'] },
    { c: L, t: 3, q: 'Which medieval style, which came before Gothic, was built with rounded arches and massive walls?', a: 'Romanesque', d: ['Byzantine', 'Mannerist', 'Baroque'] },
    { c: L, t: 4, q: 'Which Spanish couturier introduced the loose, waistless sack dress in 1957?', a: 'Cristobal Balenciaga', d: ['Hubert de Givenchy', 'Pierre Balmain', 'Jacques Fath'] },
    { c: L, t: 5, q: 'Which Italian designer drew the 1972 New York City subway map, with its lines at 45 and 90 degree angles?', a: 'Massimo Vignelli', d: ['Harry Beck', 'Ivan Chermayeff', 'Lance Wyman'] },
  ],
  // day 27
  [
    { c: L, t: 1, q: 'Which knee-length pleated garment of tartan cloth is traditional men\'s dress in the Scottish Highlands?', a: 'The kilt', d: ['The sporran', 'The trews', 'The tam o\'shanter'] },
    { c: L, t: 2, q: 'Which medieval Florence bridge is lined with shops built out over the Arno?', a: 'The Ponte Vecchio', d: ['The Rialto Bridge', 'The Ponte Santa Trinita', 'The Pont Neuf'] },
    { c: L, t: 3, q: 'Which engineering draftsman drew the diagrammatic London Underground map first issued in 1933?', a: 'Harry Beck', d: ['Edward Johnston', 'Frank Pick', 'Massimo Vignelli'] },
    { c: L, t: 4, q: 'Which architect designed the curving, thick-walled chapel of Notre Dame du Haut at Ronchamp, completed in 1955?', a: 'Le Corbusier', d: ['Auguste Perret', 'Jean Prouve', 'Rudolf Schwarz'] },
    { c: L, t: 5, q: 'What kind of timber roof, with short beams jutting from the tops of the walls, spans Westminster Hall in London?', a: 'A hammerbeam roof', d: ['A crown post roof', 'A king post roof', 'A cruck roof'] },
  ],
  // day 28
  [
    { c: L, t: 1, q: 'What is the flat ledge at the bottom of a window frame called?', a: 'The windowsill', d: ['The lintel', 'The mullion', 'The transom'] },
    { c: L, t: 2, q: 'Which wedge-shaped New York building of 1902 stands where Broadway crosses Fifth Avenue?', a: 'The Flatiron Building', d: ['The Woolworth Building', 'The Singer Building', 'The Seagram Building'] },
    { c: L, t: 3, q: 'What is a beam or slab supported at only one end, like the terraces of Fallingwater, called?', a: 'A cantilever', d: ['A truss', 'A lintel', 'A corbel'] },
    { c: L, t: 4, q: 'Which Japanese designer founded the label Comme des Garcons in 1969?', a: 'Rei Kawakubo', d: ['Yohji Yamamoto', 'Issey Miyake', 'Junya Watanabe'] },
    { c: L, t: 5, q: 'What is the slight outward swelling given to a classical column shaft, to correct an optical illusion, called?', a: 'Entasis', d: ['Fluting', 'Diminution', 'Anathyrosis'] },
  ],
  // day 29
  [
    { c: L, t: 1, q: 'Which designer popularized the little black dress, which Vogue hailed in 1926 as a uniform for modern women?', a: 'Coco Chanel', d: ['Elsa Schiaparelli', 'Madeleine Vionnet', 'Jeanne Lanvin'] },
    { c: L, t: 2, q: 'Which gardener and architect designed the Crystal Palace for the Great Exhibition of 1851?', a: 'Joseph Paxton', d: ['Isambard Kingdom Brunel', 'Charles Barry', 'Augustus Pugin'] },
    { c: L, t: 3, q: 'Which architect designed Chicago\'s low, horizontal Robie House, a landmark of his Prairie style?', a: 'Frank Lloyd Wright', d: ['Louis Sullivan', 'Walter Burley Griffin', 'George Grant Elmslie'] },
    { c: L, t: 4, q: 'Which balanced desk lamp with spring-loaded arms did car engineer George Carwardine design in 1932?', a: 'The Anglepoise', d: ['The Tizio', 'The Tolomeo', 'The Luxo L-1'] },
    { c: L, t: 5, q: 'Which Scottish architect, working with his brother James, gave his name to a delicate neoclassical interior style in 18th-century Britain?', a: 'Robert Adam', d: ['William Chambers', 'James Gibbs', 'Colen Campbell'] },
  ],
  // day 30
  [
    { c: L, t: 1, q: 'Which Thames crossing of 1894 has two towers and a roadway that lifts to let ships through?', a: 'Tower Bridge', d: ['London Bridge', 'Westminster Bridge', 'Southwark Bridge'] },
    { c: L, t: 2, q: 'Which designer\'s 1980 jeans ads had Brooke Shields saying nothing comes between her and her jeans?', a: 'Calvin Klein', d: ['Gloria Vanderbilt', 'Tommy Hilfiger', 'Jordache'] },
    { c: L, t: 3, q: 'What is the gateway, often painted vermilion, that marks the entrance to a Shinto shrine?', a: 'A torii', d: ['A pagoda', 'A tokonoma', 'A shoji'] },
    { c: L, t: 4, q: 'Which American architect answered less is more with less is a bore?', a: 'Robert Venturi', d: ['Michael Graves', 'Charles Moore', 'Philip Johnson'] },
    { c: L, t: 5, q: 'What is the name for a structure of two upright stones capped by a horizontal one, as at Stonehenge?', a: 'A trilithon', d: ['A menhir', 'A cairn', 'A cromlech'] },
  ],
  // day 31
  [
    { c: L, t: 1, q: 'What is the room or space directly under the pitched roof of a house called?', a: 'The attic', d: ['The cellar', 'The parlor', 'The foyer'] },
    { c: L, t: 2, q: 'Which glass and iron hall was built in Hyde Park for London\'s Great Exhibition of 1851?', a: 'The Crystal Palace', d: ['The Palm House', 'The Royal Albert Hall', 'Alexandra Palace'] },
    { c: L, t: 3, q: 'Which designer made the black dress Audrey Hepburn wore in Breakfast at Tiffany\'s?', a: 'Hubert de Givenchy', d: ['Edith Head', 'Pierre Balmain', 'Christian Dior'] },
    { c: L, t: 4, q: 'Which grand classical style, named after a Paris school, shaped New York\'s Grand Central Terminal and Public Library?', a: 'Beaux-Arts', d: ['Gothic Revival', 'Art Deco', 'Second Empire'] },
    { c: L, t: 5, q: 'Which Italian brothers designed the Arco floor lamp of 1962, its arc anchored by a marble base?', a: 'Achille and Pier Giacomo Castiglioni', d: ['Alessandro and Francesco Mendini', 'Massimo and Lella Vignelli', 'Tobia and Afra Scarpa'] },
  ],
  // day 32
  [
    { c: L, t: 1, q: 'What is the outline of a city\'s buildings seen against the sky called?', a: 'The skyline', d: ['The streetscape', 'The horizon', 'The facade'] },
    { c: L, t: 2, q: 'Which Swiss brand launched cheap, colorful plastic watches in 1983?', a: 'Swatch', d: ['Timex', 'Casio', 'Fossil'] },
    { c: L, t: 3, q: 'Which playful 18th-century style of pastel colors, shells and curling ornament grew out of the late Baroque in France?', a: 'Rococo', d: ['Neoclassicism', 'Mannerism', 'Art Nouveau'] },
    { c: L, t: 4, q: 'Which Texas-born designer revived Gucci as its creative director from 1994 to 2004?', a: 'Tom Ford', d: ['Marc Jacobs', 'Michael Kors', 'Narciso Rodriguez'] },
    { c: L, t: 5, q: 'What name is given to the space-age American roadside architecture of the 1950s, with boomerang roofs and starbursts?', a: 'Googie', d: ['Streamline Moderne', 'Mission Revival', 'Brutalism'] },
  ],
  // day 33
  [
    { c: L, t: 1, q: 'What color are Britain\'s classic telephone boxes?', a: 'Red', d: ['Green', 'Blue', 'Black'] },
    { c: L, t: 2, q: 'What is the top part of a classical column, between the shaft and the beam, called?', a: 'The capital', d: ['The plinth', 'The frieze', 'The pediment'] },
    { c: L, t: 3, q: 'Which Italian couturier gave his name to a vivid shade of red?', a: 'Valentino', d: ['Giorgio Armani', 'Gianfranco Ferre', 'Roberto Capucci'] },
    { c: L, t: 4, q: 'The 1963 demolition of which New York railroad station spurred the city\'s landmarks preservation law?', a: 'Pennsylvania Station', d: ['Grand Central Terminal', 'Hudson Terminal', 'Union Station'] },
    { c: L, t: 5, q: 'Which industrial designer shaped the Bell Model 500 desk telephone and the round Honeywell thermostat?', a: 'Henry Dreyfuss', d: ['Raymond Loewy', 'Norman Bel Geddes', 'Eliot Noyes'] },
  ],
  // day 34
  [
    { c: L, t: 1, q: 'What is the sloping walkway that lets wheelchairs reach a door in place of steps called?', a: 'A ramp', d: ['A landing', 'A banister', 'A threshold'] },
    { c: L, t: 2, q: 'What kind of bed, patented in the early 1900s, folds up into a wall cabinet to free floor space?', a: 'A Murphy bed', d: ['A daybed', 'A trundle bed', 'A canopy bed'] },
    { c: L, t: 3, q: 'Which prefect rebuilt Paris in the 1850s and 1860s with wide boulevards and uniform stone apartment blocks?', a: 'Baron Haussmann', d: ['Charles Garnier', 'Gustave Eiffel', 'Jean-Charles Alphand'] },
    { c: L, t: 4, q: 'What is a tall narrow window with a sharply pointed arch, typical of Early English Gothic, called?', a: 'A lancet window', d: ['An oriel window', 'A rose window', 'A lunette'] },
    { c: L, t: 5, q: 'Who designed the horizontal three-band covers and the first penguin logo for Penguin Books in 1935?', a: 'Edward Young', d: ['Jan Tschichold', 'Eric Gill', 'Hans Schmoller'] },
  ],
  // day 35
  [
    { c: L, t: 1, q: 'What French name is given to a long upholstered seat for reclining with the legs stretched out?', a: 'A chaise longue', d: ['A divan', 'A settee', 'A futon'] },
    { c: L, t: 2, q: 'Which glass skyscraper by Renzo Piano rises like a jagged spire beside London Bridge station?', a: 'The Shard', d: ['The Gherkin', 'The Walkie-Talkie', 'The Cheesegrater'] },
    { c: L, t: 3, q: 'Which London cabinetmaker published The Gentleman and Cabinet-Maker\'s Director in 1754?', a: 'Thomas Chippendale', d: ['George Hepplewhite', 'Thomas Sheraton', 'Robert Gillow'] },
    { c: L, t: 4, q: 'The central towers of Angkor Wat represent which sacred mountain of Hindu and Buddhist cosmology?', a: 'Mount Meru', d: ['Mount Kailash', 'Mount Kunlun', 'Mount Mandara'] },
    { c: L, t: 5, q: 'Which American couturier designed the blue wedding dress Wallis Simpson wore to marry the Duke of Windsor in 1937?', a: 'Mainbocher', d: ['Charles James', 'Norman Hartnell', 'Elsa Schiaparelli'] },
  ],
  // day 36
  [
    { c: L, t: 1, q: 'What is an open-sided roofed shelter in a garden or park, often with eight sides, called?', a: 'A gazebo', d: ['A pergola', 'A conservatory', 'A greenhouse'] },
    { c: L, t: 2, q: 'What sun-dried brick of clay and straw is the traditional building material of Pueblo homes in the American Southwest?', a: 'Adobe', d: ['Terracotta', 'Cob', 'Brownstone'] },
    { c: L, t: 3, q: 'Whose grid paintings inspired Yves Saint Laurent\'s color-block cocktail dresses of 1965?', a: 'Piet Mondrian', d: ['Wassily Kandinsky', 'Paul Klee', 'Mark Rothko'] },
    { c: L, t: 4, q: 'Which architect designed the angular Bank of China Tower in Hong Kong, completed in 1990?', a: 'I.M. Pei', d: ['Norman Foster', 'Cesar Pelli', 'Kenzo Tange'] },
    { c: L, t: 5, q: 'What are the dressed stones that mark and strengthen the outside corners of a building called?', a: 'Quoins', d: ['Corbels', 'Plinths', 'Voussoirs'] },
  ],
  // day 37
  [
    { c: L, t: 1, q: 'What is the lowest story of a house, partly or wholly below ground level, called?', a: 'The basement', d: ['The mezzanine', 'The loft', 'The landing'] },
    { c: L, t: 2, q: 'What woven straw mat covers Japanese floors and is traditionally used to measure the size of a room?', a: 'Tatami', d: ['Zabuton', 'Noren', 'Fusuma'] },
    { c: L, t: 3, q: 'Which boot brand, launched in Britain in 1960 with an air-cushioned sole, became a punk and skinhead staple?', a: 'Dr. Martens', d: ['Clarks', 'Grenson', 'Red Wing'] },
    { c: L, t: 4, q: 'What is the niche in a mosque wall that shows the direction of Mecca called?', a: 'The mihrab', d: ['The minbar', 'The iwan', 'The sahn'] },
    { c: L, t: 5, q: 'What is the towering, sculpture-covered gateway of a South Indian Hindu temple called?', a: 'A gopuram', d: ['A shikhara', 'A mandapa', 'A vimana'] },
  ],
  // day 38
  [
    { c: L, t: 1, q: 'What is the main front face of a building called?', a: 'The facade', d: ['The atrium', 'The cornice', 'The plinth'] },
    { c: L, t: 2, q: 'Which knitted button-front sweater is named after a British earl who led the Charge of the Light Brigade?', a: 'The cardigan', d: ['The raglan', 'The guernsey', 'The pullover'] },
    { c: L, t: 3, q: 'Which company\'s numbered color matching system, launched in 1963, lets printers reproduce exact shades?', a: 'Pantone', d: ['Crayola', 'Benjamin Moore', 'Sherwin-Williams'] },
    { c: L, t: 4, q: 'Which typeface by Tobias Frere-Jones became the face of Barack Obama\'s 2008 campaign?', a: 'Gotham', d: ['Optima', 'Gill Sans', 'Trajan'] },
    { c: L, t: 5, q: 'What is the name for the fixed sun-shading fins or louvers on a building\'s face, much favored by Le Corbusier?', a: 'A brise-soleil', d: ['A mashrabiya', 'A piloti', 'A jalousie'] },
  ],
  // day 39
  [
    { c: L, t: 1, q: 'What soft, round, flat-crowned wool cap is associated with France?', a: 'The beret', d: ['The fez', 'The cloche', 'The flat cap'] },
    { c: L, t: 2, q: 'What is the strip of wooden trim running along the bottom of an interior wall called?', a: 'A baseboard', d: ['A cornice', 'A dado rail', 'A picture rail'] },
    { c: L, t: 3, q: 'The word denim is thought to come from a sturdy twill cloth named after which French city?', a: 'Nimes', d: ['Lyon', 'Genoa', 'Rouen'] },
    { c: L, t: 4, q: 'Which late Art Deco style of the 1930s used rounded corners, horizontal speed lines and porthole windows?', a: 'Streamline Moderne', d: ['Bauhaus', 'Googie', 'Brutalism'] },
    { c: L, t: 5, q: 'What is the shallow pool set into the floor of a Roman atrium to catch rainwater called?', a: 'The impluvium', d: ['The compluvium', 'The peristyle', 'The triclinium'] },
  ],
  // day 40
  [
    { c: L, t: 1, q: 'What kind of home is raised on tall posts above water or flood-prone ground?', a: 'A stilt house', d: ['A longhouse', 'A houseboat', 'A treehouse'] },
    { c: L, t: 2, q: 'What is the large circular window filled with radiating tracery on the fronts of Gothic cathedrals called?', a: 'A rose window', d: ['A lancet window', 'An oriel window', 'A lunette'] },
    { c: L, t: 3, q: 'Who designed the five interlocking rings of the Olympic symbol in 1913?', a: 'Pierre de Coubertin', d: ['Avery Brundage', 'Carl Diem', 'Demetrios Vikelas'] },
    { c: L, t: 4, q: 'Which British designer created the peace symbol for the Campaign for Nuclear Disarmament in 1958?', a: 'Gerald Holtom', d: ['Ken Garland', 'F.H.K. Henrion', 'Abram Games'] },
    { c: L, t: 5, q: 'Which Italian architect designed both the Pirelli Tower in Milan and the featherweight Superleggera chair?', a: 'Gio Ponti', d: ['Carlo Mollino', 'Franco Albini', 'Vico Magistretti'] },
  ],
  // day 41
  [
    { c: L, t: 1, q: 'What were architectural drawings copied as white lines on a blue background traditionally called?', a: 'Blueprints', d: ['Sketches', 'Renderings', 'Elevations'] },
    { c: L, t: 2, q: 'Which canvas basketball sneaker carries a player\'s name on its round ankle patch?', a: 'The Chuck Taylor All Star', d: ['The Vans Old Skool', 'The Keds Champion', 'The Adidas Superstar'] },
    { c: L, t: 3, q: 'Which French designer made the cone bra corset Madonna wore on her 1990 Blond Ambition tour?', a: 'Jean Paul Gaultier', d: ['Thierry Mugler', 'Christian Lacroix', 'Azzedine Alaia'] },
    { c: L, t: 4, q: 'Which architect designed the winged TWA Flight Center at New York\'s JFK airport, opened in 1962?', a: 'Eero Saarinen', d: ['Minoru Yamasaki', 'Edward Durell Stone', 'Paul Rudolph'] },
    { c: L, t: 5, q: 'Which Braun record player and radio of 1956, by Dieter Rams and Hans Gugelot, was nicknamed Snow White\'s Coffin?', a: 'The SK 4', d: ['The T3', 'The TP 1', 'The ET 66'] },
  ],
  // day 42
  [
    { c: L, t: 1, q: 'What is the handrail running alongside a staircase called?', a: 'The banister', d: ['The newel', 'The tread', 'The riser'] },
    { c: L, t: 2, q: 'What heavy iron or timber grille slides down vertically to block a castle gateway?', a: 'A portcullis', d: ['A drawbridge', 'A barbican', 'A postern'] },
    { c: L, t: 3, q: 'Which British designer led Apple\'s design team on the iMac, iPod, iPhone and iPad?', a: 'Jony Ive', d: ['Marc Newson', 'Tony Fadell', 'Dieter Rams'] },
    { c: L, t: 4, q: 'Which British inventor created the lava lamp, launched in 1963 as the Astro?', a: 'Edward Craven Walker', d: ['Trevor Baylis', 'Clive Sinclair', 'Owen Maclaren'] },
    { c: L, t: 5, q: 'Which aerodynamicist shaped the body of the Jaguar E-Type, launched in 1961?', a: 'Malcolm Sayer', d: ['William Lyons', 'Ian Callum', 'Frank Costin'] },
  ],
  // day 43
  [
    { c: L, t: 1, q: 'What is the long wooden bench with a back that seats a church congregation called?', a: 'A pew', d: ['A pulpit', 'A lectern', 'An altar'] },
    { c: L, t: 2, q: 'What is the open central hall of a Roman house, a name now used for glass-roofed lobbies, called?', a: 'An atrium', d: ['A foyer', 'A cloister', 'A rotunda'] },
    { c: L, t: 3, q: 'Which German designer at Braun set out ten principles of good design, summed up as less but better?', a: 'Dieter Rams', d: ['Hans Gugelot', 'Max Bill', 'Otl Aicher'] },
    { c: L, t: 4, q: 'Which name for modern architecture came from a 1932 Museum of Modern Art exhibition by Henry-Russell Hitchcock and Philip Johnson?', a: 'The International Style', d: ['The New Objectivity', 'Functionalism', 'Brutalism'] },
    { c: L, t: 5, q: 'Which ornate Portuguese style, full of carved ropes, coral and armillary spheres, decorates the Jeronimos Monastery in Lisbon?', a: 'Manueline', d: ['Mudejar', 'Plateresque', 'Churrigueresque'] },
  ],
  // day 44
  [
    { c: L, t: 1, q: 'What sweater has a high, close-fitting collar folded over at the neck?', a: 'A turtleneck', d: ['A crew neck', 'A V-neck', 'A cowl neck'] },
    { c: L, t: 2, q: 'What kind of wood flooring is made of small blocks laid in geometric patterns such as herringbone?', a: 'Parquet', d: ['Linoleum', 'Terrazzo', 'Laminate'] },
    { c: L, t: 3, q: 'Which American religious sect made plain, finely crafted ladder-back chairs and oval wooden boxes?', a: 'The Shakers', d: ['The Amish', 'The Quakers', 'The Moravians'] },
    { c: L, t: 4, q: 'What flat-roofed, rectangular Egyptian tomb with sloping sides came before the pyramids?', a: 'A mastaba', d: ['A ziggurat', 'A stupa', 'A cenotaph'] },
    { c: L, t: 5, q: 'Which typeface was first drawn for the signs of Charles de Gaulle Airport and later named after its designer?', a: 'Frutiger', d: ['Univers', 'Avenir', 'Meta'] },
  ],
  // day 45
  [
    { c: L, t: 1, q: 'What is the tall upright support, often of stone and topped by a capital, used in classical buildings?', a: 'A column', d: ['A beam', 'A rafter', 'A joist'] },
    { c: L, t: 2, q: 'Which deep-buttoned leather sofa, with rolled arms as high as its back, is named after an English earl?', a: 'The Chesterfield', d: ['The Lawson', 'The tuxedo', 'The camelback'] },
    { c: L, t: 3, q: 'Which shoe designer, born in the Canary Islands in 1942, made his name in London from the early 1970s?', a: 'Manolo Blahnik', d: ['Jimmy Choo', 'Christian Louboutin', 'Stuart Weitzman'] },
    { c: L, t: 4, q: 'Which Spanish architect designed the winged Oculus at the World Trade Center Transportation Hub in New York?', a: 'Santiago Calatrava', d: ['Rafael Moneo', 'Ricardo Bofill', 'Enric Miralles'] },
    { c: L, t: 5, q: 'Which American architect, who married into a furniture company, ran its Planning Unit and shaped the postwar corporate office interior?', a: 'Florence Knoll', d: ['Ray Eames', 'Eva Zeisel', 'Greta Magnusson Grossman'] },
  ],
  // day 46
  [
    { c: L, t: 1, q: 'What tall four-sided stone pillar, tapering to a pyramid tip, was first raised in ancient Egypt?', a: 'An obelisk', d: ['A menhir', 'A totem pole', 'A stele'] },
    { c: L, t: 2, q: 'Which Ray-Ban sunglasses of 1952, with trapezoid plastic frames, did Tom Cruise wear in Risky Business?', a: 'Wayfarers', d: ['Aviators', 'Clubmasters', 'Round Metals'] },
    { c: L, t: 3, q: 'Since 2012, the clock tower that holds Big Ben has officially been named after which monarch?', a: 'Queen Elizabeth II', d: ['Queen Victoria', 'King George V', 'King Edward VII'] },
    { c: L, t: 4, q: 'Which Japanese architect is known for buildings and disaster shelters made from cardboard paper tubes?', a: 'Shigeru Ban', d: ['Kengo Kuma', 'Sou Fujimoto', 'Toyo Ito'] },
    { c: L, t: 5, q: 'Which Anglo-American couturier designed the sculpted Clover Leaf ball gown of 1953?', a: 'Charles James', d: ['Mainbocher', 'Norman Norell', 'James Galanos'] },
  ],
  // day 47
  [
    { c: L, t: 1, q: 'What one-piece work garment has a bib front, shoulder straps and trousers, as worn by farmers and painters?', a: 'Overalls', d: ['A jumpsuit', 'A smock', 'A tabard'] },
    { c: L, t: 2, q: 'Which Italian fashion house uses the head of Medusa as its logo?', a: 'Versace', d: ['Fendi', 'Moschino', 'Dolce and Gabbana'] },
    { c: L, t: 3, q: 'Which pattern of curved teardrop shapes takes its English name from a Scottish weaving town?', a: 'Paisley', d: ['Argyle', 'Tartan', 'Houndstooth'] },
    { c: L, t: 4, q: 'Which French designer launched white go-go boots and space age minidresses in 1964?', a: 'Andre Courreges', d: ['Pierre Cardin', 'Paco Rabanne', 'Emanuel Ungaro'] },
    { c: L, t: 5, q: 'What is each of the wedge-shaped stones that together form an arch called?', a: 'A voussoir', d: ['A quoin', 'An impost', 'A corbel'] },
  ],
  // day 48
  [
    { c: L, t: 1, q: 'What is a raised platform with a railing, built outside an upstairs window?', a: 'A balcony', d: ['A porch', 'A cellar', 'A chimney'] },
    { c: L, t: 2, q: 'What decorative molding projects along the top of a wall or the edge of a roof?', a: 'A cornice', d: ['A plinth', 'A dado', 'A baseboard'] },
    { c: L, t: 3, q: 'Which Dutch art and design movement, linked with Mondrian and Rietveld, used only primary colors and straight lines?', a: 'De Stijl', d: ['Bauhaus', 'Art Deco', 'Jugendstil'] },
    { c: L, t: 4, q: 'Which religion\'s House of Worship in New Delhi, opened in 1986, is shaped like a lotus flower?', a: 'Baha\'i', d: ['Jainism', 'Sikhism', 'Buddhism'] },
    { c: L, t: 5, q: 'Which German standard for ultra-low-energy buildings, first demonstrated in Darmstadt in 1990, relies on airtightness and heavy insulation?', a: 'Passivhaus', d: ['Minergie', 'BREEAM', 'LEED'] },
  ],
  // Days 49-79, live 2026-12-01 to 2026-12-31 (appended 2026-11-06).
  [
    { c: "Architecture & Design", t: 1, q: "What is the covered area at the front door of a house, often with steps and a railing?", a: "A porch", d: ["A cellar", "An attic", "A garage"] },
    { c: "Architecture & Design", t: 2, q: "What is the fortified gateway or outwork protecting a castle's main gate called?", a: "A barbican", d: ["A keep", "A bailey", "A moat"] },
    { c: "Architecture & Design", t: 3, q: "By what nickname is the English landscape gardener Lancelot Brown known?", a: "Capability", d: ["Grand Manner", "Prospect", "Picturesque"] },
    { c: "Architecture & Design", t: 4, q: "What is the large post at the foot or top of a staircase that anchors the handrail called?", a: "A newel post", d: ["A baluster", "A stringer", "A riser"] },
    { c: "Architecture & Design", t: 5, q: "Which Ottoman architect designed the Suleymaniye Mosque in Istanbul?", a: "Mimar Sinan", d: ["Sedefkar Mehmed Agha", "Mimar Hayreddin", "Davud Agha"] },
  ],
  [
    { c: "Architecture & Design", t: 1, q: "Which Paris landmark was meant to stand only 20 years but was saved partly as a radio antenna?", a: "The Eiffel Tower", d: ["The Montparnasse Tower", "The Tour Saint-Jacques", "The Arc de Triomphe"] },
    { c: "Architecture & Design", t: 2, q: "Which architectural style, called 'French work' in its day, began at the Abbey of Saint-Denis around 1140?", a: "Gothic", d: ["Romanesque", "Baroque", "Byzantine"] },
    { c: "Architecture & Design", t: 3, q: "Which Danish architect quit his most famous project in Australia in 1966 and never saw it finished?", a: "Jorn Utzon", d: ["Arne Jacobsen", "Henning Larsen", "Kay Fisker"] },
    { c: "Architecture & Design", t: 4, q: "Which garden designer laid out the gardens of Vaux-le-Vicomte for Nicolas Fouquet?", a: "Andre Le Notre", d: ["Louis Le Vau", "Jules Hardouin-Mansart", "Claude Mollet"] },
    { c: "Architecture & Design", t: 5, q: "Which Venice-based designer created the finely pleated silk Delphos gown around 1907?", a: "Mariano Fortuny", d: ["Paul Poiret", "Madeleine Vionnet", "Jacques Doucet"] },
  ],
  [
    { c: "Architecture & Design", t: 1, q: "What is the large building where aircraft are kept and repaired called?", a: "A hangar", d: ["A terminal", "A depot", "A garage"] },
    { c: "Architecture & Design", t: 2, q: "Which Roman building, a temple turned church, holds the tomb of the painter Raphael?", a: "The Pantheon", d: ["The Colosseum", "The Temple of Saturn", "The Ara Pacis"] },
    { c: "Architecture & Design", t: 3, q: "Which French-born engineer drew up the 1791 plan for Washington, D.C.?", a: "Pierre L'Enfant", d: ["Benjamin Latrobe", "Andrew Ellicott", "Joseph-Jacques Ramee"] },
    { c: "Architecture & Design", t: 4, q: "Which Indian city, planned in the 1950s, has a capitol complex designed by Le Corbusier?", a: "Chandigarh", d: ["Ahmedabad", "Bhubaneswar", "Jaipur"] },
    { c: "Architecture & Design", t: 5, q: "Which architect from Burkina Faso won the 2022 Pritzker Prize?", a: "Francis Kere", d: ["David Adjaye", "Mariam Kamara", "Kunle Adeyemi"] },
  ],
  [
    { c: "Architecture & Design", t: 1, q: "What is the wide-brimmed straw or felt hat of Mexico called?", a: "A sombrero", d: ["A beret", "A fez", "A bowler"] },
    { c: "Architecture & Design", t: 2, q: "Which design school moved from Weimar to Dessau in 1925, into a building by its founder?", a: "The Bauhaus", d: ["The Deutscher Werkbund", "The Ulm School", "The Vienna Workshops"] },
    { c: "Architecture & Design", t: 3, q: "Which architect designed the German Pavilion for the 1929 Barcelona International Exposition?", a: "Ludwig Mies van der Rohe", d: ["Walter Gropius", "Peter Behrens", "Bruno Taut"] },
    { c: "Architecture & Design", t: 4, q: "Which New York firm designed the Boston Public Library's McKim Building and the Washington Square Arch?", a: "McKim, Mead and White", d: ["Carrere and Hastings", "Warren and Wetmore", "Delano and Aldrich"] },
    { c: "Architecture & Design", t: 5, q: "Which young architect won the 1766 competition to plan Edinburgh's New Town?", a: "James Craig", d: ["Robert Adam", "William Adam", "Robert Reid"] },
  ],
  [
    { c: "Architecture & Design", t: 1, q: "In which city are the Painted Ladies, a famous row of Victorian houses facing Alamo Square?", a: "San Francisco", d: ["Seattle", "Los Angeles", "San Diego"] },
    { c: "Architecture & Design", t: 2, q: "Which carmaker built the Model T from 1908?", a: "Ford", d: ["General Motors", "Chrysler", "Studebaker"] },
    { c: "Architecture & Design", t: 3, q: "Which architect designed the Getty Center in Los Angeles, opened in 1997?", a: "Richard Meier", d: ["Frank Gehry", "Michael Graves", "Charles Moore"] },
    { c: "Architecture & Design", t: 4, q: "Which French couturier helped free women from the corset in the years around 1906?", a: "Paul Poiret", d: ["Jacques Doucet", "Jeanne Paquin", "Jean Patou"] },
    { c: "Architecture & Design", t: 5, q: "Which pair, practicing as SANAA, designed the 21st Century Museum of Contemporary Art in Kanazawa?", a: "Kazuyo Sejima and Ryue Nishizawa", d: ["Toyo Ito and Kazuyo Sejima", "Kengo Kuma and Sou Fujimoto", "Fumihiko Maki and Arata Isozaki"] },
  ],
  [
    { c: "Architecture & Design", t: 1, q: "Which ancient structures at Giza were built as tombs for pharaohs?", a: "The pyramids", d: ["The obelisks", "The ziggurats", "The temples of Karnak"] },
    { c: "Architecture & Design", t: 2, q: "In which Andalusian city are the Generalife gardens?", a: "Granada", d: ["Seville", "Cordoba", "Toledo"] },
    { c: "Architecture & Design", t: 3, q: "What is the semicircular recess at the end of a church, usually behind the altar, called?", a: "An apse", d: ["A transept", "A narthex", "A crypt"] },
    { c: "Architecture & Design", t: 4, q: "What are the rows of small tooth-like blocks under a classical cornice called?", a: "Dentils", d: ["Corbels", "Triglyphs", "Metopes"] },
    { c: "Architecture & Design", t: 5, q: "Which architect designed the Royal Crescent in Bath, built from 1767?", a: "John Wood the Younger", d: ["John Nash", "Robert Adam", "James Wyatt"] },
  ],
  [
    { c: "Architecture & Design", t: 1, q: "What do you call a Muslim house of worship?", a: "A mosque", d: ["A synagogue", "A pagoda", "A chapel"] },
    { c: "Architecture & Design", t: 2, q: "Which French couturier gave Yves Saint Laurent his first job and died in 1957?", a: "Christian Dior", d: ["Pierre Balmain", "Jacques Fath", "Hubert de Givenchy"] },
    { c: "Architecture & Design", t: 3, q: "In which palace's Hall of Mirrors was the treaty ending World War I signed in 1919?", a: "The Palace of Versailles", d: ["The Louvre", "Fontainebleau", "Schonbrunn Palace"] },
    { c: "Architecture & Design", t: 4, q: "Which architect designed the New York Times Building (2007) and the Menil Collection in Houston?", a: "Renzo Piano", d: ["Norman Foster", "Jean Nouvel", "Cesar Pelli"] },
    { c: "Architecture & Design", t: 5, q: "Which architect remodeled the Royal Pavilion at Brighton in an Indian style for the Prince Regent?", a: "John Nash", d: ["John Soane", "Henry Holland", "Decimus Burton"] },
  ],
  [
    { c: "Architecture & Design", t: 1, q: "What is a bed stacked on top of another bed called?", a: "A bunk bed", d: ["A futon", "A daybed", "A trundle bed"] },
    { c: "Architecture & Design", t: 2, q: "Which fabric is made from the cocoons of a moth's caterpillar?", a: "Silk", d: ["Satin", "Velvet", "Linen"] },
    { c: "Architecture & Design", t: 3, q: "Which Swedish word for 'just the right amount' became a design buzzword after hygge?", a: "Lagom", d: ["Gemutlichkeit", "Fika", "Sisu"] },
    { c: "Architecture & Design", t: 4, q: "Which architect designed Trinity Church on Boston's Copley Square, finished in 1877?", a: "H. H. Richardson", d: ["Charles Bulfinch", "Richard Morris Hunt", "Ralph Adams Cram"] },
    { c: "Architecture & Design", t: 5, q: "Which designer created the CBS eye logo in 1951?", a: "William Golden", d: ["Lou Dorfsman", "Paul Rand", "Alvin Lustig"] },
  ],
  [
    { c: "Architecture & Design", t: 1, q: "Which Athens temple's marble sculptures, taken by Lord Elgin, are now in the British Museum?", a: "The Parthenon", d: ["The Pantheon", "The Temple of Olympian Zeus", "The Colosseum"] },
    { c: "Architecture & Design", t: 2, q: "Which luxury house's brown canvas has a pattern of initials and flowers designed in 1896?", a: "Louis Vuitton", d: ["Hermes", "Goyard", "Moynat"] },
    { c: "Architecture & Design", t: 3, q: "What is the long central hall of a church, where the congregation sits, called?", a: "The nave", d: ["The chancel", "The apse", "The vestry"] },
    { c: "Architecture & Design", t: 4, q: "What is the flowing ornament of interlaced plant tendrils common in Islamic art called?", a: "Arabesque", d: ["Fleur-de-lis", "Guilloche", "Acanthus"] },
    { c: "Architecture & Design", t: 5, q: "Which Finnish architect designed Helsinki Central Station, opened in 1919?", a: "Eliel Saarinen", d: ["Lars Sonck", "Alvar Aalto", "Armas Lindgren"] },
  ],
  [
    { c: "Architecture & Design", t: 1, q: "What is the tall tower on a church, usually topped by a spire, called?", a: "A steeple", d: ["A crypt", "A nave", "A cloister"] },
    { c: "Architecture & Design", t: 2, q: "Which design style, named after a 1925 Paris exposition of decorative arts, favored bold geometry and luxury materials?", a: "Art Deco", d: ["Art Nouveau", "Arts and Crafts", "Streamline Moderne"] },
    { c: "Architecture & Design", t: 3, q: "Which US president designed the University of Virginia's Academical Village?", a: "Thomas Jefferson", d: ["George Washington", "James Madison", "James Monroe"] },
    { c: "Architecture & Design", t: 4, q: "Which designer proposed the Dymaxion House and the three-wheeled Dymaxion car?", a: "Buckminster Fuller", d: ["Charles Eames", "Frei Otto", "George Nelson"] },
    { c: "Architecture & Design", t: 5, q: "What is the ornament or statue set on a pedestal at the top corners and peak of a classical pediment called?", a: "An acroterion", d: ["A metope", "A triglyph", "A dentil"] },
  ],
  [
    { c: "Architecture & Design", t: 1, q: "Which huge arch stands at the top of the Champs-Elysees in Paris?", a: "The Arc de Triomphe", d: ["The Brandenburg Gate", "The Marble Arch", "The Arch of Constantine"] },
    { c: "Architecture & Design", t: 2, q: "Which plain Roman column order looks like the Doric but has a smooth shaft and a simple base?", a: "Tuscan", d: ["Ionic", "Corinthian", "Composite"] },
    { c: "Architecture & Design", t: 3, q: "Which Japanese designer made the black turtlenecks that Steve Jobs wore?", a: "Issey Miyake", d: ["Kenzo Takada", "Hanae Mori", "Junya Watanabe"] },
    { c: "Architecture & Design", t: 4, q: "Which off-the-shoulder neckline is named after a French film star of the 1950s and 60s?", a: "The Bardot neckline", d: ["The Deneuve neckline", "The Moreau neckline", "The Signoret neckline"] },
    { c: "Architecture & Design", t: 5, q: "Which glassworks designer drew the contour Coca-Cola bottle in 1915?", a: "Earl R. Dean", d: ["Raymond Loewy", "Walter Dorwin Teague", "Henry Dreyfuss"] },
  ],
  [
    { c: "Architecture & Design", t: 1, q: "Which Japanese garment, whose name means 'thing to wear', is fastened with an obi?", a: "A kimono", d: ["A sari", "A poncho", "A caftan"] },
    { c: "Architecture & Design", t: 2, q: "Which sportswear brand shares its hometown, Herzogenaurach in Bavaria, with its rival Adidas?", a: "Puma", d: ["Reebok", "Umbro", "Fila"] },
    { c: "Architecture & Design", t: 3, q: "Which 16th-century Parisian punchcutter's name lives on in a family of old-style typefaces?", a: "Claude Garamond", d: ["Nicolas Jenson", "Christophe Plantin", "Robert Granjon"] },
    { c: "Architecture & Design", t: 4, q: "What is the small dome-shaped structure on a roof, often used as a lookout or for light, called?", a: "A cupola", d: ["A turret", "A finial", "A belvedere"] },
    { c: "Architecture & Design", t: 5, q: "Which Egyptian architect championed mud brick building at the village of New Gourna in the 1940s?", a: "Hassan Fathy", d: ["Ramses Wissa Wassef", "Abdel-Wahed El-Wakil", "Mahmoud Riad"] },
  ],
  [
    { c: "Architecture & Design", t: 1, q: "What do you call a very large and impressive house belonging to a wealthy family?", a: "A mansion", d: ["A cabin", "A cottage", "A bungalow"] },
    { c: "Architecture & Design", t: 2, q: "Which architect designed the Carson Pirie Scott store in Chicago, with its lavish ironwork entrance?", a: "Louis Sullivan", d: ["Daniel Burnham", "John Wellborn Root", "William Holabird"] },
    { c: "Architecture & Design", t: 3, q: "Which Bauhaus-trained architect designed the Whitney Museum's 1966 building on Madison Avenue?", a: "Marcel Breuer", d: ["Mart Stam", "Josef Albers", "Eileen Gray"] },
    { c: "Architecture & Design", t: 4, q: "Which designer made the 1966 poster of Bob Dylan with rainbow-colored hair?", a: "Milton Glaser", d: ["Paul Rand", "Saul Bass", "Herb Lubalin"] },
    { c: "Architecture & Design", t: 5, q: "Which Chilean architect, known for half-built social housing, won the 2016 Pritzker Prize?", a: "Alejandro Aravena", d: ["Smiljan Radic", "Mathias Klotz", "Pezo von Ellrichshausen"] },
  ],
  [
    { c: "Architecture & Design", t: 1, q: "What is the cone-shaped tent of poles and hides used by Plains peoples called?", a: "A tepee", d: ["An igloo", "A wigwam", "A yurt"] },
    { c: "Architecture & Design", t: 2, q: "Which designer dressed Richard Gere for the film American Gigolo (1980)?", a: "Giorgio Armani", d: ["Gianni Versace", "Valentino Garavani", "Ermenegildo Zegna"] },
    { c: "Architecture & Design", t: 3, q: "What is an upright stone slab carved with an inscription, like the one bearing the Code of Hammurabi, called?", a: "A stele", d: ["A dolmen", "A menhir", "A cairn"] },
    { c: "Architecture & Design", t: 4, q: "Which architect spent nearly thirty years designing Hearst Castle in San Simeon, California?", a: "Julia Morgan", d: ["Bernard Maybeck", "Irving Gill", "John Galen Howard"] },
    { c: "Architecture & Design", t: 5, q: "What is the Japanese dry landscape garden of raked gravel and stones called?", a: "Karesansui", d: ["Tsukiyama", "Chaniwa", "Kaiyu-shiki"] },
  ],
  [
    { c: "Architecture & Design", t: 1, q: "Which Toronto landmark, finished in 1976, has a glass floor about 342 meters above the ground?", a: "The CN Tower", d: ["The Space Needle", "The Calgary Tower", "The Stratosphere"] },
    { c: "Architecture & Design", t: 2, q: "Which church did Emperor Justinian build in Constantinople, reportedly saying 'Solomon, I have outdone thee'?", a: "Hagia Sophia", d: ["The Blue Mosque", "Topkapi Palace", "Hagia Irene"] },
    { c: "Architecture & Design", t: 3, q: "Which Florentine is credited with demonstrating linear perspective with a painted panel of the Baptistery?", a: "Filippo Brunelleschi", d: ["Leon Battista Alberti", "Michelozzo", "Giuliano da Sangallo"] },
    { c: "Architecture & Design", t: 4, q: "Which architect designed Chicago's corncob-shaped Marina City towers in the 1960s?", a: "Bertrand Goldberg", d: ["Harry Weese", "Bruce Graham", "Walter Netsch"] },
    { c: "Architecture & Design", t: 5, q: "Which playwright and architect designed Blenheim Palace?", a: "John Vanbrugh", d: ["Nicholas Hawksmoor", "Thomas Archer", "James Gibbs"] },
  ],
  [
    { c: "Architecture & Design", t: 1, q: "Denim is woven from which plant fiber?", a: "Cotton", d: ["Linen", "Hemp", "Jute"] },
    { c: "Architecture & Design", t: 2, q: "Which home furnishings company did Ingvar Kamprad found in 1943?", a: "IKEA", d: ["H&M", "Volvo", "Electrolux"] },
    { c: "Architecture & Design", t: 3, q: "What is the room in a monastery where the monks eat together called?", a: "The refectory", d: ["The dormitory", "The chapter house", "The scriptorium"] },
    { c: "Architecture & Design", t: 4, q: "Which Gothic Revival architect designed the interiors and clock tower of the Palace of Westminster?", a: "Augustus Pugin", d: ["George Gilbert Scott", "Alfred Waterhouse", "William Butterfield"] },
    { c: "Architecture & Design", t: 5, q: "Which German designer created the Tizio desk lamp for Artemide in 1972?", a: "Richard Sapper", d: ["Dieter Rams", "Ingo Maurer", "Konstantin Grcic"] },
  ],
  [
    { c: "Architecture & Design", t: 1, q: "Which garment is a single length of cloth, often six yards, wrapped around the body with one end over the shoulder?", a: "A sari", d: ["A kimono", "A sarong", "A kilt"] },
    { c: "Architecture & Design", t: 2, q: "Which Dubai skyscraper, opened in 2010, stands about 828 meters tall?", a: "Burj Khalifa", d: ["Burj al Arab", "Emirates Tower", "Princess Tower"] },
    { c: "Architecture & Design", t: 3, q: "Which pattern of jagged broken checks is named after a dog's tooth?", a: "Houndstooth", d: ["Herringbone", "Glen plaid", "Gingham"] },
    { c: "Architecture & Design", t: 4, q: "Which Indian port city gave its name to calico cloth?", a: "Calicut", d: ["Madras", "Surat", "Cochin"] },
    { c: "Architecture & Design", t: 5, q: "Which German architect designed the tent-like Berlin Philharmonie (1963)?", a: "Hans Scharoun", d: ["Egon Eiermann", "Gottfried Bohm", "Frei Otto"] },
  ],
  [
    { c: "Architecture & Design", t: 1, q: "What is the sloping fabric cover stretched over a shop window to give shade?", a: "An awning", d: ["A canopy bed", "A shutter", "A trellis"] },
    { c: "Architecture & Design", t: 2, q: "Which ancient Nabataean city's most famous carved facade is called the Treasury?", a: "Petra", d: ["Palmyra", "Jerash", "Baalbek"] },
    { c: "Architecture & Design", t: 3, q: "What is the low triangular gable above the columns of a classical temple front called?", a: "A pediment", d: ["An architrave", "A metope", "A plinth"] },
    { c: "Architecture & Design", t: 4, q: "Which Danish architect designed CopenHill (2019), a power plant with a ski slope on its roof?", a: "Bjarke Ingels", d: ["Henning Larsen", "Jan Gehl", "Jorn Utzon"] },
    { c: "Architecture & Design", t: 5, q: "Which designer created the FedEx logo with its hidden arrow in 1994?", a: "Lindon Leader", d: ["Saul Bass", "Paul Rand", "Ivan Chermayeff"] },
  ],
  [
    { c: "Architecture & Design", t: 1, q: "What is a row of closely planted bushes forming a garden boundary called?", a: "A hedge", d: ["A trellis", "A fence", "A border"] },
    { c: "Architecture & Design", t: 2, q: "Which Washington building's cast-iron dome, finished in 1866, is topped by the Statue of Freedom?", a: "The Capitol", d: ["The White House", "The Library of Congress", "The Supreme Court"] },
    { c: "Architecture & Design", t: 3, q: "Which diamond-patterned knit, popular on socks and sweaters, is named after a Scottish clan's tartan?", a: "Argyle", d: ["Fair Isle", "Houndstooth", "Tweed"] },
    { c: "Architecture & Design", t: 4, q: "What is a columned porch at a building's entrance, topped by a pediment, called?", a: "A portico", d: ["A loggia", "A pergola", "A veranda"] },
    { c: "Architecture & Design", t: 5, q: "Which Sri Lankan architect is regarded as the leading figure of tropical modernism?", a: "Geoffrey Bawa", d: ["Minnette de Silva", "Valentine Gunasekara", "Charles Correa"] },
  ],
  [
    { c: "Architecture & Design", t: 1, q: "What do you call the large farm building used to store hay and shelter animals?", a: "A barn", d: ["A silo", "A shed", "A stable yard"] },
    { c: "Architecture & Design", t: 2, q: "Which Italian scooter did Audrey Hepburn and Gregory Peck ride in Roman Holiday (1953)?", a: "Vespa", d: ["Lambretta", "Piaggio Ape", "Ducati"] },
    { c: "Architecture & Design", t: 3, q: "What is the name of the & symbol?", a: "The ampersand", d: ["The asterisk", "The pilcrow", "The section sign"] },
    { c: "Architecture & Design", t: 4, q: "Which Argentine-American architect designed the Petronas Towers in Kuala Lumpur (1998)?", a: "Cesar Pelli", d: ["Rafael Vinoly", "Clorindo Testa", "Emilio Ambasz"] },
    { c: "Architecture & Design", t: 5, q: "Which Swiss architect designed the stone Therme Vals spa (1996) and won the 2009 Pritzker Prize?", a: "Peter Zumthor", d: ["Mario Botta", "Jacques Herzog", "Valerio Olgiati"] },
  ],
  [
    { c: "Architecture & Design", t: 1, q: "What is the bridge that can be raised to block the way across a castle's moat?", a: "A drawbridge", d: ["A portcullis", "A footbridge", "A gangway"] },
    { c: "Architecture & Design", t: 2, q: "Which Moscow cathedral on Red Square is crowned by brightly painted onion domes?", a: "St. Basil's Cathedral", d: ["Christ the Savior Cathedral", "The Cathedral of the Dormition", "Kazan Cathedral"] },
    { c: "Architecture & Design", t: 3, q: "Which ribbed cotton fabric has raised lines called wales?", a: "Corduroy", d: ["Seersucker", "Gabardine", "Chambray"] },
    { c: "Architecture & Design", t: 4, q: "Which Japanese designer launched the label Y's in 1972?", a: "Yohji Yamamoto", d: ["Issey Miyake", "Kansai Yamamoto", "Hanae Mori"] },
    { c: "Architecture & Design", t: 5, q: "Which printer's dolphin and anchor device marked the pocket-sized classics of his Venice press?", a: "Aldus Manutius", d: ["Nicolas Jenson", "Erhard Ratdolt", "Johannes de Spira"] },
  ],
  [
    { c: "Architecture & Design", t: 1, q: "What do you call a very tall building with many floors?", a: "A skyscraper", d: ["A bungalow", "A cottage", "A warehouse"] },
    { c: "Architecture & Design", t: 2, q: "Which Inca site did Hiram Bingham bring to world attention in 1911?", a: "Machu Picchu", d: ["Cusco", "Chan Chan", "Tiwanaku"] },
    { c: "Architecture & Design", t: 3, q: "What was the name of the ancient lighthouse on an island off Alexandria, one of the Seven Wonders?", a: "The Pharos", d: ["The Colossus", "The Mausoleum", "The Serapeum"] },
    { c: "Architecture & Design", t: 4, q: "Which typeface, made by Matthew Carter for Microsoft in 1996, shares its name with a US state?", a: "Georgia", d: ["Virginia", "Carolina", "Montana"] },
    { c: "Architecture & Design", t: 5, q: "Which Birmingham printer cut a crisp transitional typeface in the 1750s that Benjamin Franklin admired?", a: "John Baskerville", d: ["William Caslon", "John Bell", "Thomas Bewick"] },
  ],
  [
    { c: "Architecture & Design", t: 1, q: "Which Missouri city hosted the 1904 World's Fair?", a: "St. Louis", d: ["Kansas City", "Chicago", "Cincinnati"] },
    { c: "Architecture & Design", t: 2, q: "What has Chicago's Sears Tower officially been called since 2009?", a: "Willis Tower", d: ["Trump Tower", "Aon Center", "Hancock Tower"] },
    { c: "Architecture & Design", t: 3, q: "Which company introduced the 3.5-inch floppy disk in 1981?", a: "Sony", d: ["Panasonic", "Toshiba", "JVC"] },
    { c: "Architecture & Design", t: 4, q: "Which designer created much of Jacqueline Kennedy's wardrobe as First Lady?", a: "Oleg Cassini", d: ["Norman Norell", "Bill Blass", "Pauline Trigere"] },
    { c: "Architecture & Design", t: 5, q: "Which German Baroque architect designed the Wurzburg Residence?", a: "Balthasar Neumann", d: ["Johann Dientzenhofer", "Dominikus Zimmermann", "Matthaus Daniel Poppelmann"] },
  ],
  [
    { c: "Architecture & Design", t: 1, q: "What is a sleeveless garment worn over a shirt and under a suit jacket called?", a: "A vest", d: ["A cardigan", "A blazer", "A poncho"] },
    { c: "Architecture & Design", t: 2, q: "Which American designer launched a capsule wardrobe called Seven Easy Pieces in 1985?", a: "Donna Karan", d: ["Diane von Furstenberg", "Liz Claiborne", "Norma Kamali"] },
    { c: "Architecture & Design", t: 3, q: "What is a window set upright in a sloping roof, with its own small roof, called?", a: "A dormer", d: ["A clerestory", "An oriel", "A transom"] },
    { c: "Architecture & Design", t: 4, q: "Which Belgian architect designed the Art Nouveau Hotel Tassel in Brussels (1893)?", a: "Victor Horta", d: ["Henry van de Velde", "Paul Hankar", "Josef Hoffmann"] },
    { c: "Architecture & Design", t: 5, q: "Which Baroque architect designed San Carlo alle Quattro Fontane in Rome?", a: "Francesco Borromini", d: ["Pietro da Cortona", "Carlo Maderno", "Carlo Rainaldi"] },
  ],
  [
    { c: "Architecture & Design", t: 1, q: "In which Italian city is the Piazza dei Miracoli, with its cathedral, baptistery and tilting bell tower?", a: "Pisa", d: ["Florence", "Venice", "Siena"] },
    { c: "Architecture & Design", t: 2, q: "Which Cambodian temple complex appears on the national flag of Cambodia?", a: "Angkor Wat", d: ["Borobudur", "Bagan", "Wat Arun"] },
    { c: "Architecture & Design", t: 3, q: "Which Greek column order has capitals decorated with acanthus leaves?", a: "Corinthian", d: ["Ionic", "Doric", "Tuscan"] },
    { c: "Architecture & Design", t: 4, q: "Which American architect designed the Salk Institute and the Kimbell Art Museum?", a: "Louis Kahn", d: ["Paul Rudolph", "Edward Durell Stone", "Marcel Breuer"] },
    { c: "Architecture & Design", t: 5, q: "Which Italian-born architect designed the Winter Palace in St. Petersburg?", a: "Bartolomeo Rastrelli", d: ["Carlo Rossi", "Giacomo Quarenghi", "Antonio Rinaldi"] },
  ],
  [
    { c: "Architecture & Design", t: 1, q: "Which New York skyscraper was hit by a B-25 bomber in fog in July 1945?", a: "The Empire State Building", d: ["The Chrysler Building", "The Woolworth Building", "Rockefeller Center"] },
    { c: "Architecture & Design", t: 2, q: "Which Italian carmaker's logo is a black prancing horse on yellow?", a: "Ferrari", d: ["Lamborghini", "Maserati", "Alfa Romeo"] },
    { c: "Architecture & Design", t: 3, q: "Which jeans brand puts a small red tab on the back pocket?", a: "Levi's", d: ["Wrangler", "Lee", "Guess"] },
    { c: "Architecture & Design", t: 4, q: "Which British designer founded the Design Museum in London, opened in 1989?", a: "Terence Conran", d: ["Robin Day", "Lucienne Day", "David Hicks"] },
    { c: "Architecture & Design", t: 5, q: "Which Chinese architect won the 2012 Pritzker Prize?", a: "Wang Shu", d: ["Ma Yansong", "Yung Ho Chang", "Liu Jiakun"] },
  ],
  [
    { c: "Architecture & Design", t: 1, q: "What kind of clothing item is a fedora?", a: "A hat", d: ["A scarf", "A shoe", "A jacket"] },
    { c: "Architecture & Design", t: 2, q: "Which wooden lawn chair was first built by Thomas Lee at Westport, New York, in 1903?", a: "The Adirondack chair", d: ["The Windsor chair", "The Shaker chair", "The Catskill chair"] },
    { c: "Architecture & Design", t: 3, q: "Which Roman writer said good buildings need firmness, commodity and delight?", a: "Vitruvius", d: ["Apollodorus of Damascus", "Frontinus", "Hero of Alexandria"] },
    { c: "Architecture & Design", t: 4, q: "Which Viennese architect designed the Majolica House and the Karlsplatz metro pavilions?", a: "Otto Wagner", d: ["Adolf Loos", "Joseph Maria Olbrich", "Josef Plecnik"] },
    { c: "Architecture & Design", t: 5, q: "Which German architect designed the Einstein Tower observatory in Potsdam?", a: "Erich Mendelsohn", d: ["Hans Poelzig", "Bruno Taut", "Fritz Hoger"] },
  ],
  [
    { c: "Architecture & Design", t: 1, q: "Which German carmaker built the round-backed Beetle?", a: "Volkswagen", d: ["BMW", "Opel", "Audi"] },
    { c: "Architecture & Design", t: 2, q: "What is a small church, or a room for prayer inside a larger building, called?", a: "A chapel", d: ["A nave", "A crypt", "A transept"] },
    { c: "Architecture & Design", t: 3, q: "Which architect designed the curving Church of Saint Francis of Assisi at Pampulha, Belo Horizonte (1943)?", a: "Oscar Niemeyer", d: ["Lucio Costa", "Lina Bo Bardi", "Roberto Burle Marx"] },
    { c: "Architecture & Design", t: 4, q: "Which architect designed the red sandstone Smithsonian Institution Building, nicknamed the Castle?", a: "James Renwick Jr.", d: ["Robert Mills", "Thomas U. Walter", "Alexander Jackson Davis"] },
    { c: "Architecture & Design", t: 5, q: "Which Indian architect, who worked under Le Corbusier, won the 2018 Pritzker Prize?", a: "Balkrishna Doshi", d: ["Charles Correa", "Achyut Kanvinde", "Raj Rewal"] },
  ],
  [
    { c: "Architecture & Design", t: 1, q: "Which toy company opened its first theme park in Billund, Denmark, in 1968?", a: "LEGO", d: ["K'NEX", "Mattel", "Playmobil"] },
    { c: "Architecture & Design", t: 2, q: "Which luxury carmaker's hood ornament is the Spirit of Ecstasy?", a: "Rolls-Royce", d: ["Bentley", "Jaguar", "Aston Martin"] },
    { c: "Architecture & Design", t: 3, q: "Which wide, open typeface did Matthew Carter design for Microsoft in 1996 for reading on screens?", a: "Verdana", d: ["Arial", "Calibri", "Segoe UI"] },
    { c: "Architecture & Design", t: 4, q: "Which English-born couturier founded his Paris house in 1858 and is called the father of haute couture?", a: "Charles Frederick Worth", d: ["John Redfern", "Edward Molyneux", "Charles James"] },
    { c: "Architecture & Design", t: 5, q: "Which Belgian designer was one of the Antwerp Six?", a: "Dries Van Noten", d: ["Martin Margiela", "Raf Simons", "Diane von Furstenberg"] },
  ],
  [
    { c: "Architecture & Design", t: 1, q: "What kind of bridge is the Brooklyn Bridge, its deck hung from steel cables between stone towers?", a: "A suspension bridge", d: ["A drawbridge", "An arch bridge", "A pontoon bridge"] },
    { c: "Architecture & Design", t: 2, q: "Which Barcelona church by Antoni Gaudi was consecrated by Pope Benedict XVI in 2010?", a: "The Sagrada Familia", d: ["The Casa Batllo", "The Palau Guell", "The Casa Mila"] },
    { c: "Architecture & Design", t: 3, q: "Which Italian company makes the eight-sided Moka Express stovetop coffee pot?", a: "Bialetti", d: ["Alessi", "Lavazza", "Gaggia"] },
    { c: "Architecture & Design", t: 4, q: "What are the painted, glazed ceramic tiles that cover many building facades in Portugal called?", a: "Azulejos", d: ["Talavera", "Majolica", "Zellige"] },
    { c: "Architecture & Design", t: 5, q: "Which Portuguese architect won the 1992 Pritzker Prize?", a: "Alvaro Siza", d: ["Eduardo Souto de Moura", "Fernando Tavora", "Goncalo Byrne"] },
  ],
  [
    { c: "Architecture & Design", t: 1, q: "Which giant ancient amphitheater in Rome staged gladiator fights?", a: "The Colosseum", d: ["The Pantheon", "The Forum", "The Circus Maximus"] },
    { c: "Architecture & Design", t: 2, q: "Which Paris cathedral on the Ile de la Cite has a great bell called Emmanuel in its south tower?", a: "Notre-Dame", d: ["Sacre-Coeur", "Saint-Sulpice", "Sainte-Chapelle"] },
    { c: "Architecture & Design", t: 3, q: "What are the small strokes at the ends of letters in typefaces such as Times New Roman called?", a: "Serifs", d: ["Ligatures", "Kerns", "Ascenders"] },
    { c: "Architecture & Design", t: 4, q: "Which designer created the Mini car, launched in 1959?", a: "Alec Issigonis", d: ["Ferdinand Porsche", "Dante Giacosa", "Battista Pininfarina"] },
    { c: "Architecture & Design", t: 5, q: "Which Khmer king built Angkor Wat in the 12th century?", a: "Suryavarman II", d: ["Jayavarman VII", "Yasovarman I", "Indravarman I"] },
  ],
];
