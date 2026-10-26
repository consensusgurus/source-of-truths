// RESERVE for art (owner, 2026-10-17): plain trivia questions lifted out of the
// Quotes bank when it became a quoted-line game. Authored for Quotes days that
// never went live (Oct 18 to Nov 12, 2026), so NO PLAYER HAS SEEN THEM. Each
// entry is already in this game's lane-file shape { c, t, q, a, d }.
//
// THE NEXT BANK EXTENSION OF ART DRAWS FROM HERE FIRST: move an entry
// into the lane file for its day (same lane, same tier) and delete it from this
// file in the same commit, so nothing is dealt twice. `was` names the retired
// Quotes id for the record; it is not a recycle and carries no `from` field.
export const RESERVE = [
  { c: 'Books', t: 1, q: 'Which author wrote about a green creature in a mountain cave who sets out to steal Christmas from Whoville?', a: 'Dr. Seuss', d: ['Richard Scarry', 'Shel Silverstein', 'Stan Berenstain'], was: 'quotes:d58q04' },
  { c: 'Books', t: 1, q: 'Which pirate captain in Neverland is pursued by a crocodile that swallowed a ticking clock?', a: 'Captain Hook', d: ['Bill Jukes', 'Mr. Smee', 'Gentleman Starkey'], was: 'quotes:d59q04' },
  { c: 'Books', t: 1, q: 'Which author wrote both \'Matilda\' and \'The BFG\'?', a: 'Roald Dahl', d: ['E. B. White', 'Judy Blume', 'Beverly Cleary'], was: 'quotes:d61q04' },
  { c: 'Books', t: 1, q: 'Which author wrote both \'For Whom the Bell Tolls\' and \'A Farewell to Arms\'?', a: 'Ernest Hemingway', d: ['John Dos Passos', 'James Jones', 'F. Scott Fitzgerald'], was: 'quotes:d62q04' },
  { c: 'Books', t: 1, q: 'Which author wrote of a bootlegger throwing enormous parties in West Egg for a woman across the bay?', a: 'F. Scott Fitzgerald', d: ['John O\'Hara', 'Sinclair Lewis', 'Booth Tarkington'], was: 'quotes:d63q04' },
  { c: 'Books', t: 1, q: 'Which author wrote the mystery in which a detective solves a killing aboard a snowbound train out of Istanbul?', a: 'Agatha Christie', d: ['Ngaio Marsh', 'Dorothy L. Sayers', 'Margery Allingham'], was: 'quotes:d64q04' },
  { c: 'Books', t: 1, q: 'Which author wrote \'Carrie\', \'Misery\' and \'It\'?', a: 'Stephen King', d: ['Clive Barker', 'Peter Straub', 'Dean Koontz'], was: 'quotes:d65q04' },
  { c: 'Books', t: 1, q: 'Which author wrote the thriller in which a symbologist chases a secret through the Louvre and a Paris church?', a: 'Dan Brown', d: ['James Patterson', 'Michael Crichton', 'John Grisham'], was: 'quotes:d66q04' },
  { c: 'Books', t: 1, q: 'Which author wrote the case of a spectral hound stalking a family on Dartmoor?', a: 'Arthur Conan Doyle', d: ['G. K. Chesterton', 'Edgar Wallace', 'E. W. Hornung'], was: 'quotes:d67q04' },
  { c: 'Books', t: 1, q: 'Which author wrote about a girl from District 12 who volunteers to fight in a televised arena?', a: 'Suzanne Collins', d: ['James Dashner', 'Scott Westerfeld', 'Veronica Roth'], was: 'quotes:d69q04' },
  { c: 'Books', t: 1, q: 'Which author wrote the novels about Bella Swan and a vampire family in Forks, Washington?', a: 'Stephenie Meyer', d: ['Rick Riordan', 'Veronica Roth', 'Cassandra Clare'], was: 'quotes:d70q04' },
  { c: 'Books', t: 1, q: 'Which character is carried from a Kansas farm to Oz by a cyclone, along with her dog?', a: 'Dorothy Gale', d: ['The Wicked Witch of the West', 'Glinda', 'Aunt Em'], was: 'quotes:d71q04' },
  { c: 'Books', t: 1, q: 'Which poet is traditionally credited with both the siege of Troy epic and the long voyage home that follows it?', a: 'Homer', d: ['Hesiod', 'Virgil', 'Ovid'], was: 'quotes:d72q04' },
  { c: 'Books', t: 1, q: 'Which author wrote both \'The Lorax\' and \'Oh, the Places You\'ll Go!\'?', a: 'Dr. Seuss', d: ['Crockett Johnson', 'Bill Peet', 'Shel Silverstein'], was: 'quotes:d73q04' },
  { c: 'Books', t: 1, q: 'Which author wrote \'James and the Giant Peach\' and \'Fantastic Mr Fox\'?', a: 'Roald Dahl', d: ['Eva Ibbotson', 'Norton Juster', 'Astrid Lindgren'], was: 'quotes:d74q04' },
  { c: 'Books', t: 1, q: 'Which character in a Shakespeare tragedy is the prince\'s mother, who marries his uncle within a month of the funeral?', a: 'Gertrude', d: ['Desdemona', 'Ophelia', 'Cordelia'], was: 'quotes:d75q04' },
  { c: 'Books', t: 2, q: 'Which author wrote of a World State where citizens are hatched in bottles and kept content with a drug called soma?', a: 'Aldous Huxley', d: ['H. G. Wells', 'Yevgeny Zamyatin', 'Anthony Burgess'], was: 'quotes:d65q09' },
  { c: 'Books', t: 2, q: 'Which author wrote the Civil War novel of Scarlett O\'Hara and the burning of Atlanta?', a: 'Margaret Mitchell', d: ['Pearl S. Buck', 'Ellen Glasgow', 'Edna Ferber'], was: 'quotes:d66q09' },
  { c: 'Books', t: 2, q: 'Which author wrote about Martians landing at Woking and a machine that carries a traveler to the year 802,701?', a: 'H. G. Wells', d: ['John Wyndham', 'Arthur C. Clarke', 'Olaf Stapledon'], was: 'quotes:d67q09' },
  { c: 'Books', t: 2, q: 'Which author wrote both \'Stuart Little\' and \'The Trumpet of the Swan\'?', a: 'E. B. White', d: ['Beverly Cleary', 'Robert Lawson', 'Kate DiCamillo'], was: 'quotes:d68q09' },
  { c: 'Books', t: 2, q: 'Which playwright wrote both \'The Glass Menagerie\' and \'Cat on a Hot Tin Roof\'?', a: 'Tennessee Williams', d: ['Edward Albee', 'William Inge', 'Arthur Miller'], was: 'quotes:d69q09' },
  { c: 'Books', t: 2, q: 'Which character in Pride and Prejudice has no business in life but getting her five daughters married?', a: 'Mrs. Bennet', d: ['Charlotte Lucas', 'Mrs. Gardiner', 'Lady Catherine de Bourgh'], was: 'quotes:d70q09' },
  { c: 'Books', t: 2, q: 'Which author wrote both \'East of Eden\' and \'Cannery Row\'?', a: 'John Steinbeck', d: ['Sinclair Lewis', 'Erskine Caldwell', 'William Saroyan'], was: 'quotes:d71q09' },
  { c: 'Books', t: 2, q: 'Which Spanish author sent an aging reader of chivalric romances out to right wrongs on a bony horse?', a: 'Miguel de Cervantes', d: ['Tirso de Molina', 'Francisco de Quevedo', 'Lope de Vega'], was: 'quotes:d72q09' },
  { c: 'Books', t: 2, q: 'Which author wrote \'The Prince and the Pauper\' and sent a Connecticut engineer back to the court of King Arthur?', a: 'Mark Twain', d: ['Bret Harte', 'Joel Chandler Harris', 'George Washington Cable'], was: 'quotes:d73q09' },
  { c: 'Books', t: 2, q: 'Which Japanese swordsman wrote a treatise on strategy divided into five books named for the elements?', a: 'Miyamoto Musashi', d: ['Yamamoto Tsunetomo', 'Takuan Soho', 'Yagyu Munenori'], was: 'quotes:d74q07' },
  { c: 'Books', t: 2, q: 'Which author wrote the story of a farm girl, a scarecrow, a tin woodman and a cowardly lion on a road of yellow brick?', a: 'L. Frank Baum', d: ['Frank Stockton', 'Palmer Cox', 'Howard Pyle'], was: 'quotes:d74q09' },
  { c: 'Books', t: 2, q: 'Which sister in Little Women is the shy pianist who dies after scarlet fever?', a: 'Beth March', d: ['Meg March', 'Jo March', 'Amy March'], was: 'quotes:d75q09' },
  { c: 'Books', t: 3, q: 'Which character in Romeo and Juliet marries the lovers in secret and supplies the sleeping potion?', a: 'Friar Laurence', d: ['The Apothecary', 'Friar John', 'Prince Escalus'], was: 'quotes:d73q14' },
  { c: 'Books', t: 3, q: 'Which novelist gave his teenage narrator an invented slang called Nadsat and a taste for Beethoven and violence?', a: 'Anthony Burgess', d: ['J. G. Ballard', 'Kingsley Amis', 'Brian Aldiss'], was: 'quotes:d74q14' },
  { c: 'Books', t: 3, q: 'Which villain struggles with Sherlock Holmes at the Reichenbach Falls?', a: 'Professor Moriarty', d: ['Colonel Sebastian Moran', 'Charles Augustus Milverton', 'Irene Adler'], was: 'quotes:d75q14' },
  { c: 'Books', t: 4, q: 'Which French poet wrote a season in hell before he was twenty and then abandoned poetry for trading in Africa?', a: 'Arthur Rimbaud', d: ['Jules Laforgue', 'Tristan Corbiere', 'Gerard de Nerval'], was: 'quotes:d72q19' },
  { c: 'Books', t: 4, q: 'Which Italian chemist wrote If This Is a Man, a memoir of his year in Auschwitz?', a: 'Primo Levi', d: ['Natalia Ginzburg', 'Carlo Levi', 'Giorgio Bassani'], was: 'quotes:d73q19' },
  { c: 'Books', t: 4, q: 'Which novelist wrote \'The Power and the Glory\' and \'The Heart of the Matter\'?', a: 'Graham Greene', d: ['Somerset Maugham', 'Muriel Spark', 'Anthony Powell'], was: 'quotes:d75q19' },
  { c: 'Books', t: 5, q: 'Which Soviet novelist wrote the Stalingrad epic Life and Fate, whose manuscript the KGB confiscated?', a: 'Vasily Grossman', d: ['Konstantin Simonov', 'Vladimir Voinovich', 'Yuri Trifonov'], was: 'quotes:d68q24' },
  { c: 'Books', t: 5, q: 'Which novelist invented an elite academy in Castalia devoted to a game played with all the ideas of human culture?', a: 'Hermann Hesse', d: ['Ernst Junger', 'Alfred Andersch', 'Arno Schmidt'], was: 'quotes:d70q24' },
  { c: 'Books', t: 5, q: 'Which Portuguese poet wrote under a crowd of invented alter egos and left an unfinished book of disquiet in a trunk?', a: 'Fernando Pessoa', d: ['Eugenio de Andrade', 'Cesario Verde', 'Sophia de Mello Breyner Andresen'], was: 'quotes:d71q24' },
  { c: 'Books', t: 5, q: 'Which novelist won the Nobel for a chronicle of four centuries around a bridge on the Drina?', a: 'Ivo Andric', d: ['Mesa Selimovic', 'Miroslav Krleza', 'Milos Crnjanski'], was: 'quotes:d72q24' },
  { c: 'Books', t: 5, q: 'Which Russian novelist gave his hero a hundred opening pages spent refusing to get out of bed?', a: 'Ivan Goncharov', d: ['Mikhail Saltykov-Shchedrin', 'Nikolai Leskov', 'Ivan Turgenev'], was: 'quotes:d73q24' },
  { c: 'Books', t: 5, q: 'Which Mexican novelist wrote a short book in which a son goes looking for his father in a town of ghosts called Comala?', a: 'Juan Rulfo', d: ['Agustin Yanez', 'Carlos Fuentes', 'Juan Jose Arreola'], was: 'quotes:d74q24' },
  { c: 'Books', t: 5, q: 'Which Italian novelist sent an officer to a remote frontier fort to spend his whole life waiting for an invasion that never comes?', a: 'Dino Buzzati', d: ['Elio Vittorini', 'Carlo Emilio Gadda', 'Cesare Pavese'], was: 'quotes:d75q24' },
];
