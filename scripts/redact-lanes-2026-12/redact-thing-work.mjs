// Redact bank extension 2026-12-01 .. 2026-12-31, Thing and Work lane.
// Capsule articles for scripts/gen-redact.mjs; identity fields are set there.
// Authored 2026-11-12 against the rules in app/redact/puzzles.js, US
// spellings, and gated by scripts/verify-redact.mjs. Facts are kept at the
// textbook level and were checked against Britannica, the holding libraries'
// and museums' catalog notes, and standard reference histories.
export const ARTICLES = [
  {
    cat: 'Thing', diff: 2, answer: 'Penicillin',
    aka: { penicilin: 'penicillin', penecillin: 'penicillin', pennicillin: 'penicillin', penicillen: 'penicillin' },
    // avoid: penicillin or Fleming printed by orbit, streak, bond, gene, sci, quotes, script, eureka; deep 12-15 keys 1929
    avoid: ['2026-12-03', '2026-12-04', '2026-12-06', '2026-12-11', '2026-12-17', '2026-12-18', '2026-12-25', '2026-12-29', '2026-12-31', '2026-12-15'],
    text: `In September 1928 a Scottish bacteriologist named Alexander Fleming came back from a summer vacation to his cluttered laboratory at St Mary's Hospital in London and began sorting through a stack of culture dishes he had left out. On one, a blue-green mold had grown, and around it the colonies of staphylococcus bacteria had died away. The mold was a species of Penicillium, probably drifting up from a laboratory on the floor below. Fleming named the substance it produced after the mold and published his findings in 1929, but he could not purify it in useful amounts, and the work stalled for a decade.

At Oxford in 1939, a team led by the Australian pathologist Howard Florey and the German-born chemist Ernst Chain took up the problem. They grew the mold in hundreds of vessels, including bedpans and milk churns, extracted the drug, and in 1940 showed that it protected infected mice. The first human patient, a police constable named Albert Alexander, improved dramatically in 1941 but died when the tiny supply ran out, even though the drug was recovered from his urine to be used again.

Mass production came in the United States, where a government laboratory in Peoria, Illinois, developed deep tank fermentation and found a far more productive strain growing on a moldy cantaloupe from a local market. By the Normandy landings in 1944 there was enough for Allied troops. Penicillin turned once deadly infections such as pneumonia, syphilis and blood poisoning into treatable illnesses, and Fleming, Florey and Chain shared the Nobel Prize in 1945. In his Nobel lecture Fleming warned that misuse could breed resistant bacteria, a warning that has since come true.`,
  },
  {
    cat: 'Thing', diff: 2, answer: 'Chocolate',
    aka: { choclate: 'chocolate', chocolat: 'chocolate', chocalate: 'chocolate' },
    // avoid: chocolate or cocoa printed most days by foodie, feud, biz, outwit, hearsay and others
    avoid: ['2026-12-01', '2026-12-02', '2026-12-03', '2026-12-04', '2026-12-05', '2026-12-06', '2026-12-07', '2026-12-08', '2026-12-09', '2026-12-10', '2026-12-11', '2026-12-13', '2026-12-14', '2026-12-15', '2026-12-16', '2026-12-18', '2026-12-19', '2026-12-20', '2026-12-21', '2026-12-23', '2026-12-24', '2026-12-25', '2026-12-27', '2026-12-29', '2026-12-30', '2026-12-31'],
    text: `The cacao tree grows only in a narrow band of warm, wet tropical forest, and its fruit is a ribbed pod that sprouts straight from the trunk. Inside are a few dozen seeds wrapped in sweet white pulp. Left to ferment in heaps and then dried in the sun, the bitter seeds develop the deep flavor prized for thousands of years. Traces of cacao in pottery from Ecuador suggest it was used more than five thousand years ago, and the Olmec, Maya and Aztec peoples of Mesoamerica drank it as a frothy, spiced and often unsweetened beverage.

Among the Aztecs, cacao beans were valuable enough to serve as money, and the drink was reserved largely for nobles, warriors and priests. Spanish conquerors brought cacao back to Europe in the sixteenth century, where it was sweetened with sugar and became a fashionable hot drink among the wealthy, served in the chocolate houses of the big cities. For centuries chocolate was drunk, not eaten. That changed with a run of inventions in the nineteenth century: the Dutch chemist Coenraad van Houten patented a press that separated cocoa butter from cocoa powder, the English firm of Fry made a molded bar, and in Switzerland Daniel Peter added condensed milk to create milk chocolate.

Today most of the world's cacao is grown in West Africa, with Ivory Coast and Ghana together producing more than half the crop, much of it on small family farms. The industry has faced persistent problems with child labor and deforestation, and in 2024 prices jumped to record highs after disease and bad weather hit West African harvests. The beans contain theobromine, a stimulant related to caffeine that is poisonous to dogs.`,
  },
  {
    cat: 'Work', diff: 2, answer: 'The Mona Lisa',
    aka: { monalisa: 'mona', lise: 'lisa' },
    // avoid: Mona or Lisa printed by atlas, biz, quotes, carmen, script, streak, art, outwit, sci, and Listed 12-30 (Louvre); history 12-28 keys Italy from Florence, hearsay prints Florence
    avoid: ['2026-12-04', '2026-12-06', '2026-12-07', '2026-12-08', '2026-12-12', '2026-12-13', '2026-12-14', '2026-12-15', '2026-12-17', '2026-12-21', '2026-12-26', '2026-12-30', '2026-12-28'],
    text: `On the morning of August 22, 1911, a painter who had come to the Louvre to copy a work in the Salon Carre found four iron pegs on the wall where a small portrait should have been. Guards assumed it had been taken away to be photographed. It had in fact been stolen the day before by Vincenzo Peruggia, an Italian handyman who had worked at the museum. By the usual account he hid there overnight and walked out with the panel under his smock. The theft made front pages around the world, and crowds came to stare at the empty space.

The painting had been begun by Leonardo da Vinci in Florence around 1503, probably commissioned by a silk merchant, Francesco del Giocondo, as a portrait of his wife, Lisa Gherardini. Leonardo never delivered it. He kept working on it for years and carried it with him to France, where it passed into the royal collection after his death. Painted in oil on a poplar panel only about thirty inches tall, it is famous for its sfumato, the soft blending of tones without hard outlines, for the dreamlike landscape behind the sitter, and above all for the elusive smile that seems to change as the viewer looks.

Peruggia kept the Mona Lisa in his room in Paris for more than two years before trying to sell it to an art dealer in Florence in 1913, and he was arrested. He claimed he had wanted to return it to Italy. The painting went back to Paris, more famous than ever. Today it hangs behind bulletproof glass and is seen by millions of visitors a year, and in Italy it is still known as La Gioconda.`,
  },
  {
    cat: 'Work', diff: 2, answer: 'Romeo and Juliet',
    aka: { juliette: 'juliet', romio: 'romeo', julliet: 'juliet' },
    // avoid: Romeo or Juliet printed by atlas, script, origin, outwit, art, quotes, and Listed 12-04 (West Side Story)
    avoid: ['2026-12-04', '2026-12-07', '2026-12-11', '2026-12-14', '2026-12-18', '2026-12-26', '2026-12-28'],
    text: `The story was old long before an English playwright took it up. Italian writers of the sixteenth century, among them Luigi da Porto and Matteo Bandello, told of two young lovers from feuding families of Verona, and in 1562 the English poet Arthur Brooke turned the tale into a long narrative poem, which became the main source. In that version the action unfolds over about nine months. In William Shakespeare's play, first printed in 1597, it is compressed into less than a week.

Romeo and Juliet opens with a sonnet spoken by a chorus, announcing a pair of star-crossed lovers whose deaths will end their parents' strife, so the audience knows the ending from the start. Romeo, a Montague, gatecrashes a feast at the house of the Capulets and falls instantly for their daughter, who is not yet fourteen. They marry in secret with the help of Friar Laurence. When Juliet's cousin Tybalt kills Romeo's friend Mercutio in a street fight, Romeo kills Tybalt and is banished. The friar's plan to reunite the couple with a potion that mimics death goes fatally wrong when his message fails to reach Romeo in Mantua.

The play contains some of the best-known lines in English, from the balcony scene's question of what is in a name to Mercutio's dying curse, a plague on both your houses. It has been adapted endlessly: as Tchaikovsky's fantasy overture, Prokofiev's ballet, the Broadway musical West Side Story, set among rival New York gangs, and films by Franco Zeffirelli and Baz Luhrmann. In Verona, a medieval house with a balcony added in the twentieth century is promoted as Juliet's home, and visitors leave letters addressed to her.`,
  },
  {
    cat: 'Thing', diff: 3, answer: 'The Enigma Machine',
    aka: { enigmia: 'enigma', engima: 'enigma' },
    // avoid: Enigma, Turing or Bletchley printed by eureka, streak, quotes, history, sci, vocab
    avoid: ['2026-12-02', '2026-12-03', '2026-12-04', '2026-12-07', '2026-12-09', '2026-12-14', '2026-12-15', '2026-12-23', '2026-12-24', '2026-12-26', '2026-12-28', '2026-12-29'],
    text: `Around the end of 1932, weeks before Hitler came to power, a young mathematician at the Polish Cipher Bureau in Warsaw, Marian Rejewski, used a few pages of stolen documents and the theory of permutations to reconstruct the internal wiring of a German military cipher device he had never seen. With his colleagues Jerzy Rozycki and Henryk Zygalski he built replicas and devised methods for reading German traffic through most of the 1930s. In July 1939, weeks before the invasion of Poland, they handed everything they knew to astonished British and French codebreakers.

The device looked like a typewriter in a wooden box. Pressing a key sent an electric current through a set of rotating wheels, or rotors, and a plugboard that swapped pairs of letters, lighting up a different letter on a lampboard. The rotors stepped forward with every keystroke, so the same letter was enciphered differently each time, and the settings changed daily. The number of possible starting configurations was astronomically large, and the Germans considered the Enigma machine unbreakable. One quirk helped the attackers: no letter could ever be enciphered as itself.

At Bletchley Park, a country house north of London, thousands of people, most of them women, worked on the problem. Mathematicians including Gordon Welchman designed electromechanical machines called bombes that tested possible settings at high speed, exploiting guessed fragments of text such as weather reports and routine greetings. Codebooks captured from U-boats and weather ships helped as well. The intelligence, code-named Ultra, played a major part in winning the Battle of the Atlantic and in planning D-Day. The work stayed secret until the 1970s.`,
  },
  {
    cat: 'Work', diff: 3, answer: 'The Canterbury Tales',
    aka: { canterbery: 'canterbury', cantebury: 'canterbury', canturbury: 'canterbury' },
    // avoid: Canterbury or Chaucer printed by deep, history, quotes, atlas, streak
    avoid: ['2026-12-05', '2026-12-07', '2026-12-13', '2026-12-15', '2026-12-23', '2026-12-29'],
    text: `Around 1387 a London customs official, diplomat and courtier, who had already written several long poems for the royal court, began a vast project in English rather than the French or Latin favored by many educated writers of his day. Its frame is simple. Some thirty pilgrims of every rank meet at the Tabard Inn in Southwark, across the Thames from London, before setting out on a pilgrimage to the shrine of Saint Thomas Becket. The innkeeper, Harry Bailly, proposes a contest: each pilgrim will tell stories on the road, and the best storyteller will win a free supper on their return.

The plan called for each pilgrim to tell four tales, more than a hundred in all, but Geoffrey Chaucer completed only twenty four before his death in 1400, and the pilgrims never reach the cathedral. The General Prologue, opening with the sweet showers of April, sketches the travelers in vivid and often satirical portraits: the gentle Knight, the dainty Prioress, the corrupt Pardoner selling fake relics, and the Wife of Bath, who has outlived five husbands and argues for women's authority in marriage. The Canterbury Tales range from courtly romance and saints' lives to bawdy comic tales known as fabliaux, such as the Miller's Tale, which the narrator apologizes for repeating.

Written in the dialect of London, the poem helped establish English as a language of literature, and Chaucer is often called the father of English poetry. It survives in more than eighty manuscripts, the most famous being the richly illustrated Ellesmere manuscript, and it was among the first books printed in England, by William Caxton around 1476. Chaucer was buried in Westminster Abbey, in what became Poets' Corner.`,
  },
  {
    cat: 'Work', diff: 3, answer: 'The Great Gatsby',
    aka: { gatsbey: 'gatsby', gatsbie: 'gatsby', gatbsy: 'gatsby' },
    // avoid: Gatsby or Fitzgerald printed by quotes, outwit, sport, art, origin, sci, deep
    avoid: ['2026-12-08', '2026-12-14', '2026-12-15', '2026-12-17', '2026-12-18', '2026-12-25', '2026-12-30'],
    text: `The novel was published in April 1925 by Scribner's, with a cover showing a pair of sad, disembodied eyes and red lips floating above a carnival of lights, painted by the artist Francis Cugat before the book was finished. Its author, then twenty eight and living in Europe, had high hopes for it after the success of his first novel. Reviews were mixed and sales disappointing, fewer than twenty five thousand copies in his lifetime. When F. Scott Fitzgerald died in 1940, believing himself a failure, unsold copies from the second printing were still sitting in the publisher's warehouse.

The story is told by Nick Carraway, a young bond salesman from the Midwest who rents a small house on Long Island next to the mansion of a mysterious millionaire famous for his lavish parties. Across the bay lives Nick's cousin Daisy Buchanan with her wealthy, brutish husband, Tom, and at the end of her dock burns a green light. Gradually Nick learns that his neighbor, born James Gatz to poor farmers in North Dakota, has reinvented himself and built his fortune, partly through bootlegging, to win back Daisy, whom he loved before the war. The Great Gatsby ends with a fatal car accident and a murder, and with Nick reflecting on the pull of the past.

The book's fortunes changed during the Second World War, when about 150,000 copies were given free to American servicemen in special armed services editions. It became a fixture of high school reading lists and is often named as a leading candidate for the great American novel. It has been filmed several times, most recently by Baz Luhrmann in 2013, and it entered the public domain in the United States in 2021.`,
  },
  {
    cat: 'Thing', diff: 4, answer: 'The Lindisfarne Gospels',
    aka: { lindisfarn: 'lindisfarne', lindesfarne: 'lindisfarne', lindisfern: 'lindisfarne' },
    // avoid: Lindisfarne printed by deep
    avoid: ['2026-12-12'],
    text: `Around the year 700, on a tidal island off the coast of Northumbria in northeast England, a single monk spent perhaps five years making one of the most beautiful books ever produced. The pages are vellum, made from the skins of well over a hundred calves. The text is a Latin copy of the four Gospels, and each begins with a portrait of its evangelist and a carpet page, a full page of interlacing birds, beasts and knotwork so intricate that it has been compared to a woven rug. The pigments came from minerals, plants and insects, and the artist appears to have used a sharp lead point to plan his designs.

An inscription added about 250 years later names the maker as Eadfrith, bishop of the monastery, and says the book was made in honor of Saint Cuthbert, whose shrine drew pilgrims there. The same note records that a priest named Aldred added a word-for-word translation between the lines in Old English, making it the oldest surviving version of the Gospels in the English language. The decoration blends Celtic, Anglo-Saxon and Mediterranean styles, reflecting a monastery founded by Irish monks from Iona that looked to Rome for its texts.

Viking raids began with an attack on the monastery in 793, an event that shocked Christian Europe, and the community eventually fled with Cuthbert's body, carrying its treasures across northern England for years before settling at Chester-le-Street and later Durham. Its jeweled cover was lost, probably during the dissolution of the monasteries under Henry VIII. The Lindisfarne Gospels later passed to the collector Sir Robert Cotton, came to the British Museum in 1753 with his library, and are now held by the British Library in London.`,
  },
  {
    cat: 'Thing', diff: 4, answer: 'Damascus Steel',
    aka: { damascas: 'damascus', damascos: 'damascus', damasus: 'damascus' },
    // avoid: Damascus printed by atlas, foodie, deep, streak, history, art; history 12-12 keys India; bond 12-19 keys Carbon
    avoid: ['2026-12-08', '2026-12-09', '2026-12-10', '2026-12-17', '2026-12-24', '2026-12-27', '2026-12-30', '2026-12-12', '2026-12-19'],
    text: `Medieval European knights who fought in the Crusades brought home stories of Saracen swords so sharp they could slice a silk scarf dropped onto the edge and so tough they could bend without breaking. The blades were recognized by the pattern on their surfaces, a flowing design said to resemble running water. The raw metal came as small cakes of crucible steel, made in southern India and known as wootz, and was traded across the Middle East to smiths who forged it into blades.

Damascus steel takes its name from the Syrian city that was a center of the trade, or possibly from an Arabic word for the watered pattern, and the secret of making it was lost by about the eighteenth century, perhaps because the particular ores, with their traces of impurities, ran out. Modern study has explained much of the mystery. The ingots were high in carbon, and slow, careful forging at the right temperatures drew hard carbides into the bands that produced the pattern. In 2006, scientists in Dresden examining a seventeenth century saber reported finding carbon nanotubes in the metal, structures that may have contributed to its strength.

Researchers have since recreated blades with the same banded look from ingots made the old way. Many modern knives sold under the name are something different: pattern welded steel, made by folding and forging together layers of contrasting metals, which produces a similar striped surface by another method. The legends have also grown with time. Accounts of blades that could cut through a rifle barrel, or of smiths who quenched swords in the bodies of slaves, belong to folklore rather than to the historical record.`,
  },
  {
    cat: 'Work', diff: 4, answer: 'The Epic of Gilgamesh',
    aka: { gilgamesch: 'gilgamesh', gilgamash: 'gilgamesh', gilgemesh: 'gilgamesh' },
    // avoid: Gilgamesh printed by biz
    avoid: ['2026-12-15'],
    text: `In 1872 George Smith, a self-taught assistant at the British Museum who had trained as a banknote engraver, was sorting fragments of clay tablets brought back from the ruins of Nineveh, in what is now northern Iraq. Reading the wedge-shaped script, he found a passage describing a great flood, a ship coming to rest on a mountain, and birds sent out to look for dry land. According to a colleague, he was so excited that he jumped up, rushed around the room and began to undress. His lecture on the find caused a sensation, because the story so closely resembled the account of Noah in the Bible.

The tablets came from the library of Ashurbanipal, the last great Assyrian king, in the seventh century BC, but the tales behind them are far older. Poems about Gilgamesh, a king of the city of Uruk who probably ruled around 2700 BC, were written down in Sumerian around the end of the third millennium BC, and the standard Babylonian version, in twelve tablets, is attributed to a scholar named Sin-leqi-unninni. It is among the oldest surviving works of literature.

The Epic of Gilgamesh tells of a proud and overbearing king, two thirds divine, whom the gods tame by creating a wild man, Enkidu, as his match. The two become friends, kill the guardian of the Cedar Forest and the Bull of Heaven, and are punished when Enkidu falls ill and dies. Grief-stricken and terrified of death, Gilgamesh travels to the ends of the earth to find Utnapishtim, the survivor of the flood, who was granted eternal life. He fails a test to stay awake for a week, loses a plant of rejuvenation to a snake, and returns home to the great walls of his city, accepting that he too must die.`,
  },
];
