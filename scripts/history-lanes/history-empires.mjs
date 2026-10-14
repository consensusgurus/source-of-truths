// History daily, lane 'Empires & Revolutions': about 1500 to 1914 worldwide.
// Political, colonial and revolutionary history; battles live in 'War & Conflict'.
const C = 'Empires & Revolutions';
const day = (rows) => rows.map(([q, a, d], i) => ({ c: C, t: i + 1, q, a, d }));

export const LANE_DAYS = [
  // day 1
  day([
    ["Mount Vernon, the plantation on the Potomac River, was the home of which Founding Father?", "George Washington", ["Thomas Jefferson", "James Madison", "Patrick Henry"]],
    ["Which queen of France is famously, and probably falsely, credited with saying 'Let them eat cake'?", "Marie Antoinette", ["Catherine de' Medici", "Josephine de Beauharnais", "Anne of Austria"]],
    ["Which Italian revolutionary founded the secret society Young Italy in 1831?", "Giuseppe Mazzini", ["Giuseppe Garibaldi", "Camillo Cavour", "Daniele Manin"]],
    ["Which Qing emperor, on the throne from 1661 to 1722, had the longest reign in Chinese history?", "Kangxi", ["Qianlong", "Yongzheng", "Shunzhi"]],
    ["Which Ottoman grand vizier, married to a granddaughter of Suleiman, effectively ran the empire under three sultans until his assassination in 1579?", "Sokollu Mehmed Pasha", ["Pargali Ibrahim Pasha", "Rustem Pasha", "Koprulu Mehmed Pasha"]],
  ]),
  // day 2
  day([
    ["Which country colonized the Philippines, naming the islands after its King Philip II?", "Spain", ["Portugal", "The Netherlands", "France"]],
    ["Which royal house ruled France when the Revolution broke out in 1789?", "The Bourbons", ["The Valois", "The Habsburgs", "The Stuarts"]],
    ["Which ruler, the only woman to head the Habsburg lands in her own right, reigned from 1740 to 1780?", "Maria Theresa", ["Maria Anna", "Isabella of Parma", "Elisabeth Christine"]],
    ["Which 1888 law, signed by Princess Isabel, abolished slavery in Brazil?", "The Golden Law", ["The Free Womb Law", "The Sexagenarian Law", "The Eusebio de Queiros Law"]],
    ["Which viceroy of Peru (1569 to 1581) reorganized the mita labor draft and had the Inca ruler Tupac Amaru executed?", "Francisco de Toledo", ["Antonio de Mendoza", "Pedro de la Gasca", "Blasco Nunez Vela"]],
  ]),
  // day 3
  day([
    ["Which group of English settlers is traditionally said to have stepped ashore at Plymouth Rock in 1620?", "The Pilgrims", ["The Quakers", "The Huguenots", "The Shakers"]],
    ["Which Founding Father designed his own hilltop home in Virginia, Monticello?", "Thomas Jefferson", ["George Washington", "James Madison", "James Monroe"]],
    ["Which Florentine banking family produced Popes Leo X and Clement VII?", "The Medici", ["The Borgia", "The Sforza", "The Este"]],
    ["Which Prussian minister issued the October Edict of 1807, which abolished hereditary serfdom?", "Baron vom Stein", ["Karl August von Hardenberg", "Otto von Bismarck", "Wilhelm von Humboldt"]],
    ["Which 1689 treaty fixed the border between Qing China and Russia, the first between China and a European power?", "The Treaty of Nerchinsk", ["The Treaty of Kyakhta", "The Treaty of Aigun", "The Treaty of Peking"]],
  ]),
  // day 4
  day([
    ["What did abolitionists campaign to end?", "Slavery", ["Monarchy", "Taxation", "Alcohol"]],
    ["What title, first taken at a coronation by Ivan IV in 1547, was borne by the rulers of Russia?", "Tsar", ["Kaiser", "Shah", "Sultan"]],
    ["Which Haitian revolutionary crowned himself King Henry I and built the mountaintop Citadelle Laferriere?", "Henri Christophe", ["Alexandre Petion", "Jean-Pierre Boyer", "Jean-Jacques Dessalines"]],
    ["Which British governor-general of India banned the practice of sati in 1829?", "Lord William Bentinck", ["Lord Dalhousie", "Lord Cornwallis", "Lord Wellesley"]],
    ["Which Dutch governor-general founded Batavia in 1619 as the Asian base of the Dutch East India Company?", "Jan Pieterszoon Coen", ["Pieter Both", "Anthony van Diemen", "Cornelis de Houtman"]],
  ]),
  // day 5
  day([
    ["Which US state takes its name from Elizabeth I, the 'Virgin Queen'?", "Virginia", ["Maryland", "Georgia", "Carolina"]],
    ["Which Prussian king, an enthusiast for Enlightenment ideas, ruled from 1740 to 1786?", "Frederick the Great", ["Frederick William I", "Frederick William II", "Frederick I"]],
    ["Which Austrian minister shaped European diplomacy after 1815 but fled Vienna in the revolutions of 1848?", "Klemens von Metternich", ["Felix Schwarzenberg", "Friedrich von Gentz", "Johann Philipp Stadion"]],
    ["Which Mughal emperor promoted a syncretic religious path called Din-i Ilahi?", "Akbar", ["Babur", "Humayun", "Jahangir"]],
    ["Which 1542 Spanish law code tried to curb the encomienda and banned the enslavement of Indigenous Americans?", "The New Laws", ["The Laws of Burgos", "The Laws of the Indies", "The Valladolid Decrees"]],
  ]),
  // day 6
  day([
    ["What form of government did France proclaim in September 1792 after abolishing the monarchy?", "A republic", ["A dictatorship", "An empire", "A theocracy"]],
    ["Which king founded the Tudor dynasty when he took the English throne in 1485?", "Henry VII", ["Richard III", "Henry VIII", "Edward IV"]],
    ["Which French Protestants were granted toleration by the Edict of Nantes in 1598?", "The Huguenots", ["The Jansenists", "The Cathars", "The Waldensians"]],
    ["Which Qing commissioner confiscated and destroyed British opium at Humen in 1839?", "Lin Zexu", ["Li Hongzhang", "Zeng Guofan", "Qishan"]],
    ["Which Japanese domain, allied with Choshu, led the movement that toppled the shogunate in 1868?", "Satsuma", ["Tosa", "Hizen", "Aizu"]],
  ]),
  // day 7
  day([
    ["What title did the military rulers who governed Japan in the emperor's name hold?", "Shogun", ["Daimyo", "Samurai", "Mikado"]],
    ["Under what name did France rule the Caribbean colony that became Haiti in 1804?", "Saint-Domingue", ["Martinique", "Guadeloupe", "Louisiana"]],
    ["Which British member of Parliament led the campaign that ended the British slave trade in 1807?", "William Wilberforce", ["Thomas Clarkson", "Granville Sharp", "Charles James Fox"]],
    ["Which Habsburg emperor issued the 1781 Patent of Toleration?", "Joseph II", ["Leopold II", "Francis II", "Charles VI"]],
    ["Which Mughal emperor received England's first royal ambassador, Sir Thomas Roe, from 1615 to 1619?", "Jahangir", ["Akbar", "Shah Jahan", "Aurangzeb"]],
  ]),
  // day 8
  day([
    ["Which seventh US president was nicknamed 'Old Hickory'?", "Andrew Jackson", ["James Polk", "Zachary Taylor", "William Henry Harrison"]],
    ["Which country did the British settle as a penal colony after losing the thirteen American colonies?", "Australia", ["Canada", "South Africa", "Ireland"]],
    ["Which king of Piedmont-Sardinia became the first king of a united Italy in 1861?", "Victor Emmanuel II", ["Umberto I", "Charles Albert", "Victor Emmanuel III"]],
    ["Which British prime minister repealed the Corn Laws in 1846, splitting his own Conservative Party?", "Robert Peel", ["Benjamin Disraeli", "Lord Melbourne", "Lord Palmerston"]],
    ["Which Ottoman reformist group forced the sultan to restore the suspended constitution in 1908?", "The Young Turks", ["The Young Ottomans", "The Janissaries", "The Sublime Porte"]],
  ]),
  // day 9
  day([
    ["Which empire, ruled by sultans from Istanbul, controlled the Balkans, Anatolia and much of the Middle East for centuries?", "The Ottoman Empire", ["The Persian Empire", "The Mughal Empire", "The Byzantine Empire"]],
    ["Which French phrase names the social and political order of France before the Revolution of 1789?", "Ancien Regime", ["Belle Epoque", "Fin de Siecle", "Grand Siecle"]],
    ["Which 1820 deal admitted Maine as a free state and drew a line across the West on slavery?", "The Missouri Compromise", ["The Compromise of 1850", "The Kansas-Nebraska Act", "The Wilmot Proviso"]],
    ["Which governor-general's 'doctrine of lapse' annexed Indian states that lacked a natural heir?", "Lord Dalhousie", ["Lord Canning", "Lord Cornwallis", "Lord Wellesley"]],
    ["Which Persian dynasty ruled from Tehran from the late 18th century until 1925?", "The Qajars", ["The Safavids", "The Afsharids", "The Zands"]],
  ]),
  // day 10
  day([
    ["Which Native American nation was forced west from Georgia on the Trail of Tears?", "The Cherokee", ["The Sioux", "The Apache", "The Iroquois"]],
    ["Which German city hosted the 1521 Diet at which Martin Luther refused to recant?", "Worms", ["Augsburg", "Speyer", "Nuremberg"]],
    ["Which Portuguese chief minister rebuilt Lisbon after 1755 and expelled the Jesuits in 1759?", "The Marquis of Pombal", ["The Duke of Braganza", "The Count of Vimioso", "The Marquis of Alorna"]],
    ["Which Russian finance minister drove the building of the Trans-Siberian Railway in the 1890s?", "Sergei Witte", ["Pyotr Stolypin", "Konstantin Pobedonostsev", "Mikhail Reutern"]],
    ["Which Venezuelan forerunner of independence, a veteran of the French Revolutionary army, designed the flag later used by Venezuela?", "Francisco de Miranda", ["Antonio Jose de Sucre", "Jose Antonio Paez", "Manuel Piar"]],
  ]),
  // day 11
  day([
    ["Which British queen also became Empress of India in the 1870s?", "Victoria", ["Alexandra", "Mary", "Adelaide"]],
    ["Which French king's 1791 flight with his family was stopped at Varennes?", "Louis XVI", ["Louis XVIII", "Charles X", "Louis XV"]],
    ["Which Habsburg emperor reigned over Austria from 1848 until 1916?", "Franz Joseph I", ["Ferdinand I", "Francis II", "Charles I"]],
    ["Which statesman became the first Prime Minister of Japan in 1885?", "Ito Hirobumi", ["Okubo Toshimichi", "Yamagata Aritomo", "Okuma Shigenobu"]],
    ["Which 1784 act placed the East India Company under a Board of Control in London?", "Pitt's India Act", ["The Regulating Act", "The Charter Act of 1813", "The Government of India Act"]],
  ]),
  // day 12
  day([
    ["What were the Spanish soldiers and adventurers who conquered much of the Americas in the 1500s called?", "Conquistadors", ["Crusaders", "Privateers", "Musketeers"]],
    ["Whose return to the English throne in 1660 ended the Commonwealth?", "Charles II", ["James II", "Charles I", "William III"]],
    ["Which Catholic religious order did Ignatius of Loyola found in 1540?", "The Jesuits", ["The Franciscans", "The Dominicans", "The Capuchins"]],
    ["What name was given to Bismarck's 1870s campaign against the political power of the Catholic Church?", "The Kulturkampf", ["The Realpolitik", "The Sonderweg", "The Gleichschaltung"]],
    ["Which lawyer became governor-president of revolutionary Hungary in 1849?", "Lajos Kossuth", ["Istvan Szechenyi", "Ferenc Deak", "Sandor Petofi"]],
  ]),
  // day 13
  day([
    ["Who was the first First Lady of the United States?", "Martha Washington", ["Abigail Adams", "Dolley Madison", "Martha Jefferson"]],
    ["What nickname was given to Otto von Bismarck?", "The Iron Chancellor", ["The Old Fox", "The Great Elector", "The Lion of the North"]],
    ["Which Spanish viceroyalty, governed from Mexico City, stretched over much of North America and the Philippines?", "New Spain", ["New Granada", "Peru", "Rio de la Plata"]],
    ["Which French minister published the 1781 'Compte rendu,' the first public account of royal finances?", "Jacques Necker", ["Anne Robert Turgot", "Charles Alexandre de Calonne", "Etienne Charles de Lomenie de Brienne"]],
    ["Which Thai king, ruling from 1868 to 1910, abolished slavery and kept Siam independent?", "Chulalongkorn", ["Mongkut", "Vajiravudh", "Prajadhipok"]],
  ]),
  // day 14
  day([
    ["Which Boston silversmith rode out at night in April 1775 to warn that British troops were coming?", "Paul Revere", ["Samuel Adams", "John Hancock", "Benedict Arnold"]],
    ["Queen Victoria married which German prince in 1840?", "Prince Albert", ["Prince Leopold", "Prince Frederick", "Prince Ernest"]],
    ["Which French king, called the 'Citizen King,' was toppled by the revolution of February 1848?", "Louis-Philippe", ["Charles X", "Louis XVIII", "Napoleon III"]],
    ["Which 1867 act of the British Parliament created the Dominion of Canada?", "The British North America Act", ["The Quebec Act", "The Durham Act", "The Statute of Westminster"]],
    ["Which Ottoman sultan suspended the constitution and parliament in 1878 and ruled as an autocrat until 1909?", "Abdul Hamid II", ["Abdulaziz", "Murad V", "Mehmed V"]],
  ]),
  // day 15
  day([
    ["Which American colony did William Penn found as a refuge for Quakers?", "Pennsylvania", ["Maryland", "Rhode Island", "Delaware"]],
    ["Which royal couple are known together as the Catholic Monarchs of Spain?", "Ferdinand and Isabella", ["Philip and Mary", "Charles and Isabella", "Philip and Elizabeth"]],
    ["Which empress dowager effectively controlled the Qing court from 1861 until her death in 1908?", "Cixi", ["Ci'an", "Longyu", "Xiaozhuang"]],
    ["Which governor-general of Bengal was impeached by Parliament in a trial that ran from 1788 to 1795?", "Warren Hastings", ["Robert Clive", "Lord Cornwallis", "Lord Wellesley"]],
    ["Which Spanish viceroyalty, created in 1776, was governed from Buenos Aires?", "The Viceroyalty of the Rio de la Plata", ["The Viceroyalty of New Granada", "The Viceroyalty of Peru", "The Viceroyalty of New Spain"]],
  ]),
  // day 16
  day([
    ["The 1621 harvest feast shared by the Plymouth colonists and the Wampanoag is often called the first what?", "Thanksgiving", ["Christmas", "Independence Day", "Harvest Home"]],
    ["Pocahontas was the daughter of which paramount chief of the Virginia tribes?", "Powhatan", ["Massasoit", "Metacom", "Opechancanough"]],
    ["Which Russian tsar emancipated the serfs in 1861?", "Alexander II", ["Nicholas I", "Alexander III", "Nicholas II"]],
    ["What was the personal name of the emperor whose reign, from 1867 to 1912, is known as the Meiji era?", "Mutsuhito", ["Yoshihito", "Hirohito", "Osahito"]],
    ["Which Sikh ruler, called the Lion of the Punjab, took Lahore in 1799 and built an empire around it?", "Ranjit Singh", ["Kharak Singh", "Hari Singh Nalwa", "Duleep Singh"]],
  ]),
  // day 17
  day([
    ["What were the Spanish religious outposts built along the California coast, from San Diego to Sonoma, called?", "Missions", ["Castles", "Pagodas", "Cathedrals"]],
    ["Which Puritan colony was founded around Boston in 1630 under John Winthrop?", "Massachusetts Bay Colony", ["Plymouth Colony", "Connecticut Colony", "New Haven Colony"]],
    ["Which Mexican officer had himself crowned emperor in 1822, a year after independence?", "Agustin de Iturbide", ["Antonio Lopez de Santa Anna", "Guadalupe Victoria", "Vicente Guerrero"]],
    ["Which sickly Spanish king died childless in 1700, the last of the Spanish Habsburgs?", "Charles II", ["Philip IV", "Philip V", "Ferdinand VI"]],
    ["Which Ethiopian emperor, reigning from 1889 to 1913, made the newly founded Addis Ababa his capital?", "Menelik II", ["Tewodros II", "Yohannes IV", "Haile Selassie"]],
  ]),
  // day 18
  day([
    ["What name is usually given to direct British Crown rule over India from 1858?", "The Raj", ["The Sultanate", "The Mandate", "The Protectorate"]],
    ["Which 1830 law authorized the forced relocation of Southeastern tribes to lands west of the Mississippi?", "The Indian Removal Act", ["The Dawes Act", "The Homestead Act", "The Northwest Ordinance"]],
    ["Queen Victoria was the last British monarch of which royal house?", "Hanover", ["Stuart", "Windsor", "Tudor"]],
    ["Which Dutch commander founded a supply station at the Cape of Good Hope in 1652?", "Jan van Riebeeck", ["Simon van der Stel", "Pieter Both", "Abel Tasman"]],
    ["Which Safavid shah moved the Persian capital to Isfahan in the late 1590s?", "Abbas I", ["Ismail I", "Tahmasp I", "Safi"]],
  ]),
  // day 19
  day([
    ["In which country did Martin Luther launch the Protestant Reformation?", "Germany", ["Switzerland", "England", "The Netherlands"]],
    ["Which secret society of American patriots organized protests against the Stamp Act and British taxes?", "The Sons of Liberty", ["The Minutemen", "The Green Mountain Boys", "The Loyalists"]],
    ["Which 1854 law let settlers in two new territories decide the question of slavery by popular sovereignty?", "The Kansas-Nebraska Act", ["The Missouri Compromise", "The Compromise of 1850", "The Wilmot Proviso"]],
    ["Which Siamese king, portrayed in 'The King and I,' ruled from 1851 to 1868?", "Mongkut", ["Chulalongkorn", "Rama III", "Pinklao"]],
    ["Which Korean dynasty ruled from 1392 until Japan annexed the country in 1910?", "Joseon", ["Goryeo", "Silla", "Baekje"]],
  ]),
  // day 20
  day([
    ["Which European nation's colonists founded New Amsterdam on Manhattan in the 1620s?", "The Netherlands", ["England", "Sweden", "France"]],
    ["Which German kingdom, ruled by the Hohenzollerns, led the unification of Germany?", "Prussia", ["Bavaria", "Saxony", "Austria"]],
    ["Which reformer translated the New Testament into German while sheltering at Wartburg Castle?", "Martin Luther", ["Philip Melanchthon", "Huldrych Zwingli", "William Tyndale"]],
    ["Which Chinese reformer led the failed Hundred Days' Reform of 1898?", "Kang Youwei", ["Liang Qichao", "Sun Yat-sen", "Yuan Shikai"]],
    ["Which Portuguese commander took Goa in 1510 and made it the center of Portugal's Asian empire?", "Afonso de Albuquerque", ["Francisco de Almeida", "Tristao da Cunha", "Nuno da Cunha"]],
  ]),
  // day 21
  day([
    ["What name did Spanish explorers give to a legendary city or kingdom of gold in South America?", "El Dorado", ["Atlantis", "Shangri-La", "Avalon"]],
    ["Which city did Brigham Young's Mormon pioneers found in 1847?", "Salt Lake City", ["Provo", "Denver", "Boise"]],
    ["Which Spanish king, son of Charles V, reigned from 1556 to 1598 and was married to England's Mary I?", "Philip II", ["Philip III", "Ferdinand I", "Charles II"]],
    ["Which clergyman's 1789 pamphlet 'What Is the Third Estate?' argued that the commoners were the true nation?", "Abbe Sieyes", ["Camille Desmoulins", "Jean-Paul Marat", "Jacques Pierre Brissot"]],
    ["Which French politician's 1848 decree abolished slavery in France's colonies?", "Victor Schoelcher", ["Alexis de Tocqueville", "Alphonse de Lamartine", "Louis Blanc"]],
  ]),
  // day 22
  day([
    ["What were the large estates of the American South, worked by enslaved people, called?", "Plantations", ["Ranches", "Homesteads", "Orchards"]],
    ["Which Tudor king was the only legitimate son of Henry VIII to survive infancy?", "Edward VI", ["Arthur", "James I", "Edward IV"]],
    ["Which Founding Father served as Washington's first Secretary of State?", "Thomas Jefferson", ["John Jay", "Edmund Randolph", "Alexander Hamilton"]],
    ["Which 1679 English statute protected subjects against imprisonment without lawful cause?", "The Habeas Corpus Act", ["The Test Act", "The Toleration Act", "The Bill of Rights"]],
    ["Which assembly, meeting in St. Paul's Church in 1848 and 1849, offered an imperial German crown to Frederick William IV?", "The Frankfurt Parliament", ["The Reichstag", "The Erfurt Union Parliament", "The Federal Diet"]],
  ]),
  // day 23
  day([
    ["From which country did the Mayflower set sail in 1620?", "England", ["The Netherlands", "Spain", "France"]],
    ["Which body of delegates from the colonies first met in Philadelphia in 1774?", "The Continental Congress", ["The Constitutional Convention", "The Albany Congress", "The Stamp Act Congress"]],
    ["What name is given to the 19th-century movement for the unification of Italy?", "The Risorgimento", ["The Rinascimento", "The Irredenta", "The Trasformismo"]],
    ["Which 1871 Japanese embassy toured the United States and Europe to study modern states?", "The Iwakura Mission", ["The Perry Expedition", "The Tensho Embassy", "The Keicho Embassy"]],
    ["Which 1824 treaty swapped Bencoolen for Malacca, splitting the Malay world between two European powers?", "The Anglo-Dutch Treaty", ["The Treaty of Pangkor", "The Burney Treaty", "The Treaty of Breda"]],
  ]),
  // day 24
  day([
    ["Josephine de Beauharnais was the first wife of which French emperor?", "Napoleon Bonaparte", ["Louis XVI", "Charles X", "Napoleon III"]],
    ["Which French navigator sailed up the St. Lawrence River in 1535 and helped give Canada its name?", "Jacques Cartier", ["Samuel de Champlain", "Rene-Robert de La Salle", "Jacques Marquette"]],
    ["Which Virginian moved the June 1776 resolution that the colonies ought to be free and independent states?", "Richard Henry Lee", ["Patrick Henry", "George Mason", "Edmund Randolph"]],
    ["Which British prime minister bought Egypt's shares in the Suez Canal Company in 1875?", "Benjamin Disraeli", ["William Gladstone", "Lord Salisbury", "Lord Palmerston"]],
    ["Which Mughal emperor's exile to Rangoon in 1858 ended the dynasty?", "Bahadur Shah II", ["Akbar II", "Shah Alam II", "Muhammad Shah"]],
  ]),
  // day 25
  day([
    ["What name was given to the militant British campaigners for votes for women in the early 1900s?", "Suffragettes", ["Bluestockings", "Flappers", "Abolitionists"]],
    ["Which reformer co-founded the National Woman Suffrage Association with Elizabeth Cady Stanton in 1869?", "Susan B. Anthony", ["Lucretia Mott", "Lucy Stone", "Julia Ward Howe"]],
    ["Which US territory became the first to grant women the vote, in 1869?", "Wyoming", ["Utah", "Colorado", "Idaho"]],
    ["Which Chinese statesman led the Self-Strengthening Movement and signed the 1895 Treaty of Shimonoseki?", "Li Hongzhang", ["Zeng Guofan", "Zuo Zongtang", "Prince Gong"]],
    ["By what name is Sultan Mahmud II's 1826 destruction of the Janissary corps known in Ottoman history?", "The Auspicious Incident", ["The Tulip Period", "The Edirne Event", "The Nizam-i Cedid"]],
  ]),
  // day 26
  day([
    ["Which continent did 17th-century Dutch explorers call New Holland?", "Australia", ["Antarctica", "Africa", "South America"]],
    ["Which warlord became shogun in 1603 and founded a line of shoguns that ruled until 1868?", "Tokugawa Ieyasu", ["Oda Nobunaga", "Toyotomi Hideyoshi", "Minamoto no Yoritomo"]],
    ["Which Cuban poet and patriot, killed in 1895, is honored as the national hero of Cuba's independence?", "Jose Marti", ["Antonio Maceo", "Carlos Manuel de Cespedes", "Maximo Gomez"]],
    ["Which British envoy's 1793 mission to the Qianlong Emperor failed to open China to wider trade?", "Lord Macartney", ["Lord Amherst", "Lord Elgin", "Lord Napier"]],
    ["Which Christian king of Kongo wrote to Portugal's king in 1526 protesting the slave trade in his realm?", "Afonso I", ["Garcia II", "Alvaro I", "Antonio I"]],
  ]),
  // day 27
  day([
    ["In which city did the radical government known as the Commune rule for about two months in 1871?", "Paris", ["Lyon", "Marseille", "Bordeaux"]],
    ["Which prince declared Brazil's independence from Portugal in 1822 and became its first emperor?", "Pedro I", ["Pedro II", "John VI", "Miguel I"]],
    ["Which nephew of the first French emperor was elected president in 1848 and proclaimed himself emperor in 1852?", "Napoleon III", ["Louis-Philippe", "Charles X", "Jerome Bonaparte"]],
    ["Which Filipino writer and reformer, executed by the Spanish in 1896, is the national hero of the Philippines?", "Jose Rizal", ["Emilio Aguinaldo", "Andres Bonifacio", "Apolinario Mabini"]],
    ["Which Fulani scholar founded the Sokoto Caliphate in the early 1800s?", "Usman dan Fodio", ["Muhammad Bello", "El Hadj Umar Tall", "Samori Ture"]],
  ]),
  // day 28
  day([
    ["Which Italian city became the capital of the Kingdom of Italy in 1871?", "Rome", ["Florence", "Turin", "Milan"]],
    ["What name is given to the period after the American Civil War when the federal government oversaw the South?", "Reconstruction", ["Redemption", "The Restoration", "The Gilded Age"]],
    ["What were the territorial lords who ruled the domains of Tokugawa Japan called?", "Daimyo", ["Ronin", "Shogun", "Samurai"]],
    ["Which abolitionist published the antislavery newspaper The Liberator from 1831?", "William Lloyd Garrison", ["Frederick Douglass", "Wendell Phillips", "Theodore Weld"]],
    ["Which Basotho king placed his people under British protection in 1868 to save his mountain kingdom?", "Moshoeshoe I", ["Letsie I", "Cetshwayo", "Khama III"]],
  ]),
  // day 29
  day([
    ["Which European empire was ruled from Vienna by the Habsburgs in the 19th century?", "The Austrian Empire", ["The German Empire", "The Ottoman Empire", "The Russian Empire"]],
    ["Which empress, nicknamed Sisi, was the wife of Emperor Franz Joseph?", "Elisabeth of Bavaria", ["Maria Theresa", "Sophie of Bavaria", "Zita of Bourbon-Parma"]],
    ["Which 1857 Supreme Court decision held that Black Americans could not be citizens of the United States?", "Dred Scott v. Sandford", ["Plessy v. Ferguson", "Prigg v. Pennsylvania", "Marbury v. Madison"]],
    ["Which American consul negotiated the 1858 commercial treaty that opened more Japanese ports to trade?", "Townsend Harris", ["Matthew Perry", "William Seward", "James Biddle"]],
    ["Which king, elected in 1523 after Sweden broke away from the Kalmar Union, founded the modern Swedish state?", "Gustav Vasa", ["Gustavus Adolphus", "Christian II", "Charles IX"]],
  ]),
  // day 30
  day([
    ["The Congo Free State, founded in 1885, was the personal possession of the king of which European country?", "Belgium", ["The Netherlands", "France", "Germany"]],
    ["Which boy emperor's abdication in 1912 ended imperial rule in China?", "Puyi", ["Guangxu", "Tongzhi", "Xianfeng"]],
    ["Which royal house fled from Lisbon to Brazil in 1807, making Rio de Janeiro the seat of the Portuguese empire?", "The House of Braganza", ["The House of Aviz", "The House of Bourbon", "The House of Savoy"]],
    ["Which Bengali reformer founded the Brahmo Samaj in 1828 and campaigned against sati?", "Ram Mohan Roy", ["Dayananda Saraswati", "Ishwar Chandra Vidyasagar", "Keshub Chandra Sen"]],
    ["Which 1819 decrees, pushed by Metternich, censored the press and policed the German universities?", "The Carlsbad Decrees", ["The Troppau Protocol", "The Vienna Final Act", "The Laibach Decrees"]],
  ]),
  // day 31
  day([
    ["What were the Dutch-speaking farmers of South Africa called?", "Boers", ["Cossacks", "Gauchos", "Yeomen"]],
    ["Which Mexican president, a Zapotec lawyer, led the liberal Reform of the 1850s and 1860s?", "Benito Juarez", ["Porfirio Diaz", "Ignacio Comonfort", "Miguel Lerdo de Tejada"]],
    ["Who became Britain's youngest prime minister in 1783, at the age of 24?", "William Pitt the Younger", ["Lord North", "Lord Liverpool", "Charles James Fox"]],
    ["Which reformer founded Hull House, the Chicago settlement house, in 1889?", "Jane Addams", ["Lillian Wald", "Frances Willard", "Florence Kelley"]],
    ["Which playwright wrote the 1791 'Declaration of the Rights of Woman and of the Female Citizen'?", "Olympe de Gouges", ["Madame Roland", "Charlotte Corday", "Theroigne de Mericourt"]],
  ]),
  // day 32
  day([
    ["What name was given to colonists who stayed faithful to the British Crown during the American Revolution?", "Loyalists", ["Patriots", "Federalists", "Jacobites"]],
    ["Which English colony was named for Queen Henrietta Maria, wife of Charles I?", "Maryland", ["Virginia", "Carolina", "Georgia"]],
    ["What braided hairstyle did the Qing require Han Chinese men to wear as a sign of submission?", "The queue", ["The topknot", "The chignon", "The cornrow"]],
    ["Which political party, founded in 1885, later led India's independence movement?", "The Indian National Congress", ["The Muslim League", "The Swaraj Party", "The Ghadar Party"]],
    ["Which Parsi reformer, called the Grand Old Man of India, became the first Asian elected to the British Parliament in 1892?", "Dadabhai Naoroji", ["Gopal Krishna Gokhale", "Pherozeshah Mehta", "Mancherjee Bhownaggree"]],
  ]),
  // day 33
  day([
    ["In 1914, which country ruled the largest empire in the world?", "Britain", ["France", "Russia", "Germany"]],
    ["What name is given to the 1830s migration of Boer farmers inland from the Cape Colony?", "The Great Trek", ["The Long March", "The Great Migration", "The Boer Exodus"]],
    ["Which Afrikaner leader was president of the South African Republic (Transvaal) from 1883 to 1900?", "Paul Kruger", ["Marthinus Pretorius", "Louis Botha", "Jan Smuts"]],
    ["Which 1848 treaty transferred California and the Southwest from Mexico to the United States?", "The Treaty of Guadalupe Hidalgo", ["The Gadsden Purchase", "The Adams-Onis Treaty", "The Treaty of Velasco"]],
    ["Which 1793 Bengal land-revenue arrangement, made under Lord Cornwallis, fixed what the zamindars owed forever?", "The Permanent Settlement", ["The Ryotwari System", "The Mahalwari System", "The Subsidiary Alliance"]],
  ]),
  // day 34
  day([
    ["Which future president, according to a famous legend, confessed to chopping down his father's cherry tree?", "George Washington", ["Abraham Lincoln", "Thomas Jefferson", "Benjamin Franklin"]],
    ["Which royal house ruled England, and later Great Britain, from 1603 to 1714?", "The Stuarts", ["The Tudors", "The Hanoverians", "The Plantagenets"]],
    ["Which Mexican president ruled, with one short break, from 1876 until he was forced out in 1911?", "Porfirio Diaz", ["Francisco Madero", "Sebastian Lerdo de Tejada", "Victoriano Huerta"]],
    ["Which Chancellor of the Exchequer introduced the 1909 'People's Budget'?", "David Lloyd George", ["Herbert Asquith", "Winston Churchill", "Austen Chamberlain"]],
    ["Which Dutch leader, assassinated in 1584, headed the revolt of the Netherlands against Philip II?", "William the Silent", ["Maurice of Nassau", "Johan van Oldenbarnevelt", "Lamoral of Egmont"]],
  ]),
  // day 35
  day([
    ["Which European nation ruled Vietnam, Cambodia and Laos as Indochina?", "France", ["Britain", "The Netherlands", "Portugal"]],
    ["Which Founding Father published 'Poor Richard's Almanack'?", "Benjamin Franklin", ["John Adams", "Samuel Adams", "John Hancock"]],
    ["Which British working-class movement presented the 'People's Charter' to Parliament from 1838?", "The Chartists", ["The Luddites", "The Levellers", "The Diggers"]],
    ["Which German emperor dismissed Otto von Bismarck as chancellor in 1890?", "Wilhelm II", ["Frederick III", "Wilhelm I", "Ludwig II"]],
    ["Which Ottoman statesman led the drafting of the empire's first constitution in 1876?", "Midhat Pasha", ["Fuad Pasha", "Mustafa Reshid Pasha", "Ali Pasha"]],
  ]),
  // day 36
  day([
    ["Which German title, derived from 'Caesar,' did the emperors of the German Empire carry?", "Kaiser", ["Tsar", "Shah", "Doge"]],
    ["Which Indian Ocean island did France annex as a colony in 1896, later exiling its queen Ranavalona III?", "Madagascar", ["Mauritius", "Zanzibar", "Sri Lanka"]],
    ["Which country's 1910 revolution overthrew its monarchy and sent King Manuel II into exile?", "Portugal", ["Spain", "Italy", "Greece"]],
    ["Which Russian prime minister's land reforms from 1906 aimed to create a class of independent peasant farmers?", "Pyotr Stolypin", ["Sergei Witte", "Vyacheslav von Plehve", "Ivan Goremykin"]],
    ["Which Japanese educator founded Keio University and wrote 'An Encouragement of Learning'?", "Fukuzawa Yukichi", ["Mori Arinori", "Nishi Amane", "Niijima Jo"]],
  ]),
  // day 37
  day([
    ["The title 'Shah' was used by the rulers of which country, now known as Iran?", "Persia", ["India", "Egypt", "Turkey"]],
    ["Which wife of Henry VIII was the mother of Elizabeth I?", "Anne Boleyn", ["Catherine of Aragon", "Jane Seymour", "Catherine Howard"]],
    ["Which cardinal, Henry VIII's chief minister, fell from power in 1529 after failing to secure the king's annulment?", "Thomas Wolsey", ["Thomas Cranmer", "Thomas Cromwell", "Reginald Pole"]],
    ["Which 1534 law made the English monarch Supreme Head of the Church of England?", "The Act of Supremacy", ["The Act of Uniformity", "The Act in Restraint of Appeals", "The Act of Six Articles"]],
    ["Which arrangement of 1559 restored a Protestant Church of England after the reign of Mary I?", "The Elizabethan Religious Settlement", ["The Millenary Petition", "The Hampton Court Conference", "The Bishops' Book"]],
  ]),
  // day 38
  day([
    ["Which US president was nicknamed 'Honest Abe'?", "Abraham Lincoln", ["Andrew Jackson", "Ulysses S. Grant", "Zachary Taylor"]],
    ["What was the first governing charter of the United States, in force from 1781 until 1789?", "The Articles of Confederation", ["The Declaration of Independence", "The Bill of Rights", "The Federalist Papers"]],
    ["Which 1850 package of laws admitted California as a free state and toughened the fugitive slave law?", "The Compromise of 1850", ["The Missouri Compromise", "The Kansas-Nebraska Act", "The Crittenden Compromise"]],
    ["In which Andalusian port city did the Spanish Cortes proclaim the liberal constitution of 1812?", "Cadiz", ["Seville", "Malaga", "Granada"]],
    ["Which Bavarian prince became the first king of independent Greece in 1832?", "Otto", ["George I", "Constantine I", "Leopold of Saxe-Coburg"]],
  ]),
  // day 39
  day([
    ["Which Virginia city served as the capital of the Confederacy for most of the Civil War?", "Richmond", ["Norfolk", "Petersburg", "Alexandria"]],
    ["Which frontiersman blazed the Wilderness Road through the Cumberland Gap into Kentucky in 1775?", "Daniel Boone", ["Davy Crockett", "Kit Carson", "Jim Bowie"]],
    ["Which 1896 Supreme Court case upheld racial segregation under the doctrine of 'separate but equal'?", "Plessy v. Ferguson", ["Dred Scott v. Sandford", "Brown v. Board of Education", "Cumming v. Richmond County"]],
    ["Which 1882 US law suspended immigration by laborers from one Asian country for ten years?", "The Chinese Exclusion Act", ["The Page Act", "The Burlingame Treaty", "The Geary Act"]],
    ["Which Paraguayan dictator, called 'El Supremo,' sealed his country off from the outside world from 1814 to 1840?", "Jose Gaspar Rodriguez de Francia", ["Carlos Antonio Lopez", "Francisco Solano Lopez", "Juan Manuel de Rosas"]],
  ]),
  // day 40
  day([
    ["Which Pacific island kingdom, its queen deposed in 1893, was annexed by the United States in 1898?", "Hawaii", ["Fiji", "Samoa", "Tahiti"]],
    ["Which Spanish princess was the first wife of Henry VIII?", "Catherine of Aragon", ["Anne of Cleves", "Catherine Parr", "Jane Seymour"]],
    ["Who became the first Prime Minister of Canada in 1867?", "John A. Macdonald", ["George-Etienne Cartier", "Alexander Mackenzie", "George Brown"]],
    ["Which 1685 French decree set out the rules governing enslaved people in the colonies?", "The Code Noir", ["The Edict of Fontainebleau", "The Ordinance of Blois", "The Pragmatic Sanction"]],
    ["Which Cape Colony prime minister and diamond magnate dreamed of a British railway from the Cape to Cairo?", "Cecil Rhodes", ["Alfred Beit", "Barney Barnato", "Leander Starr Jameson"]],
  ]),
  // day 41
  day([
    ["What do historians call a monarch, such as Louis XIV, who claims unlimited power over the state?", "An absolute monarch", ["A constitutional monarch", "A prime minister", "A consul"]],
    ["Which king ruled England when the Pilgrims sailed in 1620?", "James I", ["Charles I", "Elizabeth I", "Henry VIII"]],
    ["Which English colony did James Oglethorpe receive a charter for in 1732, partly as a refuge for debtors?", "Georgia", ["Carolina", "Maryland", "Delaware"]],
    ["Which 1774 British act enlarged the former New France and protected its French civil law and Catholic worship?", "The Quebec Act", ["The Proclamation of 1763", "The Constitutional Act of 1791", "The Act of Union of 1840"]],
    ["What was Peter the Great's 1722 system that graded civil, military and court officials into fourteen grades called?", "The Table of Ranks", ["The Code of Laws", "The Boyar Duma", "The Oprichnina"]],
  ]),
  // day 42
  day([
    ["What name did the followers of Martin Luther's teaching come to be known by?", "Lutherans", ["Calvinists", "Anglicans", "Methodists"]],
    ["From which country did the United States acquire Florida by treaty in 1819?", "Spain", ["France", "Britain", "Mexico"]],
    ["Which reformer led the Reformation in Zurich from 1519?", "Huldrych Zwingli", ["John Calvin", "Martin Bucer", "Heinrich Bullinger"]],
    ["Which 1795 event wiped Poland off the map of Europe until 1918?", "The Third Partition", ["The First Partition", "The Second Partition", "The Treaty of Tilsit"]],
    ["Which preacher allied with Muhammad ibn Saud at Diriyah in 1744, laying the foundation of the first Saudi state?", "Muhammad ibn Abd al-Wahhab", ["Jamal al-Din al-Afghani", "Muhammad Abduh", "Ahmad ibn Idris"]],
  ]),
  // day 43
  day([
    ["What was a peasant bound to work a lord's land in Russia until 1861 called?", "A serf", ["A knight", "A merchant", "A monk"]],
    ["Which Berlin building, opened in 1894, housed the parliament of the German Empire?", "The Reichstag", ["The Bundesrat", "The Landtag", "The Paulskirche"]],
    ["Which centuries-old empire was formally dissolved in 1806, after Francis II gave up its crown?", "The Holy Roman Empire", ["The Byzantine Empire", "The Mughal Empire", "The Spanish Empire"]],
    ["Which Russian revolutionary group assassinated Tsar Alexander II in 1881?", "The People's Will", ["The Decembrists", "The Black Hundreds", "The Mensheviks"]],
    ["Which Ottoman commander of Albanian descent founded the dynasty that ruled Egypt from 1805 until 1952?", "Muhammad Ali Pasha", ["Ibrahim Pasha", "Ismail Pasha", "Abbas Hilmi"]],
  ]),
  // day 44
  day([
    ["Which dynasty ruled China from 1644 to 1912?", "The Qing", ["The Ming", "The Song", "The Han"]],
    ["Which US president was assassinated in 1881, only months after taking office?", "James Garfield", ["William McKinley", "Chester Arthur", "Rutherford Hayes"]],
    ["Which educator founded the Tuskegee Institute in Alabama in 1881?", "Booker T. Washington", ["George Washington Carver", "W. E. B. Du Bois", "Frederick Douglass"]],
    ["Which 1887 US law broke up tribal lands into individual allotments?", "The Dawes Act", ["The Indian Removal Act", "The Homestead Act", "The Curtis Act"]],
    ["Which Burmese king was deposed and exiled by the British in 1885?", "Thibaw Min", ["Mindon Min", "Bagyidaw", "Bodawpaya"]],
  ]),
  // day 45
  day([
    ["Complete the American colonial slogan: 'No taxation without ...'?", "representation", ["consent", "permission", "a vote"]],
    ["Which scholar co-founded the NAACP in 1909 and edited its magazine, The Crisis?", "W. E. B. Du Bois", ["Booker T. Washington", "Marcus Garvey", "Frederick Douglass"]],
    ["Which Jesuit missionary settled at the Ming court in Beijing in 1601?", "Matteo Ricci", ["Francis Xavier", "Johann Adam Schall von Bell", "Ferdinand Verbiest"]],
    ["Which Maratha leader was crowned Chhatrapati in 1674?", "Shivaji", ["Sambhaji", "Baji Rao I", "Shahu"]],
    ["Which Vietnamese ruler founded the Nguyen dynasty in 1802 and unified the country?", "Gia Long", ["Minh Mang", "Tu Duc", "Quang Trung"]],
  ]),
  // day 46
  day([
    ["Supporters of Manifest Destiny believed the United States should stretch from the Atlantic to which ocean?", "The Pacific", ["The Arctic", "The Indian", "The Southern"]],
    ["What was the 1620 agreement for self-government signed aboard the Pilgrims' ship called?", "The Mayflower Compact", ["The Plymouth Charter", "The Fundamental Orders", "The Body of Liberties"]],
    ["Which revolutionary became provisional president of the Republic of China in January 1912?", "Sun Yat-sen", ["Yuan Shikai", "Kang Youwei", "Song Jiaoren"]],
    ["Which viceroy of India ordered the partition of Bengal in 1905?", "Lord Curzon", ["Lord Minto", "Lord Ripon", "Lord Lytton"]],
    ["Which strongman governed the province of Buenos Aires almost continuously from 1829 to 1852?", "Juan Manuel de Rosas", ["Domingo Sarmiento", "Bernardino Rivadavia", "Justo Jose de Urquiza"]],
  ]),
  // day 47
  day([
    ["How many British colonies declared independence together in 1776?", "13", ["10", "12", "15"]],
    ["Which colony did Roger Williams found in 1636 after he was banished from Massachusetts?", "Rhode Island", ["Connecticut", "New Hampshire", "Delaware"]],
    ["Which 1870 amendment barred denying the vote on account of race or color?", "The Fifteenth Amendment", ["The Fourteenth Amendment", "The Thirteenth Amendment", "The Nineteenth Amendment"]],
    ["Which Irish politician led the Home Rule party in the 1880s?", "Charles Stewart Parnell", ["Isaac Butt", "John Redmond", "Michael Davitt"]],
    ["Which Haitian president agreed in 1825 to pay France a large indemnity in exchange for recognition?", "Jean-Pierre Boyer", ["Alexandre Petion", "Henri Christophe", "Faustin Soulouque"]],
  ]),
  // day 48
  day([
    ["What do historians call the era of European ocean voyages from the 1400s to the 1600s?", "The Age of Exploration", ["The Age of Reason", "The Industrial Age", "The Gilded Age"]],
    ["Which writer edited the French Encyclopedie with Jean d'Alembert?", "Denis Diderot", ["Voltaire", "Montesquieu", "Jean-Jacques Rousseau"]],
    ["What name is given to the reforming style of rule of monarchs such as Frederick the Great and Catherine the Great?", "Enlightened absolutism", ["Divine right", "Constitutional monarchy", "Mercantilism"]],
    ["Which Brazilian emperor reigned from 1831 until a republic was proclaimed in 1889?", "Pedro II", ["Pedro I", "John VI", "Miguel I"]],
    ["What were the feudal domains of Japan, abolished and replaced by prefectures in 1871, called?", "Han", ["Ken", "Bakufu", "Shoen"]],
  ]),
];
