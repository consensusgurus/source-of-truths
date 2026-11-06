// Art lane: Music. 48 days x 5 tiers. Classical, opera, ballet, the orchestra,
// music terms, jazz, blues, rock and pop history, albums and bands to 2024,
// stage musicals. No lyrics, no live charts, no current lineups.
const L = "Music";
export const LANE_DAYS = [
  // day 1
  [
    { c: L, t: 1, q: "Which band was made up of John, Paul, George and Ringo?", a: "The Beatles", d: ["The Rolling Stones", "The Monkees", "The Hollies"] },
    { c: L, t: 2, q: "What is the orchestral introduction played before the curtain rises on an opera called?", a: "The overture", d: ["The finale", "The interlude", "The encore"] },
    { c: L, t: 3, q: "Which Mozart opera features the Queen of the Night and the bird catcher Papageno?", a: "The Magic Flute", d: ["The Marriage of Figaro", "Don Giovanni", "Così fan tutte"] },
    { c: L, t: 4, q: "Which Def Leppard drummer kept playing after losing his left arm in a 1984 car crash?", a: "Rick Allen", d: ["Tommy Lee", "Lars Ulrich", "Nicko McBrain"] },
    { c: L, t: 5, q: "What Baroque form repeats a bass line throughout while variations unfold above it, as in Bach's organ work BWV 582?", a: "Passacaglia", d: ["Toccata", "Invention", "Partita"] },
  ],
  // day 2
  [
    { c: L, t: 1, q: "Which singer was known as the 'Godfather of Soul'?", a: "James Brown", d: ["Ray Charles", "Otis Redding", "Sam Cooke"] },
    { c: L, t: 2, q: "Which string instrument is a little larger than the violin and pitched lower?", a: "Viola", d: ["Cello", "Mandolin", "Double bass"] },
    { c: L, t: 3, q: "Which Stephen Sondheim musical weaves together fairy tales including Cinderella and Rapunzel?", a: "Into the Woods", d: ["Company", "Follies", "Assassins"] },
    { c: L, t: 4, q: "Which Verdi opera features the famous 'Anvil Chorus'?", a: "Il trovatore", d: ["La traviata", "Rigoletto", "Nabucco"] },
    { c: L, t: 5, q: "Which loose group of Los Angeles session players, including drummer Hal Blaine, played on countless 1960s hits?", a: "The Wrecking Crew", d: ["The Funk Brothers", "The Swampers", "The Section"] },
  ],
  // day 3
  [
    { c: L, t: 1, q: "What is the stick that a violinist draws across the strings called?", a: "The bow", d: ["The baton", "The pick", "The mallet"] },
    { c: L, t: 2, q: "Which New Jersey band recorded the 1986 hit 'Livin' on a Prayer'?", a: "Bon Jovi", d: ["Def Leppard", "Poison", "Whitesnake"] },
    { c: L, t: 3, q: "Which English composer wrote the orchestral suite 'The Planets'?", a: "Gustav Holst", d: ["Edward Elgar", "Ralph Vaughan Williams", "Benjamin Britten"] },
    { c: L, t: 4, q: "Which song closes side one of Led Zeppelin's untitled fourth album from 1971?", a: "Stairway to Heaven", d: ["Black Dog", "Going to California", "When the Levee Breaks"] },
    { c: L, t: 5, q: "Which Puccini opera, set in Rome in 1800, ends with its heroine leaping from the Castel Sant'Angelo?", a: "Tosca", d: ["La Bohème", "Manon Lescaut", "Turandot"] },
  ],
  // day 4
  [
    { c: L, t: 1, q: "Which Swedish group released 'Dancing Queen' in 1976?", a: "ABBA", d: ["Roxette", "Ace of Base", "The Cardigans"] },
    { c: L, t: 2, q: "Which Italian tempo marking means a moderate, walking pace?", a: "Andante", d: ["Allegro", "Presto", "Vivace"] },
    { c: L, t: 3, q: "Which singer recorded a celebrated series of 'Songbook' albums for Verve, beginning with Cole Porter in 1956?", a: "Ella Fitzgerald", d: ["Sarah Vaughan", "Peggy Lee", "Anita O'Day"] },
    { c: L, t: 4, q: "Which 1977 Pink Floyd album cover shows an inflatable pig floating over Battersea Power Station?", a: "Animals", d: ["Wish You Were Here", "The Wall", "Meddle"] },
    { c: L, t: 5, q: "How many numbered symphonies did Gustav Mahler complete, leaving one more unfinished at his death?", a: "Nine", d: ["Seven", "Eleven", "Six"] },
  ],
  // day 5
  [
    { c: L, t: 1, q: "Which grunge band was fronted by Kurt Cobain?", a: "Nirvana", d: ["Pearl Jam", "Soundgarden", "Alice in Chains"] },
    { c: L, t: 2, q: "Which singer was crowned the 'Queen of Disco' in the 1970s?", a: "Donna Summer", d: ["Gloria Gaynor", "Diana Ross", "Chaka Khan"] },
    { c: L, t: 3, q: "Which composer wrote the 'William Tell' Overture?", a: "Gioachino Rossini", d: ["Gaetano Donizetti", "Vincenzo Bellini", "Giuseppe Verdi"] },
    { c: L, t: 4, q: "Which bassist and songwriter wrote 'Hoochie Coochie Man' for Muddy Waters?", a: "Willie Dixon", d: ["Jimmy Rogers", "Otis Spann", "Little Walter"] },
    { c: L, t: 5, q: "Which composer's 1830 'Symphonie fantastique' is built around a recurring melody he called the idée fixe?", a: "Hector Berlioz", d: ["Camille Saint-Saëns", "Charles Gounod", "Georges Bizet"] },
  ],
  // day 6
  [
    { c: L, t: 1, q: "Who composed the piano piece 'Für Elise'?", a: "Ludwig van Beethoven", d: ["Wolfgang Amadeus Mozart", "Frederic Chopin", "Franz Schubert"] },
    { c: L, t: 2, q: "Which musical retells the Bible story of a dreamer given a coat of many colors?", a: "Joseph and the Amazing Technicolor Dreamcoat", d: ["Godspell", "Children of Eden", "Pippin"] },
    { c: L, t: 3, q: "Which 1979 album was Michael Jackson's first made with producer Quincy Jones?", a: "Off the Wall", d: ["Thriller", "Bad", "Destiny"] },
    { c: L, t: 4, q: "Which Richard Strauss opera features the 'Dance of the Seven Veils'?", a: "Salome", d: ["Elektra", "Der Rosenkavalier", "Ariadne auf Naxos"] },
    { c: L, t: 5, q: "Which Motown songwriting and production trio wrote many of the Supremes' 1960s hits?", a: "Holland-Dozier-Holland", d: ["Ashford and Simpson", "Gamble and Huff", "Leiber and Stoller"] },
  ],
  // day 7
  [
    { c: L, t: 1, q: "Which British pop group was made up of Ginger, Scary, Baby, Sporty and Posh?", a: "The Spice Girls", d: ["All Saints", "Bananarama", "Girls Aloud"] },
    { c: L, t: 2, q: "What does 'a cappella' mean when describing singing?", a: "Without instruments", d: ["With a full orchestra", "In Latin", "In unison"] },
    { c: L, t: 3, q: "Which saxophonist released the 1960 album 'Giant Steps'?", a: "John Coltrane", d: ["Sonny Rollins", "Dexter Gordon", "Stan Getz"] },
    { c: L, t: 4, q: "Which Cole Porter musical builds a backstage story around 'The Taming of the Shrew'?", a: "Kiss Me, Kate", d: ["Anything Goes", "Can-Can", "Silk Stockings"] },
    { c: L, t: 5, q: "Which keyboard instrument sounds by plucking its strings with quills or plectra?", a: "Harpsichord", d: ["Clavichord", "Fortepiano", "Celesta"] },
  ],
  // day 8
  [
    { c: L, t: 1, q: "Which instrument has Yo-Yo Ma played throughout his career?", a: "Cello", d: ["Violin", "Viola", "Double bass"] },
    { c: L, t: 2, q: "Which Elton John song was rewritten in 1997 as a tribute to Princess Diana?", a: "Candle in the Wind", d: ["Your Song", "Tiny Dancer", "Rocket Man"] },
    { c: L, t: 3, q: "Which Russian composer wrote the piano suite 'Pictures at an Exhibition'?", a: "Modest Mussorgsky", d: ["Alexander Borodin", "Mily Balakirev", "César Cui"] },
    { c: L, t: 4, q: "Which 1976 Stevie Wonder double album includes 'Sir Duke' and 'Isn't She Lovely'?", a: "Songs in the Key of Life", d: ["Innervisions", "Talking Book", "Fulfillingness' First Finale"] },
    { c: L, t: 5, q: "Which 1959 Miles Davis album is built largely on modes rather than fast chord changes?", a: "Kind of Blue", d: ["Sketches of Spain", "Birth of the Cool", "Bitches Brew"] },
  ],
  // day 9
  [
    { c: L, t: 1, q: "Which section of the orchestra includes the timpani?", a: "Percussion", d: ["Brass", "Woodwinds", "Strings"] },
    { c: L, t: 2, q: "Which band did Ozzy Osbourne front in the 1970s?", a: "Black Sabbath", d: ["Deep Purple", "Uriah Heep", "Judas Priest"] },
    { c: L, t: 3, q: "Which Verdi opera follows the Paris courtesan Violetta Valéry?", a: "La traviata", d: ["Rigoletto", "Il trovatore", "Un ballo in maschera"] },
    { c: L, t: 4, q: "Which 1986 Run-DMC album includes their 'Walk This Way' remake with Aerosmith?", a: "Raising Hell", d: ["King of Rock", "Tougher Than Leather", "Down with the King"] },
    { c: L, t: 5, q: "Which French Baroque composer died of gangrene after striking his foot with his conducting staff?", a: "Jean-Baptiste Lully", d: ["Jean-Philippe Rameau", "François Couperin", "Marc-Antoine Charpentier"] },
  ],
  // day 10
  [
    { c: L, t: 1, q: "Which Jamaican star recorded 'No Woman, No Cry' and 'One Love'?", a: "Bob Marley", d: ["Jimmy Cliff", "Peter Tosh", "Toots Hibbert"] },
    { c: L, t: 2, q: "What is a piece written for eight performers called?", a: "Octet", d: ["Septet", "Nonet", "Sextet"] },
    { c: L, t: 3, q: "Which Prokofiev work for narrator and orchestra gives each character, such as a duck played by the oboe, its own instrument?", a: "Peter and the Wolf", d: ["The Love for Three Oranges", "Lieutenant Kijé", "Romeo and Juliet"] },
    { c: L, t: 4, q: "Which Rodgers and Hammerstein musical is set at the royal court of Siam?", a: "The King and I", d: ["South Pacific", "Flower Drum Song", "Carousel"] },
    { c: L, t: 5, q: "Which New Orleans pianist, who led the Red Hot Peppers, claimed to have invented jazz?", a: "Jelly Roll Morton", d: ["King Oliver", "Kid Ory", "Sidney Bechet"] },
  ],
  // day 11
  [
    { c: L, t: 1, q: "Which singer broke through with the 2008 hit 'I Kissed a Girl'?", a: "Katy Perry", d: ["Lady Gaga", "Kesha", "Rihanna"] },
    { c: L, t: 2, q: "Which Italian term asks performers to slow down gradually?", a: "Ritardando", d: ["Accelerando", "Sforzando", "Crescendo"] },
    { c: L, t: 3, q: "Which Bizet opera centers on a cigarette factory worker in Seville?", a: "Carmen", d: ["Manon", "Lakmé", "Thaïs"] },
    { c: L, t: 4, q: "Which guitarist replaced Mick Taylor in the Rolling Stones in the mid-1970s?", a: "Ronnie Wood", d: ["Brian Jones", "Bill Wyman", "Jeff Beck"] },
    { c: L, t: 5, q: "Which composer wrote the piano quintet nicknamed the 'Trout'?", a: "Franz Schubert", d: ["Robert Schumann", "Johannes Brahms", "Felix Mendelssohn"] },
  ],
  // day 12
  [
    { c: L, t: 1, q: "Which pop star released the 1984 album 'Like a Virgin'?", a: "Madonna", d: ["Cyndi Lauper", "Whitney Houston", "Janet Jackson"] },
    { c: L, t: 2, q: "Which small flute plays an octave higher than the standard orchestral flute?", a: "Piccolo", d: ["Recorder", "Fife", "Ocarina"] },
    { c: L, t: 3, q: "Which singer made the first recording of 'Strange Fruit' in 1939?", a: "Billie Holiday", d: ["Bessie Smith", "Ella Fitzgerald", "Nina Simone"] },
    { c: L, t: 4, q: "Which Beatles song, released in 2023, was billed as the band's last?", a: "Now and Then", d: ["Free as a Bird", "Real Love", "The Long and Winding Road"] },
    { c: L, t: 5, q: "What nickname was given to the five Russian nationalist composers Balakirev, Cui, Borodin, Mussorgsky and Rimsky-Korsakov?", a: "The Mighty Handful", d: ["Les Six", "The Second Viennese School", "The Wanderers"] },
  ],
  // day 13
  [
    { c: L, t: 1, q: "What device ticks out a steady beat to help musicians keep time?", a: "A metronome", d: ["A tuning fork", "A pitch pipe", "A capo"] },
    { c: L, t: 2, q: "Which Irish band released 'The Joshua Tree' in 1987?", a: "U2", d: ["The Cranberries", "Thin Lizzy", "The Pogues"] },
    { c: L, t: 3, q: "Which French composer wrote 'The Carnival of the Animals'?", a: "Camille Saint-Saëns", d: ["Gabriel Fauré", "Maurice Ravel", "Erik Satie"] },
    { c: L, t: 4, q: "Which Mozart opera carries the subtitle 'The School for Lovers'?", a: "Così fan tutte", d: ["Don Giovanni", "The Marriage of Figaro", "Idomeneo"] },
    { c: L, t: 5, q: "Which DJ, resident at Chicago's Warehouse club, is called the 'Godfather of House'?", a: "Frankie Knuckles", d: ["Larry Levan", "Ron Hardy", "Marshall Jefferson"] },
  ],
  // day 14
  [
    { c: L, t: 1, q: "Which rock band's logo is a pair of red lips with the tongue sticking out?", a: "The Rolling Stones", d: ["Aerosmith", "Kiss", "The Who"] },
    { c: L, t: 2, q: "Which composer wrote 'Eine kleine Nachtmusik'?", a: "Wolfgang Amadeus Mozart", d: ["Joseph Haydn", "Johann Sebastian Bach", "Franz Schubert"] },
    { c: L, t: 3, q: "Which Meredith Willson musical follows a con man selling band instruments in a small Iowa town?", a: "The Music Man", d: ["Damn Yankees", "Bye Bye Birdie", "The Pajama Game"] },
    { c: L, t: 4, q: "Which tenor saxophonist's 1939 recording of 'Body and Soul' became a jazz landmark?", a: "Coleman Hawkins", d: ["Lester Young", "Ben Webster", "Chu Berry"] },
    { c: L, t: 5, q: "Which Verdi opera contains the chorus 'Va, pensiero', sung by exiled Hebrew slaves?", a: "Nabucco", d: ["Aida", "I Lombardi", "Attila"] },
  ],
  // day 15
  [
    { c: L, t: 1, q: "Which 1985 charity single was recorded by the all-star group USA for Africa?", a: "We Are the World", d: ["Do They Know It's Christmas?", "That's What Friends Are For", "Hands Across America"] },
    { c: L, t: 2, q: "What is the musical term for notes played short and detached?", a: "Staccato", d: ["Legato", "Tenuto", "Glissando"] },
    { c: L, t: 3, q: "Which Queen guitarist built his own instrument, known as the Red Special, with his father?", a: "Brian May", d: ["Roger Taylor", "John Deacon", "Ritchie Blackmore"] },
    { c: L, t: 4, q: "Which Italian composer wrote 'The Pines of Rome'?", a: "Ottorino Respighi", d: ["Pietro Mascagni", "Ermanno Wolf-Ferrari", "Ferruccio Busoni"] },
    { c: L, t: 5, q: "Which 1920s cornetist recorded 'Singin' the Blues' with saxophonist Frankie Trumbauer?", a: "Bix Beiderbecke", d: ["Red Nichols", "Jimmy McPartland", "Muggsy Spanier"] },
  ],
  // day 16
  [
    { c: L, t: 1, q: "Which singer had a 1983 hit with 'Girls Just Want to Have Fun'?", a: "Cyndi Lauper", d: ["Madonna", "Pat Benatar", "Debbie Gibson"] },
    { c: L, t: 2, q: "Which composer wrote the '1812 Overture', which calls for cannon fire?", a: "Pyotr Ilyich Tchaikovsky", d: ["Nikolai Rimsky-Korsakov", "Modest Mussorgsky", "Alexander Borodin"] },
    { c: L, t: 3, q: "Which Lerner and Loewe musical is set at the court of King Arthur?", a: "Camelot", d: ["Brigadoon", "Gigi", "Paint Your Wagon"] },
    { c: L, t: 4, q: "Which alto saxophonist composed 'Take Five' for the Dave Brubeck Quartet?", a: "Paul Desmond", d: ["Gerry Mulligan", "Art Pepper", "Lee Konitz"] },
    { c: L, t: 5, q: "Which one-act Mascagni opera is traditionally paired on stage with 'Pagliacci'?", a: "Cavalleria rusticana", d: ["Gianni Schicchi", "L'amico Fritz", "Suor Angelica"] },
  ],
  // day 17
  [
    { c: L, t: 1, q: "What is a group of three musicians called?", a: "Trio", d: ["Duo", "Quartet", "Quintet"] },
    { c: L, t: 2, q: "Which singer was the lead voice of the Supremes?", a: "Diana Ross", d: ["Gladys Knight", "Martha Reeves", "Mary Wells"] },
    { c: L, t: 3, q: "Which 1960s vocal group recorded 'California Dreamin'' and 'Monday, Monday'?", a: "The Mamas and the Papas", d: ["The Byrds", "The Turtles", "The Lovin' Spoonful"] },
    { c: L, t: 4, q: "Which Adolphe Adam ballet follows a peasant girl who returns from the grave among the ghostly Wilis?", a: "Giselle", d: ["La Sylphide", "Coppélia", "La Bayadère"] },
    { c: L, t: 5, q: "Which pianist composed the ballad 'Misty' in 1954?", a: "Erroll Garner", d: ["Oscar Peterson", "George Shearing", "Dave Brubeck"] },
  ],
  // day 18
  [
    { c: L, t: 1, q: "Which rock band performed in black-and-white face paint, with Gene Simmons as 'The Demon'?", a: "Kiss", d: ["Alice Cooper", "Twisted Sister", "Mötley Crüe"] },
    { c: L, t: 2, q: "Which symbol raises a note by a half step?", a: "The sharp", d: ["The flat", "The natural", "The rest"] },
    { c: L, t: 3, q: "Which 1910 Stravinsky ballet for Diaghilev first made the composer famous in Paris?", a: "The Firebird", d: ["Petrushka", "The Rite of Spring", "Pulcinella"] },
    { c: L, t: 4, q: "Which 1977 Bob Marley album includes 'Jamming' and 'Three Little Birds'?", a: "Exodus", d: ["Kaya", "Natty Dread", "Uprising"] },
    { c: L, t: 5, q: "Which Richard Strauss opera turns on the ceremonial presentation of a silver rose?", a: "Der Rosenkavalier", d: ["Arabella", "Capriccio", "Elektra"] },
  ],
  // day 19
  [
    { c: L, t: 1, q: "Which Manchester band recorded the song 'Wonderwall'?", a: "Oasis", d: ["Blur", "Pulp", "The Verve"] },
    { c: L, t: 2, q: "Which composer wrote 'The Blue Danube' waltz?", a: "Johann Strauss II", d: ["Johann Strauss I", "Franz Lehár", "Josef Lanner"] },
    { c: L, t: 3, q: "Which bespectacled Texas rocker died in the 1959 plane crash remembered as 'The Day the Music Died'?", a: "Buddy Holly", d: ["Eddie Cochran", "Gene Vincent", "Bobby Darin"] },
    { c: L, t: 4, q: "Which Soviet composer's Seventh Symphony is named for the besieged city of Leningrad?", a: "Dmitri Shostakovich", d: ["Sergei Prokofiev", "Aram Khachaturian", "Alfred Schnittke"] },
    { c: L, t: 5, q: "Which near-blind pianist of the 1930s and 1940s dazzled fellow musicians with his speed and harmonic invention?", a: "Art Tatum", d: ["Fats Waller", "Earl Hines", "Teddy Wilson"] },
  ],
  // day 20
  [
    { c: L, t: 1, q: "Which singer often performed wearing a single sequined white glove?", a: "Michael Jackson", d: ["Prince", "Stevie Wonder", "Lionel Richie"] },
    { c: L, t: 2, q: "In 4/4 time, how many beats does a whole note last?", a: "Four", d: ["Two", "Three", "Eight"] },
    { c: L, t: 3, q: "Which George Gershwin opera is set in Catfish Row in Charleston?", a: "Porgy and Bess", d: ["Show Boat", "Treemonisha", "Four Saints in Three Acts"] },
    { c: L, t: 4, q: "Which 1967 California festival featured breakout sets by Otis Redding and Janis Joplin?", a: "Monterey Pop Festival", d: ["Woodstock", "Newport Folk Festival", "Isle of Wight Festival"] },
    { c: L, t: 5, q: "Which Handel opera opens with the aria 'Ombra mai fù', sung to a plane tree?", a: "Serse", d: ["Giulio Cesare", "Rinaldo", "Alcina"] },
  ],
  // day 21
  [
    { c: L, t: 1, q: "Which British singer released the 2015 ballad 'Hello'?", a: "Adele", d: ["Amy Winehouse", "Duffy", "Florence Welch"] },
    { c: L, t: 2, q: "Which band recorded the 1981 hit 'Don't Stop Believin''?", a: "Journey", d: ["Boston", "Foreigner", "REO Speedwagon"] },
    { c: L, t: 3, q: "Which French composer wrote 'Prelude to the Afternoon of a Faun'?", a: "Claude Debussy", d: ["Maurice Ravel", "Gabriel Fauré", "Paul Dukas"] },
    { c: L, t: 4, q: "Which Doors keyboardist covered the band's bass lines on a keyboard bass?", a: "Ray Manzarek", d: ["Rick Wakeman", "Jon Lord", "Garth Hudson"] },
    { c: L, t: 5, q: "Which Jamaican producer ran the Black Ark studio in Kingston?", a: "Lee 'Scratch' Perry", d: ["King Tubby", "Coxsone Dodd", "Duke Reid"] },
  ],
  // day 22
  [
    { c: L, t: 1, q: "Which disco group recorded 'Y.M.C.A.' in 1978?", a: "Village People", d: ["Chic", "KC and the Sunshine Band", "The Trammps"] },
    { c: L, t: 2, q: "Which double-reed instrument plays the bass voice of the woodwind section?", a: "Bassoon", d: ["Clarinet", "Oboe", "Saxophone"] },
    { c: L, t: 3, q: "Which Gilbert and Sullivan operetta is set in the Japanese town of Titipu?", a: "The Mikado", d: ["HMS Pinafore", "Iolanthe", "The Gondoliers"] },
    { c: L, t: 4, q: "Which Aaron Copland ballet includes the famous 'Hoe-Down'?", a: "Rodeo", d: ["Billy the Kid", "Appalachian Spring", "Fancy Free"] },
    { c: L, t: 5, q: "Which Memphis soul label took its name from its founders, Jim Stewart and Estelle Axton?", a: "Stax Records", d: ["Hi Records", "Volt Records", "Goldwax Records"] },
  ],
  // day 23
  [
    { c: L, t: 1, q: "Which Canadian singer recorded 'My Heart Will Go On' in 1997?", a: "Céline Dion", d: ["Shania Twain", "Alanis Morissette", "Sarah McLachlan"] },
    { c: L, t: 2, q: "Which composer wrote the piano piece known as the 'Minute Waltz'?", a: "Frédéric Chopin", d: ["Franz Liszt", "Robert Schumann", "Johannes Brahms"] },
    { c: L, t: 3, q: "Which Seattle band was fronted by Chris Cornell?", a: "Soundgarden", d: ["Pearl Jam", "Alice in Chains", "Mudhoney"] },
    { c: L, t: 4, q: "Which Stravinsky ballet follows a puppet who comes to life at a Shrovetide fair?", a: "Petrushka", d: ["Pulcinella", "Apollo", "The Firebird"] },
    { c: L, t: 5, q: "Which harmonica player recorded the 1952 instrumental hit 'Juke'?", a: "Little Walter", d: ["Sonny Boy Williamson II", "James Cotton", "Junior Wells"] },
  ],
  // day 24
  [
    { c: L, t: 1, q: "Which brass instrument is jazz and classical star Wynton Marsalis known for playing?", a: "Trumpet", d: ["Trombone", "Tuba", "French horn"] },
    { c: L, t: 2, q: "Which musical features the song 'Don't Cry for Me Argentina'?", a: "Evita", d: ["Cats", "Sunset Boulevard", "Aspects of Love"] },
    { c: L, t: 3, q: "Which Beatles album includes 'Here Comes the Sun' and 'Something'?", a: "Abbey Road", d: ["Let It Be", "Revolver", "Rubber Soul"] },
    { c: L, t: 4, q: "Which Mendelssohn concert overture was inspired by a visit to Fingal's Cave?", a: "The Hebrides", d: ["Calm Sea and Prosperous Voyage", "Ruy Blas", "The Fair Melusine"] },
    { c: L, t: 5, q: "Which Monteverdi opera of 1607 is often called the first great work of the form?", a: "L'Orfeo", d: ["L'incoronazione di Poppea", "Il ritorno d'Ulisse in patria", "Arianna"] },
  ],
  // day 25
  [
    { c: L, t: 1, q: "Which band recorded the 1987 hit 'Sweet Child o' Mine'?", a: "Guns N' Roses", d: ["Bon Jovi", "Def Leppard", "Mötley Crüe"] },
    { c: L, t: 2, q: "What is the usual time signature of a waltz?", a: "3/4", d: ["4/4", "2/4", "6/8"] },
    { c: L, t: 3, q: "Which German composer wrote the cantata 'Carmina Burana'?", a: "Carl Orff", d: ["Kurt Weill", "Paul Hindemith", "Richard Strauss"] },
    { c: L, t: 4, q: "Which singer was billed as the 'Mother of the Blues'?", a: "Ma Rainey", d: ["Bessie Smith", "Mamie Smith", "Alberta Hunter"] },
    { c: L, t: 5, q: "What is the craft of combining independent melodic lines, codified in Fux's 1725 treatise 'Gradus ad Parnassum'?", a: "Counterpoint", d: ["Orchestration", "Figured bass", "Serialism"] },
  ],
  // day 26
  [
    { c: L, t: 1, q: "How many strings does a standard bass guitar have?", a: "Four", d: ["Five", "Six", "Three"] },
    { c: L, t: 2, q: "Which British singer was born Reginald Dwight?", a: "Elton John", d: ["Rod Stewart", "Cliff Richard", "Tom Jones"] },
    { c: L, t: 3, q: "Which Tchaikovsky ballet features Princess Aurora?", a: "The Sleeping Beauty", d: ["Swan Lake", "The Nutcracker", "Giselle"] },
    { c: L, t: 4, q: "Which Radiohead album of 2000 followed 'OK Computer' with a turn to electronic textures?", a: "Kid A", d: ["Amnesiac", "Hail to the Thief", "The Bends"] },
    { c: L, t: 5, q: "Which blues guitarist's 1961 instrumental 'Hide Away' became a staple for British players such as Eric Clapton?", a: "Freddie King", d: ["Albert King", "Otis Rush", "Magic Sam"] },
  ],
  // day 27
  [
    { c: L, t: 1, q: "Which band recorded 'Good Vibrations' in 1966?", a: "The Beach Boys", d: ["The Byrds", "The Monkees", "The Turtles"] },
    { c: L, t: 2, q: "Which Baroque composer is best known for his 'Canon in D'?", a: "Johann Pachelbel", d: ["Antonio Vivaldi", "Arcangelo Corelli", "Henry Purcell"] },
    { c: L, t: 3, q: "Which trumpeter led the 1920s 'Hot Five' and 'Hot Seven' recording groups?", a: "Louis Armstrong", d: ["King Oliver", "Bix Beiderbecke", "Bunk Johnson"] },
    { c: L, t: 4, q: "Which Rodgers and Hammerstein musical features 'You'll Never Walk Alone'?", a: "Carousel", d: ["South Pacific", "Oklahoma!", "Allegro"] },
    { c: L, t: 5, q: "Which Spanish composer wrote the four-book piano suite 'Iberia'?", a: "Isaac Albéniz", d: ["Enrique Granados", "Manuel de Falla", "Joaquín Turina"] },
  ],
  // day 28
  [
    { c: L, t: 1, q: "Which hip hop duo had a worldwide hit with 'Hey Ya!' in 2003?", a: "OutKast", d: ["The Black Eyed Peas", "Gnarls Barkley", "N.E.R.D"] },
    { c: L, t: 2, q: "Which pop star was born Stefani Germanotta?", a: "Lady Gaga", d: ["Gwen Stefani", "Katy Perry", "Pink"] },
    { c: L, t: 3, q: "Which American composer wrote the 'Adagio for Strings'?", a: "Samuel Barber", d: ["Aaron Copland", "Charles Ives", "William Schuman"] },
    { c: L, t: 4, q: "Which Delibes ballet centers on a life-sized mechanical doll?", a: "Coppélia", d: ["Sylvia", "Giselle", "La Sylphide"] },
    { c: L, t: 5, q: "Which Austrian composer and organist revised his huge symphonies so often that many exist in several versions?", a: "Anton Bruckner", d: ["Gustav Mahler", "Hugo Wolf", "Franz Schmidt"] },
  ],
  // day 29
  [
    { c: L, t: 1, q: "Which 1982 Michael Jackson album contains 'Billie Jean' and 'Beat It'?", a: "Thriller", d: ["Bad", "Off the Wall", "Dangerous"] },
    { c: L, t: 2, q: "Which country star wrote 'I Will Always Love You' years before it became a pop smash?", a: "Dolly Parton", d: ["Loretta Lynn", "Tammy Wynette", "Emmylou Harris"] },
    { c: L, t: 3, q: "Which composer married the pianist Clara Wieck in 1840?", a: "Robert Schumann", d: ["Johannes Brahms", "Felix Mendelssohn", "Franz Liszt"] },
    { c: L, t: 4, q: "Mozart's works are numbered in a catalog compiled by which scholar?", a: "Ludwig von Köchel", d: ["Otto Erich Deutsch", "Anthony van Hoboken", "Wolfgang Schmieder"] },
    { c: L, t: 5, q: "Which singer was nicknamed 'The Velvet Fog'?", a: "Mel Tormé", d: ["Nat King Cole", "Perry Como", "Bing Crosby"] },
  ],
  // day 30
  [
    { c: L, t: 1, q: "Which rapper's alter ego is 'Slim Shady'?", a: "Eminem", d: ["50 Cent", "Jay-Z", "Snoop Dogg"] },
    { c: L, t: 2, q: "Which band did Sting front before his solo career?", a: "The Police", d: ["The Clash", "The Jam", "Duran Duran"] },
    { c: L, t: 3, q: "Which American composer wrote 'Fanfare for the Common Man'?", a: "Aaron Copland", d: ["Leonard Bernstein", "Samuel Barber", "Virgil Thomson"] },
    { c: L, t: 4, q: "Which composer's Eighth Symphony, with its huge choral forces, is nicknamed the 'Symphony of a Thousand'?", a: "Gustav Mahler", d: ["Anton Bruckner", "Richard Strauss", "Hector Berlioz"] },
    { c: L, t: 5, q: "Which jazz label's album covers were famously designed by Reid Miles?", a: "Blue Note", d: ["Prestige", "Impulse!", "Verve"] },
  ],
  // day 31
  [
    { c: L, t: 1, q: "Which Colombian singer had a 2006 hit with 'Hips Don't Lie'?", a: "Shakira", d: ["Jennifer Lopez", "Gloria Estefan", "Thalía"] },
    { c: L, t: 2, q: "Which Cuban-born singer was crowned the 'Queen of Salsa'?", a: "Celia Cruz", d: ["Gloria Estefan", "La Lupe", "Olga Guillot"] },
    { c: L, t: 3, q: "Which composer's 1952 piece asks the performer to play nothing at all for its full length?", a: "John Cage", d: ["Morton Feldman", "Steve Reich", "Terry Riley"] },
    { c: L, t: 4, q: "Which rock musical, which reached Broadway in 1968, is subtitled 'The American Tribal Love-Rock Musical'?", a: "Hair", d: ["Godspell", "Jesus Christ Superstar", "Pippin"] },
    { c: L, t: 5, q: "Which English Tudor composer wrote the motet 'Spem in alium' for forty voices?", a: "Thomas Tallis", d: ["William Byrd", "John Taverner", "Orlando Gibbons"] },
  ],
  // day 32
  [
    { c: L, t: 1, q: "What is the main tune of a piece of music called?", a: "The melody", d: ["The harmony", "The rhythm", "The timbre"] },
    { c: L, t: 2, q: "Which rap trio was made up of Ad-Rock, MCA and Mike D?", a: "Beastie Boys", d: ["Run-DMC", "De La Soul", "Cypress Hill"] },
    { c: L, t: 3, q: "Which composer wrote 'Rhapsody on a Theme of Paganini'?", a: "Sergei Rachmaninoff", d: ["Franz Liszt", "Johannes Brahms", "Sergei Prokofiev"] },
    { c: L, t: 4, q: "Which Spanish guitarist did more than anyone to establish the guitar as a classical concert instrument?", a: "Andrés Segovia", d: ["Francisco Tárrega", "Narciso Yepes", "Paco de Lucía"] },
    { c: L, t: 5, q: "Which Detroit house band played on most of Motown's 1960s hits?", a: "The Funk Brothers", d: ["The Wrecking Crew", "The Swampers", "Booker T. and the M.G.'s"] },
  ],
  // day 33
  [
    { c: L, t: 1, q: "In which city are the Abbey Road Studios?", a: "London", d: ["Liverpool", "Manchester", "Dublin"] },
    { c: L, t: 2, q: "Which 2011 Broadway musical by the creators of 'South Park' follows two young missionaries sent to Uganda?", a: "The Book of Mormon", d: ["Avenue Q", "Spamalot", "Urinetown"] },
    { c: L, t: 3, q: "Which composer wrote the 'Hungarian Dances' for piano four hands?", a: "Johannes Brahms", d: ["Franz Liszt", "Zoltán Kodály", "Antonín Dvořák"] },
    { c: L, t: 4, q: "Which composer wrote the operetta 'The Merry Widow'?", a: "Franz Lehár", d: ["Johann Strauss II", "Emmerich Kálmán", "Franz von Suppé"] },
    { c: L, t: 5, q: "Which Detroit techno pioneer also recorded under the name Model 500?", a: "Juan Atkins", d: ["Derrick May", "Kevin Saunderson", "Jeff Mills"] },
  ],
  // day 34
  [
    { c: L, t: 1, q: "Which composer was a child prodigy, born in Salzburg in 1756?", a: "Wolfgang Amadeus Mozart", d: ["Joseph Haydn", "Ludwig van Beethoven", "Franz Schubert"] },
    { c: L, t: 2, q: "Which band released the 2000 debut album 'Hybrid Theory'?", a: "Linkin Park", d: ["Limp Bizkit", "Korn", "Papa Roach"] },
    { c: L, t: 3, q: "Which electronic instrument is played by moving the hands near two antennas without touching it?", a: "Theremin", d: ["Moog synthesizer", "Ondes Martenot", "Mellotron"] },
    { c: L, t: 4, q: "Which Bellini opera contains the aria 'Casta diva'?", a: "Norma", d: ["La sonnambula", "I puritani", "Il pirata"] },
    { c: L, t: 5, q: "Which English composer wrote the tune later used for 'The Star-Spangled Banner'?", a: "John Stafford Smith", d: ["William Boyce", "Thomas Arne", "Charles Dibdin"] },
  ],
  // day 35
  [
    { c: L, t: 1, q: "Which boy band recorded 'I Want It That Way' in 1999?", a: "Backstreet Boys", d: ["NSYNC", "98 Degrees", "Boyzone"] },
    { c: L, t: 2, q: "How many different notes make up a major scale before the starting note repeats?", a: "Seven", d: ["Five", "Eight", "Twelve"] },
    { c: L, t: 3, q: "Which Irish singer tore up a photo of Pope John Paul II on 'Saturday Night Live' in 1992?", a: "Sinéad O'Connor", d: ["Dolores O'Riordan", "Enya", "Mary Black"] },
    { c: L, t: 4, q: "Which composer wrote 'Orpheus in the Underworld', whose galop became the tune of the can-can?", a: "Jacques Offenbach", d: ["Jules Massenet", "Charles Gounod", "Léo Delibes"] },
    { c: L, t: 5, q: "Which composer set William Blake's 'Jerusalem' to music in 1916?", a: "Hubert Parry", d: ["Edward Elgar", "Gustav Holst", "Charles Villiers Stanford"] },
  ],
  // day 36
  [
    { c: L, t: 1, q: "Which singer released '...Baby One More Time' in 1998?", a: "Britney Spears", d: ["Christina Aguilera", "Jessica Simpson", "Mandy Moore"] },
    { c: L, t: 2, q: "In the do-re-mi scale, which syllable comes right after 'mi'?", a: "Fa", d: ["Sol", "Re", "La"] },
    { c: L, t: 3, q: "With which group did Lauryn Hill first find fame?", a: "The Fugees", d: ["TLC", "Salt-N-Pepa", "En Vogue"] },
    { c: L, t: 4, q: "Which English composer wrote 'The Lark Ascending' for violin and orchestra?", a: "Ralph Vaughan Williams", d: ["Edward Elgar", "Frederick Delius", "Gustav Holst"] },
    { c: L, t: 5, q: "Which Jerry Herman musical is set in a Saint-Tropez drag nightclub?", a: "La Cage aux Folles", d: ["Mame", "Mack and Mabel", "Dear World"] },
  ],
  // day 37
  [
    { c: L, t: 1, q: "Which country is the home of K-pop?", a: "South Korea", d: ["Japan", "China", "Taiwan"] },
    { c: L, t: 2, q: "Which band's synthesizer-driven 'Jump' appeared on its album titled '1984'?", a: "Van Halen", d: ["Journey", "Def Leppard", "Foreigner"] },
    { c: L, t: 3, q: "What does the marking 'pizzicato' tell string players to do?", a: "Pluck the strings", d: ["Bow near the bridge", "Play with the wood of the bow", "Mute the strings"] },
    { c: L, t: 4, q: "Which French composer wrote 'The Sorcerer's Apprentice' in 1897?", a: "Paul Dukas", d: ["Camille Saint-Saëns", "Emmanuel Chabrier", "Georges Bizet"] },
    { c: L, t: 5, q: "Which Baroque composer wrote some 555 keyboard sonatas, many while serving at the Spanish court?", a: "Domenico Scarlatti", d: ["Antonio Soler", "François Couperin", "Jean-Philippe Rameau"] },
  ],
  // day 38
  [
    { c: L, t: 1, q: "Which Puerto Rican singer had a 1999 hit with 'Livin' la Vida Loca'?", a: "Ricky Martin", d: ["Marc Anthony", "Enrique Iglesias", "Chayanne"] },
    { c: L, t: 2, q: "Which Southern rock band recorded the 1973 epic 'Free Bird'?", a: "Lynyrd Skynyrd", d: ["The Allman Brothers Band", "ZZ Top", "The Marshall Tucker Band"] },
    { c: L, t: 3, q: "What is the term for the notes of a chord played one after another instead of together?", a: "Arpeggio", d: ["Ostinato", "Glissando", "Tremolo"] },
    { c: L, t: 4, q: "In a concerto, what is the cadenza?", a: "A showy passage for the soloist alone", d: ["The opening orchestral fanfare", "The slow middle movement", "The closing chorus"] },
    { c: L, t: 5, q: "Which Khachaturian ballet contains the famous 'Sabre Dance'?", a: "Gayane", d: ["Spartacus", "Masquerade", "The Red Poppy"] },
  ],
  // day 39
  [
    { c: L, t: 1, q: "Which instrument did jazz composer Thelonious Monk play?", a: "Piano", d: ["Saxophone", "Trumpet", "Vibraphone"] },
    { c: L, t: 2, q: "Which singer led the band the Heartbreakers?", a: "Tom Petty", d: ["Bob Seger", "John Mellencamp", "Bruce Springsteen"] },
    { c: L, t: 3, q: "Which K-pop group in 2018 became the first Korean act to top the Billboard 200 album chart?", a: "BTS", d: ["Blackpink", "EXO", "Big Bang"] },
    { c: L, t: 4, q: "Which composer wrote the opera 'Eugene Onegin'?", a: "Pyotr Ilyich Tchaikovsky", d: ["Mikhail Glinka", "Modest Mussorgsky", "Sergei Rachmaninoff"] },
    { c: L, t: 5, q: "Which family of Cremona violin makers included Giuseppe 'del Gesù'?", a: "Guarneri", d: ["Amati", "Stradivari", "Ruggieri"] },
  ],
  // day 40
  [
    { c: L, t: 1, q: "What is an extra piece played at the end of a concert in answer to the audience's applause called?", a: "An encore", d: ["An overture", "An interlude", "A reprise"] },
    { c: L, t: 2, q: "Which band recorded the 1972 song 'Smoke on the Water'?", a: "Deep Purple", d: ["Led Zeppelin", "Black Sabbath", "Uriah Heep"] },
    { c: L, t: 3, q: "Which 2016 David Bowie album came out two days before his death?", a: "Blackstar", d: ["Heathen", "Reality", "The Next Day"] },
    { c: L, t: 4, q: "In classical music, what is a rondo?", a: "A form where a main theme keeps returning", d: ["A slow dance in triple time", "A piece for two pianos", "A set of linked songs"] },
    { c: L, t: 5, q: "Which ragtime composer wrote the opera 'Treemonisha'?", a: "Scott Joplin", d: ["James Scott", "Joseph Lamb", "Eubie Blake"] },
  ],
  // day 41
  [
    { c: L, t: 1, q: "What is a person who writes music called?", a: "A composer", d: ["A conductor", "A critic", "A copyist"] },
    { c: L, t: 2, q: "Which Norwegian band had a 1985 hit with 'Take On Me'?", a: "a-ha", d: ["Europe", "Roxette", "Duran Duran"] },
    { c: L, t: 3, q: "What does a fermata over a note tell the performer to do?", a: "Hold it longer than written", d: ["Repeat the bar", "Play it more quietly", "Speed up gradually"] },
    { c: L, t: 4, q: "Which Wagner opera ends with the 'Liebestod'?", a: "Tristan und Isolde", d: ["Parsifal", "Lohengrin", "Tannhäuser"] },
    { c: L, t: 5, q: "Which composer wrote the music for the stage musical 'Les Misérables'?", a: "Claude-Michel Schönberg", d: ["Alain Boublil", "Michel Legrand", "Charles Aznavour"] },
  ],
  // day 42
  [
    { c: L, t: 1, q: "Which band was fronted by Steven Tyler?", a: "Aerosmith", d: ["Kiss", "Journey", "Van Halen"] },
    { c: L, t: 2, q: "Which band had a 1982 hit with 'Africa'?", a: "Toto", d: ["Foreigner", "Chicago", "Styx"] },
    { c: L, t: 3, q: "Which Wagner opera tells of a cursed sea captain doomed to sail until he finds a faithful love?", a: "The Flying Dutchman", d: ["Lohengrin", "Tannhäuser", "Parsifal"] },
    { c: L, t: 4, q: "Which key is the relative of C major, using the same notes but centered on a different tonic?", a: "A minor", d: ["E minor", "D minor", "C minor"] },
    { c: L, t: 5, q: "Which composer wrote the melody now used for Germany's national anthem, first written as a hymn for Emperor Francis II?", a: "Joseph Haydn", d: ["Ludwig van Beethoven", "Wolfgang Amadeus Mozart", "Carl Maria von Weber"] },
  ],
  // day 43
  [
    { c: L, t: 1, q: "Which section has the most players in a standard symphony orchestra?", a: "The strings", d: ["The woodwinds", "The brass", "The percussion"] },
    { c: L, t: 2, q: "Which Kander and Ebb musical follows the murderesses Roxie Hart and Velma Kelly?", a: "Chicago", d: ["Cabaret", "Kiss of the Spider Woman", "Sweet Charity"] },
    { c: L, t: 3, q: "What is the name for a male voice that sings in the alto range, often heard in Baroque music?", a: "Countertenor", d: ["Baritone", "Basso profundo", "Bass-baritone"] },
    { c: L, t: 4, q: "Which Bavarian town holds an annual festival of Wagner's operas in a theater he designed?", a: "Bayreuth", d: ["Salzburg", "Munich", "Leipzig"] },
    { c: L, t: 5, q: "Which composer wrote the music for 'Lift Every Voice and Sing', often called the Black national anthem?", a: "J. Rosamond Johnson", d: ["Harry T. Burleigh", "Will Marion Cook", "James Reese Europe"] },
  ],
  // day 44
  [
    { c: L, t: 1, q: "Which 1987 Michael Jackson album was the follow-up to 'Thriller'?", a: "Bad", d: ["Dangerous", "Off the Wall", "HIStory"] },
    { c: L, t: 2, q: "Which former Nirvana drummer founded the Foo Fighters?", a: "Dave Grohl", d: ["Taylor Hawkins", "Chad Smith", "Matt Cameron"] },
    { c: L, t: 3, q: "Which composer, called the 'Father of the Blues', published 'St. Louis Blues' in 1914?", a: "W.C. Handy", d: ["Jelly Roll Morton", "Scott Joplin", "Lead Belly"] },
    { c: L, t: 4, q: "Which bebop trumpeter was famous for his bent-upward horn and puffed-out cheeks?", a: "Dizzy Gillespie", d: ["Miles Davis", "Clifford Brown", "Fats Navarro"] },
    { c: L, t: 5, q: "Which Bizet opera, set in ancient Ceylon, contains a celebrated duet for tenor and baritone?", a: "The Pearl Fishers", d: ["Djamileh", "Don Procopio", "La jolie fille de Perth"] },
  ],
  // day 45
  [
    { c: L, t: 1, q: "Which instrument is smooth-jazz star Kenny G known for playing?", a: "Saxophone", d: ["Trumpet", "Clarinet", "Flute"] },
    { c: L, t: 2, q: "Which singer released the 1975 album 'Born to Run'?", a: "Bruce Springsteen", d: ["Bob Seger", "Tom Petty", "Billy Joel"] },
    { c: L, t: 3, q: "Which Neapolitan tenor became the first great star of the record industry in the early 1900s?", a: "Enrico Caruso", d: ["Beniamino Gigli", "Tito Schipa", "Giovanni Martinelli"] },
    { c: L, t: 4, q: "Which composer wrote the anthem 'Zadok the Priest' for a British coronation in 1727?", a: "George Frideric Handel", d: ["Henry Purcell", "William Boyce", "Thomas Arne"] },
    { c: L, t: 5, q: "The Rolling Stones recorded much of 'Exile on Main St.' in the basement of a villa in which country?", a: "France", d: ["Italy", "Spain", "Switzerland"] },
  ],
  // day 46
  [
    { c: L, t: 1, q: "Which singer recorded 'Single Ladies (Put a Ring on It)' in 2008?", a: "Beyoncé", d: ["Rihanna", "Alicia Keys", "Ciara"] },
    { c: L, t: 2, q: "Which singer was hailed as the 'Queen of Rock and Roll'?", a: "Tina Turner", d: ["Janis Joplin", "Pat Benatar", "Joan Jett"] },
    { c: L, t: 3, q: "Which singer was born Farrokh Bulsara?", a: "Freddie Mercury", d: ["Brian May", "Roger Taylor", "John Deacon"] },
    { c: L, t: 4, q: "Which Leoncavallo opera centers on a jealous clown named Canio?", a: "Pagliacci", d: ["Cavalleria rusticana", "Tosca", "Andrea Chénier"] },
    { c: L, t: 5, q: "Which composer, born to a Hungarian family in Transylvania, wrote the opera 'Le Grand Macabre'?", a: "György Ligeti", d: ["György Kurtág", "Péter Eötvös", "Béla Bartók"] },
  ],
  // day 47
  [
    { c: L, t: 1, q: "Which Canadian rapper released 'Hotline Bling' in 2015?", a: "Drake", d: ["The Weeknd", "Kanye West", "J. Cole"] },
    { c: L, t: 2, q: "Which musical follows Tracy Turnblad's fight to dance on a TV show in 1962 Baltimore?", a: "Hairspray", d: ["Grease", "Bye Bye Birdie", "Footloose"] },
    { c: L, t: 3, q: "Which Led Zeppelin drummer's death in 1980 led the band to break up?", a: "John Bonham", d: ["Keith Moon", "Ginger Baker", "Mitch Mitchell"] },
    { c: L, t: 4, q: "Which singer was nicknamed 'the Big O'?", a: "Roy Orbison", d: ["Del Shannon", "Gene Pitney", "Ricky Nelson"] },
    { c: L, t: 5, q: "Which Dvořák opera contains the 'Song to the Moon'?", a: "Rusalka", d: ["The Jacobin", "Armida", "The Devil and Kate"] },
  ],
  // day 48
  [
    { c: L, t: 1, q: "Which British band released the 2000 single 'Yellow'?", a: "Coldplay", d: ["Travis", "Keane", "Muse"] },
    { c: L, t: 2, q: "Who wrote the music for 'The Sound of Music'?", a: "Richard Rodgers", d: ["Frederick Loewe", "Jerome Kern", "Irving Berlin"] },
    { c: L, t: 3, q: "Which composer's 'Surprise' Symphony jolts listeners with a sudden loud chord in its slow movement?", a: "Joseph Haydn", d: ["Wolfgang Amadeus Mozart", "Carl Philipp Emanuel Bach", "Luigi Boccherini"] },
    { c: L, t: 4, q: "Which Stephen Sondheim musical was inspired by a Georges Seurat painting?", a: "Sunday in the Park with George", d: ["A Little Night Music", "Pacific Overtures", "Merrily We Roll Along"] },
    { c: L, t: 5, q: "In piano music, what does the marking 'una corda' tell the player to use?", a: "The soft pedal", d: ["The sustain pedal", "The sostenuto pedal", "A single finger"] },
  ],
  // Days 49-79, live 2026-12-01 to 2026-12-31 (appended 2026-11-06).
  [
    { c: "Music", t: 1, q: "Who sang 'Over the Rainbow' as Dorothy in The Wizard of Oz (1939)?", a: "Judy Garland", d: ["Shirley Temple", "Deanna Durbin", "Ginger Rogers"] },
    { c: "Music", t: 2, q: "In Puccini's Turandot, what is 'Nessun dorma'?", a: "An aria", d: ["A duet", "A chorus", "An overture"] },
    { c: "Music", t: 3, q: "Which violinist-composer wrote the 24 Caprices for solo violin?", a: "Niccolo Paganini", d: ["Giuseppe Tartini", "Arcangelo Corelli", "Pietro Locatelli"] },
    { c: "Music", t: 4, q: "Which Mozart opera features Leporello's 'Catalogue Aria', listing his master's conquests?", a: "Don Giovanni", d: ["The Marriage of Figaro", "Idomeneo", "La clemenza di Tito"] },
    { c: "Music", t: 5, q: "Which Brazilian composer wrote a series of 'Choros' and played cello in Rio cinemas as a young man?", a: "Heitor Villa-Lobos", d: ["Camargo Guarnieri", "Francisco Mignone", "Ernesto Nazareth"] },
  ],
  [
    { c: "Music", t: 1, q: "Which woodwind instrument has a smaller, higher cousin called the piccolo?", a: "The flute", d: ["The oboe", "The clarinet", "The recorder"] },
    { c: "Music", t: 2, q: "Which Brazilian style, played on cuica and surdo drums, had its first recorded hit with 'Pelo Telefone' (1917)?", a: "Samba", d: ["Bossa nova", "Forro", "Cumbia"] },
    { c: "Music", t: 3, q: "Which Italian term tells players to grow gradually faster?", a: "Accelerando", d: ["Ritenuto", "Allargando", "Rubato"] },
    { c: "Music", t: 4, q: "Which bandoneon player wrote 'Adios Nonino' in memory of his father?", a: "Astor Piazzolla", d: ["Carlos Gardel", "Anibal Troilo", "Osvaldo Pugliese"] },
    { c: "Music", t: 5, q: "Which Estonian composer wrote 'Fratres' (1977) and 'Tabula Rasa'?", a: "Arvo Part", d: ["Veljo Tormis", "Erkki-Sven Tuur", "Peteris Vasks"] },
  ],
  [
    { c: "Music", t: 1, q: "What is the male singing voice between tenor and bass called?", a: "Baritone", d: ["Alto", "Soprano", "Countertenor"] },
    { c: "Music", t: 2, q: "Which band did Stevie Nicks and Lindsey Buckingham join in 1975?", a: "Fleetwood Mac", d: ["Heart", "Supertramp", "Electric Light Orchestra"] },
    { c: "Music", t: 3, q: "Which Rodgers and Hammerstein musical, set on a Pacific island in World War II, includes 'Bali Ha'i'?", a: "South Pacific", d: ["Carousel", "The King and I", "Oklahoma!"] },
    { c: "Music", t: 4, q: "Which Verdi opera centers on a hunchbacked court jester and his daughter Gilda?", a: "Rigoletto", d: ["La forza del destino", "Un ballo in maschera", "Luisa Miller"] },
    { c: "Music", t: 5, q: "Which American composer's 'Three Places in New England' quotes marching bands and hymns?", a: "Charles Ives", d: ["Carl Ruggles", "Henry Cowell", "Edward MacDowell"] },
  ],
  [
    { c: "Music", t: 1, q: "What do you call a traditional Mexican band of trumpets, violins and guitars, often dressed in charro suits?", a: "Mariachi", d: ["Banda", "Norteno", "Zydeco"] },
    { c: "Music", t: 2, q: "Which composer wrote the orchestral piece 'An American in Paris' (1928)?", a: "George Gershwin", d: ["Cole Porter", "Irving Berlin", "Jerome Kern"] },
    { c: "Music", t: 3, q: "Which French singer, nicknamed the Little Sparrow, made 'La Vie en rose' famous?", a: "Edith Piaf", d: ["Juliette Greco", "Barbara", "Dalida"] },
    { c: "Music", t: 4, q: "Which Brazilian composer wrote 'Desafinado' and 'Waters of March'?", a: "Antonio Carlos Jobim", d: ["Joao Gilberto", "Luiz Bonfa", "Baden Powell"] },
    { c: "Music", t: 5, q: "Which composer, organist of Westminster Abbey, wrote music for Queen Mary II's funeral in 1695?", a: "Henry Purcell", d: ["John Blow", "Matthew Locke", "William Boyce"] },
  ],
  [
    { c: "Music", t: 1, q: "With which US state is the ukulele most closely associated?", a: "Hawaii", d: ["California", "Louisiana", "Tennessee"] },
    { c: "Music", t: 2, q: "Which Seattle band recorded the songs 'Alive' and 'Jeremy'?", a: "Pearl Jam", d: ["Alice in Chains", "Stone Temple Pilots", "Mudhoney"] },
    { c: "Music", t: 3, q: "Which composer appeared on Finland's last 100-markka banknote?", a: "Jean Sibelius", d: ["Carl Nielsen", "Einojuhani Rautavaara", "Toivo Kuula"] },
    { c: "Music", t: 4, q: "Which bluesman, known from only a few photographs, died in 1938 at the age of 27?", a: "Robert Johnson", d: ["Son House", "Charley Patton", "Tommy Johnson"] },
    { c: "Music", t: 5, q: "Which Japanese composer wrote 'November Steps' (1967) for biwa, shakuhachi and orchestra?", a: "Toru Takemitsu", d: ["Toshiro Mayuzumi", "Akira Ifukube", "Toshi Ichiyanagi"] },
  ],
  [
    { c: "Music", t: 1, q: "What is the round opening in the top of an acoustic guitar called?", a: "The sound hole", d: ["The bridge", "The fret", "The nut"] },
    { c: "Music", t: 2, q: "Which band lost its founding singer, Syd Barrett, in 1968?", a: "Pink Floyd", d: ["Genesis", "Yes", "King Crimson"] },
    { c: "Music", t: 3, q: "Which Swedish DJ and producer was born Tim Bergling?", a: "Avicii", d: ["Alesso", "Kygo", "Axwell"] },
    { c: "Music", t: 4, q: "Which French composer wrote 'Vexations', a short piece meant to be repeated 840 times?", a: "Erik Satie", d: ["Gabriel Faure", "Reynaldo Hahn", "Emmanuel Chabrier"] },
    { c: "Music", t: 5, q: "Which composer wrote 'The Musical Offering' on a theme given to him by Frederick the Great?", a: "Johann Sebastian Bach", d: ["Georg Philipp Telemann", "Carl Philipp Emanuel Bach", "Johann Joachim Quantz"] },
  ],
  [
    { c: "Music", t: 1, q: "Which stringed instrument with a round, drum-like body is a mainstay of bluegrass?", a: "The banjo", d: ["The mandolin", "The fiddle", "The dobro"] },
    { c: "Music", t: 2, q: "Which Motown singer recorded 'I Heard It Through the Grapevine' (1968) and 'Sexual Healing' (1982)?", a: "Marvin Gaye", d: ["Smokey Robinson", "Otis Redding", "Al Green"] },
    { c: "Music", t: 3, q: "Which singer was born Gordon Sumner?", a: "Sting", d: ["Seal", "Bono", "Peter Gabriel"] },
    { c: "Music", t: 4, q: "In which opera does Leonore rescue her husband Florestan from a political prison?", a: "Fidelio", d: ["Der Freischutz", "Euryanthe", "Oberon"] },
    { c: "Music", t: 5, q: "Which Spanish composer wrote the ballet 'El amor brujo', with its 'Ritual Fire Dance'?", a: "Manuel de Falla", d: ["Joaquin Turina", "Enrique Granados", "Federico Mompou"] },
  ],
  [
    { c: "Music", t: 1, q: "Which wind instrument of northern Australia is traditionally made from a branch hollowed out by termites?", a: "The didgeridoo", d: ["The bagpipe", "The alphorn", "The ocarina"] },
    { c: "Music", t: 2, q: "Which country singer was nicknamed the Man in Black?", a: "Johnny Cash", d: ["Merle Haggard", "Waylon Jennings", "George Jones"] },
    { c: "Music", t: 3, q: "Which record company was nicknamed Hitsville U.S.A. after its Detroit headquarters?", a: "Motown", d: ["Atlantic", "Chess", "Vee-Jay"] },
    { c: "Music", t: 4, q: "Which jazz bassist wrote the autobiography 'Beneath the Underdog' (1971)?", a: "Charles Mingus", d: ["Ray Brown", "Ron Carter", "Paul Chambers"] },
    { c: "Music", t: 5, q: "Which Mexican composer and conductor wrote 'Sinfonia india' (1935)?", a: "Carlos Chavez", d: ["Silvestre Revueltas", "Manuel Ponce", "Blas Galindo"] },
  ],
  [
    { c: "Music", t: 1, q: "In music, what does the marking forte tell a player to do?", a: "Play loudly", d: ["Play softly", "Play quickly", "Play smoothly"] },
    { c: "Music", t: 2, q: "On a drum kit, which pair of cymbals is clapped together with a foot pedal?", a: "The hi-hat", d: ["The ride cymbal", "The crash cymbal", "The china cymbal"] },
    { c: "Music", t: 3, q: "Which Atlanta trio released 'No Scrubs' and 'Waterfalls'?", a: "TLC", d: ["Xscape", "SWV", "En Vogue"] },
    { c: "Music", t: 4, q: "Which Egyptian singer, called the Star of the East, filled Cairo concert halls from the 1930s to the 1970s?", a: "Umm Kulthum", d: ["Fairuz", "Warda", "Asmahan"] },
    { c: "Music", t: 5, q: "Which composer wrote a Violin Concerto (1935) dedicated 'to the memory of an angel', Manon Gropius?", a: "Alban Berg", d: ["Anton Webern", "Hanns Eisler", "Egon Wellesz"] },
  ],
  [
    { c: "Music", t: 1, q: "Which dance did Al Pacino perform as a blind man in Scent of a Woman (1992)?", a: "The tango", d: ["The salsa", "The samba", "The rumba"] },
    { c: "Music", t: 2, q: "Which conductor led the New York Philharmonic's televised Young People's Concerts from 1958?", a: "Leonard Bernstein", d: ["Stephen Sondheim", "Frank Loesser", "Jule Styne"] },
    { c: "Music", t: 3, q: "Which Gilbert and Sullivan opera has a hero bound to pirates until his 21st birthday, which falls on February 29?", a: "The Pirates of Penzance", d: ["H.M.S. Pinafore", "Iolanthe", "The Gondoliers"] },
    { c: "Music", t: 4, q: "Which Jamaican singer wrote and recorded 'Many Rivers to Cross' (1969)?", a: "Jimmy Cliff", d: ["Toots Hibbert", "Desmond Dekker", "Peter Tosh"] },
    { c: "Music", t: 5, q: "Which French composer in 1913 became the first woman to win the Prix de Rome for composition?", a: "Lili Boulanger", d: ["Nadia Boulanger", "Germaine Tailleferre", "Cecile Chaminade"] },
  ],
  [
    { c: "Music", t: 1, q: "Who stands in front of an orchestra and directs the players?", a: "The conductor", d: ["The concertmaster", "The soloist", "The stage manager"] },
    { c: "Music", t: 2, q: "Which Andrew Lloyd Webber musical, set among the Jellicles, ran in London for 21 years from 1981?", a: "Cats", d: ["Evita", "Starlight Express", "Aspects of Love"] },
    { c: "Music", t: 3, q: "What do you call a chamber group of two violins, a viola and a cello?", a: "A string quartet", d: ["A piano trio", "A string quintet", "A wind quartet"] },
    { c: "Music", t: 4, q: "Which jazz drummer converted to Islam and took the name Abdullah Ibn Buhaina?", a: "Art Blakey", d: ["Max Roach", "Elvin Jones", "Philly Joe Jones"] },
    { c: "Music", t: 5, q: "Which composer, also an engineer for Le Corbusier, wrote the orchestral 'Metastaseis' (1954)?", a: "Iannis Xenakis", d: ["Edgard Varese", "Pierre Boulez", "Luigi Nono"] },
  ],
  [
    { c: "Music", t: 1, q: "Which singer had a 1967 hit with '(You Make Me Feel Like) A Natural Woman'?", a: "Aretha Franklin", d: ["Gladys Knight", "Etta James", "Dionne Warwick"] },
    { c: "Music", t: 2, q: "Which singer-songwriter wrote 'Blowin' in the Wind' (1962)?", a: "Bob Dylan", d: ["Pete Seeger", "Phil Ochs", "Woody Guthrie"] },
    { c: "Music", t: 3, q: "Which punk band's members all used the same stage surname, like Joey and Dee Dee?", a: "Ramones", d: ["Television", "Talking Heads", "Dead Boys"] },
    { c: "Music", t: 4, q: "Which English composer wrote the 'Pomp and Circumstance' marches, heard at American graduations?", a: "Edward Elgar", d: ["Frederick Delius", "Arthur Sullivan", "Charles Villiers Stanford"] },
    { c: "Music", t: 5, q: "Which Elizabethan lutenist composed the song 'Flow, My Tears'?", a: "John Dowland", d: ["Thomas Campion", "Thomas Morley", "Orlando Gibbons"] },
  ],
  [
    { c: "Music", t: 1, q: "Which 2017 Pixar film about a boy who dreams of being a musician features the song 'Remember Me'?", a: "Coco", d: ["Encanto", "The Book of Life", "Luca"] },
    { c: "Music", t: 2, q: "Which singer won an Oscar for playing Maggio in From Here to Eternity (1953)?", a: "Frank Sinatra", d: ["Dean Martin", "Tony Bennett", "Perry Como"] },
    { c: "Music", t: 3, q: "Which composer wrote the opera 'Madama Butterfly' (1904)?", a: "Giacomo Puccini", d: ["Giuseppe Verdi", "Pietro Mascagni", "Umberto Giordano"] },
    { c: "Music", t: 4, q: "Which Bach collection holds 48 preludes and fugues, one in every key, in two books?", a: "The Well-Tempered Clavier", d: ["The Art of Fugue", "The Goldberg Variations", "The Clavier-Ubung"] },
    { c: "Music", t: 5, q: "Which composer wrote the opera 'Nixon in China' (1987)?", a: "John Adams", d: ["Philip Glass", "Steve Reich", "John Corigliano"] },
  ],
  [
    { c: "Music", t: 1, q: "What is a singing group in a church, often robed and seated near the altar, called?", a: "A choir", d: ["A quartet", "An orchestra", "A brass band"] },
    { c: "Music", t: 2, q: "Which band's 1981 No. 1 'Rapture' was one of the first hits to include a rap?", a: "Blondie", d: ["The Pretenders", "The B-52's", "The Go-Go's"] },
    { c: "Music", t: 3, q: "Which British punk band had Joe Strummer and Mick Jones as its singers?", a: "The Clash", d: ["The Jam", "The Damned", "Buzzcocks"] },
    { c: "Music", t: 4, q: "Which Russian composer wrote 'Flight of the Bumblebee'?", a: "Nikolai Rimsky-Korsakov", d: ["Mily Balakirev", "Anatoly Lyadov", "Alexander Glazunov"] },
    { c: "Music", t: 5, q: "Which Czech composer wrote the opera 'Jenufa' (1904) and the 'Sinfonietta'?", a: "Leos Janacek", d: ["Antonin Dvorak", "Zdenek Fibich", "Josef Bohuslav Foerster"] },
  ],
  [
    { c: "Music", t: 1, q: "Which pop singer from Stratford, Ontario, released the album 'Purpose' in 2015?", a: "Justin Bieber", d: ["Shawn Mendes", "Jesse McCartney", "Austin Mahone"] },
    { c: "Music", t: 2, q: "Which singer sang on Mark Ronson's 2014 hit 'Uptown Funk'?", a: "Bruno Mars", d: ["Pharrell Williams", "Jason Derulo", "Justin Timberlake"] },
    { c: "Music", t: 3, q: "Which guitarist wrote 'Tears in Heaven' (1992) after the death of his young son?", a: "Eric Clapton", d: ["Jeff Beck", "Jimmy Page", "Peter Green"] },
    { c: "Music", t: 4, q: "Which musician declared his Lagos compound the independent Kalakuta Republic?", a: "Fela Kuti", d: ["King Sunny Ade", "Ebenezer Obey", "Tony Allen"] },
    { c: "Music", t: 5, q: "Which saxophonist practiced alone on the Williamsburg Bridge during a break from performing, 1959 to 1961?", a: "Sonny Rollins", d: ["Dexter Gordon", "Hank Mobley", "Johnny Griffin"] },
  ],
  [
    { c: "Music", t: 1, q: "Which large brass instrument is usually held upright in the lap with its bell pointing up?", a: "The tuba", d: ["The trombone", "The trumpet", "The French horn"] },
    { c: "Music", t: 2, q: "What is the lowest female singing voice called?", a: "Contralto", d: ["Mezzo-soprano", "Soprano", "Tenor"] },
    { c: "Music", t: 3, q: "Which country singer recorded 'You Ain't Woman Enough' (1966) and 'Fist City' (1968)?", a: "Loretta Lynn", d: ["Tammy Wynette", "Patsy Cline", "Kitty Wells"] },
    { c: "Music", t: 4, q: "Which Hungarian composer wrote the opera 'Bluebeard's Castle' (1918)?", a: "Bela Bartok", d: ["Zoltan Kodaly", "Ernst von Dohnanyi", "Leo Weiner"] },
    { c: "Music", t: 5, q: "What was the last opera Vincenzo Bellini wrote, premiered in Paris in 1835?", a: "I puritani", d: ["La sonnambula", "Il pirata", "Beatrice di Tenda"] },
  ],
  [
    { c: "Music", t: 1, q: "What kind of work is Beethoven's Ninth, with its 'Ode to Joy' finale?", a: "A symphony", d: ["A sonata", "A concerto", "An overture"] },
    { c: "Music", t: 2, q: "Which musical, based on Gregory Maguire's 1995 novel, follows Elphaba and Glinda?", a: "Wicked", d: ["Into the Woods", "The Wiz", "Pippin"] },
    { c: "Music", t: 3, q: "Which Lerner and Loewe musical follows Eliza Doolittle's speech lessons with Henry Higgins?", a: "My Fair Lady", d: ["Brigadoon", "Gigi", "Paint Your Wagon"] },
    { c: "Music", t: 4, q: "Which South African singer shared a 1966 Grammy with Harry Belafonte?", a: "Miriam Makeba", d: ["Brenda Fassie", "Letta Mbulu", "Dorothy Masuka"] },
    { c: "Music", t: 5, q: "Which French poet-composer wrote the Messe de Nostre Dame in the 1360s?", a: "Guillaume de Machaut", d: ["Philippe de Vitry", "Perotin", "Adam de la Halle"] },
  ],
  [
    { c: "Music", t: 1, q: "What is a short catchy tune used in a radio or TV advertisement called?", a: "A jingle", d: ["An anthem", "A ballad", "An overture"] },
    { c: "Music", t: 2, q: "Which Motown group had a 1972 hit with 'Papa Was a Rollin' Stone'?", a: "The Temptations", d: ["The Four Tops", "The Miracles", "The Drifters"] },
    { c: "Music", t: 3, q: "Which composer wrote the ballets 'Apollo' and 'Agon' for George Balanchine?", a: "Igor Stravinsky", d: ["Sergei Prokofiev", "Claude Debussy", "Maurice Ravel"] },
    { c: "Music", t: 4, q: "Which Charles Gounod opera of 1859 includes Marguerite's 'Jewel Song'?", a: "Faust", d: ["Romeo et Juliette", "Mireille", "Sapho"] },
    { c: "Music", t: 5, q: "Which Renaissance composer wrote the Missa Papae Marcelli?", a: "Giovanni Pierluigi da Palestrina", d: ["Orlande de Lassus", "Tomas Luis de Victoria", "Cristobal de Morales"] },
  ],
  [
    { c: "Music", t: 1, q: "Which Christmas ballet features the Sugar Plum Fairy and the Mouse King?", a: "The Nutcracker", d: ["Swan Lake", "Giselle", "Cinderella"] },
    { c: "Music", t: 2, q: "Whose big band made Billy Strayhorn's 'Take the A Train' its signature tune?", a: "Duke Ellington", d: ["Count Basie", "Cab Calloway", "Glenn Miller"] },
    { c: "Music", t: 3, q: "Which rapper was born Shawn Carter in Brooklyn?", a: "Jay-Z", d: ["Nas", "Busta Rhymes", "The Notorious B.I.G."] },
    { c: "Music", t: 4, q: "Which blues guitarist died in a helicopter crash after a 1990 concert at Alpine Valley, Wisconsin?", a: "Stevie Ray Vaughan", d: ["Johnny Winter", "Albert Collins", "Billy Gibbons"] },
    { c: "Music", t: 5, q: "Which Malian guitarist, called the African John Lee Hooker, won a Grammy with Ry Cooder for 'Talking Timbuktu'?", a: "Ali Farka Toure", d: ["Boubacar Traore", "Habib Koite", "Vieux Farka Toure"] },
  ],
  [
    { c: "Music", t: 1, q: "Which brass instrument did bandleader Glenn Miller play?", a: "The trombone", d: ["The tuba", "The French horn", "The cornet"] },
    { c: "Music", t: 2, q: "Which band from Oxfordshire had its first hit with 'Creep' (1992)?", a: "Radiohead", d: ["Blur", "Muse", "Pulp"] },
    { c: "Music", t: 3, q: "Which bandleader gave his name to a big tuba that wraps around the player's body?", a: "John Philip Sousa", d: ["Edwin Franko Goldman", "Karl King", "Patrick Gilmore"] },
    { c: "Music", t: 4, q: "Which Russian composer wrote the 'Classical' Symphony (1917) in the style of Haydn?", a: "Sergei Prokofiev", d: ["Aram Khachaturian", "Reinhold Gliere", "Dmitri Kabalevsky"] },
    { c: "Music", t: 5, q: "Which pianist led the long-running Standards Trio with Gary Peacock and Jack DeJohnette?", a: "Keith Jarrett", d: ["Chick Corea", "Herbie Hancock", "McCoy Tyner"] },
  ],
  [
    { c: "Music", t: 1, q: "Which stringed instrument is the national symbol of Ireland?", a: "The harp", d: ["The zither", "The lute", "The dulcimer"] },
    { c: "Music", t: 2, q: "Which Irish band, fronted by Dolores O'Riordan, released 'Zombie' in 1994?", a: "The Cranberries", d: ["The Corrs", "The Pogues", "Snow Patrol"] },
    { c: "Music", t: 3, q: "Which Norwegian composer lived at the villa Troldhaugen near Bergen?", a: "Edvard Grieg", d: ["Johan Svendsen", "Christian Sinding", "Ole Bull"] },
    { c: "Music", t: 4, q: "Which Senegalese singer became his country's minister of culture and tourism in 2012?", a: "Youssou N'Dour", d: ["Baaba Maal", "Ismael Lo", "Salif Keita"] },
    { c: "Music", t: 5, q: "Which Franco-Flemish composer wrote the chanson 'Mille regretz' and the Missa Pange lingua?", a: "Josquin des Prez", d: ["Johannes Ockeghem", "Guillaume Dufay", "Jacob Obrecht"] },
  ],
  [
    { c: "Music", t: 1, q: "Which holiday song begins 'Dashing through the snow, in a one-horse open sleigh'?", a: "Jingle Bells", d: ["Deck the Halls", "Sleigh Ride", "Winter Wonderland"] },
    { c: "Music", t: 2, q: "Which band, formed as Linda Ronstadt's backing group, released 'Take It Easy' in 1972?", a: "Eagles", d: ["Steely Dan", "The Doobie Brothers", "America"] },
    { c: "Music", t: 3, q: "Which rapper traded famous diss tracks with Jay-Z, including 'Ether' (2001)?", a: "Nas", d: ["LL Cool J", "Mobb Deep", "Kool G Rap"] },
    { c: "Music", t: 4, q: "Which tenor saxophonist was nicknamed Pres by Billie Holiday?", a: "Lester Young", d: ["Ben Webster", "Chu Berry", "Don Byas"] },
    { c: "Music", t: 5, q: "Which German composer wrote 'Der Freischutz' (1821), with its Wolf's Glen scene?", a: "Carl Maria von Weber", d: ["Heinrich Marschner", "Louis Spohr", "Albert Lortzing"] },
  ],
  [
    { c: "Music", t: 1, q: "Which singer released 'All I Want for Christmas Is You' in 1994?", a: "Mariah Carey", d: ["Whitney Houston", "Toni Braxton", "Janet Jackson"] },
    { c: "Music", t: 2, q: "Which Minneapolis musician starred in the 1984 film 'Purple Rain'?", a: "Prince", d: ["Rick James", "Lionel Richie", "Morris Day"] },
    { c: "Music", t: 3, q: "Which musical features the Emcee and the singer Sally Bowles at the Kit Kat Klub?", a: "Cabaret", d: ["Chicago", "Zorba", "Funny Lady"] },
    { c: "Music", t: 4, q: "Which Cuban ensemble, with Compay Segundo and Ibrahim Ferrer, was filmed by Wim Wenders in 1999?", a: "Buena Vista Social Club", d: ["Los Van Van", "Irakere", "Orquesta Aragon"] },
    { c: "Music", t: 5, q: "Which Italian composer wrote the comic opera 'Don Pasquale' (1843)?", a: "Gaetano Donizetti", d: ["Saverio Mercadante", "Giovanni Pacini", "Luigi Ricci"] },
  ],
  [
    { c: "Music", t: 1, q: "Which percussion instrument is a steel rod bent into a three-sided shape and struck with a metal beater?", a: "The triangle", d: ["The tambourine", "The cowbell", "The glockenspiel"] },
    { c: "Music", t: 2, q: "Which Irving Berlin song did Bing Crosby introduce in the 1942 film Holiday Inn?", a: "White Christmas", d: ["Silver Bells", "Let It Snow", "Blue Christmas"] },
    { c: "Music", t: 3, q: "Which jazz pianist led a quartet with John Coltrane at the Five Spot Cafe in 1957?", a: "Thelonious Monk", d: ["Bud Powell", "Bill Evans", "Earl Hines"] },
    { c: "Music", t: 4, q: "Which composer wrote the score for the film 'Koyaanisqatsi' (1982)?", a: "Philip Glass", d: ["John Adams", "Morton Feldman", "La Monte Young"] },
    { c: "Music", t: 5, q: "Which saxophonist recorded the double-quartet album 'Free Jazz' (1961)?", a: "Ornette Coleman", d: ["Eric Dolphy", "Jackie McLean", "Cannonball Adderley"] },
  ],
  [
    { c: "Music", t: 1, q: "Which Andrew Lloyd Webber musical features 'The Music of the Night' and 'All I Ask of You'?", a: "The Phantom of the Opera", d: ["Starlight Express", "Sunset Boulevard", "Aspects of Love"] },
    { c: "Music", t: 2, q: "In which musical does Aaron Burr sing 'The Room Where It Happens'?", a: "Hamilton", d: ["In the Heights", "Dear Evan Hansen", "Come From Away"] },
    { c: "Music", t: 3, q: "Which N.W.A member produced Snoop Dogg's debut album 'Doggystyle' (1993)?", a: "Dr. Dre", d: ["Ice Cube", "DJ Yella", "Eazy-E"] },
    { c: "Music", t: 4, q: "Which English composer wrote 'The Young Person's Guide to the Orchestra' (1946)?", a: "Benjamin Britten", d: ["Michael Tippett", "William Walton", "Gerald Finzi"] },
    { c: "Music", t: 5, q: "Which composer made the tape piece 'It's Gonna Rain' (1965) from a looped street sermon?", a: "Steve Reich", d: ["Terry Riley", "Michael Nyman", "Gavin Bryars"] },
  ],
  [
    { c: "Music", t: 1, q: "Which band played a famous set at Live Aid at Wembley Stadium in 1985?", a: "Queen", d: ["Fleetwood Mac", "Genesis", "Supertramp"] },
    { c: "Music", t: 2, q: "Which Los Angeles band, fronted by Anthony Kiedis, released 'Under the Bridge' in 1992?", a: "Red Hot Chili Peppers", d: ["Jane's Addiction", "Faith No More", "Weezer"] },
    { c: "Music", t: 3, q: "Which composer wrote the 'Slavonic Dances' and the 'Humoresque' No. 7?", a: "Antonin Dvorak", d: ["Bedrich Smetana", "Leos Janacek", "Bohuslav Martinu"] },
    { c: "Music", t: 4, q: "Which composer, blind from the age of three, wrote 'Fantasia para un gentilhombre' for Andres Segovia?", a: "Joaquin Rodrigo", d: ["Manuel de Falla", "Enrique Granados", "Joaquin Turina"] },
    { c: "Music", t: 5, q: "Which Austrian composer wrote 'Verklarte Nacht' (1899) and 'Pierrot lunaire' (1912)?", a: "Arnold Schoenberg", d: ["Anton Webern", "Ernst Krenek", "Josef Matthias Hauer"] },
  ],
  [
    { c: "Music", t: 1, q: "Which singer released the hit 'Shake It Off' in 2014?", a: "Taylor Swift", d: ["Ariana Grande", "Meghan Trainor", "Selena Gomez"] },
    { c: "Music", t: 2, q: "Which instrument has tuned metal bars struck with mallets and sounds like small bells?", a: "Glockenspiel", d: ["Xylophone", "Marimba", "Vibraslap"] },
    { c: "Music", t: 3, q: "Which singer and pianist was born Eunice Waymon in North Carolina?", a: "Nina Simone", d: ["Roberta Flack", "Odetta", "Della Reese"] },
    { c: "Music", t: 4, q: "Which bluesman, born Chester Burnett, recorded 'Smokestack Lightnin''?", a: "Howlin' Wolf", d: ["Elmore James", "Jimmy Reed", "Bukka White"] },
    { c: "Music", t: 5, q: "Which French composer and bird-song collector wrote the 'Turangalila-Symphonie' (1948)?", a: "Olivier Messiaen", d: ["Francis Poulenc", "Henri Dutilleux", "Arthur Honegger"] },
  ],
  [
    { c: "Music", t: 1, q: "What are the five horizontal lines that music is written on called?", a: "The staff", d: ["The bar", "The scale", "The clef"] },
    { c: "Music", t: 2, q: "Which British singer released 'Rehab' in 2006?", a: "Amy Winehouse", d: ["Duffy", "Lily Allen", "Joss Stone"] },
    { c: "Music", t: 3, q: "Which composer wrote the 'Ride of the Valkyries'?", a: "Richard Wagner", d: ["Richard Strauss", "Engelbert Humperdinck", "Carl Maria von Weber"] },
    { c: "Music", t: 4, q: "Which Czech composer wrote the comic opera 'The Bartered Bride' (1866)?", a: "Bedrich Smetana", d: ["Zdenek Fibich", "Josef Suk", "Vitezslav Novak"] },
    { c: "Music", t: 5, q: "Which Danish composer wrote the comic opera 'Maskarade' (1906)?", a: "Carl Nielsen", d: ["Niels Gade", "Rued Langgaard", "Per Norgard"] },
  ],
  [
    { c: "Music", t: 1, q: "Which instrument has stops, keyboards called manuals and ranks of pipes?", a: "The organ", d: ["The accordion", "The celesta", "The harmonium"] },
    { c: "Music", t: 2, q: "Which French composer orchestrated Mussorgsky's 'Pictures at an Exhibition' in 1922?", a: "Maurice Ravel", d: ["Erik Satie", "Francis Poulenc", "Darius Milhaud"] },
    { c: "Music", t: 3, q: "Which singer from Barbados was born Robyn Fenty?", a: "Rihanna", d: ["Shontelle", "Alison Hinds", "Jaime Aditi"] },
    { c: "Music", t: 4, q: "Which Indian sitar player performed at Woodstock in 1969 and taught a Beatle?", a: "Ravi Shankar", d: ["Vilayat Khan", "Ali Akbar Khan", "Nikhil Banerjee"] },
    { c: "Music", t: 5, q: "Which jazz bandleader led the Arkestra and claimed to have come from Saturn?", a: "Sun Ra", d: ["Fletcher Henderson", "Gil Evans", "Stan Kenton"] },
  ],
  [
    { c: "Music", t: 1, q: "What do you call the person who writes the words of a song?", a: "A lyricist", d: ["A conductor", "An arranger", "A producer"] },
    { c: "Music", t: 2, q: "Which band, fronted by Jim Morrison, released 'Light My Fire' in 1967?", a: "The Doors", d: ["The Byrds", "Jefferson Airplane", "The Turtles"] },
    { c: "Music", t: 3, q: "Which musical's creator, Jonathan Larson, died the night before its first Off-Broadway preview in 1996?", a: "Rent", d: ["Hair", "Godspell", "Spring Awakening"] },
    { c: "Music", t: 4, q: "Which singer was known as the Queen of Fado?", a: "Amalia Rodrigues", d: ["Mariza", "Cesaria Evora", "Dulce Pontes"] },
    { c: "Music", t: 5, q: "Which Catholic composer at Elizabeth I's court published three Latin Masses in the 1590s?", a: "William Byrd", d: ["Thomas Weelkes", "John Bull", "Thomas Tomkins"] },
  ],
  [
    { c: "Music", t: 1, q: "Which boy band had a 2011 hit with 'What Makes You Beautiful'?", a: "One Direction", d: ["Take That", "The Wanted", "Westlife"] },
    { c: "Music", t: 2, q: "Which Italian term tells players to grow gradually softer?", a: "Diminuendo", d: ["Crescendo", "Ritardando", "Staccato"] },
    { c: "Music", t: 3, q: "Which country music radio show has broadcast from Nashville since 1925?", a: "The Grand Ole Opry", d: ["The Louisiana Hayride", "Austin City Limits", "The Midnight Jamboree"] },
    { c: "Music", t: 4, q: "Which Engelbert Humperdinck opera of 1893 is based on a Grimm fairy tale?", a: "Hansel and Gretel", d: ["Konigskinder", "Snow White", "Rumpelstiltskin"] },
    { c: "Music", t: 5, q: "Which Polish composer wrote 'Threnody to the Victims of Hiroshima' (1960)?", a: "Krzysztof Penderecki", d: ["Witold Lutoslawski", "Henryk Gorecki", "Grazyna Bacewicz"] },
  ],
];
