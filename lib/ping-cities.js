// City atlas + geo helpers for Ping, the daily city hunt.
//
// One secret city a day (app/ping/puzzles.js). Players guess a city; every
// guess returns the great-circle distance in miles to the secret city (no
// direction). This file is the guessable universe: a set of
// well-known world cities with coordinates and a few common aliases. It is
// imported by the client for autocomplete + client-side distance math, so it
// stays lean (names + coords, no per-day answers). The daily answer city always
// appears in this list too, so it is always a valid guess.
//
// Coordinates are decimal degrees, north/east positive. `aliases` catch the
// common alternate spellings and nicknames a player might type. Keep entries
// unique by (name, country); if you add a target city to the bank, add it here.
//
// Autocomplete searches COUNTRIES as well as city names (owner rule,
// 2026-08-23): a player who knows the target is in Japan but cannot bring a
// Japanese city to mind types "japan" and gets Tokyo, Osaka, Kyoto. Country
// matches always rank BELOW city-name prefix matches, so typing a city name
// never has its own city pushed off the list by its country's other cities.

export const CITIES = [
  // ── North America ────────────────────────────────────────────────────────
  { name: 'New York', country: 'United States', lat: 40.7128, lng: -74.006, aliases: ['nyc', 'new york city'] },
  { name: 'Los Angeles', country: 'United States', lat: 34.0522, lng: -118.2437, aliases: ['la'] },
  { name: 'Chicago', country: 'United States', lat: 41.8781, lng: -87.6298 },
  { name: 'San Francisco', country: 'United States', lat: 37.7749, lng: -122.4194, aliases: ['sf'] },
  { name: 'Miami', country: 'United States', lat: 25.7617, lng: -80.1918 },
  { name: 'Seattle', country: 'United States', lat: 47.6062, lng: -122.3321 },
  { name: 'Boston', country: 'United States', lat: 42.3601, lng: -71.0589 },
  { name: 'Washington', country: 'United States', lat: 38.9072, lng: -77.0369, aliases: ['washington dc', 'dc'] },
  { name: 'Denver', country: 'United States', lat: 39.7392, lng: -104.9903 },
  { name: 'Dallas', country: 'United States', lat: 32.7767, lng: -96.797 },
  { name: 'Houston', country: 'United States', lat: 29.7604, lng: -95.3698 },
  { name: 'Atlanta', country: 'United States', lat: 33.749, lng: -84.388 },
  { name: 'Las Vegas', country: 'United States', lat: 36.1699, lng: -115.1398, aliases: ['vegas'] },
  { name: 'New Orleans', country: 'United States', lat: 29.9511, lng: -90.0715 },
  { name: 'Toronto', country: 'Canada', lat: 43.6532, lng: -79.3832 },
  { name: 'Montreal', country: 'Canada', lat: 45.5017, lng: -73.5673 },
  { name: 'Vancouver', country: 'Canada', lat: 49.2827, lng: -123.1207 },
  { name: 'Mexico City', country: 'Mexico', lat: 19.4326, lng: -99.1332, aliases: ['cdmx'] },
  { name: 'Guadalajara', country: 'Mexico', lat: 20.6597, lng: -103.3496 },
  { name: 'Cancun', country: 'Mexico', lat: 21.1619, lng: -86.8515 },
  { name: 'Havana', country: 'Cuba', lat: 23.1136, lng: -82.3666 },
  { name: 'Panama City', country: 'Panama', lat: 8.9824, lng: -79.5199 },
  { name: 'San Jose', country: 'Costa Rica', lat: 9.9281, lng: -84.0907 },

  // ── South America ────────────────────────────────────────────────────────
  { name: 'Bogota', country: 'Colombia', lat: 4.711, lng: -74.0721 },
  { name: 'Lima', country: 'Peru', lat: -12.0464, lng: -77.0428 },
  { name: 'Santiago', country: 'Chile', lat: -33.4489, lng: -70.6693 },
  { name: 'Buenos Aires', country: 'Argentina', lat: -34.6037, lng: -58.3816 },
  { name: 'Rio de Janeiro', country: 'Brazil', lat: -22.9068, lng: -43.1729, aliases: ['rio'] },
  { name: 'Sao Paulo', country: 'Brazil', lat: -23.5505, lng: -46.6333 },
  { name: 'Brasilia', country: 'Brazil', lat: -15.7939, lng: -47.8828 },
  { name: 'Quito', country: 'Ecuador', lat: -0.1807, lng: -78.4678 },
  { name: 'Caracas', country: 'Venezuela', lat: 10.4806, lng: -66.9036 },
  { name: 'La Paz', country: 'Bolivia', lat: -16.4897, lng: -68.1193 },
  { name: 'Montevideo', country: 'Uruguay', lat: -34.9011, lng: -56.1645 },

  // ── Europe ───────────────────────────────────────────────────────────────
  { name: 'London', country: 'United Kingdom', lat: 51.5074, lng: -0.1278 },
  { name: 'Edinburgh', country: 'United Kingdom', lat: 55.9533, lng: -3.1883 },
  { name: 'Dublin', country: 'Ireland', lat: 53.3498, lng: -6.2603 },
  { name: 'Paris', country: 'France', lat: 48.8566, lng: 2.3522 },
  { name: 'Marseille', country: 'France', lat: 43.2965, lng: 5.3698 },
  { name: 'Madrid', country: 'Spain', lat: 40.4168, lng: -3.7038 },
  { name: 'Barcelona', country: 'Spain', lat: 41.3874, lng: 2.1686 },
  { name: 'Lisbon', country: 'Portugal', lat: 38.7223, lng: -9.1393 },
  { name: 'Rome', country: 'Italy', lat: 41.9028, lng: 12.4964 },
  { name: 'Milan', country: 'Italy', lat: 45.4642, lng: 9.19 },
  { name: 'Venice', country: 'Italy', lat: 45.4408, lng: 12.3155 },
  { name: 'Naples', country: 'Italy', lat: 40.8518, lng: 14.2681 },
  { name: 'Amsterdam', country: 'Netherlands', lat: 52.3676, lng: 4.9041 },
  { name: 'Brussels', country: 'Belgium', lat: 50.8503, lng: 4.3517 },
  { name: 'Berlin', country: 'Germany', lat: 52.52, lng: 13.405 },
  { name: 'Munich', country: 'Germany', lat: 48.1351, lng: 11.582 },
  { name: 'Frankfurt', country: 'Germany', lat: 50.1109, lng: 8.6821 },
  { name: 'Hamburg', country: 'Germany', lat: 53.5511, lng: 9.9937 },
  { name: 'Zurich', country: 'Switzerland', lat: 47.3769, lng: 8.5417 },
  { name: 'Geneva', country: 'Switzerland', lat: 46.2044, lng: 6.1432 },
  { name: 'Vienna', country: 'Austria', lat: 48.2082, lng: 16.3738 },
  { name: 'Prague', country: 'Czechia', lat: 50.0755, lng: 14.4378 },
  { name: 'Warsaw', country: 'Poland', lat: 52.2297, lng: 21.0122 },
  { name: 'Budapest', country: 'Hungary', lat: 47.4979, lng: 19.0402 },
  { name: 'Copenhagen', country: 'Denmark', lat: 55.6761, lng: 12.5683 },
  { name: 'Stockholm', country: 'Sweden', lat: 59.3293, lng: 18.0686 },
  { name: 'Oslo', country: 'Norway', lat: 59.9139, lng: 10.7522 },
  { name: 'Helsinki', country: 'Finland', lat: 60.1699, lng: 24.9384 },
  { name: 'Reykjavik', country: 'Iceland', lat: 64.1466, lng: -21.9426 },
  { name: 'Athens', country: 'Greece', lat: 37.9838, lng: 23.7275 },
  { name: 'Istanbul', country: 'Turkey', lat: 41.0082, lng: 28.9784 },
  { name: 'Moscow', country: 'Russia', lat: 55.7558, lng: 37.6173 },
  { name: 'Saint Petersburg', country: 'Russia', lat: 59.9311, lng: 30.3609, aliases: ['st petersburg'] },
  { name: 'Kyiv', country: 'Ukraine', lat: 50.4501, lng: 30.5234, aliases: ['kiev'] },
  { name: 'Bucharest', country: 'Romania', lat: 44.4268, lng: 26.1025 },
  { name: 'Belgrade', country: 'Serbia', lat: 44.7866, lng: 20.4489 },

  // ── Africa ───────────────────────────────────────────────────────────────
  { name: 'Cairo', country: 'Egypt', lat: 30.0444, lng: 31.2357 },
  { name: 'Casablanca', country: 'Morocco', lat: 33.5731, lng: -7.5898 },
  { name: 'Marrakech', country: 'Morocco', lat: 31.6295, lng: -7.9811 },
  { name: 'Tunis', country: 'Tunisia', lat: 36.8065, lng: 10.1815 },
  { name: 'Lagos', country: 'Nigeria', lat: 6.5244, lng: 3.3792 },
  { name: 'Accra', country: 'Ghana', lat: 5.6037, lng: -0.187 },
  { name: 'Nairobi', country: 'Kenya', lat: -1.2921, lng: 36.8219 },
  { name: 'Addis Ababa', country: 'Ethiopia', lat: 9.032, lng: 38.7469 },
  { name: 'Dar es Salaam', country: 'Tanzania', lat: -6.7924, lng: 39.2083 },
  { name: 'Kinshasa', country: 'DR Congo', lat: -4.4419, lng: 15.2663 },
  { name: 'Johannesburg', country: 'South Africa', lat: -26.2041, lng: 28.0473 },
  { name: 'Cape Town', country: 'South Africa', lat: -33.9249, lng: 18.4241 },
  { name: 'Dakar', country: 'Senegal', lat: 14.7167, lng: -17.4677 },

  // ── Middle East & Central Asia ───────────────────────────────────────────
  { name: 'Jerusalem', country: 'Israel', lat: 31.7683, lng: 35.2137 },
  { name: 'Tel Aviv', country: 'Israel', lat: 32.0853, lng: 34.7818 },
  { name: 'Beirut', country: 'Lebanon', lat: 33.8938, lng: 35.5018 },
  { name: 'Amman', country: 'Jordan', lat: 31.9454, lng: 35.9284 },
  { name: 'Riyadh', country: 'Saudi Arabia', lat: 24.7136, lng: 46.6753 },
  { name: 'Dubai', country: 'United Arab Emirates', lat: 25.2048, lng: 55.2708 },
  { name: 'Doha', country: 'Qatar', lat: 25.2854, lng: 51.531 },
  { name: 'Tehran', country: 'Iran', lat: 35.6892, lng: 51.389 },
  { name: 'Baghdad', country: 'Iraq', lat: 33.3152, lng: 44.3661 },
  { name: 'Tashkent', country: 'Uzbekistan', lat: 41.2995, lng: 69.2401 },
  { name: 'Almaty', country: 'Kazakhstan', lat: 43.222, lng: 76.8512 },

  // ── South & Southeast Asia ───────────────────────────────────────────────
  { name: 'Mumbai', country: 'India', lat: 19.076, lng: 72.8777, aliases: ['bombay'] },
  { name: 'Delhi', country: 'India', lat: 28.7041, lng: 77.1025, aliases: ['new delhi'] },
  { name: 'Bengaluru', country: 'India', lat: 12.9716, lng: 77.5946, aliases: ['bangalore'] },
  { name: 'Kolkata', country: 'India', lat: 22.5726, lng: 88.3639, aliases: ['calcutta'] },
  { name: 'Chennai', country: 'India', lat: 13.0827, lng: 80.2707, aliases: ['madras'] },
  { name: 'Karachi', country: 'Pakistan', lat: 24.8607, lng: 67.0011 },
  { name: 'Lahore', country: 'Pakistan', lat: 31.5204, lng: 74.3587 },
  { name: 'Dhaka', country: 'Bangladesh', lat: 23.8103, lng: 90.4125 },
  { name: 'Kathmandu', country: 'Nepal', lat: 27.7172, lng: 85.324 },
  { name: 'Colombo', country: 'Sri Lanka', lat: 6.9271, lng: 79.8612 },
  { name: 'Bangkok', country: 'Thailand', lat: 13.7563, lng: 100.5018 },
  { name: 'Hanoi', country: 'Vietnam', lat: 21.0278, lng: 105.8342 },
  { name: 'Ho Chi Minh City', country: 'Vietnam', lat: 10.8231, lng: 106.6297, aliases: ['saigon'] },
  { name: 'Singapore', country: 'Singapore', lat: 1.3521, lng: 103.8198 },
  { name: 'Kuala Lumpur', country: 'Malaysia', lat: 3.139, lng: 101.6869 },
  { name: 'Jakarta', country: 'Indonesia', lat: -6.2088, lng: 106.8456 },
  { name: 'Bali', country: 'Indonesia', lat: -8.4095, lng: 115.1889, aliases: ['denpasar'] },
  { name: 'Manila', country: 'Philippines', lat: 14.5995, lng: 120.9842 },
  { name: 'Phnom Penh', country: 'Cambodia', lat: 11.5564, lng: 104.9282 },

  // ── East Asia ────────────────────────────────────────────────────────────
  { name: 'Tokyo', country: 'Japan', lat: 35.6762, lng: 139.6503 },
  { name: 'Osaka', country: 'Japan', lat: 34.6937, lng: 135.5023 },
  { name: 'Kyoto', country: 'Japan', lat: 35.0116, lng: 135.7681 },
  { name: 'Seoul', country: 'South Korea', lat: 37.5665, lng: 126.978 },
  { name: 'Beijing', country: 'China', lat: 39.9042, lng: 116.4074 },
  { name: 'Shanghai', country: 'China', lat: 31.2304, lng: 121.4737 },
  { name: 'Hong Kong', country: 'China', lat: 22.3193, lng: 114.1694 },
  { name: 'Guangzhou', country: 'China', lat: 23.1291, lng: 113.2644 },
  { name: 'Chengdu', country: 'China', lat: 30.5728, lng: 104.0668 },
  { name: 'Taipei', country: 'Taiwan', lat: 25.033, lng: 121.5654 },
  { name: 'Ulaanbaatar', country: 'Mongolia', lat: 47.8864, lng: 106.9057 },

  // ── Oceania ──────────────────────────────────────────────────────────────
  { name: 'Sydney', country: 'Australia', lat: -33.8688, lng: 151.2093 },
  { name: 'Melbourne', country: 'Australia', lat: -37.8136, lng: 144.9631 },
  { name: 'Brisbane', country: 'Australia', lat: -27.4698, lng: 153.0251 },
  { name: 'Perth', country: 'Australia', lat: -31.9505, lng: 115.8605 },
  { name: 'Auckland', country: 'New Zealand', lat: -36.8485, lng: 174.7633 },
  { name: 'Wellington', country: 'New Zealand', lat: -41.2865, lng: 174.7762 },
  { name: 'Honolulu', country: 'United States', lat: 21.3069, lng: -157.8583 },
  { name: 'Suva', country: 'Fiji', lat: -18.1248, lng: 178.4501 },
  { name: 'Philadelphia', country: 'United States', lat: 39.9526, lng: -75.1652, aliases: ['philly'] },
  { name: 'Phoenix', country: 'United States', lat: 33.4484, lng: -112.074 },
  { name: 'San Diego', country: 'United States', lat: 32.7157, lng: -117.1611 },
  { name: 'San Antonio', country: 'United States', lat: 29.4241, lng: -98.4936 },
  { name: 'Austin', country: 'United States', lat: 30.2672, lng: -97.7431 },
  { name: 'Nashville', country: 'United States', lat: 36.1627, lng: -86.7816 },
  { name: 'Portland', country: 'United States', lat: 45.5152, lng: -122.6784 },
  { name: 'Minneapolis', country: 'United States', lat: 44.9778, lng: -93.265 },
  { name: 'Detroit', country: 'United States', lat: 42.3314, lng: -83.0458 },
  { name: 'Salt Lake City', country: 'United States', lat: 40.7608, lng: -111.891 },
  { name: 'St. Louis', country: 'United States', lat: 38.627, lng: -90.1994 },
  { name: 'Pittsburgh', country: 'United States', lat: 40.4406, lng: -79.9959 },
  { name: 'Charlotte', country: 'United States', lat: 35.2271, lng: -80.8431 },
  { name: 'Orlando', country: 'United States', lat: 28.5383, lng: -81.3792 },
  { name: 'Tampa', country: 'United States', lat: 27.9506, lng: -82.4572 },
  { name: 'Cleveland', country: 'United States', lat: 41.4993, lng: -81.6944 },
  { name: 'Sacramento', country: 'United States', lat: 38.5816, lng: -121.4944 },
  { name: 'Columbus', country: 'United States', lat: 39.9612, lng: -82.9988 },
  { name: 'Indianapolis', country: 'United States', lat: 39.7684, lng: -86.1581 },
  { name: 'Kansas City', country: 'United States', lat: 39.0997, lng: -94.5786 },
  { name: 'Anchorage', country: 'United States', lat: 61.2181, lng: -149.9003 },
  { name: 'San Juan', country: 'Puerto Rico', lat: 18.4655, lng: -66.1057 },
  { name: 'Calgary', country: 'Canada', lat: 51.0447, lng: -114.0719 },
  { name: 'Ottawa', country: 'Canada', lat: 45.4215, lng: -75.6972 },
  { name: 'Edmonton', country: 'Canada', lat: 53.5461, lng: -113.4938 },
  { name: 'Winnipeg', country: 'Canada', lat: 49.8951, lng: -97.1384 },
  { name: 'Quebec City', country: 'Canada', lat: 46.8139, lng: -71.208 },
  { name: 'Halifax', country: 'Canada', lat: 44.6488, lng: -63.5752 },
  { name: 'Guatemala City', country: 'Guatemala', lat: 14.6349, lng: -90.5069 },
  { name: 'San Salvador', country: 'El Salvador', lat: 13.6929, lng: -89.2182 },
  { name: 'Managua', country: 'Nicaragua', lat: 12.1149, lng: -86.2362 },
  { name: 'Kingston', country: 'Jamaica', lat: 17.9714, lng: -76.7929 },
  { name: 'Santo Domingo', country: 'Dominican Republic', lat: 18.4861, lng: -69.9312 },
  { name: 'Nassau', country: 'Bahamas', lat: 25.0443, lng: -77.3504 },
  { name: 'Medellin', country: 'Colombia', lat: 6.2442, lng: -75.5812 },
  { name: 'Cartagena', country: 'Colombia', lat: 10.391, lng: -75.4794 },
  { name: 'Guayaquil', country: 'Ecuador', lat: -2.171, lng: -79.9224 },
  { name: 'Cusco', country: 'Peru', lat: -13.532, lng: -71.9675, aliases: ['cuzco'] },
  { name: 'Rosario', country: 'Argentina', lat: -32.9468, lng: -60.6393 },
  { name: 'Salvador', country: 'Brazil', lat: -12.9777, lng: -38.5016 },
  { name: 'Recife', country: 'Brazil', lat: -8.0476, lng: -34.877 },
  { name: 'Belo Horizonte', country: 'Brazil', lat: -19.9167, lng: -43.9345 },
  { name: 'Curitiba', country: 'Brazil', lat: -25.4284, lng: -49.2733 },
  { name: 'Asuncion', country: 'Paraguay', lat: -25.2637, lng: -57.5759 },
  { name: 'Nice', country: 'France', lat: 43.7102, lng: 7.262 },
  { name: 'Lyon', country: 'France', lat: 45.764, lng: 4.8357 },
  { name: 'Bordeaux', country: 'France', lat: 44.8378, lng: -0.5792 },
  { name: 'Toulouse', country: 'France', lat: 43.6047, lng: 1.4442 },
  { name: 'Nantes', country: 'France', lat: 47.2184, lng: -1.5536 },
  { name: 'Strasbourg', country: 'France', lat: 48.5734, lng: 7.7521 },
  { name: 'Seville', country: 'Spain', lat: 37.3891, lng: -5.9845, aliases: ['sevilla'] },
  { name: 'Valencia', country: 'Spain', lat: 39.4699, lng: -0.3763 },
  { name: 'Malaga', country: 'Spain', lat: 36.7213, lng: -4.4214 },
  { name: 'Bilbao', country: 'Spain', lat: 43.263, lng: -2.935 },
  { name: 'Palma', country: 'Spain', lat: 39.5696, lng: 2.6502, aliases: ['palma de mallorca'] },
  { name: 'Porto', country: 'Portugal', lat: 41.1579, lng: -8.6291, aliases: ['oporto'] },
  { name: 'Florence', country: 'Italy', lat: 43.7696, lng: 11.2558, aliases: ['firenze'] },
  { name: 'Turin', country: 'Italy', lat: 45.0703, lng: 7.6869, aliases: ['torino'] },
  { name: 'Bologna', country: 'Italy', lat: 44.4949, lng: 11.3426 },
  { name: 'Palermo', country: 'Italy', lat: 38.1157, lng: 13.3615 },
  { name: 'Cologne', country: 'Germany', lat: 50.9375, lng: 6.9603, aliases: ['koln'] },
  { name: 'Stuttgart', country: 'Germany', lat: 48.7758, lng: 9.1829 },
  { name: 'Dusseldorf', country: 'Germany', lat: 51.2277, lng: 6.7735 },
  { name: 'Rotterdam', country: 'Netherlands', lat: 51.9244, lng: 4.4777 },
  { name: 'The Hague', country: 'Netherlands', lat: 52.0705, lng: 4.3007, aliases: ['den haag'] },
  { name: 'Antwerp', country: 'Belgium', lat: 51.2194, lng: 4.4025 },
  { name: 'Gothenburg', country: 'Sweden', lat: 57.7089, lng: 11.9746 },
  { name: 'Bergen', country: 'Norway', lat: 60.3913, lng: 5.3221 },
  { name: 'Krakow', country: 'Poland', lat: 50.0647, lng: 19.945, aliases: ['cracow'] },
  { name: 'Gdansk', country: 'Poland', lat: 54.352, lng: 18.6466 },
  { name: 'Wroclaw', country: 'Poland', lat: 51.1079, lng: 17.0385 },
  { name: 'Thessaloniki', country: 'Greece', lat: 40.6401, lng: 22.9444 },
  { name: 'Lviv', country: 'Ukraine', lat: 49.8397, lng: 24.0297 },
  { name: 'Zagreb', country: 'Croatia', lat: 45.815, lng: 15.9819 },
  { name: 'Split', country: 'Croatia', lat: 43.5081, lng: 16.4402 },
  { name: 'Dubrovnik', country: 'Croatia', lat: 42.6507, lng: 18.0944 },
  { name: 'Ljubljana', country: 'Slovenia', lat: 46.0569, lng: 14.5058 },
  { name: 'Bratislava', country: 'Slovakia', lat: 48.1486, lng: 17.1077 },
  { name: 'Sofia', country: 'Bulgaria', lat: 42.6977, lng: 23.3219 },
  { name: 'Tallinn', country: 'Estonia', lat: 59.437, lng: 24.7536 },
  { name: 'Riga', country: 'Latvia', lat: 56.9496, lng: 24.1052 },
  { name: 'Vilnius', country: 'Lithuania', lat: 54.6872, lng: 25.2797 },
  { name: 'Valletta', country: 'Malta', lat: 35.8989, lng: 14.5146 },
  { name: 'Nicosia', country: 'Cyprus', lat: 35.1856, lng: 33.3823 },
  { name: 'Luxembourg', country: 'Luxembourg', lat: 49.6116, lng: 6.1319 },
  { name: 'Monaco', country: 'Monaco', lat: 43.7384, lng: 7.4246, aliases: ['monte carlo'] },
  { name: 'Jeddah', country: 'Saudi Arabia', lat: 21.4858, lng: 39.1925 },
  { name: 'Mecca', country: 'Saudi Arabia', lat: 21.3891, lng: 39.8579, aliases: ['makkah'] },
  { name: 'Abu Dhabi', country: 'United Arab Emirates', lat: 24.4539, lng: 54.3773 },
  { name: 'Kuwait City', country: 'Kuwait', lat: 29.3759, lng: 47.9774 },
  { name: 'Manama', country: 'Bahrain', lat: 26.2285, lng: 50.586 },
  { name: 'Muscat', country: 'Oman', lat: 23.588, lng: 58.3829 },
  { name: 'Damascus', country: 'Syria', lat: 33.5138, lng: 36.2765 },
  { name: 'Kabul', country: 'Afghanistan', lat: 34.5553, lng: 69.2075 },
  { name: 'Tbilisi', country: 'Georgia', lat: 41.7151, lng: 44.8271 },
  { name: 'Yerevan', country: 'Armenia', lat: 40.1792, lng: 44.4991 },
  { name: 'Baku', country: 'Azerbaijan', lat: 40.4093, lng: 49.8671 },
  { name: 'Ashgabat', country: 'Turkmenistan', lat: 37.9601, lng: 58.3261 },
  { name: 'Bishkek', country: 'Kyrgyzstan', lat: 42.8746, lng: 74.5698 },
  { name: 'Algiers', country: 'Algeria', lat: 36.7538, lng: 3.0588 },
  { name: 'Tripoli', country: 'Libya', lat: 32.8872, lng: 13.1913 },
  { name: 'Khartoum', country: 'Sudan', lat: 15.5007, lng: 32.5599 },
  { name: 'Kampala', country: 'Uganda', lat: 0.3476, lng: 32.5825 },
  { name: 'Kigali', country: 'Rwanda', lat: -1.9441, lng: 30.0619 },
  { name: 'Luanda', country: 'Angola', lat: -8.839, lng: 13.2894 },
  { name: 'Harare', country: 'Zimbabwe', lat: -17.8252, lng: 31.0335 },
  { name: 'Lusaka', country: 'Zambia', lat: -15.3875, lng: 28.3228 },
  { name: 'Maputo', country: 'Mozambique', lat: -25.9692, lng: 32.5732 },
  { name: 'Abidjan', country: 'Ivory Coast', lat: 5.36, lng: -4.0083 },
  { name: 'Bamako', country: 'Mali', lat: 12.6392, lng: -8.0029 },
  { name: 'Yaounde', country: 'Cameroon', lat: 3.848, lng: 11.5021 },
  { name: 'Durban', country: 'South Africa', lat: -29.8587, lng: 31.0218 },
  { name: 'Pretoria', country: 'South Africa', lat: -25.7479, lng: 28.2293 },
  { name: 'Mombasa', country: 'Kenya', lat: -4.0435, lng: 39.6682 },
  { name: 'Sapporo', country: 'Japan', lat: 43.0618, lng: 141.3545 },
  { name: 'Fukuoka', country: 'Japan', lat: 33.5904, lng: 130.4017 },
  { name: 'Nagoya', country: 'Japan', lat: 35.1815, lng: 136.9066 },
  { name: 'Busan', country: 'South Korea', lat: 35.1796, lng: 129.0756 },
  { name: 'Shenzhen', country: 'China', lat: 22.5431, lng: 114.0579 },
  { name: 'Chongqing', country: 'China', lat: 29.4316, lng: 106.9123 },
  { name: 'Wuhan', country: 'China', lat: 30.5928, lng: 114.3055 },
  { name: 'Xian', country: 'China', lat: 34.3416, lng: 108.9398, aliases: ['xi an', "xi'an"] },
  { name: 'Nanjing', country: 'China', lat: 32.0603, lng: 118.7969 },
  { name: 'Hangzhou', country: 'China', lat: 30.2741, lng: 120.1551 },
  { name: 'Macau', country: 'China', lat: 22.1987, lng: 113.5439, aliases: ['macao'] },
  { name: 'Surabaya', country: 'Indonesia', lat: -7.2575, lng: 112.7521 },
  { name: 'Bandung', country: 'Indonesia', lat: -6.9175, lng: 107.6191 },
  { name: 'Cebu', country: 'Philippines', lat: 10.3157, lng: 123.8854 },
  { name: 'Chiang Mai', country: 'Thailand', lat: 18.7883, lng: 98.9853 },
  { name: 'Da Nang', country: 'Vietnam', lat: 16.0544, lng: 108.2022 },
  { name: 'Yangon', country: 'Myanmar', lat: 16.8409, lng: 96.1735, aliases: ['rangoon'] },
  { name: 'Vientiane', country: 'Laos', lat: 17.9757, lng: 102.6331 },
  { name: 'Islamabad', country: 'Pakistan', lat: 33.6844, lng: 73.0479 },
  { name: 'Hyderabad', country: 'India', lat: 17.385, lng: 78.4867 },
  { name: 'Ahmedabad', country: 'India', lat: 23.0225, lng: 72.5714 },
  { name: 'Jaipur', country: 'India', lat: 26.9124, lng: 75.7873 },
  { name: 'Pune', country: 'India', lat: 18.5204, lng: 73.8567 },
  { name: 'Male', country: 'Maldives', lat: 4.1755, lng: 73.5093 },
  { name: 'Adelaide', country: 'Australia', lat: -34.9285, lng: 138.6007 },
  { name: 'Canberra', country: 'Australia', lat: -35.2809, lng: 149.13 },
  { name: 'Gold Coast', country: 'Australia', lat: -28.0167, lng: 153.4 },
  { name: 'Hobart', country: 'Australia', lat: -42.8821, lng: 147.3272 },
  { name: 'Christchurch', country: 'New Zealand', lat: -43.5321, lng: 172.6362 },
  { name: 'Queenstown', country: 'New Zealand', lat: -45.0312, lng: 168.6626 },
  { name: 'Port Moresby', country: 'Papua New Guinea', lat: -9.4438, lng: 147.1803 },
  { name: 'Noumea', country: 'New Caledonia', lat: -22.2758, lng: 166.458 },
  { name: 'Papeete', country: 'French Polynesia', lat: -17.5516, lng: -149.5585 },
];

