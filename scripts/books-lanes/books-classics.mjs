// Books lane: Classics (pre-1950 fiction, ancient and medieval epics and tales)
const L = "Classics";
const Q = (t, q, a, d) => ({ c: L, t, q, a, d });

export const LANE_DAYS = [
  // day 1
  [
    Q(1, "Which Jane Austen novel centers on Elizabeth Bennet and her tense courtship with a proud, wealthy landowner?", "Pride and Prejudice", ["Emma", "Persuasion", "Sense and Sensibility"]),
    Q(2, "In Frankenstein (1818), the creature secretly learns language by observing which family in a cottage?", "The De Laceys", ["The Lavenzas", "The Moritzes", "The Clervals"]),
    Q(3, "In Dostoevsky's 1866 novel of a murder in St. Petersburg, which cunning examining magistrate plays cat and mouse with the killer?", "Porfiry Petrovich", ["Pyotr Luzhin", "Semyon Marmeladov", "Andrey Lebezyatnikov"]),
    Q(4, "In Moby-Dick, what is the name of the South Seas harpooner who becomes the narrator's close friend?", "Queequeg", ["Tashtego", "Daggoo", "Fedallah"]),
    Q(5, "In Petronius's Satyricon, which wealthy freedman hosts the notoriously lavish dinner party?", "Trimalchio", ["Encolpius", "Ascyltos", "Eumolpus"]),
  ],
  // day 2
  [
    Q(1, "Which Dickens novel features Fagin, the leader of a gang of young pickpockets?", "Oliver Twist", ["David Copperfield", "Great Expectations", "Nicholas Nickleby"]),
    Q(2, "Which Dumas novel follows Edmond Dantès, wrongly imprisoned in the Château d'If, as he plots his revenge?", "The Count of Monte Cristo", ["The Three Musketeers", "The Man in the Iron Mask", "The Black Tulip"]),
    Q(3, "In Don Quixote, which peasant woman does the knight imagine as his idealized lady?", "Dulcinea", ["Marcela", "Dorotea", "Altisidora"]),
    Q(4, "In Gogol's story The Overcoat, what is the name of the poor copying clerk whose new coat is stolen?", "Akaky Akakievich", ["Makar Devushkin", "Ivan Ilyich", "Yevgeny"]),
    Q(5, "Which Danish author wrote Pelle the Conqueror, a novel of a poor Swedish immigrant boy in Denmark?", "Martin Andersen Nexø", ["Johannes V. Jensen", "Henrik Pontoppidan", "Herman Bang"]),
  ],
  // day 3
  [
    Q(1, "In Homer's epic of the king of Ithaca, who is the wife who waits twenty years for him to return?", "Penelope", ["Calypso", "Circe", "Helen"]),
    Q(2, "Which 1847 novel is told largely by the housekeeper Nelly Dean to a tenant named Lockwood?", "Wuthering Heights", ["Jane Eyre", "Villette", "The Tenant of Wildfell Hall"]),
    Q(3, "In Tolstoy's Anna Karenina, which army officer is the lover Anna leaves her husband for?", "Vronsky", ["Levin", "Oblomov", "Oblonsky"]),
    Q(4, "In Beowulf's last battle against a dragon, which young warrior stays to help the aging hero?", "Wiglaf", ["Unferth", "Hrothgar", "Hygelac"]),
    Q(5, "Which anonymous 1554 Spanish tale follows a boy who serves a blind beggar and a series of other masters?", "Lazarillo de Tormes", ["Guzmán de Alfarache", "El Buscón", "La Celestina"]),
  ],
  // day 4
  [
    Q(1, "In Twain's 1884 novel, what is the name of the runaway slave who rafts down the Mississippi with Huck?", "Jim", ["Pap", "Sid", "Buck"]),
    Q(2, "In Bram Stoker's Dracula, what is Jonathan Harker's profession when he travels to the Count's castle?", "Solicitor", ["Physician", "Sea captain", "Journalist"]),
    Q(3, "In Les Misérables, which kindly churchman shelters Jean Valjean after his release from prison?", "Bishop Myriel", ["Monsieur Fauchelevent", "Monsieur Gillenormand", "Monsieur Thénardier"]),
    Q(4, "Which 1840 Russian novel by Mikhail Lermontov is built from linked tales about the bored young officer Pechorin?", "A Hero of Our Time", ["Fathers and Sons", "Oblomov", "The Captain's Daughter"]),
    Q(5, "Thomas Mann's Buddenbrooks (1901) traces the decline of a merchant family across how many generations?", "Four", ["Three", "Five", "Six"]),
  ],
  // day 5
  [
    Q(1, "Which Conan Doyle story sends Holmes and Watson to Dartmoor to investigate a ghostly beast on the moor?", "The Hound of the Baskervilles", ["A Study in Scarlet", "The Sign of the Four", "The Valley of Fear"]),
    Q(2, "In Robert Louis Stevenson's 1886 novella, what is the name of Dr. Jekyll's sinister alter ego?", "Mr. Hyde", ["Mr. Utterson", "Mr. Enfield", "Dr. Lanyon"]),
    Q(3, "In Flaubert's 1857 novel, what is the first name of Emma's dull country-doctor husband?", "Charles", ["Rodolphe", "Léon", "Hippolyte"]),
    Q(4, "In The Brothers Karamazov, which brother is the gentle novice living in a monastery?", "Alyosha", ["Dmitri", "Ivan", "Smerdyakov"]),
    Q(5, "Which 2nd-century Roman writer from Madauros wrote the only Latin novel to survive complete?", "Apuleius", ["Petronius", "Lucian", "Longus"]),
  ],
  // day 6
  [
    Q(1, "In A Christmas Carol, which deceased business partner of Scrooge returns as a ghost to warn him?", "Jacob Marley", ["Bob Cratchit", "Mr. Fezziwig", "Fred"]),
    Q(2, "In Orwell's Animal Farm, which pig serves as the farm's smooth-talking propagandist?", "Squealer", ["Snowball", "Napoleon", "Old Major"]),
    Q(3, "In Jules Verne's Twenty Thousand Leagues Under the Seas, what is the name of the submarine's mysterious captain?", "Nemo", ["Fogg", "Nicholl", "Barbicane"]),
    Q(4, "Which author left The Castle unfinished at his death, with the novel published in 1926?", "Franz Kafka", ["Robert Musil", "Hermann Broch", "Arthur Schnitzler"]),
    Q(5, "Which Brazilian author wrote the 1881 novel narrated by a deceased man named Brás Cubas?", "Machado de Assis", ["José de Alencar", "Aluísio Azevedo", "Euclides da Cunha"]),
  ],
  // day 7
  [
    Q(1, "In The Great Gatsby, which married woman, Tom Buchanan's mistress, is killed by a speeding car?", "Myrtle Wilson", ["Jordan Baker", "Daisy Buchanan", "Catherine"]),
    Q(2, "In Wuthering Heights, the foundling Heathcliff is brought up in the home of which family?", "The Earnshaws", ["The Lintons", "The Lockwoods", "The Deans"]),
    Q(3, "In Hardy's 1891 novel about a milkmaid named Tess, which man does she kill?", "Alec d'Urberville", ["Angel Clare", "Jack Durbeyfield", "Dick Dewy"]),
    Q(4, "In Turgenev's Fathers and Sons, which young medical student champions nihilism?", "Bazarov", ["Rudin", "Oblomov", "Lavretsky"]),
    Q(5, "Which Polish author wrote the 1890 novel The Doll, about the merchant Stanisław Wokulski?", "Bolesław Prus", ["Henryk Sienkiewicz", "Władysław Reymont", "Eliza Orzeszkowa"]),
  ],
  // day 8
  [
    Q(1, "In Hugo's novel of Notre-Dame de Paris, which archdeacon is obsessed with the dancer Esmeralda?", "Claude Frollo", ["Phoebus", "Pierre Gringoire", "Clopin Trouillefou"]),
    Q(2, "Count Dracula's castle in Bram Stoker's novel lies near the Borgo Pass in which region?", "Transylvania", ["Wallachia", "Bukovina", "Styria"]),
    Q(3, "Which 1719 novel by Daniel Defoe tells of a sailor shipwrecked for decades on a remote island?", "Robinson Crusoe", ["Moll Flanders", "Captain Singleton", "Roxana"]),
    Q(4, "In the first voyage of Gulliver's Travels, Lilliput is at war with which rival island empire?", "Blefuscu", ["Brobdingnag", "Laputa", "Glubbdubdrib"]),
    Q(5, "In Boccaccio's Decameron, how many young people escape the plague in Florence to tell stories in the countryside?", "Ten", ["Seven", "Twelve", "Fourteen"]),
  ],
  // day 9
  [
    Q(1, "In Don Quixote, what does the deluded knight famously mistake for giants?", "Windmills", ["Castles", "Soldiers", "Haystacks"]),
    Q(2, "In Dickens's 1861 novel, what is the name of the orphan who narrates the story?", "Pip", ["Magwitch", "Herbert", "Jaggers"]),
    Q(3, "In Tolstoy's 1886 novella about the dying Ivan Ilyich, what is the character's profession?", "Judge", ["Physician", "General", "Landowner"]),
    Q(4, "Which 1869 Dostoevsky novel stars Prince Myshkin, who returns to Russia from a Swiss sanatorium?", "The Idiot", ["Demons", "The Gambler", "The Adolescent"]),
    Q(5, "In Gogol's Dead Souls, what is the name of the swindler who travels buying up the names of deceased serfs?", "Chichikov", ["Nozdryov", "Manilov", "Plyushkin"]),
  ],
  // day 10
  [
    Q(1, "In H. G. Wells's 1898 novel The War of the Worlds, the invaders come from which planet?", "Mars", ["Venus", "Jupiter", "The Moon"]),
    Q(2, "In Verne's 1873 novel, Phileas Fogg wagers he can circle the globe in how many days?", "Eighty", ["Sixty", "Ninety", "One hundred"]),
    Q(3, "Which 1782 epistolary novel by Choderlos de Laclos follows the scheming Marquise de Merteuil and the Vicomte de Valmont?", "Les Liaisons dangereuses", ["La Princesse de Clèves", "Manon Lescaut", "Julie, or the New Heloise"]),
    Q(4, "In Stendhal's The Red and the Black, the red is usually read as the army; the black stands for which institution?", "The Church", ["The judiciary", "The aristocracy", "The press"]),
    Q(5, "Sigrid Undset's trilogy Kristin Lavransdatter, published in the early 1920s, is set mainly in which century?", "The 14th century", ["The 12th century", "The 10th century", "The 16th century"]),
  ],
  // day 11
  [
    Q(1, "In Orwell's 1949 dystopia, what is the first name of the clerk who rewrites history at the Ministry of Truth?", "Winston", ["Julian", "Oswald", "Gilbert"]),
    Q(2, "Which Dickens novel is set in London and Paris during the years of the French Revolution?", "A Tale of Two Cities", ["Barnaby Rudge", "Hard Times", "Little Dorrit"]),
    Q(3, "How does the heroine of Tolstoy's Anna Karenina die?", "Under a train", ["By poison", "By drowning", "In a carriage accident"]),
    Q(4, "Émile Zola's 1885 novel Germinal depicts a strike among which group of workers?", "Coal miners", ["Textile weavers", "Dockworkers", "Railway porters"]),
    Q(5, "The Good Soldier Švejk by Jaroslav Hašek satirizes the army of which empire during World War I?", "Austria-Hungary", ["Germany", "Russia", "The Ottoman Empire"]),
  ],
  // day 12
  [
    Q(1, "In Moby-Dick, what kind of animal is the great white creature Ahab hunts?", "A sperm whale", ["A great white shark", "A giant squid", "An orca"]),
    Q(2, "In Wilde's novel of 1890, Dorian Gray falls in love with an actress named what?", "Sibyl Vane", ["Hetty Merton", "Lady Narborough", "Victoria Wotton"]),
    Q(3, "Which Ming-dynasty Chinese novel follows a monk's pilgrimage west, accompanied by the Monkey King?", "Journey to the West", ["Water Margin", "Romance of the Three Kingdoms", "The Plum in the Golden Vase"]),
    Q(4, "In Hardy's 1886 novel The Mayor of Casterbridge, what shocking act does Michael Henchard commit at a country fair?", "He sells his wife", ["He burns a rick", "He forges a will", "He abandons his child"]),
    Q(5, "Which Swedish author wrote Gösta Berling's Saga, published in 1891?", "Selma Lagerlöf", ["August Strindberg", "Hjalmar Söderberg", "Verner von Heidenstam"]),
  ],
  // day 13
  [
    Q(1, "Which Anglo-Irish satirist wrote Gulliver's Travels?", "Jonathan Swift", ["Daniel Defoe", "Henry Fielding", "Laurence Sterne"]),
    Q(2, "In Dumas's The Three Musketeers, which woman, branded with a fleur-de-lis, serves as Cardinal Richelieu's agent?", "Milady de Winter", ["Constance Bonacieux", "Anne of Austria", "Madame de Chevreuse"]),
    Q(3, "In Conrad's Lord Jim, what is the name of the pilgrim ship Jim abandons, leading to his disgrace?", "Patna", ["Judea", "Nellie", "Narcissus"]),
    Q(4, "Which Henry James novel of 1881 follows the American heiress Isabel Archer in Europe?", "The Portrait of a Lady", ["The Wings of the Dove", "The Ambassadors", "Washington Square"]),
    Q(5, "Which 1827 novel by Alessandro Manzoni follows the lovers Renzo and Lucia in 17th-century Lombardy?", "The Betrothed", ["Ettore Fieramosca", "Marco Visconti", "The Last Letters of Jacopo Ortis"]),
  ],
  // day 14
  [
    Q(1, "What is the name of Sherlock Holmes's elder brother, who works quietly for the British government?", "Mycroft", ["Lestrade", "Gregson", "Sigerson"]),
    Q(2, "In Jane Eyre, which school friend of the heroine dies of consumption at Lowood?", "Helen Burns", ["Bertha Mason", "Blanche Ingram", "Adèle Varens"]),
    Q(3, "In Voltaire's Candide, which European city is devastated by an earthquake in 1755?", "Lisbon", ["Paris", "Madrid", "Naples"]),
    Q(4, "In Kafka's 1925 novel The Trial, the bank officer arrested one morning is known by what name?", "Josef K.", ["Gregor Samsa", "Georg Bendemann", "Karl Rossmann"]),
    Q(5, "Which French author wrote the 1932 novel Journey to the End of the Night?", "Louis-Ferdinand Céline", ["Henri Barbusse", "Georges Bernanos", "André Malraux"]),
  ],
  // day 15
  [
    Q(1, "Which author created Tarzan of the Apes?", "Edgar Rice Burroughs", ["Rudyard Kipling", "Jack London", "Rafael Sabatini"]),
    Q(2, "Which Brontë sister wrote Wuthering Heights?", "Emily", ["Charlotte", "Anne", "Maria"]),
    Q(3, "In the Aeneid, which Carthaginian queen falls in love with the Trojan hero and dies on a pyre when he departs?", "Dido", ["Lavinia", "Camilla", "Creusa"]),
    Q(4, "In the Epic of Gilgamesh, which companion helps the king slay Humbaba, guardian of the Cedar Forest?", "Enkidu", ["Utnapishtim", "Shamhat", "Siduri"]),
    Q(5, "Which battlefield, today a city in Haryana, is where the Mahabharata's war between the Pandavas and Kauravas is fought?", "Kurukshetra", ["Panipat", "Hastinapura", "Dwarka"]),
  ],
  // day 16
  [
    Q(1, "In The Great Gatsby, what color is the light at the end of Daisy's dock?", "Green", ["Red", "Blue", "Yellow"]),
    Q(2, "Which American novelist wrote The Last of the Mohicans, published in 1826?", "James Fenimore Cooper", ["Herman Melville", "Washington Irving", "Nathaniel Hawthorne"]),
    Q(3, "In The Scarlet Letter, which minister is the secret father of Hester Prynne's child?", "Arthur Dimmesdale", ["Roger Chillingworth", "John Wilson", "Richard Bellingham"]),
    Q(4, "In Melville's Billy Budd, the sailor is taken from the merchant ship Rights-of-Man to which warship?", "HMS Bellipotent", ["HMS Temeraire", "HMS Victory", "HMS Agamemnon"]),
    Q(5, "Which Bengali author wrote the 1910 novel Gora, a story of identity and nationalism?", "Rabindranath Tagore", ["Bankim Chandra Chatterjee", "Sarat Chandra Chattopadhyay", "Premchand"]),
  ],
  // day 17
  [
    Q(1, "Which Greek hero, captain of the ship Argo, wins the Golden Fleece with the help of Medea?", "Jason", ["Perseus", "Theseus", "Orpheus"]),
    Q(2, "Which Jules Verne novel features the Baltimore Gun Club firing a projectile toward the Moon?", "From the Earth to the Moon", ["Journey to the Center of the Earth", "Five Weeks in a Balloon", "Off on a Comet"]),
    Q(3, "In Austen's Persuasion, which naval officer woos Anne Elliot a second time?", "Captain Wentworth", ["Mr. Darcy", "Mr. Knightley", "Henry Tilney"]),
    Q(4, "Which George Eliot novel centers on the idealistic Dorothea Brooke in a provincial English town?", "Middlemarch", ["Daniel Deronda", "Silas Marner", "Adam Bede"]),
    Q(5, "In Thomas Mann's The Magic Mountain, Hans Castorp visits a sanatorium in which Swiss town?", "Davos", ["Zermatt", "St. Moritz", "Montreux"]),
  ],
  // day 18
  [
    Q(1, "In Greek legend, which Trojan prince's abduction of Helen sparks the war?", "Paris", ["Hector", "Aeneas", "Priam"]),
    Q(2, "Which 16th-century French writer created the giants Gargantua and Pantagruel?", "François Rabelais", ["Michel de Montaigne", "Pierre de Ronsard", "Clément Marot"]),
    Q(3, "In Dickens's David Copperfield, which falsely humble clerk schemes against the Wickfield family?", "Uriah Heep", ["Wackford Squeers", "Fagin", "Bill Sikes"]),
    Q(4, "What was the maiden name of Becky, the social climber of Thackeray's Vanity Fair?", "Sharp", ["Crawley", "Osborne", "Sedley"]),
    Q(5, "Which author's nine-volume comic novel of 1759 to 1767 has a narrator who struggles even to tell of his own birth?", "Laurence Sterne", ["Tobias Smollett", "Samuel Richardson", "Henry Fielding"]),
  ],
  // day 19
  [
    Q(1, "In Beowulf, what is the name of the monster the hero first fights in the hall Heorot?", "Grendel", ["Fafnir", "Cacus", "Typhon"]),
    Q(2, "Which Russian author wrote the 1836 novel The Captain's Daughter?", "Alexander Pushkin", ["Mikhail Lermontov", "Nikolai Gogol", "Ivan Turgenev"]),
    Q(3, "In Malory's Le Morte d'Arthur, which pure young knight achieves the quest of the Holy Grail?", "Galahad", ["Gawain", "Tristram", "Kay"]),
    Q(4, "In The Tale of Genji, the hero is nicknamed what, for his dazzling beauty?", "The Shining Prince", ["The Moon Prince", "The Jade Prince", "The Silent Prince"]),
    Q(5, "In the Icelandic Njáls saga, which warrior of Hlíðarendi is the close friend of the sage Njáll?", "Gunnar", ["Egil", "Grettir", "Kormak"]),
  ],
  // day 20
  [
    Q(1, "What is Mr. Darcy's first name in Pride and Prejudice?", "Fitzwilliam", ["Charles", "George", "Edmund"]),
    Q(2, "In H. G. Wells's The Time Machine, the narrator meets the gentle Eloi and which subterranean race?", "The Morlocks", ["The Selenites", "The Martians", "The Lilliputians"]),
    Q(3, "Which Dickens novel features the jilted, cobweb-shrouded Miss Havisham?", "Great Expectations", ["Bleak House", "Hard Times", "Our Mutual Friend"]),
    Q(4, "In Conrad's 1904 novel Nostromo, the story is set in an imaginary South American republic called what?", "Costaguana", ["Ruritania", "Patusan", "Zembla"]),
    Q(5, "Which Dostoevsky novel of 1872 was inspired by the real-life murder of a student by a revolutionary cell?", "Demons", ["The Idiot", "The Gambler", "The Adolescent"]),
  ],
  // day 21
  [
    Q(1, "In the legend of the Trojan War, what did the Greeks leave outside Troy's gates as a trick?", "A wooden horse", ["A gilded ship", "A bronze bull", "A siege tower"]),
    Q(2, "In Austen's Mansfield Park, which poor cousin is raised at the estate of Sir Thomas Bertram?", "Fanny Price", ["Elinor Dashwood", "Anne Elliot", "Catherine Morland"]),
    Q(3, "In which Balzac novel does the ambitious student Rastignac lodge at the Maison Vauquer?", "Le Père Goriot", ["Cousin Bette", "Eugénie Grandet", "Lost Illusions"]),
    Q(4, "Zola's twenty-novel cycle follows the fortunes of which family under the Second Empire?", "The Rougon-Macquart", ["The Thibaults", "The Goriots", "The Forsytes"]),
    Q(5, "Which Portuguese author wrote The Maias, published in 1888?", "Eça de Queirós", ["Camilo Castelo Branco", "Fernando Pessoa", "Almeida Garrett"]),
  ],
  // day 22
  [
    Q(1, "Which Homeric epic opens with a quarrel between Agamemnon and Achilles?", "The Iliad", ["The Odyssey", "The Aeneid", "The Argonautica"]),
    Q(2, "In Proust's In Search of Lost Time, which small cake dipped in tea unlocks the narrator's childhood memories?", "The madeleine", ["The éclair", "The macaron", "The croissant"]),
    Q(3, "In Willa Cather's My Ántonia, the title heroine's family are immigrants from which region?", "Bohemia", ["Norway", "Sweden", "Ukraine"]),
    Q(4, "In Cao Xueqin's 18th-century novel, which boy of the Jia household is born with a piece of jade in his mouth?", "Jia Baoyu", ["Jia Zheng", "Jia Lian", "Xue Pan"]),
    Q(5, "The medieval Japanese Tale of the Heike narrates the rise and fall of the Taira clan in its war against which clan?", "The Minamoto", ["The Fujiwara", "The Tokugawa", "The Hojo"]),
  ],
];
