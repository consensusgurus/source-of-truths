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

{ c: 'Movies', t: 2, q: 'In Pixar\'s Up, what lifts Carl Fredricksen\'s house into the sky?', a: 'Thousands of helium balloons', d: ['A giant kite', 'A passing tornado', 'A hot air balloon burner'] },
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

// ── Day 76 ────────────────────────────────────────────────────────────
[
{ c: 'Movies', t: 1, q: 'In Mean Girls, which color do the Plastics wear on Wednesdays?', a: 'Pink', d: ['Black', 'Red', 'White'] },
{ c: 'Television', t: 1, q: 'In SpongeBob SquarePants, what does SpongeBob live in under the sea?', a: 'A pineapple', d: ['A coconut', 'A rock', 'A tiki head'] },
{ c: 'Actors & Directors', t: 1, q: 'Which actress played Mary Jane Watson in the Spider-Man films directed by Sam Raimi?', a: 'Kirsten Dunst', d: ['Emma Stone', 'Natalie Portman', 'Zendaya'] },
{ c: 'Awards & Box Office', t: 1, q: 'What is it called when two Oscar nominees in one category receive the same number of votes and both win?', a: 'A tie', d: ['A sweep', 'A runoff', 'A shared nomination'] },
{ c: 'Behind the Scenes', t: 1, q: 'What is a close-up?', a: 'A shot that frames a face or object tightly', d: ['A shot from far away', 'The final scene of a film', 'A scene filmed indoors'] },

{ c: 'Movies', t: 2, q: 'In Dirty Dancing, where does Baby spend the summer of 1963?', a: 'A Catskills resort', d: ['A Cape Cod beach house', 'A Florida cruise ship', 'A Hamptons estate'] },
{ c: 'Television', t: 2, q: 'In which city was the 1950s-set sitcom Happy Days set?', a: 'Milwaukee', d: ['Chicago', 'Cleveland', 'Detroit'] },
{ c: 'Actors & Directors', t: 2, q: 'Which actor played Daniel LaRusso in the 1984 film The Karate Kid?', a: 'Ralph Macchio', d: ['C. Thomas Howell', 'Emilio Estevez', 'Corey Feldman'] },
{ c: 'Awards & Box Office', t: 2, q: 'Which actor won Best Actor two years running, for Philadelphia and Forrest Gump?', a: 'Tom Hanks', d: ['Denzel Washington', 'Al Pacino', 'Paul Newman'] },
{ c: 'Behind the Scenes', t: 2, q: 'Which country\'s film industry is nicknamed Nollywood?', a: 'Nigeria', d: ['Norway', 'Nepal', 'New Zealand'] },

{ c: 'Movies', t: 3, q: 'What is the profession of Joe Gillis in Sunset Boulevard?', a: 'A screenwriter', d: ['A stunt man', 'A studio publicist', 'A cameraman'], from: 'script:d23q11' },
{ c: 'Television', t: 3, q: 'Which 1970s sitcom followed a cantankerous junk dealer and his son in the Watts neighborhood of Los Angeles?', a: 'Sanford and Son', d: ['Good Times', 'The Jeffersons', 'What\'s Happening!!'] },
{ c: 'Actors & Directors', t: 3, q: 'Which actress played Ilsa Lund in Casablanca?', a: 'Ingrid Bergman', d: ['Lauren Bacall', 'Hedy Lamarr', 'Greta Garbo'] },
{ c: 'Awards & Box Office', t: 3, q: 'Which actress won Best Actress for playing a mother held captive with her son in Room?', a: 'Brie Larson', d: ['Saoirse Ronan', 'Cate Blanchett', 'Charlotte Rampling'] },
{ c: 'Behind the Scenes', t: 3, q: 'In film lighting, what is the key light?', a: 'The main light illuminating the subject', d: ['A light hidden inside the set', 'The light behind the camera operator', 'The last light switched on'] },

{ c: 'Movies', t: 4, q: 'In Blade Runner, what is the test used to identify replicants called?', a: 'Voight-Kampff', d: ['Kessler-Baty', 'Tyrell-Sebastian', 'Turing-Rosen'], from: 'script:d01q16' },
{ c: 'Television', t: 4, q: 'Which anthology series opened with narration about a dimension beyond that which is known to man?', a: 'The Twilight Zone', d: ['Tales from the Crypt', 'The Outer Limits', 'Night Gallery'], from: 'script:d01q17' },
{ c: 'Actors & Directors', t: 4, q: 'Which actor played the silent hitman in Le Samourai?', a: 'Alain Delon', d: ['Lino Ventura', 'Jean-Paul Belmondo', 'Yves Montand'], from: 'script:d15q18' },
{ c: 'Awards & Box Office', t: 4, q: 'Which film about a Black detective investigating a Mississippi murder won Best Picture at the 1968 ceremony?', a: 'In the Heat of the Night', d: ['The Graduate', 'Bonnie and Clyde', 'Doctor Dolittle'], from: 'script:d27q19' },
{ c: 'Behind the Scenes', t: 4, q: 'The Hays Code governed what in American filmmaking?', a: 'Content and morality standards', d: ['Union labor rules', 'Studio ownership limits', 'Ticket pricing'], from: 'script:d04q20' },

{ c: 'Movies', t: 5, q: 'What fate are the children sold into in Sansho the Bailiff?', a: 'Slavery', d: ['An arranged marriage', 'A monastery', 'The army'], from: 'script:d21q21' },
{ c: 'Television', t: 5, q: 'Which American sitcom was adapted from the British series Till Death Us Do Part?', a: 'All in the Family', d: ['Three\'s Company', 'Too Close for Comfort', 'Sanford and Son'], from: 'script:d21q22' },
{ c: 'Actors & Directors', t: 5, q: 'Who sent a representative to decline his Best Actor Oscar in 1973?', a: 'Marlon Brando', d: ['Jack Nicholson', 'Paul Newman', 'George C. Scott'], from: 'script:d05q23' },
{ c: 'Awards & Box Office', t: 5, q: 'Which playwright won both a Nobel Prize in Literature and an Academy Award for screenwriting?', a: 'George Bernard Shaw', d: ['T. S. Eliot', 'W. B. Yeats', 'Rudyard Kipling'], from: 'script:d24q24' },
{ c: 'Behind the Scenes', t: 5, q: 'Which 1935 release was the first feature shot in three-strip Technicolor?', a: 'Becky Sharp', d: ['The Garden of Allah', 'A Star Is Born', 'The Adventures of Robin Hood'], from: 'script:d25q25' },
],

// ── Day 77 ────────────────────────────────────────────────────────────
[
{ c: 'Movies', t: 1, q: 'In Pixar\'s Coco, which instrument does Miguel dream of playing?', a: 'The guitar', d: ['The trumpet', 'The violin', 'The accordion'] },
{ c: 'Television', t: 1, q: 'Which Nickelodeon cartoon follows a boy named Timmy Turner and his magical godparents Cosmo and Wanda?', a: 'The Fairly OddParents', d: ['Jimmy Neutron', 'Hey Arnold!', 'Rugrats'] },
{ c: 'Actors & Directors', t: 1, q: 'Which actress sang Let It Go as the voice of Elsa in Frozen?', a: 'Idina Menzel', d: ['Kristen Bell', 'Mandy Moore', 'Amy Adams'] },
{ c: 'Awards & Box Office', t: 1, q: 'Who votes to choose the Academy Award winners?', a: 'Members of the Academy', d: ['The general public', 'Newspaper critics', 'Studio executives'] },
{ c: 'Behind the Scenes', t: 1, q: 'What are funny mistakes from filming, often shown during the end credits, called?', a: 'Bloopers', d: ['Cameos', 'Teasers', 'Montages'] },

{ c: 'Movies', t: 2, q: 'In Jurassic Park, what does the park\'s programmer Dennis Nedry try to smuggle out for a rival company?', a: 'Dinosaur embryos', d: ['A dinosaur skeleton', 'The park\'s source code', 'A baby triceratops'] },
{ c: 'Television', t: 2, q: 'In the American version of The Office, which salesman runs a beet farm?', a: 'Dwight Schrute', d: ['Jim Halpert', 'Stanley Hudson', 'Andy Bernard'] },
{ c: 'Actors & Directors', t: 2, q: 'Which actor played Samwise Gamgee in The Lord of the Rings films?', a: 'Sean Astin', d: ['Dominic Monaghan', 'Billy Boyd', 'Andy Serkis'] },
{ c: 'Awards & Box Office', t: 2, q: 'Which actress won Best Supporting Actress for Everything Everywhere All at Once?', a: 'Jamie Lee Curtis', d: ['Stephanie Hsu', 'Angela Bassett', 'Kerry Condon'] },
{ c: 'Behind the Scenes', t: 2, q: 'What is product placement?', a: 'A brand paying to have its product shown in a film or show', d: ['Arranging props on a set', 'Choosing where a film is released', 'Placing posters in theater lobbies'] },

{ c: 'Movies', t: 3, q: 'In Dr. Strangelove, what does Major Kong ride, rodeo style, down to its target?', a: 'A nuclear bomb', d: ['A missile', 'A parachute', 'A horse'] },
{ c: 'Television', t: 3, q: 'Which series followed a Manhattan sex columnist and her three friends?', a: 'Sex and the City', d: ['Ally McBeal', 'Girls', 'Younger'], from: 'script:d23q12' },
{ c: 'Actors & Directors', t: 3, q: 'Which director made Clueless and Fast Times at Ridgemont High?', a: 'Amy Heckerling', d: ['Penny Marshall', 'Nora Ephron', 'Penelope Spheeris'] },
{ c: 'Awards & Box Office', t: 3, q: 'Which film about a Tudor lord chancellor won Best Picture at the 1967 ceremony?', a: 'A Man for All Seasons', d: ['The Sand Pebbles', 'Alfie', 'Who\'s Afraid of Virginia Woolf?'], from: 'script:d23q14' },
{ c: 'Behind the Scenes', t: 3, q: 'What is a spec script?', a: 'A screenplay written without being commissioned, in hope of a sale', d: ['A script with technical camera notes', 'A script for a commercial', 'A script rewritten by a specialist'] },

{ c: 'Movies', t: 4, q: 'In Vertigo, which long-dead woman is Madeleine said to be obsessed with?', a: 'Carlotta Valdes', d: ['Rebecca de Winter', 'Laura Hunt', 'Mary Carmichael'] },
{ c: 'Television', t: 4, q: 'Which 1990s HBO comedy starred Garry Shandling as a vain late-night talk show host?', a: 'The Larry Sanders Show', d: ['Dream On', 'NewsRadio', 'Arli$$'] },
{ c: 'Actors & Directors', t: 4, q: 'Which actress played the young runaway Iris in Taxi Driver?', a: 'Jodie Foster', d: ['Tatum O\'Neal', 'Sissy Spacek', 'Brooke Shields'], from: 'script:d02q18' },
{ c: 'Awards & Box Office', t: 4, q: 'Which film about T. E. Lawrence won Best Picture at the 1963 ceremony?', a: 'Lawrence of Arabia', d: ['To Kill a Mockingbird', 'Mutiny on the Bounty', 'The Music Man'], from: 'script:d21q19' },
{ c: 'Behind the Scenes', t: 4, q: 'Which sound man coined the job title sound designer while working on Apocalypse Now?', a: 'Walter Murch', d: ['Randy Thom', 'Ben Burtt', 'Gary Rydstrom'], from: 'script:d21q20' },

{ c: 'Movies', t: 5, q: 'Where is Jean Vigo\'s L\'Atalante set?', a: 'On a river barge', d: ['In a traveling circus', 'In a lighthouse', 'In a textile mill'], from: 'script:d23q21' },
{ c: 'Television', t: 5, q: 'What was the cruise ship in The Love Boat called?', a: 'Pacific Princess', d: ['Sea Princess', 'Sun Princess', 'Island Princess'], from: 'script:d15q22' },
{ c: 'Actors & Directors', t: 5, q: 'Which pseudonym did the Directors Guild of America assign, from 1969 until 2000, to films whose directors disowned them?', a: 'Alan Smithee', d: ['Harry Kirkpatrick', 'George Spelvin', 'Thomas Lee'], from: 'script:d02q23' },
{ c: 'Awards & Box Office', t: 5, q: 'Which director won Best Director three times in the 1930s?', a: 'Frank Capra', d: ['William Wyler', 'John Ford', 'Leo McCarey'], from: 'script:d11q24' },
{ c: 'Behind the Scenes', t: 5, q: 'The Kuleshov effect demonstrates what about cinema?', a: 'Meaning comes from the juxtaposition of shots', d: ['Color drives mood', 'Long takes build tension', 'Sound must match picture exactly'], from: 'script:d08q25' },
],

// ── Day 78 ────────────────────────────────────────────────────────────
[
{ c: 'Movies', t: 1, q: 'In E.T. the Extra-Terrestrial, on what do Elliott and his friends fly across the sky?', a: 'Bicycles', d: ['Skateboards', 'A spaceship', 'A flying car'] },
{ c: 'Television', t: 1, q: 'Which 1950s sitcom starred Lucille Ball and Desi Arnaz as a married couple?', a: 'I Love Lucy', d: ['The Honeymooners', 'Father Knows Best', 'Leave It to Beaver'] },
{ c: 'Actors & Directors', t: 1, q: 'Which actor played the title role in the 2018 film Aquaman?', a: 'Jason Momoa', d: ['Henry Cavill', 'Dwayne Johnson', 'Chris Hemsworth'] },
{ c: 'Awards & Box Office', t: 1, q: 'Which awards show became famous for statuettes shaped like a golden bucket of popcorn?', a: 'The MTV Movie Awards', d: ['The Golden Globes', 'The Saturn Awards', 'The Critics Choice Awards'] },
{ c: 'Behind the Scenes', t: 1, q: 'Which word is spelled out in giant white letters on Mount Lee above Los Angeles?', a: 'Hollywood', d: ['Beverly Hills', 'Burbank', 'Malibu'] },

{ c: 'Movies', t: 2, q: 'In The Princess Bride, what does Westley always say to Buttercup when she gives him an order?', a: 'As you wish', d: ['I love you', 'Inconceivable', 'Of course, my lady'] },
{ c: 'Television', t: 2, q: 'Which 1980s sitcom starred Tony Danza as a live-in housekeeper for an advertising executive?', a: 'Who\'s the Boss?', d: ['Taxi', 'Charles in Charge', 'Mr. Belvedere'] },
{ c: 'Actors & Directors', t: 2, q: 'Which actor played the villain Hans Gruber in Die Hard?', a: 'Alan Rickman', d: ['Jeremy Irons', 'Gary Oldman', 'Christopher Walken'] },
{ c: 'Awards & Box Office', t: 2, q: 'Which actor won Best Supporting Actor for Dallas Buyers Club?', a: 'Jared Leto', d: ['Bradley Cooper', 'Jonah Hill', 'Michael Fassbender'] },
{ c: 'Behind the Scenes', t: 2, q: 'What was a B movie in the studio era?', a: 'A low-budget film shown as the second half of a double bill', d: ['A film rated for adults only', 'A film shot in black and white', 'A film made by a second unit'] },

{ c: 'Movies', t: 3, q: 'In No Country for Old Men, what unusual weapon does Anton Chigurh carry?', a: 'A captive bolt pistol', d: ['A crossbow', 'A harpoon gun', 'A blowgun'] },
{ c: 'Television', t: 3, q: 'Which British comedy followed a minister and his obstructive permanent secretary in Whitehall?', a: 'Yes Minister', d: ['Drop the Dead Donkey', 'The New Statesman', 'The Thick of It'], from: 'script:d18q12' },
{ c: 'Actors & Directors', t: 3, q: 'Which actor played Rick Blaine in Casablanca?', a: 'Humphrey Bogart', d: ['Claude Rains', 'Peter Lorre', 'Paul Henreid'], from: 'script:d25q13' },
{ c: 'Awards & Box Office', t: 3, q: 'Which film about a New Jersey longshoreman won Best Picture at the 1955 ceremony?', a: 'On the Waterfront', d: ['Seven Brides for Seven Brothers', 'Three Coins in the Fountain', 'The Caine Mutiny'], from: 'script:d26q14' },
{ c: 'Behind the Scenes', t: 3, q: 'What do filmmakers mean by the magic hour?', a: 'The soft light just after sunrise or before sunset', d: ['The last hour of a shooting day', 'The hour when crews are paid overtime', 'The first hour of a premiere'] },

{ c: 'Movies', t: 4, q: 'What is the name of the commercial towing ship in Alien?', a: 'The Nostromo', d: ['The Covenant', 'The Sulaco', 'The Prometheus'], from: 'script:d04q16' },
{ c: 'Television', t: 4, q: 'Which series adapted Margaret Atwood\'s novel about a theocracy called Gilead?', a: 'The Handmaid\'s Tale', d: ['Alias Grace', 'Station Eleven', 'The Man in the High Castle'], from: 'script:d25q17' },
{ c: 'Actors & Directors', t: 4, q: 'Which director made Faces and A Woman Under the Influence?', a: 'John Cassavetes', d: ['Bob Rafelson', 'Elia Kazan', 'Sidney Lumet'], from: 'script:d27q18' },
{ c: 'Awards & Box Office', t: 4, q: 'Which 1950 release took fourteen Academy Award nominations, the most any film had received to that point?', a: 'All About Eve', d: ['Born Yesterday', 'King Solomon\'s Mines', 'Sunset Boulevard'], from: 'script:d10q19' },
{ c: 'Behind the Scenes', t: 4, q: 'What is the 180 degree rule in filmmaking?', a: 'Keeping the camera on one side of an imaginary line between subjects', d: ['Cutting on a half turn of the head', 'Circling a subject in a full rotation', 'Lighting from directly behind the subject'], from: 'script:d11q20' },

{ c: 'Movies', t: 5, q: 'Who narrates Sunset Boulevard?', a: 'A dead man floating in a swimming pool', d: ['A gossip columnist', 'A police detective', 'The studio head'], from: 'script:d06q21' },
{ c: 'Television', t: 5, q: 'Which 1968 series was among the first to give a Black actress a leading role outside domestic service?', a: 'Julia', d: ['Room 222', 'I Spy', 'The Mod Squad'], from: 'script:d24q22' },
{ c: 'Actors & Directors', t: 5, q: 'Which director made Andrei Rublev and Stalker?', a: 'Andrei Tarkovsky', d: ['Sergei Parajanov', 'Elem Klimov', 'Aleksei German'], from: 'script:d10q23' },
{ c: 'Awards & Box Office', t: 5, q: 'Which low-budget drama about a lonely Bronx butcher won Best Picture at the 1956 ceremony?', a: 'Marty', d: ['The Rose Tattoo', 'Picnic', 'Mister Roberts'], from: 'script:d12q24' },
{ c: 'Behind the Scenes', t: 5, q: 'Which cinema sound format launched in 1992 with Batman Returns?', a: 'Dolby Digital', d: ['SDDS', 'THX', 'DTS'], from: 'script:d15q25' },
],

// ── Day 79 ────────────────────────────────────────────────────────────
[
{ c: 'Movies', t: 1, q: 'In Disney\'s Aladdin, what kind of animal is Aladdin\'s sidekick Abu?', a: 'A monkey', d: ['A parrot', 'A tiger', 'A camel'] },
{ c: 'Television', t: 1, q: 'Which public television show starred Bob Ross painting happy little trees?', a: 'The Joy of Painting', d: ['Reading Rainbow', 'This Old House', 'The French Chef'] },
{ c: 'Actors & Directors', t: 1, q: 'Which comedian voiced the forgetful fish Dory in Finding Nemo?', a: 'Ellen DeGeneres', d: ['Rosie O\'Donnell', 'Lisa Kudrow', 'Whoopi Goldberg'] },
{ c: 'Awards & Box Office', t: 1, q: 'What kind of filmmaking is the Sundance Film Festival best known for championing?', a: 'Independent films', d: ['Studio blockbusters', 'Silent films', 'Big-budget musicals'] },
{ c: 'Behind the Scenes', t: 1, q: 'What are the comic-strip style drawings that plan out a film\'s shots called?', a: 'Storyboards', d: ['Screenplays', 'Call sheets', 'Dailies'] },

{ c: 'Movies', t: 2, q: 'In Home Alone 2: Lost in New York, which famous Manhattan hotel does Kevin check into?', a: 'The Plaza', d: ['The Waldorf Astoria', 'The Ritz-Carlton', 'The Chelsea'] },
{ c: 'Television', t: 2, q: 'In Friends, what is Ross Geller\'s profession?', a: 'Paleontologist', d: ['Geologist', 'Archaeologist', 'Anthropologist'] },
{ c: 'Actors & Directors', t: 2, q: 'Which actor played the Joker in Tim Burton\'s 1989 Batman?', a: 'Jack Nicholson', d: ['Danny DeVito', 'Jim Carrey', 'Christopher Walken'] },
{ c: 'Awards & Box Office', t: 2, q: 'Which French actor won Best Actor for the mostly silent 2011 film The Artist?', a: 'Jean Dujardin', d: ['Omar Sy', 'Vincent Cassel', 'Mathieu Amalric'] },
{ c: 'Behind the Scenes', t: 2, q: 'Which studio\'s logo shows a robed woman holding up a torch?', a: 'Columbia Pictures', d: ['Paramount', 'Universal', 'MGM'] },

{ c: 'Movies', t: 3, q: 'In The Truman Show, what does Truman Burbank\'s hometown turn out to be?', a: 'A giant television set', d: ['A government experiment', 'A dream', 'A computer simulation'] },
{ c: 'Television', t: 3, q: 'Which medical drama set in a Chicago emergency room ran for fifteen seasons from 1994?', a: 'ER', d: ['Chicago Hope', 'Grey\'s Anatomy', 'St. Elsewhere'], from: 'script:d19q12' },
{ c: 'Actors & Directors', t: 3, q: 'Which director made Umberto D. and Bicycle Thieves?', a: 'Vittorio De Sica', d: ['Roberto Rossellini', 'Luchino Visconti', 'Cesare Zavattini'], from: 'script:d19q13' },
{ c: 'Awards & Box Office', t: 3, q: 'Which film about a family after a son\'s death won Best Picture at the 1981 ceremony?', a: 'Ordinary People', d: ['The Elephant Man', 'Coal Miner\'s Daughter', 'Raging Bull'], from: 'script:d25q14' },
{ c: 'Behind the Scenes', t: 3, q: 'Which 1995 release was the first feature made entirely with computer animation?', a: 'Toy Story', d: ['Tron', 'Antz', 'A Bug\'s Life'], from: 'script:d02q15' },

{ c: 'Movies', t: 4, q: 'Through which part of Vienna is Harry Lime chased at the climax of The Third Man?', a: 'The sewers', d: ['The catacombs', 'The rooftops', 'The railway yards'] },
{ c: 'Television', t: 4, q: 'Which sitcom was set in the newsroom of the fictional WJM-TV in Minneapolis?', a: 'The Mary Tyler Moore Show', d: ['Lou Grant', 'Murphy Brown', 'WKRP in Cincinnati'], from: 'script:d08q17' },
{ c: 'Actors & Directors', t: 4, q: 'Which director made Nashville and The Player?', a: 'Robert Altman', d: ['Arthur Penn', 'Hal Ashby', 'Sidney Lumet'], from: 'script:d09q18' },
{ c: 'Awards & Box Office', t: 4, q: 'Which film finished the 1980s as the decade\'s highest grossing release worldwide?', a: 'E.T. the Extra-Terrestrial', d: ['Batman', 'Raiders of the Lost Ark', 'Return of the Jedi'], from: 'script:d06q19' },
{ c: 'Behind the Scenes', t: 4, q: 'Which composer scored both Chinatown and Alien?', a: 'Jerry Goldsmith', d: ['Bernard Herrmann', 'Ennio Morricone', 'John Barry'] },

{ c: 'Movies', t: 5, q: 'In which century is Marketa Lazarova set?', a: 'The thirteenth', d: ['The tenth', 'The eighteenth', 'The sixteenth'], from: 'script:d26q21' },
{ c: 'Television', t: 5, q: 'Which 1990 British serial adapted Michael Dobbs\'s novel about a scheming chief whip?', a: 'House of Cards', d: ['Yes Minister', 'State of Play', 'A Very British Coup'], from: 'script:d14q22' },
{ c: 'Actors & Directors', t: 5, q: 'Which director was nominated four times for Best Director, for Dr. Strangelove, 2001, A Clockwork Orange and Barry Lyndon, and never won it?', a: 'Stanley Kubrick', d: ['Robert Altman', 'King Vidor', 'Sidney Lumet'], from: 'script:d04q23' },
{ c: 'Awards & Box Office', t: 5, q: 'Who was the first person to refuse an Academy Award, turning down a screenplay prize in 1936?', a: 'Dudley Nichols', d: ['Marlon Brando', 'George C. Scott', 'Katharine Hepburn'], from: 'script:d01q24' },
{ c: 'Behind the Scenes', t: 5, q: 'How many writers and directors were cited for contempt of Congress after the 1947 hearings?', a: 'Ten', d: ['Twenty', 'Five', 'Fifty'], from: 'script:d26q25' },
],

// ── Day 80 ────────────────────────────────────────────────────────────
[
{ c: 'Movies', t: 1, q: 'In The Lion King, what is the name of Simba\'s father?', a: 'Mufasa', d: ['Scar', 'Rafiki', 'Zazu'] },
{ c: 'Television', t: 1, q: 'Which talk show host gave a new car to every member of her studio audience in 2004?', a: 'Oprah Winfrey', d: ['Ellen DeGeneres', 'Rosie O\'Donnell', 'Martha Stewart'] },
{ c: 'Actors & Directors', t: 1, q: 'Which actor played Frodo Baggins in The Lord of the Rings films?', a: 'Elijah Wood', d: ['Viggo Mortensen', 'Dominic Monaghan', 'Orlando Bloom'] },
{ c: 'Awards & Box Office', t: 1, q: 'Which 2013 Disney animated film produced the Oscar-winning song Let It Go?', a: 'Frozen', d: ['Tangled', 'Moana', 'Brave'] },
{ c: 'Behind the Scenes', t: 1, q: 'In filmmaking, what is an extra?', a: 'A background performer with no lines', d: ['A bonus scene', 'A spare camera', 'An understudy for the lead'] },

{ c: 'Movies', t: 2, q: 'In Pretty Woman, which Beverly Hills street does Vivian go shopping on?', a: 'Rodeo Drive', d: ['Sunset Boulevard', 'Melrose Avenue', 'Hollywood Boulevard'] },
{ c: 'Television', t: 2, q: 'In How I Met Your Mother, what is the name of the bar below Ted\'s apartment?', a: 'MacLaren\'s', d: ['Paddy\'s', 'Moe\'s', 'Central Perk'] },
{ c: 'Actors & Directors', t: 2, q: 'Which actress played Frances "Baby" Houseman in Dirty Dancing?', a: 'Jennifer Grey', d: ['Molly Ringwald', 'Ally Sheedy', 'Demi Moore'] },
{ c: 'Awards & Box Office', t: 2, q: 'Which actress won Best Supporting Actress for playing Fantine in the 2012 film of Les Miserables?', a: 'Anne Hathaway', d: ['Amanda Seyfried', 'Helena Bonham Carter', 'Amy Adams'] },
{ c: 'Behind the Scenes', t: 2, q: 'What is a stand-in on a film set?', a: 'Someone who takes an actor\'s place while lights and camera are set up', d: ['An understudy for a sick actor', 'A stunt performer', 'An extra with one line'] },

{ c: 'Movies', t: 3, q: 'In Toy Story 2, where is the toy collector Al planning to send Woody?', a: 'A toy museum in Japan', d: ['A museum in Paris', 'An auction in London', 'A collector in Texas'] },
{ c: 'Television', t: 3, q: 'Which sitcom used "Thank You for Being a Friend" as its theme song?', a: 'The Golden Girls', d: ['Designing Women', 'Empty Nest', 'Murphy Brown'] },
{ c: 'Actors & Directors', t: 3, q: 'Which actor played the shape-shifting T-1000 in Terminator 2: Judgment Day?', a: 'Robert Patrick', d: ['Michael Biehn', 'Lance Henriksen', 'Edward Furlong'] },
{ c: 'Awards & Box Office', t: 3, q: 'Which actor was twenty-nine when he took Best Actor for The Pianist in 2003?', a: 'Adrien Brody', d: ['Matt Damon', 'Marlon Brando', 'Richard Dreyfuss'], from: 'script:d08q14' },
{ c: 'Behind the Scenes', t: 3, q: 'What is a boom operator responsible for?', a: 'Holding the microphone just out of frame', d: ['Rigging the lights', 'Working the camera crane', 'Laying dolly track'], from: 'script:d20q15' },

{ c: 'Movies', t: 4, q: 'Which art form consumes the heroine of The Red Shoes?', a: 'Ballet', d: ['Opera', 'Painting', 'The violin'], from: 'script:d19q16' },
{ c: 'Television', t: 4, q: 'Which 1970s sitcom sent its characters to a bar called the Regal Beagle?', a: 'Three\'s Company', d: ['Happy Days', 'Laverne & Shirley', 'WKRP in Cincinnati'], from: 'script:d06q17' },
{ c: 'Actors & Directors', t: 4, q: 'Which actress won Best Actress in a Leading Role for A Streetcar Named Desire?', a: 'Vivien Leigh', d: ['Bette Davis', 'Kim Hunter', 'Shelley Winters'], from: 'script:d23q18' },
{ c: 'Awards & Box Office', t: 4, q: 'Which film about prisoners of war in Burma won Best Picture at the 1958 ceremony?', a: 'The Bridge on the River Kwai', d: ['Witness for the Prosecution', 'Peyton Place', 'Sayonara'], from: 'script:d18q19' },
{ c: 'Behind the Scenes', t: 4, q: 'Which actor was replaced as the Tin Man in The Wizard of Oz after the aluminum powder in his makeup made him seriously ill?', a: 'Buddy Ebsen', d: ['Jack Haley', 'Bert Lahr', 'Frank Morgan'] },

{ c: 'Movies', t: 5, q: 'Which unusual equipment let Stanley Kubrick shoot candlelit interiors for Barry Lyndon?', a: 'Ultra-fast lenses developed for NASA', d: ['Infrared film stock', 'Fiber-optic reflectors', 'Anamorphic prisms'], from: 'script:d04q21' },
{ c: 'Television', t: 5, q: 'What was the Alaskan town in Northern Exposure called?', a: 'Cicely', d: ['Bly', 'Rome', 'Twin Pines'], from: 'script:d07q22' },
{ c: 'Actors & Directors', t: 5, q: 'Which cinematographer shot Persona and Cries and Whispers for Ingmar Bergman?', a: 'Sven Nykvist', d: ['Raoul Coutard', 'Gunnar Fischer', 'Henri Alekan'], from: 'script:d14q23' },
{ c: 'Awards & Box Office', t: 5, q: 'Which Gene Kelly musical set in the French capital won Best Picture at the 1952 ceremony?', a: 'An American in Paris', d: ['A Streetcar Named Desire', 'Quo Vadis', 'A Place in the Sun'], from: 'script:d27q24' },
{ c: 'Behind the Scenes', t: 5, q: 'The documentary Hearts of Darkness chronicles the troubled Philippine shoot of which film?', a: 'Apocalypse Now', d: ['The Deer Hunter', 'Full Metal Jacket', 'Platoon'], from: 'script:d04q25' },
],

// ── Day 81 ────────────────────────────────────────────────────────────
[
{ c: 'Movies', t: 1, q: 'In the Paddington films, which food is the bear especially fond of?', a: 'Marmalade', d: ['Honey', 'Peanut butter', 'Porridge'] },
{ c: 'Television', t: 1, q: 'In The Simpsons, what is the name of the baby who is always sucking on a pacifier?', a: 'Maggie', d: ['Lisa', 'Patty', 'Selma'] },
{ c: 'Actors & Directors', t: 1, q: 'Which actor played Ron Weasley in the Harry Potter films?', a: 'Rupert Grint', d: ['Tom Felton', 'Matthew Lewis', 'Daniel Radcliffe'] },
{ c: 'Awards & Box Office', t: 1, q: 'The Tony Awards honor achievement in which field?', a: 'Broadway theater', d: ['Film', 'Television', 'Recorded music'] },
{ c: 'Behind the Scenes', t: 1, q: 'On which Los Angeles street are stars bearing celebrities\' names set into the sidewalk?', a: 'Hollywood Boulevard', d: ['Sunset Boulevard', 'Rodeo Drive', 'Mulholland Drive'] },

{ c: 'Movies', t: 2, q: 'In Jurassic Park, which dinosaurs stalk the children through the kitchen?', a: 'Velociraptors', d: ['A Tyrannosaurus', 'Dilophosaurs', 'Triceratops'] },
{ c: 'Television', t: 2, q: 'In Seinfeld, what is the name of the mailman Jerry greets with a sour "Hello"?', a: 'Newman', d: ['Kramer', 'Puddy', 'Babu'] },
{ c: 'Actors & Directors', t: 2, q: 'Which director made When Harry Met Sally and Stand by Me?', a: 'Rob Reiner', d: ['Nora Ephron', 'Garry Marshall', 'Ivan Reitman'] },
{ c: 'Awards & Box Office', t: 2, q: 'Which singer won Best Actress for playing a Brooklyn widow in Moonstruck?', a: 'Cher', d: ['Bette Midler', 'Barbra Streisand', 'Madonna'] },
{ c: 'Behind the Scenes', t: 2, q: 'Which studio, under the name it carried from 1935 to 2020, had a logo with searchlights sweeping across a monument bearing its name?', a: '20th Century Fox', d: ['MGM', 'Paramount', 'Columbia Pictures'] },

{ c: 'Movies', t: 3, q: 'How does Goodfellas end for Henry Hill?', a: 'He enters witness protection', d: ['He is shot by Tommy', 'He dies in prison', 'He flees to Italy'] },
{ c: 'Television', t: 3, q: 'Which British sitcom centered on the socially ambitious Hyacinth Bucket?', a: 'Keeping Up Appearances', d: ['Butterflies', 'Absolutely Fabulous', 'To the Manor Born'], from: 'script:d08q12' },
{ c: 'Actors & Directors', t: 3, q: 'Which actor played Atticus Finch in the film of To Kill a Mockingbird?', a: 'Gregory Peck', d: ['Spencer Tracy', 'Henry Fonda', 'James Stewart'], from: 'script:d08q13' },
{ c: 'Awards & Box Office', t: 3, q: 'Which film set on a colonial Kenyan coffee farm won Best Picture at the 1986 ceremony?', a: 'Out of Africa', d: ['Witness', 'The Color Purple', 'Prizzi\'s Honor'], from: 'script:d18q14' },
{ c: 'Behind the Scenes', t: 3, q: 'On a film crew, what is the best boy?', a: 'The chief assistant to the gaffer or key grip', d: ['The youngest member of the cast', 'The director\'s personal driver', 'The head of catering'] },

{ c: 'Movies', t: 4, q: 'What is John Wayne\'s character searching for in The Searchers?', a: 'His abducted niece', d: ['A lost herd', 'A gold mine', 'A stolen army payroll'], from: 'script:d12q16' },
{ c: 'Television', t: 4, q: 'Which series followed the Shelby family in Birmingham after the First World War?', a: 'Peaky Blinders', d: ['Gangs of London', 'Ripper Street', 'Boardwalk Empire'], from: 'script:d27q17' },
{ c: 'Actors & Directors', t: 4, q: 'Which actor played the Man with No Name in the Sergio Leone dollars trilogy?', a: 'Clint Eastwood', d: ['Lee Van Cleef', 'Charles Bronson', 'Franco Nero'], from: 'script:d22q18' },
{ c: 'Awards & Box Office', t: 4, q: 'Which Billy Wilder film won Best Picture at the 1961 ceremony?', a: 'The Apartment', d: ['Elmer Gantry', 'The Alamo', 'Sons and Lovers'], from: 'script:d11q19' },
{ c: 'Behind the Scenes', t: 4, q: 'Which 1995 manifesto banned added lighting, imported props and non-diegetic music?', a: 'Dogme 95', d: ['Italian neorealism', 'Cinema Novo', 'The French New Wave'], from: 'script:d22q20' },

{ c: 'Movies', t: 5, q: 'What journey do the elderly couple make in Tokyo Story?', a: 'They travel to Tokyo to visit their grown children', d: ['They move into a temple', 'They return to their birthplace', 'They emigrate to America'], from: 'script:d08q21' },
{ c: 'Television', t: 5, q: 'Which 1963 British series opened with two teachers following a pupil into a junkyard?', a: 'Doctor Who', d: ['Out of the Unknown', 'A for Andromeda', 'The Quatermass Experiment'], from: 'script:d18q22' },
{ c: 'Actors & Directors', t: 5, q: 'Which eleven year old won a supporting Academy Award for The Piano?', a: 'Anna Paquin', d: ['Tatum O\'Neal', 'Quvenzhane Wallis', 'Mary Badham'], from: 'script:d16q23' },
{ c: 'Awards & Box Office', t: 5, q: 'Which musical adapted from a Dickens novel won Best Picture at the 1969 ceremony?', a: 'Oliver!', d: ['Romeo and Juliet', 'The Lion in Winter', 'Funny Girl'], from: 'script:d15q24' },
{ c: 'Behind the Scenes', t: 5, q: 'Which Abel Gance silent epic did Kevin Brownlow spend decades restoring?', a: 'Napoleon', d: ['Metropolis', 'Intolerance', 'Greed'], from: 'script:d19q25' },
],

