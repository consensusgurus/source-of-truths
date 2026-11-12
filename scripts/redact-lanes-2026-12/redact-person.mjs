// Redact bank extension 2026-12-01 .. 2026-12-31, Person lane. Capsule
// articles for scripts/gen-redact.mjs to place on days (run it with this
// directory as the lane argument); identity fields are set there. Authored
// 2026-11-12 against the rules in app/redact/puzzles.js, US spellings, and
// gated by scripts/verify-redact.mjs. Facts are kept at the textbook level and
// were checked against Britannica and the subjects' standard biographies.
export const ARTICLES = [
  {
    cat: 'Person', diff: 2, answer: 'Isaac Newton',
    aka: { newten: 'newton', issac: 'isaac', isacc: 'isaac' },
    // avoid: Newton printed by eureka, sci, orbit, quotes, biz, history, outwit, outrank, streak, script
    avoid: ['2026-12-01', '2026-12-03', '2026-12-04', '2026-12-06', '2026-12-08', '2026-12-10', '2026-12-11', '2026-12-12', '2026-12-16', '2026-12-17', '2026-12-18', '2026-12-22', '2026-12-28', '2026-12-29', '2026-12-30', '2026-12-31'],
    text: `In 1665 an outbreak of plague closed the University of Cambridge, and a young graduate went home to his mother's farm at Woolsthorpe in Lincolnshire. Over the next two years, working largely alone, he laid the foundations of calculus, showed with prisms that white light is a mixture of colors, and began to wonder whether the force that pulls an apple to the ground might reach as far as the Moon. Late in life he liked to tell visitors that the apple story was true, and a tree said to descend from the original still grows in the garden there.

Isaac Newton returned to Cambridge and became its professor of mathematics at twenty six. In 1687 he published the Principia, a book that set out three laws of motion and a law of universal gravitation, and used them to explain the orbits of the planets, the paths of comets and the rise and fall of the tides. For two centuries it served as the framework of physics. He also built the first practical reflecting telescope, which used a curved mirror instead of a lens.

He was a difficult and secretive man. He quarreled bitterly with a rival at the Royal Society over credit for ideas about gravity and light, and with the German philosopher Gottfried Leibniz over which of them had invented calculus first. He spent long years on alchemy and on biblical prophecy, subjects he wrote about far more than physics. In his fifties he left academic life to run the Royal Mint in London, where he pursued counterfeiters with real zeal and saw several sent to the gallows. He was knighted in 1705, served for decades as president of the Royal Society, and was buried in Westminster Abbey in 1727.`,
  },
  {
    cat: 'Person', diff: 2, answer: 'Charles Darwin',
    aka: { darwen: 'darwin', charels: 'charles' },
    // avoid: Darwin printed by deep, atlas, gene, quotes, art, streak, eureka, outrank, outwit, history, sci; streak 12-21 keys Emma
    avoid: ['2026-12-04', '2026-12-07', '2026-12-08', '2026-12-10', '2026-12-11', '2026-12-15', '2026-12-16', '2026-12-17', '2026-12-19', '2026-12-20', '2026-12-26', '2026-12-27', '2026-12-29', '2026-12-21'],
    text: `The ship was a small naval survey vessel, and the young passenger aboard was taken on at first less as a naturalist than as a gentleman companion for the captain, Robert FitzRoy. The voyage was meant to last two years and took almost five, from 1831 to 1836. Much of the time was spent on land in South America, where he collected fossils of giant extinct mammals, felt the ground heave in an earthquake in Chile, and saw that the coast there had risen. In 1835 the ship called at the Galapagos Islands, where he noticed that the mockingbirds differed from island to island.

Back in England, Charles Darwin married his cousin Emma Wedgwood and settled at Down House in Kent, which he rarely left in later years, partly because of a chronic illness that has never been firmly diagnosed. In private notebooks he worked out a theory that species change over time through natural selection: individuals that happen to be better suited to their surroundings leave more offspring, and over many generations the small differences add up. He sat on the idea for twenty years, gathering evidence and spending eight of them on barnacles.

In 1858 a letter arrived from Alfred Russel Wallace, a naturalist working in the Malay Archipelago, describing almost the same theory. Papers by both men were read at the Linnean Society that summer, and the next year Darwin published On the Origin of Species, whose first printing was snapped up by booksellers before publication day. The book provoked fierce debate but persuaded most scientists within a generation. He later applied the theory to humans in The Descent of Man, and he was buried in Westminster Abbey in 1882.`,
  },
  {
    cat: 'Person', diff: 3, answer: 'Genghis Khan',
    aka: { gengis: 'genghis', jenghis: 'genghis', ghengis: 'genghis' },
    // avoid: Genghis printed by atlas, history, deep
    avoid: ['2026-12-02', '2026-12-09', '2026-12-18', '2026-12-23'],
    text: `He was born on the steppe of what is now Mongolia, probably around 1162, and given the name Temujin. His father, a minor chief, was poisoned by rivals when the boy was about nine, and the family was abandoned by its own clan to survive on roots, fish and small game. As a young man he was captured by an enemy tribe and held in a heavy wooden yoke, and he escaped. Over the next two decades he built a following through loyalty, shrewd alliances and repeated victories, until by 1206 every tribe of the steppe acknowledged him.

That year a great assembly gave him the title by which he is remembered, usually translated as universal ruler. Genghis Khan reorganized his people into units of ten, a hundred, a thousand and ten thousand, deliberately mixing tribes so that loyalty ran to the army rather than to kin, and promotion depended on merit. A relay system of mounted messengers carried orders across enormous distances, and his decrees were recorded in a script borrowed from the Uyghurs.

His campaigns were swift and often brutal. He broke through the defenses of the Jin dynasty in northern China, and when the Khwarazmian Empire of Central Asia killed his envoys, he destroyed it, leveling cities such as Urgench, Nishapur and Merv. Estimates of the dead run into the millions and remain disputed. Yet his empire also guaranteed safe passage for merchants along the trade routes and tolerated many religions. He died in 1227, during a campaign against the Western Xia, and the site of his grave is still unknown. His sons and grandsons extended his conquests into the largest contiguous land empire in history.`,
  },
  {
    cat: 'Person', diff: 3, answer: 'Rosa Parks',
    aka: { rossa: 'rosa' },
    // avoid: Rosa printed by history, sport, streak; atlas 12-16 keys Montgomery
    avoid: ['2026-12-01', '2026-12-09', '2026-12-17', '2026-12-19', '2026-12-25', '2026-12-16'],
    text: `On the evening of December 1, 1955, a seamstress at a Montgomery department store boarded a city bus for the ride home and took a seat in the first row of the section where Black passengers were allowed to sit. When the white section filled, the driver, James Blake, told her row to stand. Three passengers moved. She did not, and she was arrested for violating the city's segregation ordinance. She later wrote that she was not physically tired that day, as was often said, but tired of giving in.

Rosa Parks was no stranger to activism. She had served for years as secretary of the Montgomery chapter of the NAACP, had investigated cases of violence against Black residents, and that summer had attended a training session on civil rights at the Highlander Folk School in Tennessee. Nor was she the first to refuse: a fifteen year old, Claudette Colvin, had done the same nine months earlier. Local leaders judged that this case could carry a city.

Within days, Black residents began a boycott of the buses, led by a new group that chose a young pastor, Martin Luther King Jr., as its president. For 381 days people walked, shared rides and used a network of volunteer drivers, while the bus system lost most of its riders. The boycott ended in December 1956 after the Supreme Court upheld a ruling that bus segregation was unconstitutional. She lost her job, received threats, and moved to Detroit, where she worked for many years on the staff of Congressman John Conyers. When she died in 2005 she lay in honor in the Capitol Rotunda, the first woman to do so.`,
  },
  {
    cat: 'Person', diff: 3, answer: 'Louis Pasteur',
    aka: { pastuer: 'pasteur', pasteure: 'pasteur' },
    // avoid: Pasteur printed by pulse, origin, quotes; pulse 12-17 keys France
    avoid: ['2026-12-04', '2026-12-09', '2026-12-17'],
    text: `In the 1850s the distillers of northern France had a problem: vats of fermenting beet juice went sour for no obvious reason. A young chemist at Lille, already known for work on the way certain crystals twist polarized light, studied the vats under a microscope and argued that fermentation was the work of living yeast, and that spoilage was caused by other microbes getting in. He later showed that gently heating wine killed the culprits without ruining the taste. The technique, applied afterward to milk, still carries his name.

In a famous series of experiments around 1860, Louis Pasteur used flasks with long curved necks, shaped like a swan's, to show that a boiled broth stayed sterile as long as dust could not reach it, and spoiled quickly once the neck was broken. Life, he concluded, did not arise spontaneously from decaying matter. The work helped establish the germ theory of disease, which the English surgeon Joseph Lister soon used to argue for antiseptic practice in operating rooms.

He went on to save the French silk industry from a disease of silkworms and to develop vaccines against chicken cholera and anthrax, staging a public trial on sheep at Pouilly-le-Fort in 1881. In July 1885 a nine year old boy named Joseph Meister, badly bitten by a rabid dog, was brought to his laboratory in Paris, and after a course of injections the boy survived. Donations poured in, and the institute that bears his name opened in 1888. He suffered several strokes and died in 1895. Years later, Meister worked as a caretaker at that same institute.`,
  },
  {
    cat: 'Person', diff: 4, answer: 'Ignaz Semmelweis',
    aka: { semelweis: 'semmelweis', semmelweiss: 'semmelweis', semmelwies: 'semmelweis', ignatz: 'ignaz' },
    // avoid: Semmelweis printed by origin
    avoid: ['2026-12-09'],
    text: `In the 1840s the General Hospital of Vienna ran two maternity clinics side by side, and expectant mothers begged to be admitted to the second. In the first, staffed by doctors and medical students, childbed fever was killing women at several times the rate seen in the second, where midwives were trained. A young Hungarian assistant in the first clinic set out to learn why. He ruled out crowding, the weather and the embarrassment some blamed on male doctors, and found that one explanation after another led nowhere.

The answer came with a death. In 1847 a colleague, Jakob Kolletschka, was cut by a student's scalpel during an autopsy and died of an illness that looked exactly like childbed fever. Ignaz Semmelweis concluded that the doctors and students, who came to the wards straight from dissecting corpses, were carrying what he called cadaverous particles on their hands. He ordered everyone to wash in a solution of chlorinated lime before examining patients. Within months the death rate in his clinic fell to roughly the level of the midwives' clinic.

The medical establishment was not persuaded. His explanation came before the germ theory and contradicted the common belief that disease spread through bad air, and it implied that physicians themselves were killing their patients. He published little for years, lost his post in Vienna, and returned to Pest, where he brought down mortality at a city hospital the same way. When his book finally appeared in 1861, he answered critics with furious open letters. In 1865 he was committed to an asylum, where he died within weeks, probably from an infected wound after a beating by guards. Today he is honored as a pioneer of hand hygiene, and the reflexive rejection of new evidence is sometimes named after him.`,
  },
  {
    cat: 'Person', diff: 4, answer: 'Tycho Brahe',
    aka: { braahe: 'brahe', brahee: 'brahe', ticho: 'tycho', tyco: 'tycho' },
    // avoid: Tycho/Brahe printed by quotes, eureka, bond, sci; script 12-13 keys Duel
    avoid: ['2026-12-01', '2026-12-06', '2026-12-24', '2026-12-31', '2026-12-13'],
    text: `Late in 1572 a new star blazed up in the constellation Cassiopeia, bright enough at first to be seen in daylight. A young Danish nobleman measured its position night after night and found that it showed no shift against the background stars, which meant it lay far beyond the Moon. That was a problem for the received teaching, inherited from Aristotle, that the heavens beyond the Moon were perfect and unchanging. His short book on the new star made his name across Europe.

King Frederick II of Denmark granted Tycho Brahe the island of Hven, in the strait just north of Copenhagen, together with its rents, and there he built Uraniborg, a castle observatory with its own printing press and paper mill, and later Stjerneborg, a set of instruments sunk below ground to steady them against the wind. Working before the telescope, with huge quadrants and sextants, he and his assistants measured the positions of planets and stars more precisely than anyone had done before, to within about a minute of arc. His observations of a comet in 1577 showed that it, too, moved among the planets.

He proposed a compromise system in which the Sun and Moon circled the Earth while the other planets circled the Sun. After quarreling with the new king he moved to Prague as imperial mathematician to Rudolf II, and hired a gifted young assistant, Johannes Kepler. He died in 1601. Kepler inherited the records and used the careful measurements of Mars to show that planets move in ellipses. The astronomer himself is often remembered for his metal nose, a replacement for the bridge he lost in a duel as a student.`,
  },
  {
    cat: 'Person', diff: 4, answer: 'Hildegard of Bingen',
    aka: { hildergard: 'hildegard', hildegarde: 'hildegard' },
    text: `Her parents gave her to the Church as a child, probably at the age of eight, and by tradition as a tithe, since she was their tenth child. She was raised in a cell attached to the Benedictine monastery of Disibodenberg in the Rhineland, under the care of an anchoress named Jutta. When Jutta died in 1136, the women who had gathered around them chose her to lead the community. She later said that she had seen visions since early childhood, a blinding light in which she understood scripture, but had kept them to herself.

At forty two she received what she described as a command to write down what she saw. The result, Scivias, took about ten years, and parts of it were read and approved by Pope Eugenius III. Hildegard went on to found her own convent at Rupertsberg, near the town of Bingen where the Nahe meets the Rhine, against the wishes of the monks she was leaving, and later a second house at Eibingen. She wrote books on medicine and natural history describing plants, stones and animals and their uses in healing, as well as a morality play, Ordo Virtutum, set to music.

Her music is the part of her work most often heard today: more than seventy chants survive, with soaring melodies unusual for their wide range. She also corresponded with popes, emperors and Bernard of Clairvaux, and in her sixties made preaching tours, a remarkable thing for a woman of her time. She died in 1179. Centuries of local veneration were formally recognized only in 2012, when Pope Benedict XVI declared her a saint and a Doctor of the Church.`,
  },
  {
    cat: 'Person', diff: 4, answer: 'Mary Seacole',
    aka: { seacol: 'seacole', seecole: 'seacole', secole: 'seacole' },
    // avoid: Seacole printed by streak, quotes, sci, pulse, history
    avoid: ['2026-12-08', '2026-12-11', '2026-12-15', '2026-12-17', '2026-12-21'],
    text: `Born in Kingston, Jamaica, in 1805, the daughter of a Scottish soldier and a Jamaican woman who kept a boarding house for invalid officers, she learned from her mother the uses of herbal remedies and the nursing of tropical fevers. She traveled widely as a young woman, to the Bahamas, Haiti and Cuba, and later ran a store and hotel in Panama, where she treated victims of a cholera outbreak and, by her own account, examined the body of an infant who had died of it to learn more about the disease.

When the Crimean War broke out, she traveled to London and offered her services as a nurse. She was turned down by the War Office and by the organizers of Florence Nightingale's party of nurses, and she suspected that prejudice against her color played a part. Undeterred, Mary Seacole paid her own way to the Crimea with a business partner and built the British Hotel near Balaclava from salvaged materials, a combined store, canteen and lodging for officers. From there she rode out to the front lines with food and medicines, treating wounded men of both sides, sometimes under fire.

The war left her bankrupt, and when her plight was reported in the press, a benefit festival was held for her in London in 1857, attended by thousands. That year she published her memoir, Wonderful Adventures of Mrs Seacole in Many Lands, one of the first autobiographies published by a Black woman in Britain. She died in London in 1881 and was largely forgotten for a century, until her story was revived. In 2004 she was voted the greatest Black Briton in an online poll, and a statue of her was unveiled outside St Thomas' Hospital in 2016.`,
  },
];
