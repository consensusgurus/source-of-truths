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
];
