// Niche facts: MUSICIANS (the Saturday universe). A fixed pool of famous acts.
// There is deliberately NO debut-decade field: most careers straddle decades
// and any single year invites a wrongful rejection, which is the one failure
// this game must not have. The attributes here are all crisp memberships.
//
// FIELD RULES:
//   band  a band or group (absent = a solo act).
//   uk    a British act (Fleetwood Mac's Anglo-American lineup counts, the
//         generous reading; Irish and Australian acts do not).
//   us    an American act (a Puerto Rican act counts).
//   aoty  won the Grammy Album of the Year as the credited main artist
//         (through the 2025 ceremony).
//   hall  inducted into the Rock & Roll Hall of Fame (through the 2025
//         class; a Musical Excellence induction counts, the generous reading).
//   fem   a solo female artist.
//   nb    a solo act who is neither a solo female nor a solo male artist,
//         by the artist's own public statement. Only this flag keeps the
//         'male' attribute (a solo act that is neither fem nor nb) honest;
//         without it a non-binary act would be judged male by omission.
//   rap   a hip-hop or rap act. Generous at the pop edge (Post Malone, Doja
//         Cat, Lizzo and Bad Bunny are in), because a false accept costs a
//         shrug and a false reject costs a guess.
//   ctry  a country act, on the same generous reading (Taylor Swift, who
//         began in country, is in; southern rock is not).
//   a     typed aliases, lowercase.
export const MUSICIANS = [
  // ── legacy rock & pop ──
  { t: 'The Beatles', a: ['beatles'], band: 1, uk: 1, aoty: 1, hall: 1 },
  { t: 'The Rolling Stones', a: ['rolling stones'], band: 1, uk: 1, hall: 1 },
  { t: 'Led Zeppelin', band: 1, uk: 1, hall: 1 },
  { t: 'Pink Floyd', band: 1, uk: 1, hall: 1 },
  { t: 'Queen', band: 1, uk: 1, hall: 1 },
  { t: 'The Who', band: 1, uk: 1, hall: 1 },
  { t: 'David Bowie', uk: 1, hall: 1 },
  { t: 'Elton John', uk: 1, hall: 1 },
  { t: 'Elvis Presley', a: ['elvis'], us: 1, hall: 1 },
  { t: 'Bob Dylan', us: 1, aoty: 1, hall: 1 },
  { t: 'Johnny Cash', us: 1, hall: 1, ctry: 1 },
  { t: 'The Beach Boys', a: ['beach boys'], band: 1, us: 1, hall: 1 },
  { t: 'Jimi Hendrix', us: 1, hall: 1 },
  { t: 'The Doors', band: 1, us: 1, hall: 1 },
  { t: 'Creedence Clearwater Revival', a: ['ccr', 'creedence'], band: 1, us: 1, hall: 1 },
  { t: 'Simon & Garfunkel', a: ['simon and garfunkel'], band: 1, us: 1, aoty: 1, hall: 1 },
  { t: 'Paul Simon', us: 1, aoty: 1, hall: 1 },
  { t: 'Paul McCartney', uk: 1, hall: 1 },
  { t: 'John Lennon', uk: 1, hall: 1 },
  { t: 'Frank Sinatra', us: 1, aoty: 1 },
  { t: 'Aretha Franklin', us: 1, hall: 1, fem: 1 },
  { t: 'Ray Charles', us: 1, aoty: 1, hall: 1 },
  { t: 'Stevie Wonder', us: 1, aoty: 1, hall: 1 },
  { t: 'Marvin Gaye', us: 1, hall: 1 },
  { t: 'The Eagles', a: ['eagles'], band: 1, us: 1, hall: 1 },
  { t: 'Fleetwood Mac', band: 1, uk: 1, us: 1, aoty: 1, hall: 1 },
  { t: 'ABBA', a: ['abba'], band: 1, hall: 1 },
  { t: 'Bee Gees', a: ['the bee gees'], band: 1, uk: 1, aoty: 1, hall: 1 },
  { t: 'Billy Joel', us: 1, aoty: 1, hall: 1 },
  { t: 'Bruce Springsteen', us: 1, hall: 1 },
  { t: 'Aerosmith', band: 1, us: 1, hall: 1 },
  { t: 'KISS', a: ['kiss'], band: 1, us: 1, hall: 1 },
  { t: 'AC/DC', a: ['acdc', 'ac dc'], band: 1, hall: 1 },
  { t: 'Black Sabbath', band: 1, uk: 1, hall: 1 },
  { t: 'Ozzy Osbourne', a: ['ozzy'], uk: 1, hall: 1 },
  { t: 'Rush', band: 1, hall: 1 },
  { t: 'Journey', band: 1, us: 1, hall: 1 },
  { t: 'Van Halen', band: 1, us: 1, hall: 1 },
  { t: 'The Police', band: 1, uk: 1, hall: 1 },
  { t: 'Blondie', band: 1, us: 1, hall: 1 },
  { t: 'Genesis', band: 1, uk: 1, hall: 1 },
  { t: 'Phil Collins', uk: 1, aoty: 1 },
  { t: 'Dire Straits', band: 1, uk: 1, hall: 1 },
  { t: 'ZZ Top', band: 1, us: 1, hall: 1 },
  { t: 'Lynyrd Skynyrd', band: 1, us: 1, hall: 1 },
  { t: 'Heart', band: 1, us: 1, hall: 1 },
  { t: 'Toto', band: 1, us: 1, aoty: 1 },
  { t: 'Chicago', band: 1, us: 1, hall: 1 },
  { t: 'Carole King', us: 1, aoty: 1, hall: 1, fem: 1 },
  { t: 'Dolly Parton', us: 1, hall: 1, fem: 1, ctry: 1 },
  { t: 'Willie Nelson', us: 1, hall: 1, ctry: 1 },
  { t: 'Tina Turner', us: 1, hall: 1, fem: 1 },
  { t: 'Cher', us: 1, hall: 1, fem: 1 },
  { t: 'Diana Ross', us: 1, fem: 1 },
  { t: 'The Supremes', band: 1, us: 1, hall: 1 },
  { t: 'The Temptations', band: 1, us: 1, hall: 1 },
  { t: 'Earth, Wind & Fire', a: ['earth wind and fire'], band: 1, us: 1, hall: 1 },
  { t: 'Bob Marley', hall: 1 },
  // ── 80s pop & rock ──
  { t: 'Michael Jackson', us: 1, aoty: 1, hall: 1 },
  { t: 'Madonna', us: 1, hall: 1, fem: 1 },
  { t: 'Prince', us: 1, hall: 1 },
  { t: 'Whitney Houston', us: 1, aoty: 1, hall: 1, fem: 1 },
  { t: 'Janet Jackson', us: 1, hall: 1, fem: 1 },
  { t: 'Lionel Richie', us: 1, aoty: 1, hall: 1 },
  { t: 'George Michael', uk: 1, aoty: 1, hall: 1 },
  { t: 'U2', band: 1, aoty: 1, hall: 1 },
  { t: 'R.E.M.', a: ['rem'], band: 1, us: 1, hall: 1 },
  { t: 'Bon Jovi', band: 1, us: 1, hall: 1 },
  { t: 'Def Leppard', band: 1, uk: 1, hall: 1 },
  { t: 'Metallica', band: 1, us: 1, hall: 1 },
  { t: 'Guns N\' Roses', a: ['guns n roses', 'gnr'], band: 1, us: 1, hall: 1 },
  { t: 'Iron Maiden', band: 1, uk: 1 },
  { t: 'Duran Duran', band: 1, uk: 1, hall: 1 },
  { t: 'Depeche Mode', band: 1, uk: 1, hall: 1 },
  { t: 'The Cure', band: 1, uk: 1, hall: 1 },
  { t: 'Eurythmics', band: 1, uk: 1, hall: 1 },
  { t: 'Cyndi Lauper', us: 1, hall: 1, fem: 1 },
  { t: 'Bonnie Raitt', us: 1, aoty: 1, hall: 1, fem: 1 },
  { t: 'Bryan Adams' },
  { t: 'Eric Clapton', uk: 1, aoty: 1, hall: 1 },
  { t: 'Sting', uk: 1 },
  { t: 'Billy Idol', uk: 1 },
  { t: 'Pat Benatar', us: 1, hall: 1, fem: 1 },
  { t: 'Run-DMC', a: ['run dmc'], band: 1, us: 1, hall: 1, rap: 1 },
  { t: 'Beastie Boys', band: 1, us: 1, hall: 1, rap: 1 },
  { t: 'LL Cool J', us: 1, hall: 1, rap: 1 },
  { t: 'Public Enemy', band: 1, us: 1, hall: 1, rap: 1 },
  // ── 90s ──
  { t: 'Nirvana', band: 1, us: 1, hall: 1 },
  { t: 'Pearl Jam', band: 1, us: 1, hall: 1 },
  { t: 'Soundgarden', band: 1, us: 1, hall: 1 },
  { t: 'Red Hot Chili Peppers', a: ['rhcp'], band: 1, us: 1, hall: 1 },
  { t: 'Green Day', band: 1, us: 1, hall: 1 },
  { t: 'Radiohead', band: 1, uk: 1, hall: 1 },
  { t: 'Oasis', band: 1, uk: 1 },
  { t: 'Foo Fighters', band: 1, us: 1, hall: 1 },
  { t: 'Weezer', band: 1, us: 1 },
  { t: 'Blink-182', a: ['blink 182'], band: 1, us: 1 },
  { t: 'No Doubt', band: 1, us: 1 },
  { t: 'Alanis Morissette', aoty: 1, fem: 1 },
  { t: 'Celine Dion', aoty: 1, fem: 1 },
  { t: 'Mariah Carey', us: 1, fem: 1 },
  { t: 'Shania Twain', fem: 1, ctry: 1 },
  { t: 'Garth Brooks', us: 1, ctry: 1 },
  { t: 'Lauryn Hill', us: 1, aoty: 1, fem: 1, rap: 1 },
  { t: 'Tupac Shakur', a: ['tupac', '2pac'], us: 1, hall: 1, rap: 1 },
  { t: 'The Notorious B.I.G.', a: ['notorious big', 'biggie', 'biggie smalls'], us: 1, hall: 1, rap: 1 },
  { t: 'Snoop Dogg', us: 1, rap: 1 },
  { t: 'Jay-Z', a: ['jay z'], us: 1, hall: 1, rap: 1 },
  { t: 'Missy Elliott', us: 1, hall: 1, fem: 1, rap: 1 },
  { t: 'OutKast', a: ['outkast'], band: 1, us: 1, aoty: 1, hall: 1, rap: 1 },
  { t: 'Eminem', us: 1, hall: 1, rap: 1 },
  { t: 'Dr. Dre', a: ['dr dre'], us: 1, rap: 1 },
  { t: 'Backstreet Boys', band: 1, us: 1 },
  { t: 'NSYNC', a: ['n sync', '*nsync'], band: 1, us: 1 },
  { t: 'Spice Girls', band: 1, uk: 1 },
  { t: 'Britney Spears', us: 1, fem: 1 },
  { t: 'Christina Aguilera', us: 1, fem: 1 },
  { t: 'Destiny\'s Child', a: ['destinys child'], band: 1, us: 1 },
  { t: 'Santana', band: 1, us: 1, aoty: 1, hall: 1 },
  { t: 'Dave Matthews Band', band: 1, us: 1, hall: 1 },
  { t: 'The White Stripes', a: ['white stripes'], band: 1, us: 1, hall: 1 },
  // ── 2000s to now ──
  { t: 'Coldplay', band: 1, uk: 1 },
  { t: 'Linkin Park', band: 1, us: 1 },
  { t: 'Maroon 5', band: 1, us: 1 },
  { t: 'The Killers', band: 1, us: 1 },
  { t: 'Imagine Dragons', band: 1, us: 1 },
  { t: 'Twenty One Pilots', a: ['twenty one pilots', '21 pilots'], band: 1, us: 1 },
  { t: 'OneRepublic', a: ['one republic'], band: 1, us: 1 },
  { t: 'Nickelback', band: 1 },
  { t: 'Norah Jones', us: 1, aoty: 1, fem: 1 },
  { t: 'Amy Winehouse', uk: 1, fem: 1 },
  { t: 'Adele', uk: 1, aoty: 1, fem: 1 },
  { t: 'Ed Sheeran', uk: 1 },
  { t: 'Sam Smith', uk: 1, nb: 1 },
  { t: 'One Direction', band: 1, uk: 1 },
  { t: 'Harry Styles', uk: 1, aoty: 1 },
  { t: 'Dua Lipa', uk: 1, fem: 1 },
  { t: 'Beyoncé', a: ['beyonce'], us: 1, aoty: 1, fem: 1 },
  { t: 'Rihanna', fem: 1 },
  { t: 'Lady Gaga', us: 1, fem: 1 },
  { t: 'Katy Perry', us: 1, fem: 1 },
  { t: 'Taylor Swift', us: 1, aoty: 1, fem: 1, ctry: 1 },
  { t: 'Ariana Grande', us: 1, fem: 1 },
  { t: 'Billie Eilish', us: 1, aoty: 1, fem: 1 },
  { t: 'Olivia Rodrigo', us: 1, fem: 1 },
  { t: 'Miley Cyrus', us: 1, fem: 1 },
  { t: 'Selena Gomez', us: 1, fem: 1 },
  { t: 'Alicia Keys', us: 1, fem: 1 },
  { t: 'SZA', a: ['sza'], us: 1, fem: 1 },
  { t: 'Lizzo', us: 1, fem: 1, rap: 1 },
  { t: 'Cardi B', us: 1, fem: 1, rap: 1 },
  { t: 'Nicki Minaj', us: 1, fem: 1, rap: 1 },
  { t: 'Kacey Musgraves', us: 1, aoty: 1, fem: 1, ctry: 1 },
  { t: 'Carrie Underwood', us: 1, fem: 1, ctry: 1 },
  { t: 'Kelly Clarkson', us: 1, fem: 1 },
  { t: 'Kanye West', a: ['ye'], us: 1, rap: 1 },
  { t: '50 Cent', us: 1, rap: 1 },
  { t: 'Drake', rap: 1 },
  { t: 'The Weeknd', a: ['weeknd'] },
  { t: 'Justin Bieber' },
  { t: 'Justin Timberlake', us: 1 },
  { t: 'Usher', us: 1 },
  { t: 'Bruno Mars', us: 1, aoty: 1 },
  { t: 'Post Malone', us: 1, rap: 1 },
  { t: 'Kendrick Lamar', us: 1, rap: 1 },
  { t: 'Travis Scott', us: 1, rap: 1 },
  { t: 'Bad Bunny', us: 1, rap: 1 },
  { t: 'Shakira', fem: 1 },
  { t: 'BTS', a: ['bts'], band: 1 },
  { t: 'Daft Punk', band: 1, aoty: 1 },
  { t: 'John Legend', us: 1 },
  { t: 'Morgan Wallen', us: 1, ctry: 1 },
  { t: 'Luke Combs', us: 1, ctry: 1 },
  { t: 'Zach Bryan', us: 1, ctry: 1 },
  { t: 'Chappell Roan', us: 1, fem: 1 },
  { t: 'Sabrina Carpenter', us: 1, fem: 1 },
  { t: 'Doja Cat', us: 1, fem: 1, rap: 1 },
  { t: 'Hozier' },
  { t: 'Lorde', fem: 1 },
  { t: 'Sia', fem: 1 },
];