// ── Day 82 ────────────────────────────────────────────────────────────
[
{ c: 'Movies', t: 1, q: 'In Toy Story 2, what is the name of Woody\'s horse?', a: 'Bullseye', d: ['Trigger', 'Silver', 'Scout'] },
{ c: 'Television', t: 1, q: 'In The Simpsons, what color is Marge\'s towering hair?', a: 'Blue', d: ['Green', 'Red', 'Black'] },
{ c: 'Actors & Directors', t: 1, q: 'Which actor played the gentle giant Hagrid in the Harry Potter films?', a: 'Robbie Coltrane', d: ['Brendan Gleeson', 'Michael Gambon', 'Richard Harris'] },
{ c: 'Awards & Box Office', t: 1, q: 'Which awards show, voted on by children, is known for sliming celebrities with green goo?', a: 'The Kids\' Choice Awards', d: ['The Teen Choice Awards', 'The People\'s Choice Awards', 'The Daytime Emmys'] },
{ c: 'Behind the Scenes', t: 1, q: 'Which studio\'s best-known cartoon mascot is a mouse named Mickey?', a: 'Disney', d: ['Warner Bros.', 'Universal', 'DreamWorks'] },

{ c: 'Movies', t: 2, q: 'In Up, what is the name of the eager young Wilderness Explorer who stows away on Carl\'s house?', a: 'Russell', d: ['Kevin', 'Dug', 'Charles'] },
{ c: 'Television', t: 2, q: 'In Friends, what is the name of Ross\'s pet capuchin monkey?', a: 'Marcel', d: ['Bobo', 'Hugsy', 'Clyde'] },
{ c: 'Actors & Directors', t: 2, q: 'Which comedian created and starred as the spy Austin Powers?', a: 'Mike Myers', d: ['Dana Carvey', 'Steve Martin', 'Martin Short'] },
{ c: 'Awards & Box Office', t: 2, q: 'Which actor won Best Actor for playing a reclusive English teacher in The Whale?', a: 'Brendan Fraser', d: ['Austin Butler', 'Colin Farrell', 'Bill Nighy'] },
{ c: 'Behind the Scenes', t: 2, q: 'Which animation studio, known for its yellow Minions, made Despicable Me?', a: 'Illumination', d: ['Pixar', 'DreamWorks Animation', 'Blue Sky Studios'] },

{ c: 'Movies', t: 3, q: 'In The Graduate, what one word of career advice is Benjamin given at his party?', a: 'Plastics', d: ['Computers', 'Insurance', 'Real estate'] },
{ c: 'Television', t: 3, q: 'Which spy series starred Jennifer Garner as the double agent Sydney Bristow?', a: 'Alias', d: ['La Femme Nikita', 'Nikita', 'Covert Affairs'] },
{ c: 'Actors & Directors', t: 3, q: 'Which actor starred in Raging Bull, Taxi Driver and Goodfellas for Martin Scorsese?', a: 'Robert De Niro', d: ['Harvey Keitel', 'Joe Pesci', 'Ray Liotta'], from: 'script:d12q13' },
{ c: 'Awards & Box Office', t: 3, q: 'Which Steven Spielberg film won Best Picture for 1993?', a: 'Schindler\'s List', d: ['The Fugitive', 'In the Name of the Father', 'Jurassic Park'], from: 'script:d12q14' },
{ c: 'Behind the Scenes', t: 3, q: 'What is a rack focus?', a: 'Shifting focus from one subject to another within a shot', d: ['Adjusting exposure while rolling', 'Changing lenses mid-take', 'Moving the camera along a track'], from: 'script:d25q15' },

{ c: 'Movies', t: 4, q: 'In Some Like It Hot, what does Osgood say when Jerry finally reveals he is a man?', a: 'Nobody\'s perfect', d: ['Well, nobody\'s fooled', 'I knew it all along', 'That changes nothing'] },
{ c: 'Television', t: 4, q: 'Which 1990s sitcom was set at a fictional New York radio station called WNYX?', a: 'NewsRadio', d: ['WKRP in Cincinnati', 'Murphy Brown', 'Wings'] },
{ c: 'Actors & Directors', t: 4, q: 'Which Danish director made The Passion of Joan of Arc?', a: 'Carl Theodor Dreyer', d: ['Abel Gance', 'Victor Sjostrom', 'Jean Epstein'], from: 'script:d21q18' },
{ c: 'Awards & Box Office', t: 4, q: 'Which film about Mozart and his jealous rival won Best Picture at the 1985 ceremony?', a: 'Amadeus', d: ['Places in the Heart', 'A Passage to India', 'The Killing Fields'], from: 'script:d20q19' },
{ c: 'Behind the Scenes', t: 4, q: 'What is a long take?', a: 'A single shot running an unusually long time without a cut', d: ['A wide shot covering a whole scene', 'A shot with two actors in frame', 'A close detail cut into a scene'], from: 'script:d27q20' },

{ c: 'Movies', t: 5, q: 'In Casablanca, what are the papers everyone is chasing called?', a: 'Letters of transit', d: ['Safe conducts', 'Diplomatic passports', 'Travel warrants'], from: 'script:d02q21' },
{ c: 'Television', t: 5, q: 'Which 1977 miniseries about an American family enslaved over generations drew record audiences?', a: 'Roots', d: ['Holocaust', 'Shogun', 'Rich Man, Poor Man'], from: 'script:d11q22' },
{ c: 'Actors & Directors', t: 5, q: 'Which Soviet director made Come and See?', a: 'Elem Klimov', d: ['Aleksei German', 'Andrei Konchalovsky', 'Larisa Shepitko'], from: 'script:d15q23' },
{ c: 'Awards & Box Office', t: 5, q: 'Which Billy Wilder film about an alcoholic writer won Best Picture at the 1946 ceremony?', a: 'The Lost Weekend', d: ['Mildred Pierce', 'The Bells of St. Mary\'s', 'Spellbound'], from: 'script:d19q24' },
{ c: 'Behind the Scenes', t: 5, q: 'What was the Motion Picture Patents Company, formed in 1908?', a: 'A trust controlling film patents and distribution', d: ['A censorship board', 'The first talent agency', 'A national cinema chain'], from: 'script:d22q25' },
],

// ── Day 83 ────────────────────────────────────────────────────────────
[
{ c: 'Movies', t: 1, q: 'In Finding Nemo, what kind of animal is the laid-back surfer Crush?', a: 'A sea turtle', d: ['A shark', 'A dolphin', 'A seal'] },
{ c: 'Television', t: 1, q: 'Which 1990s sitcom starred Tim Allen as the accident-prone host of a show called Tool Time?', a: 'Home Improvement', d: ['Last Man Standing', 'Coach', 'Family Matters'] },
{ c: 'Actors & Directors', t: 1, q: 'Which actor played the inventor Doc Brown in Back to the Future?', a: 'Christopher Lloyd', d: ['Gene Wilder', 'Jeff Goldblum', 'Rick Moranis'] },
{ c: 'Awards & Box Office', t: 1, q: 'How are the winners of the People\'s Choice Awards decided?', a: 'By public vote', d: ['By film critics', 'By Academy members', 'By studio executives'] },
{ c: 'Behind the Scenes', t: 1, q: 'What is a flashback in a film?', a: 'A scene showing events from earlier in the story', d: ['A scene shot with a camera flash', 'A preview of the next film', 'A scene repeated in slow motion'] },

{ c: 'Movies', t: 2, q: 'In The Breakfast Club, on which day of the week do the five students serve detention?', a: 'Saturday', d: ['Friday', 'Sunday', 'Monday'] },
{ c: 'Television', t: 2, q: 'In Seinfeld, what is Kramer\'s first name?', a: 'Cosmo', d: ['Kenny', 'Morty', 'Frank'] },
{ c: 'Actors & Directors', t: 2, q: 'Which actor played the paleontologist Alan Grant in Jurassic Park?', a: 'Sam Neill', d: ['Jeff Goldblum', 'Bob Peck', 'Richard Attenborough'] },
{ c: 'Awards & Box Office', t: 2, q: 'Which actor won Best Actor for playing Winston Churchill in Darkest Hour?', a: 'Gary Oldman', d: ['Brian Cox', 'John Lithgow', 'Timothy Spall'] },
{ c: 'Behind the Scenes', t: 2, q: 'Which studio\'s logo shows its name circling a spinning globe?', a: 'Universal', d: ['Columbia Pictures', 'Warner Bros.', 'Paramount'] },

{ c: 'Movies', t: 3, q: 'In The Usual Suspects, who is revealed to be Keyser Soze?', a: 'Verbal Kint', d: ['Dean Keaton', 'Dave Kujan', 'Fenster'] },
{ c: 'Television', t: 3, q: 'Which 1980s detective series paired Cybill Shepherd with Bruce Willis?', a: 'Moonlighting', d: ['Remington Steele', 'Hart to Hart', 'Scarecrow and Mrs. King'] },
{ c: 'Actors & Directors', t: 3, q: 'Which actor played the title role in Lawrence of Arabia?', a: 'Peter O\'Toole', d: ['Omar Sharif', 'Alec Guinness', 'Anthony Quinn'], from: 'script:d26q13' },
{ c: 'Awards & Box Office', t: 3, q: 'What does the knight on the Oscar statuette hold in his hands?', a: 'A sword', d: ['A shield', 'A torch', 'A scroll'] },
{ c: 'Behind the Scenes', t: 3, q: 'What is a second unit?', a: 'A crew filming inserts, stunts and scenery apart from the main shoot', d: ['The understudy cast', 'The publicity department', 'The editing team'], from: 'script:d22q15' },

{ c: 'Movies', t: 4, q: 'What is tattooed across the preacher\'s knuckles in The Night of the Hunter?', a: 'LOVE and HATE', d: ['GOOD and EVIL', 'HOPE and FEAR', 'LIFE and DEATH'], from: 'script:d21q16' },
{ c: 'Television', t: 4, q: 'Which HBO series followed a family who ran a funeral home?', a: 'Six Feet Under', d: ['In Treatment', 'Enlightened', 'Big Love'], from: 'script:d19q17' },
{ c: 'Actors & Directors', t: 4, q: 'Which actor directed himself in the 1961 western One-Eyed Jacks, the only film he ever directed?', a: 'Marlon Brando', d: ['Kirk Douglas', 'Gregory Peck', 'Paul Newman'] },
{ c: 'Awards & Box Office', t: 4, q: 'Which film took the top prize at the 1953 ceremony, the first Academy Awards to be televised?', a: 'The Greatest Show on Earth', d: ['From Here to Eternity', 'High Noon', 'Singin\' in the Rain'], from: 'script:d07q19' },
{ c: 'Behind the Scenes', t: 4, q: 'For which film did Bernard Herrmann write a score performed entirely by strings?', a: 'Psycho', d: ['Vertigo', 'Cape Fear', 'Taxi Driver'], from: 'script:d06q20' },

{ c: 'Movies', t: 5, q: 'Over how many days does Jeanne Dielman take place?', a: 'Three', d: ['Ten', 'Seven', 'One'], from: 'script:d27q21' },
{ c: 'Television', t: 5, q: 'Which 1976 BBC serial adapted Robert Graves\'s novels about a stammering Roman emperor?', a: 'I, Claudius', d: ['The Caesars', 'The Cleopatras', 'The Borgias'], from: 'script:d26q22' },
{ c: 'Actors & Directors', t: 5, q: 'Which actor played the vampire in the 1922 silent film Nosferatu?', a: 'Max Schreck', d: ['Conrad Veidt', 'Bela Lugosi', 'Paul Wegener'], from: 'script:d07q23' },
{ c: 'Awards & Box Office', t: 5, q: 'Which film was the first sequel to win Best Picture?', a: 'The Godfather Part II', d: ['Rocky II', 'Aliens', 'The Return of the King'], from: 'script:d03q24' },
{ c: 'Behind the Scenes', t: 5, q: 'Which 1927 German film had long-lost footage rediscovered in Buenos Aires in 2008?', a: 'Metropolis', d: ['Nosferatu', 'The Cabinet of Dr. Caligari', 'Faust'], from: 'script:d10q25' },
],

// ── Day 84 ────────────────────────────────────────────────────────────
[
{ c: 'Movies', t: 1, q: 'What is the code number of the British secret agent James Bond?', a: '007', d: ['006', '009', '001'] },
{ c: 'Television', t: 1, q: 'Which cartoon family lives in a space-age future with a robot maid named Rosie?', a: 'The Jetsons', d: ['The Flintstones', 'Futurama', 'Lost in Space'] },
{ c: 'Actors & Directors', t: 1, q: 'Which actor played Spock in the original Star Trek series?', a: 'Leonard Nimoy', d: ['William Shatner', 'DeForest Kelley', 'George Takei'] },
{ c: 'Awards & Box Office', t: 1, q: 'Which review website scores films with a Tomatometer?', a: 'Rotten Tomatoes', d: ['IMDb', 'Metacritic', 'Letterboxd'] },
{ c: 'Behind the Scenes', t: 1, q: 'What are subtitles?', a: 'Translated or transcribed dialogue shown at the bottom of the screen', d: ['The names of the cast shown at the start', 'Titles of each chapter of a film', 'Notes printed on the poster'] },

{ c: 'Movies', t: 2, q: 'In Raiders of the Lost Ark, which creatures does Indiana Jones fear most?', a: 'Snakes', d: ['Spiders', 'Rats', 'Bats'] },
{ c: 'Television', t: 2, q: 'In Game of Thrones, what are the icy undead invaders from beyond the Wall called?', a: 'The White Walkers', d: ['The Unsullied', 'The Faceless Men', 'The Night\'s Watch'] },
{ c: 'Actors & Directors', t: 2, q: 'Which actress played Wednesday Addams in the 1991 film The Addams Family?', a: 'Christina Ricci', d: ['Winona Ryder', 'Natalie Portman', 'Kirsten Dunst'] },
{ c: 'Awards & Box Office', t: 2, q: 'Which actor won Best Supporting Actor for Jerry Maguire, shouting "Show me the money!"?', a: 'Cuba Gooding Jr.', d: ['Jamie Foxx', 'Will Smith', 'Don Cheadle'] },
{ c: 'Behind the Scenes', t: 2, q: 'In horror filmmaking, what is found footage?', a: 'A style presented as if recorded by the characters themselves', d: ['Scenes rescued from damaged film', 'Archive newsreels cut into a story', 'Footage left over from another film'] },

{ c: 'Movies', t: 3, q: 'In The Silence of the Lambs, what does Hannibal Lecter say he ate a census taker\'s liver with?', a: 'Fava beans and a nice Chianti', d: ['Onions and a fine Bordeaux', 'Mashed potatoes and a cold beer', 'Rice and a glass of port'] },
{ c: 'Television', t: 3, q: 'In M*A*S*H, what is the real name of the surgeon known as Hawkeye?', a: 'Benjamin Franklin Pierce', d: ['John McIntyre', 'Charles Emerson Winchester', 'B. J. Hunnicutt'] },
{ c: 'Actors & Directors', t: 3, q: 'Which actress won Best Actress for Silver Linings Playbook?', a: 'Jennifer Lawrence', d: ['Anne Hathaway', 'Amy Adams', 'Emma Stone'], from: 'script:d22q13' },
{ c: 'Awards & Box Office', t: 3, q: 'Which film about veterans from a Pennsylvania steel town won Best Picture at the 1979 ceremony?', a: 'The Deer Hunter', d: ['Coming Home', 'Midnight Express', 'Heaven Can Wait'], from: 'script:d20q14' },
{ c: 'Behind the Scenes', t: 3, q: 'What is a Dutch angle?', a: 'A shot with the camera tilted so the horizon slants', d: ['A shot from directly overhead', 'A shot through a doorway', 'A shot held for over a minute'] },

{ c: 'Movies', t: 4, q: 'Where do the outlaws flee to in The Wild Bunch?', a: 'Into Mexico', d: ['Into Canada', 'Into Cuba', 'Into Bolivia'], from: 'script:d22q16' },
{ c: 'Television', t: 4, q: 'Which series opened each episode with \'Woke Up This Morning\' by Alabama 3?', a: 'The Sopranos', d: ['Boardwalk Empire', 'The Shield', 'Deadwood'], from: 'script:d07q17' },
{ c: 'Actors & Directors', t: 4, q: 'Which actress played Bonnie Parker in the 1967 film Bonnie and Clyde?', a: 'Faye Dunaway', d: ['Julie Christie', 'Ann-Margret', 'Jane Fonda'] },
{ c: 'Awards & Box Office', t: 4, q: 'Which film set in imperial China won Best Picture at the 1988 ceremony?', a: 'The Last Emperor', d: ['Moonstruck', 'Fatal Attraction', 'Broadcast News'], from: 'script:d25q19' },
{ c: 'Behind the Scenes', t: 4, q: 'What is a plate in visual effects work?', a: 'Background footage that other elements are composited onto', d: ['A reel of assembled dailies', 'A printed frame used for reference', 'A board naming the take'], from: 'script:d19q20' },

{ c: 'Movies', t: 5, q: 'In Bicycle Thieves, what does the father need the bicycle for?', a: 'A job putting up posters', d: ['Delivering bread', 'Selling vegetables', 'Racing'], from: 'script:d09q21' },
{ c: 'Television', t: 5, q: 'Which live 1950s anthology series first broadcast Twelve Angry Men?', a: 'Studio One', d: ['Playhouse 90', 'The Philco Television Playhouse', 'Goodyear Television Playhouse'], from: 'script:d16q22' },
{ c: 'Actors & Directors', t: 5, q: 'Which Soviet filmmaker made the documentary Man with a Movie Camera?', a: 'Dziga Vertov', d: ['Sergei Eisenstein', 'Lev Kuleshov', 'Esfir Shub'], from: 'script:d06q23' },
{ c: 'Awards & Box Office', t: 5, q: 'Which Alfred Hitchcock film won the Academy Award for Best Picture?', a: 'Rebecca', d: ['Spellbound', 'Notorious', 'Suspicion'], from: 'script:d25q24' },
{ c: 'Behind the Scenes', t: 5, q: 'Who invented the Steadicam?', a: 'Garrett Brown', d: ['John Dykstra', 'Vilmos Zsigmond', 'Douglas Trumbull'], from: 'script:d06q25' },
],

// ── Day 85 ────────────────────────────────────────────────────────────
[
{ c: 'Movies', t: 1, q: 'In Monsters, Inc., what nickname does Sulley give the little girl who wanders into Monstropolis?', a: 'Boo', d: ['Daisy', 'Penny', 'Lulu'] },
{ c: 'Television', t: 1, q: 'Which 1990s sitcom followed Zack Morris and his friends at Bayside High?', a: 'Saved by the Bell', d: ['Boy Meets World', 'California Dreams', 'Hang Time'] },
{ c: 'Actors & Directors', t: 1, q: 'Which actor played the vampire Edward Cullen in Twilight?', a: 'Robert Pattinson', d: ['Taylor Lautner', 'Kellan Lutz', 'Zac Efron'] },
{ c: 'Awards & Box Office', t: 1, q: 'What is it called when a film skips theaters and goes straight to home video?', a: 'A direct-to-video release', d: ['A limited release', 'A wide release', 'A roadshow release'] },
{ c: 'Behind the Scenes', t: 1, q: 'Which film genre is set on the American frontier with cowboys, outlaws and sheriffs?', a: 'The western', d: ['The film noir', 'The musical', 'The epic'] },

{ c: 'Movies', t: 2, q: 'Which Jane Austen novel is the 1995 comedy Clueless loosely based on?', a: 'Emma', d: ['Pride and Prejudice', 'Persuasion', 'Sense and Sensibility'] },
{ c: 'Television', t: 2, q: 'Which Netflix miniseries follows an orphaned chess prodigy named Beth Harmon?', a: 'The Queen\'s Gambit', d: ['The Crown', 'Unorthodox', 'Godless'] },
{ c: 'Actors & Directors', t: 2, q: 'Which actress played Trinity in The Matrix?', a: 'Carrie-Anne Moss', d: ['Monica Bellucci', 'Jada Pinkett Smith', 'Gloria Foster'] },
{ c: 'Awards & Box Office', t: 2, q: 'Which actor won Best Supporting Actor as the marshal chasing Harrison Ford in The Fugitive?', a: 'Tommy Lee Jones', d: ['Ralph Fiennes', 'Pete Postlethwaite', 'John Malkovich'] },
{ c: 'Behind the Scenes', t: 2, q: 'What did the Hollywood sign spell out when it was first put up in 1923?', a: 'Hollywoodland', d: ['Hollywood Hills', 'Hollywood Studios', 'Holly Wood Estates'] },

{ c: 'Movies', t: 3, q: 'In Pulp Fiction, what do Vincent and Mia win at Jack Rabbit Slim\'s?', a: 'A dance contest trophy', d: ['A milkshake eating contest', 'A raffle for a car', 'A karaoke prize'] },
{ c: 'Television', t: 3, q: 'Which sitcom starred Robin Williams as an alien from the planet Ork?', a: 'Mork & Mindy', d: ['ALF', 'My Favorite Martian', '3rd Rock from the Sun'] },
{ c: 'Actors & Directors', t: 3, q: 'Which director made Lost in Translation?', a: 'Sofia Coppola', d: ['Greta Gerwig', 'Jane Campion', 'Kathryn Bigelow'] },
{ c: 'Awards & Box Office', t: 3, q: 'Which film about the Indian independence leader won Best Picture at the 1983 ceremony?', a: 'Gandhi', d: ['Tootsie', 'The Verdict', 'E.T. the Extra-Terrestrial'], from: 'script:d22q14' },
{ c: 'Behind the Scenes', t: 3, q: 'Which crew member heads the electrical department and is responsible for lighting?', a: 'The gaffer', d: ['The foley artist', 'The dolly grip', 'The script supervisor'], from: 'script:d08q15' },

{ c: 'Movies', t: 4, q: 'What does the last shot of The 400 Blows freeze on?', a: 'The boy\'s face at the sea', d: ['A burning school', 'A moving train', 'A prison gate'], from: 'script:d23q16' },
{ c: 'Television', t: 4, q: 'Which 1960s British series paired the bowler-hatted John Steed with a series of partners?', a: 'The Avengers', d: ['The Champions', 'Danger Man', 'The Saint'], from: 'script:d15q17' },
{ c: 'Actors & Directors', t: 4, q: 'Which actor appeared in both The Godfather and Apocalypse Now?', a: 'Robert Duvall', d: ['Frederic Forrest', 'Harvey Keitel', 'Sam Bottoms'], from: 'script:d11q18' },
{ c: 'Awards & Box Office', t: 4, q: 'Which film set partly in the North African desert won Best Picture at the 1997 ceremony?', a: 'The English Patient', d: ['Shine', 'Fargo', 'Jerry Maguire'], from: 'script:d19q19' },
{ c: 'Behind the Scenes', t: 4, q: 'Which technological change made the French New Wave practical to shoot?', a: 'Lightweight portable cameras and faster film stock', d: ['Stereo magnetic sound', 'The zoom lens', 'Digital editing'], from: 'script:d12q20' },

{ c: 'Movies', t: 5, q: 'What did Jacques Tati build for the production of Playtime?', a: 'A full-scale modern city set', d: ['A glass train', 'A rotating apartment', 'An underwater tank'], from: 'script:d12q21' },
{ c: 'Television', t: 5, q: 'What is the hotel in Twin Peaks called?', a: 'The Great Northern', d: ['The Fat Trout', 'The Silver Mustang', 'The Blue Pine'], from: 'script:d02q22' },
{ c: 'Actors & Directors', t: 5, q: 'Which actor played the lead role in both Seven Samurai and Yojimbo?', a: 'Toshiro Mifune', d: ['Chishu Ryu', 'Takashi Shimura', 'Tatsuya Nakadai'], from: 'script:d26q23' },
{ c: 'Awards & Box Office', t: 5, q: 'Who was the first woman nominated for the Academy Award for Best Director?', a: 'Lina Wertmuller', d: ['Kathryn Bigelow', 'Sofia Coppola', 'Jane Campion'], from: 'script:d14q24' },
{ c: 'Behind the Scenes', t: 5, q: 'What was Poverty Row in classic Hollywood?', a: 'The cluster of small studios making low-budget films', d: ['A backlot slum set', 'A district of talent agents', 'The extras\' union'], from: 'script:d14q25' },
],

// ── Day 86 ────────────────────────────────────────────────────────────
[
{ c: 'Movies', t: 1, q: 'In Toy Story, what kind of toy is the nervous Rex?', a: 'A dinosaur', d: ['A dragon', 'A robot', 'A shark'] },
{ c: 'Television', t: 1, q: 'Which sitcom starred Will Smith as a Philadelphia teen sent to live with rich relatives in Los Angeles?', a: 'The Fresh Prince of Bel-Air', d: ['Family Matters', 'Martin', 'Living Single'] },
{ c: 'Actors & Directors', t: 1, q: 'Which actor played the Hulk in the 2012 film The Avengers?', a: 'Mark Ruffalo', d: ['Edward Norton', 'Eric Bana', 'Chris Hemsworth'] },
{ c: 'Awards & Box Office', t: 1, q: 'What is a matinee at the movie theater?', a: 'A daytime screening', d: ['A midnight screening', 'A premiere for critics', 'A screening with live music'] },
{ c: 'Behind the Scenes', t: 1, q: 'Which material was motion picture film made from before digital cameras took over?', a: 'Celluloid', d: ['Vinyl', 'Paper', 'Glass'] },

{ c: 'Movies', t: 2, q: 'In Big (1988), what do Josh and his boss play together with their feet at FAO Schwarz?', a: 'A giant floor piano', d: ['A dance mat game', 'A pinball machine', 'A drum kit'] },
{ c: 'Television', t: 2, q: 'In the American version of The Office, what is the name of the awards Michael hosts for his staff?', a: 'The Dundies', d: ['The Scrantons', 'The Mifflins', 'The Schrutes'] },
{ c: 'Actors & Directors', t: 2, q: 'Which director made Home Alone and the first two Harry Potter films?', a: 'Chris Columbus', d: ['Ron Howard', 'Joe Johnston', 'Barry Levinson'] },
{ c: 'Awards & Box Office', t: 2, q: 'Which actor won Best Actor for playing a suicidal alcoholic in Leaving Las Vegas?', a: 'Nicolas Cage', d: ['Sean Penn', 'Anthony Hopkins', 'Richard Dreyfuss'] },
{ c: 'Behind the Scenes', t: 2, q: 'Which crew member, also called the director of photography, shapes a film\'s lighting and camera work?', a: 'The cinematographer', d: ['The gaffer', 'The editor', 'The production designer'] },

{ c: 'Movies', t: 3, q: 'In Pulp Fiction, what does Vincent say a Quarter Pounder with Cheese is called in Paris?', a: 'A Royale with Cheese', d: ['A Le Big Mac', 'A Petit Burger', 'A Cheese Magnifique'] },
{ c: 'Television', t: 3, q: 'Which comedy was set at Sacred Heart Hospital?', a: 'Scrubs', d: ['Grey\'s Anatomy', 'Nurse Jackie', 'House'], from: 'script:d12q12' },
{ c: 'Actors & Directors', t: 3, q: 'Which actor played an out-of-work actor who poses as a woman to land a soap opera role in Tootsie?', a: 'Dustin Hoffman', d: ['Robin Williams', 'Jack Lemmon', 'Tony Curtis'] },
{ c: 'Awards & Box Office', t: 3, q: 'Which film about a populist Southern politician won Best Picture at the 1950 ceremony?', a: 'All the King\'s Men', d: ['Battleground', 'A Letter to Three Wives', 'Twelve O\'Clock High'] },
{ c: 'Behind the Scenes', t: 3, q: 'In the film business, what is a one-sheet?', a: 'The standard theatrical poster', d: ['A one-page plot summary', 'A single day\'s schedule', 'A contract for one film'] },

{ c: 'Movies', t: 4, q: 'What is the profession of the title character in Nights of Cabiria?', a: 'A prostitute', d: ['A seamstress', 'A dancer', 'A market trader'], from: 'script:d18q16' },
{ c: 'Television', t: 4, q: 'Which series followed a Kentucky United States marshal named Raylan Givens?', a: 'Justified', d: ['Longmire', 'Ozark', 'Banshee'], from: 'script:d26q17' },
{ c: 'Actors & Directors', t: 4, q: 'Which German director made both Sunrise and Nosferatu?', a: 'F. W. Murnau', d: ['Fritz Lang', 'Robert Wiene', 'G. W. Pabst'], from: 'script:d12q18' },
{ c: 'Awards & Box Office', t: 4, q: 'Which director has won the Academy Award for Best Director four times, more than anyone else?', a: 'John Ford', d: ['Steven Spielberg', 'William Wyler', 'Frank Capra'], from: 'script:d15q19' },
{ c: 'Behind the Scenes', t: 4, q: 'What did the crew of The Godfather use for the severed horse\'s head?', a: 'A real head from a dog food plant', d: ['A taxidermy mount', 'A latex cast', 'A carved wooden prop'], from: 'script:d02q20' },

{ c: 'Movies', t: 5, q: 'What journey frames Wild Strawberries?', a: 'An elderly professor driving to receive an honorary degree', d: ['A family voyage to America', 'A pilgrimage to a monastery', 'A soldier returning from the front'], from: 'script:d10q21' },
{ c: 'Television', t: 5, q: 'What are the call letters of the radio station where Frasier Crane broadcasts?', a: 'KACL', d: ['KBHR', 'WNYX', 'WKRP'], from: 'script:d06q22' },
{ c: 'Actors & Directors', t: 5, q: 'Which director made The Rules of the Game in 1939?', a: 'Jean Renoir', d: ['Marcel Carne', 'Julien Duvivier', 'Rene Clair'], from: 'script:d12q23' },
{ c: 'Awards & Box Office', t: 5, q: 'Which film was the first sound picture to win the top Academy Award?', a: 'The Broadway Melody', d: ['All Quiet on the Western Front', 'Cimarron', 'Grand Hotel'], from: 'script:d23q24' },
{ c: 'Behind the Scenes', t: 5, q: 'Which widescreen process did 20th Century Fox introduce in 1953 with The Robe?', a: 'CinemaScope', d: ['VistaVision', 'Cinerama', 'Todd-AO'], from: 'script:d07q25' },
],

// ── Day 87 ────────────────────────────────────────────────────────────
[
{ c: 'Movies', t: 1, q: 'In Spider-Man (2002), what does Uncle Ben tell Peter comes with great power?', a: 'Great responsibility', d: ['Great danger', 'Great fame', 'Great sacrifice'] },
{ c: 'Television', t: 1, q: 'Which sitcom starred Fran Drescher as Fran Fine, who cares for a Broadway producer\'s children?', a: 'The Nanny', d: ['Who\'s the Boss?', 'Mr. Belvedere', 'Charles in Charge'] },
{ c: 'Actors & Directors', t: 1, q: 'Which actor voiced the grown-up Simba in the 1994 film The Lion King?', a: 'Matthew Broderick', d: ['Nathan Lane', 'Jonathan Taylor Thomas', 'Jeremy Irons'] },
{ c: 'Awards & Box Office', t: 1, q: 'What is the short address a winner gives on stage at the Oscars called?', a: 'An acceptance speech', d: ['A curtain call', 'A keynote', 'A eulogy'] },
{ c: 'Behind the Scenes', t: 1, q: 'What is the first public showing of a new film, often with a red carpet, called?', a: 'The premiere', d: ['The wrap', 'The pitch', 'The screen test'] },

{ c: 'Movies', t: 2, q: 'In Jaws, what does Chief Brody tell Quint they are going to need after first seeing the shark?', a: 'A bigger boat', d: ['A bigger gun', 'More bait', 'The Coast Guard'] },
{ c: 'Television', t: 2, q: 'In Friends, what is Chandler\'s last name?', a: 'Bing', d: ['Geller', 'Tribbiani', 'Green'] },
{ c: 'Actors & Directors', t: 2, q: 'Which director made The Breakfast Club, Sixteen Candles and Ferris Bueller\'s Day Off?', a: 'John Hughes', d: ['Rob Reiner', 'Joel Schumacher', 'Cameron Crowe'] },
{ c: 'Awards & Box Office', t: 2, q: 'Which actress won Best Actress for playing a boxer in Million Dollar Baby?', a: 'Hilary Swank', d: ['Charlize Theron', 'Annette Bening', 'Imelda Staunton'] },
{ c: 'Behind the Scenes', t: 2, q: 'What is a cliffhanger?', a: 'An ending that leaves the story unresolved at a moment of suspense', d: ['A stunt filmed on a mountain', 'A scene shot from a great height', 'A twist revealed in the first scene'] },

{ c: 'Movies', t: 3, q: 'In Rain Man, in which city does Raymond\'s card counting win the brothers a fortune?', a: 'Las Vegas', d: ['Reno', 'Atlantic City', 'Lake Tahoe'] },
{ c: 'Television', t: 3, q: 'In Cheers, what is the last name of the barfly Norm, greeted by name whenever he walks in?', a: 'Peterson', d: ['Clavin', 'Boyd', 'Malone'] },
{ c: 'Actors & Directors', t: 3, q: 'Which director made The Magnificent Seven, the western remake of Seven Samurai?', a: 'John Sturges', d: ['Howard Hawks', 'Delmer Daves', 'Budd Boetticher'], from: 'script:d18q13' },
{ c: 'Awards & Box Office', t: 3, q: 'Which film set in an Oregon psychiatric hospital won Best Picture at the 1976 ceremony?', a: 'One Flew Over the Cuckoo\'s Nest', d: ['Jaws', 'Barry Lyndon', 'Dog Day Afternoon'] },
{ c: 'Behind the Scenes', t: 3, q: 'What is the Academy ratio?', a: 'The roughly four by three frame standard of classic Hollywood', d: ['The ratio of footage shot to footage used', 'The share of ticket sales paid to theaters', 'The ratio of nominees to winners'], from: 'script:d18q15' },

{ c: 'Movies', t: 4, q: 'Whose point of view does Come and See follow?', a: 'A Belarusian boy', d: ['A partisan commander', 'A Russian nurse', 'A German officer'], from: 'script:d26q16' },
{ c: 'Television', t: 4, q: 'Which 1980s prime-time soap starred Jane Wyman as the ruthless head of a California wine country empire?', a: 'Falcon Crest', d: ['Dallas', 'Dynasty', 'Knots Landing'] },
{ c: 'Actors & Directors', t: 4, q: 'Which actor directed and starred in The Two Jakes, the sequel to Chinatown?', a: 'Jack Nicholson', d: ['Harvey Keitel', 'Warren Beatty', 'Robert Towne'], from: 'script:d19q18' },
{ c: 'Awards & Box Office', t: 4, q: 'Which mostly silent black and white film won Best Picture at the 2012 ceremony?', a: 'The Artist', d: ['Hugo', 'The Descendants', 'Midnight in Paris'], from: 'script:d08q19' },
{ c: 'Behind the Scenes', t: 4, q: 'Which 1967 crime film is usually taken as the opening of the New Hollywood era?', a: 'Bonnie and Clyde', d: ['The Graduate', 'Point Blank', 'Easy Rider'], from: 'script:d23q20' },

{ c: 'Movies', t: 5, q: 'Which creature is the central figure of Au Hasard Balthazar?', a: 'A donkey', d: ['A goat', 'A dog', 'A horse'], from: 'script:d15q21' },
{ c: 'Television', t: 5, q: 'Which anthology series did Rod Serling host after The Twilight Zone?', a: 'Night Gallery', d: ['The Outer Limits', 'One Step Beyond', 'Thriller'], from: 'script:d09q22' },
{ c: 'Actors & Directors', t: 5, q: 'Which actor played Jedediah Leland in Citizen Kane?', a: 'Joseph Cotten', d: ['Ray Collins', 'Paul Stewart', 'Everett Sloane'], from: 'script:d23q23' },
{ c: 'Awards & Box Office', t: 5, q: 'Which Jean Renoir film was the first in a language other than English nominated for Best Picture?', a: 'Grand Illusion', d: ['Bicycle Thieves', 'Z', 'Cries and Whispers'], from: 'script:d18q24' },
{ c: 'Behind the Scenes', t: 5, q: 'What did a film need the Production Code Administration\'s seal for until 1968?', a: 'Release through the major distributors', d: ['Color processing', 'Television broadcast', 'Export overseas'], from: 'script:d12q25' },
],

