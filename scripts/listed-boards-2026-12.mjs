// Listed boards for 2026-12-01 .. 2026-12-31 (#128 .. #158), appended by
// scripts/gen-listed.mjs. Authored and fact-checked by hand, 2026-11-12, by the
// app/listed/puzzles.js rules: a published NUMBER from a citable source for
// every item, no ties, no pair that reputable sources order differently, a
// ninth item on Sundays, and the domain rotating History, Geography, Trivia
// (11 / 10 / 10 in this segment, never two in a row). Trivia is spread over
// music, sport (two of ten), games, business, screen, politics and art.
//
// Figures that would keep moving were avoided or frozen by the wording: the
// touchdown, strikeout and senate boards rank RETIRED players and members only
// (Derrick Henry, Justin Verlander, Chuck Grassley and Mitch McConnell are
// still adding to their totals), the Nintendo board leaves out the Switch
// (still on sale), and the box office boards name their source and date.
//
// Sources, one per board, in date order:
//  12-01 NASA Solar System Exploration discovery notes (science.nasa.gov)
//  12-02 US Census Bureau, 2020 Census apportionment results (census.gov)
//  12-03 Britannica composer biographies (britannica.com)
//  12-04 Internet Broadway Database opening nights (ibdb.com)
//  12-05 US Census Bureau, 2020 Census city populations (census.gov)
//  12-06 Pro Football Hall of Fame, Top 20 Touchdowns at the start of the 2026
//        season, figures from the Elias Sports Bureau (profootballhof.com/top-20-touchdowns)
//  12-07 Walt Disney Animation Studios film history (disneyanimation.com)
//  12-08 NOAA, The Coastline of the United States, general coastline in statute
//        miles (coast.noaa.gov/data/docs/states/shorelines.pdf)
//  12-09 Nintendo IR, Dedicated Video Game Sales Units, as of September 30, 2026
//        (nintendo.co.jp/ir/en/finance/hard_soft/)
//  12-10 International Olympic Committee, past Winter Games (olympics.com)
//  12-11 CIA World Factbook, area (cia.gov/the-world-factbook)
//  12-12 Each buyer's announcement press release (deal value as announced)
//  12-13 Britannica bridge entries and bridge operators' histories
//  12-14 CIA World Factbook, area
//  12-15 The Numbers, biggest domestic opening weekends
//        (the-numbers.com/box-office-records/domestic/all-movies/weekend/1st)
//  12-16 The holding museums' collection records (Rijksmuseum, Prado, National
//        Gallery, Louvre, MoMA/Nasjonalmuseet, Art Institute of Chicago, Reina Sofia)
//  12-17 Capital city coordinates, USGS Geographic Names Information System
//  12-18 Presidents by age at inauguration, from National Archives birth and
//        inauguration dates (en.wikipedia.org/wiki/List_of_presidents_of_the_United_States_by_age)
//  12-19 Network premiere dates
//  12-20 USGS, Elevations and Distances in the United States
//        (pubs.usgs.gov/gip/Elevations-Distances/elvadist.html); Denali from the 2015 USGS survey
//  12-21 Baseball-Reference career strikeout leaders
//  12-22 Original single and album release dates (Christmas songs; was 12-25)
//  12-23 US Census Bureau, 2020 Census county populations
//  12-24 US Senate Historical Office, longest-serving senators
//        (en.wikipedia.org/wiki/List_of_longest-serving_members_of_the_United_States_Congress)
//  12-25 National Park Service establishment dates (nps.gov; was 12-22)
//  12-26 US Census Bureau state land area measurements
//  12-27 Box Office Mojo worldwide grosses including re-releases
//        (en.wikipedia.org/wiki/List_of_highest-grossing_Christmas_films)
//  12-28 Royal Museums Greenwich, US Navy and shipbuilders' records
//  12-29 CIA World Factbook, area
//  12-30 The Art Newspaper annual visitor survey, 2024 figures (published March 2025)
//  12-31 Publisher histories
export const START = '2026-12-01';
export const FIRST_NUM = 128;   // the bank ends at #127, 2026-11-30

const H = (title, metric, source, items, hi = 'Earliest', lo = 'Latest') => ({ cat: 'History', title, metric, hi, lo, source, items });
const G = (title, metric, hi, lo, source, items) => ({ cat: 'Geography', title, metric, hi, lo, source, items });
const T = (title, metric, hi, lo, source, items) => ({ cat: 'Trivia', title, metric, hi, lo, source, items });

