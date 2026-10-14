// Art gauntlet, lane 'Books'. 48 days x 5 tiers (tier 1 gimme .. tier 5 expert).
const B = 'Books';
const D = (t, q, a, d) => ({ c: B, t, q, a, d });

export const LANE_DAYS = [
  // day 1
  [
    D(1, 'In L. Frank Baum\'s "The Wonderful Wizard of Oz", which of Dorothy\'s companions wants a heart?', 'The Tin Woodman', ['The Scarecrow', 'The Cowardly Lion', 'The Good Witch']),
    D(2, 'In "A Christmas Carol", what is Scrooge\'s first name?', 'Ebenezer', ['Jacob', 'Josiah', 'Bartholomew']),
    D(3, 'What is the name of Don Quixote\'s horse?', 'Rocinante', ['Bucephalus', 'Babieca', 'Dapple']),
    D(4, 'In Bram Stoker\'s "Dracula", at which Yorkshire port does the count\'s ship run aground?', 'Whitby', ['Scarborough', 'Hull', 'Grimsby']),
    D(5, 'Which Turkish novelist won the 2006 Nobel Prize in Literature?', 'Orhan Pamuk', ['Yaşar Kemal', 'Elif Shafak', 'Nazım Hikmet']),
  ],
  // day 2
  [
    D(1, 'In the Harry Potter books, which Hogwarts house is Harry sorted into?', 'Gryffindor', ['Slytherin', 'Ravenclaw', 'Hufflepuff']),
    D(2, 'In "To Kill a Mockingbird", what is the nickname of the narrator, Jean Louise Finch?', 'Scout', ['Jem', 'Dill', 'Cal']),
    D(3, 'In Hemingway\'s "The Old Man and the Sea", what is the old fisherman\'s name?', 'Santiago', ['Manolin', 'Pedro', 'Joaquín']),
    D(4, 'In "The Count of Monte Cristo", in which island fortress is Edmond Dantès imprisoned?', 'Château d\'If', ['Mont-Saint-Michel', 'Fort Boyard', 'Belle-Île']),
    D(5, 'Which South Korean writer won the 2024 Nobel Prize in Literature?', 'Han Kang', ['Shin Kyung-sook', 'Ko Un', 'Hwang Sok-yong']),
  ],
  // day 3
  [
    D(1, 'What kind of animal is Babar, the king created by Jean de Brunhoff?', 'An elephant', ['A lion', 'A bear', 'A rhinoceros']),
    D(2, 'In Kipling\'s "The Jungle Book", what kind of animal is Bagheera?', 'A black panther', ['A tiger', 'A bear', 'A wolf']),
    D(3, 'In "Jane Eyre", what is the name of Mr. Rochester\'s first wife, hidden in the attic?', 'Bertha Mason', ['Blanche Ingram', 'Grace Poole', 'Céline Varens']),
    D(4, 'In which Bavarian university town does Mary Shelley\'s young scientist build his creature?', 'Ingolstadt', ['Heidelberg', 'Göttingen', 'Leipzig']),
    D(5, 'Which Trinidad-born author of "A House for Mr Biswas" won the 2001 Nobel Prize in Literature?', 'V. S. Naipaul', ['Derek Walcott', 'Sam Selvon', 'George Lamming']),
  ],
  // day 4
  [
    D(1, 'In "The Cat in the Hat", which two creatures does the Cat release from a box?', 'Thing One and Thing Two', ['Sam and Sally', 'Horton and Lorax', 'Zip and Zap']),
    D(2, 'In "Robinson Crusoe", what name does Crusoe give the man he rescues?', 'Friday', ['Sunday', 'Monday', 'Christmas']),
    D(3, 'In "The Great Gatsby", in which fictional Long Island village does Gatsby live?', 'West Egg', ['East Egg', 'Great Neck', 'Montauk']),
    D(4, 'In "Gulliver\'s Travels", what are the wise, rational horses called?', 'Houyhnhnms', ['Yahoos', 'Laputans', 'Struldbrugs']),
    D(5, 'Who in 1909 became the first woman to win the Nobel Prize in Literature?', 'Selma Lagerlöf', ['Grazia Deledda', 'Sigrid Undset', 'Pearl S. Buck']),
  ],
  // day 5
  [
    D(1, 'What is the name of Harry Potter\'s red-haired best friend?', 'Ron Weasley', ['Neville Longbottom', 'Draco Malfoy', 'Seamus Finnigan']),
    D(2, 'In "Lord of the Flies", what do the boys blow to call an assembly?', 'A conch shell', ['A bugle', 'A whistle', 'A hunting horn']),
    D(3, 'In "Gone with the Wind", what is the name of the O\'Hara family plantation?', 'Tara', ['Twelve Oaks', 'Belle Reve', 'Sutpen\'s Hundred']),
    D(4, 'In "Middlemarch", which elderly scholar does Dorothea Brooke first marry?', 'Edward Casaubon', ['Will Ladislaw', 'Tertius Lydgate', 'Nicholas Bulstrode']),
    D(5, 'In "Beowulf", which Danish king\'s mead hall is attacked by Grendel?', 'Hrothgar', ['Hygelac', 'Ingeld', 'Healfdene']),
  ],
  // day 6
  [
    D(1, 'In Carlo Collodi\'s story, which old woodcarver makes the puppet Pinocchio?', 'Geppetto', ['Mangiafuoco', 'Lampwick', 'Master Cherry']),
    D(2, 'What is the first name of Frankenstein, the scientist in Mary Shelley\'s novel?', 'Victor', ['Henry', 'William', 'Robert']),
    D(3, 'In "Anna Karenina", which cavalry officer becomes Anna\'s lover?', 'Count Vronsky', ['Konstantin Levin', 'Stepan Oblonsky', 'Alexei Karenin']),
    D(4, 'Which French author won the 2022 Nobel Prize in Literature?', 'Annie Ernaux', ['Marie NDiaye', 'Patrick Modiano', 'Michel Houellebecq']),
    D(5, 'Which 1764 Horace Walpole novel is usually called the first Gothic novel?', 'The Castle of Otranto', ['The Mysteries of Udolpho', 'The Monk', 'Vathek']),
  ],
  // day 7
  [
    D(1, 'In "Charlie and the Chocolate Factory", what are the factory\'s small workers called?', 'Oompa-Loompas', ['Munchkins', 'Lilliputians', 'Snorks']),
    D(2, 'In "The Hobbit", what is the name of Bilbo\'s home in Hobbiton?', 'Bag End', ['Rivendell', 'Crickhollow', 'Brandy Hall']),
    D(3, 'In "Around the World in Eighty Days", what is the name of Phileas Fogg\'s French valet?', 'Passepartout', ['Fix', 'Planchet', 'Bazin']),
    D(4, 'In "Wuthering Heights", what is the name of the Lintons\' house?', 'Thrushcross Grange', ['Thornfield Hall', 'Wildfell Hall', 'Gateshead Hall']),
    D(5, 'Which Polish author was awarded the Nobel Prize in Literature for 2018?', 'Olga Tokarczuk', ['Wisława Szymborska', 'Herta Müller', 'Svetlana Alexievich']),
  ],
  // day 8
  [
    D(1, 'In the Harry Potter books, which Hogwarts house is Draco Malfoy in?', 'Slytherin', ['Gryffindor', 'Hufflepuff', 'Ravenclaw']),
    D(2, 'In the Harry Potter books, what is the Weasley family home called?', 'The Burrow', ['Grimmauld Place', 'Shell Cottage', 'Spinner\'s End']),
    D(3, 'In "Moby-Dick", which harpooner from the South Seas becomes Ishmael\'s close friend?', 'Queequeg', ['Tashtego', 'Daggoo', 'Fedallah']),
    D(4, 'In "Brideshead Revisited", what is the name of the narrator?', 'Charles Ryder', ['Sebastian Flyte', 'Anthony Blanche', 'Rex Mottram']),
    D(5, 'Which Zanzibar-born novelist won the 2021 Nobel Prize in Literature?', 'Abdulrazak Gurnah', ['Ngũgĩ wa Thiong\'o', 'Nuruddin Farah', 'Ben Okri']),
  ],
  // day 9
  [
    D(1, 'In E. B. White\'s book, what kind of animal is Stuart Little?', 'A mouse', ['A rat', 'A hamster', 'A squirrel']),
    D(2, 'Who wrote "The Kite Runner", set partly in Kabul?', 'Khaled Hosseini', ['Rohinton Mistry', 'Mohsin Hamid', 'Salman Rushdie']),
    D(3, 'In "Peter Pan", what is the name of the Newfoundland dog who acts as the children\'s nurse?', 'Nana', ['Nibs', 'Tootles', 'Pongo']),
    D(4, 'What was the real name of the author who wrote as Lewis Carroll?', 'Charles Dodgson', ['Charles Kingsley', 'Edward Lear', 'George MacDonald']),
    D(5, 'Which Norwegian writer won the 2023 Nobel Prize in Literature?', 'Jon Fosse', ['Karl Ove Knausgaard', 'Knut Hamsun', 'Dag Solstad']),
  ],
  // day 10
  [
    D(1, 'What kind of animal is Curious George?', 'A monkey', ['A bear', 'A koala', 'A raccoon']),
    D(2, 'Who wrote the young adult novel "The Fault in Our Stars"?', 'John Green', ['Jay Asher', 'Rainbow Rowell', 'Stephen Chbosky']),
    D(3, 'Which O. Henry story tells of a poor couple who each sell a treasure to buy the other a Christmas gift?', 'The Gift of the Magi', ['The Ransom of Red Chief', 'The Last Leaf', 'A Retrieved Reformation']),
    D(4, 'Which Thornton Wilder play is set in Grover\'s Corners, New Hampshire?', 'Our Town', ['The Skin of Our Teeth', 'The Matchmaker', 'The Long Christmas Dinner']),
    D(5, 'Which French poet received the first Nobel Prize in Literature, in 1901?', 'Sully Prudhomme', ['Frédéric Mistral', 'Anatole France', 'Paul Verlaine']),
  ],
  // day 11
  [
    D(1, 'In Ludwig Bemelmans\'s picture books, in which city do Madeline and eleven other little girls live?', 'Paris', ['London', 'Rome', 'Vienna']),
    D(2, 'In "Charlotte\'s Web", what kind of animal is Templeton?', 'A rat', ['A mouse', 'A goose', 'A sheep']),
    D(3, 'What was Mark Twain\'s real name?', 'Samuel Clemens', ['Samuel Butler', 'Francis Bret Harte', 'William Sydney Porter']),
    D(4, 'In Tennessee Williams\'s "The Glass Menagerie", what is the name of the shy daughter who collects glass animals?', 'Laura Wingfield', ['Amanda Wingfield', 'Stella Kowalski', 'Maggie Pollitt']),
    D(5, 'Under which pen name did Agatha Christie publish six romance novels?', 'Mary Westmacott', ['Ellis Peters', 'Josephine Tey', 'Anthony Gilbert']),
  ],
  // day 12
  [
    D(1, 'In the Grimm fairy tale, which little man spins straw into gold?', 'Rumpelstiltskin', ['Tom Thumb', 'Hans My Hedgehog', 'The Elf King']),
    D(2, 'Lewis Carroll\'s "Through the Looking-Glass" is structured around which game?', 'Chess', ['Croquet', 'Cards', 'Checkers']),
    D(3, 'What was George Orwell\'s real name?', 'Eric Blair', ['Arthur Blair', 'Eric Ambler', 'Edward Bliss']),
    D(4, 'Which Edgar Lee Masters book is made of free verse epitaphs spoken by the dead of a small Illinois town?', 'Spoon River Anthology', ['Winesburg, Ohio', 'Our Town', 'Main Street']),
    D(5, 'Which French writing group, founded in 1960 by Raymond Queneau, composed under formal constraints?', 'Oulipo', ['Dada', 'The Nouveau Roman', 'Tel Quel']),
  ],
  // day 13
  [
    D(1, 'In Hans Christian Andersen\'s tale, what does the ugly duckling grow up to be?', 'A swan', ['A goose', 'An eagle', 'A peacock']),
    D(2, 'In the Harry Potter books, which position does Harry play on his Quidditch team?', 'Seeker', ['Keeper', 'Beater', 'Chaser']),
    D(3, 'Which Stephen Crane novel follows young Henry Fleming through a Civil War battle?', 'The Red Badge of Courage', ['The Killer Angels', 'Cold Mountain', 'Andersonville']),
    D(4, 'What collective name is given to Wordsworth, Coleridge and Southey, who settled in the hills of Cumbria?', 'The Lake Poets', ['The Metaphysical Poets', 'The Cavalier Poets', 'The Graveyard Poets']),
    D(5, 'Which literary movement, led by Aimé Césaire and Léopold Senghor, celebrated Black African identity?', 'Négritude', ['Indigenismo', 'Afrofuturism', 'The Harlem Renaissance']),
  ],
  // day 14
  [
    D(1, 'To which family does Juliet belong in Shakespeare\'s "Romeo and Juliet"?', 'The Capulets', ['The Montagues', 'The Medicis', 'The Sforzas']),
    D(2, 'In "The Hunger Games", what is the name of the nation ruled from the Capitol?', 'Panem', ['Gilead', 'Oceania', 'Westeros']),
    D(3, 'In "The Scarlet Letter", what is the name of Hester Prynne\'s daughter?', 'Pearl', ['Faith', 'Mercy', 'Prudence']),
    D(4, 'Which 1920 novel satirizes the small Minnesota town of Gopher Prairie?', 'Main Street', ['Babbitt', 'Elmer Gantry', 'Arrowsmith']),
    D(5, 'Which German literary movement of the 1770s took its name from a play by Friedrich Klinger?', 'Sturm und Drang', ['Romanticism', 'Weimar Classicism', 'Biedermeier']),
  ],
  // day 15
  [
    D(1, 'What is Paddington Bear\'s favorite food?', 'Marmalade', ['Honey', 'Porridge', 'Jam tarts']),
    D(2, 'In Louis Sachar\'s "Holes", at which juvenile camp is Stanley Yelnats sent to dig?', 'Camp Green Lake', ['Camp Crystal Lake', 'Camp Half-Blood', 'Camp Wildwood']),
    D(3, 'Which Willa Cather novel follows a Bohemian immigrant girl on the Nebraska prairie?', 'My Ántonia', ['O Pioneers!', 'The Song of the Lark', 'Death Comes for the Archbishop']),
    D(4, 'Most of the plays in August Wilson\'s ten-play Century Cycle are set in which city\'s Hill District?', 'Pittsburgh', ['Chicago', 'Detroit', 'Baltimore']),
    D(5, 'Which French literary prize, first awarded in 1903, is named after two brothers?', 'Prix Goncourt', ['Prix Femina', 'Prix Renaudot', 'Prix Médicis']),
  ],
  // day 16
  [
    D(1, 'What shape is the scar on Harry Potter\'s forehead?', 'A lightning bolt', ['A star', 'A crescent moon', 'A snake']),
    D(2, 'In R. J. Palacio\'s "Wonder", what is the first name of the boy starting school for the first time at ten?', 'August', ['Jack', 'Julian', 'Justin']),
    D(3, 'Which Lebanese-American poet wrote "The Prophet" (1923)?', 'Kahlil Gibran', ['Ameen Rihani', 'Mikhail Naimy', 'Elia Abu Madi']),
    D(4, 'Which Tony Kushner play is subtitled "A Gay Fantasia on National Themes"?', 'Angels in America', ['The Normal Heart', 'Torch Song Trilogy', 'Jeffrey']),
    D(5, 'Which novel won the first Nebula Award for Best Novel?', 'Dune', ['Stranger in a Strange Land', 'The Left Hand of Darkness', 'Foundation']),
  ],
  // day 17
  [
    D(1, 'In "The Three Little Pigs", what is the one house the wolf cannot blow down made of?', 'Bricks', ['Straw', 'Sticks', 'Mud']),
    D(2, 'In "Bridge to Terabithia", who invents the secret kingdom with Jess Aarons?', 'Leslie Burke', ['May Belle Aarons', 'Janice Avery', 'Gary Fulcher']),
    D(3, 'Which Spanish author lost the use of his left hand at the Battle of Lepanto in 1571?', 'Miguel de Cervantes', ['Lope de Vega', 'Garcilaso de la Vega', 'Francisco de Quevedo']),
    D(4, 'Which Italian playwright wrote "Six Characters in Search of an Author"?', 'Luigi Pirandello', ['Dario Fo', 'Carlo Goldoni', 'Gabriele D\'Annunzio']),
    D(5, 'In which Yorkshire spa town was Agatha Christie found after her eleven-day disappearance in 1926?', 'Harrogate', ['Scarborough', 'Ilkley', 'Ripon']),
  ],
  // day 18
  [
    D(1, 'In Roald Dahl\'s "The BFG", what is the name of the orphan girl the giant carries off?', 'Sophie', ['Matilda', 'Violet', 'Veruca']),
    D(2, 'Who wrote "The Outsiders", publishing it while still a teenager?', 'S. E. Hinton', ['Judy Blume', 'Paul Zindel', 'Robert Cormier']),
    D(3, 'Which Shakespeare comedy follows the shipwrecked twins Viola and Sebastian in Illyria?', 'Twelfth Night', ['The Comedy of Errors', 'As You Like It', 'The Winter\'s Tale']),
    D(4, 'Which John Osborne play of 1956 gave rise to the label "Angry Young Men"?', 'Look Back in Anger', ['The Entertainer', 'A Taste of Honey', 'Saturday Night and Sunday Morning']),
    D(5, 'Which J. M. Synge play provoked riots on its Dublin opening night in 1907?', 'The Playboy of the Western World', ['Riders to the Sea', 'Juno and the Paycock', 'Cathleen ni Houlihan']),
  ],
  // day 19
  [
    D(1, 'In Johanna Spyri\'s "Heidi", in which country does Heidi live with her grandfather?', 'Switzerland', ['Austria', 'Norway', 'Germany']),
    D(2, 'In "The Adventures of Tom Sawyer", who is the aunt who raises Tom?', 'Aunt Polly', ['Aunt Sally', 'Aunt Em', 'Aunt March']),
    D(3, 'Which Edmond Rostand hero, a poet and swordsman, is cursed with an enormous nose?', 'Cyrano de Bergerac', ['Scaramouche', 'Don Juan', 'The Scarlet Pimpernel']),
    D(4, 'Which Molière comedy exposes a religious hypocrite who cons the gullible Orgon?', 'Tartuffe', ['The Misanthrope', 'The Miser', 'The Imaginary Invalid']),
    D(5, 'Where did Leo Tolstoy die in 1910, days after leaving his estate?', 'At a railway station', ['In a monastery', 'At Yasnaya Polyana', 'In a Moscow hospital']),
  ],
  // day 20
  [
    D(1, 'In Anna Sewell\'s 1877 novel, what kind of animal is Black Beauty?', 'A horse', ['A dog', 'A cat', 'A donkey']),
    D(2, 'In "Treasure Island", which boy narrates most of the story?', 'Jim Hawkins', ['Ben Gunn', 'Billy Bones', 'David Balfour']),
    D(3, 'Which Percy Bysshe Shelley sonnet describes the shattered statue of a forgotten king in the desert?', 'Ozymandias', ['Mont Blanc', 'Adonais', 'Hellas']),
    D(4, 'Which Dylan Thomas "play for voices" is set in the Welsh village of Llareggub?', 'Under Milk Wood', ['Fern Hill', 'The Doctor and the Devils', 'Return Journey']),
    D(5, 'Which Italian poet wrote the chivalric epic "Orlando Furioso"?', 'Ludovico Ariosto', ['Torquato Tasso', 'Matteo Maria Boiardo', 'Luigi Pulci']),
  ],
  // day 21
  [
    D(1, 'In Martin Handford\'s "Where\'s Waldo?" books, what pattern is on Waldo\'s shirt?', 'Red and white stripes', ['Blue polka dots', 'Green plaid', 'Black and yellow checks']),
    D(2, 'In "Peter Pan", what is the surname of Wendy, John and Michael?', 'Darling', ['Banks', 'Pevensie', 'Baker']),
    D(3, 'Which Robert Browning poem is a monologue by a duke showing off a portrait of his late wife?', 'My Last Duchess', ['Porphyria\'s Lover', 'Andrea del Sarto', 'The Lost Leader']),
    D(4, 'Which Tom Stoppard play turns two minor courtiers from "Hamlet" into its leading men?', 'Rosencrantz and Guildenstern Are Dead', ['Arcadia', 'The Real Inspector Hound', 'Travesties']),
    D(5, 'Which French playwright wrote the tragedy "Phèdre" (1677)?', 'Jean Racine', ['Pierre Corneille', 'Molière', 'Jean Anouilh']),
  ],
  // day 22
  [
    D(1, 'In the folk tale, which animal finally eats the runaway Gingerbread Man?', 'A fox', ['A wolf', 'A bear', 'A cat']),
    D(2, 'In "The Lion, the Witch and the Wardrobe", which Pevensie child first finds the way into Narnia?', 'Lucy', ['Edmund', 'Susan', 'Peter']),
    D(3, 'Which Tennyson poem commemorates the doomed British cavalry attack at Balaclava in 1854?', 'The Charge of the Light Brigade', ['Ulysses', 'Locksley Hall', 'The Revenge']),
    D(4, 'In which Grasmere home did William Wordsworth live from 1799 to 1808?', 'Dove Cottage', ['Rydal Mount', 'Greta Hall', 'Hill Top']),
    D(5, 'Which Chinese writer\'s 1918 story "A Madman\'s Diary" is a landmark of modern Chinese fiction?', 'Lu Xun', ['Lao She', 'Ba Jin', 'Shen Congwen']),
  ],
  // day 23
  [
    D(1, 'Who wrote the "Diary of a Wimpy Kid" books?', 'Jeff Kinney', ['Dav Pilkey', 'Rick Riordan', 'Lincoln Peirce']),
    D(2, 'Which young Gascon joins Athos, Porthos and Aramis in "The Three Musketeers"?', 'd\'Artagnan', ['Rochefort', 'Planchet', 'Tréville']),
    D(3, 'Which Longfellow poem describes a midnight gallop to warn that British troops were coming?', 'Paul Revere\'s Ride', ['The Village Blacksmith', 'Evangeline', 'The Wreck of the Hesperus']),
    D(4, 'Which friend of Franz Kafka ignored his request to burn his manuscripts and published them instead?', 'Max Brod', ['Felix Weltsch', 'Kurt Wolff', 'Franz Werfel']),
    D(5, 'June 16, the day on which "Ulysses" is set, marks James Joyce\'s first outing with which woman?', 'Nora Barnacle', ['Lucia Joyce', 'Sylvia Beach', 'Harriet Shaw Weaver']),
  ],
  // day 24
  [
    D(1, 'Who wrote the "Goosebumps" horror series for children?', 'R. L. Stine', ['Christopher Pike', 'Alvin Schwartz', 'Lemony Snicket']),
    D(2, 'In Bram Stoker\'s novel, in which mountains does Count Dracula\'s castle stand?', 'The Carpathians', ['The Alps', 'The Pyrenees', 'The Urals']),
    D(3, 'Which Alfred Noyes ballad tells of a robber who rides to an inn and the landlord\'s daughter Bess?', 'The Highwayman', ['Lochinvar', 'The Wreck of the Hesperus', 'Sir Patrick Spens']),
    D(4, 'Which Arundhati Roy novel won the 1997 Booker Prize?', 'The God of Small Things', ['The Ministry of Utmost Happiness', 'A Suitable Boy', 'The Inheritance of Loss']),
    D(5, 'Which Indian novelist created the fictional South Indian town of Malgudi?', 'R. K. Narayan', ['Mulk Raj Anand', 'Raja Rao', 'Anita Desai']),
  ],
  // day 25
  [
    D(1, 'Who wrote the novel "Jurassic Park"?', 'Michael Crichton', ['Dean Koontz', 'Tom Clancy', 'John Grisham']),
    D(2, 'In "Nineteen Eighty-Four", what is the name of the Party worker at the center of the novel?', 'Winston Smith', ['O\'Brien', 'Emmanuel Goldstein', 'Ampleforth']),
    D(3, 'In "The Catcher in the Rye", what is the name of Holden Caulfield\'s little sister?', 'Phoebe', ['Allie', 'Jane', 'Sally']),
    D(4, 'At which Yorkshire parsonage did the Brontë sisters grow up?', 'Haworth', ['Hathersage', 'Thornton', 'Keighley']),
    D(5, 'Which New Zealand author won the 1985 Booker Prize for "The Bone People"?', 'Keri Hulme', ['Janet Frame', 'Witi Ihimaera', 'Eleanor Catton']),
  ],
  // day 26
  [
    D(1, 'Who wrote the "Captain Underpants" books?', 'Dav Pilkey', ['Jeff Kinney', 'Mo Willems', 'Jon Scieszka']),
    D(2, 'Which villainous actor pursues the Baudelaire orphans in "A Series of Unfortunate Events"?', 'Count Olaf', ['Mr. Poe', 'Esmé Squalor', 'Uncle Monty']),
    D(3, 'In "To Kill a Mockingbird", what is Boo Radley\'s real first name?', 'Arthur', ['Nathan', 'Walter', 'Tom']),
    D(4, 'Which circle of Oxford writers, including Tolkien and C. S. Lewis, met to read their work aloud?', 'The Inklings', ['The Bloomsbury Group', 'The Apostles', 'The Souls']),
    D(5, 'Which Nigerian author wrote "Half of a Yellow Sun", set during the Biafran War?', 'Chimamanda Ngozi Adichie', ['Buchi Emecheta', 'Flora Nwapa', 'Helon Habila']),
  ],
  // day 27
  [
    D(1, 'In "The Hunger Games", which weapon is Katniss Everdeen best known for?', 'A bow', ['A sword', 'A spear', 'A slingshot']),
    D(2, 'Which author wrote the "Ramona" books, set on Klickitat Street in Portland?', 'Beverly Cleary', ['Judy Blume', 'Lois Lowry', 'Katherine Paterson']),
    D(3, 'In P. G. Wodehouse\'s stories, what is the name of Bertie Wooster\'s brilliant valet?', 'Jeeves', ['Bunter', 'Lane', 'Crichton']),
    D(4, 'In F. Scott Fitzgerald\'s novel, what was Jay Gatsby\'s original name?', 'James Gatz', ['Jimmy Gates', 'John Gaskell', 'Jacob Gatsch']),
    D(5, 'Which Brazilian writer published "The Hour of the Star" in 1977, the year of her death?', 'Clarice Lispector', ['Rachel de Queiroz', 'Hilda Hilst', 'Lygia Fagundes Telles']),
  ],
  // day 28
  [
    D(1, 'In Aesop\'s fable, which hard-working insect stores food while the grasshopper plays all summer?', 'The ant', ['The bee', 'The beetle', 'The ladybug']),
    D(2, 'Under which pen name does J. K. Rowling write the Cormoran Strike crime novels?', 'Robert Galbraith', ['Richard Bachman', 'Ellis Peters', 'Nicci French']),
    D(3, 'Which Chilean author wrote "The House of the Spirits" (1982)?', 'Isabel Allende', ['Marcela Serrano', 'María Luisa Bombal', 'Laura Esquivel']),
    D(4, 'Which Laurence Sterne novel, issued in nine volumes from 1759, is famous for its digressions and an all-black page?', 'Tristram Shandy', ['Tom Jones', 'Clarissa', 'Joseph Andrews']),
    D(5, 'Which award for American picture-book illustration is named after a 19th-century English illustrator?', 'The Caldecott Medal', ['The Newbery Medal', 'The Coretta Scott King Award', 'The Printz Award']),
  ],
  // day 29
  [
    D(1, 'In Dr. Seuss\'s "Horton Hears a Who!", on what does Horton find a whole tiny town living?', 'A speck of dust', ['A snowflake', 'A grain of sand', 'A drop of dew']),
    D(2, 'Which Brazilian author wrote "The Alchemist", about a shepherd boy\'s journey to Egypt?', 'Paulo Coelho', ['Jorge Amado', 'Machado de Assis', 'Chico Buarque']),
    D(3, 'In "A Tale of Two Cities", which English lawyer goes to the guillotine in another man\'s place?', 'Sydney Carton', ['Charles Darnay', 'Jarvis Lorry', 'Ernest Defarge']),
    D(4, 'Which 1948 Alan Paton novel follows the Zulu pastor Stephen Kumalo to Johannesburg?', 'Cry, the Beloved Country', ['Disgrace', 'July\'s People', 'Burger\'s Daughter']),
    D(5, 'Which Japanese literary prize for new writers is named after the author of "Rashomon"?', 'The Akutagawa Prize', ['The Naoki Prize', 'The Tanizaki Prize', 'The Mishima Prize']),
  ],
  // day 30
  [
    D(1, 'In "Jack and the Beanstalk", what does the giant\'s hen lay?', 'Golden eggs', ['Silver eggs', 'Jewels', 'Magic beans']),
    D(2, 'In the Harry Potter books, who is Harry\'s godfather?', 'Sirius Black', ['Remus Lupin', 'Arthur Weasley', 'Rubeus Hagrid']),
    D(3, 'Which Brontë sister wrote "The Tenant of Wildfell Hall"?', 'Anne', ['Charlotte', 'Emily', 'Maria']),
    D(4, 'Which Russian writer, author of "A Hero of Our Time", was killed in a duel in 1841?', 'Mikhail Lermontov', ['Alexander Pushkin', 'Fyodor Tyutchev', 'Afanasy Fet']),
    D(5, 'Which Canadian author shared the 1992 Booker Prize for "The English Patient"?', 'Michael Ondaatje', ['Rohinton Mistry', 'Mordecai Richler', 'Robertson Davies']),
  ],
  // day 31
  [
    D(1, 'In Andersen\'s "The Emperor\'s New Clothes", who finally says the emperor is wearing nothing?', 'A child', ['A tailor', 'The queen', 'A soldier']),
    D(2, 'In "Treasure Island", which marooned former pirate craves a piece of cheese?', 'Ben Gunn', ['Israel Hands', 'Billy Bones', 'Blind Pew']),
    D(3, 'Which Nikos Kazantzakis novel pairs a bookish narrator with a lusty, life-loving Cretan workman?', 'Zorba the Greek', ['Captain Michalis', 'The Last Temptation of Christ', 'Christ Recrucified']),
    D(4, 'Which Czech writer\'s 1920 play "R.U.R." gave the world the word "robot"?', 'Karel Čapek', ['Jaroslav Hašek', 'Bohumil Hrabal', 'Josef Škvorecký']),
    D(5, 'Which Polish novelist, author of "Quo Vadis", won the 1905 Nobel Prize in Literature?', 'Henryk Sienkiewicz', ['Bolesław Prus', 'Władysław Reymont', 'Stefan Żeromski']),
  ],
  // day 32
  [
    D(1, 'In the Grimm tale, what do Hansel and Gretel scatter on the path, only for birds to eat it?', 'Breadcrumbs', ['Pebbles', 'Seeds', 'Feathers']),
    D(2, 'In "One Thousand and One Nights", who tells the king a new story each night to stay alive?', 'Scheherazade', ['Dinarzad', 'Aladdin', 'Sinbad']),
    D(3, 'In which city did Oscar Wilde die in 1900?', 'Paris', ['London', 'Dublin', 'Naples']),
    D(4, 'Which Vikram Seth novel, among the longest single-volume novels in English, follows a mother\'s hunt for a husband for her daughter?', 'A Suitable Boy', ['A Fine Balance', 'The Golden Gate', 'Midnight\'s Children']),
    D(5, 'Which Samuel Richardson novel of 1740, told in letters, follows a servant girl who resists her master?', 'Pamela', ['Clarissa', 'Evelina', 'Moll Flanders']),
  ],
  // day 33
  [
    D(1, 'In A. A. Milne\'s stories, what is the name of the boy who owns Winnie-the-Pooh?', 'Christopher Robin', ['Billy Moon', 'Edward Bear', 'Tommy Brock']),
    D(2, 'In Jack London\'s "The Call of the Wild", what is the name of the dog stolen from California and sold as a sled dog?', 'Buck', ['White Fang', 'Spitz', 'Curly']),
    D(3, 'In "Pride and Prejudice", which pompous clergyman proposes to Elizabeth Bennet before marrying Charlotte Lucas?', 'Mr. Collins', ['Mr. Wickham', 'Mr. Bingley', 'Mr. Elton']),
    D(4, 'Which Muriel Spark novel follows an Edinburgh teacher and her chosen set of girls in the 1930s?', 'The Prime of Miss Jean Brodie', ['Memento Mori', 'The Girls of Slender Means', 'Loitering with Intent']),
    D(5, 'Which Persian poet\'s tomb in Shiraz draws visitors who open his "Divan" at random for guidance?', 'Hafez', ['Saadi', 'Rumi', 'Ferdowsi']),
  ],
  // day 34
  [
    D(1, 'In the Grimm and Perrault versions of "Sleeping Beauty", how long does the princess sleep?', 'A hundred years', ['Seven years', 'Ten years', 'A thousand years']),
    D(2, 'In "The Lion, the Witch and the Wardrobe", which sweet does the White Witch use to tempt Edmund?', 'Turkish delight', ['Toffee', 'Marzipan', 'Licorice']),
    D(3, 'Which Ray Bradbury book of linked stories describes the human settlement of Mars?', 'The Martian Chronicles', ['The Illustrated Man', 'Something Wicked This Way Comes', 'Dandelion Wine']),
    D(4, 'Which Gabriel García Márquez novella reconstructs a killing that the whole town knew was coming?', 'Chronicle of a Death Foretold', ['No One Writes to the Colonel', 'The Autumn of the Patriarch', 'Leaf Storm']),
    D(5, 'Which Australian poet wrote "The Man from Snowy River" (1890)?', 'Banjo Paterson', ['Henry Lawson', 'C. J. Dennis', 'Dorothea Mackellar']),
  ],
  // day 35
  [
    D(1, 'In Stephenie Meyer\'s "Twilight", what is Edward Cullen?', 'A vampire', ['A werewolf', 'A ghost', 'A wizard']),
    D(2, 'Which Laura Esquivel novel ties each chapter to a recipe?', 'Like Water for Chocolate', ['The House of the Spirits', 'Chocolat', 'Eva Luna']),
    D(3, 'Which George Eliot novel follows a miserly weaver who adopts a golden-haired orphan?', 'Silas Marner', ['Adam Bede', 'Romola', 'Felix Holt']),
    D(4, 'Which D. H. Lawrence novel was the subject of a landmark 1960 obscenity trial in Britain?', 'Lady Chatterley\'s Lover', ['Sons and Lovers', 'Women in Love', 'The Rainbow']),
    D(5, 'For which novel did Peter Carey win his second Booker Prize, in 2001?', 'True History of the Kelly Gang', ['Oscar and Lucinda', 'Jack Maggs', 'Illywhacker']),
  ],
  // day 36
  [
    D(1, 'In "A Christmas Carol", how many spirits does Marley\'s ghost say will visit Scrooge?', 'Three', ['Two', 'Four', 'Seven']),
    D(2, 'Who is the real author behind the pen name Lemony Snicket?', 'Daniel Handler', ['Neil Gaiman', 'Jon Scieszka', 'Brian Selznick']),
    D(3, 'In "Little Women", which wealthy boy next door becomes Jo\'s close friend?', 'Laurie', ['John Brooke', 'Professor Bhaer', 'Fred Vaughn']),
    D(4, 'Which American writer hosted Hemingway and Picasso at her Paris salon at 27 rue de Fleurus?', 'Gertrude Stein', ['Sylvia Beach', 'Alice B. Toklas', 'Natalie Barney']),
    D(5, 'Which Nigerian writer\'s 1952 "The Palm-Wine Drinkard" was among the first West African novels published in English abroad?', 'Amos Tutuola', ['Cyprian Ekwensi', 'Wole Soyinka', 'Chinua Achebe']),
  ],
  // day 37
  [
    D(1, 'In "Alice\'s Adventures in Wonderland", which game does the Queen of Hearts play using flamingos as mallets?', 'Croquet', ['Golf', 'Polo', 'Cricket']),
    D(2, 'In "Charlotte\'s Web", what is the name of the farm girl who first saves Wilbur?', 'Fern', ['Avery', 'Edith', 'Lurvy']),
    D(3, 'In "Strange Case of Dr Jekyll and Mr Hyde", which lawyer investigates his friend\'s strange will?', 'Gabriel Utterson', ['Richard Enfield', 'Hastie Lanyon', 'Danvers Carew']),
    D(4, 'Which Mexican author wrote "The Death of Artemio Cruz" (1962)?', 'Carlos Fuentes', ['Juan Rulfo', 'Octavio Paz', 'Elena Poniatowska']),
    D(5, 'Which British author won the 2024 Booker Prize for the space-station novel "Orbital"?', 'Samantha Harvey', ['Rachel Kushner', 'Charlotte Wood', 'Yael van der Wouden']),
  ],
  // day 38
  [
    D(1, 'In "Peter Pan", what is the band of boys who live with Peter in Neverland called?', 'The Lost Boys', ['The Merry Men', 'The Pirates', 'The Wild Boys']),
    D(2, 'In Kipling\'s "Rikki-Tikki-Tavi", what kind of animal is the hero who fights the cobras?', 'A mongoose', ['A ferret', 'A meerkat', 'A weasel']),
    D(3, 'In Kafka\'s "The Metamorphosis", what is Gregor Samsa\'s job before his transformation?', 'Traveling salesman', ['Bank clerk', 'Insurance clerk', 'Schoolteacher']),
    D(4, 'Which Indian-born author won the 1981 Booker Prize for "Midnight\'s Children"?', 'Salman Rushdie', ['Vikram Seth', 'Amitav Ghosh', 'Anita Desai']),
    D(5, 'Which Chinese classic novel opens with three sworn brothers taking an oath in a peach garden?', 'Romance of the Three Kingdoms', ['Water Margin', 'Journey to the West', 'Dream of the Red Chamber']),
  ],
  // day 39
  [
    D(1, 'In Roald Dahl\'s "Matilda", what is the name of Matilda\'s kind schoolteacher?', 'Miss Honey', ['Miss Trunchbull', 'Mrs. Phelps', 'Miss Plum']),
    D(2, 'In the fairy tale, which flower does Beauty\'s father pick from the Beast\'s garden?', 'A rose', ['A lily', 'A tulip', 'A daisy']),
    D(3, 'What is the first name of Mrs. Dalloway in Virginia Woolf\'s novel?', 'Clarissa', ['Sally', 'Elizabeth', 'Lucy']),
    D(4, 'Which American writer, Harper Lee\'s childhood neighbor in Monroeville, Alabama, inspired the character Dill?', 'Truman Capote', ['Eudora Welty', 'Walker Percy', 'Carson McCullers']),
    D(5, 'Which Oscar Hijuelos novel made him the first Hispanic writer to win the Pulitzer Prize for Fiction, in 1990?', 'The Mambo Kings Play Songs of Love', ['Our House in the Last World', 'Dreaming in Cuban', 'How the García Girls Lost Their Accents']),
  ],
  // day 40
  [
    D(1, 'In Dr. Seuss\'s "Green Eggs and Ham", which character keeps urging the narrator to try the dish?', 'Sam-I-Am', ['The Grinch', 'The Lorax', 'Yertle']),
    D(2, 'In "The Wind in the Willows", which new craze leads Mr. Toad into ruin and jail?', 'Motor cars', ['Hot-air balloons', 'Bicycles', 'Steamboats']),
    D(3, 'Which H. G. Wells novel sends its traveler to the year 802,701, among the Eloi and the Morlocks?', 'The Time Machine', ['The War of the Worlds', 'When the Sleeper Wakes', 'The First Men in the Moon']),
    D(4, 'In "The Lord of the Rings", what is the name of Gandalf\'s swift silver-gray horse?', 'Shadowfax', ['Bill', 'Brego', 'Hasufel']),
    D(5, 'Which Australian author won the 2014 Booker Prize for "The Narrow Road to the Deep North"?', 'Richard Flanagan', ['Tim Winton', 'Christos Tsiolkas', 'Peter Carey']),
  ],
  // day 41
  [
    D(1, 'In the fairy tale "Puss in Boots", what kind of animal is Puss?', 'A cat', ['A dog', 'A fox', 'A rabbit']),
    D(2, 'In Ezra Jack Keats\'s "The Snowy Day", what is the name of the boy exploring the snow?', 'Peter', ['Max', 'Sam', 'Archie']),
    D(3, 'Which G. K. Chesterton detective is a mild-mannered Catholic priest?', 'Father Brown', ['Father Dowling', 'Brother Cadfael', 'Father Ted']),
    D(4, 'Which Ian McEwan novel turns on a false accusation made by thirteen-year-old Briony Tallis?', 'Atonement', ['Enduring Love', 'Saturday', 'On Chesil Beach']),
    D(5, 'Which Senegalese writer\'s "So Long a Letter" (1979) is written as a widow\'s letter to her friend?', 'Mariama Bâ', ['Aminata Sow Fall', 'Ken Bugul', 'Fatou Diome']),
  ],
  // day 42
  [
    D(1, 'In Robert McCloskey\'s "Make Way for Ducklings", in which city do the ducks settle?', 'Boston', ['New York', 'Philadelphia', 'Chicago']),
    D(2, 'Which writer used the pen name Dr. Seuss?', 'Theodor Geisel', ['Maurice Sendak', 'Shel Silverstein', 'Edward Gorey']),
    D(3, 'Which Zadie Smith debut novel of 2000 follows two families in Willesden, North London?', 'White Teeth', ['On Beauty', 'NW', 'Swing Time']),
    D(4, 'Which Hilary Mantel novel, the first of her Thomas Cromwell trilogy, won the 2009 Booker Prize?', 'Wolf Hall', ['Bring Up the Bodies', 'The Mirror and the Light', 'A Place of Greater Safety']),
    D(5, 'Which Octavia E. Butler novel sends a modern Black woman back to a Maryland plantation before the Civil War?', 'Kindred', ['Parable of the Sower', 'Wild Seed', 'Dawn']),
  ],
  // day 43
  [
    D(1, 'In "Hansel and Gretel", what does the witch plan to do with Hansel once he is fat?', 'Eat him', ['Sell him', 'Make him her servant', 'Turn him into a frog']),
    D(2, 'In "Les Misérables", what did Jean Valjean steal that first sent him to prison?', 'A loaf of bread', ['A silver candlestick', 'A horse', 'A purse of coins']),
    D(3, 'Which Shirley Jackson story describes a small town\'s annual drawing with a deadly outcome?', 'The Lottery', ['The Haunting of Hill House', 'The Tell-Tale Heart', 'The Most Dangerous Game']),
    D(4, 'Which South African-born novelist won the Booker Prize twice, for "Life and Times of Michael K" and "Disgrace"?', 'J. M. Coetzee', ['Nadine Gordimer', 'André Brink', 'Damon Galgut']),
    D(5, 'Which Julio Cortázar novel can be read in more than one order, following a table of instructions?', 'Hopscotch', ['Blow-Up', 'The Winners', '62: A Model Kit']),
  ],
  // day 44
  [
    D(1, 'In "The Hobbit", what kind of creatures are Thorin and his companions?', 'Dwarves', ['Elves', 'Goblins', 'Trolls']),
    D(2, 'Which author published several novels under the pen name Richard Bachman?', 'Stephen King', ['Dean Koontz', 'Peter Straub', 'Anne Rice']),
    D(3, 'Which James Hilton novel of 1933 imagined the hidden Himalayan valley of Shangri-La?', 'Lost Horizon', ['Goodbye, Mr. Chips', 'Kim', 'Black Narcissus']),
    D(4, 'On which Pacific islands did Robert Louis Stevenson settle and die in 1894?', 'Samoa', ['Fiji', 'Tahiti', 'Tonga']),
    D(5, 'Who in 1945 became the first Latin American writer to win the Nobel Prize in Literature?', 'Gabriela Mistral', ['Pablo Neruda', 'Jorge Luis Borges', 'Miguel Ángel Asturias']),
  ],
  // day 45
  [
    D(1, 'Which British author wrote the picture book "The Gruffalo"?', 'Julia Donaldson', ['Judith Kerr', 'Mo Willems', 'Eric Carle']),
    D(2, 'In "The Lord of the Rings", in which dark land does Mount Doom stand?', 'Mordor', ['Gondor', 'Rohan', 'Isengard']),
    D(3, 'Lord Byron died in 1824 while supporting which nation\'s war of independence?', 'Greece', ['Italy', 'Poland', 'Spain']),
    D(4, 'In which fictional Alabama town is "To Kill a Mockingbird" set?', 'Maycomb', ['Macon', 'Mobile', 'Yoknapatawpha']),
    D(5, 'Which German-born writer\'s 2001 novel "Austerlitz" follows a man piecing together his Kindertransport past?', 'W. G. Sebald', ['Günter Grass', 'Bernhard Schlink', 'Uwe Johnson']),
  ],
  // day 46
  [
    D(1, 'In Roald Dahl\'s book, who owns the chocolate factory that Charlie visits?', 'Willy Wonka', ['Mr. Slugworth', 'Augustus Gloop', 'Grandpa Joe']),
    D(2, 'In "Adventures of Huckleberry Finn", whom is Huck escaping when he fakes his own death?', 'His father, Pap', ['The Widow Douglas', 'Tom Sawyer', 'Injun Joe']),
    D(3, 'In "Frankenstein", whom does the creature kill on its maker\'s wedding night?', 'Elizabeth Lavenza', ['Justine Moritz', 'Henry Clerval', 'Caroline Beaufort']),
    D(4, 'In which Florida city is Ernest Hemingway\'s house, still home to dozens of six-toed cats?', 'Key West', ['St. Augustine', 'Miami', 'Pensacola']),
    D(5, 'Which American poet won the 2020 Nobel Prize in Literature?', 'Louise Glück', ['Mary Oliver', 'Rita Dove', 'Jorie Graham']),
  ],
  // day 47
  [
    D(1, 'In "The Little Engine That Could", what is the small engine trying to do?', 'Pull a train over a mountain', ['Win a race', 'Find its way home', 'Rescue a stranded ship']),
    D(2, 'In "Dracula", what is the name of Jonathan Harker\'s fiancée?', 'Mina Murray', ['Lucy Westenra', 'Ellen Hutter', 'Florence Balcombe']),
    D(3, 'Which circle of English writers and artists, including Virginia Woolf and E. M. Forster, took its name from a London district?', 'The Bloomsbury Group', ['The Inklings', 'The Souls', 'The Apostles']),
    D(4, 'As a boy, Charles Dickens worked in a factory pasting labels on pots of what?', 'Boot blacking', ['Jam', 'Ink', 'Mustard']),
    D(5, 'Which Japanese author won the 1994 Nobel Prize in Literature?', 'Kenzaburo Oe', ['Yukio Mishima', 'Kōbō Abe', 'Shūsaku Endō']),
  ],
  // day 48
  [
    D(1, 'In Aesop\'s fable "The Fox and the Grapes", why does the fox decide the grapes must be sour?', 'He cannot reach them', ['They are green', 'A bird warns him', 'He is already full']),
    D(2, 'In "Pride and Prejudice", which officer elopes with Lydia Bennet?', 'George Wickham', ['Colonel Fitzwilliam', 'Mr. Denny', 'Charles Bingley']),
    D(3, 'In which city did Edgar Allan Poe die in 1849?', 'Baltimore', ['Richmond', 'Boston', 'Philadelphia']),
    D(4, 'Which Richard Wright novel of 1940 follows Bigger Thomas in Chicago?', 'Native Son', ['Black Boy', 'Invisible Man', 'Go Tell It on the Mountain']),
    D(5, 'In 1930, who became the first American to win the Nobel Prize in Literature?', 'Sinclair Lewis', ['Theodore Dreiser', 'Eugene O\'Neill', 'Upton Sinclair']),
  ],
];