// ── Day 88 ────────────────────────────────────────────────────────────
[
{ c: 'Movies', t: 1, q: 'In the 1939 film of The Wizard of Oz, who melts when Dorothy throws water on her?', a: 'The Wicked Witch of the West', d: ['The Wicked Witch of the East', 'Glinda', 'Miss Gulch'] },
{ c: 'Television', t: 1, q: 'Which 1990s children\'s science show host was known for his lab coat and bow tie?', a: 'Bill Nye', d: ['Mr. Wizard', 'Steve Spangler', 'Mister Rogers'] },
{ c: 'Actors & Directors', t: 1, q: 'Which actress played Rey in Star Wars: The Force Awakens?', a: 'Daisy Ridley', d: ['Felicity Jones', 'Emilia Clarke', 'Keira Knightley'] },
{ c: 'Awards & Box Office', t: 1, q: 'What is the name of the British film awards often called the British Oscars?', a: 'The BAFTAs', d: ['The Oliviers', 'The Brits', 'The Ivors'] },
{ c: 'Behind the Scenes', t: 1, q: 'What is an album of a film\'s songs and music usually called?', a: 'The soundtrack', d: ['The score sheet', 'The playlist', 'The reel'] },

{ c: 'Movies', t: 2, q: 'In Gremlins, after what time must a mogwai never be fed?', a: 'Midnight', d: ['Sunset', 'Noon', 'Dawn'] },
{ c: 'Television', t: 2, q: 'Which 1980s series starred Tom Selleck as a private investigator in Hawaii?', a: 'Magnum, P.I.', d: ['Hawaii Five-O', 'Simon & Simon', 'Riptide'] },
{ c: 'Actors & Directors', t: 2, q: 'Which former child actor directed Apollo 13 and A Beautiful Mind?', a: 'Ron Howard', d: ['Rob Reiner', 'Barry Levinson', 'Penny Marshall'] },
{ c: 'Awards & Box Office', t: 2, q: 'Which actress won Best Supporting Actress for Fences, opposite Denzel Washington?', a: 'Viola Davis', d: ['Octavia Spencer', 'Naomie Harris', 'Michelle Williams'] },
{ c: 'Behind the Scenes', t: 2, q: 'Which studio did Steven Spielberg, Jeffrey Katzenberg and David Geffen found in 1994?', a: 'DreamWorks', d: ['Amblin', 'Miramax', 'Lionsgate'] },

{ c: 'Movies', t: 3, q: 'In Taxi Driver, which question does Travis Bickle ask his own reflection?', a: 'You talkin\' to me?', d: ['Are you looking at me?', 'Who do you think you are?', 'What are you waiting for?'] },
{ c: 'Television', t: 3, q: 'Which Netflix series follows the Byrde family laundering money at a Missouri lake resort?', a: 'Ozark', d: ['Bloodline', 'Narcos', 'Breaking Bad'] },
{ c: 'Actors & Directors', t: 3, q: 'Which actor starred in Rebel Without a Cause and died before Giant was released?', a: 'James Dean', d: ['Montgomery Clift', 'Marlon Brando', 'Sal Mineo'] },
{ c: 'Awards & Box Office', t: 3, q: 'Which actor won Best Actor for playing the title role in the 2019 film Joker?', a: 'Joaquin Phoenix', d: ['Adam Driver', 'Antonio Banderas', 'Jonathan Pryce'] },
{ c: 'Behind the Scenes', t: 3, q: 'Which term describes assembling shots into a rhythmic sequence that compresses time?', a: 'Montage', d: ['Coverage', 'Blocking', 'Foley'], from: 'script:d26q15' },

{ c: 'Movies', t: 4, q: 'What is the profession of Harry Caul in The Conversation?', a: 'A surveillance expert', d: ['A journalist', 'A priest', 'A locksmith'], from: 'script:d09q16' },
{ c: 'Television', t: 4, q: 'Which British soap opera has been set in the fictional Weatherfield since 1960?', a: 'Coronation Street', d: ['EastEnders', 'Brookside', 'Emmerdale'], from: 'script:d11q17' },
{ c: 'Actors & Directors', t: 4, q: 'Which Austrian director made The Seventh Continent and Amour?', a: 'Michael Haneke', d: ['Ulrich Seidl', 'Jessica Hausner', 'Christian Petzold'], from: 'script:d20q18' },
{ c: 'Awards & Box Office', t: 4, q: 'Which actor won a posthumous Best Actor Oscar for playing the newsman Howard Beale in Network?', a: 'Peter Finch', d: ['Spencer Tracy', 'James Dean', 'Ralph Richardson'] },
{ c: 'Behind the Scenes', t: 4, q: 'What does the term MacGuffin describe?', a: 'A plot device that drives characters but matters little in itself', d: ['A recurring background actor', 'A camera crane move', 'A studio contract clause'], from: 'script:d07q20' },

{ c: 'Movies', t: 5, q: 'In which Indian region is the village of Pather Panchali set?', a: 'Bengal', d: ['Kerala', 'Rajasthan', 'Punjab'], from: 'script:d19q21' },
{ c: 'Television', t: 5, q: 'Which 1979 BBC serial adapted John le Carre\'s novel about a mole in British intelligence?', a: 'Tinker Tailor Soldier Spy', d: ['Smiley\'s People', 'The Sandbaggers', 'A Perfect Spy'], from: 'script:d25q22' },
{ c: 'Actors & Directors', t: 5, q: 'Which actor directed The Night of the Hunter and never directed another film?', a: 'Charles Laughton', d: ['Leonard Kastle', 'James William Guercio', 'Herk Harvey'], from: 'script:d01q23' },
{ c: 'Awards & Box Office', t: 5, q: 'Who became the first performer to win Best Actress for a role played in another language?', a: 'Sophia Loren', d: ['Anna Magnani', 'Simone Signoret', 'Marion Cotillard'], from: 'script:d17q24' },
{ c: 'Behind the Scenes', t: 5, q: 'What was block booking?', a: 'Forcing cinemas to take a bundle of films to get the one they wanted', d: ['Selling advance tickets in blocks', 'Signing actors for several films at once', 'Reserving a studio\'s stages'], from: 'script:d21q25' },
],

// ── Day 89 ────────────────────────────────────────────────────────────
[
{ c: 'Movies', t: 1, q: 'In Inside Out, which of Riley\'s emotions is blue?', a: 'Sadness', d: ['Joy', 'Fear', 'Disgust'] },
{ c: 'Television', t: 1, q: 'Which 1980s cartoon hero defended Castle Grayskull, raising his sword to declare "I have the power!"?', a: 'He-Man', d: ['Thundercats\' Lion-O', 'Skeletor', 'Voltron'] },
{ c: 'Actors & Directors', t: 1, q: 'Which actor played Luke Skywalker in the original Star Wars trilogy?', a: 'Mark Hamill', d: ['Harrison Ford', 'Billy Dee Williams', 'Kurt Russell'] },
{ c: 'Awards & Box Office', t: 1, q: 'At a film festival, what is a prize voted on by ticket buyers usually called?', a: 'The audience award', d: ['The jury prize', 'The critics\' prize', 'The grand prize'] },
{ c: 'Behind the Scenes', t: 1, q: 'What is a post-credits scene?', a: 'A short scene shown after the end credits', d: ['A scene cut before release', 'A scene filmed after the premiere', 'A behind-the-scenes interview'] },

{ c: 'Movies', t: 2, q: 'How many von Trapp children does Maria look after in The Sound of Music?', a: 'Seven', d: ['Five', 'Six', 'Eight'] },
{ c: 'Television', t: 2, q: 'In The Sopranos, what is the name of the strip club where Tony does business?', a: 'The Bada Bing', d: ['The Pussycat Lounge', 'The Copacabana', 'The Velvet Rope'] },
{ c: 'Actors & Directors', t: 2, q: 'Which director made A Nightmare on Elm Street and Scream?', a: 'Wes Craven', d: ['John Carpenter', 'Sam Raimi', 'Tobe Hooper'] },
{ c: 'Awards & Box Office', t: 2, q: 'Which actress won Best Supporting Actress for My Cousin Vinny?', a: 'Marisa Tomei', d: ['Judy Davis', 'Joan Plowright', 'Vanessa Redgrave'] },
{ c: 'Behind the Scenes', t: 2, q: 'What do studios mean by a tentpole film?', a: 'A big-budget release expected to carry a studio\'s year', d: ['A film shot outdoors under canvas', 'A low-budget test release', 'A film that opens a festival'] },

{ c: 'Movies', t: 3, q: 'In Network, what does newsman Howard Beale urge viewers to shout from their windows?', a: 'That they are mad as hell', d: ['That the network is lying', 'That they want their money back', 'That the end is near'] },
{ c: 'Television', t: 3, q: 'In Seinfeld, what is the diner where Jerry and his friends meet called?', a: 'Monk\'s Cafe', d: ['Central Perk', 'Luke\'s', 'Arnold\'s'] },
{ c: 'Actors & Directors', t: 3, q: 'Which actor played Hannibal Lecter in Manhunter, five years before The Silence of the Lambs?', a: 'Brian Cox', d: ['Mads Mikkelsen', 'Anthony Hopkins', 'Gary Oldman'], from: 'script:d23q13' },
{ c: 'Awards & Box Office', t: 3, q: 'Which Pixar film was the first animated feature nominated for Best Picture since Beauty and the Beast?', a: 'Up', d: ['Toy Story 3', 'WALL-E', 'Ratatouille'] },
{ c: 'Behind the Scenes', t: 3, q: 'What is a matte painting used for?', a: 'Creating a background too large or costly to build', d: ['Softening the focus', 'Blending two takes of one actor', 'Coloring film by hand'], from: 'script:d12q15' },

{ c: 'Movies', t: 4, q: 'In 2001: A Space Odyssey, what is the ship\'s computer called?', a: 'HAL 9000', d: ['Colossus', 'MU-TH-UR', 'Proteus IV'], from: 'script:d02q16' },
{ c: 'Television', t: 4, q: 'Which series ended with its lead sitting on a hillside as a soft drink commercial begins?', a: 'Mad Men', d: ['The Sopranos', 'Six Feet Under', 'Halt and Catch Fire'], from: 'script:d04q17' },
{ c: 'Actors & Directors', t: 4, q: 'Which director made 8½ and La Dolce Vita?', a: 'Federico Fellini', d: ['Michelangelo Antonioni', 'Vittorio De Sica', 'Luchino Visconti'], from: 'script:d08q18' },
{ c: 'Awards & Box Office', t: 4, q: 'Which biography of a wartime American general won Best Picture at the 1971 ceremony?', a: 'Patton', d: ['Love Story', 'Airport', 'Five Easy Pieces'], from: 'script:d22q19' },
{ c: 'Behind the Scenes', t: 4, q: 'Which film\'s poster carried the line about nobody hearing you scream in space?', a: 'Alien', d: ['Outland', 'Solaris', 'Event Horizon'], from: 'script:d09q20' },

{ c: 'Movies', t: 5, q: 'What arrives in the town square in Werckmeister Harmonies?', a: 'A whale in a truck', d: ['A hot-air balloon', 'A bronze statue', 'A military convoy'], from: 'script:d25q21' },
{ c: 'Television', t: 5, q: 'What is the prison in the HBO series Oz called?', a: 'Oswald State Correctional Facility', d: ['Fox River', 'Shawshank', 'Litchfield'], from: 'script:d12q22' },
{ c: 'Actors & Directors', t: 5, q: 'Which actor appeared in film after film for Yasujiro Ozu, including Tokyo Story?', a: 'Chishu Ryu', d: ['Masayuki Mori', 'Toshiro Mifune', 'Takashi Shimura'], from: 'script:d20q23' },
{ c: 'Awards & Box Office', t: 5, q: 'Which Italian film won the first competitive Academy Award for Best Foreign Language Film?', a: 'La Strada', d: ['Rome, Open City', 'Bicycle Thieves', 'Nights of Cabiria'], from: 'script:d10q24' },
{ c: 'Behind the Scenes', t: 5, q: 'Which newspaper magnate tried to have Citizen Kane suppressed before release?', a: 'William Randolph Hearst', d: ['Joseph Pulitzer', 'Robert McCormick', 'Henry Luce'], from: 'script:d18q25' },
],

// ── Day 90 ────────────────────────────────────────────────────────────
[
{ c: 'Movies', t: 1, q: 'In Moana, what kind of animal is Heihei, who stows away on her canoe?', a: 'A rooster', d: ['A pig', 'A parrot', 'A crab'] },
{ c: 'Television', t: 1, q: 'In Happy Days, what nickname did the leather-jacketed Arthur Fonzarelli go by?', a: 'The Fonz', d: ['Potsie', 'Richie', 'Chachi'] },
{ c: 'Actors & Directors', t: 1, q: 'Which singer played Sandy in the 1978 film of Grease?', a: 'Olivia Newton-John', d: ['Stockard Channing', 'Farrah Fawcett', 'Debbie Harry'] },
{ c: 'Awards & Box Office', t: 1, q: 'What is it called when a film or performer is named as one of the contenders for an award?', a: 'A nomination', d: ['A premiere', 'A screening', 'An audition'] },
{ c: 'Behind the Scenes', t: 1, q: 'What is a biopic?', a: 'A film about a real person\'s life', d: ['A film about nature', 'A science fiction film', 'A film made for television'] },

{ c: 'Movies', t: 2, q: 'In The Empire Strikes Back, on which swamp planet does Luke train with Yoda?', a: 'Dagobah', d: ['Hoth', 'Endor', 'Naboo'] },
{ c: 'Television', t: 2, q: 'In Game of Thrones, what is the name of the largest of Daenerys Targaryen\'s three dragons?', a: 'Drogon', d: ['Rhaegal', 'Viserion', 'Balerion'] },
{ c: 'Actors & Directors', t: 2, q: 'Which actress played Thelma opposite Susan Sarandon in Thelma & Louise?', a: 'Geena Davis', d: ['Laura Dern', 'Michelle Pfeiffer', 'Kathleen Turner'] },
{ c: 'Awards & Box Office', t: 2, q: 'Which actor won Best Actor for playing Truman Capote in Capote?', a: 'Philip Seymour Hoffman', d: ['Joaquin Phoenix', 'Heath Ledger', 'David Strathairn'] },
{ c: 'Behind the Scenes', t: 2, q: 'What is an ensemble cast?', a: 'A cast with several roughly equal leading roles', d: ['A cast made up of musicians', 'A cast that plays more than one role each', 'A cast that never appears together'] },

{ c: 'Movies', t: 3, q: 'In Fight Club, what product does Tyler Durden make and sell?', a: 'Soap', d: ['Candles', 'Perfume', 'Cigarettes'] },
{ c: 'Television', t: 3, q: 'Which teen drama was set in the fictional Massachusetts town of Capeside?', a: 'Dawson\'s Creek', d: ['One Tree Hill', 'The O.C.', 'Everwood'] },
{ c: 'Actors & Directors', t: 3, q: 'Which director made The Silence of the Lambs and Philadelphia?', a: 'Jonathan Demme', d: ['Brian De Palma', 'Ridley Scott', 'Michael Mann'] },
{ c: 'Awards & Box Office', t: 3, q: 'Which actor won Best Supporting Actor for City Slickers, then did one-armed push-ups on the Oscar stage?', a: 'Jack Palance', d: ['Gene Hackman', 'Jack Nicholson', 'Tommy Lee Jones'] },
{ c: 'Behind the Scenes', t: 3, q: 'What does shooting day for night mean?', a: 'Filming in daylight and treating the image to look like night', d: ['Running two units at once', 'Building a night scene on a sound stage', 'Shooting only after sunset'], from: 'script:d09q15' },

{ c: 'Movies', t: 4, q: 'What is the forbidden territory in Stalker called?', a: 'The Zone', d: ['The Room', 'The Grey Belt', 'The Perimeter'], from: 'script:d15q16' },
{ c: 'Television', t: 4, q: 'Which 1967 British series stranded a resigned agent in a place known only as the Village?', a: 'The Prisoner', d: ['Danger Man', 'The Avengers', 'Callan'], from: 'script:d02q17' },
{ c: 'Actors & Directors', t: 4, q: 'Which Belgian director made Jeanne Dielman?', a: 'Chantal Akerman', d: ['Claire Denis', 'Agnes Varda', 'Marguerite Duras'], from: 'script:d26q18' },
{ c: 'Awards & Box Office', t: 4, q: 'Which film became the first released by a streaming service to win Best Picture?', a: 'CODA', d: ['Roma', 'Nomadland', 'The Power of the Dog'], from: 'script:d12q19' },
{ c: 'Behind the Scenes', t: 4, q: 'Which union strike shut down American film and television production across the 2007 and 2008 season?', a: 'The Writers Guild strike', d: ['The Directors Guild strike', 'The Screen Actors Guild strike', 'The Teamsters strike'], from: 'script:d20q20' },

{ c: 'Movies', t: 5, q: 'Which conflict does The Battle of Algiers dramatize?', a: 'The Algerian war of independence', d: ['The Suez Crisis', 'The Spanish Civil War', 'The Six-Day War'], from: 'script:d11q21' },
{ c: 'Television', t: 5, q: 'Which British sitcom is set on a mining ship drifting three million years into deep space?', a: 'Red Dwarf', d: ['Come Back Mrs Noah', 'Blake\'s 7', 'Hyperdrive'], from: 'script:d08q22' },
{ c: 'Actors & Directors', t: 5, q: 'Which actress played the faded silent star Norma Desmond?', a: 'Gloria Swanson', d: ['Mae West', 'Pola Negri', 'Norma Shearer'], from: 'script:d11q23' },
{ c: 'Awards & Box Office', t: 5, q: 'Which 1989 release won Best Picture even though its director, Bruce Beresford, was not nominated?', a: 'Driving Miss Daisy', d: ['Born on the Fourth of July', 'Field of Dreams', 'Dead Poets Society'], from: 'script:d04q24' },
{ c: 'Behind the Scenes', t: 5, q: 'Which company created the THX cinema certification standard in 1983?', a: 'Lucasfilm', d: ['IMAX', 'Sony', 'Dolby'], from: 'script:d17q25' },
],

// ── Day 91 ────────────────────────────────────────────────────────────
[
{ c: 'Movies', t: 1, q: 'In Frozen, what is the name of Elsa\'s younger sister?', a: 'Anna', d: ['Aurora', 'Merida', 'Belle'] },
{ c: 'Television', t: 1, q: 'Which sitcom follows the Dunphy, Pritchett and Tucker households in Los Angeles?', a: 'Modern Family', d: ['Parenthood', 'This Is Us', 'Arrested Development'] },
{ c: 'Actors & Directors', t: 1, q: 'Which actress played Wonder Woman in the 1970s television series?', a: 'Lynda Carter', d: ['Farrah Fawcett', 'Lindsay Wagner', 'Jaclyn Smith'] },
{ c: 'Awards & Box Office', t: 1, q: 'What does a lifetime achievement award honor?', a: 'A whole career', d: ['A single performance', 'A first film', 'A year\'s box office'] },
{ c: 'Behind the Scenes', t: 1, q: 'What is a documentary?', a: 'A nonfiction film about real people or events', d: ['A film adapted from a novel', 'A film with no dialogue', 'A film made from archive cartoons'] },

{ c: 'Movies', t: 2, q: 'In Back to the Future, what fuel does Doc Brown\'s time machine run on before the trip to the future?', a: 'Plutonium', d: ['Uranium', 'Diesel', 'Hydrogen'] },
{ c: 'Television', t: 2, q: 'In The Fresh Prince of Bel-Air, what is the surname of Will\'s wealthy relatives?', a: 'Banks', d: ['Winslow', 'Huxtable', 'Jefferson'] },
{ c: 'Actors & Directors', t: 2, q: 'Which actor played Lieutenant Dan in Forrest Gump?', a: 'Gary Sinise', d: ['Ed Harris', 'Bill Paxton', 'Kevin Bacon'] },
{ c: 'Awards & Box Office', t: 2, q: 'Which actress won Best Actress for playing a linguistics professor with Alzheimer\'s in Still Alice?', a: 'Julianne Moore', d: ['Reese Witherspoon', 'Rosamund Pike', 'Felicity Jones'] },
{ c: 'Behind the Scenes', t: 2, q: 'What is a jump scare?', a: 'A sudden shock timed to make the audience startle', d: ['A stunt involving a leap from a height', 'A cut that skips ahead in time', 'A scare repeated in every sequel'] },

{ c: 'Movies', t: 3, q: 'How does Thelma & Louise end?', a: 'They drive off a cliff into the Grand Canyon', d: ['They surrender to the police', 'They cross into Mexico', 'They escape on a plane'] },
{ c: 'Television', t: 3, q: 'Which series featured the mysterious Dharma Initiative and its research stations on a tropical island?', a: 'Lost', d: ['Fringe', 'The Leftovers', 'Manifest'] },
{ c: 'Actors & Directors', t: 3, q: 'Which actress played Mrs. Robinson in The Graduate?', a: 'Anne Bancroft', d: ['Lauren Bacall', 'Shirley MacLaine', 'Jane Fonda'] },
{ c: 'Awards & Box Office', t: 3, q: 'Which Humphrey Bogart film won Best Picture at the 1944 ceremony?', a: 'Casablanca', d: ['The Maltese Falcon', 'To Have and Have Not', 'The Treasure of the Sierra Madre'] },
{ c: 'Behind the Scenes', t: 3, q: 'Which editing technique cuts between two lines of action to build tension?', a: 'Cross-cutting', d: ['Match cutting', 'Dissolving', 'Jump cutting'], from: 'script:d23q15' },

{ c: 'Movies', t: 4, q: 'In Once Upon a Time in the West, what does the harmonica-playing stranger want?', a: 'Revenge for his brother\'s death', d: ['A stolen gold shipment', 'A railroad contract', 'His wife returned'], from: 'script:d08q16' },
{ c: 'Television', t: 4, q: 'Which 2004 remake followed the last survivors of a nuclear attack fleeing the Cylons?', a: 'Battlestar Galactica', d: ['Stargate Universe', 'Caprica', 'Firefly'], from: 'script:d20q17' },
{ c: 'Actors & Directors', t: 4, q: 'Which actor played Norman Bates in 1960?', a: 'Anthony Perkins', d: ['Martin Balsam', 'John Gavin', 'Vince Edwards'], from: 'script:d06q18' },
{ c: 'Awards & Box Office', t: 4, q: 'Which film swept picture, director, actor, actress and screenplay at the 1992 ceremony?', a: 'The Silence of the Lambs', d: ['Schindler\'s List', 'Rain Man', 'Unforgiven'], from: 'script:d01q19' },
{ c: 'Behind the Scenes', t: 4, q: 'Which film shot under the fake working title \'Blue Harvest\' to keep fans away from the set?', a: 'Return of the Jedi', d: ['The Empire Strikes Back', 'Raiders of the Lost Ark', 'E.T. the Extra-Terrestrial'], from: 'script:d01q20' },

{ c: 'Movies', t: 5, q: 'Which war separates the lovers in The Cranes Are Flying?', a: 'The Second World War', d: ['The Crimean War', 'The First World War', 'The Russian Civil War'], from: 'script:d18q21' },
{ c: 'Television', t: 5, q: 'What was the advertising agency at the center of the first season of Mad Men called?', a: 'Sterling Cooper', d: ['Cooper Draper', 'Hobart and Olson', 'Pryce Holloway'], from: 'script:d01q22' },
{ c: 'Actors & Directors', t: 5, q: 'Which director made Ugetsu and Sansho the Bailiff?', a: 'Kenji Mizoguchi', d: ['Yasujiro Ozu', 'Masaki Kobayashi', 'Mikio Naruse'], from: 'script:d22q23' },
{ c: 'Awards & Box Office', t: 5, q: 'In which Los Angeles hotel was the first Academy Awards ceremony held, as a private dinner in 1929?', a: 'The Hollywood Roosevelt', d: ['The Biltmore', 'The Ambassador', 'The Beverly Wilshire'], from: 'script:d05q24' },
{ c: 'Behind the Scenes', t: 5, q: 'Which studio first licensed its films for sale on videocassette to the public, in 1977?', a: '20th Century Fox', d: ['Paramount', 'Warner Bros.', 'Universal'], from: 'script:d23q25' },
],

// ── Day 92 ────────────────────────────────────────────────────────────
[
{ c: 'Movies', t: 1, q: 'What is the name of the mermaid heroine in Disney\'s The Little Mermaid?', a: 'Ariel', d: ['Belle', 'Jasmine', 'Aurora'] },
{ c: 'Television', t: 1, q: 'In Teenage Mutant Ninja Turtles, what is the turtles\' favorite food?', a: 'Pizza', d: ['Tacos', 'Hot dogs', 'Burgers'] },
{ c: 'Actors & Directors', t: 1, q: 'Which child actress played the title role in the 1996 film Matilda?', a: 'Mara Wilson', d: ['Dakota Fanning', 'Lindsay Lohan', 'Christina Ricci'] },
{ c: 'Awards & Box Office', t: 1, q: 'What does it mean when a film sweeps an awards ceremony?', a: 'It wins most of the major awards it is up for', d: ['It is nominated but wins nothing', 'It is disqualified', 'It wins only technical awards'] },
{ c: 'Behind the Scenes', t: 1, q: 'What is the short advertisement for a film shown before its release called?', a: 'A trailer', d: ['A pilot', 'A sequel', 'A montage'] },

{ c: 'Movies', t: 2, q: 'In Toy Story, what is the name of the boy next door who tortures toys?', a: 'Sid', d: ['Max', 'Al', 'Hal'] },
{ c: 'Television', t: 2, q: 'In Friends, what is the title of Phoebe\'s best-known song about a cat?', a: 'Smelly Cat', d: ['Alley Cat', 'Kitty Blues', 'Purr Song'] },
{ c: 'Actors & Directors', t: 2, q: 'Which director made the 1984 comedy Ghostbusters?', a: 'Ivan Reitman', d: ['John Landis', 'Harold Ramis', 'Joe Dante'] },
{ c: 'Awards & Box Office', t: 2, q: 'Who became the first Asian woman to win Best Actress, for Everything Everywhere All at Once?', a: 'Michelle Yeoh', d: ['Gong Li', 'Lucy Liu', 'Zhang Ziyi'] },
{ c: 'Behind the Scenes', t: 2, q: 'What does it mean when a character breaks the fourth wall?', a: 'They speak directly to the audience', d: ['They walk off the set mid-scene', 'They ad-lib an unscripted line', 'They appear in a different film'] },

{ c: 'Movies', t: 3, q: 'In Gone with the Wind, what is the name of the O\'Hara family plantation?', a: 'Tara', d: ['Twelve Oaks', 'Belle Reve', 'Manderley'] },
{ c: 'Television', t: 3, q: 'Which HBO comedy followed a startup called Pied Piper?', a: 'Silicon Valley', d: ['Halt and Catch Fire', 'The IT Crowd', 'Betas'] },
{ c: 'Actors & Directors', t: 3, q: 'Which director made both Rocky and The Karate Kid?', a: 'John G. Avildsen', d: ['Sylvester Stallone', 'Ted Kotcheff', 'Walter Hill'] },
{ c: 'Awards & Box Office', t: 3, q: 'Which Gregory Peck film about a reporter exposing antisemitism won Best Picture at the 1948 ceremony?', a: 'Gentleman\'s Agreement', d: ['The Bishop\'s Wife', 'Crossfire', 'Great Expectations'] },
{ c: 'Behind the Scenes', t: 3, q: 'Which crew member runs the set day to day and keeps the shooting schedule?', a: 'The first assistant director', d: ['The line producer', 'The unit publicist', 'The script supervisor'], from: 'script:d19q15' },

{ c: 'Movies', t: 4, q: 'What is the profession of the woman being investigated in Klute?', a: 'A call girl', d: ['A flight attendant', 'A schoolteacher', 'A nurse'], from: 'script:d20q16' },
{ c: 'Television', t: 4, q: 'Which 1971 series followed the Bellamy family and their servants at 165 Eaton Place?', a: 'Upstairs, Downstairs', d: ['The Forsyte Saga', 'The Duchess of Duke Street', 'The Pallisers'], from: 'script:d22q17' },
{ c: 'Actors & Directors', t: 4, q: 'Chaplin plays the dictator in The Great Dictator, and which other role?', a: 'A Jewish barber', d: ['A field marshal', 'A newsreel narrator', 'An ambassador'], from: 'script:d18q18' },
{ c: 'Awards & Box Office', t: 4, q: 'Which musical set among rival New York gangs won Best Picture at the 1962 ceremony?', a: 'West Side Story', d: ['The Hustler', 'Fanny', 'Judgment at Nuremberg'], from: 'script:d26q19' },
{ c: 'Behind the Scenes', t: 4, q: 'Which director\'s 1985 film was recut by the studio into a version nicknamed the Love Conquers All edit?', a: 'Terry Gilliam', d: ['Michael Cimino', 'Orson Welles', 'Ridley Scott'], from: 'script:d15q20' },

{ c: 'Movies', t: 5, q: 'Which illness afflicts the priest in Diary of a Country Priest?', a: 'Stomach cancer', d: ['Typhus', 'Pneumonia', 'Tuberculosis'], from: 'script:d24q21' },
{ c: 'Television', t: 5, q: 'Which series gave the world the phrase about jumping the shark?', a: 'Happy Days', d: ['Laverne & Shirley', 'Mork & Mindy', 'Three\'s Company'], from: 'script:d19q22' },
{ c: 'Actors & Directors', t: 5, q: 'Which director made Los Olvidados and Belle de Jour?', a: 'Luis Bunuel', d: ['Carlos Saura', 'Marco Ferreri', 'Juan Antonio Bardem'], from: 'script:d24q23' },
{ c: 'Awards & Box Office', t: 5, q: 'Which country\'s film Shoeshine took an honorary Academy Award as the outstanding foreign language film of 1947?', a: 'Italy', d: ['Mexico', 'Japan', 'France'], from: 'script:d08q24' },
{ c: 'Behind the Scenes', t: 5, q: 'Which film shot its crop duster sequence in California farmland standing in for rural Indiana?', a: 'North by Northwest', d: ['Days of Heaven', 'The Birds', 'Badlands'], from: 'script:d01q25' },
],

// ── Day 93 ────────────────────────────────────────────────────────────
[
{ c: 'Movies', t: 1, q: 'In the Harry Potter films, what is the name of Harry\'s snowy owl?', a: 'Hedwig', d: ['Errol', 'Hermes', 'Pigwidgeon'] },
{ c: 'Television', t: 1, q: 'In Stranger Things, what is the name of the girl with psychokinetic powers?', a: 'Eleven', d: ['Seven', 'Nine', 'Twelve'] },
{ c: 'Actors & Directors', t: 1, q: 'Which actor voiced Mufasa in the 1994 film The Lion King?', a: 'James Earl Jones', d: ['Morgan Freeman', 'Jeremy Irons', 'Laurence Fishburne'] },
{ c: 'Awards & Box Office', t: 1, q: 'What is a double feature?', a: 'Two films shown back to back for one ticket', d: ['A film with two directors', 'A film released twice', 'A film with two endings'] },
{ c: 'Behind the Scenes', t: 1, q: 'Who writes the original music for a film?', a: 'The composer', d: ['The gaffer', 'The foley artist', 'The editor'] },

{ c: 'Movies', t: 2, q: 'In Rocky, what does Rocky gulp down raw before his early morning training run?', a: 'Eggs', d: ['Oysters', 'Steak', 'Milk'] },
{ c: 'Television', t: 2, q: 'In Breaking Bad, what is the name of Walter White\'s former student and partner?', a: 'Jesse Pinkman', d: ['Saul Goodman', 'Hank Schrader', 'Gus Fring'] },
{ c: 'Actors & Directors', t: 2, q: 'Which actress played Rose DeWitt Bukater in Titanic?', a: 'Kate Winslet', d: ['Gwyneth Paltrow', 'Claire Danes', 'Helena Bonham Carter'] },
{ c: 'Awards & Box Office', t: 2, q: 'Which film won Matt Damon and Ben Affleck the Academy Award for Best Original Screenplay?', a: 'Good Will Hunting', d: ['Gone Baby Gone', 'The Departed', 'Mystic River'] },
{ c: 'Behind the Scenes', t: 2, q: 'Which old studio technique filmed actors in a stationary car in front of a screen showing moving scenery?', a: 'Rear projection', d: ['Day for night', 'Forced perspective', 'Split screen'] },

{ c: 'Movies', t: 3, q: 'In The Princess Bride, which feared name does Westley take on while he is away at sea?', a: 'The Dread Pirate Roberts', d: ['The Black Corsair', 'The Man in Black Sails', 'Captain Inigo'] },
{ c: 'Television', t: 3, q: 'In Twin Peaks, which FBI special agent arrives in town to lead the investigation into the murder of Laura Palmer?', a: 'Dale Cooper', d: ['Fox Mulder', 'Clarice Starling', 'Will Graham'] },
{ c: 'Actors & Directors', t: 3, q: 'Which actor starred as the chain gang prisoner in Cool Hand Luke?', a: 'Paul Newman', d: ['Steve McQueen', 'Robert Redford', 'James Garner'], from: 'script:d20q13' },
{ c: 'Awards & Box Office', t: 3, q: 'Which film about a New York narcotics detective won Best Picture at the 1972 ceremony?', a: 'The French Connection', d: ['A Clockwork Orange', 'Fiddler on the Roof', 'The Last Picture Show'], from: 'script:d19q14' },
{ c: 'Behind the Scenes', t: 3, q: 'What is a practical effect?', a: 'One achieved on set rather than added afterwards', d: ['A sound created in post', 'A cheaply rendered digital effect', 'One drawn frame by frame'], from: 'script:d15q15' },

{ c: 'Movies', t: 4, q: 'In Rashomon, which crime do the witnesses describe in contradictory ways?', a: 'The killing of a samurai', d: ['The theft of a temple bell', 'The burning of a village', 'The kidnapping of a lord'] },
{ c: 'Television', t: 4, q: 'Which 1990s sitcom starred Paul Reiser and Helen Hunt as Manhattan newlyweds?', a: 'Mad About You', d: ['Dharma & Greg', 'Suddenly Susan', 'Caroline in the City'] },
{ c: 'Actors & Directors', t: 4, q: 'Which director made Pierrot le Fou and Contempt?', a: 'Jean-Luc Godard', d: ['Francois Truffaut', 'Louis Malle', 'Alain Resnais'], from: 'script:d25q18' },
{ c: 'Awards & Box Office', t: 4, q: 'Which film about a neurotic New York comedian and his girlfriend won Best Picture at the 1978 ceremony?', a: 'Annie Hall', d: ['The Goodbye Girl', 'Julia', 'Star Wars'], from: 'script:d23q19' },
{ c: 'Behind the Scenes', t: 4, q: 'Which 1976 release was the first feature to use the newly invented Steadicam?', a: 'Bound for Glory', d: ['All the President\'s Men', 'Network', 'Taxi Driver'], from: 'script:d10q20' },

{ c: 'Movies', t: 5, q: 'The final section of Andrei Rublev follows the casting of what?', a: 'A bell', d: ['A church door', 'A statue', 'A cannon'], from: 'script:d07q21' },
{ c: 'Television', t: 5, q: 'What was the Chicago hospital in ER called?', a: 'County General', d: ['Cook County Memorial', 'Chicago Hope', 'Mercy General'], from: 'script:d10q22' },
{ c: 'Actors & Directors', t: 5, q: 'Which director made Wings of Desire?', a: 'Wim Wenders', d: ['Werner Herzog', 'Rainer Werner Fassbinder', 'Margarethe von Trotta'], from: 'script:d18q23' },
{ c: 'Awards & Box Office', t: 5, q: 'Which X-rated release won Best Picture, the only one ever to do so?', a: 'Midnight Cowboy', d: ['Last Tango in Paris', 'A Clockwork Orange', 'Deliverance'], from: 'script:d06q24' },
{ c: 'Behind the Scenes', t: 5, q: 'Which 1980 film\'s cost overruns are credited with helping end United Artists as an independent studio?', a: 'Heaven\'s Gate', d: ['Popeye', 'Inchon', 'Raise the Titanic'], from: 'script:d02q25' },
],

