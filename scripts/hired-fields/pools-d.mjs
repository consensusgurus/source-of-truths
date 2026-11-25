// Hired question pools, part D: the first niche jobs (owner, 2026-11-25: "They
// can be very niche, like Excel tutor. Or a Chef."). Chef, Bartender and Pilot,
// one interview each: four questions per tier. Same shape as pools-a.mjs.
export const CULINARY = [
  [1, 'Knife Skills', 'Which knife is the all-purpose workhorse of most professional kitchens?', 'Chef\'s knife', ['Paring knife', 'Bread knife', 'Cleaver']],
  [1, 'Food Safety', 'Where should raw chicken be stored in a fridge, relative to ready-to-eat food?', 'Below it', ['Above it', 'Beside it', 'Anywhere, if covered']],
  [1, 'Cooking Methods', 'Cooking food quickly in a little hot fat while tossing it is called what?', 'Sautéing', ['Braising', 'Poaching', 'Steaming']],
  [1, 'Baking and Pastry', 'Which gas makes yeast bread dough rise?', 'Carbon dioxide', ['Oxygen', 'Nitrogen', 'Hydrogen']],

  [2, 'Sauces', 'Which of these is one of the five French mother sauces?', 'Béchamel', ['Pesto', 'Aioli', 'Chimichurri']],
  [2, 'Knife Skills', 'Cutting vegetables into thin matchsticks is called which cut?', 'Julienne', ['Brunoise', 'Chiffonade', 'Mince']],
  [2, 'Food Safety', 'The food safety danger zone, where bacteria multiply fastest, runs from 40°F up to what?', '140°F', ['100°F', '180°F', '212°F']],
  [2, 'Cooking Methods', 'Plunging vegetables briefly into boiling water and then ice water is called what?', 'Blanching', ['Basting', 'Searing', 'Deglazing']],

  [3, 'Sauces', 'A roux is equal parts fat and what, cooked together?', 'Flour', ['Sugar', 'Cornstarch', 'Egg yolk']],
  [3, 'Knife Skills', 'Rolling leafy herbs and slicing them into thin ribbons is called what?', 'Chiffonade', ['Julienne', 'Batonnet', 'Paysanne']],
  [3, 'Cooking Methods', 'Adding liquid to a hot pan to lift the browned bits off the bottom is called what?', 'Deglazing', ['Reducing', 'Clarifying', 'Tempering']],
  [3, 'Baking and Pastry', 'Creaming butter and sugar together mainly does what for a cake batter?', 'Beats in air', ['Melts the sugar', 'Develops gluten', 'Sets the eggs']],

  [4, 'Sauces', 'Hollandaise is an emulsion of butter, lemon juice and what?', 'Egg yolks', ['Cream', 'Mustard', 'Egg whites']],
  [4, 'Food Safety', 'Under US food safety guidance, poultry must reach what minimum internal temperature?', '165°F', ['145°F', '155°F', '180°F']],
  [4, 'Cooking Methods', 'The browning reaction between amino acids and sugars that flavors seared meat is called what?', 'Maillard reaction', ['Caramelization', 'Fermentation', 'Oxidation']],
  [4, 'Knife Skills', 'A brunoise is a fine dice of roughly what size on each side?', '1/8 inch', ['1/2 inch', '3/4 inch', '1 inch']],

  [5, 'Sauces', 'Which mother sauce is a light stock, such as chicken or veal, thickened with a blond roux?', 'Velouté', ['Espagnole', 'Béchamel', 'Sauce tomate']],
  [5, 'Baking and Pastry', 'Baker\'s percentages express every ingredient as a share of the weight of what?', 'The flour', ['The water', 'The whole dough', 'The sugar']],
  [5, 'Food Safety', 'The HACCP food safety system is built around identifying what?', 'Critical control points', ['Calorie counts', 'Allergen-free suppliers', 'Staffing levels']],
  [5, 'Cooking Methods', 'Cooking vacuum-sealed food in a precisely heated water bath is called what?', 'Sous vide', ['Confit', 'En papillote', 'Bain-marie']],
];