// ── named memberships ────────────────────────────────────────────────────────
// Published, closed rosters, kept as lists rather than per-row flags so each
// is auditable at a glance. scripts/verify-niche.mjs asserts both the size of
// every list and that every name in it resolves to a member, so a typo cannot
// quietly shrink an attribute.

// Acts that have performed in a Super Bowl halftime show, through Super Bowl
// LX (February 2026). Generous: a billed guest counts, not only the
// headliner, so Missy Elliott (2015), Nicki Minaj (2012) and 50 Cent (2022)
// are in. National-anthem performances are NOT halftime and do not count.
export const HALFTIME = new Set(['Michael Jackson', 'Diana Ross', 'ZZ Top', 'The Temptations', 'Stevie Wonder', 'Phil Collins', 'Christina Aguilera', 'Aerosmith', 'NSYNC', 'Britney Spears', 'U2', 'Shania Twain', 'No Doubt', 'Sting', 'Janet Jackson', 'Justin Timberlake', 'Paul McCartney', 'The Rolling Stones', 'Prince', 'Bruce Springsteen', 'The Who', 'Usher', 'Madonna', 'Nicki Minaj', 'Beyoncé', "Destiny's Child", 'Bruno Mars', 'Red Hot Chili Peppers', 'Katy Perry', 'Missy Elliott', 'Coldplay', 'Lady Gaga', 'Maroon 5', 'Travis Scott', 'Shakira', 'Bad Bunny', 'The Weeknd', 'Dr. Dre', 'Snoop Dogg', 'Eminem', 'Kendrick Lamar', '50 Cent', 'Rihanna', 'SZA']);