// ── Day 94 ────────────────────────────────────────────────────────────
[
{ c: 'Movies', t: 1, q: 'In Toy Story 2, which yodeling cowgirl joins Woody?', a: 'Jessie', d: ['Bo Peep', 'Barbie', 'Mrs. Potato Head'] },
{ c: 'Television', t: 1, q: 'Which spooky family includes Gomez, Morticia and Wednesday?', a: 'The Addams Family', d: ['The Munsters', 'The Osbournes', 'The Belchers'] },
{ c: 'Actors & Directors', t: 1, q: 'Which actor played Draco Malfoy in the Harry Potter films?', a: 'Tom Felton', d: ['Matthew Lewis', 'Rupert Grint', 'Robert Pattinson'] },
{ c: 'Awards & Box Office', t: 1, q: 'What does the Hollywood phrase box office poison describe?', a: 'A star whose films keep losing money', d: ['A film that critics loved', 'A sequel that outsold the original', 'A cinema chain that went bankrupt'] },
{ c: 'Behind the Scenes', t: 1, q: 'What does a location scout do?', a: 'Finds real places to film', d: ['Hires the extras', 'Checks continuity between takes', 'Plans the stunts'] },

{ c: 'Movies', t: 2, q: 'In The Incredibles, what does the former fanboy Buddy Pine call himself as a villain?', a: 'Syndrome', d: ['The Underminer', 'Bomb Voyage', 'Screenslaver'] },
{ c: 'Television', t: 2, q: 'In Full House, what is the surname of the family?', a: 'Tanner', d: ['Keaton', 'Seaver', 'Winslow'] },
{ c: 'Actors & Directors', t: 2, q: 'Which actor played Marty McFly\'s father George in Back to the Future?', a: 'Crispin Glover', d: ['Thomas F. Wilson', 'Christopher Lloyd', 'James Tolkan'] },
{ c: 'Awards & Box Office', t: 2, q: 'Which Bruce Springsteen song from a 1993 Tom Hanks legal drama won Best Original Song?', a: 'Streets of Philadelphia', d: ['Dancing in the Dark', 'Secret Garden', 'Human Touch'] },
{ c: 'Behind the Scenes', t: 2, q: 'What is a writers\' room?', a: 'A group of writers who plan and draft a series together', d: ['The office where scripts are stored', 'A union meeting hall', 'A room where critics watch screenings'] },

{ c: 'Movies', t: 3, q: 'In The Good, the Bad and the Ugly, what is hidden in a grave in the cemetery?', a: 'A cache of Confederate gold', d: ['A stolen army payroll ledger', 'A crate of rifles', 'A map to a silver mine'], from: 'script:d33q11' },
{ c: 'Television', t: 3, q: 'Which sitcom followed three mismatched priests and their tea-obsessed housekeeper on a remote island off the Irish coast?', a: 'Father Ted', d: ['Ballykissangel', 'Derry Girls', 'Mrs. Brown\'s Boys'], from: 'script:d33q12' },
{ c: 'Actors & Directors', t: 3, q: 'Which Spanish director made Talk to Her, Volver and All About My Mother?', a: 'Pedro Almodovar', d: ['Carlos Saura', 'Alejandro Amenabar', 'Luis Bunuel'], from: 'script:d35q13' },
{ c: 'Awards & Box Office', t: 3, q: 'Which actor won the Academy Award for Best Actor for Gladiator?', a: 'Russell Crowe', d: ['Ed Harris', 'Geoffrey Rush', 'Tom Hanks'], from: 'script:d33q14' },
{ c: 'Behind the Scenes', t: 3, q: 'Which fantasy series shot its capital city exteriors in the walled Croatian port of Dubrovnik?', a: 'Game of Thrones', d: ['Vikings', 'The Borgias', 'Rome'], from: 'script:d36q15' },

{ c: 'Movies', t: 4, q: 'What is Cleo waiting for over the two hours of Agnes Varda\'s Cleo from 5 to 7?', a: 'The result of a medical test', d: ['A lover to return from Algeria', 'A record contract to be signed', 'A verdict in a court case'], from: 'script:d35q16' },
{ c: 'Television', t: 4, q: 'Which 1963 series about a rocket-powered robot boy is regarded as the first weekly Japanese animated television series?', a: 'Astro Boy', d: ['Gigantor', 'Speed Racer', 'Kimba the White Lion'], from: 'script:d35q17' },
{ c: 'Actors & Directors', t: 4, q: 'Which Italian actress starred in L\'Avventura, La Notte and Red Desert for Michelangelo Antonioni?', a: 'Monica Vitti', d: ['Claudia Cardinale', 'Sophia Loren', 'Anna Magnani'], from: 'script:d36q18' },
{ c: 'Awards & Box Office', t: 4, q: 'Which animated film shared the Golden Bear at Berlin in 2002 with Bloody Sunday?', a: 'Spirited Away', d: ['Princess Mononoke', 'Millennium Actress', 'Grave of the Fireflies'], from: 'script:d33q19' },
{ c: 'Behind the Scenes', t: 4, q: 'Whose creature effects for the 1982 Antarctic horror film were built almost entirely from mechanical and chemical materials rather than optical work?', a: 'Rob Bottin', d: ['Chris Walas', 'Dick Smith', 'Rick Baker'], from: 'script:d36q20' },

{ c: 'Movies', t: 5, q: 'What trade does Genjuro practice in Mizoguchi\'s Ugetsu?', a: 'Pottery', d: ['Silk weaving', 'Fishing', 'Sword-making'], from: 'script:d33q21' },
{ c: 'Television', t: 5, q: 'Which 1973 Thames Television documentary series covered the 1939 to 1945 conflict across twenty-six episodes?', a: 'The World at War', d: ['The Great War', 'The Valiant Years', 'Victory at Sea'], from: 'script:d34q22' },
{ c: 'Actors & Directors', t: 5, q: 'Which Italian cinematographer shot Apocalypse Now and The Conformist?', a: 'Vittorio Storaro', d: ['Sven Nykvist', 'Nestor Almendros', 'Gordon Willis'], from: 'script:d34q23' },
{ c: 'Awards & Box Office', t: 5, q: 'Which film shared the 1993 Palme d\'Or with Farewell My Concubine?', a: 'The Piano', d: ['The Wedding Banquet', 'Naked', 'Three Colors: Blue'], from: 'script:d32q24' },
{ c: 'Behind the Scenes', t: 5, q: 'Which early 1950s process projected onto a deeply curved screen using three synchronized projectors?', a: 'Cinerama', d: ['Todd-AO', 'VistaVision', 'CinemaScope'], from: 'script:d16q25' },
],

// ── Day 95 ────────────────────────────────────────────────────────────
[
{ c: 'Movies', t: 1, q: 'In Elf, which city does Buddy travel to in search of his father?', a: 'New York City', d: ['Chicago', 'Boston', 'Toronto'] },
{ c: 'Television', t: 1, q: 'Which cartoon cat spends his time chasing Tweety Bird?', a: 'Sylvester', d: ['Tom', 'Garfield', 'Felix'] },
{ c: 'Actors & Directors', t: 1, q: 'Which actor played Batman in the 1960s television series?', a: 'Adam West', d: ['Burt Ward', 'George Clooney', 'Michael Keaton'] },
{ c: 'Awards & Box Office', t: 1, q: 'Which actor won Best Actor for playing a corrupt narcotics detective in Training Day?', a: 'Denzel Washington', d: ['Ethan Hawke', 'Russell Crowe', 'Will Smith'] },
{ c: 'Behind the Scenes', t: 1, q: 'Which British broadcaster is funded mainly by a television license fee?', a: 'The BBC', d: ['ITV', 'Channel 4', 'Sky'] },

{ c: 'Movies', t: 2, q: 'In Psycho, what is the name of the roadside motel?', a: 'The Bates Motel', d: ['The Overlook', 'The Tropicana', 'The Mockingbird Inn'] },
{ c: 'Television', t: 2, q: 'In The Golden Girls, what is the name of Dorothy\'s sharp-tongued Sicilian mother?', a: 'Sophia', d: ['Rose', 'Blanche', 'Angela'] },
{ c: 'Actors & Directors', t: 2, q: 'Which actress played Olivia Pope in Scandal?', a: 'Kerry Washington', d: ['Viola Davis', 'Taraji P. Henson', 'Gabrielle Union'] },
{ c: 'Awards & Box Office', t: 2, q: 'Which song from Pixar\'s Coco won the Academy Award for Best Original Song?', a: 'Remember Me', d: ['Un Poco Loco', 'This Is Me', 'Shallow'] },
{ c: 'Behind the Scenes', t: 2, q: 'Which streaming service released The Boys?', a: 'Amazon Prime Video', d: ['Netflix', 'Hulu', 'Peacock'] },

{ c: 'Movies', t: 3, q: 'In The Big Lebowski, which cocktail does the Dude keep drinking?', a: 'A White Russian', d: ['A martini', 'A Manhattan', 'A gin and tonic'] },
{ c: 'Television', t: 3, q: 'Which comedy drama about a mother and daughter is set in the Connecticut town of Stars Hollow?', a: 'Gilmore Girls', d: ['Hart of Dixie', 'Everwood', 'Northern Rescue'], from: 'script:d36q12' },
{ c: 'Actors & Directors', t: 3, q: 'Which New Zealand director made The Piano and Bright Star?', a: 'Jane Campion', d: ['Gillian Armstrong', 'Sofia Coppola', 'Lynne Ramsay'], from: 'script:d36q13' },
{ c: 'Awards & Box Office', t: 3, q: 'Which musical about a Parisian courtesan-in-training won Best Picture at the 1959 ceremony?', a: 'Gigi', d: ['Separate Tables', 'The Defiant Ones', 'Auntie Mame'], from: 'script:d28q14' },
{ c: 'Behind the Scenes', t: 3, q: 'Which 1998 war film staged its opening landing in County Wexford, Ireland, using Irish Army reservists as extras?', a: 'Saving Private Ryan', d: ['The Longest Day', 'Dunkirk', 'The Thin Red Line'], from: 'script:d35q15' },

{ c: 'Movies', t: 4, q: 'In which country is Fanny and Alexander set?', a: 'Sweden', d: ['Denmark', 'Finland', 'Norway'], from: 'script:d28q16' },
{ c: 'Television', t: 4, q: 'Which animated series is set in the fictional Rhode Island town of Quahog?', a: 'Family Guy', d: ['The Cleveland Show', 'American Dad!', 'Futurama'], from: 'script:d09q17' },
{ c: 'Actors & Directors', t: 4, q: 'Which Italian composer wrote the music for The Godfather and for most of Federico Fellini\'s films?', a: 'Nino Rota', d: ['Carlo Rustichelli', 'Ennio Morricone', 'Riz Ortolani'], from: 'script:d39q18' },
{ c: 'Awards & Box Office', t: 4, q: 'Which film took the Palme d\'Or at Cannes in 2019?', a: 'Parasite', d: ['Portrait of a Lady on Fire', 'Pain and Glory', 'Burning'], from: 'script:d32q19' },
{ c: 'Behind the Scenes', t: 4, q: 'Which composer wrote the scores for Star Wars, Jaws and Schindler\'s List?', a: 'John Williams', d: ['Ennio Morricone', 'Jerry Goldsmith', 'James Horner'], from: 'script:d18q20' },

{ c: 'Movies', t: 5, q: 'Whose life does Sergei Parajanov evoke in The Color of Pomegranates?', a: 'The Armenian poet Sayat-Nova', d: ['The Russian icon painter Rublev', 'The Persian poet Rumi', 'The Georgian painter Pirosmani'], from: 'script:d34q21' },
{ c: 'Television', t: 5, q: 'Which 2012 Brazilian telenovela built a national phenomenon out of a revenge plot set in a Rio de Janeiro suburb and its rubbish dump?', a: 'Avenida Brasil', d: ['Vale Tudo', 'Senhora do Destino', 'O Clone'], from: 'script:d33q22' },
{ c: 'Actors & Directors', t: 5, q: 'Which Hungarian director made Satantango and Werckmeister Harmonies?', a: 'Bela Tarr', d: ['Karoly Makk', 'Miklos Jancso', 'Istvan Szabo'], from: 'script:d33q23' },
{ c: 'Awards & Box Office', t: 5, q: 'Which film took the Golden Lion at Venice in 2005?', a: 'Brokeback Mountain', d: ['Good Night, and Good Luck', 'The Constant Gardener', 'Match Point'], from: 'script:d35q24' },
{ c: 'Behind the Scenes', t: 5, q: 'Which experiment of Eadweard Muybridge is a direct forerunner of cinema?', a: 'Sequential photographs of a galloping horse', d: ['The daguerreotype', 'The camera obscura', 'The magic lantern'], from: 'script:d28q25' },
],

// ── Day 96 ────────────────────────────────────────────────────────────
[
{ c: 'Movies', t: 1, q: 'In Moana, what is the name of the shape-shifting demigod?', a: 'Maui', d: ['Tamatoa', 'Te Ka', 'Tui'] },
{ c: 'Television', t: 1, q: 'Which children\'s television host changed into a cardigan and sneakers at the start of every episode?', a: 'Fred Rogers', d: ['Bob Keeshan', 'Jim Henson', 'Bill Nye'] },
{ c: 'Actors & Directors', t: 1, q: 'Which director made the 2023 film Barbie?', a: 'Greta Gerwig', d: ['Sofia Coppola', 'Olivia Wilde', 'Noah Baumbach'] },
{ c: 'Awards & Box Office', t: 1, q: 'What is the BAFTA film award trophy shaped like?', a: 'A theatrical mask', d: ['A golden globe', 'A winged woman', 'A film camera'] },
{ c: 'Behind the Scenes', t: 1, q: 'In Pixar\'s opening logo, what hops on screen and squashes the letter I?', a: 'A desk lamp', d: ['A rubber ball', 'A toy robot', 'A wind-up mouse'] },

{ c: 'Movies', t: 2, q: 'In The Shawshank Redemption, what hides the hole Andy digs in his cell wall?', a: 'A pin-up poster', d: ['A Bible', 'A chess board', 'A painting of the sea'] },
{ c: 'Television', t: 2, q: 'In which city is the sitcom Frasier set?', a: 'Seattle', d: ['Boston', 'Portland', 'Chicago'] },
{ c: 'Actors & Directors', t: 2, q: 'Which actress played Mary Richards, a Minneapolis TV news producer, in a 1970s sitcom?', a: 'Mary Tyler Moore', d: ['Valerie Harper', 'Marlo Thomas', 'Bea Arthur'] },
{ c: 'Awards & Box Office', t: 2, q: 'Which composer won his Academy Award for scoring the 1994 film The Lion King?', a: 'Hans Zimmer', d: ['Alan Menken', 'Elton John', 'James Newton Howard'] },
{ c: 'Behind the Scenes', t: 2, q: 'Which New Zealand effects company did Peter Jackson co-found?', a: 'Weta', d: ['Framestore', 'Digital Domain', 'Rising Sun Pictures'] },

{ c: 'Movies', t: 3, q: 'In Memento, how does Leonard keep track of what he learns?', a: 'Tattoos and Polaroid photos', d: ['A tape recorder', 'A diary', 'Phone calls to his wife'] },
{ c: 'Television', t: 3, q: 'Which HBO drama followed a Prohibition-era political fixer in Atlantic City?', a: 'Boardwalk Empire', d: ['Peaky Blinders', 'The Knick', 'Deadwood'], from: 'script:d28q12' },
{ c: 'Actors & Directors', t: 3, q: 'Which actor turned director made Ordinary People, A River Runs Through It and Quiz Show?', a: 'Robert Redford', d: ['Warren Beatty', 'Ron Howard', 'Kevin Costner'], from: 'script:d33q13' },
{ c: 'Awards & Box Office', t: 3, q: 'Which 2017 horror film won the Academy Award for Best Original Screenplay?', a: 'Get Out', d: ['The Shape of Water', 'Three Billboards Outside Ebbing, Missouri', 'Lady Bird'], from: 'script:d36q14' },
{ c: 'Behind the Scenes', t: 3, q: 'What are residuals in the film and television business?', a: 'Payments to talent when a work is reused', d: ['Footage left out of the final cut', 'The distributor\'s fee', 'The unspent part of a budget'], from: 'script:d28q15' },

{ c: 'Movies', t: 4, q: 'In La Dolce Vita, in which Roman landmark do the two characters wade at night?', a: 'The Trevi Fountain', d: ['The Spanish Steps', 'The Colosseum', 'The Baths of Caracalla'], from: 'script:d39q16' },
{ c: 'Television', t: 4, q: 'Which HBO drama followed a polygamous family in suburban Utah?', a: 'Big Love', d: ['Under the Banner of Heaven', 'Bloodline', 'Sister Wives'], from: 'script:d29q17' },
{ c: 'Actors & Directors', t: 4, q: 'Which Japanese composer scored Ran, Kwaidan and Woman in the Dunes?', a: 'Toru Takemitsu', d: ['Ryuichi Sakamoto', 'Joe Hisaishi', 'Fumio Hayasaka'], from: 'script:d35q18' },
{ c: 'Awards & Box Office', t: 4, q: 'Which film took the Golden Lion at Venice in 2019?', a: 'Joker', d: ['Marriage Story', 'The Laundromat', 'Ad Astra'], from: 'script:d41q19' },
{ c: 'Behind the Scenes', t: 4, q: 'For which Werner Herzog film did the crew haul a real steamship over a hill between two rivers in the Peruvian jungle?', a: 'Fitzcarraldo', d: ['The Mission', 'Aguirre, the Wrath of God', 'Cobra Verde'], from: 'script:d33q20' },

{ c: 'Movies', t: 5, q: 'Which smell obsesses the hired killer in Seijun Suzuki\'s Branded to Kill?', a: 'Boiling rice', d: ['Jasmine', 'Gasoline', 'Fresh ink'], from: 'script:d40q21' },
{ c: 'Television', t: 5, q: 'In the Colombian telenovela about a brilliant but plain-looking economist, what is the name of the fashion house where she works?', a: 'Ecomoda', d: ['Moda Bella', 'Vanidades', 'Casa Ferrer'], from: 'script:d35q22' },
{ c: 'Actors & Directors', t: 5, q: 'Which Japanese cinematographer shot Rashomon and Ugetsu?', a: 'Kazuo Miyagawa', d: ['Asakazu Nakai', 'Hiroshi Segawa', 'Yuharu Atsuta'], from: 'script:d40q23' },
{ c: 'Awards & Box Office', t: 5, q: 'How many Academy Awards did Citizen Kane win?', a: 'One', d: ['Four', 'Nine', 'Two'], from: 'script:d20q24' },
{ c: 'Behind the Scenes', t: 5, q: 'What did the 1948 Paramount Decree force the major studios to give up?', a: 'Ownership of cinema chains', d: ['Color film patents', 'Foreign distribution', 'Long-term actor contracts'], from: 'script:d09q25' },
],

// ── Day 97 ────────────────────────────────────────────────────────────
[
{ c: 'Movies', t: 1, q: 'In Madagascar, what kind of animal is Alex?', a: 'A lion', d: ['A zebra', 'A giraffe', 'A hippo'] },
{ c: 'Television', t: 1, q: 'Which sitcom followed the Clampett family after they struck oil and moved to a Southern California mansion?', a: 'The Beverly Hillbillies', d: ['Green Acres', 'The Andy Griffith Show', 'Hee Haw'] },
{ c: 'Actors & Directors', t: 1, q: 'Which actor played Jim Halpert in the American version of The Office?', a: 'John Krasinski', d: ['Rainn Wilson', 'Ed Helms', 'B.J. Novak'] },
{ c: 'Awards & Box Office', t: 1, q: 'Which ceremony is often called Hollywood\'s biggest night?', a: 'The Academy Awards', d: ['The Golden Globes', 'The Emmy Awards', 'The Grammy Awards'] },
{ c: 'Behind the Scenes', t: 1, q: 'Which streaming service released Ted Lasso?', a: 'Apple TV+', d: ['Netflix', 'Hulu', 'Peacock'] },

{ c: 'Movies', t: 2, q: 'In Cars, which famous old highway once ran through Radiator Springs?', a: 'Route 66', d: ['Route 1', 'Interstate 10', 'The Lincoln Highway'] },
{ c: 'Television', t: 2, q: 'In House, what is the medical specialty of Dr. Gregory House\'s department?', a: 'Diagnostic medicine', d: ['Neurosurgery', 'Oncology', 'Emergency medicine'] },
{ c: 'Actors & Directors', t: 2, q: 'Which director made Nomadland and Eternals?', a: 'Chloe Zhao', d: ['Kathryn Bigelow', 'Greta Gerwig', 'Lulu Wang'] },
{ c: 'Awards & Box Office', t: 2, q: 'Which Swedish composer won the Academy Award for scoring Oppenheimer?', a: 'Ludwig Goransson', d: ['Hans Zimmer', 'Johann Johannsson', 'Max Richter'] },
{ c: 'Behind the Scenes', t: 2, q: 'What is a call sheet?', a: 'The daily schedule telling cast and crew where and when to report', d: ['A list of phone numbers for agents', 'A casting director\'s audition list', 'The final edit decision list'] },

{ c: 'Movies', t: 3, q: 'In The Graduate, what kind of car does Benjamin drive?', a: 'An Alfa Romeo Spider', d: ['A Ford Mustang', 'A Volkswagen Beetle', 'A Porsche 356'] },
{ c: 'Television', t: 3, q: 'In The Sopranos, what is the nickname of Tony\'s scheming uncle Corrado?', a: 'Junior', d: ['Paulie', 'Big Pussy', 'Silvio'] },
{ c: 'Actors & Directors', t: 3, q: 'Which actor played Mr. Pink in Reservoir Dogs?', a: 'Steve Buscemi', d: ['Tim Roth', 'Michael Madsen', 'Harvey Keitel'] },
{ c: 'Awards & Box Office', t: 3, q: 'Which actor won Best Actor for Coming Home?', a: 'Jon Voight', d: ['Robert De Niro', 'Warren Beatty', 'Laurence Olivier'] },
{ c: 'Behind the Scenes', t: 3, q: 'For which 2014 space film did the production plant and grow hundreds of acres of corn, later selling the crop?', a: 'Interstellar', d: ['Arrival', 'Signs', 'Gravity'], from: 'script:d32q15' },

{ c: 'Movies', t: 4, q: 'What does the celebrated lateral tracking shot in Godard\'s Weekend follow?', a: 'A traffic jam on a country road', d: ['A river of refugees', 'A funeral procession', 'A marching column of soldiers'], from: 'script:d33q16' },
{ c: 'Television', t: 4, q: 'Which French comedy drama follows the agents of a Paris talent agency after the death of its founder?', a: 'Call My Agent!', d: ['Family Business', 'The Bureau', 'Spiral'], from: 'script:d36q17' },
{ c: 'Actors & Directors', t: 4, q: 'Which writer created The Sopranos and ran it for six seasons?', a: 'David Chase', d: ['Tom Fontana', 'David Milch', 'David Simon'], from: 'script:d34q18' },
{ c: 'Awards & Box Office', t: 4, q: 'Which backstage story of a Broadway star won Best Picture at the 1951 ceremony?', a: 'All About Eve', d: ['Born Yesterday', 'Sunset Boulevard', 'King Solomon\'s Mines'], from: 'script:d28q19' },
{ c: 'Behind the Scenes', t: 4, q: 'Which sound advance did Fantasia introduce to cinemas in 1940?', a: 'Multi-channel stereophonic sound', d: ['Post-synchronized dialogue', 'The optical soundtrack', 'Noise reduction'], from: 'script:d28q20' },

{ c: 'Movies', t: 5, q: 'Which instrument plays the famous theme of The Third Man?', a: 'The zither', d: ['The harpsichord', 'The mandolin', 'The accordion'], from: 'script:d01q21' },
{ c: 'Television', t: 5, q: 'Which 1970s British sitcom was set in a badly run hotel in Torquay?', a: 'Fawlty Towers', d: ['Are You Being Served?', 'Porridge', 'Rising Damp'], from: 'script:d05q22' },
{ c: 'Actors & Directors', t: 5, q: 'Which Egyptian director made Cairo Station and the Alexandria films?', a: 'Youssef Chahine', d: ['Salah Abu Seif', 'Tewfik Saleh', 'Shadi Abdel Salam'], from: 'script:d46q23' },
{ c: 'Awards & Box Office', t: 5, q: 'Which Jafar Panahi film won the Golden Bear at Berlin in 2015?', a: 'Taxi', d: ['45 Years', 'Body', 'Victoria'], from: 'script:d52q24' },
{ c: 'Behind the Scenes', t: 5, q: 'Which 1915 feature is studied for its technical innovations alongside its notorious racism?', a: 'The Birth of a Nation', d: ['Intolerance', 'Broken Blossoms', 'The Cabinet of Dr. Caligari'], from: 'script:d05q25' },
],

// ── Day 98 ────────────────────────────────────────────────────────────
[
{ c: 'Movies', t: 1, q: 'In Disney\'s Peter Pan, what is the name of the fairy who follows Peter everywhere?', a: 'Tinker Bell', d: ['Tiger Lily', 'Silvermist', 'Wendy'] },
{ c: 'Television', t: 1, q: 'In Family Guy, what is the name of the talking dog?', a: 'Brian', d: ['Stewie', 'Cleveland', 'Quagmire'] },
{ c: 'Actors & Directors', t: 1, q: 'Which actor played Ant-Man in the Marvel films?', a: 'Paul Rudd', d: ['Jeremy Renner', 'Don Cheadle', 'Sebastian Stan'] },
{ c: 'Awards & Box Office', t: 1, q: 'Which website lets film fans log and rate everything they watch in a diary?', a: 'Letterboxd', d: ['Metacritic', 'Fandango', 'Box Office Mojo'] },
{ c: 'Behind the Scenes', t: 1, q: 'What is a miniseries?', a: 'A series planned with a limited number of episodes', d: ['A series of short films for children', 'A series filmed with miniatures', 'A pilot that was never picked up'] },

{ c: 'Movies', t: 2, q: 'In Star Wars, which planet, Princess Leia\'s home, does the Death Star destroy?', a: 'Alderaan', d: ['Coruscant', 'Yavin', 'Bespin'] },
{ c: 'Television', t: 2, q: 'In Seinfeld, what nickname do the characters give the strict soup vendor?', a: 'The Soup Nazi', d: ['The Broth King', 'The Soup General', 'The Ladle Man'] },
{ c: 'Actors & Directors', t: 2, q: 'Which actor played Lando Calrissian in The Empire Strikes Back?', a: 'Billy Dee Williams', d: ['Carl Weathers', 'James Earl Jones', 'Lou Gossett Jr.'] },
{ c: 'Awards & Box Office', t: 2, q: 'Which singer won Best Actress for Funny Girl, in a tie with Katharine Hepburn?', a: 'Barbra Streisand', d: ['Liza Minnelli', 'Julie Andrews', 'Judy Garland'] },
{ c: 'Behind the Scenes', t: 2, q: 'Which cable channel first aired SpongeBob SquarePants?', a: 'Nickelodeon', d: ['Cartoon Network', 'Disney Channel', 'PBS Kids'] },

{ c: 'Movies', t: 3, q: 'In Vertigo, which fear forces Scottie to retire from the police?', a: 'A fear of heights', d: ['A fear of water', 'A fear of crowds', 'A fear of the dark'] },
{ c: 'Television', t: 3, q: 'In The Good Place, what is the name of the demon who designs the neighborhood?', a: 'Michael', d: ['Janet', 'Shawn', 'Trevor'] },
{ c: 'Actors & Directors', t: 3, q: 'Which actor played Clyde Barrow in Bonnie and Clyde, and also produced the film?', a: 'Warren Beatty', d: ['Gene Hackman', 'Michael J. Pollard', 'Paul Newman'] },
{ c: 'Awards & Box Office', t: 3, q: 'Which Korean actress won Best Supporting Actress for Minari?', a: 'Youn Yuh-jung', d: ['Han Ye-ri', 'Kim Min-hee', 'Bae Doona'] },
{ c: 'Behind the Scenes', t: 3, q: 'Which 1959 epic staged its chariot race in a full-size arena built on the back lot of Rome\'s Cinecitta studios?', a: 'Ben-Hur', d: ['Spartacus', 'Quo Vadis', 'The Robe'], from: 'script:d33q15' },

{ c: 'Movies', t: 4, q: 'In Black Narcissus, where do the nuns establish their new convent?', a: 'In the Himalayas', d: ['In the Scottish Highlands', 'In the Andes', 'On the coast of Ireland'], from: 'script:d32q16' },
{ c: 'Television', t: 4, q: 'In Neon Genesis Evangelion, what is the name of the special agency that deploys the giant humanoid units against the Angels?', a: 'NERV', d: ['SEELE', 'GEHIRN', 'WILLE'], from: 'script:d31q17' },
{ c: 'Actors & Directors', t: 4, q: 'Which cinematographer shot The Red Shoes and Black Narcissus for Powell and Pressburger?', a: 'Jack Cardiff', d: ['Freddie Young', 'Oswald Morris', 'Robert Krasker'], from: 'script:d38q18' },
{ c: 'Awards & Box Office', t: 4, q: 'Which film won the Sundance Grand Jury Prize for drama in 2014?', a: 'Whiplash', d: ['Boyhood', 'Blue Ruin', 'Dear White People'], from: 'script:d34q19' },
{ c: 'Behind the Scenes', t: 4, q: 'Which studio uses a mountain encircled by stars as its logo?', a: 'Paramount', d: ['Columbia', 'Universal', 'TriStar'], from: 'script:d08q20' },

{ c: 'Movies', t: 5, q: 'How many days does The Turin Horse cover?', a: 'Six', d: ['Seven', 'Ten', 'Three'], from: 'script:d30q21' },
{ c: 'Television', t: 5, q: 'Which 1962 BBC police series was set in the fictional northern town of Newtown and broke sharply with the cozy style of Dixon of Dock Green?', a: 'Z-Cars', d: ['Softly, Softly', 'The Sweeney', 'No Hiding Place'], from: 'script:d52q22' },
{ c: 'Actors & Directors', t: 5, q: 'Which Argentine director made La Cienaga, The Headless Woman and Zama?', a: 'Lucrecia Martel', d: ['Pablo Trapero', 'Lisandro Alonso', 'Lucia Puenzo'], from: 'script:d35q23' },
{ c: 'Awards & Box Office', t: 5, q: 'Which film took the Golden Lion at Venice in 2011?', a: 'Faust', d: ['Carnage', 'A Dangerous Method', 'Shame'], from: 'script:d53q24' },
{ c: 'Behind the Scenes', t: 5, q: 'Which cinematographer shot the boxing scenes of the 1947 film Body and Soul while being pushed along on roller skates?', a: 'James Wong Howe', d: ['Gregg Toland', 'Nicholas Musuraca', 'Stanley Cortez'], from: 'script:d36q25' },
],

// ── Day 99 ────────────────────────────────────────────────────────────
[
{ c: 'Movies', t: 1, q: 'In Disney\'s The Jungle Book, what kind of animal is Shere Khan?', a: 'A tiger', d: ['A lion', 'A leopard', 'A wolf'] },
{ c: 'Television', t: 1, q: 'Which cartoon follows the Autobots and their battles with the Decepticons?', a: 'Transformers', d: ['Voltron', 'GoBots', 'ThunderCats'] },
{ c: 'Actors & Directors', t: 1, q: 'Which actor played Ross Geller in Friends?', a: 'David Schwimmer', d: ['Matthew Perry', 'Matt LeBlanc', 'Paul Rudd'] },
{ c: 'Awards & Box Office', t: 1, q: 'What is a film called that flops in cinemas but later wins a devoted following?', a: 'A cult classic', d: ['A blockbuster', 'A tentpole', 'A prequel'] },
{ c: 'Behind the Scenes', t: 1, q: 'What is motion capture?', a: 'Recording an actor\'s movements to animate a digital character', d: ['Filming a chase from a moving car', 'Speeding up footage in editing', 'Tracking box office from week to week'] },

{ c: 'Movies', t: 2, q: 'In Up, what is the name of the famous explorer Carl idolized as a boy?', a: 'Charles Muntz', d: ['Russell Fredricksen', 'Kevin Muntz', 'Alpha Muntz'] },
{ c: 'Television', t: 2, q: 'In Breaking Bad, which fried chicken chain does Gus Fring run as a front?', a: 'Los Pollos Hermanos', d: ['Pollo Loco', 'Chicken Shack', 'El Gallo de Oro'] },
{ c: 'Actors & Directors', t: 2, q: 'Which actress played Arya Stark in Game of Thrones?', a: 'Maisie Williams', d: ['Sophie Turner', 'Emilia Clarke', 'Natalie Dormer'] },
{ c: 'Awards & Box Office', t: 2, q: 'Which film won Dustin Hoffman his first Academy Award for Best Actor?', a: 'Kramer vs. Kramer', d: ['The Graduate', 'Midnight Cowboy', 'Tootsie'] },
{ c: 'Behind the Scenes', t: 2, q: 'Which Rome studio complex was nicknamed Hollywood on the Tiber?', a: 'Cinecitta', d: ['Titanus', 'Lux Film', 'Dear Studios'] },

{ c: 'Movies', t: 3, q: 'In Star Wars, in which spaceport cantina do Luke and Obi-Wan hire Han Solo?', a: 'Mos Eisley', d: ['Cloud City', 'Mos Espa', 'Jabba\'s palace'] },
{ c: 'Television', t: 3, q: 'In Cheers, what is the last name of Sam\'s on-and-off love, the waitress Diane?', a: 'Chambers', d: ['Howe', 'Crane', 'Sternin'] },
{ c: 'Actors & Directors', t: 3, q: 'Which actor played the hot-headed Sonny Corleone?', a: 'James Caan', d: ['John Cazale', 'Al Pacino', 'Richard Conte'] },
{ c: 'Awards & Box Office', t: 3, q: 'Which Michael Moore documentary took the Palme d\'Or in 2004?', a: 'Fahrenheit 9/11', d: ['Bowling for Columbine', 'Sicko', 'Roger and Me'] },
{ c: 'Behind the Scenes', t: 3, q: 'What does an anamorphic lens do?', a: 'Squeezes a wide image onto standard film for widescreen projection', d: ['Adds a fisheye distortion', 'Filters out ultraviolet light', 'Magnifies tiny objects'] },

{ c: 'Movies', t: 4, q: 'In Don\'t Look Now, in which city are the grieving couple staying?', a: 'Venice', d: ['Prague', 'Bruges', 'Lisbon'], from: 'script:d36q16' },
{ c: 'Television', t: 4, q: 'In the German science fiction series about four families and a time-loop, what is the name of the town with the nuclear plant and the caves?', a: 'Winden', d: ['Marburg', 'Nebel', 'Hollental'], from: 'script:d39q17' },
{ c: 'Actors & Directors', t: 4, q: 'Which actor played Antoine Doinel across five Francois Truffaut films?', a: 'Jean-Pierre Leaud', d: ['Charles Aznavour', 'Jean-Claude Brialy', 'Jean-Paul Belmondo'], from: 'script:d28q18' },
{ c: 'Awards & Box Office', t: 4, q: 'Which actor won a posthumous Academy Award for The Dark Knight?', a: 'Heath Ledger', d: ['James Dean', 'Spencer Tracy', 'Peter Finch'], from: 'script:d04q19' },
{ c: 'Behind the Scenes', t: 4, q: 'Which 1994 film used digital effects to remove a supporting actor\'s legs shot by shot?', a: 'Forrest Gump', d: ['The Fugitive', 'Coming Home', 'Born on the Fourth of July'], from: 'script:d40q20' },

{ c: 'Movies', t: 5, q: 'Which historical episode does the family drama of A City of Sadness unfold around?', a: 'The February 28 incident in Taiwan', d: ['The Japanese invasion of Manchuria', 'The Korean War', 'The Cultural Revolution'], from: 'script:d39q21' },
{ c: 'Television', t: 5, q: 'Which 1950s American sitcom pioneered filming a comedy on 35mm with three cameras at once?', a: 'I Love Lucy', d: ['The Honeymooners', 'The Jack Benny Program', 'Dragnet'], from: 'script:d29q22' },
{ c: 'Actors & Directors', t: 5, q: 'Which actor played the priest in Diary of a Country Priest?', a: 'Claude Laydu', d: ['Martin Lasalle', 'Pierre Fresnay', 'Francois Leterrier'], from: 'script:d27q23' },
{ c: 'Awards & Box Office', t: 5, q: 'Which film won the Golden Bear at Berlin in 2004?', a: 'Head-On', d: ['The Edukators', 'Maria Full of Grace', 'Before Sunset'], from: 'script:d47q24' },
{ c: 'Behind the Scenes', t: 5, q: 'Which process, introduced on One Hundred and One Dalmatians, copied animators\' drawings straight onto cels without hand inking?', a: 'Xerography', d: ['Cel-shading', 'Rotoscoping', 'Sodium vapor matting'], from: 'script:d41q25' },
],

