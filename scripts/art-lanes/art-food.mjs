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
];