// Continent per country, for the one free "reveal the continent" hint. Every
// country used by a CITIES entry is covered; anything unmapped falls back to
// 'Asia' (the largest bucket) so the hint never comes back blank.
const CONTINENT = {
  'United States': 'North America', Canada: 'North America', Mexico: 'North America',
  Cuba: 'North America', Panama: 'North America', 'Costa Rica': 'North America',
  Colombia: 'South America', Peru: 'South America', Chile: 'South America',
  Argentina: 'South America', Brazil: 'South America', Ecuador: 'South America',
  Venezuela: 'South America', Bolivia: 'South America', Uruguay: 'South America',
  'United Kingdom': 'Europe', Ireland: 'Europe', France: 'Europe', Spain: 'Europe',
  Portugal: 'Europe', Italy: 'Europe', Netherlands: 'Europe', Belgium: 'Europe',
  Germany: 'Europe', Switzerland: 'Europe', Austria: 'Europe', Czechia: 'Europe',
  Poland: 'Europe', Hungary: 'Europe', Denmark: 'Europe', Sweden: 'Europe',
  Norway: 'Europe', Finland: 'Europe', Iceland: 'Europe', Greece: 'Europe',
  Turkey: 'Europe', Russia: 'Europe', Ukraine: 'Europe', Romania: 'Europe', Serbia: 'Europe',
  Egypt: 'Africa', Morocco: 'Africa', Tunisia: 'Africa', Nigeria: 'Africa', Ghana: 'Africa',
  Kenya: 'Africa', Ethiopia: 'Africa', Tanzania: 'Africa', 'DR Congo': 'Africa',
  'South Africa': 'Africa', Senegal: 'Africa',
  Israel: 'Asia', Lebanon: 'Asia', Jordan: 'Asia', 'Saudi Arabia': 'Asia',
  'United Arab Emirates': 'Asia', Qatar: 'Asia', Iran: 'Asia', Iraq: 'Asia',
  Uzbekistan: 'Asia', Kazakhstan: 'Asia', India: 'Asia', Pakistan: 'Asia',
  Bangladesh: 'Asia', Nepal: 'Asia', 'Sri Lanka': 'Asia', Thailand: 'Asia',
  Vietnam: 'Asia', Singapore: 'Asia', Malaysia: 'Asia', Indonesia: 'Asia',
  Philippines: 'Asia', Cambodia: 'Asia', Japan: 'Asia', 'South Korea': 'Asia',
  China: 'Asia', Taiwan: 'Asia', Mongolia: 'Asia',
  Australia: 'Oceania', 'New Zealand': 'Oceania', Fiji: 'Oceania',
  'Puerto Rico': 'North America',
  Guatemala: 'North America',
  'El Salvador': 'North America',
  Nicaragua: 'North America',
  Jamaica: 'North America',
  'Dominican Republic': 'North America',
  Bahamas: 'North America',
  Paraguay: 'South America',
  Croatia: 'Europe',
  Slovenia: 'Europe',
  Slovakia: 'Europe',
  Bulgaria: 'Europe',
  Estonia: 'Europe',
  Latvia: 'Europe',
  Lithuania: 'Europe',
  Malta: 'Europe',
  Cyprus: 'Asia',
  Luxembourg: 'Europe',
  Monaco: 'Europe',
  Algeria: 'Africa',
  Libya: 'Africa',
  Sudan: 'Africa',
  Uganda: 'Africa',
  Rwanda: 'Africa',
  Angola: 'Africa',
  Zimbabwe: 'Africa',
  Zambia: 'Africa',
  Mozambique: 'Africa',
  'Ivory Coast': 'Africa',
  Mali: 'Africa',
  Cameroon: 'Africa',
  Kuwait: 'Asia',
  Bahrain: 'Asia',
  Oman: 'Asia',
  Syria: 'Asia',
  Afghanistan: 'Asia',
  Georgia: 'Asia',
  Armenia: 'Asia',
  Azerbaijan: 'Asia',
  Turkmenistan: 'Asia',
  Kyrgyzstan: 'Asia',
  Maldives: 'Asia',
  Myanmar: 'Asia',
  Laos: 'Asia',
  'Papua New Guinea': 'Oceania',
  'New Caledonia': 'Oceania',
  'French Polynesia': 'Oceania',
};
export function continentOf(city) {
  return (city && CONTINENT[city.country]) || 'Asia';
}