// ── Day 100 ────────────────────────────────────────────────────────────
[
{ c: 'Movies', t: 1, q: 'In the Harry Potter films, what is the Weasley family home called?', a: 'The Burrow', d: ['The Leaky Cauldron', 'Grimmauld Place', 'Shell Cottage'] },
{ c: 'Television', t: 1, q: 'In The Fresh Prince of Bel-Air, what is the name of the family\'s butler?', a: 'Geoffrey', d: ['Niles', 'Benson', 'Alfred'] },
{ c: 'Actors & Directors', t: 1, q: 'Which actor played Sheldon Cooper in The Big Bang Theory?', a: 'Jim Parsons', d: ['Johnny Galecki', 'Simon Helberg', 'Kunal Nayyar'] },
{ c: 'Awards & Box Office', t: 1, q: 'Which singer won the Best Original Song Oscar for Shallow, from A Star Is Born?', a: 'Lady Gaga', d: ['Beyonce', 'Taylor Swift', 'Rihanna'] },
{ c: 'Behind the Scenes', t: 1, q: 'Which 1996 film teamed Michael Jordan with the Looney Tunes?', a: 'Space Jam', d: ['Who Framed Roger Rabbit', 'Like Mike', 'Eddie'] },

{ c: 'Movies', t: 2, q: 'In the Harry Potter films, what is the name of Hagrid\'s giant three-headed dog?', a: 'Fluffy', d: ['Fang', 'Norbert', 'Buckbeak'] },
{ c: 'Television', t: 2, q: 'In Dexter, what is Dexter Morgan\'s day job with the Miami police?', a: 'Blood spatter analyst', d: ['Homicide detective', 'Medical examiner', 'Crime scene photographer'] },
{ c: 'Actors & Directors', t: 2, q: 'Which Danish actor played Hannibal Lecter in the television series Hannibal?', a: 'Mads Mikkelsen', d: ['Nikolaj Coster-Waldau', 'Viggo Mortensen', 'Ulrich Thomsen'] },
{ c: 'Awards & Box Office', t: 2, q: 'Which actress accepted her Golden Raspberry for Worst Actress for Catwoman in person, Oscar in hand?', a: 'Halle Berry', d: ['Sharon Stone', 'Jennifer Lopez', 'Madonna'] },
{ c: 'Behind the Scenes', t: 2, q: 'In filmmaking, what is blocking?', a: 'Planning the actors\' positions and movements for a scene', d: ['Hiding the crew from the camera', 'Banning a film in a country', 'Covering lights with black cloth'] },

{ c: 'Movies', t: 3, q: 'In Back to the Future, what is the theme of the school dance where Marty\'s parents must kiss?', a: 'Enchantment Under the Sea', d: ['A Night in Paris', 'Under the Stars', 'Moonlight Masquerade'] },
{ c: 'Television', t: 3, q: 'In Atlanta, whom does Earn manage as a rapper?', a: 'His cousin Alfred', d: ['His brother Darius', 'His girlfriend Van', 'His uncle Willy'] },
{ c: 'Actors & Directors', t: 3, q: 'Which actor played the consigliere Tom Hagen in The Godfather?', a: 'Robert Duvall', d: ['James Caan', 'Sterling Hayden', 'Richard Castellano'] },
{ c: 'Awards & Box Office', t: 3, q: 'Which actress won Best Actress for Cabaret?', a: 'Liza Minnelli', d: ['Diana Ross', 'Maggie Smith', 'Liv Ullmann'] },
{ c: 'Behind the Scenes', t: 3, q: 'Which 1977 film was shot partly at Tikal in Guatemala for the rebel base on Yavin 4?', a: 'Star Wars', d: ['Raiders of the Lost Ark', 'Close Encounters of the Third Kind', 'Sorcerer'] },

{ c: 'Movies', t: 4, q: 'What does Noriko resist doing throughout Ozu\'s Late Spring?', a: 'Marrying and leaving her widowed father', d: ['Selling the family house', 'Taking a job in Tokyo', 'Moving in with her aunt'], from: 'script:d40q16' },
{ c: 'Television', t: 4, q: 'Which 1990s science fiction series was built around a planned five-year story arc set on a diplomatic space station?', a: 'Babylon 5', d: ['Farscape', 'Andromeda', 'Space: Above and Beyond'], from: 'script:d40q17' },
{ c: 'Actors & Directors', t: 4, q: 'Which composer scored Vertigo, Psycho and Taxi Driver?', a: 'Bernard Herrmann', d: ['Elmer Bernstein', 'Franz Waxman', 'Miklos Rozsa'], from: 'script:d32q18' },
{ c: 'Awards & Box Office', t: 4, q: 'Which Argentine film won the Academy Award for Best Foreign Language Film for 2009?', a: 'The Secret in Their Eyes', d: ['The White Ribbon', 'A Prophet', 'Ajami'], from: 'script:d31q19' },
{ c: 'Behind the Scenes', t: 4, q: 'Which Swiss artist designed the creature and the derelict ship for the 1979 film Alien?', a: 'H.R. Giger', d: ['Syd Mead', 'Ken Adam', 'Rick Baker'], from: 'script:d31q20' },

{ c: 'Movies', t: 5, q: 'In The Spirit of the Beehive, which film does the young girl watch in the village hall?', a: 'Frankenstein', d: ['The Wolf Man', 'Nosferatu', 'King Kong'], from: 'script:d32q21' },
{ c: 'Television', t: 5, q: 'Which Icelandic crime series cuts off a small fjord town by storm after a body is pulled from the harbor?', a: 'Trapped', d: ['Case', 'The Valhalla Murders', 'Lava Field'], from: 'script:d38q22' },
{ c: 'Actors & Directors', t: 5, q: 'Which Cuban director made Memories of Underdevelopment?', a: 'Tomas Gutierrez Alea', d: ['Julio Garcia Espinosa', 'Humberto Solas', 'Santiago Alvarez'], from: 'script:d53q23' },
{ c: 'Awards & Box Office', t: 5, q: 'Which film won the Sundance Grand Jury Prize for drama in 1996?', a: 'Welcome to the Dollhouse', d: ['The Spitfire Grill', 'Girls Town', 'Big Night'], from: 'script:d46q24' },
{ c: 'Behind the Scenes', t: 5, q: 'Which effects supervisor developed the slit-scan rig used for the Star Gate sequence of 2001: A Space Odyssey?', a: 'Douglas Trumbull', d: ['Ray Harryhausen', 'Albert Whitlock', 'Linwood Dunn'], from: 'script:d32q25' },
],

// ── Day 101 ────────────────────────────────────────────────────────────
[
{ c: 'Movies', t: 1, q: 'In The Lord of the Rings, what kind of creature is Frodo Baggins?', a: 'A hobbit', d: ['An elf', 'A dwarf', 'A wizard'] },
{ c: 'Television', t: 1, q: 'In Scooby-Doo, what is the gang\'s van called?', a: 'The Mystery Machine', d: ['The Ghost Wagon', 'The Spook Bus', 'The Clue Van'] },
{ c: 'Actors & Directors', t: 1, q: 'Which actress played the title role in the 2023 film Barbie?', a: 'Margot Robbie', d: ['Emma Stone', 'Florence Pugh', 'Saoirse Ronan'] },
{ c: 'Awards & Box Office', t: 1, q: 'Which New York film festival did Robert De Niro co-found in 2002?', a: 'The Tribeca Film Festival', d: ['The New York Film Festival', 'The Hamptons Film Festival', 'The Brooklyn Film Festival'] },
{ c: 'Behind the Scenes', t: 1, q: 'What is animation made with modeling clay figures commonly called?', a: 'Claymation', d: ['Rotoscoping', 'Cel animation', 'Motion capture'] },

{ c: 'Movies', t: 2, q: 'In the Harry Potter films, what does the spell Expelliarmus do?', a: 'Knocks the wand from an opponent\'s hand', d: ['Unlocks doors', 'Makes objects float', 'Summons a guardian'] },
{ c: 'Television', t: 2, q: 'In The Mandalorian, what is the name of the child the hero protects?', a: 'Grogu', d: ['Ahsoka', 'Moff', 'Cara'] },
{ c: 'Actors & Directors', t: 2, q: 'Which actor played Jack Ryan in The Hunt for Red October?', a: 'Alec Baldwin', d: ['Harrison Ford', 'Ben Affleck', 'Kevin Costner'] },
{ c: 'Awards & Box Office', t: 2, q: 'Which song from Disney\'s Pocahontas won Best Original Song?', a: 'Colors of the Wind', d: ['Just Around the Riverbend', 'Savages', 'Mine, Mine, Mine'] },
{ c: 'Behind the Scenes', t: 2, q: 'Which 1960 film is often cited as the first American feature to show a toilet being flushed?', a: 'Psycho', d: ['The Apartment', 'Spartacus', 'Elmer Gantry'] },

{ c: 'Movies', t: 3, q: 'In The Maltese Falcon, what does the prized falcon statuette turn out to be?', a: 'A lead fake', d: ['Solid gold', 'Hollow and full of diamonds', 'A wooden carving'] },
{ c: 'Television', t: 3, q: 'In Mad Men, which advertising agency do Don, Roger and Bert found at the end of season three?', a: 'Sterling Cooper Draper Pryce', d: ['McCann Erickson', 'Cutler Gleason and Chaough', 'Putnam, Powell and Lowe'] },
{ c: 'Actors & Directors', t: 3, q: 'Which Danish director made Drive and Only God Forgives?', a: 'Nicolas Winding Refn', d: ['Lars von Trier', 'Thomas Vinterberg', 'Susanne Bier'] },
{ c: 'Awards & Box Office', t: 3, q: 'Which actress won Best Actress for Boys Don\'t Cry?', a: 'Hilary Swank', d: ['Chloe Sevigny', 'Annette Bening', 'Julianne Moore'] },
{ c: 'Behind the Scenes', t: 3, q: 'Which 1920 German Expressionist film is known for its painted, crooked sets?', a: 'The Cabinet of Dr. Caligari', d: ['Metropolis', 'M', 'Faust'] },

{ c: 'Movies', t: 4, q: 'In Paris, Texas, where does Travis find Jane working?', a: 'In a peep-show booth', d: ['In a diner', 'In a bank', 'In a church'] },
{ c: 'Television', t: 4, q: 'Which prime-time soap opera featured the oil magnate J.R. Ewing?', a: 'Dallas', d: ['Falcon Crest', 'Dynasty', 'Knots Landing'], from: 'script:d12q17' },
{ c: 'Actors & Directors', t: 4, q: 'Which French actress starred in The Piano Teacher, La Ceremonie and Amour?', a: 'Isabelle Huppert', d: ['Isabelle Adjani', 'Juliette Binoche', 'Catherine Deneuve'], from: 'script:d40q18' },
{ c: 'Awards & Box Office', t: 4, q: 'Which film won the BAFTA for Best Film at the 2020 ceremony?', a: '1917', d: ['Parasite', 'Once Upon a Time in Hollywood', 'Joker'], from: 'script:d39q19' },
{ c: 'Behind the Scenes', t: 4, q: 'Which 1968 film had a giant rotating centrifuge built so actors could appear to walk around the inside of a spacecraft?', a: '2001: A Space Odyssey', d: ['Marooned', 'Planet of the Apes', 'Barbarella'], from: 'script:d32q20' },

{ c: 'Movies', t: 5, q: 'Where does the closing scene of Robert Bresson\'s Pickpocket take place?', a: 'In a prison visiting room', d: ['In a church', 'At the racetrack', 'On a train platform'], from: 'script:d37q21' },
{ c: 'Television', t: 5, q: 'Which CBS variety series ran from 1948 and introduced America to the Beatles?', a: 'The Ed Sullivan Show', d: ['Texaco Star Theater', 'The Colgate Comedy Hour', 'Your Show of Shows'], from: 'script:d30q22' },
{ c: 'Actors & Directors', t: 5, q: 'Which actor played the grown Apu in Satyajit Ray\'s The World of Apu, and went on to make more than a dozen films with that director?', a: 'Soumitra Chatterjee', d: ['Subir Banerjee', 'Uttam Kumar', 'Anil Chatterjee'], from: 'script:d32q23' },
{ c: 'Awards & Box Office', t: 5, q: 'Which film won the Sundance Grand Jury Prize for drama in 2003?', a: 'American Splendor', d: ['Thirteen', 'The Station Agent', 'Raising Victor Vargas'], from: 'script:d51q24' },
{ c: 'Behind the Scenes', t: 5, q: 'Which BBC Radiophonic Workshop composer realized the original 1963 Doctor Who theme from Ron Grainer\'s written score?', a: 'Delia Derbyshire', d: ['Daphne Oram', 'Maddalena Fagandini', 'Dick Mills'], from: 'script:d34q25' },
],

// ── Day 102 ────────────────────────────────────────────────────────────
[
{ c: 'Movies', t: 1, q: 'In Ice Age, what kind of animal is Manny?', a: 'A woolly mammoth', d: ['A sloth', 'A saber-toothed cat', 'A rhinoceros'] },
{ c: 'Television', t: 1, q: 'On Sesame Street, which furry red monster speaks of himself in the third person?', a: 'Elmo', d: ['Grover', 'Cookie Monster', 'Telly'] },
{ c: 'Actors & Directors', t: 1, q: 'Which actor played Captain Kirk in the 2009 Star Trek film?', a: 'Chris Pine', d: ['Zachary Quinto', 'Karl Urban', 'Chris Pratt'] },
{ c: 'Awards & Box Office', t: 1, q: 'Which comedian hosted the Academy Awards nineteen times between 1940 and 1978?', a: 'Bob Hope', d: ['Johnny Carson', 'Billy Crystal', 'Jack Benny'] },
{ c: 'Behind the Scenes', t: 1, q: 'What is a drive-in?', a: 'An outdoor cinema watched from parked cars', d: ['A cinema inside a shopping mall', 'A fast food chain near studios', 'A studio parking lot set'] },

{ c: 'Movies', t: 2, q: 'In Disney\'s Aladdin, what is the name of Jafar\'s parrot?', a: 'Iago', d: ['Abu', 'Rajah', 'Zazu'] },
{ c: 'Television', t: 2, q: 'In The Walking Dead, what is Rick Grimes\'s job before the outbreak?', a: 'A sheriff\'s deputy', d: ['A paramedic', 'A soldier', 'A schoolteacher'] },
{ c: 'Actors & Directors', t: 2, q: 'Which director made The Exorcist and The French Connection?', a: 'William Friedkin', d: ['Sidney Lumet', 'Francis Ford Coppola', 'Peter Bogdanovich'] },
{ c: 'Awards & Box Office', t: 2, q: 'Which film was the top-grossing release in North America in 2005?', a: 'Star Wars: Episode III, Revenge of the Sith', d: ['Harry Potter and the Goblet of Fire', 'The Chronicles of Narnia: The Lion, the Witch and the Wardrobe', 'War of the Worlds'] },
{ c: 'Behind the Scenes', t: 2, q: 'What is a match cut?', a: 'A cut that links two shots by a shared shape or movement', d: ['A cut made with scissors on set', 'A cut that removes a whole scene', 'A cut agreed with the censor'] },

{ c: 'Movies', t: 3, q: 'In Apocalypse Now, which renegade officer is Captain Willard sent to find and kill?', a: 'Colonel Kurtz', d: ['Colonel Kilgore', 'Major Kong', 'Sergeant Elias'] },
{ c: 'Television', t: 3, q: 'In Mad Men, what is the surname of the secretary who rises to copywriter, Peggy?', a: 'Olson', d: ['Holloway', 'Calvet', 'Harris'] },
{ c: 'Actors & Directors', t: 3, q: 'Which actress played the replicant Rachael in Blade Runner?', a: 'Sean Young', d: ['Daryl Hannah', 'Joanna Cassidy', 'Kim Basinger'] },
{ c: 'Awards & Box Office', t: 3, q: 'Which actress won Best Actress for playing Virginia Woolf in The Hours?', a: 'Nicole Kidman', d: ['Julianne Moore', 'Meryl Streep', 'Salma Hayek'] },
{ c: 'Behind the Scenes', t: 3, q: 'What is a split screen?', a: 'Two or more images shown side by side in one frame', d: ['A screen torn during a premiere', 'A film shown on two screens', 'A cut between two cameras'] },

{ c: 'Movies', t: 4, q: 'In Fellini\'s 8½, what is Guido\'s profession?', a: 'Film director', d: ['Novelist', 'Journalist', 'Architect'] },
{ c: 'Television', t: 4, q: 'Which anthology series began with two Louisiana detectives and changed its cast each season?', a: 'True Detective', d: ['Sharp Objects', 'Fargo', 'The Sinner'], from: 'script:d28q17' },
{ c: 'Actors & Directors', t: 4, q: 'Which actress starred as Holly Golightly in Breakfast at Tiffany\'s?', a: 'Audrey Hepburn', d: ['Natalie Wood', 'Leslie Caron', 'Grace Kelly'], from: 'script:d07q18' },
{ c: 'Awards & Box Office', t: 4, q: 'Which Hungarian film won the Academy Award for Best Foreign Language Film for 2015?', a: 'Son of Saul', d: ['Embrace of the Serpent', 'Mustang', 'Theeb'], from: 'script:d52q19' },
{ c: 'Behind the Scenes', t: 4, q: 'Which 1974 mystery had a screenplay by Robert Towne, who publicly disagreed with the director over its ending?', a: 'Chinatown', d: ['The Long Goodbye', 'The Conversation', 'Serpico'], from: 'script:d38q20' },

{ c: 'Movies', t: 5, q: 'In A Matter of Life and Death, which realm is rendered in black and white while the other is in color?', a: 'The other world after death', d: ['The operating room', 'The pilot\'s memories of childhood', 'Wartime England'], from: 'script:d31q21' },
{ c: 'Television', t: 5, q: 'Which Gerry Anderson puppet series followed the Tracy brothers and International Rescue?', a: 'Thunderbirds', d: ['Stingray', 'Captain Scarlet', 'Joe 90'], from: 'script:d22q22' },
{ c: 'Actors & Directors', t: 5, q: 'Which Georgian director made Repentance, the final part of a trilogy begun with The Plea?', a: 'Tengiz Abuladze', d: ['Sergei Parajanov', 'Otar Iosseliani', 'Eldar Shengelaia'], from: 'script:d42q23' },
{ c: 'Awards & Box Office', t: 5, q: 'Which film about a Welsh mining family won Best Picture at the 1942 ceremony?', a: 'How Green Was My Valley', d: ['Citizen Kane', 'Sergeant York', 'The Maltese Falcon'], from: 'script:d30q24' },
{ c: 'Behind the Scenes', t: 5, q: 'In which Paris venue did the Lumiere brothers hold their first paying public screening?', a: 'The Salon Indien du Grand Cafe', d: ['The Moulin Rouge', 'The Folies Bergere', 'The Theatre Robert-Houdin'], from: 'script:d24q25' },
],

// ── Day 103 ────────────────────────────────────────────────────────────
[
{ c: 'Movies', t: 1, q: 'In The Princess and the Frog, which city is the story set in?', a: 'New Orleans', d: ['Atlanta', 'Savannah', 'Memphis'] },
{ c: 'Television', t: 1, q: 'In Doctor Who, what kind of being is the Doctor?', a: 'A Time Lord', d: ['A Dalek', 'A Cyberman', 'A Sontaran'] },
{ c: 'Actors & Directors', t: 1, q: 'Which actor played Fox Mulder in The X-Files?', a: 'David Duchovny', d: ['Mitch Pileggi', 'Kyle MacLachlan', 'Robert Patrick'] },
{ c: 'Awards & Box Office', t: 1, q: 'What do people call a film that earns hundreds of millions of dollars at the box office?', a: 'A blockbuster', d: ['A B movie', 'An art film', 'A short'] },
{ c: 'Behind the Scenes', t: 1, q: 'What is an animatronic?', a: 'A mechanical puppet moved by motors', d: ['A hand-drawn cartoon character', 'A digital crowd', 'A voice actor'] },

{ c: 'Movies', t: 2, q: 'In The Lion King, what is the name of Simba\'s childhood friend who later becomes his mate?', a: 'Nala', d: ['Sarabi', 'Shenzi', 'Kiara'] },
{ c: 'Television', t: 2, q: 'In The Simpsons, what is the name of Mr. Burns\'s loyal assistant?', a: 'Waylon Smithers', d: ['Lenny Leonard', 'Carl Carlson', 'Kent Brockman'] },
{ c: 'Actors & Directors', t: 2, q: 'Which actor played Agent Smith in The Matrix?', a: 'Hugo Weaving', d: ['Joe Pantoliano', 'Laurence Fishburne', 'Lance Henriksen'] },
{ c: 'Awards & Box Office', t: 2, q: 'Which political drama won the Emmy for Outstanding Drama Series four years running from 2000 to 2003?', a: 'The West Wing', d: ['The Sopranos', 'ER', 'NYPD Blue'] },
{ c: 'Behind the Scenes', t: 2, q: 'What is a mockumentary?', a: 'A comedy styled as a documentary', d: ['A documentary about mocking critics', 'A film made of stock footage', 'A documentary with reenactments'] },

{ c: 'Movies', t: 3, q: 'In Citizen Kane, what is the name of the New York newspaper Kane takes over?', a: 'The Inquirer', d: ['The Chronicle', 'The Clarion', 'The Globe'] },
{ c: 'Television', t: 3, q: 'Which writer created and hosted The Twilight Zone?', a: 'Rod Serling', d: ['Alfred Hitchcock', 'Gene Roddenberry', 'Paddy Chayefsky'] },
{ c: 'Actors & Directors', t: 3, q: 'Which director made Eternal Sunshine of the Spotless Mind?', a: 'Michel Gondry', d: ['Spike Jonze', 'Charlie Kaufman', 'Jean-Pierre Jeunet'] },
{ c: 'Awards & Box Office', t: 3, q: 'Which film won the Academy Award for Best Animated Feature for 2009?', a: 'Up', d: ['Coraline', 'The Princess and the Frog', 'Fantastic Mr. Fox'], from: 'script:d35q14' },
{ c: 'Behind the Scenes', t: 3, q: 'Which cinematography technique keeps foreground and background sharp at once, famously used in Citizen Kane?', a: 'Deep focus', d: ['Soft focus', 'Rack focus', 'Split diopter'] },

{ c: 'Movies', t: 4, q: 'In Metropolis, whose likeness is given to the robot?', a: 'Maria', d: ['Freder', 'Joh Fredersen', 'Rotwang'] },
{ c: 'Television', t: 4, q: 'Which 1966 Japanese series featured a giant silver and red hero who could only fight on Earth for three minutes at a time?', a: 'Ultraman', d: ['Kamen Rider', 'Ultra Q', 'Giant Robo'], from: 'script:d32q17' },
{ c: 'Actors & Directors', t: 4, q: 'Which twenty-five year old directed and starred in Citizen Kane?', a: 'Orson Welles', d: ['John Huston', 'Elia Kazan', 'Nicholas Ray'], from: 'script:d04q18' },
{ c: 'Awards & Box Office', t: 4, q: 'Which series won the Emmy for Outstanding Drama Series four years running from 2008 to 2011?', a: 'Mad Men', d: ['Dexter', 'Lost', 'Breaking Bad'], from: 'script:d40q19' },
{ c: 'Behind the Scenes', t: 4, q: 'Which decommissioned Lithuanian nuclear plant stood in for the reactor site in the 2019 miniseries Chernobyl?', a: 'Ignalina', d: ['Kozloduy', 'Temelin', 'Paks'], from: 'script:d52q20' },

{ c: 'Movies', t: 5, q: 'Which tinned fruit does the lovesick policeman keep buying in Chungking Express?', a: 'Pineapple', d: ['Lychees', 'Peaches', 'Mandarins'], from: 'script:d22q21' },
{ c: 'Television', t: 5, q: 'Which Mexican comedy series centered on a poor orphan boy who lived in a barrel in a tenement courtyard?', a: 'El Chavo del Ocho', d: ['Los Polivoces', 'El Chapulin Colorado', 'La Familia P. Luche'], from: 'script:d36q22' },
{ c: 'Actors & Directors', t: 5, q: 'Which Australian born cinematographer shot Chungking Express and Happy Together for Wong Kar-wai?', a: 'Christopher Doyle', d: ['Jingle Ma', 'Peter Pau', 'Mark Lee Ping-bing'], from: 'script:d52q23' },
{ c: 'Awards & Box Office', t: 5, q: 'Which film won the Sundance Grand Jury Prize for drama in 2012?', a: 'Beasts of the Southern Wild', d: ['Middle of Nowhere', 'Compliance', 'Smashed'], from: 'script:d38q24' },
{ c: 'Behind the Scenes', t: 5, q: 'Which film gauge did Kodak introduce in 1923 for amateur filmmakers?', a: '16mm', d: ['8mm', 'Super 8', '9.5mm'], from: 'script:d29q25' },
],

// ── Day 104 ────────────────────────────────────────────────────────────
[
{ c: 'Movies', t: 1, q: 'In Star Wars, which little droid communicates in beeps and whistles?', a: 'R2-D2', d: ['C-3PO', 'K-2SO', 'IG-88'] },
{ c: 'Television', t: 1, q: 'Which 1970s sitcom starred Carroll O\'Connor as the bigoted Archie Bunker?', a: 'All in the Family', d: ['Sanford and Son', 'The Jeffersons', 'Maude'] },
{ c: 'Actors & Directors', t: 1, q: 'Which actor played Jon Snow in Game of Thrones?', a: 'Kit Harington', d: ['Richard Madden', 'Nikolaj Coster-Waldau', 'Alfie Allen'] },
{ c: 'Awards & Box Office', t: 1, q: 'Which former child star of Indiana Jones won Best Supporting Actor for Everything Everywhere All at Once?', a: 'Ke Huy Quan', d: ['James Hong', 'Brendan Fraser', 'Barry Keoghan'] },
{ c: 'Behind the Scenes', t: 1, q: 'Which Hollywood movie palace, opened in 1927, keeps stars\' handprints and footprints set in cement in its forecourt?', a: 'The Chinese Theater', d: ['The Egyptian Theater', 'The Pantages Theater', 'The El Capitan Theater'] },

{ c: 'Movies', t: 2, q: 'In Mary Poppins, what is Bert\'s job in the rooftop dance number?', a: 'Chimney sweep', d: ['Lamplighter', 'Window cleaner', 'Roofer'] },
{ c: 'Television', t: 2, q: 'In Gilmore Girls, what is the name of Lorelai\'s daughter?', a: 'Rory', d: ['Paris', 'Lane', 'Sookie'] },
{ c: 'Actors & Directors', t: 2, q: 'Which actress played Cersei Lannister in Game of Thrones?', a: 'Lena Headey', d: ['Michelle Fairley', 'Diana Rigg', 'Carice van Houten'] },
{ c: 'Awards & Box Office', t: 2, q: 'Which composer won the Academy Award for scoring Up?', a: 'Michael Giacchino', d: ['Randy Newman', 'Alan Silvestri', 'Thomas Newman'] },
{ c: 'Behind the Scenes', t: 2, q: 'Which streaming service released The Handmaid\'s Tale?', a: 'Hulu', d: ['Netflix', 'Apple TV+', 'Amazon Prime Video'] },

{ c: 'Movies', t: 3, q: 'In Die Hard, which city\'s police force does John McClane belong to?', a: 'New York', d: ['Los Angeles', 'Chicago', 'Philadelphia'] },
{ c: 'Television', t: 3, q: 'In Veep, what is the surname of Julia Louis-Dreyfus\'s character Selina?', a: 'Meyer', d: ['Hughes', 'Underwood', 'Grant'] },
{ c: 'Actors & Directors', t: 3, q: 'Which actor played the villain Bane in The Dark Knight Rises?', a: 'Tom Hardy', d: ['Liam Neeson', 'Cillian Murphy', 'Aaron Eckhart'] },
{ c: 'Awards & Box Office', t: 3, q: 'Which silent comedy star returned to Hollywood in 1972 to receive an honorary Academy Award?', a: 'Charlie Chaplin', d: ['Buster Keaton', 'Harold Lloyd', 'Stan Laurel'] },
{ c: 'Behind the Scenes', t: 3, q: 'For which Pixar film did the studio write new simulation software to animate the millions of hairs on Sulley?', a: 'Monsters, Inc.', d: ['Toy Story 2', 'Up', 'Brave'] },

{ c: 'Movies', t: 4, q: 'In The Third Man, what kind of books does Holly Martins write?', a: 'Pulp westerns', d: ['Detective stories', 'Travel guides', 'Poetry'] },
{ c: 'Television', t: 4, q: 'The Italian detective series based on Andrea Camilleri novels is set in which fictional Sicilian town?', a: 'Vigata', d: ['Trapani', 'Ragusa', 'Corleone'], from: 'script:d33q17' },
{ c: 'Actors & Directors', t: 4, q: 'Which British director made Kes and Cathy Come Home?', a: 'Ken Loach', d: ['Lindsay Anderson', 'Mike Leigh', 'Alan Clarke'], from: 'script:d29q18' },
{ c: 'Awards & Box Office', t: 4, q: 'Which Danish film won the Academy Award for Best International Feature for 2020?', a: 'Another Round', d: ['Better Days', 'Collective', 'Quo Vadis, Aida?'], from: 'script:d35q19' },
{ c: 'Behind the Scenes', t: 4, q: 'Which disused London gasworks was dressed to stand in for the ruined Vietnamese city of Hue in Full Metal Jacket?', a: 'Beckton', d: ['Greenwich', 'Battersea', 'Bankside'], from: 'script:d35q20' },

{ c: 'Movies', t: 5, q: 'What is the traveler searching for across the Balkans in Ulysses\' Gaze?', a: 'Three undeveloped reels of film', d: ['A stolen icon', 'His brother\'s grave', 'A lost violin'], from: 'script:d38q21' },
{ c: 'Television', t: 5, q: 'Which Australian soap opera set in a women\'s prison ran from 1979 and built a cult following in Britain?', a: 'Prisoner', d: ['The Box', 'Within These Walls', 'Bad Girls'], from: 'script:d51q22' },
{ c: 'Actors & Directors', t: 5, q: 'Which Soviet Armenian director made The Color of Pomegranates?', a: 'Sergei Parajanov', d: ['Tengiz Abuladze', 'Otar Iosseliani', 'Andrei Konchalovsky'], from: 'script:d39q23' },
{ c: 'Awards & Box Office', t: 5, q: 'Which film won the Unique and Artistic Picture award at the first Academy Awards, a prize never handed out again?', a: 'Sunrise', d: ['The Crowd', 'Chang', '7th Heaven'], from: 'script:d31q24' },
{ c: 'Behind the Scenes', t: 5, q: 'Which documentary recorded the collapse of Terry Gilliam\'s first attempt to film the Don Quixote story in 2000?', a: 'Lost in La Mancha', d: ['Burden of Dreams', 'Hearts of Darkness', 'Jodorowsky\'s Dune'], from: 'script:d33q25' },
],

// ── Day 105 ────────────────────────────────────────────────────────────
[
{ c: 'Movies', t: 1, q: 'In Ratatouille, what is the name of the rat who dreams of becoming a chef?', a: 'Remy', d: ['Emile', 'Linguini', 'Gusteau'] },
{ c: 'Television', t: 1, q: 'In I Love Lucy, what is the name of Lucy\'s bandleader husband?', a: 'Ricky Ricardo', d: ['Fred Mertz', 'Danny Williams', 'Ralph Kramden'] },
{ c: 'Actors & Directors', t: 1, q: 'Which actress played Monica Geller in Friends?', a: 'Courteney Cox', d: ['Lisa Kudrow', 'Jennifer Aniston', 'Helen Hunt'] },
{ c: 'Awards & Box Office', t: 1, q: 'Which actress won Best Actress for playing the televangelist in The Eyes of Tammy Faye?', a: 'Jessica Chastain', d: ['Olivia Colman', 'Nicole Kidman', 'Kristen Stewart'] },
{ c: 'Behind the Scenes', t: 1, q: 'Which home video format beat Betamax in the 1980s format war?', a: 'VHS', d: ['LaserDisc', 'DVD', 'Video 2000'] },

{ c: 'Movies', t: 2, q: 'In Disney\'s Mulan, what is the name of the small dragon sent to protect her?', a: 'Mushu', d: ['Cri-Kee', 'Khan', 'Shan Yu'] },
{ c: 'Television', t: 2, q: 'In Twin Peaks, at which diner does Agent Cooper enjoy cherry pie and coffee?', a: 'The Double R Diner', d: ['Monk\'s Cafe', 'Luke\'s Diner', 'Al\'s Diner'] },
{ c: 'Actors & Directors', t: 2, q: 'Which actress played Princess Buttercup in The Princess Bride?', a: 'Robin Wright', d: ['Meg Ryan', 'Kelly McGillis', 'Daryl Hannah'] },
{ c: 'Awards & Box Office', t: 2, q: 'Which 1987 box office hit about three bachelors and an infant remade the French comedy Three Men and a Cradle?', a: 'Three Men and a Baby', d: ['Fatal Attraction', 'Beverly Hills Cop II', 'Good Morning, Vietnam'] },
{ c: 'Behind the Scenes', t: 2, q: 'What is a squib in special effects?', a: 'A small explosive charge that simulates a bullet hit', d: ['A puff of fake smoke', 'A fake blood capsule held in the mouth', 'A spring that launches props'] },

{ c: 'Movies', t: 3, q: 'In The Sixth Sense, what is Malcolm Crowe\'s profession?', a: 'Child psychologist', d: ['Priest', 'Police detective', 'Schoolteacher'] },
{ c: 'Television', t: 3, q: 'In The Sopranos, what is the name of Artie Bucco\'s restaurant?', a: 'Vesuvio', d: ['Satriale\'s', 'Holsten\'s', 'Bada Bing'] },
{ c: 'Actors & Directors', t: 3, q: 'Which actor played Llewelyn Moss in No Country for Old Men?', a: 'Josh Brolin', d: ['Woody Harrelson', 'Tommy Lee Jones', 'Javier Bardem'] },
{ c: 'Awards & Box Office', t: 3, q: 'Who won Best Director for The Godfather Part II?', a: 'Francis Ford Coppola', d: ['Roman Polanski', 'Bob Fosse', 'Sidney Lumet'] },
{ c: 'Behind the Scenes', t: 3, q: 'What is a completion bond?', a: 'A guarantee to financiers that a film will be finished', d: ['A contract tying actors to sequels', 'A bonus paid at the wrap party', 'A loan repaid from DVD sales'] },

{ c: 'Movies', t: 4, q: 'In Chungking Express, which pop song does Faye play over and over?', a: 'California Dreamin\'', d: ['Dream a Little Dream of Me', 'Twist and Shout', 'Monday, Monday'] },
{ c: 'Television', t: 4, q: 'Which NBC quiz show was exposed in the late 1950s as rigged, with Charles Van Doren among its stars?', a: 'Twenty-One', d: ['The $64,000 Question', 'What\'s My Line?', 'Dotto'] },
{ c: 'Actors & Directors', t: 4, q: 'Which former Baltimore Sun reporter created The Wire?', a: 'David Simon', d: ['Tom Fontana', 'David Milch', 'Shawn Ryan'], from: 'script:d41q18' },
{ c: 'Awards & Box Office', t: 4, q: 'Which series swept all seven comedy categories at the 2020 Primetime Emmy Awards?', a: 'Schitt\'s Creek', d: ['The Good Place', 'Ted Lasso', 'Veep'], from: 'script:d38q19' },
{ c: 'Behind the Scenes', t: 4, q: 'Whose foam latex appliances for a 1968 science fiction film let the actors\' faces move under full ape makeup?', a: 'John Chambers', d: ['William Tuttle', 'Rick Baker', 'Jack Pierce'], from: 'script:d37q20' },

{ c: 'Movies', t: 5, q: 'What are the professions of the two lovers in Hiroshima Mon Amour?', a: 'A French actress and a Japanese architect', d: ['A doctor and a teacher', 'A journalist and a soldier', 'A singer and an engineer'], from: 'script:d28q21' },
{ c: 'Television', t: 5, q: 'In Ghost in the Shell: Stand Alone Complex, what is the name of the counter-terrorism unit the main characters belong to?', a: 'Public Security Section 9', d: ['the Niihama Task Force', 'Section 4', 'Section 6'], from: 'script:d46q22' },
{ c: 'Actors & Directors', t: 5, q: 'Which French director made A Man Escaped and Pickpocket?', a: 'Robert Bresson', d: ['Louis Malle', 'Jean-Pierre Melville', 'Georges Franju'], from: 'script:d28q23' },
{ c: 'Awards & Box Office', t: 5, q: 'Which film won the Sundance Grand Jury Prize for drama in 2008?', a: 'Frozen River', d: ['Sleep Dealer', 'Ballast', 'Sugar'], from: 'script:d45q24' },
{ c: 'Behind the Scenes', t: 5, q: 'Which 1960 epic replaced Anthony Mann with Stanley Kubrick about a week into shooting?', a: 'Spartacus', d: ['El Cid', 'The Fall of the Roman Empire', 'King of Kings'], from: 'script:d51q25' },
],

