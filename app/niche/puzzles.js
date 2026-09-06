// Puzzle data for Niche, the daily trivia grid. Imported ONLY by the server
// page (app/niche/page.js), which filters live<=today before handing puzzles
// to the client, so future boards never reach a browser.
//
// A board is three row attributes and three column attributes (four each on
// the Sunday Edition) from one universe in app/niche/facts.js; the ids here
// resolve against that file's attribute registry, which is also what the
// client judges picks by. The universe follows the day of the week: Sunday
// Countries (the 4x4 Edition), Monday US States, Tuesday Animals, Wednesday
// Movies, Thursday TV Shows, Friday Pro Sports Teams, Saturday Musicians.
//
// EVERY board is proven before banking: each cell holds at least 3 valid
// answers (a floor, not a target: most cells hold far more), the whole board
// admits a full set of DISTINCT answers, at least one cell is tight, meaning
// 8 or fewer answers (two such cells on Sunday), no more than 2 letter-fill
// attributes appear on a board, at most 2 attributes carry over from that
// universe's previous board, no board shares more than 4 attributes with ANY
// earlier board of its universe, no two attributes on a board are exact
// complements of each other (boards from 2026-10-05 on; #17 predates the
// rule), and no attribute appears more than 4 times per universe across the
// whole bank. That last cap is an ABSOLUTE, not a rate, so it is what sets
// the floor under the attribute pool in app/niche/facts.js: when the
// generator runs out of boards, grow that pool, never raise the cap.
//
// Do NOT hand-edit a board here. Regenerate with scripts/gen-niche.mjs and
// re-run scripts/verify-niche.mjs.
export const PUZZLES = [
  {"num":1,"quizId":"niche-8-20-26","live":"2026-08-20","dateLabel":"August 20, 2026","sunday":false,"universe":"tv","rows":["nyc","emmy","n-h"],"cols":["one","dec-10s","str"]},
  {"num":2,"quizId":"niche-8-21-26","live":"2026-08-21","dateLabel":"August 21, 2026","sunday":false,"universe":"teams","rows":["lg-nfl","animal","lg-nba"],"cols":["champ","old","ca"]},
  {"num":3,"quizId":"niche-8-22-26","live":"2026-08-22","dateLabel":"August 22, 2026","sunday":false,"universe":"musicians","rows":["us","aoty","band"],"cols":["n-s","one","hall"]},
  {"num":4,"quizId":"niche-8-23-26","live":"2026-08-23","dateLabel":"August 23, 2026","sunday":true,"universe":"countries","rows":["ll","oly","eu","cont-eu"],"cols":["b-france","b-germany","b5","cap-b"]},
  {"num":5,"quizId":"niche-8-24-26","live":"2026-08-24","dateLabel":"August 24, 2026","sunday":false,"universe":"states","rows":["cap-s","can","dbl"],"cols":["pop5","inland","west"]},
  {"num":6,"quizId":"niche-8-25-26","live":"2026-08-25","dateLabel":"August 25, 2026","sunday":false,"universe":"animals","rows":["sea","dom","fly"],"cols":["eggs","hunt","afr"]},
  {"num":7,"quizId":"niche-8-26-26","live":"2026-08-26","dateLabel":"August 26, 2026","sunday":false,"universe":"movies","rows":["dec-90s","one","dec-20s"],"cols":["fr","bp","r"]},
  {"num":8,"quizId":"niche-8-27-26","live":"2026-08-27","dateLabel":"August 27, 2026","sunday":false,"universe":"tv","rows":["ten","n-s","nyc"],"cols":["emmy","dec-90s","dec-00s"]},
  {"num":9,"quizId":"niche-8-28-26","live":"2026-08-28","dateLabel":"August 28, 2026","sunday":false,"universe":"teams","rows":["n-t","lg-mlb","n-s"],"cols":["animal","champ","city2"]},
  {"num":10,"quizId":"niche-8-29-26","live":"2026-08-29","dateLabel":"August 29, 2026","sunday":false,"universe":"musicians","rows":["solo","n-b","n-d"],"cols":["uk","fem","hall"]},
  {"num":11,"quizId":"niche-8-30-26","live":"2026-08-30","dateLabel":"August 30, 2026","sunday":true,"universe":"countries","rows":["n-m","isl","cap-p","ll"],"cols":["cont-as","cont-eu","cont-af","tiny"]},
  {"num":12,"quizId":"niche-8-31-26","live":"2026-08-31","dateLabel":"August 31, 2026","sunday":false,"universe":"states","rows":["dbl","pop2","multi"],"cols":["west","oc","col"]},
  {"num":13,"quizId":"niche-9-1-26","live":"2026-09-01","dateLabel":"September 1, 2026","sunday":false,"universe":"animals","rows":["bird","legs4","aqua"],"cols":["n-c","dom","hunt"]},
  {"num":14,"quizId":"niche-9-2-26","live":"2026-09-02","dateLabel":"September 2, 2026","sunday":false,"universe":"movies","rows":["n-b","n-c","bil"],"cols":["fr","dec-00s","dec-10s"]},
  {"num":15,"quizId":"niche-9-3-26","live":"2026-09-03","dateLabel":"September 3, 2026","sunday":false,"universe":"tv","rows":["dec-old","dec-20s","dec-10s"],"cols":["one","n-s","emmy"]},
  {"num":16,"quizId":"niche-9-4-26","live":"2026-09-04","dateLabel":"September 4, 2026","sunday":false,"universe":"teams","rows":["city2","nos","old"],"cols":["champ","lg-nba","lg-nhl"]},
  {"num":17,"quizId":"niche-9-5-26","live":"2026-09-05","dateLabel":"September 5, 2026","sunday":false,"universe":"musicians","rows":["n-n","n-a","us"],"cols":["one","band","solo"]},
  {"num":18,"quizId":"niche-9-6-26","live":"2026-09-06","dateLabel":"September 6, 2026","sunday":true,"universe":"countries","rows":["cont-af","oly","isl","b5"],"cols":["cap-m","pop100","multi","n-s"]},
  {"num":19,"quizId":"niche-9-7-26","live":"2026-09-07","dateLabel":"September 7, 2026","sunday":false,"universe":"states","rows":["endsa","y1700s","inland"],"cols":["pop2","pop5","can"]},
  {"num":20,"quizId":"niche-9-8-26","live":"2026-09-08","dateLabel":"September 8, 2026","sunday":false,"universe":"animals","rows":["afr","eggs","legs4"],"cols":["n-a","n-g","aqua"]},
  {"num":21,"quizId":"niche-9-9-26","live":"2026-09-09","dateLabel":"September 9, 2026","sunday":false,"universe":"movies","rows":["n-t","n-s","dec-00s"],"cols":["ani","fr","r"]},
  {"num":22,"quizId":"niche-9-10-26","live":"2026-09-10","dateLabel":"September 10, 2026","sunday":false,"universe":"tv","rows":["dec-90s","dec-old","dec-00s"],"cols":["one","nyc","ten"]},
  {"num":23,"quizId":"niche-9-11-26","live":"2026-09-11","dateLabel":"September 11, 2026","sunday":false,"universe":"teams","rows":["old","n-m","ca"],"cols":["lg-mlb","animal","lg-nba"]},
  {"num":24,"quizId":"niche-9-12-26","live":"2026-09-12","dateLabel":"September 12, 2026","sunday":false,"universe":"musicians","rows":["n-k","aoty","n-b"],"cols":["solo","fem","us"]},
  {"num":25,"quizId":"niche-9-13-26","live":"2026-09-13","dateLabel":"September 13, 2026","sunday":true,"universe":"countries","rows":["eu","tiny","cont-as","south"],"cols":["isl","cap-b","ll","n-s"]},
  {"num":26,"quizId":"niche-9-14-26","live":"2026-09-14","dateLabel":"September 14, 2026","sunday":false,"universe":"states","rows":["col","lakes","riv"],"cols":["endsa","pop5","dbl"]},
  {"num":27,"quizId":"niche-9-15-26","live":"2026-09-15","dateLabel":"September 15, 2026","sunday":false,"universe":"animals","rows":["bug","n-c","dom"],"cols":["fly","eggs","hunt"]},
  {"num":28,"quizId":"niche-9-16-26","live":"2026-09-16","dateLabel":"September 16, 2026","sunday":false,"universe":"movies","rows":["dec-10s","n-m","n-d"],"cols":["one","fr","r"]},
  {"num":29,"quizId":"niche-9-17-26","live":"2026-09-17","dateLabel":"September 17, 2026","sunday":false,"universe":"tv","rows":["dec-90s","dec-20s","str"],"cols":["emmy","one","n-s"]},
  {"num":30,"quizId":"niche-9-18-26","live":"2026-09-18","dateLabel":"September 18, 2026","sunday":false,"universe":"teams","rows":["n-t","fl","ca"],"cols":["animal","city2","champ"]},
  {"num":31,"quizId":"niche-9-19-26","live":"2026-09-19","dateLabel":"September 19, 2026","sunday":false,"universe":"musicians","rows":["uk","band","aoty"],"cols":["one","hall","n-b"]},
  {"num":32,"quizId":"niche-9-20-26","live":"2026-09-20","dateLabel":"September 20, 2026","sunday":true,"universe":"countries","rows":["n-c","b-russia","cap-s","hasz"],"cols":["ll","b5","cont-as","cont-eu"]},
  {"num":33,"quizId":"niche-9-21-26","live":"2026-09-21","dateLabel":"September 21, 2026","sunday":false,"universe":"states","rows":["n-m","endsa","inland"],"cols":["can","west","pop5"]},
  {"num":34,"quizId":"niche-9-22-26","live":"2026-09-22","dateLabel":"September 22, 2026","sunday":false,"universe":"animals","rows":["dom","afr","n-w"],"cols":["hunt","big","legs4"]},
  {"num":35,"quizId":"niche-9-23-26","live":"2026-09-23","dateLabel":"September 23, 2026","sunday":false,"universe":"movies","rows":["dec-old","dec-90s","r"],"cols":["one","bp","n-g"]},
  {"num":36,"quizId":"niche-9-24-26","live":"2026-09-24","dateLabel":"September 24, 2026","sunday":false,"universe":"tv","rows":["str","dec-00s","ten"],"cols":["nyc","n-s","n-b"]},
  {"num":37,"quizId":"niche-9-25-26","live":"2026-09-25","dateLabel":"September 25, 2026","sunday":false,"universe":"teams","rows":["n-s","lg-nba","old"],"cols":["allit","ca","city2"]},
  {"num":38,"quizId":"niche-9-26-26","live":"2026-09-26","dateLabel":"September 26, 2026","sunday":false,"universe":"musicians","rows":["fem","n-c","n-r"],"cols":["one","hall","us"]},
  {"num":39,"quizId":"niche-9-27-26","live":"2026-09-27","dateLabel":"September 27, 2026","sunday":true,"universe":"countries","rows":["n-s","oly","multi","cap-b"],"cols":["isl","cont-eu","cont-na","cont-as"]},
  {"num":40,"quizId":"niche-9-28-26","live":"2026-09-28","dateLabel":"September 28, 2026","sunday":false,"universe":"states","rows":["col","n-n","y1700s"],"cols":["can","oc","endsa"]},
  {"num":41,"quizId":"niche-9-29-26","live":"2026-09-29","dateLabel":"September 29, 2026","sunday":false,"universe":"animals","rows":["eggs","aqua","n-p"],"cols":["fly","big","legs4"]},
  {"num":42,"quizId":"niche-9-30-26","live":"2026-09-30","dateLabel":"September 30, 2026","sunday":false,"universe":"movies","rows":["bp","bil","ani"],"cols":["dec-00s","one","dec-10s"]},
  {"num":43,"quizId":"niche-10-1-26","live":"2026-10-01","dateLabel":"October 1, 2026","sunday":false,"universe":"tv","rows":["dec-00s","dec-old","net"],"cols":["ten","the","n-m"]},
  {"num":44,"quizId":"niche-10-2-26","live":"2026-10-02","dateLabel":"October 2, 2026","sunday":false,"universe":"teams","rows":["allit","n-n","ny"],"cols":["et","lg-nfl","lg-nhl"]},
  {"num":45,"quizId":"niche-10-3-26","live":"2026-10-03","dateLabel":"October 3, 2026","sunday":false,"universe":"musicians","rows":["intl","n-d","uk"],"cols":["solo","fem","band"]},
  {"num":46,"quizId":"niche-10-4-26","live":"2026-10-04","dateLabel":"October 4, 2026","sunday":true,"universe":"countries","rows":["n-b","pop100","cont-af","n-a"],"cols":["endsa","cap2","south","b5"]},
  {"num":47,"quizId":"niche-10-5-26","live":"2026-10-05","dateLabel":"October 5, 2026","sunday":false,"universe":"states","rows":["cap2","nfl","riv"],"cols":["pres","west","inland"]},
  {"num":48,"quizId":"niche-10-6-26","live":"2026-10-06","dateLabel":"October 6, 2026","sunday":false,"universe":"animals","rows":["bird","n-m","n-a"],"cols":["mb","wild","afr"]},
  {"num":49,"quizId":"niche-10-7-26","live":"2026-10-07","dateLabel":"October 7, 2026","sunday":false,"universe":"movies","rows":["c20","dec-00s","num"],"cols":["notr","w2","ani"]},
  {"num":50,"quizId":"niche-10-8-26","live":"2026-10-08","dateLabel":"October 8, 2026","sunday":false,"universe":"tv","rows":["multi","n-o","num"],"cols":["c21","w3","short"]},
  {"num":51,"quizId":"niche-10-9-26","live":"2026-10-09","dateLabel":"October 9, 2026","sunday":false,"universe":"teams","rows":["noanimal","fl","lg-nfl"],"cols":["newfr","nochamp","city1"]},
  {"num":52,"quizId":"niche-10-10-26","live":"2026-10-10","dateLabel":"October 10, 2026","sunday":false,"universe":"musicians","rows":["n-t","halftime","nohall"],"cols":["multi","norap","noaoty"]},
  {"num":53,"quizId":"niche-10-11-26","live":"2026-10-11","dateLabel":"October 11, 2026","sunday":true,"universe":"countries","rows":["nato","n-n","cap-k","cap2"],"cols":["north","coastal","mon","endsa"]},
  {"num":54,"quizId":"niche-10-12-26","live":"2026-10-12","dateLabel":"October 12, 2026","sunday":false,"universe":"states","rows":["y1800s","vowel","east"],"cols":["nfl","caplg","oc"]},
  {"num":55,"quizId":"niche-10-13-26","live":"2026-10-13","dateLabel":"October 13, 2026","sunday":false,"universe":"animals","rows":["invert","wild","n-t"],"cols":["nofly","nohunt","land"]},
  {"num":56,"quizId":"niche-10-14-26","live":"2026-10-14","dateLabel":"October 14, 2026","sunday":false,"universe":"movies","rows":["dec-old","vowel","c21"],"cols":["w4","w2","the"]},
  {"num":57,"quizId":"niche-10-15-26","live":"2026-10-15","dateLabel":"October 15, 2026","sunday":false,"universe":"tv","rows":["multi","dec-10s","dec-20s"],"cols":["w3","nobook","cable"]},
  {"num":58,"quizId":"niche-10-16-26","live":"2026-10-16","dateLabel":"October 16, 2026","sunday":false,"universe":"teams","rows":["nochamp","n-c","n-m"],"cols":["ct","reg-mw","et"]},
  {"num":59,"quizId":"niche-10-17-26","live":"2026-10-17","dateLabel":"October 17, 2026","sunday":false,"universe":"musicians","rows":["n-r","male","n-a"],"cols":["nonus","multi","nonuk"]},
  {"num":60,"quizId":"niche-10-18-26","live":"2026-10-18","dateLabel":"October 18, 2026","sunday":true,"universe":"countries","rows":["oecd","n-s","south","cap-m"],"cols":["cw","mon","coastal","lang-fr"]},
  {"num":61,"quizId":"niche-10-19-26","live":"2026-10-19","dateLabel":"October 19, 2026","sunday":false,"universe":"states","rows":["park","caplg","mlb"],"cols":["atl","a10","reg-w"]},
  {"num":62,"quizId":"niche-10-20-26","live":"2026-10-20","dateLabel":"October 20, 2026","sunday":false,"universe":"animals","rows":["big","n-g","nofly"],"cols":["mb","wild","mammal"]},
  {"num":63,"quizId":"niche-10-21-26","live":"2026-10-21","dateLabel":"October 21, 2026","sunday":false,"universe":"movies","rows":["notr","n-t","w3"],"cols":["bil","dec-90s","num"]},
  {"num":64,"quizId":"niche-10-22-26","live":"2026-10-22","dateLabel":"October 22, 2026","sunday":false,"universe":"tv","rows":["cable","n-h","c21"],"cols":["dec-10s","noemmy","short"]},
  {"num":65,"quizId":"niche-10-23-26","live":"2026-10-23","dateLabel":"October 23, 2026","sunday":false,"universe":"teams","rows":["fl","bird","tx"],"cols":["newfr","reg-s","city1"]},
  {"num":66,"quizId":"niche-10-24-26","live":"2026-10-24","dateLabel":"October 24, 2026","sunday":false,"universe":"musicians","rows":["halftime","uk","n-j"],"cols":["male","nohall","multi"]},
  {"num":67,"quizId":"niche-10-25-26","live":"2026-10-25","dateLabel":"October 25, 2026","sunday":true,"universe":"countries","rows":["opec","cap-l","oly","eq"],"cols":["endsa","north","lang-fr","coastal"]},
  {"num":68,"quizId":"niche-10-26-26","live":"2026-10-26","dateLabel":"October 26, 2026","sunday":false,"universe":"states","rows":["riv","y1800s","nfl"],"cols":["pres","mlb","lakes"]},
  {"num":69,"quizId":"niche-10-27-26","live":"2026-10-27","dateLabel":"October 27, 2026","sunday":false,"universe":"animals","rows":["n-t","bird","vowel"],"cols":["mb","nohunt","land"]},
  {"num":70,"quizId":"niche-10-28-26","live":"2026-10-28","dateLabel":"October 28, 2026","sunday":false,"universe":"movies","rows":["dec-70s","n-d","notr"],"cols":["c20","nofr","w2"]},
  {"num":71,"quizId":"niche-10-29-26","live":"2026-10-29","dateLabel":"October 29, 2026","sunday":false,"universe":"tv","rows":["ani","cable","dec-90s"],"cols":["noemmy","c20","cablestr"]},
  {"num":72,"quizId":"niche-10-30-26","live":"2026-10-30","dateLabel":"October 30, 2026","sunday":false,"universe":"teams","rows":["fl","nochamp","ny"],"cols":["newfr","noanimal","et"]},
  {"num":73,"quizId":"niche-10-31-26","live":"2026-10-31","dateLabel":"October 31, 2026","sunday":false,"universe":"musicians","rows":["intl","n-m","n-p"],"cols":["noaoty","norap","male"]},
  {"num":74,"quizId":"niche-11-1-26","live":"2026-11-01","dateLabel":"November 1, 2026","sunday":true,"universe":"countries","rows":["eu","endsa","oecd","north"],"cols":["cap-b","n-c","nato","euro"]},
  {"num":75,"quizId":"niche-11-2-26","live":"2026-11-02","dateLabel":"November 2, 2026","sunday":false,"universe":"states","rows":["a10","n-n","reg-mw"],"cols":["nfl","y1800s","park"]},
  {"num":76,"quizId":"niche-11-3-26","live":"2026-11-03","dateLabel":"November 3, 2026","sunday":false,"universe":"animals","rows":["fish","sea","rept"],"cols":["nohunt","nofly","wild"]},
  {"num":77,"quizId":"niche-11-4-26","live":"2026-11-04","dateLabel":"November 4, 2026","sunday":false,"universe":"movies","rows":["dec-90s","colon","num"],"cols":["w3","c20","w2"]},
  {"num":78,"quizId":"niche-11-5-26","live":"2026-11-05","dateLabel":"November 5, 2026","sunday":false,"universe":"tv","rows":["w3","short","dec-old"],"cols":["n-m","c20","dbl"]},
  {"num":79,"quizId":"niche-11-6-26","live":"2026-11-06","dateLabel":"November 6, 2026","sunday":false,"universe":"teams","rows":["lg-mlb","newfr","city1"],"cols":["reg-s","vowel","reg-w"]},
  {"num":80,"quizId":"niche-11-7-26","live":"2026-11-07","dateLabel":"November 7, 2026","sunday":false,"universe":"musicians","rows":["nohall","nonus","intl"],"cols":["nonuk","n-s","n-b"]},
  {"num":81,"quizId":"niche-11-8-26","live":"2026-11-08","dateLabel":"November 8, 2026","sunday":true,"universe":"countries","rows":["n-b","mon","north","cap2"],"cols":["cont-af","cont-na","cw","coastal"]},
  {"num":82,"quizId":"niche-11-9-26","live":"2026-11-09","dateLabel":"November 9, 2026","sunday":false,"universe":"states","rows":["caplg","y1800s","atl"],"cols":["mlb","park","east"]},
  {"num":83,"quizId":"niche-11-10-26","live":"2026-11-10","dateLabel":"November 10, 2026","sunday":false,"universe":"animals","rows":["big","land","bug"],"cols":["nofly","nohunt","dbl"]},
  {"num":84,"quizId":"niche-11-11-26","live":"2026-11-11","dateLabel":"November 11, 2026","sunday":false,"universe":"movies","rows":["dec-80s","dec-20s","n-s"],"cols":["notr","bp","nofr"]},
  {"num":85,"quizId":"niche-11-12-26","live":"2026-11-12","dateLabel":"November 12, 2026","sunday":false,"universe":"tv","rows":["w3","cablestr","str"],"cols":["dec-20s","noemmy","short"]},
  {"num":86,"quizId":"niche-11-13-26","live":"2026-11-13","dateLabel":"November 13, 2026","sunday":false,"universe":"teams","rows":["nos","reg-s","can"],"cols":["noanimal","et","lg-nhl"]},
  {"num":87,"quizId":"niche-11-14-26","live":"2026-11-14","dateLabel":"November 14, 2026","sunday":false,"universe":"musicians","rows":["num","ctry","n-a"],"cols":["nohall","multi","norap"]},
  {"num":88,"quizId":"niche-11-15-26","live":"2026-11-15","dateLabel":"November 15, 2026","sunday":true,"universe":"countries","rows":["g20","cap-a","lang-fr","b1"],"cols":["oecd","mon","south","nato"]},
  {"num":89,"quizId":"niche-11-16-26","live":"2026-11-16","dateLabel":"November 16, 2026","sunday":false,"universe":"states","rows":["park","mlb","oc"],"cols":["y1700s","pres","reg-w"]},
  {"num":90,"quizId":"niche-11-17-26","live":"2026-11-17","dateLabel":"November 17, 2026","sunday":false,"universe":"animals","rows":["bird","mb","sea"],"cols":["aqua","n-c","n-s"]},
  {"num":91,"quizId":"niche-11-18-26","live":"2026-11-18","dateLabel":"November 18, 2026","sunday":false,"universe":"movies","rows":["nofr","c21","ani"],"cols":["num","dec-10s","dec-20s"]},
  {"num":92,"quizId":"niche-11-19-26","live":"2026-11-19","dateLabel":"November 19, 2026","sunday":false,"universe":"tv","rows":["c20","cablestr","noemmy"],"cols":["n-w","n-m","multi"]},
  {"num":93,"quizId":"niche-11-20-26","live":"2026-11-20","dateLabel":"November 20, 2026","sunday":false,"universe":"teams","rows":["bird","n-a","noanimal"],"cols":["nochamp","lg-mlb","reg-s"]},
  {"num":94,"quizId":"niche-11-21-26","live":"2026-11-21","dateLabel":"November 21, 2026","sunday":false,"universe":"musicians","rows":["male","bna","n-s"],"cols":["nonus","roty","aoty"]},
  {"num":95,"quizId":"niche-11-22-26","live":"2026-11-22","dateLabel":"November 22, 2026","sunday":true,"universe":"countries","rows":["cap-m","vowel","cont-na","cap2"],"cols":["lang-es","b0","tiny","cw"]},
  {"num":96,"quizId":"niche-11-23-26","live":"2026-11-23","dateLabel":"November 23, 2026","sunday":false,"universe":"states","rows":["east","caplg","pres"],"cols":["atl","reg-mw","s10"]},
  {"num":97,"quizId":"niche-11-24-26","live":"2026-11-24","dateLabel":"November 24, 2026","sunday":false,"universe":"animals","rows":["n-a","vowel","mammal"],"cols":["land","dbl","noeggs"]},
  {"num":98,"quizId":"niche-11-25-26","live":"2026-11-25","dateLabel":"November 25, 2026","sunday":false,"universe":"movies","rows":["w4","n-s","w3"],"cols":["dec-80s","nofr","dec-20s"]},
  {"num":99,"quizId":"niche-11-26-26","live":"2026-11-26","dateLabel":"November 26, 2026","sunday":false,"universe":"tv","rows":["y2010","vowel","book"],"cols":["cable","cablestr","c21"]},
  {"num":100,"quizId":"niche-11-27-26","live":"2026-11-27","dateLabel":"November 27, 2026","sunday":false,"universe":"teams","rows":["lg-nfl","city1","n-b"],"cols":["ny","dbl","reg-ne"]},
  {"num":101,"quizId":"niche-11-28-26","live":"2026-11-28","dateLabel":"November 28, 2026","sunday":false,"universe":"musicians","rows":["n-c","num","n-k"],"cols":["noaoty","nonuk","norap"]},
  {"num":102,"quizId":"niche-11-29-26","live":"2026-11-29","dateLabel":"November 29, 2026","sunday":true,"universe":"countries","rows":["oecd","euro","nato","g20"],"cols":["vowel","b1","eu","wc"]},
  {"num":103,"quizId":"niche-11-30-26","live":"2026-11-30","dateLabel":"November 30, 2026","sunday":false,"universe":"states","rows":["pop2","y1700s","atl"],"cols":["east","col","reg-ne"]},
];