// ── Geo helpers ────────────────────────────────────────────────────────────
const R_MI = 3958.8; // mean Earth radius, miles
const toRad = (d) => (d * Math.PI) / 180;
const toDeg = (r) => (r * 180) / Math.PI;

// Great-circle (haversine) distance in miles between two {lat,lng} points,
// rounded to the nearest mile.
export function haversineMiles(a, b) {
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const la1 = toRad(a.lat);
  const la2 = toRad(b.lat);
  const x =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(la1) * Math.cos(la2) * Math.sin(dLng / 2) ** 2;
  return Math.round(2 * R_MI * Math.asin(Math.min(1, Math.sqrt(x))));
}

// Initial compass bearing in degrees (0..360, 0 = due north, clockwise) from
// point `a` toward point `b`. Used to point the guess arrow at the secret city.
export function bearingDeg(a, b) {
  const la1 = toRad(a.lat);
  const la2 = toRad(b.lat);
  const dLng = toRad(b.lng - a.lng);
  const y = Math.sin(dLng) * Math.cos(la2);
  const x =
    Math.cos(la1) * Math.sin(la2) -
    Math.sin(la1) * Math.cos(la2) * Math.cos(dLng);
  return (toDeg(Math.atan2(y, x)) + 360) % 360;
}

const COMPASS8 = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
// Nearest 8-point compass label for a bearing in degrees.
export function compass8(deg) {
  return COMPASS8[Math.round(deg / 45) % 8];
}