// ── Day 106 ────────────────────────────────────────────────────────────
[
{ c: 'Movies', t: 1, q: 'In The Wizard of Oz, which state does Dorothy come from?', a: 'Kansas', d: ['Nebraska', 'Oklahoma', 'Iowa'] },
{ c: 'Television', t: 1, q: 'In Game of Thrones, what is the name of the Stark family castle?', a: 'Winterfell', d: ['Storm\'s End', 'Casterly Rock', 'Highgarden'] },
{ c: 'Actors & Directors', t: 1, q: 'Which actor played the young chocolatier in the 2023 film Wonka?', a: 'Timothee Chalamet', d: ['Tom Holland', 'Ansel Elgort', 'Dev Patel'] },
{ c: 'Awards & Box Office', t: 1, q: 'At the Oscars, what do presenters open to reveal each winner?', a: 'An envelope', d: ['A scroll', 'A sealed box', 'A tablet'] },
{ c: 'Behind the Scenes', t: 1, q: 'Which company produced the James Bond films from Dr. No onward?', a: 'Eon Productions', d: ['Working Title', 'Hammer Films', 'Amblin Entertainment'] },

{ c: 'Movies', t: 2, q: 'In Dirty Dancing, in which mountains is the summer resort where Baby meets Johnny?', a: 'The Catskills', d: ['The Poconos', 'The Berkshires', 'The Adirondacks'] },
{ c: 'Television', t: 2, q: 'In Schitt\'s Creek, what is the name of the motel where the Roses end up living?', a: 'The Rosebud Motel', d: ['The Bates Motel', 'The Shady Rest', 'The Pine Lodge'] },
{ c: 'Actors & Directors', t: 2, q: 'Which actor played Dumbledore in the first two Harry Potter films?', a: 'Richard Harris', d: ['Michael Gambon', 'Ian McKellen', 'Christopher Lee'] },
{ c: 'Awards & Box Office', t: 2, q: 'Who won Best Director for Amadeus?', a: 'Milos Forman', d: ['Roland Joffe', 'David Lean', 'Robert Benton'] },
{ c: 'Behind the Scenes', t: 2, q: 'Which sound company did George Lucas found at his ranch in Marin County?', a: 'Skywalker Sound', d: ['Dolby Laboratories', 'THX Sound', 'Lucas Audio'] },

{ c: 'Movies', t: 3, q: 'In Some Like It Hot, how do the two musicians hide from the mob?', a: 'They disguise themselves as women in an all-female band', d: ['They join the navy', 'They pose as priests', 'They take jobs as hotel waiters'] },
{ c: 'Television', t: 3, q: 'In The Simpsons, which brand of beer does Homer drink?', a: 'Duff', d: ['Buzz', 'Fudd', 'Molson'] },
{ c: 'Actors & Directors', t: 3, q: 'Which actress played Imperator Furiosa in Mad Max: Fury Road?', a: 'Charlize Theron', d: ['Anya Taylor-Joy', 'Rosie Huntington-Whiteley', 'Zoe Kravitz'] },
{ c: 'Awards & Box Office', t: 3, q: 'Which actress won Best Actress for playing Edith Piaf in La Vie en Rose?', a: 'Marion Cotillard', d: ['Juliette Binoche', 'Audrey Tautou', 'Julie Christie'] },
{ c: 'Behind the Scenes', t: 3, q: 'Which French term names the shadowy 1940s American crime films of moral ambiguity?', a: 'Film noir', d: ['Nouvelle vague', 'Cinema verite', 'Auteur cinema'] },

{ c: 'Movies', t: 4, q: 'In Bergman\'s Persona, what has the actress Elisabet suddenly stopped doing?', a: 'Speaking', d: ['Eating', 'Sleeping', 'Acting in films'] },
{ c: 'Television', t: 4, q: 'Which 1971 television film by Steven Spielberg pits a driver against a menacing tanker truck?', a: 'Duel', d: ['Killdozer', 'Something Evil', 'Night of Terror'] },
{ c: 'Actors & Directors', t: 4, q: 'Which Polish director made the Three Colors trilogy and The Double Life of Veronique?', a: 'Krzysztof Kieslowski', d: ['Andrzej Wajda', 'Jerzy Skolimowski', 'Agnieszka Holland'], from: 'script:d33q18' },
{ c: 'Awards & Box Office', t: 4, q: 'Which series won the Emmy for Outstanding Drama Series in both 2013 and 2014?', a: 'Breaking Bad', d: ['Mad Men', 'Homeland', 'House of Cards'], from: 'script:d36q19' },
{ c: 'Behind the Scenes', t: 4, q: 'Which 1954 Hitchcock film had an entire Greenwich Village courtyard built as a single set on a Paramount soundstage?', a: 'Rear Window', d: ['Rosemary\'s Baby', 'On the Waterfront', 'The Apartment'], from: 'script:d34q20' },

{ c: 'Movies', t: 5, q: 'Which matchstick game do the men repeatedly play in Last Year at Marienbad?', a: 'Nim', d: ['Backgammon', 'Dominoes', 'Mancala'], from: 'script:d35q21' },
{ c: 'Television', t: 5, q: 'Which Spanish series, beginning in 2001, followed the Alcantara family through the last years of the Franco era?', a: 'Cuentame como paso', d: ['Aqui no hay quien viva', 'Verano azul', 'Amar es para siempre'], from: 'script:d55q22' },
{ c: 'Actors & Directors', t: 5, q: 'Which Malian director made Yeelen?', a: 'Souleymane Cisse', d: ['Ousmane Sembene', 'Med Hondo', 'Idrissa Ouedraogo'], from: 'script:d37q23' },
{ c: 'Awards & Box Office', t: 5, q: 'Which Romanian film took the Palme d\'Or at Cannes in 2007?', a: '4 Months, 3 Weeks and 2 Days', d: ['The Death of Mr. Lazarescu', 'Secret Sunshine', 'Persepolis'], from: 'script:d37q24' },
{ c: 'Behind the Scenes', t: 5, q: 'Which classic color process exposed three separate strips of black and white negative at once?', a: 'Technicolor', d: ['Agfacolor', 'Eastmancolor', 'Kinemacolor'], from: 'script:d11q25' },
],

// ── Day 107 ────────────────────────────────────────────────────────────
[
{ c: 'Movies', t: 1, q: 'In Lilo and Stitch, where does the story take place?', a: 'Hawaii', d: ['Florida', 'Fiji', 'California'] },
{ c: 'Television', t: 1, q: 'In Star Trek, what is Captain Kirk\'s starship called?', a: 'The USS Enterprise', d: ['The USS Voyager', 'The USS Defiant', 'The Millennium Falcon'] },
{ c: 'Actors & Directors', t: 1, q: 'Which actress starred as Mia Thermopolis in The Princess Diaries?', a: 'Anne Hathaway', d: ['Mandy Moore', 'Hilary Duff', 'Lindsay Lohan'] },
{ c: 'Awards & Box Office', t: 1, q: 'What is a film called that seems made mainly to win awards?', a: 'Oscar bait', d: ['A sleeper', 'A tentpole', 'A four-quadrant film'] },
{ c: 'Behind the Scenes', t: 1, q: 'What is the term for a story\'s main character?', a: 'The protagonist', d: ['The antagonist', 'The narrator', 'The understudy'] },

{ c: 'Movies', t: 2, q: 'In Tangled, what kind of animal is Rapunzel\'s companion Pascal?', a: 'A chameleon', d: ['A frog', 'A squirrel', 'A gecko'] },
{ c: 'Television', t: 2, q: 'In Mad Men, what is Don Draper\'s real name?', a: 'Dick Whitman', d: ['Roger Sterling', 'Pete Campbell', 'Bert Cooper'] },
{ c: 'Actors & Directors', t: 2, q: 'Which actor played Kramer in Seinfeld?', a: 'Michael Richards', d: ['Jason Alexander', 'Wayne Knight', 'Larry David'] },
{ c: 'Awards & Box Office', t: 2, q: 'Which Phil Collins song from Tarzan won Best Original Song?', a: 'You\'ll Be in My Heart', d: ['Two Worlds', 'Strangers Like Me', 'Against All Odds'] },
{ c: 'Behind the Scenes', t: 2, q: 'What is breakaway glass made to do?', a: 'Shatter safely when an actor goes through it', d: ['Reflect the camera crew', 'Keep sets warm', 'Stay unbroken in explosions'] },

{ c: 'Movies', t: 3, q: 'In The Princess Bride, which odorless poison is used in the battle of wits?', a: 'Iocane powder', d: ['Arsenic', 'Hemlock', 'Belladonna'] },
{ c: 'Television', t: 3, q: 'In Breaking Bad, what business do Walt and Skyler buy to launder money?', a: 'A car wash', d: ['A laundromat', 'A nail salon', 'A pizzeria'] },
{ c: 'Actors & Directors', t: 3, q: 'Which actor played the android Ash in Alien?', a: 'Ian Holm', d: ['John Hurt', 'Tom Skerritt', 'Harry Dean Stanton'] },
{ c: 'Awards & Box Office', t: 3, q: 'Which Francis Ford Coppola war film shared the Palme d\'Or in 1979 with The Tin Drum?', a: 'Apocalypse Now', d: ['The Conversation', 'The Deer Hunter', 'Platoon'] },
{ c: 'Behind the Scenes', t: 3, q: 'What does the Bechdel test ask of a film?', a: 'Whether two women talk to each other about something other than a man', d: ['Whether it passes the censor', 'Whether it earns back its budget', 'Whether it has a female director'] },

{ c: 'Movies', t: 4, q: 'What does the astronaut find on the beach at the end of the 1968 Planet of the Apes?', a: 'The Statue of Liberty', d: ['The Golden Gate Bridge', 'The Eiffel Tower', 'Big Ben'] },
{ c: 'Television', t: 4, q: 'From which country did the sketch troupe The Kids in the Hall come?', a: 'Canada', d: ['Australia', 'Britain', 'Ireland'] },
{ c: 'Actors & Directors', t: 4, q: 'Which cinematographer shot The Godfather and Annie Hall?', a: 'Gordon Willis', d: ['Vittorio Storaro', 'Conrad Hall', 'Haskell Wexler'], from: 'script:d31q18' },
{ c: 'Awards & Box Office', t: 4, q: 'Which Iranian film won the Academy Award for Best Foreign Language Film for 2011?', a: 'A Separation', d: ['Bullhead', 'Footnote', 'In Darkness'], from: 'script:d37q19' },
{ c: 'Behind the Scenes', t: 4, q: 'What is a test screening?', a: 'Showing an unfinished cut to a recruited audience for reaction', d: ['The first public showing on opening day', 'A screening for the press before release', 'A screening for the studio\'s board'], from: 'script:d29q20' },

{ c: 'Movies', t: 5, q: 'What must the two women in Celine and Julie Go Boating swallow to re-enter the story unfolding in the house?', a: 'A piece of candy', d: ['A pinch of powder', 'A sip of tea', 'A drop of ink'], from: 'script:d42q21' },
{ c: 'Television', t: 5, q: 'Which 1980s British drama followed a gang of bricklayers working in Germany?', a: 'Auf Wiedersehen, Pet', d: ['Boys from the Blackstuff', 'Minder', 'The Beiderbecke Affair'], from: 'script:d20q22' },
{ c: 'Actors & Directors', t: 5, q: 'Which director made Breathless in 1960?', a: 'Jean-Luc Godard', d: ['Eric Rohmer', 'Francois Truffaut', 'Claude Chabrol'], from: 'script:d09q23' },
{ c: 'Awards & Box Office', t: 5, q: 'Which film about a singing priest won Best Picture at the 1945 ceremony?', a: 'Going My Way', d: ['Gaslight', 'Since You Went Away', 'Double Indemnity'], from: 'script:d29q24' },
{ c: 'Behind the Scenes', t: 5, q: 'Which Welsh village built as an Italianate resort provided the setting for the 1967 series The Prisoner?', a: 'Portmeirion', d: ['Aberaeron', 'Clovelly', 'Portsalon'], from: 'script:d52q25' },
],

// ── Day 108 ────────────────────────────────────────────────────────────
[
{ c: 'Movies', t: 1, q: 'In Zootopia, what kind of animal is the con artist Nick Wilde?', a: 'A fox', d: ['A wolf', 'A raccoon', 'A weasel'] },
{ c: 'Television', t: 1, q: 'In Seinfeld, what is George\'s last name?', a: 'Costanza', d: ['Benes', 'Kramer', 'Peterman'] },
{ c: 'Actors & Directors', t: 1, q: 'Which actress voiced Princess Fiona in Shrek?', a: 'Cameron Diaz', d: ['Julia Roberts', 'Drew Barrymore', 'Jennifer Lopez'] },
{ c: 'Awards & Box Office', t: 1, q: 'Which Texas city hosts the South by Southwest festival of film, music and tech?', a: 'Austin', d: ['Dallas', 'Houston', 'San Antonio'] },
{ c: 'Behind the Scenes', t: 1, q: 'How is slow motion usually achieved on camera?', a: 'By filming at a high frame rate and playing it back at normal speed', d: ['By slowing down the actors', 'By filming at a low frame rate', 'By adding extra frames in editing only'] },

{ c: 'Movies', t: 2, q: 'In Shrek, who rules Duloc and sends Shrek to rescue Fiona?', a: 'Lord Farquaad', d: ['Prince Charming', 'King Harold', 'Rumpelstiltskin'] },
{ c: 'Television', t: 2, q: 'In Friends, what is the name of the British woman Ross marries and then divorces?', a: 'Emily', d: ['Carol', 'Julie', 'Mona'] },
{ c: 'Actors & Directors', t: 2, q: 'Which actor played the young Obi-Wan Kenobi in the Star Wars prequels?', a: 'Ewan McGregor', d: ['Hayden Christensen', 'Liam Neeson', 'Jude Law'] },
{ c: 'Awards & Box Office', t: 2, q: 'Which comedy won the Emmy for Outstanding Comedy Series in both 2021 and 2022?', a: 'Ted Lasso', d: ['Hacks', 'Only Murders in the Building', 'Abbott Elementary'] },
{ c: 'Behind the Scenes', t: 2, q: 'What is a logline?', a: 'A one-sentence summary of a story', d: ['The final line of dialogue', 'The record of each take', 'The list of credits at the start'] },

{ c: 'Movies', t: 3, q: 'In Raiders of the Lost Ark, what is the name of the rival French archaeologist?', a: 'Belloq', d: ['Toht', 'Marcus Brody', 'Sallah'] },
{ c: 'Television', t: 3, q: 'In My So-Called Life, who is the boy Angela Chase pines for?', a: 'Jordan Catalano', d: ['Brian Krakow', 'Rickie Vasquez', 'Dylan McKay'] },
{ c: 'Actors & Directors', t: 3, q: 'Which actress played Marla Singer in Fight Club?', a: 'Helena Bonham Carter', d: ['Winona Ryder', 'Gwyneth Paltrow', 'Juliette Lewis'] },
{ c: 'Awards & Box Office', t: 3, q: 'Which actor won Best Actor for playing a fading country singer in Crazy Heart?', a: 'Jeff Bridges', d: ['Colin Firth', 'George Clooney', 'Morgan Freeman'] },
{ c: 'Behind the Scenes', t: 3, q: 'Which TV network had a peacock as its color broadcasting symbol?', a: 'NBC', d: ['CBS', 'ABC', 'DuMont'] },

{ c: 'Movies', t: 4, q: 'In Pan\'s Labyrinth, which creature has his eyes in the palms of his hands?', a: 'The Pale Man', d: ['The Faun', 'The Toad', 'The Fairy'] },
{ c: 'Television', t: 4, q: 'Which police series followed Sergeant Joe Friday of the Los Angeles police?', a: 'Dragnet', d: ['Adam-12', 'The Rookies', 'Highway Patrol'] },
{ c: 'Actors & Directors', t: 4, q: 'Which actor played the knight Antonius Block in The Seventh Seal?', a: 'Max von Sydow', d: ['Gunnar Bjornstrand', 'Erland Josephson', 'Bengt Ekerot'] },
{ c: 'Awards & Box Office', t: 4, q: 'Which film won Best Picture at the 1940 ceremony?', a: 'Gone with the Wind', d: ['The Wizard of Oz', 'Wuthering Heights', 'Stagecoach'], from: 'script:d29q19' },
{ c: 'Behind the Scenes', t: 4, q: 'What is chroma key?', a: 'Shooting against a solid color backdrop so it can be replaced later', d: ['Projecting a background behind the actors on set', 'Painting a background onto glass', 'Printing two negatives together'], from: 'script:d30q20' },

{ c: 'Movies', t: 5, q: 'What is the profession of the lead character in Jean-Pierre Melville\'s Le Samourai?', a: 'A contract killer', d: ['A jewel thief', 'A police inspector', 'A jazz pianist'], from: 'script:d05q21' },
{ c: 'Television', t: 5, q: 'Which 1969 BBC Two series surveyed Western art and ideas across thirteen episodes and became a landmark of color broadcasting?', a: 'Civilisation', d: ['Ways of Seeing', 'The Shock of the New', 'The Ascent of Man'], from: 'script:d39q22' },
{ c: 'Actors & Directors', t: 5, q: 'Which actress starred opposite Cary Grant in Bringing Up Baby?', a: 'Katharine Hepburn', d: ['Irene Dunne', 'Rosalind Russell', 'Carole Lombard'], from: 'script:d08q23' },
{ c: 'Awards & Box Office', t: 5, q: 'In which year was the Academy Awards ceremony first broadcast in color?', a: '1966', d: ['1975', '1959', '1971'], from: 'script:d21q24' },
{ c: 'Behind the Scenes', t: 5, q: 'Which matte artist painted effects shots for Hitchcock and later supervised the miniature and matte work on Earthquake?', a: 'Albert Whitlock', d: ['Matthew Yuricich', 'Emil Kosa Jr.', 'Peter Ellenshaw'], from: 'script:d38q25' },
],

// ── Day 109 ────────────────────────────────────────────────────────────
[
{ c: 'Movies', t: 1, q: 'In The Empire Strikes Back, what is Han Solo frozen in?', a: 'Carbonite', d: ['Ice', 'Amber', 'Stone'] },
{ c: 'Television', t: 1, q: 'In the PBS cartoon Arthur, what kind of animal is Arthur?', a: 'An aardvark', d: ['An anteater', 'A mouse', 'A rabbit'] },
{ c: 'Actors & Directors', t: 1, q: 'Which actress played Carol Danvers in the 2019 film Captain Marvel?', a: 'Brie Larson', d: ['Karen Gillan', 'Elizabeth Olsen', 'Tessa Thompson'] },
{ c: 'Awards & Box Office', t: 1, q: 'Which pair of television critics rated new films with a thumbs up or thumbs down?', a: 'Siskel and Ebert', d: ['Kael and Sarris', 'Maltin and Travers', 'Crowther and Agee'] },
{ c: 'Behind the Scenes', t: 1, q: 'What is a spin-off?', a: 'A new work built around a character from an existing one', d: ['A film released straight to video', 'A scene shot from two angles', 'A second unit crew'] },

{ c: 'Movies', t: 2, q: 'In Rocky, what is the name of the shy pet shop worker Rocky falls for?', a: 'Adrian', d: ['Paulie', 'Mickey', 'Apollo'] },
{ c: 'Television', t: 2, q: 'In The Sopranos, what is the name of the pork store where the crew hangs out?', a: 'Satriale\'s', d: ['Vesuvio', 'Holsten\'s', 'Nuovo Vesuvio'] },
{ c: 'Actors & Directors', t: 2, q: 'Which actor played Tyrion Lannister in Game of Thrones?', a: 'Peter Dinklage', d: ['Warwick Davis', 'Charles Dance', 'Iain Glen'] },
{ c: 'Awards & Box Office', t: 2, q: 'Which film won the BAFTA for Best Film at the 2023 ceremony?', a: 'All Quiet on the Western Front', d: ['The Banshees of Inisherin', 'Elvis', 'Tar'] },
{ c: 'Behind the Scenes', t: 2, q: 'What is a Steadicam?', a: 'A stabilizing camera mount worn by the operator', d: ['A fixed security camera', 'A camera on a crane arm', 'A remote-controlled drone'] },

{ c: 'Movies', t: 3, q: 'In Chinatown, what is Jake Gittes\'s line of work?', a: 'Private investigator', d: ['Water engineer', 'Police detective', 'Newspaper reporter'] },
{ c: 'Television', t: 3, q: 'In 30 Rock, what is the name of the sketch show Liz Lemon runs?', a: 'TGS', d: ['SNL', 'Studio 60', 'The Kenneth Show'] },
{ c: 'Actors & Directors', t: 3, q: 'Which actress played Lisbeth Salander in the 2011 American film of The Girl with the Dragon Tattoo?', a: 'Rooney Mara', d: ['Noomi Rapace', 'Claire Foy', 'Mia Wasikowska'] },
{ c: 'Awards & Box Office', t: 3, q: 'Which actor won Best Supporting Actor for Goodfellas?', a: 'Joe Pesci', d: ['Ray Liotta', 'Robert De Niro', 'Paul Sorvino'] },
{ c: 'Behind the Scenes', t: 3, q: 'Which transition, much loved in Star Wars, pushes one shot off screen with a moving line?', a: 'The wipe', d: ['The dissolve', 'The fade', 'The iris'] },

{ c: 'Movies', t: 4, q: 'In Amores Perros, what event links the film\'s three stories?', a: 'A car crash', d: ['A bank robbery', 'A dog show', 'A wedding'] },
{ c: 'Television', t: 4, q: 'In Hill Street Blues, which desk sergeant ran the morning roll call?', a: 'Phil Esterhaus', d: ['Frank Furillo', 'Mick Belker', 'Howard Hunter'] },
{ c: 'Actors & Directors', t: 4, q: 'Which actor played Joe Gillis in Sunset Boulevard?', a: 'William Holden', d: ['Montgomery Clift', 'Kirk Douglas', 'Glenn Ford'] },
{ c: 'Awards & Box Office', t: 4, q: 'Which Julia Ducournau body horror film took the Palme d\'Or in 2021?', a: 'Titane', d: ['Raw', 'Annette', 'Drive My Car'] },
{ c: 'Behind the Scenes', t: 4, q: 'Which animation studio pioneered three-dimensional printed replacement faces for stop-motion characters on Coraline?', a: 'Laika', d: ['Screen Novelties', 'Aardman', 'Will Vinton Studios'], from: 'script:d41q20' },

{ c: 'Movies', t: 5, q: 'In Ousmane Sembene\'s Black Girl, where is Diouana taken to work by her employers?', a: 'The French Riviera', d: ['Brussels', 'Paris', 'Marseille'], from: 'script:d36q21' },
{ c: 'Television', t: 5, q: 'What was the Cartwright family ranch in Bonanza called?', a: 'The Ponderosa', d: ['The High Chaparral', 'Southfork', 'The Barkley'], from: 'script:d04q22' },
{ c: 'Actors & Directors', t: 5, q: 'Which director made Le Cercle Rouge and Army of Shadows?', a: 'Jean-Pierre Melville', d: ['Robert Bresson', 'Henri-Georges Clouzot', 'Claude Sautet'], from: 'script:d29q23' },
{ c: 'Awards & Box Office', t: 5, q: 'Which Chinese film won the Golden Bear at Berlin in 2014?', a: 'Black Coal, Thin Ice', d: ['Boyhood', 'The Grand Budapest Hotel', 'Stations of the Cross'], from: 'script:d55q24' },
{ c: 'Behind the Scenes', t: 5, q: 'What was a nickelodeon?', a: 'An early storefront cinema charging five cents', d: ['A studio\'s private screening room', 'A theater organ', 'A hand-cranked home projector'], from: 'script:d20q25' },
],

// ── Day 110 ────────────────────────────────────────────────────────────
[
{ c: 'Movies', t: 1, q: 'In Titanic, what is the name of the blue diamond necklace?', a: 'The Heart of the Ocean', d: ['The Star of India', 'The Blue Lagoon', 'The Eye of the Sea'] },
{ c: 'Television', t: 1, q: 'Which series follows a young chef who comes home to run his family\'s Chicago sandwich shop?', a: 'The Bear', d: ['Chef\'s Table', 'Boiling Point', 'Kitchen Confidential'] },
{ c: 'Actors & Directors', t: 1, q: 'Which actress played Phoebe Buffay in Friends?', a: 'Lisa Kudrow', d: ['Courteney Cox', 'Jennifer Aniston', 'Hank Azaria'] },
{ c: 'Awards & Box Office', t: 1, q: 'Which 1984 box office smash starred Eddie Murphy as the Detroit detective Axel Foley?', a: 'Beverly Hills Cop', d: ['Ghostbusters', 'Gremlins', 'The Karate Kid'] },
{ c: 'Behind the Scenes', t: 1, q: 'Which studio made the animated film Shrek?', a: 'DreamWorks Animation', d: ['Pixar', 'Blue Sky Studios', 'Illumination'] },

{ c: 'Movies', t: 2, q: 'In Disney\'s Beauty and the Beast, which vain hunter wants to marry Belle?', a: 'Gaston', d: ['LeFou', 'Maurice', 'Lumiere'] },
{ c: 'Television', t: 2, q: 'In Downton Abbey, what is the name of the head butler?', a: 'Carson', d: ['Bates', 'Barrow', 'Molesley'] },
{ c: 'Actors & Directors', t: 2, q: 'Which actor played Saul Goodman in Breaking Bad and Better Call Saul?', a: 'Bob Odenkirk', d: ['Jonathan Banks', 'Giancarlo Esposito', 'Michael McKean'] },
{ c: 'Awards & Box Office', t: 2, q: 'Which Polish film about a young nun won Best Foreign Language Film for 2014?', a: 'Ida', d: ['Leviathan', 'Wild Tales', 'Timbuktu'] },
{ c: 'Behind the Scenes', t: 2, q: 'In television, what is a cold open?', a: 'A scene that plays before the opening titles', d: ['An episode with no laugh track', 'A pilot with no stars', 'A show with no theme song'] },

{ c: 'Movies', t: 3, q: 'In 12 Angry Men, how many jurors vote not guilty in the first ballot?', a: 'One', d: ['Three', 'Six', 'None'] },
{ c: 'Television', t: 3, q: 'In Monty Python\'s Flying Circus, what kind of bird is the dead parrot in the famous sketch?', a: 'A Norwegian Blue', d: ['An African Grey', 'A Scarlet Macaw', 'A Swedish Red'] },
{ c: 'Actors & Directors', t: 3, q: 'Which actor played Leonard Shelby in Memento?', a: 'Guy Pearce', d: ['Joe Pantoliano', 'Russell Crowe', 'Hugh Jackman'] },
{ c: 'Awards & Box Office', t: 3, q: 'Which Steven Soderbergh debut took the Palme d\'Or in 1989?', a: 'Sex, Lies, and Videotape', d: ['Traffic', 'Out of Sight', 'Kafka'] },
{ c: 'Behind the Scenes', t: 3, q: 'In film, what is an Easter egg?', a: 'A hidden reference or joke for attentive viewers', d: ['A deleted scene', 'A holiday release', 'A surprise cameo in the trailer'] },

{ c: 'Movies', t: 4, q: 'Which real killing spree of the late 1950s loosely inspired Badlands?', a: 'Charles Starkweather\'s', d: ['Bonnie and Clyde\'s', 'The Zodiac Killer\'s', 'Dick Hickock and Perry Smith\'s'] },
{ c: 'Television', t: 4, q: 'Whose Texaco Star Theater earned him the nickname Mr. Television?', a: 'Milton Berle', d: ['Sid Caesar', 'Ed Sullivan', 'Jackie Gleason'] },
{ c: 'Actors & Directors', t: 4, q: 'Which actor played the press agent Sidney Falco in Sweet Smell of Success?', a: 'Tony Curtis', d: ['Burt Lancaster', 'Jack Lemmon', 'Ben Gazzara'] },
{ c: 'Awards & Box Office', t: 4, q: 'Which Michael Haneke film about an elderly couple won the Academy Award for Best Foreign Language Film for 2012?', a: 'Amour', d: ['The White Ribbon', 'Cache', 'Funny Games'] },
{ c: 'Behind the Scenes', t: 4, q: 'Which production designer created the War Room for Dr. Strangelove?', a: 'Ken Adam', d: ['Richard Sylbert', 'John Box', 'Anton Furst'], from: 'script:d39q20' },

{ c: 'Movies', t: 5, q: 'In Jean Cocteau\'s Orpheus, what does the poet pass through to reach the underworld?', a: 'A mirror', d: ['A well', 'A locked wardrobe', 'A wall of flame'], from: 'script:d46q21' },
{ c: 'Television', t: 5, q: 'Which 1982 British serial followed five unemployed Liverpool men?', a: 'Boys from the Blackstuff', d: ['Bread', 'Brookside', 'Auf Wiedersehen, Pet'], from: 'script:d27q22' },
{ c: 'Actors & Directors', t: 5, q: 'Which Senegalese novelist and filmmaker made Black Girl in 1966?', a: 'Ousmane Sembene', d: ['Souleymane Cisse', 'Med Hondo', 'Djibril Diop Mambety'], from: 'script:d31q23' },
{ c: 'Awards & Box Office', t: 5, q: 'Which film won the Sundance Grand Jury Prize for drama in 2020?', a: 'Minari', d: ['Charm City Kings', 'Nine Days', 'Palm Springs'], from: 'script:d42q24' },
{ c: 'Behind the Scenes', t: 5, q: 'Which sound designer built the lightsaber hum from an idling projector motor combined with television interference?', a: 'Ben Burtt', d: ['Alan Splet', 'Walter Murch', 'Gary Rydstrom'], from: 'script:d31q25' },
],

// ── Day 111 ────────────────────────────────────────────────────────────
[
{ c: 'Movies', t: 1, q: 'In Mean Girls, what is the name of the clique led by Regina George?', a: 'The Plastics', d: ['The Heathers', 'The Pink Ladies', 'The Glitters'] },
{ c: 'Television', t: 1, q: 'In The Simpsons, what is the name of the family\'s cheerful next-door neighbor?', a: 'Ned Flanders', d: ['Barney Gumble', 'Moe Szyslak', 'Lenny Leonard'] },
{ c: 'Actors & Directors', t: 1, q: 'Which actress played Scarlet Witch in the Marvel films?', a: 'Elizabeth Olsen', d: ['Scarlett Johansson', 'Karen Gillan', 'Zoe Saldana'] },
{ c: 'Awards & Box Office', t: 1, q: 'Which actress won Best Actress for Three Billboards Outside Ebbing, Missouri?', a: 'Frances McDormand', d: ['Sally Hawkins', 'Margot Robbie', 'Saoirse Ronan'] },
{ c: 'Behind the Scenes', t: 1, q: 'What is a shared world, like Marvel\'s, where characters cross between films called?', a: 'A cinematic universe', d: ['A trilogy', 'An anthology', 'A remake'] },

{ c: 'Movies', t: 2, q: 'In Ghost, which craft are Sam and Molly sharing in its famous romantic scene?', a: 'Pottery', d: ['Painting', 'Woodcarving', 'Weaving'] },
{ c: 'Television', t: 2, q: 'In The Sopranos, what is the name of Tony\'s psychiatrist?', a: 'Dr. Jennifer Melfi', d: ['Dr. Lorraine Calluzzo', 'Dr. Elliot Kupferberg', 'Dr. Paul Weston'] },
{ c: 'Actors & Directors', t: 2, q: 'Which actress played the television journalist Murphy Brown?', a: 'Candice Bergen', d: ['Mary Tyler Moore', 'Bea Arthur', 'Cybill Shepherd'] },
{ c: 'Awards & Box Office', t: 2, q: 'Which Billie Eilish song from Barbie won the Academy Award for Best Original Song?', a: 'What Was I Made For?', d: ['No Time to Die', 'Dance the Night', 'I\'m Just Ken'] },
{ c: 'Behind the Scenes', t: 2, q: 'In which year did Disney buy Lucasfilm?', a: '2012', d: ['2006', '2009', '2015'] },

{ c: 'Movies', t: 3, q: 'In A Clockwork Orange, which composer does Alex adore?', a: 'Beethoven', d: ['Mozart', 'Wagner', 'Bach'] },
{ c: 'Television', t: 3, q: 'In Freaks and Geeks, which Michigan high school do the Weir siblings attend?', a: 'McKinley High', d: ['Ridgemont High', 'Shermer High', 'Bayside High'] },
{ c: 'Actors & Directors', t: 3, q: 'Which actor played Snake Plissken in Escape from New York?', a: 'Kurt Russell', d: ['Bruce Willis', 'Jeff Bridges', 'Mel Gibson'] },
{ c: 'Awards & Box Office', t: 3, q: 'Which actress won Best Supporting Actress for playing Anita in the 2021 West Side Story?', a: 'Ariana DeBose', d: ['Rita Moreno', 'Kirsten Dunst', 'Aunjanue Ellis'] },
{ c: 'Behind the Scenes', t: 3, q: 'In film sound, what does diegetic mean?', a: 'Sound that exists within the story world, like a radio playing', d: ['Sound added for comedy', 'Sound recorded on location', 'Music written for the film'] },

{ c: 'Movies', t: 4, q: 'In Oldboy, how many years is Oh Dae-su held captive?', a: 'Fifteen', d: ['Five', 'Ten', 'Twenty'] },
{ c: 'Television', t: 4, q: 'In Porridge, at which prison does Norman Stanley Fletcher serve his time?', a: 'Slade Prison', d: ['Wentworth', 'Strangeways', 'Larkhall'] },
{ c: 'Actors & Directors', t: 4, q: 'Which actor played the child murderer in Fritz Lang\'s M?', a: 'Peter Lorre', d: ['Conrad Veidt', 'Emil Jannings', 'Gustaf Grundgens'] },
{ c: 'Awards & Box Office', t: 4, q: 'Which Alfonso Cuaron film took the Golden Lion at Venice in 2018?', a: 'Roma', d: ['Gravity', 'Y Tu Mama Tambien', 'Children of Men'] },
{ c: 'Behind the Scenes', t: 4, q: 'Which 1982 Disney film about a programmer trapped inside a computer was an early showcase for computer graphics?', a: 'Tron', d: ['The Last Starfighter', 'WarGames', 'Flight of the Navigator'] },

{ c: 'Movies', t: 5, q: 'What is mounted on the handlebars of the motorcycle in Touki Bouki?', a: 'A zebu skull with long horns', d: ['A carved wooden mask', 'A bull\'s tail', 'A pair of antelope hooves'], from: 'script:d41q21' },
{ c: 'Television', t: 5, q: 'Which 1979 anime introduced the Universal Century calendar and a conflict known as the One Year War?', a: 'Mobile Suit Gundam', d: ['Armored Trooper Votoms', 'Space Battleship Yamato', 'The Super Dimension Fortress Macross'], from: 'script:d32q22' },
{ c: 'Actors & Directors', t: 5, q: 'Which cinematographer shot Blade Runner for Ridley Scott?', a: 'Jordan Cronenweth', d: ['Adrian Biddle', 'Dean Cundey', 'Douglas Slocombe'], from: 'script:d45q23' },
{ c: 'Awards & Box Office', t: 5, q: 'Which Shakespeare adaptation won Best Picture at the 1949 ceremony?', a: 'Hamlet', d: ['Johnny Belinda', 'The Treasure of the Sierra Madre', 'The Snake Pit'], from: 'script:d26q24' },
{ c: 'Behind the Scenes', t: 5, q: 'Which stuntman performed the Stagecoach team-jump and later directed the Ben-Hur chariot race as second unit?', a: 'Yakima Canutt', d: ['Hal Needham', 'Cliff Lyons', 'Dave Sharpe'], from: 'script:d43q25' },
],