// Grammy Record of the Year winners, through the 2025 ceremony. Generous: a
// credited featured artist counts, which is how Bruno Mars is in for Uptown
// Funk and Ray Charles for a duet.
export const ROTY = new Set(['Frank Sinatra', 'Simon & Garfunkel', 'Carole King', 'The Eagles', 'Billy Joel', 'Toto', 'Michael Jackson', 'Tina Turner', 'Paul Simon', 'Phil Collins', 'Eric Clapton', 'Whitney Houston', 'Celine Dion', 'Santana', 'U2', 'Norah Jones', 'Coldplay', 'Ray Charles', 'Green Day', 'Amy Winehouse', 'Adele', 'Daft Punk', 'Sam Smith', 'Bruno Mars', 'Billie Eilish', 'Lizzo', 'Miley Cyrus', 'Kendrick Lamar']);

// Grammy Best New Artist winners, through the 2025 ceremony.
export const BEST_NEW = new Set(['The Beatles', 'Cyndi Lauper', 'Mariah Carey', 'Lauryn Hill', 'Christina Aguilera', 'Alicia Keys', 'Norah Jones', 'Maroon 5', 'John Legend', 'Carrie Underwood', 'Amy Winehouse', 'Adele', 'Sam Smith', 'Dua Lipa', 'Billie Eilish', 'Olivia Rodrigo', 'Chappell Roan']);