// Normalize a typed query for matching: lowercase, strip accents + punctuation,
// collapse whitespace. "São Paulo" -> "sao paulo", "St. Petersburg" -> "st petersburg".
export function normCity(s) {
  return String(s || '')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

// Resolve a typed guess to a city record (exact name/alias match after
// normalization), or null if it is not a known city.
export function findCity(query) {
  const q = normCity(query);
  if (!q) return null;
  for (const c of CITIES) {
    if (normCity(c.name) === q) return c;
    if (c.aliases && c.aliases.some((a) => normCity(a) === q)) return c;
  }
  return null;
}

// Country names players are likely to type in a form the atlas does not use.
// Keyed by the exact `country` string on a city record.
const COUNTRY_ALIASES = {
  'United States': ['usa', 'us', 'united states of america', 'america'],
  'United Kingdom': ['uk', 'britain', 'great britain', 'england', 'scotland'],
  'United Arab Emirates': ['uae', 'emirates'],
  Netherlands: ['holland'],
  Czechia: ['czech republic'],
  'South Korea': ['korea', 'republic of korea'],
  Turkey: ['turkiye'],
  Myanmar: ['burma'],
  'DR Congo': ['congo', 'democratic republic of the congo', 'drc'],
  'Ivory Coast': ['cote divoire'],
  Russia: ['russian federation'],
  Vietnam: ['viet nam'],
};

// Normalized search terms for a country: its own name plus any aliases.
function countryTerms(country) {
  return [normCity(country), ...(COUNTRY_ALIASES[country] || []).map(normCity)];
}

// Up to `limit` cities for the autocomplete dropdown, in four tiers:
// city name/alias prefix, COUNTRY prefix, city name/alias substring, country
// substring. A country prefix outranks a city substring because typing a whole
// country name is a deliberate signal ("japan" wants Japanese cities), while a
// mid-word substring hit is incidental. Empty query returns nothing.
export function suggestCities(query, limit = 6) {
  const q = normCity(query);
  if (!q) return [];
  const nameStarts = [];
  const countryStarts = [];
  const nameHas = [];
  const countryHas = [];
  for (const c of CITIES) {
    const hay = [normCity(c.name), ...(c.aliases || []).map(normCity)];
    const ctry = countryTerms(c.country);
    if (hay.some((x) => x.startsWith(q))) nameStarts.push(c);
    else if (ctry.some((x) => x.startsWith(q))) countryStarts.push(c);
    else if (hay.some((x) => x.includes(q))) nameHas.push(c);
    else if (ctry.some((x) => x.includes(q))) countryHas.push(c);
  }
  return [...nameStarts, ...countryStarts, ...nameHas, ...countryHas].slice(0, limit);
}

// Every city in the country the query names EXACTLY (name or alias), or [] if
// the query is not a country. Lets the client accept a typed country that holds
// only one city in the atlas ("iceland" -> Reykjavik) instead of demanding a
// pick from the list.
export function citiesInCountry(query) {
  const q = normCity(query);
  if (!q) return [];
  return CITIES.filter((c) => countryTerms(c.country).includes(q));
}