// ── Day 112 ────────────────────────────────────────────────────────────
[
{ c: 'Movies', t: 1, q: 'In the Superman films, which green mineral from his home planet weakens Superman?', a: 'Kryptonite', d: ['Vibranium', 'Adamantium', 'Unobtanium'] },
{ c: 'Television', t: 1, q: 'In Phineas and Ferb, what kind of animal is Perry the secret agent?', a: 'A platypus', d: ['A beaver', 'An otter', 'A duck'] },
{ c: 'Actors & Directors', t: 1, q: 'Which actress starred in Buffy the Vampire Slayer on television?', a: 'Sarah Michelle Gellar', d: ['Alyson Hannigan', 'Jennifer Love Hewitt', 'Neve Campbell'] },
{ c: 'Awards & Box Office', t: 1, q: 'What does the Emmy statuette depict?', a: 'A winged woman holding up an atom', d: ['A knight holding a sword', 'A globe on a stand', 'A film reel'] },
{ c: 'Behind the Scenes', t: 1, q: 'What is a voiceover?', a: 'Narration or speech by a voice heard over the picture', d: ['A recast role', 'A scene reshot later', 'A singing double'] },

{ c: 'Movies', t: 2, q: 'In Monsters, Inc., what is the surname of the green one-eyed monster Mike?', a: 'Wazowski', d: ['Sullivan', 'Boggs', 'Waternoose'] },
{ c: 'Television', t: 2, q: 'In The Wonder Years, what is the surname of narrator Kevin?', a: 'Arnold', d: ['Cooper', 'Seaver', 'Keaton'] },
{ c: 'Actors & Directors', t: 2, q: 'Which actor played Westley in The Princess Bride?', a: 'Cary Elwes', d: ['Mandy Patinkin', 'Chris Sarandon', 'Christopher Guest'] },
{ c: 'Awards & Box Office', t: 2, q: 'Which A. R. Rahman song from Slumdog Millionaire won the Academy Award for Best Original Song?', a: 'Jai Ho', d: ['O Saya', 'Naatu Naatu', 'Chaiyya Chaiyya'] },
{ c: 'Behind the Scenes', t: 2, q: 'What is an insert shot?', a: 'A close shot of a detail such as a letter or a clock', d: ['A shot added after release', 'A scene from another film', 'A shot of the audience'] },

{ c: 'Movies', t: 3, q: 'In Annie Hall, to which city does Annie move, to Alvy\'s dismay?', a: 'Los Angeles', d: ['Chicago', 'San Francisco', 'Paris'] },
{ c: 'Television', t: 3, q: 'In The Simpsons, what is Homer\'s middle name?', a: 'Jay', d: ['James', 'Joseph', 'Jerome'] },
{ c: 'Actors & Directors', t: 3, q: 'Which sibling filmmakers wrote and directed The Matrix?', a: 'The Wachowskis', d: ['The Coen brothers', 'The Russo brothers', 'The Safdie brothers'] },
{ c: 'Awards & Box Office', t: 3, q: 'Which actor won Best Actor for Mystic River?', a: 'Sean Penn', d: ['Tim Robbins', 'Kevin Bacon', 'Bill Murray'] },
{ c: 'Behind the Scenes', t: 3, q: 'Which studio developed the VistaVision widescreen format?', a: 'Paramount', d: ['20th Century Fox', 'Universal', 'Columbia Pictures'] },

{ c: 'Movies', t: 4, q: 'Where does Antoine run to in the final shot of The 400 Blows?', a: 'The sea', d: ['His mother\'s house', 'A cinema', 'The Eiffel Tower'] },
{ c: 'Television', t: 4, q: 'Which 1980s British sitcom followed four student housemates including the punk Vyvyan and the poet Rick?', a: 'The Young Ones', d: ['Bottom', 'Red Dwarf', 'Spaced'] },
{ c: 'Actors & Directors', t: 4, q: 'Which actor played the insurance man Walter Neff in Double Indemnity?', a: 'Fred MacMurray', d: ['Edward G. Robinson', 'Dana Andrews', 'Robert Mitchum'] },
{ c: 'Awards & Box Office', t: 4, q: 'Which Martin McDonagh film about a friendship ending on an Irish island won the BAFTA for Outstanding British Film in 2023?', a: 'The Banshees of Inisherin', d: ['In Bruges', 'Three Billboards Outside Ebbing, Missouri', 'Seven Psychopaths'] },
{ c: 'Behind the Scenes', t: 4, q: 'On a film crew, what does the clapper loader do?', a: 'Loads film magazines and works the slate', d: ['Hands out lunch', 'Fires prop guns', 'Loads trucks at the end of the day'] },

{ c: 'Movies', t: 5, q: 'Roughly how long does Satantango run?', a: 'About seven hours', d: ['About three hours', 'About ten hours', 'About five hours'], from: 'script:d29q21' },
{ c: 'Television', t: 5, q: 'Which 1981 British serial adapted Evelyn Waugh\'s novel about the Flyte family?', a: 'Brideshead Revisited', d: ['Testament of Youth', 'The Jewel in the Crown', 'A Dance to the Music of Time'], from: 'script:d28q22' },
{ c: 'Actors & Directors', t: 5, q: 'Which Thai director made Uncle Boonmee Who Can Recall His Past Lives?', a: 'Apichatpong Weerasethakul', d: ['Tsai Ming-liang', 'Lav Diaz', 'Pen-ek Ratanaruang'], from: 'script:d41q23' },
{ c: 'Awards & Box Office', t: 5, q: 'Which Terrence Malick film took the Palme d\'Or at Cannes in 2011?', a: 'The Tree of Life', d: ['The Kid with a Bike', 'Melancholia', 'Drive'], from: 'script:d39q24' },
{ c: 'Behind the Scenes', t: 5, q: 'Which editor cut Lawrence of Arabia, including its celebrated cut from a struck match to a desert sunrise?', a: 'Anne V. Coates', d: ['Verna Fields', 'Thelma Schoonmaker', 'Dede Allen'], from: 'script:d39q25' },
],

// ── Day 113 ────────────────────────────────────────────────────────────
[
{ c: 'Movies', t: 1, q: 'In Frozen, what is the name of Kristoff\'s reindeer?', a: 'Sven', d: ['Blitzen', 'Marshmallow', 'Rudolph'] },
{ c: 'Television', t: 1, q: 'In Cheers, what is the name of the bar owner played by Ted Danson?', a: 'Sam Malone', d: ['Norm Peterson', 'Cliff Clavin', 'Woody Boyd'] },
{ c: 'Actors & Directors', t: 1, q: 'Which actress played Chani in the 2021 film Dune?', a: 'Zendaya', d: ['Florence Pugh', 'Rebecca Ferguson', 'Anya Taylor-Joy'] },
{ c: 'Awards & Box Office', t: 1, q: 'Which actor won Best Supporting Actor for CODA, the first deaf man to win an acting Oscar?', a: 'Troy Kotsur', d: ['Daniel Durant', 'Kodi Smit-McPhee', 'Ciaran Hinds'] },
{ c: 'Behind the Scenes', t: 1, q: 'Which Disney character made a famous early appearance in 1928\'s Steamboat Willie?', a: 'Mickey Mouse', d: ['Donald Duck', 'Goofy', 'Pluto'] },

{ c: 'Movies', t: 2, q: 'In Jaws, what is the name of the Amity Island police chief?', a: 'Martin Brody', d: ['Quint', 'Matt Hooper', 'Larry Vaughn'] },
{ c: 'Television', t: 2, q: 'In Doctor Who, what does the TARDIS look like from the outside?', a: 'A blue police box', d: ['A red telephone box', 'A London bus', 'A grandfather clock'] },
{ c: 'Actors & Directors', t: 2, q: 'Which actor played Hawkeye Pierce in the television series M*A*S*H?', a: 'Alan Alda', d: ['Mike Farrell', 'Jamie Farr', 'Donald Sutherland'] },
{ c: 'Awards & Box Office', t: 2, q: 'Which Pixar film won the first Golden Globe for Best Animated Feature, for 2006?', a: 'Cars', d: ['Ratatouille', 'Happy Feet', 'Monster House'] },
{ c: 'Behind the Scenes', t: 2, q: 'Which English castle stood in for the outside of Hogwarts in the first two Harry Potter films?', a: 'Alnwick Castle', d: ['Windsor Castle', 'Warwick Castle', 'Leeds Castle'] },

{ c: 'Movies', t: 3, q: 'In The Matrix, what is Neo\'s name in his ordinary life?', a: 'Thomas Anderson', d: ['Thomas Reese', 'John Connor', 'Lloyd Carver'] },
{ c: 'Television', t: 3, q: 'In Twin Peaks, to whom does Agent Cooper dictate his tape recordings?', a: 'Diane', d: ['Audrey', 'Laura', 'Shelly'] },
{ c: 'Actors & Directors', t: 3, q: 'Which actress played Scarlett O\'Hara in Gone with the Wind?', a: 'Vivien Leigh', d: ['Olivia de Havilland', 'Bette Davis', 'Joan Fontaine'] },
{ c: 'Awards & Box Office', t: 3, q: 'Which actress won Best Supporting Actress at age ten for Paper Moon?', a: 'Tatum O\'Neal', d: ['Jodie Foster', 'Linda Blair', 'Anna Paquin'] },
{ c: 'Behind the Scenes', t: 3, q: 'When a producer options a novel, what do they buy?', a: 'The exclusive right to develop it into a film for a set period', d: ['The printed copies of the book', 'The author\'s next three books', 'A share of the publisher'] },

{ c: 'Movies', t: 4, q: 'In Terry Gilliam\'s Brazil, what causes the clerical error that sets the story going?', a: 'An insect falling into a printer', d: ['A spilled cup of coffee', 'A power cut', 'A misspelled form'] },
{ c: 'Television', t: 4, q: 'Which naturalist presented the 1979 BBC series Life on Earth?', a: 'David Attenborough', d: ['Jacques Cousteau', 'Gerald Durrell', 'Steve Irwin'] },
{ c: 'Actors & Directors', t: 4, q: 'Which Italian director made The Leopard and Death in Venice?', a: 'Luchino Visconti', d: ['Bernardo Bertolucci', 'Pier Paolo Pasolini', 'Franco Zeffirelli'] },
{ c: 'Awards & Box Office', t: 4, q: 'Which Sofia Coppola film took the Golden Lion at Venice in 2010?', a: 'Somewhere', d: ['Lost in Translation', 'Marie Antoinette', 'The Bling Ring'] },
{ c: 'Behind the Scenes', t: 4, q: 'Which 2001 film was the first feature to attempt photorealistic computer-animated humans throughout?', a: 'Final Fantasy: The Spirits Within', d: ['Shrek', 'Monsters, Inc.', 'The Polar Express'] },

{ c: 'Movies', t: 5, q: 'Chris Marker\'s La Jetee is assembled almost entirely from what?', a: 'Still photographs', d: ['Puppet sequences', 'Hand-drawn animation', 'Newsreel footage'], from: 'script:d52q21' },
{ c: 'Television', t: 5, q: 'What is the name of the year-long historical drama that NHK began broadcasting annually in 1963?', a: 'the taiga drama', d: ['the jidaigeki hour', 'the asadora', 'the tokusatsu serial'], from: 'script:d37q22' },
{ c: 'Actors & Directors', t: 5, q: 'Which Filipino director made Insiang and Manila in the Claws of Light?', a: 'Lino Brocka', d: ['Lav Diaz', 'Brillante Mendoza', 'Ishmael Bernal'], from: 'script:d36q23' },
{ c: 'Awards & Box Office', t: 5, q: 'Which film won the Sundance Grand Jury Prize for drama in 2010?', a: 'Winter\'s Bone', d: ['The Kids Are All Right', 'Blue Valentine', 'Buried'], from: 'script:d36q24' },
{ c: 'Behind the Scenes', t: 5, q: 'Which 1958 film was re-edited in 1998 to follow a long memo its director wrote after the studio recut it?', a: 'Touch of Evil', d: ['Kiss Me Deadly', 'Vertigo', 'The Big Heat'], from: 'script:d47q25' },
],

// ── Day 114 ────────────────────────────────────────────────────────────
[
{ c: 'Movies', t: 1, q: 'In Mary Poppins, a spoonful of sugar helps what go down?', a: 'The medicine', d: ['The pudding', 'The porridge', 'The tea'] },
{ c: 'Television', t: 1, q: 'In Scooby-Doo, who is Scooby\'s always-hungry best friend?', a: 'Shaggy', d: ['Fred', 'Velma', 'Scrappy'] },
{ c: 'Actors & Directors', t: 1, q: 'Which actor played Walter White in Breaking Bad?', a: 'Bryan Cranston', d: ['Aaron Paul', 'Bob Odenkirk', 'Dean Norris'] },
{ c: 'Awards & Box Office', t: 1, q: 'Which actress won Best Supporting Actress for playing a divorce lawyer in Marriage Story?', a: 'Laura Dern', d: ['Scarlett Johansson', 'Florence Pugh', 'Kathy Bates'] },
{ c: 'Behind the Scenes', t: 1, q: 'To keep a twist secret on the set of The Empire Strikes Back, what false line was Darth Vader\'s actor given to say?', a: 'Obi-Wan killed your father', d: ['Leia is your sister', 'The Emperor is your father', 'Han Solo is your brother'] },

{ c: 'Movies', t: 2, q: 'In the first Home Alone, what do the two burglars call themselves?', a: 'The Wet Bandits', d: ['The Night Raiders', 'The Mud Bandits', 'The Christmas Crooks'] },
{ c: 'Television', t: 2, q: 'In Game of Thrones, what is the name of Jon Snow\'s white direwolf?', a: 'Ghost', d: ['Summer', 'Nymeria', 'Grey Wind'] },
{ c: 'Actors & Directors', t: 2, q: 'Which actress played the assassin Villanelle in Killing Eve?', a: 'Jodie Comer', d: ['Sandra Oh', 'Fiona Shaw', 'Phoebe Waller-Bridge'] },
{ c: 'Awards & Box Office', t: 2, q: 'Which song from Pinocchio won the Academy Award for Best Original Song for 1940?', a: 'When You Wish Upon a Star', d: ['Give a Little Whistle', 'I\'ve Got No Strings', 'Hi-Diddle-Dee-Dee'] },
{ c: 'Behind the Scenes', t: 2, q: 'Which actor lost about sixty pounds to play an insomniac in The Machinist?', a: 'Christian Bale', d: ['Matthew McConaughey', 'Jared Leto', 'Tom Hanks'] },

{ c: 'Movies', t: 3, q: 'In Gone Girl, what is the title of the children\'s books Amy\'s parents wrote about her?', a: 'Amazing Amy', d: ['Adorable Amy', 'Amy Always', 'Little Amy'] },
{ c: 'Television', t: 3, q: 'In Battlestar Galactica, what is the real name of the pilot called Starbuck?', a: 'Kara Thrace', d: ['Sharon Valerii', 'Laura Roslin', 'Anastasia Dualla'] },
{ c: 'Actors & Directors', t: 3, q: 'Which actor played Captain Willard in Apocalypse Now?', a: 'Martin Sheen', d: ['Harvey Keitel', 'Charlie Sheen', 'Dennis Hopper'] },
{ c: 'Awards & Box Office', t: 3, q: 'Which actress won Best Actress for playing a ruthless TV executive in Network?', a: 'Faye Dunaway', d: ['Sissy Spacek', 'Talia Shire', 'Liv Ullmann'] },
{ c: 'Behind the Scenes', t: 3, q: 'Which television network uses an eye as its logo?', a: 'CBS', d: ['NBC', 'ABC', 'PBS'] },

{ c: 'Movies', t: 4, q: 'In Easy Rider, which New Orleans celebration are the two bikers heading for?', a: 'Mardi Gras', d: ['The Jazz Festival', 'Bastille Day', 'Halloween'] },
{ c: 'Television', t: 4, q: 'Which Japanese game show sent hordes of contestants through obstacle courses toward a mock castle?', a: 'Takeshi\'s Castle', d: ['Sasuke', 'Iron Chef', 'Silent Library'] },
{ c: 'Actors & Directors', t: 4, q: 'Which American actress starred opposite Jean-Paul Belmondo in Breathless?', a: 'Jean Seberg', d: ['Jane Fonda', 'Anna Karina', 'Shirley MacLaine'] },
{ c: 'Awards & Box Office', t: 4, q: 'For which Lars von Trier musical did Bjork win Best Actress at Cannes in 2000?', a: 'Dancer in the Dark', d: ['Breaking the Waves', 'Dogville', 'Melancholia'] },
{ c: 'Behind the Scenes', t: 4, q: 'What was the computer-controlled camera rig built by Industrial Light and Magic for Star Wars called?', a: 'The Dykstraflex', d: ['The Lucascam', 'The Skywalker rig', 'The Trumbull mount'] },

{ c: 'Movies', t: 5, q: 'Which country did Carl Theodor Dreyer, the director of Vampyr, come from?', a: 'Denmark', d: ['Norway', 'Germany', 'Sweden'], from: 'script:d20q21' },
{ c: 'Television', t: 5, q: 'Which Norwegian teen series released its scenes online in real time as the day unfolded, changing its point of view character each season?', a: 'Skam', d: ['Blank', 'Hotel Caesar', 'Lovleg'], from: 'script:d41q22' },
{ c: 'Actors & Directors', t: 5, q: 'Which actress starred in Jules and Jim?', a: 'Jeanne Moreau', d: ['Delphine Seyrig', 'Anna Karina', 'Emmanuelle Riva'], from: 'script:d19q23' },
{ c: 'Awards & Box Office', t: 5, q: 'Which Hirokazu Kore-eda film took the Palme d\'Or at Cannes in 2018?', a: 'Shoplifters', d: ['Cold War', 'BlacKkKlansman', 'Burning'], from: 'script:d41q24' },
{ c: 'Behind the Scenes', t: 5, q: 'Which composer wrote the score for Once Upon a Time in the West before filming so it could be played back on set?', a: 'Ennio Morricone', d: ['Nino Rota', 'Riz Ortolani', 'Carlo Rustichelli'], from: 'script:d46q25' },
],

// ── Day 115 ────────────────────────────────────────────────────────────
[
{ c: 'Movies', t: 1, q: 'In Toy Story, what kind of toy is Hamm?', a: 'A piggy bank', d: ['A wind-up robot', 'A jack-in-the-box', 'A rubber duck'] },
{ c: 'Television', t: 1, q: 'In How I Met Your Mother, what is the name of the architect telling the story to his children?', a: 'Ted Mosby', d: ['Barney Stinson', 'Marshall Eriksen', 'Robin Scherbatsky'] },
{ c: 'Actors & Directors', t: 1, q: 'Which actor played Gollum in The Lord of the Rings films?', a: 'Andy Serkis', d: ['Dominic Monaghan', 'Billy Boyd', 'Hugo Weaving'] },
{ c: 'Awards & Box Office', t: 1, q: 'Which stop-motion retelling of a classic puppet tale won Best Animated Feature for 2022?', a: 'Guillermo del Toro\'s Pinocchio', d: ['Marcel the Shell with Shoes On', 'Turning Red', 'The Sea Beast'] },
{ c: 'Behind the Scenes', t: 1, q: 'Which streaming service released Stranger Things?', a: 'Netflix', d: ['Hulu', 'Amazon Prime Video', 'HBO Max'] },

{ c: 'Movies', t: 2, q: 'In Back to the Future, what is the name of the bully who torments George McFly?', a: 'Biff Tannen', d: ['Marty McFly', 'Needles', 'Strickland'] },
{ c: 'Television', t: 2, q: 'In Better Call Saul, what is Saul Goodman\'s real name?', a: 'Jimmy McGill', d: ['Chuck McGill', 'Howard Hamlin', 'Kim Wexler'] },
{ c: 'Actors & Directors', t: 2, q: 'Which actress played Elaine Benes in Seinfeld?', a: 'Julia Louis-Dreyfus', d: ['Teri Hatcher', 'Helen Hunt', 'Courteney Cox'] },
{ c: 'Awards & Box Office', t: 2, q: 'Who won Best Director in back-to-back years for Birdman and The Revenant?', a: 'Alejandro G. Inarritu', d: ['Alfonso Cuaron', 'George Miller', 'Richard Linklater'] },
{ c: 'Behind the Scenes', t: 2, q: 'What does a line producer mainly manage?', a: 'The day-to-day budget and logistics of the shoot', d: ['The film\'s marketing campaign', 'The casting of leads', 'The choice of director'] },

{ c: 'Movies', t: 3, q: 'In Fight Club, what is the narrator\'s job before he meets Tyler Durden?', a: 'Recall specialist for a car company', d: ['Insurance salesman', 'Accountant', 'Hotel concierge'] },
{ c: 'Television', t: 3, q: 'In Lost, how often must the numbers be entered into the computer in the hatch?', a: 'Every 108 minutes', d: ['Every hour', 'Every 42 minutes', 'Every day at noon'] },
{ c: 'Actors & Directors', t: 3, q: 'Which actor played the replicant Roy Batty in Blade Runner?', a: 'Rutger Hauer', d: ['Edward James Olmos', 'Brion James', 'M. Emmet Walsh'] },
{ c: 'Awards & Box Office', t: 3, q: 'Which actor won Best Actor for Patton and refused the award?', a: 'George C. Scott', d: ['Marlon Brando', 'Karl Malden', 'Ryan O\'Neal'] },
{ c: 'Behind the Scenes', t: 3, q: 'What does the 30-degree rule tell a filmmaker to avoid?', a: 'Cutting between two shots whose camera angles barely differ', d: ['Tilting the camera more than 30 degrees', 'Shooting in heat above 30 degrees', 'Scenes longer than 30 seconds'] },

{ c: 'Movies', t: 4, q: 'In Wild Strawberries, why is the elderly professor traveling to Lund?', a: 'To receive an honorary degree', d: ['To attend a funeral', 'To see a doctor', 'To visit his son\'s new home'] },
{ c: 'Television', t: 4, q: 'In Cowboy Bebop, what is the name of the laid-back bounty hunter at the center of the series?', a: 'Spike Spiegel', d: ['Vash the Stampede', 'Jet Black', 'Faye Valentine'] },
{ c: 'Actors & Directors', t: 4, q: 'Which actor played the brainwashed Raymond Shaw in the 1962 Manchurian Candidate?', a: 'Laurence Harvey', d: ['Frank Sinatra', 'James Gregory', 'Henry Silva'] },
{ c: 'Awards & Box Office', t: 4, q: 'Which Mati Diop documentary about returning looted art won the Golden Bear at Berlin in 2024?', a: 'Dahomey', d: ['Atlantics', 'On the Adamant', 'Alcarras'] },
{ c: 'Behind the Scenes', t: 4, q: 'Which producer and director wired cinema seats to buzz audiences during The Tingler?', a: 'William Castle', d: ['Roger Corman', 'Samuel Z. Arkoff', 'Ed Wood'] },

{ c: 'Movies', t: 5, q: 'Whose son is mistakenly kidnapped in Kurosawa\'s High and Low?', a: 'The chauffeur\'s', d: ['The executive\'s', 'The detective\'s', 'The maid\'s'] },
{ c: 'Television', t: 5, q: 'Cathy Come Home, the 1966 drama about homelessness that changed British housing policy, was broadcast under which BBC anthology strand?', a: 'The Wednesday Play', d: ['First Night', 'Play for Today', 'Play of the Month'], from: 'script:d31q22' },
{ c: 'Actors & Directors', t: 5, q: 'Which actor played the title role in Eisenstein\'s Ivan the Terrible?', a: 'Nikolai Cherkasov', d: ['Andrei Abrikosov', 'Mikhail Zharov', 'Boris Andreyev'], from: 'script:d21q23' },
{ c: 'Awards & Box Office', t: 5, q: 'Which film won the Sundance Grand Jury Prize for drama in 2013?', a: 'Fruitvale Station', d: ['Blue Caprice', 'Upstream Color', 'Ain\'t Them Bodies Saints'], from: 'script:d40q24' },
{ c: 'Behind the Scenes', t: 5, q: 'What was the Kinetoscope?', a: 'An early peep-show viewing device from Edison\'s laboratory', d: ['A sound recorder', 'A projector for large audiences', 'A color process'], from: 'script:d30q25' },
],

// ── Day 116 ────────────────────────────────────────────────────────────
[
{ c: 'Movies', t: 1, q: 'In Mrs. Doubtfire, what does Robin Williams pose as to spend time with his children?', a: 'A nanny', d: ['A chef', 'A gardener', 'A chauffeur'] },
{ c: 'Television', t: 1, q: 'In Seinfeld, what is Elaine\'s last name?', a: 'Benes', d: ['Costanza', 'Peterman', 'Puddy'] },
{ c: 'Actors & Directors', t: 1, q: 'Which actor played Chandler Bing in Friends?', a: 'Matthew Perry', d: ['David Schwimmer', 'Matt LeBlanc', 'Hank Azaria'] },
{ c: 'Awards & Box Office', t: 1, q: 'What is a For Your Consideration advertisement aimed at?', a: 'Persuading awards voters', d: ['Selling tickets to children', 'Recruiting extras', 'Finding investors'] },
{ c: 'Behind the Scenes', t: 1, q: 'What is the word sitcom short for?', a: 'Situation comedy', d: ['Sitting comedy', 'Single camera comedy', 'Situation commercial'] },

{ c: 'Movies', t: 2, q: 'In Toy Story 2, who is the evil emperor that Buzz Lightyear fights?', a: 'Emperor Zurg', d: ['Stinky Pete', 'Lotso', 'Sid'] },
{ c: 'Television', t: 2, q: 'In Star Trek: The Next Generation, what is the name of the android officer?', a: 'Data', d: ['Worf', 'Riker', 'Geordi'] },
{ c: 'Actors & Directors', t: 2, q: 'Which actress played Lieutenant Uhura in the original Star Trek?', a: 'Nichelle Nichols', d: ['Majel Barrett', 'Grace Lee Whitney', 'Whoopi Goldberg'] },
{ c: 'Awards & Box Office', t: 2, q: 'Which song from La La Land won the Academy Award for Best Original Song?', a: 'City of Stars', d: ['Audition', 'Another Day of Sun', 'Start a Fire'] },
{ c: 'Behind the Scenes', t: 2, q: 'What is a lavalier?', a: 'A small clip-on microphone', d: ['A type of camera lens', 'A crane arm', 'A light diffuser'] },

{ c: 'Movies', t: 3, q: 'In Spirited Away, what happens to Chihiro\'s parents after they eat the spirits\' food?', a: 'They turn into pigs', d: ['They fall asleep for a century', 'They turn into stone', 'They shrink to the size of mice'] },
{ c: 'Television', t: 3, q: 'In The Wire, who is the drug kingpin partnered with Stringer Bell?', a: 'Avon Barksdale', d: ['Marlo Stanfield', 'Proposition Joe', 'Omar Little'] },
{ c: 'Actors & Directors', t: 3, q: 'Which director made Badlands and Days of Heaven?', a: 'Terrence Malick', d: ['Hal Ashby', 'Monte Hellman', 'Michael Cimino'] },
{ c: 'Awards & Box Office', t: 3, q: 'Which Akira Kurosawa film won the Golden Lion at Venice in 1951?', a: 'Rashomon', d: ['Seven Samurai', 'Ikiru', 'Throne of Blood'] },
{ c: 'Behind the Scenes', t: 3, q: 'Which actor stayed in a wheelchair between takes while playing Christy Brown in My Left Foot?', a: 'Daniel Day-Lewis', d: ['Brenda Fricker', 'Hugh O\'Conor', 'Ray McAnally'] },

{ c: 'Movies', t: 4, q: 'In Cinema Paradiso, what does Alfredo leave the grown-up Toto?', a: 'A reel of the kisses the priest had censored', d: ['The cinema itself', 'His old projector', 'A letter to his mother'] },
{ c: 'Television', t: 4, q: 'In Prime Suspect, what is the name of the detective played by Helen Mirren?', a: 'Jane Tennison', d: ['Jane Marple', 'Sarah Lund', 'Vera Stanhope'] },
{ c: 'Actors & Directors', t: 4, q: 'Which Soviet director made Battleship Potemkin?', a: 'Sergei Eisenstein', d: ['Dziga Vertov', 'Vsevolod Pudovkin', 'Alexander Dovzhenko'] },
{ c: 'Awards & Box Office', t: 4, q: 'Which French film about a high school classroom took the Palme d\'Or in 2008?', a: 'The Class', d: ['A Prophet', 'The Child', 'The Diving Bell and the Butterfly'] },
{ c: 'Behind the Scenes', t: 4, q: 'Which 1902 Georges Melies film shows a rocket landing in the eye of the man in the moon?', a: 'A Trip to the Moon', d: ['The Impossible Voyage', 'The Kingdom of the Fairies', 'The Conquest of the Pole'] },

{ c: 'Movies', t: 5, q: 'Who disappears on a volcanic island early in Antonioni\'s L\'Avventura?', a: 'Anna', d: ['Claudia', 'Giuliana', 'Valentina'] },
{ c: 'Television', t: 5, q: 'Which British series broadcast its first episode the day after the assassination of John F. Kennedy?', a: 'Doctor Who', d: ['Danger Man', 'The Avengers', 'Coronation Street'], from: 'script:d23q22' },
{ c: 'Actors & Directors', t: 5, q: 'Which Romanian director made 4 Months, 3 Weeks and 2 Days?', a: 'Cristian Mungiu', d: ['Radu Jude', 'Cristi Puiu', 'Corneliu Porumboiu'], from: 'script:d55q23' },
{ c: 'Awards & Box Office', t: 5, q: 'Which documentary took the Golden Bear at Berlin in 2016?', a: 'Fire at Sea', d: ['Death in Sarajevo', 'United States of Love', 'Hedi'], from: 'script:d43q24' },
{ c: 'Behind the Scenes', t: 5, q: 'Which effects process used a mirror with sections of its backing scraped away to combine miniatures with live actors in Metropolis?', a: 'The Schufftan process', d: ['The Dunning process', 'The Williams process', 'The Handschiegl process'], from: 'script:d35q25' },
],

// ── Day 117 ────────────────────────────────────────────────────────────
[
{ c: 'Movies', t: 1, q: 'In Willy Wonka and the Chocolate Factory, which small workers run the factory?', a: 'The Oompa Loompas', d: ['The Munchkins', 'The Minions', 'The Smurfs'] },
{ c: 'Television', t: 1, q: 'On Sesame Street, what color is Big Bird?', a: 'Yellow', d: ['Blue', 'Red', 'Green'] },
{ c: 'Actors & Directors', t: 1, q: 'Which actor played Mr. Miyagi in the 1984 film The Karate Kid?', a: 'Pat Morita', d: ['Mako', 'James Hong', 'Keye Luke'] },
{ c: 'Awards & Box Office', t: 1, q: 'Which actress won Best Actress for playing the title role in Anora?', a: 'Mikey Madison', d: ['Demi Moore', 'Cynthia Erivo', 'Fernanda Torres'] },
{ c: 'Behind the Scenes', t: 1, q: 'Which Indian city is the center of the Hindi film industry known as Bollywood?', a: 'Mumbai', d: ['Delhi', 'Kolkata', 'Chennai'] },

{ c: 'Movies', t: 2, q: 'In Finding Nemo, which Australian city is Nemo taken to?', a: 'Sydney', d: ['Melbourne', 'Brisbane', 'Perth'] },
{ c: 'Television', t: 2, q: 'In Ted Lasso, which English soccer club does Ted coach?', a: 'AFC Richmond', d: ['Wrexham AFC', 'Nottingham Forest', 'West Ham United'] },
{ c: 'Actors & Directors', t: 2, q: 'Which actor played Jesse Pinkman in Breaking Bad?', a: 'Aaron Paul', d: ['RJ Mitte', 'Dean Norris', 'Jesse Plemons'] },
{ c: 'Awards & Box Office', t: 2, q: 'Which Berlin song from Top Gun won the Academy Award for Best Original Song?', a: 'Take My Breath Away', d: ['Danger Zone', 'Mighty Wings', 'Hot Summer Nights'] },
{ c: 'Behind the Scenes', t: 2, q: 'Which company bought Pixar in 2006?', a: 'The Walt Disney Company', d: ['Apple', 'Warner Bros.', 'Sony'] },

{ c: 'Movies', t: 3, q: 'In The Exorcist, what is the name of the possessed girl?', a: 'Regan', d: ['Carrie', 'Damien', 'Samara'] },
{ c: 'Television', t: 3, q: 'In Game of Thrones, what is the name of Arya Stark\'s slender sword?', a: 'Needle', d: ['Longclaw', 'Ice', 'Oathkeeper'] },
{ c: 'Actors & Directors', t: 3, q: 'Which South Korean director made Oldboy and The Handmaiden?', a: 'Park Chan-wook', d: ['Bong Joon Ho', 'Kim Ki-duk', 'Hong Sang-soo'] },
{ c: 'Awards & Box Office', t: 3, q: 'Which actress won Best Actress for playing a waitress in As Good as It Gets?', a: 'Helen Hunt', d: ['Judi Dench', 'Kate Winslet', 'Julie Christie'] },
{ c: 'Behind the Scenes', t: 3, q: 'What is pan and scan?', a: 'Cropping a widescreen film to fill an old television screen', d: ['A horizontal camera move', 'A scanning method for old negatives', 'A sound panning technique'] },

{ c: 'Movies', t: 4, q: 'In City of God, what does the narrator Rocket hope to become?', a: 'A photographer', d: ['A football player', 'A teacher', 'A musician'] },
{ c: 'Television', t: 4, q: 'In Yes Minister, what is the name of the minister?', a: 'Jim Hacker', d: ['Humphrey Appleby', 'Bernard Woolley', 'Malcolm Tucker'] },
{ c: 'Actors & Directors', t: 4, q: 'Which actress played Phyllis Dietrichson in Double Indemnity?', a: 'Barbara Stanwyck', d: ['Joan Crawford', 'Lana Turner', 'Gene Tierney'] },
{ c: 'Awards & Box Office', t: 4, q: 'Which Justine Triet courtroom drama took the Palme d\'Or in 2023?', a: 'Anatomy of a Fall', d: ['The Zone of Interest', 'Past Lives', 'Perfect Days'] },
{ c: 'Behind the Scenes', t: 4, q: 'For which 1974 disaster film was the low-frequency rumble system Sensurround introduced?', a: 'Earthquake', d: ['The Towering Inferno', 'Airport 1975', 'The Poseidon Adventure'] },

{ c: 'Movies', t: 5, q: 'In Tokyo Story, from which seaside town do the elderly parents travel to see their children?', a: 'Onomichi', d: ['Kamakura', 'Atami', 'Nagasaki'] },
{ c: 'Television', t: 5, q: 'Which 1953 BBC serial about a rocket group and a returning astronaut is regarded as the first adult science fiction on British television?', a: 'The Quatermass Experiment', d: ['A for Andromeda', 'The Voodoo Factory', 'The Trollenberg Terror'], from: 'script:d53q22' },
{ c: 'Actors & Directors', t: 5, q: 'Which actress played the title role in Cleo from 5 to 7?', a: 'Corinne Marchand', d: ['Delphine Seyrig', 'Anna Karina', 'Emmanuelle Riva'], from: 'script:d25q23' },
{ c: 'Awards & Box Office', t: 5, q: 'Which was the last largely black and white film to win Best Picture before The Artist?', a: 'Schindler\'s List', d: ['Manhattan', 'Raging Bull', 'The Apartment'], from: 'script:d22q24' },
{ c: 'Behind the Scenes', t: 5, q: 'Which editor, whose background was in documentaries, cut Mad Max: Fury Road?', a: 'Margaret Sixel', d: ['Dody Dorn', 'Jill Bilcock', 'Lee Smith'], from: 'script:d53q25' },
],

// ── Day 118 ────────────────────────────────────────────────────────────
[
{ c: 'Movies', t: 1, q: 'In Finding Nemo, what kind of fish is Dory?', a: 'A blue tang', d: ['A clownfish', 'A pufferfish', 'An angelfish'] },
{ c: 'Television', t: 1, q: 'In Doctor Who, what are the pepper-pot shaped alien enemies called?', a: 'The Daleks', d: ['The Cybermen', 'The Weeping Angels', 'The Ood'] },
{ c: 'Actors & Directors', t: 1, q: 'Which actor played Agent K in Men in Black?', a: 'Tommy Lee Jones', d: ['Will Smith', 'Rip Torn', 'Vincent D\'Onofrio'] },
{ c: 'Awards & Box Office', t: 1, q: 'Which actor won Best Supporting Actor for playing Lewis Strauss in Oppenheimer?', a: 'Robert Downey Jr.', d: ['Matt Damon', 'Josh Hartnett', 'Ryan Gosling'] },
{ c: 'Behind the Scenes', t: 1, q: 'In filmmaking, what does VFX stand for?', a: 'Visual effects', d: ['Video format exchange', 'Virtual film extras', 'Variable frame exposure'] },

{ c: 'Movies', t: 2, q: 'In Top Gun, what is the call sign of Maverick\'s radar intercept officer and best friend?', a: 'Goose', d: ['Iceman', 'Viper', 'Jester'] },
{ c: 'Television', t: 2, q: 'In Parks and Recreation, what is the name of the beloved miniature horse of Pawnee?', a: 'Li\'l Sebastian', d: ['Champion', 'Little Joe', 'Buttercup'] },
{ c: 'Actors & Directors', t: 2, q: 'Which actor played Gimli in The Lord of the Rings films?', a: 'John Rhys-Davies', d: ['Sean Astin', 'Billy Boyd', 'Bret McKenzie'] },
{ c: 'Awards & Box Office', t: 2, q: 'Which film was the top-grossing release in North America in 2007?', a: 'Spider-Man 3', d: ['Transformers', 'Shrek the Third', 'Pirates of the Caribbean: At World\'s End'] },
{ c: 'Behind the Scenes', t: 2, q: 'What is a red herring in a mystery film?', a: 'A false clue meant to mislead', d: ['A hidden cameo', 'A continuity error', 'A scene shot in red light'] },

{ c: 'Movies', t: 3, q: 'In Parasite, what gift does Min-hyuk bring the Kim family at the start?', a: 'A scholar\'s rock', d: ['A bottle of whisky', 'A peach', 'A smartphone'] },
{ c: 'Television', t: 3, q: 'In Dallas, which character turned out to have shot J.R. Ewing in 1980?', a: 'Kristin Shepard', d: ['Sue Ellen Ewing', 'Cliff Barnes', 'Bobby Ewing'] },
{ c: 'Actors & Directors', t: 3, q: 'Which actor played the shark hunter Quint in Jaws?', a: 'Robert Shaw', d: ['Roy Scheider', 'Richard Dreyfuss', 'Murray Hamilton'] },
{ c: 'Awards & Box Office', t: 3, q: 'Which actor won Best Actor for Kiss of the Spider Woman?', a: 'William Hurt', d: ['Raul Julia', 'Jack Nicholson', 'Harrison Ford'] },
{ c: 'Behind the Scenes', t: 3, q: 'What is cinema verite?', a: 'An observational documentary style using handheld cameras and real situations', d: ['A French award for truthful acting', 'A type of film noir', 'A widescreen format'] },

{ c: 'Movies', t: 4, q: 'In Paths of Glory, during which war is the doomed attack ordered?', a: 'The First World War', d: ['The Second World War', 'The Korean War', 'The Franco-Prussian War'] },
{ c: 'Television', t: 4, q: 'Which writer created the musical drama The Singing Detective?', a: 'Dennis Potter', d: ['Alan Bleasdale', 'Alan Bennett', 'Jimmy McGovern'] },
{ c: 'Actors & Directors', t: 4, q: 'Which French director made L\'Atalante before dying at twenty-nine?', a: 'Jean Vigo', d: ['Jean Renoir', 'Rene Clair', 'Jacques Becker'] },
{ c: 'Awards & Box Office', t: 4, q: 'Which Yorgos Lanthimos film took the Golden Lion at Venice in 2023?', a: 'Poor Things', d: ['Dogtooth', 'The Lobster', 'Kinds of Kindness'] },
{ c: 'Behind the Scenes', t: 4, q: 'Which Warner Bros. animator directed What\'s Opera, Doc? and created Pepe Le Pew?', a: 'Chuck Jones', d: ['Tex Avery', 'Friz Freleng', 'Bob Clampett'] },

{ c: 'Movies', t: 5, q: 'What covers the planet in Tarkovsky\'s Solaris?', a: 'An ocean', d: ['A forest', 'Ice', 'A desert'] },
{ c: 'Television', t: 5, q: 'Which 1973 PBS documentary series filmed seven months in the life of the Loud family of Santa Barbara?', a: 'An American Family', d: ['The Family', 'Seven Up!', 'Middletown'], from: 'script:d45q22' },
{ c: 'Actors & Directors', t: 5, q: 'Which longtime Wim Wenders cinematographer shot Paris, Texas and Dead Man?', a: 'Robby Muller', d: ['Michael Ballhaus', 'Chris Menges', 'Ed Lachman'], from: 'script:d51q23' },
{ c: 'Awards & Box Office', t: 5, q: 'How many times did Alfred Hitchcock win the Academy Award for Best Director?', a: 'Never', d: ['Three times', 'Once', 'Twice'], from: 'script:d07q24' },
{ c: 'Behind the Scenes', t: 5, q: 'What did the Lord of the Rings crew call the very large miniatures built for Minas Tirith and Helm\'s Deep?', a: 'Bigatures', d: ['Overscales', 'Macros', 'Maquettes'], from: 'script:d40q25' },
],

