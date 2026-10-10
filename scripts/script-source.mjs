// Authored source for Script, the daily film and television gauntlet.
// Built into app/script/{questions,puzzles}.js by scripts/gen-mcq.mjs.
//
//   c  lane, cycling in LANES order across every block of five
//   t  tier, 1 (gimme) to 5 (expert), five questions per tier per day
//   q  the question
//   a  the TRUE answer, always authored here in first position
//   d  three distractors
//
// The correct answer's POSITION is never authored. The generator lays each day
// out on a balanced no-3-run column plan derived from the day number, so the
// bank cannot drift into a column bias. Never move an answer into `d` or a
// distractor into `a` to "fix" a pattern.
//
// EVERY FACT IS FROZEN. Film and television rot in a specific way: a cast
// changes, a series is renewed or cancelled, a gross is overtaken, a record
// falls. So nothing here asks who currently plays anything, what is currently
// the highest grossing or longest running, or how any unfinished thing ends. A
// superlative worth asking is pinned in the stem ("the highest grossing film of
// the 1990s", "for years the most watched"), and casting questions are asked
// about performances already given.
// RECYCLE BEFORE YOU AUTHOR (owner, 2026-10-09). Hard-tier slots are filled
// first from questions nobody has ever answered on a played day:
//   node scripts/trivia-recycle-pool.mjs script --tier 5
// prints them in this file's shape with `from: '<game>:<id>'` filled in. Same
// lane, same tier, same stem and answer. Rules: scripts/trivia-recycle.mjs.
export const LANES = ['Movies', 'Television', 'Actors & Directors', 'Awards & Box Office', 'Behind the Scenes'];

export const DAYS = [

// ── Day 1 ──────────────────────────────────────────────────────────────────
[
{ c: 'Movies', t: 1, q: 'Which 1997 film ends with a passenger liner sinking after striking an iceberg?', a: 'Titanic', d: ['The Poseidon Adventure', 'Life of Pi', 'Master and Commander'] },
{ c: 'Television', t: 1, q: 'Which sitcom was set in a Boston bar where everybody knows your name?', a: 'Cheers', d: ['Frasier', 'Taxi', 'Night Court'] },
{ c: 'Actors & Directors', t: 1, q: 'Which director made Jaws, E.T. and Jurassic Park?', a: 'Steven Spielberg', d: ['George Lucas', 'James Cameron', 'Ridley Scott'] },
{ c: 'Awards & Box Office', t: 1, q: 'What is the statuette handed out at the Academy Awards commonly called?', a: 'The Oscar', d: ['The Emmy', 'The Tony', 'The Palme'] },
{ c: 'Behind the Scenes', t: 1, q: 'Which Mario Puzo novel did Francis Ford Coppola adapt into a 1972 film?', a: 'The Godfather', d: ['Goodfellas', 'Scarface', 'The Untouchables'] },

{ c: 'Movies', t: 2, q: 'In The Matrix, which color of pill does Neo swallow?', a: 'Red', d: ['Blue', 'Green', 'White'] },
{ c: 'Television', t: 2, q: 'Which HBO drama follows a New Jersey mob boss who starts seeing a psychiatrist?', a: 'The Sopranos', d: ['The Wire', 'Boardwalk Empire', 'Oz'] },
{ c: 'Actors & Directors', t: 2, q: 'Which actor played the title role in Forrest Gump?', a: 'Tom Hanks', d: ['Kevin Costner', 'Bill Paxton', 'Gary Sinise'] },
{ c: 'Awards & Box Office', t: 2, q: "Which 1994 film took the Palme d'Or at Cannes?", a: 'Pulp Fiction', d: ['Forrest Gump', 'The Shawshank Redemption', 'Four Weddings and a Funeral'] },
{ c: 'Behind the Scenes', t: 2, q: 'What nickname did the crew of Jaws give the malfunctioning mechanical shark?', a: 'Bruce', d: ['Clyde', 'Sheila', 'Monty'] },

{ c: 'Movies', t: 3, q: 'In Citizen Kane, what does Rosebud turn out to be?', a: 'A sled', d: ['A racehorse', 'A yacht', 'A nightclub'] },
{ c: 'Television', t: 3, q: 'Which 1983 series finale was for years the most watched scripted episode in American television history?', a: 'M*A*S*H', d: ['Cheers', 'Seinfeld', 'Friends'] },
{ c: 'Actors & Directors', t: 3, q: 'Which director made Vertigo, Rear Window and The Birds?', a: 'Alfred Hitchcock', d: ['Billy Wilder', 'Otto Preminger', 'Fritz Lang'] },
{ c: 'Awards & Box Office', t: 3, q: 'Which film won Outstanding Picture at the very first Academy Awards?', a: 'Wings', d: ['The Crowd', 'The Jazz Singer', 'The Last Command'] },
{ c: 'Behind the Scenes', t: 3, q: 'Which film used chocolate syrup for blood in a shower scene that took a week to shoot?', a: 'Psycho', d: ['Carrie', 'The Shining', 'Frenzy'] },

{ c: 'Movies', t: 4, q: 'In Blade Runner, what is the test used to identify replicants called?', a: 'Voight-Kampff', d: ['Turing-Rosen', 'Kessler-Baty', 'Tyrell-Sebastian'] },
{ c: 'Television', t: 4, q: 'Which anthology series opened with narration about a dimension beyond that which is known to man?', a: 'The Twilight Zone', d: ['The Outer Limits', 'Tales from the Crypt', 'Night Gallery'] },
{ c: 'Actors & Directors', t: 4, q: 'Which performer won four Academy Awards for Best Actress, more than anyone else?', a: 'Katharine Hepburn', d: ['Meryl Streep', 'Bette Davis', 'Ingrid Bergman'] },
{ c: 'Awards & Box Office', t: 4, q: 'Which film swept picture, director, actor, actress and screenplay at the 1992 ceremony?', a: 'The Silence of the Lambs', d: ['Unforgiven', "Schindler's List", 'Rain Man'] },
{ c: 'Behind the Scenes', t: 4, q: "Which film shot under the fake working title 'Blue Harvest' to keep fans away from the set?", a: 'Return of the Jedi', d: ['The Empire Strikes Back', 'Raiders of the Lost Ark', 'E.T. the Extra-Terrestrial'] },

{ c: 'Movies', t: 5, q: 'Which instrument plays the famous theme of The Third Man?', a: 'The zither', d: ['The harpsichord', 'The mandolin', 'The accordion'] },
{ c: 'Television', t: 5, q: 'What was the advertising agency at the center of the first season of Mad Men called?', a: 'Sterling Cooper', d: ['Cooper Draper', 'Pryce Holloway', 'Hobart and Olson'] },
{ c: 'Actors & Directors', t: 5, q: 'Which actor directed The Night of the Hunter and never directed another film?', a: 'Charles Laughton', d: ['Herk Harvey', 'Leonard Kastle', 'James William Guercio'] },
{ c: 'Awards & Box Office', t: 5, q: 'Who was the first person to refuse an Academy Award, turning down a screenplay prize in 1936?', a: 'Dudley Nichols', d: ['George C. Scott', 'Marlon Brando', 'Katharine Hepburn'] },
{ c: 'Behind the Scenes', t: 5, q: 'Which film shot its crop duster sequence in California farmland standing in for rural Indiana?', a: 'North by Northwest', d: ['The Birds', 'Badlands', 'Days of Heaven'] },
],

// ── Day 2 ──────────────────────────────────────────────────────────────────
[
{ c: 'Movies', t: 1, q: 'In which film series does a boy learn he is a wizard and enroll at Hogwarts?', a: 'Harry Potter', d: ['The Chronicles of Narnia', 'Percy Jackson', 'His Dark Materials'] },
{ c: 'Television', t: 1, q: 'Which animated family lives in Springfield with a father named Homer?', a: 'The Simpsons', d: ['Family Guy', 'King of the Hill', "Bob's Burgers"] },
{ c: 'Actors & Directors', t: 1, q: 'Which actor introduced Iron Man to the Marvel Cinematic Universe in 2008?', a: 'Robert Downey Jr.', d: ['Chris Evans', 'Mark Ruffalo', 'Jeremy Renner'] },
{ c: 'Awards & Box Office', t: 1, q: 'The Emmy Awards honor achievement in which medium?', a: 'Television', d: ['Film', 'Theater', 'Radio'] },
{ c: 'Behind the Scenes', t: 1, q: "Which 1994 Disney animated feature has long been described as drawing on Shakespeare's Hamlet?", a: 'The Lion King', d: ['Aladdin', 'Pocahontas', 'Mulan'] },

{ c: 'Movies', t: 2, q: 'In Back to the Future, which car is converted into a time machine?', a: 'A DeLorean', d: ['A Ford Mustang', 'A Pontiac Firebird', 'A Chevrolet Camaro'] },
{ c: 'Television', t: 2, q: 'In Breaking Bad, which subject does Walter White teach before he turns to crime?', a: 'Chemistry', d: ['Physics', 'Biology', 'Mathematics'] },
{ c: 'Actors & Directors', t: 2, q: 'Which director made Reservoir Dogs, Kill Bill and Inglourious Basterds?', a: 'Quentin Tarantino', d: ['Robert Rodriguez', 'Guy Ritchie', 'David Fincher'] },
{ c: 'Awards & Box Office', t: 2, q: 'Which film became the first in a language other than English to win Best Picture?', a: 'Parasite', d: ['Roma', 'Amour', 'Crouching Tiger, Hidden Dragon'] },
{ c: 'Behind the Scenes', t: 2, q: "Which film's star improvised the line 'Here's Johnny!', borrowing a talk show introduction?", a: 'The Shining', d: ['Misery', 'The Exorcist', 'Cape Fear'] },

{ c: 'Movies', t: 3, q: 'Apocalypse Now is loosely based on which Joseph Conrad novella?', a: 'Heart of Darkness', d: ['Lord Jim', 'Nostromo', 'The Secret Agent'] },
{ c: 'Television', t: 3, q: 'Which Baltimore institution is the focus of the fourth season of The Wire?', a: 'The public schools', d: ['The docks', 'City Hall', 'The newspaper'] },
{ c: 'Actors & Directors', t: 3, q: 'Which Swedish director made The Seventh Seal and Wild Strawberries?', a: 'Ingmar Bergman', d: ['Lasse Hallstrom', 'Bo Widerberg', 'Victor Sjostrom'] },
{ c: 'Awards & Box Office', t: 3, q: 'Which actor won Best Actor at consecutive ceremonies in 1938 and 1939?', a: 'Spencer Tracy', d: ['Clark Gable', 'James Cagney', 'Gary Cooper'] },
{ c: 'Behind the Scenes', t: 3, q: 'Which 1995 release was the first feature made entirely with computer animation?', a: 'Toy Story', d: ['Tron', "A Bug's Life", 'Antz'] },

{ c: 'Movies', t: 4, q: "In 2001: A Space Odyssey, what is the ship's computer called?", a: 'HAL 9000', d: ['MU-TH-UR', 'Proteus IV', 'Colossus'] },
{ c: 'Television', t: 4, q: 'Which 1967 British series stranded a resigned agent in a place known only as the Village?', a: 'The Prisoner', d: ['Danger Man', 'The Avengers', 'Callan'] },
{ c: 'Actors & Directors', t: 4, q: 'Which actress played the young runaway Iris in Taxi Driver?', a: 'Jodie Foster', d: ['Sissy Spacek', 'Brooke Shields', "Tatum O'Neal"] },
{ c: 'Awards & Box Office', t: 4, q: 'Which 1977 film took eleven Academy Award nominations and won none, a futility record it shares with The Color Purple?', a: 'The Turning Point', d: ['Julia', 'The Goodbye Girl', 'Star Wars'] },
{ c: 'Behind the Scenes', t: 4, q: "What did the crew of The Godfather use for the severed horse's head?", a: 'A real head from a dog food plant', d: ['A latex cast', 'A taxidermy mount', 'A carved wooden prop'] },

{ c: 'Movies', t: 5, q: 'In Casablanca, what are the papers everyone is chasing called?', a: 'Letters of transit', d: ['Exit visas', 'Travel warrants', 'Safe conducts'] },
{ c: 'Television', t: 5, q: 'What is the hotel in Twin Peaks called?', a: 'The Great Northern', d: ['The Silver Mustang', 'The Blue Pine', 'The Fat Trout'] },
{ c: 'Actors & Directors', t: 5, q: 'Which pseudonym did the Directors Guild of America assign, from 1969 until 2000, to films whose directors disowned them?', a: 'Alan Smithee', d: ['Thomas Lee', 'Harry Kirkpatrick', 'George Spelvin'] },
{ c: 'Awards & Box Office', t: 5, q: 'Who has won more competitive Academy Awards than any other individual, with twenty-two?', a: 'Walt Disney', d: ['John Williams', 'Alfred Newman', 'Cedric Gibbons'] },
{ c: 'Behind the Scenes', t: 5, q: "Which 1980 film's cost overruns are credited with helping end United Artists as an independent studio?", a: "Heaven's Gate", d: ['Raise the Titanic', 'Popeye', 'Inchon'] },
],

// ── Day 3 ──────────────────────────────────────────────────────────────────
[
{ c: 'Movies', t: 1, q: 'In the original Star Wars trilogy, who turns out to be the father of Luke Skywalker?', a: 'Darth Vader', d: ['Obi-Wan Kenobi', 'Emperor Palpatine', 'Han Solo'] },
{ c: 'Television', t: 1, q: 'Which sitcom followed six twenty-somethings in New York, several of them sharing an apartment with a purple door?', a: 'Friends', d: ['Seinfeld', 'How I Met Your Mother', 'Will & Grace'] },
{ c: 'Actors & Directors', t: 1, q: "Which actor delivers the line 'I'll be back' in The Terminator?", a: 'Arnold Schwarzenegger', d: ['Sylvester Stallone', 'Bruce Willis', 'Jean-Claude Van Damme'] },
{ c: 'Awards & Box Office', t: 1, q: 'Winning an Oscar, an Emmy, a Grammy and a Tony is known by which acronym?', a: 'EGOT', d: ['GOAT', 'TEGO', 'EGGT'] },
{ c: 'Behind the Scenes', t: 1, q: "Which 1993 film's dinosaurs mixed full-size animatronics with then-new computer animation?", a: 'Jurassic Park', d: ['The Lost World', 'Dragonheart', 'Godzilla'] },

{ c: 'Movies', t: 2, q: 'In The Silence of the Lambs, what was Hannibal Lecter before his imprisonment?', a: 'A psychiatrist', d: ['A surgeon', 'A pathologist', 'A chef'] },
{ c: 'Television', t: 2, q: 'Which sitcom was set at Dunder Mifflin, a paper company in Scranton?', a: 'The Office', d: ['Parks and Recreation', '30 Rock', 'Better Off Ted'] },
{ c: 'Actors & Directors', t: 2, q: 'Which director made Do the Right Thing and Malcolm X?', a: 'Spike Lee', d: ['John Singleton', 'Ava DuVernay', 'F. Gary Gray'] },
{ c: 'Awards & Box Office', t: 2, q: 'Which 2003 film won all eleven Academy Awards for which it was nominated?', a: 'The Lord of the Rings: The Return of the King', d: ['Master and Commander', 'Mystic River', 'Cold Mountain'] },
{ c: 'Behind the Scenes', t: 2, q: 'The Wilhelm scream is what kind of recurring film element?', a: 'A stock sound effect', d: ['A lens flare technique', 'A camera move', 'A lighting setup'] },

{ c: 'Movies', t: 3, q: 'Which film is told largely in reverse order, following a man who cannot form new memories?', a: 'Memento', d: ['Irreversible', 'Following', 'Primer'] },
{ c: 'Television', t: 3, q: 'Which late night sketch show has broadcast from Studio 8H at Rockefeller Center since 1975?', a: 'Saturday Night Live', d: ['SCTV', 'In Living Color', 'MADtv'] },
{ c: 'Actors & Directors', t: 3, q: 'Which director made Rashomon, Seven Samurai and Ran?', a: 'Akira Kurosawa', d: ['Yasujiro Ozu', 'Kenji Mizoguchi', 'Masaki Kobayashi'] },
{ c: 'Awards & Box Office', t: 3, q: 'Which Academy Award category was handed out for the first time in 2002, with Shrek the winner?', a: 'Best Animated Feature', d: ['Best Visual Effects', 'Best Sound Editing', 'Best Casting'] },
{ c: 'Behind the Scenes', t: 3, q: "Which film's 'bullet time' effect used a ring of still cameras firing in sequence?", a: 'The Matrix', d: ['Blade', 'Equilibrium', 'Wanted'] },

{ c: 'Movies', t: 4, q: 'How many of the samurai are still alive at the end of Seven Samurai?', a: 'Three', d: ['Two', 'Four', 'Five'] },
{ c: 'Television', t: 4, q: 'Which American sitcom ended with its four main characters behind bars?', a: 'Seinfeld', d: ['Cheers', 'Frasier', 'Newhart'] },
{ c: 'Actors & Directors', t: 4, q: 'Which actor wore the Darth Vader suit on set in the original trilogy while somebody else supplied the voice?', a: 'David Prowse', d: ['Bob Anderson', 'Sebastian Shaw', 'Peter Mayhew'] },
{ c: 'Awards & Box Office', t: 4, q: 'Who was the first woman to win the Academy Award for Best Director?', a: 'Kathryn Bigelow', d: ['Sofia Coppola', 'Jane Campion', 'Lina Wertmuller'] },
{ c: 'Behind the Scenes', t: 4, q: 'The opening crawl of the 1977 Star Wars was shot how?', a: 'A camera moving over artwork on the floor', d: ['Hand-drawn cel animation', 'An early computer render', 'Rear projection onto a screen'] },

{ c: 'Movies', t: 5, q: 'In The Big Lebowski, what does the Dude spend the film trying to have replaced?', a: 'His rug', d: ['His car', 'His bowling ball', 'His bathrobe'] },
{ c: 'Television', t: 5, q: 'Which sitcom drew a bigger American audience for a January 1953 episode than the presidential inauguration the next day?', a: 'I Love Lucy', d: ['The Honeymooners', 'Your Show of Shows', 'The Jack Benny Program'] },
{ c: 'Actors & Directors', t: 5, q: 'Which cinematographer shot Citizen Kane?', a: 'Gregg Toland', d: ['James Wong Howe', 'Karl Struss', 'Leon Shamroy'] },
{ c: 'Awards & Box Office', t: 5, q: 'Which film was the first sequel to win Best Picture?', a: 'The Godfather Part II', d: ['The Return of the King', 'Aliens', 'Rocky II'] },
{ c: 'Behind the Scenes', t: 5, q: 'Which studio was founded by Charlie Chaplin, Mary Pickford, Douglas Fairbanks and D. W. Griffith?', a: 'United Artists', d: ['RKO', 'Columbia Pictures', 'Paramount Pictures'] },
],

// ── Day 4 ──────────────────────────────────────────────────────────────────
[
{ c: 'Movies', t: 1, q: 'Which film follows a boy who hides a stranded alien and helps him phone home?', a: 'E.T. the Extra-Terrestrial', d: ['Close Encounters of the Third Kind', 'Flight of the Navigator', 'Explorers'] },
{ c: 'Television', t: 1, q: 'Which series set noble houses fighting over the Iron Throne?', a: 'Game of Thrones', d: ['The Witcher', 'Vikings', 'Rome'] },
{ c: 'Actors & Directors', t: 1, q: 'Which actress played Hermione Granger across the Harry Potter films?', a: 'Emma Watson', d: ['Emma Stone', 'Bonnie Wright', 'Evanna Lynch'] },
{ c: 'Awards & Box Office', t: 1, q: 'The Golden Globe Awards honor achievement in film and which other medium?', a: 'Television', d: ['Theater', 'Music', 'Radio'] },
{ c: 'Behind the Scenes', t: 1, q: 'Which studio made Toy Story, the first fully computer-animated feature?', a: 'Pixar', d: ['DreamWorks Animation', 'Illumination', 'Industrial Light & Magic'] },

{ c: 'Movies', t: 2, q: 'In The Wizard of Oz, what does the Scarecrow ask the Wizard for?', a: 'A brain', d: ['A heart', 'Courage', 'A way home'] },
{ c: 'Television', t: 2, q: "In Star Trek, which planet is the home world of Spock's father?", a: 'Vulcan', d: ['Romulus', 'Andoria', 'Kronos'] },
{ c: 'Actors & Directors', t: 2, q: 'Which director made Taxi Driver, Goodfellas and The Departed?', a: 'Martin Scorsese', d: ['Brian De Palma', 'Michael Mann', 'Sidney Lumet'] },
{ c: 'Awards & Box Office', t: 2, q: 'Which Best Picture winner of the 2009 ceremony was set largely in Mumbai?', a: 'Slumdog Millionaire', d: ['The Reader', 'Frost/Nixon', 'Milk'] },
{ c: 'Behind the Scenes', t: 2, q: 'The 1927 release The Jazz Singer is remembered as a landmark for introducing what to features?', a: 'Synchronized spoken dialogue', d: ['Technicolor', 'Widescreen framing', 'Stereo sound'] },

{ c: 'Movies', t: 3, q: 'In Vertigo, what is the occupation of the man played by James Stewart?', a: 'A retired detective', d: ['A newspaper editor', 'A doctor', 'An architect'] },
{ c: 'Television', t: 3, q: 'Which 1990s series was set in the fictional California town of Sunnydale?', a: 'Buffy the Vampire Slayer', d: ['Angel', 'Charmed', 'Roswell'] },
{ c: 'Actors & Directors', t: 3, q: 'Which actor played both Michael Corleone and Tony Montana?', a: 'Al Pacino', d: ['Robert De Niro', 'Andy Garcia', 'Ray Liotta'] },
{ c: 'Awards & Box Office', t: 3, q: 'Which actress won a supporting Oscar for a brief turn as Queen Elizabeth I in Shakespeare in Love?', a: 'Judi Dench', d: ['Brenda Blethyn', 'Kathy Bates', 'Lynn Redgrave'] },
{ c: 'Behind the Scenes', t: 3, q: 'Which animated feature was the first ever nominated for Best Picture?', a: 'Beauty and the Beast', d: ['The Lion King', 'Snow White and the Seven Dwarfs', 'Up'] },

{ c: 'Movies', t: 4, q: 'What is the name of the commercial towing ship in Alien?', a: 'The Nostromo', d: ['The Sulaco', 'The Prometheus', 'The Covenant'] },
{ c: 'Television', t: 4, q: 'Which series ended with its lead sitting on a hillside as a soft drink commercial begins?', a: 'Mad Men', d: ['The Sopranos', 'Six Feet Under', 'Halt and Catch Fire'] },
{ c: 'Actors & Directors', t: 4, q: 'Which twenty-five year old directed and starred in Citizen Kane?', a: 'Orson Welles', d: ['John Huston', 'Elia Kazan', 'Nicholas Ray'] },
{ c: 'Awards & Box Office', t: 4, q: 'Which actor won a posthumous Academy Award for The Dark Knight?', a: 'Heath Ledger', d: ['Peter Finch', 'Spencer Tracy', 'James Dean'] },
{ c: 'Behind the Scenes', t: 4, q: 'The Hays Code governed what in American filmmaking?', a: 'Content and morality standards', d: ['Union labor rules', 'Studio ownership limits', 'Ticket pricing'] },

{ c: 'Movies', t: 5, q: 'Which unusual equipment let Stanley Kubrick shoot candlelit interiors for Barry Lyndon?', a: 'Ultra-fast lenses developed for NASA', d: ['Infrared film stock', 'Fiber-optic reflectors', 'Anamorphic prisms'] },
{ c: 'Television', t: 5, q: 'What was the Cartwright family ranch in Bonanza called?', a: 'The Ponderosa', d: ['Southfork', 'The Barkley', 'The High Chaparral'] },
{ c: 'Actors & Directors', t: 5, q: 'Which director was nominated four times for Best Director, for Dr. Strangelove, 2001, A Clockwork Orange and Barry Lyndon, and never won it?', a: 'Stanley Kubrick', d: ['Robert Altman', 'Sidney Lumet', 'King Vidor'] },
{ c: 'Awards & Box Office', t: 5, q: 'Which 1989 release won Best Picture even though its director, Bruce Beresford, was not nominated?', a: 'Driving Miss Daisy', d: ['Born on the Fourth of July', 'Dead Poets Society', 'Field of Dreams'] },
{ c: 'Behind the Scenes', t: 5, q: 'The documentary Hearts of Darkness chronicles the troubled Philippine shoot of which film?', a: 'Apocalypse Now', d: ['Platoon', 'The Deer Hunter', 'Full Metal Jacket'] },
],

// ── Day 5 ──────────────────────────────────────────────────────────────────
[
{ c: 'Movies', t: 1, q: 'In Toy Story, what kind of toy is Woody?', a: 'A cowboy doll', d: ['A space ranger', 'A piggy bank', 'A toy dinosaur'] },
{ c: 'Television', t: 1, q: 'Which competition series has amateur bakers working in a tent in the English countryside?', a: 'The Great British Bake Off', d: ['MasterChef', 'Top Chef', 'Chopped'] },
{ c: 'Actors & Directors', t: 1, q: 'Which actor wrote and starred in Rocky?', a: 'Sylvester Stallone', d: ['Arnold Schwarzenegger', 'Burt Reynolds', 'Chuck Norris'] },
{ c: 'Awards & Box Office', t: 1, q: 'How many acting categories does the Academy award each year?', a: 'Four', d: ['Two', 'Six', 'Eight'] },
{ c: 'Behind the Scenes', t: 1, q: 'Besides blue, which color screen do actors perform against so a background can be added later?', a: 'Green', d: ['Red', 'Yellow', 'Purple'] },

{ c: 'Movies', t: 2, q: "In The Lion King, what is the name of Simba's uncle?", a: 'Scar', d: ['Mufasa', 'Rafiki', 'Zazu'] },
{ c: 'Television', t: 2, q: 'Which period drama follows the Crawley family and their servants at an English country estate?', a: 'Downton Abbey', d: ['Upstairs, Downstairs', 'Brideshead Revisited', 'The Crown'] },
{ c: 'Actors & Directors', t: 2, q: 'Which actress played Ripley in Alien?', a: 'Sigourney Weaver', d: ['Linda Hamilton', 'Jamie Lee Curtis', 'Carrie Fisher'] },
{ c: 'Awards & Box Office', t: 2, q: 'What is the top prize at the Cannes Film Festival called?', a: "The Palme d'Or", d: ['The Golden Bear', 'The Golden Lion', 'The Silver Shell'] },
{ c: 'Behind the Scenes', t: 2, q: 'How many frames per second have sound films been projected at since the late 1920s?', a: '24', d: ['16', '30', '48'] },

{ c: 'Movies', t: 3, q: 'What does the audience learn is inside the glowing briefcase in Pulp Fiction?', a: 'It is never revealed', d: ['Gold bars', 'Diamonds', 'Cash'] },
{ c: 'Television', t: 3, q: 'Which 1990 series asked viewers who killed Laura Palmer?', a: 'Twin Peaks', d: ['Northern Exposure', 'Picket Fences', 'American Gothic'] },
{ c: 'Actors & Directors', t: 3, q: 'Which actor won Best Actor for playing Gandhi?', a: 'Ben Kingsley', d: ['Om Puri', 'Roshan Seth', 'Naseeruddin Shah'] },
{ c: 'Awards & Box Office', t: 3, q: 'Which film won Best Picture at the 1998 ceremony?', a: 'Titanic', d: ['L.A. Confidential', 'Good Will Hunting', 'As Good as It Gets'] },
{ c: 'Behind the Scenes', t: 3, q: 'Which rating did the American film ratings board add in 1984, between PG and R?', a: 'PG-13', d: ['M', 'GP', 'NC-17'] },

{ c: 'Movies', t: 4, q: 'What is the trade of Daniel Plainview in There Will Be Blood?', a: 'Oil prospecting', d: ['Timber logging', 'Cattle ranching', 'Railroad building'] },
{ c: 'Television', t: 4, q: 'Which series followed a Baltimore detective named Jimmy McNulty?', a: 'The Wire', d: ['Homicide: Life on the Street', 'The Corner', 'Oz'] },
{ c: 'Actors & Directors', t: 4, q: 'Which director made Yojimbo, later remade as A Fistful of Dollars?', a: 'Akira Kurosawa', d: ['Sergio Leone', 'Hideo Gosha', 'Masaki Kobayashi'] },
{ c: 'Awards & Box Office', t: 4, q: 'Which actor won an Academy Award for playing a role an earlier Oscar winner had already played?', a: 'Robert De Niro', d: ['Al Pacino', 'Anthony Hopkins', 'Jack Nicholson'] },
{ c: 'Behind the Scenes', t: 4, q: 'Which cinematographer shot The Revenant using only natural light?', a: 'Emmanuel Lubezki', d: ['Roger Deakins', 'Robert Richardson', 'Janusz Kaminski'] },

{ c: 'Movies', t: 5, q: "What is the profession of the lead character in Jean-Pierre Melville's Le Samourai?", a: 'A contract killer', d: ['A jazz pianist', 'A police inspector', 'A jewel thief'] },
{ c: 'Television', t: 5, q: 'Which 1970s British sitcom was set in a badly run hotel in Torquay?', a: 'Fawlty Towers', d: ['Are You Being Served?', 'Rising Damp', 'Porridge'] },
{ c: 'Actors & Directors', t: 5, q: 'Who sent a representative to decline his Best Actor Oscar in 1973?', a: 'Marlon Brando', d: ['George C. Scott', 'Paul Newman', 'Jack Nicholson'] },
{ c: 'Awards & Box Office', t: 5, q: 'In which Los Angeles hotel was the first Academy Awards ceremony held, as a private dinner in 1929?', a: 'The Hollywood Roosevelt', d: ['The Beverly Wilshire', 'The Ambassador', 'The Biltmore'] },
{ c: 'Behind the Scenes', t: 5, q: 'Which 1915 feature is studied for its technical innovations alongside its notorious racism?', a: 'The Birth of a Nation', d: ['Intolerance', 'Broken Blossoms', 'The Cabinet of Dr. Caligari'] },
],

// ── Day 6 ──────────────────────────────────────────────────────────────────
[
{ c: 'Movies', t: 1, q: 'Which 1975 summer release about a great white shark is credited with inventing the blockbuster?', a: 'Jaws', d: ['Piranha', 'Orca', 'The Deep'] },
{ c: 'Television', t: 1, q: 'Which quiz show requires contestants to phrase their responses as a question?', a: 'Jeopardy!', d: ['Wheel of Fortune', 'The Price Is Right', 'Family Feud'] },
{ c: 'Actors & Directors', t: 1, q: 'Which actor played Captain Jack Sparrow in Pirates of the Caribbean?', a: 'Johnny Depp', d: ['Orlando Bloom', 'Geoffrey Rush', 'Javier Bardem'] },
{ c: 'Awards & Box Office', t: 1, q: "A film's box office gross refers to what?", a: 'Total ticket sales revenue', d: ['Profit after costs', "The studio's share only", 'Overseas sales only'] },
{ c: 'Behind the Scenes', t: 1, q: 'Which pair of brothers directed Fargo and No Country for Old Men?', a: 'The Coen brothers', d: ['The Wachowskis', 'The Farrelly brothers', 'The Safdie brothers'] },

{ c: 'Movies', t: 2, q: 'Through which city does Rocky Balboa run while training?', a: 'Philadelphia', d: ['New York', 'Boston', 'Chicago'] },
{ c: 'Television', t: 2, q: 'Which short-lived series was set aboard a transport ship named Serenity?', a: 'Firefly', d: ['Battlestar Galactica', 'Farscape', 'Stargate SG-1'] },
{ c: 'Actors & Directors', t: 2, q: 'Which director made Alien and Gladiator?', a: 'Ridley Scott', d: ['James Cameron', 'Tony Scott', 'Paul Verhoeven'] },
{ c: 'Awards & Box Office', t: 2, q: 'Which 1939 release won eight competitive Academy Awards including the top prize?', a: 'Gone with the Wind', d: ['The Wizard of Oz', 'Mr. Smith Goes to Washington', 'Stagecoach'] },
{ c: 'Behind the Scenes', t: 2, q: 'A motion capture performance such as Gollum is recorded using what worn by the actor?', a: 'A suit covered in markers', d: ['A green mask only', 'A helmet camera alone', 'A wired exoskeleton'] },

{ c: 'Movies', t: 3, q: 'In Rear Window, why is the photographer confined to his apartment?', a: 'A broken leg', d: ['A quarantine', 'House arrest', 'A blizzard'] },
{ c: 'Television', t: 3, q: 'Which BBC comedy series introduced the Ministry of Silly Walks?', a: "Monty Python's Flying Circus", d: ['The Goodies', 'Not the Nine O’Clock News', 'Beyond the Fringe'] },
{ c: 'Actors & Directors', t: 3, q: "Which director made Chinatown and Rosemary's Baby?", a: 'Roman Polanski', d: ['John Schlesinger', 'Arthur Penn', 'Hal Ashby'] },
{ c: 'Awards & Box Office', t: 3, q: 'What is the top prize at the Berlin International Film Festival called?', a: 'The Golden Bear', d: ['The Golden Lion', 'The Golden Leopard', 'The Crystal Globe'] },
{ c: 'Behind the Scenes', t: 3, q: 'Which 1948 Hitchcock film was shot in a handful of long takes and cut to look continuous?', a: 'Rope', d: ['Russian Ark', 'Birdman', 'Timecode'] },

{ c: 'Movies', t: 4, q: 'In Dr. Strangelove, what is the air base whose commander goes rogue called?', a: 'Burpelson', d: ['Ripper Field', 'Turgidson Field', 'Mandrake Base'] },
{ c: 'Television', t: 4, q: 'Which 1970s sitcom sent its characters to a bar called the Regal Beagle?', a: "Three's Company", d: ['Happy Days', 'Laverne & Shirley', 'WKRP in Cincinnati'] },
{ c: 'Actors & Directors', t: 4, q: 'Which actor played Norman Bates in 1960?', a: 'Anthony Perkins', d: ['Martin Balsam', 'John Gavin', 'Vince Edwards'] },
{ c: 'Awards & Box Office', t: 4, q: 'Which film finished the 1980s as the decade’s highest grossing release worldwide?', a: 'E.T. the Extra-Terrestrial', d: ['Return of the Jedi', 'Batman', 'Raiders of the Lost Ark'] },
{ c: 'Behind the Scenes', t: 4, q: 'For which film did Bernard Herrmann write a score performed entirely by strings?', a: 'Psycho', d: ['Vertigo', 'Taxi Driver', 'Cape Fear'] },

{ c: 'Movies', t: 5, q: 'Who narrates Sunset Boulevard?', a: 'A dead man floating in a swimming pool', d: ['A police detective', 'The studio head', 'A gossip columnist'] },
{ c: 'Television', t: 5, q: 'What are the call letters of the radio station where Frasier Crane broadcasts?', a: 'KACL', d: ['WKRP', 'KBHR', 'WNYX'] },
{ c: 'Actors & Directors', t: 5, q: 'Which Soviet filmmaker made the documentary Man with a Movie Camera?', a: 'Dziga Vertov', d: ['Sergei Eisenstein', 'Esfir Shub', 'Mikhail Kaufman'] },
{ c: 'Awards & Box Office', t: 5, q: 'Which X-rated release won Best Picture, the only one ever to do so?', a: 'Midnight Cowboy', d: ['A Clockwork Orange', 'Last Tango in Paris', 'Deliverance'] },
{ c: 'Behind the Scenes', t: 5, q: 'Who invented the Steadicam?', a: 'Garrett Brown', d: ['Douglas Trumbull', 'John Dykstra', 'Vilmos Zsigmond'] },
],

// ── Day 7 ──────────────────────────────────────────────────────────────────
[
{ c: 'Movies', t: 1, q: 'Which animated film follows a green ogre who leaves his swamp to rescue a princess?', a: 'Shrek', d: ['Monsters, Inc.', 'Hercules', "The Emperor's New Groove"] },
{ c: 'Television', t: 1, q: 'Which 1960s series sent the USS Enterprise on a five-year mission?', a: 'Star Trek', d: ['Lost in Space', 'Space: 1999', 'Battlestar Galactica'] },
{ c: 'Actors & Directors', t: 1, q: 'Which actress played Katniss Everdeen in The Hunger Games?', a: 'Jennifer Lawrence', d: ['Shailene Woodley', 'Kristen Stewart', 'Emma Roberts'] },
{ c: 'Awards & Box Office', t: 1, q: 'What does calling a film a blockbuster describe?', a: 'A very commercially successful release', d: ['A release that loses money', 'A release that skipped cinemas', 'A release banned in some countries'] },
{ c: 'Behind the Scenes', t: 1, q: 'Which disc format eventually replaced VHS as the main home video medium?', a: 'The DVD', d: ['LaserDisc', 'Blu-ray', 'MiniDisc'] },

{ c: 'Movies', t: 2, q: 'In The Shawshank Redemption, where does Andy Dufresne hide his rock hammer?', a: 'Inside a Bible', d: ['Under his mattress', 'Inside a radio', 'Inside a shoe'] },
{ c: 'Television', t: 2, q: 'What is the coffee house in Friends called?', a: 'Central Perk', d: ["Java Joe's", 'The Grind', 'Cafe Nervosa'] },
{ c: 'Actors & Directors', t: 2, q: 'Which director made Titanic and Avatar?', a: 'James Cameron', d: ['Ridley Scott', 'Michael Bay', 'Roland Emmerich'] },
{ c: 'Awards & Box Office', t: 2, q: 'Which film beat Pulp Fiction to Best Picture at the 1995 ceremony?', a: 'Forrest Gump', d: ['The Shawshank Redemption', 'Quiz Show', 'Four Weddings and a Funeral'] },
{ c: 'Behind the Scenes', t: 2, q: 'In filmmaking, what does CGI stand for?', a: 'Computer-generated imagery', d: ['Cinematic graphic integration', 'Colored gel illumination', 'Continuous gate imaging'] },

{ c: 'Movies', t: 3, q: 'In Some Like It Hot, why do the two musicians disguise themselves as women?', a: 'They witnessed a gangland killing', d: ['They owe a casino money', 'They are dodging the draft', 'They lost a bet'] },
{ c: 'Television', t: 3, q: 'Which series is narrated by a grown man looking back on his suburban 1960s boyhood?', a: 'The Wonder Years', d: ['Happy Days', 'Malcolm in the Middle', 'Freaks and Geeks'] },
{ c: 'Actors & Directors', t: 3, q: 'Which actor starred as Harry Callahan in Dirty Harry?', a: 'Clint Eastwood', d: ['Charles Bronson', 'Lee Marvin', 'Steve McQueen'] },
{ c: 'Awards & Box Office', t: 3, q: 'Which Ridley Scott film about a Roman general sold into the arena won Best Picture at the 2001 ceremony?', a: 'Gladiator', d: ['Traffic', 'Erin Brockovich', 'Chocolat'] },
{ c: 'Behind the Scenes', t: 3, q: 'Which 1958 film introduced the dolly zoom, tracking back while zooming in?', a: 'Vertigo', d: ['Jaws', 'Goodfellas', 'Poltergeist'] },

{ c: 'Movies', t: 4, q: 'Which desert does Lawrence insist on crossing against advice in Lawrence of Arabia?', a: 'The Nefud', d: ["The Rub' al Khali", 'The Sinai', 'The Negev'] },
{ c: 'Television', t: 4, q: "Which series opened each episode with 'Woke Up This Morning' by Alabama 3?", a: 'The Sopranos', d: ['The Shield', 'Deadwood', 'Boardwalk Empire'] },
{ c: 'Actors & Directors', t: 4, q: "Which actress starred as Holly Golightly in Breakfast at Tiffany's?", a: 'Audrey Hepburn', d: ['Grace Kelly', 'Natalie Wood', 'Leslie Caron'] },
{ c: 'Awards & Box Office', t: 4, q: 'Which film took the top prize at the 1953 ceremony, the first Academy Awards to be televised?', a: 'The Greatest Show on Earth', d: ['High Noon', 'From Here to Eternity', "Singin' in the Rain"] },
{ c: 'Behind the Scenes', t: 4, q: 'What does the term MacGuffin describe?', a: 'A plot device that drives characters but matters little in itself', d: ['A recurring background actor', 'A camera crane move', 'A studio contract clause'] },

{ c: 'Movies', t: 5, q: 'The final section of Andrei Rublev follows the casting of what?', a: 'A bell', d: ['A cannon', 'A statue', 'A church door'] },
{ c: 'Television', t: 5, q: 'What was the Alaskan town in Northern Exposure called?', a: 'Cicely', d: ['Bly', 'Twin Pines', 'Rome'] },
{ c: 'Actors & Directors', t: 5, q: 'Which actor played the vampire in the 1922 silent film Nosferatu?', a: 'Max Schreck', d: ['Conrad Veidt', 'Bela Lugosi', 'Paul Wegener'] },
{ c: 'Awards & Box Office', t: 5, q: 'How many times did Alfred Hitchcock win the Academy Award for Best Director?', a: 'Never', d: ['Once', 'Twice', 'Three times'] },
{ c: 'Behind the Scenes', t: 5, q: 'Which widescreen process did 20th Century Fox introduce in 1953 with The Robe?', a: 'CinemaScope', d: ['VistaVision', 'Todd-AO', 'Cinerama'] },
],

// ── Day 8 ──────────────────────────────────────────────────────────────────
[
{ c: 'Movies', t: 1, q: 'What kind of fish is the title character of Finding Nemo?', a: 'A clownfish', d: ['An angelfish', 'A goldfish', 'A blue tang'] },
{ c: 'Television', t: 1, q: 'On which long-running childrens series do Big Bird and Elmo live?', a: 'Sesame Street', d: ["Mister Rogers' Neighborhood", 'The Muppet Show', 'Barney & Friends'] },
{ c: 'Actors & Directors', t: 1, q: 'Which actor played Neo in The Matrix?', a: 'Keanu Reeves', d: ['Laurence Fishburne', 'Hugo Weaving', 'Val Kilmer'] },
{ c: 'Awards & Box Office', t: 1, q: 'In which American city are the Academy Awards presented?', a: 'Los Angeles', d: ['New York', 'Chicago', 'Las Vegas'] },
{ c: 'Behind the Scenes', t: 1, q: 'Which 1977 release drove the rapid adoption of stereo sound in cinemas?', a: 'Star Wars', d: ['Close Encounters of the Third Kind', 'Saturday Night Fever', 'Superman'] },

{ c: 'Movies', t: 2, q: 'In Jurassic Park, what is used to fill the gaps in the dinosaur DNA?', a: 'Frog DNA', d: ['Bird DNA', 'Lizard DNA', 'Crocodile DNA'] },
{ c: 'Television', t: 2, q: 'Who owns the nuclear power plant in The Simpsons?', a: 'Mr. Burns', d: ['Waylon Smithers', 'Mayor Quimby', 'Ned Flanders'] },
{ c: 'Actors & Directors', t: 2, q: "Which director made Pan's Labyrinth and The Shape of Water?", a: 'Guillermo del Toro', d: ['Alejandro G. Inarritu', 'Alfonso Cuaron', 'Juan Antonio Bayona'] },
{ c: 'Awards & Box Office', t: 2, q: 'Which film actually won Best Picture at the 2017 ceremony after the wrong title was read out?', a: 'Moonlight', d: ['La La Land', 'Manchester by the Sea', 'Hidden Figures'] },
{ c: 'Behind the Scenes', t: 2, q: 'What does a foley artist create?', a: 'Everyday sound effects recorded to picture', d: ['Matte paintings', 'Miniature models', 'Set dressing'] },

{ c: 'Movies', t: 3, q: 'In which city is The Third Man set?', a: 'Vienna', d: ['Berlin', 'Prague', 'Budapest'] },
{ c: 'Television', t: 3, q: 'Which British sitcom centered on the socially ambitious Hyacinth Bucket?', a: 'Keeping Up Appearances', d: ['Absolutely Fabulous', 'Butterflies', 'To the Manor Born'] },
{ c: 'Actors & Directors', t: 3, q: 'Which actor played Atticus Finch in the film of To Kill a Mockingbird?', a: 'Gregory Peck', d: ['Henry Fonda', 'James Stewart', 'Spencer Tracy'] },
{ c: 'Awards & Box Office', t: 3, q: 'Which actor was twenty-nine when he took Best Actor for The Pianist in 2003?', a: 'Adrien Brody', d: ['Marlon Brando', 'Richard Dreyfuss', 'Matt Damon'] },
{ c: 'Behind the Scenes', t: 3, q: 'Which crew member heads the electrical department and is responsible for lighting?', a: 'The gaffer', d: ['The foley artist', 'The script supervisor', 'The dolly grip'] },

{ c: 'Movies', t: 4, q: 'In Once Upon a Time in the West, what does the harmonica-playing stranger want?', a: "Revenge for his brother's death", d: ['A stolen gold shipment', 'A railroad contract', 'His wife returned'] },
{ c: 'Television', t: 4, q: 'Which sitcom was set in the newsroom of the fictional WJM-TV in Minneapolis?', a: 'The Mary Tyler Moore Show', d: ['Lou Grant', 'Murphy Brown', 'WKRP in Cincinnati'] },
{ c: 'Actors & Directors', t: 4, q: 'Which director made 8½ and La Dolce Vita?', a: 'Federico Fellini', d: ['Michelangelo Antonioni', 'Luchino Visconti', 'Vittorio De Sica'] },
{ c: 'Awards & Box Office', t: 4, q: 'Which mostly silent black and white film won Best Picture at the 2012 ceremony?', a: 'The Artist', d: ['Hugo', 'The Descendants', 'Midnight in Paris'] },
{ c: 'Behind the Scenes', t: 4, q: 'Which studio uses a mountain encircled by stars as its logo?', a: 'Paramount', d: ['Universal', 'Columbia', 'TriStar'] },

{ c: 'Movies', t: 5, q: 'What journey do the elderly couple make in Tokyo Story?', a: 'They travel to Tokyo to visit their grown children', d: ['They emigrate to America', 'They return to their birthplace', 'They move into a temple'] },
{ c: 'Television', t: 5, q: 'Which British sitcom is set on a mining ship drifting three million years into deep space?', a: 'Red Dwarf', d: ['Hyperdrive', 'Come Back Mrs Noah', "Blake's 7"] },
{ c: 'Actors & Directors', t: 5, q: 'Which actress starred opposite Cary Grant in Bringing Up Baby?', a: 'Katharine Hepburn', d: ['Rosalind Russell', 'Irene Dunne', 'Carole Lombard'] },
{ c: 'Awards & Box Office', t: 5, q: "Which country's film Shoeshine took an honorary Academy Award as the outstanding foreign language film of 1947?", a: 'Italy', d: ['France', 'Japan', 'Mexico'] },
{ c: 'Behind the Scenes', t: 5, q: 'The Kuleshov effect demonstrates what about cinema?', a: 'Meaning comes from the juxtaposition of shots', d: ['Color drives mood', 'Sound must match picture exactly', 'Long takes build tension'] },
],

// ── Day 9 ──────────────────────────────────────────────────────────────────
[
{ c: 'Movies', t: 1, q: 'In The Sound of Music, what was Maria training to become before joining the von Trapp household?', a: 'A nun', d: ['A teacher', 'A nurse', 'An opera singer'] },
{ c: 'Television', t: 1, q: 'Which reality competition has contestants vote one another off the island?', a: 'Survivor', d: ['Big Brother', 'The Amazing Race', 'Fear Factor'] },
{ c: 'Actors & Directors', t: 1, q: 'Which actor played James Bond in Dr. No, the first film of the series?', a: 'Sean Connery', d: ['Roger Moore', 'George Lazenby', 'Timothy Dalton'] },
{ c: 'Awards & Box Office', t: 1, q: "What does a film's opening weekend measure?", a: 'Ticket sales across its first Friday to Sunday', d: ['Its entire theatrical run', 'Its overseas total', 'Its production budget'] },
{ c: 'Behind the Scenes', t: 1, q: 'Which studio has a roaring lion as its mascot?', a: 'MGM', d: ['Warner Bros.', '20th Century Fox', 'Universal'] },

{ c: 'Movies', t: 2, q: 'Which artifact is Indiana Jones chasing in Raiders of the Lost Ark?', a: 'The Ark of the Covenant', d: ['The Holy Grail', 'The Sankara Stones', 'A crystal skull'] },
{ c: 'Television', t: 2, q: 'What was Sam Malone in Cheers before he ran a bar?', a: 'A baseball pitcher', d: ['A boxer', 'A quarterback', 'A hockey goaltender'] },
{ c: 'Actors & Directors', t: 2, q: 'Which director made The Grand Budapest Hotel and Rushmore?', a: 'Wes Anderson', d: ['Noah Baumbach', 'Spike Jonze', 'Michel Gondry'] },
{ c: 'Awards & Box Office', t: 2, q: 'Which musical won Best Picture at the 2003 ceremony?', a: 'Chicago', d: ['Moulin Rouge!', 'Dreamgirls', 'Nine'] },
{ c: 'Behind the Scenes', t: 2, q: 'Which Japanese animation studio produced Spirited Away?', a: 'Studio Ghibli', d: ['Toei Animation', 'Madhouse', 'Production I.G'] },

{ c: 'Movies', t: 3, q: 'What was Travis Bickle before he drove a cab in Taxi Driver?', a: 'A Marine', d: ['A police officer', 'A prison guard', 'A long haul trucker'] },
{ c: 'Television', t: 3, q: "Which nightly news programme did Walter Cronkite sign off with 'and that's the way it is'?", a: 'The CBS Evening News', d: ['NBC Nightly News', '60 Minutes', 'Meet the Press'] },
{ c: 'Actors & Directors', t: 3, q: 'Which director made Blue Velvet and Mulholland Drive?', a: 'David Lynch', d: ['David Cronenberg', 'Terry Gilliam', 'Darren Aronofsky'] },
{ c: 'Awards & Box Office', t: 3, q: 'Which film was the first to earn more than one hundred million dollars in North American distributor rentals?', a: 'Jaws', d: ['The Godfather', 'Star Wars', 'The Exorcist'] },
{ c: 'Behind the Scenes', t: 3, q: 'What does shooting day for night mean?', a: 'Filming in daylight and treating the image to look like night', d: ['Shooting only after sunset', 'Running two units at once', 'Building a night scene on a sound stage'] },

{ c: 'Movies', t: 4, q: 'What is the profession of Harry Caul in The Conversation?', a: 'A surveillance expert', d: ['A journalist', 'A priest', 'A locksmith'] },
{ c: 'Television', t: 4, q: 'Which animated series is set in the fictional Rhode Island town of Quahog?', a: 'Family Guy', d: ['American Dad!', 'The Cleveland Show', 'Futurama'] },
{ c: 'Actors & Directors', t: 4, q: 'Which director made Nashville and The Player?', a: 'Robert Altman', d: ['Hal Ashby', 'Sidney Lumet', 'Arthur Penn'] },
{ c: 'Awards & Box Office', t: 4, q: 'Which release finished the 1990s as the decade’s highest grossing film worldwide?', a: 'Titanic', d: ['Jurassic Park', 'Independence Day', 'The Lion King'] },
{ c: 'Behind the Scenes', t: 4, q: "Which film's poster carried the line about nobody hearing you scream in space?", a: 'Alien', d: ['Event Horizon', 'Outland', 'Solaris'] },

{ c: 'Movies', t: 5, q: 'In Bicycle Thieves, what does the father need the bicycle for?', a: 'A job putting up posters', d: ['Delivering bread', 'Racing', 'Selling vegetables'] },
{ c: 'Television', t: 5, q: 'Which anthology series did Rod Serling host after The Twilight Zone?', a: 'Night Gallery', d: ['The Outer Limits', 'One Step Beyond', 'Thriller'] },
{ c: 'Actors & Directors', t: 5, q: 'Which director made Breathless in 1960?', a: 'Jean-Luc Godard', d: ['Francois Truffaut', 'Claude Chabrol', 'Eric Rohmer'] },
{ c: 'Awards & Box Office', t: 5, q: 'Which art director holds the record for the most Academy Award nominations in a single category, with thirty-nine?', a: 'Cedric Gibbons', d: ['Lyle Wheeler', 'Hans Dreier', 'William Cameron Menzies'] },
{ c: 'Behind the Scenes', t: 5, q: 'What did the 1948 Paramount Decree force the major studios to give up?', a: 'Ownership of cinema chains', d: ['Long-term actor contracts', 'Foreign distribution', 'Color film patents'] },
],

// ── Day 10 ─────────────────────────────────────────────────────────────────
[
{ c: 'Movies', t: 1, q: 'In which film does a billionaire open an island park stocked with cloned prehistoric animals?', a: 'Jurassic Park', d: ['King Kong', 'Congo', 'Anaconda'] },
{ c: 'Television', t: 1, q: 'Which sitcom follows a Brooklyn police precinct commanded by Captain Raymond Holt?', a: 'Brooklyn Nine-Nine', d: ['The Good Place', 'Superstore', 'Community'] },
{ c: 'Actors & Directors', t: 1, q: 'Which actress played Princess Leia in the original Star Wars trilogy?', a: 'Carrie Fisher', d: ['Sigourney Weaver', 'Jamie Lee Curtis', 'Karen Allen'] },
{ c: 'Awards & Box Office', t: 1, q: 'Which film and television awards are voted on by performers themselves?', a: 'The Screen Actors Guild Awards', d: ['The Academy Awards', 'The Golden Globes', 'The BAFTAs'] },
{ c: 'Behind the Scenes', t: 1, q: "What does a director's cut of a film mean?", a: "A version edited to the director's preference", d: ['The theatrical release', 'The version shown to test audiences', 'The shortest version'] },

{ c: 'Movies', t: 2, q: 'In the 1971 film of Roald Dahl’s chocolate factory story, what does Charlie find inside a candy bar?', a: 'A golden ticket', d: ['A silver coin', 'A map', 'A brass key'] },
{ c: 'Television', t: 2, q: 'Which sitcom is set in the parks department of Pawnee, Indiana?', a: 'Parks and Recreation', d: ['The Office', 'Superstore', 'Veep'] },
{ c: 'Actors & Directors', t: 2, q: 'Which director made Fight Club and Se7en?', a: 'David Fincher', d: ['Christopher Nolan', 'Darren Aronofsky', 'Doug Liman'] },
{ c: 'Awards & Box Office', t: 2, q: 'Which film about an army bomb disposal unit in Iraq won Best Picture at the 2010 ceremony?', a: 'The Hurt Locker', d: ['Avatar', 'Inglourious Basterds', 'Up in the Air'] },
{ c: 'Behind the Scenes', t: 2, q: 'For most of the twentieth century, how wide was the film stock projected in cinemas?', a: '35 millimeters', d: ['16 millimeters', '70 millimeters', '8 millimeters'] },

{ c: 'Movies', t: 3, q: 'What makes the structure of Rashomon famous?', a: 'One event told in contradictory versions', d: ['A single unbroken take', 'Reverse chronology', 'No dialogue at all'] },
{ c: 'Television', t: 3, q: "Which 1981 police drama opened each episode at roll call with 'Let's be careful out there'?", a: 'Hill Street Blues', d: ['NYPD Blue', 'Cagney & Lacey', 'Barney Miller'] },
{ c: 'Actors & Directors', t: 3, q: 'Which actor played the weak middle brother Fredo in the Godfather films?', a: 'John Cazale', d: ['James Caan', 'Richard Castellano', 'Gianni Russo'] },
{ c: 'Awards & Box Office', t: 3, q: 'Which western, directed by its star, won Best Picture at the 1991 ceremony?', a: 'Dances with Wolves', d: ['Goodfellas', 'Awakenings', 'Ghost'] },
{ c: 'Behind the Scenes', t: 3, q: 'Which crew role heads the rigging and camera support department?', a: 'The key grip', d: ['The best boy electric', 'The foley artist', 'The script supervisor'] },

{ c: 'Movies', t: 4, q: 'Who narrates the story of Mozart in Amadeus?', a: 'Antonio Salieri', d: ['Emperor Joseph II', 'Constanze Mozart', 'Leopold Mozart'] },
{ c: 'Television', t: 4, q: 'Which series featured a shadowy antagonist known as the Cigarette Smoking Man?', a: 'The X-Files', d: ['Fringe', 'Millennium', 'Person of Interest'] },
{ c: 'Actors & Directors', t: 4, q: 'Which director made Cleo from 5 to 7 and Vagabond?', a: 'Agnes Varda', d: ['Marguerite Duras', 'Chantal Akerman', 'Claire Denis'] },
{ c: 'Awards & Box Office', t: 4, q: 'Which 1950 release took fourteen Academy Award nominations, the most any film had received to that point?', a: 'All About Eve', d: ['Sunset Boulevard', 'Born Yesterday', "King Solomon's Mines"] },
{ c: 'Behind the Scenes', t: 4, q: 'Which 1976 release was the first feature to use the newly invented Steadicam?', a: 'Bound for Glory', d: ['Rocky', 'Marathon Man', 'Taxi Driver'] },

{ c: 'Movies', t: 5, q: 'What journey frames Wild Strawberries?', a: 'An elderly professor driving to receive an honorary degree', d: ['A pilgrimage to a monastery', 'A soldier returning from the front', 'A family voyage to America'] },
{ c: 'Television', t: 5, q: 'What was the Chicago hospital in ER called?', a: 'County General', d: ['Cook County Memorial', 'Mercy General', 'Chicago Hope'] },
{ c: 'Actors & Directors', t: 5, q: 'Which director made Andrei Rublev and Stalker?', a: 'Andrei Tarkovsky', d: ['Sergei Parajanov', 'Elem Klimov', 'Aleksei German'] },
{ c: 'Awards & Box Office', t: 5, q: 'Which Italian film won the first competitive Academy Award for Best Foreign Language Film?', a: 'La Strada', d: ['Nights of Cabiria', 'Bicycle Thieves', 'Rome, Open City'] },
{ c: 'Behind the Scenes', t: 5, q: 'Which 1927 German film had long-lost footage rediscovered in Buenos Aires in 2008?', a: 'Metropolis', d: ['Nosferatu', 'The Cabinet of Dr. Caligari', 'Faust'] },
],

// ── Day 11 ─────────────────────────────────────────────────────────────────
[
{ c: 'Movies', t: 1, q: "In Disney's Beauty and the Beast, what does the enchanted rose measure?", a: 'The time left to break the curse', d: ["The Beast's strength", "The castle's magic", "Belle's love"] },
{ c: 'Television', t: 1, q: 'Which medical drama is set at Seattle Grace Hospital?', a: "Grey's Anatomy", d: ['House', 'ER', 'Scrubs'] },
{ c: 'Actors & Directors', t: 1, q: 'Which actor played Han Solo in the original Star Wars trilogy?', a: 'Harrison Ford', d: ['Mark Hamill', 'Billy Dee Williams', 'Kurt Russell'] },
{ c: 'Awards & Box Office', t: 1, q: 'The Academy Award for Best Picture is handed to whom?', a: "The film's producers", d: ['The director', 'The lead actor', 'The studio head'] },
{ c: 'Behind the Scenes', t: 1, q: 'Which animation studio made Toy Story, Up and WALL-E?', a: 'Pixar', d: ['DreamWorks Animation', 'Illumination', 'Blue Sky'] },

{ c: 'Movies', t: 2, q: 'In The Princess Bride, who is Inigo Montoya hunting?', a: 'The man who killed his father', d: ['A thief who stole his sword', 'The pirate who marooned him', 'The king who exiled him'] },
{ c: 'Television', t: 2, q: 'Which series is set in the fictional town of Hawkins, Indiana?', a: 'Stranger Things', d: ['Riverdale', 'Dark', 'The OA'] },
{ c: 'Actors & Directors', t: 2, q: 'Which director made Get Out and Nope?', a: 'Jordan Peele', d: ['Ryan Coogler', 'Barry Jenkins', 'Boots Riley'] },
{ c: 'Awards & Box Office', t: 2, q: 'Which film about a boxer and her trainer won Best Picture at the 2005 ceremony?', a: 'Million Dollar Baby', d: ['The Aviator', 'Sideways', 'Ray'] },
{ c: 'Behind the Scenes', t: 2, q: 'Which Stephen King novella was filmed as Stand by Me?', a: 'The Body', d: ['The Mist', 'Apt Pupil', 'The Breathing Method'] },

{ c: 'Movies', t: 3, q: 'In 12 Angry Men, who is the lone holdout at the first vote?', a: 'Juror 8', d: ['Juror 3', 'Juror 1', 'Juror 12'] },
{ c: 'Television', t: 3, q: 'Which sitcom was set at a Vermont inn run by Dick Loudon?', a: 'Newhart', d: ['The Bob Newhart Show', 'Coach', 'Evening Shade'] },
{ c: 'Actors & Directors', t: 3, q: "Which actress won Best Actress for Sophie's Choice?", a: 'Meryl Streep', d: ['Jessica Lange', 'Sissy Spacek', 'Debra Winger'] },
{ c: 'Awards & Box Office', t: 3, q: 'Which film about a Depression-era confidence trick won Best Picture at the 1974 ceremony?', a: 'The Sting', d: ['American Graffiti', 'The Exorcist', 'Cries and Whispers'] },
{ c: 'Behind the Scenes', t: 3, q: 'What does ADR mean in post-production?', a: 'Re-recording dialogue in a studio', d: ['Adding digital rain', 'Automatic depth rendering', 'Analog data restoration'] },

{ c: 'Movies', t: 4, q: 'Which resource is at the heart of the conspiracy in Chinatown?', a: 'Water', d: ['Oil', 'Gold', 'Railroad rights'] },
{ c: 'Television', t: 4, q: 'Which British soap opera has been set in the fictional Weatherfield since 1960?', a: 'Coronation Street', d: ['EastEnders', 'Emmerdale', 'Brookside'] },
{ c: 'Actors & Directors', t: 4, q: 'Which actor appeared in both The Godfather and Apocalypse Now?', a: 'Robert Duvall', d: ['Harvey Keitel', 'Frederic Forrest', 'Sam Bottoms'] },
{ c: 'Awards & Box Office', t: 4, q: 'Which Billy Wilder film won Best Picture at the 1961 ceremony?', a: 'The Apartment', d: ['Elmer Gantry', 'The Alamo', 'Sons and Lovers'] },
{ c: 'Behind the Scenes', t: 4, q: 'What is the 180 degree rule in filmmaking?', a: 'Keeping the camera on one side of an imaginary line between subjects', d: ['Circling a subject in a full rotation', 'Lighting from directly behind the subject', 'Cutting on a half turn of the head'] },

{ c: 'Movies', t: 5, q: 'Which conflict does The Battle of Algiers dramatize?', a: 'The Algerian war of independence', d: ['The Spanish Civil War', 'The Suez Crisis', 'The Six-Day War'] },
{ c: 'Television', t: 5, q: 'Which 1977 miniseries about an American family enslaved over generations drew record audiences?', a: 'Roots', d: ['Holocaust', 'Rich Man, Poor Man', 'Shogun'] },
{ c: 'Actors & Directors', t: 5, q: 'Which actress played the faded silent star Norma Desmond?', a: 'Gloria Swanson', d: ['Mae West', 'Pola Negri', 'Norma Shearer'] },
{ c: 'Awards & Box Office', t: 5, q: 'Which director won Best Director three times in the 1930s?', a: 'Frank Capra', d: ['John Ford', 'William Wyler', 'Leo McCarey'] },
{ c: 'Behind the Scenes', t: 5, q: 'Which classic color process exposed three separate strips of black and white negative at once?', a: 'Technicolor', d: ['Eastmancolor', 'Kinemacolor', 'Agfacolor'] },
],

// ── Day 12 ─────────────────────────────────────────────────────────────────
[
{ c: 'Movies', t: 1, q: "In Disney's Frozen, what power does Elsa have?", a: 'She creates ice and snow', d: ['She can fly', 'She talks to animals', 'She can heal the sick'] },
{ c: 'Television', t: 1, q: 'On which singing competition do the judges audition contestants with their chairs turned away?', a: 'The Voice', d: ['American Idol', 'The X Factor', "America's Got Talent"] },
{ c: 'Actors & Directors', t: 1, q: 'Which director made Inception and The Dark Knight?', a: 'Christopher Nolan', d: ['Zack Snyder', 'Denis Villeneuve', 'Matt Reeves'] },
{ c: 'Awards & Box Office', t: 1, q: 'Which awards honor achievement in recorded music?', a: 'The Grammy Awards', d: ['The Tony Awards', 'The Emmy Awards', 'The Obie Awards'] },
{ c: 'Behind the Scenes', t: 1, q: 'What is the clapperboard snapped at the head of a take for?', a: 'Syncing the picture to the sound', d: ['Measuring focus', 'Setting exposure', 'Timing the scene'] },

{ c: 'Movies', t: 2, q: 'What is the name of the Roman general played by Russell Crowe in Gladiator?', a: 'Maximus', d: ['Commodus', 'Proximo', 'Marcus'] },
{ c: 'Television', t: 2, q: 'Which series follows an Albuquerque lawyer who began life as Jimmy McGill?', a: 'Better Call Saul', d: ['Breaking Bad', 'Ozark', 'Fargo'] },
{ c: 'Actors & Directors', t: 2, q: 'Which actress played Mia Wallace in Pulp Fiction?', a: 'Uma Thurman', d: ['Rosanna Arquette', 'Bridget Fonda', 'Maria de Medeiros'] },
{ c: 'Awards & Box Office', t: 2, q: 'Which film won Best Picture at the 2014 ceremony?', a: '12 Years a Slave', d: ['Gravity', 'American Hustle', 'Her'] },
{ c: 'Behind the Scenes', t: 2, q: 'Which 1937 release was the first American feature-length animated film?', a: 'Snow White and the Seven Dwarfs', d: ['Pinocchio', 'Fantasia', 'Bambi'] },

{ c: 'Movies', t: 3, q: 'What is the profession of Walter Neff in Double Indemnity?', a: 'An insurance salesman', d: ['A private detective', 'A lawyer', 'A newspaper reporter'] },
{ c: 'Television', t: 3, q: 'Which comedy was set at Sacred Heart Hospital?', a: 'Scrubs', d: ["Grey's Anatomy", 'House', 'Nurse Jackie'] },
{ c: 'Actors & Directors', t: 3, q: 'Which actor starred in Raging Bull, Taxi Driver and Goodfellas for Martin Scorsese?', a: 'Robert De Niro', d: ['Joe Pesci', 'Harvey Keitel', 'Ray Liotta'] },
{ c: 'Awards & Box Office', t: 3, q: 'Which Steven Spielberg film won Best Picture for 1993?', a: "Schindler's List", d: ['Jurassic Park', 'The Fugitive', 'In the Name of the Father'] },
{ c: 'Behind the Scenes', t: 3, q: 'What is a matte painting used for?', a: 'Creating a background too large or costly to build', d: ['Coloring film by hand', 'Blending two takes of one actor', 'Softening the focus'] },

{ c: 'Movies', t: 4, q: 'What is John Wayne’s character searching for in The Searchers?', a: 'His abducted niece', d: ['A gold mine', "His brother's killer", 'A lost herd'] },
{ c: 'Television', t: 4, q: 'Which prime-time soap opera featured the oil magnate J.R. Ewing?', a: 'Dallas', d: ['Dynasty', 'Falcon Crest', 'Knots Landing'] },
{ c: 'Actors & Directors', t: 4, q: 'Which German director made both Sunrise and Nosferatu?', a: 'F. W. Murnau', d: ['Fritz Lang', 'G. W. Pabst', 'Robert Wiene'] },
{ c: 'Awards & Box Office', t: 4, q: 'Which film became the first released by a streaming service to win Best Picture?', a: 'CODA', d: ['Roma', 'The Power of the Dog', 'Nomadland'] },
{ c: 'Behind the Scenes', t: 4, q: 'Which technological change made the French New Wave practical to shoot?', a: 'Lightweight portable cameras and faster film stock', d: ['Digital editing', 'The zoom lens', 'Stereo magnetic sound'] },

{ c: 'Movies', t: 5, q: 'What did Jacques Tati build for the production of Playtime?', a: 'A full-scale modern city set', d: ['A rotating apartment', 'An underwater tank', 'A glass train'] },
{ c: 'Television', t: 5, q: 'What is the prison in the HBO series Oz called?', a: 'Oswald State Correctional Facility', d: ['Litchfield', 'Fox River', 'Shawshank'] },
{ c: 'Actors & Directors', t: 5, q: 'Which director made The Rules of the Game in 1939?', a: 'Jean Renoir', d: ['Marcel Carne', 'Rene Clair', 'Julien Duvivier'] },
{ c: 'Awards & Box Office', t: 5, q: 'Which low-budget drama about a lonely Bronx butcher won Best Picture at the 1956 ceremony?', a: 'Marty', d: ['Mister Roberts', 'Picnic', 'The Rose Tattoo'] },
{ c: 'Behind the Scenes', t: 5, q: "What did a film need the Production Code Administration's seal for until 1968?", a: 'Release through the major distributors', d: ['Export overseas', 'Television broadcast', 'Color processing'] },
],

// ── Day 13 ─────────────────────────────────────────────────────────────────
[
{ c: 'Movies', t: 1, q: 'In Home Alone, where does the McCallister family fly, leaving Kevin behind?', a: 'Paris', d: ['London', 'Rome', 'Miami'] },
{ c: 'Television', t: 1, q: 'Which Netflix drama follows the reign of Queen Elizabeth II from 1947?', a: 'The Crown', d: ['Victoria', 'Downton Abbey', 'The Tudors'] },
{ c: 'Actors & Directors', t: 1, q: 'Which actor played Wolverine across the X-Men films?', a: 'Hugh Jackman', d: ['Patrick Stewart', 'James Marsden', 'Liev Schreiber'] },
{ c: 'Awards & Box Office', t: 1, q: 'The Academy of Motion Picture Arts and Sciences was founded in which decade?', a: 'The 1920s', d: ['The 1910s', 'The 1930s', 'The 1940s'] },
{ c: 'Behind the Scenes', t: 1, q: 'Which crew role is responsible for choosing which actors are auditioned and hired?', a: 'The casting director', d: ['The line producer', 'The unit manager', 'The location scout'] },

{ c: 'Movies', t: 2, q: 'In which Pennsylvania town is the weatherman trapped in Groundhog Day?', a: 'Punxsutawney', d: ['Scranton', 'Erie', 'Altoona'] },
{ c: 'Television', t: 2, q: 'Which comedy series follows the Bluth family and their frozen banana stand?', a: 'Arrested Development', d: ["Schitt's Creek", 'Modern Family', 'The Middle'] },
{ c: 'Actors & Directors', t: 2, q: 'Which actress won an Academy Award for playing Erin Brockovich?', a: 'Julia Roberts', d: ['Sandra Bullock', 'Meg Ryan', 'Michelle Pfeiffer'] },
{ c: 'Awards & Box Office', t: 2, q: "Which film about a suburban man's midlife unravelling won Best Picture at the 2000 ceremony?", a: 'American Beauty', d: ['The Sixth Sense', 'The Insider', 'The Green Mile'] },
{ c: 'Behind the Scenes', t: 2, q: 'Which 1939 film opens in sepia and switches to color when the heroine arrives in another land?', a: 'The Wizard of Oz', d: ['Gone with the Wind', 'The Adventures of Robin Hood', 'Snow White and the Seven Dwarfs'] },

{ c: 'Movies', t: 3, q: 'In The Usual Suspects, what is the name of the crime lord the police are hunting?', a: 'Keyser Soze', d: ['Kobayashi', 'Redfoot', 'Dean Keaton'] },
{ c: 'Television', t: 3, q: 'Which sitcom is set behind the scenes of a live sketch show at 30 Rockefeller Plaza?', a: '30 Rock', d: ['Studio 60 on the Sunset Strip', 'The Larry Sanders Show', 'Sports Night'] },
{ c: 'Actors & Directors', t: 3, q: 'Which director made La Haine?', a: 'Mathieu Kassovitz', d: ['Jacques Audiard', 'Olivier Assayas', 'Cedric Klapisch'] },
{ c: 'Awards & Box Office', t: 3, q: 'Which Clint Eastwood western won Best Picture at the 1993 ceremony?', a: 'Unforgiven', d: ['Scent of a Woman', 'The Crying Game', 'A Few Good Men'] },
{ c: 'Behind the Scenes', t: 3, q: 'Whose critics developed the auteur theory in 1950s France?', a: 'Cahiers du Cinema', d: ['Positif', 'Sight & Sound', 'Film Comment'] },

{ c: 'Movies', t: 4, q: 'What are the conquistadors searching for in Aguirre, the Wrath of God?', a: 'El Dorado', d: ['The Fountain of Youth', 'The Northwest Passage', 'A lost mission'] },
{ c: 'Television', t: 4, q: 'Which HBO series was set in a lawless South Dakota mining camp in the 1870s?', a: 'Deadwood', d: ['Carnivale', 'Hell on Wheels', 'Godless'] },
{ c: 'Actors & Directors', t: 4, q: 'Which actor played the title role in Barry Lyndon?', a: "Ryan O'Neal", d: ['Malcolm McDowell', 'Keith Carradine', 'Michael York'] },
{ c: 'Awards & Box Office', t: 4, q: 'Which 1959 epic won eleven Academy Awards, the most of its decade?', a: 'Ben-Hur', d: ['The Bridge on the River Kwai', 'Around the World in 80 Days', 'Gigi'] },
{ c: 'Behind the Scenes', t: 4, q: 'Which effects supervisor led the motion-control and miniature work on the 1977 Star Wars?', a: 'John Dykstra', d: ['Douglas Trumbull', 'Ray Harryhausen', 'Dennis Muren'] },

{ c: 'Movies', t: 5, q: "What happens to the missing woman on the island in Antonioni's L'Avventura?", a: 'She vanishes and is never found', d: ['She drowns in view of the others', 'She is murdered by a fisherman', 'She elopes with a sailor'] },
{ c: 'Television', t: 5, q: 'What is the pub in EastEnders called?', a: 'The Queen Victoria', d: ['The Rovers Return', 'The Woolpack', 'The Bull'] },
{ c: 'Actors & Directors', t: 5, q: 'Which director made Tokyo Story and Late Spring?', a: 'Yasujiro Ozu', d: ['Mikio Naruse', 'Kenji Mizoguchi', 'Kon Ichikawa'] },
{ c: 'Awards & Box Office', t: 5, q: 'Who was the first Black performer to win an acting Academy Award?', a: 'Hattie McDaniel', d: ['Sidney Poitier', 'Dorothy Dandridge', 'Ethel Waters'] },
{ c: 'Behind the Scenes', t: 5, q: 'Which studio system practice bound a performer to one studio for years at a stretch?', a: 'The long-term contract', d: ['Block booking', 'Four-walling', 'Runaway production'] },
],

// ── Day 14 ─────────────────────────────────────────────────────────────────
[
{ c: 'Movies', t: 1, q: 'Which weapon do the Jedi carry in Star Wars?', a: 'A lightsaber', d: ['A blaster pistol', 'A bowcaster', 'A vibroblade'] },
{ c: 'Television', t: 1, q: 'Which animated series follows a nihilistic scientist and his anxious grandson between dimensions?', a: 'Rick and Morty', d: ['Futurama', 'Solar Opposites', 'Final Space'] },
{ c: 'Actors & Directors', t: 1, q: 'Which actress played Julia Child in Julie & Julia?', a: 'Meryl Streep', d: ['Diane Keaton', 'Glenn Close', 'Susan Sarandon'] },
{ c: 'Awards & Box Office', t: 1, q: 'How often are the Academy Awards held?', a: 'Once a year', d: ['Twice a year', 'Every two years', 'Every four years'] },
{ c: 'Behind the Scenes', t: 1, q: 'What is a cameo appearance?', a: 'A brief appearance by a well known person', d: ['The leading role', "A stunt double's shot", 'An uncredited crew credit'] },

{ c: 'Movies', t: 2, q: 'Which giant figure stomps through New York at the climax of Ghostbusters?', a: 'The Stay Puft Marshmallow Man', d: ['Gozer the Gorgon', 'A terror dog', 'Slimer'] },
{ c: 'Television', t: 2, q: 'Which HBO series follows the Roy family and their media empire?', a: 'Succession', d: ['Billions', 'Empire', 'Dynasty'] },
{ c: 'Actors & Directors', t: 2, q: 'Which director made Mad Max: Fury Road?', a: 'George Miller', d: ['Zack Snyder', 'Neill Blomkamp', 'Doug Liman'] },
{ c: 'Awards & Box Office', t: 2, q: 'Which film won Best Picture at the 2019 ceremony?', a: 'Green Book', d: ['Roma', 'BlacKkKlansman', 'Bohemian Rhapsody'] },
{ c: 'Behind the Scenes', t: 2, q: 'What does coverage mean on a film set?', a: 'Shooting a scene from several angles to give the editor choices', d: ['Marking where actors stand', 'Choosing the frame', 'Rigging the lights'] },

{ c: 'Movies', t: 3, q: "In The Truman Show, what falls out of the sky outside the hero's house near the start of the film?", a: 'A studio light', d: ['A weather balloon', 'A camera drone', 'A billboard'] },
{ c: 'Television', t: 3, q: 'Which sitcom frames its whole run as a father telling his children a very long story?', a: 'How I Met Your Mother', d: ['Friends', 'The Goldbergs', 'Modern Family'] },
{ c: 'Actors & Directors', t: 3, q: 'Which actress played the title role in Annie Hall?', a: 'Diane Keaton', d: ['Mia Farrow', 'Louise Lasser', 'Carrie Fisher'] },
{ c: 'Awards & Box Office', t: 3, q: 'Which film about an autistic savant and his brother won Best Picture at the 1989 ceremony?', a: 'Rain Man', d: ['Mississippi Burning', 'Working Girl', 'Dangerous Liaisons'] },
{ c: 'Behind the Scenes', t: 3, q: "What does a film's aspect ratio describe?", a: 'The proportion of image width to height', d: ['The frames shown each second', 'The focal length of the lens', 'The range that stays in focus'] },

{ c: 'Movies', t: 4, q: 'What cargo are the drivers hauling in The Wages of Fear?', a: 'Nitroglycerin', d: ['Gold bullion', 'Medicine', 'Crude oil'] },
{ c: 'Television', t: 4, q: 'Which 1980s series featured a talking car called KITT?', a: 'Knight Rider', d: ['The A-Team', 'Airwolf', 'Street Hawk'] },
{ c: 'Actors & Directors', t: 4, q: 'Which French director made Playtime and Mon Oncle?', a: 'Jacques Tati', d: ['Rene Clair', 'Pierre Etaix', 'Marcel Carne'] },
{ c: 'Awards & Box Office', t: 4, q: 'Which film about a divorce and custody fight won Best Picture at the 1980 ceremony?', a: 'Kramer vs. Kramer', d: ['Apocalypse Now', 'All That Jazz', 'Norma Rae'] },
{ c: 'Behind the Scenes', t: 4, q: 'Which 2002 release introduced Gollum, the breakthrough performance-captured digital character?', a: 'The Lord of the Rings: The Two Towers', d: ['Final Fantasy: The Spirits Within', 'Star Wars: The Phantom Menace', 'The Polar Express'] },

{ c: 'Movies', t: 5, q: 'Which event closes Carl Theodor Dreyer’s Ordet?', a: 'A resurrection', d: ['A wedding', 'A fire', 'A trial'] },
{ c: 'Television', t: 5, q: "Which 1990 British serial adapted Michael Dobbs's novel about a scheming chief whip?", a: 'House of Cards', d: ['Yes Minister', 'A Very British Coup', 'State of Play'] },
{ c: 'Actors & Directors', t: 5, q: 'Which cinematographer shot Persona and Cries and Whispers for Ingmar Bergman?', a: 'Sven Nykvist', d: ['Gunnar Fischer', 'Raoul Coutard', 'Henri Alekan'] },
{ c: 'Awards & Box Office', t: 5, q: 'Who was the first woman nominated for the Academy Award for Best Director?', a: 'Lina Wertmuller', d: ['Jane Campion', 'Sofia Coppola', 'Kathryn Bigelow'] },
{ c: 'Behind the Scenes', t: 5, q: 'What was Poverty Row in classic Hollywood?', a: 'The cluster of small studios making low-budget films', d: ['A backlot slum set', "The extras' union", 'A district of talent agents'] },
],

// ── Day 15 ─────────────────────────────────────────────────────────────────
[
{ c: 'Movies', t: 1, q: 'What is the family surname in The Incredibles?', a: 'Parr', d: ['Pine', 'Best', 'Stone'] },
{ c: 'Television', t: 1, q: 'Which series strands the survivors of a plane crash on a mysterious island?', a: 'Lost', d: ['The Leftovers', 'Manifest', 'Yellowjackets'] },
{ c: 'Actors & Directors', t: 1, q: 'Which actor voiced Buzz Lightyear in the Toy Story films?', a: 'Tim Allen', d: ['Tom Hanks', 'John Ratzenberger', 'Wallace Shawn'] },
{ c: 'Awards & Box Office', t: 1, q: 'What is a film that fails badly at the box office called?', a: 'A flop', d: ['A sleeper', 'A tentpole', 'A four-quadrant'] },
{ c: 'Behind the Scenes', t: 1, q: 'Which department builds prosthetics and fake wounds for a film?', a: 'Makeup effects', d: ['Art direction', 'Camera', 'Sound design'] },

{ c: 'Movies', t: 2, q: 'In which Los Angeles tower is John McClane trapped in Die Hard?', a: 'Nakatomi Plaza', d: ['The Chrysler Building', 'Century Tower', 'The Grand Hyatt'] },
{ c: 'Television', t: 2, q: "Which series about a Yorkshire veterinary practice is based on James Herriot's books?", a: 'All Creatures Great and Small', d: ['Heartbeat', 'Emmerdale', 'Doc Martin'] },
{ c: 'Actors & Directors', t: 2, q: 'Which director made Amelie?', a: 'Jean-Pierre Jeunet', d: ['Luc Besson', 'Cedric Klapisch', 'Michel Gondry'] },
{ c: 'Awards & Box Office', t: 2, q: 'Which film about newspaper reporters investigating the Catholic Church won Best Picture at the 2016 ceremony?', a: 'Spotlight', d: ['The Revenant', 'The Big Short', 'Room'] },
{ c: 'Behind the Scenes', t: 2, q: 'Which company bought Marvel Entertainment in 2009?', a: 'Disney', d: ['Warner Bros.', 'Sony', 'Universal'] },

{ c: 'Movies', t: 3, q: 'Which army do the condemned soldiers of Paths of Glory belong to?', a: 'The French', d: ['The German', 'The British', 'The Russian'] },
{ c: 'Television', t: 3, q: 'Which series follows a Miami forensic analyst who is secretly a serial killer?', a: 'Dexter', d: ['The Following', 'Hannibal', 'Bates Motel'] },
{ c: 'Actors & Directors', t: 3, q: 'Which director made In the Mood for Love?', a: 'Wong Kar-wai', d: ['Hou Hsiao-hsien', 'Edward Yang', 'Zhang Yimou'] },
{ c: 'Awards & Box Office', t: 3, q: 'Which film set partly in Elizabethan theatre won Best Picture at the 1999 ceremony?', a: 'Shakespeare in Love', d: ['Saving Private Ryan', 'Life Is Beautiful', 'Elizabeth'] },
{ c: 'Behind the Scenes', t: 3, q: 'What is a practical effect?', a: 'One achieved on set rather than added afterwards', d: ['One drawn frame by frame', 'A cheaply rendered digital effect', 'A sound created in post'] },

{ c: 'Movies', t: 4, q: 'What is the forbidden territory in Stalker called?', a: 'The Zone', d: ['The Room', 'The Perimeter', 'The Grey Belt'] },
{ c: 'Television', t: 4, q: 'Which 1960s British series paired the bowler-hatted John Steed with a series of partners?', a: 'The Avengers', d: ['The Saint', 'Danger Man', 'The Champions'] },
{ c: 'Actors & Directors', t: 4, q: 'Which actor played the silent hitman in Le Samourai?', a: 'Alain Delon', d: ['Jean-Paul Belmondo', 'Lino Ventura', 'Yves Montand'] },
{ c: 'Awards & Box Office', t: 4, q: 'Which director has won the Academy Award for Best Director four times, more than anyone else?', a: 'John Ford', d: ['Frank Capra', 'William Wyler', 'Steven Spielberg'] },
{ c: 'Behind the Scenes', t: 4, q: "Which director's 1985 film was recut by the studio into a version nicknamed the Love Conquers All edit?", a: 'Terry Gilliam', d: ['Ridley Scott', 'Michael Cimino', 'Orson Welles'] },

{ c: 'Movies', t: 5, q: 'Which creature is the central figure of Au Hasard Balthazar?', a: 'A donkey', d: ['A horse', 'A dog', 'A goat'] },
{ c: 'Television', t: 5, q: 'What was the cruise ship in The Love Boat called?', a: 'Pacific Princess', d: ['Island Princess', 'Sun Princess', 'Sea Princess'] },
{ c: 'Actors & Directors', t: 5, q: 'Which Soviet director made Come and See?', a: 'Elem Klimov', d: ['Larisa Shepitko', 'Andrei Konchalovsky', 'Aleksei German'] },
{ c: 'Awards & Box Office', t: 5, q: 'Which musical adapted from a Dickens novel won Best Picture at the 1969 ceremony?', a: 'Oliver!', d: ['Funny Girl', 'The Lion in Winter', 'Romeo and Juliet'] },
{ c: 'Behind the Scenes', t: 5, q: 'Which cinema sound format launched in 1992 with Batman Returns?', a: 'Dolby Digital', d: ['DTS', 'SDDS', 'THX'] },
],

// ── Day 16 ─────────────────────────────────────────────────────────────────
[
{ c: 'Movies', t: 1, q: 'What does Cinderella leave behind when she flees the ball?', a: 'A glass slipper', d: ['A silk glove', 'A pearl necklace', 'A silver mask'] },
{ c: 'Television', t: 1, q: 'Which cartoon cat and mouse have chased each other for decades with almost no dialogue?', a: 'Tom and Jerry', d: ['Road Runner and Wile E. Coyote', 'Sylvester and Tweety', 'Itchy and Scratchy'] },
{ c: 'Actors & Directors', t: 1, q: 'Which actor played Indiana Jones?', a: 'Harrison Ford', d: ['Tom Selleck', 'Kurt Russell', 'Sam Neill'] },
{ c: 'Awards & Box Office', t: 1, q: 'Which film festival is held each January in Park City, Utah?', a: 'Sundance', d: ['Telluride', 'Tribeca', 'South by Southwest'] },
{ c: 'Behind the Scenes', t: 1, q: 'Which stage of production follows the end of shooting?', a: 'Post-production', d: ['Pre-production', 'Principal photography', 'Development'] },

{ c: 'Movies', t: 2, q: 'What does the boy in The Sixth Sense say he sees?', a: 'Dead people', d: ['The future', 'Ghosts of animals', 'His own death'] },
{ c: 'Television', t: 2, q: 'Which series adapted a comic about survivors of a zombie apocalypse in Georgia?', a: 'The Walking Dead', d: ['Z Nation', 'Black Summer', 'The Last of Us'] },
{ c: 'Actors & Directors', t: 2, q: 'Which actress played Sarah Connor in The Terminator?', a: 'Linda Hamilton', d: ['Sigourney Weaver', 'Jamie Lee Curtis', 'Lea Thompson'] },
{ c: 'Awards & Box Office', t: 2, q: 'Which film about a rescue from Tehran won Best Picture at the 2013 ceremony?', a: 'Argo', d: ['Lincoln', 'Life of Pi', 'Zero Dark Thirty'] },
{ c: 'Behind the Scenes', t: 2, q: 'Which studio produced the Looney Tunes shorts?', a: 'Warner Bros.', d: ['MGM', 'Paramount', 'Universal'] },

{ c: 'Movies', t: 3, q: 'Which British officer insists on building the bridge in The Bridge on the River Kwai?', a: 'Colonel Nicholson', d: ['Colonel Saito', 'Commander Shears', 'Major Warden'] },
{ c: 'Television', t: 3, q: 'Which 1970s sitcom spun off from All in the Family and followed a family who moved to a Manhattan high-rise?', a: 'The Jeffersons', d: ['Good Times', 'Sanford and Son', 'Maude'] },
{ c: 'Actors & Directors', t: 3, q: 'Which German director made Fitzcarraldo and Aguirre, the Wrath of God?', a: 'Werner Herzog', d: ['Wim Wenders', 'Rainer Werner Fassbinder', 'Volker Schlondorff'] },
{ c: 'Awards & Box Office', t: 3, q: 'Which Boston crime drama won Best Picture at the 2007 ceremony?', a: 'The Departed', d: ['Little Miss Sunshine', 'Babel', 'The Queen'] },
{ c: 'Behind the Scenes', t: 3, q: 'What does method acting describe?', a: 'Drawing on personal emotion and immersion to build a role', d: ['Rehearsing only on camera', 'Speaking lines exactly as written', 'Improvising all dialogue'] },

{ c: 'Movies', t: 4, q: 'What orbits the planet in Solaris?', a: 'A research station', d: ['A prison ship', 'A cathedral', 'A mining rig'] },
{ c: 'Television', t: 4, q: 'Which drama followed the senior staff of a fictional American president named Josiah Bartlet?', a: 'The West Wing', d: ['Madam Secretary', 'Scandal', 'Commander in Chief'] },
{ c: 'Actors & Directors', t: 4, q: 'Which actress played the title role in the ruinously expensive 1963 epic Cleopatra?', a: 'Elizabeth Taylor', d: ['Ava Gardner', 'Sophia Loren', 'Deborah Kerr'] },
{ c: 'Awards & Box Office', t: 4, q: 'Which Best Picture win at the 2006 ceremony is still argued about as an upset over Brokeback Mountain?', a: 'Crash', d: ['Munich', 'Capote', 'Good Night, and Good Luck'] },
{ c: 'Behind the Scenes', t: 4, q: 'Which effects company did George Lucas found to make the first Star Wars?', a: 'Industrial Light & Magic', d: ['Weta Workshop', 'Digital Domain', 'Rhythm & Hues'] },

{ c: 'Movies', t: 5, q: 'In which city do the street children of Los Olvidados live?', a: 'Mexico City', d: ['Buenos Aires', 'Rio de Janeiro', 'Havana'] },
{ c: 'Television', t: 5, q: 'Which live 1950s anthology series first broadcast Twelve Angry Men?', a: 'Studio One', d: ['Playhouse 90', 'Kraft Television Theatre', 'The Philco Television Playhouse'] },
{ c: 'Actors & Directors', t: 5, q: 'Which eleven year old won a supporting Academy Award for The Piano?', a: 'Anna Paquin', d: ["Tatum O'Neal", 'Mary Badham', 'Quvenzhane Wallis'] },
{ c: 'Awards & Box Office', t: 5, q: 'Beginning with which film year did the Academy widen the Best Picture field beyond five nominees?', a: '2009', d: ['1999', '2005', '2013'] },
{ c: 'Behind the Scenes', t: 5, q: 'Which early 1950s process projected onto a deeply curved screen using three synchronized projectors?', a: 'Cinerama', d: ['CinemaScope', 'VistaVision', 'Todd-AO'] },
],

// ── Day 17 ─────────────────────────────────────────────────────────────────
[
{ c: 'Movies', t: 1, q: 'What kind of vehicle is Lightning McQueen in Cars?', a: 'A race car', d: ['A tow truck', 'A fire engine', 'A tractor'] },
{ c: 'Television', t: 1, q: 'Which quiz show gave contestants lifelines including a call to a friend?', a: 'Who Wants to Be a Millionaire?', d: ['The Weakest Link', 'Deal or No Deal', 'Jeopardy!'] },
{ c: 'Actors & Directors', t: 1, q: 'Which actress played Vivian in Pretty Woman?', a: 'Julia Roberts', d: ['Meg Ryan', 'Demi Moore', 'Andie MacDowell'] },
{ c: 'Awards & Box Office', t: 1, q: 'Which Academy Award category honors the best film not in the English language?', a: 'Best International Feature Film', d: ['Best Foreign Director', 'Best World Cinema', 'Best Global Picture'] },
{ c: 'Behind the Scenes', t: 1, q: 'Who calls action and cut on a film set?', a: 'The director', d: ['The producer', 'The cinematographer', 'The editor'] },

{ c: 'Movies', t: 2, q: 'In Jumanji, what do two children find in the attic that unleashes a jungle on their town?', a: 'A board game', d: ['A comic book', 'A music box', 'A brass telescope'] },
{ c: 'Television', t: 2, q: "Which BBC series moved Conan Doyle's consulting detective into present-day London?", a: 'Sherlock', d: ['Elementary', 'Endeavour', 'Luther'] },
{ c: 'Actors & Directors', t: 2, q: 'Which director made Boyhood, shooting it over twelve years?', a: 'Richard Linklater', d: ['Kelly Reichardt', 'Andrew Haigh', 'Jeff Nichols'] },
{ c: 'Awards & Box Office', t: 2, q: "Which film about a British monarch's speech therapy won Best Picture at the 2011 ceremony?", a: "The King's Speech", d: ['The Social Network', 'Black Swan', 'Inception'] },
{ c: 'Behind the Scenes', t: 2, q: 'What is stop motion animation?', a: 'Photographing physical models one frame at a time', d: ['Drawing directly onto the film strip', 'Freezing a live-action frame', 'Rendering models inside a computer'] },

{ c: 'Movies', t: 3, q: 'What does the recovered statuette turn out to be made of in The Maltese Falcon?', a: 'Lead', d: ['Gold', 'Jade', 'Ivory'] },
{ c: 'Television', t: 3, q: 'Which sitcom was set at a struggling rock radio station in Ohio?', a: 'WKRP in Cincinnati', d: ['NewsRadio', 'Frasier', 'The Bob Newhart Show'] },
{ c: 'Actors & Directors', t: 3, q: 'Which director made The Battle of Algiers?', a: 'Gillo Pontecorvo', d: ['Francesco Rosi', 'Elio Petri', 'Roberto Rossellini'] },
{ c: 'Awards & Box Office', t: 3, q: 'Which Vietnam film won Best Picture at the 1987 ceremony?', a: 'Platoon', d: ['Hannah and Her Sisters', 'A Room with a View', 'Children of a Lesser God'] },
{ c: 'Behind the Scenes', t: 3, q: 'Which term covers everything arranged within the frame: sets, costume, lighting and blocking?', a: 'Mise-en-scene', d: ['Montage', 'Continuity', 'Coverage'] },

{ c: 'Movies', t: 4, q: 'What does the dying bureaucrat in Ikiru set out to build?', a: "A children's playground", d: ['A hospital wing', 'A school', 'A shrine'] },
{ c: 'Television', t: 4, q: 'Which 1980s series paired the detectives Crockett and Tubbs in Florida?', a: 'Miami Vice', d: ['Hunter', 'Hill Street Blues', 'Simon & Simon'] },
{ c: 'Actors & Directors', t: 4, q: 'Which director made Rome, Open City?', a: 'Roberto Rossellini', d: ['Vittorio De Sica', 'Luchino Visconti', 'Giuseppe De Santis'] },
{ c: 'Awards & Box Office', t: 4, q: 'Which musical about a Cockney flower seller won Best Picture at the 1965 ceremony?', a: 'My Fair Lady', d: ['Mary Poppins', 'Dr. Strangelove', 'Zorba the Greek'] },
{ c: 'Behind the Scenes', t: 4, q: 'What is a platform release?', a: 'Opening in a few cinemas first and widening if it works', d: ['Opening everywhere on the same day', 'Renting a cinema outright', 'Touring with reserved seats'] },

{ c: 'Movies', t: 5, q: 'What dominates the visual style of The Passion of Joan of Arc?', a: 'Close-ups of faces', d: ['Long tracking shots', 'Deep-focus wide shots', 'Handheld camera'] },
{ c: 'Television', t: 5, q: 'Which 1960s spy series pitted its agents against an organization called THRUSH?', a: 'The Man from U.N.C.L.E.', d: ['Get Smart', 'I Spy', 'Mission: Impossible'] },
{ c: 'Actors & Directors', t: 5, q: 'Which actress starred in Jeanne Dielman?', a: 'Delphine Seyrig', d: ['Anna Karina', 'Bulle Ogier', 'Stephane Audran'] },
{ c: 'Awards & Box Office', t: 5, q: 'Who became the first performer to win Best Actress for a role played in another language?', a: 'Sophia Loren', d: ['Anna Magnani', 'Simone Signoret', 'Marion Cotillard'] },
{ c: 'Behind the Scenes', t: 5, q: 'Which company created the THX cinema certification standard in 1983?', a: 'Lucasfilm', d: ['Dolby', 'Sony', 'IMAX'] },
],

// ── Day 18 ─────────────────────────────────────────────────────────────────
[
{ c: 'Movies', t: 1, q: 'What lifts the house into the sky in Up?', a: 'Balloons', d: ['A crane', 'A hot air burner', 'A tornado'] },
{ c: 'Television', t: 1, q: 'Which variety series starred Kermit the Frog and Miss Piggy?', a: 'The Muppet Show', d: ['Sesame Street', 'Fraggle Rock', 'Bear in the Big Blue House'] },
{ c: 'Actors & Directors', t: 1, q: 'Which actor played Thor in the Marvel films?', a: 'Chris Hemsworth', d: ['Chris Evans', 'Chris Pratt', 'Tom Hiddleston'] },
{ c: 'Awards & Box Office', t: 1, q: 'What is the top prize at the Venice Film Festival called?', a: 'The Golden Lion', d: ['The Golden Bear', "The Palme d'Or", 'The Silver Shell'] },
{ c: 'Behind the Scenes', t: 1, q: 'Which document sets out every scene, line and action before a film is shot?', a: 'The screenplay', d: ['The call sheet', 'The shot list', 'The continuity report'] },

{ c: 'Movies', t: 2, q: 'Which character tells Luke there is no try, only do or do not?', a: 'Yoda', d: ['Obi-Wan Kenobi', 'Darth Vader', 'Han Solo'] },
{ c: 'Television', t: 2, q: 'Which series follows the Dutton family and their Montana ranch?', a: 'Yellowstone', d: ['Longmire', 'Justified', 'Hell on Wheels'] },
{ c: 'Actors & Directors', t: 2, q: 'Which director made Black Swan and Requiem for a Dream?', a: 'Darren Aronofsky', d: ['David Fincher', 'Gaspar Noe', 'Nicolas Winding Refn'] },
{ c: 'Awards & Box Office', t: 2, q: 'Which film about people living out of vans won Best Picture at the 2021 ceremony?', a: 'Nomadland', d: ['The Trial of the Chicago 7', 'Minari', 'Mank'] },
{ c: 'Behind the Scenes', t: 2, q: 'What does IMAX primarily describe?', a: 'A large-format film and projection system', d: ['A digital sound format', 'A camera manufacturer', 'A color grading process'] },

{ c: 'Movies', t: 3, q: 'What triggers the brainwashed soldier in The Manchurian Candidate?', a: 'The queen of diamonds playing card', d: ['A telephone ringing', 'A particular song', 'A red scarf'] },
{ c: 'Television', t: 3, q: 'Which British comedy followed a minister and his obstructive permanent secretary in Whitehall?', a: 'Yes Minister', d: ['The Thick of It', 'Drop the Dead Donkey', 'The New Statesman'] },
{ c: 'Actors & Directors', t: 3, q: 'Which director made The Magnificent Seven, the western remake of Seven Samurai?', a: 'John Sturges', d: ['Howard Hawks', 'Delmer Daves', 'Budd Boetticher'] },
{ c: 'Awards & Box Office', t: 3, q: 'Which film set on a colonial Kenyan coffee farm won Best Picture at the 1986 ceremony?', a: 'Out of Africa', d: ['The Color Purple', 'Witness', "Prizzi's Honor"] },
{ c: 'Behind the Scenes', t: 3, q: 'What is the Academy ratio?', a: 'The roughly four by three frame standard of classic Hollywood', d: ['The ratio of nominees to winners', 'The share of takings paid to cinemas', 'The ratio of footage shot to footage used'] },

{ c: 'Movies', t: 4, q: 'What is the profession of the title character in Nights of Cabiria?', a: 'A prostitute', d: ['A dancer', 'A seamstress', 'A market trader'] },
{ c: 'Television', t: 4, q: 'Which series was set in a womens prison called Litchfield?', a: 'Orange Is the New Black', d: ['Oz', 'Wentworth', 'Prison Break'] },
{ c: 'Actors & Directors', t: 4, q: 'Chaplin plays the dictator in The Great Dictator, and which other role?', a: 'A Jewish barber', d: ['A newsreel narrator', 'A field marshal', 'An ambassador'] },
{ c: 'Awards & Box Office', t: 4, q: 'Which film about prisoners of war in Burma won Best Picture at the 1958 ceremony?', a: 'The Bridge on the River Kwai', d: ['Peyton Place', 'Sayonara', 'Witness for the Prosecution'] },
{ c: 'Behind the Scenes', t: 4, q: "Which composer wrote the scores for Star Wars, Jaws and Schindler's List?", a: 'John Williams', d: ['Jerry Goldsmith', 'James Horner', 'Ennio Morricone'] },

{ c: 'Movies', t: 5, q: 'Which war separates the lovers in The Cranes Are Flying?', a: 'The Second World War', d: ['The Russian Civil War', 'The First World War', 'The Crimean War'] },
{ c: 'Television', t: 5, q: "Which 1963 British series opened with two teachers following a pupil into a junkyard?", a: 'Doctor Who', d: ['The Quatermass Experiment', 'A for Andromeda', 'Out of the Unknown'] },
{ c: 'Actors & Directors', t: 5, q: 'Which director made Wings of Desire?', a: 'Wim Wenders', d: ['Werner Herzog', 'Rainer Werner Fassbinder', 'Margarethe von Trotta'] },
{ c: 'Awards & Box Office', t: 5, q: 'Which Jean Renoir film was the first in a language other than English nominated for Best Picture?', a: 'Grand Illusion', d: ['Bicycle Thieves', 'Z', 'Cries and Whispers'] },
{ c: 'Behind the Scenes', t: 5, q: 'Which newspaper magnate tried to have Citizen Kane suppressed before release?', a: 'William Randolph Hearst', d: ['Joseph Pulitzer', 'Robert McCormick', 'Henry Luce'] },
],

// ── Day 19 ─────────────────────────────────────────────────────────────────
[
{ c: 'Movies', t: 1, q: 'Which animal dreams of becoming a chef in Ratatouille?', a: 'A rat', d: ['A mouse', 'A raccoon', 'A hedgehog'] },
{ c: 'Television', t: 1, q: 'Which singing competition did Simon Cowell judge from its 2002 debut, alongside Paula Abdul and Randy Jackson?', a: 'American Idol', d: ['The Voice', 'The X Factor', 'Star Search'] },
{ c: 'Actors & Directors', t: 1, q: 'Which actor played Jack Dawson in Titanic?', a: 'Leonardo DiCaprio', d: ['Matt Damon', 'Brad Pitt', 'Ben Affleck'] },
{ c: 'Awards & Box Office', t: 1, q: 'What is it called when a film opens in cinemas and on streaming the same day?', a: 'A day-and-date release', d: ['A platform release', 'A limited release', 'A road show'] },
{ c: 'Behind the Scenes', t: 1, q: 'Which crew member assembles the footage into the finished film?', a: 'The editor', d: ['The gaffer', 'The grip', 'The producer'] },

{ c: 'Movies', t: 2, q: 'Which Corleone son is gunned down at a highway toll booth in The Godfather?', a: 'Sonny', d: ['Fredo', 'Michael', 'Tom Hagen'] },
{ c: 'Television', t: 2, q: "Which comedy follows the awful owners of a Philadelphia bar called Paddy's Pub?", a: "It's Always Sunny in Philadelphia", d: ['Cheers', 'Brooklyn Nine-Nine', 'The League'] },
{ c: 'Actors & Directors', t: 2, q: 'Which actress won an Academy Award for Monster?', a: 'Charlize Theron', d: ['Naomi Watts', 'Diane Lane', 'Salma Hayek'] },
{ c: 'Awards & Box Office', t: 2, q: 'Which film about a mute cleaner and an amphibian creature won Best Picture at the 2018 ceremony?', a: 'The Shape of Water', d: ['Three Billboards Outside Ebbing, Missouri', 'Get Out', 'Dunkirk'] },
{ c: 'Behind the Scenes', t: 2, q: 'Which streaming service released Roma, its first Best Picture nominee?', a: 'Netflix', d: ['Amazon Prime Video', 'Hulu', 'Apple TV+'] },

{ c: 'Movies', t: 3, q: 'Which business is at the center of the conflict in Do the Right Thing?', a: 'A pizzeria', d: ['A grocery store', 'A barber shop', 'A laundromat'] },
{ c: 'Television', t: 3, q: 'Which medical drama set in a Chicago emergency room ran for fifteen seasons from 1994?', a: 'ER', d: ['Chicago Hope', 'St. Elsewhere', "Grey's Anatomy"] },
{ c: 'Actors & Directors', t: 3, q: 'Which director made Umberto D. and Bicycle Thieves?', a: 'Vittorio De Sica', d: ['Roberto Rossellini', 'Luchino Visconti', 'Cesare Zavattini'] },
{ c: 'Awards & Box Office', t: 3, q: 'Which film about a New York narcotics detective won Best Picture at the 1972 ceremony?', a: 'The French Connection', d: ['A Clockwork Orange', 'The Last Picture Show', 'Fiddler on the Roof'] },
{ c: 'Behind the Scenes', t: 3, q: 'Which crew member runs the set day to day and keeps the shooting schedule?', a: 'The first assistant director', d: ['The line producer', 'The unit publicist', 'The script supervisor'] },

{ c: 'Movies', t: 4, q: 'Which art form consumes the heroine of The Red Shoes?', a: 'Ballet', d: ['Opera', 'Painting', 'The violin'] },
{ c: 'Television', t: 4, q: 'Which HBO series followed a family who ran a funeral home?', a: 'Six Feet Under', d: ['Big Love', 'In Treatment', 'Enlightened'] },
{ c: 'Actors & Directors', t: 4, q: 'Which actor directed and starred in The Two Jakes, the sequel to Chinatown?', a: 'Jack Nicholson', d: ['Robert Towne', 'Warren Beatty', 'Harvey Keitel'] },
{ c: 'Awards & Box Office', t: 4, q: 'Which film set partly in the North African desert won Best Picture at the 1997 ceremony?', a: 'The English Patient', d: ['Fargo', 'Jerry Maguire', 'Shine'] },
{ c: 'Behind the Scenes', t: 4, q: 'What is a plate in visual effects work?', a: 'Background footage that other elements are composited onto', d: ['A board naming the take', 'A reel of assembled dailies', 'A printed frame used for reference'] },

{ c: 'Movies', t: 5, q: 'In which Indian region is the village of Pather Panchali set?', a: 'Bengal', d: ['Kerala', 'Punjab', 'Rajasthan'] },
{ c: 'Television', t: 5, q: 'Which series gave the world the phrase about jumping the shark?', a: 'Happy Days', d: ['Laverne & Shirley', 'Mork & Mindy', "Three's Company"] },
{ c: 'Actors & Directors', t: 5, q: 'Which actress starred in Jules and Jim?', a: 'Jeanne Moreau', d: ['Anna Karina', 'Delphine Seyrig', 'Emmanuelle Riva'] },
{ c: 'Awards & Box Office', t: 5, q: 'Which Billy Wilder film about an alcoholic writer won Best Picture at the 1946 ceremony?', a: 'The Lost Weekend', d: ["The Bells of St. Mary's", 'Mildred Pierce', 'Spellbound'] },
{ c: 'Behind the Scenes', t: 5, q: "Which Abel Gance silent epic did Kevin Brownlow spend decades restoring?", a: 'Napoleon', d: ['Metropolis', 'Intolerance', 'Greed'] },
],

// ── Day 20 ─────────────────────────────────────────────────────────────────
[
{ c: 'Movies', t: 1, q: 'What do the monsters harvest from children at the start of Monsters, Inc.?', a: 'Screams', d: ['Laughter', 'Dreams', 'Memories'] },
{ c: 'Television', t: 1, q: 'Which sitcom followed the awful Bundy family of Chicago?', a: 'Married... with Children', d: ['Roseanne', 'The Simpsons', 'Family Matters'] },
{ c: 'Actors & Directors', t: 1, q: 'Which actress played Mary Poppins in the 1964 film?', a: 'Julie Andrews', d: ['Audrey Hepburn', 'Debbie Reynolds', 'Angela Lansbury'] },
{ c: 'Awards & Box Office', t: 1, q: "What is the trade term for a film's earnings from cinemas outside its home country?", a: 'The international gross', d: ['The net rental', 'The theatrical spend', 'The residual'] },
{ c: 'Behind the Scenes', t: 1, q: 'What does a stunt double do?', a: "Takes the actor's place in dangerous shots", d: ['Stands in during rehearsal only', 'Operates a second camera', 'Records dialogue in post'] },

{ c: 'Movies', t: 2, q: 'Which candy does Elliott use to lure the alien in E.T.?', a: "Reese's Pieces", d: ["M&M's", 'Skittles', 'Smarties'] },
{ c: 'Television', t: 2, q: 'Which series follows the Pearson family across several decades at once?', a: 'This Is Us', d: ['Parenthood', 'Brothers & Sisters', 'Friday Night Lights'] },
{ c: 'Actors & Directors', t: 2, q: 'Which director made Arrival and Blade Runner 2049?', a: 'Denis Villeneuve', d: ['Christopher Nolan', 'Alex Garland', 'Duncan Jones'] },
{ c: 'Awards & Box Office', t: 2, q: 'Which film built to look like one continuous take won Best Picture at the 2015 ceremony?', a: 'Birdman', d: ['Boyhood', 'The Grand Budapest Hotel', 'Whiplash'] },
{ c: 'Behind the Scenes', t: 2, q: "Which country's Hindi-language film industry is nicknamed Bollywood?", a: 'India', d: ['Nigeria', 'Pakistan', 'Brazil'] },

{ c: 'Movies', t: 3, q: 'What is celebrated about the opening of Touch of Evil?', a: 'A long unbroken crane shot', d: ['A silent montage', 'A freeze frame', 'A split screen'] },
{ c: 'Television', t: 3, q: 'Which detective series followed an Oxford policeman fond of opera, crosswords and real ale?', a: 'Inspector Morse', d: ['A Touch of Frost', 'Midsomer Murders', 'Bergerac'] },
{ c: 'Actors & Directors', t: 3, q: 'Which actor starred as the chain gang prisoner in Cool Hand Luke?', a: 'Paul Newman', d: ['Steve McQueen', 'George Kennedy', 'Robert Redford'] },
{ c: 'Awards & Box Office', t: 3, q: 'Which film about veterans from a Pennsylvania steel town won Best Picture at the 1979 ceremony?', a: 'The Deer Hunter', d: ['Coming Home', 'Midnight Express', 'Heaven Can Wait'] },
{ c: 'Behind the Scenes', t: 3, q: 'What is a boom operator responsible for?', a: 'Holding the microphone just out of frame', d: ['Working the camera crane', 'Rigging the lights', 'Laying dolly track'] },

{ c: 'Movies', t: 4, q: 'What is the profession of the woman being investigated in Klute?', a: 'A call girl', d: ['A nurse', 'A flight attendant', 'A fashion model'] },
{ c: 'Television', t: 4, q: 'Which 2004 remake followed the last survivors of a nuclear attack fleeing the Cylons?', a: 'Battlestar Galactica', d: ['Caprica', 'Firefly', 'Stargate Universe'] },
{ c: 'Actors & Directors', t: 4, q: 'Which Austrian director made The Seventh Continent and Amour?', a: 'Michael Haneke', d: ['Ulrich Seidl', 'Christian Petzold', 'Jessica Hausner'] },
{ c: 'Awards & Box Office', t: 4, q: 'Which film about Mozart and his jealous rival won Best Picture at the 1985 ceremony?', a: 'Amadeus', d: ['The Killing Fields', 'A Passage to India', 'Places in the Heart'] },
{ c: 'Behind the Scenes', t: 4, q: 'Which union strike shut down American film and television production across the 2007 and 2008 season?', a: 'The Writers Guild strike', d: ['The Teamsters strike', 'The Screen Actors Guild strike', 'The Directors Guild strike'] },

{ c: 'Movies', t: 5, q: 'Which country did Carl Theodor Dreyer, the director of Vampyr, come from?', a: 'Denmark', d: ['Sweden', 'Norway', 'Germany'] },
{ c: 'Television', t: 5, q: 'Which 1980s British drama followed a gang of bricklayers working in Germany?', a: 'Auf Wiedersehen, Pet', d: ['Boys from the Blackstuff', 'Minder', 'The Beiderbecke Affair'] },
{ c: 'Actors & Directors', t: 5, q: 'Which actor appeared in film after film for Yasujiro Ozu, including Tokyo Story?', a: 'Chishu Ryu', d: ['Toshiro Mifune', 'Takashi Shimura', 'Masayuki Mori'] },
{ c: 'Awards & Box Office', t: 5, q: 'How many Academy Awards did Citizen Kane win?', a: 'One', d: ['Two', 'Four', 'Nine'] },
{ c: 'Behind the Scenes', t: 5, q: 'What was a nickelodeon?', a: 'An early storefront cinema charging five cents', d: ["A studio's private screening room", 'A hand-cranked home projector', 'A theater organ'] },
],

// ── Day 21 ─────────────────────────────────────────────────────────────────
[
{ c: 'Movies', t: 1, q: "In Disney's The Little Mermaid, what does Ariel trade away to become human?", a: 'Her voice', d: ['Her hair', 'Her memories', 'Her name'] },
{ c: 'Television', t: 1, q: 'Which preschool series features an animated puppy and a host who hunts for paw prints?', a: "Blue's Clues", d: ['Dora the Explorer', 'Bear in the Big Blue House', 'Barney & Friends'] },
{ c: 'Actors & Directors', t: 1, q: "Which actor played Batman in Tim Burton's 1989 film?", a: 'Michael Keaton', d: ['Val Kilmer', 'George Clooney', 'Christian Bale'] },
{ c: 'Awards & Box Office', t: 1, q: 'Which Academy Award category honors the person who photographed the film?', a: 'Best Cinematography', d: ['Best Production Design', 'Best Film Editing', 'Best Visual Effects'] },
{ c: 'Behind the Scenes', t: 1, q: 'What is a reboot of a film series?', a: 'A fresh start that sets aside the earlier continuity', d: ['A shot-for-shot copy', 'A re-release in a new format', 'A sequel set immediately after'] },

{ c: 'Movies', t: 2, q: "What does Forrest Gump's mother compare life to?", a: 'A box of chocolates', d: ['A long road', 'A river', 'A game of cards'] },
{ c: 'Television', t: 2, q: 'Which sitcom followed a New York stand-up comedian and his friends and was famously about nothing?', a: 'Seinfeld', d: ['Curb Your Enthusiasm', 'Louie', 'Mad About You'] },
{ c: 'Actors & Directors', t: 2, q: 'Which director made There Will Be Blood and Boogie Nights?', a: 'Paul Thomas Anderson', d: ['Wes Anderson', 'Alexander Payne', 'Todd Haynes'] },
{ c: 'Awards & Box Office', t: 2, q: 'Which adaptation of a Cormac McCarthy novel won Best Picture at the 2008 ceremony?', a: 'No Country for Old Men', d: ['There Will Be Blood', 'Michael Clayton', 'Atonement'] },
{ c: 'Behind the Scenes', t: 2, q: 'Which piece of equipment lets a camera glide smoothly along laid track?', a: 'A dolly', d: ['A jib', 'A gimbal', 'A crane'] },

{ c: 'Movies', t: 3, q: 'What is Eve Harrington after in All About Eve?', a: 'The place of an ageing stage star', d: ['A marriage to a producer', 'A directing job', 'A contract at the Met'] },
{ c: 'Television', t: 3, q: 'Which Happy Days spin-off followed two women working at a Milwaukee brewery?', a: 'Laverne & Shirley', d: ['Mork & Mindy', 'Joanie Loves Chachi', 'Alice'] },
{ c: 'Actors & Directors', t: 3, q: 'Which actress won Academy Awards for both Klute and Coming Home?', a: 'Jane Fonda', d: ['Faye Dunaway', 'Ellen Burstyn', 'Glenda Jackson'] },
{ c: 'Awards & Box Office', t: 3, q: 'Which film about a Philadelphia boxer won Best Picture at the 1977 ceremony?', a: 'Rocky', d: ['Taxi Driver', 'Network', "All the President's Men"] },
{ c: 'Behind the Scenes', t: 3, q: 'Which single-strip color process displaced three-strip Technicolor in the 1950s?', a: 'Eastmancolor', d: ['Agfacolor', 'Cinecolor', 'Trucolor'] },

{ c: 'Movies', t: 4, q: "What is tattooed across the preacher's knuckles in The Night of the Hunter?", a: 'LOVE and HATE', d: ['GOOD and EVIL', 'LIFE and DEATH', 'HOPE and FEAR'] },
{ c: 'Television', t: 4, q: 'Which anthology series tells a different Minnesota crime story each season, taking its name from a Coen brothers film?', a: 'Fargo', d: ['True Detective', 'American Crime Story', 'Mindhunter'] },
{ c: 'Actors & Directors', t: 4, q: 'Which Danish director made The Passion of Joan of Arc?', a: 'Carl Theodor Dreyer', d: ['Victor Sjostrom', 'Abel Gance', 'Jean Epstein'] },
{ c: 'Awards & Box Office', t: 4, q: 'Which film about T. E. Lawrence won Best Picture at the 1963 ceremony?', a: 'Lawrence of Arabia', d: ['To Kill a Mockingbird', 'The Music Man', 'Mutiny on the Bounty'] },
{ c: 'Behind the Scenes', t: 4, q: 'Which sound man coined the job title sound designer while working on Apocalypse Now?', a: 'Walter Murch', d: ['Ben Burtt', 'Gary Rydstrom', 'Randy Thom'] },

{ c: 'Movies', t: 5, q: 'What fate are the children sold into in Sansho the Bailiff?', a: 'Slavery', d: ['The army', 'A monastery', 'An arranged marriage'] },
{ c: 'Television', t: 5, q: 'Which American sitcom was adapted from the British series Till Death Us Do Part?', a: 'All in the Family', d: ['Sanford and Son', "Three's Company", 'Too Close for Comfort'] },
{ c: 'Actors & Directors', t: 5, q: 'Which actor played the title role in Eisenstein’s Ivan the Terrible?', a: 'Nikolai Cherkasov', d: ['Boris Andreyev', 'Mikhail Zharov', 'Andrei Abrikosov'] },
{ c: 'Awards & Box Office', t: 5, q: 'In which year was the Academy Awards ceremony first broadcast in color?', a: '1966', d: ['1959', '1971', '1975'] },
{ c: 'Behind the Scenes', t: 5, q: 'What was block booking?', a: 'Forcing cinemas to take a bundle of films to get the one they wanted', d: ['Selling advance tickets in blocks', "Reserving a studio's stages", 'Signing actors for several films at once'] },
],

// ── Day 22 ─────────────────────────────────────────────────────────────────
[
{ c: 'Movies', t: 1, q: "Which animal is Shrek's talkative travelling companion?", a: 'A donkey', d: ['A cat', 'A dragon', 'A gingerbread man'] },
{ c: 'Television', t: 1, q: 'Which comedy follows a once wealthy family who lose everything and move to a small town they bought as a joke?', a: "Schitt's Creek", d: ["Kim's Convenience", 'Corner Gas', 'Letterkenny'] },
{ c: 'Actors & Directors', t: 1, q: 'Which actress played Dorothy in The Wizard of Oz?', a: 'Judy Garland', d: ['Shirley Temple', 'Deanna Durbin', 'Jane Powell'] },
{ c: 'Awards & Box Office', t: 1, q: 'What color is the carpet traditionally rolled out for arrivals at the Academy Awards?', a: 'Red', d: ['Gold', 'Blue', 'Black'] },
{ c: 'Behind the Scenes', t: 1, q: 'Which department is responsible for a film’s sets, props and dressing?', a: 'The art department', d: ['Camera', 'Sound', 'Locations'] },

{ c: 'Movies', t: 2, q: "What name is written on the bottom of Woody's boot in Toy Story?", a: 'Andy', d: ['Sid', 'Buzz', 'Bo'] },
{ c: 'Television', t: 2, q: 'Which HBO series adapted the novels of George R. R. Martin?', a: 'Game of Thrones', d: ['The Witcher', 'Shadow and Bone', 'The Wheel of Time'] },
{ c: 'Actors & Directors', t: 2, q: 'Which director made Roma and Gravity?', a: 'Alfonso Cuaron', d: ['Guillermo del Toro', 'Alejandro G. Inarritu', 'Carlos Reygadas'] },
{ c: 'Awards & Box Office', t: 2, q: 'Which film about the physicist who led the Manhattan Project won Best Picture at the 2024 ceremony?', a: 'Oppenheimer', d: ['Barbie', 'Killers of the Flower Moon', 'Poor Things'] },
{ c: 'Behind the Scenes', t: 2, q: 'What is the work of performing a character’s lines for an animated film called?', a: 'Voice acting', d: ['Dubbing', 'Looping', 'Playback'] },

{ c: 'Movies', t: 3, q: 'What does the insurance clerk in The Apartment get in return for lending out his home?', a: 'Promotions at work', d: ['Cash payments', 'A company car', 'A share of the rent'] },
{ c: 'Television', t: 3, q: 'Which British sitcom followed two brothers selling dodgy goods out of a Peckham flat?', a: 'Only Fools and Horses', d: ['Steptoe and Son', 'Minder', 'Birds of a Feather'] },
{ c: 'Actors & Directors', t: 3, q: 'Which actress won Best Actress for Silver Linings Playbook?', a: 'Jennifer Lawrence', d: ['Emma Stone', 'Anne Hathaway', 'Amy Adams'] },
{ c: 'Awards & Box Office', t: 3, q: 'Which film about the Indian independence leader won Best Picture at the 1983 ceremony?', a: 'Gandhi', d: ['E.T. the Extra-Terrestrial', 'Tootsie', 'The Verdict'] },
{ c: 'Behind the Scenes', t: 3, q: 'What is a second unit?', a: 'A crew filming inserts, stunts and scenery apart from the main shoot', d: ['The editing team', 'The publicity department', 'The understudy cast'] },

{ c: 'Movies', t: 4, q: 'Where do the outlaws flee to in The Wild Bunch?', a: 'Into Mexico', d: ['Into Canada', 'Into Bolivia', 'Into Cuba'] },
{ c: 'Television', t: 4, q: 'Which 1971 series followed the Bellamy family and their servants at 165 Eaton Place?', a: 'Upstairs, Downstairs', d: ['The Duchess of Duke Street', 'The Forsyte Saga', 'The Pallisers'] },
{ c: 'Actors & Directors', t: 4, q: 'Which actor played the Man with No Name in the Sergio Leone dollars trilogy?', a: 'Clint Eastwood', d: ['Lee Van Cleef', 'Charles Bronson', 'Franco Nero'] },
{ c: 'Awards & Box Office', t: 4, q: 'Which biography of a wartime American general won Best Picture at the 1971 ceremony?', a: 'Patton', d: ['Airport', 'Love Story', 'Five Easy Pieces'] },
{ c: 'Behind the Scenes', t: 4, q: 'Which 1995 manifesto banned added lighting, imported props and non-diegetic music?', a: 'Dogme 95', d: ['Italian neorealism', 'The French New Wave', 'Cinema Novo'] },

{ c: 'Movies', t: 5, q: 'Which tinned fruit does the lovesick policeman keep buying in Chungking Express?', a: 'Pineapple', d: ['Peaches', 'Lychees', 'Mandarins'] },
{ c: 'Television', t: 5, q: 'Which Gerry Anderson puppet series followed the Tracy brothers and International Rescue?', a: 'Thunderbirds', d: ['Stingray', 'Captain Scarlet', 'Joe 90'] },
{ c: 'Actors & Directors', t: 5, q: 'Which director made Ugetsu and Sansho the Bailiff?', a: 'Kenji Mizoguchi', d: ['Yasujiro Ozu', 'Mikio Naruse', 'Masaki Kobayashi'] },
{ c: 'Awards & Box Office', t: 5, q: 'Which was the last largely black and white film to win Best Picture before The Artist?', a: "Schindler's List", d: ['The Apartment', 'Manhattan', 'Raging Bull'] },
{ c: 'Behind the Scenes', t: 5, q: 'What was the Motion Picture Patents Company, formed in 1908?', a: 'A trust controlling film patents and distribution', d: ['The first talent agency', 'A national cinema chain', 'A censorship board'] },
],

// ── Day 23 ─────────────────────────────────────────────────────────────────
[
{ c: 'Movies', t: 1, q: "How many wishes does the Genie grant in Disney's Aladdin?", a: 'Three', d: ['Two', 'Five', 'Seven'] },
{ c: 'Television', t: 1, q: 'Which animated series is set in the undersea town of Bikini Bottom?', a: 'SpongeBob SquarePants', d: ['The Fairly OddParents', 'Rugrats', "Hey Arnold!"] },
{ c: 'Actors & Directors', t: 1, q: 'Which actor played Marty McFly in Back to the Future?', a: 'Michael J. Fox', d: ['Eric Stoltz', 'Crispin Glover', 'Corey Feldman'] },
{ c: 'Awards & Box Office', t: 1, q: 'What is a film that quietly becomes a hit long after opening called?', a: 'A sleeper', d: ['A tentpole', 'A flop', 'A four-quadrant'] },
{ c: 'Behind the Scenes', t: 1, q: 'Which crew member keeps track of continuity between shots?', a: 'The script supervisor', d: ['The gaffer', 'The best boy', 'The location manager'] },

{ c: 'Movies', t: 2, q: 'Which island town is terrorised in Jaws?', a: 'Amity', d: ['Nantucket', 'Innsmouth', 'Provincetown'] },
{ c: 'Television', t: 2, q: 'Which series followed FBI agents Fox Mulder and Dana Scully investigating the paranormal?', a: 'The X-Files', d: ['Fringe', 'Warehouse 13', 'Millennium'] },
{ c: 'Actors & Directors', t: 2, q: 'Which director made Moonlight?', a: 'Barry Jenkins', d: ['Jordan Peele', 'Ryan Coogler', 'Steve McQueen'] },
{ c: 'Awards & Box Office', t: 2, q: 'Which film won Best Picture at the 2023 ceremony?', a: 'Everything Everywhere All at Once', d: ['All Quiet on the Western Front', 'The Banshees of Inisherin', 'Top Gun: Maverick'] },
{ c: 'Behind the Scenes', t: 2, q: 'Whose water tower is the landmark of a famous Burbank studio lot?', a: 'Warner Bros.', d: ['Paramount', 'Universal', 'Sony'] },

{ c: 'Movies', t: 3, q: 'What is the profession of Joe Gillis in Sunset Boulevard?', a: 'A screenwriter', d: ['A studio publicist', 'A cameraman', 'A stunt man'] },
{ c: 'Television', t: 3, q: 'Which series followed a Manhattan sex columnist and her three friends?', a: 'Sex and the City', d: ['Girls', 'Younger', 'Ally McBeal'] },
{ c: 'Actors & Directors', t: 3, q: 'Which actor played Hannibal Lecter in Manhunter, five years before The Silence of the Lambs?', a: 'Brian Cox', d: ['Anthony Hopkins', 'Mads Mikkelsen', 'Gary Oldman'] },
{ c: 'Awards & Box Office', t: 3, q: 'Which film about a Tudor lord chancellor won Best Picture at the 1967 ceremony?', a: 'A Man for All Seasons', d: ["Who's Afraid of Virginia Woolf?", 'The Sand Pebbles', 'Alfie'] },
{ c: 'Behind the Scenes', t: 3, q: 'Which editing technique cuts between two lines of action to build tension?', a: 'Cross-cutting', d: ['Jump cutting', 'Match cutting', 'Dissolving'] },

{ c: 'Movies', t: 4, q: 'What does the last shot of The 400 Blows freeze on?', a: "The boy's face at the sea", d: ['A burning school', 'A prison gate', 'A moving train'] },
{ c: 'Television', t: 4, q: 'Which HBO comedy follows a fictionalised version of a Seinfeld co-creator?', a: 'Curb Your Enthusiasm', d: ['Louie', 'Extras', 'Episodes'] },
{ c: 'Actors & Directors', t: 4, q: 'Which actress won Best Actress in a Leading Role for A Streetcar Named Desire?', a: 'Vivien Leigh', d: ['Kim Hunter', 'Bette Davis', 'Shelley Winters'] },
{ c: 'Awards & Box Office', t: 4, q: 'Which film about a neurotic New York comedian and his girlfriend won Best Picture at the 1978 ceremony?', a: 'Annie Hall', d: ['Star Wars', 'The Goodbye Girl', 'Julia'] },
{ c: 'Behind the Scenes', t: 4, q: 'Which 1967 crime film is usually taken as the opening of the New Hollywood era?', a: 'Bonnie and Clyde', d: ['The Graduate', 'Easy Rider', 'Point Blank'] },

{ c: 'Movies', t: 5, q: "Where is Jean Vigo's L'Atalante set?", a: 'On a river barge', d: ['In a travelling circus', 'In a textile mill', 'In a lighthouse'] },
{ c: 'Television', t: 5, q: 'Which British series broadcast its first episode the day after the assassination of John F. Kennedy?', a: 'Doctor Who', d: ['The Avengers', 'Danger Man', 'Coronation Street'] },
{ c: 'Actors & Directors', t: 5, q: 'Which actor played Jedediah Leland in Citizen Kane?', a: 'Joseph Cotten', d: ['Everett Sloane', 'Ray Collins', 'Paul Stewart'] },
{ c: 'Awards & Box Office', t: 5, q: 'Which film was the first sound picture to win the top Academy Award?', a: 'The Broadway Melody', d: ['All Quiet on the Western Front', 'Cimarron', 'Grand Hotel'] },
{ c: 'Behind the Scenes', t: 5, q: 'Which studio first licensed its films for sale on videocassette to the public, in 1977?', a: '20th Century Fox', d: ['Warner Bros.', 'Paramount', 'Universal'] },
],

// ── Day 24 ─────────────────────────────────────────────────────────────────
[
{ c: 'Movies', t: 1, q: 'How many dwarfs take in Snow White?', a: 'Seven', d: ['Five', 'Six', 'Eight'] },
{ c: 'Television', t: 1, q: 'Which BBC competition pairs celebrities with professional ballroom dancers?', a: 'Strictly Come Dancing', d: ['Dancing on Ice', 'So You Think You Can Dance', 'The Voice'] },
{ c: 'Actors & Directors', t: 1, q: 'Which actor played Morpheus in The Matrix?', a: 'Laurence Fishburne', d: ['Hugo Weaving', 'Wesley Snipes', 'Samuel L. Jackson'] },
{ c: 'Awards & Box Office', t: 1, q: 'Which awards are known as the BAFTAs?', a: 'The British Academy Film Awards', d: ['The Cesar Awards', 'The Goya Awards', 'The David di Donatello Awards'] },
{ c: 'Behind the Scenes', t: 1, q: "What does a film's runtime measure?", a: 'How long it lasts', d: ['How long it took to shoot', 'How long it stays in cinemas', 'How much it cost'] },

{ c: 'Movies', t: 2, q: 'What does Hakuna Matata mean in The Lion King?', a: 'No worries', d: ['Long live the king', 'The circle of life', 'Welcome home'] },
{ c: 'Television', t: 2, q: 'Which sitcom followed four socially awkward scientists and their neighbour Penny?', a: 'The Big Bang Theory', d: ['Young Sheldon', 'Community', 'Silicon Valley'] },
{ c: 'Actors & Directors', t: 2, q: 'Which director made The Good, the Bad and the Ugly?', a: 'Sergio Leone', d: ['Sergio Corbucci', 'Duccio Tessari', 'Enzo Barboni'] },
{ c: 'Awards & Box Office', t: 2, q: 'Which Scottish historical epic won Best Picture at the 1996 ceremony?', a: 'Braveheart', d: ['Apollo 13', 'Babe', 'Sense and Sensibility'] },
{ c: 'Behind the Scenes', t: 2, q: 'What is a shot taken from a helicopter or drone called?', a: 'An aerial shot', d: ['A dolly shot', 'A rack focus', 'A whip pan'] },

{ c: 'Movies', t: 3, q: 'What do the prisoners name their three tunnels in The Great Escape?', a: 'Tom, Dick and Harry', d: ['Faith, Hope and Charity', 'North, South and East', 'Alpha, Bravo and Charlie'] },
{ c: 'Television', t: 3, q: 'Which rumpled detective in a raincoat solved crimes the audience had already watched being committed?', a: 'Columbo', d: ['Kojak', 'Ironside', 'McCloud'] },
{ c: 'Actors & Directors', t: 3, q: 'Which director made Bringing Up Baby and His Girl Friday?', a: 'Howard Hawks', d: ['Leo McCarey', 'George Cukor', 'Preston Sturges'] },
{ c: 'Awards & Box Office', t: 3, q: 'Which film about British runners at the Olympics won Best Picture at the 1982 ceremony?', a: 'Chariots of Fire', d: ['Reds', 'Atlantic City', 'On Golden Pond'] },
{ c: 'Behind the Scenes', t: 3, q: 'Which studio did Adolph Zukor build?', a: 'Paramount', d: ['MGM', 'Warner Bros.', 'Universal'] },

{ c: 'Movies', t: 4, q: 'Roughly how long is the wordless heist sequence at the center of Rififi?', a: 'About half an hour', d: ['About five minutes', 'About an hour', 'About ten minutes'] },
{ c: 'Television', t: 4, q: "Which series used the instrumental theme known as 'Suicide Is Painless'?", a: 'M*A*S*H', d: ['China Beach', "Hogan's Heroes", 'Combat!'] },
{ c: 'Actors & Directors', t: 4, q: 'Which actor played Rhett Butler in Gone with the Wind?', a: 'Clark Gable', d: ['Errol Flynn', 'Gary Cooper', 'Cary Grant'] },
{ c: 'Awards & Box Office', t: 4, q: 'Which bawdy adaptation of a Henry Fielding novel won Best Picture at the 1964 ceremony?', a: 'Tom Jones', d: ['Cleopatra', 'How the West Was Won', 'Lilies of the Field'] },
{ c: 'Behind the Scenes', t: 4, q: 'Which editing device, popularised by Breathless, deliberately breaks the sense of continuous time?', a: 'The jump cut', d: ['The match cut', 'The wipe', 'The iris'] },

{ c: 'Movies', t: 5, q: 'Which illness afflicts the priest in Diary of a Country Priest?', a: 'Stomach cancer', d: ['Tuberculosis', 'Typhus', 'Pneumonia'] },
{ c: 'Television', t: 5, q: 'Which 1968 series was among the first to give a Black actress a leading role outside domestic service?', a: 'Julia', d: ['I Spy', 'Room 222', 'The Mod Squad'] },
{ c: 'Actors & Directors', t: 5, q: 'Which director made Los Olvidados and Belle de Jour?', a: 'Luis Bunuel', d: ['Carlos Saura', 'Juan Antonio Bardem', 'Marco Ferreri'] },
{ c: 'Awards & Box Office', t: 5, q: 'Which playwright won both a Nobel Prize in Literature and an Academy Award for screenwriting?', a: 'George Bernard Shaw', d: ['Rudyard Kipling', 'T. S. Eliot', 'W. B. Yeats'] },
{ c: 'Behind the Scenes', t: 5, q: 'In which Paris venue did the Lumiere brothers hold their first paying public screening?', a: 'The Salon Indien du Grand Cafe', d: ['The Theatre Robert-Houdin', 'The Folies Bergere', 'The Moulin Rouge'] },
],

// ── Day 25 ─────────────────────────────────────────────────────────────────
[
{ c: 'Movies', t: 1, q: "In Disney's Moana, what does the heroine set out across to complete her quest?", a: 'The ocean', d: ['A desert', 'A mountain range', 'A frozen tundra'] },
{ c: 'Television', t: 1, q: 'Which medical drama starred a brilliant, misanthropic diagnostician who walked with a cane?', a: 'House', d: ['Scrubs', 'ER', 'The Good Doctor'] },
{ c: 'Actors & Directors', t: 1, q: 'Which actor played Willy Wonka in the 1971 film?', a: 'Gene Wilder', d: ['Johnny Depp', 'Peter Sellers', 'Dick Van Dyke'] },
{ c: 'Awards & Box Office', t: 1, q: 'Which Academy Award category rewards a script drawn from an existing book or play?', a: 'Best Adapted Screenplay', d: ['Best Original Screenplay', 'Best Story', 'Best Literary Achievement'] },
{ c: 'Behind the Scenes', t: 1, q: 'What is a theatrical release?', a: 'A film released to cinemas', d: ['A first episode made to sell a series', 'A filmed stage play', 'A short shown before the feature'] },

{ c: 'Movies', t: 2, q: 'What does the Tin Man ask the Wizard for in The Wizard of Oz?', a: 'A heart', d: ['A brain', 'Courage', 'A way home'] },
{ c: 'Television', t: 2, q: 'Which long-running procedural follows a Manhattan squad handling sex crimes?', a: 'Law & Order: Special Victims Unit', d: ['NYPD Blue', 'Criminal Minds', 'CSI: NY'] },
{ c: 'Actors & Directors', t: 2, q: 'Which director made 12 Years a Slave and Shame?', a: 'Steve McQueen', d: ['Barry Jenkins', 'John Singleton', 'Ava DuVernay'] },
{ c: 'Awards & Box Office', t: 2, q: "Which film about a mathematician's schizophrenia won Best Picture at the 2002 ceremony?", a: 'A Beautiful Mind', d: ['Gosford Park', 'Moulin Rouge!', 'In the Bedroom'] },
{ c: 'Behind the Scenes', t: 2, q: 'What is a sound stage?', a: 'A soundproofed building used for filming', d: ['A concert venue on a studio lot', 'A booth for recording dialogue', 'An open-air standing set'] },

{ c: 'Movies', t: 3, q: 'What divides the population in Metropolis?', a: 'Workers below and the elite above', d: ['A river', 'A religious schism', 'A language barrier'] },
{ c: 'Television', t: 3, q: 'Which detective series sends its officers to murders in the villages around the fictional town of Causton?', a: 'Midsomer Murders', d: ['Inspector Morse', 'Death in Paradise', 'Vera'] },
{ c: 'Actors & Directors', t: 3, q: 'Which actor played Rick Blaine in Casablanca?', a: 'Humphrey Bogart', d: ['Paul Henreid', 'Claude Rains', 'Peter Lorre'] },
{ c: 'Awards & Box Office', t: 3, q: "Which film about a family after a son's death won Best Picture at the 1981 ceremony?", a: 'Ordinary People', d: ['Raging Bull', 'The Elephant Man', "Coal Miner's Daughter"] },
{ c: 'Behind the Scenes', t: 3, q: 'What is a rack focus?', a: 'Shifting focus from one subject to another within a shot', d: ['Moving the camera along a track', 'Changing lenses mid-take', 'Adjusting exposure while rolling'] },

{ c: 'Movies', t: 4, q: 'Whose photographs of the backs of peoples heads recur throughout Yi Yi?', a: "A young boy's", d: ["A grandmother's", "A film director's", "A businessman's"] },
{ c: 'Television', t: 4, q: "Which series adapted Margaret Atwood's novel about a theocracy called Gilead?", a: "The Handmaid's Tale", d: ['Alias Grace', 'Station Eleven', 'The Man in the High Castle'] },
{ c: 'Actors & Directors', t: 4, q: 'Which director made Pierrot le Fou and Contempt?', a: 'Jean-Luc Godard', d: ['Francois Truffaut', 'Alain Resnais', 'Louis Malle'] },
{ c: 'Awards & Box Office', t: 4, q: 'Which film set in imperial China won Best Picture at the 1988 ceremony?', a: 'The Last Emperor', d: ['Broadcast News', 'Fatal Attraction', 'Moonstruck'] },
{ c: 'Behind the Scenes', t: 4, q: 'Which discredited practice saw white performers darken their skin to play Black characters?', a: 'Blackface', d: ['Typecasting', 'Dubbing', 'Doubling'] },

{ c: 'Movies', t: 5, q: 'What arrives in the town square in Werckmeister Harmonies?', a: 'A whale in a truck', d: ['A circus tent', 'A bronze statue', 'A military convoy'] },
{ c: 'Television', t: 5, q: "Which 1979 BBC serial adapted John le Carre's novel about a mole in British intelligence?", a: 'Tinker Tailor Soldier Spy', d: ["Smiley's People", 'A Perfect Spy', 'The Sandbaggers'] },
{ c: 'Actors & Directors', t: 5, q: 'Which actress played the title role in Cleo from 5 to 7?', a: 'Corinne Marchand', d: ['Anna Karina', 'Emmanuelle Riva', 'Delphine Seyrig'] },
{ c: 'Awards & Box Office', t: 5, q: 'Which Alfred Hitchcock film won the Academy Award for Best Picture?', a: 'Rebecca', d: ['Notorious', 'Spellbound', 'Suspicion'] },
{ c: 'Behind the Scenes', t: 5, q: 'Which 1935 release was the first feature shot in three-strip Technicolor?', a: 'Becky Sharp', d: ['The Garden of Allah', 'A Star Is Born', 'The Adventures of Robin Hood'] },
],

// ── Day 26 ─────────────────────────────────────────────────────────────────
[
{ c: 'Movies', t: 1, q: "What are Gru's small yellow helpers called in Despicable Me?", a: 'Minions', d: ['Gremlins', 'Smurfs', 'Oompa Loompas'] },
{ c: 'Television', t: 1, q: 'Which competition series has fashion designers create garments against the clock?', a: 'Project Runway', d: ['Top Chef', 'Face Off', 'Say Yes to the Dress'] },
{ c: 'Actors & Directors', t: 1, q: 'Which actor played the title role in Gladiator?', a: 'Russell Crowe', d: ['Joaquin Phoenix', 'Richard Harris', 'Djimon Hounsou'] },
{ c: 'Awards & Box Office', t: 1, q: 'Which Academy Award category honors the instrumental music composed for a film?', a: 'Best Original Score', d: ['Best Sound', 'Best Music Direction', 'Best Film Editing'] },
{ c: 'Behind the Scenes', t: 1, q: 'What is principal photography?', a: 'The main shooting period of a film', d: ['The still photography for posters', 'The first frame of every scene', 'The chemical processing of the negative'] },

{ c: 'Movies', t: 2, q: "What make of car does Cameron's father keep in the garage in Ferris Bueller's Day Off?", a: 'A Ferrari', d: ['A Porsche', 'A Jaguar', 'A Lamborghini'] },
{ c: 'Television', t: 2, q: 'Which sitcom followed a Seattle radio psychiatrist, his brother Niles and their father Martin?', a: 'Frasier', d: ['Cheers', 'Wings', 'Just Shoot Me!'] },
{ c: 'Actors & Directors', t: 2, q: 'Which director made Whiplash and La La Land?', a: 'Damien Chazelle', d: ['Ryan Coogler', 'Josh Safdie', 'Sean Baker'] },
{ c: 'Awards & Box Office', t: 2, q: 'Which musical set in Austria won Best Picture at the 1966 ceremony?', a: 'The Sound of Music', d: ['Doctor Zhivago', 'Darling', 'Ship of Fools'] },
{ c: 'Behind the Scenes', t: 2, q: 'Which role is credited with financing and organising the making of a film?', a: 'The producer', d: ['The showrunner', 'The unit manager', 'The distributor'] },

{ c: 'Movies', t: 3, q: 'What is the double life of the heroine of Belle de Jour?', a: 'A bourgeois wife who works afternoons in a brothel', d: ['A nun who is a jewel thief', 'A teacher who is a spy', 'A singer who is an assassin'] },
{ c: 'Television', t: 3, q: 'Which British comedy followed a foul-mouthed government spin doctor?', a: 'The Thick of It', d: ['Yes Minister', 'The New Statesman', 'Absolute Power'] },
{ c: 'Actors & Directors', t: 3, q: 'Which actor played the title role in Lawrence of Arabia?', a: "Peter O'Toole", d: ['Omar Sharif', 'Alec Guinness', 'Anthony Quinn'] },
{ c: 'Awards & Box Office', t: 3, q: 'Which film about a New Jersey longshoreman won Best Picture at the 1955 ceremony?', a: 'On the Waterfront', d: ['The Caine Mutiny', 'Seven Brides for Seven Brothers', 'Three Coins in the Fountain'] },
{ c: 'Behind the Scenes', t: 3, q: 'Which term describes assembling shots into a rhythmic sequence that compresses time?', a: 'Montage', d: ['Blocking', 'Coverage', 'Foley'] },

{ c: 'Movies', t: 4, q: 'Whose point of view does Come and See follow?', a: 'A Belarusian boy', d: ['A German officer', 'A Russian nurse', 'A partisan commander'] },
{ c: 'Television', t: 4, q: 'Which series followed a Kentucky United States marshal named Raylan Givens?', a: 'Justified', d: ['Longmire', 'Banshee', 'Ozark'] },
{ c: 'Actors & Directors', t: 4, q: 'Which Belgian director made Jeanne Dielman?', a: 'Chantal Akerman', d: ['Agnes Varda', 'Marguerite Duras', 'Claire Denis'] },
{ c: 'Awards & Box Office', t: 4, q: 'Which musical set among rival New York gangs won Best Picture at the 1962 ceremony?', a: 'West Side Story', d: ['The Hustler', 'Judgment at Nuremberg', 'Fanny'] },
{ c: 'Behind the Scenes', t: 4, q: 'Which innovation let sound be printed onto the film strip itself, replacing synchronised discs?', a: 'The optical soundtrack', d: ['Magnetic tape', 'The Vitaphone disc', 'Digital encoding'] },

{ c: 'Movies', t: 5, q: 'In which century is Marketa Lazarova set?', a: 'The thirteenth', d: ['The tenth', 'The sixteenth', 'The eighteenth'] },
{ c: 'Television', t: 5, q: "Which 1976 BBC serial adapted Robert Graves's novels about a stammering Roman emperor?", a: 'I, Claudius', d: ['The Caesars', 'The Borgias', 'The Cleopatras'] },
{ c: 'Actors & Directors', t: 5, q: 'Which actor played the lead role in both Seven Samurai and Yojimbo?', a: 'Toshiro Mifune', d: ['Takashi Shimura', 'Tatsuya Nakadai', 'Chishu Ryu'] },
{ c: 'Awards & Box Office', t: 5, q: 'Which Shakespeare adaptation won Best Picture at the 1949 ceremony?', a: 'Hamlet', d: ['Johnny Belinda', 'The Snake Pit', 'The Treasure of the Sierra Madre'] },
{ c: 'Behind the Scenes', t: 5, q: 'How many writers and directors were cited for contempt of Congress after the 1947 hearings?', a: 'Ten', d: ['Five', 'Twenty', 'Fifty'] },
],

// ── Day 27 ─────────────────────────────────────────────────────────────────
[
{ c: 'Movies', t: 1, q: 'What was Po doing for a living before he became the Dragon Warrior in Kung Fu Panda?', a: "Working in his father's noodle shop", d: ['Training as a monk', 'Herding goats', 'Guarding a temple'] },
{ c: 'Television', t: 1, q: 'Which animated series follows a washed-up horse who once starred in a 1990s sitcom?', a: 'BoJack Horseman', d: ['Big Mouth', 'F Is for Family', 'Tuca & Bertie'] },
{ c: 'Actors & Directors', t: 1, q: 'Which actor played Captain America in the Marvel films?', a: 'Chris Evans', d: ['Chris Hemsworth', 'Sebastian Stan', 'Anthony Mackie'] },
{ c: 'Awards & Box Office', t: 1, q: "The Cesar is the national film award of which nation?", a: 'France', d: ['Spain', 'Italy', 'Germany'] },
{ c: 'Behind the Scenes', t: 1, q: 'What is a pilot in television?', a: 'The first episode made to sell a series', d: ['The season finale', 'A clip show', 'A behind-the-scenes special'] },

{ c: 'Movies', t: 2, q: 'Which object does Cobb use to test whether he is dreaming in Inception?', a: 'A spinning top', d: ['A pocket watch', 'A coin', 'A wedding ring'] },
{ c: 'Television', t: 2, q: "Which comedy is set in an American vice president's office?", a: 'Veep', d: ['Parks and Recreation', 'The Thick of It', 'Scandal'] },
{ c: 'Actors & Directors', t: 2, q: 'Which director made Parasite?', a: 'Bong Joon-ho', d: ['Park Chan-wook', 'Kim Jee-woon', 'Lee Chang-dong'] },
{ c: 'Awards & Box Office', t: 2, q: 'Which film about a mother and daughter in Texas won Best Picture at the 1984 ceremony?', a: 'Terms of Endearment', d: ['The Right Stuff', 'The Big Chill', 'Tender Mercies'] },
{ c: 'Behind the Scenes', t: 2, q: 'What does it mean when a studio green lights a project?', a: 'It approves the film to go into production', d: ['It passes censorship', 'It opens in cinemas', 'It recoups its budget'] },

{ c: 'Movies', t: 3, q: 'What pattern do the killings follow in Se7en?', a: 'The seven deadly sins', d: ['The ten commandments', 'The stations of the cross', 'The signs of the zodiac'] },
{ c: 'Television', t: 3, q: 'Which series followed the secrets of the women living on Wisteria Lane?', a: 'Desperate Housewives', d: ['Big Little Lies', 'Melrose Place', 'Knots Landing'] },
{ c: 'Actors & Directors', t: 3, q: 'Which actor won Best Actor for playing Salieri in Amadeus?', a: 'F. Murray Abraham', d: ['Tom Hulce', 'Jeffrey Jones', 'Simon Callow'] },
{ c: 'Awards & Box Office', t: 3, q: 'Which globe-circling adventure won Best Picture at the 1957 ceremony?', a: 'Around the World in 80 Days', d: ['The Ten Commandments', 'Giant', 'The King and I'] },
{ c: 'Behind the Scenes', t: 3, q: "Which practice replaces an actor's voice with another performer's in a different language?", a: 'Dubbing', d: ['Subtitling', 'Looping', 'Foley'] },

{ c: 'Movies', t: 4, q: 'On which Italian island is The Leopard set?', a: 'Sicily', d: ['Sardinia', 'Capri', 'Elba'] },
{ c: 'Television', t: 4, q: 'Which series followed the Shelby family in Birmingham after the First World War?', a: 'Peaky Blinders', d: ['Boardwalk Empire', 'Gangs of London', 'Ripper Street'] },
{ c: 'Actors & Directors', t: 4, q: 'Which director made Faces and A Woman Under the Influence?', a: 'John Cassavetes', d: ['Elia Kazan', 'Sidney Lumet', 'Bob Rafelson'] },
{ c: 'Awards & Box Office', t: 4, q: 'Which film about a Black detective investigating a Mississippi murder won Best Picture at the 1968 ceremony?', a: 'In the Heat of the Night', d: ['The Graduate', 'Bonnie and Clyde', 'Doctor Dolittle'] },
{ c: 'Behind the Scenes', t: 4, q: 'What is a long take?', a: 'A single shot running an unusually long time without a cut', d: ['A wide shot covering a whole scene', 'A shot with two actors in frame', 'A close detail cut into a scene'] },

{ c: 'Movies', t: 5, q: 'Over how many days does Jeanne Dielman take place?', a: 'Three', d: ['One', 'Seven', 'Ten'] },
{ c: 'Television', t: 5, q: 'Which 1982 British serial followed five unemployed Liverpool men?', a: 'Boys from the Blackstuff', d: ['Auf Wiedersehen, Pet', 'Bread', 'Brookside'] },
{ c: 'Actors & Directors', t: 5, q: 'Which actor played the priest in Diary of a Country Priest?', a: 'Claude Laydu', d: ['Francois Leterrier', 'Martin Lasalle', 'Pierre Fresnay'] },
{ c: 'Awards & Box Office', t: 5, q: 'Which Gene Kelly musical set in the French capital won Best Picture at the 1952 ceremony?', a: 'An American in Paris', d: ['A Streetcar Named Desire', 'A Place in the Sun', 'Quo Vadis'] },
{ c: 'Behind the Scenes', t: 5, q: 'What was the Vitaphone?', a: 'An early sound-on-disc system synchronised with the projector', d: ['A widescreen lens', 'A color film stock', 'A hand-cranked camera'] },
],

// ── Day 28 ─────────────────────────────────────────────────────────────────
[
{ c: 'Movies', t: 1, q: 'What animal is Judy Hopps in Zootopia?', a: 'A rabbit', d: ['A fox', 'A sloth', 'A buffalo'] },
{ c: 'Television', t: 1, q: 'Which reality series has candidates compete for a job with a demanding businessman who fires them one by one?', a: 'The Apprentice', d: ["Dragons' Den", 'Undercover Boss', 'The Profit'] },
{ c: 'Actors & Directors', t: 1, q: 'Which actor played Legolas in The Lord of the Rings films?', a: 'Orlando Bloom', d: ['Viggo Mortensen', 'Sean Bean', 'Dominic Monaghan'] },
{ c: 'Awards & Box Office', t: 1, q: 'What does the Golden Globe trophy depict?', a: 'A globe on a pedestal', d: ['A gilded film reel', 'A masked face', 'A winged figure'] },
{ c: 'Behind the Scenes', t: 1, q: 'What does shooting on location mean?', a: 'Filming at a real place rather than in a studio', d: ['Filming with a second unit', 'Filming against a green screen', 'Filming a rehearsal'] },

{ c: 'Movies', t: 2, q: 'On which ice planet does The Empire Strikes Back open?', a: 'Hoth', d: ['Tatooine', 'Endor', 'Dagobah'] },
{ c: 'Television', t: 2, q: 'Which British sitcom followed three old men larking about in the Yorkshire hills for thirty-seven years?', a: 'Last of the Summer Wine', d: ['Open All Hours', 'Dad\'s Army', 'Hi-de-Hi!'] },
{ c: 'Actors & Directors', t: 2, q: 'Which director made Spirited Away and My Neighbor Totoro?', a: 'Hayao Miyazaki', d: ['Isao Takahata', 'Mamoru Hosoda', 'Satoshi Kon'] },
{ c: 'Awards & Box Office', t: 2, q: 'Which film finished the 1970s as the decade’s highest grossing release worldwide?', a: 'Star Wars', d: ['Jaws', 'Grease', 'The Exorcist'] },
{ c: 'Behind the Scenes', t: 2, q: 'What is a multi-camera sitcom?', a: 'A comedy shot with several cameras at once, often before a live audience', d: ['A comedy shot like a documentary', 'A comedy shot on location only', 'A comedy of unconnected sketches'] },

{ c: 'Movies', t: 3, q: 'Which regime does the protagonist of The Conformist serve?', a: 'Italian fascism', d: ['Nazi Germany', 'Francoist Spain', 'Vichy France'] },
{ c: 'Television', t: 3, q: 'Which HBO drama followed a Prohibition-era political fixer in Atlantic City?', a: 'Boardwalk Empire', d: ['Deadwood', 'Peaky Blinders', 'The Knick'] },
{ c: 'Actors & Directors', t: 3, q: 'Which actress won Best Actress for playing a union organiser in Norma Rae?', a: 'Sally Field', d: ['Jane Fonda', 'Sissy Spacek', 'Jill Clayburgh'] },
{ c: 'Awards & Box Office', t: 3, q: 'Which musical about a Parisian courtesan-in-training won Best Picture at the 1959 ceremony?', a: 'Gigi', d: ['Auntie Mame', 'The Defiant Ones', 'Separate Tables'] },
{ c: 'Behind the Scenes', t: 3, q: 'What are residuals in the film and television business?', a: 'Payments to talent when a work is reused', d: ['The unspent part of a budget', 'Footage left out of the final cut', "The distributor's fee"] },

{ c: 'Movies', t: 4, q: 'In which country is Fanny and Alexander set?', a: 'Sweden', d: ['Denmark', 'Norway', 'Finland'] },
{ c: 'Television', t: 4, q: 'Which anthology series began with two Louisiana detectives and changed its cast each season?', a: 'True Detective', d: ['Fargo', 'The Sinner', 'Sharp Objects'] },
{ c: 'Actors & Directors', t: 4, q: 'Which actor played Antoine Doinel across five Francois Truffaut films?', a: 'Jean-Pierre Leaud', d: ['Jean-Claude Brialy', 'Charles Aznavour', 'Jean-Paul Belmondo'] },
{ c: 'Awards & Box Office', t: 4, q: 'Which backstage story of a Broadway star won Best Picture at the 1951 ceremony?', a: 'All About Eve', d: ['Born Yesterday', "King Solomon's Mines", 'Sunset Boulevard'] },
{ c: 'Behind the Scenes', t: 4, q: 'Which sound advance did Fantasia introduce to cinemas in 1940?', a: 'Multi-channel stereophonic sound', d: ['The optical soundtrack', 'Post-synchronised dialogue', 'Noise reduction'] },

{ c: 'Movies', t: 5, q: 'What are the professions of the two lovers in Hiroshima Mon Amour?', a: 'A French actress and a Japanese architect', d: ['A doctor and a teacher', 'A journalist and a soldier', 'A singer and an engineer'] },
{ c: 'Television', t: 5, q: "Which 1981 British serial adapted Evelyn Waugh's novel about the Flyte family?", a: 'Brideshead Revisited', d: ['The Jewel in the Crown', 'A Dance to the Music of Time', 'Testament of Youth'] },
{ c: 'Actors & Directors', t: 5, q: 'Which French director made A Man Escaped and Pickpocket?', a: 'Robert Bresson', d: ['Jean-Pierre Melville', 'Louis Malle', 'Georges Franju'] },
{ c: 'Awards & Box Office', t: 5, q: 'Which film about an English family in wartime won Best Picture at the 1943 ceremony?', a: 'Mrs. Miniver', d: ['Casablanca', 'The Pride of the Yankees', 'Random Harvest'] },
{ c: 'Behind the Scenes', t: 5, q: 'Which experiment of Eadweard Muybridge is a direct forerunner of cinema?', a: 'Sequential photographs of a galloping horse', d: ['The magic lantern', 'The camera obscura', 'The daguerreotype'] },
],

// ── Day 29 ─────────────────────────────────────────────────────────────────
[
{ c: 'Movies', t: 1, q: "Which country's Day of the Dead is the setting of Coco?", a: 'Mexico', d: ['Spain', 'Peru', 'Colombia'] },
{ c: 'Television', t: 1, q: 'Which reality series sends teams racing around the world against each other?', a: 'The Amazing Race', d: ['Survivor', 'Big Brother', 'The Mole'] },
{ c: 'Actors & Directors', t: 1, q: 'Which actor played Jack Torrance in The Shining?', a: 'Jack Nicholson', d: ['Robert De Niro', 'Christopher Walken', 'Dennis Hopper'] },
{ c: 'Awards & Box Office', t: 1, q: "Which Academy Award category honors the year's best non-fiction film?", a: 'Best Documentary Feature', d: ['Best Reportage', 'Best Factual Feature', 'Best True Story'] },
{ c: 'Behind the Scenes', t: 1, q: 'What is a sequel?', a: 'A film continuing the story of an earlier one', d: ['A film telling an earlier part of the story', 'A remake in another language', 'A shortened re-release'] },

{ c: 'Movies', t: 2, q: 'What does Rose drop into the ocean at the end of Titanic?', a: 'A diamond necklace', d: ['A locket', 'A wedding ring', 'A photograph'] },
{ c: 'Television', t: 2, q: 'Which animated series follows four foul-mouthed boys in a Colorado mountain town?', a: 'South Park', d: ['Beavis and Butt-Head', 'King of the Hill', 'Family Guy'] },
{ c: 'Actors & Directors', t: 2, q: 'Which director made The Sixth Sense and Signs?', a: 'M. Night Shyamalan', d: ['David Fincher', 'James Wan', 'Scott Derrickson'] },
{ c: 'Awards & Box Office', t: 2, q: 'Which film released in the 2000s went on to gross the most worldwide?', a: 'Avatar', d: ['The Dark Knight', "Pirates of the Caribbean: Dead Man's Chest", 'Shrek 2'] },
{ c: 'Behind the Scenes', t: 2, q: 'What is a showrunner in television?', a: 'The lead writer and executive producer of a series', d: ['The network scheduler', "The studio's head of casting", 'The stage manager'] },

{ c: 'Movies', t: 3, q: 'Which state do the Joads leave in The Grapes of Wrath?', a: 'Oklahoma', d: ['Kansas', 'Arkansas', 'Texas'] },
{ c: 'Television', t: 3, q: 'Which Aaron Sorkin series followed the staff of a fictional cable news channel?', a: 'The Newsroom', d: ['Broadcast News', 'Sports Night', 'Studio 60 on the Sunset Strip'] },
{ c: 'Actors & Directors', t: 3, q: 'Which actress won Best Actress for Roman Holiday?', a: 'Audrey Hepburn', d: ['Grace Kelly', 'Deborah Kerr', 'Leslie Caron'] },
{ c: 'Awards & Box Office', t: 3, q: 'Which film about servicemen returning home won Best Picture at the 1947 ceremony?', a: 'The Best Years of Our Lives', d: ["It's a Wonderful Life", 'The Yearling', 'Henry V'] },
{ c: 'Behind the Scenes', t: 3, q: 'What is an establishing shot?', a: 'A wide shot that shows where a scene is taking place', d: ['The first take printed', "A shot of an actor's reaction", 'A shot cut only into the trailer'] },

{ c: 'Movies', t: 4, q: 'Which crop fills the landscape of Days of Heaven?', a: 'Wheat', d: ['Cotton', 'Corn', 'Tobacco'] },
{ c: 'Television', t: 4, q: 'Which HBO drama followed a polygamous family in suburban Utah?', a: 'Big Love', d: ['Sister Wives', 'Under the Banner of Heaven', 'Bloodline'] },
{ c: 'Actors & Directors', t: 4, q: 'Which British director made Kes and Cathy Come Home?', a: 'Ken Loach', d: ['Mike Leigh', 'Alan Clarke', 'Lindsay Anderson'] },
{ c: 'Awards & Box Office', t: 4, q: 'Which film won Best Picture at the 1940 ceremony?', a: 'Gone with the Wind', d: ['The Wizard of Oz', 'Wuthering Heights', 'Stagecoach'] },
{ c: 'Behind the Scenes', t: 4, q: 'What is a test screening?', a: 'Showing an unfinished cut to a recruited audience for reaction', d: ['A screening for the press before release', 'The first public showing on opening day', "A screening for the studio's board"] },

{ c: 'Movies', t: 5, q: 'Roughly how long does Satantango run?', a: 'About seven hours', d: ['About three hours', 'About five hours', 'About ten hours'] },
{ c: 'Television', t: 5, q: 'Which 1950s American sitcom pioneered filming a comedy on 35mm with three cameras at once?', a: 'I Love Lucy', d: ['The Honeymooners', 'Dragnet', 'The Jack Benny Program'] },
{ c: 'Actors & Directors', t: 5, q: 'Which director made Le Cercle Rouge and Army of Shadows?', a: 'Jean-Pierre Melville', d: ['Robert Bresson', 'Claude Sautet', 'Henri-Georges Clouzot'] },
{ c: 'Awards & Box Office', t: 5, q: 'Which film about a singing priest won Best Picture at the 1945 ceremony?', a: 'Going My Way', d: ['Double Indemnity', 'Gaslight', 'Since You Went Away'] },
{ c: 'Behind the Scenes', t: 5, q: 'Which film gauge did Kodak introduce in 1923 for amateur filmmakers?', a: '16mm', d: ['8mm', 'Super 8', '9.5mm'] },
],

// ── Day 30 ─────────────────────────────────────────────────────────────────
[
{ c: 'Movies', t: 1, q: "What do the characters living inside Riley's head represent in Inside Out?", a: 'Her emotions', d: ['Her memories', 'Her dreams', 'Her friends'] },
{ c: 'Television', t: 1, q: 'Which childrens series follows a tank engine working on the island of Sodor?', a: 'Thomas & Friends', d: ['Chuggington', 'Postman Pat', 'Fireman Sam'] },
{ c: 'Actors & Directors', t: 1, q: 'Which actor played Gandalf in The Lord of the Rings films?', a: 'Ian McKellen', d: ['Christopher Lee', 'Patrick Stewart', 'Michael Gambon'] },
{ c: 'Awards & Box Office', t: 1, q: 'Which Academy Award category rewards the clothes made for a film?', a: 'Best Costume Design', d: ['Best Production Design', 'Best Makeup and Hairstyling', 'Best Art Direction'] },
{ c: 'Behind the Scenes', t: 1, q: 'What is a prequel?', a: 'A film set before an earlier one in the same story', d: ['A film set after an earlier one', 'A remake in another language', 'A shortened cut'] },

{ c: 'Movies', t: 2, q: 'What does the Cowardly Lion ask the Wizard for?', a: 'Courage', d: ['A brain', 'A heart', 'A way home'] },
{ c: 'Television', t: 2, q: 'Which series followed Captain Jean-Luc Picard and the crew of the Enterprise-D?', a: 'Star Trek: The Next Generation', d: ['Star Trek: Voyager', 'Star Trek: Deep Space Nine', 'Babylon 5'] },
{ c: 'Actors & Directors', t: 2, q: 'Which director made Sideways and The Descendants?', a: 'Alexander Payne', d: ['Cameron Crowe', 'Jason Reitman', 'Noah Baumbach'] },
{ c: 'Awards & Box Office', t: 2, q: 'Which film finished the 2010s as the decade’s highest grossing release worldwide?', a: 'Avengers: Endgame', d: ['Star Wars: The Force Awakens', 'Frozen II', 'Jurassic World'] },
{ c: 'Behind the Scenes', t: 2, q: 'What is runaway production?', a: 'Shooting somewhere other than where the story is set, usually to cut costs', d: ['Block booking', 'Four-walling', 'A platform release'] },

{ c: 'Movies', t: 3, q: 'What destroys the vampire at the end of the 1922 Nosferatu?', a: 'Sunlight', d: ['A wooden stake', 'Holy water', 'A silver blade'] },
{ c: 'Television', t: 3, q: 'Which 1978 British series followed rebels who seized an alien ship called the Liberator?', a: "Blake's 7", d: ['Doctor Who', 'Space: 1999', 'The Tomorrow People'] },
{ c: 'Actors & Directors', t: 3, q: 'Which actress won Best Actress for Misery?', a: 'Kathy Bates', d: ['Anjelica Huston', 'Julia Roberts', 'Joanne Woodward'] },
{ c: 'Awards & Box Office', t: 3, q: 'Which film set in Hawaii before Pearl Harbor won Best Picture at the 1954 ceremony?', a: 'From Here to Eternity', d: ['Roman Holiday', 'Shane', 'Julius Caesar'] },
{ c: 'Behind the Scenes', t: 3, q: 'What are dailies, also called rushes?', a: "The unedited footage from a day's shooting, viewed by the crew", d: ['The daily call sheet', 'The last week of shooting', 'The daily box office figures'] },

{ c: 'Movies', t: 4, q: 'Which bird does the boy train in Kes?', a: 'A kestrel', d: ['A hawk', 'An owl', 'A raven'] },
{ c: 'Television', t: 4, q: 'Which series was set at the fictional St. Eligius hospital in Boston?', a: 'St. Elsewhere', d: ['ER', 'Chicago Hope', 'Ben Casey'] },
{ c: 'Actors & Directors', t: 4, q: 'Which non-professional was cast as the father in Bicycle Thieves?', a: 'Lamberto Maggiorani', d: ['Enzo Staiola', 'Franco Interlenghi', 'Massimo Girotti'] },
{ c: 'Awards & Box Office', t: 4, q: 'Which film won Best Picture at the 1973 ceremony?', a: 'The Godfather', d: ['Cabaret', 'Deliverance', 'Sounder'] },
{ c: 'Behind the Scenes', t: 4, q: 'What is chroma key?', a: 'Shooting against a solid color backdrop so it can be replaced later', d: ['Projecting a background behind the actors on set', 'Painting a background onto glass', 'Printing two negatives together'] },

{ c: 'Movies', t: 5, q: 'How many days does The Turin Horse cover?', a: 'Six', d: ['Three', 'Seven', 'Ten'] },
{ c: 'Television', t: 5, q: 'Which CBS variety series ran from 1948 and introduced America to the Beatles?', a: 'The Ed Sullivan Show', d: ['Texaco Star Theater', 'Your Show of Shows', 'The Colgate Comedy Hour'] },
{ c: 'Actors & Directors', t: 5, q: 'Which Soviet director made The Cranes Are Flying?', a: 'Mikhail Kalatozov', d: ['Grigori Chukhrai', 'Sergei Bondarchuk', 'Andrei Tarkovsky'] },
{ c: 'Awards & Box Office', t: 5, q: 'Which film about a Welsh mining family won Best Picture at the 1942 ceremony?', a: 'How Green Was My Valley', d: ['Citizen Kane', 'The Maltese Falcon', 'Sergeant York'] },
{ c: 'Behind the Scenes', t: 5, q: 'What was the Kinetoscope?', a: "An early peep-show viewing device from Edison's laboratory", d: ['A projector for large audiences', 'A color process', 'A sound recorder'] },
],


// ── Day 31 ──────────────────────────────────────────────────────────────
[
{ c: 'Movies', t: 1, q: 'Which Marvel hero gains his powers after being bitten by a radioactive spider?', a: 'Spider-Man', d: ['Batman', 'Iron Man', 'Daredevil'] },
{ c: 'Television', t: 1, q: 'In the animated series The Flintstones, what is the name of the prehistoric town where Fred and Barney live?', a: 'Bedrock', d: ['Boulder City', 'Granite Falls', 'Stonebrook'] },
{ c: 'Actors & Directors', t: 1, q: 'Which actor starred in Top Gun, Jerry Maguire and the Mission: Impossible series?', a: 'Tom Cruise', d: ['Brad Pitt', 'Kevin Costner', 'Val Kilmer'] },
{ c: 'Awards & Box Office', t: 1, q: 'Which 1997 film about a doomed ocean liner won eleven Academy Awards?', a: 'Titanic', d: ['The English Patient', 'Braveheart', 'Shakespeare in Love'] },
{ c: 'Behind the Scenes', t: 1, q: 'Which 1975 thriller had a mechanical creature that broke down so often the director shot most of the attacks without showing it?', a: 'Jaws', d: ['The Poseidon Adventure', 'Piranha', 'Moby Dick'] },

{ c: 'Movies', t: 2, q: 'In The Godfather, what does the studio boss Jack Woltz wake up to find in his bed?', a: 'The severed head of his prize racehorse', d: ['A rattlesnake', 'A bundle of burning money', 'A photograph of his stables'] },
{ c: 'Television', t: 2, q: 'Which teen drama about wealthy California high schoolers took its title from a Los Angeles ZIP code?', a: 'Beverly Hills, 90210', d: ['Melrose Place', 'The O.C.', 'Dawson\'s Creek'] },
{ c: 'Actors & Directors', t: 2, q: 'Which director made Romancing the Stone, Back to the Future and Who Framed Roger Rabbit?', a: 'Robert Zemeckis', d: ['Ron Howard', 'Barry Levinson', 'Joe Dante'] },
{ c: 'Awards & Box Office', t: 2, q: 'Which 2005 wildlife documentary filmed in Antarctica won the Academy Award for Best Documentary Feature?', a: 'March of the Penguins', d: ['Winged Migration', 'Grizzly Man', 'Murderball'] },
{ c: 'Behind the Scenes', t: 2, q: 'Which 2015 action film was shot largely in the Namib Desert with most of its vehicle work performed for real?', a: 'Mad Max: Fury Road', d: ['The Mummy', 'Sahara', 'Prince of Persia: The Sands of Time'] },

{ c: 'Movies', t: 3, q: 'In Fargo, what job does Marge Gunderson hold in the town of Brainerd?', a: 'Chief of police', d: ['Insurance investigator', 'County prosecutor', 'Federal agent'] },
{ c: 'Television', t: 3, q: 'Which Danish political drama followed Birgitte Nyborg from party leader to prime minister?', a: 'Borgen', d: ['The Killing', 'The Bridge', 'Follow the Money'] },
{ c: 'Actors & Directors', t: 3, q: 'Which actress played the pregnant police chief Marge Gunderson in Fargo?', a: 'Frances McDormand', d: ['Holly Hunter', 'Laura Dern', 'Joan Allen'] },
{ c: 'Awards & Box Office', t: 3, q: 'Which film won the Academy Award for Best Animated Feature for 2003?', a: 'Finding Nemo', d: ['Brother Bear', 'The Triplets of Belleville', 'Sinbad: Legend of the Seven Seas'] },
{ c: 'Behind the Scenes', t: 3, q: 'Which 1972 film shot its Sicilian sequences in the villages of Savoca and Forza d\'Agro rather than the town the family is named for?', a: 'The Godfather', d: ['Cinema Paradiso', 'Il Postino', 'The Leopard'] },

{ c: 'Movies', t: 4, q: 'In Fritz Lang\'s M, which piece of music does the hunted man whistle?', a: 'In the Hall of the Mountain King', d: ['Ride of the Valkyries', 'The Blue Danube', 'Fur Elise'] },
{ c: 'Television', t: 4, q: 'In Neon Genesis Evangelion, what is the name of the special agency that deploys the giant humanoid units against the Angels?', a: 'NERV', d: ['SEELE', 'GEHIRN', 'WILLE'] },
{ c: 'Actors & Directors', t: 4, q: 'Which cinematographer shot The Godfather and Annie Hall?', a: 'Gordon Willis', d: ['Vittorio Storaro', 'Conrad Hall', 'Haskell Wexler'] },
{ c: 'Awards & Box Office', t: 4, q: 'Which Argentine film won the Academy Award for Best Foreign Language Film for 2009?', a: 'The Secret in Their Eyes', d: ['The White Ribbon', 'A Prophet', 'Ajami'] },
{ c: 'Behind the Scenes', t: 4, q: 'Which Swiss artist designed the creature and the derelict ship for the 1979 film Alien?', a: 'H.R. Giger', d: ['Syd Mead', 'Rick Baker', 'Ken Adam'] },

{ c: 'Movies', t: 5, q: 'In A Matter of Life and Death, which realm is rendered in black and white while the other is in color?', a: 'The other world after death', d: ['Wartime England', 'The pilot\'s memories of childhood', 'The operating room'] },
{ c: 'Television', t: 5, q: 'Cathy Come Home, the 1966 drama about homelessness that changed British housing policy, was broadcast under which BBC anthology strand?', a: 'The Wednesday Play', d: ['Play for Today', 'Play of the Month', 'First Night'] },
{ c: 'Actors & Directors', t: 5, q: 'Which Senegalese novelist and filmmaker made Black Girl in 1966?', a: 'Ousmane Sembene', d: ['Djibril Diop Mambety', 'Med Hondo', 'Souleymane Cisse'] },
{ c: 'Awards & Box Office', t: 5, q: 'Which film won the Unique and Artistic Picture award at the first Academy Awards, a prize never handed out again?', a: 'Sunrise', d: ['The Crowd', '7th Heaven', 'Chang'] },
{ c: 'Behind the Scenes', t: 5, q: 'Which sound designer built the lightsaber hum from an idling projector motor combined with television interference?', a: 'Ben Burtt', d: ['Walter Murch', 'Gary Rydstrom', 'Alan Splet'] },
],

// ── Day 32 ──────────────────────────────────────────────────────────────
[
{ c: 'Movies', t: 1, q: 'In The Wizard of Oz, what is Dorothy told to follow to reach the Emerald City?', a: 'The yellow brick road', d: ['The river of poppies', 'The silver stair', 'The path of white stones'] },
{ c: 'Television', t: 1, q: 'Which 1990s series followed lifeguards in red swimsuits patrolling a Los Angeles County beach?', a: 'Baywatch', d: ['CHiPs', 'Melrose Place', 'Hawaii Five-O'] },
{ c: 'Actors & Directors', t: 1, q: 'Which comic actor starred in Ace Ventura, The Mask and Dumb and Dumber?', a: 'Jim Carrey', d: ['Adam Sandler', 'Ben Stiller', 'Steve Carell'] },
{ c: 'Awards & Box Office', t: 1, q: 'In which country is the Cannes Film Festival held?', a: 'France', d: ['Italy', 'Spain', 'Belgium'] },
{ c: 'Behind the Scenes', t: 1, q: 'Which trilogy of the early 2000s was shot entirely in New Zealand as one continuous production?', a: 'The Lord of the Rings', d: ['Harry Potter', 'Pirates of the Caribbean', 'The Matrix'] },

{ c: 'Movies', t: 2, q: 'What is the name of Quint\'s shark-hunting boat in Jaws?', a: 'The Orca', d: ['The Nautilus', 'The Pequod', 'The Amity Queen'] },
{ c: 'Television', t: 2, q: 'Which animated series follows a young trainer named Ash Ketchum and his companion Pikachu?', a: 'Pokemon', d: ['Digimon', 'Yu-Gi-Oh!', 'Beyblade'] },
{ c: 'Actors & Directors', t: 2, q: 'Which actor played Tyler Durden in Fight Club?', a: 'Brad Pitt', d: ['Edward Norton', 'Matt Damon', 'Christian Bale'] },
{ c: 'Awards & Box Office', t: 2, q: 'Which 1993 dinosaur adventure was the top-grossing release worldwide that year?', a: 'Jurassic Park', d: ['Mrs. Doubtfire', 'The Fugitive', 'Cliffhanger'] },
{ c: 'Behind the Scenes', t: 2, q: 'Which 1985 hit replaced its leading man several weeks into shooting and reshot all of his scenes with a television star?', a: 'Back to the Future', d: ['Ghostbusters', 'Gremlins', 'WarGames'] },

{ c: 'Movies', t: 3, q: 'In North by Northwest, across which carved monument does the climactic chase take place?', a: 'Mount Rushmore', d: ['The Statue of Liberty', 'The Lincoln Memorial', 'The Hoover Dam'] },
{ c: 'Television', t: 3, q: 'Which German drama sent a young East German soldier undercover into the West German army at the height of the Pershing missile crisis?', a: 'Deutschland 83', d: ['Weissensee', 'The Same Sky', 'Babylon Berlin'] },
{ c: 'Actors & Directors', t: 3, q: 'Which pair of American brothers directed Fargo, The Big Lebowski and No Country for Old Men?', a: 'Joel and Ethan Coen', d: ['the Farrelly brothers', 'the Dardenne brothers', 'the Safdie brothers'] },
{ c: 'Awards & Box Office', t: 3, q: 'Which actress won Best Actress for Monster\'s Ball, the first Black winner in that category?', a: 'Halle Berry', d: ['Angela Bassett', 'Whoopi Goldberg', 'Viola Davis'] },
{ c: 'Behind the Scenes', t: 3, q: 'For which 2014 space film did the production plant and grow hundreds of acres of corn, later selling the crop?', a: 'Interstellar', d: ['Signs', 'Gravity', 'Arrival'] },

{ c: 'Movies', t: 4, q: 'In Black Narcissus, where do the nuns establish their new convent?', a: 'In the Himalayas', d: ['On the coast of Ireland', 'In the Andes', 'In the Scottish Highlands'] },
{ c: 'Television', t: 4, q: 'Which 1966 Japanese series featured a giant silver and red hero who could only fight on Earth for three minutes at a time?', a: 'Ultraman', d: ['Ultra Q', 'Kamen Rider', 'Giant Robo'] },
{ c: 'Actors & Directors', t: 4, q: 'Which composer scored Vertigo, Psycho and Taxi Driver?', a: 'Bernard Herrmann', d: ['Elmer Bernstein', 'Miklos Rozsa', 'Franz Waxman'] },
{ c: 'Awards & Box Office', t: 4, q: 'Which film took the Palme d\'Or at Cannes in 2019?', a: 'Parasite', d: ['Burning', 'Pain and Glory', 'Portrait of a Lady on Fire'] },
{ c: 'Behind the Scenes', t: 4, q: 'Which 1968 film had a giant rotating centrifuge built so actors could appear to walk around the inside of a spacecraft?', a: '2001: A Space Odyssey', d: ['Marooned', 'Planet of the Apes', 'Barbarella'] },

{ c: 'Movies', t: 5, q: 'In The Spirit of the Beehive, which film does the young girl watch in the village hall?', a: 'Frankenstein', d: ['Nosferatu', 'The Wolf Man', 'King Kong'] },
{ c: 'Television', t: 5, q: 'Which 1979 anime introduced the Universal Century calendar and a conflict known as the One Year War?', a: 'Mobile Suit Gundam', d: ['Space Battleship Yamato', 'The Super Dimension Fortress Macross', 'Armored Trooper Votoms'] },
{ c: 'Actors & Directors', t: 5, q: 'Which actor played the grown Apu in Satyajit Ray\'s The World of Apu, and went on to make more than a dozen films with that director?', a: 'Soumitra Chatterjee', d: ['Uttam Kumar', 'Anil Chatterjee', 'Subir Banerjee'] },
{ c: 'Awards & Box Office', t: 5, q: 'Which film shared the 1993 Palme d\'Or with Farewell My Concubine?', a: 'The Piano', d: ['Naked', 'The Wedding Banquet', 'Three Colors: Blue'] },
{ c: 'Behind the Scenes', t: 5, q: 'Which effects supervisor developed the slit-scan rig used for the Star Gate sequence of 2001: A Space Odyssey?', a: 'Douglas Trumbull', d: ['Ray Harryhausen', 'Albert Whitlock', 'Linwood Dunn'] },
],

// ── Day 33 ──────────────────────────────────────────────────────────────
[
{ c: 'Movies', t: 1, q: 'What is the name of the forgetful blue fish who helps Marlin search for his son?', a: 'Dory', d: ['Coral', 'Pearl', 'Deb'] },
{ c: 'Television', t: 1, q: 'Which animated series follows four teenagers and a Great Dane solving mysteries in a van called the Mystery Machine?', a: 'Scooby-Doo', d: ['Josie and the Pussycats', 'The Funky Phantom', 'Jabberjaw'] },
{ c: 'Actors & Directors', t: 1, q: 'Which actor wore the cowl in Christopher Nolan\'s Dark Knight trilogy?', a: 'Christian Bale', d: ['Michael Keaton', 'Ben Affleck', 'Val Kilmer'] },
{ c: 'Awards & Box Office', t: 1, q: 'Which 2016 musical about a jazz pianist and an actress in Los Angeles won six Academy Awards?', a: 'La La Land', d: ['Moonlight', 'Manchester by the Sea', 'Arrival'] },
{ c: 'Behind the Scenes', t: 1, q: 'Which North African country provided the desert locations for the planet Tatooine in the 1977 Star Wars?', a: 'Tunisia', d: ['Morocco', 'Egypt', 'Algeria'] },

{ c: 'Movies', t: 2, q: 'In The Shining, at which isolated hotel does the family spend the winter?', a: 'The Overlook', d: ['The Stanley', 'The Bates Lodge', 'The Timberline Inn'] },
{ c: 'Television', t: 2, q: 'Which western series was set in Dodge City, Kansas, and ran for twenty seasons from 1955?', a: 'Gunsmoke', d: ['Rawhide', 'Wagon Train', 'The Virginian'] },
{ c: 'Actors & Directors', t: 2, q: 'Which actor directed and starred in Braveheart?', a: 'Mel Gibson', d: ['Kevin Costner', 'Russell Crowe', 'Liam Neeson'] },
{ c: 'Awards & Box Office', t: 2, q: 'Which film won the Academy Award for Best Animated Feature for 2019?', a: 'Toy Story 4', d: ['Frozen II', 'Klaus', 'Missing Link'] },
{ c: 'Behind the Scenes', t: 2, q: 'Which 1997 blockbuster built a near full-size replica of its doomed vessel at a purpose-built studio in Rosarito, Mexico?', a: 'Titanic', d: ['The Perfect Storm', 'Master and Commander', 'Pearl Harbor'] },

{ c: 'Movies', t: 3, q: 'In The Good, the Bad and the Ugly, what is hidden in a grave in the cemetery?', a: 'A cache of Confederate gold', d: ['A crate of rifles', 'A stolen army payroll ledger', 'A map to a silver mine'] },
{ c: 'Television', t: 3, q: 'Which sitcom followed three mismatched priests and their tea-obsessed housekeeper on a remote island off the Irish coast?', a: 'Father Ted', d: ['Ballykissangel', 'Derry Girls', 'Mrs. Brown\'s Boys'] },
{ c: 'Actors & Directors', t: 3, q: 'Which actor turned director made Ordinary People, A River Runs Through It and Quiz Show?', a: 'Robert Redford', d: ['Warren Beatty', 'Kevin Costner', 'Ron Howard'] },
{ c: 'Awards & Box Office', t: 3, q: 'Which actor won the Academy Award for Best Actor for Gladiator?', a: 'Russell Crowe', d: ['Tom Hanks', 'Ed Harris', 'Geoffrey Rush'] },
{ c: 'Behind the Scenes', t: 3, q: 'Which 1959 epic staged its chariot race in a full-size arena built on the back lot of Rome\'s Cinecitta studios?', a: 'Ben-Hur', d: ['Spartacus', 'Quo Vadis', 'The Robe'] },

{ c: 'Movies', t: 4, q: 'What does the celebrated lateral tracking shot in Godard\'s Weekend follow?', a: 'A traffic jam on a country road', d: ['A funeral procession', 'A marching column of soldiers', 'A river of refugees'] },
{ c: 'Television', t: 4, q: 'The Italian detective series based on Andrea Camilleri novels is set in which fictional Sicilian town?', a: 'Vigata', d: ['Corleone', 'Trapani', 'Ragusa'] },
{ c: 'Actors & Directors', t: 4, q: 'Which Polish director made the Three Colors trilogy and The Double Life of Veronique?', a: 'Krzysztof Kieslowski', d: ['Andrzej Wajda', 'Agnieszka Holland', 'Jerzy Skolimowski'] },
{ c: 'Awards & Box Office', t: 4, q: 'Which animated film shared the Golden Bear at Berlin in 2002 with Bloody Sunday?', a: 'Spirited Away', d: ['Princess Mononoke', 'Grave of the Fireflies', 'Millennium Actress'] },
{ c: 'Behind the Scenes', t: 4, q: 'For which Werner Herzog film did the crew haul a real steamship over a hill between two rivers in the Peruvian jungle?', a: 'Fitzcarraldo', d: ['Aguirre, the Wrath of God', 'The Mission', 'Cobra Verde'] },

{ c: 'Movies', t: 5, q: 'What trade does Genjuro practice in Mizoguchi\'s Ugetsu?', a: 'Pottery', d: ['Fishing', 'Sword-making', 'Silk weaving'] },
{ c: 'Television', t: 5, q: 'Which 2012 Brazilian telenovela built a national phenomenon out of a revenge plot set in a Rio de Janeiro suburb and its rubbish dump?', a: 'Avenida Brasil', d: ['O Clone', 'Senhora do Destino', 'Vale Tudo'] },
{ c: 'Actors & Directors', t: 5, q: 'Which Hungarian director made Satantango and Werckmeister Harmonies?', a: 'Bela Tarr', d: ['Miklos Jancso', 'Istvan Szabo', 'Karoly Makk'] },
{ c: 'Awards & Box Office', t: 5, q: 'Which composer won the Academy Award for Best Original Score for Joker, the first woman to take that category?', a: 'Hildur Gudnadottir', d: ['Rachel Portman', 'Anne Dudley', 'Mica Levi'] },
{ c: 'Behind the Scenes', t: 5, q: 'Which documentary recorded the collapse of Terry Gilliam\'s first attempt to film the Don Quixote story in 2000?', a: 'Lost in La Mancha', d: ['Hearts of Darkness', 'Burden of Dreams', 'Jodorowsky\'s Dune'] },
],

// ── Day 34 ──────────────────────────────────────────────────────────────
[
{ c: 'Movies', t: 1, q: 'What is the name of the talking snowman in Disney\'s Frozen?', a: 'Olaf', d: ['Sven', 'Kristoff', 'Marshmallow'] },
{ c: 'Television', t: 1, q: 'In the 1966 Batman series, what is the name of the underground headquarters beneath Wayne Manor?', a: 'the Batcave', d: ['the Bat Bunker', 'the Wayne Vault', 'the Batlab'] },
{ c: 'Actors & Directors', t: 1, q: 'Which actress starred in Speed, Miss Congeniality and Gravity?', a: 'Sandra Bullock', d: ['Julia Roberts', 'Reese Witherspoon', 'Meg Ryan'] },
{ c: 'Awards & Box Office', t: 1, q: 'Which Academy Award is announced last and treated as the ceremony\'s top honor?', a: 'Best Picture', d: ['Best Director', 'Best Actor', 'Best Original Screenplay'] },
{ c: 'Behind the Scenes', t: 1, q: 'Which candy did the makers of E.T. the Extra-Terrestrial use to lure the creature after another manufacturer turned the film down?', a: 'Reese\'s Pieces', d: ['M&M\'s', 'Skittles', 'Milk Duds'] },

{ c: 'Movies', t: 2, q: 'To which year does Marty McFly first travel in Back to the Future?', a: '1955', d: ['1945', '1965', '1935'] },
{ c: 'Television', t: 2, q: 'Which 1960s sitcom featured a suburban housewife who was secretly a witch and twitched her nose to cast spells?', a: 'Bewitched', d: ['I Dream of Jeannie', 'The Munsters', 'Sabrina the Teenage Witch'] },
{ c: 'Actors & Directors', t: 2, q: 'Which New Zealand director made The Lord of the Rings trilogy?', a: 'Peter Jackson', d: ['Guillermo del Toro', 'Ridley Scott', 'Chris Columbus'] },
{ c: 'Awards & Box Office', t: 2, q: 'Which 2008 superhero sequel was the top-grossing film in North America that year?', a: 'The Dark Knight', d: ['Iron Man', 'Indiana Jones and the Kingdom of the Crystal Skull', 'WALL-E'] },
{ c: 'Behind the Scenes', t: 2, q: 'Which 1990s sitcom shot its coffee house set on a soundstage at the Warner Bros. lot in Burbank?', a: 'Friends', d: ['Frasier', 'Will & Grace', 'Mad About You'] },

{ c: 'Movies', t: 3, q: 'What upheaval in the film industry drives the plot of Singin\' in the Rain?', a: 'The arrival of talking pictures', d: ['The coming of widescreen', 'The collapse of the studio system', 'The switch to color stock'] },
{ c: 'Television', t: 3, q: 'Which Star Trek series is set on a space station beside a wormhole near the planet Bajor?', a: 'Star Trek: Deep Space Nine', d: ['Star Trek: Voyager', 'Star Trek: Enterprise', 'Star Trek: Discovery'] },
{ c: 'Actors & Directors', t: 3, q: 'Which actor played the regional manager Michael Scott in the American version of The Office?', a: 'Steve Carell', d: ['Ricky Gervais', 'Rainn Wilson', 'Will Ferrell'] },
{ c: 'Awards & Box Office', t: 3, q: 'Which actress won Best Actress for playing Elizabeth II in a 2006 film?', a: 'Helen Mirren', d: ['Judi Dench', 'Kate Winslet', 'Meryl Streep'] },
{ c: 'Behind the Scenes', t: 3, q: 'Which 1990s science fiction series filmed its first five seasons in Vancouver before relocating production to Los Angeles?', a: 'The X-Files', d: ['Stargate SG-1', 'Highlander', 'Millennium'] },

{ c: 'Movies', t: 4, q: 'What is Baptiste\'s profession in Children of Paradise?', a: 'A mime', d: ['A juggler', 'A puppeteer', 'A rope dancer'] },
{ c: 'Television', t: 4, q: 'In Cowboy Bebop, what is the name of the small red fighter craft flown by Spike Spiegel?', a: 'the Swordfish II', d: ['the Red Tail', 'the Hammerhead', 'the Kestrel'] },
{ c: 'Actors & Directors', t: 4, q: 'Which writer created The Sopranos and ran it for six seasons?', a: 'David Chase', d: ['David Simon', 'David Milch', 'Tom Fontana'] },
{ c: 'Awards & Box Office', t: 4, q: 'Which film won the Sundance Grand Jury Prize for drama in 2014?', a: 'Whiplash', d: ['Boyhood', 'Dear White People', 'Blue Ruin'] },
{ c: 'Behind the Scenes', t: 4, q: 'Which 1954 Hitchcock film had an entire Greenwich Village courtyard built as a single set on a Paramount soundstage?', a: 'Rear Window', d: ['Rosemary\'s Baby', 'The Apartment', 'On the Waterfront'] },

{ c: 'Movies', t: 5, q: 'Whose life does Sergei Parajanov evoke in The Color of Pomegranates?', a: 'The Armenian poet Sayat-Nova', d: ['The Georgian painter Pirosmani', 'The Persian poet Rumi', 'The Russian icon painter Rublev'] },
{ c: 'Television', t: 5, q: 'Which 1973 Thames Television documentary series covered the 1939 to 1945 conflict across twenty-six episodes?', a: 'The World at War', d: ['Victory at Sea', 'The Great War', 'The Valiant Years'] },
{ c: 'Actors & Directors', t: 5, q: 'Which Italian cinematographer shot Apocalypse Now and The Conformist?', a: 'Vittorio Storaro', d: ['Gordon Willis', 'Sven Nykvist', 'Nestor Almendros'] },
{ c: 'Awards & Box Office', t: 5, q: 'Which 1935 Best Picture winner had three of its cast nominated for Best Actor in the same year?', a: 'Mutiny on the Bounty', d: ['The Informer', 'Captain Blood', 'David Copperfield'] },
{ c: 'Behind the Scenes', t: 5, q: 'Which BBC Radiophonic Workshop composer realized the original 1963 Doctor Who theme from Ron Grainer\'s written score?', a: 'Delia Derbyshire', d: ['Daphne Oram', 'Maddalena Fagandini', 'Dick Mills'] },
],

// ── Day 35 ──────────────────────────────────────────────────────────────
[
{ c: 'Movies', t: 1, q: 'What sport, played on flying broomsticks, do the students compete in at Hogwarts?', a: 'Quidditch', d: ['Gobstones', 'Wizard chess', 'Broomball'] },
{ c: 'Television', t: 1, q: 'In The Addams Family, what is the name of the disembodied hand that helps around the house?', a: 'Thing', d: ['Lurch', 'Cousin Itt', 'Fester'] },
{ c: 'Actors & Directors', t: 1, q: 'Which Canadian comic actor voiced the green ogre in the Shrek films?', a: 'Mike Myers', d: ['Eddie Murphy', 'John Goodman', 'Robin Williams'] },
{ c: 'Awards & Box Office', t: 1, q: 'In which country is the Venice Film Festival held?', a: 'Italy', d: ['Spain', 'Greece', 'Portugal'] },
{ c: 'Behind the Scenes', t: 1, q: 'Which film franchise beginning in 2003 was developed from a Disney theme park attraction?', a: 'Pirates of the Caribbean', d: ['The Chronicles of Narnia', 'National Treasure', 'Night at the Museum'] },

{ c: 'Movies', t: 2, q: 'What relic is the object of the quest in Indiana Jones and the Last Crusade?', a: 'The Holy Grail', d: ['The Spear of Destiny', 'The Shroud of Turin', 'The Crown of Thorns'] },
{ c: 'Television', t: 2, q: 'Which sitcom blended a widowed architect and his three sons with his new wife and her three daughters?', a: 'The Brady Bunch', d: ['The Partridge Family', 'Eight Is Enough', 'Family Affair'] },
{ c: 'Actors & Directors', t: 2, q: 'Which actress starred in Black Swan, V for Vendetta and Leon: The Professional?', a: 'Natalie Portman', d: ['Winona Ryder', 'Keira Knightley', 'Anne Hathaway'] },
{ c: 'Awards & Box Office', t: 2, q: 'Which actor won Best Actor for playing the singer of Queen in a 2018 film?', a: 'Rami Malek', d: ['Christian Bale', 'Bradley Cooper', 'Willem Dafoe'] },
{ c: 'Behind the Scenes', t: 2, q: 'For which 1994 animated feature did Disney bring live big cats into the studio for animators to study?', a: 'The Lion King', d: ['The Jungle Book', 'Tarzan', 'Aladdin'] },

{ c: 'Movies', t: 3, q: 'In The Terminator, what is the name of the computer network that launches the war on humanity?', a: 'Skynet', d: ['Cyberdyne', 'OCP', 'MCP'] },
{ c: 'Television', t: 3, q: 'In the Australian soap Neighbours, what is the name of the cul-de-sac in Erinsborough where most of the characters live?', a: 'Ramsay Street', d: ['Summer Bay', 'Wandin Valley', 'Bellbird Court'] },
{ c: 'Actors & Directors', t: 3, q: 'Which Spanish director made Talk to Her, Volver and All About My Mother?', a: 'Pedro Almodovar', d: ['Alejandro Amenabar', 'Carlos Saura', 'Luis Bunuel'] },
{ c: 'Awards & Box Office', t: 3, q: 'Which film won the Academy Award for Best Animated Feature for 2009?', a: 'Up', d: ['Coraline', 'Fantastic Mr. Fox', 'The Princess and the Frog'] },
{ c: 'Behind the Scenes', t: 3, q: 'Which 1998 war film staged its opening landing in County Wexford, Ireland, using Irish Army reservists as extras?', a: 'Saving Private Ryan', d: ['The Longest Day', 'Dunkirk', 'The Thin Red Line'] },

{ c: 'Movies', t: 4, q: 'What is Cleo waiting for over the two hours of Agnes Varda\'s Cleo from 5 to 7?', a: 'The result of a medical test', d: ['A lover to return from Algeria', 'A record contract to be signed', 'A verdict in a court case'] },
{ c: 'Television', t: 4, q: 'Which 1963 series about a rocket-powered robot boy is regarded as the first weekly Japanese animated television series?', a: 'Astro Boy', d: ['Gigantor', 'Kimba the White Lion', 'Speed Racer'] },
{ c: 'Actors & Directors', t: 4, q: 'Which Japanese composer scored Ran, Kwaidan and Woman in the Dunes?', a: 'Toru Takemitsu', d: ['Fumio Hayasaka', 'Joe Hisaishi', 'Ryuichi Sakamoto'] },
{ c: 'Awards & Box Office', t: 4, q: 'Which Danish film won the Academy Award for Best International Feature for 2020?', a: 'Another Round', d: ['Quo Vadis, Aida?', 'Collective', 'Better Days'] },
{ c: 'Behind the Scenes', t: 4, q: 'Which disused London gasworks was dressed to stand in for the ruined Vietnamese city of Hue in Full Metal Jacket?', a: 'Beckton', d: ['Battersea', 'Greenwich', 'Bankside'] },

{ c: 'Movies', t: 5, q: 'Which matchstick game do the men repeatedly play in Last Year at Marienbad?', a: 'Nim', d: ['Mancala', 'Backgammon', 'Dominoes'] },
{ c: 'Television', t: 5, q: 'In the Colombian telenovela about a brilliant but plain-looking economist, what is the name of the fashion house where she works?', a: 'Ecomoda', d: ['Moda Bella', 'Casa Ferrer', 'Vanidades'] },
{ c: 'Actors & Directors', t: 5, q: 'Which Argentine director made La Cienaga, The Headless Woman and Zama?', a: 'Lucrecia Martel', d: ['Lisandro Alonso', 'Pablo Trapero', 'Lucia Puenzo'] },
{ c: 'Awards & Box Office', t: 5, q: 'Which film took the Golden Lion at Venice in 2005?', a: 'Brokeback Mountain', d: ['Good Night, and Good Luck', 'The Constant Gardener', 'Match Point'] },
{ c: 'Behind the Scenes', t: 5, q: 'Which effects process used a mirror with sections of its backing scraped away to combine miniatures with live actors in Metropolis?', a: 'The Schufftan process', d: ['The Dunning process', 'The Williams process', 'The Handschiegl process'] },
],

// ── Day 36 ──────────────────────────────────────────────────────────────
[
{ c: 'Movies', t: 1, q: 'What is the name of the fur-obsessed villain in Disney\'s One Hundred and One Dalmatians?', a: 'Cruella de Vil', d: ['Maleficent', 'Ursula', 'Madame Medusa'] },
{ c: 'Television', t: 1, q: 'Which game show has contestants spin a giant wheel and guess letters to solve word puzzles?', a: 'Wheel of Fortune', d: ['The Price Is Right', 'Press Your Luck', 'Card Sharks'] },
{ c: 'Actors & Directors', t: 1, q: 'Which actor played the long-serving inmate Red in The Shawshank Redemption?', a: 'Morgan Freeman', d: ['Denzel Washington', 'James Earl Jones', 'Danny Glover'] },
{ c: 'Awards & Box Office', t: 1, q: 'Which 1939 musical fantasy produced the Best Original Song winner Over the Rainbow?', a: 'The Wizard of Oz', d: ['Gone with the Wind', 'Snow White and the Seven Dwarfs', 'Babes in Arms'] },
{ c: 'Behind the Scenes', t: 1, q: 'Which 1999 horror hit was shot by its three cast members operating the cameras themselves?', a: 'The Blair Witch Project', d: ['The Sixth Sense', 'Scream', 'The Ring'] },

{ c: 'Movies', t: 2, q: 'In Pirates of the Caribbean: The Curse of the Black Pearl, what happens to the cursed crew in moonlight?', a: 'They appear as walking skeletons', d: ['They turn to sea foam', 'They age a hundred years', 'They become invisible'] },
{ c: 'Television', t: 2, q: 'Which Australian animated series follows a six-year-old blue heeler puppy, her sister Bingo and their endlessly patient parents?', a: 'Bluey', d: ['Peppa Pig', 'Paw Patrol', 'Ben and Holly\'s Little Kingdom'] },
{ c: 'Actors & Directors', t: 2, q: 'Which director wrote and made the 1977 film that began the Star Wars saga?', a: 'George Lucas', d: ['Steven Spielberg', 'Irvin Kershner', 'Richard Marquand'] },
{ c: 'Awards & Box Office', t: 2, q: 'Which actress won Best Actress for playing a legal clerk taking on a power company in a 2000 film?', a: 'Julia Roberts', d: ['Julianne Moore', 'Ellen Burstyn', 'Laura Linney'] },
{ c: 'Behind the Scenes', t: 2, q: 'Which puppeteer performed and voiced Yoda for The Empire Strikes Back?', a: 'Frank Oz', d: ['Jim Henson', 'Kevin Clash', 'Caroll Spinney'] },

{ c: 'Movies', t: 3, q: 'What is the aversion therapy in A Clockwork Orange called?', a: 'The Ludovico Technique', d: ['The Pavlov Protocol', 'The Skinner Method', 'The Alexander Cure'] },
{ c: 'Television', t: 3, q: 'Which comedy drama about a mother and daughter is set in the Connecticut town of Stars Hollow?', a: 'Gilmore Girls', d: ['Everwood', 'Hart of Dixie', 'Northern Rescue'] },
{ c: 'Actors & Directors', t: 3, q: 'Which New Zealand director made The Piano and Bright Star?', a: 'Jane Campion', d: ['Gillian Armstrong', 'Sofia Coppola', 'Lynne Ramsay'] },
{ c: 'Awards & Box Office', t: 3, q: 'Which 2017 horror film won the Academy Award for Best Original Screenplay?', a: 'Get Out', d: ['The Shape of Water', 'Three Billboards Outside Ebbing, Missouri', 'Lady Bird'] },
{ c: 'Behind the Scenes', t: 3, q: 'Which fantasy series shot its capital city exteriors in the walled Croatian port of Dubrovnik?', a: 'Game of Thrones', d: ['Rome', 'The Borgias', 'Vikings'] },

{ c: 'Movies', t: 4, q: 'In Don\'t Look Now, in which city are the grieving couple staying?', a: 'Venice', d: ['Prague', 'Lisbon', 'Bruges'] },
{ c: 'Television', t: 4, q: 'Which French comedy drama follows the agents of a Paris talent agency after the death of its founder?', a: 'Call My Agent!', d: ['Spiral', 'The Bureau', 'Family Business'] },
{ c: 'Actors & Directors', t: 4, q: 'Which Italian actress starred in L\'Avventura, La Notte and Red Desert for Michelangelo Antonioni?', a: 'Monica Vitti', d: ['Sophia Loren', 'Claudia Cardinale', 'Anna Magnani'] },
{ c: 'Awards & Box Office', t: 4, q: 'Which series won the Emmy for Outstanding Drama Series in both 2013 and 2014?', a: 'Breaking Bad', d: ['Mad Men', 'Homeland', 'House of Cards'] },
{ c: 'Behind the Scenes', t: 4, q: 'Whose creature effects for the 1982 Antarctic horror film were built almost entirely from mechanical and chemical materials rather than optical work?', a: 'Rob Bottin', d: ['Chris Walas', 'Rick Baker', 'Dick Smith'] },

{ c: 'Movies', t: 5, q: 'In Ousmane Sembene\'s Black Girl, where is Diouana taken to work by her employers?', a: 'The French Riviera', d: ['Paris', 'Marseille', 'Brussels'] },
{ c: 'Television', t: 5, q: 'Which Mexican comedy series centered on a poor orphan boy who lived in a barrel in a tenement courtyard?', a: 'El Chavo del Ocho', d: ['El Chapulin Colorado', 'La Familia P. Luche', 'Los Polivoces'] },
{ c: 'Actors & Directors', t: 5, q: 'Which Filipino director made Insiang and Manila in the Claws of Light?', a: 'Lino Brocka', d: ['Ishmael Bernal', 'Brillante Mendoza', 'Lav Diaz'] },
{ c: 'Awards & Box Office', t: 5, q: 'Which film won the Sundance Grand Jury Prize for drama in 2010?', a: 'Winter\'s Bone', d: ['Blue Valentine', 'The Kids Are All Right', 'Buried'] },
{ c: 'Behind the Scenes', t: 5, q: 'Which cinematographer shot the boxing scenes of the 1947 film Body and Soul while being pushed along on roller skates?', a: 'James Wong Howe', d: ['Gregg Toland', 'Stanley Cortez', 'Nicholas Musuraca'] },
],

// ── Day 37 ──────────────────────────────────────────────────────────────
[
{ c: 'Movies', t: 1, q: 'In Disney\'s Pinocchio, what happens to the puppet\'s nose when he tells a lie?', a: 'It grows longer', d: ['It turns bright red', 'It begins to smoke', 'It falls off'] },
{ c: 'Television', t: 1, q: 'Which reality format locks strangers in a camera-filled house where they nominate each other for eviction each week?', a: 'Big Brother', d: ['The Real World', 'Love Island', 'The Circle'] },
{ c: 'Actors & Directors', t: 1, q: 'Which actor starred in Glory, Training Day and Philadelphia?', a: 'Denzel Washington', d: ['Samuel L. Jackson', 'Wesley Snipes', 'Laurence Fishburne'] },
{ c: 'Awards & Box Office', t: 1, q: 'Which 2023 comedy about a fashion doll was the top-grossing film in North America that year?', a: 'Barbie', d: ['Oppenheimer', 'The Super Mario Bros. Movie', 'Guardians of the Galaxy Vol. 3'] },
{ c: 'Behind the Scenes', t: 1, q: 'Which 1976 boxing film was written by its own leading man, who refused to sell the script unless he could star in it?', a: 'Rocky', d: ['Raging Bull', 'The Hustler', 'Cool Hand Luke'] },

{ c: 'Movies', t: 2, q: 'Which song does Ilsa ask the piano player to perform in Casablanca?', a: 'As Time Goes By', d: ['La Vie en Rose', 'Smoke Gets in Your Eyes', 'Stardust'] },
{ c: 'Television', t: 2, q: 'Which thriller series covered a single day per season, with each episode running one hour in real time?', a: '24', d: ['Homeland', 'The Unit', 'Alias'] },
{ c: 'Actors & Directors', t: 2, q: 'Which English actress starred in Heavenly Creatures, Sense and Sensibility and Eternal Sunshine of the Spotless Mind?', a: 'Kate Winslet', d: ['Nicole Kidman', 'Cate Blanchett', 'Gwyneth Paltrow'] },
{ c: 'Awards & Box Office', t: 2, q: 'Which actor won Best Actor for playing George VI in a 2010 film?', a: 'Colin Firth', d: ['Jeff Bridges', 'James Franco', 'Javier Bardem'] },
{ c: 'Behind the Scenes', t: 2, q: 'Which 1980 sequel did George Lucas pay for himself rather than take studio production money?', a: 'The Empire Strikes Back', d: ['Return of the Jedi', 'Raiders of the Lost Ark', 'American Graffiti'] },

{ c: 'Movies', t: 3, q: 'What does Terry Malloy keep on the rooftop in On the Waterfront?', a: 'Pigeons', d: ['Rabbits', 'Bees', 'Chickens'] },
{ c: 'Television', t: 3, q: 'What is the name of the sleepy North Carolina town where Andy Taylor serves as sheriff?', a: 'Mayberry', d: ['Hooterville', 'Mount Pilot', 'Walnut Grove'] },
{ c: 'Actors & Directors', t: 3, q: 'Which former X-Files writer created Breaking Bad?', a: 'Vince Gilligan', d: ['David Chase', 'Shawn Ryan', 'Kurt Sutter'] },
{ c: 'Awards & Box Office', t: 3, q: 'Which film won the Academy Award for Best Animated Feature for 2017?', a: 'Coco', d: ['The Breadwinner', 'Ferdinand', 'Loving Vincent'] },
{ c: 'Behind the Scenes', t: 3, q: 'Which American sitcom premiering in 2005 was adapted by Greg Daniels from a BBC series of the same name?', a: 'The Office', d: ['Shameless', 'Veep', 'Episodes'] },

{ c: 'Movies', t: 4, q: 'What country house pastime dominates the middle of Jean Renoir\'s The Rules of the Game?', a: 'A hunt', d: ['A masked ball', 'A steeplechase', 'A card tournament'] },
{ c: 'Television', t: 4, q: 'Which Israeli drama about soldiers returning after seventeen years in captivity was the basis for an American series about a rescued marine?', a: 'Prisoners of War', d: ['Fauda', 'BeTipul', 'False Flag'] },
{ c: 'Actors & Directors', t: 4, q: 'Which volatile German actor starred in Aguirre, Nosferatu the Vampyre and Fitzcarraldo for the same director?', a: 'Klaus Kinski', d: ['Bruno Ganz', 'Otto Sander', 'Armin Mueller-Stahl'] },
{ c: 'Awards & Box Office', t: 4, q: 'Which Iranian film won the Academy Award for Best Foreign Language Film for 2011?', a: 'A Separation', d: ['Footnote', 'Bullhead', 'In Darkness'] },
{ c: 'Behind the Scenes', t: 4, q: 'Whose foam latex appliances for a 1968 science fiction film let the actors\' faces move under full ape makeup?', a: 'John Chambers', d: ['William Tuttle', 'Jack Pierce', 'Rick Baker'] },

{ c: 'Movies', t: 5, q: 'Where does the closing scene of Robert Bresson\'s Pickpocket take place?', a: 'In a prison visiting room', d: ['On a train platform', 'At the racetrack', 'In a church'] },
{ c: 'Television', t: 5, q: 'What is the name of the year-long historical drama that NHK began broadcasting annually in 1963?', a: 'the taiga drama', d: ['the asadora', 'the jidaigeki hour', 'the tokusatsu serial'] },
{ c: 'Actors & Directors', t: 5, q: 'Which Malian director made Yeelen?', a: 'Souleymane Cisse', d: ['Idrissa Ouedraogo', 'Ousmane Sembene', 'Med Hondo'] },
{ c: 'Awards & Box Office', t: 5, q: 'Which Romanian film took the Palme d\'Or at Cannes in 2007?', a: '4 Months, 3 Weeks and 2 Days', d: ['Secret Sunshine', 'The Death of Mr. Lazarescu', 'Persepolis'] },
{ c: 'Behind the Scenes', t: 5, q: 'Which device did Disney first use on the 1937 short The Old Mill to give flat animation a sense of depth?', a: 'The multiplane camera', d: ['The rotoscope', 'The optical printer', 'The aerial image printer'] },
],

// ── Day 38 ──────────────────────────────────────────────────────────────
[
{ c: 'Movies', t: 1, q: 'In the 1978 film Superman, what is Clark Kent\'s job at the Daily Planet?', a: 'A reporter', d: ['A photographer', 'A copy editor', 'A printer'] },
{ c: 'Television', t: 1, q: 'Which streaming series follows a helmeted bounty hunter who becomes the guardian of a small green child?', a: 'The Mandalorian', d: ['Andor', 'The Book of Boba Fett', 'Ahsoka'] },
{ c: 'Actors & Directors', t: 1, q: 'Which English actor commanded the Enterprise on television for seven seasons and later played Professor X on film?', a: 'Patrick Stewart', d: ['Ian McKellen', 'Christopher Lee', 'Michael Gambon'] },
{ c: 'Awards & Box Office', t: 1, q: 'Which 2001 adaptation of a children\'s book about a young wizard was the top-grossing film worldwide that year?', a: 'Harry Potter and the Sorcerer\'s Stone', d: ['The Lord of the Rings: The Fellowship of the Ring', 'Shrek', 'Monsters, Inc.'] },
{ c: 'Behind the Scenes', t: 1, q: 'The roars and calls of the dinosaurs in the 1993 film Jurassic Park were built from what?', a: 'Recordings of real animals', d: ['A synthesizer patch', 'Human voices slowed down', 'Recordings of engines and machinery'] },

{ c: 'Movies', t: 2, q: 'Which country\'s independence is William Wallace fighting for in Braveheart?', a: 'Scotland', d: ['Ireland', 'Wales', 'Norway'] },
{ c: 'Television', t: 2, q: 'In Teenage Mutant Ninja Turtles, what is the name of the rat who trains the four brothers?', a: 'Splinter', d: ['Shredder', 'Krang', 'Bebop'] },
{ c: 'Actors & Directors', t: 2, q: 'Which actor starred in Saturday Night Fever, Grease and Pulp Fiction?', a: 'John Travolta', d: ['Nicolas Cage', 'Richard Gere', 'Kurt Russell'] },
{ c: 'Awards & Box Office', t: 2, q: 'Which actress won Best Actress for playing Viola de Lesseps in a 1998 romantic comedy?', a: 'Gwyneth Paltrow', d: ['Cate Blanchett', 'Meryl Streep', 'Fernanda Montenegro'] },
{ c: 'Behind the Scenes', t: 2, q: 'In which US state was the island town of Amity filmed for the 1975 film Jaws?', a: 'Massachusetts', d: ['Maine', 'Rhode Island', 'New Jersey'] },

{ c: 'Movies', t: 3, q: 'What is the name of the hovercraft Morpheus commands in The Matrix?', a: 'The Nebuchadnezzar', d: ['The Icarus', 'The Logos', 'The Osiris'] },
{ c: 'Television', t: 3, q: 'Which animated series follows a boy with an arrow tattoo who must master water, earth, fire and air?', a: 'Avatar: The Last Airbender', d: ['The Legend of Korra', 'Samurai Jack', 'Voltron'] },
{ c: 'Actors & Directors', t: 3, q: 'Which actress turned director made Lady Bird and a 2019 version of Little Women?', a: 'Greta Gerwig', d: ['Sofia Coppola', 'Olivia Wilde', 'Emerald Fennell'] },
{ c: 'Awards & Box Office', t: 3, q: 'Which film won the Academy Award for Best Animated Feature for 2010?', a: 'Toy Story 3', d: ['How to Train Your Dragon', 'The Illusionist', 'Despicable Me'] },
{ c: 'Behind the Scenes', t: 3, q: 'Which 1994 prison drama was filmed largely at a disused reformatory in Mansfield, Ohio?', a: 'The Shawshank Redemption', d: ['Cool Hand Luke', 'The Green Mile', 'Escape from Alcatraz'] },

{ c: 'Movies', t: 4, q: 'In Three Colors: Blue, what unfinished composition hangs over the widow?', a: 'A concerto for the unification of Europe', d: ['An opera about Joan of Arc', 'A requiem for her daughter', 'A symphony for the city of Warsaw'] },
{ c: 'Television', t: 4, q: 'In the British police drama about rooting out bent coppers, what is the name of the anti-corruption unit the leads work for?', a: 'AC-12', d: ['AC-9', 'SO15', 'CID-4'] },
{ c: 'Actors & Directors', t: 4, q: 'Which cinematographer shot The Red Shoes and Black Narcissus for Powell and Pressburger?', a: 'Jack Cardiff', d: ['Freddie Young', 'Robert Krasker', 'Oswald Morris'] },
{ c: 'Awards & Box Office', t: 4, q: 'Which series swept all seven comedy categories at the 2020 Primetime Emmy Awards?', a: 'Schitt\'s Creek', d: ['Ted Lasso', 'The Good Place', 'Veep'] },
{ c: 'Behind the Scenes', t: 4, q: 'Which 1974 mystery had a screenplay by Robert Towne, who publicly disagreed with the director over its ending?', a: 'Chinatown', d: ['The Long Goodbye', 'Serpico', 'The Conversation'] },

{ c: 'Movies', t: 5, q: 'What is the traveler searching for across the Balkans in Ulysses\' Gaze?', a: 'Three undeveloped reels of film', d: ['His brother\'s grave', 'A lost violin', 'A stolen icon'] },
{ c: 'Television', t: 5, q: 'Which Icelandic crime series cuts off a small fjord town by storm after a body is pulled from the harbor?', a: 'Trapped', d: ['Case', 'The Valhalla Murders', 'Lava Field'] },
{ c: 'Actors & Directors', t: 5, q: 'Which Taiwanese director made A Brighter Summer Day and Yi Yi?', a: 'Edward Yang', d: ['Hou Hsiao-hsien', 'Tsai Ming-liang', 'Ang Lee'] },
{ c: 'Awards & Box Office', t: 5, q: 'Which film won the Sundance Grand Jury Prize for drama in 2012?', a: 'Beasts of the Southern Wild', d: ['Middle of Nowhere', 'Compliance', 'Smashed'] },
{ c: 'Behind the Scenes', t: 5, q: 'Which matte artist painted effects shots for Hitchcock and later supervised the miniature and matte work on Earthquake?', a: 'Albert Whitlock', d: ['Peter Ellenshaw', 'Matthew Yuricich', 'Emil Kosa Jr.'] },
],

// ── Day 39 ──────────────────────────────────────────────────────────────
[
{ c: 'Movies', t: 1, q: 'What is the name of the vast battle station the rebels destroy in the first Star Wars film?', a: 'The Death Star', d: ['The Star Destroyer', 'The Starkiller Base', 'The Executor'] },
{ c: 'Television', t: 1, q: 'In which South Korean series do heavily indebted contestants compete in childhood playground games for an enormous cash prize?', a: 'Squid Game', d: ['Alice in Borderland', 'Kingdom', 'Sweet Home'] },
{ c: 'Actors & Directors', t: 1, q: 'Which actress starred in Ghost, Sister Act and The Color Purple?', a: 'Whoopi Goldberg', d: ['Angela Bassett', 'Alfre Woodard', 'Cicely Tyson'] },
{ c: 'Awards & Box Office', t: 1, q: 'Which Academy Award did Jurassic Park win in 1994 for the way its dinosaurs were brought to the screen?', a: 'Best Visual Effects', d: ['Best Cinematography', 'Best Film Editing', 'Best Production Design'] },
{ c: 'Behind the Scenes', t: 1, q: 'Which 1990 comedy used a real family house in Winnetka, Illinois, for its exteriors and several interiors?', a: 'Home Alone', d: ['Uncle Buck', 'Ferris Bueller\'s Day Off', 'Christmas Vacation'] },

{ c: 'Movies', t: 2, q: 'Which sport does Forrest Gump play for an American team that tours China?', a: 'Table tennis', d: ['Basketball', 'Volleyball', 'Badminton'] },
{ c: 'Television', t: 2, q: 'Which Regency-era drama about the London marriage market is narrated by the anonymous Lady Whistledown?', a: 'Bridgerton', d: ['Sanditon', 'Belgravia', 'The Gilded Age'] },
{ c: 'Actors & Directors', t: 2, q: 'Which director made Edward Scissorhands, Beetlejuice and Sleepy Hollow?', a: 'Tim Burton', d: ['Sam Raimi', 'Terry Gilliam', 'Barry Sonnenfeld'] },
{ c: 'Awards & Box Office', t: 2, q: 'Which 2015 sequel opened to about 248 million dollars in North America, a record at the time?', a: 'Star Wars: The Force Awakens', d: ['Jurassic World', 'Avengers: Age of Ultron', 'Spectre'] },
{ c: 'Behind the Scenes', t: 2, q: 'Which 1980 film built its hotel interiors at Elstree Studios in England while using an Oregon lodge for exteriors?', a: 'The Shining', d: ['Misery', 'The Fog', 'Christine'] },

{ c: 'Movies', t: 3, q: 'In Apollo 13, what crippling failure strikes the spacecraft on the way to the Moon?', a: 'An oxygen tank explodes', d: ['A meteoroid punctures the hull', 'The heat shield cracks on launch', 'The guidance computer catches fire'] },
{ c: 'Television', t: 3, q: 'Which sitcom followed a study group at Greendale, a shabby two-year college in Colorado?', a: 'Community', d: ['Undeclared', 'Happy Endings', 'The Good Place'] },
{ c: 'Actors & Directors', t: 3, q: 'Which French actress played the title role in Amelie?', a: 'Audrey Tautou', d: ['Marion Cotillard', 'Julie Delpy', 'Emmanuelle Beart'] },
{ c: 'Awards & Box Office', t: 3, q: 'Which actor won Best Actor for playing Ray Charles?', a: 'Jamie Foxx', d: ['Don Cheadle', 'Leonardo DiCaprio', 'Clint Eastwood'] },
{ c: 'Behind the Scenes', t: 3, q: 'For which 1967 spy film did Pinewood host an enormous volcano lair set built on the studio grounds?', a: 'You Only Live Twice', d: ['Thunderball', 'Goldfinger', 'Diamonds Are Forever'] },

{ c: 'Movies', t: 4, q: 'In La Dolce Vita, in which Roman landmark do the two characters wade at night?', a: 'The Trevi Fountain', d: ['The Colosseum', 'The Spanish Steps', 'The Baths of Caracalla'] },
{ c: 'Television', t: 4, q: 'In the German science fiction series about four families and a time-loop, what is the name of the town with the nuclear plant and the caves?', a: 'Winden', d: ['Nebel', 'Marburg', 'Hollental'] },
{ c: 'Actors & Directors', t: 4, q: 'Which Italian composer wrote the music for The Godfather and for most of Federico Fellini\'s films?', a: 'Nino Rota', d: ['Ennio Morricone', 'Riz Ortolani', 'Carlo Rustichelli'] },
{ c: 'Awards & Box Office', t: 4, q: 'Which film won the BAFTA for Best Film at the 2020 ceremony?', a: '1917', d: ['Joker', 'Parasite', 'Once Upon a Time in Hollywood'] },
{ c: 'Behind the Scenes', t: 4, q: 'Which production designer created the War Room for Dr. Strangelove?', a: 'Ken Adam', d: ['John Box', 'Anton Furst', 'Richard Sylbert'] },

{ c: 'Movies', t: 5, q: 'Which historical episode does the family drama of A City of Sadness unfold around?', a: 'The February 28 incident in Taiwan', d: ['The Cultural Revolution', 'The Japanese invasion of Manchuria', 'The Korean War'] },
{ c: 'Television', t: 5, q: 'Which 1969 BBC Two series surveyed Western art and ideas across thirteen episodes and became a landmark of color broadcasting?', a: 'Civilisation', d: ['The Ascent of Man', 'Ways of Seeing', 'The Shock of the New'] },
{ c: 'Actors & Directors', t: 5, q: 'Which Soviet Armenian director made The Color of Pomegranates?', a: 'Sergei Parajanov', d: ['Otar Iosseliani', 'Tengiz Abuladze', 'Andrei Konchalovsky'] },
{ c: 'Awards & Box Office', t: 5, q: 'Which Terrence Malick film took the Palme d\'Or at Cannes in 2011?', a: 'The Tree of Life', d: ['Melancholia', 'Drive', 'The Kid with a Bike'] },
{ c: 'Behind the Scenes', t: 5, q: 'Which editor cut Lawrence of Arabia, including its celebrated cut from a struck match to a desert sunrise?', a: 'Anne V. Coates', d: ['Thelma Schoonmaker', 'Dede Allen', 'Verna Fields'] },
],

// ── Day 40 ──────────────────────────────────────────────────────────────
[
{ c: 'Movies', t: 1, q: 'How does the magical nanny arrive at the Banks household in Mary Poppins?', a: 'Blown in on the wind holding an umbrella', d: ['On a flying carpet', 'By hansom cab', 'Down the chimney'] },
{ c: 'Television', t: 1, q: 'Which preschool series features four brightly colored characters with aerials on their heads and screens in their tummies?', a: 'Teletubbies', d: ['Boohbah', 'Tweenies', 'Rainbow'] },
{ c: 'Actors & Directors', t: 1, q: 'Which actor played the boy wizard across eight Harry Potter films?', a: 'Daniel Radcliffe', d: ['Rupert Grint', 'Tom Felton', 'Freddie Highmore'] },
{ c: 'Awards & Box Office', t: 1, q: 'Which 1994 Disney animated musical was the top-grossing film worldwide that year?', a: 'The Lion King', d: ['Aladdin', 'Beauty and the Beast', 'Pocahontas'] },
{ c: 'Behind the Scenes', t: 1, q: 'The exterior seen in the opening titles of the sitcom Cheers is what?', a: 'A real Boston bar', d: ['A painted backdrop', 'A model built on the lot', 'A pub in Dublin'] },

{ c: 'Movies', t: 2, q: 'What business does Norman Bates run in Psycho?', a: 'A motel', d: ['A gas station', 'A funeral home', 'A boarding school'] },
{ c: 'Television', t: 2, q: 'Which spy spoof featured an agent who took calls on his shoe and worked for an outfit called CONTROL?', a: 'Get Smart', d: ['I Spy', 'The Wild Wild West', 'Danger Man'] },
{ c: 'Actors & Directors', t: 2, q: 'Which actor starred in Blade Runner, The Fugitive and Air Force One?', a: 'Harrison Ford', d: ['Kurt Russell', 'Mel Gibson', 'Michael Douglas'] },
{ c: 'Awards & Box Office', t: 2, q: 'Which actor won Best Supporting Actor for Good Will Hunting?', a: 'Robin Williams', d: ['Burt Reynolds', 'Anthony Hopkins', 'Robert Forster'] },
{ c: 'Behind the Scenes', t: 2, q: 'Which designer built the title creature for Steven Spielberg\'s 1982 film about a stranded alien?', a: 'Carlo Rambaldi', d: ['Chris Walas', 'Phil Tippett', 'Rob Bottin'] },

{ c: 'Movies', t: 3, q: 'What is the name of the high school in Grease?', a: 'Rydell High', d: ['Ridgemont High', 'Shermer High', 'Bayside High'] },
{ c: 'Television', t: 3, q: 'In the Spanish series about a raid on the Royal Mint, the robbers take their code names from what?', a: 'Cities', d: ['Rivers', 'Painters', 'Constellations'] },
{ c: 'Actors & Directors', t: 3, q: 'Which Mexican director made Amores Perros, Babel and Birdman?', a: 'Alejandro Gonzalez Inarritu', d: ['Alfonso Cuaron', 'Guillermo del Toro', 'Carlos Reygadas'] },
{ c: 'Awards & Box Office', t: 3, q: 'Which Italian film won the Academy Award for Best Foreign Language Film for 1998?', a: 'Life Is Beautiful', d: ['Central Station', 'Children of Heaven', 'The Celebration'] },
{ c: 'Behind the Scenes', t: 3, q: 'Which 1995 space drama shot its weightless scenes aboard a NASA aircraft flying repeated parabolic arcs?', a: 'Apollo 13', d: ['The Right Stuff', 'Gravity', 'Armageddon'] },

{ c: 'Movies', t: 4, q: 'What does Noriko resist doing throughout Ozu\'s Late Spring?', a: 'Marrying and leaving her widowed father', d: ['Selling the family house', 'Taking a job in Tokyo', 'Moving in with her aunt'] },
{ c: 'Television', t: 4, q: 'Which 1990s science fiction series was built around a planned five-year story arc set on a diplomatic space station?', a: 'Babylon 5', d: ['Andromeda', 'Farscape', 'Space: Above and Beyond'] },
{ c: 'Actors & Directors', t: 4, q: 'Which French actress starred in The Piano Teacher, La Ceremonie and Amour?', a: 'Isabelle Huppert', d: ['Isabelle Adjani', 'Juliette Binoche', 'Catherine Deneuve'] },
{ c: 'Awards & Box Office', t: 4, q: 'Which series won the Emmy for Outstanding Drama Series four years running from 2008 to 2011?', a: 'Mad Men', d: ['Breaking Bad', 'The West Wing', 'Lost'] },
{ c: 'Behind the Scenes', t: 4, q: 'Which 1994 film used digital effects to remove a supporting actor\'s legs shot by shot?', a: 'Forrest Gump', d: ['Born on the Fourth of July', 'Coming Home', 'The Fugitive'] },

{ c: 'Movies', t: 5, q: 'Which smell obsesses the hired killer in Seijun Suzuki\'s Branded to Kill?', a: 'Boiling rice', d: ['Gasoline', 'Jasmine', 'Fresh ink'] },
{ c: 'Television', t: 5, q: 'Which Japanese animated series about the Isono family began broadcasting on Fuji TV in 1969?', a: 'Sazae-san', d: ['Doraemon', 'Chibi Maruko-chan', 'Crayon Shin-chan'] },
{ c: 'Actors & Directors', t: 5, q: 'Which Japanese cinematographer shot Rashomon and Ugetsu?', a: 'Kazuo Miyagawa', d: ['Asakazu Nakai', 'Yuharu Atsuta', 'Hiroshi Segawa'] },
{ c: 'Awards & Box Office', t: 5, q: 'Which film won the Sundance Grand Jury Prize for drama in 2013?', a: 'Fruitvale Station', d: ['Upstream Color', 'Ain\'t Them Bodies Saints', 'Blue Caprice'] },
{ c: 'Behind the Scenes', t: 5, q: 'What did the Lord of the Rings crew call the very large miniatures built for Minas Tirith and Helm\'s Deep?', a: 'Bigatures', d: ['Maquettes', 'Macros', 'Overscales'] },
],

// ── Day 41 ──────────────────────────────────────────────────────────────
[
{ c: 'Movies', t: 1, q: 'In Disney\'s Peter Pan, what is inside the crocodile that stalks Captain Hook?', a: 'A ticking clock', d: ['A lost anchor', 'A silver whistle', 'A treasure map'] },
{ c: 'Television', t: 1, q: 'Which animated preschool series follows a young explorer and her monkey companion Boots?', a: 'Dora the Explorer', d: ['Go, Diego, Go!', 'Ni Hao, Kai-Lan', 'Little Einsteins'] },
{ c: 'Actors & Directors', t: 1, q: 'Which actor starred in Face/Off, Con Air and National Treasure?', a: 'Nicolas Cage', d: ['John Travolta', 'Bruce Willis', 'Val Kilmer'] },
{ c: 'Awards & Box Office', t: 1, q: 'Which 1990 Christmas comedy about a boy left behind was the top-grossing film in North America that year?', a: 'Home Alone', d: ['Ghost', 'Pretty Woman', 'Dances with Wolves'] },
{ c: 'Behind the Scenes', t: 1, q: 'Which 2009 film was made with performance capture and a camera system its director spent years waiting on?', a: 'Avatar', d: ['Tron: Legacy', 'Beowulf', 'John Carter'] },

{ c: 'Movies', t: 2, q: 'What are the small forest dwellers who help the rebels on Endor called?', a: 'Ewoks', d: ['Jawas', 'Wookiees', 'Gungans'] },
{ c: 'Television', t: 2, q: 'Which 2006 BBC natural history series gave each episode over to a single habitat such as mountains, deserts or ice worlds?', a: 'Planet Earth', d: ['The Blue Planet', 'Life on Earth', 'Frozen Planet'] },
{ c: 'Actors & Directors', t: 2, q: 'Which actress played Black Widow in the Marvel films?', a: 'Scarlett Johansson', d: ['Elizabeth Olsen', 'Brie Larson', 'Emily Blunt'] },
{ c: 'Awards & Box Office', t: 2, q: 'Which 1982 Steven Spielberg film won the Academy Award for Best Original Score?', a: 'E.T. the Extra-Terrestrial', d: ['Gandhi', 'Tootsie', 'Blade Runner'] },
{ c: 'Behind the Scenes', t: 2, q: 'Which 1988 film put hand-drawn animated characters and live actors in the same frame throughout?', a: 'Who Framed Roger Rabbit', d: ['Cool World', 'Space Jam', 'Pete\'s Dragon'] },

{ c: 'Movies', t: 3, q: 'What is the name of the orphaned girl the marines find on the colony in Aliens?', a: 'Newt', d: ['Ripley', 'Lambert', 'Vasquez'] },
{ c: 'Television', t: 3, q: 'Which animated sitcom is set in Arlen, Texas, and follows an assistant manager at a propane dealership?', a: 'King of the Hill', d: ['Bob\'s Burgers', 'American Dad!', 'The Goldbergs'] },
{ c: 'Actors & Directors', t: 3, q: 'Which British director made Trainspotting, 28 Days Later and Slumdog Millionaire?', a: 'Danny Boyle', d: ['Guy Ritchie', 'Edgar Wright', 'Matthew Vaughn'] },
{ c: 'Awards & Box Office', t: 3, q: 'Which film won the Academy Award for Best Animated Feature for 2015?', a: 'Inside Out', d: ['Anomalisa', 'Shaun the Sheep Movie', 'The Good Dinosaur'] },
{ c: 'Behind the Scenes', t: 3, q: 'Which 1993 stop-motion feature was directed by Henry Selick, though audiences often credit its producer instead?', a: 'The Nightmare Before Christmas', d: ['James and the Giant Peach', 'Coraline', 'Corpse Bride'] },

{ c: 'Movies', t: 4, q: 'To which northern Italian city does the family move in Rocco and His Brothers?', a: 'Milan', d: ['Turin', 'Bologna', 'Genoa'] },
{ c: 'Television', t: 4, q: 'What is the name of the prison in the 1970s British sitcom about an old lag serving five years?', a: 'HMP Slade', d: ['HMP Larkhall', 'HMP Wormwood', 'HMP Bexton'] },
{ c: 'Actors & Directors', t: 4, q: 'Which former Baltimore Sun reporter created The Wire?', a: 'David Simon', d: ['Tom Fontana', 'Shawn Ryan', 'David Milch'] },
{ c: 'Awards & Box Office', t: 4, q: 'Which film took the Golden Lion at Venice in 2019?', a: 'Joker', d: ['Marriage Story', 'The Laundromat', 'Ad Astra'] },
{ c: 'Behind the Scenes', t: 4, q: 'Which animation studio pioneered three-dimensional printed replacement faces for stop-motion characters on Coraline?', a: 'Laika', d: ['Aardman', 'Screen Novelties', 'Will Vinton Studios'] },

{ c: 'Movies', t: 5, q: 'What is mounted on the handlebars of the motorcycle in Touki Bouki?', a: 'A zebu skull with long horns', d: ['A bull\'s tail', 'A carved wooden mask', 'A pair of antelope hooves'] },
{ c: 'Television', t: 5, q: 'Which Norwegian teen series released its scenes online in real time as the day unfolded, changing its point of view character each season?', a: 'Skam', d: ['Blank', 'Lovleg', 'Hotel Caesar'] },
{ c: 'Actors & Directors', t: 5, q: 'Which Thai director made Uncle Boonmee Who Can Recall His Past Lives?', a: 'Apichatpong Weerasethakul', d: ['Lav Diaz', 'Tsai Ming-liang', 'Pen-ek Ratanaruang'] },
{ c: 'Awards & Box Office', t: 5, q: 'Which Hirokazu Kore-eda film took the Palme d\'Or at Cannes in 2018?', a: 'Shoplifters', d: ['Burning', 'BlacKkKlansman', 'Cold War'] },
{ c: 'Behind the Scenes', t: 5, q: 'Which process, introduced on One Hundred and One Dalmatians, copied animators\' drawings straight onto cels without hand inking?', a: 'Xerography', d: ['Rotoscoping', 'Cel-shading', 'Sodium vapor matting'] },
],

// ── Day 42 ──────────────────────────────────────────────────────────────
[
{ c: 'Movies', t: 1, q: 'In which country does most of The Sound of Music take place?', a: 'Austria', d: ['Switzerland', 'Germany', 'Italy'] },
{ c: 'Television', t: 1, q: 'Which series follows teenagers who morph into color-coded costumed heroes using dinosaur power coins?', a: 'Power Rangers', d: ['VR Troopers', 'Big Bad Beetleborgs', 'Masked Rider'] },
{ c: 'Actors & Directors', t: 1, q: 'Which actor played John McClane in Die Hard?', a: 'Bruce Willis', d: ['Mel Gibson', 'Kurt Russell', 'Nicolas Cage'] },
{ c: 'Awards & Box Office', t: 1, q: 'Which 1996 alien invasion blockbuster was the top-grossing film worldwide that year?', a: 'Independence Day', d: ['Twister', 'Mission: Impossible', 'Jerry Maguire'] },
{ c: 'Behind the Scenes', t: 1, q: 'Which long-running animated family began as short segments on a live-action sketch comedy show?', a: 'The Simpsons', d: ['King of the Hill', 'Family Guy', 'Beavis and Butt-Head'] },

{ c: 'Movies', t: 2, q: 'By what name is the green, food-devouring ghost first trapped in a hotel in Ghostbusters known?', a: 'Slimer', d: ['Zuul', 'Gozer', 'Vigo'] },
{ c: 'Television', t: 2, q: 'Which comedy sends an American football coach to manage a struggling English soccer club?', a: 'Ted Lasso', d: ['Brockmire', 'Welcome to Wrexham', 'Trying'] },
{ c: 'Actors & Directors', t: 2, q: 'Which director made The Godfather, The Conversation and Apocalypse Now?', a: 'Francis Ford Coppola', d: ['Sidney Lumet', 'Michael Cimino', 'William Friedkin'] },
{ c: 'Awards & Box Office', t: 2, q: 'Which actress won Best Actress for The Blind Side?', a: 'Sandra Bullock', d: ['Meryl Streep', 'Helen Mirren', 'Carey Mulligan'] },
{ c: 'Behind the Scenes', t: 2, q: 'Which 2013 Disney feature rewrote its ice-powered sister from villain to heroine after her big song was written?', a: 'Frozen', d: ['Tangled', 'Moana', 'Brave'] },

{ c: 'Movies', t: 3, q: 'What treasure are the children hunting beneath their town in The Goonies?', a: 'A pirate\'s hoard', d: ['A gold rush strike', 'A bank robber\'s buried loot', 'A Spanish land grant'] },
{ c: 'Television', t: 3, q: 'Which anthology series about unsettling near-future technology includes an episode set in a simulated beach resort called San Junipero?', a: 'Black Mirror', d: ['Electric Dreams', 'Inside No. 9', 'Tales from the Loop'] },
{ c: 'Actors & Directors', t: 3, q: 'Which actor played the mob boss Tony Soprano at the center of The Sopranos?', a: 'James Gandolfini', d: ['Michael Imperioli', 'Ray Liotta', 'Dominic Chianese'] },
{ c: 'Awards & Box Office', t: 3, q: 'Which 2010 drama about the founders of Facebook won the Academy Award for Best Adapted Screenplay?', a: 'The Social Network', d: ['The King\'s Speech', '127 Hours', 'Winter\'s Bone'] },
{ c: 'Behind the Scenes', t: 3, q: 'Which 1991 Disney feature used computer animation for the ballroom itself while the dancers stayed hand-drawn?', a: 'Beauty and the Beast', d: ['The Little Mermaid', 'Aladdin', 'Pocahontas'] },

{ c: 'Movies', t: 4, q: 'In Antonioni\'s Blow-Up, what does the photographer believe he has accidentally captured in a park?', a: 'A killing', d: ['A ghost', 'A jewel theft', 'A political defection'] },
{ c: 'Television', t: 4, q: 'In the series about two Soviet illegals raising a family in 1980s Washington, what business do they run as their cover?', a: 'A travel agency', d: ['A dry cleaner', 'An insurance office', 'A hardware store'] },
{ c: 'Actors & Directors', t: 4, q: 'Which Hong Kong actor starred in Chungking Express, Hard Boiled and In the Mood for Love?', a: 'Tony Leung Chiu-wai', d: ['Chow Yun-fat', 'Andy Lau', 'Leslie Cheung'] },
{ c: 'Awards & Box Office', t: 4, q: 'Which series won the Emmy for Outstanding Drama Series in 2020?', a: 'Succession', d: ['Ozark', 'Better Call Saul', 'The Crown'] },
{ c: 'Behind the Scenes', t: 4, q: 'Which Pixar feature was nearly lost when a command deleted files from the studio\'s servers during production?', a: 'Toy Story 2', d: ['A Bug\'s Life', 'Monsters, Inc.', 'Finding Nemo'] },

{ c: 'Movies', t: 5, q: 'What must the two women in Celine and Julie Go Boating swallow to re-enter the story unfolding in the house?', a: 'A piece of candy', d: ['A sip of tea', 'A pinch of powder', 'A drop of ink'] },
{ c: 'Television', t: 5, q: 'Which 1984 BBC drama depicted a nuclear attack on Sheffield and the collapse of society afterward?', a: 'Threads', d: ['The War Game', 'When the Wind Blows', 'Z for Zachariah'] },
{ c: 'Actors & Directors', t: 5, q: 'Which Georgian director made Repentance, the final part of a trilogy begun with The Plea?', a: 'Tengiz Abuladze', d: ['Otar Iosseliani', 'Sergei Parajanov', 'Eldar Shengelaia'] },
{ c: 'Awards & Box Office', t: 5, q: 'Which film won the Sundance Grand Jury Prize for drama in 2020?', a: 'Minari', d: ['Nine Days', 'Charm City Kings', 'Palm Springs'] },
{ c: 'Behind the Scenes', t: 5, q: 'Which Disney feature was made by the studio\'s second-choice team while most senior animators worked on Pocahontas?', a: 'The Lion King', d: ['Hercules', 'Mulan', 'The Hunchback of Notre Dame'] },
],

// ── Day 43 ──────────────────────────────────────────────────────────────
[
{ c: 'Movies', t: 1, q: 'Which New York skyscraper does the giant ape climb at the end of the 1933 King Kong?', a: 'The Empire State Building', d: ['The Chrysler Building', 'The Woolworth Building', 'The Flatiron Building'] },
{ c: 'Television', t: 1, q: 'Which game show calls contestants out of the studio audience with the words "Come on down"?', a: 'The Price Is Right', d: ['Let\'s Make a Deal', 'Family Feud', 'The Newlywed Game'] },
{ c: 'Actors & Directors', t: 1, q: 'Which actress starred in Kramer vs. Kramer, Out of Africa and The Devil Wears Prada?', a: 'Meryl Streep', d: ['Glenn Close', 'Diane Keaton', 'Susan Sarandon'] },
{ c: 'Awards & Box Office', t: 1, q: 'Which 2022 sequel about Navy fighter pilots was the top-grossing film in North America that year?', a: 'Top Gun: Maverick', d: ['Avatar: The Way of Water', 'Black Panther: Wakanda Forever', 'Jurassic World Dominion'] },
{ c: 'Behind the Scenes', t: 1, q: 'Which 1965 musical was filmed on location in and around the Austrian city of Salzburg?', a: 'The Sound of Music', d: ['Fiddler on the Roof', 'My Fair Lady', 'Oliver!'] },

{ c: 'Movies', t: 2, q: 'What does the Tramp cook and eat during the famine in The Gold Rush?', a: 'His boot', d: ['His hat', 'A candle', 'His leather belt'] },
{ c: 'Television', t: 2, q: 'Which 1950s sitcom followed a New York City bus driver, his wife Alice and their upstairs neighbors the Nortons?', a: 'The Honeymooners', d: ['The Life of Riley', 'Make Room for Daddy', 'The Goldbergs'] },
{ c: 'Actors & Directors', t: 2, q: 'Which actor starred in Groundhog Day, Ghostbusters and Lost in Translation?', a: 'Bill Murray', d: ['Chevy Chase', 'Dan Aykroyd', 'Steve Martin'] },
{ c: 'Awards & Box Office', t: 2, q: 'Which actor won Best Actor for The Revenant?', a: 'Leonardo DiCaprio', d: ['Michael Fassbender', 'Eddie Redmayne', 'Bryan Cranston'] },
{ c: 'Behind the Scenes', t: 2, q: 'Which Scandinavian country\'s glacier country stood in for the ice planet Hoth in The Empire Strikes Back?', a: 'Norway', d: ['Iceland', 'Sweden', 'Finland'] },

{ c: 'Movies', t: 3, q: 'What happens to the Tramp at the factory in Modern Times?', a: 'He is pulled through the machine\'s gears', d: ['He is sealed inside a boiler', 'He is buried under a coal chute', 'He is welded to a girder'] },
{ c: 'Television', t: 3, q: 'Which animated series follows a boy and his shape-shifting dog through the Land of Ooo?', a: 'Adventure Time', d: ['Regular Show', 'Steven Universe', 'Gravity Falls'] },
{ c: 'Actors & Directors', t: 3, q: 'Which actor played the truant high schooler in Ferris Bueller\'s Day Off?', a: 'Matthew Broderick', d: ['Andrew McCarthy', 'Judd Nelson', 'Jon Cryer'] },
{ c: 'Awards & Box Office', t: 3, q: 'Which film won the Academy Award for Best Animated Feature for 2016?', a: 'Zootopia', d: ['Moana', 'Kubo and the Two Strings', 'Finding Dory'] },
{ c: 'Behind the Scenes', t: 3, q: 'Which 1963 production moved from England to Rome after its star fell seriously ill, running up costs that shook 20th Century Fox?', a: 'Cleopatra', d: ['The Fall of the Roman Empire', 'Spartacus', 'The Agony and the Ecstasy'] },

{ c: 'Movies', t: 4, q: 'What does the dreaming projectionist do in Buster Keaton\'s Sherlock Jr.?', a: 'He walks into the movie screen', d: ['He shrinks to the size of a reel', 'He becomes his own shadow', 'He flies over the audience'] },
{ c: 'Television', t: 4, q: 'Which 1985 BBC serial followed a detective investigating his daughter\'s death and uncovering a secret nuclear operation?', a: 'Edge of Darkness', d: ['A Very British Coup', 'Bird of Prey', 'Reilly, Ace of Spies'] },
{ c: 'Actors & Directors', t: 4, q: 'Which Soviet director made The Ascent in 1977 and died in a car crash two years later?', a: 'Larisa Shepitko', d: ['Kira Muratova', 'Vera Chytilova', 'Marlen Khutsiev'] },
{ c: 'Awards & Box Office', t: 4, q: 'Which German film won the Academy Award for Best Foreign Language Film for 2006?', a: 'The Lives of Others', d: ['Pan\'s Labyrinth', 'Water', 'Days of Glory'] },
{ c: 'Behind the Scenes', t: 4, q: 'Which 1957 film built a full-size bridge in Ceylon and destroyed it for the camera?', a: 'The Bridge on the River Kwai', d: ['Lawrence of Arabia', 'The Guns of Navarone', 'A Passage to India'] },

{ c: 'Movies', t: 5, q: 'How is the narrative of The Saragossa Manuscript built?', a: 'As stories nested inside other stories', d: ['As a single unbroken day', 'As a trial with competing witnesses', 'As a series of letters'] },
{ c: 'Television', t: 5, q: 'Which 1964 Gerry Anderson puppet series followed a submarine crew operating out of a base called Marineville?', a: 'Stingray', d: ['Supercar', 'Fireball XL5', 'Joe 90'] },
{ c: 'Actors & Directors', t: 5, q: 'Which cinematographer shot Breathless, Contempt and Pierrot le Fou for Jean-Luc Godard?', a: 'Raoul Coutard', d: ['Henri Decae', 'Sacha Vierny', 'Willy Kurant'] },
{ c: 'Awards & Box Office', t: 5, q: 'Which documentary took the Golden Bear at Berlin in 2016?', a: 'Fire at Sea', d: ['Death in Sarajevo', 'United States of Love', 'Hedi'] },
{ c: 'Behind the Scenes', t: 5, q: 'Which stuntman performed the Stagecoach team-jump and later directed the Ben-Hur chariot race as second unit?', a: 'Yakima Canutt', d: ['Hal Needham', 'Cliff Lyons', 'Dave Sharpe'] },
],

// ── Day 44 ──────────────────────────────────────────────────────────────
[
{ c: 'Movies', t: 1, q: 'From which London railway platform do Hogwarts students board their train?', a: 'Platform nine and three-quarters', d: ['Platform thirteen', 'Platform seven and a half', 'Platform zero'] },
{ c: 'Television', t: 1, q: 'Which reality dating series ends each episode with a rose ceremony?', a: 'The Bachelor', d: ['Love Island', 'Married at First Sight', 'The Dating Game'] },
{ c: 'Actors & Directors', t: 1, q: 'Which former wrestler starred in the Fast & Furious spinoff Hobbs & Shaw and the Jumanji sequels?', a: 'Dwayne Johnson', d: ['Vin Diesel', 'John Cena', 'Jason Statham'] },
{ c: 'Awards & Box Office', t: 1, q: 'Which 1999 space fantasy prequel was the top-grossing film worldwide that year?', a: 'Star Wars: The Phantom Menace', d: ['The Sixth Sense', 'Toy Story 2', 'The Matrix'] },
{ c: 'Behind the Scenes', t: 1, q: 'The silver shoes of the novel became ruby slippers in the 1939 film mainly to show off what?', a: 'Technicolor', d: ['The new sound system', 'A wider screen', 'A new makeup process'] },

{ c: 'Movies', t: 2, q: 'What does the boxer punch while training in a meat locker in Rocky?', a: 'Sides of beef', d: ['Sacks of flour', 'Blocks of ice', 'Rolled carpets'] },
{ c: 'Television', t: 2, q: 'Which 1980s series followed four soldiers of fortune on the run for a crime they didn\'t commit, hired by people in trouble?', a: 'The A-Team', d: ['Airwolf', 'Riptide', 'The Fall Guy'] },
{ c: 'Actors & Directors', t: 2, q: 'Which actor played the aging Vito Corleone in the 1972 film of The Godfather?', a: 'Marlon Brando', d: ['Al Pacino', 'Lee J. Cobb', 'Rod Steiger'] },
{ c: 'Awards & Box Office', t: 2, q: 'Which 2002 independent romantic comedy grossed more than 350 million dollars worldwide?', a: 'My Big Fat Greek Wedding', d: ['Bend It Like Beckham', 'Napoleon Dynamite', 'Four Weddings and a Funeral'] },
{ c: 'Behind the Scenes', t: 2, q: 'Which skyscraper did the makers of a 2011 Mission: Impossible sequel use for a climbing sequence shot on its outside?', a: 'The Burj Khalifa', d: ['Taipei 101', 'The Petronas Towers', 'The Shard'] },

{ c: 'Movies', t: 3, q: 'What nickname do the FBI agents use for the killer they are hunting in The Silence of the Lambs?', a: 'Buffalo Bill', d: ['The Night Stalker', 'The Tooth Fairy', 'The Chesapeake Ripper'] },
{ c: 'Television', t: 3, q: 'Which mystery series is set in the Maine coastal town of Cabot Cove?', a: 'Murder, She Wrote', d: ['Diagnosis: Murder', 'Matlock', 'Hart to Hart'] },
{ c: 'Actors & Directors', t: 3, q: 'Which Danish director co-founded the Dogme 95 movement and made Breaking the Waves?', a: 'Lars von Trier', d: ['Thomas Vinterberg', 'Susanne Bier', 'Nicolas Winding Refn'] },
{ c: 'Awards & Box Office', t: 3, q: 'Which 2007 comedy about a pregnant teenager won the Academy Award for Best Original Screenplay?', a: 'Juno', d: ['Michael Clayton', 'Lars and the Real Girl', 'Ratatouille'] },
{ c: 'Behind the Scenes', t: 3, q: 'Which silent comedian had a full house facade dropped around him, standing where an open window passed?', a: 'Buster Keaton', d: ['Harold Lloyd', 'Charlie Chaplin', 'Harry Langdon'] },

{ c: 'Movies', t: 4, q: 'In which country is Ashes and Diamonds set on the last day of the Second World War?', a: 'Poland', d: ['Hungary', 'Czechoslovakia', 'Yugoslavia'] },
{ c: 'Television', t: 4, q: 'In the Japanese cooking competition where challengers face a resident master chef, what is the arena called?', a: 'Kitchen Stadium', d: ['the Gourmet Arena', 'the Cooking Dome', 'the Chairman\'s Kitchen'] },
{ c: 'Actors & Directors', t: 4, q: 'Which Japanese actress starred in Late Spring, Early Summer and Tokyo Story, then quit acting in 1963 and withdrew from public life?', a: 'Setsuko Hara', d: ['Hideko Takamine', 'Kinuyo Tanaka', 'Machiko Kyo'] },
{ c: 'Awards & Box Office', t: 4, q: 'Which program won the Emmy for Outstanding Limited Series in 2019?', a: 'Chernobyl', d: ['Escape at Dannemora', 'Fosse/Verdon', 'When They See Us'] },
{ c: 'Behind the Scenes', t: 4, q: 'Which 1971 film shot a car chase beneath an elevated train line in Brooklyn?', a: 'The French Connection', d: ['Bullitt', 'The Seven-Ups', 'Dirty Harry'] },

{ c: 'Movies', t: 5, q: 'What custom governs the villagers in The Ballad of Narayama?', a: 'The elderly are carried up a mountain to die', d: ['Firstborn sons inherit everything', 'Marriages are decided by lottery', 'Strangers may never be fed'] },
{ c: 'Television', t: 5, q: 'Which 1996 BBC serial followed four friends from Newcastle across thirty years of British political life?', a: 'Our Friends in the North', d: ['This Life', 'GBH', 'The Monocled Mutineer'] },
{ c: 'Actors & Directors', t: 5, q: 'Which Ethiopian born director made Harvest: 3,000 Years and Sankofa?', a: 'Haile Gerima', d: ['Med Hondo', 'Abderrahmane Sissako', 'Idrissa Ouedraogo'] },
{ c: 'Awards & Box Office', t: 5, q: 'Which Ken Loach film took the Palme d\'Or at Cannes in 2016?', a: 'I, Daniel Blake', d: ['Toni Erdmann', 'Personal Shopper', 'American Honey'] },
{ c: 'Behind the Scenes', t: 5, q: 'Which Hong Kong action choreographer trained the cast of The Matrix for months before shooting began?', a: 'Yuen Woo-ping', d: ['Sammo Hung', 'Corey Yuen', 'Lau Kar-leung'] },
],

// ── Day 45 ──────────────────────────────────────────────────────────────
[
{ c: 'Movies', t: 1, q: 'In Disney\'s Dumbo, what allows the young elephant to fly?', a: 'His enormous ears', d: ['A magic feather alone', 'A pair of wings sewn on', 'A gust from the circus fans'] },
{ c: 'Television', t: 1, q: 'Which long-running series followed a collie who repeatedly rescued her rural family from danger?', a: 'Lassie', d: ['Rin Tin Tin', 'Flipper', 'Gentle Ben'] },
{ c: 'Actors & Directors', t: 1, q: 'Which actor played the Wakandan king T\'Challa in the Marvel films?', a: 'Chadwick Boseman', d: ['Michael B. Jordan', 'Daniel Kaluuya', 'Winston Duke'] },
{ c: 'Awards & Box Office', t: 1, q: 'The Academy Awards are voted on by the members of which organization?', a: 'The Academy of Motion Picture Arts and Sciences', d: ['The Screen Actors Guild', 'The Directors Guild of America', 'The Hollywood Foreign Press Association'] },
{ c: 'Behind the Scenes', t: 1, q: 'Which 1975 comedy used clapped coconut shells for horse hooves because the production could not afford horses?', a: 'Monty Python and the Holy Grail', d: ['Life of Brian', 'Time Bandits', 'Jabberwocky'] },

{ c: 'Movies', t: 2, q: 'In Jurassic Park, what does the trembling glass of water on the dashboard signal?', a: 'A tyrannosaur approaching', d: ['An earthquake', 'The power grid failing', 'A helicopter landing'] },
{ c: 'Television', t: 2, q: 'Which ITV series adapted Agatha Christie novels about a fastidious Belgian detective from 1989 to 2013?', a: 'Poirot', d: ['Miss Marple', 'Campion', 'Jonathan Creek'] },
{ c: 'Actors & Directors', t: 2, q: 'Which actress played the FBI trainee Clarice Starling in The Silence of the Lambs?', a: 'Jodie Foster', d: ['Michelle Pfeiffer', 'Laura Dern', 'Meg Tilly'] },
{ c: 'Awards & Box Office', t: 2, q: 'Which 1989 Tim Burton superhero film was the top-grossing release in North America that year?', a: 'Batman', d: ['Indiana Jones and the Last Crusade', 'Lethal Weapon 2', 'Ghostbusters II'] },
{ c: 'Behind the Scenes', t: 2, q: 'The 1954 Japanese monster film Gojira created its creature by what means?', a: 'A performer inside a rubber suit', d: ['Stop-motion models', 'Hand-drawn animation', 'A marionette on wires'] },

{ c: 'Movies', t: 3, q: 'What is the memory-erasing device used by the agents in Men in Black called?', a: 'A neuralyzer', d: ['A mind wiper', 'A flashbang', 'A cortex pen'] },
{ c: 'Television', t: 3, q: 'Which 1992 MTV series put seven strangers in a shared house and is often called the start of modern reality television?', a: 'The Real World', d: ['Road Rules', 'Laguna Beach', 'The Osbournes'] },
{ c: 'Actors & Directors', t: 3, q: 'Which director made Halloween in 1978, Escape from New York in 1981 and The Thing in 1982?', a: 'John Carpenter', d: ['Wes Craven', 'Tobe Hooper', 'George A. Romero'] },
{ c: 'Awards & Box Office', t: 3, q: 'Which 2018 Marvel film became the first superhero movie nominated for Best Picture?', a: 'Black Panther', d: ['Avengers: Infinity War', 'Wonder Woman', 'Deadpool'] },
{ c: 'Behind the Scenes', t: 3, q: 'Which 1979 film kept its cast in the dark about the details of one dinner table scene so their shock would be genuine?', a: 'Alien', d: ['The Thing', 'Poltergeist', 'The Fly'] },

{ c: 'Movies', t: 4, q: 'Which occupying force does the resistance fight in Rossellini\'s Rome, Open City?', a: 'The Germans', d: ['The Austrians', 'The Americans', 'The Spanish'] },
{ c: 'Television', t: 4, q: 'Which Canadian sitcom is set around a gas station in the fictional Saskatchewan town of Dog River?', a: 'Corner Gas', d: ['Letterkenny', 'Trailer Park Boys', 'Little Mosque on the Prairie'] },
{ c: 'Actors & Directors', t: 4, q: 'Which South Korean actor played the imprisoned lead in Park Chan-wook\'s Oldboy?', a: 'Choi Min-sik', d: ['Song Kang-ho', 'Lee Byung-hun', 'Ha Jung-woo'] },
{ c: 'Awards & Box Office', t: 4, q: 'Which Japanese film won the Academy Award for Best International Feature for 2021?', a: 'Drive My Car', d: ['The Worst Person in the World', 'Flee', 'The Hand of God'] },
{ c: 'Behind the Scenes', t: 4, q: 'Which 1960s British series invented an in-story device for changing lead actors when its first star left?', a: 'Doctor Who', d: ['The Avengers', 'Quatermass', 'The Prisoner'] },

{ c: 'Movies', t: 5, q: 'How do the two women survive in Kaneto Shindo\'s Onibaba?', a: 'By stripping armor from fallen soldiers and trading it', d: ['By selling reeds cut from the marsh', 'By running a roadside teahouse', 'By fishing the river at night'] },
{ c: 'Television', t: 5, q: 'Which 1973 PBS documentary series filmed seven months in the life of the Loud family of Santa Barbara?', a: 'An American Family', d: ['The Family', 'Middletown', 'Seven Up!'] },
{ c: 'Actors & Directors', t: 5, q: 'Which cinematographer shot Blade Runner for Ridley Scott?', a: 'Jordan Cronenweth', d: ['Douglas Slocombe', 'Dean Cundey', 'Adrian Biddle'] },
{ c: 'Awards & Box Office', t: 5, q: 'Which film won the Sundance Grand Jury Prize for drama in 2008?', a: 'Frozen River', d: ['Ballast', 'Sugar', 'Sleep Dealer'] },
{ c: 'Behind the Scenes', t: 5, q: 'Which 1982 film took its title from an unrelated novel whose name the producers bought purely for the words?', a: 'Blade Runner', d: ['Soylent Green', 'Logan\'s Run', 'Outland'] },
],

// ── Day 46 ──────────────────────────────────────────────────────────────
[
{ c: 'Movies', t: 1, q: 'Which meerkat and warthog pair take in the exiled lion cub in The Lion King?', a: 'Timon and Pumbaa', d: ['Zazu and Rafiki', 'Banzai and Shenzi', 'Mufasa and Sarabi'] },
{ c: 'Television', t: 1, q: 'Which preschool series starred a large purple dinosaur who sang about loving one another?', a: 'Barney & Friends', d: ['The Wiggles', 'Bear in the Big Blue House', 'The Big Comfy Couch'] },
{ c: 'Actors & Directors', t: 1, q: 'Which actor starred in Men in Black, The Pursuit of Happyness and I Am Legend?', a: 'Will Smith', d: ['Jamie Foxx', 'Cuba Gooding Jr.', 'Martin Lawrence'] },
{ c: 'Awards & Box Office', t: 1, q: 'Which 2003 fantasy finale was the top-grossing film worldwide that year?', a: 'The Lord of the Rings: The Return of the King', d: ['The Matrix Reloaded', 'Finding Nemo', 'Pirates of the Caribbean: The Curse of the Black Pearl'] },
{ c: 'Behind the Scenes', t: 1, q: 'The music that signals the approaching shark in the 1975 film is built from how many alternating notes?', a: 'Two', d: ['Three', 'Five', 'Seven'] },

{ c: 'Movies', t: 2, q: 'How does Jack come by his ticket for the voyage in Titanic?', a: 'He wins it in a card game', d: ['He stows away in a lifeboat', 'He is hired as a deckhand', 'A stranger gives it to him at the dock'] },
{ c: 'Television', t: 2, q: 'Which animated series is set in the year 3000 and follows a pizza delivery boy who was accidentally frozen for a thousand years?', a: 'Futurama', d: ['Duckman', 'Sealab 2021', 'Solar Opposites'] },
{ c: 'Actors & Directors', t: 2, q: 'Which Australian actress starred in Moulin Rouge!, The Hours and Big Little Lies?', a: 'Nicole Kidman', d: ['Naomi Watts', 'Cate Blanchett', 'Toni Collette'] },
{ c: 'Awards & Box Office', t: 2, q: 'Which 1994 crime film won the Academy Award for Best Original Screenplay?', a: 'Pulp Fiction', d: ['Forrest Gump', 'The Shawshank Redemption', 'Four Weddings and a Funeral'] },
{ c: 'Behind the Scenes', t: 2, q: 'For which 1977 Spielberg film did John Williams write a five-note phrase used as a greeting between species?', a: 'Close Encounters of the Third Kind', d: ['The Abyss', 'Contact', 'Cocoon'] },

{ c: 'Movies', t: 3, q: 'What make of car, fitted with an ejector seat, does Bond drive in Goldfinger?', a: 'An Aston Martin DB5', d: ['A Jaguar E-Type', 'A Bentley Continental', 'A Lotus Esprit'] },
{ c: 'Television', t: 3, q: 'Which comedy drama follows a brilliant but rude London surgeon turned family doctor in the Cornish village of Portwenn?', a: 'Doc Martin', d: ['Hinterland', 'Ballykissangel', 'Monarch of the Glen'] },
{ c: 'Actors & Directors', t: 3, q: 'Which Taiwanese born director made Crouching Tiger, Hidden Dragon and Brokeback Mountain?', a: 'Ang Lee', d: ['Zhang Yimou', 'John Woo', 'Wong Kar-wai'] },
{ c: 'Awards & Box Office', t: 3, q: 'Which actor won Best Supporting Actor for Inglourious Basterds?', a: 'Christoph Waltz', d: ['Stanley Tucci', 'Woody Harrelson', 'Matt Damon'] },
{ c: 'Behind the Scenes', t: 3, q: 'Which Greek composer wrote the synthesizer score for the 1981 film Chariots of Fire?', a: 'Vangelis', d: ['Giorgio Moroder', 'Jean-Michel Jarre', 'Mike Oldfield'] },

{ c: 'Movies', t: 4, q: 'In which small California coastal town are the attacks set in Hitchcock\'s The Birds?', a: 'Bodega Bay', d: ['Monterey', 'Santa Cruz', 'Half Moon Bay'] },
{ c: 'Television', t: 4, q: 'Which 1970s British sitcom was set on the floors of a shabby department store called Grace Brothers?', a: 'Are You Being Served?', d: ['Hi-de-Hi!', 'The Rag Trade', 'Rising Damp'] },
{ c: 'Actors & Directors', t: 4, q: 'Which Spanish born cinematographer shot Days of Heaven and many of Eric Rohmer\'s films?', a: 'Nestor Almendros', d: ['Sven Nykvist', 'Raoul Coutard', 'Ricardo Aronovich'] },
{ c: 'Awards & Box Office', t: 4, q: 'Which German film won the Academy Award for Best International Feature for 2022?', a: 'All Quiet on the Western Front', d: ['Argentina, 1985', 'Close', 'EO'] },
{ c: 'Behind the Scenes', t: 4, q: 'Which instrument, played by Anton Karas, provides almost the entire score of The Third Man?', a: 'The zither', d: ['The mandolin', 'The balalaika', 'The harpsichord'] },

{ c: 'Movies', t: 5, q: 'In Jean Cocteau\'s Orpheus, what does the poet pass through to reach the underworld?', a: 'A mirror', d: ['A well', 'A locked wardrobe', 'A wall of flame'] },
{ c: 'Television', t: 5, q: 'In Ghost in the Shell: Stand Alone Complex, what is the name of the counter-terrorism unit the main characters belong to?', a: 'Public Security Section 9', d: ['Section 6', 'Section 4', 'the Niihama Task Force'] },
{ c: 'Actors & Directors', t: 5, q: 'Which Egyptian director made Cairo Station and the Alexandria films?', a: 'Youssef Chahine', d: ['Salah Abu Seif', 'Shadi Abdel Salam', 'Tewfik Saleh'] },
{ c: 'Awards & Box Office', t: 5, q: 'Which film won the Sundance Grand Jury Prize for drama in 1996?', a: 'Welcome to the Dollhouse', d: ['Big Night', 'Girls Town', 'The Spitfire Grill'] },
{ c: 'Behind the Scenes', t: 5, q: 'Which composer wrote the score for Once Upon a Time in the West before filming so it could be played back on set?', a: 'Ennio Morricone', d: ['Nino Rota', 'Riz Ortolani', 'Carlo Rustichelli'] },
],

// ── Day 47 ──────────────────────────────────────────────────────────────
[
{ c: 'Movies', t: 1, q: 'What is the name of Han Solo\'s freighter in the Star Wars films?', a: 'The Millennium Falcon', d: ['The Ghost', 'The Tantive IV', 'The Slave I'] },
{ c: 'Television', t: 1, q: 'Which animated series follows a lasagna-loving orange cat, his owner Jon and a dim-witted dog named Odie?', a: 'Garfield and Friends', d: ['Heathcliff', 'Top Cat', 'The Catillac Cats'] },
{ c: 'Actors & Directors', t: 1, q: 'Which actor starred in Beverly Hills Cop and Coming to America, and voiced the donkey in Shrek?', a: 'Eddie Murphy', d: ['Chris Rock', 'Martin Lawrence', 'Chris Tucker'] },
{ c: 'Awards & Box Office', t: 1, q: 'Which 1975 shark thriller was the top-grossing film worldwide that year?', a: 'Jaws', d: ['One Flew Over the Cuckoo\'s Nest', 'Dog Day Afternoon', 'Three Days of the Condor'] },
{ c: 'Behind the Scenes', t: 1, q: 'Which 2019 war film was shot and assembled to look like one unbroken take?', a: '1917', d: ['Dunkirk', 'Hacksaw Ridge', 'Jarhead'] },

{ c: 'Movies', t: 2, q: 'What is the name of the enchanted candelabra in Disney\'s Beauty and the Beast?', a: 'Lumiere', d: ['Cogsworth', 'Chip', 'Mrs. Potts'] },
{ c: 'Television', t: 2, q: 'Which police series set in the Pacific islands ended arrests with the line "Book \'em, Danno"?', a: 'Hawaii Five-O', d: ['Magnum, P.I.', 'The Rockford Files', 'Kojak'] },
{ c: 'Actors & Directors', t: 2, q: 'Which Australian actress played Elizabeth I in 1998 and Galadriel in The Lord of the Rings?', a: 'Cate Blanchett', d: ['Nicole Kidman', 'Tilda Swinton', 'Naomi Watts'] },
{ c: 'Awards & Box Office', t: 2, q: 'Which 1985 time-travel comedy was the top-grossing release in North America that year?', a: 'Back to the Future', d: ['Rambo: First Blood Part II', 'Rocky IV', 'The Goonies'] },
{ c: 'Behind the Scenes', t: 2, q: 'Which 2014 film about a fading star mounting a Broadway play was cut to appear as a single continuous shot?', a: 'Birdman', d: ['Whiplash', 'Nightcrawler', 'Foxcatcher'] },

{ c: 'Movies', t: 3, q: 'What flat-topped landform does Roy Neary obsessively model in Close Encounters of the Third Kind?', a: 'Devils Tower', d: ['Ayers Rock', 'Shiprock', 'Mount Shasta'] },
{ c: 'Television', t: 3, q: 'Which Buffy the Vampire Slayer spin-off followed a cursed vampire who worked as a private investigator against the law firm Wolfram & Hart?', a: 'Angel', d: ['Forever Knight', 'Moonlight', 'Blade: The Series'] },
{ c: 'Actors & Directors', t: 3, q: 'Which Chinese director made Raise the Red Lantern, To Live and Hero?', a: 'Zhang Yimou', d: ['Chen Kaige', 'Tian Zhuangzhuang', 'Jia Zhangke'] },
{ c: 'Awards & Box Office', t: 3, q: 'Which director won the Academy Award for Best Director for The Departed?', a: 'Martin Scorsese', d: ['Clint Eastwood', 'Paul Greengrass', 'Stephen Frears'] },
{ c: 'Behind the Scenes', t: 3, q: 'The tornado in the 1939 film The Wizard of Oz was created on the studio floor using what?', a: 'A long muslin stocking spun on a rig', d: ['A jet of compressed steam', 'A painted glass matte', 'A film of a real storm projected behind the actors'] },

{ c: 'Movies', t: 4, q: 'What does Damiel give up in Wings of Desire?', a: 'His immortality, to become human', d: ['His memory of the war', 'His ability to hear thoughts', 'His name'] },
{ c: 'Television', t: 4, q: 'Which 1987 Doordarshan serial dramatized a Sanskrit epic across 78 episodes and emptied Indian streets on Sunday mornings?', a: 'Ramayan', d: ['Mahabharat', 'Chanakya', 'Buniyaad'] },
{ c: 'Actors & Directors', t: 4, q: 'Which writer on the staff of The Sopranos went on to run Mad Men?', a: 'Matthew Weiner', d: ['Terence Winter', 'Michael Patrick King', 'Robin Green'] },
{ c: 'Awards & Box Office', t: 4, q: 'Which film won the BAFTA for Best Film at the 2015 ceremony?', a: 'Boyhood', d: ['The Grand Budapest Hotel', 'The Theory of Everything', 'Birdman'] },
{ c: 'Behind the Scenes', t: 4, q: 'Which technique let a full-height actor appear hobbit-sized alongside another in one moving Lord of the Rings shot?', a: 'Forced perspective on a shifting rig', d: ['Rear projection', 'Optical reduction printing', 'Digital shrinking in post'] },

{ c: 'Movies', t: 5, q: 'What machine transforms village life in Alexander Dovzhenko\'s Earth?', a: 'A tractor', d: ['A steam locomotive', 'An electric mill', 'A telephone exchange'] },
{ c: 'Television', t: 5, q: 'Which 1962 BBC satirical revue went out live on Saturday nights and is credited with starting the British satire boom on television?', a: 'That Was the Week That Was', d: ['Not Only... But Also', 'The Frost Report', 'At Last the 1948 Show'] },
{ c: 'Actors & Directors', t: 5, q: 'Which Hungarian born cinematographer shot Close Encounters of the Third Kind and The Deer Hunter?', a: 'Vilmos Zsigmond', d: ['Laszlo Kovacs', 'Owen Roizman', 'Bill Butler'] },
{ c: 'Awards & Box Office', t: 5, q: 'Which film won the Golden Bear at Berlin in 2004?', a: 'Head-On', d: ['The Edukators', 'Maria Full of Grace', 'Before Sunset'] },
{ c: 'Behind the Scenes', t: 5, q: 'Which 1958 film was re-edited in 1998 to follow a long memo its director wrote after the studio recut it?', a: 'Touch of Evil', d: ['Vertigo', 'The Big Heat', 'Kiss Me Deadly'] },
],

// ── Day 48 ──────────────────────────────────────────────────────────────
[
{ c: 'Movies', t: 1, q: 'What flows in the river running through the great edible room in the 1971 Willy Wonka musical?', a: 'Chocolate', d: ['Lemonade', 'Melted caramel', 'Strawberry syrup'] },
{ c: 'Television', t: 1, q: 'Which animated preschool series follows a team of rescue dogs led by a boy named Ryder?', a: 'Paw Patrol', d: ['Blaze and the Monster Machines', 'Bubble Guppies', 'Octonauts'] },
{ c: 'Actors & Directors', t: 1, q: 'Which martial artist starred in Fist of Fury and Enter the Dragon?', a: 'Bruce Lee', d: ['Jackie Chan', 'Jet Li', 'Chuck Norris'] },
{ c: 'Awards & Box Office', t: 1, q: 'Which 1986 film about Navy fighter pilots was the top-grossing release in North America that year?', a: 'Top Gun', d: ['Platoon', 'Crocodile Dundee', 'Aliens'] },
{ c: 'Behind the Scenes', t: 1, q: 'On a television production, what is the green room?', a: 'The waiting room where performers sit before they go on', d: ['The booth where the sound is mixed', 'The store room for spare costumes', 'The office where scripts are approved'] },

{ c: 'Movies', t: 2, q: 'What speed must the time machine reach in Back to the Future?', a: '88 miles per hour', d: ['60 miles per hour', '100 miles per hour', '120 miles per hour'] },
{ c: 'Television', t: 2, q: 'Which sitcom followed a widowed San Francisco father raising three daughters with the help of his brother-in-law and his best friend?', a: 'Full House', d: ['Growing Pains', 'Family Matters', 'Step by Step'] },
{ c: 'Actors & Directors', t: 2, q: 'Which actor played Peter Parker in the Sam Raimi Spider-Man trilogy?', a: 'Tobey Maguire', d: ['Andrew Garfield', 'Tom Holland', 'Jake Gyllenhaal'] },
{ c: 'Awards & Box Office', t: 2, q: 'Which actress won Best Actress for playing Margaret Thatcher in a 2011 film?', a: 'Meryl Streep', d: ['Glenn Close', 'Viola Davis', 'Michelle Williams'] },
{ c: 'Behind the Scenes', t: 2, q: 'Which 1960s science fiction series had its first pilot rejected, after which the network took the rare step of ordering a second?', a: 'Star Trek', d: ['Lost in Space', 'The Twilight Zone', 'The Outer Limits'] },

{ c: 'Movies', t: 3, q: 'Which city\'s steep streets stage the celebrated car chase in Bullitt?', a: 'San Francisco', d: ['Los Angeles', 'Seattle', 'Pittsburgh'] },
{ c: 'Television', t: 3, q: 'Which series is set in a western theme park staffed by lifelike androids who repeat the same stories every day?', a: 'Westworld', d: ['Humans', 'Raised by Wolves', 'Counterpart'] },
{ c: 'Actors & Directors', t: 3, q: 'Which Monty Python animator went on to direct Time Bandits and Brazil?', a: 'Terry Gilliam', d: ['Terry Jones', 'Eric Idle', 'Julien Temple'] },
{ c: 'Awards & Box Office', t: 3, q: 'Which actor won Best Actor for There Will Be Blood?', a: 'Daniel Day-Lewis', d: ['George Clooney', 'Johnny Depp', 'Tommy Lee Jones'] },
{ c: 'Behind the Scenes', t: 3, q: 'Which 1970s military comedy left the laugh track off its operating room scenes?', a: 'M*A*S*H', d: ['Hogan\'s Heroes', 'McHale\'s Navy', 'Gomer Pyle: USMC'] },

{ c: 'Movies', t: 4, q: 'What error sets the plot of Kurosawa\'s High and Low in motion?', a: 'Kidnappers seize the chauffeur\'s son instead of the executive\'s', d: ['A ransom note is delivered to the wrong house', 'A police wiretap records the wrong line', 'A factory shipment is sent to a rival'] },
{ c: 'Television', t: 4, q: 'Which British sitcom was set in a Yorkshire corner shop run by a stammering, penny-pinching grocer and his put-upon nephew?', a: 'Open All Hours', d: ['Hi-de-Hi!', 'Terry and June', 'Bread'] },
{ c: 'Actors & Directors', t: 4, q: 'Which actress starred in Persona, Cries and Whispers and Autumn Sonata?', a: 'Liv Ullmann', d: ['Bibi Andersson', 'Harriet Andersson', 'Ingrid Thulin'] },
{ c: 'Awards & Box Office', t: 4, q: 'Which British film won the Academy Award for Best International Feature for 2023?', a: 'The Zone of Interest', d: ['Perfect Days', 'Society of the Snow', 'Io Capitano'] },
{ c: 'Behind the Scenes', t: 4, q: 'Which detective series was built around showing the crime first, a structure nicknamed the howcatchem?', a: 'Columbo', d: ['Ironside', 'McCloud', 'Kojak'] },

{ c: 'Movies', t: 5, q: 'Where is Miklos Jancso\'s The Round-Up set?', a: 'A prison fort on the Hungarian plain', d: ['A monastery in the Carpathians', 'A Budapest police station', 'A cavalry barracks in Vienna'] },
{ c: 'Television', t: 5, q: 'Which 1979 Mexican telenovela about a poor woman who marries into wealth became an astonishing hit when Russian viewers saw it in 1992?', a: 'Los Ricos Tambien Lloran', d: ['Simplemente Maria', 'Rosa Salvaje', 'Cristal'] },
{ c: 'Actors & Directors', t: 5, q: 'Which cinematographer shot Jean Cocteau\'s Beauty and the Beast and, four decades later, Wings of Desire?', a: 'Henri Alekan', d: ['Raoul Coutard', 'Sacha Vierny', 'Robert Krasker'] },
{ c: 'Awards & Box Office', t: 5, q: 'Which film won the Sundance Grand Jury Prize for drama in 1995?', a: 'The Brothers McMullen', d: ['Living in Oblivion', 'Angela', 'Picture Bride'] },
{ c: 'Behind the Scenes', t: 5, q: 'Which HBO series reshot its pilot and recast two major roles before it reached air in 2011?', a: 'Game of Thrones', d: ['Boardwalk Empire', 'True Blood', 'Rome'] },
],

// ── Day 49 ──────────────────────────────────────────────────────────────
[
{ c: 'Movies', t: 1, q: 'In Disney\'s Sleeping Beauty, what sends the princess into her long sleep?', a: 'Pricking her finger on a spinning wheel', d: ['Drinking a sleeping potion', 'A witch\'s song', 'Eating a poisoned pear'] },
{ c: 'Television', t: 1, q: 'In the Looney Tunes cartoons, which desert bird endlessly outruns Wile E. Coyote?', a: 'the Road Runner', d: ['Foghorn Leghorn', 'Tweety', 'Woody Woodpecker'] },
{ c: 'Actors & Directors', t: 1, q: 'Which Welsh actor played Hannibal Lecter in the 1991 adaptation of The Silence of the Lambs?', a: 'Anthony Hopkins', d: ['Jeremy Irons', 'Ian McKellen', 'Ian Holm'] },
{ c: 'Awards & Box Office', t: 1, q: 'Which 1991 science fiction sequel was the top-grossing film worldwide that year?', a: 'Terminator 2: Judgment Day', d: ['Robin Hood: Prince of Thieves', 'Beauty and the Beast', 'The Silence of the Lambs'] },
{ c: 'Behind the Scenes', t: 1, q: 'In the 1977 Star Wars, the performer inside the black armor had his lines replaced by whose voice?', a: 'James Earl Jones', d: ['Orson Welles', 'Peter Cushing', 'Christopher Lee'] },

{ c: 'Movies', t: 2, q: 'Which American conflict forms the backdrop of Gone with the Wind?', a: 'The Civil War', d: ['The War of 1812', 'The Spanish-American War', 'The Mexican-American War'] },
{ c: 'Television', t: 2, q: 'Which animated educational series sent a teacher and her class on field trips inside a shrinking, shape-shifting vehicle?', a: 'The Magic School Bus', d: ['Bill Nye the Science Guy', 'Cyberchase', 'Sid the Science Kid'] },
{ c: 'Actors & Directors', t: 2, q: 'Which actor starred in Alfie and the 1969 The Italian Job, and later played Alfred the butler for Christopher Nolan?', a: 'Michael Caine', d: ['Roger Moore', 'Terence Stamp', 'Bob Hoskins'] },
{ c: 'Awards & Box Office', t: 2, q: 'Which Pixar film about a family of superheroes won Best Animated Feature for 2004?', a: 'The Incredibles', d: ['Shrek 2', 'Shark Tale', 'The Polar Express'] },
{ c: 'Behind the Scenes', t: 2, q: 'Which 1978 comic book adaptation cast a little-known stage actor in the lead after a long and public search?', a: 'Superman', d: ['Flash Gordon', 'Batman', 'Dick Tracy'] },

{ c: 'Movies', t: 3, q: 'Whose early years in New York are told in the flashbacks of The Godfather Part II?', a: 'The young Vito Corleone', d: ['The young Hyman Roth', 'The young Tom Hagen', 'The young Fredo'] },
{ c: 'Television', t: 3, q: 'Which crime drama begins with a boy found dead on the beach of a small Dorset seaside town?', a: 'Broadchurch', d: ['The Missing', 'Marcella', 'Unforgotten'] },
{ c: 'Actors & Directors', t: 3, q: 'Which Swedish actor moved from a long run of Ingmar Bergman films to Hollywood work in The Exorcist and Flash Gordon?', a: 'Max von Sydow', d: ['Erland Josephson', 'Gunnar Bjornstrand', 'Jarl Kulle'] },
{ c: 'Awards & Box Office', t: 3, q: 'Which studio released Jaws in 1975?', a: 'Universal', d: ['Paramount', 'Columbia', 'Warner Bros.'] },
{ c: 'Behind the Scenes', t: 3, q: 'Which 1979 screenplay stated that its crew roles were interchangeable between men and women, opening the lead to an actress?', a: 'Alien', d: ['Blade Runner', 'The Terminator', 'Star Trek: The Motion Picture'] },

{ c: 'Movies', t: 4, q: 'What companion does the pensioner refuse to give up in De Sica\'s Umberto D?', a: 'His dog', d: ['His canary', 'His pocket watch', 'His cat'] },
{ c: 'Television', t: 4, q: 'In the sitcom about two technicians and their clueless manager at Reynholm Industries, where is their department located?', a: 'The basement', d: ['The top floor', 'A converted car park', 'The mail room'] },
{ c: 'Actors & Directors', t: 4, q: 'Which editor cut Raging Bull, Goodfellas and The Departed?', a: 'Thelma Schoonmaker', d: ['Sally Menke', 'Dede Allen', 'Anne V. Coates'] },
{ c: 'Awards & Box Office', t: 4, q: 'Which series won the Emmy for Outstanding Comedy Series in 2019?', a: 'Fleabag', d: ['Veep', 'Barry', 'The Marvelous Mrs. Maisel'] },
{ c: 'Behind the Scenes', t: 4, q: 'Which actor was replaced by Martin Sheen a few weeks into the Philippines shoot of Apocalypse Now?', a: 'Harvey Keitel', d: ['Nick Nolte', 'James Caan', 'Steve McQueen'] },

{ c: 'Movies', t: 5, q: 'What upheaval has driven the family in Ritwik Ghatak\'s The Cloud-Capped Star into a refugee colony?', a: 'The partition of Bengal', d: ['The Bengal famine', 'A cyclone in the delta', 'The closing of the jute mills'] },
{ c: 'Television', t: 5, q: 'Which 1975 BBC series followed the scattered remnants of Britain after a laboratory plague killed most of the population?', a: 'Survivors', d: ['Doomwatch', 'The Changes', 'Noah\'s Castle'] },
{ c: 'Actors & Directors', t: 5, q: 'Which Brazilian director of the Cinema Novo movement made Black God, White Devil?', a: 'Glauber Rocha', d: ['Nelson Pereira dos Santos', 'Ruy Guerra', 'Carlos Diegues'] },
{ c: 'Awards & Box Office', t: 5, q: 'Which film took the Golden Lion at Venice in 2012?', a: 'Pieta', d: ['The Master', 'Spring Breakers', 'Paradise: Faith'] },
{ c: 'Behind the Scenes', t: 5, q: 'Kevin Costner was cast as the friend whose funeral opens which 1983 ensemble drama, only for his scenes to be cut?', a: 'The Big Chill', d: ['Terms of Endearment', 'The Right Stuff', 'Return of the Secaucus 7'] },
],

// ── Day 50 ──────────────────────────────────────────────────────────────
[
{ c: 'Movies', t: 1, q: 'What is the name of the princess the ogre is sent to rescue in Shrek?', a: 'Fiona', d: ['Arwen', 'Giselle', 'Odette'] },
{ c: 'Television', t: 1, q: 'Which long-running crime series opens with two ominous notes and narration about the two separate yet equally important groups in the criminal justice system?', a: 'Law & Order', d: ['NYPD Blue', 'Homicide: Life on the Street', 'Cold Case'] },
{ c: 'Actors & Directors', t: 1, q: 'Which actress starred in Easy A, La La Land and Poor Things?', a: 'Emma Stone', d: ['Emma Watson', 'Anna Kendrick', 'Amanda Seyfried'] },
{ c: 'Awards & Box Office', t: 1, q: 'Which 1980 Star Wars sequel was the top-grossing release in North America that year?', a: 'The Empire Strikes Back', d: ['Stir Crazy', 'Airplane!', 'The Blues Brothers'] },
{ c: 'Behind the Scenes', t: 1, q: 'The giant ape of the 1933 RKO adventure was brought to life by what method?', a: 'Stop-motion models', d: ['A performer in a costume', 'A full-size mechanical puppet', 'Hand-drawn animation'] },

{ c: 'Movies', t: 2, q: 'What extraordinary ability does Raymond display in Rain Man?', a: 'Instant mental calculation and recall', d: ['Perfect pitch', 'Photographic drawing', 'Reading languages he has never studied'] },
{ c: 'Television', t: 2, q: 'Which Nickelodeon animated series followed the adventures of babies Tommy, Chuckie and the twins?', a: 'Rugrats', d: ['Doug', 'Hey Arnold!', 'CatDog'] },
{ c: 'Actors & Directors', t: 2, q: 'Which Canadian actor starred in The Notebook, Drive and Blade Runner 2049?', a: 'Ryan Gosling', d: ['Ryan Reynolds', 'Jake Gyllenhaal', 'Bradley Cooper'] },
{ c: 'Awards & Box Office', t: 2, q: 'Which 2021 superhero film was the top-grossing release worldwide that year?', a: 'Spider-Man: No Way Home', d: ['No Time to Die', 'F9', 'Dune'] },
{ c: 'Behind the Scenes', t: 2, q: 'Which 2000 Roman epic completed a supporting actor\'s remaining scenes with a digital double after he died during production?', a: 'Gladiator', d: ['Troy', 'Kingdom of Heaven', 'Alexander'] },

{ c: 'Movies', t: 3, q: 'In which city do the state police and the Irish mob plant moles on each other in The Departed?', a: 'Boston', d: ['New York', 'Chicago', 'Philadelphia'] },
{ c: 'Television', t: 3, q: 'Which sitcom was set in the New York garage of the Sunshine Cab Company?', a: 'Taxi', d: ['Barney Miller', 'Alice', 'Rhoda'] },
{ c: 'Actors & Directors', t: 3, q: 'Which director made Platoon, Wall Street and JFK?', a: 'Oliver Stone', d: ['Michael Mann', 'Sidney Lumet', 'Alan J. Pakula'] },
{ c: 'Awards & Box Office', t: 3, q: 'Which Academy Award category honors the people who build and dress the interiors a film is shot in?', a: 'Best Production Design', d: ['Best Costume Design', 'Best Makeup and Hairstyling', 'Best Visual Effects'] },
{ c: 'Behind the Scenes', t: 3, q: 'Whose Dynamation process combined stop-motion creatures with live action in Jason and the Argonauts?', a: 'Ray Harryhausen', d: ['Willis O\'Brien', 'George Pal', 'Jim Danforth'] },

{ c: 'Movies', t: 4, q: 'What kind of film is the blocked director trying to make in Fellini\'s 8 1/2?', a: 'A science fiction film with a rocket launch tower', d: ['A biblical epic', 'A circus documentary', 'A war picture set in Ethiopia'] },
{ c: 'Television', t: 4, q: 'In Quantum Leap, what two words does the traveler almost always say as he lands in a new body at the end of an episode?', a: '"Oh, boy"', d: ['"Here we go"', '"Not again"', '"Help me"'] },
{ c: 'Actors & Directors', t: 4, q: 'Which French director made Water Lilies, Girlhood and Portrait of a Lady on Fire?', a: 'Celine Sciamma', d: ['Julia Ducournau', 'Mia Hansen-Love', 'Claire Denis'] },
{ c: 'Awards & Box Office', t: 4, q: 'Which film won the Academy Award for Best Foreign Language Film for 2000?', a: 'Crouching Tiger, Hidden Dragon', d: ['Amores Perros', 'Divided We Fall', 'The Taste of Others'] },
{ c: 'Behind the Scenes', t: 4, q: 'Which 1989 James Cameron film featured a computer-generated column of seawater that mimicked the actors\' faces?', a: 'The Abyss', d: ['Leviathan', 'DeepStar Six', 'Aliens'] },

{ c: 'Movies', t: 5, q: 'Whom does the accused man impersonate in Abbas Kiarostami\'s Close-Up?', a: 'A film director', d: ['A police inspector', 'A wealthy industrialist', 'A university professor'] },
{ c: 'Television', t: 5, q: 'Which 1992 BBC Halloween drama drew thousands of complaints by staging a fake haunting in the format of a live outside broadcast?', a: 'Ghostwatch', d: ['Most Haunted', 'The Stone Tape', 'Beyond Belief'] },
{ c: 'Actors & Directors', t: 5, q: 'Which composer wrote the music for Blue Velvet and the Twin Peaks theme?', a: 'Angelo Badalamenti', d: ['Trent Reznor', 'Clint Mansell', 'Graeme Revell'] },
{ c: 'Awards & Box Office', t: 5, q: 'Which film won the Sundance Grand Jury Prize for drama in 2004?', a: 'Primer', d: ['Down to the Bone', 'Garden State', 'Napoleon Dynamite'] },
{ c: 'Behind the Scenes', t: 5, q: 'Which 1985 film contained the first fully computer-generated character in a live-action feature, a knight from a stained glass window?', a: 'Young Sherlock Holmes', d: ['Tron', 'The Last Starfighter', 'Labyrinth'] },
],

// ── Day 51 ──────────────────────────────────────────────────────────────
[
{ c: 'Movies', t: 1, q: 'What is the name of the space ranger action figure who joins Andy\'s toys?', a: 'Buzz Lightyear', d: ['Rex', 'Hamm', 'Slinky Dog'] },
{ c: 'Television', t: 1, q: 'Which 1960s sitcom stranded seven passengers and crew on an uncharted island after a three-hour boat tour?', a: 'Gilligan\'s Island', d: ['The Love Boat', 'Fantasy Island', 'McHale\'s Navy'] },
{ c: 'Actors & Directors', t: 1, q: 'Which actor starred in Bill and Ted\'s Excellent Adventure and Point Break, and, a quarter century later, in the John Wick films?', a: 'Keanu Reeves', d: ['Patrick Swayze', 'Wesley Snipes', 'Charlie Sheen'] },
{ c: 'Awards & Box Office', t: 1, q: 'Which 2012 superhero team-up was the top-grossing film worldwide that year?', a: 'The Avengers', d: ['The Dark Knight Rises', 'Skyfall', 'The Hunger Games'] },
{ c: 'Behind the Scenes', t: 1, q: 'Which drama about a high school chemistry teacher was shot on location in Albuquerque, New Mexico?', a: 'Breaking Bad', d: ['Ozark', 'Justified', 'Fargo'] },

{ c: 'Movies', t: 2, q: 'What animal does the boy set free at the end of Free Willy?', a: 'A killer whale', d: ['A dolphin', 'A sea lion', 'A manatee'] },
{ c: 'Television', t: 2, q: 'Which reality series puts single contestants in a Mallorca villa where they must couple up to stay in the competition?', a: 'Love Island', d: ['Too Hot to Handle', 'Temptation Island', 'Bachelor in Paradise'] },
{ c: 'Actors & Directors', t: 2, q: 'Which actor starred in Ocean\'s Eleven and Gravity, and directed Good Night, and Good Luck?', a: 'George Clooney', d: ['Brad Pitt', 'Matt Damon', 'Ben Affleck'] },
{ c: 'Awards & Box Office', t: 2, q: 'Which actor won Best Supporting Actor for The Fighter?', a: 'Christian Bale', d: ['Geoffrey Rush', 'Mark Ruffalo', 'Jeremy Renner'] },
{ c: 'Behind the Scenes', t: 2, q: 'Which 1991 sequel used computer graphics to create a shape-shifting liquid metal villain?', a: 'Terminator 2: Judgment Day', d: ['RoboCop 2', 'Predator 2', 'Total Recall'] },

{ c: 'Movies', t: 3, q: 'Which ancient epic loosely shapes the journey in O Brother, Where Art Thou?', a: 'The Odyssey', d: ['The Iliad', 'The Aeneid', 'Gilgamesh'] },
{ c: 'Television', t: 3, q: 'Which NBC late-night talk show began in 1954 and opens with a host monologue after the local news?', a: 'The Tonight Show', d: ['The Late Show', 'Late Night', 'The Dick Cavett Show'] },
{ c: 'Actors & Directors', t: 3, q: 'Which English actor played the detective in the BBC series Sherlock?', a: 'Benedict Cumberbatch', d: ['Martin Freeman', 'Tom Hiddleston', 'Rufus Sewell'] },
{ c: 'Awards & Box Office', t: 3, q: 'Which 1992 Disney animated musical was the top-grossing film worldwide that year?', a: 'Aladdin', d: ['Home Alone 2: Lost in New York', 'Basic Instinct', 'Batman Returns'] },
{ c: 'Behind the Scenes', t: 3, q: 'Which 1995 film built a huge floating set off Hawaii that was damaged by weather during a much-publicized shoot?', a: 'Waterworld', d: ['Cutthroat Island', 'The Abyss', 'Hook'] },

{ c: 'Movies', t: 4, q: 'What are the two women in Bergman\'s Persona?', a: 'An actress who has stopped speaking and her nurse', d: ['A painter and her sister', 'A widow and her housekeeper', 'A novelist and her translator'] },
{ c: 'Television', t: 4, q: 'Which British series threw a modern Manchester detective back to 1973 after he was hit by a car?', a: 'Life on Mars', d: ['Ashes to Ashes', 'Goodnight Sweetheart', 'The Fades'] },
{ c: 'Actors & Directors', t: 4, q: 'Which Iranian director made A Separation and The Salesman?', a: 'Asghar Farhadi', d: ['Abbas Kiarostami', 'Jafar Panahi', 'Majid Majidi'] },
{ c: 'Awards & Box Office', t: 4, q: 'Which series won the Emmy for Outstanding Drama Series in 2017?', a: 'The Handmaid\'s Tale', d: ['This Is Us', 'Stranger Things', 'Better Call Saul'] },
{ c: 'Behind the Scenes', t: 4, q: 'Which 1996 production fired its director days into filming and brought in John Frankenheimer to finish it?', a: 'The Island of Dr. Moreau', d: ['Congo', 'Sphere', 'The Ghost and the Darkness'] },

{ c: 'Movies', t: 5, q: 'Through which building does the camera travel in Sokurov\'s Russian Ark?', a: 'The Winter Palace', d: ['The Kremlin', 'The Peterhof', 'The Bolshoi Theater'] },
{ c: 'Television', t: 5, q: 'Which Australian soap opera set in a women\'s prison ran from 1979 and built a cult following in Britain?', a: 'Prisoner', d: ['Bad Girls', 'Within These Walls', 'The Box'] },
{ c: 'Actors & Directors', t: 5, q: 'Which longtime Wim Wenders cinematographer shot Paris, Texas and Dead Man?', a: 'Robby Muller', d: ['Ed Lachman', 'Chris Menges', 'Michael Ballhaus'] },
{ c: 'Awards & Box Office', t: 5, q: 'Which film won the Sundance Grand Jury Prize for drama in 2003?', a: 'American Splendor', d: ['Thirteen', 'The Station Agent', 'Raising Victor Vargas'] },
{ c: 'Behind the Scenes', t: 5, q: 'Which 1960 epic replaced Anthony Mann with Stanley Kubrick about a week into shooting?', a: 'Spartacus', d: ['El Cid', 'King of Kings', 'The Fall of the Roman Empire'] },
],

// ── Day 52 ──────────────────────────────────────────────────────────────
[
{ c: 'Movies', t: 1, q: 'Which fictional city does Batman protect?', a: 'Gotham City', d: ['Metropolis', 'Central City', 'Star City'] },
{ c: 'Television', t: 1, q: 'Which 1970s series followed a scientist who turned into a huge green creature whenever he lost his temper?', a: 'The Incredible Hulk', d: ['Wonder Woman', 'The Greatest American Hero', 'The Amazing Spider-Man'] },
{ c: 'Actors & Directors', t: 1, q: 'Which Hong Kong star of Drunken Master and Rush Hour is known for performing his own stunts?', a: 'Jackie Chan', d: ['Jet Li', 'Donnie Yen', 'Sammo Hung'] },
{ c: 'Awards & Box Office', t: 1, q: 'Which 2018 Marvel film was the top-grossing release worldwide that year?', a: 'Avengers: Infinity War', d: ['Black Panther', 'Jurassic World: Fallen Kingdom', 'Aquaman'] },
{ c: 'Behind the Scenes', t: 1, q: 'Which performer created and first voiced Kermit the Frog?', a: 'Jim Henson', d: ['Frank Oz', 'Caroll Spinney', 'Jerry Nelson'] },

{ c: 'Movies', t: 2, q: 'Which district attorney becomes the villain Two-Face in the Batman stories?', a: 'Harvey Dent', d: ['Carmine Falcone', 'Jim Gordon', 'Edward Nygma'] },
{ c: 'Television', t: 2, q: 'Which 1970s series rebuilt a badly injured test pilot and astronaut with bionic limbs and an artificial eye?', a: 'The Six Million Dollar Man', d: ['The Bionic Woman', 'Automan', 'Manimal'] },
{ c: 'Actors & Directors', t: 2, q: 'Which actor played Aragorn in the Lord of the Rings films?', a: 'Viggo Mortensen', d: ['Karl Urban', 'Sean Bean', 'Stuart Townsend'] },
{ c: 'Awards & Box Office', t: 2, q: 'Which actress won Best Actress for playing Judy Garland in a 2019 film?', a: 'Renee Zellweger', d: ['Charlize Theron', 'Scarlett Johansson', 'Saoirse Ronan'] },
{ c: 'Behind the Scenes', t: 2, q: 'Which 2008 superhero film shot its city exteriors on the streets of Chicago?', a: 'The Dark Knight', d: ['Batman Returns', 'Batman Forever', 'Watchmen'] },

{ c: 'Movies', t: 3, q: 'What profession do the feuding rivals share in The Prestige?', a: 'Stage magician', d: ['Portrait painter', 'Concert pianist', 'Circus acrobat'] },
{ c: 'Television', t: 3, q: 'Which series follows a former San Francisco detective whose obsessive compulsive disorder both hampers and helps his consulting work?', a: 'Monk', d: ['Psych', 'The Mentalist', 'Numb3rs'] },
{ c: 'Actors & Directors', t: 3, q: 'Which actor played the corporate raider Gordon Gekko in Wall Street?', a: 'Michael Douglas', d: ['Charlie Sheen', 'Richard Gere', 'Alec Baldwin'] },
{ c: 'Awards & Box Office', t: 3, q: 'Which 1978 musical set in an American high school was the top-grossing release in North America that year?', a: 'Grease', d: ['Superman', 'National Lampoon\'s Animal House', 'Heaven Can Wait'] },
{ c: 'Behind the Scenes', t: 3, q: 'Which English country house serves as the home of the Crawley family in the series about them?', a: 'Highclere Castle', d: ['Chatsworth House', 'Castle Howard', 'Blenheim Palace'] },

{ c: 'Movies', t: 4, q: 'To which clandestine organization do the characters of Army of Shadows belong?', a: 'The French Resistance', d: ['The Spanish maquis', 'The Italian partisans', 'The Polish Home Army'] },
{ c: 'Television', t: 4, q: 'In The Leftovers, what share of the world population disappears in the Sudden Departure?', a: 'Two percent', d: ['One percent', 'Five percent', 'Ten percent'] },
{ c: 'Actors & Directors', t: 4, q: 'Which Iranian director made Close-Up and Taste of Cherry?', a: 'Abbas Kiarostami', d: ['Jafar Panahi', 'Mohsen Makhmalbaf', 'Amir Naderi'] },
{ c: 'Awards & Box Office', t: 4, q: 'Which Hungarian film won the Academy Award for Best Foreign Language Film for 2015?', a: 'Son of Saul', d: ['Mustang', 'Theeb', 'Embrace of the Serpent'] },
{ c: 'Behind the Scenes', t: 4, q: 'Which decommissioned Lithuanian nuclear plant stood in for the reactor site in the 2019 miniseries Chernobyl?', a: 'Ignalina', d: ['Paks', 'Temelin', 'Kozloduy'] },

{ c: 'Movies', t: 5, q: 'Chris Marker\'s La Jetee is assembled almost entirely from what?', a: 'Still photographs', d: ['Hand-drawn animation', 'Newsreel footage', 'Puppet sequences'] },
{ c: 'Television', t: 5, q: 'Which 1962 BBC police series was set in the fictional northern town of Newtown and broke sharply with the cozy style of Dixon of Dock Green?', a: 'Z-Cars', d: ['Softly, Softly', 'No Hiding Place', 'The Sweeney'] },
{ c: 'Actors & Directors', t: 5, q: 'Which Australian born cinematographer shot Chungking Express and Happy Together for Wong Kar-wai?', a: 'Christopher Doyle', d: ['Mark Lee Ping-bing', 'Peter Pau', 'Jingle Ma'] },
{ c: 'Awards & Box Office', t: 5, q: 'Which Jafar Panahi film won the Golden Bear at Berlin in 2015?', a: 'Taxi', d: ['45 Years', 'Body', 'Victoria'] },
{ c: 'Behind the Scenes', t: 5, q: 'Which Welsh village built as an Italianate resort provided the setting for the 1967 series The Prisoner?', a: 'Portmeirion', d: ['Clovelly', 'Aberaeron', 'Portsalon'] },
],

// ── Day 53 ──────────────────────────────────────────────────────────────
[
{ c: 'Movies', t: 1, q: 'What kind of animal is Baloo in Disney\'s The Jungle Book?', a: 'A bear', d: ['A tiger', 'A panther', 'An orangutan'] },
{ c: 'Television', t: 1, q: 'Which procedural follows a team of forensic investigators working crime scenes in Las Vegas?', a: 'CSI', d: ['Bones', 'Criminal Minds', 'Quincy, M.E.'] },
{ c: 'Actors & Directors', t: 1, q: 'Which actress starred in the Lara Croft films and played the horned fairy in a 2014 Disney feature?', a: 'Angelina Jolie', d: ['Charlize Theron', 'Michelle Rodriguez', 'Milla Jovovich'] },
{ c: 'Awards & Box Office', t: 1, q: 'Which 2010 Pixar sequel was the top-grossing film worldwide that year?', a: 'Toy Story 3', d: ['Alice in Wonderland', 'Inception', 'Iron Man 2'] },
{ c: 'Behind the Scenes', t: 1, q: 'What is a stunt coordinator responsible for?', a: 'Planning and supervising the action so nobody is hurt', d: ['Standing in for the star while the lights are set', 'Deciding which stunts to cut from the finished film', 'Insuring the production against accidents'] },

{ c: 'Movies', t: 2, q: 'Which spectacle forms the centerpiece of the 1959 epic Ben-Hur?', a: 'A chariot race', d: ['A gladiator duel', 'A naval siege', 'A lion hunt'] },
{ c: 'Television', t: 2, q: 'Which procedural follows a naval investigative team led by Leroy Jethro Gibbs?', a: 'NCIS', d: ['JAG', 'The Unit', 'Blue Bloods'] },
{ c: 'Actors & Directors', t: 2, q: 'Which Northern Irish actor played Oskar Schindler and later the father in Taken?', a: 'Liam Neeson', d: ['Ralph Fiennes', 'Gerard Butler', 'Sean Bean'] },
{ c: 'Awards & Box Office', t: 2, q: 'Which actor won Best Actor for Dallas Buyers Club?', a: 'Matthew McConaughey', d: ['Chiwetel Ejiofor', 'Bruce Dern', 'Christian Bale'] },
{ c: 'Behind the Scenes', t: 2, q: 'Which performer played the chimpanzee Caesar through motion capture in the 2011 Planet of the Apes film?', a: 'Andy Serkis', d: ['Doug Jones', 'Terry Notary', 'Toby Kebbell'] },

{ c: 'Movies', t: 3, q: 'Which port do the Arab forces take by attacking from the desert in Lawrence of Arabia?', a: 'Aqaba', d: ['Damascus', 'Medina', 'Suez'] },
{ c: 'Television', t: 3, q: 'Which British sitcom followed a romance between a young man from Essex and a young woman from Barry Island, and their two loud best friends?', a: 'Gavin & Stacey', d: ['Two Pints of Lager and a Packet of Crisps', 'Benidorm', 'Him & Her'] },
{ c: 'Actors & Directors', t: 3, q: 'Which screenwriter created The West Wing and wrote The Social Network?', a: 'Aaron Sorkin', d: ['David E. Kelley', 'Tom Fontana', 'John Wells'] },
{ c: 'Awards & Box Office', t: 3, q: 'Which 2002 superhero film was the top-grossing release in North America that year?', a: 'Spider-Man', d: ['The Lord of the Rings: The Two Towers', 'Star Wars: Attack of the Clones', 'My Big Fat Greek Wedding'] },
{ c: 'Behind the Scenes', t: 3, q: 'Which 2017 film choreographed its driving and action to songs chosen before shooting?', a: 'Baby Driver', d: ['Drive', 'Atomic Blonde', 'Guardians of the Galaxy'] },

{ c: 'Movies', t: 4, q: 'How does the wandering swordsman deal with the two gangs in Kurosawa\'s Yojimbo?', a: 'He hires himself to both and sets them against each other', d: ['He burns the town and drives them out', 'He trains the farmers to fight them', 'He reports them to the magistrate'] },
{ c: 'Television', t: 4, q: 'In the anime Death Note, what kind of being is Ryuk?', a: 'A shinigami', d: ['A yokai', 'An oni', 'A kami'] },
{ c: 'Actors & Directors', t: 4, q: 'Which prolific German director made Ali: Fear Eats the Soul and The Marriage of Maria Braun before dying at thirty-seven?', a: 'Rainer Werner Fassbinder', d: ['Volker Schlondorff', 'Alexander Kluge', 'Hans-Jurgen Syberberg'] },
{ c: 'Awards & Box Office', t: 4, q: 'Which Mexican film won the Academy Award for Best International Feature for 2018?', a: 'Roma', d: ['Cold War', 'Capernaum', 'Never Look Away'] },
{ c: 'Behind the Scenes', t: 4, q: 'Which 2006 Bond film opened with a chase performed by a founder of parkour?', a: 'Casino Royale', d: ['Quantum of Solace', 'Skyfall', 'Die Another Day'] },

{ c: 'Movies', t: 5, q: 'What does the declining landowner spend his last fortune on in Satyajit Ray\'s Jalsaghar?', a: 'Musical recitals in his palace hall', d: ['A wedding for his daughter', 'A stable of racehorses', 'Rebuilding a temple'] },
{ c: 'Television', t: 5, q: 'Which 1953 BBC serial about a rocket group and a returning astronaut is regarded as the first adult science fiction on British television?', a: 'The Quatermass Experiment', d: ['A for Andromeda', 'The Voodoo Factory', 'The Trollenberg Terror'] },
{ c: 'Actors & Directors', t: 5, q: 'Which Cuban director made Memories of Underdevelopment?', a: 'Tomas Gutierrez Alea', d: ['Humberto Solas', 'Santiago Alvarez', 'Julio Garcia Espinosa'] },
{ c: 'Awards & Box Office', t: 5, q: 'Which film took the Golden Lion at Venice in 2011?', a: 'Faust', d: ['Shame', 'A Dangerous Method', 'Carnage'] },
{ c: 'Behind the Scenes', t: 5, q: 'Which editor, whose background was in documentaries, cut Mad Max: Fury Road?', a: 'Margaret Sixel', d: ['Jill Bilcock', 'Dody Dorn', 'Lee Smith'] },
],

// ── Day 54 ──────────────────────────────────────────────────────────────
[
{ c: 'Movies', t: 1, q: 'What is the lush alien moon being mined by humans in Avatar called?', a: 'Pandora', d: ['Arrakis', 'Solaris', 'Caprica'] },
{ c: 'Television', t: 1, q: 'Which animated preschool series follows a small pink piglet, her brother George and their muddy puddles?', a: 'Peppa Pig', d: ['Ben and Holly', 'Bing', 'Charlie and Lola'] },
{ c: 'Actors & Directors', t: 1, q: 'Which actor appeared in Pulp Fiction and Jackie Brown, and played Mace Windu in the Star Wars prequels?', a: 'Samuel L. Jackson', d: ['Laurence Fishburne', 'Wesley Snipes', 'Don Cheadle'] },
{ c: 'Awards & Box Office', t: 1, q: 'Which awards, first handed out in 1981, single out the year\'s worst films?', a: 'The Golden Raspberry Awards', d: ['The Golden Turkey Awards', 'The Stinkers Bad Movie Awards', 'The Bottom Ten Awards'] },
{ c: 'Behind the Scenes', t: 1, q: 'In American animated features, when are the actors\' voices usually recorded?', a: 'Before the animation is drawn', d: ['After the animation is finished', 'While the animation is being projected', 'Only for the trailer, never the film'] },

{ c: 'Movies', t: 2, q: 'What does the angel show George Bailey in It\'s a Wonderful Life?', a: 'How the town would have turned out if he had never been born', d: ['The future of his children', 'His own funeral', 'The moment his brother nearly drowned'] },
{ c: 'Television', t: 2, q: 'Which series follows two brothers hunting monsters across America in a black 1967 Impala?', a: 'Supernatural', d: ['Grimm', 'Constantine', 'Wynonna Earp'] },
{ c: 'Actors & Directors', t: 2, q: 'Which Spanish actress has appeared in a long run of Pedro Almodovar films and also starred in Blow and Vanilla Sky?', a: 'Penelope Cruz', d: ['Carmen Maura', 'Victoria Abril', 'Salma Hayek'] },
{ c: 'Awards & Box Office', t: 2, q: 'Which actress won Best Supporting Actress for Chicago?', a: 'Catherine Zeta-Jones', d: ['Queen Latifah', 'Meryl Streep', 'Julianne Moore'] },
{ c: 'Behind the Scenes', t: 2, q: 'The growls and moans of Chewbacca in Star Wars were assembled from what source?', a: 'Recordings of bears and other animals', d: ['A synthesizer', 'A human voice slowed down', 'A modified engine recording'] },

{ c: 'Movies', t: 3, q: 'Who is the young woman slipping away from her official duties in Roman Holiday?', a: 'A princess', d: ['An ambassador\'s daughter', 'A film star', 'An heiress to a shipping fortune'] },
{ c: 'Television', t: 3, q: 'Which HBO series adapted Elena Ferrante novels about a lifelong friendship between two girls in a poor Naples neighborhood?', a: 'My Brilliant Friend', d: ['Gomorrah', 'The Young Pope', 'Suburra'] },
{ c: 'Actors & Directors', t: 3, q: 'Which director made Thief, Heat, The Insider and Collateral?', a: 'Michael Mann', d: ['Tony Scott', 'Walter Hill', 'William Friedkin'] },
{ c: 'Awards & Box Office', t: 3, q: 'Which 2004 animated sequel was the top-grossing film worldwide that year?', a: 'Shrek 2', d: ['Spider-Man 2', 'Harry Potter and the Prisoner of Azkaban', 'The Day After Tomorrow'] },
{ c: 'Behind the Scenes', t: 3, q: 'Which 1978 horror film had a spare, piano-driven score written by its own director?', a: 'Halloween', d: ['Suspiria', 'The Omen', 'Black Christmas'] },

{ c: 'Movies', t: 4, q: 'What are the dinner guests unable to do in Bunuel\'s The Exterminating Angel?', a: 'Leave the drawing room', d: ['Stop laughing', 'See their host', 'Remember their own names'] },
{ c: 'Television', t: 4, q: 'Which Canadian mockumentary comedy is set in the Sunnyvale trailer park in Nova Scotia?', a: 'Trailer Park Boys', d: ['Letterkenny', 'Kenny vs. Spenny', 'Mr. D'] },
{ c: 'Actors & Directors', t: 4, q: 'Which Greek director made Landscape in the Mist and Eternity and a Day?', a: 'Theo Angelopoulos', d: ['Michael Cacoyannis', 'Costa-Gavras', 'Pantelis Voulgaris'] },
{ c: 'Awards & Box Office', t: 4, q: 'Which series won the Emmy for Outstanding Comedy Series three years running from 2015 to 2017?', a: 'Veep', d: ['Modern Family', 'Transparent', 'Master of None'] },
{ c: 'Behind the Scenes', t: 4, q: 'Hans Zimmer built the brass motifs of which 2010 score by slowing down an Edith Piaf recording?', a: 'Inception', d: ['Interstellar', 'The Dark Knight', 'Dunkirk'] },

{ c: 'Movies', t: 5, q: 'What had the heroine of Larisa Shepitko\'s Wings been during the war?', a: 'A fighter pilot', d: ['A field nurse', 'A radio operator', 'A sniper'] },
{ c: 'Television', t: 5, q: 'Which 1973 Soviet miniseries followed an agent embedded in the German high command in 1945 and became a national institution?', a: 'Seventeen Moments of Spring', d: ['The Meeting Place Cannot Be Changed', 'The Shield and the Sword', 'TASS Is Authorized to Declare'] },
{ c: 'Actors & Directors', t: 5, q: 'Which French composer wrote the all-sung score of The Umbrellas of Cherbourg?', a: 'Michel Legrand', d: ['Georges Delerue', 'Maurice Jarre', 'Francis Lai'] },
{ c: 'Awards & Box Office', t: 5, q: 'Which film won the Sundance Grand Jury Prize for drama in 2001?', a: 'The Believer', d: ['Hedwig and the Angry Inch', 'Memento', 'In the Bedroom'] },
{ c: 'Behind the Scenes', t: 5, q: 'Whose commissioned score for 2001: A Space Odyssey was dropped in favor of the classical pieces used as temporary tracks?', a: 'Alex North', d: ['Jerry Goldsmith', 'Elmer Bernstein', 'Miklos Rozsa'] },
],

// ── Day 55 ──────────────────────────────────────────────────────────────
[
{ c: 'Movies', t: 1, q: 'What kind of animal is Thumper in Disney\'s Bambi?', a: 'A rabbit', d: ['A skunk', 'A squirrel', 'A badger'] },
{ c: 'Television', t: 1, q: 'Which cartoon bear, in a green hat and collar, steals picnic baskets in Jellystone Park?', a: 'Yogi Bear', d: ['Huckleberry Hound', 'Snagglepuss', 'Quick Draw McGraw'] },
{ c: 'Actors & Directors', t: 1, q: 'Which actor co-wrote and starred in Good Will Hunting and later played Jason Bourne?', a: 'Matt Damon', d: ['Ben Affleck', 'Mark Wahlberg', 'Ethan Hawke'] },
{ c: 'Awards & Box Office', t: 1, q: 'Which 2006 pirate sequel was the top-grossing film worldwide that year?', a: 'Pirates of the Caribbean: Dead Man\'s Chest', d: ['The Da Vinci Code', 'Ice Age: The Meltdown', 'Casino Royale'] },
{ c: 'Behind the Scenes', t: 1, q: 'Which 2017 war film flew restored Spitfires and shot much of its action on large-format IMAX cameras?', a: 'Dunkirk', d: ['Darkest Hour', 'Pearl Harbor', 'Their Finest'] },

{ c: 'Movies', t: 2, q: 'What disguise does the father adopt to spend time with his children in Mrs. Doubtfire?', a: 'An elderly Scottish housekeeper', d: ['A school janitor', 'A French chef', 'A bus driver'] },
{ c: 'Television', t: 2, q: 'Which sitcom followed four older women sharing a Miami house with a lanai and a great deal of cheesecake?', a: 'The Golden Girls', d: ['Designing Women', 'Empty Nest', 'The Facts of Life'] },
{ c: 'Actors & Directors', t: 2, q: 'Which actress starred in Legally Blonde and played June Carter in Walk the Line?', a: 'Reese Witherspoon', d: ['Renee Zellweger', 'Kate Hudson', 'Cameron Diaz'] },
{ c: 'Awards & Box Office', t: 2, q: 'Which actor won Best Actor for Milk?', a: 'Sean Penn', d: ['Mickey Rourke', 'Frank Langella', 'Richard Jenkins'] },
{ c: 'Behind the Scenes', t: 2, q: 'Which 1975 film had a supporting actor rewriting the script from day to day while shooting continued?', a: 'Jaws', d: ['The Sting', 'Marathon Man', 'The Deep'] },

{ c: 'Movies', t: 3, q: 'What is the name of the reclusive neighbor in To Kill a Mockingbird?', a: 'Boo Radley', d: ['Bob Ewell', 'Dill Harris', 'Judge Taylor'] },
{ c: 'Television', t: 3, q: 'Which series follows a teenage private investigator in the California beach town of Neptune?', a: 'Veronica Mars', d: ['Nancy Drew', 'Riverdale', 'Pretty Little Liars'] },
{ c: 'Actors & Directors', t: 3, q: 'Which director made Carrie, Scarface and The Untouchables?', a: 'Brian De Palma', d: ['Michael Cimino', 'John Frankenheimer', 'John Badham'] },
{ c: 'Awards & Box Office', t: 3, q: 'Which director won the Academy Award for Best Director for Slumdog Millionaire?', a: 'Danny Boyle', d: ['David Fincher', 'Gus Van Sant', 'Ron Howard'] },
{ c: 'Behind the Scenes', t: 3, q: 'In the cutting room, what does it mean to cut on action?', a: 'Joining two shots in the middle of a movement so the cut is less visible', d: ['Cutting only while nobody is speaking', 'Changing shot every time the music changes', 'Ending a scene as soon as the camera stops moving'] },

{ c: 'Movies', t: 4, q: 'In which country\'s postwar recovery is The Marriage of Maria Braun set?', a: 'West Germany', d: ['Austria', 'Italy', 'France'] },
{ c: 'Television', t: 4, q: 'Which single-season series followed two circles of Michigan high school students during the 1980 school year?', a: 'Freaks and Geeks', d: ['My So-Called Life', 'Undeclared', 'That \'70s Show'] },
{ c: 'Actors & Directors', t: 4, q: 'Which music video director made Being John Malkovich and Her?', a: 'Spike Jonze', d: ['Michel Gondry', 'Jonathan Glazer', 'David O. Russell'] },
{ c: 'Awards & Box Office', t: 4, q: 'Which German film won the Academy Award for Best Foreign Language Film for 2002?', a: 'Nowhere in Africa', d: ['Hero', 'The Crime of Father Amaro', 'Zus & Zo'] },
{ c: 'Behind the Scenes', t: 4, q: 'Which 1982 science fiction film added a narration after test screenings that its director later removed?', a: 'Blade Runner', d: ['Dune', 'Brazil', 'The Thing'] },

{ c: 'Movies', t: 5, q: 'What does Dziga Vertov\'s Man with a Movie Camera contain none of?', a: 'Intertitles', d: ['Close-ups', 'Crowds', 'Machinery'] },
{ c: 'Television', t: 5, q: 'Which Spanish series, beginning in 2001, followed the Alcantara family through the last years of the Franco era?', a: 'Cuentame como paso', d: ['Aqui no hay quien viva', 'Verano azul', 'Amar es para siempre'] },
{ c: 'Actors & Directors', t: 5, q: 'Which Romanian director made 4 Months, 3 Weeks and 2 Days?', a: 'Cristian Mungiu', d: ['Cristi Puiu', 'Corneliu Porumboiu', 'Radu Jude'] },
{ c: 'Awards & Box Office', t: 5, q: 'Which Chinese film won the Golden Bear at Berlin in 2014?', a: 'Black Coal, Thin Ice', d: ['Boyhood', 'The Grand Budapest Hotel', 'Stations of the Cross'] },
{ c: 'Behind the Scenes', t: 5, q: 'Which 1942 film was taken from its director by the studio, shortened heavily and given a new ending shot by other hands?', a: 'The Magnificent Ambersons', d: ['The Lady from Shanghai', 'Journey into Fear', 'Mr. Arkadin'] },
],

// ── Day 56 ──────────────────────────────────────────────────────────────
[
{ c: 'Movies', t: 1, q: 'What poisoned item does the Queen give the princess in Disney\'s Snow White?', a: 'An apple', d: ['A comb', 'A cup of wine', 'A ribbon'] },
{ c: 'Television', t: 1, q: 'Which 1970s series featured a heroine who spun on the spot to transform, armed with a golden lasso and bulletproof bracelets?', a: 'Wonder Woman', d: ['The Bionic Woman', 'Isis', 'Electra Woman and Dyna Girl'] },
{ c: 'Actors & Directors', t: 1, q: 'Which comic actor starred in Happy Gilmore, Billy Madison and The Waterboy?', a: 'Adam Sandler', d: ['Ben Stiller', 'Kevin James', 'Chris Tucker'] },
{ c: 'Awards & Box Office', t: 1, q: 'Which 2011 boy-wizard finale was the top-grossing film worldwide that year?', a: 'Harry Potter and the Deathly Hallows Part 2', d: ['Transformers: Dark of the Moon', 'Pirates of the Caribbean: On Stranger Tides', 'The Hangover Part II'] },
{ c: 'Behind the Scenes', t: 1, q: 'Which children\'s series brought Jim Henson\'s Muppets onto a New York street set to teach letters and numbers?', a: 'Sesame Street', d: ['The Muppet Show', 'Mister Rogers\' Neighborhood', 'Fraggle Rock'] },

{ c: 'Movies', t: 2, q: 'What kind of animal is Sid in the Ice Age films?', a: 'A sloth', d: ['A mammoth', 'A saber-toothed tiger', 'A possum'] },
{ c: 'Television', t: 2, q: 'Which 1960s sitcom featured a palomino who would only talk to his owner Wilbur?', a: 'Mister Ed', d: ['Francis the Talking Mule', 'My Mother the Car', 'Flipper'] },
{ c: 'Actors & Directors', t: 2, q: 'Which actress starred in There\'s Something About Mary and the 2000 Charlie\'s Angels?', a: 'Cameron Diaz', d: ['Drew Barrymore', 'Lucy Liu', 'Jennifer Aniston'] },
{ c: 'Awards & Box Office', t: 2, q: 'Which actress won Best Supporting Actress for Dreamgirls?', a: 'Jennifer Hudson', d: ['Abigail Breslin', 'Rinko Kikuchi', 'Adriana Barraza'] },
{ c: 'Behind the Scenes', t: 2, q: 'Which animated series grew out of a short made with cut-out construction paper?', a: 'South Park', d: ['Beavis and Butt-Head', 'Ren & Stimpy', 'Daria'] },

{ c: 'Movies', t: 3, q: 'Which Roman emperor does the general face in the arena in Gladiator?', a: 'Commodus', d: ['Caligula', 'Nero', 'Tiberius'] },
{ c: 'Television', t: 3, q: 'Which American soap opera opens with narration about sands through the hourglass?', a: 'Days of Our Lives', d: ['General Hospital', 'As the World Turns', 'The Young and the Restless'] },
{ c: 'Actors & Directors', t: 3, q: 'Which twenty-three year old director made Boyz n the Hood?', a: 'John Singleton', d: ['Spike Lee', 'Mario Van Peebles', 'Ernest Dickerson'] },
{ c: 'Awards & Box Office', t: 3, q: 'Which 1963 epic about an Egyptian queen was the most expensive film made to that point and nearly ruined its studio?', a: 'Cleopatra', d: ['Ben-Hur', 'The Fall of the Roman Empire', 'Doctor Zhivago'] },
{ c: 'Behind the Scenes', t: 3, q: 'Which Aaron Sorkin series made a signature of long tracking shots of characters talking as they stride down corridors?', a: 'The West Wing', d: ['Homicide: Life on the Street', 'The Newsroom', 'ER'] },

{ c: 'Movies', t: 4, q: 'What do the friends repeatedly fail to accomplish in Bunuel\'s The Discreet Charm of the Bourgeoisie?', a: 'Sit down to a meal together', d: ['Catch a train', 'Bury a relative', 'Finish a card game'] },
{ c: 'Television', t: 4, q: 'Which 1966 gothic daytime soap opera introduced a reluctant vampire named Barnabas Collins?', a: 'Dark Shadows', d: ['Peyton Place', 'The Edge of Night', 'Strange Paradise'] },
{ c: 'Actors & Directors', t: 4, q: 'Which actor played the shotgun-carrying stickup man Omar Little in The Wire?', a: 'Michael K. Williams', d: ['Idris Elba', 'Wood Harris', 'Andre Royo'] },
{ c: 'Awards & Box Office', t: 4, q: 'Which film won the Academy Award for Best Documentary Feature for 2006?', a: 'An Inconvenient Truth', d: ['Iraq in Fragments', 'Deliver Us from Evil', 'Jesus Camp'] },
{ c: 'Behind the Scenes', t: 4, q: 'Which American-led puppet variety show was actually produced in England at ATV\'s Elstree studios?', a: 'The Muppet Show', d: ['Fraggle Rock', 'The Dark Crystal', 'Sesame Street'] },

{ c: 'Movies', t: 5, q: 'Which construction project is flooding the town in Jia Zhangke\'s Still Life?', a: 'The Three Gorges Dam', d: ['The Beijing to Shanghai railway', 'The Grand Canal restoration', 'The Yellow River levee'] },
{ c: 'Television', t: 5, q: 'Which 1975 BBC sitcom followed a couple who turned their Surbiton garden into a smallholding, to the horror of their neighbors?', a: 'The Good Life', d: ['Butterflies', 'Ever Decreasing Circles', 'The Fall and Rise of Reginald Perrin'] },
{ c: 'Actors & Directors', t: 5, q: 'Which Burkinabe director made Yaaba and Tilai?', a: 'Idrissa Ouedraogo', d: ['Gaston Kabore', 'Souleymane Cisse', 'Djibril Diop Mambety'] },
{ c: 'Awards & Box Office', t: 5, q: 'Which film won the Sundance Grand Jury Prize for drama in 1991?', a: 'Poison', d: ['Slacker', 'Privilege', 'Daughters of the Dust'] },
{ c: 'Behind the Scenes', t: 5, q: 'Which 1980s police series worked under a production rule forbidding earth tones in its sets and wardrobe?', a: 'Miami Vice', d: ['Hill Street Blues', 'Crime Story', 'Wiseguy'] },
],

// ── Day 57 ──────────────────────────────────────────────────────────────
[
{ c: 'Movies', t: 1, q: 'What is the name of Han Solo\'s tall, furred co-pilot?', a: 'Chewbacca', d: ['Greedo', 'Bossk', 'Nien Nunb'] },
{ c: 'Television', t: 1, q: 'In Doctor Who, what is the name of the time machine disguised as a 1960s police box?', a: 'the TARDIS', d: ['the Vortex', 'the Chameleon', 'the Zero Room'] },
{ c: 'Actors & Directors', t: 1, q: 'Which actress starred in The Seven Year Itch and Some Like It Hot?', a: 'Marilyn Monroe', d: ['Jayne Mansfield', 'Kim Novak', 'Lauren Bacall'] },
{ c: 'Awards & Box Office', t: 1, q: 'Which 2018 animated sequel about a family of superheroes grossed more than 1.2 billion dollars worldwide?', a: 'Incredibles 2', d: ['Ralph Breaks the Internet', 'Hotel Transylvania 3: Summer Vacation', 'Bumblebee'] },
{ c: 'Behind the Scenes', t: 1, q: 'The giant marshmallow figure that stomps through the finale of the 1984 comedy Ghostbusters was achieved how?', a: 'A performer in a foam suit', d: ['Stop-motion animation', 'A hand-drawn animated overlay', 'A computer-generated model'] },

{ c: 'Movies', t: 2, q: 'Which holiday is the office party celebrating when terrorists seize Nakatomi Plaza in the 1988 Bruce Willis thriller?', a: 'Christmas', d: ['Thanksgiving', 'New Year\'s Eve', 'The Fourth of July'] },
{ c: 'Television', t: 2, q: 'Which American childrens series opened with its host arriving home, changing into a cardigan and sneakers, and singing about being a neighbor?', a: 'Mister Rogers\' Neighborhood', d: ['Captain Kangaroo', 'Romper Room', 'The Electric Company'] },
{ c: 'Actors & Directors', t: 2, q: 'Which actor starred in Stagecoach, The Searchers and True Grit?', a: 'John Wayne', d: ['Gary Cooper', 'Randolph Scott', 'Joel McCrea'] },
{ c: 'Awards & Box Office', t: 2, q: 'Which studio released the original Star Wars trilogy?', a: 'Twentieth Century-Fox', d: ['Universal', 'Paramount', 'Columbia'] },
{ c: 'Behind the Scenes', t: 2, q: 'Which 2016 remake of a Disney animal story was shot almost entirely on a Los Angeles stage with digital jungles added later?', a: 'The Jungle Book', d: ['Dumbo', 'Pete\'s Dragon', 'Christopher Robin'] },

{ c: 'Movies', t: 3, q: 'Which song wakes the weatherman on his clock radio every morning in Groundhog Day?', a: 'I Got You Babe', d: ['Good Vibrations', 'Take Me Home, Country Roads', 'Sunny Afternoon'] },
{ c: 'Television', t: 3, q: 'Which series followed a teenage Clark Kent in a Kansas farm town before he took up the cape?', a: 'Smallville', d: ['Lois & Clark', 'The Adventures of Superman', 'Krypton'] },
{ c: 'Actors & Directors', t: 3, q: 'Which actor starred in It\'s a Wonderful Life, Harvey and Rear Window?', a: 'James Stewart', d: ['Henry Fonda', 'Gary Cooper', 'Van Johnson'] },
{ c: 'Awards & Box Office', t: 3, q: 'Which actor won Best Actor for playing Stephen Hawking in a 2014 film?', a: 'Eddie Redmayne', d: ['Michael Keaton', 'Benedict Cumberbatch', 'Steve Carell'] },
{ c: 'Behind the Scenes', t: 3, q: 'Which 1942 film was rewritten day by day during shooting from a play called Everybody Comes to Rick\'s?', a: 'Casablanca', d: ['To Have and Have Not', 'Now, Voyager', 'Notorious'] },

{ c: 'Movies', t: 4, q: 'What is Cesare in The Cabinet of Dr. Caligari?', a: 'A sleepwalker', d: ['A gravedigger', 'A stage magician', 'An escaped soldier'] },
{ c: 'Television', t: 4, q: 'Which FX drama about a corrupt police strike team was set in the fictional Farmington district of Los Angeles?', a: 'The Shield', d: ['Southland', 'Dark Blue', 'The Chicago Code'] },
{ c: 'Actors & Directors', t: 4, q: 'Which Japanese actress starred in Rashomon, Ugetsu and Gate of Hell?', a: 'Machiko Kyo', d: ['Setsuko Hara', 'Kinuyo Tanaka', 'Hideko Takamine'] },
{ c: 'Awards & Box Office', t: 4, q: 'Which film won the BAFTA for Best Film at the 2022 ceremony?', a: 'The Power of the Dog', d: ['Belfast', 'Licorice Pizza', 'Dune'] },
{ c: 'Behind the Scenes', t: 4, q: 'Which 1988 action film came from a novel that was a sequel to a book already filmed in 1968?', a: 'Die Hard', d: ['Lethal Weapon', 'Predator', 'Commando'] },

{ c: 'Movies', t: 5, q: 'In what form does the lost son return in Uncle Boonmee Who Can Recall His Past Lives?', a: 'As a red-eyed monkey spirit', d: ['As a white buffalo', 'As a swarm of fireflies', 'As a child in a monk\'s robe'] },
{ c: 'Television', t: 5, q: 'Which 1974 British childrens series featured a saggy old cloth cat who woke up in a shop full of mended things?', a: 'Bagpuss', d: ['The Clangers', 'Ivor the Engine', 'Camberwick Green'] },
{ c: 'Actors & Directors', t: 5, q: 'Which composer wrote the scores for Rashomon and Seven Samurai?', a: 'Fumio Hayasaka', d: ['Masaru Sato', 'Akira Ifukube', 'Ikuma Dan'] },
{ c: 'Awards & Box Office', t: 5, q: 'Which documentary took the Golden Lion at Venice in 2022?', a: 'All the Beauty and the Bloodshed', d: ['The Whale', 'Tar', 'Bones and All'] },
{ c: 'Behind the Scenes', t: 5, q: 'Which unmade adaptation, the subject of a 2013 documentary, gathered designers who went straight on to work on Alien?', a: 'Dune', d: ['Flash Gordon', 'The Incal', 'Barbarella'] },
],

// ── Day 58 ──────────────────────────────────────────────────────────────
[
{ c: 'Movies', t: 1, q: 'What does Alice follow down the hole in Disney\'s Alice in Wonderland?', a: 'A white rabbit', d: ['A striped cat', 'A talking mouse', 'A blue caterpillar'] },
{ c: 'Television', t: 1, q: 'In The Simpsons, which musical instrument does Lisa play?', a: 'The saxophone', d: ['The clarinet', 'The trumpet', 'The violin'] },
{ c: 'Actors & Directors', t: 1, q: 'Which actress played Rachel Green on Friends and starred in Marley & Me?', a: 'Jennifer Aniston', d: ['Courteney Cox', 'Lisa Kudrow', 'Sarah Jessica Parker'] },
{ c: 'Awards & Box Office', t: 1, q: 'Which Academy Award category rewards the person who cuts and assembles the footage of a picture?', a: 'Best Film Editing', d: ['Best Cinematography', 'Best Sound Mixing', 'Best Production Design'] },
{ c: 'Behind the Scenes', t: 1, q: 'What is the term for a scaled-down physical build of a ship or a city photographed so it reads as full size?', a: 'A miniature', d: ['A matte', 'A plate', 'A gobo'] },

{ c: 'Movies', t: 2, q: 'Which landing opens Saving Private Ryan?', a: 'Omaha Beach on D-Day', d: ['Anzio', 'Iwo Jima', 'The Scheldt estuary'] },
{ c: 'Television', t: 2, q: 'Which drama followed the Ingalls family farming near the Minnesota settlement of Walnut Grove?', a: 'Little House on the Prairie', d: ['The Waltons', 'Dr. Quinn, Medicine Woman', 'Christy'] },
{ c: 'Actors & Directors', t: 2, q: 'Which stand-up comedian co-created and starred in the NBC sitcom often called the show about nothing?', a: 'Jerry Seinfeld', d: ['Ray Romano', 'Paul Reiser', 'Garry Shandling'] },
{ c: 'Awards & Box Office', t: 2, q: 'Which song from Titanic won the Academy Award for Best Original Song?', a: 'My Heart Will Go On', d: ['Because You Loved Me', 'Iris', 'Unchained Melody'] },
{ c: 'Behind the Scenes', t: 2, q: 'Which 2010 film built a rotating corridor set so a fight could appear to run up the walls?', a: 'Inception', d: ['The Matrix', 'Doctor Strange', 'Edge of Tomorrow'] },

{ c: 'Movies', t: 3, q: 'Where do the two outlaws flee at the end of Butch Cassidy and the Sundance Kid?', a: 'Bolivia', d: ['Mexico', 'Argentina', 'Cuba'] },
{ c: 'Television', t: 3, q: 'Which sitcom followed a working-class Illinois family in the fictional town of Lanford?', a: 'Roseanne', d: ['Married... with Children', 'Grace Under Fire', 'The Middle'] },
{ c: 'Actors & Directors', t: 3, q: 'Which comedy writer created Curb Your Enthusiasm and stars in it as himself?', a: 'Larry David', d: ['Albert Brooks', 'Garry Shandling', 'Bob Odenkirk'] },
{ c: 'Awards & Box Office', t: 3, q: 'Which actress won Best Supporting Actress for 12 Years a Slave?', a: 'Lupita Nyong\'o', d: ['Jennifer Lawrence', 'June Squibb', 'Sally Hawkins'] },
{ c: 'Behind the Scenes', t: 3, q: 'Which 2013 space film lit its actors inside a cube of LED panels displaying moving images of the Earth?', a: 'Gravity', d: ['Interstellar', 'The Martian', 'Ad Astra'] },

{ c: 'Movies', t: 4, q: 'Which Shakespeare tragedy is transposed to feudal Japan in Kurosawa\'s Ran?', a: 'King Lear', d: ['Macbeth', 'Hamlet', 'Othello'] },
{ c: 'Television', t: 4, q: 'Which BBC drama follows nurses and nuns of Nonnatus House delivering babies in the East End of London in the 1950s?', a: 'Call the Midwife', d: ['The Crimson Field', 'Land Girls', 'The Village'] },
{ c: 'Actors & Directors', t: 4, q: 'Which Scottish satirist created The Thick of It and Veep?', a: 'Armando Iannucci', d: ['Chris Morris', 'Graham Linehan', 'Charlie Brooker'] },
{ c: 'Awards & Box Office', t: 4, q: 'Which 2016 Marvel film was the top-grossing release worldwide that year?', a: 'Captain America: Civil War', d: ['Rogue One: A Star Wars Story', 'Finding Dory', 'Batman v Superman: Dawn of Justice'] },
{ c: 'Behind the Scenes', t: 4, q: 'Which series popularized shooting against a curved LED video wall instead of a green screen?', a: 'The Mandalorian', d: ['The Expanse', 'Westworld', 'Foundation'] },

{ c: 'Movies', t: 5, q: 'Where is the entomologist held captive in Woman in the Dunes?', a: 'In a pit in the sand', d: ['In a lighthouse', 'On a fishing boat', 'In a mountain cave'] },
{ c: 'Television', t: 5, q: 'Which BBC current affairs series broadcast a straight-faced 1957 report on the Swiss spaghetti harvest?', a: 'Panorama', d: ['Tonight', 'Nationwide', 'World in Action'] },
{ c: 'Actors & Directors', t: 5, q: 'Which Japanese director made Vengeance Is Mine and the 1983 version of The Ballad of Narayama?', a: 'Shohei Imamura', d: ['Nagisa Oshima', 'Masaki Kobayashi', 'Kon Ichikawa'] },
{ c: 'Awards & Box Office', t: 5, q: 'Which film won the Sundance Grand Jury Prize for drama in 1999?', a: 'Three Seasons', d: ['Tumbleweeds', 'Judy Berlin', 'American Movie'] },
{ c: 'Behind the Scenes', t: 5, q: 'Which 1981 fantasy film animated its dragon with go motion, the stop-motion variant that blurs a model while it is being photographed?', a: 'Dragonslayer', d: ['Clash of the Titans', 'Excalibur', 'The Dark Crystal'] },
],

// ── Day 59 ──────────────────────────────────────────────────────────────
[
{ c: 'Movies', t: 1, q: 'What does Gru set out to steal in the first Despicable Me?', a: 'The Moon', d: ['The Eiffel Tower', 'The crown jewels', 'A nuclear submarine'] },
{ c: 'Television', t: 1, q: 'In SpongeBob SquarePants, what is the name of the restaurant where the title character works as a fry cook?', a: 'the Krusty Krab', d: ['the Chum Bucket', 'the Salty Spitoon', 'the Barnacle Bar'] },
{ c: 'Actors & Directors', t: 1, q: 'Which Israeli actress played Wonder Woman in the DC films?', a: 'Gal Gadot', d: ['Margot Robbie', 'Alicia Vikander', 'Emily Blunt'] },
{ c: 'Awards & Box Office', t: 1, q: 'In which country is the Berlin International Film Festival held?', a: 'Germany', d: ['Austria', 'Switzerland', 'The Netherlands'] },
{ c: 'Behind the Scenes', t: 1, q: 'Which silent comedian dangled from a clock face above the street in the 1923 film Safety Last!?', a: 'Harold Lloyd', d: ['Buster Keaton', 'Charlie Chaplin', 'Harry Langdon'] },

{ c: 'Movies', t: 2, q: 'What device in the hero\'s chest powers the armor in Iron Man?', a: 'An arc reactor', d: ['A fusion cell', 'A vibranium core', 'A plasma coil'] },
{ c: 'Television', t: 2, q: 'Which series followed an Ohio high school show choir working its way toward national competition?', a: 'Glee', d: ['Fame', 'Smash', 'Zoey 101'] },
{ c: 'Actors & Directors', t: 2, q: 'Which English actor played the trickster god Loki in the Marvel films?', a: 'Tom Hiddleston', d: ['Benedict Cumberbatch', 'Michael Fassbender', 'Aaron Taylor-Johnson'] },
{ c: 'Awards & Box Office', t: 2, q: 'Which 2015 dinosaur park sequel grossed more than 1.6 billion dollars worldwide?', a: 'Jurassic World', d: ['Furious 7', 'Avengers: Age of Ultron', 'Minions'] },
{ c: 'Behind the Scenes', t: 2, q: 'Which 1926 silent comedy sent a real locomotive through a burning bridge into a river for one shot?', a: 'The General', d: ['Steamboat Bill, Jr.', 'Our Hospitality', 'Sherlock Jr.'] },

{ c: 'Movies', t: 3, q: 'What is failing on Earth that forces the space mission in Interstellar?', a: 'Crops, destroyed by blight', d: ['The ozone layer', 'The planet\'s magnetic field', 'The oceans, turning to acid'] },
{ c: 'Television', t: 3, q: 'Which HBO comedy follows a hired killer who wanders into a Los Angeles acting class and decides he wants to act?', a: 'Barry', d: ['Atlanta', 'Killing Eve', 'Search Party'] },
{ c: 'Actors & Directors', t: 3, q: 'Which actress played Daenerys Targaryen in Game of Thrones?', a: 'Emilia Clarke', d: ['Sophie Turner', 'Natalie Dormer', 'Carice van Houten'] },
{ c: 'Awards & Box Office', t: 3, q: 'Which 1994 film won the Academy Award for Best Visual Effects?', a: 'Forrest Gump', d: ['True Lies', 'The Mask', 'Star Trek Generations'] },
{ c: 'Behind the Scenes', t: 3, q: 'Which 1939 production burned old studio sets, including a gate built for King Kong, to film a city ablaze?', a: 'Gone with the Wind', d: ['Jezebel', 'Wuthering Heights', 'Dark Victory'] },

{ c: 'Movies', t: 4, q: 'What is Gelsomina sold to become in Fellini\'s La Strada?', a: 'The assistant to a traveling strongman', d: ['A convent servant', 'A seamstress in Rome', 'A fisherman\'s wife'] },
{ c: 'Television', t: 4, q: 'Which BBC drama follows a West Yorkshire police sergeant named Catherine Cawood?', a: 'Happy Valley', d: ['Unforgotten', 'The Fall', 'Scott & Bailey'] },
{ c: 'Actors & Directors', t: 4, q: 'Which composer has scored nearly every Hayao Miyazaki feature?', a: 'Joe Hisaishi', d: ['Ryuichi Sakamoto', 'Yoko Kanno', 'Kenji Kawai'] },
{ c: 'Awards & Box Office', t: 4, q: 'Which program won the Emmy for Outstanding Limited Series in 2016?', a: 'The People v. O. J. Simpson: American Crime Story', d: ['Fargo', 'The Night Manager', 'American Crime'] },
{ c: 'Behind the Scenes', t: 4, q: 'Which studio developed a quiet foam-based artificial snow for It\'s a Wonderful Life, replacing the painted cornflakes then in use?', a: 'RKO', d: ['MGM', 'Republic', 'Universal'] },

{ c: 'Movies', t: 5, q: 'What must the man carry across the drained pool in Tarkovsky\'s Nostalghia?', a: 'A lit candle', d: ['A jar of water', 'A stone tablet', 'A caged bird'] },
{ c: 'Television', t: 5, q: 'Which BBC sketch series, beginning in 1971, closed each week with a pair of comedians saying "It\'s goodnight from me, and it\'s goodnight from him"?', a: 'The Two Ronnies', d: ['Morecambe and Wise', 'The Goodies', 'Not the Nine O\'Clock News'] },
{ c: 'Actors & Directors', t: 5, q: 'Which Bengali director made The Cloud-Capped Star and Subarnarekha?', a: 'Ritwik Ghatak', d: ['Mrinal Sen', 'Tapan Sinha', 'Buddhadeb Dasgupta'] },
{ c: 'Awards & Box Office', t: 5, q: 'Which Hungarian film won the Golden Bear at Berlin in 2017?', a: 'On Body and Soul', d: ['Ana, mon amour', 'The Other Side of Hope', 'Felicite'] },
{ c: 'Behind the Scenes', t: 5, q: 'Which 1924 Erich von Stroheim film was cut by the studio from a first assembly running around eight hours?', a: 'Greed', d: ['Foolish Wives', 'The Wedding March', 'Queen Kelly'] },
],

// ── Day 60 ──────────────────────────────────────────────────────────────
[
{ c: 'Movies', t: 1, q: 'How does Kevin defend the house against the two burglars in Home Alone?', a: 'With homemade booby traps', d: ['By calling the police', 'By hiding in the attic', 'By letting the dog loose'] },
{ c: 'Television', t: 1, q: 'In the 1960s Batman series, what is the name of the Wayne family butler?', a: 'Alfred', d: ['Jarvis', 'Hudson', 'Carson'] },
{ c: 'Actors & Directors', t: 1, q: 'Which actor took over as James Bond in the 2006 Casino Royale?', a: 'Daniel Craig', d: ['Pierce Brosnan', 'Timothy Dalton', 'Clive Owen'] },
{ c: 'Awards & Box Office', t: 1, q: 'In which country is the Busan International Film Festival held?', a: 'South Korea', d: ['Japan', 'China', 'Taiwan'] },
{ c: 'Behind the Scenes', t: 1, q: 'Which director made a habit of appearing briefly in nearly all of his own films?', a: 'Alfred Hitchcock', d: ['Billy Wilder', 'John Ford', 'Howard Hawks'] },

{ c: 'Movies', t: 2, q: 'What do the thieves target in Ocean\'s Eleven?', a: 'A Las Vegas casino vault', d: ['A Monte Carlo jewelry auction', 'An armored train', 'A Swiss bank branch'] },
{ c: 'Television', t: 2, q: 'Which sitcom followed a group of Wisconsin teenagers hanging around a basement across the late 1970s?', a: 'That \'70s Show', d: ['The Goldbergs', 'Everybody Hates Chris', 'Young Sheldon'] },
{ c: 'Actors & Directors', t: 2, q: 'Which actor starred in Call Me by Your Name and played Paul Atreides in the 2021 Dune?', a: 'Timothee Chalamet', d: ['Ansel Elgort', 'Lucas Hedges', 'Barry Keoghan'] },
{ c: 'Awards & Box Office', t: 2, q: 'Which actor won Best Supporting Actor for Once Upon a Time in Hollywood?', a: 'Brad Pitt', d: ['Al Pacino', 'Joe Pesci', 'Anthony Hopkins'] },
{ c: 'Behind the Scenes', t: 2, q: 'The tower under siege in Die Hard was a real Los Angeles high-rise that at the time housed what?', a: 'The headquarters of the studio making the film', d: ['A working police precinct', 'The tallest hotel in the city', 'A government records archive'] },

{ c: 'Movies', t: 3, q: 'What game does the knight play with Death in Bergman\'s The Seventh Seal?', a: 'Chess', d: ['Dice', 'Cards', 'Backgammon'] },
{ c: 'Television', t: 3, q: 'Which BBC sitcom follows a young couple who inherit a crumbling country house already occupied by centuries of dead residents?', a: 'Ghosts', d: ['Inside No. 9', 'Crazyhead', 'Being Human'] },
{ c: 'Actors & Directors', t: 3, q: 'Which British director made Shaun of the Dead, Hot Fuzz and Baby Driver?', a: 'Edgar Wright', d: ['Guy Ritchie', 'Ben Wheatley', 'Joe Cornish'] },
{ c: 'Awards & Box Office', t: 3, q: 'Which 2000 Christmas comedy was the top-grossing release in North America that year?', a: 'How the Grinch Stole Christmas', d: ['Mission: Impossible 2', 'Gladiator', 'Cast Away'] },
{ c: 'Behind the Scenes', t: 3, q: 'Which 1994 black-and-white comedy was shot overnight in the convenience store where its director worked by day?', a: 'Clerks', d: ['Slacker', 'Pi', 'El Mariachi'] },

{ c: 'Movies', t: 4, q: 'Which music industry provides the setting of Robert Altman\'s Nashville?', a: 'Country music', d: ['Jazz', 'Gospel radio', 'Rock and roll'] },
{ c: 'Television', t: 4, q: 'In Mr. Robot, what is the name of the hacker collective the lead character joins?', a: 'fsociety', d: ['the Dark Army', 'the Deus Group', 'Allsafe'] },
{ c: 'Actors & Directors', t: 4, q: 'Which British director made Red Road, Fish Tank and American Honey?', a: 'Andrea Arnold', d: ['Lynne Ramsay', 'Clio Barnard', 'Joanna Hogg'] },
{ c: 'Awards & Box Office', t: 4, q: 'Which film won the Toronto People\'s Choice Award in 2018?', a: 'Green Book', d: ['Roma', 'A Star Is Born', 'If Beale Street Could Talk'] },
{ c: 'Behind the Scenes', t: 4, q: 'Which 2019 South Korean film built the wealthy family\'s modern house as a set and flooded a purpose-built street in a water tank?', a: 'Parasite', d: ['Burning', 'The Handmaiden', 'Memories of Murder'] },

{ c: 'Movies', t: 5, q: 'What sort of troupe arrives in the seaside town in Ozu\'s Floating Weeds?', a: 'A traveling kabuki troupe', d: ['A circus', 'A puppet theater company', 'A film crew'] },
{ c: 'Television', t: 5, q: 'Which BBC childrens drama, set around a youth club in the north east of England, ran from 1989 to 2006?', a: 'Byker Grove', d: ['Grange Hill', 'Press Gang', 'The Demon Headmaster'] },
{ c: 'Actors & Directors', t: 5, q: 'Which Turkish director made Once Upon a Time in Anatolia and Winter Sleep?', a: 'Nuri Bilge Ceylan', d: ['Yilmaz Guney', 'Fatih Akin', 'Semih Kaplanoglu'] },
{ c: 'Awards & Box Office', t: 5, q: 'Which film won the Sundance Grand Jury Prize for drama in 2002?', a: 'Personal Velocity', d: ['Tadpole', 'The Slaughter Rule', 'Real Women Have Curves'] },
{ c: 'Behind the Scenes', t: 5, q: 'Which 2002 release was the first major live-action feature shot entirely on digital high-definition cameras?', a: 'Attack of the Clones', d: ['Collateral', '28 Days Later', 'Sin City'] },
],

// ── Day 61 ──────────────────────────────────────────────────────────────
[
{ c: 'Movies', t: 1, q: 'What does the fairy godmother turn into a coach in Disney\'s Cinderella?', a: 'A pumpkin', d: ['A wheelbarrow', 'A watermelon', 'A birdcage'] },
{ c: 'Television', t: 1, q: 'In Game of Thrones, which northern house takes "Winter is coming" as its words?', a: 'House Stark', d: ['House Lannister', 'House Baratheon', 'House Tully'] },
{ c: 'Actors & Directors', t: 1, q: 'Which actor starred in Catch Me If You Can, The Wolf of Wall Street and The Revenant?', a: 'Leonardo DiCaprio', d: ['Matt Damon', 'Christian Bale', 'Mark Ruffalo'] },
{ c: 'Awards & Box Office', t: 1, q: 'What does a film\'s theatrical run refer to?', a: 'The stretch of time it plays in cinemas', d: ['The length of the finished film', 'The number of cinemas showing it', 'The money it takes on its first day'] },
{ c: 'Behind the Scenes', t: 1, q: 'Which Philadelphia landmark provided the steps climbed at the end of the training sequence in the 1976 film Rocky?', a: 'The Philadelphia Museum of Art', d: ['Independence Hall', 'City Hall', 'The Franklin Institute'] },

{ c: 'Movies', t: 2, q: 'What does the stranded man name the volleyball he talks to in Cast Away?', a: 'Wilson', d: ['Charlie', 'Spalding', 'Friday'] },
{ c: 'Television', t: 2, q: 'Which animated Disney series followed a rich old duck and his three nephews on treasure hunts?', a: 'DuckTales', d: ['TaleSpin', 'Darkwing Duck', 'Chip n Dale Rescue Rangers'] },
{ c: 'Actors & Directors', t: 2, q: 'Which silent comedian, nicknamed the Great Stone Face, starred in The General and Sherlock Jr.?', a: 'Buster Keaton', d: ['Harold Lloyd', 'Charlie Chaplin', 'Harry Langdon'] },
{ c: 'Awards & Box Office', t: 2, q: 'Which actor won Best Actor for playing Idi Amin in a 2006 film?', a: 'Forest Whitaker', d: ['Will Smith', 'Peter O\'Toole', 'Ryan Gosling'] },
{ c: 'Behind the Scenes', t: 2, q: 'Which film series occupied Leavesden Studios in England for a decade, keeping standing sets there the whole time?', a: 'Harry Potter', d: ['The Lord of the Rings', 'The Golden Compass', 'Percy Jackson'] },

{ c: 'Movies', t: 3, q: 'What is the one splash of color in the otherwise black and white Schindler\'s List?', a: 'A little girl\'s red coat', d: ['A yellow armband', 'A blue suitcase', 'A green door'] },
{ c: 'Television', t: 3, q: 'Which Nickelodeon animated series followed a boy with a football-shaped head living in his grandparents boarding house?', a: 'Hey Arnold!', d: ['Doug', 'Recess', 'As Told by Ginger'] },
{ c: 'Actors & Directors', t: 3, q: 'Which British director made The Third Man and Odd Man Out?', a: 'Carol Reed', d: ['David Lean', 'Michael Powell', 'Anthony Asquith'] },
{ c: 'Awards & Box Office', t: 3, q: 'Which film was the first to gross one billion dollars worldwide?', a: 'Titanic', d: ['Star Wars', 'Jurassic Park', 'Star Wars: The Phantom Menace'] },
{ c: 'Behind the Scenes', t: 3, q: 'Which ancient site carved from rose-colored rock served as the temple exterior in Indiana Jones and the Last Crusade?', a: 'Petra', d: ['Palmyra', 'Ephesus', 'Leptis Magna'] },

{ c: 'Movies', t: 4, q: 'Where does the man whisper his secret at the end of In the Mood for Love?', a: 'Into a hollow in an ancient temple wall', d: ['Into a well in a Macau courtyard', 'Into a crack in the Great Wall', 'Into a hole in a Hong Kong seawall'] },
{ c: 'Television', t: 4, q: 'Which Swedish crime series, adapted from Henning Mankell novels, is set in and around the town of Ystad?', a: 'Wallander', d: ['Beck', 'The Sandhamn Murders', 'Arne Dahl'] },
{ c: 'Actors & Directors', t: 4, q: 'Which television writer created Deadwood?', a: 'David Milch', d: ['Steven Bochco', 'Tom Fontana', 'John Wells'] },
{ c: 'Awards & Box Office', t: 4, q: 'Which film won the Golden Globe for Best Motion Picture Musical or Comedy at the 2002 ceremony?', a: 'Moulin Rouge!', d: ['Gosford Park', 'Bridget Jones\'s Diary', 'Legally Blonde'] },
{ c: 'Behind the Scenes', t: 4, q: 'Which German town\'s disused department store was dressed as the hotel interior in a 2014 Wes Anderson film?', a: 'Gorlitz', d: ['Dresden', 'Leipzig', 'Bamberg'] },

{ c: 'Movies', t: 5, q: 'In which city and decade is Edward Yang\'s A Brighter Summer Day set?', a: 'Taipei in the early 1960s', d: ['Hong Kong in the late 1970s', 'Shanghai in the 1930s', 'Seoul in the 1950s'] },
{ c: 'Television', t: 5, q: 'Which 1994 Danish miniseries set in a haunted Copenhagen hospital ended each episode with the director addressing the viewer directly?', a: 'The Kingdom', d: ['Unit One', 'Nikolaj and Julie', 'Taxa'] },
{ c: 'Actors & Directors', t: 5, q: 'Which Czech director made Daisies in 1966?', a: 'Vera Chytilova', d: ['Jiri Menzel', 'Jan Nemec', 'Vojtech Jasny'] },
{ c: 'Awards & Box Office', t: 5, q: 'Whose name is on the Academy\'s honorary award given to a producer for a consistently high quality body of work?', a: 'Irving G. Thalberg', d: ['Jean Hersholt', 'David O. Selznick', 'Samuel Goldwyn'] },
{ c: 'Behind the Scenes', t: 5, q: 'Which California rock formation stood in for alien worlds again and again in the original Star Trek series?', a: 'Vasquez Rocks', d: ['Joshua Tree', 'Red Rock Canyon', 'Trona Pinnacles'] },
],

// ── Day 62 ──────────────────────────────────────────────────────────────
[
{ c: 'Movies', t: 1, q: 'Why does the heroine of Disney\'s Mulan disguise herself as a soldier?', a: 'To take her ailing father\'s place in the army', d: ['To win a place at the imperial court', 'To rescue her brother from prison', 'To escape an arranged marriage'] },
{ c: 'Television', t: 1, q: 'Which game show pits two families against each other guessing the most popular answers to survey questions?', a: 'Family Feud', d: ['Match Game', 'Card Sharks', 'The Joker\'s Wild'] },
{ c: 'Actors & Directors', t: 1, q: 'Which actor plays Dominic Toretto in the Fast & Furious films?', a: 'Vin Diesel', d: ['Paul Walker', 'Jason Statham', 'Tyrese Gibson'] },
{ c: 'Awards & Box Office', t: 1, q: 'Which Academy Award category honors the artists who change a performer\'s look with prosthetics and wigs?', a: 'Best Makeup and Hairstyling', d: ['Best Costume Design', 'Best Production Design', 'Best Visual Effects'] },
{ c: 'Behind the Scenes', t: 1, q: 'On a studio property, what is the back lot?', a: 'An outdoor area of standing sets and streets', d: ['The parking area for crew vehicles', 'The room where the day\'s footage is screened', 'The vault where finished prints are stored'] },

{ c: 'Movies', t: 2, q: 'What does the young pig learn to do in Babe?', a: 'Herd sheep', d: ['Pull a plow', 'Guard the henhouse', 'Race greyhounds'] },
{ c: 'Television', t: 2, q: 'Which 2001 BBC natural history series explored the oceans, from coral reefs to the deep abyss?', a: 'The Blue Planet', d: ['Life', 'Our Planet', 'Coast'] },
{ c: 'Actors & Directors', t: 2, q: 'Which English actor starred in Four Weddings and a Funeral and Notting Hill?', a: 'Hugh Grant', d: ['Colin Firth', 'Rupert Everett', 'Jeremy Northam'] },
{ c: 'Awards & Box Office', t: 2, q: 'Which satirical news program won ten consecutive Emmy Awards in the variety series category from 2003 to 2012?', a: 'The Daily Show', d: ['The Colbert Report', 'Saturday Night Live', 'Late Show with David Letterman'] },
{ c: 'Behind the Scenes', t: 2, q: 'Which trees in northern California were filmed as the forest moon in the third Star Wars film?', a: 'Redwoods', d: ['Scottish pines', 'New Zealand kauri', 'Canadian cedars'] },

{ c: 'Movies', t: 3, q: 'In which Paris quarter does the shy waitress of Amelie live and work?', a: 'Montmartre', d: ['Le Marais', 'Saint-Germain-des-Pres', 'Belleville'] },
{ c: 'Television', t: 3, q: 'Which HBO comedy followed a rising film star and the three friends from Queens who moved to Hollywood with him?', a: 'Entourage', d: ['Ballers', 'Californication', 'Episodes'] },
{ c: 'Actors & Directors', t: 3, q: 'Which dancer and actor starred in An American in Paris and Singin\' in the Rain?', a: 'Gene Kelly', d: ['Fred Astaire', 'Donald O\'Connor', 'Dan Dailey'] },
{ c: 'Awards & Box Office', t: 3, q: 'Which film won the Academy Award for Best Animated Feature for 2018?', a: 'Spider-Man: Into the Spider-Verse', d: ['Incredibles 2', 'Isle of Dogs', 'Ralph Breaks the Internet'] },
{ c: 'Behind the Scenes', t: 3, q: 'Which 1989 comic book film built its entire city on the back lot at Pinewood under designer Anton Furst?', a: 'Batman', d: ['Dick Tracy', 'The Shadow', 'The Rocketeer'] },

{ c: 'Movies', t: 4, q: 'What does the silent man walk out of in the opening of Paris, Texas?', a: 'The desert', d: ['A prison', 'A hospital ward', 'The sea'] },
{ c: 'Television', t: 4, q: 'Which panel show, beginning in 1950, had celebrity panelists question a guest to work out their unusual occupation?', a: 'What\'s My Line?', d: ['To Tell the Truth', 'I\'ve Got a Secret', 'Truth or Consequences'] },
{ c: 'Actors & Directors', t: 4, q: 'Which director made Butch Cassidy and the Sundance Kid and Slaughterhouse-Five?', a: 'George Roy Hill', d: ['Sydney Pollack', 'Arthur Penn', 'John Schlesinger'] },
{ c: 'Awards & Box Office', t: 4, q: 'Which film won the Golden Globe for Best Motion Picture Drama at the 2016 ceremony?', a: 'The Revenant', d: ['Spotlight', 'Room', 'Mad Max: Fury Road'] },
{ c: 'Behind the Scenes', t: 4, q: 'What did Gerry Anderson\'s team call the electronic marionette technique used on Thunderbirds?', a: 'Supermarionation', d: ['Animagic', 'Dynamation', 'Marionation'] },

{ c: 'Movies', t: 5, q: 'How many alternative versions of one man\'s life play out in Kieslowski\'s Blind Chance?', a: 'Three', d: ['Two', 'Four', 'Seven'] },
{ c: 'Television', t: 5, q: 'Which 1974 anime sent a sunken battleship, rebuilt as a starship, on a voyage to the planet Iscandar?', a: 'Space Battleship Yamato', d: ['Captain Harlock', 'Galaxy Express 999', 'Gatchaman'] },
{ c: 'Actors & Directors', t: 5, q: 'Which director made the 1973 film Touki Bouki?', a: 'Djibril Diop Mambety', d: ['Safi Faye', 'Moussa Sene Absa', 'Mahamat-Saleh Haroun'] },
{ c: 'Awards & Box Office', t: 5, q: 'Which film won the Sundance Grand Jury Prize for drama in 2018?', a: 'The Miseducation of Cameron Post', d: ['Blindspotting', 'Hereditary', 'Sorry to Bother You'] },
{ c: 'Behind the Scenes', t: 5, q: 'Which disused west London power station was dressed as the colony processing plant in Aliens?', a: 'Acton Lane', d: ['Battersea', 'Bankside', 'Croydon B'] },
],

// ── Day 63 ──────────────────────────────────────────────────────────────
[
{ c: 'Movies', t: 1, q: 'Which meal do the two dogs share in Disney\'s Lady and the Tramp?', a: 'Spaghetti and meatballs', d: ['A roast chicken', 'A birthday cake', 'A bowl of stew'] },
{ c: 'Television', t: 1, q: 'On Sesame Street, which grouchy green character lives in a trash can?', a: 'Oscar the Grouch', d: ['Grover', 'Snuffleupagus', 'Bert'] },
{ c: 'Actors & Directors', t: 1, q: 'Which comic actor starred in Zoolander, Meet the Parents and Night at the Museum?', a: 'Ben Stiller', d: ['Vince Vaughn', 'Luke Wilson', 'Jason Bateman'] },
{ c: 'Awards & Box Office', t: 1, q: 'Which Academy Award category honors a script invented for the screen rather than drawn from a book or play?', a: 'Best Original Screenplay', d: ['Best Adapted Screenplay', 'Best Director', 'Best Film Editing'] },
{ c: 'Behind the Scenes', t: 1, q: 'What is a laugh track?', a: 'Recorded audience laughter added to a comedy', d: ['The theme tune played over the closing credits', 'The list of songs licensed for an episode', 'A rehearsal held before the audience arrives'] },

{ c: 'Movies', t: 2, q: 'What does the Iowa farmer build in his cornfield in Field of Dreams?', a: 'A baseball diamond', d: ['A church', 'A drive-in screen', 'A running track'] },
{ c: 'Television', t: 2, q: 'Which Cartoon Network series followed three kindergarten-age superhero sisters defending the city of Townsville?', a: 'The Powerpuff Girls', d: ['Dexter\'s Laboratory', 'Kim Possible', 'Totally Spies'] },
{ c: 'Actors & Directors', t: 2, q: 'Which actor starred in The Graduate, Midnight Cowboy and Rain Man?', a: 'Dustin Hoffman', d: ['Jon Voight', 'Elliott Gould', 'Richard Dreyfuss'] },
{ c: 'Awards & Box Office', t: 2, q: 'Which 2017 Disney live-action remake grossed more than 1.2 billion dollars worldwide?', a: 'Beauty and the Beast', d: ['Cinderella', 'The Jungle Book', 'Dumbo'] },
{ c: 'Behind the Scenes', t: 2, q: 'Which HBO drama was shot on location in New Jersey rather than on a California back lot?', a: 'The Sopranos', d: ['The Wire', 'Boardwalk Empire', 'Oz'] },

{ c: 'Movies', t: 3, q: 'Where is the isolated research station in John Carpenter\'s The Thing?', a: 'Antarctica', d: ['Alaska', 'Greenland', 'Siberia'] },
{ c: 'Television', t: 3, q: 'Which BBC motoring series featured a segment called Star in a Reasonably Priced Car and an anonymous helmeted test driver?', a: 'Top Gear', d: ['Fifth Gear', 'The Grand Tour', 'Wheeler Dealers'] },
{ c: 'Actors & Directors', t: 3, q: 'Which Austro-Hungarian born Hollywood director made Sunset Boulevard, Some Like It Hot and The Apartment?', a: 'Billy Wilder', d: ['George Cukor', 'Ernst Lubitsch', 'Preston Sturges'] },
{ c: 'Awards & Box Office', t: 3, q: 'Which actor won Best Actor for Lincoln?', a: 'Daniel Day-Lewis', d: ['Hugh Jackman', 'Bradley Cooper', 'Joaquin Phoenix'] },
{ c: 'Behind the Scenes', t: 3, q: 'Which series films in Atlanta, Georgia, doubling it for a small Indiana town in the 1980s?', a: 'Stranger Things', d: ['The Americans', 'Riverdale', 'Dark'] },

{ c: 'Movies', t: 4, q: 'What is absurd about the Arpel family home in Jacques Tati\'s Mon Oncle?', a: 'It is a gadget-filled modernist house that defeats its owners', d: ['It is built on the roof of a factory', 'It is an exact copy of a palace', 'It has no windows at all'] },
{ c: 'Television', t: 4, q: 'Which British sitcom was set in a cafe in occupied France whose owner was forced to hide two British airmen?', a: '\'Allo \'Allo!', d: ['Dad\'s Army', 'It Ain\'t Half Hot Mum', 'Hi-de-Hi!'] },
{ c: 'Actors & Directors', t: 4, q: 'Which Italian actress starred in La Strada and Nights of Cabiria for her husband?', a: 'Giulietta Masina', d: ['Anna Magnani', 'Silvana Mangano', 'Alida Valli'] },
{ c: 'Awards & Box Office', t: 4, q: 'Which Spanish film won the Academy Award for Best Foreign Language Film for 2004?', a: 'The Sea Inside', d: ['Downfall', 'As It Is in Heaven', 'The Chorus'] },
{ c: 'Behind the Scenes', t: 4, q: 'Which sitcom\'s 1989 pilot first aired under a longer title containing the word Chronicles?', a: 'Seinfeld', d: ['Mad About You', 'The Larry Sanders Show', 'Newhart'] },

{ c: 'Movies', t: 5, q: 'How many ghost stories make up Masaki Kobayashi\'s Kwaidan?', a: 'Four', d: ['Two', 'Three', 'Six'] },
{ c: 'Television', t: 5, q: 'Under what title did the BBC broadcast its annual strand of M. R. James adaptations and other supernatural dramas in the 1970s?', a: 'A Ghost Story for Christmas', d: ['Dead of Night', 'Beasts', 'Shadows'] },
{ c: 'Actors & Directors', t: 5, q: 'Which former Pop Will Eat Itself musician scored Requiem for a Dream and Black Swan?', a: 'Clint Mansell', d: ['Jonny Greenwood', 'Mica Levi', 'Cliff Martinez'] },
{ c: 'Awards & Box Office', t: 5, q: 'Which film took the Golden Lion at Venice in 2017?', a: 'The Shape of Water', d: ['Three Billboards Outside Ebbing, Missouri', 'Foxtrot', 'Sweet Country'] },
{ c: 'Behind the Scenes', t: 5, q: 'Which series had extra scenes shot so its pilot could be sold as a self-contained film on European home video?', a: 'Twin Peaks', d: ['The X-Files', 'Wild Palms', 'American Gothic'] },
],

// ── Day 64 ──────────────────────────────────────────────────────────────
[
{ c: 'Movies', t: 1, q: 'What happens to the museum exhibits after dark in Night at the Museum?', a: 'They come to life', d: ['They turn to gold', 'They vanish until dawn', 'They shrink to toy size'] },
{ c: 'Television', t: 1, q: 'Which animated series followed small blue creatures who lived in mushroom houses and were hunted by a bumbling wizard?', a: 'The Smurfs', d: ['The Snorks', 'Fraggle Rock', 'Gummi Bears'] },
{ c: 'Actors & Directors', t: 1, q: 'Which English comic actor co-created and played the near-silent character Mr. Bean?', a: 'Rowan Atkinson', d: ['Hugh Laurie', 'Stephen Fry', 'Lenny Henry'] },
{ c: 'Awards & Box Office', t: 1, q: 'Which Academy Award category rewards the recording and mixing of everything an audience hears?', a: 'Best Sound', d: ['Best Original Score', 'Best Film Editing', 'Best Visual Effects'] },
{ c: 'Behind the Scenes', t: 1, q: 'The spaceships of the 1977 Star Wars were photographed as what?', a: 'Physical models', d: ['Computer-generated images', 'Hand-drawn animation cels', 'Full-size flying craft'] },

{ c: 'Movies', t: 2, q: 'In which city do the three friends spend their stolen day off in Ferris Bueller\'s Day Off?', a: 'Chicago', d: ['Detroit', 'Boston', 'Cleveland'] },
{ c: 'Television', t: 2, q: 'Which procedural follows a team of profilers in the FBI\'s Behavioral Analysis Unit?', a: 'Criminal Minds', d: ['Cold Case', 'Without a Trace', 'Numb3rs'] },
{ c: 'Actors & Directors', t: 2, q: 'Which comedian co-created the original British version of The Office and played David Brent?', a: 'Ricky Gervais', d: ['Steve Coogan', 'Matt Lucas', 'Simon Pegg'] },
{ c: 'Awards & Box Office', t: 2, q: 'Which director won the Academy Award for Best Director for Titanic?', a: 'James Cameron', d: ['Steven Spielberg', 'Curtis Hanson', 'Gus Van Sant'] },
{ c: 'Behind the Scenes', t: 2, q: 'Which 1984 film\'s metal skeleton was realized with full-size puppets from Stan Winston\'s shop plus stop-motion models?', a: 'The Terminator', d: ['RoboCop', 'Tron', 'Westworld'] },

{ c: 'Movies', t: 3, q: 'Which ancient battle is depicted in the film 300?', a: 'Thermopylae', d: ['Marathon', 'Salamis', 'Gaugamela'] },
{ c: 'Television', t: 3, q: 'Which Australian soap opera is set in the coastal community of Summer Bay?', a: 'Home and Away', d: ['A Country Practice', 'Blue Heelers', 'SeaChange'] },
{ c: 'Actors & Directors', t: 3, q: 'Which director made 12 Angry Men, Serpico and Network?', a: 'Sidney Lumet', d: ['Alan J. Pakula', 'Norman Jewison', 'Arthur Penn'] },
{ c: 'Awards & Box Office', t: 3, q: 'Which actress won Best Actress for playing Queen Anne in a 2018 film?', a: 'Olivia Colman', d: ['Glenn Close', 'Lady Gaga', 'Melissa McCarthy'] },
{ c: 'Behind the Scenes', t: 3, q: 'Which animation technique, patented by Max Fleischer in 1917, traces live-action footage frame by frame?', a: 'Rotoscoping', d: ['Cutout animation', 'Stop motion', 'Onion skinning'] },

{ c: 'Movies', t: 4, q: 'What bargain does one stranger propose to the other in Hitchcock\'s Strangers on a Train?', a: 'That each dispose of the other\'s inconvenient relation', d: ['That they exchange passports', 'That they split a lottery ticket', 'That they trade houses for a year'] },
{ c: 'Television', t: 4, q: 'Which ITV series, beginning in 1984, satirized politicians and royalty using grotesque latex puppets?', a: 'Spitting Image', d: ['Not the Nine O\'Clock News', 'Alas Smith and Jones', 'The Comic Strip Presents'] },
{ c: 'Actors & Directors', t: 4, q: 'Which Indian star directed and headlined Pyaasa and Kaagaz Ke Phool?', a: 'Guru Dutt', d: ['Raj Kapoor', 'Dev Anand', 'Bimal Roy'] },
{ c: 'Awards & Box Office', t: 4, q: 'Which series won the Emmy for Outstanding Drama Series in 2021?', a: 'The Crown', d: ['The Mandalorian', 'Bridgerton', 'Pose'] },
{ c: 'Behind the Scenes', t: 4, q: 'Which traveling matte process, refined for Mary Poppins, used yellow lamps to separate performers from their backgrounds?', a: 'The sodium vapor process', d: ['The blue screen process', 'The Schufftan process', 'Rotoscoping'] },

{ c: 'Movies', t: 5, q: 'What is the struggling hero of the 1957 Hindi film Pyaasa?', a: 'An unrecognized poet', d: ['A railway clerk turned singer', 'A village schoolmaster', 'A painter of film posters'] },
{ c: 'Television', t: 5, q: 'Which 2002 South Korean drama about first love and amnesia in snowy Chuncheon helped launch the Korean Wave in Japan?', a: 'Winter Sonata', d: ['Autumn in My Heart', 'Full House', 'Stairway to Heaven'] },
{ c: 'Actors & Directors', t: 5, q: 'Which cinematographer shot Pather Panchali and pioneered bounce lighting on Satyajit Ray\'s films?', a: 'Subrata Mitra', d: ['Soumendu Roy', 'V. K. Murthy', 'Radhu Karmakar'] },
{ c: 'Awards & Box Office', t: 5, q: 'Which film won the Sundance Grand Jury Prize for drama in 2011?', a: 'Like Crazy', d: ['Martha Marcy May Marlene', 'Another Earth', 'Pariah'] },
{ c: 'Behind the Scenes', t: 5, q: 'Which industrial designer, credited as visual futurist, drew the vehicles and streets of Blade Runner?', a: 'Syd Mead', d: ['Ron Cobb', 'Ralph McQuarrie', 'Chris Foss'] },
],

// ── Day 65 ──────────────────────────────────────────────────────────────
[
{ c: 'Movies', t: 1, q: 'What has the little robot been left alone on Earth to do in WALL-E?', a: 'Compact trash into cubes', d: ['Water the last tree', 'Repair the satellites', 'Guard a seed vault'] },
{ c: 'Television', t: 1, q: 'In Thomas & Friends, what color is the title engine?', a: 'Blue', d: ['Green', 'Red', 'Yellow'] },
{ c: 'Actors & Directors', t: 1, q: 'Which English actor took over as Spider-Man in the 2017 film Homecoming?', a: 'Tom Holland', d: ['Andrew Garfield', 'Timothee Chalamet', 'Ezra Miller'] },
{ c: 'Awards & Box Office', t: 1, q: 'Which Pixar film about a rat who wants to cook won Best Animated Feature for 2007?', a: 'Ratatouille', d: ['Persepolis', 'Surf\'s Up', 'Bee Movie'] },
{ c: 'Behind the Scenes', t: 1, q: 'Which 1992 Disney feature let its comic star improvise so freely in the booth that the animators drew to the recordings?', a: 'Aladdin', d: ['Hercules', 'The Emperor\'s New Groove', 'Robin Hood'] },

{ c: 'Movies', t: 2, q: 'What is wrong with the man pulled from the sea at the start of The Bourne Identity?', a: 'He has no memory of who he is', d: ['He cannot speak', 'He is blind', 'He believes he is someone else\'s twin'] },
{ c: 'Television', t: 2, q: 'Which American remake of a British comedy drama follows the chaotic Gallagher family on the South Side of Chicago?', a: 'Shameless', d: ['The Middle', 'Raising Hope', 'Weeds'] },
{ c: 'Actors & Directors', t: 2, q: 'Which actress played Bella Swan in the Twilight films?', a: 'Kristen Stewart', d: ['Dakota Fanning', 'Anna Kendrick', 'Ashley Greene'] },
{ c: 'Awards & Box Office', t: 2, q: 'Which 1972 crime drama about a Mafia family won the Academy Award for Best Adapted Screenplay?', a: 'The Godfather', d: ['Cabaret', 'Sleuth', 'Deliverance'] },
{ c: 'Behind the Scenes', t: 2, q: 'Which British studio animates Wallace and Gromit in modeling clay over metal armatures?', a: 'Aardman', d: ['Laika', 'Cosgrove Hall', 'Rankin/Bass'] },

{ c: 'Movies', t: 3, q: 'What is the marshal waiting for through the morning in High Noon?', a: 'A released outlaw arriving on the train', d: ['A federal circuit judge', 'A cattle drive to pass through', 'His deputy to return from the fort'] },
{ c: 'Television', t: 3, q: 'Which animated series follows a boy raised by three magical alien guardians in Beach City?', a: 'Steven Universe', d: ['Regular Show', 'Gravity Falls', 'Over the Garden Wall'] },
{ c: 'Actors & Directors', t: 3, q: 'Which character actor played the brutal music teacher in Whiplash?', a: 'J.K. Simmons', d: ['Michael Shannon', 'Bryan Cranston', 'Ed Harris'] },
{ c: 'Awards & Box Office', t: 3, q: 'Which film won Best Picture at the ceremony held in 2025?', a: 'Anora', d: ['The Brutalist', 'Conclave', 'Emilia Perez'] },
{ c: 'Behind the Scenes', t: 3, q: 'Which 2018 animated feature deliberately varied its frame rate and added comic-book printing effects to its images?', a: 'Spider-Man: Into the Spider-Verse', d: ['The Lego Movie', 'Big Hero 6', 'Klaus'] },

{ c: 'Movies', t: 4, q: 'What happens to the politician at the rally in Costa-Gavras\'s Z?', a: 'He is struck down by a truck in a staged attack', d: ['He is arrested by the secret police', 'He collapses from poisoned wine', 'He is exiled by a court order'] },
{ c: 'Television', t: 4, q: 'Which Nickelodeon game show sent teams through a messy obstacle course and covered them in green slime?', a: 'Double Dare', d: ['Legends of the Hidden Temple', 'GUTS', 'Figure It Out'] },
{ c: 'Actors & Directors', t: 4, q: 'Which Taiwanese director made A City of Sadness, Three Times and The Assassin?', a: 'Hou Hsiao-hsien', d: ['Edward Yang', 'Tsai Ming-liang', 'Jia Zhangke'] },
{ c: 'Awards & Box Office', t: 4, q: 'Which Japanese film won the Academy Award for Best Foreign Language Film for 2008?', a: 'Departures', d: ['The Class', 'Waltz with Bashir', 'Revanche'] },
{ c: 'Behind the Scenes', t: 4, q: 'Which 1990 release was the first animated feature made entirely with a digital ink and paint system?', a: 'The Rescuers Down Under', d: ['The Little Mermaid', 'Beauty and the Beast', 'Oliver & Company'] },

{ c: 'Movies', t: 5, q: 'What are the cellmates constructing in Jacques Becker\'s Le Trou?', a: 'A tunnel through the floor of the cell', d: ['A rope from bedsheets', 'A copy of the warden\'s key', 'A radio from scrap wire'] },
{ c: 'Television', t: 5, q: 'Which 1979 BBC natural history series traced the evolution of living things across thirteen episodes?', a: 'Life on Earth', d: ['The Living Planet', 'The Trials of Life', 'Wildlife on One'] },
{ c: 'Actors & Directors', t: 5, q: 'Which Mauritanian director made Bamako and Timbuktu?', a: 'Abderrahmane Sissako', d: ['Mahamat-Saleh Haroun', 'Haile Gerima', 'Gaston Kabore'] },
{ c: 'Awards & Box Office', t: 5, q: 'Which Romanian film won the Golden Bear at Berlin in 2013?', a: 'Child\'s Pose', d: ['An Episode in the Life of an Iron Picker', 'Gloria', 'Closed Curtain'] },
{ c: 'Behind the Scenes', t: 5, q: 'Which Disney technique, built for Tarzan, let artists paint three-dimensional environments for hand-drawn characters to move through?', a: 'Deep Canvas', d: ['CAPS', 'Xerography', 'Toon shading'] },
],

// ── Day 66 ──────────────────────────────────────────────────────────────
[
{ c: 'Movies', t: 1, q: 'What kind of creature is Charlotte, who spins messages to save a pig, in Charlotte\'s Web?', a: 'A spider', d: ['A goose', 'A barn owl', 'A cricket'] },
{ c: 'Television', t: 1, q: 'Which series of animated specials features a hapless boy who never gets to kick the football and his beagle Snoopy?', a: 'Peanuts', d: ['Garfield and Friends', 'The Berenstain Bears', 'Doug'] },
{ c: 'Actors & Directors', t: 1, q: 'Which Canadian actor played Captain Kirk in the original Star Trek series?', a: 'William Shatner', d: ['Leonard Nimoy', 'Patrick Stewart', 'DeForest Kelley'] },
{ c: 'Awards & Box Office', t: 1, q: 'Which awards were presented for many years by the Hollywood Foreign Press Association?', a: 'The Golden Globe Awards', d: ['The Academy Awards', 'The Emmy Awards', 'The BAFTA Awards'] },
{ c: 'Behind the Scenes', t: 1, q: 'Which country\'s postwar neorealist filmmakers shot in real streets with many nonprofessional actors?', a: 'Italy', d: ['France', 'Germany', 'Sweden'] },

{ c: 'Movies', t: 2, q: 'What is Stitch in Disney\'s Lilo and Stitch?', a: 'An escaped alien experiment', d: ['A robot built by a scientist', 'A cursed island spirit', 'A rare species of dog'] },
{ c: 'Television', t: 2, q: 'Which animated sitcom follows a family struggling to keep a seaside hamburger restaurant open?', a: 'Bob\'s Burgers', d: ['American Dad!', 'F Is for Family', 'The Great North'] },
{ c: 'Actors & Directors', t: 2, q: 'Which English actor played Severus Snape across the Harry Potter films?', a: 'Alan Rickman', d: ['Gary Oldman', 'Ralph Fiennes', 'Jason Isaacs'] },
{ c: 'Awards & Box Office', t: 2, q: 'Which Pixar film about a robot left behind to clean up Earth won Best Animated Feature for 2008?', a: 'WALL-E', d: ['Kung Fu Panda', 'Bolt', 'Waltz with Bashir'] },
{ c: 'Behind the Scenes', t: 2, q: 'Which Japanese director shot his action with several cameras running at once and long lenses, as on Seven Samurai?', a: 'Akira Kurosawa', d: ['Yasujiro Ozu', 'Kenji Mizoguchi', 'Masaki Kobayashi'] },

{ c: 'Movies', t: 3, q: 'In which city is The Elephant Man set?', a: 'London', d: ['Manchester', 'Dublin', 'Edinburgh'] },
{ c: 'Television', t: 3, q: 'Which Doctor Who spin-off followed a secret team investigating alien activity through a rift in Cardiff?', a: 'Torchwood', d: ['The Sarah Jane Adventures', 'Class', 'Primeval'] },
{ c: 'Actors & Directors', t: 3, q: 'Which animation director made The Iron Giant, The Incredibles and Ratatouille?', a: 'Brad Bird', d: ['Pete Docter', 'Andrew Stanton', 'John Lasseter'] },
{ c: 'Awards & Box Office', t: 3, q: 'Which actress won Best Supporting Actress for The Help?', a: 'Octavia Spencer', d: ['Jessica Chastain', 'Melissa McCarthy', 'Berenice Bejo'] },
{ c: 'Behind the Scenes', t: 3, q: 'Which 1925 Soviet film contains the staircase sequence used in classrooms as the standard demonstration of montage?', a: 'Battleship Potemkin', d: ['Strike', 'October', 'Mother'] },

{ c: 'Movies', t: 4, q: 'What is hidden in the wine cellar bottles in Hitchcock\'s Notorious?', a: 'Uranium ore', d: ['Stolen diamonds', 'Microfilm', 'Counterfeit plates'] },
{ c: 'Television', t: 4, q: 'Which British sitcom followed a Home Guard platoon in the fictional coastal town of Walmington-on-Sea?', a: 'Dad\'s Army', d: ['It Ain\'t Half Hot Mum', 'Hi-de-Hi!', 'The Army Game'] },
{ c: 'Actors & Directors', t: 4, q: 'Which Radiohead guitarist scored There Will Be Blood and Phantom Thread?', a: 'Jonny Greenwood', d: ['Nicholas Britell', 'Mica Levi', 'Nick Cave'] },
{ c: 'Awards & Box Office', t: 4, q: 'Which film won the Toronto People\'s Choice Award in 2010?', a: 'The King\'s Speech', d: ['Black Swan', '127 Hours', 'Never Let Me Go'] },
{ c: 'Behind the Scenes', t: 4, q: 'Which Japanese director made a rule of placing the camera at the height of a person seated on a tatami mat?', a: 'Yasujiro Ozu', d: ['Mikio Naruse', 'Kenji Mizoguchi', 'Kon Ichikawa'] },

{ c: 'Movies', t: 5, q: 'Which mountain people\'s life is depicted in Shadows of Forgotten Ancestors?', a: 'The Hutsuls of the Carpathians', d: ['The Sami of Lapland', 'The Basques of the Pyrenees', 'The Svans of the Caucasus'] },
{ c: 'Television', t: 5, q: 'Which 2012 French series was set in a mountain town where people who had died years earlier came home alive and unchanged?', a: 'The Returned', d: ['Black Spot', 'Marianne', 'The Forest'] },
{ c: 'Actors & Directors', t: 5, q: 'Which Polish director made The Saragossa Manuscript?', a: 'Wojciech Has', d: ['Jerzy Kawalerowicz', 'Andrzej Munk', 'Tadeusz Konwicki'] },
{ c: 'Awards & Box Office', t: 5, q: 'Which film won the Sundance Grand Jury Prize for drama in 2017?', a: 'I Don\'t Feel at Home in This World Anymore', d: ['Beach Rats', 'Mudbound', 'Crown Heights'] },
{ c: 'Behind the Scenes', t: 5, q: 'Which Tarkovsky film had to be shot again after the processed negative of the first version was ruined?', a: 'Stalker', d: ['Solaris', 'Mirror', 'Nostalghia'] },
],

// ── Day 67 ──────────────────────────────────────────────────────────────
[
{ c: 'Movies', t: 1, q: 'Whose songs make up the score of the film Mamma Mia!?', a: 'ABBA', d: ['The Bee Gees', 'Queen', 'The Beach Boys'] },
{ c: 'Television', t: 1, q: 'Which cartoon sailor gains enormous strength the moment he swallows a can of spinach?', a: 'Popeye', d: ['Felix the Cat', 'Woody Woodpecker', 'Mighty Mouse'] },
{ c: 'Actors & Directors', t: 1, q: 'Which comic actor starred in Elf, Anchorman and Talladega Nights?', a: 'Will Ferrell', d: ['Jack Black', 'Owen Wilson', 'Vince Vaughn'] },
{ c: 'Awards & Box Office', t: 1, q: 'Which 2009 film set on the moon Pandora won three Academy Awards including Best Visual Effects?', a: 'Avatar', d: ['District 9', 'Star Trek', 'Transformers: Revenge of the Fallen'] },
{ c: 'Behind the Scenes', t: 1, q: 'Which 1981 adventure cut a long planned sword fight down to a few seconds because its star was unwell on the Tunisia shoot?', a: 'Raiders of the Lost Ark', d: ['Indiana Jones and the Temple of Doom', 'The Mummy', 'Romancing the Stone'] },

{ c: 'Movies', t: 2, q: 'In Pixar\'s Up, what lifts Carl Fredricksen\'s house into the sky?', a: 'Thousands of helium balloons', d: ['A passing tornado', 'A giant kite', 'A hot air balloon burner'] },
{ c: 'Television', t: 2, q: 'Which sitcom about a Chicago police officer and his family was taken over by the nerdy neighbor Steve Urkel?', a: 'Family Matters', d: ['Growing Pains', 'Perfect Strangers', 'Step by Step'] },
{ c: 'Actors & Directors', t: 2, q: 'Which actor wore the cape in the 1978 Superman and its sequels?', a: 'Christopher Reeve', d: ['Brandon Routh', 'Dean Cain', 'Kirk Alyn'] },
{ c: 'Awards & Box Office', t: 2, q: 'Which actor won Best Supporting Actor for Moonlight?', a: 'Mahershala Ali', d: ['Dev Patel', 'Michael Shannon', 'Jeff Bridges'] },
{ c: 'Behind the Scenes', t: 2, q: 'Which 1980 film made the new stabilized camera rig famous by gliding it low along hotel corridors?', a: 'The Shining', d: ['Halloween', 'The Fog', 'Poltergeist'] },

{ c: 'Movies', t: 3, q: 'Which small cars carry out the getaway through Turin in the 1969 film The Italian Job?', a: 'Mini Coopers', d: ['Fiat 500s', 'Citroen 2CVs', 'Volkswagen Beetles'] },
{ c: 'Television', t: 3, q: 'Which animated series follows twin siblings spending the summer with their great-uncle in a strange Oregon town?', a: 'Gravity Falls', d: ['Over the Garden Wall', 'Amphibia', 'The Owl House'] },
{ c: 'Actors & Directors', t: 3, q: 'Which director made Stagecoach, The Grapes of Wrath and The Searchers?', a: 'John Ford', d: ['Howard Hawks', 'Raoul Walsh', 'Anthony Mann'] },
{ c: 'Awards & Box Office', t: 3, q: 'Which 2019 animated sequel grossed more than 1.4 billion dollars worldwide?', a: 'Frozen II', d: ['Toy Story 4', 'Aladdin', 'The Secret Life of Pets 2'] },
{ c: 'Behind the Scenes', t: 3, q: 'Which graphic designer created the title sequences for The Man with the Golden Arm and Vertigo?', a: 'Saul Bass', d: ['Maurice Binder', 'Pablo Ferro', 'Kyle Cooper'] },

{ c: 'Movies', t: 4, q: 'What does the boy do for the Soviet army in Tarkovsky\'s Ivan\'s Childhood?', a: 'He works as a scout behind enemy lines', d: ['He drives an ambulance', 'He plays in the regimental band', 'He forges identity papers'] },
{ c: 'Television', t: 4, q: 'Which crime drama follows a detective inspector solving murders in the northernmost islands of Scotland?', a: 'Shetland', d: ['Vera', 'Hinterland', 'The Loch'] },
{ c: 'Actors & Directors', t: 4, q: 'Which director made Johnny Guitar and Rebel Without a Cause?', a: 'Nicholas Ray', d: ['Samuel Fuller', 'Douglas Sirk', 'Budd Boetticher'] },
{ c: 'Awards & Box Office', t: 4, q: 'Which film won the Golden Globe for Best Motion Picture Drama at the 2011 ceremony?', a: 'The Social Network', d: ['The King\'s Speech', 'Black Swan', 'The Fighter'] },
{ c: 'Behind the Scenes', t: 4, q: 'Which 2008 film aged its lead backwards by mapping a digital head onto the bodies of other performers?', a: 'The Curious Case of Benjamin Button', d: ['Tron: Legacy', 'The Irishman', 'Ender\'s Game'] },

{ c: 'Movies', t: 5, q: 'What do the two young women spend Vera Chytilova\'s Daisies doing?', a: 'Playing destructive pranks and wrecking a banquet', d: ['Hitchhiking to the Adriatic', 'Rehearsing a play they never perform', 'Writing letters to imaginary suitors'] },
{ c: 'Television', t: 5, q: 'Which 1977 BBC drama followed a Belgian escape line smuggling downed Allied airmen out of occupied Europe?', a: 'Secret Army', d: ['Colditz', 'Enemy at the Door', 'Wish Me Luck'] },
{ c: 'Actors & Directors', t: 5, q: 'Which Hungarian born composer scored Double Indemnity and Ben-Hur?', a: 'Miklos Rozsa', d: ['Max Steiner', 'Alfred Newman', 'Dimitri Tiomkin'] },
{ c: 'Awards & Box Office', t: 5, q: 'Which documentary took the Golden Lion at Venice in 2013?', a: 'Sacro GRA', d: ['Philomena', 'Under the Skin', 'Tom at the Farm'] },
{ c: 'Behind the Scenes', t: 5, q: 'Which 2007 period thriller did David Fincher shoot on the Thomson Viper digital camera rather than film?', a: 'Zodiac', d: ['Se7en', 'Panic Room', 'The Game'] },
],

// ── Day 68 ──────────────────────────────────────────────────────────────
[
{ c: 'Movies', t: 1, q: 'What is unusual about Rapunzel\'s hair in Disney\'s Tangled?', a: 'It is enormously long and glows with healing power', d: ['It changes color with her mood', 'It turns to gold thread at night', 'It can be understood as speech'] },
{ c: 'Television', t: 1, q: 'In Stranger Things, what is the name of the dark parallel dimension that mirrors the town above it?', a: 'the Upside Down', d: ['the Nether', 'the Void', 'the Hollow'] },
{ c: 'Actors & Directors', t: 1, q: 'Which Scottish actor starred in Highlander, The Hunt for Red October and Indiana Jones and the Last Crusade?', a: 'Sean Connery', d: ['Michael Caine', 'Roger Moore', 'Christopher Plummer'] },
{ c: 'Awards & Box Office', t: 1, q: 'Which 1992 Disney animated film produced the Best Original Song winner A Whole New World?', a: 'Aladdin', d: ['Beauty and the Beast', 'The Little Mermaid', 'Pocahontas'] },
{ c: 'Behind the Scenes', t: 1, q: 'The filmmakers chose a DeLorean as the time machine in a 1985 comedy partly because its doors would make witnesses think what?', a: 'That it was a spacecraft', d: ['That it was a police car', 'That it was a submarine', 'That it was a parade float'] },

{ c: 'Movies', t: 2, q: 'Where has Buddy grown up before he travels to New York in Elf?', a: 'The North Pole', d: ['A Vermont toy factory', 'An island off Iceland', 'A department store basement'] },
{ c: 'Television', t: 2, q: 'Which sitcom followed a Long Island sportswriter whose parents lived across the street and walked in whenever they liked?', a: 'Everybody Loves Raymond', d: ['The King of Queens', 'According to Jim', 'Yes, Dear'] },
{ c: 'Actors & Directors', t: 2, q: 'Which actor starred in Field of Dreams and directed himself in Dances with Wolves?', a: 'Kevin Costner', d: ['Robert Redford', 'Mel Gibson', 'Kevin Kline'] },
{ c: 'Awards & Box Office', t: 2, q: 'Which actress won Best Actress for Walk the Line?', a: 'Reese Witherspoon', d: ['Felicity Huffman', 'Charlize Theron', 'Keira Knightley'] },
{ c: 'Behind the Scenes', t: 2, q: 'Which member of a production team finds and clears the already recorded songs a film uses?', a: 'The music supervisor', d: ['The composer', 'The sound designer', 'The foley artist'] },

{ c: 'Movies', t: 3, q: 'Which Chicago gangster do the federal agents pursue in The Untouchables?', a: 'Al Capone', d: ['Bugsy Siegel', 'Dutch Schultz', 'Lucky Luciano'] },
{ c: 'Television', t: 3, q: 'Which BBC comedy follows a London woman running a guinea-pig-themed cafe who breaks off mid-scene to talk to the camera?', a: 'Fleabag', d: ['Chewing Gum', 'Motherland', 'Catastrophe'] },
{ c: 'Actors & Directors', t: 3, q: 'Which actor starred in The Big Chill, The Fly and Independence Day?', a: 'Jeff Goldblum', d: ['Richard Dreyfuss', 'Jeff Daniels', 'John Lithgow'] },
{ c: 'Awards & Box Office', t: 3, q: 'Which director won the Academy Award for Best Director for Life of Pi?', a: 'Ang Lee', d: ['Steven Spielberg', 'David O. Russell', 'Michael Haneke'] },
{ c: 'Behind the Scenes', t: 3, q: 'Which 1960 feature did Hitchcock shoot fast and in black and white using the crew from his television series?', a: 'Psycho', d: ['The Birds', 'Marnie', 'Topaz'] },

{ c: 'Movies', t: 4, q: 'What is the boarding school concealing in Louis Malle\'s Au revoir les enfants?', a: 'Jewish boys enrolled under false names', d: ['A cache of resistance weapons', 'A clandestine printing press', 'An escaped prisoner in the bell tower'] },
{ c: 'Television', t: 4, q: 'Which anime follows two brothers who lose parts of their bodies in a forbidden attempt to bring their mother back?', a: 'Fullmetal Alchemist', d: ['Hunter x Hunter', 'Soul Eater', 'Blue Exorcist'] },
{ c: 'Actors & Directors', t: 4, q: 'Which Hong Kong director made A Better Tomorrow, The Killer and Hard Boiled?', a: 'John Woo', d: ['Tsui Hark', 'Ringo Lam', 'Johnnie To'] },
{ c: 'Awards & Box Office', t: 4, q: 'Which series won the Emmy for Outstanding Comedy Series at the 75th Primetime Emmy Awards?', a: 'The Bear', d: ['Abbott Elementary', 'Ted Lasso', 'Only Murders in the Building'] },
{ c: 'Behind the Scenes', t: 4, q: 'Which 1959 comedy was shot in black and white after color tests made the leads\' makeup look wrong?', a: 'Some Like It Hot', d: ['The Apartment', 'Sabrina', 'Bell, Book and Candle'] },

{ c: 'Movies', t: 5, q: 'What act gets the tenant family evicted in Ermanno Olmi\'s The Tree of Wooden Clogs?', a: 'The father cuts down one of the landlord\'s trees to carve a shoe', d: ['The father hides a sick calf from the steward', 'The mother sells grain reserved for the landlord', 'The son refuses to work the harvest'] },
{ c: 'Television', t: 5, q: 'Which 2015 Norwegian political thriller imagined Russia taking control of the country to restart its oil production?', a: 'Occupied', d: ['Lilyhammer', 'Mammon', 'Nobel'] },
{ c: 'Actors & Directors', t: 5, q: 'Which Japanese director made Harakiri and The Human Condition trilogy?', a: 'Masaki Kobayashi', d: ['Kon Ichikawa', 'Keisuke Kinoshita', 'Hiroshi Teshigahara'] },
{ c: 'Awards & Box Office', t: 5, q: 'Which film won the Sundance Grand Jury Prize for drama in 2016?', a: 'The Birth of a Nation', d: ['Manchester by the Sea', 'Swiss Army Man', 'Morris from America'] },
{ c: 'Behind the Scenes', t: 5, q: 'Which live-action cinematographer served as a lighting consultant on WALL-E and How to Train Your Dragon?', a: 'Roger Deakins', d: ['Emmanuel Lubezki', 'Janusz Kaminski', 'Robert Richardson'] },
],

// ── Day 69 ──────────────────────────────────────────────────────────────
[
{ c: 'Movies', t: 1, q: 'What kind of creature is Sebastian in Disney\'s The Little Mermaid?', a: 'A crab', d: ['A seahorse', 'A lobster', 'A turtle'] },
{ c: 'Television', t: 1, q: 'Which 1960s sitcom featured a family of friendly monsters living at 1313 Mockingbird Lane?', a: 'The Munsters', d: ['The Addams Family', 'The Ghost & Mrs. Muir', 'My Favorite Martian'] },
{ c: 'Actors & Directors', t: 1, q: 'Which actress played the newspaper columnist Carrie Bradshaw on television?', a: 'Sarah Jessica Parker', d: ['Kim Cattrall', 'Cynthia Nixon', 'Kristin Davis'] },
{ c: 'Awards & Box Office', t: 1, q: 'Which awards are presented each year by the Television Academy?', a: 'The Emmy Awards', d: ['The Golden Globe Awards', 'The Peabody Awards', 'The Tony Awards'] },
{ c: 'Behind the Scenes', t: 1, q: 'What does a storyboard show?', a: 'The planned shots of a scene drawn in order', d: ['Every prop the scene requires', 'The order the scenes will be shot in', 'The dialogue written out for the cast'] },

{ c: 'Movies', t: 2, q: 'Which country has the bear traveled from in Paddington?', a: 'Peru', d: ['Brazil', 'Canada', 'India'] },
{ c: 'Television', t: 2, q: 'Which 1980s prime-time soap followed the Carrington family and their Denver oil fortune?', a: 'Dynasty', d: ['Falcon Crest', 'Knots Landing', 'Flamingo Road'] },
{ c: 'Actors & Directors', t: 2, q: 'Which English actor played the stammering king in a 2010 film and Mark Darcy in the Bridget Jones films?', a: 'Colin Firth', d: ['Hugh Grant', 'Ralph Fiennes', 'Rufus Sewell'] },
{ c: 'Awards & Box Office', t: 2, q: 'Which actor won Best Actor for One Flew Over the Cuckoo\'s Nest?', a: 'Jack Nicholson', d: ['Al Pacino', 'Walter Matthau', 'James Whitmore'] },
{ c: 'Behind the Scenes', t: 2, q: 'Which 1999 release was marketed as if its footage had been recovered rather than staged?', a: 'The Blair Witch Project', d: ['Paranormal Activity', 'Cloverfield', 'The Last Broadcast'] },

{ c: 'Movies', t: 3, q: 'In which city\'s favelas is City of God set?', a: 'Rio de Janeiro', d: ['Sao Paulo', 'Salvador', 'Recife'] },
{ c: 'Television', t: 3, q: 'Which ITV soap opera, beginning in 1972, is set among the farming families of a fictional Yorkshire village?', a: 'Emmerdale', d: ['Coronation Street', 'Hollyoaks', 'Doctors'] },
{ c: 'Actors & Directors', t: 3, q: 'Which actor starred in The French Connection, Marathon Man and All That Jazz?', a: 'Roy Scheider', d: ['Cliff Robertson', 'Charles Grodin', 'Robert Duvall'] },
{ c: 'Awards & Box Office', t: 3, q: 'Which film won the Academy Award for Best Animated Feature for 2021?', a: 'Encanto', d: ['Luca', 'Raya and the Last Dragon', 'The Mitchells vs. the Machines'] },
{ c: 'Behind the Scenes', t: 3, q: 'Which 1996 crime film opens with an on-screen claim of true events that its writers had entirely invented?', a: 'Fargo', d: ['Zodiac', 'A Simple Plan', 'The Ice Harvest'] },

{ c: 'Movies', t: 4, q: 'What do the townspeople row out at night to see in Fellini\'s Amarcord?', a: 'A great ocean liner passing offshore', d: ['A comet over the bay', 'A burning lighthouse', 'A whale washed onto a sandbar'] },
{ c: 'Television', t: 4, q: 'Which 1990s series followed a Baltimore murder squad and the board where open cases were written in red?', a: 'Homicide: Life on the Street', d: ['NYPD Blue', 'Third Watch', 'Crime Story'] },
{ c: 'Actors & Directors', t: 4, q: 'Which comedian turned director made A New Leaf, The Heartbreak Kid and Mikey and Nicky?', a: 'Elaine May', d: ['Joan Micklin Silver', 'Claudia Weill', 'Penny Marshall'] },
{ c: 'Awards & Box Office', t: 4, q: 'Which 1998 disaster film was the top-grossing release worldwide that year?', a: 'Armageddon', d: ['Saving Private Ryan', 'There\'s Something About Mary', 'Godzilla'] },
{ c: 'Behind the Scenes', t: 4, q: 'Which 2010 film used a body double and digital face replacement so one actor could play a pair of twins?', a: 'The Social Network', d: ['The Prestige', 'Adaptation', 'Legend'] },

{ c: 'Movies', t: 5, q: 'In which arid Brazilian region is Glauber Rocha\'s Black God, White Devil set?', a: 'The sertao', d: ['The Amazon basin', 'The Pantanal', 'The Atlantic coast plantations'] },
{ c: 'Television', t: 5, q: 'Which Israeli series, built entirely from a psychotherapist and his patients talking in one room, was remade in country after country around the world?', a: 'BeTipul', d: ['Srugim', 'Shtisel', 'Fauda'] },
{ c: 'Actors & Directors', t: 5, q: 'Which actress wrote, directed and starred in Wanda in 1970?', a: 'Barbara Loden', d: ['Shirley Clarke', 'Karen Black', 'Tuesday Weld'] },
{ c: 'Awards & Box Office', t: 5, q: 'Which Italian film won the Golden Bear at Berlin in 2012?', a: 'Caesar Must Die', d: ['Barbara', 'Just the Wind', 'A Royal Affair'] },
{ c: 'Behind the Scenes', t: 5, q: 'Which 2018 film was shot in story order with the cast given their lines only on the day of filming?', a: 'Roma', d: ['Cold War', 'Shoplifters', 'Burning'] },
],

// ── Day 70 ──────────────────────────────────────────────────────────────
[
{ c: 'Movies', t: 1, q: 'What is the name of Dorothy\'s little dog in The Wizard of Oz?', a: 'Toto', d: ['Rex', 'Bingo', 'Scamp'] },
{ c: 'Television', t: 1, q: 'Which Looney Tunes character greets his pursuers with the line "What\'s up, Doc?"', a: 'Bugs Bunny', d: ['Daffy Duck', 'Porky Pig', 'Elmer Fudd'] },
{ c: 'Actors & Directors', t: 1, q: 'Which Canadian actor plays the wisecracking mercenary in the Deadpool films?', a: 'Ryan Reynolds', d: ['Chris Evans', 'Channing Tatum', 'Ryan Gosling'] },
{ c: 'Awards & Box Office', t: 1, q: 'Which 1972 Mafia drama was the top-grossing release in North America that year?', a: 'The Godfather', d: ['The Poseidon Adventure', 'Deliverance', 'Cabaret'] },
{ c: 'Behind the Scenes', t: 1, q: 'What happens at a table read?', a: 'The cast reads the script aloud together', d: ['The crew reviews the previous day\'s footage', 'The director chooses the camera lenses', 'The composer plays the score for the studio'] },

{ c: 'Movies', t: 2, q: 'What is the girls\' clique that Sandy is drawn into in Grease called?', a: 'The Pink Ladies', d: ['The T-Birds', 'The Bobby Soxers', 'The Rydell Belles'] },
{ c: 'Television', t: 2, q: 'Which sitcom was narrated straight to camera by a gifted boy with two older brothers and a younger one in a chaotic family?', a: 'Malcolm in the Middle', d: ['The Middle', 'Even Stevens', 'Grounded for Life'] },
{ c: 'Actors & Directors', t: 2, q: 'Which actor starred in The Hangover films and directed a 2018 version of A Star Is Born?', a: 'Bradley Cooper', d: ['Jake Gyllenhaal', 'Ed Helms', 'Zach Galifianakis'] },
{ c: 'Awards & Box Office', t: 2, q: 'Which 2024 Pixar sequel was the top-grossing film worldwide that year?', a: 'Inside Out 2', d: ['Deadpool & Wolverine', 'Despicable Me 4', 'Wicked'] },
{ c: 'Behind the Scenes', t: 2, q: 'Which historical drama series replaces its entire principal cast every two seasons so the actors match the characters\' ages?', a: 'The Crown', d: ['Downton Abbey', 'Victoria', 'Succession'] },

{ c: 'Movies', t: 3, q: 'What must the agent avoid touching while suspended into the vault in Mission: Impossible?', a: 'The pressure-sensitive floor', d: ['A tripwire across the door', 'The ceiling sprinklers', 'A rotating camera mount'] },
{ c: 'Television', t: 3, q: 'Which long-running anime follows a crew of pirates led by a rubber-limbed boy in a straw hat searching for a legendary treasure?', a: 'One Piece', d: ['Naruto', 'Bleach', 'Fairy Tail'] },
{ c: 'Actors & Directors', t: 3, q: 'Which director made Selma and the documentary 13th?', a: 'Ava DuVernay', d: ['Dee Rees', 'Ryan Coogler', 'Gina Prince-Bythewood'] },
{ c: 'Awards & Box Office', t: 3, q: 'Which 2013 space survival film won seven Academy Awards including Best Director?', a: 'Gravity', d: ['Her', 'Captain Phillips', 'American Hustle'] },
{ c: 'Behind the Scenes', t: 3, q: 'Which crime drama shot on location in Baltimore and filled many small roles with people from the city?', a: 'The Wire', d: ['The Shield', 'Southland', 'NYPD Blue'] },

{ c: 'Movies', t: 4, q: 'What is the profession of the woman at the center of Naruse\'s When a Woman Ascends the Stairs?', a: 'A Ginza bar hostess', d: ['A department store buyer', 'A schoolteacher in Osaka', 'A radio announcer'] },
{ c: 'Television', t: 4, q: 'Which Nordic crime series opens with a body left exactly on the border line halfway across a long road crossing between two countries?', a: 'The Bridge', d: ['The Killing', 'Bordertown', 'Beck'] },
{ c: 'Actors & Directors', t: 4, q: 'Which American director made Killer of Sheep while a student at UCLA?', a: 'Charles Burnett', d: ['Julie Dash', 'Billy Woodberry', 'Haile Gerima'] },
{ c: 'Awards & Box Office', t: 4, q: 'Which studio handled the North American release of Titanic in 1997?', a: 'Paramount', d: ['Universal', 'Warner Bros.', 'Columbia'] },
{ c: 'Behind the Scenes', t: 4, q: 'Which 2001 war miniseries built its European villages at a former airfield in Hertfordshire, England?', a: 'Band of Brothers', d: ['The Pacific', 'Generation Kill', 'Rome'] },

{ c: 'Movies', t: 5, q: 'What keeps arriving anonymously at the family\'s door in Michael Haneke\'s Cache?', a: 'Videos of their own house, filmed from the street', d: ['Photographs of a stranger\'s funeral', 'Recordings of their own voices', 'Drawings of the house in miniature'] },
{ c: 'Television', t: 5, q: 'Which 1993 ITV series followed an overweight, chain-smoking Manchester criminal psychologist who consulted for the police?', a: 'Cracker', d: ['Prime Suspect', 'Wire in the Blood', 'Touching Evil'] },
{ c: 'Actors & Directors', t: 5, q: 'Which Polish composer wrote the music for The Double Life of Veronique and the Three Colors films?', a: 'Zbigniew Preisner', d: ['Wojciech Kilar', 'Jan A. P. Kaczmarek', 'Michal Lorenc'] },
{ c: 'Awards & Box Office', t: 5, q: 'Which film won the Sundance Grand Jury Prize for drama in 2005?', a: 'Forty Shades of Blue', d: ['Hustle & Flow', 'Junebug', 'The Squid and the Whale'] },
{ c: 'Behind the Scenes', t: 5, q: 'Which hospital drama broadcast an episode performed live for both American coasts in 1997?', a: 'ER', d: ['Chicago Hope', 'St. Elsewhere', 'Third Watch'] },
],

// ── Day 71 ──────────────────────────────────────────────────────────────
[
{ c: 'Movies', t: 1, q: 'What was the Beast before the enchantment in Disney\'s Beauty and the Beast?', a: 'A prince', d: ['A woodcutter', 'A merchant', 'A knight'] },
{ c: 'Television', t: 1, q: 'Which animated series follows Emily Elizabeth and her enormous scarlet pet on Birdwell Island?', a: 'Clifford the Big Red Dog', d: ['Arthur', 'Franklin', 'Little Bear'] },
{ c: 'Actors & Directors', t: 1, q: 'Which actor plays Star-Lord in the Guardians of the Galaxy films?', a: 'Chris Pratt', d: ['Chris Evans', 'Chris Hemsworth', 'Chris Pine'] },
{ c: 'Awards & Box Office', t: 1, q: 'The Goya Awards are the national film awards of which country?', a: 'Spain', d: ['Portugal', 'Mexico', 'Argentina'] },
{ c: 'Behind the Scenes', t: 1, q: 'What is an outtake?', a: 'A take that was not used in the finished film', d: ['A scene filmed by the second unit', 'A publicity photograph taken on set', 'A ticket sold to a preview screening'] },

{ c: 'Movies', t: 2, q: 'What makes the young emperor penguin different from the others in Happy Feet?', a: 'He tap dances instead of singing', d: ['He cannot swim', 'He is born pure black', 'He can talk to seals'] },
{ c: 'Television', t: 2, q: 'Which long-running series invites members of the public to bring heirlooms to be valued by experts at stately homes?', a: 'Antiques Roadshow', d: ['Bargain Hunt', 'Flog It!', 'Cash in the Attic'] },
{ c: 'Actors & Directors', t: 2, q: 'Which English actor played the misanthropic diagnostician in the medical drama House?', a: 'Hugh Laurie', d: ['Rowan Atkinson', 'Damian Lewis', 'Dominic West'] },
{ c: 'Awards & Box Office', t: 2, q: 'Which actor won Best Actor for playing the leader of India\'s independence movement in a 1982 film?', a: 'Ben Kingsley', d: ['Dustin Hoffman', 'Paul Newman', 'Peter O\'Toole'] },
{ c: 'Behind the Scenes', t: 2, q: 'Which Wyoming landmark did Steven Spielberg use as the meeting place in his 1977 film about visitors?', a: 'Devils Tower', d: ['Monument Valley', 'Mount Rushmore', 'Shiprock'] },

{ c: 'Movies', t: 3, q: 'How do the thieves address one another in Reservoir Dogs?', a: 'By color-coded aliases', d: ['By numbers one through six', 'By the names of playing cards', 'By their old army nicknames'] },
{ c: 'Television', t: 3, q: 'Which BBC series follows a brilliant, self-destructive London murder detective and the killer he cannot convict?', a: 'Luther', d: ['Marcella', 'The Fall', 'Whitechapel'] },
{ c: 'Actors & Directors', t: 3, q: 'Which actor played the Dude in The Big Lebowski and Rooster Cogburn in the 2010 True Grit?', a: 'Jeff Bridges', d: ['John Goodman', 'Kurt Russell', 'Nick Nolte'] },
{ c: 'Awards & Box Office', t: 3, q: 'Which 2017 Star Wars sequel was the top-grossing release in North America that year?', a: 'Star Wars: The Last Jedi', d: ['Beauty and the Beast', 'Wonder Woman', 'Guardians of the Galaxy Vol. 2'] },
{ c: 'Behind the Scenes', t: 3, q: 'Which 2012 Bond film shot its Highlands sequences in Glen Coe, Scotland?', a: 'Skyfall', d: ['Spectre', 'Casino Royale', 'GoldenEye'] },

{ c: 'Movies', t: 4, q: 'Which kind of American film does the young thief imitate throughout Godard\'s Breathless?', a: 'The Hollywood gangster picture', d: ['The screwball comedy', 'The western', 'The musical'] },
{ c: 'Television', t: 4, q: 'Which British sitcom was set in a chaotic secondhand bookshop whose owner hated customers?', a: 'Black Books', d: ['Spaced', 'Green Wing', 'Nathan Barley'] },
{ c: 'Actors & Directors', t: 4, q: 'Which Scottish director made Ratcatcher, Morvern Callar and You Were Never Really Here?', a: 'Lynne Ramsay', d: ['Andrea Arnold', 'Clio Barnard', 'Carol Morley'] },
{ c: 'Awards & Box Office', t: 4, q: 'Which Italian film won the Academy Award for Best Foreign Language Film for 2013?', a: 'The Great Beauty', d: ['The Hunt', 'The Broken Circle Breakdown', 'Omar'] },
{ c: 'Behind the Scenes', t: 4, q: 'In which Iowa town was a cornfield turned into a baseball diamond for a 1989 film and kept afterwards as an attraction?', a: 'Dyersville', d: ['Ames', 'Marshalltown', 'Winterset'] },

{ c: 'Movies', t: 5, q: 'What is closing on the last night of Tsai Ming-liang\'s Goodbye, Dragon Inn?', a: 'An old movie theater', d: ['A night market', 'A puppet playhouse', 'A railway station'] },
{ c: 'Television', t: 5, q: 'Which 1992 Venezuelan telenovela about a woman raised by travelers was dubbed into dozens of languages and shown in more than a hundred countries?', a: 'Kassandra', d: ['Cristal', 'Topacio', 'La Dama de Rosa'] },
{ c: 'Actors & Directors', t: 5, q: 'Which cinematographer shot Do the Right Thing and Malcolm X before directing Juice?', a: 'Ernest Dickerson', d: ['Arthur Jafa', 'Malik Sayeed', 'Bradford Young'] },
{ c: 'Awards & Box Office', t: 5, q: 'Which Bosnian film won the Golden Bear at Berlin in 2006?', a: 'Grbavica', d: ['The Road to Guantanamo', 'Offside', 'Requiem'] },
{ c: 'Behind the Scenes', t: 5, q: 'Which Aberdeenshire village provided the harbor scenes for the fictional town in Local Hero?', a: 'Pennan', d: ['Plockton', 'Crail', 'Portsoy'] },
],

// ── Day 72 ──────────────────────────────────────────────────────────────
[
{ c: 'Movies', t: 1, q: 'Where does the Genie live in Disney\'s Aladdin?', a: 'In a lamp', d: ['In a ring', 'In a bottle', 'In a mirror'] },
{ c: 'Television', t: 1, q: 'In Friends, which character greets people with the line "How you doin\'?"', a: 'Joey Tribbiani', d: ['Chandler Bing', 'Ross Geller', 'Gunther'] },
{ c: 'Actors & Directors', t: 1, q: 'Which Austrian born bodybuilder turned actor starred in Commando, Predator and Kindergarten Cop?', a: 'Arnold Schwarzenegger', d: ['Sylvester Stallone', 'Dolph Lundgren', 'Steven Seagal'] },
{ c: 'Awards & Box Office', t: 1, q: 'The Filmfare Awards honor films made in which country?', a: 'India', d: ['Pakistan', 'Indonesia', 'Egypt'] },
{ c: 'Behind the Scenes', t: 1, q: 'What is a screen test?', a: 'A filmed audition to see how a performer looks on camera', d: ['A trial projection to check a print', 'A preview screening held for critics', 'A rehearsal held without any cameras'] },

{ c: 'Movies', t: 2, q: 'What chore does Mr. Miyagi set the boy that turns out to be training in The Karate Kid?', a: 'Waxing cars', d: ['Chopping firewood', 'Rowing a boat', 'Carrying water uphill'] },
{ c: 'Television', t: 2, q: 'Which PBS animated series follows a bespectacled aardvark and his friends in Elwood City?', a: 'Arthur', d: ['Franklin', 'Little Bear', 'Caillou'] },
{ c: 'Actors & Directors', t: 2, q: 'Which child actor played the boy left behind in Home Alone?', a: 'Macaulay Culkin', d: ['Elijah Wood', 'Haley Joel Osment', 'Jonathan Lipnicki'] },
{ c: 'Awards & Box Office', t: 2, q: 'Which actor won Best Supporting Actor for No Country for Old Men?', a: 'Javier Bardem', d: ['Tom Wilkinson', 'Hal Holbrook', 'Casey Affleck'] },
{ c: 'Behind the Scenes', t: 2, q: 'Which 1993 comedy put its star into hours of old-age prosthetics every shooting day?', a: 'Mrs. Doubtfire', d: ['Tootsie', 'The Nutty Professor', 'Big Momma\'s House'] },

{ c: 'Movies', t: 3, q: 'Which group of astronauts does The Right Stuff follow?', a: 'The Mercury Seven', d: ['The Apollo 11 crew', 'The Gemini twelve', 'The first space shuttle crew'] },
{ c: 'Television', t: 3, q: 'Which drama follows the crew of Firehouse 51 and is the first of a linked set of series set in the same city?', a: 'Chicago Fire', d: ['Rescue Me', 'Third Watch', 'Station 19'] },
{ c: 'Actors & Directors', t: 3, q: 'Which actor played Obi-Wan Kenobi in the 1977 Star Wars?', a: 'Alec Guinness', d: ['Peter Cushing', 'Christopher Lee', 'John Gielgud'] },
{ c: 'Awards & Box Office', t: 3, q: 'Which 1984 supernatural comedy was nominated for Academy Awards for both its visual effects and its title song?', a: 'Ghostbusters', d: ['Beverly Hills Cop', 'Indiana Jones and the Temple of Doom', 'Gremlins'] },
{ c: 'Behind the Scenes', t: 3, q: 'Which 1956 epic parted a sea by pouring water into a tank and running the film backwards?', a: 'The Ten Commandments', d: ['Quo Vadis', 'Samson and Delilah', 'The Robe'] },

{ c: 'Movies', t: 4, q: 'What does the journalist do in the North African hotel in Antonioni\'s The Passenger?', a: 'He takes on the identity of a dead man', d: ['He burns his own film reels', 'He confesses to a crime he did not commit', 'He sells his passport to a smuggler'] },
{ c: 'Television', t: 4, q: 'Which German series follows a police inspector working in the nightclubs and newsrooms of Weimar-era 1929?', a: 'Babylon Berlin', d: ['Charite', 'Ku damm 56', 'Generation War'] },
{ c: 'Actors & Directors', t: 4, q: 'Which French actress starred in Hiroshima Mon Amour?', a: 'Emmanuelle Riva', d: ['Delphine Seyrig', 'Anouk Aimee', 'Stephane Audran'] },
{ c: 'Awards & Box Office', t: 4, q: 'Which accounting firm and its predecessor have counted the Academy Award ballots since 1935?', a: 'PricewaterhouseCoopers', d: ['Deloitte', 'Ernst & Young', 'KPMG'] },
{ c: 'Behind the Scenes', t: 4, q: 'The long wedding sequence that opens the 1972 Corleone film was shot in which New York borough?', a: 'Staten Island', d: ['Queens', 'The Bronx', 'Brooklyn'] },

{ c: 'Movies', t: 5, q: 'What are the giant blue-skinned rulers called in Rene Laloux\'s animated world of Ygam?', a: 'Draags', d: ['Traalks', 'Vorls', 'Skerns'] },
{ c: 'Television', t: 5, q: 'Which 1983 NHK morning serial about a poor girl sent away to work in Meiji-era Japan became an enormous export success?', a: 'Oshin', d: ['Ohanahan', 'Amachan', 'Hanako to Anne'] },
{ c: 'Actors & Directors', t: 5, q: 'Which Odessa based Soviet director made The Asthenic Syndrome?', a: 'Kira Muratova', d: ['Larisa Shepitko', 'Aleksei German', 'Alexander Sokurov'] },
{ c: 'Awards & Box Office', t: 5, q: 'Which film won the Sundance Grand Jury Prize for drama in 2006?', a: 'Quinceanera', d: ['Little Miss Sunshine', 'Half Nelson', 'Right at Your Door'] },
{ c: 'Behind the Scenes', t: 5, q: 'Which flying effect system, pairing a zoom lens with a front projector, was devised for the 1978 Superman?', a: 'Zoptic', d: ['Introvision', 'Dynamation', 'Vistavision'] },
],

// ── Day 73 ──────────────────────────────────────────────────────────────
[
{ c: 'Movies', t: 1, q: 'Which weapon is Merida skilled with in Pixar\'s Brave?', a: 'A bow and arrow', d: ['A broadsword', 'A sling', 'A spear'] },
{ c: 'Television', t: 1, q: 'In Breaking Bad, what alias does Walter White adopt in the drug trade?', a: 'Heisenberg', d: ['Bohr', 'Schrodinger', 'Fermi'] },
{ c: 'Actors & Directors', t: 1, q: 'Which actor, once a Boston rapper, starred in Boogie Nights, The Departed and Ted?', a: 'Mark Wahlberg', d: ['Ice Cube', 'LL Cool J', 'Donnie Wahlberg'] },
{ c: 'Awards & Box Office', t: 1, q: 'What does it mean when a film is given a wide release?', a: 'It opens in a large number of cinemas at once', d: ['It opens in only a handful of cities first', 'It is re-released years after its first run', 'It is shown on television before it reaches cinemas'] },
{ c: 'Behind the Scenes', t: 1, q: 'What does a costume designer do?', a: 'Designs and oversees the clothes the characters wear', d: ['Chooses the furniture that dresses the sets', 'Applies the actors\' makeup each morning', 'Decides the color grading of the finished film'] },

{ c: 'Movies', t: 2, q: 'Which branch of the US military runs the elite flying school in Top Gun?', a: 'The Navy', d: ['The Air Force', 'The Marine Corps', 'The Coast Guard'] },
{ c: 'Television', t: 2, q: 'Which 1950s ABC childrens series featured a cast of young performers in mouse-ear hats?', a: 'The Mickey Mouse Club', d: ['Howdy Doody', 'Captain Kangaroo', 'Kukla, Fran and Ollie'] },
{ c: 'Actors & Directors', t: 2, q: 'Which actress starred in The Help and played Annalise Keating on television?', a: 'Viola Davis', d: ['Octavia Spencer', 'Regina King', 'Taraji P. Henson'] },
{ c: 'Awards & Box Office', t: 2, q: 'Which actress won Best Supporting Actress for Ghost?', a: 'Whoopi Goldberg', d: ['Lorraine Bracco', 'Annette Bening', 'Diane Ladd'] },
{ c: 'Behind the Scenes', t: 2, q: 'In a documentary, what is a talking head?', a: 'An interview subject filmed speaking to camera', d: ['A narrator who is heard but never seen', 'Archive footage screened without sound', 'A scene reenacted by hired actors'] },

{ c: 'Movies', t: 3, q: 'On which city\'s steps does the most famous sequence of Battleship Potemkin take place?', a: 'Odessa', d: ['Kronstadt', 'Sevastopol', 'Petrograd'] },
{ c: 'Television', t: 3, q: 'Which HBO and BBC co-production followed two soldiers of the Thirteenth Legion through the fall of the Roman Republic?', a: 'Rome', d: ['Spartacus', 'I, Claudius', 'Britannia'] },
{ c: 'Actors & Directors', t: 3, q: 'Which director made Fruitvale Station, Creed and Black Panther?', a: 'Ryan Coogler', d: ['Barry Jenkins', 'F. Gary Gray', 'Malcolm D. Lee'] },
{ c: 'Awards & Box Office', t: 3, q: 'Which film won the Academy Award for Best Animated Feature for 2020?', a: 'Soul', d: ['Onward', 'Wolfwalkers', 'Over the Moon'] },
{ c: 'Behind the Scenes', t: 3, q: 'Which 2000 release was Aardman\'s first feature-length film?', a: 'Chicken Run', d: ['Flushed Away', 'Early Man', 'Arthur Christmas'] },

{ c: 'Movies', t: 4, q: 'Where do the two central characters of Brief Encounter keep meeting?', a: 'A railway station refreshment room', d: ['A seaside boarding house', 'A hospital waiting room', 'A public library'] },
{ c: 'Television', t: 4, q: 'Which Canadian series posted a Mountie to Chicago, accompanied by his deaf half-wolf?', a: 'Due South', d: ['Murdoch Mysteries', 'Flashpoint', 'Da Vinci\'s Inquest'] },
{ c: 'Actors & Directors', t: 4, q: 'Which deadpan Finnish director made The Man Without a Past and Le Havre?', a: 'Aki Kaurismaki', d: ['Roy Andersson', 'Ruben Ostlund', 'Bent Hamer'] },
{ c: 'Awards & Box Office', t: 4, q: 'Which 2013 film was the top-grossing release in North America that year?', a: 'The Hunger Games: Catching Fire', d: ['Iron Man 3', 'Frozen', 'Despicable Me 2'] },
{ c: 'Behind the Scenes', t: 4, q: 'Which 1987 jungle action film scrapped its first creature suit and had Stan Winston design a replacement during production?', a: 'Predator', d: ['Aliens', 'The Thing', 'RoboCop'] },

{ c: 'Movies', t: 5, q: 'Which art form do the two boys train in from childhood in Farewell My Concubine?', a: 'Peking opera', d: ['Shadow puppetry', 'Acrobatics for the circus', 'Classical calligraphy'] },
{ c: 'Television', t: 5, q: 'Which 1994 Colombian telenovela about a coffee picker and the heir to a plantation became a hit across Latin America?', a: 'Cafe con aroma de mujer', d: ['Pasion de Gavilanes', 'La Reina del Sur', 'Los Reyes'] },
{ c: 'Actors & Directors', t: 5, q: 'Which composer scored Moonlight and If Beale Street Could Talk?', a: 'Nicholas Britell', d: ['Ludwig Goransson', 'Mica Levi', 'Hildur Gudnadottir'] },
{ c: 'Awards & Box Office', t: 5, q: 'Which film took the Golden Lion at Venice in 2007?', a: 'Lust, Caution', d: ['Atonement', 'I\'m Not There', 'In the Valley of Elah'] },
{ c: 'Behind the Scenes', t: 5, q: 'Which BBC designer created the look of the Daleks for their first appearance in 1963?', a: 'Raymond Cusick', d: ['Barry Newbery', 'Peter Brachacki', 'Bernard Wilkie'] },
],

// ── Day 74 ──────────────────────────────────────────────────────────────
[
{ c: 'Movies', t: 1, q: 'What does the Sorting Hat decide for each new student in the Harry Potter films?', a: 'Which house they will belong to', d: ['Which wand will choose them', 'Which subjects they will study', 'Which year they will graduate'] },
{ c: 'Television', t: 1, q: 'In The Simpsons, what is the name of the run-down tavern where Homer drinks with Lenny and Carl?', a: 'Moe\'s Tavern', d: ['The Rusty Barnacle', 'The Frying Dutchman', 'Barney\'s Bowlarama'] },
{ c: 'Actors & Directors', t: 1, q: 'Which comic actor and rock singer starred in School of Rock and Jumanji: Welcome to the Jungle?', a: 'Jack Black', d: ['Will Ferrell', 'Seth Rogen', 'Jason Segel'] },
{ c: 'Awards & Box Office', t: 1, q: 'The Academy Award statuette is plated with which metal?', a: 'Gold', d: ['Silver', 'Platinum', 'Brass'] },
{ c: 'Behind the Scenes', t: 1, q: 'What is a remake?', a: 'A new version of a film that has been made before', d: ['A film continuing an earlier story', 'A film dubbed into a second language', 'A shortened cut prepared for television'] },

{ c: 'Movies', t: 2, q: 'What is the name of the desert planet where Luke Skywalker grows up?', a: 'Tatooine', d: ['Jakku', 'Geonosis', 'Korriban'] },
{ c: 'Television', t: 2, q: 'Which 1980s sitcom featured a wisecracking furry alien from the planet Melmac living with a suburban family?', a: 'ALF', d: ['Mork & Mindy', '3rd Rock from the Sun', 'My Favorite Martian'] },
{ c: 'Actors & Directors', t: 2, q: 'Which Australian actress starred in The Wolf of Wall Street and played Tonya Harding on screen?', a: 'Margot Robbie', d: ['Emma Stone', 'Brie Larson', 'Elizabeth Debicki'] },
{ c: 'Awards & Box Office', t: 2, q: 'Which actor won Best Actor for playing the physicist who led the Manhattan Project in a 2023 film?', a: 'Cillian Murphy', d: ['Bradley Cooper', 'Paul Giamatti', 'Colman Domingo'] },
{ c: 'Behind the Scenes', t: 2, q: 'Which 1982 fantasy was performed entirely by creatures from Jim Henson\'s workshop, with no human faces on screen?', a: 'The Dark Crystal', d: ['Labyrinth', 'The NeverEnding Story', 'Legend'] },

{ c: 'Movies', t: 3, q: 'Which decaying American city does the armored policeman patrol in RoboCop?', a: 'Detroit', d: ['Cleveland', 'Newark', 'Baltimore'] },
{ c: 'Television', t: 3, q: 'Which 1970s series followed two California Highway Patrol motorcycle officers on the freeways of Los Angeles?', a: 'CHiPs', d: ['Adam-12', 'Emergency!', 'The Highwayman'] },
{ c: 'Actors & Directors', t: 3, q: 'Which New York filmmaker made Manhattan, Hannah and Her Sisters and Crimes and Misdemeanors?', a: 'Woody Allen', d: ['Sidney Pollack', 'Paul Mazursky', 'Alan Alda'] },
{ c: 'Awards & Box Office', t: 3, q: 'Which 2018 documentary following Alex Honnold\'s ascent of El Capitan won the Academy Award for Best Documentary Feature?', a: 'Free Solo', d: ['RBG', 'Minding the Gap', 'Won\'t You Be My Neighbor?'] },
{ c: 'Behind the Scenes', t: 3, q: 'Near which New Zealand town was the Hobbiton set built on a working sheep farm and later kept as an attraction?', a: 'Matamata', d: ['Queenstown', 'Wanaka', 'Twizel'] },

{ c: 'Movies', t: 4, q: 'Where do the two hosts conceal the evidence during the party in Hitchcock\'s Rope?', a: 'In a chest in the middle of the room', d: ['Behind a false bookcase', 'On the roof terrace', 'Under the floorboards of the hall'] },
{ c: 'Television', t: 4, q: 'In the anime about humanity living behind three concentric walls, the walls are named Maria, Rose and what?', a: 'Sina', d: ['Ymir', 'Shiganshina', 'Trost'] },
{ c: 'Actors & Directors', t: 4, q: 'Which cinematographer shot The Shawshank Redemption, Fargo and No Country for Old Men?', a: 'Roger Deakins', d: ['Emmanuel Lubezki', 'Robert Elswit', 'Janusz Kaminski'] },
{ c: 'Awards & Box Office', t: 4, q: 'Which film won the Toronto People\'s Choice Award in 2013?', a: '12 Years a Slave', d: ['Gravity', 'Philomena', 'Dallas Buyers Club'] },
{ c: 'Behind the Scenes', t: 4, q: 'Which 2004 thriller was shot at night on Los Angeles streets using early digital cameras chosen for their low-light performance?', a: 'Collateral', d: ['Heat', 'Training Day', 'Nightcrawler'] },

{ c: 'Movies', t: 5, q: 'Who stages the revolt in Jean Vigo\'s Zero for Conduct?', a: 'Boys at a boarding school', d: ['Sailors on a river barge', 'Workers at a shoe factory', 'Patients in a sanatorium'] },
{ c: 'Television', t: 5, q: 'Which 1984 Granada serial adapted Paul Scott novels about the last years of British rule in India?', a: 'The Jewel in the Crown', d: ['The Far Pavilions', 'Traffik', 'Fortunes of War'] },
{ c: 'Actors & Directors', t: 5, q: 'Which Mexican director made Japon and Silent Light?', a: 'Carlos Reygadas', d: ['Amat Escalante', 'Fernando Eimbcke', 'Michel Franco'] },
{ c: 'Awards & Box Office', t: 5, q: 'Which film won the Sundance Grand Jury Prize for drama in 1990?', a: 'Chameleon Street', d: ['Metropolitan', 'House Party', 'To Sleep with Anger'] },
{ c: 'Behind the Scenes', t: 5, q: 'A dispute over recasting and likeness on which 1989 sequel led to new union rules about imitating an actor?', a: 'Back to the Future Part II', d: ['Ghostbusters II', 'Beverly Hills Cop II', 'Lethal Weapon 2'] },
],

// ── Day 75 ──────────────────────────────────────────────────────────────
[
{ c: 'Movies', t: 1, q: 'What must be destroyed in the fires of Mount Doom in The Lord of the Rings?', a: 'The One Ring', d: ['The Elfstone', 'The Palantir', 'The Horn of Gondor'] },
{ c: 'Television', t: 1, q: 'Which 1964 stop-motion Christmas special follows a young member of Santa\'s sleigh team who is mocked for his glowing nose?', a: 'Rudolph the Red-Nosed Reindeer', d: ['Frosty the Snowman', 'The Little Drummer Boy', 'Santa Claus Is Comin\' to Town'] },
{ c: 'Actors & Directors', t: 1, q: 'Which actor directed and starred in Unforgiven and Million Dollar Baby?', a: 'Clint Eastwood', d: ['Kevin Costner', 'Robert Redford', 'Mel Gibson'] },
{ c: 'Awards & Box Office', t: 1, q: 'Which Academy Award did Steven Spielberg win for Schindler\'s List and again for Saving Private Ryan?', a: 'Best Director', d: ['Best Picture', 'Best Adapted Screenplay', 'Best Film Editing'] },
{ c: 'Behind the Scenes', t: 1, q: 'On a film set, what does it mean to call a wrap?', a: 'Shooting has finished for the day or the production', d: ['The camera is being covered against rain', 'The extras are being sent to wardrobe', 'The final credits are being designed'] },

{ c: 'Movies', t: 2, q: 'Which Latin phrase do the students adopt as their motto in Dead Poets Society?', a: 'Carpe diem', d: ['Cogito ergo sum', 'Veni vidi vici', 'Memento mori'] },
{ c: 'Television', t: 2, q: 'Which 1990s sitcom followed a teenager who discovers she is a witch, living with two aunts and a talking cat?', a: 'Sabrina the Teenage Witch', d: ['Charmed', 'Wizards of Waverly Place', 'Halloweentown'] },
{ c: 'Actors & Directors', t: 2, q: 'Which Welsh actress starred in The Mask of Zorro and Chicago?', a: 'Catherine Zeta-Jones', d: ['Penelope Cruz', 'Salma Hayek', 'Rachel Weisz'] },
{ c: 'Awards & Box Office', t: 2, q: 'Which 2002 film produced Lose Yourself, the first hip-hop track to win Best Original Song?', a: '8 Mile', d: ['Hustle & Flow', 'Drumline', 'Brown Sugar'] },
{ c: 'Behind the Scenes', t: 2, q: 'Which 1974 release was the first major American film to carry Part II in its title?', a: 'The Godfather Part II', d: ['Jaws 2', 'French Connection II', 'Rocky II'] },

{ c: 'Movies', t: 3, q: 'What are the two brothers raising money for in The Blues Brothers?', a: 'The orphanage where they were raised', d: ['A recording studio of their own', 'Their old bandleader\'s bail', 'A church roof in Chicago'] },
{ c: 'Television', t: 3, q: 'Which fantasy series adapted Philip Pullman novels about a girl, a truth-telling instrument and animal daemons?', a: 'His Dark Materials', d: ['Shadow and Bone', 'Carnival Row', 'The Nevers'] },
{ c: 'Actors & Directors', t: 3, q: 'Which writer created The X-Files?', a: 'Chris Carter', d: ['Frank Spotnitz', 'J. J. Abrams', 'Joss Whedon'] },
{ c: 'Awards & Box Office', t: 3, q: 'Which director won the Academy Award for Best Director for Parasite?', a: 'Bong Joon-ho', d: ['Sam Mendes', 'Todd Phillips', 'Martin Scorsese'] },
{ c: 'Behind the Scenes', t: 3, q: 'Which 2007 horror film was shot over about a week in its own director\'s house?', a: 'Paranormal Activity', d: ['Insidious', 'Sinister', 'The Last Exorcism'] },

{ c: 'Movies', t: 4, q: 'What does the widowed cleaning woman in Fassbinder\'s Ali: Fear Eats the Soul do that scandalizes her neighbors?', a: 'She marries a much younger Moroccan guest worker', d: ['She sells the family apartment', 'She joins a traveling circus', 'She takes in a family of strangers'] },
{ c: 'Television', t: 4, q: 'Which BBC comedy follows two friends sweeping English fields with metal detectors in search of Saxon gold?', a: 'Detectorists', d: ['This Country', 'Mum', 'Rev.'] },
{ c: 'Actors & Directors', t: 4, q: 'Which British writer co-created Peep Show and went on to create Succession?', a: 'Jesse Armstrong', d: ['Sam Esmail', 'Noah Hawley', 'Damon Lindelof'] },
{ c: 'Awards & Box Office', t: 4, q: 'Which 1934 romantic comedy was the first film to win Best Picture, Director, Actor, Actress and Screenplay?', a: 'It Happened One Night', d: ['The Thin Man', 'Cleopatra', 'Imitation of Life'] },
{ c: 'Behind the Scenes', t: 4, q: 'Which 2022 multiverse film completed the bulk of its visual effects with a team of only a handful of artists?', a: 'Everything Everywhere All at Once', d: ['Doctor Strange in the Multiverse of Madness', 'Spider-Man: No Way Home', 'The Adam Project'] },

{ c: 'Movies', t: 5, q: 'Which West African people\'s traditions shape Souleymane Cisse\'s Yeelen?', a: 'The Bambara of Mali', d: ['The Ashanti of Ghana', 'The Wolof of Senegal', 'The Yoruba of Nigeria'] },
{ c: 'Television', t: 5, q: 'Which French series follows a case officer at the DGSE who trains and runs deep-cover agents from a Paris desk?', a: 'The Bureau', d: ['Spiral', 'The Last Panthers', 'No Man\'s Land'] },
{ c: 'Actors & Directors', t: 5, q: 'Which Russian director made Mother and Son and Russian Ark?', a: 'Alexander Sokurov', d: ['Aleksei German', 'Andrei Zvyagintsev', 'Kira Muratova'] },
{ c: 'Awards & Box Office', t: 5, q: 'Which Chinese film won the Golden Bear at Berlin in 2007?', a: 'Tuya\'s Marriage', d: ['The Good Shepherd', 'Beaufort', 'I Served the King of England'] },
{ c: 'Behind the Scenes', t: 5, q: 'For which 2023 film did Kodak manufacture a black-and-white large-format film stock at the production\'s request?', a: 'Oppenheimer', d: ['Tenet', 'The Fabelmans', 'Killers of the Flower Moon'] },
],

];
