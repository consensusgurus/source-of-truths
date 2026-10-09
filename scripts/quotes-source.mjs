// Authored source for Quotes, the daily attribution gauntlet.
// Built into app/quotes/{questions,puzzles}.js by scripts/gen-mcq.mjs.
//
//   c  lane, cycling in LANES order across every block of five
//   t  tier, 1 (gimme) to 5 (expert), five questions per tier per day
//   q  the question
//   a  the TRUE answer, always authored here in first position
//   d  three distractors
//
// FOUR REAL LANES TO ONE FICTIONAL (owner, 2026-08-29). The game is weighted
// toward real life and history: presidents and politics, history and war,
// science and letters and ideas, and books and authors are all attributions to
// people who actually said or wrote the words. Screen Lines is the one
// invented lane, one question in five.
//
// A FICTIONAL LINE IS ALWAYS ASKED AS A CHARACTER (owner rule). Every Screen
// Lines stem contains the word "character" and every one of its four choices is
// a character from that work, never the actor who played them. The same holds
// for the occasional novel line in Books & Authors: either the stem asks which
// character speaks it, or it asks which author wrote it, and it says which.
// Never mix a character and a performer inside one set of choices.
//
// NOTHING APOCRYPHAL. The failure mode of a quotes bank is the famous line
// nobody actually said. Banned outright: Marie Antoinette on cake, Voltaire on
// defending your right to say it, Machiavelli on ends and means, Einstein on
// the definition of insanity, Burke on good men doing nothing, Victoria on not
// being amused, Revere on the British coming. Where a misattribution is itself
// interesting it may be asked directly, naming the real author as the answer.
// Every line here is one the named person is documented as having written or
// spoken, and a translated line is asked in its standard English rendering.
//
// EVERY FACT IS FROZEN, which a quotes bank gets almost for free: a line said in
// 1863 stays said. What is banned is asking who "currently" holds any office, or
// pinning a quote to a living person's present role rather than to the moment
// they said it.
export const LANES = ['Presidents & Politics', 'History & War', 'Science, Letters & Ideas', 'Books & Authors', 'Screen Lines'];

export const DAYS = [

// ── Day 1 ──────────────────────────────────────────────────────────────────
[
{ c: 'Presidents & Politics', t: 1, q: 'Which president urged Americans to ask not what their country could do for them?', a: 'John F. Kennedy', d: ['Franklin D. Roosevelt', 'Lyndon B. Johnson', 'Dwight D. Eisenhower'] },
{ c: 'History & War', t: 1, q: 'Who told the March on Washington in 1963 that he had a dream?', a: 'Martin Luther King Jr.', d: ['Malcolm X', 'John Lewis', 'Thurgood Marshall'] },
{ c: 'Science, Letters & Ideas', t: 1, q: 'Who described a small step for man and a giant leap for mankind?', a: 'Neil Armstrong', d: ['Buzz Aldrin', 'Yuri Gagarin', 'John Glenn'] },
{ c: 'Books & Authors', t: 1, q: "Which novel opens with the words 'Call me Ishmael'?", a: 'Moby-Dick', d: ['Treasure Island', 'The Old Man and the Sea', 'Robinson Crusoe'] },
{ c: 'Screen Lines', t: 1, q: "Which character says 'Here's looking at you, kid' in Casablanca?", a: 'Rick Blaine', d: ['Ilsa Lund', 'Victor Laszlo', 'Captain Renault'] },

{ c: 'Presidents & Politics', t: 2, q: 'Which president warned in his farewell address against the military-industrial complex?', a: 'Dwight D. Eisenhower', d: ['Harry S. Truman', 'John F. Kennedy', 'Richard Nixon'] },
{ c: 'History & War', t: 2, q: 'Who told the House of Commons in 1940 that he had nothing to offer but blood, toil, tears and sweat?', a: 'Winston Churchill', d: ['Neville Chamberlain', 'Clement Attlee', 'Anthony Eden'] },
{ c: 'Science, Letters & Ideas', t: 2, q: 'Who reasoned that because he was thinking, he must exist?', a: 'Rene Descartes', d: ['Immanuel Kant', 'Baruch Spinoza', 'John Locke'] },
{ c: 'Books & Authors', t: 2, q: 'Which novel begins by calling it the best of times and the worst of times?', a: 'A Tale of Two Cities', d: ['Great Expectations', 'Bleak House', 'Oliver Twist'] },
{ c: 'Screen Lines', t: 2, q: "Which character promises to make him an offer he can't refuse in The Godfather?", a: 'Vito Corleone', d: ['Michael Corleone', 'Sonny Corleone', 'Tom Hagen'] },

{ c: 'Presidents & Politics', t: 3, q: 'Which president promised at his first inaugural that the nation asks for action, and action now?', a: 'Franklin D. Roosevelt', d: ['Woodrow Wilson', 'Herbert Hoover', 'Harry S. Truman'] },
{ c: 'History & War', t: 3, q: "Who reported a victory with the words 'I came, I saw, I conquered'?", a: 'Julius Caesar', d: ['Augustus', 'Pompey', 'Mark Antony'] },
{ c: 'Science, Letters & Ideas', t: 3, q: 'Who wrote that if he had seen further it was by standing on the shoulders of giants?', a: 'Isaac Newton', d: ['Galileo Galilei', 'Robert Hooke', 'Edmond Halley'] },
{ c: 'Books & Authors', t: 3, q: 'Which author wrote that a single man in possession of a good fortune must be in want of a wife?', a: 'Jane Austen', d: ['Charlotte Bronte', 'George Eliot', 'Elizabeth Gaskell'] },
{ c: 'Screen Lines', t: 3, q: "Which character asks 'You talkin' to me?' in Taxi Driver?", a: 'Travis Bickle', d: ['Iris Steensma', 'Sport', 'Betsy'] },

{ c: 'Presidents & Politics', t: 4, q: 'Which president urged Americans to speak softly and carry a big stick?', a: 'Theodore Roosevelt', d: ['William McKinley', 'William Howard Taft', 'Woodrow Wilson'] },
{ c: 'History & War', t: 4, q: "Which American general answered a German surrender demand at Bastogne with the single word 'Nuts'?", a: 'Anthony McAuliffe', d: ['George Patton', 'Omar Bradley', 'Matthew Ridgway'] },
{ c: 'Science, Letters & Ideas', t: 4, q: 'Who is recorded at his trial as saying the unexamined life is not worth living?', a: 'Socrates', d: ['Plato', 'Aristotle', 'Epicurus'] },
{ c: 'Books & Authors', t: 4, q: 'Which author opened a novel by saying every unhappy family is unhappy in its own way?', a: 'Leo Tolstoy', d: ['Fyodor Dostoevsky', 'Ivan Turgenev', 'Anton Chekhov'] },
{ c: 'Screen Lines', t: 4, q: 'Which character in Gone with the Wind runs the Atlanta blockade and later marries Scarlett?', a: 'Rhett Butler', d: ['Ashley Wilkes', 'Frank Kennedy', 'Charles Hamilton'] },

{ c: 'Presidents & Politics', t: 5, q: 'Which president said the chief business of the American people is business?', a: 'Calvin Coolidge', d: ['Warren G. Harding', 'Herbert Hoover', 'William McKinley'] },
{ c: 'History & War', t: 5, q: 'Which admiral signalled that England expects every man to do his duty?', a: 'Horatio Nelson', d: ['Arthur Wellesley', 'Francis Drake', 'John Jervis'] },
{ c: 'Science, Letters & Ideas', t: 5, q: 'Who asked for a place to stand and promised to move the earth?', a: 'Archimedes', d: ['Euclid', 'Pythagoras', 'Eratosthenes'] },
{ c: 'Books & Authors', t: 5, q: 'Which poet urged his dying father not to go gentle into that good night?', a: 'Dylan Thomas', d: ['W. B. Yeats', 'T. S. Eliot', 'Seamus Heaney'] },
{ c: 'Screen Lines', t: 5, q: 'Which character describes attack ships on fire off the shoulder of Orion in Blade Runner?', a: 'Roy Batty', d: ['Rick Deckard', 'Rachael', 'Eldon Tyrell'] },
],

// ── Day 2 ──────────────────────────────────────────────────────────────────
[
{ c: 'Presidents & Politics', t: 1, q: 'Which president demanded at the Brandenburg Gate that Mr. Gorbachev tear down this wall?', a: 'Ronald Reagan', d: ['George H. W. Bush', 'Jimmy Carter', 'Richard Nixon'] },
{ c: 'History & War', t: 1, q: 'Which general promised the Philippines in 1942 that he would return?', a: 'Douglas MacArthur', d: ['Dwight D. Eisenhower', 'George Patton', 'Chester Nimitz'] },
{ c: 'Science, Letters & Ideas', t: 1, q: "Whose theory of evolution is popularly summed up as 'survival of the fittest', a phrase he borrowed from Herbert Spencer?", a: 'Charles Darwin', d: ['Gregor Mendel', 'Alfred Russel Wallace', 'Thomas Huxley'] },
{ c: 'Books & Authors', t: 1, q: "In which play does a prince ask whether to be, or not to be?", a: 'Hamlet', d: ['Macbeth', 'King Lear', 'Othello'] },
{ c: 'Screen Lines', t: 1, q: 'Which character says he loves the smell of napalm in the morning in Apocalypse Now?', a: 'Lieutenant Colonel Kilgore', d: ['Captain Willard', 'Colonel Kurtz', 'Chef'] },

{ c: 'Presidents & Politics', t: 2, q: 'Which president told reporters that he was not a crook?', a: 'Richard Nixon', d: ['Lyndon B. Johnson', 'Gerald Ford', 'Ronald Reagan'] },
{ c: 'History & War', t: 2, q: 'Which queen told her troops at Tilbury that she had the heart and stomach of a king?', a: 'Elizabeth I', d: ['Mary I', 'Anne Boleyn', 'Victoria'] },
{ c: 'Science, Letters & Ideas', t: 2, q: 'Which physicist told an interviewer that imagination is more important than knowledge?', a: 'Albert Einstein', d: ['Isaac Newton', 'Nikola Tesla', 'Thomas Edison'] },
{ c: 'Books & Authors', t: 2, q: 'Which novel opens on a bright cold day in April with the clocks striking thirteen?', a: 'Nineteen Eighty-Four', d: ['Brave New World', 'Fahrenheit 451', 'We'] },
{ c: 'Screen Lines', t: 2, q: "Which character says 'Say hello to my little friend' in Scarface?", a: 'Tony Montana', d: ['Manny Ribera', 'Frank Lopez', 'Alejandro Sosa'] },

{ c: 'Presidents & Politics', t: 3, q: 'Which president closed his first inaugural by appealing to the better angels of our nature?', a: 'Abraham Lincoln', d: ['Andrew Jackson', 'James Buchanan', 'Ulysses S. Grant'] },
{ c: 'History & War', t: 3, q: 'Which Virginian orator demanded liberty or death in 1775?', a: 'Patrick Henry', d: ['Thomas Paine', 'Samuel Adams', 'John Hancock'] },
{ c: 'Science, Letters & Ideas', t: 3, q: 'Who wrote that man is born free, and everywhere he is in chains?', a: 'Jean-Jacques Rousseau', d: ['Voltaire', 'Montesquieu', 'Denis Diderot'] },
{ c: 'Books & Authors', t: 3, q: 'Which author opened The Go-Between by calling the past a foreign country?', a: 'L. P. Hartley', d: ['Graham Greene', 'Evelyn Waugh', 'E. M. Forster'] },
{ c: 'Screen Lines', t: 3, q: 'Which character compares life to a box of chocolates, quoting his mother?', a: 'Forrest Gump', d: ['Jenny Curran', 'Lieutenant Dan', 'Bubba Blue'] },

{ c: 'Presidents & Politics', t: 4, q: 'Which president kept a desk sign saying the buck stops here?', a: 'Harry S. Truman', d: ['Franklin D. Roosevelt', 'Dwight D. Eisenhower', 'Herbert Hoover'] },
{ c: 'History & War', t: 4, q: "Which Roman emperor took as his motto 'make haste slowly'?", a: 'Augustus', d: ['Julius Caesar', 'Tiberius', 'Hadrian'] },
{ c: 'Science, Letters & Ideas', t: 4, q: 'Who argued that the medium is the message?', a: 'Marshall McLuhan', d: ['Noam Chomsky', 'Roland Barthes', 'Walter Benjamin'] },
{ c: 'Books & Authors', t: 4, q: 'Which poet wandered lonely as a cloud?', a: 'William Wordsworth', d: ['Samuel Taylor Coleridge', 'John Keats', 'Percy Bysshe Shelley'] },
{ c: 'Screen Lines', t: 4, q: "Which character shouts 'You can't handle the truth!' in A Few Good Men?", a: 'Colonel Nathan Jessup', d: ['Lieutenant Daniel Kaffee', 'Lieutenant Commander Galloway', 'Lieutenant Sam Weinberg'] },

{ c: 'Presidents & Politics', t: 5, q: "Which British prime minister told her party conference that the lady's not for turning?", a: 'Margaret Thatcher', d: ['Edward Heath', 'Harold Wilson', 'John Major'] },
{ c: 'History & War', t: 5, q: 'Which American spy is said to have regretted having only one life to lose for his country?', a: 'Nathan Hale', d: ['Paul Revere', 'Ethan Allen', 'Benedict Arnold'] },
{ c: 'Science, Letters & Ideas', t: 5, q: 'Who described life without government as solitary, poor, nasty, brutish and short?', a: 'Thomas Hobbes', d: ['John Locke', 'David Hume', 'Jeremy Bentham'] },
{ c: 'Books & Authors', t: 5, q: 'Which poet asked whether he dared disturb the universe?', a: 'T. S. Eliot', d: ['Ezra Pound', 'W. H. Auden', 'Wallace Stevens'] },
{ c: 'Screen Lines', t: 5, q: 'Which character declares that what we have here is failure to communicate in Cool Hand Luke?', a: 'The Captain', d: ['Carr', 'Dragline', 'Society Red'] },
],

// ── Day 3 ──────────────────────────────────────────────────────────────────
[
{ c: 'Presidents & Politics', t: 1, q: 'Which president opened an address with the words four score and seven years ago?', a: 'Abraham Lincoln', d: ['George Washington', 'Thomas Jefferson', 'Andrew Johnson'] },
{ c: 'History & War', t: 1, q: 'Which physicist recalled the line about becoming Death, the destroyer of worlds, after the first atomic test?', a: 'J. Robert Oppenheimer', d: ['Enrico Fermi', 'Leslie Groves', 'Edward Teller'] },
{ c: 'Science, Letters & Ideas', t: 1, q: 'Which two-time Nobel laureate said that nothing in life is to be feared, it is only to be understood?', a: 'Marie Curie', d: ['Rosalind Franklin', 'Lise Meitner', 'Ada Lovelace'] },
{ c: 'Books & Authors', t: 1, q: 'Which novel ends with boats beating against the current, borne back ceaselessly into the past?', a: 'The Great Gatsby', d: ['Tender Is the Night', 'The Sun Also Rises', 'An American Tragedy'] },
{ c: 'Screen Lines', t: 1, q: "Which character says 'phone home' in Steven Spielberg's 1982 film?", a: 'E.T.', d: ['Elliott', 'Gertie', 'Michael'] },

{ c: 'Presidents & Politics', t: 2, q: 'Which presidential nominee told his convention to read his lips: no new taxes?', a: 'George H. W. Bush', d: ['Ronald Reagan', 'Bill Clinton', 'Bob Dole'] },
{ c: 'History & War', t: 2, q: 'Which pamphlet ends by calling on the workers of the world to unite?', a: 'The Communist Manifesto', d: ['Das Kapital', 'What Is to Be Done?', 'The State and Revolution'] },
{ c: 'Science, Letters & Ideas', t: 2, q: 'The vow to defend to the death your right to say it is usually credited to Voltaire, but who actually wrote it?', a: 'His biographer, Evelyn Beatrice Hall', d: ['Denis Diderot', 'Jean-Jacques Rousseau', 'Thomas Paine'] },
{ c: 'Books & Authors', t: 2, q: "Which novel opens 'All this happened, more or less'?", a: 'Slaughterhouse-Five', d: ['Catch-22', 'The Naked and the Dead', "Gravity's Rainbow"] },
{ c: 'Screen Lines', t: 2, q: "Which animated character is known for the exasperated cry 'D'oh!'?", a: 'Homer Simpson', d: ['Bart Simpson', 'Ned Flanders', 'Mr. Burns'] },

{ c: 'Presidents & Politics', t: 3, q: 'Which president announced in a State of the Union address that the era of big government is over?', a: 'Bill Clinton', d: ['Ronald Reagan', 'George H. W. Bush', 'Jimmy Carter'] },
{ c: 'History & War', t: 3, q: 'Which president told a crowd in a divided city that he was a Berliner?', a: 'John F. Kennedy', d: ['Ronald Reagan', 'Lyndon B. Johnson', 'Harry S. Truman'] },
{ c: 'Science, Letters & Ideas', t: 3, q: 'Which philosopher wrote a play whose closing verdict is that hell is other people?', a: 'Jean-Paul Sartre', d: ['Albert Camus', 'Simone de Beauvoir', 'Martin Heidegger'] },
{ c: 'Books & Authors', t: 3, q: 'Which author wrote that the mass of men lead lives of quiet desperation?', a: 'Henry David Thoreau', d: ['Ralph Waldo Emerson', 'Walt Whitman', 'Nathaniel Hawthorne'] },
{ c: 'Screen Lines', t: 3, q: 'Which character announces that nobody puts Baby in a corner?', a: 'Johnny Castle', d: ['Baby Houseman', 'Jake Houseman', 'Penny Johnson'] },

{ c: 'Presidents & Politics', t: 4, q: 'Which prime minister returned from Munich in 1938 promising peace for our time?', a: 'Neville Chamberlain', d: ['Stanley Baldwin', 'Winston Churchill', 'Ramsay MacDonald'] },
{ c: 'History & War', t: 4, q: 'Which Union admiral is quoted as damning the torpedoes and going full speed ahead?', a: 'David Farragut', d: ['John Paul Jones', 'Oliver Hazard Perry', 'George Dewey'] },
{ c: 'Science, Letters & Ideas', t: 4, q: 'Who wrote that philosophers have only interpreted the world, and the point is to change it?', a: 'Karl Marx', d: ['Friedrich Engels', 'Georg Hegel', 'Ludwig Feuerbach'] },
{ c: 'Books & Authors', t: 4, q: 'Which writer coined the line that a rose is a rose is a rose?', a: 'Gertrude Stein', d: ['Djuna Barnes', 'Edith Sitwell', 'Katherine Mansfield'] },
{ c: 'Screen Lines', t: 4, q: 'Which character argues that greed, for lack of a better word, is good in Wall Street?', a: 'Gordon Gekko', d: ['Bud Fox', 'Lou Mannheim', 'Sir Larry Wildman'] },

{ c: 'Presidents & Politics', t: 5, q: 'Which prime minister spent 1929 to 1939 out of office, in what he called his wilderness years?', a: 'Winston Churchill', d: ['Clement Attlee', 'David Lloyd George', 'Harold Macmillan'] },
{ c: 'History & War', t: 5, q: 'Which Confederate general died murmuring about crossing over the river to rest under the shade of the trees?', a: 'Stonewall Jackson', d: ['Robert E. Lee', 'J. E. B. Stuart', 'Albert Sidney Johnston'] },
{ c: 'Science, Letters & Ideas', t: 5, q: 'Who concluded that whereof one cannot speak, thereof one must be silent?', a: 'Ludwig Wittgenstein', d: ['Bertrand Russell', 'Gottlob Frege', 'Rudolf Carnap'] },
{ c: 'Books & Authors', t: 5, q: 'Which playwright wrote the advice to try again, fail again, fail better?', a: 'Samuel Beckett', d: ['Eugene Ionesco', 'Harold Pinter', 'Tom Stoppard'] },
{ c: 'Screen Lines', t: 5, q: 'Which member of Project Mayhem is chanted by name after he is killed?', a: 'Robert Paulson', d: ['Tyler Durden', 'Angel Face', 'Marla Singer'] },
],

// ── Day 4 ──────────────────────────────────────────────────────────────────
[
{ c: 'Presidents & Politics', t: 1, q: "Which president campaigned on the slogan 'Yes we can'?", a: 'Barack Obama', d: ['Bill Clinton', 'John Kerry', 'Al Gore'] },
{ c: 'History & War', t: 1, q: 'Who vowed in 1940 to fight on the beaches and on the landing grounds?', a: 'Winston Churchill', d: ['Neville Chamberlain', 'Anthony Eden', 'Lord Halifax'] },
{ c: 'Science, Letters & Ideas', t: 1, q: 'Which physicist wrote that the important thing is not to stop questioning?', a: 'Albert Einstein', d: ['Richard Feynman', 'Carl Sagan', 'Niels Bohr'] },
{ c: 'Books & Authors', t: 1, q: 'Which novel opens with a small person living in a hole in the ground, and not a nasty one?', a: 'The Hobbit', d: ['The Lord of the Rings', 'The Sword in the Stone', 'Watership Down'] },
{ c: 'Screen Lines', t: 1, q: "Which character promises 'I'll be back' at a police station desk in the 1984 film?", a: 'The T-800', d: ['Kyle Reese', 'Sarah Connor', 'Dr. Silberman'] },

{ c: 'Presidents & Politics', t: 2, q: 'Which president told an audience at Rice University that we choose to go to the Moon?', a: 'John F. Kennedy', d: ['Lyndon B. Johnson', 'Richard Nixon', 'Dwight D. Eisenhower'] },
{ c: 'History & War', t: 2, q: 'Which Union general is remembered for declaring that war is hell?', a: 'William Tecumseh Sherman', d: ['Ulysses S. Grant', 'Philip Sheridan', 'George McClellan'] },
{ c: 'Science, Letters & Ideas', t: 2, q: 'Which philosopher declared that God is dead?', a: 'Friedrich Nietzsche', d: ['Arthur Schopenhauer', 'Soren Kierkegaard', 'Georg Hegel'] },
{ c: 'Books & Authors', t: 2, q: 'Which poet ended an ode by equating beauty with truth?', a: 'John Keats', d: ['Percy Bysshe Shelley', 'Lord Byron', 'William Blake'] },
{ c: 'Screen Lines', t: 2, q: "Which character yells 'Show me the money!' down the phone in Jerry Maguire?", a: 'Rod Tidwell', d: ['Marcee Tidwell', 'Dorothy Boyd', 'Bob Sugar'] },

{ c: 'Presidents & Politics', t: 3, q: 'Which president liked to quote the Russian proverb about trusting but verifying?', a: 'Ronald Reagan', d: ['Richard Nixon', 'George H. W. Bush', 'Jimmy Carter'] },
{ c: 'History & War', t: 3, q: 'Which explorer greeted a long-lost missionary by asking whether he presumed correctly?', a: 'Henry Morton Stanley', d: ['Richard Burton', 'John Hanning Speke', 'Samuel Baker'] },
{ c: 'Science, Letters & Ideas', t: 3, q: 'Which inventor called genius one percent inspiration and ninety-nine percent perspiration?', a: 'Thomas Edison', d: ['Nikola Tesla', 'Henry Ford', 'Alexander Graham Bell'] },
{ c: 'Books & Authors', t: 3, q: 'Which poet wrote of water everywhere, with not a drop to drink?', a: 'Samuel Taylor Coleridge', d: ['William Wordsworth', 'Robert Southey', 'William Blake'] },
{ c: 'Screen Lines', t: 3, q: 'Which character in The Shining is the ghostly former caretaker who urges Jack to correct his family?', a: 'Delbert Grady', d: ['Lloyd the bartender', 'Dick Hallorann', 'Danny Torrance'] },

{ c: 'Presidents & Politics', t: 4, q: 'Which president insisted to reporters that he was the decider?', a: 'George W. Bush', d: ['Bill Clinton', 'Barack Obama', 'Ronald Reagan'] },
{ c: 'History & War', t: 4, q: 'Which commander observed after the retreat from Moscow that it is only a step from the sublime to the ridiculous?', a: 'Napoleon Bonaparte', d: ['Marshal Ney', 'Talleyrand', 'Tsar Alexander I'] },
{ c: 'Science, Letters & Ideas', t: 4, q: 'Who wrote that the heart has its reasons of which reason knows nothing?', a: 'Blaise Pascal', d: ['Rene Descartes', 'Michel de Montaigne', 'Pierre Gassendi'] },
{ c: 'Books & Authors', t: 4, q: 'Which novelist gave a dying trader the last words about the horror?', a: 'Joseph Conrad', d: ['Rudyard Kipling', 'E. M. Forster', 'Somerset Maugham'] },
{ c: 'Screen Lines', t: 4, q: 'Which character in The Wizard of Oz threatens Dorothy and her little dog too?', a: 'The Wicked Witch of the West', d: ['Glinda', 'Miss Gulch', 'The Wizard'] },

{ c: 'Presidents & Politics', t: 5, q: 'Which presidential nominee told his 1964 convention that extremism in the defense of liberty is no vice?', a: 'Barry Goldwater', d: ['Richard Nixon', 'George Wallace', 'Nelson Rockefeller'] },
{ c: 'History & War', t: 5, q: 'Which general told Congress in 1951 that old soldiers never die, they just fade away?', a: 'Douglas MacArthur', d: ['George Marshall', 'Dwight D. Eisenhower', 'Omar Bradley'] },
{ c: 'Science, Letters & Ideas', t: 5, q: 'Who wrote that the owl of Minerva spreads its wings only with the falling of the dusk?', a: 'Georg Hegel', d: ['Immanuel Kant', 'Johann Fichte', 'Friedrich Schelling'] },
{ c: 'Books & Authors', t: 5, q: 'Which author gave his dystopia the invented language Newspeak?', a: 'George Orwell', d: ['Aldous Huxley', 'Anthony Burgess', 'Yevgeny Zamyatin'] },
{ c: 'Screen Lines', t: 5, q: 'Which character crows about drinking your milkshake in There Will Be Blood?', a: 'Daniel Plainview', d: ['Eli Sunday', 'H. W. Plainview', 'Fletcher Hamilton'] },
],

// ── Day 5 ──────────────────────────────────────────────────────────────────
[
{ c: 'Presidents & Politics', t: 1, q: 'Which first lady told a convention that when they go low, we go high?', a: 'Michelle Obama', d: ['Hillary Clinton', 'Laura Bush', 'Nancy Reagan'] },
{ c: 'History & War', t: 1, q: 'Which Indian leader wrote that forgiveness is the attribute of the strong?', a: 'Mahatma Gandhi', d: ['Jawaharlal Nehru', 'Nelson Mandela', 'Martin Luther King Jr.'] },
{ c: 'Science, Letters & Ideas', t: 1, q: 'Which astronomer opened his television series by calling the cosmos all that is or ever was or ever will be?', a: 'Carl Sagan', d: ['Neil deGrasse Tyson', 'Patrick Moore', 'Fred Hoyle'] },
{ c: 'Books & Authors', t: 1, q: 'Which novel opens with the narrator dreaming she went to Manderley again?', a: 'Rebecca', d: ['Jane Eyre', 'Wuthering Heights', 'The Woman in White'] },
{ c: 'Screen Lines', t: 1, q: "Which character declares 'To infinity and beyond!' in Toy Story?", a: 'Buzz Lightyear', d: ['Woody', 'Rex', 'Mr. Potato Head'] },

{ c: 'Presidents & Politics', t: 2, q: 'Which president pledged a new deal for the American people when he accepted his nomination?', a: 'Franklin D. Roosevelt', d: ['Woodrow Wilson', 'Harry S. Truman', 'Al Smith'] },
{ c: 'History & War', t: 2, q: 'Which defendant told a 1964 courtroom that it was an ideal for which he was prepared to die?', a: 'Nelson Mandela', d: ['Steve Biko', 'Desmond Tutu', 'Oliver Tambo'] },
{ c: 'Science, Letters & Ideas', t: 2, q: 'Which Elizabethan philosopher is credited with the maxim that knowledge is power?', a: 'Francis Bacon', d: ['Roger Bacon', 'John Locke', 'Isaac Newton'] },
{ c: 'Books & Authors', t: 2, q: 'Which poet wrote the lines about huddled masses yearning to breathe free that are mounted at the Statue of Liberty?', a: 'Emma Lazarus', d: ['Walt Whitman', 'Emily Dickinson', 'Henry Wadsworth Longfellow'] },
{ c: 'Screen Lines', t: 2, q: 'Which character reports that Houston has a problem in the 1995 film Apollo 13?', a: 'Jim Lovell', d: ['Jack Swigert', 'Fred Haise', 'Gene Kranz'] },

{ c: 'Presidents & Politics', t: 3, q: 'Which president promised that government of the people, by the people, for the people shall not perish from the earth?', a: 'Abraham Lincoln', d: ['Thomas Jefferson', 'Daniel Webster', 'Ulysses S. Grant'] },
{ c: 'History & War', t: 3, q: 'Which British foreign secretary said on the eve of war in 1914 that the lamps were going out all over Europe?', a: 'Edward Grey', d: ['Herbert Asquith', 'David Lloyd George', 'Arthur Balfour'] },
{ c: 'Science, Letters & Ideas', t: 3, q: 'Which anthropologist is credited with the line about a small group of thoughtful, committed citizens changing the world?', a: 'Margaret Mead', d: ['Ruth Benedict', 'Jane Goodall', 'Franz Boas'] },
{ c: 'Books & Authors', t: 3, q: 'Which poet wrote that to err is human, to forgive divine?', a: 'Alexander Pope', d: ['John Dryden', 'Jonathan Swift', 'Samuel Johnson'] },
{ c: 'Screen Lines', t: 3, q: 'Which character in The Lord of the Rings films argues aloud with a second personality named Smeagol?', a: 'Gollum', d: ['Frodo Baggins', 'Bilbo Baggins', 'Sam Gamgee'] },

{ c: 'Presidents & Politics', t: 4, q: 'Which lawyer asked Joseph McCarthy at the Army hearings whether he had no sense of decency?', a: 'Joseph Welch', d: ['Roy Cohn', 'Robert Kennedy', 'Karl Mundt'] },
{ c: 'History & War', t: 4, q: 'Which founder wrote that the tree of liberty must be refreshed with the blood of patriots and tyrants?', a: 'Thomas Jefferson', d: ['John Adams', 'James Madison', 'Patrick Henry'] },
{ c: 'Science, Letters & Ideas', t: 4, q: 'Who wrote that one is not born, but rather becomes, a woman?', a: 'Simone de Beauvoir', d: ['Betty Friedan', 'Germaine Greer', 'Hannah Arendt'] },
{ c: 'Books & Authors', t: 4, q: "Which author opened a novel with the sentence 'It was a pleasure to burn'?", a: 'Ray Bradbury', d: ['Kurt Vonnegut', 'Philip K. Dick', 'Isaac Asimov'] },
{ c: 'Screen Lines', t: 4, q: "Which character shouts 'Made it, Ma! Top of the world!' in White Heat?", a: 'Cody Jarrett', d: ['Big Ed Somers', 'Hank Fallon', 'Verna Jarrett'] },

{ c: 'Presidents & Politics', t: 5, q: "Which vice-presidential nominee was told in a 1988 debate that he was no Jack Kennedy?", a: 'Dan Quayle', d: ['Al Gore', 'Walter Mondale', 'Bob Dole'] },
{ c: 'History & War', t: 5, q: 'Whose funeral oration for the Athenian war dead is preserved by Thucydides?', a: 'Pericles', d: ['Solon', 'Cleisthenes', 'Themistocles'] },
{ c: 'Science, Letters & Ideas', t: 5, q: 'Which philosopher wrote that what does not kill him makes him stronger?', a: 'Friedrich Nietzsche', d: ['Arthur Schopenhauer', 'Soren Kierkegaard', 'Max Stirner'] },
{ c: 'Books & Authors', t: 5, q: "Which author wrote the line 'Reader, I married him'?", a: 'Charlotte Bronte', d: ['Emily Bronte', 'Anne Bronte', 'George Eliot'] },
{ c: 'Screen Lines', t: 5, q: "Which character murmurs the word 'Rosebud' as he dies in the opening scene of Orson Welles's 1941 film?", a: 'Charles Foster Kane', d: ['Jedediah Leland', 'Jerry Thompson', 'Susan Alexander'] },
],

// ── Day 6 ──────────────────────────────────────────────────────────────────
[
{ c: 'Presidents & Politics', t: 1, q: 'Which president told a grieving nation that the Challenger crew had slipped the surly bonds of earth?', a: 'Ronald Reagan', d: ['George H. W. Bush', 'Jimmy Carter', 'Bill Clinton'] },
{ c: 'History & War', t: 1, q: "Which suffragette leader adopted 'Deeds not words' as her movement's motto?", a: 'Emmeline Pankhurst', d: ['Millicent Fawcett', 'Sylvia Pankhurst', 'Emily Davison'] },
{ c: 'Science, Letters & Ideas', t: 1, q: 'Which inventor summoned an assistant with the first words sent by telephone?', a: 'Alexander Graham Bell', d: ['Thomas Edison', 'Guglielmo Marconi', 'Samuel Morse'] },
{ c: 'Books & Authors', t: 1, q: "Which story opens by insisting that Marley was dead, to begin with?", a: 'A Christmas Carol', d: ['Great Expectations', 'The Pickwick Papers', 'Nicholas Nickleby'] },
{ c: 'Screen Lines', t: 1, q: 'Which character clicks her heels together and repeats that there is no place like home?', a: 'Dorothy Gale', d: ['Glinda', 'The Wizard', 'Auntie Em'] },

{ c: 'Presidents & Politics', t: 2, q: 'Which president declared an unconditional war on poverty and promised a Great Society?', a: 'Lyndon B. Johnson', d: ['John F. Kennedy', 'Harry S. Truman', 'Hubert Humphrey'] },
{ c: 'History & War', t: 2, q: 'Which president called December 7, 1941 a date which will live in infamy?', a: 'Franklin D. Roosevelt', d: ['Harry S. Truman', 'Douglas MacArthur', 'Cordell Hull'] },
{ c: 'Science, Letters & Ideas', t: 2, q: 'Which biologist warned of a spring in which no birds sang?', a: 'Rachel Carson', d: ['Aldo Leopold', 'John Muir', 'Jane Goodall'] },
{ c: 'Books & Authors', t: 2, q: 'Which novel opens by telling readers they do not know about the narrator unless they have read a book about Tom Sawyer?', a: 'Adventures of Huckleberry Finn', d: ['The Adventures of Tom Sawyer', 'Life on the Mississippi', 'The Prince and the Pauper'] },
{ c: 'Screen Lines', t: 2, q: "Which character cries that they may take our lives but never our freedom in Braveheart?", a: 'William Wallace', d: ['Robert the Bruce', 'King Edward I', 'Hamish Campbell'] },

{ c: 'Presidents & Politics', t: 3, q: 'Which founding father is traditionally credited with warning that they must all hang together, or assuredly hang separately?', a: 'Benjamin Franklin', d: ['John Adams', 'John Hancock', 'Thomas Jefferson'] },
{ c: 'History & War', t: 3, q: 'Which Spartan king is said to have answered a demand for his weapons by inviting the Persians to come and take them?', a: 'Leonidas', d: ['Lycurgus', 'Brasidas', 'Agesilaus'] },
{ c: 'Science, Letters & Ideas', t: 3, q: 'Martin Luther King Jr. often quoted the line about the moral arc bending toward justice. Which nineteenth-century minister first wrote it?', a: 'Theodore Parker', d: ['Ralph Waldo Emerson', 'Henry Ward Beecher', 'William Lloyd Garrison'] },
{ c: 'Books & Authors', t: 3, q: "Which Scottish novelist opened a book with the day his grandmother exploded?", a: 'Iain Banks', d: ['Martin Amis', 'Julian Barnes', 'Ian McEwan'] },
{ c: 'Screen Lines', t: 3, q: "Which character whispers 'I see dead people' in The Sixth Sense?", a: 'Cole Sear', d: ['Malcolm Crowe', 'Lynn Sear', 'Vincent Grey'] },

{ c: 'Presidents & Politics', t: 4, q: 'Which Kentucky senator said he would rather be right than be President?', a: 'Henry Clay', d: ['Daniel Webster', 'John C. Calhoun', 'Stephen Douglas'] },
{ c: 'History & War', t: 4, q: 'Which Carthaginian commander is said to have sworn eternal enmity to Rome as a boy?', a: 'Hannibal', d: ['Hamilcar Barca', 'Hasdrubal', 'Mago'] },
{ c: 'Science, Letters & Ideas', t: 4, q: 'Which German biologist formulated the biogenetic law summarised as ontogeny recapitulating phylogeny?', a: 'Ernst Haeckel', d: ['Charles Darwin', 'Thomas Huxley', 'Karl von Baer'] },
{ c: 'Books & Authors', t: 4, q: 'Which poet described two roads diverging in a yellow wood?', a: 'Robert Frost', d: ['Carl Sandburg', 'Wallace Stevens', 'William Carlos Williams'] },
{ c: 'Screen Lines', t: 4, q: 'Which character advises keeping your friends close and your enemies closer in The Godfather Part II?', a: 'Michael Corleone', d: ['Tom Hagen', 'Hyman Roth', 'Fredo Corleone'] },

{ c: 'Presidents & Politics', t: 5, q: 'Which British prime minister is credited with saying that a week is a long time in politics?', a: 'Harold Wilson', d: ['Harold Macmillan', 'Edward Heath', 'James Callaghan'] },
{ c: 'History & War', t: 5, q: 'Which Roman historian records a chieftain saying the Romans make a desert and call it peace?', a: 'Tacitus', d: ['Livy', 'Suetonius', 'Sallust'] },
{ c: 'Science, Letters & Ideas', t: 5, q: 'Who made the greatest happiness of the greatest number the foundation of his moral philosophy?', a: 'Jeremy Bentham', d: ['William Paley', 'David Hume', 'Adam Smith'] },
{ c: 'Books & Authors', t: 5, q: 'Which poet called hope the thing with feathers?', a: 'Emily Dickinson', d: ['Christina Rossetti', 'Elizabeth Barrett Browning', 'Emily Bronte'] },
{ c: 'Screen Lines', t: 5, q: 'Which character in The Karate Kid orders his own pupil to sweep the leg in the tournament final?', a: 'John Kreese', d: ['Mr. Miyagi', 'Daniel LaRusso', 'Johnny Lawrence'] },
],

// ── Day 7 ──────────────────────────────────────────────────────────────────
[
{ c: 'Presidents & Politics', t: 1, q: 'Which president introduced himself to the country by saying he was a Ford, not a Lincoln?', a: 'Gerald Ford', d: ['Jimmy Carter', 'Richard Nixon', 'Ronald Reagan'] },
{ c: 'History & War', t: 1, q: 'Which Soviet leader told Western diplomats that we will bury you?', a: 'Nikita Khrushchev', d: ['Joseph Stalin', 'Leonid Brezhnev', 'Vyacheslav Molotov'] },
{ c: 'Science, Letters & Ideas', t: 1, q: 'Which astrophysicist said the good thing about science is that it is true whether or not you believe in it?', a: 'Neil deGrasse Tyson', d: ['Carl Sagan', 'Brian Cox', 'Stephen Hawking'] },
{ c: 'Books & Authors', t: 1, q: 'Which novel opens with four children named Peter, Susan, Edmund and Lucy?', a: 'The Lion, the Witch and the Wardrobe', d: ['The Hobbit', 'Peter Pan', 'The Secret Garden'] },
{ c: 'Screen Lines', t: 1, q: 'Which character decides they are going to need a bigger boat in Jaws?', a: 'Chief Brody', d: ['Quint', 'Matt Hooper', 'Mayor Vaughn'] },

{ c: 'Presidents & Politics', t: 2, q: 'Which president joked that the nine most terrifying words are that he is from the government and here to help?', a: 'Ronald Reagan', d: ['George H. W. Bush', 'Barry Goldwater', 'Gerald Ford'] },
{ c: 'History & War', t: 2, q: 'Who warned a Missouri audience in 1946 that an iron curtain had descended across the continent?', a: 'Winston Churchill', d: ['Harry S. Truman', 'Clement Attlee', 'George Marshall'] },
{ c: 'Science, Letters & Ideas', t: 2, q: 'Which economist described the market being guided by an invisible hand?', a: 'Adam Smith', d: ['David Ricardo', 'John Maynard Keynes', 'Thomas Malthus'] },
{ c: 'Books & Authors', t: 2, q: 'Which novel amends its commandment to say that some animals are more equal than others?', a: 'Animal Farm', d: ['Nineteen Eighty-Four', 'Brave New World', 'Lord of the Flies'] },
{ c: 'Screen Lines', t: 2, q: "Which character says 'Hasta la vista, baby' in Terminator 2?", a: 'The T-800', d: ['Miles Dyson', 'Sarah Connor', 'The T-1000'] },

{ c: 'Presidents & Politics', t: 3, q: 'Which president said his country must be the great arsenal of democracy?', a: 'Franklin D. Roosevelt', d: ['Woodrow Wilson', 'Harry S. Truman', 'Dwight D. Eisenhower'] },
{ c: 'History & War', t: 3, q: "Which radio reporter broke down at the Hindenburg disaster crying 'Oh, the humanity!'?", a: 'Herbert Morrison', d: ['Edward R. Murrow', 'Walter Winchell', 'Lowell Thomas'] },
{ c: 'Science, Letters & Ideas', t: 3, q: 'Which thinker called dream interpretation the royal road to the unconscious?', a: 'Sigmund Freud', d: ['Carl Jung', 'Alfred Adler', 'Jean Piaget'] },
{ c: 'Books & Authors', t: 3, q: "Which novelist called his autobiography 'Speak, Memory'?", a: 'Vladimir Nabokov', d: ['Joseph Brodsky', 'Isaac Babel', 'Boris Pasternak'] },
{ c: 'Screen Lines', t: 3, q: "Which character rallies a party with the chant 'Toga! Toga!' in Animal House?", a: 'Bluto Blutarsky', d: ['Otter', 'Boon', 'Dean Wormer'] },

{ c: 'Presidents & Politics', t: 4, q: 'Which New York governor said you campaign in poetry and govern in prose?', a: 'Mario Cuomo', d: ['Nelson Rockefeller', 'Hugh Carey', 'George Pataki'] },
{ c: 'History & War', t: 4, q: 'Which Confederate commander said it is well that war is so terrible, or we should grow too fond of it?', a: 'Robert E. Lee', d: ['Stonewall Jackson', 'James Longstreet', 'Jefferson Davis'] },
{ c: 'Science, Letters & Ideas', t: 4, q: 'Which geneticist wrote that nothing in biology makes sense except in the light of evolution?', a: 'Theodosius Dobzhansky', d: ['Ernst Mayr', 'J. B. S. Haldane', 'Julian Huxley'] },
{ c: 'Books & Authors', t: 4, q: 'Which poet warned that things fall apart and the centre cannot hold?', a: 'W. B. Yeats', d: ['T. S. Eliot', 'Ezra Pound', 'Robert Graves'] },
{ c: 'Screen Lines', t: 4, q: 'Which character swears never to be hungry again in Gone with the Wind?', a: "Scarlett O'Hara", d: ['Rhett Butler', 'Melanie Hamilton', 'Mammy'] },

{ c: 'Presidents & Politics', t: 5, q: 'Which German chancellor called politics the art of the possible?', a: 'Otto von Bismarck', d: ['Konrad Adenauer', 'Gustav Stresemann', 'Willy Brandt'] },
{ c: 'History & War', t: 5, q: 'Which polar explorer wrote a last message begging that his people be looked after?', a: 'Robert Falcon Scott', d: ['Ernest Shackleton', 'Roald Amundsen', 'Edward Wilson'] },
{ c: 'Science, Letters & Ideas', t: 5, q: 'Which statistician wrote that all models are wrong, but some are useful?', a: 'George Box', d: ['Ronald Fisher', 'John Tukey', 'Karl Pearson'] },
{ c: 'Books & Authors', t: 5, q: "Which novelist wrote that the past is never dead, and is not even past?", a: 'William Faulkner', d: ['Ernest Hemingway', "Flannery O'Connor", 'Eudora Welty'] },
{ c: 'Screen Lines', t: 5, q: "Which character says 'Leave the gun. Take the cannoli' in The Godfather?", a: 'Peter Clemenza', d: ['Vito Corleone', 'Sonny Corleone', 'Rocco Lampone'] },
],

// ── Day 8 ──────────────────────────────────────────────────────────────────
[
{ c: 'Presidents & Politics', t: 1, q: 'Which president described America in his farewell address as a shining city upon a hill?', a: 'Ronald Reagan', d: ['John F. Kennedy', 'George H. W. Bush', 'Jimmy Carter'] },
{ c: 'History & War', t: 1, q: 'Which boxer announced to the world that he was the greatest?', a: 'Muhammad Ali', d: ['Joe Frazier', 'Sugar Ray Robinson', 'George Foreman'] },
{ c: 'Science, Letters & Ideas', t: 1, q: 'Which painter worked through a Blue Period before co-founding Cubism with Georges Braque?', a: 'Pablo Picasso', d: ['Henri Matisse', 'Salvador Dali', 'Marc Chagall'] },
{ c: 'Books & Authors', t: 1, q: 'Which novel opens with a couple of number four, Privet Drive, proud to say they are perfectly normal?', a: "Harry Potter and the Philosopher's Stone", d: ['The Worst Witch', 'Matilda', 'The BFG'] },
{ c: 'Screen Lines', t: 1, q: "Which character observes that 'life finds a way' in Jurassic Park?", a: 'Ian Malcolm', d: ['Alan Grant', 'Ellie Sattler', 'John Hammond'] },

{ c: 'Presidents & Politics', t: 2, q: 'Which president told Congress in 2002 of an axis of evil?', a: 'George W. Bush', d: ['Bill Clinton', 'Barack Obama', 'Ronald Reagan'] },
{ c: 'History & War', t: 2, q: 'Which commander told his troops on the eve of D-Day that the eyes of the world were upon them?', a: 'Dwight D. Eisenhower', d: ['Bernard Montgomery', 'Omar Bradley', 'George Marshall'] },
{ c: 'Science, Letters & Ideas', t: 2, q: 'Which architect made his motto that less is more?', a: 'Ludwig Mies van der Rohe', d: ['Le Corbusier', 'Frank Lloyd Wright', 'Walter Gropius'] },
{ c: 'Books & Authors', t: 2, q: "Which dramatist wrote the line about the lady protesting too much?", a: 'William Shakespeare', d: ['Christopher Marlowe', 'Ben Jonson', 'John Webster'] },
{ c: 'Screen Lines', t: 2, q: "Which character shrieks 'I'm melting!' in The Wizard of Oz?", a: 'The Wicked Witch of the West', d: ['Glinda', 'The Scarecrow', 'Dorothy Gale'] },

{ c: 'Presidents & Politics', t: 3, q: 'Which senator claimed in 1950 to hold in his hand a list of communists in the State Department?', a: 'Joseph McCarthy', d: ['Richard Nixon', 'Pat McCarran', 'Karl Mundt'] },
{ c: 'History & War', t: 3, q: "Which former slave is famously remembered as asking an 1851 women's convention whether she was not a woman?", a: 'Sojourner Truth', d: ['Harriet Tubman', 'Frederick Douglass', 'Susan B. Anthony'] },
{ c: 'Science, Letters & Ideas', t: 3, q: 'Which economist answered long-range forecasts by noting that in the long run we are all dead?', a: 'John Maynard Keynes', d: ['Milton Friedman', 'Friedrich Hayek', 'Joseph Schumpeter'] },
{ c: 'Books & Authors', t: 3, q: "Which novelist opened a book with a screaming that comes across the sky?", a: 'Thomas Pynchon', d: ['Don DeLillo', 'William Gaddis', 'Robert Coover'] },
{ c: 'Screen Lines', t: 3, q: 'Which character says you either get busy living or get busy dying in The Shawshank Redemption?', a: 'Andy Dufresne', d: ['Captain Hadley', 'Warden Norton', 'Brooks Hatlen'] },

{ c: 'Presidents & Politics', t: 4, q: 'Which president told an interviewer that when the president does it, that means it is not illegal?', a: 'Richard Nixon', d: ['Lyndon B. Johnson', 'Ronald Reagan', 'Bill Clinton'] },
{ c: 'History & War', t: 4, q: "Which member of a doomed polar expedition walked out saying he was just going outside and might be some time?", a: 'Lawrence Oates', d: ['Robert Falcon Scott', 'Edward Wilson', 'Henry Bowers'] },
{ c: 'Science, Letters & Ideas', t: 4, q: 'Which essayist held that what can be asserted without evidence can be dismissed without evidence?', a: 'Christopher Hitchens', d: ['Richard Dawkins', 'Daniel Dennett', 'Sam Harris'] },
{ c: 'Books & Authors', t: 4, q: "Which novelist used 'So it goes' as a refrain after every death in a book?", a: 'Kurt Vonnegut', d: ['Joseph Heller', 'Richard Brautigan', 'Tom Robbins'] },
{ c: 'Screen Lines', t: 4, q: "Which character bellows 'Stella!' up a staircase in A Streetcar Named Desire?", a: 'Stanley Kowalski', d: ['Blanche DuBois', 'Harold Mitchell', 'Steve Hubbell'] },

{ c: 'Presidents & Politics', t: 5, q: 'Which French premier said war is too important to be left to the generals?', a: 'Georges Clemenceau', d: ['Raymond Poincare', 'Aristide Briand', 'Philippe Petain'] },
{ c: 'History & War', t: 5, q: 'Which Byzantine empress is quoted as saying that the imperial purple makes a fine shroud?', a: 'Theodora', d: ['Irene', 'Zoe', 'Anna Komnene'] },
{ c: 'Science, Letters & Ideas', t: 5, q: 'Which Greek sophist declared that man is the measure of all things?', a: 'Protagoras', d: ['Heraclitus', 'Parmenides', 'Democritus'] },
{ c: 'Books & Authors', t: 5, q: 'Which novelist wrote that the world is a fine place and worth fighting for?', a: 'Ernest Hemingway', d: ['John Steinbeck', 'F. Scott Fitzgerald', 'John Dos Passos'] },
{ c: 'Screen Lines', t: 5, q: "Which character yells 'I'm walking here!' at a taxi in Midnight Cowboy?", a: 'Ratso Rizzo', d: ['Joe Buck', "Mr. O'Daniel", 'Cass'] },
],

// ── Day 9 ──────────────────────────────────────────────────────────────────
[
{ c: 'Presidents & Politics', t: 1, q: 'Which future president drafted the words about life, liberty and the pursuit of happiness?', a: 'Thomas Jefferson', d: ['John Adams', 'Benjamin Franklin', 'James Madison'] },
{ c: 'History & War', t: 1, q: 'Which seamstress refused to give up her bus seat in Montgomery and later said she was tired of giving in?', a: 'Rosa Parks', d: ['Coretta Scott King', 'Fannie Lou Hamer', 'Daisy Bates'] },
{ c: 'Science, Letters & Ideas', t: 1, q: 'Which physicist advised people to look up at the stars and not down at their feet?', a: 'Stephen Hawking', d: ['Carl Sagan', 'Richard Feynman', 'Neil deGrasse Tyson'] },
{ c: 'Books & Authors', t: 1, q: "Which childrens novel opens by asking where Papa is going with that axe?", a: "Charlotte's Web", d: ['Stuart Little', 'The Trumpet of the Swan', "Mr. Popper's Penguins"] },
{ c: 'Screen Lines', t: 1, q: 'Which character in The Princess Bride keeps announcing that he has come to avenge his father?', a: 'Inigo Montoya', d: ['Westley', 'Fezzik', 'Vizzini'] },

{ c: 'Presidents & Politics', t: 2, q: 'Which president told Congress in 1965 that we shall overcome?', a: 'Lyndon B. Johnson', d: ['John F. Kennedy', 'Richard Nixon', 'Hubert Humphrey'] },
{ c: 'History & War', t: 2, q: 'Which commodore opened the battle of Manila Bay by telling his captain to fire when ready?', a: 'George Dewey', d: ['David Farragut', 'William Sampson', 'Winfield Scott Schley'] },
{ c: 'Science, Letters & Ideas', t: 2, q: 'Which historian wrote that power tends to corrupt and absolute power corrupts absolutely?', a: 'Lord Acton', d: ['Edmund Burke', 'John Stuart Mill', 'Thomas Macaulay'] },
{ c: 'Books & Authors', t: 2, q: 'Which novelist ended a book with a man going to a far, far better rest than he had ever known?', a: 'Charles Dickens', d: ['Wilkie Collins', 'William Makepeace Thackeray', 'Anthony Trollope'] },
{ c: 'Screen Lines', t: 2, q: "Which character sings 'Just keep swimming' in Finding Nemo?", a: 'Dory', d: ['Marlin', 'Nemo', 'Crush'] },

{ c: 'Presidents & Politics', t: 3, q: 'Which politician told reporters after a lost race that they would not have him to kick around any more?', a: 'Richard Nixon', d: ['Barry Goldwater', 'George Romney', 'Edmund Muskie'] },
{ c: 'History & War', t: 3, q: 'Which American captain is traditionally said to have replied that he had not yet begun to fight?', a: 'John Paul Jones', d: ['Oliver Hazard Perry', 'Stephen Decatur', 'David Farragut'] },
{ c: 'Science, Letters & Ideas', t: 3, q: 'Which philosopher wrote that those who cannot remember the past are condemned to repeat it?', a: 'George Santayana', d: ['Edmund Burke', 'Arnold Toynbee', 'Oswald Spengler'] },
{ c: 'Books & Authors', t: 3, q: 'Which character in Ulysses calls history a nightmare from which he is trying to awake?', a: 'Stephen Dedalus', d: ['Leopold Bloom', 'Molly Bloom', 'Buck Mulligan'] },
{ c: 'Screen Lines', t: 3, q: 'Which character says that where they are going they do not need roads?', a: 'Doc Brown', d: ['Marty McFly', 'Biff Tannen', 'George McFly'] },

{ c: 'Presidents & Politics', t: 4, q: 'Which president told a grand jury that it depends on what the meaning of the word is is?', a: 'Bill Clinton', d: ['Richard Nixon', 'Ronald Reagan', 'George W. Bush'] },
{ c: 'History & War', t: 4, q: 'Which queen is recorded as saying she would be good, on learning she would inherit the throne?', a: 'Victoria', d: ['Elizabeth I', 'Anne', 'Mary II'] },
{ c: 'Science, Letters & Ideas', t: 4, q: 'The line about the most adaptable species surviving is routinely credited to Charles Darwin. Who actually wrote it?', a: 'A business professor, Leon Megginson', d: ['Herbert Spencer', 'Thomas Huxley', 'Alfred Russel Wallace'] },
{ c: 'Books & Authors', t: 4, q: 'Which poet concluded that what will survive of us is love?', a: 'Philip Larkin', d: ['Ted Hughes', 'Thom Gunn', 'Louis MacNeice'] },
{ c: 'Screen Lines', t: 4, q: "Which character has the last line of Some Like It Hot, 'Nobody's perfect'?", a: 'Osgood Fielding III', d: ['Joe', 'Jerry', 'Sugar Kane'] },

{ c: 'Presidents & Politics', t: 5, q: 'Which Roman statesman ended every speech by insisting that Carthage must be destroyed?', a: 'Cato the Elder', d: ['Cicero', 'Scipio Africanus', 'Sulla'] },
{ c: 'History & War', t: 5, q: 'Which Union colonel ordered bayonets fixed as his regiment ran out of ammunition at Little Round Top?', a: 'Joshua Chamberlain', d: ['George Meade', 'Winfield Hancock', 'Gouverneur Warren'] },
{ c: 'Science, Letters & Ideas', t: 5, q: 'Which writer held that when a distinguished elderly scientist calls something impossible, he is very probably wrong?', a: 'Arthur C. Clarke', d: ['Isaac Asimov', 'Robert Heinlein', 'Frank Herbert'] },
{ c: 'Books & Authors', t: 5, q: "Which novelist opened a book by declaring 'I am an invisible man'?", a: 'Ralph Ellison', d: ['James Baldwin', 'Richard Wright', 'Toni Morrison'] },
{ c: 'Screen Lines', t: 5, q: 'Which character in Rocky orders his corner man to cut him between rounds?', a: 'Rocky Balboa', d: ['Apollo Creed', 'Mickey Goldmill', 'Paulie Pennino'] },
],

// ── Day 10 ─────────────────────────────────────────────────────────────────
[
{ c: 'Presidents & Politics', t: 1, q: 'Which president was sworn in by lamplight at the family farm, by his own father?', a: 'Calvin Coolidge', d: ['Herbert Hoover', 'Warren G. Harding', 'Theodore Roosevelt'] },
{ c: 'History & War', t: 1, q: "Which broadcaster signed off his programmes with 'Good night, and good luck'?", a: 'Edward R. Murrow', d: ['Walter Cronkite', 'Eric Sevareid', 'Lowell Thomas'] },
{ c: 'Science, Letters & Ideas', t: 1, q: 'Which computing pioneer popularised the story of the moth taped into a Harvard Mark II logbook?', a: 'Grace Hopper', d: ['Ada Lovelace', 'Alan Turing', 'John von Neumann'] },
{ c: 'Books & Authors', t: 1, q: 'Which novel opens with the Mole spring-cleaning his little home?', a: 'The Wind in the Willows', d: ['Watership Down', 'The Tale of Peter Rabbit', 'Winnie-the-Pooh'] },
{ c: 'Screen Lines', t: 1, q: "Which character taunts Batman with 'Why so serious?' in The Dark Knight?", a: 'The Joker', d: ['Harvey Dent', 'Commissioner Gordon', 'Carmine Falcone'] },

{ c: 'Presidents & Politics', t: 2, q: 'Which prime minister told an interviewer there is no such thing as society?', a: 'Margaret Thatcher', d: ['John Major', 'Edward Heath', 'Harold Wilson'] },
{ c: 'History & War', t: 2, q: 'Which Texan commander led the charge at San Jacinto under the cry to remember the Alamo?', a: 'Sam Houston', d: ['Davy Crockett', 'Jim Bowie', 'Stephen F. Austin'] },
{ c: 'Science, Letters & Ideas', t: 2, q: 'Which naturalist wrote that tugging at a single thing in nature finds it hitched to everything else?', a: 'John Muir', d: ['Henry David Thoreau', 'Aldo Leopold', 'Rachel Carson'] },
{ c: 'Books & Authors', t: 2, q: 'Which novelist wrote that whatever souls are made of, his and hers are the same?', a: 'Emily Bronte', d: ['Charlotte Bronte', 'Anne Bronte', 'Elizabeth Gaskell'] },
{ c: 'Screen Lines', t: 2, q: "Which character signs off with 'Yippee-ki-yay' in Die Hard?", a: 'John McClane', d: ['Hans Gruber', 'Sergeant Al Powell', 'Holly Gennero'] },

{ c: 'Presidents & Politics', t: 3, q: "Which vice president said the office was not worth a bucket of warm spit?", a: 'John Nance Garner', d: ['Harry S. Truman', 'Alben Barkley', 'Hubert Humphrey'] },
{ c: 'History & War', t: 3, q: 'Which pamphleteer wrote that these are the times that try mens souls?', a: 'Thomas Paine', d: ['Samuel Adams', 'Patrick Henry', 'Benjamin Rush'] },
{ c: 'Science, Letters & Ideas', t: 3, q: 'Which mathematician said God made the integers and all else is the work of man?', a: 'Leopold Kronecker', d: ['Georg Cantor', 'Karl Weierstrass', 'David Hilbert'] },
{ c: 'Books & Authors', t: 3, q: 'Which playwright wrote that we are all in the gutter, but some of us are looking at the stars?', a: 'Oscar Wilde', d: ['George Bernard Shaw', 'W. B. Yeats', 'Aubrey Beardsley'] },
{ c: 'Screen Lines', t: 3, q: "Which character demands 'Say what again' in Pulp Fiction?", a: 'Jules Winnfield', d: ['Vincent Vega', 'Marsellus Wallace', 'Butch Coolidge'] },

{ c: 'Presidents & Politics', t: 4, q: 'Which president told the country on taking office that our long national nightmare is over?', a: 'Gerald Ford', d: ['Jimmy Carter', 'Richard Nixon', 'Lyndon B. Johnson'] },
{ c: 'History & War', t: 4, q: 'Which American commander reported that we have met the enemy and they are ours?', a: 'Oliver Hazard Perry', d: ['John Paul Jones', 'David Farragut', 'Stephen Decatur'] },
{ c: 'Science, Letters & Ideas', t: 4, q: 'Which thinker coined the warning that the map is not the territory?', a: 'Alfred Korzybski', d: ['Ludwig Wittgenstein', 'Ferdinand de Saussure', 'Charles Peirce'] },
{ c: 'Books & Authors', t: 4, q: "Which poet titled a work 'I Sing the Body Electric'?", a: 'Walt Whitman', d: ['Emily Dickinson', 'Hart Crane', 'Carl Sandburg'] },
{ c: 'Screen Lines', t: 4, q: "Which character screams that Soylent Green is people?", a: 'Detective Thorn', d: ['Sol Roth', 'Governor Santini', 'Shirl'] },

{ c: 'Presidents & Politics', t: 5, q: 'Which Roman consul opened a prosecution by asking how long the accused would abuse their patience?', a: 'Cicero', d: ['Cato the Elder', 'Julius Caesar', 'Sulla'] },
{ c: 'History & War', t: 5, q: 'Which admiral wrote the dispatch reporting the victory at Trafalgar and the death of his commander?', a: 'Cuthbert Collingwood', d: ['Thomas Hardy', 'John Jervis', 'Edward Codrington'] },
{ c: 'Science, Letters & Ideas', t: 5, q: 'Which Greek thinker held that war is the father and king of all things?', a: 'Heraclitus', d: ['Parmenides', 'Zeno of Elea', 'Anaximander'] },
{ c: 'Books & Authors', t: 5, q: "Which novelist took her title from the line about the heart being a lonely hunter?", a: 'Carson McCullers', d: ["Flannery O'Connor", 'Eudora Welty', 'Katherine Anne Porter'] },
{ c: 'Screen Lines', t: 5, q: 'Which character protests that you cannot fight in here, because this is the War Room?', a: 'President Merkin Muffley', d: ['General Turgidson', 'Dr. Strangelove', 'Group Captain Mandrake'] },
],

// ── Day 11 ─────────────────────────────────────────────────────────────────
[
{ c: 'Presidents & Politics', t: 1, q: "Which president was carried into office on the slogan 'I like Ike'?", a: 'Dwight D. Eisenhower', d: ['Harry S. Truman', 'Richard Nixon', 'Adlai Stevenson'] },
{ c: 'History & War', t: 1, q: "Which preacher closed a 1963 speech with the cry 'Free at last, free at last'?", a: 'Martin Luther King Jr.', d: ['Ralph Abernathy', 'Jesse Jackson', 'Andrew Young'] },
{ c: 'Science, Letters & Ideas', t: 1, q: 'Which primatologist wrote that what you do makes a difference and you have to decide what kind of difference to make?', a: 'Jane Goodall', d: ['Dian Fossey', 'Birute Galdikas', 'Rachel Carson'] },
{ c: 'Books & Authors', t: 1, q: 'Which novel opens by saying that all children, except one, grow up?', a: 'Peter Pan', d: ['The Secret Garden', "Alice's Adventures in Wonderland", 'The Wind in the Willows'] },
{ c: 'Screen Lines', t: 1, q: 'Which character orders a martini shaken, not stirred, across the 007 films?', a: 'James Bond', d: ['Felix Leiter', 'Ernst Stavro Blofeld', 'M'] },

{ c: 'Presidents & Politics', t: 2, q: "Whose 1992 campaign headquarters posted the reminder about the economy?", a: 'Bill Clinton', d: ['George H. W. Bush', 'Ross Perot', 'Paul Tsongas'] },
{ c: 'History & War', t: 2, q: 'Which exiled officer broadcast from London in 1940 that the flame of French resistance must not go out?', a: 'Charles de Gaulle', d: ['Philippe Petain', 'Jean Moulin', 'Pierre Laval'] },
{ c: 'Science, Letters & Ideas', t: 2, q: 'Which physicist said he thought he could safely say that nobody understands quantum mechanics?', a: 'Richard Feynman', d: ['Niels Bohr', 'Werner Heisenberg', 'Paul Dirac'] },
{ c: 'Books & Authors', t: 2, q: 'Which novel opens with the claim that someone must have slandered Josef K.?', a: 'The Trial', d: ['The Castle', 'The Metamorphosis', 'Amerika'] },
{ c: 'Screen Lines', t: 2, q: 'Which character turns on the crowd and demands to know whether they are not entertained?', a: 'Maximus', d: ['Commodus', 'Proximo', 'Juba'] },

{ c: 'Presidents & Politics', t: 3, q: 'Which president promised in his first inaugural peace and honest friendship with all nations, entangling alliances with none?', a: 'Thomas Jefferson', d: ['George Washington', 'John Adams', 'James Monroe'] },
{ c: 'History & War', t: 3, q: "The greeting 'Lafayette, we are here' is usually credited to General Pershing. Which of his officers actually said it?", a: 'Charles E. Stanton', d: ['Douglas MacArthur', 'Peyton March', 'Tasker Bliss'] },
{ c: 'Science, Letters & Ideas', t: 3, q: 'Which chemist observed that in the field of observation, chance favours only the prepared mind?', a: 'Louis Pasteur', d: ['Robert Koch', 'Joseph Lister', 'Antoine Lavoisier'] },
{ c: 'Books & Authors', t: 3, q: "Which character in To Kill a Mockingbird advises climbing into someone's skin and walking around in it?", a: 'Atticus Finch', d: ['Scout Finch', 'Jem Finch', 'Calpurnia'] },
{ c: 'Screen Lines', t: 3, q: "Which character announces 'They're here' in Poltergeist?", a: 'Carol Anne Freeling', d: ['Diane Freeling', 'Steve Freeling', 'Tangina Barrons'] },

{ c: 'Presidents & Politics', t: 4, q: 'Which president described the office he held as a bully pulpit?', a: 'Theodore Roosevelt', d: ['William McKinley', 'Woodrow Wilson', 'William Howard Taft'] },
{ c: 'History & War', t: 4, q: 'Which Ottoman commander told his men at Gallipoli that he was not ordering them to attack but to die?', a: 'Mustafa Kemal Ataturk', d: ['Enver Pasha', 'Liman von Sanders', 'Talaat Pasha'] },
{ c: 'Science, Letters & Ideas', t: 4, q: 'Which philosopher wrote of the starry heavens above him and the moral law within him?', a: 'Immanuel Kant', d: ['Georg Hegel', 'Johann Fichte', 'Arthur Schopenhauer'] },
{ c: 'Books & Authors', t: 4, q: 'Which poet addressed a tiger burning bright in the forests of the night?', a: 'William Blake', d: ['Samuel Taylor Coleridge', 'Robert Burns', 'William Cowper'] },
{ c: 'Screen Lines', t: 4, q: 'Which character invites a cornered gunman to make his day and asks whether he feels lucky?', a: 'Harry Callahan', d: ['Scorpio', 'Chief Inspector Bressler', 'Chico Gonzalez'] },

{ c: 'Presidents & Politics', t: 5, q: 'Which Canadian prime minister said the state has no business in the bedrooms of the nation?', a: 'Pierre Trudeau', d: ['Lester Pearson', 'John Diefenbaker', 'Brian Mulroney'] },
{ c: 'History & War', t: 5, q: 'Which Persian king had his victories carved into a cliff face at Behistun?', a: 'Darius I', d: ['Cyrus the Great', 'Xerxes', 'Artaxerxes'] },
{ c: 'Science, Letters & Ideas', t: 5, q: 'Which medieval friar gave his name to the principle that entities should not be multiplied beyond necessity?', a: 'William of Ockham', d: ['Thomas Aquinas', 'Duns Scotus', 'Roger Bacon'] },
{ c: 'Books & Authors', t: 5, q: "Which novelist opened a book with ships at a distance carrying every man's wish on board?", a: 'Zora Neale Hurston', d: ['Nella Larsen', 'Jean Toomer', 'Countee Cullen'] },
{ c: 'Screen Lines', t: 5, q: "Which character keeps asking 'What's in the box?' at the end of Se7en?", a: 'Detective Mills', d: ['Detective Somerset', 'John Doe', 'Tracy Mills'] },
],

// ── Day 12 ─────────────────────────────────────────────────────────────────
[
{ c: 'Presidents & Politics', t: 1, q: "Which president was elected on the slogan 'Tippecanoe and Tyler too'?", a: 'William Henry Harrison', d: ['Martin Van Buren', 'Zachary Taylor', 'James K. Polk'] },
{ c: 'History & War', t: 1, q: "Asked in 1922 whether he could see anything inside a newly opened tomb, which archaeologist replied 'Yes, wonderful things'?", a: 'Howard Carter', d: ['Flinders Petrie', 'Leonard Woolley', 'Arthur Evans'] },
{ c: 'Science, Letters & Ideas', t: 1, q: 'Which nurse said before her execution in 1915 that patriotism is not enough?', a: 'Edith Cavell', d: ['Florence Nightingale', 'Mary Seacole', 'Clara Barton'] },
{ c: 'Books & Authors', t: 1, q: 'Which novel opens with a woman announcing that she would buy the flowers herself?', a: 'Mrs Dalloway', d: ['To the Lighthouse', 'Orlando', 'The Waves'] },
{ c: 'Screen Lines', t: 1, q: "Which character roars 'You shall not pass!' on a bridge in The Fellowship of the Ring?", a: 'Gandalf', d: ['Aragorn', 'Frodo Baggins', 'Boromir'] },

{ c: 'Presidents & Politics', t: 2, q: "Which candidate ran in 1964 on the slogan 'In your heart, you know he's right'?", a: 'Barry Goldwater', d: ['Richard Nixon', 'Nelson Rockefeller', 'George Romney'] },
{ c: 'History & War', t: 2, q: 'Who told Parliament in 1940 that never was so much owed by so many to so few?', a: 'Winston Churchill', d: ['Hugh Dowding', 'Clement Attlee', 'Anthony Eden'] },
{ c: 'Science, Letters & Ideas', t: 2, q: 'Which chemist wrote that nothing is created in the operations of art or of nature, matter being equal before and after?', a: 'Antoine Lavoisier', d: ['Joseph Priestley', 'Henry Cavendish', 'John Dalton'] },
{ c: 'Books & Authors', t: 2, q: "Which novel opens 'Mother died today. Or maybe yesterday, I can't be sure'?", a: 'The Stranger', d: ['Nausea', 'The Plague', 'The Fall'] },
{ c: 'Screen Lines', t: 2, q: "Which character shouts 'Run, Forrest, run!' at a boy being chased?", a: 'Jenny Curran', d: ['Forrest Gump', 'Lieutenant Dan', 'Mrs. Gump'] },

{ c: 'Presidents & Politics', t: 3, q: 'Which prime minister told a 1957 audience that most of the people had never had it so good?', a: 'Harold Macmillan', d: ['Anthony Eden', 'Harold Wilson', 'Clement Attlee'] },
{ c: 'History & War', t: 3, q: 'Which president asked Congress in 1917 for a war to make the world safe for democracy?', a: 'Woodrow Wilson', d: ['Theodore Roosevelt', 'William Howard Taft', 'Warren G. Harding'] },
{ c: 'Science, Letters & Ideas', t: 3, q: 'Which American jurist wrote that the life of the law has not been logic but experience?', a: 'Oliver Wendell Holmes Jr.', d: ['Louis Brandeis', 'Learned Hand', 'Benjamin Cardozo'] },
{ c: 'Books & Authors', t: 3, q: "Which novelist took 'Only connect' as the epigraph of a novel?", a: 'E. M. Forster', d: ['Virginia Woolf', 'D. H. Lawrence', 'Ford Madox Ford'] },
{ c: 'Screen Lines', t: 3, q: "Which character orders his men to round up the usual suspects in Casablanca?", a: 'Captain Renault', d: ['Rick Blaine', 'Major Strasser', 'Victor Laszlo'] },

{ c: 'Presidents & Politics', t: 4, q: 'Which president told Congress in 1861 that there can be no successful appeal from a ballot to a bullet?', a: 'Abraham Lincoln', d: ['Frederick Douglass', 'Ulysses S. Grant', 'Andrew Johnson'] },
{ c: 'History & War', t: 4, q: "Which pope is said to have launched the First Crusade with the cry 'God wills it'?", a: 'Urban II', d: ['Gregory VII', 'Innocent III', 'Leo IX'] },
{ c: 'Science, Letters & Ideas', t: 4, q: 'Which economist described capitalism as a process of creative destruction?', a: 'Joseph Schumpeter', d: ['John Maynard Keynes', 'Friedrich Hayek', 'Thorstein Veblen'] },
{ c: 'Books & Authors', t: 4, q: 'Which poet addressed autumn as a season of mists and mellow fruitfulness?', a: 'John Keats', d: ['Percy Bysshe Shelley', 'Lord Byron', 'Robert Burns'] },
{ c: 'Screen Lines', t: 4, q: "Which character whips up a crowd chanting 'Attica!' in Dog Day Afternoon?", a: 'Sonny Wortzik', d: ['Sal Naturile', 'Detective Moretti', 'Leon Shermer'] },

{ c: 'Presidents & Politics', t: 5, q: 'Which Piedmontese statesman called for a free church in a free state?', a: 'Camillo Cavour', d: ["Massimo d'Azeglio", 'Giuseppe Garibaldi', 'Giuseppe Mazzini'] },
{ c: 'History & War', t: 5, q: 'Which Prussian theorist wrote that war is the continuation of policy by other means?', a: 'Carl von Clausewitz', d: ['Antoine-Henri Jomini', 'Helmuth von Moltke', 'Alfred von Schlieffen'] },
{ c: 'Science, Letters & Ideas', t: 5, q: 'Which sociologist wrote about the Protestant ethic and the spirit of capitalism?', a: 'Max Weber', d: ['Emile Durkheim', 'Georg Simmel', 'Ferdinand Tonnies'] },
{ c: 'Books & Authors', t: 5, q: "Which novelist opened a book with a stately, plump man coming from the stairhead?", a: 'James Joyce', d: ['Samuel Beckett', "Flann O'Brien", "Sean O'Casey"] },
{ c: 'Screen Lines', t: 5, q: "Which character says 'you're trying to seduce me' in The Graduate?", a: 'Benjamin Braddock', d: ['Mrs. Robinson', 'Elaine Robinson', 'Mr. Braddock'] },
],

// ── Day 13 ─────────────────────────────────────────────────────────────────
[
{ c: 'Presidents & Politics', t: 1, q: "Which president's 1928 campaign advertised a chicken in every pot?", a: 'Herbert Hoover', d: ['Calvin Coolidge', 'Warren G. Harding', 'Alfred E. Smith'] },
{ c: 'History & War', t: 1, q: "Which aviator flew the Atlantic alone in 1927 and called his memoir 'We'?", a: 'Charles Lindbergh', d: ['Amelia Earhart', 'Wiley Post', 'Richard Byrd'] },
{ c: 'Science, Letters & Ideas', t: 1, q: 'Which reformer wrote that the very first requirement in a hospital is that it should do the sick no harm?', a: 'Florence Nightingale', d: ['Mary Seacole', 'Clara Barton', 'Dorothea Dix'] },
{ c: 'Books & Authors', t: 1, q: 'Which novel opens with a great fish moving silently through the night water?', a: 'Jaws', d: ['Moby-Dick', 'The Old Man and the Sea', 'Twenty Thousand Leagues Under the Sea'] },
{ c: 'Screen Lines', t: 1, q: "Which character insists there's no crying in baseball in A League of Their Own?", a: 'Jimmy Dugan', d: ['Dottie Hinson', 'Kit Keller', 'Marla Hooch'] },

{ c: 'Presidents & Politics', t: 2, q: 'Which president said that every gun made and every warship launched signifies a theft from those who hunger?', a: 'Dwight D. Eisenhower', d: ['John F. Kennedy', 'Harry S. Truman', 'Lyndon B. Johnson'] },
{ c: 'History & War', t: 2, q: 'Which commander declared the die was cast as he crossed a small river into Italy?', a: 'Julius Caesar', d: ['Sulla', 'Pompey', 'Mark Antony'] },
{ c: 'Science, Letters & Ideas', t: 2, q: 'Which astronomer wrote that the book of nature is written in the language of mathematics?', a: 'Galileo Galilei', d: ['Johannes Kepler', 'Nicolaus Copernicus', 'Tycho Brahe'] },
{ c: 'Books & Authors', t: 2, q: 'Which novel opens with a colonel facing a firing squad and remembering a distant afternoon?', a: 'One Hundred Years of Solitude', d: ['Love in the Time of Cholera', 'The Autumn of the Patriarch', 'Pedro Paramo'] },
{ c: 'Screen Lines', t: 2, q: "Which character shouts 'I'm the king of the world!' from a ship's bow?", a: 'Jack Dawson', d: ['Rose DeWitt Bukater', 'Cal Hockley', 'Captain Smith'] },

{ c: 'Presidents & Politics', t: 3, q: 'Which humorist joked that he belonged to no organized political party, being a Democrat?', a: 'Will Rogers', d: ['Mark Twain', 'H. L. Mencken', 'Ambrose Bierce'] },
{ c: 'History & War', t: 3, q: 'Which Chinese leader wrote that a revolution is not a dinner party?', a: 'Mao Zedong', d: ['Zhou Enlai', 'Deng Xiaoping', 'Sun Yat-sen'] },
{ c: 'Science, Letters & Ideas', t: 3, q: 'Which French thinker declared that property is theft?', a: 'Pierre-Joseph Proudhon', d: ['Mikhail Bakunin', 'Peter Kropotkin', 'Georges Sorel'] },
{ c: 'Books & Authors', t: 3, q: 'Which novel ends by warning never to tell anybody anything, or you start missing everybody?', a: 'The Catcher in the Rye', d: ['Franny and Zooey', 'A Separate Peace', 'On the Road'] },
{ c: 'Screen Lines', t: 3, q: 'Which character, asked by a Mississippi police chief what he is called back home, answers with a title in front of his surname?', a: 'Virgil Tibbs', d: ['Chief Gillespie', 'Sam Wood', 'Eric Endicott'] },

{ c: 'Presidents & Politics', t: 4, q: 'Which president called the White House the finest prison in the world?', a: 'Harry S. Truman', d: ['Franklin D. Roosevelt', 'Lyndon B. Johnson', 'Dwight D. Eisenhower'] },
{ c: 'History & War', t: 4, q: 'Which Nez Perce leader surrendered in 1877 saying he would fight no more forever?', a: 'Chief Joseph', d: ['Sitting Bull', 'Crazy Horse', 'Geronimo'] },
{ c: 'Science, Letters & Ideas', t: 4, q: 'Which mathematician opened a 1950 paper by asking whether machines can think?', a: 'Alan Turing', d: ['John von Neumann', 'Claude Shannon', 'Norbert Wiener'] },
{ c: 'Books & Authors', t: 4, q: 'Which poet put the boast of a king of kings on a shattered statue in the desert?', a: 'Percy Bysshe Shelley', d: ['Lord Byron', 'John Keats', 'William Wordsworth'] },
{ c: 'Screen Lines', t: 4, q: 'Which character calls out to a volleyball named Wilson in Cast Away?', a: 'Chuck Noland', d: ['Kelly Frears', 'Stan', 'Bettina Peterson'] },

{ c: 'Presidents & Politics', t: 5, q: 'Which Irish rebel asked at his 1803 trial that no man write his epitaph?', a: 'Robert Emmet', d: ['Wolfe Tone', "Daniel O'Connell", 'Charles Stewart Parnell'] },
{ c: 'History & War', t: 5, q: 'Which conqueror is quoted in Persian chronicles as calling himself the punishment of God?', a: 'Genghis Khan', d: ['Timur', 'Kublai Khan', 'Hulagu Khan'] },
{ c: 'Science, Letters & Ideas', t: 5, q: 'Which Roman emperor filled a private notebook with the reminder to do every act as if it were his last?', a: 'Marcus Aurelius', d: ['Hadrian', 'Trajan', 'Antoninus Pius'] },
{ c: 'Books & Authors', t: 5, q: 'Which blind poet ended a sonnet by saying they also serve who only stand and wait?', a: 'John Milton', d: ['John Donne', 'George Herbert', 'Andrew Marvell'] },
{ c: 'Screen Lines', t: 5, q: "Which character breathes 'The horror, the horror' at the end of Apocalypse Now?", a: 'Colonel Kurtz', d: ['Captain Willard', 'Lieutenant Colonel Kilgore', 'Chef'] },
],

// ── Day 14 ─────────────────────────────────────────────────────────────────
[
{ c: 'Presidents & Politics', t: 1, q: 'Which future president was urged by his wife in a 1776 letter to remember the ladies?', a: 'John Adams', d: ['Thomas Jefferson', 'George Washington', 'James Madison'] },
{ c: 'History & War', t: 1, q: 'Which aviator wrote that adventure is worthwhile in itself?', a: 'Amelia Earhart', d: ['Bessie Coleman', 'Beryl Markham', 'Jacqueline Cochran'] },
{ c: 'Science, Letters & Ideas', t: 1, q: 'Which painter wrote to his brother that he was always doing what he could not do yet, in order to learn how?', a: 'Vincent van Gogh', d: ['Paul Gauguin', 'Paul Cezanne', 'Claude Monet'] },
{ c: 'Books & Authors', t: 1, q: 'Which novella follows a riverboat journey up the Congo in search of a man named Kurtz?', a: 'Heart of Darkness', d: ['Lord Jim', 'Typhoon', 'The Secret Agent'] },
{ c: 'Screen Lines', t: 1, q: "Which character ends a press conference by announcing 'I am Iron Man'?", a: 'Tony Stark', d: ['Pepper Potts', 'James Rhodes', 'Obadiah Stane'] },

{ c: 'Presidents & Politics', t: 2, q: 'Which president called for a thousand points of light?', a: 'George H. W. Bush', d: ['Ronald Reagan', 'Bill Clinton', 'Bob Dole'] },
{ c: 'History & War', t: 2, q: 'Which admiral died at Trafalgar giving thanks that he had done his duty?', a: 'Horatio Nelson', d: ['Cuthbert Collingwood', 'John Jervis', 'Adam Duncan'] },
{ c: 'Science, Letters & Ideas', t: 2, q: 'Which mathematician claimed a marvellous proof that the margin was too narrow to contain?', a: 'Pierre de Fermat', d: ['Blaise Pascal', 'Rene Descartes', 'Leonhard Euler'] },
{ c: 'Books & Authors', t: 2, q: 'Which novel opens by saying there was no possibility of taking a walk that day?', a: 'Jane Eyre', d: ['Wuthering Heights', 'Villette', 'Agnes Grey'] },
{ c: 'Screen Lines', t: 2, q: 'Which character asks a shopkeeper what is the most he ever lost on a coin toss?', a: 'Anton Chigurh', d: ['Llewelyn Moss', 'Sheriff Ed Tom Bell', 'Carson Wells'] },

{ c: 'Presidents & Politics', t: 3, q: 'Which politician defended a gift dog in a televised speech in 1952?', a: 'Richard Nixon', d: ['Dwight D. Eisenhower', 'Adlai Stevenson', 'Estes Kefauver'] },
{ c: 'History & War', t: 3, q: 'Which pilot commanded the bomber named for his mother over Hiroshima?', a: 'Paul Tibbets', d: ['Charles Sweeney', 'Curtis LeMay', 'Thomas Ferebee'] },
{ c: 'Science, Letters & Ideas', t: 3, q: 'Which Greek physician gave medicine the injunction to help, or at least to do no harm?', a: 'Hippocrates', d: ['Galen', 'Avicenna', 'Paracelsus'] },
{ c: 'Books & Authors', t: 3, q: 'Which novelist gave her creature the warning to beware, for he was fearless and therefore powerful?', a: 'Mary Shelley', d: ['Ann Radcliffe', 'Charlotte Bronte', 'Bram Stoker'] },
{ c: 'Screen Lines', t: 3, q: 'Which character insists that nobody calls him chicken in Back to the Future?', a: 'Marty McFly', d: ['Doc Brown', 'Biff Tannen', 'George McFly'] },

{ c: 'Presidents & Politics', t: 4, q: 'Which Speaker of the House made his motto that all politics is local?', a: "Tip O'Neill", d: ['Sam Rayburn', 'Newt Gingrich', 'Carl Albert'] },
{ c: 'History & War', t: 4, q: 'Which mortally wounded American captain told his crew not to give up the ship?', a: 'James Lawrence', d: ['Oliver Hazard Perry', 'John Paul Jones', 'Stephen Decatur'] },
{ c: 'Science, Letters & Ideas', t: 4, q: "Which biologist coined the word 'agnostic' to describe his own position?", a: 'Thomas Huxley', d: ['Charles Darwin', 'Herbert Spencer', 'John Tyndall'] },
{ c: 'Books & Authors', t: 4, q: 'Which poet told his coy mistress that had they but world enough, and time?', a: 'Andrew Marvell', d: ['John Donne', 'Robert Herrick', 'Richard Lovelace'] },
{ c: 'Screen Lines', t: 4, q: "Which character tells a child 'You is kind. You is smart. You is important' in The Help?", a: 'Aibileen Clark', d: ['Skeeter Phelan', 'Minny Jackson', 'Hilly Holbrook'] },

{ c: 'Presidents & Politics', t: 5, q: 'Which Labour attorney general told the Commons in 1946 that we are the masters at the moment?', a: 'Hartley Shawcross', d: ['Clement Attlee', 'Aneurin Bevan', 'Herbert Morrison'] },
{ c: 'History & War', t: 5, q: 'Which Athenian general argued against the Sicilian expedition and was sent to lead it anyway?', a: 'Nicias', d: ['Alcibiades', 'Cleon', 'Demosthenes'] },
{ c: 'Science, Letters & Ideas', t: 5, q: 'Which Danish philosopher wrote that the greatest hazard of all, losing oneself, can pass unnoticed?', a: 'Soren Kierkegaard', d: ['Friedrich Nietzsche', 'Arthur Schopenhauer', 'Martin Heidegger'] },
{ c: 'Books & Authors', t: 5, q: "Which character answers every request with 'I would prefer not to'?", a: 'Bartleby', d: ['Billy Budd', 'Captain Ahab', 'Ishmael'] },
{ c: 'Screen Lines', t: 5, q: "Which character sneers that they have no badges in The Treasure of the Sierra Madre?", a: 'Gold Hat', d: ['Fred C. Dobbs', 'Howard', 'Bob Curtin'] },
],

// ── Day 15 ─────────────────────────────────────────────────────────────────
[
{ c: 'Presidents & Politics', t: 1, q: 'Which president opened his second inaugural with malice toward none and charity for all?', a: 'Abraham Lincoln', d: ['Andrew Johnson', 'Ulysses S. Grant', 'Rutherford B. Hayes'] },
{ c: 'History & War', t: 1, q: 'Which explorer lost his ship Endurance in the ice and brought every man home alive?', a: 'Ernest Shackleton', d: ['Robert Falcon Scott', 'Roald Amundsen', 'Douglas Mawson'] },
{ c: 'Science, Letters & Ideas', t: 1, q: 'Which experimenter wrote that nothing is too wonderful to be true?', a: 'Michael Faraday', d: ['James Clerk Maxwell', 'Humphry Davy', 'Lord Kelvin'] },
{ c: 'Books & Authors', t: 1, q: 'Which novel opens by wondering whether the narrator will turn out to be the hero of his own life?', a: 'David Copperfield', d: ['Great Expectations', 'Oliver Twist', 'Nicholas Nickleby'] },
{ c: 'Screen Lines', t: 1, q: "Which character says 'That'll do, pig' in Babe?", a: 'Farmer Hoggett', d: ['Babe', 'Fly', 'Rex'] },

{ c: 'Presidents & Politics', t: 2, q: 'Which president told the country in his inaugural to let us begin anew?', a: 'John F. Kennedy', d: ['Lyndon B. Johnson', 'Dwight D. Eisenhower', 'Harry S. Truman'] },
{ c: 'History & War', t: 2, q: 'Which British commander privately described his own soldiers as the scum of the earth?', a: 'The Duke of Wellington', d: ['Horatio Nelson', 'John Moore', 'Thomas Picton'] },
{ c: 'Science, Letters & Ideas', t: 2, q: 'Which mathematician wrote that the essence of mathematics lies in its freedom?', a: 'Georg Cantor', d: ['David Hilbert', 'Henri Poincare', 'Bertrand Russell'] },
{ c: 'Books & Authors', t: 2, q: 'Which novel opens by saying it was love at first sight when Yossarian saw the chaplain?', a: 'Catch-22', d: ['Slaughterhouse-Five', 'The Naked and the Dead', 'From Here to Eternity'] },
{ c: 'Screen Lines', t: 2, q: 'Which character declares that he feels the need for speed in Top Gun?', a: 'Maverick', d: ['Slider', 'Iceman', 'Viper'] },

{ c: 'Presidents & Politics', t: 3, q: 'Which founder wrote into a state constitution the ideal of a government of laws and not of men?', a: 'John Adams', d: ['Thomas Jefferson', 'James Madison', 'Alexander Hamilton'] },
{ c: 'History & War', t: 3, q: "Which leader issued the 1942 order known as 'Not one step back'?", a: 'Joseph Stalin', d: ['Georgy Zhukov', 'Kliment Voroshilov', 'Semyon Timoshenko'] },
{ c: 'Science, Letters & Ideas', t: 3, q: 'Which economist popularised the saying that there is no such thing as a free lunch?', a: 'Milton Friedman', d: ['John Kenneth Galbraith', 'Paul Samuelson', 'Friedrich Hayek'] },
{ c: 'Books & Authors', t: 3, q: 'Which English translator gave us the moving finger that writes and, having writ, moves on?', a: 'Edward FitzGerald', d: ['Alfred Tennyson', 'Robert Browning', 'Matthew Arnold'] },
{ c: 'Screen Lines', t: 3, q: "Which character delivers the news 'Yer a wizard, Harry'?", a: 'Rubeus Hagrid', d: ['Albus Dumbledore', 'Minerva McGonagall', 'Severus Snape'] },

{ c: 'Presidents & Politics', t: 4, q: 'Which chief justice wrote that it is the province and duty of the judiciary to say what the law is?', a: 'John Marshall', d: ['Roger Taney', 'Oliver Wendell Holmes Jr.', 'Earl Warren'] },
{ c: 'History & War', t: 4, q: 'Which Spanish republican orator said it is better to die on your feet than to live on your knees?', a: 'Dolores Ibarruri', d: ['Francisco Largo Caballero', 'Manuel Azana', 'Buenaventura Durruti'] },
{ c: 'Science, Letters & Ideas', t: 4, q: 'Which psychologist warned that if your only tool is a hammer, every problem looks like a nail?', a: 'Abraham Maslow', d: ['B. F. Skinner', 'Carl Rogers', 'Erik Erikson'] },
{ c: 'Books & Authors', t: 4, q: 'Which poet ended a poem by calling himself the master of his fate and the captain of his soul?', a: 'William Ernest Henley', d: ['Rudyard Kipling', 'A. E. Housman', 'Robert Louis Stevenson'] },
{ c: 'Screen Lines', t: 4, q: "Which character slaps a man and orders him to snap out of it in Moonstruck?", a: 'Loretta Castorini', d: ['Ronny Cammareri', 'Rose Castorini', 'Johnny Cammareri'] },

{ c: 'Presidents & Politics', t: 5, q: 'Which Athenian lawgiver defended his reforms in his own surviving verse?', a: 'Solon', d: ['Cleisthenes', 'Pericles', 'Draco'] },
{ c: 'History & War', t: 5, q: "Which historian, writing in Latin, preserved Hannibal's boyhood oath against Rome in his history of the city from its founding?", a: 'Livy', d: ['Polybius', 'Tacitus', 'Sallust'] },
{ c: 'Science, Letters & Ideas', t: 5, q: 'Which photographer said the camera teaches people how to see without a camera?', a: 'Dorothea Lange', d: ['Ansel Adams', 'Walker Evans', 'Margaret Bourke-White'] },
{ c: 'Books & Authors', t: 5, q: "Which poet opened a famous poem with the invitation 'Let us go then, you and I'?", a: 'T. S. Eliot', d: ['Ezra Pound', 'Wallace Stevens', 'Hart Crane'] },
{ c: 'Screen Lines', t: 5, q: 'Which character in Who Framed Roger Rabbit growls that he does not work for toons?', a: 'Eddie Valiant', d: ['Roger Rabbit', 'Jessica Rabbit', 'Judge Doom'] },
],

// ── Day 16 ─────────────────────────────────────────────────────────────────
[
{ c: 'Presidents & Politics', t: 1, q: "Which president told complainers that if they can't stand the heat they should get out of the kitchen?", a: 'Harry S. Truman', d: ['Dwight D. Eisenhower', 'Franklin D. Roosevelt', 'Lyndon B. Johnson'] },
{ c: 'History & War', t: 1, q: 'Which conductor of the Underground Railroad said she never lost a passenger?', a: 'Harriet Tubman', d: ['Sojourner Truth', 'Frederick Douglass', 'Harriet Beecher Stowe'] },
{ c: 'Science, Letters & Ideas', t: 1, q: 'Which Greek is said to have leapt from his bath shouting that he had found it?', a: 'Archimedes', d: ['Pythagoras', 'Thales', 'Euclid'] },
{ c: 'Books & Authors', t: 1, q: 'Which novel opens with a fair-haired boy lowering himself down the last few feet of rock?', a: 'Lord of the Flies', d: ['The Coral Island', 'Robinson Crusoe', 'Treasure Island'] },
{ c: 'Screen Lines', t: 1, q: 'Which character screams after slapping on aftershave in Home Alone?', a: 'Kevin McCallister', d: ['Harry Lyme', 'Marv Merchants', 'Buzz McCallister'] },

{ c: 'Presidents & Politics', t: 2, q: 'Which president told the country in 1979 that it faced a crisis of confidence?', a: 'Jimmy Carter', d: ['Gerald Ford', 'Ronald Reagan', 'Richard Nixon'] },
{ c: 'History & War', t: 2, q: 'Which Roman emperor is said to have joked on his deathbed that he was becoming a god?', a: 'Vespasian', d: ['Titus', 'Domitian', 'Nerva'] },
{ c: 'Science, Letters & Ideas', t: 2, q: 'Which bacteriologist found a mould killing his cultures and turned it into penicillin?', a: 'Alexander Fleming', d: ['Howard Florey', 'Ernst Chain', 'Paul Ehrlich'] },
{ c: 'Books & Authors', t: 2, q: 'Which novel opens by saying that in a village of La Mancha there lived a gentleman?', a: 'Don Quixote', d: ['Lazarillo de Tormes', 'The Trickster of Seville', 'Life Is a Dream'] },
{ c: 'Screen Lines', t: 2, q: "Which character answers 'I love you' with 'Ditto' in Ghost?", a: 'Sam Wheat', d: ['Molly Jensen', 'Oda Mae Brown', 'Carl Bruner'] },

{ c: 'Presidents & Politics', t: 3, q: 'Which trial lawyer joked that he was beginning to believe anybody really could become president?', a: 'Clarence Darrow', d: ['Will Rogers', 'H. L. Mencken', 'Mark Twain'] },
{ c: 'History & War', t: 3, q: 'Which Union general vowed to fight it out on that line if it took all summer?', a: 'Ulysses S. Grant', d: ['William Tecumseh Sherman', 'George Meade', 'Philip Sheridan'] },
{ c: 'Science, Letters & Ideas', t: 3, q: 'Which naturalist closed his greatest book with the image of an entangled bank?', a: 'Charles Darwin', d: ['Alfred Russel Wallace', 'Thomas Huxley', 'Joseph Hooker'] },
{ c: 'Books & Authors', t: 3, q: 'Which poet told his son to keep his head when all about him were losing theirs?', a: 'Rudyard Kipling', d: ['A. E. Housman', 'William Ernest Henley', 'Robert Service'] },
{ c: 'Screen Lines', t: 3, q: "Which character promises 'I'll never let go' in Titanic?", a: 'Rose DeWitt Bukater', d: ['Jack Dawson', 'Cal Hockley', 'Molly Brown'] },

{ c: 'Presidents & Politics', t: 4, q: 'Which Supreme Court justice warned that the Constitution is not a suicide pact?', a: 'Robert H. Jackson', d: ['Hugo Black', 'Felix Frankfurter', 'William O. Douglas'] },
{ c: 'History & War', t: 4, q: 'The preference for a lucky general over a good one is usually credited to Napoleon. Which French cardinal actually asked only whether a general was lucky?', a: 'Cardinal Mazarin', d: ['Cardinal Richelieu', 'Cardinal de Retz', 'Cardinal Fleury'] },
{ c: 'Science, Letters & Ideas', t: 4, q: 'Which philosopher of science made falsifiability the test of a scientific theory?', a: 'Karl Popper', d: ['Thomas Kuhn', 'Imre Lakatos', 'Paul Feyerabend'] },
{ c: 'Books & Authors', t: 4, q: 'Which writer wrote that no man is an island, entire of itself?', a: 'John Donne', d: ['George Herbert', 'Andrew Marvell', 'Henry Vaughan'] },
{ c: 'Screen Lines', t: 4, q: 'Which character tells viewers to get up and shout that they are mad as hell in Network?', a: 'Howard Beale', d: ['Diana Christensen', 'Max Schumacher', 'Frank Hackett'] },

{ c: 'Presidents & Politics', t: 5, q: "Which prime minister spoke of a tryst with destiny at India's independence?", a: 'Jawaharlal Nehru', d: ['Mahatma Gandhi', 'Vallabhbhai Patel', 'B. R. Ambedkar'] },
{ c: 'History & War', t: 5, q: 'Which runner is said to have carried news of the victory at Marathon and died on arrival?', a: 'Pheidippides', d: ['Miltiades', 'Themistocles', 'Aristides'] },
{ c: 'Science, Letters & Ideas', t: 5, q: 'Which logician proved that no consistent formal system can prove every arithmetic truth?', a: 'Kurt Godel', d: ['Alfred Tarski', 'Alonzo Church', 'David Hilbert'] },
{ c: 'Books & Authors', t: 5, q: 'Which poet described half a league onward into the valley of Death?', a: 'Alfred Tennyson', d: ['Robert Browning', 'Matthew Arnold', 'Algernon Swinburne'] },
{ c: 'Screen Lines', t: 5, q: "Which character orders his ship to go to ludicrous speed in Spaceballs?", a: 'Dark Helmet', d: ['Lone Starr', 'Barf', 'President Skroob'] },
],

// ── Day 17 ─────────────────────────────────────────────────────────────────
[
{ c: 'Presidents & Politics', t: 1, q: 'Which candidate closed a 1980 debate by asking voters whether they were better off than four years earlier?', a: 'Ronald Reagan', d: ['Jimmy Carter', 'Gerald Ford', 'Walter Mondale'] },
{ c: 'History & War', t: 1, q: 'Which teenage commander told her judges that she had been sent by God?', a: 'Joan of Arc', d: ['Catherine de Medici', 'Eleanor of Aquitaine', 'Isabella of Castile'] },
{ c: 'Science, Letters & Ideas', t: 1, q: 'Which astronomer insisted that extraordinary claims require extraordinary evidence?', a: 'Carl Sagan', d: ['Neil deGrasse Tyson', 'Isaac Asimov', 'Fred Hoyle'] },
{ c: 'Books & Authors', t: 1, q: "Which novel opens by grumbling that Christmas won't be Christmas without any presents?", a: 'Little Women', d: ['Anne of Green Gables', 'What Katy Did', 'A Little Princess'] },
{ c: 'Screen Lines', t: 1, q: "Which character offers the farewell 'Live long and prosper'?", a: 'Spock', d: ['Captain Kirk', 'Dr. McCoy', 'Montgomery Scott'] },

{ c: 'Presidents & Politics', t: 2, q: 'Which candidate promised in 1976 that he would never lie to the American people?', a: 'Jimmy Carter', d: ['Gerald Ford', 'Ronald Reagan', 'Walter Mondale'] },
{ c: 'History & War', t: 2, q: "Which British king's 1939 broadcast quoted a poem about standing at the gate of the year?", a: 'George VI', d: ['Edward VIII', 'George V', 'Elizabeth II'] },
{ c: 'Science, Letters & Ideas', t: 2, q: 'Which biologist argued that genes, rather than organisms, are the true units of selection?', a: 'Richard Dawkins', d: ['Stephen Jay Gould', 'E. O. Wilson', 'John Maynard Smith'] },
{ c: 'Books & Authors', t: 2, q: 'Which novel opens with a studio filled with the rich odour of roses?', a: 'The Picture of Dorian Gray', d: ['The Woman in White', 'Dracula', 'The Turn of the Screw'] },
{ c: 'Screen Lines', t: 2, q: "Which character keeps declaring events 'Inconceivable!' in The Princess Bride?", a: 'Vizzini', d: ['Inigo Montoya', 'Fezzik', 'Westley'] },

{ c: 'Presidents & Politics', t: 3, q: 'Which secretary of state used a 1947 Harvard speech to propose rebuilding postwar Europe?', a: 'George Marshall', d: ['Dean Acheson', 'Averell Harriman', 'James Byrnes'] },
{ c: 'History & War', t: 3, q: 'Which campaigner told a court in 1873 that her only crime had been to cast a vote?', a: 'Susan B. Anthony', d: ['Elizabeth Cady Stanton', 'Lucretia Mott', 'Alice Paul'] },
{ c: 'Science, Letters & Ideas', t: 3, q: 'Which economist wrote that the ideas of economists and political philosophers are more powerful than is commonly understood?', a: 'John Maynard Keynes', d: ['Alfred Marshall', 'Arthur Pigou', 'Joan Robinson'] },
{ c: 'Books & Authors', t: 3, q: 'Which poet wrote that because she could not stop for Death, he kindly stopped for her?', a: 'Emily Dickinson', d: ['Christina Rossetti', 'Elizabeth Barrett Browning', 'Edna St. Vincent Millay'] },
{ c: 'Screen Lines', t: 3, q: "Which character insists 'I am the one who knocks' in Breaking Bad?", a: 'Walter White', d: ['Jesse Pinkman', 'Hank Schrader', 'Skyler White'] },

{ c: 'Presidents & Politics', t: 4, q: 'Which senator ended his reply to Robert Hayne with liberty and union, now and forever?', a: 'Daniel Webster', d: ['Henry Clay', 'John C. Calhoun', 'Thomas Hart Benton'] },
{ c: 'History & War', t: 4, q: 'Which emperor is said to have cried out for a defeated commander to give him back his legions?', a: 'Augustus', d: ['Tiberius', 'Claudius', 'Julius Caesar'] },
{ c: 'Science, Letters & Ideas', t: 4, q: 'Which historian of science argued that science advances by paradigm shifts rather than steady accumulation?', a: 'Thomas Kuhn', d: ['Karl Popper', 'Imre Lakatos', 'Paul Feyerabend'] },
{ c: 'Books & Authors', t: 4, q: 'Which author wrote that all that is gold does not glitter?', a: 'J. R. R. Tolkien', d: ['C. S. Lewis', 'Ursula K. Le Guin', 'T. H. White'] },
{ c: 'Screen Lines', t: 4, q: "Which character says the greatest trick the Devil pulled was convincing the world he did not exist?", a: 'Verbal Kint', d: ['Dean Keaton', 'Agent Kujan', 'Michael McManus'] },

{ c: 'Presidents & Politics', t: 5, q: 'Which Florentine wrote that it is safer to be feared than loved, if you cannot be both?', a: 'Niccolo Machiavelli', d: ['Francesco Guicciardini', 'Baldassare Castiglione', 'Leon Battista Alberti'] },
{ c: 'History & War', t: 5, q: 'Which Greek poet wrote the Thermopylae epitaph for the seer Megistias, his own guest-friend?', a: 'Simonides', d: ['Pindar', 'Bacchylides', 'Anacreon'] },
{ c: 'Science, Letters & Ideas', t: 5, q: "Which physicist popularised the term 'black hole' in the late 1960s?", a: 'John Archibald Wheeler', d: ['Stephen Hawking', 'Roger Penrose', 'Subrahmanyan Chandrasekhar'] },
{ c: 'Books & Authors', t: 5, q: "Which novelist took a title from Robert Burns's line about the best laid schemes?", a: 'John Steinbeck', d: ['Ernest Hemingway', 'William Faulkner', 'Sherwood Anderson'] },
{ c: 'Screen Lines', t: 5, q: "Which character panics with 'Game over, man!' in Aliens?", a: 'Private Hudson', d: ['Ellen Ripley', 'Corporal Hicks', 'Carter Burke'] },
],

// ── Day 18 ─────────────────────────────────────────────────────────────────
[
{ c: 'Presidents & Politics', t: 1, q: 'Which president told a 1936 rally that he welcomed the hatred of the financial interests?', a: 'Franklin D. Roosevelt', d: ['Woodrow Wilson', 'Theodore Roosevelt', 'Harry S. Truman'] },
{ c: 'History & War', t: 1, q: "Which leader named his campaign of nonviolent resistance 'satyagraha', or truth-force?", a: 'Mahatma Gandhi', d: ['Jawaharlal Nehru', 'Subhas Chandra Bose', 'B. R. Ambedkar'] },
{ c: 'Science, Letters & Ideas', t: 1, q: 'Which scientist was the first person to win Nobel Prizes in two different sciences?', a: 'Marie Curie', d: ['Linus Pauling', 'John Bardeen', 'Frederick Sanger'] },
{ c: 'Books & Authors', t: 1, q: "Which story begins with a mother telling her four children to keep out of Mr. McGregor's garden?", a: 'The Tale of Peter Rabbit', d: ['The Wind in the Willows', 'Winnie-the-Pooh', 'The Tale of Squirrel Nutkin'] },
{ c: 'Screen Lines', t: 1, q: 'Which character tells Simba to remember who he is in The Lion King?', a: 'Mufasa', d: ['Scar', 'Rafiki', 'Zazu'] },

{ c: 'Presidents & Politics', t: 2, q: 'Which British statesman coined the phrase about a special relationship between Britain and the United States?', a: 'Winston Churchill', d: ['Clement Attlee', 'Anthony Eden', 'Harold Macmillan'] },
{ c: 'History & War', t: 2, q: 'Which Roman emperor was greeted at a staged naval battle by men saying that those about to die salute him?', a: 'Claudius', d: ['Caligula', 'Nero', 'Tiberius'] },
{ c: 'Science, Letters & Ideas', t: 2, q: 'Which chemist said the ring structure of benzene came to him after dreaming of a snake biting its own tail?', a: 'August Kekule', d: ['Justus von Liebig', 'Friedrich Wohler', 'Emil Fischer'] },
{ c: 'Books & Authors', t: 2, q: "Which novel ends with its heroine resolving that tomorrow is another day?", a: 'Gone with the Wind', d: ['Rebecca', 'Jane Eyre', 'Wuthering Heights'] },
{ c: 'Screen Lines', t: 2, q: 'Which character says she is just a girl standing in front of a boy in Notting Hill?', a: 'Anna Scott', d: ['William Thacker', 'Spike', 'Honey Thacker'] },

{ c: 'Presidents & Politics', t: 3, q: "Which congresswoman ran for president in 1972 under the slogan 'Unbought and Unbossed'?", a: 'Shirley Chisholm', d: ['Barbara Jordan', 'Patsy Mink', 'Bella Abzug'] },
{ c: 'History & War', t: 3, q: 'Which French revolutionary demanded audacity, more audacity, always audacity?', a: 'Georges Danton', d: ['Maximilien Robespierre', 'Jean-Paul Marat', 'Camille Desmoulins'] },
{ c: 'Science, Letters & Ideas', t: 3, q: 'Which philosopher argued that liberty consists in doing what one desires?', a: 'John Stuart Mill', d: ['Jeremy Bentham', 'Thomas Hill Green', 'Herbert Spencer'] },
{ c: 'Books & Authors', t: 3, q: "Which poet opened a poem about poetry with the admission 'I, too, dislike it'?", a: 'Marianne Moore', d: ['Elizabeth Bishop', 'Gwendolyn Brooks', 'Edna St. Vincent Millay'] },
{ c: 'Screen Lines', t: 3, q: "Which character says 'You complete me' in the 1996 film about a sports agent?", a: 'Jerry Maguire', d: ['Dorothy Boyd', 'Rod Tidwell', 'Avery Bishop'] },

{ c: 'Presidents & Politics', t: 4, q: 'Which president used his farewell address to warn against the baneful effects of the spirit of party?', a: 'George Washington', d: ['John Adams', 'Thomas Jefferson', 'James Madison'] },
{ c: 'History & War', t: 4, q: 'Which Prussian king described himself as the first servant of the state?', a: 'Frederick the Great', d: ['Frederick William I', 'Wilhelm I', 'Joseph II'] },
{ c: 'Science, Letters & Ideas', t: 4, q: 'Which economist called it the curious task of economics to show how little men know about what they imagine they can design?', a: 'Friedrich Hayek', d: ['Milton Friedman', 'Ludwig von Mises', 'James Buchanan'] },
{ c: 'Books & Authors', t: 4, q: 'Which lexicographer said that when a man is tired of London, he is tired of life?', a: 'Samuel Johnson', d: ['James Boswell', 'Oliver Goldsmith', 'David Garrick'] },
{ c: 'Screen Lines', t: 4, q: "Which character delivers the final line 'Forget it, Jake. It's Chinatown'?", a: 'Lawrence Walsh', d: ['Jake Gittes', 'Noah Cross', 'Evelyn Mulwray'] },

{ c: 'Presidents & Politics', t: 5, q: "Which of Alexander's generals took Egypt and founded a dynasty that ruled it for three centuries?", a: 'Ptolemy', d: ['Seleucus', 'Antigonus', 'Lysimachus'] },
{ c: 'History & War', t: 5, q: 'Which Athenian is said to have answered a raised staff with the words strike, but hear me?', a: 'Themistocles', d: ['Aristides', 'Miltiades', 'Cimon'] },
{ c: 'Science, Letters & Ideas', t: 5, q: 'Which mathematician called mathematics the queen of the sciences?', a: 'Carl Friedrich Gauss', d: ['Leonhard Euler', 'Pierre-Simon Laplace', 'Joseph-Louis Lagrange'] },
{ c: 'Books & Authors', t: 5, q: 'Which writer said there is no greater agony than bearing an untold story inside you?', a: 'Maya Angelou', d: ['Toni Morrison', 'Alice Walker', 'Lorraine Hansberry'] },
{ c: 'Screen Lines', t: 5, q: 'Which character teaches a man to whistle in To Have and Have Not?', a: 'Marie Browning', d: ['Harry Morgan', 'Eddie', 'Helene de Bursac'] },
],

// ── Day 19 ─────────────────────────────────────────────────────────────────
[
{ c: 'Presidents & Politics', t: 1, q: 'Which president reassured the country through a series of radio fireside chats?', a: 'Franklin D. Roosevelt', d: ['Herbert Hoover', 'Harry S. Truman', 'Calvin Coolidge'] },
{ c: 'History & War', t: 1, q: 'Which navigator set out on the first voyage around the world but died before it was finished?', a: 'Ferdinand Magellan', d: ['Christopher Columbus', 'Vasco da Gama', 'Francis Drake'] },
{ c: 'Science, Letters & Ideas', t: 1, q: 'Which mathematician gave his name to the theorem about the sides of a right triangle?', a: 'Pythagoras', d: ['Euclid', 'Thales', 'Archimedes'] },
{ c: 'Books & Authors', t: 1, q: 'Which novel opens on a queer, sultry summer, the summer they electrocuted the Rosenbergs?', a: 'The Bell Jar', d: ['Franny and Zooey', 'Revolutionary Road', 'The Group'] },
{ c: 'Screen Lines', t: 1, q: "Which character corrects a classmate's pronunciation of Wingardium Leviosa?", a: 'Hermione Granger', d: ['Ron Weasley', 'Harry Potter', 'Neville Longbottom'] },

{ c: 'Presidents & Politics', t: 2, q: 'Which president called his domestic programme the Square Deal?', a: 'Theodore Roosevelt', d: ['William Howard Taft', 'Woodrow Wilson', 'William McKinley'] },
{ c: 'History & War', t: 2, q: 'Which chancellor declared that his country would not go to Canossa?', a: 'Otto von Bismarck', d: ['Wilhelm I', 'Leo von Caprivi', 'Bernhard von Bulow'] },
{ c: 'Science, Letters & Ideas', t: 2, q: 'Which meteorologist proposed that the continents had once been joined and had drifted apart?', a: 'Alfred Wegener', d: ['Charles Lyell', 'James Hutton', 'Harry Hess'] },
{ c: 'Books & Authors', t: 2, q: 'Which comic novel opens by calling Earth an utterly insignificant little blue-green planet?', a: "The Hitchhiker's Guide to the Galaxy", d: ['Good Omens', 'The Colour of Magic', 'Bored of the Rings'] },
{ c: 'Screen Lines', t: 2, q: "Which character interrupts a speech with 'You had me at hello'?", a: 'Dorothy Boyd', d: ['Jerry Maguire', 'Rod Tidwell', 'Avery Bishop'] },

{ c: 'Presidents & Politics', t: 3, q: 'Which future Supreme Court justice wrote that sunlight is said to be the best of disinfectants?', a: 'Louis Brandeis', d: ['Oliver Wendell Holmes Jr.', 'Felix Frankfurter', 'Benjamin Cardozo'] },
{ c: 'History & War', t: 3, q: 'Which emperor boasted that he found Rome a city of brick and left it a city of marble?', a: 'Augustus', d: ['Julius Caesar', 'Trajan', 'Hadrian'] },
{ c: 'Science, Letters & Ideas', t: 3, q: 'Which geometer is said to have told a king that there is no royal road to his subject?', a: 'Euclid', d: ['Archimedes', 'Apollonius', 'Eratosthenes'] },
{ c: 'Books & Authors', t: 3, q: 'Which poet wrote that the child is father of the man?', a: 'William Wordsworth', d: ['Samuel Taylor Coleridge', 'Robert Southey', 'Thomas Gray'] },
{ c: 'Screen Lines', t: 3, q: "Which character warns his children that winter is coming?", a: 'Ned Stark', d: ['Tyrion Lannister', 'Jon Snow', 'Robert Baratheon'] },

{ c: 'Presidents & Politics', t: 4, q: 'The warning that a government big enough to give you everything can take everything away is often credited to Jefferson. Which president used it in a 1974 address to a joint session of Congress?', a: 'Gerald Ford', d: ['Lyndon B. Johnson', 'Jimmy Carter', 'Richard Nixon'] },
{ c: 'History & War', t: 4, q: 'Which Athenian was reportedly ostracised by a citizen tired of hearing him called the Just?', a: 'Aristides', d: ['Themistocles', 'Cimon', 'Miltiades'] },
{ c: 'Science, Letters & Ideas', t: 4, q: 'Which biologist suspected the universe is not only queerer than we suppose, but queerer than we can suppose?', a: 'J. B. S. Haldane', d: ['Julian Huxley', 'Peter Medawar', 'Ronald Fisher'] },
{ c: 'Books & Authors', t: 4, q: 'Which poet observed that the best laid schemes of mice and men often go awry?', a: 'Robert Burns', d: ['Walter Scott', 'James Hogg', 'Robert Fergusson'] },
{ c: 'Screen Lines', t: 4, q: 'Which character says she has always depended on the kindness of strangers?', a: 'Blanche DuBois', d: ['Stella Kowalski', 'Stanley Kowalski', 'Harold Mitchell'] },

{ c: 'Presidents & Politics', t: 5, q: 'Which British foreign secretary said his country had no eternal allies, only eternal interests?', a: 'Lord Palmerston', d: ['Benjamin Disraeli', 'William Gladstone', 'Robert Peel'] },
{ c: 'History & War', t: 5, q: 'Which Chinese strategist wrote that all warfare is based on deception?', a: 'Sun Tzu', d: ['Wu Qi', 'Sima Rangju', 'Jiang Ziya'] },
{ c: 'Science, Letters & Ideas', t: 5, q: 'Which philosopher held that to be is to be perceived?', a: 'George Berkeley', d: ['David Hume', 'John Locke', 'Thomas Reid'] },
{ c: 'Books & Authors', t: 5, q: "Which poet wrote that a man's reach should exceed his grasp?", a: 'Robert Browning', d: ['Alfred Tennyson', 'Matthew Arnold', 'Algernon Swinburne'] },
{ c: 'Screen Lines', t: 5, q: 'Which character in Little Caesar, shot down behind a billboard, dies asking whether this can really be the end of him?', a: 'Rico Bandello', d: ['Joe Massara', 'Otero', 'Big Boy'] },
],

// ── Day 20 ─────────────────────────────────────────────────────────────────
[
{ c: 'Presidents & Politics', t: 1, q: 'Which candidate promised a New Frontier in accepting the 1960 nomination?', a: 'John F. Kennedy', d: ['Lyndon B. Johnson', 'Richard Nixon', 'Adlai Stevenson'] },
{ c: 'History & War', t: 1, q: 'Which commander opened his own account of a campaign by saying that all Gaul is divided into three parts?', a: 'Julius Caesar', d: ['Pompey', 'Marius', 'Sulla'] },
{ c: 'Science, Letters & Ideas', t: 1, q: 'Which astronomer argued the Earth goes round the Sun, in a book published as he lay dying?', a: 'Nicolaus Copernicus', d: ['Tycho Brahe', 'Johannes Kepler', 'Galileo Galilei'] },
{ c: 'Books & Authors', t: 1, q: 'Which novel opens with a brother breaking his arm badly at the elbow when he was nearly thirteen?', a: 'To Kill a Mockingbird', d: ['The Adventures of Tom Sawyer', 'A Tree Grows in Brooklyn', 'The Yearling'] },
{ c: 'Screen Lines', t: 1, q: "Which character shouts 'I volunteer as tribute' in The Hunger Games?", a: 'Katniss Everdeen', d: ['Primrose Everdeen', 'Effie Trinket', 'Peeta Mellark'] },

{ c: 'Presidents & Politics', t: 2, q: 'Which president told a television audience in 1974 that he would resign the office the next day?', a: 'Richard Nixon', d: ['Gerald Ford', 'Lyndon B. Johnson', 'Jimmy Carter'] },
{ c: 'History & War', t: 2, q: 'Who told the Commons in 1940 that when asked their aim, he could answer in one word: victory?', a: 'Winston Churchill', d: ['Neville Chamberlain', 'Clement Attlee', 'Lord Halifax'] },
{ c: 'Science, Letters & Ideas', t: 2, q: 'Which physicist formulated the uncertainty principle?', a: 'Werner Heisenberg', d: ['Niels Bohr', 'Erwin Schrodinger', 'Max Born'] },
{ c: 'Books & Authors', t: 2, q: "Which novel opens mid-sentence with 'riverrun, past Eve and Adam's'?", a: 'Finnegans Wake', d: ['Ulysses', 'Dubliners', 'A Portrait of the Artist as a Young Man'] },
{ c: 'Screen Lines', t: 2, q: "Which character cries 'It's alive!' over the body he has brought to life in a 1931 Universal horror film?", a: 'Henry Frankenstein', d: ['The Monster', 'Doctor Waldman', 'Fritz'] },

{ c: 'Presidents & Politics', t: 3, q: 'Which president introduced the domino theory at a 1954 press conference?', a: 'Dwight D. Eisenhower', d: ['Harry S. Truman', 'John F. Kennedy', 'Lyndon B. Johnson'] },
{ c: 'History & War', t: 3, q: 'Which Prussian field marshal said no plan of operations survives contact with the enemy?', a: 'Helmuth von Moltke', d: ['Alfred von Schlieffen', 'Erich Ludendorff', 'Paul von Hindenburg'] },
{ c: 'Science, Letters & Ideas', t: 3, q: 'Which philosopher imagined prisoners in a cave mistaking shadows for reality?', a: 'Plato', d: ['Socrates', 'Aristotle', 'Plotinus'] },
{ c: 'Books & Authors', t: 3, q: 'Which novelist wrote that a true place is not down on any map?', a: 'Herman Melville', d: ['Nathaniel Hawthorne', 'Washington Irving', 'James Fenimore Cooper'] },
{ c: 'Screen Lines', t: 3, q: 'Which character thanks the audience on behalf of his mother and father in Yankee Doodle Dandy?', a: 'George M. Cohan', d: ['Sam Harris', 'Jerry Cohan', 'Mary Cohan'] },

{ c: 'Presidents & Politics', t: 4, q: 'Which president told a Paris audience that it is not the critic who counts?', a: 'Theodore Roosevelt', d: ['Woodrow Wilson', 'William Howard Taft', 'Calvin Coolidge'] },
{ c: 'History & War', t: 4, q: 'Which Spartan regent commanded the allied Greek army at Plataea in 479 BC?', a: 'Pausanias', d: ['Leonidas', 'Cleomenes', 'Archidamus'] },
{ c: 'Science, Letters & Ideas', t: 4, q: 'Whose decades of precise observations of Mars did Kepler use to derive elliptical orbits?', a: 'Tycho Brahe', d: ['Nicolaus Copernicus', 'Galileo Galilei', 'Christiaan Huygens'] },
{ c: 'Books & Authors', t: 4, q: 'Which Elizabethan playwright invited his love to come live with him?', a: 'Christopher Marlowe', d: ['William Shakespeare', 'Ben Jonson', 'Thomas Kyd'] },
{ c: 'Screen Lines', t: 4, q: 'Which character explains that in France they call it a Royale with cheese?', a: 'Vincent Vega', d: ['Jules Winnfield', 'Mia Wallace', 'Butch Coolidge'] },

{ c: 'Presidents & Politics', t: 5, q: 'Which prime minister mocked a rival as a sophistical rhetorician inebriated with the exuberance of his own verbosity?', a: 'Benjamin Disraeli', d: ['Robert Peel', 'Lord Salisbury', 'Lord Palmerston'] },
{ c: 'History & War', t: 5, q: 'Which medieval chronicle records that in the anarchy men said Christ and his saints slept?', a: 'The Anglo-Saxon Chronicle', d: ['The Domesday Book', 'The Bayeux Tapestry', "Bede's Ecclesiastical History"] },
{ c: 'Science, Letters & Ideas', t: 5, q: 'Which mathematician praised an especially elegant proof as coming straight from The Book?', a: 'Paul Erdos', d: ['Andre Weil', 'John von Neumann', 'Emmy Noether'] },
{ c: 'Books & Authors', t: 5, q: 'Which novelist wrote that the world breaks everyone, and afterward many are strong at the broken places?', a: 'Ernest Hemingway', d: ['F. Scott Fitzgerald', 'John Dos Passos', 'Ford Madox Ford'] },
{ c: 'Screen Lines', t: 5, q: 'Which character calls a statuette the stuff that dreams are made of?', a: 'Sam Spade', d: ['Kasper Gutman', 'Joel Cairo', "Brigid O'Shaughnessy"] },
],

// ── Day 21 ─────────────────────────────────────────────────────────────────
[
{ c: 'Presidents & Politics', t: 1, q: 'Which president answered a heckler by saying he never gave anybody hell, he just told the truth and they thought it was hell?', a: 'Harry S. Truman', d: ['Franklin D. Roosevelt', 'Dwight D. Eisenhower', 'Lyndon B. Johnson'] },
{ c: 'History & War', t: 1, q: 'Which Mississippi organiser said that nobody is free until everybody is free?', a: 'Fannie Lou Hamer', d: ['Rosa Parks', 'Ella Baker', 'Septima Clark'] },
{ c: 'Science, Letters & Ideas', t: 1, q: 'Which vaccine developer, asked who owned the patent, answered that the people did?', a: 'Jonas Salk', d: ['Albert Sabin', 'Alexander Fleming', 'Frederick Banting'] },
{ c: 'Books & Authors', t: 1, q: 'Which picture book opens in a great green room with a telephone and a red balloon?', a: 'Goodnight Moon', d: ['The Runaway Bunny', 'Where the Wild Things Are', 'The Very Hungry Caterpillar'] },
{ c: 'Screen Lines', t: 1, q: 'Which character sings about letting it go on a mountainside in Frozen?', a: 'Elsa', d: ['Anna', 'Olaf', 'Kristoff'] },

{ c: 'Presidents & Politics', t: 2, q: 'Which president argued that a rising tide lifts all the boats?', a: 'John F. Kennedy', d: ['Lyndon B. Johnson', 'Harry S. Truman', 'Dwight D. Eisenhower'] },
{ c: 'History & War', t: 2, q: "Which cosmonaut shouted 'Let's go!' as his rocket lifted off in 1961?", a: 'Yuri Gagarin', d: ['Alexei Leonov', 'Gherman Titov', 'Vladimir Komarov'] },
{ c: 'Science, Letters & Ideas', t: 2, q: 'Which physician was ridiculed for insisting that doctors wash their hands between patients?', a: 'Ignaz Semmelweis', d: ['Joseph Lister', 'Louis Pasteur', 'John Snow'] },
{ c: 'Books & Authors', t: 2, q: 'Which novel ends with its creature borne away by the waves and lost in darkness and distance?', a: 'Frankenstein', d: ['Dracula', 'The Strange Case of Dr Jekyll and Mr Hyde', 'The Picture of Dorian Gray'] },
{ c: 'Screen Lines', t: 2, q: "Which character greets her own reflection with 'Hello, gorgeous' in Funny Girl?", a: 'Fanny Brice', d: ['Nick Arnstein', 'Rose Brice', 'Georgia James'] },

{ c: 'Presidents & Politics', t: 3, q: 'Which French president joked that a country producing hundreds of cheeses is impossible to govern?', a: 'Charles de Gaulle', d: ['Georges Pompidou', 'Vincent Auriol', 'Francois Mitterrand'] },
{ c: 'History & War', t: 3, q: 'Which explorer reached the South Pole first, in December 1911?', a: 'Roald Amundsen', d: ['Robert Falcon Scott', 'Ernest Shackleton', 'Fridtjof Nansen'] },
{ c: 'Science, Letters & Ideas', t: 3, q: 'Which philosopher argued that man is by nature a political animal?', a: 'Aristotle', d: ['Plato', 'Socrates', 'Epicurus'] },
{ c: 'Books & Authors', t: 3, q: 'Which poet wrote that she walks in beauty, like the night?', a: 'Lord Byron', d: ['Percy Bysshe Shelley', 'John Keats', 'Thomas Moore'] },
{ c: 'Screen Lines', t: 3, q: "Which character taunts his sister with 'They're coming to get you, Barbara'?", a: 'Johnny', d: ['Ben', 'Barbara', 'Harry Cooper'] },

{ c: 'Presidents & Politics', t: 4, q: 'Which senator delivered a 1950 Declaration of Conscience rebuking Joseph McCarthy?', a: 'Margaret Chase Smith', d: ['Robert Taft', 'Estes Kefauver', 'Wayne Morse'] },
{ c: 'History & War', t: 4, q: 'Which German foreign secretary sent the coded 1917 telegram proposing an alliance with Mexico?', a: 'Arthur Zimmermann', d: ['Theobald von Bethmann-Hollweg', 'Paul von Hindenburg', 'Erich Ludendorff'] },
{ c: 'Science, Letters & Ideas', t: 4, q: 'Which philosopher described the newborn mind as a blank sheet of paper?', a: 'John Locke', d: ['David Hume', 'George Berkeley', 'Thomas Hobbes'] },
{ c: 'Books & Authors', t: 4, q: 'Which poet opened a poem many and many a year ago, in a kingdom by the sea?', a: 'Edgar Allan Poe', d: ['Nathaniel Hawthorne', 'Herman Melville', 'Sidney Lanier'] },
{ c: 'Screen Lines', t: 4, q: "Which character complains 'You're killing me, Smalls' in The Sandlot?", a: 'Ham Porter', d: ['Benny Rodriguez', 'Scotty Smalls', 'Squints Palledorous'] },

{ c: 'Presidents & Politics', t: 5, q: 'Which Roman emperor exchanged letters with Pliny the Younger about how to treat Christians?', a: 'Trajan', d: ['Hadrian', 'Nerva', 'Antoninus Pius'] },
{ c: 'History & War', t: 5, q: 'Which sultan is remembered for the restraint of his troops on retaking Jerusalem in 1187?', a: 'Saladin', d: ['Nur ad-Din', 'Baibars', 'Al-Kamil'] },
{ c: 'Science, Letters & Ideas', t: 5, q: 'Which astronomer called the second law of thermodynamics the supreme law of nature?', a: 'Arthur Eddington', d: ['Ludwig Boltzmann', 'Rudolf Clausius', 'James Clerk Maxwell'] },
{ c: 'Books & Authors', t: 5, q: 'Which poet apologised in a short poem for eating the plums in the icebox?', a: 'William Carlos Williams', d: ['Wallace Stevens', 'Marianne Moore', 'e. e. cummings'] },
{ c: 'Screen Lines', t: 5, q: "Which character in Grand Hotel repeatedly says 'I want to be alone'?", a: 'Grusinskaya', d: ['Baron von Gaigern', 'Flaemmchen', 'Preysing'] },
],

// ── Day 22 ─────────────────────────────────────────────────────────────────
[
{ c: 'Presidents & Politics', t: 1, q: 'Which president of the Continental Congress signed the Declaration with a famously large hand?', a: 'John Hancock', d: ['John Adams', 'Charles Thomson', 'Peyton Randolph'] },
{ c: 'History & War', t: 1, q: 'Which aviator became the first woman to fly the Atlantic solo, in 1932?', a: 'Amelia Earhart', d: ['Bessie Coleman', 'Beryl Markham', 'Harriet Quimby'] },
{ c: 'Science, Letters & Ideas', t: 1, q: 'Which physicist wrote that he had no special talent and was only passionately curious?', a: 'Albert Einstein', d: ['Max Planck', 'Niels Bohr', 'Erwin Schrodinger'] },
{ c: 'Books & Authors', t: 1, q: 'Which series of novels sends the Pevensie children through a wardrobe?', a: 'The Chronicles of Narnia', d: ['The Dark Is Rising', 'His Dark Materials', 'The Borrowers'] },
{ c: 'Screen Lines', t: 1, q: "Which character answers his grandfather's schemes with a nervous 'Aw geez' as he is dragged between dimensions?", a: 'Morty Smith', d: ['Rick Sanchez', 'Summer Smith', 'Jerry Smith'] },

{ c: 'Presidents & Politics', t: 2, q: 'Which president told a divided country that we are all Republicans, we are all Federalists?', a: 'Thomas Jefferson', d: ['John Adams', 'James Madison', 'James Monroe'] },
{ c: 'History & War', t: 2, q: 'Which battle cry followed the sinking of an American warship in Havana harbour in 1898?', a: 'Remember the Maine', d: ['Remember the Alamo', 'Remember Pearl Harbor', 'Fifty-four Forty or Fight'] },
{ c: 'Science, Letters & Ideas', t: 2, q: 'Which writer coined the line that a ship in harbour is safe, but that is not what ships are built for?', a: 'John A. Shedd', d: ['Joseph Conrad', 'Herman Melville', 'Rudyard Kipling'] },
{ c: 'Books & Authors', t: 2, q: "Which novel opens with the flat announcement that the primroses were over?", a: 'Watership Down', d: ['The Wind in the Willows', 'Animal Farm', 'The Once and Future King'] },
{ c: 'Screen Lines', t: 2, q: "Which character in the American version of The Office is forever saying 'That's what she said'?", a: 'Michael Scott', d: ['Dwight Schrute', 'Jim Halpert', 'Pam Beesly'] },

{ c: 'Presidents & Politics', t: 3, q: 'Which senator warned in 1858 of an irrepressible conflict between free and slave labour?', a: 'William Seward', d: ['Stephen Douglas', 'Charles Sumner', 'Salmon Chase'] },
{ c: 'History & War', t: 3, q: 'Which Roman commander lost three legions in the Teutoburg Forest?', a: 'Publius Quinctilius Varus', d: ['Germanicus', 'Drusus', 'Agrippa'] },
{ c: 'Science, Letters & Ideas', t: 3, q: 'Which clergyman argued that population grows faster than the food supply?', a: 'Thomas Malthus', d: ['David Ricardo', 'Adam Smith', 'Nassau Senior'] },
{ c: 'Books & Authors', t: 3, q: 'Which author wrote that a person is a person, no matter how small?', a: 'Dr. Seuss', d: ['Shel Silverstein', 'Roald Dahl', 'Maurice Sendak'] },
{ c: 'Screen Lines', t: 3, q: 'Which character warns that life moves pretty fast, and you could miss it?', a: 'Ferris Bueller', d: ['Cameron Frye', 'Sloane Peterson', 'Ed Rooney'] },

{ c: 'Presidents & Politics', t: 4, q: 'Which chief justice wrote that separate educational facilities are inherently unequal?', a: 'Earl Warren', d: ['Fred Vinson', 'Hugo Black', 'William O. Douglas'] },
{ c: 'History & War', t: 4, q: 'Which Roman emperor is said to have wished the Roman people had a single neck?', a: 'Caligula', d: ['Nero', 'Domitian', 'Commodus'] },
{ c: 'Science, Letters & Ideas', t: 4, q: 'Which philosopher opened a treatise by saying the world is everything that is the case?', a: 'Ludwig Wittgenstein', d: ['Bertrand Russell', 'Rudolf Carnap', 'Moritz Schlick'] },
{ c: 'Books & Authors', t: 4, q: 'Which writer sent an owl and a pussycat to sea in a pea-green boat?', a: 'Edward Lear', d: ['Lewis Carroll', 'Hilaire Belloc', 'A. A. Milne'] },
{ c: 'Screen Lines', t: 4, q: "Which character urges his students to seize the day in Dead Poets Society?", a: 'John Keating', d: ['Neil Perry', 'Todd Anderson', 'Mr. Nolan'] },

{ c: 'Presidents & Politics', t: 5, q: 'Which Athenian orator spent his career warning the city about Philip of Macedon?', a: 'Demosthenes', d: ['Isocrates', 'Aeschines', 'Lysias'] },
{ c: 'History & War', t: 5, q: 'Which sultan, after taking Constantinople, declared there must be only one empire, one faith and one sovereignty in the world?', a: 'Mehmed II', d: ['Suleiman the Magnificent', 'Bayezid I', 'Selim I'] },
{ c: 'Science, Letters & Ideas', t: 5, q: 'Which Greek historian described his own work as a possession for all time?', a: 'Thucydides', d: ['Herodotus', 'Xenophon', 'Polybius'] },
{ c: 'Books & Authors', t: 5, q: "Which novelist gave a lovesick captain the words 'I am half agony, half hope'?", a: 'Jane Austen', d: ['Fanny Burney', 'Maria Edgeworth', 'Ann Radcliffe'] },
{ c: 'Screen Lines', t: 5, q: "Which character boasts that his amplifiers go to eleven?", a: 'Nigel Tufnel', d: ['David St. Hubbins', 'Derek Smalls', 'Marty DiBergi'] },
],

// ── Day 23 ─────────────────────────────────────────────────────────────────
[
{ c: 'Presidents & Politics', t: 1, q: 'Which future president told a 2004 convention there is not a liberal America and a conservative America?', a: 'Barack Obama', d: ['Bill Clinton', 'John Kerry', 'Al Gore'] },
{ c: 'History & War', t: 1, q: 'Which suffragette said she would rather be a rebel than a slave?', a: 'Emmeline Pankhurst', d: ['Millicent Fawcett', 'Emily Davison', 'Christabel Pankhurst'] },
{ c: 'Science, Letters & Ideas', t: 1, q: 'Which philosopher wrote that mathematics possesses not only truth, but supreme beauty?', a: 'Bertrand Russell', d: ['Alfred North Whitehead', 'G. H. Hardy', 'Henri Poincare'] },
{ c: 'Books & Authors', t: 1, q: 'Which novel opens with a hobbit announcing his eleventy-first birthday party?', a: 'The Fellowship of the Ring', d: ['The Hobbit', 'The Silmarillion', 'The Two Towers'] },
{ c: 'Screen Lines', t: 1, q: 'Which character in Guardians of the Galaxy can say only three words?', a: 'Groot', d: ['Rocket', 'Star-Lord', 'Drax'] },

{ c: 'Presidents & Politics', t: 2, q: 'Which American statesman said in 1962 that Britain had lost an empire and not yet found a role?', a: 'Dean Acheson', d: ['John Foster Dulles', 'George Kennan', 'Averell Harriman'] },
{ c: 'History & War', t: 2, q: 'Which general told West Point cadets in 1962 that their watchwords were duty, honour, country?', a: 'Douglas MacArthur', d: ['Omar Bradley', 'Matthew Ridgway', 'Maxwell Taylor'] },
{ c: 'Science, Letters & Ideas', t: 2, q: 'Which experimenter first used the word cell for the compartments he saw through a microscope?', a: 'Robert Hooke', d: ['Antonie van Leeuwenhoek', 'Marcello Malpighi', 'Jan Swammerdam'] },
{ c: 'Books & Authors', t: 2, q: 'Which novel ends with the narrator lingering by three headstones under a benign sky?', a: 'Wuthering Heights', d: ['Jane Eyre', 'Villette', 'Agnes Grey'] },
{ c: 'Screen Lines', t: 2, q: "Which character asks 'What's your favorite scary movie?' down the phone in Scream?", a: 'Ghostface', d: ['Sidney Prescott', 'Billy Loomis', 'Randy Meeks'] },

{ c: 'Presidents & Politics', t: 3, q: 'Which defense secretary spoke at a briefing about known knowns and unknown unknowns?', a: 'Donald Rumsfeld', d: ['Dick Cheney', 'Colin Powell', 'Robert Gates'] },
{ c: 'History & War', t: 3, q: 'Which Roman is said to have held a bridge alone against an invading army?', a: 'Horatius Cocles', d: ['Cincinnatus', 'Camillus', 'Mucius Scaevola'] },
{ c: 'Science, Letters & Ideas', t: 3, q: 'Which mathematician said that one who is not also something of a poet will never be a complete mathematician?', a: 'Karl Weierstrass', d: ['Georg Cantor', 'Richard Dedekind', 'Bernhard Riemann'] },
{ c: 'Books & Authors', t: 3, q: "Which poet wrote that nature's first green is gold?", a: 'Robert Frost', d: ['Carl Sandburg', 'Edwin Arlington Robinson', 'Sara Teasdale'] },
{ c: 'Screen Lines', t: 3, q: "Which character remarks that a boy's best friend is his mother?", a: 'Norman Bates', d: ['Marion Crane', 'Sam Loomis', 'Milton Arbogast'] },

{ c: 'Presidents & Politics', t: 4, q: 'Which president explained a difficult policy by saying that when you have an elephant by the hind legs it is best to let him run?', a: 'Abraham Lincoln', d: ['Andrew Jackson', 'Ulysses S. Grant', 'Theodore Roosevelt'] },
{ c: 'History & War', t: 4, q: "Which emperor is said to have exclaimed 'Solomon, I have outdone thee' on entering his new church?", a: 'Justinian I', d: ['Constantine', 'Heraclius', 'Basil II'] },
{ c: 'Science, Letters & Ideas', t: 4, q: 'Which physician wrote that medicine is a science of uncertainty and an art of probability?', a: 'William Osler', d: ['William Harvey', 'Rudolf Virchow', 'Claude Bernard'] },
{ c: 'Books & Authors', t: 4, q: 'Which author wrote that it is only with the heart that one can see rightly?', a: 'Antoine de Saint-Exupery', d: ['Albert Camus', 'Andre Gide', 'Marcel Pagnol'] },
{ c: 'Screen Lines', t: 4, q: "Which character warns his fleet 'It's a trap!' in Return of the Jedi?", a: 'Admiral Ackbar', d: ['Lando Calrissian', 'Han Solo', 'Mon Mothma'] },

{ c: 'Presidents & Politics', t: 5, q: 'Which Chinese teacher advised that the superior man is modest in speech but exceeds in his actions?', a: 'Confucius', d: ['Laozi', 'Mencius', 'Zhuangzi'] },
{ c: 'History & War', t: 5, q: 'Which naval commander at Salamis drew from Xerxes the remark that his men had become women?', a: 'Artemisia I', d: ['Atossa', 'Roxana', 'Amestris'] },
{ c: 'Science, Letters & Ideas', t: 5, q: 'Which physicist observed that a new scientific truth wins because its opponents eventually die?', a: 'Max Planck', d: ['Niels Bohr', 'Wolfgang Pauli', 'Arnold Sommerfeld'] },
{ c: 'Books & Authors', t: 5, q: 'Which novelist wrote that the unread story is not a story?', a: 'Ursula K. Le Guin', d: ['Octavia Butler', 'Margaret Atwood', 'Doris Lessing'] },
{ c: 'Screen Lines', t: 5, q: "Which character introduces the pair with the flat line 'We rob banks'?", a: 'Clyde Barrow', d: ['Bonnie Parker', 'C. W. Moss', 'Buck Barrow'] },
],

// ── Day 24 ─────────────────────────────────────────────────────────────────
[
{ c: 'Presidents & Politics', t: 1, q: 'Which president advised that if you see ten troubles coming down the road, nine will run into the ditch first?', a: 'Calvin Coolidge', d: ['Herbert Hoover', 'Warren G. Harding', 'Gerald Ford'] },
{ c: 'History & War', t: 1, q: 'Which pilot commanded the first crewed landing on the Moon?', a: 'Neil Armstrong', d: ['Buzz Aldrin', 'Michael Collins', 'Jim Lovell'] },
{ c: 'Science, Letters & Ideas', t: 1, q: 'Which physicist called the whole of science nothing more than a refinement of everyday thinking?', a: 'Albert Einstein', d: ['Richard Feynman', 'Max Born', 'Enrico Fermi'] },
{ c: 'Books & Authors', t: 1, q: 'Which novel opens with a boy named Bruno finding the maid packing his things?', a: 'The Boy in the Striped Pyjamas', d: ['The Book Thief', 'Number the Stars', 'When Hitler Stole Pink Rabbit'] },
{ c: 'Screen Lines', t: 1, q: "Which character insists 'I'm not a smart man, but I know what love is'?", a: 'Forrest Gump', d: ['Jenny Curran', 'Lieutenant Dan', 'Mrs. Gump'] },

{ c: 'Presidents & Politics', t: 2, q: 'Which president told Congress in 1941 that the world should rest on four essential human freedoms?', a: 'Franklin D. Roosevelt', d: ['Herbert Hoover', 'Calvin Coolidge', 'Woodrow Wilson'] },
{ c: 'History & War', t: 2, q: "Which writer set new words about the coming of the Lord to the marching tune of John Brown's Body?", a: 'Julia Ward Howe', d: ['Harriet Beecher Stowe', 'Louisa May Alcott', 'Emily Dickinson'] },
{ c: 'Science, Letters & Ideas', t: 2, q: 'Which naturalist sailed as a young man aboard the Beagle?', a: 'Charles Darwin', d: ['Thomas Huxley', 'Alfred Russel Wallace', 'Joseph Hooker'] },
{ c: 'Books & Authors', t: 2, q: "Which novel's last words are that he loved Big Brother?", a: 'Nineteen Eighty-Four', d: ['Brave New World', 'Fahrenheit 451', 'Darkness at Noon'] },
{ c: 'Screen Lines', t: 2, q: "Which character shouts 'Great Scott!' at almost every crisis?", a: 'Doc Brown', d: ['Marty McFly', 'Biff Tannen', 'Jennifer Parker'] },

{ c: 'Presidents & Politics', t: 3, q: 'Which president signed the Voting Rights Act into law in August 1965?', a: 'Lyndon B. Johnson', d: ['John F. Kennedy', 'Harry S. Truman', 'Hubert Humphrey'] },
{ c: 'History & War', t: 3, q: 'Which Union general burned Atlanta and marched to the sea?', a: 'William Tecumseh Sherman', d: ['Ulysses S. Grant', 'Philip Sheridan', 'George Thomas'] },
{ c: 'Science, Letters & Ideas', t: 3, q: 'Which philosopher wrote that all men by nature desire to know?', a: 'Aristotle', d: ['Plato', 'Theophrastus', 'Zeno of Citium'] },
{ c: 'Books & Authors', t: 3, q: 'Which poet asked whether he should compare thee to a summer day?', a: 'William Shakespeare', d: ['Philip Sidney', 'Edmund Spenser', 'Michael Drayton'] },
{ c: 'Screen Lines', t: 3, q: "Which character calms a diner standoff by saying 'Nobody's gonna hurt anybody'?", a: 'Jules Winnfield', d: ['Pumpkin', 'Honey Bunny', 'Vincent Vega'] },

{ c: 'Presidents & Politics', t: 4, q: 'Which framer warned that the accumulation of all powers in the same hands is the very definition of tyranny?', a: 'James Madison', d: ['Alexander Hamilton', 'John Jay', 'Gouverneur Morris'] },
{ c: 'History & War', t: 4, q: 'Which admiral is said to have raised a telescope to his blind eye and reported seeing no signal?', a: 'Horatio Nelson', d: ['Hyde Parker', 'Cuthbert Collingwood', 'Adam Duncan'] },
{ c: 'Science, Letters & Ideas', t: 4, q: 'Which economist wrote that the tendency of the rate of profit to fall is the most important law of political economy?', a: 'Karl Marx', d: ['David Ricardo', 'Adam Smith', 'Friedrich Engels'] },
{ c: 'Books & Authors', t: 4, q: 'Which poet declared that April is the cruellest month?', a: 'T. S. Eliot', d: ['Ezra Pound', 'W. H. Auden', 'Robert Graves'] },
{ c: 'Screen Lines', t: 4, q: "Which character delivers the closing line 'It was beauty killed the beast'?", a: 'Carl Denham', d: ['Ann Darrow', 'Jack Driscoll', 'Captain Englehorn'] },

{ c: 'Presidents & Politics', t: 5, q: 'Which Roman dictator is said to have returned to his plough after saving the republic?', a: 'Cincinnatus', d: ['Camillus', 'Fabius Maximus', 'Scipio Africanus'] },
{ c: 'History & War', t: 5, q: 'Which Carthaginian is said to have complained that his countrymen knew how to win a victory but not how to use one?', a: 'Maharbal', d: ['Hasdrubal', 'Hamilcar Barca', 'Mago'] },
{ c: 'Science, Letters & Ideas', t: 5, q: 'Which physicist wrote that the imagination of nature is far greater than the imagination of man?', a: 'Richard Feynman', d: ['Freeman Dyson', 'John Wheeler', 'Murray Gell-Mann'] },
{ c: 'Books & Authors', t: 5, q: 'Which novelist described a character as a man of the crowd in a story of that name?', a: 'Edgar Allan Poe', d: ['Nathaniel Hawthorne', 'Washington Irving', 'Charles Brockden Brown'] },
{ c: 'Screen Lines', t: 5, q: 'Which character in Dr. Strangelove warns of a Communist plot to sap and impurify all of our precious bodily fluids?', a: 'General Jack D. Ripper', d: ['General Turgidson', 'Colonel Bat Guano', 'Major Kong'] },
],

// ── Day 25 ─────────────────────────────────────────────────────────────────
[
{ c: 'Presidents & Politics', t: 1, q: 'Which president called the Soviet Union an evil empire in a 1983 speech?', a: 'Ronald Reagan', d: ['Jimmy Carter', 'Gerald Ford', 'George H. W. Bush'] },
{ c: 'History & War', t: 1, q: 'Which leader told the world in 1994 that South Africa would never again be the source of oppression?', a: 'Nelson Mandela', d: ['Desmond Tutu', 'Thabo Mbeki', 'Walter Sisulu'] },
{ c: 'Science, Letters & Ideas', t: 1, q: 'Which physicist compared himself to a boy on a seashore finding a smoother pebble than ordinary?', a: 'Isaac Newton', d: ['Edmond Halley', 'Christiaan Huygens', 'Robert Boyle'] },
{ c: 'Books & Authors', t: 1, q: 'Which novel opens with a travelling salesman waking to find himself changed into a monstrous insect?', a: 'The Metamorphosis', d: ['The Trial', 'The Castle', 'Amerika'] },
{ c: 'Screen Lines', t: 1, q: "Which character warns her guests to fasten their seatbelts for a bumpy night?", a: 'Margo Channing', d: ['Eve Harrington', 'Addison DeWitt', 'Karen Richards'] },

{ c: 'Presidents & Politics', t: 2, q: 'Which president said that a nation which forgets its defenders will itself be forgotten?', a: 'Calvin Coolidge', d: ['Warren G. Harding', 'Herbert Hoover', 'Woodrow Wilson'] },
{ c: 'History & War', t: 2, q: 'Which US president ordered the Berlin airlift in 1948?', a: 'Harry S. Truman', d: ['Franklin D. Roosevelt', 'Dwight D. Eisenhower', 'George Marshall'] },
{ c: 'Science, Letters & Ideas', t: 2, q: 'Which philosopher wrote that we live forward but understand backward?', a: 'Soren Kierkegaard', d: ['Arthur Schopenhauer', 'Friedrich Nietzsche', 'Henri Bergson'] },
{ c: 'Books & Authors', t: 2, q: 'Which poet wrote that the woods are lovely, dark and deep?', a: 'Robert Frost', d: ['Carl Sandburg', 'Edwin Arlington Robinson', 'Walt Whitman'] },
{ c: 'Screen Lines', t: 2, q: "Which character in Jaws mutters 'Smile, you son of a...' before firing at the shark?", a: 'Chief Brody', d: ['Quint', 'Matt Hooper', 'Mayor Vaughn'] },

{ c: 'Presidents & Politics', t: 3, q: 'Which president told a television interviewer years later that he had given his enemies a sword?', a: 'Richard Nixon', d: ['Lyndon B. Johnson', 'Gerald Ford', 'Spiro Agnew'] },
{ c: 'History & War', t: 3, q: 'Which admiral urged his captains before Trafalgar that no captain can do very wrong who places his ship alongside that of an enemy?', a: 'Horatio Nelson', d: ['John Jervis', 'Cuthbert Collingwood', 'Edward Codrington'] },
{ c: 'Science, Letters & Ideas', t: 3, q: 'Which naturalist wrote that in wildness is the preservation of the world?', a: 'Henry David Thoreau', d: ['John Muir', 'Ralph Waldo Emerson', 'Aldo Leopold'] },
{ c: 'Books & Authors', t: 3, q: 'Which novelist wrote that there is no charm equal to tenderness of heart?', a: 'Jane Austen', d: ['Maria Edgeworth', 'Frances Burney', 'Susan Ferrier'] },
{ c: 'Screen Lines', t: 3, q: 'Which character taunts a lone policeman over the radio as Mister Cowboy in Die Hard?', a: 'Hans Gruber', d: ['Karl', 'Theo', 'Sergeant Al Powell'] },

{ c: 'Presidents & Politics', t: 4, q: 'Which vice president resigned in 1832 to take a Senate seat and argue for states rights?', a: 'John C. Calhoun', d: ['Martin Van Buren', 'Richard Mentor Johnson', 'George Dallas'] },
{ c: 'History & War', t: 4, q: 'Which French marshal is credited with the order at Verdun that they shall not pass?', a: 'Robert Nivelle', d: ['Ferdinand Foch', 'Joseph Joffre', 'Maxime Weygand'] },
{ c: 'Science, Letters & Ideas', t: 4, q: 'Which mathematician described a proof of the infinitude of primes that is still taught unchanged?', a: 'Euclid', d: ['Eratosthenes', 'Diophantus', 'Apollonius'] },
{ c: 'Books & Authors', t: 4, q: 'Which poet and pamphleteer wrote that a good book is the precious lifeblood of a master spirit?', a: 'John Milton', d: ['Francis Bacon', 'John Bunyan', 'Thomas Browne'] },
{ c: 'Screen Lines', t: 4, q: "Which character asks 'Do you know what nemesis means?' in Snatch?", a: 'Brick Top', d: ['Turkish', 'Mickey', 'Tommy'] },

{ c: 'Presidents & Politics', t: 5, q: 'Which Roman politician published the letters that give us most of what we know of the late republic?', a: 'Cicero', d: ['Sallust', 'Varro', 'Cato the Younger'] },
{ c: 'History & War', t: 5, q: 'Which Japanese admiral warned that a war with America could only be won in the first six months?', a: 'Isoroku Yamamoto', d: ['Chuichi Nagumo', 'Osami Nagano', 'Minoru Genda'] },
{ c: 'Science, Letters & Ideas', t: 5, q: 'Which mathematician wrote an apology arguing that pure mathematics is useless and beautiful?', a: 'G. H. Hardy', d: ['Bertrand Russell', 'John Littlewood', 'Srinivasa Ramanujan'] },
{ c: 'Books & Authors', t: 5, q: 'Which poet wrote that the apparition of these faces in the crowd is like petals on a wet, black bough?', a: 'Ezra Pound', d: ['T. S. Eliot', 'H. D.', 'Amy Lowell'] },
{ c: 'Screen Lines', t: 5, q: 'Which character defends himself on a Ferris wheel by talking about Swiss cuckoo clocks?', a: 'Harry Lime', d: ['Holly Martins', 'Anna Schmidt', 'Major Calloway'] },
],

// ── Day 26 ────────────────────────────────────────────────────
[
{ c: 'Presidents & Politics', t: 1, q: 'Which president told a frightened country in 1933 that the only thing to fear is fear itself?', a: 'Franklin D. Roosevelt', d: ['Woodrow Wilson', 'Theodore Roosevelt', 'Harry S. Truman'] },
{ c: 'History & War', t: 1, q: 'Which minister wrote that the ultimate measure of a man is where he stands in moments of challenge?', a: 'Martin Luther King Jr.', d: ['Malcolm X', 'Ralph Abernathy', 'Howard Thurman'] },
{ c: 'Science, Letters & Ideas', t: 1, q: 'Which brothers telegraphed home from a North Carolina beach in 1903 to report four successful flights?', a: 'The Wright brothers', d: ['The Montgolfier brothers', 'The Lumiere brothers', 'The Voisin brothers'] },
{ c: 'Books & Authors', t: 1, q: 'Which novel follows a boy named Jonas who is given the assignment of Receiver at twelve?', a: 'The Giver', d: ['A Wrinkle in Time', 'Holes', 'Bridge to Terabithia'] },
{ c: 'Screen Lines', t: 1, q: 'Which character opens the song by calling Hakuna Matata a wonderful phrase?', a: 'Timon', d: ['Pumbaa', 'Rafiki', 'Zazu'] },

{ c: 'Presidents & Politics', t: 2, q: 'Which president wrote that no man is good enough to govern another without that other man consenting?', a: 'Abraham Lincoln', d: ['Thomas Jefferson', 'James Madison', 'John Quincy Adams'] },
{ c: 'History & War', t: 2, q: 'Which king is said to have ordered the tide to halt, to show his courtiers the limits of royal power?', a: 'Canute', d: ['Alfred the Great', 'Harold Godwinson', 'Ethelred the Unready'] },
{ c: 'Science, Letters & Ideas', t: 2, q: 'Which physicist objected to the new quantum theory by insisting that God does not play dice?', a: 'Albert Einstein', d: ['Max Planck', 'Niels Bohr', 'Arthur Compton'] },
{ c: 'Books & Authors', t: 2, q: 'Which poet declared that hell is a city much like London?', a: 'Percy Bysshe Shelley', d: ['William Blake', 'Lord Byron', 'Thomas Hood'] },
{ c: 'Screen Lines', t: 2, q: 'Which character in Goodfellas demands to know whether he is funny like a clown?', a: 'Tommy DeVito', d: ['Henry Hill', 'Jimmy Conway', 'Paulie Cicero'] },

{ c: 'Presidents & Politics', t: 3, q: 'Which candidate told a court in 1918 that while there was a lower class he was in it, and while a soul sat in prison he was not free?', a: 'Eugene V. Debs', d: ['Norman Thomas', 'Robert La Follette', 'Henry Wallace'] },
{ c: 'History & War', t: 3, q: 'Whose lines about the long sobs of autumn violins were broadcast by the BBC as the coded signal to the French underground before D-Day?', a: 'Paul Verlaine', d: ['Arthur Rimbaud', 'Charles Baudelaire', 'Guillaume Apollinaire'] },
{ c: 'Science, Letters & Ideas', t: 3, q: 'Which biologist said his reaction on grasping the argument of the Origin of Species was how extremely stupid not to have thought of that?', a: 'Thomas Huxley', d: ['Alfred Russel Wallace', 'Joseph Hooker', 'Charles Lyell'] },
{ c: 'Books & Authors', t: 3, q: 'Which novelist wrote a story about the death of a Russian judge named Ivan Ilyich?', a: 'Leo Tolstoy', d: ['Fyodor Dostoevsky', 'Nikolai Gogol', 'Ivan Goncharov'] },
{ c: 'Screen Lines', t: 3, q: "Which character insists that deserving has got nothing to do with it in Unforgiven?", a: 'Will Munny', d: ['Little Bill Daggett', 'Ned Logan', 'The Schofield Kid'] },

{ c: 'Presidents & Politics', t: 4, q: 'Which secretary of war said the only way to make a man trustworthy is to trust him?', a: 'Henry Stimson', d: ['Cordell Hull', 'Frank Knox', 'Dean Acheson'] },
{ c: 'History & War', t: 4, q: 'Which nobleman wrote to Philip II pleading inexperience and seasickness, and was ordered to command the Armada anyway?', a: 'The Duke of Medina Sidonia', d: ['The Marquis of Santa Cruz', 'The Duke of Parma', 'Don John of Austria'] },
{ c: 'Science, Letters & Ideas', t: 4, q: 'Which writer preserved the saying of Heraclitus that everything flows and nothing stands still?', a: 'Plato', d: ['Aristotle', 'Diogenes Laertius', 'Plutarch'] },
{ c: 'Books & Authors', t: 4, q: 'Which poet wrote that he can connect nothing with nothing?', a: 'T. S. Eliot', d: ['Ezra Pound', 'W. B. Yeats', 'Wallace Stevens'] },
{ c: 'Screen Lines', t: 4, q: 'Which character tells a jury in The Verdict that today they are the law?', a: 'Frank Galvin', d: ['Ed Concannon', 'Laura Fischer', 'Judge Hoyle'] },

{ c: 'Presidents & Politics', t: 5, q: 'Which Roman emperor wrote that the best revenge is to be unlike the one who did the injury?', a: 'Marcus Aurelius', d: ['Seneca', 'Epictetus', 'Cicero'] },
{ c: 'History & War', t: 5, q: 'Which emperor warned the League of Nations in 1936 that it was his people today and would be theirs tomorrow?', a: 'Haile Selassie', d: ['Menelik II', 'Iyasu V', 'Zewditu'] },
{ c: 'Science, Letters & Ideas', t: 5, q: 'Which mathematician held that the art of proposing a question is worth more than solving it?', a: 'Georg Cantor', d: ['David Hilbert', 'Felix Klein', 'Henri Poincare'] },
{ c: 'Books & Authors', t: 5, q: 'Which poet, on a moonlit beach, begged his love that they be true to one another?', a: 'Matthew Arnold', d: ['Alfred Tennyson', 'Arthur Hugh Clough', 'Robert Browning'] },
{ c: 'Screen Lines', t: 5, q: "Which character calls human beings Casablanca's leading commodity?", a: 'Signor Ferrari', d: ['Captain Renault', 'Ugarte', 'Major Strasser'] },
],

// ── Day 27 ─────────────────────────────────────────────────────────────────
[
{ c: 'Presidents & Politics', t: 1, q: 'Which politician, then the mayor of Minneapolis, told the 1948 Democratic convention it was time to walk out of the shadow of states rights into the bright sunshine of human rights?', a: 'Hubert Humphrey', d: ['Adlai Stevenson', 'Estes Kefauver', 'Alben Barkley'] },
{ c: 'History & War', t: 1, q: 'Which merchant dictated an account of his travels in the East while a prisoner in Genoa?', a: 'Marco Polo', d: ['Ibn Battuta', 'John Mandeville', 'Niccolo da Conti'] },
{ c: 'Science, Letters & Ideas', t: 1, q: 'Which naturalist wrote that a man who dares to waste one hour of time has not discovered the value of life?', a: 'Charles Darwin', d: ['Thomas Huxley', 'Herbert Spencer', 'Alfred Russel Wallace'] },
{ c: 'Books & Authors', t: 1, q: 'Which book opens on a warm evening in the Seeonee hills as a wolf family wakes?', a: 'The Jungle Book', d: ['Just So Stories', 'Kim', 'The Wind in the Willows'] },
{ c: 'Screen Lines', t: 1, q: "Which character closes his address to the United Nations with 'Wakanda forever'?", a: "T'Challa", d: ['Everett Ross', 'Ulysses Klaue', 'Killmonger'] },

{ c: 'Presidents & Politics', t: 2, q: 'Which president wrote that the government is us, that we are the government, you and I?', a: 'Theodore Roosevelt', d: ['Woodrow Wilson', 'William Howard Taft', 'Calvin Coolidge'] },
{ c: 'History & War', t: 2, q: 'Which American general wrote that a good plan violently executed now is better than a perfect plan next week?', a: 'George Patton', d: ['Omar Bradley', 'Courtney Hodges', 'Mark Clark'] },
{ c: 'Science, Letters & Ideas', t: 2, q: 'Which physicist is remembered for quipping that all science is either physics or stamp collecting?', a: 'Ernest Rutherford', d: ['J. J. Thomson', 'Niels Bohr', 'James Chadwick'] },
{ c: 'Books & Authors', t: 2, q: "Which novel opens with the blunt sentence that its title character was drunk?", a: 'Elmer Gantry', d: ['Babbitt', 'Main Street', 'Arrowsmith'] },
{ c: 'Screen Lines', t: 2, q: "Which character shouts 'You can't sit with us!' at Regina George over a dress-code violation?", a: 'Gretchen Wieners', d: ['Janis Ian', 'Cady Heron', 'Damian Hubbard'] },

{ c: 'Presidents & Politics', t: 3, q: 'Which president told a Yale audience that the great enemy of truth is often not the lie but the myth?', a: 'John F. Kennedy', d: ['Lyndon B. Johnson', 'Dwight D. Eisenhower', 'Adlai Stevenson'] },
{ c: 'History & War', t: 3, q: 'Which Irish leader said on signing the 1921 treaty that he had signed his own death warrant?', a: 'Michael Collins', d: ['Eamon de Valera', 'Arthur Griffith', 'Cathal Brugha'] },
{ c: 'Science, Letters & Ideas', t: 3, q: 'Which novelist and physicist argued that the sciences and the humanities had become two cultures no longer able to speak?', a: 'C. P. Snow', d: ['Aldous Huxley', 'Bertrand Russell', 'F. R. Leavis'] },
{ c: 'Books & Authors', t: 3, q: 'Which poet demanded that all the clocks be stopped and the telephone cut off?', a: 'W. H. Auden', d: ['Stephen Spender', 'Louis MacNeice', 'Cecil Day-Lewis'] },
{ c: 'Screen Lines', t: 3, q: 'Which character in The Wire warns that if you come at the king, you best not miss?', a: 'Omar Little', d: ['Stringer Bell', 'Avon Barksdale', 'Jimmy McNulty'] },

{ c: 'Presidents & Politics', t: 4, q: 'Which chancellor said on resigning that the government gave the impression of being in office but not in power?', a: 'Norman Lamont', d: ['John Major', 'Michael Heseltine', 'Kenneth Clarke'] },
{ c: 'History & War', t: 4, q: "Which Spartan commander answered critics of his trickery by saying that where the lion's skin will not reach, it must be pieced out with the fox's?", a: 'Lysander', d: ['Brasidas', 'Gylippus', 'Agesilaus'] },
{ c: 'Science, Letters & Ideas', t: 4, q: 'Which essayist wrote that a foolish consistency is the hobgoblin of little minds?', a: 'Ralph Waldo Emerson', d: ['Henry David Thoreau', 'Walt Whitman', 'Margaret Fuller'] },
{ c: 'Books & Authors', t: 4, q: 'Which novelist wrote of a mother haunted by the daughter she lost, in a book called Beloved?', a: 'Toni Morrison', d: ['Alice Walker', 'Gloria Naylor', 'Paule Marshall'] },
{ c: 'Screen Lines', t: 4, q: "Which character asks a rival 'How do you like them apples?' through a window?", a: 'Will Hunting', d: ['Chuckie Sullivan', 'Sean Maguire', 'Skylar'] },

{ c: 'Presidents & Politics', t: 5, q: "Which lord chancellor said on the scaffold that he died the king's good servant, but God's first?", a: 'Thomas More', d: ['Thomas Cromwell', 'Thomas Wolsey', 'John Fisher'] },
{ c: 'History & War', t: 5, q: 'Which soldier of Cortes wrote an eyewitness history of the conquest of Mexico in his old age?', a: 'Bernal Diaz del Castillo', d: ['Francisco Lopez de Gomara', 'Toribio de Benavente', 'Diego Duran'] },
{ c: 'Science, Letters & Ideas', t: 5, q: 'Which mathematician spent the night before a fatal duel writing out a new branch of algebra?', a: 'Evariste Galois', d: ['Niels Henrik Abel', 'Carl Jacobi', 'Augustin-Louis Cauchy'] },
{ c: 'Books & Authors', t: 5, q: 'Which Russian novelist wrote a satire in which the devil visits Moscow?', a: 'Mikhail Bulgakov', d: ['Andrei Platonov', 'Isaac Babel', 'Yevgeny Zamyatin'] },
{ c: 'Screen Lines', t: 5, q: 'Which character says that every man dies, but not every man really lives?', a: 'William Wallace', d: ['Robert the Bruce', 'Hamish Campbell', 'Argyle Wallace'] },
],

// ── Day 28 ─────────────────────────────────────────────────────────────────
[
{ c: 'Presidents & Politics', t: 1, q: 'Which president appealed in 1969 to the great silent majority of Americans for support over Vietnam?', a: 'Richard Nixon', d: ['Lyndon B. Johnson', 'Dwight D. Eisenhower', 'John F. Kennedy'] },
{ c: 'History & War', t: 1, q: 'Which nurse attributed her success to never having given or taken an excuse?', a: 'Florence Nightingale', d: ['Mary Seacole', 'Clara Barton', 'Edith Cavell'] },
{ c: 'Science, Letters & Ideas', t: 1, q: 'Which scientist wrote to her brother that one never notices what has been done, only what remains to be done?', a: 'Marie Curie', d: ['Lise Meitner', 'Irene Joliot-Curie', 'Dorothy Hodgkin'] },
{ c: 'Books & Authors', t: 1, q: 'Which novel opens with a girl growing tired of sitting by her sister on the bank?', a: "Alice's Adventures in Wonderland", d: ['Through the Looking-Glass', 'The Water-Babies', 'Peter Pan'] },
{ c: 'Screen Lines', t: 1, q: "Which character wishes that the odds be ever in your favour?", a: 'Effie Trinket', d: ['Katniss Everdeen', 'Haymitch Abernathy', 'Caesar Flickerman'] },

{ c: 'Presidents & Politics', t: 2, q: 'Which prime minister called Russia a riddle wrapped in a mystery inside an enigma?', a: 'Winston Churchill', d: ['Neville Chamberlain', 'Clement Attlee', 'Anthony Eden'] },
{ c: 'History & War', t: 2, q: 'Which emperor is said to have lamented as he died what an artist the world was losing in him?', a: 'Nero', d: ['Caligula', 'Commodus', 'Domitian'] },
{ c: 'Science, Letters & Ideas', t: 2, q: 'Which physician described the circulation of the blood in a 1628 treatise?', a: 'William Harvey', d: ['Andreas Vesalius', 'Ambroise Pare', 'Marcello Malpighi'] },
{ c: 'Books & Authors', t: 2, q: 'Which novel opens with the scent of bitter almonds and the fate of unrequited love?', a: 'Love in the Time of Cholera', d: ['One Hundred Years of Solitude', 'Chronicle of a Death Foretold', 'The General in His Labyrinth'] },
{ c: 'Screen Lines', t: 2, q: "Which character growls 'Nobody tosses a Dwarf' before a leap?", a: 'Gimli', d: ['Legolas', 'Aragorn', 'Boromir'] },

{ c: 'Presidents & Politics', t: 3, q: 'Which president set out fourteen points and called for a league of nations?', a: 'Woodrow Wilson', d: ['Theodore Roosevelt', 'Warren G. Harding', 'William Howard Taft'] },
{ c: 'History & War', t: 3, q: 'Which queen apologised to her executioner in 1793 for treading on his foot?', a: 'Marie Antoinette', d: ['Madame Roland', 'Charlotte Corday', 'Madame du Barry'] },
{ c: 'Science, Letters & Ideas', t: 3, q: 'Which economist wrote that we expect our dinner not from the benevolence of the butcher but from his self-interest?', a: 'Adam Smith', d: ['David Ricardo', 'Nassau Senior', 'Jean-Baptiste Say'] },
{ c: 'Books & Authors', t: 3, q: 'Which novelist wrote a book narrated by a woman who never gives her own name, haunted by her husband’s first wife?', a: 'Daphne du Maurier', d: ['Elizabeth Bowen', 'Rosamond Lehmann', 'Mary Webb'] },
{ c: 'Screen Lines', t: 3, q: "Which character keeps asking 'Is it safe?' over a dentist's chair?", a: 'Christian Szell', d: ['Babe Levy', 'Doc Levy', 'Janeway'] },

{ c: 'Presidents & Politics', t: 4, q: 'Which secretary of state remarked that power is the ultimate aphrodisiac?', a: 'Henry Kissinger', d: ['Dean Rusk', 'William Rogers', 'Cyrus Vance'] },
{ c: 'History & War', t: 4, q: 'Which king of Epirus won the costly victories that gave a phrase to the language?', a: 'Pyrrhus', d: ['Hannibal', 'Antiochus III', 'Mithridates'] },
{ c: 'Science, Letters & Ideas', t: 4, q: 'Which mathematician, asked why God did not appear in his account of the heavens, is said to have replied that he had no need of that hypothesis?', a: 'Pierre-Simon Laplace', d: ['Joseph-Louis Lagrange', "Jean le Rond d'Alembert", 'Adrien-Marie Legendre'] },
{ c: 'Books & Authors', t: 4, q: 'Which Nigerian novelist took the title of his first book from a line by W. B. Yeats?', a: 'Chinua Achebe', d: ['Wole Soyinka', "Ngugi wa Thiong'o", 'Ben Okri'] },
{ c: 'Screen Lines', t: 4, q: "Which character bursts in announcing that nobody expects the Spanish Inquisition?", a: 'Cardinal Ximenez', d: ['Cardinal Biggles', 'Cardinal Fang', 'Reg'] },

{ c: 'Presidents & Politics', t: 5, q: 'Which king is said to have asked who would rid him of a turbulent priest?', a: 'Henry II', d: ['Henry I', 'Stephen', 'Richard I'] },
{ c: 'History & War', t: 5, q: 'Which Icelandic chieftain wrote the Prose Edda, the fullest written source for the myths of the north?', a: 'Snorri Sturluson', d: ['Saxo Grammaticus', 'Ari Thorgilsson', 'Sturla Thordarson'] },
{ c: 'Science, Letters & Ideas', t: 5, q: 'Which astronomer wrote that if the comet returned as he predicted, candid posterity would not refuse to acknowledge that an Englishman had found it first?', a: 'Edmond Halley', d: ['John Flamsteed', 'James Bradley', 'Nevil Maskelyne'] },
{ c: 'Books & Authors', t: 5, q: 'Which Sicilian prince wrote a single novel, published after his death, about a fading aristocracy?', a: 'Giuseppe Tomasi di Lampedusa', d: ['Italo Calvino', 'Alberto Moravia', 'Cesare Pavese'] },
{ c: 'Screen Lines', t: 5, q: 'Which character tells his brother in the back of a car that he could have been a contender?', a: 'Terry Malloy', d: ['Charley Malloy', 'Johnny Friendly', 'Edie Doyle'] },
],

// ── Day 29 ─────────────────────────────────────────────────────────────────
[
{ c: 'Presidents & Politics', t: 1, q: 'Which president wrote from the new presidential mansion a prayer that none but honest and wise men might ever rule under its roof?', a: 'John Adams', d: ['George Washington', 'Thomas Jefferson', 'James Madison'] },
{ c: 'History & War', t: 1, q: "Which soldier poet called it the old lie that it is sweet and fitting to die for one's country?", a: 'Wilfred Owen', d: ['Siegfried Sassoon', 'Rupert Brooke', 'Robert Graves'] },
{ c: 'Science, Letters & Ideas', t: 1, q: 'Which chemist is said to have told a friend that he saw in a dream a table in which all the elements fell into place?', a: 'Dmitri Mendeleev', d: ['Antoine Lavoisier', 'John Dalton', 'Robert Boyle'] },
{ c: 'Books & Authors', t: 1, q: 'Which picture book ends with a tired old man resting on the stump of the friend who had given him everything?', a: 'The Giving Tree', d: ['The Velveteen Rabbit', 'Corduroy', 'The Little House'] },
{ c: 'Screen Lines', t: 1, q: 'Which character narrates the mission to boldly go where no man has gone before?', a: 'Captain Kirk', d: ['Spock', 'Dr. McCoy', 'Montgomery Scott'] },

{ c: 'Presidents & Politics', t: 2, q: 'Which president campaigned on the doctrine of peace through strength?', a: 'Ronald Reagan', d: ['Richard Nixon', 'Jimmy Carter', 'George H. W. Bush'] },
{ c: 'History & War', t: 2, q: 'Which commander answered a request for terms at Fort Donelson by saying that nothing but unconditional and immediate surrender could be accepted?', a: 'Ulysses S. Grant', d: ['George Meade', 'Henry Halleck', 'George McClellan'] },
{ c: 'Science, Letters & Ideas', t: 2, q: 'Which surgeon set out the antiseptic principle of surgery in a series of papers published in The Lancet in 1867?', a: 'Joseph Lister', d: ['Ignaz Semmelweis', 'William Halsted', 'John Hunter'] },
{ c: 'Books & Authors', t: 2, q: "Which novel opens with the warning 'You better not never tell nobody but God'?", a: 'The Color Purple', d: ['Beloved', 'Their Eyes Were Watching God', 'Sula'] },
{ c: 'Screen Lines', t: 2, q: "Which character says he is serious, and not to call him Shirley?", a: 'Dr. Rumack', d: ['Ted Striker', 'Elaine Dickinson', 'Captain Oveur'] },

{ c: 'Presidents & Politics', t: 3, q: 'Which prime minister told a Harvard audience that the price of greatness is responsibility?', a: 'Winston Churchill', d: ['Clement Attlee', 'Anthony Eden', 'Harold Macmillan'] },
{ c: 'History & War', t: 3, q: 'Which general is said to have told his army before a battle in Egypt that forty centuries were looking down on them from the pyramids?', a: 'Napoleon Bonaparte', d: ['Jean-Baptiste Kleber', 'Louis Desaix', 'Jean Lannes'] },
{ c: 'Science, Letters & Ideas', t: 3, q: 'Which philosopher argued that a just city would be governed by philosopher kings?', a: 'Plato', d: ['Aristotle', 'Xenophon', 'Isocrates'] },
{ c: 'Books & Authors', t: 3, q: 'Which poet asked what happens to a dream deferred?', a: 'Langston Hughes', d: ['Countee Cullen', 'Claude McKay', 'Jean Toomer'] },
{ c: 'Screen Lines', t: 3, q: 'Which character warns a kidnapper down the phone that he has a very particular set of skills?', a: 'Bryan Mills', d: ['Kim Mills', 'Lenore', 'Marko'] },

{ c: 'Presidents & Politics', t: 4, q: 'Which president complained that nothing brings out the lower traits of human nature like office seeking?', a: 'Rutherford B. Hayes', d: ['James Garfield', 'Chester Arthur', 'Grover Cleveland'] },
{ c: 'History & War', t: 4, q: 'Which French general, watching a British cavalry charge at Balaclava, called it magnificent but said it was not war?', a: 'Pierre Bosquet', d: ['Francois Canrobert', 'Armand de Saint-Arnaud', 'Patrice de MacMahon'] },
{ c: 'Science, Letters & Ideas', t: 4, q: 'Which writer answered Edmund Burke and then argued for the rights of woman?', a: 'Mary Wollstonecraft', d: ['Harriet Taylor Mill', 'Olympe de Gouges', 'Hannah More'] },
{ c: 'Books & Authors', t: 4, q: 'Which novelist wrote Middlemarch under a name that was not her own?', a: 'George Eliot', d: ['Elizabeth Gaskell', 'Margaret Oliphant', 'Charlotte Yonge'] },
{ c: 'Screen Lines', t: 4, q: "Which character yells 'Get to the chopper!' in Predator?", a: 'Dutch', d: ['Dillon', 'Blain', 'Billy'] },

{ c: 'Presidents & Politics', t: 5, q: "Which MP quoted Cromwell's words back at Neville Chamberlain in the Commons in 1940?", a: 'Leo Amery', d: ['Clement Attlee', 'Anthony Eden', 'David Lloyd George'] },
{ c: 'History & War', t: 5, q: 'Which Athenian playwright had his service at Marathon, not his plays, carved on his tomb?', a: 'Aeschylus', d: ['Sophocles', 'Euripides', 'Aristophanes'] },
{ c: 'Science, Letters & Ideas', t: 5, q: 'Which mathematician set out twenty-three unsolved problems to guide the new century in 1900?', a: 'David Hilbert', d: ['Henri Poincare', 'Felix Klein', 'Hermann Minkowski'] },
{ c: 'Books & Authors', t: 5, q: 'Which German novelist wrote a book narrated by a boy who refuses to grow?', a: 'Gunter Grass', d: ['Heinrich Boll', 'Siegfried Lenz', 'Uwe Johnson'] },
{ c: 'Screen Lines', t: 5, q: 'Which character explains that some men just want to watch the world burn?', a: 'Alfred Pennyworth', d: ['The Joker', 'Bruce Wayne', 'Lucius Fox'] },
],

// ── Day 30 ─────────────────────────────────────────────────────────────────
[
{ c: 'Presidents & Politics', t: 1, q: 'Which president wrote to a Rhode Island synagogue that the government of the United States gives to bigotry no sanction and to persecution no assistance?', a: 'George Washington', d: ['John Adams', 'Thomas Jefferson', 'James Madison'] },
{ c: 'History & War', t: 1, q: 'Which climber, asked why he wanted to climb Everest, answered that it was because it is there?', a: 'George Mallory', d: ['Edmund Hillary', 'Tenzing Norgay', 'Eric Shipton'] },
{ c: 'Science, Letters & Ideas', t: 1, q: 'Which physicist wrote that the eternal mystery of the world is its comprehensibility?', a: 'Albert Einstein', d: ['Max Planck', 'Hendrik Lorentz', 'Henri Poincare'] },
{ c: 'Books & Authors', t: 1, q: 'Which novel opens with a farmer locking the hen-houses for the night but forgetting the pop-holes?', a: 'Animal Farm', d: ['Nineteen Eighty-Four', 'Watership Down', 'Lord of the Flies'] },
{ c: 'Screen Lines', t: 1, q: "Which character announces 'I'm Mary Poppins, y'all' in Guardians of the Galaxy Vol. 2?", a: 'Yondu', d: ['Star-Lord', 'Rocket', 'Drax'] },

{ c: 'Presidents & Politics', t: 2, q: 'Which president wrote that the only limit to our realisation of tomorrow will be our doubts of today?', a: 'Franklin D. Roosevelt', d: ['Woodrow Wilson', 'Harry S. Truman', 'Herbert Hoover'] },
{ c: 'History & War', t: 2, q: 'Which German general wrote Infantry Attacks about his First World War service, years before he led the Afrika Korps?', a: 'Erwin Rommel', d: ['Heinz Guderian', 'Erich von Manstein', 'Albert Kesselring'] },
{ c: 'Science, Letters & Ideas', t: 2, q: 'Which physicist devised the thought experiment about a cat in a sealed box?', a: 'Erwin Schrodinger', d: ['Werner Heisenberg', 'Niels Bohr', 'Paul Dirac'] },
{ c: 'Books & Authors', t: 2, q: 'Which novel opens outside a squat grey building of only thirty-four storeys?', a: 'Brave New World', d: ['Nineteen Eighty-Four', 'Fahrenheit 451', 'Erewhon'] },
{ c: 'Screen Lines', t: 2, q: 'Which character says you either die a hero or live long enough to see yourself become the villain?', a: 'Harvey Dent', d: ['Bruce Wayne', 'The Joker', 'Rachel Dawes'] },

{ c: 'Presidents & Politics', t: 3, q: 'Which president said he had never advocated war except as a means of peace?', a: 'Ulysses S. Grant', d: ['William Tecumseh Sherman', 'Rutherford B. Hayes', 'James Garfield'] },
{ c: 'History & War', t: 3, q: "Which German officer said, on hearing that the plot against Hitler had failed, that a man's moral worth is settled only where he is ready to give his life for his convictions?", a: 'Henning von Tresckow', d: ['Claus von Stauffenberg', 'Ludwig Beck', 'Carl Goerdeler'] },
{ c: 'Science, Letters & Ideas', t: 3, q: 'Which philosopher wrote Being and Time?', a: 'Martin Heidegger', d: ['Edmund Husserl', 'Karl Jaspers', 'Hans-Georg Gadamer'] },
{ c: 'Books & Authors', t: 3, q: 'Which Colombian novelist wrote the saga of the Buendia family in Macondo?', a: 'Gabriel Garcia Marquez', d: ['Mario Vargas Llosa', 'Julio Cortazar', 'Carlos Fuentes'] },
{ c: 'Screen Lines', t: 3, q: 'Which character describes eating a census taker with fava beans and a nice Chianti?', a: 'Hannibal Lecter', d: ['Clarice Starling', 'Jack Crawford', 'Buffalo Bill'] },

{ c: 'Presidents & Politics', t: 4, q: 'Which author of the Federalist Papers argued that energy in the executive is a leading character in good government?', a: 'Alexander Hamilton', d: ['James Madison', 'John Jay', 'Gouverneur Morris'] },
{ c: 'History & War', t: 4, q: 'Which emperor is said to have seen a sign in the sky before a battle, with words telling him to conquer by it?', a: 'Constantine', d: ['Maxentius', 'Licinius', 'Galerius'] },
{ c: 'Science, Letters & Ideas', t: 4, q: 'Which Greek astronomer is credited with the verse saying that when he traces the winding courses of the stars he no longer touches the earth with his feet?', a: 'Ptolemy', d: ['Hipparchus', 'Eratosthenes', 'Aristarchus'] },
{ c: 'Books & Authors', t: 4, q: 'Which poet wrote of anyone who lived in a pretty how town?', a: 'e. e. cummings', d: ['Wallace Stevens', 'Hart Crane', 'William Carlos Williams'] },
{ c: 'Screen Lines', t: 4, q: "Which character says 'Chewie, we're home' on stepping back aboard his old ship?", a: 'Han Solo', d: ['Leia Organa', 'Rey', 'Finn'] },

{ c: 'Presidents & Politics', t: 5, q: 'Which revolutionary leader told his executioner to show his head to the people, because it was well worth seeing?', a: 'Georges Danton', d: ['Jean-Paul Marat', 'Camille Desmoulins', 'Louis Saint-Just'] },
{ c: 'History & War', t: 5, q: 'Which admiral had a stone tablet raised recording that his fleets had crossed more than a hundred thousand li of vast ocean?', a: 'Zheng He', d: ['Wang Jinghong', 'Hong Bao', 'Zhou Man'] },
{ c: 'Science, Letters & Ideas', t: 5, q: 'Which Scottish philosopher wrote A Treatise of Human Nature in his twenties?', a: 'David Hume', d: ['Adam Ferguson', 'Thomas Reid', 'Dugald Stewart'] },
{ c: 'Books & Authors', t: 5, q: 'Which Italian novelist wrote a book made of ten unfinished novels addressed to its reader?', a: 'Italo Calvino', d: ['Umberto Eco', 'Primo Levi', 'Cesare Pavese'] },
{ c: 'Screen Lines', t: 5, q: 'Which character descends a staircase declaring she is ready for her close-up?', a: 'Norma Desmond', d: ['Joe Gillis', 'Max von Mayerling', 'Betty Schaefer'] },
],


// ── Day 31 ──────────────────────────────────────────────────────────────
[
{ c: 'Presidents & Politics', t: 1, q: 'Which future president told an Illinois convention in 1858 that a house divided against itself cannot stand?', a: 'Abraham Lincoln', d: ['Stephen A. Douglas', 'Salmon P. Chase', 'John C. Fremont'] },
{ c: 'History & War', t: 1, q: 'Which German fighter pilot, known to his enemies as the Red Baron, was credited with eighty victories before he was shot down in April 1918?', a: 'Manfred von Richthofen', d: ['Ernst Udet', 'Werner Voss', 'Oswald Boelcke'] },
{ c: 'Science, Letters & Ideas', t: 1, q: 'Which physicist published the special and general theories of relativity?', a: 'Albert Einstein', d: ['Niels Bohr', 'Max Planck', 'Werner Heisenberg'] },
{ c: 'Books & Authors', t: 1, q: 'Which character asks \'Please, sir, I want some more\' in a Dickens workhouse novel?', a: 'Oliver Twist', d: ['Pip', 'David Copperfield', 'Tiny Tim'] },
{ c: 'Screen Lines', t: 1, q: 'Which character reveals to Luke Skywalker \'No, I am your father\' in The Empire Strikes Back?', a: 'Darth Vader', d: ['Lando Calrissian', 'Boba Fett', 'Obi-Wan Kenobi'] },

{ c: 'Presidents & Politics', t: 2, q: 'Which president granted his predecessor a full and unconditional pardon a month after taking office in 1974?', a: 'Gerald Ford', d: ['Jimmy Carter', 'Ronald Reagan', 'George H. W. Bush'] },
{ c: 'History & War', t: 2, q: 'Which Norse seafarer is credited in the Icelandic sagas with landing in a country west of Greenland that he named Vinland?', a: 'Leif Erikson', d: ['Erik the Red', 'Bjarni Herjolfsson', 'Thorfinn Karlsefni'] },
{ c: 'Science, Letters & Ideas', t: 2, q: 'Which scientist told a visiting biographer that the notion of gravitation came to him as he watched an apple fall in his garden?', a: 'Isaac Newton', d: ['Robert Hooke', 'Edmond Halley', 'Christiaan Huygens'] },
{ c: 'Books & Authors', t: 2, q: 'Which character in Hamlet gives the parting advice \'Neither a borrower nor a lender be\'?', a: 'Polonius', d: ['Horatio', 'Claudius', 'Laertes'] },
{ c: 'Screen Lines', t: 2, q: 'Which character in the third James Bond film answers the question of whether he expects Bond to talk with \'No, I expect you to die!\'?', a: 'Auric Goldfinger', d: ['Felix Leiter', 'Pussy Galore', 'Jill Masterson'] },

{ c: 'Presidents & Politics', t: 3, q: 'Which campaigner known as the Liberator led the mass movement that won Catholic emancipation in 1829?', a: 'Daniel O\'Connell', d: ['Charles Stewart Parnell', 'Henry Grattan', 'Robert Emmet'] },
{ c: 'History & War', t: 3, q: 'Which Frankish commander halted an Arab army near Tours in 732?', a: 'Charles Martel', d: ['Clovis I', 'Pepin the Short', 'Charles the Bald'] },
{ c: 'Science, Letters & Ideas', t: 3, q: 'Which thinker called religion the sigh of the oppressed creature and the opium of the people?', a: 'Karl Marx', d: ['Ludwig Feuerbach', 'Mikhail Bakunin', 'Friedrich Nietzsche'] },
{ c: 'Books & Authors', t: 3, q: 'Which character in Great Expectations sits in a rotting wedding dress with every clock stopped at twenty minutes to nine?', a: 'Miss Havisham', d: ['Estella', 'Mrs. Joe Gargery', 'Biddy'] },
{ c: 'Screen Lines', t: 3, q: 'Which character in It\'s a Wonderful Life reports that teacher says every time a bell rings an angel gets his wings?', a: 'Zuzu Bailey', d: ['George Bailey', 'Clarence Odbody', 'Mary Bailey'] },

{ c: 'Presidents & Politics', t: 4, q: 'Which prime minister wrote to his party chairman in 1945 that a period of silence on his part would be welcome?', a: 'Clement Attlee', d: ['Harold Wilson', 'Herbert Morrison', 'Ernest Bevin'] },
{ c: 'History & War', t: 4, q: 'Which Greek commander wrote of his retreating soldiers crying out \'The sea! The sea!\' when they finally sighted the water?', a: 'Xenophon', d: ['Thucydides', 'Herodotus', 'Arrian'] },
{ c: 'Science, Letters & Ideas', t: 4, q: 'Which physicist compared an alpha particle bouncing back off gold foil to a fifteen-inch shell rebounding from tissue paper?', a: 'Ernest Rutherford', d: ['J. J. Thomson', 'James Chadwick', 'Niels Bohr'] },
{ c: 'Books & Authors', t: 4, q: 'Which poet wrote \'Do I contradict myself? Very well then I contradict myself, I am large, I contain multitudes\'?', a: 'Walt Whitman', d: ['Ralph Waldo Emerson', 'Carl Sandburg', 'Hart Crane'] },
{ c: 'Screen Lines', t: 4, q: 'Which character warns Indiana Jones \'Asps. Very dangerous. You go first\' in Raiders of the Lost Ark?', a: 'Sallah', d: ['Marion Ravenwood', 'Marcus Brody', 'Rene Belloq'] },

{ c: 'Presidents & Politics', t: 5, q: 'Which British MP wrote in a study of Joseph Chamberlain that all political lives end in failure, because that is the nature of politics?', a: 'Enoch Powell', d: ['Iain Macleod', 'Michael Foot', 'Roy Jenkins'] },
{ c: 'History & War', t: 5, q: 'Which Roman emperor is recorded as composing a farewell poem addressed to his own little wandering soul as he lay dying?', a: 'Hadrian', d: ['Marcus Aurelius', 'Trajan', 'Antoninus Pius'] },
{ c: 'Science, Letters & Ideas', t: 5, q: 'Which Scottish geologist concluded that the rock record shows no vestige of a beginning and no prospect of an end?', a: 'James Hutton', d: ['Charles Lyell', 'Georges Cuvier', 'William Smith'] },
{ c: 'Books & Authors', t: 5, q: 'Which poet declared that death is the mother of beauty?', a: 'Wallace Stevens', d: ['Hart Crane', 'Robinson Jeffers', 'Conrad Aiken'] },
{ c: 'Screen Lines', t: 5, q: 'Which character speaks the opening line of The Godfather, \'I believe in America\'?', a: 'Amerigo Bonasera', d: ['Vito Corleone', 'Tom Hagen', 'Sonny Corleone'] },
],

// ── Day 32 ──────────────────────────────────────────────────────────────
[
{ c: 'Presidents & Politics', t: 1, q: 'Which president asked Congress for a declaration of war on a day he said would live in infamy?', a: 'Franklin D. Roosevelt', d: ['Woodrow Wilson', 'Harry S. Truman', 'Herbert Hoover'] },
{ c: 'History & War', t: 1, q: 'Which barrier went up overnight in August 1961 to seal off the western sectors of a divided city, and was opened again in November 1989?', a: 'The Berlin Wall', d: ['The Maginot Line', 'The Siegfried Line', 'The Oder-Neisse Line'] },
{ c: 'Science, Letters & Ideas', t: 1, q: 'Which naturalist set out the theory of natural selection in On the Origin of Species?', a: 'Charles Darwin', d: ['Alfred Russel Wallace', 'Jean-Baptiste Lamarck', 'Thomas Huxley'] },
{ c: 'Books & Authors', t: 1, q: 'Which character greets Christmas with the words \'Bah! Humbug!\'?', a: 'Ebenezer Scrooge', d: ['Jacob Marley', 'Bob Cratchit', 'Mr. Fezziwig'] },
{ c: 'Screen Lines', t: 1, q: 'Which character delivers the parting line to Scarlett, \'Frankly, my dear, I don\'t give a damn\'?', a: 'Rhett Butler', d: ['Ashley Wilkes', 'Gerald O\'Hara', 'Dr. Meade'] },

{ c: 'Presidents & Politics', t: 2, q: 'Who became the first woman to sit on the Supreme Court of the United States, taking her seat in 1981?', a: 'Sandra Day O\'Connor', d: ['Ruth Bader Ginsburg', 'Sonia Sotomayor', 'Elena Kagan'] },
{ c: 'History & War', t: 2, q: 'Which Chinese communist leader declared that political power grows out of the barrel of a gun?', a: 'Mao Zedong', d: ['Zhou Enlai', 'Deng Xiaoping', 'Chiang Kai-shek'] },
{ c: 'Science, Letters & Ideas', t: 2, q: 'Which French naval officer co-invented the aqualung and filmed the sea floor for a worldwide television audience?', a: 'Jacques Cousteau', d: ['Auguste Piccard', 'William Beebe', 'Hans Hass'] },
{ c: 'Books & Authors', t: 2, q: 'Which author wrote that a man can be destroyed but not defeated?', a: 'Ernest Hemingway', d: ['John Steinbeck', 'F. Scott Fitzgerald', 'Jack London'] },
{ c: 'Screen Lines', t: 2, q: 'Which character shouts \'Get away from her, you bitch!\' at the alien queen in Aliens?', a: 'Ellen Ripley', d: ['Corporal Hicks', 'Carter Burke', 'Private Vasquez'] },

{ c: 'Presidents & Politics', t: 3, q: 'Which minister-president told a Prussian budget committee in 1862 that the great questions of the day would be settled by iron and blood?', a: 'Otto von Bismarck', d: ['Helmuth von Moltke', 'Albrecht von Roon', 'Leo von Caprivi'] },
{ c: 'History & War', t: 3, q: 'Which American war correspondent, famous for reporting the war from the foxhole, was killed by machine gun fire on Ie Shima in 1945?', a: 'Ernie Pyle', d: ['Bill Mauldin', 'Ernest Hemingway', 'Edward R. Murrow'] },
{ c: 'Science, Letters & Ideas', t: 3, q: 'Which philosopher ended an essay on the absurd by insisting that one must imagine Sisyphus happy?', a: 'Albert Camus', d: ['Jean-Paul Sartre', 'Andre Malraux', 'Maurice Merleau-Ponty'] },
{ c: 'Books & Authors', t: 3, q: 'Which character in Moby-Dick cries \'From hell\'s heart I stab at thee\' as he dies?', a: 'Captain Ahab', d: ['Starbuck', 'Ishmael', 'Stubb'] },
{ c: 'Screen Lines', t: 3, q: 'Which character staggers out of a hotel ballroom covered in ectoplasm and announces \'He slimed me\'?', a: 'Peter Venkman', d: ['Ray Stantz', 'Egon Spengler', 'Winston Zeddemore'] },

{ c: 'Presidents & Politics', t: 4, q: 'Which prime minister promised in 1918 to make Britain a fit country for heroes to live in?', a: 'David Lloyd George', d: ['Herbert Asquith', 'Bonar Law', 'Stanley Baldwin'] },
{ c: 'History & War', t: 4, q: 'Which abolitionist told an 1857 audience that power concedes nothing without a demand, and never did and never will?', a: 'Frederick Douglass', d: ['William Lloyd Garrison', 'Henry Highland Garnet', 'Wendell Phillips'] },
{ c: 'Science, Letters & Ideas', t: 4, q: 'Which architect declared that a house is a machine for living in?', a: 'Le Corbusier', d: ['Walter Gropius', 'Frank Lloyd Wright', 'Adolf Loos'] },
{ c: 'Books & Authors', t: 4, q: 'Which novelist opened a vast work with the narrator recalling that for a long time he used to go to bed early?', a: 'Marcel Proust', d: ['Gustave Flaubert', 'Andre Gide', 'Stendhal'] },
{ c: 'Screen Lines', t: 4, q: 'Which character in Jaws recounts the sinking of the USS Indianapolis and the sharks that came for the crew?', a: 'Quint', d: ['Matt Hooper', 'Chief Brody', 'Mayor Vaughn'] },

{ c: 'Presidents & Politics', t: 5, q: 'Which first minister said of the crowds cheering war with Spain in 1739 that they now ring the bells, but they will soon wring their hands?', a: 'Robert Walpole', d: ['William Pitt the Elder', 'Henry Pelham', 'Lord North'] },
{ c: 'History & War', t: 5, q: 'Which retired Roman emperor is said to have answered a plea to resume the throne by telling the envoys to come and look at the cabbages he had planted?', a: 'Diocletian', d: ['Maximian', 'Galerius', 'Constantius Chlorus'] },
{ c: 'Science, Letters & Ideas', t: 5, q: 'Which physicist has his entropy formula, S = k log W, carved on his gravestone in Vienna?', a: 'Ludwig Boltzmann', d: ['Rudolf Clausius', 'Josiah Willard Gibbs', 'James Clerk Maxwell'] },
{ c: 'Books & Authors', t: 5, q: 'Which poet ended an ars poetica by insisting that a poem should not mean but be?', a: 'Archibald MacLeish', d: ['Marianne Moore', 'Robert Lowell', 'Delmore Schwartz'] },
{ c: 'Screen Lines', t: 5, q: 'Which character in Citizen Kane recalls a girl in a white dress with a parasol whom he saw for a second and has thought of every month since?', a: 'Mr. Bernstein', d: ['Jedediah Leland', 'Jerry Thompson', 'Charles Foster Kane'] },
],

// ── Day 33 ──────────────────────────────────────────────────────────────
[
{ c: 'Presidents & Politics', t: 1, q: 'Which former first lady became the first woman nominated for president by a major American party, in 2016?', a: 'Hillary Clinton', d: ['Geraldine Ferraro', 'Sarah Palin', 'Elizabeth Warren'] },
{ c: 'History & War', t: 1, q: 'Who told the Commons in June 1940 that if the British Empire lasted a thousand years, men would still say this was their finest hour?', a: 'Winston Churchill', d: ['Neville Chamberlain', 'Lord Halifax', 'Clement Attlee'] },
{ c: 'Science, Letters & Ideas', t: 1, q: 'Which mathematician led the Bletchley Park hut that broke the German naval Enigma cipher?', a: 'Alan Turing', d: ['Alonzo Church', 'John von Neumann', 'Claude Shannon'] },
{ c: 'Books & Authors', t: 1, q: 'Which character asks from a balcony \'O Romeo, Romeo, wherefore art thou Romeo?\'', a: 'Juliet', d: ['Rosaline', 'Lady Capulet', 'The Nurse'] },
{ c: 'Screen Lines', t: 1, q: 'Which character says \'Toto, I\'ve a feeling we\'re not in Kansas anymore\'?', a: 'Dorothy Gale', d: ['Glinda', 'Auntie Em', 'The Wicked Witch of the West'] },

{ c: 'Presidents & Politics', t: 2, q: 'Which lawyer argued a run of sex discrimination cases before the Supreme Court in the 1970s and joined it in 1993?', a: 'Ruth Bader Ginsburg', d: ['Sandra Day O\'Connor', 'Pauli Murray', 'Elena Kagan'] },
{ c: 'History & War', t: 2, q: 'Which wounded Red Army sergeant designed the 1947 assault rifle that became the most widely produced firearm in history?', a: 'Mikhail Kalashnikov', d: ['Sergei Simonov', 'Fedor Tokarev', 'Georgy Shpagin'] },
{ c: 'Science, Letters & Ideas', t: 2, q: 'Which Florentine official wrote The Prince as a handbook for rulers?', a: 'Niccolo Machiavelli', d: ['Francesco Guicciardini', 'Baldassare Castiglione', 'Leon Battista Alberti'] },
{ c: 'Books & Authors', t: 2, q: 'Which character is the respectable London doctor whose homemade potion lets loose a violent second self?', a: 'Henry Jekyll', d: ['Edward Hyde', 'Gabriel Utterson', 'Hastie Lanyon'] },
{ c: 'Screen Lines', t: 2, q: 'Which character on Diff\'rent Strokes answers his older brother with \'What\'chu talkin\' \'bout, Willis?\'', a: 'Arnold Jackson', d: ['Philip Drummond', 'Kimberly Drummond', 'Mrs. Garrett'] },

{ c: 'Presidents & Politics', t: 3, q: 'Which counsel for the NAACP argued the school segregation cases of 1954 and became the first Black justice of the Supreme Court?', a: 'Thurgood Marshall', d: ['Charles Hamilton Houston', 'Constance Baker Motley', 'Robert L. Carter'] },
{ c: 'History & War', t: 3, q: 'Which admiral said of the marines on Iwo Jima that uncommon valor was a common virtue?', a: 'Chester Nimitz', d: ['William Halsey', 'Raymond Spruance', 'Ernest King'] },
{ c: 'Science, Letters & Ideas', t: 3, q: 'Which astronomer called the Earth, photographed from beyond the outer planets, a pale blue dot?', a: 'Carl Sagan', d: ['Neil deGrasse Tyson', 'Frank Drake', 'Fred Hoyle'] },
{ c: 'Books & Authors', t: 3, q: 'Which playwright wrote both \'The Cherry Orchard\' and \'The Seagull\'?', a: 'Anton Chekhov', d: ['Maxim Gorky', 'Ivan Turgenev', 'Leonid Andreyev'] },
{ c: 'Screen Lines', t: 3, q: 'Which character grabs Sarah Connor in a nightclub and tells her \'Come with me if you want to live\' in the 1984 film The Terminator?', a: 'Kyle Reese', d: ['The T-800', 'Lieutenant Traxler', 'Dr. Silberman'] },

{ c: 'Presidents & Politics', t: 4, q: 'Which former American delegate to the United Nations asked in 1958 where universal human rights begin, and answered in small places, close to home?', a: 'Eleanor Roosevelt', d: ['Frances Perkins', 'Jane Addams', 'Margaret Chase Smith'] },
{ c: 'History & War', t: 4, q: 'Which French revolutionary told the Convention in 1794 that terror is nothing other than justice, prompt, severe and inflexible?', a: 'Maximilien Robespierre', d: ['Jean-Paul Marat', 'Louis Antoine de Saint-Just', 'Camille Desmoulins'] },
{ c: 'Science, Letters & Ideas', t: 4, q: 'Which philosopher wrote that the European tradition consists of a series of footnotes to Plato?', a: 'Alfred North Whitehead', d: ['Bertrand Russell', 'G. E. Moore', 'Gottlob Frege'] },
{ c: 'Books & Authors', t: 4, q: 'Which poet advised telling all the truth but telling it slant?', a: 'Emily Dickinson', d: ['Christina Rossetti', 'Elizabeth Barrett Browning', 'Sara Teasdale'] },
{ c: 'Screen Lines', t: 4, q: 'Which character in The Graduate offers Benjamin exactly one word of career advice, \'plastics\'?', a: 'Mr. McGuire', d: ['Mr. Braddock', 'Mr. Robinson', 'Mrs. Robinson'] },

{ c: 'Presidents & Politics', t: 5, q: 'Which UN secretary-general said the organization was not created to take mankind to heaven but to save humanity from hell?', a: 'Dag Hammarskjold', d: ['Trygve Lie', 'U Thant', 'Kurt Waldheim'] },
{ c: 'History & War', t: 5, q: 'Which king told the crowd at his execution that he was going from a corruptible to an incorruptible crown?', a: 'Charles I', d: ['Louis XVI', 'James II', 'Richard III'] },
{ c: 'Science, Letters & Ideas', t: 5, q: 'Which astronomer argued in a 1925 doctoral thesis that stars are made overwhelmingly of hydrogen?', a: 'Cecilia Payne-Gaposchkin', d: ['Annie Jump Cannon', 'Henrietta Swan Leavitt', 'Williamina Fleming'] },
{ c: 'Books & Authors', t: 5, q: 'Which Russian poet built a requiem cycle around the women waiting in the prison lines of Leningrad?', a: 'Anna Akhmatova', d: ['Marina Tsvetaeva', 'Osip Mandelstam', 'Boris Pasternak'] },
{ c: 'Screen Lines', t: 5, q: 'Which character in Double Indemnity dictates a confession admitting he did it for money and for a woman, and got neither?', a: 'Walter Neff', d: ['Barton Keyes', 'Phyllis Dietrichson', 'Lola Dietrichson'] },
],

// ── Day 34 ──────────────────────────────────────────────────────────────
[
{ c: 'Presidents & Politics', t: 1, q: 'Which president told a crowd in West Berlin in 1963 that he too was a Berliner?', a: 'John F. Kennedy', d: ['Dwight D. Eisenhower', 'Lyndon B. Johnson', 'Richard Nixon'] },
{ c: 'History & War', t: 1, q: 'Which general took the crown from the pope and set it on his own head in Notre-Dame in 1804?', a: 'Napoleon Bonaparte', d: ['Louis XVIII', 'Napoleon III', 'Charles X'] },
{ c: 'Science, Letters & Ideas', t: 1, q: 'Which Viennese doctor founded psychoanalysis?', a: 'Sigmund Freud', d: ['Carl Jung', 'Alfred Adler', 'Josef Breuer'] },
{ c: 'Books & Authors', t: 1, q: 'Which author wrote a poem in which a bird answers every question with \'Nevermore\'?', a: 'Edgar Allan Poe', d: ['Washington Irving', 'Nathaniel Hawthorne', 'Herman Melville'] },
{ c: 'Screen Lines', t: 1, q: 'Which character hacks through a bathroom door and announces \'Here\'s Johnny!\' in The Shining?', a: 'Jack Torrance', d: ['Wendy Torrance', 'Danny Torrance', 'Dick Hallorann'] },

{ c: 'Presidents & Politics', t: 2, q: 'Which delegate, asked what the 1787 convention had produced, answered a republic, if you can keep it?', a: 'Benjamin Franklin', d: ['James Madison', 'George Washington', 'James Wilson'] },
{ c: 'History & War', t: 2, q: 'Which ancient Chinese strategist wrote that if you know the enemy and know yourself you need not fear a hundred battles?', a: 'Sun Tzu', d: ['Confucius', 'Sun Bin', 'Zhuge Liang'] },
{ c: 'Science, Letters & Ideas', t: 2, q: 'Which monk worked out the laws of inheritance by breeding pea plants in a monastery garden?', a: 'Gregor Mendel', d: ['Hugo de Vries', 'Thomas Hunt Morgan', 'William Bateson'] },
{ c: 'Books & Authors', t: 2, q: 'Which character shouts \'Fly, you fools!\' as he falls into the abyss of Moria?', a: 'Gandalf', d: ['Aragorn', 'Boromir', 'Elrond'] },
{ c: 'Screen Lines', t: 2, q: 'Which character waves off a stormtrooper checkpoint with \'These aren\'t the droids you\'re looking for\'?', a: 'Obi-Wan Kenobi', d: ['Luke Skywalker', 'Han Solo', 'C-3PO'] },

{ c: 'Presidents & Politics', t: 3, q: 'Which Chinese leader defended pragmatic reform by saying it does not matter whether a cat is black or white so long as it catches mice?', a: 'Deng Xiaoping', d: ['Zhou Enlai', 'Hu Yaobang', 'Jiang Zemin'] },
{ c: 'History & War', t: 3, q: 'Which assassin is reported to have shouted \'Sic semper tyrannis\' after firing the shot at Ford\'s Theater?', a: 'John Wilkes Booth', d: ['Lewis Powell', 'David Herold', 'George Atzerodt'] },
{ c: 'Science, Letters & Ideas', t: 3, q: 'Which astronomer found that a planet sweeps out equal areas in equal times?', a: 'Johannes Kepler', d: ['Tycho Brahe', 'Nicolaus Copernicus', 'Galileo Galilei'] },
{ c: 'Books & Authors', t: 3, q: 'Which character in Jane Eyre compares himself to an old lightning-struck chestnut tree in the orchard?', a: 'Edward Rochester', d: ['St. John Rivers', 'Mr. Brocklehurst', 'John Reed'] },
{ c: 'Screen Lines', t: 3, q: 'Which character purrs \'I\'m not bad, I\'m just drawn that way\' in Who Framed Roger Rabbit?', a: 'Jessica Rabbit', d: ['Roger Rabbit', 'Dolores', 'Baby Herman'] },

{ c: 'Presidents & Politics', t: 4, q: 'Which African leader urged his followers to seek first the political kingdom, and all else would be added to them?', a: 'Kwame Nkrumah', d: ['Jomo Kenyatta', 'Julius Nyerere', 'Sekou Toure'] },
{ c: 'History & War', t: 4, q: 'Which Shawnee leader asked an American governor why one would not sell the air and the sea as well as the earth?', a: 'Tecumseh', d: ['Pontiac', 'Black Hawk', 'Little Turtle'] },
{ c: 'Science, Letters & Ideas', t: 4, q: 'Which mathematician wrote that all the misfortune of men comes from not knowing how to sit quietly in a room?', a: 'Blaise Pascal', d: ['Rene Descartes', 'Michel de Montaigne', 'Pierre de Fermat'] },
{ c: 'Books & Authors', t: 4, q: 'Which poet wrote of an Easter rising that all changed, changed utterly, and a terrible beauty was born?', a: 'W. B. Yeats', d: ['Seamus Heaney', 'Patrick Kavanagh', 'Louis MacNeice'] },
{ c: 'Screen Lines', t: 4, q: 'Which character in Chinatown confesses under repeated slaps that the young woman is her sister and her daughter?', a: 'Evelyn Mulwray', d: ['Jake Gittes', 'Ida Sessions', 'Noah Cross'] },

{ c: 'Presidents & Politics', t: 5, q: 'Which Canadian prime minister predicted in 1904 that the twentieth century would belong to his country?', a: 'Wilfrid Laurier', d: ['John A. Macdonald', 'Robert Borden', 'Mackenzie King'] },
{ c: 'History & War', t: 5, q: 'Which Gallic chieftain, weighing out Rome\'s ransom, is said to have thrown his sword onto the scale with the words woe to the vanquished?', a: 'Brennus', d: ['Vercingetorix', 'Ambiorix', 'Boudica'] },
{ c: 'Science, Letters & Ideas', t: 5, q: 'Which geologist drew the maps that revealed the rift valley running down the middle of the Atlantic floor?', a: 'Marie Tharp', d: ['Harry Hess', 'Inge Lehmann', 'Florence Bascom'] },
{ c: 'Books & Authors', t: 5, q: 'Which poet opened a villanelle by claiming that the art of losing isn\'t hard to master?', a: 'Elizabeth Bishop', d: ['Adrienne Rich', 'Anne Sexton', 'May Swenson'] },
{ c: 'Screen Lines', t: 5, q: 'Which character in Blade Runner says of Rachael \'It\'s too bad she won\'t live, but then again, who does?\'', a: 'Gaff', d: ['Rick Deckard', 'Eldon Tyrell', 'Captain Bryant'] },
],

// ── Day 35 ──────────────────────────────────────────────────────────────
[
{ c: 'Presidents & Politics', t: 1, q: 'Which president said in his 1981 inaugural that government is not the solution to our problem, government is the problem?', a: 'Ronald Reagan', d: ['Richard Nixon', 'Gerald Ford', 'George H. W. Bush'] },
{ c: 'History & War', t: 1, q: 'Which teenage diarist in hiding in Amsterdam wrote that in spite of everything she still believed people were really good at heart?', a: 'Anne Frank', d: ['Etty Hillesum', 'Miep Gies', 'Hannah Senesh'] },
{ c: 'Science, Letters & Ideas', t: 1, q: 'Which artist painted the ceiling of the Sistine Chapel?', a: 'Michelangelo', d: ['Raphael', 'Sandro Botticelli', 'Titian'] },
{ c: 'Books & Authors', t: 1, q: 'Which character tells a boy on his eleventh birthday \'Yer a wizard, Harry\'?', a: 'Rubeus Hagrid', d: ['Albus Dumbledore', 'Minerva McGonagall', 'Severus Snape'] },
{ c: 'Screen Lines', t: 1, q: 'Which character celebrates with the cry \'Yabba dabba doo!\' in the Hanna-Barbera Stone Age cartoon?', a: 'Fred Flintstone', d: ['Barney Rubble', 'Wilma Flintstone', 'Mr. Slate'] },

{ c: 'Presidents & Politics', t: 2, q: 'Which member of Congress was the first woman named to a major American party national ticket, as the 1984 nominee for vice president?', a: 'Geraldine Ferraro', d: ['Bella Abzug', 'Barbara Mikulski', 'Patricia Schroeder'] },
{ c: 'History & War', t: 2, q: 'Which general led the Nationalist side in the Spanish Civil War and then ruled the country until his death in 1975?', a: 'Francisco Franco', d: ['Emilio Mola', 'Jose Sanjurjo', 'Miguel Primo de Rivera'] },
{ c: 'Science, Letters & Ideas', t: 2, q: 'Which mathematician wrote the notes on Babbage\'s Analytical Engine that contain the first published algorithm for a machine?', a: 'Ada Lovelace', d: ['Mary Somerville', 'Sophie Germain', 'Grace Hopper'] },
{ c: 'Books & Authors', t: 2, q: 'Which character spins the words SOME PIG into a web to save a pig named Wilbur?', a: 'Charlotte', d: ['Templeton', 'Fern Arable', 'Homer Zuckerman'] },
{ c: 'Screen Lines', t: 2, q: 'Which character in Casablanca coaxes the piano player with \'Play it once, Sam. For old times\' sake\'?', a: 'Ilsa Lund', d: ['Rick Blaine', 'Victor Laszlo', 'Yvonne'] },

{ c: 'Presidents & Politics', t: 3, q: 'Which Vietnamese leader declared in 1966 that nothing is more precious than independence and freedom?', a: 'Ho Chi Minh', d: ['Vo Nguyen Giap', 'Pham Van Dong', 'Le Duan'] },
{ c: 'History & War', t: 3, q: 'Which conqueror is said to have remarked that if he were not himself, he would wish to be Diogenes?', a: 'Alexander the Great', d: ['Julius Caesar', 'Philip II of Macedon', 'Pyrrhus'] },
{ c: 'Science, Letters & Ideas', t: 3, q: 'Which biologist coined the word meme for a unit of cultural transmission?', a: 'Richard Dawkins', d: ['Daniel Dennett', 'E. O. Wilson', 'Stephen Jay Gould'] },
{ c: 'Books & Authors', t: 3, q: 'Which character opens The Great Gatsby by recalling his father advising him to reserve all judgments?', a: 'Nick Carraway', d: ['Jay Gatsby', 'Tom Buchanan', 'Meyer Wolfsheim'] },
{ c: 'Screen Lines', t: 3, q: 'Which character in The Godfather Part II tells his brother \'I know it was you. You broke my heart\'?', a: 'Michael Corleone', d: ['Fredo Corleone', 'Tom Hagen', 'Hyman Roth'] },

{ c: 'Presidents & Politics', t: 4, q: 'Which Louisiana senator built a national following on the promise that every man a king?', a: 'Huey Long', d: ['Allen Ellender', 'Eugene Talmadge', 'Theodore Bilbo'] },
{ c: 'History & War', t: 4, q: 'Which Persian king had a clay cylinder inscribed proclaiming that he had returned the gods to their sanctuaries and sent captive peoples home?', a: 'Cyrus the Great', d: ['Darius I', 'Xerxes I', 'Cambyses II'] },
{ c: 'Science, Letters & Ideas', t: 4, q: 'Which thinker reported on the Eichmann trial and gave us the phrase the banality of evil?', a: 'Hannah Arendt', d: ['Simone Weil', 'Susan Sontag', 'Mary McCarthy'] },
{ c: 'Books & Authors', t: 4, q: 'Which American novelist gave a book the title \'You Can\'t Go Home Again\'?', a: 'Thomas Wolfe', d: ['Sherwood Anderson', 'Sinclair Lewis', 'John Dos Passos'] },
{ c: 'Screen Lines', t: 4, q: 'Which character in Poltergeist announces \'This house is clean\'?', a: 'Tangina Barrons', d: ['Diane Freeling', 'Steve Freeling', 'Dr. Lesh'] },

{ c: 'Presidents & Politics', t: 5, q: 'Which long-serving Speaker of the House advised new members that if you want to get along, go along?', a: 'Sam Rayburn', d: ['Joe Cannon', 'John McCormack', 'Nicholas Longworth'] },
{ c: 'History & War', t: 5, q: 'Which Indian emperor had his remorse for the slaughter of the Kalinga war carved into rock edicts across his realm?', a: 'Ashoka', d: ['Chandragupta Maurya', 'Samudragupta', 'Harsha'] },
{ c: 'Science, Letters & Ideas', t: 5, q: 'Which computer scientist warned that testing can show the presence of bugs but never their absence?', a: 'Edsger Dijkstra', d: ['Donald Knuth', 'Tony Hoare', 'Niklaus Wirth'] },
{ c: 'Books & Authors', t: 5, q: 'Which German-language poet told a young correspondent to go into himself and ask whether he must write?', a: 'Rainer Maria Rilke', d: ['Georg Trakl', 'Hugo von Hofmannsthal', 'Stefan George'] },
{ c: 'Screen Lines', t: 5, q: 'Which character in Alien admires the creature as a survivor unclouded by conscience, remorse, or delusions of morality?', a: 'Ash', d: ['Ellen Ripley', 'Dallas', 'Lambert'] },
],

// ── Day 36 ──────────────────────────────────────────────────────────────
[
{ c: 'Presidents & Politics', t: 1, q: 'Which president made a week-long visit to China in 1972, meeting Mao Zedong in Beijing?', a: 'Richard Nixon', d: ['Lyndon B. Johnson', 'Gerald Ford', 'Jimmy Carter'] },
{ c: 'History & War', t: 1, q: 'Which American activist told a 1964 audience that they should secure their rights by any means necessary?', a: 'Malcolm X', d: ['Stokely Carmichael', 'Huey Newton', 'Bayard Rustin'] },
{ c: 'Science, Letters & Ideas', t: 1, q: 'Which American flew a kite in a thunderstorm to show that lightning is electrical?', a: 'Benjamin Franklin', d: ['Joseph Priestley', 'Michael Faraday', 'Luigi Galvani'] },
{ c: 'Books & Authors', t: 1, q: 'Which character sets off down the yellow brick road hoping the Wizard will give him a brain?', a: 'The Scarecrow', d: ['The Tin Woodman', 'The Cowardly Lion', 'The Wizard'] },
{ c: 'Screen Lines', t: 1, q: 'Which character in 2001: A Space Odyssey answers a request to open the pod bay doors with \'I\'m afraid I can\'t do that\'?', a: 'HAL 9000', d: ['Dave Bowman', 'Frank Poole', 'Heywood Floyd'] },

{ c: 'Presidents & Politics', t: 2, q: 'Who took office in 1988 as the first woman to head the government of a modern Muslim-majority country?', a: 'Benazir Bhutto', d: ['Khaleda Zia', 'Sheikh Hasina', 'Tansu Ciller'] },
{ c: 'History & War', t: 2, q: 'Which pharaoh fought the Hittites to a draw at Kadesh and covered Egypt with colossal statues of himself?', a: 'Ramesses II', d: ['Thutmose III', 'Akhenaten', 'Seti I'] },
{ c: 'Science, Letters & Ideas', t: 2, q: 'Which Scottish engineer improved the steam engine and is remembered in the unit of power?', a: 'James Watt', d: ['Thomas Newcomen', 'Richard Trevithick', 'George Stephenson'] },
{ c: 'Books & Authors', t: 2, q: 'Which author wrote the tale of a boy who tricks his friends into paying for the privilege of whitewashing a fence?', a: 'Mark Twain', d: ['Washington Irving', 'Bret Harte', 'O. Henry'] },
{ c: 'Screen Lines', t: 2, q: 'Which character snarls \'Take your stinking paws off me, you damned dirty ape!\' in Planet of the Apes?', a: 'George Taylor', d: ['Dr. Zaius', 'Cornelius', 'Zira'] },

{ c: 'Presidents & Politics', t: 3, q: 'Which secretary of labor was the first woman to hold a seat in a United States cabinet?', a: 'Frances Perkins', d: ['Eleanor Roosevelt', 'Jane Addams', 'Oveta Culp Hobby'] },
{ c: 'History & War', t: 3, q: 'Which victor of Waterloo called the battle a damned nice thing, the nearest run thing he ever saw in his life?', a: 'The Duke of Wellington', d: ['Gebhard von Blucher', 'Lord Uxbridge', 'Thomas Picton'] },
{ c: 'Science, Letters & Ideas', t: 3, q: 'Which architect wrote in an 1896 essay that form ever follows function?', a: 'Louis Sullivan', d: ['Frank Lloyd Wright', 'Daniel Burnham', 'Henry Hobson Richardson'] },
{ c: 'Books & Authors', t: 3, q: 'Which character narrates most of Wuthering Heights as the housekeeper telling the story to a tenant?', a: 'Nelly Dean', d: ['Isabella Linton', 'Zillah', 'Frances Earnshaw'] },
{ c: 'Screen Lines', t: 3, q: 'Which character in Animal House tells a failing student that fat, drunk, and stupid is no way to go through life?', a: 'Dean Wormer', d: ['Bluto Blutarsky', 'Otter', 'Greg Marmalard'] },

{ c: 'Presidents & Politics', t: 4, q: 'Which Lord Protector wrote to the Church of Scotland in 1650 begging them, in the bowels of Christ, to think it possible they might be mistaken?', a: 'Oliver Cromwell', d: ['Thomas Fairfax', 'John Pym', 'Henry Ireton'] },
{ c: 'History & War', t: 4, q: 'Which Haitian leader warned his captors that they had cut down only the trunk of the tree of liberty, whose roots were deep and many?', a: 'Toussaint Louverture', d: ['Jean-Jacques Dessalines', 'Henri Christophe', 'Alexandre Petion'] },
{ c: 'Science, Letters & Ideas', t: 4, q: 'Which philosopher wrote that reason is, and ought only to be, the slave of the passions?', a: 'David Hume', d: ['Adam Smith', 'Thomas Reid', 'John Locke'] },
{ c: 'Books & Authors', t: 4, q: 'Which character in Death of a Salesman insists that attention must be paid to her husband?', a: 'Linda Loman', d: ['Willy Loman', 'Biff Loman', 'Charley'] },
{ c: 'Screen Lines', t: 4, q: 'Which character in Top Gun tells Maverick he can be his wingman any time?', a: 'Iceman', d: ['Goose', 'Viper', 'Slider'] },

{ c: 'Presidents & Politics', t: 5, q: 'Which chief justice told James I that the king was under God and the law, and later led the drafting of the Petition of Right?', a: 'Edward Coke', d: ['Francis Bacon', 'John Selden', 'Thomas Wentworth'] },
{ c: 'History & War', t: 5, q: 'Which US Navy chaplain at Pearl Harbor gave the war the line \'Praise the Lord and pass the ammunition\'?', a: 'Howell Forgy', d: ['William Maguire', 'Joseph O\'Callahan', 'Francis Duffy'] },
{ c: 'Science, Letters & Ideas', t: 5, q: 'Which statistician built the design of experiments around a colleague\'s claim that she could taste whether milk went into her cup before the tea?', a: 'Ronald Fisher', d: ['Karl Pearson', 'Jerzy Neyman', 'William Sealy Gosset'] },
{ c: 'Books & Authors', t: 5, q: 'Which Japanese novelist wrote a satire narrated by a cat living in a schoolteacher\'s house?', a: 'Natsume Soseki', d: ['Yukio Mishima', 'Junichiro Tanizaki', 'Yasunari Kawabata'] },
{ c: 'Screen Lines', t: 5, q: 'Which character quotes Moby-Dick with \'From hell\'s heart, I stab at thee\' as his ship dies in Star Trek II?', a: 'Khan Noonien Singh', d: ['Captain Kirk', 'Mr. Spock', 'Dr. McCoy'] },
],

// ── Day 37 ──────────────────────────────────────────────────────────────
[
{ c: 'Presidents & Politics', t: 1, q: 'Which supreme commander of the Normandy landings was elected president eight years later?', a: 'Dwight D. Eisenhower', d: ['Douglas MacArthur', 'George Marshall', 'Omar Bradley'] },
{ c: 'History & War', t: 1, q: 'Which president told a Houston crowd in 1962 that his country chose to go to the Moon in that decade because it was hard?', a: 'John F. Kennedy', d: ['Lyndon B. Johnson', 'Dwight D. Eisenhower', 'Richard Nixon'] },
{ c: 'Science, Letters & Ideas', t: 1, q: 'Which Greek philosopher was condemned by an Athenian jury and died by drinking hemlock?', a: 'Socrates', d: ['Plato', 'Anaxagoras', 'Diogenes'] },
{ c: 'Books & Authors', t: 1, q: 'Which author sent five children into a chocolate factory after they found golden tickets?', a: 'Roald Dahl', d: ['Enid Blyton', 'Michael Bond', 'E. B. White'] },
{ c: 'Screen Lines', t: 1, q: 'Which character teaches a teenager karate through the chore \'wax on, wax off\'?', a: 'Mr. Miyagi', d: ['Daniel LaRusso', 'John Kreese', 'Johnny Lawrence'] },

{ c: 'Presidents & Politics', t: 2, q: 'Which former teacher from Milwaukee became the first woman to serve as prime minister of Israel?', a: 'Golda Meir', d: ['Indira Gandhi', 'Sirimavo Bandaranaike', 'Margaret Thatcher'] },
{ c: 'History & War', t: 2, q: 'Which minister told a Memphis church the night before he was killed that he had been to the mountaintop and seen the promised land?', a: 'Martin Luther King Jr.', d: ['Ralph Abernathy', 'Jesse Jackson', 'Andrew Young'] },
{ c: 'Science, Letters & Ideas', t: 2, q: 'Which philosopher wrote Thus Spoke Zarathustra?', a: 'Friedrich Nietzsche', d: ['Arthur Schopenhauer', 'Soren Kierkegaard', 'Martin Heidegger'] },
{ c: 'Books & Authors', t: 2, q: 'Which character in Little Women sells her hair for twenty-five dollars and means to be a writer?', a: 'Jo March', d: ['Meg March', 'Amy March', 'Beth March'] },
{ c: 'Screen Lines', t: 2, q: 'Which character in Monty Python and the Holy Grail loses both arms and calls it \'just a flesh wound\'?', a: 'The Black Knight', d: ['King Arthur', 'Sir Bedevere', 'Sir Galahad'] },

{ c: 'Presidents & Politics', t: 3, q: 'Which president told Congress in 1947 that it must be the policy of the United States to support free peoples resisting subjugation?', a: 'Harry S. Truman', d: ['Franklin D. Roosevelt', 'George Marshall', 'Dean Acheson'] },
{ c: 'History & War', t: 3, q: 'Which emperor told his people by radio in 1945 that they must endure the unendurable and suffer what was insufferable?', a: 'Hirohito', d: ['Hideki Tojo', 'Kantaro Suzuki', 'Prince Konoe'] },
{ c: 'Science, Letters & Ideas', t: 3, q: 'Which Greek argued that a runner could never overtake a tortoise that had been given a head start?', a: 'Zeno of Elea', d: ['Parmenides', 'Democritus', 'Empedocles'] },
{ c: 'Books & Authors', t: 3, q: 'Which character tells Elizabeth Bennet that she must allow him to say how ardently he admires and loves her?', a: 'Fitzwilliam Darcy', d: ['Charles Bingley', 'Mr. Collins', 'George Wickham'] },
{ c: 'Screen Lines', t: 3, q: 'Which character in Lethal Weapon keeps groaning that he is getting too old for this?', a: 'Roger Murtaugh', d: ['Martin Riggs', 'Mr. Joshua', 'Captain Ed Murphy'] },

{ c: 'Presidents & Politics', t: 4, q: 'Which diplomat argued anonymously in 1947 for a long-term, patient but firm and vigilant containment of Russian expansive tendencies?', a: 'George Kennan', d: ['Dean Acheson', 'Charles Bohlen', 'John Foster Dulles'] },
{ c: 'History & War', t: 4, q: 'Which Indian leader gave his 1942 movement the two-word mantra \'Do or Die\'?', a: 'Mahatma Gandhi', d: ['Jawaharlal Nehru', 'Subhas Chandra Bose', 'Vallabhbhai Patel'] },
{ c: 'Science, Letters & Ideas', t: 4, q: 'Which mathematician proved that every continuous symmetry of a physical system corresponds to a conservation law?', a: 'Emmy Noether', d: ['Sofia Kovalevskaya', 'Hermann Weyl', 'Emil Artin'] },
{ c: 'Books & Authors', t: 4, q: 'Which poet opened a sonnet with glory be to God for dappled things?', a: 'Gerard Manley Hopkins', d: ['Christina Rossetti', 'Coventry Patmore', 'Francis Thompson'] },
{ c: 'Screen Lines', t: 4, q: 'Which character in Ghostbusters warns the team \'Don\'t cross the streams\'?', a: 'Egon Spengler', d: ['Ray Stantz', 'Peter Venkman', 'Winston Zeddemore'] },

{ c: 'Presidents & Politics', t: 5, q: 'Which German foreign secretary told the Reichstag in 1897 that his country demanded its own place in the sun?', a: 'Bernhard von Bulow', d: ['Alfred von Tirpitz', 'Theobald von Bethmann-Hollweg', 'Friedrich von Holstein'] },
{ c: 'History & War', t: 5, q: 'Which Mughal emperor is quoted in his last letters as saying that he had come alone and was going away as a stranger?', a: 'Aurangzeb', d: ['Shah Jahan', 'Jahangir', 'Akbar'] },
{ c: 'Science, Letters & Ideas', t: 5, q: 'Which Belgian priest and physicist proposed that the universe expanded from a single primeval atom?', a: 'Georges Lemaitre', d: ['George Gamow', 'Fred Hoyle', 'Arthur Eddington'] },
{ c: 'Books & Authors', t: 5, q: 'Which Austrian novelist left unfinished at his death a book called \'The Man Without Qualities\'?', a: 'Robert Musil', d: ['Hermann Broch', 'Joseph Roth', 'Elias Canetti'] },
{ c: 'Screen Lines', t: 5, q: 'Which character surveys the wreckage at the end of The Bridge on the River Kwai and mutters \'Madness! Madness!\'?', a: 'Major Clipton', d: ['Colonel Nicholson', 'Colonel Saito', 'Commander Shears'] },
],

// ── Day 38 ──────────────────────────────────────────────────────────────
[
{ c: 'Presidents & Politics', t: 1, q: 'Which president set the two-term tradition by declining to stand again in 1796?', a: 'George Washington', d: ['John Adams', 'Thomas Jefferson', 'James Madison'] },
{ c: 'History & War', t: 1, q: 'Which New Zealander stood on the summit of Everest with Tenzing Norgay in 1953 and later said they had knocked the so-and-so off?', a: 'Edmund Hillary', d: ['George Lowe', 'John Hunt', 'Eric Shipton'] },
{ c: 'Science, Letters & Ideas', t: 1, q: 'Which scientist discovered polonium and named it after her native country?', a: 'Marie Curie', d: ['Lise Meitner', 'Dorothy Hodgkin', 'Rosalind Franklin'] },
{ c: 'Books & Authors', t: 1, q: 'Which character in J. M. Barrie\'s story calls death an awfully big adventure?', a: 'Peter Pan', d: ['Captain Hook', 'Wendy Darling', 'Tinker Bell'] },
{ c: 'Screen Lines', t: 1, q: 'Which character in the 1964 Disney musical sings that a spoonful of sugar helps the medicine go down?', a: 'Mary Poppins', d: ['Bert', 'Jane Banks', 'George Banks'] },

{ c: 'Presidents & Politics', t: 2, q: 'Who became the first Black woman to serve as secretary of state of the United States, in 2005?', a: 'Condoleezza Rice', d: ['Madeleine Albright', 'Susan Rice', 'Colin Powell'] },
{ c: 'History & War', t: 2, q: 'Which Bolshevik leader made \'All power to the Soviets\' the slogan of his party in 1917?', a: 'Vladimir Lenin', d: ['Leon Trotsky', 'Alexander Kerensky', 'Grigory Zinoviev'] },
{ c: 'Science, Letters & Ideas', t: 2, q: 'Which English doctor showed that inoculation with cowpox protects against smallpox?', a: 'Edward Jenner', d: ['John Hunter', 'Thomas Sydenham', 'Robert Koch'] },
{ c: 'Books & Authors', t: 2, q: 'Which author wrote the novel in which Jean Valjean is hunted for years by Inspector Javert?', a: 'Victor Hugo', d: ['Alexandre Dumas', 'Honore de Balzac', 'Emile Zola'] },
{ c: 'Screen Lines', t: 2, q: 'Which character on The A-Team lights a cigar and says \'I love it when a plan comes together\'?', a: 'Hannibal Smith', d: ['B.A. Baracus', 'Templeton Peck', 'H.M. Murdock'] },

{ c: 'Presidents & Politics', t: 3, q: 'Which candidate told a 1920 audience that America needed not nostrums but normalcy?', a: 'Warren G. Harding', d: ['Calvin Coolidge', 'Charles Evans Hughes', 'James M. Cox'] },
{ c: 'History & War', t: 3, q: 'Which American general told his troops that no man ever won a war by dying for his country, but by making the other fellow die for his?', a: 'George Patton', d: ['Omar Bradley', 'Mark Clark', 'Courtney Hodges'] },
{ c: 'Science, Letters & Ideas', t: 3, q: 'Whose X-ray diffraction image, known as Photograph 51, showed that DNA is a helix?', a: 'Rosalind Franklin', d: ['Maurice Wilkins', 'Dorothy Hodgkin', 'Barbara McClintock'] },
{ c: 'Books & Authors', t: 3, q: 'Which character tells Victor Frankenstein \'I ought to be thy Adam, but I am rather the fallen angel\'?', a: 'The Creature', d: ['Henry Clerval', 'Robert Walton', 'Alphonse Frankenstein'] },
{ c: 'Screen Lines', t: 3, q: 'Which character rattles off that it is 106 miles to Chicago, they have a full tank of gas, half a pack of cigarettes, it is dark, and they are wearing sunglasses?', a: 'Elwood Blues', d: ['Jake Blues', 'Curtis', 'Sister Mary Stigmata'] },

{ c: 'Presidents & Politics', t: 4, q: 'Which candidate praised the American system of rugged individualism in a 1928 campaign speech?', a: 'Herbert Hoover', d: ['Calvin Coolidge', 'Andrew Mellon', 'William Borah'] },
{ c: 'History & War', t: 4, q: 'Which revolutionary told his opponents in 1917 to go where they belonged, into the dustbin of history?', a: 'Leon Trotsky', d: ['Vladimir Lenin', 'Julius Martov', 'Nikolai Bukharin'] },
{ c: 'Science, Letters & Ideas', t: 4, q: 'Which economist argued that two countries both gain from trade even when one makes everything more cheaply?', a: 'David Ricardo', d: ['Adam Smith', 'Thomas Malthus', 'John Stuart Mill'] },
{ c: 'Books & Authors', t: 4, q: 'Which poet wrote that her candle burns at both ends and will not last the night?', a: 'Edna St. Vincent Millay', d: ['Sara Teasdale', 'Dorothy Parker', 'Louise Bogan'] },
{ c: 'Screen Lines', t: 4, q: 'Which character in Caddyshack narrates his own imaginary Masters victory as a Cinderella story while beheading flowers?', a: 'Carl Spackler', d: ['Ty Webb', 'Al Czervik', 'Judge Smails'] },

{ c: 'Presidents & Politics', t: 5, q: 'Which New York governor answered his critics on the stump with the catchphrase let us look at the record?', a: 'Alfred E. Smith', d: ['John W. Davis', 'James M. Cox', 'William Gibbs McAdoo'] },
{ c: 'History & War', t: 5, q: 'Which emperor, taxing the public urinals, is said to have held a coin under his son\'s nose and asked whether it smelled?', a: 'Vespasian', d: ['Titus', 'Domitian', 'Galba'] },
{ c: 'Science, Letters & Ideas', t: 5, q: 'Which physicist ran the 1956 cobalt-60 experiment that showed parity is not conserved in weak interactions?', a: 'Chien-Shiung Wu', d: ['Tsung-Dao Lee', 'Maria Goeppert Mayer', 'Lise Meitner'] },
{ c: 'Books & Authors', t: 5, q: 'Which Italian novelist wrote a comic confession dictated to a psychoanalyst by a man who cannot give up his last cigarette?', a: 'Italo Svevo', d: ['Luigi Pirandello', 'Cesare Pavese', 'Alberto Moravia'] },
{ c: 'Screen Lines', t: 5, q: 'Which character in Monty Python\'s Life of Brian tells the crowd \'He\'s not the Messiah, he\'s a very naughty boy!\'?', a: 'Mandy Cohen', d: ['Brian Cohen', 'Reg', 'Judith Iscariot'] },
],

// ── Day 39 ──────────────────────────────────────────────────────────────
[
{ c: 'Presidents & Politics', t: 1, q: 'Which president doubled the size of the country by buying Louisiana from France in 1803?', a: 'Thomas Jefferson', d: ['James Madison', 'James Monroe', 'John Adams'] },
{ c: 'History & War', t: 1, q: 'Which Carthaginian general marched an army with war elephants over the Alps and into Italy?', a: 'Hannibal', d: ['Hamilcar Barca', 'Hasdrubal the Fair', 'Mago Barca'] },
{ c: 'Science, Letters & Ideas', t: 1, q: 'Which English computer scientist invented the World Wide Web while working at CERN?', a: 'Tim Berners-Lee', d: ['Vint Cerf', 'Marc Andreessen', 'Douglas Engelbart'] },
{ c: 'Books & Authors', t: 1, q: 'Which character in Treasure Island keeps a parrot that screams \'Pieces of eight\'?', a: 'Long John Silver', d: ['Billy Bones', 'Ben Gunn', 'Jim Hawkins'] },
{ c: 'Screen Lines', t: 1, q: 'Which character groans \'Snakes. Why\'d it have to be snakes?\' in Raiders of the Lost Ark?', a: 'Indiana Jones', d: ['Marion Ravenwood', 'Marcus Brody', 'Major Toht'] },

{ c: 'Presidents & Politics', t: 2, q: 'Which Venezuelan general led the liberation of much of South America and dreamed of a united Gran Colombia?', a: 'Simon Bolivar', d: ['Jose de San Martin', 'Bernardo O\'Higgins', 'Antonio Jose de Sucre'] },
{ c: 'History & War', t: 2, q: 'Which Canadian army doctor wrote the poem beginning \'In Flanders fields the poppies blow\'?', a: 'John McCrae', d: ['Rupert Brooke', 'Siegfried Sassoon', 'Robert Service'] },
{ c: 'Science, Letters & Ideas', t: 2, q: 'Which American went to live alone in a cabin beside a Massachusetts pond and made a book of it?', a: 'Henry David Thoreau', d: ['Ralph Waldo Emerson', 'John Muir', 'Walt Whitman'] },
{ c: 'Books & Authors', t: 2, q: 'Which Italian poet put the warning to abandon all hope above the gate of Hell?', a: 'Dante Alighieri', d: ['Petrarch', 'Giovanni Boccaccio', 'Ludovico Ariosto'] },
{ c: 'Screen Lines', t: 2, q: 'Which character on Lost in Space blares the warning \'Danger, Will Robinson!\'?', a: 'The Robot', d: ['Dr. Zachary Smith', 'John Robinson', 'Major Don West'] },

{ c: 'Presidents & Politics', t: 3, q: 'Which revolutionary ended his 1953 courtroom defense by saying that history will absolve him?', a: 'Fidel Castro', d: ['Che Guevara', 'Raul Castro', 'Camilo Cienfuegos'] },
{ c: 'History & War', t: 3, q: 'Which newly released prisoner told a Cape Town crowd in 1990 that he stood before them not as a prophet but as a humble servant of the people?', a: 'Nelson Mandela', d: ['Oliver Tambo', 'Walter Sisulu', 'Desmond Tutu'] },
{ c: 'Science, Letters & Ideas', t: 3, q: 'Which thinker made the formula from each according to his ability, to each according to his needs the motto of the higher phase of communism, in a critique of a party program?', a: 'Karl Marx', d: ['Friedrich Engels', 'Eduard Bernstein', 'Ferdinand Lassalle'] },
{ c: 'Books & Authors', t: 3, q: 'Which character in Hamlet is told to get herself to a nunnery?', a: 'Ophelia', d: ['Gertrude', 'Rosencrantz', 'Osric'] },
{ c: 'Screen Lines', t: 3, q: 'Which character in The Princess Bride means \'I love you\' every time he says \'As you wish\'?', a: 'Westley', d: ['Inigo Montoya', 'Fezzik', 'Prince Humperdinck'] },

{ c: 'Presidents & Politics', t: 4, q: 'Which Mexican president said that among individuals as among nations, respect for the rights of others is peace?', a: 'Benito Juarez', d: ['Porfirio Diaz', 'Venustiano Carranza', 'Antonio Lopez de Santa Anna'] },
{ c: 'History & War', t: 4, q: 'Which French marshal is reported to have said of the Versailles settlement that it was not peace but an armistice for twenty years?', a: 'Ferdinand Foch', d: ['Philippe Petain', 'Joseph Joffre', 'Georges Clemenceau'] },
{ c: 'Science, Letters & Ideas', t: 4, q: 'Which philosopher warned that whoever fights monsters should see that he does not become one, and that the abyss gazes back?', a: 'Friedrich Nietzsche', d: ['Fyodor Dostoevsky', 'Arthur Schopenhauer', 'Georg Hegel'] },
{ c: 'Books & Authors', t: 4, q: 'Which novelist wrote of a ruined consul drinking his way through the Day of the Dead in Mexico?', a: 'Malcolm Lowry', d: ['Graham Greene', 'Lawrence Durrell', 'Anthony Powell'] },
{ c: 'Screen Lines', t: 4, q: 'Which character in Halloween says that what was living behind that boy\'s eyes was purely and simply evil?', a: 'Dr. Sam Loomis', d: ['Laurie Strode', 'Sheriff Leigh Brackett', 'Annie Brackett'] },

{ c: 'Presidents & Politics', t: 5, q: 'Which president said in a final radio broadcast in September 1973 that he would pay with his life for the loyalty of the people?', a: 'Salvador Allende', d: ['Eduardo Frei Montalva', 'Jorge Alessandri', 'Carlos Ibanez del Campo'] },
{ c: 'History & War', t: 5, q: 'Which Hawaiian monarch signed an 1893 protest yielding to the superior force of the United States to avoid bloodshed?', a: 'Liliuokalani', d: ['Kalakaua', 'Kamehameha III', 'Emma Naea'] },
{ c: 'Science, Letters & Ideas', t: 5, q: 'Which American logician founded pragmatism in an essay called How to Make Our Ideas Clear?', a: 'Charles Sanders Peirce', d: ['William James', 'John Dewey', 'Josiah Royce'] },
{ c: 'Books & Authors', t: 5, q: 'Which poet wrote that nobody heard him, the dead man, but still he lay moaning?', a: 'Stevie Smith', d: ['Elizabeth Jennings', 'Ruth Pitter', 'Kathleen Raine'] },
{ c: 'Screen Lines', t: 5, q: 'Which character speaks the last line of The Apartment, \'Shut up and deal\'?', a: 'Fran Kubelik', d: ['C.C. Baxter', 'Jeff Sheldrake', 'Dr. Dreyfuss'] },
],

// ── Day 40 ──────────────────────────────────────────────────────────────
[
{ c: 'Presidents & Politics', t: 1, q: 'Which Indian leader led a 240-mile march to the sea in 1930 to make salt in defiance of British law?', a: 'Mohandas Gandhi', d: ['Jawaharlal Nehru', 'Subhas Chandra Bose', 'Vallabhbhai Patel'] },
{ c: 'History & War', t: 1, q: 'Which Zulu king reorganized his fighters into age regiments and armed them with a short stabbing spear?', a: 'Shaka', d: ['Dingiswayo', 'Mzilikazi', 'Moshoeshoe I'] },
{ c: 'Science, Letters & Ideas', t: 1, q: 'Which Athenian philosopher founded the school known as the Academy?', a: 'Plato', d: ['Aristotle', 'Isocrates', 'Zeno of Citium'] },
{ c: 'Books & Authors', t: 1, q: 'Which character in Wonderland answers nearly every problem with \'Off with her head!\'?', a: 'The Queen of Hearts', d: ['The Duchess', 'The Mad Hatter', 'The White Rabbit'] },
{ c: 'Screen Lines', t: 1, q: 'Which character tells a would-be apprentice \'Do. Or do not. There is no try\' in The Empire Strikes Back?', a: 'Yoda', d: ['Obi-Wan Kenobi', 'Darth Vader', 'Lando Calrissian'] },

{ c: 'Presidents & Politics', t: 2, q: 'Which general led the Turkish war of independence and proclaimed a republic in 1923?', a: 'Mustafa Kemal Ataturk', d: ['Ismet Inonu', 'Enver Pasha', 'Celal Bayar'] },
{ c: 'History & War', t: 2, q: 'Who said of the victory at El Alamein that it was not the end, nor the beginning of the end, but perhaps the end of the beginning?', a: 'Winston Churchill', d: ['Bernard Montgomery', 'Anthony Eden', 'Alan Brooke'] },
{ c: 'Science, Letters & Ideas', t: 2, q: 'Which philosopher wrote the Critique of Pure Reason?', a: 'Immanuel Kant', d: ['Georg Hegel', 'Johann Gottlieb Fichte', 'Arthur Schopenhauer'] },
{ c: 'Books & Authors', t: 2, q: 'Which character in Macbeth tells her husband to screw his courage to the sticking-place?', a: 'Lady Macbeth', d: ['Lady Macduff', 'Hecate', 'The First Witch'] },
{ c: 'Screen Lines', t: 2, q: 'Which character on Happy Days meets nearly every situation with two thumbs up and a drawn-out \'Ayyy\'?', a: 'Arthur Fonzarelli', d: ['Richie Cunningham', 'Potsie Weber', 'Ralph Malph'] },

{ c: 'Presidents & Politics', t: 3, q: 'Which Chinese leader built his program around the Three Principles of the People?', a: 'Sun Yat-sen', d: ['Chiang Kai-shek', 'Yuan Shikai', 'Liang Qichao'] },
{ c: 'History & War', t: 3, q: 'Which German commander surrendered the remnant of the Sixth Army in the ruins of Stalingrad, a day after being made a field marshal?', a: 'Friedrich Paulus', d: ['Erich von Manstein', 'Hermann Hoth', 'Walther von Reichenau'] },
{ c: 'Science, Letters & Ideas', t: 3, q: 'Which physicist proposed that electrons occupy fixed orbits and jump between them by emitting or absorbing light?', a: 'Niels Bohr', d: ['Arnold Sommerfeld', 'Max Planck', 'Ernest Rutherford'] },
{ c: 'Books & Authors', t: 3, q: 'Which character in The Importance of Being Earnest is appalled to hear that a young man was found in a handbag?', a: 'Lady Bracknell', d: ['Gwendolen Fairfax', 'Miss Prism', 'Cecily Cardew'] },
{ c: 'Screen Lines', t: 3, q: 'Which character in A Nightmare on Elm Street warns \'Whatever you do, don\'t fall asleep\'?', a: 'Nancy Thompson', d: ['Tina Gray', 'Glen Lantz', 'Freddy Krueger'] },

{ c: 'Presidents & Politics', t: 4, q: 'Which leader told a new constituent assembly in August 1947 that its citizens were free to go to their temples, mosques or any other place of worship?', a: 'Muhammad Ali Jinnah', d: ['Liaquat Ali Khan', 'Muhammad Iqbal', 'Ayub Khan'] },
{ c: 'History & War', t: 4, q: 'Which British field marshal issued an order in April 1918 telling his armies to fight on with their backs to the wall?', a: 'Douglas Haig', d: ['Herbert Plumer', 'Henry Rawlinson', 'John French'] },
{ c: 'Science, Letters & Ideas', t: 4, q: 'Which physicist asked over lunch at Los Alamos, of the civilizations that should fill the galaxy, where is everybody?', a: 'Enrico Fermi', d: ['Edward Teller', 'Frank Drake', 'Stanislaw Ulam'] },
{ c: 'Books & Authors', t: 4, q: 'Which novelist took the title of a Compson family novel from a speech in Macbeth about a tale told by an idiot?', a: 'William Faulkner', d: ['Robert Penn Warren', 'Eudora Welty', 'Thomas Wolfe'] },
{ c: 'Screen Lines', t: 4, q: 'Which character in The Untouchables explains that he pulls a knife, you pull a gun, and calls it the Chicago way?', a: 'Jim Malone', d: ['Eliot Ness', 'Al Capone', 'Oscar Wallace'] },

{ c: 'Presidents & Politics', t: 5, q: 'Which framer of India\'s constitution warned in 1949 that political democracy cannot last unless social democracy lies at its base?', a: 'B. R. Ambedkar', d: ['Rajendra Prasad', 'Sardar Patel', 'C. Rajagopalachari'] },
{ c: 'History & War', t: 5, q: 'Which Korean admiral told his king in 1597 that he still had twelve warships and would fight on?', a: 'Yi Sun-sin', d: ['Won Gyun', 'Gwon Yul', 'Kim Si-min'] },
{ c: 'Science, Letters & Ideas', t: 5, q: 'Which mathematician answered the slogan that we shall not know by declaring that we must know, we will know?', a: 'David Hilbert', d: ['Henri Poincare', 'Hermann Weyl', 'Felix Klein'] },
{ c: 'Books & Authors', t: 5, q: 'Which French novelist built a book around every room of a single Paris apartment block, subtitled a user manual for life?', a: 'Georges Perec', d: ['Raymond Queneau', 'Michel Butor', 'Alain Robbe-Grillet'] },
{ c: 'Screen Lines', t: 5, q: 'Which character in Rosemary\'s Baby announces to the coven that the child has his father\'s eyes?', a: 'Roman Castevet', d: ['Minnie Castevet', 'Guy Woodhouse', 'Dr. Sapirstein'] },
],

// ── Day 41 ──────────────────────────────────────────────────────────────
[
{ c: 'Presidents & Politics', t: 1, q: 'Which Soviet leader led his country through the Second World War and died in 1953?', a: 'Joseph Stalin', d: ['Vyacheslav Molotov', 'Nikita Khrushchev', 'Lavrentiy Beria'] },
{ c: 'History & War', t: 1, q: 'Which Virginian drafted the 1776 declaration holding it self-evident that all men are created equal?', a: 'Thomas Jefferson', d: ['John Adams', 'Benjamin Franklin', 'James Madison'] },
{ c: 'Science, Letters & Ideas', t: 1, q: 'Which inventor championed alternating current against Edison in the war of the currents?', a: 'Nikola Tesla', d: ['Michael Faraday', 'Guglielmo Marconi', 'Charles Steinmetz'] },
{ c: 'Books & Authors', t: 1, q: 'Which author wrote about a caterpillar that eats its way through a week of food and becomes a butterfly?', a: 'Eric Carle', d: ['Leo Lionni', 'Maurice Sendak', 'Beatrix Potter'] },
{ c: 'Screen Lines', t: 1, q: 'Which character opens The Sound of Music by singing on an Alpine meadow that the hills are alive?', a: 'Maria', d: ['Captain von Trapp', 'Baroness Elsa Schraeder', 'The Mother Abbess'] },

{ c: 'Presidents & Politics', t: 2, q: 'Which electrician led the strike at the Gdansk shipyard that produced the Solidarity union in 1980?', a: 'Lech Walesa', d: ['Edward Gierek', 'Jacek Kuron', 'Adam Michnik'] },
{ c: 'History & War', t: 2, q: 'Whose shipboard journal records a landfall in the Bahamas on the twelfth of October, 1492?', a: 'Christopher Columbus', d: ['Amerigo Vespucci', 'John Cabot', 'Juan Ponce de Leon'] },
{ c: 'Science, Letters & Ideas', t: 2, q: 'Which pair announced the double helix in a short 1953 letter to Nature?', a: 'Watson and Crick', d: ['Meselson and Stahl', 'Hershey and Chase', 'Avery and MacLeod'] },
{ c: 'Books & Authors', t: 2, q: 'Which character blinds a Cyclops after telling him his name is Nobody?', a: 'Odysseus', d: ['Telemachus', 'Menelaus', 'Diomedes'] },
{ c: 'Screen Lines', t: 2, q: 'Which character in Disney\'s The Little Mermaid sings about wanting to be where the people are?', a: 'Ariel', d: ['Ursula', 'Sebastian', 'King Triton'] },

{ c: 'Presidents & Politics', t: 3, q: 'Which Czech dissident playwright campaigned in 1989 on the slogan that truth and love must prevail over lies and hatred?', a: 'Vaclav Havel', d: ['Alexander Dubcek', 'Jan Palach', 'Milos Zeman'] },
{ c: 'History & War', t: 3, q: 'Which Polish king led the winged hussars in the charge that broke the Ottoman siege of Vienna in 1683?', a: 'Jan III Sobieski', d: ['Charles V of Lorraine', 'Stephen Bathory', 'Eugene of Savoy'] },
{ c: 'Science, Letters & Ideas', t: 3, q: 'Which naturalist mailed Darwin an essay from the Malay Archipelago that arrived at the same theory and forced him to publish?', a: 'Alfred Russel Wallace', d: ['Joseph Dalton Hooker', 'Henry Walter Bates', 'Thomas Huxley'] },
{ c: 'Books & Authors', t: 3, q: 'Which character is rebuked by Mr. Knightley for mocking Miss Bates during the outing to Box Hill?', a: 'Emma Woodhouse', d: ['Harriet Smith', 'Jane Fairfax', 'Mrs. Elton'] },
{ c: 'Screen Lines', t: 3, q: 'Which character snaps \'Never tell me the odds\' while steering into an asteroid field?', a: 'Han Solo', d: ['Princess Leia', 'Lando Calrissian', 'Luke Skywalker'] },

{ c: 'Presidents & Politics', t: 4, q: 'Which general declared martial law in Poland in December 1981 and interned the leaders of Solidarity?', a: 'Wojciech Jaruzelski', d: ['Edward Gierek', 'Stanislaw Kania', 'Mieczyslaw Rakowski'] },
{ c: 'History & War', t: 4, q: 'Which South American liberator wrote near the end of his life that he had plowed the sea?', a: 'Simon Bolivar', d: ['Jose de San Martin', 'Bernardo O\'Higgins', 'Antonio Jose de Sucre'] },
{ c: 'Science, Letters & Ideas', t: 4, q: 'Which economist coined the phrase conspicuous consumption for spending meant to display wealth?', a: 'Thorstein Veblen', d: ['John Kenneth Galbraith', 'Werner Sombart', 'Vilfredo Pareto'] },
{ c: 'Books & Authors', t: 4, q: 'Which writer imagined a library made of an indefinite number of hexagonal galleries containing every possible book?', a: 'Jorge Luis Borges', d: ['Julio Cortazar', 'Adolfo Bioy Casares', 'Ernesto Sabato'] },
{ c: 'Screen Lines', t: 4, q: 'Which character in Indiana Jones and the Last Crusade watches Walter Donovan drink from the wrong cup and observes \'He chose poorly\'?', a: 'The Grail Knight', d: ['Henry Jones Sr.', 'Marcus Brody', 'Elsa Schneider'] },

{ c: 'Presidents & Politics', t: 5, q: 'Which former chancellor said as the Berlin Wall opened that now grows together what belongs together?', a: 'Willy Brandt', d: ['Helmut Schmidt', 'Hans-Dietrich Genscher', 'Richard von Weizsacker'] },
{ c: 'History & War', t: 5, q: 'Which Russian field marshal wrote that the bullet is a fool and the bayonet a fine fellow?', a: 'Alexander Suvorov', d: ['Mikhail Kutuzov', 'Pyotr Bagration', 'Grigory Potemkin'] },
{ c: 'Science, Letters & Ideas', t: 5, q: 'Which political economist showed that communities often govern shared resources well without either privatization or state control?', a: 'Elinor Ostrom', d: ['Garrett Hardin', 'Ronald Coase', 'Mancur Olson'] },
{ c: 'Books & Authors', t: 5, q: 'Which Brazilian novelist wrote a set of posthumous memoirs narrated cheerfully by a dead man?', a: 'Machado de Assis', d: ['Jorge Amado', 'Euclides da Cunha', 'Graciliano Ramos'] },
{ c: 'Screen Lines', t: 5, q: 'Which character opens The Wild Bunch with the order \'If they move, kill \'em\'?', a: 'Pike Bishop', d: ['Dutch Engstrom', 'Deke Thornton', 'Freddie Sykes'] },
],

// ── Day 42 ──────────────────────────────────────────────────────────────
[
{ c: 'Presidents & Politics', t: 1, q: 'Which Soviet leader introduced the policies known as glasnost and perestroika?', a: 'Mikhail Gorbachev', d: ['Yuri Andropov', 'Konstantin Chernenko', 'Leonid Brezhnev'] },
{ c: 'History & War', t: 1, q: 'Which Roman dictator was stabbed to death by a group of senators on the Ides of March, 44 BC?', a: 'Julius Caesar', d: ['Pompey', 'Sulla', 'Crassus'] },
{ c: 'Science, Letters & Ideas', t: 1, q: 'Which Italian was tried by the Roman Inquisition for teaching that the Earth moves around the Sun?', a: 'Galileo Galilei', d: ['Johannes Kepler', 'Nicolaus Copernicus', 'Tycho Brahe'] },
{ c: 'Books & Authors', t: 1, q: 'Which detective rouses his friend at dawn with the cry that the game is afoot?', a: 'Sherlock Holmes', d: ['Hercule Poirot', 'Lord Peter Wimsey', 'Father Brown'] },
{ c: 'Screen Lines', t: 1, q: 'Which character in the 1960s Batman television series greets every crisis with an exclamation beginning \'Holy\'?', a: 'Robin', d: ['Alfred Pennyworth', 'Commissioner Gordon', 'Chief O\'Hara'] },

{ c: 'Presidents & Politics', t: 2, q: 'Which Congress leader took office as independent India\'s first prime minister in 1947?', a: 'Jawaharlal Nehru', d: ['Vallabhbhai Patel', 'Rajendra Prasad', 'Maulana Azad'] },
{ c: 'History & War', t: 2, q: 'Which 1942 carrier battle cost Japan four fleet carriers in a single day and turned the Pacific war?', a: 'Midway', d: ['The Coral Sea', 'Leyte Gulf', 'The Philippine Sea'] },
{ c: 'Science, Letters & Ideas', t: 2, q: 'Whose sayings were collected by his students in the Analects?', a: 'Confucius', d: ['Laozi', 'Mencius', 'Zhuangzi'] },
{ c: 'Books & Authors', t: 2, q: 'Which character hisses about his precious after losing a ring under the Misty Mountains?', a: 'Gollum', d: ['Smaug', 'Bilbo Baggins', 'Thorin Oakenshield'] },
{ c: 'Screen Lines', t: 2, q: 'Which character on Sesame Street sings that it is not easy being green?', a: 'Kermit the Frog', d: ['Oscar the Grouch', 'Big Bird', 'Grover'] },

{ c: 'Presidents & Politics', t: 3, q: 'Which leader denounced the cult of personality around his predecessor in a closed 1956 party congress speech?', a: 'Nikita Khrushchev', d: ['Georgy Malenkov', 'Nikolai Bulganin', 'Anastas Mikoyan'] },
{ c: 'History & War', t: 3, q: 'Which American became the most decorated US soldier of the Second World War and then played himself in the film of his own memoir?', a: 'Audie Murphy', d: ['Alvin York', 'Joe Foss', 'Jimmy Doolittle'] },
{ c: 'Science, Letters & Ideas', t: 3, q: 'Which essayist wrote that nothing great was ever achieved without enthusiasm?', a: 'Ralph Waldo Emerson', d: ['Henry David Thoreau', 'William James', 'Walt Whitman'] },
{ c: 'Books & Authors', t: 3, q: 'Which poet opened a long howl of a poem by saying he saw the best minds of his generation destroyed by madness?', a: 'Allen Ginsberg', d: ['Jack Kerouac', 'Lawrence Ferlinghetti', 'Gregory Corso'] },
{ c: 'Screen Lines', t: 3, q: 'Which character in When Harry Met Sally argues that men and women can never be friends because the sex part always gets in the way?', a: 'Harry Burns', d: ['Sally Albright', 'Jess', 'Marie'] },

{ c: 'Presidents & Politics', t: 4, q: 'Which revolutionary defined communism in 1920 as Soviet power plus the electrification of the whole country?', a: 'Vladimir Lenin', d: ['Leon Trotsky', 'Joseph Stalin', 'Nikolai Bukharin'] },
{ c: 'History & War', t: 4, q: 'Which Mongol general planned the campaigns that carried the horde into Russia and Hungary?', a: 'Subutai', d: ['Jebe', 'Batu Khan', 'Mukhali'] },
{ c: 'Science, Letters & Ideas', t: 4, q: 'Which physicist dipped a scrap of O-ring rubber into a glass of ice water at a televised hearing to show why a shuttle had exploded?', a: 'Richard Feynman', d: ['Sally Ride', 'Neil Armstrong', 'Chuck Yeager'] },
{ c: 'Books & Authors', t: 4, q: 'Which character in Othello closes his opening speech to Roderigo with \'I am not what I am\'?', a: 'Iago', d: ['Roderigo', 'Cassio', 'Brabantio'] },
{ c: 'Screen Lines', t: 4, q: 'Which character in The Grapes of Wrath promises his mother that wherever there is a fight so hungry people can eat, he will be there?', a: 'Tom Joad', d: ['Jim Casy', 'Pa Joad', 'Al Joad'] },

{ c: 'Presidents & Politics', t: 5, q: 'Which physicist turned dissident argued in his 1975 Nobel lecture that international security is inconceivable without an open society?', a: 'Andrei Sakharov', d: ['Alexander Solzhenitsyn', 'Yelena Bonner', 'Natan Sharansky'] },
{ c: 'History & War', t: 5, q: 'Which Chinese premier is famous for saying it was too early to say what the effects of the French Revolution had been, probably meaning the protests of 1968?', a: 'Zhou Enlai', d: ['Mao Zedong', 'Lin Biao', 'Chen Yi'] },
{ c: 'Science, Letters & Ideas', t: 5, q: 'Which imprisoned Italian thinker made pessimism of the intellect, optimism of the will his watchword, borrowing it from Romain Rolland?', a: 'Antonio Gramsci', d: ['Georg Lukacs', 'Benedetto Croce', 'Amadeo Bordiga'] },
{ c: 'Books & Authors', t: 5, q: 'Which Polish poet wrote a Nobel lecture built around the phrase I do not know, and a poem apologizing to chance for calling it necessity?', a: 'Wislawa Szymborska', d: ['Zbigniew Herbert', 'Czeslaw Milosz', 'Tadeusz Rozewicz'] },
{ c: 'Screen Lines', t: 5, q: 'Which character in Easy Rider tells his riding partner at the campfire \'We blew it\'?', a: 'Wyatt', d: ['Billy', 'George Hanson', 'Karen'] },
],

// ── Day 43 ──────────────────────────────────────────────────────────────
[
{ c: 'Presidents & Politics', t: 1, q: 'Who became the first woman to serve as Speaker of the United States House of Representatives, taking the gavel in 2007?', a: 'Nancy Pelosi', d: ['Dianne Feinstein', 'Barbara Mikulski', 'Patricia Schroeder'] },
{ c: 'History & War', t: 1, q: 'Which French emperor is credited with the maxim that an army marches on its stomach?', a: 'Napoleon Bonaparte', d: ['Louis Philippe', 'Napoleon III', 'Charles X'] },
{ c: 'Science, Letters & Ideas', t: 1, q: 'Which British physicist wrote A Brief History of Time?', a: 'Stephen Hawking', d: ['Roger Penrose', 'Paul Dirac', 'Fred Hoyle'] },
{ c: 'Books & Authors', t: 1, q: 'Which author wrote about a bear of very little brain living in the Hundred Acre Wood?', a: 'A. A. Milne', d: ['Kenneth Grahame', 'Beatrix Potter', 'Michael Bond'] },
{ c: 'Screen Lines', t: 1, q: 'Which character on the original Star Trek pronounces the verdict \'He\'s dead, Jim\'?', a: 'Dr. McCoy', d: ['Mr. Spock', 'Montgomery Scott', 'Hikaru Sulu'] },

{ c: 'Presidents & Politics', t: 2, q: 'Which French king was convicted by the Convention and guillotined in January 1793?', a: 'Louis XVI', d: ['Louis XV', 'Charles X', 'Louis Philippe'] },
{ c: 'History & War', t: 2, q: 'Which French port did an improvised fleet of warships and small craft lift more than three hundred thousand Allied troops from in 1940?', a: 'Dunkirk', d: ['Calais', 'Le Havre', 'Cherbourg'] },
{ c: 'Science, Letters & Ideas', t: 2, q: 'Which Swedish botanist gave every species a two-part Latin name?', a: 'Carl Linnaeus', d: ['John Ray', 'Georges-Louis Leclerc de Buffon', 'Joseph Banks'] },
{ c: 'Books & Authors', t: 2, q: 'Which character dies cursing a plague on both the houses of Montague and Capulet?', a: 'Mercutio', d: ['Tybalt', 'Benvolio', 'Paris'] },
{ c: 'Screen Lines', t: 2, q: 'Which character in the 1939 MGM musical, exposed by a small dog, blusters \'Pay no attention to that man behind the curtain\'?', a: 'The Wizard', d: ['The Scarecrow', 'The Tin Man', 'The Cowardly Lion'] },

{ c: 'Presidents & Politics', t: 3, q: 'Which radical deputy edited the paper L\'Ami du peuple and was stabbed to death in his bath in 1793?', a: 'Jean-Paul Marat', d: ['Camille Desmoulins', 'Jacques Hebert', 'Georges Danton'] },
{ c: 'History & War', t: 3, q: 'Which revolutionary signed off his 1965 farewell letter to Cuba with the words ever onward to victory?', a: 'Che Guevara', d: ['Fidel Castro', 'Camilo Cienfuegos', 'Regis Debray'] },
{ c: 'Science, Letters & Ideas', t: 3, q: 'Which philosopher used Bentham\'s design for a circular prison as the model of modern disciplinary power?', a: 'Michel Foucault', d: ['Jacques Derrida', 'Louis Althusser', 'Roland Barthes'] },
{ c: 'Books & Authors', t: 3, q: 'Which novelist opened a book with the words \'Lolita, light of my life, fire of my loins\'?', a: 'Vladimir Nabokov', d: ['Henry Miller', 'John Updike', 'Philip Roth'] },
{ c: 'Screen Lines', t: 3, q: 'Which character asks Bruce Wayne \'You ever dance with the devil in the pale moonlight?\' in Tim Burton\'s Batman?', a: 'The Joker', d: ['Carl Grissom', 'Commissioner Gordon', 'Alexander Knox'] },

{ c: 'Presidents & Politics', t: 4, q: 'Which young deputy argued at the trial of the king that no one can reign innocently?', a: 'Louis Antoine de Saint-Just', d: ['Georges Couthon', 'Bertrand Barere', 'Lazare Carnot'] },
{ c: 'History & War', t: 4, q: 'Which conquistador described the fall of the Aztec capital in a series of long letters to Charles V?', a: 'Hernan Cortes', d: ['Francisco Pizarro', 'Pedro de Alvarado', 'Panfilo de Narvaez'] },
{ c: 'Science, Letters & Ideas', t: 4, q: 'Which mathematician opened a book by observing that clouds are not spheres and mountains are not cones?', a: 'Benoit Mandelbrot', d: ['Edward Lorenz', 'Stephen Wolfram', 'Rene Thom'] },
{ c: 'Books & Authors', t: 4, q: 'Which novelist wrote that the only people for him are the mad ones, mad to live and mad to talk?', a: 'Jack Kerouac', d: ['William S. Burroughs', 'Ken Kesey', 'Richard Brautigan'] },
{ c: 'Screen Lines', t: 4, q: 'Which character in The Searchers answers again and again with the line \'That\'ll be the day\'?', a: 'Ethan Edwards', d: ['Martin Pawley', 'Laurie Jorgensen', 'Reverend Samuel Clayton'] },

{ c: 'Presidents & Politics', t: 5, q: 'Which cleric opened an influential 1789 pamphlet by asking what the Third Estate was, and answering everything?', a: 'Emmanuel Joseph Sieyes', d: ['Honore Mirabeau', 'Jean-Sylvain Bailly', 'Talleyrand'] },
{ c: 'History & War', t: 5, q: 'Which Byzantine historian wrote a public account of Justinian\'s wars and a savage private one he never dared publish?', a: 'Procopius', d: ['Agathias', 'John Malalas', 'Menander Protector'] },
{ c: 'Science, Letters & Ideas', t: 5, q: 'Which astronomer measured galaxy rotation curves that stay flat far from the center, strong evidence for unseen mass?', a: 'Vera Rubin', d: ['Jocelyn Bell Burnell', 'Margaret Burbidge', 'Sandra Faber'] },
{ c: 'Books & Authors', t: 5, q: 'Which American novelist wrote a nine-hundred-page first novel about a painter of forged Flemish masterpieces?', a: 'William Gaddis', d: ['John Barth', 'Robert Coover', 'William Gass'] },
{ c: 'Screen Lines', t: 5, q: 'Which character in To Kill a Mockingbird tells Scout to stand up in the balcony because her father is passing?', a: 'Reverend Sykes', d: ['Atticus Finch', 'Calpurnia', 'Judge Taylor'] },
],

// ── Day 44 ──────────────────────────────────────────────────────────────
[
{ c: 'Presidents & Politics', t: 1, q: 'Which Italian leader founded the Fascist party and took power after the 1922 March on Rome?', a: 'Benito Mussolini', d: ['Victor Emmanuel III', 'Gabriele D\'Annunzio', 'Italo Balbo'] },
{ c: 'History & War', t: 1, q: 'Which Mongol leader united the steppe tribes and set his armies loose on China and Persia?', a: 'Genghis Khan', d: ['Kublai Khan', 'Ogedei Khan', 'Timur'] },
{ c: 'Science, Letters & Ideas', t: 1, q: 'Which American inventor built the first phonograph and a practical incandescent lamp at his Menlo Park laboratory?', a: 'Thomas Edison', d: ['Nikola Tesla', 'George Westinghouse', 'Elisha Gray'] },
{ c: 'Books & Authors', t: 1, q: 'Which orphan adopted at Green Gables insists that her name be spelled with an e at the end?', a: 'Anne Shirley', d: ['Diana Barry', 'Marilla Cuthbert', 'Rachel Lynde'] },
{ c: 'Screen Lines', t: 1, q: 'Which character in Snow White and the Seven Dwarfs asks a magic mirror who is the fairest one of all?', a: 'The Evil Queen', d: ['Snow White', 'The Huntsman', 'Grumpy'] },

{ c: 'Presidents & Politics', t: 2, q: 'Which deputy prime minister in the wartime coalition went on to win the 1945 general election outright?', a: 'Clement Attlee', d: ['Anthony Eden', 'Ernest Bevin', 'Herbert Morrison'] },
{ c: 'History & War', t: 2, q: 'Which American lawyer, watching a British bombardment of Baltimore in 1814, wrote the verses about the rockets red glare?', a: 'Francis Scott Key', d: ['Philip Freneau', 'Joel Barlow', 'Samuel Woodworth'] },
{ c: 'Science, Letters & Ideas', t: 2, q: 'Which seismologist gave his name to the best known scale of earthquake magnitude?', a: 'Charles Richter', d: ['Giuseppe Mercalli', 'John Milne', 'Beno Gutenberg'] },
{ c: 'Books & Authors', t: 2, q: 'Which character in The Wind in the Willows is ruined by his passion for motor-cars?', a: 'Mr. Toad', d: ['Ratty', 'Badger', 'Otter'] },
{ c: 'Screen Lines', t: 2, q: 'Which character on Sesame Street sings that C is for cookie, and that is good enough for him?', a: 'Cookie Monster', d: ['Oscar the Grouch', 'Bert', 'Ernie'] },

{ c: 'Presidents & Politics', t: 3, q: 'Which Liberal leader was Disraeli\'s great rival and served four separate terms as prime minister?', a: 'William Gladstone', d: ['Lord Palmerston', 'Lord Rosebery', 'Lord John Russell'] },
{ c: 'History & War', t: 3, q: 'Which leader told a midnight assembly in 1947 that at the stroke of the hour his nation would awake to life and freedom?', a: 'Jawaharlal Nehru', d: ['Mahatma Gandhi', 'Muhammad Ali Jinnah', 'Vallabhbhai Patel'] },
{ c: 'Science, Letters & Ideas', t: 3, q: 'Which philosopher argued in a 1945 lecture that existence precedes essence?', a: 'Jean-Paul Sartre', d: ['Martin Heidegger', 'Karl Jaspers', 'Gabriel Marcel'] },
{ c: 'Books & Authors', t: 3, q: 'Which character in The Picture of Dorian Gray paints the portrait that ages in place of its subject?', a: 'Basil Hallward', d: ['Lord Henry Wotton', 'Sibyl Vane', 'Alan Campbell'] },
{ c: 'Screen Lines', t: 3, q: 'Which character in Grease drops her good-girl image and tells Danny \'Tell me about it, stud\'?', a: 'Sandy Olsson', d: ['Betty Rizzo', 'Frenchy', 'Jan'] },

{ c: 'Presidents & Politics', t: 4, q: 'Which former prime minister told the Commons in 1932 that the bomber will always get through?', a: 'Stanley Baldwin', d: ['Ramsay MacDonald', 'Neville Chamberlain', 'Winston Churchill'] },
{ c: 'History & War', t: 4, q: 'Which Muslim commander, called the Sword of God, destroyed the Byzantine army at the Yarmuk in 636?', a: 'Khalid ibn al-Walid', d: ['Abu Ubayda ibn al-Jarrah', 'Amr ibn al-As', 'Sad ibn Abi Waqqas'] },
{ c: 'Science, Letters & Ideas', t: 4, q: 'Which philosopher said his aim was not to laugh at human actions, nor to weep over them, but to understand them?', a: 'Baruch Spinoza', d: ['Rene Descartes', 'Gottfried Leibniz', 'Thomas Hobbes'] },
{ c: 'Books & Authors', t: 4, q: 'Which poet began a holy sonnet \'Batter my heart, three-personed God\'?', a: 'John Donne', d: ['George Herbert', 'Henry Vaughan', 'Richard Crashaw'] },
{ c: 'Screen Lines', t: 4, q: 'Which character keeps asking \'Who are those guys?\' about the posse trailing him in the 1969 western?', a: 'Butch Cassidy', d: ['The Sundance Kid', 'Etta Place', 'Sheriff Bledsoe'] },

{ c: 'Presidents & Politics', t: 5, q: 'Which minister warned his party in 1957 that unilateral disarmament would send a foreign secretary naked into the conference chamber?', a: 'Aneurin Bevan', d: ['Hugh Gaitskell', 'Harold Wilson', 'George Brown'] },
{ c: 'History & War', t: 5, q: 'Which Moroccan traveler dictated a Rihla recounting nearly thirty years of journeys from Mali to China?', a: 'Ibn Battuta', d: ['Ibn Jubayr', 'Al-Masudi', 'Ibn Khaldun'] },
{ c: 'Science, Letters & Ideas', t: 5, q: 'Which physicist, with her nephew Otto Frisch, explained the splitting of the uranium nucleus and gave the process its name?', a: 'Lise Meitner', d: ['Ida Noddack', 'Irene Joliot-Curie', 'Marietta Blau'] },
{ c: 'Books & Authors', t: 5, q: 'Which Nigerian playwright wrote a tragedy about a colonial officer preventing a ritual suicide, called \'Death and the King\'s Horseman\'?', a: 'Wole Soyinka', d: ['Chinua Achebe', 'Ben Okri', 'Athol Fugard'] },
{ c: 'Screen Lines', t: 5, q: 'Which character in Amadeus complains that a new opera has simply too many notes?', a: 'Emperor Joseph II', d: ['Antonio Salieri', 'Count Orsini-Rosenberg', 'Baron van Swieten'] },
],

// ── Day 45 ──────────────────────────────────────────────────────────────
[
{ c: 'Presidents & Politics', t: 1, q: 'Which Roman general crossed the Rubicon in 49 BC to march on Rome?', a: 'Julius Caesar', d: ['Pompey', 'Sulla', 'Crassus'] },
{ c: 'History & War', t: 1, q: 'Which French teenager led an army to relieve Orleans and was burned at Rouen in 1431?', a: 'Joan of Arc', d: ['Isabella of France', 'Catherine of Siena', 'Margaret of Anjou'] },
{ c: 'Science, Letters & Ideas', t: 1, q: 'Which thinker wrote the Communist Manifesto with Friedrich Engels?', a: 'Karl Marx', d: ['Vladimir Lenin', 'Pierre-Joseph Proudhon', 'Ferdinand Lassalle'] },
{ c: 'Books & Authors', t: 1, q: 'Which author sent a girl down a rabbit hole to a tea party with a Mad Hatter?', a: 'Lewis Carroll', d: ['Edward Lear', 'George MacDonald', 'Charles Kingsley'] },
{ c: 'Screen Lines', t: 1, q: 'Which character in Scooby-Doo yelps \'Zoinks!\' at the first sign of a ghost?', a: 'Shaggy Rogers', d: ['Velma Dinkley', 'Fred Jones', 'Daphne Blake'] },

{ c: 'Presidents & Politics', t: 2, q: 'Which former slave led the revolution in Saint-Domingue that produced the state of Haiti?', a: 'Toussaint Louverture', d: ['Jean-Jacques Dessalines', 'Henri Christophe', 'Alexandre Petion'] },
{ c: 'History & War', t: 2, q: 'Which Norwegian officer collaborated with the German occupation so notoriously that his surname became a common word for traitor?', a: 'Vidkun Quisling', d: ['Pierre Laval', 'Anton Mussert', 'Ante Pavelic'] },
{ c: 'Science, Letters & Ideas', t: 2, q: 'Which German physicist discovered X-rays and won the first Nobel Prize in Physics?', a: 'Wilhelm Rontgen', d: ['Henri Becquerel', 'Philipp Lenard', 'Max von Laue'] },
{ c: 'Books & Authors', t: 2, q: 'Which character in The Iliad sulks in his tent and refuses to fight until his friend is killed?', a: 'Achilles', d: ['Agamemnon', 'Ajax', 'Diomedes'] },
{ c: 'Screen Lines', t: 2, q: 'Which character ends Rocky II by shouting \'Yo, Adrian, I did it!\'?', a: 'Rocky Balboa', d: ['Apollo Creed', 'Paulie Pennino', 'Mickey Goldmill'] },

{ c: 'Presidents & Politics', t: 3, q: 'Which Mexican president nationalized the foreign oil companies in 1938?', a: 'Lazaro Cardenas', d: ['Plutarco Elias Calles', 'Alvaro Obregon', 'Miguel Aleman'] },
{ c: 'History & War', t: 3, q: 'Which German general, recalled from retirement in 1914, was credited with destroying a Russian army at Tannenberg?', a: 'Paul von Hindenburg', d: ['Max von Prittwitz', 'August von Mackensen', 'Hermann von Francois'] },
{ c: 'Science, Letters & Ideas', t: 3, q: 'Which physicist won the 1921 Nobel Prize for explaining the photoelectric effect?', a: 'Albert Einstein', d: ['Max Planck', 'Robert Millikan', 'Arthur Compton'] },
{ c: 'Books & Authors', t: 3, q: 'Which character in Crime and Punishment is the destitute student who murders a pawnbroker with an axe?', a: 'Rodion Raskolnikov', d: ['Arkady Svidrigailov', 'Dmitri Razumikhin', 'Porfiry Petrovich'] },
{ c: 'Screen Lines', t: 3, q: 'Which character in One Flew Over the Cuckoo\'s Nest fails to lift the control panel and says \'But I tried, didn\'t I? At least I did that\'?', a: 'Randle McMurphy', d: ['Chief Bromden', 'Billy Bibbit', 'Nurse Ratched'] },

{ c: 'Presidents & Politics', t: 4, q: 'Which Brazilian president ended a 1954 farewell letter by saying he was leaving life to enter history?', a: 'Getulio Vargas', d: ['Juscelino Kubitschek', 'Joao Goulart', 'Eurico Gaspar Dutra'] },
{ c: 'History & War', t: 4, q: 'Which Soviet leader told the United Nations in 1988 that freedom of choice was a universal principle admitting no exceptions?', a: 'Mikhail Gorbachev', d: ['Eduard Shevardnadze', 'Andrei Gromyko', 'Yuri Andropov'] },
{ c: 'Science, Letters & Ideas', t: 4, q: 'Which mathematician, told that a taxi number 1729 was dull, replied that it was the smallest number expressible as a sum of two cubes in two ways?', a: 'Srinivasa Ramanujan', d: ['G. H. Hardy', 'J. E. Littlewood', 'Norbert Wiener'] },
{ c: 'Books & Authors', t: 4, q: 'Which poet wrote of sunset and evening star, and one clear call for him?', a: 'Alfred Tennyson', d: ['Robert Southey', 'Arthur Hugh Clough', 'Coventry Patmore'] },
{ c: 'Screen Lines', t: 4, q: 'Which character on The Andy Griffith Show insists that trouble must be nipped in the bud?', a: 'Barney Fife', d: ['Andy Taylor', 'Gomer Pyle', 'Otis Campbell'] },

{ c: 'Presidents & Politics', t: 5, q: 'Which Cuban independence leader wrote that the wine may be sour, but it is our wine?', a: 'Jose Marti', d: ['Antonio Maceo', 'Maximo Gomez', 'Carlos Manuel de Cespedes'] },
{ c: 'History & War', t: 5, q: 'Which Polish officer let himself be arrested and sent into Auschwitz so that he could report on it to the underground?', a: 'Witold Pilecki', d: ['Jan Karski', 'Kazimierz Piechowski', 'Jozef Cyrankiewicz'] },
{ c: 'Science, Letters & Ideas', t: 5, q: 'Which mathematician wrote that it is by logic that we prove, but by intuition that we discover?', a: 'Henri Poincare', d: ['David Hilbert', 'Jacques Hadamard', 'Felix Klein'] },
{ c: 'Books & Authors', t: 5, q: 'Which Greek poet of Alexandria told a traveler bound for Ithaka to hope the road is a long one?', a: 'C. P. Cavafy', d: ['George Seferis', 'Odysseus Elytis', 'Yannis Ritsos'] },
{ c: 'Screen Lines', t: 5, q: 'Which character closes Now, Voyager with \'Don\'t let\'s ask for the moon. We have the stars\'?', a: 'Charlotte Vale', d: ['Jerry Durrance', 'Mrs. Henry Vale', 'Dr. Jaquith'] },
],

// ── Day 46 ──────────────────────────────────────────────────────────────
[
{ c: 'Presidents & Politics', t: 1, q: 'Which Argentine-born doctor became a commander in the Cuban revolution and was killed in Bolivia in 1967?', a: 'Che Guevara', d: ['Camilo Cienfuegos', 'Raul Castro', 'Juan Almeida'] },
{ c: 'History & War', t: 1, q: 'Which Egyptian queen backed Julius Caesar and then Mark Antony, and died as Rome took her kingdom?', a: 'Cleopatra', d: ['Nefertiti', 'Hatshepsut', 'Berenice IV'] },
{ c: 'Science, Letters & Ideas', t: 1, q: 'Which Italian painted the Mona Lisa?', a: 'Leonardo da Vinci', d: ['Michelangelo', 'Raphael', 'Titian'] },
{ c: 'Books & Authors', t: 1, q: 'Which author wrote the picture book in which a boy in a wolf suit orders the wild rumpus to start?', a: 'Maurice Sendak', d: ['Shel Silverstein', 'Ezra Jack Keats', 'Tomie dePaola'] },
{ c: 'Screen Lines', t: 1, q: 'Which character tells a young Peter Parker that with great power comes great responsibility?', a: 'Uncle Ben', d: ['Aunt May', 'Norman Osborn', 'J. Jonah Jameson'] },

{ c: 'Presidents & Politics', t: 2, q: 'Which bodybuilder turned actor was elected governor of California in the recall vote of 2003?', a: 'Arnold Schwarzenegger', d: ['Ronald Reagan', 'Jerry Brown', 'Gray Davis'] },
{ c: 'History & War', t: 2, q: 'Which general wrote out the surrender terms at Appomattox that let the beaten officers keep their side arms and horses?', a: 'Ulysses S. Grant', d: ['George Meade', 'Philip Sheridan', 'Winfield Scott Hancock'] },
{ c: 'Science, Letters & Ideas', t: 2, q: 'Which physicist used a prism to show that white light is a mixture of colors rather than a pure substance?', a: 'Isaac Newton', d: ['Robert Hooke', 'Christiaan Huygens', 'Rene Descartes'] },
{ c: 'Books & Authors', t: 2, q: 'Which character in Oliver Twist trains a gang of boys to pick pockets from a den in London?', a: 'Fagin', d: ['Bill Sikes', 'The Artful Dodger', 'Mr. Bumble'] },
{ c: 'Screen Lines', t: 2, q: 'Which character in The Matrix offers Neo a choice between a red pill and a blue pill?', a: 'Morpheus', d: ['Trinity', 'Agent Smith', 'Cypher'] },

{ c: 'Presidents & Politics', t: 3, q: 'Which emperor ordered the sweeping codification of Roman law completed in the 530s?', a: 'Justinian I', d: ['Constantine', 'Theodosius I', 'Diocletian'] },
{ c: 'History & War', t: 3, q: 'Which Alamo commander ended his appeal for help with the signature \'Victory or Death\'?', a: 'William B. Travis', d: ['Jim Bowie', 'Davy Crockett', 'James Fannin'] },
{ c: 'Science, Letters & Ideas', t: 3, q: 'Which philosopher, asked by Alexander the Great what he wanted, replied that the king could stand out of his sunlight?', a: 'Diogenes', d: ['Antisthenes', 'Crates of Thebes', 'Zeno of Citium'] },
{ c: 'Books & Authors', t: 3, q: 'Which character turns out to be the secret benefactor behind Pip\'s fortune?', a: 'Abel Magwitch', d: ['Miss Havisham', 'Mr. Jaggers', 'Herbert Pocket'] },
{ c: 'Screen Lines', t: 3, q: 'Which character in Apollo 13 tells his flight controllers that failure is not an option?', a: 'Gene Kranz', d: ['Jim Lovell', 'Jack Swigert', 'Ken Mattingly'] },

{ c: 'Presidents & Politics', t: 4, q: 'Which emperor told greedy provincial governors that a good shepherd shears his flock rather than flaying it?', a: 'Tiberius', d: ['Claudius', 'Caligula', 'Domitian'] },
{ c: 'History & War', t: 4, q: 'Which condemned raider handed his jailer a note predicting that the crimes of a guilty land would be purged only with blood?', a: 'John Brown', d: ['Nat Turner', 'Denmark Vesey', 'Elijah Lovejoy'] },
{ c: 'Science, Letters & Ideas', t: 4, q: 'Which Stoic taught that people are disturbed not by things but by the opinions they hold about things?', a: 'Epictetus', d: ['Seneca', 'Musonius Rufus', 'Cicero'] },
{ c: 'Books & Authors', t: 4, q: 'Which novelist wrote a comic novel about Ignatius J. Reilly that was published eleven years after his own suicide?', a: 'John Kennedy Toole', d: ['Walker Percy', 'Barry Hannah', 'Harry Crews'] },
{ c: 'Screen Lines', t: 4, q: 'Which character in Galaxy Quest is stuck with the catchphrase \'Never give up, never surrender!\'?', a: 'Jason Nesmith', d: ['Sir Alexander Dane', 'Gwen DeMarco', 'Fred Kwan'] },

{ c: 'Presidents & Politics', t: 5, q: 'Which Saskatchewan premier brought in North America\'s first government hospital insurance plan in 1947?', a: 'Tommy Douglas', d: ['Ernest Manning', 'John Diefenbaker', 'Lester Pearson'] },
{ c: 'History & War', t: 5, q: 'Which Confederate general, asked why his charge at Gettysburg failed, is said to have answered that the Yankees had something to do with it?', a: 'George Pickett', d: ['James Longstreet', 'Richard Ewell', 'Jubal Early'] },
{ c: 'Science, Letters & Ideas', t: 5, q: 'Which French philosopher wrote that attention is the rarest and purest form of generosity?', a: 'Simone Weil', d: ['Iris Murdoch', 'Edith Stein', 'Gabriel Marcel'] },
{ c: 'Books & Authors', t: 5, q: 'Which American poet wrote a long modernist sequence centered on the Brooklyn Bridge before jumping from a ship in 1932?', a: 'Hart Crane', d: ['Vachel Lindsay', 'Edwin Arlington Robinson', 'Allen Tate'] },
{ c: 'Screen Lines', t: 5, q: 'Which character in Master and Commander makes the dinner-table joke about choosing the lesser of two weevils?', a: 'Jack Aubrey', d: ['Stephen Maturin', 'Tom Pullings', 'Barrett Bonden'] },
],

// ── Day 47 ──────────────────────────────────────────────────────────────
[
{ c: 'Presidents & Politics', t: 1, q: 'Which senator from Delaware served two terms as vice president under Barack Obama?', a: 'Joe Biden', d: ['Al Gore', 'John Kerry', 'Tim Kaine'] },
{ c: 'History & War', t: 1, q: 'Which Virginian was chosen in 1775 to command the Continental Army?', a: 'George Washington', d: ['Horatio Gates', 'Charles Lee', 'Israel Putnam'] },
{ c: 'Science, Letters & Ideas', t: 1, q: 'Which French chemist gave his name to the gentle heating that keeps milk and wine from spoiling?', a: 'Louis Pasteur', d: ['Antoine Lavoisier', 'Justus von Liebig', 'Claude Bernard'] },
{ c: 'Books & Authors', t: 1, q: 'Which author wrote the fairy tale of a mermaid who trades her voice for a pair of legs?', a: 'Hans Christian Andersen', d: ['Charles Perrault', 'The Brothers Grimm', 'Oscar Wilde'] },
{ c: 'Screen Lines', t: 1, q: 'Which character answers a soldier who asks whether he is stupid by saying that stupid is as stupid does?', a: 'Forrest Gump', d: ['Lieutenant Dan Taylor', 'Bubba Blue', 'Jenny Curran'] },

{ c: 'Presidents & Politics', t: 2, q: 'Which South African archbishop said that if you are neutral in situations of injustice you have chosen the side of the oppressor?', a: 'Desmond Tutu', d: ['Allan Boesak', 'Trevor Huddleston', 'Beyers Naude'] },
{ c: 'History & War', t: 2, q: 'Which American wrote to her husband in 1776 asking him to remember the ladies when the new laws were framed?', a: 'Abigail Adams', d: ['Martha Washington', 'Mercy Otis Warren', 'Dolley Madison'] },
{ c: 'Science, Letters & Ideas', t: 2, q: 'Which Chinese sage is credited with the saying that a journey of a thousand miles begins with a single step?', a: 'Laozi', d: ['Confucius', 'Mencius', 'Zhuangzi'] },
{ c: 'Books & Authors', t: 2, q: 'Which character escapes down the Mississippi on a raft with Huckleberry Finn?', a: 'Jim', d: ['Tom Sawyer', 'Pap Finn', 'Joe Harper'] },
{ c: 'Screen Lines', t: 2, q: 'Which character tells the Council of Elrond that one does not simply walk into Mordor?', a: 'Boromir', d: ['Aragorn', 'Elrond', 'Legolas'] },

{ c: 'Presidents & Politics', t: 3, q: 'Which president announced in February 1990 that the ban on the African National Congress was lifted and its most famous prisoner would go free?', a: 'F. W. de Klerk', d: ['P. W. Botha', 'John Vorster', 'Roelf Meyer'] },
{ c: 'History & War', t: 3, q: 'Which frontiersman told the voters who defeated him that they might all go to hell and he would go to Texas?', a: 'Davy Crockett', d: ['Sam Houston', 'Jim Bowie', 'Daniel Boone'] },
{ c: 'Science, Letters & Ideas', t: 3, q: 'Which English humanist invented the word Utopia for an imaginary island commonwealth?', a: 'Thomas More', d: ['Erasmus', 'Francis Bacon', 'Tommaso Campanella'] },
{ c: 'Books & Authors', t: 3, q: 'Which king cries \'A horse! a horse! my kingdom for a horse!\' at Bosworth Field?', a: 'Richard III', d: ['Henry V', 'King Lear', 'Macbeth'] },
{ c: 'Screen Lines', t: 3, q: 'Which character in Jurassic Park keeps boasting that he spared no expense?', a: 'John Hammond', d: ['Alan Grant', 'Ellie Sattler', 'Donald Gennaro'] },

{ c: 'Presidents & Politics', t: 4, q: 'Which South African student leader wrote that the most potent weapon in the hands of the oppressor is the mind of the oppressed?', a: 'Steve Biko', d: ['Robert Sobukwe', 'Chris Hani', 'Walter Sisulu'] },
{ c: 'History & War', t: 4, q: 'Which French volunteer wrote home in 1777 that the happiness of America was intimately bound up with the happiness of all humanity?', a: 'The Marquis de Lafayette', d: ['Baron von Steuben', 'Comte de Rochambeau', 'Casimir Pulaski'] },
{ c: 'Science, Letters & Ideas', t: 4, q: 'Which writer took the question what do I know? as his motto and turned the essay into a form for self-examination?', a: 'Michel de Montaigne', d: ['Francis Bacon', 'Blaise Pascal', 'Erasmus'] },
{ c: 'Books & Authors', t: 4, q: 'Which novelist gave the madwoman in the Thornfield attic a name and a childhood in a novel set in the Caribbean?', a: 'Jean Rhys', d: ['Elizabeth Bowen', 'Rosamond Lehmann', 'Barbara Comyns'] },
{ c: 'Screen Lines', t: 4, q: 'Which character in Office Space drawls that he is going to need you to go ahead and come in on Saturday?', a: 'Bill Lumbergh', d: ['Peter Gibbons', 'Milton Waddams', 'Michael Bolton'] },

{ c: 'Presidents & Politics', t: 5, q: 'Which prime minister used a 1960 independence day speech to describe the insults his people had endured morning, noon and night?', a: 'Patrice Lumumba', d: ['Joseph Kasavubu', 'Moise Tshombe', 'Mobutu Sese Seko'] },
{ c: 'History & War', t: 5, q: 'Which British general wrote to Sir Henry Clinton that he had been forced to give up the post at York and Gloucester?', a: 'Charles Cornwallis', d: ['William Howe', 'John Burgoyne', 'Banastre Tarleton'] },
{ c: 'Science, Letters & Ideas', t: 5, q: 'Which Russian mathematician put probability on an axiomatic footing in a short 1933 monograph?', a: 'Andrey Kolmogorov', d: ['Andrey Markov', 'Pafnuty Chebyshev', 'Emile Borel'] },
{ c: 'Books & Authors', t: 5, q: 'Which novelist traced three generations of an army family through the last decades of the Habsburg empire in a book named for a march?', a: 'Joseph Roth', d: ['Stefan Zweig', 'Arthur Schnitzler', 'Hermann Broch'] },
{ c: 'Screen Lines', t: 5, q: 'Which character in The X-Files leaves Scully with the parting warning \'Trust no one\'?', a: 'Deep Throat', d: ['Fox Mulder', 'Walter Skinner', 'The Cigarette Smoking Man'] },
],

// ── Day 48 ──────────────────────────────────────────────────────────────
[
{ c: 'Presidents & Politics', t: 1, q: 'Which leader proclaimed the founding of the People\'s Republic of China from Tiananmen in 1949?', a: 'Mao Zedong', d: ['Zhou Enlai', 'Liu Shaoqi', 'Zhu De'] },
{ c: 'History & War', t: 1, q: 'Which Norman duke won at Hastings in 1066 and had England surveyed in the Domesday Book?', a: 'William the Conqueror', d: ['Harold Godwinson', 'Harald Hardrada', 'Edward the Confessor'] },
{ c: 'Science, Letters & Ideas', t: 1, q: 'Which Swedish chemist invented dynamite and left his fortune to endow a set of annual prizes?', a: 'Alfred Nobel', d: ['Ascanio Sobrero', 'Christian Schonbein', 'Jons Jacob Berzelius'] },
{ c: 'Books & Authors', t: 1, q: 'Which character closes A Christmas Carol with \'God bless us, every one!\'?', a: 'Tiny Tim', d: ['Bob Cratchit', 'Fred', 'Mr. Fezziwig'] },
{ c: 'Screen Lines', t: 1, q: 'Which character in Toy Story says \'Reach for the sky!\' when his pull string is tugged?', a: 'Woody', d: ['Buzz Lightyear', 'Mr. Potato Head', 'Rex'] },

{ c: 'Presidents & Politics', t: 2, q: 'Which Nationalist leader withdrew his government to Taiwan in 1949 and ruled there for decades?', a: 'Chiang Kai-shek', d: ['Sun Yat-sen', 'Wang Jingwei', 'Yan Xishan'] },
{ c: 'History & War', t: 2, q: 'Which fortification was raised and rebuilt across the northern frontier of an East Asian empire, dynasty after dynasty, to hold back steppe raiders?', a: 'The Great Wall of China', d: ['The Grand Canal', 'The Silk Road', 'The Forbidden City'] },
{ c: 'Science, Letters & Ideas', t: 2, q: 'Which Italian built the first battery, a pile of zinc and copper discs separated by brine-soaked cloth?', a: 'Alessandro Volta', d: ['Luigi Galvani', 'Andre-Marie Ampere', 'Georg Ohm'] },
{ c: 'Books & Authors', t: 2, q: 'Which author sent the Nautilus and its bitter captain twenty thousand leagues under the sea?', a: 'Jules Verne', d: ['H. G. Wells', 'Robert Louis Stevenson', 'Alexandre Dumas'] },
{ c: 'Screen Lines', t: 2, q: 'Which character in Aladdin complains of having phenomenal cosmic powers and an itty-bitty living space?', a: 'Genie', d: ['Aladdin', 'Jafar', 'Iago'] },

{ c: 'Presidents & Politics', t: 3, q: 'Who became the world\'s first woman prime minister when she took office in Ceylon in 1960?', a: 'Sirimavo Bandaranaike', d: ['Indira Gandhi', 'Golda Meir', 'Vijaya Lakshmi Pandit'] },
{ c: 'History & War', t: 3, q: 'Which Zulu king was on the throne when his regiments wiped out a British column at Isandlwana in 1879?', a: 'Cetshwayo', d: ['Shaka', 'Dingane', 'Mpande'] },
{ c: 'Science, Letters & Ideas', t: 3, q: 'Which English chemist proposed that every element consists of atoms of one characteristic weight?', a: 'John Dalton', d: ['Robert Boyle', 'Joseph Proust', 'Humphry Davy'] },
{ c: 'Books & Authors', t: 3, q: 'Which novelist had a fugitive promise his mother that he would be there wherever there is a fight so hungry people can eat?', a: 'John Steinbeck', d: ['Erskine Caldwell', 'Sinclair Lewis', 'James T. Farrell'] },
{ c: 'Screen Lines', t: 3, q: 'Which character in The Lion King says that the past can hurt, but you can either run from it or learn from it?', a: 'Rafiki', d: ['Mufasa', 'Zazu', 'Nala'] },

{ c: 'Presidents & Politics', t: 4, q: 'Which Burmese opposition leader wrote in a 1990 essay that it is not power that corrupts but fear?', a: 'Aung San Suu Kyi', d: ['U Nu', 'Aung San', 'Ne Win'] },
{ c: 'History & War', t: 4, q: 'Which Roman emperor left a record of his own deeds, opening with the claim that he had made the world subject to the rule of the Roman people, inscribed outside his tomb?', a: 'Augustus', d: ['Tiberius', 'Julius Caesar', 'Trajan'] },
{ c: 'Science, Letters & Ideas', t: 4, q: 'Which Italian proposed that equal volumes of gases at the same temperature and pressure contain equal numbers of molecules?', a: 'Amedeo Avogadro', d: ['Joseph Louis Gay-Lussac', 'Stanislao Cannizzaro', 'Jons Jacob Berzelius'] },
{ c: 'Books & Authors', t: 4, q: 'Which character in Uncle Tom\'s Cabin escapes across the ice floes of the Ohio River carrying her child?', a: 'Eliza Harris', d: ['Cassy', 'Topsy', 'Aunt Chloe'] },
{ c: 'Screen Lines', t: 4, q: 'Which character in Monsters, Inc. warns Wazowski from behind a desk that she is always watching him?', a: 'Roz', d: ['Celia Mae', 'Henry J. Waternoose', 'Randall Boggs'] },

{ c: 'Presidents & Politics', t: 5, q: 'Which Singaporean leader said that between being loved and being feared he had always believed Machiavelli was right?', a: 'Lee Kuan Yew', d: ['Goh Chok Tong', 'S. Rajaratnam', 'Tunku Abdul Rahman'] },
{ c: 'History & War', t: 5, q: 'Which Asante queen mother led the 1900 rising against the British over the seizure of the Golden Stool?', a: 'Yaa Asantewaa', d: ['Nzinga of Ndongo', 'Amina of Zazzau', 'Nehanda of Zimbabwe'] },
{ c: 'Science, Letters & Ideas', t: 5, q: 'Which American founded chemical thermodynamics with a long paper on the equilibrium of heterogeneous substances?', a: 'Josiah Willard Gibbs', d: ['Walther Nernst', 'Jacobus van \'t Hoff', 'Pierre Duhem'] },
{ c: 'Books & Authors', t: 5, q: 'Which American novelist wrote a 1936 novel of night-wandering expatriates in Paris that T. S. Eliot introduced?', a: 'Djuna Barnes', d: ['H.D.', 'Mina Loy', 'Kay Boyle'] },
{ c: 'Screen Lines', t: 5, q: 'Which character on Deep Space Nine says that the truth is usually just an excuse for a lack of imagination?', a: 'Elim Garak', d: ['Odo', 'Quark', 'Julian Bashir'] },
],

// ── Day 49 ──────────────────────────────────────────────────────────────
[
{ c: 'Presidents & Politics', t: 1, q: 'Which senator from Illinois became the first Black president of the United States in 2009?', a: 'Barack Obama', d: ['Jesse Jackson', 'Colin Powell', 'Deval Patrick'] },
{ c: 'History & War', t: 1, q: 'Which king of the Huns terrorized both halves of the Roman world in the fifth century and was nicknamed the Scourge of God?', a: 'Attila', d: ['Alaric', 'Odoacer', 'Genseric'] },
{ c: 'Science, Letters & Ideas', t: 1, q: 'Which artist made silkscreen prints of Campbell soup cans and of Marilyn Monroe?', a: 'Andy Warhol', d: ['Roy Lichtenstein', 'Jasper Johns', 'Robert Rauschenberg'] },
{ c: 'Books & Authors', t: 1, q: 'Which gloomy donkey in the Hundred Acre Wood is forever losing his tail?', a: 'Eeyore', d: ['Piglet', 'Tigger', 'Owl'] },
{ c: 'Screen Lines', t: 1, q: 'Which character on Friends greets women with the drawn-out line \'How you doin\'?\'', a: 'Joey Tribbiani', d: ['Chandler Bing', 'Ross Geller', 'Gunther'] },

{ c: 'Presidents & Politics', t: 2, q: 'Which activist gave a 1964 Cleveland speech remembered by the title The Ballot or the Bullet?', a: 'Malcolm X', d: ['Stokely Carmichael', 'Elijah Muhammad', 'Huey Newton'] },
{ c: 'History & War', t: 2, q: 'Which Greek writer began his account of the Persian Wars by saying he set it down so that human achievements would not fade from memory?', a: 'Herodotus', d: ['Xenophon', 'Plutarch', 'Diodorus Siculus'] },
{ c: 'Science, Letters & Ideas', t: 2, q: 'Which painter answered the 1937 bombing of a Basque town with an enormous gray and black canvas?', a: 'Pablo Picasso', d: ['Joan Miro', 'Salvador Dali', 'Georges Braque'] },
{ c: 'Books & Authors', t: 2, q: 'Which author wrote of a castaway who spends twenty-eight years on an island and names a companion after a day of the week?', a: 'Daniel Defoe', d: ['Tobias Smollett', 'Samuel Richardson', 'Henry Fielding'] },
{ c: 'Screen Lines', t: 2, q: 'Which character in Legally Blonde brushes off her admission to Harvard Law with \'What, like it\'s hard?\'', a: 'Elle Woods', d: ['Vivian Kensington', 'Paulette Bonafonte', 'Warner Huntington III'] },

{ c: 'Presidents & Politics', t: 3, q: 'Which educator told a white audience at the 1895 Atlanta exposition to cast down your bucket where you are?', a: 'Booker T. Washington', d: ['W. E. B. Du Bois', 'Marcus Garvey', 'James Weldon Johnson'] },
{ c: 'History & War', t: 3, q: 'Which Athenian historian recorded the argument that the strong do what they can and the weak suffer what they must?', a: 'Thucydides', d: ['Herodotus', 'Xenophon', 'Aristophanes'] },
{ c: 'Science, Letters & Ideas', t: 3, q: 'Which artist submitted a porcelain urinal signed R. Mutt to a New York exhibition in 1917?', a: 'Marcel Duchamp', d: ['Man Ray', 'Francis Picabia', 'Tristan Tzara'] },
{ c: 'Books & Authors', t: 3, q: 'Which character in Twelfth Night reads a forged letter telling him that some have greatness thrust upon them?', a: 'Malvolio', d: ['Sir Toby Belch', 'Orsino', 'Feste'] },
{ c: 'Screen Lines', t: 3, q: 'Which character opens his eyes after a training upload and announces \'I know kung fu\'?', a: 'Neo', d: ['Morpheus', 'Tank', 'Cypher'] },

{ c: 'Presidents & Politics', t: 4, q: 'Which Mississippi organizer told the 1964 Democratic convention credentials committee that she was sick and tired of being sick and tired?', a: 'Fannie Lou Hamer', d: ['Ella Baker', 'Diane Nash', 'Daisy Bates'] },
{ c: 'History & War', t: 4, q: 'Which Jewish commander turned Roman client wrote the eyewitness history of the siege and burning of Jerusalem in AD 70?', a: 'Josephus', d: ['Philo of Alexandria', 'Justus of Tiberias', 'Nicolaus of Damascus'] },
{ c: 'Science, Letters & Ideas', t: 4, q: 'Which designer told a lecture audience to have nothing in their houses that they did not know to be useful or believe to be beautiful?', a: 'William Morris', d: ['Augustus Pugin', 'Charles Rennie Mackintosh', 'Christopher Dresser'] },
{ c: 'Books & Authors', t: 4, q: 'Which novelist wrote a novel narrated by an English butler named Stevens looking back on his years of service?', a: 'Kazuo Ishiguro', d: ['Ian McEwan', 'Julian Barnes', 'Graham Swift'] },
{ c: 'Screen Lines', t: 4, q: 'Which character in Almost Famous tells a lonely young writer over the phone \'I\'m always home. I\'m uncool.\'?', a: 'Lester Bangs', d: ['Penny Lane', 'Russell Hammond', 'William Miller'] },

{ c: 'Presidents & Politics', t: 5, q: 'Which organizer of the 1963 March on Washington said every community needs a group of angelic troublemakers?', a: 'Bayard Rustin', d: ['A. Philip Randolph', 'Roy Wilkins', 'Whitney Young'] },
{ c: 'History & War', t: 5, q: 'Which Greek hostage in Rome, present at the destruction of Carthage, explained Roman success by the mixture of monarchy, aristocracy and democracy in its constitution?', a: 'Polybius', d: ['Posidonius', 'Dionysius of Halicarnassus', 'Appian'] },
{ c: 'Science, Letters & Ideas', t: 5, q: 'Which Victorian critic ended an attack on political economy by declaring that there is no wealth but life?', a: 'John Ruskin', d: ['Thomas Carlyle', 'Matthew Arnold', 'Walter Pater'] },
{ c: 'Books & Authors', t: 5, q: 'Which Hungarian novelist drew on his deportation to Auschwitz as a teenager for a novel about a teenager sent from Budapest to Auschwitz and Buchenwald who cannot explain it when he gets home?', a: 'Imre Kertesz', d: ['Sandor Marai', 'Peter Nadas', 'Magda Szabo'] },
{ c: 'Screen Lines', t: 5, q: 'Which character on The West Wing tells the parable of a man in a hole and a friend who jumps in because he has been down there before and knows the way out?', a: 'Leo McGarry', d: ['Josh Lyman', 'Toby Ziegler', 'Jed Bartlet'] },
],

// ── Day 50 ──────────────────────────────────────────────────────────────
[
{ c: 'Presidents & Politics', t: 1, q: 'Which president was impeached by the House in 1998 and acquitted by the Senate the following year?', a: 'Bill Clinton', d: ['Ronald Reagan', 'Jimmy Carter', 'George H. W. Bush'] },
{ c: 'History & War', t: 1, q: 'Which American cavalry commander led his column to destruction at the Little Bighorn in 1876?', a: 'George Armstrong Custer', d: ['Nelson Miles', 'George Crook', 'Alfred Terry'] },
{ c: 'Science, Letters & Ideas', t: 1, q: 'Which Dutch painter made The Starry Night?', a: 'Vincent van Gogh', d: ['Paul Gauguin', 'Paul Cezanne', 'Edvard Munch'] },
{ c: 'Books & Authors', t: 1, q: 'Which boy is raised by a wolf pack and taught the law of the jungle by a bear and a panther?', a: 'Mowgli', d: ['Baloo', 'Bagheera', 'Akela'] },
{ c: 'Screen Lines', t: 1, q: 'Which character on The Simpsons answers authority with the retort \'Eat my shorts\'?', a: 'Bart Simpson', d: ['Homer Simpson', 'Nelson Muntz', 'Milhouse Van Houten'] },

{ c: 'Presidents & Politics', t: 2, q: 'Which civil rights leader turned candidate rallied his 1988 convention audience with the refrain keep hope alive?', a: 'Jesse Jackson', d: ['Andrew Young', 'John Lewis', 'Ron Brown'] },
{ c: 'History & War', t: 2, q: 'Which Apache leader surrendered in 1886 and years later dictated the story of his life to a schools superintendent?', a: 'Geronimo', d: ['Cochise', 'Mangas Coloradas', 'Victorio'] },
{ c: 'Science, Letters & Ideas', t: 2, q: 'Which Swiss psychiatrist proposed a collective unconscious populated by archetypes?', a: 'Carl Jung', d: ['Alfred Adler', 'Otto Rank', 'Sandor Ferenczi'] },
{ c: 'Books & Authors', t: 2, q: 'Which author sent a ship\'s surgeon among the six-inch people of Lilliput?', a: 'Jonathan Swift', d: ['Daniel Defoe', 'Laurence Sterne', 'Henry Fielding'] },
{ c: 'Screen Lines', t: 2, q: 'Which character greets his neighbors each morning with \'and in case I don\'t see ya, good afternoon, good evening, and good night\'?', a: 'Truman Burbank', d: ['Christof', 'Marlon', 'Meryl Burbank'] },

{ c: 'Presidents & Politics', t: 3, q: 'Which Texas politician told the 1988 Democratic convention that a rival had been born with a silver foot in his mouth?', a: 'Ann Richards', d: ['Barbara Jordan', 'Lloyd Bentsen', 'Jim Wright'] },
{ c: 'History & War', t: 3, q: 'Which Lakota leader said that if the Great Spirit had wanted him to be a white man he would have made him one in the first place?', a: 'Sitting Bull', d: ['Crazy Horse', 'Gall', 'Spotted Tail'] },
{ c: 'Science, Letters & Ideas', t: 3, q: 'Which psychologist tested how far volunteers would go in delivering what they believed were painful shocks when an experimenter told them to continue?', a: 'Stanley Milgram', d: ['Philip Zimbardo', 'Solomon Asch', 'Muzafer Sherif'] },
{ c: 'Books & Authors', t: 3, q: 'Which character in Tolstoy\'s novel of adultery throws herself under a train at a railway station?', a: 'Anna Karenina', d: ['Kitty Shcherbatskaya', 'Dolly Oblonskaya', 'Countess Vronskaya'] },
{ c: 'Screen Lines', t: 3, q: 'Which character in Revenge of the Sith cries out \'You were the Chosen One!\' on the lava banks of Mustafar?', a: 'Obi-Wan Kenobi', d: ['Mace Windu', 'Yoda', 'Padme Amidala'] },

{ c: 'Presidents & Politics', t: 4, q: 'Which member of the 1974 House impeachment inquiry declared that her faith in the Constitution was whole, complete and total?', a: 'Barbara Jordan', d: ['Shirley Chisholm', 'Elizabeth Holtzman', 'Yvonne Brathwaite Burke'] },
{ c: 'History & War', t: 4, q: 'Which Oglala chief is remembered for saying that the whites made many promises but kept only the one to take the land?', a: 'Red Cloud', d: ['Sitting Bull', 'American Horse', 'Two Moons'] },
{ c: 'Science, Letters & Ideas', t: 4, q: 'Which psychologist shared the credit for prospect theory with Amos Tversky and later won a Nobel in economics?', a: 'Daniel Kahneman', d: ['Richard Thaler', 'Gary Becker', 'Robert Shiller'] },
{ c: 'Books & Authors', t: 4, q: 'Which poet observed in a poem about old paintings that suffering happens while someone else is eating or opening a window?', a: 'W. H. Auden', d: ['Stephen Spender', 'Cecil Day-Lewis', 'Louis MacNeice'] },
{ c: 'Screen Lines', t: 4, q: 'Which character on Seinfeld is told by his doctor to shout \'Serenity now!\' whenever his blood pressure goes up?', a: 'Frank Costanza', d: ['George Costanza', 'Cosmo Kramer', 'Estelle Costanza'] },

{ c: 'Presidents & Politics', t: 5, q: 'Which New York candidate ran in 1970 on the slogan that this woman\'s place is in the House, the House of Representatives?', a: 'Bella Abzug', d: ['Shirley Chisholm', 'Geraldine Ferraro', 'Elizabeth Holtzman'] },
{ c: 'History & War', t: 5, q: 'Which Oglala holy man told a poet that the nation\'s hoop was broken and scattered, and the sacred tree was dead?', a: 'Black Elk', d: ['Kicking Bear', 'Short Bull', 'Wovoka'] },
{ c: 'Science, Letters & Ideas', t: 5, q: 'Which social scientist replaced the perfectly rational chooser with a bounded one who settles for good enough?', a: 'Herbert Simon', d: ['Kenneth Arrow', 'Oskar Morgenstern', 'James March'] },
{ c: 'Books & Authors', t: 5, q: 'Which Danish writer opened a memoir of Kenya with the line that she had a farm in Africa, at the foot of the Ngong Hills?', a: 'Isak Dinesen', d: ['Elspeth Huxley', 'Beryl Markham', 'Sigrid Undset'] },
{ c: 'Screen Lines', t: 5, q: 'Which character shouts \'There are four lights!\' at a Cardassian interrogator on Star Trek: The Next Generation?', a: 'Jean-Luc Picard', d: ['William Riker', 'Data', 'Beverly Crusher'] },
],

// ── Day 51 ──────────────────────────────────────────────────────────────
[
{ c: 'Presidents & Politics', t: 1, q: 'Which Georgia peanut farmer and former governor won the 1976 presidential election?', a: 'Jimmy Carter', d: ['Walter Mondale', 'Gerald Ford', 'Hubert Humphrey'] },
{ c: 'History & War', t: 1, q: 'Which Spanish soldier seized the Inca ruler Atahualpa at Cajamarca and toppled his empire?', a: 'Francisco Pizarro', d: ['Diego de Almagro', 'Hernando de Soto', 'Pedro de Valdivia'] },
{ c: 'Science, Letters & Ideas', t: 1, q: 'Which Greek philosopher was hired to tutor the young Alexander of Macedon?', a: 'Aristotle', d: ['Plato', 'Isocrates', 'Theophrastus'] },
{ c: 'Books & Authors', t: 1, q: 'Which playwright wrote both \'King Lear\' and \'The Tempest\'?', a: 'William Shakespeare', d: ['Christopher Marlowe', 'Ben Jonson', 'John Webster'] },
{ c: 'Screen Lines', t: 1, q: 'Which character in Elf declares that the best way to spread Christmas cheer is singing loud for all to hear?', a: 'Buddy', d: ['Walter Hobbs', 'Jovie', 'Papa Elf'] },

{ c: 'Presidents & Politics', t: 2, q: 'Which senator ended a losing 1980 convention speech by saying the dream shall never die?', a: 'Edward Kennedy', d: ['Walter Mondale', 'Gary Hart', 'Frank Church'] },
{ c: 'History & War', t: 2, q: 'Which Florentine navigator gave his name to two continents after letters describing a new world circulated under it?', a: 'Amerigo Vespucci', d: ['Giovanni da Verrazzano', 'John Cabot', 'Sebastian Cabot'] },
{ c: 'Science, Letters & Ideas', t: 2, q: 'Which psychologist arranged human motives in a rising order from food and shelter to self-actualization?', a: 'Abraham Maslow', d: ['Carl Rogers', 'Erik Erikson', 'Gordon Allport'] },
{ c: 'Books & Authors', t: 2, q: 'Which character puts off her suitors for years by weaving a shroud and unpicking it every night?', a: 'Penelope', d: ['Circe', 'Calypso', 'Nausicaa'] },
{ c: 'Screen Lines', t: 2, q: 'Which character in The Incredibles refuses a costume request with the flat verdict \'No capes!\'?', a: 'Edna Mode', d: ['Mirage', 'Helen Parr', 'Violet Parr'] },

{ c: 'Presidents & Politics', t: 3, q: 'Which independent candidate warned in a 1992 debate of a giant sucking sound of jobs going south?', a: 'Ross Perot', d: ['Pat Buchanan', 'Jerry Brown', 'John Anderson'] },
{ c: 'History & War', t: 3, q: 'Which Spanish friar wrote a Short Account of the Destruction of the Indies to shame his own countrymen?', a: 'Bartolome de las Casas', d: ['Juan Gines de Sepulveda', 'Toribio de Benavente', 'Francisco de Vitoria'] },
{ c: 'Science, Letters & Ideas', t: 3, q: 'Which medieval Italian mathematician introduced Hindu-Arabic numerals to European merchants in Liber Abaci?', a: 'Fibonacci', d: ['Luca Pacioli', 'Gerolamo Cardano', 'Nicole Oresme'] },
{ c: 'Books & Authors', t: 3, q: 'Which Italian author wrote the story of a wooden puppet whose nose grows when he lies?', a: 'Carlo Collodi', d: ['Edmondo De Amicis', 'Giovanni Verga', 'Gianni Rodari'] },
{ c: 'Screen Lines', t: 3, q: 'Which character in Finding Nemo leads the chant that fish are friends, not food?', a: 'Bruce', d: ['Marlin', 'Crush', 'Gill'] },

{ c: 'Presidents & Politics', t: 4, q: 'Which nominee closed his 1972 acceptance speech by calling on America to come home?', a: 'George McGovern', d: ['Eugene McCarthy', 'Edmund Muskie', 'Hubert Humphrey'] },
{ c: 'History & War', t: 4, q: 'Which shipwrecked Spaniard wrote of eight years walking from the Gulf coast of Florida to Mexico among the peoples of the interior?', a: 'Alvar Nunez Cabeza de Vaca', d: ['Hernando de Soto', 'Panfilo de Narvaez', 'Francisco Vazquez de Coronado'] },
{ c: 'Science, Letters & Ideas', t: 4, q: 'Whose Latinized name gives us the word algorithm, and whose book on restoring and balancing gives us algebra?', a: 'Al-Khwarizmi', d: ['Omar Khayyam', 'Ibn al-Haytham', 'Al-Biruni'] },
{ c: 'Books & Authors', t: 4, q: 'Which Czech-born novelist wrote about Tomas and Tereza in Prague and the lightness of a life that happens only once?', a: 'Milan Kundera', d: ['Bohumil Hrabal', 'Josef Skvorecky', 'Ivan Klima'] },
{ c: 'Screen Lines', t: 4, q: 'Which character in The Emperor\'s New Groove keeps shrieking \'Pull the lever!\' at her hulking assistant?', a: 'Yzma', d: ['Kuzco', 'Pacha', 'Chicha'] },

{ c: 'Presidents & Politics', t: 5, q: 'Which Arizona congressman and humorist liked to tell colleagues that everything has been said, but not everyone has said it?', a: 'Morris Udall', d: ['Barry Goldwater', 'John Rhodes', 'Stewart Udall'] },
{ c: 'History & War', t: 5, q: 'Which Andean nobleman sent the king of Spain a twelve-hundred-page illustrated letter denouncing colonial misrule?', a: 'Felipe Guaman Poma de Ayala', d: ['Garcilaso de la Vega', 'Titu Cusi Yupanqui', 'Juan de Betanzos'] },
{ c: 'Science, Letters & Ideas', t: 5, q: 'Which Indian mathematician set down the first known rules for calculating with zero and with negative quantities?', a: 'Brahmagupta', d: ['Aryabhata', 'Bhaskara II', 'Madhava of Sangamagrama'] },
{ c: 'Books & Authors', t: 5, q: 'Which American novelist wrote of Port and Kit Moresby driving into the Sahara until the sky no longer shelters them?', a: 'Paul Bowles', d: ['Paul Theroux', 'Bruce Chatwin', 'Patrick Leigh Fermor'] },
{ c: 'Screen Lines', t: 5, q: 'Which character on Buffy the Vampire Slayer tells her sister that the hardest thing in this world is to live in it?', a: 'Buffy Summers', d: ['Willow Rosenberg', 'Rupert Giles', 'Dawn Summers'] },
],

// ── Day 52 ──────────────────────────────────────────────────────────────
[
{ c: 'Presidents & Politics', t: 1, q: 'Which vice president took the oath of office aboard an aircraft at Love Field in November 1963?', a: 'Lyndon B. Johnson', d: ['Hubert Humphrey', 'Richard Nixon', 'Harry S. Truman'] },
{ c: 'History & War', t: 1, q: 'Which English king broke with Rome, dissolved the monasteries and worked his way through six wives?', a: 'Henry VIII', d: ['Edward VI', 'Henry VII', 'James I'] },
{ c: 'Science, Letters & Ideas', t: 1, q: 'Which English scientist set out three laws of motion in the Principia?', a: 'Isaac Newton', d: ['Robert Hooke', 'Edmond Halley', 'Christopher Wren'] },
{ c: 'Books & Authors', t: 1, q: 'Which character narrates the Baker Street stories as the army doctor who shares the lodgings?', a: 'Dr. Watson', d: ['Inspector Lestrade', 'Mycroft Holmes', 'Mrs. Hudson'] },
{ c: 'Screen Lines', t: 1, q: 'Which character wakes on a beach in The Curse of the Black Pearl and wails \'Why is the rum gone?\'', a: 'Jack Sparrow', d: ['Will Turner', 'Elizabeth Swann', 'Hector Barbossa'] },

{ c: 'Presidents & Politics', t: 2, q: 'Which candidate broke the news of Martin Luther King\'s murder to a crowd in Indianapolis in 1968?', a: 'Robert F. Kennedy', d: ['Eugene McCarthy', 'Hubert Humphrey', 'George Romney'] },
{ c: 'History & War', t: 2, q: 'Which English captain is said to have insisted on finishing his game of bowls on Plymouth Hoe before sailing against the Armada?', a: 'Francis Drake', d: ['John Hawkins', 'Martin Frobisher', 'Lord Howard of Effingham'] },
{ c: 'Science, Letters & Ideas', t: 2, q: 'Which British physicist gave his name to the temperature scale that starts at absolute zero?', a: 'Lord Kelvin', d: ['James Joule', 'Anders Celsius', 'Daniel Fahrenheit'] },
{ c: 'Books & Authors', t: 2, q: 'Which author wrote the novel in which a Transylvanian count buys property in England and is hunted by Van Helsing?', a: 'Bram Stoker', d: ['Sheridan Le Fanu', 'Robert Louis Stevenson', 'Arthur Machen'] },
{ c: 'Screen Lines', t: 2, q: 'Which character on Star Trek: The Next Generation gives orders with the phrase \'Make it so\'?', a: 'Jean-Luc Picard', d: ['William Riker', 'Worf', 'Geordi La Forge'] },

{ c: 'Presidents & Politics', t: 3, q: 'Which Tennessee senator framed the central Watergate question of what the president knew and when he knew it?', a: 'Howard Baker', d: ['Sam Ervin', 'Lowell Weicker', 'Peter Rodino'] },
{ c: 'History & War', t: 3, q: 'Which queen told her last parliament in 1601 that though God had raised her high, she counted the glory of her crown to have reigned with their loves?', a: 'Elizabeth I', d: ['Mary I', 'Anne of Denmark', 'Mary, Queen of Scots'] },
{ c: 'Science, Letters & Ideas', t: 3, q: 'Which physicist showed that light is a wave of electric and magnetic fields, uniting the two forces in one theory?', a: 'James Clerk Maxwell', d: ['Michael Faraday', 'Oliver Heaviside', 'Hendrik Lorentz'] },
{ c: 'Books & Authors', t: 3, q: 'Which poet ended a poem by saying that this is the way the world ends, not with a bang but a whimper?', a: 'T. S. Eliot', d: ['Ezra Pound', 'Wilfred Owen', 'Hart Crane'] },
{ c: 'Screen Lines', t: 3, q: 'Which character in Kung Fu Panda says that yesterday is history, tomorrow is a mystery, but today is a gift?', a: 'Master Oogway', d: ['Po', 'Master Shifu', 'Tai Lung'] },

{ c: 'Presidents & Politics', t: 4, q: 'Which ambassador told the Security Council in 1962 that he was prepared to wait for his answer until hell froze over?', a: 'Adlai Stevenson', d: ['Dean Rusk', 'Arthur Goldberg', 'Henry Cabot Lodge Jr.'] },
{ c: 'History & War', t: 4, q: 'Which courtier and explorer called the executioner\'s axe a sharp medicine, but a physician for all diseases?', a: 'Walter Raleigh', d: ['Thomas More', 'Robert Devereux', 'Thomas Wyatt'] },
{ c: 'Science, Letters & Ideas', t: 4, q: 'Which English polymath sent light through two narrow slits in 1801 and produced the fringes that showed it behaves as a wave?', a: 'Thomas Young', d: ['Augustin Fresnel', 'Francois Arago', 'David Brewster'] },
{ c: 'Books & Authors', t: 4, q: 'Which novelist wrote a book built from the black, red, yellow and blue notebooks of a writer named Anna Wulf?', a: 'Doris Lessing', d: ['Iris Murdoch', 'Muriel Spark', 'Elizabeth Taylor'] },
{ c: 'Screen Lines', t: 4, q: 'Which character in Ratatouille writes a review admitting that the new needs friends?', a: 'Anton Ego', d: ['Auguste Gusteau', 'Remy', 'Colette Tatou'] },

{ c: 'Presidents & Politics', t: 5, q: 'Which North Carolina senator chaired the 1973 Watergate hearings while describing himself as just an old country lawyer?', a: 'Sam Ervin', d: ['Herman Talmadge', 'Daniel Inouye', 'Joseph Montoya'] },
{ c: 'History & War', t: 5, q: 'Which queen used her scaffold speech in 1536 to praise the king as a merciful prince and ask the crowd to pray for him?', a: 'Anne Boleyn', d: ['Catherine Howard', 'Elizabeth Barton', 'Margaret Pole'] },
{ c: 'Science, Letters & Ideas', t: 5, q: 'Which American physicist, with Edward Morley, found no sign of the Earth moving through a luminiferous ether?', a: 'Albert Michelson', d: ['Hendrik Lorentz', 'Oliver Lodge', 'George FitzGerald'] },
{ c: 'Books & Authors', t: 5, q: 'Which poet wrote a death fugue that begins with black milk of daybreak drunk at evening?', a: 'Paul Celan', d: ['Nelly Sachs', 'Ingeborg Bachmann', 'Gottfried Benn'] },
{ c: 'Screen Lines', t: 5, q: 'Which character tells his crew \'I aim to misbehave\' in the 2005 film Serenity?', a: 'Malcolm Reynolds', d: ['Zoe Washburne', 'Jayne Cobb', 'Simon Tam'] },
],

// ── Day 53 ──────────────────────────────────────────────────────────────
[
{ c: 'Presidents & Politics', t: 1, q: 'Which victor of the battle of New Orleans later became president and appears on the twenty-dollar bill?', a: 'Andrew Jackson', d: ['William Henry Harrison', 'Zachary Taylor', 'Winfield Scott'] },
{ c: 'History & War', t: 1, q: 'Which Portuguese captain opened the sea route around Africa to India in 1498?', a: 'Vasco da Gama', d: ['Bartolomeu Dias', 'Pedro Alvares Cabral', 'Afonso de Albuquerque'] },
{ c: 'Science, Letters & Ideas', t: 1, q: 'Which American astronomer showed that distant galaxies are rushing away from us, and has an orbiting telescope named for him?', a: 'Edwin Hubble', d: ['Harlow Shapley', 'Percival Lowell', 'Vesto Slipher'] },
{ c: 'Books & Authors', t: 1, q: 'Which hobbit carries the One Ring from the Shire to the fires of Mount Doom?', a: 'Frodo Baggins', d: ['Samwise Gamgee', 'Meriadoc Brandybuck', 'Peregrin Took'] },
{ c: 'Screen Lines', t: 1, q: 'Which character in the 2001 DreamWorks fairy tale tells a donkey that ogres are like onions because they have layers?', a: 'Shrek', d: ['Lord Farquaad', 'Princess Fiona', 'The Gingerbread Man'] },

{ c: 'Presidents & Politics', t: 2, q: 'Which president told Congress in 1823 that the Americas were closed to further European colonization?', a: 'James Monroe', d: ['John Quincy Adams', 'James Madison', 'Andrew Jackson'] },
{ c: 'History & War', t: 2, q: 'Whose voyage journals chart New Zealand and eastern Australia before he was killed on a Hawaiian beach?', a: 'James Cook', d: ['William Bligh', 'George Vancouver', 'Abel Tasman'] },
{ c: 'Science, Letters & Ideas', t: 2, q: 'Which Italian inventor sent the first wireless signal across the Atlantic in 1901?', a: 'Guglielmo Marconi', d: ['Nikola Tesla', 'Oliver Lodge', 'Reginald Fessenden'] },
{ c: 'Books & Authors', t: 2, q: 'Which author wrote the frontier books about a family crossing the prairie in a covered wagon to build a little house?', a: 'Laura Ingalls Wilder', d: ['Louisa May Alcott', 'Willa Cather', 'Kate Douglas Wiggin'] },
{ c: 'Screen Lines', t: 2, q: 'Which character in Up introduces himself to strangers by saying \'I have just met you, and I love you\'?', a: 'Dug', d: ['Russell', 'Carl Fredricksen', 'Charles Muntz'] },

{ c: 'Presidents & Politics', t: 3, q: 'Which governor of Texas was removed from office in 1861 for refusing to swear loyalty to the Confederacy?', a: 'Sam Houston', d: ['Stephen F. Austin', 'Mirabeau Lamar', 'Anson Jones'] },
{ c: 'History & War', t: 3, q: 'Which missionary explorer vowed that he would open a path into the African interior or perish?', a: 'David Livingstone', d: ['Richard Burton', 'John Hanning Speke', 'Samuel Baker'] },
{ c: 'Science, Letters & Ideas', t: 3, q: 'Which musician turned astronomer found a new planet beyond Saturn with a homemade telescope in 1781?', a: 'William Herschel', d: ['Charles Messier', 'Johann Bode', 'Nevil Maskelyne'] },
{ c: 'Books & Authors', t: 3, q: 'Which poet wrote \'Daddy\' and \'Lady Lazarus\' in the last months before her death in 1963?', a: 'Sylvia Plath', d: ['Anne Sexton', 'Adrienne Rich', 'Denise Levertov'] },
{ c: 'Screen Lines', t: 3, q: 'Which character in Batman Begins asks his son why we fall, and answers that it is so we can learn to pick ourselves up?', a: 'Thomas Wayne', d: ['Alfred Pennyworth', 'Ra\'s al Ghul', 'Lucius Fox'] },

{ c: 'Presidents & Politics', t: 4, q: 'Which secretary of state said in an 1821 address that America goes not abroad in search of monsters to destroy?', a: 'John Quincy Adams', d: ['Henry Clay', 'Daniel Webster', 'Martin Van Buren'] },
{ c: 'History & War', t: 4, q: 'Which American expedition leader wrote \'Ocean in view! O! the joy!\' in his journal in November 1805?', a: 'William Clark', d: ['Meriwether Lewis', 'Zebulon Pike', 'John Colter'] },
{ c: 'Science, Letters & Ideas', t: 4, q: 'Which American built a private Arizona observatory and insisted that Mars was crossed by canals dug by a dying civilization?', a: 'Percival Lowell', d: ['Asaph Hall', 'Edward Emerson Barnard', 'William Henry Pickering'] },
{ c: 'Books & Authors', t: 4, q: 'Which character in Sense and Sensibility keeps a four-year secret engagement to Lucy Steele?', a: 'Edward Ferrars', d: ['Colonel Brandon', 'John Willoughby', 'Robert Ferrars'] },
{ c: 'Screen Lines', t: 4, q: 'Which character in O Brother, Where Art Thou? insists on his pomade because he is a Dapper Dan man?', a: 'Ulysses Everett McGill', d: ['Delmar O\'Donnell', 'Pete Hogwallop', 'Big Dan Teague'] },

{ c: 'Presidents & Politics', t: 5, q: 'Which Virginia congressman said of a rival that he rowed to his object with muffled oars?', a: 'John Randolph of Roanoke', d: ['John C. Calhoun', 'Thomas Hart Benton', 'William Crawford'] },
{ c: 'History & War', t: 5, q: 'Which Norwegian deliberately froze his ship Fram into the pack ice to ride the polar current across the Arctic?', a: 'Fridtjof Nansen', d: ['Otto Sverdrup', 'Salomon Andree', 'Adolf Erik Nordenskiold'] },
{ c: 'Science, Letters & Ideas', t: 5, q: 'Which astronomer found that the brighter a Cepheid variable, the longer its period, giving astronomers a yardstick for the universe?', a: 'Henrietta Swan Leavitt', d: ['Annie Jump Cannon', 'Antonia Maury', 'Williamina Fleming'] },
{ c: 'Books & Authors', t: 5, q: 'Which Egyptian novelist won the Nobel Prize for a trilogy set in the alleys of Cairo between the wars?', a: 'Naguib Mahfouz', d: ['Tayeb Salih', 'Yusuf Idris', 'Taha Hussein'] },
{ c: 'Screen Lines', t: 5, q: 'Which character on Arrested Development asks what a banana could possibly cost, guessing ten dollars?', a: 'Lucille Bluth', d: ['Michael Bluth', 'Gob Bluth', 'Lindsay Bluth Funke'] },
],

// ── Day 54 ──────────────────────────────────────────────────────────────
[
{ c: 'Presidents & Politics', t: 1, q: 'Which president joins Washington, Jefferson and Lincoln on the carved face of Mount Rushmore?', a: 'Theodore Roosevelt', d: ['Ulysses S. Grant', 'Andrew Jackson', 'Woodrow Wilson'] },
{ c: 'History & War', t: 1, q: 'Which Soviet city held out through a German siege of nearly nine hundred days?', a: 'Leningrad', d: ['Kiev', 'Minsk', 'Smolensk'] },
{ c: 'Science, Letters & Ideas', t: 1, q: 'Which French thinker gave his name to the coordinate system of x and y axes?', a: 'Rene Descartes', d: ['Pierre de Fermat', 'Blaise Pascal', 'Marin Mersenne'] },
{ c: 'Books & Authors', t: 1, q: 'Which author created a boy who refuses to grow up and a fairy named Tinker Bell?', a: 'J. M. Barrie', d: ['Kenneth Grahame', 'E. Nesbit', 'Hugh Lofting'] },
{ c: 'Screen Lines', t: 1, q: 'Which character in the first Austin Powers film holds the world to ransom for one million dollars?', a: 'Dr. Evil', d: ['Austin Powers', 'Number 2', 'Scott Evil'] },

{ c: 'Presidents & Politics', t: 2, q: 'Which former president went on to serve as chief justice of the United States?', a: 'William Howard Taft', d: ['John Quincy Adams', 'Grover Cleveland', 'Benjamin Harrison'] },
{ c: 'History & War', t: 2, q: 'Which Soviet marshal took the surrender of Berlin in May 1945?', a: 'Georgy Zhukov', d: ['Ivan Konev', 'Konstantin Rokossovsky', 'Semyon Timoshenko'] },
{ c: 'Science, Letters & Ideas', t: 2, q: 'Which Victorian designed mechanical calculating engines that were never completed in his lifetime?', a: 'Charles Babbage', d: ['Herman Hollerith', 'William Stanley Jevons', 'Percy Ludgate'] },
{ c: 'Books & Authors', t: 2, q: 'Which author wrote about an orphan sent to a Yorkshire manor who finds a walled garden behind a locked door?', a: 'Frances Hodgson Burnett', d: ['E. Nesbit', 'Johanna Spyri', 'Susan Coolidge'] },
{ c: 'Screen Lines', t: 2, q: 'Which character on The Simpsons greets everyone over the fence with a cheerful \'Okily dokily\'?', a: 'Ned Flanders', d: ['Moe Szyslak', 'Apu Nahasapeemapetilon', 'Barney Gumble'] },

{ c: 'Presidents & Politics', t: 3, q: 'Which president appointed the interior secretary later jailed for secretly leasing the Teapot Dome oil reserves?', a: 'Warren G. Harding', d: ['Calvin Coolidge', 'Woodrow Wilson', 'Herbert Hoover'] },
{ c: 'History & War', t: 3, q: 'Which Soviet foreign minister announced the German invasion by radio in 1941, promising that the cause was just and victory would be theirs?', a: 'Vyacheslav Molotov', d: ['Joseph Stalin', 'Andrei Vyshinsky', 'Maxim Litvinov'] },
{ c: 'Science, Letters & Ideas', t: 3, q: 'Which mathematician settled the puzzle of the seven bridges of Konigsberg and started graph theory doing it?', a: 'Leonhard Euler', d: ['Joseph-Louis Lagrange', 'Daniel Bernoulli', 'Jean le Rond d\'Alembert'] },
{ c: 'Books & Authors', t: 3, q: 'Which American poet wrote both \'The Song of Hiawatha\' and \'Evangeline\'?', a: 'Henry Wadsworth Longfellow', d: ['John Greenleaf Whittier', 'James Russell Lowell', 'William Cullen Bryant'] },
{ c: 'Screen Lines', t: 3, q: 'Which character in Mean Girls snaps that a friend should stop trying to make fetch happen?', a: 'Regina George', d: ['Cady Heron', 'Karen Smith', 'Janis Ian'] },

{ c: 'Presidents & Politics', t: 4, q: 'Which Wisconsin progressive defended the right to criticize the government in wartime in a 1917 Senate speech?', a: 'Robert La Follette', d: ['George Norris', 'Hiram Johnson', 'William Borah'] },
{ c: 'History & War', t: 4, q: 'Which Soviet general defending Stalingrad described his method as hugging the enemy so closely that their aircraft could not bomb him?', a: 'Vasily Chuikov', d: ['Andrei Yeryomenko', 'Alexander Vasilevsky', 'Rodion Malinovsky'] },
{ c: 'Science, Letters & Ideas', t: 4, q: 'Which mathematician constructed a regular seventeen-sided polygon as a teenager and asked for it to be cut on his tombstone?', a: 'Carl Friedrich Gauss', d: ['Niels Henrik Abel', 'Sophie Germain', 'Adrien-Marie Legendre'] },
{ c: 'Books & Authors', t: 4, q: 'Which novelist wrote of Charles Ryder, Sebastian Flyte and a teddy bear named Aloysius at a great English house?', a: 'Evelyn Waugh', d: ['Anthony Powell', 'Graham Greene', 'Nancy Mitford'] },
{ c: 'Screen Lines', t: 4, q: 'Which character in Zoolander protests that he feels like he is taking crazy pills?', a: 'Mugatu', d: ['Derek Zoolander', 'Hansel', 'Matilda Jeffries'] },

{ c: 'Presidents & Politics', t: 5, q: 'Which Tammany ward boss defended honest graft by saying he seen his opportunities and he took them?', a: 'George Washington Plunkitt', d: ['William Tweed', 'Richard Croker', 'Charles Murphy'] },
{ c: 'History & War', t: 5, q: 'Which chief designer of the Soviet rocket program was kept anonymous by his own government while his launches made headlines?', a: 'Sergei Korolev', d: ['Valentin Glushko', 'Mstislav Keldysh', 'Vladimir Chelomey'] },
{ c: 'Science, Letters & Ideas', t: 5, q: 'Which mathematician conjectured in 1859 that every nontrivial zero of the zeta function lies on one vertical line?', a: 'Bernhard Riemann', d: ['Pafnuty Chebyshev', 'Jacques Hadamard', 'Charles de la Vallee Poussin'] },
{ c: 'Books & Authors', t: 5, q: 'Which Irish novelist wrote a comic novel whose narrator is writing a novel about a novelist whose characters rebel against him?', a: 'Flann O\'Brien', d: ['Brian Moore', 'Sean O\'Faolain', 'Liam O\'Flaherty'] },
{ c: 'Screen Lines', t: 5, q: 'Which character on Seinfeld tells a rapt audience that the sea was angry that day, like an old man trying to send back soup at a deli?', a: 'George Costanza', d: ['Cosmo Kramer', 'Elaine Benes', 'Newman'] },
],

// ── Day 55 ──────────────────────────────────────────────────────────────
[
{ c: 'Presidents & Politics', t: 1, q: 'Who became the first woman to serve as prime minister of the United Kingdom, taking office in 1979?', a: 'Margaret Thatcher', d: ['Barbara Castle', 'Shirley Williams', 'Nancy Astor'] },
{ c: 'History & War', t: 1, q: 'Which general presided over the Japanese surrender ceremony on the deck of the USS Missouri in 1945?', a: 'Douglas MacArthur', d: ['Jonathan Wainwright', 'Walter Krueger', 'Robert Eichelberger'] },
{ c: 'Science, Letters & Ideas', t: 1, q: 'Which scientist was the first woman awarded a Nobel Prize?', a: 'Marie Curie', d: ['Lise Meitner', 'Emmy Noether', 'Irene Joliot-Curie'] },
{ c: 'Books & Authors', t: 1, q: 'Which character in Wonderland fades away until nothing is left but his grin?', a: 'The Cheshire Cat', d: ['The March Hare', 'The Dormouse', 'The Caterpillar'] },
{ c: 'Screen Lines', t: 1, q: 'Which character leads the song \'I Just Can\'t Wait to Be King\' in The Lion King?', a: 'Simba', d: ['Nala', 'Zazu', 'Scar'] },

{ c: 'Presidents & Politics', t: 2, q: 'Which candidate conceded the 2000 presidential election the day after the Supreme Court ended the Florida recount?', a: 'Al Gore', d: ['Joe Lieberman', 'John Kerry', 'Bill Bradley'] },
{ c: 'History & War', t: 2, q: 'Which Japanese general was prime minister at the time of Pearl Harbor and was hanged as a war criminal in 1948?', a: 'Hideki Tojo', d: ['Isoroku Yamamoto', 'Fumimaro Konoe', 'Kantaro Suzuki'] },
{ c: 'Science, Letters & Ideas', t: 2, q: 'Which naturalist narrated the BBC series Life on Earth?', a: 'David Attenborough', d: ['Peter Scott', 'Jacques Cousteau', 'Gerald Durrell'] },
{ c: 'Books & Authors', t: 2, q: 'Which character rings the bells of Notre-Dame and carries Esmeralda into sanctuary?', a: 'Quasimodo', d: ['Claude Frollo', 'Pierre Gringoire', 'Captain Phoebus'] },
{ c: 'Screen Lines', t: 2, q: 'Which character in Harry Potter and the Chamber of Secrets is handed a sock, announces that he has been given clothes, and is free?', a: 'Dobby', d: ['Kreacher', 'Winky', 'Griphook'] },

{ c: 'Presidents & Politics', t: 3, q: 'Which prime minister assured viewers after the 1967 devaluation that the pound in their pocket had not been devalued?', a: 'Harold Wilson', d: ['James Callaghan', 'Edward Heath', 'Roy Jenkins'] },
{ c: 'History & War', t: 3, q: 'Which general told his new desert command in 1942 that they would stand and fight there, and that there would be no further withdrawal?', a: 'Bernard Montgomery', d: ['Claude Auchinleck', 'Harold Alexander', 'Archibald Wavell'] },
{ c: 'Science, Letters & Ideas', t: 3, q: 'Which German physicist introduced the quantum, the idea that energy is emitted only in discrete packets?', a: 'Max Planck', d: ['Wilhelm Wien', 'Ludwig Boltzmann', 'Hendrik Lorentz'] },
{ c: 'Books & Authors', t: 3, q: 'Which character in Vanity Fair climbs through society without money, family or scruples?', a: 'Becky Sharp', d: ['Amelia Sedley', 'Lady Jane Sheepshanks', 'Miss Crawley'] },
{ c: 'Screen Lines', t: 3, q: 'Which character in The Green Mile introduces himself by saying his name is like the drink, only not spelled the same?', a: 'John Coffey', d: ['Paul Edgecomb', 'Brutus Howell', 'Eduard Delacroix'] },

{ c: 'Presidents & Politics', t: 4, q: 'Which prime minister called a 1973 tax avoidance case the unacceptable face of capitalism?', a: 'Edward Heath', d: ['Harold Macmillan', 'Alec Douglas-Home', 'Reginald Maudling'] },
{ c: 'History & War', t: 4, q: 'Which German chief of staff left a memorandum arguing that an invasion of France must sweep through the Low Countries with an overwhelming right wing?', a: 'Alfred von Schlieffen', d: ['Helmuth von Moltke the Younger', 'Erich von Falkenhayn', 'Colmar von der Goltz'] },
{ c: 'Science, Letters & Ideas', t: 4, q: 'Which physicist found that uranium salts fogged a photographic plate in a closed drawer, revealing a new kind of radiation?', a: 'Henri Becquerel', d: ['Wilhelm Rontgen', 'Frederick Soddy', 'Paul Villard'] },
{ c: 'Books & Authors', t: 4, q: 'Which Victorian novelist wrote the sensation novel that opens with a woman dressed all in white stopping a man on a moonlit road?', a: 'Wilkie Collins', d: ['Sheridan Le Fanu', 'Mary Elizabeth Braddon', 'Charles Reade'] },
{ c: 'Screen Lines', t: 4, q: 'Which character in Miracle tells his hockey squad that great moments are born from great opportunity?', a: 'Herb Brooks', d: ['Craig Patrick', 'Mike Eruzione', 'Jim Craig'] },

{ c: 'Presidents & Politics', t: 5, q: 'Which chancellor of the exchequer compared an attack from Geoffrey Howe to being savaged by a dead sheep?', a: 'Denis Healey', d: ['Roy Jenkins', 'James Callaghan', 'Tony Benn'] },
{ c: 'History & War', t: 5, q: 'Which German general called the eighth of August, 1918 the black day of his army?', a: 'Erich Ludendorff', d: ['Paul von Hindenburg', 'Max Hoffmann', 'Wilhelm Groener'] },
{ c: 'Science, Letters & Ideas', t: 5, q: 'Which physicist closed his Nobel lecture wondering whether radium might prove very dangerous in criminal hands?', a: 'Pierre Curie', d: ['Henri Becquerel', 'Frederick Soddy', 'Ernest Rutherford'] },
{ c: 'Books & Authors', t: 5, q: 'Which Norwegian novelist wrote a book narrated by a starving young writer wandering the streets of Kristiania?', a: 'Knut Hamsun', d: ['Sigrid Undset', 'Jonas Lie', 'Alexander Kielland'] },
{ c: 'Screen Lines', t: 5, q: 'Which character on Battlestar Galactica ends his addresses to the fleet with \'So say we all\'?', a: 'William Adama', d: ['Laura Roslin', 'Kara Thrace', 'Saul Tigh'] },
],

// ── Day 56 ──────────────────────────────────────────────────────────────
[
{ c: 'Presidents & Politics', t: 1, q: 'Which opposition leader won a landslide in the 1997 British general election and became prime minister at 43?', a: 'Tony Blair', d: ['Gordon Brown', 'Neil Kinnock', 'John Smith'] },
{ c: 'History & War', t: 1, q: 'Which king of Macedon destroyed the Persian empire of Darius III and reached the rivers of India?', a: 'Alexander the Great', d: ['Philip II of Macedon', 'Antigonus I', 'Seleucus I'] },
{ c: 'Science, Letters & Ideas', t: 1, q: 'Which Russian physiologist trained dogs to salivate at a signal that predicted food?', a: 'Ivan Pavlov', d: ['Ivan Sechenov', 'Vladimir Bekhterev', 'Ilya Mechnikov'] },
{ c: 'Books & Authors', t: 1, q: 'Which detective is the elderly spinster of St. Mary Mead who solves murders by comparing them to village gossip?', a: 'Miss Marple', d: ['Hercule Poirot', 'Tuppence Beresford', 'Ariadne Oliver'] },
{ c: 'Screen Lines', t: 1, q: 'Which character in Clueless dismisses an unwanted suggestion with the single word \'As if!\'?', a: 'Cher Horowitz', d: ['Dionne Davenport', 'Tai Frasier', 'Josh Lucas'] },

{ c: 'Presidents & Politics', t: 2, q: 'Which minister of health launched the National Health Service in July 1948?', a: 'Aneurin Bevan', d: ['Herbert Morrison', 'Ernest Bevin', 'Hugh Dalton'] },
{ c: 'History & War', t: 2, q: 'Which Roman general beat Hannibal at Zama and took a name from the province he had conquered?', a: 'Scipio Africanus', d: ['Fabius Maximus', 'Marcellus', 'Aemilius Paullus'] },
{ c: 'Science, Letters & Ideas', t: 2, q: 'Which Swiss psychologist described children passing through fixed stages of reasoning as they grow?', a: 'Jean Piaget', d: ['Lev Vygotsky', 'Erik Erikson', 'Jerome Bruner'] },
{ c: 'Books & Authors', t: 2, q: 'Which character bellows his wife\'s name up the stairs of a New Orleans tenement?', a: 'Stanley Kowalski', d: ['Harold Mitchell', 'Steve Hubbell', 'Pablo Gonzales'] },
{ c: 'Screen Lines', t: 2, q: 'Which character on the Nickelodeon cartoon set in Bikini Bottom leaps up shouting \'I\'m ready! I\'m ready!\'?', a: 'SpongeBob SquarePants', d: ['Patrick Star', 'Squidward Tentacles', 'Eugene Krabs'] },

{ c: 'Presidents & Politics', t: 3, q: 'Which prime minister told the South African parliament in 1960 that a wind of change was blowing through the continent?', a: 'Harold Macmillan', d: ['Anthony Eden', 'Alec Douglas-Home', 'Harold Wilson'] },
{ c: 'History & War', t: 3, q: 'Which 216 BC battle saw a Roman army of some eighty thousand surrounded and destroyed in a single afternoon?', a: 'Cannae', d: ['Lake Trasimene', 'The Trebia', 'The Metaurus'] },
{ c: 'Science, Letters & Ideas', t: 3, q: 'Which behaviorist studied reinforcement by putting rats and pigeons in a box of his own design?', a: 'B. F. Skinner', d: ['John B. Watson', 'Edward Thorndike', 'Clark Hull'] },
{ c: 'Books & Authors', t: 3, q: 'Which poet answered her doubters with the refrain that still, like dust, she will rise?', a: 'Maya Angelou', d: ['Nikki Giovanni', 'Gwendolyn Brooks', 'Lucille Clifton'] },
{ c: 'Screen Lines', t: 3, q: 'Which character on Arrested Development groans \'I\'ve made a huge mistake\' after every scheme collapses?', a: 'Gob Bluth', d: ['Michael Bluth', 'Buster Bluth', 'Tobias Funke'] },

{ c: 'Presidents & Politics', t: 4, q: 'Which prime minister launched a 1993 campaign under the phrase back to basics?', a: 'John Major', d: ['Michael Heseltine', 'Kenneth Clarke', 'Douglas Hurd'] },
{ c: 'History & War', t: 4, q: 'Which Greek biographer records that Caesar wept before a statue in Spain because he had done nothing at an age when Alexander had conquered the world?', a: 'Plutarch', d: ['Suetonius', 'Appian', 'Cassius Dio'] },
{ c: 'Science, Letters & Ideas', t: 4, q: 'Which linguist wrote the sentence colorless green ideas sleep furiously to show that grammar is independent of meaning?', a: 'Noam Chomsky', d: ['Roman Jakobson', 'Leonard Bloomfield', 'Zellig Harris'] },
{ c: 'Books & Authors', t: 4, q: 'Which character in Catch-22 is the mess officer who turns the war into a private trading syndicate?', a: 'Milo Minderbinder', d: ['Colonel Cathcart', 'Major Major', 'Chaplain Tappman'] },
{ c: 'Screen Lines', t: 4, q: 'Which character in My Cousin Vinny is asked by a judge to explain what a yute is?', a: 'Vinny Gambini', d: ['Mona Lisa Vito', 'Stan Rothenstein', 'Bill Gambini'] },

{ c: 'Presidents & Politics', t: 5, q: 'Which president of the European Commission called in a 1979 lecture for breaking the mold of British politics?', a: 'Roy Jenkins', d: ['David Owen', 'Shirley Williams', 'William Rodgers'] },
{ c: 'History & War', t: 5, q: 'Which Roman politician turned historian wrote the surviving monographs on the Catilinarian conspiracy and the war with Jugurtha?', a: 'Sallust', d: ['Velleius Paterculus', 'Quintus Curtius Rufus', 'Cornelius Nepos'] },
{ c: 'Science, Letters & Ideas', t: 5, q: 'Which sociologist analyzed everyday life as a stage performance with a front region and a back region?', a: 'Erving Goffman', d: ['Howard Becker', 'Harold Garfinkel', 'Talcott Parsons'] },
{ c: 'Books & Authors', t: 5, q: 'Which Albanian novelist wrote of an Italian general returning after twenty years to dig up his war dead?', a: 'Ismail Kadare', d: ['Milorad Pavic', 'Danilo Kis', 'Miroslav Krleza'] },
{ c: 'Screen Lines', t: 5, q: 'Which character in Gattaca explains that he beat his brother at swimming because he never saved anything for the swim back?', a: 'Vincent Freeman', d: ['Anton Freeman', 'Jerome Morrow', 'Irene Cassini'] },
],

// ── Day 57 ──────────────────────────────────────────────────────────────
[
{ c: 'Presidents & Politics', t: 1, q: 'Which Arizona senator was the Republican nominee beaten by Barack Obama in the 2008 election?', a: 'John McCain', d: ['Mitt Romney', 'Bob Dole', 'Rudy Giuliani'] },
{ c: 'History & War', t: 1, q: 'Which tsar built a new capital on the Baltic marshes and taxed his noblemen for keeping their beards?', a: 'Peter the Great', d: ['Ivan the Terrible', 'Alexander I', 'Nicholas I'] },
{ c: 'Science, Letters & Ideas', t: 1, q: 'Which Spanish surrealist painted the limp watches of The Persistence of Memory?', a: 'Salvador Dali', d: ['Rene Magritte', 'Joan Miro', 'Max Ernst'] },
{ c: 'Books & Authors', t: 1, q: 'Which character is the great lion who gives his life on the Stone Table and returns?', a: 'Aslan', d: ['Mr. Tumnus', 'Reepicheep', 'Puddleglum'] },
{ c: 'Screen Lines', t: 1, q: 'Which character signs off the evening news with \'You stay classy, San Diego\'?', a: 'Ron Burgundy', d: ['Champ Kind', 'Brian Fantana', 'Veronica Corningstone'] },

{ c: 'Presidents & Politics', t: 2, q: 'Which candidate became the first Socialist elected president of the French Fifth Republic, in 1981?', a: 'Francois Mitterrand', d: ['Michel Rocard', 'Valery Giscard d\'Estaing', 'Georges Pompidou'] },
{ c: 'History & War', t: 2, q: 'Which empress of Russia corresponded with Voltaire and pushed her frontier to the Black Sea?', a: 'Catherine the Great', d: ['Elizabeth of Russia', 'Anna of Russia', 'Maria Feodorovna'] },
{ c: 'Science, Letters & Ideas', t: 2, q: 'Which French sculptor cast the seated brooding figure known as The Thinker?', a: 'Auguste Rodin', d: ['Aristide Maillol', 'Constantin Brancusi', 'Frederic Auguste Bartholdi'] },
{ c: 'Books & Authors', t: 2, q: 'Which author wrote the warning that it does not do to dwell on dreams and forget to live?', a: 'J. K. Rowling', d: ['Philip Pullman', 'Diana Wynne Jones', 'Eoin Colfer'] },
{ c: 'Screen Lines', t: 2, q: 'Which character says that it is our choices that show what we truly are, far more than our abilities?', a: 'Albus Dumbledore', d: ['Minerva McGonagall', 'Rubeus Hagrid', 'Remus Lupin'] },

{ c: 'Presidents & Politics', t: 3, q: 'Which marshal of France headed the collaborationist government based at Vichy from 1940?', a: 'Philippe Petain', d: ['Pierre Laval', 'Maxime Weygand', 'Ferdinand Foch'] },
{ c: 'History & War', t: 3, q: 'Which Russian commander gave up Moscow in 1812 with the argument that losing the city was not the same as losing the country?', a: 'Mikhail Kutuzov', d: ['Barclay de Tolly', 'Pyotr Bagration', 'Levin von Bennigsen'] },
{ c: 'Science, Letters & Ideas', t: 3, q: 'Which photographer gave English the phrase the decisive moment through the title of his 1952 book of pictures?', a: 'Henri Cartier-Bresson', d: ['Robert Capa', 'Brassai', 'Robert Doisneau'] },
{ c: 'Books & Authors', t: 3, q: 'Which novelist wrote a medieval murder mystery in which a Franciscan investigates deaths in a monastery library?', a: 'Umberto Eco', d: ['Leonardo Sciascia', 'Primo Levi', 'Dino Buzzati'] },
{ c: 'Screen Lines', t: 3, q: 'Which character in Cool Runnings starts the chant \'Feel the rhythm, feel the rhyme, get on up, it\'s bobsled time\'?', a: 'Sanka Coffie', d: ['Derice Bannock', 'Junior Bevil', 'Irv Blitzer'] },

{ c: 'Presidents & Politics', t: 4, q: 'Which foreign minister proposed in 1950 that Europe would not be made all at once, or according to a single plan?', a: 'Robert Schuman', d: ['Paul-Henri Spaak', 'Alcide De Gasperi', 'Konrad Adenauer'] },
{ c: 'History & War', t: 4, q: 'Which king, called the Lion of the North, was killed leading a charge in the fog at Lutzen in 1632?', a: 'Gustavus Adolphus', d: ['Christian IV of Denmark', 'Charles X Gustav', 'Frederick V of the Palatinate'] },
{ c: 'Science, Letters & Ideas', t: 4, q: 'Which photographer of the American West insisted that you do not take a photograph, you make it?', a: 'Ansel Adams', d: ['Edward Weston', 'Alfred Stieglitz', 'Paul Strand'] },
{ c: 'Books & Authors', t: 4, q: 'Which poet wrote of waking at four in soundless dark to find unresting death a whole day nearer?', a: 'Philip Larkin', d: ['Ted Hughes', 'Thom Gunn', 'Donald Davie'] },
{ c: 'Screen Lines', t: 4, q: 'Which character in Meet the Parents warns his daughter\'s boyfriend that he is now outside the circle of trust?', a: 'Jack Byrnes', d: ['Greg Focker', 'Pam Byrnes', 'Dina Byrnes'] },

{ c: 'Presidents & Politics', t: 5, q: 'Which architect of the common market wrote that Europe would be forged in crises and would be the sum of the solutions adopted for them?', a: 'Jean Monnet', d: ['Walter Hallstein', 'Robert Marjolin', 'Etienne Hirsch'] },
{ c: 'History & War', t: 5, q: 'Which tsar described the Ottoman Empire to a British ambassador in 1853 as a sick man on their hands?', a: 'Nicholas I', d: ['Alexander II', 'Alexander I', 'Paul I'] },
{ c: 'Science, Letters & Ideas', t: 5, q: 'Which Roman architect laid down that a building must have firmness, commodity and delight?', a: 'Vitruvius', d: ['Frontinus', 'Apollodorus of Damascus', 'Leon Battista Alberti'] },
{ c: 'Books & Authors', t: 5, q: 'Which Yiddish writer told the story of a baker in Frampol who is mocked by the whole village and believes everything he is told?', a: 'Isaac Bashevis Singer', d: ['Sholem Aleichem', 'I. L. Peretz', 'Chaim Grade'] },
{ c: 'Screen Lines', t: 5, q: 'Which character in The Iron Giant tells the robot that you are who you choose to be?', a: 'Hogarth Hughes', d: ['The Iron Giant', 'Dean McCoppin', 'Kent Mansley'] },
],

// ── Day 58 ──────────────────────────────────────────────────────────────
[
{ c: 'Presidents & Politics', t: 1, q: 'Who became the first woman to serve as chancellor of Germany, taking office in 2005?', a: 'Angela Merkel', d: ['Ursula von der Leyen', 'Annegret Kramp-Karrenbauer', 'Andrea Nahles'] },
{ c: 'History & War', t: 1, q: 'Which ruler unified China, standardized its script and was buried with an army of terracotta soldiers?', a: 'Qin Shi Huang', d: ['Emperor Wu of Han', 'Kublai Khan', 'Emperor Taizong of Tang'] },
{ c: 'Science, Letters & Ideas', t: 1, q: 'Which naturalist applied his theory to human beings in a later book called The Descent of Man?', a: 'Charles Darwin', d: ['Thomas Huxley', 'Herbert Spencer', 'Alfred Russel Wallace'] },
{ c: 'Books & Authors', t: 1, q: 'Which author wrote about a green creature in a mountain cave who sets out to steal Christmas from Whoville?', a: 'Dr. Seuss', d: ['Shel Silverstein', 'Richard Scarry', 'Stan Berenstain'] },
{ c: 'Screen Lines', t: 1, q: 'Which character on Friends defends himself again and again by shouting \'We were on a break!\'?', a: 'Ross Geller', d: ['Rachel Green', 'Chandler Bing', 'Monica Geller'] },

{ c: 'Presidents & Politics', t: 2, q: 'Which Cologne mayor became the first chancellor of the West German federal republic in 1949?', a: 'Konrad Adenauer', d: ['Ludwig Erhard', 'Kurt Schumacher', 'Theodor Heuss'] },
{ c: 'History & War', t: 2, q: 'Which British queen led the revolt that burned Roman London to the ground around AD 60?', a: 'Boudica', d: ['Cartimandua', 'Aethelflaed', 'Gwenllian'] },
{ c: 'Science, Letters & Ideas', t: 2, q: 'Which English chemist found that the pressure of a trapped gas rises as its volume falls?', a: 'Robert Boyle', d: ['Evangelista Torricelli', 'Jacques Charles', 'Otto von Guericke'] },
{ c: 'Books & Authors', t: 2, q: 'Which boy in Lord of the Flies blows the conch to call the others to assembly and is elected chief?', a: 'Ralph', d: ['Jack Merridew', 'Piggy', 'Simon'] },
{ c: 'Screen Lines', t: 2, q: 'Which character in Toy Story finally snaps at Buzz Lightyear \'You are a toy!\'?', a: 'Woody', d: ['Mr. Potato Head', 'Slinky Dog', 'Hamm'] },

{ c: 'Presidents & Politics', t: 3, q: 'Which chancellor knelt at the memorial to the Warsaw ghetto uprising in 1970?', a: 'Willy Brandt', d: ['Helmut Schmidt', 'Kurt Georg Kiesinger', 'Walter Scheel'] },
{ c: 'History & War', t: 3, q: 'Which German pastor summed up his own silence with the confession that first they came for the socialists, and he did not speak out?', a: 'Martin Niemoller', d: ['Dietrich Bonhoeffer', 'Karl Barth', 'Clemens von Galen'] },
{ c: 'Science, Letters & Ideas', t: 3, q: 'Which mathematician announced a proof of Fermat\'s Last Theorem in 1993 and published the corrected version in 1995?', a: 'Andrew Wiles', d: ['Gerd Faltings', 'Ken Ribet', 'Richard Taylor'] },
{ c: 'Books & Authors', t: 3, q: 'Which character follows a mad knight as his squire, promised the governorship of an island?', a: 'Sancho Panza', d: ['Cardenio', 'Sanson Carrasco', 'Pedro Alonso'] },
{ c: 'Screen Lines', t: 3, q: 'Which character in Fargo says at the end that there is more to life than a little money?', a: 'Marge Gunderson', d: ['Jerry Lundegaard', 'Norm Gunderson', 'Wade Gustafson'] },

{ c: 'Presidents & Politics', t: 4, q: 'Which chancellor promised eastern Germans in 1990 that their regions would soon become blooming landscapes?', a: 'Helmut Kohl', d: ['Hans-Dietrich Genscher', 'Lothar de Maiziere', 'Oskar Lafontaine'] },
{ c: 'History & War', t: 4, q: 'Which German chancellor complained in 1914 that Britain would go to war over a scrap of paper?', a: 'Theobald von Bethmann Hollweg', d: ['Alfred von Tirpitz', 'Bernhard von Bulow', 'Gottlieb von Jagow'] },
{ c: 'Science, Letters & Ideas', t: 4, q: 'Which fossil hunter of the Dorset cliffs found the first complete ichthyosaur and plesiosaur skeletons?', a: 'Mary Anning', d: ['Etheldred Benett', 'Gideon Mantell', 'William Buckland'] },
{ c: 'Books & Authors', t: 4, q: 'Which novelist wrote the story of Bigger Thomas, a young man on the South Side of Chicago condemned for murder?', a: 'Richard Wright', d: ['James Baldwin', 'Chester Himes', 'Ann Petry'] },
{ c: 'Screen Lines', t: 4, q: 'Which character in Anchorman answers every question in the newsroom by announcing that he loves lamp?', a: 'Brick Tamland', d: ['Ron Burgundy', 'Champ Kind', 'Brian Fantana'] },

{ c: 'Presidents & Politics', t: 5, q: 'Which economics minister sold the postwar social market economy under the title Prosperity for All?', a: 'Ludwig Erhard', d: ['Karl Schiller', 'Alfred Muller-Armack', 'Fritz Schaffer'] },
{ c: 'History & War', t: 5, q: 'Which German poet, author of the 1914 Hymn of Hate, is credited with the wartime slogan calling on God to punish England?', a: 'Ernst Lissauer', d: ['Stefan George', 'Richard Dehmel', 'Detlev von Liliencron'] },
{ c: 'Science, Letters & Ideas', t: 5, q: 'Which French anatomist established that species really do go extinct, using fossil elephants to prove it?', a: 'Georges Cuvier', d: ['Jean-Baptiste Lamarck', 'Etienne Geoffroy Saint-Hilaire', 'Comte de Buffon'] },
{ c: 'Books & Authors', t: 5, q: 'Which Harlem Renaissance writer wove sketches, poems and a play into a 1923 book named for a Georgia crop?', a: 'Jean Toomer', d: ['Nella Larsen', 'Claude McKay', 'Countee Cullen'] },
{ c: 'Screen Lines', t: 5, q: 'Which character in Rushmore says the secret is to find something you love to do and then do it for the rest of your life?', a: 'Max Fischer', d: ['Herman Blume', 'Rosemary Cross', 'Dirk Calloway'] },
],

// ── Day 59 ──────────────────────────────────────────────────────────────
[
{ c: 'Presidents & Politics', t: 1, q: 'Which president was the only one elected to the office four times?', a: 'Franklin D. Roosevelt', d: ['Woodrow Wilson', 'Theodore Roosevelt', 'Harry S. Truman'] },
{ c: 'History & War', t: 1, q: 'Which conspirator was caught guarding barrels of gunpowder beneath the House of Lords in 1605?', a: 'Guy Fawkes', d: ['Robert Catesby', 'Thomas Percy', 'Francis Tresham'] },
{ c: 'Science, Letters & Ideas', t: 1, q: 'Which Swedish astronomer gave his name to the temperature scale that puts a hundred degrees between the freezing and boiling points of water?', a: 'Anders Celsius', d: ['Daniel Fahrenheit', 'Lord Kelvin', 'Rene Antoine Ferchault de Reaumur'] },
{ c: 'Books & Authors', t: 1, q: 'Which pirate captain in Neverland is pursued by a crocodile that swallowed a ticking clock?', a: 'Captain Hook', d: ['Mr. Smee', 'Gentleman Starkey', 'Bill Jukes'] },
{ c: 'Screen Lines', t: 1, q: 'Which character in Monsters, Inc. is the small girl who keeps calling the big blue monster \'Kitty\'?', a: 'Boo', d: ['Mike Wazowski', 'Celia Mae', 'Roz'] },

{ c: 'Presidents & Politics', t: 2, q: 'Which leader read out the declaration establishing the state of Israel in May 1948 and served as its first prime minister?', a: 'David Ben-Gurion', d: ['Chaim Weizmann', 'Moshe Sharett', 'Levi Eshkol'] },
{ c: 'History & War', t: 2, q: 'Which conqueror ruled from Samarkand and left towers of skulls from Delhi to Damascus?', a: 'Timur', d: ['Genghis Khan', 'Hulagu Khan', 'Babur'] },
{ c: 'Science, Letters & Ideas', t: 2, q: 'Which French writer ended a satirical tale with the advice that we must cultivate our garden?', a: 'Voltaire', d: ['Denis Diderot', 'Jean-Jacques Rousseau', 'Montesquieu'] },
{ c: 'Books & Authors', t: 2, q: 'Which author wrote about a ranch dog stolen and sold into the sled teams of the Klondike?', a: 'Jack London', d: ['Rex Beach', 'James Oliver Curwood', 'Owen Wister'] },
{ c: 'Screen Lines', t: 2, q: 'Which character tells Frodo on the slopes of Mount Doom \'I can\'t carry it for you, but I can carry you\'?', a: 'Samwise Gamgee', d: ['Aragorn', 'Gollum', 'Meriadoc Brandybuck'] },

{ c: 'Presidents & Politics', t: 3, q: 'Which Egyptian president flew to Jerusalem in November 1977 to address the Israeli parliament?', a: 'Anwar Sadat', d: ['Gamal Abdel Nasser', 'Hosni Mubarak', 'King Hussein of Jordan'] },
{ c: 'History & War', t: 3, q: 'Which American scholar wrote in 1903 that the problem of the twentieth century was the problem of the color line?', a: 'W. E. B. Du Bois', d: ['Booker T. Washington', 'James Weldon Johnson', 'Marcus Garvey'] },
{ c: 'Science, Letters & Ideas', t: 3, q: 'Which essayist wrote that some books are to be tasted, others to be swallowed, and some few to be chewed and digested?', a: 'Francis Bacon', d: ['Thomas Browne', 'Ben Jonson', 'Robert Burton'] },
{ c: 'Books & Authors', t: 3, q: 'Which character in Wuthering Heights is brought home as a starving foundling from the streets of Liverpool?', a: 'Heathcliff', d: ['Hindley Earnshaw', 'Edgar Linton', 'Hareton Earnshaw'] },
{ c: 'Screen Lines', t: 3, q: 'Which character rallies the pilots in Independence Day with the promise that today they celebrate their independence day?', a: 'President Thomas Whitmore', d: ['David Levinson', 'Captain Steven Hiller', 'Russell Casse'] },

{ c: 'Presidents & Politics', t: 4, q: 'Which Israeli diplomat remarked that nations behave wisely once they have exhausted all other alternatives?', a: 'Abba Eban', d: ['Moshe Dayan', 'Yigal Allon', 'Shimon Peres'] },
{ c: 'History & War', t: 4, q: 'Which American justice opened the Nuremberg prosecution by saying the wrongs were so calculated and devastating that civilization could not ignore them?', a: 'Robert H. Jackson', d: ['Francis Biddle', 'Telford Taylor', 'Hartley Shawcross'] },
{ c: 'Science, Letters & Ideas', t: 4, q: 'Which philosopher argued that a perfect God must have created the best of all possible worlds?', a: 'Gottfried Leibniz', d: ['Christian Wolff', 'Nicolas Malebranche', 'Baruch Spinoza'] },
{ c: 'Books & Authors', t: 4, q: 'Which novelist followed a former high school basketball star named Harry Angstrom across four novels?', a: 'John Updike', d: ['John Cheever', 'Richard Yates', 'Bernard Malamud'] },
{ c: 'Screen Lines', t: 4, q: 'Which character in The Incredibles tears the house apart demanding to know where his super suit is?', a: 'Frozone', d: ['Mr. Incredible', 'Dash Parr', 'Gilbert Huph'] },

{ c: 'Presidents & Politics', t: 5, q: 'Which prime minister said at the 1993 White House signing that there had been enough of blood and tears?', a: 'Yitzhak Rabin', d: ['Shimon Peres', 'Menachem Begin', 'Ehud Barak'] },
{ c: 'History & War', t: 5, q: 'Whose dispatches to The Times from the Crimea exposed the state of the British army\'s hospitals and helped bring down a government?', a: 'William Howard Russell', d: ['Archibald Forbes', 'W. T. Stead', 'Henry Mayhew'] },
{ c: 'Science, Letters & Ideas', t: 5, q: 'Which medieval monk argued that a being than which nothing greater can be conceived must exist in reality?', a: 'Anselm of Canterbury', d: ['Peter Abelard', 'Duns Scotus', 'Bonaventure'] },
{ c: 'Books & Authors', t: 5, q: 'Which Austrian novelist wrote a book imagining the last eighteen hours of the poet who wrote the Aeneid?', a: 'Hermann Broch', d: ['Robert Musil', 'Elias Canetti', 'Alfred Doblin'] },
{ c: 'Screen Lines', t: 5, q: 'Which character in Contact whispers that they should have sent a poet?', a: 'Ellie Arroway', d: ['Palmer Joss', 'David Drumlin', 'S. R. Hadden'] },
],

// ── Day 60 ──────────────────────────────────────────────────────────────
[
{ c: 'Presidents & Politics', t: 1, q: 'Which Indian leader was shot dead in Delhi in January 1948, months after independence?', a: 'Mohandas Gandhi', d: ['Jawaharlal Nehru', 'Vallabhbhai Patel', 'Lal Bahadur Shastri'] },
{ c: 'History & War', t: 1, q: 'Which Frankish king was crowned emperor of the Romans on Christmas Day in the year 800?', a: 'Charlemagne', d: ['Clovis I', 'Charles Martel', 'Louis the Pious'] },
{ c: 'Science, Letters & Ideas', t: 1, q: 'Which Italian drew the famous study of a man inscribed in a circle and a square?', a: 'Leonardo da Vinci', d: ['Albrecht Durer', 'Michelangelo', 'Andrea Mantegna'] },
{ c: 'Books & Authors', t: 1, q: 'Which character in a Shakespeare tragedy gasps \'Et tu, Brute?\' as the conspirators stab him?', a: 'Julius Caesar', d: ['Marcus Brutus', 'Cassius', 'Cinna'] },
{ c: 'Screen Lines', t: 1, q: 'Which character in Shrek announces that in the morning he is makin\' waffles?', a: 'Donkey', d: ['Shrek', 'Lord Farquaad', 'Princess Fiona'] },

{ c: 'Presidents & Politics', t: 2, q: 'Which president proclaimed Indonesian independence in 1945 and hosted the 1955 Bandung conference?', a: 'Sukarno', d: ['Suharto', 'Mohammad Hatta', 'Sutan Sjahrir'] },
{ c: 'History & War', t: 2, q: 'Which American nurse tended the wounded through the Civil War and then founded her country\'s Red Cross?', a: 'Clara Barton', d: ['Dorothea Dix', 'Mary Ann Bickerdyke', 'Sally Tompkins'] },
{ c: 'Science, Letters & Ideas', t: 2, q: 'Which doctor divided the mind into the id, the ego and the superego?', a: 'Sigmund Freud', d: ['Carl Jung', 'Anna Freud', 'Melanie Klein'] },
{ c: 'Books & Authors', t: 2, q: 'Which author gave three swordsmen and a Gascon the motto that it is all for one and one for all?', a: 'Alexandre Dumas', d: ['Victor Hugo', 'Eugene Sue', 'Theophile Gautier'] },
{ c: 'Screen Lines', t: 2, q: 'Which character in The Phantom Menace warns that fear leads to anger, anger leads to hate, and hate leads to suffering?', a: 'Yoda', d: ['Qui-Gon Jinn', 'Mace Windu', 'Obi-Wan Kenobi'] },

{ c: 'Presidents & Politics', t: 3, q: 'Which widow of an assassinated senator became president of the Philippines after the 1986 People Power revolt?', a: 'Corazon Aquino', d: ['Imelda Marcos', 'Miriam Defensor Santiago', 'Gloria Macapagal Arroyo'] },
{ c: 'History & War', t: 3, q: 'Which English poet wrote the lines about the fallen who shall grow not old, as we that are left grow old?', a: 'Laurence Binyon', d: ['Rupert Brooke', 'John Masefield', 'Alfred Noyes'] },
{ c: 'Science, Letters & Ideas', t: 3, q: 'Which NASA mathematician was asked by John Glenn to check the computer figures for his orbital flight by hand before he would fly?', a: 'Katherine Johnson', d: ['Dorothy Vaughan', 'Mary Jackson', 'Annie Easley'] },
{ c: 'Books & Authors', t: 3, q: 'Which character in A Midsummer Night\'s Dream exclaims \'Lord, what fools these mortals be!\'?', a: 'Puck', d: ['Oberon', 'Bottom', 'Titania'] },
{ c: 'Screen Lines', t: 3, q: 'Which character in Men in Black says that a person is smart, but people are dumb, panicky, dangerous animals?', a: 'Agent K', d: ['Agent J', 'Zed', 'Agent L'] },

{ c: 'Presidents & Politics', t: 4, q: 'Which Malaysian prime minister launched a Look East policy in 1982 urging his country to copy Japanese work habits?', a: 'Mahathir Mohamad', d: ['Tunku Abdul Rahman', 'Abdul Razak Hussein', 'Hussein Onn'] },
{ c: 'History & War', t: 4, q: 'Which Japanese flight leader radioed the signal that the surprise at Pearl Harbor had succeeded?', a: 'Mitsuo Fuchida', d: ['Minoru Genda', 'Chuichi Nagumo', 'Shigeru Itaya'] },
{ c: 'Science, Letters & Ideas', t: 4, q: 'Which essayist wrote that not everything faced can be changed, but nothing can be changed until it is faced?', a: 'James Baldwin', d: ['Ralph Ellison', 'Richard Wright', 'Langston Hughes'] },
{ c: 'Books & Authors', t: 4, q: 'Which character in As You Like It says that all the world is a stage and describes the seven ages of man?', a: 'Jaques', d: ['Orlando', 'Touchstone', 'Duke Senior'] },
{ c: 'Screen Lines', t: 4, q: 'Which character in The Devil Wears Prada lectures an assistant on how a cerulean sweater trickled down to a clearance bin?', a: 'Miranda Priestly', d: ['Andy Sachs', 'Nigel', 'Emily Charlton'] },

{ c: 'Presidents & Politics', t: 5, q: 'Which Pakistani leader said in 1965 that his people would eat grass, even go hungry, but would get a bomb of their own?', a: 'Zulfikar Ali Bhutto', d: ['Ayub Khan', 'Yahya Khan', 'Liaquat Ali Khan'] },
{ c: 'History & War', t: 5, q: 'Which US Navy pilot filed the four-word 1942 report \'Sighted sub, sank same\'?', a: 'Donald Mason', d: ['Edward O\'Hare', 'John Waldron', 'Wade McClusky'] },
{ c: 'Science, Letters & Ideas', t: 5, q: 'Which critic argued in a 1978 book that Western scholarship invented an exotic East to help govern it?', a: 'Edward Said', d: ['Frantz Fanon', 'Homi Bhabha', 'Stuart Hall'] },
{ c: 'Books & Authors', t: 5, q: 'Which German novelist followed Franz Biberkopf out of Tegel prison into the crowds of a great square in Berlin?', a: 'Alfred Doblin', d: ['Hans Fallada', 'Erich Kastner', 'Lion Feuchtwanger'] },
{ c: 'Screen Lines', t: 5, q: 'Which character opens The Prestige by asking the audience \'Are you watching closely?\'', a: 'John Cutter', d: ['Robert Angier', 'Alfred Borden', 'Nikola Tesla'] },
],

// ── Day 61 ──────────────────────────────────────────────────────────────
[
{ c: 'Presidents & Politics', t: 1, q: 'Which elderly American was sent to Paris during the Revolution and secured the French alliance of 1778?', a: 'Benjamin Franklin', d: ['John Jay', 'Silas Deane', 'Arthur Lee'] },
{ c: 'History & War', t: 1, q: 'Which gladiator led the slave rising that Crassus finally crushed in 71 BC?', a: 'Spartacus', d: ['Crixus', 'Eunus', 'Athenion'] },
{ c: 'Science, Letters & Ideas', t: 1, q: 'Which Greek philosopher wrote dialogues in which his old teacher does most of the talking?', a: 'Plato', d: ['Xenophon', 'Aristotle', 'Antisthenes'] },
{ c: 'Books & Authors', t: 1, q: 'Which author wrote both \'Matilda\' and \'The BFG\'?', a: 'Roald Dahl', d: ['E. B. White', 'Beverly Cleary', 'Judy Blume'] },
{ c: 'Screen Lines', t: 1, q: 'Which character sings "Do you want to build a snowman?" outside her sister\'s locked bedroom door in Frozen?', a: 'Anna', d: ['Elsa', 'Olaf', 'Kristoff'] },

{ c: 'Presidents & Politics', t: 2, q: 'Which contributor to the Federalist Papers observed that if men were angels, no government would be necessary?', a: 'James Madison', d: ['John Jay', 'George Mason', 'Edmund Randolph'] },
{ c: 'History & War', t: 2, q: 'Which Persian king bridged the Hellespont with boats, invaded Greece and burned Athens?', a: 'Xerxes I', d: ['Darius I', 'Artaxerxes I', 'Cyrus the Younger'] },
{ c: 'Science, Letters & Ideas', t: 2, q: 'Which English logician gave his name to the overlapping circles used to show how sets relate?', a: 'John Venn', d: ['George Boole', 'Augustus De Morgan', 'Charles Dodgson'] },
{ c: 'Books & Authors', t: 2, q: 'Which character opens a funeral oration with \'Friends, Romans, countrymen, lend me your ears\'?', a: 'Mark Antony', d: ['Marcus Brutus', 'Cassius', 'Casca'] },
{ c: 'Screen Lines', t: 2, q: 'Which character in The Dark Knight Rises tells Batman that he merely adopted the dark, while the speaker was born in it and molded by it?', a: 'Bane', d: ['Talia al Ghul', 'Selina Kyle', 'Jonathan Crane'] },

{ c: 'Presidents & Politics', t: 3, q: 'Which Swedish prime minister was shot dead on a Stockholm street in February 1986?', a: 'Olof Palme', d: ['Tage Erlander', 'Ingvar Carlsson', 'Anna Lindh'] },
{ c: 'History & War', t: 3, q: 'Which Gothic king led the army that sacked Rome in 410, the first to take the city in eight centuries?', a: 'Alaric', d: ['Theodoric the Great', 'Genseric', 'Odoacer'] },
{ c: 'Science, Letters & Ideas', t: 3, q: 'Which philosopher spent a decade with Alfred North Whitehead trying to derive arithmetic from pure logic?', a: 'Bertrand Russell', d: ['Gottlob Frege', 'G. E. Moore', 'Rudolf Carnap'] },
{ c: 'Books & Authors', t: 3, q: 'Which poet framed a story collection around pilgrims riding to Canterbury and telling tales for a free supper?', a: 'Geoffrey Chaucer', d: ['John Gower', 'William Langland', 'Thomas Malory'] },
{ c: 'Screen Lines', t: 3, q: 'Which character in Inception tells Arthur not to be afraid to dream a little bigger, darling, then produces a grenade launcher?', a: 'Eames', d: ['Dom Cobb', 'Yusuf', 'Saito'] },

{ c: 'Presidents & Politics', t: 4, q: 'Which defense lawyer in the Boston Massacre trial told the jury that facts are stubborn things?', a: 'John Adams', d: ['Josiah Quincy', 'Samuel Adams', 'James Otis'] },
{ c: 'History & War', t: 4, q: 'Which Roman biographer records the soothsayer who warned Caesar to beware the Ides of March?', a: 'Suetonius', d: ['Plutarch', 'Cassius Dio', 'Velleius Paterculus'] },
{ c: 'Science, Letters & Ideas', t: 4, q: 'Which thinker sorted writers into those who know one big thing and those who know many, in an essay on Tolstoy?', a: 'Isaiah Berlin', d: ['Lionel Trilling', 'Edmund Wilson', 'Michael Oakeshott'] },
{ c: 'Books & Authors', t: 4, q: 'Which poet wrote a short poem about seven pool players at the Golden Shovel, beginning \'We real cool\'?', a: 'Gwendolyn Brooks', d: ['Lucille Clifton', 'Rita Dove', 'Sonia Sanchez'] },
{ c: 'Screen Lines', t: 4, q: 'Which character in The Wire tells a convenience store guard that you want it to be one way, but it is the other way?', a: 'Marlo Stanfield', d: ['Stringer Bell', 'Avon Barksdale', 'Chris Partlow'] },

{ c: 'Presidents & Politics', t: 5, q: 'Which delegate on the Committee of Style is credited with writing the final wording of the Constitution\'s preamble?', a: 'Gouverneur Morris', d: ['James Wilson', 'Rufus King', 'William Samuel Johnson'] },
{ c: 'History & War', t: 5, q: 'Which Greek-born soldier wrote the last great Latin history of Rome, covering the reign of Julian he had served under?', a: 'Ammianus Marcellinus', d: ['Eutropius', 'Aurelius Victor', 'Zosimus'] },
{ c: 'Science, Letters & Ideas', t: 5, q: 'Which philosopher asked in a 1974 paper what it is like to be a bat?', a: 'Thomas Nagel', d: ['Daniel Dennett', 'David Chalmers', 'Frank Jackson'] },
{ c: 'Books & Authors', t: 5, q: 'Which Japanese novelist chronicled four sisters of a declining Osaka merchant family in a novel serialized during the war?', a: 'Junichiro Tanizaki', d: ['Yasunari Kawabata', 'Osamu Dazai', 'Fumiko Enchi'] },
{ c: 'Screen Lines', t: 5, q: 'Which character in Deadwood says that announcing your plans is a good way to hear God laugh?', a: 'Al Swearengen', d: ['Seth Bullock', 'E. B. Farnum', 'Cy Tolliver'] },
],

// ── Day 62 ──────────────────────────────────────────────────────────────
[
{ c: 'Presidents & Politics', t: 1, q: 'Which first secretary of the Treasury created the national bank and died after a duel in 1804?', a: 'Alexander Hamilton', d: ['Aaron Burr', 'Albert Gallatin', 'Oliver Wolcott'] },
{ c: 'History & War', t: 1, q: 'Which Virginian turned down command of the Union armies in 1861 and took charge of the Army of Northern Virginia instead?', a: 'Robert E. Lee', d: ['Joseph E. Johnston', 'Albert Sidney Johnston', 'P. G. T. Beauregard'] },
{ c: 'Science, Letters & Ideas', t: 1, q: 'Which German goldsmith brought movable-type printing to Europe and produced a famous Bible?', a: 'Johannes Gutenberg', d: ['William Caxton', 'Aldus Manutius', 'Johann Fust'] },
{ c: 'Books & Authors', t: 1, q: 'Which author wrote both \'For Whom the Bell Tolls\' and \'A Farewell to Arms\'?', a: 'Ernest Hemingway', d: ['John Dos Passos', 'F. Scott Fitzgerald', 'James Jones'] },
{ c: 'Screen Lines', t: 1, q: 'Which character finally gives the order "Avengers, assemble" in the closing battle of Avengers: Endgame?', a: 'Steve Rogers', d: ['Tony Stark', 'Thor', 'Nick Fury'] },

{ c: 'Presidents & Politics', t: 2, q: 'Which first chief justice of the United States negotiated an unpopular treaty with Britain in 1794?', a: 'John Jay', d: ['John Marshall', 'Oliver Ellsworth', 'Edmund Randolph'] },
{ c: 'History & War', t: 2, q: 'Which pilot became the first American to orbit the Earth, in February 1962?', a: 'John Glenn', d: ['Alan Shepard', 'Gus Grissom', 'Scott Carpenter'] },
{ c: 'Science, Letters & Ideas', t: 2, q: 'Which economist argued that in a slump the government should spend to restore demand?', a: 'John Maynard Keynes', d: ['Arthur Pigou', 'Irving Fisher', 'Joseph Schumpeter'] },
{ c: 'Books & Authors', t: 2, q: 'Which author wrote of a Puritan woman in Boston forced to wear a red letter on her dress?', a: 'Nathaniel Hawthorne', d: ['Washington Irving', 'James Fenimore Cooper', 'Oliver Wendell Holmes'] },
{ c: 'Screen Lines', t: 2, q: 'Which character in The Martian, stranded alone on the planet, announces that he is going to have to science his way out of the problem?', a: 'Mark Watney', d: ['Melissa Lewis', 'Rick Martinez', 'Beth Johanssen'] },

{ c: 'Presidents & Politics', t: 3, q: 'Which author of the Virginia Declaration of Rights refused to sign the Constitution over the lack of a bill of rights?', a: 'George Mason', d: ['Edmund Randolph', 'Patrick Henry', 'Richard Henry Lee'] },
{ c: 'History & War', t: 3, q: 'Which governor promised in a 1963 inaugural address segregation now, segregation tomorrow, and segregation forever?', a: 'George Wallace', d: ['Orval Faubus', 'Ross Barnett', 'Lester Maddox'] },
{ c: 'Science, Letters & Ideas', t: 3, q: 'Which economist opened his great book with a pin factory to show what the division of labor can do?', a: 'Adam Smith', d: ['David Ricardo', 'Jean-Baptiste Say', 'Anne Robert Jacques Turgot'] },
{ c: 'Books & Authors', t: 3, q: 'Which playwright ended a play with Nora walking out of her marriage and slamming the front door?', a: 'Henrik Ibsen', d: ['August Strindberg', 'Anton Chekhov', 'Maxim Gorky'] },
{ c: 'Screen Lines', t: 3, q: 'Which character in Whiplash keeps halting the band with the complaint "Not quite my tempo"?', a: 'Terence Fletcher', d: ['Andrew Neiman', 'Ryan Connolly', 'Jim Neiman'] },

{ c: 'Presidents & Politics', t: 4, q: 'Which Massachusetts governor gave his name to the practice of drawing contorted electoral districts?', a: 'Elbridge Gerry', d: ['Caleb Strong', 'Levi Lincoln', 'John Hancock'] },
{ c: 'History & War', t: 4, q: 'Which American naval officer slipped into Tripoli harbor in 1804 and burned a captured United States frigate under the guns of the fort?', a: 'Stephen Decatur', d: ['Edward Preble', 'William Bainbridge', 'Isaac Hull'] },
{ c: 'Science, Letters & Ideas', t: 4, q: 'Which economist insisted that inflation is always and everywhere a monetary phenomenon?', a: 'Milton Friedman', d: ['Paul Samuelson', 'James Tobin', 'Robert Solow'] },
{ c: 'Books & Authors', t: 4, q: 'Which poet compared the pen resting between his finger and his thumb to the spade his father dug with?', a: 'Seamus Heaney', d: ['Michael Longley', 'Derek Mahon', 'Paul Muldoon'] },
{ c: 'Screen Lines', t: 4, q: 'Which character on Breaking Bad tells Walter White there is no such thing as a half measure, and that he should have gone all the way?', a: 'Mike Ehrmantraut', d: ['Gus Fring', 'Saul Goodman', 'Hank Schrader'] },

{ c: 'Presidents & Politics', t: 5, q: 'Which Connecticut delegate proposed the compromise that gave each state equal votes in the Senate?', a: 'Roger Sherman', d: ['Oliver Ellsworth', 'William Paterson', 'Luther Martin'] },
{ c: 'History & War', t: 5, q: 'Which colonel died leading the 54th Massachusetts up the parapet of Fort Wagner in 1863?', a: 'Robert Gould Shaw', d: ['Thomas Wentworth Higginson', 'Edward Hallowell', 'James Montgomery'] },
{ c: 'Science, Letters & Ideas', t: 5, q: 'Which economist asked why firms exist at all, and answered with the cost of making a bargain?', a: 'Ronald Coase', d: ['Oliver Williamson', 'Douglass North', 'Armen Alchian'] },
{ c: 'Books & Authors', t: 5, q: 'Which Icelandic novelist won the Nobel for a saga of a stubborn sheep farmer determined to owe nothing to anyone?', a: 'Halldor Laxness', d: ['Sigrid Undset', 'Par Lagerkvist', 'Gunnar Gunnarsson'] },
{ c: 'Screen Lines', t: 5, q: 'Which character on The Sopranos calls "remember when" the lowest form of conversation?', a: 'Tony Soprano', d: ['Paulie Gualtieri', 'Christopher Moltisanti', 'Silvio Dante'] },
],

// ── Day 63 ──────────────────────────────────────────────────────────────
[
{ c: 'Presidents & Politics', t: 1, q: 'Which Union general accepted Lee\'s surrender at Appomattox and was elected president in 1868?', a: 'Ulysses S. Grant', d: ['William Tecumseh Sherman', 'George Meade', 'Winfield Scott Hancock'] },
{ c: 'History & War', t: 1, q: 'Which Mongol ruler founded the Yuan dynasty in China and kept a Venetian merchant at his court?', a: 'Kublai Khan', d: ['Genghis Khan', 'Ogedei Khan', 'Hulagu Khan'] },
{ c: 'Science, Letters & Ideas', t: 1, q: 'Which American told a young tradesman that time is money?', a: 'Benjamin Franklin', d: ['Cotton Mather', 'Noah Webster', 'Thomas Paine'] },
{ c: 'Books & Authors', t: 1, q: 'Which author wrote of a bootlegger throwing enormous parties in West Egg for a woman across the bay?', a: 'F. Scott Fitzgerald', d: ['John O\'Hara', 'Sinclair Lewis', 'Booth Tarkington'] },
{ c: 'Screen Lines', t: 1, q: 'Which character on Breaking Bad confronts a rival distributor in the desert and demands "Say my name"?', a: 'Walter White', d: ['Jesse Pinkman', 'Gus Fring', 'Todd Alquist'] },

{ c: 'Presidents & Politics', t: 2, q: 'Which former senator from Mississippi was inaugurated as president of the Confederacy in 1861?', a: 'Jefferson Davis', d: ['Alexander Stephens', 'Robert Toombs', 'Judah Benjamin'] },
{ c: 'History & War', t: 2, q: 'Which American test pilot first flew faster than the speed of sound, in October 1947?', a: 'Chuck Yeager', d: ['Scott Crossfield', 'Joe Walker', 'Bob Hoover'] },
{ c: 'Science, Letters & Ideas', t: 2, q: 'Which Englishman spent nine years compiling a Dictionary of the English Language published in 1755?', a: 'Samuel Johnson', d: ['Noah Webster', 'Nathan Bailey', 'James Murray'] },
{ c: 'Books & Authors', t: 2, q: 'Which dragon sleeps on the treasure hoard under the Lonely Mountain?', a: 'Smaug', d: ['Beorn', 'Bard the Bowman', 'Glaurung'] },
{ c: 'Screen Lines', t: 2, q: 'Which character in Star Wars: The Last Jedi urges Rey to let the past die, and to kill it if she has to?', a: 'Kylo Ren', d: ['Luke Skywalker', 'Supreme Leader Snoke', 'General Hux'] },

{ c: 'Presidents & Politics', t: 3, q: 'Which president was impeached in 1868 and acquitted in the Senate by a single vote?', a: 'Andrew Johnson', d: ['Ulysses S. Grant', 'James Buchanan', 'Rutherford B. Hayes'] },
{ c: 'History & War', t: 3, q: 'Who told the Commons in 1947 that democracy was the worst form of government except for all the others that had been tried?', a: 'Winston Churchill', d: ['Clement Attlee', 'Anthony Eden', 'Herbert Morrison'] },
{ c: 'Science, Letters & Ideas', t: 3, q: 'Which essayist opened a collection by saying that we tell ourselves stories in order to live?', a: 'Joan Didion', d: ['Susan Sontag', 'Nora Ephron', 'Renata Adler'] },
{ c: 'Books & Authors', t: 3, q: 'Which character in The Shining types the same sentence over and over instead of writing his play?', a: 'Jack Torrance', d: ['Danny Torrance', 'Dick Hallorann', 'Delbert Grady'] },
{ c: 'Screen Lines', t: 3, q: 'Which character in Black Panther asks to be buried in the ocean with the ancestors who jumped from the ships?', a: 'Erik Killmonger', d: ['W\'Kabi', 'N\'Jobu', 'Zuri'] },

{ c: 'Presidents & Politics', t: 4, q: 'Which Radical Republican leader wrote his own epitaph about being buried where he could illustrate the equality of man before his creator?', a: 'Thaddeus Stevens', d: ['Charles Sumner', 'Benjamin Wade', 'Salmon P. Chase'] },
{ c: 'History & War', t: 4, q: 'The report \'Houston, we\'ve had a problem\' is usually credited to Jim Lovell. Which Apollo 13 crewman actually said it first?', a: 'Jack Swigert', d: ['Fred Haise', 'Ken Mattingly', 'Gene Kranz'] },
{ c: 'Science, Letters & Ideas', t: 4, q: 'Which essayist gave six rules for writing and ended by saying to break any of them sooner than say anything outright barbarous?', a: 'George Orwell', d: ['Cyril Connolly', 'Evelyn Waugh', 'V. S. Pritchett'] },
{ c: 'Books & Authors', t: 4, q: 'Which novelist followed a runaway called the kid across the border with a scalp-hunting gang led by Judge Holden?', a: 'Cormac McCarthy', d: ['Larry McMurtry', 'Denis Johnson', 'Thomas McGuane'] },
{ c: 'Screen Lines', t: 4, q: 'Which character on Mad Men, told by a copywriter that he never says thank you, snaps that that is what the money is for?', a: 'Don Draper', d: ['Roger Sterling', 'Bert Cooper', 'Pete Campbell'] },

{ c: 'Presidents & Politics', t: 5, q: 'Which minister from Mississippi became the first Black member of the United States Senate in 1870?', a: 'Hiram Revels', d: ['Blanche Bruce', 'Robert Smalls', 'P. B. S. Pinchback'] },
{ c: 'History & War', t: 5, q: 'Which Mercury astronaut sent the farewell \'Godspeed, John Glenn\' as Friendship 7 lifted off?', a: 'Scott Carpenter', d: ['Deke Slayton', 'Wally Schirra', 'Gordon Cooper'] },
{ c: 'Science, Letters & Ideas', t: 5, q: 'Which Victorian critic defined culture as the pursuit of the best that has been thought and said in the world?', a: 'Matthew Arnold', d: ['John Ruskin', 'Thomas Carlyle', 'Walter Pater'] },
{ c: 'Books & Authors', t: 5, q: 'Which Peruvian novelist opened a book with a man in Lima wondering at what precise moment his country had gone wrong?', a: 'Mario Vargas Llosa', d: ['Jose Maria Arguedas', 'Alfredo Bryce Echenique', 'Ciro Alegria'] },
{ c: 'Screen Lines', t: 5, q: 'Which character in Band of Brothers tells a terrified paratrooper that his only hope is to accept the fact that he is already dead?', a: 'Ronald Speirs', d: ['Richard Winters', 'Lewis Nixon', 'Carwood Lipton'] },
],

// ── Day 64 ──────────────────────────────────────────────────────────────
[
{ c: 'Presidents & Politics', t: 1, q: 'Which mayor of New York City led the response to the attacks on the World Trade Center in September 2001?', a: 'Rudy Giuliani', d: ['Michael Bloomberg', 'David Dinkins', 'Ed Koch'] },
{ c: 'History & War', t: 1, q: 'Which king of Wessex is said in legend to have burned the cakes, and in fact beat the Danes at Edington?', a: 'Alfred the Great', d: ['Athelstan', 'Edward the Elder', 'Edmund Ironside'] },
{ c: 'Science, Letters & Ideas', t: 1, q: 'Which astronomer first saw four moons circling Jupiter through a telescope?', a: 'Galileo Galilei', d: ['Christiaan Huygens', 'Giovanni Cassini', 'Simon Marius'] },
{ c: 'Books & Authors', t: 1, q: 'Which author wrote the mystery in which a detective solves a killing aboard a snowbound train out of Istanbul?', a: 'Agatha Christie', d: ['Dorothy L. Sayers', 'Ngaio Marsh', 'Margery Allingham'] },
{ c: 'Screen Lines', t: 1, q: 'Which character brings a dance party to a halt in Greta Gerwig\'s 2023 blockbuster by asking whether the others ever think about dying?', a: 'Stereotypical Barbie', d: ['Weird Barbie', 'President Barbie', 'Ken'] },

{ c: 'Presidents & Politics', t: 2, q: 'Which Russian ruler abdicated in March 1917 after strikes and mutinies in the capital?', a: 'Nicholas II', d: ['Alexander III', 'Grand Duke Michael', 'Nicholas I'] },
{ c: 'History & War', t: 2, q: 'Which warrior king brought all the Hawaiian islands under a single rule by 1810?', a: 'Kamehameha I', d: ['Kalaniopuu', 'Kaumualii', 'Kalakaua'] },
{ c: 'Science, Letters & Ideas', t: 2, q: 'Which German mathematician published the calculus in his own notation and was accused by Newton supporters of stealing it?', a: 'Gottfried Leibniz', d: ['Jacob Bernoulli', 'Pierre de Fermat', 'John Wallis'] },
{ c: 'Books & Authors', t: 2, q: 'Which author wrote the novel narrated by an expelled schoolboy named Holden Caulfield?', a: 'J. D. Salinger', d: ['John Knowles', 'Bernard Malamud', 'John Cheever'] },
{ c: 'Screen Lines', t: 2, q: 'Which character in Game of Thrones gives her dragons the single-word command "Dracarys"?', a: 'Daenerys Targaryen', d: ['Cersei Lannister', 'Sansa Stark', 'Melisandre'] },

{ c: 'Presidents & Politics', t: 3, q: 'Which lawyer headed the Russian provisional government that was overthrown in October 1917?', a: 'Alexander Kerensky', d: ['Georgy Lvov', 'Pavel Milyukov', 'Lavr Kornilov'] },
{ c: 'History & War', t: 3, q: 'Which English poet wrote that if he died, some corner of a foreign field would be forever England?', a: 'Rupert Brooke', d: ['Wilfred Owen', 'Charles Sorley', 'Julian Grenfell'] },
{ c: 'Science, Letters & Ideas', t: 3, q: 'Which physicist showed that cathode rays are made of particles far lighter than any atom?', a: 'J. J. Thomson', d: ['Ernest Rutherford', 'Philipp Lenard', 'William Crookes'] },
{ c: 'Books & Authors', t: 3, q: 'Which character in The Merchant of Venice asks whether, if you prick us, we do not bleed?', a: 'Shylock', d: ['Antonio', 'Bassanio', 'Portia'] },
{ c: 'Screen Lines', t: 3, q: 'Which character in Gone Girl delivers the monologue explaining what a Cool Girl is and how she is manufactured?', a: 'Amy Dunne', d: ['Nick Dunne', 'Margo Dunne', 'Desi Collings'] },

{ c: 'Presidents & Politics', t: 4, q: 'Which Bolshevik became commissar for social welfare in 1917, among the first women to hold ministerial office anywhere?', a: 'Alexandra Kollontai', d: ['Nadezhda Krupskaya', 'Inessa Armand', 'Maria Spiridonova'] },
{ c: 'History & War', t: 4, q: 'Which emperor said farewell to his Old Guard at Fontainebleau in 1814, telling them he would write of the great things they had done together?', a: 'Napoleon Bonaparte', d: ['Michel Ney', 'Joachim Murat', 'Louis-Nicolas Davout'] },
{ c: 'Science, Letters & Ideas', t: 4, q: 'Whose 1928 equation for the electron implied a mirror particle with the opposite charge?', a: 'Paul Dirac', d: ['Wolfgang Pauli', 'Erwin Schrodinger', 'Carl Anderson'] },
{ c: 'Books & Authors', t: 4, q: 'Which playwright sent a canteen woman dragging her wagon through the Thirty Years War?', a: 'Bertolt Brecht', d: ['Frank Wedekind', 'Ernst Toller', 'Georg Kaiser'] },
{ c: 'Screen Lines', t: 4, q: 'Which character in The Grand Budapest Hotel says there are still faint glimmers of civilization left in this barbaric slaughterhouse?', a: 'M. Gustave', d: ['Zero Moustafa', 'Dmitri Desgoffe-und-Taxis', 'Deputy Kovacs'] },

{ c: 'Presidents & Politics', t: 5, q: 'Which Marxist revolutionary, a founder of the Spartacus League in Berlin, wrote in 1918 that freedom is always the freedom of the one who thinks differently?', a: 'Rosa Luxemburg', d: ['Clara Zetkin', 'Karl Liebknecht', 'Emma Goldman'] },
{ c: 'History & War', t: 5, q: 'The retort \'The Guard dies, it does not surrender\' is credited to which French general at Waterloo, who always denied saying it?', a: 'Pierre Cambronne', d: ['Michel Ney', 'Emmanuel de Grouchy', 'Antoine Drouot'] },
{ c: 'Science, Letters & Ideas', t: 5, q: 'Which astronomer coined the term Big Bang on the radio while arguing against the theory?', a: 'Fred Hoyle', d: ['Arthur Eddington', 'George Gamow', 'Hermann Bondi'] },
{ c: 'Books & Authors', t: 5, q: 'Which Sudanese novelist wrote of a village on the Nile and a man returning from years of study in London?', a: 'Tayeb Salih', d: ['Abdulrazak Gurnah', 'Nuruddin Farah', 'Yusuf Idris'] },
{ c: 'Screen Lines', t: 5, q: 'Which character in Six Feet Under says at his father\'s graveside that you cannot take a picture of this, it is already gone?', a: 'Nate Fisher', d: ['David Fisher', 'Federico Diaz', 'Nathaniel Fisher Sr.'] },
],

// ── Day 65 ──────────────────────────────────────────────────────────────
[
{ c: 'Presidents & Politics', t: 1, q: 'Which Russian leader climbed onto a tank outside the parliament to denounce the August 1991 coup?', a: 'Boris Yeltsin', d: ['Mikhail Gorbachev', 'Ruslan Khasbulatov', 'Yegor Gaidar'] },
{ c: 'History & War', t: 1, q: 'Which Ottoman sultan was known in Europe as the Magnificent and to his own subjects as the Lawgiver?', a: 'Suleiman I', d: ['Selim I', 'Bayezid II', 'Murad IV'] },
{ c: 'Science, Letters & Ideas', t: 1, q: 'Which philosopher studied under Plato and later founded his own school, the Lyceum?', a: 'Aristotle', d: ['Speusippus', 'Xenocrates', 'Epicurus'] },
{ c: 'Books & Authors', t: 1, q: 'Which author wrote \'Carrie\', \'Misery\' and \'It\'?', a: 'Stephen King', d: ['Dean Koontz', 'Peter Straub', 'Clive Barker'] },
{ c: 'Screen Lines', t: 1, q: 'Which character in Stranger Things adopts "Friends don\'t lie" as a personal rule after learning the phrase from Mike?', a: 'Eleven', d: ['Dustin Henderson', 'Will Byers', 'Max Mayfield'] },

{ c: 'Presidents & Politics', t: 2, q: 'Which Romanian leader was overthrown and shot after a revolt in December 1989?', a: 'Nicolae Ceausescu', d: ['Ion Iliescu', 'Gheorghe Gheorghiu-Dej', 'Todor Zhivkov'] },
{ c: 'History & War', t: 2, q: 'Which Mughal emperor raised a marble tomb at Agra for his favorite wife?', a: 'Shah Jahan', d: ['Akbar', 'Humayun', 'Jahangir'] },
{ c: 'Science, Letters & Ideas', t: 2, q: 'Which Greek taught that everything is made of uncuttable particles moving in empty space?', a: 'Democritus', d: ['Anaxagoras', 'Empedocles', 'Anaximander'] },
{ c: 'Books & Authors', t: 2, q: 'Which author wrote of a World State where citizens are hatched in bottles and kept content with a drug called soma?', a: 'Aldous Huxley', d: ['H. G. Wells', 'Yevgeny Zamyatin', 'Anthony Burgess'] },
{ c: 'Screen Lines', t: 2, q: 'Which masked character psyches himself up with the words "maximum effort" before a fight?', a: 'Deadpool', d: ['Cable', 'Colossus', 'Ajax'] },

{ c: 'Presidents & Politics', t: 3, q: 'Which Slovak reformer led the Czechoslovak party during the Prague Spring of 1968?', a: 'Alexander Dubcek', d: ['Antonin Novotny', 'Gustav Husak', 'Ludvik Svoboda'] },
{ c: 'History & War', t: 3, q: 'Which caliph, the second to succeed Muhammad, presided over the conquest of Syria, Egypt and Persia?', a: 'Umar ibn al-Khattab', d: ['Abu Bakr', 'Uthman ibn Affan', 'Ali ibn Abi Talib'] },
{ c: 'Science, Letters & Ideas', t: 3, q: 'Which chemist named oxygen and showed that burning is combination with it, not the loss of a fiery principle?', a: 'Antoine Lavoisier', d: ['Joseph Priestley', 'Carl Wilhelm Scheele', 'Georg Stahl'] },
{ c: 'Books & Authors', t: 3, q: 'Which character in Paradise Lost decides it is better to reign in Hell than serve in Heaven?', a: 'Satan', d: ['Beelzebub', 'Moloch', 'Belial'] },
{ c: 'Screen Lines', t: 3, q: 'Which character on the American version of The Office mocks a coworker with the impression "Bears. Beets. Battlestar Galactica"?', a: 'Jim Halpert', d: ['Dwight Schrute', 'Andy Bernard', 'Kevin Malone'] },

{ c: 'Presidents & Politics', t: 4, q: 'Which Hungarian premier led the 1956 uprising government and was executed two years later?', a: 'Imre Nagy', d: ['Janos Kadar', 'Matyas Rakosi', 'Pal Maleter'] },
{ c: 'History & War', t: 4, q: 'Which conqueror wrote in his memoirs that the country he had just taken had few charms, no good horses and no ice for its drinks?', a: 'Babur', d: ['Timur', 'Sher Shah Suri', 'Mahmud of Ghazni'] },
{ c: 'Science, Letters & Ideas', t: 4, q: 'Which Greek is called the first philosopher and is said to have predicted a solar eclipse?', a: 'Thales', d: ['Anaximander', 'Solon', 'Pherecydes'] },
{ c: 'Books & Authors', t: 4, q: 'Which poet wrote of a nature red in tooth and claw in an elegy for a friend who died young?', a: 'Alfred Tennyson', d: ['Robert Browning', 'Matthew Arnold', 'Arthur Hugh Clough'] },
{ c: 'Screen Lines', t: 4, q: 'Which character in Mad Max: Fury Road warns the crowd below his tower not to become addicted to water?', a: 'Immortan Joe', d: ['Nux', 'The People Eater', 'Rictus Erectus'] },

{ c: 'Presidents & Politics', t: 5, q: 'Which Yugoslav vice president was jailed after arguing that communism had produced a new ruling class of party officials?', a: 'Milovan Djilas', d: ['Edvard Kardelj', 'Aleksandar Rankovic', 'Vladimir Dedijer'] },
{ c: 'History & War', t: 5, q: 'Which Syrian gentleman-warrior wrote a book of recollections poking fun at the medicine and manners of the crusaders?', a: 'Usama ibn Munqidh', d: ['Ibn al-Athir', 'Baha ad-Din ibn Shaddad', 'Imad ad-Din al-Isfahani'] },
{ c: 'Science, Letters & Ideas', t: 5, q: 'Which Greek astronomer put the Sun at the center of the cosmos some seventeen centuries before Copernicus?', a: 'Aristarchus of Samos', d: ['Eratosthenes', 'Hipparchus', 'Apollonius of Perga'] },
{ c: 'Books & Authors', t: 5, q: 'Which French novelist wrote a bitter, slangy first novel following Bardamu from the trenches to Africa to Detroit?', a: 'Louis-Ferdinand Celine', d: ['Andre Malraux', 'Georges Bernanos', 'Francois Mauriac'] },
{ c: 'Screen Lines', t: 5, q: 'Which character in Andor says that he burns his life to make a sunrise he knows he will never see?', a: 'Luthen Rael', d: ['Cassian Andor', 'Saw Gerrera', 'Mon Mothma'] },
],

// ── Day 66 ──────────────────────────────────────────────────────────────
[
{ c: 'Presidents & Politics', t: 1, q: 'Which president gave the order to drop atomic bombs on Japan in August 1945?', a: 'Harry S. Truman', d: ['Franklin D. Roosevelt', 'Dwight D. Eisenhower', 'Herbert Hoover'] },
{ c: 'History & War', t: 1, q: 'Which Dutch-born dancer was shot by a French firing squad in 1917 after being convicted of spying for Germany?', a: 'Mata Hari', d: ['Edith Cavell', 'Louise de Bettignies', 'Gabrielle Petit'] },
{ c: 'Science, Letters & Ideas', t: 1, q: 'Which artist carved the marble David that stood in the square in Florence?', a: 'Michelangelo', d: ['Donatello', 'Benvenuto Cellini', 'Andrea del Verrocchio'] },
{ c: 'Books & Authors', t: 1, q: 'Which author wrote the thriller in which a symbologist chases a secret through the Louvre and a Paris church?', a: 'Dan Brown', d: ['John Grisham', 'Michael Crichton', 'James Patterson'] },
{ c: 'Screen Lines', t: 1, q: 'Which character in Moana sings "You\'re Welcome" while listing the gifts he has given humankind?', a: 'Maui', d: ['Chief Tui', 'Tamatoa', 'Gramma Tala'] },

{ c: 'Presidents & Politics', t: 2, q: 'Which candidate promised in October 1952 that if elected he would go to Korea?', a: 'Dwight D. Eisenhower', d: ['Adlai Stevenson', 'Robert Taft', 'Douglas MacArthur'] },
{ c: 'History & War', t: 2, q: 'Which Egyptian president announced the nationalization of the Suez Canal in a 1956 speech in Alexandria?', a: 'Gamal Abdel Nasser', d: ['Anwar Sadat', 'Muhammad Naguib', 'King Farouk'] },
{ c: 'Science, Letters & Ideas', t: 2, q: 'Which Catalan architect spent his last decades on an unfinished Barcelona basilica?', a: 'Antoni Gaudi', d: ['Lluis Domenech i Montaner', 'Josep Puig i Cadafalch', 'Rafael Guastavino'] },
{ c: 'Books & Authors', t: 2, q: 'Which author wrote the Civil War novel of Scarlett O\'Hara and the burning of Atlanta?', a: 'Margaret Mitchell', d: ['Edna Ferber', 'Pearl S. Buck', 'Ellen Glasgow'] },
{ c: 'Screen Lines', t: 2, q: 'Which character on the American version of The Office protests that identity theft is not a joke, and that millions of families suffer every year?', a: 'Dwight Schrute', d: ['Michael Scott', 'Andy Bernard', 'Toby Flenderson'] },

{ c: 'Presidents & Politics', t: 3, q: 'Which secretary of state said during the 1962 missile crisis that the two sides were eyeball to eyeball and the other fellow had just blinked?', a: 'Dean Rusk', d: ['Robert McNamara', 'McGeorge Bundy', 'Adlai Stevenson'] },
{ c: 'History & War', t: 3, q: 'Which 1571 sea battle wrecked the Ottoman fleet and ended its dominance of the Mediterranean?', a: 'Lepanto', d: ['Preveza', 'Djerba', 'Navarino'] },
{ c: 'Science, Letters & Ideas', t: 3, q: 'Which architect cantilevered a Pennsylvania house out over a waterfall?', a: 'Frank Lloyd Wright', d: ['Richard Neutra', 'Rudolph Schindler', 'Philip Johnson'] },
{ c: 'Books & Authors', t: 3, q: 'Which author wrote the novel of a band of rabbits led by Hazel and Fiver to a new warren on a down?', a: 'Richard Adams', d: ['Kenneth Grahame', 'William Horwood', 'Colin Dann'] },
{ c: 'Screen Lines', t: 3, q: 'Which character in Downton Abbey responds to talk of a job by asking "What is a weekend?"', a: 'Violet Crawley', d: ['Cora Crawley', 'Isobel Crawley', 'Robert Crawley'] },

{ c: 'Presidents & Politics', t: 4, q: 'Which secretary of state told an interviewer in 1956 that the ability to get to the verge without getting into war is a necessary art?', a: 'John Foster Dulles', d: ['Christian Herter', 'Dean Acheson', 'Allen Dulles'] },
{ c: 'History & War', t: 4, q: 'Which British foreign secretary put his name to the 1917 letter promising a national home for the Jewish people in Palestine?', a: 'Arthur Balfour', d: ['Alfred Milner', 'George Curzon', 'Herbert Samuel'] },
{ c: 'Science, Letters & Ideas', t: 4, q: 'Which writer defended crowded sidewalks and short blocks against the bulldozers of urban renewal?', a: 'Jane Jacobs', d: ['Lewis Mumford', 'Ada Louise Huxtable', 'Catherine Bauer'] },
{ c: 'Books & Authors', t: 4, q: 'Which poet remembered being young and easy under the apple boughs, about the lilting house and happy as the grass was green?', a: 'Dylan Thomas', d: ['Vernon Watkins', 'R. S. Thomas', 'Louis MacNeice'] },
{ c: 'Screen Lines', t: 4, q: 'Which character in Moonlight tells a boy at the beach that in moonlight, black boys look blue?', a: 'Juan', d: ['Kevin', 'Chiron', 'Teresa'] },

{ c: 'Presidents & Politics', t: 5, q: 'Which official was the principal author of the 1950 policy paper NSC-68 that set the terms of Cold War rearmament?', a: 'Paul Nitze', d: ['George Kennan', 'Robert Lovett', 'Dean Acheson'] },
{ c: 'History & War', t: 5, q: 'Which British archaeologist and political officer, called the uncrowned queen of the desert, helped draw the borders of modern Iraq?', a: 'Gertrude Bell', d: ['Freya Stark', 'Harry St John Philby', 'Mark Sykes'] },
{ c: 'Science, Letters & Ideas', t: 5, q: 'Which architect is buried in the cathedral he built under a line telling the reader who seeks his monument to look around?', a: 'Christopher Wren', d: ['Nicholas Hawksmoor', 'Inigo Jones', 'John Vanbrugh'] },
{ c: 'Books & Authors', t: 5, q: 'Which Russian symbolist wrote a 1913 novel of a bomb hidden in a sardine tin in the imperial capital?', a: 'Andrei Bely', d: ['Fyodor Sologub', 'Alexander Blok', 'Valery Bryusov'] },
{ c: 'Screen Lines', t: 5, q: 'Which character in BoJack Horseman tells the title character "You are all the things that are wrong with you"?', a: 'Todd Chavez', d: ['Diane Nguyen', 'Princess Carolyn', 'Mr. Peanutbutter'] },
],

// ── Day 67 ──────────────────────────────────────────────────────────────
[
{ c: 'Presidents & Politics', t: 1, q: 'Which prime minister took Britain into the 2003 invasion of Iraq alongside the United States?', a: 'Tony Blair', d: ['Gordon Brown', 'John Major', 'David Cameron'] },
{ c: 'History & War', t: 1, q: 'Whose assassination in Sarajevo in June 1914 set the great powers marching?', a: 'Franz Ferdinand', d: ['Franz Joseph I', 'Karl I of Austria', 'Rudolf of Austria'] },
{ c: 'Science, Letters & Ideas', t: 1, q: 'Which Norwegian painted the screaming figure on a blood-red bridge?', a: 'Edvard Munch', d: ['James Ensor', 'Egon Schiele', 'Emil Nolde'] },
{ c: 'Books & Authors', t: 1, q: 'Which author wrote the case of a spectral hound stalking a family on Dartmoor?', a: 'Arthur Conan Doyle', d: ['G. K. Chesterton', 'E. W. Hornung', 'Edgar Wallace'] },
{ c: 'Screen Lines', t: 1, q: 'Which character in Game of Thrones repeatedly tells a young member of the Night\'s Watch that he knows nothing?', a: 'Ygritte', d: ['Osha', 'Gilly', 'Melisandre'] },

{ c: 'Presidents & Politics', t: 2, q: 'Which media tycoon was elected prime minister of Italy for the first of three spells in 1994?', a: 'Silvio Berlusconi', d: ['Romano Prodi', 'Umberto Bossi', 'Matteo Renzi'] },
{ c: 'History & War', t: 2, q: 'Which German emperor abdicated in November 1918 and lived out his life in exile in the Netherlands?', a: 'Wilhelm II', d: ['Friedrich III', 'Ludwig III of Bavaria', 'Karl I of Austria'] },
{ c: 'Science, Letters & Ideas', t: 2, q: 'Which brewer turned physicist measured how much mechanical work it takes to warm water, and has the unit of energy named for him?', a: 'James Joule', d: ['Julius von Mayer', 'Hermann von Helmholtz', 'Benjamin Thompson'] },
{ c: 'Books & Authors', t: 2, q: 'Which author wrote about Martians landing at Woking and a machine that carries a traveler to the year 802,701?', a: 'H. G. Wells', d: ['Arthur C. Clarke', 'John Wyndham', 'Olaf Stapledon'] },
{ c: 'Screen Lines', t: 2, q: 'Which character in The Wolf of Wall Street tests his friends at a diner by telling them to sell him a pen?', a: 'Jordan Belfort', d: ['Donnie Azoff', 'Mark Hanna', 'Brad Bodnick'] },

{ c: 'Presidents & Politics', t: 3, q: 'Which army commander seized power in Chile in September 1973 and ruled for seventeen years?', a: 'Augusto Pinochet', d: ['Manuel Contreras', 'Gustavo Leigh', 'Carlos Prats'] },
{ c: 'History & War', t: 3, q: 'Which British officer in the Arab Revolt wrote that all men dream, but the dreamers of the day are dangerous men?', a: 'T. E. Lawrence', d: ['Edmund Allenby', 'Gertrude Bell', 'John Glubb'] },
{ c: 'Science, Letters & Ideas', t: 3, q: 'Which German found that current in a wire is proportional to the voltage across it?', a: 'Georg Ohm', d: ['Gustav Kirchhoff', 'Andre-Marie Ampere', 'Charles-Augustin de Coulomb'] },
{ c: 'Books & Authors', t: 3, q: 'Which novelist argued that a woman must have money and a room of her own if she is going to write fiction?', a: 'Virginia Woolf', d: ['Katherine Mansfield', 'Vita Sackville-West', 'Rebecca West'] },
{ c: 'Screen Lines', t: 3, q: 'Which character in Succession tells his assembled children that they are not serious people?', a: 'Logan Roy', d: ['Tom Wambsgans', 'Frank Vernon', 'Gerri Kellman'] },

{ c: 'Presidents & Politics', t: 4, q: 'Which communist deputy rallied the defense of Madrid in 1936 with the cry that they shall not pass?', a: 'Dolores Ibarruri', d: ['Federica Montseny', 'Margarita Nelken', 'Victoria Kent'] },
{ c: 'History & War', t: 4, q: 'Which Australian general\'s set-piece attack at Le Hamel in 1918 became a model of infantry, tanks, artillery and aircraft working as one?', a: 'John Monash', d: ['William Birdwood', 'Harry Chauvel', 'Arthur Currie'] },
{ c: 'Science, Letters & Ideas', t: 4, q: 'Which French engineer worked out in 1824 the greatest efficiency any heat engine can reach?', a: 'Sadi Carnot', d: ['Rudolf Clausius', 'Emile Clapeyron', 'Denis Papin'] },
{ c: 'Books & Authors', t: 4, q: 'Which king rallies his men at Harfleur with \'Once more unto the breach, dear friends, once more\'?', a: 'Henry V', d: ['Falstaff', 'Hotspur', 'The Duke of Exeter'] },
{ c: 'Screen Lines', t: 4, q: 'Which character in Everything Everywhere All at Once says that in another life they would have really liked just doing laundry and taxes together?', a: 'Waymond Wang', d: ['Evelyn Wang', 'Joy Wang', 'Gong Gong'] },

{ c: 'Presidents & Politics', t: 5, q: 'Which Italian prime minister quipped that power wears out those who do not have it?', a: 'Giulio Andreotti', d: ['Aldo Moro', 'Bettino Craxi', 'Amintore Fanfani'] },
{ c: 'History & War', t: 5, q: 'Which deposed Congolese premier wrote to his wife that history would one day have its say, and it would be the history taught in the freed colonies?', a: 'Patrice Lumumba', d: ['Joseph Kasavubu', 'Moise Tshombe', 'Mobutu Sese Seko'] },
{ c: 'Science, Letters & Ideas', t: 5, q: 'Which physicist coined the word entropy and said the energy of the universe is constant while it tends to a maximum?', a: 'Rudolf Clausius', d: ['William Rankine', 'Josiah Willard Gibbs', 'Pierre Duhem'] },
{ c: 'Books & Authors', t: 5, q: 'Which Chinese novelist wrote the eighteenth-century family saga known as the Dream of the Red Chamber?', a: 'Cao Xueqin', d: ['Luo Guanzhong', 'Pu Songling', 'Wu Jingzi'] },
{ c: 'Screen Lines', t: 5, q: 'Which character opens Ford v Ferrari describing what happens at 7,000 RPM, when everything fades away?', a: 'Carroll Shelby', d: ['Ken Miles', 'Lee Iacocca', 'Leo Beebe'] },
],

// ── Day 68 ──────────────────────────────────────────────────────────────
[
{ c: 'Presidents & Politics', t: 1, q: 'Which vice president under Washington went on to serve a single term as the second president?', a: 'John Adams', d: ['Thomas Jefferson', 'Aaron Burr', 'John Jay'] },
{ c: 'History & War', t: 1, q: 'Which German factory owner kept more than a thousand Jewish workers alive by insisting they were essential to his production?', a: 'Oskar Schindler', d: ['Raoul Wallenberg', 'Chiune Sugihara', 'Aristides de Sousa Mendes'] },
{ c: 'Science, Letters & Ideas', t: 1, q: 'Which blind Frenchman devised the system of raised dots that lets blind people read by touch?', a: 'Louis Braille', d: ['Valentin Hauy', 'Charles Barbier', 'Samuel Gridley Howe'] },
{ c: 'Books & Authors', t: 1, q: 'Which character is hailed by three witches on a heath and told that he shall be king hereafter?', a: 'Macbeth', d: ['Banquo', 'Macduff', 'Duncan'] },
{ c: 'Screen Lines', t: 1, q: 'Which character in The Avengers reveals his secret before transforming, saying that he is always angry?', a: 'Bruce Banner', d: ['Tony Stark', 'Steve Rogers', 'Clint Barton'] },

{ c: 'Presidents & Politics', t: 2, q: 'Which president kept a pledge to serve one term after annexing Texas and winning the war with Mexico?', a: 'James K. Polk', d: ['Zachary Taylor', 'John Tyler', 'Franklin Pierce'] },
{ c: 'History & War', t: 2, q: 'Which American general plotted to hand West Point to the British and fled to their side in 1780?', a: 'Benedict Arnold', d: ['Charles Lee', 'Horatio Gates', 'Thomas Conway'] },
{ c: 'Science, Letters & Ideas', t: 2, q: 'Which anatomist coined the word dinosaur for a group of giant fossil reptiles in 1842?', a: 'Richard Owen', d: ['Gideon Mantell', 'William Buckland', 'Thomas Huxley'] },
{ c: 'Books & Authors', t: 2, q: 'Which author wrote both \'Stuart Little\' and \'The Trumpet of the Swan\'?', a: 'E. B. White', d: ['Robert Lawson', 'Beverly Cleary', 'Kate DiCamillo'] },
{ c: 'Screen Lines', t: 2, q: 'Which character in The Social Network says that a million dollars is not cool, and that what is cool is a billion dollars?', a: 'Sean Parker', d: ['Mark Zuckerberg', 'Eduardo Saverin', 'Divya Narendra'] },

{ c: 'Presidents & Politics', t: 3, q: 'Which New York political organizer was the first president born a citizen of the United States rather than a British subject?', a: 'Martin Van Buren', d: ['Andrew Jackson', 'John Tyler', 'James Buchanan'] },
{ c: 'History & War', t: 3, q: 'Which camp survivor told the Nobel committee in 1986 that neutrality helps the oppressor and silence encourages the tormentor?', a: 'Elie Wiesel', d: ['Primo Levi', 'Viktor Frankl', 'Simon Wiesenthal'] },
{ c: 'Science, Letters & Ideas', t: 3, q: 'Which Dutch draper ground his own lenses and reported the little animals swimming in pond water and tooth scrapings?', a: 'Antonie van Leeuwenhoek', d: ['Jan Swammerdam', 'Marcello Malpighi', 'Nehemiah Grew'] },
{ c: 'Books & Authors', t: 3, q: 'Which author wrote a book of letters of advice from a senior devil to his nephew, a junior tempter?', a: 'C. S. Lewis', d: ['G. K. Chesterton', 'Dorothy L. Sayers', 'Charles Williams'] },
{ c: 'Screen Lines', t: 3, q: 'Which character in True Detective says that someone once told him time is a flat circle?', a: 'Rust Cohle', d: ['Marty Hart', 'Errol Childress', 'Maggie Hart'] },

{ c: 'Presidents & Politics', t: 4, q: 'Which outgoing president told his successor in 1861 that if he was as happy entering the White House as its occupant was to return to Wheatland, he was a happy man?', a: 'James Buchanan', d: ['Franklin Pierce', 'Millard Fillmore', 'Andrew Johnson'] },
{ c: 'History & War', t: 4, q: 'Which Munich student told the court that condemned her in 1943 that many agreed with what she had written but did not dare say so?', a: 'Sophie Scholl', d: ['Hans Scholl', 'Traute Lafrenz', 'Cato Bontjes van Beek'] },
{ c: 'Science, Letters & Ideas', t: 4, q: 'Which physician traced a deadly London outbreak to one water pump in Soho and had its handle removed?', a: 'John Snow', d: ['William Farr', 'Edwin Chadwick', 'Thomas Southwood Smith'] },
{ c: 'Books & Authors', t: 4, q: 'Which poet wrote of a stately pleasure-dome decreed in Xanadu and claimed he was interrupted by a visitor from Porlock?', a: 'Samuel Taylor Coleridge', d: ['Robert Southey', 'Charles Lamb', 'Leigh Hunt'] },
{ c: 'Screen Lines', t: 4, q: 'Which character in Parasite drills the cover-story jingle "Jessica, only child, Illinois, Chicago" into her head on the way to the job?', a: 'Kim Ki-jung', d: ['Kim Ki-woo', 'Park Da-hye', 'Kim Chung-sook'] },

{ c: 'Presidents & Politics', t: 5, q: 'Which senator argued at Freeport in 1858 that a territory could exclude slavery by simply declining to protect it?', a: 'Stephen A. Douglas', d: ['Lewis Cass', 'John C. Breckinridge', 'Jefferson Davis'] },
{ c: 'History & War', t: 5, q: 'Which German pastor, hanged at Flossenburg in 1945, wrote that when Christ calls a man, he bids him come and die?', a: 'Dietrich Bonhoeffer', d: ['Martin Niemoller', 'Karl Barth', 'Alfred Delp'] },
{ c: 'Science, Letters & Ideas', t: 5, q: 'Which bacteriologist laid down the four conditions a microbe must meet to be judged the cause of a disease?', a: 'Robert Koch', d: ['Emil von Behring', 'Paul Ehrlich', 'Ferdinand Cohn'] },
{ c: 'Books & Authors', t: 5, q: 'Which Soviet novelist wrote a Stalingrad epic that the KGB confiscated, telling him it could not be published for two hundred years?', a: 'Vasily Grossman', d: ['Vladimir Voinovich', 'Yuri Trifonov', 'Konstantin Simonov'] },
{ c: 'Screen Lines', t: 5, q: 'Which character in Spotlight says that if it takes a village to raise a child, it takes a village to abuse one?', a: 'Mitchell Garabedian', d: ['Walter Robinson', 'Michael Rezendes', 'Marty Baron'] },
],

// ── Day 69 ──────────────────────────────────────────────────────────────
[
{ c: 'Presidents & Politics', t: 1, q: 'Which president is remembered as the father of the Constitution for his work at the 1787 convention?', a: 'James Madison', d: ['George Washington', 'Alexander Hamilton', 'John Jay'] },
{ c: 'History & War', t: 1, q: 'Which English monarch was forced by his barons to put his seal to Magna Carta at Runnymede in 1215?', a: 'King John', d: ['Henry III', 'Richard I', 'Edward I'] },
{ c: 'Science, Letters & Ideas', t: 1, q: 'Which American painter turned inventor gave the telegraph its alphabet of dots and dashes?', a: 'Samuel Morse', d: ['Alexander Bain', 'Joseph Henry', 'Charles Wheatstone'] },
{ c: 'Books & Authors', t: 1, q: 'Which author wrote about a girl from District 12 who volunteers to fight in a televised arena?', a: 'Suzanne Collins', d: ['Veronica Roth', 'Scott Westerfeld', 'James Dashner'] },
{ c: 'Screen Lines', t: 1, q: 'Which character in Frozen introduces himself to Anna and Kristoff by saying that he likes warm hugs?', a: 'Olaf', d: ['Kristoff', 'Sven', 'Marshmallow'] },

{ c: 'Presidents & Politics', t: 2, q: 'Which Kentucky senator earned the nickname the Great Compromiser for brokering the deals of 1820 and 1850?', a: 'Henry Clay', d: ['Daniel Webster', 'John C. Calhoun', 'Thomas Hart Benton'] },
{ c: 'History & War', t: 2, q: 'Which English king spent almost his whole reign away on crusade or held for ransom in Germany?', a: 'Richard I', d: ['Edward I', 'Henry II', 'Stephen'] },
{ c: 'Science, Letters & Ideas', t: 2, q: 'Which German physicist made and detected electromagnetic waves in his laboratory and has the unit of frequency named for him?', a: 'Heinrich Hertz', d: ['Oliver Lodge', 'Edouard Branly', 'Augusto Righi'] },
{ c: 'Books & Authors', t: 2, q: 'Which playwright wrote both \'The Glass Menagerie\' and \'Cat on a Hot Tin Roof\'?', a: 'Tennessee Williams', d: ['Arthur Miller', 'William Inge', 'Edward Albee'] },
{ c: 'Screen Lines', t: 2, q: 'Which character in the BBC\'s modern-day Baker Street series corrects Anderson by insisting he is not a psychopath but a high-functioning sociopath?', a: 'Sherlock Holmes', d: ['John Watson', 'Mycroft Holmes', 'Jim Moriarty'] },

{ c: 'Presidents & Politics', t: 3, q: 'Which president answered nullifiers at an 1830 dinner with the toast that the federal union must be preserved?', a: 'Andrew Jackson', d: ['Martin Van Buren', 'James Monroe', 'John Quincy Adams'] },
{ c: 'History & War', t: 3, q: 'Which king won at Agincourt in 1415 with an army wasted by dysentery and outnumbered on the day?', a: 'Henry V', d: ['Edward III', 'Henry IV', 'Richard II'] },
{ c: 'Science, Letters & Ideas', t: 3, q: 'Which engineer predicted in 1965 that the number of components on a chip would keep doubling on a regular schedule?', a: 'Gordon Moore', d: ['Robert Noyce', 'Jack Kilby', 'Andy Grove'] },
{ c: 'Books & Authors', t: 3, q: 'Which character in The Crucible tears up his confession, demanding that they leave him his name?', a: 'John Proctor', d: ['Reverend Hale', 'Giles Corey', 'Reverend Parris'] },
{ c: 'Screen Lines', t: 3, q: 'Which character opens the HBO miniseries Chernobyl by asking what the cost of lies is?', a: 'Valery Legasov', d: ['Boris Shcherbina', 'Ulana Khomyuk', 'Anatoly Dyatlov'] },

{ c: 'Presidents & Politics', t: 4, q: 'Which vice president established that a successor takes the full office, not merely its duties, on the death of a president?', a: 'John Tyler', d: ['Millard Fillmore', 'Andrew Johnson', 'Chester A. Arthur'] },
{ c: 'History & War', t: 4, q: 'Whose Chronicles are the great narrative source for the first half of the Hundred Years War?', a: 'Jean Froissart', d: ['Enguerrand de Monstrelet', 'Geoffroi de Charny', 'Philippe de Commines'] },
{ c: 'Science, Letters & Ideas', t: 4, q: 'Which mathematician showed that any message can be measured in bits and founded information theory?', a: 'Claude Shannon', d: ['Norbert Wiener', 'Ralph Hartley', 'Harry Nyquist'] },
{ c: 'Books & Authors', t: 4, q: 'Which novelist wrote \'Wise Blood\' and a story in which a grandmother meets an escaped convict called the Misfit?', a: 'Flannery O\'Connor', d: ['Eudora Welty', 'Katherine Anne Porter', 'Caroline Gordon'] },
{ c: 'Screen Lines', t: 4, q: 'Which character in Rogue One repeats the mantra "I am one with the Force, the Force is with me"?', a: 'Chirrut Imwe', d: ['Baze Malbus', 'Jyn Erso', 'Bodhi Rook'] },

{ c: 'Presidents & Politics', t: 5, q: 'Which senator wrecked his standing in Massachusetts with a March 1850 speech supporting the compromise and its fugitive slave law?', a: 'Daniel Webster', d: ['Charles Sumner', 'William Seward', 'Salmon P. Chase'] },
{ c: 'History & War', t: 5, q: 'Which Byzantine princess wrote a history of her father\'s reign and of the crusaders who passed through his capital?', a: 'Anna Komnene', d: ['Theodora Porphyrogenita', 'Zoe Porphyrogenita', 'Irene Doukaina'] },
{ c: 'Science, Letters & Ideas', t: 5, q: 'Which wartime science administrator imagined a desk called the memex that would link documents by association?', a: 'Vannevar Bush', d: ['Douglas Engelbart', 'Ted Nelson', 'J. C. R. Licklider'] },
{ c: 'Books & Authors', t: 5, q: 'Which Japanese novelist opened a book with a train coming out of a long tunnel into snow country?', a: 'Yasunari Kawabata', d: ['Osamu Dazai', 'Kobo Abe', 'Shusaku Endo'] },
{ c: 'Screen Lines', t: 5, q: 'Which character tells Agent Cooper in a dream that the gum he likes is going to come back in style?', a: 'The Man from Another Place', d: ['Laura Palmer', 'The Giant', 'BOB'] },
],

// ── Day 70 ──────────────────────────────────────────────────────────────
[
{ c: 'Presidents & Politics', t: 1, q: 'Which suffrage campaigner was tried for voting illegally in 1872 and later appeared on a United States dollar coin?', a: 'Susan B. Anthony', d: ['Lucretia Mott', 'Julia Ward Howe', 'Lucy Stone'] },
{ c: 'History & War', t: 1, q: 'Which Roman emperor had a fortified wall built right across northern Britain?', a: 'Hadrian', d: ['Septimius Severus', 'Claudius', 'Antoninus Pius'] },
{ c: 'Science, Letters & Ideas', t: 1, q: 'Which French painter spent his last decades painting the lily pond in his garden at Giverny?', a: 'Claude Monet', d: ['Camille Pissarro', 'Alfred Sisley', 'Pierre-Auguste Renoir'] },
{ c: 'Books & Authors', t: 1, q: 'Which author wrote the novels about Bella Swan and a vampire family in Forks, Washington?', a: 'Stephenie Meyer', d: ['Cassandra Clare', 'Veronica Roth', 'Rick Riordan'] },
{ c: 'Screen Lines', t: 1, q: 'Which character coaching AFC Richmond tells a player to be a goldfish, the happiest animal on earth?', a: 'Ted Lasso', d: ['Coach Beard', 'Roy Kent', 'Nathan Shelley'] },

{ c: 'Presidents & Politics', t: 2, q: 'Which organizer of the 1848 Seneca Falls convention wrote a declaration holding that all men and women are created equal?', a: 'Elizabeth Cady Stanton', d: ['Lucretia Mott', 'Martha Coffin Wright', 'Amelia Bloomer'] },
{ c: 'History & War', t: 2, q: 'Which emperor recorded his conquest of Dacia in a spiral of carvings around a column in Rome?', a: 'Trajan', d: ['Marcus Aurelius', 'Domitian', 'Hadrian'] },
{ c: 'Science, Letters & Ideas', t: 2, q: 'Which surgeon performed the first human-to-human heart transplant, in Cape Town in 1967?', a: 'Christiaan Barnard', d: ['Michael DeBakey', 'Norman Shumway', 'Denton Cooley'] },
{ c: 'Books & Authors', t: 2, q: 'Which character in Pride and Prejudice has no business in life but getting her five daughters married?', a: 'Mrs. Bennet', d: ['Lady Catherine de Bourgh', 'Charlotte Lucas', 'Mrs. Gardiner'] },
{ c: 'Screen Lines', t: 2, q: 'Which character in Game of Thrones explains his usefulness by saying that he drinks and he knows things?', a: 'Tyrion Lannister', d: ['Jaime Lannister', 'Bronn', 'Varys'] },

{ c: 'Presidents & Politics', t: 3, q: 'Which militant suffragist founded the National Woman\'s Party and drafted an equal rights amendment in 1923?', a: 'Alice Paul', d: ['Carrie Chapman Catt', 'Lucy Burns', 'Harriot Stanton Blatch'] },
{ c: 'History & War', t: 3, q: 'Which Gallic leader is described riding out of Alesia to lay his arms at the feet of the Roman commander?', a: 'Vercingetorix', d: ['Ambiorix', 'Dumnorix', 'Commius'] },
{ c: 'Science, Letters & Ideas', t: 3, q: 'Which philosopher held that we must treat humanity always as an end and never merely as a means?', a: 'Immanuel Kant', d: ['Johann Gottlieb Fichte', 'Christian Wolff', 'Moses Mendelssohn'] },
{ c: 'Books & Authors', t: 3, q: 'Which novelist wrote the ward novel narrated by Chief Bromden and ruled by Nurse Ratched?', a: 'Ken Kesey', d: ['Richard Brautigan', 'Tom Robbins', 'Larry McMurtry'] },
{ c: 'Screen Lines', t: 3, q: 'Which character in Kingsman: The Secret Service says "Manners maketh man" before locking a pub door?', a: 'Harry Hart', d: ['Eggsy Unwin', 'Merlin', 'Gazelle'] },

{ c: 'Presidents & Politics', t: 4, q: 'Which member of Congress, the first woman elected to it, said you can no more win a war than you can win an earthquake?', a: 'Jeannette Rankin', d: ['Margaret Chase Smith', 'Edith Nourse Rogers', 'Hattie Caraway'] },
{ c: 'History & War', t: 4, q: 'Which Roman admiral and naturalist told his helmsman that fortune favors the brave as he steered toward the eruption that killed him?', a: 'Pliny the Elder', d: ['Pliny the Younger', 'Seneca the Elder', 'Columella'] },
{ c: 'Science, Letters & Ideas', t: 4, q: 'Which essayist wrote that everyone holds dual citizenship, in the kingdom of the well and the kingdom of the sick?', a: 'Susan Sontag', d: ['Adrienne Rich', 'Elizabeth Hardwick', 'Mary McCarthy'] },
{ c: 'Books & Authors', t: 4, q: 'Which German novelist sent Hans Castorp for a three-week visit to an Alpine sanatorium that lasted seven years?', a: 'Thomas Mann', d: ['Heinrich Boll', 'Jakob Wassermann', 'Stefan Zweig'] },
{ c: 'Screen Lines', t: 4, q: 'Which character in Hidden Figures declares that everyone at NASA urinates the same color as he tears down a segregated bathroom sign?', a: 'Al Harrison', d: ['Paul Stafford', 'Karl Zielinski', 'John Glenn'] },

{ c: 'Presidents & Politics', t: 5, q: 'Which broker and newspaper publisher became the first woman nominated for the American presidency, in 1872?', a: 'Victoria Woodhull', d: ['Belva Lockwood', 'Tennessee Claflin', 'Anna Dickinson'] },
{ c: 'History & War', t: 5, q: 'Which Roman senator wrote an eighty-book history of Rome in Greek, covering everything from Aeneas to his own consulship?', a: 'Cassius Dio', d: ['Herodian', 'Appian', 'Dionysius of Halicarnassus'] },
{ c: 'Science, Letters & Ideas', t: 5, q: 'Which critic wrote that there is no document of civilization which is not at the same time a document of barbarism?', a: 'Walter Benjamin', d: ['Theodor Adorno', 'Max Horkheimer', 'Ernst Bloch'] },
{ c: 'Books & Authors', t: 5, q: 'Which novelist invented an elite academy in Castalia devoted to a game played with all the ideas of human culture?', a: 'Hermann Hesse', d: ['Ernst Junger', 'Arno Schmidt', 'Alfred Andersch'] },
{ c: 'Screen Lines', t: 5, q: 'Which character in The Big Short berates two young investors for dancing after they bet against the housing market?', a: 'Ben Rickert', d: ['Mark Baum', 'Jared Vennett', 'Michael Burry'] },
],

// ── Day 71 ──────────────────────────────────────────────────────────────
[
{ c: 'Presidents & Politics', t: 1, q: 'Who took office in 1966 as the first woman to serve as prime minister of India?', a: 'Indira Gandhi', d: ['Sarojini Naidu', 'Vijaya Lakshmi Pandit', 'Sucheta Kripalani'] },
{ c: 'History & War', t: 1, q: 'Which British monarch gave her name to an age and reigned for more than sixty years, until 1901?', a: 'Victoria', d: ['Elizabeth I', 'Anne', 'Adelaide'] },
{ c: 'Science, Letters & Ideas', t: 1, q: 'Which Athenian philosopher left no writings of his own and is known through his pupils?', a: 'Socrates', d: ['Thales', 'Pythagoras', 'Empedocles'] },
{ c: 'Books & Authors', t: 1, q: 'Which character is carried from a Kansas farm to Oz by a cyclone, along with her dog?', a: 'Dorothy Gale', d: ['Glinda', 'Aunt Em', 'The Wicked Witch of the West'] },
{ c: 'Screen Lines', t: 1, q: 'Which character tells Tony Stark "I don\'t feel so good" as he begins to disintegrate in Avengers: Infinity War?', a: 'Peter Parker', d: ['Doctor Strange', 'Star-Lord', 'Drax'] },

{ c: 'Presidents & Politics', t: 2, q: 'Which Liberal leader served as Australia\'s prime minister for more than sixteen years across two spells?', a: 'Robert Menzies', d: ['Ben Chifley', 'John Curtin', 'Harold Holt'] },
{ c: 'History & War', t: 2, q: 'Which prime minister came home from the Congress of Berlin in 1878 announcing peace with honor?', a: 'Benjamin Disraeli', d: ['William Gladstone', 'Lord Salisbury', 'Lord Palmerston'] },
{ c: 'Science, Letters & Ideas', t: 2, q: 'Which teacher, asked for a single word to live by, offered reciprocity: do not do to others what you do not want done to you?', a: 'Confucius', d: ['Mencius', 'Xunzi', 'Mozi'] },
{ c: 'Books & Authors', t: 2, q: 'Which author wrote both \'East of Eden\' and \'Cannery Row\'?', a: 'John Steinbeck', d: ['William Saroyan', 'Sinclair Lewis', 'Erskine Caldwell'] },
{ c: 'Screen Lines', t: 2, q: 'Which character says goodbye to Buzz Lightyear with the words "So long, partner" at the end of Toy Story 4?', a: 'Woody', d: ['Bo Peep', 'Forky', 'Jessie'] },

{ c: 'Presidents & Politics', t: 3, q: 'Which dismissed prime minister told a Canberra crowd in 1975 that nothing would save the governor-general?', a: 'Gough Whitlam', d: ['Malcolm Fraser', 'Bob Hawke', 'Billy Snedden'] },
{ c: 'History & War', t: 3, q: 'Which Ethiopian emperor destroyed an invading Italian army at Adwa in 1896?', a: 'Menelik II', d: ['Yohannes IV', 'Tewodros II', 'Ras Alula'] },
{ c: 'Science, Letters & Ideas', t: 3, q: 'Which philosopher argued that legitimate government rests on the consent of the governed and may be dissolved if it breaks that trust?', a: 'John Locke', d: ['Thomas Hobbes', 'Algernon Sidney', 'James Harrington'] },
{ c: 'Books & Authors', t: 3, q: 'Which character in Oliver Twist is the housebreaker who murders Nancy and dies by his own rope on a rooftop while the mob closes in?', a: 'Bill Sikes', d: ['Monks', 'Noah Claypole', 'Toby Crackit'] },
{ c: 'Screen Lines', t: 3, q: 'Which character in Jordan Peele\'s Us answers the question of what her family is with the words \'We\'re Americans\'?', a: 'Red', d: ['Zora Wilson', 'Umbrae', 'Pluto'] },

{ c: 'Presidents & Politics', t: 4, q: 'Which Australian treasurer defended a 1990 downturn as the recession the country had to have?', a: 'Paul Keating', d: ['John Howard', 'Peter Costello', 'Bob Hawke'] },
{ c: 'History & War', t: 4, q: 'Which conqueror of Bengal told a parliamentary inquiry that he stood astonished at his own moderation?', a: 'Robert Clive', d: ['Warren Hastings', 'Eyre Coote', 'Richard Wellesley'] },
{ c: 'Science, Letters & Ideas', t: 4, q: 'Which philosopher asked what rules people would choose if they did not know who they would be in the society?', a: 'John Rawls', d: ['Ronald Dworkin', 'Thomas Scanlon', 'Brian Barry'] },
{ c: 'Books & Authors', t: 4, q: 'Which French poet was prosecuted for obscenity in 1857 over a collection he called the flowers of evil?', a: 'Charles Baudelaire', d: ['Paul Verlaine', 'Alfred de Vigny', 'Stephane Mallarme'] },
{ c: 'Screen Lines', t: 4, q: 'Which character on 30 Rock advises never going with a hippie to a second location?', a: 'Jack Donaghy', d: ['Liz Lemon', 'Tracy Jordan', 'Kenneth Parcell'] },

{ c: 'Presidents & Politics', t: 5, q: 'Which New Zealand prime minister told an Oxford Union debate in 1985 that he could smell the uranium on his opponent\'s breath?', a: 'David Lange', d: ['Robert Muldoon', 'Norman Kirk', 'Geoffrey Palmer'] },
{ c: 'History & War', t: 5, q: 'The one-word dispatch \'Peccavi\' after the conquest of Sindh is credited to General Charles Napier, who never sent it. Which humorous magazine printed the joke?', a: 'Punch', d: ['The Spectator', 'Blackwood\'s Magazine', 'The Illustrated London News'] },
{ c: 'Science, Letters & Ideas', t: 5, q: 'Which philosopher argued in 1974 that only a minimal state, limited to protection against force and fraud, can be justified?', a: 'Robert Nozick', d: ['Murray Rothbard', 'Isaiah Berlin', 'Michael Oakeshott'] },
{ c: 'Books & Authors', t: 5, q: 'Which Portuguese poet wrote under a crowd of invented alter egos and left an unfinished book of disquiet in a trunk?', a: 'Fernando Pessoa', d: ['Eugenio de Andrade', 'Sophia de Mello Breyner Andresen', 'Cesario Verde'] },
{ c: 'Screen Lines', t: 5, q: 'Which character on Breaking Bad, kneeling in the desert, tells Walter White that he is the smartest man he ever met but too stupid to see the decision was made ten minutes ago?', a: 'Hank Schrader', d: ['Steve Gomez', 'Jesse Pinkman', 'Saul Goodman'] },
],

// ── Day 72 ──────────────────────────────────────────────────────────────
[
{ c: 'Presidents & Politics', t: 1, q: 'Which Soviet leader met Kennedy at the 1961 Vienna summit and approved the building of the Berlin Wall that August?', a: 'Nikita Khrushchev', d: ['Leonid Brezhnev', 'Walter Ulbricht', 'Andrei Gromyko'] },
{ c: 'History & War', t: 1, q: 'Which Aztec ruler received Cortes and his men into Tenochtitlan in 1519?', a: 'Moctezuma II', d: ['Cuauhtemoc', 'Cuitlahuac', 'Ahuitzotl'] },
{ c: 'Science, Letters & Ideas', t: 1, q: 'Which Italian painted the mural of the Last Supper on a Milan refectory wall?', a: 'Leonardo da Vinci', d: ['Andrea del Castagno', 'Domenico Ghirlandaio', 'Perugino'] },
{ c: 'Books & Authors', t: 1, q: 'Which poet is traditionally credited with both the siege of Troy epic and the long voyage home that follows it?', a: 'Homer', d: ['Hesiod', 'Virgil', 'Ovid'] },
{ c: 'Screen Lines', t: 1, q: 'Which character in Big Hero 6 introduces himself as a personal healthcare companion?', a: 'Baymax', d: ['Hiro Hamada', 'Tadashi Hamada', 'Fred'] },

{ c: 'Presidents & Politics', t: 2, q: 'Which prime minister told listeners by radio in September 1939 that no undertaking had been received and his country was at war with Germany?', a: 'Neville Chamberlain', d: ['Winston Churchill', 'Lord Halifax', 'Stanley Baldwin'] },
{ c: 'History & War', t: 2, q: 'Which parish priest rang his church bell at Dolores in 1810 and called Mexicans to rise against Spain?', a: 'Miguel Hidalgo', d: ['Jose Maria Morelos', 'Agustin de Iturbide', 'Vicente Guerrero'] },
{ c: 'Science, Letters & Ideas', t: 2, q: 'Which British physicist proposed in 1964 the field that gives particles their mass, confirmed by a boson found at CERN in 2012?', a: 'Peter Higgs', d: ['Steven Weinberg', 'Abdus Salam', 'Sheldon Glashow'] },
{ c: 'Books & Authors', t: 2, q: 'Which Spanish author sent an aging reader of chivalric romances out to right wrongs on a bony horse?', a: 'Miguel de Cervantes', d: ['Lope de Vega', 'Francisco de Quevedo', 'Tirso de Molina'] },
{ c: 'Screen Lines', t: 2, q: 'Which character shouts "Not my daughter!" before dueling Bellatrix Lestrange in the last Harry Potter film?', a: 'Molly Weasley', d: ['Minerva McGonagall', 'Ginny Weasley', 'Nymphadora Tonks'] },

{ c: 'Presidents & Politics', t: 3, q: 'Which Senate majority leader organized the reservations that kept the United States out of the League of Nations?', a: 'Henry Cabot Lodge', d: ['William Borah', 'Hiram Johnson', 'Philander Knox'] },
{ c: 'History & War', t: 3, q: 'Which general marched an army across the Andes to break Spanish power in Chile and Peru?', a: 'Jose de San Martin', d: ['Simon Bolivar', 'Bernardo O\'Higgins', 'Manuel Belgrano'] },
{ c: 'Science, Letters & Ideas', t: 3, q: 'Which mathematician defined the equilibrium in which no player gains by changing strategy alone?', a: 'John Nash', d: ['John von Neumann', 'Lloyd Shapley', 'Reinhard Selten'] },
{ c: 'Books & Authors', t: 3, q: 'Which character in Moby-Dick is the Quaker first mate who argues that vengeance on a dumb brute is blasphemy?', a: 'Starbuck', d: ['Stubb', 'Flask', 'Fedallah'] },
{ c: 'Screen Lines', t: 3, q: 'Which character in Get Out taps a teaspoon against a teacup and tells a guest to sink into the floor?', a: 'Missy Armitage', d: ['Dean Armitage', 'Rose Armitage', 'Jeremy Armitage'] },

{ c: 'Presidents & Politics', t: 4, q: 'Which American secretary of state won a Nobel Prize for the 1928 pact renouncing war as an instrument of national policy?', a: 'Frank Kellogg', d: ['Charles Evans Hughes', 'Henry Stimson', 'Elihu Root'] },
{ c: 'History & War', t: 4, q: 'Which Mexican revolutionary raided Columbus, New Mexico in 1916 and drew a US punitive expedition after him?', a: 'Pancho Villa', d: ['Emiliano Zapata', 'Venustiano Carranza', 'Alvaro Obregon'] },
{ c: 'Science, Letters & Ideas', t: 4, q: 'Which physicist ruled that no two electrons in an atom may share the same set of quantum numbers?', a: 'Wolfgang Pauli', d: ['Arnold Sommerfeld', 'Max Born', 'Pascual Jordan'] },
{ c: 'Books & Authors', t: 4, q: 'Which French poet wrote a season in hell before he was twenty and then abandoned poetry for trading in Africa?', a: 'Arthur Rimbaud', d: ['Tristan Corbiere', 'Jules Laforgue', 'Gerard de Nerval'] },
{ c: 'Screen Lines', t: 4, q: 'Which character in The Wire keeps insisting to McNulty that all the pieces matter?', a: 'Lester Freamon', d: ['Cedric Daniels', 'Bunk Moreland', 'Roland Pryzbylewski'] },

{ c: 'Presidents & Politics', t: 5, q: 'Which South African prime minister helped draft the covenant of the League of Nations and the preamble of the United Nations charter?', a: 'Jan Smuts', d: ['Louis Botha', 'J. B. M. Hertzog', 'D. F. Malan'] },
{ c: 'History & War', t: 5, q: 'Which Habsburg archduke, put on a New World throne by French bayonets and shot at Queretaro in 1867, used his last breath to cheer that country and its independence?', a: 'Maximilian I of Mexico', d: ['Miguel Miramon', 'Tomas Mejia', 'Agustin de Iturbide'] },
{ c: 'Science, Letters & Ideas', t: 5, q: 'Which astrophysicist calculated the maximum mass a white dwarf can have before it collapses?', a: 'Subrahmanyan Chandrasekhar', d: ['Arthur Eddington', 'Lev Landau', 'Fritz Zwicky'] },
{ c: 'Books & Authors', t: 5, q: 'Which novelist won the Nobel for a chronicle of four centuries around a bridge on the Drina?', a: 'Ivo Andric', d: ['Milos Crnjanski', 'Mesa Selimovic', 'Miroslav Krleza'] },
{ c: 'Screen Lines', t: 5, q: 'Which character on Mad Men introduces herself to the copywriters in the office and announces that she wants to smoke some marijuana?', a: 'Peggy Olson', d: ['Joan Holloway', 'Betty Draper', 'Megan Calvet'] },
],

// ── Day 73 ──────────────────────────────────────────────────────────────
[
{ c: 'Presidents & Politics', t: 1, q: 'Which president issued the proclamation of January 1863 declaring enslaved people in the rebelling states free?', a: 'Abraham Lincoln', d: ['Andrew Johnson', 'Ulysses S. Grant', 'James Buchanan'] },
{ c: 'History & War', t: 1, q: 'Which Scottish king beat a much larger English army at Bannockburn in 1314?', a: 'Robert the Bruce', d: ['William Wallace', 'David II', 'John Balliol'] },
{ c: 'Science, Letters & Ideas', t: 1, q: 'Whose Elements served as the standard geometry textbook for more than two thousand years?', a: 'Euclid', d: ['Apollonius of Perga', 'Eudoxus', 'Menaechmus'] },
{ c: 'Books & Authors', t: 1, q: 'Which author wrote both \'The Lorax\' and \'Oh, the Places You\'ll Go!\'?', a: 'Dr. Seuss', d: ['Shel Silverstein', 'Bill Peet', 'Crockett Johnson'] },
{ c: 'Screen Lines', t: 1, q: 'Which character in Despicable Me squeals that a fluffy unicorn is so fluffy she is going to die?', a: 'Agnes', d: ['Edith', 'Margo', 'Gru'] },

{ c: 'Presidents & Politics', t: 2, q: 'Which Ghanaian diplomat led the United Nations from 1997 and shared the 2001 Nobel Peace Prize with the organization?', a: 'Kofi Annan', d: ['Boutros Boutros-Ghali', 'Ban Ki-moon', 'U Thant'] },
{ c: 'History & War', t: 2, q: 'Which Scot won at Stirling Bridge in 1297 and was hanged, drawn and quartered in London eight years later?', a: 'William Wallace', d: ['Andrew Moray', 'James Douglas', 'Simon Fraser'] },
{ c: 'Science, Letters & Ideas', t: 2, q: 'Which mathematician argued that betting on the existence of God is rational because the possible gain is infinite?', a: 'Blaise Pascal', d: ['Rene Descartes', 'Antoine Arnauld', 'Nicolas Malebranche'] },
{ c: 'Books & Authors', t: 2, q: 'Which author wrote \'The Prince and the Pauper\' and sent a Connecticut engineer back to the court of King Arthur?', a: 'Mark Twain', d: ['Bret Harte', 'George Washington Cable', 'Joel Chandler Harris'] },
{ c: 'Screen Lines', t: 2, q: 'Which character in Quentin Tarantino\'s 2012 Western explains that the D in his name is silent?', a: 'Django Freeman', d: ['Calvin Candie', 'Dr. King Schultz', 'Stephen'] },

{ c: 'Presidents & Politics', t: 3, q: 'Which detainee of the Mau Mau emergency became the first president of independent Kenya?', a: 'Jomo Kenyatta', d: ['Tom Mboya', 'Oginga Odinga', 'Daniel arap Moi'] },
{ c: 'History & War', t: 3, q: 'Which 1320 letter from the Scottish barons to the Pope insisted that they fought not for glory or riches but for freedom alone?', a: 'The Declaration of Arbroath', d: ['The Treaty of Northampton', 'The Ragman Rolls', 'The National Covenant'] },
{ c: 'Science, Letters & Ideas', t: 3, q: 'Which librarian of Alexandria measured the size of the Earth using shadows at two Egyptian cities?', a: 'Eratosthenes', d: ['Hipparchus', 'Posidonius', 'Ptolemy'] },
{ c: 'Books & Authors', t: 3, q: 'Which character in Romeo and Juliet marries the lovers in secret and supplies the sleeping potion?', a: 'Friar Laurence', d: ['The Apothecary', 'Prince Escalus', 'Friar John'] },
{ c: 'Screen Lines', t: 3, q: 'Which character in The Good Place works out the twist and shouts that this is the Bad Place?', a: 'Eleanor Shellstrop', d: ['Chidi Anagonye', 'Tahani Al-Jamil', 'Jason Mendoza'] },

{ c: 'Presidents & Politics', t: 4, q: 'Which Tanzanian leader told his country in 1961 that it must run while others walk?', a: 'Julius Nyerere', d: ['Kenneth Kaunda', 'Milton Obote', 'Jomo Kenyatta'] },
{ c: 'History & War', t: 4, q: 'Which imprisoned Stuart monarch took as her motto the line that in her end was her beginning, and had it embroidered on her cloth of state?', a: 'Mary, Queen of Scots', d: ['Margaret of Anjou', 'Margaret Tudor', 'Catherine of Aragon'] },
{ c: 'Science, Letters & Ideas', t: 4, q: 'Which mathematician and Neoplatonist teacher of Alexandria was murdered by a mob in 415?', a: 'Hypatia', d: ['Theon of Alexandria', 'Pandrosion', 'Sosipatra'] },
{ c: 'Books & Authors', t: 4, q: 'Which Italian chemist wrote a memoir of his year in Auschwitz that asks the reader to consider whether this is a man?', a: 'Primo Levi', d: ['Giorgio Bassani', 'Carlo Levi', 'Natalia Ginzburg'] },
{ c: 'Screen Lines', t: 4, q: 'Which character in Game of Thrones tells Varys that chaos is a ladder?', a: 'Petyr Baelish', d: ['Tywin Lannister', 'Grand Maester Pycelle', 'Qyburn'] },

{ c: 'Presidents & Politics', t: 5, q: 'Which president of Burkina Faso said that revolutionaries can be murdered but ideas cannot be killed?', a: 'Thomas Sankara', d: ['Blaise Compaore', 'Modibo Keita', 'Ahmed Sekou Toure'] },
{ c: 'History & War', t: 5, q: 'Which Jacobite claimant, urged on landing in 1745 to go home, is said to have replied that he was come home?', a: 'Charles Edward Stuart', d: ['James Francis Edward Stuart', 'Lord George Murray', 'Cameron of Lochiel'] },
{ c: 'Science, Letters & Ideas', t: 5, q: 'Which scholar of Basra argued in his Book of Optics that we see because light enters the eye, not because rays leave it?', a: 'Ibn al-Haytham', d: ['Al-Kindi', 'Avicenna', 'Al-Farabi'] },
{ c: 'Books & Authors', t: 5, q: 'Which Russian novelist gave his hero a hundred opening pages spent refusing to get out of bed?', a: 'Ivan Goncharov', d: ['Ivan Turgenev', 'Nikolai Leskov', 'Mikhail Saltykov-Shchedrin'] },
{ c: 'Screen Lines', t: 5, q: 'Which character in The Menu tells his diners that they will eat less than they desire and more than they deserve?', a: 'Julian Slowik', d: ['Margot Mills', 'Lillian Bloom', 'Tyler Ledford'] },
],

// ── Day 74 ──────────────────────────────────────────────────────────────
[
{ c: 'Presidents & Politics', t: 1, q: 'Which president admitted that arms had been sold to Iran and the proceeds diverted to Nicaraguan rebels?', a: 'Ronald Reagan', d: ['George H. W. Bush', 'Jimmy Carter', 'Gerald Ford'] },
{ c: 'History & War', t: 1, q: 'Which British king was on the throne when the American colonies were lost?', a: 'George III', d: ['George II', 'George IV', 'William IV'] },
{ c: 'Science, Letters & Ideas', t: 1, q: 'Which French chemist saved a boy bitten by a rabid dog with a course of injections in 1885?', a: 'Louis Pasteur', d: ['Emile Roux', 'Robert Koch', 'Joseph Lister'] },
{ c: 'Books & Authors', t: 1, q: 'Which author wrote \'James and the Giant Peach\' and \'Fantastic Mr Fox\'?', a: 'Roald Dahl', d: ['Astrid Lindgren', 'Norton Juster', 'Eva Ibbotson'] },
{ c: 'Screen Lines', t: 1, q: 'Which character declares "I am inevitable" before snapping his fingers in Avengers: Endgame?', a: 'Thanos', d: ['Ebony Maw', 'Corvus Glaive', 'Nebula'] },

{ c: 'Presidents & Politics', t: 2, q: 'Which nominee called in 1988 for a kinder, gentler nation?', a: 'George H. W. Bush', d: ['Bob Dole', 'Michael Dukakis', 'Dan Quayle'] },
{ c: 'History & War', t: 2, q: 'Which Japanese swordsman wrote a treatise on strategy divided into five books named for the elements?', a: 'Miyamoto Musashi', d: ['Yagyu Munenori', 'Yamamoto Tsunetomo', 'Takuan Soho'] },
{ c: 'Science, Letters & Ideas', t: 2, q: 'Which Canadian doctor, working with Charles Best in Toronto, isolated the hormone that treats diabetes?', a: 'Frederick Banting', d: ['Oskar Minkowski', 'Paul Langerhans', 'Ernest Starling'] },
{ c: 'Books & Authors', t: 2, q: 'Which author wrote the story of a farm girl, a scarecrow, a tin woodman and a cowardly lion on a road of yellow brick?', a: 'L. Frank Baum', d: ['Howard Pyle', 'Frank Stockton', 'Palmer Cox'] },
{ c: 'Screen Lines', t: 2, q: 'Which character in Todd Phillips\'s Joker tells a talk show host on live television that you get what you deserve?', a: 'Arthur Fleck', d: ['Murray Franklin', 'Thomas Wayne', 'Randall'] },

{ c: 'Presidents & Politics', t: 3, q: 'Which House leader campaigned in 1994 on a ten-point Contract with America?', a: 'Newt Gingrich', d: ['Dick Armey', 'Bob Michel', 'Tom DeLay'] },
{ c: 'History & War', t: 3, q: 'Which Japanese admiral hoisted a signal at Tsushima in 1905 saying the fate of the empire rested on that one battle?', a: 'Heihachiro Togo', d: ['Hiroyasu Fushimi', 'Sukeyuki Ito', 'Kamimura Hikonojo'] },
{ c: 'Science, Letters & Ideas', t: 3, q: 'Which anatomist corrected Galen by dissecting human bodies himself and published the result in 1543?', a: 'Andreas Vesalius', d: ['Ambroise Pare', 'Gabriele Falloppio', 'Realdo Colombo'] },
{ c: 'Books & Authors', t: 3, q: 'Which novelist gave his teenage narrator an invented slang called Nadsat and a taste for Beethoven and violence?', a: 'Anthony Burgess', d: ['J. G. Ballard', 'Kingsley Amis', 'Brian Aldiss'] },
{ c: 'Screen Lines', t: 3, q: 'Which character in Parks and Recreation advises never half-assing two things, but whole-assing one thing?', a: 'Ron Swanson', d: ['Leslie Knope', 'Tom Haverford', 'Jerry Gergich'] },

{ c: 'Presidents & Politics', t: 4, q: 'Which secretary of state called the United States the indispensable nation in a 1998 television interview?', a: 'Madeleine Albright', d: ['Condoleezza Rice', 'Warren Christopher', 'Cyrus Vance'] },
{ c: 'History & War', t: 4, q: 'Which Chinese ruler replied to a British embassy in 1793 that his realm possessed all things and had no use for their manufactures?', a: 'The Qianlong Emperor', d: ['The Kangxi Emperor', 'The Yongzheng Emperor', 'The Daoguang Emperor'] },
{ c: 'Science, Letters & Ideas', t: 4, q: 'Which geneticist showed that stretches of DNA can move around the chromosomes of maize?', a: 'Barbara McClintock', d: ['Nettie Stevens', 'Martha Chase', 'Esther Lederberg'] },
{ c: 'Books & Authors', t: 4, q: 'Which novelist opened a book by calling it the saddest story he had ever heard?', a: 'Ford Madox Ford', d: ['Arnold Bennett', 'John Galsworthy', 'George Meredith'] },
{ c: 'Screen Lines', t: 4, q: 'Which character in Knives Out describes the case as a donut hole inside a donut\'s hole?', a: 'Benoit Blanc', d: ['Marta Cabrera', 'Ransom Drysdale', 'Lieutenant Elliott'] },

{ c: 'Presidents & Politics', t: 5, q: 'Which ambassador to the United Nations attacked the San Francisco Democrats at the 1984 Republican convention as people who always blame America first?', a: 'Jeane Kirkpatrick', d: ['Nancy Kassebaum', 'Elizabeth Dole', 'Anne Armstrong'] },
{ c: 'History & War', t: 5, q: 'Which Chinese commissioner wrote to Queen Victoria in 1839 asking where her conscience was in the opium trade?', a: 'Lin Zexu', d: ['Qishan', 'Ye Mingchen', 'Zeng Guofan'] },
{ c: 'Science, Letters & Ideas', t: 5, q: 'Which plant breeder bred short-stemmed high-yield wheat and won a Nobel Peace Prize for feeding hundreds of millions?', a: 'Norman Borlaug', d: ['M. S. Swaminathan', 'Nikolai Vavilov', 'Henry Wallace'] },
{ c: 'Books & Authors', t: 5, q: 'Which Mexican novelist wrote a short book in which a son goes looking for his father in a town of ghosts called Comala?', a: 'Juan Rulfo', d: ['Carlos Fuentes', 'Juan Jose Arreola', 'Agustin Yanez'] },
{ c: 'Screen Lines', t: 5, q: 'Which character in The Witch asks Thomasin whether she would like to live deliciously?', a: 'Black Phillip', d: ['William', 'Katherine', 'Caleb'] },
],

// ── Day 75 ──────────────────────────────────────────────────────────────
[
{ c: 'Presidents & Politics', t: 1, q: 'Who was the youngest man ever elected president of the United States, winning at the age of 43?', a: 'John F. Kennedy', d: ['Theodore Roosevelt', 'Bill Clinton', 'Ulysses S. Grant'] },
{ c: 'History & War', t: 1, q: 'Which San Antonio mission fell to Santa Anna\'s army in 1836 after a siege of thirteen days?', a: 'The Alamo', d: ['Goliad', 'San Jacinto', 'Gonzales'] },
{ c: 'Science, Letters & Ideas', t: 1, q: 'Which deaf and blind American learned to speak with the help of Anne Sullivan and became a famous writer and campaigner?', a: 'Helen Keller', d: ['Laura Bridgman', 'Dorothea Dix', 'Jane Addams'] },
{ c: 'Books & Authors', t: 1, q: 'Which character in a Shakespeare tragedy is the prince\'s mother, who marries his uncle within a month of the funeral?', a: 'Gertrude', d: ['Ophelia', 'Cordelia', 'Desdemona'] },
{ c: 'Screen Lines', t: 1, q: 'Which character in the Fast and Furious films insists that he does not have friends, he has family?', a: 'Dominic Toretto', d: ['Brian O\'Conner', 'Luke Hobbs', 'Roman Pearce'] },

{ c: 'Presidents & Politics', t: 2, q: 'Which nominee ended his 1992 acceptance speech by saying he still believed in a place called Hope?', a: 'Bill Clinton', d: ['Al Gore', 'Paul Tsongas', 'Michael Dukakis'] },
{ c: 'History & War', t: 2, q: 'Which American congressman, beaten on a bridge in Selma as a young man, urged people to get into good trouble, necessary trouble?', a: 'John Lewis', d: ['Andrew Young', 'Julian Bond', 'Hosea Williams'] },
{ c: 'Science, Letters & Ideas', t: 2, q: 'Which meteorologist titled a talk with the question whether a butterfly flapping in Brazil could set off a tornado in Texas?', a: 'Edward Lorenz', d: ['Benoit Mandelbrot', 'Mitchell Feigenbaum', 'Vilhelm Bjerknes'] },
{ c: 'Books & Authors', t: 2, q: 'Which sister in Little Women is the shy pianist who dies after scarlet fever?', a: 'Beth March', d: ['Meg March', 'Amy March', 'Jo March'] },
{ c: 'Screen Lines', t: 2, q: 'Which character in the Adult Swim series about a drunken scientist and his grandson has the catchphrase "Wubba lubba dub dub"?', a: 'Rick Sanchez', d: ['Morty Smith', 'Jerry Smith', 'Birdperson'] },

{ c: 'Presidents & Politics', t: 3, q: 'Which American leader answered rescue workers through a bullhorn at the ruins of the World Trade Center that he could hear them?', a: 'George W. Bush', d: ['Rudy Giuliani', 'Bill Clinton', 'George Pataki'] },
{ c: 'History & War', t: 3, q: 'Which prisoner wrote from a Birmingham jail in 1963 that injustice anywhere is a threat to justice everywhere?', a: 'Martin Luther King Jr.', d: ['Fred Shuttlesworth', 'Ralph Abernathy', 'Wyatt Tee Walker'] },
{ c: 'Science, Letters & Ideas', t: 3, q: 'Which paleontologist argued with Niles Eldredge that species sit still for ages and then change in bursts?', a: 'Stephen Jay Gould', d: ['Ernst Mayr', 'George Gaylord Simpson', 'Richard Dawkins'] },
{ c: 'Books & Authors', t: 3, q: 'Which character does Sherlock Holmes call the Napoleon of crime before their struggle at the Reichenbach Falls?', a: 'Professor Moriarty', d: ['Colonel Sebastian Moran', 'Charles Augustus Milverton', 'Irene Adler'] },
{ c: 'Screen Lines', t: 3, q: 'Which character in Twin Peaks praises a damn fine cup of coffee and dictates his thoughts to a tape recorder?', a: 'Dale Cooper', d: ['Harry S. Truman', 'Albert Rosenfield', 'Pete Martell'] },

{ c: 'Presidents & Politics', t: 4, q: 'Which state senator told a 2002 Chicago rally that he was not opposed to all wars, only to dumb wars?', a: 'Barack Obama', d: ['Dick Durbin', 'Paul Wellstone', 'Robert Byrd'] },
{ c: 'History & War', t: 4, q: 'Which American reporter, refused accreditation for the Normandy landings, hid aboard a hospital ship and went ashore as a stretcher bearer?', a: 'Martha Gellhorn', d: ['Margaret Bourke-White', 'Lee Miller', 'Helen Kirkpatrick'] },
{ c: 'Science, Letters & Ideas', t: 4, q: 'Which biologist argued that mitochondria and chloroplasts began as free-living bacteria swallowed by other cells?', a: 'Lynn Margulis', d: ['Carl Woese', 'Christian de Duve', 'Ernst Haeckel'] },
{ c: 'Books & Authors', t: 4, q: 'Which novelist wrote \'The Power and the Glory\' and \'The Heart of the Matter\'?', a: 'Graham Greene', d: ['Muriel Spark', 'Somerset Maugham', 'Anthony Powell'] },
{ c: 'Screen Lines', t: 4, q: 'Which character in The Irishman opens a late-night phone call with the line "I heard you paint houses"?', a: 'Jimmy Hoffa', d: ['Frank Sheeran', 'Russell Bufalino', 'Tony Provenzano'] },

{ c: 'Presidents & Politics', t: 5, q: 'Which American judge told a 1944 gathering of new citizens that the spirit of liberty is the spirit which is not too sure that it is right?', a: 'Learned Hand', d: ['Benjamin Cardozo', 'Felix Frankfurter', 'Harlan Fiske Stone'] },
{ c: 'History & War', t: 5, q: 'Who told the Canadian parliament in 1941 that the French generals who predicted England would have her neck wrung like a chicken had picked some chicken and some neck?', a: 'Winston Churchill', d: ['Mackenzie King', 'Anthony Eden', 'Charles de Gaulle'] },
{ c: 'Science, Letters & Ideas', t: 5, q: 'Which chemist proposed that the living Earth regulates its own atmosphere and temperature like a single system?', a: 'James Lovelock', d: ['Paul Crutzen', 'Vladimir Vernadsky', 'Eugene Odum'] },
{ c: 'Books & Authors', t: 5, q: 'Which Italian novelist sent an officer to a remote frontier fort to spend his whole life waiting for an invasion that never comes?', a: 'Dino Buzzati', d: ['Cesare Pavese', 'Elio Vittorini', 'Carlo Emilio Gadda'] },
{ c: 'Screen Lines', t: 5, q: 'Which character in Halt and Catch Fire says that computers are not the thing, but the thing that gets us to the thing?', a: 'Joe MacMillan', d: ['Gordon Clark', 'Cameron Howe', 'Donna Clark'] },
],

];
