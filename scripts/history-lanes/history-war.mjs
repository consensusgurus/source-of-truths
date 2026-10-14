// History gauntlet, lane 'War & Conflict': wars, battles, campaigns, generals and
// admirals, sieges, famous ships, weapons and military technology, and treaties
// ending wars, antiquity to about 2000. No casualty figures, no ongoing conflicts,
// no contested blame. Authored 2026-10-14; every candidate fact was checked
// against the existing gauntlet banks and the other History lanes first.
const C = 'War & Conflict';
const e = (t, q, a, d) => ({ c: C, t, q, a, d });

export const LANE_DAYS = [
  // day 1
  [
    e(1, 'What was the line of fortifications France built along its border with Germany in the 1930s called?', 'The Maginot Line', ['The Siegfried Line', 'The Hindenburg Line', 'The Mannerheim Line']),
    e(2, 'The bombardment of which Baltimore fort in 1814 inspired the words of the US national anthem?', 'Fort McHenry', ['Fort Sumter', 'Fort Ticonderoga', 'Fort Monroe']),
    e(3, 'At which 331 BC battle did Alexander decisively defeat the Persian king Darius III?', 'Gaugamela', ['Issus', 'Granicus', 'Hydaspes']),
    e(4, 'At which 1645 battle did the New Model Army decisively defeat the royalist army of Charles I?', 'Naseby', ['Marston Moor', 'Edgehill', 'Worcester']),
    e(5, 'Which edited 1870 telegram, released by Bismarck, helped goad France into declaring war on Prussia?', 'The Ems Dispatch', ['The Zimmermann Telegram', 'The Kruger Telegram', 'The Olmutz Note']),
  ],
  // day 2
  [
    e(1, 'What nickname did American colonists give British soldiers, after the color of their uniform coats?', 'Redcoats', ['Bluecoats', 'Greycoats', 'Brownshirts']),
    e(2, 'What were the heavily armed citizen foot soldiers of the ancient Greek city-states called?', 'Hoplites', ['Peltasts', 'Legionaries', 'Janissaries']),
    e(3, 'Which 1600 battle cleared the way for Tokugawa Ieyasu to rule Japan as shogun?', 'Sekigahara', ['Nagashino', 'Okehazama', 'Dan-no-ura']),
    e(4, 'Which US Marine base near the Laotian border was besieged for months in early 1968?', 'Khe Sanh', ['Da Nang', 'Con Thien', 'Pleiku']),
    e(5, 'On which frozen lake did Alexander Nevsky defeat crusading knights in 1242?', 'Lake Peipus', ['Lake Ladoga', 'Lake Onega', 'Lake Ilmen']),
  ],
  // day 3
  [
    e(1, 'What is the curved, single-edged sword of the samurai called?', 'Katana', ['Scimitar', 'Rapier', 'Claymore']),
    e(2, 'What name is given to the centuries-long Christian campaign to retake the Iberian Peninsula from Muslim rule?', 'The Reconquista', ['The Crusades', 'The Inquisition', 'The Risorgimento']),
    e(3, 'Which American inventor patented a hand-cranked, multi-barreled rapid-fire gun in 1862?', 'Richard Gatling', ['Hiram Maxim', 'Samuel Colt', 'John Browning']),
    e(4, 'Which Roman dictator gave his name to the strategy of wearing down Hannibal by avoiding pitched battle?', 'Fabius Maximus', ['Scipio Africanus', 'Marcus Claudius Marcellus', 'Gaius Terentius Varro']),
    e(5, 'Which ruler of the Punjab fought the Macedonian invaders at the Hydaspes River in 326 BC?', 'Porus', ['Chandragupta', 'Ashoka', 'Bindusara']),
  ],
  // day 4
  [
    e(1, 'What were the main units of the Roman army, each several thousand soldiers strong, called?', 'Legions', ['Phalanxes', 'Regiments', 'Hordes']),
    e(2, "What was the name of Nazi Germany's navy?", 'The Kriegsmarine', ['The Luftwaffe', 'The Wehrmacht', 'The Hochseeflotte']),
    e(3, 'Which British general was killed winning the 1759 battle for Quebec on the Plains of Abraham?', 'James Wolfe', ['Jeffery Amherst', 'Edward Braddock', 'John Forbes']),
    e(4, 'In which June 1918 battle near Chateau-Thierry did US Marines fight their way through a hunting forest?', 'Belleau Wood', ['Cantigny', 'Saint-Mihiel', 'Argonne Forest']),
    e(5, 'Which mineral-rich province tried to break away from the newly independent Congo in 1960?', 'Katanga', ['Kivu', 'Cabinda', 'Ituri']),
  ],
  // day 5
  [
    e(1, 'In which war did the Charge of the Light Brigade take place?', 'The Crimean War', ['The Boer War', 'The Napoleonic Wars', 'The Zulu War']),
    e(2, 'Which fort on Lake Champlain did Ethan Allen and the Green Mountain Boys capture in May 1775?', 'Fort Ticonderoga', ['Fort Detroit', 'Fort Niagara', 'Fort Pitt']),
    e(3, 'Where did UN forces under MacArthur make a surprise amphibious landing in September 1950?', 'Inchon', ['Pusan', 'Wonsan', 'Hungnam']),
    e(4, 'Which ruler, called the Tiger of Mysore, was killed defending Seringapatam against the British in 1799?', 'Tipu Sultan', ['Hyder Ali', 'Ranjit Singh', 'Shivaji']),
    e(5, 'At which 1798 battle near Cairo did Napoleon defeat the Mamluk cavalry?', 'Battle of the Pyramids', ['Battle of Aboukir', 'Battle of Heliopolis', 'Battle of Mount Tabor']),
  ],
  // day 6
  [
    e(1, "What was the name of Germany's air force in World War II?", 'The Luftwaffe', ['The Wehrmacht', 'The Kriegsmarine', 'The Panzerwaffe']),
    e(2, 'Which Roman siege weapon used twisted rope springs to shoot heavy bolts, like a giant crossbow?', 'The ballista', ['The trebuchet', 'The onager', 'The battering ram']),
    e(3, 'Which flagship of Henry VIII sank off Portsmouth in 1545 and was raised from the seabed in 1982?', 'Mary Rose', ['Henry Grace a Dieu', 'Golden Hind', 'Revenge']),
    e(4, 'Which May 1942 battle was the first naval clash in which the opposing fleets never sighted each other?', 'Coral Sea', ['Midway', 'Java Sea', 'Savo Island']),
    e(5, 'Which high king of Ireland fell at the Battle of Clontarf in 1014?', 'Brian Boru', ['Mael Sechnaill', 'Sitric Silkbeard', "Rory O'Connor"]),
  ],
  // day 7
  [
    e(1, 'What is a professional soldier who is hired to fight for a foreign army called?', 'A mercenary', ['A conscript', 'A deserter', 'A partisan']),
    e(2, 'Which Japanese island was the scene of the last great land battle of the Pacific war, from April to June 1945?', 'Okinawa', ['Iwo Jima', 'Saipan', 'Guam']),
    e(3, 'Which military order was crushed by a Polish and Lithuanian army at Grunwald in 1410?', 'The Teutonic Knights', ['The Knights Templar', 'The Knights Hospitaller', 'The Order of Santiago']),
    e(4, 'Which Byzantine emperor earned the nickname Bulgar Slayer for his long war against Bulgaria?', 'Basil II', ['Justinian I', 'Heraclius', 'Alexios I Komnenos']),
    e(5, 'At which 42 BC battle in Macedonia were the armies of Brutus and Cassius defeated?', 'Philippi', ['Pharsalus', 'Actium', 'Munda']),
  ],
  // day 8
  [
    e(1, 'Which explosive, first made in China, transformed warfare once it was used in guns and cannon?', 'Gunpowder', ['Dynamite', 'Nitroglycerin', 'TNT']),
    e(2, 'What were the German soldiers hired by Britain to fight in the American Revolution commonly called?', 'Hessians', ['Prussians', 'Bavarians', 'Saxons']),
    e(3, 'Which 1954 siege in northern Vietnam ended French rule in Indochina?', 'Dien Bien Phu', ['Khe Sanh', 'Hue', 'Da Nang']),
    e(4, "By what nickname was the British Army's Land Pattern musket known?", 'Brown Bess', ['Long Tom', 'Old Betsy', 'Black Bess']),
    e(5, 'Which Russian general gave his name to the successful 1916 offensive against Austria-Hungary?', 'Aleksei Brusilov', ['Alexander Samsonov', 'Paul von Rennenkampf', 'Lavr Kornilov']),
  ],
  // day 9
  [
    e(1, 'What was the unofficial pause in fighting along parts of the Western Front in December 1914 called?', 'The Christmas truce', ['The Phony War', 'The Armistice', 'The Peace of Flanders']),
    e(2, 'By what nickname is Edward of Woodstock, victor at Poitiers in 1356, best known?', 'The Black Prince', ['The Lionheart', 'The Young King', 'The Confessor']),
    e(3, 'Which April 1862 battle in Tennessee took its name from a log meetinghouse on the field?', 'Shiloh', ['Stones River', 'Chickamauga', 'Franklin']),
    e(4, 'In 1932, Australian army machine gunners were sent to cull which large flightless birds raiding Western Australian wheat farms?', 'Emus', ['Cassowaries', 'Ostriches', 'Rheas']),
    e(5, 'Which Ming loyalist commander drove the Dutch out of Taiwan in 1662?', 'Koxinga', ['Wu Sangui', 'Shi Lang', 'Zheng He']),
  ],
  // day 10
  [
    e(1, 'By what title is Arthur Wellesley, nicknamed the Iron Duke, usually known?', 'The Duke of Wellington', ['The Duke of Marlborough', 'The Duke of Cumberland', 'The Duke of York']),
    e(2, "Which Mitsubishi fighter was the Japanese navy's main carrier plane at the start of the Pacific war?", 'The Zero', ['The Oscar', 'The Hellcat', 'The Stuka']),
    e(3, 'What was the Roman formation in which soldiers locked shields over their heads and to the front, named for the tortoise?', 'Testudo', ['Phalanx', 'Cuneus', 'Orbis']),
    e(4, 'At which 636 battle did Arab Muslim armies defeat the Byzantines and win control of Syria?', 'Yarmouk', ['Qadisiyyah', 'Nahavand', 'Ajnadayn']),
    e(5, "Which 1453 battle in Gascony is usually counted as the final clash of the Hundred Years' War?", 'Castillon', ['Formigny', 'Patay', 'Verneuil']),
  ],
  // day 11
  [
    e(1, 'What were the German submarines of both world wars commonly called?', 'U-boats', ['E-boats', 'Dreadnoughts', 'Zeppelins']),
    e(2, 'Which Mexican general and president was taken prisoner after his defeat at San Jacinto in 1836?', 'Antonio Lopez de Santa Anna', ['Agustin de Iturbide', 'Porfirio Diaz', 'Mariano Arista']),
    e(3, 'Which founder of the Mughal dynasty won the First Battle of Panipat in 1526?', 'Babur', ['Akbar', 'Humayun', 'Aurangzeb']),
    e(4, 'Which 1588 battle off the Flemish coast was the main fleet action between the English and the Armada?', 'Gravelines', ['Dunkirk', 'Ostend', 'Sluys']),
    e(5, "Which Assyrian king's siege of the Judean city of Lachish in 701 BC is shown on palace reliefs from Nineveh?", 'Sennacherib', ['Ashurbanipal', 'Tiglath-Pileser III', 'Sargon II']),
  ],
  // day 12
  [
    e(1, 'What was a Roman army officer who commanded a unit of about eighty to a hundred men called?', 'A centurion', ['A legate', 'A tribune', 'A consul']),
    e(2, 'What name is given to the code of honor associated with the samurai?', 'Bushido', ['Chivalry', 'Shinto', 'Ikigai']),
    e(3, 'Which 1995 agreement, negotiated at an air base in Ohio, ended the war in Bosnia?', 'The Dayton Accords', ['The Oslo Accords', 'The Rambouillet Accords', 'The Helsinki Accords']),
    e(4, 'Which hilltop castle in Mexico City was stormed by US troops in September 1847?', 'Chapultepec', ['Veracruz', 'Cerro Gordo', 'Churubusco']),
    e(5, 'At which 1643 battle did a French army under the young Duke of Enghien defeat the famed Spanish infantry?', 'Rocroi', ['Lens', 'Nordlingen', 'Breitenfeld']),
  ],
  // day 13
  [
    e(1, "What were colonial militiamen pledged to be ready for action at a moment's notice called?", 'Minutemen', ['Rangers', 'Dragoons', 'Regulars']),
    e(2, "Which Native American nation's language was the basis of a US Marine code used in the Pacific during World War II?", 'Navajo', ['Cherokee', 'Sioux', 'Apache']),
    e(3, 'Which coalition of seaborne raiders did Ramesses III defeat in the Nile Delta around 1175 BC?', 'The Sea Peoples', ['The Hyksos', 'The Hittites', 'The Nubians']),
    e(4, 'Which twin-engine jet fighter did Germany fly in combat from 1944?', 'Messerschmitt Me 262', ['Heinkel He 111', 'Focke-Wulf Fw 190', 'Junkers Ju 87']),
    e(5, 'At which 1866 Adriatic battle did an Austrian fleet under Tegetthoff defeat the Italian navy?', 'Lissa', ['Navarino', 'Sinope', 'Chesme']),
  ],
  // day 14
  [
    e(1, 'What is a soldier who has been captured and held by the enemy called?', 'A prisoner of war', ['A deserter', 'A mercenary', 'A conscript']),
    e(2, 'What was the dense, deep formation of Macedonian pikemen called?', 'The phalanx', ['The testudo', 'The legion', 'The square']),
    e(3, 'In which Virginia waters did the USS Monitor fight the CSS Virginia in March 1862?', 'Hampton Roads', ['Mobile Bay', 'Charleston Harbor', 'Pamlico Sound']),
    e(4, 'Which English king commanded at the Battle of Crecy in 1346?', 'Edward III', ['Edward I', 'Edward II', 'Richard II']),
    e(5, 'At which battle on the Yangtze in 208 AD was the northern warlord Cao Cao defeated?', 'Red Cliffs', ['Guandu', 'Yiling', 'Changban']),
  ],
  // day 15
  [
    e(1, 'What were steam-powered warships protected by iron armor plates called?', 'Ironclads', ['Frigates', 'Galleons', 'Dreadnoughts']),
    e(2, 'What nickname was given to the supporters of Parliament in the English Civil War?', 'Roundheads', ['Cavaliers', 'Jacobites', 'Tories']),
    e(3, "Which July 1943 battle around a salient in western Russia was Germany's last great offensive in the east?", 'Kursk', ['Kharkov', 'Rzhev', 'Smolensk']),
    e(4, "At which 1898 battle near Khartoum did Kitchener's army defeat the Mahdist forces?", 'Omdurman', ['Atbara', 'Tel el-Kebir', 'Abu Klea']),
    e(5, 'At which 751 battle in Central Asia did an Abbasid army defeat the forces of Tang China?', 'Talas', ['Qadisiyyah', 'Nahavand', 'Manzikert']),
  ],
  // day 16
  [
    e(1, "Which tall bow was the signature weapon of English archers in the Hundred Years' War?", 'The longbow', ['The crossbow', 'The composite bow', 'The arbalest']),
    e(2, 'What name is given to the African American military pilots who trained in Alabama during World War II?', 'The Tuskegee Airmen', ['The Buffalo Soldiers', 'The Flying Tigers', 'The Red Ball Express']),
    e(3, 'Where did Grand Master Jean de Valette hold off an Ottoman siege in 1565?', 'Malta', ['Rhodes', 'Cyprus', 'Crete']),
    e(4, 'What was the April 1942 American bombing attack on Tokyo, flown from the carrier Hornet, called?', 'The Doolittle Raid', ['Operation Vengeance', 'Operation Meetinghouse', 'The Schweinfurt Raid']),
    e(5, 'At which 955 battle did Otto I end the Magyar raids into Germany?', 'Lechfeld', ['Tours', 'Andernach', 'Fontenoy']),
  ],
  // day 17
  [
    e(1, "What name is given to May 8, 1945, when the Allies celebrated Germany's surrender?", 'V-E Day', ['V-J Day', 'D-Day', 'Armistice Day']),
    e(2, 'Which war of 1870 and 1871 ended with the German Empire proclaimed in the palace of Versailles?', 'The Franco-Prussian War', ['The Austro-Prussian War', 'The Crimean War', 'The Second Schleswig War']),
    e(3, 'Which country fought a series of Cod Wars with Britain over fishing rights between the 1950s and 1970s?', 'Iceland', ['Norway', 'Denmark', 'Ireland']),
    e(4, 'Which pharaoh won the battle of Megiddo around 1457 BC, one of the earliest battles recorded in detail?', 'Thutmose III', ['Ramesses II', 'Ahmose I', 'Seti I']),
    e(5, "Which one-eyed field marshal held overall command of the tsar's army at Borodino?", 'Mikhail Kutuzov', ['Alexander Suvorov', 'Pyotr Rumyantsev', 'Grigory Potemkin']),
  ],
  // day 18
  [
    e(1, 'What was the ancient Greek warship rowed with three banks of oars called?', 'The trireme', ['The galleon', 'The longship', 'The quinquereme']),
    e(2, "Which Castilian knight captured Valencia in 1094 and became Spain's great medieval hero?", 'El Cid', ['Pelayo', 'Roland', 'Alfonso VI']),
    e(3, 'Which 1757 victory by Robert Clive gave the East India Company control of Bengal?', 'Plassey', ['Buxar', 'Panipat', 'Wandiwash']),
    e(4, 'Which country lost its access to the sea to Chile in the War of the Pacific of 1879 to 1884?', 'Bolivia', ['Peru', 'Paraguay', 'Argentina']),
    e(5, 'Which 421 BC truce, named for an Athenian general, briefly paused the Peloponnesian War?', 'The Peace of Nicias', ['The Peace of Callias', 'The Peace of Antalcidas', "The Thirty Years' Peace"]),
  ],
  // day 19
  [
    e(1, 'What was the American shoulder-fired antitank rocket launcher of World War II nicknamed?', 'The bazooka', ['The Panzerfaust', 'The Tommy gun', 'The Garand']),
    e(2, 'What does the Cold War nuclear doctrine abbreviated MAD stand for?', 'Mutually Assured Destruction', ['Maximum Allied Deterrence', 'Missile Attack Defense', 'Massive Atomic Deployment']),
    e(3, 'Which grandson of Genghis Khan led the Mongol conquest of Kievan Rus in the 1230s?', 'Batu Khan', ['Kublai Khan', 'Hulagu Khan', 'Ogedei Khan']),
    e(4, 'In which French forest was the November 1918 armistice signed in a railway carriage?', 'Compiegne', ['Fontainebleau', 'Argonne', 'Rambouillet']),
    e(5, 'Which engineer designed the Supermarine Spitfire before his death in 1937?', 'R. J. Mitchell', ['Sydney Camm', 'Barnes Wallis', 'Frank Whittle']),
  ],
  // day 20
  [
    e(1, 'Which US military academy, on the Hudson River in New York, was founded in 1802?', 'West Point', ['Annapolis', 'Fort Knox', 'The Citadel']),
    e(2, 'What was the short stabbing sword of the Roman legionary called?', 'The gladius', ['The spatha', 'The falchion', 'The sarissa']),
    e(3, 'Which war ended with the Treaty of Guadalupe Hidalgo in 1848?', 'The Mexican-American War', ['The Texas Revolution', 'The Pastry War', 'The Spanish-American War']),
    e(4, 'At which 1260 battle in Palestine did the Mamluks halt the Mongol advance?', 'Ain Jalut', ['Mohi', 'Liegnitz', 'Homs']),
    e(5, 'Who led the Taiping Rebellion, claiming to be the younger brother of Jesus?', 'Hong Xiuquan', ['Zeng Guofan', 'Li Hongzhang', 'Yuan Shikai']),
  ],
  // day 21
  [
    e(1, 'Which RAF fighter with distinctive elliptical wings became the emblem of the 1940 air battle over England?', 'The Spitfire', ['The Hurricane', 'The Mosquito', 'The Lancaster']),
    e(2, 'Which South Carolina militia leader of the Revolutionary War was nicknamed the Swamp Fox?', 'Francis Marion', ['Thomas Sumter', 'Andrew Pickens', 'Daniel Morgan']),
    e(3, 'The aftermath of which 1859 battle in Lombardy inspired Henri Dunant to found the Red Cross?', 'Solferino', ['Magenta', 'Novara', 'Custoza']),
    e(4, 'Which breakaway region fought Nigeria in a civil war from 1967 to 1970?', 'Biafra', ['Katanga', 'Eritrea', 'Darfur']),
    e(5, 'Which port did Richard I and Philip II of France capture in 1191 after a long siege?', 'Acre', ['Jaffa', 'Sidon', 'Ascalon']),
  ],
  // day 22
  [
    e(1, 'What general name is given to a siege engine that hurls stones at walls?', 'A catapult', ['A battering ram', 'A siege tower', 'A portcullis']),
    e(2, 'What nickname was given to the African American cavalry regiments that served on the western frontier?', 'The Buffalo Soldiers', ['The Rough Riders', 'The Tuskegee Airmen', 'The Green Mountain Boys']),
    e(3, 'What was the code name of the failed Allied airborne operation to seize Rhine bridges at Arnhem in 1944?', 'Operation Market Garden', ['Operation Overlord', 'Operation Varsity', 'Operation Cobra']),
    e(4, 'At which 1526 battle did the Ottomans destroy the Hungarian royal army?', 'Mohacs', ['Varna', 'Nicopolis', 'Belgrade']),
    e(5, 'Which two countries fought the Chaco War of 1932 to 1935?', 'Bolivia and Paraguay', ['Peru and Ecuador', 'Chile and Argentina', 'Brazil and Uruguay']),
  ],
  // day 23
  [
    e(1, "Which June 1775 battle near Boston was actually fought mostly on Breed's Hill?", 'Bunker Hill', ['Dorchester Heights', 'Lexington', 'Ticonderoga']),
    e(2, 'Which Bell helicopter, nicknamed the Huey, became a symbol of the Vietnam War?', 'UH-1 Iroquois', ['CH-47 Chinook', 'UH-60 Black Hawk', 'AH-64 Apache']),
    e(3, "Who commanded Joseon's navy, with its armored turtle ships, against the Japanese invasions of the 1590s?", 'Yi Sun-sin', ['Won Gyun', 'Gwon Yul', 'Kim Yu-sin']),
    e(4, 'Which June 1944 naval battle was nicknamed the Great Marianas Turkey Shoot?', 'The Philippine Sea', ['Leyte Gulf', 'Midway', 'Santa Cruz']),
    e(5, 'Which Roman emperor was killed fighting the Goths at Adrianople in 378?', 'Valens', ['Theodosius I', 'Julian', 'Gratian']),
  ],
  // day 24
  [
    e(1, 'What slang name is given to the metal ID plates that US service members wear on a chain?', 'Dog tags', ['Chevrons', 'Shoulder boards', 'Service stripes']),
    e(2, 'Which English king was called the Hammer of the Scots for his campaigns in Scotland?', 'Edward I', ['Edward II', 'Henry III', 'Richard II']),
    e(3, 'Which Black Sea naval base was besieged by British, French and Ottoman forces in 1854 and 1855?', 'Sevastopol', ['Odessa', 'Varna', 'Kerch']),
    e(4, 'Which 1827 naval battle, often called the last major clash between sailing fleets, helped secure Greek independence?', 'Navarino', ['Chesme', 'Sinope', 'Camperdown']),
    e(5, 'Which French admiral commanded the combined French and Spanish fleet at Trafalgar?', 'Pierre-Charles Villeneuve', ['Francois-Paul Brueys', 'Honore Ganteaume', 'Louis-Thomas Villaret de Joyeuse']),
  ],
  // day 25
  [
    e(1, 'By what nickname was Confederate general Thomas J. Jackson known?', 'Stonewall', ['Old Pete', 'Jeb', 'Little Mac']),
    e(2, 'What was the name of the B-29 that dropped the atomic bomb on Hiroshima?', 'Enola Gay', ['Bockscar', 'Memphis Belle', 'The Great Artiste']),
    e(3, 'Which English commander won the Battle of Blenheim in 1704?', 'The Duke of Marlborough', ['The Duke of Wellington', 'The Duke of Cumberland', 'The Earl of Peterborough']),
    e(4, 'Which Theban general broke Spartan power at Leuctra in 371 BC?', 'Epaminondas', ['Pausanias', 'Lysander', 'Brasidas']),
    e(5, 'Which 1185 sea battle ended the Genpei War between the Taira and Minamoto clans?', 'Dan-no-ura', ['Ichi-no-Tani', 'Yashima', 'Uji']),
  ],
  // day 26
  [
    e(1, 'Along with Utah, which Normandy beach did American troops storm on D-Day?', 'Omaha', ['Gold', 'Juno', 'Sword']),
    e(2, 'Which French military corps, founded in 1831, has long recruited soldiers from other countries?', 'The French Foreign Legion', ['The Zouaves', 'The Chasseurs Alpins', 'The Republican Guard']),
    e(3, 'What name, meaning divine wind, did the Japanese give to the typhoons that wrecked the Mongol invasion fleets?', 'Kamikaze', ['Bushido', 'Banzai', 'Tsunami']),
    e(4, 'Which American-born inventor built the first self-powered machine gun in 1884?', 'Hiram Maxim', ['Richard Gatling', 'John Browning', 'Isaac Lewis']),
    e(5, 'Which 1895 treaty ended the First Sino-Japanese War?', 'Treaty of Shimonoseki', ['Treaty of Portsmouth', 'Treaty of Nanking', 'Treaty of Tientsin']),
  ],
  // day 27
  [
    e(1, 'Which side in the American Civil War was nicknamed the Rebels?', 'The Confederacy', ['The Union', 'The Yankees', 'The Abolitionists']),
    e(2, 'Which legendary woman is said to have carried water to soldiers and manned a cannon at the Battle of Monmouth?', 'Molly Pitcher', ['Betsy Ross', 'Deborah Sampson', 'Sybil Ludington']),
    e(3, 'Which breakaway republic fought a war against Russia from 1994 to 1996?', 'Chechnya', ['Dagestan', 'Abkhazia', 'Transnistria']),
    e(4, 'Which French military engineer designed star-shaped fortresses for Louis XIV?', 'Vauban', ['Colbert', 'Turenne', 'Conde']),
    e(5, 'At which October 1780 battle in the Carolinas did frontier riflemen destroy a Loyalist force under Patrick Ferguson?', 'Kings Mountain', ['Cowpens', 'Camden', 'Guilford Courthouse']),
  ],
  // day 28
  [
    e(1, 'Which Germanic people sacked Rome in 455 and gave their name to wanton destruction?', 'The Vandals', ['The Goths', 'The Huns', 'The Franks']),
    e(2, 'What did Herodotus call the elite Persian infantry corps kept at a strength of ten thousand?', 'The Immortals', ['The Companions', 'The Sacred Band', 'The Hypaspists']),
    e(3, 'Which Union general commanded the Army of the Potomac at Gettysburg?', 'George Meade', ['Joseph Hooker', 'Ambrose Burnside', 'George McClellan']),
    e(4, 'At which Ugandan airport did Israeli commandos rescue hijacked hostages in July 1976?', 'Entebbe', ['Kampala', 'Mogadishu', 'Khartoum']),
    e(5, 'Which battleship, sister of the Musashi, was sunk by US carrier aircraft in April 1945?', 'Yamato', ['Nagato', 'Kongo', 'Mutsu']),
  ],
  // day 29
  [
    e(1, 'Which smoothbore shoulder firearm, loaded through the muzzle, was the standard infantry weapon of the 1700s?', 'The musket', ['The rifle', 'The carbine', 'The arquebus']),
    e(2, 'Which Soviet-designed missiles did Iraq fire at Israel and Saudi Arabia during the 1991 Gulf War?', 'Scuds', ['Tomahawks', 'Patriots', 'Exocets']),
    e(3, 'Where did Germany first release chlorine gas on a large scale, in April 1915?', 'Ypres', ['Mons', 'Liege', 'Antwerp']),
    e(4, 'Which Turco-Mongol ruler defeated and captured the Ottoman sultan Bayezid I at Ankara in 1402?', 'Timur', ['Hulagu', 'Ogedei', 'Babur']),
    e(5, 'Which seven-time consul opened the Roman army to landless volunteers around 107 BC?', 'Gaius Marius', ['Sulla', 'Pompey', 'Scipio Aemilianus']),
  ],
  // day 30
  [
    e(1, 'Which red flower became the symbol of remembrance for the dead of World War I?', 'The poppy', ['The rose', 'The carnation', 'The tulip']),
    e(2, 'At which 31 BC sea battle did Octavian defeat Mark Antony and Cleopatra?', 'Actium', ['Salamis', 'Mylae', 'Ecnomus']),
    e(3, 'At which 1690 battle in Ireland did William III defeat James II?', 'The Boyne', ['Aughrim', 'Kinsale', 'Drogheda']),
    e(4, 'Which long-range force did Orde Wingate lead behind Japanese lines in Burma?', 'The Chindits', ["Merrill's Marauders", 'The Desert Rats', 'The Gurkha Rifles']),
    e(5, 'At which September 1777 battle did Howe defeat Washington on the way to taking Philadelphia?', 'Brandywine', ['Germantown', 'Monmouth', 'White Plains']),
  ],
  // day 31
  [
    e(1, 'Which volunteer cavalry regiment did Theodore Roosevelt help lead in Cuba in 1898?', 'The Rough Riders', ['The Buffalo Soldiers', 'The Green Mountain Boys', 'The Iron Brigade']),
    e(2, 'Which commander of the Ironsides cavalry later governed the Commonwealth of England?', 'Oliver Cromwell', ['Thomas Fairfax', 'Henry Ireton', 'George Monck']),
    e(3, 'Which island fortress at the mouth of Manila Bay surrendered to Japan in May 1942?', 'Corregidor', ['Bataan', 'Wake Island', 'Mindanao']),
    e(4, 'At which 1709 battle did Peter the Great crush the army of Charles XII of Sweden?', 'Poltava', ['Narva', 'Lesnaya', 'Holowczyn']),
    e(5, 'Which future Roman emperor captured and destroyed Jerusalem in AD 70?', 'Titus', ['Vespasian', 'Hadrian', 'Domitian']),
  ],
  // day 32
  [
    e(1, 'What German word, meaning lightning war, describes the fast armored attacks of 1939 and 1940?', 'Blitzkrieg', ['Lebensraum', 'Anschluss', 'Kristallnacht']),
    e(2, 'Which polearm, combining an axe blade, a spike and a hook, was a favorite of Swiss infantry?', 'The halberd', ['The pike', 'The glaive', 'The trident']),
    e(3, 'Which mission station did a small British garrison defend against a Zulu attack in January 1879?', "Rorke's Drift", ['Isandlwana', 'Ulundi', 'Eshowe']),
    e(4, 'Which island sultanate was bombarded by the Royal Navy in a war of 1896 that lasted under an hour?', 'Zanzibar', ['Pemba', 'Lamu', 'Socotra']),
    e(5, 'At which 1396 battle on the Danube did the Ottomans rout a crusading army led by Sigismund of Hungary?', 'Nicopolis', ['Varna', 'Kosovo', 'Rovine']),
  ],
  // day 33
  [
    e(1, 'Which bow, mounted on a wooden stock and shot with a trigger, needed little training to use?', 'The crossbow', ['The longbow', 'The sling', 'The composite bow']),
    e(2, 'Which British biplane fighter of World War I shared its name with a desert animal?', 'The Sopwith Camel', ['The Fokker Dr.I', 'The SPAD XIII', 'The Bristol Fighter']),
    e(3, 'A reported 1964 clash in which gulf led Congress to authorize wider US military action in Vietnam?', 'The Gulf of Tonkin', ['The Gulf of Thailand', 'The Gulf of Aden', 'The Gulf of Bothnia']),
    e(4, 'At which 48 BC battle in Greece did Julius Caesar defeat Pompey?', 'Pharsalus', ['Dyrrhachium', 'Thapsus', 'Munda']),
    e(5, 'At which 1838 battle on the Ncome did Voortrekkers defeat a Zulu army?', 'Blood River', ['Isandlwana', 'Ulundi', 'Majuba Hill']),
  ],
  // day 34
  [
    e(1, 'Which elite unit served as the personal bodyguard of the Roman emperors?', 'The Praetorian Guard', ['The Swiss Guard', 'The Immortals', 'The Janissaries']),
    e(2, 'The explosion of which US battleship in Havana harbor in 1898 helped spark the Spanish-American War?', 'USS Maine', ['USS Arizona', 'USS Oregon', 'USS Texas']),
    e(3, 'Who directed the defense of Moscow for the Red Army in late 1941?', 'Georgy Zhukov', ['Kliment Voroshilov', 'Semyon Budyonny', 'Semyon Timoshenko']),
    e(4, 'Which 1973 agreement provided for the withdrawal of US combat troops from Vietnam?', 'The Paris Peace Accords', ['The Geneva Accords', 'The Helsinki Accords', 'The Dayton Accords']),
    e(5, 'Which commander took an army over the Saint Gotthard Pass in 1799 during the War of the Second Coalition?', 'Alexander Suvorov', ['Mikhail Kutuzov', 'Pyotr Rumyantsev', 'Grigory Potemkin']),
  ],
  // day 35
  [
    e(1, "In which Pennsylvania encampment did Washington's army spend the hard winter of 1777 to 1778?", 'Valley Forge', ['Morristown', 'West Point', 'Germantown']),
    e(2, 'Which Hun leader invaded Gaul and was checked at the Battle of the Catalaunian Plains in 451?', 'Attila', ['Odoacer', 'Alaric', 'Genseric']),
    e(3, 'By what nickname is the RAF squadron that breached German dams with bouncing bombs in 1943 known?', 'The Dambusters', ['The Pathfinders', 'The Few', 'The Desert Air Force']),
    e(4, 'Which 1866 battle, also called Sadowa, decided the Austro-Prussian War?', 'Koniggratz', ['Solferino', 'Custoza', 'Langensalza']),
    e(5, 'What was the code name of the 1983 US invasion of Grenada?', 'Operation Urgent Fury', ['Operation Just Cause', 'Operation Eagle Claw', 'Operation Desert Shield']),
  ],
  // day 36
  [
    e(1, 'Which jellied gasoline incendiary was used by US forces in World War II, Korea and Vietnam?', 'Napalm', ['Agent Orange', 'Greek fire', 'Mustard gas']),
    e(2, 'Which American general commanded the Third Army in its 1944 drive across France?', 'George S. Patton', ['Omar Bradley', 'Mark Clark', 'Courtney Hodges']),
    e(3, "Whose victories at Rossbach and Leuthen in 1757 saved Prussia during the Seven Years' War?", 'Frederick the Great', ['Frederick William I', 'Wilhelm I', 'Frederick William III']),
    e(4, 'Which 1739 war between Britain and Spain is named after a body part a British captain said he had lost?', "The War of Jenkins' Ear", ['The Pastry War', 'The Pig War', 'The Football War']),
    e(5, 'Which 1187 battle near Tiberias destroyed the field army of the crusader Kingdom of Jerusalem?', 'Hattin', ['Arsuf', 'Montgisard', 'Dorylaeum']),
  ],
  // day 37
  [
    e(1, 'What was the first major land battle of the American Civil War, fought in Virginia in July 1861?', 'Bull Run', ['Antietam', 'Shiloh', 'Fredericksburg']),
    e(2, 'Which blade, fixed to the end of a gun, is thought to be named after the French town of Bayonne?', 'The bayonet', ['The saber', 'The dirk', 'The halberd']),
    e(3, 'Which country did the Soviet Union invade in November 1939, starting the Winter War?', 'Finland', ['Estonia', 'Poland', 'Norway']),
    e(4, 'Which hilltop abbey in central Italy was destroyed by Allied bombing in February 1944?', 'Monte Cassino', ['Subiaco', 'Monte Oliveto', 'Farfa']),
    e(5, 'Which blind Hussite general used armored wagon forts to defeat crusading armies in the 1420s?', 'Jan Zizka', ['Jan Hus', 'Prokop the Great', 'George of Podebrady']),
  ],
  // day 38
  [
    e(1, 'Which poster heroine in a red bandana symbolized American women working in war factories?', 'Rosie the Riveter', ['Molly Pitcher', 'Betsy Ross', 'Lady Liberty']),
    e(2, "Which October 1973 war began with Egypt and Syria launching surprise attacks on Israel's holiest day?", 'The Yom Kippur War', ['The Six-Day War', 'The War of Attrition', 'The Suez Crisis']),
    e(3, 'Which British general surrendered his army at Saratoga in October 1777?', 'John Burgoyne', ['Charles Cornwallis', 'William Howe', 'Henry Clinton']),
    e(4, "Which river crossing in November 1812 was the last great fight of Napoleon's retreat from Russia?", 'The Berezina', ['The Niemen', 'The Dnieper', 'The Vistula']),
    e(5, 'In which island group did the 1859 Pig War standoff between the US and Britain take place?', 'The San Juan Islands', ['The Channel Islands', 'The Gulf Islands', 'The Aleutian Islands']),
  ],
  // day 39
  [
    e(1, 'Which herbicide, named for a colored stripe on its barrels, was sprayed to strip jungle cover in the Vietnam War?', 'Agent Orange', ['Napalm', 'Mustard gas', 'Sarin']),
    e(2, 'Who led the British Eighth Army to victory at the Second Battle of El Alamein?', 'Bernard Montgomery', ['Harold Alexander', 'Claude Auchinleck', 'Archibald Wavell']),
    e(3, "Which 1857 uprising began among sepoys of the East India Company's army at Meerut?", 'The Indian Rebellion', ['The Taiping Rebellion', 'The Boxer Rebellion', 'The Vellore Mutiny']),
    e(4, 'Which Horn of Africa state fought a border war over the town of Badme from 1998 to 2000?', 'Eritrea', ['Somalia', 'Djibouti', 'Sudan']),
    e(5, 'Which French squadron was flown largely by American volunteer pilots before the US entered World War I?', 'The Lafayette Escadrille', ['Les Cigognes', 'The Flying Circus', 'The Aero Club']),
  ],
  // day 40
  [
    e(1, 'Which June 1967 war saw Israel take Sinai, Gaza, the West Bank and the Golan Heights?', 'The Six-Day War', ['The Yom Kippur War', 'The Suez Crisis', 'The War of Attrition']),
    e(2, 'Which US frigate earned the nickname Old Ironsides during the War of 1812?', 'USS Constitution', ['USS Constellation', 'USS United States', 'USS Chesapeake']),
    e(3, 'Which September 1914 battle halted the German advance on Paris?', 'The Marne', ['The Somme', 'The Aisne', 'Verdun']),
    e(4, 'At which January 1781 battle in South Carolina did Daniel Morgan rout Banastre Tarleton?', 'Cowpens', ['Camden', 'Guilford Courthouse', 'Kings Mountain']),
    e(5, 'At which 937 battle did King Athelstan defeat an alliance of Scots, Norsemen and Strathclyde Britons?', 'Brunanburh', ['Edington', 'Maldon', 'Stamford Bridge']),
  ],
  // day 41
  [
    e(1, "What is Britain's highest award for gallantry in the face of the enemy, instituted in 1856?", 'The Victoria Cross', ['The George Cross', 'The Military Cross', 'The Order of the Garter']),
    e(2, 'Which city did the Western Allies supply by air during the Soviet blockade of 1948 and 1949?', 'West Berlin', ['Vienna', 'Warsaw', 'Prague']),
    e(3, 'Which two countries fought the brief 1969 conflict known as the Football War?', 'El Salvador and Honduras', ['Guatemala and Belize', 'Nicaragua and Costa Rica', 'Peru and Ecuador']),
    e(4, 'At which 1870 battle was Emperor Napoleon III taken prisoner by the Prussians?', 'Sedan', ['Metz', 'Gravelotte', 'Mars-la-Tour']),
    e(5, 'What did the Allies call the fortified German defensive system on the Western Front that was breached in late 1918?', 'The Hindenburg Line', ['The Gustav Line', 'The Gothic Line', 'The Mareth Line']),
  ],
  // day 42
  [
    e(1, 'What nickname was given to American infantrymen in World War I?', 'Doughboys', ['Tommies', 'Poilus', 'Diggers']),
    e(2, 'At which 1746 battle near Inverness was the Jacobite rising crushed?', 'Culloden', ['Prestonpans', 'Falkirk', 'Killiecrankie']),
    e(3, 'Which 1906 British battleship gave its name to a new class of all-big-gun warships?', 'HMS Dreadnought', ['HMS Hood', 'HMS Warrior', 'HMS Invincible']),
    e(4, 'What were the artificial harbors towed across the Channel to Normandy in 1944 code-named?', 'Mulberry', ['Pluto', 'Fortitude', 'Neptune']),
    e(5, 'Which Dutch admiral led the 1667 raid on the Medway that towed away the English flagship?', 'Michiel de Ruyter', ['Maarten Tromp', 'Piet Hein', 'Cornelis Evertsen']),
  ],
  // day 43
  [
    e(1, 'Which medieval siege engine used a heavy counterweight to hurl stones?', 'The trebuchet', ['The ballista', 'The battering ram', 'The siege tower']),
    e(2, 'What does the World War I acronym ANZAC stand for?', 'Australian and New Zealand Army Corps', ['Allied Naval Zone Attack Command', 'Australian and New Zealand Air Command', 'Atlantic and North Zone Armed Corps']),
    e(3, 'Which US general captured Mexico City in 1847?', 'Winfield Scott', ['Zachary Taylor', 'Stephen Kearny', 'John C. Fremont']),
    e(4, 'Which stealth attack aircraft first saw combat during the 1989 US invasion of Panama?', 'F-117 Nighthawk', ['B-2 Spirit', 'F-22 Raptor', 'SR-71 Blackbird']),
    e(5, 'Which British artillery officer invented the exploding shell full of musket balls that bears his name?', 'Henry Shrapnel', ['William Congreve', 'William Armstrong', 'Joseph Whitworth']),
  ],
  // day 44
  [
    e(1, 'Which country ceased to exist after its capital, Saigon, fell in April 1975?', 'South Vietnam', ['Cambodia', 'Laos', 'Thailand']),
    e(2, 'What nickname was given to the giant German howitzer that pounded Belgian forts in 1914?', 'Big Bertha', ['Long Max', 'The Paris Gun', 'Dora']),
    e(3, 'Which castle in Saxony held Allied officer prisoners famous for their repeated escape attempts in World War II?', 'Colditz', ['Neuschwanstein', 'Wewelsburg', 'Hohenzollern']),
    e(4, 'At which 1800 battle in northern Italy did Napoleon defeat the Austrians?', 'Marengo', ['Austerlitz', 'Wagram', 'Lodi']),
    e(5, 'At which 260 BC sea battle did Rome win its first naval victory over Carthage, using the corvus boarding bridge?', 'Mylae', ['Ecnomus', 'Drepana', 'Aegates']),
  ],
  // day 45
  [
    e(1, 'What name was given to the pilots who deliberately crashed their aircraft into Allied warships late in World War II?', 'Kamikaze', ['Banzai', 'Ronin', 'Shinobi']),
    e(2, 'Which American tank, named after a Union general, was the most produced US tank of World War II?', 'M4 Sherman', ['M3 Lee', 'M26 Pershing', 'M24 Chaffee']),
    e(3, 'Which American air defense missile system was rushed to Israel and Saudi Arabia during the Gulf War?', 'Patriot', ['Hawk', 'Nike', 'Stinger']),
    e(4, 'What nickname was given to the African American 369th Infantry Regiment that fought with the French army in 1918?', 'The Harlem Hellfighters', ['The Buffalo Soldiers', 'The Tuskegee Airmen', 'The Red Hand']),
    e(5, 'In which village did the two sides sign the July 1953 agreement that halted the fighting in Korea?', 'Panmunjom', ['Kaesong', 'Inchon', 'Munsan']),
  ],
  // day 46
  [
    e(1, 'Where did Cuban exiles trained by the CIA land in a failed April 1961 invasion?', 'The Bay of Pigs', ['Guantanamo Bay', 'Havana Harbor', 'Matanzas Bay']),
    e(2, 'What do Americans call the 1754 to 1763 war in North America between Britain and France?', 'The French and Indian War', ["King William's War", "Queen Anne's War", "King George's War"]),
    e(3, 'Which American general, nicknamed Black Jack, commanded the AEF in World War I?', 'John J. Pershing', ['Leonard Wood', 'Peyton March', 'Hunter Liggett']),
    e(4, 'Which Solomon Islands island was the target of the first major American offensive in the Pacific, in August 1942?', 'Guadalcanal', ['Tarawa', 'Bougainville', 'New Georgia']),
    e(5, "At which December 1862 battle did Burnside's Union army make repeated failed assaults on Marye's Heights?", 'Fredericksburg', ['Chancellorsville', 'Antietam', 'Cold Harbor']),
  ],
  // day 47
  [
    e(1, 'Which US military decoration is awarded to service members wounded in action?', 'The Purple Heart', ['The Bronze Star', 'The Silver Star', 'The Medal of Honor']),
    e(2, 'Which soldiers from Nepal have served in British Army regiments since the early 1800s?', 'The Gurkhas', ['The Sikhs', 'The Pathans', 'The Rajputs']),
    e(3, 'Which American general commanded coalition forces in the 1991 Gulf War?', 'Norman Schwarzkopf', ['Colin Powell', 'Tommy Franks', 'Wesley Clark']),
    e(4, 'At which 1798 battle in Aboukir Bay did Nelson destroy a French fleet?', 'The Battle of the Nile', ['The Battle of Copenhagen', 'The Battle of Cape St. Vincent', 'The Battle of Camperdown']),
    e(5, "What was the code name of NATO's 1999 air campaign against Yugoslavia over Kosovo?", 'Operation Allied Force', ['Operation Deliberate Force', 'Operation Desert Fox', 'Operation Provide Comfort']),
  ],
  // day 48
  [
    e(1, 'What was the code name of the US-led air and ground campaign that drove Iraq out of Kuwait in 1991?', 'Operation Desert Storm', ['Operation Desert Shield', 'Operation Iraqi Freedom', 'Operation Enduring Freedom']),
    e(2, 'What name is given to the wave of North Vietnamese and Viet Cong attacks launched at the lunar new year in 1968?', 'The Tet Offensive', ['The Easter Offensive', 'The Spring Offensive', 'The Ho Chi Minh Campaign']),
    e(3, 'Which British general was killed when Mahdist forces stormed Khartoum in 1885?', 'Charles Gordon', ['Herbert Kitchener', 'Garnet Wolseley', 'William Hicks']),
    e(4, 'Which Tennessee marksman won the Medal of Honor for an attack in the Argonne in October 1918?', 'Alvin York', ['Audie Murphy', 'Eddie Rickenbacker', 'Dan Daly']),
    e(5, 'Which atoll in the Gilbert Islands did US Marines assault in November 1943?', 'Tarawa', ['Kwajalein', 'Eniwetok', 'Peleliu']),
  ],
];