// ── Day 119 ────────────────────────────────────────────────────────────
[
{ c: 'Movies', t: 1, q: 'In Jurassic Park, on which fictional island is the park built?', a: 'Isla Nublar', d: ['Isla Sorna', 'Skull Island', 'Amity Island'] },
{ c: 'Television', t: 1, q: 'In The Simpsons, what is the name of Bart and Lisa\'s school bus driver?', a: 'Otto', d: ['Apu', 'Moe', 'Willie'] },
{ c: 'Actors & Directors', t: 1, q: 'Which actor played Hawkeye in the Marvel films?', a: 'Jeremy Renner', d: ['Paul Rudd', 'Anthony Mackie', 'Chris Pratt'] },
{ c: 'Awards & Box Office', t: 1, q: 'Which film was the top-grossing release in North America in 1983?', a: 'Return of the Jedi', d: ['Terms of Endearment', 'Flashdance', 'Trading Places'] },
{ c: 'Behind the Scenes', t: 1, q: 'What is the scrolling list of cast and crew names at the end of a film called?', a: 'The closing credits', d: ['The call sheet', 'The shot list', 'The slate'] },

{ c: 'Movies', t: 2, q: 'In Frozen, which prince turns out to be the villain?', a: 'Hans', d: ['Kristoff', 'Eric', 'Naveen'] },
{ c: 'Television', t: 2, q: 'In Stranger Things, which brand of frozen waffles does Eleven love?', a: 'Eggo', d: ['Kellogg\'s Pop-Tarts', 'Aunt Jemima', 'Belgian Boys'] },
{ c: 'Actors & Directors', t: 2, q: 'Which actor played the Tenth Doctor in Doctor Who?', a: 'David Tennant', d: ['Matt Smith', 'Christopher Eccleston', 'Peter Capaldi'] },
{ c: 'Awards & Box Office', t: 2, q: 'Which song from The Little Mermaid won the Academy Award for Best Original Song?', a: 'Under the Sea', d: ['Part of Your World', 'Kiss the Girl', 'Poor Unfortunate Souls'] },
{ c: 'Behind the Scenes', t: 2, q: 'What is a rough cut?', a: 'An early assembled version of the edit', d: ['A scene with bad language', 'A cheap camera lens', 'The first script draft'] },

{ c: 'Movies', t: 3, q: 'In Ferris Bueller\'s Day Off, whose car do the friends borrow for the day?', a: 'Cameron\'s father\'s', d: ['Ferris\'s sister\'s', 'Sloane\'s mother\'s', 'Principal Rooney\'s'] },
{ c: 'Television', t: 3, q: 'In M*A*S*H, what is the number of the mobile army surgical hospital?', a: '4077th', d: ['8063rd', '1099th', '5155th'] },
{ c: 'Actors & Directors', t: 3, q: 'Which actor played Popeye Doyle in The French Connection?', a: 'Gene Hackman', d: ['Roy Scheider', 'Robert Duvall', 'Fernando Rey'] },
{ c: 'Awards & Box Office', t: 3, q: 'Who became the first Black actor to win Best Actor, for Lilies of the Field?', a: 'Sidney Poitier', d: ['James Earl Jones', 'Harry Belafonte', 'Paul Robeson'] },
{ c: 'Behind the Scenes', t: 3, q: 'In film finance, what is the negative cost?', a: 'The total cost of producing the film itself, before marketing', d: ['Money lost at the box office', 'The cost of developing the negative', 'The fee paid to critics'] },

{ c: 'Movies', t: 4, q: 'In Sweet Smell of Success, what is J.J. Hunsecker\'s job?', a: 'Newspaper columnist', d: ['Nightclub owner', 'Theater producer', 'Senator'] },
{ c: 'Television', t: 4, q: 'Which 1950s CBS documentary series hosted by Edward R. Murrow took on Senator Joseph McCarthy?', a: 'See It Now', d: ['Person to Person', '60 Minutes', 'Meet the Press'] },
{ c: 'Actors & Directors', t: 4, q: 'Which actor played the fast-talking con man Harold Hill in the 1962 film The Music Man?', a: 'Robert Preston', d: ['Howard Keel', 'Gene Kelly', 'Dick Van Dyke'] },
{ c: 'Awards & Box Office', t: 4, q: 'Which Roman Polanski film took the Palme d\'Or in 2002?', a: 'The Pianist', d: ['Chinatown', 'Tess', 'Frantic'] },
{ c: 'Behind the Scenes', t: 4, q: 'On a camera report, what does the abbreviation MOS mean?', a: 'The shot was filmed without sound', d: ['The take is marked as the best one', 'The shot uses a moving camera', 'The film stock is out of date'] },

{ c: 'Movies', t: 5, q: 'In which Soviet republic is the 1985 war film Come and See set?', a: 'Belarus', d: ['Ukraine', 'Lithuania', 'Georgia'] },
{ c: 'Television', t: 5, q: 'Which 1984 BBC drama depicted a nuclear attack on Sheffield and the collapse of society afterward?', a: 'Threads', d: ['The War Game', 'When the Wind Blows', 'Z for Zachariah'], from: 'script:d42q22' },
{ c: 'Actors & Directors', t: 5, q: 'Which Soviet director made The Cranes Are Flying?', a: 'Mikhail Kalatozov', d: ['Andrei Tarkovsky', 'Grigori Chukhrai', 'Sergei Bondarchuk'], from: 'script:d30q23' },
{ c: 'Awards & Box Office', t: 5, q: 'Which 1935 Best Picture winner had three of its cast nominated for Best Actor in the same year?', a: 'Mutiny on the Bounty', d: ['The Informer', 'David Copperfield', 'Captain Blood'], from: 'script:d34q24' },
{ c: 'Behind the Scenes', t: 5, q: 'Which studio was founded by Charlie Chaplin, Mary Pickford, Douglas Fairbanks and D. W. Griffith?', a: 'United Artists', d: ['Paramount Pictures', 'RKO', 'Columbia Pictures'], from: 'script:d03q25' },
],

// ── Day 120 ────────────────────────────────────────────────────────────
[
{ c: 'Movies', t: 1, q: 'In The Lion King, what is the name of the wise baboon who presents Simba to the animals?', a: 'Rafiki', d: ['Zazu', 'Nala', 'Sarabi'] },
{ c: 'Television', t: 1, q: 'In SpongeBob SquarePants, what is the name of SpongeBob\'s starfish best friend?', a: 'Patrick Star', d: ['Squidward Tentacles', 'Sandy Cheeks', 'Mr. Krabs'] },
{ c: 'Actors & Directors', t: 1, q: 'Which actor played Bilbo Baggins in The Hobbit films?', a: 'Martin Freeman', d: ['Ian Holm', 'Elijah Wood', 'James McAvoy'] },
{ c: 'Awards & Box Office', t: 1, q: 'Which actor won Best Supporting Actor for A Real Pain?', a: 'Kieran Culkin', d: ['Edward Norton', 'Yura Borisov', 'Guy Pearce'] },
{ c: 'Behind the Scenes', t: 1, q: 'Which American public broadcaster has carried the drama strand Masterpiece since 1971?', a: 'PBS', d: ['NPR', 'C-SPAN', 'CBS'] },

{ c: 'Movies', t: 2, q: 'In the Harry Potter films, what is the name of Ron Weasley\'s pet rat?', a: 'Scabbers', d: ['Crookshanks', 'Errol', 'Trevor'] },
{ c: 'Television', t: 2, q: 'In Squid Game, what is the first game the contestants play?', a: 'Red Light, Green Light', d: ['Tug of war', 'Marbles', 'Glass bridge'] },
{ c: 'Actors & Directors', t: 2, q: 'Which actress played Padme Amidala in the Star Wars prequels?', a: 'Natalie Portman', d: ['Keira Knightley', 'Kate Winslet', 'Mila Kunis'] },
{ c: 'Awards & Box Office', t: 2, q: 'Which song from the Telugu film RRR won the Academy Award for Best Original Song?', a: 'Naatu Naatu', d: ['Jai Ho', 'Chaiyya Chaiyya', 'Dosti'] },
{ c: 'Behind the Scenes', t: 2, q: 'Which network first aired Lost?', a: 'ABC', d: ['NBC', 'CBS', 'Fox'] },

{ c: 'Movies', t: 3, q: 'In Get Out, how does Missy hypnotize Chris?', a: 'By stirring a teacup with a spoon', d: ['By swinging a pocket watch', 'By ringing a bell', 'By playing a record'] },
{ c: 'Television', t: 3, q: 'In Absolutely Fabulous, what is the name of Edina\'s hard-drinking best friend?', a: 'Patsy', d: ['Saffron', 'Bubble', 'Mother'] },
{ c: 'Actors & Directors', t: 3, q: 'Which actress played Nurse Ratched in One Flew Over the Cuckoo\'s Nest?', a: 'Louise Fletcher', d: ['Ellen Burstyn', 'Shelley Duvall', 'Piper Laurie'] },
{ c: 'Awards & Box Office', t: 3, q: 'Which actress won Best Actress for The Reader?', a: 'Kate Winslet', d: ['Anne Hathaway', 'Angelina Jolie', 'Melissa Leo'] },
{ c: 'Behind the Scenes', t: 3, q: 'What is a crane shot?', a: 'A shot from a camera on a lifting arm that rises or swoops', d: ['A shot of birds', 'A shot from a helicopter', 'A shot from a moving car'] },

{ c: 'Movies', t: 4, q: 'In Pulp Fiction, which family heirloom does Butch risk his life to recover?', a: 'A gold watch', d: ['A wedding ring', 'A pocketknife', 'A medal'] },
{ c: 'Television', t: 4, q: 'In SCTV, in which fictional town was the struggling television station based?', a: 'Melonville', d: ['Cicely', 'Pawnee', 'Stars Hollow'] },
{ c: 'Actors & Directors', t: 4, q: 'Which French director made Beau Travail and White Material?', a: 'Claire Denis', d: ['Agnes Varda', 'Celine Sciamma', 'Catherine Breillat'] },
{ c: 'Awards & Box Office', t: 4, q: 'Which Darren Aronofsky film took the Golden Lion at Venice in 2008?', a: 'The Wrestler', d: ['Black Swan', 'Requiem for a Dream', 'The Fountain'] },
{ c: 'Behind the Scenes', t: 4, q: 'For which 1960 film was the gimmick Smell-O-Vision created?', a: 'Scent of Mystery', d: ['The Tingler', 'House on Haunted Hill', 'Polyester'] },

{ c: 'Movies', t: 5, q: 'Which Shakespeare play does Kurosawa\'s Throne of Blood adapt?', a: 'Macbeth', d: ['King Lear', 'Hamlet', 'Othello'] },
{ c: 'Television', t: 5, q: 'Which Japanese animated series about the Isono family began broadcasting on Fuji TV in 1969?', a: 'Sazae-san', d: ['Doraemon', 'Chibi Maruko-chan', 'Crayon Shin-chan'], from: 'script:d40q22' },
{ c: 'Actors & Directors', t: 5, q: 'Which Taiwanese director made A Brighter Summer Day and Yi Yi?', a: 'Edward Yang', d: ['Hou Hsiao-hsien', 'Tsai Ming-liang', 'Ang Lee'], from: 'script:d38q23' },
{ c: 'Awards & Box Office', t: 5, q: 'Which film about an English family in wartime won Best Picture at the 1943 ceremony?', a: 'Mrs. Miniver', d: ['Random Harvest', 'The Pride of the Yankees', 'Casablanca'], from: 'script:d28q24' },
{ c: 'Behind the Scenes', t: 5, q: 'Which 1942 film was taken from its director by the studio, shortened heavily and given a new ending shot by other hands?', a: 'The Magnificent Ambersons', d: ['The Lady from Shanghai', 'Journey into Fear', 'Mr. Arkadin'], from: 'script:d55q25' },
],

// ── Day 121 ────────────────────────────────────────────────────────────
[
{ c: 'Movies', t: 1, q: 'In Despicable Me, what is the name of the villain who adopts three girls?', a: 'Gru', d: ['Vector', 'Dr. Nefario', 'Scarlet Overkill'] },
{ c: 'Television', t: 1, q: 'Which reality competition searches for America\'s next drag superstar?', a: 'RuPaul\'s Drag Race', d: ['Queer Eye', 'Project Runway', 'Making the Cut'] },
{ c: 'Actors & Directors', t: 1, q: 'Which actor voiced Olaf the snowman in Frozen?', a: 'Josh Gad', d: ['Jonathan Groff', 'Jack Black', 'Alan Tudyk'] },
{ c: 'Awards & Box Office', t: 1, q: 'Which actress won Best Supporting Actress for playing a grieving school cook in The Holdovers?', a: 'Da\'Vine Joy Randolph', d: ['Emily Blunt', 'Danielle Brooks', 'America Ferrera'] },
{ c: 'Behind the Scenes', t: 1, q: 'What does a director call out to stop the camera at the end of a take?', a: 'Cut!', d: ['Action!', 'Rolling!', 'Places!'] },

{ c: 'Movies', t: 2, q: 'In Toy Story 3, what is the name of the daycare center where the toys are taken?', a: 'Sunnyside', d: ['Little Acorns', 'Happy Hollow', 'Rainbow Corner'] },
{ c: 'Television', t: 2, q: 'In Lost, which flight number crashes on the island?', a: 'Oceanic 815', d: ['Pan Am 103', 'Ajira 316', 'Oceanic 42'] },
{ c: 'Actors & Directors', t: 2, q: 'Which actor played Frasier Crane in Cheers and Frasier?', a: 'Kelsey Grammer', d: ['David Hyde Pierce', 'John Mahoney', 'Ted Danson'] },
{ c: 'Awards & Box Office', t: 2, q: 'Which song from Dirty Dancing won the Academy Award for Best Original Song?', a: '(I\'ve Had) The Time of My Life', d: ['She\'s Like the Wind', 'Hungry Eyes', 'Be My Baby'] },
{ c: 'Behind the Scenes', t: 2, q: 'What is color grading?', a: 'Adjusting the colors and tones of footage after shooting', d: ['Painting the sets', 'Choosing costume colors', 'Rating a film for age suitability'] },

{ c: 'Movies', t: 3, q: 'In The Godfather Part II, which country\'s revolution wrecks Michael\'s business plans on New Year\'s Eve?', a: 'Cuba', d: ['Mexico', 'Nicaragua', 'The Dominican Republic'] },
{ c: 'Television', t: 3, q: 'In Deadwood, which territory is the gold rush camp in?', a: 'Dakota Territory', d: ['Montana Territory', 'Wyoming Territory', 'Colorado Territory'] },
{ c: 'Actors & Directors', t: 3, q: 'Which director made Harold and Maude and Being There?', a: 'Hal Ashby', d: ['Mike Nichols', 'Robert Altman', 'Bob Rafelson'] },
{ c: 'Awards & Box Office', t: 3, q: 'Which actor won Best Actor for Life Is Beautiful, which he also directed?', a: 'Roberto Benigni', d: ['Marcello Mastroianni', 'Massimo Troisi', 'Giancarlo Giannini'] },
{ c: 'Behind the Scenes', t: 3, q: 'What was a blockbuster originally, before the word described hit films?', a: 'A bomb big enough to destroy a city block', d: ['A crowded theater queue', 'A wrecking ball', 'A Broadway hit'] },

{ c: 'Movies', t: 4, q: 'In Network, what is the name of the television network?', a: 'UBS', d: ['NBS', 'CBC', 'ABN'] },
{ c: 'Television', t: 4, q: 'In Peep Show, what are the names of the two mismatched flatmates?', a: 'Mark and Jeremy', d: ['Tim and Daisy', 'Gavin and Stacey', 'Vyvyan and Rick'] },
{ c: 'Actors & Directors', t: 4, q: 'Which actor starred in La Dolce Vita and 8½?', a: 'Marcello Mastroianni', d: ['Vittorio Gassman', 'Alberto Sordi', 'Ugo Tognazzi'] },
{ c: 'Awards & Box Office', t: 4, q: 'Which Iranian film by Mohammad Rasoulof won the Golden Bear at Berlin in 2020?', a: 'There Is No Evil', d: ['A Separation', 'Taxi', 'The Seed of the Sacred Fig'] },
{ c: 'Behind the Scenes', t: 4, q: 'Which actor operated R2-D2 from inside the droid in the 1977 Star Wars?', a: 'Kenny Baker', d: ['Anthony Daniels', 'Peter Mayhew', 'Warwick Davis'] },

{ c: 'Movies', t: 5, q: 'What is unusual about the dialogue in The Umbrellas of Cherbourg?', a: 'Every line is sung', d: ['There is none at all', 'It is all whispered', 'It is all in rhyme'] },
{ c: 'Television', t: 5, q: 'Which Kieslowski television cycle drew each of its ten films from one of the Ten Commandments?', a: 'Dekalog', d: ['Three Colors', 'Blind Chance', 'No End'] },
{ c: 'Actors & Directors', t: 5, q: 'Which actor played Franz Biberkopf in Fassbinder\'s 1980 Berlin Alexanderplatz?', a: 'Gunter Lamprecht', d: ['Klaus Kinski', 'Bruno Ganz', 'Armin Mueller-Stahl'] },
{ c: 'Awards & Box Office', t: 5, q: 'Beginning with which film year did the Academy widen the Best Picture field beyond five nominees?', a: '2009', d: ['1999', '2005', '2013'], from: 'script:d16q24' },
{ c: 'Behind the Scenes', t: 5, q: 'Which 1982 film took its title from an unrelated novel whose name the producers bought purely for the words?', a: 'Blade Runner', d: ['Soylent Green', 'Logan\'s Run', 'Outland'], from: 'script:d45q25' },
],

// ── Day 122 ────────────────────────────────────────────────────────────
[
{ c: 'Movies', t: 1, q: 'In Home Alone, what is the full name of the boy left behind?', a: 'Kevin McCallister', d: ['Kevin Arnold', 'Kevin Malone', 'Kevin Bacon'] },
{ c: 'Television', t: 1, q: 'In The Brady Bunch, how many children are there in the blended family?', a: 'Six', d: ['Four', 'Five', 'Eight'] },
{ c: 'Actors & Directors', t: 1, q: 'Which actress played Eleven in Stranger Things?', a: 'Millie Bobby Brown', d: ['Sadie Sink', 'Natalia Dyer', 'Maya Hawke'] },
{ c: 'Awards & Box Office', t: 1, q: 'Which 2004 Clint Eastwood boxing drama won Best Picture?', a: 'Million Dollar Baby', d: ['The Aviator', 'Sideways', 'Ray'] },
{ c: 'Behind the Scenes', t: 1, q: 'Which Magnum, P.I. star was first choice to play Indiana Jones but could not get out of his television contract?', a: 'Tom Selleck', d: ['Burt Reynolds', 'Nick Nolte', 'Jeff Bridges'] },

{ c: 'Movies', t: 2, q: 'In The Wizard of Oz, what is the name of the woman who raises Dorothy on the Kansas farm?', a: 'Aunt Em', d: ['Aunt May', 'Aunt Bee', 'Aunt Polly'] },
{ c: 'Television', t: 2, q: 'In the American version of The Office, what is Dwight\'s family farm called?', a: 'Schrute Farms', d: ['Beet Acres', 'Mose Manor', 'Scranton Fields'] },
{ c: 'Actors & Directors', t: 2, q: 'Which actor played Doc Holliday in Tombstone?', a: 'Val Kilmer', d: ['Dennis Quaid', 'Kurt Russell', 'Sam Elliott'] },
{ c: 'Awards & Box Office', t: 2, q: 'Which comedy about a veteran Las Vegas comedian won the Emmy for Outstanding Comedy Series in 2024?', a: 'Hacks', d: ['The Bear', 'Abbott Elementary', 'Only Murders in the Building'] },
{ c: 'Behind the Scenes', t: 2, q: 'Which 1939 film was shot by three directors, with Victor Fleming finishing it?', a: 'Gone with the Wind', d: ['Stagecoach', 'Wuthering Heights', 'Ninotchka'] },

{ c: 'Movies', t: 3, q: 'In Stanley Kubrick\'s The Shining, which room number is Danny warned never to enter?', a: '237', d: ['217', '101', '42'] },
{ c: 'Television', t: 3, q: 'In The Wire, whom does Omar Little make a career of robbing?', a: 'Drug dealers', d: ['Banks', 'Dock workers', 'Politicians'] },
{ c: 'Actors & Directors', t: 3, q: 'Which actor played the title villain Bill in Kill Bill?', a: 'David Carradine', d: ['Michael Madsen', 'Gordon Liu', 'Michael Parks'] },
{ c: 'Awards & Box Office', t: 3, q: 'Which comedian won Best Supporting Actress for Precious?', a: 'Mo\'Nique', d: ['Queen Latifah', 'Mariah Carey', 'Wanda Sykes'] },
{ c: 'Behind the Scenes', t: 3, q: 'What is a back-end deal?', a: 'An agreement giving someone a share of a film\'s profits', d: ['A deal to film in the studio back lot', 'A deal for the closing credits song', 'A deal to cut a film\'s ending'] },

{ c: 'Movies', t: 4, q: 'In which city and year is Blade Runner set?', a: 'Los Angeles, 2019', d: ['New York, 2049', 'Tokyo, 2020', 'Chicago, 2032'] },
{ c: 'Television', t: 4, q: 'What was the original 1975 cast of Saturday Night Live billed as?', a: 'The Not Ready for Prime Time Players', d: ['The Second City Troupe', 'The Midnight Irregulars', 'The Studio 8H Gang'] },
{ c: 'Actors & Directors', t: 4, q: 'Which actress starred in Godard\'s Contempt?', a: 'Brigitte Bardot', d: ['Anna Karina', 'Jeanne Moreau', 'Catherine Deneuve'] },
{ c: 'Awards & Box Office', t: 4, q: 'Which Mike Leigh family drama won Brenda Blethyn the BAFTA for Best Actress?', a: 'Secrets and Lies', d: ['Naked', 'Vera Drake', 'Topsy-Turvy'] },
{ c: 'Behind the Scenes', t: 4, q: 'Which Disney artist, inspired by Chinese landscape painting, set the visual style of Bambi?', a: 'Tyrus Wong', d: ['Ub Iwerks', 'Mary Blair', 'Marc Davis'] },

{ c: 'Movies', t: 5, q: 'What is the family name of the Sicilian prince in Visconti\'s The Leopard?', a: 'Salina', d: ['Falconeri', 'Sedara', 'Corbera'] },
{ c: 'Television', t: 5, q: 'Which German U-boat drama by Wolfgang Petersen was also broadcast as a longer television miniseries?', a: 'Das Boot', d: ['Heimat', 'Stalingrad', 'Generation War'] },
{ c: 'Actors & Directors', t: 5, q: 'Which actor played the icon painter in Andrei Rublev?', a: 'Anatoly Solonitsyn', d: ['Nikolai Burlyayev', 'Donatas Banionis', 'Oleg Yankovsky'] },
{ c: 'Awards & Box Office', t: 5, q: 'Which Michael Haneke film set in a prewar German village took the Palme d\'Or in 2009?', a: 'The White Ribbon', d: ['Amour', 'Cache', 'Code Unknown'] },
{ c: 'Behind the Scenes', t: 5, q: 'Which device did Disney first use on the 1937 short The Old Mill to give flat animation a sense of depth?', a: 'The multiplane camera', d: ['The optical printer', 'The aerial image printer', 'The rotoscope'], from: 'script:d37q25' },
],

// ── Day 123 ────────────────────────────────────────────────────────────
[
{ c: 'Movies', t: 1, q: 'In the Harry Potter films, which Quidditch position does Harry play?', a: 'Seeker', d: ['Keeper', 'Chaser', 'Beater'] },
{ c: 'Television', t: 1, q: 'In Seinfeld, what is the name of Jerry\'s neighbor across the hall?', a: 'Kramer', d: ['George', 'Elaine', 'Puddy'] },
{ c: 'Actors & Directors', t: 1, q: 'Which actress played the title role in the 2022 Netflix series Wednesday?', a: 'Jenna Ortega', d: ['Christina Ricci', 'Millie Bobby Brown', 'Sadie Sink'] },
{ c: 'Awards & Box Office', t: 1, q: 'What does a performer receive on the Hollywood Walk of Fame?', a: 'A star set into the sidewalk', d: ['A bronze statue', 'A handprint in a wall', 'A plaque on a lamppost'] },
{ c: 'Behind the Scenes', t: 1, q: 'Lassie is a female collie on screen, but who usually played her?', a: 'Male collies', d: ['Female collies only', 'A puppet', 'A trained wolf'] },

{ c: 'Movies', t: 2, q: 'In The Terminator, what is Sarah Connor working as when the cyborg comes for her?', a: 'A waitress', d: ['A nurse', 'A student', 'A bank teller'] },
{ c: 'Television', t: 2, q: 'In Gilligan\'s Island, what is the name of the boat that runs aground?', a: 'The S.S. Minnow', d: ['The Sea Breeze', 'The Lucky Lady', 'The Mary Ann'] },
{ c: 'Actors & Directors', t: 2, q: 'Which English actor played Rick Grimes in The Walking Dead?', a: 'Andrew Lincoln', d: ['Norman Reedus', 'Jeffrey Dean Morgan', 'Jon Bernthal'] },
{ c: 'Awards & Box Office', t: 2, q: 'Which FX series set in feudal Japan won the Emmy for Outstanding Drama Series in 2024?', a: 'Shogun', d: ['The Crown', 'Slow Horses', 'The Morning Show'] },
{ c: 'Behind the Scenes', t: 2, q: 'In television, what is a bottle episode?', a: 'An episode kept to one location and few actors to save money', d: ['An episode sponsored by a drink brand', 'An episode shot underwater', 'A holiday special'] },

{ c: 'Movies', t: 3, q: 'In Singin\' in the Rain, which new technology throws the studio into chaos?', a: 'Talking pictures', d: ['Color film', 'Television', 'Widescreen'] },
{ c: 'Television', t: 3, q: 'In Seinfeld, what is Jerry\'s apartment number?', a: '5A', d: ['3B', '4D', '9C'] },
{ c: 'Actors & Directors', t: 3, q: 'Which actor played Max Rockatansky in the original 1979 Mad Max?', a: 'Mel Gibson', d: ['Tom Hardy', 'Hugh Keays-Byrne', 'Bryan Brown'] },
{ c: 'Awards & Box Office', t: 3, q: 'Which actor won Best Supporting Actor at age eighty-two for Beginners?', a: 'Christopher Plummer', d: ['Max von Sydow', 'Alan Arkin', 'Hal Holbrook'] },
{ c: 'Behind the Scenes', t: 3, q: 'What is letterboxing?', a: 'Showing a widescreen film with black bars above and below', d: ['Mailing film reels to cinemas', 'Adding text over the picture', 'Framing a shot through a mail slot'] },

{ c: 'Movies', t: 4, q: 'In The Conformist, whom is Marcello sent to have assassinated?', a: 'His former professor', d: ['His father', 'A fascist minister', 'His wife\'s lover'] },
{ c: 'Television', t: 4, q: 'Which 1980s Steven Bochco drama followed the partners of a Los Angeles firm of attorneys?', a: 'L.A. Law', d: ['The Practice', 'Boston Legal', 'Ally McBeal'] },
{ c: 'Actors & Directors', t: 4, q: 'Which actor played the murderous preacher Harry Powell in The Night of the Hunter?', a: 'Robert Mitchum', d: ['Burt Lancaster', 'Kirk Douglas', 'Gregory Peck'] },
{ c: 'Awards & Box Office', t: 4, q: 'Which Chloe Zhao film took the Golden Lion at Venice in 2020?', a: 'Nomadland', d: ['The Rider', 'Eternals', 'Songs My Brothers Taught Me'] },
{ c: 'Behind the Scenes', t: 4, q: 'Which artist designed the color styling of Disney\'s It\'s a Small World and Cinderella?', a: 'Mary Blair', d: ['Tyrus Wong', 'Retta Scott', 'Eyvind Earle'] },

{ c: 'Movies', t: 5, q: 'In Stalker, what is the Room at the heart of the Zone said to grant?', a: 'A visitor\'s innermost wish', d: ['Eternal life', 'Perfect knowledge', 'A glimpse of the future'] },
{ c: 'Television', t: 5, q: 'What was the long-running Italian television drama La Piovra, or The Octopus, about?', a: 'The Mafia', d: ['Vatican intrigue', 'A fishing village', 'A terrorist cell'] },
{ c: 'Actors & Directors', t: 5, q: 'Which actress played the young bride Juliette in Vigo\'s L\'Atalante?', a: 'Dita Parlo', d: ['Arletty', 'Michele Morgan', 'Simone Simon'] },
{ c: 'Awards & Box Office', t: 5, q: 'Which Nicolas Philibert documentary about a floating day center in Paris won the Golden Bear in 2023?', a: 'On the Adamant', d: ['Dahomey', 'Fire at Sea', 'To Be and to Have'] },
{ c: 'Behind the Scenes', t: 5, q: 'What did the Lumiere brothers call their combined camera and projector?', a: 'The Cinematographe', d: ['The Kinetoscope', 'The Vitascope', 'The Bioscope'] },
],

// ── Day 124 ────────────────────────────────────────────────────────────
[
{ c: 'Movies', t: 1, q: 'In The Incredibles, who designs the superhero costumes and refuses to add capes?', a: 'Edna Mode', d: ['Evelyn Deavor', 'Mirage', 'Helen Parr'] },
{ c: 'Television', t: 1, q: 'Which series lets entrepreneurs pitch their businesses to a panel of wealthy investors in the United States?', a: 'Shark Tank', d: ['The Apprentice', 'Undercover Boss', 'The Profit'] },
{ c: 'Actors & Directors', t: 1, q: 'Which actor played the Fonz in Happy Days?', a: 'Henry Winkler', d: ['Ron Howard', 'Scott Baio', 'Tom Bosley'] },
{ c: 'Awards & Box Office', t: 1, q: 'Which comedian hosted the Academy Awards nine times, often opening with a song medley about the nominees?', a: 'Billy Crystal', d: ['Whoopi Goldberg', 'Steve Martin', 'Chris Rock'] },
{ c: 'Behind the Scenes', t: 1, q: 'What is a trilogy?', a: 'A set of three related works', d: ['A film with three directors', 'A film told in three languages', 'A film shown three times a day'] },

{ c: 'Movies', t: 2, q: 'In Forrest Gump, what is the name of the shrimp company Forrest founds?', a: 'Bubba Gump', d: ['Gump and Dan', 'Jenny Shrimp', 'Bayou Catch'] },
{ c: 'Television', t: 2, q: 'In M*A*S*H, what is Hawkeye\'s surname?', a: 'Pierce', d: ['Hunnicutt', 'Burns', 'Winchester'] },
{ c: 'Actors & Directors', t: 2, q: 'Which actor played Saruman in The Lord of the Rings films?', a: 'Christopher Lee', d: ['Ian Holm', 'Bernard Hill', 'John Hurt'] },
{ c: 'Awards & Box Office', t: 2, q: 'Which sitcom won the Emmy for Outstanding Comedy Series five years running from 2010 to 2014?', a: 'Modern Family', d: ['30 Rock', 'The Big Bang Theory', 'Veep'] },
{ c: 'Behind the Scenes', t: 2, q: 'In which country are Pinewood Studios, longtime base of the Bond films?', a: 'England', d: ['Scotland', 'Ireland', 'Canada'] },

{ c: 'Movies', t: 3, q: 'In Fargo, which machine does the killer use to dispose of a body?', a: 'A wood chipper', d: ['A cement mixer', 'A furnace', 'A trash compactor'] },
{ c: 'Television', t: 3, q: 'In The West Wing, who is the White House press secretary?', a: 'C.J. Cregg', d: ['Josh Lyman', 'Toby Ziegler', 'Donna Moss'] },
{ c: 'Actors & Directors', t: 3, q: 'Which actor played Roy Neary in Close Encounters of the Third Kind?', a: 'Richard Dreyfuss', d: ['Roy Scheider', 'Bob Balaban', 'Francois Truffaut'] },
{ c: 'Awards & Box Office', t: 3, q: 'Which actress won Best Supporting Actress for If Beale Street Could Talk?', a: 'Regina King', d: ['Amy Adams', 'Emma Stone', 'Marina de Tavira'] },
{ c: 'Behind the Scenes', t: 3, q: 'What is a whip pan?', a: 'A pan so fast that the image blurs', d: ['A slow sweeping pan', 'A pan following a vehicle', 'A pan combined with a zoom'] },

{ c: 'Movies', t: 4, q: 'In Heat, where does the final confrontation between Hanna and McCauley take place?', a: 'Beside the runways at LAX', d: ['On the Santa Monica Pier', 'In a downtown bank', 'At a freight yard'] },
{ c: 'Television', t: 4, q: 'Which 2019 South Korean drama follows an heiress who paraglides by accident into North Korea?', a: 'Crash Landing on You', d: ['Descendants of the Sun', 'Goblin', 'Itaewon Class'] },
{ c: 'Actors & Directors', t: 4, q: 'Which Indian director made Pather Panchali?', a: 'Satyajit Ray', d: ['Ritwik Ghatak', 'Mrinal Sen', 'Guru Dutt'] },
{ c: 'Awards & Box Office', t: 4, q: 'Which Ruben Ostlund satire about a luxury cruise was nominated for Best Picture for 2022?', a: 'Triangle of Sadness', d: ['The Square', 'Force Majeure', 'Close'] },
{ c: 'Behind the Scenes', t: 4, q: 'Which 1903 Edwin S. Porter film is an early landmark of narrative editing and the western?', a: 'The Great Train Robbery', d: ['Life of an American Fireman', 'The Kiss', 'Rescued by Rover'] },

{ c: 'Movies', t: 5, q: 'In which city do the angels of Wings of Desire watch over people?', a: 'Berlin', d: ['Vienna', 'Munich', 'Hamburg'] },
{ c: 'Television', t: 5, q: 'Which German television epic by Edgar Reitz follows the village of Schabbach across the twentieth century?', a: 'Heimat', d: ['Berlin Alexanderplatz', 'Das Boot', 'Babylon Berlin'] },
{ c: 'Actors & Directors', t: 5, q: 'Which director made The Umbrellas of Cherbourg and The Young Girls of Rochefort?', a: 'Jacques Demy', d: ['Jacques Rivette', 'Claude Lelouch', 'Louis Malle'] },
{ c: 'Awards & Box Office', t: 5, q: 'Which Visconti film took the Palme d\'Or in 1963?', a: 'The Leopard', d: ['Rocco and His Brothers', 'Senso', 'Death in Venice'] },
{ c: 'Behind the Scenes', t: 5, q: 'Which British two-color process, developed by George Albert Smith and promoted by Charles Urban, was the first commercially successful natural color system for film?', a: 'Kinemacolor', d: ['Technicolor', 'Prizma', 'Chronochrome'] },
],

];
