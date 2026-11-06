// THE FIFTH LANE OF ART. Days 1-13 (live 2026-10-14 to 10-26) are the Food & Drink
// questions they shipped with and are frozen. From day 14 (2026-10-27) food and drink
// moved to Foodie, its own daily (owner, 2026-10-26), and this file carries the fifth slot
// of each round from across the other arts lanes; each entry's `c` names its real lane.
// The file keeps its name so scripts/gen-art.mjs --check rebuilds the frozen days byte
// for byte. Days 14-48 were drawn from scripts/art-lanes/art-fill.mjs (new) and the
// unseen questions in scripts/trivia-reserve/art.mjs.
export const LANE_DAYS = [
  // day 1
  [
    { c: "Food & Drink", t: 1, q: "What is the main ingredient of ketchup?", a: "Tomatoes", d: ["Red peppers","Beets","Carrots"] },
    { c: "Food & Drink", t: 2, q: "Baba ghanoush is a smoky dip made mainly from which vegetable?", a: "Eggplant", d: ["Zucchini","Squash","Red pepper"] },
    { c: "Food & Drink", t: 3, q: "Which flat pasta has an Italian name meaning \"little tongues\"?", a: "Linguine", d: ["Fettuccine","Tagliatelle","Pappardelle"] },
    { c: "Food & Drink", t: 4, q: "Which cocktail of rye whiskey, sugar, Peychaud's bitters and an absinthe rinse is most associated with New Orleans?", a: "Sazerac", d: ["Mint Julep","Manhattan","Old Fashioned"] },
    { c: "Food & Drink", t: 5, q: "In 1841, which 12-year-old enslaved boy on the island of Réunion devised the hand-pollination method still used to grow vanilla?", a: "Edmond Albius", d: ["Pierre Poivre","Jean-Baptiste Lislet Geoffroy","Joseph Hubert"] },
  ],
  // day 2
  [
    { c: "Food & Drink", t: 1, q: "Ramen is a noodle soup most associated with which country?", a: "Japan", d: ["China","Korea","Thailand"] },
    { c: "Food & Drink", t: 2, q: "Tahini is a paste made by grinding which seeds?", a: "Sesame", d: ["Sunflower","Poppy","Flax"] },
    { c: "Food & Drink", t: 3, q: "Calvados, a brandy from Normandy, is distilled mainly from which fruit?", a: "Apples", d: ["Pears","Plums","Grapes"] },
    { c: "Food & Drink", t: 4, q: "Which French chef codified classic cuisine in \"Le Guide Culinaire\", first published in 1903?", a: "Auguste Escoffier", d: ["Marie-Antoine Carême","Fernand Point","Paul Bocuse"] },
    { c: "Food & Drink", t: 5, q: "Which Turin inventor patented an early steam-driven espresso machine in 1884?", a: "Angelo Moriondo", d: ["Luigi Bezzera","Desiderio Pavoni","Achille Gaggia"] },
  ],
  // day 3
  [
    { c: "Food & Drink", t: 1, q: "Meringue is made by whipping sugar with what?", a: "Egg whites", d: ["Egg yolks","Heavy cream","Butter"] },
    { c: "Food & Drink", t: 2, q: "Which spirit gets its main flavor from juniper berries?", a: "Gin", d: ["Vodka","Rum","Brandy"] },
    { c: "Food & Drink", t: 3, q: "The French cooking term \"sous vide\" literally means what?", a: "Under vacuum", d: ["Under water","Slowly heated","In a sealed jar"] },
    { c: "Food & Drink", t: 4, q: "A kir is white wine topped with a liqueur made from which fruit?", a: "Blackcurrant", d: ["Raspberry","Cherry","Peach"] },
    { c: "Food & Drink", t: 5, q: "Whose 1896 \"Boston Cooking-School Cook Book\" popularized exact, level measurements in American recipes?", a: "Fannie Farmer", d: ["Irma Rombauer","Amelia Simmons","Eliza Leslie"] },
  ],
  // day 4
  [
    { c: "Food & Drink", t: 1, q: "Which Italian dessert layers coffee-soaked ladyfingers with mascarpone cream?", a: "Tiramisu", d: ["Cannoli","Panna cotta","Zabaglione"] },
    { c: "Food & Drink", t: 2, q: "Poutine, fries topped with cheese curds and gravy, comes from which country?", a: "Canada", d: ["France","Belgium","United States"] },
    { c: "Food & Drink", t: 3, q: "Vanilla comes from the seed pods of which kind of plant?", a: "An orchid", d: ["A lily","A palm","A legume"] },
    { c: "Food & Drink", t: 4, q: "Which fruit is cooked with salt cod in Jamaica's national dish?", a: "Ackee", d: ["Breadfruit","Plantain","Soursop"] },
    { c: "Food & Drink", t: 5, q: "Spain's pimentón de la Vera gets its smoky flavor from peppers dried over fires of which wood?", a: "Oak", d: ["Hickory","Mesquite","Beech"] },
  ],
  // day 5
  [
    { c: "Food & Drink", t: 1, q: "A French crêpe is a very thin kind of what?", a: "Pancake", d: ["Waffle","Omelet","Tortilla"] },
    { c: "Food & Drink", t: 2, q: "Traditional shepherd's pie is made with minced what?", a: "Lamb", d: ["Beef","Pork","Chicken"] },
    { c: "Food & Drink", t: 3, q: "Which compounds from grape skins and seeds make young red wine taste dry and astringent?", a: "Tannins", d: ["Sulfites","Esters","Sugars"] },
    { c: "Food & Drink", t: 4, q: "Auguste Escoffier created a dessert of peaches and raspberry sauce to honor which Australian soprano?", a: "Nellie Melba", d: ["Jenny Lind","Adelina Patti","Joan Sutherland"] },
    { c: "Food & Drink", t: 5, q: "What is huitlacoche, prized in Mexican cooking?", a: "A fungus that grows on corn", d: ["A wild mountain herb","A cactus fruit","A dried river shrimp"] },
  ],
  // day 6
  [
    { c: "Food & Drink", t: 1, q: "Which spice gives most curry powders their yellow color?", a: "Turmeric", d: ["Paprika","Cumin","Cinnamon"] },
    { c: "Food & Drink", t: 2, q: "What is the sharp green paste traditionally served with sushi?", a: "Wasabi", d: ["Miso","Ponzu","Natto"] },
    { c: "Food & Drink", t: 3, q: "Couscous is made from small granules of which wheat product?", a: "Semolina", d: ["Bulgur","Rice flour","Cornmeal"] },
    { c: "Food & Drink", t: 4, q: "Grappa is distilled from what?", a: "Grape pomace", d: ["Fermented figs","Barley mash","Apple cider"] },
    { c: "Food & Drink", t: 5, q: "Which French chef, famed for towering sugar centerpieces, grouped sauces into families in the 19th century?", a: "Marie-Antoine Carême", d: ["Auguste Escoffier","François Pierre de La Varenne","Fernand Point"] },
  ],
  // day 7
  [
    { c: "Food & Drink", t: 1, q: "Bratwurst is a German type of what?", a: "Sausage", d: ["Bread roll","Dumpling","Pastry"] },
    { c: "Food & Drink", t: 2, q: "Which cocktail mixes vodka, ginger beer and lime and is served in a copper mug?", a: "Moscow Mule", d: ["Cuba Libre","Tom Collins","Sea Breeze"] },
    { c: "Food & Drink", t: 3, q: "Which Chinese tea is only partly oxidized, sitting between green and black?", a: "Oolong", d: ["Sencha","Lapsang souchong","Pu-erh"] },
    { c: "Food & Drink", t: 4, q: "The Caesar salad is generally credited to Caesar Cardini, at his restaurant in which Mexican city?", a: "Tijuana", d: ["Acapulco","Monterrey","Guadalajara"] },
    { c: "Food & Drink", t: 5, q: "Whose \"Almanach des Gourmands\", first published in 1803, is often called the first restaurant guide?", a: "Grimod de La Reynière", d: ["Antoine Beauvilliers","Curnonsky","Prosper Montagné"] },
  ],
  // day 8
  [
    { c: "Food & Drink", t: 1, q: "Bulgogi, thin slices of marinated grilled beef, comes from which country?", a: "Korea", d: ["Japan","China","Vietnam"] },
    { c: "Food & Drink", t: 2, q: "Which Italian antipasto is grilled bread rubbed with garlic and topped with chopped tomatoes?", a: "Bruschetta", d: ["Focaccia","Panzanella","Caprese"] },
    { c: "Food & Drink", t: 3, q: "Which spice is the dried, unopened flower bud of a tropical evergreen tree?", a: "Clove", d: ["Allspice","Juniper","Cardamom"] },
    { c: "Food & Drink", t: 4, q: "Armagnac brandy comes from which historic region of southwest France?", a: "Gascony", d: ["Normandy","Champagne","Burgundy"] },
    { c: "Food & Drink", t: 5, q: "The ancient Roman cookbook \"De re coquinaria\" is traditionally attributed to which name?", a: "Apicius", d: ["Columella","Cato","Petronius"] },
  ],
  // day 9
  [
    { c: "Food & Drink", t: 1, q: "Raisins are dried what?", a: "Grapes", d: ["Plums","Figs","Cherries"] },
    { c: "Food & Drink", t: 2, q: "Which Japanese dish is sliced raw fish served without rice?", a: "Sashimi", d: ["Nigiri","Maki","Tempura"] },
    { c: "Food & Drink", t: 3, q: "Which espresso drink takes its name from the Italian for \"stained\", for its dash of milk foam?", a: "Macchiato", d: ["Cortado","Lungo","Ristretto"] },
    { c: "Food & Drink", t: 4, q: "Who wrote the 1861 bestseller \"Book of Household Management\"?", a: "Isabella Beeton", d: ["Eliza Acton","Hannah Glasse","Elizabeth Raffald"] },
    { c: "Food & Drink", t: 5, q: "The Cantonese phrase \"wok hei\" describes what?", a: "The smoky \"breath\" of a very hot wok", d: ["A sauce of oyster and soy","The seasoning layer baked onto a new pan","A fast way of chopping vegetables"] },
  ],
  // day 10
  [
    { c: "Food & Drink", t: 1, q: "Which vegetable is the main ingredient of sauerkraut?", a: "Cabbage", d: ["Cucumber","Onion","Turnip"] },
    { c: "Food & Drink", t: 2, q: "Mezcal is distilled from which plant?", a: "Agave", d: ["Sugarcane","Cactus","Corn"] },
    { c: "Food & Drink", t: 3, q: "Mace is the lacy red covering around the seed of which spice?", a: "Nutmeg", d: ["Allspice","Cardamom","Star anise"] },
    { c: "Food & Drink", t: 4, q: "Which clear spirit, often distilled from sorghum, is the traditional liquor of China?", a: "Baijiu", d: ["Soju","Shochu","Awamori"] },
    { c: "Food & Drink", t: 5, q: "What is the ancient process of cooking corn in an alkaline solution such as limewater to make masa?", a: "Nixtamalization", d: ["Malting","Lactofermentation","Parboiling"] },
  ],
  // day 11
  [
    { c: "Food & Drink", t: 1, q: "Espresso is a concentrated form of which drink?", a: "Coffee", d: ["Tea","Cocoa","Chai"] },
    { c: "Food & Drink", t: 2, q: "Spanish chorizo gets its deep red color from which spice?", a: "Paprika", d: ["Saffron","Turmeric","Sumac"] },
    { c: "Food & Drink", t: 3, q: "Tequila takes its name from a town in which Mexican state?", a: "Jalisco", d: ["Oaxaca","Sonora","Chihuahua"] },
    { c: "Food & Drink", t: 4, q: "The raw beef dish carpaccio is named after a Renaissance painter from which city?", a: "Venice", d: ["Florence","Siena","Milan"] },
    { c: "Food & Drink", t: 5, q: "Who wrote \"The Art of Cookery Made Plain and Easy\", an English cookbook of 1747?", a: "Hannah Glasse", d: ["Eliza Acton","Isabella Beeton","Elizabeth Raffald"] },
  ],
  // day 12
  [
    { c: "Food & Drink", t: 1, q: "What is the round-bottomed pan used for stir-frying called?", a: "Wok", d: ["Skillet","Saucepan","Dutch oven"] },
    { c: "Food & Drink", t: 2, q: "Teriyaki glaze is built on which salty seasoning?", a: "Soy sauce", d: ["Fish sauce","Oyster sauce","Miso"] },
    { c: "Food & Drink", t: 3, q: "Pecorino cheeses are made from the milk of which animal?", a: "Sheep", d: ["Goat","Cow","Water buffalo"] },
    { c: "Food & Drink", t: 4, q: "Who wrote \"The Joy of Cooking\", first published privately in 1931?", a: "Irma Rombauer", d: ["Fannie Farmer","Julia Child","M.F.K. Fisher"] },
    { c: "Food & Drink", t: 5, q: "Amarone della Valpolicella is made from grapes that are what before fermenting?", a: "Dried for months on racks", d: ["Frozen on the vine","Infected with noble rot","Crushed with their stems"] },
  ],
  // day 13
  [
    { c: "Food & Drink", t: 1, q: "Tofu is a pressed curd made from which bean?", a: "Soybeans", d: ["Kidney beans","Lima beans","Navy beans"] },
    { c: "Food & Drink", t: 2, q: "Italian polenta is a porridge made from what?", a: "Cornmeal", d: ["Semolina","Rice flour","Chickpea flour"] },
    { c: "Food & Drink", t: 3, q: "A classic French clafoutis is a baked custardy batter studded with which fruit?", a: "Cherries", d: ["Apples","Pears","Plums"] },
    { c: "Food & Drink", t: 4, q: "Tokaji, a sweet wine made from grapes shriveled by noble rot, comes from which country?", a: "Hungary", d: ["Austria","Romania","Germany"] },
    { c: "Food & Drink", t: 5, q: "Which mold, known in Japan as koji, is used to make miso, soy sauce and sake?", a: "Aspergillus oryzae", d: ["Penicillium camemberti","Rhizopus oligosporus","Botrytis cinerea"] },
  ],
  // day 14
  [
    { c: "Art", t: 1, q: "Which color do you get by mixing black and white paint?", a: "Gray", d: ["Silver","Beige","Lavender"] },
    { c: "Architecture & Design", t: 2, q: "Which kind of chair sits on two curved runners so it sways back and forth?", a: "A rocking chair", d: ["A wing chair","A club chair","A Windsor chair"] },
    { c: "Art", t: 3, q: "Which Flemish painter completed the Ghent Altarpiece in 1432, a work begun by his brother Hubert?", a: "Jan van Eyck", d: ["Rogier van der Weyden","Hans Memling","Robert Campin"] },
    { c: "Music", t: 4, q: "Which Chicago bluesman was born McKinley Morganfield?", a: "Muddy Waters", d: ["Howlin' Wolf","John Lee Hooker","Lightnin' Hopkins"] },
    { c: "Music", t: 5, q: "Which Catalan cellist brought Bach's cello suites back into the concert repertoire and recorded them in the 1930s?", a: "Pablo Casals", d: ["Gaspar Cassado","Emanuel Feuermann","Guilhermina Suggia"] },
  ],
  // day 15
  [
    { c: "Art", t: 1, q: "Which country is famous for its blue and white Delftware pottery?", a: "The Netherlands", d: ["Belgium","Denmark","Portugal"] },
    { c: "Music", t: 2, q: "What are devoted fans of the Grateful Dead called?", a: "Deadheads", d: ["Parrotheads","Jam fans","Freaks"] },
    { c: "Books", t: 3, q: "Which author wrote a book of letters of advice from a senior devil to his nephew, a junior tempter?", a: "C. S. Lewis", d: ["Dorothy L. Sayers","G. K. Chesterton","Charles Williams"] },
    { c: "Art", t: 4, q: "Which American painter sued the critic John Ruskin for libel in 1878?", a: "James McNeill Whistler", d: ["Dante Gabriel Rossetti","Walter Sickert","Albert Moore"] },
    { c: "Architecture & Design", t: 5, q: "Which Swiss graphic designer wrote Grid Systems in Graphic Design (1981)?", a: "Josef Muller-Brockmann", d: ["Armin Hofmann","Emil Ruder","Max Bill"] },
  ],
  // day 16
  [
    { c: "Music", t: 1, q: "Which hand-held drum has small metal jingles set into its frame?", a: "Tambourine", d: ["Bongo","Snare drum","Cajon"] },
    { c: "Books", t: 2, q: "Which author wrote about an orphan sent to a Yorkshire manor who finds a walled garden behind a locked door?", a: "Frances Hodgson Burnett", d: ["Johanna Spyri","E. Nesbit","Susan Coolidge"] },
    { c: "Art", t: 3, q: "Which French photographer is linked with the idea of the decisive moment, the title of his 1952 book in English?", a: "Henri Cartier-Bresson", d: ["Robert Doisneau","Brassai","Eugene Atget"] },
    { c: "Art", t: 4, q: "Which German Expressionist group was founded in Dresden in 1905?", a: "Die Brucke", d: ["Der Blaue Reiter","Neue Sachlichkeit","Der Sturm"] },
    { c: "Books", t: 5, q: "Which Japanese novelist chronicled four sisters of a declining Osaka merchant family in a novel serialized during the war?", a: "Junichiro Tanizaki", d: ["Fumiko Enchi","Osamu Dazai","Yasunari Kawabata"] },
  ],
  // day 17
  [
    { c: "Music", t: 1, q: "Which backward-gliding dance move did Michael Jackson first perform on television in 1983?", a: "The moonwalk", d: ["The robot","The running man","The worm"] },
    { c: "Art", t: 2, q: "Which artist's wax sculpture Little Dancer Aged Fourteen wore a real tutu and hair ribbon?", a: "Edgar Degas", d: ["Auguste Renoir","Aristide Maillol","Camille Claudel"] },
    { c: "Architecture & Design", t: 3, q: "Which Japanese-American artist designed the Akari paper lamps and a glass-topped coffee table for Herman Miller?", a: "Isamu Noguchi", d: ["George Nakashima","Sori Yanagi","Shiro Kuramata"] },
    { c: "Music", t: 4, q: "Which songwriter wrote Crazy, the 1961 hit for Patsy Cline?", a: "Willie Nelson", d: ["Harlan Howard","Hank Cochran","Roger Miller"] },
    { c: "Music", t: 5, q: "Which composer wrote Poeme electronique for the Philips Pavilion at the 1958 Brussels World's Fair?", a: "Edgard Varese", d: ["Pierre Schaeffer","Karlheinz Stockhausen","Iannis Xenakis"] },
  ],
  // day 18
  [
    { c: "Books", t: 1, q: "Which detective is the elderly spinster of St. Mary Mead who solves murders by comparing them to village gossip?", a: "Miss Marple", d: ["Ariadne Oliver","Hercule Poirot","Tuppence Beresford"] },
    { c: "Books", t: 2, q: "Which boy in Lord of the Flies blows the conch to call the others to assembly and is elected chief?", a: "Ralph", d: ["Piggy","Jack Merridew","Simon"] },
    { c: "Books", t: 3, q: "Which poet framed a story collection around pilgrims riding to Canterbury and telling tales for a free supper?", a: "Geoffrey Chaucer", d: ["William Langland","John Gower","Thomas Malory"] },
    { c: "Architecture & Design", t: 4, q: "Which Renaissance architect published The Four Books of Architecture in 1570?", a: "Andrea Palladio", d: ["Sebastiano Serlio","Giacomo Barozzi da Vignola","Vincenzo Scamozzi"] },
    { c: "Music", t: 5, q: "Which Russian composer of the opera Prince Igor worked by profession as a chemist?", a: "Alexander Borodin", d: ["Cesar Cui","Mily Balakirev","Anatoly Lyadov"] },
  ],
  // day 19
  [
    { c: "Art", t: 1, q: "Which Renaissance artist shares his name with the Ninja Turtle who wears a red mask?", a: "Raphael", d: ["Leonardo da Vinci","Michelangelo","Donatello"] },
    { c: "Books", t: 2, q: "Which character rings the bells of Notre-Dame and carries Esmeralda into sanctuary?", a: "Quasimodo", d: ["Captain Phoebus","Claude Frollo","Pierre Gringoire"] },
    { c: "Books", t: 3, q: "Which character in Don Quixote follows the mad knight as his squire, promised the governorship of an island?", a: "Sancho Panza", d: ["Pedro Alonso","Cardenio","Sanson Carrasco"] },
    { c: "Music", t: 4, q: "Which Elvis Presley song was his first single for Sun Records, in 1954?", a: "That's All Right", d: ["Mystery Train","Good Rockin' Tonight","Baby Let's Play House"] },
    { c: "Art", t: 5, q: "Which photographer spent three decades on The North American Indian, a 20-volume record published from 1907 to 1930?", a: "Edward S. Curtis", d: ["Timothy O'Sullivan","Carleton Watkins","William Henry Jackson"] },
  ],
  // day 20
  [
    { c: "Architecture & Design", t: 1, q: "Which window covering of adjustable horizontal slats is named for an Italian city?", a: "Venetian blinds", d: ["Roman shades","Florentine shutters","Milanese drapes"] },
    { c: "Art", t: 2, q: "What is a painting made on two hinged panels called?", a: "A diptych", d: ["A triptych","A polyptych","A predella"] },
    { c: "Architecture & Design", t: 3, q: "Which architect cantilevered a Pennsylvania house out over a waterfall?", a: "Frank Lloyd Wright", d: ["Philip Johnson","Rudolph Schindler","Richard Neutra"] },
    { c: "Music", t: 4, q: "Which clarinetist led the landmark jazz concert at Carnegie Hall on January 16, 1938?", a: "Benny Goodman", d: ["Artie Shaw","Glenn Miller","Count Basie"] },
    { c: "Art", t: 5, q: "Which American portrait painter patented the collapsible metal paint tube in 1841?", a: "John Goffe Rand", d: ["William Winsor","George Rowney","Henry Newton"] },
  ],
  // day 21
  [
    { c: "Art", t: 1, q: "In photography, what is the light-sealed room for developing film called?", a: "A darkroom", d: ["A green room","A lightbox","A cleanroom"] },
    { c: "Music", t: 2, q: "Which Buggles song was the first clip MTV played when it launched in 1981?", a: "Video Killed the Radio Star", d: ["Rapture","Ashes to Ashes","Message in a Bottle"] },
    { c: "Books", t: 3, q: "Which Italian author wrote the story of a wooden puppet whose nose grows when he lies?", a: "Carlo Collodi", d: ["Giovanni Verga","Edmondo De Amicis","Gianni Rodari"] },
    { c: "Books", t: 4, q: "Which novelist followed a runaway called the kid across the border with a scalp-hunting gang led by Judge Holden?", a: "Cormac McCarthy", d: ["Larry McMurtry","Thomas McGuane","Denis Johnson"] },
    { c: "Books", t: 5, q: "Which Icelandic novelist won the Nobel for a saga of a stubborn sheep farmer determined to owe nothing to anyone?", a: "Halldor Laxness", d: ["Sigrid Undset","Par Lagerkvist","Gunnar Gunnarsson"] },
  ],
  // day 22
  [
    { c: "Architecture & Design", t: 1, q: "What is a stretchy one-piece garment worn by dancers and gymnasts called?", a: "A leotard", d: ["A romper","A bodice","A camisole"] },
    { c: "Architecture & Design", t: 2, q: "Which French luxury house makes the Birkin bag, named for Jane Birkin?", a: "Hermes", d: ["Louis Vuitton","Celine","Goyard"] },
    { c: "Music", t: 3, q: "Which Verdi opera had its premiere in Cairo in 1871?", a: "Aida", d: ["Otello","Rigoletto","Don Carlos"] },
    { c: "Books", t: 4, q: "Which novelist wrote the story of Bigger Thomas, a young man on the South Side of Chicago condemned for murder?", a: "Richard Wright", d: ["Chester Himes","James Baldwin","Ann Petry"] },
    { c: "Architecture & Design", t: 5, q: "Which Danish designer created the Wishbone chair (CH24) in 1949?", a: "Hans Wegner", d: ["Finn Juhl","Borge Mogensen","Kaare Klint"] },
  ],
  // day 23
  [
    { c: "Art", t: 1, q: "Which French painter spent his last decades painting the lily pond in his garden at Giverny?", a: "Claude Monet", d: ["Alfred Sisley","Pierre-Auguste Renoir","Camille Pissarro"] },
    { c: "Art", t: 2, q: "Which French Impressionist painted Luncheon of the Boating Party (1881)?", a: "Pierre-Auguste Renoir", d: ["Gustave Caillebotte","Alfred Sisley","Camille Pissarro"] },
    { c: "Art", t: 3, q: "Which Hungarian-born photographer shot the D-Day landing at Omaha Beach in 1944?", a: "Robert Capa", d: ["W. Eugene Smith","Margaret Bourke-White","Andre Kertesz"] },
    { c: "Music", t: 4, q: "Which guitarist and inventor gave his name to a Gibson solid-body guitar launched in 1952?", a: "Les Paul", d: ["Chet Atkins","Merle Travis","Leo Fender"] },
    { c: "Architecture & Design", t: 5, q: "Which Austrian architect designed the Palais Stoclet in Brussels (1905 to 1911)?", a: "Josef Hoffmann", d: ["Otto Wagner","Joseph Maria Olbrich","Adolf Loos"] },
  ],
  // day 24
  [
    { c: "Books", t: 1, q: "Which playwright wrote both 'King Lear' and 'The Tempest'?", a: "William Shakespeare", d: ["Christopher Marlowe","John Webster","Ben Jonson"] },
    { c: "Books", t: 2, q: "Which Englishman spent nine years compiling a Dictionary of the English Language published in 1755?", a: "Samuel Johnson", d: ["Noah Webster","Nathan Bailey","James Murray"] },
    { c: "Architecture & Design", t: 3, q: "Which Yale student designed Washington's Vietnam Veterans Memorial?", a: "Maya Lin", d: ["Zaha Hadid","Denise Scott Brown","Jeanne Gang"] },
    { c: "Architecture & Design", t: 4, q: "Which architect won the 1861 competition for the Paris opera house that opened in 1875?", a: "Charles Garnier", d: ["Henri Labrouste","Jacques Ignace Hittorff","Charles Percier"] },
    { c: "Books", t: 5, q: "Which Austrian novelist wrote a book imagining the last eighteen hours of the poet who wrote the Aeneid?", a: "Hermann Broch", d: ["Alfred Doblin","Elias Canetti","Robert Musil"] },
  ],
  // day 25
  [
    { c: "Art", t: 1, q: "Which artist carved the marble David that stood in the Piazza della Signoria in Florence?", a: "Michelangelo", d: ["Donatello","Benvenuto Cellini","Andrea del Verrocchio"] },
    { c: "Art", t: 2, q: "Whose Nude Descending a Staircase, No. 2 caused a sensation at the 1913 Armory Show?", a: "Marcel Duchamp", d: ["Francis Picabia","Fernand Leger","Albert Gleizes"] },
    { c: "Music", t: 3, q: "Which London band, led by Ray Davies, had a 1964 hit with You Really Got Me?", a: "The Kinks", d: ["The Yardbirds","The Animals","The Hollies"] },
    { c: "Books", t: 4, q: "Which novelist wrote a book built from the black, red, yellow and blue notebooks of a writer named Anna Wulf?", a: "Doris Lessing", d: ["Elizabeth Taylor","Muriel Spark","Iris Murdoch"] },
    { c: "Books", t: 5, q: "Which Albanian novelist wrote of a foreign general returning after twenty years to dig up his country's war dead?", a: "Ismail Kadare", d: ["Milorad Pavic","Danilo Kis","Miroslav Krleza"] },
  ],
  // day 26
  [
    { c: "Art", t: 1, q: "Which London attraction, founded by a French-born sculptor, is famous for its wax figures?", a: "Madame Tussauds", d: ["The London Dungeon","Sir John Soane's Museum","The Wallace Collection"] },
    { c: "Books", t: 2, q: "Which author sent a ship's surgeon among the six-inch people of Lilliput?", a: "Jonathan Swift", d: ["Henry Fielding","Laurence Sterne","Daniel Defoe"] },
    { c: "Architecture & Design", t: 3, q: "Which Finnish architect designed the Paimio Sanatorium and a bentwood chair named for it?", a: "Alvar Aalto", d: ["Eliel Saarinen","Gunnar Asplund","Arne Jacobsen"] },
    { c: "Books", t: 4, q: "Which playwright sent a canteen woman dragging her wagon through the Thirty Years War?", a: "Bertolt Brecht", d: ["Frank Wedekind","Ernst Toller","Georg Kaiser"] },
    { c: "Books", t: 5, q: "Which American novelist wrote of Port and Kit Moresby driving into the Sahara until the sky no longer shelters them?", a: "Paul Bowles", d: ["Patrick Leigh Fermor","Bruce Chatwin","Paul Theroux"] },
  ],
  // day 27
  [
    { c: "Art", t: 1, q: "Which Dutch painter made The Starry Night?", a: "Vincent van Gogh", d: ["Edvard Munch","Paul Gauguin","Paul Cezanne"] },
    { c: "Books", t: 2, q: "Which author wrote of a Puritan woman in Boston forced to wear a red letter on her dress?", a: "Nathaniel Hawthorne", d: ["James Fenimore Cooper","Washington Irving","Oliver Wendell Holmes"] },
    { c: "Books", t: 3, q: "Which character in Wuthering Heights is brought home as a starving foundling from the streets of Liverpool?", a: "Heathcliff", d: ["Hindley Earnshaw","Hareton Earnshaw","Edgar Linton"] },
    { c: "Music", t: 4, q: "Which Haydn symphony ends with the players leaving the stage one by one?", a: "The Farewell Symphony", d: ["The Clock Symphony","The Military Symphony","The Bear Symphony"] },
    { c: "Art", t: 5, q: "Which Venetian painter made the enigmatic stormy landscape known as The Tempest?", a: "Giorgione", d: ["Titian","Giovanni Bellini","Vittore Carpaccio"] },
  ],
  // day 28
  [
    { c: "Music", t: 1, q: "Which music award's statuette is shaped like a gold gramophone?", a: "The Grammy", d: ["The Tony","The Emmy","The Brit Award"] },
    { c: "Music", t: 2, q: "Which promoter managed Elvis Presley from the mid-1950s until the singer's death?", a: "Colonel Tom Parker", d: ["Sam Phillips","Brian Epstein","Allen Klein"] },
    { c: "Books", t: 3, q: "Which character in Oliver Twist is the housebreaker who murders Nancy and dies by his own rope on a rooftop while the mob closes in?", a: "Bill Sikes", d: ["Toby Crackit","Monks","Noah Claypole"] },
    { c: "Art", t: 4, q: "Which French painter made Pilgrimage to Cythera (1717), founding the fete galante?", a: "Antoine Watteau", d: ["Francois Boucher","Jean-Honore Fragonard","Nicolas Lancret"] },
    { c: "Books", t: 5, q: "Which Irish novelist wrote a comic novel whose narrator is writing a novel about a novelist whose characters rebel against him?", a: "Flann O'Brien", d: ["Sean O'Faolain","Brian Moore","Liam O'Flaherty"] },
  ],
  // day 29
  [
    { c: "Books", t: 1, q: "Which boy is raised by a wolf pack and taught the law of the jungle by a bear and a panther?", a: "Mowgli", d: ["Bagheera","Akela","Baloo"] },
    { c: "Architecture & Design", t: 2, q: "What do typographers call a typeface with no small finishing strokes on its letters?", a: "Sans serif", d: ["Slab serif","Blackletter","Monospace"] },
    { c: "Art", t: 3, q: "Which Madrid museum opened to the public in 1819 to show the royal collection?", a: "The Prado", d: ["The Reina Sofia","The Thyssen-Bornemisza","The Royal Academy of San Fernando"] },
    { c: "Books", t: 4, q: "Which German novelist sent Hans Castorp for a three-week visit to an Alpine sanatorium that lasted seven years?", a: "Thomas Mann", d: ["Stefan Zweig","Heinrich Boll","Jakob Wassermann"] },
    { c: "Architecture & Design", t: 5, q: "Which German typographer published Die neue Typographie in 1928?", a: "Jan Tschichold", d: ["Paul Renner","Herbert Bayer","Kurt Schwitters"] },
  ],
  // day 30
  [
    { c: "Music", t: 1, q: "Which band appeared in animated form in the 1968 film Yellow Submarine?", a: "The Beatles", d: ["The Monkees","The Rolling Stones","The Kinks"] },
    { c: "Architecture & Design", t: 2, q: "Which Catalan architect spent his last decades on an unfinished Barcelona basilica?", a: "Antoni Gaudi", d: ["Rafael Guastavino","Josep Puig i Cadafalch","Lluis Domenech i Montaner"] },
    { c: "Architecture & Design", t: 3, q: "Which firm designed Beijing's Bird's Nest stadium for the 2008 Olympics?", a: "Herzog and de Meuron", d: ["Foster and Partners","Zaha Hadid Architects","OMA"] },
    { c: "Books", t: 4, q: "Which novelist wrote of Charles Ryder, Sebastian Flyte and a teddy bear named Aloysius at a great English house?", a: "Evelyn Waugh", d: ["Anthony Powell","Nancy Mitford","Graham Greene"] },
    { c: "Music", t: 5, q: "Which Polish composer wrote the Symphony of Sorrowful Songs (1976)?", a: "Henryk Gorecki", d: ["Krzysztof Penderecki","Witold Lutoslawski","Karol Szymanowski"] },
  ],
  // day 31
  [
    { c: "Books", t: 1, q: "Which hobbit carries the One Ring from the Shire to the fires of Mount Doom?", a: "Frodo Baggins", d: ["Meriadoc Brandybuck","Peregrin Took","Samwise Gamgee"] },
    { c: "Art", t: 2, q: "Which jeweler's firm made jeweled Easter eggs for the Russian imperial family?", a: "Faberge", d: ["Cartier","Tiffany and Co.","Boucheron"] },
    { c: "Music", t: 3, q: "On which island was Freddie Mercury born in 1946?", a: "Zanzibar", d: ["Mauritius","Madagascar","Sri Lanka"] },
    { c: "Books", t: 4, q: "Which character in Sense and Sensibility keeps a four-year secret engagement to Lucy Steele?", a: "Edward Ferrars", d: ["Robert Ferrars","Colonel Brandon","John Willoughby"] },
    { c: "Music", t: 5, q: "Which French music theorist and composer published the Treatise on Harmony in 1722?", a: "Jean-Philippe Rameau", d: ["Francois Couperin","Marc-Antoine Charpentier","Jean-Marie Leclair"] },
  ],
  // day 32
  [
    { c: "Art", t: 1, q: "Which Spanish surrealist painted the limp watches of The Persistence of Memory?", a: "Salvador Dali", d: ["Joan Miro","Max Ernst","Rene Magritte"] },
    { c: "Architecture & Design", t: 2, q: "Which formal men's jacket takes its American name from a wealthy village in New York State?", a: "The tuxedo", d: ["The blazer","The tailcoat","The Norfolk jacket"] },
    { c: "Books", t: 3, q: "Which author wrote the novel of a band of rabbits led by Hazel and Fiver to a new warren on a down?", a: "Richard Adams", d: ["Colin Dann","William Horwood","Kenneth Grahame"] },
    { c: "Music", t: 4, q: "At which California speedway did a 1969 free concert headlined by the Rolling Stones end in violence?", a: "Altamont", d: ["Laguna Seca","Riverside","Sears Point"] },
    { c: "Architecture & Design", t: 5, q: "Which Mexican architect, known for walls of vivid pink and yellow, won the Pritzker Prize in 1980?", a: "Luis Barragan", d: ["Ricardo Legorreta","Juan O'Gorman","Teodoro Gonzalez de Leon"] },
  ],
  // day 33
  [
    { c: "Music", t: 1, q: "Which simple instrument makes a buzzing sound when you hum into it?", a: "Kazoo", d: ["Ocarina","Harmonica","Recorder"] },
    { c: "Music", t: 2, q: "Which California prison gave its name to a 1968 live album by Johnny Cash?", a: "Folsom", d: ["Alcatraz","Leavenworth","Sing Sing"] },
    { c: "Music", t: 3, q: "In which city did Handel's Messiah have its premiere in 1742?", a: "Dublin", d: ["London","Bath","Edinburgh"] },
    { c: "Books", t: 4, q: "Which novelist followed a former high school basketball star named Harry Angstrom across four novels?", a: "John Updike", d: ["Bernard Malamud","John Cheever","Richard Yates"] },
    { c: "Books", t: 5, q: "Which Egyptian novelist won the Nobel Prize for a trilogy set in the alleys of Cairo between the wars?", a: "Naguib Mahfouz", d: ["Tayeb Salih","Yusuf Idris","Taha Hussein"] },
  ],
  // day 34
  [
    { c: "Books", t: 1, q: "Which author created a boy who refuses to grow up and a fairy named Tinker Bell?", a: "J. M. Barrie", d: ["Kenneth Grahame","E. Nesbit","Hugh Lofting"] },
    { c: "Architecture & Design", t: 2, q: "Which Mughal emperor raised a marble tomb at Agra for his favorite wife?", a: "Shah Jahan", d: ["Akbar","Jahangir","Humayun"] },
    { c: "Books", t: 3, q: "Which novelist wrote the ward novel narrated by Chief Bromden and ruled by Nurse Ratched?", a: "Ken Kesey", d: ["Larry McMurtry","Richard Brautigan","Tom Robbins"] },
    { c: "Art", t: 4, q: "Which painter made the 1888 canvas of the Lady of Shalott adrift in a boat, now in Tate Britain?", a: "John William Waterhouse", d: ["John Everett Millais","Edward Burne-Jones","Dante Gabriel Rossetti"] },
    { c: "Art", t: 5, q: "Which German artist, known for felt and fat, performed How to Explain Pictures to a Dead Hare in 1965?", a: "Joseph Beuys", d: ["Gunther Uecker","Wolf Vostell","Sigmar Polke"] },
  ],
  // day 35
  [
    { c: "Books", t: 1, q: "Which character is the great lion who gives his life on the Stone Table and returns?", a: "Aslan", d: ["Reepicheep","Puddleglum","Mr. Tumnus"] },
    { c: "Music", t: 2, q: "Which valveless brass instrument traditionally sounds reveille and Taps?", a: "Bugle", d: ["Cornet","Flugelhorn","Euphonium"] },
    { c: "Books", t: 3, q: "Which poet wrote 'Daddy' and 'Lady Lazarus' in the last months before her death in 1963?", a: "Sylvia Plath", d: ["Anne Sexton","Denise Levertov","Adrienne Rich"] },
    { c: "Architecture & Design", t: 4, q: "Which graphic designer created IBM's striped logo of 1972?", a: "Paul Rand", d: ["Saul Bass","Ivan Chermayeff","Lester Beall"] },
    { c: "Books", t: 5, q: "Which Chinese novelist wrote the eighteenth-century family saga known as the Dream of the Red Chamber?", a: "Cao Xueqin", d: ["Wu Jingzi","Pu Songling","Luo Guanzhong"] },
  ],
  // day 36
  [
    { c: "Music", t: 1, q: "Which pair of shaken rattles, often made from gourds, is a staple of Latin American music?", a: "Maracas", d: ["Castanets","Claves","Guiros"] },
    { c: "Books", t: 2, q: "Which character in the Odyssey puts off her suitors for years by weaving a shroud and unpicking it every night?", a: "Penelope", d: ["Nausicaa","Circe","Calypso"] },
    { c: "Music", t: 3, q: "Which Venetian composer, ordained a priest, was nicknamed the Red Priest for his hair?", a: "Antonio Vivaldi", d: ["Tomaso Albinoni","Baldassare Galuppi","Benedetto Marcello"] },
    { c: "Books", t: 4, q: "Which Victorian novelist wrote the sensation novel that opens with a woman dressed all in white stopping a man on a moonlit road?", a: "Wilkie Collins", d: ["Sheridan Le Fanu","Mary Elizabeth Braddon","Charles Reade"] },
    { c: "Architecture & Design", t: 5, q: "Which Skidmore, Owings and Merrill architect led the design of Lever House (1952) in New York?", a: "Gordon Bunshaft", d: ["Myron Goldsmith","Bruce Graham","Walter Netsch"] },
  ],
  // day 37
  [
    { c: "Books", t: 1, q: "Which character in Wonderland fades away until nothing is left but his grin?", a: "The Cheshire Cat", d: ["The March Hare","The Dormouse","The Caterpillar"] },
    { c: "Music", t: 2, q: "Which London concert hall, opened in 1871, has hosted the Proms since 1941?", a: "The Royal Albert Hall", d: ["Wigmore Hall","The Royal Festival Hall","The Queen's Hall"] },
    { c: "Music", t: 3, q: "Which Beethoven symphony was first dedicated to Napoleon, a dedication he angrily struck out?", a: "The Eroica", d: ["The Pastoral","The Choral","The Fate"] },
    { c: "Books", t: 4, q: "Which French poet was prosecuted for obscenity in 1857 over a collection he called the flowers of evil?", a: "Charles Baudelaire", d: ["Stephane Mallarme","Paul Verlaine","Alfred de Vigny"] },
    { c: "Books", t: 5, q: "Which Russian symbolist wrote a 1913 novel of a bomb hidden in a sardine tin in the imperial capital?", a: "Andrei Bely", d: ["Fyodor Sologub","Valery Bryusov","Alexander Blok"] },
  ],
  // day 38
  [
    { c: "Art", t: 1, q: "What is the art of beautiful, decorative handwriting called?", a: "Calligraphy", d: ["Lithography","Typography","Cartography"] },
    { c: "Books", t: 2, q: "Which author wrote about a ranch dog stolen and sold into the sled teams of the Klondike?", a: "Jack London", d: ["Owen Wister","James Oliver Curwood","Rex Beach"] },
    { c: "Architecture & Design", t: 3, q: "Which landscape designer laid out New York's Central Park with Calvert Vaux?", a: "Frederick Law Olmsted", d: ["Andrew Jackson Downing","Jens Jensen","Beatrix Farrand"] },
    { c: "Art", t: 4, q: "Which St. Petersburg museum dates its founding to Catherine the Great's purchase of paintings in 1764?", a: "The Hermitage", d: ["The Russian Museum","The Tretyakov Gallery","The Pushkin Museum"] },
    { c: "Music", t: 5, q: "Which composer's 1762 opera Orfeo ed Euridice launched his reform of opera in Vienna?", a: "Christoph Willibald Gluck", d: ["Niccolo Jommelli","Johann Adolf Hasse","Tommaso Traetta"] },
  ],
  // day 39
  [
    { c: "Music", t: 1, q: "What is a coin-operated machine that plays records chosen by customers called?", a: "A jukebox", d: ["A gramophone","A turntable","A player piano"] },
    { c: "Music", t: 2, q: "In which city does the Rock and Roll Hall of Fame museum stand?", a: "Cleveland", d: ["Memphis","Detroit","Nashville"] },
    { c: "Books", t: 3, q: "Which character in Tolstoy's novel of adultery throws herself under a train at a railway station?", a: "Anna Karenina", d: ["Countess Vronskaya","Dolly Oblonskaya","Kitty Shcherbatskaya"] },
    { c: "Architecture & Design", t: 4, q: "Which architect designed the zigzag Jewish Museum in Berlin, opened in 2001?", a: "Daniel Libeskind", d: ["Peter Eisenman","David Chipperfield","Axel Schultes"] },
    { c: "Books", t: 5, q: "Which German novelist followed Franz Biberkopf out of Tegel prison into the crowds of a great square in Berlin?", a: "Alfred Doblin", d: ["Hans Fallada","Erich Kastner","Lion Feuchtwanger"] },
  ],
  // day 40
  [
    { c: "Music", t: 1, q: "On which device does a hip-hop DJ spin and scratch vinyl records?", a: "A turntable", d: ["A mixing desk","A drum machine","A cassette deck"] },
    { c: "Architecture & Design", t: 2, q: "In which country are Panama hats traditionally woven?", a: "Ecuador", d: ["Colombia","Peru","Costa Rica"] },
    { c: "Architecture & Design", t: 3, q: "Which building toy did Frank Lloyd Wright's son John invent in 1916?", a: "Lincoln Logs", d: ["Tinkertoys","Erector sets","Meccano"] },
    { c: "Books", t: 4, q: "Which character in Catch-22 is the mess officer who turns the war into a private trading syndicate?", a: "Milo Minderbinder", d: ["Major Major","Chaplain Tappman","Colonel Cathcart"] },
    { c: "Books", t: 5, q: "Which Norwegian novelist wrote a book narrated by a starving young writer wandering the streets of Kristiania?", a: "Knut Hamsun", d: ["Alexander Kielland","Sigrid Undset","Jonas Lie"] },
  ],
  // day 41
  [
    { c: "Art", t: 1, q: "Which Norwegian painted the screaming figure on a blood-red bridge?", a: "Edvard Munch", d: ["Emil Nolde","James Ensor","Egon Schiele"] },
    { c: "Music", t: 2, q: "Which Motown group of five brothers came from Gary, Indiana?", a: "The Jackson 5", d: ["The Osmonds","The Temptations","The Isley Brothers"] },
    { c: "Music", t: 3, q: "Which Miles Davis album of 1970 fused jazz with electric rock?", a: "Bitches Brew", d: ["Sketches of Spain","Milestones","Round About Midnight"] },
    { c: "Architecture & Design", t: 4, q: "Which architect designed the Lincoln Memorial, dedicated in 1922?", a: "Henry Bacon", d: ["John Russell Pope","Charles McKim","Cass Gilbert"] },
    { c: "Books", t: 5, q: "Which Harlem Renaissance writer wove sketches, poems and a play into a 1923 book named for a Georgia crop?", a: "Jean Toomer", d: ["Claude McKay","Countee Cullen","Nella Larsen"] },
  ],
  // day 42
  [
    { c: "Architecture & Design", t: 1, q: "Which Washington memorial shelters a giant seated statue of the 16th president?", a: "The Lincoln Memorial", d: ["The Jefferson Memorial","The Washington Monument","The Grant Memorial"] },
    { c: "Art", t: 2, q: "Which British sculptor made the Angel of the North, raised over Gateshead in 1998?", a: "Antony Gormley", d: ["Barbara Hepworth","Eduardo Paolozzi","Anthony Caro"] },
    { c: "Art", t: 3, q: "Which Romanian sculptor made the soaring polished forms called Bird in Space?", a: "Constantin Brancusi", d: ["Jean Arp","Alexander Archipenko","Jacques Lipchitz"] },
    { c: "Architecture & Design", t: 4, q: "Which architect is buried in the crypt of St Paul's Cathedral in London, the church he designed?", a: "Christopher Wren", d: ["John Vanbrugh","Nicholas Hawksmoor","Inigo Jones"] },
    { c: "Books", t: 5, q: "Which French novelist wrote a bitter, slangy first novel following Bardamu from the trenches to Africa to Detroit?", a: "Louis-Ferdinand Celine", d: ["Georges Bernanos","Andre Malraux","Francois Mauriac"] },
  ],
  // day 43
  [
    { c: "Art", t: 1, q: "Which Italian drew the famous study of a man inscribed in a circle and a square?", a: "Leonardo da Vinci", d: ["Albrecht Durer","Andrea Mantegna","Michelangelo"] },
    { c: "Art", t: 2, q: "Which French sculptor cast the seated brooding figure known as The Thinker?", a: "Auguste Rodin", d: ["Constantin Brancusi","Frederic Auguste Bartholdi","Aristide Maillol"] },
    { c: "Books", t: 3, q: "Which novelist wrote a medieval murder mystery in which a Franciscan investigates deaths in a monastery library?", a: "Umberto Eco", d: ["Primo Levi","Leonardo Sciascia","Dino Buzzati"] },
    { c: "Art", t: 4, q: "Which photographer worked with writer James Agee on Let Us Now Praise Famous Men (1941)?", a: "Walker Evans", d: ["Russell Lee","Arthur Rothstein","Gordon Parks"] },
    { c: "Music", t: 5, q: "Which composer's Opus 6, twelve concerti grossi published in 1714, includes the Christmas Concerto?", a: "Arcangelo Corelli", d: ["Alessandro Scarlatti","Antonio Caldara","Tomaso Albinoni"] },
  ],
  // day 44
  [
    { c: "Books", t: 1, q: "Which character narrates the Baker Street stories as the army doctor who shares the lodgings?", a: "Dr. Watson", d: ["Mrs. Hudson","Mycroft Holmes","Inspector Lestrade"] },
    { c: "Books", t: 2, q: "Which author wrote the frontier books about a family crossing the prairie in a covered wagon to build a little house?", a: "Laura Ingalls Wilder", d: ["Louisa May Alcott","Willa Cather","Kate Douglas Wiggin"] },
    { c: "Books", t: 3, q: "Which character in Vanity Fair climbs through society without money, family or scruples?", a: "Becky Sharp", d: ["Miss Crawley","Amelia Sedley","Lady Jane Sheepshanks"] },
    { c: "Architecture & Design", t: 4, q: "Which writer defended crowded sidewalks and short blocks against the bulldozers of urban renewal?", a: "Jane Jacobs", d: ["Ada Louise Huxtable","Catherine Bauer","Lewis Mumford"] },
    { c: "Art", t: 5, q: "Which Sienese painter made the Maesta altarpiece carried into Siena Cathedral in 1311?", a: "Duccio", d: ["Simone Martini","Cimabue","Pietro Lorenzetti"] },
  ],
  // day 45
  [
    { c: "Architecture & Design", t: 1, q: "What is a decorative hanging light fixture with several branching arms called?", a: "A chandelier", d: ["A sconce","A lantern","A candelabrum"] },
    { c: "Architecture & Design", t: 2, q: "Which wide, symmetrical tie knot is named for a British duke?", a: "The Windsor", d: ["The Kent","The Pratt","The Oxford"] },
    { c: "Books", t: 3, q: "Which American poet wrote both 'The Song of Hiawatha' and 'Evangeline'?", a: "Henry Wadsworth Longfellow", d: ["William Cullen Bryant","James Russell Lowell","John Greenleaf Whittier"] },
    { c: "Books", t: 4, q: "Which Czech-born novelist wrote about Tomas and Tereza in Prague and the lightness of a life that happens only once?", a: "Milan Kundera", d: ["Bohumil Hrabal","Ivan Klima","Josef Skvorecky"] },
    { c: "Art", t: 5, q: "Which Mannerist painter made the Deposition for the Capponi Chapel in Florence?", a: "Pontormo", d: ["Rosso Fiorentino","Agnolo Bronzino","Andrea del Sarto"] },
  ],
  // day 46
  [
    { c: "Art", t: 1, q: "Which Italian painted the mural of the Last Supper on a Milan refectory wall?", a: "Leonardo da Vinci", d: ["Perugino","Andrea del Castagno","Domenico Ghirlandaio"] },
    { c: "Books", t: 2, q: "Which author wrote the novel narrated by an expelled schoolboy named Holden Caulfield?", a: "J. D. Salinger", d: ["Bernard Malamud","John Cheever","John Knowles"] },
    { c: "Books", t: 3, q: "Which playwright ended a play with Nora walking out of her marriage and slamming the front door?", a: "Henrik Ibsen", d: ["Anton Chekhov","August Strindberg","Maxim Gorky"] },
    { c: "Architecture & Design", t: 4, q: "Which Irish-born architect designed the White House?", a: "James Hoban", d: ["Benjamin Latrobe","William Thornton","Charles Bulfinch"] },
    { c: "Books", t: 5, q: "Which Sudanese novelist wrote of a village on the Nile and a man returning from years of study in London?", a: "Tayeb Salih", d: ["Yusuf Idris","Nuruddin Farah","Abdulrazak Gurnah"] },
  ],
  // day 47
  [
    { c: "Architecture & Design", t: 1, q: "What do you call a staircase that winds around a central pole?", a: "A spiral staircase", d: ["A dogleg staircase","A switchback staircase","A flying staircase"] },
    { c: "Books", t: 2, q: "Which author wrote the novel in which a Transylvanian count buys property in England and is hunted by Van Helsing?", a: "Bram Stoker", d: ["Robert Louis Stevenson","Arthur Machen","Sheridan Le Fanu"] },
    { c: "Art", t: 3, q: "Which movement took its name when a critic called Matisse and his circle wild beasts in 1905?", a: "Fauvism", d: ["Expressionism","Cubism","Orphism"] },
    { c: "Music", t: 4, q: "In which Puccini opera does a daughter sing O mio babbino caro to her father?", a: "Gianni Schicchi", d: ["Il tabarro","Suor Angelica","La rondine"] },
    { c: "Books", t: 5, q: "Which Yiddish writer told the story of a baker in Frampol who is mocked by the whole village and believes everything he is told?", a: "Isaac Bashevis Singer", d: ["I. L. Peretz","Sholem Aleichem","Chaim Grade"] },
  ],
  // day 48
  [
    { c: "Architecture & Design", t: 1, q: "What is the checked woolen pattern associated with Scottish clans called?", a: "Tartan", d: ["Tweed","Paisley","Argyle"] },
    { c: "Books", t: 2, q: "Which dragon sleeps on the treasure hoard under the Lonely Mountain?", a: "Smaug", d: ["Bard the Bowman","Beorn","Glaurung"] },
    { c: "Music", t: 3, q: "What was Ringo Starr's birth name?", a: "Richard Starkey", d: ["Ronald Starling","Richard Starling","Robert Starkey"] },
    { c: "Books", t: 4, q: "Which novelist wrote 'Wise Blood' and a story in which a grandmother meets an escaped convict called the Misfit?", a: "Flannery O'Connor", d: ["Katherine Anne Porter","Caroline Gordon","Eudora Welty"] },
    { c: "Music", t: 5, q: "Which medieval abbess composed the sung morality play Ordo Virtutum?", a: "Hildegard of Bingen", d: ["Gertrude the Great","Herrad of Landsberg","Mechthild of Magdeburg"] },
  ],
  // Days 49-79, live 2026-12-01 to 2026-12-31 (appended 2026-11-06).
  [
    { c: "Music", t: 1, q: "Which instrument did Jimi Hendrix famously play upside down and left-handed?", a: "The guitar", d: ["The bass", "The drums", "The keyboard"] },
    { c: "Art", t: 2, q: "Which holiday, on November 1 and 2, is marked with home altars called ofrendas?", a: "The Day of the Dead", d: ["Cinco de Mayo", "Las Posadas", "Carnival"] },
    { c: "Books", t: 3, q: "Which poet, who wrote 'How do I love thee? Let me count the ways', eloped to Italy in 1846?", a: "Elizabeth Barrett Browning", d: ["Christina Rossetti", "Emily Bronte", "Felicia Hemans"] },
    { c: "Books", t: 4, q: "Which novelist wrote 'The Luck of Barry Lyndon' (1844)?", a: "William Makepeace Thackeray", d: ["Anthony Trollope", "Charles Reade", "Wilkie Collins"] },
    { c: "Books", t: 5, q: "Which Chinese author of 'Red Sorghum' won the 2012 Nobel Prize in Literature?", a: "Mo Yan", d: ["Yu Hua", "Gao Xingjian", "Su Tong"] },
  ],
  [
    { c: "Music", t: 1, q: "What is the closing section of a song, often fading out, called?", a: "The outro", d: ["The intro", "The chorus", "The verse"] },
    { c: "Architecture & Design", t: 2, q: "What is a window that opens on side hinges, like a door, called?", a: "A casement window", d: ["A sash window", "A bay window", "A skylight"] },
    { c: "Books", t: 3, q: "Who wrote 'Tuck Everlasting' (1975), about a family that cannot die?", a: "Natalie Babbitt", d: ["Lois Lowry", "Katherine Paterson", "E. L. Konigsburg"] },
    { c: "Art", t: 4, q: "Which Swiss-German artist made 'Twittering Machine' (1922) and taught at the Bauhaus?", a: "Paul Klee", d: ["Johannes Itten", "Lyonel Feininger", "Oskar Schlemmer"] },
    { c: "Art", t: 5, q: "Which Regionalist painted a huge mural of abolitionist John Brown in the Kansas State Capitol?", a: "John Steuart Curry", d: ["Grant Wood", "Thomas Hart Benton", "Marvin Cone"] },
  ],
  [
    { c: "Music", t: 1, q: "Which style of music did the guitarist Paco de Lucia make famous around the world?", a: "Flamenco", d: ["Fado", "Mambo", "Polka"] },
    { c: "Music", t: 2, q: "Which composer revived Bach's 'St. Matthew Passion' in Berlin in 1829?", a: "Felix Mendelssohn", d: ["Richard Wagner", "Johann Strauss II", "Edward Elgar"] },
    { c: "Architecture & Design", t: 3, q: "Which Maya city in Yucatan has the stepped pyramid El Castillo?", a: "Chichen Itza", d: ["Tikal", "Palenque", "Copan"] },
    { c: "Architecture & Design", t: 4, q: "Which French cathedral southwest of Paris is famous for its medieval blue stained glass and a labyrinth in its floor?", a: "Chartres", d: ["Amiens", "Reims", "Bourges"] },
    { c: "Architecture & Design", t: 5, q: "Which architect designed the Red House (1859) in Kent for William Morris?", a: "Philip Webb", d: ["Richard Norman Shaw", "William Burges", "George Edmund Street"] },
  ],
  [
    { c: "Art", t: 1, q: "What do you call the little drawings people make absentmindedly in the margins of notebooks?", a: "Doodles", d: ["Engravings", "Murals", "Etchings"] },
    { c: "Art", t: 2, q: "Which Paris museum holds Manet's 'Olympia' and Whistler's portrait of his mother?", a: "The Musee d'Orsay", d: ["The Louvre", "The Petit Palais", "The Musee Rodin"] },
    { c: "Architecture & Design", t: 3, q: "Which Beijing palace complex is now home to the Palace Museum?", a: "The Forbidden City", d: ["The Summer Palace", "The Temple of Heaven", "Zhongnanhai"] },
    { c: "Architecture & Design", t: 4, q: "Which island in the Venetian lagoon has been famous for glassmaking since the 1290s?", a: "Murano", d: ["Burano", "Torcello", "Giudecca"] },
    { c: "Architecture & Design", t: 5, q: "Which Dutch architect designed both the Rijksmuseum (1885) and the city's Centraal Station (1889)?", a: "Pierre Cuypers", d: ["Hendrik Petrus Berlage", "Michel de Klerk", "Willem Dudok"] },
  ],
  [
    { c: "Books", t: 1, q: "In 'Cinderella', what does the fairy godmother turn a pumpkin into?", a: "A coach", d: ["A castle", "A ball gown", "A horse"] },
    { c: "Music", t: 2, q: "Which musical, based on a comic strip, features Daddy Warbucks?", a: "Annie", d: ["Oliver!", "Matilda", "Gypsy"] },
    { c: "Architecture & Design", t: 3, q: "Which Venetian bridge did Lord Byron help make famous in 'Childe Harold's Pilgrimage'?", a: "The Bridge of Sighs", d: ["The Rialto Bridge", "The Accademia Bridge", "The Scalzi Bridge"] },
    { c: "Music", t: 4, q: "Which German group released 'Trans-Europe Express' (1977)?", a: "Kraftwerk", d: ["Tangerine Dream", "Can", "Neu!"] },
    { c: "Music", t: 5, q: "Which English composer wrote the music for 'Rule, Britannia!' (1740)?", a: "Thomas Arne", d: ["William Boyce", "Henry Purcell", "Charles Avison"] },
  ],
  [
    { c: "Architecture & Design", t: 1, q: "What is the short, stiff, stand-out skirt worn by ballerinas called?", a: "A tutu", d: ["A kilt", "A sarong", "A pinafore"] },
    { c: "Music", t: 2, q: "Which band's singer Bon Scott died in 1980, before Brian Johnson took over?", a: "AC/DC", d: ["Def Leppard", "Judas Priest", "Iron Maiden"] },
    { c: "Art", t: 3, q: "Which German-American painter made 'Washington Crossing the Delaware' (1851)?", a: "Emanuel Leutze", d: ["Albert Bierstadt", "John Trumbull", "Thomas Sully"] },
    { c: "Architecture & Design", t: 4, q: "Which Byzantine church in Ravenna has mosaics of Emperor Justinian and Empress Theodora?", a: "San Vitale", d: ["Sant'Apollinare Nuovo", "San Marco", "Santa Maria Maggiore"] },
    { c: "Music", t: 5, q: "Which pianist and organist recorded 'Your Feet's Too Big' (1939)?", a: "Fats Waller", d: ["James P. Johnson", "Willie 'The Lion' Smith", "Eubie Blake"] },
  ],
  [
    { c: "Art", t: 1, q: "What kind of paint do young children often apply with their hands instead of a brush?", a: "Finger paint", d: ["Spray paint", "Oil paint", "House paint"] },
    { c: "Books", t: 2, q: "What is the name of Sherlock Holmes's archenemy, the Napoleon of crime?", a: "Professor Moriarty", d: ["Colonel Moran", "Irene Adler", "Mycroft Holmes"] },
    { c: "Books", t: 3, q: "Which Shakespeare comedy features the sparring lovers Beatrice and Benedick?", a: "Much Ado About Nothing", d: ["As You Like It", "The Taming of the Shrew", "Twelfth Night"] },
    { c: "Books", t: 4, q: "Who wrote 'Where the Red Fern Grows' (1961), about a boy and his two hunting dogs?", a: "Wilson Rawls", d: ["Fred Gipson", "Jim Kjelgaard", "Sterling North"] },
    { c: "Art", t: 5, q: "Which Seville painter, known for tender Immaculate Conceptions and street urchins, died after a fall from scaffolding in 1682?", a: "Bartolome Esteban Murillo", d: ["Juan de Valdes Leal", "Francisco Herrera the Elder", "Alonso Cano"] },
  ],
  [
    { c: "Music", t: 1, q: "What is a group of musicians that plays while parading, as at a school football game?", a: "A marching band", d: ["A string quartet", "A jazz trio", "A chamber orchestra"] },
    { c: "Art", t: 2, q: "What are the sets of wooden Russian dolls that fit inside one another called?", a: "Matryoshka", d: ["Kachina", "Kokeshi", "Pysanka"] },
    { c: "Books", t: 3, q: "Which author created the detective Sam Spade in 'The Maltese Falcon' (1930)?", a: "Dashiell Hammett", d: ["Raymond Chandler", "Erle Stanley Gardner", "Mickey Spillane"] },
    { c: "Art", t: 4, q: "Which painter, a grandson of Sigmund Freud, made a small portrait of Queen Elizabeth II in 2001?", a: "Lucian Freud", d: ["Frank Auerbach", "Leon Kossoff", "David Hockney"] },
    { c: "Art", t: 5, q: "Which Joseon painter pioneered true-view landscapes of Korea, such as Inwang Mountain After Rain (1751)?", a: "Jeong Seon", d: ["Kim Hong-do", "Sin Yun-bok", "An Gyeon"] },
  ],
  [
    { c: "Books", t: 1, q: "Who wrote 'Charlotte's Web' (1952)?", a: "E. B. White", d: ["Beverly Cleary", "Robert McCloskey", "Kate DiCamillo"] },
    { c: "Music", t: 2, q: "Which singer released the album 'Thank U, Next' in 2019?", a: "Ariana Grande", d: ["Halsey", "Camila Cabello", "Dua Lipa"] },
    { c: "Books", t: 3, q: "In 'The Wind in the Willows', what kind of animal is Ratty?", a: "A water vole", d: ["A beaver", "A mole", "An otter"] },
    { c: "Books", t: 4, q: "Which author wrote 'Tess of the d'Urbervilles' (1891)?", a: "Thomas Hardy", d: ["George Meredith", "George Gissing", "Anthony Trollope"] },
    { c: "Music", t: 5, q: "Which Malian kora player recorded 'In the Heart of the Moon' with Ali Farka Toure?", a: "Toumani Diabate", d: ["Mory Kante", "Sidiki Diabate", "Ballake Sissoko"] },
  ],
  [
    { c: "Art", t: 1, q: "Which Giza monument, missing its nose, crouches in front of the pyramid of Khafre?", a: "The Great Sphinx", d: ["The Colossus", "The Great Griffin", "The Lamassu"] },
    { c: "Architecture & Design", t: 2, q: "What decorative paper is pasted onto interior walls?", a: "Wallpaper", d: ["Parchment", "Vellum", "Papyrus"] },
    { c: "Books", t: 3, q: "Which Shakespeare play contains the line 'O brave new world, that has such people in't'?", a: "The Tempest", d: ["A Midsummer Night's Dream", "The Winter's Tale", "Cymbeline"] },
    { c: "Music", t: 4, q: "Which soul singer recorded '(Sittin' On) The Dock of the Bay' days before his death in 1967?", a: "Otis Redding", d: ["Sam Cooke", "Wilson Pickett", "Solomon Burke"] },
    { c: "Art", t: 5, q: "Which Haarlem painter specialized in muted 'monochrome banquet' still lifes, such as 'Still Life with a Gilt Cup' (1635)?", a: "Willem Claesz Heda", d: ["Willem Kalf", "Clara Peeters", "Jan Davidsz de Heem"] },
  ],
  [
    { c: "Books", t: 1, q: "In 'Charlie and the Chocolate Factory', which girl swells up into a giant blueberry?", a: "Violet Beauregarde", d: ["Veruca Salt", "Augustus Gloop", "Matilda Wormwood"] },
    { c: "Art", t: 2, q: "Which Botticelli painting shows a goddess arriving on the shore standing on a scallop shell?", a: "The Birth of Venus", d: ["Primavera", "Venus and Mars", "The Calumny of Apelles"] },
    { c: "Art", t: 3, q: "What is a very small portrait, often painted on ivory and carried in a locket, called?", a: "A miniature", d: ["A cameo", "A tondo", "A vignette"] },
    { c: "Architecture & Design", t: 4, q: "Which Chicago architect said 'Make no little plans' and directed the 1893 World's Columbian Exposition?", a: "Daniel Burnham", d: ["Frederick Law Olmsted", "Louis Sullivan", "William Le Baron Jenney"] },
    { c: "Architecture & Design", t: 5, q: "Which Swiss watchmaker introduced the flip-over Reverso watch for polo players in 1931?", a: "Jaeger-LeCoultre", d: ["Patek Philippe", "Vacheron Constantin", "Audemars Piguet"] },
  ],
  [
    { c: "Art", t: 1, q: "Which red-framed drawing toy lets you draw by turning two white knobs?", a: "Etch A Sketch", d: ["Spirograph", "Lite-Brite", "Magna Doodle"] },
    { c: "Music", t: 2, q: "Which country singer released 'Friends in Low Places' in 1990?", a: "Garth Brooks", d: ["George Strait", "Alan Jackson", "Clint Black"] },
    { c: "Music", t: 3, q: "Which band recorded 'Sweet Jane' and 'Heroin', with Lou Reed and John Cale?", a: "The Velvet Underground", d: ["The New York Dolls", "Television", "The Fugs"] },
    { c: "Art", t: 4, q: "Which Impressionist made 'The Cradle' (1872), showing her sister watching a sleeping baby?", a: "Berthe Morisot", d: ["Mary Cassatt", "Eva Gonzales", "Marie Bracquemond"] },
    { c: "Books", t: 5, q: "Which French poet wrote 'The Afternoon of a Faun', which inspired Debussy?", a: "Stephane Mallarme", d: ["Paul Valery", "Theophile Gautier", "Jose-Maria de Heredia"] },
  ],
  [
    { c: "Architecture & Design", t: 1, q: "What material is a log cabin built from?", a: "Wood", d: ["Stone", "Brick", "Adobe"] },
    { c: "Architecture & Design", t: 2, q: "Which German carmaker's logo is a three-pointed star in a circle?", a: "Mercedes-Benz", d: ["BMW", "Audi", "Porsche"] },
    { c: "Architecture & Design", t: 3, q: "Which brimless red felt hat with a black tassel is named after a city in Morocco?", a: "The fez", d: ["The kufi", "The beret", "The pillbox"] },
    { c: "Architecture & Design", t: 4, q: "What is the ornate scroll-sawn wooden trim on Victorian American houses nicknamed?", a: "Gingerbread", d: ["Fretwork lace", "Sugarwork", "Rococo trim"] },
    { c: "Art", t: 5, q: "Which ukiyo-e artist made striking portraits of kabuki actors for about ten months in 1794 to 1795 and then vanished?", a: "Toshusai Sharaku", d: ["Kitagawa Utamaro", "Torii Kiyonaga", "Katsukawa Shunsho"] },
  ],
  [
    { c: "Architecture & Design", t: 1, q: "What is a long upholstered seat for two or more people called?", a: "A sofa", d: ["A stool", "An ottoman", "A bench"] },
    { c: "Art", t: 2, q: "Which cartoonist created Charlie Brown and Snoopy?", a: "Charles M. Schulz", d: ["Jim Davis", "Mort Walker", "Hank Ketcham"] },
    { c: "Books", t: 3, q: "Which author created Meg Murry and her brother Charles Wallace?", a: "Madeleine L'Engle", d: ["Ursula K. Le Guin", "Lloyd Alexander", "Susan Cooper"] },
    { c: "Books", t: 4, q: "Which author wrote 'The Joy Luck Club' (1989)?", a: "Amy Tan", d: ["Maxine Hong Kingston", "Gish Jen", "Lisa See"] },
    { c: "Art", t: 5, q: "Which painter and teacher led the group known as The Eight in 1908 and wrote 'The Art Spirit'?", a: "Robert Henri", d: ["William Glackens", "Arthur B. Davies", "Ernest Lawson"] },
  ],
  [
    { c: "Music", t: 1, q: "Which singer and pianist had a 1973 hit with 'Piano Man'?", a: "Billy Joel", d: ["Elton John", "Barry Manilow", "Neil Diamond"] },
    { c: "Books", t: 2, q: "Which Shakespeare play contains the line 'To be, or not to be'?", a: "Hamlet", d: ["Macbeth", "King Lear", "Othello"] },
    { c: "Architecture & Design", t: 3, q: "Which New York jeweler, founded in 1837, packs its goods in a robin's-egg blue box?", a: "Tiffany and Co.", d: ["Harry Winston", "Cartier", "Van Cleef and Arpels"] },
    { c: "Books", t: 4, q: "Who wrote 'The Brothers Lionheart' and 'Ronia, the Robber's Daughter'?", a: "Astrid Lindgren", d: ["Selma Lagerlof", "Tove Jansson", "Maria Gripe"] },
    { c: "Books", t: 5, q: "Which Israeli author wrote the memoir 'A Tale of Love and Darkness' (2002)?", a: "Amos Oz", d: ["A. B. Yehoshua", "David Grossman", "Aharon Appelfeld"] },
  ],
  [
    { c: "Art", t: 1, q: "Which giant statue of Jesus with outstretched arms looks over Rio de Janeiro?", a: "Christ the Redeemer", d: ["The Sacred Heart", "Christ of the Abyss", "Christ of the Ozarks"] },
    { c: "Art", t: 2, q: "Which cartoonist won a 1992 Pulitzer Prize for 'Maus', drawing Jews as mice and Nazis as cats?", a: "Art Spiegelman", d: ["Will Eisner", "Harvey Pekar", "Robert Crumb"] },
    { c: "Music", t: 3, q: "Which Italian tenor sang as one of the Three Tenors with Placido Domingo and Jose Carreras?", a: "Luciano Pavarotti", d: ["Andrea Bocelli", "Franco Corelli", "Carlo Bergonzi"] },
    { c: "Art", t: 4, q: "Which Harlem Renaissance painter made the murals 'Aspects of Negro Life' (1934)?", a: "Aaron Douglas", d: ["Palmer Hayden", "Archibald Motley", "William H. Johnson"] },
    { c: "Books", t: 5, q: "Which French poet wrote 'A Season in Hell' before giving up poetry in his early twenties?", a: "Arthur Rimbaud", d: ["Paul Verlaine", "Jules Laforgue", "Tristan Corbiere"] },
  ],
  [
    { c: "Art", t: 1, q: "What is the job of a person who draws the moving pictures for cartoons?", a: "An animator", d: ["A cinematographer", "A choreographer", "A stenographer"] },
    { c: "Architecture & Design", t: 2, q: "What is an open garden structure of posts and crossbeams that supports climbing plants?", a: "A pergola", d: ["A gazebo", "A pavilion", "A conservatory"] },
    { c: "Books", t: 3, q: "Who wrote the detective novel 'The Big Sleep' (1939)?", a: "Raymond Chandler", d: ["Dashiell Hammett", "Ross Macdonald", "James M. Cain"] },
    { c: "Music", t: 4, q: "Which rockabilly singer wrote and first recorded 'Blue Suede Shoes' (1956)?", a: "Carl Perkins", d: ["Jerry Lee Lewis", "Gene Vincent", "Eddie Cochran"] },
    { c: "Music", t: 5, q: "Which shehnai player performed at the Red Fort on India's first Independence Day in 1947?", a: "Bismillah Khan", d: ["Ali Akbar Khan", "Hariprasad Chaurasia", "Pannalal Ghosh"] },
  ],
  [
    { c: "Books", t: 1, q: "Which bear's friends include Piglet, Tigger and Eeyore?", a: "Winnie-the-Pooh", d: ["Paddington", "Rupert", "Corduroy"] },
    { c: "Architecture & Design", t: 2, q: "In which city does the Brandenburg Gate stand?", a: "Berlin", d: ["Munich", "Vienna", "Hamburg"] },
    { c: "Architecture & Design", t: 3, q: "Which French jewelry house made the famous panther brooches for the Duchess of Windsor?", a: "Cartier", d: ["Boucheron", "Chaumet", "Mauboussin"] },
    { c: "Music", t: 4, q: "Which country singer, nicknamed the Singing Brakeman, recorded his 'Blue Yodels' from 1927?", a: "Jimmie Rodgers", d: ["Ernest Tubb", "Hank Snow", "Gene Autry"] },
    { c: "Architecture & Design", t: 5, q: "Which Italian Rationalist architect designed the Casa del Fascio in Como (1936)?", a: "Giuseppe Terragni", d: ["Marcello Piacentini", "Giovanni Michelucci", "Adalberto Libera"] },
  ],
  [
    { c: "Music", t: 1, q: "Which instrument is central to Louisiana zydeco, as played by Clifton Chenier?", a: "The accordion", d: ["The harmonica", "The bagpipes", "The harmonium"] },
    { c: "Architecture & Design", t: 2, q: "Which Manhattan avenue, lined with luxury stores, runs past Central Park?", a: "Fifth Avenue", d: ["Park Avenue", "Lexington Avenue", "Broadway"] },
    { c: "Music", t: 3, q: "What is the leading first violinist of an orchestra, who tunes the players, called?", a: "The concertmaster", d: ["The principal conductor", "The kapellmeister", "The repetiteur"] },
    { c: "Art", t: 4, q: "Which French artist made Art Nouveau glass vases at his workshops in Nancy?", a: "Emile Galle", d: ["Rene Lalique", "Louis Majorelle", "Louis Comfort Tiffany"] },
    { c: "Art", t: 5, q: "Which Sienese painter made the Maesta fresco in Siena's Palazzo Pubblico and later worked at the papal court in Avignon?", a: "Simone Martini", d: ["Ambrogio Lorenzetti", "Pietro Lorenzetti", "Lippo Memmi"] },
  ],
  [
    { c: "Books", t: 1, q: "Which detective solves the 'Murder on the Orient Express' (1934)?", a: "Hercule Poirot", d: ["Inspector Maigret", "Father Brown", "Lord Peter Wimsey"] },
    { c: "Books", t: 2, q: "Who wrote 'Emily of New Moon' (1923) and set most of her books on Prince Edward Island?", a: "L. M. Montgomery", d: ["Louisa May Alcott", "Kate Douglas Wiggin", "Eleanor H. Porter"] },
    { c: "Architecture & Design", t: 3, q: "Which Paris royal chapel, built for Louis IX in the 1240s, is famous for its towering walls of stained glass?", a: "Sainte-Chapelle", d: ["Notre-Dame", "Saint-Denis", "Sacre-Coeur"] },
    { c: "Books", t: 4, q: "Under which pen name did Mary Ann Evans write 'Middlemarch'?", a: "George Eliot", d: ["Currer Bell", "George Sand", "Acton Bell"] },
    { c: "Music", t: 5, q: "Which Spanish violinist composed 'Zigeunerweisen' (1878)?", a: "Pablo de Sarasate", d: ["Isaac Albeniz", "Enrique Fernandez Arbos", "Juan Manen"] },
  ],
  [
    { c: "Books", t: 1, q: "In Aesop's fable, who cries 'Wolf!' once too often?", a: "The shepherd boy", d: ["The farmer", "The hunter", "The miller"] },
    { c: "Architecture & Design", t: 2, q: "Which metal did Roman plumbers use for water pipes, giving plumbing its name?", a: "Lead", d: ["Copper", "Iron", "Bronze"] },
    { c: "Books", t: 3, q: "Which Bronte sister wrote 'The Tenant of Wildfell Hall' (1848)?", a: "Anne Bronte", d: ["Emily Bronte", "Charlotte Bronte", "Maria Bronte"] },
    { c: "Art", t: 4, q: "Which Ashcan School painter made the boxing scene 'Stag at Sharkey's' (1909)?", a: "George Bellows", d: ["John Sloan", "Everett Shinn", "George Luks"] },
    { c: "Art", t: 5, q: "Which French painter made candlelit scenes such as 'The Magdalen with the Smoking Flame'?", a: "Georges de La Tour", d: ["Louis Le Nain", "Valentin de Boulogne", "Philippe de Champaigne"] },
  ],
  [
    { c: "Music", t: 1, q: "Which instrument, plucked by players like Ray Brown, holds down the bass line in a jazz trio?", a: "The double bass", d: ["The cello", "The viola", "The bass guitar"] },
    { c: "Music", t: 2, q: "Which British singer-songwriter released 'Shape of You' in 2017?", a: "Ed Sheeran", d: ["Sam Smith", "James Bay", "Harry Styles"] },
    { c: "Music", t: 3, q: "Which singer-songwriter wrote 'Big Yellow Taxi' and 'Both Sides, Now'?", a: "Joni Mitchell", d: ["Carole King", "Judy Collins", "Carly Simon"] },
    { c: "Architecture & Design", t: 4, q: "Which New Orleans neighborhood, the city's oldest, is known for its iron-lace balconies?", a: "The French Quarter", d: ["The Garden District", "Treme", "The Marigny"] },
    { c: "Architecture & Design", t: 5, q: "Which French architect designed the Bibliotheque Sainte-Genevieve (1850), with its exposed iron reading room?", a: "Henri Labrouste", d: ["Charles Garnier", "Victor Baltard", "Jacques Ignace Hittorff"] },
  ],
  [
    { c: "Books", t: 1, q: "Which teenage sleuth solves mysteries in books credited to Carolyn Keene?", a: "Nancy Drew", d: ["Trixie Belden", "Encyclopedia Brown", "Harriet the Spy"] },
    { c: "Music", t: 2, q: "Which instrument does Itzhak Perlman play?", a: "The violin", d: ["The cello", "The piano", "The viola"] },
    { c: "Art", t: 3, q: "Which Greek sculptor was accused of stealing gold meant for his statue of Athena?", a: "Phidias", d: ["Praxiteles", "Myron", "Scopas"] },
    { c: "Books", t: 4, q: "Which Russian playwright, also a doctor, wrote 'Uncle Vanya'?", a: "Anton Chekhov", d: ["Maxim Gorky", "Ivan Turgenev", "Alexander Ostrovsky"] },
    { c: "Books", t: 5, q: "Which poet wrote the sequences 'Voyages' and 'At Melville's Tomb'?", a: "Hart Crane", d: ["Wallace Stevens", "William Carlos Williams", "Archibald MacLeish"] },
  ],
  [
    { c: "Architecture & Design", t: 1, q: "What is a building with a large telescope, used for studying the stars, called?", a: "An observatory", d: ["A planetarium", "A laboratory", "A lighthouse"] },
    { c: "Books", t: 2, q: "Which 1823 poem named Santa's reindeer, including Dasher, Dancer and Prancer?", a: "A Visit from St. Nicholas", d: ["The Night Before the Holidays", "A Christmas Carol", "Santa's Journey"] },
    { c: "Art", t: 3, q: "Which Florentine banking family were patrons of Botticelli and the young Michelangelo?", a: "The Medici", d: ["The Strozzi", "The Pazzi", "The Borgia"] },
    { c: "Music", t: 4, q: "Whose band, the Blue Grass Boys, gave bluegrass music its name?", a: "Bill Monroe", d: ["Earl Scruggs", "Lester Flatt", "Ralph Stanley"] },
    { c: "Music", t: 5, q: "Which Russian composer wrote 'Prometheus: The Poem of Fire' with a part for a light keyboard?", a: "Alexander Scriabin", d: ["Anatoly Lyadov", "Sergei Taneyev", "Nikolai Medtner"] },
  ],
  [
    { c: "Architecture & Design", t: 1, q: "What is a rubber-soled canvas or leather athletic shoe called?", a: "A sneaker", d: ["A loafer", "A clog", "A sandal"] },
    { c: "Architecture & Design", t: 2, q: "What is a backless shoe or slipper called, sharing its name with a farm animal?", a: "A mule", d: ["A pony", "A goat", "A colt"] },
    { c: "Architecture & Design", t: 3, q: "Which ancient city near Mexico City has the Pyramid of the Sun and the Avenue of the Dead?", a: "Teotihuacan", d: ["Tenochtitlan", "Tula", "Monte Alban"] },
    { c: "Music", t: 4, q: "Which French composer wrote a gentle Requiem (1888) that ends with 'In Paradisum'?", a: "Gabriel Faure", d: ["Camille Saint-Saens", "Charles Gounod", "Cesar Franck"] },
    { c: "Architecture & Design", t: 5, q: "Which Danish silversmith founded a Copenhagen design house in 1904?", a: "Georg Jensen", d: ["Arne Jacobsen", "Kay Bojesen", "Poul Henningsen"] },
  ],
  [
    { c: "Architecture & Design", t: 1, q: "What are the cloth window coverings that are pulled open and shut called?", a: "Curtains", d: ["Blinds", "Shutters", "Awnings"] },
    { c: "Books", t: 2, q: "Who wrote 'Black Beauty' (1877), told by a horse?", a: "Anna Sewell", d: ["Marguerite Henry", "Mary O'Hara", "Enid Bagnold"] },
    { c: "Art", t: 3, q: "What is the Japanese craft of cutting and folding paper into designs called?", a: "Kirigami", d: ["Origami", "Shodo", "Kintsugi"] },
    { c: "Books", t: 4, q: "Who wrote the novel 'Never Let Me Go' (2005)?", a: "Kazuo Ishiguro", d: ["Ian McEwan", "Julian Barnes", "Graham Swift"] },
    { c: "Architecture & Design", t: 5, q: "Which Finnish designer created the Ball Chair, a sphere you sit inside, in 1963?", a: "Eero Aarnio", d: ["Yrjo Kukkapuro", "Ilmari Tapiovaara", "Alvar Aalto"] },
  ],
  [
    { c: "Architecture & Design", t: 1, q: "What is the room or building where a family keeps its car?", a: "A garage", d: ["A porch", "A pantry", "A foyer"] },
    { c: "Art", t: 2, q: "What is the candy-filled papier-mache figure that children break with a stick at Mexican parties?", a: "A pinata", d: ["A calavera", "An alebrije", "A milagro"] },
    { c: "Music", t: 3, q: "Which bebop saxophonist recorded 'Ko-Ko' (1945) and died at 34 in 1955?", a: "Charlie Parker", d: ["Johnny Hodges", "Sonny Stitt", "Cannonball Adderley"] },
    { c: "Music", t: 4, q: "Which pianist-composer took minor orders in the church and was called the Abbe?", a: "Franz Liszt", d: ["Johannes Brahms", "Ferenc Erkel", "Karl Goldmark"] },
    { c: "Music", t: 5, q: "Which Italian composer wrote a famous 'Stabat Mater' in 1736, the year he died at 26?", a: "Giovanni Battista Pergolesi", d: ["Leonardo Vinci", "Leonardo Leo", "Francesco Durante"] },
  ],
  [
    { c: "Music", t: 1, q: "Which style of music was born in New Orleans in the early 1900s?", a: "Jazz", d: ["Country", "Disco", "Heavy metal"] },
    { c: "Architecture & Design", t: 2, q: "What do you call a building divided into two separate homes?", a: "A duplex", d: ["A penthouse", "A bungalow", "A studio"] },
    { c: "Music", t: 3, q: "Which Motown star was born Stevland Morris?", a: "Stevie Wonder", d: ["Smokey Robinson", "Marvin Gaye", "Lionel Richie"] },
    { c: "Art", t: 4, q: "Which French painter made many pictures of his wife, Marthe, in the bath?", a: "Pierre Bonnard", d: ["Edouard Vuillard", "Maurice Denis", "Felix Vallotton"] },
    { c: "Books", t: 5, q: "Which poet wrote the national anthems of both India and Bangladesh?", a: "Rabindranath Tagore", d: ["Kazi Nazrul Islam", "Bankim Chandra Chatterjee", "Michael Madhusudan Dutt"] },
  ],
  [
    { c: "Art", t: 1, q: "What is the craft of decorating an object with glued paper cutouts sealed under layers of varnish?", a: "Decoupage", d: ["Mosaic", "Batik", "Stenciling"] },
    { c: "Architecture & Design", t: 2, q: "Which London palace has the Changing of the Guard in its forecourt?", a: "Buckingham Palace", d: ["Kensington Palace", "St James's Palace", "Windsor Castle"] },
    { c: "Art", t: 3, q: "Which British illustrator created the striped wanderer Waldo, called Wally in Britain?", a: "Martin Handford", d: ["Quentin Blake", "Raymond Briggs", "Graeme Base"] },
    { c: "Books", t: 4, q: "Which author wrote the ghost story 'The Turn of the Screw' (1898)?", a: "Henry James", d: ["Edith Wharton", "M. R. James", "Sheridan Le Fanu"] },
    { c: "Music", t: 5, q: "Which German Baroque composer, godfather to C. P. E. Bach, published 'Tafelmusik' in 1733?", a: "Georg Philipp Telemann", d: ["Johann Mattheson", "Christoph Graupner", "Johann Friedrich Fasch"] },
  ],
  [
    { c: "Music", t: 1, q: "What do you call a piece of music performed by two singers or players?", a: "A duet", d: ["A solo", "A trio", "A round"] },
    { c: "Books", t: 2, q: "Which Shakespeare tragedy has a sleepwalking queen who cannot wash out a 'damned spot'?", a: "Macbeth", d: ["Hamlet", "Richard III", "The Tempest"] },
    { c: "Art", t: 3, q: "Which Victorian critic wrote 'Modern Painters' in defense of J.M.W. Turner?", a: "John Ruskin", d: ["Walter Pater", "William Morris", "Matthew Arnold"] },
    { c: "Music", t: 4, q: "Which composer wrote the opera 'Lakme' (1883), home of the 'Flower Duet'?", a: "Leo Delibes", d: ["Jules Massenet", "Ambroise Thomas", "Edouard Lalo"] },
    { c: "Books", t: 5, q: "Which poet worked as secretary to the sculptor Auguste Rodin in Paris?", a: "Rainer Maria Rilke", d: ["Stefan George", "Hugo von Hofmannsthal", "Georg Trakl"] },
  ],
  [
    { c: "Books", t: 1, q: "What is the name of the school of witchcraft and wizardry in the Harry Potter books?", a: "Hogwarts", d: ["Durmstrang", "Beauxbatons", "Ilvermorny"] },
    { c: "Books", t: 2, q: "In 'Alice's Adventures in Wonderland', who hosts the tea party with the March Hare?", a: "The Mad Hatter", d: ["The White Rabbit", "The Queen of Hearts", "The Caterpillar"] },
    { c: "Music", t: 3, q: "Which jazz singer was nicknamed Sassy and the Divine One?", a: "Sarah Vaughan", d: ["Dinah Washington", "Carmen McRae", "Betty Carter"] },
    { c: "Architecture & Design", t: 4, q: "What is an ornamental building with no real purpose, such as a fake ruin in a landscape garden, called?", a: "A folly", d: ["A grotto", "An orangery", "A belvedere"] },
    { c: "Books", t: 5, q: "Which Turkish poet wrote 'Human Landscapes from My Country' while in prison?", a: "Nazim Hikmet", d: ["Orhan Veli", "Yunus Emre", "Ahmet Hamdi Tanpinar"] },
  ],
];