export const BOARDS = [
  // 12-01 Tue
  H('Order in which these moons, planets and dwarf planets were discovered', 'Discovered', 'NASA Solar System Exploration discovery records', [
    ['Io', '1610', 'Spotted by Galileo through a homemade telescope, along with three other moons of Jupiter.'],
    ['Iapetus', '1671', 'Giovanni Cassini could see it on only one side of Saturn, because one face is far darker than the other.'],
    ['Uranus', '1781', 'William Herschel first took it for a comet; it was the first planet found with a telescope.'],
    ['Ceres', '1801', "Giuseppe Piazzi found it on New Year's Day, and it was counted as a planet for decades."],
    ['Neptune', '1846', 'Located after mathematicians predicted its position from the pull it exerted on Uranus.'],
    ['Pluto', '1930', 'Found by Clyde Tombaugh at Lowell Observatory, and reclassified as a dwarf planet in 2006.'],
    ['Charon', '1978', "Pluto's largest moon, first seen as a bump on photographic plates at the Naval Observatory."],
    ['Eris', '2005', 'Its discovery, by a team at Caltech, led directly to Pluto losing planet status.'],
  ]),
  // 12-02 Wed
  G('Most populous US states, 2020 census', 'Population', 'Most', 'Fewest', 'US Census Bureau, 2020 Census resident population', [
    ['California', '39,538,223', 'Home to roughly one in eight Americans.'],
    ['Texas', '29,145,505', 'Gained more residents than any other state between 2010 and 2020.'],
    ['Florida', '21,538,187', 'Passed New York in population in 2014.'],
    ['New York', '20,201,249', 'Its namesake city alone holds more than four in ten of its residents.'],
    ['Pennsylvania', '13,002,700', 'Topped 13 million for the first time in the 2020 count.'],
    ['Illinois', '12,812,508', 'Lost population over the decade, one of only three states to do so.'],
    ['Ohio', '11,799,448', 'Its three largest cities, Columbus, Cleveland and Cincinnati, all begin with C.'],
    ['Georgia', '10,711,908', 'Crossed ten million residents during the 2010s.'],
  ]),
  // 12-03 Thu
  T('How old these composers were when they died', 'Age at death', 'Oldest', 'Youngest', 'Britannica composer biographies', [
    ['Giuseppe Verdi', '87', 'Wrote Falstaff, his last opera, when he was nearly eighty.'],
    ['Joseph Haydn', '77', 'Wrote more than 100 symphonies, earning the nickname father of the symphony.'],
    ['Johann Sebastian Bach', '65', 'Spent his last 27 years as director of music in Leipzig.'],
    ['Ludwig van Beethoven', '56', 'Was almost totally deaf by the time he finished his Ninth Symphony.'],
    ['Pyotr Ilyich Tchaikovsky', '53', 'Died nine days after conducting the premiere of his Sixth Symphony.'],
    ['Frederic Chopin', '39', 'Left Poland at twenty and never went back.'],
    ['Wolfgang Amadeus Mozart', '35', 'Died while still working on his Requiem, which was completed by others.'],
    ['Franz Schubert', '31', 'Never heard his Great C major Symphony performed; it premiered more than a decade after his death.'],
  ]),
  // 12-04 Fri
  H('Order in which these musicals opened on Broadway', 'Opened', 'Internet Broadway Database opening nights', [
    ['Oklahoma!', '1943', 'The first Rodgers and Hammerstein musical, and a template for the book musical.'],
    ['West Side Story', '1957', 'Moved Romeo and Juliet to the Upper West Side of Manhattan.'],
    ['Fiddler on the Roof', '1964', 'Became the first Broadway musical to pass 3,000 performances.'],
    ['Cats', '1982', "Set to poems from T. S. Eliot's Old Possum's Book of Practical Cats."],
    ['Les Miserables', '1987', "Arrived from London's West End, where it had opened two years earlier."],
    ['Rent', '1996', 'Its creator died the night before its first off-Broadway preview.'],
    ['Wicked', '2003', 'Tells the story of the Wicked Witch of the West before Dorothy arrived.'],
    ['Hamilton', '2015', 'Moved uptown after a sold-out run at the Public Theater.'],
  ]),
  // 12-05 Sat
  G('Largest US cities, 2020 census', 'Population', 'Largest', 'Smallest', 'US Census Bureau, 2020 Census, population within city limits', [
    ['New York City', '8,804,190', "Brooklyn on its own would rank as the country's fourth-largest city."],
    ['Los Angeles', '3,898,747', 'Spreads over more than 460 square miles, from the San Fernando Valley to the port.'],
    ['Chicago', '2,746,388', 'Grew in the 2020 count after losing residents in the census before.'],
    ['Houston', '2,304,580', 'Has no formal zoning code, unusual for a city its size.'],
    ['Phoenix', '1,608,139', 'Overtook Philadelphia for fifth place during the 2010s.'],
    ['Philadelphia', '1,603,797', 'Was the second-largest city in the first census, in 1790.'],
    ['San Antonio', '1,434,625', 'The Alamo sits in the middle of its downtown.'],
    ['San Diego', '1,386,932', 'Lies less than 20 miles from the busiest land border crossing in the Western Hemisphere.'],
  ]),
  // 12-06 SUN
  T('Career touchdowns by these retired NFL greats', 'Touchdowns', 'Most', 'Fewest', 'Pro Football Hall of Fame, from Elias Sports Bureau figures; rushing, receiving and return touchdowns', [
    ['Jerry Rice', '208', 'Also holds the career records for catches and receiving yards.'],
    ['Emmitt Smith', '175', "The NFL's career rushing leader, with more than 18,000 yards."],
    ['LaDainian Tomlinson', '162', 'Scored 31 touchdowns in 2006, a single-season record.'],
    ['Randy Moss', '157', 'Caught 23 touchdown passes in 2007, a single-season record.'],
    ['Terrell Owens', '156', 'Played for five teams over fifteen seasons.'],
    ['Marcus Allen', '145', 'The first player to gain 10,000 rushing yards and 5,000 receiving yards.'],
    ['Marshall Faulk', '136', 'Won three straight Offensive Player of the Year awards, from 1999 to 2001.'],
    ['Cris Carter', '131', 'Caught 122 passes in back-to-back seasons for Minnesota.'],
    ['Marvin Harrison', '128', 'Caught 143 passes in 2002, a record that stood for 17 years.'],
  ]),
  // 12-07 Mon
  H('Order in which these Disney animated films were released', 'Released', 'Walt Disney Animation Studios release dates', [
    ['Bambi', '1942', 'Its artists studied live deer brought into the studio.'],
    ['Cinderella', '1950', 'Its success rescued the studio after a run of wartime losses.'],
    ['Peter Pan', '1953', 'The last Disney animated feature released through RKO.'],
    ['Lady and the Tramp', '1955', 'The first animated feature filmed in widescreen CinemaScope.'],
    ['Sleeping Beauty', '1959', 'Its disappointing box office led Disney to lay off much of its animation staff.'],
    ['One Hundred and One Dalmatians', '1961', "Pioneered photocopying the animators' drawings straight onto cels."],
    ['The Jungle Book', '1967', 'The last animated feature Walt Disney personally oversaw.'],
    ['The Little Mermaid', '1989', 'Kicked off the run of hits known as the Disney Renaissance.'],
  ]),
  // 12-08 Tue
  G('US states with the longest coastlines', 'General coastline', 'Longest', 'Shortest', 'NOAA, The Coastline of the United States, general coastline in statute miles', [
    ['Alaska', '6,640 mi', 'Has more general coastline than all the other states combined.'],
    ['Florida', '1,350 mi', 'More of it faces the Gulf than the Atlantic.'],
    ['California', '840 mi', 'Runs the length of the state, from the Mexican border to Oregon.'],
    ['Hawaii', '750 mi', 'The only state made up entirely of islands.'],
    ['Louisiana', '397 mi', 'Counting every bay and marsh, its tidal shoreline runs past 7,700 miles.'],
    ['Texas', '367 mi', 'A chain of barrier islands, led by Padre Island, lines much of it.'],
    ['North Carolina', '301 mi', 'Much of it runs along the Outer Banks, well out from the mainland.'],
    ['Oregon', '296 mi', 'A 1967 law kept its entire ocean beach open to the public.'],
  ]),
  // 12-09 Wed
  T("Nintendo's retired consoles and handhelds, by lifetime units sold", 'Units sold', 'Most', 'Fewest', 'Nintendo IR, Dedicated Video Game Sales Units, as of September 30, 2026', [
    ['Nintendo DS', '154.02M', "Its two screens made it Nintendo's best seller until the Switch passed it."],
    ['Game Boy', '118.69M', 'The figure includes the Game Boy Color, which Nintendo counts together with it.'],
    ['Wii', '101.63M', 'Its motion controls drew in players who had never owned a console.'],
    ['Game Boy Advance', '81.51M', 'Launched in 2001 with a wider screen than the Game Boy.'],
    ['Nintendo 3DS', '75.94M', 'Showed 3D images without the need for glasses.'],
    ['Nintendo Entertainment System', '61.91M', 'Launched in Japan in 1983 as the Family Computer, or Famicom.'],
    ['Super Nintendo', '49.10M', 'Launched in North America in 1991 with Super Mario World.'],
    ['Nintendo 64', '32.93M', 'Its controller added an analog stick that rivals soon copied.'],
  ]),
  // 12-10 Thu
  H('Order in which these cities first hosted the Winter Olympics', 'First hosted', 'International Olympic Committee records', [
    ['Chamonix', '1924', 'Its winter sports week was later recognized by the IOC as the first Winter Games.'],
    ['St. Moritz', '1928', 'Hosted again in 1948, the first Winter Games after the Second World War.'],
    ['Oslo', '1952', 'The first Winter Games held in Scandinavia, the cradle of skiing.'],
    ["Cortina d'Ampezzo", '1956', 'Hosted again in 2026, sharing the Games with Milan.'],
    ['Innsbruck', '1964', 'Hosted a second time just twelve years later, in 1976.'],
    ['Sapporo', '1972', 'The first Winter Games held outside Europe and North America.'],
    ['Sarajevo', '1984', 'Its Olympic bobsled track was damaged in the siege of the 1990s.'],
    ['Nagano', '1998', 'Snowboarding and women\'s ice hockey made their Olympic debuts there.'],
  ]),
  // 12-11 Fri
  G('Largest countries in Europe, by area, leaving out those that straddle Asia', 'Area', 'Largest', 'Smallest', 'CIA World Factbook; France counts its metropolitan territory only', [
    ['Ukraine', '603,550 sq km', 'The largest country lying entirely within Europe.'],
    ['France', '551,500 sq km', 'French Guiana alone, in South America, would add more than 80,000 square kilometers.'],
    ['Spain', '505,370 sq km', 'Includes the Balearic and Canary Islands and two cities on the North African coast.'],
    ['Sweden', '450,295 sq km', 'Forest covers close to 70 percent of it.'],
    ['Germany', '357,022 sq km', 'Borders nine countries, from Denmark in the north to Austria and Switzerland in the south.'],
    ['Finland', '338,145 sq km', 'Counts close to 188,000 lakes.'],
    ['Norway', '323,802 sq km', 'Stretches more than 1,700 kilometers from its southern tip to North Cape.'],
    ['Poland', '312,685 sq km', 'Slightly larger than Italy, which would come next.'],
  ]),
  // 12-12 Sat
  T('Landmark deals by tech buyers, by announced price', 'Deal value', 'Biggest', 'Smallest', "Announced deal values from each buyer's press release", [
    ['Microsoft buys Activision Blizzard', '$68.7B', 'Took 21 months to close after regulators on two continents challenged it.'],
    ['Elon Musk buys Twitter', '$44B', 'Musk tried to walk away from the deal before completing it in October 2022.'],
    ['IBM buys Red Hat', '$34B', 'Its biggest acquisition ever, for a company built on open-source software.'],
    ['Salesforce buys Slack', '$27.7B', 'Announced in December 2020, as remote work made chat apps essential.'],
    ['Microsoft buys LinkedIn', '$26.2B', 'Paid $196 a share in cash, a premium of about 50 percent.'],
    ['Facebook buys WhatsApp', '$19B', 'WhatsApp had about 55 employees when Facebook agreed to buy it.'],
    ['Amazon buys Whole Foods Market', '$13.7B', 'Amazon cut prices on bananas and avocados on its first day as owner.'],
    ['Google buys Motorola Mobility', '$12.5B', 'Google agreed to sell most of it to Lenovo less than two years after the deal closed.'],
  ]),
  // 12-13 SUN
  H('Order in which these famous bridges opened', 'Opened', 'Britannica bridge entries and bridge operator histories', [
    ['Ponte Vecchio (Florence)', '1345', 'Butchers once worked in its shops; the Medici replaced them with goldsmiths in 1593.'],
    ['Charles Bridge (Prague)', 'c. 1402', 'Its first stone was laid in 1357 under Emperor Charles IV.'],
    ['Rialto Bridge (Venice)', '1591', 'For centuries the only bridge across the Grand Canal.'],
    ['Brooklyn Bridge', '1883', 'Its designer, John Roebling, died of tetanus after an accident before construction began.'],
    ['Forth Bridge (Scotland)', '1890', 'A cantilever railway bridge built in the shadow of the Tay Bridge disaster.'],
    ['Tower Bridge (London)', '1894', 'Its roadway still lifts to let tall ships pass into the Pool of London.'],
    ['Sydney Harbour Bridge', '1932', 'Locals nicknamed it the Coathanger.'],
    ['Golden Gate Bridge', '1937', 'Its color, called International Orange, was chosen in part to stand out in fog.'],
    ['Oresund Bridge', '2000', 'Links Denmark and Sweden, handing over to a tunnel under the sea on the Danish side.'],
  ]),
  // 12-14 Mon
  G('Area of these Southeast Asian countries', 'Area', 'Largest', 'Smallest', 'CIA World Factbook', [
    ['Indonesia', '1,904,569 sq km', 'Spread across more than 17,000 islands.'],
    ['Myanmar', '676,578 sq km', 'Moved its capital from Yangon to Naypyidaw in 2005.'],
    ['Thailand', '513,120 sq km', 'The only country in the region never colonized by a European power.'],
    ['Vietnam', '331,210 sq km', 'Stretches more than 1,600 kilometers north to south but narrows to about 50 at its waist.'],
    ['Malaysia', '329,847 sq km', 'Split between the Malay Peninsula and the northern part of Borneo.'],
    ['Laos', '236,800 sq km', 'The only landlocked country in Southeast Asia.'],
    ['Timor-Leste', '14,874 sq km', 'Became fully independent in 2002, after a period of UN administration.'],
    ['Brunei', '5,765 sq km', 'Ruled by a sultan, it shares the island of Borneo with Malaysia and Indonesia.'],
  ]),
  // 12-15 Tue
  T('Domestic opening weekends of these blockbusters', 'Opening weekend', 'Biggest', 'Smallest', 'The Numbers, domestic opening weekend grosses, not adjusted for inflation', [
    ['Spider-Man: Brand New Day (2026)', '$360.1M', 'Opened July 31, 2026, taking the record Endgame had held for seven years.'],
    ['Avengers: Endgame (2019)', '$357.1M', 'The first film to take more than $300 million in a single weekend.'],
    ['Spider-Man: No Way Home (2021)', '$260.1M', 'Opened in December 2021, while many theaters were still recovering from pandemic closures.'],
    ['Avengers: Infinity War (2018)', '$257.7M', 'Set the record that Endgame broke a year later.'],
    ['Star Wars: The Force Awakens (2015)', '$248.0M', 'Brought Star Wars back to theaters ten years after the last prequel.'],
    ['Star Wars: The Last Jedi (2017)', '$220.0M', 'Written and directed by Rian Johnson.'],
    ['Deadpool & Wolverine (2024)', '$211.4M', 'The biggest opening ever for an R-rated film.'],
    ['Jurassic World (2015)', '$208.8M', 'Arrived 22 years after the original Jurassic Park.'],
  ]),
  // 12-16 Wed
  H('Order in which these paintings were completed', 'Completed', 'Collection records of the museums that hold them', [
    ['The Night Watch, Rembrandt', '1642', "Was trimmed on all four sides in 1715 to fit a wall in Amsterdam's town hall."],
    ['Las Meninas, Velazquez', '1656', 'The painter included himself at work, at a huge canvas on the left.'],
    ['The Hay Wain, Constable', '1821', 'Won a gold medal at the Paris Salon of 1824.'],
    ['Liberty Leading the People, Delacroix', '1830', 'Commemorates the July Revolution that toppled Charles X.'],
    ['The Starry Night, van Gogh', '1889', 'Painted from memory of the view from his asylum window at Saint-Remy.'],
    ['The Scream, Munch', '1893', 'Munch made several versions, in paint, pastel and print.'],
    ['American Gothic, Grant Wood', '1930', "The models were the artist's sister and his dentist."],
    ['Guernica, Picasso', '1937', 'Returned to Spain in 1981, after the restoration of democracy.'],
  ]),
  // 12-17 Thu
  G('Latitude of these northern US state capitals', 'Latitude', 'Northernmost', 'Southernmost', "Coordinates of each capital's city center, USGS Geographic Names Information System", [
    ['Juneau, Alaska', '58.30 N', 'Cannot be reached by road from the rest of North America.'],
    ['Olympia, Washington', '47.04 N', 'Sits at the southern tip of Puget Sound.'],
    ['Bismarck, North Dakota', '46.81 N', 'Named for the German chancellor in a bid to attract German investment in the railroad.'],
    ['Helena, Montana', '46.59 N', 'Founded as a gold camp called Last Chance Gulch.'],
    ['Saint Paul, Minnesota', '44.95 N', 'Faces its twin, Minneapolis, across the Mississippi River.'],
    ['Pierre, South Dakota', '44.37 N', 'One of the few state capitals not served by an Interstate highway.'],
    ['Augusta, Maine', '44.31 N', 'Lies upriver on the Kennebec, well inland from the coast.'],
    ['Montpelier, Vermont', '44.26 N', 'The least populous state capital in the country.'],
  ]),
  // 12-18 Fri
  T('Age at inauguration of these US presidents', 'Age', 'Oldest', 'Youngest', 'Birth and inauguration dates, National Archives', [
    ['Donald Trump (2025)', '78 yr, 220 d', 'Became the oldest president ever sworn in at his second inauguration.'],
    ['Joe Biden (2021)', '78 yr, 61 d', 'Was sworn in two months after turning 78.'],
    ['Ronald Reagan (1981)', '69 yr, 349 d', 'Took office a little over two weeks before his 70th birthday.'],
    ['William Henry Harrison (1841)', '68 yr, 23 d', 'Gave the longest inaugural address on record, then died a month later.'],
    ['James Buchanan (1857)', '65 yr, 315 d', 'The only president who never married.'],
    ['Dwight D. Eisenhower (1953)', '62 yr, 98 d', 'Had commanded the Allied invasion of Normandy nine years earlier.'],
    ['Abraham Lincoln (1861)', '52 yr, 20 d', 'Grew his famous beard after a girl wrote to suggest it.'],
    ['John F. Kennedy (1961)', '43 yr, 236 d', 'The youngest person ever elected president.'],
  ]),
  // 12-19 Sat
  H('Order in which these TV series premiered', 'Premiered', 'Network premiere dates', [
    ['I Love Lucy', 'Oct 1951', 'Pioneered filming a sitcom with three cameras in front of a live audience.'],
    ['The Twilight Zone', 'Oct 1959', 'Rod Serling wrote or adapted more than 90 of its 156 episodes.'],
    ['Star Trek', 'Sep 1966', 'Was canceled after three seasons, then found its audience in reruns.'],
    ['Sesame Street', 'Nov 1969', 'Was designed with researchers to help prepare preschoolers for school.'],
    ['Saturday Night Live', 'Oct 1975', 'George Carlin hosted the first episode.'],
    ['Seinfeld', 'Jul 1989', 'Its pilot aired under the title The Seinfeld Chronicles.'],
    ['The Simpsons', 'Dec 1989', 'The family first appeared in short cartoons on The Tracey Ullman Show.'],
    ['Friends', 'Sep 1994', 'Its theme song, by the Rembrandts, became a radio hit.'],
  ]),
  // 12-20 SUN
  G('Highest points of these US states', 'Elevation', 'Highest', 'Lowest', 'US Geological Survey, Elevations and Distances in the United States; Denali from the 2015 USGS survey', [
    ['Denali, also called Mount McKinley (Alaska)', '20,310 ft', 'The tallest peak in North America, rising about 18,000 feet from its base.'],
    ['Mount Whitney (California)', '14,494 ft', 'Stands less than 90 miles from Badwater Basin, the lowest point in North America.'],
    ['Mount Elbert (Colorado)', '14,433 ft', "The highest of Colorado's more than 50 peaks over 14,000 feet."],
    ['Mount Rainier (Washington)', '14,411 ft', 'An active volcano carrying more glacial ice than any other peak in the lower 48.'],
    ['Mauna Kea (Hawaii)', '13,796 ft', 'Measured from its base on the ocean floor, it is taller than Everest.'],
    ['Humphreys Peak (Arizona)', '12,633 ft', 'Part of the San Francisco Peaks, a volcanic range north of Flagstaff.'],
    ['Mount Hood (Oregon)', '11,239 ft', 'Its Timberline Lodge area offers skiing even in summer.'],
    ['Guadalupe Peak (Texas)', '8,749 ft', 'Rises above the Chihuahuan Desert near the New Mexico line.'],
    ['Mount Mitchell (North Carolina)', '6,684 ft', 'The highest point east of the Mississippi River.'],
  ]),
  // 12-21 Mon
  T('Career strikeouts by these retired pitchers', 'Strikeouts', 'Most', 'Fewest', 'Baseball-Reference career pitching leaders', [
    ['Nolan Ryan', '5,714', 'Also threw seven no-hitters, another career record.'],
    ['Randy Johnson', '4,875', 'Stood 6 feet 10, one of the tallest players in major league history.'],
    ['Roger Clemens', '4,672', 'Won a record seven Cy Young Awards.'],
    ['Steve Carlton', '4,136', 'Won 27 games in 1972 for a Phillies team that won only 59.'],
    ['Tom Seaver', '3,640', 'Once struck out ten batters in a row, in a 1970 game against San Diego.'],
    ['Greg Maddux', '3,371', 'Won four straight Cy Young Awards, from 1992 to 1995.'],
    ['Pedro Martinez', '3,154', "Posted a 1.74 ERA in 2000, at the height of baseball's offense boom."],
    ['Sandy Koufax', '2,396', 'Retired at 30 with an arthritic elbow, months after leading the league in wins, strikeouts and ERA.'],
  ]),
  // 12-22 Tue (Christmas songs moved here from 12-25: Dating 12-25 keys White Christmas to 1942)
  H('Order in which these Christmas songs were first released', 'Released', 'Original single and album release dates', [
    ['White Christmas, Bing Crosby', '1942', 'Introduced in the film Holiday Inn; Guinness lists it as the best-selling single ever.'],
    ['The Christmas Song, Nat King Cole', '1946', 'Mel Torme and Bob Wells wrote it on a hot summer day, trying to think cool thoughts.'],
    ['Jingle Bell Rock, Bobby Helms', '1957', "Came out the same autumn as Elvis Presley's first Christmas album."],
    ["Rockin' Around the Christmas Tree, Brenda Lee", '1958', 'Recorded when Brenda Lee was 13.'],
    ['Feliz Navidad, Jose Feliciano', '1970', 'Feliciano wrote it while missing his family in Puerto Rico.'],
    ['Wonderful Christmastime, Paul McCartney', '1979', 'McCartney recorded it alone, playing every part himself.'],
    ['Last Christmas, Wham!', '1984', "Kept from No. 1 in Britain by Band Aid's charity single."],
    ['All I Want for Christmas Is You, Mariah Carey', '1994', 'Finally reached No. 1 on the Hot 100 in 2019, 25 years after its release.'],
  ]),
  // 12-23 Wed
  G('Most populous US counties, 2020 census', 'Population', 'Most', 'Fewest', 'US Census Bureau, 2020 Census county populations', [
    ['Los Angeles County', '10,014,009', 'Has more residents than 40 of the 50 states.'],
    ['Cook County, Illinois', '5,275,541', 'Holds about four in ten Illinois residents.'],
    ['Harris County, Texas', '4,731,145', 'Home to Houston and more than 30 other cities.'],
    ['Maricopa County, Arizona', '4,420,568', 'Covers more ground than the whole state of New Jersey.'],
    ['San Diego County', '3,298,634', 'Runs along the Mexican border for about 60 miles.'],
    ['Orange County, California', '3,186,989', 'Home to Disneyland, which opened in Anaheim in 1955.'],
    ['Kings County (Brooklyn)', '2,736,074', "The most populous of New York City's five boroughs."],
    ['Miami-Dade County', '2,701,767', 'Home to more people than 15 of the 50 states.'],
  ]),
  // 12-24 Thu
  T('Time served by these former US senators', 'Senate service', 'Longest', 'Shortest', 'US Senate Historical Office service records', [
    ['Robert Byrd (West Virginia)', '51 yr, 176 d', 'Cast more than 18,000 roll call votes, a Senate record.'],
    ['Daniel Inouye (Hawaii)', '49 yr, 349 d', "Had served in the House since statehood before joining the Senate in 1963."],
    ['Patrick Leahy (Vermont)', '48 yr, 0 d', 'Elected at 34, he served exactly eight terms.'],
    ['Strom Thurmond (South Carolina)', '47 yr, 159 d', 'Was 100 years old when he left office in 2003.'],
    ['Ted Kennedy (Massachusetts)', '46 yr, 292 d', 'Won the seat his brother John vacated on becoming president.'],
    ['Orrin Hatch (Utah)', '42 yr, 0 d', 'A prolific songwriter, he wrote hundreds of religious and patriotic songs.'],
    ['Carl Hayden (Arizona)', '41 yr, 305 d', 'Served in the House from statehood in 1912 before his nearly 42 years in the Senate.'],
    ['Ted Stevens (Alaska)', '40 yr, 10 d', "Anchorage's international airport is named for him."],
  ]),
  // 12-25 Fri (national parks moved here from 12-22)
  H('Order in which these national parks were established', 'Established', 'National Park Service establishment dates', [
    ['Yellowstone', '1872', "Widely regarded as the world's first national park."],
    ['Mount Rainier', '1899', 'Its Paradise area once recorded more than 1,100 inches of snow in a single winter.'],
    ['Glacier', '1910', "Joins Canada's Waterton Lakes in an international peace park."],
    ['Rocky Mountain', '1915', 'Trail Ridge Road crosses it at more than 12,000 feet.'],
    ['Grand Canyon', '1919', 'Was a national monument for more than a decade before becoming a park.'],
    ['Grand Teton', '1929', 'John D. Rockefeller Jr. quietly bought up land in the valley below to add to it.'],
    ['Shenandoah', '1935', 'Its Skyline Drive runs the length of the park along the Blue Ridge.'],
    ['Everglades', '1947', 'The first national park set aside to protect an ecosystem rather than scenery.'],
  ]),
  // 12-26 Sat
  G('Smallest US states, by land area', 'Land area', 'Smallest', 'Largest', 'US Census Bureau state land area measurements', [
    ['Rhode Island', '1,034 sq mi', 'Narragansett Bay cuts so deep into it that water makes up about a third of its total area.'],
    ['Delaware', '1,949 sq mi', 'The first state to ratify the Constitution, in 1787.'],
    ['Connecticut', '4,842 sq mi', 'Its southern edge is the shore of Long Island Sound.'],
    ['Hawaii', '6,423 sq mi', 'Its Big Island alone is larger than all the other islands combined.'],
    ['New Jersey', '7,354 sq mi', 'The most densely populated state.'],
    ['Massachusetts', '7,800 sq mi', 'Cape Cod curls out from its southeastern corner like a flexed arm.'],
    ['New Hampshire', '8,953 sq mi', 'Its state motto is Live Free or Die.'],
    ['Vermont', '9,217 sq mi', 'The only New England state without an Atlantic coast.'],
  ]),
  // 12-27 SUN
  T('Worldwide box office of these Christmas films', 'Worldwide gross', 'Biggest', 'Smallest', 'Box Office Mojo worldwide grosses, including re-releases', [
    ['The Grinch (2018)', '$553.0M', "Illumination's animated version, narrated by Pharrell Williams."],
    ['Home Alone (1990)', '$476.7M', 'Held the record for a live-action comedy for more than two decades.'],
    ['Home Alone 2: Lost in New York (1992)', '$359.0M', "Moved the chaos from the Chicago suburbs to Manhattan's Plaza Hotel."],
    ['How the Grinch Stole Christmas (2000)', '$350.5M', 'Jim Carrey spent hours in prosthetic makeup for each day of filming.'],
    ['A Christmas Carol (2009)', '$325.3M', 'Robert Zemeckis made it with performance capture, with Jim Carrey as Scrooge.'],
    ['The Polar Express (2004)', '$315.2M', 'Tom Hanks played six roles, including the conductor and Santa.'],
    ['Love Actually (2003)', '$245.2M', 'Weaves together about ten stories in the weeks before Christmas.'],
    ['Elf (2003)', '$225.1M', 'Will Ferrell plays a human raised by elves at the North Pole.'],
    ['The Santa Clause (1994)', '$190.5M', "Tim Allen's first leading film role, made while Home Improvement was on the air."],
  ]),
  // 12-28 Mon
  H('Order in which these famous ships were launched', 'Launched', 'Royal Museums Greenwich, US Navy and shipbuilder records', [
    ['Mary Rose', '1511', "Henry VIII's warship sank in 1545 and was raised from the Solent in 1982."],
    ['HMS Victory', '1765', "Nelson's flagship at Trafalgar, still a commissioned ship of the Royal Navy."],
    ['USS Constitution', '1797', 'Nicknamed Old Ironsides; the oldest commissioned warship still afloat.'],
    ['Cutty Sark', '1869', 'A tea clipper launched the same month the Suez Canal opened.'],
    ['HMS Dreadnought', '1906', 'Its design made every earlier battleship obsolete and gave its name to a whole class.'],
    ['RMS Titanic', '1911', 'Launched in Belfast nearly a year before its maiden voyage.'],
    ['RMS Queen Mary', '1934', 'Now a hotel moored in Long Beach, California.'],
    ['Bismarck', '1939', 'Sank on its first operational sortie, in May 1941.'],
  ]),
  // 12-29 Tue
  G('Largest countries in Central America and the Caribbean, by area', 'Area', 'Largest', 'Smallest', 'CIA World Factbook', [
    ['Nicaragua', '130,370 sq km', 'Home to Lake Nicaragua, the largest lake in Central America.'],
    ['Honduras', '112,090 sq km', 'Faces the Caribbean and, through the Gulf of Fonseca, the Pacific.'],
    ['Cuba', '110,860 sq km', 'The largest island in the Caribbean.'],
    ['Guatemala', '108,889 sq km', 'Home to Tikal, one of the largest Maya cities.'],
    ['Panama', '75,420 sq km', 'Joins Central America to South America.'],
    ['Costa Rica', '51,100 sq km', 'Abolished its army in 1948.'],
    ['Dominican Republic', '48,670 sq km', 'Shares the island of Hispaniola with Haiti.'],
    ['Haiti', '27,750 sq km', 'Won its independence from France in 1804.'],
  ]),
  // 12-30 Wed
  T('Visitors in 2024 at these famous art museums', 'Visitors', 'Most', 'Fewest', 'The Art Newspaper annual visitor survey, 2024 attendance', [
    ['Louvre (Paris)', '8.74M', 'Home to the Mona Lisa, which it plans to give a room of its own.'],
    ['Vatican Museums', '6.83M', "The usual route ends in the Sistine Chapel, beneath Michelangelo's ceiling."],
    ['British Museum (London)', '6.48M', 'Admission to its permanent collection is free.'],
    ['Metropolitan Museum of Art (New York)', '5.73M', 'Hosts the Met Gala, the fashion fundraiser held each May.'],
    ['Tate Modern (London)', '4.60M', 'Occupies a former power station on the Thames.'],
    ['National Gallery of Art (Washington)', '3.94M', 'Founded with the collection of the financier Andrew Mellon.'],
    ["Musee d'Orsay (Paris)", '3.75M', "Housed in a railway station built for the 1900 world's fair."],
    ['Prado (Madrid)', '3.46M', 'Opened in 1819 with paintings from the Spanish royal collection.'],
  ]),
  // 12-31 Thu
  H('Order in which these magazines first published', 'First issue', 'Publisher histories', [
    ['National Geographic', '1888', 'Began as a scholarly journal for members of the National Geographic Society.'],
    ['Vogue', '1892', 'Started as a weekly society paper in New York.'],
    ["Reader's Digest", '1922', 'Founded by a couple who condensed articles from other magazines.'],
    ['Time', '1923', 'Founded by two Yale classmates, Henry Luce and Briton Hadden.'],
    ['The New Yorker', '1925', 'Its monocled dandy, Eustace Tilley, appeared on the first cover.'],
    ['Playboy', '1953', 'Its first issue carried no date, because Hugh Hefner was unsure there would be a second.'],
    ['Sports Illustrated', '1954', "Its first cover showed a night game at Milwaukee's County Stadium."],
    ['Rolling Stone', '1967', 'Launched in San Francisco with John Lennon on its first cover.'],
  ]),
];
