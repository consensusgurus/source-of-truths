const C = "Weather & Earth";
const q = (t, qq, a, d) => ({ c: C, t, q: qq, a, d });

export const LANE_DAYS = [
  // day 1
  [
    q(1, "Which storm, rated on the Enhanced Fujita scale, can produce winds above 200 mph?", "Tornado", ["Hurricane", "Derecho", "Blizzard"]),
    q(2, "Marble is an example of which major type of rock?", "Metamorphic", ["Igneous", "Sedimentary", "Volcanic"]),
    q(3, "Which cloud genus, abbreviated Cb, is responsible for thunder, lightning, and hail?", "Cumulonimbus", ["Cirrostratus", "Stratocumulus", "Altostratus"]),
    q(4, "Which seismic discontinuity lies only about 5 to 10 kilometers beneath the ocean floor, named for a Croatian seismologist?", "Mohorovičić discontinuity", ["Gutenberg discontinuity", "Lehmann discontinuity", "Conrad discontinuity"]),
    q(5, "In the Köppen climate classification, which code denotes a tropical rainforest climate?", "Af", ["Am", "Aw", "Cfa"]),
  ],
  // day 2
  [
    q(1, "Temperature generally falls with altitude in which lowest layer of the atmosphere?", "Troposphere", ["Stratosphere", "Mesosphere", "Thermosphere"]),
    q(2, "Hawaiian pahoehoe and aa are two forms of what?", "Lava", ["Magma", "Tephra", "Pumice"]),
    q(3, "Which mineral, crystalline silicon dioxide, includes amethyst and citrine as varieties?", "Quartz", ["Feldspar", "Beryl", "Garnet"]),
    q(4, "At a convergent plate boundary, what is the process called in which a dense oceanic plate sinks beneath another plate?", "Subduction", ["Obduction", "Rifting", "Transform faulting"]),
    q(5, "Noctilucent clouds, which glow at twilight, form mainly in which layer of the atmosphere?", "Mesosphere", ["Troposphere", "Stratosphere", "Thermosphere"]),
  ],
  // day 3
  [
    q(1, "Which season begins in the Northern Hemisphere in December?", "Winter", ["Autumn", "Spring", "Summer"]),
    q(2, "Cup anemometers on weather masts spin to measure which quantity?", "Wind speed", ["Air pressure", "Humidity", "Rainfall"]),
    q(3, "Chalk, limestone, and marble are all made chiefly of which mineral?", "Calcite", ["Halite", "Pyrite", "Fluorite"]),
    q(4, "Which glacial landform is a streamlined oval hill of till, shaped like an upturned spoon?", "Drumlin", ["Esker", "Moraine", "Kame"]),
    q(5, "The Wilson cycle describes the repeated opening and closing of what?", "Ocean basins", ["Glacial periods", "Monsoon seasons", "River deltas"]),
  ],
  // day 4
  [
    q(1, "Cumulonimbus clouds with strong updrafts can drop which type of frozen precipitation, sometimes as big as golf balls?", "Hail", ["Sleet", "Snow", "Rime"]),
    q(2, "Oceanic and continental are the two varieties of which layer of Earth?", "Crust", ["Mantle", "Outer core", "Inner core"]),
    q(3, "Which metamorphic rock forms when shale is subjected to heat and pressure?", "Slate", ["Marble", "Quartzite", "Basalt"]),
    q(4, "In a normal fault, the block above the fault plane moves in which direction relative to the block below it?", "Downward", ["Upward", "Horizontally", "Diagonally upward"]),
    q(5, "Which clay mineral group, which includes montmorillonite, expands strongly when it gets wet?", "Smectite", ["Kaolinite", "Illite", "Chlorite"]),
  ],
  // day 5
  [
    q(1, "Which element makes up roughly four-fifths of the air we breathe?", "Nitrogen", ["Oxygen", "Carbon dioxide", "Argon"]),
    q(2, "Weathering breaks rock down in place. What is the next step, which carries the pieces away, called?", "Erosion", ["Deposition", "Subsidence", "Condensation"]),
    q(3, "Mauna Loa and Kilauea are examples of which type of volcano, built from fluid basaltic lava?", "Shield", ["Cinder cone", "Stratovolcano", "Lava dome"]),
    q(4, "Which gem is mined chiefly from kimberlite pipes?", "Diamond", ["Emerald", "Ruby", "Opal"]),
    q(5, "Which supercontinent, formed roughly 1.1 billion years ago, preceded Pangaea by hundreds of millions of years?", "Rodinia", ["Gondwana", "Laurasia", "Laurentia"]),
  ],
  // day 6
  [
    q(1, "Which storm type has an eye, an eyewall, and spiral rainbands, and is named for a Caribbean storm god in the Taino language?", "Hurricane", ["Tornado", "Blizzard", "Monsoon"]),
    q(2, "Which black, glassy volcanic rock forms when lava cools too quickly for crystals to grow?", "Obsidian", ["Pumice", "Basalt", "Granite"]),
    q(3, "The San Andreas Fault is an example of which type of plate boundary?", "Transform", ["Convergent", "Divergent", "Hotspot"]),
    q(4, "Compaction and cementation are the two main steps in turning loose sediment into rock. What is the overall process called?", "Lithification", ["Metamorphism", "Crystallization", "Weathering"]),
    q(5, "What is the name for the weak, partly molten zone of the upper mantle on which tectonic plates glide?", "Asthenosphere", ["Lithosphere", "Mesosphere", "Exosphere"]),
  ],
  // day 7
  [
    q(1, "In a primary rainbow, which color appears on the outer edge?", "Red", ["Violet", "Green", "Blue"]),
    q(2, "Which icicle-like cave formation hangs from the ceiling?", "Stalactite", ["Stalagmite", "Column", "Geode"]),
    q(3, "Which tides, those with the greatest range, occur around the new and full moons?", "Spring tides", ["Neap tides", "Ebb tides", "Slack tides"]),
    q(4, "Trade winds are part of which atmospheric circulation cell that spans the tropics?", "Hadley cell", ["Ferrel cell", "Polar cell", "Brewer-Dobson cell"]),
    q(5, "Eruptions that blast a towering column of gas and ash high into the stratosphere are named for which Roman writer's account of Vesuvius in 79 CE?", "Plinian", ["Strombolian", "Vulcanian", "Hawaiian"]),
  ],
  // day 8
  [
    q(1, "In a thunderstorm, which do you see before you hear the thunder?", "Lightning", ["Hail", "Fog", "Frost"]),
    q(2, "Which volcanic rock is so full of gas bubbles that it can float on water?", "Pumice", ["Obsidian", "Basalt", "Granite"]),
    q(3, "Ridges of rock debris deposited by a glacier are called what?", "Moraines", ["Deltas", "Dunes", "Atolls"]),
    q(4, "Which term, borrowed from Javanese, names a volcanic mudflow?", "Lahar", ["Pyroclastic flow", "Lava dome", "Tephra fall"]),
    q(5, "Along with Love waves, which seismic waves make up the surface waves of an earthquake?", "Rayleigh waves", ["Primary waves", "Secondary waves", "Stoneley waves"]),
  ],
  // day 9
  [
    q(1, "Mount Fuji, Mount Etna, and Vesuvius are all examples of what?", "Volcanoes", ["Glaciers", "Atolls", "Plateaus"]),
    q(2, "The Mississippi and the Nile each reach the sea through which kind of landform?", "Delta", ["Estuary", "Fjord", "Lagoon"]),
    q(3, "What is the huge bowl-shaped depression called that forms when a volcano collapses after emptying its magma chamber?", "Caldera", ["Cirque", "Sinkhole", "Graben"]),
    q(4, "The Hawaiian Islands formed as a plate drifted over a fixed plume of hot mantle rock, known as a what?", "Hotspot", ["Rift zone", "Subduction zone", "Transform fault"]),
    q(5, "What is a vent in the ground that releases steam and volcanic gases, without erupting lava, called?", "Fumarole", ["Maar", "Tuya", "Xenolith"]),
  ],
  // day 10
  [
    q(1, "What do we call the preserved remains or traces of ancient living things found in rock?", "Fossils", ["Minerals", "Artifacts", "Crystals"]),
    q(2, "Fossilized tree resin that sometimes traps ancient insects is called what?", "Amber", ["Jet", "Opal", "Agate"]),
    q(3, "Which extinct group of segmented marine arthropods, abundant in the Paleozoic era, is a classic fossil find?", "Trilobites", ["Ammonites", "Graptolites", "Crinoids"]),
    q(4, "What name is given to the fossil of a species that lived briefly but over a wide area, so it can date the rock layers where it is found?", "Index fossil", ["Trace fossil", "Body fossil", "Living fossil"]),
    q(5, "Uranium-238 decays through a long chain to which stable end product, used to date ancient zircon crystals?", "Lead-206", ["Lead-207", "Lead-208", "Bismuth-209"]),
  ],
  // day 11
  [
    q(1, "What is the main cause of Earth's ocean tides?", "The Moon", ["Solar flares", "Ocean winds", "Earth's magnetism"]),
    q(2, "A narrow, powerful channel of water flowing seaward from the beach, dangerous to swimmers, is called a what?", "Rip current", ["Swell", "Tidal bore", "Surge"]),
    q(3, "Benjamin Franklin helped chart which Atlantic current?", "Gulf Stream", ["Labrador Current", "Canary Current", "Humboldt Current"]),
    q(4, "What is the term for the rising of cold, nutrient-rich deep water to the ocean surface, often along western coasts?", "Upwelling", ["Downwelling", "Gyre", "Eddy"]),
    q(5, "Tidal charts show points in the ocean where the tidal range is nearly zero and the tide wave rotates around them. What are these called?", "Amphidromic points", ["Isostatic points", "Eustatic points", "Syzygy points"]),
  ],
  // day 12
  [
    q(1, "Which giant ocean wave is typically triggered by an undersea earthquake?", "Tsunami", ["Tidal bore", "Swell", "Whirlpool"]),
    q(2, "A hygrometer measures what?", "Humidity", ["Rainfall", "Wind direction", "Cloud height"]),
    q(3, "Which seismic waves, the fastest of all, are the first to arrive at a seismograph?", "Primary waves", ["Secondary waves", "Love waves", "Rayleigh waves"]),
    q(4, "Which scale rates an earthquake's intensity by its observed effects, using Roman numerals?", "Modified Mercalli scale", ["Richter scale", "Beaufort scale", "Fujita scale"]),
    q(5, "Which theory, formulated after the 1906 San Francisco earthquake, explains quakes as the sudden release of strain stored in rock?", "Elastic rebound theory", ["Seismic gap theory", "Dilatancy theory", "Isostatic rebound"]),
  ],
  // day 13
  [
    q(1, "Ice that builds from compacted snow and flows downhill under its own weight is called a what?", "Glacier", ["Iceberg", "Avalanche", "Blizzard"]),
    q(2, "Valleys carved by glaciers typically have a cross-section shaped like which letter?", "U", ["V", "L", "S"]),
    q(3, "What is the term for chunks of ice breaking off a glacier's seaward edge into the water?", "Calving", ["Surging", "Plucking", "Crevassing"]),
    q(4, "Which landform is a knife-edge ridge left between two neighboring glacial hollows?", "Arete", ["Cirque", "Horn", "Tarn"]),
    q(5, "Granular, partly compacted snow that has survived a summer but is not yet glacier ice is called what?", "Firn", ["Graupel", "Rime", "Sastrugi"]),
  ],
  // day 14
  [
    q(1, "Old Faithful in Yellowstone is the best-known example of which feature?", "Geyser", ["Oasis", "Waterfall", "Whirlpool"]),
    q(2, "Limestone, sandstone, and shale belong to which major rock group?", "Sedimentary", ["Igneous", "Metamorphic", "Plutonic"]),
    q(3, "The word monsoon comes from an Arabic word, mausim, meaning what?", "Season", ["Storm", "Flood", "Wind"]),
    q(4, "Streaks of rain that evaporate before reaching the ground are called what?", "Virga", ["Mammatus", "Graupel", "Squall"]),
    q(5, "Which wind of southern France takes its name from an Occitan word meaning masterly?", "Mistral", ["Bora", "Sirocco", "Levanter"]),
  ],
  // day 15
  [
    q(1, "What do we call a cloud that forms at ground level, reducing visibility?", "Fog", ["Smog", "Drizzle", "Sleet"]),
    q(2, "What is the dark, decayed organic material that enriches topsoil called?", "Humus", ["Gravel", "Silt", "Bedrock"]),
    q(3, "Which soil type, a balanced mix of sand, silt, and clay, is prized by gardeners?", "Loam", ["Peat", "Hardpan", "Scree"]),
    q(4, "Which iron- and aluminum-rich red soil is typical of hot, wet tropical regions?", "Laterite", ["Chernozem", "Loess", "Peat"]),
    q(5, "Which acidic, ash-gray soil, with a bleached leached layer, forms under cool coniferous forests?", "Podzol", ["Vertisol", "Oxisol", "Mollisol"]),
  ],
  // day 16
  [
    q(1, "Wet clothes dry on a line mainly through which process?", "Evaporation", ["Condensation", "Precipitation", "Deposition"]),
    q(2, "Evangelista Torricelli invented which pressure-measuring instrument in 1643?", "Barometer", ["Hygrometer", "Thermometer", "Rain gauge"]),
    q(3, "On a weather map, isobars drawn very close together indicate what?", "Strong winds", ["Heavy snow", "Rising temperatures", "Clear skies"]),
    q(4, "When a fast-moving cold front overtakes a warm front and lifts the warm air off the ground, what kind of front results?", "Occluded front", ["Stationary front", "Polar front", "Arctic front"]),
    q(5, "What is the cooling of rising air as it expands, without exchanging heat with its surroundings, called?", "Adiabatic cooling", ["Radiational cooling", "Evaporative cooling", "Advective cooling"]),
  ],
  // day 17
  [
    q(1, "At sea level, pure water freezes at how many degrees Celsius?", "0", ["32", "100", "-18"]),
    q(2, "What causes Earth's seasons?", "The tilt of Earth's axis", ["Earth's distance from the Sun", "The Moon's phases", "Solar flares"]),
    q(3, "Peruvian fishermen named which climate event for the Christ child because it tends to peak around Christmas?", "El Niño", ["La Niña", "Madden-Julian oscillation", "North Atlantic Oscillation"]),
    q(4, "What is the fraction of incoming sunlight that a surface reflects called?", "Albedo", ["Emissivity", "Insolation", "Opacity"]),
    q(5, "Shifts in Earth's orbital shape, axial tilt, and wobble, linked to the timing of ice ages, are known as which cycles?", "Milankovitch cycles", ["Hadley cycles", "Dansgaard-Oeschger cycles", "Rossby cycles"]),
  ],
  // day 18
  [
    q(1, "The Montreal Protocol of 1987 phased out CFCs to protect which part of the atmosphere?", "Ozone layer", ["Jet stream", "Ionosphere", "Tropopause"]),
    q(2, "Mares' tails is a popular name for which high clouds?", "Cirrus", ["Stratus", "Cumulus", "Nimbus"]),
    q(3, "A tropical cyclone is classed as a hurricane once its sustained winds reach at least how fast?", "74 mph", ["39 mph", "58 mph", "96 mph"]),
    q(4, "Which type of thunderstorm, defined by a persistently rotating updraft, produces most of the strongest tornadoes?", "Supercell", ["Squall line", "Multicell cluster", "Air-mass storm"]),
    q(5, "In what year did the United States adopt the Enhanced Fujita Scale for rating tornadoes?", "2007", ["1996", "2001", "2012"]),
  ],
  // day 19
  [
    q(1, "What do we call the tiny water droplets that condense on grass and other cool surfaces overnight?", "Dew", ["Rime", "Sleet", "Smog"]),
    q(2, "Which common light-colored igneous rock, rich in quartz and feldspar, cools slowly underground?", "Granite", ["Basalt", "Obsidian", "Slate"]),
    q(3, "Which mineral group, with thin peelable sheets, includes biotite and muscovite?", "Mica", ["Feldspar", "Garnet", "Amphibole"]),
    q(4, "Rubies and sapphires are gem varieties of which mineral, number 9 on the Mohs scale?", "Corundum", ["Beryl", "Spinel", "Topaz"]),
    q(5, "Opal, which lacks an ordered crystal structure, is classified as what rather than a true mineral?", "Mineraloid", ["Pseudomorph", "Polymorph", "Xenolith"]),
  ],
  // day 20
  [
    q(1, "How many main arms or sides does a typical snow crystal have?", "Six", ["Four", "Five", "Eight"]),
    q(2, "Which deep, steep-sided valley is carved by a river through rock over a long time?", "Canyon", ["Mesa", "Delta", "Dune"]),
    q(3, "A crescent-shaped lake left behind when a river cuts off a loop of its meander is called a what?", "Oxbow lake", ["Kettle lake", "Playa lake", "Crater lake"]),
    q(4, "Which fertile, dark, humus-rich grassland soil is typical of the Eurasian steppe?", "Chernozem", ["Laterite", "Podzol", "Regosol"]),
    q(5, "Which Greenlandic Inuit word names a rocky peak poking up through an ice sheet?", "Nunatak", ["Drumlin", "Inselberg", "Hoodoo"]),
  ],
  // day 21
  [
    q(1, "Which season comes right after winter in the Northern Hemisphere?", "Spring", ["Summer", "Autumn", "Wet season"]),
    q(2, "Which mineral is the natural form of table salt?", "Halite", ["Gypsum", "Calcite", "Pyrite"]),
    q(3, "Landscapes with sinkholes, caves, and disappearing streams, formed by the dissolving of limestone, are called what?", "Karst", ["Badlands", "Outwash plain", "Alluvial plain"]),
    q(4, "A mineral's powder color, seen by rubbing it on unglazed porcelain, is called its what?", "Streak", ["Luster", "Cleavage", "Fracture"]),
    q(5, "A down-dropped block between two parallel normal faults is called a what?", "Graben", ["Horst", "Nappe", "Klippe"]),
  ],
  // day 22
  [
    q(1, "What do we call the sudden shaking of the ground caused by rock slipping along a fault?", "Earthquake", ["Landslide", "Eruption", "Avalanche"]),
    q(2, "When the ground suddenly collapses into an underground cavity, often in limestone country, the hole is called a what?", "Sinkhole", ["Crevasse", "Crater", "Gully"]),
    q(3, "Alfred Wegener, who proposed continental drift in 1912, gave which name to the single ancient landmass he pictured?", "Pangaea", ["Rodinia", "Gondwana", "Laurasia"]),
    q(4, "When strong shaking makes water-saturated sandy soil behave like a liquid, the effect is called what?", "Liquefaction", ["Subsidence", "Solifluction", "Slumping"]),
    q(5, "Mirror-image stripes of alternating magnetic polarity flanking mid-ocean ridges supported which theory?", "Seafloor spreading", ["Isostasy", "Uniformitarianism", "Catastrophism"]),
  ],
];