export const BARTENDING = [
  [1, 'Cocktails', 'A classic margarita is tequila, lime juice and what?', 'Orange liqueur', ['Sweet vermouth', 'Grenadine', 'Coffee liqueur']],
  [1, 'Spirits', 'By US law, bourbon must be made mostly from which grain?', 'Corn', ['Rye', 'Barley', 'Wheat']],
  [1, 'Bar Technique', 'A drink served on the rocks is served how?', 'Over ice', ['Without ice', 'Blended', 'Warm']],
  [1, 'Wine and Beer', 'Beer\'s bitterness comes mainly from which plant?', 'Hops', ['Barley', 'Juniper', 'Wheat']],

  [2, 'Cocktails', 'A mojito is built on which spirit?', 'White rum', ['Gin', 'Vodka', 'Tequila']],
  [2, 'Bar Technique', 'Ordering a martini dry means using less of what?', 'Vermouth', ['Gin', 'Ice', 'Olive brine']],
  [2, 'Spirits', 'Tequila is distilled from which plant?', 'Blue agave', ['Sugarcane', 'Prickly pear', 'Corn']],
  [2, 'Bar Service', 'The larger side of a standard US jigger usually holds how much?', '1.5 ounces', ['0.5 ounce', '3 ounces', '4 ounces']],

  [3, 'Cocktails', 'A Negroni is gin, sweet vermouth and which bitter Italian liqueur?', 'Campari', ['Aperol', 'Amaretto', 'Limoncello']],
  [3, 'Spirits', 'Which spirit takes its main flavor from juniper berries?', 'Gin', ['Vodka', 'Rum', 'Brandy']],
  [3, 'Wine and Beer', 'Prosecco is a sparkling wine from which country?', 'Italy', ['Spain', 'Portugal', 'Germany']],
  [3, 'Bar Technique', 'Why are drinks with citrus juice usually shaken rather than stirred?', 'To mix and aerate them', ['To keep them clear', 'To keep them warm', 'To avoid dilution']],

  [4, 'Cocktails', 'An Old Fashioned is whiskey, sugar, a little water and what?', 'Bitters', ['Vermouth', 'Lime juice', 'Soda water']],
  [4, 'Spirits', 'Scotch whisky must be aged in oak casks for at least how many years?', 'Three', ['One', 'Five', 'Ten']],
  [4, 'Wine and Beer', 'What makes a beer a lager rather than an ale?', 'Bottom-fermenting yeast at cooler temperatures', ['Brewing with wheat', 'A higher alcohol level', 'Hops added after brewing']],
  [4, 'Bar Technique', 'In bartending, muddling means doing what?', 'Pressing ingredients to release their flavor', ['Stirring with ice', 'Layering liqueurs', 'Rinsing a glass with spirit']],

  [5, 'Spirits', 'Cognac is a grape brandy from which country?', 'France', ['Spain', 'Italy', 'Portugal']],
  [5, 'Cocktails', 'A classic Sazerac rinses its glass with which spirit?', 'Absinthe', ['Bourbon', 'Gin', 'Mezcal']],
  [5, 'Wine and Beer', 'In the traditional method used for Champagne, where does the second fermentation happen?', 'In the bottle', ['In steel tanks', 'In oak barrels', 'In open vats']],
  [5, 'Bar Service', 'In the US, a spirit\'s proof is what multiple of its alcohol by volume?', 'Two', ['One and a half', 'Three', 'Ten']],
];

export const AVIATION = [
  [1, 'Flight Basics', 'The four forces on an airplane in flight are lift, weight, thrust and what?', 'Drag', ['Torque', 'Pitch', 'Spin']],
  [1, 'Radio and Procedures', 'In the aviation phonetic alphabet, which word stands for the letter B?', 'Bravo', ['Baker', 'Boston', 'Beta']],
  [1, 'Aircraft Systems', 'Which control surfaces on the wings make an airplane roll?', 'Ailerons', ['Elevators', 'Rudder', 'Flaps']],
  [1, 'Navigation', 'Which instrument shows how high an airplane is flying?', 'Altimeter', ['Airspeed indicator', 'Tachometer', 'Magnetic compass']],

  [2, 'Navigation', 'A runway numbered 27 points roughly toward which magnetic heading?', '270 degrees (west)', ['090 degrees (east)', '360 degrees (north)', '180 degrees (south)']],
  [2, 'Radio and Procedures', 'Which transponder code signals a general emergency?', '7700', ['1200', '7500', '7600']],
  [2, 'Aircraft Systems', 'The elevator controls an airplane\'s movement about which axis?', 'Pitch', ['Roll', 'Yaw', 'Heading']],
  [2, 'Weather', 'Which cloud type is most associated with thunderstorms?', 'Cumulonimbus', ['Cirrus', 'Stratus', 'Altostratus']],

  [3, 'Radio and Procedures', 'Squawking transponder code 7600 tells controllers what?', 'The radio has failed', ['A hijacking is underway', 'The engine has failed', 'The flight is VFR']],
  [3, 'Navigation', 'In aviation, a knot is one what per hour?', 'Nautical mile', ['Statute mile', 'Kilometer', 'Thousand feet']],
  [3, 'Weather', 'What is a METAR?', 'A routine airport weather report', ['A flight plan form', 'A navigation beacon', 'A runway lighting system']],
  [3, 'Flight Basics', 'What happens when a wing exceeds its critical angle of attack?', 'It stalls', ['It gains lift', 'It flutters', 'It ices over']],

  [4, 'Aircraft Systems', 'In a piston airplane, carburetor ice is most likely in what kind of air?', 'Cool, humid air', ['Hot, dry air', 'Only air below freezing', 'Only heavy rain']],
  [4, 'Navigation', 'What does a VOR station give a pilot?', 'A bearing to or from the station', ['Distance to the nearest airport', 'Wind speed', 'Height above the ground']],
  [4, 'Weather', 'In the standard atmosphere, temperature drops about how much per 1,000 feet of climb?', '2°C', ['0.5°C', '5°C', '10°C']],
  [4, 'Radio and Procedures', 'To declare distress on the radio, how many times is "Mayday" said?', 'Three', ['One', 'Two', 'Five']],

  [5, 'Navigation', 'Under US rules, VFR flights above 3,000 feet on an easterly magnetic course cruise at odd thousands plus what?', '500 feet', ['0 feet', '250 feet', '1,000 feet']],
  [5, 'Flight Basics', 'On an airspeed indicator, the stall speed in landing configuration is the bottom of which arc?', 'The white arc', ['The green arc', 'The yellow arc', 'The red line']],
  [5, 'Weather', 'Standard sea-level pressure is how many inches of mercury?', '29.92', ['30.12', '28.86', '31.00']],
  [5, 'Aircraft Systems', 'What does a turbocharger do for a piston aircraft engine?', 'Compresses intake air to hold power at altitude', ['Cools the exhaust', 'Adds fuel at idle', 'Spins the propeller directly']],
];
